/* ── Korrekturanträge (Runde 204) ──────────────────────────────────────
   Aus dem Betrieb, 22.10.2026, auf die Frage, wer einen Antrag der
   Mitarbeiter bestätigt: „nur geschäftsführung".

   Teil A — die Regeln, in BEIDEN Welten (flach und firmen/<k>/):
     · die Person liest ihre eigenen Anträge
     · die Geschäftsführung liest alle
     · die Studioleitung NICHT, ein Kollege nicht, eine fremde Firma nicht
     · niemand schreibt aus dem Browser — auch nicht die eigene Person,
       auch nicht die Geschäftsführung

   Teil B — die Funktionen, AUSGEFÜHRT gegen den Emulator:
     · stellen: nur mit Grund, nicht in der Zukunft, höchstens 31 Tage
       zurück, nur für ein eigenes Studio; derselbe Antrag zweimal → einer
     · entscheiden: nur die Geschäftsführung; NICHT der eigene Antrag
     · angenommen → GENAU EIN neuer Stempel (quelle korrektur, antragId),
       der Urbestand bleibt; ein zweites Annehmen → abgewiesen
     · abgelehnt → nur mit Antwort, KEIN Stempel
     · zurückziehen: nur die Person, nur solange offen
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertFails, assertSucceeds } =
  require(path.join(__dirname, 'node_modules', '@firebase/rules-unit-testing'));

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8791';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'demo-funktionen';
process.env.GOOGLE_CLOUD_PROJECT = 'demo-funktionen';

let bestanden = 0, gefallen = 0;
const protokoll = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) { bestanden++; protokoll.push('  ✓ ' + name); }
  else { gefallen++; protokoll.push('  ✗ ' + name + (zusatz ? '\n      ' + zusatz : '')); }
}
async function darf(name, versprechen) {
  try { await assertSucceeds(versprechen); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — sollte gehen, ging nicht'); }
}
async function darfNicht(name, versprechen) {
  try { await assertFails(versprechen); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — GING DURCH'); }
}
async function scheitert(name, versprechen, muster) {
  try { await versprechen; gefallen++; protokoll.push('  ✗ ' + name + ' — GING DURCH'); }
  catch (e) {
    const ok = !muster || muster.test(String(e.message || e));
    if (ok) { bestanden++; protokoll.push('  ✓ ' + name); }
    else { gefallen++; protokoll.push('  ✗ ' + name + ' — falscher Grund: ' + e.message); }
  }
}
function tagZurueck(n) {
  return new Date(Date.now() - n * 86400000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
}
const LEUTE = {
  anna: { name: 'Anna', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
  ben:  { name: 'Ben',  role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
  lisa: { name: 'Lisa', role: 'leiter',      firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
  max:  { name: 'Max',  role: 'chef',        firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
  mia:  { name: 'Mia',  role: 'chef',        firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
  zoe:  { name: 'Zoe',  role: 'chef',        firma: 'fremdfirma',    aktiv: true, studioKeys: ['studio-1'] }
};

(async () => {
  /* ══ Teil A: Regeln ══ */
  const env = await initializeTestEnvironment({
    projectId: 'demo-regeltest',
    firestore: { host: '127.0.0.1', port: 8791,
      rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8') }
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    for (const [uid, p] of Object.entries(LEUTE)) await d.doc('users/' + uid).set(p);
    await d.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });
    await d.doc('firmen/fremdfirma').set({ name: 'Fremd', aktiv: true });
    const antrag = { uid: 'anna', name: 'Anna', studioKey: 'studio-1', tag: '2026-10-20', art: 'gehen',
      uhr: '17:00', ts: 1, grund: 'Ausstempeln vergessen', status: 'offen', erstellt: 1 };
    await d.doc('zeitAntraege/a1').set(antrag);
    await d.doc('firmen/koerperformen/zeitAntraege/a1').set(antrag);
  });
  const als = (uid) => env.authenticatedContext(uid).firestore();
  for (const w of [{ name: 'flach', P: (s) => s }, { name: 'firma', P: (s) => 'firmen/koerperformen/' + s }]) {
    const P = w.P;
    protokoll.push('  ── Welt: ' + w.name + ' ──');
    await darf('Anna liest ihren eigenen Antrag',            als('anna').doc(P('zeitAntraege/a1')).get());
    await darf('Die Geschäftsführung liest ihn',             als('max').doc(P('zeitAntraege/a1')).get());
    await darf('Die Geschäftsführung listet alle',           als('max').collection(P('zeitAntraege')).get());
    await darf('Anna fragt ihre eigenen ab',                 als('anna').collection(P('zeitAntraege')).where('uid', '==', 'anna').get());
    await darfNicht('Ein Kollege liest ihn',                 als('ben').doc(P('zeitAntraege/a1')).get());
    await darfNicht('Die STUDIOLEITUNG liest ihn',           als('lisa').doc(P('zeitAntraege/a1')).get());
    await darfNicht('Ein Kollege listet alle',               als('ben').collection(P('zeitAntraege')).get());
    await darfNicht('Eine fremde Firma liest ihn',           als('zoe').doc(P('zeitAntraege/a1')).get());
    await darfNicht('Ohne Konto',                            env.unauthenticatedContext().firestore().doc(P('zeitAntraege/a1')).get());
    await darfNicht('Anna legt selbst einen an',             als('anna').doc(P('zeitAntraege/neu')).set({ uid: 'anna', status: 'offen' }));
    await darfNicht('Anna setzt ihren auf angenommen',       als('anna').doc(P('zeitAntraege/a1')).update({ status: 'angenommen' }));
    await darfNicht('DIE GESCHÄFTSFÜHRUNG schreibt direkt',  als('max').doc(P('zeitAntraege/a1')).update({ status: 'angenommen' }));
    await darfNicht('Anna löscht ihren Antrag',              als('anna').doc(P('zeitAntraege/a1')).delete());
  }
  await env.cleanup();

  /* ══ Teil B: Funktionen ══ */
  const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
  const fns = require(path.join(__dirname, '..', '..', 'functions', 'index.js'));
  const db = admin.firestore();
  const F = 'firmen/koerperformen/';
  const lauf = (uid) => ({ auth: { uid } });
  for (const [uid, p] of Object.entries(LEUTE)) await db.doc('users/' + uid).set(Object.assign({}, p));
  await db.doc('users/anna').set(Object.assign({}, LEUTE.anna, { studioKeys: ['studio-1', 'studio-3'] }));
  await db.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });
  await db.doc('firmen/fremdfirma').set({ name: 'Fremd', aktiv: true });
  for (const s of ['zeitAntraege', 'zeiten']) {
    const alt = await db.collection(F + s).get();
    for (const d of alt.docs) await d.ref.delete();
  }
  const gestern = tagZurueck(1);
  await db.doc(F + 'zeiten/anna-kommen').set({ uid: 'anna', name: 'Anna', studioKey: 'studio-1',
    art: 'kommen', ts: Date.now() - 86400000, tag: gestern, monat: gestern.slice(0, 7), quelle: 'terminal' });
  const gut = { tag: gestern, uhr: '17:00', art: 'gehen', grund: 'Ausstempeln vergessen, Schicht bis 17 Uhr' };

  await scheitert('ohne Grund → abgewiesen', fns.zeitAntragStellen.run(Object.assign({}, gut, { grund: '' }), lauf('anna')), /Grund/);
  await scheitert('in der Zukunft → abgewiesen', fns.zeitAntragStellen.run(Object.assign({}, gut, { tag: tagZurueck(-2) }), lauf('anna')), /Zukunft/);
  await scheitert('vor 40 Tagen → abgewiesen (31 Tage wie Crewmeister)', fns.zeitAntragStellen.run(Object.assign({}, gut, { tag: tagZurueck(40) }), lauf('anna')), /31 Tage/);
  await scheitert('unbekannte Art → abgewiesen', fns.zeitAntragStellen.run(Object.assign({}, gut, { art: 'urlaub' }), lauf('anna')), /Art/);
  const r1 = await fns.zeitAntragStellen.run(Object.assign({}, gut, { studioKey: 'studio-9' }), lauf('anna'));
  const a1 = (await db.doc(F + 'zeitAntraege/' + r1.id).get()).data();
  pruefe('Anna stellt einen Antrag: offen, in der Firma, mit Grund', a1 && a1.status === 'offen' && a1.uid === 'anna' && /vergessen/.test(a1.grund), JSON.stringify(a1));
  pruefe('… ein fremdes Studio (studio-9) wird durch ihr eigenes ersetzt', a1 && a1.studioKey === 'studio-1', a1 && a1.studioKey);
  pruefe('… und es entsteht noch KEIN Stempel', (await db.collection(F + 'zeiten').where('uid', '==', 'anna').get()).size === 1);
  const r1b = await fns.zeitAntragStellen.run(gut, lauf('anna'));
  pruefe('derselbe Antrag zweimal → einer', r1b.schonDa === true && r1b.id === r1.id, JSON.stringify(r1b));

  await scheitert('die Studioleitung entscheidet → abgewiesen', fns.zeitAntragEntscheiden.run({ id: r1.id, annehmen: true }, lauf('lisa')), /Geschäftsführung/);
  await scheitert('ein Kollege entscheidet → abgewiesen', fns.zeitAntragEntscheiden.run({ id: r1.id, annehmen: true }, lauf('ben')), /Geschäftsführung/);
  await scheitert('eine fremde Firma entscheidet → abgewiesen', fns.zeitAntragEntscheiden.run({ id: r1.id, annehmen: true }, lauf('zoe')), /gibt es nicht/);
  await scheitert('Ablehnen ohne Antwort → abgewiesen', fns.zeitAntragEntscheiden.run({ id: r1.id, annehmen: false }, lauf('max')), /warum/);

  const e1 = await fns.zeitAntragEntscheiden.run({ id: r1.id, annehmen: true }, lauf('max'));
  const a1n = (await db.doc(F + 'zeitAntraege/' + r1.id).get()).data();
  const neu = e1.zeitId ? (await db.doc(F + 'zeiten/' + e1.zeitId).get()).data() : null;
  pruefe('die Geschäftsführung nimmt an → Antrag „angenommen", wer und wann', a1n.status === 'angenommen' && a1n.entschiedenVon === 'max' && a1n.entschiedenAm > 0 && a1n.zeitId === e1.zeitId, JSON.stringify(a1n));
  pruefe('… GENAU EIN neuer Stempel: gehen, quelle korrektur, antragId, Grund', !!neu && neu.art === 'gehen' && neu.quelle === 'korrektur' && neu.antragId === r1.id && /^Antrag: /.test(neu.grund) && neu.korrigiertVon === 'max', JSON.stringify(neu));
  const uhr = neu ? new Date(neu.ts).toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }) : '';
  pruefe('… um 17:00 Berliner Zeit, mit monat', uhr === '17:00' && neu.monat === gestern.slice(0, 7), uhr);
  const alt = (await db.doc(F + 'zeiten/anna-kommen').get()).data();
  pruefe('… der Urbestand ist unverändert', alt.art === 'kommen' && alt.quelle === 'terminal' && !alt.storno);
  await scheitert('ein zweites Annehmen → abgewiesen', fns.zeitAntragEntscheiden.run({ id: r1.id, annehmen: true }, lauf('mia')), /schon entschieden/);
  pruefe('… und es bleibt bei zwei Stempeln von Anna', (await db.collection(F + 'zeiten').where('uid', '==', 'anna').get()).size === 2);

  const r2 = await fns.zeitAntragStellen.run(Object.assign({}, gut, { uhr: '16:00', art: 'pause' }), lauf('anna'));
  await fns.zeitAntragEntscheiden.run({ id: r2.id, annehmen: false, antwort: 'Laut Plan keine Pause an dem Tag' }, lauf('max'));
  const a2 = (await db.doc(F + 'zeitAntraege/' + r2.id).get()).data();
  pruefe('abgelehnt → Status, Antwort, kein Stempel', a2.status === 'abgelehnt' && /Plan/.test(a2.antwort) &&
    (await db.collection(F + 'zeiten').where('uid', '==', 'anna').get()).size === 2, JSON.stringify(a2));

  const r3 = await fns.zeitAntragStellen.run(Object.assign({}, gut, { uhr: '08:00', art: 'kommen', studioKey: 'studio-3' }), lauf('anna'));
  const a3 = (await db.doc(F + 'zeitAntraege/' + r3.id).get()).data();
  pruefe('ein zweites eigenes Studio (studio-3) bleibt erhalten', a3.studioKey === 'studio-3', a3.studioKey);
  await scheitert('Ben zieht Annas Antrag zurück → abgewiesen', fns.zeitAntragZurueckziehen.run({ id: r3.id }, lauf('ben')), /gibt es nicht/);
  await fns.zeitAntragZurueckziehen.run({ id: r3.id }, lauf('anna'));
  pruefe('Anna zieht ihn zurück → bleibt mit Status stehen', (await db.doc(F + 'zeitAntraege/' + r3.id).get()).data().status === 'zurueckgezogen');
  await scheitert('ein zurückgezogener lässt sich nicht annehmen', fns.zeitAntragEntscheiden.run({ id: r3.id, annehmen: true }, lauf('max')), /schon entschieden/);

  const r4 = await fns.zeitAntragStellen.run(Object.assign({}, gut, { uhr: '09:00', art: 'kommen' }), lauf('max'));
  await scheitert('die Geschäftsführung nimmt ihren EIGENEN Antrag an → abgewiesen', fns.zeitAntragEntscheiden.run({ id: r4.id, annehmen: true }, lauf('max')), /eigenen Antrag/);
  const e4 = await fns.zeitAntragEntscheiden.run({ id: r4.id, annehmen: true }, lauf('mia'));
  pruefe('(Gegenprobe) jemand anderes aus der Geschäftsführung schon', e4.status === 'angenommen');

  console.log('\n══ Korrekturanträge ══');
  protokoll.forEach((z) => console.log(z));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  if (gefallen) { console.log('\n✗ Korrekturanträge sind nicht dicht.'); process.exit(1); }
  console.log('\n✓ Korrekturanträge: die Person beantragt, nur die Geschäftsführung entscheidet, nichts wird überschrieben — ' + bestanden + ' Zusicherungen');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
