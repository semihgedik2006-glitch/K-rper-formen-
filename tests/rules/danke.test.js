/* ── „Danke" an einer erledigten Aufgabe (Runde 103, Idee D1) ─────────
   Neu in firestore.rules: nurEigenesDanke(), in BEIDEN Welten (flach
   und firmen/<kennung>/) an den Aufgaben.

   Was dieser Durchlauf festhält, in beiden Welten:

     · ein Kollege im Studio sagt Danke an einer ERLEDIGTEN Aufgabe → geht
     · und nimmt es wieder zurück                                   → geht
     · an einer OFFENEN Aufgabe                                     → nicht
     · an der EIGENEN erledigten Aufgabe                            → nicht
     · im Namen eines ANDEREN (fremde Kennung als Schlüssel)        → nicht
     · einen fremden Dank löschen oder ändern                       → nicht
     · `fuer` passt nicht zur Erledigung (Danke von gestern)        → nicht
     · zusätzliche Felder im Eintrag (z. B. ein Zähler)             → nicht
     · im selben Schreibvorgang noch ein anderes Feld ändern        → nicht
     · aus einem FREMDEN Studio                                     → nicht
     · aus einer fremden Firma                                      → nicht

   Und die Gegenprobe, dass Abhaken und „ich übernehme das" wie vorher
   gehen — die neue Regel steht als ODER neben der alten und darf sie
   nicht verengen.
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

const ERLEDIGT_AM = 1727100000000;
const ERLEDIGT = { title: 'Lager sortieren', done: true, doneBy: 'Anna', doneByUid: 'anna',
  doneAt: ERLEDIGT_AM, createdByUid: 'chef' };
const OFFEN = { title: 'Handtücher', done: false, createdByUid: 'chef' };
const FREMDER_DANK = { lea: { n: 'Lea', ts: 1, fuer: ERLEDIGT_AM } };

/* Zwei Welten. Die flache hängt an aufFlachenPfaden(): firma leer oder
   die Kennung des ersten Betriebs. */
const WELTEN = [
  { name: 'flach',  firma: 'koerperformen', P: (sk, id) => 'studios/' + sk + '/todos/' + id },
  { name: 'Mandant', firma: 'eins',         P: (sk, id) => 'firmen/eins/studios/' + sk + '/todos/' + id },
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
      await db.doc('firmen/zwei').set({ name: 'Fremd', aktiv: true });
      const u = (uid, name, keys, firma) => db.doc('users/' + uid).set({
        name, role: 'mitarbeiter', firma: firma || W.firma, aktiv: true, studioKeys: keys });
      await u('anna', 'Anna', ['studio-1']);
      await u('ben', 'Ben', ['studio-1']);
      await u('lea', 'Lea', ['studio-1']);
      await u('fremdstudio', 'Fremd', ['studio-2']);
      await u('fremdfirma', 'Andere Firma', ['studio-1'], 'zwei');
    });
    async function lege(id, daten) {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc(W.P('studio-1', id)).set(daten);
      });
    }
    const ref = (uid, id) => als(uid).doc(W.P('studio-1', id || 't1'));
    const meinDank = { n: 'Ben', ts: 5, fuer: ERLEDIGT_AM };

    // ── Der richtige Weg ──
    await lege('t1', ERLEDIGT);
    await darf('Ben sagt Danke an Annas erledigter Aufgabe',
      ref('ben').update({ danke: { ben: meinDank } }));
    await darf('… und nimmt es wieder zurück',
      ref('ben').update({ danke: {} }));

    await lege('t1', Object.assign({}, ERLEDIGT, { danke: FREMDER_DANK }));
    await darf('Ben dankt zusätzlich, Leas Dank bleibt stehen',
      ref('ben').update({ danke: Object.assign({}, FREMDER_DANK, { ben: meinDank }) }));

    // ── Die Sperren ──
    await lege('t2', OFFEN);
    await darfNicht('an einer OFFENEN Aufgabe',
      ref('ben', 't2').update({ danke: { ben: { n: 'Ben', ts: 5, fuer: 0 } } }));

    await lege('t1', ERLEDIGT);
    await darfNicht('Anna dankt sich SELBST',
      ref('anna').update({ danke: { anna: { n: 'Anna', ts: 5, fuer: ERLEDIGT_AM } } }));
    await darfNicht('im Namen eines ANDEREN (Kennung lea, geschrieben von ben)',
      ref('ben').update({ danke: { lea: { n: 'Lea', ts: 5, fuer: ERLEDIGT_AM } } }));

    await lege('t1', Object.assign({}, ERLEDIGT, { danke: FREMDER_DANK }));
    await darfNicht('einen FREMDEN Dank löschen',
      ref('ben').update({ danke: {} }));
    await darfNicht('einen fremden Dank ÄNDERN',
      ref('ben').update({ danke: { lea: { n: 'Lea', ts: 99, fuer: ERLEDIGT_AM } } }));

    await lege('t1', ERLEDIGT);
    await darfNicht('`fuer` passt nicht zur Erledigung (ein Danke von gestern)',
      ref('ben').update({ danke: { ben: { n: 'Ben', ts: 5, fuer: ERLEDIGT_AM - 86400000 } } }));
    await darfNicht('ein zusätzliches Feld im Eintrag (Zähler)',
      ref('ben').update({ danke: { ben: { n: 'Ben', ts: 5, fuer: ERLEDIGT_AM, anzahl: 10 } } }));
    await darfNicht('ein zu langer Name (über 80 Zeichen)',
      ref('ben').update({ danke: { ben: { n: 'x'.repeat(81), ts: 5, fuer: ERLEDIGT_AM } } }));
    await darfNicht('im selben Schreibvorgang noch den Titel ändern',
      ref('ben').update({ danke: { ben: meinDank }, title: 'Umbenannt' }));
    await darfNicht('danke als Liste statt als Karte',
      ref('ben').update({ danke: ['ben'] }));
    await darfNicht('aus einem FREMDEN Studio',
      ref('fremdstudio').update({ danke: { fremdstudio: { n: 'Fremd', ts: 5, fuer: ERLEDIGT_AM } } }));
    await darfNicht('aus einer FREMDEN Firma',
      ref('fremdfirma').update({ danke: { fremdfirma: { n: 'X', ts: 5, fuer: ERLEDIGT_AM } } }));

    // ── Gegenprobe: das Bisherige geht wie vorher ──
    await lege('t2', OFFEN);
    await darf('GEGENPROBE Ben hakt eine offene Aufgabe ab',
      ref('ben', 't2').update({ done: true, doneBy: 'Ben', doneByUid: 'ben', doneAt: 7 }));
    await lege('t2', OFFEN);
    await darf('GEGENPROBE Ben übernimmt eine Aufgabe',
      ref('ben', 't2').update({ assignedTo: 'ben', assignedName: 'Ben' }));
    await lege('t1', ERLEDIGT);
    await darfNicht('GEGENPROBE den Titel ändern darf ein Mitarbeiter weiterhin nicht',
      ref('ben').update({ title: 'Umbenannt' }));
  }

  await env.cleanup();
  console.log('\n„Danke" an erledigten Aufgaben (beide Welten)');
  console.log(protokoll.join('\n'));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
