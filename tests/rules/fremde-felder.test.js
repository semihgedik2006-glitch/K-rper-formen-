/* ── Wer darf an einem fremden Dokument WAS ───────────────────────────
   Dritte Schicht derselben Klasse. Bei Reaktionen, Stimmen und dem
   Gelesen-Haken war das FELD erlaubt, sein Inhalt aber beliebig. Hier
   war noch weniger geprüft:

       allow update: if istAktiv();

   Jedes aktive Konto durfte JEDES Feld JEDER Aufgabe in JEDEM Studio
   ändern. Im Emulator nachgemessen, bevor eine Zeile Regel geschrieben
   wurde — alles ging durch:

       DURCHGEGANGEN: Aufgabe in einem FREMDEN Studio umbenennen
       DURCHGEGANGEN: fremde Aufgabe auf jemand anderen umschreiben
       DURCHGEGANGEN: sich selbst eine WIEDERKEHRENDE Aufgabe geben
       DURCHGEGANGEN: fremde Erledigung zuruecknehmen
       DURCHGEGANGEN: Putzaufgabe im fremden Studio umbenennen
       DURCHGEGANGEN: den TEXT des anderen umschreiben
       DURCHGEGANGEN: die Nachricht auf sich selbst umschreiben

   Der dritte Fall ist der lehrreichste: `allow create` verbietet einem
   Mitarbeiter ausdrücklich, sich eine wiederkehrende Aufgabe zu geben.
   Anlegen und danach ändern hat die Bedingung schlicht umgangen. Eine
   Sperre, die nur beim Anlegen greift, ist keine Sperre.

   Die letzten beiden sind die schwersten. In einem 1:1-Gespräch gibt es
   keine Zeugen: „das habe ich nie geschrieben" steht dann gegen einen
   Verlauf, der etwas anderes behauptet — und der Empfänger konnte ihn
   umschreiben.

   DIE OBERFLÄCHE WAR DIE GANZE ZEIT STRENGER ALS DIE REGEL. „Bearbeiten",
   die Frist-Knöpfe, „Löschen" und „Pausieren" stehen in der App hinter
   canManage(). Nur wusste das niemand ausser der App — und wer nicht
   die App benutzt, war an keine davon gebunden.

   DIE HÄLFTE, DIE HIER MEHR WIEGT: dass die echten Wege noch gehen.
   Eine zu strenge Regel bricht still, bis jemand eine Aufgabe nicht
   abhaken kann. Zu jeder Sperre steht deshalb die Gegenprobe daneben,
   und die Feldlisten sind aus dem Client ABGELESEN, nicht geraten.
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

const mitA    = () => env.authenticatedContext('mitA').firestore();
const leiterA = () => env.authenticatedContext('leiterA').firestore();
const chefA   = () => env.authenticatedContext('chefA').firestore();
const chefB   = () => env.authenticatedContext('chefB').firestore();

/* mitA gehört NUR zu studio-0. studio-9 ist damit ein fremdes Studio —
   ohne ein zweites Studio liesse sich „nur im eigenen" nicht prüfen. */
const EIGEN = 'studios/studio-0/todos/t1';
const FREMD = 'studios/studio-9/todos/t2';
const PUTZ_EIGEN = 'studios/studio-0/cleaning/c1';
const PUTZ_FREMD = 'studios/studio-9/cleaning/c2';
const DM = 'dms/dm_mitA_zweitA';
const DMSG = DM + '/messages/m1';

const AUFGABE = {
  title: 'Böden wischen', createdByUid: 'chefA', done: false, ts: 1,
  due: 1788000000000, steps: [{ t: 'Eimer holen', d: false }],
};
const PUTZAUFGABE = { title: 'Spiegel putzen', recurring: 'woechentlich', done: false };
const NACHRICHT = {
  uid: 'zweitA', name: 'Zweiter', ts: 1,
  text: 'Ich habe den Schlüssel abgegeben.',
  items: [{ t: 'Schlüssel', d: false }],
};

async function frisch(pfad, daten) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(pfad).set(daten);
  });
}

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
    await d.doc('users/leiterA').set({ name: 'Leiter A', role: 'leiter', firma: A, aktiv: true, studioKeys: ['studio-0'] });
    await d.doc('users/mitA').set({ name: 'Mit A', role: 'mitarbeiter', firma: A, aktiv: true, studioKeys: ['studio-0'] });
    await d.doc('users/zweitA').set({ name: 'Zweiter', role: 'mitarbeiter', firma: A, aktiv: true, studioKeys: ['studio-0'] });
    await d.doc('users/chefB').set({ name: 'Chef B', role: 'chef', firma: B, aktiv: true });
    /* Ein aktives Konto ohne studioKeys. Ohne das liesse sich „nur im
       eigenen Studio" nicht von „jeder Angemeldete" unterscheiden. */
    await d.doc('users/ohneStudio').set({ name: 'Ohne', role: 'mitarbeiter', firma: A, aktiv: true });
    await d.doc(DM).set({ participants: ['mitA', 'zweitA'], last: 'Hallo', lastTs: 1 });
  });

  /* ══ 1. Aufgaben — was ein Mitarbeiter WIRKLICH tut ══
     Jede dieser Zeilen entspricht einer Schreibstelle im Client. Wenn
     eine rot wird, ist nicht der Durchlauf falsch, sondern die App
     kaputt. */
  await frisch(EIGEN, AUFGABE);
  await pruefe('ABHAKEN im eigenen Studio geht (4 Felder wie im Client)', () =>
    assertSucceeds(mitA().doc(EIGEN).update({
      done: true, doneBy: 'Mit A', doneByUid: 'mitA', doneAt: 2 })));

  await frisch(EIGEN, Object.assign({}, AUFGABE, { done: true, doneBy: 'Zweiter', doneByUid: 'zweitA' }));
  await pruefe('Eine FALSCH gesetzte Erledigung zurücknehmen geht', () =>
    assertSucceeds(mitA().doc(EIGEN).update({
      done: false, doneBy: null, doneByUid: null, doneAt: null })));

  await frisch(EIGEN, AUFGABE);
  await pruefe('Teilschritte abhaken geht', () =>
    assertSucceeds(mitA().doc(EIGEN).update({ steps: [{ t: 'Eimer holen', d: true }] })));

  await frisch(EIGEN, AUFGABE);
  await pruefe('„Ich übernehme das" geht', () =>
    assertSucceeds(mitA().doc(EIGEN).update({ assignedTo: 'mitA', assignedName: 'Mit A' })));

  await frisch(EIGEN, AUFGABE);
  await pruefe('Einen Grund für die Verzögerung eintragen geht', () =>
    assertSucceeds(mitA().doc(EIGEN).update({
      grund: 'Material fehlt', grundVon: 'MA', grundAm: 2 })));

  await frisch(EIGEN, AUFGABE);
  await pruefe('Ein Foto anhängen geht', () =>
    assertSucceeds(mitA().doc(EIGEN).update({
      photo: 'data:image/jpeg;base64,xx', photoBy: 'Mit A', photoAt: 2 })));

  /* ══ 2. Aufgaben — und was er NICHT darf ══ */
  await frisch(EIGEN, AUFGABE);
  await pruefe('Eine Aufgabe UMBENENNEN geht nicht', () =>
    assertFails(mitA().doc(EIGEN).update({ title: 'Etwas ganz anderes' })));

  await frisch(EIGEN, AUFGABE);
  await pruefe('Die FRIST verschieben geht nicht (in der App Sache der Leitung)', () =>
    assertFails(mitA().doc(EIGEN).update({ due: 1799999999999 })));

  /* Der lehrreichste Fall: `allow create` verbietet einem Mitarbeiter
     ausdrücklich, sich eine wiederkehrende Aufgabe zu geben. Anlegen und
     danach ändern hat die Bedingung schlicht umgangen. */
  await frisch(EIGEN, AUFGABE);
  await pruefe('Sich selbst eine WIEDERKEHRENDE Aufgabe geben geht nicht', () =>
    assertFails(mitA().doc(EIGEN).update({ recurring: 'taeglich' })));

  await frisch(EIGEN, AUFGABE);
  await pruefe('Die Urheberschaft umschreiben geht nicht', () =>
    assertFails(mitA().doc(EIGEN).update({ createdByUid: 'mitA' })));

  /* Ein erlaubtes Feld nebenbei mitzuschicken darf den Rest nicht
     durchschleusen. Ohne diese Runde hiesse „nur diese Felder" nur
     „mindestens eines davon". */
  await frisch(EIGEN, AUFGABE);
  await pruefe('Abhaken UND heimlich umbenennen geht nicht', () =>
    assertFails(mitA().doc(EIGEN).update({ done: true, title: 'Geschmuggelt' })));

  /* ══ 3. Das fremde Studio ══ */
  await frisch(FREMD, AUFGABE);
  await pruefe('In einem FREMDEN Studio abhaken geht nicht', () =>
    assertFails(mitA().doc(FREMD).update({
      done: true, doneBy: 'Mit A', doneByUid: 'mitA', doneAt: 2 })));
  await frisch(FREMD, AUFGABE);
  await pruefe('In einem fremden Studio umbenennen erst recht nicht', () =>
    assertFails(mitA().doc(FREMD).update({ title: 'Etwas ganz anderes' })));

  /* ══ 4. Die Leitung darf weiterhin alles ══
     Ohne diese Runde wäre eine Regel, die alles verbietet, die beste. */
  await frisch(FREMD, AUFGABE);
  await pruefe('GEGENPROBE der Chef benennt jede Aufgabe um', () =>
    assertSucceeds(chefA().doc(FREMD).update({ title: 'Neu benannt' })));
  await frisch(FREMD, AUFGABE);
  await pruefe('GEGENPROBE der Chef setzt recurring und Frist', () =>
    assertSucceeds(chefA().doc(FREMD).update({ recurring: 'taeglich', due: 1799999999999 })));
  await frisch(EIGEN, AUFGABE);
  await pruefe('GEGENPROBE der Leiter darf es in SEINEM Studio', () =>
    assertSucceeds(leiterA().doc(EIGEN).update({ title: 'Vom Leiter benannt' })));
  await frisch(FREMD, AUFGABE);
  await pruefe('Der Leiter darf es in einem fremden Studio NICHT', () =>
    assertFails(leiterA().doc(FREMD).update({ title: 'Nicht seins' })));
  /* HIER STAND EINE ZEILE, DIE ROT WURDE — und sie hatte recht.
     Geprüft werden sollte: der Chef der anderen Firma kommt an eine
     Aufgabe auf dem FLACHEN Pfad nicht heran. Er kommt heran.

     Das ist nicht diese Runde: die flachen Regeln fragen seit jeher nur
     istAktiv() und manages(), nie nach der Firma. Nachgemessen reicht es
     weiter, als OFFEN.md es festhält — nicht nur appointments über die
     Nachbarseiten, sondern Aufgaben, Chat, Brett, Ankündigungen,
     Übergaben, Dokumente und Dienstplan, und schon für einen einfachen
     Mitarbeiter der zweiten Firma.

     Latent, nicht offen: einen zweiten Kunden gibt es noch nicht, und
     OFFEN.md hält fest, dass das VOR ihm erledigt sein muss. Es hier
     grün zu behaupten wäre die Sorte Grün, gegen die dieses Projekt
     anschreibt — also steht es als Fund in OFFEN.md und nicht als
     bestandene Prüfung.

     Was diese Runde entscheidet, ist die Feldgrenze. Die gilt auch für
     einen Chef der eigenen Firma nicht anders — und genau das steht
     hier: */
  await frisch(EIGEN, AUFGABE);
  await pruefe('Ein Konto OHNE Studio-Zuordnung hakt nichts ab', () =>
    assertFails(env.authenticatedContext('ohneStudio').firestore()
      .doc(EIGEN).update({ done: true, doneBy: 'X', doneByUid: 'ohneStudio', doneAt: 2 })));

  /* ══ 5. Putzplan ══
     Anlegen ist Chefsache, also auch Umbenennen und Pausieren — beides
     steht in der App hinter chef. Abhaken darf jeder, sonst müsste die
     Leitung hinterherlaufen. */
  await frisch(PUTZ_EIGEN, PUTZAUFGABE);
  await pruefe('PUTZ · abhaken geht (5 Felder wie im Client, mit Kürzel)', () =>
    assertSucceeds(mitA().doc(PUTZ_EIGEN).update({
      done: true, doneBy: 'Mit A', doneByUid: 'mitA', doneKuerzel: 'MA', doneAt: 2 })));
  await frisch(PUTZ_FREMD, PUTZAUFGABE);
  await pruefe('PUTZ · abhaken geht auch im anderen Studio (Aushilfe)', () =>
    assertSucceeds(mitA().doc(PUTZ_FREMD).update({
      done: true, doneBy: 'Mit A', doneByUid: 'mitA', doneKuerzel: 'MA', doneAt: 2 })));
  await frisch(PUTZ_EIGEN, PUTZAUFGABE);
  await pruefe('PUTZ · umbenennen geht nicht', () =>
    assertFails(mitA().doc(PUTZ_EIGEN).update({ title: 'Nichts zu tun' })));
  await frisch(PUTZ_EIGEN, PUTZAUFGABE);
  await pruefe('PUTZ · pausieren geht nicht (in der App hinter chef)', () =>
    assertFails(mitA().doc(PUTZ_EIGEN).update({ pausiertBis: '2027-01-01', pausiertVon: 'Mit A' })));
  await frisch(PUTZ_EIGEN, PUTZAUFGABE);
  await pruefe('PUTZ · GEGENPROBE der Chef pausiert', () =>
    assertSucceeds(chefA().doc(PUTZ_EIGEN).update({
      pausiertBis: '2027-01-01', pausiertVon: 'Chef A' })));
  await frisch(PUTZ_EIGEN, PUTZAUFGABE);
  await pruefe('PUTZ · GEGENPROBE der Chef ändert Titel und Intervall', () =>
    assertSucceeds(chefA().doc(PUTZ_EIGEN).update({
      title: 'Spiegel und Fenster', recurring: 'custom', intervalMs: 86400000,
      intervalN: 1, intervalUnit: 'd', geaendertVon: 'Chef A', geaendertAm: 2 })));

  /* ══ 6. Direktnachrichten — die schwerste Lücke ══ */
  await frisch(DMSG, NACHRICHT);
  await pruefe('DM · das Checklisten-Häkchen geht (die EINE Schreibstelle im Client)', () =>
    assertSucceeds(mitA().doc(DMSG).update({ items: [{ t: 'Schlüssel', d: true }] })));

  await frisch(DMSG, NACHRICHT);
  await pruefe('DM · den TEXT des anderen umschreiben geht nicht', () =>
    assertFails(mitA().doc(DMSG).update({ text: 'Ich habe den Schlüssel behalten.' })));

  await frisch(DMSG, NACHRICHT);
  await pruefe('DM · die Nachricht auf sich selbst umschreiben geht nicht', () =>
    assertFails(mitA().doc(DMSG).update({ uid: 'mitA', name: 'Mit A' })));

  await frisch(DMSG, NACHRICHT);
  await pruefe('DM · Häkchen setzen UND Text ändern geht nicht', () =>
    assertFails(mitA().doc(DMSG).update({
      items: [{ t: 'Schlüssel', d: true }], text: 'etwas anderes' })));

  /* Auch der eigene Text bleibt stehen. Im Chat gibt es ein
     15-Minuten-Fenster zum Bearbeiten; in Direktnachrichten hat der
     Client dafür gar keinen Weg — also gibt es hier auch keinen. Wer
     einen baut, muss diese Zeile ändern und dabei nachdenken. */
  await frisch(DMSG, Object.assign({}, NACHRICHT, { uid: 'mitA', name: 'Mit A' }));
  await pruefe('DM · auch den EIGENEN Text nachträglich ändern geht nicht', () =>
    assertFails(mitA().doc(DMSG).update({ text: 'anders formuliert' })));

  /* Der Verlauf wird bei jedem Senden mitgeschrieben. Das muss gehen —
     und darf participants nicht verändern. */
  await pruefe('DM · den Verlauf mitschreiben geht (so wie sendDm es tut)', () =>
    assertSucceeds(mitA().doc(DM).set({
      participants: ['mitA', 'zweitA'], names: { mitA: 'Mit A', zweitA: 'Zweiter' },
      last: 'Neue Nachricht', lastTs: 3, lastSender: 'mitA', readTs: { mitA: 3 },
    }, { merge: true })));

  await pruefe('DM · auch in umgekehrter Reihenfolge (der andere hat sie angelegt)', () =>
    assertSucceeds(mitA().doc(DM).set({
      participants: ['zweitA', 'mitA'], last: 'Noch eine', lastTs: 4,
    }, { merge: true })));

  await pruefe('DM · einen DRITTEN hineinschreiben geht nicht', () =>
    assertFails(mitA().doc(DM).set({
      participants: ['mitA', 'zweitA', 'chefB'], last: 'x', lastTs: 5,
    }, { merge: true })));

  await pruefe('DM · den anderen hinauswerfen geht nicht', () =>
    assertFails(mitA().doc(DM).set({
      participants: ['mitA', 'chefB'], last: 'x', lastTs: 6,
    }, { merge: true })));

  console.log('\n' + protokoll.join('\n'));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen\n');
  await env.cleanup();
  if (gefallen) {
    console.log('✗ An fremden Dokumenten laesst sich mehr aendern als vorgesehen — ' +
      'oder ein echter Weg ist zugegangen. Beides ist schlimm.');
    process.exit(1);
  }
  console.log('✓ Fremde Dokumente: nur die Felder, die der Client wirklich schreibt.');
})();
