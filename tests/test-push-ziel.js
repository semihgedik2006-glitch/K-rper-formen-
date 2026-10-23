/* ── Ein Tipp auf die Meldung führt hin (Runde 240) ───────────────────
   Offen aus Runde 238: „Ein Tipp auf die Push-Nachricht öffnet die App,
   aber nicht direkt die Seite ‚Zeiten'." Jetzt trägt die Meldung ein Ziel.

   A. Im Service Worker (sw.js in einer Attrappe, wie test-nachtruhe):
      · die Meldung trägt das Ziel aus den Daten
      · Tipp ohne offene App → öffnet ./index.html#zeit
      · Tipp mit offener App → schickt ihr {typ:'ziel', ziel:'zeit'} und
        holt sie nach vorn; kein zweites Fenster
      · GEGENPROBEN: ohne Ziel wie bisher ./index.html; ein Ziel mit
        fremden Zeichen wird verworfen, nicht in die Adresse übernommen
   B. In der App (Demo): die Nachricht wechselt zu „Zeiten";
      GEGENPROBEN: ein Mitarbeiter kommt so nicht in die Verwaltung, eine
      unbekannte Ansicht und eine fremde Nachrichtenart ändern nichts.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SW = path.join(__dirname, '..', 'sw.js');

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

function swLaden(fenster) {
  const gezeigt = [], hoerer = {}, geoeffnet = [];
  let handler = null;
  const caches = { open: () => Promise.resolve({ match: () => Promise.resolve(undefined), addAll: () => Promise.resolve(), put: () => Promise.resolve() }),
    keys: () => Promise.resolve([]), delete: () => Promise.resolve(true) };
  const self = {
    addEventListener: (t, f) => { hoerer[t] = f; },
    registration: { showNotification: (t, o) => { gezeigt.push(Object.assign({ titel: t }, o)); return Promise.resolve(); } },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve(), matchAll: () => Promise.resolve(fenster),
      openWindow: (u) => { geoeffnet.push(u); return Promise.resolve(); } }
  };
  const ctx = { self, caches, Date, Promise, Response: class {}, Request: class { constructor(u) { this.url = u; } },
    URL, console, setTimeout, importScripts: () => {}, KONFIG: { firebase: {} },
    firebase: { initializeApp() {}, messaging: () => ({ onBackgroundMessage: (f) => { handler = f; } }) } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(SW, 'utf8'), ctx);
  return {
    gezeigt, geoeffnet,
    schick: (p) => Promise.resolve(handler(p)),
    tipp: (data) => { let warte; hoerer.notificationclick({ notification: { data, close() {} }, waitUntil: (p) => { warte = p; } }); return warte; }
  };
}

(async () => {
  console.log('\n── A. Service Worker ──');
  {
    const sw = swLaden([]);
    await sw.schick({ data: { title: '⏱️ Feierabend vergessen?', body: 'x', ziel: 'zeit' } });
    pruefe('die Meldung trägt das Ziel „zeit"', sw.gezeigt[0] && sw.gezeigt[0].data && sw.gezeigt[0].data.ziel === 'zeit', JSON.stringify(sw.gezeigt[0]));
    await sw.schick({ data: { title: 'T', body: 'x', ziel: 'zeit"><img src=x>' } });
    pruefe('GEGENPROBE ein Ziel mit fremden Zeichen wird verworfen', sw.gezeigt[1] && sw.gezeigt[1].data.ziel === '', JSON.stringify(sw.gezeigt[1]));
    await sw.tipp({ ziel: 'zeit' });
    pruefe('Tipp, App nicht offen → ./index.html#zeit', sw.geoeffnet[0] === './index.html#zeit', JSON.stringify(sw.geoeffnet));
    await sw.tipp({});
    pruefe('GEGENPROBE Tipp ohne Ziel → ./index.html wie bisher', sw.geoeffnet[1] === './index.html', JSON.stringify(sw.geoeffnet));
    await sw.tipp({ ziel: '../wachstum' });
    pruefe('GEGENPROBE Tipp mit fremdem Ziel → ./index.html, nichts angehängt', sw.geoeffnet[2] === './index.html', JSON.stringify(sw.geoeffnet));
    await sw.tipp(null);
    pruefe('GEGENPROBE eine alte Meldung ganz ohne Daten → ./index.html', sw.geoeffnet[3] === './index.html', JSON.stringify(sw.geoeffnet));
  }
  {
    const post = [], vorn = [];
    const sw = swLaden([{ focus: () => { vorn.push(1); return Promise.resolve(); }, postMessage: (m) => post.push(m) }]);
    await sw.tipp({ ziel: 'zeit' });
    pruefe('Tipp, App offen → Nachricht {typ:ziel, ziel:zeit} und nach vorn, kein neues Fenster',
      post.length === 1 && post[0].typ === 'ziel' && post[0].ziel === 'zeit' && vorn.length === 1 && !sw.geoeffnet.length, JSON.stringify({ post, vorn, auf: sw.geoeffnet }));
    await sw.tipp({});
    pruefe('GEGENPROBE ohne Ziel: nur nach vorn, keine Nachricht', post.length === 1 && vorn.length === 2);
  }

  console.log('\n── B. In der App ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  {
    const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
    const fe = []; p.on('pageerror', e => fe.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
    await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3000);
    const r = await p.evaluate(async () => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      const an = () => (document.querySelector('.view.show') || {}).id;
      const schick = async (data) => { navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data })); await w(600); return an(); };
      const vorher = an();
      const fremdeArt = await schick({ typ: 'anderes', ziel: 'zeit' });
      const unbekannt = await schick({ typ: 'ziel', ziel: 'gibtsnicht' });
      const verwaltung = await schick({ typ: 'ziel', ziel: 'chef' });
      const zeit = await schick({ typ: 'ziel', ziel: 'zeit' });
      return { da: !!navigator.serviceWorker, vorher, fremdeArt, unbekannt, verwaltung, zeit };
    });
    pruefe('die Nachricht {typ:ziel, ziel:zeit} öffnet „Meine Zeiten"', r.zeit === 'view-zeit', JSON.stringify(r));
    pruefe('GEGENPROBE eine andere Nachrichtenart ändert nichts', r.fremdeArt === r.vorher, JSON.stringify(r));
    pruefe('GEGENPROBE eine unbekannte Ansicht ändert nichts', r.unbekannt === r.vorher, JSON.stringify(r));
    pruefe('GEGENPROBE ein Mitarbeiter kommt so nicht in die Verwaltung', r.verwaltung === r.vorher, JSON.stringify(r));
    pruefe('ohne Skriptfehler', !fe.length, fe.join(' | '));
    await p.close();
  }
  await b.close();
  console.log(schlecht
    ? '\n✗ Ziel der Meldung: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Ein Tipp auf die Meldung führt hin — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})();
