/* ── Stempeln ohne Netz (Runde 139) ──────────────────────────────────
   Aus dem Betrieb, 4.10.2026: „man weiss ja nie, wo und wann es
   ausfällt" — und auf die Frage, ob das Terminal dann mit Vermerk
   trotzdem stempeln darf: „doch".

   stempeln wird hier AUSGEFÜHRT, gegen den Emulator. Geprüft wird:
     1. Ein nachgeschickter Stempel bekommt die Uhrzeit des Geräts, den
        Vermerk ohneNetz und den Zeitpunkt, an dem er ankam.
     2. Derselbe Stempel zweimal (Antwort verloren) → einmal gespeichert.
     3. Der Schritt richtet sich nach dem letzten Stempel VOR diesem
        Zeitpunkt, nicht nach einem späteren.
     4. Zu alt (über 12 Stunden), in der Zukunft → abgewiesen, mit dem
        Hinweis auf die Leitung.
     5. Die PIN gilt auch nachträglich: falsche PIN → abgewiesen, und es
        zählt als Fehlversuch.
     6. Gegenprobe: ein normaler Stempel hat keinen Vermerk.
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
  await db.doc('users/tablet').set({ name: 'Empfang', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] });
  await db.doc('users/olga').set({ name: 'Olga', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] });
  await db.doc(F + 'terminals/t-off').set({ name: 'Empfang', studioKey: 'studio-1', hash: I.geheimHashen('geheim-1') });
  await db.doc(F + 'zeitPins/olga').set({ salz: 'sz', hash: I.pinHashen('4711', 'sz'), fehlversuche: 0 });
  const alte = await db.collection(F + 'zeiten').where('uid', '==', 'olga').get();
  for (const d of alte.docs) await d.ref.delete();
  const basis = { terminalId: 't-off', geheim: 'geheim-1', uid: 'olga', pin: '4711' };
  const jetzt = Date.now();
  const vor = (min) => jetzt - min * 60000;
  /* Damit alle Stempel auf denselben Berliner Tag fallen, auch kurz nach
     Mitternacht: ist es vor 2:30 Uhr, wird mit wenigen Minuten gerechnet. */
  const berlinStunde = +new Date(jetzt).toLocaleString('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', hour12: false });
  const M = berlinStunde < 3 ? 1 : 30;

  const r1 = await fns.stempeln.run(Object.assign({}, basis, { offlineTs: vor(4 * M), offlineId: 'o-1' }), als('tablet'));
  const z1 = (await db.collection(F + 'zeiten').where('uid', '==', 'olga').get()).docs.map((d) => d.data());
  pruefe('ohne Netz gemerkt, nachgeschickt: gespeichert', z1.length === 1 && r1.ok && r1.ohneNetz === true, JSON.stringify(r1));
  pruefe('… mit der Uhrzeit des Geräts, nicht der Ankunft', z1[0] && z1[0].ts === vor(4 * M), z1[0] && (z1[0].ts + ' / ' + vor(4 * M)));
  pruefe('… mit Vermerk ohneNetz und wann er ankam', z1[0] && z1[0].ohneNetz === true && Math.abs(z1[0].empfangen - Date.now()) < 60000, JSON.stringify(z1[0]));
  pruefe('… als „kommen" (erster Stempel des Tages)', z1[0] && z1[0].art === 'kommen');

  const r1b = await fns.stempeln.run(Object.assign({}, basis, { offlineTs: vor(4 * M), offlineId: 'o-1' }), als('tablet'));
  const z1b = (await db.collection(F + 'zeiten').where('uid', '==', 'olga').get()).size;
  pruefe('derselbe Stempel zweimal (Antwort verloren) → einmal gespeichert', z1b === 1 && r1b.schonDa === true, z1b + ' / ' + JSON.stringify(r1b));

  // ein normaler Stempel jetzt
  const r2 = await fns.stempeln.run(Object.assign({}, basis), als('tablet'));
  const normal = (await db.collection(F + 'zeiten').where('uid', '==', 'olga').get()).docs.map((d) => d.data()).find((z) => !z.ohneNetz);
  pruefe('GEGENPROBE ein normaler Stempel hat keinen Vermerk', !!normal && !('ohneNetz' in normal) && !('offlineId' in normal) && r2.ohneNetz === false, JSON.stringify(normal));
  pruefe('… und folgt auf „kommen" mit „pause"', r2.art === 'pause', r2.art);

  // ein später ankommender, früher erfasster Stempel richtet sich nach dem Stand VOR seiner Zeit
  const r3 = await fns.stempeln.run(Object.assign({}, basis, { offlineTs: vor(2 * M), offlineId: 'o-2' }), als('tablet'));
  pruefe('nachgeschickt zwischen „kommen" und „pause": Schritt nach dem Stand davor („pause" auf „kommen")', r3.art === 'pause', r3.art);

  await scheitert('älter als 12 Stunden → abgewiesen, Hinweis auf die Leitung',
    fns.stempeln.run(Object.assign({}, basis, { offlineTs: jetzt - 13 * 3600000, offlineId: 'o-3' }), als('tablet')), /älter als 12 Stunden.*Leitung/);
  await scheitert('in der Zukunft (Uhr des Geräts vorgestellt) → abgewiesen',
    fns.stempeln.run(Object.assign({}, basis, { offlineTs: jetzt + 10 * 60000, offlineId: 'o-4' }), als('tablet')), /Zukunft/);
  await scheitert('keine Zahl → abgewiesen',
    fns.stempeln.run(Object.assign({}, basis, { offlineTs: 'gestern', offlineId: 'o-5' }), als('tablet')), /stimmt nicht/);
  await scheitert('falsche PIN, auch nachträglich → abgewiesen',
    fns.stempeln.run(Object.assign({}, basis, { pin: '0000', offlineTs: vor(M), offlineId: 'o-6' }), als('tablet')), /Falsche PIN/);
  const pin = (await db.doc(F + 'zeitPins/olga').get()).data();
  pruefe('… und es zählt als Fehlversuch', pin.fehlversuche === 1, JSON.stringify(pin.fehlversuche));
  const zahl = (await db.collection(F + 'zeiten').where('uid', '==', 'olga').get()).size;
  pruefe('von den abgewiesenen ist keiner gespeichert', zahl === 3, String(zahl));

  /* Runde 141: der Stempel kam an, nur die Antwort ging verloren — das
     Terminal schickt ihn als „ohne Netz" nach. Er darf nicht doppelt
     dastehen. */
  await db.doc('users/olaf').set({ name: 'Olaf', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] });
  await db.doc(F + 'zeitPins/olaf').set({ salz: 'sz2', hash: I.pinHashen('8642', 'sz2'), fehlversuche: 0 });
  for (const d of (await db.collection(F + 'zeiten').where('uid', '==', 'olaf').get()).docs) await d.ref.delete();
  const ol = Object.assign({}, basis, { uid: 'olaf', pin: '8642' });
  const echt = await fns.stempeln.run(ol, als('tablet'));
  const nach = await fns.stempeln.run(Object.assign({}, ol, { offlineTs: echt.ts + 3000, offlineId: 'o-verloren' }), als('tablet'));
  const zo = (await db.collection(F + 'zeiten').where('uid', '==', 'olaf').get()).size;
  pruefe('Antwort verloren, als „ohne Netz" nachgeschickt → kein zweiter Stempel', zo === 1 && nach.schonDa === true, zo + ' / ' + JSON.stringify(nach));
  /* GEGENPROBE: liegt der vorige Stempel mehr als zwei Minuten zurück,
     ist der nachgeschickte ein eigener. */
  const vorhin = Date.now() - 5 * 60000;
  const ref = (await db.collection(F + 'zeiten').where('uid', '==', 'olaf').get()).docs[0].ref;
  await ref.update({ ts: vorhin });
  const eigen = await fns.stempeln.run(Object.assign({}, ol, { offlineTs: Date.now() - 1000, offlineId: 'o-eigen' }), als('tablet'));
  const zo2 = (await db.collection(F + 'zeiten').where('uid', '==', 'olaf').get()).size;
  pruefe('GEGENPROBE: liegt der vorige Stempel 5 Minuten zurück, ist der nachgeschickte ein eigener', zo2 === 2 && !eigen.schonDa, zo2 + ' / ' + JSON.stringify(eigen));

  pruefe('offlineZeitPruefen: 11:59 Stunden alt geht', I.offlineZeitPruefen(jetzt - (12 * 60 - 1) * 60000, jetzt) === jetzt - (12 * 60 - 1) * 60000);

  console.log('\n── Stempeln ohne Netz ──');
  protokoll.forEach((z) => console.log(z));
  console.log('\n' + (gefallen
    ? '✗ ' + gefallen + ' Fehler, ' + bestanden + ' in Ordnung'
    : '✓ Ohne Netz: mit Gerätezeit und Vermerk, einmal, PIN geprüft, höchstens 12 Stunden — ' + bestanden + ' Zusicherungen'));
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
