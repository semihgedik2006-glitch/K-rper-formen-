/* ══ HANDY-STARTSEITE: FORMI IN DER SCHNELLZUGRIFF-REIHE (Runde 218) ══
   Aus dem Betrieb, 23.10.2026, auf „schmaler Kopf und Formi in der
   Schnellzugriff-Reihe statt eigenem Streifen?": „a mach weiter und
   merge".

   Geprüft wird am Handy auf „Heute":
    1. Formi sitzt rechts neben der Schnellzugriff-Reihe, liegt auf keinem
       ihrer Knöpfe, und es gibt keinen leeren Streifen mehr über der Leiste
       (die Startseite reicht bis an die Reihe).
    2. Jeder Knopf der Reihe und die Kugel treffen ≥ 44 × 44 (Hit-Test), in
       „normal" und „kompakt", bei 390 / 430 px und im Querformat 820.
    3. Mehr vom Tag: bei 390 px stehen mindestens drei Blöcke im Bild (vorher
       zwei), bei 430 px auch der Putzplan (Mitarbeiter).
    4. Der Kopf ist im Raum „Heute" schmal (kein Datum).
    5. GEGENPROBEN: Auf einer anderen Seite (Aufgaben) bleibt der Streifen
       und die Kugel unten rechts; bei 320 × 568 (keine Reihe) bleibt der
       Streifen, damit die Kugel nicht auf „Ausserdem" liegt; am Rechner
       ändert sich nichts.
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
async function oeffne(b, w, h, rolle) {
  const handy = w <= 820;
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    handy ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  /* Kein Tagesgruss: die Blase stünde sonst kurz über der Reihe. */
  await p.addInitScript(() => { try { localStorage.setItem('kf_tour', '1:testuid'); localStorage.setItem('kf_formi_gruss', new Date().toDateString()); } catch (e) {} });
  await p.addInitScript({ path: SP + '/stub-' + (rolle || 'chef') + '.js' });
  await p.goto(APP + '?neu=1', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(1400);
  p._ctx = ctx;
  return p;
}
const zu = (p) => p._ctx.close();
const LAGE = (SRC) => {
  const T = eval('(' + SRC + ')');
  const k = document.getElementById('formiKugel'), kr = k.getBoundingClientRect();
  const reihe = document.getElementById('schnellLeiste');
  const knoepfe = [...reihe.querySelectorAll('.sz-knopf')].filter(e => e.getClientRects().length);
  const sa = document.querySelector('.view.show .scroll-area').getBoundingClientRect();
  const leiste = [...document.querySelectorAll('.mobnav, #mobnav')].find(e => e.getClientRects().length);
  const lr = leiste ? leiste.getBoundingClientRect() : { top: innerHeight };
  const rr = reihe.getClientRects().length ? reihe.getBoundingClientRect() : null;
  return {
    klasse: document.body.classList.contains('kugel-in-reihe'),
    reihe: !!rr,
    nebenReihe: !!rr && kr.left >= Math.max(...knoepfe.map(e => e.getBoundingClientRect().right)) - 1 && kr.top < rr.bottom && kr.bottom > rr.top,
    aufKnopf: knoepfe.filter(e => { const q = e.getBoundingClientRect(); return !(q.bottom <= kr.top || q.top >= kr.bottom || q.right <= kr.left || q.left >= kr.right); }).map(e => e.title),
    rechtsUnten: kr.right > innerWidth - 40,
    luecke: Math.round(lr.top - (rr ? rr.bottom : sa.bottom)),
    knoepfe: knoepfe.map(e => ({ n: e.title, t: T(e) })),
    kugel: T(k),
    datum: (() => { const i = document.getElementById('bkSub'); return !!i && !!i.getClientRects().length && getComputedStyle(i).display !== 'none'; })(),
    bloecke: [...document.querySelectorAll('#heuteListe .heute-block')].map(x => ((x.querySelector('.hk-wort') || {}).textContent || '').trim().split(' ')[0])
  };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1–4 Handy, „Heute" ──');
  for (const [w, h, rolle] of [[390, 844, 'chef'], [430, 932, 'mitarbeiter'], [390, 844, 'mitarbeiter']]) {
    const p = await oeffne(b, w, h, rolle);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.waitForTimeout(250);
      const m = await p.evaluate(LAGE, TREFFER.toString());
      const wo = w + ' px ' + rolle + ' ' + dichte;
      pruefe(wo + ': Formi sitzt rechts neben der Reihe, auf keinem Knopf', m.klasse && m.reihe && m.nebenReihe && !m.aufKnopf.length, JSON.stringify({ k: m.klasse, n: m.nebenReihe, a: m.aufKnopf }));
      pruefe(wo + ': kein leerer Streifen über der Leiste (' + m.luecke + ' px)', m.luecke <= 12, String(m.luecke));
      const klein = m.knoepfe.filter(x => x.t.w < 44 || x.t.h < 44).map(x => x.n + ' ' + x.t.w + '×' + x.t.h);
      pruefe(wo + ': jeder Knopf der Reihe ≥ 44 × 44', !klein.length, klein.join(', '));
      pruefe(wo + ': Formi trifft ' + m.kugel.w + '×' + m.kugel.h, m.kugel.w >= 44 && m.kugel.h >= 44);
      if (dichte === 'normal') {
        pruefe(wo + ': der Kopf ist schmal (kein Datum)', !m.datum);
        if (w === 390 && rolle === 'chef') pruefe(wo + ': mindestens drei Blöcke (vorher zwei): ' + m.bloecke.join(', '), m.bloecke.length >= 3, m.bloecke.join('|'));
        if (w === 430) pruefe(wo + ': der Putzplan steht auf der Startseite', m.bloecke.indexOf('Putzplan') >= 0, m.bloecke.join('|'));
      }
    }
    pruefe(w + ' px ' + rolle + ': ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }
  {
    const p = await oeffne(b, 820, 1180, 'chef');
    const m = await p.evaluate(LAGE, TREFFER.toString());
    pruefe('820 px: Formi neben der Reihe, Knöpfe ≥ 44 × 44', m.klasse && m.nebenReihe && !m.aufKnopf.length && m.knoepfe.every(x => x.t.w >= 44 && x.t.h >= 44), JSON.stringify(m.knoepfe));
    await zu(p);
  }

  console.log('\n── 5 Gegenproben ──');
  {
    const p = await oeffne(b, 390, 844, 'chef');
    await p.evaluate(() => [...document.querySelectorAll('.mn-reihe [data-group="g-arbeit"], .mobnav [data-group="g-arbeit"]')].find(e => e.getClientRects().length).click());
    await p.waitForTimeout(700);
    const m = await p.evaluate(() => ({ klasse: document.body.classList.contains('kugel-in-reihe'), pb: getComputedStyle(document.querySelector('.main')).paddingBottom }));
    pruefe('GEGENPROBE Aufgaben: der Streifen bleibt (' + m.pb + ')', !m.klasse && parseFloat(m.pb) > 100, JSON.stringify(m));
    await zu(p);
  }
  {
    const p = await oeffne(b, 320, 568, 'mitarbeiter');
    const m = await p.evaluate(() => ({ klasse: document.body.classList.contains('kugel-in-reihe'), pb: getComputedStyle(document.querySelector('.main')).paddingBottom,
      reihe: !!document.getElementById('schnellLeiste').getClientRects().length }));
    pruefe('GEGENPROBE 320 × 568 (keine Reihe): der Streifen bleibt', !m.reihe && !m.klasse && parseFloat(m.pb) > 100, JSON.stringify(m));
    await zu(p);
  }
  {
    const p = await oeffne(b, 1440, 900, 'chef');
    const m = await p.evaluate(() => ({ klasse: document.body.classList.contains('kugel-in-reihe'), datum: !!document.getElementById('bkSub').getClientRects().length }));
    pruefe('GEGENPROBE Rechner: keine Änderung (Klasse aus)', !m.klasse, JSON.stringify(m));
    await zu(p);
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Formi in der Reihe: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Formi in der Reihe: kein Streifen, mehr vom Tag, alles treffbar — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
