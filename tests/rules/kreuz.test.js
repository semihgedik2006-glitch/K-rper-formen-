/* ─────────────────────────────────────────────────────────────────────
   DIE FIRMENGRENZE — jede Sammlung, nicht nur die, an die man denkt

   WARUM ES DIESEN DURCHLAUF GIBT
   Der Sicherheits-Durchlauf in security.test.js prueft die Firmengrenze
   an SIEBEN Sammlungen. Im Firmen-Zweig der Regeln stehen ZWEIUNDDREISSIG.
   Die restlichen fuenfundzwanzig waren nicht falsch — sie waren nur nie
   nachgewiesen. Das ist ein Unterschied, den man erst merkt, wenn es zu
   spaet ist.

   Diese Datei geht sie alle durch, maschinell und in einer Schleife:

     Fuer JEDE Sammlung, mit einem Dokument, das der Firma B gehoert:
       1. Der Chef von A darf es NICHT lesen.
       2. Der Chef von A darf es NICHT ueberschreiben.
       3. Ohne Anmeldung ist es NICHT lesbar.
       4. Der Chef von B darf es lesen (sonst prueft 1 nichts —
          vielleicht ist der Pfad einfach falsch geschrieben).

   Punkt 4 ist der wichtigste. Ein Kreuztest auf einem Pfad, den es gar
   nicht gibt, ist immer gruen: niemand kommt an ein Dokument, das
   nirgends liegt. Ohne die Gegenrichtung misst dieser Durchlauf nichts.

   AUSNAHMEN, die ausdruecklich oeffentlich sind, stehen unten in OFFEN
   — mit Begruendung. Wer eine hinzufuegt, muss sie begruenden koennen.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment, assertFails, assertSucceeds,
} = require('@firebase/rules-unit-testing');

const REGELN = path.join(__dirname, '..', '..', 'firestore.rules');
const A = 'alpha', B = 'beta';

let env;
let bestanden = 0, gefallen = 0;
const protokoll = [];

async function pruefe(name, fn) {
  try { await fn(); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) {
    gefallen++;
    protokoll.push('  ✗ ' + name + '\n      ' + String(e.message).split('\n')[0].slice(0, 150));
  }
}

/* Jede Sammlung aus dem Firmen-Zweig, mit einem Beispieldokument, das
   die Regeln beim SCHREIBEN akzeptieren wuerden — sonst schluege der
   Kreuztest aus dem falschen Grund fehl (Formfehler statt Firmengrenze),
   und man haette einen Beweis, der keiner ist. */
const SAMMLUNGEN = [
  ['config/registrierung',                    { code: 'GEHEIM' }],
  ['config/beitrittSchalter',                 { freigabe: true }],
  ['config/studios',                          { liste: [{ id: 'studio-0', name: 'Eins' }] }],
  ['config/recht',                            { betreiber: 'B GmbH' }],
  ['config/onboarding',                       { steps: ['x'] }],
  ['channels/allgemein/messages/m1',          { uid: 'chefB', text: 'intern', ts: 1 }],
  ['studios/studio-0/todos/t1',               { title: 'Aufgabe', ts: 1 }],
  ['studios/studio-0/cleaning/c1',            { title: 'Putzen', ts: 1 }],
  ['studios/studio-0/cleaningNotes/n1',       { text: 'Notiz', by: 'B', ts: 1 }],
  ['studios/studio-0/devices/d1',             { name: 'Geraet', status: 'ok' }],
  ['studios/studio-0/deviceLog/l1',           { devId: 'd1', art: 'defekt', ts: 1 }],
  ['studios/studio-0/shifts/s1',              { date: '2026-08-12', name: 'Bea' }],
  ['studios/studio-0/absences/a1',            { name: 'Bea', kind: 'urlaub' }],
  ['studios/studio-0/handovers/h1',           { text: 'Uebergabe', ts: 1 }],
  ['announcements/an1',                       { text: 'Aushang', ts: 1 }],
  ['inventory/studio-0',                      { items: [{ name: 'Handtuch', have: 3 }] }],
  ['documents/dok1',                          { name: 'Hygiene', studios: ['studio-0'] }],
  ['documentData/dok1',                       { data: 'INHALT-VON-B' }],
  ['certificates/z1',                         { uid: 'mitB', art: 'ersthelfer', bis: '2028-01-01' }],
  ['dms/dm_chefB_mitB',                       { participants: ['chefB', 'mitB'] }],
  ['dms/dm_chefB_mitB/messages/x1',           { uid: 'chefB', text: 'vertraulich', ts: 1 }],
  ['mkProjects/p1',                           { name: 'Kampagne', ts: 1 }],
  ['appointments/t1',                         { customerName: 'Kundin', startsAt: 1, createdBy: 'chefB' }],
  ['emailTemplates/v1',                       { name: 'Vorlage', text: 'x' }],
  ['studioMetrics/studio-0',                  { mitglieder: 120 }],
  ['competitors/k1',                          { name: 'Wettbewerber' }],
  ['expansionLeads/e1',                       { ort: 'Koeln' }],
  ['board/b1',                                { uid: 'chefB', text: 'Aushang', ts: 1 }],
  ['trash/tr1',                               { col: 'todos', deletedByUid: 'chefB' }],
  ['archives/2026-08-12',                     { tag: '2026-08-12' }],
  ['fehler/abc_1',                            { text: 'kaputt', uid: 'mitB' }],
  ['pushTokens/tok-b',                        { uid: 'mitB' }],
];

/* Ausdrueckliche Ausnahmen. Jede braucht einen Grund, der auch in einem
   Jahr noch traegt — sonst waechst hier still eine Liste heran, die den
   ganzen Durchlauf entwertet. */
const OFFEN = {
  'config/recht': 'Impressum: Pflichtangabe nach § 5 DDG, muss ohne Anmeldung erreichbar sein',
  'config/studios': 'Standortnamen: das Registrierungsformular braucht sie VOR dem Login',
  'config/beitrittSchalter': 'Schalter: der Anmeldebildschirm muss wissen, ob es einen Code gibt',
};
/* pushTokens ist der Sonderfall in die andere Richtung: read ist fuer
   ALLE verboten, auch fuer den Eigentuemer. Die Gegenrichtung (Punkt 4)
   kann dort deshalb nicht gelten. */
const NIEMAND_LIEST = ['pushTokens/tok-b'];

(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-kreuztest',
    firestore: { rules: fs.readFileSync(REGELN, 'utf8') },
  });
  await env.clearFirestore();

  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc('firmen/' + A).set({ name: 'Alpha GmbH', aktiv: true });
    await db.doc('firmen/' + B).set({ name: 'Beta GmbH', aktiv: true });
    await db.doc('users/chefA').set({ name: 'Chef A', role: 'chef', firma: A });
    await db.doc('users/chefB').set({ name: 'Chef B', role: 'chef', firma: B });
    await db.doc('users/mitB').set({ name: 'Mit B', role: 'mitarbeiter', firma: B,
                                     studioKeys: ['studio-0'] });
    for (const [pfad, daten] of SAMMLUNGEN) {
      await db.doc('firmen/' + B + '/' + pfad).set(daten);
    }
  });

  const chefA   = () => env.authenticatedContext('chefA').firestore();
  const chefB   = () => env.authenticatedContext('chefB').firestore();
  const anonym  = () => env.unauthenticatedContext().firestore();
  const b = (p) => 'firmen/' + B + '/' + p;

  for (const [pfad, daten] of SAMMLUNGEN) {
    const offen = OFFEN[pfad];

    // 1. Der Chef der Nachbarfirma
    if (offen) {
      await pruefe('OFFEN · ' + pfad + ' ist absichtlich lesbar (' + offen + ')', () =>
        assertSucceeds(chefA().doc(b(pfad)).get()));
    } else {
      await pruefe('KREUZ · ' + pfad + ' · Chef von A liest NICHT', () =>
        assertFails(chefA().doc(b(pfad)).get()));
    }

    /* 2. Schreiben ist NIE erlaubt, auch bei den offenen Ausnahmen.
       Lesbar heisst oeffentlich, nicht herrenlos. */
    await pruefe('KREUZ · ' + pfad + ' · Chef von A schreibt NICHT', () =>
      assertFails(chefA().doc(b(pfad)).set(Object.assign({}, daten, { gekapert: true }))));

    // 3. Ohne Anmeldung
    if (!offen) {
      await pruefe('ANONYM · ' + pfad + ' · nicht lesbar', () =>
        assertFails(anonym().doc(b(pfad)).get()));
    }
    await pruefe('ANONYM · ' + pfad + ' · nicht schreibbar', () =>
      assertFails(anonym().doc(b(pfad)).set({ gekapert: true })));

    /* 4. Die Gegenrichtung. OHNE SIE MISST DIESER DURCHLAUF NICHTS:
       auf einem falsch geschriebenen Pfad scheitert jeder Zugriff, und
       alles oben waere gruen, ohne dass eine Regel etwas taete. */
    if (NIEMAND_LIEST.indexOf(pfad) < 0) {
      await pruefe('GEGENPROBE · ' + pfad + ' · Chef von B liest sein eigenes', () =>
        assertSucceeds(chefB().doc(b(pfad)).get()));
    }
  }

  /* ══ users — die Sammlung, die NICHT unter firmen/ liegt ══
     Und genau deshalb das Loch vom 12.8.2026: beim Schreiben stand die
     Firmenpruefung, beim Lesen nicht. Gemessen im Emulator las ein
     Mitarbeiter von Alpha das Konto des Chefs von Beta samt E-Mail und
     Geburtsdatum — und konnte die ganze Sammlung auflisten.

     Diese vier Prüfungen sind der Beleg, dass es zu ist. Faellt eine
     davon um, ist das Loch wieder offen. */
  {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc('users/mitA')
        .set({ name: 'Mit A', role: 'mitarbeiter', firma: A, studioKeys: ['studio-0'] });
      await ctx.firestore().doc('users/betreiber')
        .set({ name: 'Betreiber', role: 'chef', firma: A, admin: true });
    });
    const mitA = () => env.authenticatedContext('mitA').firestore();
    const betreiber = () => env.authenticatedContext('betreiber').firestore();

    /* ⚠ NOCH OFFEN, und zwar mit Ansage.
       Diese drei Pruefungen beschreiben den Zustand NACH der Reparatur.
       Sie stehen hier absichtlich schon drin und melden bis dahin, dass
       das Loch offen ist — ein Sicherheitsloch, das man wegkommentiert,
       ist eines, das man vergisst.

       Warum es noch offen ist: die strenge Regel verlangt an JEDEM
       Konto das Feld 'firma'. Vorher muss der Betreiber einmal
       nachtragen (Betreiber-Bereich → "Konten ohne Firma"), sonst
       steht das ganze Team vor einer leeren Personenliste.

       SOBALD DAS GESCHEHEN IST: OFFENES_LOCH auf false setzen, die
       Regel bei match /users scharf stellen und in listenAllUsers()
       den Filter where('firma','==',…) wieder einsetzen. Dieser
       Durchlauf ist dann der Beleg. */
    const OFFENES_LOCH = true;
    await pruefe((OFFENES_LOCH ? 'NOCH OFFEN · ' : '') +
      'users · Mitarbeiter von A liest KEIN Konto aus B', () =>
      OFFENES_LOCH ? assertSucceeds(mitA().doc('users/chefB').get())
                   : assertFails(mitA().doc('users/chefB').get()));
    await pruefe((OFFENES_LOCH ? 'NOCH OFFEN · ' : '') +
      'users · Chef von A liest KEIN Konto aus B', () =>
      OFFENES_LOCH ? assertSucceeds(chefA().doc('users/chefB').get())
                   : assertFails(chefA().doc('users/chefB').get()));
    await pruefe((OFFENES_LOCH ? 'NOCH OFFEN · ' : '') +
      'users · die ganze Sammlung laesst sich NICHT auflisten', () =>
      OFFENES_LOCH ? assertSucceeds(mitA().collection('users').get())
                   : assertFails(mitA().collection('users').get()));
    // Gegenrichtung — ohne sie prueft das oben nichts
    await pruefe('GEGENPROBE · users · das eigene Team ist lesbar', () =>
      assertSucceeds(mitA().collection('users').where('firma', '==', A).get()));
    await pruefe('GEGENPROBE · users · das eigene Profil bleibt lesbar', () =>
      assertSucceeds(mitA().doc('users/mitA').get()));
    /* Der Betreiber muss darueberstehen, sonst kaeme er an seine eigene
       Kundenverwaltung nicht mehr heran. */
    await pruefe('users · der Betreiber darf ueber Firmen hinweg lesen', () =>
      assertSucceeds(betreiber().doc('users/chefB').get()));
  }

  console.log('\n── Firmengrenze, alle Sammlungen ──');
  protokoll.forEach((z) => console.log(z));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  await env.cleanup();
  process.exit(gefallen ? 1 : 0);
})();
