/* ── Nummern, Mails, Links und das Logo ───────────────────────────────
   Was in der App als Text steht, soll man antippen koennen. Geprueft
   wird nicht, ob linkify() irgendetwas verlinkt, sondern:

     1. dass die vier Formen (http, www, Mail, Rufnummer) auf dem
        richtigen Schema landen — https:, mailto:, tel:
     2. dass NICHTS verlinkt wird, was keine Nummer ist. Das ist die
        eigentliche Behauptung. Datum, Uhrzeit, Betrag, Hausnummer,
        Postleitzahl und Versionsnummer bleiben Text — eine Erkennung,
        die „12.08.2025" waehlbar macht, ist schlechter als gar keine.
     3. dass der sichtbare Text derselbe bleibt. Verlinken heisst nicht
        umschreiben.
     4. dass die Links auch SICHTBAR sind (eigene Farbe, Unterstreichung).
        Vorher lief linkify() schon in der Uebergabe und am schwarzen
        Brett — aber a{color:inherit;text-decoration:none} ganz oben hat
        alles eingeebnet. Anklickbar und nicht erkennbar ist dasselbe
        wie nicht vorhanden.
     5. dass die Marke ein echter Knopf ist, zur Startseite fuehrt und
        die 44-Pixel-Regel einhaelt.

   Gemessen wird am gerenderten DOM, nicht an linkify() selbst: die
   Funktion liegt nicht auf window, und eine nachgebaute Kopie im Test
   wuerde nur sich selbst bestaetigen. Alle Proben laufen deshalb als
   echte Uebergabe-Eintraege durch die App.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* Muss verlinkt werden: [Text, erwartetes href] */
const SOLL = [
  ['Seite: https://kf.de/plan',        'https://kf.de/plan'],
  ['Schau auf https://kf.de.',         'https://kf.de'],
  ['Neu unter www.koerperformen.de',   'https://www.koerperformen.de'],
  ['Melde dich bei anna@kf-huerth.de', 'mailto:anna@kf-huerth.de'],
  ['Ruf 0221 1234567 an',              'tel:02211234567'],
  ['Nummer +49 2233 998877',           'tel:+492233998877'],
  ['Service: 0221/98 76 54',           'tel:0221987654'],
];

/* Darf NICHT verlinkt werden — die Gegenprobe. */
const DARF_NICHT = [
  'Termin am 12.08.2025',
  'Termin am 01.09.2026',
  'Beginn 08:30 Uhr',
  'Kosten 1.234,56 Euro',
  'Lieferung an Hausnummer 12',
  'PLZ 50354 Huerth',
  'Geraet 0123 pruefen',
  'Version 2.4.1',
];

const ALLE = SOLL.map(s => s[0]).concat(DARF_NICHT);

/* Alle Proben als Uebergabe-Eintraege — einer je Zeile, alle von jetzt,
   damit keiner am 24-Stunden-Fenster haengenbleibt. Der Schluessel des
   Team-Studios steht nicht fest, deshalb dieselbe Liste unter allen
   Schluesseln, die die Attrappe kennt. */
const listeJs = `
(function(){
  var texte = ${JSON.stringify(ALLE)};
  var eintraege = texte.map(function(t,i){
    return { id:'p'+i, text:t, uid:'u2', name:'Probe', ts: Date.now() - i*1000 };
  });
  var o = {};
  for (var i = 0; i < 14; i++) o['studio-' + i] = eintraege;
  window.__handovers = o;
})();`;

(async () => {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 160));
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.addInitScript(listeJs);
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Team → Reiter „Übergabe". Dort steht die Liste ungekuerzt; auf der
  // Startseite sind es hoechstens zwei Eintraege.
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-team"]').click());
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelector('[data-teamtab="uebergabe"]').click());
  await page.waitForTimeout(900);

  const zeilen = await page.evaluate(() => [...document.querySelectorAll('#hoList .ho-text')]
    .map(el => ({ text: el.textContent, hrefs: [...el.querySelectorAll('a')].map(a => a.getAttribute('href')) })));
  console.log('Gerenderte Uebergaben:', zeilen.length);
  zeilen.forEach(z => console.log('   ' + JSON.stringify(z)));

  if (zeilen.length !== ALLE.length) {
    errs.push('AUFBAU: ' + zeilen.length + ' von ' + ALLE.length + ' Proben gerendert — ' +
      'der Durchlauf misst nicht, was er behauptet');
  } else {
    ALLE.forEach((eingabe, i) => {
      const z = zeilen[i];
      /* 3: der sichtbare Text bleibt gleich. */
      if (z.text !== eingabe) {
        errs.push('TEXT: aus „' + eingabe + '" wurde „' + z.text + '"');
      }
      const soll = SOLL[i];
      if (soll) {
        if (z.hrefs.indexOf(soll[1]) < 0) {
          errs.push('SOLL: „' + eingabe + '" → erwartet ' + soll[1] + ', bekommen ' + JSON.stringify(z.hrefs));
        }
      } else if (z.hrefs.length) {
        errs.push('GEGENPROBE: „' + eingabe + '" wurde faelschlich verlinkt → ' + JSON.stringify(z.hrefs));
      }
    });
  }

  /* ── 4: sichtbar als Link ── */
  const aussehen = await page.evaluate(() => {
    const a = document.querySelector('#hoList .ho-text a');
    if (!a) return null;
    const s = getComputedStyle(a), p = getComputedStyle(a.parentElement);
    return { farbe: s.color, elternFarbe: p.color, strich: s.textDecorationLine };
  });
  console.log('Aussehen:', JSON.stringify(aussehen));
  if (!aussehen) errs.push('Kein einziger Link im DOM — Punkt 4 ungeprueft');
  else if (aussehen.farbe === aussehen.elternFarbe && !/underline/.test(aussehen.strich)) {
    errs.push('Der Link sieht aus wie normaler Text: weder eigene Farbe noch Unterstreichung');
  }

  /* ── 5: die Marke ── */
  const marke = await page.evaluate(() => {
    const el = document.getElementById('tbHome');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    /* Was wirklich unter dem Finger liegt, dicht am oberen und unteren
       Rand: eine Flaeche, die ein Nachbar ueberdeckt, nuetzt nichts,
       auch wenn sie 44px misst. */
    const trifft = y => {
      const t = document.elementFromPoint(r.left + r.width / 2, y);
      return t && t.closest('#tbHome') ? 'tbHome' : (t ? t.tagName + (t.id ? '#' + t.id : '') : 'nichts');
    };
    return { tag: el.tagName, hoehe: Math.round(r.height),
      beschriftung: el.getAttribute('aria-label'),
      oben: trifft(r.top + 3), unten: trifft(r.bottom - 3) };
  });
  console.log('Marke:', JSON.stringify(marke));
  if (!marke) errs.push('Die Marke ist kein Element mit id="tbHome"');
  else {
    if (marke.tag !== 'BUTTON') errs.push('Die Marke ist ein <' + marke.tag + '>, kein Knopf');
    if (!marke.beschriftung) errs.push('Die Marke hat keine Beschriftung fuer Vorlesegeraete');
    if (marke.hoehe < 44) errs.push('Die Marke ist nur ' + marke.hoehe + 'px hoch (44 verlangt)');
    if (marke.oben !== 'tbHome' || marke.unten !== 'tbHome') {
      errs.push('Der obere oder untere Rand der Marke liegt unter einem anderen Element (' +
        marke.oben + '/' + marke.unten + ')');
    }
  }

  const vorher = await page.evaluate(() => (document.querySelector('.view.show') || {}).id);
  await page.evaluate(() => document.getElementById('tbHome').click());
  await page.waitForTimeout(600);
  const nachher = await page.evaluate(() => (document.querySelector('.view.show') || {}).id);
  console.log('Logo-Klick:', vorher, '→', nachher);
  if (vorher === 'view-home') errs.push('Gegenprobe wertlos: wir standen schon auf der Startseite');
  if (nachher !== 'view-home') errs.push('Das Logo fuehrt nicht zur Startseite (steht auf ' + nachher + ')');

  await page.screenshot({ path: SP + '/verlinkung.png' });
  await b.close();
  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ') : '\n✓ Nummern, Mails, Links und Logo sind anklickbar — und nichts sonst');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
