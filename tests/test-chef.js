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


  // Navigation: erst die Gruppe unten, dann den Reiter oben
  const GROUP = { home:'g-start', chat:'g-komm', dm:'g-komm', ann:'g-komm',
                  todos:'g-arbeit', putzplan:'g-arbeit', material:'g-arbeit',
                  team:'g-team', docs:'g-arbeit', chef:'g-chef', archive:'g-chef' };
  async function go(view) {
    await page.evaluate(g => document.querySelector('.mobnav [data-group="' + g + '"]').click(), GROUP[view]);
    await page.waitForTimeout(450);
    const sub = await page.$('[data-subview="' + view + '"]');
    if (sub) { await sub.click(); await page.waitForTimeout(450); }
  }

  // ── Teilschritte in Aufgaben ──
  await go('todos');
  const sub = await page.evaluate(() => ({
    schritte: document.querySelectorAll('.sub-item').length,
    abgehakt: document.querySelectorAll('.sub-item.done').length,
    zaehler: (document.querySelector('.sub-count') || {}).textContent || '—',
  }));
  console.log('TEILSCHRITTE:', JSON.stringify(sub));
  await page.evaluate(() => document.querySelectorAll('.sub-item')[1].click());
  await page.waitForTimeout(400);
  console.log('Nach Klick abgehakt:', await page.evaluate(() => document.querySelectorAll('.sub-item.done').length));

  // ── Rückgängig nach Löschen ──
  await page.evaluate(() => { window.confirm = () => true; });
  // Löschen liegt jetzt im Aktionsblatt der Aufgabe
  await page.evaluate(() => document.querySelector('.todo .t-mehr').click());
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('[data-tba="loeschen"]').click());
  await page.waitForTimeout(700);
  const undo = await page.evaluate(() => ({
    sichtbar: document.getElementById('undoBar').classList.contains('show'),
    text: document.getElementById('undoText').textContent,
  }));
  console.log('RÜCKGÄNGIG-LEISTE:', JSON.stringify(undo));
  await page.evaluate(() => document.getElementById('undoBtn').click());
  await page.waitForTimeout(400);
  console.log('Nach Klick versteckt:', await page.evaluate(() => !document.getElementById('undoBar').classList.contains('show')));

  // ── Chef-Bereich: Reiter ──
  await go('chef');
  const tabs = await page.evaluate(() => ({
    reiter: [...document.querySelectorAll('.chef-tab')].map(t => t.textContent.trim()),
    aktiv: (document.querySelector('.chef-tab.on') || {}).textContent,
    sichtbarePanes: [...document.querySelectorAll('.chef-pane')].filter(p => p.style.display !== 'none').map(p => p.dataset.cpane),
    kacheln: document.querySelectorAll('#dashGrid .dash-tile').length,
    studios: document.querySelectorAll('#studioGrid .studio-tile').length,
    aufmerksamkeit: document.querySelectorAll('#chefAttention .att-row').length,
  }));
  console.log('CHEF-REITER:', JSON.stringify(tabs, null, 1));

  // Auswertung öffnen
  await page.evaluate(() => [...document.querySelectorAll('.chef-tab')].find(t => /Auswertung/.test(t.textContent)).click());
  await page.waitForTimeout(600);
  const rep = await page.evaluate(() => ({
    sichtbar: [...document.querySelectorAll('.chef-pane')].filter(p => p.style.display !== 'none').map(p => p.dataset.cpane),
    kacheln: [...document.querySelectorAll('#repTiles .dash-tile')].map(t => t.textContent.trim()),
    studiozeilen: document.querySelectorAll('#repStudios .rep-row').length,
    personen: [...document.querySelectorAll('#repPeople .rep-row .rep-head')].map(x => x.textContent.trim()),
  }));
  console.log('AUSWERTUNG:', JSON.stringify(rep, null, 1));

  await page.selectOption('#repRange', '7');
  await page.waitForTimeout(400);
  console.log('Zeitraum 7 Tage – erste Kachel:', await page.evaluate(() => (document.querySelector('#repTiles .dash-tile') || {}).textContent));

  // System-Reiter
  await page.evaluate(() => [...document.querySelectorAll('.chef-tab')].find(t => /System/.test(t.textContent)).click());
  await page.waitForTimeout(500);
  console.log('SYSTEM:', await page.evaluate(() => ({
    sichtbar: [...document.querySelectorAll('.chef-pane')].filter(p => p.style.display !== 'none').map(p => p.dataset.cpane),
    info: (document.getElementById('sysInfo') || {}).textContent.slice(0, 120),
    knoepfe: [...document.querySelectorAll('[data-cpane=system] button')].map(b => b.textContent.trim()),
  })));

  // Erstellen-Reiter: Teilschritt-Feld vorhanden?
  await page.evaluate(() => [...document.querySelectorAll('.chef-tab')].find(t => /Erstellen/.test(t.textContent)).click());
  await page.waitForTimeout(500);
  console.log('ERSTELLEN:', await page.evaluate(() => ({
    teilschrittFeld: !!document.getElementById('ntSteps'),
    ankuendigung: !!document.getElementById('bcText'),
  })));

  await page.evaluate(() => [...document.querySelectorAll('.chef-tab')].find(t => /Überblick/.test(t.textContent)).click());
  await page.waitForTimeout(500);
  await page.screenshot({ path: SP + '/chef-ueberblick.png' });
  await page.evaluate(() => [...document.querySelectorAll('.chef-tab')].find(t => /Auswertung/.test(t.textContent)).click());
  await page.waitForTimeout(600);
  await page.screenshot({ path: SP + '/chef-report.png' });

  console.log('Fehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
