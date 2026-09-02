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

   Dazu zwei Auszählungen, die für EINE offene Entscheidung gebraucht
   werden (siehe OFFEN.md, „Firmengrenze auf den flachen Pfaden"):

     5. FIRMEN-ZUORDNUNG — wie viele Profile tragen ein Feld `firma`,
        und mit welchem Wert. Davon hängt ab, ob sich die flachen
        Regeln überhaupt auf „gehört zur Voreinstellung" einengen
        lassen: trägt schon jedes Konto eine Kennung, sperrte eine
        Prüfung auf „leer" den ganzen Betrieb aus seinen eigenen Daten
        aus.
     6. WO LIEGEN DIE DATEN — wie viele Dokumente stehen noch flach
        (`studios/…`, `board`, …) und wie viele unter `firmen/<k>/…`.
        Ist flach nichts mehr übrig, ist die einfachere Lösung, den
        flachen Regelsatz ganz zu streichen (Schritt 7 in OFFEN.md).

   Beides ist reines Lesen und beantwortet eine Frage, die sich von
   aussen nicht raten lässt.

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

  /* ── 5. Firmen-Zuordnung ──────────────────────────────────────────
     Nicht als Fehlerliste, sondern als Zählung: hier gibt es kein
     „falsch", nur einen Zustand, den jemand kennen muss, bevor er die
     flachen Regeln einengt. */
  const nachFirma = new Map();
  profile.forEach(p => {
    const f = Object.prototype.hasOwnProperty.call(p, 'firma')
      ? String(p.firma === null || p.firma === undefined ? '' : p.firma)
      : '(Feld fehlt)';
    nachFirma.set(f, (nachFirma.get(f) || 0) + 1);
  });
  console.log('── FIRMEN-ZUORDNUNG der ' + profile.length + ' Profile ──');
  [...nachFirma.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([f, n]) => console.log('   ' +
      String(f === '' ? '(leer)' : f).padEnd(28) + String(n).padStart(4)));
  const ohneFirma = (nachFirma.get('(Feld fehlt)') || 0) + (nachFirma.get('') || 0);
  console.log('   ' + '—'.repeat(32));
  console.log('   ohne Kennung (Feld fehlt oder leer): ' + ohneFirma);
  console.log('   mit Kennung:                         ' + (profile.length - ohneFirma) + '\n');

  /* ── 6. Wo liegen die Daten ───────────────────────────────────────
     Gezählt wird mit einer Aggregat-Abfrage: count() liest nicht die
     Dokumente, nur ihre Anzahl. Bei 13 Studios und Monaten an Verlauf
     waere das Herunterladen sonst teuer — und wir wollen hier gar
     nichts sehen, nur zaehlen. */
  const FLACH = [
    'board', 'announcements', 'documents', 'certificates',
    'studios/studio-0/todos', 'studios/studio-0/cleaning',
    'channels/allgemein/messages',
  ];
  async function zaehle(pfad) {
    try { return (await db.collection(pfad).count().get()).data().count; }
    catch (e) { return '?'; }
  }
  console.log('── WO LIEGEN DIE DATEN (Anzahl Dokumente) ──');
  const firmen = await db.collection('firmen').get();
  const kennungen = firmen.docs.map(d => d.id);
  console.log('   Firmen angelegt: ' + (kennungen.join(', ') || 'keine') + '\n');
  console.log('   Sammlung                          flach   unter firmen/');
  for (const pfad of FLACH) {
    const f = await zaehle(pfad);
    let u = 0;
    for (const k of kennungen) {
      const n = await zaehle('firmen/' + k + '/' + pfad);
      if (typeof n === 'number') u += n;
    }
    console.log('   ' + pfad.padEnd(34) + String(f).padStart(5) +
      String(kennungen.length ? u : '—').padStart(16));
  }
  console.log('\n   Stehen die flachen Spalten auf 0, ist der flache Regelsatz');
  console.log('   entbehrlich — das ist der einfachere der beiden Wege.\n');

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
