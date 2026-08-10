/* Studios in der Datenbank statt im Code.

   Bis hierher stand die Studioliste in konfig.js. Ein neues Studio hieß:
   Datei ändern und deployen. Jetzt legt der Chef sie selbst an.

   Geprüft wird das, wovon Daten abhängen:

     1. Fehlt das Dokument in der Datenbank, gilt weiter konfig.js.
        Ein bestehender Betrieb darf von der Umstellung nichts merken.
     2. Steht es da, gewinnt es – auch mit anderen Namen.
     3. Ein umbenanntes Studio behält seine KENNUNG. Das ist der Kern:
        an der Kennung hängen Aufgaben, Schichten und Nachrichten.
     4. Ein neues Studio bekommt die nächste freie Nummer, nie eine
        wiederverwendete.
     5. Ein geschlossenes Studio verschwindet aus den Auswahllisten,
        bleibt aber in der Liste stehen.
     6. Es gibt keinen Löschen-Knopf.

   Die Regeln sind getrennt geprüft (tests/rules/security.test.js, sieben
   Stück) – dass auch der Chef die Liste nicht kürzen kann, steht dort.  */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Legt config/studios in den Stub. null = Dokument fehlt.
const studioStub = doc => `
(function(){
  var fs = window.firebase.firestore();
  var echt = fs.collection.bind(fs);
  var DOC = ${JSON.stringify(doc)};
  window.__geschrieben = [];
  fs.collection = function(pfad){
    /* Seit dem Umzug schickt S() 'firmen/<kennung>/…'. Die Testdaten
       liegen flach — Vorsatz abschneiden, sonst greift die Attrappe
       unten nie. */
    pfad = String(pfad).replace(new RegExp('^firmen/[^/]+/'), '');
    var k = echt(pfad);
    if (pfad === 'config') {
      var d = k.doc.bind(k);
      k.doc = function(id){
        var o = d(id);
        if (id === 'studios') {
          function snap(){
            return { exists: !!DOC, id:'studios', metadata:{hasPendingWrites:false},
                     data: function(){ return DOC || {}; } };
          }
          o.get = function(){ return Promise.resolve(snap()); };
          o.onSnapshot = function(cb){ try{ cb(snap()); }catch(e){ console.error(e); } return function(){}; };
          o.set = function(daten){
            window.__geschrieben.push(JSON.parse(JSON.stringify(daten)));
            DOC = daten;                       // wie die echte Datenbank
            return Promise.resolve();
          };
        }
        return o;
      };
    }
    return k;
  };
})();`;

async function start(errs, doc) {
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
  await page.addInitScript(studioStub(doc));
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  return { b, page };
}

async function zuStandorten(page) {
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const k = document.querySelector('#chefHome [data-cgo="standorte"]');
    if (k) k.click();
  });
  await page.waitForTimeout(700);
}

(async () => {
  const errs = [];

  // ══ 1. Ohne Dokument gilt konfig.js ══
  {
    const { b, page } = await start(errs, null);
    const ohne = await page.evaluate(() => ({
      zahl: document.querySelectorAll('#ppStudio option, #matStudio option').length,
      // Die Auswahl im Putzplan spiegelt STUDIOS
      erste: [...document.querySelectorAll('#ppStudio option')].map(o => o.textContent).slice(0, 3),
    }));
    console.log('Ohne Dokument:', JSON.stringify(ohne));
    if (!ohne.erste.length) errs.push('FEHLT: ohne Dokument steht gar keine Studio-Auswahl da');
    if (ohne.erste.length && !/Longerich|Nippes|Hürth/.test(ohne.erste.join(' '))) {
      errs.push('FEHLT: ohne Dokument gilt nicht mehr die Liste aus konfig.js (' + ohne.erste.join(', ') + ')');
    }
    await b.close();
  }

  // ══ 2.–6. Mit Dokument ══
  {
    const { b, page } = await start(errs, {
      liste: [
        { id: 'studio-0', name: 'Alpha', aktiv: true },
        { id: 'studio-1', name: 'Beta', aktiv: true },
        { id: 'studio-2', name: 'Gamma', aktiv: false },
      ],
      naechste: 3,
    });

    const mit = await page.evaluate(() => ({
      auswahl: [...document.querySelectorAll('#ppStudio option')].map(o => o.textContent),
      // studioKey ist nicht global (IIFE) – geprüft wird über die Werte
      werte: [...document.querySelectorAll('#ppStudio option')].map(o => o.value),
    }));
    console.log('Mit Dokument:', JSON.stringify(mit));
    if (mit.auswahl.join(' ').includes('Longerich')) {
      errs.push('FEHLT: konfig.js gewinnt gegen die Datenbank');
    }
    if (!mit.auswahl.some(x => /Alpha/.test(x))) errs.push('FEHLT: „Alpha" fehlt in der Auswahl');
    if (mit.auswahl.some(x => /Gamma/.test(x))) {
      errs.push('FEHLT: geschlossenes Studio „Gamma" steht noch in der Auswahl');
    }
    // Die Kennung muss zum Listeneintrag passen, nicht zum Platz in der Anzeige
    if (mit.werte[0] !== 'studio-0') {
      errs.push('FALSCHE KENNUNG: erste Auswahl hat ' + mit.werte[0] + ' statt studio-0');
    }

    await zuStandorten(page);
    const liste = await page.evaluate(() => ({
      zeilen: [...document.querySelectorAll('#standortListe .st-zeile')].map(z => ({
        name: (z.querySelector('b') || {}).textContent,
        kennung: (z.querySelector('.st-sub') || {}).textContent,
        zu: z.classList.contains('zu'),
      })),
      loeschen: document.querySelectorAll('#standortListe [data-stdel]').length,
      anlegen: !!document.getElementById('stNeuBtn'),
    }));
    console.log('Verwaltung:', JSON.stringify(liste.zeilen));
    if (liste.zeilen.length !== 3) errs.push('FEHLT: Verwaltung zeigt ' + liste.zeilen.length + ' statt 3 Studios');
    if (!liste.zeilen.some(z => z.zu)) errs.push('FEHLT: geschlossenes Studio ist nicht als solches erkennbar');
    if (liste.loeschen) errs.push('GEFÄHRLICH: es gibt einen Löschen-Knopf für Studios');
    if (!liste.anlegen) errs.push('FEHLT: kein Knopf zum Anlegen');

    // ── Anlegen: nächste freie Nummer ──
    await page.evaluate(() => { document.getElementById('stNeuName').value = 'Delta'; });
    await page.evaluate(() => document.getElementById('stNeuBtn').click());
    await page.waitForTimeout(900);
    const nachAnlegen = await page.evaluate(() => window.__geschrieben.slice(-1)[0]);
    console.log('Geschrieben:', JSON.stringify(nachAnlegen && nachAnlegen.liste.slice(-1)));
    if (!nachAnlegen) {
      errs.push('FEHLT: Anlegen schreibt gar nichts');
    } else {
      const neu = nachAnlegen.liste[nachAnlegen.liste.length - 1];
      if (neu.name !== 'Delta') errs.push('FEHLT: das neue Studio heißt nicht „Delta"');
      if (neu.id !== 'studio-3') errs.push('FALSCHE KENNUNG: neues Studio bekam ' + neu.id + ' statt studio-3');
      if (nachAnlegen.liste.length !== 4) errs.push('FEHLT: die Liste ist nicht gewachsen');
      if (nachAnlegen.naechste !== 4) errs.push('FEHLT: „naechste" steht auf ' + nachAnlegen.naechste + ' statt 4');
    }

    await page.screenshot({ path: SP + '/standorte.png' });
    await b.close();
  }

  // ══ 7. Umbenennen behält die Kennung ══
  {
    const { b, page } = await start(errs, {
      liste: [
        { id: 'studio-0', name: 'Alpha', aktiv: true },
        { id: 'studio-7', name: 'Hürth', aktiv: true },
      ],
      naechste: 8,
    });
    await zuStandorten(page);
    await page.evaluate(() => {
      window.prompt = () => 'Hürth Süd';          // Rückfrage übergehen
      const b = document.querySelector('[data-stum="studio-7"]');
      if (b) b.click();
    });
    await page.waitForTimeout(800);
    const nach = await page.evaluate(() => window.__geschrieben.slice(-1)[0]);
    console.log('Nach dem Umbenennen:', JSON.stringify(nach && nach.liste));
    if (!nach) {
      errs.push('FEHLT: Umbenennen schreibt nichts');
    } else {
      const h = nach.liste.filter(x => x.id === 'studio-7')[0];
      if (!h) errs.push('DATENVERLUST: studio-7 ist aus der Liste verschwunden');
      else if (h.name !== 'Hürth Süd') errs.push('FEHLT: der Name wurde nicht geändert');
      if (nach.liste.length !== 2) errs.push('DATENVERLUST: die Liste ist beim Umbenennen kürzer geworden');
    }
    await b.close();
  }

  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ') : '\n✓ Standorte: Liste kommt aus der Datenbank, Kennungen bleiben stabil');
  process.exit(errs.length ? 1 : 0);
})();
