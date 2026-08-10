/* ── Konten durchsehen: was passt nicht zusammen? ──────────────────────
   LIEST NUR. Dieses Werkzeug schreibt nichts und löscht nichts — es
   sagt dir, was da ist, und du entscheidest.

   Deshalb darf es auch gegen das echte Projekt laufen, anders als
   umzug.js und probe-konto.js.

   Es vergleicht zwei Listen, die auseinanderlaufen können:

     users/…            die Profile in Firestore
     Authentication     die Anmeldekonten

   Vier Dinge fallen dabei auf:

     1. VERWAIST — ein Profil ohne Anmeldekonto. Meist der Rest eines
        gelöschten Zugangs. Es zählt in Listen mit, bekommt
        Benachrichtigungen und taucht in Auswertungen auf, aber niemand
        kann sich damit anmelden.
     2. OHNE PROFIL — ein Anmeldekonto ohne Profil. Wer sich damit
        anmeldet, kommt nicht hinein.
     3. DOPPELT — dieselbe E-Mail an mehreren Profilen.
     4. UNBESTÄTIGT — Anmeldekonto mit nicht bestätigter Adresse.

   Aufruf:
     node tools/konten-pruefen.js --projekt formenchat
     node tools/konten-pruefen.js --projekt formenchat-probe        */

const path = require('path');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };

const projekt = arg('--projekt') || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
if (!projekt) {
  console.error('Aufruf: node tools/konten-pruefen.js --projekt <projekt>');
  process.exit(2);
}

let admin;
try { admin = require('firebase-admin'); }
catch (e) { admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin')); }

admin.initializeApp({ projectId: projekt });
const db = admin.firestore();

(async () => {
  console.log('Projekt: ' + projekt + '   (nur lesen)\n');

  const snap = await db.collection('users').get();
  const profile = snap.docs.map(d => Object.assign({ uid: d.id }, d.data() || {}));

  // Alle Anmeldekonten holen, seitenweise
  const konten = new Map();
  let seite = await admin.auth().listUsers(1000);
  while (true) {
    seite.users.forEach(u => konten.set(u.uid, u));
    if (!seite.pageToken) break;
    seite = await admin.auth().listUsers(1000, seite.pageToken);
  }

  console.log('Profile in users : ' + profile.length);
  console.log('Anmeldekonten    : ' + konten.size + '\n');

  const verwaist = profile.filter(p => !konten.has(p.uid) && p.uid !== 'system');
  const ohneProfil = [...konten.values()].filter(k => !profile.some(p => p.uid === k.uid));

  const nachMail = new Map();
  profile.forEach(p => {
    const m = String(p.email || '').toLowerCase();
    if (!m) return;
    if (!nachMail.has(m)) nachMail.set(m, []);
    nachMail.get(m).push(p);
  });
  const doppelt = [...nachMail.entries()].filter(([, v]) => v.length > 1);
  const unbestaetigt = [...konten.values()].filter(k => k.email && !k.emailVerified);

  function block(titel, was, zeilen) {
    console.log('── ' + titel + ': ' + zeilen.length + ' ──');
    if (!zeilen.length) { console.log('   nichts\n'); return; }
    console.log('   ' + was);
    zeilen.forEach(z => console.log('   ' + z));
    console.log('');
  }

  block('VERWAIST (Profil ohne Anmeldekonto)',
    'Rolle        Name                     E-Mail                          Kennung',
    verwaist.map(p =>
      String(p.role || '?').padEnd(12) + String(p.name || '—').slice(0, 24).padEnd(25) +
      String(p.email || '—').slice(0, 31).padEnd(32) + p.uid));

  block('OHNE PROFIL (Anmeldekonto ohne Eintrag in users)',
    'E-Mail                          Kennung',
    ohneProfil.map(k => String(k.email || '—').slice(0, 31).padEnd(32) + k.uid));

  block('DOPPELT (dieselbe E-Mail mehrfach)',
    'E-Mail                          Rolle        Kennung        anmeldbar?',
    doppelt.flatMap(([m, v]) => v.map(p =>
      String(m).slice(0, 31).padEnd(32) + String(p.role || '?').padEnd(12) +
      p.uid.slice(0, 14) + ' ' + (konten.has(p.uid) ? 'JA' : 'nein'))));

  block('UNBESTÄTIGTE E-MAIL',
    'E-Mail',
    unbestaetigt.map(k => String(k.email)));

  if (verwaist.length || doppelt.length) {
    console.log('── Was tun ──');
    if (doppelt.length) {
      console.log('  DOPPELT: das Profil mit "anmeldbar? nein" ist der Rest eines');
      console.log('  gelöschten Zugangs. Es in der App unter Verwaltung → Team');
      console.log('  entfernen — dort siehst du, was daran hängt, bevor es weg ist.');
    }
    if (verwaist.length) {
      console.log('  VERWAIST: dieselben Konten. Sie bekommen Benachrichtigungen');
      console.log('  und zählen in Auswertungen mit, obwohl niemand dahintersteht.');
    }
    console.log('\n  Dieses Werkzeug löscht nichts. Absicht: was weg soll, soll');
    console.log('  jemand sehen, bevor es weg ist.');
  } else {
    console.log('✓ Nichts Auffälliges.');
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
