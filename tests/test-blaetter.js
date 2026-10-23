/* ══ BLÄTTER MIT GRIFF UND RASTHÖHEN (Runde 253) ═══════════════════════
   Plan „Studio Chat wie von Apple", Schritt 7: „Blatt (Sheet): Rasthöhen
   halb und voll, ein Griff oben zeigt, dass man ziehen kann." Seit
   23.10.2026, 15:18: „es soll einfach den ganzen plan erledigen".

   Geprüft an zwei Blättern: dem Aufgaben-Blatt („…" an einer Aufgabe,
   kurz) und dem Profil (hoch):
    1. Am Handy (320 / 390 / 430) trägt jedes Blatt oben einen Griff: per
       Hit-Test ≥ 44 × 44 zu treffen (normal und kompakt), der Strich
       36 × 5 px mittig. Er überdeckt keinen Knopf im Blatt.
    2. Ein kurzes Ziehen (30 px) federt zurück, das Blatt bleibt offen.
    3. Weit nach unten gezogen geht es zu — über das Schliessen des
       Fensters (die Klasse .show ist weg).
    4. Schnell nach unten geschnippt (80 px) geht es ebenfalls zu.
    5. Das hohe Blatt rastet bei einem mittleren Zug auf halber Höhe ein
       (50 % ± 3 %), von dort nach oben wieder ganz, und öffnet beim
       nächsten Mal wieder ganz.
    6. Wo das Blatt nicht von unten kommt, gibt es keinen Griff: das
       Profil ab 621 px (Fenster in der Mitte), das Aufgaben-Blatt ab
       1100 px. Bei 820 px hat das Aufgaben-Blatt einen.
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
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((d) => { localStorage.setItem('kf_tour', '99:demo-ich'); localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'formi', stil2: true, dichte: d })); }, dichte || 'normal');
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  return { ctx, p };
}
async function aufgabenBlatt(p) {
  await p.evaluate(() => { const g = [...document.querySelectorAll('.mobnav [data-group="g-arbeit"], #side [data-group="g-arbeit"]')].find(x => x.getClientRects().length); if (g) g.click(); });
  await p.waitForTimeout(500);
  await p.evaluate(() => { const s = document.querySelector('[data-subview="todos"]'); if (s) s.click(); });
  await p.waitForTimeout(500);
  await p.evaluate(() => { const m = [...document.querySelectorAll('#view-todos .t-mehr')].find(x => x.getClientRects().length); m.click(); });
  await p.waitForTimeout(650);
  return 'todoSheet';
}
async function profil(p) {
  await p.evaluate(() => document.getElementById('ichProfilBtn').click());
  await p.waitForTimeout(800);
  return 'profileModal';
}
const GRIFF = (id) => {
  const w = document.getElementById(id), k = w.querySelector('.pm-box, .ms-card'), g = k && k.querySelector('.blatt-griff');
  if (!g || !g.getClientRects().length || getComputedStyle(g).display === 'none') return { da: false, offen: w.classList.contains('show') };
  const r = g.getBoundingClientRect(), kr = k.getBoundingClientRect(), st = getComputedStyle(g, '::before');
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return t === g; };
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let o = cy, u = cy, l = cx, re = cx;
  if (trifft(cx, cy)) {
    while (o > 0 && trifft(cx, o - 1)) o--;
    while (u < innerHeight && trifft(cx, u + 1)) u++;
    while (l > 0 && trifft(l - 1, cy)) l--;
    while (re < innerWidth && trifft(re + 1, cy)) re++;
  }
  /* Knöpfe im Blatt, die der Griff überdecken könnte. */
  const verdeckt = [...k.querySelectorAll('button, [role="button"], a[href], input, select, textarea')].filter(x => x.getClientRects().length).filter(x => {
    const q = x.getBoundingClientRect(); if (q.bottom < kr.top || q.top > kr.top + 60) return false;
    const t = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return t === g;
  }).map(x => x.id || x.className || x.tagName);
  return { da: true, offen: w.classList.contains('show'), w: Math.round(re - l + 1), h: Math.round(u - o + 1),
    strichB: parseFloat(st.width), strichH: parseFloat(st.height),
    strichMitte: Math.round(r.left + r.width / 2 - (kr.left + kr.width / 2)), griffOben: Math.round(r.top - kr.top),
    kartenH: Math.round(kr.height), kartenOben: Math.round(kr.top), rast: w.getAttribute('data-rast') || 'voll', verdeckt,
    gx: Math.round(cx), gy: Math.round(cy) };
};
async function ziehe(p, g, dy, schritte, pause) {
  await p.mouse.move(g.gx, g.gy);
  await p.mouse.down();
  for (let i = 1; i <= schritte; i++) { await p.mouse.move(g.gx, g.gy + dy * i / schritte); if (pause) await p.waitForTimeout(pause); }
  await p.mouse.up();
  await p.waitForTimeout(600);
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    for (const [w, h] of [[320, 640], [390, 844], [430, 932]]) {
      for (const dichte of ['normal', 'kompakt']) {
        console.log('\n── ' + w + ' × ' + h + ' ' + dichte + ' ──');
        const { ctx, p } = await oeffne(b, w, h, dichte);
        for (const oeffner of [aufgabenBlatt, profil]) {
          const id = await oeffner(p);
          const g = await p.evaluate(GRIFF, id);
          pruefe(w + ' ' + dichte + ' #' + id + ': Griff da, trifft ' + g.w + ' × ' + g.h + ', Strich ' + g.strichB + ' × ' + g.strichH + ' mittig (' + g.strichMitte + ' px), oben im Blatt (' + g.griffOben + ' px)',
            g.da && g.offen && g.w >= 44 && g.h >= 44 && g.strichB === 36 && g.strichH === 5 && Math.abs(g.strichMitte) <= 2 && Math.abs(g.griffOben) <= 1, JSON.stringify(g));
          pruefe(w + ' ' + dichte + ' #' + id + ': der Griff überdeckt keinen Knopf im Blatt', g.da && !g.verdeckt.length, JSON.stringify(g.verdeckt));
          if (dichte === 'kompakt') { await p.keyboard.press('Escape'); await p.waitForTimeout(400); continue; }
          /* 2. kurz ziehen: zurück */
          await ziehe(p, g, 30, 6, 30);
          const z = await p.evaluate(GRIFF, id);
          const tr = await p.evaluate((id) => getComputedStyle(document.getElementById(id).querySelector('.pm-box, .ms-card')).transform, id);
          pruefe(w + ' #' + id + ': 30 px gezogen → federt zurück, bleibt offen', z.offen && (tr === 'none' || /1, 0, 0, 1, 0, 0\)/.test(tr)) && z.rast === 'voll', JSON.stringify([z.offen, tr, z.rast]));
          /* 5. das hohe Blatt: halbe Höhe */
          const hoch = await p.evaluate((id) => { const k = document.getElementById(id).querySelector('.pm-box, .ms-card'); return k.scrollHeight > innerHeight * .62; }, id);
          if (hoch) {
            await ziehe(p, z, Math.round(z.kartenH * .3), 10, 25);
            const hb = await p.evaluate(GRIFF, id);
            pruefe(w + ' #' + id + ' (hoch): mittlerer Zug → rastet halb ein (' + hb.kartenH + ' px von ' + h + ')', hb.offen && hb.rast === 'halb' && Math.abs(hb.kartenH / h - .5) < .03, JSON.stringify(hb));
            await ziehe(p, hb, -160, 10, 25);
            const vb = await p.evaluate(GRIFF, id);
            pruefe(w + ' #' + id + ' (hoch): von halb nach oben → wieder ganz (' + vb.kartenH + ' px)', vb.offen && vb.rast === 'voll' && vb.kartenH > hb.kartenH + 40, JSON.stringify(vb));
            Object.assign(z, vb);
          } else console.log('  · #' + id + ': ' + (z.kartenH) + ' px hoch — kein halber Halt (unter 62 %)');
          /* 3. weit nach unten: zu */
          await ziehe(p, z, Math.round(z.kartenH * .7), 12, 25);
          const zu = await p.evaluate((id) => document.getElementById(id).classList.contains('show'), id);
          pruefe(w + ' #' + id + ': weit nach unten gezogen → zu', !zu);
          /* 4. geschnippt: zu; und öffnet wieder ganz */
          await (id === 'todoSheet' ? aufgabenBlatt(p) : profil(p));
          const neu = await p.evaluate(GRIFF, id);
          pruefe(w + ' #' + id + ': öffnet wieder ganz (Rast „' + neu.rast + '", ' + neu.kartenH + ' px)', neu.offen && neu.rast === 'voll' && Math.abs(neu.kartenH - g.kartenH) <= 2, JSON.stringify(neu));
          await ziehe(p, neu, 80, 2, 0);
          const zu2 = await p.evaluate((id) => document.getElementById(id).classList.contains('show'), id);
          pruefe(w + ' #' + id + ': schnell 80 px geschnippt → zu', !zu2);
          if (zu2) { await p.keyboard.press('Escape'); await p.waitForTimeout(400); }
        }
        if (p._fehler.length) pruefe(w + ' ' + dichte + ': keine Seitenfehler', false, p._fehler.join(' | '));
        await ctx.close();
      }
    }

    console.log('\n── Wo das Blatt nicht von unten kommt ──');
    for (const [w, h, todo, prof] of [[820, 1180, true, false], [1280, 800, false, false], [1440, 900, false, false], [1920, 1080, false, false]]) {
      const { ctx, p } = await oeffne(b, w, h);
      const id1 = await aufgabenBlatt(p);
      const g1 = await p.evaluate(GRIFF, id1);
      pruefe(w + ': Aufgaben-Blatt ' + (todo ? 'mit' : 'ohne') + ' Griff', g1.offen && g1.da === todo, JSON.stringify(g1));
      if (g1.da) pruefe(w + ': Griff trifft ' + g1.w + ' × ' + g1.h + ', überdeckt nichts', g1.w >= 44 && g1.h >= 44 && !g1.verdeckt.length, JSON.stringify(g1));
      await p.keyboard.press('Escape'); await p.waitForTimeout(400);
      const id2 = await profil(p);
      const g2 = await p.evaluate(GRIFF, id2);
      pruefe(w + ': Profil (Fenster in der Mitte) ohne Griff', g2.offen && g2.da === prof, JSON.stringify(g2));
      if (p._fehler.length) pruefe(w + ': keine Seitenfehler', false, p._fehler.join(' | '));
      await ctx.close();
    }
  } finally { await b.close(); }
  console.log('\n' + (schlecht ? '✗' : '✓') + ' Blätter: ' + gut + ' grün, ' + schlecht + ' falsch');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
