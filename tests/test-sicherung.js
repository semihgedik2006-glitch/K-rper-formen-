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

  /* ── 3. Der Knopf darunter ──
     Seit dem Sicherheits-Durchlauf am 12.8.2026 ist die Vollsicherung
     BETREIBER-Sache: exportieren() zieht die komplette Datenbank, also
     alle Kunden auf einmal. Fuer den Chef eines einzelnen Betriebs war
     das kein Knopf, sondern ein Missverstaendnis.

     Der Durchlauf prueft deshalb jetzt BEIDES: dem Chef bleibt er
     verborgen, und beim Betreiber ist er gross genug zum Antippen.
     Nur „ist weg" zu pruefen waere die halbe Miete — ein Knopf, den
     auch der Betreiber nicht mehr sieht, waere kein Fortschritt. */
  const knopf = await page.evaluate(() => {
    const b = document.getElementById('backupNow');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { hoehe: Math.round(r.height), text: b.textContent.trim() };
  });
  console.log('Knopf beim Chef:', JSON.stringify(knopf));
  if (!knopf) errs.push('FEHLT: Knopf "Jetzt zusaetzlich sichern" gibt es gar nicht mehr');
  if (knopf && knopf.hoehe > 0) {
    errs.push('ZU VIEL: der Chef eines Betriebs sieht die Vollsicherung ueber ALLE Kunden');
  }

  await page.screenshot({ path: SP + '/sicherung-stand.png' });
  await b.close();

  /* Die Gegenrichtung, im eigenen Fenster: beim BETREIBER muss der Knopf
     da und antippbar sein. Ohne diesen Teil wuerde die Pruefung oben
     auch dann gruen bleiben, wenn der Knopf fuer alle verschwunden
     waere — und die Vollsicherung von Hand gaebe es gar nicht mehr. */
  {
    const b2 = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    const p2 = await b2.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    p2.on('pageerror', e => errs.push('PAGEERROR (Betreiber): ' + e.message.slice(0, 200)));
    await p2.route('**://www.gstatic.com/**', r => r.abort());
    await p2.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
    await p2.addInitScript('window.__admin = true;');
    await p2.addInitScript({ path: SP + '/stub-chef.js' });
    await p2.goto(APP, { waitUntil: 'domcontentloaded' });
    await p2.waitForTimeout(2800);
    const alsAdmin = await p2.evaluate(async () => {
      const g = document.querySelector('.mobnav [data-group="g-chef"]');
      if (g) g.click();
      await new Promise(r => setTimeout(r, 400));
      const t = document.querySelector('#chefHome [data-cgo="system"]');
      if (t) t.click();
      await new Promise(r => setTimeout(r, 800));
      const el = document.getElementById('backupNow');
      if (!el) return null;
      const r2 = el.getBoundingClientRect();
      return Math.round(r2.height);
    });
    console.log('Knopf beim Betreiber, Hoehe:', alsAdmin);
    if (!alsAdmin) errs.push('FEHLT: auch der Betreiber sieht die Vollsicherung nicht mehr');
    else if (alsAdmin < 44) errs.push('FINGERZIEL: Sicherungs-Knopf nur ' + alsAdmin + 'px hoch');
    await b2.close();
  }

  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ') : '\n✓ Sicherung: Stand wird sichtbar gemeldet, Vollsicherung nur beim Betreiber');
  process.exit(errs.length ? 1 : 0);
})();
