/* ── Erinnerungen des Studio-Gehirns (20.10.2026) ─────────────────────
   Neu in firestore.rules: gehirnErinnerungen, in BEIDEN Welten (flach und
   firmen/<kennung>/), für Clients ganz zu. Angelegt, gelesen und gelöscht
   wird nur vom Server (Function gehirnErinnerung, Zeitplan
   gehirnErinnerungenSenden).

   Geprüft, in beiden Welten:
     · die eigene Erinnerung lesen               → nicht
     · eine anlegen (auch mit eigener uid)       → nicht
     · eine ändern oder löschen                  → nicht
     · als Chef                                  → nicht
     · Gegenprobe: der Server (Regeln aus) kann schreiben und lesen
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertFails, assertSucceeds } =
  require(path.join(__dirname, 'node_modules', '@firebase/rules-unit-testing'));

let bestanden = 0, gefallen = 0;
const protokoll = [];
async function darf(name, v) {
  try { await assertSucceeds(v); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — sollte gehen, ging nicht: ' + String(e.message).split('\n')[0].slice(0, 120)); }
}
async function darfNicht(name, v) {
  try { await assertFails(v); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — GING DURCH'); }
}

const WELTEN = [
  { name: 'flach',   firma: 'koerperformen', P: (id) => 'gehirnErinnerungen/' + id },
  { name: 'Mandant', firma: 'eins',          P: (id) => 'firmen/eins/gehirnErinnerungen/' + id },
];

(async () => {
  const env = await initializeTestEnvironment({
    projectId: 'demo-regeltest',
    firestore: { rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8') },
  });
  const als = (uid) => env.authenticatedContext(uid).firestore();

  for (const W of WELTEN) {
    protokoll.push('\n  ── ' + W.name + ' ──');
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await db.doc('firmen/' + W.firma).set({ name: 'Betrieb', aktiv: true });
      await db.doc('users/anna').set({ name: 'Anna', role: 'mitarbeiter', firma: W.firma, aktiv: true, studioKeys: ['studio-1'] });
      await db.doc('users/chef').set({ name: 'Chef', role: 'chef', firma: W.firma, aktiv: true, studioKeys: ['studio-1'] });
      await db.doc(W.P('e1')).set({ uid: 'anna', text: 'Wäsche', faellig: Date.now() + 3600000 });
    });
    await darfNicht(W.name + ': die eigene Erinnerung lesen', als('anna').doc(W.P('e1')).get());
    await darfNicht(W.name + ': alle Erinnerungen abfragen', als('anna').collection(W.P('x').replace(/\/x$/, '')).get());
    await darfNicht(W.name + ': eine anlegen (eigene uid)', als('anna').doc(W.P('e2')).set({ uid: 'anna', text: 'x', faellig: Date.now() + 60000 }));
    await darfNicht(W.name + ': eine ändern', als('anna').doc(W.P('e1')).update({ text: 'anders' }));
    await darfNicht(W.name + ': eine löschen', als('anna').doc(W.P('e1')).delete());
    await darfNicht(W.name + ': als Chef lesen', als('chef').doc(W.P('e1')).get());
    await darfNicht(W.name + ': ohne Anmeldung lesen', env.unauthenticatedContext().firestore().doc(W.P('e1')).get());
    await env.withSecurityRulesDisabled(async (ctx) => {
      await darf(W.name + ': Gegenprobe — der Server schreibt und liest', ctx.firestore().doc(W.P('e3')).set({ uid: 'anna', text: 'y', faellig: 1 }).then(() => ctx.firestore().doc(W.P('e3')).get()));
    });
  }

  await env.cleanup();
  console.log(protokoll.join('\n'));
  console.log('\n' + (gefallen ? '✗ ' : '✓ ') + 'Gehirn-Erinnerungen: ' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
