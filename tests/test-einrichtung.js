/* ── Die Einrichtungs-Karte ───────────────────────────────────────────
   Die Liste hakt sich SELBST ab; es gibt keine Kästchen. Was grün steht,
   ist an den Daten geprüft. Eine Liste, die man abhaken kann, ohne etwas
   zu tun, ist nach zwei Tagen eine Lüge — bei „Impressum vollständig"
   eine teure.

     1. Frischer Betrieb: die Karte steht da und nennt, was fehlt.
     2. Erledigtes wird als erledigt erkannt, an den echten Daten.
     3. Ist alles fertig, verschwindet die Karte ganz.
     4. Ein Mitarbeiter sieht sie nie — er kann keinen der Schritte tun.
     5. Der Firmencode ist nur für den Chef lesbar. Schlägt das Lesen
        fehl, heisst das „weiss ich nicht", und der Schritt darf dann
        NICHT als offen dastehen: sonst schickt die Karte jemanden auf
        eine Aufgabe, die längst erledigt ist.

   Zum Aufbau: die Liste in config/studios besteht aus Objekten
   {id, name}, nicht aus Namen. Mit Zeichenketten filtert
   studioListeSetzen() alles weg, und der Durchlauf meldet dann Fehler in
   der App, die es nicht gibt.
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
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript(
    'window.__studios = ' + JSON.stringify(opt.studios || null) + ';' +
    'window.__recht = ' + JSON.stringify(opt.recht || null) + ';' +
    'window.__regCode = ' + JSON.stringify(opt.regCode === undefined ? null : opt.regCode) + ';' +
    'window.__regKaputt = ' + (opt.regKaputt ? 'true' : 'false') + ';' +
    'window.__firma = ' + JSON.stringify(opt.firma || null) + ';');
  await page.addInitScript({ path: path.join(SP, opt.stub || 'stub-chef.js') });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  return { b, page };
}

async function karte(page) {
  return page.evaluate(() => {
    const k = document.getElementById('setupCard');
    if (!k) return { da: false };
    const sicht = getComputedStyle(k).display !== 'none';
    const zeilen = [].slice.call(document.querySelectorAll('#setupListe .setup-zeile'))
      .map(z => ({
        titel: (z.querySelector('b') || {}).textContent || '',
        fertig: z.classList.contains('fertig')
      }));
    const z = document.getElementById('setupZahl');
    return { da: true, sicht, zahl: z ? z.textContent : '', zeilen };
  });
}

(async () => {
  /* ══ 1. Frischer Betrieb ══
     Neutrale Studionamen (so legt firmaAnlegen sie an), kein Impressum,
     kein Firmencode. Alles offen ausser dem, was der Stub mitbringt. */
  {
    const { b, page } = await start({
      firma: 'mueller-7f3a',
      studios: { liste: [{id:'studio-0',name:'Studio 1'},{id:'studio-1',name:'Studio 2'}], naechste: 2 },
      regCode: ''
    });
    const k = await karte(page);
    console.log('1. Frisch:', JSON.stringify(k.zahl), k.zeilen.map(z => (z.fertig ? '✓' : '○') + z.titel).join(' | '));
    if (!k.da) errs.push('FEHLT: die Einrichtungs-Karte gibt es nicht');
    else if (!k.sicht) errs.push('FEHLT: bei einem frischen Betrieb steht die Karte nicht da');
    else {
      const offen = k.zeilen.filter(z => !z.fertig).map(z => z.titel);
      ['Studios benennen', 'Rechtliche Angaben eintragen', 'Firmencode setzen']
        .forEach(t => {
          if (!offen.some(o => o.indexOf(t) >= 0)) {
            errs.push('FALSCH: „' + t + '" gilt als erledigt, obwohl nichts hinterlegt ist');
          }
        });
      if (!k.zahl) errs.push('FEHLT: es steht nicht dabei, wie viel noch offen ist');
    }
    await b.close();
  }

  /* ══ 2. Was getan ist, wird erkannt ══
     Eigene Studionamen und ein vollständiges Impressum in der Datenbank.
     Beides muss die Karte an den DATEN sehen, nicht an einem Häkchen. */
  {
    const { b, page } = await start({
      firma: 'mueller-7f3a',
      studios: { liste: [{id:'studio-0',name:'Bahnhofstraße'},{id:'studio-1',name:'Marktplatz'}], naechste: 2 },
      recht: { betreiber: 'Studio Müller GmbH', anschrift: 'Bahnhofstr. 9, 50321 Brühl',
               vertreten: 'Petra Müller', email: 'kontakt@mueller.example' },
      regCode: 'GEHEIM2026'
    });
    const k = await karte(page);
    console.log('2. Teils erledigt:', k.zeilen.map(z => (z.fertig ? '✓' : '○') + z.titel).join(' | '));
    const fertig = k.zeilen.filter(z => z.fertig).map(z => z.titel).join(' | ');
    ['Studios benennen', 'Rechtliche Angaben eintragen', 'Firmencode setzen'].forEach(t => {
      if (fertig.indexOf(t) < 0) {
        errs.push('NICHT ERKANNT: „' + t + '" ist erledigt, die Karte sieht es aber nicht — ' +
                  'dann schickt sie den Kunden auf eine Aufgabe, die er schon gemacht hat');
      }
    });
    await b.close();
  }

  /* ══ 3. Alles fertig → Karte weg ══
     Der Stub bringt Team und Aufgaben mit; mit Studios, Recht und Code
     ist damit alles beisammen. */
  {
    const { b, page } = await start({
      studios: { liste: [{id:'studio-6',name:'Hürth'},{id:'studio-7',name:'Brühl'}], naechste: 8 },
      recht: { betreiber: 'Körperformen Köln GmbH', anschrift: 'Musterstr. 1, 50667 Köln',
               vertreten: 'Max Mustermann', email: 'info@example.de' },
      regCode: 'GEHEIM2026'
    });
    const k = await karte(page);
    console.log('3. Alles fertig, Karte sichtbar:', k.sicht);
    if (k.sicht) {
      errs.push('MÖBEL: die Einrichtungs-Karte steht noch da, obwohl alles erledigt ist (offen: ' +
                k.zeilen.filter(z => !z.fertig).map(z => z.titel).join(', ') + ')');
    }
    await b.close();
  }

  // ══ 4. Der Mitarbeiter sieht sie nie ══
  {
    const { b, page } = await start({
      stub: 'stub-mitarbeiter.js',
      studios: { liste: [{id:'studio-0',name:'Studio 1'},{id:'studio-1',name:'Studio 2'}], naechste: 2 }
    });
    const k = await karte(page);
    console.log('4. Mitarbeiter, Karte sichtbar:', k.sicht);
    if (k.sicht) {
      errs.push('FALSCHER ADRESSAT: ein Mitarbeiter sieht die Einrichtungs-Liste — ' +
                'er kann keinen einzigen dieser Schritte tun');
    }
    await b.close();
  }

  /* ══ 5. „Weiss ich nicht" ist nicht „offen" ══
     Der Firmencode ist absichtlich für niemanden lesbar. Schlägt das
     Lesen fehl, darf die Karte NICHT behaupten, er sei nicht gesetzt. */
  {
    const { b, page } = await start({
      studios: { liste: [{id:'studio-6',name:'Hürth'},{id:'studio-7',name:'Brühl'}], naechste: 8 },
      recht: { betreiber: 'Körperformen Köln GmbH', anschrift: 'Musterstr. 1',
               vertreten: 'Max Mustermann', email: 'info@example.de' },
      regKaputt: true
    });
    const k = await karte(page);
    console.log('5. Code nicht lesbar, Karte sichtbar:', k.sicht);
    if (k.sicht) {
      const offen = k.zeilen.filter(z => !z.fertig).map(z => z.titel).join(', ');
      if (offen.indexOf('Firmencode') >= 0) {
        errs.push('RATEN STATT WISSEN: der Code ist nicht lesbar, und die Karte behauptet, ' +
                  'er sei nicht gesetzt');
      }
    }
    await b.close();
  }

  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Einrichtung: hakt sich selbst ab, verschwindet wenn fertig, nur für den Chef');
  process.exit(errs.length ? 1 : 0);
})();
