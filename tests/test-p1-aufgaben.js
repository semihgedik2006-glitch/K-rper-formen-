/* ══════════════════════════════════════════════════════════════════════
   AUFGABEN AM PC: LISTE LINKS, DETAIL RECHTS (Runde 103, P1)

   Aus dem Betrieb, 24.9.2026: Aufgaben und Putzplan sind die meist-
   genutzten Bereiche, der PC ist das Hauptgerät.

   Vorher gemessen (Demo, Chef, 1440 × 900): erste Aufgabe bei y = 486,
   4 von 61 ganz im Bild, jede Zeile 1.174 px breit.

   Was dieser Durchlauf festhält:
     · ab 1100 px steht rechts die gewählte Aufgabe im Detail
     · ohne eigene Wahl ist das die erste OFFENE Aufgabe
     · ein Klick auf eine Zeile wählt sie; die Detailspalte folgt
     · ↓ wählt die nächste, x hakt die gewählte ab (Tastatur)
     · „Abhaken" im Detail hakt ab — über denselben Haken wie die Zeile
     · mindestens 7 Aufgaben im Bild, die erste über y = 420
     · der doppelte Seitenkopf ist weg, „+ Neu" steht im Bereichskopf
     · jedes Bedienelement im Detail ≥ 44 × 44
     · GEGENPROBE am Handy (390): keine Detailspalte, ein Klick auf die
       Zeile wählt nichts
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
    detailSichtbar: !!(d && d.getClientRects().length && d.querySelector('h3')),
    detailTitel: d && d.querySelector('h3') ? d.querySelector('h3').textContent : null,
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
    console.log('  ' + JSON.stringify({ y: a.y, imBild: a.imBild, detail: a.detailTitel, gewaehlt: a.gewaehlt }));
    pruefe('rechts steht die gewählte Aufgabe im Detail', a.detailSichtbar && a.gewaehlt && a.detailTitel === a.gewaehlt.titel,
      JSON.stringify(a));
    pruefe('ohne eigene Wahl ist es die erste OFFENE', a.gewaehlt && a.ersteOffene && a.gewaehlt.id === a.ersteOffene.id);
    pruefe('der doppelte Seitenkopf ist weg, „+ Neu" steht im Bereichskopf', !a.kopfSichtbar && a.neuImBereichskopf,
      JSON.stringify({ kopf: a.kopfSichtbar, neu: a.neuImBereichskopf }));
    if (w === 1440) {
      pruefe('mindestens 7 Aufgaben ganz im Bild (vorher 4)', a.imBild >= 7, String(a.imBild));
      pruefe('die erste beginnt über y = 420 (vorher 486)', a.y < 420, String(a.y));
    }
    const knoepfe = await p.evaluate((SRC) => {
      const TREFFER = eval(SRC);
      return [...document.querySelectorAll('#todoDetail button')].filter(x => x.getClientRects().length)
        .map(x => ({ t: x.textContent.trim().slice(0, 20), m: TREFFER(x) }));
    }, '(' + TREFFER.toString() + ')');
    pruefe('jedes Bedienelement im Detail ≥ 44 × 44', knoepfe.length >= 2 && knoepfe.every(k => k.m.w >= 44 && k.m.h >= 44),
      JSON.stringify(knoepfe));

    /* Klick auf eine andere Zeile */
    const klick = await p.evaluate(async () => {
      const z = [...document.querySelectorAll('#todoArea .todo')][2];
      z.querySelector('.t-title').click();
      await new Promise(r => setTimeout(r, 150));
      return { id: z.dataset.id, titel: z.querySelector('.t-title').childNodes[0].textContent.trim() };
    });
    const nachKlick = await p.evaluate(LAGE);
    pruefe('ein Klick auf eine Zeile wählt sie, das Detail folgt',
      nachKlick.gewaehlt && nachKlick.gewaehlt.id === klick.id && nachKlick.detailTitel === klick.titel, JSON.stringify(nachKlick.gewaehlt));

    /* Tastatur: ↓ */
    await p.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await p.keyboard.press('ArrowDown');
    await p.waitForTimeout(150);
    const nachPfeil = await p.evaluate(() => {
      const zs = [...document.querySelectorAll('#todoArea .todo')];
      return zs.findIndex(z => z.classList.contains('gewaehlt'));
    });
    pruefe('↓ wählt die nächste Aufgabe', nachPfeil === 3, String(nachPfeil));

    /* x hakt die gewählte ab */
    const vorX = await p.evaluate(LAGE);
    await p.keyboard.press('x');
    await p.waitForTimeout(500);
    const nachX = await p.evaluate((id) => {
      const z = document.querySelector('#todoArea .todo[data-id="' + id + '"]');
      return z ? z.classList.contains('done') : null;
    }, vorX.gewaehlt.id);
    pruefe('x hakt die gewählte Aufgabe ab', vorX.gewaehlt && !vorX.gewaehlt.done && nachX === true, JSON.stringify({ vorX: vorX.gewaehlt, nachX }));

    /* „Abhaken" im Detail: die nächste offene wählen und dort drücken */
    await p.keyboard.press('ArrowDown');
    await p.waitForTimeout(150);
    const vorD = await p.evaluate(LAGE);
    if (vorD.gewaehlt && !vorD.gewaehlt.done) {
      await p.evaluate(() => document.querySelector('#todoDetail [data-td="haken"]').click());
      await p.waitForTimeout(500);
      const nachD = await p.evaluate((id) => {
        const z = document.querySelector('#todoArea .todo[data-id="' + id + '"]');
        return z ? z.classList.contains('done') : null;
      }, vorD.gewaehlt.id);
      pruefe('„Abhaken" im Detail hakt die gewählte ab', nachD === true);
    } else {
      pruefe('„Abhaken" im Detail hakt die gewählte ab (braucht eine offene)', false, JSON.stringify(vorD.gewaehlt));
    }
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  /* Trefferflächen im Detail auch bei 1920 und in der Dichte „kompakt"
     (Hausregel Knöpfe: normal UND kompakt, gemessen per Hit-Test). */
  for (const [w, h] of [[1920, 1080], [1280, 800]]) {
    const p = await zuDenAufgaben(b, 'chef', w, h);
    for (const dichte of ['normal', 'kompakt']) {
      const k = await p.evaluate(async ([SRC, dichte]) => {
        const TREFFER = eval(SRC);
        document.body.dataset.dichte = dichte;
        await new Promise(r => setTimeout(r, 200));
        return [...document.querySelectorAll('#todoDetail button')].filter(x => x.getClientRects().length)
          .map(x => ({ t: x.textContent.trim().slice(0, 20), m: TREFFER(x) }));
      }, ['(' + TREFFER.toString() + ')', dichte]);
      pruefe(w + ' px, ' + dichte + ': jedes Bedienelement im Detail ≥ 44 × 44',
        k.length >= 2 && k.every(x => x.m.w >= 44 && x.m.h >= 44), JSON.stringify(k));
    }
    await p.close();
  }

  /* GEGENPROBE am Handy */
  {
    console.log('\n── Handy 390 × 844 ──');
    const p = await zuDenAufgaben(b, 'chef', 390, 844);
    const a = await p.evaluate(LAGE);
    pruefe('GEGENPROBE Handy: keine Detailspalte', !a.detailSichtbar, JSON.stringify(a));
    const gewaehlt = await p.evaluate(async () => {
      const z = [...document.querySelectorAll('#todoArea .todo')][1];
      z.querySelector('.t-title').click();
      await new Promise(r => setTimeout(r, 150));
      return !!document.querySelector('#todoArea .todo.gewaehlt');
    });
    pruefe('GEGENPROBE Handy: ein Klick auf die Zeile wählt nichts', !gewaehlt);
    pruefe('Handy: „+ Aufgabe" bleibt unten in der Daumenzone', await p.evaluate(() => !!document.querySelector('#daumenDock #todoNew')));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Aufgaben P1: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Aufgaben P1: am PC Liste und Detail, Tastatur, dichter — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
