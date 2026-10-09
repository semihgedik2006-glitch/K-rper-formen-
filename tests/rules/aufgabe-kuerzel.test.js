/* ── KÜRZEL BEIM ABHAKEN EINER AUFGABE (Runde 147) ──────────────────────
   Aus dem Betrieb, 9.10.2026: „kannst du es bitte machen das der
   aufgaben bereich vom aufbau und layout GENAU so wie der purtzplan
   aufgestellt ist".

   Zum Putzplan gehört „Wer hakt ab?": das Kürzel vom Gerät wird beim
   Haken mitgeschrieben (doneKuerzel). Die Aufgaben schreiben es jetzt
   auch — dafür steht doneKuerzel in todoMitarbeiterFelder(). Geprüft in
   BEIDEN Welten (flach und firmen/<f>/):

     1. Mitarbeiter im eigenen Studio: abhaken MIT Kürzel geht, das
        Kürzel beim Wieder-Öffnen zurücknehmen auch;
     2. mit dem Kürzel lässt sich nichts anderes mitschmuggeln (Titel,
        Frist bleiben Sache der Leitung);
     3. im fremden Studio geht es nicht;
     4. GEGENPROBE: ohne Kürzel geht es wie bisher, und die Leitung darf
        ohnehin alles.
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
    const d = ctx.firestore();
    await d.doc('firmen/eins').set({ name: 'Betrieb eins', aktiv: true });
    for (const [pre, p, firma] of [['', '', null], ['x', 'firmen/eins/', 'eins']]) {
      const f = firma ? { firma } : {};
      await d.doc('users/' + pre + 'mia').set(Object.assign({ name: 'Mia', role: 'mitarbeiter', aktiv: true,
        studios: ['Brühl'], studioKeys: ['studio-1'] }, f));
      await d.doc('users/' + pre + 'lei').set(Object.assign({ name: 'Lea', role: 'leiter', aktiv: true,
        studios: ['Brühl'], studioKeys: ['studio-1'] }, f));
      for (const sk of ['studio-1', 'studio-2']) {
        await d.doc(p + 'studios/' + sk + '/todos/t1').set({ title: 'Theke wischen', done: false,
          doneBy: null, doneByUid: null, doneAt: null, createdBy: 'Lea', createdByUid: pre + 'lei', ts: 1 });
      }
    }
  });
  const als = (uid) => env.authenticatedContext(uid).firestore();

  for (const [welt, pre, p] of [['flach', '', ''], ['firmen/eins', 'x', 'firmen/eins/']]) {
    protokoll.push('\n  ── ' + welt + ' ──');
    const mia = pre + 'mia', lei = pre + 'lei';
    const ref = (db, sk) => db.doc(p + 'studios/' + sk + '/todos/t1');
    const haken = (uid, k) => Object.assign({ done: true, doneBy: 'Mia', doneByUid: uid, doneAt: 5 },
      k === undefined ? {} : { doneKuerzel: k });

    await darf('1. Mitarbeiter, eigenes Studio: abhaken MIT Kürzel', ref(als(mia), 'studio-1').update(haken(mia, 'AB')));
    await darf('… und wieder öffnen, Kürzel zurückgenommen',
      ref(als(mia), 'studio-1').update({ done: false, doneBy: null, doneByUid: null, doneAt: null, doneKuerzel: null }));
    await darfNicht('2. Kürzel UND Titel zugleich: der Titel ist Sache der Leitung',
      ref(als(mia), 'studio-1').update(Object.assign(haken(mia, 'AB'), { title: 'anders' })));
    await darfNicht('… Kürzel UND Frist zugleich: ebenso nicht',
      ref(als(mia), 'studio-1').update(Object.assign(haken(mia, 'AB'), { due: 9 })));
    await darfNicht('3. Fremdes Studio: auch mit Kürzel nicht', ref(als(mia), 'studio-2').update(haken(mia, 'AB')));
    await darf('4. GEGENPROBE: ohne Kürzel wie bisher', ref(als(mia), 'studio-1').update(haken(mia)));
    await darf('… und die Leitung darf ohnehin', ref(als(lei), 'studio-1').update(haken(lei, 'LZ')));
  }

  await env.cleanup();
  console.log('\n── Kürzel beim Abhaken einer Aufgabe ──');
  protokoll.forEach((z) => console.log(z));
  console.log('\n' + (gefallen
    ? '✗ ' + gefallen + ' Fehler, ' + bestanden + ' in Ordnung'
    : '✓ Aufgaben: doneKuerzel darf mit, sonst nichts — beide Welten, ' + bestanden + ' Zusicherungen'));
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
