/* ── Das Kalender-Abo, ausgeführt statt behauptet ──────────────────────
   Jede Person kann ihre Schichten im eigenen Kalender sehen — als
   ABO-LINK, nicht als Kalender-Anbindung mit OAuth. Eine Adresse, die
   Google, Apple und Outlook selbst regelmäßig neu lesen.

   DER LINK IST EIN DAUERSCHLÜSSEL. Wer ihn hat, sieht die Schichten,
   ohne sich anzumelden. Deshalb ist das Wichtigste an diesem Durchlauf
   nicht, dass ein Kalender herauskommt, sondern dass er es NUR mit dem
   richtigen Schlüssel tut:

     · falsches Geheimnis            → 403
     · fehlendes Geheimnis           → 403
     · Kennung, die es nicht gibt    → 403
     · zurückgezogenes Geheimnis     → 403
     · Konto auf inaktiv gesetzt     → 403

   Und alle fünf mit DERSELBEN Antwort: wer raten will, soll aus dem
   Text nicht lernen, ob eine Kennung existiert.

   WO DAS GEHEIMNIS LIEGT: in privat/<uid> — das liest und schreibt nur
   der Besitzer. NICHT im users-Dokument, das jeder aktive Kollege lesen
   darf; dort könnte es jeder mitlesen und weitergeben. Dafür war keine
   neue Regel nötig, und genau das wird hier mitgeprüft.

   Der Inhalt wird gegen den ICS-Standard geprüft, nicht gegen mein
   Augenmaß: Zeitzone (Sommer/Winter), Faltung langer Zeilen, Maskierung
   von Komma und Semikolon, und dass der letzte Urlaubstag mitkommt
   (DTEND ist bei ganztägigen Einträgen der Tag DANACH).
   ───────────────────────────────────────────────────────────────────── */
const path = require('path');
const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));

let bestanden = 0, gefallen = 0;
const protokoll = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) { bestanden++; protokoll.push('  ✓ ' + name); }
  else { gefallen++; protokoll.push('  ✗ ' + name + (zusatz ? '\n      ' + zusatz : '')); }
}

/* Eine Antwort nachbilden, ohne einen HTTP-Server zu starten: die
   Function ist ein gewöhnlicher (req,res)-Handler. */
function ruf(fn, query) {
  return new Promise((fertig) => {
    const antwort = { code: 200, kopf: {}, text: '' };
    const res = {
      status(c) { antwort.code = c; return res; },
      set(k, v) { antwort.kopf[String(k).toLowerCase()] = v; return res; },
      send(t) { antwort.text = String(t == null ? '' : t); fertig(antwort); return res; },
    };
    Promise.resolve(fn({ query: query || {} }, res)).catch((e) => {
      antwort.code = 599; antwort.text = String(e && e.message); fertig(antwort);
    });
  });
}

const tag = (v) => new Date(Date.now() + v * 86400000)
  .toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });

/* initializeApp ruft das Modul selbst — genau wie in funktionen.test.js.
   Ein zweiter Aufruf hier bricht mit app/duplicate-app ab. Ein EIGENES
   Projekt, damit dieser Durchlauf niemandem sonst die Daten wegraeumt:
   alle Regeltests teilen sich sonst demo-regeltest. */
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8791';
process.env.GCLOUD_PROJECT = 'demo-kalender';
process.env.GOOGLE_CLOUD_PROJECT = 'demo-kalender';

const mod = require(path.join(__dirname, '..', '..', 'functions', 'index.js'));
const db = admin.firestore();

(async () => {
  await fetch('http://' + process.env.FIRESTORE_EMULATOR_HOST +
    '/emulator/v1/projects/demo-kalender/databases/(default)/documents', { method: 'DELETE' });
  const kalender = mod.kalender.run ? mod.kalender.run : mod.kalender;

  const TOK = 'a'.repeat(48);
  await db.doc('users/anna').set({ name: 'Anna Meier', aktiv: true, studioKeys: ['studio-0'] });
  await db.doc('privat/anna').set({ kalenderToken: TOK });
  await db.doc('users/ben').set({ name: 'Ben', aktiv: true, studioKeys: ['studio-0'] });
  await db.doc('privat/ben').set({ kalenderToken: 'b'.repeat(48) });
  /* Ein Studio mit einem Komma und einem Semikolon im Namen — genau
     die zwei Zeichen, die der ICS-Standard als Trenner benutzt. */
  await db.doc('studios/studio-0').set({ name: 'Hürth, Zentrum; Halle 2' });
  await db.doc('studios/studio-1').set({ name: 'Brühl' });

  // Annas Schichten: eine im Sommer, eine über Mitternacht, eine fremde
  await db.doc('studios/studio-0/shifts/s1').set({
    date: tag(3), from: '09:00', to: '17:00', uid: 'anna', name: 'Anna Meier',
    note: 'Einweisung neue Kundin' });
  await db.doc('studios/studio-0/shifts/s2').set({
    date: tag(5), from: '22:00', to: '02:00', uid: 'anna', name: 'Anna Meier' });
  /* In einem Studio, dem Anna NICHT zugeordnet ist — wer einmal
     aushilft, muss die Schicht trotzdem im Kalender sehen. */
  await db.doc('studios/studio-1/shifts/s3').set({
    date: tag(7), from: '10:00', to: '14:00', uid: 'anna', name: 'Anna Meier' });
  await db.doc('studios/studio-0/shifts/s4').set({
    date: tag(3), from: '09:00', to: '17:00', uid: 'ben', name: 'Ben' });
  /* Weit ausserhalb des Fensters (ein Jahr voraus) — darf nicht
     mitkommen, sonst waechst das Abo mit jedem Dienstplan. */
  await db.doc('studios/studio-0/shifts/s5').set({
    date: tag(400), from: '09:00', to: '17:00', uid: 'anna', name: 'Anna Meier' });

  await db.doc('studios/studio-0/absences/a1').set({
    from: tag(20), to: tag(24), type: 'urlaub', status: 'genehmigt', uid: 'anna' });
  await db.doc('studios/studio-0/absences/a2').set({
    from: tag(30), to: tag(31), type: 'urlaub', status: 'offen', uid: 'anna' });
  await db.doc('studios/studio-0/absences/a3').set({
    from: tag(1), to: tag(1), type: 'krank', uid: 'anna' });

  // ══ 1. Der richtige Weg ══
  const ok = await ruf(kalender, { u: 'anna', t: TOK });
  pruefe('Mit richtigem Link kommt ein Kalender', ok.code === 200,
    ok.code + ' ' + ok.text.slice(0, 120));
  const ics = ok.text;
  pruefe('Er ist als Kalender ausgezeichnet',
    /text\/calendar/.test(ok.kopf['content-type'] || ''), ok.kopf['content-type']);
  pruefe('Er beginnt und endet nach Standard',
    /^BEGIN:VCALENDAR\r\n/.test(ics) && /END:VCALENDAR\r\n$/.test(ics),
    JSON.stringify(ics.slice(0, 40)));
  pruefe('Zeilen enden mit CRLF, nicht mit LF',
    !/[^\r]\n/.test(ics), 'Ein blosses \\n verwerfen manche Kalender.');

  const zahl = (re) => (ics.match(re) || []).length;
  /* Drei Schichten (auch die im fremden Studio), zwei Abwesenheiten
     (der offene Antrag NICHT), und nichts von Ben. */
  pruefe('Es sind fünf Einträge: 3 Schichten + 2 Abwesenheiten',
    zahl(/BEGIN:VEVENT/g) === 5, zahl(/BEGIN:VEVENT/g) + ' Einträge');
  pruefe('Die Aushilfs-Schicht im fremden Studio ist dabei',
    /Brühl/.test(ics), 'Ohne sie sähe man nur die eigenen Studios.');
  pruefe('Bens Schicht ist NICHT dabei', ics.indexOf('schicht-s4') < 0,
    'Sonst läge in Annas Kalender fremder Dienstplan.');
  pruefe('Eine Schicht weit ausserhalb des Fensters fehlt',
    ics.indexOf('schicht-s5') < 0, 'Sonst wüchse das Abo unbegrenzt.');
  pruefe('Ein OFFENER Urlaubsantrag steht nicht drin',
    ics.indexOf('abw-a2') < 0,
    'Ihn einzutragen behauptete eine Zusage, die es nicht gibt.');
  pruefe('Eine Krankmeldung gilt sofort und steht drin',
    ics.indexOf('abw-a3') >= 0);

  // ══ 2. Der Inhalt ══
  pruefe('Komma und Semikolon im Studionamen sind maskiert',
    /Hürth\\, Zentrum\\; Halle 2/.test(ics),
    'Unmaskiert zerreisst der Standard den Eintrag an diesen Zeichen.');
  pruefe('Die Notiz kommt mit', /Einweisung neue Kundin/.test(ics));
  /* Eine Schicht 22:00–02:00 endet am NAECHSTEN Tag. Ohne den Zuschlag
     läge das Ende vor dem Anfang und der Kalender zeigte gar nichts. */
  const s2 = ics.split('BEGIN:VEVENT').find(b => /schicht-s2/.test(b)) || '';
  const von = (s2.match(/DTSTART:(\d{8}T\d{6}Z)/) || [])[1];
  const bis = (s2.match(/DTEND:(\d{8}T\d{6}Z)/) || [])[1];
  pruefe('Eine Schicht über Mitternacht endet nach ihrem Anfang',
    !!von && !!bis && bis > von, von + ' → ' + bis);

  /* Der letzte Urlaubstag: DTEND ist bei VALUE=DATE der Tag DANACH.
     Ohne den Zuschlag fehlt im Kalender der letzte Tag. */
  const a1 = ics.split('BEGIN:VEVENT').find(b => /abw-a1/.test(b)) || '';
  const uEnde = (a1.match(/DTEND;VALUE=DATE:(\d{8})/) || [])[1];
  const erwartet = tag(25).replace(/-/g, '');
  pruefe('Beim Urlaub ist der letzte Tag mitgezählt (DTEND = Tag danach)',
    uEnde === erwartet, uEnde + ' statt ' + erwartet);

  pruefe('Keine Zeile ist länger als 75 Zeichen (Faltung)',
    ics.split('\r\n').every(z => Buffer.from(z, 'utf8').length <= 75),
    (ics.split('\r\n').find(z => Buffer.from(z, 'utf8').length > 75) || '').slice(0, 90));

  // ══ 3. Die Sperren — der eigentliche Kern ══
  const faelle = [
    ['falsches Geheimnis', { u: 'anna', t: 'x'.repeat(48) }],
    ['fremdes Geheimnis', { u: 'anna', t: 'b'.repeat(48) }],
    ['gar kein Geheimnis', { u: 'anna' }],
    ['keine Kennung', { t: TOK }],
    ['Kennung, die es nicht gibt', { u: 'gibtsnicht', t: TOK }],
  ];
  const texte = [];
  for (const [was, q] of faelle) {
    const r = await ruf(kalender, q);
    texte.push(r.text);
    pruefe('Abgewiesen: ' + was, r.code === 403, r.code + ' ' + r.text.slice(0, 80));
  }
  /* Dieselbe Antwort für alle: aus dem Text darf niemand lernen, ob es
     eine Kennung gibt. */
  pruefe('Alle Absagen lauten gleich', new Set(texte).size === 1,
    JSON.stringify([...new Set(texte)]));

  await db.doc('privat/anna').set({ kalenderToken: null }, { merge: true });
  pruefe('Ein zurückgezogener Link gilt sofort nicht mehr',
    (await ruf(kalender, { u: 'anna', t: TOK })).code === 403);

  await db.doc('privat/anna').set({ kalenderToken: TOK }, { merge: true });
  await db.doc('users/anna').set({ aktiv: false }, { merge: true });
  pruefe('Ein deaktiviertes Konto bekommt keinen Kalender mehr',
    (await ruf(kalender, { u: 'anna', t: TOK })).code === 403,
    'Wer aus dem Betrieb raus ist, soll den Dienstplan nicht weiter abonnieren.');

  console.log('\n' + protokoll.join('\n'));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen\n');
  if (gefallen) {
    console.log('✗ Das Kalender-Abo liefert nicht, was es soll — oder liefert es zu viel.');
    process.exit(1);
  }
  console.log('✓ Kalender-Abo: gueltiges ICS, nur mit dem richtigen Schluessel.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
