/* ── Anmelden, während die eigene Firma stillgelegt ist ───────────────
   WARUM ES DIESEN DURCHLAUF GIBT
   Am 11. August 2026 stand im Abschlussbericht: „Was weiterhin niemand
   geprüft hat: was passiert, wenn ein Chef sich anzumelden versucht,
   während seine Firma im Archiv liegt." Das war ehrlich — aber ein
   bekannter blinder Fleck ist immer noch ein blinder Fleck.

   Nachgesehen: er kam ganz normal HINEIN und stand vor einer leeren
   App. Kein Chat, keine Aufgaben, keine Erklärung, dafür Fehler in der
   Konsole. Die Regeln sperren korrekt — sie erklären nur nichts.

   Genau diese Sorte Auskunft hat beim Probelauf im August eine halbe
   Stunde gekostet: „Missing or insufficient permissions" klang nach
   einem fehlenden Profil und war ein nie freigegebener Regelsatz.

   DREI DINGE WERDEN GEPRÜFT, UND DAS DRITTE IST DAS WICHTIGSTE:
     1. gelöschte Firma  → klare Meldung statt leerer App
     2. gesperrte Firma  → dasselbe
     3. Abfrage schlägt fehl → DURCHLASSEN
   Nummer 3 ist der Punkt: das hier ist eine Meldung, keine Grenze. Die
   Grenze steht in firestore.rules und ist dort geprüft. Wer niemanden
   mehr hereinlässt, sobald das Netz zuckt, hat kein Sicherheitsmerkmal
   gebaut, sondern eine Störung.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];

/* zustand: 'laeuft' | 'geloescht' | 'gesperrt' | 'fehler' */
async function start(zustand) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));

  await page.addInitScript({ path: path.join(SP, 'stub-chef.js') });
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
  return page.evaluate(() => ({
    drin: document.getElementById('app').classList.contains('show'),
    anmeldung: document.getElementById('authWrap').classList.contains('show'),
    meldung: (document.getElementById('loginErr') || {}).textContent || ''
  }));
}

(async () => {
  // ══ 1. Alles normal ══ (die Gegenprobe: ohne sie prüft der Rest nichts)
  {
    const { b, page } = await start('laeuft');
    const l = await lage(page);
    console.log('läuft      :', JSON.stringify(l));
    if (!l.drin) {
      errs.push('GEGENPROBE: bei laufender Firma kommt niemand hinein — ' +
                'dann sagen die Fälle unten nichts aus');
    }
    await b.close();
  }

  // ══ 2. Gelöscht ══
  {
    const { b, page } = await start('geloescht');
    const l = await lage(page);
    console.log('gelöscht   :', JSON.stringify(l));
    if (l.drin) errs.push('GEFÄHRLICH: gelöschte Firma — der Chef kommt in eine leere App');
    if (!/stillgelegt/i.test(l.meldung)) {
      errs.push('FEHLT: keine verständliche Meldung bei gelöschter Firma ("' + l.meldung + '")');
    }
    await b.close();
  }

  // ══ 3. Gesperrt ══
  {
    const { b, page } = await start('gesperrt');
    const l = await lage(page);
    console.log('gesperrt   :', JSON.stringify(l));
    if (l.drin) errs.push('GEFÄHRLICH: gesperrte Firma — der Chef kommt in eine leere App');
    if (!/stillgelegt/i.test(l.meldung)) {
      errs.push('FEHLT: keine verständliche Meldung bei gesperrter Firma ("' + l.meldung + '")');
    }
    await b.close();
  }

  /* ══ 4. Die Abfrage scheitert — und trotzdem hinein ══
     Der wichtigste Fall. Diese Prüfung ist eine MELDUNG, keine Grenze.
     Wer bei jedem Netzzucken das ganze Team aussperrt, hat kein
     Sicherheitsmerkmal gebaut, sondern eine Störung — und zwar eine,
     die freitags um 18 Uhr auffällt. */
  {
    const { b, page } = await start('fehler');
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
