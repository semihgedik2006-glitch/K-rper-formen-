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

  console.log('\nZwei-Faktor bei der Leitung (Runde 119)\n' + protokoll.join('\n'));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
