/* ── DATEV-Einstellungen (Runde 209) ───────────────────────────────────
   Berater-, Mandanten- und Personalnummern liegen in
   lohnEinstellungen/datev — NICHT in config, das jeder Aktive liest.

   In beiden Welten (flach und firmen/<k>/):
     · die Geschäftsführung liest und schreibt das Dokument 'datev'
     · Studioleitung, Mitarbeiter, fremde Firma, ohne Konto: weder noch
     · ein anderes Dokument als 'datev' → abgewiesen
     · ein fremdes Feld, zu lange Nummern → abgewiesen
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertFails, assertSucceeds } =
  require(path.join(__dirname, 'node_modules', '@firebase/rules-unit-testing'));

let bestanden = 0, gefallen = 0;
const protokoll = [];
async function darf(name, v) {
  try { await assertSucceeds(v); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — sollte gehen, ging nicht: ' + (e.message || '').slice(0, 80)); }
}
async function darfNicht(name, v) {
  try { await assertFails(v); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — GING DURCH'); }
}
const LEUTE = {
  anna: { name: 'Anna', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
  lisa: { name: 'Lisa', role: 'leiter',      firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
  max:  { name: 'Max',  role: 'chef',        firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
  zoe:  { name: 'Zoe',  role: 'chef',        firma: 'fremdfirma',    aktiv: true, studioKeys: ['studio-1'] }
};
const gut = { beraterNr: '28547', mandantenNr: '90909', lohnartStunden: '200', urlaubstage: true,
  personalNr: { anna: '14' }, geaendert: 1, geaendertVon: 'max' };

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
    await d.doc('lohnEinstellungen/datev').set(gut);
    await d.doc('firmen/koerperformen/lohnEinstellungen/datev').set(gut);
  });
  const als = (uid) => env.authenticatedContext(uid).firestore();
  for (const w of [{ name: 'flach', P: (s) => s }, { name: 'firma', P: (s) => 'firmen/koerperformen/' + s }]) {
    const P = w.P;
    protokoll.push('  ── Welt: ' + w.name + ' ──');
    await darf('Die Geschäftsführung liest',            als('max').doc(P('lohnEinstellungen/datev')).get());
    await darf('Die Geschäftsführung speichert',        als('max').doc(P('lohnEinstellungen/datev')).set(gut));
    await darfNicht('Die Studioleitung liest',          als('lisa').doc(P('lohnEinstellungen/datev')).get());
    await darfNicht('Anna liest (ihre Personalnummer steht darin)', als('anna').doc(P('lohnEinstellungen/datev')).get());
    await darfNicht('Eine fremde Firma liest',          als('zoe').doc(P('lohnEinstellungen/datev')).get());
    await darfNicht('Ohne Konto',                       env.unauthenticatedContext().firestore().doc(P('lohnEinstellungen/datev')).get());
    await darfNicht('Die Studioleitung speichert',      als('lisa').doc(P('lohnEinstellungen/datev')).set(gut));
    await darfNicht('Ein anderes Dokument',             als('max').doc(P('lohnEinstellungen/sonst')).set(gut));
    await darfNicht('Ein fremdes Feld',                 als('max').doc(P('lohnEinstellungen/datev')).set(Object.assign({}, gut, { pin: '1234' })));
    await darfNicht('Beraternummer zu lang',            als('max').doc(P('lohnEinstellungen/datev')).set(Object.assign({}, gut, { beraterNr: '12345678' })));
    await darfNicht('Personalnummern keine Liste',      als('max').doc(P('lohnEinstellungen/datev')).set(Object.assign({}, gut, { personalNr: 'alle' })));
  }
  await env.cleanup();
  console.log('\n══ DATEV-Einstellungen ══');
  protokoll.forEach((z) => console.log(z));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  if (gefallen) { console.log('\n✗ DATEV-Einstellungen sind nicht dicht.'); process.exit(1); }
  console.log('\n✓ DATEV-Einstellungen: nur die Geschäftsführung, nur das eine Dokument, nur diese Felder — ' + bestanden + ' Zusicherungen');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
