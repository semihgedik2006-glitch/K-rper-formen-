/* Putzplan: erledigte EINMALIGE Aufgaben verschwinden einen Tag nach dem
   Abhaken – aus der Liste, aus dem Fortschritt, aus dem Ausdruck und aus
   dem, was in die Google-Tabelle geschickt wird.

   Was NICHT verschwinden darf: wiederkehrende Aufgaben (die setzen sich
   selbst zurück) und einmalige, die niemand erledigt hat. */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-mitarbeiter.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600); await page.mouse.click(215, 400).catch(() => {}); await page.waitForTimeout(2400);

  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-arbeit"]').click());
  await page.waitForTimeout(450);
  const sub = await page.$('[data-subview="putzplan"]');
  if (sub) { await sub.click(); await page.waitForTimeout(900); }

  const r = await page.evaluate(() => ({
    titel: [...document.querySelectorAll('.pp-title')].map(t => t.textContent.replace(/\s+/g, ' ').trim()),
    fortschritt: (document.getElementById('ppProgress') || {}).textContent,
  }));
  console.log('PUTZPLAN:', JSON.stringify(r, null, 1));

  const hat = n => r.titel.some(t => t.indexOf(n) === 0);

  if (hat('Fenster putzen (alt)')) errs.push('Einmalige Aufgabe von vor 30 Stunden steht noch in der Liste');
  if (!hat('Lager aufräumen'))     errs.push('Einmalige Aufgabe von vor 2 Stunden fehlt – zu frueh entfernt');
  if (!hat('Vorhänge waschen'))    errs.push('Nicht erledigte Einmal-Aufgabe fehlt – die darf nie verschwinden');
  if (!hat('Böden wischen'))       errs.push('Wiederkehrende Aufgabe fehlt');

  // Was ginge in die Google-Tabelle?
  const tab = await page.evaluate(() => {
    const raus = [];
    const echt = window.fetch;
    window.fetch = function (u, o) {
      try { if (/script\.google\.com/.test(String(u))) raus.push(JSON.parse(o.body)); } catch (e) {}
      return Promise.resolve({ ok: true });
    };
    return new Promise(resolve => {
      // Über den echten Weg: eine Notiz anlegen loest den Tabellen-Abgleich aus
      const inp = document.getElementById('ppNoteInput');
      inp.value = 'Test';
      document.getElementById('ppNoteAdd').click();
      setTimeout(() => {
        window.fetch = echt;
        const p = raus.filter(x => x && x.type === 'putzplan')[0];
        resolve(p ? p.tasks.map(t => t.title) : null);
      }, 1400);
    });
  });
  console.log('AN DIE TABELLE:', JSON.stringify(tab));
  if (tab === null) errs.push('Es wurde nichts an die Tabelle geschickt');
  else {
    if (tab.some(t => t.indexOf('Fenster putzen (alt)') === 0)) errs.push('Abgelaufene Aufgabe geht noch in die Tabelle');
    if (!tab.some(t => t.indexOf('Lager aufräumen') === 0)) errs.push('Frisch erledigte Aufgabe fehlt in der Tabelle');
    if (!tab.some(t => t.indexOf('Vorhänge waschen') === 0)) errs.push('Nicht erledigte Aufgabe fehlt in der Tabelle');
  }

  console.log('\nFehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
