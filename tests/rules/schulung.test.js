/* ── Schulung: der Nachweis muss einer bleiben ─────────────────────────
   Aus dem Betrieb, 22.9.2026: Webinare mit Videos und Fragen, und
   danach eine Liste, wer es gemacht hat, wann, wie lange und wie oft er
   für eine Frage gebraucht hat.

   DIE ENTSCHEIDENDE ZEILE IST NICHT „wer darf lesen". Sie lautet:
   NIEMAND DARF EINEN DURCHLAUF ANLEGEN — auch der Chef nicht. Ein
   Durchlauf entsteht ausschliesslich in der Cloud Function
   `schulungStart`, und erst, nachdem der Teilnahme-Code gestimmt hat.

   Dürfte der Browser ihn anlegen, schriebe sich jeder mit der Konsole
   einen fertigen, bestandenen Durchlauf auf einen fremden Namen. Die
   ganze Liste wäre dann eine Behauptung statt eines Nachweises — und
   eine Schulungsliste, der man nicht glauben kann, ist schlimmer als
   gar keine: man glaubt ihr trotzdem.

   Die zweite Zeile, die trägt: EIN ABGESCHLOSSENER DURCHLAUF ÄNDERT
   SICH NICHT MEHR. Dasselbe Muster wie bei den Nachweisen
   (certificates), und aus demselben Grund — sonst liesse sich ein
   „bestanden" nachträglich hineinschreiben.

   Was NICHT gehen darf:
     · irgendjemand legt einen Durchlauf an               → gesperrt
     · ein Kollege liest den Durchlauf eines anderen      → gesperrt
     · jemand liest die Teilnahme-CODES                   → gesperrt, für ALLE
     · jemand liest oder leert die Fehlversuch-Bremse     → gesperrt, für ALLE
     · ein Mitarbeiter legt ein Modul an                  → gesperrt
     · ein fremdes Gerät schreibt am laufenden Durchlauf  → gesperrt
     · das Gerät hängt den Durchlauf auf einen anderen Namen um → gesperrt
     · das Gerät ändert einen FERTIGEN Durchlauf          → gesperrt
     · jemand von ausserhalb der Firma liest mit          → gesperrt

   Und die Gegenproben, ohne die die Liste auch bei einer Regel
   „verbiete alles" grün wäre.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertFails, assertSucceeds } =
  require(path.join(__dirname, 'node_modules', '@firebase/rules-unit-testing'));

let bestanden = 0, gefallen = 0;
const protokoll = [];
async function darf(name, versprechen) {
  try { await assertSucceeds(versprechen); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — sollte gehen, ging nicht'); }
}
async function darfNicht(name, versprechen) {
  try { await assertFails(versprechen); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — GING DURCH'); }
}

/* Beide Welten: flach und unter firmen/<kennung>/. Eine Sammlung, die
   es nur auf einem der beiden Pfade gibt, ist die Lücke, die in diesem
   Projekt schon fünfmal zugeschlagen hat. */
const WELTEN = [
  { name: 'flach', pfad: (s) => s },
  { name: 'firma', pfad: (s) => 'firmen/koerperformen/' + s }
];

(async () => {
  const env = await initializeTestEnvironment({
    projectId: 'demo-regeltest',
    firestore: {
      host: '127.0.0.1', port: 8791,
      rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8')
    }
  });
  /* Dieselbe Wiederholung wie in loesungen.test.js: als später Eintrag
     in der Kette fällt das erste Leeren mit 499 „call already
     cancelled" — eine abgebrochene gRPC-Verbindung, keine Regel.
     Gemessen: Versuch 1 fällt, Versuch 2 klappt. Drei Versuche, und
     wenn auch der dritte fällt, fällt der Durchlauf mit ihm — ein
     stilles `catch` würde hier eine leere Datenbank vortäuschen und
     jede Zeile danach wertlos machen. */
  for (let versuch = 1; ; versuch++) {
    try { await env.clearFirestore(); break; }
    catch (e) {
      if (versuch >= 3) throw e;
      await new Promise(r => setTimeout(r, 400));
    }
  }

  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const leute = {
      anna: { name: 'Anna', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
      ben:  { name: 'Ben',  role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-2'] },
      lisa: { name: 'Lisa', role: 'leiter',      firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
      max:  { name: 'Max',  role: 'chef',        firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1','studio-2'] },
      /* Das Tablet im Studio. Ein ganz normales Konto des Betriebs —
         genau so läuft es in Wirklichkeit, und genau deshalb braucht
         die Person davor einen Code statt eines Logins. */
      tablet: { name: 'Empfang Rondorf', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
      zoe:  { name: 'Zoe',  role: 'chef', firma: 'fremdfirma', aktiv: true, studioKeys: ['studio-9'] }
    };
    for (const [uid, d] of Object.entries(leute)) await db.doc('users/' + uid).set(d);
    await db.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });
    await db.doc('firmen/fremdfirma').set({ name: 'Fremd', aktiv: true });

    for (const w of WELTEN) {
      await db.doc(w.pfad('schulungen/m-hygiene')).set({
        titel: 'Hygiene im Studio', kategorie: 'hygiene', aktiv: true,
        strenge: 'alles', schritte: [], fragen: [], ts: 1 });
      await db.doc(w.pfad('schulungTeilnehmer/t-anna')).set({
        name: 'Anna', uid: 'anna', kennung: 'M4K7', gesperrt: false, ts: 1 });
      /* Ein Teilnehmer OHNE Konto — der eigentliche Fall: jemand macht
         die Einarbeitung, bevor er einen Zugang hat. */
      await db.doc(w.pfad('schulungTeilnehmer/t-neu')).set({
        name: 'Neue Kollegin', uid: null, kennung: 'RPQ2', gesperrt: false, ts: 1 });
      await db.doc(w.pfad('schulungCodes/M4K7')).set({
        hash: 'xxx', salz: 'yyy', teilnehmer: 't-anna', ts: 1 });
      await db.doc(w.pfad('schulungVersuche/tablet')).set({ zahl: 3, seit: 1 });
      /* Ein laufender Durchlauf auf dem Tablet, für Anna. */
      await db.doc(w.pfad('schulungLaeufe/l-laeuft')).set({
        modul: 'm-hygiene', modulTitel: 'Hygiene im Studio', kategorie: 'hygiene',
        teilnehmer: 't-anna', teilnehmerName: 'Anna', uid: 'anna',
        geraetUid: 'tablet', geraetName: 'Empfang Rondorf', studioKey: 'studio-1',
        start: 1, ende: 0, aktivMs: 0, durchgang: 1,
        schritteGesehen: [], fragen: [], punkte: 0, bestanden: false,
        status: 'laeuft', ts: 1 });
      /* Und einer, der fertig ist. Der ist der Nachweis. */
      await db.doc(w.pfad('schulungLaeufe/l-fertig')).set({
        modul: 'm-hygiene', modulTitel: 'Hygiene im Studio', kategorie: 'hygiene',
        teilnehmer: 't-neu', teilnehmerName: 'Neue Kollegin', uid: null,
        geraetUid: 'tablet', geraetName: 'Empfang Rondorf', studioKey: 'studio-1',
        start: 1, ende: 2, aktivMs: 1, durchgang: 1,
        schritteGesehen: [0], fragen: [], punkte: 100, bestanden: true,
        status: 'fertig', ts: 2 });
    }
  });

  const alsAnna   = env.authenticatedContext('anna').firestore();
  const alsBen    = env.authenticatedContext('ben').firestore();
  const alsLisa   = env.authenticatedContext('lisa').firestore();
  const alsMax    = env.authenticatedContext('max').firestore();
  const alsTablet = env.authenticatedContext('tablet').firestore();
  const alsZoe    = env.authenticatedContext('zoe').firestore();

  for (const w of WELTEN) {
    const P = w.pfad;
    protokoll.push('\n  ── Welt: ' + w.name + ' ──');

    // ══ Die Zeile, auf die es ankommt ══
    await darfNicht('NIEMAND legt einen Durchlauf an — auch der Chef nicht',
      alsMax.doc(P('schulungLaeufe/neu-max')).set({
        modul: 'm-hygiene', teilnehmer: 't-anna', teilnehmerName: 'Anna',
        geraetUid: 'max', status: 'fertig', bestanden: true, ts: 9 }));
    await darfNicht('… und ein Mitarbeiter erst recht nicht',
      alsAnna.doc(P('schulungLaeufe/neu-anna')).set({
        modul: 'm-hygiene', teilnehmer: 't-anna', teilnehmerName: 'Anna',
        geraetUid: 'anna', status: 'fertig', bestanden: true, ts: 9 }));

    // ══ Der fertige Durchlauf ist ein Nachweis ══
    await darfNicht('ein FERTIGER Durchlauf lässt sich nicht mehr ändern',
      alsTablet.doc(P('schulungLaeufe/l-fertig')).update({ punkte: 42 }));
    await darfNicht('… auch nicht von der Leitung',
      alsLisa.doc(P('schulungLaeufe/l-fertig')).update({ bestanden: false }));

    // ══ Der laufende Durchlauf gehört dem Gerät ══
    await darfNicht('ein fremdes Gerät schreibt am laufenden Durchlauf',
      alsBen.doc(P('schulungLaeufe/l-laeuft')).update({ aktivMs: 999 }));
    /* Der teuerste Fall, und der unauffälligste: das Tablet DARF
       schreiben — es könnte den Durchlauf also mitten im Lauf auf
       einen anderen Namen umhängen und jemandem eine Schulung
       gutschreiben, die er nie gemacht hat. */
    await darfNicht('das Gerät hängt den Durchlauf auf einen anderen Namen um',
      alsTablet.doc(P('schulungLaeufe/l-laeuft')).update({
        teilnehmer: 't-neu', teilnehmerName: 'Neue Kollegin' }));
    await darfNicht('das Gerät schiebt den Durchlauf auf ein anderes Modul',
      alsTablet.doc(P('schulungLaeufe/l-laeuft')).update({ modul: 'm-anderes' }));
    await darfNicht('das Gerät schreibt sich selbst um',
      alsTablet.doc(P('schulungLaeufe/l-laeuft')).update({ geraetUid: 'anna' }));

    // ══ Die Codes ══
    await darfNicht('niemand liest die Teilnahme-Codes — auch der Chef nicht',
      alsMax.doc(P('schulungCodes/M4K7')).get());
    await darfNicht('… und die Leitung auch nicht',
      alsLisa.doc(P('schulungCodes/M4K7')).get());
    await darfNicht('niemand schreibt einen Code von Hand',
      alsMax.doc(P('schulungCodes/NEUX')).set({ hash: 'a', salz: 'b', teilnehmer: 't-anna' }));
    await darfNicht('niemand leert die Fehlversuch-Bremse',
      alsTablet.doc(P('schulungVersuche/tablet')).set({ zahl: 0, seit: 9 }));
    await darfNicht('… und niemand liest sie aus',
      alsMax.doc(P('schulungVersuche/tablet')).get());

    // ══ Wer sieht wen ══
    await darfNicht('ein Kollege liest den Durchlauf eines anderen',
      alsBen.doc(P('schulungLaeufe/l-laeuft')).get());
    await darfNicht('ein Kollege liest einen fremden Teilnehmer-Eintrag',
      alsBen.doc(P('schulungTeilnehmer/t-anna')).get());
    await darfNicht('ein Mitarbeiter legt ein Modul an',
      alsAnna.doc(P('schulungen/m-neu')).set({ titel: 'Meins', kategorie: 'sonstig', ts: 9 }));
    await darfNicht('ein Mitarbeiter legt einen Teilnehmer an',
      alsAnna.doc(P('schulungTeilnehmer/t-fake')).set({ name: 'Frei erfunden', ts: 9 }));

    // ══ Die Firmengrenze ══
    await darfNicht('jemand aus einer anderen Firma liest die Module',
      alsZoe.doc(P('schulungen/m-hygiene')).get());
    await darfNicht('jemand aus einer anderen Firma liest die Durchläufe',
      alsZoe.doc(P('schulungLaeufe/l-fertig')).get());

    // ══ Und die Gegenproben ══
    /* Ohne sie wäre alles oben auch bei einer Regel „verbiete alles"
       grün — und der ganze Bereich unbenutzbar, ohne dass es auffiele. */
    await darf('GEGENPROBE jeder Aktive darf die Module lesen',
      alsBen.doc(P('schulungen/m-hygiene')).get());
    await darf('GEGENPROBE die Leitung legt ein Modul an',
      alsLisa.doc(P('schulungen/m-neu-lisa')).set({
        titel: 'Notfall', kategorie: 'notfall', aktiv: true,
        strenge: 'alles', schritte: [], fragen: [], ts: 9 }));
    await darf('GEGENPROBE die Leitung legt einen Teilnehmer an',
      alsLisa.doc(P('schulungTeilnehmer/t-neu-lisa')).set({
        name: 'Noch jemand', uid: null, kennung: 'XT9B', gesperrt: false, ts: 9 }));
    await darf('GEGENPROBE die Leitung liest die Durchläufe',
      alsLisa.doc(P('schulungLaeufe/l-fertig')).get());
    /* Die Zusage aus dem Betrieb: „jeder sieht seine eigenen Zahlen."
       Ohne diese Zeile wäre die Auswertung eine heimliche Akte. */
    await darf('GEGENPROBE die Person sieht ihren EIGENEN Durchlauf',
      alsAnna.doc(P('schulungLaeufe/l-laeuft')).get());
    await darf('GEGENPROBE und ihren eigenen Teilnehmer-Eintrag',
      alsAnna.doc(P('schulungTeilnehmer/t-anna')).get());
    await darf('GEGENPROBE das Gerät schreibt seinen laufenden Durchlauf fort',
      alsTablet.doc(P('schulungLaeufe/l-laeuft')).update({
        aktivMs: 120000, schritteGesehen: [0, 1] }));
    await darf('GEGENPROBE und schliesst ihn ab',
      alsTablet.doc(P('schulungLaeufe/l-laeuft')).update({
        status: 'fertig', ende: 3, bestanden: true, punkte: 100 }));
    await darf('GEGENPROBE der Chef darf einen Durchlauf löschen',
      alsMax.doc(P('schulungLaeufe/l-fertig')).delete());
  }

  console.log('\n── Schulung: Regeln ──');
  protokoll.forEach(z => console.log(z));
  console.log('\n' + (gefallen
    ? '✗ ' + gefallen + ' Fehler, ' + bestanden + ' in Ordnung'
    : '✓ Schulung: Durchläufe entstehen nur über den Code, ein fertiger ' +
      'bleibt stehen, und die Codes liest niemand — ' + bestanden + ' Zusicherungen'));
  await env.cleanup();
  process.exit(gefallen ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
