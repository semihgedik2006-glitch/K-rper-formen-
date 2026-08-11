/* ── Der Betreiber-Bereich ────────────────────────────────────────────
   WARUM ES DIESEN DURCHLAUF GIBT
   Der Admin-Bereich ist der Teil, der verkauft wird — und er hatte bis
   zum 11. August 2026 keinen einzigen Oberflächen-Test. Aufgefallen,
   als beim ersten echten Löschen im Betrieb der Eindruck entstand: „die
   Firma ist komplett weg."

   Sie war es nicht. Der Knopf hatte funktioniert, das Archiv war
   gefüllt — aber die Karte „🗄 Gelöschte Firmen" ist standardmässig
   zugeklappt, und zugeklappt sieht aus wie leer. Kein Fehler in der
   Sache, ein Fehler in der Auskunft. Bei einer Löschfunktion ist das
   derselbe Schrecken.

   Geprüft wird deshalb beides: dass der Bereich für den Betreiber da
   ist, und dass er auch ZUGEKLAPPT sagt, dass etwas drinliegt.

   Und die Gegenrichtung, die hier am meisten zählt: ein Chef ohne
   admin-Feld darf den Bereich gar nicht sehen.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];

async function start(opt) {
  opt = opt || {};
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) {
      errs.push('CONSOLE: ' + m.text().slice(0, 160));
    }
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  if (opt.admin) {
    await page.addInitScript(`
      window.__admin = true;
      window.__firmenArchiv = ${JSON.stringify(opt.archiv || [])};
      window.__firmen = ${JSON.stringify(opt.firmen || [])};
      window.__abos = ${JSON.stringify(opt.abos || {})};`);
  }
  await page.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  return { b, page };
}

async function zumFirmenReiter(page) {
  await page.evaluate(() => {
    const g = document.querySelector('.mobnav [data-group="g-chef"]');
    if (g) g.click();
  });
  await page.waitForTimeout(400);
  return page.evaluate(() => {
    const t = document.querySelector('#chefHome [data-cgo="firmen"]');
    if (!t) return false;
    t.click();
    return true;
  });
}

(async () => {
  const ARCHIV = [{
    id: 'mueller-7f3a', name: 'Studio Müller GmbH',
    geloeschtAm: Date.now() - 3600000, zahlStudios: 3, zahlKontenBeimLoeschen: 5
  }];

  // ══ 1. Der Betreiber sieht den Bereich ══
  {
    const { b, page } = await start({ admin: true, archiv: ARCHIV });
    const da = await zumFirmenReiter(page);
    if (!da) errs.push('FEHLT: der Reiter „Firmen" ist für den Betreiber nicht da');
    await page.waitForTimeout(700);

    const stand = await page.evaluate(() => {
      const karte = document.querySelector('.card[data-fold="firmaarchiv"]');
      const liste = document.getElementById('firmenArchivListe');
      const zahl = karte ? karte.querySelector('.fold-num') : null;
      return {
        karteDa: !!karte,
        zugeklappt: karte ? karte.classList.contains('zu') : null,
        zahlText: zahl ? zahl.textContent.trim() : null,
        text: liste ? liste.textContent : '',
        zurueck: !!(liste && liste.querySelector('[data-fzurueck]')),
        studioFeld: !!document.getElementById('fnStudios')
      };
    });
    console.log('Archiv-Karte:', JSON.stringify(stand));

    if (!stand.karteDa) errs.push('FEHLT: die Karte „Gelöschte Firmen" gibt es nicht');
    if (!stand.studioFeld) errs.push('FEHLT: kein Feld für die Studiozahl beim Anlegen');
    if (stand.text.indexOf('Studio Müller') < 0) {
      errs.push('FEHLT: die gelöschte Firma steht nicht in der Liste');
    }
    if (!stand.zurueck) errs.push('FEHLT: kein Knopf zum Zurückholen');
    /* Der eigentliche Punkt dieses Durchlaufs: die Zahl neben der
       Überschrift. Ohne sie sieht eine zugeklappte Karte aus wie eine
       leere — und eine gelöschte Firma wie eine verlorene. */
    if (stand.zugeklappt && !stand.zahlText) {
      errs.push('DAS EIGENTLICHE PROBLEM: die Karte ist zu und sagt nicht, ' +
                'dass etwas drinliegt — genau so entsteht der Eindruck ' +
                '„die Firma ist komplett weg"');
    }
    await b.close();
  }

  // ══ 2. Ohne Archiv keine Zahl ══
  //    Sonst stünde dort dauerhaft eine Ziffer, und die Zahl bedeutete
  //    nichts mehr.
  {
    const { b, page } = await start({ admin: true, archiv: [] });
    await zumFirmenReiter(page);
    await page.waitForTimeout(700);
    const zahl = await page.evaluate(() => {
      const k = document.querySelector('.card[data-fold="firmaarchiv"]');
      const n = k ? k.querySelector('.fold-num') : null;
      return n ? n.textContent.trim() : '';
    });
    console.log('Ohne Archiv, Zahl:', JSON.stringify(zahl));
    if (zahl) errs.push('FALSCH: leeres Archiv zeigt trotzdem eine Zahl (' + zahl + ')');
    await b.close();
  }

  /* ══ 2b. Das Abo — und das Gratis-Abo im Besonderen ══
     „Gib mir die Möglichkeit, Gratis-Abos zu vergeben, für meinen Chef
     natürlich." Genau das wird hier geklickt. */
  {
    const { b, page } = await start({
      admin: true,
      firmen: [{ id:'mueller-7f3a', name:'Studio Müller GmbH', aktiv:true }],
      abos:  { 'mueller-7f3a': { stufe:'premium', status:'gratis', netto:0,
                                 bisAm:null, gesetztAm: Date.now() } }
    });
    await zumFirmenReiter(page);
    await page.waitForTimeout(900);

    const zeile = await page.evaluate(() => {
      const box = document.getElementById('firmenListe');
      return {
        text: box ? box.textContent : '',
        knopf: !!(box && box.querySelector('[data-abo]'))
      };
    });
    console.log('Abo-Zeile:', JSON.stringify(zeile.text.slice(0, 160)));
    if (!/gratis/i.test(zeile.text)) {
      errs.push('FEHLT: das Gratis-Abo steht nicht in der Firmenliste');
    }
    /* Ein Gratis-Abo darf keinen Betrag zeigen. Ein „0,00 €/Monat"
       daneben klingt nach Rechnung, und genau das soll es nicht sein. */
    if (/0,00\s*€/.test(zeile.text)) {
      errs.push('FALSCH: beim Gratis-Abo steht ein Betrag daneben');
    }
    if (!zeile.knopf) errs.push('FEHLT: kein Knopf zum Ändern des Abos');

    // Das Fenster öffnen und nachsehen, ob das Preisfeld verschwindet
    const dialog = await page.evaluate(() => {
      const b = document.querySelector('[data-abo]');
      if (!b) return null;
      b.click();
      const auf = document.getElementById('aboModal').classList.contains('show');
      const preisWeg = getComputedStyle(document.getElementById('aboPreisFeld')).display === 'none';
      return { auf: auf, status: document.getElementById('aboStatus').value,
               stufe: document.getElementById('aboStufe').value, preisWeg: preisWeg };
    });
    console.log('Abo-Fenster:', JSON.stringify(dialog));
    if (!dialog || !dialog.auf) errs.push('FEHLT: das Abo-Fenster geht nicht auf');
    else {
      if (dialog.status !== 'gratis') errs.push('FALSCH: das Fenster zeigt nicht den gespeicherten Zustand');
      if (dialog.stufe !== 'premium') errs.push('FALSCH: das Fenster zeigt nicht die gespeicherte Stufe');
      /* Kein Preisfeld bei gratis — sonst trägt jemand einen Betrag ein,
         der nie berechnet wird, und wundert sich später. */
      if (!dialog.preisWeg) errs.push('FALSCH: bei „gratis" steht trotzdem ein Preisfeld da');
    }

    // Und die Gegenprobe: bei „aktiv" MUSS das Preisfeld wieder da sein
    const zurueck = await page.evaluate(() => {
      const s = document.getElementById('aboStatus');
      s.value = 'aktiv';
      s.dispatchEvent(new Event('change'));
      return getComputedStyle(document.getElementById('aboPreisFeld')).display !== 'none';
    });
    if (!zurueck) {
      errs.push('GEGENPROBE: bei „läuft" fehlt das Preisfeld auch — ' +
                'dann prüft die Zeile darüber nichts');
    }
    await b.close();
  }

  // ══ 3. Gegenprobe: ein Chef OHNE admin sieht den Bereich nicht ══
  //    Die wichtigste Prüfung hier. Der Reiter ist keine Sicherheits-
  //    grenze — die stehen in den Regeln — aber wer ihn sieht, hält
  //    sich für den Betreiber.
  {
    const { b, page } = await start({ admin: false });
    const da = await zumFirmenReiter(page);
    console.log('Chef ohne admin, Reiter da:', da);
    if (da) errs.push('GEFÄHRLICH: ein Chef ohne admin sieht den Betreiber-Bereich');
    const karte = await page.evaluate(() =>
      !!document.querySelector('.card[data-fold="firmaarchiv"] .fold-num'));
    if (karte) errs.push('GEFÄHRLICH: ein Chef ohne admin sieht die Archiv-Zahl');
    await b.close();
  }

  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Betreiber-Bereich: Studiozahl, Archiv mit Zahl auch zugeklappt, für andere unsichtbar');
  process.exit(errs.length ? 1 : 0);
})();
