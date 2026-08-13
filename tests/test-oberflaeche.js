/* Aufklappbare Abschnitte, Sortierung und frei belegbare Tastenkürzel.
   Alles drei merkt sich etwas auf dem Gerät – das wird mitgeprüft. */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function start(breite, hoehe, stub, errs) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: breite, height: hoehe }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/' + stub });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await page.mouse.click(Math.round(breite / 2), 400).catch(() => {});
  await page.waitForTimeout(2600);
  return { b, page };
}

async function zuArbeit(page, unterseite) {
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-arbeit"]').click());
  await page.waitForTimeout(450);
  const s = await page.$('[data-subview="' + unterseite + '"]');
  if (s) { await s.click(); await page.waitForTimeout(1100); }
}

(async () => {
  const errs = [];

  // ── 1. Aufklappbare Abschnitte ──
  {
    const { b, page } = await start(390, 844, 'stub-chef.js', errs);
    await zuArbeit(page, 'material');

    const vorher = await page.evaluate(() => [...document.querySelectorAll('.card[data-fold]')]
      .filter(c => c.offsetParent !== null)
      .map(c => ({ id: c.dataset.fold, zu: c.classList.contains('zu') })));
    console.log('ABSCHNITTE Material:', JSON.stringify(vorher));
    if (!vorher.length) errs.push('Keine aufklappbaren Abschnitte auf der Material-Seite');
    if (!vorher.every(x => x.zu)) errs.push('Nebensachen auf der Material-Seite sind nicht zugeklappt');

    // Die Bestandstabelle muss ohne Scrollen sichtbar sein – das war der Punkt
    const tabelleOben = await page.evaluate(() => {
      const t = document.getElementById('matTable') || document.querySelector('.num.have');
      return t ? Math.round(t.getBoundingClientRect().top) : -1;
    });
    console.log('Bestandstabelle beginnt bei y =', tabelleOben);
    if (tabelleOben < 0) errs.push('Bestandstabelle nicht gefunden');
    else if (tabelleOben > 844) errs.push('Bestandstabelle liegt unter dem Bildschirmrand (y=' + tabelleOben + ')');

    // Aufklappen, Höhe prüfen, gemerkt?
    await page.evaluate(() => document.querySelector('.card[data-fold="shop"] .fold-head').click());
    await page.waitForTimeout(700);
    const auf = await page.evaluate(() => ({
      zu: document.querySelector('.card[data-fold="shop"]').classList.contains('zu'),
      hoehe: Math.round(document.querySelector('.card[data-fold="shop"] .fold-body').getBoundingClientRect().height),
      gemerkt: (JSON.parse(localStorage.getItem('kf_prefs') || '{}').folds || {}).shop,
    }));
    console.log('nach dem Aufklappen:', JSON.stringify(auf));
    if (auf.zu) errs.push('Abschnitt liess sich nicht aufklappen');
    if (auf.hoehe < 40) errs.push('Aufgeklappter Abschnitt ist nur ' + auf.hoehe + ' px hoch');
    if (auf.gemerkt !== true) errs.push('Aufgeklappter Zustand wurde nicht gemerkt');

    // Wieder zuklappen
    await page.evaluate(() => document.querySelector('.card[data-fold="shop"] .fold-head').click());
    await page.waitForTimeout(700);
    console.log('wieder zu:', await page.evaluate(() => document.querySelector('.card[data-fold="shop"]').classList.contains('zu')));

    await page.screenshot({ path: SP + '/oberflaeche-material.png' });
    await b.close();
  }

  // ── 2. Sortierung ──
  {
    const { b, page } = await start(390, 844, 'stub-mitarbeiter.js', errs);
    await zuArbeit(page, 'geraete');

    const knoepfe = await page.evaluate(() => [...document.querySelectorAll('#devSort .chip')].map(c => c.textContent.trim()));
    console.log('SORTIERUNG Geräte:', JSON.stringify(knoepfe));
    if (knoepfe.length < 3) errs.push('Zu wenige Sortier-Knoepfe bei den Geraeten');

    const nachZustand = await page.evaluate(() => [...document.querySelectorAll('.dev-title')].map(t => t.textContent));
    await page.evaluate(() => [...document.querySelectorAll('#devSort .chip')].find(c => /Name/.test(c.textContent)).click());
    await page.waitForTimeout(600);
    const nachName = await page.evaluate(() => [...document.querySelectorAll('.dev-title')].map(t => t.textContent));
    console.log('  Zustand:', JSON.stringify(nachZustand));
    console.log('  Name:   ', JSON.stringify(nachName));
    if (JSON.stringify(nachZustand) === JSON.stringify(nachName)) errs.push('Sortierung nach Name aendert nichts');
    const alphabetisch = nachName.slice().sort((a, c) => a.localeCompare(c, 'de'));
    if (JSON.stringify(nachName) !== JSON.stringify(alphabetisch)) errs.push('Nach Name ist nicht alphabetisch sortiert');

    const gemerkt = await page.evaluate(() => (JSON.parse(localStorage.getItem('kf_prefs') || '{}').sort || {}).dev);
    console.log('  gemerkt:', gemerkt);
    if (gemerkt !== 'name') errs.push('Sortierung wurde nicht gemerkt');

    await page.screenshot({ path: SP + '/oberflaeche-geraete.png' });
    await b.close();
  }

  // ── 3. Tastenkürzel selbst belegen (nur am Rechner sinnvoll) ──
  {
    const { b, page } = await start(1200, 900, 'stub-chef.js', errs);
    await page.keyboard.press('?');
    await page.waitForTimeout(600);

    const offen = await page.evaluate(() => document.getElementById('keysModal').classList.contains('show'));
    const zeilen = await page.evaluate(() => document.querySelectorAll('.key-row').length);
    const aenderbar = await page.evaluate(() => document.querySelectorAll('[data-keyset]').length);
    console.log('TASTENKÜRZEL: Fenster', offen, '| Zeilen', zeilen, '| änderbar', aenderbar);
    if (!offen) errs.push('Kuerzel-Fenster oeffnet nicht mit ?');
    if (aenderbar < 8) errs.push('Zu wenige aenderbare Kuerzel');

    // Geräte auf "x" legen
    await page.evaluate(() => document.querySelector('[data-keyset="geraete"]').click());
    await page.waitForTimeout(300);
    await page.keyboard.press('x');
    await page.waitForTimeout(500);
    const belegt = await page.evaluate(() => (JSON.parse(localStorage.getItem('kf_prefs') || '{}').keys || {}).geraete);
    console.log('  Geräte liegt jetzt auf:', belegt);
    if (belegt !== 'x') errs.push('Eigene Belegung wurde nicht gespeichert');

    // Dieselbe Taste noch einmal vergeben -> muss abgelehnt werden.
    // Alle Meldungen mitschneiden: die Erinnerung an faellige Aufgaben kann
    // jederzeit dazwischenfunken und die letzte Meldung ueberschreiben.
    await page.evaluate(() => {
      window.__toasts = [];
      const el = document.getElementById('toast');
      new MutationObserver(() => window.__toasts.push(el.textContent)).observe(
        el, { childList: true, characterData: true, subtree: true });
    });
    await page.evaluate(() => document.querySelector('[data-keyset="putz"]').click());
    await page.waitForTimeout(300);
    await page.keyboard.press('x');
    await page.waitForTimeout(600);
    const toasts = await page.evaluate(() => window.__toasts || []);
    const putz = await page.evaluate(() => (JSON.parse(localStorage.getItem('kf_prefs') || '{}').keys || {}).putz);
    console.log('  doppelte Taste – Meldungen:', JSON.stringify(toasts), '| Putzplan:', putz);
    if (putz === 'x') errs.push('Dieselbe Taste liess sich zweimal vergeben');
    if (!toasts.some(t => /liegt schon/.test(t))) errs.push('Keine Meldung bei doppelter Taste');

    // Fenster schliessen und die neue Taste ausprobieren
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await page.keyboard.press('x');
    await page.waitForTimeout(700);
    const jetzt = await page.evaluate(() => (document.querySelector('.view.show') || {}).id);
    console.log('  "x" öffnet:', jetzt);
    if (jetzt !== 'view-geraete') errs.push('Neue Taste oeffnet nicht die Geraete-Seite (sondern ' + jetzt + ')');

    // Zuruecksetzen
    await page.keyboard.press('?');
    await page.waitForTimeout(500);
    await page.evaluate(() => document.getElementById('keysReset').click());
    await page.waitForTimeout(500);
    const nachReset = await page.evaluate(() => JSON.parse(localStorage.getItem('kf_prefs') || '{}').keys);
    console.log('  nach Zurücksetzen:', JSON.stringify(nachReset));
    if (nachReset && Object.keys(nachReset).length) errs.push('Zuruecksetzen hat nicht geleert');

    await page.screenshot({ path: SP + '/oberflaeche-kuerzel.png' });
    await b.close();
  }

  console.log('\nFehler:', errs.length ? errs.join('\n  ') : 'keine');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
