/* ══════════════════════════════════════════════════════════════════════
   NACH EINER AUSLIEFERUNG KOMMT DER NEUE INHALT AUCH AN

   Aus dem Betrieb, 24.9.2026, einen Merge nach den EMS-Schulungen:
     „wo finde ich die neue schulung die ist niergends bei mir"

   Die Ursache: schulungen-basis.js kam mit max-age=604800 (eine Woche)
   vom Hoster. Beim Update holte der Service Worker seinen Vorrat mit
   addAll() — DURCH den HTTP-Zwischenspeicher des Browsers. Wer die
   Schulungen in der Woche davor einmal geöffnet hatte, bekam die alte
   Datei in den neuen Vorrat gelegt. VERSION hochzählen half nicht, so
   wie es der Kommentar in firebase.json versprach.

   Dieser Durchlauf stellt das nach, statt es nur zu behaupten:
   ein eigener kleiner Server liefert die App mit den ECHTEN Kopfzeilen
   aus firebase.json aus. Die App wird geöffnet, der Service Worker
   richtet sich ein, die Schulungsdatei wird gelesen. Dann ändert der
   Server die Datei und die VERSION im Service Worker — genau das, was
   eine Auslieferung tut —, die App holt das Update, und es wird
   nachgesehen, welche Fassung jetzt ankommt.

   Drei Lagen:
   1. JETZT (sw.js und firebase.json wie im Repo): die neue Fassung kommt an.
   2. Nur der Service Worker ist repariert, die Kopfzeilen stehen noch
      auf einer Woche: die neue Fassung kommt trotzdem an — die
      Reparatur hängt nicht an EINER Stelle.
   3. GEGENPROBE, der alte Stand (addAll ohne cache:'reload', eine
      Woche Zwischenspeicher): die ALTE Fassung kommt an. Ohne diese
      Gegenprobe wäre 1 auch dann grün, wenn der Durchlauf den Fehler
      gar nicht nachstellen kann.

   Was hier ersetzt wird, und warum: sw.js lädt das Firebase-SDK von
   gstatic.com für Push-Meldungen. Das lädt in dieser Umgebung nicht
   (Proxy-Zertifikat), und ohne es richtet sich der Service Worker gar
   nicht erst ein. Der Server ersetzt nur diese zwei importScripts-
   Zeilen durch eine leere Attrappe; der Teil, um den es hier geht —
   Vorrat und Abruf —, läuft unverändert.
   ══════════════════════════════════════════════════════════════════ */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const WURZEL = path.join(__dirname, '..');

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

/* Die Kopfzeilen aus firebase.json — dieselbe Musterlogik, soweit sie
   dort vorkommt: **, *, {a,b} und @(a|b). */
function muster(src) {
  let r = '';
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '*' && src[i + 1] === '*') { r += '.*'; i++; if (src[i + 1] === '/') i++; }
    else if (c === '*') r += '[^/]*';
    else if (c === '{') { const e = src.indexOf('}', i); r += '(' + src.slice(i + 1, e).split(',').join('|') + ')'; i = e; }
    else if (c === '@' && src[i + 1] === '(') { const e = src.indexOf(')', i); r += '(' + src.slice(i + 2, e) + ')'; i = e; }
    else r += c.replace(/[.+?^$()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + (r.startsWith('/') ? '' : '/?') + r + '$');
}
const HOSTING = JSON.parse(fs.readFileSync(path.join(WURZEL, 'firebase.json'), 'utf8')).hosting;
function kopfzeilen(pfad) {
  const aus = {};
  HOSTING.headers.forEach(h => {
    if (muster(h.source).test(pfad)) h.headers.forEach(k => { aus[k.key] = k.value; });
  });
  return aus;
}

const SW_ECHT = fs.readFileSync(path.join(WURZEL, 'sw.js'), 'utf8');
const ATTRAPPE = "self.firebase={initializeApp:function(){},messaging:function(){return{onBackgroundMessage:function(){}};}};";
/* Die Lage, die der Server gerade spielt. */
const lage = { version: 'vA', neu: false, alterSw: false, alteKopf: false };

function swText() {
  let s = SW_ECHT
    .replace(/importScripts\('https:\/\/www\.gstatic\.com[^']*'\);\n/g, '')
    .replace("importScripts('./konfig.js');", ATTRAPPE + "\nimportScripts('./konfig.js');")
    .replace(/const VERSION = '[^']*';/, "const VERSION = '" + lage.version + "';");
  if (lage.alterSw) {
    /* Der Stand vor dem 24.9.2026, Zeile für Zeile. */
    s = s.replace("PRECACHE.map(function (u) { return new Request(u, { cache: 'reload' }); })", 'PRECACHE')
         .replace("inhalt ? { cache: 'no-cache' } : undefined", 'undefined');
  }
  return s;
}

const server = http.createServer((req, res) => {
  const pfad = decodeURIComponent(req.url.split('?')[0]);
  const datei = path.join(WURZEL, pfad === '/' ? 'index.html' : pfad);
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    res.writeHead(404); return res.end();
  }
  let inhalt = fs.readFileSync(datei);
  if (pfad === '/sw.js') inhalt = Buffer.from(swText());
  if (pfad === '/schulungen-basis.js' && lage.neu)
    inhalt = Buffer.from(inhalt.toString('utf8').replace(/stand: '[^']*'/, "stand: 'NEU-PROBE'"));
  const kopf = kopfzeilen(pfad);
  if (lage.alteKopf && /-basis\.js$|ems-wissen\.js$/.test(pfad)) kopf['Cache-Control'] = 'public, max-age=604800';
  const typ = { '.js': 'text/javascript', '.html': 'text/html', '.svg': 'image/svg+xml',
    '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png' }[path.extname(datei)];
  /* Ein ETag wie beim Hoster, damit no-cache ein 304 bekommen kann. */
  const etag = '"' + require('crypto').createHash('sha1').update(inhalt).digest('hex') + '"';
  kopf.ETag = etag;
  if (typ) kopf['Content-Type'] = typ;
  delete kopf['Content-Security-Policy'];
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, kopf); return res.end(); }
  res.writeHead(200, kopf); res.end(inhalt);
});

/* Eine Lage durchspielen; zurück kommt, welcher `stand` am Ende in der
   App ankommt. */
async function spiele(b, port, name, einstellen) {
  Object.assign(lage, { version: 'vA', neu: false, alterSw: false, alteKopf: false });
  einstellen(lage);
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  const APP = 'http://127.0.0.1:' + port + '/index.html?demo=mitarbeiter';
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  const bereit = await p.evaluate(() => navigator.serviceWorker.ready.then(() => !!navigator.serviceWorker.controller || 'ohne controller'));
  if (bereit !== true) { await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500); }
  const lesen = () => p.evaluate(() => fetch('schulungen-basis.js').then(r => r.text())
    .then(t => (/stand: '([^']*)'/.exec(t) || [])[1]));
  const vorher = await lesen();

  // ── die Auslieferung ──
  lage.neu = true; lage.version = 'vB';
  await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r && r.update()));
  /* Die App lädt sich beim Wechsel des Service Workers selbst neu
     (controllerchange). Abwarten, bis die neue Version die Seite führt. */
  for (let i = 0; i < 30; i++) {
    await p.waitForTimeout(500);
    const v = await p.evaluate(() => caches.keys()).catch(() => []);
    if (v.includes('studiochat-vB') && !v.includes('studiochat-vA')) break;
  }
  await p.waitForTimeout(1500);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  const nachher = await lesen();
  const vorrat = await p.evaluate(() => caches.keys());
  await ctx.close();
  console.log('    ' + name + ': vorher ' + vorher + ', nachher ' + nachher + ', Vorrat ' + vorrat.join(','));
  return { vorher, nachher, vorrat };
}

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  // ── Die Kopfzeilen, wie sie im Repo stehen ──
  console.log('\n── firebase.json ──');
  for (const d of ['/schulungen-basis.js', '/loesungen-basis.js', '/ems-wissen.js']) {
    const k = kopfzeilen(d)['Cache-Control'] || '';
    pruefe(d + ' wird nicht ungefragt aus dem Zwischenspeicher genommen', /no-cache/.test(k) && !/max-age=[1-9]/.test(k), k);
  }
  pruefe('GEGENPROBE Schriften bleiben eine Woche im Zwischenspeicher',
    /max-age=604800/.test(kopfzeilen('/fonts/x.woff2')['Cache-Control'] || ''));

  console.log('\n── Eine Auslieferung, durchgespielt ──');
  const jetzt = await spiele(b, port, 'wie im Repo', () => {});
  pruefe('vor der Auslieferung steht die alte Fassung da', !!jetzt.vorher && jetzt.vorher !== 'NEU-PROBE', String(jetzt.vorher));
  pruefe('der neue Service Worker hat übernommen', jetzt.vorrat.includes('studiochat-vB'), jetzt.vorrat.join(','));
  pruefe('nach der Auslieferung kommt die NEUE Fassung an', jetzt.nachher === 'NEU-PROBE', String(jetzt.nachher));

  const nurSw = await spiele(b, port, 'nur Service Worker repariert', l => { l.alteKopf = true; });
  pruefe('auch bei einer Woche Zwischenspeicher kommt sie an — der Service Worker allein reicht',
    nurSw.nachher === 'NEU-PROBE', String(nurSw.nachher));

  const alt = await spiele(b, port, 'alter Stand', l => { l.alteKopf = true; l.alterSw = true; });
  pruefe('GEGENPROBE mit dem alten Stand bleibt die ALTE Fassung liegen — der Fehler ist nachgestellt',
    alt.vorrat.includes('studiochat-vB') && !!alt.nachher && alt.nachher !== 'NEU-PROBE',
    String(alt.nachher) + ' / ' + alt.vorrat.join(','));

  await b.close();
  server.close();
  console.log(schlecht
    ? '\n✗ Zwischenspeicher: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Zwischenspeicher: nach einer Auslieferung kommt der neue Inhalt an, mit nachgestelltem Fehler als Gegenprobe — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); server.close(); process.exit(1); });
