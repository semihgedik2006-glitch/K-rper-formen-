/* ── WICHTIG — BITTE BESTÄTIGEN (Runde 135) ──────────────────────────
   IDEEN.md: „Ankündigung, die oben stehen bleibt, bis jede Person sie
   bestätigt hat. Der Chef sieht, wer noch fehlt."

   Eine Bestätigung ist nur etwas wert, wenn sie niemand für einen
   anderen abgeben kann. Geprüft, in BEIDEN Welten (flach und
   firmen/<kennung>/):
     · sich selbst bestätigen (mit readBy im selben Schritt) → geht
     · für jemand anderen bestätigen → geht nicht
     · bei einem Aushang OHNE `wichtig` „bestätigen" → geht nicht
     · den Aushang dabei selbst zu „wichtig" erklären → geht nicht
     · nebenbei den Text ändern → geht nicht
     · die eigene Bestätigung zurücknehmen → geht nicht
     · eine fremde Bestätigung entfernen → geht nicht
   Gegenproben: das bisherige „gelesen" geht weiter; der Chef darf alles.
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

const ANNS = {
  wichtig: { uid: 'chefX', from: 'GF', text: 'Neue Hygieneregel', target: 'all', ts: 2,
             wichtig: true, bestaetigtVon: ['andere'], readBy: ['andere'] },
  normal:  { uid: 'chefX', from: 'GF', text: 'Teamabend', target: 'all', ts: 1, readBy: [] },
};

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
  async function frisch() {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      for (const [id, d] of Object.entries(ANNS)) {
        await db.doc('firmen/eins/announcements/' + id).set(d);
        await db.doc('announcements/' + id).set(d);
      }
    });
  }
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc('firmen/eins').set({ name: 'Betrieb eins', aktiv: true });
    await db.doc('users/ma').set({ name: 'Mara', role: 'mitarbeiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/chef').set({ name: 'Max', role: 'chef', firma: 'eins', aktiv: true, studioKeys: [] });
    await db.doc('users/alt').set({ name: 'Alt', role: 'mitarbeiter', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/altchef').set({ name: 'Altchef', role: 'chef', aktiv: true, studioKeys: [] });
  });
  const als = (uid) => env.authenticatedContext(uid).firestore();

  for (const [welt, ma, chef, p] of [['firmen/eins', 'ma', 'chef', 'firmen/eins/'], ['flach', 'alt', 'altchef', '']]) {
    protokoll.push('\n  ── ' + welt + ' ──');
    const W = p + 'announcements/wichtig', N = p + 'announcements/normal';

    await frisch();
    await darf('sich selbst bestätigen, „gelesen" im selben Schritt',
      als(ma).doc(W).update({ bestaetigtVon: ['andere', ma], readBy: ['andere', ma] }));
    await darfNicht('die eigene Bestätigung zurücknehmen',
      als(ma).doc(W).update({ bestaetigtVon: ['andere'] }));
    await darfNicht('eine fremde Bestätigung entfernen',
      als(ma).doc(W).update({ bestaetigtVon: [ma] }));

    await frisch();
    await darfNicht('für jemand anderen bestätigen',
      als(ma).doc(W).update({ bestaetigtVon: ['andere', 'kollege'] }));
    await darfNicht('sich selbst UND jemand anderen eintragen',
      als(ma).doc(W).update({ bestaetigtVon: ['andere', ma, 'kollege'] }));
    await darfNicht('nebenbei den Text ändern',
      als(ma).doc(W).update({ bestaetigtVon: ['andere', ma], text: 'Gilt nicht mehr' }));
    await darfNicht('bei einem Aushang OHNE „wichtig" eine Bestätigung anlegen',
      als(ma).doc(N).update({ bestaetigtVon: [ma] }));
    await darfNicht('… oder ihn dabei selbst zu „wichtig" erklären',
      als(ma).doc(N).update({ wichtig: true, bestaetigtVon: [ma] }));
    await darfNicht('„wichtig" an einem Aushang abschalten',
      als(ma).doc(W).update({ wichtig: false }));

    // Gegenproben
    await darf('GEGENPROBE „gelesen" allein geht weiter wie bisher',
      als(ma).doc(N).update({ readBy: [ma] }));
    await darf('GEGENPROBE der Chef legt einen wichtigen Aushang an',
      als(chef).doc(p + 'announcements/neu').set({ uid: chef, from: 'GF', text: 'Neu', target: 'all',
        ts: 9, wichtig: true, bestaetigtVon: [], readBy: [] }));
    await darf('GEGENPROBE der Chef darf „wichtig" wieder abschalten',
      als(chef).doc(W).update({ wichtig: false }));
  }

  console.log('\n── Wichtig — bitte bestätigen: Regeln ──');
  protokoll.forEach((z) => console.log(z));
  console.log('\n' + (gefallen
    ? '✗ ' + gefallen + ' Fehler, ' + bestanden + ' in Ordnung'
    : '✓ Wichtig: jede Person bestätigt nur für sich, und nichts lässt sich zurückdrehen — ' + bestanden + ' Zusicherungen'));
  await env.cleanup();
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
