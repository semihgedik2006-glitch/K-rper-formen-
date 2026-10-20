/* ── Formi per Mail: der Leitungs-Code (20.10.2026) ───────────────────
   Neu in firestore.rules: gehirnGeheim, in BEIDEN Welten (flach und
   firmen/<kennung>/), für Clients ganz zu. Darin liegt der Hash des
   Codes, mit dem die Leitung per Mail Aufgaben anlegt. Geschrieben von
   formiCodeSetzen, gelesen von formiMail — sonst von niemandem.

   Geprüft, in beiden Welten:
     · den Hash lesen                            → nicht
     · einen Code anlegen                        → nicht
     · ändern oder löschen                       → nicht
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
  { name: 'flach',   firma: 'koerperformen', P: (id) => 'gehirnGeheim/' + id },
  { name: 'Mandant', firma: 'eins',          P: (id) => 'firmen/eins/gehirnGeheim/' + id },
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
      await db.doc(W.P('e1')).set({ hash: 'ab12', salz: 'cd34', gesetzt: 1, gesetztVon: 'chef' });
    });
    await darfNicht(W.name + ': den Code-Hash lesen', als('anna').doc(W.P('e1')).get());
    await darfNicht(W.name + ': die Sammlung abfragen', als('anna').collection(W.P('x').replace(/\/x$/, '')).get());
    await darfNicht(W.name + ': einen eigenen Code anlegen', als('anna').doc(W.P('e2')).set({ hash: 'x', salz: 'y' }));
    await darfNicht(W.name + ': den Hash überschreiben', als('anna').doc(W.P('e1')).update({ hash: 'anders' }));
    await darfNicht(W.name + ': den Code löschen', als('anna').doc(W.P('e1')).delete());
    await darfNicht(W.name + ': als Chef lesen (auch die Leitung sieht den Hash nicht)', als('chef').doc(W.P('e1')).get());
    await darfNicht(W.name + ': als Chef selbst setzen (nur über die Function)', als('chef').doc(W.P('mail')).set({ hash: 'x', salz: 'y' }));
    await darfNicht(W.name + ': ohne Anmeldung lesen', env.unauthenticatedContext().firestore().doc(W.P('e1')).get());
    await env.withSecurityRulesDisabled(async (ctx) => {
      await darf(W.name + ': Gegenprobe — der Server schreibt und liest', ctx.firestore().doc(W.P('e3')).set({ hash: 'z', salz: 'w' }).then(() => ctx.firestore().doc(W.P('e3')).get()));
    });
  }

  await env.cleanup();
  console.log(protokoll.join('\n'));
  console.log('\n' + (gefallen ? '✗ ' : '✓ ') + 'Formi-Mail-Code: ' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
