/* ── Ein Profil auf eine neue Anmelde-Kennung übertragen ───────────────
   Nur für die Probe-Umgebung.

   WARUM ES DAS BRAUCHT
   Ein Firestore-Export enthält die Daten, aber NICHT die Konten. Die
   liegen in Firebase Authentication, und jedes Projekt vergibt eigene
   Kennungen. Wer sich im Probe-Projekt mit derselben E-Mail anmeldet,
   bekommt trotzdem eine ANDERE Kennung — und die App findet unter ihr
   kein Profil. Sie meldet dann:

       Profilfehler: Missing or insufficient permissions.

   Das ist kein Rechteproblem, auch wenn es so klingt. Es gibt das
   Profil schlicht nicht.

   Dieses Werkzeug sucht das Profil zu einer E-Mail in users und legt
   eine Kopie unter der neuen Kennung an. Das Original bleibt liegen.

   Aufruf (in Google Cloud Shell):
     node tools/probe-konto.js --projekt formenchat-probe \
       --email chef@example.de --uid <neue Kennung aus Authentication>

   Ohne --uid werden nur die gefundenen Profile aufgelistet.          */
const path = require('path');

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };

const projekt = arg('--projekt');
const email = arg('--email');
let uid = arg('--uid');

if (!projekt) {
  console.error('Aufruf: node tools/probe-konto.js --projekt <projekt> --email <adresse> [--uid <kennung>]');
  process.exit(2);
}
/* Dieselbe Sperre wie beim Umzug: dieses Werkzeug hat im Betrieb nichts
   zu suchen. Dort legt man Konten in der App an, nicht per Skript. */
if (!/-probe$/.test(projekt)) {
  console.error('Dieses Werkzeug ist nur für Probe-Projekte. "' + projekt + '" ist keins.');
  process.exit(2);
}

let admin;
try { admin = require('firebase-admin'); }
catch (e) { admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin')); }

admin.initializeApp({ projectId: projekt });
const db = admin.firestore();

(async () => {
  const snap = await db.collection('users').get();
  console.log('Profile in users: ' + snap.size);

  if (!email) {
    console.log('\nVorhandene Profile (E-Mail · Rolle · Kennung):');
    snap.docs.forEach(d => {
      const u = d.data() || {};
      console.log('  ' + String(u.email || '—').padEnd(32) +
        String(u.role || '—').padEnd(12) + d.id);
    });
    console.log('\nMit --email <adresse> --uid <neue Kennung> übertragen.');
    process.exit(0);
  }

  const treffer = snap.docs.filter(d =>
    String((d.data() || {}).email || '').toLowerCase() === email.toLowerCase());

  if (!treffer.length) {
    console.error('Kein Profil mit der E-Mail ' + email + ' gefunden.');
    console.error('Ohne --email listet dieses Werkzeug alle auf.');
    process.exit(1);
  }
  /* Mehrere Profile mit derselben E-Mail sind keine Seltenheit: ein
     Konto als Chef, eins als Mitarbeiter, aus verschiedenen Zeiten. Das
     Werkzeug entscheidet das NICHT selbst — welches gemeint ist, weiss
     nur der Mensch, und die falsche Wahl gibt jemandem eine Rolle, die
     er nicht haben soll. */
  let alt = treffer[0];
  if (treffer.length > 1) {
    const von = arg('--von');
    const gewaehlt = von ? treffer.filter(d => d.id === von) : [];
    if (!gewaehlt.length) {
      console.error('\nMehrere Profile mit dieser E-Mail:');
      treffer.forEach(d => {
        const u = d.data() || {};
        console.error('  ' + String(u.role || '?').padEnd(12) +
          String(u.name || '(ohne Namen)').padEnd(24) + d.id);
      });
      console.error('\nWelches gemeint ist, entscheidest du:');
      console.error('  … --von ' + treffer[treffer.length - 1].id);
      process.exit(1);
    }
    alt = gewaehlt[0];
  }
  console.log('Gefunden: ' + (alt.data().name || '(ohne Namen)') +
    ' · ' + (alt.data().role || '?') + ' · alte Kennung ' + alt.id);

  /* Die neue Kennung selbst holen, statt sie abtippen zu lassen.
     Genau dabei ist es beim ersten Versuch schiefgegangen: eine
     36-Zeichen-Kennung, die mit dem Platzhalter aus meinem Beispiel
     anfing. Firebase weiss die Antwort — also fragen wir Firebase. */
  let ziel = uid;
  if (!ziel) {
    try {
      const konto = await admin.auth().getUserByEmail(email);
      ziel = konto.uid;
      console.log('Anmeldekonto in ' + projekt + ': ' + ziel);
    } catch (e) {
      console.error('\nKein Anmeldekonto für ' + email + ' in ' + projekt + '.');
      console.error('Erst anlegen: Firebase-Konsole → Authentication → Nutzer hinzufügen.');
      console.error('(Fehler: ' + (e && e.code ? e.code : e) + ')');
      process.exit(1);
    }
  }
  uid = ziel;
  if (uid === alt.id) {
    console.log('\nDie Kennung stimmt bereits überein — nichts zu tun.');
    process.exit(0);
  }

  /* Firebase-Kennungen sind 28 Zeichen. Weicht die Länge ab, ist es
     fast immer ein Kopierfehler — und ein Profil unter einer falschen
     Kennung ist stiller Müll: die Anmeldung findet es nie. */
  if (uid.length !== 28) {
    console.error('\n⚠ "' + uid + '" ist ' + uid.length + ' Zeichen lang.');
    console.error('  Firebase-Kennungen haben 28. Sieht nach einem Kopierfehler aus.');
    console.error('  Firebase-Konsole → Authentication → Nutzer → Spalte "Nutzer-UID".');
    console.error('  Wenn es doch stimmt: --trotzdem anhängen.');
    if (!process.argv.includes('--trotzdem')) process.exit(1);
  }

  await db.collection('users').doc(uid).set(alt.data(), { merge: false });
  console.log('\n✓ Profil kopiert auf ' + uid);
  console.log('  Das alte Profil unter ' + alt.id + ' bleibt liegen.');
  console.log('\n  Jetzt in der App neu laden und anmelden.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
