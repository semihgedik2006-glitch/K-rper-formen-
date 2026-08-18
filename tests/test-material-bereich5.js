/* Bereich 5 – Material: Platz für den Namen, sichtbarer Nachbestell-Hinweis,
   Filter „nur fehlende", Löschen mit Rückfrage.

   Die Namensspalte muss breit genug bleiben — bei 103 Pixeln bricht
   „Bein-Manschetten Größe 2 (Paare)" auf fünf Zeilen um. Und der Hinweis
   „X Artikel fehlen" muss wirklich sichtbar sein. */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function start(stub, errs) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/' + stub });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await page.mouse.click(195, 400).catch(() => {});
  await page.waitForTimeout(2700);
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-arbeit"]').click());
  await page.waitForTimeout(600);
  const s = await page.$('[data-subview="material"]');
  if (s) { await s.click(); await page.waitForTimeout(1400); }
  return { b, page };
}

(async () => {
  const errs = [];

  // ══ Mitarbeiter: Zählen und melden ══
  {
    const { b, page } = await start('stub-mitarbeiter.js', errs);

    const zeilen = await page.evaluate(() => {
      const r = [...document.querySelectorAll('.mat-row')];
      const n = [...document.querySelectorAll('.mat-name')];
      return {
        anzahl: r.length,
        alleGleichHoch: new Set(r.map(x => Math.round(x.getBoundingClientRect().height))).size === 1,
        hoehe: r.length ? Math.round(r[0].getBoundingClientRect().height) : 0,
        namensBreite: n.length ? Math.round(n[0].getBoundingClientRect().width) : 0,
        maxZeilenImNamen: Math.max(...n.map(x => Math.round(x.getBoundingClientRect().height / 19))),
        laengster: n.map(x => x.textContent).sort((a, c) => c.length - a.length)[0],
        getoent: r.filter(x => x.classList.contains('fehlt')).length,
        loeschKnoepfe: document.querySelectorAll('.mat-del').length,
        tabellenHoehe: Math.round(document.getElementById('matTable').getBoundingClientRect().height),
        kopfKlebt: getComputedStyle(document.getElementById('matHead')).position === 'sticky',
      };
    });
    console.log('ZEILEN:', JSON.stringify(zeilen));
    // Unter 150 px kippt das Raster: bei 103 px brach der Name auf fünf
    // Zeilen um.
    if (zeilen.namensBreite < 150) errs.push('Namensspalte nur ' + zeilen.namensBreite + ' px breit');
    if (zeilen.maxZeilenImNamen > 2) errs.push('Ein Name braucht ' + zeilen.maxZeilenImNamen + ' Zeilen');
    if (!zeilen.alleGleichHoch) errs.push('Die Zeilen sind unterschiedlich hoch – bricht das Raster um?');
    if (!zeilen.getoent) errs.push('Fehlende Zeilen sind nicht hervorgehoben');
    if (zeilen.loeschKnoepfe) errs.push('Mitarbeiter sieht ' + zeilen.loeschKnoepfe + ' Loeschknoepfe');
    if (!zeilen.kopfKlebt) errs.push('Die Spaltenkoepfe kleben nicht');

    // Der Nachbestell-Hinweis muss WIRKLICH sichtbar sein
    const hinweis = await page.evaluate(() => {
      const a = document.getElementById('matAlert');
      const r = a.getBoundingClientRect();
      return {
        sichtbar: getComputedStyle(a).display !== 'none' && r.height > 0,
        text: a.textContent.replace(/\s+/g, ' ').trim(),
        knopfHoehe: a.querySelector('button') ? Math.round(a.querySelector('button').getBoundingClientRect().height) : 0,
      };
    });
    console.log('HINWEIS:', JSON.stringify(hinweis));
    if (!hinweis.sichtbar) errs.push('Der Nachbestell-Hinweis ist unsichtbar');
    if (!/fehl/.test(hinweis.text)) errs.push('Der Hinweis nennt nichts Fehlendes');

    // Filter „nur diese zeigen"
    const vorher = await page.evaluate(() => document.querySelectorAll('.mat-row').length);
    await page.evaluate(() => document.getElementById('matAlertGo').click());
    await page.waitForTimeout(450);
    const gefiltert = await page.evaluate(() => ({
      zeilen: document.querySelectorAll('.mat-row').length,
      alleFehlen: [...document.querySelectorAll('.mat-row')].every(r => r.classList.contains('fehlt')),
      knopfText: document.getElementById('matAlertGo').textContent,
    }));
    console.log('FILTER:', vorher, '→', JSON.stringify(gefiltert));
    if (gefiltert.zeilen >= vorher) errs.push('Der Filter blendet nichts aus');
    if (!gefiltert.alleFehlen) errs.push('Der Filter zeigt auch vollstaendige Artikel');
    if (!/alle/.test(gefiltert.knopfText)) errs.push('Kein Weg zurueck aus dem Filter');
    await page.evaluate(() => document.getElementById('matAlertGo').click());
    await page.waitForTimeout(400);

    // Eintragen rechnet „Fehlt" sofort neu
    await page.evaluate(() => {
      const inp = document.querySelector('.mat-row input.have');
      inp.value = '99';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(350);
    const nachEingabe = await page.evaluate(() => {
      const r = document.querySelector('.mat-row');
      return { fehlt: r.querySelector('.computed').textContent, getoent: r.classList.contains('fehlt') };
    });
    console.log('nach Eingabe 99:', JSON.stringify(nachEingabe));
    if (nachEingabe.fehlt !== '0') errs.push('„Fehlt" rechnet nicht mit: ' + nachEingabe.fehlt);
    if (nachEingabe.getoent) errs.push('Die Zeile bleibt getoent, obwohl nichts mehr fehlt');

    await page.screenshot({ path: SP + '/material-mitarbeiter.png' });
    await b.close();
  }

  // ══ Chef: Löschen mit Rückfrage und Rückgängig ══
  {
    const { b, page } = await start('stub-chef.js', errs);

    const chef = await page.evaluate(() => ({
      loeschKnoepfe: document.querySelectorAll('.mat-del').length,
      exportImEinkauf: !!document.querySelector('#shopCard #matExport'),
      exportObenWeg: !document.querySelector('.mat-bar #matExport'),
      sollAenderbar: !document.querySelector('.mat-row input.limit').readOnly,
    }));
    console.log('CHEF:', JSON.stringify(chef));
    if (!chef.loeschKnoepfe) errs.push('Verwaltung sieht keine Loeschknoepfe');
    if (!chef.exportImEinkauf) errs.push('Der Gesamt-Export liegt nicht bei der Einkaufsliste');
    if (!chef.exportObenWeg) errs.push('Der Gesamt-Export steht noch ueber der Liste');
    if (!chef.sollAenderbar) errs.push('Verwaltung kann das Soll nicht setzen');

    let gefragt = false;
    page.on('dialog', async d => { gefragt = true; await d.accept(); });
    /* Seit dem 18.8. ist der Name fuer die Verwaltung ein Eingabefeld.
       textContent ist bei einem <input> immer leer — ohne diese
       Unterscheidung verglich die Runde unten "" mit "" und war gruen,
       egal an welcher Stelle die Zeile zurueckkam. */
    const nameVon = el => el ? (el.value !== undefined ? el.value : el.textContent) : null;
    const vorName = await page.evaluate(() => {
      const el = document.querySelector('.mat-name');
      return el ? (el.value !== undefined ? el.value : el.textContent) : null;
    });
    const vorZahl = await page.evaluate(() => document.querySelectorAll('.mat-row').length);
    await page.evaluate(() => document.querySelector('.mat-del').click());
    await page.waitForTimeout(700);
    const nachLoeschen = await page.evaluate(() => ({
      zeilen: document.querySelectorAll('.mat-row').length,
      undoDa: document.getElementById('undoBar').classList.contains('show'),
      undoText: document.getElementById('undoText').textContent,
    }));
    console.log('LÖSCHEN:', vorName, vorZahl, '→', JSON.stringify(nachLoeschen), '| gefragt:', gefragt);
    if (!gefragt) errs.push('Loeschen fragt nicht nach');
    if (nachLoeschen.zeilen !== vorZahl - 1) errs.push('Die Zeile wurde nicht entfernt');
    if (!nachLoeschen.undoDa) errs.push('Keine Rueckgaengig-Leiste nach dem Loeschen');

    await page.evaluate(() => document.getElementById('undoBtn').click());
    await page.waitForTimeout(600);
    const zurueck = await page.evaluate(() => ({
      zeilen: document.querySelectorAll('.mat-row').length,
      ersterName: (() => { const el = document.querySelector('.mat-name');
        return el ? (el.value !== undefined ? el.value : el.textContent) : null; })(),
    }));
    console.log('nach Rückgängig:', JSON.stringify(zurueck));
    if (zurueck.zeilen !== vorZahl) errs.push('Rueckgaengig hat die Zeile nicht zurueckgeholt');
    if (!vorName) errs.push('MESSUNG LEER: der erste Artikelname liess sich nicht lesen');
    if (zurueck.ersterName !== vorName) {
      errs.push('Die Zeile kam an anderer Stelle zurueck: ' +
        JSON.stringify(zurueck.ersterName) + ' statt ' + JSON.stringify(vorName));
    }

    await page.screenshot({ path: SP + '/material-chef.png' });
    await b.close();
  }

  console.log('\nFehler:', errs.length ? errs.join('\n  ') : 'keine');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
