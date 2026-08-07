const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = process.env.SP || __dirname;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600); await page.mouse.click(215, 400).catch(() => {}); await page.waitForTimeout(2300);
  await page.evaluate(() => { window.confirm = () => true; });

  // In den Chef-Bereich → System
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
  await page.waitForTimeout(500);
  const sub = await page.$('[data-subview="chef"]'); if (sub) { await sub.click(); await page.waitForTimeout(600); }
  await page.evaluate(() => [...document.querySelectorAll('.chef-tab')].find(t => /System/.test(t.textContent)).click());
  await page.waitForTimeout(700);

  console.log('PAPIERKORB-KARTE:', JSON.stringify(await page.evaluate(() => ({
    liste: !!document.getElementById('trashList'),
    zaehler: !!document.getElementById('trashCount'),
    leerenKnopf: (document.getElementById('trashEmpty') || {}).textContent,
    inhalt: (document.getElementById('trashList') || {}).textContent.trim().slice(0, 60),
  })), null, 1));

  // Eine Aufgabe löschen → muss in den Papierkorb geschrieben werden
  await page.evaluate(() => { window.__trashWrites = []; });
  await page.evaluate(() => {
    // Schreibvorgänge in "trash" mitschneiden
    const orig = window.firebase.firestore().collection;
    window.firebase.firestore().collection = function (p) {
      const c = orig.call(this, p);
      if (p === 'trash') {
        const add = c.add;
        c.add = function (d) { window.__trashWrites.push(d); return add.call(this, d); };
      }
      return c;
    };
  });
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-arbeit"]').click());
  await page.waitForTimeout(450);
  const st = await page.$('[data-subview="todos"]'); if (st) { await st.click(); await page.waitForTimeout(600); }
  await page.evaluate(() => document.querySelector('.todo .t-del').click());
  await page.waitForTimeout(900);
  console.log('BEIM LÖSCHEN in den Papierkorb geschrieben:', await page.evaluate(() =>
    (window.__trashWrites || []).map(w => ({ col: w.col, sk: w.sk, titel: w.data && w.data.title, von: w.deletedBy }))));
  console.log('Rückgängig-Leiste trotzdem da:', await page.evaluate(() =>
    document.getElementById('undoBar').classList.contains('show')));

  await page.screenshot({ path: SP + '/papierkorb.png' });
  console.log('Fehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
