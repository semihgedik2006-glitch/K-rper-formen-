/* ── Pause ODER Feierabend: der Stempel sagt, was er will (Runde 186) ──
   Aus dem Betrieb, 22.10.2026: „so wie crewmeister funktioniert am
   besten". Dort stehen nach dem Kommen zwei Knöpfe, Pause und
   Feierabend.

   Beim Nachlesen gefunden: der Server kannte nur kommen → pause →
   zurueck → pause → … „gehen" liess sich weder am Terminal noch am
   Handy stempeln. Jeder Tag endete mit „Feierabend fehlt".

   stempeln, handyStempeln und stempelStand werden hier AUSGEFÜHRT,
   gegen den Emulator. Geprüft wird:
     1. Nach dem Kommen geht Feierabend direkt (art: 'gehen').
     2. Was gerade nicht passt, wird abgewiesen — mit dem Satz, was dran
        ist — und es entsteht KEIN Stempel.
     3. Ohne `art` bleibt es beim alten Ablauf (ein Tablet mit der alten
        Seite im Speicher stempelt weiter).
     4. stempelStand nennt den eigenen Stand erst NACH der PIN; falsche
        PIN → abgewiesen und als Fehlversuch gezählt (die Bremse gilt
        auch hier, sonst wäre es ein Weg zum Durchprobieren).
     5. Ein als ungültig markierter Stempel zählt beim Stand nicht mit.
     6. Dasselbe am Handy.
   ───────────────────────────────────────────────────────────────────── */
const path = require('path');

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8791';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'demo-funktionen';
process.env.GOOGLE_CLOUD_PROJECT = 'demo-funktionen';

const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
const fns = require(path.join(__dirname, '..', '..', 'functions', 'index.js'));
const db = admin.firestore();
const I = fns.__intern;

let bestanden = 0, gefallen = 0;
const protokoll = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) { bestanden++; protokoll.push('  ✓ ' + name); }
  else { gefallen++; protokoll.push('  ✗ ' + name + (zusatz ? '\n      ' + zusatz : '')); }
}
async function scheitert(name, versprechen, muster) {
  try { await versprechen; gefallen++; protokoll.push('  ✗ ' + name + ' — GING DURCH'); }
  catch (e) {
    const ok = !muster || muster.test(String(e.message || e));
    if (ok) { bestanden++; protokoll.push('  ✓ ' + name); }
    else { gefallen++; protokoll.push('  ✗ ' + name + ' — falscher Grund: ' + e.message); }
  }
}
const als = (uid) => ({ auth: { uid } });

(async () => {
  const F = 'firmen/koerperformen/';
  await db.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });
  await db.doc('users/tablet2').set({ name: 'Empfang', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] });
  await db.doc('users/paula').set({ name: 'Paula', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] });
  await db.doc('users/hanna').set({ name: 'Hanna', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'], handyStempeln: true });
  await db.doc(F + 'terminals/t-sch').set({ name: 'Empfang', studioKey: 'studio-1', hash: I.geheimHashen('geheim-s') });
  await db.doc(F + 'terminalCodes/t-sch').set({ saat: 'saat-fuer-den-test' });
  await db.doc(F + 'zeitPins/paula').set({ salz: 'sp', hash: I.pinHashen('5813', 'sp'), fehlversuche: 0 });
  for (const uid of ['paula', 'hanna']) {
    const alte = await db.collection(F + 'zeiten').where('uid', '==', uid).get();
    for (const d of alte.docs) await d.ref.delete();
  }
  const basis = { terminalId: 't-sch', geheim: 'geheim-s', uid: 'paula', pin: '5813' };
  const anzahl = async (uid) => (await db.collection(F + 'zeiten').where('uid', '==', uid).get()).size;

  /* ── Rechenkern ohne Datenbank ── */
  pruefe('erlaubt ohne Stempel: nur Kommen', JSON.stringify(I.erlaubteSchritte(null)) === '["kommen"]');
  pruefe('erlaubt nach Kommen: Pause oder Feierabend', JSON.stringify(I.erlaubteSchritte('kommen')) === '["pause","gehen"]');
  pruefe('erlaubt in der Pause: Zurück oder Feierabend', JSON.stringify(I.erlaubteSchritte('pause')) === '["zurueck","gehen"]');
  pruefe('erlaubt nach Feierabend: wieder Kommen', JSON.stringify(I.erlaubteSchritte('gehen')) === '["kommen"]');
  pruefe('ohne Wunsch: alter Ablauf (kommen → pause)', I.schrittWaehlen('kommen') === 'pause');
  let fehler = '';
  try { I.schrittWaehlen('gehen', 'pause'); } catch (e) { fehler = e.message; }
  pruefe('Pause nach Feierabend wird abgewiesen, mit dem Satz was dran ist', /Pause.*passt gerade nicht.*Kommen/.test(fehler), fehler);
  const st = I.tagesStand([{ art: 'kommen', ts: 1000 }, { art: 'pause', ts: 4000 }, { art: 'zurueck', ts: 5000 }], 9000);
  pruefe('tagesStand: Arbeit ohne Pause gerechnet (3000 + 4000)', st.arbeitMs === 7000 && st.letzteArt === 'zurueck' && st.beginn === 1000, JSON.stringify(st));
  const st2 = I.tagesStand([{ art: 'kommen', ts: 1000 }, { art: 'gehen', ts: 2000, storno: { grund: 'x' } }], 3000);
  pruefe('tagesStand: ungültig markierter Feierabend zählt nicht', st2.letzteArt === 'kommen' && st2.arbeitMs === 2000, JSON.stringify(st2));

  /* ── stempelStand am Terminal ── */
  const s0 = await fns.stempelStand.run(Object.assign({}, basis), als('tablet2'));
  pruefe('Stand vor dem ersten Stempel: nichts, dran ist Kommen', s0.letzteArt === null && JSON.stringify(s0.erlaubt) === '["kommen"]' && s0.name === 'Paula', JSON.stringify(s0));
  await scheitert('Stand mit falscher PIN → abgewiesen', fns.stempelStand.run(Object.assign({}, basis, { pin: '0000' }), als('tablet2')), /Falsche PIN/);
  const pinNach = (await db.doc(F + 'zeitPins/paula').get()).data();
  pruefe('… und als Fehlversuch gezählt (Bremse gilt auch hier)', pinNach.fehlversuche === 1, JSON.stringify(pinNach));
  await scheitert('Stand mit falschem Gerätegeheimnis → abgewiesen', fns.stempelStand.run(Object.assign({}, basis, { geheim: 'falsch' }), als('tablet2')), /weist sich nicht aus/);
  pruefe('stempelStand legt KEINEN Stempel an', await anzahl('paula') === 0);

  /* ── stempeln mit art ── */
  await scheitert('Feierabend ohne Kommen → abgewiesen', fns.stempeln.run(Object.assign({}, basis, { art: 'gehen' }), als('tablet2')), /passt gerade nicht.*Kommen/);
  pruefe('… und es entsteht kein Stempel', await anzahl('paula') === 0);
  const r1 = await fns.stempeln.run(Object.assign({}, basis, { art: 'kommen' }), als('tablet2'));
  pruefe('Kommen mit art', r1.art === 'kommen');
  const s1 = await fns.stempelStand.run(Object.assign({}, basis), als('tablet2'));
  pruefe('Stand danach: im Dienst, Pause oder Feierabend', s1.letzteArt === 'kommen' && JSON.stringify(s1.erlaubt) === '["pause","gehen"]' && s1.seit > 0, JSON.stringify(s1));
  await scheitert('Unsinn als art → abgewiesen', fns.stempeln.run(Object.assign({}, basis, { art: 'urlaub' }), als('tablet2')), /gibt es nicht/);
  const r2 = await fns.stempeln.run(Object.assign({}, basis, { art: 'gehen' }), als('tablet2'));
  pruefe('FEIERABEND DIREKT NACH DEM KOMMEN — vorher unmöglich', r2.art === 'gehen', r2.art);
  pruefe('… genau zwei Stempel', await anzahl('paula') === 2);

  /* Gegenprobe: der alte Ablauf ohne art geht weiter, kennt aber keinen Feierabend */
  const r3 = await fns.stempeln.run(Object.assign({}, basis), als('tablet2'));
  const r4 = await fns.stempeln.run(Object.assign({}, basis), als('tablet2'));
  pruefe('GEGENPROBE ohne art: kommen, dann pause (alter Ablauf bleibt)', r3.art === 'kommen' && r4.art === 'pause', r3.art + ' / ' + r4.art);
  const r5 = await fns.stempeln.run(Object.assign({}, basis, { art: 'gehen' }), als('tablet2'));
  pruefe('aus der Pause direkt in den Feierabend', r5.art === 'gehen');

  /* Ungültig markierter Feierabend: danach gilt wieder „im Dienst" */
  const letzter = (await db.collection(F + 'zeiten').where('uid', '==', 'paula').get()).docs
    .map((d) => ({ ref: d.ref, z: d.data() })).sort((a, b) => b.z.ts - a.z.ts)[0];
  await letzter.ref.update({ storno: { von: 'chef', grund: 'Test', ts: Date.now() } });
  const s2 = await fns.stempelStand.run(Object.assign({}, basis), als('tablet2'));
  pruefe('ungültig markierter Feierabend: Stand wieder Pause', s2.letzteArt === 'pause', JSON.stringify(s2));
  const r6 = await fns.stempeln.run(Object.assign({}, basis, { art: 'zurueck' }), als('tablet2'));
  pruefe('… und Zurück geht (der stornierte zählt nicht)', r6.art === 'zurueck');

  /* ── Handy ── */
  const code = I.codeAus('saat-fuer-den-test', I.codeFenster(Date.now()));
  const h1 = await fns.handyStempeln.run({ code, art: 'kommen' }, als('hanna'));
  pruefe('Handy: Kommen mit art', h1.art === 'kommen');
  await scheitert('Handy: Zurück ohne Pause → abgewiesen', fns.handyStempeln.run({ code, art: 'zurueck' }, als('hanna')), /passt gerade nicht/);
  const h2 = await fns.handyStempeln.run({ code, art: 'gehen' }, als('hanna'));
  pruefe('Handy: Feierabend', h2.art === 'gehen');
  pruefe('Handy: zwei Stempel, nicht drei', await anzahl('hanna') === 2);

  console.log('\nPause oder Feierabend (Runde 186)\n' + protokoll.join('\n'));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
