/* ══════════════════════════════════════════════════════════════════════
   SEITENLEISTE AM PC NACH NUTZUNG (Runde 103, P4)

   Aus dem Betrieb, 24.9.2026: „der am meisten benutzte Bereich [ist]
   der Aufgaben- und Putzplan-Bereich und der Startbildschirm, aber der
   Chat eher wenig" — und: „genau so viel Fokus auf die PC-Nutzung".

   Vorher (Demo, 1440 × 900): Seitenleiste Start · Ich · Nachrichten ·
   Aufgaben · …; der Putzplan nur als dritter Reiter hinter „Aufgaben"
   (zwei Klicks). Die Schnellzugriffe standen am PC unten auf der
   Startseite in einer 600 px schmalen Reihe und nahmen der Liste 86 px.

   Runde 184, aus dem Betrieb, 22.10.2026: „das problem mit dem zu viel
   bleibt immer noch bestehen" — zu viele Menüpunkte, zu viel auf einem
   Bildschirm, man findet nichts; „jede Funktion hat ihren Sinn" (nichts
   streichen, nur neu ordnen); die Raumnamen „passen". Seitdem stehen
   links dieselben fünf Räume wie am Handy unten, für die Leitung die
   Verwaltung dazu. Der eigene Putzplan-Knopf ist wieder Reiter unter
   „Studio", „Alles" liegt hinter dem ☰-Griff am Seitenkopf. Die Schnellzugriffe
   bleiben links, abgesetzt unter den Räumen.

   Was dieser Durchlauf festhält:
     · Reihenfolge Heute, Studio, Zeiten, Plan, Nachrichten, Wissen, (Verwaltung)
       — Studio vor Nachrichten, weiter nach Nutzung
     · „Studio" öffnet die Aufgaben und trägt die Marke; der Putzplan ist
       der Reiter daneben, und auch dort trägt „Studio" die Marke
     · die Schnellzugriffe stehen in der Seitenleiste (Vorschlag je
       Rolle), führen hin, „Anpassen" öffnet die Wahl; eine geänderte
       Wahl steht sofort in der Leiste
     · unten auf der Startseite stehen sie am PC nicht
     · jedes Bedienelement der Seitenleiste ≥ 44 × 44 bei 1100/1280/
       1366/1440/1920, normal und kompakt (Hit-Test), und erreichbar
     · GEGENPROBEN: am Handy bleiben die Schnellzugriffe unten; im
       bisherigen Design dieselben Räume, ohne Putzplan-Knopf und ohne
       Schnellzugriffe
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
const LEISTE = () => ({
  reihe: [...document.querySelectorAll('#side > button')].map(x => x.textContent.replace(/\d+/g, '').trim()),
  schnell: [...document.querySelectorAll('#side .side-schnell .ss-knopf')].map(x => x.textContent.trim()),
  aktiv: [...document.querySelectorAll('#side > button.active')].map(x => x.textContent.replace(/\d+/g, '').trim()),
  ansicht: (document.querySelector('.view.show') || {}).id
});
async function klick(p, sel, text) {
  await p.evaluate(([sel, text]) => [...document.querySelectorAll(sel)].find(x => x.textContent.trim().startsWith(text)).click(), [sel, text]);
  await p.waitForTimeout(700);
}
async function trefferSeite(p) {
  return p.evaluate(async (SRC) => {
    const TREFFER = eval(SRC);
    const out = [];
    for (const x of [...document.querySelectorAll('#side button')].filter(x => x.getClientRects().length)) {
      x.scrollIntoView({ block: 'nearest' });
      await new Promise(r => requestAnimationFrame(r));
      out.push({ t: x.textContent.trim().slice(0, 16), m: TREFFER(x) });
    }
    return out.filter(x => !(x.m.w >= 44 && x.m.h >= 44));
  }, '(' + TREFFER.toString() + ')');
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  /* ── Chef 1440 ── */
  {
    console.log('\n── PC 1440 × 900, Chef ──');
    const p = await start(b, 'chef', 1440, 900);
    const a = await p.evaluate(LEISTE);
    console.log('  ' + JSON.stringify(a));
    // Runde 184: „das problem mit dem zu viel bleibt immer noch bestehen" — fünf Räume plus Verwaltung.
    /* Runde 222 (23.10.2026): „Zeiten" als eigener Raum direkt hinter
       „Studio" — aus dem Betrieb auf die Rückfrage: „eigener knopf". */
    pruefe('Reihenfolge nach Nutzung: Heute, Studio, Zeiten, Plan, Nachrichten, Wissen, Verwaltung',
      a.reihe.join('|') === 'Heute|Studio|Zeiten|Plan|Nachrichten|Wissen|Verwaltung', a.reihe.join('|'));
    pruefe('Schnellzugriffe in der Seitenleiste (Vorschlag Chef) und „Anpassen"',
      a.schnell.join('|') === 'Überblick|Schichtplan|Anliegen|Anpassen', a.schnell.join('|'));
    const unten = await p.evaluate(() => {
      const z = document.getElementById('schnellLeiste');
      const sa = document.querySelector('#view-home .scroll-area');
      return { sichtbar: !!(z && z.getClientRects().length), hoehe: sa.clientHeight };
    });
    pruefe('unten auf der Startseite stehen sie am PC nicht mehr', !unten.sichtbar, JSON.stringify(unten));
    pruefe('die Liste der Startseite ist dadurch höher (vorher 619 px)', unten.hoehe >= 690, String(unten.hoehe));

    /* Runde 184: kein eigener Putzplan-Knopf mehr. Der Weg: „Studio" →
       Reiter „Putzplan"; die Marke bleibt dabei auf „Studio". */
    await klick(p, '#side > button', 'Studio');
    const au = await p.evaluate(LEISTE);
    pruefe('„Studio" öffnet die Aufgaben und trägt die Marke', au.ansicht === 'view-todos' && au.aktiv.join('|') === 'Studio',
      JSON.stringify(au));
    await klick(p, '[data-subview]', 'Putzplan');
    const pz = await p.evaluate(LEISTE);
    pruefe('„Studio" → Reiter „Putzplan" öffnet den Putzplan', pz.ansicht === 'view-putzplan', pz.ansicht);
    pruefe('… und die Marke bleibt auf „Studio"', pz.aktiv.join('|') === 'Studio', pz.aktiv.join('|'));
    const keinKnopf = await p.evaluate(() => !document.querySelector('[data-group="g-putz"]'));
    pruefe('kein eigener Putzplan-Knopf mehr', keinKnopf);

    await klick(p, '#side .ss-knopf', 'Schichtplan');
    const sp = await p.evaluate(() => ({ ansicht: document.querySelector('.view.show').id,
      reiter: (document.querySelector('[data-teamtab].on, [data-teamtab].active') || { getAttribute: () => null }).getAttribute('data-teamtab') }));
    pruefe('ein Schnellzugriff führt hin (Schichtplan → Plan, Reiter Schichtplan)',
      sp.ansicht === 'view-team' && sp.reiter === 'schicht', JSON.stringify(sp));

    await klick(p, '#side .ss-knopf', 'Anpassen');
    const wahl = await p.evaluate(() => ({ offen: document.getElementById('schnellModal').classList.contains('show'),
      hinweis: document.getElementById('schnellHinweis').textContent }));
    pruefe('„Anpassen" öffnet die Wahl, der Hinweis nennt die Seitenleiste', wahl.offen && /Seitenleiste/.test(wahl.hinweis),
      JSON.stringify(wahl));
    /* Einen Eintrag lösen: die Leiste folgt sofort. */
    await p.evaluate(() => document.querySelector('#schnellListe .kn-zeile.an').click());
    await p.waitForTimeout(300);
    const nach = await p.evaluate(LEISTE);
    pruefe('eine geänderte Wahl steht sofort in der Seitenleiste', nach.schnell.length === 3 && nach.schnell[2] === 'Anpassen',
      nach.schnell.join('|'));
    await p.evaluate(() => { document.getElementById('schnellVorschlag').click(); document.getElementById('schnellFertig').click(); });
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  /* ── Mitarbeiter 1280 × 720 und die Trefferflächen ── */
  for (const [rolle, w, h] of [['mitarbeiter', 1280, 720], ['chef', 1100, 800], ['leiter', 1366, 768], ['chef', 1440, 900], ['chef', 1920, 1080]]) {
    console.log('\n── PC ' + w + ' × ' + h + ', ' + rolle + ' ──');
    const p = await start(b, rolle, w, h);
    const a = await p.evaluate(LEISTE);
    if (rolle === 'mitarbeiter')
      // Runde 184: dieselben fünf Räume wie am Handy, ohne Verwaltung.
      pruefe('Mitarbeiter: Heute, Studio, Zeiten, Plan, Nachrichten, Wissen',
        a.reihe.join('|') === 'Heute|Studio|Zeiten|Plan|Nachrichten|Wissen', a.reihe.join('|'));
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.waitForTimeout(200);
      const k = await trefferSeite(p);
      pruefe(w + ' × ' + h + ', ' + dichte + ': jedes Bedienelement der Seitenleiste ≥ 44 × 44 und erreichbar',
        !k.length, JSON.stringify(k));
    }
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  /* ── GEGENPROBE Handy ── */
  {
    console.log('\n── Handy 390 × 844 ──');
    const p = await start(b, 'mitarbeiter', 390, 844);
    const h = await p.evaluate(() => ({
      unten: !!document.getElementById('schnellLeiste').getClientRects().length,
      seite: !!(document.querySelector('.side-schnell') || { getClientRects: () => [] }).getClientRects().length
    }));
    pruefe('GEGENPROBE Handy: Schnellzugriffe bleiben unten, keine in einer Seitenleiste', h.unten && !h.seite, JSON.stringify(h));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  /* ── GEGENPROBE bisheriges Design ── */
  {
    console.log('\n── bisheriges Design, 1440 ──');
    const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: 1440, height: 900 } });
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript({ path: __dirname + '/stub-mitarbeiter.js' });
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    const a = await p.evaluate(() => ({ neu: document.body.classList.contains('neu'),
      reihe: [...document.querySelectorAll('#side > button')].map(x => x.dataset.group),
      schnell: !!document.querySelector('.side-schnell') }));
    /* Runde 184: auch im bisherigen Design dieselben fünf Räume (die
       untere Leiste und die Seitenleiste lesen dieselben NAVGROUPS). */
    pruefe('GEGENPROBE bisheriges Design: dieselben Räume, kein Putzplan-Knopf, keine Schnellzugriffe',
      a.neu === false && a.reihe.join('|') === 'g-start|g-arbeit|g-zeit|g-team|g-komm|g-wissen' &&
      a.reihe.indexOf('g-putz') < 0 && !a.schnell, JSON.stringify(a));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Seitenleiste P4: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Seitenleiste P4: fünf Räume nach Nutzung, Putzplan unter Studio, Schnellzugriffe links — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
