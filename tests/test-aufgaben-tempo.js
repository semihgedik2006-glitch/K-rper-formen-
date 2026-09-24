/* ══════════════════════════════════════════════════════════════════════
   AUFGABEN: SCHNELLER BIS ZUM ERSTEN BILD (P-17)

   Gemessen am 24.9.2026, Demo Chef (61 Aufgaben), CPU ÷4, sechs Tipps
   auf „Aufgaben", Median bis zum ersten gezeichneten Bild:
     390 × 844:  vorher 176 ms  →  nachher 104 ms
     1440 × 900: vorher 156 ms  →  nachher 121 ms
   Der Klick selbst kostete nur 25–35 ms. Der Rest war Stil und Layout
   für ALLE Zeilen, auch die 50 unter dem Bildschirmrand. Jetzt tragen
   die Zeilen ab der 13. `content-visibility:auto`: der Browser rechnet
   sie erst, wenn sie in die Nähe des Bildes kommen.

   Was dieser Durchlauf festhält — die ZAHL nicht, und das mit Absicht:
   er läuft im Gesamtdurchlauf neben einem zweiten Browser, und eine
   Zeitgrenze wäre dort ein Würfelwurf. Er druckt die Zeiten aus und
   prüft, was sie verursacht, und dass dabei nichts kaputtgeht:
   1. Zeilen ab der 13. werden verzögert gerechnet, die ersten zwölf
      nicht (die sieht man sofort; dort blieb auch die Einblendung).
   2. Eine verzögerte Zeile ist trotzdem vollständig da: ins Bild
      gerollt hat sie ihre echte Höhe, ist anklickbar (Hit-Test), und
      ihr Haken reagiert.
   3. Die Liste ist so lang wie vorher (Platzhalterhöhe), damit der
      Rollbalken nicht beim Rollen springt — Abweichung unter 15 %.
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

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    console.log('\n── ' + w + ' × ' + h + ' ──');
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const fehler = [];
    p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3300);

    /* Die Zeiten, nur zum Ablesen. */
    const cdp = await p.context().newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const zeiten = [];
    for (let i = 0; i < 4; i++) {
      await p.evaluate(() => document.querySelector('.mobnav [data-group="g-start"], #side [data-group="g-start"]').click());
      await p.waitForTimeout(900);
      zeiten.push(await p.evaluate(() => new Promise(r => {
        const t0 = performance.now();
        document.querySelector('.mobnav [data-group="g-arbeit"], #side [data-group="g-arbeit"]').click();
        requestAnimationFrame(() => setTimeout(() => r(Math.round(performance.now() - t0)), 0));
      })));
    }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    console.log('    bis zum ersten Bild (CPU ÷4, nur zur Information): ' + zeiten.join(' / ') + ' ms');
    await p.waitForTimeout(600);

    const r = await p.evaluate(() => {
      const zeilen = [...document.querySelectorAll('#todoArea .todo')];
      const cv = zeilen.map(z => getComputedStyle(z).contentVisibility);
      return { zahl: zeilen.length,
               vorne: cv.slice(0, 12).every(x => x !== 'auto'),
               hinten: cv.slice(12).every(x => x === 'auto') };
    });
    pruefe('die ersten zwölf Zeilen werden sofort gerechnet', r.vorne);
    pruefe('ab der 13. Zeile verzögert (' + (r.zahl - 12) + ' Zeilen)', r.zahl > 20 && r.hinten, JSON.stringify(r));

    /* Eine späte Zeile ins Bild holen und benutzen. */
    const spaet = await p.evaluate(async () => {
      const zeilen = [...document.querySelectorAll('#todoArea .todo')];
      const z = zeilen[Math.min(40, zeilen.length - 1)];
      const hoeheVorher = z.getBoundingClientRect().height;
      z.scrollIntoView({ block: 'center' });
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise(r => setTimeout(r, 200));
      const k = z.getBoundingClientRect();
      const trifft = document.elementFromPoint(k.left + k.width / 2, k.top + k.height / 2);
      const haken = z.querySelector('.check, [data-check], input[type=checkbox]');
      return { hoeheVorher: Math.round(hoeheVorher), hoehe: Math.round(k.height),
               trifft: !!trifft && z.contains(trifft), text: z.textContent.trim().length,
               haken: !!haken };
    });
    pruefe('eine späte Zeile ist ins Bild gerollt vollständig da (' + spaet.hoehe + ' px, Text ' + spaet.text + ' Zeichen)',
      spaet.hoehe > 40 && spaet.text > 5, JSON.stringify(spaet));
    pruefe('und trifft beim Antippen sich selbst', spaet.trifft);
    pruefe('mit ihrem Haken zum Abhaken', spaet.haken);

    /* Gesamthöhe: Platzhalter gegen echte Höhe. */
    const hoehe = await p.evaluate(async () => {
      const area = document.getElementById('todoArea');
      const mitPlatzhalter = area.getBoundingClientRect().height;
      const zeilen = [...area.querySelectorAll('.todo')];
      zeilen.forEach(z => { z.style.contentVisibility = 'visible'; });
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const echt = area.getBoundingClientRect().height;
      zeilen.forEach(z => { z.style.contentVisibility = ''; });
      return { mitPlatzhalter: Math.round(mitPlatzhalter), echt: Math.round(echt) };
    });
    const abw = Math.abs(hoehe.mitPlatzhalter - hoehe.echt) / hoehe.echt;
    pruefe('die Liste ist mit Platzhaltern fast so lang wie echt (' + Math.round(abw * 100) + ' % Abweichung)',
      abw < 0.15, JSON.stringify(hoehe));
    pruefe('ohne Skriptfehler', !fehler.length, fehler.join(' | '));
    await p.close();
  }
  await b.close();
  console.log(schlecht
    ? '\n✗ Aufgaben-Tempo: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Aufgaben-Tempo: späte Zeilen werden erst bei Bedarf gerechnet und bleiben voll benutzbar — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
