/* ── @Erwähnungen ausserhalb des Chats ────────────────────────────────
   BIS HEUTE WAR EINE ERWÄHNUNG EINE REINE CHAT-SACHE. Nur dort wurde
   „@Anna Meier" hervorgehoben, nur dort kam eine Meldung an. Derselbe
   Satz in einer Übergabe, am Schwarzen Brett, in einer Putzplan-Notiz,
   in einer Direktnachricht oder im Lesemodus sah aus wie eine
   Ansprache — und war keine. Anna erfuhr nichts davon.

   Das ist die schlimmere Sorte Fehler: nicht „es geht nicht", sondern
   „es sieht aus, als ginge es". Wer „@Anna bitte übernehmen" in die
   Übergabe schreibt, hat den Eindruck, Anna Bescheid gesagt zu haben.

   ZWEI HÄLFTEN, die zusammengehören:

     Hervorheben  markMentions() um jeden Text, der von Menschen kommt
     Melden       mentions:[] wird BEIM SCHREIBEN mitgespeichert, und
                  erwMelden() liest es beim Zuhören

   Warum mitgeschrieben und nicht beim Lesen errechnet: wer erwähnt
   wurde, hängt an der Personenliste zum Zeitpunkt des Schreibens. Ein
   später umbenanntes Konto verlöre die Erwähnung sonst rückwirkend.

   GEPRÜFT WIRD:
     1. Quelltext: jeder Menschentext geht durch markMentions() — mit
        einer benannten Ausnahmeliste, damit „gehört dazu" eine
        Entscheidung ist und kein Vergessen.
     2. Im Browser: Übergabe und Brett heben @Namen wirklich hervor.
     3. Die Meldung kommt — und bleibt in den drei Fällen aus, in denen
        sie ausbleiben MUSS (fremde Erwähnung, selbst geschrieben,
        älter als der App-Start).
     4. Beim Anlegen wird mentions[] mitgeschrieben.
     5. Gegenproben: ein Text ohne @ erzeugt nichts, und ein @Name, den
        es nicht gibt, bleibt schlichter Text. Ohne die beiden hiesse
        „hebt hervor" nur „setzt irgendwo ein span".
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
function pruefe(name, ok, zusatz) {
  if (ok) console.log('  ✓ ' + name);
  else { console.log('  ✗ ' + name + (zusatz ? '\n      ' + zusatz : '')); errs.push(name); }
}

/* ══ 1) Quelltext ══════════════════════════════════════════════════ */
const quelle = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

/* Jeder Menschentext läuft durch linkify(esc(...)). Genau dort gehört
   markMentions() darum. Wo nicht, muss ein Grund stehen. */
const AUSNAHMEN = {
  'em-mail': 'Eine E-Mail-Adresse. Darin steht kein @Name, sondern ein @Anbieter.',
  "esc(titel)+'</b><br/>'+linkify": 'Impressum: Angaben des Betreibers, keine Beiträge von Menschen.',
};

/* Kommentarzeilen ausblenden.
   Beim Bau der Brett-Umfrage wurde dieser Durchlauf rot — an einem
   KOMMENTAR, in dem die gesuchte Zeichenfolge als Text stand. Eine
   Regel, um die herum man Kommentare formulieren muss, erzieht zum
   Umformulieren statt zum Nachdenken. Also nimmt sie jetzt nur Code.

   Zeilenweise, weil auch die Prüfung darunter zeilenweise ist. Ein
   Block, der mitten in einer Zeile aufgeht und in derselben wieder zu,
   wird nicht behandelt — den gibt es hier nicht, und eine Halbheit, die
   so tut als koenne sie alles, waere schlimmer als eine benannte. */
function ohneKommentare(zeilen) {
  let drin = false;
  return zeilen.map((z) => {
    const t = z.trim();
    if (drin) { if (t.indexOf('*/') >= 0) drin = false; return ''; }
    if (t.startsWith('//')) return '';
    if (t.startsWith('/*')) { if (t.indexOf('*/') < 0) drin = true; return ''; }
    if (t.startsWith('*')) return '';
    return z;
  });
}

/* 'offen' | 'gewickelt' | 'ausnahme' | null — als eigene Funktion, damit
   die Gegenprobe weiter unten GENAU dieselbe Regel anwendet und nicht
   eine nachgebaute. */
function urteil(z) {
  if (z.indexOf('linkify(esc(') < 0) return null;
  if (z.indexOf('markMentions(linkify(esc(') >= 0) return 'gewickelt';
  if (Object.keys(AUSNAHMEN).some(k => z.indexOf(k) >= 0)) return 'ausnahme';
  return 'offen';
}

{
  const zeilen = ohneKommentare(quelle.split('\n'));
  const offen = [];
  let gewickelt = 0;
  zeilen.forEach((z, i) => {
    const u = urteil(z);
    if (u === 'gewickelt') gewickelt++;
    else if (u === 'offen') offen.push('index.html:' + (i + 1) + ' — ' + z.trim().slice(0, 90));
  });
  pruefe('Jeder Menschentext geht durch markMentions()', offen.length === 0,
    offen.join('\n      ') + '\n      Wenn das Absicht ist: oben in AUSNAHMEN eintragen, mit Grund.');

  /* Gegenprobe 1: eine Regel, die nichts findet, prüft nichts. */
  pruefe('(Gegenprobe) die Zählung sieht überhaupt Stellen: ' + gewickelt,
    gewickelt >= 8,
    'Nur ' + gewickelt + ' Stellen mit markMentions gefunden — entweder ist ' +
    'die Hervorhebung ausgebaut worden oder diese Suche misst am Code vorbei.');

  /* Gegenprobe 1b: das Ausblenden darf nur Kommentare schlucken, nicht
     Code. Eine Fassung, die zu viel wegwirft, waere immer gruen. */
  {
    const probe = ohneKommentare([
      '  // linkify(esc(x)) — nur ein Kommentar',
      '  /* auch linkify(esc(x)) im Block */',
      "  var a = linkify(esc(b));",
    ]);
    pruefe('(Gegenprobe) Kommentare fallen weg, Code bleibt',
      probe[0] === '' && probe[1] === '' && probe[2].indexOf('linkify') >= 0,
      JSON.stringify(probe));
  }

  /* Gegenprobe 2: schlägt die Regel bei einer vergessenen Stelle auch an?
     Grün allein hiesse sonst nur, dass sie nie anschlägt. */
  pruefe('(Gegenprobe) eine vergessene Stelle fällt auf',
    urteil("      '<div class=\"bb-text\">'+linkify(esc(b.text||''))+'</div>'+") === 'offen' &&
    urteil("      '<div class=\"bb-text\">'+markMentions(linkify(esc(b.text||'')))+'</div>'+") === 'gewickelt',
    'Die Regel unterscheidet die beiden Fälle nicht — sie könnte nie rot werden.');
}

/* Die Grenze dieser Regel, benannt statt verschwiegen.
   Sie findet `linkify(esc(` — also jeden Text, in dem auch Verweise
   erkannt werden sollen. Die FRAGE einer Umfrage ist Menschentext, geht
   aber nur durch `esc(`; die Regel hat sie deshalb nie gesehen, und
   genau dort ist die Erwähnung monatelang ins Leere gelaufen (im Chat
   seit es Umfragen gibt, am Brett vom ersten Tag an).

   Auf `esc(` auszuweiten geht nicht: das steht an hunderten Stellen für
   Namen, Kennungen und Zahlen, und eine Regel mit hundert Ausnahmen
   prüft nichts mehr. Also diese eine Stelle mit Namen. */
{
  const ix = quelle.indexOf('function pollHTML');
  const block = ix < 0 ? '' : quelle.slice(ix, ix + 2000);
  pruefe('Die Frage einer Umfrage geht durch markMentions()',
    ix >= 0 && /markMentions\(esc\(p\.q/.test(block),
    ix < 0 ? 'pollHTML gibt es nicht mehr — diese Prüfung zeigt ins Leere.'
      : 'Die Frage wird nur escapt. „@Anna kannst du Samstag früh?" ist dann ' +
        'schlichter Text — und die Regel oben sieht es nicht, weil sie ' +
        'linkify-Stellen sucht und hier keine ist.');
}

/* Die zweite Hälfte: beim Schreiben muss mentions[] mit. Ohne das ist
   die Hervorhebung nur Farbe — es meldet sich nie jemand. */
{
  const SCHREIBER = [
    ["collection('handovers').add", 'Übergabe'],
    ["S('board').add", 'Schwarzes Brett'],
  ];
  /* JEDE Fundstelle, nicht die erste.
     Der erste Anlauf nahm indexOf() — also genau eine. Als die Umfrage
     ans Brett kam, gab es ploetzlich ZWEI `S('board').add`, und der
     Durchlauf sah nur noch die neue. Er wurde rot und nannte dabei den
     falschen Grund: der Aushang war in Ordnung, die Umfrage nicht.
     Eine Pruefung, die auf die erste Fundstelle zeigt, wandert mit dem
     Code weg von dem, was sie bewachen soll. */
  SCHREIBER.forEach(([nadel, name]) => {
    const stellen = [];
    for (let i = quelle.indexOf(nadel); i >= 0; i = quelle.indexOf(nadel, i + 1)) {
      stellen.push(i);
    }
    const ohne = stellen.filter(i => !/mentions\s*:\s*findMentions\(/
      .test(quelle.slice(i, i + 700)));
    pruefe(name + ': mentions wird bei ALLEN ' + stellen.length +
      ' Anlege-Stellen mitgeschrieben',
      stellen.length > 0 && ohne.length === 0,
      stellen.length === 0
        ? 'Die Stelle „' + nadel + '" gibt es nicht mehr — diese Prüfung ' +
          'zeigt ins Leere und muss nachgezogen werden.'
        : ohne.length + ' von ' + stellen.length + ' schreiben ohne mentions[] ' +
          '(Zeile ' + ohne.map(i => quelle.slice(0, i).split('\n').length).join(', ') +
          '). Der Eintrag wird dann hervorgehoben, aber niemand erfährt davon.');
  });
}

/* ══ 2–5) Im Browser ═══════════════════════════════════════════════ */
async function lauf() {
  const pageErrs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 900 } });
  page.on('pageerror', e => pageErrs.push('PAGEERROR: ' + e.message.slice(0, 180)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  /* Am Brett liegt ein ALTER Eintrag, der mich erwähnt. Er darf beim
     Anmelden NICHT als Meldung hereinbrechen — sonst käme beim ersten
     Start die ganze Woche auf einmal. */
  await page.addInitScript(() => {
    window.__board = [
      { id: 'b1', text: '@Anna Meier bitte die Liste ergänzen.', uid: 'u3',
        name: 'Ben Kraus', kind: 'info', ts: Date.now() - 3600000, mentions: ['u2'] },
      { id: 'b2', text: '@Test Chef alter Eintrag, darf nicht melden.', uid: 'u3',
        name: 'Ben Kraus', kind: 'info', ts: Date.now() - 7200000, mentions: ['testuid'] }
    ];
  });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  if (!(await page.evaluate(() => !!document.querySelector('#app.show')))) {
    await b.close();
    throw new Error('Die App ist gar nicht gestartet. ' + pageErrs.join(' | '));
  }

  /* Es gibt nur EIN #toast — mehrere Meldungen überschreiben sich.
     Deshalb jede Änderung mitschreiben statt am Ende einmal ablesen. */
  await page.evaluate(() => {
    window.__toasts = [];
    const t = document.getElementById('toast');
    new MutationObserver(() => { window.__toasts.push(t.textContent); })
      .observe(t, { childList: true, characterData: true, subtree: true });
  });

  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-team"]').click());
  await page.waitForTimeout(420);
  await page.evaluate(() => document.querySelector('[data-teamtab="uebergabe"]').click());
  await page.waitForTimeout(520);

  /* Frische Übergaben nachschieben — vier Fälle in einem Schnappschuss.
     Der Studio-Schlüssel wird abgelesen, nicht geraten: der Team-Bereich
     startet auf dem alphabetisch ersten Studio (Brühl), nicht auf dem
     ersten der Liste. Ein fest eingetragenes studio-6 hätte hier still
     ins Leere geschrieben. */
  const bedient = await page.evaluate(() => {
    const sel = document.getElementById('teamStudio');
    const st = sel ? sel.value : '';
    window.__gewaehlt = st;
    return window.__nachschub('studios/' + st + '/handovers', [
      // meldet: fremd geschrieben, nennt mich, frisch
      { id: 'x1', text: '@Test Chef die Rechnung liegt im Büro.', uid: 'u3',
        name: 'Ben Kraus', ts: Date.now(), mentions: ['testuid'] },
      // meldet nicht: nennt jemand anderen
      { id: 'x2', text: '@Anna Meier bitte morgen die Wäsche mitnehmen.', uid: 'u3',
        name: 'Ben Kraus', ts: Date.now(), mentions: ['u2'] },
      // meldet nicht: selbst geschrieben
      { id: 'x3', text: '@Test Chef Merkzettel an mich selbst.', uid: 'testuid',
        name: 'Test Chef', ts: Date.now(), mentions: ['testuid'] },
      // Gegenproben zur Hervorhebung
      { id: 'x4', text: 'Ganz ohne Anrede, hier darf nichts leuchten.',
        uid: 'u3', name: 'Ben Kraus', ts: Date.now() },
      { id: 'x5', text: '@Niemand Da gibt es nicht.', uid: 'u3',
        name: 'Ben Kraus', ts: Date.now() }
    ]);
  });
  pruefe('Der Nachschub erreicht die Übergaben (Zuhörer bedient)', bedient > 0,
    'Kein Zuhörer auf diesem Pfad — alles Folgende hätte ins Leere geprüft.');
  await page.waitForTimeout(700);

  const ho = await page.evaluate(() => {
    const zeilen = [...document.querySelectorAll('.ho-text')].map(x => x.innerHTML);
    const zu = (t) => zeilen.find(z => z.indexOf(t) >= 0) || '';
    /* Welche EINTRÄGE tragen die Markierung? Über den Text gesucht,
       nicht über die Reihenfolge — die Liste sortiert nach ts. */
    const markiert = [...document.querySelectorAll('.ho-item')]
      .filter(x => x.classList.contains('mentioned'))
      .map(x => x.querySelector('.ho-text').textContent);
    return {
      markiert: markiert,
      randFarbe: (() => {
        const m = document.querySelector('.ho-item.mentioned');
        const o = [...document.querySelectorAll('.ho-item')].find(x => !x.classList.contains('mentioned'));
        return m && o ? [getComputedStyle(m).borderTopColor, getComputedStyle(o).borderTopColor] : null;
      })(),
      anzahl: zeilen.length,
      chef: zu('Rechnung'), anna: zu('Wäsche'),
      ohne: zu('Anrede'), fremd: zu('gibt es nicht'),
      studio: window.__gewaehlt,
      toasts: window.__toasts.slice()
    };
  });

  pruefe('Übergabe: alle fünf Einträge stehen da (' + ho.studio + ')', ho.anzahl === 5,
    ho.anzahl + ' statt 5 — ohne alle fünf ist die Auswertung darunter wertlos.');
  pruefe('Übergabe: „@Test Chef" ist hervorgehoben',
    /<span class="mention">@Test Chef<\/span>/.test(ho.chef), ho.chef.slice(0, 120));
  pruefe('Übergabe: „@Anna Meier" ist hervorgehoben',
    /<span class="mention">@Anna Meier<\/span>/.test(ho.anna), ho.anna.slice(0, 120));
  pruefe('(Gegenprobe) Text ohne @ bekommt kein mention-span',
    ho.ohne.indexOf('mention') < 0, ho.ohne.slice(0, 120));
  pruefe('(Gegenprobe) „@Niemand Da" bleibt schlichter Text',
    ho.fremd.indexOf('mention') < 0 && ho.fremd.indexOf('@Niemand Da') >= 0,
    ho.fremd.slice(0, 120) + ' — sonst würde jedes @Wort eingefärbt.');

  /* Der Toast ist nach 2,7 Sekunden weg. Die Markierung am Eintrag ist
     das, was ihn danach noch auffindbar macht — sie muss GENAU die
     Einträge treffen, die mich nennen, auch den selbst geschriebenen
     (wiederfinden ja, melden nein — zwei verschiedene Fragen). */
  pruefe('Markiert sind genau die Einträge, die mich nennen',
    ho.markiert.length === 2 &&
    ho.markiert.some(t => /Rechnung/.test(t)) &&
    ho.markiert.some(t => /Merkzettel/.test(t)),
    JSON.stringify(ho.markiert));
  pruefe('Die Markierung ist am Rand auch wirklich zu sehen',
    !!ho.randFarbe && ho.randFarbe[0] !== ho.randFarbe[1],
    'markiert ' + JSON.stringify(ho.randFarbe) + ' — gleiche Farbe wie ein ' +
    'gewöhnlicher Eintrag heisst: die Klasse steht dran und ändert nichts.');

  /* Die Meldung. Genau EINE von fünf Einträgen. */
  const erw = ho.toasts.filter(t => /erwähnt/.test(t));
  pruefe('Genau eine Meldung — nicht keine, nicht drei', erw.length === 1,
    erw.length + ' Meldungen: ' + JSON.stringify(erw));
  pruefe('Die Meldung nennt den Absender und den Ort',
    erw.length === 1 && /Ben Kraus/.test(erw[0]) && /Übergabe/.test(erw[0]),
    JSON.stringify(erw));
  pruefe('Selbst geschriebene Erwähnung meldet nicht',
    !erw.some(t => /Merkzettel/.test(t)));
  pruefe('Erwähnung einer anderen Person meldet nicht',
    !erw.some(t => /Wäsche/.test(t)));

  /* ── Schwarzes Brett ── */
  await page.evaluate(() => document.querySelector('[data-teamtab="brett"]').click());
  await page.waitForTimeout(620);
  const bb = await page.evaluate(() => ({
    zeilen: [...document.querySelectorAll('.bb-text')].map(x => x.innerHTML),
    toasts: window.__toasts.slice()
  }));
  pruefe('Brett: beide Einträge stehen da', bb.zeilen.length === 2,
    bb.zeilen.length + ' statt 2 — die Attrappe liefert das Brett nicht.');
  pruefe('Brett: „@Anna Meier" ist hervorgehoben',
    bb.zeilen.some(z => /<span class="mention">@Anna Meier<\/span>/.test(z)),
    bb.zeilen.join(' | ').slice(0, 160));
  pruefe('Ein Eintrag von VOR dem App-Start meldet nicht',
    !bb.toasts.some(t => /alter Eintrag/.test(t)),
    'Sonst bräche beim Anmelden die ganze Woche als „gerade erwähnt" herein.');

  /* ── Beim Anlegen wird mentions[] mitgeschrieben ── */
  await page.evaluate(() => document.querySelector('[data-teamtab="uebergabe"]').click());
  await page.waitForTimeout(420);
  const geschrieben = await page.evaluate(() => {
    window.__schreib = [];
    const feld = document.getElementById('hoNew');
    feld.value = '@Anna Meier bitte die Trockner prüfen.';
    document.getElementById('hoAdd').click();
    return null;
  });
  await page.waitForTimeout(500);
  const w = await page.evaluate(() => (window.__schreib || [])
    .filter(x => /handovers/.test(x.pfad || '')));
  pruefe('Anlegen schreibt überhaupt etwas in handovers', w.length === 1,
    JSON.stringify(w).slice(0, 200));
  pruefe('Der neue Eintrag trägt mentions:["u2"]',
    w.length === 1 && Array.isArray(w[0].daten.mentions) &&
    w[0].daten.mentions.length === 1 && w[0].daten.mentions[0] === 'u2',
    'geschrieben: ' + JSON.stringify(w[0] && w[0].daten && w[0].daten.mentions) +
    ' — ohne die Kennung erfährt Anna nichts von der Übergabe.');

  await b.close();
  pageErrs.forEach(e => { console.log('  ✗ ' + e); errs.push(e); });
  void geschrieben;
}

console.log('\n── @Erwähnungen ausserhalb des Chats ──');
lauf()
  .catch(e => { console.log('  ✗ ' + e.message); errs.push(e.message); })
  .then(() => {
    console.log('');
    if (errs.length) {
      console.log('✗ ' + errs.length + ' Fund(e) bei den Erwähnungen');
      process.exitCode = 1;
    } else {
      console.log('✓ Erwähnungen: hervorgehoben in Übergabe und Brett, ' +
        'mentions[] wird mitgeschrieben, und gemeldet wird genau einmal');
    }
  });
