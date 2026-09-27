/* ── Löschung beantragen (App Store 5.1.1(v), docs/APPSTORE.md) ───────

   „Wer ein Konto in der App anlegen kann, muss es in der App auch
   löschen können." Für Teammitglieder: beantragen → sofort gesperrt →
   die Geschäftsführung entfernt oder gibt wieder frei. Zeiten und
   Schichten gehören dem Betrieb.

   Die Funktionen laufen hier WIRKLICH, gegen Firestore- und
   Auth-Emulator:
   1. Ohne Bestätigung nichts; mit: aktiv:false und das Datum am Profil.
   2. Wer beantragt hat, kommt an der Geschäftsführung nicht vorbei:
      kontoLoeschen und beitrittZurueckziehen lehnen ab, Profil und
      Anmeldekonto bleiben.
   3. Die einzige Geschäftsführung kann nicht beantragen, eine von zweien
      schon; der Betreiber nicht.
   4. Zurücknehmen: nur die Geschäftsführung derselben Firma, nicht die
      Person selbst, nicht ohne Antrag.
   5. Entfernen: zugangEntfernen nimmt Profil und Anmeldekonto.
   Und die Regel, beide Richtungen:
   6. Die Person setzt oder löscht das Feld loeschungBeantragt NICHT
      selbst — ihren Namen ändert sie weiter (Gegenprobe).
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
const profil = async (uid) => { const s = await db.doc('users/' + uid).get(); return s.exists ? s.data() : null; };
const konto = async (uid) => { try { await admin.auth().getUser(uid); return true; } catch (e) { return false; } };

(async () => {
  const leer = await fetch('http://' + process.env.FIRESTORE_EMULATOR_HOST +
    '/emulator/v1/projects/demo-funktionen/databases/(default)/documents', { method: 'DELETE' });
  if (!leer.ok) throw new Error('Emulator nicht geleert');
  await fetch('http://' + process.env.FIREBASE_AUTH_EMULATOR_HOST + '/emulator/v1/projects/demo-funktionen/accounts', { method: 'DELETE' });

  /* Eigene Kennungen (siehe zweifaktor.test.js: nach dem Leeren fand die
     Abfrage in der Kette noch Konten anderer Durchläufe). */
  await db.doc('firmen/lzalpha').set({ name: 'Alpha', aktiv: true });
  await db.doc('firmen/lzbeta').set({ name: 'Beta', aktiv: true });
  await db.doc('firmen/lzgamma').set({ name: 'Gamma', aktiv: true });
  const konten = [
    ['lzChef', { name: 'Chef A', role: 'chef', firma: 'lzalpha', aktiv: true }],
    ['lzChef2', { name: 'Chef B', role: 'chef', firma: 'lzalpha', aktiv: true }],
    ['lzLeiter', { name: 'Leitung', role: 'leiter', firma: 'lzalpha', aktiv: true }],
    ['lzMit', { name: 'Mitarbeiterin', role: 'mitarbeiter', firma: 'lzalpha', aktiv: true }],
    ['lzMit2', { name: 'Mitarbeiter Zwei', role: 'mitarbeiter', firma: 'lzalpha', aktiv: true }],
    ['lzAdmin', { name: 'Betreiber', role: 'chef', firma: 'lzalpha', aktiv: true, admin: true }],
    ['lzSolo', { name: 'Einzige Chefin', role: 'chef', firma: 'lzbeta', aktiv: true }],
    ['lzFremd', { name: 'Fremde Chefin', role: 'chef', firma: 'lzgamma', aktiv: true }],
  ];
  for (const [uid, p] of konten) {
    await db.doc('users/' + uid).set(p);
    await admin.auth().createUser({ uid, email: uid.toLowerCase() + '@example.org', emailVerified: true });
  }

  protokoll.push('  ── 1. Beantragen ──');
  await scheitert('ohne Bestätigung nichts', fns.loeschungBeantragen.run({}, als('lzMit')), /bestätigen/);
  pruefe('… und die Person ist weiter aktiv', (await profil('lzMit')).aktiv === true);
  const vor = Date.now();
  const r = await fns.loeschungBeantragen.run({ bestaetigt: true }, als('lzMit'));
  const p1 = await profil('lzMit');
  pruefe('mit Bestätigung: sofort gesperrt (aktiv:false)', r.ok && p1.aktiv === false, JSON.stringify(p1));
  pruefe('das Datum steht am Profil', typeof p1.loeschungBeantragt === 'number' && p1.loeschungBeantragt >= vor, JSON.stringify(p1));
  pruefe('Firma, Rolle und Studios bleiben (die Geschäftsführung sieht den Antrag)', p1.firma === 'lzalpha' && p1.role === 'mitarbeiter');

  protokoll.push('\n  ── 2. Nicht an der Geschäftsführung vorbei ──');
  await scheitert('kontoLoeschen lehnt ab', fns.kontoLoeschen.run({ bestaetigt: true }, als('lzMit')), /beantragt/);
  pruefe('… Profil und Anmeldekonto sind noch da', !!(await profil('lzMit')) && await konto('lzMit'));
  await scheitert('beitrittZurueckziehen lehnt ab', fns.beitrittZurueckziehen.run({}, als('lzMit')), /beantragt/);
  pruefe('… die Firma bleibt stehen', (await profil('lzMit')).firma === 'lzalpha');
  await scheitert('ein zweiter Antrag geht nicht (gesperrt)', fns.loeschungBeantragen.run({ bestaetigt: true }, als('lzMit')), /freigegeben/);

  protokoll.push('\n  ── 3. Geschäftsführung und Betreiber ──');
  await scheitert('die einzige Geschäftsführung kann nicht beantragen', fns.loeschungBeantragen.run({ bestaetigt: true }, als('lzSolo')), /einzige Geschäftsführung/);
  pruefe('… und bleibt aktiv', (await profil('lzSolo')).aktiv === true);
  await scheitert('der Betreiber nicht', fns.loeschungBeantragen.run({ bestaetigt: true }, als('lzAdmin')), /Betreiber/);
  pruefe('… und bleibt aktiv', (await profil('lzAdmin')).aktiv === true);
  await fns.loeschungBeantragen.run({ bestaetigt: true }, als('lzChef2'));
  pruefe('eine von zwei Geschäftsführungen schon', (await profil('lzChef2')).aktiv === false);

  protokoll.push('\n  ── 4. Zurücknehmen ──');
  await scheitert('nicht durch die Studioleitung', fns.loeschungZuruecknehmen.run({ uid: 'lzMit' }, als('lzLeiter')), /Geschäftsführung/);
  await scheitert('nicht durch die Geschäftsführung einer anderen Firma', fns.loeschungZuruecknehmen.run({ uid: 'lzMit' }, als('lzFremd')), /anderen Betrieb/);
  await scheitert('nicht durch die Geschäftsführung mit eigenem Antrag — auch nicht für sich selbst',
    fns.loeschungZuruecknehmen.run({ uid: 'lzChef2' }, als('lzChef2')), /andere Geschäftsführung/);
  await scheitert('nicht ohne Antrag', fns.loeschungZuruecknehmen.run({ uid: 'lzMit2' }, als('lzChef')), /kein Löschantrag/);
  pruefe('bis hier ist die Mitarbeiterin weiter gesperrt', (await profil('lzMit')).aktiv === false);
  await fns.loeschungZuruecknehmen.run({ uid: 'lzChef2' }, als('lzChef'));
  const p2 = await profil('lzChef2');
  pruefe('die andere Geschäftsführung gibt wieder frei: aktiv, Antrag weg', p2.aktiv === true && !('loeschungBeantragt' in p2), JSON.stringify(p2));

  protokoll.push('\n  ── 5. Entfernen ──');
  await fns.zugangEntfernen.run({ uid: 'lzMit' }, als('lzChef'));
  pruefe('zugangEntfernen nimmt Profil und Anmeldekonto', !(await profil('lzMit')) && !(await konto('lzMit')));

  /* ── 6. Die Regel ── */
  protokoll.push('\n  ── 6. Regel: das Feld gehört dem Server ──');
  const { initializeTestEnvironment, assertFails, assertSucceeds } =
    require(path.join(__dirname, 'node_modules', '@firebase/rules-unit-testing'));
  const fs = require('fs');
  const env = await initializeTestEnvironment({ projectId: 'demo-regeltest',
    firestore: { host: '127.0.0.1', port: 8791, rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8') } });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await d.doc('firmen/eins').set({ name: 'Eins', aktiv: true });
    await d.doc('users/antrag').set({ name: 'A', role: 'mitarbeiter', firma: 'eins', aktiv: false, loeschungBeantragt: 1, studioKeys: [] });
    await d.doc('users/normal').set({ name: 'N', role: 'mitarbeiter', firma: 'eins', aktiv: true, studioKeys: [] });
  });
  const fsAls = (u) => env.authenticatedContext(u).firestore();
  async function darf(n, v) { try { await assertSucceeds(v); bestanden++; protokoll.push('  ✓ ' + n); } catch (e) { gefallen++; protokoll.push('  ✗ ' + n + ' — ging nicht: ' + e.message); } }
  async function darfNicht(n, v) { try { await assertFails(v); bestanden++; protokoll.push('  ✓ ' + n); } catch (e) { gefallen++; protokoll.push('  ✗ ' + n + ' — GING DURCH'); } }
  /* Dieselbe (compat-)Firebase, die rules-unit-testing benutzt — sonst
     erkennt der Client die Lösch-Marke nicht. */
  const compat = require(path.join(__dirname, 'node_modules', 'firebase', 'compat', 'app'));
  require(path.join(__dirname, 'node_modules', 'firebase', 'compat', 'firestore'));
  const deleteField = () => (compat.default || compat).firestore.FieldValue.delete();
  await darfNicht('wer beantragt hat, löscht das Feld NICHT selbst', fsAls('antrag').doc('users/antrag').update({ loeschungBeantragt: deleteField() }));
  await darfNicht('… und schreibt kein anderes Datum hinein', fsAls('antrag').doc('users/antrag').update({ loeschungBeantragt: 2 }));
  await darfNicht('niemand setzt es sich selbst (ohne Sperre wäre es nur Anzeige)', fsAls('normal').doc('users/normal').update({ loeschungBeantragt: 3 }));
  await darf('GEGENPROBE: den eigenen Namen ändert man weiter', fsAls('normal').doc('users/normal').update({ name: 'N2' }));
  await env.cleanup();

  console.log('\nLöschung beantragen (App Store 5.1.1(v))\n' + protokoll.join('\n'));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
