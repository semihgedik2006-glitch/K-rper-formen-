/* ── Die stillgelegten Nebenseiten bleiben zusammen stillgelegt ───────
   marketing.html und wachstum.html sind seit dem 13.8.2026 abgeschaltet,
   und zwar an ZWEI Stellen gleichzeitig:

     firebase.json    beide stehen in der ignore-Liste → nicht ausgeliefert
     firestore.rules  ihre Sammlungen stehen auf `if false` → kein Zugriff

   Beides zusammen ist die Abschaltung. Fällt eine der beiden Hälften
   weg, ist der Zustand entweder gefährlich oder kaputt:

     Seite ausgeliefert, Regeln zu   → die Seite lädt und tut nichts
     Seite ausgeliefert, Regeln auf  → DAS LECK IST WIEDER OFFEN

   Denn im Code greifen beide Seiten weiterhin FLACH zu — ohne
   `firmen/<kennung>/`. Genau deshalb wurden sie abgeschaltet: die alten
   Regeln fragten nur istAktiv(), nicht nach der Firma. Zwei Kunden
   hätten sich gegenseitig in den Terminen gesehen, mitsamt Namen und
   E-Mail-Adressen ihrer Endkundinnen.

   In firebase.json und firestore.rules steht die Reihenfolge, in der
   die Seiten zurückgeholt werden müssten. Eine Anleitung, der jemand
   in der falschen Reihenfolge folgt, ist genau der Fall, für den es
   diesen Durchlauf gibt.

   VORBILD: tests/test-funktionen-pfade.js bewacht dasselbe für
   functions/index.js. Dort war es nötig, weil ein flacher Zugriff
   niemandem auffällt — hier auch.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');

const WURZEL = path.join(__dirname, '..');
const L = (d) => fs.readFileSync(path.join(WURZEL, d), 'utf8');

const SEITEN = ['marketing.html', 'wachstum.html'];

/* Sammlungen, die einer FIRMA gehören. Flach angefasst heißt: alle
   Kunden im selben Topf. Die Liste steht hier mit Namen, damit
   „gehört dazu" eine Entscheidung ist und kein Vergessen. */
const FIRMEN_SAMMLUNGEN = [
  'appointments', 'emailTemplates', 'studioMetrics',
  'competitors', 'expansionLeads', 'mkProjects',
  'studios', 'todos', 'documents', 'announcements', 'inventory',
];

/* Erlaubt oben, jede mit Grund — dieselbe Ausnahmeliste wie bei den
   Cloud Functions. */
const OBEN = {
  users: 'Die Firma steht IM Profil. Ein Konto muss vor der Anmeldung findbar sein.',
  pushTokens: 'Gehört zum Gerät, nicht zur Firma.',
  firmen: 'Die Liste der Firmen selbst.',
};

const errs = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) console.log('  ✓ ' + name);
  else { console.log('  ✗ ' + name + (zusatz ? '\n      ' + zusatz : '')); errs.push(name); }
}

console.log('\n── Die stillgelegten Nebenseiten ──');

const firebaseJson = JSON.parse(L('firebase.json'));
const ignore = (firebaseJson.hosting && firebaseJson.hosting.ignore) || [];
const regeln = L('firestore.rules');

/* Wie oft steht eine Sammlung mit `if false` in den Regeln? Zweimal ist
   richtig: einmal flach, einmal unter firmen/{firma}/. */
function zuCount(sammlung) {
  const re = new RegExp('match /' + sammlung + '/\\{[^}]*\\}[^\\n]*\\n?[^\\n]*allow read, write: if false;', 'g');
  const einzeilig = new RegExp('match /' + sammlung + '/\\{[^}]*\\}\\s*\\{\\s*allow read, write: if false; \\}', 'g');
  return (regeln.match(einzeilig) || []).length || (regeln.match(re) || []).length;
}

const GESPERRT = ['appointments', 'emailTemplates', 'studioMetrics', 'competitors', 'expansionLeads'];

for (const seite of SEITEN) {
  const ausgeliefert = ignore.indexOf(seite) < 0;
  const quelle = L(seite);

  /* Flache Zugriffe zählen. `db.collection('X')` ohne den Umweg über
     eine Firmen-Hilfsfunktion ist flach. */
  const flach = [];
  const RE = /db\.collection\(\s*'([a-zA-Z]+)'/g;
  let m;
  while ((m = RE.exec(quelle))) {
    const s = m[1];
    if (OBEN[s]) continue;
    if (FIRMEN_SAMMLUNGEN.indexOf(s) >= 0) flach.push(s);
  }
  const einmalig = [...new Set(flach)];

  if (!ausgeliefert) {
    pruefe(seite + ': steht in der ignore-Liste (nicht ausgeliefert)', true);
    /* Solange die Seite nicht ausgeliefert wird, DARF sie flach
       zugreifen — sie kommt ja nicht in den Browser. Gemeldet wird die
       Zahl trotzdem, damit sichtbar bleibt, was beim Zurückholen zu tun
       ist. */
    console.log('    (' + flach.length + ' flache Zugriffe im Code: ' +
      (einmalig.join(', ') || 'keine') + ' — beim Zurückholen umzustellen)');
  } else {
    /* Ausgeliefert. Jetzt zählt jeder flache Zugriff. */
    pruefe(seite + ' ist ausgeliefert und greift NICHT mehr flach zu',
      flach.length === 0,
      flach.length
        ? flach.length + ' flache Zugriffe auf ' + einmalig.join(', ') +
          ' — die Firmen-Trennung ist damit offen. Erst S() einbauen ' +
          '(siehe die Reihenfolge in firebase.json), dann ausliefern.'
        : '');
  }
}

const irgendeineAusgeliefert = SEITEN.some(s => ignore.indexOf(s) < 0);

/* Die zweite Hälfte der Abschaltung: die Regeln. */
for (const s of GESPERRT) {
  const zu = zuCount(s) >= 2;
  if (!irgendeineAusgeliefert) {
    pruefe('Regel für ' + s + ' steht auf false (flach UND unter firmen/)', zu,
      zu ? '' : 'Die Seiten sind abgeschaltet, aber diese Sammlung ist offen — ' +
        'entweder ist die Abschaltung halb zurückgenommen oder die Regel ist verrutscht.');
  } else {
    /* Seiten zurückgeholt: dann MÜSSEN die Regeln offen und
       firmengebunden sein, sonst lädt eine Seite, die nichts kann. */
    pruefe('Regel für ' + s + ' ist nicht mehr auf false (Seiten sind zurück)', !zu,
      'Die Seite wird ausgeliefert, die Regel sperrt sie aber aus — sie lädt und tut nichts.');
  }
}

/* Die Anleitung zum Zurückholen muss die Reihenfolge nennen. Ohne sie
   folgt jemand dem alten „die beiden Zeilen streichen" und holt das
   Leck mit zurück. */
pruefe('firebase.json warnt vor dem Zurückholen ohne Pfad-Umstellung',
  /zurueckholen/i.test(JSON.stringify(firebaseJson)) &&
  /S\(\)|firmen\//.test(JSON.stringify(firebaseJson)));
pruefe('firestore.rules nennt die Reihenfolge zum Zurückholen',
  /Reihenfolge, wenn die Seiten zurueck sollen/.test(regeln));

/* ── Gegenprobe ──
   Ein Prüfer, der nie anschlägt, prüft nichts. Hier wird die Lage
   künstlich umgedreht: eine ausgelieferte Seite mit flachen Zugriffen
   MUSS auffallen. */
{
  const vorher = errs.length;
  const quelle = L('wachstum.html');
  const flach = (quelle.match(/db\.collection\(\s*'(appointments|competitors|expansionLeads|emailTemplates|studioMetrics)'/g) || []).length;
  pruefe('(Gegenprobe) wachstum.html hätte ausgeliefert ' + flach + ' offene Zugriffe',
    flach === 0);
  const hatAngeschlagen = errs.length === vorher + 1;
  errs.length = vorher;
  console.log('  ✓ Gegenprobe: die Zählung erkennt flache Zugriffe (' + flach + ' gefunden)');
  if (!hatAngeschlagen) {
    errs.push('GEGENPROBE MISSLUNGEN: keine flachen Zugriffe gefunden — ' +
      'entweder sind sie weg (dann diesen Abschnitt anpassen) oder die Zählung misst nichts');
  }
}

console.log('');
if (errs.length) {
  console.log('✗ ' + errs.length + ' Fund(e) an den stillgelegten Nebenseiten');
  process.exitCode = 1;
} else {
  console.log('✓ Nebenseiten: abgeschaltet in firebase.json UND in den Regeln, ' +
    'und die Anleitung zum Zurückholen nennt die Reihenfolge');
}
