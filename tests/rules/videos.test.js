/* ── Der Video-Eimer der Schulungen: wer darf was ─────────────────────

   Aus dem Betrieb, 24.9.2026: „Videos kommen noch speicher ort können
   wir vorbereiten so gut es geht". storage-videos.rules ist vorbereitet,
   aber noch nicht ausgerollt — den Eimer muss es erst geben (siehe
   docs/VIDEOS.md). Geprüft wird die Datei trotzdem schon jetzt, damit
   sie am Tag des Ausrollens nicht zum ersten Mal läuft.

   Gegen den Speicher-Emulator, mit dem Firestore-Emulator dahinter —
   die Regeln lesen das Profil aus `users`.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertFails, assertSucceeds } =
  require(path.join(__dirname, 'node_modules', '@firebase/rules-unit-testing'));

let bestanden = 0, gefallen = 0;
const protokoll = [];
async function darf(name, v) {
  try { await assertSucceeds(v); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — sollte gehen, ging nicht: ' + String(e.message || e).slice(0, 120)); }
}
async function darfNicht(name, v) {
  try { await assertFails(v); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — GING DURCH'); }
}
const VIDEO = new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112]);

(async () => {
  const env = await initializeTestEnvironment({
    projectId: 'demo-regeltest',
    firestore: { host: '127.0.0.1', port: 8791,
      rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8') },
    storage: { host: '127.0.0.1', port: 9199,
      rules: fs.readFileSync(path.join(__dirname, '..', '..', 'storage-videos.rules'), 'utf8') }
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const leute = {
      anna: { name: 'Anna', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true },
      lisa: { name: 'Lisa', role: 'leiter',      firma: 'koerperformen', aktiv: true },
      max:  { name: 'Max',  role: 'chef',        firma: 'koerperformen', aktiv: true },
      neu:  { name: 'Neu',  role: 'mitarbeiter', firma: 'koerperformen', aktiv: false },
      zoe:  { name: 'Zoe',  role: 'chef',        firma: 'fremdfirma',    aktiv: true }
    };
    for (const [uid, d] of Object.entries(leute)) await db.doc('users/' + uid).set(d);
    await ctx.storage().ref('firmen/koerperformen/schulungen/m-ems-grundlagen/da.mp4')
      .put(VIDEO, { contentType: 'video/mp4' });
  });
  const st = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).storage();
  const P = 'firmen/koerperformen/schulungen/m-ems-grundlagen/';

  protokoll.push('  — Lesen —');
  await darf('Anna (Mitarbeiterin) sieht ein Video ihrer Firma', st('anna').ref(P + 'da.mp4').getMetadata());
  await darfNicht('ohne Anmeldung', st(null).ref(P + 'da.mp4').getMetadata());
  await darfNicht('ein noch nicht freigegebenes Konto', st('neu').ref(P + 'da.mp4').getMetadata());
  await darfNicht('eine fremde Firma', st('zoe').ref(P + 'da.mp4').getMetadata());
  await darfNicht('ein angemeldetes Konto OHNE Profil (selbst registriert)', st('fremder').ref(P + 'da.mp4').getMetadata());
  await darfNicht('niemand listet das Verzeichnis, auch der Chef nicht', st('max').ref(P).listAll());

  protokoll.push('  — Hochladen —');
  await darf('die Studioleitung lädt ein Video hoch', st('lisa').ref(P + 'neu-1.mp4').put(VIDEO, { contentType: 'video/mp4' }));
  await darf('der Chef lädt ein Video hoch', st('max').ref(P + 'neu-2.mp4').put(VIDEO, { contentType: 'video/mp4' }));
  await darfNicht('eine Mitarbeiterin lädt hoch', st('anna').ref(P + 'neu-3.mp4').put(VIDEO, { contentType: 'video/mp4' }));
  await darfNicht('die Leitung lädt etwas anderes als ein Video hoch', st('lisa').ref(P + 'bild.html').put(VIDEO, { contentType: 'text/html' }));
  await darfNicht('eine fremde Firma lädt in diese Firma hoch', st('zoe').ref(P + 'neu-4.mp4').put(VIDEO, { contentType: 'video/mp4' }));
  await darfNicht('ein vorhandenes Video wird überschrieben', st('max').ref(P + 'da.mp4').put(VIDEO, { contentType: 'video/mp4' }));
  await darfNicht('hochladen ausserhalb von schulungen/', st('max').ref('firmen/koerperformen/sicherung/x.mp4').put(VIDEO, { contentType: 'video/mp4' }));

  protokoll.push('  — Löschen —');
  await darfNicht('eine Mitarbeiterin löscht', st('anna').ref(P + 'neu-1.mp4').delete());
  await darf('die Leitung löscht', st('lisa').ref(P + 'neu-1.mp4').delete());

  await env.cleanup();
  console.log('\n══ Video-Eimer (storage-videos.rules) ══');
  protokoll.forEach(z => console.log(z));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  if (gefallen) { console.log('\n✗ Die Regeln für den Video-Eimer sind nicht dicht.'); process.exit(1); }
  console.log('\n✓ Video-Eimer: lesen nur die eigene Firma, hochladen nur die Leitung, nur Videos.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
