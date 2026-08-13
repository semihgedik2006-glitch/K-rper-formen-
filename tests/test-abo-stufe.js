/* ── Die Abo-Stufe in der Oberfläche (Stufe B) ────────────────────────
   Geprüft wird weniger das Sperren als die drei Fälle daneben, in denen
   ein Preisstufen-Einbau schiefgeht:

     1. OHNE Abo ist alles offen — der Zustand bei jedem Kunden, bei dem
        noch nichts eingetragen ist. Wem die Hälfte fehlt, weil ein Feld
        leer blieb, merkt das erst beim Anruf.
     2. Gesperrtes wird GEZEIGT, nicht versteckt. Wer nicht weiss, dass
        es etwas gibt, fragt nicht danach.
     3. Das Tagesgeschäft bleibt unangetastet. Eine Preisstufe, die
        Aufgaben oder Chat erwischt, kostet den Kunden.

   Nicht geprüft: dass die Auswertung wirklich zu ist. Sie ist es nicht —
   sie rechnet aus Daten, die das Team ohnehin sieht, und lässt sich nur
   ausblenden. Der einzige echte Riegel steht in firestore.rules bei den
   Nachweisen und wird dort geprüft.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];

/* stufe: null = kein Abo hinterlegt, sonst 'basic' | 'premium' */
async function start(stufe) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));

  await page.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  /* mandant an und das eigene Abo unterschieben. _firma ist bei der
     eigenen Firma 'koerperformen' — genau der Pfad, den aboLaden() geht. */
  await page.addInitScript(`
    (function(){
      var STUFE = ${JSON.stringify(stufe)};
      var iv = setInterval(function(){
        if (window.KONFIG) { window.KONFIG.mandant = true; clearInterval(iv); }
      }, 2);
      setTimeout(function(){ clearInterval(iv); }, 3000);
      window.__abos = STUFE ? { koerperformen: { stufe: STUFE, status:'aktiv' } } : {};
    })();`);
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  return { b, page };
}

async function lage(page) {
  await page.evaluate(() => {
    const g = document.querySelector('.mobnav [data-group="g-chef"]');
    if (g) g.click();
  });
  await page.waitForTimeout(500);
  return page.evaluate(() => {
    const karten = Array.from(document.querySelectorAll('#chefHome [data-cgo]'));
    const finde = id => karten.filter(k => k.getAttribute('data-cgo') === id)[0];
    const nach = finde('nachweise'), rep = finde('report'), team = finde('team');
    return {
      kartenZahl: karten.length,
      nachweiseDa: !!nach,
      reportDa: !!rep,
      teamDa: !!team,
      schloesser: document.querySelectorAll('#chefHome .abo-schloss').length,
      // Und was passiert beim Klick auf einen gesperrten Bereich?
      klickNachweise: (function(){
        if (!nach) return 'karte fehlt';
        nach.click();
        const pane = document.querySelector('.chef-pane[data-cpane="nachweise"]');
        const offen = pane && getComputedStyle(pane).display !== 'none';
        return offen ? 'geoeffnet' : 'blieb zu';
      })()
    };
  });
}

(async () => {
  // ══ 1. Kein Abo hinterlegt → alles offen ══
  {
    const { b, page } = await start(null);
    const l = await lage(page);
    console.log('ohne Abo :', JSON.stringify(l));
    if (l.schloesser) errs.push('FALSCH: ohne Abo sind Bereiche gesperrt (' + l.schloesser + ')');
    if (l.klickNachweise !== 'geoeffnet') {
      errs.push('FALSCH: ohne Abo lässt sich „Nachweise" nicht öffnen');
    }
    await b.close();
  }

  // ══ 2. Premium → ebenfalls alles offen ══
  {
    const { b, page } = await start('premium');
    const l = await lage(page);
    console.log('premium  :', JSON.stringify(l));
    if (l.schloesser) errs.push('FALSCH: mit Premium sind Bereiche gesperrt');
    if (l.klickNachweise !== 'geoeffnet') errs.push('FALSCH: Premium kann „Nachweise" nicht öffnen');
    await b.close();
  }

  // ══ 3. Basic → gezeigt, aber zu ══
  {
    const { b, page } = await start('basic');
    const l = await lage(page);
    console.log('basic    :', JSON.stringify(l));
    /* Gezeigt, nicht versteckt: die Kachel muss da sein. */
    if (!l.nachweiseDa) errs.push('FALSCH: „Nachweise" ist auf Basic ganz verschwunden — ' +
                                  'wer nicht weiss, dass es etwas gibt, fragt nicht danach');
    if (!l.reportDa) errs.push('FALSCH: „Auswertung" ist auf Basic ganz verschwunden');
    if (l.schloesser !== 2) {
      errs.push('FALSCH: es sollten genau 2 Schlösser stehen, es sind ' + l.schloesser);
    }
    if (l.klickNachweise === 'geoeffnet') {
      errs.push('GEFÄHRLICH: auf Basic geht „Nachweise" trotzdem auf');
    }
    /* Und das Wichtigste: das Tagesgeschäft ist unangetastet. */
    if (!l.teamDa) errs.push('GEFÄHRLICH: Basic hat auch „Team" erwischt — das ist Verwaltung, ' +
                             'keine Preisstufe');
    await b.close();
  }

  // ══ 4. Basic fasst die Team-Ansichten nicht an ══
  {
    const { b, page } = await start('basic');
    const offen = await page.evaluate(async () => {
      const raus = {};
      for (const g of ['g-komm', 'g-arbeit', 'g-team']) {
        const el = document.querySelector('.mobnav [data-group="' + g + '"]');
        if (el) el.click();
        await new Promise(r => setTimeout(r, 260));
        raus[g] = document.querySelectorAll('.view.show, .view[style*="display: block"]').length > 0
          || !!document.querySelector('#app.show');
      }
      return raus;
    });
    console.log('Basic, Team-Ansichten:', JSON.stringify(offen));
    Object.keys(offen).forEach(g => {
      if (!offen[g]) errs.push('GEFÄHRLICH: auf Basic ist ' + g + ' nicht erreichbar');
    });
    await b.close();
  }

  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Abo-Stufe: ohne Abo alles offen, Basic zeigt was fehlt, Tagesgeschäft unangetastet');
  process.exit(errs.length ? 1 : 0);
})();
