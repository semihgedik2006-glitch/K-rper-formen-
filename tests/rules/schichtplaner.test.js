/* ── SCHICHTPLANER (Runde 154) ───────────────────────────────────────
   Aus dem Betrieb, 19.10.2026: die Chefin plant 14 Studios; die
   Mitarbeiter tragen ihre Wünsche selbst ein — „wenn sie vergessen
   wünsche etc. zu äussern haben sie pech".

   In BEIDEN Welten (firmen/<k>/ und flach), weil eine Sammlung, die nur
   auf einem Pfad steht, in diesem Projekt schon fünfmal die Lücke war:
   · planerTeam: nur der Chef liest und schreibt; die Person liest ihre
     eigene Zeile, keine fremde; die Studioleitung (noch) nichts
   · planerWuensche: jeder nur für sich, unter <uid>_<JJJJ-MM>; kein
     Zusatzfeld, kein fremder Name, keine falsche Kennung; fremde
     Wünsche liest nur der Chef (auch als Abfrage monat == …)
   · planerPlaene: nur der Chef
   · config/schichtplaner: lesen alle Aktiven (die Frist), schreiben
     nur der Chef
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertFails, assertSucceeds } =
  require(path.join(__dirname, 'node_modules', '@firebase/rules-unit-testing'));

let bestanden = 0, gefallen = 0;
const protokoll = [];
async function darf(name, v) {
  try { await assertSucceeds(v); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — sollte gehen, ging nicht (' + String(e.message).slice(0, 90) + ')'); }
}
async function darfNicht(name, v) {
  try { await assertFails(v); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — GING DURCH'); }
}
const W = (uid, monat, f) => Object.assign({ uid, name: 'Mara', monat, frei: ['2026-11-03'],
  lieber: 'Früh', notiz: '', ts: 1 }, f || {});

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
    await d.doc('users/chef').set({ name: 'Max', role: 'chef', firma: 'eins', aktiv: true, studioKeys: [] });
    await d.doc('users/lei').set({ name: 'Lea', role: 'leiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/ma').set({ name: 'Mara', role: 'mitarbeiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/ma2').set({ name: 'Mo', role: 'mitarbeiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/altchef').set({ name: 'Altchef', role: 'chef', aktiv: true, studioKeys: [] });
    await d.doc('users/altlei').set({ name: 'Altlea', role: 'leiter', aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/altma').set({ name: 'Altma', role: 'mitarbeiter', aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/altma2').set({ name: 'Altmo', role: 'mitarbeiter', aktiv: true, studioKeys: ['studio-1'] });
    for (const [p, ma, ma2] of [['firmen/eins/', 'ma', 'ma2'], ['', 'altma', 'altma2']]) {
      await d.doc(p + 'planerTeam/' + ma).set({ name: 'Mara', rolle: 'Minijob', haupt: 'studio-1', maxMonatStd: 40 });
      await d.doc(p + 'planerTeam/' + ma2).set({ name: 'Mo', rolle: 'Vollzeit', haupt: 'studio-1', wocheStd: 40 });
      await d.doc(p + 'planerWuensche/' + ma2 + '_2026-11').set(W(ma2, '2026-11', { name: 'Mo' }));
      await d.doc(p + 'planerPlaene/2026-11').set({ monat: '2026-11', einsaetze: [] });
      await d.doc(p + 'config/schichtplaner').set({ wunschFristTag: 15, schichten: {} });
    }
  });
  const als = (uid) => env.authenticatedContext(uid).firestore();
  for (const [welt, chef, lei, ma, ma2, p] of [['firmen/eins', 'chef', 'lei', 'ma', 'ma2', 'firmen/eins/'],
                                              ['flach', 'altchef', 'altlei', 'altma', 'altma2', '']]) {
    protokoll.push('\n  ── ' + welt + ' ──');
    const T = p + 'planerTeam/', WU = p + 'planerWuensche/', PL = p + 'planerPlaene/';
    // planerTeam
    await darf('Chef liest das Team', als(chef).collection(T.slice(0, -1)).get());
    await darf('Chef schreibt eine Person', als(chef).doc(T + 'x-neu').set({ name: 'Neu', rolle: 'Aushilfe' }));
    await darf('Mitarbeiter liest seine eigene Zeile', als(ma).doc(T + ma).get());
    await darfNicht('Mitarbeiter liest keine fremde Zeile', als(ma).doc(T + ma2).get());
    await darfNicht('Mitarbeiter liest nicht das ganze Team', als(ma).collection(T.slice(0, -1)).get());
    await darfNicht('Mitarbeiter ändert seine Stunden nicht selbst', als(ma).doc(T + ma).update({ maxMonatStd: 400 }));
    await darfNicht('Studioleitung liest das Team (noch) nicht', als(lei).collection(T.slice(0, -1)).get());
    await darfNicht('Studioleitung schreibt keine Person', als(lei).doc(T + 'x-lei').set({ name: 'X' }));
    // planerWuensche
    await darf('Mitarbeiter trägt eigene Wünsche ein', als(ma).doc(WU + ma + '_2026-11').set(W(ma, '2026-11')));
    await darf('… und ändert sie', als(ma).doc(WU + ma + '_2026-11').set(W(ma, '2026-11', { frei: [], lieber: 'Spät' })));
    await darf('… und liest sie', als(ma).doc(WU + ma + '_2026-11').get());
    await darfNicht('nicht unter fremdem Namen', als(ma).doc(WU + ma2 + '_2026-11').set(W(ma2, '2026-11')));
    await darfNicht('nicht mit fremder uid unter eigener Kennung', als(ma).doc(WU + ma + '_2026-11').set(W(ma2, '2026-11')));
    await darfNicht('Kennung muss zum Monat passen', als(ma).doc(WU + ma + '_2026-12').set(W(ma, '2026-11')));
    await darfNicht('kein Zusatzfeld', als(ma).doc(WU + ma + '_2026-11').set(W(ma, '2026-11', { genehmigt: true })));
    await darfNicht('kein erfundenes „lieber"', als(ma).doc(WU + ma + '_2026-11').set(W(ma, '2026-11', { lieber: 'Nie' })));
    await darfNicht('höchstens 31 Tage', als(ma).doc(WU + ma + '_2026-11').set(W(ma, '2026-11', { frei: Array(32).fill('2026-11-01') })));
    await darfNicht('kein falscher Monat', als(ma).doc(WU + ma + '_2026-13').set(W(ma, '2026-13')));
    await darfNicht('fremde Wünsche liest ein Mitarbeiter nicht', als(ma).doc(WU + ma2 + '_2026-11').get());
    await darfNicht('… die Studioleitung auch nicht', als(lei).doc(WU + ma2 + '_2026-11').get());
    await darf('Chef liest die Wünsche eines Monats (Abfrage)', als(chef).collection(WU.slice(0, -1)).where('monat', '==', '2026-11').get());
    await darfNicht('Mitarbeiter fragt nicht alle Wünsche ab', als(ma).collection(WU.slice(0, -1)).where('monat', '==', '2026-11').get());
    await darfNicht('fremde Wünsche löscht ein Mitarbeiter nicht', als(ma).doc(WU + ma2 + '_2026-11').delete());
    await darf('eigene löschen geht', als(ma).doc(WU + ma + '_2026-11').delete());
    // planerPlaene
    await darf('Chef liest den Entwurf', als(chef).doc(PL + '2026-11').get());
    await darf('Chef speichert den Entwurf', als(chef).doc(PL + '2026-12').set({ monat: '2026-12', einsaetze: [] }));
    await darfNicht('Studioleitung liest den Entwurf nicht', als(lei).doc(PL + '2026-11').get());
    await darfNicht('Mitarbeiter liest den Entwurf nicht', als(ma).doc(PL + '2026-11').get());
    await darfNicht('Mitarbeiter schreibt keinen Entwurf', als(ma).doc(PL + '2026-11').set({ monat: '2026-11' }));
    // config/schichtplaner
    await darf('Mitarbeiter liest die Frist', als(ma).doc(p + 'config/schichtplaner').get());
    await darfNicht('Mitarbeiter verschiebt die Frist nicht', als(ma).doc(p + 'config/schichtplaner').set({ wunschFristTag: 31 }));
    await darf('Chef schreibt die Schichten', als(chef).doc(p + 'config/schichtplaner').set({ wunschFristTag: 15 }, { merge: true }));
  }
  // Über die Firmengrenze
  protokoll.push('\n  ── Firmengrenze ──');
  await darfNicht('Chef einer anderen Firma liest das flache Team nicht',
    als('chef').collection('planerTeam').get());
  await env.cleanup();
  console.log(protokoll.join('\n'));
  console.log('\n' + (gefallen ? '✗ ' : '✓ ') + 'Schichtplaner-Regeln: ' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
