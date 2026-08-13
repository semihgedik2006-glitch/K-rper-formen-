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

/* ══ 4. Keine festen Abstände ══
   padding, margin und gap standen einmal mit 52 verschiedenen Werten
   zwischen 1 und 72 px im Stylesheet — sieben davon lagen einen Pixel
   auseinander. Jetzt gibt es eine Leiter (--s1 … --s72).

   Nicht geprüft werden clamp() und calc(): dort steht bewusst eine
   Rechnung, keine Sprosse. Negative Werte und mm (Druck) ebenfalls
   nicht. */
{
  const cssOhne = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const EIGENSCHAFT = /\b((?:padding|margin|gap|row-gap|column-gap|inset)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?)\s*:\s*([^;}]+)/g;
  const fest = {};
  let m;
  while ((m = EIGENSCHAFT.exec(cssOhne))) {
    const wert = m[2];
    if (/clamp\(|calc\(/.test(wert)) continue;
    wert.trim().split(/\s+/).forEach(w => {
      if (/^\d+px$/.test(w)) fest[w] = (fest[w] || 0) + 1;
    });
  }
  const liste = Object.keys(fest);
  console.log('feste Abstandswerte:', liste.length ? liste.map(k => k + '×' + fest[k]).join(' ') : 'keine');
  if (liste.length) {
    errs.push('FESTER ABSTAND: ' + liste.map(k => k + ' (' + fest[k] + '×)').join(', ') +
      ' — gehört auf die Leiter in :root (--s1 … --s72)');
  }

  const stufen = (css.match(/--s\d+:/g) || []).length;
  const benutzt = (css.match(/var\(--s\d+\)/g) || []).length;
  console.log('Abstands-Stufen:', stufen, '· Verwendungen:', benutzt);
  if (stufen < 10) errs.push('GEGENPROBE: die Abstands-Leiter ist unvollständig (' + stufen + ' Stufen)');
  if (benutzt < 300) errs.push('GEGENPROBE: die Abstands-Leiter wird kaum benutzt (' + benutzt + '×)');
}

/* ══ 5. Dieselbe Eigenschaft nicht zweimal am selben Selektor ══
   Der Stylesheet ist durch Anhängen gewachsen. Steht `transition` einmal
   bei `.btn` oben und noch einmal im Bewegungsabschnitt unten, gewinnt die
   spätere — an der früheren dreht man vergeblich. Genau dieselbe Falle wie
   bei den doppelten @keyframes.

   Ein Selektor darf durchaus mehrfach vorkommen (Grundregel oben, Zustand
   unten). Gezählt wird nur, wenn dieselbe EIGENSCHAFT doppelt gesetzt
   wird. */
{
  /* url(...) herausnehmen: in einer data-URI stehen Doppelpunkte und
     Semikolons, die sonst als Eigenschaften gelesen würden. */
  const rein = css.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
                  .replace(/url\([^)]*\)/g, 'url()');

  function regeln(txt, praefix) {
    const raus = [];
    let i = 0, tiefe = 0, anfang = 0, sel = null;
    while (i < txt.length) {
      const c = txt[i];
      if (c === '{') { if (!tiefe) sel = txt.slice(anfang, i).trim(); tiefe++; }
      else if (c === '}') {
        tiefe--;
        if (!tiefe) {
          const oeff = txt.indexOf('{', anfang);
          const koerper = txt.slice(oeff + 1, i);
          if (/^@(media|supports)/.test(sel)) {
            raus.push(...regeln(koerper, praefix + sel + ' '));
          } else if (sel[0] !== '@') {
            const props = koerper.split(';')
              .filter(p => p.includes(':'))
              .map(p => p.split(':')[0].trim())
              .filter(p => p && !p.startsWith('--'));
            sel.split(',').forEach(t =>
              raus.push({ sel: praefix + t.trim(), props }));
          }
          anfang = i + 1;
        }
      }
      i++;
    }
    return raus;
  }

  const nach = {};
  regeln(rein, '').forEach(r => { (nach[r.sel] = nach[r.sel] || []).push(r.props); });

  const koll = [];
  Object.keys(nach).forEach(sel => {
    if (nach[sel].length < 2) return;
    const zaehler = {};
    nach[sel].forEach(ps => ps.forEach(p => { zaehler[p] = (zaehler[p] || 0) + 1; }));
    const doppelt = Object.keys(zaehler).filter(p => zaehler[p] > 1);
    if (doppelt.length) koll.push(sel + ' (' + doppelt.join(', ') + ')');
  });

  console.log('Selektoren gesamt:', Object.keys(nach).length,
    '· Eigenschaft doppelt gesetzt:', koll.length);
  koll.slice(0, 8).forEach(k => console.log('   ' + k));
  if (koll.length) {
    errs.push('DIESELBE EIGENSCHAFT ZWEIMAL: ' + koll.length + ' Selektor(en), ' +
      'z. B. ' + koll[0] + ' — die spätere Angabe gewinnt, an der früheren ' +
      'dreht man vergeblich');
  }
  if (Object.keys(nach).length < 500) {
    errs.push('GEGENPROBE: nur ' + Object.keys(nach).length + ' Selektoren gefunden — ' +
      'der Zerleger misst am falschen Ort');
  }
}

console.log(errs.length
  ? '\n✗ ' + errs.join('\n✗ ')
  : '\n✓ Gestaltung: ein Symbolsatz, Leitern für Rundung und Abstand, ' +
    'keine Eigenschaft doppelt');
process.exit(errs.length ? 1 : 0);
