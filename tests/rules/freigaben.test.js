/* ── GETEILTE VIDEOS (Runde 308) ──────────────────────────────────────
   Aus dem Betrieb, 26.11.2026 (Marcel): „das man videos hochladen kann
   in der app und dann einen link schicken oder teilen kann mit dem sich
   JEDER das video angucken kann auch ohne account oder registrierung
   oder irgendwas aber nur mit dem link halt". Teilen: nur die Leitung.

   Geprüft, gegen Firestore- UND Speicher-Emulator:
     Datenbank (freigaben/{id})
       · ohne Anmeldung EIN Dokument lesen (get) – aber keine Liste
       · anlegen nur Leitung, nur für die eigene Firma, nur mit einer
         langen Kennung, nur mit Pfad unter dieser Kennung, nur die
         erlaubten Felder, eigene uid, aktiv:true
       · ändern nur Titel/Gültigkeit/aktiv; löschen nur die Leitung
       · auflisten nur die Leitung der eigenen Firma
     Wer hat geschaut? (freigaben/{id}/aufrufe, 26.11.2026)
       · ohne Anmeldung Vor- und Nachname eintragen, solange die Freigabe
         gilt – mit Serverzeit, ohne weitere Felder, nicht leer
       · nicht bei abgelaufenen oder zurückgezogenen Freigaben
       · lesen nur die Leitung der Firma; ändern niemand
     Speicher (firmen/{f}/freigaben/{id}/{datei})
       · ohne Anmeldung abrufbar, solange die Freigabe besteht, aktiv ist,
         nicht abgelaufen ist und auf genau diese Datei zeigt
       · zurückgezogen (aktiv:false oder gelöscht) / abgelaufen / andere
         Datei / fremde Firma: nichts
       · hochladen nur Leitung, nur Videos; niemand listet
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertFails, assertSucceeds } =
  require(path.join(__dirname, 'node_modules', '@firebase/rules-unit-testing'));
const fbCompat = require(path.join(__dirname, 'node_modules', 'firebase', 'compat', 'app')).default;
require(path.join(__dirname, 'node_modules', 'firebase', 'compat', 'firestore'));
const JETZT = () => fbCompat.firestore.FieldValue.serverTimestamp();

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
const ID = 'Ab3dEf6hIj9kLm2nOp5qRs8t';          // 24 Zeichen wie in der App
const ID2 = 'Zz9yXw8vUt7sRq6pOn5mLk4j';
const ID3 = 'Qq1wEe2rTt3yUu4iOo5pAa6s';
const PF = (id, f) => 'firmen/' + (f || 'koerperformen') + '/freigaben/' + id + '/clip.mp4';
const F = (id, extra) => Object.assign({ firma: 'koerperformen', titel: 'Erstes Training', pfad: PF(id),
  bis: 0, aktiv: true, vonUid: 'lisa', ts: 1, groesse: 8 }, extra || {});

(async () => {
  const env = await initializeTestEnvironment({
    projectId: 'demo-regeltest',
    firestore: { host: '127.0.0.1', port: 8791,
      rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8') },
    storage: { host: '127.0.0.1', port: 9199,
      rules: fs.readFileSync(path.join(__dirname, '..', '..', 'storage-videos.rules'), 'utf8') }
  });
  for (let v = 1; ; v++) {
    try { await env.clearFirestore(); break; }
    catch (e) { if (v >= 3) throw e; await new Promise((r) => setTimeout(r, 1000 * v)); }
  }
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });
    await db.doc('firmen/fremdfirma').set({ name: 'Fremd', aktiv: true });
    const leute = {
      anna: { name: 'Anna', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true },
      lisa: { name: 'Lisa', role: 'leiter',      firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
      max:  { name: 'Max',  role: 'chef',        firma: 'koerperformen', aktiv: true },
      zoe:  { name: 'Zoe',  role: 'chef',        firma: 'fremdfirma',    aktiv: true }
    };
    for (const [uid, d] of Object.entries(leute)) await db.doc('users/' + uid).set(d);
    // Eine bestehende Freigabe mit Datei, eine abgelaufene, eine zurückgezogene
    await db.doc('freigaben/' + ID).set(F(ID));
    await db.doc('freigaben/' + ID2).set(F(ID2, { bis: Date.now() - 86400000 }));
    await db.doc('freigaben/' + ID3).set(F(ID3, { aktiv: false }));
    for (const id of [ID, ID2, ID3]) await ctx.storage().ref(PF(id)).put(VIDEO, { contentType: 'video/mp4' });
    await ctx.storage().ref('firmen/koerperformen/freigaben/' + ID + '/andere.mp4').put(VIDEO, { contentType: 'video/mp4' });
    await ctx.storage().ref('firmen/koerperformen/freigaben/OhneDokument1234567890ab/clip.mp4').put(VIDEO, { contentType: 'video/mp4' });
  });
  const db = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();
  const st = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).storage();

  protokoll.push('  — Datenbank: lesen —');
  await darf('ohne Anmeldung: EIN Dokument mit der Kennung', db(null).doc('freigaben/' + ID).get());
  await darfNicht('ohne Anmeldung: keine Liste', db(null).collection('freigaben').get());
  await darfNicht('ohne Anmeldung: keine Liste, auch nicht gefiltert', db(null).collection('freigaben').where('firma', '==', 'koerperformen').get());
  await darfNicht('eine Mitarbeiterin listet nicht', db('anna').collection('freigaben').where('firma', '==', 'koerperformen').get());
  await darf('die Leitung listet die eigene Firma', db('lisa').collection('freigaben').where('firma', '==', 'koerperformen').get());
  await darfNicht('die Leitung listet nicht ohne Filter', db('lisa').collection('freigaben').get());
  await darfNicht('eine fremde Firma listet nicht unsere', db('zoe').collection('freigaben').where('firma', '==', 'koerperformen').get());

  protokoll.push('  — Datenbank: anlegen —');
  const N1 = 'Neu1aaaaaaaaaaaaaaaaaaaa', N2 = 'Neu2bbbbbbbbbbbbbbbbbbbb';
  await darf('die Studioleitung legt eine Freigabe an', db('lisa').doc('freigaben/' + N1).set(F(N1)));
  await darf('der Chef legt eine an (30 Tage)', db('max').doc('freigaben/' + N2).set(F(N2, { vonUid: 'max', bis: Date.now() + 30 * 86400000 })));
  await darfNicht('eine Mitarbeiterin legt keine an', db('anna').doc('freigaben/Neu3cccccccccccccccccccc').set(F('Neu3cccccccccccccccccccc', { vonUid: 'anna' })));
  await darfNicht('ohne Anmeldung legt niemand an', db(null).doc('freigaben/Neu4dddddddddddddddddddd').set(F('Neu4dddddddddddddddddddd')));
  await darfNicht('… nicht für eine fremde Firma', db('lisa').doc('freigaben/Neu5eeeeeeeeeeeeeeeeeeee').set(F('Neu5eeeeeeeeeeeeeeeeeeee', { firma: 'fremdfirma', pfad: PF('Neu5eeeeeeeeeeeeeeeeeeee', 'fremdfirma') })));
  await darfNicht('… nicht mit kurzer Kennung', db('lisa').doc('freigaben/kurz').set(F('kurz')));
  await darfNicht('… nicht mit Pfad unter einer anderen Kennung', db('lisa').doc('freigaben/Neu6ffffffffffffffffffff').set(F('Neu6ffffffffffffffffffff', { pfad: PF(ID) })));
  await darfNicht('… nicht mit Pfad ausserhalb der Freigaben', db('lisa').doc('freigaben/Neu7gggggggggggggggggggg').set(F('Neu7gggggggggggggggggggg', { pfad: 'firmen/koerperformen/schulungen/m/x.mp4' })));
  await darfNicht('… nicht unter fremder uid', db('lisa').doc('freigaben/Neu8hhhhhhhhhhhhhhhhhhhh').set(F('Neu8hhhhhhhhhhhhhhhhhhhh', { vonUid: 'max' })));
  await darfNicht('… nicht mit fremdem Feld (z. B. Name)', db('lisa').doc('freigaben/Neu9iiiiiiiiiiiiiiiiiiii').set(F('Neu9iiiiiiiiiiiiiiiiiiii', { von: 'Lisa' })));
  await darfNicht('… nicht gleich als inaktiv', db('lisa').doc('freigaben/NeuAjjjjjjjjjjjjjjjjjjjj').set(F('NeuAjjjjjjjjjjjjjjjjjjjj', { aktiv: false })));
  await darfNicht('… nicht mit leerem Titel', db('lisa').doc('freigaben/NeuBkkkkkkkkkkkkkkkkkkkk').set(F('NeuBkkkkkkkkkkkkkkkkkkkk', { titel: '' })));
  await darfNicht('eine fremde Firma legt keine für uns an', db('zoe').doc('freigaben/NeuCllllllllllllllllllll').set(F('NeuCllllllllllllllllllll', { vonUid: 'zoe' })));

  protokoll.push('  — Datenbank: ändern und löschen —');
  await darf('die Leitung verlängert (bis) und benennt um', db('lisa').doc('freigaben/' + N1).update({ bis: Date.now() + 7 * 86400000, titel: 'Neu' }));
  await darfNicht('… aber nicht den Pfad', db('lisa').doc('freigaben/' + N1).update({ pfad: PF(ID) }));
  await darfNicht('… und nicht die Firma', db('lisa').doc('freigaben/' + N1).update({ firma: 'fremdfirma' }));
  await darfNicht('eine Mitarbeiterin ändert nicht', db('anna').doc('freigaben/' + N1).update({ bis: 0 }));
  await darfNicht('ohne Anmeldung ändert niemand', db(null).doc('freigaben/' + N1).update({ aktiv: false }));
  await darfNicht('eine fremde Firma zieht unsere nicht zurück', db('zoe').doc('freigaben/' + N1).delete());
  await darfNicht('eine Mitarbeiterin zieht nicht zurück', db('anna').doc('freigaben/' + N1).delete());
  await darf('die Leitung zieht zurück (löschen)', db('lisa').doc('freigaben/' + N1).delete());

  protokoll.push('  — Wer hat geschaut? (aufrufe) —');
  const A = (id, n) => 'freigaben/' + id + '/aufrufe/' + n;
  const NAME = (extra) => Object.assign({ vorname: 'Erika', nachname: 'Muster', ts: JETZT() }, extra || {});
  await darf('ohne Anmeldung: Vor- und Nachname eintragen', db(null).doc(A(ID, 'Aufruf1aaaaaaaaaaaaa')).set(NAME()));
  await darfNicht('… nicht ohne Nachname', db(null).doc(A(ID, 'Aufruf2aaaaaaaaaaaaa')).set({ vorname: 'Erika', ts: JETZT() }));
  await darfNicht('… nicht mit leerem Vornamen', db(null).doc(A(ID, 'Aufruf3aaaaaaaaaaaaa')).set(NAME({ vorname: '' })));
  await darfNicht('… nicht mit 41 Zeichen', db(null).doc(A(ID, 'Aufruf4aaaaaaaaaaaaa')).set(NAME({ nachname: 'x'.repeat(41) })));
  await darfNicht('… nicht mit erfundener Zeit', db(null).doc(A(ID, 'Aufruf5aaaaaaaaaaaaa')).set(NAME({ ts: 1 })));
  await darfNicht('… nicht mit weiterem Feld', db(null).doc(A(ID, 'Aufruf6aaaaaaaaaaaaa')).set(NAME({ mail: 'a@b.de' })));
  await darfNicht('… nicht mit kurzer Kennung', db(null).doc(A(ID, 'kurz')).set(NAME()));
  await darfNicht('abgelaufene Freigabe: nichts eintragen', db(null).doc(A(ID2, 'Aufruf7aaaaaaaaaaaaa')).set(NAME()));
  await darfNicht('zurückgezogene Freigabe: nichts eintragen', db(null).doc(A(ID3, 'Aufruf8aaaaaaaaaaaaa')).set(NAME()));
  await darfNicht('ohne Freigabe-Dokument: nichts eintragen', db(null).doc(A('OhneDokument1234567890ab', 'Aufruf9aaaaaaaaaaaaa')).set(NAME()));
  await darfNicht('ohne Anmeldung: die Liste nicht lesen', db(null).collection('freigaben/' + ID + '/aufrufe').get());
  await darfNicht('ohne Anmeldung: auch den eigenen Eintrag nicht', db(null).doc(A(ID, 'Aufruf1aaaaaaaaaaaaa')).get());
  await darfNicht('ohne Anmeldung: nicht ändern', db(null).doc(A(ID, 'Aufruf1aaaaaaaaaaaaa')).update({ vorname: 'Max' }));
  await darfNicht('eine Mitarbeiterin liest die Liste nicht', db('anna').collection('freigaben/' + ID + '/aufrufe').get());
  await darf('die Studioleitung liest die Liste', db('lisa').collection('freigaben/' + ID + '/aufrufe').get());
  await darf('der Chef liest die Liste', db('max').collection('freigaben/' + ID + '/aufrufe').get());
  await darfNicht('eine fremde Firma liest unsere Liste nicht', db('zoe').collection('freigaben/' + ID + '/aufrufe').get());
  await darfNicht('auch die Leitung ändert keinen Namen', db('lisa').doc(A(ID, 'Aufruf1aaaaaaaaaaaaa')).update({ vorname: 'Max' }));
  await darfNicht('eine fremde Firma löscht keinen Eintrag', db('zoe').doc(A(ID, 'Aufruf1aaaaaaaaaaaaa')).delete());
  await darf('die Leitung löscht einen Eintrag (beim Entfernen)', db('lisa').doc(A(ID, 'Aufruf1aaaaaaaaaaaaa')).delete());

  protokoll.push('  — Speicher: abrufen ohne Anmeldung —');
  await darf('die gültige Freigabe: das Video kommt', st(null).ref(PF(ID)).getMetadata());
  await darfNicht('eine andere Datei unter derselben Kennung: nichts', st(null).ref('firmen/koerperformen/freigaben/' + ID + '/andere.mp4').getMetadata());
  await darfNicht('abgelaufen: nichts', st(null).ref(PF(ID2)).getMetadata());
  await darfNicht('zurückgezogen (aktiv:false): nichts', st(null).ref(PF(ID3)).getMetadata());
  await darfNicht('ohne Freigabe-Dokument: nichts', st(null).ref('firmen/koerperformen/freigaben/OhneDokument1234567890ab/clip.mp4').getMetadata());
  await darfNicht('dieselbe Kennung unter einer fremden Firma: nichts', st(null).ref(PF(ID, 'fremdfirma')).getMetadata());
  await darfNicht('niemand listet die Freigaben', st('max').ref('firmen/koerperformen/freigaben/').listAll());
  await darf('die Leitung sieht ein Video auch ohne Freigabe (Vorschau)', st('lisa').ref('firmen/koerperformen/freigaben/OhneDokument1234567890ab/clip.mp4').getMetadata());
  await darfNicht('eine fremde Firma sieht es ohne Freigabe nicht', st('zoe').ref('firmen/koerperformen/freigaben/OhneDokument1234567890ab/clip.mp4').getMetadata());
  // Zurückziehen wirkt sofort: Dokument weg → Datei nicht mehr abrufbar
  await env.withSecurityRulesDisabled(async (ctx) => { await ctx.firestore().doc('freigaben/' + ID).update({ aktiv: false }); });
  await darfNicht('eben noch gültig, jetzt zurückgezogen: nichts mehr', st(null).ref(PF(ID)).getMetadata());

  protokoll.push('  — Speicher: hochladen und löschen —');
  const PN = 'firmen/koerperformen/freigaben/' + N2 + '/clip.mp4';
  await darf('die Leitung lädt ein Video hoch', st('lisa').ref(PN).put(VIDEO, { contentType: 'video/mp4' }));
  await darfNicht('eine Mitarbeiterin lädt nicht hoch', st('anna').ref('firmen/koerperformen/freigaben/' + N2 + '/b.mp4').put(VIDEO, { contentType: 'video/mp4' }));
  await darfNicht('ohne Anmeldung lädt niemand hoch', st(null).ref('firmen/koerperformen/freigaben/' + N2 + '/c.mp4').put(VIDEO, { contentType: 'video/mp4' }));
  await darfNicht('nur Videos', st('lisa').ref('firmen/koerperformen/freigaben/' + N2 + '/d.html').put(VIDEO, { contentType: 'text/html' }));
  await darfNicht('kein Überschreiben', st('lisa').ref(PN).put(VIDEO, { contentType: 'video/mp4' }));
  await darfNicht('eine fremde Firma lädt nicht bei uns hoch', st('zoe').ref('firmen/koerperformen/freigaben/' + N2 + '/e.mp4').put(VIDEO, { contentType: 'video/mp4' }));
  await darfNicht('ohne Anmeldung löscht niemand', st(null).ref(PN).delete());
  await darf('die Leitung löscht die Datei', st('lisa').ref(PN).delete());

  await env.cleanup();
  console.log('\n══ Geteilte Videos (Runde 308, Namen 26.11.2026) ══');
  protokoll.forEach(z => console.log(z));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  if (gefallen) { console.log('\n✗ Geteilte Videos: die Regeln sind nicht dicht.'); process.exit(1); }
  console.log('\n✓ Geteilte Videos: nur mit dem Link, nur solange die Freigabe gilt, teilen nur die Leitung.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
