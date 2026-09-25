/* ── Auskunft nach Art. 15 DSGVO (P-10, Runde 114) ────────────────────

   Aus dem Betrieb, 25.9.2026, auf die Empfehlung „alles, was die Person
   selbst geschrieben hat oder was über sie gespeichert ist, und ein
   Knopf für den Chef": „Ja genau so".

   auskunftErstellen wird hier AUSGEFÜHRT, gegen den Emulator:

     1. Die Person selbst bekommt ALLES: Profil, Zeiten, Schichten,
        Aufgaben (angelegt UND abgehakt), Chatnachrichten, ihre
        Direktnachrichten mit Inhalt, ihren persönlichen Bereich.
     2. Nie drin: zeitPins, Felder mit hash/token/geheim — und nichts aus
        einer ANDEREN Firma, auch wenn dort dieselbe uid steht.
     3. Der Chef bekommt die Auskunft OHNE Direktnachrichten-Inhalte
        (nur die Zahl) und OHNE persönlichen Bereich — beides sieht er
        in der App auch sonst nicht.
     4. Ein Mitarbeiter für eine andere Person → abgewiesen.
        Ein Chef einer fremden Firma → abgewiesen.
   ───────────────────────────────────────────────────────────────────── */
const path = require('path');

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8791';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'demo-funktionen';
process.env.GOOGLE_CLOUD_PROJECT = 'demo-funktionen';

const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
const fns = require(path.join(__dirname, '..', '..', 'functions', 'index.js'));
const db = admin.firestore();

let bestanden = 0, gefallen = 0;
const protokoll = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) { bestanden++; protokoll.push('  ✓ ' + name); }
  else { gefallen++; protokoll.push('  ✗ ' + name + (zusatz ? '\n      ' + String(zusatz).slice(0, 300) : '')); }
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
  await db.doc('firmen/fremdfirma').set({ name: 'Fremd', aktiv: true });
  await db.doc('users/mara').set({ name: 'Mara', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'], email: 'mara@example.org', pinHash: 'abc' });
  await db.doc('users/ben').set({ name: 'Ben', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] });
  await db.doc('users/max').set({ name: 'Max', role: 'chef', firma: 'koerperformen', aktiv: true, studioKeys: [] });
  await db.doc('users/zoe').set({ name: 'Zoe', role: 'chef', firma: 'fremdfirma', aktiv: true, studioKeys: [] });

  await db.doc(F + 'zeiten/z1').set({ uid: 'mara', art: 'kommen', ts: 1 });
  await db.doc(F + 'zeiten/z2').set({ uid: 'ben', art: 'kommen', ts: 2 });
  await db.doc(F + 'studios/studio-1/shifts/s1').set({ uid: 'mara', date: '2026-09-25' });
  await db.doc(F + 'studios/studio-1/todos/t1').set({ title: 'Von Mara angelegt', createdByUid: 'mara' });
  await db.doc(F + 'studios/studio-1/todos/t2').set({ title: 'Von Mara abgehakt', createdByUid: 'ben', doneByUid: 'mara' });
  await db.doc(F + 'studios/studio-1/todos/t3').set({ title: 'Nicht von Mara', createdByUid: 'ben' });
  await db.doc(F + 'channels/allgemein/messages/m1').set({ uid: 'mara', text: 'Guten Morgen' });
  await db.doc(F + 'channels/allgemein/messages/m2').set({ uid: 'ben', text: 'Hallo' });
  await db.doc(F + 'dms/dm_ben_mara').set({ participants: ['ben', 'mara'], names: { ben: 'Ben', mara: 'Mara' } });
  await db.doc(F + 'dms/dm_ben_mara/messages/d1').set({ uid: 'mara', text: 'GEHEIMER DM-TEXT VON MARA' });
  await db.doc(F + 'dms/dm_ben_mara/messages/d2').set({ uid: 'ben', text: 'Antwort von Ben' });
  await db.doc(F + 'privat/mara').set({ kalenderToken: 'SOLLTE-NIE-RAUS', notiz: 'nur für mich' });
  await db.doc(F + 'privat/mara/ziele/g1').set({ text: 'Mehr Probetrainings' });
  await db.doc(F + 'zeitPins/mara').set({ uid: 'mara', hash: 'x' });
  await db.doc(F + 'documents/doc1').set({ name: 'Plan', uploadedByUid: 'mara', studios: 'all' });
  await db.doc(F + 'documentData/doc1').set({ uid: 'mara', data: 'data:application/pdf;base64,' + 'A'.repeat(6000) });
  await db.doc('firmen/fremdfirma/zeiten/x1').set({ uid: 'mara', art: 'kommen', ts: 9, fremd: 'ANDERE FIRMA' });

  // ══ 1. Die Person selbst ══
  const r = await fns.auskunftErstellen.run({}, als('mara'));
  const text = JSON.stringify(r);
  const b = r.bereiche || {};
  pruefe('volle Fassung für die Person selbst', r.fassung === 'voll', r.fassung);
  pruefe('Profil mit Name und Mail', r.person && r.person.name === 'Mara' && r.person.email === 'mara@example.org');
  pruefe('Zeiten: nur ihre', (b.zeiten || []).length === 1 && b.zeiten[0].id === 'z1', JSON.stringify(b.zeiten));
  pruefe('Schichten aus dem Studio, mit Studio', (b['studios/shifts'] || []).length === 1 && b['studios/shifts'][0].studio === 'studio-1', JSON.stringify(b['studios/shifts']));
  pruefe('Aufgaben: angelegt UND abgehakt, nicht die fremde', (b['studios/todos'] || []).map(x => x.id).sort().join() === 't1,t2', JSON.stringify(b['studios/todos']));
  pruefe('Chatnachricht: ihre, nicht Bens', (b['channels/messages'] || []).map(x => x.id).join() === 'm1');
  pruefe('Direktnachrichten MIT Inhalt, beide Seiten', /GEHEIMER DM-TEXT VON MARA/.test(text) && /Antwort von Ben/.test(text));
  pruefe('persönlicher Bereich dabei (Ziele)', (b['privat/ziele'] || []).length === 1 && /nur für mich/.test(text));
  pruefe('Dokument, das sie hochgeladen hat', (b.documents || []).some(x => x.id === 'doc1'));
  pruefe('eingebettete Datei nur als Grösse, nicht als Inhalt', /eingebettete Datei, \d+ KB/.test(text) && !/AAAAAAAAAA/.test(text));

  // ══ 2. Nie drin ══
  pruefe('nie: zeitPins', !b.zeitPins && !/"hash"/.test(text));
  pruefe('nie: Felder mit token/hash (kalenderToken, pinHash)', !/SOLLTE-NIE-RAUS/.test(text) && !/pinHash/.test(text));
  pruefe('nie: etwas aus einer ANDEREN Firma', !/ANDERE FIRMA/.test(text));

  // ══ 3. Der Chef ══
  const c = await fns.auskunftErstellen.run({ uid: 'mara' }, als('max'));
  const ct = JSON.stringify(c);
  pruefe('Chef: Fassung ohne DM-Inhalte und persönlichen Bereich', /ohne Direktnachrichten/.test(c.fassung), c.fassung);
  pruefe('Chef: DM nur als Zahl — kein Inhalt', !/GEHEIMER DM-TEXT/.test(ct) && c.bereiche.dms && c.bereiche.dms[0].eigeneNachrichten === 1 && c.bereiche.dms[0].alleNachrichten === 2, JSON.stringify(c.bereiche.dms));
  pruefe('Chef: kein persönlicher Bereich', !/nur für mich/.test(ct) && !c.bereiche['privat/ziele']);
  pruefe('Chef: der Rest ist da (Zeiten, Aufgaben)', (c.bereiche.zeiten || []).length === 1 && (c.bereiche['studios/todos'] || []).length === 2);

  // ══ 4. Wer nicht darf ══
  await scheitert('ein Mitarbeiter für eine andere Person', fns.auskunftErstellen.run({ uid: 'mara' }, als('ben')), /Geschäftsführung/);
  await scheitert('der Chef einer fremden Firma', fns.auskunftErstellen.run({ uid: 'mara' }, als('zoe')), /gibt es in diesem Betrieb nicht/);
  await scheitert('ohne Anmeldung', fns.auskunftErstellen.run({}, {}), /einloggen/);

  console.log('\n══ Auskunft nach Art. 15 ══');
  protokoll.forEach(z => console.log(z));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  if (gefallen) { console.log('\n✗ Die Auskunft ist falsch oder undicht.'); process.exit(1); }
  console.log('\n✓ Auskunft: vollständig für die Person, begrenzt für den Chef, nichts Fremdes, nichts Geheimes.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
