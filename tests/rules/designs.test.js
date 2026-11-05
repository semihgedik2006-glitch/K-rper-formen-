/* ── GETEILTE DESIGNS (Runde 292) ─────────────────────────────────────
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
     · vorschlagen (Runde 294, `angebot:true`): nur Chef und Leitung.
       Aus dem Betrieb: „leitungen können es für mitarbeiter einstellen
       wenn sie es wollen aber nicht sofort automatisch"
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
    await db.doc('users/le').set({ name: 'Lea', role: 'leiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/altle').set({ name: 'Altlea', role: 'leiter', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/neu').set({ name: 'Neu', role: 'mitarbeiter', firma: 'eins', aktiv: false, studioKeys: [] });
    await db.doc('users/alt').set({ name: 'Alt', role: 'mitarbeiter', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/alt2').set({ name: 'Alt2', role: 'mitarbeiter', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/altchef').set({ name: 'Altchef', role: 'chef', aktiv: true, studioKeys: [] });
    await db.doc('users/ma3').set({ name: 'Mia', role: 'mitarbeiter', firma: 'eins', aktiv: true, studioKeys: ['studio-2'] });
    await db.doc('users/alt3').set({ name: 'Alt3', role: 'mitarbeiter', aktiv: true, studioKeys: ['studio-2'] });
    await db.doc('users/altneu').set({ name: 'Altneu', role: 'mitarbeiter', aktiv: false, studioKeys: [] });
  });
  const als = (uid) => env.authenticatedContext(uid).firestore();

  for (const [welt, ma, ma2, chef, neu, p, le, ma3] of [['firmen/eins', 'ma', 'ma2', 'chef', 'neu', 'firmen/eins/', 'le', 'ma3'], ['flach', 'alt', 'alt2', 'altchef', 'altneu', '', 'altle', 'alt3']]) {
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
    /* Runde 294: Vorschläge der Leitung */
    /* Seit Runde 303 nennt die Studioleitung ihre Studios (siehe unten). */
    await darf('die Leitung schlägt ein Design vor', als(le).doc(p + 'designs/a1').set(D(le, { angebot: true, studios: ['studio-1'] })));
    await darf('der Chef schlägt ein Design vor', als(chef).doc(p + 'designs/a2').set(D(chef, { angebot: true })));
    await darfNicht('ein Mitarbeiter schlägt NICHT vor', als(ma).doc(p + 'designs/a3').set(D(ma, { angebot: true })));
    await darf('… teilt aber mit angebot:false', als(ma).doc(p + 'designs/a4').set(D(ma, { angebot: false })));
    await darfNicht('… und macht sein Design nicht nachträglich zum Vorschlag', als(ma).doc(p + 'designs/a4').update({ angebot: true }));
    await darfNicht('angebot muss ja/nein sein', als(le).doc(p + 'designs/a5').set(D(le, { angebot: 'ja' })));
    await darf('Mitarbeiter lesen Vorschläge (where angebot == true)', als(ma2).collection(p + 'designs').where('angebot', '==', true).limit(20).get());
    await darfNicht('ein Inaktiver liest Vorschläge nicht', als(neu).collection(p + 'designs').where('angebot', '==', true).limit(20).get());
    await darf('die Leitung zieht den eigenen Vorschlag zurück', als(le).doc(p + 'designs/a1').delete());
    await darfNicht('ein Mitarbeiter entfernt den Vorschlag des Chefs nicht', als(ma).doc(p + 'designs/a2').delete());
    /* Runde 303, aus dem Betrieb, 5.11.2026: „Studio leitung soll nur für
       ihre eigenen studios machen können, Leitung soll es sofort festlegen
       können ohne vorschlag". */
    await darf('die Studioleitung legt für ihr eigenes Studio fest', als(le).doc(p + 'designs/f1').set(D(le, { angebot: true, art: 'fest', studios: ['studio-1'] })));
    await darfNicht('… aber nicht für ein fremdes Studio', als(le).doc(p + 'designs/f2').set(D(le, { angebot: true, art: 'fest', studios: ['studio-2'] })));
    await darfNicht('… und nicht für eigenes + fremdes', als(le).doc(p + 'designs/f3').set(D(le, { angebot: true, studios: ['studio-1', 'studio-2'] })));
    await darfNicht('… und nicht für „alle Studios"', als(le).doc(p + 'designs/f4').set(D(le, { angebot: true, studios: 'all' })));
    await darfNicht('… und nicht ohne Studios', als(le).doc(p + 'designs/f5').set(D(le, { angebot: true, art: 'fest' })));
    await darfNicht('… und nicht mit leerer Liste', als(le).doc(p + 'designs/f6').set(D(le, { angebot: true, studios: [] })));
    await darfNicht('… und macht ihr Angebot nicht nachträglich firmenweit', als(le).doc(p + 'designs/f1').update({ studios: ['studio-2'] }));
    await darf('der Chef legt für alle Studios fest', als(chef).doc(p + 'designs/f7').set(D(chef, { angebot: true, art: 'fest', studios: 'all' })));
    await darf('der Chef legt für ein beliebiges Studio fest', als(chef).doc(p + 'designs/f8').set(D(chef, { angebot: true, art: 'fest', studios: ['studio-2'] })));
    await darfNicht('art nur vorschlag oder fest', als(chef).doc(p + 'designs/f9').set(D(chef, { angebot: true, art: 'zwang', studios: 'all' })));
    await darfNicht('ein Mitarbeiter legt nichts fest', als(ma).doc(p + 'designs/f10').set(D(ma, { angebot: true, art: 'fest', studios: ['studio-1'] })));
    await darfNicht('art/studios ohne angebot gehen nicht', als(ma).doc(p + 'designs/f11').set(D(ma, { art: 'fest', studios: ['studio-1'] })));
    await darfNicht('studios als Text ausser „all" gehen nicht', als(chef).doc(p + 'designs/f12').set(D(chef, { angebot: true, studios: 'studio-1' })));
    /* Runde 304: Sperre und Rückmeldung – „okay mach das alles" (5.11.2026) */
    await darf('die Studioleitung legt fest und sperrt', als(le).doc(p + 'designs/s1').set(D(le, { angebot: true, art: 'fest', studios: ['studio-1'], sperre: true })));
    await darfNicht('gesperrt nur an einer Festlegung (nicht am Vorschlag)', als(le).doc(p + 'designs/s2').set(D(le, { angebot: true, art: 'vorschlag', studios: ['studio-1'], sperre: true })));
    await darfNicht('sperre muss ja/nein sein', als(chef).doc(p + 'designs/s3').set(D(chef, { angebot: true, art: 'fest', studios: 'all', sperre: 'ja' })));
    await darfNicht('ein Mitarbeiter sperrt nichts', als(ma).doc(p + 'designs/s4').set(D(ma, { sperre: true })));
    const A = (uid, wie) => ({ uid, name: 'Mara', wie: wie || 'ja', ts: 2 });
    await darf('Mitarbeiter meldet „übernommen" unter der eigenen Kennung', als(ma).doc(p + 'designs/f1/antworten/' + ma).set(A(ma)));
    await darf('… und ändert es später in „selbst geändert"', als(ma).doc(p + 'designs/f1/antworten/' + ma).set(A(ma, 'eigen')));
    await darfNicht('… nicht unter einer fremden Kennung', als(ma).doc(p + 'designs/f1/antworten/' + ma2).set(A(ma2)));
    await darfNicht('… nicht mit fremder uid im Feld', als(ma).doc(p + 'designs/f1/antworten/' + ma).set(A(ma2)));
    await darfNicht('… nicht mit einem anderen Wort', als(ma).doc(p + 'designs/f1/antworten/' + ma).set(A(ma, 'vielleicht')));
    await darfNicht('… nicht mit fremdem Feld', als(ma).doc(p + 'designs/f1/antworten/' + ma).set(Object.assign(A(ma), { geheim: 1 })));
    await darfNicht('… nicht zu einem Design ohne Angebot', als(ma2).doc(p + 'designs/a4/antworten/' + ma2).set(A(ma2)));
    await darfNicht('… nicht zu einem Angebot für ein fremdes Studio', als(ma3).doc(p + 'designs/f1/antworten/' + ma3).set(A(ma3)));
    await darf('… aber zu einem für „alle Studios"', als(ma3).doc(p + 'designs/f7/antworten/' + ma3).set(A(ma3, 'fest')));
    await darf('… und zu einem alten Vorschlag ohne Studios', als(ma3).doc(p + 'designs/a2/antworten/' + ma3).set(A(ma3, 'nein')));
    await darfNicht('… nicht zu einem Design, das es nicht gibt', als(ma).doc(p + 'designs/gibtsnicht/antworten/' + ma).set(A(ma)));
    await darfNicht('ein Inaktiver meldet nichts', als(neu).doc(p + 'designs/f7/antworten/' + neu).set(A(neu)));
    await darf('die Leitung liest die Rückmeldungen zum eigenen Angebot', als(le).collection(p + 'designs/f1/antworten').get());
    await darf('der Chef liest sie auch', als(chef).collection(p + 'designs/f1/antworten').get());
    await darfNicht('ein Kollege liest sie NICHT', als(ma2).collection(p + 'designs/f1/antworten').get());
    await darfNicht('… auch nicht einzeln', als(ma2).doc(p + 'designs/f1/antworten/' + ma).get());
    await darfNicht('die Leitung liest nicht die Rückmeldungen zum Angebot des Chefs', als(le).collection(p + 'designs/f7/antworten').get());
    await darfNicht('ein Mitarbeiter löscht die eigene Rückmeldung nicht', als(ma).doc(p + 'designs/f1/antworten/' + ma).delete());
    await darf('die Leitung entfernt Rückmeldungen zum eigenen Angebot', als(le).doc(p + 'designs/f1/antworten/' + ma).delete());
    await darf('der Chef entfernt jede', als(chef).doc(p + 'designs/f7/antworten/' + ma3).delete());
  }
  await env.cleanup();
  console.log('\nGeteilte Designs (Runde 292, Vorschläge Runde 294, Studios und Festlegen Runde 303, Sperre und Rückmeldung Runde 304)\n' + protokoll.join('\n'));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
