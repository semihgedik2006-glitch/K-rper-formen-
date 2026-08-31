/* ── Putzaufgabe anlegen: derselbe Weg wie bei den Aufgaben ───────────
   Vorher lagen zwei Wege für dieselbe Handlung nebeneinander:

     Aufgabe anlegen    → „+ Neu" in der Kopfzeile
     Putzaufgabe anlegen→ eine Karte GANZ UNTEN auf der Putzplan-Seite,
                          hinter der Liste und hinter den Notizen

   Geprüft wird nicht, dass irgendwo ein Knopf steht, sondern:

     1. Beide Seiten haben den Knopf an derselben Stelle — gemessen an
        seiner Lage, nicht an seinem Vorhandensein.
     2. Der Knopf öffnet wirklich etwas, und darin stehen die Felder.
     3. Das Studio, das oben im Putzplan gewählt ist, ist schon
        angekreuzt. Das ist der eigentliche Gewinn: vorher fing jedes
        Anlegen mit „Bitte mindestens ein Studio wählen" an.
     4. Anlegen schreibt wirklich, und zwar in das angekreuzte Studio.
     5. Das Fenster macht danach zu — sonst weiß niemand, ob es geklappt
        hat.
     6. Gegenprobe: ein Mitarbeiter sieht den Knopf nicht. Er darf laut
        firestore.rules keine Putzaufgaben anlegen; ihm einen Weg dorthin
        zu zeigen wäre eine Sackgasse mit Einladung.
     7. Gegenprobe: die alte Karte am Seitenfuß ist wirklich weg. Zwei
        Wege, von denen einer vergessen wird, sind schlimmer als einer.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

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
  /* Siehe test-glocke.js: erst prüfen, ob die App überhaupt hochkam.
     Sonst wartet der Durchlauf auf einen Knopf, den es nie geben wird,
     und meldet am Ende nur den Zeitablauf. */
  if (!(await page.evaluate(() => !!document.querySelector('#app.show')))) {
    await b.close();
    throw new Error('Die App ist gar nicht gestartet. ' +
      (errs.length ? errs.join(' | ') : 'keine Fehlermeldung im Browser'));
  }
  return { b, page, errs };
}

async function zurPutzplanSeite(page) {
  await page.evaluate(() => {
    const g = document.querySelector('.mobnav [data-group="g-arbeit"]');
    if (g) g.click();
  });
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    const s = document.querySelector('[data-subview="putzplan"]');
    if (s) s.click();
  });
  await page.waitForTimeout(800);
}
async function zurAufgabenSeite(page) {
  await page.evaluate(() => {
    const g = document.querySelector('.mobnav [data-group="g-arbeit"]');
    if (g) g.click();
  });
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    const s = document.querySelector('[data-subview="todos"]');
    if (s) s.click();
  });
  await page.waitForTimeout(800);
}

/* Lage statt Vorhandensein: „steht auch dort" ist die Behauptung. */
const LAGE = (id) => {
  const k = document.getElementById(id);
  if (!k || !k.getClientRects().length) return null;
  const r = k.getBoundingClientRect();
  return { oben: Math.round(r.top), rechts: Math.round(window.innerWidth - r.right) };
};

async function lauf() {
  const fehler = [];

  // ── Chef ───────────────────────────────────────────────────────────
  {
    const { b, page, errs } = await start('chef');

    await zurAufgabenSeite(page);
    const aufg = await page.evaluate(LAGE, 'todoNew');
    await zurPutzplanSeite(page);
    const putz = await page.evaluate(LAGE, 'ppNew');

    if (!putz) fehler.push('Putzplan hat keinen „+ Neu"-Knopf in der Kopfzeile');
    else if (!aufg) fehler.push('Aufgaben haben keinen „+ Neu" — Vergleich nicht möglich');
    else {
      /* Ein paar Pixel Unterschied sind Text, keine Absicht. Mehr als
         zehn hiesse: die beiden stehen nicht an derselben Stelle. */
      if (Math.abs(aufg.oben - putz.oben) > 10)
        fehler.push('„+ Neu" steht verschieden hoch: Aufgaben ' + aufg.oben +
          'px, Putzplan ' + putz.oben + 'px');
      if (Math.abs(aufg.rechts - putz.rechts) > 10)
        fehler.push('„+ Neu" hat verschiedenen Abstand rechts: Aufgaben ' +
          aufg.rechts + 'px, Putzplan ' + putz.rechts + 'px');
    }

    // 7) Die alte Karte am Seitenfuß darf es nicht mehr geben
    if (await page.evaluate(() => !!document.getElementById('ppChefCard')))
      fehler.push('Die alte Karte #ppChefCard steht noch da — zwei Wege für dieselbe Handlung');

    // 2+3) Aufmachen, Felder da, Studio vorausgewählt
    const gewaehlt = await page.evaluate(() => {
      const s = document.getElementById('ppStudio');
      return s ? s.options[s.selectedIndex].textContent.trim() : '';
    });
    await page.click('#ppNew');
    await page.waitForTimeout(700);

    const auf = await page.evaluate(() => ({
      offen: !!document.querySelector('#putzModal.show'),
      felder: ['ppTitle', 'ppStudios', 'ppRepeat', 'ppAdd']
        .filter(i => { const e = document.getElementById(i); return e && e.getClientRects().length; }),
      angekreuzt: [...document.querySelectorAll('#ppStudios input:checked')]
        .map(c => c.parentElement.textContent.trim()),
      hinweis: (document.getElementById('ppmWo') || {}).textContent || ''
    }));
    if (!auf.offen) fehler.push('„+ Neu" im Putzplan öffnet nichts');
    if (auf.felder.length !== 4)
      fehler.push('Im Fenster fehlen Felder, sichtbar sind nur: ' + JSON.stringify(auf.felder));
    if (auf.angekreuzt.length !== 1 || auf.angekreuzt[0] !== gewaehlt)
      fehler.push('Vorauswahl stimmt nicht: oben steht „' + gewaehlt +
        '", angekreuzt ist ' + JSON.stringify(auf.angekreuzt));
    if (auf.hinweis.indexOf(gewaehlt) < 0)
      fehler.push('Der Hinweis nennt das Studio nicht: „' + auf.hinweis + '"');

    // 4) Anlegen schreibt wirklich — und ins richtige Studio
    await page.evaluate(() => { window.__schreib = []; });
    await page.fill('#ppTitle', 'Fenster putzen');
    await page.click('#ppAdd');
    await page.waitForTimeout(900);

    const w = await page.evaluate(() =>
      (window.__schreib || []).filter(x => /\/cleaning\//.test(x.pfad)));
    if (!w.length) fehler.push('Anlegen schreibt nichts');
    else {
      if ((w[0].daten || {}).title !== 'Fenster putzen')
        fehler.push('Falscher Titel geschrieben: ' + JSON.stringify(w[0].daten));
      if (w.length !== 1)
        fehler.push('Es wurde in ' + w.length + ' Studios geschrieben statt in 1: ' +
          JSON.stringify(w.map(x => x.pfad)));
    }

    // 5) Fenster ist danach zu
    if (await page.evaluate(() => !!document.querySelector('#putzModal.show')))
      fehler.push('Nach dem Anlegen steht das Fenster noch offen');

    /* ── Bearbeiten ──
       Vorher konnte man eine Putzaufgabe nur LÖSCHEN. Ein Tippfehler im
       Titel kostete Löschen + Neuanlegen — und damit die Erledigt-
       Historie. Genau das ist hier die wichtigste Behauptung: der Haken
       von heute Morgen überlebt eine Änderung am Titel. */
    await page.selectOption('#ppStudio', 'studio-6');
    await page.waitForTimeout(900);

    const stifte = await page.evaluate(() => document.querySelectorAll('[data-ppedit]').length);
    if (!stifte) fehler.push('Keine Bearbeiten-Knöpfe an den Putzaufgaben');

    /* c2 „Spiegel putzen" ist wöchentlich und NICHT erledigt; c1 „Böden
       wischen" ist erledigt. Beide werden gebraucht. */
    const zeile = (id) => page.evaluate(x => {
      const k = document.querySelector('[data-ppedit="' + x + '"]');
      if (!k) return false; k.click(); return true;
    }, id);

    if (!(await zeile('c2'))) fehler.push('Putzaufgabe c2 hat keinen Stift');
    await page.waitForTimeout(700);
    const bearb = await page.evaluate(() => ({
      titel: (document.getElementById('ppmTitel') || {}).textContent || '',
      knopf: (document.getElementById('ppAddWort') || {}).textContent || '',
      wert: (document.getElementById('ppTitle') || {}).value,
      rep: (document.getElementById('ppRepeat') || {}).value,
      studioFeld: !!(document.getElementById('ppStudioFeld') || {}).getClientRects
        && document.getElementById('ppStudioFeld').getClientRects().length > 0
    }));
    if (!/bearbeiten/i.test(bearb.titel))
      fehler.push('Überschrift sagt nicht „bearbeiten": „' + bearb.titel + '"');
    if (!/speichern/i.test(bearb.knopf))
      fehler.push('Der Knopf sagt nicht „speichern": „' + bearb.knopf + '"');
    if (bearb.wert !== 'Spiegel putzen')
      fehler.push('Der Titel steht nicht im Feld: „' + bearb.wert + '"');
    if (bearb.rep !== 'weekly')
      fehler.push('Die Wiederholung steht nicht im Feld: „' + bearb.rep + '"');
    /* Eine Aufgabe liegt in genau einem Studio; sie beim Ändern in ein
       anderes zu schieben ist etwas anderes als sie zu ändern. */
    if (bearb.studioFeld)
      fehler.push('Beim Bearbeiten steht die Studio-Auswahl noch da');

    await page.evaluate(() => { window.__schreib = []; });
    await page.fill('#ppTitle', 'Spiegel und Fenster putzen');
    await page.click('#ppAdd');
    await page.waitForTimeout(900);

    const g = await page.evaluate(() =>
      (window.__schreib || []).filter(x => /\/cleaning\//.test(x.pfad)));
    if (!g.length) fehler.push('Bearbeiten schreibt nichts');
    else {
      const d = g[0].daten || {};
      if (g[0].art !== 'update')
        fehler.push('Bearbeiten legt neu an statt zu ändern: ' + g[0].art + ' auf ' + g[0].pfad);
      if (!/c2$/.test(g[0].pfad))
        fehler.push('Falsches Dokument geändert: ' + g[0].pfad);
      if (d.title !== 'Spiegel und Fenster putzen')
        fehler.push('Titel nicht übernommen: ' + JSON.stringify(d.title));
      /* DER Punkt: der Haken darf nicht mitgeschrieben werden. Stünde
         done/doneAt im Update, würde jede Titeländerung die Erledigung
         von heute Morgen zurücksetzen — genau der Schaden, den Löschen
         und Neuanlegen vorher angerichtet hat. */
      ['done', 'doneBy', 'doneAt', 'doneByUid', 'doneKuerzel', 'pausiertBis']
        .forEach(f => {
          if (Object.prototype.hasOwnProperty.call(d, f))
            fehler.push('Bearbeiten fasst „' + f + '" an — das löscht den Haken: ' + JSON.stringify(d));
        });
    }
    if (await page.evaluate(() => !!document.querySelector('#putzModal.show')))
      fehler.push('Nach dem Speichern steht das Fenster noch offen');

    /* Gegenprobe: danach legt „+ Neu" wieder AN und nicht ändert. Ohne
       diese Zeile bliebe ein Fenster, das im Bearbeiten-Zustand hängt,
       unbemerkt — und der nächste „+ Neu" überschriebe eine fremde
       Aufgabe. */
    await page.click('#ppNew');
    await page.waitForTimeout(700);
    const wiederNeu = await page.evaluate(() => ({
      titel: (document.getElementById('ppmTitel') || {}).textContent || '',
      wert: (document.getElementById('ppTitle') || {}).value,
      studioFeld: document.getElementById('ppStudioFeld').getClientRects().length > 0
    }));
    if (/bearbeiten/i.test(wiederNeu.titel) || wiederNeu.wert || !wiederNeu.studioFeld)
      fehler.push('„+ Neu" nach dem Bearbeiten hängt im Ändern-Zustand: ' +
        JSON.stringify(wiederNeu));

    errs.forEach(e => fehler.push('Chef: ' + e));
    await b.close();
  }

  // ── Gegenprobe: Mitarbeiter ────────────────────────────────────────
  {
    const { b, page, errs } = await start('mitarbeiter');
    await zurPutzplanSeite(page);
    if (await page.evaluate(LAGE, 'ppNew'))
      fehler.push('Mitarbeiter sieht „+ Neu" im Putzplan — anlegen darf er laut Regeln nicht');
    if (await page.evaluate(() => document.querySelectorAll('[data-ppedit]').length))
      fehler.push('Mitarbeiter sieht Bearbeiten-Knöpfe — ändern darf er laut Regeln nicht');
    /* Gegenprobe zur Gegenprobe: die Seite ist wirklich da. Sonst wäre
       „kein Knopf" auch dann grün, wenn gar nichts geladen hat. */
    if (!(await page.evaluate(() => {
      const l = document.getElementById('ppList');
      return !!(l && l.getClientRects().length);
    }))) fehler.push('Mitarbeiter: die Putzplan-Seite ist gar nicht offen — der Durchlauf misst nichts');

    errs.forEach(e => fehler.push('Mitarbeiter: ' + e));
    await b.close();
  }

  console.log('Fehler:', fehler.length ? '' : 'keine');
  fehler.forEach(f => console.log('✗ ' + f));
  if (fehler.length) process.exitCode = 1;
}

lauf().catch(e => { console.log('✗ ' + e.message); process.exitCode = 1; });
