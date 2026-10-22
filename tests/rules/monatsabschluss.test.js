/* ── Monatsabschluss (Runde 208) ───────────────────────────────────────
   Aus dem Betrieb, 22.10.2026: Export und Abschluss — „mach beides".

   Teil A — Regeln, beide Welten: `zeitAbschluesse` liest NUR die
   Geschäftsführung (darin stehen alle Konten nebeneinander); schreiben
   niemand aus dem Browser.
   Teil B — Funktionen, ausgeführt:
     · abschliessen: nur die Geschäftsführung, nur ein VERGANGENER Monat,
       nicht zweimal; Zahlen werden geprüft
     · danach gesperrt: Nachtragen, Stornieren, Antrag stellen und Antrag
       annehmen in diesem Monat → abgewiesen; Ablehnen geht (ändert keine
       Stunden)
     · öffnen: nur die Geschäftsführung, nur mit Grund; danach geht
       Nachtragen wieder, und der Verlauf hält beides fest
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
    const ab = { monat: '2026-09', abgeschlossen: true, zeilen: [{ uid: 'anna', konto: 120 }] };
    await d.doc('zeitAbschluesse/2026-09').set(ab);
    await d.doc('firmen/koerperformen/zeitAbschluesse/2026-09').set(ab);
  });
  const als = (uid) => env.authenticatedContext(uid).firestore();
  for (const w of [{ name: 'flach', P: (s) => s }, { name: 'firma', P: (s) => 'firmen/koerperformen/' + s }]) {
    const P = w.P;
    protokoll.push('  ── Welt: ' + w.name + ' ──');
    await darf('Die Geschäftsführung liest den Abschluss',   als('max').doc(P('zeitAbschluesse/2026-09')).get());
    await darf('Die Geschäftsführung listet alle',           als('max').collection(P('zeitAbschluesse')).get());
    await darfNicht('Die Studioleitung liest ihn',           als('lisa').doc(P('zeitAbschluesse/2026-09')).get());
    await darfNicht('Anna liest ihn (auch nicht ihre Zeile)', als('anna').doc(P('zeitAbschluesse/2026-09')).get());
    await darfNicht('Eine fremde Firma liest ihn',           als('zoe').doc(P('zeitAbschluesse/2026-09')).get());
    await darfNicht('DIE GESCHÄFTSFÜHRUNG schreibt direkt',  als('max').doc(P('zeitAbschluesse/2026-09')).update({ abgeschlossen: false }));
    await darfNicht('Die Geschäftsführung legt einen an',    als('max').doc(P('zeitAbschluesse/2026-08')).set({ monat: '2026-08', abgeschlossen: true }));
  }
  await env.cleanup();

  const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
  const fns = require(path.join(__dirname, '..', '..', 'functions', 'index.js'));
  const db = admin.firestore();
  const F = 'firmen/koerperformen/';
  const lauf = (uid) => ({ auth: { uid } });
  for (const [uid, p] of Object.entries(LEUTE)) await db.doc('users/' + uid).set(Object.assign({}, p));
  await db.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });
  for (const s of ['zeitAbschluesse', 'zeitAntraege', 'zeiten']) {
    const alt = await db.collection(F + s).get();
    for (const d of alt.docs) await d.ref.delete();
  }
  /* Der LETZTE Tag des Vormonats: er liegt höchstens 31 Tage zurück, also
     reichen Nachtragen (62 Tage) und Antrag (31 Tage) beide hinein. Meine
     erste Fassung nahm den 5. — am 22.10. sind das 47 Tage, und der
     Antrag scheiterte an der 31-Tage-Grenze statt am Abschluss. */
  const jetzt = new Date();
  const vm = new Date(jetzt.getFullYear(), jetzt.getMonth(), 0);
  const tag = vm.toLocaleDateString('sv-SE');
  const monat = tag.slice(0, 7);
  const laufend = jetzt.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' }).slice(0, 7);
  await db.doc(F + 'zeiten/anna-k').set({ uid: 'anna', name: 'Anna', studioKey: 'studio-1', art: 'kommen',
    ts: vm.getTime() + 9 * 3600000, tag, monat, quelle: 'terminal' });
  const zeile = { uid: 'anna', name: 'Anna', ist: 480, soll: 600, gutschrift: 0, saldo: -120, uebertrag: 0, konto: -120, tage: 1, offen: 1 };

  await scheitert('die Studioleitung schliesst ab → abgewiesen', fns.monatAbschliessen.run({ monat, zeilen: [zeile] }, lauf('lisa')), /Geschäftsführung/);
  await scheitert('den laufenden Monat → abgewiesen', fns.monatAbschliessen.run({ monat: laufend, zeilen: [zeile] }, lauf('max')), /vorbei/);
  await scheitert('Unsinn als Zahl → abgewiesen', fns.monatAbschliessen.run({ monat, zeilen: [Object.assign({}, zeile, { ist: 'viel' })] }, lauf('max')), /Zahl/);
  await scheitert('ohne Personen → abgewiesen', fns.monatAbschliessen.run({ monat, zeilen: [] }, lauf('max')), /keine Personen/);
  const r = await fns.monatAbschliessen.run({ monat, zeilen: [zeile] }, lauf('max'));
  const ab = (await db.doc(F + 'zeitAbschluesse/' + monat).get()).data();
  pruefe('die Geschäftsführung schliesst den Vormonat ab', r.ok && ab.abgeschlossen === true && ab.zeilen[0].konto === -120 && ab.von === 'max', JSON.stringify(ab));
  await scheitert('zweimal abschliessen → abgewiesen', fns.monatAbschliessen.run({ monat, zeilen: [zeile] }, lauf('mia')), /schon abgeschlossen/);

  await scheitert('GESPERRT: Nachtragen im abgeschlossenen Monat', fns.zeitNachtragen.run({ uid: 'anna', tag, uhr: '17:00', art: 'gehen',
    studioKey: 'studio-1', grund: 'Ausstempeln vergessen' }, lauf('lisa')), /abgeschlossen/);
  await scheitert('GESPERRT: Stornieren im abgeschlossenen Monat', fns.zeitStornieren.run({ id: 'anna-k', grund: 'Doppelt gestempelt' }, lauf('max')), /abgeschlossen/);
  await scheitert('GESPERRT: Antrag für den abgeschlossenen Monat', fns.zeitAntragStellen.run({ tag, uhr: '17:00', art: 'gehen',
    grund: 'Feierabend vergessen' }, lauf('anna')), /abgeschlossen/);
  /* Ein Antrag, der VOR dem Abschluss gestellt wurde: */
  await db.doc(F + 'zeitAntraege/vorher').set({ uid: 'anna', name: 'Anna', studioKey: 'studio-1', tag, monat, art: 'gehen',
    uhr: '17:00', ts: vm.getTime() + 17 * 3600000, grund: 'Feierabend vergessen', status: 'offen', erstellt: 1 });
  await scheitert('GESPERRT: einen älteren Antrag ANNEHMEN', fns.zeitAntragEntscheiden.run({ id: 'vorher', annehmen: true }, lauf('max')), /abgeschlossen/);
  pruefe('… es entstand kein Stempel', (await db.collection(F + 'zeiten').where('uid', '==', 'anna').get()).size === 1);
  pruefe('… und kein Storno', !(await db.doc(F + 'zeiten/anna-k').get()).data().storno);

  await scheitert('öffnen durch die Studioleitung → abgewiesen', fns.monatOeffnen.run({ monat, grund: 'Nachtrag nötig' }, lauf('lisa')), /Geschäftsführung/);
  await scheitert('öffnen ohne Grund → abgewiesen', fns.monatOeffnen.run({ monat, grund: '' }, lauf('max')), /Grund/);
  await fns.monatOeffnen.run({ monat, grund: 'Feierabend von Anna fehlt noch' }, lauf('max'));
  const ab2 = (await db.doc(F + 'zeitAbschluesse/' + monat).get()).data();
  pruefe('geöffnet: abgeschlossen=false, die alten Zahlen bleiben, der Verlauf hält beides', ab2.abgeschlossen === false && ab2.zeilen.length === 1 &&
    ab2.verlauf.length === 2 && ab2.verlauf[1].art === 'geoeffnet' && /Anna/.test(ab2.verlauf[1].grund), JSON.stringify(ab2.verlauf));
  const n = await fns.zeitNachtragen.run({ uid: 'anna', tag, uhr: '17:00', art: 'gehen', studioKey: 'studio-1', grund: 'Ausstempeln vergessen' }, lauf('lisa'));
  pruefe('(Gegenprobe) nach dem Öffnen geht Nachtragen wieder', !!(n && n.ok));
  const r2 = await fns.monatAbschliessen.run({ monat, zeilen: [Object.assign({}, zeile, { ist: 960, saldo: 360, konto: 360, offen: 0 })] }, lauf('mia'));
  const ab3 = (await db.doc(F + 'zeitAbschluesse/' + monat).get()).data();
  pruefe('wieder abgeschlossen: die neuen Zahlen gelten', r2.ok && ab3.abgeschlossen === true && ab3.zeilen[0].konto === 360 && ab3.verlauf.length === 3);

  /* Aufräumen: dieselben Namen (anna, max …) benutzen andere Regeltests
     im selben Emulator — liegen hier gebliebene Stempel, zählen die
     dort falsch. */
  for (const s of ['zeitAbschluesse', 'zeitAntraege', 'zeiten']) {
    const rest = await db.collection(F + s).get();
    for (const d of rest.docs) await d.ref.delete();
  }
  console.log('\n══ Monatsabschluss ══');
  protokoll.forEach((z) => console.log(z));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  if (gefallen) { console.log('\n✗ Der Monatsabschluss ist nicht dicht.'); process.exit(1); }
  console.log('\n✓ Monatsabschluss: nur die Geschäftsführung, nur vergangene Monate, danach gesperrt, öffnen nur mit Grund — ' + bestanden + ' Zusicherungen');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
