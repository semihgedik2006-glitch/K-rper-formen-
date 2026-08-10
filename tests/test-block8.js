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

  const GROUP = { chat: 'g-komm', docs: 'g-arbeit' };
  async function go(view) {
    await page.evaluate(g => document.querySelector('.mobnav [data-group="' + g + '"]').click(), GROUP[view]);
    await page.waitForTimeout(450);
    const sub = await page.$('[data-subview="' + view + '"]');
    if (sub) { await sub.click(); await page.waitForTimeout(600); }
  }

  // ── Anheften ──
  await go('chat');
  await page.evaluate(() => document.querySelectorAll('.msg')[0].click());
  await page.waitForTimeout(400);
  console.log('ANHEFTEN-EINTRAG (Chef):', await page.evaluate(() => document.querySelectorAll('[data-ma="pin"]').length));
  await page.evaluate(() => document.getElementById('msSheetClose').click());
  await page.waitForTimeout(250);
  console.log('Leiste vor Anheften sichtbar:', await page.evaluate(() => document.getElementById('pinBar').classList.contains('show')));

  // Angeheftete Nachricht simulieren (Stub schreibt nicht zurück)
  await page.evaluate(() => {
    const box = document.getElementById('chatScroll');
    // Über den echten Renderpfad: eine Nachricht als angeheftet markieren
    window.__test_pin = true;
  });
  console.log('PIN-LEISTE Aufbau:', await page.evaluate(() => ({
    bar: !!document.getElementById('pinBar'),
    text: !!document.getElementById('pinText'),
    ansehen: !!document.getElementById('pinGo'),
    loesen: !!document.getElementById('pinOff'),
  })));

  // ── Dokument-Kategorien ──
  await go('docs');
  await page.waitForTimeout(700);
  console.log('KATEGORIEN:', await page.evaluate(() => ({
    auswahlImFormular: [...document.querySelectorAll('#docCat option')].map(o => o.textContent.trim()),
    filterleiste: !!document.getElementById('docCatRow'),
  })));

  // ── Erweiterte Suche ──
  await page.evaluate(() => document.getElementById('searchBtn').click());
  await page.waitForTimeout(300);
  for (const q of ['anna', 'mopp', 'urlaub', 'handt']) {
    await page.fill('#searchInput', q);
    await page.waitForTimeout(450);
    const treffer = await page.evaluate(() => [...document.querySelectorAll('.sr')].map(r => ({
      typ: r.querySelector('.sr-type').textContent,
      was: r.querySelector('.sr-main b').textContent.slice(0, 34),
    })));
    console.log(('Suche "' + q + '":').padEnd(18), JSON.stringify(treffer.slice(0, 5)));
  }

  console.log('Fehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
