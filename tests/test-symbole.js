/* ══ LINIEN-SYMBOLE MIT EINER STRICHSTÄRKE (Runde 258) ════════════════
   Plan „Studio Chat wie von Apple", Schritt 12: Symbole im Stil von SF
   Symbols — eine Strichstärke in der ganzen App, runde Enden, keine
   Schriftzeichen als Symbol. Seit 23.10.2026, 15:18: „es soll einfach
   den ganzen plan erledigen".

   Vorher gemessen (23.10.2026, 390 und 1440 px, alle Ansichten):
   gezeichnet 1,04 bis 2,19 px, 644 Striche mit eckigem Ende. Geprüft
   wird jetzt in JEDER Ansicht bei 390 und 1440 px (Formi) und 390 px
   (Hell):
    1. Jeder sichtbare Strich in einem Symbol (Knöpfe, Leisten, .sym) ist
       1,7 px stark — gleich, wie gross das Symbol steht — mit runden
       Enden. Punkte (… im Raster mit stroke-width 3) 1,75-fach.
    2. Ausnahmen bleiben, was sie sind: der Haken im Abhak-Kreis
       (kräftiger), das Logo.
    3. Kein Knopf trägt mehr ⋯, ≡ oder ＋ aus der Schrift als Symbol.
    4. Die neuen Symbole sind zu sehen (Fläche > 0) und ihre Knöpfe
       weiter ≥ 44 × 44 (Hit-Test) — ⋯ an Aufgaben, ＋ im Wochenplan.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(name, ok, info) {
  if (ok) { gut++; console.log('  ✓ ' + name); }
  else { schlecht++; console.log('  ✗ ' + name + (info ? '  — ' + info : '')); }
}
async function oeffne(b, w, h, theme, dichte) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' }, w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(([t, d]) => { localStorage.setItem('kf_tour', '99:demo-ich'); localStorage.setItem('kf_prefs', JSON.stringify({ theme: t, stil2: true, dichte: d })); }, [theme, dichte || 'normal']);
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  return { ctx, p };
}
const zeige = (p, id) => p.evaluate((id) => { history.replaceState({ v: id }, ''); window.dispatchEvent(new PopStateEvent('popstate', { state: { v: id } })); }, id);
const MISS = () => {
  const SEL = 'button svg, [role=button] svg, a svg, summary svg, .opt svg, .mobnav svg, .side svg, svg.sym';
  const formen = 'path,line,polyline,polygon,circle,rect,ellipse';
  const out = { ok: 0, falsch: [], haken: [], logo: 0, zeichen: [] };
  document.querySelectorAll(SEL).forEach(svg => {
    if (!svg.getClientRects().length || svg.closest('[hidden], .formi-kugel, #formiKugel')) return;
    const r = svg.getBoundingClientRect(); if (r.width < 6) return;
    const istHaken = !!svg.closest('.check'), istLogo = !!svg.closest('.tb-logo');
    svg.querySelectorAll(formen).forEach(f => {
      const cs = getComputedStyle(f);
      if (cs.stroke === 'none' || parseFloat(cs.strokeWidth) === 0) return;
      const sw = parseFloat(cs.strokeWidth), ve = cs.vectorEffect, cap = cs.strokeLinecap;
      if (istLogo) { out.logo++; return; }
      if (istHaken) { out.haken.push(ve + ' ' + sw); return; }
      const punkt = f.getAttribute('stroke-width') === '3' || f.getAttribute('stroke-width') === '2.6';
      const soll = punkt ? 1.7 * 1.75 : 1.7;
      if (ve === 'non-scaling-stroke' && Math.abs(sw - soll) < .01 && cap === 'round') out.ok++;
      else out.falsch.push(((svg.parentElement.id || svg.parentElement.className || svg.parentElement.tagName) + '').split(' ')[0] + ' ' + f.tagName + ' ' + sw + ' ' + ve + ' ' + cap);
    });
  });
  const re = /[⋯≡＋]/;
  document.querySelectorAll('button, [role=button]').forEach(k => {
    if (!k.getClientRects().length || k.closest('[hidden]')) return;
    const t = [...k.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('');
    if (re.test(t)) out.zeichen.push((k.id || k.className.split(' ')[0]) + ' „' + t.trim().slice(0, 16) + '"');
  });
  return out;
};
const TREFFER = (sel) => [...document.querySelectorAll(sel)].filter(el => el.getClientRects().length).slice(0, 3).map(el => {
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  let o = cy, u = cy, l = cx, re = cx;
  if (trifft(cx, cy)) { while (o > 0 && trifft(cx, o - 1)) o--; while (u < innerHeight && trifft(cx, u + 1)) u++; while (l > 0 && trifft(l - 1, cy)) l--; while (re < innerWidth && trifft(re + 1, cy)) re++; }
  const s = el.querySelector('svg'), sr = s ? s.getBoundingClientRect() : { width: 0, height: 0 };
  return { w: trifft(cx, cy) ? Math.round(re - l + 1) : 0, h: trifft(cx, cy) ? Math.round(u - o + 1) : 0, sym: Math.round(sr.width) + '×' + Math.round(sr.height) };
});

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    for (const [w, h, theme] of [[390, 844, 'formi'], [1440, 900, 'formi'], [390, 844, 'light'], [1280, 800, 'dark'], [320, 640, 'formi'], [820, 1180, 'formi'], [1920, 1080, 'formi']]) {
      console.log('\n── ' + w + ' × ' + h + ' ' + theme + ' ──');
      const { ctx, p } = await oeffne(b, w, h, theme);
      const ids = await p.evaluate(() => [...document.querySelectorAll('section.view[id^="view-"]')].map(s => s.id.replace('view-', '')));
      let ok = 0, ansichten = 0; const falsch = new Set(), zeichen = new Set(), haken = new Set(); let logo = 0;
      for (const id of ids) {
        await zeige(p, id); await p.waitForTimeout(250);
        const akt = await p.evaluate(() => ((document.querySelector('.view.show') || {}).id || '').replace('view-', ''));
        if (akt !== id) continue;
        ansichten++;
        const m = await p.evaluate(MISS);
        ok += m.ok; logo += m.logo; m.falsch.forEach(x => falsch.add(id + ': ' + x)); m.zeichen.forEach(x => zeichen.add(id + ': ' + x)); m.haken.forEach(x => haken.add(x));
      }
      pruefe(w + ' ' + theme + ': ' + ok + ' Striche in ' + ansichten + ' Ansichten, alle 1,7 px (Punkte 1,75-fach) mit runden Enden', ok > 200 && !falsch.size, [...falsch].slice(0, 6).join(' | '));
      pruefe(w + ' ' + theme + ': Haken im Abhak-Kreis bleibt kräftig (' + [...haken].join(', ') + '), Logo unberührt (' + logo + ')', [...haken].every(x => !/non-scaling/.test(x)), [...haken].join(','));
      pruefe(w + ' ' + theme + ': kein Knopf mit ⋯, ≡ oder ＋ aus der Schrift', !zeichen.size, [...zeichen].slice(0, 6).join(' | '));
      if (p._fehler.length) pruefe(w + ' ' + theme + ': keine Seitenfehler', false, p._fehler.join(' | '));
      await ctx.close();
    }

    console.log('\n── Neue Symbole: zu sehen, Knöpfe ≥ 44 × 44 ──');
    for (const dichte of ['normal', 'kompakt']) {
      for (const [w, h] of [[320, 640], [390, 844], [1440, 900]]) {
        const { ctx, p } = await oeffne(b, w, h, 'formi', dichte);
        await zeige(p, 'todos'); await p.waitForTimeout(500);
        const t = await p.evaluate(TREFFER, '#todoArea .t-mehr');
        pruefe(dichte + ' ' + w + ': ⋯ an Aufgaben ' + t.map(x => x.w + '×' + x.h + ' (Symbol ' + x.sym + ')').join(', '), t.length && t.every(x => x.w >= 44 && x.h >= 44 && !x.sym.startsWith('0')), JSON.stringify(t));
        await zeige(p, 'team'); await p.waitForTimeout(700);
        const pl = await p.evaluate(TREFFER, '.wp-tag-plus, .wp-leer');
        if (pl.length) pruefe(dichte + ' ' + w + ': ＋ im Wochenplan ' + pl.map(x => x.w + '×' + x.h + ' (Symbol ' + x.sym + ')').join(', '), pl.every(x => x.w >= 44 && x.h >= 44 && !x.sym.startsWith('0')), JSON.stringify(pl));
        else console.log('  · ' + w + ': kein ＋ im Wochenplan sichtbar');
        if (p._fehler.length) pruefe(dichte + ' ' + w + ': keine Seitenfehler', false, p._fehler.join(' | '));
        await ctx.close();
      }
    }
  } finally { await b.close(); }
  console.log('\n' + (schlecht ? '✗' : '✓') + ' Symbole: ' + gut + ' grün, ' + schlecht + ' falsch');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
