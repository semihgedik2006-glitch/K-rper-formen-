/* ══════════════════════════════════════════════════════════════════════
   ANLIEGEN AM RECHNER: LISTE + DETAIL (Runde 120)

   Aus dem Betrieb, 24.9.2026: „bitte leg genau so viel Fokus auf die
   PC-Nutzung wie auf die Handy-Nutzung". Die Anliegen waren der letzte
   Verwaltungsreiter, der am Rechner eine Spalte über die ganze Breite
   zog — mit einem Antwortfeld in jeder Zeile.

   1. Ab 1100 px: Liste links, gewähltes Anliegen rechts, nebeneinander;
      die Karten fürs Handy sind dort aus.
   2. Klick und ↑/↓ wählen; „Beantwortet" zeigt die Antwort.
   3. Antworten per Strg+Enter: das Anliegen wandert nach „Beantwortet".
   4. Am Handy (390, 820) bleibt es bei den Karten; die PC-Ansicht ist aus.
   5. Treffer ≥ 44 × 44 bei 1280 / 1440 / 1920, normal und kompakt.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

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
async function oeffne(b, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { const a = document.querySelector('#side [data-group="g-alles"], .mobnav [data-group="g-alles"]'); if (a) a.click(); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { const k = document.querySelector('[data-al-cgo="anliegen"]'); if (k) k.click(); });
  await p.waitForTimeout(1000);
  return p;
}
const stand = (p) => p.evaluate(() => {
  const pc = document.getElementById('anlPc');
  const l = document.querySelector('.anl-pc-liste'), d = document.getElementById('anlPcDetail');
  const rl = l.getBoundingClientRect(), rd = d.getBoundingClientRect();
  return {
    pc: getComputedStyle(pc).display !== 'none',
    handy: getComputedStyle(document.querySelector('.anl-handy')).display !== 'none',
    nebeneinander: rd.left >= rl.right - 1 && Math.abs(rd.top - rl.top) < 30,
    zeilen: [...document.querySelectorAll('#anlPcZeilen [data-anlwahl]')].map(z => z.querySelector('.anl-z-titel').textContent),
    gewaehlt: (document.querySelector('#anlPcZeilen .anl-zeile.an .anl-z-titel') || {}).textContent || '',
    titel: (document.querySelector('#anlPcDetail h3') || {}).textContent || '',
    feld: !!document.getElementById('anlPcAntwort'),
    antwort: (document.querySelector('#anlPcDetail .anl-d-antwort p') || {}).textContent || '',
  };
});

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1.–3. Am Rechner ──');
  {
    const p = await oeffne(b, 1440, 900);
    const s0 = await stand(p);
    pruefe('1440 px: Liste links, Anliegen rechts; die Handy-Karten sind aus', s0.pc && !s0.handy && s0.nebeneinander, JSON.stringify(s0));
    pruefe('vier offene in der Liste, das erste ist gewählt und steht rechts mit Antwortfeld',
      s0.zeilen.length === 4 && s0.gewaehlt === s0.zeilen[0] && s0.titel === s0.zeilen[0] && s0.feld, JSON.stringify(s0));
    await p.click('#anlPcZeilen [data-anlwahl]:nth-child(3)');
    await p.waitForTimeout(200);
    const s1 = await stand(p);
    pruefe('Klick auf das dritte: rechts steht das dritte', s1.titel === s1.zeilen[2] && s1.gewaehlt === s1.zeilen[2], JSON.stringify(s1));
    await p.keyboard.press('ArrowUp');
    await p.waitForTimeout(200);
    const s2 = await stand(p);
    pruefe('↑: eins nach oben', s2.titel === s2.zeilen[1], JSON.stringify(s2));
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
    await p.waitForTimeout(200);
    const s3 = await stand(p);
    pruefe('↓↓: zwei nach unten', s3.titel === s3.zeilen[3], JSON.stringify(s3));
    const titel = s3.titel;
    await p.fill('#anlPcAntwort', 'Klingt gut, machen wir.');
    await p.press('#anlPcAntwort', 'Control+Enter');
    await p.waitForTimeout(700);
    const s4 = await stand(p);
    pruefe('Strg+Enter antwortet: das Anliegen ist aus „Offen" verschwunden (3 übrig)', s4.zeilen.length === 3 && s4.zeilen.indexOf(titel) < 0, JSON.stringify(s4));
    await p.click('[data-anlfilter="fertig"]');
    await p.waitForTimeout(200);
    const s5 = await stand(p);
    pruefe('„Beantwortet": zwei, und das gerade beantwortete zeigt die Antwort', s5.zeilen.length === 2 && s5.zeilen.indexOf(titel) >= 0, JSON.stringify(s5));
    await p.click('#anlPcZeilen [data-anlwahl]:nth-child(' + (s5.zeilen.indexOf(titel) + 1) + ')');
    await p.waitForTimeout(200);
    const s6 = await stand(p);
    pruefe('… mit dem Text der Antwort, ohne Antwortfeld', s6.antwort === 'Klingt gut, machen wir.' && !s6.feld, JSON.stringify(s6));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 4. Am Handy bleibt es bei den Karten ──');
  for (const [w, h] of [[390, 844], [820, 1180]]) {
    const p = await oeffne(b, w, h);
    const s = await p.evaluate(() => ({
      pc: getComputedStyle(document.getElementById('anlPc')).display !== 'none',
      karten: document.querySelectorAll('#anlOffen .ziel-zeile').length,
    }));
    pruefe(w + ' px: keine PC-Ansicht, die Karten stehen da', !s.pc && s.karten === 4, JSON.stringify(s));
    await p.close();
  }

  console.log('\n── 5. Treffen ──');
  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const k = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const els = [...document.querySelectorAll('#anlPc button, #anlPc textarea')].filter(e => e.getClientRects().length);
        const zu = [];
        for (const el of els) { el.scrollIntoView({ block: 'center' }); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el); if (m.w < 44 || m.h < 44) zu.push((el.id || el.textContent.trim().slice(0, 16)) + ' ' + m.w + '×' + m.h); }
        return { zahl: els.length, zu, quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      pruefe(w + ' px, ' + dichte + ': Filter, Zeilen, Antwortfeld, Knopf ≥ 44 × 44', k.zahl >= 8 && !k.zu.length && k.quer <= 0, JSON.stringify(k));
    }
    await p.close();
  }

  await b.close();
  console.log('\n' + gut + ' gut, ' + schlecht + ' schlecht');
  if (schlecht) console.log('✗ Anliegen am Rechner: ' + schlecht + ' Prüfungen fehlgeschlagen');
  process.exit(schlecht ? 1 : 0);
})();
