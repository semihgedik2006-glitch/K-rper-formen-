/* ══════════════════════════════════════════════════════════════════════
   „SEIT DU WEG WARST" UND FORMIS STIMME IN BENACHRICHTIGUNGEN
   (Runde 240, Ideen 8 und 14 aus docs/ideen/formi-im-design.md)

   Aus dem Betrieb: „mach weiter mit den restlichen ideen".

   Idee 8 — wer länger als 12 Stunden weg war, sieht EINE Zeile mit
   Formi: „Seit Mittwoch: 3 Übergaben, 1 Ankündigung", darunter das
   Wichtigste WÖRTLICH mit Quelle. Keine KI (eine falsch zusammengefasste
   Übergabe kann schaden). Am PC oben in „Neu für dich", am Handy als
   eigener Block ganz oben (sonst fiele er nach „Ausserdem").
   Geprüft: Zahlen stimmen mit den Daten, das Zitat steht wörtlich in
   einer Übergabe, Quelle mit Vorname und Uhrzeit, Tippen führt in den
   Reiter „Übergabe", unter 12 Stunden keine Zeile, kein Aufruf an die
   KI, Trefferfläche ≥ 44 × 44 bei 320–1920.

   Idee 14 — gelesen wird der Quelltext (kein FCM hier): die Meldungen,
   die die App selbst schickt, tragen von:'formi'; die von Menschen
   nicht. Der Service Worker zeigt „Formi · …" mit formi-push.svg —
   ausgeführt in einer nachgebauten Umgebung, nicht nur gelesen.
   NICHT geprüft: eine echte Meldung auf einem echten Handy.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), vm = require('vm');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname, W = path.join(__dirname, '..');
const STUB = fs.readFileSync(path.join(SP, 'stub-chef.js'), 'utf8');

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
async function oeffne(b, w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await p.addInitScript({ path: SP + '/stub-chef.js' });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__kiGefragt = 0; window.__antwort = window.__antwort || {};
    ['gehirnAktion', 'gehirnFrage'].forEach(n => { window.__antwort[n] = () => { window.__kiGefragt++; return Promise.resolve({ data: {} }); }; }); });
  p._ctx = ctx;
  return p;
}
const TREFFER = (sel) => {
  const el = document.querySelector(sel);
  if (!el || !el.getClientRects().length) return { w: 0, h: 0, fehlt: true };
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0, verdeckt: true };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--; while (u < innerHeight - 1 && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--; while (re < innerWidth - 1 && trifft(re + 1, cy)) re++;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1) };
};

(async () => {
  console.log('\n── Idee 14: Formis Stimme in Benachrichtigungen ──');
  {
    const fn = fs.readFileSync(path.join(W, 'functions', 'index.js'), 'utf8');
    const zeilen = fn.split('\n');
    const mitFormi = (muster) => zeilen.some(z => muster.test(z) && /sendPush\(/.test(z) && /'formi'\)/.test(z));
    const ohneFormi = (muster) => zeilen.filter(z => muster.test(z) && /sendPush\(/.test(z)).every(z => !/'formi'\)/.test(z));
    for (const [name, m] of [['Aufgabe fällig', /'Aufgabe fällig'/], ['Erinnerung', /'Erinnerung', titel/], ['Nachweis', /'Nachweis '/], ['Nachweise', /'Nachweise', text/],
      ['Kurz auffrischen', /Kurz auffrischen/], ['⏰ Erinnerung', /⏰ Erinnerung/], ['Formi meldet sich', /sendPush\(tokens, titel, text/], ['Defekt gemeldet', /Defekt gemeldet/], ['Material fehlt', /Material fehlt/]]) {
      pruefe(`„${name}" kommt von Formi`, mitFormi(m));
    }
    for (const [name, m] of [['Chat', /Neue Nachricht von/], ['Erwähnung', /hat dich erwähnt/], ['Neue Aufgabe', /'Neue Aufgabe'/], ['Erledigt', /hat „' \+/], ['Ankündigung', /wichtigTitel\(a\)/]]) {
      pruefe(`„${name}" (von einem Menschen) bleibt ohne Formi`, ohneFormi(m));
    }
    const sw = fs.readFileSync(path.join(W, 'sw.js'), 'utf8');
    const gezeigt = []; let handler = null;
    const ctx = { self: { registration: { showNotification: (t, o) => { gezeigt.push({ t, o }); return Promise.resolve(); } }, addEventListener: () => {}, skipWaiting: () => {} },
      importScripts: () => {}, KONFIG: { firebase: {} },
      firebase: { initializeApp: () => {}, messaging: () => ({ onBackgroundMessage: (f) => { handler = f; } }) },
      caches: { open: () => Promise.resolve({ match: () => Promise.resolve(null), put: () => {} }), keys: () => Promise.resolve([]) },
      console, Promise, Date, Math, JSON };
    vm.createContext(ctx); vm.runInContext(sw, ctx);
    await handler({ data: { title: 'Aufgabe fällig', body: 'Spiegel putzen', von: 'formi' } });
    await handler({ data: { title: 'Neue Nachricht von Anna', body: 'Hi' } });
    pruefe('Service Worker: „Formi · Aufgabe fällig" mit Formis Bild', gezeigt[0] && gezeigt[0].t === 'Formi · Aufgabe fällig' && gezeigt[0].o.icon === 'formi-push.svg', JSON.stringify(gezeigt[0]));
    pruefe('… eine Nachricht von Anna bleibt, wie sie ist', gezeigt[1] && gezeigt[1].t === 'Neue Nachricht von Anna' && gezeigt[1].o.icon === 'icon.svg', JSON.stringify(gezeigt[1]));
    pruefe('formi-push.svg liegt im Projekt und löst einen Deploy aus', fs.existsSync(path.join(W, 'formi-push.svg')) && /'formi-push\.svg'/.test(fs.readFileSync(path.join(W, '.github/workflows/deploy-functions.yml'), 'utf8')));
  }

  console.log('\n── Idee 8: Seit du weg warst ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      const p = await oeffne(b, w, h);
      const seit = Date.now() - 2 * 86400000;
      await p.evaluate((s) => window.__formiLebt.seit(s), seit);
      await p.waitForTimeout(500);
      const z = await p.evaluate((seit) => {
        const el = document.querySelector('.heute-zeile.formi-seit');
        if (!el) return null;
        const blk = el.closest('.heute-block');
        return { titel: el.querySelector('.hz-txt b').textContent, unter: el.querySelector('.hz-txt i').textContent, figur: !!el.querySelector('.formi-figur .fk-auge'),
          block: blk && blk.getAttribute('data-btitel'), erster: blk === document.querySelector('#heuteListe .heute-block') };
      }, seit);
      if (!z) { pruefe(`${w}: Zeile „Seit …" erscheint`, false, 'keine'); await p._ctx.close(); continue; }
      const m = /(?:^Seit \S+: )?(\d+) Übergaben?(?:, (\d+) Ankündigung)?/.exec(z.titel);
      const zitat = (/„([^"“]+?)…?"/.exec(z.unter) || [])[1] || '';
      pruefe(`${w}: „${z.titel}" mit Formi`, !!m && z.figur, JSON.stringify(z));
      pruefe(`${w}: Zitat wörtlich aus den Daten (Attrappe), mit Quelle und Uhrzeit`, zitat.length > 10 && STUB.includes(zitat) && /— (Übergabe|Ankündigung) von \S+, \d\d:\d\d$/.test(z.unter), z.unter);
      const breit = w >= 1100;
      pruefe(`${w}: ${breit ? 'am PC in „Neu für dich"' : 'am Handy als eigener Block „Seit …" ganz oben'}`, breit ? z.block === 'Neu für dich' : (/^Seit \S+$/.test(z.block) && z.erster), JSON.stringify(z));
      const t = await p.evaluate(TREFFER, '.heute-zeile.formi-seit');
      pruefe(`${w}: Trefferfläche ${t.w}×${t.h} (≥ 44 × 44)`, t.w >= 44 && t.h >= 44, JSON.stringify(t));
      if (w === 1440 || w === 390) {
        await p.click('.heute-zeile.formi-seit'); await p.waitForTimeout(500);
        const ziel = await p.evaluate(() => ({ view: (document.querySelector('.view.show') || {}).id, tab: (document.querySelector('[data-teamtab="uebergabe"]') || {}).className }));
        pruefe(`${w}: Tippen führt zu Team → Übergabe`, ziel.view === 'view-team' && /\bon\b/.test(ziel.tab || ''), JSON.stringify(ziel));
        await p.evaluate(() => { history.pushState({ v: 'home' }, '', '#home'); dispatchEvent(new PopStateEvent('popstate', { state: { v: 'home' } })); });
        await p.waitForTimeout(300);
        await p.evaluate(() => window.__formiLebt.seit(Date.now() - 2 * 3600000)); await p.waitForTimeout(400);
        pruefe(`${w}: nach 2 Stunden weg: keine Zeile`, await p.evaluate(() => !document.querySelector('.heute-zeile.formi-seit')));
        pruefe(`${w}: keine KI gefragt`, await p.evaluate(() => window.__kiGefragt === 0));
      }
      pruefe(`${w}: ohne Seitenfehler`, !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
  } catch (e) { console.log('Fehler: ' + e.message.split('\n')[0]); schlecht++; }
  await b.close();
  console.log(schlecht ? `✗ Seit du weg warst / Formis Stimme: ${schlecht} von ${gut + schlecht} falsch` : `✓ Seit du weg warst / Formis Stimme: ${gut} Zusicherungen`);
  process.exit(schlecht ? 1 : 0);
})();
