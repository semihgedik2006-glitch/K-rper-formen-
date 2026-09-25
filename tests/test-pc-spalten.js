/* ══════════════════════════════════════════════════════════════════════
   AM RECHNER ZWEI SPALTEN: MATERIAL, GERÄTE, PROBETRAINING, SCHULUNG

   CLAUDE.md, „Der PC ist das Hauptgerät": „Eine Ansicht, die am Rechner
   eine Spalte über 1.200 px zieht, ist dort genauso ungestaltet wie ein
   abgeschnittener Knopf auf dem Handy." Und aus dem Betrieb, 25.9.2026:
   „mach weiter mit design sachen".

   Gemessen vorher bei 1440 px: in allen vier Ansichten waren die Karten
   über 1.000 px breit, das Probetraining 5.298 px lang.

   Geprüft wird bei 1280 / 1440 / 1920:
   1. Material: Tabelle links, „Reicht noch" + Einkaufsliste rechts, auf
      gleicher Höhe. Die Tabelle ist schmaler als 1.000 px.
   2. Geräte (Leitung): Liste links, „Gerät aufnehmen" rechts.
      GEGENPROBE Mitarbeiter: ohne die rechte Karte eine Spalte — keine
      leere Spalte daneben.
   3. Probetraining: Einträge links, Quote rechts; die Seite ist
      deutlich kürzer als vorher (unter 4.000 px).
   4. Schulung: die Module in zwei Spalten.
   5. Nichts ragt seitlich hinaus; jedes Bedienelement ≥ 44 × 44 (eine
      Stichprobe je Ansicht, normal und kompakt).
   6. GEGENPROBE am Handy (390 px): alles untereinander wie vorher.
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
const GRUPPE = { material: 'g-arbeit', geraete: 'g-arbeit', probe: 'g-arbeit', schulung: 'g-ich' };
async function oeffne(b, w, h, rolle) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + (rolle || 'chef'), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
async function zu(p, v) {
  await p.evaluate((g) => { const k = document.querySelector('.mobnav [data-group="' + g + '"], #side [data-group="' + g + '"]'); if (k) k.click(); }, GRUPPE[v]);
  await p.waitForTimeout(700);
  await p.evaluate((v) => { const b = document.querySelector('[data-subview="' + v + '"]'); if (b) b.click(); }, v);
  await p.waitForTimeout(1300);
}
const kasten = (p, sel) => p.evaluate((sel) => {
  const e = document.querySelector(sel); if (!e || !e.offsetParent) return null;
  const k = e.getBoundingClientRect(); return { l: Math.round(k.left), r: Math.round(k.right), t: Math.round(k.top), w: Math.round(k.width) };
}, sel);
const nebeneinander = (a, b) => !!a && !!b && b.l >= a.r - 1 && Math.abs(a.t - b.t) < 6;

async function stichprobe(p, sel) {
  const aus = [];
  for (const dichte of ['normal', 'kompakt']) {
    await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
    const r = await p.evaluate(async ({ SRC, sel }) => {
      const T = eval('(' + SRC + ')');
      /* Nur, was man sieht: in einer zugeklappten Karte liegen Knöpfe mit
         0 × 0, die niemand treffen soll. */
      const els = [...document.querySelectorAll(sel)].filter(e => {
        if (!e.offsetParent || e.closest('.fold.zu .fold-body, .card.zu > :not(h3)')) return false;
        const k = e.getBoundingClientRect(); return k.width > 0 && k.height > 0;
      }).slice(0, 12);
      const zu = [];
      for (const el of els) {
        el.scrollIntoView({ block: 'center' });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const m = T(el);
        if (m.w < 44 || m.h < 44) zu.push((el.textContent.trim() || el.id || el.tagName).slice(0, 18) + ' ' + m.w + '×' + m.h);
      }
      return { zahl: els.length, zu };
    }, { SRC: TREFFER.toString(), sel });
    aus.push(dichte + ': ' + r.zahl + ' gemessen' + (r.zu.length ? ', zu klein: ' + r.zu.join(', ') : ''));
    if (r.zu.length || !r.zahl) return { ok: false, text: aus.join(' | ') };
  }
  return { ok: true, text: aus.join(' | ') };
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
    console.log('\n── ' + w + ' × ' + h + ' ──');
    const p = await oeffne(b, w, h);

    await zu(p, 'material');
    const tab = await kasten(p, '#view-material .scroll-area > .card');
    const seite = await kasten(p, '#view-material .mat-seite');
    pruefe('Material: Tabelle links, „Reicht noch" und Einkaufsliste rechts daneben',
      nebeneinander(tab, seite) && tab.w < 1000, JSON.stringify({ tab, seite }));
    let s = await stichprobe(p, '#view-material .scroll-area button, #view-material .scroll-area select');
    pruefe('Material: Bedienelemente ≥ 44 × 44 (' + s.text + ')', s.ok);

    await zu(p, 'geraete');
    const liste = await kasten(p, '#devCard'), neu = await kasten(p, '#devAddCard');
    pruefe('Geräte: Liste links, „Gerät aufnehmen" rechts', nebeneinander(liste, neu), JSON.stringify({ liste, neu }));

    await zu(p, 'probe');
    const ein = await kasten(p, '#view-probe .scroll-area > .card:not(#pbQuotenCard)');
    const quote = await kasten(p, '#pbQuotenCard');
    const lang = await p.evaluate(() => document.querySelector('#view-probe .scroll-area').scrollHeight);
    pruefe('Probetraining: Einträge links, Quote rechts', nebeneinander(ein, quote), JSON.stringify({ ein, quote }));
    pruefe('Probetraining: die Seite ist kürzer (' + lang + ' px, vorher 5.298 bei 1440)', lang < 4000, String(lang));
    s = await stichprobe(p, '#view-probe .scroll-area button');
    pruefe('Probetraining: Bedienelemente ≥ 44 × 44 (' + s.text + ')', s.ok);

    await zu(p, 'schulung');
    const karten = await p.evaluate(() => [...document.querySelectorAll('#schListe > .sch-karte')].slice(0, 2)
      .map(k => { const r = k.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), w: Math.round(r.width) }; }));
    pruefe('Schulung: die Module in zwei Spalten', karten.length === 2 && nebeneinander(karten[0], karten[1]), JSON.stringify(karten));

    const quer = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    pruefe('nichts ragt seitlich hinaus', quer <= 0, String(quer));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── GEGENPROBEN ──');
  {
    const p = await oeffne(b, 1440, 900, 'mitarbeiter');
    await zu(p, 'geraete');
    const liste = await kasten(p, '#devCard');
    const neu = await kasten(p, '#devAddCard');
    pruefe('Mitarbeiter am Rechner: ohne „Gerät aufnehmen" steht die Liste allein, ohne leere Spalte',
      !neu && !!liste && liste.w > 1000, JSON.stringify({ liste, neu }));
    await p.close();
  }
  {
    const p = await oeffne(b, 390, 844);
    await zu(p, 'material');
    const tab = await kasten(p, '#view-material .scroll-area > .card'), seite = await kasten(p, '#view-material .mat-seite');
    pruefe('Handy: Material untereinander wie vorher', !!tab && !!seite && tab.t > seite.t && !nebeneinander(tab, seite), JSON.stringify({ tab, seite }));
    await zu(p, 'schulung');
    const k = await p.evaluate(() => [...document.querySelectorAll('#schListe > .sch-karte')].slice(0, 2).map(x => Math.round(x.getBoundingClientRect().left)));
    pruefe('Handy: Schulungsmodule untereinander', k.length === 2 && k[0] === k[1], JSON.stringify(k));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ PC-Spalten: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ PC-Spalten: Material, Geräte, Probetraining und Schulung nutzen am Rechner die Breite — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
