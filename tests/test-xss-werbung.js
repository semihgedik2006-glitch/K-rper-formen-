/* ── Angriffsdurchlauf durch werbung.html ─────────────────────────────
   Stand auf der Liste als „wie test-xss.js für die App". Beim Hinsehen
   war die ehrliche Antwort: SO GEHT ES HIER NICHT.

   `test-xss.js` speist acht Muster über die Datenbank ein und sieht
   nach, ob daraus Code wird. Die Werbeseite hat aber
   **kein innerHTML, keine Formulare, keine Datenbank und liest nichts
   aus der Adresszeile** — nachgemessen, nicht vermutet. Es gibt
   schlicht nichts einzuspeisen. Ein Durchlauf, der trotzdem Nutzlast
   hineinschiebt, wäre grün und hätte nichts geprüft.

   Was es hier stattdessen zu prüfen gibt: die Seite ist HEUTE hart —
   strenge Sicherheitsregel, kein Ereignis im Markup, jedes fremde Ziel
   mit noopener. Das ist der Zustand, der still verlorengehen kann.
   Jemand baut ein Kontaktformular ein, lockert `default-src`, hängt ein
   `onclick` an einen Knopf — und niemand merkt es, weil die Seite
   weiter aussieht wie vorher.

   DESHALB WIRD HIER GEMESSEN STATT GELESEN. Die Sicherheitsregel wird
   nicht im Quelltext gesucht, sondern im laufenden Browser auf die
   Probe gestellt: ein eingeschleustes Skript MUSS scheitern, während
   das eigene der Seite gelaufen sein muss. Ohne die zweite Hälfte wäre
   „nichts lief" das grünste Ergebnis von allen.

   Was hier NICHT geprüft werden kann: die Kopfzeilen der Auslieferung
   (frame-ancestors, X-Frame-Options). Der örtliche Testserver schickt
   sie nicht mit — sie kommen von Firebase Hosting. Die stehen deshalb
   als Dateiprüfung in `firebase.json` weiter unten, und es steht dabei,
   dass sie eben NICHT im Browser gemessen sind.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SP = __dirname;
const SEITE = process.env.WERBUNG || 'http://127.0.0.1:8765/werbung.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
function pruefe(bedingung, meldung) { if (!bedingung) errs.push(meldung); }

/* Eine Nutzlast in der Adresszeile. Die Seite liest sie heute nicht —
   genau das soll so bleiben. Wer später `location.search` auswertet,
   fällt hier auf. */
const MARKE = 'KFSONDE7X';
const GIFT = '<img src=x onerror="window.__xss=1">' + MARKE;

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 900 } });
  const seitenFehler = [];
  page.on('pageerror', e => seitenFehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
  /* Schriften und die zwei Bilder von der Hauptseite abklemmen: der
     Durchlauf soll ohne Netz laufen. Beides ist in der CSP ohnehin
     namentlich erlaubt und keine Angriffsfläche. */
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**fonts.gstatic.com/**', r => r.abort());
  await page.route('**xn--krperformen-rfb.com/**', r => r.abort());

  const url = SEITE + '?such=' + encodeURIComponent(GIFT) +
              '#' + encodeURIComponent(GIFT);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // ══ 0. Gegenprobe: läuft die Seite überhaupt? ══
  /* Ohne diesen Punkt wäre eine kaputte Seite das beste Ergebnis:
     nichts geladen, nichts ausgeführt, alles „sicher". */
  const lebt = await page.evaluate(() => ({
    titel: (document.querySelector('#heroTitle') || {}).textContent || '',
    woerter: document.querySelectorAll('#heroTitle .word').length,
    knoepfe: document.querySelectorAll('a.btn').length
  }));
  console.log('Seite:', JSON.stringify({
    woerter: lebt.woerter, knoepfe: lebt.knoepfe, titel: lebt.titel.slice(0, 40) }));
  pruefe(lebt.woerter > 0,
    'GEGENPROBE: die Überschrift wurde nicht aufgebaut — der eigene ' +
    'Skriptblock der Seite lief nicht, damit prüft alles Weitere nichts');
  pruefe(lebt.knoepfe > 0, 'GEGENPROBE: die Seite zeigt keine Knöpfe');

  // ══ 1. Hält die Sicherheitsregel im Browser? ══
  /* Nicht im Quelltext nachgelesen, sondern ausprobiert: drei Wege,
     fremden Code auszuführen. Alle drei müssen scheitern. */
  const csp = await page.evaluate(async () => {
    const raus = {};
    // a) Ein eingeschleustes <script> mit Code im Text
    try {
      const s = document.createElement('script');
      s.textContent = 'window.__xssInline = 1;';
      document.body.appendChild(s);
    } catch (e) { raus.fehlerInline = String(e.message); }
    // b) Ein <script src> von einem fremden Host
    try {
      const s2 = document.createElement('script');
      s2.src = 'https://example.com/boese.js';
      document.body.appendChild(s2);
    } catch (e) { raus.fehlerSrc = String(e.message); }
    // c) Ein Ereignis-Attribut, nachträglich gesetzt
    try {
      const d = document.createElement('div');
      d.setAttribute('onclick', 'window.__xssAttr = 1');
      document.body.appendChild(d);
      d.click();
      /* WIEDER WEGRÄUMEN. Ohne diese Zeile findet Abschnitt 3 den hier
         eingefügten div und meldet „Ereignis im Markup" — ein Fund, den
         der Durchlauf selbst erzeugt hat. Genau so ist es beim Bauen
         passiert. */
      d.remove();
    } catch (e) { raus.fehlerAttr = String(e.message); }
    await new Promise(r => setTimeout(r, 400));
    /* Die beiden eingeschleusten <script> ebenso — sonst zaehlt
       Abschnitt 2 den eigenen Muell als Fund. */
    document.querySelectorAll('body script').forEach(function(s){
      if(/__xssInline/.test(s.textContent||'') || /boese\.js/.test(s.src||'')) s.remove();
    });
    raus.inline = !!window.__xssInline;
    raus.attr = !!window.__xssAttr;
    return raus;
  });
  console.log('Eingeschleust ausgeführt:', JSON.stringify(csp));
  pruefe(!csp.inline,
    'CSP HÄLT NICHT: ein nachträglich eingefügtes <script> lief — dann ' +
    'nützt die Prüfsumme im Kopf der Seite nichts');
  /* Ein Ereignis im Attribut ist für die CSP fremder Code. Läuft es,
     fehlt der Regel etwas — auch wenn heute niemand eines schreibt. */
  pruefe(!csp.attr,
    'CSP HÄLT NICHT: ein nachträglich gesetztes onclick lief');

  // ══ 2. Steht die Nutzlast aus der Adresszeile irgendwo? ══
  /* Gesucht wird eine EIGENE Marke, nicht das Wort „onerror". Beim
     ersten Anlauf stand hier indexOf('onerror') — und meldete einen
     Treffer, der aus dem KOMMENTAR im Skriptblock der Seite stammte
     („Kein onload und kein onerror mehr im Markup"). textContent nimmt
     Skripttext mit. Ein Suchbegriff, der auch im eigenen Quelltext
     vorkommt, misst nicht das Eingeschleuste. */
  const ausUrl = await page.evaluate((m) => ({
    imText: (document.body.textContent || '').indexOf(m) >= 0,
    imHtml: document.body.innerHTML.indexOf(m) >= 0,
    bilder: document.querySelectorAll('img[src="x"]').length,
    lief: !!window.__xss
  }), MARKE);
  console.log('Aus der Adresszeile:', JSON.stringify(ausUrl));
  pruefe(!ausUrl.lief, 'AUSGEFÜHRT: die Nutzlast aus der Adresszeile lief');
  pruefe(!ausUrl.imText && !ausUrl.imHtml && !ausUrl.bilder,
    'EINGESCHLEUST: was in der Adresszeile stand, steht jetzt im HTML — ' +
    'die Seite wertet Adresszeilen-Inhalte aus, und das tat sie bisher nicht');

  // ══ 3. Kein Ereignis im Markup, jedes fremde Ziel mit noopener ══
  const markup = await page.evaluate(() => {
    const mitEreignis = [];
    document.querySelectorAll('*').forEach(el => {
      for (const a of el.attributes) {
        /* on… und NUR on…: „data-kontaktweg" oder „content" sind keine
           Ereignisse. Ein Durchlauf mit einem schludrigen Ausdruck
           meldet acht Treffer, die alle keine sind — genau das ist
           beim Bauen hier passiert. */
        if (/^on[a-z]+$/i.test(a.name)) {
          mitEreignis.push((el.tagName + '[' + a.name + ']'));
        }
      }
    });
    const blank = [...document.querySelectorAll('a[target="_blank"]')]
      .map(a => ({ href: (a.getAttribute('href') || '').slice(0, 40),
                   rel: a.getAttribute('rel') || '' }));
    return { mitEreignis, blank,
      csp: (document.querySelector('meta[http-equiv="Content-Security-Policy"]') || {})
        .content || '' };
  });
  console.log('Ereignisse im Markup:', JSON.stringify(markup.mitEreignis));
  console.log('Fremde Ziele:', JSON.stringify(markup.blank));
  pruefe(markup.mitEreignis.length === 0,
    'EREIGNIS IM MARKUP: ' + markup.mitEreignis.join(', ') +
    ' — die CSP lässt nur den einen Skriptblock zu, ein Attribut ist für ' +
    'sie fremder Code und läuft schlicht nicht');
  markup.blank.forEach(a => {
    pruefe(/noopener/.test(a.rel),
      'OHNE noopener: ' + a.href + ' öffnet in einem neuen Tab und kann ' +
      'von dort aus diese Seite umleiten (rel="' + a.rel + '")');
  });
  pruefe(markup.blank.length > 0,
    'GEGENPROBE: kein einziges target="_blank" gefunden — dann prüft der ' +
    'noopener-Abschnitt nichts');

  // ══ 4. Die Sicherheitsregel selbst: sind die Türen zu? ══
  /* Nicht „irgendeine CSP ist da", sondern die sechs Richtlinien, deren
     Fehlen jeweils eine eigene Tür aufmacht. */
  const TUEREN = [
    ["default-src 'none'", 'alles, was nicht ausdrücklich erlaubt ist, wäre erlaubt'],
    ["object-src 'none'", 'ein eingebettetes Flash/Objekt könnte Code ausführen'],
    ["base-uri 'none'", 'ein eingeschleustes <base> lenkt alle relativen Pfade um'],
    ["form-action 'none'", 'ein eingeschleustes Formular sendet an einen fremden Server'],
    ["frame-src 'none'", 'ein eingebetteter Rahmen könnte fremde Inhalte zeigen'],
    ["connect-src 'none'", 'die Seite könnte Daten irgendwohin senden']
  ];
  TUEREN.forEach(([regel, folge]) => {
    pruefe(markup.csp.indexOf(regel) >= 0,
      'CSP OHNE „' + regel + '" — ' + folge);
  });
  /* Die Bilderliste steht mit VOLLEM Pfad da, nicht nur mit dem Host.
     Nur der Host hiesse: die ganze WordPress-Seite darf Bilder liefern,
     und wer dort etwas ablegen kann, legt es hier ab. */
  pruefe(!/img-src[^;]*https:\/\/www\.xn--krperformen-rfb\.com(\s|;|$)/.test(markup.csp),
    'IMG-SRC ZU WEIT: der ganze Host ist erlaubt statt der zwei Bilder');

  // ══ 5. Was der Browser hier nicht sehen kann ══
  /* frame-ancestors und X-Frame-Options gibt es nur als Kopfzeile. Der
     örtliche Testserver schickt sie nicht; Firebase Hosting schon.
     Deshalb hier eine DATEI-Prüfung, ausdrücklich als solche benannt —
     sie beweist, dass es konfiguriert ist, nicht dass es ankommt. */
  const fbj = JSON.parse(fs.readFileSync(path.join(SP, '..', 'firebase.json'), 'utf8'));
  const alleKopf = (((fbj.hosting || {}).headers) || [])
    .filter(h => h.source === '**')
    .flatMap(h => h.headers || []);
  const kopf = (k) => (alleKopf.filter(h => h.key.toLowerCase() === k)[0] || {}).value || '';
  console.log('Kopfzeilen (aus firebase.json, NICHT im Browser gemessen):',
    JSON.stringify(alleKopf.map(h => h.key)));
  pruefe(/frame-ancestors\s+'none'/.test(kopf('content-security-policy')),
    'OHNE frame-ancestors: jemand kann die Seite in seine einbetten und ' +
    'Klicks abfangen — als <meta> geht das nicht, nur als Kopfzeile');
  pruefe(/DENY/i.test(kopf('x-frame-options')),
    'OHNE X-Frame-Options: dasselbe für ältere Browser');
  pruefe(/nosniff/i.test(kopf('x-content-type-options')),
    'OHNE nosniff: der Browser darf den Inhaltstyp raten');

  await b.close();
  seitenFehler.forEach(f => errs.push(f));

  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ werbung.html: die Sicherheitsregel hält im laufenden Browser, kein ' +
      'Ereignis im Markup, jedes fremde Ziel mit noopener, sechs Türen zu — ' +
      'und die Adresszeile wird weiterhin gar nicht gelesen');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
