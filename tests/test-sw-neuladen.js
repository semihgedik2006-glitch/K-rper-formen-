/* ══ ERSTES ÖFFNEN: KEIN NEULADEN DURCH DEN SERVICE WORKER (Runde 219) ══
   Gefunden über test-sicherung („Betreiber sieht Vollsicherung nicht"):
   Beim allerersten Öffnen installiert sich der Service Worker, übernimmt
   die Seite (clients.claim) – und `controllerchange` lud die Seite neu.
   Wer gerade seine Anmeldung tippte, stand nach rund zwei Sekunden wieder
   vor einer leeren Maske. Ein Update ist das nicht: es gab vorher keinen.

   Geprüft wird:
    1. Erstes Öffnen (noch kein Service Worker): die Seite wird NICHT neu
       geladen, ein eingetippter Text bleibt stehen.
    2. GEGENPROBE Update: steuert schon ein Service Worker und kommt eine
       neue Fassung von sw.js, lädt die Seite weiterhin genau einmal neu –
       sonst sähe niemand eine Auslieferung.

   Dafür liefert ein eigener kleiner Server die App aus einem Ordner aus
   Verweisen, in dem nur sw.js eine echte Kopie ist (für das Update wird
   sie verändert).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const WURZEL = process.env.WURZEL || path.join(__dirname, '..');

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

/* Ordner aus Verweisen, sw.js als Kopie. */
const ORDNER = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-neuladen-'));
for (const n of fs.readdirSync(WURZEL)) {
  if (n === 'sw.js' || n === '.git' || n === 'node_modules') continue;
  fs.symlinkSync(path.join(WURZEL, n), path.join(ORDNER, n));
}
fs.copyFileSync(path.join(WURZEL, 'sw.js'), path.join(ORDNER, 'sw.js'));
const TYP = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((q, a) => {
  const p = path.join(ORDNER, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  fs.readFile(p, (f, d) => {
    if (f) { a.writeHead(404); a.end(); return; }
    a.writeHead(200, { 'Content-Type': TYP[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    a.end(d);
  });
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const APP = 'http://127.0.0.1:' + server.address().port + '/index.html';
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const fehler = [];
  p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  let ladungen = 0;
  p.on('load', () => { ladungen++; });

  console.log('\n── 1 Erstes Öffnen ──');
  await p.goto(APP, { waitUntil: 'load' });
  await p.evaluate(() => { window.__marke = 'steht'; });
  /* Warten, bis der Service Worker steuert – dann wäre das Neuladen passiert. */
  const steuert = await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 }).then(() => true, () => false);
  await p.waitForTimeout(1500);
  pruefe('der Service Worker steuert die Seite', steuert);
  const marke = await p.evaluate(() => window.__marke).catch(() => null);
  pruefe('erstes Öffnen: kein Neuladen (Seite ' + ladungen + '× geladen)', ladungen === 1 && marke === 'steht', JSON.stringify({ ladungen, marke }));

  console.log('\n── 2 Gegenprobe: neue Fassung von sw.js ──');
  await p.reload({ waitUntil: 'load' });
  await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
  const vorher = ladungen;
  await p.evaluate(() => { window.__marke = 'alt'; });
  fs.appendFileSync(path.join(ORDNER, 'sw.js'), '\n/* neue Fassung ' + Date.now() + ' */\n');
  await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r && r.update()));
  const neu = await p.waitForFunction(() => window.__marke !== 'alt', null, { timeout: 15000, polling: 200 }).then(() => true, () => false);
  await p.waitForTimeout(1500);
  pruefe('Update: die Seite lädt einmal neu (' + (ladungen - vorher) + '×)', neu && ladungen - vorher === 1, JSON.stringify({ neu, mal: ladungen - vorher }));

  pruefe('ohne Skriptfehler', !fehler.length, fehler.join(' | '));
  await b.close();
  server.close();
  fs.rmSync(ORDNER, { recursive: true, force: true });
  console.log(schlecht
    ? '\n✗ SW-Neuladen: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ SW-Neuladen: erstes Öffnen bleibt stehen, ein Update lädt neu — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); try { fs.rmSync(ORDNER, { recursive: true, force: true }); } catch (x) {} process.exit(1); });
