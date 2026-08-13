/* ── Gestaltung: Symbole und Rundungen ────────────────────────────────
   Beides ist von Hand aufgeräumt worden, und beides kommt von selbst
   wieder, wenn nichts danach schaut.

   1. SYMBOLE. Ein Emoji bringt eigene Farben mit, ignoriert Hell- und
      Dunkelmodus und sieht auf jedem Betriebssystem anders aus. Die App
      benutzt dafür ikon() — ein Satz Konturzeichen in currentColor.
      Erlaubt bleiben Emoji nur dort, wo sie Inhalt sind: Chat-Reaktionen,
      Avatare, der Geburtstagsgruss.

   2. RUNDUNGEN. Es gab zwölf verschiedene feste Werte zwischen 2 und
      30 px, daneben eine Leiter in :root, die nur vierzehnmal benutzt
      wurde. Feste Werte gehören nicht ins Stylesheet.

   Ohne Browser: die Datei wird gelesen und ausgewertet.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');

const DATEI = path.join(__dirname, '..', 'index.html');
const quelle = fs.readFileSync(DATEI, 'utf8');
const errs = [];

const css = quelle.slice(quelle.indexOf('<style>') + 7, quelle.indexOf('</style>'));

/* Kommentare heraus: dort stehen Kastenlinien und Beispiele, die sonst
   als Fund gezählt würden. Bei den Zeilenkommentaren nur die, die eine
   Zeile beginnen — sonst trifft das Muster auch das // in einer Adresse. */
const ohneKommentar = quelle
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

/* ══ 1. Keine Emoji als Symbol ══ */
{
  /* Inhalt, kein Symbol — diese dürfen bleiben. */
  const ERLAUBT = new Set([
    '👍', '❤️', '❤', '😂', '🎉', '👏', '😮',  // Chat-Reaktionen
    '⌘',                                      // Befehlstaste auf dem Mac
    '✓', '✗', '○', '→', '↔', '↑', '←'         // Textzeichen, keine Bildchen
  ]);
  const EMOJI = /[\u{1F000}-\u{1FAFF}]|[\u{2300}-\u{27BF}]|[\u{2B00}-\u{2BFF}]|[\u{FE0F}]/gu;
  const KASTEN = /[─═╔╗╚╝║│┌┐└┘]/u;

  const funde = [];
  ohneKommentar.split('\n').forEach((z, i) => {
    const treffer = (z.match(EMOJI) || []).filter(e =>
      !ERLAUBT.has(e) && !KASTEN.test(e) && e !== '️');
    if (treffer.length) funde.push((i + 1) + ': ' + treffer.join(' ') + '  →  ' + z.trim().slice(0, 70));
  });

  console.log('Emoji ausserhalb der Inhalts-Liste:', funde.length);
  funde.slice(0, 8).forEach(f => console.log('   ' + f));
  if (funde.length) {
    errs.push('EMOJI ALS SYMBOL: ' + funde.length + ' Stelle(n). Statt eines Emoji ' +
      'gehört dorthin ikon(\'name\') — ein Emoji ignoriert Hell/Dunkel und sieht ' +
      'auf jedem Gerät anders aus');
  }
}

/* ══ 2. Der Symbolsatz ist heil ══
   Ein Tippfehler im Namen gibt eine leere Zeichenkette zurück — der Knopf
   bleibt dann stumm, ohne Fehlermeldung. */
{
  const satz = /var IKONEN = \{([\s\S]*?)\n\};/.exec(quelle);
  if (!satz) {
    errs.push('FEHLT: der Symbolsatz IKONEN steht nicht mehr in index.html');
  } else {
    const namen = new Set((satz[1].match(/^\s{2}([a-zA-Z]+):/gm) || [])
      .map(z => z.trim().replace(':', '')));

    /* Die Pfaddaten je Name, damit sich das feste Markup dagegen prüfen
       lässt. */
    const pfad = {};
    namen.forEach(n => {
      const m = new RegExp(n + ':\\s*((?:\\s*\'[^\']*\'\\s*\\+?)+)').exec(satz[1]);
      if (m) pfad[n] = (m[1].match(/'([^']*)'/g) || [])
        .map(x => x.slice(1, -1)).join('').replace(/\s+/g, ' ').trim();
    });
    const nachPfad = {};
    Object.keys(pfad).forEach(n => { nachPfad[pfad[n]] = n; });

    /* Im Markup steht das SVG ausgeschrieben — dort kann keine Funktion
       laufen. Beide Fassungen müssen dasselbe zeichnen, sonst driften sie
       auseinander und niemand merkt es. */
    const mk = quelle.slice(quelle.indexOf('<body>'), quelle.indexOf('<script src="konfig.js"'));
    const imMarkup = new Set();
    const fremd = [];
    (mk.match(/<svg class="sym[^"]*"[^>]*>[\s\S]*?<\/svg>/g) || []).forEach(tag => {
      const innen = tag.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
        .replace(/\s+/g, ' ').trim();
      if (nachPfad[innen]) imMarkup.add(nachPfad[innen]);
      else fremd.push(innen.slice(0, 60));
    });
    if (fremd.length) {
      errs.push('SVG IM MARKUP GEHÖRT NICHT ZUM SATZ: ' + fremd.length +
        ' Stelle(n), z. B. „' + fremd[0] + '" — dann zeichnen Markup und ikon() ' +
        'zwei verschiedene Symbole für dieselbe Sache');
    }

    const viaIkon = new Set((quelle.match(/ikon\('([a-zA-Z]+)'/g) || [])
      .map(z => z.slice(6, -1)));
    const benutzt = new Set([...viaIkon, ...imMarkup]);
    console.log('Symbole definiert:', namen.size,
      '· über ikon():', viaIkon.size, '· fest im Markup:', imMarkup.size);

    const unbekannt = [...viaIkon].filter(n => !namen.has(n));
    if (unbekannt.length) {
      errs.push('SYMBOL GIBT ES NICHT: ikon(\'' + unbekannt.join('\'), ikon(\'') +
        '\') — gibt eine leere Zeichenkette zurück, der Knopf bleibt stumm');
    }
    const ungenutzt = [...namen].filter(n => !benutzt.has(n));
    if (ungenutzt.length) {
      errs.push('TOTER BALLAST: ' + ungenutzt.length + ' Symbol(e) werden nirgends ' +
        'benutzt (' + ungenutzt.join(', ') + ')');
    }
    /* Gegenprobe: es gibt überhaupt Symbole. Sonst wäre eine App ganz
       ohne Symbole der grünste Durchlauf von allen. */
    if (benutzt.size < 5) {
      errs.push('GEGENPROBE: nur ' + benutzt.size + ' Symbole in Benutzung — ' +
        'entweder sind sie verschwunden oder dieser Durchlauf misst falsch');
    }
  }
}

/* ══ 3. Keine festen Rundungen ══ */
{
  /* Zwei bleiben mit Grund: das Konfetti-Teilchen und das Kästchen eines
     Teilschritts. Für beide gibt es keine Stufe, beide stehen genau
     einmal. */
  const AUSNAHMEN = new Set(['2px', '5px']);
  const cssOhne = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const fest = {};
  (cssOhne.match(/border-radius:\s*[^;}]+/g) || []).forEach(a => {
    a.replace('border-radius:', '').trim().split(/\s+/).forEach(w => {
      if (w === '0' || w.startsWith('var(') || AUSNAHMEN.has(w)) return;
      fest[w] = (fest[w] || 0) + 1;
    });
  });
  const liste = Object.keys(fest);
  console.log('feste Rundungswerte:', liste.length ? liste.map(k => k + '×' + fest[k]).join(' ') : 'keine');
  if (liste.length) {
    errs.push('FESTE RUNDUNG: ' + liste.map(k => k + ' (' + fest[k] + '×)').join(', ') +
      ' — gehört auf die Leiter in :root (--r-xs … --radius-lg, --r-pille, --r-rund)');
  }

  /* Gegenprobe: die Leiter existiert und wird auch benutzt. */
  const stufen = (css.match(/--r-(?:xs|sm|md|lg|pille|rund):/g) || []).length;
  const benutzt = (css.match(/border-radius:[^;}]*var\(--r/g) || []).length;
  console.log('Stufen in :root:', stufen, '· Verwendungen:', benutzt);
  if (stufen < 6) errs.push('GEGENPROBE: die Rundungs-Leiter ist unvollständig (' + stufen + ' Stufen)');
  if (benutzt < 50) errs.push('GEGENPROBE: die Leiter wird kaum benutzt (' + benutzt + '×)');
}

console.log(errs.length
  ? '\n✗ ' + errs.join('\n✗ ')
  : '\n✓ Gestaltung: Symbole aus einem Satz, Rundungen von einer Leiter');
process.exit(errs.length ? 1 : 0);
