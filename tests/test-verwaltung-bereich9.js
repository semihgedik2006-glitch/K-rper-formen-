/* Bereich 9 – Verwaltung: was hakt zuerst, wofür man kommt zuerst,
   und keine Wand aus Formularen.

   Vorher war „Überblick" 4,76 Bildschirme lang und „Braucht Aufmerksamkeit"
   stand ganz unten – hinter 1.600 Pixeln Studio-Tabelle. Und „Erstellen"
   begann mit der Ankündigung, obwohl man wegen der Aufgabe kommt. */
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
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
  await page.waitForTimeout(1500);
  return { b, page };
}

// Karten des gerade offenen Reiters – über offsetParent, nicht über den
// Inline-Stil: den schreibt der Browser mal mit und mal ohne Leerzeichen.
const reiter = page => page.evaluate(() => {
  const sa = document.querySelector('#view-chef .scroll-area');
  const pane = [...document.querySelectorAll('.chef-pane')].find(p => p.offsetParent !== null);
  const karten = pane ? [...pane.querySelectorAll('.card')] : [];
  return {
    pane: pane ? pane.getAttribute('data-cpane') : null,
    bildschirme: +(sa.scrollHeight / sa.clientHeight).toFixed(2),
    karten: karten.map(c => ({
      titel: (c.querySelector('h3') || {}).textContent || '?',
      hoehe: Math.round(c.getBoundingClientRect().height),
      zu: c.classList.contains('zu'),
    })),
  };
});

(async () => {
  const errs = [];

  // ══ Chef ══
  {
    const { b, page } = await start('stub-chef.js', errs);

    const uebersicht = await page.evaluate(() => ({
      kacheln: [...document.querySelectorAll('.chef-card .cc-title')].map(t => t.textContent),
      zahlen: [...document.querySelectorAll('.chef-card .cc-num')]
        .filter(n => n.style.display !== 'none').map(n => n.textContent),
    }));
    console.log('ÜBERSICHT:', JSON.stringify(uebersicht));
    if (uebersicht.kacheln.length !== 6) errs.push('Chef sieht ' + uebersicht.kacheln.length + ' statt 6 Kacheln');

    // ── Überblick: was hakt, steht oben ──
    await page.evaluate(() => document.querySelector('[data-cgo="ueberblick"]').click());
    await page.waitForTimeout(900);
    const ub = await reiter(page);
    console.log('ÜBERBLICK:', JSON.stringify(ub));
    if (ub.pane !== 'ueberblick') errs.push('Falscher Reiter offen: ' + ub.pane);
    if (!/Aufmerksamkeit/.test(ub.karten[0].titel)) {
      errs.push('„Braucht Aufmerksamkeit" steht nicht oben: ' + ub.karten[0].titel);
    }
    if (!ub.karten.some(k => /Studios/.test(k.titel) && k.zu)) {
      errs.push('Die Studio-Tabelle startet nicht zugeklappt');
    }
    if (ub.bildschirme > 2.4) errs.push('Überblick ist ' + ub.bildschirme + ' Bildschirme lang');

    // ── Erstellen: die Aufgabe steht oben ──
    await page.evaluate(() => document.getElementById('chefBack').click());
    await page.waitForTimeout(400);
    await page.evaluate(() => document.querySelector('[data-cgo="erstellen"]').click());
    await page.waitForTimeout(900);
    const er = await reiter(page);
    console.log('ERSTELLEN:', JSON.stringify(er));
    if (!/Neue Aufgabe/.test(er.karten[0].titel)) {
      errs.push('„Neue Aufgabe" steht nicht oben: ' + er.karten[0].titel);
    }
    if (!er.karten.some(k => /Ankündigung/.test(k.titel) && k.zu)) {
      errs.push('Die Ankündigungs-Karte startet nicht zugeklappt');
    }

    // ── Nachweise und Auswertung: Nebensachen zugeklappt ──
    for (const [tab, oben, maxB] of [['nachweise', /demnächst ab/, 1.9], ['report', /Bericht/, 2.1]]) {
      await page.evaluate(() => document.getElementById('chefBack').click());
      await page.waitForTimeout(400);
      await page.evaluate(x => document.querySelector('[data-cgo="' + x + '"]').click(), tab);
      await page.waitForTimeout(900);
      const m = await reiter(page);
      console.log(tab.toUpperCase() + ':', JSON.stringify(m));
      if (!oben.test(m.karten[0].titel)) errs.push(tab + ': oben steht ' + m.karten[0].titel);
      if (m.karten.filter(k => k.zu).length < 2) errs.push(tab + ': zu wenige Karten starten zugeklappt');
      if (m.bildschirme > maxB) errs.push(tab + ' ist ' + m.bildschirme + ' Bildschirme lang');
    }

    // ── „+ Neu" von der Aufgabenseite muss immer noch im Formular landen ──
    await page.evaluate(() => document.querySelector('.mobnav [data-group="g-arbeit"]').click());
    await page.waitForTimeout(900);
    await page.evaluate(() => document.getElementById('todoNew').click());
    await page.waitForTimeout(1100);
    const gelandet = await page.evaluate(() => {
      const f = document.getElementById('ntTitle');
      const sa = document.querySelector('#view-chef .scroll-area');
      const r = f.getBoundingClientRect(), s = sa.getBoundingClientRect();
      return {
        ansicht: (document.querySelector('.view.show') || {}).id,
        feldImBild: r.top >= s.top - 2 && r.bottom <= s.bottom + 2,
        fokus: document.activeElement === f,
      };
    });
    console.log('„+ Neu" landet:', JSON.stringify(gelandet));
    if (gelandet.ansicht !== 'view-chef') errs.push('„+ Neu" landet bei ' + gelandet.ansicht);
    if (!gelandet.feldImBild) errs.push('Das Titelfeld ist nach „+ Neu" nicht im Bild');

    await page.screenshot({ path: SP + '/verwaltung-chef.png' });
    await b.close();
  }

  // ══ Leiter: keine Chef-Reiter, ehrliche Überschrift ══
  {
    const { b, page } = await start('stub-leiter.js', errs);
    const l = await page.evaluate(() => ({
      kacheln: [...document.querySelectorAll('.chef-card .cc-title')].map(t => t.textContent),
    }));
    console.log('LEITER Kacheln:', JSON.stringify(l.kacheln));
    if (l.kacheln.length !== 4) errs.push('Leiter sieht ' + l.kacheln.length + ' statt 4 Kacheln');
    if (l.kacheln.some(k => /Team|Nachweise/.test(k))) errs.push('Leiter sieht einen Chef-Reiter');

    await page.evaluate(() => document.querySelector('[data-cgo="ueberblick"]').click());
    await page.waitForTimeout(900);
    const titel = await page.evaluate(() => document.getElementById('studioGridTitle').textContent);
    console.log('LEITER Tabellen-Titel:', JSON.stringify(titel));
    if (/aller Studios/.test(titel)) errs.push('Die Ueberschrift behauptet „alle Studios": ' + titel);

    await page.screenshot({ path: SP + '/verwaltung-leiter.png' });
    await b.close();
  }

  console.log('\nFehler:', errs.length ? errs.join('\n  ') : 'keine');
})().catch(e => { console.error(e); process.exit(1); });
