/* ── Kein flacher Zugriff mehr in den Cloud Functions ─────────────────
   Stufe 2E. Ein Text-Test neben funktionen.test.js, der die Functions
   wirklich ausführt: der bessere Beweis prüft nur, woran beim Schreiben
   jemand gedacht hat. Eine ganze Datei zu vergessen fängt er nicht.

   Dieser hier denkt nicht mit. Er liest functions/index.js Zeile für
   Zeile und schlägt bei jedem db.collection('…') an, das einer Firma
   gehört — auch bei einem, das erst morgen dazukommt.

   Die Liste der Firmen-Sammlungen wird nicht abgeschrieben, sondern aus
   tools/umzug.js geholt. Zwei Listen, die auseinanderlaufen können,
   laufen irgendwann auseinander: der Umzug nähme eine Sammlung mit, die
   die Functions flach weiterlesen — die neue Aufgabe stünde dann im
   verschachtelten Pfad, während die Erinnerung im alten sucht.

   Erlaubt bleiben genau drei: users, pushTokens, firmen. Sie stehen
   unten mit Namen, damit „erlaubt" eine Entscheidung ist und kein
   Vergessen.
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

/* Absichtlich oben, jede mit Grund.

   Die Liste ist zugleich die Ausnahmeliste: JEDER flache Zugriff, der
   hier nicht steht, wird rot — auch auf eine Sammlung, die es gestern
   noch nicht gab. Das ist strenger als nötig und mit Absicht so. Beim
   Bauen des Firmen-Papierkorbs hat es prompt angeschlagen und eine
   Entscheidung erzwungen, statt sie durchrutschen zu lassen. */
const OBEN = {
  users: 'Die Firma steht IM Profil. Ein Konto muss vor der Anmeldung findbar sein.',
  pushTokens: 'Gehört zum Gerät, nicht zur Firma; gefiltert wird über das Profil.',
  firmen: 'Die Liste der Firmen selbst — sie kann nicht in einer Firma liegen.',
  firmenArchiv: 'Gelöschte Firmen. Läge das IN der Firma, wäre es mit ihr weg.',
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

/* ── Jeder Aufruf aus der App prüft, wer ruft ──
   Ein onCall-Endpunkt ist von jedem Rechner der Welt erreichbar, sobald
   sein Name bekannt ist — und der Name steht im Quelltext der App. Die
   Grenze ist deshalb nicht die Oberfläche, sondern die erste Zeile im
   Rumpf.

   Beim Sicherheits-Durchlauf am 13.8. wurden die vierzehn Endpunkte von
   Hand durchgesehen. Von Hand heisst: beim fünfzehnten nicht mehr.
   Deshalb hier gezählt. */
console.log('\n── Jeder Endpunkt prüft die Berechtigung ──');

/* Blockende: die schliessende Zeile auf zwei Leerzeichen Einrückung.
   Ohne diese Grenze reichte ein Block bis zum nächsten export — und
   ein requireAuth() in einer Hilfsfunktion dahinter machte ihn grün. */
function rumpf(b) {
  const bis = b.text.findIndex((z, i) => i > 0 && z === '  });');
  return b.text.slice(0, bis < 0 ? b.text.length : bis + 1).join('\n');
}
const PRUEFUNG = /require(Admin|Chef|Auth)\s*\(\s*context\s*\)/;

/* Zwei Endpunkte hängen nicht an einer Anmeldung, sondern an einem
   Geheim-Schlüssel: sie werden von aussen aufgerufen (Cron, Test). */
const SCHLUESSEL = /process\.env\.\w*(KEY|SECRET|TOKEN)/;

const aufrufe = bloecke.filter(b => rumpf(b).indexOf('.https.onCall') >= 0);
const anfragen = bloecke.filter(b => rumpf(b).indexOf('.https.onRequest') >= 0);
pruefe('Endpunkte überhaupt gefunden', aufrufe.length >= 12,
  aufrufe.length + ' onCall, ' + anfragen.length + ' onRequest');

aufrufe.forEach(b => {
  pruefe(b.name + ': prüft requireAuth/Chef/Admin', PRUEFUNG.test(rumpf(b)),
    'ein onCall ohne Prüfung ist für jeden im Internet offen');
});
anfragen.forEach(b => {
  pruefe(b.name + ': prüft einen Geheim-Schlüssel', SCHLUESSEL.test(rumpf(b)),
    'ein onRequest ohne Schlüssel ist eine offene Adresse');
});

/* Gegenprobe: würde eine fehlende Prüfung überhaupt auffallen? */
{
  const erfunden = { name: '(Gegenprobe)', text: [
    'exports.offen = region', '  .https.onCall(async (data, context) => {',
    '    return { alles: "frei" };', '  });'] };
  pruefe('Gegenprobe: ein Endpunkt ohne Prüfung wird erkannt',
    !PRUEFUNG.test(rumpf(erfunden)));
}

console.log(errs.length
  ? '\n✗ ' + errs.length + ' Fehler — die Functions arbeiten nicht überall auf den Firmen-Pfaden'
  : '\n✓ Cloud-Function-Pfade: keine Firmen-Sammlung flach, jeder Zeitplan über alle Firmen');
process.exit(errs.length ? 1 : 0);
