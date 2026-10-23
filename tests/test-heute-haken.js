/* ══ „HEUTE" ZUM ABARBEITEN; VIER RÄUME FÜR MITARBEITER (Runde 237) ══
   Aus dem Betrieb, 23.10.2026, auf die Rückfragen „Mitarbeiter unten nur
   Heute, Zeiten, Plan, Nachrichten?": „ja"; „eine Liste oder Blöcke nach
   Art?": „so wies leichter zu verstehen ist" (→ Blöcke bleiben).
   Dazu, vom 24.9.: „der am meisten benutzte Bereich [ist] der Aufgaben-
   und Putzplan-Bereich" – deshalb hakt man jetzt direkt auf „Heute" ab.

   Geprüft wird:
    1. Mitarbeiter: unten (390) und links (1440) genau Heute, Zeiten,
       Plan, Nachrichten. GEGENPROBE Chef: weiter alle sechs Räume.
    2. Studio und Wissen bleiben erreichbar: über „Alles" in zwei Tipps.
    3. Jede Aufgaben-Zeile auf „Heute" trägt links einen Haken, der
       ≥ 44 × 44 trifft (320 / 390 / 1440, normal und kompakt).
    4. Ein Tipp auf den Haken schreibt done:true für genau diese Aufgabe,
       zeigt „Rückgängig"; Rückgängig schreibt done:false.
    5. GEGENPROBE: ein Tipp auf den Rest der Zeile öffnet weiter die
       Aufgaben und hakt NICHT ab.
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
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript(() => { try { localStorage.setItem('kf_tour', '1:testuid'); localStorage.setItem('kf_formi_gruss', new Date().toDateString()); } catch (e) {} });
  await p.addInitScript({ path: SP + '/stub-' + rolle + '.js' });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(1200);
  p._ctx = ctx;
  return p;
}
const raeume = (p) => p.evaluate(() => [...document.querySelectorAll('#side > [data-group], .mn-reihe [data-group]')]
  .filter(e => e.getClientRects().length).map(e => e.getAttribute('data-group')));

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1–2 Räume ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h, 'mitarbeiter');
    const r = await raeume(p);
    pruefe(w + ' px Mitarbeiter: Heute, Zeiten, Plan, Nachrichten', r.join('|') === 'g-start|g-zeit|g-team|g-komm', r.join('|'));
    /* Studio und Wissen über „Alles": Griff, dann Eintrag. */
    for (const [ziel, ansicht] of [['todos', 'view-todos'], ['putzplan', 'view-putzplan'], ['schulung', 'view-schulung']]) {
      const z = await p.evaluate(async (ziel) => {
        document.getElementById('bereichKopf').click(); await new Promise(r => setTimeout(r, 350));
        const e = [...document.querySelectorAll('#allesLade [data-alles="' + ziel + '"]')].find(x => x.getClientRects().length);
        if (!e) return 'nicht in Alles';
        e.click(); await new Promise(r => setTimeout(r, 500));
        return (document.querySelector('.view.show') || {}).id;
      }, ziel);
      pruefe(w + ' px Mitarbeiter: ' + ziel + ' in zwei Tipps über „Alles"', z === ansicht, z);
    }
    pruefe(w + ' px Mitarbeiter: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h, 'chef');
    const r = await raeume(p);
    pruefe('GEGENPROBE ' + w + ' px Chef: alle sechs Räume', r.slice(0, 6).join('|') === 'g-start|g-arbeit|g-zeit|g-team|g-komm|g-wissen', r.join('|'));
    await p._ctx.close();
  }

  console.log('\n── 3 Haken treffbar ──');
  for (const [w, h] of [[320, 640], [390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h, 'mitarbeiter');
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.waitForTimeout(200);
      const m = await p.evaluate((SRC) => {
        const T = eval('(' + SRC + ')');
        const hk = [...document.querySelectorAll('#heuteListe .hz-haken')].filter(e => e.getClientRects().length);
        const aufg = [...document.querySelectorAll('#heuteListe .heute-zeile[data-heute="todos"]')].filter(e => e.getClientRects().length);
        return { n: hk.length, aufg: aufg.length, t: hk.map(e => { e.scrollIntoView({ block: 'center' }); return T(e); }) };
      }, TREFFER.toString());
      const klein = m.t.filter(x => x.w < 44 || x.h < 44);
      pruefe(w + ' px ' + dichte + ': jede sichtbare Aufgaben-Zeile hat einen Haken (' + m.n + ' von ' + m.aufg + ')', m.n >= m.aufg && m.aufg > 0, JSON.stringify(m));
      pruefe(w + ' px ' + dichte + ': jeder Haken trifft ≥ 44 × 44', !klein.length && m.t.length > 0, JSON.stringify(m.t));
    }
    await p._ctx.close();
  }

  console.log('\n── 4 Abhaken und Rückgängig ──');
  {
    const p = await oeffne(b, 390, 844, 'mitarbeiter');
    const r = await p.evaluate(async () => {
      const k = [...document.querySelectorAll('#heuteListe .hz-haken')].find(e => e.getClientRects().length);
      const id = k.getAttribute('data-hhak-id'), sk = k.getAttribute('data-hhak-sk');
      k.click(); await new Promise(r => setTimeout(r, 700));
      const huelle = k.closest('.hz-mit-haken');
      const bar = document.getElementById('undoBar');
      const nach = { erledigt: huelle.classList.contains('erledigt'), undo: bar.classList.contains('show'), text: document.getElementById('undoText').textContent };
      return { id, sk, nach };
    });
    pruefe('Haken: die Zeile steht als erledigt da, „Rückgängig" erscheint', r.nach.erledigt && r.nach.undo && /erledigt/.test(r.nach.text), JSON.stringify(r));
    const db = await p.evaluate(async (r) => {
      /* Was die App geschrieben hat – die Attrappe schreibt jeden
         update() in window.__schreib (Pfad + Daten). */
      const fuer = () => (window.__schreib || []).filter(x => /\/todos\//.test(x.pfad) && x.pfad.indexOf(r.id) >= 0 && 'done' in (x.daten || {}));
      const nachHaken = fuer().map(x => x.daten.done);
      document.getElementById('undoBtn').click(); await new Promise(x => setTimeout(x, 700));
      const alle = fuer().map(x => x.daten.done);
      return { nachHaken, alle, pfad: (fuer()[0] || {}).pfad };
    }, r);
    pruefe('Geschrieben: done:true für genau diese Aufgabe, nach Rückgängig done:false', JSON.stringify(db.nachHaken) === '[true]' && JSON.stringify(db.alle) === '[true,false]', JSON.stringify(db));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── 5 Gegenprobe: die Zeile öffnet weiter ──');
  {
    const p = await oeffne(b, 390, 844, 'mitarbeiter');
    const r = await p.evaluate(async () => {
      const z = [...document.querySelectorAll('#heuteListe .hz-mit-haken .heute-zeile')].find(e => e.getClientRects().length);
      const rr = z.getBoundingClientRect();
      /* rechts auf die Zeile, weit weg vom Haken */
      document.elementFromPoint(rr.right - 30, rr.top + rr.height / 2).click();
      await new Promise(x => setTimeout(x, 600));
      return { ansicht: (document.querySelector('.view.show') || {}).id, erledigt: !!document.querySelector('.hz-mit-haken.erledigt') };
    });
    pruefe('Tipp auf die Zeile öffnet die Aufgaben und hakt nicht ab', r.ansicht === 'view-todos' && !r.erledigt, JSON.stringify(r));
    await p._ctx.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Heute zum Abarbeiten: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Heute zum Abarbeiten: vier Räume für Mitarbeiter, Haken auf „Heute", Rückgängig — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
