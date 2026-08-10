/* Nachladen statt beim Start laden.

   Nachweise, Papierkorb und Wochen-Sicherungen hängen nicht mehr am
   App-Start, sondern an der Ansicht, die sie braucht. Das spart beim Chef
   knapp 200 Lesevorgänge je Start – kann aber zwei Dinge kaputtmachen:

     1. Der Beobachter startet gar nicht mehr, die Karte bleibt leer.
     2. Er startet zu spät, und die Zahl auf der Kachel bleibt weg, weil
        sie schon gezeichnet war, als die Daten ankamen.

   Beides wird hier geprüft – mit der grossen Datenmenge aus stub-last.js,
   damit man auch sieht, ob überhaupt etwas ankommt.                     */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const ZAEHLER = `
(function(){
  window.__pfade = [];
  var fs = window.firebase.firestore(); var echt = fs.collection.bind(fs);
  fs.collection = function(p){
    var k = echt(p);
    var s = k.onSnapshot;
    if (s) k.onSnapshot = function(){ window.__pfade.push(p); return s.apply(k, arguments); };
    return k;
  };
})();`;

(async () => {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 160));
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript('window.__rolle = "chef";');
  await page.addInitScript({ path: SP + '/stub-last.js' });
  await page.addInitScript(ZAEHLER);
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const g = document.getElementById('homeGrid'); return g && g.children.length > 0;
  }, { timeout: 30000 }).catch(() => errs.push('Startseite blieb leer'));
  await page.waitForTimeout(2500);

  // ══ 1. Beim Start dürfen die drei NICHT dabei sein ══
  const beimStart = await page.evaluate(() => window.__pfade.slice());
  ['certificates', 'trash', 'archives'].forEach(p => {
    if (beimStart.indexOf(p) >= 0) errs.push('ZU FRÜH: „' + p + '" wird schon beim Start geladen');
  });
  console.log('Beim Start beobachtet:', [...new Set(beimStart)].join(', '));

  // ══ 2. Verwaltung öffnen → Nachweise und Papierkorb kommen nach ══
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
  await page.waitForTimeout(2000);
  const nachChef = await page.evaluate(() => window.__pfade.slice());
  if (nachChef.indexOf('certificates') < 0) errs.push('FEHLT: „certificates" startet auch in der Verwaltung nicht');
  if (nachChef.indexOf('trash') < 0) errs.push('FEHLT: „trash" startet auch in der Verwaltung nicht');

  // Die Kacheln müssen ihre Zahl NACHTRAGEN, obwohl sie schon gezeichnet waren
  const kacheln = await page.evaluate(() => {
    const lies = go => {
      const k = document.querySelector('#chefHome [data-cgo="' + go + '"]');
      return k ? k.textContent.replace(/\s+/g, ' ').trim() : null;
    };
    return { nachweise: lies('nachweise'), system: lies('system') };
  });
  console.log('Kacheln:', JSON.stringify(kacheln));
  if (!kacheln.nachweise || !/läuft bald ab/.test(kacheln.nachweise)) {
    errs.push('FEHLT: Kachel „Nachweise" trägt die Zahl nicht nach (' + kacheln.nachweise + ')');
  }
  if (!kacheln.system || !/im Papierkorb/.test(kacheln.system)) {
    errs.push('FEHLT: Kachel „System" trägt die Zahl nicht nach (' + kacheln.system + ')');
  }

  // ══ 3. Die Listen selbst sind gefüllt ══
  await page.evaluate(() => {
    const k = document.querySelector('#chefHome [data-cgo="nachweise"]'); if (k) k.click();
  });
  await page.waitForTimeout(900);
  const certZeilen = await page.evaluate(() => document.querySelectorAll('#certList .cert-row, #certList > div').length);
  console.log('Zeilen in der Nachweisliste:', certZeilen);
  if (!certZeilen) errs.push('FEHLT: Nachweisliste bleibt leer');

  // ══ 4. Archiv: Sicherungen kommen erst beim Öffnen ══
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const e = document.querySelector('[data-subview="archive"]'); if (e) e.click();
  });
  await page.waitForTimeout(1500);
  const nachArchiv = await page.evaluate(() => window.__pfade.slice());
  if (nachArchiv.indexOf('archives') < 0) errs.push('FEHLT: „archives" startet auch im Archiv nicht');
  const wochen = await page.evaluate(() => document.querySelectorAll('#weekArchives .wk-row').length);
  console.log('Wochen im Archiv:', wochen);
  if (!wochen) errs.push('FEHLT: Archivliste bleibt leer');

  // ══ 5. Zweites Öffnen legt keinen zweiten Beobachter an ══
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
  await page.waitForTimeout(800);
  const doppelt = await page.evaluate(() => {
    const p = window.__pfade;
    return {
      certificates: p.filter(x => x === 'certificates').length,
      trash: p.filter(x => x === 'trash').length,
      archives: p.filter(x => x === 'archives').length,
    };
  });
  console.log('Beobachter je Sammlung:', JSON.stringify(doppelt));
  Object.entries(doppelt).forEach(([k, n]) => {
    if (n > 1) errs.push('DOPPELT: „' + k + '" wird ' + n + '-mal beobachtet');
  });

  await page.screenshot({ path: SP + '/nachladen.png' });
  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ') : '\n✓ Nachladen: nichts hängt mehr unnötig am Start');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
