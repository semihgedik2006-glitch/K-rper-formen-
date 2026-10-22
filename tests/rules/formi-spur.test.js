/* ── FORMI-SPUR BEIM ABHAKEN (Runde 186) ─────────────────────────────────
   Aus dem Betrieb, 22.10.2026: auf „die Spur an allem, was Formi getan
   hat" — „ja".

   Hakt Formi für jemanden ab, steht formiAt (= doneAt) daneben; die App
   zeigt dann „über Formi". Das Feld steht dafür in todoMitarbeiterFelder()
   und putzMitarbeiterFelder(). Geprüft in BEIDEN Welten (flach und
   firmen/<f>/), an Aufgaben UND Putzplan:

     1. Mitarbeiter im eigenen Studio: abhaken MIT formiAt geht, die Spur
        beim Wieder-Öffnen zurücknehmen auch;
     2. mit formiAt lässt sich nichts anderes mitschmuggeln (Titel bleibt
        Sache der Leitung);
     3. Aufgabe im fremden Studio: auch mit Spur nicht;
     4. GEGENPROBE: ohne formiAt wie bisher.
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
      for (const sk of ['studio-1', 'studio-2']) {
        await d.doc(p + 'studios/' + sk + '/todos/t1').set({ title: 'Theke wischen', done: false,
          doneBy: null, doneByUid: null, doneAt: null, createdBy: 'Lea', createdByUid: pre + 'lei', ts: 1 });
        await d.doc(p + 'studios/' + sk + '/cleaning/c1').set({ text: 'Spiegel putzen', done: false,
          doneBy: null, doneByUid: null, doneAt: null });
      }
    }
  });
  const als = (uid) => env.authenticatedContext(uid).firestore();

  for (const [welt, pre, p] of [['flach', '', ''], ['firmen/eins', 'x', 'firmen/eins/']]) {
    protokoll.push('\n  ── ' + welt + ' ──');
    const mia = pre + 'mia';
    const todo = (db, sk) => db.doc(p + 'studios/' + sk + '/todos/t1');
    const putz = (db, sk) => db.doc(p + 'studios/' + sk + '/cleaning/c1');
    const haken = (uid, spur) => Object.assign({ done: true, doneBy: 'Mia', doneByUid: uid, doneAt: 5 },
      spur ? { formiAt: 5 } : {});
    const auf = { done: false, doneBy: null, doneByUid: null, doneAt: null, formiAt: null };

    await darf('1. Aufgabe, eigenes Studio: über Formi abhaken', todo(als(mia), 'studio-1').update(haken(mia, true)));
    await darf('… und wieder öffnen, Spur zurückgenommen', todo(als(mia), 'studio-1').update(auf));
    await darf('1. Putzplan: über Formi abhaken', putz(als(mia), 'studio-1').update(haken(mia, true)));
    await darf('… und wieder öffnen, Spur zurückgenommen', putz(als(mia), 'studio-1').update(auf));
    await darfNicht('2. Spur UND Titel zugleich (Aufgabe): der Titel ist Sache der Leitung',
      todo(als(mia), 'studio-1').update(Object.assign(haken(mia, true), { title: 'anders' })));
    await darfNicht('2. Spur UND Text zugleich (Putzplan): ebenso nicht',
      putz(als(mia), 'studio-1').update(Object.assign(haken(mia, true), { text: 'anders' })));
    await darfNicht('3. Aufgabe im fremden Studio: auch mit Spur nicht', todo(als(mia), 'studio-2').update(haken(mia, true)));
    await darf('4. GEGENPROBE: ohne Spur wie bisher (Aufgabe)', todo(als(mia), 'studio-1').update(haken(mia, false)));
    await darf('4. GEGENPROBE: ohne Spur wie bisher (Putzplan)', putz(als(mia), 'studio-1').update(haken(mia, false)));
  }

  await env.cleanup();
  console.log('\n── Formi-Spur beim Abhaken ──');
  protokoll.forEach((z) => console.log(z));
  console.log('\n' + (gefallen
    ? '✗ ' + gefallen + ' Fehler, ' + bestanden + ' in Ordnung'
    : '✓ formiAt darf mit, sonst nichts — Aufgaben und Putzplan, beide Welten, ' + bestanden + ' Zusicherungen'));
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
