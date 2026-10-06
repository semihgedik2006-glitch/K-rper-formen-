/* ── ANMELDE-MAILS ÜBER DEN EIGENEN VERSAND (Runde 146) ──────────────
   Aus dem Betrieb, 6.10.2026: „die Mail Bestätigung geht auch oft nicht,
   und manche Mails kommen nie an auch nicht im Spam".

   authMailSenden wird hier AUSGEFÜHRT, gegen Firestore- und Auth-
   Emulator, mit abgefangenem Versand. Geprüft wird:
     1. Bestätigen: Mail auf Deutsch, Absender „StudioChat", Link in die
        App (?mode=verifyEmail&oobCode=…), kein „project-…" und kein
        firebaseapp.com im Text.
     2. Der Code im Link ist echt: mit ihm lässt sich die Adresse im
        Auth-Emulator wirklich bestätigen. Danach: „schon bestätigt",
        keine zweite Mail.
     3. Passwort: Mail mit Link (?mode=resetPassword), nennt 8 Zeichen.
        Für eine Adresse OHNE Konto dieselbe Antwort, aber keine Mail —
        sonst liesse sich abfragen, wer ein Konto hat.
     4. Bremse: zweite Mail innerhalb einer Minute → abgewiesen; mehr als
        8 am Tag → abgewiesen.
     5. Ohne SMTP: Fehler „kein-smtp" (die App nimmt dann den alten Weg).
        Scheitert der Versand: Fehler, nicht „ok".
     6. Bestätigen ohne Anmeldung → abgewiesen. Unsinnige Adresse → abgewiesen.
     7. Konto löschen räumt die Zähler mit weg.
   ───────────────────────────────────────────────────────────────────── */
const path = require('path');

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8791';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'demo-funktionen';
process.env.GOOGLE_CLOUD_PROJECT = 'demo-funktionen';

const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
const fns = require(path.join(__dirname, '..', '..', 'functions', 'index.js'));
const db = admin.firestore();
const I = fns.__intern;

let bestanden = 0, gefallen = 0;
const protokoll = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) { bestanden++; protokoll.push('  ✓ ' + name); }
  else { gefallen++; protokoll.push('  ✗ ' + name + (zusatz ? '\n      ' + zusatz : '')); }
}
async function scheitert(name, versprechen, muster) {
  try { await versprechen; gefallen++; protokoll.push('  ✗ ' + name + ' — GING DURCH'); }
  catch (e) {
    const ok = !muster || muster.test(String(e.message || e) + ' ' + String(e.code || ''));
    if (ok) { bestanden++; protokoll.push('  ✓ ' + name); }
    else { gefallen++; protokoll.push('  ✗ ' + name + ' — falscher Grund: ' + e.message); }
  }
}
const als = (uid) => ({ auth: { uid } });

(async () => {
  const gesendet = [];
  let versandKaputt = false;
  I.mailerFuerDurchlauf({ sendMail: async (m) => {
    if (versandKaputt) throw new Error('SMTP weg');
    gesendet.push(m); return { messageId: 'x' };
  } });
  process.env.SMTP_USER = process.env.SMTP_USER || 'versand@example.org';

  const auth = admin.auth();
  const mail = 'lea.' + Date.now() + '@example.org';
  const u = await auth.createUser({ email: mail, password: 'geheim-123', displayName: 'Lea' });
  for (const d of (await db.collection('mailVersand').get()).docs) await d.ref.delete();

  // 1. Bestätigen
  const r1 = await fns.authMailSenden.run({ art: 'bestaetigen' }, als(u.uid));
  const m1 = gesendet[0] || {};
  pruefe('1. Bestätigen: eine Mail an die Adresse des Kontos', r1 && r1.ok && gesendet.length === 1 && m1.to === mail, JSON.stringify(r1));
  pruefe('… auf Deutsch, Absender „StudioChat"', /bestätige deine E-Mail-Adresse/.test(m1.subject) && /^"StudioChat" </.test(m1.from), m1.subject + ' / ' + m1.from);
  const link = ((m1.text || '').match(/https?:\/\/\S+/) || [''])[0];
  pruefe('… Link in die App: ?mode=verifyEmail&oobCode=…', /^https:\/\/formenchat\.web\.app\/\?mode=verifyEmail&oobCode=[^&\s]+$/.test(link), link);
  pruefe('… kein „project-…", kein firebaseapp.com, kein Englisch', !/project-|firebaseapp\.com|Hello|Thanks/.test((m1.text || '') + (m1.html || '')));
  pruefe('… mit Text- UND HTML-Teil (reine HTML-Mails landen eher im Spam)', !!m1.text && !!m1.html);

  // 2. Der Code ist echt
  const code = decodeURIComponent(new URL(link).searchParams.get('oobCode') || '');
  const antwort = await fetch('http://' + process.env.FIREBASE_AUTH_EMULATOR_HOST + '/identitytoolkit.googleapis.com/v1/accounts:update?key=fake',
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ oobCode: code }) });
  const nachher = await auth.getUser(u.uid);
  pruefe('2. Mit dem Code im Link lässt sich die Adresse wirklich bestätigen', antwort.ok && nachher.emailVerified === true, antwort.status + ' / ' + nachher.emailVerified);
  await db.collection('mailVersand').doc(u.uid).delete();
  const r2 = await fns.authMailSenden.run({ art: 'bestaetigen' }, als(u.uid));
  pruefe('… danach: „schon bestätigt", keine zweite Mail', r2 && r2.schon === true && gesendet.length === 1, JSON.stringify(r2));

  // 3. Passwort
  const r3 = await fns.authMailSenden.run({ art: 'passwort', email: mail.toUpperCase() }, {});
  const m3 = gesendet[1] || {};
  pruefe('3. Passwort (ohne Anmeldung, Adresse in Grossbuchstaben): Mail an die Adresse', r3 && r3.ok && m3.to === mail, JSON.stringify(r3) + ' ' + m3.to);
  pruefe('… mit Link ?mode=resetPassword, nennt 8 Zeichen', /\?mode=resetPassword&oobCode=/.test(m3.text || '') && /mindestens 8 Zeichen/.test(m3.text || ''));
  const vorher = gesendet.length;
  const r4 = await fns.authMailSenden.run({ art: 'passwort', email: 'niemand.' + Date.now() + '@example.org' }, {});
  pruefe('… Adresse ohne Konto: dieselbe Antwort, aber keine Mail', r4 && r4.ok === true && gesendet.length === vorher, JSON.stringify(r4));

  // 4. Bremse
  await scheitert('4. Zweite Passwort-Mail innerhalb einer Minute → abgewiesen',
    fns.authMailSenden.run({ art: 'passwort', email: mail }, {}), /Minute/);
  const id = I.authMailDocId(mail);
  await db.collection('mailVersand').doc(id).set({ zuletzt: Date.now() - 120000, tag: new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' }), n: I.AUTH_MAIL_PRO_TAG });
  await scheitert('… mehr als ' + I.AUTH_MAIL_PRO_TAG + ' am Tag → abgewiesen',
    fns.authMailSenden.run({ art: 'passwort', email: mail }, {}), /mehrmals/);
  await db.collection('mailVersand').doc(id).delete();

  // 5. Ohne SMTP / Versand kaputt
  versandKaputt = true;
  await scheitert('5. Versand scheitert → Fehler (nicht „ok"), die App nimmt den alten Weg',
    fns.authMailSenden.run({ art: 'passwort', email: mail }, {}), /versand|unavailable/);
  versandKaputt = false;
  await db.collection('mailVersand').doc(id).delete();
  I.mailerFuerDurchlauf(null);
  const alt = { h: process.env.SMTP_HOST, u: process.env.SMTP_USER, p: process.env.SMTP_PASS };
  delete process.env.SMTP_HOST; delete process.env.SMTP_PASS;
  await scheitert('… ohne SMTP → „kein-smtp"', fns.authMailSenden.run({ art: 'passwort', email: mail }, {}), /kein-smtp/);
  if (alt.h) process.env.SMTP_HOST = alt.h; if (alt.p) process.env.SMTP_PASS = alt.p;
  I.mailerFuerDurchlauf({ sendMail: async (m) => { gesendet.push(m); return { messageId: 'x' }; } });

  // 6. Unsinn
  await scheitert('6. Bestätigen ohne Anmeldung → abgewiesen', fns.authMailSenden.run({ art: 'bestaetigen' }, {}), /einloggen|unauthenticated/);
  await scheitert('… keine Adresse → abgewiesen', fns.authMailSenden.run({ art: 'passwort', email: 'kein-at' }, {}), /gültige/);
  await scheitert('… unbekannte Art → abgewiesen', fns.authMailSenden.run({ art: 'irgendwas' }, als(u.uid)), /Unbekannte/);

  // 7. Aufräumen
  await db.collection('mailVersand').doc(u.uid).set({ n: 1 });
  await db.collection('mailVersand').doc(id).set({ n: 1 });
  await I.authMailSpurenWeg(u.uid, mail);
  const rest = (await db.collection('mailVersand').doc(u.uid).get()).exists || (await db.collection('mailVersand').doc(id).get()).exists;
  pruefe('7. Konto weg → Zähler weg (je Konto und je Adresse)', !rest);

  await auth.deleteUser(u.uid).catch(() => {});
  console.log('\n── Anmelde-Mails über den eigenen Versand ──');
  protokoll.forEach((z) => console.log(z));
  console.log('\n' + (gefallen
    ? '✗ ' + gefallen + ' Fehler, ' + bestanden + ' in Ordnung'
    : '✓ Anmelde-Mails: deutsch, eigener Absender, echter Link, gebremst, ohne Verrat — ' + bestanden + ' Zusicherungen'));
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
