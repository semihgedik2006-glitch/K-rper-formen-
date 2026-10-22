/* ══════════════════════════════════════════════════════════════════════
   KANÄLE ALS SPALTE AM RECHNER (Runde 172)

   Aus dem Betrieb, 21.10.2026: „grade sieht alles aus wie ein komplettes
   durcheinander" — und der PC ist das Hauptgerät. Über dem Chat standen
   am Rechner Studios/Gruppen, „Alle Kanäle" und fünfzehn Kanäle in einer
   Leiste, die rechts abgeschnitten war.

   Geprüft wird:
    1. Ab 1100 px steht links eine Spalte mit allen Kanälen. Die Leiste
       und der Umschalter Studios/Gruppen sind dann weg.
    2. Darunter (820 / 430 / 390 / 320) bleibt die Leiste, und es gibt keine Spalte.
    3. Mit weniger als drei Kanälen (Mitarbeiter mit einem Studio) gibt es
       auch am Rechner keine Spalte. Die Leiste reicht dort.
    4. Ein Tipp auf eine Zeile wechselt den Kanal. Die Zeile ist markiert,
       der Verlauf zeigt den neuen Kanal.
    5. Ungelesenes steht als Zahl an der Zeile, der offene Kanal nie.
    6. Jede Zeile nennt die letzte Nachricht.
    7. Trefferfläche jeder Zeile ≥ 44 × 44 per Hit-Test, normal und
       kompakt, bei 1280 / 1440 / 1920. Die letzte Zeile ist nach
       dem Scrollen in der Spalte voll treffbar.
    8. Der Verlauf steht rechts neben der Spalte, nicht darunter.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
const TREFFER = (el) => {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0 };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--;
  while (u < innerHeight && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--;
  while (re < innerWidth && trifft(re + 1, cy)) re++;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1) };
};

async function oeffne(b, w, h, opt) {
  opt = opt || {};
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await p.addInitScript({ path: SP + '/' + (opt.stub || 'stub-chef.js') });
  await p.goto(APP + '?neu=' + (opt.neu === undefined ? 1 : opt.neu), { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(600);
  /* Derselbe Weg wie ein Mensch: Seitenleiste oder untere Leiste, sonst
     über „Alles" (im neuen Design steht der Chat am Handy dort). */
  await p.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms));
    const n = [...document.querySelectorAll('.mobnav [data-group], #side [data-group], #side button, #side a')]
      .find(e => /Nachrichten|Chat/.test(e.textContent) && e.getClientRects().length);
    if (n) { n.click(); return; }
    const g = document.getElementById('bereichKopf');
    if (g && g.getClientRects().length) g.click();
    for (let i = 0; i < 30 && !document.querySelector('#allesLadeInhalt [data-alles="chat"]'); i++) await w(100);
    const z = document.querySelector('#allesLadeInhalt [data-alles="chat"]');
    if (z) z.click();
  });
  await p.waitForTimeout(700);
  p._ctx = ctx;
  return p;
}
const zu = (p) => p._ctx.close();
const stand = (p) => p.evaluate(() => {
  const da = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
  const sp = document.getElementById('kanalSpalte');
  const zeile = document.querySelector('#view-chat .chan-zeile');
  const verlauf = document.getElementById('chatScroll').getBoundingClientRect();
  const spr = sp.getBoundingClientRect();
  return {
    ansicht: (document.querySelector('.view.show') || {}).id,
    spalte: da(sp), zeilen: sp.querySelectorAll('.ks-zeile').length,
    leiste: da(zeile), arten: da(document.getElementById('chatArten')),
    daneben: verlauf.left >= spr.right - 1, ueberlauf: document.documentElement.scrollWidth > innerWidth + 1,
    aktiv: (sp.querySelector('.ks-zeile.an') || {}).dataset ? sp.querySelector('.ks-zeile.an').dataset.kanalwahl : null,
  };
});

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1/2 Spalte am Rechner, Leiste am Handy ──');
  for (const neu of [1, 0]) {
    for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080], [820, 1180], [430, 932], [390, 844], [320, 568]]) {
      const p = await oeffne(b, w, h, { neu });
      const s = await stand(p);
      const nm = w + ' px ' + (neu ? 'neu' : 'bisher');
      pruefe(nm + ': im Chat', s.ansicht === 'view-chat', s.ansicht);
      if (w >= 1100) {
        pruefe(nm + ': Spalte mit allen Kanälen, keine Leiste, kein Umschalter',
          s.spalte && s.zeilen >= 3 && !s.leiste && !s.arten, JSON.stringify(s));
        pruefe(nm + ': Verlauf steht rechts neben der Spalte', s.daneben, JSON.stringify(s));
      } else {
        pruefe(nm + ': keine Spalte, die Leiste bleibt', !s.spalte && s.leiste, JSON.stringify(s));
      }
      pruefe(nm + ': kein Querlauf', !s.ueberlauf);
      pruefe(nm + ': keine Fehler', !p._fehler.length, p._fehler.join(' | '));
      await zu(p);
    }
  }

  console.log('\n── 3 Wenige Kanäle: keine Spalte ──');
  {
    const p = await oeffne(b, 1440, 900, { stub: 'stub-mitarbeiter.js' });
    const s = await stand(p);
    const n = await p.evaluate(() => document.querySelectorAll('#chatChannels .chan').length);
    pruefe('Mitarbeiter mit ' + n + ' Kanälen: keine Spalte, Leiste bleibt', n < 3 ? (!s.spalte && s.leiste) : s.spalte, JSON.stringify(s));
    await zu(p);
  }

  console.log('\n── 4/5/6 Wechseln, Ungelesen, Vorschau ──');
  {
    const p = await oeffne(b, 1440, 900);
    const vorher = await stand(p);
    const ziel = await p.evaluate(() => [...document.querySelectorAll('#kanalSpalte .ks-zeile')]
      .map(z => z.dataset.kanalwahl).find(k => k !== 'allgemein'));
    await p.click('#kanalSpalte [data-kanalwahl="' + ziel + '"]');
    await p.waitForTimeout(500);
    const nach = await stand(p);
    pruefe('Tipp wechselt den Kanal (' + vorher.aktiv + ' → ' + ziel + ')', nach.aktiv === ziel && vorher.aktiv !== ziel, JSON.stringify(nach));
    pruefe('genau eine Zeile markiert, mit aria-current', await p.evaluate(() =>
      document.querySelectorAll('#kanalSpalte .ks-zeile.an').length === 1 &&
      document.querySelector('#kanalSpalte .ks-zeile.an').getAttribute('aria-current') === 'true'));
    pruefe('die versteckte Leiste zieht mit', await p.evaluate((z) => (document.querySelector('#chatChannels .chan.active') || {}).dataset.chan === z, ziel));
    pruefe('der offene Kanal trägt keine Zahl', !(await p.$('#kanalSpalte .ks-zeile.an .ks-zahl')));

    // „Allgemein" zuletzt vor allen Nachrichten gelesen → Zahl erscheint
    await p.evaluate(() => {
      Object.keys(localStorage).filter(k => /^kf_read_.*_allgemein$/.test(k)).forEach(k => localStorage.setItem(k, '0'));
    });
    const dritter = await p.evaluate((z) => [...document.querySelectorAll('#kanalSpalte .ks-zeile')]
      .map(e => e.dataset.kanalwahl).find(k => k !== 'allgemein' && k !== z), ziel);
    await p.click('#kanalSpalte [data-kanalwahl="' + dritter + '"]');
    await p.waitForTimeout(500);
    const zahl = await p.evaluate(() => { const z = document.querySelector('#kanalSpalte [data-kanalwahl="allgemein"] .ks-zahl'); return z ? z.textContent : ''; });
    pruefe('Ungelesenes in „Allgemein" steht als Zahl an der Zeile', /^[1-9]/.test(zahl), zahl);
    const fett = await p.evaluate(() => document.querySelector('#kanalSpalte [data-kanalwahl="allgemein"]').classList.contains('neu'));
    pruefe('… und die Zeile ist hervorgehoben', fett);
    await p.click('#kanalSpalte [data-kanalwahl="allgemein"]');
    await p.waitForTimeout(500);
    pruefe('nach dem Öffnen ist die Zahl weg', !(await p.$('#kanalSpalte [data-kanalwahl="allgemein"] .ks-zahl')));
    const vorschau = await p.evaluate(() => document.querySelector('#kanalSpalte [data-kanalwahl="allgemein"] .ks-txt i').textContent);
    pruefe('die Zeile nennt die letzte Nachricht', /^[^:]+: .+/.test(vorschau), vorschau);
    pruefe('keine Fehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 7 Trefferflächen ──');
  for (const dichte of ['normal', 'kompakt']) {
    for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
      const p = await oeffne(b, w, h);
      if (dichte === 'kompakt') await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt'));
      await p.waitForTimeout(200);
      const m = await p.evaluate(async (T) => {
        const f = new Function('return ' + T)();
        const zeilen = [...document.querySelectorAll('#kanalSpalte .ks-zeile')];
        let klein = [];
        for (const z of zeilen) {
          z.scrollIntoView({ block: 'nearest' });
          await new Promise(r => requestAnimationFrame(r));
          const t = f(z);
          if (t.w < 44 || t.h < 44) klein.push(z.dataset.kanalwahl + ' ' + t.w + '×' + t.h);
        }
        const letzte = zeilen[zeilen.length - 1];
        return { n: zeilen.length, klein, letzte: f(letzte) };
      }, TREFFER.toString());
      pruefe(dichte + ' ' + w + ' px: alle ' + m.n + ' Zeilen ≥ 44 × 44', !m.klein.length && m.n >= 3, m.klein.join(', '));
      pruefe(dichte + ' ' + w + ' px: letzte Zeile nach dem Scrollen voll treffbar', m.letzte.h >= 44, JSON.stringify(m.letzte));
      await zu(p);
    }
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Kanalspalte: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Kanalspalte: Liste links am Rechner, Leiste am Handy — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
