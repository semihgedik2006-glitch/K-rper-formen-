/* ── SCHWARZES BRETT: DIE STUDIOGRENZE BEIM LESEN (Runde 121) ────────
   Aus dem Betrieb, 25.9.2026 — die Reihenfolge der nächsten Schritte:
   „… dann die Anliegen am rechner, dann die studiogrenze …" (Vorschlag
   dazu: „so wie jetzt bei den Dokumenten"; dort hiess es „JA aber man
   kann selber entscheiden ob alle oder nur studio").

   Ein Aushang trägt `studios`: 'all' oder eine Liste. OHNE Feld (vor
   Runde 121) liest ihn nur der Chef, bis er nachgezogen ist.

   Geprüft, in BEIDEN Welten (flach und firmen/<kennung>/):
     · einzeln: für alle / eigenes Studio → geht; fremdes Studio und
       alter ohne Feld (vor dem Nachziehen) → geht nicht
     · die Abfragen der App (== 'all', array-contains-any [meine]) → gehen;
       die alte, ungefilterte Abfrage als Mitarbeiter → geht nicht
     · Chef: alles, auch ungefiltert
     · Aushängen: für alle oder das eigene Studio → geht; für ein fremdes
       Studio → geht nicht (der Chef darf jedes)
     · Reagieren an einem Aushang, den man nicht sehen darf → geht nicht
     · Übergang: Chef setzt bei einem Aushang OHNE Feld 'all' → geht;
       auf eine Liste → geht nicht; ein Mitarbeiter → geht nicht
   Dazu brettNachziehenFirma (Server) gegen den Emulator.
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
function pruefe(name, ok, zusatz) {
  if (ok) { bestanden++; protokoll.push('  ✓ ' + name); }
  else { gefallen++; protokoll.push('  ✗ ' + name + (zusatz ? ' — ' + zusatz : '')); }
}

const POSTS = {
  alle:  { uid: 'x', name: 'X', text: 'Teamabend', studios: 'all', ts: 3 },
  eigen: { uid: 'x', name: 'X', text: 'Nur Brühl', studios: ['studio-1'], ts: 2 },
  fremd: { uid: 'x', name: 'X', text: 'Nur Hürth', studios: ['studio-2'], ts: 1 },
  alt:   { uid: 'x', name: 'X', text: 'Von vor Runde 121', ts: 0 },
};

(async () => {
  const env = await initializeTestEnvironment({
    projectId: 'demo-regeltest',
    firestore: { host: '127.0.0.1', port: 8791,
      rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8') }
  });
  /* Leeren mit Wiederholung: nach den vielen Daten der Dateien davor
     brach clearFirestore in der Kette einmal mit „call already cancelled"
     ab (wie recursiveDelete in Runde 117). Ein zweiter Anlauf geht. */
  for (let v = 1; ; v++) {
    try { await env.clearFirestore(); break; }
    catch (e) { if (v >= 3) throw e; await new Promise((r) => setTimeout(r, 1000 * v)); }
  }
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc('firmen/eins').set({ name: 'Betrieb eins', aktiv: true });
    for (const [id, d] of Object.entries(POSTS)) {
      await db.doc('firmen/eins/board/' + id).set(d);
      await db.doc('board/' + id).set(d);
    }
    await db.doc('users/ma').set({ name: 'Mara', role: 'mitarbeiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/chef').set({ name: 'Max', role: 'chef', firma: 'eins', aktiv: true, studioKeys: [] });
    await db.doc('users/alt').set({ name: 'Alt', role: 'mitarbeiter', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/altchef').set({ name: 'Altchef', role: 'chef', aktiv: true, studioKeys: [] });
  });
  const als = (uid) => env.authenticatedContext(uid).firestore();

  for (const [welt, ma, chef, p] of [['firmen/eins', 'ma', 'chef', 'firmen/eins/'], ['flach', 'alt', 'altchef', '']]) {
    protokoll.push('\n  ── ' + welt + ': einzelne Aushänge ──');
    await darf('Mitarbeiter liest einen für ALLE', als(ma).doc(p + 'board/alle').get());
    await darf('… einen für SEIN Studio', als(ma).doc(p + 'board/eigen').get());
    /* Ein alter Aushang ohne Feld: erst nach dem Nachziehen. Mit einer
       Vorgabe in der Regel (get(…,'all')) wäre er sofort lesbar gewesen —
       und die ungefilterte Abfrage auch. Siehe firestore.rules. */
    await darfNicht('… einen alten OHNE Feld erst nach dem Nachziehen', als(ma).doc(p + 'board/alt').get());
    await darfNicht('… aber NICHT einen für ein FREMDES Studio', als(ma).doc(p + 'board/fremd').get());
    await darf('Chef liest den für das fremde Studio', als(chef).doc(p + 'board/fremd').get());

    protokoll.push('\n  ── ' + welt + ': die Abfragen der App ──');
    await darf('Mitarbeiter: studios == "all"', als(ma).collection(p + 'board').where('studios', '==', 'all').get());
    await darf('Mitarbeiter: array-contains-any [sein Studio]', als(ma).collection(p + 'board').where('studios', 'array-contains-any', ['studio-1']).get());
    await darfNicht('Mitarbeiter: array-contains-any mit einem FREMDEN Studio', als(ma).collection(p + 'board').where('studios', 'array-contains-any', ['studio-2']).get());
    await darfNicht('Mitarbeiter: die alte, ungefilterte Abfrage', als(ma).collection(p + 'board').orderBy('ts', 'desc').limit(12).get());
    await darf('Chef: ungefiltert, wie bisher', als(chef).collection(p + 'board').orderBy('ts', 'desc').limit(12).get());

    protokoll.push('\n  ── ' + welt + ': aushängen ──');
    await darf('Mitarbeiter hängt für alle aus', als(ma).collection(p + 'board').add({ uid: ma, name: 'M', text: 'a', ts: 9, studios: 'all' }));
    await darf('Mitarbeiter hängt für SEIN Studio aus', als(ma).collection(p + 'board').add({ uid: ma, name: 'M', text: 'b', ts: 9, studios: ['studio-1'] }));
    await darfNicht('Mitarbeiter hängt für ein FREMDES Studio aus', als(ma).collection(p + 'board').add({ uid: ma, name: 'M', text: 'c', ts: 9, studios: ['studio-2'] }));
    await darfNicht('… oder für eine leere Liste', als(ma).collection(p + 'board').add({ uid: ma, name: 'M', text: 'd', ts: 9, studios: [] }));
    await darf('Chef hängt für jedes Studio aus', als(chef).collection(p + 'board').add({ uid: chef, name: 'C', text: 'e', ts: 9, studios: ['studio-2'] }));

    protokoll.push('\n  ── ' + welt + ': reagieren und Übergang ──');
    await darfNicht('Mitarbeiter reagiert NICHT an einem Aushang, den er nicht sehen darf',
      als(ma).doc(p + 'board/fremd').update({ ['reactions.👍']: [ma] }));
    await darfNicht('Mitarbeiter setzt das Feld am alten Aushang NICHT', als(ma).doc(p + 'board/alt').update({ studios: 'all' }));
    await darfNicht('Chef setzt am alten Aushang NICHT eine Liste', als(chef).doc(p + 'board/alt').update({ studios: ['studio-2'] }));
    await darf('Chef setzt am alten Aushang „alle"', als(chef).doc(p + 'board/alt').update({ studios: 'all' }));
    await darf('… und jetzt liest ihn auch der Mitarbeiter', als(ma).doc(p + 'board/alt').get());
    await darfNicht('… danach ist das Feld nicht mehr umzustellen', als(chef).doc(p + 'board/alt').update({ studios: ['studio-2'] }));
  }
  await env.cleanup();

  /* ── Der Server zieht nach: brettNachziehenFirma ── */
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8791';
  process.env.GCLOUD_PROJECT = 'demo-funktionen';
  const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
  const fns = require(path.join(__dirname, '..', '..', 'functions', 'index.js'));
  const db = admin.firestore();
  await db.doc('firmen/drei').set({ name: 'Drei', aktiv: true });
  await db.doc('firmen/drei/board/a').set({ text: 'alt', ts: 1 });
  await db.doc('firmen/drei/board/b').set({ text: 'neu', ts: 2, studios: ['studio-5'] });
  await db.doc('firmen/drei/config/brettNachgezogen').delete().catch(() => {});
  const n1 = await fns.__intern.brettNachziehenFirma('drei');
  const a = (await db.doc('firmen/drei/board/a').get()).data();
  const b2 = (await db.doc('firmen/drei/board/b').get()).data();
  pruefe('Server: der alte Aushang bekommt „alle", genau einer', n1 === 1 && a.studios === 'all', JSON.stringify({ n1, a }));
  pruefe('Server: der mit Studio bleibt, wie er ist', Array.isArray(b2.studios) && b2.studios[0] === 'studio-5');
  await db.doc('firmen/drei/board/c').set({ text: 'nach dem Vermerk', ts: 3 });
  const n2 = await fns.__intern.brettNachziehenFirma('drei');
  pruefe('Server: mit frischem Vermerk läuft er nicht noch einmal (ein Lesevorgang)', n2 === 0);
  /* Eine noch zwischengespeicherte alte App hängt weiter ohne Feld aus —
     nach Ablauf des Vermerks wird wieder durchgesehen. */
  await db.doc('firmen/drei/config/brettNachgezogen').set({
    ts: Date.now() - fns.__intern.BRETT_VERMERK_MS - 1000, nachgezogen: 1 });
  const n3 = await fns.__intern.brettNachziehenFirma('drei');
  const c = (await db.doc('firmen/drei/board/c').get()).data();
  pruefe('Server: nach Ablauf des Vermerks wird der neue alte Aushang gefunden', n3 === 1 && c.studios === 'all', JSON.stringify({ n3, c }));

  console.log('\nSchwarzes Brett: Studiogrenze (Runde 121)\n' + protokoll.join('\n'));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
