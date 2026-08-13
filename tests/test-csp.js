/* ── Content-Security-Policy: hält sie, und lässt sie die App leben ───
   Die Regel steht als <meta> in index.html, nicht als Kopfzeile beim
   Hoster. Zwei Gründe: sie reist mit der Datei, und der Browser setzt
   sie damit auch hier im Durchlauf durch. Eine Regel, die nur im Betrieb
   gilt, ist eine Regel, die niemand vorher misst.

   Drei Fragen:
     1. Passt die Regel noch zur Datei? Die beiden Skriptblöcke sind über
        ihre Prüfsumme erlaubt. Ein geändertes Zeichen darin, und der
        Browser führt sie nicht mehr aus — weisse Seite, für alle.
     2. Verbietet sie das Richtige? 'unsafe-inline' im script-src würde
        genau das erlauben, wogegen sie steht.
     3. Bricht sie etwas? Zwölf Ansichten werden geöffnet und jede
        Verletzung mitgeschrieben.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const csp = require(path.join(SP, '..', 'tools', 'csp.js'));

const errs = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) console.log('  ✓ ' + name);
  else { console.log('  ✗ ' + name + (zusatz ? '  — ' + zusatz : '')); errs.push(name); }
}

const ANSICHTEN = [
  ['home', 'g-start'], ['chat', 'g-komm'], ['ann', 'g-komm'], ['dm', 'g-komm'],
  ['todos', 'g-arbeit'], ['putzplan', 'g-arbeit'], ['material', 'g-arbeit'],
  ['geraete', 'g-arbeit'], ['docs', 'g-arbeit'], ['team', 'g-team'],
  ['chef', 'g-chef'], ['archive', 'g-chef']
];

(async () => {
  // ══ 1. Regel und Datei passen zusammen ══
  console.log('── Die Regel in index.html ──');
  const html = fs.readFileSync(csp.DATEI, 'utf8');
  const ist = csp.vorhandene(html);
  pruefe('index.html trägt eine CSP', !!ist);
  pruefe('sie passt zu den Skriptblöcken der Datei', ist === csp.neue(html),
    'node tools/csp.js --setzen');

  const teile = String(ist || '').split(/;\s*/);
  const script = teile.find(t => t.indexOf('script-src') === 0) || '';
  pruefe('script-src erlaubt KEIN unsafe-inline', !/unsafe-inline/.test(script), script);
  pruefe('script-src erlaubt KEIN unsafe-eval', !/unsafe-eval/.test(script), script);
  pruefe('script-src erlaubt kein https: pauschal', !/\shttps:(\s|$)/.test(script), script);
  pruefe('default-src steht auf none', teile.indexOf("default-src 'none'") === 0, teile[0]);
  ['object-src \'none\'', 'base-uri \'none\'', 'form-action \'none\'', 'frame-src \'none\'']
    .forEach(d => pruefe('gesetzt: ' + d, teile.indexOf(d) >= 0));
  pruefe('beide Skriptblöcke sind über ihre Prüfsumme erlaubt',
    (script.match(/'sha256-/g) || []).length === csp.bloecke(html).length,
    script);

  // ══ 2. Kein Ereignis-Attribut mehr im Markup ══
  /* Ein onclick="…" ist fuer die Regel fremder Code. Solche Attribute
     fielen frueher nicht auf, weil sie funktionierten. */
  const attribute = (html.match(/\son(click|load|error|change|input|submit)="/g) || []);
  pruefe('kein Ereignis im Attribut (onclick und Verwandte)',
    attribute.length === 0, attribute.join(' '));

  // ══ 3. Der Browser: bricht die Regel etwas? ══
  console.log('\n── Zwölf Ansichten unter der Regel ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 900 } });
  const verstoesse = [];
  const seitenfehler = [];
  page.on('pageerror', e => seitenfehler.push(e.message.slice(0, 160)));
  await page.exposeFunction('__cspFund', (d) => verstoesse.push(d));
  await page.addInitScript(`
    document.addEventListener('securitypolicyviolation', function (e) {
      window.__cspFund({
        richtlinie: e.violatedDirective,
        quelle: String(e.blockedURI || '').slice(0, 90),
        zeile: e.lineNumber || 0
      });
    });
  `);
  /* gstatic wird hier abgewiesen wie in allen Durchläufen — die Attrappe
     ersetzt das SDK. Eine abgewiesene Anfrage ist KEINE Verletzung der
     Regel; sie käme sonst als Fund durch und wäre keiner. */
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  for (const [view, gruppe] of ANSICHTEN) {
    await page.evaluate(async ({ v, g }) => {
      const grp = document.querySelector('.mobnav [data-group="' + g + '"]');
      if (grp) grp.click();
      await new Promise(r => setTimeout(r, 200));
      const t = document.querySelector('[data-subview="' + v + '"]');
      if (t) t.click();
    }, { v: view, g: gruppe });
    await page.waitForTimeout(450);
  }
  /* Fenster und erzeugte Inhalte: dort entsteht das meiste Markup zur
     Laufzeit, und dort wäre ein Ereignis-Attribut noch versteckt. */
  await page.evaluate(async () => {
    const a = document.getElementById('uAvatar');
    if (a) a.click();
    await new Promise(r => setTimeout(r, 600));
    const zu = document.querySelector('#profileModal .pm-x, #profileModal [data-close]');
    if (zu) zu.click();
  });
  await page.waitForTimeout(800);

  /* Lief der grosse Skriptblock überhaupt? Wäre seine Prüfsumme falsch,
     bliebe die Seite leer — und ohne diese Frage wäre der Durchlauf
     trotzdem grün, weil eine leere Seite nichts verletzt. */
  const lebt = await page.evaluate(() => ({
    ansicht: !!document.querySelector('.view.on, .view.active, #view-home'),
    leiste: document.querySelectorAll('.mobnav [data-group]').length,
    text: document.body.textContent.replace(/\s+/g, ' ').trim().length,
    schrift: (document.getElementById('schriftLink') || {}).media
  }));
  console.log('  Zustand:', JSON.stringify(lebt));
  pruefe('GEGENPROBE die App läuft unter der Regel (Skriptblock erlaubt)',
    lebt.leiste >= 4 && lebt.text > 400, JSON.stringify(lebt));
  pruefe('der zweite Block läuft auch (Schrift auf all gestellt)',
    lebt.schrift === 'all', String(lebt.schrift));

  const echte = verstoesse.filter(v => !/gstatic|fonts\.googleapis/.test(v.quelle));
  console.log('  Verletzungen gesamt:', verstoesse.length,
    '· davon nicht durch abgewiesene Anfragen erklärt:', echte.length);
  echte.slice(0, 8).forEach(v => console.log('     ', v.richtlinie, v.quelle, 'Zeile', v.zeile));
  pruefe('keine Verletzung in zwölf Ansichten', echte.length === 0,
    echte.map(v => v.richtlinie + ' ' + v.quelle).join(' | '));
  pruefe('keine Skriptfehler durch die Regel',
    seitenfehler.length === 0, seitenfehler.join(' | '));

  // ══ 4. Der Test, der rot werden muss ══
  /* Ein Prüfer, der nie anschlägt, prüft nichts: hier wird absichtlich
     Code eingeschleust, wie ihn eine vergessene Maskierung durchliesse. */
  const angriff = await page.evaluate(() => new Promise(resolve => {
    window.__geknackt = false;
    const d = document.createElement('div');
    d.innerHTML = '<img src="x" onerror="window.__geknackt=true">' +
                  '<script>window.__geknackt=true<\/script>';
    document.body.appendChild(d);
    const s = document.createElement('script');
    s.textContent = 'window.__geknackt=true';
    document.body.appendChild(s);
    setTimeout(() => resolve(window.__geknackt), 400);
  }));
  console.log('  Eingeschleuster Code lief:', angriff);
  pruefe('GEGENPROBE eingeschleuster Code wird von der Regel gestoppt', angriff === false);

  await page.screenshot({ path: path.join(SP, 'csp.png') });
  await b.close();

  console.log(errs.length
    ? '\n✗ ' + errs.length + ' Fehler bei der Sicherheitsregel'
    : '\n✓ CSP: keine Verletzung in zwölf Ansichten, die App läuft, ' +
      'eingeschleuster Code läuft nicht');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
