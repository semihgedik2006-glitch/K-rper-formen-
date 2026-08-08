/* Die Sicherung, die im Verborgenen scheitert.

   Die naechtliche Sicherung lief monatelang ins Leere: der Speicher war im
   Projekt nie eingerichtet. Der Fehler stand nur im Protokoll von Google,
   und dort schaut niemand hin. Seit dieser Runde schreibt die Server-
   Funktion nach jedem Versuch nach config/sicherung, und die App zeigt es
   an zwei Stellen:

     1. in Verwaltung -> System, mit dem vollen Grund zum Nachlesen
     2. ganz oben in "Braucht Aufmerksamkeit", damit man es sieht, ohne
        danach zu suchen

   Der Stub liefert absichtlich einen gescheiterten Versuch. */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 200));
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await page.mouse.click(195, 400).catch(() => {});
  await page.waitForTimeout(2700);
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
  await page.waitForTimeout(1400);
  // Der Verwaltungsbereich startet auf der Uebersicht; "Braucht
  // Aufmerksamkeit" steht im Reiter "Überblick".
  await page.evaluate(() => {
    const k = document.querySelector('#chefHome [data-cgo="ueberblick"]');
    if (k) k.click();
  });
  await page.waitForTimeout(1400);

  // ── 1. Steht die Warnung im Ueberblick ganz oben? ──
  const oben = await page.evaluate(() => {
    const box = document.getElementById('chefAttention');
    if (!box) return null;
    const erste = box.querySelector('.att-row');
    return {
      zeilen: box.querySelectorAll('.att-row').length,
      ersteText: erste ? erste.textContent.replace(/\s+/g, ' ').trim() : '',
      ziel: erste ? erste.getAttribute('data-ctab-go') : '',
    };
  });
  console.log('Braucht Aufmerksamkeit:', JSON.stringify(oben));
  if (!oben || !/Sicherung/.test(oben.ersteText)) errs.push('FEHLT: Sicherungs-Warnung steht nicht ganz oben');
  if (oben && oben.ziel !== 'system') errs.push('FEHLT: Warnung fuehrt nicht zum System-Reiter');

  // ── 2. Fuehrt der Klick zum System-Reiter mit dem vollen Grund? ──
  await page.evaluate(() => document.querySelector('#chefAttention .att-row').click());
  await page.waitForTimeout(2000);

  const stand = await page.evaluate(() => {
    const el = document.getElementById('sichStand');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const pane = [...document.querySelectorAll('.chef-pane')].find(p => p.offsetParent !== null);
    const karte = el.closest('.card[data-fold]');
    return {
      pane: pane ? pane.getAttribute('data-cpane') : null,
      sichtbar: el.offsetParent !== null,
      // Zugeklappt nuetzt der Grund niemandem
      zugeklappt: karte ? karte.classList.contains('zu') : null,
      merker: (karte && karte.querySelector('.fold-num')) ? karte.querySelector('.fold-num').textContent : '',
      klasse: el.className,
      hoehe: Math.round(r.height),
      text: el.textContent.replace(/\s+/g, ' ').trim(),
      markierbar: getComputedStyle(el).userSelect,
      // Steht der Grund ohne Scrollen im Bild?
      imBild: r.top > 60 && r.bottom < window.innerHeight - 60,
    };
  });
  console.log('Stand-Kasten:', JSON.stringify(stand));
  if (!stand || !stand.sichtbar) errs.push('FEHLT: Der Kasten mit dem Sicherungsstand ist nicht sichtbar');
  if (stand && stand.pane !== 'system') errs.push('FEHLT: Klick landet nicht im System-Reiter');
  if (stand && !/schlecht/.test(stand.klasse)) errs.push('FEHLT: gescheiterte Sicherung wird nicht rot gezeigt');
  if (stand && !/nicht gefunden/.test(stand.text)) errs.push('FEHLT: Der Grund steht nicht im Kasten');
  if (stand && stand.zugeklappt) errs.push('FEHLT: Die Karte bleibt zugeklappt – der Grund ist versteckt');
  if (stand && !/Sicherung hakt/.test(stand.merker)) errs.push('FEHLT: kein Warnhinweis an der zugeklappten Karte');
  if (stand && !stand.imBild) errs.push('FEHLT: Der Grund steht nicht im sichtbaren Bereich');
  if (stand && stand.markierbar !== 'text') errs.push('FEHLT: Meldung laesst sich nicht markieren');

  // ── 3. Der Knopf darunter ist noch da und gross genug ──
  const knopf = await page.evaluate(() => {
    const b = document.getElementById('backupNow');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { hoehe: Math.round(r.height), text: b.textContent.trim() };
  });
  console.log('Knopf:', JSON.stringify(knopf));
  if (!knopf) errs.push('FEHLT: Knopf "Jetzt zusaetzlich sichern" verschwunden');
  if (knopf && knopf.hoehe < 44) errs.push('FINGERZIEL: Sicherungs-Knopf nur ' + knopf.hoehe + 'px hoch');

  await page.screenshot({ path: SP + '/sicherung-stand.png' });

  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ') : '\n✓ Sicherung: Stand wird sichtbar gemeldet');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
