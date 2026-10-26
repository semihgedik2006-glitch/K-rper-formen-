/* ══ ALS APP INSTALLIEREN (Runde 288) ═══════════════════════════════════
   Aus der App-Store-Recherche vom 26.10.2026: in den App Store geht es
   nur mit dem Entwicklerkonto; kostenlos geht der Startbildschirm. Auf
   die Empfehlung „Anleitung in die App" kam: „ja mach das".

    1. „Alles → Als App installieren" gibt es für Chef, Leitung und Team
       und öffnet das Fenster;
    2. das eigene Gerät steht oben und offen (iPhone, Android, Rechner),
       die anderen zugeklappt darunter;
    3. läuft die App schon installiert, sagt das Fenster es;
    4. meldet der Browser beforeinstallprompt, gibt es „Jetzt
       installieren", und der Knopf ruft prompt() auf;
    5. am iPhone ohne installierte App führt „Meldungen aktivieren" in
       das Fenster statt zu „kann keine Benachrichtigungen";
    6. Schliessen, Zeilen und „Jetzt installieren" treffen ≥ 44 × 44
       (Hit-Test) und liegen im Bild, bei 320 / 390 / 430 / 820 / 1280 /
       1440 / 1920 px, normal und kompakt; nichts schiebt quer.
   ══════════════════════════════════════════════════════════════════ */
const path = require('path');
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

async function seite(b, { stub = 'stub-chef.js', ua, breite = 1440, hoehe = 900, vorher } = {}) {
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: breite, height: hoehe }, userAgent: ua });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGEERROR ' + e.message));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript({ path: path.join(__dirname, stub) });
  if (vorher) await p.addInitScript(vorher);
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(800);
  return p;
}
/* Wie ein Mensch: „Alles" auf, Zeile antippen. */
async function oeffnen(p) {
  return p.evaluate(async () => {
    document.querySelectorAll('.show[id$="Modal"]').forEach(x => x.classList.remove('show'));
    const lade = document.getElementById('bereichKopf'); if (lade && lade.getClientRects().length) lade.click();
    await new Promise(r => setTimeout(r, 400));
    const z = [...document.querySelectorAll('[data-al-installieren]')].find(x => x.getClientRects().length);
    if (!z) return null;
    const txt = z.textContent;
    z.click(); await new Promise(r => setTimeout(r, 300));
    const m = document.getElementById('installModal');
    return { txt, offen: !!m && getComputedStyle(m).display !== 'none',
      wege: [...document.querySelectorAll('#inListe .in-weg')].map(d => d.dataset.inWeg + (d.open ? '+' : '')),
      ok: !!document.querySelector('#inListe .in-ok'), jetzt: !!document.getElementById('inJetzt') };
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  /* 1. Jede Rolle */
  for (const stub of ['stub-chef.js', 'stub-leiter.js', 'stub-mitarbeiter.js']) {
    const p = await seite(b, { stub });
    const r = await oeffnen(p);
    pruefe(stub.replace(/stub-|\.js/g, '') + ': „Alles → Als App installieren" öffnet das Fenster', r && r.offen, JSON.stringify(r));
    await p.context().close();
  }

  /* 2. Das eigene Gerät oben */
  for (const [name, ua, soll] of [['Rechner', undefined, 'rechner+'], ['iPhone', IPHONE, 'ios+'], ['Android', ANDROID, 'android+']]) {
    const p = await seite(b, { ua, breite: ua ? 390 : 1440, hoehe: ua ? 844 : 900 });
    const r = await oeffnen(p);
    pruefe(name + ': das eigene Gerät steht oben und offen, die anderen zu', r && r.wege.length === 3 && r.wege[0] === soll && r.wege.slice(1).every(w => !w.endsWith('+')), r && r.wege.join(' '));
    await p.context().close();
  }

  /* 3. Schon installiert */
  {
    const p = await seite(b, { ua: IPHONE, breite: 390, hoehe: 844, vorher: () => { Object.defineProperty(navigator, 'standalone', { get: () => true }); } });
    const r = await oeffnen(p);
    pruefe('installiert: „Du nutzt StudioChat schon als App", Zeile sagt „Läuft schon als App"', r && r.ok && /schon als App/.test(r.txt) && r.wege.every(w => !w.endsWith('+')), JSON.stringify(r));
    await p.context().close();
  }

  /* 4. beforeinstallprompt → „Jetzt installieren" ruft prompt() */
  {
    const p = await seite(b);
    await p.evaluate(() => {
      const e = new Event('beforeinstallprompt', { cancelable: true });
      e.prompt = () => { window.__gefragt = (window.__gefragt || 0) + 1; return Promise.resolve(); };
      e.userChoice = Promise.resolve({ outcome: 'dismissed' });
      window.dispatchEvent(e);
      window.__verhindert = e.defaultPrevented;
    });
    const r = await oeffnen(p);
    const nach = await p.evaluate(async () => {
      document.getElementById('inJetzt').click();
      await new Promise(r => setTimeout(r, 200));
      return { gefragt: window.__gefragt || 0, verhindert: window.__verhindert, knopf: !!document.getElementById('inJetzt') };
    });
    pruefe('beforeinstallprompt: „Jetzt installieren" erscheint, ruft prompt() einmal, danach weg', r && r.jetzt && nach.gefragt === 1 && nach.verhindert && !nach.knopf, JSON.stringify({ r, nach }));
    await p.context().close();
  }

  /* 5. iPhone: Meldungen → Fenster */
  {
    const p = await seite(b, { ua: IPHONE, breite: 390, hoehe: 844, vorher: () => { delete window.Notification; } });
    /* Der Weg, den man nimmt: Profil → Meldungen → Knopf. Getroffen per
       Hit-Test, und das Fenster muss ÜBER dem Profil liegen. */
    await p.click('#uAvatar'); await p.waitForTimeout(400);
    const r = await p.evaluate(async () => {
      document.querySelector('[data-pmtab="melden"]').click(); await new Promise(r => setTimeout(r, 400));
      const k = document.getElementById('notifyAsk');
      const vorher = { sichtbar: !!k.getClientRects().length, txt: k.textContent, stand: document.getElementById('notifyState').textContent };
      k.scrollIntoView({ block: 'center' });
      const kr = k.getBoundingClientRect();
      const getroffen = document.elementFromPoint(kr.left + kr.width / 2, kr.top + kr.height / 2) === k;
      k.click(); await new Promise(r => setTimeout(r, 300));
      const m = document.getElementById('installModal');
      const zu = document.getElementById('inClose').getBoundingClientRect();
      const oben = document.elementFromPoint(zu.left + zu.width / 2, zu.top + zu.height / 2);
      return { vorher, getroffen, offen: getComputedStyle(m).display !== 'none', obenauf: !!oben && m.contains(oben),
        toast: (document.getElementById('toast') || {}).textContent || '' };
    });
    pruefe('iPhone ohne App: Einstellungen → Meldungen sagt es und „Als App installieren" öffnet die Anleitung über dem Profil',
      r.vorher.sichtbar && /installieren/.test(r.vorher.txt) && /Home-Bildschirm/.test(r.vorher.stand) && r.getroffen && r.offen && r.obenauf && /installiert/.test(r.toast), JSON.stringify(r));
    await p.context().close();
  }

  /* 6. Trefferflächen */
  {
    const p = await seite(b);
    await p.evaluate(() => {
      const e = new Event('beforeinstallprompt', { cancelable: true });
      e.prompt = () => Promise.resolve(); e.userChoice = new Promise(() => {});
      window.dispatchEvent(e);
    });
    const fehler = [], zahlen = [];
    for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      await p.setViewportSize({ width: w, height: h });
      await oeffnen(p);
      for (const d of ['normal', 'kompakt']) {
        await p.evaluate(d => { document.body.dataset.dichte = d; }, d);
        await p.waitForTimeout(150);
        const m = await p.evaluate(() => {
          const ziele = { schliessen: '#inClose', jetzt: '#inJetzt', zeile: '#inListe .in-weg summary', zweite: '#inListe .in-weg:nth-child(3) summary' };
          const aus = {};
          for (const [n, sel] of Object.entries(ziele)) {
            const k = document.querySelector(sel); if (!k) { aus[n] = null; continue; }
            k.scrollIntoView({ block: 'center' });
            const r = k.getBoundingClientRect();
            const t = (x, y) => { const e = document.elementFromPoint(x, y); return !!e && (e === k || k.contains(e)); };
            const cx = r.left + Math.min(r.width / 2, 30), cy = r.top + r.height / 2;
            let o = cy, u = cy, l = cx, re = cx;
            while (t(cx, o - 1) && o > 0) o--;
            while (t(cx, u + 1) && u < innerHeight) u++;
            while (t(l - 1, cy) && l > 0) l--;
            while (t(re + 1, cy) && re < innerWidth) re++;
            aus[n] = { h: Math.round(u - o + 1), b: Math.round(re - l + 1), imBild: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth };
          }
          aus.quer = document.documentElement.scrollWidth > innerWidth + 1;
          const box = document.querySelector('#installModal .pm-box').getBoundingClientRect();
          aus.box = Math.round(box.width);
          return aus;
        });
        for (const [n, v] of Object.entries(m)) {
          if (n === 'quer' || n === 'box') continue;
          if (!v) fehler.push(w + ' ' + d + ' ' + n + ' fehlt');
          else if (v.h < 44 || v.b < 44 || !v.imBild) fehler.push(w + ' ' + d + ' ' + n + ' ' + v.b + '×' + v.h + (v.imBild ? '' : ' nicht im Bild'));
        }
        if (m.quer) fehler.push(w + ' ' + d + ' schiebt quer');
        zahlen.push(w + ' ' + d[0] + ': x ' + m.schliessen.b + '×' + m.schliessen.h + ', Jetzt ' + m.jetzt.b + '×' + m.jetzt.h + ', Zeile ' + m.zeile.b + '×' + m.zeile.h + ', Fenster ' + m.box);
      }
    }
    zahlen.forEach(z => console.log('    ' + z));
    pruefe('Schliessen, „Jetzt installieren" und Zeilen ≥ 44 × 44 und im Bild, 320–1920 px, normal und kompakt; nichts schiebt quer', !fehler.length, fehler.join(' | '));
    await p.context().close();
  }

  await b.close();
  console.log('\n' + gut + ' grün, ' + schlecht + ' rot');
  if (schlecht) { console.log('Fehler: ' + schlecht + ' Prüfungen'); process.exit(1); }
})().catch(e => { console.log('Fehler: ' + e.message); process.exit(1); });
