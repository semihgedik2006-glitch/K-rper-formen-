/* ── Angriff über eingegebene Inhalte (XSS) ───────────────────────────
   Die App baut ihre Oberfläche mit Zeichenketten und innerHTML. Wer
   Text in die Datenbank bekommt — als Chatnachricht, Name, Aufgabe,
   Notiz oder Umfrage — schreibt damit in das HTML aller Kollegen.

   Geprüft wird nicht der Quelltext, sondern das Ergebnis: die Attrappe
   liefert Nutzdaten mit acht gängigen Angriffsmustern, und danach wird
   im fertigen Dokument nachgesehen, ob daraus ein Element, ein
   Ereignis-Aufruf oder ein Skript geworden ist.

   Gegenprobe am Ende: der Text muss als TEXT ankommen. Ein Durchlauf,
   bei dem die Nutzdaten gar nicht erst angezeigt werden, wäre grün und
   würde nichts beweisen.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];

/* Acht Muster. Jedes trägt eine eigene Markierung, damit sich hinterher
   sagen lässt, WELCHES durchkam. */
const NUTZLAST = [
  '<img src=x onerror="window.__xss=(window.__xss||[]).concat(\'img\')">',
  '<script>window.__xss=(window.__xss||[]).concat(\'script\')</script>',
  '<svg onload="window.__xss=(window.__xss||[]).concat(\'svg\')">',
  '"><b class="xss-out">raus</b>',
  "'><b class='xss-out2'>raus2</b>",
  '<a href="javascript:window.__xss=1">klick</a>',
  '<iframe src="javascript:window.__xss=1"></iframe>',
  'https://ok.de/"onmouseover="window.__xss=1'
];

async function start(stub) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript('window.__xssNutzlast = ' + JSON.stringify(NUTZLAST) + ';');
  await page.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  await page.addInitScript({ path: path.join(SP, 'stub-xss.js') });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  return { b, page };
}

/* Jede Ansicht einmal öffnen, damit alles gerendert wird, was rendern kann. */
const ANSICHTEN = [
  ['home', 'g-start'], ['chat', 'g-komm'], ['ann', 'g-komm'], ['dm', 'g-komm'],
  ['todos', 'g-arbeit'], ['putzplan', 'g-arbeit'], ['material', 'g-arbeit'],
  ['geraete', 'g-arbeit'], ['docs', 'g-arbeit'], ['team', 'g-team'],
  ['chef', 'g-chef'], ['archive', 'g-chef']
];

(async () => {
  const { b, page } = await start();

  for (const [view, gruppe] of ANSICHTEN) {
    await page.evaluate(async ({ v, g }) => {
      const grp = document.querySelector('.mobnav [data-group="' + g + '"]');
      if (grp) grp.click();
      await new Promise(r => setTimeout(r, 220));
      const t = document.querySelector('[data-subview="' + v + '"]');
      if (t) t.click();
    }, { v: view, g: gruppe });
    await page.waitForTimeout(650);
  }
  /* Team-Reiter einzeln, dort liegen Schichten, Abwesenheiten, Übergaben
     und das schwarze Brett hintereinander. */
  await page.evaluate(async () => {
    const g = document.querySelector('.mobnav [data-group="g-team"]');
    if (g) g.click();
    await new Promise(r => setTimeout(r, 250));
    for (const t of ['schicht', 'abwesend', 'uebergabe', 'brett']) {
      const k = document.querySelector('[data-teamtab="' + t + '"]');
      if (k) k.click();
      await new Promise(r => setTimeout(r, 250));
    }
  });
  await page.waitForTimeout(800);

  const fund = await page.evaluate(() => {
    return {
      ausgefuehrt: window.__xss || null,
      /* Elemente, die es nur geben kann, wenn die Maskierung versagt hat */
      eingeschleust: {
        img: document.querySelectorAll('img[src="x"]').length,
        /* Nur eingeschleuste Blöcke zählen, nicht die eigenen. Hier stand
           „alle minus eins" — die Eins war der Skriptblock der App. Seit
           es zwei gibt (der Notschalter im Ladebildschirm ist bewusst
           getrennt), meldete die Zeile einen Treffer, den es nicht gab.
           Eine Konstante, die von der Struktur der Datei abhängt, hält
           genau bis zur nächsten Änderung. */
        script: [].slice.call(document.querySelectorAll('body script:not([src])'))
          .filter(function (s) { return /__xss|xss-out/.test(s.textContent || ''); }).length,
        svgOnload: document.querySelectorAll('svg[onload]').length,
        raus: document.querySelectorAll('.xss-out, .xss-out2').length,
        iframe: document.querySelectorAll('iframe').length,
        jsHref: [...document.querySelectorAll('a[href]')]
          .filter(a => /^javascript:/i.test(a.getAttribute('href') || '')).length,
        onmouseover: document.querySelectorAll('[onmouseover]').length
      },
      /* Gegenprobe: kommt der Text überhaupt an? textContent, nicht
         innerText — innerText liefert nur, was gerade sichtbar ist, und
         von zwölf Ansichten steht immer nur eine im Bild. Beim ersten
         Anlauf meldete der Durchlauf deshalb „nichts geprüft", obwohl
         die Nutzlast überall stand. */
      sichtbar: (document.body.textContent.match(/onerror=|<img src=x|<script>/g) || []).length
    };
  });

  console.log('Ausgeführt:', JSON.stringify(fund.ausgefuehrt));
  console.log('Eingeschleuste Elemente:', JSON.stringify(fund.eingeschleust));
  console.log('Nutzlast als Text sichtbar:', fund.sichtbar);

  if (fund.ausgefuehrt) {
    errs.push('CODE LIEF: die Muster ' + JSON.stringify(fund.ausgefuehrt) +
      ' wurden ausgeführt — fremder Code im Browser jedes Kollegen');
  }
  Object.keys(fund.eingeschleust).forEach(k => {
    if (fund.eingeschleust[k] > 0) {
      errs.push('EINGESCHLEUST (' + k + '): ' + fund.eingeschleust[k] +
        ' — aus Nutzertext ist ein Element geworden');
    }
  });
  /* Gegenprobe. Ohne sie wäre auch ein Durchlauf grün, bei dem die
     Attrappe gar nichts geliefert hat. */
  if (!fund.sichtbar) {
    errs.push('GEGENPROBE: die Nutzlast steht nirgends als Text — dieser ' +
      'Durchlauf hat nichts geprüft');
  }

  await page.screenshot({ path: path.join(SP, 'xss.png'), fullPage: false });
  await b.close();

  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ XSS: acht Muster in Chat, Namen, Aufgaben, Notizen, Umfragen und ' +
      'Dokumenten — nichts davon wird zu Code, alles bleibt Text');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
