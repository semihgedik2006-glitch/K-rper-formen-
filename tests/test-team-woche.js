/* ══════════════════════════════════════════════════════════════════════
   TEAM: DIE SEITE BLEIBT STEHEN, HEUTE STEHT TROTZDEM OBEN (P-12)

   „Team-Seite springt beim Öffnen nach unten" — seit langem in
   docs/BEKANNTE-PROBLEME.md, am 24.9.2026 aus dem Betrieb freigegeben
   („die aufgaben kannst du in deiner reihenfolge machen").

   Der Sprung war gewollt: zwei Zeitgeber rollten die Seite zum
   heutigen Tag, gemessen 218 px bei der Leitung am Handy. Dabei
   verschwand oben „Wartet auf deine Entscheidung". Jetzt:
   1. Nach dem Öffnen steht die Seite still (scrollTop bleibt 0), und
      „Wartet auf deine Entscheidung" ist im Bild.
   2. Heute ist trotzdem zu sehen: am Handy stehen die vergangenen Tage
      der laufenden Woche in EINER Zeile, ein Tipp klappt sie auf.
      Gegenprobe: in der nächsten Woche gibt es diese Zeile nicht.
   3. Am Rechner (ab 1.100 px) steht die Woche in sieben Spalten
      nebeneinander — alle sieben Tage auf gleicher Höhe.
   4. Jeder Knopf im Schichtplan ≥ 44 × 44 (elementFromPoint), bei
      320 bis 1920 px, normal und kompakt. Das ✕ an einer Schicht war
      vorher gut 28 × 20.

   Hängt am Wochentag: ist heute Montag, gibt es keine vergangenen Tage
   — dann prüft der Durchlauf, dass es auch keine Zeile dafür gibt.
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
/* Wie viele Tage dieser Woche schon vorbei sind (Montag = 0). */
const VERGANGEN = (new Date().getDay() + 6) % 7;

async function oeffne(b, rolle, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  await p.evaluate(() => [...document.querySelectorAll('.mobnav [data-group], #side [data-group]')]
    .find(x => /Team/.test(x.textContent)).click());
  await p.waitForTimeout(1600);
  return p;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── Die Seite bleibt stehen ──');
  for (const rolle of ['chef', 'mitarbeiter']) {
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      const p = await oeffne(b, rolle, w, h);
      const r = await p.evaluate(() => {
        const sa = document.querySelector('#view-team .scroll-area');
        const heute = document.querySelector('#shiftGrid .shift-day.today');
        const wartet = document.getElementById('teamWartet');
        const f = sa.getBoundingClientRect();
        const k = heute ? heute.getBoundingClientRect() : null;
        return {
          scroll: Math.round(sa.scrollTop),
          heuteKopfImBild: !!k && k.top >= f.top && k.top + 40 <= f.bottom,
          wartetImBild: !!wartet && wartet.style.display !== 'none' &&
            wartet.getBoundingClientRect().top >= f.top - 1,
          wartetDa: !!wartet && wartet.style.display !== 'none'
        };
      });
      const wo = (rolle === 'chef' ? 'Leitung' : 'Mitarbeiter') + ', ' + w + ' px';
      pruefe(wo + ': nach dem Öffnen rollt nichts (scrollTop ' + r.scroll + ')', r.scroll === 0);
      pruefe(wo + ': der heutige Tag steht trotzdem im Bild', r.heuteKopfImBild);
      if (r.wartetDa) pruefe(wo + ': „Wartet auf deine Entscheidung" bleibt oben im Bild', r.wartetImBild);
      pruefe(wo + ': ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
      await p.close();
    }
  }

  console.log('\n── Die vergangenen Tage am Handy ──');
  {
    const p = await oeffne(b, 'chef', 390, 844);
    const z = await p.evaluate(() => {
      const k = document.querySelector('[data-shvergangen]');
      const sichtbar = [...document.querySelectorAll('#shiftGrid .shift-day')].filter(d => d.offsetParent).length;
      return { da: !!k, text: k ? k.textContent : '', sichtbar };
    });
    if (VERGANGEN) {
      pruefe('eine Zeile fasst die ' + VERGANGEN + ' vergangenen Tage zusammen',
        z.da && /Mo \d\d\.\d\d\./.test(z.text) && /Schicht/.test(z.text), z.text);
      pruefe('zu sehen sind nur heute und die kommenden Tage', z.sichtbar === 7 - VERGANGEN, String(z.sichtbar));
      const auf = await p.evaluate(async () => {
        document.querySelector('[data-shvergangen]').click();
        await new Promise(r => setTimeout(r, 300));
        const k = document.querySelector('[data-shvergangen]');
        return { sichtbar: [...document.querySelectorAll('#shiftGrid .shift-day')].filter(d => d.offsetParent).length,
                 text: k.textContent, aria: k.getAttribute('aria-expanded') };
      });
      pruefe('ein Tipp klappt sie auf — alle sieben Tage', auf.sichtbar === 7 && /Ausblenden/.test(auf.text) && auf.aria === 'true',
        JSON.stringify(auf));
      await p.evaluate(() => document.querySelector('[data-shvergangen]').click());
      await p.waitForTimeout(300);
    } else {
      pruefe('heute ist Montag: keine Zeile für vergangene Tage', !z.da);
    }
    /* GEGENPROBE: in der nächsten Woche ist nichts vergangen. */
    const naechste = await p.evaluate(async () => {
      document.getElementById('shiftNext').click();
      await new Promise(r => setTimeout(r, 300));
      const r = { zeile: !!document.querySelector('[data-shvergangen]'),
        sichtbar: [...document.querySelectorAll('#shiftGrid .shift-day')].filter(d => d.offsetParent).length };
      document.getElementById('shiftToday').click();
      return r;
    });
    pruefe('GEGENPROBE nächste Woche: keine Zusammenfassung, alle sieben Tage', !naechste.zeile && naechste.sichtbar === 7,
      JSON.stringify(naechste));
    await p.close();
  }

  console.log('\n── Am Rechner: sieben Spalten ──');
  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, 'chef', w, h);
    const r = await p.evaluate(() => {
      const tage = [...document.querySelectorAll('#shiftGrid .shift-day')];
      const tops = tage.map(d => Math.round(d.getBoundingClientRect().top));
      return { zahl: tage.filter(d => d.offsetParent).length, gleich: new Set(tops).size === 1,
               zeile: !!document.querySelector('[data-shvergangen]') && document.querySelector('[data-shvergangen]').offsetParent !== null,
               quer: document.documentElement.scrollWidth - innerWidth };
    });
    pruefe(w + ' px: alle sieben Tage nebeneinander', r.zahl === 7 && r.gleich, JSON.stringify(r));
    pruefe(w + ' px: dort keine Zusammenfassung, nichts ragt hinaus', !r.zeile && r.quer <= 0, JSON.stringify(r));
    await p.close();
  }

  console.log('\n── Trefferflächen im Schichtplan ──');
  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, 'chef', w, h);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const aus = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const k = document.querySelector('[data-shvergangen]');
        if (k && k.offsetParent && k.getAttribute('aria-expanded') !== 'true') k.click();
        await new Promise(r => setTimeout(r, 200));
        const els = [...document.querySelectorAll('#teamPaneSchicht button')].filter(e => e.offsetParent);
        const zu = [];
        for (const el of els) {
          el.scrollIntoView({ block: 'center' });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el);
          if (m.w < 44 || m.h < 44) zu.push((el.textContent.trim() || el.className).slice(0, 20) + ' ' + m.w + '×' + m.h);
        }
        const k2 = document.querySelector('[data-shvergangen]');
        if (k2 && k2.getAttribute('aria-expanded') === 'true') k2.click();
        return { zahl: els.length, zu };
      }, TREFFER.toString());
      pruefe(w + ' px, ' + dichte + ': jeder Knopf ≥ 44 × 44 (' + aus.zahl + ' gemessen)', aus.zahl >= 4 && !aus.zu.length,
        aus.zu.slice(0, 4).join(', '));
    }
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Team-Woche: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Team-Woche: die Seite springt nicht, heute steht oben, am Rechner sieben Spalten — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
