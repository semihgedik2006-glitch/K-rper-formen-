/* ── Umfragen: nur die eigene Stimme ──────────────────────────────────
   Gefunden beim Weiterbauen an den Reaktionen. Dieselbe Bauart, eine
   Zeile daneben, und der teurere Fall von beiden.

   An der Chat-Nachricht stand für das Abstimmen nur:

       affectedKeys().hasOnly(['votes'])

   Das Feld durfte angefasst werden, sein INHALT aber beliebig. Im
   Emulator nachgemessen, bevor eine Zeile Regel geschrieben wurde —
   alles ging durch:

       DURCHGEGANGEN: fremde Stimmen umdrehen (2:1 Ja -> 0:3 Nein)
       DURCHGEGANGEN: alle Stimmen loeschen
       DURCHGEGANGEN: Stimme fuer eine Antwort, die es nicht gibt (99)
       DURCHGEGANGEN: Stimme als Text statt Zahl

   Eine Reaktion ist Geschmack. Eine Umfrage ENTSCHEIDET etwas — „Samstag
   öffnen?", „Welche Öffnungszeiten?". Sie still zu drehen sieht man dem
   Ergebnis hinterher nicht an, und es gibt keine zweite Aufzeichnung,
   an der es auffallen würde.

   votes ist nach Kennung geschlüsselt: { 'uid1': 0, 'uid2': 1 }. Deshalb
   hier diff() auf der Karte selbst statt des removeAll-Umwegs von den
   Reaktionen — „höchstens der eigene Schlüssel darf sich unterscheiden"
   ist genau die Aussage, die gebraucht wird.

   ZU JEDER SPERRE DIE GEGENPROBE, dass der richtige Weg noch geht.
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
const chefA  = () => env.authenticatedContext('chefA').firestore();
const chefB  = () => env.authenticatedContext('chefB').firestore();
const anonym = () => env.unauthenticatedContext().firestore();

const PFAD = 'channels/allgemein/messages/m1';
const FPFAD = `firmen/${A}/channels/allgemein/messages/m1`;

/* Drei haben schon abgestimmt, Ergebnis 2:1 für „Ja". Ohne fremde
   Stimmen liesse sich „fremde Stimme gedreht" gar nicht prüfen. */
const UMFRAGE = {
  uid: 'chefA', text: '', ts: 1,
  poll: { q: 'Samstag öffnen?', opts: ['Ja', 'Nein'] },
  votes: { chefA: 0, zweitA: 0, dritteA: 1 },
};

async function frisch(pfad, daten) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(pfad).set(daten || UMFRAGE);
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
    await d.doc('users/wartA').set({ name: 'Wartend', role: 'mitarbeiter', firma: A, aktiv: false });
    await d.doc('users/chefB').set({ name: 'Chef B', role: 'chef', firma: B, aktiv: true });
  });

  // ══ Der richtige Weg ══
  /* So schreibt die App wirklich: votePoll() setzt den Feldpfad
     `votes.<uid>`, nicht die ganze Karte. Wenn dieser Weg scheitert,
     ist die Regel zu eng — und der Knopf im Chat tut nichts mehr. */
  await frisch(PFAD);
  await pruefe('Eigene Stimme abgeben (so wie votePoll() schreibt)', () =>
    assertSucceeds(mitA().doc(PFAD).update({ 'votes.mitA': 1 })));

  await frisch(PFAD);
  await pruefe('Eigene Stimme ÄNDERN geht', () =>
    assertSucceeds(mitA().doc(PFAD).update({
      votes: { chefA: 0, zweitA: 0, dritteA: 1, mitA: 0 } })));

  /* Der Chef ist Verfasser der Umfrage und hat selbst abgestimmt.
     Seine eigene Stimme zu ändern muss ihm erlaubt bleiben — sonst
     wäre „nur die eigene" versehentlich zu „gar keine" geworden. */
  await frisch(PFAD);
  await pruefe('Auch der Verfasser ändert seine eigene Stimme', () =>
    assertSucceeds(chefA().doc(PFAD).update({ 'votes.chefA': 1 })));

  // ══ Und die Sperren ══
  await frisch(PFAD);
  await pruefe('FREMDE Stimmen umdrehen geht NICHT (2:1 Ja → 0:3 Nein)', () =>
    assertFails(mitA().doc(PFAD).update({
      votes: { chefA: 1, zweitA: 1, dritteA: 1 } })));

  await frisch(PFAD);
  await pruefe('ALLE Stimmen löschen geht NICHT', () =>
    assertFails(mitA().doc(PFAD).update({ votes: {} })));

  await frisch(PFAD);
  await pruefe('EINE fremde Stimme löschen geht NICHT', () =>
    assertFails(mitA().doc(PFAD).update({ votes: { chefA: 0, zweitA: 0 } })));

  /* Auch der Verfasser darf nicht an fremde Stimmen. Wer die Umfrage
     stellt, hat das grösste Interesse am Ergebnis. */
  await frisch(PFAD);
  await pruefe('Auch der VERFASSER dreht keine fremde Stimme', () =>
    assertFails(chefA().doc(PFAD).update({
      votes: { chefA: 0, zweitA: 1, dritteA: 1 } })));

  await frisch(PFAD);
  await pruefe('Für eine Antwort stimmen, die es nicht gibt (99), geht NICHT', () =>
    assertFails(mitA().doc(PFAD).update({ 'votes.mitA': 99 })));

  await frisch(PFAD);
  await pruefe('Eine negative Antwortnummer geht NICHT', () =>
    assertFails(mitA().doc(PFAD).update({ 'votes.mitA': -1 })));

  await frisch(PFAD);
  await pruefe('Text statt Zahl geht NICHT', () =>
    assertFails(mitA().doc(PFAD).update({ 'votes.mitA': 'ja' })));

  /* Die Umfrage selbst ist unantastbar. Wer die Antworten nachträglich
     umschreibt, dreht das Ergebnis, ohne eine einzige Stimme anzufassen:
     aus „Ja" wird „Nein", und die 2 steht plötzlich woanders. */
  await frisch(PFAD);
  await pruefe('Die ANTWORTEN nachträglich umschreiben geht NICHT', () =>
    assertFails(mitA().doc(PFAD).update({
      poll: { q: 'Samstag öffnen?', opts: ['Nein', 'Ja'] } })));
  await frisch(PFAD);
  await pruefe('Auch der Verfasser schreibt die Antworten nicht um', () =>
    assertFails(chefA().doc(PFAD).update({
      poll: { q: 'Samstag öffnen?', opts: ['Nein', 'Ja'] } })));

  /* Abstimmen ist kein Freibrief fürs Bearbeiten. */
  await frisch(PFAD);
  await pruefe('Text nebenbei ändern geht NICHT', () =>
    assertFails(mitA().doc(PFAD).update({
      'votes.mitA': 0, text: 'heimlich umgeschrieben' })));

  /* Ohne Umfrage gibt es nichts abzustimmen. Sonst liesse sich an JEDER
     Nachricht ein votes-Feld anlegen und beliebig füllen. */
  await frisch(PFAD, { uid: 'chefA', text: 'Ganz gewöhnliche Nachricht', ts: 1 });
  await pruefe('An einer Nachricht OHNE Umfrage entsteht kein votes-Feld', () =>
    assertFails(mitA().doc(PFAD).update({ 'votes.mitA': 0 })));

  // ══ Wer gar nicht dazugehört ══
  await frisch(PFAD);
  await pruefe('Ein WARTENDES Konto stimmt nicht ab', () =>
    assertFails(env.authenticatedContext('wartA').firestore()
      .doc(PFAD).update({ 'votes.wartA': 0 })));
  await frisch(PFAD);
  await pruefe('ANONYM stimmt nicht ab', () =>
    assertFails(anonym().doc(PFAD).update({ 'votes.x': 0 })));

  // ══ Die Firmen-Welt ══
  /* Dieselbe Regel steht ein zweites Mal unter firmen/{f}/. Genau dort
     ist sie schon einmal vergessen worden. */
  await frisch(FPFAD);
  await pruefe('FIRMA · eigene Stimme geht', () =>
    assertSucceeds(mitA().doc(FPFAD).update({ 'votes.mitA': 1 })));
  await frisch(FPFAD);
  await pruefe('FIRMA · fremde Stimmen umdrehen geht NICHT', () =>
    assertFails(mitA().doc(FPFAD).update({
      votes: { chefA: 1, zweitA: 1, dritteA: 1 } })));
  await frisch(FPFAD);
  await pruefe('FIRMA · die ANDERE Firma stimmt nicht mit ab', () =>
    assertFails(chefB().doc(FPFAD).update({ 'votes.chefB': 0 })));

  /* ══ Und die dritte Stelle derselben Bauart ══
     Nachdem zweimal dasselbe Muster aufgefallen war, lag die Frage
     nahe: ist das ein Einzelfall oder eine Klasse. Also die dritte
     Liste geprüft, die jeder anfassen darf — den Gelesen-Haken. Im
     Emulator ging auch dort alles durch.

     Der wiegt schwerer, als er aussieht. Die Oberfläche zeigt der
     Leitung, WER eine Pflichtinfo noch nicht gesehen hat, mit Namen.
     Einen fremden Haken zu setzen heisst, jemanden aus dieser Liste zu
     nehmen, ohne dass er die Info je gesehen hat. */
  const AUSHANG = {
    uid: 'chefA', from: 'Leitung', text: 'Pflichtschulung Montag',
    ts: 1, target: 'all', readBy: ['zweitA', 'dritteA'],
  };
  const APFAD = 'announcements/an1';

  await frisch(APFAD, AUSHANG);
  await pruefe('HAKEN · sich selbst als gelesen eintragen geht', () =>
    assertSucceeds(mitA().doc(APFAD).update({ readBy: ['zweitA', 'dritteA', 'mitA'] })));

  await frisch(APFAD, AUSHANG);
  await pruefe('HAKEN · FREMDE als gelesen eintragen geht NICHT', () =>
    assertFails(mitA().doc(APFAD).update({
      readBy: ['zweitA', 'dritteA', 'chefA', 'nochWer'] })));

  await frisch(APFAD, AUSHANG);
  await pruefe('HAKEN · fremde Haken löschen geht NICHT', () =>
    assertFails(mitA().doc(APFAD).update({ readBy: [] })));

  await frisch(APFAD, AUSHANG);
  await pruefe('HAKEN · 4000 Dubletten der eigenen Kennung gehen NICHT', () =>
    assertFails(mitA().doc(APFAD).update({
      readBy: ['zweitA', 'dritteA'].concat(new Array(4000).fill('mitA')) })));

  /* Die Leitung darf weiterhin alles — sie darf den Aushang auch
     bearbeiten. Ohne diese Runde hätte die Verschärfung sie
     versehentlich mit ausgesperrt. */
  await frisch(APFAD, AUSHANG);
  await pruefe('HAKEN · GEGENPROBE die Leitung darf den Aushang weiterhin ändern', () =>
    assertSucceeds(chefA().doc(APFAD).update({ text: 'Pflichtschulung Dienstag' })));

  /* ══ Die Umfrage am Schwarzen Brett ══
     Bis eben konnte man am Brett nur reagieren; `allow update` liess
     ausschliesslich nurEigeneReaktion() durch. Abstimmen ist dieselbe
     Sorte Schreibvorgang in ein fremdes Dokument und braucht dieselbe
     Sorte Beweis. Deshalb hier ALLE Faelle noch einmal — die Regel ist
     zwar dieselbe Funktion, aber ob sie am Brett auch aufgerufen wird,
     sagt nur eine Messung. */
  const BRETT = 'board/b1';
  const BUMFRAGE = {
    uid: 'chefA', name: 'Chef A', text: '', kind: 'umfrage', ts: 1,
    poll: { q: 'Wer kann Samstag früh?', opts: ['Ich', 'Ich nicht'] },
    votes: { chefA: 0, zweitA: 0, dritteA: 1 },
  };

  await frisch(BRETT, BUMFRAGE);
  await pruefe('BRETT · eine Umfrage anlegen geht', () =>
    assertSucceeds(mitA().collection('board').add({
      uid: 'mitA', name: 'Mit A', text: '', kind: 'umfrage', ts: 2,
      poll: { q: 'Kaffee oder Tee?', opts: ['Kaffee', 'Tee'] }, votes: {} })));

  await frisch(BRETT, BUMFRAGE);
  await pruefe('BRETT · eigene Stimme abgeben geht', () =>
    assertSucceeds(mitA().doc(BRETT).update({ 'votes.mitA': 1 })));

  await frisch(BRETT, BUMFRAGE);
  await pruefe('BRETT · fremde Stimmen umdrehen geht NICHT', () =>
    assertFails(mitA().doc(BRETT).update({
      votes: { chefA: 1, zweitA: 1, dritteA: 1 } })));

  await frisch(BRETT, BUMFRAGE);
  await pruefe('BRETT · eine Antwort, die es nicht gibt, geht NICHT', () =>
    assertFails(mitA().doc(BRETT).update({ 'votes.mitA': 99 })));

  /* Der Grund, aus dem das Brett ueberhaupt `update: if false` hatte:
     ein Aushang, dessen Text sich hinterher aendert, ist kein Aushang.
     Abstimmen zu oeffnen darf daran nichts aendern. */
  await frisch(BRETT, BUMFRAGE);
  await pruefe('BRETT · die Frage nachträglich umschreiben geht NICHT', () =>
    assertFails(mitA().doc(BRETT).update({
      poll: { q: 'Wer kann Sonntag?', opts: ['Ich', 'Ich nicht'] } })));
  await frisch(BRETT, BUMFRAGE);
  await pruefe('BRETT · auch der Verfasser schreibt die Frage nicht um', () =>
    assertFails(chefA().doc(BRETT).update({
      poll: { q: 'Wer kann Sonntag?', opts: ['Ich', 'Ich nicht'] } })));

  /* Reagieren muss weiter gehen. Die Regel ist jetzt ein ODER aus zwei
     Funktionen — ein Klammerfehler haette hier die eine oder die andere
     still ausgeschaltet. */
  await frisch(BRETT, Object.assign({}, BUMFRAGE, { reactions: { '👍': ['zweitA'] } }));
  await pruefe('BRETT · GEGENPROBE reagieren geht weiterhin', () =>
    assertSucceeds(mitA().doc(BRETT).update({
      reactions: { '👍': ['zweitA'], '🎉': ['mitA'] } })));

  await frisch(BRETT, BUMFRAGE);
  await pruefe('BRETT · GEGENPROBE der Verfasser darf weiterhin löschen', () =>
    assertSucceeds(chefA().doc(BRETT).delete()));

  console.log('\n' + protokoll.join('\n'));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen\n');
  await env.cleanup();
  if (gefallen) {
    console.log('✗ An einer Umfrage laesst sich mehr aendern als die eigene Stimme.');
    process.exit(1);
  }
  console.log('✓ Umfragen: nur die eigene Stimme, nur eine Antwort, die es gibt.');
})();
