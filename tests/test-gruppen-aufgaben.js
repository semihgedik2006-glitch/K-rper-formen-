/* ══ AUFGABEN UND PUTZPLAN IN GRUPPEN, EIN HAUPTKNOPF (Runde 244) ═════
   Aus dem Betrieb, 23.10.2026, nach „Gruppen und Titel“ auf der
   Startseite: „mach weiter“. Plan „Studio Chat wie von Apple“, Schritt
   „Gruppen und Knöpfe“: Karten werden Gruppen, ein Hauptknopf je Ansicht.

   Geprüft wird in den Stilen Formi, Dunkel und Hell, im Stil Formi bei 320 / 390 / 430 / 820 / 1280 / 1440 / 1920 px,
   in Dunkel und Hell bei 390 und 1440 px,
   in Aufgaben und Putzplan:
    1. Die Zeilen einer Gruppe stossen ohne Lücke aneinander; nur die
       erste ist oben gerundet, nur die letzte unten, die mittleren gar
       nicht. GEGENPROBE: zwischen zwei Gruppen bleibt Abstand.
    2. Zwischen zwei Zeilen steht eine Haarlinie.
    3. Zustände bleiben: eine erledigte Zeile ist blass, eine
       überfällige hat links einen breiteren Rand als ihre Nachbarn
       (nicht im Stil Formi, dort trägt die Kante Formis Farbe).
    4. Haken und „…“ treffen ≥ 44 × 44 (elementFromPoint), normal und
       kompakt.
    5. Am Rechner ist „+ Neu“ gefüllt, die Werkzeuge daneben nicht; die
       Schrift auf „+ Neu“ hat an echten Bildpunkten ≥ 4,5 : 1.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
function lum(c) { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); }
function kontrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
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

async function oeffne(b, w, h, theme) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript((pr) => {
    try { localStorage.setItem('kf_tour', '99:demo-ich'); localStorage.setItem('kf_prefs', pr); } catch (e) {}
  }, JSON.stringify({ theme, stil2: true }));
  /* Die Demo statt der Attrappe: nur sie hat Aufgaben UND einen Putzplan
     mit erledigten und offenen Punkten (stub-chef kennt keinen Putzplan). */
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(2500);
  await p.evaluate(() => { const e = [...document.querySelectorAll('[data-group="g-arbeit"]')].find(x => x.getClientRects().length); if (e) e.click(); });
  await p.waitForTimeout(900);
  p._ctx = ctx;
  return p;
}
async function reiter(p, wort) {
  await p.evaluate((w) => { const e = [...document.querySelectorAll('#subnav button')].find(x => x.textContent.includes(w) && x.getClientRects().length); if (e) e.click(); }, wort);
  await p.waitForTimeout(800);
}

const LAGE = (SEL) => {
  const sicht = (e) => e.getClientRects().length > 0;
  const gruppen = [...document.querySelectorAll('.pp-gruppe')].filter(sicht);
  return gruppen.map(g => {
    const z = [...g.children].filter(c => c.matches(SEL) && sicht(c));
    const cs = z.map(x => getComputedStyle(x));
    const rund = (c, ecke) => parseFloat(c[ecke]);
    return {
      zahl: z.length,
      /* Gemessen wird die LAGE (offsetTop), nicht das Bild: die Zeilen
         blenden mit einer Verschiebung ein (rowIn), und im Stil Formi
         gestaffelt — mitten darin sähe es nach Lücken aus. */
      luecken: z.slice(1).map((x, i) => Math.round(x.offsetTop - (z[i].offsetTop + z[i].offsetHeight))),
      oben: cs.map(c => rund(c, 'borderTopLeftRadius')),
      unten: cs.map(c => rund(c, 'borderBottomLeftRadius')),
      linie: z.slice(1).map(x => { const s = getComputedStyle(x, '::after'); return s.content !== 'none' && s.height === '1px'; }),
      unterkante: g.getBoundingClientRect().bottom, oberkante: g.getBoundingClientRect().top,
      links: g.getBoundingClientRect().left
    };
  });
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  for (const theme of ['formi', 'dark', 'light']) {
    /* Alle sieben Breiten aus CLAUDE.md im Hauptstil, die anderen
       beiden Stile bei je einer Handy- und einer Rechnerbreite. */
    const breiten = theme === 'formi'
      ? [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]
      : [[390, 844], [1440, 900]];
    for (const [w, h] of breiten) {
      const p = await oeffne(b, w, h, theme);
      for (const [name, sel] of [['Aufgaben', '.todo'], ['Putzplan', '.pp-item']]) {
        console.log('\n── ' + name + ', Stil ' + theme + ', ' + w + ' px ──');
        await reiter(p, name);
        const g = await p.evaluate(LAGE, sel);
        const mehr = g.filter(x => x.zahl >= 2);
        pruefe('Zeilen einer Gruppe ohne Lücke (' + g.length + ' Gruppen, ' + mehr.length + ' mit mehreren Zeilen)',
          mehr.length >= 1 && mehr.every(x => x.luecken.every(l => Math.abs(l) <= 1)), JSON.stringify(g.map(x => x.luecken)));
        pruefe('nur die erste oben, nur die letzte unten gerundet',
          g.every(x => x.zahl === 0 || (x.oben[0] >= 12 && x.unten[x.zahl - 1] >= 12 &&
            x.oben.slice(1).every(r => r === 0) && x.unten.slice(0, -1).every(r => r === 0))),
          JSON.stringify(g.map(x => [x.oben, x.unten])));
        pruefe('Haarlinie zwischen zwei Zeilen', mehr.every(x => x.linie.every(Boolean)), JSON.stringify(mehr.map(x => x.linie)));
        /* GEGENPROBE: zwei Gruppen untereinander (gleiche Spalte) stehen
           mit Abstand — es ist keine einzige lange Fläche geworden. */
        const paare = [];
        for (const a of g) for (const c of g) if (a !== c && Math.abs(a.links - c.links) < 2 && c.oberkante > a.unterkante - 1) paare.push(Math.round(c.oberkante - a.unterkante));
        if (paare.length) pruefe('GEGENPROBE: zwischen zwei Gruppen bleibt Abstand (≥ 12 px)', Math.min(...paare) >= 12, JSON.stringify(paare));

        const z = await p.evaluate((s) => {
          const sicht = (e) => e.getClientRects().length > 0;
          /* Eine Zeile, die gerade nicht einblendet oder aufblitzt: mitten
             in rowIn/doneFlash ist die Deckkraft eine Zwischenstufe. */
          const done = [...document.querySelectorAll('.pp-gruppe > ' + s + '.done')].find(e => sicht(e) && !e.getAnimations().length);
          const ueber = [...document.querySelectorAll('.pp-gruppe > .todo.overdue')].find(sicht);
          const normal = [...document.querySelectorAll('.pp-gruppe > ' + s + ':not(.overdue):not(.done)')].find(sicht);
          return { blass: done ? +getComputedStyle(done).opacity : null,
                   randUeber: ueber ? parseFloat(getComputedStyle(ueber).borderLeftWidth) : null,
                   randNormal: normal ? parseFloat(getComputedStyle(normal).borderLeftWidth) : null };
        }, sel);
        if (z.blass !== null) pruefe('erledigt bleibt blass (' + z.blass + ')', z.blass < 0.8);
        if (sel === '.todo' && theme !== 'formi' && z.randUeber !== null)
          pruefe('überfällig behält den breiteren Rand links (' + z.randUeber + ' gegen ' + z.randNormal + ' px)', z.randUeber > z.randNormal);

        for (const dichte of ['normal', 'kompakt']) {
          const r = await p.evaluate(async ([SRC, d, s]) => {
            const T = eval('(' + SRC + ')');
            document.body.dataset.dichte = d;
            await new Promise(r => setTimeout(r, 150));
            const els = [...document.querySelectorAll('.pp-gruppe > ' + s + ' .check, .pp-gruppe > ' + s + ' .t-mehr, .pp-gruppe > ' + s + ' .pp-mehr')]
              .filter(e => e.getClientRects().length && getComputedStyle(e).display !== 'none').slice(0, 12);
            const aus = [];
            for (const e of els) {
              e.scrollIntoView({ block: 'center', behavior: 'instant' });
              await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
              /* Die Zeile blendet mit einer Verschiebung ein (hudEin,
                 rowIn). Unter Last ist sie beim Messen noch unterwegs und
                 der Hit-Test trifft ihre Kante — erst warten, bis sie steht. */
              const zeile = e.closest('.todo, .pp-item');
              if (zeile) await Promise.race([Promise.all(zeile.getAnimations().map(a => a.finished.catch(() => {}))), new Promise(r => setTimeout(r, 1500))]);
              let m = T(e), kugel = false;
              /* Bei 320 px schwebt Formis Kugel (fest, rechts unten) genau
                 über der Bildmitte. Sie liegt über allem und lässt sich
                 wegrollen — dann die Zeile oben messen. Gezählt wird, wie
                 oft das nötig war; es steht im Bericht. */
              const q = e.getBoundingClientRect(), oben = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
              if (!m.w && oben && oben.closest('#formiKugel')) {
                kugel = true;
                e.scrollIntoView({ block: 'start', behavior: 'instant' });
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
                m = T(e);
              }
              aus.push({ k: e.className.split(' ')[0], m, kugel });
            }
            return aus;
          }, [TREFFER.toString(), dichte, sel]);
          const unterKugel = r.filter(x => x.kugel).length;
          pruefe(dichte + ': Haken und „…“ ≥ 44 × 44 (' + r.length + ' gemessen' + (unterKugel ? ', ' + unterKugel + ' erst nach Wegrollen unter Formis Kugel hervor' : '') + ')', r.length >= 2 && r.every(x => x.m.w >= 44 && x.m.h >= 44),
            JSON.stringify(r.filter(x => x.m.w < 44 || x.m.h < 44)));
        }
        await p.evaluate(() => { document.body.dataset.dichte = 'normal'; document.querySelector('#view-todos .scroll-area, .scroll-area').scrollTop = 0; });
      }

      if (w > 820) {
        await reiter(p, 'Aufgaben');
        const k = await p.evaluate(() => {
          const plus = [...document.querySelectorAll('.bereich-zeile .kopf-plus')].find(e => e.getClientRects().length);
          if (!plus) return null;
          const r = plus.getBoundingClientRect();
          const werkzeuge = [...document.querySelectorAll('#view-todos .pp-leiste .btn, #view-todos .btn-ghost')].filter(e => e.getClientRects().length);
          const leer = (c) => c === 'rgba(0, 0, 0, 0)' || c === 'transparent';
          /* Die Fläche ist --brand, ein Verlauf: sie steht in
             background-image, nicht in background-color. */
          const flaeche = (e) => { const c = getComputedStyle(e); return c.backgroundImage !== 'none' ? c.backgroundImage : c.backgroundColor; };
          return { x: r.left, y: r.top, w: r.width, h: r.height, farbe: getComputedStyle(plus).color,
                   gefuellt: /gradient/.test(getComputedStyle(plus).backgroundImage) || !leer(getComputedStyle(plus).backgroundColor),
                   grund: flaeche(plus),
                   werkzeuge: werkzeuge.map(flaeche) };
        });
        console.log('\n── Hauptknopf, Stil ' + theme + ' ──');
        pruefe('„+ Neu“ ist im Bild', !!k);
        if (k) {
          pruefe('„+ Neu“ ist gefüllt (' + k.grund + ')', k.gefuellt);
          pruefe('die Werkzeuge daneben tragen nicht dieselbe Fläche (' + k.werkzeuge.length + ')', k.werkzeuge.length >= 1 && k.werkzeuge.every(c => c !== k.grund), JSON.stringify(k.werkzeuge));
          const bild = await p.screenshot({ clip: { x: k.x, y: k.y, width: k.w, height: k.h } });
          const proben = await p.evaluate(async (b64) => {
            const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
            const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
            const x = c.getContext('2d'); x.drawImage(img, 0, 0);
            const d = x.getImageData(0, 0, c.width, c.height).data;
            const out = [];
            for (const fx of [0.12, 0.88]) for (const fy of [0.25, 0.5, 0.75]) {
              const i = (Math.round(c.height * fy) * c.width + Math.round(c.width * fx)) * 4;
              out.push([d[i], d[i + 1], d[i + 2]]);
            }
            return out;
          }, bild.toString('base64'));
          const text = k.farbe.match(/[\d.]+/g).slice(0, 3).map(Number);
          const kk = Math.min(...proben.map(x => kontrast(x, text)));
          pruefe('„+ Neu“: Schrift an Bildpunkten ' + kk.toFixed(1) + ' : 1 (≥ 4,5)', kk >= 4.5, JSON.stringify(proben));
        }
      }
      pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Aufgaben in Gruppen: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Aufgaben in Gruppen: eine Fläche je Gruppe, Zustände bleiben, ein Hauptknopf — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
