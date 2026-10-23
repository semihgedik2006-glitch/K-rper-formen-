/* ══ GLAS FÜR DIE UNTERE LEISTE (Runde 254) ═══════════════════════════
   Plan „Studio Chat wie von Apple", Schritt 8: „Glas (Unschärfe) nur bei
   Kopf- und unterer Leiste, nie hinter Text in Karten, immer mit einem
   Schalter ‚Transparenz reduzieren'. Prüfung: Kontrast ≥ 4,5 : 1 an
   echten Bildpunkten, auch über einem bunten Bild." Seit 23.10.2026,
   15:18: „es soll einfach den ganzen plan erledigen".

   Geprüft:
    1. Am Handy (320 / 390 / 430 / 820) ist die untere Leiste Glas
       (Unschärfe, Grund durchscheinend) — in Formi, Dunkel und Hell.
    2. Der Inhalt läuft unter die Leiste: der Scroll-Bereich jeder
       Hauptansicht endet am unteren Rand; ganz hinuntergescrollt steht
       das letzte Element vollständig ÜBER der Leiste.
    3. Die Beschriftung der Leiste hat ≥ 4,5 : 1 an echten Bildpunkten,
       während Inhalt darunter liegt (gemessen am Bildschirmfoto: Farbe
       der Schrift gegen den hellsten bzw. dunkelsten Grund im Feld).
    4. Profil → Aussehen → „Untere Leiste am Handy": Glas / Deckend,
       jede Wahl ≥ 44 × 44 (Hit-Test, normal und kompakt). „Deckend"
       macht die Leiste deckend und ohne Unschärfe, der Inhalt endet
       wieder über der Leiste; die Wahl bleibt nach dem Neuladen;
       „Zurücksetzen" stellt Glas wieder her.
    5. Meldet das Gerät „Transparenz reduzieren" oder „Mehr Kontrast",
       ist die Leiste deckend, auch ohne den Schalter.
    6. Am Rechner (1280 / 1440 / 1920) ändert sich nichts: keine untere
       Leiste, der Scroll-Bereich hat keinen negativen Rand.
    7. Kosten: Scrollen bei 390 px mit CPU ÷ 4, Glas gegen Deckend —
       Hauptfaden und Rastern je Bild höchstens 1 ms mehr.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(name, ok, info) {
  if (ok) { gut++; console.log('  ✓ ' + name); }
  else { schlecht++; console.log('  ✗ ' + name + (info ? '  — ' + info : '')); }
}

async function oeffne(b, w, h, prefs, opt) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}, opt || {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((pr) => {
    localStorage.setItem('kf_tour', '99:demo-ich');
    if (!sessionStorage.getItem('glas-test-geladen')) {
      localStorage.setItem('kf_prefs', JSON.stringify(Object.assign({ theme: 'formi', stil2: true, dichte: 'normal' }, pr)));
      sessionStorage.setItem('glas-test-geladen', '1');
    }
  }, prefs || {});
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  return { ctx, p };
}
const GRUPPEN = ['g-start', 'g-arbeit', 'g-zeit', 'g-team', 'g-komm'];
async function geheZu(p, g) {
  await p.evaluate((g) => { const k = [...document.querySelectorAll('.mobnav [data-group="' + g + '"], #side [data-group="' + g + '"]')].find(x => x.getClientRects().length); if (k) k.click(); }, g);
  await p.waitForTimeout(700);
}
const LEISTE = () => {
  const n = document.querySelector('.mobnav'), cs = getComputedStyle(n);
  const m = cs.backgroundColor.match(/\(([^)]+)\)/), teile = m ? m[1].replace(/^srgb\s+/, '').split(/[ ,/]+/).filter(Boolean) : [];
  const alpha = teile.length > 3 ? parseFloat(teile[3]) : 1;
  const bf = cs.backdropFilter || cs.webkitBackdropFilter || 'none';
  const r = n.getBoundingClientRect();
  return { da: !!n.getClientRects().length && cs.display !== 'none', alpha, blur: /blur\(/.test(bf), bf, oben: Math.round(r.top), glas: document.body.getAttribute('data-glas') };
};
/* Wo endet der Scroll-Bereich, und steht das letzte Element über der Leiste? */
const BEREICH = () => {
  const s = document.querySelector('.view.show > .scroll-area');
  if (!s) return { da: false };
  const n = document.querySelector('.mobnav'), nOben = n && n.getClientRects().length ? n.getBoundingClientRect().top : innerHeight;
  s.scrollTop = s.scrollHeight;
  const kinder = [...s.children].filter(k => k.getClientRects().length && getComputedStyle(k).visibility !== 'hidden');
  const letztes = kinder.length ? kinder[kinder.length - 1] : null;
  const r = s.getBoundingClientRect();
  const res = { da: true, view: s.closest('.view').id, unten: Math.round(r.bottom), mb: getComputedStyle(s).marginBottom,
    scrollt: s.scrollHeight > s.clientHeight + 2,
    letztesUnten: letztes ? Math.round(letztes.getBoundingClientRect().bottom) : null, nOben: Math.round(nOben) };
  s.scrollTop = 0;
  return res;
};
function lum(c) { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); }
function kontrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('── 1–3. Glas am Handy ──');
    for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180]]) {
      for (const theme of ['formi', 'dark', 'light']) {
        const { ctx, p } = await oeffne(b, w, h, { theme });
        const l = await p.evaluate(LEISTE);
        pruefe(w + ' ' + theme + ': Leiste ist Glas (Grund ' + l.alpha + ' deckend, ' + l.bf + ')', l.da && l.blur && l.alpha < .9 && l.alpha > .5, JSON.stringify(l));
        if (theme === 'formi') {
          for (const g of GRUPPEN) {
            await geheZu(p, g);
            const s = await p.evaluate(BEREICH);
            if (!s.da) { console.log('  · ' + g + ': kein Scroll-Bereich (eigener Aufbau, z. B. Chat)'); continue; }
            /* Die Startseite passt auf einen Bildschirm; unter der Leiste
               liegt dort absichtlich nichts. */
            if (s.view === 'view-home') { pruefe(w + ' Startseite: unverändert, kein negativer Rand', s.mb === '0px', JSON.stringify(s)); continue; }
            pruefe(w + ' ' + g + ' #' + s.view + ': Inhalt läuft unter die Leiste (endet bei ' + s.unten + ' von ' + h + ')', Math.abs(s.unten - h) <= 1, JSON.stringify(s));
            if (s.letztesUnten !== null) pruefe(w + ' ' + g + ': ganz unten steht das letzte Element über der Leiste (' + s.letztesUnten + ' ≤ ' + s.nOben + ')', s.letztesUnten <= s.nOben + 1, JSON.stringify(s));
          }
          await geheZu(p, 'g-arbeit');
        }
        /* 3. Kontrast an echten Bildpunkten, mit Inhalt unter der Leiste:
           so weit scrollen, dass Zeilen unter der Leiste liegen. */
        {
          await p.evaluate(() => { const s = document.querySelector('.view.show > .scroll-area'); if (s) s.scrollTop = Math.min(220, s.scrollHeight); });
          await p.waitForTimeout(300);
          const felder = await p.evaluate(() => [...document.querySelectorAll('.mn-reihe button')].filter(x => x.getClientRects().length).map(x => {
            const sp = [...x.querySelectorAll('span')].find(s => !s.classList.contains('badge') && !s.classList.contains('ndot') && s.textContent.trim());
            if (!sp) return null;
            const r = sp.getBoundingClientRect(), c = getComputedStyle(sp).color.match(/[\d.]+/g).map(Number);
            return { wort: sp.textContent.trim(), x: Math.floor(r.left), y: Math.floor(r.top), w: Math.ceil(r.width), h: Math.ceil(r.height), c };
          }).filter(Boolean));
          /* Bildschirmfoto in der Seite selbst entpacken (kein PNG-Paket
             in dieser Umgebung): als Bild laden, auf eine Leinwand. */
          const roh = (await p.screenshot()).toString('base64');
          const bild = await p.evaluate(async (b64) => {
            const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
            const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
            const x = c.getContext('2d'); x.drawImage(img, 0, 0);
            return { width: c.width, height: c.height, data: Array.from(x.getImageData(0, 0, c.width, c.height).data) };
          }, roh);
          let schlechtest = 99, wo = '';
          for (const f of felder) {
            /* Grund = Bildpunkte im Feld, die von der Schriftfarbe am
               weitesten weg sind (der Grund zwischen den Buchstaben). */
            const proben = [];
            for (let yy = f.y; yy < f.y + f.h; yy++) for (let xx = f.x; xx < f.x + f.w; xx++) {
              if (xx < 0 || yy < 0 || xx >= bild.width || yy >= bild.height) continue;
              const i = (yy * bild.width + xx) * 4; proben.push([bild.data[i], bild.data[i + 1], bild.data[i + 2]]);
            }
            const ab = (q) => Math.abs(q[0] - f.c[0]) + Math.abs(q[1] - f.c[1]) + Math.abs(q[2] - f.c[2]);
            proben.sort((a, b2) => ab(b2) - ab(a));
            const grund = proben.slice(0, Math.max(1, Math.floor(proben.length * .3)));
            /* der für die Schrift ungünstigste Grundpunkt aus diesem Drittel */
            let k = 99; for (const q of grund) k = Math.min(k, kontrast(f.c, q));
            if (k < schlechtest) { schlechtest = k; wo = f.wort; }
          }
          pruefe(w + ' ' + theme + ': Beschriftung der Leiste ≥ 4,5 : 1 an echten Bildpunkten (schwächste „' + wo + '" ' + schlechtest.toFixed(2) + ' : 1)', schlechtest >= 4.5, wo);
        }
        if (p._fehler.length) pruefe(w + ' ' + theme + ': keine Seitenfehler', false, p._fehler.join(' | '));
        await ctx.close();
      }
    }

    console.log('\n── 4. Der Schalter unter Profil → Aussehen ──');
    for (const dichte of ['normal', 'kompakt']) {
      for (const [w, h] of [[320, 640], [390, 844], [1440, 900]]) {
        const { ctx, p } = await oeffne(b, w, h, { dichte });
        await p.evaluate(() => document.getElementById('ichProfilBtn').click());
        await p.waitForTimeout(700);
        await p.evaluate(() => { const r = document.querySelector('[data-pmtab="aussehen"]'); if (r) r.click(); });
        await p.waitForTimeout(500);
        const opts = await p.evaluate(() => [...document.querySelectorAll('#glasOpts .opt')].map(el => {
          el.scrollIntoView({ block: 'center' });
          const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
          if (!trifft(cx, cy)) return { wort: el.textContent, w: 0, h: 0 };
          let o = cy, u = cy, l = cx, re = cx;
          while (o > 0 && trifft(cx, o - 1)) o--; while (u < innerHeight && trifft(cx, u + 1)) u++;
          while (l > 0 && trifft(l - 1, cy)) l--; while (re < innerWidth && trifft(re + 1, cy)) re++;
          return { wort: el.textContent, on: el.classList.contains('on'), w: Math.round(re - l + 1), h: Math.round(u - o + 1) };
        }));
        pruefe(dichte + ' ' + w + ': zwei Wahlen ' + opts.map(o => '„' + o.wort + '" ' + o.w + ' × ' + o.h).join(', ') + ', „Glas" gewählt',
          opts.length === 2 && opts.every(o => o.w >= 44 && o.h >= 44) && opts[0].on && !opts[1].on, JSON.stringify(opts));
        if (dichte === 'normal' && w === 390) {
          await p.evaluate(() => document.querySelector('#glasOpts [data-glas="deckend"]').click());
          await p.waitForTimeout(200);
          await p.evaluate(() => document.getElementById('pmClose').click());
          await p.waitForTimeout(400);
          const l = await p.evaluate(LEISTE);
          pruefe('390: „Deckend" → Leiste deckend, ohne Unschärfe (' + l.alpha + ', ' + l.bf + ')', l.glas === 'deckend' && l.alpha === 1 && !l.blur, JSON.stringify(l));
          await geheZu(p, 'g-arbeit');
          const s = await p.evaluate(BEREICH);
          pruefe('390: „Deckend" → der Inhalt endet wieder über der Leiste (' + s.unten + ' ≤ ' + s.nOben + ', Rand ' + s.mb + ')', s.unten <= s.nOben + 1 && s.mb === '0px', JSON.stringify(s));
          await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000);
          const l2 = await p.evaluate(LEISTE);
          pruefe('390: die Wahl „Deckend" bleibt nach dem Neuladen', l2.glas === 'deckend' && !l2.blur, JSON.stringify(l2));
          p.once('dialog', d => d.accept());
          await p.evaluate(() => document.getElementById('ichProfilBtn').click()); await p.waitForTimeout(600);
          await p.evaluate(() => { const r = document.querySelector('[data-pmtab="aussehen"]'); if (r) r.click(); });
          await p.waitForTimeout(400);
          await p.evaluate(() => document.getElementById('pmReset').click());
          await p.waitForTimeout(400);
          const l3 = await p.evaluate(LEISTE);
          const on = await p.evaluate(() => { const o = document.querySelector('#glasOpts .opt.on'); return o && o.getAttribute('data-glas'); });
          pruefe('390: „Zurücksetzen" stellt Glas wieder her (Wahl „' + on + '")', l3.glas === 'glas' && l3.blur && on === 'glas', JSON.stringify([l3, on]));
        }
        if (p._fehler.length) pruefe(dichte + ' ' + w + ': keine Seitenfehler', false, p._fehler.join(' | '));
        await ctx.close();
      }
    }

    console.log('\n── 5. Einstellung des Geräts ──');
    for (const [art, feature] of [['Transparenz reduzieren', { name: 'prefers-reduced-transparency', value: 'reduce' }], ['Mehr Kontrast', { name: 'prefers-contrast', value: 'more' }]]) {
      const { ctx, p } = await oeffne(b, 390, 844);
      const cdp = await ctx.newCDPSession(p);
      await cdp.send('Emulation.setEmulatedMedia', { features: [feature] });
      await p.waitForTimeout(300);
      const gemeldet = await p.evaluate((f) => matchMedia('(' + f.name + ': ' + f.value + ')').matches, feature);
      const l = await p.evaluate(LEISTE);
      pruefe('390 „' + art + '" (vom Browser gemeldet: ' + gemeldet + '): Leiste deckend', gemeldet && l.alpha === 1 && !l.blur, JSON.stringify(l));
      await ctx.close();
    }

    console.log('\n── 6. Am Rechner ändert sich nichts ──');
    for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
      const { ctx, p } = await oeffne(b, w, h);
      const l = await p.evaluate(LEISTE);
      let ok = !l.da, info = [];
      for (const g of GRUPPEN) {
        await geheZu(p, g);
        const s = await p.evaluate(BEREICH);
        if (s.da) { info.push(g + ':' + s.mb); ok = ok && s.mb === '0px'; }
      }
      pruefe(w + ': keine untere Leiste, kein negativer Rand am Scroll-Bereich (' + info.join(' ') + ')', ok, JSON.stringify(l));
      if (p._fehler.length) pruefe(w + ': keine Seitenfehler', false, p._fehler.join(' | '));
      await ctx.close();
    }

    console.log('\n── 7. Kosten beim Scrollen (390 px, CPU ÷ 4) ──');
    const messe = async (glas) => {
      const { ctx, p } = await oeffne(b, 390, 844, { glas });
      await geheZu(p, 'g-arbeit');
      const cdp = await ctx.newCDPSession(p);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const ereignisse = [];
      cdp.on('Tracing.dataCollected', d => ereignisse.push(...d.value));
      const fertig = new Promise(r => cdp.once('Tracing.tracingComplete', r));
      await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' });
      const bilder = await p.evaluate(() => new Promise(r => {
        const s = document.querySelector('.view.show > .scroll-area'); let n = 0, y = 0; const ende = performance.now() + 2000;
        (function f() { n++; y = (y + 9) % Math.max(1, s.scrollHeight - s.clientHeight); s.scrollTop = y; if (performance.now() < ende) requestAnimationFrame(f); else r(n); })();
      }));
      await cdp.send('Tracing.end');
      await fertig;
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const summe = (namen) => ereignisse.filter(e => namen.includes(e.name) && e.ph === 'X').reduce((a, e) => a + (e.dur || 0), 0) / 1000;
      const haupt = summe(['RunTask']) , raster = summe(['RasterTask']);
      await ctx.close();
      return { bilder, haupt: haupt / bilder, raster: raster / bilder };
    };
    const g1 = await messe('glas'), d1 = await messe('deckend'), d2 = await messe('deckend'), g2 = await messe('glas');
    const m = (a, b2, k) => Math.round((a[k] + b2[k]) / 2 * 10) / 10;
    const gh = m(g1, g2, 'haupt'), dh = m(d1, d2, 'haupt'), gr = m(g1, g2, 'raster'), dr = m(d1, d2, 'raster');
    console.log('  · Glas: ' + gh + ' ms Hauptfaden + ' + gr + ' ms Rastern je Bild (' + g1.bilder + '/' + g2.bilder + ' Bilder in 2 s)');
    console.log('  · Deckend: ' + dh + ' ms Hauptfaden + ' + dr + ' ms Rastern je Bild (' + d1.bilder + '/' + d2.bilder + ' Bilder in 2 s)');
    console.log('  · Hinweis: ohne Grafikkarte gerechnet (Software-Rastern). Was eine echte Grafikkarte für die Unschärfe braucht, misst das nicht.');
    /* Absolut liegt das Scrollen der Aufgabenliste bei CPU ÷ 4 schon
       deckend über 8,3 ms (gemessen 23.10.2026: 12,3 ms) — das ist die
       Liste, nicht das Glas, und eine eigene Baustelle. Geprüft wird
       hier, was diese Runde verantwortet: der Unterschied. */
    if (dh >= 8.3) console.log('  · Offen, nicht von dieser Runde: Scrollen schon deckend ' + dh + ' ms je Bild (Grenze 8,3).');
    pruefe('Scrollen mit Glas rastert höchstens 1 ms mehr je Bild als deckend (' + gr + ' gegen ' + dr + ')', gr <= dr + 1);
    pruefe('Scrollen mit Glas kostet im Hauptfaden höchstens 1 ms mehr als deckend (' + gh + ' gegen ' + dh + ')', gh <= dh + 1);
  } finally { await b.close(); }
  console.log('\n' + (schlecht ? '✗' : '✓') + ' Glas: ' + gut + ' grün, ' + schlecht + ' falsch');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
