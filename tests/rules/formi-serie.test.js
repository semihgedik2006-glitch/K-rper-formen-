/* ── FORMIS SERIE: DIE TAGE AM PUTZPUNKT (Runde 302) ───────────────────
   Aus dem Betrieb, 5.11.2026 („alles davon ist super"): ist der Putzplan
   eine Woche lang komplett, trägt Formi eine Woche lang einen hellen
   Ring. Dafür schreibt die App beim Abhaken die letzten 15 Tage an den
   Putzpunkt (Feld tage). Das Feld steht in putzMitarbeiterFelder().
   Geprüft in BEIDEN Welten (flach und firmen/<f>/):

     1. Mitarbeiter: abhaken MIT tage geht, zurücknehmen auch;
     2. mit tage lässt sich der Text nicht mitändern;
     3. tage an einer AUFGABE geht nicht (nur Putzplan);
     4. GEGENPROBE: ohne tage wie bisher.
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
    const haken = (uid, tage) => Object.assign({ done: true, doneBy: 'Mia', doneByUid: uid, doneAt: 5 },
      tage ? { tage: ['2026-11-04', '2026-11-05'] } : {});
    await darf('1. Putzplan: abhaken mit den Tagen', putz(als(mia), 'studio-1').update(haken(mia, true)));
    await darf('… und zurücknehmen (heute fällt raus)', putz(als(mia), 'studio-1').update({ done: false, doneBy: null, doneByUid: null, doneAt: null, tage: ['2026-11-04'] }));
    await darfNicht('2. Tage UND Text zugleich: der Text ist Sache der Leitung',
      putz(als(mia), 'studio-1').update(Object.assign(haken(mia, true), { text: 'anders' })));
    await darfNicht('3. Tage an einer Aufgabe: nicht vorgesehen', todo(als(mia), 'studio-1').update(haken(mia, true)));
    await darf('4. GEGENPROBE: ohne Tage wie bisher', putz(als(mia), 'studio-1').update(haken(mia, false)));
  }

  await env.cleanup();
  console.log('\n── Formis Serie: Tage am Putzpunkt ──');
  protokoll.forEach((z) => console.log(z));
  console.log('\n' + (gefallen
    ? '✗ ' + gefallen + ' Fehler, ' + bestanden + ' in Ordnung'
    : '✓ tage darf beim Putzplan mit, sonst nichts — beide Welten, ' + bestanden + ' Zusicherungen'));
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
