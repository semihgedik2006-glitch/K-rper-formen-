/* ── Rechteausweitung und Aufzählbarkeit ──────────────────────────────
   security.test.js prüft, wer was lesen und schreiben darf.
   kreuz.test.js prüft dieselbe Frage über Firmengrenzen hinweg.

   Hier geht es um die dritte Frage: kann sich jemand mit einem einzigen
   Schreibvorgang mehr Rechte geben, als er hat — und lässt sich etwas
   aufzählen, das niemand aufzählen können soll.

   Der Unterschied zu einem Leseleck: dort sieht jemand fremde Daten.
   Hier wird er zu jemand anderem. Ein Konto, das sich selbst auf
   aktiv:true setzt, hat die Freigabe des Chefs übersprungen; eines mit
   admin:true steht über allen Firmen.

   Zu jeder Sperre gehört die Gegenprobe, dass der richtige Weg noch
   funktioniert — sonst wäre eine Regel, die alles verbietet, die beste.
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
    protokoll.push('  ✗ ' + name + '\n      ' + String(e.message).split('\n')[0].slice(0, 170));
  }
}

const chefA   = () => env.authenticatedContext('chefA').firestore();
const mitA    = () => env.authenticatedContext('mitA').firestore();
const wartend = () => env.authenticatedContext('wartA').firestore();
const admin   = () => env.authenticatedContext('betreiber').firestore();
const anonym  = () => env.unauthenticatedContext().firestore();

(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-regeltest',
    firestore: { rules: fs.readFileSync(REGELN, 'utf8') },
  });
  await env.clearFirestore();

  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await d.doc(`firmen/${A}`).set({ name: 'Alpha GmbH', aktiv: true, zahlKonten: 12, zahlStudios: 3 });
    await d.doc(`firmen/${B}`).set({ name: 'Beta GmbH', aktiv: true, zahlKonten: 40, zahlStudios: 9 });
    await d.doc(`firmen/${A}/abo/aktuell`).set({ stufe: 'basic', netto: 49, status: 'aktiv' });
    await d.doc(`firmen/${A}/config/registrierung`).set({ code: 'GEHEIM-2026' });
    await d.doc(`firmen/${A}/config/beitrittSchalter`).set({ codeNoetig: true, freigabe: true });

    await d.doc('users/chefA').set({ name: 'Chef A', role: 'chef', firma: A, aktiv: true });
    await d.doc('users/mitA').set({ name: 'Mit A', role: 'mitarbeiter', firma: A, aktiv: true, studioKeys: ['studio-0'] });
    await d.doc('users/wartA').set({ name: 'Wartend', role: 'mitarbeiter', firma: A, aktiv: false });
    await d.doc('users/betreiber').set({ name: 'Betreiber', role: 'chef', firma: A, aktiv: true, admin: true });
    await d.doc('users/zweitA').set({ name: 'Zweiter', role: 'mitarbeiter', firma: A, aktiv: true });
  });

  // ══ 1. Niemand macht sich selbst zu mehr, als er ist ══
  await pruefe('Mitarbeiter kann sich NICHT admin:true geben', () =>
    assertFails(mitA().doc('users/mitA').update({ admin: true })));
  await pruefe('Mitarbeiter kann sich NICHT die Rolle chef geben', () =>
    assertFails(mitA().doc('users/mitA').update({ role: 'chef' })));
  await pruefe('Mitarbeiter kann sich NICHT in eine andere Firma setzen', () =>
    assertFails(mitA().doc('users/mitA').update({ firma: B })));
  await pruefe('Mitarbeiter kann sich NICHT selbst Studios geben', () =>
    assertFails(mitA().doc('users/mitA').update({ studioKeys: ['studio-0', 'studio-5'] })));

  /* Der gefährlichste Einzelfall: ein Konto, das auf die Freigabe des
     Chefs wartet, schaltet sich selbst frei. Danach sieht es Teamchat,
     Personenliste, Aufgaben und Dokumente. */
  await pruefe('Wartendes Konto kann sich NICHT selbst freischalten', () =>
    assertFails(wartend().doc('users/wartA').update({ aktiv: true })));

  await pruefe('Chef kann sich NICHT selbst admin:true geben', () =>
    assertFails(chefA().doc('users/chefA').update({ admin: true })));
  await pruefe('Chef kann einem anderen NICHT admin:true geben', () =>
    assertFails(chefA().doc('users/mitA').update({ admin: true })));

  // Gegenproben: der richtige Weg geht weiterhin
  await pruefe('GEGENPROBE Mitarbeiter darf seinen Namen aendern', () =>
    assertSucceeds(mitA().doc('users/mitA').update({ name: 'Neuer Name' })));
  await pruefe('GEGENPROBE Chef darf einen Mitarbeiter freischalten', () =>
    assertSucceeds(chefA().doc('users/wartA').update({ aktiv: true })));
  /* Nicht auf mitA! Ein Konto, das hier admin bekommt, ist in allen
     folgenden Pruefungen Betreiber — und die messen dann nichts. Genau
     das ist beim ersten Anlauf passiert: drei Zeilen weiter unten
     „konnte" der Mitarbeiter ploetzlich das Abo lesen und alle Firmen
     auflisten. Nicht die App war offen, der Testaufbau war es. */
  await pruefe('GEGENPROBE Betreiber darf admin vergeben', () =>
    assertSucceeds(admin().doc('users/zweitA').update({ admin: true })));

  // ══ 2. Der Firmencode ist kein Geheimnis, wenn ihn jeder lesen kann ══
  await pruefe('Mitarbeiter kann den Firmencode NICHT lesen', () =>
    assertFails(mitA().doc(`firmen/${A}/config/registrierung`).get()));
  await pruefe('Anonym kann den Firmencode NICHT lesen', () =>
    assertFails(anonym().doc(`firmen/${A}/config/registrierung`).get()));
  await pruefe('GEGENPROBE Chef kann ihn lesen', () =>
    assertSucceeds(chefA().doc(`firmen/${A}/config/registrierung`).get()));

  // ══ 3. Was ein Kunde zahlt, geht keinen anderen etwas an ══
  await pruefe('Mitarbeiter kann das Abo NICHT lesen', () =>
    assertFails(mitA().doc(`firmen/${A}/abo/aktuell`).get()));
  await pruefe('Chef kann sein Abo NICHT selbst auf premium setzen', () =>
    assertFails(chefA().doc(`firmen/${A}/abo/aktuell`).update({ stufe: 'premium' })));
  await pruefe('GEGENPROBE Chef darf sein Abo lesen', () =>
    assertSucceeds(chefA().doc(`firmen/${A}/abo/aktuell`).get()));

  // ══ 4. Das Firmendokument: der Anmeldebildschirm braucht den Namen ══
  await pruefe('Anonym darf EINE Firma lesen (Name fuer den Anmeldebildschirm)', () =>
    assertSucceeds(anonym().doc(`firmen/${A}`).get()));
  await pruefe('Chef kann sein Firmendokument NICHT aendern', () =>
    assertFails(chefA().doc(`firmen/${A}`).update({ name: 'Umbenannt' })));

  /* Der Punkt, um den es hier geht: read erlaubt in Firestore auch das
     AUFLISTEN. Ist /firmen fuer alle lesbar, kann jeder die vollstaendige
     Kundenliste abrufen — mit Namen, Kontenzahl und Studiozahl, ohne
     Anmeldung. Die Zufallsendung in der Kennung ("mueller-7f3a") soll
     genau das verhindern und nuetzt dann nichts. */
  await pruefe('Anonym kann NICHT alle Firmen auflisten', () =>
    assertFails(anonym().collection('firmen').get()));
  await pruefe('Ein Mitarbeiter kann NICHT alle Firmen auflisten', () =>
    assertFails(mitA().collection('firmen').get()));

  /* ══ 5. Die Nachbaranwendungen ══
     marketing.html meldet jeden ohne Chefrolle wieder ab. Bis zum 13.8.
     durfte trotzdem jeder aktive Zugang die Kampagnen lesen und
     schreiben — die Oberflaeche versprach eine Grenze, die es nicht gab.

     Was in wachstum.html liegt (Kennzahlen, Wettbewerb, Expansion), war
     schon vorher beim Chef; hier steht es mit, damit ein spaeteres
     Aufweichen auffaellt. */
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await d.doc(`firmen/${A}/mkProjects/p1`).set({ name: 'Kampagne', createdBy: 'chefA' });
    await d.doc(`firmen/${A}/mkProjects/p1/versions/v1`).set({ text: 'Entwurf', createdBy: 'chefA' });
    await d.doc(`firmen/${A}/studioMetrics/studio-0`).set({ mitglieder: 210, miete: 4200 });
    await d.doc(`firmen/${A}/competitors/c1`).set({ name: 'Mitbewerber', preis: 79 });
    await d.doc(`firmen/${A}/expansionLeads/l1`).set({ ort: 'Bonn', miete: 3100 });
  });

  await pruefe('Mitarbeiter kann Marketing-Projekte NICHT lesen', () =>
    assertFails(mitA().doc(`firmen/${A}/mkProjects/p1`).get()));
  await pruefe('Mitarbeiter kann Marketing-Projekte NICHT anlegen', () =>
    assertFails(mitA().collection(`firmen/${A}/mkProjects`).doc('p2')
      .set({ name: 'Eigene', createdBy: 'mitA' })));
  await pruefe('Mitarbeiter kann die Versionen NICHT lesen', () =>
    assertFails(mitA().doc(`firmen/${A}/mkProjects/p1/versions/v1`).get()));
  await pruefe('GEGENPROBE Chef kann sie lesen', () =>
    assertSucceeds(chefA().doc(`firmen/${A}/mkProjects/p1`).get()));
  await pruefe('GEGENPROBE Chef kann eine Version anlegen', () =>
    assertSucceeds(chefA().collection(`firmen/${A}/mkProjects/p1/versions`).doc('v2')
      .set({ text: 'Zweiter Entwurf', createdBy: 'chefA' })));
  await pruefe('Version bleibt unveraenderlich, auch fuer den Chef', () =>
    assertFails(chefA().doc(`firmen/${A}/mkProjects/p1/versions/v1`).update({ text: 'anders' })));

  await pruefe('Mitarbeiter kann Studio-Kennzahlen NICHT lesen', () =>
    assertFails(mitA().doc(`firmen/${A}/studioMetrics/studio-0`).get()));
  await pruefe('Mitarbeiter kann die Wettbewerbsliste NICHT lesen', () =>
    assertFails(mitA().doc(`firmen/${A}/competitors/c1`).get()));
  await pruefe('Mitarbeiter kann die Expansionsplanung NICHT lesen', () =>
    assertFails(mitA().doc(`firmen/${A}/expansionLeads/l1`).get()));
  await pruefe('GEGENPROBE Chef sieht seine Kennzahlen', () =>
    assertSucceeds(chefA().doc(`firmen/${A}/studioMetrics/studio-0`).get()));

  // ══ 6. Aufzaehlen von Konten ══
  await pruefe('Anonym kann users NICHT auflisten', () =>
    assertFails(anonym().collection('users').get()));
  await pruefe('Mitarbeiter kann users NICHT ungefiltert auflisten', () =>
    assertFails(mitA().collection('users').get()));
  await pruefe('GEGENPROBE gefiltert auf die eigene Firma geht', () =>
    assertSucceeds(mitA().collection('users').where('firma', '==', A).get()));

  console.log('\n' + protokoll.join('\n'));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen\n');
  await env.cleanup();
  if (gefallen) {
    console.log('✗ Es gibt einen Weg, sich mehr Rechte zu nehmen als vorgesehen.');
    process.exit(1);
  }
  console.log('✓ Niemand hebt sich selbst hoch, und nichts laesst sich aufzaehlen.');
})();
