/* ══════════════════════════════════════════════════════════════════════
   AUSSEHEN: SELBST EINSTELLEN — UND ZURÜCKNEHMEN KÖNNEN

   Aus dem Betrieb, 21.9.2026:
     „das ganze aussehen für sich sollte man selber viel mehr customizen
      können und die hintergründe sollen besser aussehen etc. und man
      sollte auch alle funktionen wieder zurücksetzten können das man
      einfach das standard design von uns geniessen kann."

   Was vorher war: sechs Akzentfarben, sechs Chat-Hintergründe, und ein
   Hintergrund NUR für den Chat — also für eine von zwölf Ansichten.
   Kein Weg zurück.

   Drei Dinge, die dieser Durchlauf festhält, und warum gerade die:

   1. DER WEG ZURÜCK MUSS WIRKLICH ZURÜCKFÜHREN. Ein Knopf, der
      „zurückgesetzt ✓" meldet und eine Einstellung stehen lässt, ist
      schlimmer als keiner: man glaubt, man sei wieder am Anfang, und
      sucht den Fehler woanders. Geprüft wird deshalb nicht die
      Meldung, sondern der Zustand — nachdem ALLE fünf Einstellungen
      verstellt wurden.

   2. DIE AKZENTFARBE MUSS DURCHSCHLAGEN. Die Hintergründe hatten ihre
      Farben fest verdrahtet: wer auf Grün stellte, bekam trotzdem
      einen violetten Schimmer. Eine Einstellung, die eine zweite
      stillschweigend überstimmt, ist keine.

   3. DER APP-HINTERGRUND MUSS AUF DER APP LIEGEN, nicht nur im Chat.
      Sonst ist es derselbe Schalter unter neuem Namen.

   Und die Gegenprobe zu allem: auf „Schlicht" darf KEIN Muster
   dastehen. Ein Durchlauf, der nur prüft, dass etwas erscheint, wäre
   mit einem dauerhaft eingeschalteten Hintergrund grün.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

/* Der Weg, den ein Mensch nimmt: Avatar oben → Reiter „Aussehen". */
async function zumAussehen(p) {
  await p.evaluate(() => {
    const a = document.getElementById('uAvatar');
    if (a) a.click();
  });
  await p.waitForTimeout(700);
  await p.evaluate(() => {
    const t = document.querySelector('[data-pmtab="aussehen"]');
    if (t) t.click();
  });
  await p.waitForTimeout(700);
}

async function stand(p) {
  return await p.evaluate(() => ({
    theme: document.body.classList.contains('light') ? 'light' : 'dark',
    /* Die GEWÄHLTE Einstellung, nicht die gerade gezeichnete Farbe.
       Seit „Lebendig" sind das zwei verschiedene Dinge: die Farbe hängt
       am Bereich, die Einstellung nicht. Ein Vergleich „vorher ungleich
       nachher" über die Farbe wäre falsch grün, sobald der gerade
       offene Bereich zufällig dieselbe Farbe trägt. */
    gewaehlt: (function () {
      try { return (JSON.parse(localStorage.getItem('kf_prefs') || '{}')).accent; }
      catch (e) { return null; }
    })(),
    appbg: document.body.getAttribute('data-appbg'),
    chatbg: document.body.getAttribute('data-chatbg'),
    /* Am <body> gelesen und nicht mehr am <html>: seit dem 21.9.2026
       setzt akzentAnwenden() die Farben dort. Der Grund steht in der
       Funktion — body.light{} setzt dieselben Namen noch einmal, und
       ein Wert am Vorfahren verliert gegen eine Regel, die den
       Nachfahren trifft. Am <html> stünde hier ab jetzt der
       Rückfallwert aus dem Stylesheet, und der ändert sich nie: der
       Durchlauf wäre grün, ohne etwas zu prüfen. */
    akzent: getComputedStyle(document.body)
      .getPropertyValue('--accent').trim(),
    schleier: getComputedStyle(document.body)
      .getPropertyValue('--akz-w').trim(),
    fs: getComputedStyle(document.documentElement)
      .getPropertyValue('--fs').trim(),
    /* Was WIRKLICH gezeichnet wird, nicht was eingestellt ist. */
    appMuster: (function () {
      const a = document.querySelector('.app');
      if (!a) return 'keine .app';
      return getComputedStyle(a, '::before').backgroundImage;
    })()
  }));
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 900 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3300);
  await zumAussehen(p);

  // ══ 1. Es gibt überhaupt mehr zu wählen ══
  console.log('\n── Was zur Auswahl steht ──');
  const auswahl = await p.evaluate(() => ({
    appbg: [...document.querySelectorAll('#appbgOpts [data-appbg]')].map(x => x.dataset.appbg),
    chatbg: [...document.querySelectorAll('#bgOpts [data-bg]')].map(x => x.dataset.bg),
    akzente: [...document.querySelectorAll('#accOpts [data-acc]')].map(x => x.dataset.acc),
    reset: !!document.getElementById('pmReset')
  }));
  console.log('  App-Hintergründe: ' + auswahl.appbg.join(', '));
  console.log('  Chat-Hintergründe: ' + auswahl.chatbg.join(', '));
  console.log('  Akzente: ' + auswahl.akzente.join(', '));

  pruefe('es gibt eine Auswahl für den Hintergrund der ganzen App',
    auswahl.appbg.length >= 4, String(auswahl.appbg.length));
  pruefe('„Schlicht" ist dabei — ohne Muster muss möglich bleiben',
    auswahl.appbg.indexOf('keiner') >= 0, auswahl.appbg.join(' '));
  pruefe('mehr Akzentfarben als vorher (waren 6)',
    auswahl.akzente.length > 6, String(auswahl.akzente.length));
  /* „Lebendig" ist seit dem 21.9.2026 die Voreinstellung und steht
     vorn. Es ist keine Farbe, sondern die Regel „nimm die Farbe des
     Bereichs" — geprüft wird es ausführlich in test-akzent.js; hier
     nur, dass es zur Auswahl steht und an erster Stelle. */
  pruefe('„Lebendig" steht zur Auswahl, und zwar zuerst',
    auswahl.akzente[0] === 'bunt', auswahl.akzente.join(' '));
  pruefe('mehr Chat-Hintergründe als vorher (waren 7 mit Foto)',
    auswahl.chatbg.length > 7, String(auswahl.chatbg.length));
  pruefe('es gibt einen Knopf zum Zurücksetzen', auswahl.reset);

  /* Jede Vorschaufläche muss auch ein Muster tragen. Eine leere Kachel
     mit Beschriftung sieht aus wie eine Auswahl und ist keine — ausser
     bei „Schlicht", wo leer die Aussage IST. */
  console.log('\n── Die Vorschauflächen ──');
  const vorschau = await p.evaluate(() =>
    [...document.querySelectorAll('#appbgOpts .opt-prev, #bgOpts .opt-prev')].map(el => ({
      id: el.dataset.aprev || el.dataset.prev,
      bild: getComputedStyle(el).backgroundImage
    })));
  vorschau.forEach(v => {
    const leerErlaubt = v.id === 'keiner' || v.id === 'eigenes';
    pruefe('Vorschau „' + v.id + '" zeigt ' + (leerErlaubt ? 'nichts (richtig)' : 'ein Muster'),
      leerErlaubt ? true : (v.bild && v.bild !== 'none'), v.bild.slice(0, 50));
  });

  // ══ 2. Der App-Hintergrund liegt auf der App ══
  console.log('\n── Der Hintergrund der ganzen App ──');
  const ohne = await stand(p);
  pruefe('GEGENPROBE auf „Schlicht" liegt kein Muster auf der App',
    ohne.appMuster === 'none', ohne.appMuster);

  await p.evaluate(() => document.querySelector('[data-appbg="schimmer"]').click());
  await p.waitForTimeout(600);
  const mit = await stand(p);
  console.log('  nach „Schimmer": ' + mit.appMuster.slice(0, 80));
  pruefe('„Schimmer" legt ein Muster auf die App',
    mit.appMuster !== 'none' && /gradient/.test(mit.appMuster), mit.appMuster.slice(0, 60));
  pruefe('das Merkmal am body steht auf schimmer', mit.appbg === 'schimmer', mit.appbg);

  // ══ 3. Die Akzentfarbe schlägt durch ══
  /* Der eigentliche Fund: vorher standen im Hintergrund feste Violett-
     und Cyanwerte. Zwei verschiedene Akzente mussten also denselben
     Schleier ergeben — und genau das wird hier verglichen. */
  console.log('\n── Die Akzentfarbe im Hintergrund ──');
  await p.evaluate(() => document.querySelector('[data-acc="gruen"]').click());
  await p.waitForTimeout(500);
  const gruen = await stand(p);
  await p.evaluate(() => document.querySelector('[data-acc="koralle"]').click());
  await p.waitForTimeout(500);
  const koralle = await stand(p);
  console.log('  Grün:    ' + gruen.akzent + '  Schleier ' + gruen.schleier);
  console.log('  Koralle: ' + koralle.akzent + '  Schleier ' + koralle.schleier);

  pruefe('zwei Akzente ergeben zwei verschiedene Farben',
    gruen.akzent !== koralle.akzent, gruen.akzent + ' / ' + koralle.akzent);
  pruefe('und zwei verschiedene Schleier im Hintergrund',
    gruen.schleier !== koralle.schleier && !!gruen.schleier,
    gruen.schleier + ' / ' + koralle.schleier);
  pruefe('der Schleier ist eine rgba-Farbe, keine Kennung',
    /^rgba?\(/.test(koralle.schleier), koralle.schleier);

  // ══ 4. Der Weg zurück ══
  /* Erst ALLE fünf verstellen, dann zurücksetzen. Wer nur eine
     verstellt, prüft nur eine — und der häufige Fehler ist gerade,
     dass eine einzelne vergessen wird. */
  console.log('\n── Zurücksetzen ──');
  await p.evaluate(async () => {
    document.querySelector('[data-th="light"]').click();
    await new Promise(r => setTimeout(r, 250));
    document.querySelector('[data-fs="125"]').click();
    await new Promise(r => setTimeout(r, 250));
    document.querySelector('[data-acc="orange"]').click();
    await new Promise(r => setTimeout(r, 250));
    document.querySelector('[data-bg="papier"]').click();
    await new Promise(r => setTimeout(r, 250));
    document.querySelector('[data-appbg="ecken"]').click();
  });
  await p.waitForTimeout(800);
  const verstellt = await stand(p);
  console.log('  verstellt: ' + JSON.stringify({
    theme: verstellt.theme, fs: verstellt.fs, akzent: verstellt.akzent,
    chatbg: verstellt.chatbg, appbg: verstellt.appbg }));

  /* GEGENPROBE zur Gegenprobe: ist überhaupt etwas verstellt? Sonst
     prüft das Zurücksetzen unten gar nichts. */
  pruefe('GEGENPROBE es ist wirklich alles verstellt',
    verstellt.theme === 'light' && verstellt.fs === '125%' &&
    verstellt.chatbg === 'papier' && verstellt.appbg === 'ecken',
    JSON.stringify(verstellt));

  /* Der Knopf fragt nach. Ein „Zurücksetzen" ohne Rückfrage wäre der
     falsche Knopf an der falschen Stelle. */
  p.once('dialog', d => d.accept());
  await p.evaluate(() => document.getElementById('pmReset').click());
  await p.waitForTimeout(900);
  const zurueck = await stand(p);
  console.log('  zurückgesetzt: ' + JSON.stringify({
    theme: zurueck.theme, fs: zurueck.fs, akzent: zurueck.akzent,
    chatbg: zurueck.chatbg, appbg: zurueck.appbg }));

  pruefe('Schriftgröße steht wieder auf 100 %', zurueck.fs === '100%', zurueck.fs);
  pruefe('GEGENPROBE die Akzentwahl stand wirklich auf Orange',
    verstellt.gewaehlt === 'orange', String(verstellt.gewaehlt));
  pruefe('Akzentfarbe steht wieder auf der Voreinstellung „Lebendig"',
    zurueck.gewaehlt === 'bunt', String(zurueck.gewaehlt));
  pruefe('Chat-Hintergrund ist wieder „verlauf"',
    zurueck.chatbg === 'verlauf', zurueck.chatbg);
  pruefe('App-Hintergrund ist wieder „keiner"',
    zurueck.appbg === 'keiner', zurueck.appbg);
  pruefe('und damit liegt auch kein Muster mehr auf der App',
    zurueck.appMuster === 'none', zurueck.appMuster);

  /* Und die Frage, die man nach einem „Zurücksetzen" wirklich hat:
     hält es auch das Neuladen? Eine Einstellung, die nur im Speicher
     zurückgeht, ist beim nächsten Start wieder da. */
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  const nachNeu = await stand(p);
  pruefe('nach dem Neuladen bleibt es zurückgesetzt',
    nachNeu.chatbg === 'verlauf' && nachNeu.appbg === 'keiner' && nachNeu.fs === '100%',
    JSON.stringify({ chatbg: nachNeu.chatbg, appbg: nachNeu.appbg, fs: nachNeu.fs }));

  pruefe('keine Skriptfehler', fehler.length === 0, fehler[0]);

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Aussehen: mehr zu wählen, die Farbe schlägt durch, und der Weg ' +
      'zurück führt zurück — ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
