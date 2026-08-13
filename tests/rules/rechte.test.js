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

  /* ══ 5. Die stillgelegten Nachbaranwendungen ══
     marketing.html und wachstum.html werden seit dem 13.8.2026 nicht
     mehr ausgeliefert. Ihre Sammlungen stehen auf false — kein Browser
     kommt mehr heran, auch der Chef nicht.

     Das ist die Sperre selbst, und sie gehoert geprueft: eine Regel, die
     versehentlich wieder aufgeht, faellt sonst niemandem auf. Vorher
     stand hier das Gegenteil (Chef darf, Mitarbeiter nicht); wer die
     Seiten zurueckholt, findet die alten Pruefungen im Verlauf.

     Der Termin-Mailversand laeuft weiter: die Cloud Functions arbeiten
     mit Admin-Rechten und unterliegen diesen Regeln nicht. */
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await d.doc(`firmen/${A}/mkProjects/p1`).set({ name: 'Kampagne', createdBy: 'chefA' });
    await d.doc(`firmen/${A}/mkProjects/p1/versions/v1`).set({ text: 'Entwurf', createdBy: 'chefA' });
    await d.doc(`firmen/${A}/appointments/t1`).set({ customerName: 'Kundin', startsAt: 1 });
    await d.doc(`firmen/${A}/emailTemplates/v1`).set({ subject: 'x', body: 'y' });
    await d.doc(`firmen/${A}/studioMetrics/studio-0`).set({ mitglieder: 210, miete: 4200 });
    await d.doc(`firmen/${A}/competitors/c1`).set({ name: 'Mitbewerber', preis: 79 });
    await d.doc(`firmen/${A}/expansionLeads/l1`).set({ ort: 'Bonn', miete: 3100 });
    await d.doc('appointments/flach1').set({ customerName: 'Kundin', startsAt: 1 });
    await d.doc('mkProjects/flach1').set({ name: 'Kampagne' });
  });

  const gesperrt = [
    ['Marketing-Projekte', `firmen/${A}/mkProjects/p1`],
    ['die Versionen darunter', `firmen/${A}/mkProjects/p1/versions/v1`],
    ['Termine mit Kundendaten', `firmen/${A}/appointments/t1`],
    ['E-Mail-Vorlagen', `firmen/${A}/emailTemplates/v1`],
    ['Studio-Kennzahlen', `firmen/${A}/studioMetrics/studio-0`],
    ['die Wettbewerbsliste', `firmen/${A}/competitors/c1`],
    ['die Expansionsplanung', `firmen/${A}/expansionLeads/l1`],
    /* Die flachen Pfade sind der eigentliche Punkt: dort fragten die
       Regeln nur istAktiv(), nicht nach der Firma. */
    ['Termine auf dem flachen Pfad', 'appointments/flach1'],
    ['Marketing-Projekte flach', 'mkProjects/flach1'],
  ];
  for (const [name, pfad] of gesperrt) {
    await pruefe('Chef kommt NICHT an ' + name, () =>
      assertFails(chefA().doc(pfad).get()));
    await pruefe('Mitarbeiter kommt NICHT an ' + name, () =>
      assertFails(mitA().doc(pfad).get()));
  }
  await pruefe('auch der Betreiber kommt nicht heran', () =>
    assertFails(admin().doc(`firmen/${A}/appointments/t1`).get()));
  await pruefe('und schreiben geht auch nicht', () =>
    assertFails(chefA().doc(`firmen/${A}/appointments/t2`)
      .set({ customerName: 'Neu', startsAt: 2, createdBy: 'chefA' })));

  /* Gegenprobe: die Sperre gilt genau diesen Sammlungen und nicht der
     ganzen Firma — sonst waere die App mit gesperrt. */
  await pruefe('GEGENPROBE der Chef arbeitet sonst normal weiter', () =>
    assertSucceeds(chefA().doc(`firmen/${A}/abo/aktuell`).get()));

  /* ══ Mitarbeiter legen eigene Aufgaben an — aber nur einmalige ══
     Neu am 13.8. Die Grenze steht in den Regeln und nicht nur in der
     Oberflaeche: ein Feld, das die App weglaesst, laesst sich in der
     Konsole trotzdem mitschicken. */
  const auf = (sk, id) => mitA().doc(`firmen/${A}/studios/${sk}/todos/${id}`);
  await pruefe('Mitarbeiter darf eine einmalige Aufgabe im eigenen Studio anlegen', () =>
    assertSucceeds(auf('studio-0', 'neu1').set({
      title: 'Handtücher nachlegen', createdByUid: 'mitA', createdBy: 'Mit A', ts: Date.now(),
    })));
  await pruefe('Mitarbeiter darf KEINE wiederkehrende Aufgabe anlegen', () =>
    assertFails(auf('studio-0', 'neu2').set({
      title: 'Jeden Tag', recurring: 'daily', createdByUid: 'mitA', ts: Date.now(),
    })));
  await pruefe('auch nicht woechentlich', () =>
    assertFails(auf('studio-0', 'neu3').set({
      title: 'Jede Woche', recurring: 'weekly', createdByUid: 'mitA', ts: Date.now(),
    })));
  await pruefe('Mitarbeiter darf NICHT in einem fremden Studio anlegen', () =>
    assertFails(auf('studio-5', 'neu4').set({
      title: 'Woanders', createdByUid: 'mitA', ts: Date.now(),
    })));
  /* Ohne diese Zeile koennte jemand Aufgaben im Namen des Chefs
     anlegen — in der Liste stuende dann dessen Name. */
  await pruefe('Mitarbeiter darf sich NICHT als jemand anderes ausgeben', () =>
    assertFails(auf('studio-0', 'neu5').set({
      title: 'Angeblich vom Chef', createdByUid: 'chefA', createdBy: 'Chef A', ts: Date.now(),
    })));
  await pruefe('GEGENPROBE der Chef darf weiterhin wiederkehrende anlegen', () =>
    assertSucceeds(chefA().doc(`firmen/${A}/studios/studio-5/todos/chef1`).set({
      title: 'Jeden Tag', recurring: 'daily', createdByUid: 'chefA', ts: Date.now(),
    })));
  await pruefe('GEGENPROBE loeschen bleibt der Verwaltung vorbehalten', () =>
    assertFails(auf('studio-0', 'neu1').delete()));

  /* ══ Probetraining ══
     Neu am 13.8. Der Punkt hier ist nicht das Lesen, sondern das
     Aendern: eine nachtraeglich gedrehte Quote waere schlimmer als ein
     falscher Eintrag, den man loescht und neu setzt. Deshalb steht
     update auf false — fuer alle. */
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(`firmen/${A}/probetrainings/pb1`).set({
      studioKey: 'studio-0', datum: Date.now(), abschluss: true,
      vonUid: 'mitA', vonName: 'Mit A',
    });
  });
  const pb = (wer, id) => wer.doc(`firmen/${A}/probetrainings/${id}`);
  await pruefe('Mitarbeiter darf ein Probetraining eintragen', () =>
    assertSucceeds(pb(mitA(), 'pb2').set({
      studioKey: 'studio-0', datum: Date.now(), abschluss: false, vonUid: 'mitA',
    })));
  await pruefe('Mitarbeiter darf es NICHT auf jemand anderen buchen', () =>
    assertFails(pb(mitA(), 'pb3').set({
      studioKey: 'studio-0', datum: Date.now(), abschluss: true, vonUid: 'chefA',
    })));
  await pruefe('abschluss muss ein Ja/Nein sein, kein Text', () =>
    assertFails(pb(mitA(), 'pb4').set({
      studioKey: 'studio-0', datum: Date.now(), abschluss: 'vielleicht', vonUid: 'mitA',
    })));
  await pruefe('NIEMAND darf einen Eintrag nachträglich drehen', () =>
    assertFails(pb(chefA(), 'pb1').update({ abschluss: false })));
  await pruefe('auch der Eintragende nicht', () =>
    assertFails(pb(mitA(), 'pb1').update({ abschluss: false })));
  await pruefe('GEGENPROBE der eigene Eintrag lässt sich löschen', () =>
    assertSucceeds(pb(mitA(), 'pb2').delete()));
  await pruefe('GEGENPROBE der Chef darf jeden Eintrag löschen', () =>
    assertSucceeds(pb(chefA(), 'pb1').delete()));
  await pruefe('GEGENPROBE lesen darf das ganze Team', () =>
    assertSucceeds(mitA().collection(`firmen/${A}/probetrainings`).get()));

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
