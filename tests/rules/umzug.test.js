/* ── Der Umzug, ausgeführt statt behauptet ────────────────────────────
   Stufe C. Hier läuft GENAU der Code, der später die echten Daten
   anfasst — tools/umzug.js, nicht eine Nachbildung davon.

   Gegen den Emulator, also ohne jedes Risiko. Was hier grün ist, ist
   noch kein Beweis für den Ernstfall (die echte Datenbank ist größer
   und langsamer), aber es ist der Unterschied zwischen „sollte gehen"
   und „ist gelaufen".

   Geprüft werden die Stellen, an denen so ein Umzug wirklich scheitert:

     1. Kommt überhaupt alles an? Zählprüfung je Sammlung.
     2. Bleiben die INHALTE gleich? Eine Kopie, die zählt aber verfälscht,
        wäre schlimmer als gar keine.
     3. Untersammlungen unter LEEREN Elterndokumenten. In Firestore kann
        studios/studio-6 als Dokument gar nicht existieren und trotzdem
        Aufgaben enthalten. Wer mit .get() über die Eltern geht, verliert
        sie lautlos — das ist die klassische Falle.
     4. Bleiben die alten Daten liegen? Es soll eine Kopie sein.
     5. Ist ein zweiter Lauf harmlos? Wer mittendrin abbricht, muss neu
        starten können.
     6. Merkt die Zählprüfung eine Abweichung überhaupt? Ein Prüfer, der
        nie rot wird, prüft nichts — also wird hier absichtlich etwas
        kaputtgemacht.
   ───────────────────────────────────────────────────────────────────── */
const path = require('path');
/* Das ECHTE Admin-SDK, gegen den Emulator gerichtet — dasselbe, das
   später die echten Daten anfasst. Das Client-SDK aus
   @firebase/rules-unit-testing kann listDocuments() nicht, und genau
   darauf beruht der schwierigste Teil des Umzugs: Untersammlungen
   unter Elterndokumenten, die es gar nicht gibt. Mit dem Client-SDK
   hätte ich alles geprüft ausser der einen Stelle, die zählt. */
const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
const { umziehen, zielZaehlen, vergleichen } = require('../../tools/umzug.js');

let bestanden = 0, gefallen = 0;
const protokoll = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) { bestanden++; protokoll.push('  ✓ ' + name); }
  else { gefallen++; protokoll.push('  ✗ ' + name + (zusatz ? '\n      ' + zusatz : '')); }
}

(async () => {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8791';
  admin.initializeApp({ projectId: 'demo-umzug' });
  const db = admin.firestore();

  // ── Ausgangslage: so sieht die Datenbank heute aus ──
  {
    const d = db;
    await d.doc('documents/d1').set({ name: 'Hygieneplan', size: 120000 });
    await d.doc('documents/d2').set({ name: 'Notfallplan', size: 90000 });
    await d.doc('announcements/an1').set({ text: 'Öffnungszeiten', ts: 1786000000000 });
    await d.doc('certificates/z1').set({ uid: 'u2', art: 'ems', bis: '2026-12-01' });
    await d.doc('archives/2026-KW32').set({ week: '2026-KW32', material: { 'studio-0': [] } });
    await d.doc('inventory/studio-0').set({ items: [{ name: 'Handtücher', have: 12 }] });
    await d.doc('board/b1').set({ text: 'Brett', ts: 1 });
    await d.doc('trash/tr1').set({ art: 'todo', sk: 'studio-0' });
    await d.doc('config/studios').set({ liste: [{ id: 'studio-0', name: 'Longerich' }], naechste: 1 });
    await d.doc('config/onboarding').set({ punkte: ['Schlüssel', 'Einweisung'] });

    // Kanal MIT Elterndokument
    await d.doc('channels/allgemein').set({ name: 'Allgemein' });
    await d.doc('channels/allgemein/messages/m1').set({ uid: 'u2', text: 'Moin', ts: 10 });
    await d.doc('channels/allgemein/messages/m2').set({ uid: 'u3', text: 'Servus', ts: 20 });

    // ── Die Falle: Studio OHNE Elterndokument, aber MIT Untersammlungen.
    //    Genau so liegt es in der echten Datenbank: studios/studio-6
    //    wurde nie geschrieben, nur seine Aufgaben.
    await d.doc('studios/studio-6/todos/t1').set({ title: 'Geräte desinfizieren', done: false });
    await d.doc('studios/studio-6/todos/t2').set({ title: 'Handtücher', done: true });
    await d.doc('studios/studio-6/cleaning/c1').set({ title: 'Böden wischen' });
    await d.doc('studios/studio-6/shifts/s1').set({ date: '2026-08-12', uid: 'u2' });
    await d.doc('studios/studio-6/absences/a1').set({ uid: 'u2', type: 'krank' });
    await d.doc('studios/studio-7/todos/t3').set({ title: 'Empfang' });
    await d.doc('studios/studio-7/deviceLog/l1').set({ art: 'defekt', text: 'Weste' });
  }

  const F = 'koerperformen';

  // ══ 1. Probe schreibt nichts ══
  const probe = await umziehen(db, F, { probe: true });
  const nachProbe = await zielZaehlen(db, F);
  const summeProbe = Object.values(nachProbe).reduce((a, b) => a + b, 0);
  pruefe('Probelauf schreibt nichts (Ziel bleibt leer)', summeProbe === 0,
    'Am Ziel liegen bereits ' + summeProbe + ' Dokumente');
  pruefe('Probelauf zählt trotzdem die Quelle', (probe['documents'] || 0) === 2);

  // ══ 2. Der Umzug ══
  const vorher = await umziehen(db, F, { name: 'Körperformen' });
  const nachher = await zielZaehlen(db, F);
  const ab = vergleichen(vorher, nachher);
  pruefe('Zählprüfung: jede Sammlung kommt vollständig an', ab.length === 0,
    JSON.stringify(ab));

  // ══ 3. Die Falle: Untersammlung unter leerem Elterndokument ══
  const t6 = await db.collection('firmen').doc(F)
    .collection('studios').doc('studio-6').collection('todos').get();
  pruefe('Aufgaben unter einem LEEREN Studio-Dokument kommen mit', t6.size === 2,
    'angekommen: ' + t6.size + ' von 2');
  const s7 = await db.collection('firmen').doc(F)
    .collection('studios').doc('studio-7').collection('deviceLog').get();
  pruefe('Auch das zweite Studio ohne Elterndokument', s7.size === 1);

  // ══ 4. Inhalte, nicht nur Anzahl ══
  const d1 = await db.collection('firmen').doc(F).collection('documents').doc('d1').get();
  pruefe('Der Inhalt kommt unverändert an', d1.exists && d1.data().name === 'Hygieneplan'
    && d1.data().size === 120000, JSON.stringify(d1.data()));
  const stu = await db.collection('firmen').doc(F).collection('config').doc('studios').get();
  pruefe('Verschachtelte Felder überleben (Studioliste)',
    stu.exists && Array.isArray(stu.data().liste) && stu.data().liste[0].name === 'Longerich');
  const kanal = await db.collection('firmen').doc(F).collection('channels').doc('allgemein').get();
  pruefe('Ein vorhandenes Elterndokument kommt auch mit',
    kanal.exists && kanal.data().name === 'Allgemein');

  // ══ 5. Die Quelle bleibt unangetastet — es ist eine KOPIE ══
  const altT = await db.collection('studios').doc('studio-6').collection('todos').get();
  const altD = await db.collection('documents').get();
  pruefe('Die alten Aufgaben liegen noch da', altT.size === 2);
  pruefe('Die alten Dokumente liegen noch da', altD.size === 2);

  // ══ 6. Zweiter Lauf ändert nichts ══
  await umziehen(db, F, {});
  const nachZweitem = await zielZaehlen(db, F);
  pruefe('Ein zweiter Lauf verdoppelt nichts',
    JSON.stringify(nachZweitem) === JSON.stringify(nachher),
    'vorher ' + JSON.stringify(nachher) + '\n      nachher ' + JSON.stringify(nachZweitem));

  // ══ 7. Wird die Zählprüfung überhaupt jemals rot? ══
  await db.doc('firmen/' + F + '/documents/d2').delete();
  const kaputt = vergleichen(vorher, await zielZaehlen(db, F));
  pruefe('Die Zählprüfung MERKT ein fehlendes Dokument',
    kaputt.length === 1 && kaputt[0].pfad === 'documents' && kaputt[0].ziel === 1,
    JSON.stringify(kaputt));

  console.log('\n════ UMZUG – ausgefuehrt gegen den Emulator ════');
  protokoll.forEach(z => console.log(z));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
