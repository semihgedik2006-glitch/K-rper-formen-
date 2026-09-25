/* ── Konto ohne Firma, Freigabe, Firmengrenze beim Verschieben (Runde 117) ──

   Aus dem Betrieb, 25.9.2026:
     „man kann ein account erstellen und wenn man dann keinen Firmen code
      eingibt und der chef das bestätigt sieht man nur ein fenster wo man
      dann sein profil und interface bearbeiten kann … aber mehr nicht"
     „Chef bestätigt trotzdem bzw ein chef der jeweiligen firma und der
      chef legt ja auch den code an (achte darauf das kein code jemals
      sich doppeln kann egal wie viele firmen es gibt)"

   Geprüft wird hier, was die REGELN halten:
     1. Ein Konto ohne Firma (firma:'_ohne') darf jeder für sich anlegen —
        aber nur inaktiv, nur als Mitarbeiter, ohne Studios, ohne Admin.
     2. Es sieht NICHTS: keine Sammlung, weder flach noch unter
        firmen/<f>/ — nur das eigene Profil und das, was ohnehin ohne
        Anmeldung lesbar ist (Impressum, Studioliste, Schalter).
     3. Es kann sich nicht selbst in eine Firma setzen oder freischalten.
        Den Beitritt macht der Server (firmaBeitreten), nach dem Code.
     4. Jede Selbstanmeldung startet inaktiv — auch in einer Firma OHNE
        Code. „Chef bestätigt trotzdem."
     5. DIE LÜCKE, die beim Planen auffiel: der Chef durfte am Profil
        seines Mitarbeiters das Feld firma frei setzen. Damit schob er
        ein Konto (auch ein eigenes Zweitkonto) in einen FREMDEN Betrieb
        und las dort alles. Jetzt: firma bleibt, oder geht zurück auf
        '_ohne' (Ablehnen) — sonst nichts.
     6. Firmencodes und Beitrittsversuche liest und schreibt nur der
        Server; der Code selbst setzt sich nicht mehr am Client vorbei.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment, assertFails, assertSucceeds,
} = require('@firebase/rules-unit-testing');

const REGELN = path.join(__dirname, '..', '..', 'firestore.rules');
const A = 'alpha', B = 'beta', OHNE = '_ohne';

let env;
let bestanden = 0, gefallen = 0;
const protokoll = [];
async function pruefe(name, fn) {
  try { await fn(); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) {
    gefallen++;
    protokoll.push('  ✗ ' + name + '\n      ' + String(e.message).split('\n')[0].slice(0, 160));
  }
}

/* Dieselben Sammlungen wie in kreuz.test.js — jede, die es im
   Firmen-Zweig gibt. Ein Konto ohne Firma darf an KEINE davon. */
const SAMMLUNGEN = [
  'config/registrierung', 'config/onboarding', 'config/features',
  'channels/allgemein/messages/m1',
  'studios/studio-0/todos/t1', 'studios/studio-0/cleaning/c1', 'studios/studio-0/cleaningNotes/n1',
  'studios/studio-0/devices/d1', 'studios/studio-0/deviceLog/l1', 'studios/studio-0/shifts/s1',
  'studios/studio-0/absences/a1', 'studios/studio-0/handovers/h1',
  'announcements/an1', 'inventory/studio-0', 'documents/dok1', 'documentData/dok1',
  'certificates/z1', 'dms/dm_chefB_mitB', 'dms/dm_chefB_mitB/messages/x1',
  'board/b1', 'trash/tr1', 'archives/2026-08-12', 'fehler/abc_1',
];
const OFFEN = ['config/recht', 'config/studios', 'config/beitrittSchalter'];

(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-ohnefirma',
    firestore: { rules: fs.readFileSync(REGELN, 'utf8') },
  });
  await env.clearFirestore();

  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await d.doc('firmen/' + A).set({ name: 'Alpha GmbH', aktiv: true });
    await d.doc('firmen/' + B).set({ name: 'Beta GmbH', aktiv: true });
    await d.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });
    await d.doc('users/chefA').set({ name: 'Chef A', role: 'chef', firma: A, aktiv: true });
    await d.doc('users/mitA').set({ name: 'Mit A', role: 'mitarbeiter', firma: A, aktiv: true, studioKeys: ['studio-0'] });
    await d.doc('users/chefB').set({ name: 'Chef B', role: 'chef', firma: B, aktiv: true });
    await d.doc('users/mitB').set({ name: 'Mit B', role: 'mitarbeiter', firma: B, aktiv: true, studioKeys: ['studio-0'] });
    await d.doc('users/gast').set({ name: 'Gast', role: 'mitarbeiter', firma: OHNE, aktiv: false });
    await d.doc('users/wartetB').set({ name: 'Wartet B', role: 'mitarbeiter', firma: B, aktiv: false });
    for (const p of SAMMLUNGEN.concat(OFFEN)) {
      await d.doc('firmen/' + B + '/' + p).set({ x: 1, uid: 'mitB', participants: ['chefB', 'mitB'], studios: 'all' });
      await d.doc(p).set({ x: 1, uid: 'mitB', participants: ['chefB', 'mitB'], studios: 'all' });
    }
    await d.doc('firmencodes/KF2026').set({ firma: B, ts: 1 });
    await d.doc('beitrittVersuche/gast').set({ n: 1, seit: 1 });
  });

  const als = (uid) => env.authenticatedContext(uid).firestore();

  // ══ 5. Die Lücke: ein Chef verschiebt ein Konto in einen fremden Betrieb ══
  await pruefe('LÜCKE ZU: Chef A kann seinen Mitarbeiter NICHT nach Firma B verschieben', () =>
    assertFails(als('chefA').doc('users/mitA').update({ firma: B })));
  await pruefe('LÜCKE ZU: Chef A kann seinen Mitarbeiter NICHT in eine erfundene Firma setzen', () =>
    assertFails(als('chefA').doc('users/mitA').update({ firma: 'irgendwas' })));
  await pruefe('Chef A darf seinen Mitarbeiter weiter bearbeiten (Name, Studios)', () =>
    assertSucceeds(als('chefA').doc('users/mitA').update({ name: 'Mit A2', studioKeys: ['studio-0', 'studio-1'] })));

  // ══ 1. Konto ohne Firma anlegen ══
  const neu = (uid, daten) => als(uid).doc('users/' + uid).set(daten);
  await pruefe('Konto ohne Firma, inaktiv, als Mitarbeiter: angenommen', () =>
    assertSucceeds(neu('n1', { name: 'Neu', email: 'n@x.de', role: 'mitarbeiter', firma: OHNE, aktiv: false, createdAt: 1 })));
  await pruefe('… ohne Rollenfeld: angenommen', () =>
    assertSucceeds(neu('n2', { name: 'Neu', firma: OHNE, aktiv: false })));
  await pruefe('… aber gleich aktiv: abgelehnt', () =>
    assertFails(neu('n3', { name: 'Neu', role: 'mitarbeiter', firma: OHNE, aktiv: true })));
  await pruefe('… ohne aktiv-Feld (= aktiv): abgelehnt', () =>
    assertFails(neu('n4', { name: 'Neu', role: 'mitarbeiter', firma: OHNE })));
  await pruefe('… als Chef: abgelehnt', () =>
    assertFails(neu('n5', { name: 'Neu', role: 'chef', firma: OHNE, aktiv: false })));
  await pruefe('… mit admin: abgelehnt', () =>
    assertFails(neu('n6', { name: 'Neu', firma: OHNE, aktiv: false, admin: true })));
  await pruefe('… mit Studios: abgelehnt', () =>
    assertFails(neu('n7', { name: 'Neu', firma: OHNE, aktiv: false, studioKeys: ['studio-0'] })));
  await pruefe('… für eine FREMDE uid: abgelehnt', () =>
    assertFails(als('n8').doc('users/jemand').set({ name: 'X', firma: OHNE, aktiv: false })));

  // ══ 4. Jede Selbstanmeldung in einer Firma startet inaktiv ══
  await pruefe('Selbstanmeldung direkt in Firma A (ohne Code), aktiv: abgelehnt — „Chef bestätigt trotzdem"', () =>
    assertFails(neu('n9', { name: 'Neu', role: 'mitarbeiter', firma: A, aktiv: true })));
  await pruefe('Selbstanmeldung direkt in Firma A ohne aktiv-Feld: abgelehnt', () =>
    assertFails(neu('n10', { name: 'Neu', role: 'mitarbeiter', firma: A })));

  // ══ 2. Ein Konto ohne Firma sieht nichts ══
  const gast = () => als('gast');
  const aus = [];
  for (const p of SAMMLUNGEN) {
    for (const pfad of ['firmen/' + B + '/' + p, p, 'firmen/koerperformen/' + p]) {
      try { await assertFails(gast().doc(pfad).get()); }
      catch (e) { aus.push(pfad); }
    }
  }
  await pruefe('Konto ohne Firma liest KEINE Sammlung (' + SAMMLUNGEN.length * 3 + ' Pfade, flach und in zwei Firmen)', () => {
    if (aus.length) throw new Error('lesbar: ' + aus.join(', '));
  });
  const ausS = [];
  for (const p of SAMMLUNGEN) {
    for (const pfad of ['firmen/' + B + '/' + p, p]) {
      try { await assertFails(gast().doc(pfad).set({ x: 2, uid: 'gast', participants: ['gast', 'mitB'] })); }
      catch (e) { ausS.push(pfad); }
    }
  }
  await pruefe('Konto ohne Firma schreibt KEINE Sammlung', () => {
    if (ausS.length) throw new Error('schreibbar: ' + ausS.join(', '));
  });
  await pruefe('Konto ohne Firma liest die Personenliste von B NICHT', () =>
    assertFails(gast().doc('users/mitB').get()));
  await pruefe('Konto ohne Firma liest sein EIGENES Profil', () =>
    assertSucceeds(gast().doc('users/gast').get()));
  for (const p of OFFEN) {
    await pruefe('… und das, was ohne Anmeldung offen ist: ' + p, () =>
      assertSucceeds(gast().doc('firmen/' + B + '/' + p).get()));
  }

  // ══ 3. Nicht selbst beitreten, nicht selbst freischalten ══
  await pruefe('Konto ohne Firma darf seinen Namen ändern (Profil bearbeiten)', () =>
    assertSucceeds(gast().doc('users/gast').update({ name: 'Gast Neu', color: '#123456' })));
  await pruefe('… aber NICHT sich selbst eine Firma geben', () =>
    assertFails(gast().doc('users/gast').update({ firma: B })));
  await pruefe('… und NICHT sich freischalten', () =>
    assertFails(gast().doc('users/gast').update({ aktiv: true })));
  await pruefe('Chef B kann ein Konto ohne Firma NICHT an sich ziehen', () =>
    assertFails(als('chefB').doc('users/gast').update({ firma: B })));
  await pruefe('Chef B kann ein Konto ohne Firma NICHT freischalten', () =>
    assertFails(als('chefB').doc('users/gast').update({ aktiv: true })));

  // ══ Freigabe und Ablehnen in Firma B ══
  await pruefe('Chef A kann ein wartendes Konto von B NICHT freischalten', () =>
    assertFails(als('chefA').doc('users/wartetB').update({ aktiv: true })));
  await pruefe('Chef B lehnt ab: Konto geht zurück auf „ohne Firma" (inaktiv)', () =>
    assertSucceeds(als('chefB').doc('users/wartetB').update({ firma: OHNE, aktiv: false })));
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc('users/wartetB').set({ name: 'Wartet B', role: 'mitarbeiter', firma: B, aktiv: false });
  });
  await pruefe('… aber NICHT „ohne Firma" UND aktiv', () =>
    assertFails(als('chefB').doc('users/wartetB').update({ firma: OHNE, aktiv: true })));
  await pruefe('Chef B schaltet frei, mit Studio', () =>
    assertSucceeds(als('chefB').doc('users/wartetB').update({ aktiv: true, studios: ['Eins'], studio: 'Eins', studioKeys: ['studio-0'] })));

  // ══ 6. Nur der Server ══
  for (const [p, name] of [['firmencodes/KF2026', 'Firmencodes'], ['beitrittVersuche/gast', 'Beitrittsversuche']]) {
    await pruefe(name + ': Chef liest NICHT', () => assertFails(als('chefB').doc(p).get()));
    await pruefe(name + ': Konto ohne Firma liest NICHT', () => assertFails(gast().doc(p).get()));
    await pruefe(name + ': niemand schreibt vom Gerät aus', () => assertFails(als('chefB').doc(p).set({ firma: A })));
  }
  await pruefe('Der Code geht nicht mehr am Server vorbei: Chef B schreibt config/registrierung NICHT (Firma)', () =>
    assertFails(als('chefB').doc('firmen/' + B + '/config/registrierung').set({ code: 'KF2026' })));
  await pruefe('… und die Schalter auch nicht', () =>
    assertFails(als('chefB').doc('firmen/' + B + '/config/beitrittSchalter').set({ codeNoetig: false })));
  await pruefe('Chef B liest seinen Code weiterhin', () =>
    assertSucceeds(als('chefB').doc('firmen/' + B + '/config/registrierung').get()));

  await env.cleanup();
  console.log('\nKonto ohne Firma, Freigabe, Verschieben (Runde 117)\n' + protokoll.join('\n'));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})();
