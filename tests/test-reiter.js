/* ══════════════════════════════════════════════════════════════════════
   REITER UND FILTER SEHEN VERSCHIEDEN AUS (Design-Ideen, Punkt 6)

   Aus dem Betrieb, 25.9.2026: „mach weiter mit design sachen". Punkt 6:
   „Im Aufgabenbereich ist ‚Aufgaben' (Navigation) eine gefüllte Pille —
   und ‚Alle' (Filter) auch. Zwei Bedeutungen, ein Aussehen."

   Geprüft wird bei 390 und 1440 px, in den Aufgaben und in der
   Verwaltung:
   1. Der Marker des offenen Reiters ist ein Strich (3 px), keine Fläche,
      und er sitzt an der Unterkante GENAU dieses Reiters.
   2. Der offene Reiter selbst hat keine Füllung und keinen Schatten.
   3. Der gewählte Filter („Alle") ist weiterhin eine gefüllte Pille.
   4. Die Schrift des offenen Reiters hat ≥ 4,5 : 1 gegen ihren Grund.
   5. Wechselt der Reiter, wandert der Strich mit.
   6. Jeder Reiter trifft ≥ 44 hoch (Hit-Test, normal und kompakt).
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
async function oeffne(b, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
async function zu(p, v) {
  await p.evaluate(() => { const a = document.querySelector('#side [data-group="g-alles"], .mobnav [data-group="g-alles"]'); if (a) a.click(); });
  await p.waitForTimeout(500);
  await p.evaluate((v) => {
    const k = document.querySelector('#allesLadeInhalt [data-alles="' + v + '"], #allesSeite [data-alles="' + v + '"]');
    if (k) k.click();
  }, v);
  await p.waitForTimeout(1200);
}
/* Lage des Markers aus seinen eigenen Angaben: --ind-x/-y/-w/-h und dem
   berechneten ::before. */
const lage = (p, leiste, reiter) => p.evaluate(({ leiste, reiter }) => {
  const bar = document.querySelector(leiste);
  const an = bar && bar.querySelector(reiter);
  if (!bar || !an) return null;
  const vor = getComputedStyle(bar, '::before');
  const st = bar.style;
  const y = parseFloat(st.getPropertyValue('--ind-y')), hh = parseFloat(st.getPropertyValue('--ind-h'));
  const x = parseFloat(st.getPropertyValue('--ind-x')), w = parseFloat(st.getPropertyValue('--ind-w'));
  const oben = parseFloat(vor.top), hoch = parseFloat(vor.height);
  const cs = getComputedStyle(an);
  /* Grund: der erste Vorfahr mit deckender Farbe. */
  let g = an, grund = 'rgb(255, 255, 255)';
  while (g) { const c = getComputedStyle(g).backgroundColor; if (c && !/rgba\(.*, 0\)|transparent/.test(c)) { grund = c; break; } g = g.parentElement; }
  const rgb = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);
  const lum = (c) => { const [r, gg, bb] = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * gg + .0722 * bb; };
  const L1 = lum(rgb(cs.color)), L2 = lum(rgb(grund));
  return {
    text: an.textContent.trim(),
    strichHoch: hoch, strichUnten: Math.round(y + oben + hoch), reiterUnten: an.offsetTop + an.offsetHeight,
    strichLinks: Math.round(x), reiterLinks: an.offsetLeft, strichBreit: Math.round(w), reiterBreit: an.offsetWidth,
    sichtbar: vor.opacity,
    fuellung: cs.backgroundColor, schatten: cs.boxShadow,
    kontrast: Math.round(((Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05)) * 100) / 100
  };
}, { leiste, reiter });
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

async function treffen(p, sel, wo) {
  for (const dichte of ['normal', 'kompakt']) {
    await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
    const k = await p.evaluate(async ({ SRC, sel }) => {
      const T = eval('(' + SRC + ')');
      const zu = [];
      const els = [...document.querySelectorAll(sel)].filter(e => e.offsetParent);
      for (const el of els) {
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const t = T(el);
        if (t.w < 44 || t.h < 44) zu.push(el.textContent.trim() + ' ' + t.w + '×' + t.h);
      }
      return { zahl: els.length, zu };
    }, { SRC: TREFFER.toString(), sel });
    pruefe(wo + ', ' + dichte + ': jeder Reiter trifft ≥ 44 × 44 (' + k.zahl + ' gemessen)', k.zahl > 1 && !k.zu.length, k.zu.join(', '));
  }
  await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    console.log('\n── ' + w + ' px ──');
    const p = await oeffne(b, w, h);
    await zu(p, 'todos');
    await p.waitForTimeout(600);
    let m = await lage(p, '#subnav', '.subtab.on');
    pruefe('Aufgaben: der Marker ist ein Strich (' + (m && m.strichHoch) + ' px)', !!m && m.strichHoch <= 4 && m.sichtbar === '1', JSON.stringify(m));
    pruefe('… an der Unterkante des offenen Reiters „' + (m && m.text) + '"',
      !!m && Math.abs(m.strichUnten - m.reiterUnten) <= 2 && Math.abs(m.strichLinks - m.reiterLinks) <= 1 && Math.abs(m.strichBreit - m.reiterBreit) <= 1, JSON.stringify(m));
    pruefe('der offene Reiter hat keine Füllung und keinen Schatten', !!m && /rgba\(0, 0, 0, 0\)|transparent/.test(m.fuellung) && m.schatten === 'none', m && (m.fuellung + ' / ' + m.schatten));
    pruefe('seine Schrift: ' + (m && m.kontrast) + ' : 1 (≥ 4,5)', !!m && m.kontrast >= 4.5);

    const filter = await p.evaluate(() => {
      const c = document.querySelector('[data-tfilter].on');
      const cs = c && getComputedStyle(c);
      return c && { text: c.textContent.trim(), fuellung: cs.backgroundColor, rund: parseFloat(cs.borderTopLeftRadius), hoch: c.offsetHeight };
    });
    pruefe('der gewählte Filter „' + (filter && filter.text) + '" bleibt eine gefüllte Pille',
      !!filter && !/rgba\(0, 0, 0, 0\)|transparent/.test(filter.fuellung) && filter.rund >= filter.hoch / 2 - 1, JSON.stringify(filter));

    /* Wechsel: der Strich wandert mit. */
    const vorher = m;
    await p.evaluate(() => { const t = document.querySelector('#subnav [data-subview="putzplan"]'); if (t) t.click(); });
    await p.waitForTimeout(900);
    m = await lage(p, '#subnav', '.subtab.on');
    pruefe('Reiter gewechselt („' + (m && m.text) + '"): der Strich steht darunter',
      !!m && !!vorher && m.text !== vorher.text && Math.abs(m.strichLinks - m.reiterLinks) <= 1 && Math.abs(m.strichUnten - m.reiterUnten) <= 2, JSON.stringify(m));

    await treffen(p, '#subnav .subtab', 'Aufgaben');

    /* Verwaltung */
    await zu(p, 'chef');
    await p.evaluate(() => { const t = document.querySelector('#chefTabs .chef-tab:not(.on)'); if (t) t.click(); });
    await p.waitForTimeout(900);
    m = await lage(p, '#chefTabs', '.chef-tab.on');
    pruefe('Verwaltung: auch dort ein Strich unter „' + (m && m.text) + '"',
      !!m && m.strichHoch <= 4 && Math.abs(m.strichUnten - m.reiterUnten) <= 2 && Math.abs(m.strichLinks - m.reiterLinks) <= 1, JSON.stringify(m));
    pruefe('… Schrift ' + (m && m.kontrast) + ' : 1 (≥ 4,5)', !!m && m.kontrast >= 4.5);
    await treffen(p, '#chefTabs .chef-tab', 'Verwaltung');
    const quer = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    pruefe('nichts ragt seitlich hinaus', quer <= 0, String(quer));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  await b.close();
  console.log(schlecht
    ? '\n✗ Reiter und Filter: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Reiter und Filter: Reiter mit Strich, Filter als Pille — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
