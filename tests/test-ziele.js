/* ── Ziele ─────────────────────────────────────────────────────────────
   Zwei Bauarten hinter einem Balken:

     „Selbst zählen"      ein Wert, den man antippt
     „Aus meinen Zahlen"  gelesen aus dem, was die App ohnehin rechnet

   WAS HIER TEUER WÄRE, WENN ES FALSCH IST:

     1. Der Ort. Ein Ziel gehört unter privat/<uid>/ziele und nirgends
        sonst. Landet es in einer geteilten Sammlung, liest die Leitung
        mit — und zwar unbemerkt, weil man es dem Bildschirm nicht
        ansieht. Das ist derselbe Fehler, den test-mein-bereich für
        Notizen und To-dos abfängt, und er wiegt hier genauso schwer:
        der Nutzer hat ausdrücklich gesagt, es solle nichts sichtbar
        sein, außer er schickt es ab.
     2. Die Rechnung. „25 von 20" muss 25 heißen und nicht 20, der
        Balken darf trotzdem nicht aus seiner Schiene laufen, und
        „diesen Monat" muss ab dem Ersten zählen und nicht ab
        „vor dreißig Tagen".
     3. Der Zeitraum als Schnitt. Ein Probetraining aus dem VORmonat
        darf ein Monatsziel nicht füllen. Ohne diesen Fall wäre eine
        Zählung, die schlicht alles nimmt, genauso grün.

   Jede Behauptung hat ihre Gegenprobe.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
function pruefe(bedingung, meldung) { if (!bedingung) errs.push(meldung); }

/* Anfang des laufenden Monats und ein Tag davor — beides hier in Node
   gerechnet, damit die Behauptungen unten nicht von der Uhr im Browser
   abhängen. */
const JETZT = new Date();
const MONATSANFANG = new Date(JETZT.getFullYear(), JETZT.getMonth(), 1).getTime();
const IM_MONAT = MONATSANFANG + 86400000;          // sicher drin
const VORMONAT = MONATSANFANG - 86400000;          // sicher draußen

async function persoenlichZiele(p) {
  return p.evaluate(async () => {
    document.querySelector('.mobnav [data-group="g-ich"]').click();
    await new Promise(r => setTimeout(r, 500));
    const sub = document.querySelector('[data-subview="persoenlich"]');
    if (!sub) return false;
    sub.click();
    await new Promise(r => setTimeout(r, 400));
    const t = document.querySelector('[data-perstab="ziele"]');
    if (!t) return false;
    t.click();
    await new Promise(r => setTimeout(r, 500));
    return true;
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript({ path: path.join(SP, 'stub-chef.js') });

  /* Ausgangslage: ein Ziel, das schon übererfüllt ist, und
     Probetrainings diesseits UND jenseits des Monatsanfangs. */
  await p.addInitScript(([imMonat, vormonat]) => {
    window.__privat = {
      ziele: [
        { id: 'z1', titel: 'Bücher lesen', art: 'privat', zielwert: 3,
          einheit: 'Bücher', stand: 1, erledigt: false, ts: 3 },
        /* Zielwert 5, nicht 2: bei drei Probetrainings im Monat waere
           ein Ziel von 2 schon erreicht und stuende unter „Erreicht" —
           der Abschnitt „offen" praefte dann den Fall nicht, um den es
           hier geht. */
        { id: 'z2', titel: 'Probetrainings diesen Monat', art: 'zahl',
          kennzahl: 'probe', zielwert: 5, zeitraum: 'monat',
          erledigt: false, ts: 2 },
        { id: 'z3', titel: 'Schon geschafft', art: 'privat', zielwert: 2,
          stand: 5, erledigt: false, ts: 1 }
      ]
    };
    window.__probe = [
      { id:'x1', vonUid: 'testuid', datum: imMonat, abschluss: true },
      { id:'x2', vonUid: 'testuid', datum: imMonat, abschluss: false },
      { id:'x3', vonUid: 'testuid', datum: imMonat, abschluss: false },
      // Der eine, der NICHT zählen darf
      { id:'x4', vonUid: 'testuid', datum: vormonat, abschluss: true }
    ];
  }, [IM_MONAT, VORMONAT]);

  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2600);

  const da = await persoenlichZiele(p);
  pruefe(da, 'KEIN REITER: „Ziele" ist unter „Persönlich" nicht erreichbar');
  if (!da) { await b.close(); console.log('✗ ' + errs.join('\n✗ ')); process.exit(1); }

  // ══ 1. Was steht in der Liste? ══
  const liste = await p.evaluate(() => {
    const zeilen = [...document.querySelectorAll('#zielListe .ziel-zeile')];
    const fertig = [...document.querySelectorAll('#zielFertig .ziel-zeile')];
    const lies = (z) => ({
      titel: (z.querySelector('.ziel-titel') || {}).textContent || '',
      woher: (z.querySelector('.ziel-woher') || {}).textContent || '',
      stand: (z.querySelector('.pcount') || {}).textContent || '',
      breite: (z.querySelector('.pbar i') || {}).style.width || '',
      lob: (z.querySelector('.pdone') || {}).textContent || '',
      knoepfe: [...z.querySelectorAll('.ziel-knopf')].map(k => k.textContent.trim())
    });
    return {
      offen: zeilen.map(lies), fertig: fertig.map(lies),
      zahl: (document.getElementById('zielZahl') || {}).textContent || '',
      fertigOffen: getComputedStyle(document.getElementById('zielFertigBox')).display !== 'none'
    };
  });

  console.log('Offen:', JSON.stringify(liste.offen.map(z => z.titel + ' ' + z.stand)));
  console.log('Erreicht:', JSON.stringify(liste.fertig.map(z => z.titel + ' ' + z.stand)));

  pruefe(liste.offen.length === 2,
    'ANZAHL: ' + liste.offen.length + ' offene Ziele statt 2');
  pruefe(liste.fertig.length === 1 && liste.fertigOffen,
    'ERREICHTES: das übererfüllte Ziel steht nicht im Erreicht-Bereich');
  pruefe(liste.zahl === '2', 'ZÄHLER: „' + liste.zahl + '" statt „2"');

  const buch = liste.offen.find(z => /Bücher/.test(z.titel)) || {};
  pruefe(buch.stand === '1/3', 'SELBST GEZÄHLT: „' + buch.stand + '" statt „1/3"');
  pruefe(/Bücher/.test(buch.woher), 'EINHEIT fehlt: „' + buch.woher + '"');

  /* Der Kern der Bauart „aus meinen Zahlen": drei Probetrainings in
     diesem Monat, das vierte aus dem Vormonat zählt NICHT mit. Stünde
     hier 4/2, nähme die Rechnung schlicht alles. */
  const probe = liste.offen.find(z => /Probetrainings/.test(z.titel)) || {};
  pruefe(probe.stand === '3/5',
    'ZEITRAUM: „' + probe.stand + '" statt „3/5" — das Probetraining aus ' +
    'dem Vormonat darf ein Monatsziel nicht füllen');
  pruefe(/diesen Monat/.test(probe.woher),
    'HERKUNFT fehlt an der Zeile: „' + probe.woher + '"');

  /* Übererfüllt: die Zahl sagt die Wahrheit, der Balken bleibt in der
     Schiene. Ohne den Deckel liefe er auf 250 % aus seiner Zeile. */
  const ueber = liste.fertig[0] || {};
  pruefe(ueber.stand === '5/2', 'ÜBERERFÜLLT: „' + ueber.stand + '" statt „5/2"');
  pruefe(ueber.breite === '100%',
    'BALKEN: Breite „' + ueber.breite + '" statt 100% — bei 5 von 2 liefe er heraus');
  pruefe(ueber.lob === 'erreicht',
    'LOB: „' + ueber.lob + '" statt „erreicht" (bei Aufgaben heißt es weiter „alles erledigt")');

  /* Ein gelesenes Ziel bekommt kein +1: der Stand kommt aus den Daten,
     ein Knopf daneben würde eine Bedienung vortäuschen, die nichts tut. */
  pruefe(probe.knoepfe.indexOf('+1') < 0,
    'ZU VIEL: ein Ziel aus den Zahlen hat einen +1-Knopf — er täte nichts');
  pruefe(buch.knoepfe.indexOf('+1') >= 0,
    'ZU WENIG: dem selbst gezählten Ziel fehlt der +1-Knopf');

  // ══ 2. Was wird geschrieben? ══
  const schreib = await p.evaluate(async () => {
    window.__schreib = [];
    document.getElementById('zielTitel').value = '3x Sport pro Woche';
    document.getElementById('zielWert').value = '12';
    document.getElementById('zielEinheit').value = 'Einheiten';
    document.getElementById('zielAdd').click();
    await new Promise(r => setTimeout(r, 500));
    /* Nur die Schreibvorgaenge nach privat/. Die App legt nebenher ihr
       Wochenarchiv an, auch wenn man gar nichts anklickt — eine Pruefung
       auf „genau einer INSGESAMT" misst die falsche Sache. */
    const nurPrivat = (l) => l.filter(x => /^privat\//.test(x.pfad));
    const angelegt = nurPrivat(window.__schreib || []);
    // Und ein +1 auf das Bücher-Ziel
    window.__schreib = [];
    const plus = document.querySelector('[data-zielplus="z1"]');
    if (plus) plus.click();
    await new Promise(r => setTimeout(r, 400));
    const hoch = nurPrivat(window.__schreib || []);
    window.__schreib = [];
    const done = document.querySelector('[data-zieldone="z1"]');
    if (done) done.click();
    await new Promise(r => setTimeout(r, 400));
    return { angelegt, hoch, ab: nurPrivat(window.__schreib || []) };
  });

  console.log('Angelegt:', JSON.stringify(schreib.angelegt));
  console.log('Hochgezählt:', JSON.stringify(schreib.hoch));

  const neu = schreib.angelegt[0] || {};
  pruefe(schreib.angelegt.length === 1,
    'SCHREIBVORGÄNGE nach privat/: ' + schreib.angelegt.length + ' statt 1');
  /* DER wichtigste Satz dieses Durchlaufs. */
  pruefe(neu.pfad === 'privat/testuid/ziele/(neu)',
    'FALSCHER ORT: „' + neu.pfad + '" — ein Ziel gehört unter privat/<uid>/ziele. ' +
    'In einer geteilten Sammlung läse die Leitung mit.');
  pruefe(neu.daten && neu.daten.titel === '3x Sport pro Woche' &&
    neu.daten.zielwert === 12 && neu.daten.art === 'privat' &&
    neu.daten.einheit === 'Einheiten' && neu.daten.stand === 0 &&
    neu.daten.erledigt === false,
    'INHALT: ' + JSON.stringify(neu.daten));

  pruefe(schreib.hoch.length === 1 && schreib.hoch[0].pfad === 'privat/testuid/ziele/z1' &&
    schreib.hoch[0].art === 'update' && schreib.hoch[0].daten.stand === 2,
    '+1: ' + JSON.stringify(schreib.hoch));
  pruefe(schreib.ab.length === 1 && schreib.ab[0].daten.erledigt === true,
    'ABSCHLIESSEN: ' + JSON.stringify(schreib.ab));

  // ══ 3. Gegenproben ══
  const gegen = await p.evaluate(async () => {
    // Ein Ziel ohne Titel darf nichts schreiben
    window.__schreib = [];
    document.getElementById('zielTitel').value = '   ';
    document.getElementById('zielAdd').click();
    await new Promise(r => setTimeout(r, 350));
    const leer = (window.__schreib || []).filter(x => /^privat\//.test(x.pfad)).length;

    // Zielwert 0 ebenso wenig
    window.__schreib = [];
    document.getElementById('zielTitel').value = 'Ohne Zahl';
    document.getElementById('zielWert').value = '0';
    document.getElementById('zielAdd').click();
    await new Promise(r => setTimeout(r, 350));
    const null_ = (window.__schreib || []).filter(x => /^privat\//.test(x.pfad)).length;

    // Umschalten auf „aus meinen Zahlen"
    document.querySelector('[data-zielart="zahl"]').click();
    await new Promise(r => setTimeout(r, 250));
    const felderZahl = getComputedStyle(document.getElementById('zielFelderZahl')).display !== 'none';
    const felderPrivat = getComputedStyle(document.getElementById('zielFelderPrivat')).display !== 'none';
    const kennzahlen = [...document.querySelectorAll('#zielKennzahl option')]
      .map(o => o.value);

    // Der Hinweis steht nur bei der Kennzahl, die wirklich wackelt
    const sel = document.getElementById('zielKennzahl');
    const vorher = getComputedStyle(document.getElementById('zielHinweis')).display !== 'none';
    sel.value = 'aufgaben';
    sel.dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 200));
    const nachher = getComputedStyle(document.getElementById('zielHinweis')).display !== 'none';
    const hinweisText = document.getElementById('zielHinweis').textContent;

    return { leer, null_, felderZahl, felderPrivat, kennzahlen, vorher, nachher, hinweisText };
  });

  console.log('Kennzahlen:', gegen.kennzahlen.join(', '));
  pruefe(gegen.leer === 0, 'GEGENPROBE: ein Ziel ohne Titel wurde geschrieben');
  pruefe(gegen.null_ === 0, 'GEGENPROBE: ein Ziel mit Zielwert 0 wurde geschrieben');
  pruefe(gegen.felderZahl && !gegen.felderPrivat,
    'UMSCHALTEN: die Felder wechseln nicht mit der Bauart');
  pruefe(gegen.kennzahlen.length === 5,
    'KENNZAHLEN: ' + gegen.kennzahlen.length + ' statt 5');
  pruefe(!gegen.vorher && gegen.nachher,
    'HINWEIS: er steht nicht genau dort, wo die Zahl wackelt ' +
    '(vorher ' + gegen.vorher + ', bei „aufgaben" ' + gegen.nachher + ')');
  pruefe(/Archiv/.test(gegen.hinweisText),
    'HINWEIS: sagt nicht, woran die Zahl hängt — „' + gegen.hinweisText + '"');

  await b.close();
  fehler.forEach(f => errs.push(f));
  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Ziele: zwei Bauarten hinter einem Balken, der Zeitraum schneidet ' +
      'wirklich, Übererfülltes sagt die Wahrheit ohne aus der Schiene zu ' +
      'laufen, und geschrieben wird nur nach privat/<uid>/ziele');
  process.exit(errs.length ? 1 : 0);
})();
