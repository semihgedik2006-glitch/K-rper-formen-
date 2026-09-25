/* ══════════════════════════════════════════════════════════════════════
   EINE REGEL FÜR DATUM UND UHRZEIT (Design-Ideen, Punkt 28)

   Aus dem Betrieb, 25.9.2026: „mach weiter mit design sachen". Punkt 28
   der Design-Ideen: „Startseite: ‚heute 21:10 Uhr'. Chat: ‚21:10'.
   Übergabe: ‚heute 22:10 Uhr'. Drei Schreibweisen für dieselbe Sache."

   Teil A rechnet die Funktionen selbst nach — aus index.html gelesen,
   nicht abgeschrieben:
     · Uhrzeit zweistellig, ohne „Uhr"
     · heute / gestern als Wort, sonst 05.08., ein anderes Jahr mit Jahr
     · Listen: heute nur die Uhrzeit
     · Ablaufdaten immer mit Jahr und führender Null (vorher „5.8.2026")
     · „gestern" auch über die Zeitumstellung hinweg

   Teil B sieht in der laufenden App nach (Demo, fünf Ansichten, Handy
   und Rechner): kein Zeitstempel mehr mit „Uhr", kein Datum ohne
   führende Null, keine Sekunden. Nachrichtentexte zählen nicht — dort
   darf jemand „ab 18:00 Uhr" schreiben.
   ══════════════════════════════════════════════════════════════════ */
/* Die Uhr dieser Umgebung läuft in UTC — ohne Zeitumstellung wäre die
   Probe dazu unten wertlos. Also Berliner Zeit, wie im Studio. */
process.env.TZ = 'Europe/Berlin';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

/* ── Teil A: die Funktionen aus der Datei ───────────────────────────── */
const html = fs.readFileSync(process.env.INDEX || path.join(__dirname, '..', 'index.html'), 'utf8');
function holeFunktion(name) {
  const start = html.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Funktion fehlt: ' + name);
  let tiefe = 0, i = html.indexOf('{', start);
  for (; i < html.length; i++) {
    if (html[i] === '{') tiefe++;
    else if (html[i] === '}' && --tiefe === 0) break;
  }
  return html.slice(start, i + 1);
}
const quelle = ['zweistellig', 'fmtUhr', 'fmtTag', 'tagWort', 'fmtDateTime', 'fmtTime', 'fmtStand', 'dayLabel']
  .map(holeFunktion).join('\n');
const F = new Function(quelle + '; return {fmtUhr, fmtTag, fmtDateTime, fmtTime, fmtStand, dayLabel};')();

console.log('\n── A: die Regel, nachgerechnet ──');
{
  const jetzt = new Date();
  const j = jetzt.getFullYear();
  const heute905 = new Date(j, jetzt.getMonth(), jetzt.getDate(), 9, 5).getTime();
  const gestern1430 = new Date(j, jetzt.getMonth(), jetzt.getDate() - 1, 14, 30).getTime();
  const alt = new Date(2024, 7, 5, 21, 10).getTime();            // 05.08.2024 21:10

  pruefe('Uhrzeit zweistellig, ohne „Uhr": 09:05', F.fmtUhr(heute905) === '09:05', F.fmtUhr(heute905));
  pruefe('Zeitpunkt heute: „heute 09:05"', F.fmtDateTime(heute905) === 'heute 09:05', F.fmtDateTime(heute905));
  pruefe('Zeitpunkt gestern: „gestern 14:30"', F.fmtDateTime(gestern1430) === 'gestern 14:30', F.fmtDateTime(gestern1430));
  pruefe('anderes Jahr: „05.08.2024 21:10"', F.fmtDateTime(alt) === '05.08.2024 21:10', F.fmtDateTime(alt));
  pruefe('in Listen heute nur die Uhrzeit: „09:05"', F.fmtTime(heute905) === '09:05', F.fmtTime(heute905));
  pruefe('in Listen gestern mit Wort: „gestern 14:30"', F.fmtTime(gestern1430) === 'gestern 14:30', F.fmtTime(gestern1430));

  /* Ein Tag im laufenden Jahr, der weder heute noch gestern ist. Am
     1. und 2. Januar gäbe es keinen — dann entfällt die Probe, statt
     etwas Falsches zu prüfen. */
  const tag = new Date(j, 0, 3, 8, 0);
  if (tag.getTime() < new Date(j, jetzt.getMonth(), jetzt.getDate() - 1).getTime()) {
    pruefe('im laufenden Jahr ohne Jahr: „03.01. 08:00"', F.fmtDateTime(tag.getTime()) === '03.01. 08:00', F.fmtDateTime(tag.getTime()));
  }
  pruefe('Ablaufdatum immer mit Jahr und Null: „05.08.2024" (vorher „5.8.2024")', F.fmtTag(new Date(2024, 7, 5), true) === '05.08.2024');
  pruefe('fmtTag kurz, laufendes Jahr: ohne Jahr', F.fmtTag(new Date(j, 10, 9)) === '09.11.', F.fmtTag(new Date(j, 10, 9)));
  pruefe('„Stand" ohne Sekunden: „05.08.2024 21:10"', F.fmtStand(alt) === '05.08.2024 21:10', F.fmtStand(alt));
  pruefe('leer bleibt leer', F.fmtDateTime(0) === '' && F.fmtTime(null) === '' && F.fmtTag('') === '');

  /* Die Zeitumstellung: am 26./27. Oktober hat ein Tag 25 Stunden.
     „heute − 86.400.000" träfe dann den falschen Tag. Nachgestellt mit
     einer festen Uhr. */
  const Echt = Date;
  function mitUhr(jetztMs, fn) {
    global.Date = class extends Echt {
      constructor(...a) { if (!a.length) super(jetztMs); else super(...a); }
      static now() { return jetztMs; }
    };
    try { return fn(); } finally { global.Date = Echt; }
  }
  const G = mitUhr(0, () => new Function(quelle + '; return {fmtDateTime, dayLabel};')());
  const nachUmstellung = new Echt(2026, 9, 26, 0, 30).getTime();   // Mo 26.10. 00:30, Nacht davor 25 h lang
  const vortagFrueh = new Echt(2026, 9, 25, 0, 10).getTime();      // So 25.10. 00:10
  const r = mitUhr(nachUmstellung, () => G.fmtDateTime(vortagFrueh));
  pruefe('„gestern" auch über die Zeitumstellung (So 00:10, gesehen Mo 00:30)', r === 'gestern 00:10', r);
  const tl = mitUhr(nachUmstellung, () => G.dayLabel(vortagFrueh));
  pruefe('der Chat-Trenner sagt dann ebenfalls „Gestern"', tl === 'Gestern', tl);
  const alterTrenner = mitUhr(nachUmstellung, () => G.dayLabel(new Echt(2026, 9, 20, 12, 0).getTime()));
  pruefe('ein älterer Trenner: Wochentag und Tag, im laufenden Jahr ohne Jahr („Di. 20.10.")', alterTrenner === 'Di. 20.10.', alterTrenner);
}

/* ── Teil B: in der laufenden App ───────────────────────────────────── */
async function oeffne(b, w, h, rolle) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
async function zu(p, v) {
  if (v !== 'home') {
    await p.evaluate(() => { const a = document.querySelector('#side [data-group="g-alles"], .mobnav [data-group="g-alles"]'); if (a) a.click(); });
    await p.waitForTimeout(500);
  }
  await p.evaluate((v) => {
    const k = v === 'home'
      ? document.querySelector('.mobnav [data-group="g-start"], #side [data-group="g-start"]')
      : document.querySelector('#allesLadeInhalt [data-alles="' + v + '"], #allesSeite [data-alles="' + v + '"]');
    if (k) k.click();
  }, v);
  await p.waitForTimeout(1000);
}
/* Sichtbarer Text der offenen Ansicht, ohne das, was Menschen
   geschrieben haben (Nachrichten, Übergaben, Notizen, Eingabefelder). */
const sichtText = (p) => p.evaluate(() => {
  const v = document.querySelector('.view.active') || document.body;
  const klon = v.cloneNode(true);
  klon.querySelectorAll('.body, .ho-text, .bb-text, .ann-text, .pp-note-text, textarea, input, script, style, .t-desc, .anl-text')
    .forEach(e => e.remove());
  document.body.appendChild(klon); klon.style.position = 'absolute'; klon.style.left = '-99999px';
  const t = klon.innerText; klon.remove();
  return t;
});

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  console.log('\n── B: in der App ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h, 'leiter');
    const funde = [];
    for (const v of ['home', 'chat', 'team', 'putzplan', 'ann', 'geraete']) {
      await zu(p, v);
      const t = await sichtText(p);
      const mitUhr = t.match(/\b\d{2}:\d{2} Uhr\b/g) || [];
      const ohneNull = t.match(/(?<![\d.])\d\.\d{1,2}\.\d{4}\b|(?<![\d.])\d{1,2}\.\d\.\d{4}\b/g) || [];
      const sekunden = t.match(/\b\d{2}:\d{2}:\d{2}\b/g) || [];
      if (mitUhr.length || ohneNull.length || sekunden.length) funde.push(v + ': ' + mitUhr.concat(ohneNull, sekunden).slice(0, 3).join(', '));
    }
    pruefe(w + ' px: kein „14:30 Uhr", kein „5.8.2026", keine Sekunden in sechs Ansichten', !funde.length, funde.join(' | '));

    await zu(p, 'chat');
    const blasen = await p.evaluate(() => [...document.querySelectorAll('#chatScroll .msg .meta time')].map(t => t.textContent.trim()));
    pruefe(w + ' px: im Chat trägt jede Blase nur die Uhrzeit (' + blasen.length + ' gezählt)',
      blasen.length > 0 && blasen.every(x => /^\d{2}:\d{2}$/.test(x)), blasen.filter(x => !/^\d{2}:\d{2}$/.test(x)).slice(0, 3).join(', '));
    const trenner = await p.evaluate(() => [...document.querySelectorAll('#chatScroll .day-sep')].map(t => t.textContent.trim()));
    pruefe(w + ' px: die Trenner tragen den Tag (' + trenner.slice(-3).join(' · ') + ')',
      trenner.length > 0 && trenner.every(x => /^(Heute|Gestern|[A-Z][a-z]\. \d{2}\.\d{2}\.(\d{4})?)$/.test(x)), trenner.join(' | '));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  await b.close();

  console.log(schlecht
    ? '\n✗ Datum und Uhrzeit: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Datum und Uhrzeit: eine Regel, überall — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
