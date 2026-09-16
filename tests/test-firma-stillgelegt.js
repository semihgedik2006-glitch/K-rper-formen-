/* ── Anmelden, während die eigene Firma stillgelegt ist ───────────────
   Ohne Prüfung kommt der Chef ganz normal hinein und steht vor einer
   leeren App: kein Chat, keine Aufgaben, keine Erklärung, dafür Fehler
   in der Konsole. Die Regeln sperren korrekt — sie erklären nur nichts,
   und „Missing or insufficient permissions" liest sich wie ein
   fehlendes Profil.

     1. gelöschte Firma  → klare Meldung statt leerer App
     2. gesperrte Firma  → dasselbe
     3. Abfrage schlägt fehl → DURCHLASSEN

   Punkt 3 ist der wichtigste: das hier ist eine Meldung, keine Grenze.
   Die Grenze steht in firestore.rules. Wer niemanden mehr hereinlässt,
   sobald das Netz zuckt, hat kein Sicherheitsmerkmal gebaut, sondern
   eine Störung.

   ── SEIT DER PAYWALL GEHEN DIE WEGE AUSEINANDER ──────────────────────
   Bis hierher wurde JEDER abgemeldet, mit einer Meldung im
   Anmeldebildschirm. Für die Geschäftsführung war das eine
   Einbahnstraße: abgemeldet kann sie die Kasse nicht aufrufen, denn
   die prüft serverseitig, WER ruft. Ein Betrieb, der wegen einer
   offenen Zahlung stillgelegt ist, ist aber genau der, der zahlen
   will.

   Also zwei Wege, und dieser Durchlauf prüft beide:

     · Chef        → bleibt ANGEMELDET, sieht die Zahlseite mit einem
                     Weg zur Kasse
     · Mitarbeiter → wird abgemeldet, mit der Meldung wie bisher

   Was in BEIDEN Fällen gilt und der eigentliche Kern ist: niemand
   landet in einer leeren App, und jeder bekommt einen Satz zu lesen,
   der erklärt, was los ist.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];

/* zustand: 'laeuft' | 'geloescht' | 'gesperrt' | 'fehler'
   wer:     'chef' | 'mitarbeiter' */
async function start(zustand, wer) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));

  await page.addInitScript({
    path: path.join(SP, 'stub-' + (wer || 'chef') + '.js') });
  /* Der Firmenstand wird NACH dem Stub untergeschoben: mandant an, und
     firmen/<kennung> antwortet so, wie der jeweilige Fall es verlangt. */
  await page.addInitScript(`
    (function(){
      var ZUSTAND = ${JSON.stringify(zustand)};
      var iv = setInterval(function(){
        if (!window.KONFIG) return;
        window.KONFIG.mandant = true;
        clearInterval(iv);
      }, 2);
      setTimeout(function(){ clearInterval(iv); }, 3000);

      var warten = setInterval(function(){
        if (!window.firebase || !window.firebase.firestore) return;
        clearInterval(warten);
        var fs = window.firebase.firestore();
        var echt = fs.collection.bind(fs);
        fs.collection = function(p){
          var k = echt(p);
          if (p === 'firmen') {
            var d = k.doc.bind(k);
            k.doc = function(id){
              var o = d(id);
              o.get = function(){
                if (ZUSTAND === 'fehler') return Promise.reject(new Error('offline'));
                if (ZUSTAND === 'geloescht') {
                  return Promise.resolve({ exists:false, id:id, data:function(){ return {}; } });
                }
                return Promise.resolve({ exists:true, id:id, data:function(){
                  return { name:'Test-Firma', aktiv: ZUSTAND !== 'gesperrt' };
                } });
              };
              return o;
            };
          }
          return k;
        };
      }, 2);
      setTimeout(function(){ clearInterval(warten); }, 3000);
    })();`);

  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  return { b, page };
}

async function lage(page) {
  return page.evaluate(() => {
    const zw = document.getElementById('zahlWrap');
    const zahl = !!(zw && zw.classList.contains('show') &&
                    zw.getClientRects().length > 0);
    const kasse = document.getElementById('zahlKasse');
    return {
      drin: document.getElementById('app').classList.contains('show'),
      anmeldung: document.getElementById('authWrap').classList.contains('show'),
      meldung: (document.getElementById('loginErr') || {}).textContent || '',
      zahlseite: zahl,
      zahltext: zahl ? ((document.getElementById('zahlText') || {}).textContent || '') : '',
      kasseKnopf: zahl && !!(kasse && kasse.getClientRects().length > 0),
    };
  });
}

/* Der Kern, für beide Rollen gleich: keine leere App, und ein Satz zu
   lesen. WO der Satz steht, unterscheidet sich — dass es ihn gibt,
   nicht. */
function pruefeStillgelegt(errs, wer, fall, l) {
  if (l.drin) {
    errs.push('GEFÄHRLICH: ' + fall + ' — ' + wer + ' kommt in eine leere App');
    return;
  }
  if (wer === 'chef') {
    if (!l.zahlseite) {
      errs.push('FEHLT: ' + fall + ' — der Chef sieht keine Zahlseite ' +
                '(Meldung im Anmeldebildschirm: "' + l.meldung + '")');
      return;
    }
    if (!/stillgelegt/i.test(l.zahltext)) {
      errs.push('FEHLT: ' + fall + ' — die Zahlseite erklärt nichts ("' + l.zahltext + '")');
    }
    /* Der Browser weiss NICHT, warum gesperrt wurde. Eine Zahlseite,
       die trotzdem eine offene Zahlung behauptet, ist bei jedem von
       Hand gesperrten Betrieb eine Falschaussage — und zwar die erste,
       die der Kunde liest. */
    if (/zahlung ist offen|zahlung offen/i.test(l.zahltext)) {
      errs.push('BEHAUPTUNG: ' + fall + ' — die Zahlseite nennt einen Grund, den sie ' +
                'nicht kennen kann ("' + l.zahltext + '")');
    }
    if (!/nicht gelöscht/i.test(l.zahltext)) {
      errs.push('FEHLT: ' + fall + ' — die Zahlseite beantwortet die erste Frage nicht: ' +
                'sind meine Daten weg? ("' + l.zahltext + '")');
    }
    /* Der teuerste Fall, wenn er fehlte: ohne diesen Knopf ist die
       Sperre eine Einbahnstraße und ein zahlungswilliger Kunde weg. */
    if (!l.kasseKnopf) {
      errs.push('EINBAHNSTRASSE: ' + fall + ' — der Chef hat keinen Weg zur Kasse');
    }
  } else {
    if (!/stillgelegt/i.test(l.meldung)) {
      errs.push('FEHLT: ' + fall + ' — keine verständliche Meldung für das Team ("' +
                l.meldung + '")');
    }
    if (l.zahlseite) {
      errs.push('FALSCH: ' + fall + ' — das Team sieht die Zahlseite. ' +
                'Ein Weg zur Kasse, den es nicht gehen darf, ist eine Sackgasse');
    }
  }
}

(async () => {
  for (const wer of ['chef', 'mitarbeiter']) {
    console.log('\n── ' + wer + ' ──');

    // ══ 1. Alles normal ══ (die Gegenprobe: ohne sie prüft der Rest nichts)
    {
      const { b, page } = await start('laeuft', wer);
      const l = await lage(page);
      console.log('läuft      :', JSON.stringify(l));
      if (!l.drin) {
        errs.push('GEGENPROBE (' + wer + '): bei laufender Firma kommt niemand hinein — ' +
                  'dann sagen die Fälle unten nichts aus');
      }
      if (l.zahlseite) {
        errs.push('GEGENPROBE (' + wer + '): die Zahlseite steht da, obwohl alles läuft — ' +
                  'dann prüfen die Fälle unten nur, dass sie immer da ist');
      }
      await b.close();
    }

    // ══ 2. Gelöscht ══
    {
      const { b, page } = await start('geloescht', wer);
      const l = await lage(page);
      console.log('gelöscht   :', JSON.stringify(l));
      pruefeStillgelegt(errs, wer, 'gelöschte Firma', l);
      await b.close();
    }

    // ══ 3. Gesperrt ══
    {
      const { b, page } = await start('gesperrt', wer);
      const l = await lage(page);
      console.log('gesperrt   :', JSON.stringify(l));
      pruefeStillgelegt(errs, wer, 'gesperrte Firma', l);
      await b.close();
    }
  }

  /* ══ 4. Die Abfrage scheitert — und trotzdem hinein ══
     Der wichtigste Fall. Diese Prüfung ist eine MELDUNG, keine Grenze.
     Wer bei jedem Netzzucken das ganze Team aussperrt, hat kein
     Sicherheitsmerkmal gebaut, sondern eine Störung — und zwar eine,
     die freitags um 18 Uhr auffällt. */
  {
    console.log('\n── Netzfehler (chef) ──');
    const { b, page } = await start('fehler', 'chef');
    const l = await lage(page);
    console.log('Netzfehler :', JSON.stringify(l));
    if (!l.drin) {
      errs.push('ZU STRENG: bei einer fehlgeschlagenen Abfrage bleibt das Team draußen. ' +
                'Die Grenze gehört in die Regeln, nicht in eine Netzabfrage');
    }
    await b.close();
  }

  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Stillgelegte Firma: klare Meldung statt leerer App — und bei Netzfehler wird durchgelassen');
  process.exit(errs.length ? 1 : 0);
})();
