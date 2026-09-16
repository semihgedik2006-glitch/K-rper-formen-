/* ── DIE ABO-SPERRE: 'nurlesen' und 'zu' ──────────────────────────────
   Aus docs/ABO-PLAN.md, Abschnitt 3 — und aus der Lehre, die dort
   danebensteht:

     „Der Zustand `nurlesen` ist die einzige neue Grenze, und er gehört
      in firestore.rules, nicht in die App. Sonst schreibt jeder
      weiter, der die Adresse kennt. Genau dieser Fehler ist beim
      Sperren zwei Tage lang unbemerkt geblieben."

   Was dieser Durchlauf festhält:

     · nurlesen → LESEN geht weiter, für alle Rollen
     · nurlesen → ANLEGEN, ÄNDERN, LÖSCHEN geht nicht, auch nicht für
       den Chef. Ein Chef, der weiterschreiben darf, ist keine Sperre
     · zu       → dasselbe, nur zusätzlich mit Blick auf später
     · kein Abo-Eintrag → alles wie bisher. DAS IST DIE WICHTIGSTE
       ZEILE: heute hat kein einziger Bestandskunde einen Eintrag
     · gratis, test, aktiv, faellig, mahnung1, mahnung2 → voller Zugriff
     · der Betreiber kommt an das Abo heran, AUCH bei 'zu' — sonst
       könnte niemand eine Sperre je wieder aufheben
     · pushTokens bleibt offen, damit kein Handy beim Start hängen bleibt

   Und die Gegenproben, ohne die eine Regel „verbiete alles" grün wäre.
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

/* Vier Betriebe nebeneinander, damit jeder Zustand gleichzeitig
   geprüft werden kann und keiner den anderen beeinflusst. */
const BETRIEBE = {
  offen:  null,          // kein Abo-Eintrag — der heutige Bestandskunde
  frei:   'gratis',
  lesen:  'nurlesen',
  dicht:  'zu',
};

(async () => {
  const env = await initializeTestEnvironment({
    projectId: 'demo-regeltest',
    firestore: {
      host: '127.0.0.1', port: 8791,
      rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8')
    }
  });
  await env.clearFirestore();

  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [k, status] of Object.entries(BETRIEBE)) {
      await db.doc('firmen/' + k).set({ name: 'Betrieb ' + k, aktiv: true });
      if (status) {
        await db.doc('firmen/' + k + '/abo/aktuell').set({ status: status, stufe: 'basic' });
      }
      /* Je Betrieb ein Mitarbeiter und ein Chef. */
      await db.doc('users/ma-' + k).set({
        name: 'Mitarbeiter', role: 'mitarbeiter', firma: k, aktiv: true,
        studioKeys: ['studio-1'] });
      await db.doc('users/chef-' + k).set({
        name: 'Chef', role: 'chef', firma: k, aktiv: true,
        studioKeys: ['studio-1'] });
      /* Etwas Vorhandenes zum Lesen und zum Ändern. */
      await db.doc('firmen/' + k + '/studios/studio-1/todos/t1').set({
        title: 'Vorhanden', done: false, ts: 1 });
      await db.doc('firmen/' + k + '/board/b1').set({
        uid: 'ma-' + k, text: 'Aushang', ts: 1 });
      await db.doc('firmen/' + k + '/privat/ma-' + k).set({ notiz: 'meins' });
    }
    /* Der Betreiber. Ein Chef-Konto mit dem Feld admin. */
    await db.doc('users/betreiber').set({
      name: 'Betreiber', role: 'chef', firma: 'offen', aktiv: true, admin: true });
  });

  const alsMa   = (k) => env.authenticatedContext('ma-' + k).firestore();
  const alsChef = (k) => env.authenticatedContext('chef-' + k).firestore();
  const alsBetreiber = env.authenticatedContext('betreiber').firestore();

  const P = (k, s) => 'firmen/' + k + '/' + s;

  /* ═══ 1. Lesen bleibt in JEDEM Zustand offen ═══
     Dienstpläne, Putzplan und Nachweise sind Betriebsunterlagen. Sie
     von einem Tag auf den anderen unerreichbar zu machen ist etwas
     anderes, als eine Software abzuschalten. */
  protokoll.push('\n  ── Lesen bleibt offen, in jedem Zustand ──');
  for (const k of Object.keys(BETRIEBE)) {
    await darf(k + ': Mitarbeiter liest eine Aufgabe',
      alsMa(k).doc(P(k, 'studios/studio-1/todos/t1')).get());
    await darf(k + ': Chef liest das Schwarze Brett',
      alsChef(k).doc(P(k, 'board/b1')).get());
    await darf(k + ': eigener persönlicher Bereich bleibt lesbar',
      alsMa(k).doc(P(k, 'privat/ma-' + k)).get());
  }

  /* ═══ 2. Ohne Abo-Eintrag ändert sich NICHTS ═══
     Die wichtigste Zusicherung im ganzen Durchlauf. Am Tag der
     Auslieferung hat kein einziger Bestandskunde einen Eintrag — eine
     Regel, die aus „leer" ein „zu" macht, legte alle still. */
  protokoll.push('\n  ── Ohne Abo-Eintrag bleibt alles wie bisher ──');
  await darf('kein Eintrag: Chef legt eine Aufgabe an',
    alsChef('offen').doc(P('offen', 'studios/studio-1/todos/neu')).set(
      { title: 'Neu', done: false, ts: 2 }));
  await darf('kein Eintrag: Mitarbeiter schreibt ans Brett',
    alsMa('offen').doc(P('offen', 'board/neu')).set(
      { uid: 'ma-offen', text: 'Hallo', ts: 2 }));
  await darf('kein Eintrag: eigener persönlicher Bereich',
    alsMa('offen').doc(P('offen', 'privat/ma-offen')).set({ notiz: 'neu' }));

  protokoll.push('\n  ── gratis schreibt weiter (Bestandsschutz) ──');
  await darf('gratis: Chef legt eine Aufgabe an',
    alsChef('frei').doc(P('frei', 'studios/studio-1/todos/neu')).set(
      { title: 'Neu', done: false, ts: 2 }));
  await darf('gratis: Mitarbeiter schreibt ans Brett',
    alsMa('frei').doc(P('frei', 'board/neu')).set(
      { uid: 'ma-frei', text: 'Hallo', ts: 2 }));

  /* ═══ 3. nurlesen sperrt jedes Schreiben — auch das des Chefs ═══ */
  protokoll.push('\n  ── nurlesen: nichts mehr anlegen oder ändern ──');
  await darfNicht('nurlesen: Chef legt eine Aufgabe an',
    alsChef('lesen').doc(P('lesen', 'studios/studio-1/todos/neu')).set(
      { title: 'Neu', done: false, ts: 2 }));
  await darfNicht('nurlesen: Mitarbeiter hakt eine Aufgabe ab',
    alsMa('lesen').doc(P('lesen', 'studios/studio-1/todos/t1')).update(
      { done: true, doneByUid: 'ma-lesen' }));
  await darfNicht('nurlesen: Chef löscht eine Aufgabe',
    alsChef('lesen').doc(P('lesen', 'studios/studio-1/todos/t1')).delete());
  await darfNicht('nurlesen: Mitarbeiter schreibt ans Brett',
    alsMa('lesen').doc(P('lesen', 'board/neu')).set(
      { uid: 'ma-lesen', text: 'Hallo', ts: 2 }));
  await darfNicht('nurlesen: Chat-Nachricht senden',
    alsMa('lesen').doc(P('lesen', 'channels/studio-1/messages/m1')).set(
      { uid: 'ma-lesen', text: 'Hallo', ts: 2 }));
  await darfNicht('nurlesen: Abwesenheit melden',
    alsMa('lesen').doc(P('lesen', 'studios/studio-1/absences/a1')).set(
      { uid: 'ma-lesen', name: 'Mitarbeiter', type: 'urlaub',
        from: '2026-01-01', to: '2026-01-05', status: 'offen' }));
  await darfNicht('nurlesen: eigener persönlicher Bereich',
    alsMa('lesen').doc(P('lesen', 'privat/ma-lesen')).set({ notiz: 'neu' }));
  await darfNicht('nurlesen: Chef ändert die Einstellungen',
    alsChef('lesen').doc(P('lesen', 'config/features')).set({ chat: false }));

  /* ═══ 4. zu sperrt ebenso ═══ */
  protokoll.push('\n  ── zu: dasselbe ──');
  await darfNicht('zu: Chef legt eine Aufgabe an',
    alsChef('dicht').doc(P('dicht', 'studios/studio-1/todos/neu')).set(
      { title: 'Neu', done: false, ts: 2 }));
  await darfNicht('zu: Mitarbeiter schreibt ans Brett',
    alsMa('dicht').doc(P('dicht', 'board/neu')).set(
      { uid: 'ma-dicht', text: 'Hallo', ts: 2 }));

  /* ═══ 5. Der Betreiber muss eine Sperre aufheben können ═══
     Ohne diese Zeile wäre die Sperre eine Einbahnstraße: der Zustand
     liegt unter firmen/<k>/abo/aktuell, und wenn die Schreibsperre für
     ihn selbst gälte, käme niemand mehr heran. Ein Kunde, der zahlt,
     bliebe für immer gesperrt. */
  protokoll.push('\n  ── Der Betreiber kommt immer an das Abo ──');
  await darf('Betreiber setzt das Abo eines gesperrten Betriebs',
    alsBetreiber.doc('firmen/dicht/abo/aktuell').set(
      { status: 'aktiv', stufe: 'basic' }, { merge: true }));
  await darf('Betreiber setzt das Abo eines nurlesen-Betriebs',
    alsBetreiber.doc('firmen/lesen/abo/aktuell').set(
      { status: 'aktiv', stufe: 'basic' }, { merge: true }));

  /* Die beiden Zeilen oben haben den Zustand verändert — zurücksetzen,
     sonst prüfen die folgenden etwas anderes, als ihr Name sagt. */
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc('firmen/lesen/abo/aktuell').set(
      { status: 'nurlesen', stufe: 'basic' });
    await ctx.firestore().doc('firmen/dicht/abo/aktuell').set(
      { status: 'zu', stufe: 'basic' });
  });

  /* ═══ 6. Was ausgenommen ist, ist es wirklich ═══ */
  protokoll.push('\n  ── Geräteanmeldung bleibt offen ──');
  await darf('nurlesen: Handy meldet sich für Meldungen an',
    alsMa('lesen').doc(P('lesen', 'pushTokens/tok1')).set({ uid: 'ma-lesen' }));
  await darf('nurlesen: Fehlermeldung kommt noch an',
    alsMa('lesen').doc(P('lesen', 'fehler/sig1')).set({ text: 'ging schief' }));

  /* ═══ 7. Ein gesperrter Betrieb kommt nicht an den Nachbarn ═══
     Die Firmengrenze muss halten, auch wenn das eigene Abo zu ist —
     sonst wäre die Sperre ein Anreiz, es beim Nachbarn zu versuchen. */
  protokoll.push('\n  ── Die Firmengrenze hält auch bei zu ──');
  await darfNicht('zu: Chef liest beim Nachbarn',
    alsChef('dicht').doc(P('offen', 'studios/studio-1/todos/t1')).get());
  await darfNicht('zu: Chef schreibt beim Nachbarn',
    alsChef('dicht').doc(P('offen', 'board/neu2')).set(
      { uid: 'chef-dicht', text: 'fremd', ts: 3 }));

  /* ═══ 8. GEGENPROBEN ═══
     Ohne diese wäre der ganze Durchlauf auch bei einer Regel „verbiete
     jedes Schreiben" grün — und genau so eine Regel würde jeden Kunden
     stilllegen, ohne dass es hier auffiele. */
  protokoll.push('\n  ── Gegenproben ──');
  await darf('GEGENPROBE Schreiben geht überhaupt (Betrieb ohne Abo)',
    alsMa('offen').doc(P('offen', 'studios/studio-1/todos/t1')).update(
      { done: true, doneByUid: 'ma-offen', doneBy: 'Mitarbeiter', doneAt: 5 }));
  await darf('GEGENPROBE derselbe Vorgang bei gratis',
    alsMa('frei').doc(P('frei', 'studios/studio-1/todos/t1')).update(
      { done: true, doneByUid: 'ma-frei', doneBy: 'Mitarbeiter', doneAt: 5 }));

  /* Und die Gegenprobe zur Gegenprobe: derselbe Vorgang, gleicher
     Aufrufer, gleiche Daten — nur ein anderer Betrieb. Geht er dort
     nicht, liegt es am Abo-Zustand und an nichts anderem. */
  await darfNicht('GEGENPROBE derselbe Vorgang bei nurlesen geht nicht',
    alsMa('lesen').doc(P('lesen', 'studios/studio-1/todos/t1')).update(
      { done: true, doneByUid: 'ma-lesen', doneBy: 'Mitarbeiter', doneAt: 5 }));

  /* ═══ 9. Zustände der Mahnleiter, die NOCH nichts sperren ═══
     Drei Wochen lang merkt das Team gar nichts — das ist die
     Entscheidung aus Abschnitt 3 und keine Nachlässigkeit. Wer sie
     später enger zieht, muss es hier merken. */
  protokoll.push('\n  ── faellig, mahnung1, mahnung2 sperren noch nicht ──');
  for (const st of ['test', 'aktiv', 'faellig', 'mahnung1', 'mahnung2', 'gekuendigt']) {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc('firmen/frei/abo/aktuell').set(
        { status: st, stufe: 'basic' });
    });
    await darf(st + ': Mitarbeiter schreibt noch ans Brett',
      alsMa('frei').doc(P('frei', 'board/neu-' + st)).set(
        { uid: 'ma-frei', text: 'Hallo', ts: 2 }));
  }

  await env.cleanup();
  console.log(protokoll.join('\n'));
  console.log('\n' + (gefallen ? '✗ ' + gefallen + ' Fehler, ' : '✓ alles grün, ') +
    bestanden + ' Zusicherungen');
  process.exit(gefallen ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
