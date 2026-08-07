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

  // Einstellungen öffnen → Reiter Meldungen
  await page.evaluate(() => document.getElementById('uAvatar').click());
  await page.waitForTimeout(600);
  console.log('REITER:', await page.evaluate(() => [...document.querySelectorAll('[data-pmtab]')].map(t => t.textContent.trim())));
  await page.evaluate(() => document.querySelector('[data-pmtab=melden]').click());
  await page.waitForTimeout(600);

  const start = await page.evaluate(() => ({
    sichtbar: document.getElementById('pmPaneMelden').style.display !== 'none',
    andereVersteckt: document.getElementById('pmPaneAussehen').style.display === 'none'
      && document.getElementById('pmPaneProfil').style.display === 'none',
    schalter: [...document.querySelectorAll('.sw-row')].map(r => ({
      name: r.querySelector('b').textContent,
      an: r.querySelector('.sw').classList.contains('on'),
    })),
    hinweis: document.getElementById('notifyState').textContent,
  }));
  console.log('MELDUNGEN:', JSON.stringify(start, null, 1));
  await page.screenshot({ path: SP + '/meldungen.png' });

  // "Alle Chat-Nachrichten" abschalten
  await page.evaluate(() => {
    const r = [...document.querySelectorAll('.sw-row')].find(x => /Alle Chat/.test(x.textContent));
    r.click();
  });
  await page.waitForTimeout(500);
  console.log('Nach Abschalten "Alle Chat-Nachrichten":', await page.evaluate(() => ({
    schalterAus: ![...document.querySelectorAll('.sw-row')].find(x => /Alle Chat/.test(x.textContent)).querySelector('.sw').classList.contains('on'),
    gespeichert: JSON.parse(localStorage.getItem('kf_prefs') || '{}').notify,
  })));

  // Reiter wechseln und zurück – Zustand muss bleiben
  await page.evaluate(() => document.querySelector('[data-pmtab=aussehen]').click());
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('[data-pmtab=melden]').click());
  await page.waitForTimeout(500);
  console.log('Nach Reiterwechsel noch aus:', await page.evaluate(() =>
    ![...document.querySelectorAll('.sw-row')].find(x => /Alle Chat/.test(x.textContent)).querySelector('.sw').classList.contains('on')));

  // Neu laden – Einstellung muss überleben
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600); await page.mouse.click(215, 400).catch(() => {}); await page.waitForTimeout(2200);
  await page.evaluate(() => document.getElementById('uAvatar').click());
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('[data-pmtab=melden]').click());
  await page.waitForTimeout(500);
  console.log('Nach Neuladen:', await page.evaluate(() => ({
    chatAus: ![...document.querySelectorAll('.sw-row')].find(x => /Alle Chat/.test(x.textContent)).querySelector('.sw').classList.contains('on'),
    andereNochAn: [...document.querySelectorAll('.sw-row')].filter(x => x.querySelector('.sw').classList.contains('on')).length,
  })));

  // Alte Einstellung ohne "notify" darf nichts kaputtmachen
  await page.evaluate(() => localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'dark', chatbg: 'punkte' })));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600); await page.mouse.click(215, 400).catch(() => {}); await page.waitForTimeout(2200);
  await page.evaluate(() => document.getElementById('uAvatar').click());
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('[data-pmtab=melden]').click());
  await page.waitForTimeout(500);
  console.log('Alte Einstellung ohne notify → alles an:', await page.evaluate(() =>
    [...document.querySelectorAll('.sw-row')].filter(x => x.querySelector('.sw').classList.contains('on')).length + ' von ' +
    document.querySelectorAll('.sw-row').length));

  console.log('Fehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
