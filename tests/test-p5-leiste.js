/* ══════════════════════════════════════════════════════════════════════
   UNTERE LEISTE NACH NUTZUNG (Runde 103, P5)

   Aus dem Betrieb, 24.9.2026: „der am meisten benutzte Bereich [ist]
   der Aufgaben- und Putzplan-Bereich und der Startbildschirm, aber der
   Chat eher wenig".

   Vorher (Demo, 390 × 844): Start · Aufgaben · Nachrichten · Alles.
   Der Putzplan war zwei Tipps entfernt (Aufgaben → Reiter Putzplan),
   die Nachrichten einer.

   Runde 184, aus dem Betrieb, 22.10.2026: „das problem mit dem zu viel
   bleibt immer noch bestehen" — zu viele Menüpunkte, man findet nichts.
   Auf Rückfrage: hinter den vier Knöpfen fehlten Ich, Team, Nachrichten
   und Verwaltung; „jede Funktion hat ihren Sinn" (nichts streichen, nur
   neu ordnen); die Raumnamen „passen". Seitdem fünf Räume, dieselben
   wie am Rechner links. Die Reihenfolge folgt weiter der Nutzung vom
   24.9.: Studio (Aufgaben und Putzplan) vor Nachrichten.

   Was dieser Durchlauf festhält:
     · unten stehen Heute · Studio · Zeiten · Plan · Nachrichten · Wissen
     · „Studio" öffnet die Aufgaben und trägt die Marke; der Putzplan ist
       der Reiter daneben (kein eigener Knopf mehr), die Marke bleibt
       auf „Studio"
     · die Nachrichten sind wieder EIN Tipp und tragen im Chat die Marke
     · eine neue Chatnachricht setzt den Punkt an „Nachrichten" —
       Ungelesenes verschwindet nicht
     · der Schnellzugriff-Vorschlag bleibt die eigene Woche, Zeiten, Geräte
     · jeder Knopf der Leiste ≥ 44 × 44 bei 320 / 390 / 430 / 820 px,
       normal und kompakt, und im Bild
     · GEGENPROBE: im bisherigen Design dieselben Räume, kein Putzplan-Knopf
   ══════════════════════════════════════════════════════════════════ */
/* Runde 236: Seit dem 23.10.2026 ist das neue Design für alle der Standard.
   Dieser Durchlauf prüft eine Funktion, kommt aber über die BISHERIGE
   Navigation dorthin. Bis er auf die neue umgestellt ist, läuft er im
   bisherigen Aussehen (kf_neu=0, der Geräteschalter des Übergangs).
   Offen als P-20 in docs/BEKANNTE-PROBLEME.md. */
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
  const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: w, height: h } });
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
  // Runde 184: Ungelesenes trägt der Knopf „Nachrichten" (g-komm), nicht mehr „Alles".
  punktKomm: !!document.querySelector('.mn-reihe [data-ndot="g-komm"].show')
});
async function tippe(p, wort) {
  await p.evaluate(w => [...document.querySelectorAll('.mn-reihe > button')].find(x => x.textContent.includes(w)).click(), wort);
  await p.waitForTimeout(700);
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  {
    /* Runde 241, aus dem Betrieb 23.10.2026 auf „Mitarbeiter unten nur Heute, Zeiten, Plan, Nachrichten?": „ja". Die Abläufe über „Studio" prüft
       dieser Durchlauf deshalb mit der Studioleitung, die alle Räume hat;
       die vier Räume der Mitarbeiter stehen gleich darunter. */
    {
      const pm = await start(b, 'mitarbeiter', 390, 844);
      const m = await pm.evaluate(LAGE);
      pruefe('Mitarbeiter: unten Heute · Zeiten · Plan · Nachrichten', m.reihe.join('|') === 'Heute|Zeiten|Plan|Nachrichten', m.reihe.join('|'));
      const szm = await pm.evaluate(() => [...document.querySelectorAll('#schnellLeiste .sz-wort')].map(x => x.textContent));
      pruefe('der Schnellzugriff-Vorschlag (Mitarbeiter): Meine Woche, Mein Kalender, Geräte',
        szm.slice(0, 3).join('|') === 'Meine Woche|Mein Kalender|Geräte', szm.join('|'));
      await pm.close();
    }
    console.log('\n── Handy 390 × 844, Studioleitung ──');
    const p = await start(b, 'leiter', 390, 844);
    const a = await p.evaluate(LAGE);
    console.log('  ' + JSON.stringify(a));
    // Runde 184: „das problem mit dem zu viel bleibt immer noch bestehen" — fünf Räume.
    /* Runde 222 (23.10.2026): „Zeiten" bekommt einen eigenen Knopf —
       aus dem Betrieb auf die Rückfrage: „eigener knopf". */
    pruefe('unten stehen Heute · Studio · Zeiten · Plan · Nachrichten · Wissen',
      a.reihe.join('|') === 'Heute|Studio|Zeiten|Plan|Nachrichten|Wissen', a.reihe.join('|'));

    await tippe(p, 'Studio');
    const au = await p.evaluate(LAGE);
    pruefe('„Studio" öffnet die Aufgaben und trägt die Marke', au.ansicht === 'view-todos' && au.aktiv.join('|') === 'Studio',
      JSON.stringify(au));
    /* Runde 184: kein eigener Putzplan-Knopf mehr — er ist der Reiter
       neben den Aufgaben. */
    await p.evaluate(() => document.querySelector('[data-subview="putzplan"]').click());
    await p.waitForTimeout(700);
    const pz = await p.evaluate(LAGE);
    pruefe('„Studio" → Reiter „Putzplan" öffnet den Putzplan', pz.ansicht === 'view-putzplan', pz.ansicht);
    pruefe('… und die Marke bleibt auf „Studio"', pz.aktiv.join('|') === 'Studio', pz.aktiv.join('|'));
    pruefe('kein eigener Putzplan-Knopf mehr', await p.evaluate(() => !document.querySelector('[data-group="g-putz"]')));

    /* Nachrichten: seit Runde 184 wieder ein Tipp. */
    await tippe(p, 'Nachrichten');
    const ch = await p.evaluate(LAGE);
    pruefe('die Nachrichten sind mit einem Tipp da', ch.ansicht === 'view-chat', ch.ansicht);
    pruefe('im Chat trägt „Nachrichten" die Marke', ch.aktiv.join('|') === 'Nachrichten', ch.aktiv.join('|'));

    /* Ungelesenes: zurück auf „Heute", dann schreibt jemand. */
    await tippe(p, 'Heute');
    const vorher = (await p.evaluate(LAGE)).punktKomm;
    /* Der Chat hat oben „allgemein" geöffnet; sein Horcher läuft weiter. */
    await p.evaluate(async () => {
      await firebase.firestore().collection('firmen').doc('koerperformen').collection('channels')
        .doc('allgemein').collection('messages')
        .add({ uid: 'jemand-anders', name: 'Juna Ritter', text: 'Kann jemand morgen früher?', ts: Date.now() + 5 });
    });
    await p.waitForTimeout(600);
    const nachher = (await p.evaluate(LAGE)).punktKomm;
    pruefe('eine neue Chatnachricht setzt den Punkt an „Nachrichten"', !vorher && nachher, JSON.stringify({ vorher, nachher }));

    /* Schnellzugriffe: der Vorschlag für Mitarbeiter ist unverändert —
       Runde 184 hat die Wahl nicht angefasst, nur die Stelle. */
    const sz = await p.evaluate(() => [...document.querySelectorAll('#schnellLeiste .sz-wort')].map(x => x.textContent));
    /* Seit Runde 222 liegt „Meine Zeiten" unten als eigener Knopf; als
       Schnellzugriff wäre es ein zweiter Weg an dieselbe Stelle (wie der
       Putzplan seit P5). An seinen Platz rückt „Mein Kalender". */
    /* Seit Runde 241 läuft dieser Teil mit der Studioleitung; deren
       Vorschlag ist Schichtplan · Anliegen · Meine Woche (SCHNELL_VORSCHLAG).
       Den der Mitarbeiter prüft der Block „Mitarbeiter" oben. */
    pruefe('der Schnellzugriff-Vorschlag (Studioleitung): Schichtplan, Anliegen, Meine Woche',
      sz.slice(0, 3).join('|') === 'Schichtplan|Anliegen|Meine Woche', sz.join('|'));
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
      // Runde 184: fünf Räume statt vier Knöpfe (siehe oben).
      pruefe(w + ' px, ' + dichte + ': sechs Knöpfe, jeder ≥ 44 × 44 und im Bild',
        k.length === 6 && k.every(x => x.m.w >= 44 && x.m.h >= 44 && x.imBild), JSON.stringify(k));
    }
    pruefe(w + ' px ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  /* ── GEGENPROBE bisheriges Design ── */
  {
    const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript({ path: __dirname + '/stub-mitarbeiter.js' });
    await p.addInitScript(() => { try { localStorage.setItem('kf_neu', '0'); } catch (e) {} });
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    const a = await p.evaluate(() => ({ neu: document.body.classList.contains('neu'),
      gruppen: [...document.querySelectorAll('.mobnav button')].map(x => x.dataset.group) }));
    // Runde 184: auch im bisherigen Design dieselben Räume — seit Runde 222 sechs („eigener knopf").
    pruefe('GEGENPROBE bisheriges Design: dieselben sechs Räume, kein Putzplan-Knopf',
      a.neu === false && a.gruppen.join('|') === 'g-start|g-arbeit|g-zeit|g-team|g-komm|g-wissen' &&
      a.gruppen.indexOf('g-putz') < 0, JSON.stringify(a));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Leiste P5: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Leiste P5: Heute · Studio · Zeiten · Plan · Nachrichten · Wissen, Putzplan unter Studio, Ungelesenes sichtbar — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
