/* ── Der Mailversand nach dem Sprung auf Nodemailer 9 ─────────────────
   Nodemailer war auf 6.9.14. Dafür stehen acht Meldungen offen, zwei
   davon hoch: die Adress-Zerlegung lässt sich mit einer gebauten
   Adresse in eine Endlosrekursion treiben, und eine Adresse kann in
   einer anderen Domain landen als der, die dasteht. Beides trifft genau
   unseren Fall — die Empfängeradresse kommt aus einem Formular und geht
   ohne Zwischenschritt an Endkundinnen.

   Der Sprung von 6 auf 9 ist ein Hauptversionswechsel. Geprüft wird
   deshalb die Form, die functions/index.js benutzt: dieselben Optionen
   beim Transport, dieselben Felder bei der Nachricht. Gesendet wird
   nichts — jsonTransport rendert die fertige Nachricht, statt sie
   wegzuschicken.

   Was das NICHT beweist: dass ein echter SMTP-Server sie annimmt. Dafür
   braucht es die Zugangsdaten, und die liegen nicht hier.
   ───────────────────────────────────────────────────────────────────── */
const path = require('path');

const NM = path.join(__dirname, '..', 'functions', 'node_modules', 'nodemailer');
const nodemailer = require(NM);
const version = require(path.join(NM, 'package.json')).version;

const errs = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) console.log('  ✓ ' + name);
  else { console.log('  ✗ ' + name + (zusatz ? '  — ' + zusatz : '')); errs.push(name); }
}

(async () => {
  console.log('Nodemailer ' + version + '\n');
  pruefe('Hauptversion 9 oder neuer', parseInt(version, 10) >= 9, version);

  /* Dieselben Optionen wie getMailer() in functions/index.js. */
  const echterTransport = nodemailer.createTransport({
    host: 'smtp.example.com', port: 587, secure: false,
    auth: { user: 'konto', pass: 'geheim' }
  });
  pruefe('Transport mit unseren Optionen lässt sich bauen', !!echterTransport);

  /* Für das Rendern derselbe Weg ohne Netz. */
  const t = nodemailer.createTransport({ jsonTransport: true });

  const info = await t.sendMail({
    from: '"Körperformen Hürth" <termine@example.com>',
    to: 'kundin@example.com',
    subject: 'Dein Termin am Montag',
    text: 'Hallo Anna,\n\nwir sehen uns am Montag um 09:00 Uhr.\n'
  });
  const nachricht = JSON.parse(info.message);

  pruefe('Empfänger steht im Umschlag',
    info.envelope && info.envelope.to && info.envelope.to[0] === 'kundin@example.com',
    JSON.stringify(info.envelope));
  pruefe('Absenderadresse bleibt unsere',
    info.envelope && info.envelope.from === 'termine@example.com',
    JSON.stringify(info.envelope && info.envelope.from));
  pruefe('Der Anzeigename kommt mit (er steht im Postfach der Kundin)',
    nachricht.from && nachricht.from.name === 'Körperformen Hürth',
    JSON.stringify(nachricht.from));
  pruefe('Betreff und Text kommen an',
    nachricht.subject === 'Dein Termin am Montag' && /Montag um 09:00/.test(nachricht.text));

  /* Umlaute im Anzeigenamen sind der Normalfall, nicht der Sonderfall:
     „Körperformen" steht in jeder Mail. */
  const info2 = await t.sendMail({
    from: '"Körperformen Brühl" <termine@example.com>',
    to: 'a.mueller@example.com', subject: 'Grüße', text: 'Öl, Übung, Maß'
  });
  const n2 = JSON.parse(info2.message);
  pruefe('Umlaute überstehen Betreff, Text und Anzeigename',
    n2.subject === 'Grüße' && /Öl, Übung, Maß/.test(n2.text) &&
    n2.from.name === 'Körperformen Brühl');

  /* Gegenprobe: eine Adresse, die es nicht gibt, darf nicht stillschweigend
     zu einer gültigen werden. */
  let kaputt = null;
  try {
    await t.sendMail({ from: '"X" <a@example.com>', to: 'keine-adresse', subject: 'x', text: 'x' });
  } catch (e) { kaputt = e; }
  const info3 = kaputt ? null : await t.sendMail({
    from: '"X" <a@example.com>', to: 'keine-adresse', subject: 'x', text: 'x'
  });
  pruefe('GEGENPROBE unbrauchbare Adresse wird nicht zu einer echten Domain',
    !!kaputt || !(info3 && info3.envelope.to || []).some(a => /@/.test(a)),
    info3 ? JSON.stringify(info3.envelope.to) : String(kaputt && kaputt.message));

  console.log(errs.length
    ? '\n✗ ' + errs.length + ' Fehler beim Mailversand'
    : '\n✓ Mailversand: Nodemailer ' + version + ' rendert unsere Nachrichten ' +
      'unverändert — Empfänger, Absender, Anzeigename, Umlaute');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
