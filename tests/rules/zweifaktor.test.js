/* ── Zwei-Faktor bei der Leitung: die Übersicht (Runde 119) ───────────

   Aus dem Betrieb, 25.9.2026: 2FA „ja für chefs, Admin und studioleiter
   accounts".

   zweiFaktorStand wird hier AUSGEFÜHRT, gegen Firestore- und
   Auth-Emulator. Der Auth-Emulator kann einem Konto über das Admin-SDK
   nur einen TELEFON-Faktor geben (TOTP legt nur der Nutzer selbst an).
   Die Funktion zählt jeden zweiten Faktor — also ist das hier derselbe
   Fall wie im Betrieb.

   1. Nur die Geschäftsführung ruft sie auf; Studioleitung und Mitarbeiter
      nicht.
   2. Sie nennt Chef, Studioleitung und Admin der EIGENEN Firma — keine
      Mitarbeiter, keine wartenden Konten, niemanden aus einer anderen.
   3. Wer einen zweiten Faktor hat, steht auf „an", die anderen zuerst.
   4. In der Antwort steht keine Telefonnummer.
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

(async () => {
  const leer = await fetch('http://' + process.env.FIRESTORE_EMULATOR_HOST +
    '/emulator/v1/projects/demo-funktionen/databases/(default)/documents', { method: 'DELETE' });
  if (!leer.ok) throw new Error('Emulator nicht geleert');
  await fetch('http://' + process.env.FIREBASE_AUTH_EMULATOR_HOST + '/emulator/v1/projects/demo-funktionen/accounts', { method: 'DELETE' });

  /* Eigene Kennung statt „alpha": firmencode.test.js legt dort „Chef A" und
     „Betreiber" an, und im Emulator fand die Abfrage where('firma','==',…)
     sie nach dem Leeren noch (in der Kette gesehen, einzeln nicht). */
  await db.doc('firmen/zfalpha').set({ name: 'Alpha', aktiv: true });
  const konten = [
    ['zfChef', { name: 'Chef mit', role: 'chef', firma: 'zfalpha', aktiv: true }, true],
    ['zfChef2', { name: 'Chef ohne', role: 'chef', firma: 'zfalpha', aktiv: true }, false],
    ['zfLeiter', { name: 'Leitung ohne', role: 'leiter', firma: 'zfalpha', aktiv: true }, false],
    ['zfAdmin', { name: 'Betreiber mit', role: 'chef', firma: 'zfalpha', aktiv: true, admin: true }, true],
    ['zfMit', { name: 'Mitarbeiterin', role: 'mitarbeiter', firma: 'zfalpha', aktiv: true }, false],
    ['zfWartet', { name: 'Wartet', role: 'leiter', firma: 'zfalpha', aktiv: false }, false],
    ['zfFremd', { name: 'Fremde Leitung', role: 'leiter', firma: 'beta', aktiv: true }, true],
  ];
  for (const [uid, profil, zf] of konten) {
    await db.doc('users/' + uid).set(profil);
    const neu = { uid, email: uid.toLowerCase() + '@example.org', emailVerified: true };
    if (zf) neu.multiFactor = { enrolledFactors: [{ factorId: 'phone', phoneNumber: '+4915112345678', displayName: 'Handy' }] };
    await admin.auth().createUser(neu);
  }

  await scheitert('Studioleitung ruft die Übersicht NICHT auf', fns.zweiFaktorStand.run({}, als('zfLeiter')), /Geschäftsführung/);
  await scheitert('Mitarbeiterin auch nicht', fns.zweiFaktorStand.run({}, als('zfMit')), /Geschäftsführung/);
  const r = await fns.zweiFaktorStand.run({}, als('zfChef'));
  const namen = r.personen.map((p) => p.name);
  pruefe('genau Chef, Studioleitung und Admin der eigenen Firma (4)',
    namen.length === 4 && !namen.includes('Mitarbeiterin') && !namen.includes('Wartet') && !namen.includes('Fremde Leitung'), JSON.stringify(namen));
  const nach = Object.fromEntries(r.personen.map((p) => [p.name, p]));
  pruefe('„an" nur bei denen mit zweitem Faktor', nach['Chef mit'].an && nach['Betreiber mit'].an && !nach['Chef ohne'].an && !nach['Leitung ohne'].an, JSON.stringify(r.personen));
  pruefe('der Betreiber steht als „admin"', nach['Betreiber mit'].rolle === 'admin');
  pruefe('die Offenen zuerst', !r.personen[0].an && !r.personen[1].an && r.personen[3].an);
  pruefe('keine Telefonnummer in der Antwort', !/4915112345678|phone/i.test(JSON.stringify(r)), JSON.stringify(r));

  /* ── Runde 124: Zurücksetzen (docs/ZWEI-FAKTOR.md, Stufe 2) ──
     „Handy verloren → der zweite Faktor muss sich entfernen lassen,
     sonst ist das Konto zu." Wer darf, wer nicht, und die Spur. */
  protokoll.push('\n  ── Zurücksetzen (Runde 124) ──');
  const Z = fns.zweiFaktorZuruecksetzen;
  const faktoren = async (uid) => ((await admin.auth().getUser(uid)).multiFactor || {}).enrolledFactors || [];
  await scheitert('Studioleitung setzt NICHT zurück', Z.run({ uid: 'zfChef', grund: 'Handy verloren' }, als('zfLeiter')), /Geschäftsführung/);
  await scheitert('Mitarbeiterin auch nicht', Z.run({ uid: 'zfChef', grund: 'Handy verloren' }, als('zfMit')), /Geschäftsführung/);
  await scheitert('der Chef NICHT für sich selbst', Z.run({ uid: 'zfChef', grund: 'Handy verloren' }, als('zfChef')), /selbst/);
  await scheitert('der Chef NICHT in einer fremden Firma', Z.run({ uid: 'zfFremd', grund: 'Handy verloren' }, als('zfChef')), /Betrieb/);
  await scheitert('ohne Grund nicht', Z.run({ uid: 'zfAdmin', grund: ' ' }, als('zfChef')), /Grund/);
  pruefe('… und nach all dem ist nichts entfernt', (await faktoren('zfAdmin')).length === 1 && (await faktoren('zfChef')).length === 1 && (await faktoren('zfFremd')).length === 1);
  await Z.run({ uid: 'zfAdmin', grund: 'Handy verloren' }, als('zfChef'));
  pruefe('Chef setzt den zweiten Faktor eines anderen Kontos seiner Firma zurück', (await faktoren('zfAdmin')).length === 0);
  pruefe('… die anderen behalten ihren', (await faktoren('zfChef')).length === 1 && (await faktoren('zfFremd')).length === 1);
  const prot = (await db.collection('firmen/zfalpha/zfProtokoll').get()).docs.map((d) => d.data());
  pruefe('im Protokoll der Firma: wer, für wen, warum', prot.length === 1 && prot[0].von === 'zfChef' && prot[0].fuer === 'zfAdmin' &&
    prot[0].grund === 'Handy verloren' && prot[0].vonName === 'Chef mit' && prot[0].fuerName === 'Betreiber mit' && typeof prot[0].ts === 'number', JSON.stringify(prot));
  pruefe('keine Telefonnummer, kein Schlüssel im Protokoll', !/4915112345678|phone|secret/i.test(JSON.stringify(prot)));
  /* Der Betreiber hilft, wo eine Firma nur einen Chef hat — auch über
     die Firmengrenze. Der Eintrag landet bei der Firma der Person. */
  await db.doc('users/zfAdmin').update({ admin: true });
  await Z.run({ uid: 'zfFremd', grund: 'Neues Handy, altes weg' }, als('zfAdmin'));
  const protB = (await db.collection('firmen/beta/zfProtokoll').get()).docs.map((d) => d.data());
  pruefe('der Betreiber setzt auch in einer fremden Firma zurück — Eintrag dort, als Betreiber gekennzeichnet',
    (await faktoren('zfFremd')).length === 0 && protB.length === 1 && protB[0].alsBetreiber === true, JSON.stringify(protB));

  /* ── Die Regel für das Protokoll, beide Welten ── */
  protokoll.push('\n  ── Regel zfProtokoll ──');
  const { initializeTestEnvironment, assertFails, assertSucceeds } =
    require(path.join(__dirname, 'node_modules', '@firebase/rules-unit-testing'));
  const fs = require('fs');
  const env = await initializeTestEnvironment({ projectId: 'demo-regeltest',
    firestore: { host: '127.0.0.1', port: 8791, rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8') } });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await d.doc('firmen/eins').set({ name: 'Eins', aktiv: true });
    await d.doc('firmen/eins/zfProtokoll/p1').set({ ts: 1, fuerName: 'X', grund: 'Test' });
    await d.doc('zfProtokoll/p1').set({ ts: 1, fuerName: 'X', grund: 'Test' });
    await d.doc('users/pc').set({ name: 'C', role: 'chef', firma: 'eins', aktiv: true, studioKeys: [] });
    await d.doc('users/pl').set({ name: 'L', role: 'leiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/fc').set({ name: 'FC', role: 'chef', aktiv: true, studioKeys: [] });
    await d.doc('users/fl').set({ name: 'FL', role: 'leiter', aktiv: true, studioKeys: ['studio-1'] });
  });
  const fsAls = (u) => env.authenticatedContext(u).firestore();
  async function darf(n, v) { try { await assertSucceeds(v); bestanden++; protokoll.push('  ✓ ' + n); } catch (e) { gefallen++; protokoll.push('  ✗ ' + n + ' — ging nicht'); } }
  async function darfNicht(n, v) { try { await assertFails(v); bestanden++; protokoll.push('  ✓ ' + n); } catch (e) { gefallen++; protokoll.push('  ✗ ' + n + ' — GING DURCH'); } }
  for (const [welt, chef, leiter, p] of [['firmen/eins', 'pc', 'pl', 'firmen/eins/'], ['flach', 'fc', 'fl', '']]) {
    await darf(welt + ': der Chef liest das Protokoll', fsAls(chef).doc(p + 'zfProtokoll/p1').get());
    await darfNicht(welt + ': die Studioleitung NICHT', fsAls(leiter).doc(p + 'zfProtokoll/p1').get());
    await darfNicht(welt + ': auch der Chef schreibt NICHT hinein (nur der Server)', fsAls(chef).doc(p + 'zfProtokoll/p2').set({ ts: 2 }));
    await darfNicht(welt + ': … und löscht nichts', fsAls(chef).doc(p + 'zfProtokoll/p1').delete());
  }
  await env.cleanup();

  console.log('\nZwei-Faktor bei der Leitung (Runde 119, 124)\n' + protokoll.join('\n'));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
