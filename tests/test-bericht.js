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
  await page.waitForTimeout(1600); await page.mouse.click(215, 400).catch(() => {}); await page.waitForTimeout(2200);

  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
  await page.waitForTimeout(500);
  const sub = await page.$('[data-subview="chef"]'); if (sub) { await sub.click(); await page.waitForTimeout(600); }
  await page.evaluate(() => [...document.querySelectorAll('.chef-tab')].find(t => /System/.test(t.textContent)).click());
  await page.waitForTimeout(600);

  console.log('KARTE:', await page.evaluate(() => ({
    da: !!document.getElementById('repTestSend'),
    zeitraeume: [...document.querySelectorAll('#repTestTage option')].map(o => o.textContent),
    knopf: (document.getElementById('repTestSend') || {}).textContent,
  })));

  await page.selectOption('#repTestTage', '7');
  await page.evaluate(() => document.getElementById('repTestSend').click());
  await page.waitForTimeout(900);
  console.log('NACH KLICK:', await page.evaluate(() => ({
    aufruf: window.__aufruf,
    hinweis: document.getElementById('repTestNote').textContent,
    toast: document.getElementById('toast').textContent,
  })));

  await page.screenshot({ path: SP + '/bericht-knopf.png' });
  console.log('Fehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
