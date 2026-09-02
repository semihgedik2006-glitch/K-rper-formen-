/* ── Das Lesewerkzeug, ausgeführt statt behauptet ──────────────────────
   `tools/konten-pruefen.js` hat zwei Auszählungen dazubekommen, und die
   werden gebraucht, um eine offene Sicherheitsfrage zu entscheiden
   (OFFEN.md, „Firmengrenze auf den flachen Pfaden"):

     FIRMEN-ZUORDNUNG   wie viele Profile tragen ein Feld `firma`, und
                        mit welchem Wert
     WO LIEGEN DIE DATEN  wie viel steht noch flach, wie viel unter
                        `firmen/<kennung>/…`

   Davon hängt eine Entscheidung ab, die man nur einmal falsch treffen
   muss: engt man die flachen Regeln auf „gehört zur Voreinstellung"
   ein, obwohl jedes Konto längst eine Kennung trägt, sperrt man den
   laufenden Betrieb aus seinen eigenen Daten aus.

   EIN WERKZEUG, DAS FALSCH ZÄHLT, IST SCHLIMMER ALS KEINS. Es sähe
   plausibel aus und führte zur falschen Entscheidung. Also läuft hier
   das echte Werkzeug, als eigener Prozess, gegen den Emulator — wie
   umzug.test.js es für den Umzug tut.

   Die Ausgangslage ist mit Absicht gemischt: Profile mit Kennung, ohne
   Feld, mit leerem Feld und aus einer zweiten Firma; Daten flach UND
   unter firmen/. Eine Zählung, die nur einen Fall kennt, kann man nicht
   von einer kaputten unterscheiden.
   ───────────────────────────────────────────────────────────────────── */
const path = require('path');
const { execFileSync } = require('child_process');
const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));

let bestanden = 0, gefallen = 0;
const protokoll = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) { bestanden++; protokoll.push('  ✓ ' + name); }
  else { gefallen++; protokoll.push('  ✗ ' + name + (zusatz ? '\n      ' + zusatz : '')); }
}

(async () => {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8791';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
  admin.initializeApp({ projectId: 'demo-regeltest' });
  const db = admin.firestore();

  /* ── Erst aufraeumen ──
     Alle Regeltests teilen sich dasselbe Emulator-Projekt und rufen zu
     Beginn env.clearFirestore(). Dieser hier arbeitet mit dem
     Admin-SDK und hat das zunaechst NICHT getan: allein gelaufen war
     er gruen, im Gesamtlauf fielen vier Zeilen um, weil `users` und
     `board` noch die Reste der vorherigen Durchlaeufe trugen.

     Das war kein Fehler des Werkzeugs, sondern einer der Pruefung —
     und die schlimmere Sorte: sie war gruen, solange man sie einzeln
     laufen liess. Wer absolute Zahlen prueft, muss die Ausgangslage
     selbst herstellen. */
  await fetch('http://' + process.env.FIRESTORE_EMULATOR_HOST +
    '/emulator/v1/projects/demo-regeltest/databases/(default)/documents',
    { method: 'DELETE' });

  /* ── Ausgangslage ──
     Sieben Profile, vier verschiedene Zustände im Feld `firma`. Genau
     die Mischung, die in einer halb umgezogenen Datenbank steht. */
  await db.doc('users/u1').set({ name: 'Mit Kennung A', role: 'chef', firma: 'koerperformen' });
  await db.doc('users/u2').set({ name: 'Mit Kennung A', role: 'mitarbeiter', firma: 'koerperformen' });
  await db.doc('users/u3').set({ name: 'Mit Kennung A', role: 'mitarbeiter', firma: 'koerperformen' });
  await db.doc('users/u4').set({ name: 'Zweite Firma', role: 'chef', firma: 'beta' });
  await db.doc('users/u5').set({ name: 'Feld fehlt', role: 'mitarbeiter' });
  await db.doc('users/u6').set({ name: 'Feld fehlt auch', role: 'mitarbeiter' });
  await db.doc('users/u7').set({ name: 'Feld leer', role: 'mitarbeiter', firma: '' });

  await db.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });
  await db.doc('firmen/beta').set({ name: 'Beta', aktiv: true });

  // Daten flach UND unter firmen/ — beide Spalten müssen etwas zeigen
  await db.doc('board/b1').set({ text: 'Flach 1', ts: 1 });
  await db.doc('board/b2').set({ text: 'Flach 2', ts: 2 });
  await db.doc('announcements/a1').set({ text: 'Flach', ts: 1 });
  await db.doc('firmen/koerperformen/board/b1').set({ text: 'Umgezogen', ts: 1 });
  await db.doc('firmen/beta/board/b1').set({ text: 'Zweite Firma', ts: 1 });
  await db.doc('firmen/beta/board/b2').set({ text: 'Zweite Firma 2', ts: 2 });

  let aus = '';
  let lief = true;
  try {
    aus = execFileSync(process.execPath,
      [path.join(__dirname, '..', '..', 'tools', 'konten-pruefen.js'),
        '--projekt', 'demo-regeltest'],
      { encoding: 'utf8', timeout: 120000, env: process.env });
  } catch (e) {
    lief = false;
    aus = String((e.stdout || '') + (e.stderr || '') + ' ' + e.message);
  }

  pruefe('Das Werkzeug läuft überhaupt durch', lief, aus.slice(0, 300));

  const zeile = (re) => (aus.split('\n').find(z => re.test(z)) || '').trim();

  pruefe('Es sagt, dass es nur liest', /nur lesen/.test(aus));
  pruefe('Es zählt alle sieben Profile', /Profile in users\s*:\s*7/.test(aus),
    zeile(/Profile in users/));

  /* ── Die erste Auszählung ── */
  pruefe('Es gibt einen Abschnitt FIRMEN-ZUORDNUNG', /FIRMEN-ZUORDNUNG/.test(aus));
  pruefe('Drei Profile stehen unter „koerperformen"',
    /koerperformen\s+3/.test(aus), zeile(/koerperformen/));
  pruefe('Eines steht unter „beta"', /\bbeta\s+1/.test(aus), zeile(/^\s*beta/));
  pruefe('Zwei tragen gar kein Feld', /\(Feld fehlt\)\s+2/.test(aus),
    zeile(/Feld fehlt/));
  pruefe('Eines trägt ein leeres Feld', /\(leer\)\s+1/.test(aus), zeile(/\(leer\)/));
  /* Die Zusammenfassung ist das, worauf die Entscheidung schaut —
     „drei ohne, vier mit". Stimmt die nicht, ist die ganze Auszählung
     wertlos, auch wenn die Zeilen darüber stimmen. */
  pruefe('Zusammenfassung: 3 ohne Kennung', /ohne Kennung[^:]*:\s*3/.test(aus),
    zeile(/ohne Kennung/));
  pruefe('Zusammenfassung: 4 mit Kennung', /mit Kennung:\s*4/.test(aus),
    zeile(/mit Kennung/));

  /* ── Die zweite Auszählung ── */
  pruefe('Es gibt einen Abschnitt WO LIEGEN DIE DATEN', /WO LIEGEN DIE DATEN/.test(aus));
  pruefe('Beide Firmen sind genannt',
    /Firmen angelegt:.*koerperformen/.test(aus) && /Firmen angelegt:.*beta/.test(aus),
    zeile(/Firmen angelegt/));
  /* board: 2 flach, 3 unter firmen/ (1 bei koerperformen, 2 bei beta).
     Die Summe über alle Firmen ist Absicht — gefragt ist „liegt noch
     etwas flach", nicht „wo genau liegt es sonst". */
  pruefe('board wird richtig gezählt: 2 flach, 3 unter firmen/',
    /^\s*board\s+2\s+3\s*$/m.test(aus), zeile(/^\s*board\s/));
  pruefe('announcements: 1 flach, 0 unter firmen/',
    /^\s*announcements\s+1\s+0\s*$/m.test(aus), zeile(/^\s*announcements\s/));
  /* Eine Sammlung, die es nirgends gibt, muss 0 zeigen und nicht
     abstürzen — in einer echten Datenbank fehlen die meisten. */
  pruefe('Eine leere Sammlung zeigt 0 statt eines Fehlers',
    /^\s*certificates\s+0\s+0\s*$/m.test(aus), zeile(/certificates/));

  /* ── Gegenprobe ──
     Eine Auszählung, die immer dieselbe Zahl nennt, wäre auch grün.
     Also die Lage ändern und nachsehen, ob die Zahl mitgeht. */
  await db.doc('users/u8').set({ name: 'Noch einer ohne', role: 'mitarbeiter' });
  await db.doc('board/b3').set({ text: 'Flach 3', ts: 3 });
  let aus2 = '';
  try {
    aus2 = execFileSync(process.execPath,
      [path.join(__dirname, '..', '..', 'tools', 'konten-pruefen.js'),
        '--projekt', 'demo-regeltest'],
      { encoding: 'utf8', timeout: 120000, env: process.env });
  } catch (e) { aus2 = String(e.stdout || ''); }
  pruefe('(Gegenprobe) ein Profil mehr ohne Kennung → 4 statt 3',
    /ohne Kennung[^:]*:\s*4/.test(aus2), (aus2.split('\n')
      .find(z => /ohne Kennung/.test(z)) || '(keine Zeile)').trim());
  pruefe('(Gegenprobe) ein Brett-Eintrag mehr → board 3 flach',
    /^\s*board\s+3\s+3\s*$/m.test(aus2), (aus2.split('\n')
      .find(z => /^\s*board\s/.test(z)) || '(keine Zeile)').trim());

  /* Und die wichtigste: das Werkzeug darf NICHTS geschrieben haben.
     Es heisst „nur lesen" — das ist der Grund, aus dem es gegen die
     echte Datenbank laufen darf. */
  const nachher = await db.collection('users').get();
  pruefe('Es hat nichts geschrieben (8 Profile vorher wie nachher)',
    nachher.size === 8, nachher.size + ' Profile');
  const b = await db.collection('board').get();
  pruefe('Auch am Brett nichts angefasst', b.size === 3, b.size + ' Einträge');

  console.log('\n' + protokoll.join('\n'));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen\n');
  if (gefallen) {
    console.log('✗ Das Lesewerkzeug zaehlt nicht, was es behauptet.');
    process.exit(1);
  }
  console.log('✓ konten-pruefen.js: zaehlt Firmen-Zuordnung und Datenlage richtig, ' +
    'und schreibt dabei nichts.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
