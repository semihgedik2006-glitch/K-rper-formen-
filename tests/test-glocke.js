/* ── Die Glocke: Meldungen über Erledigtes ────────────────────────────
   Der Chef soll sehen, wenn in einem seiner Studios etwas abgehakt
   wurde — ohne selbst nachzuschauen.

   Was hier geprüft wird, und warum jedes Stück:

     1. Beim Start ist die Zahl LEER, obwohl in den Attrappen bereits
        erledigte Punkte liegen (t2 „Handtücher waschen", c1 „Böden
        wischen"). Ohne das würde beim Anmelden die halbe Woche als
        „gerade passiert" hereinbrechen.
     2. Wird danach etwas abgehakt, steht die Zahl auf 1 und die Zeile
        in der Liste — für Aufgaben UND für den Putzplan.
     3. Aufmachen heißt gelesen: die Zahl ist danach weg.
     4. Gegenprobe A — was ich SELBST abhake, meldet mir niemand.
        (doneByUid === eigene uid)
     5. Gegenprobe B — der Mitarbeiter hat die Glocke gar nicht, und
        auch nach einer Erledigung erscheint bei ihm nichts.
     6. Gegenprobe C — die Attrappe muss den zweiten Schnappschuss
        wirklich ausliefern. __nachschub gibt die Zahl der bedienten
        Zuhörer zurück; 0 hieße, der Pfad stimmt nicht und der ganze
        Durchlauf misst nichts. Genau diese Sorte Grün ist wertlos.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const PFAD_T = 'studios/studio-6/todos';
const PFAD_C = 'studios/studio-6/cleaning';

async function start(rolle) {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 900 } });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) {
      errs.push('CONSOLE: ' + m.text().slice(0, 160));
    }
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-' + rolle + '.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  /* Erst prüfen, ob die App überhaupt hochgekommen ist.

     Beim Bau dieses Durchlaufs fehlte in index.html eine einzige Zeile —
     der Kopf von localNotify() war beim Einfügen des Blocks darüber
     verlorengegangen. Die Folge war ein Syntaxfehler; die App startete
     gar nicht. Der Durchlauf klickte daraufhin auf eine Glocke, die es
     nie geben würde, und lief 240 Sekunden in den Zeitablauf, ohne einen
     einzigen Satz auszugeben. Vier Minuten Warten für die Auskunft
     „nichts". Diese drei Zeilen sagen stattdessen, was los ist. */
  const gestartet = await page.evaluate(() =>
    !!document.querySelector('#app.show'));
  if (!gestartet) {
    await b.close();
    throw new Error('Die App ist gar nicht gestartet. ' +
      (errs.length ? errs.join(' | ') : 'keine Fehlermeldung im Browser'));
  }
  return { b, page, errs };
}

/* Sichtbarkeit über getClientRects(): getComputedStyle().display sieht
   einen VERSTECKTEN VORFAHREN nicht, und genau daran hat test-drucken
   schon einmal drei falsche Funde gemeldet. */
const STAND = () => ({
  knopf: !!document.getElementById('tbGlocke') &&
         document.getElementById('tbGlocke').getClientRects().length > 0,
  zahl: (() => {
    const z = document.querySelector('#tbGlocke .gl-zahl');
    return z && z.getClientRects().length ? z.textContent.trim() : '';
  })(),
  modalAuf: !!document.querySelector('#glockeModal.show'),
  zeilen: [...document.querySelectorAll('#glockeListe .gl-zeile')]
            .map(z => z.textContent.replace(/\s+/g, ' ').trim()),
  toast: (() => {
    const t = document.getElementById('toast');
    return t && t.getClientRects().length ? t.textContent.trim() : '';
  })()
});

async function lauf() {
  const fehler = [];

  // ── Chef ───────────────────────────────────────────────────────────
  {
    const { b, page, errs } = await start('chef');

    const vorher = await page.evaluate(STAND);
    if (!vorher.knopf) fehler.push('Chef: Glocke fehlt in der Kopfzeile');
    if (vorher.zahl) fehler.push('Chef: Zahl steht schon beim Start auf "' + vorher.zahl +
      '" — der erste Schnappschuss darf nichts melden');

    // 2a) Eine Aufgabe wird von jemand anderem abgehakt
    const bedient = await page.evaluate(p => window.__nachschub(p, [
      { id: 't1', title: 'Geräte desinfizieren', done: true, doneBy: 'Anna Meier',
        doneByUid: 'u2', doneAt: Date.now(), createdBy: 'Chef', ts: Date.now() - 90000000 }
    ]), PFAD_T);
    if (!bedient) fehler.push('Attrappe: __nachschub("' + PFAD_T +
      '") hat 0 Zuhörer bedient — der Durchlauf misst nichts');
    await page.waitForTimeout(400);

    const nachTodo = await page.evaluate(STAND);
    if (nachTodo.zahl !== '1') fehler.push('Aufgabe erledigt: Zahl ist "' +
      nachTodo.zahl + '" statt "1"');
    if (!/Anna Meier/.test(nachTodo.toast)) fehler.push(
      'Aufgabe erledigt: kein Toast (steht: "' + nachTodo.toast + '")');

    // 2b) Und derselbe Weg für den Putzplan
    const bedientC = await page.evaluate(p => window.__nachschub(p, [
      { id: 'c2', title: 'Spiegel putzen', recurring: 'weekly', done: true,
        doneBy: 'Ben Kraus', doneByUid: 'u3', doneAt: Date.now(), ts: Date.now() - 80000000 }
    ]), PFAD_C);
    if (!bedientC) fehler.push('Attrappe: __nachschub("' + PFAD_C + '") hat 0 Zuhörer bedient');
    await page.waitForTimeout(400);

    const nachPutz = await page.evaluate(STAND);
    if (nachPutz.zahl !== '2') fehler.push('Putzplan erledigt: Zahl ist "' +
      nachPutz.zahl + '" statt "2"');

    // 4) Gegenprobe A: selbst abgehakt meldet sich nicht
    await page.evaluate(p => window.__nachschub(p, [
      { id: 't3', title: 'Wasserspender auffüllen', done: true, doneBy: 'Test Chef',
        doneByUid: 'testuid', doneAt: Date.now(), createdBy: 'Chef', ts: Date.now() - 70000000 }
    ]), PFAD_T);
    await page.waitForTimeout(400);
    const nachSelbst = await page.evaluate(STAND);
    if (nachSelbst.zahl !== '2') fehler.push('Selbst abgehakt: Zahl ist "' +
      nachSelbst.zahl + '" statt "2" — was ich selbst tue, muss mir niemand melden');

    // 3) Aufmachen zeigt die Liste und räumt die Zahl weg
    await page.click('#tbGlocke');
    await page.waitForTimeout(500);
    const auf = await page.evaluate(STAND);
    if (!auf.modalAuf) fehler.push('Klick auf die Glocke öffnet nichts');
    if (auf.zeilen.length !== 2) fehler.push('Liste hat ' + auf.zeilen.length +
      ' Zeilen statt 2: ' + JSON.stringify(auf.zeilen));
    if (!auf.zeilen.some(z => /Anna Meier.*Geräte desinfizieren/.test(z)))
      fehler.push('Aufgaben-Zeile fehlt: ' + JSON.stringify(auf.zeilen));
    if (!auf.zeilen.some(z => /Ben Kraus.*Spiegel putzen/.test(z)))
      fehler.push('Putz-Zeile fehlt: ' + JSON.stringify(auf.zeilen));
    if (!auf.zeilen.some(z => /Hürth/.test(z)))
      fehler.push('Studio fehlt in der Zeile: ' + JSON.stringify(auf.zeilen));

    await page.waitForTimeout(400);
    const gelesen = await page.evaluate(STAND);
    if (gelesen.zahl) fehler.push('Nach dem Aufmachen steht die Zahl noch auf "' +
      gelesen.zahl + '" — aufgemacht heißt gelesen');

    // Zumachen geht wirklich zu
    await page.click('#glockeClose');
    await page.waitForTimeout(400);
    if (await page.evaluate(() => !!document.querySelector('#glockeModal.show')))
      fehler.push('Das Kreuz schließt die Glocke nicht');

    /* ── Schreibt die App überhaupt, was hier gelesen wird? ──
       Der Filter „was ich selbst abgehakt habe" hängt an `doneByUid`.
       Der Putzplan schrieb es, die Aufgaben nicht — und dieser Durchlauf
       war trotzdem grün, weil die ATTRAPPE das Feld mitbrachte. Geprüft
       war damit etwas, das die App gar nicht tat.

       Deshalb hier ein echter Klick auf ein echtes Kästchen, und
       nachgesehen wird in dem, was zur Datenbank ginge. */
    await page.evaluate(() => {
      const g = document.querySelector('.mobnav [data-group="g-arbeit"]');
      if (g) g.click();
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const s = document.querySelector('[data-subview="todos"]');
      if (s) s.click();
    });
    await page.waitForTimeout(700);
    const geklickt = await page.evaluate(() => {
      window.__schreib = [];
      const k = [...document.querySelectorAll('.todo:not(.done) > .swipe-body > .check')]
        .find(x => x.getClientRects().length);
      if (!k) return false;
      k.click();
      return true;
    });
    if (!geklickt) {
      fehler.push('Kein offenes Aufgaben-Kästchen zum Anklicken gefunden — ' +
        'dieser Abschnitt hat nichts geprüft');
    } else {
      await page.waitForTimeout(400);
      const w = await page.evaluate(() =>
        (window.__schreib || []).filter(x => /\/todos\//.test(x.pfad)));
      if (!w.length) fehler.push('Abhaken schreibt gar nichts');
      else {
        const d = w[0].daten || {};
        if (d.done !== true) fehler.push('Abhaken schreibt done=' + JSON.stringify(d.done));
        if (!d.doneByUid) fehler.push('Abhaken schreibt kein doneByUid: ' + JSON.stringify(d) +
          ' — ohne das meldet die Glocke jedem seinen eigenen Haken');
        if (!d.doneAt) fehler.push('Abhaken schreibt kein doneAt: ' + JSON.stringify(d));
      }
    }

    /* ── Der Schalter muss auch etwas tun ──
       „Erledigte Aufgaben" abschalten heißt laut Hinweistext: kein
       Toast mehr, die Glocke sammelt weiter. Ein Schalter, der nur
       umklappt, ist kein Schalter. */
    await page.click('#uAvatar');
    await page.waitForTimeout(400);
    await page.click('[data-pmtab="melden"]');
    await page.waitForTimeout(700);
    const schalter = await page.evaluate(() => ({
      melden: [...document.querySelectorAll('#notifyOpts [data-nk]')]
        .map(e => e.getAttribute('data-nk')),
      mails: [...document.querySelectorAll('#mailOpts [data-mk]')]
        .map(e => e.getAttribute('data-mk'))
    }));
    ['erledigt'].forEach(k => {
      if (schalter.melden.indexOf(k) < 0)
        fehler.push('Melde-Schalter "' + k + '" fehlt: ' + JSON.stringify(schalter.melden));
    });
    ['fertigTodos', 'fertigPutz', 'tagesbericht'].forEach(k => {
      if (schalter.mails.indexOf(k) < 0)
        fehler.push('Mail-Schalter "' + k + '" fehlt: ' + JSON.stringify(schalter.mails));
    });

    await page.click('#notifyOpts [data-nk="erledigt"]');
    await page.waitForTimeout(300);
    const aus = await page.evaluate(() =>
      document.querySelector('#notifyOpts [data-nk="erledigt"] .sw').classList.contains('on'));
    if (aus) fehler.push('Schalter "Erledigte Aufgaben" klappt nicht um');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    const vorToast = await page.evaluate(STAND);
    await page.evaluate(p => window.__nachschub(p, [
      { id: 't7', title: 'Empfang aufräumen', done: true, doneBy: 'Anna Meier',
        doneByUid: 'u2', doneAt: Date.now(), createdBy: 'Chef', ts: 1 }
    ]), PFAD_T);
    await page.waitForTimeout(500);
    const nachAus = await page.evaluate(STAND);
    if (nachAus.toast && nachAus.toast !== vorToast.toast)
      fehler.push('Schalter aus, trotzdem ein Toast: "' + nachAus.toast + '"');
    if (nachAus.zahl !== '1')
      fehler.push('Schalter aus: die Glocke zählt "' + nachAus.zahl +
        '" statt "1" — sie soll weiter sammeln');

    errs.forEach(e => fehler.push('Chef: ' + e));
    await b.close();
  }

  // ── Gegenprobe B: Mitarbeiter ──────────────────────────────────────
  {
    const { b, page, errs } = await start('mitarbeiter');
    const vorher = await page.evaluate(STAND);
    if (vorher.knopf) fehler.push('Mitarbeiter sieht die Glocke — die gehört der Leitung');

    await page.evaluate(p => window.__nachschub(p, [
      { id: 't1', title: 'Geräte desinfizieren', done: true, doneBy: 'Anna Meier',
        doneByUid: 'u2', doneAt: Date.now(), createdBy: 'Chef', ts: Date.now() - 90000000 }
    ]), PFAD_T);
    await page.waitForTimeout(500);
    const nach = await page.evaluate(STAND);
    if (nach.knopf) fehler.push('Mitarbeiter: Glocke taucht nach einer Erledigung auf');
    if (nach.zahl) fehler.push('Mitarbeiter: Zahl steht auf "' + nach.zahl + '"');
    if (/erledigt/.test(nach.toast)) fehler.push(
      'Mitarbeiter bekommt einen Toast über fremde Erledigungen: "' + nach.toast + '"');

    errs.forEach(e => fehler.push('Mitarbeiter: ' + e));
    await b.close();
  }

  console.log('Fehler:', fehler.length ? '' : 'keine');
  fehler.forEach(f => console.log('✗ ' + f));
  if (fehler.length) process.exitCode = 1;
}

lauf().catch(e => { console.log('✗ ' + e.message); process.exitCode = 1; });
