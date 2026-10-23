/* ══ NACHTS LAUTLOS (Runde 225) ═════════════════════════════════════════
   Aus der Studienlage (docs/design-vorbilder/studien-psychologie.md,
   Folgerung 9): „Push-Benachrichtigungen … mit Ruhezeiten". Schon das
   Eintreffen kostet Aufmerksamkeit; nachts weckt es.

   Geprüft wird:
    A. Im Service Worker selbst (sw.js in einer Attrappe geladen, Uhr
       gestellt): eine Meldung um 23:00 und um 5:59 kommt LAUTLOS
       (silent:true), um 6:00 und 12:00 mit Ton. Hat jemand „Nachts
       lautlos" abgeschaltet, ist sie auch nachts laut. Ohne gespeicherte
       Wahl gilt „an". Der Vorrat mit der Wahl überlebt ein Update des
       Service Workers (activate räumt ihn nicht weg).
    B. In der App, Profil → Meldungen, bei 390 und 1440 px: die Zeile
       „Nachts lautlos" steht da, ist an, trifft ≥ 44 px hoch (normal und
       kompakt); Abschalten
       schreibt die Wahl in den Vorrat, und nach dem Neuladen ist sie
       noch aus.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SW = process.env.SW || path.join(__dirname, '..', 'sw.js');
const SP = __dirname;

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

/* sw.js mit Attrappen: firebase, caches, registration, Uhr. */
function swLaden(einst, stunde, minute) {
  const gezeigt = [], hoerer = {};
  let handler = null;
  const vorrat = {};
  const RealDate = Date;
  class FestesDatum extends RealDate {
    constructor(...a) { if (a.length) super(...a); else { super(2026, 9, 21, stunde, minute || 0, 0); } }
    static now() { return new FestesDatum().getTime(); }
  }
  if (einst) vorrat['kf-einst'] = { 'einst.json': JSON.stringify(einst) };
  const caches = {
    open: (n) => Promise.resolve({
      match: (k) => Promise.resolve(vorrat[n] && vorrat[n][k] ? { json: () => Promise.resolve(JSON.parse(vorrat[n][k])) } : undefined),
      addAll: () => Promise.resolve(), put: () => Promise.resolve()
    }),
    keys: () => Promise.resolve(Object.keys(vorrat).concat(['studiochat-alt'])),
    delete: (k) => { delete vorrat[k]; return Promise.resolve(true); }
  };
  const self = {
    addEventListener: (t, f) => { hoerer[t] = f; },
    registration: { showNotification: (t, o) => { gezeigt.push(Object.assign({ titel: t }, o)); return Promise.resolve(); } },
    skipWaiting: () => Promise.resolve(), clients: { claim: () => Promise.resolve(), matchAll: () => Promise.resolve([]) }
  };
  const ctx = {
    self, caches, Date: FestesDatum, Promise, Response: class {}, Request: class { constructor(u) { this.url = u; } },
    URL, console, setTimeout,
    importScripts: () => {},
    KONFIG: { firebase: {} },
    firebase: { initializeApp() {}, messaging: () => ({ onBackgroundMessage: (f) => { handler = f; } }) }
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(SW, 'utf8'), ctx);
  return { gezeigt, hoerer, vorrat, schick: (p) => Promise.resolve(handler(p)) };
}

(async () => {
  console.log('\n── A Service Worker ──');
  const faelle = [
    [23, 0, null, true], [5, 59, null, true], [6, 0, null, false], [12, 0, null, false],
    [23, 0, { nachtLautlos: true }, true], [23, 0, { nachtLautlos: false }, false]
  ];
  for (const [h, m, einst, lautlos] of faelle) {
    const sw = swLaden(einst, h, m);
    await sw.schick({ data: { title: 'Neue Aufgabe', body: 'Geräte desinfizieren' } });
    const g = sw.gezeigt[0] || {};
    const wo = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ' ' + (einst ? JSON.stringify(einst) : '(keine Wahl)');
    pruefe(wo + ': Meldung ' + (lautlos ? 'lautlos' : 'mit Ton') + ', Text bleibt', !!g.titel && g.body === 'Geräte desinfizieren' && (!!g.silent) === lautlos, JSON.stringify(g));
  }
  {
    const sw = swLaden({ nachtLautlos: false }, 12, 0);
    let warten = null;
    sw.hoerer.activate({ waitUntil: (p) => { warten = p; } });
    await warten;
    pruefe('Update des Service Workers räumt die Wahl nicht weg', !!sw.vorrat['kf-einst'] && !sw.vorrat['studiochat-alt'], Object.keys(sw.vorrat).join(','));
  }

  console.log('\n── B Profil → Meldungen ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' }, w <= 820 ? { hasTouch: true, isMobile: true } : {}));
    const p = await ctx.newPage();
    const fehler = [];
    p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { try { localStorage.setItem('kf_tour', '1:testuid'); } catch (e) {} });
    await p.addInitScript({ path: path.join(SP, 'stub-chef.js') });
    const oeffnen = async () => {
      await p.goto(APP + '?neu=1', { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
      await p.waitForTimeout(700);
      await p.click('#uAvatar'); await p.waitForTimeout(300);
      await p.evaluate(() => document.querySelector('[data-pmtab="melden"]').click());
      await p.waitForTimeout(300);
    };
    const lesen = () => p.evaluate(async () => {
      const z = document.querySelector('#notifyOpts [data-nacht]');
      const c = await caches.open('kf-einst').then(x => x.match('einst.json')).then(r => r ? r.json() : null);
      if (!z) return { da: false, vorrat: c };
      z.scrollIntoView({ block: 'center' });
      const r = z.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { da: !!z.getClientRects().length, an: z.querySelector('.sw').classList.contains('on'), hoch: Math.round(r.height), trifft: !!t && z.contains(t), vorrat: c };
    });
    await oeffnen();
    const m = await lesen();
    pruefe(w + ' px: „Nachts lautlos" steht da und ist an', m.da && m.an, JSON.stringify(m));
    pruefe(w + ' px: die Zeile trifft ' + m.hoch + ' px hoch (≥ 44)', m.trifft && m.hoch >= 44, JSON.stringify(m));
    await p.evaluate(() => { document.body.dataset.dichte = 'kompakt'; }); await p.waitForTimeout(200);
    const k = await lesen();
    pruefe(w + ' px kompakt: die Zeile trifft ' + k.hoch + ' px hoch (≥ 44)', k.trifft && k.hoch >= 44, JSON.stringify(k));
    await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
    pruefe(w + ' px: der Vorrat kennt die Wahl (an)', !!m.vorrat && m.vorrat.nachtLautlos === true, JSON.stringify(m.vorrat));
    await p.click('#notifyOpts [data-nacht]'); await p.waitForTimeout(300);
    const aus = await lesen();
    pruefe(w + ' px: Abschalten schreibt „aus" in den Vorrat', !aus.an && aus.vorrat && aus.vorrat.nachtLautlos === false, JSON.stringify(aus));
    await oeffnen();
    const danach = await lesen();
    pruefe(w + ' px: nach dem Neuladen noch aus', !danach.an && danach.vorrat && danach.vorrat.nachtLautlos === false, JSON.stringify(danach));
    pruefe(w + ' px: ohne Skriptfehler', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }
  await b.close();

  console.log(schlecht
    ? '\n✗ Nachtruhe: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Nachtruhe: nachts lautlos, abschaltbar, übersteht Neuladen und Update — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
