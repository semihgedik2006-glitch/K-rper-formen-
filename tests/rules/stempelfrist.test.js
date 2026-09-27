/* ── Stempelzeiten: Löschfrist drei Jahre (Runde 127, P-08) ───────────

   Aus dem Betrieb, 27.9.2026: „3 Jahre". Die Funktionen laufen hier
   WIRKLICH gegen den Firestore-Emulator:
   1. stempelFristStand (nur Geschäftsführung) zeigt vorher, was die
      Frist trifft: ältester Tag, heute fällig, in 30 Tagen fällig —
      nur Zahlen, keine Namen, nur die eigene Firma.
   2. stempelzeitenAblaufen löscht genau, was älter als drei Jahre ist —
      in jeder Firma und auf den flachen Pfaden. GEGENPROBE: der Stempel
      von GENAU vor drei Jahren und alles Jüngere bleiben, auch
      Korrekturen, auch eine andere Firma mit jungen Daten.
   3. Die Grenze rechnet in Berliner Tagen.
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
const tagVor = (jahre, tage) => {
  const d = new Date(fns.__intern.berlinDatum(Date.now()) + 'T12:00:00Z');
  d.setUTCFullYear(d.getUTCFullYear() - jahre);
  d.setUTCDate(d.getUTCDate() - (tage || 0));
  return d.toISOString().slice(0, 10);
};

(async () => {
  const leer = await fetch('http://' + process.env.FIRESTORE_EMULATOR_HOST +
    '/emulator/v1/projects/demo-funktionen/databases/(default)/documents', { method: 'DELETE' });
  if (!leer.ok) throw new Error('Emulator nicht geleert');

  await db.doc('firmen/sfalpha').set({ name: 'Alpha', aktiv: true });
  await db.doc('firmen/sfbeta').set({ name: 'Beta', aktiv: true });
  await db.doc('users/sfChef').set({ name: 'Chef', role: 'chef', firma: 'sfalpha', aktiv: true });
  await db.doc('users/sfLeiter').set({ name: 'Leitung', role: 'leiter', firma: 'sfalpha', aktiv: true });
  await db.doc('users/sfChefB').set({ name: 'Chef B', role: 'chef', firma: 'sfbeta', aktiv: true });

  const grenz = fns.__intern.stempelGrenzTag();
  pruefe('3. die Grenze ist heute vor drei Jahren (Berliner Tag): ' + grenz, grenz === tagVor(3, 0), tagVor(3, 0));

  const zeilen = [
    ['alt1', tagVor(3, 10), 'kommen'],         // weg
    ['alt2', tagVor(4, 0), 'feierabend'],      // weg
    ['altKorr', tagVor(3, 1), 'kommen', true], // weg (Korrektur)
    ['genau', tagVor(3, 0), 'kommen'],         // bleibt: nicht ÄLTER als drei Jahre
    ['bald', tagVor(3, -10), 'pause'],         // bleibt, aber in 30 Tagen fällig
    ['jung', tagVor(0, 3), 'kommen'],          // bleibt
  ];
  for (const [id, tag, art, korr] of zeilen) {
    const d = { uid: 'mit1', name: 'Mitarbeiterin', studioKey: 'studio-1', art, tag, monat: tag.slice(0, 7), ts: Date.parse(tag + 'T08:00:00Z') };
    if (korr) Object.assign(d, { korrektur: true, grund: 'vergessen' });
    await db.doc('firmen/sfalpha/zeiten/' + id).set(d);
  }
  await db.doc('firmen/sfbeta/zeiten/b1').set({ uid: 'x', tag: tagVor(0, 1), art: 'kommen', ts: Date.now() });
  await db.doc('firmen/sfbeta/zeiten/b2').set({ uid: 'x', tag: tagVor(5, 0), art: 'kommen', ts: 1 });
  await db.doc('zeiten/flach1').set({ uid: 'y', tag: tagVor(3, 30), art: 'kommen', ts: 1 });

  // ── 1. Vorher sehen, was es trifft ──
  await scheitert('1. die Studioleitung sieht den Stand NICHT', fns.stempelFristStand.run({}, als('sfLeiter')), /Geschäftsführung/);
  const st = await fns.stempelFristStand.run({}, als('sfChef'));
  /* In 30 Tagen fällig: die drei von heute, dazu „genau" (morgen dran)
     und „bald" (in zehn Tagen) — fünf. Zuerst stand hier 4: „genau"
     vergessen, der Fehler lag in der Erwartung, nicht im Code. */
  pruefe('1. Stand: drei Jahre, ältester Tag, heute 3 fällig, in 30 Tagen 5', st.jahre === 3 && st.aeltester === tagVor(4, 0) && st.faellig === 3 && st.in30Tagen === 5, JSON.stringify(st));
  pruefe('1. nur Zahlen und Tage — keine Namen, keine Kennungen', !/Mitarbeiterin|mit1/.test(JSON.stringify(st)), JSON.stringify(st));
  const stB = await fns.stempelFristStand.run({}, als('sfChefB'));
  pruefe('1. nur die eigene Firma: Beta sieht 1 fälligen', stB.faellig === 1 && stB.aeltester === tagVor(5, 0), JSON.stringify(stB));

  // ── 2. Der nächtliche Lauf ──
  await fns.stempelzeitenAblaufen.run({});
  const da = async (p) => (await db.doc(p).get()).exists;
  pruefe('2. älter als drei Jahre: gelöscht (auch die Korrektur)', !(await da('firmen/sfalpha/zeiten/alt1')) && !(await da('firmen/sfalpha/zeiten/alt2')) && !(await da('firmen/sfalpha/zeiten/altKorr')));
  pruefe('2. GEGENPROBE genau drei Jahre: bleibt', await da('firmen/sfalpha/zeiten/genau'));
  pruefe('2. GEGENPROBE Jüngeres bleibt', await da('firmen/sfalpha/zeiten/bald') && await da('firmen/sfalpha/zeiten/jung'));
  pruefe('2. in der anderen Firma: das Alte weg, das Junge da', !(await da('firmen/sfbeta/zeiten/b2')) && await da('firmen/sfbeta/zeiten/b1'));
  pruefe('2. auf den flachen Pfaden ebenso', !(await da('zeiten/flach1')));
  const st2 = await fns.stempelFristStand.run({}, als('sfChef'));
  pruefe('danach: nichts mehr fällig, ältester Tag ist genau drei Jahre alt', st2.faellig === 0 && st2.aeltester === tagVor(3, 0), JSON.stringify(st2));

  console.log('\nStempelzeiten: Löschfrist (Runde 127)\n' + protokoll.join('\n'));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
