/* ── Impressum und Datenschutz je Firma ──────────────────────────────
   Bis zum 11.8.2026 standen die Rechtsangaben in konfig.js. Diese Datei
   gilt für das ganze Firebase-Projekt — und seit mehrere Firmen in EINER
   Datenbank liegen, bekam der zweite Kunde damit entweder das Impressum
   von Körperformen zu sehen oder eine rote Warnung, die ihn an eine
   Datei schickte, an die er gar nicht herankommt. Impressumspflichtig
   ist aber jeder Betreiber selbst.

   Geprüft wird nicht, ob ein Formular da ist, sondern ob die richtigen
   Angaben beim richtigen Betrieb landen:

     1. Nichts in der Datenbank, EIGENE Firma: konfig.js gilt weiter.
        Ohne diesen Rückfall stünde der eigene Betrieb am Tag der
        Umstellung ohne Impressum da.
     2. Nichts in der Datenbank, FREMDE Firma: kein einziges Wort aus
        konfig.js. Genau dieser Fehler ist bei der Studioliste schon
        passiert — eine fremde Firma sah die vierzehn Standorte von
        Körperformen.
     3. Steht etwas in der Datenbank, gewinnt es gegen konfig.js —
        Impressum und Datenschutz, samt Ergänzungen.
     4. Auch eine fremde Firma sieht IHRE Angaben. Der Riegel aus 2. darf
        nicht so weit gehen, dass er den Kunden aussperrt.
     5. „konfig.js" kommt nirgends mehr im Text vor. Der Chef bekommt
        stattdessen den Weg in der App genannt, alle anderen einen
        reinen Hinweis ohne Handlungsaufforderung.
     6. Das Formular steht in Verwaltung → System und gehört dem Chef.
        Ein Studio-Leiter sieht den Bereich, aber nicht diese Karte.
     7. Gespeichert wird wirklich nach config/recht, mit allen Feldern,
        und die Ergänzungen werden zeilenweise zerlegt. Danach ist die
        Warnung weg.
     8. Bei einer fremden Firma ist das Formular LEER vorbelegt. Ein
        Vorschlag mit fremden Firmendaten wäre schlimmer als gar keiner.

   WAS HIER NICHT GEPRÜFT IST
   Ob die Sicherheitsregel greift — dass ein Mitarbeiter das Impressum
   lesen, aber nicht schreiben kann. Das misst der Emulator in
   tests/rules/security.test.js; hier läuft eine Attrappe, und die sagt
   über Regeln nichts aus.
   Ebenso wenig, ob die Texte rechtlich vollständig sind. Das kann kein
   Test beantworten.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
/* Über APP lässt sich eine andere Fassung einhängen — gebraucht für die
   Gegenprobe: eine absichtlich kaputte MUSS hier durchfallen. */
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];

/* Die Angaben, die in konfig.js stünden. Im Projekt ist der Block leer —
   für den Test muss er gefüllt sein, sonst wäre „Rückfall greift" von
   „Rückfall greift nicht" gar nicht zu unterscheiden. */
const AUS_KONFIG = {
  betreiber: 'Körperformen Köln GmbH',
  anschrift: 'Musterstraße 1, 50667 Köln',
  vertreten: 'Max Mustermann',
  telefon: '0221 1234567',
  email: 'info@koerperformen-test.de',
  register: 'Amtsgericht Köln, HRB 12345',
  ustId: 'DE123456789',
  datenschutzKontakt: 'datenschutz@koerperformen-test.de',
  zusatz: ['Im Eingangsbereich hängt eine Kamera.'],
};

/* Was ein zweiter Kunde selbst eingetragen hätte. Bewusst in jedem Feld
   anders, damit ein durchgerutschter Wert aus konfig.js auffällt. */
const AUS_DATENBANK = {
  betreiber: 'Studio Müller GmbH',
  anschrift: 'Bahnhofstraße 9, 40210 Düsseldorf',
  vertreten: 'Petra Müller',
  telefon: '0211 9876543',
  email: 'kontakt@mueller-test.de',
  register: 'Amtsgericht Düsseldorf, HRB 99887',
  ustId: 'DE987654321',
  datenschutzKontakt: 'ds@mueller-test.de',
  zusatz: ['Die Arbeitszeit wird an einem Terminal erfasst.'],
};

const WORTE_KONFIG = ['Körperformen Köln GmbH', 'Musterstraße 1', 'Max Mustermann',
  'HRB 12345', 'DE123456789', 'info@koerperformen-test.de',
  'datenschutz@koerperformen-test.de', 'Kamera'];

/* KONFIG wird von konfig.js gesetzt, nachdem unser Skript läuft —
   deshalb in einer kurzen Schleife nachlegen. Genauso macht es
   test-recht.js. */
const konfigRecht = daten => `
(function(){
  function anwenden(){ if (window.KONFIG) window.KONFIG.recht = ${JSON.stringify(daten)}; }
  anwenden();
  var iv = setInterval(function(){ if (window.KONFIG) { anwenden(); clearInterval(iv); } }, 3);
  setTimeout(function(){ clearInterval(iv); }, 3000);
})();`;

/* opt = { firma, recht, stub, konfig } */
async function start(opt) {
  opt = opt || {};
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));

  await page.addInitScript('window.__firma = ' + JSON.stringify(opt.firma || null) + ';' +
    'window.__recht = ' + JSON.stringify(opt.recht || null) + ';');
  await page.addInitScript({ path: path.join(SP, opt.stub || 'stub-chef.js') });
  await page.addInitScript(konfigRecht(opt.konfig || AUS_KONFIG));
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  return { b, page };
}

/* Das Rechtliches-Fenster öffnen und den Text beider Reiter holen. */
async function rechtText(page) {
  return page.evaluate(async () => {
    const auf = document.querySelector('[data-rechtauf="impressum"]');
    if (!auf) return { fehlt: 'kein Link zum Impressum' };
    auf.click();
    await new Promise(r => setTimeout(r, 400));
    const warn = document.querySelector('.recht-fehlt');
    const impressum = (document.getElementById('rechtInhalt') || {}).textContent || '';
    const ds = document.querySelector('[data-recht="datenschutz"]');
    if (ds) ds.click();
    await new Promise(r => setTimeout(r, 350));
    const datenschutz = (document.getElementById('rechtInhalt') || {}).textContent || '';
    return {
      warnung: warn ? warn.textContent : '',
      impressum, datenschutz,
      alles: impressum + ' ' + datenschutz,
    };
  });
}

/* Zum System-Reiter der Verwaltung. Über echte Klicks — showView und
   PREFS liegen nicht auf window. */
async function zumSystem(page) {
  await page.evaluate(async () => {
    const g = document.querySelector('.mobnav [data-group="g-chef"]');
    if (g) g.click();
    await new Promise(r => setTimeout(r, 400));
    const t = document.querySelector('#chefHome [data-cgo="system"]');
    if (t) t.click();
    await new Promise(r => setTimeout(r, 600));
  });
}

/* Sichtbarkeit, nicht Klassen: eine zugeklappte Karte hat height:0, ihre
   Felder stehen aber weiter im Baum. Gemessen wird deshalb die Fläche.
   Der Fehler beim Abo-Fenster kam genau daher — die Klasse sass richtig
   und hatte keine Wirkung. */
async function formularLage(page) {
  return page.evaluate(() => {
    const karte = document.querySelector('.card[data-fold="rechtform"]');
    if (!karte) return { karteDa: false };
    const sichtbar = el => {
      const r = el.getBoundingClientRect();
      return getComputedStyle(el).display !== 'none' && r.width > 0 && r.height > 0;
    };
    return {
      karteDa: true,
      karteSichtbar: sichtbar(karte),
      felder: [...karte.querySelectorAll('input,textarea')].map(e => e.id),
      knopf: !!karte.querySelector('#rfSave'),
    };
  });
}

/* Die Karte aufklappen und die Felder messen — zugeklappt ist sie im
   Baum, aber null Pixel hoch. */
async function formularOeffnen(page) {
  return page.evaluate(async () => {
    const karte = document.querySelector('.card[data-fold="rechtform"]');
    if (!karte) return null;
    if (karte.classList.contains('zu')) {
      const kopf = karte.querySelector('.fold-head');
      if (kopf) kopf.click();
      await new Promise(r => setTimeout(r, 600));
    }
    const werte = {};
    let hoch = 0;
    karte.querySelectorAll('input,textarea').forEach(e => {
      werte[e.id] = e.value;
      if (e.getBoundingClientRect().height > 0) hoch++;
    });
    return { werte, sichtbareFelder: hoch };
  });
}

(async () => {
  /* ══ 1. Nichts in der Datenbank, eigene Firma: konfig.js gilt ══
     Der Rückfall ist kein Schönheitsfehler, sondern der Grund, warum
     der eigene Betrieb die Umstellung überhaupt überlebt. */
  {
    const { b, page } = await start({});
    const t = await rechtText(page);
    console.log('1. Eigene Firma ohne Eintrag – Warnung:', JSON.stringify(t.warnung.slice(0, 60)));
    if (t.warnung) {
      errs.push('DER RÜCKFALL FEHLT: die eigene Firma hat nichts in der Datenbank und sieht ' +
                'trotzdem eine Warnung — konfig.js wird nicht mehr gelesen, und der eigene ' +
                'Betrieb stünde ohne Impressum da');
    }
    WORTE_KONFIG.forEach(w => {
      if (!t.alles.includes(w)) errs.push('FEHLT aus konfig.js beim eigenen Betrieb: ' + w);
    });
    await b.close();
  }

  /* ══ 2. Nichts in der Datenbank, FREMDE Firma: nichts aus konfig.js ══
     Der teuerste Fehler dieser Runde. Bei der Studioliste ist er schon
     passiert; er beendet jedes Verkaufsgespräch. */
  {
    const { b, page } = await start({ firma: 'mueller-7f3a' });
    const t = await rechtText(page);
    console.log('2. Fremde Firma ohne Eintrag – Warnung:', JSON.stringify(t.warnung.slice(0, 60)));
    WORTE_KONFIG.forEach(w => {
      if (t.alles.includes(w)) {
        errs.push('DATENVERWECHSLUNG: eine fremde Firma sieht „' + w + '" aus konfig.js — ' +
                  'das sind die Angaben von Körperformen in der App eines anderen Betriebs');
      }
    });
    if (!t.warnung) {
      errs.push('GEFÄHRLICH: eine fremde Firma ohne eigene Angaben bekommt KEINE Warnung — ' +
                'ein leeres Impressum sieht dann aus wie ein fertiges');
    }
    await b.close();
  }

  /* ══ 3. Datenbank schlägt konfig.js ══ */
  {
    const { b, page } = await start({ recht: AUS_DATENBANK });
    const t = await rechtText(page);
    console.log('3. Mit Eintrag – Warnung:', JSON.stringify(t.warnung),
      '· Länge Impressum/Datenschutz:', t.impressum.length + '/' + t.datenschutz.length);
    if (t.warnung) errs.push('FALSCH: alle Pflichtangaben stehen in der Datenbank, die Warnung bleibt');
    ['Studio Müller GmbH', 'Bahnhofstraße 9', 'Petra Müller', 'HRB 99887',
     'DE987654321', 'kontakt@mueller-test.de'].forEach(w => {
      if (!t.impressum.includes(w)) errs.push('FEHLT im Impressum aus der Datenbank: ' + w);
    });
    ['ds@mueller-test.de', 'Die Arbeitszeit wird an einem Terminal erfasst.'].forEach(w => {
      if (!t.datenschutz.includes(w)) errs.push('FEHLT im Datenschutz aus der Datenbank: ' + w);
    });
    WORTE_KONFIG.forEach(w => {
      if (t.alles.includes(w)) {
        errs.push('VERMISCHT: „' + w + '" aus konfig.js steht neben den Angaben aus der ' +
                  'Datenbank — dabei entsteht ein Impressum, das es nirgends gibt');
      }
    });
    if (/undefined|\[object/.test(t.alles)) errs.push('FEHLER: „undefined" steht im Text');
    await b.close();
  }

  /* ══ 4. Auch die fremde Firma sieht IHRE Angaben ══ */
  {
    const { b, page } = await start({ firma: 'mueller-7f3a', recht: AUS_DATENBANK });
    const t = await rechtText(page);
    console.log('4. Fremde Firma mit Eintrag – Warnung:', JSON.stringify(t.warnung));
    if (t.warnung) {
      errs.push('AUSGESPERRT: die fremde Firma hat ihre Angaben eingetragen und sieht ' +
                'trotzdem eine Warnung — der Riegel gegen konfig.js trifft den Kunden selbst');
    }
    if (!t.impressum.includes('Studio Müller GmbH')) {
      errs.push('FEHLT: die fremde Firma sieht ihr eigenes Impressum nicht');
    }
    await b.close();
  }

  /* ══ 5. Kein Verweis mehr auf konfig.js ══
     Ein Kunde, der eine Datei öffnen soll, die er nicht hat, ist
     schlechter dran als einer, der gar keinen Hinweis bekommt. */
  {
    const { b, page } = await start({ firma: 'mueller-7f3a' });   // ohne Eintrag → Warnung steht
    const t = await rechtText(page);
    await zumSystem(page);
    const karte = await page.evaluate(() => {
      const k = document.getElementById('rechtKarte');
      return {
        sichtbar: k ? getComputedStyle(k).display !== 'none' : null,
        text: (document.getElementById('rechtFehltText') || {}).textContent || '',
      };
    });
    console.log('5. Warnung Chef – Fenster:', JSON.stringify(t.warnung.slice(0, 110)));
    console.log('5. Warnung Chef – Systemkarte:', JSON.stringify(karte.text.slice(0, 110)));
    [['Fenster', t.warnung], ['Systemkarte', karte.text]].forEach(([wo, txt]) => {
      if (/konfig\.js/i.test(txt)) {
        errs.push('DER FALSCHE WEG (' + wo + '): der Hinweis schickt den Kunden nach ' +
                  '„konfig.js" — eine Datei, an die er gar nicht herankommt');
      }
    });
    if (!karte.sichtbar) errs.push('FEHLT: die Warnkarte im System-Bereich steht nicht da');
    if (!/System/.test(t.warnung)) {
      errs.push('FEHLT: der Chef erfährt im Fenster nicht, WO in der App er es einträgt');
    }
    if (!/Rechtliche Angaben/.test(karte.text)) {
      errs.push('FEHLT: die Systemkarte nennt nicht die Karte, in der es einzutragen ist');
    }
    await b.close();
  }

  /* ══ 5b. Für alle anderen bleibt es ein Hinweis ══
     Ein Mitarbeiter kann das Impressum nicht eintragen. Ihn dazu
     aufzufordern erzeugt nur ein schlechtes Gewissen und eine Rückfrage.

     Die Lücke entsteht hier über ein LEERES konfig.js statt über eine
     fremde Firma: der Mitarbeiter-Stub kennt window.__firma nicht, und
     für diese Frage macht es keinen Unterschied — der Text hängt an der
     Rolle, nicht an der Firma. */
  {
    const { b, page } = await start({ stub: 'stub-mitarbeiter.js', konfig: {} });
    const t = await rechtText(page);
    console.log('5b. Warnung Mitarbeiter:', JSON.stringify(t.warnung.slice(0, 110)));
    if (/konfig\.js/i.test(t.warnung)) {
      errs.push('DER FALSCHE WEG (Mitarbeiter): der Hinweis nennt „konfig.js"');
    }
    if (/Einzutragen|trag ein|Trage /i.test(t.warnung)) {
      errs.push('FALSCHER ADRESSAT: der Mitarbeiter wird aufgefordert, das Impressum ' +
                'einzutragen — er darf und kann es gar nicht');
    }
    if (!t.warnung) errs.push('FEHLT: dem Mitarbeiter wird die Lücke gar nicht gezeigt');
    await b.close();
  }

  /* ══ 6. Das Formular: beim Chef da, beim Studio-Leiter nicht ══ */
  {
    const { b, page } = await start({});
    await zumSystem(page);
    const lage = await formularLage(page);
    console.log('6. Formular beim Chef:', JSON.stringify(lage));
    if (!lage.karteDa) errs.push('FEHLT: die Karte „Rechtliche Angaben" gibt es nicht');
    else {
      if (!lage.karteSichtbar) errs.push('FEHLT: die Karte steht im Baum, ist aber nicht zu sehen');
      if (!lage.knopf) errs.push('FEHLT: die Karte hat keinen Speichern-Knopf');
      ['rfBetreiber', 'rfAnschrift', 'rfVertreten', 'rfTelefon', 'rfEmail',
       'rfRegister', 'rfUstId', 'rfDsKontakt', 'rfZusatz'].forEach(id => {
        if (lage.felder.indexOf(id) < 0) errs.push('FEHLT im Formular das Feld ' + id);
      });
    }
    await b.close();
  }
  {
    const { b, page } = await start({ stub: 'stub-leiter.js' });
    await zumSystem(page);
    const lage = await formularLage(page);
    console.log('6b. Formular beim Studio-Leiter:', JSON.stringify(lage));
    if (lage.karteDa && lage.karteSichtbar) {
      errs.push('ZU VIEL: der Studio-Leiter sieht das Formular für die Rechtsangaben — ' +
                'ändern darf es nur der Chef, und die Regel lässt ihn auch nicht');
    }
    await b.close();
  }

  /* ══ 7. Speichern landet wirklich in config/recht ══ */
  {
    const { b, page } = await start({});
    await zumSystem(page);
    await formularOeffnen(page);
    const ergebnis = await page.evaluate(async () => {
      const setz = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
      setz('rfBetreiber', 'Studio Müller GmbH');
      setz('rfAnschrift', 'Bahnhofstraße 9, 40210 Düsseldorf');
      setz('rfVertreten', 'Petra Müller');
      setz('rfTelefon', '0211 9876543');
      setz('rfEmail', 'kontakt@mueller-test.de');
      setz('rfRegister', 'Amtsgericht Düsseldorf, HRB 99887');
      setz('rfUstId', 'DE987654321');
      setz('rfDsKontakt', 'ds@mueller-test.de');
      // Mittendrin eine Leerzeile: die darf nicht als leerer Absatz landen
      setz('rfZusatz', 'Erster Absatz.\n\n  Zweiter Absatz.  \n');
      document.getElementById('rfSave').click();
      await new Promise(r => setTimeout(r, 700));
      const geschrieben = (window.__schreib || [])
        .filter(x => /config\/recht$/.test(x.pfad));
      return {
        geschrieben,
        notiz: (document.getElementById('rfNote') || {}).textContent || '',
        karteNochDa: getComputedStyle(document.getElementById('rechtKarte')).display !== 'none',
      };
    });
    console.log('7. Geschrieben:', JSON.stringify(ergebnis.geschrieben).slice(0, 320));
    console.log('7. Notiz:', JSON.stringify(ergebnis.notiz));
    if (!ergebnis.geschrieben.length) {
      errs.push('NICHTS GESPEICHERT: der Knopf schreibt nichts nach config/recht — ' +
                'der Chef trägt ein, drückt Speichern und alles ist beim nächsten Start weg');
    } else {
      const d = ergebnis.geschrieben[0].daten || {};
      const soll = {
        betreiber: 'Studio Müller GmbH', anschrift: 'Bahnhofstraße 9, 40210 Düsseldorf',
        vertreten: 'Petra Müller', telefon: '0211 9876543',
        email: 'kontakt@mueller-test.de', register: 'Amtsgericht Düsseldorf, HRB 99887',
        ustId: 'DE987654321', datenschutzKontakt: 'ds@mueller-test.de',
      };
      Object.keys(soll).forEach(k => {
        if (d[k] !== soll[k]) {
          errs.push('FALSCH GESPEICHERT: ' + k + ' = ' + JSON.stringify(d[k]) +
                    ' statt ' + JSON.stringify(soll[k]));
        }
      });
      const z = d.zusatz;
      if (!Array.isArray(z) || z.length !== 2 || z[0] !== 'Erster Absatz.' || z[1] !== 'Zweiter Absatz.') {
        errs.push('FALSCH GESPEICHERT: die Ergänzungen sind ' + JSON.stringify(z) +
                  ' — erwartet waren zwei Absätze ohne Leerzeile und ohne Leerzeichen am Rand');
      }
    }
    if (ergebnis.karteNochDa) {
      errs.push('BLEIBT STEHEN: nach dem Speichern steht die Warnung „Rechtliches ist ' +
                'unvollständig" weiter da, obwohl alles ausgefüllt ist');
    }
    if (!/Gespeichert/.test(ergebnis.notiz)) {
      errs.push('FEHLT: nach dem Speichern sagt nichts, dass es geklappt hat (Notiz: „' +
                ergebnis.notiz + '")');
    }
    await b.close();
  }

  /* ══ 8. Bei einer fremden Firma ist das Formular leer ══
     Ein Vorschlag mit den Daten eines anderen Betriebs wäre schlimmer
     als gar keiner: er wird abgenickt und dann steht er drin. */
  {
    const { b, page } = await start({ firma: 'mueller-7f3a' });
    await zumSystem(page);
    const auf = await formularOeffnen(page);
    console.log('8. Vorbelegung fremde Firma:', JSON.stringify(auf && auf.werte),
      '· sichtbare Felder:', auf && auf.sichtbareFelder);
    if (!auf) errs.push('FEHLT: bei der fremden Firma gibt es die Formularkarte nicht');
    else {
      if (auf.sichtbareFelder < 9) {
        errs.push('FEHLT: aufgeklappt sind nur ' + auf.sichtbareFelder +
                  ' von 9 Feldern zu sehen');
      }
      Object.keys(auf.werte).forEach(id => {
        const v = String(auf.werte[id] || '');
        WORTE_KONFIG.forEach(w => {
          if (v.includes(w)) {
            errs.push('VORBELEGT MIT FREMDEM: im Feld ' + id + ' schlägt die App „' + w +
                      '" vor — die Angaben von Körperformen im Formular eines Kunden');
          }
        });
      });
    }
    await b.close();
  }

  /* ══ 8b. Bei der EIGENEN Firma ist die Vorbelegung erwünscht ══
     Wer die Angaben schon in konfig.js hatte, soll sie nicht abtippen. */
  {
    const { b, page } = await start({});
    await zumSystem(page);
    const auf = await formularOeffnen(page);
    console.log('8b. Vorbelegung eigene Firma – Betreiber:',
      JSON.stringify(auf && auf.werte && auf.werte.rfBetreiber));
    if (!auf || auf.werte.rfBetreiber !== AUS_KONFIG.betreiber) {
      errs.push('FEHLT: beim eigenen Betrieb ist das Formular nicht mit dem vorbelegt, ' +
                'was heute schon gilt — dann tippt jemand alles ab und macht dabei Fehler');
    }
    await b.close();
  }

  /* ══ 9. Der Fall, der beinahe durchgerutscht wäre ══
     Eine fremde Firma, VOR dem Anmelden. Für sie greift der Rückfall auf
     konfig.js bewusst nicht — ihre Angaben stehen nur in der Datenbank.
     Wird die dort nicht gelesen, sieht der Besucher auf dem
     Anmeldebildschirm eine Warnung statt eines Impressums. Und ein
     Impressum hinter einem Login ist keins (§ 5 DDG: „leicht erkennbar,
     unmittelbar erreichbar").

     Warum es beinahe durchgerutscht wäre: bei der EIGENEN Firma fällt es
     nicht auf. Dort füllt konfig.js die Lücke, und alles sieht richtig
     aus. Dieselbe Blindstelle wie beim Standort-Leck. */
  {
    const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
    await page.route('**://www.gstatic.com/**', r => r.abort());
    await page.route('**fonts.googleapis.com/**', r => r.abort());
    await page.addInitScript(`window.__recht = ${JSON.stringify({
      betreiber: 'Studio Müller GmbH', anschrift: 'Bahnhofstr. 9, 50321 Brühl',
      vertreten: 'Petra Müller', email: 'kontakt@mueller.example',
      telefon: '02232 999888'
    })};`);
    await page.addInitScript({ path: path.join(SP, 'stub-ohne-login.js') });
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2200);

    const lage = await page.evaluate(async () => {
      const auf = document.querySelector('[data-rechtauf="impressum"]');
      if (auf) auf.click();
      await new Promise(r => setTimeout(r, 500));
      const box = document.getElementById('rechtInhalt');
      return {
        offen: !!auf,
        text: box ? box.textContent : '',
        warnung: !!(box && box.querySelector('.recht-fehlt'))
      };
    });
    console.log('9. Fremde Firma vor dem Anmelden – Text enthält den Betreiber:',
      lage.text.indexOf('Studio Müller GmbH') >= 0, '· Warnung:', lage.warnung);
    if (!lage.offen) {
      errs.push('AUFBAU: das Rechtliches-Fenster lässt sich ohne Anmeldung nicht öffnen');
    } else {
      if (lage.text.indexOf('Studio Müller GmbH') < 0) {
        errs.push('DAS IMPRESSUM HINTER DEM LOGIN: eine fremde Firma zeigt ihre Angaben ' +
                  'vor dem Anmelden nicht — genau dann, wenn sie gebraucht werden');
      }
      if (lage.warnung) {
        errs.push('FALSCH: es steht eine Warnung da, obwohl die Angaben vollständig sind');
      }
      /* Gegenrichtung: es dürfen NICHT die Angaben aus konfig.js
         auftauchen. Die gehören einem anderen Betrieb. */
      if (/Musterstudio|Körperformen/i.test(lage.text)) {
        errs.push('DATENVERWECHSLUNG: vor dem Anmelden zeigt eine fremde Firma ' +
                  'Angaben aus konfig.js');
      }
    }
    await b.close();
  }

  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Rechtsangaben je Firma: Datenbank schlägt konfig.js, der Rückfall bleibt der ' +
      'eigenen Firma vorbehalten, ohne Anmeldung sichtbar, und der Chef trägt sie in der App ein');
  process.exit(errs.length ? 1 : 0);
})();
