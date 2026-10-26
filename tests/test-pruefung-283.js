/* ══ PRÜFRUNDE 283: MINUS-STUNDEN, DEMO-SCHICHTEN, BESCHRIFTUNGEN ══════
   Aus dem Betrieb, 26.10.2026: „kontrolier einmal die app nach fehlern
   und schwächen". Drei Funde, jeder hier festgehalten:

    1. Zeiten → Team, „Jetzt im Studio": kurz nach Mitternacht stand
       „seit 00:01 · -1:-1 h". Ein Kommen-Stempel, der (Uhrenversatz) kurz
       in der Zukunft liegt, ergab eine negative Dauer. Nachgestellt mit
       einer festen Uhr um 00:00:02 — die Demo stempelt dann um 00:01.
    2. Vorführung als Geschäftsführung: die eigene Schicht heute stand in
       jedem der 14 Studios — 14 × 09:00–14:00 gleichzeitig. Jetzt eine.
    3. Material, Geräte, Team: jedes Feld hat einen Namen für
       Bildschirmleser (axe: label, select-name). Soll/Ist und die
       Auswahl im Bestand hat Runde 282 benannt; hier dazu die
       Studio-Auswahl unter Geräte und „Eigenes Material".
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs');
const CHROME = process.env.CHROME;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(name, ok, info) {
  if (ok) { gut++; console.log('  ✓ ' + name); }
  else { schlecht++; console.log('  ✗ ' + name + (info ? '  — ' + info : '')); }
}

async function oeffne(b, opt) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  if (opt.uhr) await p.clock.install({ time: new Date(opt.uhr) });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + (opt.rolle || 'chef'), { waitUntil: 'domcontentloaded' });
  if (opt.uhr) await p.clock.runFor(4000); else await p.waitForTimeout(3500);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  return { ctx, p };
}
const zu = (p, v) => p.evaluate((v) => {
  const k = document.getElementById('bereichKopf'); k && k.click();
  const a = document.querySelector('#allesLade [data-alles="' + v + '"]');
  if (a) a.click(); else { const s = document.querySelector('[data-subview="' + v + '"]'); if (s) s.click(); k && k.click(); }
}, v);

(async () => {
  const b = await chromium.launch(CHROME && fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
  try {
    console.log('\n── 1. Keine negative Dauer kurz nach Mitternacht ──');
    {
      const heute = new Date(); heute.setHours(0, 0, 2, 0);
      const { ctx, p } = await oeffne(b, { uhr: heute.getTime() });
      await zu(p, 'zeitteam'); await p.clock.runFor(1500);
      const m = await p.evaluate(() => {
        const box = document.getElementById('zkJetzt');
        return { text: box ? box.innerText.replace(/\s+/g, ' ') : '', zeilen: box ? box.querySelectorAll('.zk-j-p').length : 0 };
      });
      pruefe('„Jetzt im Studio" zeigt Leute im Dienst (' + m.zeilen + ')', m.zeilen > 0, m.text.slice(0, 120));
      pruefe('keine Dauer mit Minus (' + (m.text.match(/seit [^·]+· [^ ]+ h/) || [''])[0] + ')', !/-\d+:-?\d+ h/.test(m.text), m.text.slice(0, 200));
      await ctx.close();
    }

    console.log('\n── 2. Vorführung: eine eigene Schicht heute, nicht vierzehn ──');
    {
      const { ctx, p } = await oeffne(b, { rolle: 'chef' });
      await zu(p, 'zeit'); await p.waitForTimeout(900);
      const m = await p.evaluate(() => {
        const v = document.getElementById('view-zeit');
        const t = v ? v.innerText : '';
        return { plan: (t.match(/Laut Plan\s*([\d:]+ h)/) || [])[1] || '', schichten: (t.match(/\d\d:\d\d–\d\d:\d\d · /g) || []).length };
      });
      pruefe('Laut Plan heute höchstens 12 h (' + m.plan + ')', m.plan && parseInt(m.plan, 10) <= 12, JSON.stringify(m));
      pruefe('höchstens eine eigene Schicht in „Jetzt" (' + m.schichten + ')', m.schichten <= 1, JSON.stringify(m));
      if (p._fehler.length) pruefe('keine Seitenfehler', false, p._fehler.join(' | '));
      await ctx.close();
    }

    console.log('\n── 3. Felder mit Namen für Bildschirmleser ──');
    {
      const { ctx, p } = await oeffne(b, { rolle: 'chef' });
      const ohne = [];
      for (const v of ['material', 'geraete', 'team']) {
        await zu(p, v); await p.waitForTimeout(900);
        const m = await p.evaluate(() => {
          const sicht = document.querySelector('.view.show');
          const felder = [...sicht.querySelectorAll('select, input:not([type=hidden]), textarea')].filter(e => e.getClientRects().length);
          const name = e => e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.title ||
            (e.id && document.querySelector('label[for="' + e.id + '"]')) || e.closest('label');
          return { n: felder.length, ohne: felder.filter(e => !name(e)).map(e => e.tagName + (e.id ? '#' + e.id : '.' + e.className)) };
        });
        console.log('  · ' + v + ': ' + m.n + ' Felder');
        if (!m.n) ohne.push(v + ': keine Felder gefunden');
        ohne.push(...m.ohne.map(x => v + ' ' + x));
      }
      pruefe('jedes Feld in Material, Geräte, Team hat einen Namen', !ohne.length, [...new Set(ohne)].slice(0, 6).join(' | '));
      await ctx.close();
    }
  } finally { await b.close(); }
  console.log('\n' + (schlecht ? '✗ ' + schlecht + ' Fehler, ' : '') + gut + ' in Ordnung');
  process.exit(schlecht ? 1 : 0);
})();
