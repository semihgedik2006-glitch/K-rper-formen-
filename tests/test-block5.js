const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = process.env.SP || __dirname;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600); await page.mouse.click(215, 400).catch(()=>{}); await page.waitForTimeout(2000);

  const GROUP = { home:'g-start', chat:'g-komm', dm:'g-komm', todos:'g-arbeit', team:'g-team', chef:'g-chef' };
  async function go(view) {
    await page.evaluate(g => document.querySelector('.mobnav [data-group="' + g + '"]').click(), GROUP[view]);
    await page.waitForTimeout(450);
    const sub = await page.$('[data-subview="' + view + '"]');
    if (sub) { await sub.click(); await page.waitForTimeout(550); }
  }

  // ── Weiterleiten ──
  await go('chat');
  await page.evaluate(() => document.querySelectorAll('.msg')[0].click());
  await page.waitForTimeout(400);
  console.log('WEITERLEITEN-KNOPF:', await page.evaluate(() => document.querySelectorAll('[data-fwd]').length));
  await page.evaluate(() => document.querySelector('[data-fwd]').click());
  await page.waitForTimeout(600);
  console.log('AUSWAHL:', await page.evaluate(() => ({
    offen: document.getElementById('fwdModal').classList.contains('show'),
    vorschau: document.getElementById('fwdPreview').textContent,
    ziele: [...document.querySelectorAll('.fwd-item')].map(x => x.querySelector('.fwd-name').textContent + ' (' + x.querySelector('.fwd-kind').textContent + ')'),
  })));
  await page.fill('#fwdSearch', 'anna');
  await page.waitForTimeout(400);
  console.log('Gefiltert "anna":', await page.evaluate(() => [...document.querySelectorAll('.fwd-item .fwd-name')].map(x => x.textContent)));
  await page.evaluate(() => document.querySelector('.fwd-item').click());
  await page.waitForTimeout(700);
  console.log('Nach Auswahl:', await page.evaluate(() => ({
    zu: !document.getElementById('fwdModal').classList.contains('show'),
    toast: document.getElementById('toast').textContent,
  })));

  // ── Tastenkürzel ──
  await page.keyboard.press('3'); await page.waitForTimeout(500);
  console.log('Taste 3 → Ansicht:', await page.evaluate(() => (document.querySelector('.view.show')||{}).id));
  await page.keyboard.press('1'); await page.waitForTimeout(500);
  console.log('Taste 1 → Ansicht:', await page.evaluate(() => (document.querySelector('.view.show')||{}).id));
  await page.keyboard.press('?'); await page.waitForTimeout(500);
  console.log('Taste ? → Hilfe:', await page.evaluate(() => ({
    offen: document.getElementById('keysModal').classList.contains('show'),
    zeilen: document.querySelectorAll('.key-row').length,
  })));
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  console.log('Esc schließt:', await page.evaluate(() => !document.getElementById('keysModal').classList.contains('show')));
  // Kürzel dürfen beim Tippen NICHT greifen
  await go('chat');
  await page.click('#chatText');
  await page.keyboard.type('3');
  await page.waitForTimeout(400);
  console.log('Beim Tippen kein Wechsel:', await page.evaluate(() => ({
    ansicht: (document.querySelector('.view.show')||{}).id,
    imFeld: document.getElementById('chatText').value,
  })));

  // ── Mein Dienst ──
  await go('home');
  await page.waitForTimeout(900);
  console.log('MEIN DIENST:', await page.evaluate(() => ({
    karteDa: !!document.getElementById('myShiftCard'),
    sichtbar: document.getElementById('myShiftCard').style.display !== 'none',
    text: (document.getElementById('myShiftList')||{}).textContent.slice(0, 80),
  })));

  await page.screenshot({ path: SP + '/block5-home.png' });
  console.log('Fehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
