/* ══════════════════════════════════════════════════════════════════════
   „hidden" HEISST UNSICHTBAR (Runde 143)

   Das Attribut hidden ist im Browser nur display:none mit der geringsten
   Gewichtung; jede Klasse mit display:flex/grid schlägt es. Gefunden bei
   der Durchsicht am Rechner, drei Stellen auf einmal:
     - Zeiten: ein leerer, anklickbarer Bernstein-Kasten (.zk-vormonat)
     - Team → Zwei-Faktor: das offene Formular „Zweiten Faktor entfernen"
       ohne Namen (.zf-weg-form)
     - Material: „Ändern" am Lieferanten für die Studioleitung, die ihn
       nicht ändern darf (.btn)
   Behoben mit einer Regel für alle: [hidden]{display:none!important}.

   Geprüft wird: in jeder Ansicht, jedem Reiter der Verwaltung und des
   Teams, als Geschäftsführung, Studioleitung und Mitarbeiter, am Rechner
   (1440) und am Handy (390): KEIN Element mit hidden ist zu sehen.
   GEGENPROBE: dieselbe Suche findet ein absichtlich falsch gebautes
   Element (display:flex mit hidden) — sonst prüfte sie nichts.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 400) : '')); }
}
const SUCHE = () => [...document.querySelectorAll('[hidden]')].filter(e =>
  getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0
).map(e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + String(e.className).split(' ').join('.')));

async function durchgehen(p, merk) {
  merk('Start', await p.evaluate(SUCHE));
  const gruppen = await p.evaluate(() => [...new Set([...document.querySelectorAll('.mobnav [data-group], #side [data-group]')]
    .filter(e => e.offsetParent).map(e => e.getAttribute('data-group')))]);
  let ansichten = 0;
  for (const g of gruppen) {
    await p.evaluate((g) => { const e = [...document.querySelectorAll('.mobnav [data-group="' + g + '"], #side [data-group="' + g + '"]')].find(x => x.offsetParent); if (e) e.click(); }, g);
    await p.waitForTimeout(700);
    merk(g, await p.evaluate(SUCHE)); ansichten++;
    const subs = await p.evaluate(() => [...new Set([...document.querySelectorAll('[data-subview]')].filter(e => e.offsetParent).map(e => e.getAttribute('data-subview')))]);
    for (const s of subs) {
      await p.evaluate((s) => { const e = [...document.querySelectorAll('[data-subview="' + s + '"]')].find(x => x.offsetParent); if (e) e.click(); }, s);
      await p.waitForTimeout(800);
      merk(g + '/' + s, await p.evaluate(SUCHE)); ansichten++;
      if (s !== 'chef') continue;
      const kacheln = await p.evaluate(() => [...document.querySelectorAll('#chefHome [data-cgo]')].map(e => e.getAttribute('data-cgo')));
      for (const c of kacheln) {
        await p.evaluate(() => { const h = document.getElementById('chefHome'); if (h && h.style.display === 'none') { const z = document.querySelector('#chefBar button'); if (z) z.click(); } });
        await p.waitForTimeout(250);
        await p.evaluate((c) => { const e = document.querySelector('#chefHome [data-cgo="' + c + '"]'); if (e) e.click(); }, c);
        await p.waitForTimeout(900);
        merk('Verwaltung:' + c, await p.evaluate(SUCHE)); ansichten++;
      }
    }
    if (g === 'g-team') {
      const reiter = await p.evaluate(() => [...new Set([...document.querySelectorAll('[data-teamtab]')].filter(e => e.offsetParent).map(e => e.getAttribute('data-teamtab')))]);
      for (const t of reiter) {
        await p.evaluate((t) => { const e = [...document.querySelectorAll('[data-teamtab="' + t + '"]')].find(x => x.offsetParent); if (e) e.click(); }, t);
        await p.waitForTimeout(700);
        merk('Team:' + t, await p.evaluate(SUCHE)); ansichten++;
      }
    }
  }
  return ansichten;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const rolle of ['chef', 'leiter', 'mitarbeiter']) {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      const fehler = [];
      p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
      await p.route('**://www.gstatic.com/**', r => r.abort());
      await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
      await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(3300);
      const gefunden = [];
      const merk = (wo, l) => l.forEach(x => gefunden.push(wo + ': ' + x));
      const n = await durchgehen(p, merk);
      pruefe(rolle + ' ' + w + ' px: in ' + n + ' Ansichten ist kein „hidden" zu sehen', !gefunden.length && n >= 8,
        gefunden.length ? [...new Set(gefunden)].join(', ') : n + ' Ansichten');
      pruefe(rolle + ' ' + w + ' px: ohne Skriptfehler', !fehler.length, fehler.join(' | '));
      if (rolle === 'chef' && w === 1440) {
        const gp = await p.evaluate((SRC) => {
          const S = eval('(' + SRC + ')');
          const d = document.createElement('div'); d.id = 'gegenprobeHidden'; d.hidden = true;
          d.setAttribute('style', 'display:flex !important;width:50px;height:20px');
          d.textContent = 'x'; document.querySelector('.view.show .scroll-area, .view.show').appendChild(d);
          const r = S(); d.remove(); return r;
        }, SUCHE.toString());
        pruefe('GEGENPROBE: ein absichtlich sichtbares hidden-Element wird gefunden', gp.includes('#gegenprobeHidden'), JSON.stringify(gp));
      }
      await p.close();
    }
  }
  await b.close();
  console.log('\n' + (schlecht ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ hidden heisst unsichtbar — in allen Ansichten, drei Rollen, Handy und Rechner — ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
