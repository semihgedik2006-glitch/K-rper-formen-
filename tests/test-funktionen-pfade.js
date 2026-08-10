/* ── Kein flacher Zugriff mehr in den Cloud Functions ─────────────────
   Stufe 2E.

   WARUM AUSGERECHNET EIN TEXT-TEST
   funktionen.test.js führt die Functions wirklich aus — das ist der
   bessere Beweis, aber er prüft nur, woran ich beim Schreiben gedacht
   habe. Mein Fehler war ein anderer: ich habe eine ganze DATEI
   vergessen. Vier Stufen lang. Kein noch so guter Verhaltenstest fängt
   eine Funktion, die niemand testet, weil niemand an sie denkt.

   Dieser Test denkt nicht mit. Er liest functions/index.js Zeile für
   Zeile und schlägt bei JEDEM db.collection('…') an, das einer Firma
   gehört — auch bei einem, das erst morgen dazukommt.

   Die Liste der Firmen-Sammlungen wird NICHT abgeschrieben, sondern aus
   tools/umzug.js geholt. Zwei Listen, die auseinanderlaufen können,
   laufen irgendwann auseinander: der Umzug nähme eine Sammlung mit, die
   die Functions flach weiterlesen — und dann steht die neue Aufgabe im
   verschachtelten Pfad, während die Erinnerung daran im alten sucht.

   Erlaubt bleiben genau drei: users, pushTokens, firmen. Die liegen
   bewusst oben (Begründung in index.html bei S()). Sie stehen unten mit
   Namen, damit „erlaubt" eine Entscheidung ist und kein Vergessen.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');

const DATEI = path.join(__dirname, '..', 'functions', 'index.js');
const { FLACH, MIT_UNTER, STUDIO_UNTER } = require('../tools/umzug.js');

/* Was einer Firma gehört: alles, was der Umzug mitnimmt — plus die
   beiden Sammlungen, die die App selbst (noch) nicht benutzt, für die
   es aber schon Regeln und Functions gibt. Die würden sonst durch das
   Netz fallen, weil der Umzug sie nicht kennt. */
const FIRMEN_SAMMLUNGEN = new Set([
  ...FLACH,
  ...MIT_UNTER.map(m => m.name),
  ...STUDIO_UNTER,
  'appointments', 'emailTemplates',
]);

/* Absichtlich oben, jede mit Grund. */
const OBEN = {
  users: 'Die Firma steht IM Profil. Ein Konto muss vor der Anmeldung findbar sein.',
  pushTokens: 'Gehört zum Gerät, nicht zur Firma; gefiltert wird über das Profil.',
  firmen: 'Die Liste der Firmen selbst — sie kann nicht in einer Firma liegen.',
};

const errs = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) console.log('  ✓ ' + name);
  else { console.log('  ✗ ' + name + (zusatz ? '  — ' + zusatz : '')); errs.push(name); }
}

const zeilen = fs.readFileSync(DATEI, 'utf8').split('\n');

console.log('── functions/index.js: flache Zugriffe ──');

const treffer = [];
zeilen.forEach((z, i) => {
  const re = /\bdb\.collection\(\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(z))) {
    const sammlung = m[1];
    if (OBEN[sammlung]) continue;
    treffer.push({ zeile: i + 1, sammlung, text: z.trim() });
  }
});

pruefe('keine Firmen-Sammlung wird flach angefasst', treffer.length === 0,
  treffer.map(t => 'Zeile ' + t.zeile + ': ' + t.sammlung).join(', '));
if (treffer.length) {
  treffer.forEach(t => console.log('      ' + t.zeile + ': ' + t.text.slice(0, 90)));
  console.log('      → statt db.collection(x) muss es W(firma).collection(x) heissen.');
  console.log('      → Woher kommt firma? Aus ctx.params.firma (Auslöser),');
  console.log('        aus alleFirmen() (Zeitplan) oder aus firmaVonProfil() (Aufruf).');
}

/* Die drei erlaubten müssen auch wirklich vorkommen — sonst prüft die
   Ausnahmeliste irgendwann nur noch sich selbst. */
const quelle = zeilen.join('\n');
Object.keys(OBEN).forEach(s => {
  pruefe('users/pushTokens/firmen: "' + s + '" liegt weiterhin oben',
    quelle.indexOf("db.collection('" + s + "'") >= 0,
    'kommt gar nicht mehr vor — Ausnahme streichen oder Zugriff prüfen');
});

/* ── Jeder Zeitplan muss über die Firmen laufen ──
   Ein Auslöser bekommt die Firma aus dem Pfad. Ein Zeitplan nicht: der
   startet einfach. Wer dort alleFirmen() vergisst, arbeitet für genau
   eine Firma — die erste, oder gar keine. Lautlos, wie immer. */
console.log('\n── Zeitpläne laufen über alle Firmen ──');
const ZEITPLAN = /^exports\.(\w+)\s*=\s*region/;
const bloecke = [];
let aktuell = null;
zeilen.forEach((z, i) => {
  const m = z.match(ZEITPLAN);
  if (m) { aktuell = { name: m[1], von: i, text: [] }; bloecke.push(aktuell); }
  if (aktuell) aktuell.text.push(z);
});
/* Zeitpläne erkennt man an .pubsub.schedule; nur die sind gemeint. */
const plaene = bloecke.filter(b => b.text.join('\n').indexOf('.pubsub') >= 0);
pruefe('Zeitpläne überhaupt gefunden', plaene.length >= 4, plaene.length + ' gefunden');

/* Erst hatte hier eine Faustregel gestanden: „steht W( im Block, muss
   auch alleFirmen() drin stehen." Die war falsch, und zwar auf die
   gefährliche Art — sie war GRÜN. birthdayGreetings und monthlyReport
   fassen sehr wohl Firmendaten an, nur eben in einer Hilfsfunktion
   ausserhalb des Blocks. Beide wären durchgerutscht.

   Also keine Faustregel mehr, sondern eine Liste mit Namen. Wer einen
   neuen Zeitplan anlegt, steht hier nicht drin und wird rot — und muss
   dann eine Entscheidung treffen statt eine Regel zu überlisten. */
const AUSNAHME = {
  birthdayGreetings:
    'die Firma steht im Profil, nicht im Zeitplan — processBirthdays ordnet ' +
    'je Person zu (geprüft in tests/rules/funktionen.test.js)',
  dailyBackup:
    'der Export umfasst die ganze Datenbank auf einmal; den Stand verteilt ' +
    'sicherungStatus an alle Firmen',
};
plaene.forEach(b => {
  const t = b.text.join('\n');
  if (t.indexOf('alleFirmen()') >= 0) {
    pruefe(b.name + ': läuft über alleFirmen()', true);
    return;
  }
  if (AUSNAHME[b.name]) {
    console.log('  – ' + b.name + ': ' + AUSNAHME[b.name]);
    return;
  }
  pruefe(b.name + ': läuft über alleFirmen()', false,
    'weder alleFirmen() im Block noch als Ausnahme begründet');
});

console.log(errs.length
  ? '\n✗ ' + errs.length + ' Fehler — die Functions arbeiten nicht überall auf den Firmen-Pfaden'
  : '\n✓ Cloud-Function-Pfade: keine Firmen-Sammlung flach, jeder Zeitplan über alle Firmen');
process.exit(errs.length ? 1 : 0);
