/* ══════════════════════════════════════════════════════════════════════
   AUFGABEN AM PC (Runde 103, P1 — umgebaut in Runde 147)

   Runde 103 hat am PC rechts ein Detailfeld gebaut. Runde 147 hat es
   wieder entfernt, auf ausdrücklichen Wunsch aus dem Betrieb (9.10.2026):
   „kannst du es bitte machen das der aufgaben bereich vom aufbau und
   layout GENAU so wie der purtzplan aufgestellt ist" — und auf die
   Rückfrage zum Detailfeld: „Weg, wie im Putzplan".

   Die Prüfungen zum Detailfeld sind deshalb nicht gelockert, sondern
   ersetzt durch das, was davon bleibt und was jetzt gilt:
     · KEIN Detailfeld mehr, auch nicht am PC (vorher: es muss da sein)
     · ohne eigenes Zutun ist nichts gewählt (vorher: die erste offene)
     · ein Klick auf die Zeile wählt nichts — es gibt nichts, wohin die
       Wahl führte
     · ↓ wählt die erste/nächste Aufgabe, x hakt die gewählte ab
     · der doppelte Seitenkopf bleibt weg, „+ Neu" im Bereichskopf
     · die erste Aufgabe beginnt über y = 420 (vorher 486)
     · Stift, Papierkorb und „…" in der Zeile ≥ 44 × 44 bei 1280, 1440,
       1920 in beiden Dichten (die Knöpfe, die vorher im Detail standen)
     · Handy: „+ Aufgabe" bleibt unten in der Daumenzone
   Die vollständige Prüfung des neuen Aufbaus steht in
   tests/test-aufgaben-wie-putzplan.js.
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
async function zuDenAufgaben(b, rolle, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  await p.evaluate(() => { const n = [...document.querySelectorAll('.mobnav button, .side button')].find(x => /Aufgaben/.test(x.textContent) && x.getClientRects().length); n.click(); });
  await p.waitForTimeout(900);
  return p;
}
const LAGE = () => {
  const zeilen = [...document.querySelectorAll('#todoArea .todo')];
  const gew = document.querySelector('#todoArea .todo.gewaehlt');
  const d = document.getElementById('todoDetail');
  return {
    detailSichtbar: !!d || !!document.querySelector('.todo-spalten, .todo-detail'),
    gewaehlt: gew ? { id: gew.dataset.id, titel: gew.querySelector('.t-title').childNodes[0].textContent.trim(), done: gew.classList.contains('done') } : null,
    ersteOffene: (zeilen.find(z => !z.classList.contains('done')) || {}).dataset,
    y: zeilen[0] ? Math.round(zeilen[0].getBoundingClientRect().top) : null,
    imBild: zeilen.filter(z => { const r = z.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }).length,
    kopfSichtbar: !!document.querySelector('#view-todos .view-head').getClientRects().length,
    neuImBereichskopf: !!document.querySelector('#bereichZeile #todoNew')
  };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  for (const [w, h] of [[1440, 900], [1280, 800]]) {
    console.log('\n── PC ' + w + ' × ' + h + ' ──');
    const p = await zuDenAufgaben(b, 'chef', w, h);
    const a = await p.evaluate(LAGE);
    console.log('  ' + JSON.stringify({ y: a.y, imBild: a.imBild, gewaehlt: a.gewaehlt }));
    pruefe('kein Detailfeld mehr (Runde 147: „Weg, wie im Putzplan")', !a.detailSichtbar);
    pruefe('ohne eigenes Zutun ist nichts gewählt', !a.gewaehlt, JSON.stringify(a.gewaehlt));
    pruefe('der doppelte Seitenkopf ist weg, „+ Neu" steht im Bereichskopf', !a.kopfSichtbar && a.neuImBereichskopf,
      JSON.stringify({ kopf: a.kopfSichtbar, neu: a.neuImBereichskopf }));
    pruefe('die erste Aufgabe beginnt über y = 420 (vorher 486)', a.y !== null && a.y < 420, String(a.y));

    const nachKlick = await p.evaluate(async () => {
      const z = [...document.querySelectorAll('#todoArea .todo')][1];
      z.querySelector('.t-title').click();
      await new Promise(r => setTimeout(r, 150));
      return !!document.querySelector('#todoArea .todo.gewaehlt');
    });
    pruefe('ein Klick auf die Zeile wählt nichts', !nachKlick);

    await p.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await p.keyboard.press('ArrowDown');
    await p.waitForTimeout(150);
    const i1 = await p.evaluate(() => [...document.querySelectorAll('#todoArea .todo')].findIndex(z => z.classList.contains('gewaehlt')));
    pruefe('↓ wählt die erste Aufgabe', i1 === 0, String(i1));
    await p.keyboard.press('ArrowDown');
    await p.waitForTimeout(150);
    const vorX = await p.evaluate(LAGE);
    pruefe('↓ noch einmal wählt die nächste', vorX.gewaehlt && vorX.gewaehlt.id === (await p.evaluate(() => document.querySelectorAll('#todoArea .todo')[1].dataset.id)));
    /* Eine OFFENE zum Abhaken suchen, notfalls weiter nach unten. */
    for (let k = 0; k < 6 && vorX.gewaehlt && vorX.gewaehlt.done; k++) {
      await p.keyboard.press('ArrowDown'); await p.waitForTimeout(120);
      Object.assign(vorX, await p.evaluate(LAGE));
    }
    await p.keyboard.press('x');
    await p.waitForTimeout(500);
    const nachX = await p.evaluate((id) => {
      const z = document.querySelector('#todoArea .todo[data-id="' + id + '"]');
      return z ? z.classList.contains('done') : null;
    }, vorX.gewaehlt && vorX.gewaehlt.id);
    pruefe('x hakt die gewählte Aufgabe ab', vorX.gewaehlt && !vorX.gewaehlt.done && nachX === true, JSON.stringify({ vorX: vorX.gewaehlt, nachX }));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  /* Die Handgriffe, die vorher im Detail standen, stehen jetzt in der
     Zeile — gemessen bei 1280, 1440 und 1920, normal und kompakt. */
  for (const [w, h] of [[1920, 1080], [1440, 900], [1280, 800]]) {
    const p = await zuDenAufgaben(b, 'chef', w, h);
    for (const dichte of ['normal', 'kompakt']) {
      const k = await p.evaluate(async ([SRC, dichte]) => {
        const TREFFER = eval(SRC);
        document.body.dataset.dichte = dichte;
        await new Promise(r => setTimeout(r, 200));
        return [...document.querySelectorAll('#todoArea .todo .t-edit, #todoArea .todo .t-del, #todoArea .todo .t-mehr, #todoArea .todo .check')]
          .filter(x => x.getClientRects().length && x.getBoundingClientRect().bottom < innerHeight)
          .map(x => ({ t: x.className, m: TREFFER(x) }));
      }, ['(' + TREFFER.toString() + ')', dichte]);
      pruefe(w + ' px, ' + dichte + ': Haken, Stift, Papierkorb, „…" ≥ 44 × 44',
        k.length >= 4 && k.every(x => x.m.w >= 44 && x.m.h >= 44), JSON.stringify(k.filter(x => x.m.w < 44 || x.m.h < 44)));
    }
    await p.close();
  }

  {
    console.log('\n── Handy 390 × 844 ──');
    const p = await zuDenAufgaben(b, 'chef', 390, 844);
    const a = await p.evaluate(LAGE);
    pruefe('Handy: kein Detailfeld', !a.detailSichtbar, JSON.stringify(a));
    pruefe('Handy: „+ Aufgabe" bleibt unten in der Daumenzone', await p.evaluate(() => !!document.querySelector('#daumenDock #todoNew')));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Aufgaben P1: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Aufgaben P1: am PC ohne Detailfeld, Tastatur, Handgriffe in der Zeile — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
