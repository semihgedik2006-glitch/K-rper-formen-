/* ── DOKUMENTE: DIE STUDIOGRENZE BEIM LESEN (P-01, Runde 114) ─────────
   Aus dem Betrieb, 25.9.2026:
     „JA aber man kann selber entscheiden ob alle oder nur studio"

   Ein Dokument trägt `studios`: 'all' oder eine Liste von Studios. Bis
   Runde 114 prüfte die Regel das nicht — jeder im Betrieb las über die
   Konsole jedes Dokument, auch das nur für ein fremdes Studio.

   Was dieser Durchlauf festhält, in BEIDEN Welten (flach und
   firmen/<kennung>/), als einzelnes Dokument UND als Abfrage:

     · Mitarbeiter liest ein Dokument für ALLE                 → geht
     · Mitarbeiter liest eines für SEIN Studio                 → geht
     · Mitarbeiter liest eines für ein FREMDES Studio          → geht nicht
     · … und dessen Inhalt (documentData)                      → geht nicht
     · die Abfragen der App: studios == 'all' und
       studios array-contains-any [meine Studios]              → gehen
     · die alte, ungefilterte Abfrage als Mitarbeiter          → geht nicht
     · Chef: alles, auch ungefiltert                           → geht
     · Leitung: ihre Studios, fremde nicht
     · fremde Firma                                            → geht nicht
     · Leitung speichert den Inhalt zu ihrem EIGENEN Dokument  → geht
       (unter firmen/<k>/ sah die Regel bis Runde 114 am flachen Pfad
        nach — beim Umbau gefunden)
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

const DOKS = {
  alle:   { name: 'Hausordnung', studios: 'all', ts: 3 },
  eigen:  { name: 'Dienstplan Brühl', studios: ['studio-1'], ts: 2 },
  fremd:  { name: 'Dienstplan Hürth', studios: ['studio-2'], ts: 1 },
  zwei:   { name: 'Zwei Studios', studios: ['studio-2', 'studio-3'], ts: 4 },
};

(async () => {
  const env = await initializeTestEnvironment({
    projectId: 'demo-regeltest',
    firestore: {
      host: '127.0.0.1', port: 8791,
      rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8')
    }
  });
  await env.clearFirestore();

  /* Die flache Welt gilt für Konten ohne Firma (Körperformen von vor
     der Mehrmandanten-Umstellung) — aufFlachenPfaden(). */
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc('firmen/eins').set({ name: 'Betrieb eins', aktiv: true });
    await db.doc('firmen/zwei').set({ name: 'Betrieb zwei', aktiv: true });
    for (const [id, d] of Object.entries(DOKS)) {
      await db.doc('firmen/eins/documents/' + id).set(d);
      await db.doc('firmen/eins/documentData/' + id).set({ data: 'data:text/plain;base64,QQ==' });
      await db.doc('documents/' + id).set(d);
      await db.doc('documentData/' + id).set({ data: 'data:text/plain;base64,QQ==' });
    }
    await db.doc('firmen/zwei/documents/alle').set(DOKS.alle);
    await db.doc('users/ma').set({ name: 'Mara', role: 'mitarbeiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/leiter').set({ name: 'Lisa', role: 'leiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1', 'studio-3'] });
    await db.doc('users/chef').set({ name: 'Max', role: 'chef', firma: 'eins', aktiv: true, studioKeys: [] });
    await db.doc('users/fremd').set({ name: 'Fremd', role: 'chef', firma: 'zwei', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/alt').set({ name: 'Alt', role: 'mitarbeiter', aktiv: true, studioKeys: ['studio-1'] });
    await db.doc('users/altchef').set({ name: 'Altchef', role: 'chef', aktiv: true, studioKeys: [] });
  });
  const als = (uid) => env.authenticatedContext(uid).firestore();

  for (const [welt, ma, chef, praefix] of [['firmen/eins', 'ma', 'chef', 'firmen/eins/'], ['flach', 'alt', 'altchef', '']]) {
    protokoll.push('\n  ── ' + welt + ': einzelne Dokumente ──');
    await darf('Mitarbeiter liest ein Dokument für ALLE', als(ma).doc(praefix + 'documents/alle').get());
    await darf('Mitarbeiter liest eines für SEIN Studio', als(ma).doc(praefix + 'documents/eigen').get());
    await darfNicht('Mitarbeiter liest eines für ein FREMDES Studio', als(ma).doc(praefix + 'documents/fremd').get());
    await darfNicht('… und eines für zwei fremde Studios', als(ma).doc(praefix + 'documents/zwei').get());
    await darfNicht('… und dessen INHALT (documentData)', als(ma).doc(praefix + 'documentData/fremd').get());
    await darf('den Inhalt des eigenen liest er', als(ma).doc(praefix + 'documentData/eigen').get());
    await darf('Chef liest das fremde Studio', als(chef).doc(praefix + 'documents/fremd').get());
    await darf('Chef liest dessen Inhalt', als(chef).doc(praefix + 'documentData/fremd').get());

    protokoll.push('\n  ── ' + welt + ': die Abfragen der App ──');
    await darf('Mitarbeiter: studios == "all"', als(ma).collection(praefix + 'documents').where('studios', '==', 'all').get());
    await darf('Mitarbeiter: studios array-contains-any [seine Studios]',
      als(ma).collection(praefix + 'documents').where('studios', 'array-contains-any', ['studio-1']).get());
    await darfNicht('Mitarbeiter: array-contains-any mit einem FREMDEN Studio',
      als(ma).collection(praefix + 'documents').where('studios', 'array-contains-any', ['studio-2']).get());
    await darfNicht('Mitarbeiter: die alte, ungefilterte Abfrage', als(ma).collection(praefix + 'documents').get());
    await darf('Chef: ungefiltert, alles', als(chef).collection(praefix + 'documents').get());
  }

  protokoll.push('\n  ── Leitung ──');
  await darf('Leitung liest ihr Studio 3 (in „zwei Studios")', als('leiter').doc('firmen/eins/documents/zwei').get());
  await darfNicht('Leitung liest Studio 2 allein', als('leiter').doc('firmen/eins/documents/fremd').get());
  await darf('Leitung fragt ihre Studios ab', als('leiter').collection('firmen/eins/documents').where('studios', 'array-contains-any', ['studio-1', 'studio-3']).get());
  await darf('Leitung speichert den Inhalt zu ihrem EIGENEN Dokument (firmen-Pfad)',
    als('leiter').doc('firmen/eins/documentData/eigen').set({ data: 'data:text/plain;base64,Qg==' }));
  await darfNicht('… nicht zu einem fremden', als('leiter').doc('firmen/eins/documentData/fremd').set({ data: 'x' }));

  protokoll.push('\n  ── Firmengrenze ──');
  await darfNicht('fremde Firma liest „für alle" von Firma eins', als('fremd').doc('firmen/eins/documents/alle').get());
  await darfNicht('fremde Firma fragt Firma eins ab', als('fremd').collection('firmen/eins/documents').where('studios', '==', 'all').get());
  await darf('(Gegenprobe) die eigene Firma liest sie', als('fremd').doc('firmen/zwei/documents/alle').get());

  await env.cleanup();
  console.log('\n══ Dokumente: Studiogrenze beim Lesen ══');
  protokoll.forEach(z => console.log(z));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  if (gefallen) { console.log('\n✗ Die Studiogrenze bei Dokumenten hält nicht.'); process.exit(1); }
  console.log('\n✓ Dokumente: jeder liest nur, was für ihn bestimmt ist — in beiden Welten, auch als Abfrage.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
