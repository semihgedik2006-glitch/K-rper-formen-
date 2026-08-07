const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = process.env.SP || __dirname;

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-leiter.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.mouse.click(215, 400).catch(() => {});
  await page.waitForTimeout(1800);

  const GROUP = { chef: 'g-chef' };
  await page.evaluate(g => document.querySelector('.mobnav [data-group="' + g + '"]').click(), GROUP.chef);
  await page.waitForTimeout(500);
  const sub = await page.$('[data-subview="chef"]');
  if (sub) { await sub.click(); await page.waitForTimeout(600); }

  // Der Verwaltungsbereich beginnt jetzt mit einer Übersicht. Erst von dort
  // geht es in einen Reiter – die Reiterleiste ist vorher nicht sichtbar.
  console.log('LEITER Verwaltungs-Übersicht:', await page.evaluate(() => ({
    kacheln: [...document.querySelectorAll('.chef-card .cc-title')].map(t => t.textContent),
    reiterleisteVersteckt: document.getElementById('chefBar').style.display === 'none',
  })));

  await page.evaluate(() => document.querySelector('[data-cgo="ueberblick"]').click());
  await page.waitForTimeout(700);
  console.log('LEITER im Überblick:', await page.evaluate(() => ({
    reiter: [...document.querySelectorAll('.chef-tab')].map(t => t.textContent.trim()),
    studios: [...document.querySelectorAll('#studioGrid .studio-tile b')].map(x => x.textContent),
    kacheln: document.querySelectorAll('#dashGrid .dash-tile').length,
    zurueckDa: !!document.getElementById('chefBack'),
  })));

  await page.evaluate(() => document.querySelector('[data-ctab="report"]').click());
  await page.waitForTimeout(700);
  console.log('LEITER Auswertung:', await page.evaluate(() => ({
    aktiv: (document.querySelector('.chef-tab.on') || {}).textContent,
    studiozeilen: [...document.querySelectorAll('#repStudios .rep-head b')].map(x => x.textContent),
  })));

  // Zurück zur Übersicht
  await page.evaluate(() => document.getElementById('chefBack').click());
  await page.waitForTimeout(600);
  console.log('LEITER nach Zurück:', await page.evaluate(() =>
    document.getElementById('chefHome').style.display !== 'none' ? 'Übersicht' : 'FEHLER'));

  await page.screenshot({ path: SP + '/leiter-chef.png' });
  console.log('Fehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
