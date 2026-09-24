/* ══════════════════════════════════════════════════════════════════════
   DIE KOPFZEILE: JEDER GRIFF 44 × 44, AUF JEDEM GERÄT

   Aus dem Betrieb, 24.9.2026:
     „bitte leg genau so viel Fokus auf die PC-Nutzung wie auf die
      Handy-Nutzung … obwohl das das Hauptgerät ist, welches wir
      aktuell nutzen"

   Die 44-px-Regel galt in der Kopfzeile nur bis 520 px. Am Rechner
   waren Glocke, Hell/Dunkel und Abmelden 40 × 40, Bericht, Hilfe und
   Suchen 36 px hoch, das Kürzel 38 × 38. Dazwischen, bei 600 px, lag
   der Abmelde-Knopf der Leitung ganz ausserhalb (0 × 0), und bei 530 px
   drückte der Browser die Glocke auf 20 px zusammen.

   Was dieser Durchlauf festhält:
   1. Jeder sichtbare Griff in der Kopfzeile ≥ 44 × 44 — per
      elementFromPoint, nicht per Rechteck —, für Leitung UND
      Mitarbeiter (die Leitung hat zwei Knöpfe mehr), in „normal" und
      „kompakt", bei 320 bis 1920 px.
   2. Kein Wort in einem Knopf ist abgeschnitten. Beim ersten Versuch
      stand dort „Beric" statt „Bericht", und Punkt 1 war trotzdem grün
      — ein abgeschnittener Knopf ist ja immer noch 44 px hoch.
   3. Die Kopfzeile bleibt eine Zeile (höchstens 70 px) und die Seite
      läuft nicht seitlich über.
   4. Am Rechner stehen Name und Rolle da, darunter nicht — dort brach
      der Name um und machte die Zeile 86 px hoch.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

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

const BREITEN = [[320, 568], [390, 844], [430, 932], [521, 900], [530, 900], [600, 900],
  [700, 900], [820, 1180], [1024, 768], [1280, 800], [1440, 900], [1920, 1080]];

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const rolle of ['chef', 'mitarbeiter']) {
    console.log('\n── ' + (rolle === 'chef' ? 'Leitung' : 'Mitarbeiter') + ' ──');
    for (const [w, h] of BREITEN) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      const fehler = [];
      p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
      await p.route('**://www.gstatic.com/**', r => r.abort());
      await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
      await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(3000);
      for (const dichte of ['normal', 'kompakt']) {
        await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
        await p.waitForTimeout(150);
        const r = await p.evaluate((SRC) => {
          const T = eval('(' + SRC + ')');
          const kopf = document.querySelector('header.topbar');
          const els = [...kopf.querySelectorAll('button, a[href], #uAvatar')]
            .filter(e => e.offsetParent !== null);
          const name = (e) => e.id || e.className.split(' ')[0];
          return {
            zahl: els.length,
            hoehe: Math.round(kopf.getBoundingClientRect().height),
            quer: document.documentElement.scrollWidth - innerWidth,
            klein: els.map(e => ({ n: name(e), m: T(e) }))
              .filter(x => x.m.w < 44 || x.m.h < 44).map(x => x.n + ' ' + x.m.w + '×' + x.m.h),
            /* Ein Wort, das nicht in seinen Knopf passt, steht über den
               Rand hinaus — scrollWidth grösser als der Kasten. */
            geschnitten: els.filter(e => e.scrollWidth > e.clientWidth + 1)
              .map(e => name(e) + ' ' + e.scrollWidth + '>' + e.clientWidth),
            wer: (() => { const x = document.querySelector('.tb-who');
              return !!x && getComputedStyle(x).display !== 'none'; })()
          };
        }, TREFFER.toString());
        const wo = w + ' px, ' + dichte;
        pruefe(wo + ': jeder Griff ≥ 44 × 44 (' + r.zahl + ' gemessen)', r.zahl >= 4 && !r.klein.length,
          r.klein.join(', '));
        pruefe(wo + ': kein Wort abgeschnitten', !r.geschnitten.length, r.geschnitten.join(', '));
        pruefe(wo + ': eine Zeile (' + r.hoehe + ' px), nichts ragt hinaus', r.hoehe <= 70 && r.quer <= 0,
          r.hoehe + ' px hoch, ' + r.quer + ' px quer');
        if (dichte === 'normal') {
          if (w >= 1100) pruefe(wo + ': Name und Rolle stehen da', r.wer);
          else pruefe(wo + ': GEGENPROBE ohne Name (bricht sonst um)', !r.wer);
        }
      }
      pruefe(w + ' px ohne Skriptfehler', !fehler.length, fehler.join(' | '));
      await p.close();
    }
  }
  await b.close();
  console.log(schlecht
    ? '\n✗ Kopfzeile: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Kopfzeile: jeder Griff 44 × 44 von 320 bis 1920 px, kein Wort abgeschnitten — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
