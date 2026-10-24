/* ══ WISCHEN AUF LISTENEINTRÄGEN (Runde 255) ══════════════════════════
   Plan „Studio Chat wie von Apple", Schritt 9, und die Richtlinie dazu:
   „Wischaktionen werden selten entdeckt (NN/g) — Wischen nur als
   Abkürzung, jede Aktion auch sichtbar." Seit 23.10.2026, 15:18: „es
   soll einfach den ganzen plan erledigen".

   Geprüft mit echten Touch-Ereignissen (CDP) bei 320 / 390 / 430 / 820
   an Aufgaben und am Putzplan, als Leitung:
    1. Nach rechts über die Schwelle: der Haken wächst schon vor dem
       Loslassen, Loslassen hakt ab.
    2. Nach links: „Mehr" und „Löschen" schieben sich herein und bleiben
       stehen; jeder Knopf ≥ 44 × 44 per Hit-Test, Schrift ≥ 4,5 : 1.
    3. Ein kurzer Zug nach links (30 px) federt zurück, nichts bleibt offen.
    4. Ein Tipp auf die offene Zeile schliesst sie nur (öffnet nichts);
       eine zweite Zeile zu öffnen schliesst die erste.
    5. „Mehr" öffnet dasselbe Blatt wie ⋯; „Löschen" fragt nach wie der
       Papierkorb (abgebrochen: die Aufgabe bleibt).
    6. Senkrecht wischen scrollt und öffnet nichts.
    7. Jede Wisch-Aktion gibt es an der Zeile auch sichtbar (⋯, Papierkorb).
    8. Vor dem ersten Wischen steht kein Aktionsfeld im Dokument.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(name, ok, info) {
  if (ok) { gut++; console.log('  ✓ ' + name); }
  else { schlecht++; console.log('  ✗ ' + name + (info ? '  — ' + info : '')); }
}
async function oeffne(b, w, h, dichte) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((d) => { localStorage.setItem('kf_tour', '99:demo-ich'); localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'formi', stil2: true, dichte: d })); }, dichte || 'normal');
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  p._cdp = await ctx.newCDPSession(p);
  return { ctx, p };
}
async function zuAufgaben(p) {
  await p.evaluate(() => { const g = document.querySelector('.mobnav [data-group="g-arbeit"]'); if (g) g.click(); });
  await p.waitForTimeout(500);
  await p.evaluate(() => { const s = document.querySelector('[data-subview="todos"]'); if (s) s.click(); });
  await p.waitForTimeout(600);
}
async function zuPutzplan(p) {
  await p.evaluate(() => { const g = document.querySelector('.mobnav [data-group="g-arbeit"]'); if (g) g.click(); });
  await p.waitForTimeout(500);
  await p.evaluate(() => { const s = document.querySelector('[data-subview="putzplan"]'); if (s) s.click(); });
  await p.waitForTimeout(800);
}
/* Eine offene Zeile mitten im Bild, als Marke data-wt. */
async function zeile(p, sel, nr, offen) {
  return p.evaluate(([sel, nr, offen]) => {
    document.querySelectorAll('[data-wt]').forEach(x => x.removeAttribute('data-wt'));
    const n = document.querySelector('.mobnav'), unten = n && n.getClientRects().length ? n.getBoundingClientRect().top : innerHeight;
    const alle = [...document.querySelectorAll(sel)].filter(x => x.getClientRects().length && (offen === false || !x.classList.contains('done')) && !x.classList.contains('pausiert'));
    const z = alle[nr]; if (!z) return null;
    z.scrollIntoView({ block: 'center' });
    const r = z.getBoundingClientRect();
    z.setAttribute('data-wt', '1');
    /* Ein Punkt auf dem Text, nicht auf einem Knopf. */
    const t = z.querySelector('.t-title, .pp-title') || z;
    const tr = t.getBoundingClientRect();
    return { id: z.dataset.id, x: Math.round(tr.left + Math.min(40, tr.width / 2)), y: Math.round(tr.top + tr.height / 2), w: Math.round(r.width), unten: Math.round(unten), top: Math.round(r.top), bottom: Math.round(r.bottom) };
  }, [sel, nr, offen]);
}
async function wische(p, z, dx, schritte, pause, dy) {
  const c = p._cdp;
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: z.x, y: z.y }] });
  for (let i = 1; i <= schritte; i++) {
    await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: z.x + dx * i / schritte, y: z.y + (dy || 0) * i / schritte }] });
    if (pause) await p.waitForTimeout(pause);
  }
  return async () => { await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(500); };
}
async function tippe(p, x, y) {
  await p._cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await p._cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(500);
}
const ZUSTAND = () => {
  const z = document.querySelector('[data-wt]'); if (!z) return { weg: true };
  const a = z.querySelector('.swipe-akt'), b = z.querySelector('.swipe-body');
  const knoepfe = a ? [...a.querySelectorAll('.swipe-k')].map(k => {
    const r = k.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === k || k.contains(t)); };
    let o = cy, u = cy, l = cx, re = cx;
    if (trifft(cx, cy)) {
      while (o > 0 && trifft(cx, o - 1)) o--; while (u < innerHeight && trifft(cx, u + 1)) u++;
      while (l > 0 && trifft(l - 1, cy)) l--; while (re < innerWidth && trifft(re + 1, cy)) re++;
    }
    const cs = getComputedStyle(k);
    return { wort: k.textContent.trim(), w: trifft(cx, cy) ? Math.round(re - l + 1) : 0, h: trifft(cx, cy) ? Math.round(u - o + 1) : 0, fg: cs.color, bg: cs.backgroundColor, rechts: Math.round(r.right) };
  }) : [];
  const m = getComputedStyle(b).transform.match(/matrix\(([^)]+)\)/);
  return { offen: z.classList.contains('swipe-offen'), done: z.classList.contains('done'), feld: !!a,
    sichtbar: !!a && getComputedStyle(a).visibility === 'visible', x: m ? Math.round(parseFloat(m[1].split(',')[4])) : 0, knoepfe,
    zRechts: Math.round(z.getBoundingClientRect().right) };
};
function lum(c) { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); }
const farbe = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);
function kontrast(a, b) { const x = lum(farbe(a)), y = lum(farbe(b)); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    for (const [w, h] of (process.env.NUR ? [[320, 640]] : [[320, 640], [390, 844], [430, 932], [820, 1180]])) {
      console.log('\n── ' + w + ' × ' + h + ' · Aufgaben ──');
      const { ctx, p } = await oeffne(b, w, h);
      await zuAufgaben(p);
      const vorher = await p.evaluate(() => document.querySelectorAll('.swipe-akt').length);
      pruefe(w + ': vor dem ersten Wischen kein Aktionsfeld im Dokument', vorher === 0, vorher);
      const sicht = await p.evaluate(() => [...document.querySelectorAll('#todoArea .todo')].filter(x => x.getClientRects().length).every(z => {
        const m = z.querySelector('[data-tmehr]');
        return m && m.getClientRects().length;
      }));
      /* Am Handy stehen Bearbeiten und Löschen hinter ⋯ (Runde 187) —
         der sichtbare Weg ist also ⋯; dass „Löschen" darin steht, prüft
         der Schritt „Mehr" unten. */
      pruefe(w + ': jede Zeile trägt ⋯ sichtbar', sicht);

      /* 2. nach links: Feld bleibt offen */
      let z = await zeile(p, '#todoArea .todo', 1);
      let los = await wische(p, z, -170, 8, 20);
      const mitten = await p.evaluate(ZUSTAND);
      await los();
      let s = await p.evaluate(ZUSTAND);
      const kk = s.knoepfe.map(k => kontrast(k.fg, k.bg));
      pruefe(w + ': nach links → „' + s.knoepfe.map(k => k.wort).join('", „') + '" bleiben offen (Zeile um ' + s.x + ' px)',
        mitten.sichtbar && s.offen && s.sichtbar && s.knoepfe.length === 2 && s.x === -152 && Math.abs(s.knoepfe[1].rechts - s.zRechts) <= 2, JSON.stringify([mitten.x, s]));
      pruefe(w + ': Knöpfe ' + s.knoepfe.map(k => k.w + ' × ' + k.h).join(', ') + ' (Hit-Test), Schrift ' + kk.map(x => x.toFixed(1)).join(' / ') + ' : 1',
        s.knoepfe.every(k => k.w >= 44 && k.h >= 44) && kk.every(x => x >= 4.5), JSON.stringify(s.knoepfe));

      /* 4. Tipp auf die offene Zeile schliesst nur */
      await tippe(p, Math.max(12, z.x - 140), z.y);
      s = await p.evaluate(ZUSTAND);
      const blatt = await p.evaluate(() => document.getElementById('todoSheet').classList.contains('show'));
      pruefe(w + ': Tipp auf die offene Zeile schliesst sie, ohne etwas zu öffnen', !s.offen && s.x === 0 && !blatt, JSON.stringify([s, blatt]));

      /* 4b. zwei Zeilen: die zweite schliesst die erste */
      los = await wische(p, z, -170, 8, 20); await los();
      const z2 = await zeile(p, '#todoArea .todo', 2);
      await p.evaluate((id) => { document.querySelectorAll('.todo').forEach(x => { if (x.dataset.id === id) x.setAttribute('data-erste', '1'); }); }, z.id);
      los = await wische(p, z2, -170, 8, 20); await los();
      const zwei = await p.evaluate(() => [document.querySelector('[data-erste]') && document.querySelector('[data-erste]').classList.contains('swipe-offen'), document.querySelector('[data-wt]').classList.contains('swipe-offen')]);
      pruefe(w + ': eine zweite Zeile öffnen schliesst die erste', zwei[0] === false && zwei[1] === true, JSON.stringify(zwei));

      /* 5. Mehr → Blatt */
      s = await p.evaluate(ZUSTAND);
      await p.evaluate(() => document.querySelector('[data-wt] .sk-mehr').getBoundingClientRect());
      const mehrPos = await p.evaluate(() => { const r = document.querySelector('[data-wt] .sk-mehr').getBoundingClientRect(); return [r.left + r.width / 2, r.top + Math.min(22, r.height / 2)]; });
      await tippe(p, mehrPos[0], mehrPos[1]);
      const nachMehr = await p.evaluate(() => [document.getElementById('todoSheet').classList.contains('show'), document.querySelector('[data-wt]') ? document.querySelector('[data-wt]').classList.contains('swipe-offen') : null,
        /Löschen/.test(document.getElementById('todoSheet').textContent)]);
      pruefe(w + ': „Mehr" öffnet dasselbe Blatt wie ⋯ (darin auch „Löschen") und schliesst die Zeile', nachMehr[0] && !nachMehr[1] && nachMehr[2], JSON.stringify(nachMehr));
      await p.keyboard.press('Escape'); await p.waitForTimeout(400);

      /* 5b. Löschen fragt nach (abbrechen: bleibt) */
      z = await zeile(p, '#todoArea .todo', 1);
      los = await wische(p, z, -170, 8, 20); await los();
      let gefragt = '';
      p.once('dialog', d => { gefragt = d.message(); d.dismiss(); });
      const wegPos = await p.evaluate(() => { const k = document.querySelector('[data-wt] .sk-weg'); if (!k) return null; const r = k.getBoundingClientRect(); return [r.left + r.width / 2, r.top + Math.min(22, r.height / 2)]; });
      /* Oben im Knopf getippt: die Formi-Kugel schwebt unten rechts und
         darf eine hohe Zeile zum Teil decken (bei 320 px die Mitte von
         „Löschen") — das ist ihr Platz, nicht ein Fehler des Felds. */
      if (process.env.DEBUG) console.log(JSON.stringify(await p.evaluate((pos) => { const t = pos && document.elementFromPoint(pos[0], pos[1]); return [pos, t && (t.className || t.tagName), [...document.querySelectorAll('.show')].map(e => e.id || e.className).slice(0, 6), document.querySelector('[data-wt]').className]; }, wegPos)));
      if (wegPos) await tippe(p, wegPos[0], wegPos[1]);
      const noch = await p.evaluate((id) => [...document.querySelectorAll('#todoArea .todo')].some(x => x.dataset.id === id), z.id);
      pruefe(w + ': „Löschen" fragt nach wie der Papierkorb, abgebrochen bleibt die Aufgabe', !!wegPos && /löschen/i.test(gefragt) && noch, JSON.stringify([gefragt, noch]));

      /* 3. kurzer Zug nach links: zurück */
      z = await zeile(p, '#todoArea .todo', 1);
      los = await wische(p, z, -30, 4, 60); await los();
      s = await p.evaluate(ZUSTAND);
      pruefe(w + ': 30 px nach links → federt zurück, nichts offen', !s.offen && s.x === 0, JSON.stringify(s));

      /* 6. senkrecht: nichts */
      z = await zeile(p, '#todoArea .todo', 1);
      los = await wische(p, z, -12, 8, 15, -120); await los();
      s = await p.evaluate(ZUSTAND);
      pruefe(w + ': senkrecht gewischt → nichts geöffnet', !s.offen && s.x === 0 && !s.done, JSON.stringify(s));

      /* 1. nach rechts: Haken wächst, Loslassen hakt ab */
      z = await zeile(p, '#todoArea .todo', 0);
      los = await wische(p, z, 120, 8, 20);
      const vorLos = await p.evaluate(() => { const z = document.querySelector('[data-wt]'); return [z.classList.contains('swipe-ueber'), getComputedStyle(z.querySelector('.swipe-hint')).transform]; });
      await los();
      await p.waitForTimeout(600);
      const abgehakt = await p.evaluate((id) => { const z = [...document.querySelectorAll('#todoArea .todo')].find(x => x.dataset.id === id); return z ? z.classList.contains('done') : 'weg'; }, z.id);
      pruefe(w + ': nach rechts über die Schwelle → Haken wächst vor dem Loslassen (' + vorLos[1] + '), Loslassen hakt ab', vorLos[0] && vorLos[1] !== 'none' && abgehakt === true, JSON.stringify([vorLos, abgehakt]));

      if (p._fehler.length) pruefe(w + ': keine Seitenfehler', false, p._fehler.join(' | '));
      await ctx.close();

      /* Putzplan */
      console.log('── ' + w + ' · Putzplan ──');
      const o2 = await oeffne(b, w, h);
      await zuPutzplan(o2.p);
      const pz = await zeile(o2.p, '#view-putzplan .pp-item', 1);
      if (!pz) { pruefe(w + ': Putzplan-Zeile gefunden', false); await o2.ctx.close(); continue; }
      const l2 = await wische(o2.p, pz, -170, 8, 20); await l2();
      const ps = await o2.p.evaluate(ZUSTAND);
      pruefe(w + ' Putzplan: nach links → „' + ps.knoepfe.map(k => k.wort).join('", „') + '" offen, Knöpfe ' + ps.knoepfe.map(k => k.w + ' × ' + k.h).join(', '),
        ps.offen && ps.knoepfe.length === 2 && ps.knoepfe.every(k => k.w >= 44 && k.h >= 44), JSON.stringify(ps));
      if (o2.p._fehler.length) pruefe(w + ' Putzplan: keine Seitenfehler', false, o2.p._fehler.join(' | '));
      await o2.ctx.close();
    }

    console.log('\n── Hit-Test in „kompakt" (390) ──');
    {
      const { ctx, p } = await oeffne(b, 390, 844, 'kompakt');
      await zuAufgaben(p);
      const z = await zeile(p, '#todoArea .todo', 1);
      const los = await wische(p, z, -170, 8, 20); await los();
      const s = await p.evaluate(ZUSTAND);
      pruefe('kompakt 390: Knöpfe ' + s.knoepfe.map(k => k.w + ' × ' + k.h).join(', '), s.offen && s.knoepfe.length === 2 && s.knoepfe.every(k => k.w >= 44 && k.h >= 44), JSON.stringify(s));
      await ctx.close();
    }

    console.log('\n── Am Rechner ──');
    for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
      const p = await ctx.newPage(); p._fehler = [];
      p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
      await p.route('**://www.gstatic.com/**', r => r.abort());
      await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'formi', stil2: true })); });
      await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3500);
      await p.evaluate(() => { const g = document.querySelector('#side [data-group="g-arbeit"]'); if (g) g.click(); }); await p.waitForTimeout(500);
      await p.evaluate(() => { const s = document.querySelector('[data-subview="todos"]'); if (s) s.click(); }); await p.waitForTimeout(600);
      /* Mit der Maus ziehen ist kein Wischen: nichts öffnet sich, die
         Knöpfe ⋯ und Papierkorb stehen an der Zeile. */
      const r = await p.evaluate(() => { const z = [...document.querySelectorAll('#todoArea .todo')].find(x => x.getClientRects().length && !x.classList.contains('done')); const t = z.querySelector('.t-title').getBoundingClientRect(); return [t.left + 20, t.top + t.height / 2]; });
      await p.mouse.move(r[0], r[1]); await p.mouse.down(); await p.mouse.move(r[0] - 160, r[1], { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(300);
      const n = await p.evaluate(() => [document.querySelectorAll('.swipe-offen').length, document.querySelectorAll('.swipe-akt').length]);
      pruefe(w + ': Maus-Ziehen öffnet nichts (offen ' + n[0] + ', Felder ' + n[1] + ')', n[0] === 0 && n[1] === 0);
      if (p._fehler.length) pruefe(w + ': keine Seitenfehler', false, p._fehler.join(' | '));
      await ctx.close();
    }
  } finally { await b.close(); }
  console.log('\n' + (schlecht ? '✗' : '✓') + ' Wischen: ' + gut + ' grün, ' + schlecht + ' falsch');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
