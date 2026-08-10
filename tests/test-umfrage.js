/* Umfragen im Chat: Anzeige, Abstimmen, Anlegen, und dass das Schreibfeld
   auf einem schmalen Handy nicht von den Knöpfen erdrückt wird. */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  // Bewusst 360 px: das schmalste Gerät, das im Team vorkommt
  const page = await b.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600); await page.mouse.click(180, 400).catch(() => {}); await page.waitForTimeout(2400);

  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-komm"]').click());
  await page.waitForTimeout(450);
  const sub = await page.$('[data-subview="chat"]');
  if (sub) { await sub.click(); await page.waitForTimeout(900); }

  console.log('UMFRAGE IM CHAT:', JSON.stringify(await page.evaluate(() => ({
    frage: (document.querySelector('.poll-q') || {}).textContent,
    antworten: [...document.querySelectorAll('.poll-opt')].map(o => o.textContent.replace(/\s+/g, ' ').trim()),
    balken: [...document.querySelectorAll('.poll-fill')].map(f => f.style.width),
    fuss: (document.querySelector('.poll-foot') || {}).textContent,
  })), null, 1));

  // Prozente müssen zusammen 100 ergeben
  const pct = await page.evaluate(() => [...document.querySelectorAll('.poll-fill')].map(f => parseInt(f.style.width, 10)));
  const summe = pct.reduce((a, c) => a + c, 0);
  if (pct.length && summe !== 100) errs.push('Prozente ergeben ' + summe + ' statt 100');

  // Schreibfeld darf nicht erdrückt werden
  const breite = await page.evaluate(() => Math.round(document.getElementById('chatText').getBoundingClientRect().width));
  console.log('Schreibfeld auf 360 px:', breite + ' px');
  if (breite < 140) errs.push('Schreibfeld nur ' + breite + ' px breit');

  // Menü und Anlegen
  await page.evaluate(() => document.getElementById('chatAttach').click());
  await page.waitForTimeout(400);
  console.log('ANHÄNGEN-MENÜ:', JSON.stringify(await page.evaluate(() => ({
    offen: document.getElementById('attachMenu').classList.contains('show'),
    eintraege: [...document.querySelectorAll('#attachMenu button')].map(x => x.textContent.trim()),
  }))));

  await page.evaluate(() => document.querySelector('[data-att="umfrage"]').click());
  await page.waitForTimeout(500);
  console.log('Fenster offen:', await page.evaluate(() => document.getElementById('pollModal').classList.contains('show')));

  await page.evaluate(() => document.getElementById('pollSend').click());
  await page.waitForTimeout(400);
  console.log('ohne Frage:', await page.evaluate(() => (document.getElementById('toast') || {}).textContent));

  await page.fill('#pollQ', 'Test?'); await page.fill('#pollO1', 'Ja');
  await page.evaluate(() => document.getElementById('pollSend').click());
  await page.waitForTimeout(400);
  console.log('nur eine Antwort:', await page.evaluate(() => (document.getElementById('toast') || {}).textContent));

  await page.fill('#pollO2', 'Nein');
  await page.evaluate(() => document.getElementById('pollSend').click());
  await page.waitForTimeout(700);
  console.log('zwei Antworten:', JSON.stringify(await page.evaluate(() => ({
    toast: (document.getElementById('toast') || {}).textContent,
    fensterZu: !document.getElementById('pollModal').classList.contains('show'),
  }))));

  console.log('\nFehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
