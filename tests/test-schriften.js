/* ── Schriften: lokal, vollständig, und kein Abruf nach draussen ──────
   Bis zum 17.9.2026 kamen Barlow und Barlow Condensed von
   fonts.googleapis.com. Beim Laden der Seite ging damit die IP-Adresse
   jedes Besuchers an Google, ohne dass er gefragt wurde — der einzige
   Drittabruf im ganzen System. Seitdem liegen die Dateien unter
   schriften/.

   Eine Umstellung wie diese fällt nicht auf, wenn sie schiefgeht: der
   Browser nimmt still eine Ersatzschrift, und die Seite sieht nur ein
   bisschen anders aus. Deshalb wird hier gemessen, nicht angenommen.

   Vier Fragen:
     1. Wird noch irgendetwas von Google geholt? Jede Anfrage nach
        draussen wird mitgeschrieben — auch die, die keiner erwartet.
     2. Kommen die Schriften wirklich an? document.fonts sagt es;
        eine @font-face-Regel allein sagt gar nichts.
     3. Wird auch wirklich Barlow gezeichnet, oder steht dort die
        Ersatzschrift? Gemessen an der Breite desselben Textes.
     4. Sind alle neun Dateien da, und sind es Schriftdateien?
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const WURZEL = path.join(__dirname, '..');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) console.log('  ✓ ' + name);
  else { console.log('  ✗ ' + name + (zusatz ? '  — ' + zusatz : '')); errs.push(name); }
}

(async () => {
  // ══ 1. Die Dateien selbst ══
  console.log('── Die Dateien ──');
  const ordner = path.join(WURZEL, 'schriften');
  const dateien = fs.existsSync(ordner)
    ? fs.readdirSync(ordner).filter(f => /\.woff2$/.test(f)).sort() : [];
  let summe = 0;
  dateien.forEach((f) => {
    const p = path.join(ordner, f);
    const g = fs.statSync(p).size;
    summe += g;
    /* woff2 beginnt mit den vier Zeichen "wOF2". Ohne diese Frage würde
       eine Fehlerseite, die curl als Datei abgelegt hat, hier als
       Schrift durchgehen — sie hat schliesslich auch eine Grösse. */
    const kopf = fs.readFileSync(p).slice(0, 4).toString('latin1');
    pruefe(f.padEnd(30) + (g / 1024).toFixed(1) + ' KB', kopf === 'wOF2', kopf);
  });
  console.log('  zusammen: ' + (summe / 1024).toFixed(1) + ' KB');
  pruefe('neun Schnitte liegen im Ordner', dateien.length === 9,
    dateien.length + ' Dateien');

  // ══ 2. Die Regeln in der Datei ══
  console.log('\n── Was index.html sagt ──');
  const html = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
  const regeln = html.match(/@font-face\{[^}]*\}/g) || [];
  pruefe('für jede Datei gibt es eine @font-face-Regel',
    regeln.length === dateien.length, regeln.length + ' Regeln');
  regeln.forEach((r) => {
    const u = /url\(([^)]+)\)/.exec(r);
    const datei = u ? path.basename(u[1]) : '(keine url)';
    pruefe('die Regel zeigt auf eine vorhandene Datei: ' + datei,
      dateien.indexOf(datei) >= 0, r.slice(0, 80));
  });
  /* font-display:swap heisst: Text wird sofort gezeichnet, notfalls mit
     der Ersatzschrift, und die richtige Schrift springt nach. Ohne das
     bleibt der Text bis zu drei Sekunden unsichtbar. */
  pruefe('jede Regel hat font-display:swap',
    regeln.every(r => /font-display:\s*swap/.test(r)));
  /* Kommentare heraus, bevor gesucht wird: in beiden Dateien steht
     erklärt, dass die Schriften FRÜHER von Google kamen, und dort fällt
     der Name naturgemäss. Ein Prüfer, der den Namen im Fliesstext für
     einen Abruf hält, zwingt dazu, die Erklärung zu löschen — und die
     Erklärung ist das Wertvollere. Gesucht wird nach dem, was wirklich
     einen Abruf auslöst: eine Adresse in href, src oder url(). */
  function ohneKommentare(t) {
    return t.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  }
  const ABRUF = /(href|src)\s*=\s*["']https?:\/\/fonts\.(googleapis|gstatic)\.com|url\(\s*["']?https?:\/\/fonts\./g;

  [['index.html', html], ['werbung.html', fs.readFileSync(
    path.join(WURZEL, 'werbung.html'), 'utf8')]].forEach(([name, text]) => {
    const treffer = ohneKommentare(text).match(ABRUF) || [];
    pruefe('kein Google-Abruf mehr in ' + name, treffer.length === 0,
      treffer.join(' '));
    /* GEGENPROBE: findet das Muster überhaupt etwas? Sonst wäre die
       Zusicherung darüber für immer grün. */
    pruefe('GEGENPROBE das Muster erkennt einen Google-Abruf (' + name + ')',
      ('<link href="https://fonts.googleapis.com/css2?family=Barlow" />')
        .match(ABRUF) !== null);
  });

  // ══ 3. Der Browser: was wird geholt, was kommt an ══
  console.log('\n── Im Browser ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 900 } });

  const nachDraussen = [];
  const geholt = [];
  page.on('request', (r) => {
    const u = r.url();
    if (/^https?:\/\/127\.0\.0\.1:|^data:|^blob:/.test(u)) {
      if (/\.woff2?$/.test(u)) geholt.push(u.split('/').pop());
      return;
    }
    nachDraussen.push(u.slice(0, 100));
  });
  /* Das Firebase-SDK kommt von gstatic und wird hier — wie in allen
     Durchläufen — abgewiesen. Es steht trotzdem in der Liste, denn die
     Frage ist, WAS die Seite anfragt, nicht was ankommt. */
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.addInitScript({ path: path.join(__dirname, 'stub-chef.js') });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);

  const fremd = nachDraussen.filter(u => !/gstatic\.com\/firebasejs/.test(u));
  console.log('  Anfragen nach draussen:', nachDraussen.length,
    '· davon nicht das Firebase-SDK:', fremd.length);
  fremd.slice(0, 10).forEach(u => console.log('     ', u));
  pruefe('kein Abruf zu fonts.googleapis.com oder fonts.gstatic.com',
    !nachDraussen.some(u => /fonts\.(googleapis|gstatic)\.com/.test(u)),
    nachDraussen.filter(u => /fonts\./.test(u)).join(' '));
  pruefe('ausser dem Firebase-SDK geht nichts nach draussen',
    fremd.length === 0, fremd.join(' | '));

  console.log('  lokal geholte Schriftdateien:', geholt.length,
    geholt.length ? '(' + geholt.join(', ') + ')' : '');

  /* Welche Schnitte der Browser wirklich lädt, hängt davon ab, was auf
     der Seite steht — nicht jede Seite braucht alle neun. Geprüft wird
     deshalb, dass überhaupt lokal geladen wurde und dass document.fonts
     die geladenen Schnitte als fertig meldet. */
  const stand = await page.evaluate(async () => {
    await document.fonts.ready;
    const aus = [];
    document.fonts.forEach(f => aus.push(
      { familie: f.family, gewicht: f.weight, stand: f.status }));
    return aus;
  });
  const fertig = stand.filter(f => f.stand === 'loaded');
  console.log('  document.fonts: ' + stand.length + ' Regeln · ' +
    fertig.length + ' geladen');
  pruefe('mindestens ein Schnitt ist wirklich geladen', fertig.length > 0,
    JSON.stringify(stand.slice(0, 4)));
  pruefe('kein Schnitt steht auf error',
    !stand.some(f => f.stand === 'error'),
    JSON.stringify(stand.filter(f => f.stand === 'error')));

  // ══ 4. Wird auch wirklich Barlow gezeichnet? ══
  /* GEGENPROBE, ohne die alles davor wertlos wäre: eine @font-face-Regel
     kann sauber geladen sein und die Seite trotzdem in der Ersatzschrift
     zeichnen — etwa wenn die font-family im Stylesheet anders heisst als
     in der Regel. Also wird derselbe Text zweimal gemessen: einmal in
     Barlow, einmal in einer Schrift, die es garantiert nicht gibt. Sind
     beide gleich breit, ist Barlow nicht im Spiel. */
  const breiten = await page.evaluate(async () => {
    function messen(familie) {
      const s = document.createElement('span');
      s.textContent = 'Handgemessen 123 — Grüße, Körperformen';
      s.style.cssText = 'position:absolute;left:-9999px;top:0;' +
        'font-size:48px;font-weight:600;white-space:nowrap;font-family:' + familie;
      document.body.appendChild(s);
      const w = s.getBoundingClientRect().width;
      s.remove();
      return Math.round(w);
    }
    await document.fonts.load("600 48px 'Barlow'");
    await document.fonts.load("600 48px 'Barlow Condensed'");
    return {
      barlow: messen("'Barlow'"),
      condensed: messen("'Barlow Condensed'"),
      ersatz: messen("'GibtEsNichtXYZ'"),
      /* Zwei Gattungen, die jeder Browser kennt und die verschieden
         breit sind. NICHT serif gegen den Ersatznamen: der Ersatzname
         fällt auf die Standardschrift des Browsers zurück, und die IST
         hier serif — dann wären beide Werte gleich, und die Gegenprobe
         würde einen Fehler melden, wo keiner ist. */
      serif: messen('serif'),
      grotesk: messen('sans-serif')
    };
  });
  console.log('  Breiten:', JSON.stringify(breiten));
  pruefe('Barlow wird gezeichnet, nicht die Ersatzschrift',
    breiten.barlow !== breiten.ersatz, JSON.stringify(breiten));
  /* Condensed ist schmaler — das ist der ganze Zweck des Schnitts.
     Damit ist auch gesagt, dass die zwei Familien nicht beide auf
     dieselbe Datei zeigen. */
  pruefe('Barlow Condensed ist schmaler als Barlow',
    breiten.condensed < breiten.barlow,
    breiten.condensed + ' vs ' + breiten.barlow);

  /* GEGENPROBE zur Gegenprobe: misst der Messvorgang überhaupt etwas?
     Wären alle vier Werte gleich, läge der Fehler im Messen. */
  pruefe('GEGENPROBE die Messung unterscheidet Schriften überhaupt',
    breiten.serif !== breiten.grotesk,
    breiten.serif + ' vs ' + breiten.grotesk);

  await page.close();
  await b.close();

  console.log(errs.length
    ? '\n✗ ' + errs.length + ' Fehler bei den Schriften'
    : '\n✓ Schriften: lokal, vollständig, gezeichnet — kein Abruf zu Google');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
