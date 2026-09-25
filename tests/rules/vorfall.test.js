/* ── Datenschutzvorfall melden (P-02, Runde 113) ─────────────────────

   Aus dem Betrieb, 25.9.2026:
     „es soll einen knopf geben der mir nach ausfüllung sofort eine mail
      schickt mit einer bestimmten betonung von wichtigkeit"

   vorfallMelden wird hier AUSGEFÜHRT, gegen den Emulator. Ohne SMTP
   (wie hier) darf die Antwort nicht behaupten, eine Mail sei raus —
   gespeichert wird trotzdem. Geprüft wird:

     1. Ein Mitarbeiter meldet: die Meldung liegt in /vorfaelle, mit
        Name, Firma, Text und mail: 'nicht eingerichtet'; die Antwort
        sagt mail: false und nennt die Frist.
     2. Ohne Text → abgewiesen. Ohne Anmeldung → abgewiesen.
        Nicht freigegeben → abgewiesen.
     3. Die Tagesgrenze: die sechste Meldung an einem Tag → abgewiesen.
     4. Die Mail selbst: Wichtigkeit hoch und „DRINGEND" im Betreff —
        geprüft an einem Ersatz-Versender, der festhält, was er bekommt.
   ───────────────────────────────────────────────────────────────────── */
const path = require('path');

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8791';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'demo-funktionen';
process.env.GOOGLE_CLOUD_PROJECT = 'demo-funktionen';
delete process.env.SMTP_HOST; delete process.env.SMTP_USER; delete process.env.SMTP_PASS;

const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
const fns = require(path.join(__dirname, '..', '..', 'functions', 'index.js'));
const db = admin.firestore();

let bestanden = 0, gefallen = 0;
const protokoll = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) { bestanden++; protokoll.push('  ✓ ' + name); }
  else { gefallen++; protokoll.push('  ✗ ' + name + (zusatz ? '\n      ' + zusatz : '')); }
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
  await db.doc('users/mara').set({ name: 'Mara', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'], email: 'mara@example.org' });
  await db.doc('users/neu').set({ name: 'Neu', role: 'mitarbeiter', firma: 'koerperformen', aktiv: false, studioKeys: ['studio-1'] });
  await db.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });

  // ══ 1. Melden ohne SMTP ══
  const r = await fns.vorfallMelden.run({ was: 'Am Empfang lag eine Liste mit Krankmeldungen offen herum.',
    wann: 'heute 09:10', betroffen: 'Drei Mitarbeiterinnen', laeuft: 'nein', rueckruf: '0170 123' }, als('mara'));
  const d = r && r.id ? (await db.doc('vorfaelle/' + r.id).get()).data() : null;
  pruefe('die Meldung liegt in /vorfaelle', !!d);
  pruefe('mit Name, Firma, Text und Rückruf', !!d && d.name === 'Mara' && d.firma === 'koerperformen' && /Krankmeldungen/.test(d.was) && d.rueckruf === '0170 123', JSON.stringify(d));
  pruefe('ohne SMTP: mail „nicht eingerichtet" — nicht „gesendet"', !!d && d.mail === 'nicht eingerichtet', d && d.mail);
  pruefe('die Antwort sagt mail: false und nennt die Frist', r && r.mail === false && /\d{2}\.\d{2}\.\d{4}/.test(r.fristBis || ''), JSON.stringify(r));
  pruefe('sie steht nicht unter firmen/<kennung>/', !(await db.doc('firmen/koerperformen/vorfaelle/' + r.id).get()).exists);

  // ══ 2. Wer nicht darf ══
  await scheitert('ohne Text', fns.vorfallMelden.run({ was: 'kurz' }, als('mara')), /Satz/);
  await scheitert('ohne Anmeldung', fns.vorfallMelden.run({ was: 'Etwas ist passiert, bitte ansehen.' }, {}), /einloggen/);
  await scheitert('nicht freigegeben', fns.vorfallMelden.run({ was: 'Etwas ist passiert, bitte ansehen.' }, als('neu')), /freigegeben/);

  // ══ 3. Tagesgrenze ══
  for (let i = 0; i < 4; i++) await fns.vorfallMelden.run({ was: 'Probe Nummer ' + i + ' für die Grenze.' }, als('mara'));
  await scheitert('die sechste Meldung an einem Tag', fns.vorfallMelden.run({ was: 'Eine zu viel, heute.' }, als('mara')), /heute schon 5/);

  // ══ 4. Die Mail selbst, an einem Ersatz-Versender ══
  await db.doc('users/ben').set({ name: 'Ben', role: 'leiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'], email: 'ben@example.org' });
  const gesendet = [];
  fns.__intern.mailerFuerDurchlauf({ sendMail: async (m) => { gesendet.push(m); return { messageId: 'x' }; } });
  const r2 = await fns.vorfallMelden.run({ was: 'Ein Laptop mit angemeldeter App ist weg.', laeuft: 'ja' }, als('ben'));
  const m = gesendet[0] || {};
  pruefe('eine Mail geht raus', gesendet.length === 1 && r2.mail === true);
  pruefe('mit Wichtigkeit „hoch" (priority: high → X-Priority 1, Importance: High)', m.priority === 'high', m.priority);
  pruefe('„DRINGEND" und die Frist stehen im Betreff', /DRINGEND/.test(m.subject || '') && /Frist bis \S+ \d{2}\.\d{2}\.\d{4}/.test(m.subject || ''), m.subject);
  pruefe('Antworten geht an die meldende Person', m.replyTo === 'ben@example.org', m.replyTo);
  pruefe('der Text nennt Firma, Person und „Läuft noch: Ja"', /Körperformen/.test(m.text || '') && /Ben · leiter/.test(m.text || '') && /Ja, es läuft noch/.test(m.text || ''), (m.text || '').slice(0, 300));
  pruefe('in der Datenbank: mail „gesendet"', (await db.doc('vorfaelle/' + r2.id).get()).get('mail') === 'gesendet');
  fns.__intern.mailerFuerDurchlauf({ sendMail: async () => { throw new Error('SMTP weg'); } });
  const r3 = await fns.vorfallMelden.run({ was: 'Zweiter Fall, diesmal scheitert die Mail.' }, als('ben'));
  pruefe('scheitert die Mail: gespeichert, Antwort mail: false, Vermerk „fehlgeschlagen"',
    r3.mail === false && (await db.doc('vorfaelle/' + r3.id).get()).get('mail') === 'fehlgeschlagen');
  fns.__intern.mailerFuerDurchlauf(null);

  console.log('\n══ Vorfall melden ══');
  protokoll.forEach(z => console.log(z));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  if (gefallen) { console.log('\n✗ „Vorfall melden" ist nicht dicht.'); process.exit(1); }
  console.log('\n✓ Meldungen werden gespeichert, ehrlich beantwortet und begrenzt.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
