/* Leistungs-Durchlauf. Misst, statt zu schaetzen.
   Aufruf:  node tests/audit-leistung.js [rolle]

   Gemessen wird:
     1. Datenbankzugriffe  – bei Firebase ist jeder Lesevorgang Geld.
                             Gezaehlt je Pfad, getrennt nach einmaligem
                             get() und dauerhaftem onSnapshot-Beobachter.
     2. Speicher & Zuhoerer – nach 3 Runden durch alle Ansichten. Die App
                             ruft 258-mal addEventListener und kein
                             einziges Mal removeEventListener; ein
                             Studio-Tablet laeuft aber tagelang durch.
     3. Ladephase          – mit 4-fach gedrosselter CPU, wie ein
                             mittelmaessiges Android-Geraet.
     4. Lange Aufgaben     – alles ueber 50 ms blockiert die Eingabe.
     5. Bild pro Sekunde   – beim schnellen Scrollen durch den Chat.

   Was NICHT gemessen wird und auch nicht behauptet werden darf: echte
   Ladezeit im Netz (die Firebase-SDKs sind im Test abgeklemmt) und das
   Verhalten bei Datenmengen, die es hier nicht gibt.                   */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const NAV = [
  ['home', 'g-start'], ['chat', 'g-komm'], ['dm', 'g-komm'], ['ann', 'g-komm'],
  ['todos', 'g-arbeit'], ['putzplan', 'g-arbeit'], ['material', 'g-arbeit'],
  ['geraete', 'g-arbeit'], ['docs', 'g-arbeit'], ['team', 'g-team'],
  ['chef', 'g-chef'], ['archive', 'g-chef'],
];

// Zaehlt jeden Firestore-Zugriff. Laeuft NACH dem Stub und legt sich um
// dessen collection()-Funktion.
const ZAEHLER = `
(function(){
  window.__db = { get: {}, snap: {}, getGesamt: 0, snapGesamt: 0, offen: 0 };
  var fs = window.firebase && window.firebase.firestore();
  if (!fs || !fs.collection) return;
  var echt = fs.collection.bind(fs);
  function kurz(p){ return String(p).replace(/studio-\\d+/g,'{studio}').replace(/\\/[^/]{15,}$/,'/{id}'); }
  function umhuellen(k, pfad){
    // WICHTIG: nur EINMAL je Objekt umhuellen. Der Stub (und Firestore
    // selbst bei manchen Ketten) gibt bei orderBy()/limit() dasselbe
    // Objekt zurueck. Ohne diese Sperre wickelt man onSnapshot mehrfach
    // ein und zaehlt die Laenge der Abfragekette statt der Beobachter -
    // aus 14 Studios werden dann 28.
    if (k.__gezaehlt) return k;
    try { Object.defineProperty(k, '__gezaehlt', { value: true, enumerable: false }); }
    catch (e) { return k; }
    var g = k.get, s = k.onSnapshot, d = k.doc, w = k.where, o = k.orderBy, l = k.limit;
    if (g) k.get = function(){ var p=kurz(pfad); window.__db.get[p]=(window.__db.get[p]||0)+1; window.__db.getGesamt++; return g.apply(k, arguments); };
    if (s) k.onSnapshot = function(){
      var p=kurz(pfad); window.__db.snap[p]=(window.__db.snap[p]||0)+1; window.__db.snapGesamt++; window.__db.offen++;
      var ab = s.apply(k, arguments);
      return function(){ window.__db.offen--; return typeof ab==='function' ? ab() : undefined; };
    };
    if (d) k.doc = function(id){ return umhuellen(d.call(k,id), pfad+'/'+id); };
    if (w) k.where = function(){ return umhuellen(w.apply(k,arguments), pfad); };
    if (o) k.orderBy = function(){ return umhuellen(o.apply(k,arguments), pfad); };
    if (l) k.limit = function(){ return umhuellen(l.apply(k,arguments), pfad); };
    if (k.collection) { var c=k.collection; k.collection=function(sub){ return umhuellen(c.call(k,sub), pfad+'/'+sub); }; }
    return k;
  }
  fs.collection = function(p){ return umhuellen(echt(p), p); };
})();
`;

const BEOBACHTER = `
(function(){
  window.__lang = [];
  try {
    new PerformanceObserver(function(l){
      l.getEntries().forEach(function(e){ if(e.duration>50) window.__lang.push(Math.round(e.duration)); });
    }).observe({ entryTypes: ['longtask'] });
  } catch(e){}
})();
`;

async function geheZu(page, view, gruppe) {
  await page.evaluate(g => { const e = document.querySelector('.mobnav [data-group="' + g + '"]'); if (e) e.click(); }, gruppe);
  await page.waitForTimeout(240);
  await page.evaluate(v => { const s = document.querySelector('[data-subview="' + v + '"]'); if (s) s.click(); }, view);
  await page.waitForTimeout(240);
  return page.evaluate(v => { const e = document.getElementById('view-' + v); return !!e && e.offsetParent !== null; }, view);
}

(async () => {
  const rolle = process.argv[2] || 'chef';
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--js-flags=--expose-gc'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-' + rolle + '.js' });
  await page.addInitScript(ZAEHLER);
  await page.addInitScript(BEOBACHTER);

  // ── CPU drosseln: ein mittelmaessiges Android-Geraet ist rund 4-mal
  //    langsamer als dieser Rechner. Ohne Drosselung misst man nur, wie
  //    schnell der eigene Rechner ist.
  const cdp = await page.context().newCDPSession(page);
  const DROSSEL = Number(process.env.DROSSEL || 4);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: DROSSEL });

  const t0 = Date.now();
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  await page.mouse.click(195, 400).catch(() => {});
  // Warten, bis die Startseite wirklich steht
  await page.waitForFunction(() => {
    const v = document.getElementById('view-home');
    return v && v.offsetParent !== null && v.textContent.length > 200;
  }, { timeout: 30000 }).catch(() => {});
  const bereit = Date.now() - t0;

  const zeiten = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0] || {};
    const p = performance.getEntriesByType('paint');
    const fp = p.find(x => x.name === 'first-contentful-paint');
    return {
      domInteractive: Math.round(n.domInteractive || 0),
      domComplete: Math.round(n.domComplete || 0),
      ersteFarbe: fp ? Math.round(fp.startTime) : null,
      skriptAuswertung: Math.round((n.domContentLoadedEventEnd || 0) - (n.responseEnd || 0)),
    };
  });

  const nachStart = await page.evaluate(() => JSON.parse(JSON.stringify(window.__db)));

  // ── Drei Runden durch alle Ansichten: waechst etwas mit? ──
  const messung = async () => page.evaluate(() => {
    if (window.gc) window.gc();
    return {
      knoten: document.querySelectorAll('*').length,
      speicherMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576 * 10) / 10 : null,
      offeneBeobachter: window.__db.offen,
    };
  });
  const runden = [];
  for (let r = 0; r < 3; r++) {
    for (const [v, g] of NAV) await geheZu(page, v, g);
    await page.waitForTimeout(500);
    runden.push(await messung());
  }
  const nachRunden = await page.evaluate(() => JSON.parse(JSON.stringify(window.__db)));

  // ── Scrollen im Chat: kommen die Bilder mit? ──
  await geheZu(page, 'chat', 'g-komm');
  await page.waitForTimeout(400);
  const fps = await page.evaluate(async () => {
    const sc = document.querySelector('#view-chat .chat-scroll') ||
               document.querySelector('#view-chat .scroll-area');
    if (!sc) return null;
    let bilder = 0; let laeuft = true;
    const zaehl = () => { if (laeuft) { bilder++; requestAnimationFrame(zaehl); } };
    requestAnimationFrame(zaehl);
    const start = performance.now();
    for (let i = 0; i < 40; i++) {
      sc.scrollTop = (i % 2 === 0) ? 0 : sc.scrollHeight;
      await new Promise(r => setTimeout(r, 25));
    }
    laeuft = false;
    const dauer = performance.now() - start;
    return { fps: Math.round(bilder / (dauer / 1000)), dauerMs: Math.round(dauer) };
  });

  const lang = await page.evaluate(() => window.__lang.slice());

  // ── Ausgabe ──
  const top = (o, n) => Object.entries(o).sort((a, c) => c[1] - a[1]).slice(0, n);
  console.log('\n════ LEISTUNG · Rolle ' + rolle + ' · CPU ' + DROSSEL + '-fach gedrosselt ════');
  console.log('\n── 1. Datenbankzugriffe beim Start ──');
  console.log('   einmalige Abfragen (get):   ' + nachStart.getGesamt);
  console.log('   dauerhafte Beobachter:      ' + nachStart.snapGesamt + '  (davon offen: ' + nachStart.offen + ')');
  console.log('   Beobachter je Pfad:');
  top(nachStart.snap, 12).forEach(([p, n]) => console.log('      ' + String(n).padStart(3) + '×  ' + p));
  if (nachStart.getGesamt) {
    console.log('   Abfragen je Pfad:');
    top(nachStart.get, 8).forEach(([p, n]) => console.log('      ' + String(n).padStart(3) + '×  ' + p));
  }

  console.log('\n── 2. Nach 3 Runden durch alle 12 Ansichten ──');
  runden.forEach((r, i) => console.log('   Runde ' + (i + 1) + ': ' + r.knoten + ' Knoten · ' +
    (r.speicherMB !== null ? r.speicherMB + ' MB' : 'Speicher n/a') + ' · ' + r.offeneBeobachter + ' offene Beobachter'));
  console.log('   Zugriffe gesamt danach: ' + nachRunden.getGesamt + ' get, ' +
    nachRunden.snapGesamt + ' Beobachter angelegt, ' + nachRunden.offen + ' noch offen');

  console.log('\n── 3. Ladephase (gedrosselt) ──');
  console.log('   erste Farbe:        ' + zeiten.ersteFarbe + ' ms');
  console.log('   DOM bedienbar:      ' + zeiten.domInteractive + ' ms');
  console.log('   Skript auswerten:   ' + zeiten.skriptAuswertung + ' ms');
  console.log('   bis Startseite da:  ' + bereit + ' ms  (enthält Wartezeiten des Stubs)');

  console.log('\n── 4. Lange Aufgaben (>50 ms) ──');
  console.log('   Anzahl: ' + lang.length + (lang.length ? '  längste: ' + Math.max(...lang) + ' ms' : ''));
  if (lang.length) console.log('   alle: ' + lang.slice(0, 20).join(', '));

  console.log('\n── 5. Scrollen im Chat ──');
  console.log('   ' + (fps ? fps.fps + ' Bilder/s über ' + fps.dauerMs + ' ms' : 'kein Scrollbereich gefunden'));

  await b.close();
})();
