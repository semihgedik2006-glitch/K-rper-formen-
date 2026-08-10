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
  await page.evaluate(() => { window.confirm = () => true; window.print = () => { window.__printed = true; }; });

  const GROUP = { home:'g-start', chat:'g-komm', dm:'g-komm', ann:'g-komm',
                  todos:'g-arbeit', putzplan:'g-arbeit', material:'g-arbeit',
                  team:'g-team', docs:'g-arbeit', chef:'g-chef', archive:'g-chef' };
  async function go(view) {
    await page.evaluate(g => document.querySelector('.mobnav [data-group="' + g + '"]').click(), GROUP[view]);
    await page.waitForTimeout(450);
    const sub = await page.$('[data-subview="' + view + '"]');
    if (sub) { await sub.click(); await page.waitForTimeout(500); }
  }

  // ── Rückgängig bei Ankündigung ──
  await go('ann');
  await page.evaluate(() => document.querySelector('.ann-del').click());
  await page.waitForTimeout(600);
  console.log('UNDO Ankündigung:', await page.evaluate(() => ({
    sichtbar: document.getElementById('undoBar').classList.contains('show'),
    text: document.getElementById('undoText').textContent,
  })));
  await page.evaluate(() => document.getElementById('undoBtn').click());
  await page.waitForTimeout(300);

  // Anheften
  console.log('ANHEFTEN:', await page.evaluate(() => ({
    knoepfe: document.querySelectorAll('.ann-pin').length,
    angeheftet: document.querySelectorAll('.ann.pinned').length,
    ersteInfoIstAngeheftet: !!document.querySelector('.ann').classList.contains('pinned'),
  })));

  // ── Putzplan: Drucken + Rückgängig ──
  await go('putzplan');
  await page.selectOption('#ppStudio', 'studio-6').catch(() => {});
  await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('ppPrint').click());
  await page.waitForTimeout(500);
  console.log('DRUCKEN:', await page.evaluate(() => ({
    ausgeloest: !!window.__printed,
    ueberschrift: (document.querySelector('#printArea h1') || {}).textContent,
    zeilen: document.querySelectorAll('#printArea tbody tr, #printArea table tr').length,
    spalten: [...document.querySelectorAll('#printArea th')].map(t => t.textContent),
    notizen: !!document.querySelector('#printArea .p-note'),
  })));

  await page.evaluate(() => document.querySelector('.pp-del').click());
  await page.waitForTimeout(700);
  console.log('UNDO Putzaufgabe:', await page.evaluate(() => ({
    sichtbar: document.getElementById('undoBar').classList.contains('show'),
    text: document.getElementById('undoText').textContent,
  })));
  await page.evaluate(() => document.getElementById('undoBtn').click());
  await page.waitForTimeout(300);

  // ── Vorlagen ──
  await go('chef');
  await page.evaluate(() => [...document.querySelectorAll('.chef-tab')].find(t => /Erstellen/.test(t.textContent)).click());
  await page.waitForTimeout(500);
  console.log('VORLAGEN-Karte:', await page.evaluate(() => ({
    auswahl: !!document.getElementById('tplSelect'),
    optionen: [...document.querySelectorAll('#tplSelect option')].map(o => o.textContent),
    knoepfe: ['tplUse','tplSave','tplDel'].map(id => !!document.getElementById(id)),
  })));

  // Formular füllen und als Vorlage speichern
  await page.fill('#ntTitle', 'Geräte-Wartung');
  await page.fill('#ntDesc', 'Monatlicher Check');
  await page.fill('#ntSteps', 'Kabel prüfen\nElektroden tauschen');
  await page.evaluate(() => { window.prompt = () => 'Monatscheck'; });
  await page.evaluate(() => document.getElementById('tplSave').click());
  await page.waitForTimeout(700);
  console.log('Nach Speichern:', await page.evaluate(() => [...document.querySelectorAll('#tplSelect option')].map(o => o.textContent)));

  // Formular leeren, dann Vorlage einsetzen
  await page.fill('#ntTitle', '');
  await page.fill('#ntSteps', '');
  await page.evaluate(() => document.getElementById('tplUse').click());
  await page.waitForTimeout(500);
  console.log('Nach Einsetzen:', await page.evaluate(() => ({
    titel: document.getElementById('ntTitle').value,
    beschreibung: document.getElementById('ntDesc').value,
    schritte: document.getElementById('ntSteps').value.split('\n'),
  })));

  console.log('Fehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
