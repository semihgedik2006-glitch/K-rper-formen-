/* ── STUDIOLEITUNG LEGT AUFGABEN AN (Runde 145) ───────────────────────
   Aus dem Betrieb, 6.10.2026: „Es konnten wieder ein paar Studio Leiter
   keine Aufgaben anlegen".

   Die Regel für todos fragt bei der Leitung manages(studioKey): Rolle
   'leiter' UND das Studio steht in studioKeys im Konto. Das Formular der
   Verwaltung schickt alle angehakten Studios in EINEM Batch. Geprüft wird
   hier, was das für die Leitung bedeutet — in BEIDEN Welten (flach und
   firmen/<f>/):

     1. stimmt das Konto, geht ein Studio und gehen mehrere zugleich;
     2. fehlt EIN Studio in studioKeys, scheitert der GANZE Batch — auch
        die Aufgabe im eigenen Studio wird nicht angelegt (genau das sah
        die Leitung: „Aufgabe lässt sich nicht anlegen", nicht „eine von
        dreien fehlt");
     3. ein Konto ganz ohne studioKeys (alte Konten) legt nirgends an;
     4. GEGENPROBE: der Chef darf überall, ohne studioKeys.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');

const { initializeTestEnvironment, assertFails, assertSucceeds } =
  require(path.join(__dirname, 'node_modules', '@firebase/rules-unit-testing'));

let bestanden = 0, gefallen = 0;
const protokoll = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) { bestanden++; protokoll.push('  ✓ ' + name); }
  else { gefallen++; protokoll.push('  ✗ ' + name + (zusatz ? '\n      ' + zusatz : '')); }
}
async function darf(name, versprechen) {
  try { await assertSucceeds(versprechen); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — sollte gehen, ging nicht (' + String(e.message).slice(0, 80) + ')'); }
}
async function darfNicht(name, versprechen) {
  try { await assertFails(versprechen); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — GING DURCH'); }
}
const T = (uid, f) => Object.assign({ title: 'Theke wischen', desc: '', done: false, doneBy: null, doneAt: null,
  createdBy: 'Lea', createdByUid: uid, ts: 1 }, f || {});

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
    for (const [pre, firma] of [['', null], ['x', 'eins']]) {
      const f = firma ? { firma } : {};
      await d.doc('users/' + pre + 'chef').set(Object.assign({ name: 'Max', role: 'chef', aktiv: true, studioKeys: [] }, f));
      // stimmt: Namen und Kennungen passen zusammen
      await d.doc('users/' + pre + 'lei').set(Object.assign({ name: 'Lea', role: 'leiter', aktiv: true,
        studios: ['Brühl', 'Hürth'], studioKeys: ['studio-1', 'studio-2'] }, f));
      // drei Studios im Namen, nur zwei als Kennung
      await d.doc('users/' + pre + 'leiHalb').set(Object.assign({ name: 'Lars', role: 'leiter', aktiv: true,
        studios: ['Brühl', 'Hürth', 'Nippes'], studioKeys: ['studio-1', 'studio-2'] }, f));
      // altes Konto: Namen ja, Kennungen gar nicht
      await d.doc('users/' + pre + 'leiAlt').set(Object.assign({ name: 'Lotte', role: 'leiter', aktiv: true,
        studios: ['Brühl'] }, f));
    }
  });
  const als = (uid) => env.authenticatedContext(uid).firestore();
  const zahl = async (pfad) => {
    let n = 0;
    await env.withSecurityRulesDisabled(async (ctx) => { n = (await ctx.firestore().collection(pfad).get()).size; });
    return n;
  };

  for (const [welt, pre, p] of [['flach', '', ''], ['firmen/eins', 'x', 'firmen/eins/']]) {
    protokoll.push('\n  ── ' + welt + ' ──');
    const lei = pre + 'lei', halb = pre + 'leiHalb', alt = pre + 'leiAlt', chef = pre + 'chef';
    const todo = (db, sk) => db.collection(p + 'studios/' + sk + '/todos').doc();

    await darf('1. Leitung, Konto stimmt: Aufgabe im eigenen Studio', todo(als(lei), 'studio-1').set(T(lei)));
    await darf('… auch wiederkehrend (das darf nur die Leitung)', todo(als(lei), 'studio-1').set(T(lei, { recurring: 'daily' })));
    {
      const db = als(lei), b = db.batch();
      b.set(todo(db, 'studio-1'), T(lei)); b.set(todo(db, 'studio-2'), T(lei));
      await darf('… und für beide Studios zugleich (ein Batch)', b.commit());
    }
    await darfNicht('… aber nicht in einem fremden Studio', todo(als(lei), 'studio-9').set(T(lei)));

    const vorher = await zahl(p + 'studios/studio-1/todos');
    {
      const db = als(halb), b = db.batch();
      b.set(todo(db, 'studio-1'), T(halb)); b.set(todo(db, 'studio-2'), T(halb)); b.set(todo(db, 'studio-3'), T(halb));
      await darfNicht('2. Ein Studio fehlt in studioKeys, „Alle Studios" angehakt → der ganze Batch scheitert', b.commit());
    }
    pruefe('… und auch die Aufgabe im eigenen Studio ist NICHT angelegt (alles oder nichts)',
      (await zahl(p + 'studios/studio-1/todos')) === vorher, String(await zahl(p + 'studios/studio-1/todos')) + ' / ' + vorher);
    {
      const db = als(halb), b = db.batch();
      b.set(todo(db, 'studio-1'), T(halb)); b.set(todo(db, 'studio-2'), T(halb));
      await darf('… nur die Studios, die im Konto stehen → geht', b.commit());
    }

    await darfNicht('3. Altes Konto ohne studioKeys: nicht einmal im eigenen Studio', todo(als(alt), 'studio-1').set(T(alt)));

    {
      const db = als(chef), b = db.batch();
      b.set(todo(db, 'studio-1'), T(chef)); b.set(todo(db, 'studio-3'), T(chef)); b.set(todo(db, 'studio-9'), T(chef));
      await darf('4. GEGENPROBE Chef: überall, ohne studioKeys', b.commit());
    }
  }

  await env.cleanup();
  console.log('\n── Studioleitung legt Aufgaben an ──');
  protokoll.forEach((z) => console.log(z));
  console.log('\n' + (gefallen
    ? '✗ ' + gefallen + ' Fehler, ' + bestanden + ' in Ordnung'
    : '✓ Leitung: geht im eigenen Studio; fehlt eines in studioKeys, scheitert der ganze Batch — ' + bestanden + ' Zusicherungen'));
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
