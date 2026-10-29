/* ── KUNDENPOST (Runde 295) ─────────────────────────────────────────
   Aus dem Betrieb, 28.10.2026: „gehe nie davon aus das etwas erledigt
   wurde nur weils unter erledigt ist, mitarbeiter können sehr dumm sein
   leider". Dazu, auf die Frage, wer abhaken darf: der Mitarbeiter mit
   Grund, die Leitung bestätigt; sichtbar für alle des Studios.

   Was dieser Durchlauf festhält, in BEIDEN Welten (firmen/<k>/ und flach):
     · ein Mitarbeiter liest die Kundenpost SEINES Studios (auch als
       Abfrage studioKey == …), nicht die eines fremden
     · er meldet „erledigt" nur so: offen → wartet, mit Grund aus der
       Liste und der EIGENEN Kennung — nicht auf „bestaetigt", nicht
       ohne Grund, nicht unter fremdem Namen, kein Zusatzfeld, nicht
       ein zweites Mal
     · die Leitung des Studios bestätigt (wartet → bestaetigt) oder gibt
       zurück (wartet → offen); eine fremde Leitung nicht
     · anlegen und löschen darf niemand ausser dem Server
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
const POST = (studio, f) => Object.assign({ studioKey: studio, name: 'S. Brandt', betreff: 'Kündigung',
  art: 'kuendigung', kurz: 'Bittet um Bestätigung.', eingang: 1, status: 'offen' }, f || {});
const ERL = (uid, f) => Object.assign({ status: 'wartet', grund: 'telefon', erledigtUid: uid,
  erledigtName: 'Mara', erledigtTs: 2 }, f || {});
const BEST = (uid, f) => Object.assign({ status: 'bestaetigt', bestaetigtUid: uid, bestaetigtTs: 3 }, f || {});

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
  async function anlegen(p) {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const d = ctx.firestore();
      for (const [id, x] of Object.entries({
        k1: POST('studio-1'), k2: POST('studio-1'), k3: POST('studio-1'), k4: POST('studio-1'),
        k5: POST('studio-1', ERL('ma')), k6: POST('studio-1', ERL('ma')), k9: POST('studio-9') })) {
        await d.doc(p + 'kundenpost/' + id).set(x);
      }
    });
  }
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await d.doc('firmen/eins').set({ name: 'Betrieb eins', aktiv: true });
    await d.doc('users/chef').set({ name: 'Max', role: 'chef', firma: 'eins', aktiv: true, studioKeys: [] });
    await d.doc('users/lei').set({ name: 'Lea', role: 'leiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/lei9').set({ name: 'Leo', role: 'leiter', firma: 'eins', aktiv: true, studioKeys: ['studio-9'] });
    await d.doc('users/ma').set({ name: 'Mara', role: 'mitarbeiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/ma9').set({ name: 'Nils', role: 'mitarbeiter', firma: 'eins', aktiv: true, studioKeys: ['studio-9'] });
    await d.doc('users/altlei').set({ name: 'Altlea', role: 'leiter', aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/altlei9').set({ name: 'Altleo', role: 'leiter', aktiv: true, studioKeys: ['studio-9'] });
    await d.doc('users/altma').set({ name: 'Altma', role: 'mitarbeiter', aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/altma9').set({ name: 'Altnils', role: 'mitarbeiter', aktiv: true, studioKeys: ['studio-9'] });
  });
  const als = (uid) => env.authenticatedContext(uid).firestore();
  for (const [welt, lei, lei9, ma, ma9, p] of [['firmen/eins', 'lei', 'lei9', 'ma', 'ma9', 'firmen/eins/'],
                                              ['flach', 'altlei', 'altlei9', 'altma', 'altma9', '']]) {
    await anlegen(p);
    protokoll.push('\n  ── ' + welt + ' ──');
    const K = p + 'kundenpost/';
    await darf('Mitarbeiter liest die Kundenpost seines Studios', als(ma).doc(K + 'k1').get());
    await darf('… auch als Abfrage studioKey == …', als(ma).collection(p + 'kundenpost').where('studioKey', '==', 'studio-1').get());
    await darfNicht('… aber nicht ungefiltert', als(ma).collection(p + 'kundenpost').get());
    await darfNicht('… und nicht die eines fremden Studios', als(ma).doc(K + 'k9').get());
    await darfNicht('ein Mitarbeiter eines fremden Studios liest sie nicht', als(ma9).doc(K + 'k1').get());

    await darf('erledigt melden: offen → wartet, mit Grund und eigener Kennung', als(ma).doc(K + 'k1').update(ERL(ma)));
    await darfNicht('… nicht ein zweites Mal (steht schon auf wartet)', als(ma).doc(K + 'k1').update(ERL(ma, { grund: 'mail' })));
    await darfNicht('… nicht selbst bestätigen', als(ma).doc(K + 'k2').update(BEST(ma)));
    await darfNicht('… nicht ohne Grund aus der Liste', als(ma).doc(K + 'k2').update(ERL(ma, { grund: 'egal' })));
    await darfNicht('… nicht unter fremder Kennung', als(ma).doc(K + 'k2').update(ERL(lei)));
    await darfNicht('… kein Zusatzfeld', als(ma).doc(K + 'k2').update(ERL(ma, { name: 'Jemand' })));
    await darfNicht('… den Text nicht ändern', als(ma).doc(K + 'k2').update({ kurz: 'anders' }));
    await darfNicht('… kein Mitarbeiter eines fremden Studios', als(ma9).doc(K + 'k3').update(ERL(ma9)));
    await darfNicht('ein Mitarbeiter bestätigt nicht', als(ma).doc(K + 'k5').update(BEST(ma)));

    await darf('die Leitung bestätigt', als(lei).doc(K + 'k5').update(BEST(lei)));
    await darf('… oder gibt zurück (wartet → offen)', als(lei).doc(K + 'k6').update(BEST(lei, { status: 'offen' })));
    await darfNicht('… aber nichts, was noch offen ist', als(lei).doc(K + 'k4').update(BEST(lei)));
    await darfNicht('eine fremde Leitung bestätigt nicht', als(lei9).doc(K + 'k3').update(BEST(lei9)));

    await darfNicht('niemand legt Kundenpost an (nur der Server)', als(lei).doc(K + 'neu').set(POST('studio-1')));
    await darfNicht('… auch der Chef nicht', als('chef').doc(K + 'neu2').set(POST('studio-1')));
    await darfNicht('niemand löscht', als(lei).doc(K + 'k4').delete());
  }
  await env.cleanup();

  console.log('\n── Kundenpost ──');
  protokoll.forEach((z) => console.log(z));
  console.log('\n' + (gefallen
    ? '✗ ' + gefallen + ' Fehler, ' + bestanden + ' in Ordnung'
    : '✓ Kundenpost: nur das eigene Studio, erledigt nur mit Grund, bestätigen nur die Leitung — ' + bestanden + ' Zusicherungen'));
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
