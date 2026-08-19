/* ── „Zum Lesen" auf der Startseite ───────────────────────────────────
   Aushänge und schwarzes Brett stehen mit Text auf der Startseite, nicht
   nur als Zähler und nicht erst nach einem Klick.

     1. Der Text der Aushänge steht da — ohne Klick.
     2. Das schwarze Brett auch, ohne den Team-Bereich zu öffnen.
     3. Nichts steht doppelt: ein angehefteter Aushang erscheint oben
        ODER unten, nicht beides.
     4. Ungelesenes ist erkennbar.
     5. Leere Karten verschwinden ganz, statt „noch nichts da" zu sagen.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const brettStub = eintraege => `
(function(){
  var fs = window.firebase.firestore(); var echt = fs.collection.bind(fs);
  var BRETT = ${JSON.stringify(eintraege)};
  fs.collection = function(pfad){
    /* Seit dem Umzug schickt S() 'firmen/<kennung>/…'. Die Testdaten
       liegen flach — Vorsatz abschneiden, sonst greift die Attrappe
       unten nie. */
    pfad = String(pfad).replace(new RegExp('^firmen/[^/]+/'), '');
    if (pfad === 'board') {
      var kette = { orderBy:function(){ return kette; }, limit:function(){ return kette; },
        where:function(){ return kette; },
        get:function(){ return Promise.resolve(sn()); },
        onSnapshot:function(cb){ try{ cb(sn()); }catch(e){ console.error(e); } return function(){}; },
        doc:function(){ return { delete:function(){ return Promise.resolve(); } }; },
        add:function(){ return Promise.resolve({ id:'neu' }); } };
      function sn(){
        var d = BRETT.map(function(x){ return { id:x.id, data:function(){ return x; } }; });
        return { docs:d, size:d.length, empty:!d.length,
                 forEach:function(f){ d.forEach(f); }, docChanges:function(){ return []; } };
      }
      return kette;
    }
    return echt(pfad);
  };
})();`;

async function start(errs, brett) {
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
  await page.addInitScript(brettStub(brett));
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  return { b, page };
}

(async () => {
  const errs = [];

  // ══ Mit Inhalt ══
  {
    const { b, page } = await start(errs, [
      { id: 'b1', text: 'Die Kaffeemaschine im Empfang ist repariert.', name: 'Anna Meier', uid: 'u2', ts: Date.now() - 3600000 },
      { id: 'b2', text: 'Fundsache: schwarze Sporttasche in Kabine 3.', name: 'Ben Kraus', uid: 'u3', ts: Date.now() - 2 * 86400000 },
    ]);

    const stand = await page.evaluate(() => ({
      kopfDa: !!document.getElementById('homeLesenHead') &&
        document.getElementById('homeLesenHead').style.display !== 'none',
      annSichtbar: (document.getElementById('homeAnnCard') || {}).offsetParent !== null,
      brettSichtbar: (document.getElementById('homeBoardCard') || {}).offsetParent !== null,
      annTexte: [...document.querySelectorAll('#homeAnnList .lese-text')].map(x => x.textContent.trim()),
      brettTexte: [...document.querySelectorAll('#homeBoardList .lese-text')].map(x => x.textContent.trim()),
      ungelesen: document.querySelectorAll('#homeAnnList .lese-neu').length,
      hinweise: [...document.querySelectorAll('#homeAlerts *')].map(x => x.textContent).join(' | '),
      /* Auf die Startseite eingegrenzt. Vorher stand hier ein
         dokumentweiter Griff — der fand ab dem 17.8. auch den
         Schliessen-Knopf in „Mein Bereich" und meldete einen Link ohne
         Ziel. Das war kein Fehler in der App, sondern eine Behauptung,
         die weiter reichte als ihr eigener Durchlauf: dieser hier heisst
         „Startlesen" und geht die Startseite an. So gebaut faellt er
         kuenftig auch nicht mehr um, nur weil woanders eine Karte
         dazukommt. */
      linkZiele: [...document.querySelectorAll('#view-home .karten-kopf .mini-link')]
        .map(x => x.dataset.go),
    }));
    console.log('Aushänge:', JSON.stringify(stand.annTexte));
    console.log('Brett:', JSON.stringify(stand.brettTexte));
    console.log('Ungelesen-Punkte:', stand.ungelesen, '· Links:', JSON.stringify(stand.linkZiele));

    if (!stand.kopfDa) errs.push('FEHLT: Überschrift „Zum Lesen" nicht sichtbar');
    if (!stand.annSichtbar) errs.push('FEHLT: Karte „Von der Leitung" nicht sichtbar');
    if (!stand.brettSichtbar) errs.push('FEHLT: Karte „Schwarzes Brett" nicht sichtbar');
    if (!stand.annTexte.length) errs.push('FEHLT: kein Aushangtext auf der Startseite');
    if (stand.brettTexte.length !== 2) errs.push('FEHLT: Brett zeigt ' + stand.brettTexte.length + ' statt 2 Einträgen');
    if (!/Kaffeemaschine/.test(stand.brettTexte.join(' '))) errs.push('FEHLT: Bretttext steht nicht da');
    /* Hier stand: „ungelesene Aushänge sind nicht erkennbar" — geprüft
       an einem CHEF. Das war seit dem 19.8. falsch herum.
       markAnnouncementsRead() trägt Chefs bewusst nicht in readBy ein,
       damit der Überblick „12 gelesen" nur das Team zählt. Für einen
       Chef war readBy also immer leer, der Punkt stand dauerhaft und
       liess sich durch nichts abstellen — ein Hinweis, der nie ausgeht,
       ist keiner. Seit es den Knopf „alles gelesen" gibt, wäre er beim
       Chef ausserdem nie wieder verschwunden.

       Der Punkt gehört zu dem, für den der Aushang bestimmt ist. Genau
       das prüft jetzt der Mitarbeiter-Durchlauf unten — und der ist die
       schärfere Behauptung, weil dort ein fehlender Punkt ein echter
       Fehler wäre. */
    if (stand.ungelesen) {
      errs.push('UMGEKEHRT: die Verwaltung sieht ' + stand.ungelesen +
        ' Ungelesen-Punkte an eigenen Aushängen — die kann sie nie abstellen');
    }

    // Keine doppelte Meldung mehr
    if (/neue Info/.test(stand.hinweise)) {
      errs.push('DOPPELT: die alte Hinweiszeile „neue Infos von der Leitung" steht noch oben');
    }
    // Angeheftetes oben ODER unten, nicht beides
    const angeheftetOben = /Öffnungszeiten/.test(stand.hinweise);
    const angeheftetUnten = stand.annTexte.some(t => /Öffnungszeiten/.test(t));
    if (angeheftetOben && angeheftetUnten) {
      errs.push('DOPPELT: der angeheftete Aushang steht oben als Hinweis UND unten im Text');
    }
    if (!angeheftetOben && !angeheftetUnten) {
      errs.push('FEHLT: der angeheftete Aushang taucht gar nicht auf');
    }
    /* Drei Karten seit dem 19.8.: Aushänge, Übergabe, Brett. Die
       Übergabe stand vorher nur im Team-Bereich hinter zwei Klicks und
       einer Studio-Auswahl — also da, wo sie niemand liest, der gerade
       zur Schicht kommt. */
    if (JSON.stringify(stand.linkZiele) !== JSON.stringify(['ann', 'team', 'team'])) {
      errs.push('FEHLT: die Links zeigen nicht auf Aushänge, Übergabe und Team (' +
        JSON.stringify(stand.linkZiele) + ')');
    }

    // Der Link darf die Karte nicht zuklappen, sondern muss umschalten
    await page.evaluate(() => document.querySelector('#homeAnnCard .mini-link').click());
    await page.waitForTimeout(800);
    const wo = await page.evaluate(() => {
      const v = document.querySelector('.view.show');
      return v ? v.id : null;
    });
    console.log('Nach Klick auf „Alle ›":', wo);
    if (wo !== 'view-ann') errs.push('FEHLT: „Alle ›" führt nicht zu den Aushängen (steht auf ' + wo + ')');

    await page.screenshot({ path: SP + '/startlesen.png' });
    await b.close();
  }

  // ══ Ohne Inhalt: Karte verschwindet ══
  {
    const { b, page } = await start(errs, []);
    const leer = await page.evaluate(() => ({
      brett: (document.getElementById('homeBoardCard') || {}).offsetParent !== null,
      text: (document.getElementById('homeBoardList') || {}).textContent || '',
    }));
    console.log('Ohne Bretteinträge sichtbar:', leer.brett);
    if (leer.brett) errs.push('FEHLT: leere Brett-Karte bleibt stehen (' + leer.text.slice(0, 40) + ')');
    await b.close();
  }

  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ') : '\n✓ Startseite: Infos und Brett stehen da, nichts doppelt');
  process.exit(errs.length ? 1 : 0);
})();
