/* ── Die PIN darf niemand lesen ───────────────────────────────────────

   Das ist die kürzeste Regeldatei hier und die mit dem höchsten Einsatz.

   In `zeitPins/<uid>` liegt scrypt(PIN, Salz) je Person. Eine PIN hat
   vier bis sechs Ziffern — wer den Hash und das Salz in die Hände
   bekommt, probiert sie auf einem Laptop in Sekunden durch. Danach kann
   er am Terminal für diese Person stempeln, und die ganze
   Arbeitszeitaufzeichnung ist als Nachweis nichts mehr wert.

   Deshalb wird hier nicht geprüft, dass „die Richtigen" lesen dürfen,
   sondern dass **NIEMAND** es darf:

     · der Kollege                      → gesperrt
     · die Studioleitung                → gesperrt
     · die Geschäftsführung             → gesperrt
     · die Person selbst                → gesperrt
     · der Betreiber (admin)            → gesperrt
     · eine fremde Firma                → gesperrt
     · eine Abfrage über die Sammlung   → gesperrt
     · Schreiben durch irgendwen        → gesperrt

   „Die Person selbst" ist der Eintrag, den man beim Bauen weglässt. Sie
   muss ihn auch gar nicht lesen: gesetzt wird über pinSetzen, geprüft
   wird im Server. Eine Regel `if request.auth.uid == uid` wäre hier der
   bequeme Fehler — bequem, weil sie überall sonst in dieser App richtig
   ist.

   Die Gegenprobe dazu ist keine Leseprobe, sondern eine daneben: wenn
   dieselben Konten auf einer VERGLEICHBAREN Sammlung weiterhin
   arbeiten können, liegt es an dieser Regel und nicht daran, dass die
   Ausgangslage kaputt ist.
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

  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const leute = {
      anna: { name: 'Anna', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
      ben:  { name: 'Ben',  role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
      lisa: { name: 'Lisa', role: 'leiter',      firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
      max:  { name: 'Max',  role: 'chef',        firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
      olaf: { name: 'Olaf', role: 'chef', admin: true, firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
      zoe:  { name: 'Zoe',  role: 'chef',        firma: 'fremdfirma',    aktiv: true, studioKeys: ['studio-1'] }
    };
    for (const [uid, d] of Object.entries(leute)) await db.doc('users/' + uid).set(d);
    await db.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });
    await db.doc('firmen/fremdfirma').set({ name: 'Fremd', aktiv: true });

    for (const w of WELTEN) {
      await db.doc(w.pfad('zeitPins/anna')).set({
        hash: 'aaaa1111bbbb2222', salz: 'ffff0000', gesetztAm: 1, name: 'Anna' });
      // Zwei Terminals: eins im Studio von Lisa, eins in einem fremden.
      await db.doc(w.pfad('terminals/t1')).set({
        studioKey: 'studio-1', name: 'Empfang', hash: 'a'.repeat(64), angelegtAm: 1 });
      await db.doc(w.pfad('terminals/t2')).set({
        studioKey: 'studio-9', name: 'Fremd', hash: 'b'.repeat(64), angelegtAm: 1 });
      // Zwei Stempel: einer von Anna in studio-1, einer aus einem fremden.
      await db.doc(w.pfad('zeiten/z-anna')).set({
        uid: 'anna', name: 'Anna', studioKey: 'studio-1', art: 'kommen',
        ts: 1, tag: '2026-09-14', terminalId: 't1' });
      await db.doc(w.pfad('zeiten/z-fremd')).set({
        uid: 'timo', name: 'Timo', studioKey: 'studio-9', art: 'kommen',
        ts: 1, tag: '2026-09-14', terminalId: 't2' });
      // Eine vergleichbare Sammlung als Ausgangslage fuer die Gegenprobe.
      await db.doc(w.pfad('board/b1')).set({ uid: 'anna', name: 'Anna', text: 'Hallo', ts: 1 });
    }
  });

  const alsAnna = env.authenticatedContext('anna').firestore();
  const alsBen  = env.authenticatedContext('ben').firestore();
  const alsLisa = env.authenticatedContext('lisa').firestore();
  const alsMax  = env.authenticatedContext('max').firestore();
  const alsOlaf = env.authenticatedContext('olaf').firestore();
  const alsZoe  = env.authenticatedContext('zoe').firestore();
  const ohneKonto = env.unauthenticatedContext().firestore();

  for (const w of WELTEN) {
    const P = w.pfad;
    protokoll.push('\n  ── Welt: ' + w.name + ' ──');

    await darfNicht('Ein Kollege liest die PIN',            alsBen.doc(P('zeitPins/anna')).get());
    await darfNicht('Die Studioleitung liest sie',          alsLisa.doc(P('zeitPins/anna')).get());
    await darfNicht('Die Geschäftsführung liest sie',       alsMax.doc(P('zeitPins/anna')).get());
    await darfNicht('Der Betreiber liest sie',              alsOlaf.doc(P('zeitPins/anna')).get());
    await darfNicht('Eine fremde Firma liest sie',          alsZoe.doc(P('zeitPins/anna')).get());
    await darfNicht('Ohne Konto',                           ohneKonto.doc(P('zeitPins/anna')).get());
    /* DER EINTRAG, DEN MAN WEGLAESST. Ueberall sonst in dieser App darf
       der Eigentuemer sein eigenes Dokument lesen. Hier nicht. */
    await darfNicht('DIE PERSON SELBST liest ihren eigenen Hash',
      alsAnna.doc(P('zeitPins/anna')).get());

    await darfNicht('Jemand listet die ganze Sammlung',      alsMax.collection(P('zeitPins')).get());
    await darfNicht('Die Person listet sie',                 alsAnna.collection(P('zeitPins')).get());

    await darfNicht('Die Person setzt ihre PIN direkt',
      alsAnna.doc(P('zeitPins/anna')).set({ hash: 'x', salz: 'y', gesetztAm: 2 }));
    await darfNicht('Der Chef setzt jemandem eine PIN',
      alsMax.doc(P('zeitPins/ben')).set({ hash: 'x', salz: 'y', gesetztAm: 2 }));
    await darfNicht('Jemand überschreibt einen fremden Hash',
      alsBen.doc(P('zeitPins/anna')).update({ hash: 'bekannt' }));
    await darfNicht('Jemand löscht eine PIN',
      alsMax.doc(P('zeitPins/anna')).delete());

    /* ══ Terminals ══
       Anders als bei der PIN darf die Leitung hier LESEN — das
       Geheimnis sind 32 zufällige Bytes, sein Hash lässt sich nicht
       durchprobieren. Geschrieben wird trotzdem von niemandem. */
    protokoll.push('  — Terminals —');
    await darf('Der Chef sieht die Terminals',         alsMax.doc(P('terminals/t1')).get());
    await darf('Die Leitung sieht ihr eigenes',        alsLisa.doc(P('terminals/t1')).get());
    await darfNicht('Die Leitung sieht ein fremdes Studio',
      alsLisa.doc(P('terminals/t2')).get());
    await darfNicht('Ein Mitarbeiter sieht Terminals', alsBen.doc(P('terminals/t1')).get());
    await darfNicht('Eine fremde Firma sieht sie',     alsZoe.doc(P('terminals/t1')).get());
    await darfNicht('Der Chef legt selbst eins an',
      alsMax.doc(P('terminals/neu')).set({ studioKey: 'studio-1', name: 'Selbst', hash: 'x' }));
    await darfNicht('Jemand ändert das Geheimnis',
      alsMax.doc(P('terminals/t1')).update({ hash: 'bekannt' }));
    await darfNicht('Jemand löscht ein Terminal direkt',
      alsMax.doc(P('terminals/t1')).delete());

    /* ══ Die Stempel ══
       NIEMAND schreibt, auch der Chef nicht. Eine Aufzeichnung, die sich
       nachträglich ändern lässt, ist als Nachweis nichts wert — auch
       dann, wenn sie nie geändert wurde. */
    protokoll.push('  — Stempel —');
    await darf('Anna sieht ihren eigenen Stempel',     alsAnna.doc(P('zeiten/z-anna')).get());
    await darf('Die Leitung sieht den ihres Studios',  alsLisa.doc(P('zeiten/z-anna')).get());
    await darf('Der Chef sieht ihn',                   alsMax.doc(P('zeiten/z-anna')).get());
    await darfNicht('Ein Kollege sieht fremde Stempel', alsBen.doc(P('zeiten/z-anna')).get());
    await darfNicht('Die Leitung sieht ein fremdes Studio',
      alsLisa.doc(P('zeiten/z-fremd')).get());
    await darfNicht('Eine fremde Firma sieht sie',     alsZoe.doc(P('zeiten/z-anna')).get());

    await darfNicht('Anna stempelt sich selbst ein',
      alsAnna.doc(P('zeiten/neu')).set({ uid: 'anna', studioKey: 'studio-1', art: 'kommen', ts: 9, tag: '2026-09-14' }));
    await darfNicht('DER CHEF schreibt eine Zeit',
      alsMax.doc(P('zeiten/neu2')).set({ uid: 'anna', studioKey: 'studio-1', art: 'kommen', ts: 9, tag: '2026-09-14' }));
    await darfNicht('Die Leitung korrigiert eine Zeit direkt',
      alsLisa.doc(P('zeiten/z-anna')).update({ ts: 1 }));
    await darfNicht('Anna schiebt ihren eigenen Stempel',
      alsAnna.doc(P('zeiten/z-anna')).update({ ts: 1 }));
    await darfNicht('Jemand löscht einen Stempel',
      alsMax.doc(P('zeiten/z-anna')).delete());

    /* ── Gegenprobe ──
       Dieselben Konten, eine vergleichbare Sammlung. Geht das hier auch
       nicht, liegt es an der Ausgangslage und nicht an der Regel oben —
       und dann prueft dieser Durchlauf nichts. */
    await darf('(Gegenprobe) Dieselben Konten arbeiten am Schwarzen Brett',
      alsBen.doc(P('board/b1')).get());
    await darf('(Gegenprobe) … und dürfen dort auch schreiben',
      alsBen.doc(P('board/b2')).set({ uid: 'ben', name: 'Ben', text: 'Test', ts: 2 }));
  }

  await env.cleanup();
  console.log('\n' + protokoll.join('\n'));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen\n');
  if (gefallen) {
    console.log('✗ Zeit-PIN: der Hash ist erreichbar — damit kann jemand fuer einen anderen stempeln.');
    process.exit(1);
  }
  console.log('✓ Zeit-PIN: niemand kommt an den Hash, auch die Person selbst nicht.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
