/* ── Lösungen: wer darf schreiben, wer darf ändern ─────────────────────
   Aus dem Betrieb, 22.9.2026: ein Bereich für Probleme, die im Studio
   anfallen, und was dagegen hilft.

   DIE ENTSCHEIDENDE FRAGE IST NICHT „wer darf lesen". Gelesen wird
   firmenweit, und das ist Absicht: ein Problem aus Rondorf hilft in
   Brühl genauso weiter. Die Studio-Angabe am Eintrag sagt, wo es
   herkommt — sie ist keine Schranke, und sie soll auch keine sein.

   Die Frage ist, WER EINEN FREMDEN EINTRAG ÄNDERN ODER LÖSCHEN DARF.
   Eine Lösung, die jeder überschreiben kann, ist nach einem halben Jahr
   keine mehr; eine, die niemand berichtigen darf, wird falsch und
   bleibt es. Deshalb: der Verfasser und die Verwaltung.

   Was NICHT gehen darf:
     · Anlegen in fremdem Namen                       → gesperrt
     · Kollege ändert den Eintrag eines anderen       → gesperrt
     · Kollege löscht den Eintrag eines anderen       → gesperrt
     · Kollege überschreibt ein fremdes FOTO          → gesperrt
     · jemand von ausserhalb der Firma liest mit      → gesperrt
     · ein stillgelegtes Konto legt etwas an          → gesperrt

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

/* Beide Welten: flach und unter firmen/<kennung>/. Die Regeln stehen
   zweimal da, also muss auch zweimal geprüft werden — eine Lücke in der
   Kopie wäre sonst unsichtbar. In diesem Projekt ist genau das schon
   fünfmal passiert. */
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
  /* ── Warum hier eine Wiederholung steht ──
     Allein läuft dieser Durchlauf durch; als LETZTER in der Kette
     scheiterte er beim ersten Leeren mit
       499 „call already cancelled"
     — eine abgebrochene gRPC-Verbindung, nicht eine Regel. Gemessen mit
     vier Versuchen hintereinander: Versuch 1 fällt, Versuch 2 klappt,
     und zwar zuverlässig.

     Das ist eine Eigenheit des Emulators nach einem grossen Vorgänger
     (studiogrenze legt zwei Firmen mit allem Drum und Dran an), kein
     Fund über diese App. Verschwiegen wird sie trotzdem nicht: drei
     Versuche, und wenn auch der dritte fällt, fällt der Durchlauf mit
     ihm — ein stilles `catch` würde hier eine leere Datenbank
     vortäuschen und jede Zeile danach wertlos machen. */
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
      /* Stillgelegt: darf gar nichts mehr. Ein Konto, das jemand
         entfernt hat, muss auch aufhören zu schreiben. */
      olaf: { name: 'Olaf', role: 'mitarbeiter', firma: 'koerperformen', aktiv: false, studioKeys: ['studio-1'] },
      /* Eine andere Firma. Der Fall, der bei einer Mandanten-App teuer
         wird, wenn man ihn vergisst. */
      zoe:  { name: 'Zoe',  role: 'chef', firma: 'fremdfirma', aktiv: true, studioKeys: ['studio-9'] }
    };
    for (const [uid, d] of Object.entries(leute)) await db.doc('users/' + uid).set(d);
    await db.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });
    await db.doc('firmen/fremdfirma').set({ name: 'Fremd', aktiv: true });

    for (const w of WELTEN) {
      await db.doc(w.pfad('loesungen/l-anna')).set({
        titel: 'Gerät 3 piept', kategorie: 'geraet', studios: ['studio-1'],
        problem: 'Piept dreimal.', loesung: 'Stecker ziehen.',
        bilder: ['b-anna'], uid: 'anna', vonName: 'Anna', ts: 1 });
      await db.doc(w.pfad('loesungBilder/b-anna')).set({
        data: 'data:image/jpeg;base64,xxx', uid: 'anna', ts: 1 });
    }
  });

  const alsAnna = env.authenticatedContext('anna').firestore();
  const alsBen  = env.authenticatedContext('ben').firestore();
  const alsLisa = env.authenticatedContext('lisa').firestore();
  const alsMax  = env.authenticatedContext('max').firestore();
  const alsOlaf = env.authenticatedContext('olaf').firestore();
  const alsZoe  = env.authenticatedContext('zoe').firestore();

  for (const w of WELTEN) {
    const P = w.pfad;
    protokoll.push('\n  ── Welt: ' + w.name + ' ──');

    // ══ Was NICHT geht ══
    await darfNicht('Anlegen in fremdem Namen',
      alsBen.doc(P('loesungen/neu-falsch')).set({
        titel: 'Nicht meins', kategorie: 'ablauf', studios: 'all',
        problem: 'x', loesung: 'y', bilder: [], uid: 'anna', vonName: 'Anna', ts: 9 }));
    await darfNicht('Kollege ändert einen fremden Eintrag',
      alsBen.doc(P('loesungen/l-anna')).update({ loesung: 'Ganz anders.' }));
    await darfNicht('Kollege löscht einen fremden Eintrag',
      alsBen.doc(P('loesungen/l-anna')).delete());
    /* Derselbe Fehler wie einst bei documentData: die Metadaten waren
       geschützt, der INHALT nicht. Wer den Eintrag nicht anfassen darf,
       darf auch das Foto nicht überschreiben. */
    await darfNicht('Kollege überschreibt ein fremdes Foto',
      alsBen.doc(P('loesungBilder/b-anna')).update({ data: 'data:image/jpeg;base64,zzz' }));
    await darfNicht('Ein stillgelegtes Konto legt etwas an',
      alsOlaf.doc(P('loesungen/neu-olaf')).set({
        titel: 'Noch da?', kategorie: 'ablauf', studios: 'all',
        problem: 'x', loesung: 'y', bilder: [], uid: 'olaf', vonName: 'Olaf', ts: 9 }));
    await darfNicht('Jemand aus einer anderen Firma liest mit',
      alsZoe.doc(P('loesungen/l-anna')).get());
    await darfNicht('Jemand aus einer anderen Firma legt etwas an',
      alsZoe.doc(P('loesungen/neu-zoe')).set({
        titel: 'Fremd', kategorie: 'ablauf', studios: 'all',
        problem: 'x', loesung: 'y', bilder: [], uid: 'zoe', vonName: 'Zoe', ts: 9 }));

    // ══ Und die Gegenproben ══
    /* Ohne sie wäre alles oben auch bei einer Regel „verbiete alles"
       grün — und der Bereich unbenutzbar, ohne dass es auffiele. */
    await darf('GEGENPROBE ein Kollege aus einem ANDEREN Studio darf lesen',
      alsBen.doc(P('loesungen/l-anna')).get());
    await darf('GEGENPROBE und auch das Foto dazu',
      alsBen.doc(P('loesungBilder/b-anna')).get());
    await darf('GEGENPROBE jeder Aktive darf etwas anlegen',
      alsBen.doc(P('loesungen/neu-ben')).set({
        titel: 'Meins', kategorie: 'technik', studios: 'all',
        problem: 'x', loesung: 'y', bilder: [], uid: 'ben', vonName: 'Ben', ts: 9 }));
    await darf('GEGENPROBE und ein Foto dazu',
      alsBen.doc(P('loesungBilder/b-ben')).set({
        data: 'data:image/jpeg;base64,yyy', uid: 'ben', ts: 9 }));
    await darf('GEGENPROBE der Verfasser bessert seinen Eintrag nach',
      alsAnna.doc(P('loesungen/l-anna')).update({ loesung: 'Stecker ziehen, dann warten.' }));
    await darf('GEGENPROBE die Studioleitung darf berichtigen',
      alsLisa.doc(P('loesungen/l-anna')).update({ kategorie: 'technik' }));
    await darf('GEGENPROBE der Chef darf löschen',
      alsMax.doc(P('loesungen/neu-ben')).delete());
    await darf('GEGENPROBE der Verfasser löscht sein eigenes Foto',
      alsBen.doc(P('loesungBilder/b-ben')).delete());
  }

  console.log('\n── Lösungen: Regeln ──');
  protokoll.forEach(z => console.log(z));
  console.log('\n' + (gefallen
    ? '✗ ' + gefallen + ' Fehler, ' + bestanden + ' in Ordnung'
    : '✓ Lösungen: firmenweit lesbar, aber nur Verfasser und Verwaltung ' +
      'ändern — ' + bestanden + ' Zusicherungen'));
  await env.cleanup();
  process.exit(gefallen ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
