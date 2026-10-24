/* ══ LEERE ZUSTÄNDE ZEIGEN DEN NÄCHSTEN SCHRITT (Runde 259) ═══════════
   Plan „Studio Chat wie von Apple", Schritt 13: „leere Zustände zeigen
   den nächsten Schritt" (Apple, Writing) — mit Formi, die seit Runde 233
   über jeder leeren Liste sitzt. Seit 23.10.2026, 15:18: „es soll
   einfach den ganzen plan erledigen".

   test-leerzustand.js prüft die Wege mit leeren Attrappen. Hier geht es
   um die Fälle, die in der echten Demo vorkommen — eine Suche ohne
   Treffer, ein Filter ohne Treffer, ein leerer persönlicher Bereich:
    1. Suche ohne Treffer (Aufgaben, Putzplan, Direktnachrichten): Formi
       und „Suche leeren"; geklickt ist das Feld leer, hat den Fokus, und
       die Liste ist wieder da.
    2. Filter ohne Treffer: „Alle zeigen" schaltet auf „Alle".
    3. In jeder Ansicht: jeder sichtbare Weg-Knopf zeigt auf ein Element,
       das es gibt, ist ≥ 44 × 44 (Hit-Test), und ein Feld als Ziel hat
       danach den Fokus.
    4. Am Handy und am Rechner (390 / 1440), normal und kompakt.
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
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' }, w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  p.on('console', m => { if (/ins Leere/.test(m.text())) p._fehler.push(m.text()); });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((d) => { localStorage.setItem('kf_tour', '99:demo-ich'); localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'formi', stil2: true, dichte: d })); }, dichte || 'normal');
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  return { ctx, p };
}
const zeige = (p, id) => p.evaluate((id) => { history.replaceState({ v: id }, ''); window.dispatchEvent(new PopStateEvent('popstate', { state: { v: id } })); }, id);
const tippe = (p, sel, wert) => p.evaluate(([sel, wert]) => { const f = document.querySelector(sel); f.value = wert; f.dispatchEvent(new Event('input', { bubbles: true })); }, [sel, wert]);
const WEG = (text) => {
  const k = [...document.querySelectorAll('.view.show .empty .leer-weg')].find(x => x.getClientRects().length && (!text || x.textContent.trim() === text));
  if (!k) return null;
  k.scrollIntoView({ block: 'center' });
  const r = k.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === k || k.contains(t)); };
  let o = cy, u = cy, l = cx, re = cx;
  if (trifft(cx, cy)) { while (o > 0 && trifft(cx, o - 1)) o--; while (u < innerHeight && trifft(cx, u + 1)) u++; while (l > 0 && trifft(l - 1, cy)) l--; while (re < innerWidth && trifft(re + 1, cy)) re++; }
  const leer = k.closest('.empty');
  return { text: k.textContent.trim(), ziel: k.getAttribute('data-leerzu'), w: trifft(cx, cy) ? Math.round(re - l + 1) : 0, h: trifft(cx, cy) ? Math.round(u - o + 1) : 0,
    formi: !!leer.querySelector('.leer-figur .formi-figur'), titel: (leer.querySelector('h3') || {}).textContent };
};
const klick = (p, text) => p.evaluate((text) => { const k = [...document.querySelectorAll('.view.show .empty .leer-weg')].find(x => x.getClientRects().length && x.textContent.trim() === text); k.click(); }, text);

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    for (const dichte of ['normal', 'kompakt']) {
      for (const [w, h] of [[390, 844], [1440, 900]]) {
        console.log('\n── ' + w + ' × ' + h + ' ' + dichte + ' ──');
        const { ctx, p } = await oeffne(b, w, h, dichte);

        /* 1. Suche ohne Treffer */
        for (const [view, feld, liste] of [['todos', '#todoSearch', '#todoArea .todo'], ['putzplan', '#ppSearch', '#ppList .pp-item'], ['dm', '#dmSearch', '#dmPeople > *:not(.empty)']]) {
          await zeige(p, view); await p.waitForTimeout(600);
          if (await p.evaluate(() => ((document.querySelector('.view.show') || {}).id || '')) !== 'view-' + view) { pruefe(w + ' ' + view + ': Ansicht erreichbar', false); continue; }
          await tippe(p, feld, 'zzqxw'); await p.waitForTimeout(400);
          const k = await p.evaluate(WEG, 'Suche leeren');
          pruefe(w + ' ' + dichte + ' ' + view + ': „' + (k && k.titel) + '" mit Formi und „Suche leeren" ' + (k ? k.w + ' × ' + k.h : ''), !!k && k.formi && k.w >= 44 && k.h >= 44, JSON.stringify(k));
          if (!k) continue;
          await klick(p, 'Suche leeren'); await p.waitForTimeout(500);
          const n = await p.evaluate(([feld, liste]) => { const f = document.querySelector(feld); return { wert: f.value, fokus: document.activeElement === f || !f.getClientRects().length, zeilen: document.querySelectorAll(liste).length, titel: ((document.querySelector('.view.show .empty h3') || {}).textContent || '') }; }, [feld, liste]);
          /* Direktnachrichten: die Demo hat keine Unterhaltung — nach dem
             Leeren steht dort richtig „Noch keine Unterhaltungen". */
          pruefe(w + ' ' + dichte + ' ' + view + ': geklickt → Feld leer und im Fokus, ' + (n.zeilen ? n.zeilen + ' Einträge wieder da' : '„' + n.titel + '"'), n.wert === '' && n.fokus && !/gefunden/.test(n.titel) && (n.zeilen > 0 || (view === 'dm' && /Noch keine/.test(n.titel))), JSON.stringify(n));
        }

        /* 2. Filter ohne Treffer → „Alle zeigen" */
        if (dichte === 'normal') {
          await zeige(p, 'todos'); await p.waitForTimeout(500);
          const chips = await p.evaluate(() => [...document.querySelectorAll('[data-tfilter]')].map(c => c.getAttribute('data-tfilter')).filter(x => x !== 'alle'));
          let gefunden = false;
          for (const c of chips) {
            await p.evaluate((c) => document.querySelector('[data-tfilter="' + c + '"]').click(), c); await p.waitForTimeout(350);
            const k = await p.evaluate(WEG, 'Alle zeigen');
            if (!k) continue;
            gefunden = true;
            await klick(p, 'Alle zeigen'); await p.waitForTimeout(400);
            const n = await p.evaluate(() => ({ alle: document.querySelector('[data-tfilter="alle"]').classList.contains('on'), zeilen: document.querySelectorAll('#todoArea .todo').length }));
            pruefe(w + ': Filter „' + c + '" ohne Treffer → „Alle zeigen" (' + k.w + ' × ' + k.h + ') schaltet auf Alle, ' + n.zeilen + ' Aufgaben', n.alle && n.zeilen > 0 && k.w >= 44 && k.h >= 44, JSON.stringify([k, n]));
            break;
          }
          if (!gefunden) console.log('  · ' + w + ': kein Aufgaben-Filter ohne Treffer in der Demo (' + chips.join(', ') + ')');
          await p.evaluate(() => document.querySelector('[data-tfilter="alle"]').click());
        }

        /* 3. Alle Ansichten: jeder Weg zeigt auf etwas, ist gross genug, Felder bekommen den Fokus */
        const ids = await p.evaluate(() => [...document.querySelectorAll('section.view[id^="view-"]')].map(s => s.id.replace('view-', '')));
        const wege = [];
        for (const id of ids) {
          await zeige(p, id); await p.waitForTimeout(300);
          if (await p.evaluate(() => ((document.querySelector('.view.show') || {}).id || '')) !== 'view-' + id) continue;
          const alle = await p.evaluate(() => [...document.querySelectorAll('.view.show .empty .leer-weg')].filter(x => x.getClientRects().length).map(x => x.textContent.trim()));
          for (const t of alle) {
            const k = await p.evaluate(WEG, t);
            const da = await p.evaluate((z) => !!document.querySelector(z), k.ziel);
            await klick(p, t); await p.waitForTimeout(350);
            const fokus = await p.evaluate((z) => { const f = document.querySelector(z); if (!f) return 'fehlt'; return /^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName) ? (document.activeElement === f ? 'Fokus' : 'KEIN Fokus') : 'Knopf'; }, k.ziel);
            wege.push(id + ' „' + t + '" ' + k.w + '×' + k.h + ' → ' + fokus);
            pruefe(w + ' ' + dichte + ' ' + id + ': „' + t + '" ' + k.w + ' × ' + k.h + ' → ' + k.ziel + ' (' + fokus + ')', da && k.w >= 44 && k.h >= 44 && fokus !== 'KEIN Fokus' && fokus !== 'fehlt', JSON.stringify(k));
            await p.keyboard.press('Escape'); await p.waitForTimeout(200);
            await zeige(p, id); await p.waitForTimeout(250);
          }
        }
        console.log('  · Wege in der Demo: ' + (wege.length ? wege.length : 'keine weiteren'));
        if (p._fehler.length) pruefe(w + ' ' + dichte + ': keine Seitenfehler, kein Weg ins Leere', false, p._fehler.join(' | '));
        await ctx.close();
      }
    }
  } finally { await b.close(); }
  console.log('\n' + (schlecht ? '✗' : '✓') + ' Leere Zustände: ' + gut + ' grün, ' + schlecht + ' falsch');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
