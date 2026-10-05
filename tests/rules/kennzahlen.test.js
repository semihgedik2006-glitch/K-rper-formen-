/* ── KENNZAHLEN JE STUDIO (Runde 138) ────────────────────────────────
   Aus dem Betrieb, 4.10.2026: Kennzahlen je Studio; Mitglieder und
   Kündigungen trägt die Studioleitung am Monatsersten ein, „eine
   Minute im Monat, eine Erinnerung kommt aufs Handy" — „geht fit".

   A. Regeln für kennzahlen/<studio>_<JJJJ-MM>, in BEIDEN Welten:
      · die Leitung trägt für IHR Studio ein und liest es (auch als
        Abfrage studioKey == …), der Chef alles
      · nicht für ein fremdes Studio, auch nicht unter fremder Kennung
      · keine Kommazahl, keine negative, kein Text, kein Zusatzfeld,
        kein falscher Monat, nicht im Namen eines anderen
      · ein Mitarbeiter liest und schreibt nichts
      · löschen nur der Chef

   B. kennzahlenErinnern, AUSGEFÜHRT im Emulator mit abgefangenem
      Versand: nur wer ein Studio ohne Zahlen leitet; Studios ohne
      Leitung fallen der GF zu; geschlossene zählen nicht; wer
      Aufgaben-Meldungen abgeschaltet hat, bekommt nichts; der richtige
      Monat, auch über den Jahreswechsel.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8791';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'demo-funktionen';
process.env.GOOGLE_CLOUD_PROJECT = 'demo-funktionen';

const { initializeTestEnvironment, assertFails, assertSucceeds } =
  require(path.join(__dirname, 'node_modules', '@firebase/rules-unit-testing'));
const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
const fns = require(path.join(__dirname, '..', '..', 'functions', 'index.js'));
const db = admin.firestore();

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
const K = (studio, monat, uid, f) => Object.assign({ studioKey: studio, monat, mitglieder: 412, kuendigungen: 7,
  vonUid: uid, vonName: 'Lea', ts: 1 }, f || {});

(async () => {
  /* ══ A. Regeln ══ */
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
    await d.doc('users/chef').set({ name: 'Max', role: 'chef', firma: 'eins', aktiv: true, studioKeys: [] });
    await d.doc('users/lei').set({ name: 'Lea', role: 'leiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/ma').set({ name: 'Mara', role: 'mitarbeiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/altchef').set({ name: 'Altchef', role: 'chef', aktiv: true, studioKeys: [] });
    await d.doc('users/altlei').set({ name: 'Altlea', role: 'leiter', aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/altma').set({ name: 'Altma', role: 'mitarbeiter', aktiv: true, studioKeys: ['studio-1'] });
    for (const p of ['firmen/eins/', '']) {
      await d.doc(p + 'kennzahlen/studio-9_2026-08').set(K('studio-9', '2026-08', 'chef'));
    }
  });
  const als = (uid) => env.authenticatedContext(uid).firestore();
  for (const [welt, chef, lei, ma, p] of [['firmen/eins', 'chef', 'lei', 'ma', 'firmen/eins/'],
                                          ['flach', 'altchef', 'altlei', 'altma', '']]) {
    protokoll.push('\n  ── Regeln: ' + welt + ' ──');
    const C = p + 'kennzahlen/';
    await darf('die Leitung trägt für ihr Studio ein', als(lei).doc(C + 'studio-1_2026-09').set(K('studio-1', '2026-09', lei)));
    await darf('… und korrigiert die Zahl', als(lei).doc(C + 'studio-1_2026-09').set(K('studio-1', '2026-09', lei, { mitglieder: 415 })));
    await darf('… und fragt ihr Studio ab (studioKey == …)',
      als(lei).collection(C).where('studioKey', '==', 'studio-1').get());
    await darfNicht('… aber nicht alle ungefiltert', als(lei).collection(C).get());
    await darfNicht('… und liest kein fremdes Studio', als(lei).doc(C + 'studio-9_2026-08').get());
    await darfNicht('… und trägt für kein fremdes Studio ein', als(lei).doc(C + 'studio-9_2026-09').set(K('studio-9', '2026-09', lei)));
    await darfNicht('… auch nicht unter der Kennung des eigenen Studios',
      als(lei).doc(C + 'studio-1_2026-07').set(K('studio-9', '2026-07', lei)));
    await darfNicht('… und nicht unter einem anderen Monat in der Kennung',
      als(lei).doc(C + 'studio-1_2026-07').set(K('studio-1', '2026-06', lei)));
    await darfNicht('eine Kommazahl', als(lei).doc(C + 'studio-1_2026-05').set(K('studio-1', '2026-05', lei, { mitglieder: 4.5 })));
    await darfNicht('eine negative Zahl', als(lei).doc(C + 'studio-1_2026-05').set(K('studio-1', '2026-05', lei, { kuendigungen: -1 })));
    await darfNicht('Text statt Zahl', als(lei).doc(C + 'studio-1_2026-05').set(K('studio-1', '2026-05', lei, { mitglieder: '400' })));
    await darfNicht('ein Monat 13', als(lei).doc(C + 'studio-1_2026-13').set(K('studio-1', '2026-13', lei)));
    await darfNicht('ein Zusatzfeld', als(lei).doc(C + 'studio-1_2026-05').set(K('studio-1', '2026-05', lei, { umsatz: 1 })));
    await darfNicht('im Namen eines anderen', als(lei).doc(C + 'studio-1_2026-05').set(K('studio-1', '2026-05', chef)));
    await darfNicht('ein Mitarbeiter liest nichts', als(ma).doc(C + 'studio-1_2026-09').get());
    await darfNicht('… und trägt nichts ein', als(ma).doc(C + 'studio-1_2026-04').set(K('studio-1', '2026-04', ma)));
    await darfNicht('die Leitung löscht nicht', als(lei).doc(C + 'studio-1_2026-09').delete());
    await darf('der Chef liest alles ungefiltert', als(chef).collection(C).get());
    await darf('… trägt für jedes Studio ein', als(chef).doc(C + 'studio-9_2026-09').set(K('studio-9', '2026-09', chef)));
    await darf('… und löscht', als(chef).doc(C + 'studio-9_2026-09').delete());
  }
  await env.cleanup();

  /* ══ B. Die Erinnerung ══ */
  protokoll.push('\n  ── kennzahlenErinnern ──');
  const I = fns.__intern;
  pruefe('Vormonat am 4.10. → 2026-09', I.kennzahlMonatVor(Date.UTC(2026, 9, 4, 8)) === '2026-09');
  pruefe('über den Jahreswechsel, Berliner Zeit: 1.1. 0:30 → 2025-12',
    I.kennzahlMonatVor(Date.UTC(2025, 11, 31, 23, 30)) === '2025-12');
  pruefe('… und 31.12. 22:30 (Berlin 23:30) → 2025-11', I.kennzahlMonatVor(Date.UTC(2025, 11, 31, 22, 30)) === '2025-11');

  const gesendet = [];
  Object.defineProperty(admin, 'messaging', { configurable: true, writable: true,
    value: () => ({ sendEachForMulticast: async (m) => {
      gesendet.push(m); return { responses: m.tokens.map(() => ({ success: true })) }; } }) });
  try {
    const F = db.collection('firmen').doc('kz');
    await F.set({ name: 'KZ', aktiv: true });
    await F.collection('config').doc('studios').set({ liste: [
      { id: 's1', name: 'Mitte' }, { id: 's2', name: 'Nord' }, { id: 's3', name: 'Süd' },
      { id: 's4', name: 'Zu', aktiv: false } ] });
    const leute = {
      kLeiS1:  { role: 'leiter', studioKeys: ['s1'] },
      kLeiS2:  { role: 'leiter', studioKeys: ['s2'] },
      kLeise:  { role: 'leiter', studioKeys: ['s1'] },
      kChef:   { role: 'chef', studioKeys: [] },
      kMa:     { role: 'mitarbeiter', studioKeys: ['s1'] },
      kAltLei: { role: 'leiter', studioKeys: ['s3'], aktiv: false }
    };
    for (const [uid, d] of Object.entries(leute)) {
      await db.doc('users/' + uid).set(Object.assign({ name: uid, firma: 'kz' }, d));
      await db.doc('pushTokens/tok-' + uid).set({ uid: uid, firma: 'kz', role: d.role, studioKeys: d.studioKeys,
        notify: uid === 'kLeise' ? { todos: false } : { todos: true } });
    }
    const jetzt = Date.UTC(2026, 9, 1, 8);    // 1.10.2026, 10 Uhr Berlin
    await F.collection('kennzahlen').doc('s2_2026-09').set({ studioKey: 's2', monat: '2026-09', mitglieder: 300, kuendigungen: 4 });
    await F.collection('kennzahlen').doc('s1_2026-08').set({ studioKey: 's1', monat: '2026-08', mitglieder: 410, kuendigungen: 6 });
    await I.kennzahlenErinnernFirma('kz', jetzt);
    const an = gesendet.flatMap((m) => m.tokens.map((t) => t + ' → ' + m.data.body));
    const toks = gesendet.flatMap((m) => m.tokens);
    pruefe('die Leitung von Mitte (ohne Zahlen für September) wird erinnert', toks.indexOf('tok-kLeiS1') >= 0, JSON.stringify(an));
    pruefe('… mit dem Studio im Text und dem Monat in der Überschrift',
      gesendet.some((m) => m.tokens[0] === 'tok-kLeiS1' && /Mitte/.test(m.data.body) && /September/.test(m.data.title)),
      JSON.stringify(gesendet.map((m) => m.data)));
    pruefe('Nord hat eingetragen → die Leitung von Nord bekommt nichts', toks.indexOf('tok-kLeiS2') < 0);
    pruefe('Süd hat keine aktive Leitung → die GF wird für Süd erinnert, und nur dafür',
      gesendet.some((m) => m.tokens[0] === 'tok-kChef' && /Süd/.test(m.data.body) && !/Mitte|Nord/.test(m.data.body)),
      JSON.stringify(an));
    pruefe('das geschlossene Studio zählt nicht', !gesendet.some((m) => /Zu\b/.test(m.data.body.replace('zu tun', ''))));
    pruefe('nicht: Mitarbeiter, inaktive Leitung, wer Aufgaben-Meldungen abgeschaltet hat',
      !toks.some((t) => /kMa|kAltLei|kLeise/.test(t)), JSON.stringify(toks));
    pruefe('ein Eintrag für AUGUST zählt nicht für September', toks.indexOf('tok-kLeiS1') >= 0);

    gesendet.length = 0;
    await F.collection('kennzahlen').doc('s1_2026-09').set({ studioKey: 's1', monat: '2026-09', mitglieder: 412, kuendigungen: 7 });
    await F.collection('kennzahlen').doc('s3_2026-09').set({ studioKey: 's3', monat: '2026-09', mitglieder: 120, kuendigungen: 1 });
    await I.kennzahlenErinnernFirma('kz', Date.UTC(2026, 9, 4, 8));
    pruefe('am 4.: alles eingetragen → niemand bekommt etwas', gesendet.length === 0, JSON.stringify(gesendet));

    /* Runde 141: ein Betrieb, der die Kennzahlen nie benutzt hat, bekommt
       keine Aufforderung — sonst kämen jeden Monat Pushes für eine
       Ansicht, nach der dort niemand gefragt hat. */
    gesendet.length = 0;
    const N = db.collection('firmen').doc('kz-nie');
    await N.set({ name: 'Nie', aktiv: true });
    await N.collection('config').doc('studios').set({ liste: [{ id: 's1', name: 'Mitte' }] });
    await db.doc('users/nLei').set({ name: 'nLei', firma: 'kz-nie', role: 'leiter', studioKeys: ['s1'] });
    await db.doc('pushTokens/tok-nLei').set({ uid: 'nLei', firma: 'kz-nie', role: 'leiter', studioKeys: ['s1'] });
    await I.kennzahlenErinnernFirma('kz-nie', jetzt);
    pruefe('ein Betrieb ohne einen einzigen Eintrag bekommt keine Erinnerung', gesendet.length === 0, JSON.stringify(gesendet));
    await db.doc('users/nLei').delete(); await db.doc('pushTokens/tok-nLei').delete();

    const R = I.kennzahlEmpfaenger({ a: 'A', b: 'B' }, new Set(), [
      { uid: 'l', role: 'leiter', studioKeys: ['a', 'b'] }, { uid: 'c', role: 'chef' }]);
    pruefe('eine Leitung mit zwei Studios bekommt EINE Nachricht mit beiden', JSON.stringify(R) === '{"l":["A","B"]}', JSON.stringify(R));
    for (const uid of Object.keys(leute)) {
      await db.doc('users/' + uid).delete(); await db.doc('pushTokens/tok-' + uid).delete();
    }
  } finally { delete admin.messaging; }

  console.log('\n── Kennzahlen je Studio ──');
  protokoll.forEach((z) => console.log(z));
  console.log('\n' + (gefallen
    ? '✗ ' + gefallen + ' Fehler, ' + bestanden + ' in Ordnung'
    : '✓ Kennzahlen: nur die eigene Leitung, nur ganze Zahlen, erinnert wird, wer fehlt — ' + bestanden + ' Zusicherungen'));
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
