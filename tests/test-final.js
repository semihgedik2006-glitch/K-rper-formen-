const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = process.env.SP || __dirname;

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.mouse.click(215, 400).catch(() => {});
  await page.waitForTimeout(1800);

  const GROUP = { home:'g-start', chat:'g-komm', dm:'g-komm', ann:'g-komm',
                  todos:'g-arbeit', putzplan:'g-arbeit', material:'g-arbeit',
                  team:'g-team', docs:'g-arbeit', chef:'g-chef', archive:'g-chef' };
  async function go(view) {
    await page.evaluate(g => document.querySelector('.mobnav [data-group="' + g + '"]').click(), GROUP[view]);
    await page.waitForTimeout(450);
    const sub = await page.$('[data-subview="' + view + '"]');
    if (sub) { await sub.click(); await page.waitForTimeout(500); }
  }

  // Alle Ansichten einmal durchklicken
  for (const v of ['home','chat','dm','ann','todos','putzplan','material','team','docs','chef','archive']) {
    await go(v);
    const ok = await page.evaluate(id => !!document.querySelector('#view-' + id + '.show'), v);
    if (!ok) errs.push('Ansicht ' + v + ' hat sich nicht geöffnet');
  }

  // Info anheften
  await go('ann');
  const pinBefore = await page.evaluate(() => document.querySelectorAll('.ann-pin').length);
  console.log('Anheften-Knöpfe bei Infos:', pinBefore);

  // Startseite
  await go('home');
  console.log('STARTSEITE:', await page.evaluate(() => ({
    gruss: (document.getElementById('homeGreet') || {}).textContent,
    hinweise: document.querySelectorAll('#homeAlerts .alert-bar').length,
    kacheln: document.querySelectorAll('#homeGrid .home-tile').length,
  })));

  await page.screenshot({ path: SP + '/final-home.png' });
  await go('chef');
  await page.screenshot({ path: SP + '/final-chef.png' });

  // Hellmodus prüfen
  await page.evaluate(() => document.getElementById('themeBtn').click());
  await page.waitForTimeout(600);
  await go('chef');
  await page.screenshot({ path: SP + '/final-chef-hell.png' });

  console.log('Fehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
