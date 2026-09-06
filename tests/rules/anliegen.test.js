/* ── Anliegen: was jemand ABSICHTLICH herausgibt ───────────────────────
   Der persönliche Bereich ist privat. Wünsche, Vorschläge und
   Entwicklungsziele werden erst sichtbar, wenn jemand „Abschicken"
   drückt — der Nutzer hat das ausdrücklich so verlangt:

     „Gar nichts, außer ich schicke es ausdrücklich ab."
     „Ich entscheide je Eintrag, an wen."

   DAS IST DIE ERSTE SAMMLUNG DIESER APP, DIE NICHT JEDER AKTIVE LESEN
   DARF. Abwesenheiten, Übergaben und das Schwarze Brett stehen dem
   ganzen Team offen; das ist dort richtig. Hier wäre es der ganze
   Unterschied: ein Anliegen an die Geschäftsführung, das der Kollege
   nebenan mitliest, ist kein Anliegen an die Geschäftsführung.

   Deshalb ist der Kern dieses Durchlaufs nicht „es lässt sich
   abschicken", sondern die Liste dessen, was NICHT geht:

     · Kollege liest ein fremdes Anliegen               → gesperrt
     · Studioleiter liest eines, das an den Chef ging   → gesperrt
     · Studioleiter liest eines aus einem FREMDEN Studio → gesperrt
     · jemand schickt in fremdem Namen ab               → gesperrt
     · jemand legt es gleich als „beantwortet" an       → gesperrt
     · die Leitung schreibt den TEXT um statt zu antworten → gesperrt
     · der Absender zieht eine beantwortete Bitte zurück → gesperrt
     · ein Kollege löscht ein fremdes Anliegen          → gesperrt

   Und die Gegenproben, ohne die die Liste oben auch bei einer Regel
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
   Kopie wäre sonst unsichtbar. */
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
  await env.clearFirestore();

  /* Ausgangslage ohne Regeln anlegen. anna und ben sind Mitarbeiter in
     verschiedenen Studios, lisa leitet studio-1, max ist Chef. */
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const leute = {
      anna: { name: 'Anna', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
      ben:  { name: 'Ben',  role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
      lisa: { name: 'Lisa', role: 'leiter',      firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
      timo: { name: 'Timo', role: 'leiter',      firma: 'koerperformen', aktiv: true, studioKeys: ['studio-2'] },
      max:  { name: 'Max',  role: 'chef',        firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1','studio-2'] }
    };
    for (const [uid, d] of Object.entries(leute)) await db.doc('users/' + uid).set(d);
    await db.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });

    for (const w of WELTEN) {
      // An den Chef
      await db.doc(w.pfad('anliegen/a-chef')).set({
        art: 'wunsch', titel: 'Neue Gurte', uid: 'anna', name: 'Anna',
        an: 'chef', status: 'offen', ts: 1 });
      // An die Leitung von studio-1
      await db.doc(w.pfad('anliegen/a-leiter')).set({
        art: 'wunsch', titel: 'Frühschicht bitte', uid: 'anna', name: 'Anna',
        an: 'leiter', studioKey: 'studio-1', status: 'offen', ts: 2 });
      // Schon beantwortet
      await db.doc(w.pfad('anliegen/a-fertig')).set({
        art: 'ziel', titel: 'Trainer-B-Lizenz', uid: 'anna', name: 'Anna',
        an: 'chef', status: 'beantwortet', antwort: 'Machen wir', ts: 3 });
    }
  });

  const alsAnna = env.authenticatedContext('anna').firestore();
  const alsBen  = env.authenticatedContext('ben').firestore();
  const alsLisa = env.authenticatedContext('lisa').firestore();
  const alsTimo = env.authenticatedContext('timo').firestore();
  const alsMax  = env.authenticatedContext('max').firestore();

  for (const w of WELTEN) {
    const P = w.pfad;
    protokoll.push('\n  ── Welt: ' + w.name + ' ──');

    // ══ Was NICHT geht ══
    await darfNicht('Kollege liest ein fremdes Anliegen',
      alsBen.doc(P('anliegen/a-chef')).get());
    await darfNicht('Studioleiter liest eines, das an den Chef ging',
      alsLisa.doc(P('anliegen/a-chef')).get());
    await darfNicht('Studioleiter eines FREMDEN Studios liest mit',
      alsTimo.doc(P('anliegen/a-leiter')).get());
    await darfNicht('Abschicken in fremdem Namen',
      alsBen.doc(P('anliegen/neu1')).set({
        art: 'wunsch', titel: 'Nicht meins', uid: 'anna', name: 'Anna',
        an: 'chef', status: 'offen', ts: 9 }));
    await darfNicht('Gleich als „beantwortet" anlegen',
      alsAnna.doc(P('anliegen/neu2')).set({
        art: 'wunsch', titel: 'Selbst genehmigt', uid: 'anna', name: 'Anna',
        an: 'chef', status: 'beantwortet', antwort: 'ja klar', ts: 9 }));
    await darfNicht('Mit einer Antwort im Gepäck anlegen',
      alsAnna.doc(P('anliegen/neu3')).set({
        art: 'wunsch', titel: 'Mit Antwort', uid: 'anna', name: 'Anna',
        an: 'chef', status: 'offen', antwort: 'schon da', ts: 9 }));
    await darfNicht('An niemanden gerichtet abschicken',
      alsAnna.doc(P('anliegen/neu4')).set({
        art: 'wunsch', titel: 'Ins Blaue', uid: 'anna', name: 'Anna',
        an: 'alle', status: 'offen', ts: 9 }));
    /* Der teuerste Fall: die Leitung antwortet nicht, sondern schreibt
       den Text um. Hinterher stünde etwas anderes da, als abgeschickt
       wurde — und der Absender könnte es nicht beweisen. */
    await darfNicht('Die Leitung schreibt den Titel um statt zu antworten',
      alsMax.doc(P('anliegen/a-chef')).update({ titel: 'Etwas ganz anderes' }));
    await darfNicht('… oder ändert den Absender',
      alsMax.doc(P('anliegen/a-chef')).update({
        antwort: 'ok', antwortVon: 'Max', antwortAm: 5,
        status: 'beantwortet', uid: 'ben' }));
    await darfNicht('Antworten ohne den Status mitzusetzen',
      alsMax.doc(P('anliegen/a-chef')).update({ antwort: 'ok' }));
    await darfNicht('Der Absender beantwortet sich selbst',
      alsAnna.doc(P('anliegen/a-chef')).update({
        antwort: 'genehmigt', antwortVon: 'Anna', antwortAm: 5,
        status: 'beantwortet' }));
    await darfNicht('Ein Kollege löscht ein fremdes Anliegen',
      alsBen.doc(P('anliegen/a-chef')).delete());
    await darfNicht('Der Absender zieht eine BEANTWORTETE Bitte zurück',
      alsAnna.doc(P('anliegen/a-fertig')).delete());

    // ══ Gegenproben: was gehen MUSS ══
    await darf('(Gegenprobe) Anna liest ihr eigenes Anliegen',
      alsAnna.doc(P('anliegen/a-chef')).get());
    await darf('(Gegenprobe) Der Chef liest es',
      alsMax.doc(P('anliegen/a-chef')).get());
    await darf('(Gegenprobe) Die Leitung des Studios liest ihres',
      alsLisa.doc(P('anliegen/a-leiter')).get());
    await darf('(Gegenprobe) Anna schickt etwas ab',
      alsAnna.doc(P('anliegen/gut1')).set({
        art: 'vorschlag', titel: 'Neue Matten', text: 'Die alten rutschen',
        uid: 'anna', name: 'Anna', an: 'chef', status: 'offen', ts: 9 }));
    await darf('(Gegenprobe) Anna zieht das Offene zurück',
      alsAnna.doc(P('anliegen/gut1')).delete());
    await darf('(Gegenprobe) Der Chef antwortet',
      alsMax.doc(P('anliegen/a-chef')).update({
        antwort: 'Bestellt', antwortVon: 'Max', antwortAm: 7,
        status: 'beantwortet' }));
    await darf('(Gegenprobe) Die Studioleitung antwortet auf ihres',
      alsLisa.doc(P('anliegen/a-leiter')).update({
        antwort: 'Passt', antwortVon: 'Lisa', antwortAm: 7,
        status: 'beantwortet' }));
  }

  /* ── Eine Abfrage, nicht nur ein einzelnes Dokument ──
     Firestore prüft bei einer Liste jedes Dokument. Eine Regel, die
     einzeln greift, kann eine Abfrage trotzdem ganz durchlassen oder
     ganz sperren — das ist ein eigener Fall und keine Wiederholung. */
  protokoll.push('\n  ── Abfragen ──');
  await darfNicht('Ein Kollege listet ALLE Anliegen',
    alsBen.collection('anliegen').get());
  await darf('(Gegenprobe) Anna listet ihre eigenen',
    alsAnna.collection('anliegen').where('uid', '==', 'anna').get());
  await darf('(Gegenprobe) Der Chef listet alle',
    alsMax.collection('anliegen').get());
  await darf('(Gegenprobe) Die Leitung listet die ihres Studios',
    alsLisa.collection('anliegen')
      .where('an', '==', 'leiter').where('studioKey', '==', 'studio-1').get());
  await darfNicht('Die Leitung listet ein fremdes Studio',
    alsLisa.collection('anliegen')
      .where('an', '==', 'leiter').where('studioKey', '==', 'studio-2').get());

  await env.cleanup();
  console.log('\n' + protokoll.join('\n'));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen\n');
  if (gefallen) {
    console.log('✗ Anliegen: die Sichtbarkeit haelt nicht, was der Knopf verspricht.');
    process.exit(1);
  }
  console.log('✓ Anliegen: nur der Absender und der gewaehlte Kreis sehen es, ' +
    'und geantwortet wird nur mit einer Antwort.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
