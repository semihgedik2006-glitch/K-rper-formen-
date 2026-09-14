/* ── Öffnungszeiten je Studio ─────────────────────────────────────────

   Erster Schritt der Zeiterfassung, und der unscheinbarste. Gebraucht
   werden sie für die Frage, die den ganzen Bau angestossen hat: „wie
   lange war der Laden unbeaufsichtigt".

   OHNE SIE LAESST SICH DIE FRAGE NICHT EINMAL STELLEN. Nachts ist
   niemand da, und das ist richtig so. Erst eine Öffnungszeit macht aus
   „niemand eingestempelt" einen Befund.

   Geprüft wird:
     1. Der Knopf steht in der Studioliste und öffnet den Dialog.
     2. Sieben Zeilen, eine je Wochentag, mit Haken und zwei Zeiten.
     3. Ein Tag ohne Haken sperrt seine beiden Zeitfelder — sonst tippt
        jemand eine Zeit ein, die nirgends ankommt.
     4. „Für alle Tage übernehmen" füllt wirklich alle sieben.
     5. GESPEICHERT WIRD DAS RICHTIGE: der Schreibvorgang landet auf
        config/studios, trägt die Liste ALLER Studios und ändert nur das
        eine. Ein Dialog, der beim Speichern die übrigen Studios
        verliert, ist schlimmer als keiner.
     6. „bis" vor „von" wird abgelehnt. Eine Nachtschicht über
        Mitternacht gibt es in einem EMS-Studio nicht, und sie
        stillschweigend zuzulassen hiesse, dass die Abdeckungsrechnung
        später Unsinn ergibt — ohne dass es jemand merkt.
     7. Leerer Tag heisst geschlossen und wird als '' gespeichert, nicht
        weggelassen. Der Unterschied zählt: kein Wert heisst „nicht
        gepflegt", und das ist etwas anderes als geschlossen.

   NICHT GEPRÜFT: ob die Zeiten später richtig verrechnet werden. Das
   gehört zur Abdeckungsrechnung und gibt es noch nicht.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) {
      errs.push('CONSOLE: ' + m.text().slice(0, 160));
    }
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);

  /* ── Zum Chef-Bereich, Reiter „Studios" ── */
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
  await page.waitForTimeout(700);
  const reiter = await page.evaluate(() => {
    const b = [...document.querySelectorAll('#view-chef [data-cpane], #view-chef .pm-tab, #view-chef button')]
      .find(x => /^\s*Studios\s*$/.test(x.textContent || ''));
    if (b) { b.click(); return true; }
    return false;
  });
  await page.waitForTimeout(800);
  if (!reiter) errs.push('Der Reiter „Studios" im Chef-Bereich wurde nicht gefunden');

  /* ── 1. Knopf da? ── */
  const knopf = await page.evaluate(() => {
    const k = document.querySelector('#standortListe [data-stzeit]');
    return k ? { da: true, text: (k.textContent || '').trim(), studio: k.getAttribute('data-stzeit') } : { da: false };
  });
  console.log('KNOPF:', JSON.stringify(knopf));
  if (!knopf.da) {
    errs.push('Kein Zeiten-Knopf in der Studioliste');
  } else {
    await page.evaluate(() => document.querySelector('#standortListe [data-stzeit]').click());
    await page.waitForTimeout(500);
  }

  /* ── 2 + 3. Aufbau des Dialogs ── */
  const aufbau = await page.evaluate(() => {
    const m = document.getElementById('oeffnungModal');
    if (!m || !m.classList.contains('show')) return { offen: false };
    const zeilen = [...document.querySelectorAll('#oeffnungListe .oz-zeile')];
    const erste = zeilen[0];
    const hak = erste && erste.querySelector('.oz-an');
    const von = erste && erste.querySelector('[data-von]');
    return {
      offen: true,
      zeilen: zeilen.length,
      titel: (document.getElementById('oeffnungTitel').textContent || '').trim(),
      tage: zeilen.map(z => (z.querySelector('.oz-tag span') || {}).textContent),
      erstHaken: !!(hak && hak.checked),
      erstGesperrt: !!(von && von.disabled)
    };
  });
  console.log('AUFBAU:', JSON.stringify(aufbau));
  if (!aufbau.offen) errs.push('Der Dialog geht nicht auf');
  else {
    if (aufbau.zeilen !== 7) errs.push('Es sind ' + aufbau.zeilen + ' Zeilen statt sieben');
    if (!/Montag/.test((aufbau.tage || [])[0] || '')) errs.push('Die erste Zeile ist nicht Montag');
    if (!/·/.test(aufbau.titel)) errs.push('Der Titel nennt nicht, um welches Studio es geht: ' + aufbau.titel);
    // Ohne gepflegte Zeiten ist kein Tag angehakt und alle Felder gesperrt.
    if (aufbau.erstHaken !== aufbau.erstGesperrt === false) { /* zueinander passend, siehe unten */ }
    if (!aufbau.erstHaken && !aufbau.erstGesperrt) {
      errs.push('Ein Tag ohne Haken hat trotzdem bedienbare Zeitfelder — dort eingetippte Zeiten kämen nirgends an');
    }
  }

  /* ── 4. „Für alle Tage übernehmen" ── */
  const alle = await page.evaluate(async () => {
    // Montag anhaken und eine Zeit setzen, dann übernehmen.
    const mo = document.querySelector('.oz-an[data-tag="mo"]');
    mo.checked = true; mo.dispatchEvent(new Event('change'));
    document.querySelector('[data-von="mo"]').value = '08:00';
    document.querySelector('[data-bis="mo"]').value = '20:30';
    document.getElementById('oeffnungAlle').click();
    await new Promise(r => setTimeout(r, 200));
    const haken = [...document.querySelectorAll('.oz-an')].filter(c => c.checked).length;
    const werte = [...document.querySelectorAll('[data-von]')].map(i => i.value);
    const gesperrt = [...document.querySelectorAll('[data-von]')].filter(i => i.disabled).length;
    return { haken, alleGleich: werte.every(v => v === '08:00'), gesperrt };
  });
  console.log('UEBERNEHMEN:', JSON.stringify(alle));
  if (alle.haken !== 7) errs.push('„Für alle Tage" hakt nur ' + alle.haken + ' von sieben an');
  if (!alle.alleGleich) errs.push('„Für alle Tage" setzt nicht überall dieselbe Zeit');
  if (alle.gesperrt) errs.push(alle.gesperrt + ' Zeitfelder bleiben nach dem Übernehmen gesperrt');

  /* ── 6. „bis" vor „von" muss abgelehnt werden ── */
  const verdreht = await page.evaluate(async () => {
    document.querySelector('[data-von="mi"]').value = '20:00';
    document.querySelector('[data-bis="mi"]').value = '09:00';
    window.__schreib = [];
    document.getElementById('oeffnungSpeichern').click();
    await new Promise(r => setTimeout(r, 700));
    return {
      geschrieben: (window.__schreib || []).length,
      nochOffen: document.getElementById('oeffnungModal').classList.contains('show'),
      meldung: (document.getElementById('toast') || {}).textContent || ''
    };
  });
  console.log('VERDREHT:', JSON.stringify(verdreht));
  if (verdreht.geschrieben) {
    errs.push('„bis" vor „von" wurde gespeichert — die Abdeckungsrechnung bekäme später Unsinn');
  }
  if (!verdreht.nochOffen) errs.push('Der Dialog schliesst sich trotz Fehler');
  if (!/Mittwoch/.test(verdreht.meldung)) {
    errs.push('Die Meldung sagt nicht, welcher Tag falsch ist: „' + verdreht.meldung + '"');
  }

  /* ── 5 + 7. Richtig speichern ── */
  const gespeichert = await page.evaluate(async () => {
    document.querySelector('[data-von="mi"]').value = '08:00';
    document.querySelector('[data-bis="mi"]').value = '20:30';
    // Sonntag zu.
    const so = document.querySelector('.oz-an[data-tag="so"]');
    so.checked = false; so.dispatchEvent(new Event('change'));
    window.__schreib = [];
    document.getElementById('oeffnungSpeichern').click();
    await new Promise(r => setTimeout(r, 900));
    const w = (window.__schreib || [])[0] || null;
    return {
      anzahl: (window.__schreib || []).length,
      pfad: w && w.pfad,
      studios: w && w.daten && Array.isArray(w.daten.liste) ? w.daten.liste.length : -1,
      mitZeiten: w && w.daten && Array.isArray(w.daten.liste)
        ? w.daten.liste.filter(s => s.oeffnung).length : -1,
      erstes: w && w.daten && w.daten.liste && w.daten.liste[0] ? w.daten.liste[0].oeffnung : null,
      zu: document.getElementById('oeffnungModal').classList.contains('show') === false
    };
  });
  console.log('GESPEICHERT:', JSON.stringify(gespeichert));
  if (gespeichert.anzahl !== 1) errs.push('Es wurde ' + gespeichert.anzahl + '-mal geschrieben statt einmal');
  if (!/config\/studios$/.test(gespeichert.pfad || '')) {
    errs.push('Geschrieben wurde nach ' + gespeichert.pfad + ' statt nach config/studios');
  }
  if (gespeichert.studios < 2) {
    errs.push('Die gespeicherte Liste hat nur ' + gespeichert.studios + ' Studios — die übrigen gingen verloren');
  }
  if (gespeichert.mitZeiten !== 1) {
    errs.push(gespeichert.mitZeiten + ' Studios haben jetzt Zeiten — es sollte genau eins sein');
  }
  const o = gespeichert.erstes || {};
  if (o.mo !== '08:00-20:30') errs.push('Montag steht als „' + o.mo + '" statt „08:00-20:30"');
  if (o.so !== '') errs.push('Ein geschlossener Sonntag steht als „' + o.so + '" statt als leerer Wert — ' +
    'kein Wert hiesse „nicht gepflegt", und das ist etwas anderes als geschlossen');
  if (!gespeichert.zu) errs.push('Der Dialog bleibt nach dem Speichern offen');

  await b.close();
  console.log('\nFehler: ' + (errs.length ? '' : 'keine'));
  errs.forEach(e => console.log('  ' + e));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
