/* ══ SCHRIFTGRÖSSE WIE AM GERÄT (Runde 257) ═══════════════════════════
   Plan „Studio Chat wie von Apple", Schritt 11. Seit 23.10.2026, 15:18:
   „es soll einfach den ganzen plan erledigen".

   Safari am iPhone liefert über `font: -apple-system-body` die dort
   eingestellte Textgrösse. Chromium kennt das nicht — darum wird es hier
   nachgestellt: CSS.supports meldet es, und für das Probestück der App
   (.fs-probe) liefert getComputedStyle die Grösse, die ein iPhone
   liefern würde (17 px
   Standard, 14 / 21 / 40 px für andere Einstellungen). Was das echte
   Safari liefert, ist damit NICHT geprüft — nur, was die App daraus macht.

   Geprüft:
    1. Neues Gerät, iPhone-Standard (17 px): Wahl „Wie am Gerät" steht
       vorne und ist gewählt; die Schrift bleibt bei 16 px (100 %).
    2. 21 px am iPhone → 123,5 %; 14 px → 90 % (Untergrenze); 40 px →
       125 % (Obergrenze, mehr ist in den Ansichten nicht geprüft).
    3. Wer schon „Gross" (112) gewählt hatte, behält es.
    4. Ändert sich die Grösse, während die App im Hintergrund liegt, gilt
       beim Zurückkommen die neue.
    5. Ohne -apple-system-body (Chrome) oder am Rechner (Maus): keine
       neue Wahl, vier Stufen wie bisher, 100 %.
    6. Die Wahlen sind ≥ 44 × 44 per Hit-Test (normal und kompakt);
       „Zurücksetzen" stellt „Wie am Gerät" wieder her.
    7. Bei 125 % ist auf der Startseite und in Studio bei 320 px nichts
       abgeschnitten (waagerecht).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(name, ok, info) {
  if (ok) { gut++; console.log('  ✓ ' + name); }
  else { schlecht++; console.log('  ✗ ' + name + (info ? '  — ' + info : '')); }
}
async function oeffne(b, w, h, o) {
  o = o || {};
  const handy = o.handy !== false;
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' }, handy ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((o) => {
    localStorage.setItem('kf_tour', '99:demo-ich');
    if (!sessionStorage.getItem('fs-test')) {
      localStorage.setItem('kf_prefs', JSON.stringify(Object.assign({ theme: 'formi', stil2: true, dichte: o.dichte || 'normal' }, o.prefs || {})));
      sessionStorage.setItem('fs-test', '1');
    }
    if (o.apple) {
      const echt = CSS.supports.bind(CSS);
      CSS.supports = function (a, b) { return (a === 'font' && b === '-apple-system-body') ? true : echt.apply(null, arguments); };
      /* Was Safari für das Probestück liefern würde. */
      window._iphonePx = o.apple;
      const gcs = window.getComputedStyle.bind(window);
      window.getComputedStyle = function (el, pseudo) {
        const cs = gcs(el, pseudo);
        if (!pseudo && el && el.classList && el.classList.contains('fs-probe')) return new Proxy(cs, { get: (t, k) => k === 'fontSize' ? window._iphonePx + 'px' : (typeof t[k] === 'function' ? t[k].bind(t) : t[k]) });
        return cs;
      };
    }
  }, o);
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  return { ctx, p };
}
const STAND = () => ({ fs: document.documentElement.style.getPropertyValue('--fs'), px: parseFloat(getComputedStyle(document.documentElement).fontSize),
  wahl: JSON.parse(localStorage.getItem('kf_prefs') || '{}').fs });
async function aussehen(p) {
  await p.evaluate(() => document.getElementById('ichProfilBtn').click()); await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('[data-pmtab="aussehen"]').click()); await p.waitForTimeout(400);
  return p.evaluate(() => [...document.querySelectorAll('#fsOpts .opt')].map(el => {
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
    let o = cy, u = cy, l = cx, re = cx;
    if (trifft(cx, cy)) { while (o > 0 && trifft(cx, o - 1)) o--; while (u < innerHeight && trifft(cx, u + 1)) u++; while (l > 0 && trifft(l - 1, cy)) l--; while (re < innerWidth && trifft(re + 1, cy)) re++; }
    return { fs: el.dataset.fs, wort: el.textContent.replace('Aa', ''), on: el.classList.contains('on'), w: trifft(cx, cy) ? Math.round(re - l + 1) : 0, h: trifft(cx, cy) ? Math.round(u - o + 1) : 0 };
  }));
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('── 1–2. Wie am Gerät ──');
    for (const [apple, erwartet] of [[17, '100%'], [21, '123.5%'], [14, '90%'], [40, '125%']]) {
      const { ctx, p } = await oeffne(b, 390, 844, { apple });
      const s = await p.evaluate(STAND);
      pruefe('iPhone ' + apple + ' px → Schrift ' + s.fs + ' (' + s.px + ' px), gespeichert „' + s.wahl + '"', s.fs === erwartet && s.wahl === 'geraet' && Math.abs(s.px - 16 * parseFloat(erwartet) / 100) < .1, JSON.stringify(s));
      if (apple === 17) {
        const o = await aussehen(p);
        pruefe('Wahl „Wie am Gerät" steht vorne und ist gewählt (' + o.map(x => x.wort + (x.on ? '•' : '')).join(', ') + ')', o.length === 5 && o[0].fs === 'geraet' && o[0].on && o.filter(x => x.on).length === 1, JSON.stringify(o));
      }
      if (p._fehler.length) pruefe('iPhone ' + apple + ': keine Seitenfehler', false, p._fehler.join(' | '));
      await ctx.close();
    }

    console.log('\n── 3. Eigene Wahl bleibt ──');
    {
      const { ctx, p } = await oeffne(b, 390, 844, { apple: 21, prefs: { fs: '112' } });
      const s = await p.evaluate(STAND);
      pruefe('„Groß" gewählt, iPhone 21 px → bleibt 112 % (' + s.fs + ')', s.fs === '112%' && s.wahl === '112', JSON.stringify(s));
      await ctx.close();
    }

    console.log('\n── 4. Zurück aus dem Hintergrund ──');
    {
      const { ctx, p } = await oeffne(b, 390, 844, { apple: 17 });
      await p.evaluate(() => {
        window._iphonePx = 19;
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await p.waitForTimeout(200);
      const s = await p.evaluate(STAND);
      pruefe('am iPhone auf 19 px gestellt, zurück in der App → ' + s.fs, s.fs === '111.8%', JSON.stringify(s));
      await ctx.close();
    }

    console.log('\n── 5. Ohne -apple-system-body oder am Rechner ──');
    for (const [art, o, w, h] of [['Chrome am Handy', {}, 390, 844], ['Safari am Mac (Maus)', { apple: 13, handy: false }, 1440, 900], ['Chrome am Rechner', { handy: false }, 1280, 800]]) {
      const { ctx, p } = await oeffne(b, w, h, o);
      const s = await p.evaluate(STAND);
      const opts = await aussehen(p);
      pruefe(art + ': keine neue Wahl (' + opts.map(x => x.wort).join(', ') + '), Schrift ' + s.fs + ', gespeichert „' + s.wahl + '"', opts.length === 4 && !opts.some(x => x.fs === 'geraet') && s.fs === '100%' && s.wahl !== 'geraet', JSON.stringify([s, opts]));
      await ctx.close();
    }

    console.log('\n── 6. Trefferflächen und Zurücksetzen ──');
    for (const dichte of ['normal', 'kompakt']) {
      for (const [w, h] of [[320, 640], [390, 844], [820, 1180]]) {
        const { ctx, p } = await oeffne(b, w, h, { apple: 17, dichte });
        const o = await aussehen(p);
        pruefe(dichte + ' ' + w + ': fünf Wahlen ' + o.map(x => x.w + '×' + x.h).join(' '), o.length === 5 && o.every(x => x.w >= 44 && x.h >= 44), JSON.stringify(o));
        if (dichte === 'normal' && w === 390) {
          await p.evaluate(() => document.querySelector('#fsOpts [data-fs="125"]').click()); await p.waitForTimeout(200);
          const g = await p.evaluate(STAND);
          p.once('dialog', d => d.accept());
          await p.evaluate(() => document.getElementById('pmReset').click()); await p.waitForTimeout(400);
          const z = await p.evaluate(STAND);
          pruefe('390: „Sehr groß" (' + g.fs + '), dann Zurücksetzen → „' + z.wahl + '" (' + z.fs + ')', g.fs === '125%' && z.wahl === 'geraet' && z.fs === '100%', JSON.stringify([g, z]));
        }
        await ctx.close();
      }
    }

    console.log('\n── 7. Obergrenze 125 % bei 320 px ──');
    {
      const { ctx, p } = await oeffne(b, 320, 640, { apple: 40 });
      for (const g of ['g-start', 'g-arbeit']) {
        await p.evaluate((g) => { const k = document.querySelector('.mobnav [data-group="' + g + '"]'); if (k) k.click(); }, g);
        await p.waitForTimeout(700);
        const r = await p.evaluate(() => ({ breit: document.documentElement.scrollWidth, sicht: innerWidth,
          ueber: [...document.querySelectorAll('.view.show button, .mobnav button')].filter(x => x.getClientRects().length).filter(x => { const q = x.getBoundingClientRect(); return q.right > innerWidth + 1 || q.left < -1; }).map(x => (x.textContent || x.getAttribute('aria-label') || '').trim().slice(0, 20)).slice(0, 5) }));
        pruefe('320 bei 125 %, ' + g + ': nichts ragt seitlich hinaus (Seite ' + r.breit + ' von ' + r.sicht + ')', r.breit <= r.sicht && !r.ueber.length, JSON.stringify(r));
      }
      if (p._fehler.length) pruefe('320 bei 125 %: keine Seitenfehler', false, p._fehler.join(' | '));
      await ctx.close();
    }
  } finally { await b.close(); }
  console.log('\n' + (schlecht ? '✗' : '✓') + ' Schrift wie am Gerät: ' + gut + ' grün, ' + schlecht + ' falsch');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
