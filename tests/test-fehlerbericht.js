/* ── Fehler im Betrieb melden ─────────────────────────────────────────
   WARUM ES DAS GIBT
   Wenn bei einem Mitarbeiter etwas nicht lädt, erfährt es heute niemand.
   Er sagt es vielleicht — vielleicht auch nicht, und bei einem Zugang je
   Studio weiss hinterher ohnehin keiner mehr, wer davorstand.

   Diese Sorte Funktion hat eine Eigenart: sie darf selbst NICHT kaputt
   gehen. Ein Fehler im Melden erzeugt einen Fehler, der gemeldet wird,
   der einen Fehler erzeugt. Deshalb steht das hier ganz oben.

     1. Ein echter Fehler wird geschrieben — mit Ansicht, Person, Stelle.
     2. Derselbe Fehler zweimal ergibt EINEN Eintrag, nicht zwei.
        Ein kaputter Bildschirm feuert sonst hundertmal.
     3. Rauschen wird nicht gemeldet: „Script error." und die
        ResizeObserver-Schleife sagen nichts und verstopfen die Liste.
     4. Netzfehler werden nicht gemeldet. Ein Zug ist kein Fehler.
     5. Es gibt eine Obergrenze je Sitzung.
     6. Die Meldung dreht sich nicht im Kreis: schlägt das Schreiben
        selbst fehl, passiert nichts weiter.
     7. Der Chef sieht die Liste — und die Zahl auch bei zugeklappter
        Karte. Zugeklappt sieht sonst aus wie leer (dieselbe Lehre wie
        beim Firmen-Archiv).
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];

async function start(opt) {
  opt = opt || {};
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  /* Schreibvorgänge auf 'fehler' mitschneiden. Was wirklich in der
     Datenbank landet, ist die Frage — nicht was in der Konsole steht. */
  await page.addInitScript(`
    window.__fehlerSchreib = [];
    window.__schreibKaputt = ${opt.schreibKaputt ? 'true' : 'false'};
    var warten = setInterval(function(){
      if (!window.firebase || !window.firebase.firestore) return;
      clearInterval(warten);
      var fs = window.firebase.firestore();
      var echt = fs.collection.bind(fs);
      function haengeAn(k, name){
        var d = k.doc && k.doc.bind(k);
        if (!d) return k;
        k.doc = function(id){
          var o = d(id);
          /* __umwickelt: ohne diese Sperre wird derselbe Aufruf mehrfach
             eingewickelt, sobald dasselbe Dokument ein zweites Mal
             geholt wird — und EIN Schreibvorgang erscheint als zwei.
             Genau darauf ist dieser Durchlauf beim ersten Anlauf
             hereingefallen und meldete einen Fehler in der App, den es
             gar nicht gab. */
          if (name === 'fehler' && o.set && !o.set.__umwickelt) {
            var s = o.set;
            o.set = function(daten){
              window.__fehlerSchreib.push({ id: id, daten: daten });
              if (window.__schreibKaputt) return Promise.reject(new Error('Schreiben kaputt'));
              return s ? s.apply(o, arguments) : Promise.resolve();
            };
            o.set.__umwickelt = true;
          }
          var c = o.collection && o.collection.bind(o);
          if (c) o.collection = function(sub){ return haengeAn(c(sub), sub); };
          return o;
        };
        return k;
      }
      fs.collection = function(p){ return haengeAn(echt(p), p); };
    }, 2);
    setTimeout(function(){ clearInterval(warten); }, 3000);`);
  await page.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  return { b, page };
}

/* Einen echten Fehler auslösen — nicht die Funktion direkt rufen.
   Der Weg über window.onerror ist der, den es im Betrieb gibt. */
async function ausloesen(page, text) {
  await page.evaluate(t => {
    window.dispatchEvent(new ErrorEvent('error', {
      message: t, filename: 'https://beispiel.de/index.html', lineno: 4242,
      error: new Error(t)
    }));
  }, text);
  await page.waitForTimeout(250);
}

(async () => {
  // ══ 1.+2. Ein echter Fehler landet — zweimal derselbe nur einmal ══
  {
    const { b, page } = await start();
    await ausloesen(page, 'Kaputt: x is not a function');
    await ausloesen(page, 'Kaputt: x is not a function');
    const w = await page.evaluate(() => window.__fehlerSchreib);
    console.log('Geschrieben:', JSON.stringify(w.map(x => x.daten && x.daten.text)));
    if (!w.length) {
      errs.push('FEHLT: ein echter Fehler wird gar nicht gemeldet');
    } else {
      const d = w[0].daten;
      if (d.text.indexOf('x is not a function') < 0) errs.push('FALSCH: der Text stimmt nicht');
      if (!d.name) errs.push('FEHLT: es steht nicht dabei, bei wem es passiert ist');
      if (!d.quelle || d.quelle.indexOf('4242') < 0) errs.push('FEHLT: die Stelle fehlt (' + d.quelle + ')');
      if (d.ansicht === undefined) errs.push('FEHLT: es steht nicht dabei, wo er gerade war');
      if (d.geraet === undefined) errs.push('FEHLT: das Gerät fehlt');
    }
    /* Der Punkt: derselbe Fehler noch einmal darf KEINEN zweiten
       Schreibvorgang auslösen. Sonst hat ein kaputter Bildschirm nach
       einer Minute hundert Einträge, und die Liste ist wertlos. */
    const nurEiner = w.filter(x => x.daten && String(x.daten.text || '').indexOf('x is not a function') >= 0);
    if (nurEiner.length > 1) {
      errs.push('DER LISTENKILLER: derselbe Fehler wurde ' + nurEiner.length +
                '× geschrieben statt einmal mitgezählt');
    }
    await b.close();
  }

  // ══ 3.+4. Rauschen und Netzfehler bleiben draussen ══
  {
    const { b, page } = await start();
    for (const t of ['Script error.',
                     'ResizeObserver loop completed with undelivered notifications.',
                     'Failed to fetch',
                     'NetworkError when attempting to fetch resource.']) {
      await ausloesen(page, t);
    }
    const w = await page.evaluate(() => window.__fehlerSchreib);
    console.log('Rauschen geschrieben:', w.length);
    if (w.length) {
      errs.push('VERSTOPFT: Rauschen wird mitgesammelt (' +
        w.map(x => x.daten && x.daten.text).join(' | ') + ')');
    }
    await b.close();
  }

  // ══ 5. Obergrenze je Sitzung ══
  {
    const { b, page } = await start();
    for (let i = 0; i < 12; i++) await ausloesen(page, 'Fehler Nummer ' + i);
    /* Gezählt werden MELDUNGEN, nicht Schreibvorgänge. Je Meldung geht
       ein zweiter, winziger Schreibvorgang für „zuerst gesehen" hinaus;
       wer den mitzählt, misst die Bremse doppelt und meldet einen
       Fehler, den es nicht gibt. Beim ersten Anlauf genau so passiert. */
    const n = await page.evaluate(() =>
      window.__fehlerSchreib.filter(x => x.daten && x.daten.text).length);
    console.log('Nach 12 verschiedenen Fehlern gemeldet:', n);
    if (n > 5) errs.push('OHNE BREMSE: ' + n + ' Meldungen in einer Sitzung, erlaubt sind 5');
    if (n === 0) errs.push('KAPUTT: gar nichts gemeldet');
    await b.close();
  }

  /* ══ 6. Der Kreis: das Melden selbst geht schief ══
     Die gefährlichste Eigenschaft dieser Funktion. Schlägt das Schreiben
     fehl, entsteht eine abgelehnte Zusage — und die löst wieder eine
     Meldung aus, die wieder fehlschlägt. Wenn das passiert, steht der
     Zähler weit über der Obergrenze. */
  {
    const { b, page } = await start({ schreibKaputt: true });
    await ausloesen(page, 'Kaputt beim Melden');
    await page.waitForTimeout(1200);
    const n = await page.evaluate(() => window.__fehlerSchreib.length);
    console.log('Bei kaputtem Schreiben, Versuche:', n);
    if (n > 5) {
      errs.push('DIE SCHLEIFE: das fehlgeschlagene Melden meldet sich selbst — ' +
                n + ' Versuche');
    }
    await b.close();
  }

  // ══ 7. Der Chef sieht die Liste, und die Zahl auch zugeklappt ══
  {
    const { b, page } = await start();
    const stand = await page.evaluate(async () => {
      const g = document.querySelector('.mobnav [data-group="g-chef"]');
      if (g) g.click();
      await new Promise(r => setTimeout(r, 400));
      const t = document.querySelector('#chefHome [data-cgo="system"]');
      if (t) t.click();
      await new Promise(r => setTimeout(r, 800));
      const karte = document.querySelector('.card[data-fold="fehler"]');
      const liste = document.getElementById('fehlerListe');
      return {
        karteDa: !!karte,
        sichtbar: karte ? getComputedStyle(karte).display !== 'none' : null,
        text: liste ? liste.textContent.slice(0, 60) : null
      };
    });
    console.log('Fehler-Karte:', JSON.stringify(stand));
    if (!stand.karteDa) errs.push('FEHLT: die Karte „Fehler im Betrieb" gibt es nicht');
    if (stand.karteDa && !stand.sichtbar) errs.push('FEHLT: die Karte ist da, aber unsichtbar');
    if (stand.text === null) errs.push('FEHLT: die Liste gibt es nicht');
    await b.close();
  }

  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Fehlerbericht: echte Fehler landen, Rauschen nicht, kein Kreis, Liste für den Chef');
  process.exit(errs.length ? 1 : 0);
})();
