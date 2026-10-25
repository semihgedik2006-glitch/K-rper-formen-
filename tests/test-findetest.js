/* ══ FINDETEST: DIE STOPPUHR ZUM SELBSTTESTEN (Runde 275) ═════════════
   Aus dem Betrieb, 23.10.2026, auf „Erst mit echten Leuten messen":
   „ich kann leider nur selber testen aktuell". Die App stoppt selbst.

   Geprüft wird, als Mitarbeiter:
    1. „Alles → Findetest" öffnet das Fenster mit fünf Zielen; jedes „Los"
       trifft ≥ 44 × 44 (normal und kompakt).
    2. „Los" bei „Ein Gerät defekt melden": die Uhr steht da, auf „Heute",
       ihr „Aufgeben" trifft ≥ 44 × 44 und sie verdeckt weder „Alles",
       noch die untere Leiste, noch Formi oder „+ Aufgabe" – bei 320 /
       390 / 430 / 820 / 1280 / 1440 / 1920 px.
    3. Über „Alles → Geräte" (zwei Tipps) hält die Uhr von selbst an: das
       Fenster meldet „Geschafft … mit 2 Tipps", das Ergebnis bleibt nach
       dem Neuladen auf dem Gerät.
    4. „Aufgeben" hält an und merkt „aufgegeben"; „Ergebnisse kopieren"
       enthält beide Zeilen.
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
async function oeffne(b, w, h, ctxAlt) {
  const ctx = ctxAlt || await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  if (!ctxAlt) {
    await ctx.addInitScript(() => { try { localStorage.setItem('kf_tour', '1:testuid'); localStorage.setItem('kf_formi_gruss', new Date().toDateString()); } catch (e) {} });
    await ctx.addInitScript({ path: SP + '/stub-mitarbeiter.js' });
  }
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(900);
  p._ctx = ctx;
  return p;
}
const allesFindetest = async (p) => {
  await p.click('#bereichKopf'); await p.waitForTimeout(350);
  await p.evaluate(() => [...document.querySelectorAll('#allesLade [data-al-findetest]')].find(e => e.getClientRects().length).click());
  await p.waitForTimeout(300);
};
const los = async (p, id) => { await p.click('#findeModal [data-ft-los="' + id + '"]'); await p.waitForTimeout(400); };
/* Liegt die Uhr auf irgendeinem Bedienelement? Jeder sichtbare Knopf,
   Link oder Eintrag ausserhalb der Uhr zählt – eine feste Liste hatte in
   der ersten Fassung die Schnellzugriffe übersehen. */
const UEBER = () => {
  const uhr = document.getElementById('ftUhr'), u = uhr.getBoundingClientRect();
  return [...document.querySelectorAll('button, a, [role="button"], input, .formi-kugel')]
    .filter(e => !uhr.contains(e) && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden], .modal:not(.show)'))
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > u.left && r.left < u.right && r.bottom > u.top && r.top < u.bottom; })
    /* … und liegt die Uhr dort wirklich OBEN (Mitte der Schnittfläche)? */
    .filter(e => { const r = e.getBoundingClientRect(); const t = document.elementFromPoint((Math.max(r.left, u.left) + Math.min(r.right, u.right)) / 2, (Math.max(r.top, u.top) + Math.min(r.bottom, u.bottom)) / 2); return !!t && uhr.contains(t); })
    .map(e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0]) + ' „' + e.textContent.trim().slice(0, 20) + '"');
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1 Das Fenster ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h);
    await allesFindetest(p);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.waitForTimeout(200);
      const m = await p.evaluate((SRC) => {
        const T = eval('(' + SRC + ')');
        const k = [...document.querySelectorAll('#findeModal [data-ft-los]')];
        return { offen: document.getElementById('findeModal').classList.contains('show'), n: k.length,
          t: k.map(e => { e.scrollIntoView({ block: 'center' }); return T(e); }) };
      }, TREFFER.toString());
      pruefe(w + ' px ' + dichte + ': Fenster offen, fünf Ziele, jedes „Los" ≥ 44 × 44', m.offen && m.n === 5 && m.t.every(x => x.w >= 44 && x.h >= 44), JSON.stringify(m));
    }
    await p._ctx.close();
  }

  console.log('\n── 2 Die Uhr liegt frei ──');
  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h);
    await allesFindetest(p);
    await los(p, 'geraet');
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.waitForTimeout(200);
      const m = await p.evaluate((A) => {
        const T = eval('(' + A[0] + ')'), U = eval('(' + A[1] + ')');
        const uhr = document.getElementById('ftUhr');
        const r = uhr.getBoundingClientRect();
        return { da: !uhr.hidden && !!uhr.getClientRects().length, ansicht: (document.querySelector('.view.show') || {}).id,
          imBild: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight,
          auf: T(document.getElementById('ftAufgeben')), ueber: U(), text: uhr.textContent.trim() };
      }, [TREFFER.toString(), UEBER.toString()]);
      pruefe(w + ' px ' + dichte + ': Uhr auf „Heute", im Bild, „Aufgeben" ' + m.auf.w + ' × ' + m.auf.h, m.da && m.ansicht === 'view-home' && m.imBild && m.auf.w >= 44 && m.auf.h >= 44, JSON.stringify(m));
      pruefe(w + ' px ' + dichte + ': Uhr verdeckt nichts', !m.ueber.length, m.ueber.join(', '));
    }
    await p._ctx.close();
  }

  console.log('\n── 3 Die Uhr hält von selbst an ──');
  {
    const p = await oeffne(b, 390, 844);
    await allesFindetest(p);
    await los(p, 'geraet');
    await p.click('#bereichKopf'); await p.waitForTimeout(350);
    const g = await p.evaluate(() => { const e = [...document.querySelectorAll('#allesLade [data-alles="geraete"]')].find(x => x.getClientRects().length); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await p.mouse.click(g.x, g.y);
    await p.waitForTimeout(1200);
    const m = await p.evaluate(() => ({ ansicht: (document.querySelector('.view.show') || {}).id,
      uhr: document.getElementById('ftUhr').hidden, offen: document.getElementById('findeModal').classList.contains('show'),
      text: document.getElementById('ftErgebnis').textContent,
      gespeichert: (JSON.parse(localStorage.getItem('kf_prefs') || '{}').findetest || {}).geraet }));
    pruefe('Geräte offen, Uhr weg, Fenster meldet „Geschafft … mit 2 Tipps"', m.ansicht === 'view-geraete' && m.uhr && m.offen && /^Geschafft: .*Gerät defekt melden.* mit 2 Tipps\.$/.test(m.text), JSON.stringify(m));
    pruefe('Ergebnis auf dem Gerät: ok, 2 Tipps', !!m.gespeichert && m.gespeichert[0].ok === true && m.gespeichert[0].t === 2, JSON.stringify(m.gespeichert));
    const ctx = p._ctx;
    await p.close();
    const q = await oeffne(b, 390, 844, ctx);
    await allesFindetest(q);
    const zeile = await q.evaluate(() => [...document.querySelectorAll('#ftListe .ft-zeile')].find(z => z.querySelector('[data-ft-los="geraet"]')).textContent);
    pruefe('nach dem Neuladen steht die Zeit an der Zeile', /Zuletzt \d+ s, 2 Tipps/.test(zeile), zeile);

    console.log('\n── 4 Aufgeben und Kopieren ──');
    await los(q, 'doku');
    await q.click('#ftAufgeben'); await q.waitForTimeout(400);
    const a = await q.evaluate(() => ({ uhr: document.getElementById('ftUhr').hidden, text: document.getElementById('ftErgebnis').textContent,
      g: (JSON.parse(localStorage.getItem('kf_prefs') || '{}').findetest || {}).doku }));
    pruefe('„Aufgeben" hält an und merkt „aufgegeben"', a.uhr && /^Aufgegeben: /.test(a.text) && a.g && a.g[0].ok === false, JSON.stringify(a));
    /* Die Zwischenablage abfangen: was die App hineinschreibt, steht in __kopiert. */
    await q.evaluate(() => { navigator.clipboard.writeText = (x) => { window.__kopiert = x; return Promise.resolve(); }; });
    await q.click('#ftKopieren'); await q.waitForTimeout(300);
    const t = await q.evaluate(() => window.__kopiert || '');
    pruefe('„Ergebnisse kopieren" enthält beide', /Ein Gerät defekt melden: \d+ s\/2 Tipps/.test(t) && /Ein Dokument finden: aufgegeben/.test(t), t);
    pruefe('ohne Skriptfehler', !p._fehler.length && !q._fehler.length, p._fehler.concat(q._fehler).join(' | '));
    await ctx.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Findetest: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Findetest: Uhr startet auf „Heute", hält am Ziel an, merkt sich die Zeit — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
