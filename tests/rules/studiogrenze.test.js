/* ── DIE STUDIOGRENZE BEIM LESEN ──────────────────────────────────────
   Aus docs/BEKANNTE-PROBLEME.md, P-01, gefunden am 16.9.2026 beim
   Schreiben der Dokumentation und behoben am 17.9.:

     Die Leseregel fuer Schichten, Abwesenheiten und Uebergaben lautete
     `inFirma(f) && istAktiv()`. Sie prueft die FIRMA und nicht das
     STUDIO. Die Studiogrenze stand allein in der Oberflaeche — und eine
     Grenze in der Oberflaeche ist keine: wer angemeldet war und ein
     Datenbankwerkzeug bedienen konnte, kam an die Abwesenheiten jedes
     Studios der Firma. KRANKMELDUNGEN EINGESCHLOSSEN, also
     Gesundheitsdaten nach Art. 9 DSGVO.

   Warum genau diese drei Sammlungen:

     shifts     Wer wann arbeitet
     absences   Urlaub, frei — und krank
     handovers  Uebergaben, oft mit Namen von Kundinnen

     Das sind die Personendaten. Putzplan, Aufgaben und Geraete liegen
     ebenfalls je Studio und bleiben bewusst betriebsweit lesbar: ein
     defektes Geraet soll jeder sehen und melden koennen, auch aus einem
     anderen Studio. Das ist eine ENTSCHEIDUNG, keine Vergesslichkeit —
     wer sie aendert, aendert sie hier mit.

   Was dieser Durchlauf festhaelt:

     · Mitarbeiter liest SEIN Studio                    → geht
     · Mitarbeiter liest ein FREMDES Studio             → geht nicht
     · Leiter liest ein Studio, das er verwaltet        → geht
     · Leiter liest ein Studio, das er NICHT verwaltet  → geht nicht
     · Chef liest jedes Studio der eigenen Firma        → geht
     · Chef liest ein Studio einer FREMDEN Firma        → geht nicht
     · Schreiben bleibt, wie es war (manages())
     · Putzplan und Geraete bleiben betriebsweit lesbar

   Und die Gegenproben. Eine Regel „verbiete alles" waere sonst gruen.
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

/* Die drei Sammlungen mit Personendaten und je ein Beispieldokument,
   das aussieht wie die echten. */
const PERSONENDATEN = [
  ['shifts',    's1', { date: '2026-09-18', uid: 'ma-eins', name: 'Mitarbeiter' }],
  ['absences',  'a1', { from: '2026-09-18', to: '2026-09-20', type: 'krank',
                        uid: 'ma-eins', status: 'offen' }],
  ['handovers', 'h1', { ts: 1, uid: 'ma-eins', text: 'Frau M. kommt Donnerstag' }],
];

/* Und zwei, die betriebsweit lesbar BLEIBEN sollen. */
const BETRIEBSWEIT = [
  ['cleaning', 'p1', { title: 'Spiegel', done: false }],
  ['devices',  'g1', { name: 'EMS-Geraet 3', status: 'ok' }],
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

  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();

    /* Zwei Firmen. Die zweite dient nur der Frage, ob die Firmengrenze
       weiter haelt — sie darf durch die neue Studiogrenze weder
       schaerfer noch loecheriger werden. */
    for (const f of ['eins', 'zwei']) {
      await db.doc('firmen/' + f).set({ name: 'Betrieb ' + f, aktiv: true });
    }

    /* Drei Studios in Firma eins. */
    for (const sk of ['studio-1', 'studio-2', 'studio-3']) {
      for (const [samml, id, daten] of PERSONENDATEN.concat(BETRIEBSWEIT)) {
        await db.doc('firmen/eins/studios/' + sk + '/' + samml + '/' + id).set(daten);
      }
    }
    /* Dasselbe in Firma zwei, damit der Chef von eins etwas hat, an das
       er NICHT herankommen darf. */
    for (const [samml, id, daten] of PERSONENDATEN) {
      await db.doc('firmen/zwei/studios/studio-1/' + samml + '/' + id).set(daten);
    }

    /* Die Personen. studioKeys ist das Feld, das die Regel liest. */
    await db.doc('users/ma-eins').set({
      name: 'Mitarbeiter', role: 'mitarbeiter', firma: 'eins', aktiv: true,
      studioKeys: ['studio-1'] });
    await db.doc('users/leiter-eins').set({
      name: 'Leiter', role: 'leiter', firma: 'eins', aktiv: true,
      studioKeys: ['studio-1', 'studio-2'] });
    await db.doc('users/chef-eins').set({
      name: 'Chef', role: 'chef', firma: 'eins', aktiv: true,
      studioKeys: [] });   // ein Chef hat oft gar keins zugeordnet
    await db.doc('users/ma-zwei').set({
      name: 'Fremd', role: 'mitarbeiter', firma: 'zwei', aktiv: true,
      studioKeys: ['studio-1'] });
  });

  const als = (uid) => env.authenticatedContext(uid).firestore();
  const P = (f, sk, samml, id) =>
    'firmen/' + f + '/studios/' + sk + '/' + samml + '/' + id;

  /* ═══ 1. Der Mitarbeiter: sein Studio ja, ein fremdes nein ═══
     Das ist der Kern des Funds. Studio-1 gehoert ihm, studio-2 nicht. */
  protokoll.push('\n  ── Mitarbeiter: eigenes Studio ja, fremdes nein ──');
  for (const [samml, id] of PERSONENDATEN) {
    await darf('Mitarbeiter liest ' + samml + ' des EIGENEN Studios',
      als('ma-eins').doc(P('eins', 'studio-1', samml, id)).get());
    await darfNicht('Mitarbeiter liest ' + samml + ' eines FREMDEN Studios',
      als('ma-eins').doc(P('eins', 'studio-2', samml, id)).get());
  }

  /* Auch als Abfrage, nicht nur als einzelnes Dokument. Firestore
     entscheidet ueber eine Abfrage VORHER und im Ganzen: sie faellt,
     sobald auch nur ein Treffer nicht gelesen werden duerfte. Wer nur
     .doc().get() prueft, weiss nicht, ob die App noch laeuft. */
  protokoll.push('\n  ── Als Abfrage, nicht nur als einzelnes Dokument ──');
  await darf('Mitarbeiter fragt die Abwesenheiten SEINES Studios ab',
    als('ma-eins').collection('firmen/eins/studios/studio-1/absences').get());
  await darfNicht('Mitarbeiter fragt die Abwesenheiten eines FREMDEN Studios ab',
    als('ma-eins').collection('firmen/eins/studios/studio-2/absences').get());

  /* ═══ 2. Der Leiter: seine zwei ja, das dritte nein ═══
     Hier zeigt sich, dass die Regel wirklich die Liste liest und nicht
     nur „Leiter darf alles". */
  protokoll.push('\n  ── Leiter: die verwalteten ja, das dritte nein ──');
  await darf('Leiter liest absences von studio-1 (verwaltet er)',
    als('leiter-eins').doc(P('eins', 'studio-1', 'absences', 'a1')).get());
  await darf('Leiter liest absences von studio-2 (verwaltet er auch)',
    als('leiter-eins').doc(P('eins', 'studio-2', 'absences', 'a1')).get());
  await darfNicht('Leiter liest absences von studio-3 (verwaltet er NICHT)',
    als('leiter-eins').doc(P('eins', 'studio-3', 'absences', 'a1')).get());

  /* ═══ 3. Der Chef: alles in der eigenen Firma, nichts daneben ═══
     Wichtig ist der leere studioKeys-Eintrag oben: der Chef kommt NICHT
     ueber die Liste durch, sondern ueber isChef(). Haette die Regel nur
     die Liste geprueft, saehe ein Chef gar nichts mehr — und das waere
     eine Sperre, die beim Ausrollen sofort auffiele. */
  protokoll.push('\n  ── Chef: die ganze eigene Firma, ohne eigene Studios ──');
  for (const sk of ['studio-1', 'studio-2', 'studio-3']) {
    await darf('Chef liest absences von ' + sk,
      als('chef-eins').doc(P('eins', sk, 'absences', 'a1')).get());
  }
  await darfNicht('Chef von eins liest absences der FIRMA ZWEI',
    als('chef-eins').doc(P('zwei', 'studio-1', 'absences', 'a1')).get());
  await darfNicht('Mitarbeiter von zwei liest absences der FIRMA EINS',
    als('ma-zwei').doc(P('eins', 'studio-1', 'absences', 'a1')).get());

  /* ═══ 4. Was betriebsweit lesbar BLEIBEN soll ═══
     Diese vier Zusicherungen sind die eigentliche Gegenprobe zur
     Aenderung: sie halten fest, dass nicht pauschal alles zugezogen
     wurde. Ein Durchlauf, der nur Verbote prueft, ist mit einer Regel
     „verbiete alles" gruen. */
  protokoll.push('\n  ── GEGENPROBE: Putzplan und Geräte bleiben offen ──');
  for (const [samml, id] of BETRIEBSWEIT) {
    await darf('Mitarbeiter liest ' + samml + ' des eigenen Studios',
      als('ma-eins').doc(P('eins', 'studio-1', samml, id)).get());
    await darf('Mitarbeiter liest ' + samml + ' eines FREMDEN Studios ' +
               '(so gewollt: ein defektes Gerät meldet man auch von woanders)',
      als('ma-eins').doc(P('eins', 'studio-2', samml, id)).get());
  }

  /* ═══ 5. Schreiben bleibt, wie es war ═══
     Die Aenderung betraf nur `allow read`. Ginge dabei versehentlich
     eine Schreibregel mit, faende es niemand — Schreiben wird beim
     Lesen nicht bemerkt. */
  protokoll.push('\n  ── Schreiben unverändert: manages() entscheidet ──');
  await darf('Mitarbeiter meldet sich selbst krank (eigenes Studio)',
    als('ma-eins').doc(P('eins', 'studio-1', 'absences', 'neu')).set(
      { from: '2026-09-25', to: '2026-09-26', type: 'krank',
        uid: 'ma-eins', status: 'offen' }));
  await darfNicht('Mitarbeiter genehmigt seine Abwesenheit selbst',
    als('ma-eins').doc(P('eins', 'studio-1', 'absences', 'a1')).update(
      { status: 'ok' }));
  await darf('Leiter genehmigt eine Abwesenheit in studio-1',
    als('leiter-eins').doc(P('eins', 'studio-1', 'absences', 'a1')).update(
      { status: 'ok' }));
  await darfNicht('Leiter genehmigt eine Abwesenheit in studio-3',
    als('leiter-eins').doc(P('eins', 'studio-3', 'absences', 'a1')).update(
      { status: 'ok' }));
  await darf('Chef trägt eine Schicht in studio-3 ein',
    als('chef-eins').doc(P('eins', 'studio-3', 'shifts', 'neu')).set(
      { date: '2026-09-30', uid: 'ma-eins', name: 'Mitarbeiter' }));

  /* ═══ 6. Ein Konto ohne studioKeys ═══
     Das Feld kann fehlen — myProfile().get('studioKeys', []) faengt das
     ab. Was dabei herauskommt, muss trotzdem geprueft werden: ein
     Mitarbeiter ohne zugeordnetes Studio sieht keine Personendaten,
     und das ist richtig so. */
  protokoll.push('\n  ── Konto ohne studioKeys ──');
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc('users/ohne').set({
      name: 'Ohne Studio', role: 'mitarbeiter', firma: 'eins', aktiv: true });
  });
  await darfNicht('Mitarbeiter ohne studioKeys liest absences',
    als('ohne').doc(P('eins', 'studio-1', 'absences', 'a1')).get());
  await darf('GEGENPROBE derselbe liest den Putzplan (bleibt offen)',
    als('ohne').doc(P('eins', 'studio-1', 'cleaning', 'p1')).get());

  await env.cleanup();
  console.log(protokoll.join('\n'));
  console.log('\n' + (gefallen ? '✗ ' + gefallen + ' Fehler, ' : '✓ alles grün, ') +
    bestanden + ' Zusicherungen');
  process.exit(gefallen ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
