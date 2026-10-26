/* ─────────────────────────────────────────────────────────────────────
   DIE FIRMENGRENZE — jede Sammlung, nicht nur die, an die man denkt

   security.test.js prueft die Firmengrenze an sieben Sammlungen. Im
   Firmen-Zweig der Regeln stehen zweiunddreissig. Die restlichen
   fuenfundzwanzig waren nicht falsch — sie waren nie nachgewiesen.

   Diese Datei geht sie alle durch, in einer Schleife. Fuer jede
   Sammlung, mit einem Dokument, das Firma B gehoert:

       1. Der Chef von A darf es NICHT lesen.
       2. Der Chef von A darf es NICHT ueberschreiben.
       3. Ohne Anmeldung ist es NICHT lesbar.
       4. Der Chef von B darf es lesen.

   Punkt 4 ist der wichtigste. Ein Kreuztest auf einem Pfad, den es gar
   nicht gibt, ist immer gruen: niemand kommt an ein Dokument, das
   nirgends liegt. Ohne die Gegenrichtung misst dieser Durchlauf nichts.

   Ausnahmen, die ausdruecklich oeffentlich sind, stehen unten in OFFEN —
   mit Begruendung. Wer eine hinzufuegt, muss sie begruenden koennen.

   VOLLSTAENDIG (26.10.2026). Die Liste unten war von Hand gepflegt und
   nannte 34 Pfade; im Firmen-Zweig standen da schon 56 Sammlungen.
   Keine Luecke nachgewiesen — aber 22 Sammlungen waren nie geprueft.
   Aus dem Betrieb: „Mandantentrennung in firestore.rules“ als Risiko
   vor dem ersten fremden Kunden (docs/verkauf/, Befund V8). Deshalb
   liest der Durchlauf jetzt jeden `match` unter firmen/{f} selbst aus
   den Regeln. Eine Sammlung, zu der hier kein Pfad passt, ist ein
   Fehler — auch wenn alle anderen Pruefungen gruen sind.
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
/* Die flachen Pfade aus der dokumentierten Sonde in OFFEN.md — genau
   die acht, an die ein fremdes Konto nachweislich herankam. Kurz
   gehalten: der Beweis liegt darin, dass die Grenze ueberhaupt greift,
   nicht in der Laenge der Liste. */
const FLACH = [
  ['studios/studio-0/todos/t1',       { title: 'Interne Aufgabe', done: false }],
  ['channels/allgemein/messages/m1',  { uid: 'x', name: 'Anna', text: 'Interner Chat', ts: 1 }],
  /* Mit studios: 'all' seit Runde 121 — die Leseregel prüft das Feld
     wie bei den Dokumenten. Ein Aushang OHNE Feld ist Altbestand, den
     der Server nachzieht; das prüft tests/rules/brett.test.js. */
  ['board/b1',                        { uid: 'x', name: 'Anna', text: 'Internes Brett', ts: 1, studios: 'all' }],
  ['announcements/a1',                { uid: 'x', text: 'Interne Info', ts: 1 }],
  ['studios/studio-0/handovers/h1',   { uid: 'x', name: 'Anna', text: 'Interne Uebergabe', ts: 1 }],
  /* Mit studios: 'all' seit Runde 114 (P-01): die Leseregel prüft das
     Zielfeld, und uploadDoc() legt kein Dokument ohne es an. Ohne Feld
     wäre das ein Altbestand, den die App beim Chef auf 'all' setzt —
     das prüft tests/rules/dokumente.test.js, nicht dieser Kreuztest. */
  ['documents/d1',                    { name: 'Vertrag.pdf', ts: 1, studios: 'all' }],
  ['studios/studio-0/shifts/s1',      { date: '2026-09-01', uid: 'x', name: 'Anna' }],
  /* Nachweise sind PERSOENLICH: ein Kollege darf einen fremden nicht
     lesen, und das ist richtig so. Deshalb wird hier je Konto ein
     eigener angelegt — sonst prueft die Gegenprobe „darf lesen" einen
     Fall, den die Regel zu Recht verbietet, und man repariert die
     Regel statt der Pruefung. */
  ['certificates/c1',                 { uid: 'x', name: 'Anna', art: 'ersthelfer', bis: '2027-01-01',
                                        erfasstVon: 'Anna', erfasstVonUid: 'x' }, 'eigen']
];

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
  /* mkProjects, appointments, emailTemplates, studioMetrics, competitors
     und expansionLeads stehen hier nicht mehr: die beiden Anwendungen
     dahinter sind am 13.8.2026 stillgelegt worden, ihre Regeln stehen
     auf false. Die Gegenprobe dieser Datei ("der eigene Chef kommt an
     seine Daten") gilt fuer sie nicht mehr — dass NIEMAND herankommt,
     prueft rechte.test.js. */
  ['board/b1',                                { uid: 'chefB', text: 'Aushang', ts: 1 }],
  /* Geteilte Designs (Runde 291): für jeden Aktiven der eigenen Firma
     lesbar – für eine fremde nicht. */
  ['designs/de1',                             { uid: 'mitB', von: 'Mia', name: 'Frühschicht', aufbau: { leiste: ['v-todos'] }, prefs: {}, ts: 1 }],
  ['trash/tr1',                               { col: 'todos', deletedByUid: 'chefB' }],
  ['archives/2026-08-12',                     { tag: '2026-08-12' }],
  ['fehler/abc_1',                            { text: 'kaputt', uid: 'mitB' }],
  ['pushTokens/tok-b',                        { uid: 'mitB' }],

  /* ── Seit 26.10.2026: alles, was die Handliste nicht kannte ── */
  ['abo/aktuell',                             { stufe: 'basic', status: 'test' }],
  ['config/zugriff',                          { stufe: 'voll' }],
  ['config/lagebericht',                      { text: 'Lage von B' }],
  ['channels/allgemein/gelesen/chefB',        { ts: 1 }],
  ['channels/allgemein/tippt/chefB',          { ts: 1 }],
  ['dms/dm_chefB_mitB/tippt/chefB',           { ts: 1 }],
  ['bestellungen/be1',                        { studioKeys: ['studio-0'], ts: 1 }],
  ['kennzahlen/studio-0_2026-09',             { studioKey: 'studio-0', mitglieder: 120 }],
  ['planerTeam/mitB',                         { name: 'Mit B' }],
  ['planerWuensche/w1',                       { uid: 'mitB', tag: '2026-11-03' }],
  ['planerPlaene/2026-11',                    { monat: '2026-11' }],
  ['schulungen/s1',                           { titel: 'Einweisung' }],
  ['schulungTeilnehmer/t1',                   { uid: 'mitB', name: 'Mit B' }],
  ['schulungFragenStat/m1',                   { richtig: 3, falsch: 1 }],
  ['schulungLaeufe/l1',                       { uid: 'mitB', modul: 'm1' }],
  ['loesungen/lo1',                           { titel: 'Geraet piept' }],
  ['loesungBilder/lb1',                       { data: 'BILD-VON-B' }],
  ['terminals/term1',                         { studioKey: 'studio-0', name: 'Tresen' }],
  ['zeiten/z1',                               { uid: 'mitB', studioKey: 'studio-0', art: 'kommen' }],
  ['zeitAntraege/za1',                        { uid: 'mitB', grund: 'vergessen' }],
  ['zeitAbschluesse/2026-09',                 { monat: '2026-09' }],
  ['lohnEinstellungen/aktuell',               { beraterNr: '0' }],
  ['probetrainings/pt1',                      { studioKey: 'studio-0', ts: 1 }],
  ['anliegen/an1',                            { uid: 'mitB', an: 'chef', titel: 'Frage' }],
  ['zfProtokoll/zp1',                         { uid: 'mitB', was: 'zurueckgesetzt' }],
  ['statistik/2026-10-01',                    { starts: 3 }],
  /* Privat ist nur fuer die Person selbst lesbar — also legt hier der
     Chef von B sein EIGENES an, sonst prueft die Gegenprobe einen Fall,
     den die Regel zu Recht verbietet. */
  ['privat/chefB',                            { notiz: 'privat von B' }],
  ['privat/chefB/kalender/k1',                { text: 'Termin von B' }],
  /* Fuer niemanden lesbar (allow read, write: if false). Hier zaehlt
     nur Punkt 1–3; siehe NIEMAND_LIEST. */
  ['vorfaelle/v1',                            { text: 'x' }],
  ['firmencodes/CODE1',                       { firma: B }],
  ['beitrittVersuche/mitB',                   { n: 1 }],
  ['mailVersand/mv1',                         { an: 'x@example.org' }],
  ['schulungCodes/k1',                        { code: '123' }],
  ['schulungVersuche/mitB',                   { n: 1 }],
  ['schulungLernplan/t1',                     { modul: 'm1' }],
  ['mkProjects/p1',                           { name: 'alt' }],
  ['mkProjects/p1/versions/v1',               { name: 'alt' }],
  ['zeitPins/mitB',                           { hash: 'x' }],
  ['terminalCodes/term1',                     { geheim: 'x' }],
  ['appointments/ap1',                        { name: 'alt' }],
  ['emailTemplates/et1',                      { name: 'alt' }],
  ['studioMetrics/studio-0',                  { n: 1 }],
  ['competitors/co1',                         { name: 'alt' }],
  ['expansionLeads/el1',                      { name: 'alt' }],
  ['gehirnErinnerungen/ge1',                  { text: 'x' }],
  ['gehirnGeheim/gg1',                        { text: 'x' }],
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
const NIEMAND_LIEST = ['pushTokens/tok-b',
  'vorfaelle/v1', 'firmencodes/CODE1', 'beitrittVersuche/mitB', 'mailVersand/mv1',
  'schulungCodes/k1', 'schulungVersuche/mitB', 'schulungLernplan/t1',
  'mkProjects/p1', 'mkProjects/p1/versions/v1', 'zeitPins/mitB', 'terminalCodes/term1',
  'appointments/ap1', 'emailTemplates/et1', 'studioMetrics/studio-0', 'competitors/co1',
  'expansionLeads/el1', 'gehirnErinnerungen/ge1', 'gehirnGeheim/gg1'];

/* Jeder `match` unter firmen/{f}, aus den Regeln gelesen — nicht aus
   dieser Datei. Klammern werden gezaehlt, damit verschachtelte Pfade
   (mkProjects/{p}/versions/{v}, privat/{uid}/{rest=**}) als ganzer Pfad
   herauskommen. Kommentare fallen vorher weg: in ihnen steht manches
   „match /…“, das keine Regel ist. */
function firmenPfade(text) {
  const ohne = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const zeilen = ohne.split('\n');
  const stapel = [];
  const pfade = [];
  let tiefe = 0, firmaTiefe = -1;
  for (const z of zeilen) {
    const m = z.match(/match\s+(\/\S+)\s*\{/);
    if (m) {
      if (firmaTiefe < 0 && m[1] === '/firmen/{f}') {
        firmaTiefe = tiefe;
      } else if (firmaTiefe >= 0) {
        stapel.push({ teil: m[1].replace(/^\//, ''), tiefe: tiefe });
        pfade.push(stapel.map((x) => x.teil).join('/'));
      }
    }
    /* Platzhalter wie {f} oder {rest=**} sind keine Bloecke. */
    for (const c of z.replace(/\{[^{}\s]*\}/g, '')) {
      if (c === '{') tiefe++;
      if (c === '}') {
        tiefe--;
        while (stapel.length && stapel[stapel.length - 1].tiefe >= tiefe) stapel.pop();
        if (firmaTiefe >= 0 && tiefe <= firmaTiefe) return pfade;
      }
    }
  }
  return pfade;
}
function passt(muster, pfad) {
  const re = '^' + muster.split('/').map((t) =>
    /^\{[^}]*=\*\*\}$/.test(t) ? '.+' : (/^\{[^}]*\}$/.test(t) ? '[^/]+'
      : t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('/') + '$';
  return new RegExp(re).test(pfad);
}

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

  /* ══ DER FLACHE ZWEIG ═══════════════════════════════════════════════
     Bis hierher prüfte diese Datei ausschliesslich `firmen/{f}/…`.
     Genau daran lag es, dass ein Leck monatelang unbemerkt blieb: die
     flachen Pfade — die Altdaten des ersten Betriebs — waren fuer JEDES
     aktive Konto lesbar, auch fuer eines aus einer zweiten Firma. Ein
     einfacher Mitarbeiter ohne jede Rolle kam an Aufgaben, Chat, Brett,
     Ankuendigungen, Uebergaben, Dokumente und den Dienstplan.

     Es war nicht falsch geprueft — es war NIE geprueft. Zweiunddreissig
     Sammlungen im Firmen-Zweig, null im flachen daneben.

     Die Grenze heisst jetzt `aufFlachenPfaden()`: `firma` leer ODER die
     Kennung des ersten Betriebs. Beides, damit ein noch nicht
     umgezogenes Konto nicht ausgesperrt wird — und weil die App wegen
     mandant:true ohnehin schon ueber inFirma('koerperformen') laeuft,
     das dieselbe Bedingung verlangt.

     Chef B gehoert zu 'beta'. Er darf hier NICHTS. */
  {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      /* Ein Konto der Voreinstellung — mit leerem Feld, denn genau der
         Fall darf NICHT aussperren. */
      await db.doc('users/altA').set({ name: 'Alt ohne Firma', role: 'mitarbeiter',
        studioKeys: ['studio-0'] });
      await db.doc('users/vorA').set({ name: 'Vor mit Kennung', role: 'mitarbeiter',
        firma: 'koerperformen', studioKeys: ['studio-0'] });
      await db.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });
      for (const [pfad, daten, art] of FLACH) {
        await db.doc(pfad).set(daten);
        if (art === 'eigen') {
          // je Leser ein eigenes Dokument, sonst greift die Regel zu Recht
          for (const wer of ['altA', 'vorA']) {
            await db.doc(pfad + '-' + wer).set(
              Object.assign({}, daten, { uid: wer, erfasstVonUid: wer }));
          }
        }
      }
    });

    const altA = env.authenticatedContext('altA').firestore();
    const vorA = env.authenticatedContext('vorA').firestore();

    for (const [pfad, , art] of FLACH) {
      const fuer = (wer) => art === 'eigen' ? pfad + '-' + wer : pfad;
      await pruefe('FLACH · ' + pfad + ' · fremde Firma liest NICHT', () =>
        assertFails(chefB().doc(pfad).get()));
      await pruefe('FLACH · ' + pfad + ' · fremde Firma schreibt NICHT', () =>
        assertFails(chefB().doc(pfad).set({ gekapert: true })));
      /* DIE BEIDEN GEGENPROBEN, ohne die alles oben wertlos waere:
         ein Kreuztest auf einer Sammlung, an die NIEMAND kommt, ist
         immer gruen. Und die zweite ist die eigentlich gefaehrliche —
         sperrt die neue Grenze den laufenden Betrieb aus, faellt sie
         hier auf und nicht am Montagmorgen. */
      await pruefe('GEGENPROBE FLACH · ' + pfad + ' · Konto OHNE Feld firma liest', () =>
        assertSucceeds(altA.doc(fuer('altA')).get()));
      await pruefe('GEGENPROBE FLACH · ' + pfad + ' · Konto MIT der Kennung liest', () =>
        assertSucceeds(vorA.doc(fuer('vorA')).get()));
    }

    /* Und das Auflisten: eine Regel kann einzeln greifen und die ganze
       Sammlung trotzdem preisgeben. */
    await pruefe('FLACH · fremde Firma LISTET die Aufgaben nicht', () =>
      assertFails(chefB().collection('studios/studio-0/todos').get()));
    await pruefe('GEGENPROBE FLACH · der eigene Betrieb listet sie schon', () =>
      assertSucceeds(altA.collection('studios/studio-0/todos').get()));
  }

  /* ══ users — die Sammlung, die NICHT unter firmen/ liegt ══
     Steht die Firmenpruefung nur beim Schreiben und nicht beim Lesen,
     liest ein Mitarbeiter von Alpha das Konto des Chefs von Beta samt
     E-Mail und Geburtsdatum und kann die ganze Sammlung auflisten.

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

    /* Faellt eine dieser drei um, ist die Firmengrenze auf users
       wieder offen. */
    await pruefe('users · Mitarbeiter von A liest KEIN Konto aus B', () =>
      assertFails(mitA().doc('users/chefB').get()));
    await pruefe('users · Chef von A liest KEIN Konto aus B', () =>
      assertFails(chefA().doc('users/chefB').get()));
    /* Die ganze Sammlung auflisten war der eigentliche Schaden: EIN
       Zugriff, und man hat jedes Konto jedes Kunden. */
    await pruefe('users · die ganze Sammlung laesst sich NICHT auflisten', () =>
      assertFails(mitA().collection('users').get()));
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

  /* ══ VOLLSTAENDIG ═══════════════════════════════════════════════════
     Zu jedem `match` im Firmen-Zweig muss oben ein Pfad stehen. Eine
     neue Sammlung, die nur in firestore.rules dazukommt, wird hier rot
     — bevor sie bei einem Kunden ungeprueft Daten haelt. */
  {
    const muster = firmenPfade(fs.readFileSync(REGELN, 'utf8'));
    const pfade = SAMMLUNGEN.map((x) => x[0]);
    await pruefe('VOLLSTAENDIG · die Regeln nennen ' + muster.length + ' Pfade im Firmen-Zweig (mehr als 50 erwartet)', () => {
      if (muster.length < 50) throw new Error('nur ' + muster.length + ' gefunden — liest der Zerleger die Regeln noch?');
    });
    for (const m of muster) {
      await pruefe('VOLLSTAENDIG · ' + m + ' hat einen Kreuztest', () => {
        if (!pfade.some((p) => passt(m, p))) {
          throw new Error('kein Eintrag in SAMMLUNGEN passt zu firmen/{f}/' + m);
        }
      });
    }
    /* Gegenprobe: ein erfundener Pfad darf NICHT passen. Sonst waere
       passt() zu grosszuegig und alles oben gruen, ohne etwas zu sagen. */
    await pruefe('GEGENPROBE · VOLLSTAENDIG · eine Sammlung ohne Eintrag faellt auf', () => {
      if (pfade.some((p) => passt('erfundeneSammlung/{x}', p))) throw new Error('passt() passt zu viel');
      if (!passt('privat/{uid}/{rest=**}', 'privat/chefB/kalender/k1')) throw new Error('{rest=**} wird nicht erkannt');
    });
  }

  console.log('\n── Firmengrenze, alle Sammlungen ──');
  protokoll.forEach((z) => console.log(z));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  await env.cleanup();
  process.exit(gefallen ? 1 : 0);
})();
