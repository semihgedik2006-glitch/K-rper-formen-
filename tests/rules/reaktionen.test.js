/* ── Reaktionen: nur die eigene Kennung, nur die sechs Zeichen ─────────
   Bis heute stand an der Chat-Nachricht nur:

       affectedKeys().hasOnly(['reactions'])

   Das Feld durfte angefasst werden, sein INHALT aber beliebig. Damit
   konnte jeder Eingeloggte

     · die Reaktionen aller anderen löschen,
     · eine fremde Kennung eintragen („Anna hat das mit ❤️ versehen"),
     · ein beliebiges Zeichen setzen,
     · eine beliebig große Liste hineinschreiben.

   Keiner dieser Fälle sieht hinterher nach einem Angriff aus — er sieht
   aus wie eine gewöhnliche Reaktion. Genau deshalb fällt er nicht auf.

   Zu verschmerzen war das, solange es EINE Stelle war. Mit Brett und
   Aushängen wären es drei geworden, und eine schwache Regel, die man
   dreimal kopiert, bleibt. Also einmal richtig: nurEigeneReaktion() in
   firestore.rules, benutzt von allen dreien.

   Der Kern der Regel ist eine einzige Idee: auf beiden Seiten die
   eigene Kennung entfernen und dann vergleichen. Was danach noch
   verschieden ist, gehört jemand anderem.

   ZU JEDER SPERRE DIE GEGENPROBE, dass der richtige Weg noch geht —
   sonst wäre eine Regel, die alles verbietet, die beste.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment, assertFails, assertSucceeds,
} = require('@firebase/rules-unit-testing');

const REGELN = path.join(__dirname, '..', '..', 'firestore.rules');
const A = 'alpha', B = 'beta';

let env;
let bestanden = 0, gefallen = 0;
const protokoll = [];

async function pruefe(name, fn) {
  try { await fn(); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) {
    gefallen++;
    protokoll.push('  ✗ ' + name + '\n      ' + String(e.message).split('\n')[0].slice(0, 170));
  }
}

const mitA   = () => env.authenticatedContext('mitA').firestore();
const zweitA = () => env.authenticatedContext('zweitA').firestore();
const chefA  = () => env.authenticatedContext('chefA').firestore();
const chefB  = () => env.authenticatedContext('chefB').firestore();
const anonym = () => env.unauthenticatedContext().firestore();

/* Ausgangslage jedes Falls: mitA hat schon reagiert, zweitA auch.
   Beide werden gebraucht — an einem leeren Feld liesse sich „fremde
   Reaktion geloescht" gar nicht pruefen. */
const START = { '👍': ['mitA', 'zweitA'], '❤️': ['zweitA'] };

/* Die drei Orte, an denen jetzt reagiert werden darf. Dieselben Fälle
   an allen dreien: eine Regel, die nur an einer Stelle hängt, ist eine
   Regel, die woanders vergessen wurde. */
const ORTE = [
  ['Chat',      'channels/allgemein/messages/m1', { uid: 'chefA', text: 'Hallo', ts: 1 }],
  ['Brett',     'board/b1',                       { uid: 'chefA', text: 'Aushang', ts: 1 }],
  ['Aushang',   'announcements/an1',              { uid: 'chefA', text: 'Info', ts: 1, target: 'all' }],
];

async function frisch(pfad, grund) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(pfad).set(Object.assign({}, grund, { reactions: START }));
  });
}

(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-regeltest',
    firestore: { rules: fs.readFileSync(REGELN, 'utf8') },
  });
  await env.clearFirestore();

  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await d.doc(`firmen/${A}`).set({ name: 'Alpha GmbH', aktiv: true });
    await d.doc(`firmen/${B}`).set({ name: 'Beta GmbH', aktiv: true });
    await d.doc('users/chefA').set({ name: 'Chef A', role: 'chef', firma: A, aktiv: true });
    await d.doc('users/mitA').set({ name: 'Mit A', role: 'mitarbeiter', firma: A, aktiv: true, studioKeys: ['studio-0'] });
    await d.doc('users/zweitA').set({ name: 'Zweiter', role: 'mitarbeiter', firma: A, aktiv: true, studioKeys: ['studio-0'] });
    await d.doc('users/wartA').set({ name: 'Wartend', role: 'mitarbeiter', firma: A, aktiv: false });
    await d.doc('users/chefB').set({ name: 'Chef B', role: 'chef', firma: B, aktiv: true });
  });

  for (const [name, pfad, grund] of ORTE) {
    // ── Der richtige Weg: die eigene Kennung dazu und wieder weg ──
    await frisch(pfad, grund);
    await pruefe(name + ' · eigene Reaktion HINZUFÜGEN geht', () =>
      assertSucceeds(mitA().doc(pfad).update({
        reactions: { '👍': ['mitA', 'zweitA'], '❤️': ['zweitA'], '🎉': ['mitA'] } })));

    await frisch(pfad, grund);
    await pruefe(name + ' · eigene Reaktion WEGNEHMEN geht', () =>
      assertSucceeds(mitA().doc(pfad).update({
        reactions: { '👍': ['zweitA'], '❤️': ['zweitA'] } })));

    /* Der Fall, der ohne removeAll() durchginge: die eigene Kennung
       verschwindet aus dem einen Zeichen und taucht im anderen auf.
       Zwei Aenderungen in einem Schreibvorgang, beide meine. */
    await frisch(pfad, grund);
    await pruefe(name + ' · UMHÄNGEN von einem Zeichen aufs andere geht', () =>
      assertSucceeds(mitA().doc(pfad).update({
        reactions: { '👍': ['zweitA'], '❤️': ['zweitA', 'mitA'] } })));

    // ── Und jetzt die Sperren ──
    await frisch(pfad, grund);
    await pruefe(name + ' · FREMDE Reaktion löschen geht NICHT', () =>
      assertFails(mitA().doc(pfad).update({
        reactions: { '👍': ['mitA'], '❤️': ['zweitA'] } })));

    await frisch(pfad, grund);
    await pruefe(name + ' · ALLE Reaktionen wegwischen geht NICHT', () =>
      assertFails(mitA().doc(pfad).update({ reactions: {} })));

    await frisch(pfad, grund);
    await pruefe(name + ' · FREMDE Kennung eintragen geht NICHT', () =>
      assertFails(mitA().doc(pfad).update({
        reactions: { '👍': ['mitA', 'zweitA'], '❤️': ['zweitA'], '🎉': ['zweitA'] } })));

    await frisch(pfad, grund);
    await pruefe(name + ' · ein FREMDES Zeichen geht NICHT', () =>
      assertFails(mitA().doc(pfad).update({
        reactions: { '👍': ['mitA', 'zweitA'], '❤️': ['zweitA'], '💩': ['mitA'] } })));

    /* Der teure Fall: ein Dokument darf 1 MB gross sein. Wer die Liste
       vollschreibt, macht es unbrauchbar — und bezahlt wird es vom
       Betreiber, nicht vom Schreiber. */
    await frisch(pfad, grund);
    await pruefe(name + ' · eine RIESIGE Liste geht NICHT', () =>
      assertFails(mitA().doc(pfad).update({
        reactions: { '👍': new Array(4000).fill('mitA') } })));

    /* DERSELBE Fall, aber sauber gebaut — und das ist der, der zählt.
       Oben verschwindet nebenbei zweitAs Reaktion; die Zeile wäre also
       auch grün gewesen, wenn die Länge überhaupt nicht geprüft würde.
       Hier bleibt alles Fremde heil und nur die eigene Kennung steht
       4000-mal in einem NEUEN Zeichen.

       Im Emulator nachgemessen, bevor die Regel es konnte: „LOCH OFFEN
       — 4000 eigene Kennungen sind durchgegangen". removeAll() streicht
       alle Vorkommen, Dubletten sind für den Vergleich unsichtbar. */
    await frisch(pfad, grund);
    await pruefe(name + ' · 4000-mal die EIGENE Kennung geht auch NICHT', () =>
      assertFails(mitA().doc(pfad).update({
        reactions: { '👍': ['mitA', 'zweitA'], '❤️': ['zweitA'],
                     '🎉': new Array(4000).fill('mitA') } })));

    /* Und die Gegenprobe dazu: EINMAL die eigene Kennung im selben
       neuen Zeichen muss weiterhin gehen. Ohne sie hiesse die Zeile
       darüber nur „lange Listen sind verboten" — verboten ist die
       Dublette. */
    await frisch(pfad, grund);
    await pruefe(name + ' · GEGENPROBE einmal die eigene Kennung geht', () =>
      assertSucceeds(mitA().doc(pfad).update({
        reactions: { '👍': ['mitA', 'zweitA'], '❤️': ['zweitA'], '🎉': ['mitA'] } })));

    /* Reagieren ist kein Freibrief fuers Bearbeiten. Ohne diese Runde
       waere „nur reactions" nicht geprueft, sondern nur behauptet. */
    await frisch(pfad, grund);
    await pruefe(name + ' · Text nebenbei ändern geht NICHT', () =>
      assertFails(mitA().doc(pfad).update({
        reactions: { '👍': ['mitA', 'zweitA'], '❤️': ['zweitA'], '🎉': ['mitA'] },
        text: 'heimlich umgeschrieben' })));

    // ── Wer gar nicht dazugehört ──
    await frisch(pfad, grund);
    await pruefe(name + ' · ein WARTENDES Konto reagiert nicht', () =>
      assertFails(env.authenticatedContext('wartA').firestore().doc(pfad).update({
        reactions: { '👍': ['mitA', 'zweitA'], '❤️': ['zweitA'], '🎉': ['wartA'] } })));

    await frisch(pfad, grund);
    await pruefe(name + ' · ANONYM reagiert nicht', () =>
      assertFails(anonym().doc(pfad).update({
        reactions: { '👍': ['mitA', 'zweitA'], '❤️': ['zweitA'], '🎉': ['x'] } })));
  }

  /* ══ Die Firmen-Welt ══
     Dieselbe Regel steht ein zweites Mal unter firmen/{f}/. Genau dort
     ist sie beim letzten Mal vergessen worden — deshalb hier eigens. */
  const FPFAD = `firmen/${A}/board/b1`;
  await frisch(FPFAD, { uid: 'chefA', text: 'Aushang', ts: 1 });
  await pruefe('FIRMA · eigene Reaktion geht', () =>
    assertSucceeds(mitA().doc(FPFAD).update({
      reactions: { '👍': ['mitA', 'zweitA'], '❤️': ['zweitA'], '🎉': ['mitA'] } })));

  await frisch(FPFAD, { uid: 'chefA', text: 'Aushang', ts: 1 });
  await pruefe('FIRMA · fremde Reaktion löschen geht NICHT', () =>
    assertFails(mitA().doc(FPFAD).update({ reactions: { '👍': ['mitA'], '❤️': ['zweitA'] } })));

  /* Die Firmengrenze. Ohne diese Runde hiesse „die Regel greift" nur
     „sie greift bei uns". */
  await frisch(FPFAD, { uid: 'chefA', text: 'Aushang', ts: 1 });
  await pruefe('FIRMA · die ANDERE Firma reagiert nicht mit', () =>
    assertFails(chefB().doc(FPFAD).update({
      reactions: { '👍': ['mitA', 'zweitA'], '❤️': ['zweitA'], '🎉': ['chefB'] } })));

  /* ══ Was NICHT aufgeweicht werden durfte ══
     Reagieren zu erlauben heisst, ein update zu oeffnen, das vorher
     komplett zu war (`allow update: if false`). Wenn dabei das
     Bearbeiten mit aufgeht, ist der Preis hoeher als der Gewinn. */
  await frisch('board/b1', { uid: 'chefA', text: 'Aushang', ts: 1 });
  await pruefe('BRETT bleibt unbearbeitbar — auch für den Verfasser', () =>
    assertFails(chefA().doc('board/b1').update({ text: 'nachträglich anders' })));
  await pruefe('BRETT · auch der Chef schreibt den Text nicht um', () =>
    assertFails(chefA().doc('board/b1').update({ kind: 'lob' })));
  await pruefe('BRETT · löschen darf der Verfasser weiterhin', () =>
    assertSucceeds(chefA().doc('board/b1').delete()));

  /* Der Gelesen-Haken am Aushang lief bisher ueber dieselbe Zeile.
     Wenn die neue Regel ihn mit abschneidet, faellt das sonst erst im
     Betrieb auf. */
  await frisch('announcements/an1', { uid: 'chefA', text: 'Info', ts: 1, target: 'all', readBy: [] });
  await pruefe('AUSHANG · der Gelesen-Haken geht weiterhin', () =>
    assertSucceeds(mitA().doc('announcements/an1').update({ readBy: ['mitA'] })));

  console.log('\n' + protokoll.join('\n'));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen\n');
  await env.cleanup();
  if (gefallen) {
    console.log('✗ An den Reaktionen laesst sich mehr anfassen als die eigene Kennung.');
    process.exit(1);
  }
  console.log('✓ Reaktionen: nur die eigene Kennung, nur die sechs Zeichen, an allen drei Orten.');
})();
