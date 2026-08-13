/* ── Der Weg in die Google-Tabelle ────────────────────────────────────
   Bis 13.8.2026 hat der Browser die Daten selbst an die
   Apps-Script-Web-App geschickt. Deren Adresse musste dafür in
   konfig.js stehen — also im Quelltext, den jeder Besucher bekommt, und
   geprüft hat die Web-App nichts.

   Jetzt ruft die App die Cloud Function sheetsPush auf. Geprüft wird
   hier deshalb beides: dass der Aufruf ankommt UND dass der Browser
   script.google.com überhaupt nicht mehr anfasst. Die zweite Hälfte ist
   die wichtigere — eine vergessene Sendestelle sieht man sonst nicht,
   sie funktioniert ja weiter.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) console.log('  ✓ ' + name);
  else { console.log('  ✗ ' + name + (zusatz ? '  — ' + zusatz : '')); errs.push(name); }
}

/* Aufrufe an Cloud Functions mitschreiben. Der Aufsatz legt sich über
   die Attrappe, damit sie unverändert bleibt. */
const MITSCHRIFT = `
  (function () {
    window.__rufe = [];
    var alt = window.firebase.functions;
    window.firebase.functions = function () {
      var f = alt.apply(window.firebase, arguments);
      return { httpsCallable: function (name) {
        var w = f.httpsCallable(name);
        return function (daten) {
          window.__rufe.push({ name: name, daten: JSON.parse(JSON.stringify(daten || {})) });
          return w(daten);
        };
      } };
    };
  })();
`;

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  /* Die Aufzeichnung haengt am Kontext, nicht an der einen Seite: die
     Gegenprobe unten braucht dieselbe. */
  const ktx = await b.newContext({ viewport: { width: 390, height: 900 } });

  /* Jede Anfrage an die Web-App wird festgehalten statt geblockt: ein
     abgewiesener Aufruf sähe im Protokoll aus wie keiner. */
  const anAppsScript = [];
  await ktx.route('**://www.gstatic.com/**', r => r.abort());
  await ktx.route('**fonts.googleapis.com/**', r => r.abort());
  await ktx.route('**script.google*.com/**', r => {
    anAppsScript.push(r.request().url());
    return r.fulfill({ status: 200, body: 'ok' });
  });

  const page = await ktx.newPage();
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));

  await page.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  await page.addInitScript(MITSCHRIFT);
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // ── 1. Eine Zahl im Material ändern ──
  await page.evaluate(async () => {
    const g = document.querySelector('.mobnav [data-group="g-arbeit"]');
    if (g) g.click();
    await new Promise(r => setTimeout(r, 250));
    const t = document.querySelector('[data-subview="material"]');
    if (t) t.click();
  });
  await page.waitForTimeout(1200);

  const geaendert = await page.evaluate(() => {
    const inp = document.querySelector('#matTable input.num.have');
    if (!inp) return false;
    inp.value = '7';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  });
  pruefe('Material: ein Zahlenfeld ist da und lässt sich ändern', geaendert);
  await page.waitForTimeout(1800);   // 700 ms Sammelzeit + Speichern

  let rufe = await page.evaluate(() => window.__rufe || []);
  const mat = rufe.filter(r => r.name === 'sheetsPush' && r.daten.art === 'material');
  pruefe('Material: die App ruft sheetsPush auf', mat.length >= 1,
    JSON.stringify(rufe.map(r => r.name)));

  const s0 = mat.length && mat[0].daten.studios && mat[0].daten.studios[0];
  pruefe('Material: Studio und Artikel liegen bei',
    !!(s0 && s0.studioKey && Array.isArray(s0.items) && s0.items.length),
    JSON.stringify(s0 || null).slice(0, 200));
  /* Wer gesendet hat, setzt die Function aus dem Profil. Käme das Feld
     aus dem Browser, könnte jeder einen fremden Namen in die Tabelle
     schreiben. */
  pruefe('Material: der Absender kommt NICHT aus dem Browser',
    !!s0 && s0.updatedBy === undefined, s0 ? String(s0.updatedBy) : '');
  pruefe('Material: die Adresse der Web-App steht nirgends in der Sendung',
    !/script\.google/.test(JSON.stringify(rufe)));

  // ── 2. Der Komplett-Abgleich des Chefs ──
  await page.evaluate(async () => {
    const g = document.querySelector('.mobnav [data-group="g-chef"]');
    if (g) g.click();
    await new Promise(r => setTimeout(r, 300));
    const k = document.querySelector('#chefHome [data-cgo="system"]') ||
              document.querySelector('#chefTabs [data-ctab="system"]');
    if (k) k.click();
    await new Promise(r => setTimeout(r, 400));
    const b = document.getElementById('syncSheetsBtn');
    if (b) b.click();
  });
  await page.waitForTimeout(2500);

  rufe = await page.evaluate(() => window.__rufe || []);
  const arten = rufe.filter(r => r.name === 'sheetsPush').map(r => r.daten.art);
  pruefe('Abgleich-Knopf: Material und Putzplan gehen raus',
    arten.indexOf('material') >= 0 && arten.indexOf('putzplan') >= 0,
    JSON.stringify(arten));

  // ── 3. Das Entscheidende: kein Kontakt zur Web-App ──
  pruefe('Der Browser ruft script.google.com kein einziges Mal auf',
    anAppsScript.length === 0, anAppsScript.join(' '));

  /* Gegenprobe. Ohne sie wäre auch ein Durchlauf grün, in dem die
     Aufzeichnung gar nicht greift — und der hätte nichts geprüft.

     Sie läuft auf einer leeren Seite, nicht in der App: seit dem 13.8.
     verbietet die Sicherheitsregel der App jede Verbindung nach
     script.google.com. Die Gegenprobe wäre also grün geblieben, ohne
     dass die Aufzeichnung je funktioniert hätte — der Test hätte sich
     selbst bestätigt. */
  {
    const leer = await ktx.newPage();
    await leer.setContent('<p>Gegenprobe</p>');
    await leer.evaluate(() =>
      fetch('https://script.google.com/macros/s/gegenprobe/exec').catch(() => {}));
    await leer.waitForTimeout(500);
    await leer.close();
  }
  pruefe('Gegenprobe: eine Anfrage dorthin würde auffallen',
    anAppsScript.length === 1, String(anAppsScript.length));

  /* Und der Nachweis, dass es nicht nur am Verzicht liegt: die Regel der
     App lässt eine solche Verbindung gar nicht erst zu. */
  const geblockt = await page.evaluate(() => new Promise(resolve => {
    let gesehen = false;
    document.addEventListener('securitypolicyviolation', function (e) {
      if (/script\.google/.test(String(e.blockedURI || ''))) gesehen = true;
    });
    fetch('https://script.google.com/macros/s/gegenprobe/exec').catch(() => {});
    setTimeout(() => resolve(gesehen), 600);
  }));
  pruefe('die Sicherheitsregel verbietet den alten Weg zusätzlich', geblockt === true);

  await page.screenshot({ path: path.join(SP, 'sheets.png') });
  await b.close();

  console.log(errs.length
    ? '\n✗ ' + errs.length + ' Fehler beim Tabellen-Abgleich'
    : '\n✓ Tabelle: die App sendet über sheetsPush und fasst die Web-App ' +
      'nicht mehr an');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
