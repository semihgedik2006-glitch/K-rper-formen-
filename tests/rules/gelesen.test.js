/* ── Lesestand je Person und Kanal (Gelesen-Häkchen, Runde 126) ───────

   channels/<kanal>/gelesen/<uid> = { ts, uid }. Daraus werden die
   Häkchen der ANDEREN gerechnet — wer hier fremde Stände schreiben
   könnte, färbt fremde Nachrichten blau („gelesen"), obwohl niemand sie
   gesehen hat. Deshalb, in BEIDEN Bäumen (flach und firmen/<k>/):

     1. Den eigenen Stand schreiben geht (GEGENPROBE zu allem unten).
     2. Einen fremden Stand schreiben geht NICHT.
     3. Nur {ts, uid}; uid muss die eigene sein.
     4. Nicht in die Zukunft (sonst gälte alles Künftige als gelesen).
     5. Nur in Kanälen, die man lesen darf; wartende Konten gar nicht.
     6. Lesen: wer den Kanal lesen darf — auch fremde Stände (die Häkchen
        brauchen sie). Wer den Kanal nicht lesen darf, liest sie nicht.
     7. Löschen: niemand. Ein anderer Betrieb: nichts.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment, assertFails, assertSucceeds,
} = require('@firebase/rules-unit-testing');

const REGELN = path.join(__dirname, '..', '..', 'firestore.rules');
/* A ist die Kennung des ersten Betriebs: nur sie darf auch FLACHE Pfade
   benutzen (aufFlachenPfaden), siehe reaktionen.test.js. */
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
      await d.doc(w + 'channels/allgemein/gelesen/zweitA').set({ ts: 1000, uid: 'zweitA' });
      await d.doc(w + 'channels/studio-0/gelesen/zweitA').set({ ts: 1000, uid: 'zweitA' });
    }
  });

  const jetzt = () => Date.now();
  for (const [welt, w] of [['flach', ''], ['firmen/' + A, `firmen/${A}/`]]) {
    protokoll.push('\n  ── ' + welt + ' ──');
    const pfad = (k, u) => w + 'channels/' + k + '/gelesen/' + u;

    await pruefe(welt + ' · den EIGENEN Stand schreiben geht', () =>
      assertSucceeds(als('mitA').doc(pfad('allgemein', 'mitA')).set({ ts: jetzt(), uid: 'mitA' })));
    await pruefe(welt + ' · und ihn später weiterschieben geht', () =>
      assertSucceeds(als('mitA').doc(pfad('allgemein', 'mitA')).set({ ts: jetzt() + 1000, uid: 'mitA' })));
    await pruefe(welt + ' · im eigenen Studio-Kanal geht', () =>
      assertSucceeds(als('mitA').doc(pfad('studio-0', 'mitA')).set({ ts: jetzt(), uid: 'mitA' })));

    await pruefe(welt + ' · einen FREMDEN Stand schreiben geht NICHT', () =>
      assertFails(als('mitA').doc(pfad('allgemein', 'zweitA')).set({ ts: jetzt(), uid: 'zweitA' })));
    await pruefe(welt + ' · … auch nicht mit der eigenen uid im Inhalt', () =>
      assertFails(als('mitA').doc(pfad('allgemein', 'zweitA')).set({ ts: jetzt(), uid: 'mitA' })));
    await pruefe(welt + ' · eine fremde uid im EIGENEN Dokument geht NICHT', () =>
      assertFails(als('mitA').doc(pfad('allgemein', 'mitA')).set({ ts: jetzt(), uid: 'zweitA' })));
    await pruefe(welt + ' · ein weiteres Feld geht NICHT', () =>
      assertFails(als('mitA').doc(pfad('allgemein', 'mitA')).set({ ts: jetzt(), uid: 'mitA', name: 'x' })));
    await pruefe(welt + ' · ts als Text geht NICHT', () =>
      assertFails(als('mitA').doc(pfad('allgemein', 'mitA')).set({ ts: 'bald', uid: 'mitA' })));
    await pruefe(welt + ' · ein Jahr in die Zukunft geht NICHT', () =>
      assertFails(als('mitA').doc(pfad('allgemein', 'mitA')).set({ ts: jetzt() + 365 * 86400000, uid: 'mitA' })));
    await pruefe(welt + ' · GEGENPROBE eine Minute Uhrabweichung geht', () =>
      assertSucceeds(als('mitA').doc(pfad('allgemein', 'mitA')).set({ ts: jetzt() + 60000, uid: 'mitA' })));
    await pruefe(welt + ' · in einem FREMDEN Studio-Kanal geht NICHT', () =>
      assertFails(als('mitA').doc(pfad('studio-1', 'mitA')).set({ ts: jetzt(), uid: 'mitA' })));
    await pruefe(welt + ' · ein wartendes Konto schreibt NICHT', () =>
      assertFails(als('wartA').doc(pfad('allgemein', 'wartA')).set({ ts: jetzt(), uid: 'wartA' })));
    await pruefe(welt + ' · löschen, auch den eigenen, geht NICHT', () =>
      assertFails(als('mitA').doc(pfad('allgemein', 'mitA')).delete()));

    await pruefe(welt + ' · fremde Stände LESEN im eigenen Kanal geht (die Häkchen brauchen sie)', () =>
      assertSucceeds(als('mitA').doc(pfad('studio-0', 'zweitA')).get()));
    await pruefe(welt + ' · aus einem fremden Studio-Kanal lesen geht NICHT', () =>
      assertFails(als('andersA').doc(pfad('studio-0', 'zweitA')).get()));
    await pruefe(welt + ' · ein wartendes Konto liest NICHT', () =>
      assertFails(als('wartA').doc(pfad('allgemein', 'zweitA')).get()));
  }

  protokoll.push('\n  ── anderer Betrieb ──');
  await pruefe('Chef B liest den Stand in Betrieb A NICHT', () =>
    assertFails(als('chefB').doc(`firmen/${A}/channels/allgemein/gelesen/zweitA`).get()));
  await pruefe('Chef B schreibt in Betrieb A NICHT', () =>
    assertFails(als('chefB').doc(`firmen/${A}/channels/allgemein/gelesen/chefB`).set({ ts: Date.now(), uid: 'chefB' })));
  await pruefe('Chef B liest die FLACHEN Stände NICHT', () =>
    assertFails(als('chefB').doc('channels/allgemein/gelesen/zweitA').get()));

  await env.cleanup();
  console.log('\nLesestand (Gelesen-Häkchen, Runde 126)\n' + protokoll.join('\n'));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
