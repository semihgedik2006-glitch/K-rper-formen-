/* ─────────────────────────────────────────────────────────────────────
   Sicherheitstests gegen firestore.rules – ausgefuehrt, nicht gelesen.

   Die Regeln sind die EINZIGE echte Grenze dieser App: was in der
   Oberflaeche versteckt ist, kann jeder mit der Entwicklerkonsole
   aufrufen. Bis zu diesem Durchlauf wurden sie nur durchgesehen.

   Ausfuehren:
     cd tests/rules && npm install && npm test
   (Braucht Java – der Firestore-Emulator ist ein Java-Programm.)
   Der Emulator laeuft aus dem Wurzelverzeichnis: firebase-tools laesst
   keine Regeldatei ausserhalb des Projektordners zu, und getestet werden
   soll genau die Datei, die auch ausgerollt wird - keine Kopie.

   Jeder Test sagt im Namen, WAS er schuetzt. Faellt einer um, ist das
   keine Formalie: dann kommt jemand an Daten, an die er nicht soll.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment, assertFails, assertSucceeds,
} = require('@firebase/rules-unit-testing');

const REGELN = path.join(__dirname, '..', '..', 'firestore.rules');

let env;
let bestanden = 0, gefallen = 0;
const protokoll = [];

async function pruefe(name, fn) {
  try { await fn(); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) {
    gefallen++;
    protokoll.push('  ✗ ' + name + '\n      ' + String(e.message).split('\n')[0].slice(0, 160));
  }
}

// Rollen als eigene Verbindungen
const alsChef        = () => env.authenticatedContext('chef1').firestore();
const alsLeiter      = () => env.authenticatedContext('leiter1').firestore();
const alsMitarbeiter = () => env.authenticatedContext('mit1').firestore();
const alsFremder     = () => env.authenticatedContext('fremd1').firestore();  // selbst registriert
const alsAnonym      = () => env.unauthenticatedContext().firestore();

(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-regeltest',
    // Ohne host/port: die Verbindungsdaten kommen aus FIRESTORE_EMULATOR_HOST,
    // das "firebase emulators:exec" setzt. Fest verdrahtete Ports gehen
    // schief, sobald jemand den Emulator anders startet.
    firestore: { rules: fs.readFileSync(REGELN, 'utf8') },
  });
  await env.clearFirestore();

  // ── Ausgangslage anlegen (an den Regeln vorbei) ──
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc('users/chef1').set({ name: 'Chef', role: 'chef' });
    await db.doc('users/leiter1').set({ name: 'Leiter', role: 'leiter', studioKeys: ['studio-6'] });
    await db.doc('users/mit1').set({ name: 'Mitarbeiter', role: 'mitarbeiter', studioKeys: ['studio-6'] });
    await db.doc('users/fremd1').set({ name: 'Fremder', role: 'mitarbeiter', studioKeys: [] });
    await db.doc('channels/allgemein/messages/m1').set({ uid: 'chef1', text: 'intern', ts: Date.now() });
    await db.doc('studios/studio-6/todos/t1').set({ title: 'Aufgabe', ts: Date.now() });
    await db.doc('studios/studio-7/todos/t2').set({ title: 'Fremdes Studio', ts: Date.now() });
    await db.doc('certificates/z1').set({ uid: 'mit1', art: 'ersthelfer', bis: '2027-01-01' });
    await db.doc('dms/dm_chef1_leiter1/messages/x1').set({ uid: 'chef1', text: 'vertraulich', ts: Date.now() });
    await db.doc('dms/dm_chef1_leiter1').set({ participants: ['chef1', 'leiter1'] });
    await db.doc('documents/d1').set({ name: 'Hygiene', studios: ['studio-6'] });
    await db.doc('documents/d2').set({ name: 'Fremd', studios: ['studio-9'] });
    await db.doc('documentData/d2').set({ data: 'INHALT-FREMDES-STUDIO' });
    await db.doc('inventory/studio-9').set({ items: [{ name: 'Handtücher', have: 20, limit: 20 }] });
    await db.doc('trash/tr1').set({ col: 'todos', sk: 'studio-9', deletedByUid: 'chef1' });
    await db.doc('pushTokens/tok1').set({ uid: 'chef1' });
    await db.doc('archives/2026-KW31').set({ week: '2026-KW31' });
    await db.doc('studioMetrics/studio-6').set({ mitglieder: 120 });
  });

  // ══ 1. Ohne Anmeldung geht gar nichts ══
  await pruefe('Anonym kann den Teamchat NICHT lesen', () =>
    assertFails(alsAnonym().doc('channels/allgemein/messages/m1').get()));
  await pruefe('Anonym kann das Team NICHT lesen', () =>
    assertFails(alsAnonym().doc('users/chef1').get()));
  await pruefe('Anonym kann NICHT schreiben', () =>
    assertFails(alsAnonym().doc('channels/allgemein/messages/neu').set({ uid: 'x', text: 'hi', ts: 1 })));

  // ══ 2. Niemand hebt sich selbst hoch ══
  await pruefe('Mitarbeiter kann sich NICHT zum Chef machen', () =>
    assertFails(alsMitarbeiter().doc('users/mit1').update({ role: 'chef' })));
  await pruefe('Mitarbeiter kann sich NICHT selbst Studios zuteilen', () =>
    assertFails(alsMitarbeiter().doc('users/mit1').update({ studioKeys: ['studio-1', 'studio-2'] })));
  await pruefe('Mitarbeiter kann NICHT das Profil eines anderen aendern', () =>
    assertFails(alsMitarbeiter().doc('users/chef1').update({ name: 'gekapert' })));
  await pruefe('Neuanmeldung mit Rolle chef wird abgelehnt', () =>
    assertFails(env.authenticatedContext('neu1').firestore()
      .doc('users/neu1').set({ name: 'Neu', role: 'chef' })));
  await pruefe('Neuanmeldung als Mitarbeiter ist erlaubt', () =>
    assertSucceeds(env.authenticatedContext('neu2').firestore()
      .doc('users/neu2').set({ name: 'Neu', role: 'mitarbeiter' })));

  // ══ 3. Aufgaben nur in eigenen Studios verwalten ══
  await pruefe('Mitarbeiter kann KEINE Aufgabe anlegen', () =>
    assertFails(alsMitarbeiter().doc('studios/studio-6/todos/neu').set({ title: 'x', ts: 1 })));
  await pruefe('Leiter kann im EIGENEN Studio eine Aufgabe anlegen', () =>
    assertSucceeds(alsLeiter().doc('studios/studio-6/todos/neu2').set({ title: 'x', ts: 1 })));
  await pruefe('Leiter kann im FREMDEN Studio KEINE Aufgabe anlegen', () =>
    assertFails(alsLeiter().doc('studios/studio-7/todos/neu3').set({ title: 'x', ts: 1 })));
  await pruefe('Leiter kann im FREMDEN Studio KEINE Aufgabe loeschen', () =>
    assertFails(alsLeiter().doc('studios/studio-7/todos/t2').delete()));

  // ══ 4. Nachweise sind heikel ══
  await pruefe('Leiter kann Nachweise NICHT lesen', () =>
    assertFails(alsLeiter().doc('certificates/z1').get()));
  await pruefe('Fremder kann Nachweise NICHT lesen', () =>
    assertFails(alsFremder().doc('certificates/z1').get()));
  await pruefe('Betroffener kann seinen EIGENEN Nachweis lesen', () =>
    assertSucceeds(alsMitarbeiter().doc('certificates/z1').get()));
  await pruefe('Chef kann Nachweise lesen', () =>
    assertSucceeds(alsChef().doc('certificates/z1').get()));
  await pruefe('Mitarbeiter kann seinen Nachweis NICHT selbst verlaengern', () =>
    assertFails(alsMitarbeiter().doc('certificates/z1').update({ bis: '2099-01-01' })));

  // ══ 5. Direktnachrichten liest niemand mit – auch der Chef nicht ══
  await pruefe('Unbeteiligter kann fremde Direktnachricht NICHT lesen', () =>
    assertFails(alsMitarbeiter().doc('dms/dm_chef1_leiter1/messages/x1').get()));
  await pruefe('Beteiligter kann seine Direktnachricht lesen', () =>
    assertSucceeds(alsLeiter().doc('dms/dm_chef1_leiter1/messages/x1').get()));

  // ══ 6. Papierkorb, Archive, Kennzahlen, Push-Tokens ══
  await pruefe('Mitarbeiter kann den Papierkorb NICHT lesen', () =>
    assertFails(alsMitarbeiter().doc('trash/tr1').get()));
  await pruefe('Leiter kann Papierkorb eines FREMDEN Studios NICHT lesen', () =>
    assertFails(alsLeiter().doc('trash/tr1').get()));
  await pruefe('Mitarbeiter kann Wochen-Sicherungen NICHT lesen', () =>
    assertFails(alsMitarbeiter().doc('archives/2026-KW31').get()));
  await pruefe('Leiter kann Studio-Kennzahlen NICHT lesen', () =>
    assertFails(alsLeiter().doc('studioMetrics/studio-6').get()));
  await pruefe('Niemand kann Push-Tokens lesen', () =>
    assertFails(alsChef().doc('pushTokens/tok1').get()));

  // ══ 7. Dokumente: Leiter nur in eigenen Studios ══
  await pruefe('Leiter kann Metadaten eines FREMDEN Dokuments NICHT aendern', () =>
    assertFails(alsLeiter().doc('documents/d2').update({ name: 'gekapert' })));
  await pruefe('Leiter kann INHALT eines FREMDEN Dokuments NICHT ueberschreiben', () =>
    assertFails(alsLeiter().doc('documentData/d2').set({ data: 'gekapert' })));
  await pruefe('Leiter kann INHALT im EIGENEN Studio sehr wohl schreiben', () =>
    assertSucceeds(alsLeiter().doc('documentData/d1').set({ data: 'meins' })));
  await pruefe('Leiter kann Dokumentinhalt NICHT loeschen (Papierkorb ist Chefsache)', () =>
    assertFails(alsLeiter().doc('documentData/d1').delete()));
  await pruefe('Chef kann Dokumentinhalt loeschen', () =>
    assertSucceeds(alsChef().doc('documentData/d2').delete()));

  // ══ 8. Bekannte, bewusst getragene Schwaechen ══
  //     Diese Tests halten den IST-Zustand fest. Faellt einer um, wurde
  //     etwas geaendert - dann soll man es merken, in beide Richtungen.
  await pruefe('BEKANNT: jeder Eingeloggte darf jedes Materialdokument ueberschreiben', () =>
    assertSucceeds(alsFremder().doc('inventory/studio-9').set({ items: [] })));
  await pruefe('BEKANNT: jeder Eingeloggte darf den ganzen Teamchat lesen', () =>
    assertSucceeds(alsFremder().doc('channels/allgemein/messages/m1').get()));
  await pruefe('BEKANNT: jeder Eingeloggte darf alle Personendaten lesen', () =>
    assertSucceeds(alsFremder().doc('users/chef1').get()));

  console.log('\n════ SICHERHEITSREGELN – ausgefuehrt gegen den Emulator ════');
  protokoll.forEach(z => console.log(z));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  await env.cleanup();
  process.exit(gefallen ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
