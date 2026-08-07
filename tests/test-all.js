const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = process.env.SP || __dirname;

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 150)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
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

  // ── Aufgaben: Tagesüberblick, Zuweisung, Sortierung, Filter ──
  await go('todos');
  const t = await page.evaluate(() => ({
    tagesueberblick: !!document.querySelector('.today'),
    ueberschrift: (document.querySelector('.today-h') || {}).textContent,
    kacheln: [...document.querySelectorAll('.today-pill')].map(p => p.textContent.trim()),
    sortierung: !!document.getElementById('todoSort'),
    filterFuerMich: !!document.querySelector('[data-tfilter="meine"]'),
    wischAufbau: document.querySelectorAll('.todo .swipe-body').length,
  }));
  console.log('AUFGABEN:', JSON.stringify(t, null, 1));

  // Sortierung testen
  await page.selectOption('#todoSort', 'name');
  await page.waitForTimeout(400);
  const sorted = await page.evaluate(() => [...document.querySelectorAll('.t-title')].map(x => x.textContent.replace(/🔁.*|⚠.*|für.*/g, '').trim()).slice(0, 4));
  console.log('Sortiert nach Name:', sorted.join(' | '));

  // ── Chef-Bereich: Zuweisungsfeld ──
  await go('chef');
  const assign = await page.evaluate(() => {
    const s = document.getElementById('ntAssign');
    return s ? [...s.options].map(o => o.text) : null;
  });
  console.log('Zuweisung wählbar:', assign ? assign.join(' | ') : 'FEHLT');

  // ── Suche: Putzplan + Material ──
  await go('putzplan');
  await page.selectOption('#ppStudio', 'studio-6').catch(() => {});
  await page.waitForTimeout(700);
  await page.evaluate(() => document.getElementById('searchBtn').click());
  await page.waitForTimeout(300);
  await page.fill('#searchInput', 'böden');
  await page.waitForTimeout(500);
  const s1 = await page.evaluate(() => [...document.querySelectorAll('.sr-type')].map(x => x.textContent));
  await page.fill('#searchInput', 'mopp');
  await page.waitForTimeout(500);
  const s2 = await page.evaluate(() => [...document.querySelectorAll('.sr-type')].map(x => x.textContent));
  console.log('Suche "böden":', s1.join(',') || 'nichts', '| Suche "mopp":', s2.join(',') || 'nichts');
  await page.evaluate(() => document.getElementById('searchClose').click());
  await page.waitForTimeout(300);

  // ── Online-Punkt ──
  await go('dm');
  await page.fill('#dmSearch', 'a');
  await page.waitForTimeout(500);
  const dots = await page.evaluate(() => ({
    personen: document.querySelectorAll('.dm-person').length,
    punkte: document.querySelectorAll('.online-dot').length,
  }));
  console.log('Direkt-Liste:', JSON.stringify(dots));

  await page.screenshot({ path: SP + '/all-features.png' });
  console.log('Fehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
