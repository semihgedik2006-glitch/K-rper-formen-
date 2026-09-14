/* ── Fingerziele: gemessen, was der Daumen trifft ─────────────────────

   ES GAB SCHON EINEN DURCHLAUF FUER KNOEPFE, UND ER WAR GRUEN, WAEHREND
   SIEBEN BAUFORMEN ZU KLEIN WAREN.

   test-knoepfe.js prueft, ob ein Nur-Symbol-Knopf sein Zeichen mittig
   traegt und ob ein Abzeichen darauf liegt. Beides wichtig, beides nicht
   die Groesse. Die Groesse prueften einzelne Durchlaeufe fuer einzelne
   Stellen (Passwort, Beitritt, Sicherung, Marke) — also genau dort, wo
   jemand schon einmal hingesehen hatte. Ueberall sonst: nichts.

   Gefunden wurden dabei am 14.9. sieben Bauformen unter 44 Pixeln,
   darunter „+ Neu" in Aufgaben und Putzplan — die wichtigste Handlung
   der jeweiligen Seite. Und zwei Regeln, die min-height ZWEIMAL nannten,
   44px vorn und 40 bzw. 36 hinten: das Fingerziel stand im Stylesheet
   und galt trotzdem nie.

   ── Warum hier die Trefferflaeche gemessen wird und nicht das Rechteck

   Das Haus kennt zwei Wege zu 44 Pixeln (DESIGN-SYSTEM.md): den Knopf
   gross machen, oder eine unsichtbare Flaeche darueberlegen. .sp-play
   ist 34px gemalt und 44px zu treffen; .chat-art 36 und 44; .t-nimm 19
   und 44. Ein Durchlauf, der getBoundingClientRect() liest, meldet alle
   drei als Fehler, obwohl keiner einer ist — genau das tat
   audit-forensik.js, und deshalb standen dort zwei falsche Treffer.

   Gemessen wird deshalb wie mit dem Finger: von der Mitte aus nach oben
   und unten tasten, solange elementFromPoint noch dasselbe Bedienelement
   liefert. Das ist dieselbe Methode, die test-sprachabspieler.js fuer
   den Abspielknopf benutzt — hier nur fuer jedes Bedienelement in jeder
   Ansicht statt fuer eines.

   ── Zwei Fallen, beide beim Bauen hineingetappt

   1. WER NICHT ROLLT, MISST DAS SICHTFENSTER. Ein Knopf am unteren Rand
      liefert unter seiner Mitte <main> statt seiner selbst — ein
      tadelloser 44er erscheint dann mit 23. Beim ersten Durchgang ergab
      das fuenf falsche Treffer im Material. Jedes Element wird deshalb
      erst in die Bildmitte gerollt.

   2. EIN EINGRIFF KANN EINEN ZWEITEN FEHLER FREILEGEN. Nach dem Anheben
      der Material-Felder auf 44px sanken drei davon scheinbar auf 23 —
      das war Falle 1, nicht ein neuer Schaden. Wenn eine Zahl nach einer
      Korrektur schlechter aussieht: erst die Messung pruefen.

   ── Die Schwelle

   44 Pixel, keine Ausnahmeliste. Die Zahl ist nicht gewaehlt, sie steht
   so in DESIGN-SYSTEM.md und in den vier aelteren Durchlaeufen. Eine
   Liste geduldeter Faelle waere bequem gewesen — sieben Eintraege, und
   der Durchlauf haette ab sofort nur noch Neues gefunden. Sie sind
   stattdessen alle behoben, damit die Regel ohne Fussnote gilt.

   NICHT GEPRUEFT: Dialoge und Fenster. Sie oeffnen sich je nach Rolle
   und Datenlage verschieden; test-knoepfe geht sie eigens durch. Hier
   sind es die Ansichten, und zwar in allen drei Rollen — ein Mitarbeiter
   sieht andere Knoepfe als der Chef.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const ZIEL = 44;

const VIEWS = [
  ['home', 'g-start'], ['chat', 'g-komm'], ['dm', 'g-komm'], ['ann', 'g-komm'],
  ['todos', 'g-arbeit'], ['putzplan', 'g-arbeit'], ['material', 'g-arbeit'],
  ['geraete', 'g-arbeit'], ['docs', 'g-arbeit'],
  ['team', 'g-team'], ['chef', 'g-chef'], ['archive', 'g-chef'],
];

const MESSEN = `
(function(){
  window.__ziele = function(view, ziel){
    var raus = [];
    var sel = 'button, a[href], input:not([type=hidden]), select, textarea,' +
              ' [role="button"], [role="checkbox"]';
    document.querySelectorAll('.view.show ' + sel).forEach(function(el){
      if (el.disabled) return;
      if (!el.getBoundingClientRect().height) return;
      el.scrollIntoView({ block: 'center' });            // Falle 1
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var cx = r.left + r.width/2, cy = r.top + r.height/2;
      // Zu dicht am Rand laesst sich nicht ehrlich messen: dort endet
      // die Trefferflaeche am Sichtfenster und nicht am Knopf.
      if (cx < 0 || cx > innerWidth || cy < ziel/2 || cy > innerHeight - ziel/2) return;
      function trifft(y){
        var t = document.elementFromPoint(cx, y);
        return !!(t && (t === el || el.contains(t) ||
                        (t.parentElement && t.parentElement === el)));
      }
      if (!trifft(cy)) return;      // verdeckt — anderer Fall, andere Pruefung
      var oben = 0, unten = 0;
      for (var d=1; d<=ziel; d++){ if (trifft(cy-d)) oben=d; else break; }
      for (var d=1; d<=ziel; d++){ if (trifft(cy+d)) unten=d; else break; }
      var h = oben + unten + 1;
      if (h >= ziel) return;
      // Wer nimmt die fehlenden Pixel? Ohne diese Angabe sucht man
      // hinterher im falschen Stylesheet.
      var stoerU = document.elementFromPoint(cx, cy + unten + 1);
      var stoerO = document.elementFromPoint(cx, cy - oben - 1);
      function nam(n){ return n ? (String(n.className||'').split(' ')[0] || n.tagName) : '-'; }
      raus.push({
        view: view,
        klasse: (el.className && String(el.className).split(' ')[0]) || el.tagName.toLowerCase(),
        gemalt: Math.round(r.width) + 'x' + Math.round(r.height),
        treffer: h,
        darueber: nam(stoerO), darunter: nam(stoerU),
        text: ((el.textContent||'').trim() || el.getAttribute('aria-label') || '').slice(0,26)
      });
    });
    return raus;
  };
})();
`;

async function fuerRolle(rolle, errs) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR (' + rolle + '): ' + e.message.slice(0, 140)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-' + rolle + '.js' });
  await page.addInitScript({ content: MESSEN });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);

  let gemessen = 0;
  const funde = [];
  const gesehen = [];
  for (const [v, g] of VIEWS) {
    await page.evaluate((gg) => {
      const el = document.querySelector('.mobnav [data-group="' + gg + '"]');
      if (el) el.click();
    }, g);
    await page.waitForTimeout(320);
    const da = await page.evaluate((vv) => {
      const el = document.querySelector('[data-subview="' + vv + '"]');
      if (el) { el.click(); return true; }
      return false;                      // diese Rolle hat die Ansicht nicht
    }, v);
    if (!da) continue;
    await page.waitForTimeout(1000);
    gesehen.push(v);
    const r = await page.evaluate(([vv, z]) => {
      const n = document.querySelectorAll('.view.show button, .view.show a[href], ' +
        '.view.show input, .view.show select, .view.show textarea').length;
      return { funde: window.__ziele(vv, z), anzahl: n };
    }, [v, ZIEL]);
    gemessen += r.anzahl;
    funde.push(...r.funde);
  }
  await b.close();

  /* GEGENPROBE ZUR MESSUNG SELBST. Findet der Durchlauf gar keine
     Bedienelemente — weil ein Wahlausdruck nicht mehr passt, weil die
     Ansichten nicht mehr so heissen, weil der Stub sich geaendert hat —,
     dann meldet er „null Verstoesse" und hat nichts geprueft. Das ist
     derselbe Fehler wie „nichts lief war das gruenste Ergebnis" beim
     Haertungsdurchlauf der Werbeseite. */
  if (gesehen.length < 4) {
    errs.push(rolle + ': nur ' + gesehen.length + ' Ansichten erreicht — ' +
      'der Durchlauf hat nichts geprueft');
  }
  if (gemessen < 40) {
    errs.push(rolle + ': nur ' + gemessen + ' Bedienelemente gefunden — zu wenige, ' +
      'um daraus „alles in Ordnung" zu schliessen');
  }
  return { rolle, gemessen, ansichten: gesehen.length, funde };
}

(async () => {
  const errs = [];
  const zeilen = [];
  for (const rolle of ['chef', 'leiter', 'mitarbeiter']) {
    const e = await fuerRolle(rolle, errs);
    zeilen.push(e);
    console.log(e.rolle.padEnd(12) + e.ansichten + ' Ansichten · ' +
      e.gemessen + ' Bedienelemente · ' + e.funde.length + ' unter ' + ZIEL + 'px');
    // Gleiche Bauform in derselben Ansicht ist EIN Fall, nicht sechzehn.
    const proForm = {};
    e.funde.forEach(f => {
      const k = f.view + ' .' + f.klasse;
      if (!proForm[k] || proForm[k].treffer > f.treffer) proForm[k] = f;
      proForm[k].n = (proForm[k].n || 0) + 1;
    });
    Object.entries(proForm).forEach(([k, f]) => {
      errs.push('FINGERZIEL ' + e.rolle + ': ' + k + ' trifft nur ' + f.treffer +
        'px (gemalt ' + f.gemalt + ', ' + f.n + '×) — darueber ' + f.darueber +
        ', darunter ' + f.darunter + ' · "' + f.text + '"');
    });
  }

  console.log('\nFehler: ' + (errs.length ? '' : 'keine'));
  errs.forEach(e => console.log('  ' + e));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
