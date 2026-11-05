/* ══ KRANK: VERTRETUNGS-VORSCHLAG UNTER „ZU BESTÄTIGEN" (Runde 299) ════
   Aus dem Betrieb, 5.11.2026: bei Krankmeldung „er soll nur vorschläge
   machen für die leitung". Den Vorschlag rechnet der Server (formiKrank,
   geprüft in tests/rules/funktionen.test.js) und legt ihn an die
   Abwesenheit. Hier die Seite der Leitung:

    1. Je betroffener Schicht eine Zeile „Krank – Vertretung" mit den
       vorgeschlagenen Namen — nur, solange die Schicht noch bei der
       kranken Person liegt und nicht ausgeschrieben ist.
    2. ✓ schreibt die Schicht aus (tausch 'offen', tauschVon = krank) —
       dieselben Felder wie „Schicht abgeben"; die Zeile ist weg.
    3. ✕ „Selbst geregelt" vermerkt nur die Schicht an der Abwesenheit.
    4. Niemand wird von der App aus gefragt: kein Schreibzugriff auf
       Nachrichten, Push oder andere Personen.
    5. Gegenproben: vergangene, schon ausgeschriebene oder umbesetzte
       Schichten erscheinen nicht; Mitarbeiter sehen nichts davon.
    6. Jeder Knopf der Zeile trifft ≥ 44 × 44 (390 / 820 / 1280 / 1440 /
       1920, normal und kompakt), und die Seite passt am Rechner weiter
       auf einen Bildschirm.
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
/* Ben ist morgen und übermorgen krank. k1 (morgen) liegt noch bei ihm,
   k2 (übermorgen) ist schon ausgeschrieben, k3 (gestern) ist vorbei,
   k4 (morgen) hat schon jemand anderes. Nur k1 gehört in die Liste. */
const DATEN = `(function(){
  function tag(n){ var d=new Date(); d.setDate(d.getDate()+(n||0)); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  window.__shifts = { 'studio-6': [
    { id:'k1', date:tag(1), from:'09:00', to:'14:00', uid:'u3', name:'Ben Kraus' },
    { id:'k2', date:tag(2), from:'09:00', to:'14:00', uid:'u3', name:'Ben Kraus', tausch:'offen', tauschVon:'u3', tauschTs:Date.now() },
    { id:'k3', date:tag(-1), from:'09:00', to:'14:00', uid:'u3', name:'Ben Kraus' },
    { id:'k4', date:tag(1), from:'15:00', to:'20:00', uid:'u2', name:'Anna Meier' }
  ], 'studio-7': [] };
  window.__absences = { 'studio-6': [
    { id:'kr1', from:tag(-1), to:tag(2), type:'krank', uid:'u3', name:'Ben Kraus', status:'genehmigt', ts:Date.now()-3600000,
      vertretung:{ ts:Date.now()-3500000, schichten:[
        { id:'k1', date:tag(1), from:'09:00', to:'14:00', kandidaten:[{ uid:'u2', name:'Anna Meier', frei:false }, { uid:'u4', name:'Cem Yilmaz', frei:true }] },
        { id:'k2', date:tag(2), from:'09:00', to:'14:00', kandidaten:[] },
        { id:'k3', date:tag(-1), from:'09:00', to:'14:00', kandidaten:[] },
        { id:'k4', date:tag(1), from:'15:00', to:'20:00', kandidaten:[] } ] } }
  ] };
})();`;
async function oeffne(b, w, h, rolle) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript(() => { try { localStorage.setItem('kf_tour', '1:testuid'); localStorage.setItem('kf_formi_gruss', new Date().toDateString()); } catch (e) {} });
  await p.addInitScript(DATEN);
  await p.addInitScript({ path: SP + '/stub-' + rolle + '.js' });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(2200);
  p._ctx = ctx;
  return p;
}
const ZEILEN = () => [...document.querySelectorAll('.ls-best-zeile')]
  .filter(z => /Krank/.test((z.querySelector('.ls-art') || {}).textContent || ''))
  .map(z => ({ titel: z.querySelector('b').textContent, zeile: z.querySelector('.ls-best-txt span').textContent,
    id: (z.querySelector('[data-lsja]') || {}).getAttribute ? z.querySelector('[data-lsja]').getAttribute('data-lsja') : '',
    sicht: !!z.getClientRects().length }));

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1 Die Zeile ──');
  {
    const p = await oeffne(b, 1440, 900, 'leiter');
    await p.evaluate(async () => { const a = document.querySelector('[data-lsalle]'); if (a) { a.click(); await new Promise(x => setTimeout(x, 300)); } });
    const z = await p.evaluate(ZEILEN);
    const ganz = await p.evaluate(() => { const b = document.querySelector('[data-lsja*="kr:"]'); const t = b && b.closest('.ls-best-zeile').querySelector('b'); return !!t && t.scrollWidth <= t.clientWidth + 1; });
    pruefe('1440 px: der Titel ist ganz zu lesen (nicht abgeschnitten)', ganz);
    pruefe('genau eine Zeile „Krank – Vertretung" (k1) — nicht vorbei, nicht ausgeschrieben, nicht umbesetzt', z.length === 1 && /:k1$/.test(z[0].id), JSON.stringify(z));
    pruefe('Titel: „Ben · <Tag> 09:00–14:00" (die Marke sagt „Krank – Vertretung"), darunter „Vorschlag: Anna, Cem"', z[0] && /^Ben · .+ 09:00–14:00$/.test(z[0].titel) && z[0].zeile.indexOf('Vorschlag: Anna, Cem') === 0, JSON.stringify(z[0]));
    const labels = await p.evaluate(() => { const z = document.querySelector('[data-lsja*="kr:"]'); const n = document.querySelector('[data-lsnein*="kr:"]');
      return { ja: z && z.getAttribute('aria-label'), nein: n && n.getAttribute('aria-label') }; });
    pruefe('Knöpfe sagen, was sie tun: „Schicht ausschreiben" / „Selbst geregelt"', /^Schicht ausschreiben: Ben · /.test(labels.ja || '') && /^Selbst geregelt: Ben · /.test(labels.nein || ''), JSON.stringify(labels));

    console.log('\n── 2 ✓ schreibt aus ──');
    const r = await p.evaluate(async () => {
      window.__schreib = [];
      const k = document.querySelector('[data-lsja*="kr:"]'); const id = k.getAttribute('data-lsja');
      k.click(); await new Promise(x => setTimeout(x, 600));
      return { id, weg: !document.querySelector('[data-lsja="' + id + '"]'), schreib: (window.__schreib || []).map(x => ({ pfad: x.pfad, daten: x.daten })) };
    });
    const sh = r.schreib.find(x => /studios\/studio-6\/shifts\/k1$/.test(x.pfad));
    pruefe('✓: Schicht k1 bekommt tausch „offen", tauschVon = Ben (u3) — wie „Schicht abgeben"', sh && sh.daten.tausch === 'offen' && sh.daten.tauschVon === 'u3' && typeof sh.daten.tauschTs === 'number' && !sh.daten.uid, JSON.stringify(r.schreib));
    pruefe('✓: die Zeile ist weg', r.weg, JSON.stringify(r));
    pruefe('niemand wird gefragt: nur dieser eine Schreibzugriff (keine Nachricht, keine andere Person)', r.schreib.length === 1, JSON.stringify(r.schreib.map(x => x.pfad)));
    pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── 3 ✕ selbst geregelt ──');
  {
    const p = await oeffne(b, 1440, 900, 'chef');
    await p.evaluate(async () => { const a = document.querySelector('[data-lsalle]'); if (a) { a.click(); await new Promise(x => setTimeout(x, 300)); } });
    const r = await p.evaluate(async () => {
      window.__schreib = [];
      const k = document.querySelector('[data-lsnein*="kr:"]'); if (!k) return null;
      const id = k.getAttribute('data-lsnein');
      k.click(); await new Promise(x => setTimeout(x, 600));
      return { id, weg: !document.querySelector('[data-lsnein="' + id + '"]'), schreib: (window.__schreib || []).map(x => ({ pfad: x.pfad, daten: x.daten })) };
    });
    const ab = r && r.schreib.find(x => /absences\/kr1$/.test(x.pfad));
    pruefe('Chef ✕: an der Abwesenheit vermerkt (vertretungErledigt), die Schicht bleibt unberührt, Zeile weg',
      !!ab && 'vertretungErledigt' in (ab.daten || {}) && !r.schreib.some(x => /shifts\//.test(x.pfad)) && r.weg, JSON.stringify(r));
    pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── 5 Gegenprobe: Mitarbeiter ──');
  {
    const p = await oeffne(b, 1440, 900, 'mitarbeiter');
    const z = await p.evaluate(ZEILEN);
    pruefe('Mitarbeiter sehen keinen Vertretungs-Vorschlag', z.length === 0, JSON.stringify(z));
    await p._ctx.close();
  }

  console.log('\n── 6 Treffer ≥ 44 × 44, passt am Rechner ──');
  for (const [w, h] of [[390, 844], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h, 'leiter');
    await p.evaluate(async () => { const a = document.querySelector('[data-lsalle]'); if (a) { a.click(); await new Promise(x => setTimeout(x, 300)); } });
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.waitForTimeout(200);
      const m = await p.evaluate((SRC) => {
        const T = eval('(' + SRC + ')');
        return [...document.querySelectorAll('[data-lsja*="kr:"], [data-lsnein*="kr:"]')].filter(e => e.getClientRects().length)
          .map(e => { e.scrollIntoView({ block: 'center' }); const t = T(e); return { k: e.className, w: t.w, h: t.h }; });
      }, TREFFER.toString());
      pruefe(w + ' px ' + dichte + ': beide Knöpfe der Zeile treffen ≥ 44 × 44', m.length === 2 && m.every(x => x.w >= 44 && x.h >= 44), JSON.stringify(m));
    }
    if (w >= 1280) {
      await p._ctx.close();
      /* Ohne „alle zeigen": die Startseite, wie sie aufgeht. */
      const q = await oeffne(b, w, h, 'leiter');
      const s = await q.evaluate(() => { const sa = document.getElementById('heuteListe').closest('.scroll-area'); return { hoch: sa.scrollHeight, sicht: sa.clientHeight }; });
      pruefe(w + ' × ' + h + ': die Startseite der Leitung passt weiter auf einen Bildschirm (' + s.hoch + ' / ' + s.sicht + ')', s.hoch <= s.sicht + 2, JSON.stringify(s));
      await q._ctx.close();
    } else {
      const quer = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
      pruefe(w + ' px: nichts lässt sich seitwärts schieben', quer);
      await p._ctx.close();
    }
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Vertretung: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Vertretung: Vorschlag sichtbar, ausschreiben, selbst regeln, niemand gefragt — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
