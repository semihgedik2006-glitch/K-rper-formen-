/* ══════════════════════════════════════════════════════════════════════
   PUTZPLAN: INHALT ZUERST (Runde 103, P2) — am PC und am Handy

   Aus dem Betrieb, 24.9.2026: Aufgaben und Putzplan sind die meistge-
   nutzten Bereiche, und der PC ist das Hauptgerät.

   Vorher gemessen (demo, erster Putzpunkt):
     390 × 844   y = 764  (17 Bedienelemente davor, 1 Punkt halb sichtbar)
     1440 × 900  y = 684  (3 von 5 sichtbar)

   Was dieser Durchlauf festhält:
     · der erste Punkt beginnt am Handy unter 480 px, am PC unter 450
     · der Plan steht in Gruppen (Täglich, Wöchentlich, …) mit „x von y"
     · am PC stehen die Gruppen NEBENEINANDER (gleiche Oberkante)
     · „Filter" klappt die Filter auf und zeigt, wie viele aktiv sind
     · „Wer hakt ab?" klappt das Kürzelfeld auf; danach steht es am Knopf
     · ein abgehakter Punkt hat ein GEFÜLLTES Kästchen (vorher leer)
     · jedes Bedienelement der Leiste ≥ 44 × 44 bei 320/390/1440
     · ein Haken lässt den Plan nicht neu einlaufen (vorher 4 Animationen)
     · GEGENPROBE: wer nach Name sortiert, bekommt eine flache Liste
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

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

async function zumPutzplan(b, rolle, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  await p.evaluate(() => { const n = [...document.querySelectorAll('.mobnav button, .side button')].find(x => /Aufgaben/.test(x.textContent) && x.getClientRects().length); n.click(); });
  await p.waitForTimeout(600);
  await p.evaluate(() => { const s = document.querySelector('[data-subview="putzplan"]'); if (s) s.click(); });
  await p.waitForTimeout(900);
  return p;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  for (const [w, h, grenze] of [[390, 844, 480], [1440, 900, 450], [1280, 800, 450]]) {
    console.log('\n── ' + w + ' × ' + h + ' ──');
    const p = await zumPutzplan(b, 'chef', w, h);
    const m = await p.evaluate((SRC) => {
      const TREFFER = eval(SRC);
      const erste = document.querySelector('#ppList .pp-item');
      const gruppen = [...document.querySelectorAll('#ppList .pp-gruppe')];
      return {
        y: erste ? Math.round(erste.getBoundingClientRect().top) : null,
        gruppen: gruppen.map(g => g.querySelector('h4').textContent + ' ' + g.querySelector('.pg-zahl').textContent),
        oben: gruppen.map(g => Math.round(g.getBoundingClientRect().top)),
        leiste: [...document.querySelectorAll('#ppLeiste button, #ppLeiste select')].filter(x => x.getClientRects().length)
          .map(x => ({ id: x.id, t: TREFFER(x) })),
        voll: [...document.querySelectorAll('#ppList .pp-item.done .check')].map(c => getComputedStyle(c).backgroundImage !== 'none'),
      };
    }, '(' + TREFFER.toString() + ')');
    console.log('  ' + JSON.stringify({ y: m.y, gruppen: m.gruppen, oben: m.oben }));
    pruefe('erster Putzpunkt unter ' + grenze + ' px (vorher 764 bzw. 684)', m.y !== null && m.y < grenze, String(m.y));
    pruefe('der Plan steht in Gruppen mit „x von y"', m.gruppen.length >= 2 &&
      m.gruppen.every(g => /(\d+ von \d+|pausiert)$/.test(g)), JSON.stringify(m.gruppen));
    if (w >= 1100)
      pruefe('am PC stehen die Gruppen nebeneinander (gleiche Oberkante)', m.oben.length >= 2 && m.oben[0] === m.oben[1],
        JSON.stringify(m.oben));
    else
      pruefe('am Handy stehen sie untereinander', m.oben.length >= 2 && m.oben[1] > m.oben[0], JSON.stringify(m.oben));
    pruefe('jedes Bedienelement der Leiste ≥ 44 × 44', m.leiste.every(x => x.t.w >= 44 && x.t.h >= 44),
      JSON.stringify(m.leiste));
    pruefe('abgehakte Punkte haben ein gefülltes Kästchen', m.voll.length > 0 && m.voll.every(Boolean),
      JSON.stringify(m.voll));

    if (w === 1440) {
      /* Ein Haken zeichnet die Liste neu. Vorher lief dabei der ganze
         Plan erneut gestaffelt ein (gemessen 4 Animationen für einen
         Haken); jetzt darf nur der abgehakte Punkt sich bewegen. */
      const n = await p.evaluate(async () => {
        document.querySelector('#ppList .pp-item:not(.done) [data-check]').click();
        await new Promise(r => setTimeout(r, 40));
        return document.getAnimations().filter(a => a.animationName === 'listIn').length;
      });
      pruefe('ein Haken lässt den Plan NICHT neu einlaufen', n === 0, String(n));
    }
    if (w === 390) {
      /* Filter: zu, auf, mit Zahl. */
      const f = await p.evaluate(async () => {
        const zu = document.getElementById('ppWerkzeuge').hidden;
        document.getElementById('ppFilterKnopf').click();
        await new Promise(r => setTimeout(r, 200));
        const auf = !document.getElementById('ppWerkzeuge').hidden;
        document.querySelector('[data-ppfilter="offen"]').click();
        await new Promise(r => setTimeout(r, 300));
        const knopf = document.getElementById('ppFilterKnopf').textContent.replace(/\s+/g, ' ').trim();
        document.querySelector('[data-ppfilter="alle"]').click();
        await new Promise(r => setTimeout(r, 300));
        return { zu, auf, knopf, danach: document.getElementById('ppFilterKnopf').textContent.trim() };
      });
      console.log('  Filter: ' + JSON.stringify(f));
      pruefe('die Filter sind zu, bis man „Filter" antippt', f.zu && f.auf);
      pruefe('ein aktiver Filter steht am Knopf („Filter 1")', /Filter\s*1/.test(f.knopf) && f.danach === 'Filter',
        JSON.stringify(f));

      /* Wer hakt ab */
      const wer = await p.evaluate(async () => {
        const vorher = document.getElementById('ppWerKnopf').textContent.trim();
        document.getElementById('ppWerKnopf').click();
        await new Promise(r => setTimeout(r, 200));
        const feld = document.getElementById('ppKuerzel');
        const auf = !document.getElementById('ppWerZeile').hidden;
        feld.value = 'AB'; feld.dispatchEvent(new Event('input'));
        feld.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await new Promise(r => setTimeout(r, 200));
        return { vorher, auf, zu: document.getElementById('ppWerZeile').hidden,
                 knopf: document.getElementById('ppWerKnopf').textContent.trim() };
      });
      console.log('  Wer: ' + JSON.stringify(wer));
      pruefe('„Wer hakt ab?" klappt das Feld auf, Enter schliesst es', wer.auf && wer.zu, JSON.stringify(wer));
      pruefe('danach steht das Kürzel am Knopf', wer.knopf === 'Wer: AB', wer.knopf);

      /* GEGENPROBE: explizite Sortierung → flach */
      const flach = await p.evaluate(async () => {
        const s = document.getElementById('ppSort'); s.value = 'name'; s.dispatchEvent(new Event('change'));
        await new Promise(r => setTimeout(r, 400));
        const n = document.querySelectorAll('#ppList .pp-gruppe').length;
        s.value = 'standard'; s.dispatchEvent(new Event('change'));
        await new Promise(r => setTimeout(r, 400));
        return { beiName: n, zurueck: document.querySelectorAll('#ppList .pp-gruppe').length };
      });
      pruefe('GEGENPROBE nach Name sortiert: flache Liste, keine Gruppen', flach.beiName === 0 && flach.zurueck > 0,
        JSON.stringify(flach));
    }
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  /* 320 px: die Leiste bricht um, bleibt aber bedienbar. */
  {
    const p = await zumPutzplan(b, 'mitarbeiter', 320, 640);
    const l = await p.evaluate((SRC) => {
      const TREFFER = eval(SRC);
      return [...document.querySelectorAll('#ppLeiste button, #ppLeiste select')].filter(x => x.getClientRects().length)
        .map(x => { x.scrollIntoView({ block: 'center' }); const r = x.getBoundingClientRect();
          return { id: x.id, t: TREFFER(x), imBild: r.left >= 0 && r.right <= innerWidth + .5 }; });
    }, '(' + TREFFER.toString() + ')');
    pruefe('320 px: jedes Bedienelement der Leiste ≥ 44 × 44 und im Bild',
      l.every(x => x.t.w >= 44 && x.t.h >= 44 && x.imBild), JSON.stringify(l));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Putzplan P2: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Putzplan P2: Inhalt zuerst, Gruppen, am PC nebeneinander — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
