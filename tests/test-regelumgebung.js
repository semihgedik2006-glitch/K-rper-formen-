/* ── Prüft der Rechner dasselbe wie die Auslieferung? ─────────────────
   Am 17.08. meldete der Betrieb „der Merge hat nicht geklappt". Der
   Merge hatte geklappt. Der Deploy nicht: die Prüfung davor fiel um,
   und damit gingen weder die neuen Regeln noch die neuen Funktionen
   raus. Drei Prüfungen waren rot — dieselben drei, die hier auf dem
   Rechner grün waren.

   Der Unterschied war keine Zeile Code, sondern eine Zahl:

       tests/rules/package.json   "firebase-tools": "^14.0.0"
       tests/rules/node_modules   15.26.0
       Auslieferung (npm install) 14.27.0

   Der Emulator aus 15 nahm einen Regelpfad mit leerem Segment hin, der
   aus 14 brach die Auswertung ab. Ein grüner Durchlauf hier sagte also
   nichts über den Durchlauf dort. Das ist die teuerste Sorte Fehler:
   nicht einer, der etwas kaputt macht, sondern einer, der die Prüfung
   selbst wertlos macht — und zwar leise.

   Deshalb diese Datei. Sie prüft keine Regel. Sie prüft, ob das
   Werkzeug, mit dem die Regeln geprüft werden, hier und dort dasselbe
   ist. Sie braucht keinen Browser und keinen Emulator.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');

const WURZEL = path.join(__dirname, '..');
const PAKET = path.join(WURZEL, 'tests', 'rules', 'package.json');
const errs = [];

const paket = JSON.parse(fs.readFileSync(PAKET, 'utf8'));
const gewollt = paket.devDependencies || {};

/* 1. Feste Versionen, kein ^ und kein ~.
      Ohne Sperrdatei bedeutet ^ genau das, was hier passiert ist: die
      Auslieferung holt sich beim nächsten Lauf etwas anderes als beim
      letzten, ohne dass jemand etwas geändert hat. */
for (const [name, wunsch] of Object.entries(gewollt)) {
  if (/^[\^~]|x|\*|\s-\s/.test(wunsch)) {
    errs.push('OFFENE SPANNE: ' + name + ' steht als „' + wunsch +
      '" — die Auslieferung holt sich dann irgendwann etwas anderes ' +
      'als dieser Rechner, und niemand merkt es');
  }
}

/* 2. Und was hier liegt, muss auch das sein.
      Punkt 1 allein reicht nicht: die Zahl kann festgeschrieben sein,
      während node_modules seit Monaten etwas anderes enthält. Genau so
      war es. */
for (const [name, wunsch] of Object.entries(gewollt)) {
  const p = path.join(WURZEL, 'tests', 'rules', 'node_modules', name, 'package.json');
  if (!fs.existsSync(p)) {
    errs.push('NICHT INSTALLIERT: ' + name + ' — „cd tests/rules && npm install"');
    continue;
  }
  const da = JSON.parse(fs.readFileSync(p, 'utf8')).version;
  const rein = wunsch.replace(/^[\^~]/, '');
  console.log('  ' + name + ': verlangt ' + wunsch + ', liegt ' + da);
  if (da !== rein) {
    errs.push('AUSEINANDER: ' + name + ' — package.json sagt „' + rein +
      '", installiert ist „' + da + '". Die Auslieferung prüft dann mit ' +
      'einem anderen Werkzeug als dieser Rechner. Abhilfe: ' +
      'cd tests/rules && npm install ' + name + '@' + rein);
  }
}

/* 3. Gegenprobe: die Prüfung darf nicht nur deshalb grün sein, weil sie
      gar nichts gefunden hat. Eine leere Liste wäre still grün. */
if (!Object.keys(gewollt).length) {
  errs.push('MESSUNG LEER: tests/rules/package.json führt keine ' +
    'devDependencies — dann prüft diese Datei nichts');
}
if (!gewollt['firebase-tools']) {
  errs.push('MESSUNG LEER: firebase-tools steht nicht in den ' +
    'devDependencies — genau das Werkzeug, um das es hier geht');
}

/* 4. Und die Auslieferung muss wirklich dieselbe Datei benutzen.
      Steht in der Werkbank ein eigenes npm install mit fester Version,
      läuft die Sperre hier ins Leere. */
const WERK = path.join(WURZEL, '.github', 'workflows', 'deploy-functions.yml');
if (fs.existsSync(WERK)) {
  const w = fs.readFileSync(WERK, 'utf8');
  if (/npm\s+install\s+firebase-tools@/.test(w)) {
    errs.push('VORBEI: die Werkbank installiert firebase-tools mit eigener ' +
      'Version — dann sagt tests/rules/package.json nichts mehr aus');
  }
  if (!/working-directory:\s*tests\/rules/.test(w)) {
    errs.push('VORBEI: die Werkbank installiert nicht aus tests/rules');
  }

  /* 5. Und sie muss VOR dem Merge laufen.
        Am 17.8. lief sie erst danach. Der Merge war durch, main stand
        auf einem Stand, dessen Regeln nicht ausgerollt werden konnten,
        und weil hosting nicht an regeltest haengt, war die App ganz
        normal draussen. Gemeldet wurde es als „merge hat nicht
        geklappt" — vier Worte, und niemand haette sie sagen muessen. */
  if (!/^\s{2}pull_request:/m.test(w)) {
    errs.push('ERST NACH DEM MERGE: die Werkbank hat keinen ' +
      'pull_request-Ausloeser — ein Regelfehler faellt dann erst auf, ' +
      'wenn main ihn schon hat');
  }

  /* 6. Gegenstueck dazu: die ausrollenden Jobs duerfen dann NICHT
        mitlaufen. Sonst waere jeder Zweig ein Deploy in die Produktion,
        und die Absicherung waere schlimmer als die Luecke. */
  const bloecke = w.split(/\n(?=  [a-z][a-z0-9_-]*:\n)/);
  for (const job of ['rules', 'hosting', 'deploy']) {
    const b = bloecke.find(s => s.startsWith('  ' + job + ':\n'));
    if (!b) { errs.push('FEHLT: der Job „' + job + '" in der Werkbank'); continue; }
    if (!/if:\s*github\.event_name\s*!=\s*'pull_request'/.test(b)) {
      errs.push('DEPLOY AUS DEM ZWEIG: „' + job + '" laeuft auch bei ' +
        'pull_request — damit rollt jeder offene Zweig in die Produktion aus');
    }
  }
} else {
  errs.push('FEHLT: .github/workflows/deploy-functions.yml');
}

console.log(errs.length
  ? '\n✗ ' + errs.join('\n✗ ')
  : '\n✓ Prüfumgebung: feste Versionen, installiert ist genau das, und die ' +
    'Auslieferung nimmt dieselbe Liste');
process.exit(errs.length ? 1 : 0);
