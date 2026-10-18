/* ── LAGEBERICHT DES STUDIO-GEHIRNS (Runde 150) ──────────────────────
   Aus dem Betrieb, 18.10.2026: „zusammenfasst das die chefs und ich
   wissen was abgeht".

   Der Bericht nennt Fragen aus dem Team und was in den Studios liegen
   geblieben ist. Er gehört der Leitung, nicht dem ganzen Team. Geprüft,
   in BEIDEN Welten (flach und firmen/<kennung>/):
     · Chef und Studioleitung dürfen ihn lesen
     · Mitarbeiter dürfen ihn NICHT lesen — obwohl die allgemeine
       config-Regel jedem Aktiven das Lesen erlaubt (die Ausnahme muss
       dort stehen, sonst genügt diese eine erlaubende Regel)
     · niemand schreibt ihn aus der App, auch der Chef nicht — er kommt
       nur vom Server
     · eine fremde Firma liest ihn nicht
   Gegenprobe: config/features bleibt für Mitarbeiter lesbar.
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

const BERICHT = { tag: { text: 'Heute 12 Fragen, 2 offen.', zahlen: { fragen: 12, offen: 2, ideen: 1 }, stand: 1 } };

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
    await db.doc('firmen/zwei').set({ name: 'Betrieb zwei', aktiv: true });
    await db.doc('firmen/eins/config/lagebericht').set(BERICHT);
    await db.doc('firmen/eins/config/features').set({ schicht: true });
    await db.doc('config/lagebericht').set(BERICHT);
    await db.doc('config/features').set({ schicht: true });
    await db.doc('users/ma').set({ name: 'Mara', role: 'mitarbeiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/leiter').set({ name: 'Lea', role: 'leiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/chef').set({ name: 'Max', role: 'chef', firma: 'eins', aktiv: true, studioKeys: [] });
    await db.doc('users/fremdchef').set({ name: 'Fremd', role: 'chef', firma: 'zwei', aktiv: true, studioKeys: [] });
    await db.doc('users/alt').set({ name: 'Alt', role: 'mitarbeiter', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/altleiter').set({ name: 'Altleiter', role: 'leiter', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/altchef').set({ name: 'Altchef', role: 'chef', aktiv: true, studioKeys: [] });
  });
  const als = (uid) => env.authenticatedContext(uid).firestore();

  for (const [welt, ma, leiter, chef, p] of [
    ['firmen/eins', 'ma', 'leiter', 'chef', 'firmen/eins/'],
    ['flach', 'alt', 'altleiter', 'altchef', '']]) {
    protokoll.push('\n  ── ' + welt + ' ──');
    const B = p + 'config/lagebericht';
    await darf('der Chef liest den Lagebericht', als(chef).doc(B).get());
    await darf('die Studioleitung liest den Lagebericht', als(leiter).doc(B).get());
    await darfNicht('ein Mitarbeiter liest den Lagebericht NICHT', als(ma).doc(B).get());
    await darfNicht('der Chef schreibt ihn NICHT aus der App (nur der Server)', als(chef).doc(B).set({ tag: { text: 'gefälscht' } }));
    await darfNicht('der Chef ändert ihn NICHT', als(chef).doc(B).update({ 'tag.text': 'gefälscht' }));
    await darfNicht('die Studioleitung schreibt ihn NICHT', als(leiter).doc(B).set({ tag: { text: 'x' } }));
    await darfNicht('der Chef löscht ihn NICHT', als(chef).doc(B).delete());
    await darf('GEGENPROBE config/features bleibt für Mitarbeiter lesbar', als(ma).doc(p + 'config/features').get());
  }
  protokoll.push('\n  ── fremde Firma ──');
  await darfNicht('der Chef einer fremden Firma liest den Bericht von „eins" NICHT',
    als('fremdchef').doc('firmen/eins/config/lagebericht').get());

  console.log('\n── Lagebericht: Regeln ──');
  protokoll.forEach((z) => console.log(z));
  console.log('\n' + (gefallen
    ? '✗ ' + gefallen + ' Fehler, ' + bestanden + ' in Ordnung'
    : '✓ Lagebericht: nur die Leitung liest, niemand schreibt aus der App — ' + bestanden + ' Zusicherungen'));
  await env.cleanup();
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
