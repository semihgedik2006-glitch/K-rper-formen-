/* ── GETEILTE DESIGNS (Runde 291) ─────────────────────────────────────
   Aus dem Betrieb, 26.10.2026: „seine designs speichern können das man
   wechseln kann nach bedarf und das andere das auch sehen und nutzen
   können".

   Geprüft, in BEIDEN Welten (flach und firmen/<kennung>/):
     · lesen: jeder Aktive der Firma; ein Inaktiver (frisch registriert,
       noch nicht freigeschaltet) nicht
     · teilen: nur unter der eigenen Kennung, nur die erlaubten Felder,
       Name 1–30 Zeichen, aufbau und prefs als Karte
     · ändern: nur wer es geteilt hat, und die Kennung bleibt
     · entfernen: wer es geteilt hat, oder der Chef – sonst niemand
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertFails, assertSucceeds } =
  require(path.join(__dirname, 'node_modules', '@firebase/rules-unit-testing'));

let bestanden = 0, gefallen = 0;
const protokoll = [];
async function darf(name, versprechen) {
  try { await assertSucceeds(versprechen); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — sollte gehen, ging nicht (' + String(e.message).slice(0, 80) + ')'); }
}
async function darfNicht(name, versprechen) {
  try { await assertFails(versprechen); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — GING DURCH'); }
}
const D = (uid, extra) => Object.assign({ uid, von: 'Mara', name: 'Frühschicht',
  aufbau: { leiste: ['v-todos', 'v-chat'], start: 'todos' }, prefs: { theme: 'light' }, ts: 1 }, extra || {});

(async () => {
  const env = await initializeTestEnvironment({
    projectId: 'demo-regeltest',
    firestore: { host: '127.0.0.1', port: 8791,
      rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8') }
  });
  for (let v = 1; ; v++) {
    try { await env.clearFirestore(); break; }
    catch (e) { if (v >= 3) throw e; await new Promise((r) => setTimeout(r, 1000 * v)); }
  }
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc('firmen/eins').set({ name: 'Betrieb eins', aktiv: true });
    await db.doc('users/ma').set({ name: 'Mara', role: 'mitarbeiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/ma2').set({ name: 'Mo', role: 'mitarbeiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/chef').set({ name: 'Max', role: 'chef', firma: 'eins', aktiv: true, studioKeys: [] });
    await db.doc('users/neu').set({ name: 'Neu', role: 'mitarbeiter', firma: 'eins', aktiv: false, studioKeys: [] });
    await db.doc('users/alt').set({ name: 'Alt', role: 'mitarbeiter', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/alt2').set({ name: 'Alt2', role: 'mitarbeiter', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/altchef').set({ name: 'Altchef', role: 'chef', aktiv: true, studioKeys: [] });
    await db.doc('users/altneu').set({ name: 'Altneu', role: 'mitarbeiter', aktiv: false, studioKeys: [] });
  });
  const als = (uid) => env.authenticatedContext(uid).firestore();

  for (const [welt, ma, ma2, chef, neu, p] of [['firmen/eins', 'ma', 'ma2', 'chef', 'neu', 'firmen/eins/'], ['flach', 'alt', 'alt2', 'altchef', 'altneu', '']]) {
    protokoll.push('\n  ── ' + welt + ' ──');
    await darf('Mitarbeiter teilt ein Design unter der eigenen Kennung', als(ma).doc(p + 'designs/d1').set(D(ma)));
    await darfNicht('… unter einer FREMDEN Kennung', als(ma).doc(p + 'designs/d2').set(D(ma2)));
    await darfNicht('… mit einem fremden Feld', als(ma).doc(p + 'designs/d3').set(D(ma, { geheim: 'x' })));
    await darfNicht('… ohne Namen', als(ma).doc(p + 'designs/d4').set(D(ma, { name: '' })));
    await darfNicht('… mit 31 Zeichen Namen', als(ma).doc(p + 'designs/d5').set(D(ma, { name: 'x'.repeat(31) })));
    await darfNicht('… mit aufbau als Text', als(ma).doc(p + 'designs/d6').set(D(ma, { aufbau: 'kaputt' })));
    await darfNicht('ein Inaktiver teilt', als(neu).doc(p + 'designs/d7').set(D(neu)));
    await darf('ein anderer Aktiver liest es', als(ma2).doc(p + 'designs/d1').get());
    await darf('… auch als Liste (orderBy ts)', als(ma2).collection(p + 'designs').orderBy('ts', 'desc').limit(50).get());
    await darfNicht('ein Inaktiver liest es nicht', als(neu).doc(p + 'designs/d1').get());
    await darf('wer es geteilt hat, ändert den Namen', als(ma).doc(p + 'designs/d1').update({ name: 'Spätschicht' }));
    await darfNicht('… aber nicht die Kennung', als(ma).doc(p + 'designs/d1').update({ uid: ma2 }));
    await darfNicht('ein anderer ändert es nicht', als(ma2).doc(p + 'designs/d1').update({ name: 'Meins' }));
    await darfNicht('ein anderer entfernt es nicht', als(ma2).doc(p + 'designs/d1').delete());
    await darf('wer es geteilt hat, entfernt es', als(ma).doc(p + 'designs/d1').delete());
    await darf('(neu geteilt)', als(ma).doc(p + 'designs/d8').set(D(ma)));
    await darf('der Chef entfernt jedes', als(chef).doc(p + 'designs/d8').delete());
  }
  await env.cleanup();
  console.log('\nGeteilte Designs (Runde 291)\n' + protokoll.join('\n'));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
