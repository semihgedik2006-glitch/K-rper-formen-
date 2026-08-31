/* ── Suchen, Filtern und „Notiz → Putzaufgabe" ────────────────────────
   Die Aufgaben haben Suchfeld, Filter-Chips und Sortierung. Der Putzplan
   hatte eine nackte Liste — bei zwölf Punkten je Studio derselbe Bedarf.

   Geprüft wird:

     1. Es gibt genau die Filter, die es hier auch geben KANN. „Überfällig"
        und „Für mich" fehlen mit Absicht: Putzaufgaben haben weder Frist
        noch Zuweisung. Ein Filter, der nie etwas findet, ist ein
        Versprechen ohne Deckung — deshalb schlägt der Durchlauf an, wenn
        einer auftaucht.
     2. Ein Filter verkürzt die Liste wirklich, und die gezeigten Zeilen
        stimmen mit dem überein, was der Filter behauptet.
     3. Die Fortschrittszeile („2 von 5 erledigt") bleibt beim Filtern
        UNVERÄNDERT. Sonst stünde bei „Nur offene" plötzlich „0 von 3
        erledigt" — eine Zahl, die stimmt und trotzdem lügt.
     4. Der Zähler „X von Y" nennt die wirklich gezeigten Zeilen. Der
        erste Anlauf las sie aus dem DOM, bevor sie geschrieben waren,
        und zählte damit den vorigen Durchgang.
     5. Findet die Suche nichts, nennt der leere Bereich den Suchbegriff —
        „Kein Putzplan" wäre falsch, wenn es zwölf Punkte gibt.
     6. „→ Putzaufgabe" an einer Notiz öffnet das Fenster im ANLEGE-
        Zustand mit dem Notiztext darin, und die Notiz bleibt stehen.
     7. Gegenprobe: der Mitarbeiter sieht diesen Knopf nicht — anlegen
        darf er laut firestore.rules nicht.
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
  if (!(await page.evaluate(() => !!document.querySelector('#app.show')))) {
    await b.close();
    throw new Error('Die App ist gar nicht gestartet. ' +
      (errs.length ? errs.join(' | ') : 'keine Fehlermeldung im Browser'));
  }
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
  return { b, page, errs };
}

/* Der Zustand, wie ihn jemand auf dem Bildschirm sieht. */
const STAND = () => ({
  zeilen: [...document.querySelectorAll('#ppList .pp-item')]
    .map(z => (z.querySelector('.pp-title') || {}).textContent || ''),
  erledigt: [...document.querySelectorAll('#ppList .pp-item.done')].length,
  pausiert: [...document.querySelectorAll('#ppList .pp-item.pausiert')].length,
  fortschritt: (document.getElementById('ppProgress') || {}).textContent || '',
  zaehler: (document.getElementById('ppCount') || {}).textContent || '',
  leer: (document.getElementById('ppList') || {}).textContent || ''
});

async function lauf() {
  const fehler = [];

  // ── Chef ───────────────────────────────────────────────────────────
  {
    const { b, page, errs } = await start('chef');
    await page.selectOption('#ppStudio', 'studio-6');
    await page.waitForTimeout(900);

    // 1) Genau die Filter, die es geben kann
    const chips = await page.evaluate(() =>
      [...document.querySelectorAll('[data-ppfilter]')].map(c => c.getAttribute('data-ppfilter')));
    ['alle', 'offen', 'pausiert'].forEach(f => {
      if (chips.indexOf(f) < 0) fehler.push('Filter „' + f + '" fehlt: ' + JSON.stringify(chips));
    });
    ['faellig', 'meine'].forEach(f => {
      if (chips.indexOf(f) >= 0)
        fehler.push('Filter „' + f + '" gibt es im Putzplan — Putzaufgaben haben ' +
          'weder Frist noch Zuweisung, er fände nie etwas');
    });
    if (!(await page.evaluate(() => !!document.getElementById('ppSearch'))))
      fehler.push('Kein Suchfeld im Putzplan');

    const alle = await page.evaluate(STAND);
    if (alle.zeilen.length < 3)
      fehler.push('Zu wenige Putzaufgaben zum Prüfen (' + alle.zeilen.length +
        ') — der Durchlauf misst so gut wie nichts');
    if (alle.zaehler)
      fehler.push('Ohne Filter steht ein Zähler da: „' + alle.zaehler + '"');

    // 2+3+4) Filter „Nur offene"
    await page.evaluate(() => document.querySelector('[data-ppfilter="offen"]').click());
    await page.waitForTimeout(500);
    const offen = await page.evaluate(STAND);

    if (offen.zeilen.length >= alle.zeilen.length)
      fehler.push('„Nur offene" verkürzt die Liste nicht: ' + offen.zeilen.length +
        ' von ' + alle.zeilen.length);
    if (offen.erledigt)
      fehler.push('Bei „Nur offene" stehen ' + offen.erledigt + ' erledigte Punkte in der Liste');
    if (offen.pausiert)
      fehler.push('Bei „Nur offene" stehen ' + offen.pausiert + ' pausierte Punkte in der Liste');
    /* DER Punkt: die Fortschrittszeile zählt den ganzen Plan. */
    if (offen.fortschritt !== alle.fortschritt)
      fehler.push('Die Fortschrittszeile ändert sich mit dem Filter: „' + alle.fortschritt +
        '" → „' + offen.fortschritt + '" — sie soll den ganzen Plan zählen');
    if (offen.zaehler !== offen.zeilen.length + ' von ' + alle.zeilen.length)
      fehler.push('Der Zähler stimmt nicht: „' + offen.zaehler + '", gezeigt werden ' +
        offen.zeilen.length + ' von ' + alle.zeilen.length);

    // 5) Suche
    await page.evaluate(() => document.querySelector('[data-ppfilter="alle"]').click());
    await page.waitForTimeout(400);
    await page.fill('#ppSearch', 'spiegel');
    await page.waitForTimeout(500);
    const gesucht = await page.evaluate(STAND);
    if (gesucht.zeilen.length !== 1 || !/Spiegel/i.test(gesucht.zeilen[0] || ''))
      fehler.push('Suche nach „spiegel" findet ' + JSON.stringify(gesucht.zeilen));
    if (gesucht.fortschritt !== alle.fortschritt)
      fehler.push('Die Fortschrittszeile ändert sich beim Suchen: „' + gesucht.fortschritt + '"');

    await page.fill('#ppSearch', 'gibtesnicht');
    await page.waitForTimeout(500);
    const nichts = await page.evaluate(STAND);
    if (nichts.zeilen.length)
      fehler.push('Suche nach Unsinn zeigt trotzdem ' + nichts.zeilen.length + ' Zeilen');
    if (nichts.leer.indexOf('gibtesnicht') < 0)
      fehler.push('Der leere Bereich nennt den Suchbegriff nicht: „' +
        nichts.leer.replace(/\s+/g, ' ').slice(0, 100) + '"');

    await page.fill('#ppSearch', '');
    await page.waitForTimeout(500);
    const zurueck = await page.evaluate(STAND);
    if (zurueck.zeilen.length !== alle.zeilen.length)
      fehler.push('Nach dem Leeren der Suche fehlen Zeilen: ' + zurueck.zeilen.length +
        ' statt ' + alle.zeilen.length);

    // 6) Notiz → Putzaufgabe
    const notizen = await page.evaluate(() => ({
      knoepfe: document.querySelectorAll('[data-notetask]').length,
      erste: (document.querySelector('.pp-note-text') || {}).textContent || ''
    }));
    if (!notizen.knoepfe) fehler.push('Keine „→ Putzaufgabe"-Knöpfe an den Notizen');
    else {
      await page.evaluate(() => document.querySelector('[data-notetask]').click());
      await page.waitForTimeout(700);
      const f = await page.evaluate(() => ({
        offen: !!document.querySelector('#putzModal.show'),
        titel: (document.getElementById('ppmTitel') || {}).textContent || '',
        wert: (document.getElementById('ppTitle') || {}).value || '',
        studioFeld: document.getElementById('ppStudioFeld').getClientRects().length > 0
      }));
      if (!f.offen) fehler.push('„→ Putzaufgabe" öffnet nichts');
      /* ANLEGEN, nicht ändern: sonst überschriebe die Notiz eine
         fremde Putzaufgabe. */
      if (/bearbeiten/i.test(f.titel))
        fehler.push('„→ Putzaufgabe" öffnet im Bearbeiten-Zustand: „' + f.titel + '"');
      if (!f.studioFeld)
        fehler.push('Beim Anlegen aus einer Notiz fehlt die Studio-Auswahl');
      if (!f.wert || notizen.erste.indexOf(f.wert.slice(0, 20)) < 0)
        fehler.push('Der Notiztext steht nicht im Feld: „' + f.wert + '" ' +
          'gegen Notiz „' + notizen.erste.slice(0, 40) + '"');

      await page.evaluate(() => {
        const k = document.getElementById('ppmClose'); if (k) k.click();
      });
      await page.waitForTimeout(400);
      /* Die Notiz bleibt stehen. Sie automatisch zu löschen hieße,
         jemandem seine Nachricht wegzunehmen, weil man sie gelesen hat. */
      const nachher = await page.evaluate(() => document.querySelectorAll('.pp-note').length);
      const vorher = notizen.knoepfe;
      if (nachher < vorher)
        fehler.push('Die Notiz ist nach „→ Putzaufgabe" verschwunden (' + vorher +
          ' → ' + nachher + ')');
    }

    errs.forEach(e => fehler.push('Chef: ' + e));
    await b.close();
  }

  // ── Gegenprobe: Mitarbeiter ────────────────────────────────────────
  {
    const { b, page, errs } = await start('mitarbeiter');
    await page.waitForTimeout(600);
    if (await page.evaluate(() => document.querySelectorAll('[data-notetask]').length))
      fehler.push('Mitarbeiter sieht „→ Putzaufgabe" — anlegen darf er laut Regeln nicht');
    /* Suchen und Filtern darf er sehr wohl: das liest nur. Ohne diese
       Zeile wäre „nichts da" auch dann grün, wenn die Seite leer bliebe. */
    if (!(await page.evaluate(() => !!document.getElementById('ppSearch'))))
      fehler.push('Mitarbeiter hat kein Suchfeld — Suchen liest nur, das darf er');
    if (!(await page.evaluate(() => document.querySelectorAll('.pp-note').length)))
      fehler.push('Mitarbeiter: keine Notizen sichtbar — der Durchlauf misst nichts');

    errs.forEach(e => fehler.push('Mitarbeiter: ' + e));
    await b.close();
  }

  console.log('Fehler:', fehler.length ? '' : 'keine');
  fehler.forEach(f => console.log('✗ ' + f));
  if (fehler.length) process.exitCode = 1;
}

lauf().catch(e => { console.log('✗ ' + e.message); process.exitCode = 1; });
