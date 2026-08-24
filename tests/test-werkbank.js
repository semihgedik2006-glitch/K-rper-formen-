/* ── Die Werkbank ─────────────────────────────────────────────────────
   Der versteckte Bereich hinter sieben Tipps auf die Marke.

   Die Behauptungen, in der Reihenfolge ihrer Wichtigkeit:

     1. GEGENPROBE ZUERST: ein Mitarbeiter, der siebenmal tippt, bekommt
        NICHTS. Kein Fenster, keine Meldung, kein Hinweis. Das ist die
        Behauptung, die zaehlt — alles andere waere nur Bequemlichkeit.
     2. Sechs Tipps oeffnen nichts. Sonst prueft Punkt 3 nur, dass
        irgendein Klick irgendwas tut.
     3. Sieben Tipps oeffnen sie beim Betreiberkonto.
     4. Die Marke tut dabei weiter, wofuer sie da ist: sie fuehrt zur
        Startseite. Ein Griff, der die eigentliche Aufgabe kaputtmacht,
        ist ein schlechter Griff.
     5. Was gezaehlt wird, enthaelt KEINE Person. Geprueft am
        tatsaechlichen Schreibvorgang: die Attrappe haelt fest, was an
        die Datenbank geht, und darin darf weder uid noch Name noch ein
        Zeitstempel stehen — nur tag, starts, ansichten.
     6. Die vier Seiten bauen sich auf und zeigen Zahlen, keine Namen.
     7. Eine nie geoeffnete Ansicht wird als solche benannt. Das ist der
        Grund, warum es die Zaehlung gibt.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function start(stub, errs, extra) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 160));
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  /* VOR der Attrappe, nicht danach. window.__admin liest sie beim Laden
     — steht es erst hinterher da, bleibt das Konto ein gewoehnlicher
     Chef, und der Durchlauf prueft die Werkbank nie. Genau so ist er
     beim ersten Versuch gruen-durch-Zufall gewesen: „Betreiberkonto
     erkannt: false". */
  if (extra) await page.addInitScript(extra);
  await page.addInitScript({ path: SP + '/' + stub });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  return { b, page };
}

const tippen = (page, n) => page.evaluate(anz => {
  const el = document.getElementById('tbHome');
  for (let i = 0; i < anz; i++) el.click();
}, n);

const offen = page => page.evaluate(() =>
  !!document.getElementById('werkbankModal') &&
  document.getElementById('werkbankModal').classList.contains('show'));

(async () => {
  const errs = [];

  /* ══ 1. Gegenprobe: der Mitarbeiter ══
     Steht bewusst an erster Stelle. Ginge sie schief, waere alles
     Weitere gleichgueltig. */
  {
    const { b, page } = await start('stub-mitarbeiter.js', errs);
    await tippen(page, 12);
    await page.waitForTimeout(500);
    const auf = await offen(page);
    const toast = await page.evaluate(() => (document.getElementById('toast') || {}).textContent || '');
    console.log('Mitarbeiter nach 12 Tipps — offen:', auf, '· Toast:', JSON.stringify(toast.slice(0, 60)));
    if (auf) errs.push('LECK: ein Mitarbeiter bekommt die Werkbank zu sehen');
    if (/werkbank|geheim|admin/i.test(toast)) {
      errs.push('VERRATEN: der Mitarbeiter bekommt einen Hinweis, dass es da etwas gibt: „' + toast + '"');
    }
    await b.close();
  }

  /* ══ 2–7. Das Betreiberkonto ══ */
  {
    /* Zwei Tage Zahlen, damit die Funktionsseite etwas zu zeigen hat.
       „putzplan" fehlt mit Absicht: er ist die nie geoeffnete Ansicht,
       an der Punkt 7 haengt. */
    const { b, page } = await start('stub-chef.js', errs, `
      window.__admin = true;
      window.__statistik = [
        { id:'heute',   tag:'heute',   starts:{'studio-6':9},
          ansichten:{ home:40, chat:22, todos:15, ich:3 } },
        { id:'gestern', tag:'gestern', starts:{'studio-6':7},
          ansichten:{ home:31, chat:18, todos:9 } }
      ];
    `);

    /* Nicht über offsetParent: die Elemente mit data-admin-only stehen
       in der Verwaltung, also in einer Ansicht, die gerade zu ist —
       offsetParent wäre dort auch beim Betreiber null. Die App setzt
       style.display direkt, und genau das wird gelesen. */
    const istAdmin = await page.evaluate(() =>
      [...document.querySelectorAll('[data-admin-only]')].some(el => el.style.display !== 'none'));
    console.log('Betreiberkonto erkannt:', istAdmin);
    if (!istAdmin) {
      errs.push('AUFBAU: die Attrappe meldet kein Betreiberkonto — alles Weitere prüft nichts');
    }

    // 2. Sechs Tipps öffnen nichts
    await tippen(page, 6);
    await page.waitForTimeout(400);
    const nachSechs = await offen(page);
    console.log('Nach 6 Tipps offen:', nachSechs);
    if (nachSechs) errs.push('ZU FRÜH: schon sechs Tipps öffnen die Werkbank');

    // 3. Der siebte
    await tippen(page, 1);
    await page.waitForTimeout(900);
    const nachSieben = await offen(page);
    console.log('Nach 7 Tipps offen:', nachSieben);
    if (!nachSieben) errs.push('GEHT NICHT AUF: sieben Tipps öffnen die Werkbank nicht');

    // 4. Die Marke tut weiter, wofür sie da ist
    const wo = await page.evaluate(() => (document.querySelector('.view.show') || {}).id);
    console.log('Ansicht nach den Tipps:', wo);
    if (wo !== 'view-home') {
      errs.push('KAPUTT GEMACHT: die Marke führt nicht mehr zur Startseite (steht auf ' + wo + ')');
    }

    if (nachSieben) {
      // 6. Die vier Seiten
      const seiten = await page.evaluate(async () => {
        const raus = {};
        for (const t of ['nutzung', 'funktionen', 'zahlen', 'werkzeug']) {
          document.querySelector('[data-wbtab="' + t + '"]').click();
          await new Promise(r => setTimeout(r, 350));
          const pane = document.getElementById('wbPane' + t[0].toUpperCase() + t.slice(1));
          raus[t] = pane ? pane.textContent.replace(/\s+/g, ' ').trim() : null;
        }
        return raus;
      });
      Object.keys(seiten).forEach(k => console.log('  ' + k + ': ' + String(seiten[k]).slice(0, 120)));

      Object.keys(seiten).forEach(k => {
        if (!seiten[k]) errs.push('Die Seite „' + k + '" gibt es nicht');
        else if (seiten[k].length < 20) errs.push('Die Seite „' + k + '" ist leer: „' + seiten[k] + '"');
      });

      /* Keine Namen. Die Attrappe kennt „Anna Meier" und „Ben Kraus" —
         taucht einer davon auf, ist aus der Zahl eine Personalakte
         geworden. */
      const namen = ['Anna Meier', 'Ben Kraus', 'Test Chef'];
      Object.keys(seiten).forEach(k => {
        namen.forEach(n => {
          if (seiten[k] && seiten[k].indexOf(n) >= 0) {
            errs.push('PERSONENBEZUG: auf der Seite „' + k + '" steht „' + n + '"');
          }
        });
      });

      // 7. Die nie geöffnete Ansicht wird benannt
      const f = seiten.funktionen || '';
      if (!/nie geöffnet/.test(f)) {
        errs.push('Die Funktionsseite sagt nicht, welche Ansicht nie geöffnet wurde');
      }
      if (!/Putzplan/.test(f)) {
        errs.push('Der Putzplan wurde in den Testdaten nie geöffnet, wird aber nicht als ungenutzt genannt');
      }
      /* Gegenprobe zur Gegenprobe: „Chat" WURDE benutzt und darf nicht
         in der Liste der ungenutzten stehen. Ohne diese Zeile wuerde
         auch eine Seite gruen, die einfach alles als ungenutzt meldet. */
      const totTeil = (f.match(/nie geöffnet:[^.]*/) || [''])[0];
      if (/Chat/.test(totTeil)) {
        errs.push('FALSCH HERUM: „Chat" wurde 40× geöffnet, steht aber unter den ungenutzten');
      }

      await page.screenshot({ path: SP + '/werkbank.png' });
    }

    /* ══ 5. Was wirklich geschrieben wird ══
       Der Kern. Nicht die Oberflaeche wird gefragt, sondern der
       Schreibvorgang, den die Attrappe mitschreibt. */
    const schreib = await page.evaluate(async () => {
      window.__schreib = [];
      /* Ein paar Ansichten oeffnen und die App wegschalten — genau der
         Weg, auf dem im Betrieb gesendet wird. */
      document.querySelector('.mobnav [data-group="g-komm"]').click();
      await new Promise(r => setTimeout(r, 300));
      document.querySelector('.mobnav [data-group="g-start"]').click();
      await new Promise(r => setTimeout(r, 300));
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      await new Promise(r => setTimeout(r, 600));
      return (window.__schreib || []).filter(w => /statistik/.test(w.pfad || ''));
    });
    console.log('Schreibvorgänge in statistik:', JSON.stringify(schreib));
    if (!schreib.length) {
      errs.push('Es wird gar nichts gezählt — Punkt 5 ungeprüft');
    } else {
      schreib.forEach(w => {
        const felder = Object.keys(w.daten || {});
        const erlaubt = ['tag', 'starts', 'ansichten'];
        felder.forEach(f => {
          if (erlaubt.indexOf(f) < 0) {
            errs.push('ZU VIEL: die Zählung schickt das Feld „' + f + '" mit');
          }
        });
        const roh = JSON.stringify(w.daten || {});
        if (/testuid|Anna|Ben|Test Chef|uid/i.test(roh)) {
          errs.push('PERSONENBEZUG im Schreibvorgang: ' + roh.slice(0, 200));
        }
      });
    }

    await b.close();
  }

  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Werkbank: sieben Tipps, nur für den Betreiber, Zahlen ohne Personen');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
