/* ── „… schreibt" je Person und Unterhaltung (Runde 277) ───────────────

   channels/<kanal>/tippt/<uid> und dms/<id>/tippt/<uid> = { ts, uid,
   name }. Daraus zeigt die App unten im Verlauf „Romy schreibt …".
   Wer hier fremde Dokumente schreiben könnte, liesse jemanden schreiben,
   der nichts tut — oder in einem Studio-Kanal, den er nicht lesen darf,
   lesen, wer gerade tippt. Deshalb, in BEIDEN Bäumen (flach und
   firmen/<k>/):

     1. Das eigene Dokument schreiben und löschen geht (GEGENPROBE).
     2. Ein fremdes schreiben oder löschen geht NICHT.
     3. Nur {ts, uid, name}; uid ist die eigene; name höchstens 80
        Zeichen; ts nicht weiter als eine Minute in der Zukunft.
     4. Nur in Unterhaltungen, die man lesen darf; wartende Konten nicht.
     5. Lesen: wer die Unterhaltung lesen darf. Sonst niemand — auch
        kein anderer Betrieb.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment, assertFails, assertSucceeds,
} = require('@firebase/rules-unit-testing');

const REGELN = path.join(__dirname, '..', '..', 'firestore.rules');
const A = 'koerperformen', B = 'beta';

let env;
let bestanden = 0, gefallen = 0;
const protokoll = [];
async function pruefe(name, fn) {
  try { await fn(); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) {
    gefallen++;
    protokoll.push('  ✗ ' + name + '\n      ' + String(e.message).split('\n')[0].slice(0, 170));
  }
}
const als = (u) => env.authenticatedContext(u).firestore();

(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-regeltest',
    firestore: { rules: fs.readFileSync(REGELN, 'utf8') },
  });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await d.doc(`firmen/${A}`).set({ name: 'Alpha GmbH', aktiv: true });
    await d.doc(`firmen/${B}`).set({ name: 'Beta GmbH', aktiv: true });
    await d.doc('users/chefA').set({ name: 'Chef A', role: 'chef', firma: A, aktiv: true });
    await d.doc('users/mitA').set({ name: 'Mit A', role: 'mitarbeiter', firma: A, aktiv: true, studioKeys: ['studio-0'] });
    await d.doc('users/zweitA').set({ name: 'Zweiter', role: 'mitarbeiter', firma: A, aktiv: true, studioKeys: ['studio-0'] });
    await d.doc('users/andersA').set({ name: 'Anderes Studio', role: 'mitarbeiter', firma: A, aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/wartA').set({ name: 'Wartend', role: 'mitarbeiter', firma: A, aktiv: false, studioKeys: ['studio-0'] });
    await d.doc('users/chefB').set({ name: 'Chef B', role: 'chef', firma: B, aktiv: true });
    for (const w of ['', `firmen/${A}/`]) {
      await d.doc(w + 'channels/allgemein/tippt/zweitA').set({ ts: Date.now(), uid: 'zweitA', name: 'Zweiter' });
      await d.doc(w + 'channels/studio-0/tippt/zweitA').set({ ts: Date.now(), uid: 'zweitA', name: 'Zweiter' });
      await d.doc(w + 'dms/dm_mitA_zweitA/tippt/zweitA').set({ ts: Date.now(), uid: 'zweitA', name: 'Zweiter' });
    }
  });

  const jetzt = () => Date.now();
  const gut = (u) => ({ ts: jetzt(), uid: u, name: 'Mit A' });
  for (const [welt, w] of [['flach', ''], ['firmen/' + A, `firmen/${A}/`]]) {
    protokoll.push('\n  ── ' + welt + ' · Kanal ──');
    const pfad = (k, u) => w + 'channels/' + k + '/tippt/' + u;

    await pruefe(welt + ' · das EIGENE Dokument schreiben geht', () =>
      assertSucceeds(als('mitA').doc(pfad('allgemein', 'mitA')).set(gut('mitA'))));
    await pruefe(welt + ' · im eigenen Studio-Kanal geht', () =>
      assertSucceeds(als('mitA').doc(pfad('studio-0', 'mitA')).set(gut('mitA'))));
    await pruefe(welt + ' · das eigene löschen geht', () =>
      assertSucceeds(als('mitA').doc(pfad('studio-0', 'mitA')).delete()));

    await pruefe(welt + ' · ein FREMDES schreiben geht NICHT', () =>
      assertFails(als('mitA').doc(pfad('allgemein', 'zweitA')).set(gut('zweitA'))));
    await pruefe(welt + ' · … auch nicht mit der eigenen uid im Inhalt', () =>
      assertFails(als('mitA').doc(pfad('allgemein', 'zweitA')).set(gut('mitA'))));
    await pruefe(welt + ' · ein fremdes löschen geht NICHT', () =>
      assertFails(als('mitA').doc(pfad('allgemein', 'zweitA')).delete()));
    await pruefe(welt + ' · eine fremde uid im EIGENEN Dokument geht NICHT', () =>
      assertFails(als('mitA').doc(pfad('allgemein', 'mitA')).set({ ts: jetzt(), uid: 'zweitA', name: 'x' })));
    await pruefe(welt + ' · ein weiteres Feld geht NICHT', () =>
      assertFails(als('mitA').doc(pfad('allgemein', 'mitA')).set(Object.assign(gut('mitA'), { text: 'Entwurf' }))));
    await pruefe(welt + ' · ein Name über 80 Zeichen geht NICHT', () =>
      assertFails(als('mitA').doc(pfad('allgemein', 'mitA')).set({ ts: jetzt(), uid: 'mitA', name: 'x'.repeat(81) })));
    await pruefe(welt + ' · ts als Text geht NICHT', () =>
      assertFails(als('mitA').doc(pfad('allgemein', 'mitA')).set({ ts: 'jetzt', uid: 'mitA', name: 'Mit A' })));
    await pruefe(welt + ' · eine Stunde in der Zukunft geht NICHT', () =>
      assertFails(als('mitA').doc(pfad('allgemein', 'mitA')).set({ ts: jetzt() + 3600000, uid: 'mitA', name: 'Mit A' })));
    await pruefe(welt + ' · in einem FREMDEN Studio-Kanal geht NICHT', () =>
      assertFails(als('mitA').doc(pfad('studio-1', 'mitA')).set(gut('mitA'))));
    await pruefe(welt + ' · ein wartendes Konto schreibt NICHT', () =>
      assertFails(als('wartA').doc(pfad('allgemein', 'wartA')).set(gut('wartA'))));

    await pruefe(welt + ' · lesen, wer im eigenen Kanal tippt, geht', () =>
      assertSucceeds(als('mitA').doc(pfad('studio-0', 'zweitA')).get()));
    await pruefe(welt + ' · aus einem fremden Studio-Kanal lesen geht NICHT', () =>
      assertFails(als('andersA').doc(pfad('studio-0', 'zweitA')).get()));
    await pruefe(welt + ' · ein wartendes Konto liest NICHT', () =>
      assertFails(als('wartA').doc(pfad('allgemein', 'zweitA')).get()));

    protokoll.push('\n  ── ' + welt + ' · Direktnachricht ──');
    const dm = (u) => w + 'dms/dm_mitA_zweitA/tippt/' + u;
    await pruefe(welt + ' · Beteiligte schreibt das eigene Dokument', () =>
      assertSucceeds(als('mitA').doc(dm('mitA')).set(gut('mitA'))));
    await pruefe(welt + ' · Beteiligte löscht das eigene', () =>
      assertSucceeds(als('mitA').doc(dm('mitA')).delete()));
    await pruefe(welt + ' · Beteiligte liest das der anderen Seite', () =>
      assertSucceeds(als('mitA').doc(dm('zweitA')).get()));
    await pruefe(welt + ' · ein Dritter liest NICHT', () =>
      assertFails(als('andersA').doc(dm('zweitA')).get()));
    await pruefe(welt + ' · ein Dritter schreibt NICHT (auch nicht sein eigenes)', () =>
      assertFails(als('andersA').doc(dm('andersA')).set(gut('andersA'))));
    await pruefe(welt + ' · das der anderen Seite schreiben geht NICHT', () =>
      assertFails(als('mitA').doc(dm('zweitA')).set(gut('zweitA'))));
  }

  protokoll.push('\n  ── anderer Betrieb ──');
  await pruefe('Chef B liest in Betrieb A NICHT', () =>
    assertFails(als('chefB').doc(`firmen/${A}/channels/allgemein/tippt/zweitA`).get()));
  await pruefe('Chef B schreibt in Betrieb A NICHT', () =>
    assertFails(als('chefB').doc(`firmen/${A}/channels/allgemein/tippt/chefB`).set({ ts: Date.now(), uid: 'chefB', name: 'Chef B' })));
  await pruefe('Chef B liest die FLACHEN NICHT', () =>
    assertFails(als('chefB').doc('channels/allgemein/tippt/zweitA').get()));

  await env.cleanup();
  console.log('\n„… schreibt" (Runde 277)\n' + protokoll.join('\n'));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
