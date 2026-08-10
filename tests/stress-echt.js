/* Lasttest in echter Betriebsgröße – 14 Studios, ein Jahr Daten.

   Aufruf:  node tests/stress-echt.js
            FAKTOR=3 node tests/stress-echt.js     (dreifache Datenmenge)

   Gemessen wird, was sich hier auch WIRKLICH messen lässt:
     1. Wie viele Dokumente die App bei EINEM Start liest.
        Das ist bei Firestore direkt Geld: jeder gelesene Datensatz zählt.
     2. Wie lange der Start dauert und wie lange jede Ansicht braucht,
        bei ungedrosselter und bei 4-fach gedrosselter CPU.
     3. Wie viele Knoten im Fenster stehen und wie viel Speicher belegt ist.
     4. Bilder pro Sekunde beim Scrollen durch 120 Chatnachrichten.
     5. Wie viele Beobachter gleichzeitig offen sind.

   Was hier NICHT gemessen wird und deshalb auch nicht behauptet werden
   darf: echte Netzlaufzeiten (die Firebase-SDKs sind abgeklemmt),
   Verhalten bei gleichzeitigen Schreibvorgängen mehrerer Geräte und die
   tatsächliche Größe der Datenbank in Gigabyte.                        */
const { chromium } = require('playwright');
const fs = require('fs');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const FAKTOR = Number(process.env.FAKTOR || 1);

/* ── Annahmen über den Betrieb. Offen hier, damit man sie ändern kann. ── */
const BETRIEB = {
  studios: 14,
  konten: 57,            // 14 × 4 + Chef
  startsProTagUndKopf: 6,  // App morgens auf, zwischendurch, abends
  arbeitstageProMonat: 30, // Studios haben auch am Wochenende offen
};

/* Firestore-Preise, Stand August 2026, Region europe-west1, in US-Dollar.
   Quelle: firebase.google.com/pricing. Bitte vor jeder Rechnung
   gegenprüfen – Preise ändern sich, und diese Zahlen stammen nicht aus
   einer Live-Abfrage. */
const PREIS = {
  freiLesenProTag: 50000,
  freiSchreibenProTag: 20000,
  proLesen: 0.06 / 100000,      // $ je Dokument
  proSchreiben: 0.18 / 100000,
  proGiBMonat: 0.18,
  usdInEur: 0.92,
};

const NAV = [
  ['home', 'g-start'], ['chat', 'g-komm'], ['ann', 'g-komm'],
  ['todos', 'g-arbeit'], ['putzplan', 'g-arbeit'], ['material', 'g-arbeit'],
  ['geraete', 'g-arbeit'], ['docs', 'g-arbeit'], ['team', 'g-team'],
  ['chef', 'g-chef'], ['archive', 'g-chef'],
];

// Zählt Zugriffe UND gelieferte Dokumente. Legt sich um den Stub.
const ZAEHLER = `
(function(){
  window.__db = { snap:{}, get:{}, docs:{}, snapGesamt:0, getGesamt:0, docsGesamt:0, offen:0, maxOffen:0 };
  var fs = window.firebase && window.firebase.firestore();
  if (!fs || !fs.collection) return;
  var echt = fs.collection.bind(fs);
  function kurz(p){ return String(p).replace(/studio-\\d+/g,'{studio}').replace(/allgemein|studio-\\d+/g,'{kanal}'); }
  function zaehleDocs(pfad, sn){
    var n = sn && typeof sn.size === 'number' ? sn.size : (sn && sn.docs ? sn.docs.length : 1);
    var p = kurz(pfad);
    window.__db.docs[p] = (window.__db.docs[p]||0) + n;
    window.__db.docsGesamt += n;
    return sn;
  }
  function umhuellen(k, pfad){
    if (!k || k.__gezaehlt) return k;
    try { Object.defineProperty(k, '__gezaehlt', { value:true, enumerable:false }); } catch(e){ return k; }
    var g=k.get, s=k.onSnapshot, d=k.doc, w=k.where, o=k.orderBy, l=k.limit, lt=k.limitToLast, c=k.collection;
    if (g) k.get = function(){
      var p=kurz(pfad); window.__db.get[p]=(window.__db.get[p]||0)+1; window.__db.getGesamt++;
      return g.apply(k, arguments).then(function(sn){ return zaehleDocs(pfad, sn); });
    };
    if (s) k.onSnapshot = function(cb){
      var p=kurz(pfad); window.__db.snap[p]=(window.__db.snap[p]||0)+1; window.__db.snapGesamt++;
      window.__db.offen++; if(window.__db.offen>window.__db.maxOffen) window.__db.maxOffen=window.__db.offen;
      var args = [].slice.call(arguments);
      if (typeof cb === 'function') args[0] = function(sn){ zaehleDocs(pfad, sn); return cb(sn); };
      var ab = s.apply(k, args);
      return function(){ window.__db.offen--; return typeof ab==='function' ? ab() : undefined; };
    };
    if (d) k.doc = function(id){ return umhuellen(d.call(k,id), pfad+'/'+id); };
    if (w) k.where = function(){ return umhuellen(w.apply(k,arguments), pfad); };
    if (o) k.orderBy = function(){ return umhuellen(o.apply(k,arguments), pfad); };
    if (l) k.limit = function(){ return umhuellen(l.apply(k,arguments), pfad); };
    if (lt) k.limitToLast = function(){ return umhuellen(lt.apply(k,arguments), pfad); };
    if (c) k.collection = function(sub){ return umhuellen(c.call(k,sub), pfad+'/'+sub); };
    return k;
  }
  fs.collection = function(p){ return umhuellen(echt(p), p); };
})();
`;

const LANGE = `
(function(){
  window.__lang = [];
  try { new PerformanceObserver(function(l){
    l.getEntries().forEach(function(e){ if(e.duration>50) window.__lang.push(Math.round(e.duration)); });
  }).observe({ entryTypes:['longtask'] }); } catch(e){}
})();`;

async function geheZu(page, view, gruppe) {
  const t0 = Date.now();
  await page.evaluate(g => { const e = document.querySelector('.mobnav [data-group="' + g + '"]'); if (e) e.click(); }, gruppe);
  await page.waitForTimeout(120);
  await page.evaluate(v => {
    const e = document.querySelector('[data-subview="' + v + '"]');
    if (e) e.click();
  }, view);
  await page.waitForTimeout(280);
  return Date.now() - t0;
}

function zeile(a, b, c) {
  return '  ' + String(a).padEnd(30) + String(b).padStart(10) + (c ? '  ' + c : '');
}

async function neueSeite(browser, rolle, fehler, mitZaehler) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => fehler.push('[' + rolle + '] PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) fehler.push('[' + rolle + '] ' + m.text().slice(0, 160));
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.addInitScript(`window.__rolle = ${JSON.stringify(rolle)};`);
  if (FAKTOR !== 1) {
    await page.addInitScript(`window.__menge = { aufgaben:${15 * FAKTOR}, putzen:${12 * FAKTOR}, putznotizen:${20 * FAKTOR}, geraeteLog:${60 * FAKTOR}, schichten:${84 * FAKTOR}, dokumente:${80 * FAKTOR}, aushaenge:${40 * FAKTOR}, nachweise:${110 * FAKTOR} };`);
  }
  await page.addInitScript({ path: SP + '/stub-last.js' });
  if (mitZaehler) { await page.addInitScript(ZAEHLER); await page.addInitScript(LANGE); }
  return page;
}

async function starten(page) {
  const t0 = Date.now();
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  const leer = await page.waitForFunction(() => {
    const g = document.getElementById('homeGrid');
    return g && g.children.length > 0;
  }, { timeout: 30000 }).then(() => false).catch(() => true);
  const gefuellt = Date.now() - t0;
  // Warten, bis der Zähler stillsteht. Sonst landen Beobachter, die noch
  // unterwegs sind, in der Messung des nächsten Schritts – dann sieht eine
  // harmlose Ansicht plötzlich nach 462 Lesevorgängen aus.
  let vor = -1, gleich = 0;
  for (let i = 0; i < 60 && gleich < 4; i++) {
    await page.waitForTimeout(250);
    const n = await page.evaluate(() => (window.__db ? window.__db.docsGesamt : 0));
    gleich = (n === vor) ? gleich + 1 : 0; vor = n;
  }
  return { gefuellt, ruhig: Date.now() - t0, leer };
}

(async () => {
  const fehler = [];
  const bericht = [];
  const sag = t => { console.log(t); bericht.push(t); };

  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--js-flags=--expose-gc'] });

  /* ══════════ 1. Ein Start je Rolle ══════════ */
  const rollen = {};
  for (const rolle of ['mitarbeiter', 'leiter', 'chef']) {
    const p = await neueSeite(browser, rolle, fehler, true);
    const z = await starten(p);
    if (z.leer) fehler.push('[' + rolle + '] Startseite blieb leer');
    rollen[rolle] = {
      ...z,
      db: await p.evaluate(() => JSON.parse(JSON.stringify(window.__db))),
      knoten: await p.evaluate(() => document.querySelectorAll('*').length),
    };
    if (rolle === 'chef') rollen.daten = await p.evaluate(() => window.__lastDaten);
    await p.close();
  }
  const daten = rollen.daten;

  sag('');
  sag('══════════════════════════════════════════════════════════════');
  sag('  LASTTEST IN ECHTER GRÖSSE   (Faktor ' + FAKTOR + ')');
  sag('══════════════════════════════════════════════════════════════');
  sag('');
  sag('DATENBESTAND IM TEST');
  sag(zeile('Studios', daten.studios));
  sag(zeile('Konten', daten.konten));
  sag(zeile('Dokumente in der DB (ca.)', daten.dokumenteGesamt.toLocaleString('de-DE')));
  sag(zeile('Chatnachrichten je Kanal', daten.menge.nachrichten));
  sag(zeile('Schichten je Studio', daten.menge.schichten + '  (6 Wochen, 2 am Tag)'));
  sag('');
  sag('EIN APP-START – JE ROLLE');
  sag('  ' + 'Rolle'.padEnd(16) + 'gelesen'.padStart(9) + 'Beobachter'.padStart(12) +
    'Knoten'.padStart(9) + 'bis gefüllt'.padStart(13));
  for (const r of ['mitarbeiter', 'leiter', 'chef']) {
    const x = rollen[r];
    sag('  ' + r.padEnd(16) + String(x.db.docsGesamt).padStart(9) +
      String(x.db.maxOffen).padStart(12) + String(x.knoten).padStart(9) +
      (x.gefuellt + ' ms').padStart(13));
  }

  /* ══════════ Von hier an: der Chef, also der schwerste Fall ══════════ */
  const page = await neueSeite(browser, 'chef', fehler, true);
  const zeit = await starten(page);
  const nachStart = await page.evaluate(() => JSON.parse(JSON.stringify(window.__db)));
  const knotenStart = await page.evaluate(() => document.querySelectorAll('*').length);
  const tGefuellt = zeit.gefuellt, tFertig = zeit.ruhig;

  sag('');
  sag('DER SCHWERSTE FALL: DER CHEF MIT 14 STUDIOS');
  sag(zeile('Zeit bis Startseite gefüllt', tGefuellt + ' ms',
    tGefuellt > 3000 ? '← zu lang' : tGefuellt > 1500 ? 'grenzwertig' : 'gut'));
  sag(zeile('Zeit bis alles ruhig ist', tFertig + ' ms'));
  sag(zeile('Gelesene Dokumente', nachStart.docsGesamt));
  sag(zeile('Dauerbeobachter', nachStart.snapGesamt));
  sag(zeile('Einmalige Abfragen', nachStart.getGesamt));
  sag(zeile('Knoten im Fenster', knotenStart));

  /* ══════════ 2. Durch alle Ansichten ══════════ */
  sag('');
  sag('JEDE ANSICHT EINMAL ÖFFNEN');
  sag('  ' + 'Ansicht'.padEnd(30) + 'Zeit'.padStart(10) + '  gelesen  Knoten');
  let vorher = nachStart.docsGesamt;
  const langsam = [];
  for (const [view, gruppe] of NAV) {
    const ms = await geheZu(page, view, gruppe);
    const jetzt = await page.evaluate(() => ({ d: window.__db.docsGesamt, k: document.querySelectorAll('*').length }));
    const gelesen = jetzt.d - vorher; vorher = jetzt.d;
    sag('  ' + view.padEnd(30) + (ms + ' ms').padStart(10) + String(gelesen).padStart(9) + String(jetzt.k).padStart(8));
    if (ms > 900) langsam.push(view + ' ' + ms + ' ms');
  }
  const nachRunde = await page.evaluate(() => JSON.parse(JSON.stringify(window.__db)));

  /* ══════════ 3. Chat scrollen ══════════ */
  await geheZu(page, 'chat', 'g-komm');
  await page.waitForTimeout(600);
  const fps = await page.evaluate(async () => {
    const box = document.getElementById('chatScroll');
    if (!box) return null;
    let bilder = 0, laeuft = true;
    const zaehl = () => { if (laeuft) { bilder++; requestAnimationFrame(zaehl); } };
    requestAnimationFrame(zaehl);
    const t0 = performance.now();
    for (let i = 0; i < 30; i++) {
      box.scrollTop = (i % 2) ? 0 : box.scrollHeight;
      await new Promise(r => setTimeout(r, 33));
    }
    laeuft = false;
    return Math.round(bilder / ((performance.now() - t0) / 1000));
  });

  /* ══════════ 4. Drei Runden – Speicher und Beobachter ══════════ */
  for (let r = 0; r < 2; r++) for (const [view, gruppe] of NAV) await geheZu(page, view, gruppe);
  await page.waitForTimeout(500);
  const ende = await page.evaluate(() => {
    if (window.gc) window.gc();
    return {
      db: JSON.parse(JSON.stringify(window.__db)),
      knoten: document.querySelectorAll('*').length,
      speicher: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
      lang: window.__lang.length, langMax: Math.max(0, ...window.__lang),
    };
  });

  sag('');
  sag('NACH DREI RUNDEN DURCH ALLE ANSICHTEN');
  sag(zeile('Gelesene Dokumente gesamt', ende.db.docsGesamt));
  sag(zeile('Beobachter angelegt', ende.db.snapGesamt));
  sag(zeile('davon noch offen', ende.db.offen, ende.db.offen > 40 ? '← viele' : 'in Ordnung'));
  sag(zeile('Knoten im Fenster', ende.knoten, ende.knoten > knotenStart * 1.6 ? '← wächst' : 'stabil'));
  if (ende.speicher !== null) sag(zeile('Speicher (JS-Heap)', ende.speicher + ' MB'));
  sag(zeile('Aufgaben über 50 ms', ende.lang, ende.langMax ? 'längste ' + ende.langMax + ' ms' : ''));
  sag(zeile('Bilder pro Sekunde im Chat', fps === null ? 'nicht messbar' : fps,
    fps === null ? '' : (fps >= 50 ? 'flüssig' : fps >= 30 ? 'sichtbar' : '← ruckelt')));

  /* ══════════ 5. Die teuersten Pfade ══════════ */
  sag('');
  sag('WO DIE LESEVORGÄNGE ANFALLEN  (nach einem Start + einer Runde)');
  const pfade = Object.entries(nachRunde.docs).sort((a, b) => b[1] - a[1]).slice(0, 12);
  pfade.forEach(([p, n]) => sag(zeile(p.slice(0, 30), n)));

  /* ══════════ 6. Gedrosselt starten ══════════ */
  const seite2 = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await seite2.route('**://www.gstatic.com/**', r => r.abort());
  await seite2.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await seite2.route('**fonts.googleapis.com/**', r => r.abort());
  await seite2.addInitScript({ path: SP + '/stub-last.js' });
  const cdp = await seite2.context().newCDPSession(seite2);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const t2 = Date.now();
  await seite2.goto(APP, { waitUntil: 'domcontentloaded' });
  await seite2.waitForFunction(() => {
    const g = document.getElementById('homeGrid');
    return g && g.children.length > 0;
  }, { timeout: 60000 }).catch(() => {});
  const tGedrosseltGefuellt = Date.now() - t2;
  await seite2.waitForTimeout(2000);
  const tGedrosselt = Date.now() - t2;
  await seite2.screenshot({ path: SP + '/last-start.png' });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await seite2.close();

  sag('');
  sag('LADEN AUF EINEM LANGSAMEN GERÄT');
  sag(zeile('Startseite gefüllt (CPU ÷ 4)', tGedrosseltGefuellt + ' ms',
    tGedrosseltGefuellt > 8000 ? '← zu lang' : tGedrosseltGefuellt > 4000 ? 'grenzwertig' : 'in Ordnung'));
  sag(zeile('bis alles ruhig ist (CPU ÷ 4)', tGedrosselt + ' ms'));

  /* ══════════ 7. Rechnung ══════════ */
  // Nicht mit dem Chef rechnen: so sieht genau EIN Konto von 57 die App.
  const proStartMA = rollen.mitarbeiter.db.docsGesamt;
  const proStartLtg = rollen.leiter.db.docsGesamt;
  const proStartChef = rollen.chef.db.docsGesamt;
  const anzChef = 1, anzLtg = BETRIEB.studios, anzMA = BETRIEB.konten - anzChef - anzLtg;
  const proTag = (proStartMA * anzMA + proStartLtg * anzLtg + proStartChef * anzChef)
    * BETRIEB.startsProTagUndKopf;
  const ueber = Math.max(0, proTag - PREIS.freiLesenProTag);
  const usdMonat = ueber * PREIS.proLesen * BETRIEB.arbeitstageProMonat;

  // Schreibvorgänge sind geschätzt, nicht gemessen – das sagen wir auch so.
  const schreibProTag = BETRIEB.konten * 25;   // Aufgaben abhaken, Nachrichten, Anwesenheit
  const schreibUeber = Math.max(0, schreibProTag - PREIS.freiSchreibenProTag);
  const usdSchreibMonat = schreibUeber * PREIS.proSchreiben * BETRIEB.arbeitstageProMonat;

  sag('');
  sag('══════════════════════════════════════════════════════════════');
  sag('  WAS DAS IM MONAT KOSTET');
  sag('══════════════════════════════════════════════════════════════');
  sag('');
  sag('Annahmen (oben in dieser Datei unter BETRIEB frei änderbar):');
  sag(zeile('Konten gesamt', BETRIEB.konten, anzMA + ' Mitarbeiter, ' + anzLtg + ' Leitung, 1 Chef'));
  sag(zeile('App-Starts je Person und Tag', BETRIEB.startsProTagUndKopf));
  sag(zeile('Tage im Monat', BETRIEB.arbeitstageProMonat));
  sag('');
  sag('Gemessen – Lesevorgänge je Start:');
  sag(zeile('Mitarbeiter', proStartMA, '× ' + anzMA));
  sag(zeile('Leitung', proStartLtg, '× ' + anzLtg));
  sag(zeile('Chef', proStartChef, '× ' + anzChef));
  sag('');
  sag('Gerechnet:');
  sag(zeile('Lesevorgänge je Tag', Math.round(proTag).toLocaleString('de-DE')));
  sag(zeile('Freikontingent je Tag', PREIS.freiLesenProTag.toLocaleString('de-DE')));
  sag(zeile('Kostenpflichtig je Tag', Math.round(ueber).toLocaleString('de-DE'),
    ueber === 0 ? '← alles frei' : ''));
  sag(zeile('Lesen je Monat', (usdMonat * PREIS.usdInEur).toFixed(2) + ' €'));
  sag(zeile('Schreiben je Monat (geschätzt)', (usdSchreibMonat * PREIS.usdInEur).toFixed(2) + ' €'));
  sag(zeile('Summe je Monat', ((usdMonat + usdSchreibMonat) * PREIS.usdInEur).toFixed(2) + ' €'));
  sag('');
  sag('Nicht in dieser Rechnung: Speicherplatz, Cloud Functions, KI-Aufrufe,');
  sag('Push und die nächtliche Sicherung. Preise Stand August 2026, nicht');
  sag('live abgefragt. Firestore kann beim Neustart auf den lokalen Zwischen-');
  sag('speicher zurückgreifen und nur Änderungen nachladen – wie oft das');
  sag('greift, lässt sich hier nicht messen. Die echte Zahl steht in der');
  sag('Firebase-Konsole unter Firestore → Nutzung.');

  /* ══════════ 8. Wo die Grenze liegt ══════════ */
  const schnitt = proTag / BETRIEB.konten / BETRIEB.startsProTagUndKopf;
  const kopfGrenze = Math.floor(PREIS.freiLesenProTag / (schnitt * BETRIEB.startsProTagUndKopf));
  sag('');
  sag('AB WANN WIRD ES KOSTENPFLICHTIG');
  sag(zeile('Lesevorgänge je Start (Schnitt)', Math.round(schnitt)));
  sag(zeile('Konten im Freikontingent', kopfGrenze, 'bei ' + BETRIEB.startsProTagUndKopf + ' Starts am Tag'));
  sag(zeile('Studios (bei 4 Personen)', Math.floor(kopfGrenze / 4)));

  sag('');
  if (fehler.length) {
    sag('FEHLER WÄHREND DES LAUFS');
    [...new Set(fehler)].slice(0, 12).forEach(f => sag('  ✗ ' + f));
  } else {
    sag('✓ Keine Fehler in der Konsole während des gesamten Laufs.');
  }
  if (langsam.length) sag('Langsame Ansichten: ' + langsam.join(', '));

  await page.screenshot({ path: SP + '/last-chef.png', fullPage: false });
  fs.writeFileSync(SP + '/last-bericht.txt', bericht.join('\n') + '\n');
  await browser.close();
  process.exit(0);
})();
