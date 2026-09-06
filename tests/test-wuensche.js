/* ── Wünsche und das Abschicken ────────────────────────────────────────
   Der persönliche Bereich ist privat. Ein Wunsch oder Ziel wird erst
   sichtbar, wenn jemand „Abschicken" drückt — so ausdrücklich verlangt:

     „Gar nichts, außer ich schicke es ausdrücklich ab."
     „Ich entscheide je Eintrag, an wen."

   `tests/rules/anliegen.test.js` beweist, dass die REGELN das halten.
   Hier geht es um die andere Hälfte, die dort niemand sehen kann:

     1. Schreibt der Knopf wirklich nach `anliegen/` — und merkt sich
        das Private, dass es abgeschickt wurde? Ohne den Rückverweis
        könnte man es nie zurückziehen.
     2. Sieht man den Zustand? „Abgeschickt" muss an der Zeile stehen,
        sonst drückt man einen Knopf und nichts ändert sich sichtbar.
        Eine Antwort muss ankommen.
     3. Bleibt „nur für mich" wirklich bei mir? Ein Abschicken-Knopf an
        einer privaten Merkliste ist eine Falle, kein Feature.
     4. Wird NICHT gedoppelt, was es schon gibt? Urlaub und
        Schichttausch haben eigene Wege. Zwei Wege heissen: einer
        bleibt liegen.

   Jede Behauptung mit Gegenprobe.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
function pruefe(bedingung, meldung) { if (!bedingung) errs.push(meldung); }
const nurPrivat = (l) => (l || []).filter(x => /^privat\//.test(x.pfad));
const nurAnliegen = (l) => (l || []).filter(x => /^anliegen\//.test(x.pfad));

async function reiter(p, name) {
  return p.evaluate(async (x) => {
    document.querySelector('.mobnav [data-group="g-ich"]').click();
    await new Promise(r => setTimeout(r, 450));
    const sub = document.querySelector('[data-subview="persoenlich"]');
    if (!sub) return false;
    sub.click();
    await new Promise(r => setTimeout(r, 350));
    const t = document.querySelector('[data-perstab="' + x + '"]');
    if (!t) return false;
    t.click();
    await new Promise(r => setTimeout(r, 450));
    return true;
  }, name);
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript({ path: path.join(SP, 'stub-chef.js') });

  await p.addInitScript(() => {
    window.__privat = {
      /* Ein Ziel gehört in die Ausgangslage, obwohl dieser Durchlauf
         „Wünsche" heisst: Abschnitt 5 prüft, dass die Absende-Mechanik
         für BEIDE gilt. Ohne ein Ziel wäre die Liste leer und der
         Abschnitt hätte nur bewiesen, dass nichts da ist. */
      ziele: [
        { id: 'z1', titel: 'Trainer-B-Lizenz', art: 'privat', zielwert: 1,
          stand: 0, erledigt: false, ts: 1 }
      ],
      wuensche: [
        { id: 'w1', text: 'Neue Matten', art: 'vorschlag', erledigt: false, ts: 3 },
        { id: 'w2', text: 'Lieber Frühschicht', art: 'schicht', erledigt: false,
          ts: 2, gesendetId: 'an2', gesendetAn: 'leiter', gesendetAm: 1 },
        { id: 'w3', text: 'Geheime Merkliste', art: 'frei', erledigt: false, ts: 1 }
      ]
    };
    /* Auf w2 wurde schon geantwortet — nur so lässt sich prüfen, dass
       die Antwort an der Zeile ankommt und der Zurückziehen-Knopf
       verschwindet. */
    window.__anliegen = [
      { id: 'an2', art: 'schicht', titel: 'Lieber Frühschicht', uid: 'testuid',
        name: 'Test Chef', an: 'leiter', studioKey: 'studio-6',
        status: 'beantwortet', antwort: 'Ab Oktober machbar', antwortVon: 'Lisa',
        antwortAm: 2, ts: 2, quelle: { sammlung: 'wuensche', id: 'w2' } },
      /* Ein OFFENES, und von jemand anderem. Der Posteingang der
         Leitung besteht ja gerade nicht aus dem, was man selbst
         geschickt hat — und ohne einen offenen Eintrag prüfte
         Abschnitt 6 das Antworten an einer leeren Liste. */
      { id: 'an3', art: 'vorschlag', titel: 'Neue Hantelablage',
        text: 'Die alte wackelt', uid: 'u2', name: 'Anna Meier',
        an: 'chef', status: 'offen', ts: 5 }
    ];
  });

  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2600);

  const da = await reiter(p, 'wuensche');
  pruefe(da, 'KEIN REITER: „Wünsche" ist unter „Persönlich" nicht erreichbar');
  if (!da) { await b.close(); console.log('✗ ' + errs.join('\n✗ ')); process.exit(1); }

  // ══ 1. Was steht da? ══
  const liste = await p.evaluate(() => {
    const lies = (z) => ({
      titel: (z.querySelector('.ziel-titel') || {}).textContent || '',
      art: (z.querySelector('.ziel-woher') || {}).textContent || '',
      marke: (z.querySelector('.anl-marke') || {}).textContent || '',
      wohin: (z.querySelector('.anl-wohin') || {}).textContent || '',
      antwort: (z.querySelector('.anl-antwort') || {}).textContent || '',
      knoepfe: [...z.querySelectorAll('.ziel-knopf')].map(k => k.textContent.trim())
    });
    return {
      zeilen: [...document.querySelectorAll('#wunschListe .ziel-zeile')].map(lies),
      verweise: [...document.querySelectorAll('#wunschZuUrlaub,#wunschZuBrett')]
        .map(k => k.textContent.trim())
    };
  });

  console.log('Zeilen:', JSON.stringify(liste.zeilen.map(z => z.titel + ' [' + z.marke + ']')));

  pruefe(liste.zeilen.length === 3, 'ANZAHL: ' + liste.zeilen.length + ' statt 3');

  const matten = liste.zeilen.find(z => /Matten/.test(z.titel)) || {};
  const schicht = liste.zeilen.find(z => /Frühschicht/.test(z.titel)) || {};
  const geheim = liste.zeilen.find(z => /Merkliste/.test(z.titel)) || {};

  /* Noch nicht abgeschickt: beide Empfänger stehen zur Wahl, es gibt
     keine Marke. */
  pruefe(matten.marke === '', 'ZU FRÜH: „Neue Matten" trägt schon eine Marke');
  pruefe(matten.knoepfe.indexOf('An die Geschäftsführung') >= 0 &&
    matten.knoepfe.indexOf('An die Studioleitung') >= 0,
    'EMPFÄNGERWAHL fehlt: ' + JSON.stringify(matten.knoepfe));

  /* Beantwortet: Marke, Antwort und Absender stehen da — und der
     Zurückziehen-Knopf ist WEG. Eine beantwortete Bitte verschwinden zu
     lassen hiesse, die Antwort mit zu löschen. */
  pruefe(schicht.marke === 'beantwortet',
    'MARKE: „' + schicht.marke + '" statt „beantwortet"');
  pruefe(/Ab Oktober machbar/.test(schicht.antwort),
    'ANTWORT fehlt an der Zeile: „' + schicht.antwort + '"');
  pruefe(/Lisa/.test(schicht.antwort),
    'ANTWORT ohne Absender: „' + schicht.antwort + '"');
  pruefe(schicht.knoepfe.indexOf('Zurückziehen') < 0,
    'ZU VIEL: eine beantwortete Bitte lässt sich zurückziehen — dann wäre ' +
    'die Antwort mit weg');

  /* DER wichtigste Fall der Zeile: „nur für mich" hat KEINEN
     Abschicken-Knopf. Ein Knopf, den man nicht drücken soll, an einer
     privaten Merkliste ist eine Falle. */
  pruefe(geheim.knoepfe.indexOf('An die Geschäftsführung') < 0 &&
    geheim.knoepfe.indexOf('An die Studioleitung') < 0,
    'FALLE: „nur für mich" hat einen Abschicken-Knopf — ' +
    JSON.stringify(geheim.knoepfe));
  pruefe(geheim.marke === '', 'MARKE an einer privaten Merkliste');

  pruefe(liste.verweise.length === 2,
    'VERWEISE: ' + liste.verweise.length + ' statt 2 (Urlaub, Schichttausch)');

  // ══ 2. Abschicken ══
  const senden = await p.evaluate(async () => {
    window.__schreib = [];
    const zeile = [...document.querySelectorAll('#wunschListe .ziel-zeile')]
      .find(z => /Matten/.test(z.textContent));
    const k = zeile.querySelector('[data-sendchef]');
    k.click();
    await new Promise(r => setTimeout(r, 700));
    return (window.__schreib || []).map(x => ({ pfad: x.pfad, art: x.art, daten: x.daten }));
  });
  console.log('Beim Abschicken:', JSON.stringify(senden));

  const anl = nurAnliegen(senden)[0] || {};
  const rueck = nurPrivat(senden)[0] || {};
  pruefe(nurAnliegen(senden).length === 1,
    'ANLIEGEN: ' + nurAnliegen(senden).length + ' Schreibvorgänge statt 1');
  pruefe(anl.pfad === 'anliegen/(neu)', 'FALSCHER ORT: „' + anl.pfad + '"');
  pruefe(anl.daten && anl.daten.uid === 'testuid' && anl.daten.an === 'chef' &&
    anl.daten.status === 'offen' && anl.daten.titel === 'Neue Matten' &&
    anl.daten.art === 'vorschlag',
    'INHALT: ' + JSON.stringify(anl.daten));
  /* Kein studioKey, wenn es an die Geschäftsführung geht — sonst sähe
     es aus, als sei es an die Leitung dieses Studios gerichtet. */
  pruefe(anl.daten && anl.daten.studioKey === undefined,
    'ZU VIEL: studioKey an einem Anliegen für die Geschäftsführung');
  pruefe(anl.daten && anl.daten.quelle && anl.daten.quelle.sammlung === 'wuensche' &&
    anl.daten.quelle.id === 'w1',
    'RÜCKVERWEIS fehlt: ' + JSON.stringify(anl.daten && anl.daten.quelle));

  /* Und das Private merkt sich, dass es draussen ist. Ohne das wüsste
     die App nach dem Neuladen nicht mehr, was zurückzuziehen wäre. */
  pruefe(rueck.pfad === 'privat/testuid/wuensche/w1' && rueck.art === 'update' &&
    rueck.daten.gesendetId === 'neu' && rueck.daten.gesendetAn === 'chef',
    'MERKER am Privaten: ' + JSON.stringify(rueck));

  // ══ 3. An die Studioleitung: mit studioKey ══
  const anLeitung = await p.evaluate(async () => {
    window.__schreib = [];
    const zeile = [...document.querySelectorAll('#wunschListe .ziel-zeile')]
      .find(z => /Merkliste/.test(z.textContent));
    // Es gibt hier keinen Knopf — also über die andere Zeile
    const andere = [...document.querySelectorAll('#wunschListe .ziel-zeile')]
      .find(z => z.querySelector('[data-sendleiter]'));
    if (!andere) return { keinKnopf: true };
    andere.querySelector('[data-sendleiter]').click();
    await new Promise(r => setTimeout(r, 700));
    return { schreib: (window.__schreib || []).map(x => ({ pfad: x.pfad, daten: x.daten })) };
  });
  if (!anLeitung.keinKnopf) {
    const a2 = (anLeitung.schreib.filter(x => /^anliegen\//.test(x.pfad))[0] || {}).daten || {};
    pruefe(a2.an === 'leiter' && !!a2.studioKey,
      'STUDIOLEITUNG: ohne studioKey findet die Leitung es nie — ' + JSON.stringify(a2));
  }

  // ══ 4. Gegenproben ══
  const gegen = await p.evaluate(async () => {
    // Ein Wunsch ohne Text darf nichts schreiben
    window.__schreib = [];
    document.getElementById('wunschText').value = '   ';
    document.getElementById('wunschAdd').click();
    await new Promise(r => setTimeout(r, 350));
    const leer = (window.__schreib || []).filter(x => /^privat\//.test(x.pfad)).length;

    // Anlegen mit der gewählten Art
    window.__schreib = [];
    document.querySelector('[data-wunschart="vorschlag"]').click();
    document.getElementById('wunschText').value = 'Bessere Handtücher';
    document.getElementById('wunschAdd').click();
    await new Promise(r => setTimeout(r, 500));
    const neu = (window.__schreib || []).filter(x => /^privat\//.test(x.pfad))[0] || {};

    return { leer, neu };
  });
  pruefe(gegen.leer === 0, 'GEGENPROBE: ein Wunsch ohne Text wurde geschrieben');
  pruefe(gegen.neu.pfad === 'privat/testuid/wuensche/(neu)',
    'ANLEGEN: falscher Ort „' + gegen.neu.pfad + '"');
  pruefe(gegen.neu.daten && gegen.neu.daten.art === 'vorschlag' &&
    gegen.neu.daten.text === 'Bessere Handtücher',
    'ANLEGEN: ' + JSON.stringify(gegen.neu.daten));

  // ══ 5. Auch ein ZIEL lässt sich abschicken ══
  await reiter(p, 'ziele');
  const zielSenden = await p.evaluate(async () => {
    const zeilen = [...document.querySelectorAll('#zielListe .ziel-zeile, #zielFertig .ziel-zeile')];
    const mit = zeilen.find(z => z.querySelector('[data-sendchef]'));
    if (!mit) return { keinKnopf: true, zahl: zeilen.length };
    window.__schreib = [];
    mit.querySelector('[data-sendchef]').click();
    await new Promise(r => setTimeout(r, 700));
    return { schreib: (window.__schreib || []).map(x => ({ pfad: x.pfad, daten: x.daten })) };
  });
  /* Der Grund, warum es keine eigene Zielart „Entwicklungsziel" gibt:
     JEDES Ziel lässt sich teilen. Fehlte der Knopf, wäre die
     Vereinfachung eine Verschlechterung. */
  pruefe(!zielSenden.keinKnopf,
    'ZIELE: kein Abschicken-Knopf an einem Ziel — dann fehlt das ' +
    '„Entwicklungsziel mit der Leitung" ganz');
  if (!zielSenden.keinKnopf) {
    const az = (zielSenden.schreib.filter(x => /^anliegen\//.test(x.pfad))[0] || {}).daten || {};
    pruefe(az.art === 'ziel' && az.quelle && az.quelle.sammlung === 'ziele',
      'ZIEL-ANLIEGEN: ' + JSON.stringify(az));
  }

  // ══ 6. Die Gegenseite: die Leitung sieht es und antwortet ══
  /* Ohne diesen Abschnitt wäre „Abschicken" ein Knopf ins Nichts —
     der schlechteste Zustand von allen, weil man ihn nicht sieht. */
  const leitung = await p.evaluate(async () => {
    document.querySelector('.mobnav [data-group="g-chef"]').click();
    await new Promise(r => setTimeout(r, 600));
    const k = [...document.querySelectorAll('[data-cgo]')]
      .find(x => x.getAttribute('data-cgo') === 'anliegen');
    if (!k) return { keinReiter: true };
    k.click();
    await new Promise(r => setTimeout(r, 700));
    const offen = [...document.querySelectorAll('#anlOffen .ziel-zeile')];
    const raus = {
      zahl: (document.getElementById('anlOffenZahl') || {}).textContent || '',
      offen: offen.length,
      fertigOffen: getComputedStyle(document.getElementById('anlFertigBox')).display !== 'none',
      fertigText: [...document.querySelectorAll('#anlFertig .ziel-zeile')]
        .map(z => (z.querySelector('.ziel-titel') || {}).textContent).join('|')
    };
    /* Antworten: genau die vier Felder — mehr lässt die Regel nicht zu.
       Schriebe der Client mehr, wäre es hier grün und in Produktion
       abgelehnt. */
    if (offen.length) {
      const feld = offen[0].querySelector('[data-anlfeld]');
      const knopf = offen[0].querySelector('[data-anlsenden]');
      window.__schreib = [];
      feld.value = 'Machen wir nächste Woche';
      knopf.click();
      await new Promise(r => setTimeout(r, 600));
      raus.schreib = (window.__schreib || [])
        .filter(x => /^anliegen\//.test(x.pfad))
        .map(x => ({ pfad: x.pfad, art: x.art, felder: Object.keys(x.daten || {}) , daten: x.daten }));
    }
    return raus;
  });

  pruefe(!leitung.keinReiter,
    'KEIN REITER: die Verwaltung hat keine Kachel „Anliegen" — dann geht ' +
    'Abgeschicktes ins Leere');
  if (!leitung.keinReiter) {
    console.log('Bei der Leitung:', JSON.stringify({
      offen: leitung.offen, zahl: leitung.zahl, beantwortet: leitung.fertigText }));
    pruefe(leitung.offen >= 1, 'LEER: die Leitung sieht kein offenes Anliegen');
    pruefe(leitung.fertigOffen && /Frühschicht/.test(leitung.fertigText || ''),
      'BEANTWORTETES fehlt: „' + leitung.fertigText + '"');
    const w = (leitung.schreib || [])[0] || {};
    pruefe(w.art === 'update' && /^anliegen\//.test(w.pfad || ''),
      'ANTWORT: falscher Schreibvorgang ' + JSON.stringify(w));
    /* Genau vier Felder. Ein fünftes würde die Regel abweisen — dann
       wäre die Antwort im Test grün und in Produktion unmöglich. */
    pruefe(w.felder && w.felder.length === 4 &&
      ['antwort','antwortVon','antwortAm','status'].every(f => w.felder.indexOf(f) >= 0),
      'ANTWORT-FELDER: ' + JSON.stringify(w.felder) +
      ' — die Regel lässt nur antwort/antwortVon/antwortAm/status zu');
    pruefe(w.daten && w.daten.status === 'beantwortet',
      'ANTWORT ohne Statuswechsel: ' + JSON.stringify(w.daten));
  }

  await b.close();
  fehler.forEach(f => errs.push(f));
  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Wünsche: „nur für mich" bleibt bei mir, Abgeschicktes trägt seinen ' +
      'Stand und die Antwort, der Rückverweis hält beide Seiten zusammen, ' +
      'und Urlaub/Tausch werden verlinkt statt gedoppelt');
  process.exit(errs.length ? 1 : 0);
})();
