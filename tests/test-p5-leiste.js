/* ══════════════════════════════════════════════════════════════════════
   UNTERE LEISTE NACH NUTZUNG (Runde 103, P5)

   Aus dem Betrieb, 24.9.2026: „der am meisten benutzte Bereich [ist]
   der Aufgaben- und Putzplan-Bereich und der Startbildschirm, aber der
   Chat eher wenig".

   Vorher (Demo, 390 × 844): Start · Aufgaben · Nachrichten · Alles.
   Der Putzplan war zwei Tipps entfernt (Aufgaben → Reiter Putzplan),
   die Nachrichten einer.

   Was dieser Durchlauf festhält:
     · unten stehen Start · Aufgaben · Putzplan · Alles
     · „Putzplan" öffnet den Putzplan mit einem Tipp und trägt die Marke
     · die Nachrichten sind über „Alles" in zwei Tipps da; im Chat trägt
       „Alles" die Marke
     · eine neue Chatnachricht setzt den Punkt an „Alles" — Ungelesenes
       verschwindet nicht hinter der Liste
     · die Schnellzugriffe schlagen den Putzplan nicht mehr vor (er steht
       jetzt unten), sondern die eigene Woche
     · jeder Knopf der Leiste ≥ 44 × 44 bei 320 / 390 / 430 / 820 px,
       normal und kompakt, und im Bild
     · GEGENPROBE: im bisherigen Design bleibt die Leiste, wie sie war
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
async function start(b, rolle, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  await p.waitForTimeout(800);
  return p;
}
const LAGE = () => ({
  reihe: [...document.querySelectorAll('.mn-reihe > button')].map(x => x.querySelector('span:not(.badge):not(.ndot)').textContent.trim()),
  aktiv: [...document.querySelectorAll('.mn-reihe > button.active')].map(x => x.querySelector('span:not(.badge):not(.ndot)').textContent.trim()),
  ansicht: (document.querySelector('.view.show') || {}).id,
  punktAlles: !!document.querySelector('.mn-reihe [data-ndot="g-alles"].show')
});
async function tippe(p, wort) {
  await p.evaluate(w => [...document.querySelectorAll('.mn-reihe > button')].find(x => x.textContent.includes(w)).click(), wort);
  await p.waitForTimeout(700);
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  {
    console.log('\n── Handy 390 × 844, Mitarbeiter ──');
    const p = await start(b, 'mitarbeiter', 390, 844);
    const a = await p.evaluate(LAGE);
    console.log('  ' + JSON.stringify(a));
    pruefe('unten stehen Start · Aufgaben · Putzplan · Alles', a.reihe.join('|') === 'Start|Aufgaben|Putzplan|Alles', a.reihe.join('|'));

    await tippe(p, 'Putzplan');
    const pz = await p.evaluate(LAGE);
    pruefe('„Putzplan" öffnet den Putzplan mit einem Tipp', pz.ansicht === 'view-putzplan', pz.ansicht);
    pruefe('… und trägt die Marke, nicht „Aufgaben"', pz.aktiv.join('|') === 'Putzplan', pz.aktiv.join('|'));
    await tippe(p, 'Aufgaben');
    const au = await p.evaluate(LAGE);
    pruefe('„Aufgaben" öffnet die Aufgaben und trägt die Marke', au.ansicht === 'view-todos' && au.aktiv.join('|') === 'Aufgaben',
      JSON.stringify(au));

    /* Nachrichten: zwei Tipps über „Alles". */
    await tippe(p, 'Alles');
    await p.evaluate(() => document.querySelector('#allesSeite [data-alles="chat"]').click());
    await p.waitForTimeout(900);
    const ch = await p.evaluate(LAGE);
    pruefe('die Nachrichten sind über „Alles" in zwei Tipps da', ch.ansicht === 'view-chat', ch.ansicht);
    pruefe('im Chat trägt „Alles" die Marke', ch.aktiv.join('|') === 'Alles', ch.aktiv.join('|'));

    /* Ungelesenes: zurück zur Startseite, dann schreibt jemand. */
    await tippe(p, 'Start');
    const vorher = (await p.evaluate(LAGE)).punktAlles;
    /* Der Chat hat oben „allgemein" geöffnet; sein Horcher läuft weiter. */
    await p.evaluate(async () => {
      await firebase.firestore().collection('firmen').doc('koerperformen').collection('channels')
        .doc('allgemein').collection('messages')
        .add({ uid: 'jemand-anders', name: 'Juna Ritter', text: 'Kann jemand morgen früher?', ts: Date.now() + 5 });
    });
    await p.waitForTimeout(600);
    const nachher = (await p.evaluate(LAGE)).punktAlles;
    pruefe('eine neue Chatnachricht setzt den Punkt an „Alles"', !vorher && nachher, JSON.stringify({ vorher, nachher }));

    /* Schnellzugriffe: der Vorschlag nennt den Putzplan nicht mehr. */
    const sz = await p.evaluate(() => [...document.querySelectorAll('#schnellLeiste .sz-wort')].map(x => x.textContent));
    pruefe('der Schnellzugriff-Vorschlag: Meine Woche, Meine Zeiten, Geräte (Putzplan steht unten)',
      sz.slice(0, 3).join('|') === 'Meine Woche|Meine Zeiten|Geräte', sz.join('|'));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  /* ── Trefferflächen der Leiste ── */
  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180]]) {
    const p = await start(b, 'chef', w, h);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.waitForTimeout(200);
      const k = await p.evaluate((SRC) => {
        const TREFFER = eval(SRC);
        return [...document.querySelectorAll('.mn-reihe > button')].map(x => {
          const r = x.getBoundingClientRect();
          return { t: x.textContent.trim().slice(0, 12), m: TREFFER(x), imBild: r.left >= 0 && r.right <= innerWidth + .5 };
        });
      }, '(' + TREFFER.toString() + ')');
      pruefe(w + ' px, ' + dichte + ': vier Knöpfe, jeder ≥ 44 × 44 und im Bild',
        k.length === 4 && k.every(x => x.m.w >= 44 && x.m.h >= 44 && x.imBild), JSON.stringify(k));
    }
    pruefe(w + ' px ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  /* ── GEGENPROBE bisheriges Design ── */
  {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript({ path: __dirname + '/stub-mitarbeiter.js' });
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    const a = await p.evaluate(() => ({ neu: document.body.classList.contains('neu'),
      gruppen: [...document.querySelectorAll('.mobnav button')].map(x => x.dataset.group) }));
    pruefe('GEGENPROBE bisheriges Design: Nachrichten bleiben unten, kein Putzplan-Knopf',
      a.neu === false && a.gruppen.indexOf('g-komm') >= 0 && a.gruppen.indexOf('g-putz') < 0, JSON.stringify(a));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Leiste P5: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Leiste P5: Start · Aufgaben · Putzplan · Alles, Nachrichten über „Alles", Ungelesenes sichtbar — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
