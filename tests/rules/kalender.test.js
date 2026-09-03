/* ── Das Kalender-Abo, ausgeführt statt behauptet ──────────────────────
   Jede Person kann ihren Plan im eigenen Kalender sehen — als ABO-LINK,
   nicht als Kalender-Anbindung mit OAuth. Eine Adresse, die Google,
   Apple und Outlook selbst regelmäßig neu lesen.

   Drin stehen Schichten, Urlaub und Krankmeldungen — und alles mit
   FRIST: Studio-Aufgaben, die eigenen To-dos und ablaufende Nachweise.

   WELCHE AUFGABE IST MEINE? Diese Frage entscheidet, ob der Kalender
   nützt oder nach einer Woche ungelesen bleibt, und sie ist in der App
   schon zweimal beantwortet — `checkDueReminders()` und
   `dueTaskReminder` sagen beide: zugewiesenes gehört der Person,
   nicht zugewiesenes dem Studio. Hier gilt dasselbe, und der Durchlauf
   prüft beide Richtungen: die zugewiesene Aufgabe im FREMDEN Studio
   kommt mit, die nicht zugewiesene aus einem fremden Studio nicht.

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

  /* ── Aufgaben mit Frist ──
     `due` steht als Millisekunden auf 23:59:59 ORTSZEIT. Hier deshalb
     ueber berlinZuUtc gebaut und nicht ueber new Date(...): der Laeufer
     in der Auslieferung steht auf UTC, dort waere ein "23:59:59" der
     naechste Tag in Berlin — und die Pruefung wuerde etwas anderes
     messen, als in den Studios passiert. */
  const frist = (n) => mod.__intern.berlinZuUtc(tag(n), '23:59').getTime();

  // In Annas Studio, niemandem zugewiesen → ihre
  await db.doc('studios/studio-0/todos/t1').set({
    title: 'Gurte desinfizieren', desc: 'Alle Liegen', due: frist(2), done: false });
  // Ihr zugewiesen, in einem FREMDEN Studio → trotzdem ihre
  await db.doc('studios/studio-1/todos/t2').set({
    title: 'Aushilfe einweisen', due: frist(4), done: false, assignedTo: 'anna' });
  // Ben zugewiesen, in ihrem Studio → nicht ihre
  await db.doc('studios/studio-0/todos/t3').set({
    title: 'Bens Sache', due: frist(4), done: false, assignedTo: 'ben' });
  /* Niemandem zugewiesen, in einem fremden Studio → NICHT ihre. Das ist
     der Fall, der die Regel von "alles mitnehmen" unterscheidet: ohne
     ihn waere ein Kalender voll mit den offenen Aufgaben aller Studios. */
  await db.doc('studios/studio-1/todos/t4').set({
    title: 'Fremdes Studio, offen für alle', due: frist(6), done: false });
  // Erledigt und einmalig → weg
  await db.doc('studios/studio-0/todos/t5').set({
    title: 'Schon erledigt', due: frist(2), done: true, doneAt: Date.now() });
  /* Taeglich, vor drei Tagen abgehakt → steht WIEDER an. Ein blosses
     `done` haette sie fuer immer aus dem Kalender genommen. */
  await db.doc('studios/studio-0/todos/t6').set({
    title: 'Täglich fegen', due: frist(3), done: true,
    doneAt: Date.now() - 3 * 86400000, recurring: 'daily' });
  // Ohne Frist → gehoert nicht in einen Kalender
  await db.doc('studios/studio-0/todos/t7').set({ title: 'Irgendwann mal', done: false });
  // Weit ausserhalb des Fensters
  await db.doc('studios/studio-0/todos/t8').set({
    title: 'Nächstes Jahr', due: frist(400), done: false });

  // Eigene To-dos (privat/<uid>/aufgaben) — Frist als Datum, nicht als Zahl
  await db.doc('privat/anna/aufgaben/e1').set({
    text: 'Zahnarzt anrufen', frist: tag(1), erledigt: false, notiz: 'vormittags' });
  await db.doc('privat/anna/aufgaben/e2').set({
    text: 'Schon abgehakt', frist: tag(2), erledigt: true });
  await db.doc('privat/anna/aufgaben/e3').set({ text: 'Ohne Frist', erledigt: false });

  // Nachweise mit Ablaufdatum
  await db.doc('certificates/c1').set({ uid: 'anna', bez: 'Erste Hilfe', bis: tag(60) });
  await db.doc('certificates/c2').set({ uid: 'ben', bez: 'Bens Schein', bis: tag(60) });
  await db.doc('certificates/c3').set({ uid: 'anna', bez: 'Weit weg', bis: tag(400) });

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
     (der offene Antrag NICHT), drei Aufgaben, ein eigenes To-do, ein
     Nachweis — und nichts von Ben. */
  pruefe('Es sind zehn Einträge: 3 Schichten + 2 Abwesenheiten + 5 Fristen',
    zahl(/BEGIN:VEVENT/g) === 10, zahl(/BEGIN:VEVENT/g) + ' Einträge');
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

  // ══ 2b. Aufgaben, To-dos und Nachweise ══
  const drin = (s) => ics.indexOf(s) >= 0;
  pruefe('Eine Aufgabe im eigenen Studio steht drin',
    drin('aufgabe-studio-0-t1') && /Aufgabe · Gurte desinfizieren/.test(ics));
  pruefe('Eine mir zugewiesene Aufgabe im FREMDEN Studio auch',
    drin('aufgabe-studio-1-t2'),
    'Wer aushilft, bekommt dort Aufgaben, ohne dem Studio zugeordnet zu sein.');
  /* Die drei Ausschluesse. Ohne sie waere die Regel "alles mitnehmen",
     und die waere hier genauso gruen. */
  pruefe('Eine Aufgabe für Ben steht NICHT drin', !drin('aufgabe-studio-0-t3'));
  pruefe('Eine offene Aufgabe eines fremden Studios steht NICHT drin',
    !drin('aufgabe-studio-1-t4'),
    'Sonst stünden in einem Kalender die Aufgaben aller dreizehn Studios.');
  pruefe('Eine erledigte Aufgabe steht nicht drin', !drin('aufgabe-studio-0-t5'));
  /* Der Fall, den ein blosses `done` falsch gemacht haette. */
  pruefe('Eine TÄGLICHE Aufgabe, vor drei Tagen abgehakt, steht wieder drin',
    drin('aufgabe-studio-0-t6'),
    'Sie ist nur innerhalb ihres Zeitraums erledigt — danach steht sie wieder an.');
  pruefe('Eine Aufgabe ohne Frist steht nicht drin', !/Irgendwann mal/.test(ics));
  pruefe('Eine Frist weit ausserhalb des Fensters fehlt', !drin('aufgabe-studio-0-t8'));

  pruefe('Das eigene To-do steht drin',
    drin('todo-e1') && /To-do · Zahnarzt anrufen/.test(ics));
  pruefe('Ein abgehaktes eigenes To-do nicht', !drin('todo-e2'));
  pruefe('Ein eigenes To-do ohne Frist nicht', !/Ohne Frist/.test(ics));

  pruefe('Ein ablaufender Nachweis steht drin',
    drin('nachweis-c1') && /Nachweis läuft ab · Erste Hilfe/.test(ics));
  pruefe('Der Nachweis eines Kollegen nicht', !drin('nachweis-c2'),
    'Fremde Nachweise gehen niemanden etwas an.');

  /* ── Wie eine Frist im Kalender AUSSIEHT ──
     Ganztägig und nicht um 23:59, sonst steht sie unter dem Tag statt
     darüber. Und TRANSPARENT, sonst gilt der ganze Tag als belegt —
     wer drei Fristen hat, wäre dreimal den ganzen Tag beschäftigt. */
  const t1 = ics.split('BEGIN:VEVENT').find(b => /aufgabe-studio-0-t1/.test(b)) || '';
  pruefe('Eine Frist ist ganztägig, nicht auf 23:59 gelegt',
    /DTSTART;VALUE=DATE:\d{8}/.test(t1) && !/DTSTART:\d{8}T/.test(t1),
    t1.split('\r\n').filter(z => /DTSTART/.test(z)).join(' '));
  pruefe('Eine Frist belegt keine Zeit (TRANSPARENT)',
    /TRANSP:TRANSPARENT/.test(t1));
  pruefe('Der Tag stimmt und DTEND ist der Tag danach',
    t1.indexOf('DTSTART;VALUE=DATE:' + tag(2).replace(/-/g, '')) > 0 &&
    t1.indexOf('DTEND;VALUE=DATE:' + tag(3).replace(/-/g, '')) > 0,
    t1.split('\r\n').filter(z => /DT(START|END)/.test(z)).join(' '));
  pruefe('Das Studio steht in der Beschreibung', /Studio: Hürth/.test(t1));

  /* ── Die Zeitzone bei Fristen ──
     `due` ist eine Zahl, kein Datum. Gemessen, wo die naive Rechnung
     (toISOString) und die richtige auseinandergehen — und das ist NICHT
     bei 23:59: 23:59 Ortszeit ist 21:59/22:59 UTC, also derselbe Tag.
     Umkippen tut es kurz nach Mitternacht, wo die naive Rechnung den
     VORTAG nennt. Die erste Zeile ist damit die schwächere von beiden;
     sie steht hier, weil sie den heute geschriebenen Wert prüft, die
     zweite prüft den, an dem es bricht. */
  const bd = mod.__intern.berlinDatum, bzu = mod.__intern.berlinZuUtc;
  pruefe('23:59 Berliner Zeit gehört noch zu DIESEM Tag',
    bd(bzu('2026-07-15', '23:59').getTime()) === '2026-07-15' &&
    bd(bzu('2026-01-15', '23:59').getTime()) === '2026-01-15',
    bd(bzu('2026-07-15', '23:59').getTime()) + ' / ' +
    bd(bzu('2026-01-15', '23:59').getTime()));
  pruefe('00:30 Berliner Zeit auch — und nicht zum Vortag',
    bd(bzu('2026-07-15', '00:30').getTime()) === '2026-07-15' &&
    bd(bzu('2026-01-15', '00:30').getTime()) === '2026-01-15');

  // ══ 2c. Ein abgeschaltetes Merkmal liefert auch nichts ══
  /* Bis hierher fehlte das: eine Firma konnte den Schichtplan
     ausschalten und bekam ihn über den Abo-Link weiter geliefert. */
  await db.doc('config/features').set({ todos: false });
  const ohneTodos = (await ruf(kalender, { u: 'anna', t: TOK })).text;
  pruefe('Aufgaben aus: keine Aufgabe mehr im Kalender',
    ohneTodos.indexOf('aufgabe-studio-0-t1') < 0);
  /* Gegenprobe: der Schalter darf nur das treffen, was er heisst. */
  pruefe('… die Schichten stehen aber weiter drin',
    ohneTodos.indexOf('schicht-s1') >= 0);
  pruefe('… und das eigene To-do auch',
    ohneTodos.indexOf('todo-e1') >= 0,
    'Die persönliche Liste hängt nicht am Studio-Schalter.');

  await db.doc('config/features').set({ schicht: false });
  const ohneSchicht = (await ruf(kalender, { u: 'anna', t: TOK })).text;
  pruefe('Schichtplan aus: keine Schicht mehr im Kalender',
    ohneSchicht.indexOf('schicht-s1') < 0);
  pruefe('… die Aufgabe steht dann wieder drin',
    ohneSchicht.indexOf('aufgabe-studio-0-t1') >= 0);
  await db.doc('config/features').delete();

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
