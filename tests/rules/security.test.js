/* ─────────────────────────────────────────────────────────────────────
   Sicherheitstests gegen firestore.rules — ausgefuehrt, nicht gelesen.

   Die Regeln sind die einzige echte Grenze dieser App: was in der
   Oberflaeche versteckt ist, kann jeder mit der Entwicklerkonsole
   aufrufen.

   Ausfuehren:
     cd tests/rules && npm install && npm test
   Braucht Java — der Firestore-Emulator ist ein Java-Programm. Er laeuft
   aus dem Wurzelverzeichnis, weil firebase-tools keine Regeldatei
   ausserhalb des Projektordners zulaesst und genau die Datei geprueft
   werden soll, die auch ausgerollt wird.

   Jeder Test sagt im Namen, WAS er schuetzt. Faellt einer um, kommt
   jemand an Daten, an die er nicht soll.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment, assertFails, assertSucceeds,
} = require('@firebase/rules-unit-testing');

const REGELN = path.join(__dirname, '..', '..', 'firestore.rules');

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

// Rollen als eigene Verbindungen
const alsChef        = () => env.authenticatedContext('chef1').firestore();
const alsLeiter      = () => env.authenticatedContext('leiter1').firestore();
const alsMitarbeiter = () => env.authenticatedContext('mit1').firestore();
const alsFremder     = () => env.authenticatedContext('fremd1').firestore();  // selbst registriert
const alsAnonym      = () => env.unauthenticatedContext().firestore();

(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-regeltest',
    // Ohne host/port: die Verbindungsdaten kommen aus FIRESTORE_EMULATOR_HOST,
    // das "firebase emulators:exec" setzt. Fest verdrahtete Ports gehen
    // schief, sobald jemand den Emulator anders startet.
    firestore: { rules: fs.readFileSync(REGELN, 'utf8') },
  });
  await env.clearFirestore();

  // ── Ausgangslage anlegen (an den Regeln vorbei) ──
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc('users/chef1').set({ name: 'Chef', role: 'chef' });
    await db.doc('users/leiter1').set({ name: 'Leiter', role: 'leiter', studioKeys: ['studio-6'] });
    await db.doc('users/mit1').set({ name: 'Mitarbeiter', role: 'mitarbeiter', studioKeys: ['studio-6'] });
    await db.doc('users/fremd1').set({ name: 'Fremder', role: 'mitarbeiter', studioKeys: [] });
    await db.doc('channels/allgemein/messages/m1').set({ uid: 'chef1', text: 'intern', ts: Date.now() });
    await db.doc('studios/studio-6/todos/t1').set({ title: 'Aufgabe', ts: Date.now() });
    await db.doc('studios/studio-7/todos/t2').set({ title: 'Fremdes Studio', ts: Date.now() });
    await db.doc('certificates/z1').set({ uid: 'mit1', art: 'ersthelfer', bis: '2027-01-01' });
    await db.doc('dms/dm_chef1_leiter1/messages/x1').set({ uid: 'chef1', text: 'vertraulich', ts: Date.now() });
    await db.doc('dms/dm_chef1_leiter1').set({ participants: ['chef1', 'leiter1'] });
    await db.doc('documents/d1').set({ name: 'Hygiene', studios: ['studio-6'] });
    await db.doc('documents/d2').set({ name: 'Fremd', studios: ['studio-9'] });
    await db.doc('documentData/d2').set({ data: 'INHALT-FREMDES-STUDIO' });
    await db.doc('inventory/studio-9').set({ items: [{ name: 'Handtücher', have: 20, limit: 20 }] });
    await db.doc('trash/tr1').set({ col: 'todos', sk: 'studio-9', deletedByUid: 'chef1' });
    await db.doc('pushTokens/tok1').set({ uid: 'chef1' });
    await db.doc('archives/2026-KW31').set({ week: '2026-KW31' });
    await db.doc('studioMetrics/studio-6').set({ mitglieder: 120 });
  });

  // ══ 1. Ohne Anmeldung geht gar nichts ══
  await pruefe('Anonym kann den Teamchat NICHT lesen', () =>
    assertFails(alsAnonym().doc('channels/allgemein/messages/m1').get()));
  await pruefe('Anonym kann das Team NICHT lesen', () =>
    assertFails(alsAnonym().doc('users/chef1').get()));
  await pruefe('Anonym kann NICHT schreiben', () =>
    assertFails(alsAnonym().doc('channels/allgemein/messages/neu').set({ uid: 'x', text: 'hi', ts: 1 })));

  // ══ 2. Niemand hebt sich selbst hoch ══
  await pruefe('Mitarbeiter kann sich NICHT zum Chef machen', () =>
    assertFails(alsMitarbeiter().doc('users/mit1').update({ role: 'chef' })));
  await pruefe('Mitarbeiter kann sich NICHT selbst Studios zuteilen', () =>
    assertFails(alsMitarbeiter().doc('users/mit1').update({ studioKeys: ['studio-1', 'studio-2'] })));
  await pruefe('Mitarbeiter kann NICHT das Profil eines anderen aendern', () =>
    assertFails(alsMitarbeiter().doc('users/chef1').update({ name: 'gekapert' })));
  await pruefe('Neuanmeldung mit Rolle chef wird abgelehnt', () =>
    assertFails(env.authenticatedContext('neu1').firestore()
      .doc('users/neu1').set({ name: 'Neu', role: 'chef' })));
  await pruefe('Neuanmeldung als Mitarbeiter ist erlaubt', () =>
    assertSucceeds(env.authenticatedContext('neu2').firestore()
      .doc('users/neu2').set({ name: 'Neu', role: 'mitarbeiter' })));

  // ══ 3. Aufgaben nur in eigenen Studios verwalten ══
  await pruefe('Mitarbeiter kann KEINE Aufgabe anlegen', () =>
    assertFails(alsMitarbeiter().doc('studios/studio-6/todos/neu').set({ title: 'x', ts: 1 })));
  await pruefe('Leiter kann im EIGENEN Studio eine Aufgabe anlegen', () =>
    assertSucceeds(alsLeiter().doc('studios/studio-6/todos/neu2').set({ title: 'x', ts: 1 })));
  await pruefe('Leiter kann im FREMDEN Studio KEINE Aufgabe anlegen', () =>
    assertFails(alsLeiter().doc('studios/studio-7/todos/neu3').set({ title: 'x', ts: 1 })));
  await pruefe('Leiter kann im FREMDEN Studio KEINE Aufgabe loeschen', () =>
    assertFails(alsLeiter().doc('studios/studio-7/todos/t2').delete()));

  // ══ 4. Nachweise sind heikel ══
  await pruefe('Leiter kann Nachweise NICHT lesen', () =>
    assertFails(alsLeiter().doc('certificates/z1').get()));
  await pruefe('Fremder kann Nachweise NICHT lesen', () =>
    assertFails(alsFremder().doc('certificates/z1').get()));
  await pruefe('Betroffener kann seinen EIGENEN Nachweis lesen', () =>
    assertSucceeds(alsMitarbeiter().doc('certificates/z1').get()));
  await pruefe('Chef kann Nachweise lesen', () =>
    assertSucceeds(alsChef().doc('certificates/z1').get()));
  /* ── Nachweise selbst eintragen ──
       Der Chef darf bestaetigen, eintragen darf jeder seine eigenen. Bei
       57 Leuten waere das Abtippen von Erste-Hilfe-Scheinen sonst Sache
       des Chefs — also passiert es nicht, und die Liste ist nach einem
       halben Jahr wertlos.

       „Mitarbeiter kann seinen Nachweis nicht selbst verlaengern" ist
       damit aufgehoben; die Regel haette ohnehin nichts geschuetzt,
       sobald man einen NEUEN Eintrag anlegen darf. Was stattdessen
       schuetzt, steht in den drei Tests darunter: fremde Eintraege
       bleiben tabu, geloescht wird nur vom Chef, und ein bestaetigter
       Eintrag ist fuer den Betroffenen zu. */
  await pruefe('Mitarbeiter darf einen EIGENEN Nachweis eintragen', () =>
    assertSucceeds(alsMitarbeiter().doc('certificates/selbst1').set({
      uid: 'mit1', name: 'Mitarbeiter', art: 'ersthelfer', bis: '2028-01-01',
      erfasstVonUid: 'mit1', bestaetigt: false })));
  await pruefe('Mitarbeiter kann seinen eigenen Eintrag noch korrigieren', () =>
    assertSucceeds(alsMitarbeiter().doc('certificates/selbst1')
      .update({ bis: '2028-06-30' })));
  /* Der Kern: er darf sich nicht selbst bestaetigen. Sonst waere die
     Unterscheidung zwischen "behauptet" und "belegt" Dekoration. */
  await pruefe('Mitarbeiter kann sich NICHT selbst bestaetigen', () =>
    assertFails(alsMitarbeiter().doc('certificates/selbst1')
      .update({ bestaetigt: true })));
  await pruefe('Mitarbeiter kann seinen Nachweis NICHT selbst loeschen', () =>
    assertFails(alsMitarbeiter().doc('certificates/selbst1').delete()));
  /* Fremdes bleibt fremd — in beide Richtungen: weder auf einen anderen
     ausstellen noch einen fremden auf sich umschreiben. */
  await pruefe('Mitarbeiter kann KEINEN Nachweis fuer jemand anderen anlegen', () =>
    assertFails(alsMitarbeiter().doc('certificates/fremd1').set({
      uid: 'chef1', art: 'ersthelfer', bis: '2028-01-01',
      erfasstVonUid: 'mit1', bestaetigt: false })));
  await pruefe('Mitarbeiter kann einen Eintrag NICHT als jemand anderes ausgeben', () =>
    assertFails(alsMitarbeiter().doc('certificates/luegner').set({
      uid: 'mit1', art: 'ersthelfer', bis: '2028-01-01',
      erfasstVonUid: 'chef1', bestaetigt: false })));
  /* Und der Fall, der im ersten Entwurf offen stand: ein BESTAETIGTER
     Nachweis liess sich nachtraeglich verlaengern. Damit waere die
     Bestaetigung wertlos gewesen. */
  await pruefe('Chef bestaetigt den Nachweis', () =>
    assertSucceeds(alsChef().doc('certificates/selbst1')
      .set({ bestaetigt: true }, { merge: true })));
  await pruefe('DAS LOCH VON VORHIN: ein bestaetigter Nachweis laesst sich ' +
               'nicht mehr selbst verlaengern', () =>
    assertFails(alsMitarbeiter().doc('certificates/selbst1')
      .update({ bis: '2099-01-01' })));

  // ══ 5. Direktnachrichten liest niemand mit – auch der Chef nicht ══
  await pruefe('Unbeteiligter kann fremde Direktnachricht NICHT lesen', () =>
    assertFails(alsMitarbeiter().doc('dms/dm_chef1_leiter1/messages/x1').get()));
  await pruefe('Beteiligter kann seine Direktnachricht lesen', () =>
    assertSucceeds(alsLeiter().doc('dms/dm_chef1_leiter1/messages/x1').get()));

  // ══ 6. Papierkorb, Archive, Kennzahlen, Push-Tokens ══
  await pruefe('Mitarbeiter kann den Papierkorb NICHT lesen', () =>
    assertFails(alsMitarbeiter().doc('trash/tr1').get()));
  await pruefe('Leiter kann Papierkorb eines FREMDEN Studios NICHT lesen', () =>
    assertFails(alsLeiter().doc('trash/tr1').get()));
  await pruefe('Mitarbeiter kann Wochen-Sicherungen NICHT lesen', () =>
    assertFails(alsMitarbeiter().doc('archives/2026-KW31').get()));
  await pruefe('Leiter kann Studio-Kennzahlen NICHT lesen', () =>
    assertFails(alsLeiter().doc('studioMetrics/studio-6').get()));
  await pruefe('Niemand kann Push-Tokens lesen', () =>
    assertFails(alsChef().doc('pushTokens/tok1').get()));

  // ══ 7. Dokumente: Leiter nur in eigenen Studios ══
  await pruefe('Leiter kann Metadaten eines FREMDEN Dokuments NICHT aendern', () =>
    assertFails(alsLeiter().doc('documents/d2').update({ name: 'gekapert' })));
  await pruefe('Leiter kann INHALT eines FREMDEN Dokuments NICHT ueberschreiben', () =>
    assertFails(alsLeiter().doc('documentData/d2').set({ data: 'gekapert' })));
  await pruefe('Leiter kann INHALT im EIGENEN Studio sehr wohl schreiben', () =>
    assertSucceeds(alsLeiter().doc('documentData/d1').set({ data: 'meins' })));
  await pruefe('Leiter kann Dokumentinhalt NICHT loeschen (Papierkorb ist Chefsache)', () =>
    assertFails(alsLeiter().doc('documentData/d1').delete()));
  await pruefe('Chef kann Dokumentinhalt loeschen', () =>
    assertSucceeds(alsChef().doc('documentData/d2').delete()));

  // ══ 8. Bekannte, bewusst getragene Schwaechen ══
  //     Diese Tests halten den IST-Zustand fest. Faellt einer um, wurde
  //     etwas geaendert - dann soll man es merken, in beide Richtungen.
  await pruefe('BEKANNT: jeder Eingeloggte darf jedes Materialdokument ueberschreiben', () =>
    assertSucceeds(alsFremder().doc('inventory/studio-9').set({ items: [] })));
  await pruefe('BEKANNT: jeder Eingeloggte darf den ganzen Teamchat lesen', () =>
    assertSucceeds(alsFremder().doc('channels/allgemein/messages/m1').get()));
  await pruefe('BEKANNT: jeder Eingeloggte darf alle Personendaten lesen', () =>
    assertSucceeds(alsFremder().doc('users/chef1').get()));

  // ══ 9. Beitritt: Firmencode und Freigabe ══
  //     Erst OHNE eingeschaltete Schranken – bestehende Konten und die
  //     alte Selbstregistrierung muessen unveraendert laufen.
  await pruefe('OHNE Schranken: Selbstregistrierung geht wie bisher', () =>
    assertSucceeds(env.authenticatedContext('ohne1').firestore()
      .doc('users/ohne1').set({ name: 'Ohne', role: 'mitarbeiter' })));
  await pruefe('OHNE Schranken: bestehendes Profil ohne Feld aktiv darf lesen', () =>
    assertSucceeds(alsMitarbeiter().doc('channels/allgemein/messages/m1').get()));

  //     Jetzt Code UND Freigabe einschalten.
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc('config/registrierung')
      .set({ code: 'KF-2026', freigabe: true });
    await ctx.firestore().doc('config/beitrittSchalter')
      .set({ codeNoetig: true, freigabe: true });
    await ctx.firestore().doc('users/wartet1')
      .set({ name: 'Wartet', role: 'mitarbeiter', aktiv: false });
  });

  await pruefe('Die Schalter sind auch OHNE Anmeldung lesbar (Formular braucht sie)', () =>
    assertSucceeds(alsAnonym().doc('config/beitrittSchalter').get()));
  await pruefe('Mitarbeiter kann die Schalter NICHT aendern', () =>
    assertFails(alsMitarbeiter().doc('config/beitrittSchalter').set({ codeNoetig: false })));
  await pruefe('Firmencode ist fuer Mitarbeiter NICHT lesbar', () =>
    assertFails(alsMitarbeiter().doc('config/registrierung').get()));
  await pruefe('Firmencode ist fuer einen Fremden NICHT lesbar', () =>
    assertFails(alsFremder().doc('config/registrierung').get()));
  await pruefe('Chef darf den Firmencode lesen', () =>
    assertSucceeds(alsChef().doc('config/registrierung').get()));
  await pruefe('Beitritts-Nachweis ist fuer niemanden lesbar', () =>
    assertFails(alsChef().doc('beitritt/wartet1').get()));

  /* ── Abgeschaltete Funktionen (config/features) ──
     Der Chef entscheidet, was dieser Betrieb benutzt. Wenn ein
     Mitarbeiter das umschreiben koennte, waere die Einstellung wertlos:
     er blendet sich zurueck ein, was ihm fehlt.

     Lesen muss dagegen JEDER duerfen — die App braucht es beim Start,
     um die Navigation richtig aufzubauen. Das ist auch der Grund, warum
     die Schalter ausdruecklich KEINE Zugriffsgrenze sind: was hier
     steht, kann jeder Eingeloggte sehen. Steht so auch in der App. */
  await pruefe('Mitarbeiter darf die Funktionen LESEN (die App braucht es beim Start)', () =>
    assertSucceeds(alsMitarbeiter().doc('config/features').get()));
  await pruefe('Mitarbeiter kann Funktionen NICHT umschalten', () =>
    assertFails(alsMitarbeiter().doc('config/features').set({ schicht: true })));
  await pruefe('Studio-Leiter kann Funktionen NICHT umschalten', () =>
    assertFails(alsLeiter().doc('config/features').set({ schicht: true })));
  await pruefe('Chef darf Funktionen umschalten', () =>
    assertSucceeds(alsChef().doc('config/features').set({ schicht: false })));

  /* ── Impressum und Datenschutz (config/recht) ──
       Lesen darf jeder, auch ohne Anmeldung: ein Impressum hinter einem
       Login ist keins, und § 5 DDG verlangt „leicht erkennbar, unmittelbar
       erreichbar". Der Inhalt ist per Definition oeffentlich — Name,
       Anschrift, Vertretung, Telefon, E-Mail.

       Enger gefasst faellt der Fehler bei der EIGENEN Firma nicht auf:
       dort faengt der Rueckfall auf konfig.js den Anmeldebildschirm ab.
       Ein fremder Kunde saehe statt seines Impressums eine Warnung.

       Schreiben darf nur der Chef. Wer das Impressum aendert, aendert,
       wer fuer diese App haftet.

       ACHTUNG bei jeder Aenderung: die allgemeine Regel /config/{doc}
       greift zusaetzlich, und in Firestore genuegt eine zutreffende Regel,
       die erlaubt. Eine engere Regel an dieser Stelle waere wirkungslos —
       sie muesste dort ausgenommen werden. */
  const alsWartend = () => env.authenticatedContext('wartet1').firestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc('config/recht')
      .set({ betreiber: 'Koerperformen Koeln GmbH', email: 'info@example.de' });
  });
  await pruefe('Mitarbeiter darf das Impressum LESEN (steht in jedem Bildschirm unten)', () =>
    assertSucceeds(alsMitarbeiter().doc('config/recht').get()));
  await pruefe('Wer auf Freigabe wartet, darf das Impressum trotzdem lesen', () =>
    assertSucceeds(alsWartend().doc('config/recht').get()));
  /* Der eigentliche Punkt: OHNE Anmeldung. Faellt dieser Test um, ist
     das Impressum wieder hinter dem Login verschwunden - und damit
     keins mehr. */
  await pruefe('Das Impressum ist auch OHNE Anmeldung lesbar', () =>
    assertSucceeds(alsAnonym().doc('config/recht').get()));
  await pruefe('Ohne Anmeldung kann das Impressum NICHT geaendert werden', () =>
    assertFails(alsAnonym().doc('config/recht').set({ betreiber: 'gekapert' })));
  await pruefe('Mitarbeiter kann das Impressum NICHT aendern', () =>
    assertFails(alsMitarbeiter().doc('config/recht').set({ betreiber: 'gekapert' })));
  await pruefe('Studio-Leiter kann das Impressum NICHT aendern', () =>
    assertFails(alsLeiter().doc('config/recht').set({ betreiber: 'gekapert' })));
  await pruefe('Chef darf das Impressum pflegen', () =>
    assertSucceeds(alsChef().doc('config/recht')
      .set({ betreiber: 'Koerperformen Koeln GmbH', anschrift: 'Musterstr. 1',
             vertreten: 'Max Mustermann', email: 'info@example.de' })));

  /* ── Fehlerberichte ──
     Schreiben muss JEDER Angemeldete duerfen — sonst wuerde ausgerechnet
     der Fehler nicht gemeldet, der einen Mitarbeiter trifft.
     Lesen darf nur der Chef: in einer Meldung steht, wer sie ausgeloest
     hat und was er gerade tat. Das ist nichts fuers ganze Team. */
  await pruefe('Mitarbeiter darf einen Fehler melden', () =>
    assertSucceeds(alsMitarbeiter().doc('fehler/abc_1')
      .set({ text: 'x is not a function', uid: 'mitarbeiter' })));
  await pruefe('Mitarbeiter darf Fehler NICHT lesen', () =>
    assertFails(alsMitarbeiter().doc('fehler/abc_1').get()));
  await pruefe('Studio-Leiter darf Fehler NICHT lesen', () =>
    assertFails(alsLeiter().doc('fehler/abc_1').get()));
  await pruefe('Mitarbeiter darf Fehler NICHT loeschen', () =>
    assertFails(alsMitarbeiter().doc('fehler/abc_1').delete()));
  await pruefe('Chef darf Fehler lesen', () =>
    assertSucceeds(alsChef().doc('fehler/abc_1').get()));
  await pruefe('Chef darf Fehler erledigen (loeschen)', () =>
    assertSucceeds(alsChef().doc('fehler/abc_1').delete()));
  /* Die Groessengrenze ist kein Schoenheitsfehler: ohne sie kann jeder
     Angemeldete beliebig grosse Dokumente in die Datenbank schreiben,
     und zwar in eine Sammlung, die er selbst nie zu Gesicht bekommt. */
  await pruefe('Ein riesiger Fehlertext wird abgelehnt', () =>
    assertFails(alsMitarbeiter().doc('fehler/gross')
      .set({ text: 'x'.repeat(500) })));

  await pruefe('OHNE Code: Konto anlegen wird abgelehnt', () =>
    assertFails(env.authenticatedContext('neu3').firestore()
      .doc('users/neu3').set({ name: 'Neu', role: 'mitarbeiter', aktiv: false })));

  const mitFalschem = env.authenticatedContext('neu4').firestore();
  await mitFalschem.doc('beitritt/neu4').set({ code: 'RATEN' }).catch(() => {});
  await pruefe('MIT FALSCHEM Code: Konto anlegen wird abgelehnt', () =>
    assertFails(mitFalschem.doc('users/neu4').set({ name: 'Neu', role: 'mitarbeiter', aktiv: false })));

  const mitRichtigem = env.authenticatedContext('neu5').firestore();
  await mitRichtigem.doc('beitritt/neu5').set({ code: 'KF-2026' });
  await pruefe('MIT RICHTIGEM Code, aber gleich aktiv: abgelehnt', () =>
    assertFails(mitRichtigem.doc('users/neu5').set({ name: 'Neu', role: 'mitarbeiter', aktiv: true })));
  await pruefe('MIT RICHTIGEM Code und aktiv:false: angenommen', () =>
    assertSucceeds(mitRichtigem.doc('users/neu5').set({ name: 'Neu', role: 'mitarbeiter', aktiv: false })));

  const wartet = () => env.authenticatedContext('wartet1').firestore();
  await pruefe('Wartendes Konto kann den Teamchat NICHT lesen', () =>
    assertFails(wartet().doc('channels/allgemein/messages/m1').get()));
  await pruefe('Wartendes Konto kann die Personenliste NICHT lesen', () =>
    assertFails(wartet().doc('users/chef1').get()));
  await pruefe('Wartendes Konto kann Dokumente NICHT lesen', () =>
    assertFails(wartet().doc('documents/d1').get()));
  await pruefe('Wartendes Konto kann NICHT in den Chat schreiben', () =>
    assertFails(wartet().doc('channels/allgemein/messages/spam')
      .set({ uid: 'wartet1', text: 'hi', ts: Date.now() })));
  await pruefe('Wartendes Konto darf sein EIGENES Profil lesen (sonst keine Wartemeldung)', () =>
    assertSucceeds(wartet().doc('users/wartet1').get()));
  await pruefe('Wartendes Konto kann sich NICHT selbst freischalten', () =>
    assertFails(wartet().doc('users/wartet1').update({ aktiv: true })));
  await pruefe('Chef kann ein wartendes Konto freischalten', () =>
    assertSucceeds(alsChef().doc('users/wartet1').update({ aktiv: true })));
  await pruefe('Nach der Freigabe darf das Konto lesen', () =>
    assertSucceeds(wartet().doc('channels/allgemein/messages/m1').get()));

  // ══ Studioliste: darf nur wachsen ══
  //
  // Die Datenbank-Kennung eines Studios haengt an seinem Platz in dieser
  // Liste. Wird sie gekuerzt oder umsortiert, bekommen die folgenden
  // Studios die Kennung ihres Vorgaengers - und damit dessen Aufgaben,
  // Schichten und Nachrichten. Lautlos. Die Regel muss das verhindern,
  // nicht die Oberflaeche: wer die Regeln umgeht, umgeht auch die Knoepfe.
  const DREI = [
    { id: 'studio-0', name: 'Longerich', aktiv: true },
    { id: 'studio-1', name: 'Nippes', aktiv: true },
    { id: 'studio-2', name: 'Rath', aktiv: true },
  ];
  await env.withSecurityRulesDisabled(async ctx => {
    await ctx.firestore().doc('config/studios').set({ liste: DREI, naechste: 3 });
  });

  await pruefe('Studioliste ist OHNE Anmeldung lesbar (Registrierungsformular)', () =>
    assertSucceeds(alsAnonym().doc('config/studios').get()));
  await pruefe('Mitarbeiter kann die Studioliste lesen', () =>
    assertSucceeds(alsMitarbeiter().doc('config/studios').get()));
  await pruefe('Mitarbeiter kann die Studioliste NICHT aendern', () =>
    assertFails(alsMitarbeiter().doc('config/studios')
      .set({ liste: DREI.concat([{ id: 'studio-3', name: 'Fremd', aktiv: true }]), naechste: 4 })));
  await pruefe('Leiter kann die Studioliste NICHT aendern', () =>
    assertFails(alsLeiter().doc('config/studios')
      .set({ liste: DREI.concat([{ id: 'studio-3', name: 'Fremd', aktiv: true }]), naechste: 4 })));
  await pruefe('Chef kann ein Studio ANHAENGEN', () =>
    assertSucceeds(alsChef().doc('config/studios')
      .set({ liste: DREI.concat([{ id: 'studio-3', name: 'Porz', aktiv: true }]), naechste: 4 })));
  await pruefe('Chef kann ein Studio UMBENENNEN (gleiche Laenge)', () =>
    assertSucceeds(alsChef().doc('config/studios').set({
      liste: [
        { id: 'studio-0', name: 'Longerich Nord', aktiv: true },
        { id: 'studio-1', name: 'Nippes', aktiv: true },
        { id: 'studio-2', name: 'Rath', aktiv: true },
        { id: 'studio-3', name: 'Porz', aktiv: true },
      ], naechste: 4,
    })));
  await pruefe('Chef kann ein Studio SCHLIESSEN (aktiv:false, bleibt in der Liste)', () =>
    assertSucceeds(alsChef().doc('config/studios').set({
      liste: [
        { id: 'studio-0', name: 'Longerich Nord', aktiv: true },
        { id: 'studio-1', name: 'Nippes', aktiv: true },
        { id: 'studio-2', name: 'Rath', aktiv: false },
        { id: 'studio-3', name: 'Porz', aktiv: true },
      ], naechste: 4,
    })));
  await pruefe('DER WICHTIGE: auch der Chef kann die Liste NICHT kuerzen', () =>
    assertFails(alsChef().doc('config/studios')
      .set({ liste: DREI.slice(0, 2), naechste: 4 })));
  await pruefe('Niemand kann die Studioliste loeschen – auch der Chef nicht', () =>
    assertFails(alsChef().doc('config/studios').delete()));

  // ══════════════════════════════════════════════════════════════
  //  KREUZTESTS: sieht Firma A etwas von Firma B?
  //
  //  Das ist der Beweis, auf den Stufe 2 hinauslaeuft. Ohne ihn darf
  //  die Mandantenfaehigkeit nicht live gehen — mein Auge ist an dieser
  //  Stelle nachweislich kein gutes Pruefgeraet: die Firmen-Pruefung
  //  steht in 30 Bloecken und ueber hundert allow-Zeilen, und in
  //  Firestore genuegt EINE zutreffende Regel die erlaubt, um alles
  //  darunter auszuhebeln.
  //
  //  Geprueft wird beides: dass A nicht bei B LIEST und nicht bei B
  //  SCHREIBT. Nur Lesen zu pruefen waere die haeufigste Halbheit.
  // ══════════════════════════════════════════════════════════════
  const A = 'firma-a', B = 'firma-b';
  await env.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await d.doc('users/chefA').set({ name: 'Chef A', role: 'chef', firma: A, aktiv: true });
    await d.doc('users/mitA').set({ name: 'Mit A', role: 'mitarbeiter', firma: A,
                                    studioKeys: ['studio-0'], aktiv: true });
    await d.doc('users/chefB').set({ name: 'Chef B', role: 'chef', firma: B, aktiv: true });
    await d.doc('firmen/' + A).set({ name: 'Firma A', aktiv: true });
    await d.doc('firmen/' + B).set({ name: 'Firma B', aktiv: true });
    // Je ein Dokument in jeder Sammlung von Firma B
    await d.doc('firmen/' + B + '/channels/allgemein/messages/m1')
      .set({ uid: 'chefB', text: 'Interne Sache von B', ts: Date.now() });
    await d.doc('firmen/' + B + '/studios/studio-0/todos/t1').set({ title: 'B-Aufgabe' });
    await d.doc('firmen/' + B + '/studios/studio-0/shifts/s1').set({ date: '2026-08-12', uid: 'x' });
    await d.doc('firmen/' + B + '/studios/studio-0/absences/a1')
      .set({ uid: 'x', type: 'krank', from: '2026-08-12' });
    await d.doc('firmen/' + B + '/documents/d1').set({ name: 'Vertrag B' });
    await d.doc('firmen/' + B + '/certificates/z1').set({ uid: 'x', art: 'ems' });
    await d.doc('firmen/' + B + '/announcements/an1').set({ text: 'Aushang B', ts: Date.now() });
    await d.doc('firmen/' + B + '/inventory/studio-0').set({ items: [] });
    await d.doc('firmen/' + B + '/board/b1').set({ text: 'Brett B', ts: Date.now() });
    await d.doc('firmen/' + B + '/trash/tr1').set({ art: 'todo', sk: 'studio-0' });
    await d.doc('firmen/' + B + '/archives/2026-KW32').set({ week: '2026-KW32' });
    await d.doc('firmen/' + B + '/config/studios')
      .set({ liste: [{ id: 'studio-0', name: 'B-Studio', aktiv: true }], naechste: 1 });
    await d.doc('firmen/' + B + '/config/registrierung').set({ code: 'GEHEIM-B' });
  });

  const chefA = () => env.authenticatedContext('chefA').firestore();
  const mitA  = () => env.authenticatedContext('mitA').firestore();
  const chefB = () => env.authenticatedContext('chefB').firestore();

  const B_ = p => 'firmen/' + B + '/' + p;

  // ── Lesen ──
  const leseZiele = [
    ['Teamchat',            'channels/allgemein/messages/m1'],
    ['Aufgaben',            'studios/studio-0/todos/t1'],
    ['Schichtplan',         'studios/studio-0/shifts/s1'],
    ['Krankmeldungen',      'studios/studio-0/absences/a1'],
    ['Dokumente',           'documents/d1'],
    ['Nachweise',           'certificates/z1'],
    ['Aushaenge',           'announcements/an1'],
    ['Material',            'inventory/studio-0'],
    ['Schwarzes Brett',     'board/b1'],
    ['Papierkorb',          'trash/tr1'],
    ['Wochensicherungen',   'archives/2026-KW32'],
  ];
  for (const [was, pfad] of leseZiele) {
    await pruefe('KREUZ · Chef von A kann ' + was + ' von B NICHT lesen', () =>
      assertFails(chefA().doc(B_(pfad)).get()));
  }
  await pruefe('KREUZ · Mitarbeiter von A kann den Teamchat von B NICHT lesen', () =>
    assertFails(mitA().doc(B_('channels/allgemein/messages/m1')).get()));
  await pruefe('KREUZ · Chef von A kann den Firmencode von B NICHT lesen', () =>
    assertFails(chefA().doc(B_('config/registrierung')).get()));
  await pruefe('KREUZ · Anonym kann den Teamchat von B NICHT lesen', () =>
    assertFails(alsAnonym().doc(B_('channels/allgemein/messages/m1')).get()));

  // ── Schreiben ── (die haeufigste Halbheit: nur Lesen zu pruefen)
  await pruefe('KREUZ · Chef von A kann bei B KEINE Nachricht schreiben', () =>
    assertFails(chefA().doc(B_('channels/allgemein/messages/neu'))
      .set({ uid: 'chefA', text: 'hallo', ts: Date.now() })));
  await pruefe('KREUZ · Chef von A kann bei B KEINE Aufgabe anlegen', () =>
    assertFails(chefA().doc(B_('studios/studio-0/todos/neu')).set({ title: 'fremd' })));
  await pruefe('KREUZ · Chef von A kann eine Aufgabe von B NICHT loeschen', () =>
    assertFails(chefA().doc(B_('studios/studio-0/todos/t1')).delete()));
  await pruefe('KREUZ · Chef von A kann die Studioliste von B NICHT aendern', () =>
    assertFails(chefA().doc(B_('config/studios'))
      .set({ liste: [{ id: 'studio-0', name: 'gekapert', aktiv: true }], naechste: 1 })));
  await pruefe('KREUZ · Chef von A kann ein Dokument von B NICHT ueberschreiben', () =>
    assertFails(chefA().doc(B_('documents/d1')).set({ name: 'gekapert' })));

  // ── Was ERLAUBT sein muss, sonst ist die Trennung nur eine Sperre ──
  await pruefe('Chef von B kann seinen eigenen Teamchat lesen', () =>
    assertSucceeds(chefB().doc(B_('channels/allgemein/messages/m1')).get()));
  await pruefe('Chef von B kann bei sich eine Aufgabe anlegen', () =>
    assertSucceeds(chefB().doc(B_('studios/studio-0/todos/neu2')).set({ title: 'eigene' })));
  await pruefe('Studioliste von B ist ohne Anmeldung lesbar (Anmeldebildschirm)', () =>
    assertSucceeds(alsAnonym().doc(B_('config/studios')).get()));
  await pruefe('Firmenname von B ist ohne Anmeldung lesbar (Anmeldebildschirm)', () =>
    assertSucceeds(alsAnonym().doc('firmen/' + B).get()));

  /* ── Impressum je Firma, ueber die Firmengrenze ──
     Der Punkt, an dem eine fehlende Firmenpruefung richtig teuer wird:
     wer das Impressum eines fremden Betriebs ueberschreiben kann, setzt
     dort fremde Haftungsangaben hinein. Geprueft wird beides - Lesen
     UND Schreiben; nur Lesen zu pruefen waere die haeufigste Halbheit. */
  await env.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await d.doc('firmen/' + B + '/config/recht')
      .set({ betreiber: 'Studio Mueller GmbH', email: 'kontakt@b.example' });
    await d.doc('users/wartetB').set({ name: 'Wartet B', role: 'mitarbeiter',
                                       firma: B, aktiv: false });
  });
  const wartetB = () => env.authenticatedContext('wartetB').firestore();

  /* LESEN ist hier ausdruecklich erlaubt, auch ueber die Firmengrenze
     und sogar ohne Anmeldung: ein Impressum ist eine oeffentliche
     Pflichtangabe. Es zu verstecken waere kein Datenschutz, sondern ein
     Rechtsverstoss. Beim SCHREIBEN endet die Nachbarschaft. */
  await pruefe('Das Impressum von B ist auch fuer Fremde lesbar (Pflichtangabe)', () =>
    assertSucceeds(chefA().doc(B_('config/recht')).get()));
  await pruefe('Das Impressum von B ist ohne Anmeldung lesbar', () =>
    assertSucceeds(alsAnonym().doc(B_('config/recht')).get()));
  await pruefe('KREUZ · Chef von A kann das Impressum von B NICHT ueberschreiben', () =>
    assertFails(chefA().doc(B_('config/recht')).set({ betreiber: 'gekapert' })));
  await pruefe('KREUZ · Ohne Anmeldung kann das Impressum von B NICHT geaendert werden', () =>
    assertFails(alsAnonym().doc(B_('config/recht')).set({ betreiber: 'gekapert' })));
  await pruefe('Chef von B darf sein eigenes Impressum lesen', () =>
    assertSucceeds(chefB().doc(B_('config/recht')).get()));
  await pruefe('Chef von B darf sein eigenes Impressum pflegen', () =>
    assertSucceeds(chefB().doc(B_('config/recht'))
      .set({ betreiber: 'Studio Mueller GmbH', anschrift: 'Bahnhofstr. 9',
             vertreten: 'Petra Mueller', email: 'kontakt@b.example' })));
  await pruefe('Wer bei B auf Freigabe wartet, darf das Impressum von B lesen', () =>
    assertSucceeds(wartetB().doc(B_('config/recht')).get()));
  await pruefe('Wer bei B auf Freigabe wartet, kann es NICHT aendern', () =>
    assertFails(wartetB().doc(B_('config/recht')).set({ betreiber: 'gekapert' })));

  // ── Die Firma am eigenen Profil ist kein Selbstbedienungsfeld ──
  await pruefe('Niemand kann sich selbst in eine andere Firma schreiben', () =>
    assertFails(mitA().doc('users/mitA').update({ firma: B })));
  await pruefe('Chef von A kann das Konto von Chef B NICHT umschreiben', () =>
    assertFails(chefA().doc('users/chefB').update({ role: 'mitarbeiter' })));

  // ══ Ein Chef setzt keinen anderen Chef ab ══
  //
  // Duerfte jeder Chef jedem anderen die Rechte entziehen, waere ein
  // Streit zwischen Geschaeftsfuehrern ein Wettrennen — wer zuerst
  // drueckt, gewinnt.
  await env.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await d.doc('users/chefA2').set({ name: 'Zweiter Chef A', role: 'chef', firma: A, aktiv: true });
    // Admin ist ein Zusatzfeld, keine Rolle: der Betreiber bleibt Chef
    // seiner eigenen Firma und ist zusaetzlich Admin.
    await d.doc('users/adminX').set({ name: 'Betreiber', role: 'chef', firma: A, admin: true, aktiv: true });
    await d.doc('users/mitA2').set({ name: 'Mit A2', role: 'mitarbeiter', firma: A, aktiv: true });
  });
  const chefA2 = () => env.authenticatedContext('chefA2').firestore();
  const adminX = () => env.authenticatedContext('adminX').firestore();

  await pruefe('CHEF-SCHUTZ · Chef kann einem anderen Chef NICHT die Rechte entziehen', () =>
    assertFails(chefA().doc('users/chefA2').update({ role: 'mitarbeiter' })));
  await pruefe('CHEF-SCHUTZ · Chef kann ein anderes Chef-Konto NICHT loeschen', () =>
    assertFails(chefA().doc('users/chefA2').delete()));
  await pruefe('CHEF-SCHUTZ · Chef kann einen anderen Chef auch nicht stilllegen', () =>
    assertFails(chefA().doc('users/chefA2').update({ aktiv: false })));
  await pruefe('CHEF-SCHUTZ · Chef kann einem anderen Chef nicht die Studios nehmen', () =>
    assertFails(chefA().doc('users/chefA2').update({ studios: [], studioKeys: [] })));

  // Was ERLAUBT bleiben muss, sonst ist der Schutz eine Fessel
  await pruefe('Chef darf weiterhin einen Mitarbeiter verwalten', () =>
    assertSucceeds(chefA().doc('users/mitA2').update({ studios: ['Hürth'] })));
  await pruefe('Chef darf einen Mitarbeiter zum Chef machen', () =>
    assertSucceeds(chefA().doc('users/mitA2').update({ role: 'chef' })));
  await pruefe('Chef darf sein EIGENES Profil weiter aendern', () =>
    assertSucceeds(chefA().doc('users/chefA').update({ name: 'Chef A neu' })));
  await pruefe('Der Admin darf einen Chef herabstufen', () =>
    assertSucceeds(adminX().doc('users/chefA2').update({ role: 'mitarbeiter' })));

  // ══ Das Feld 'admin' ist kein Selbstbedienungsfeld ══
  await pruefe('ADMIN · Ein Chef kann sich NICHT selbst zum Betreiber machen', () =>
    assertFails(chefA().doc('users/chefA').update({ admin: true })));
  await pruefe('ADMIN · Ein Chef kann auch keinen anderen zum Betreiber machen', () =>
    assertFails(chefA().doc('users/mitA').update({ admin: true })));
  await pruefe('ADMIN · Ein Mitarbeiter erst recht nicht', () =>
    assertFails(mitA().doc('users/mitA').update({ admin: true })));
  await pruefe('ADMIN · Der Betreiber bleibt Chef seiner eigenen Firma', () =>
    assertSucceeds(adminX().doc('firmen/' + A + '/documents/neu').set({ name: 'eigenes' })));
  await pruefe('ADMIN · und sieht die Stammdaten einer FREMDEN Firma', () =>
    assertSucceeds(adminX().doc('firmen/' + B).get()));
  await pruefe('ADMIN · aber NICHT deren Inhalte', () =>
    assertFails(adminX().doc('firmen/' + B + '/channels/allgemein/messages/m1').get()));

  // ══ Die Firmen-Stammdaten schreibt nur der Betreiber ══
  await pruefe('FIRMEN · Ein Chef kann seine eigene Firma NICHT freischalten', () =>
    assertFails(chefA().doc('firmen/' + A).update({ aktiv: true })));
  await pruefe('FIRMEN · Ein Chef kann keine neue Firma anlegen', () =>
    assertFails(chefA().doc('firmen/neu-1234').set({ name: 'Meine zweite', aktiv: true })));
  await pruefe('FIRMEN · Ein Chef kann eine fremde Firma nicht sperren', () =>
    assertFails(chefA().doc('firmen/' + B).update({ aktiv: false })));
  await pruefe('FIRMEN · Der Betreiber darf eine Firma sperren', () =>
    assertSucceeds(adminX().doc('firmen/' + B).update({ aktiv: false })));
  await pruefe('FIRMEN · Der Name ist ohne Anmeldung lesbar (Anmeldebildschirm)', () =>
    assertSucceeds(alsAnonym().doc('firmen/' + A).get()));

  /* ══ Eine gesperrte Firma ist wirklich gesperrt ══
       firmaSperren setzt aktiv:false auf das Firmendokument. Sehen Regeln
       und App nicht hinein, ist der Knopf Deko: im Bestaetigungsfenster
       steht „Niemand aus diesem Betrieb kommt danach mehr hinein", und der
       Kunde liest und schreibt weiter wie vorher.

       Ein Knopf, der aussieht, als taete er etwas, ist die unangenehmste
       Sorte Fehler — wer nach einer Kuendigung sperrt, sieht nicht noch
       einmal nach. Deshalb vier Tests. */
  const C = 'firma-c';
  await env.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await d.doc('firmen/' + C).set({ name: 'Firma C', aktiv: true });
    await d.doc('users/chefC').set({ name: 'Chef C', role: 'chef', firma: C, aktiv: true });
    await d.doc('firmen/' + C + '/documents/d1').set({ name: 'Unterlage C' });
  });
  const chefC = () => env.authenticatedContext('chefC').firestore();

  await pruefe('GESPERRT · solange die Firma laeuft, kommt ihr Chef hinein', () =>
    assertSucceeds(chefC().doc('firmen/' + C + '/documents/d1').get()));

  await env.withSecurityRulesDisabled(async ctx => {
    await ctx.firestore().doc('firmen/' + C).update({ aktiv: false });
  });
  await pruefe('GESPERRT · danach kommt er NICHT mehr an seine Unterlagen', () =>
    assertFails(chefC().doc('firmen/' + C + '/documents/d1').get()));
  await pruefe('GESPERRT · und kann auch nichts mehr schreiben', () =>
    assertFails(chefC().doc('firmen/' + C + '/documents/d2').set({ name: 'neu' })));
  await pruefe('GESPERRT · eine ANDERE Firma merkt davon nichts', () =>
    assertSucceeds(chefA().doc('firmen/' + A + '/documents/pruef').set({ name: 'A laeuft' })));

  /* ══ Geloescht heisst: das Firmendokument ist weg ══
     Die Daten darunter bleiben liegen (Elterndokument fehlt, .get()
     sieht sie nicht mehr). Niemand kommt mehr heran — auch nicht der,
     der bis eben Chef war. */
  await env.withSecurityRulesDisabled(async ctx => {
    await ctx.firestore().doc('firmen/' + C).delete();
  });
  await pruefe('GELOESCHT · der bisherige Chef kommt nicht mehr hinein', () =>
    assertFails(chefC().doc('firmen/' + C + '/documents/d1').get()));
  await pruefe('GELOESCHT · und kann auch nichts anlegen', () =>
    assertFails(chefC().doc('firmen/' + C + '/documents/d3').set({ name: 'neu' })));

  /* ══ Das Archiv gehoert dem Betreiber allein ══
     Anders als /firmen ist es NICHT oeffentlich lesbar. Der
     Anmeldebildschirm braucht den Namen einer laufenden Firma; wer
     gekuendigt hat, geht niemanden mehr etwas an. */
  await env.withSecurityRulesDisabled(async ctx => {
    await ctx.firestore().doc('firmenArchiv/' + C)
      .set({ name: 'Firma C', geloeschtAm: Date.now(), zahlKontenBeimLoeschen: 1 });
  });
  await pruefe('ARCHIV · Der Betreiber sieht geloeschte Firmen', () =>
    assertSucceeds(adminX().doc('firmenArchiv/' + C).get()));
  await pruefe('ARCHIV · Ein Chef sieht sie NICHT', () =>
    assertFails(chefA().doc('firmenArchiv/' + C).get()));
  await pruefe('ARCHIV · Ohne Anmeldung erst recht nicht', () =>
    assertFails(alsAnonym().doc('firmenArchiv/' + C).get()));
  await pruefe('ARCHIV · Ein Chef kann sich auch nicht selbst hineinschreiben', () =>
    assertFails(chefA().doc('firmenArchiv/erfunden').set({ name: 'Meins' })));

  /* ══ Der Abo-Zustand (Stufe A) ══
     Er liegt bewusst NICHT im Firmen-Dokument: das ist oeffentlich
     lesbar, weil der Anmeldebildschirm den Firmennamen braucht. Was ein
     Kunde zahlt, geht aber niemanden etwas an — am wenigsten einen
     Wettbewerber, der die Kennung errät.

     Die wichtigste Pruefung ist die dritte: dass KEINE breitere Regel
     darueber liegt. In Firestore gilt jede zutreffende Regel, und eine
     die erlaubt genuegt. Genau diese Falle ist in diesem Projekt schon
     dreimal zugeschnappt. */
  await env.withSecurityRulesDisabled(async ctx => {
    await ctx.firestore().doc('firmen/' + B + '/abo/aktuell')
      .set({ stufe: 'premium', status: 'aktiv', netto: 224 });
    await ctx.firestore().doc('firmen/' + A + '/abo/aktuell')
      .set({ stufe: 'basic', status: 'gratis', netto: 0 });
  });

  await pruefe('ABO · Der Betreiber sieht das Abo einer fremden Firma', () =>
    assertSucceeds(adminX().doc('firmen/' + B + '/abo/aktuell').get()));
  await pruefe('ABO · Ein Chef sieht das Abo SEINER Firma', () =>
    assertSucceeds(chefA().doc('firmen/' + A + '/abo/aktuell').get()));
  await pruefe('ABO · Ein Chef sieht NICHT, was eine andere Firma zahlt', () =>
    assertFails(chefA().doc('firmen/' + B + '/abo/aktuell').get()));
  await pruefe('ABO · Ein Mitarbeiter sieht das Abo gar nicht', () =>
    assertFails(mitA().doc('firmen/' + A + '/abo/aktuell').get()));
  await pruefe('ABO · Ohne Anmeldung erst recht nicht', () =>
    assertFails(alsAnonym().doc('firmen/' + A + '/abo/aktuell').get()));

  await pruefe('ABO · Ein Chef kann sich NICHT selbst auf gratis setzen', () =>
    assertFails(chefA().doc('firmen/' + A + '/abo/aktuell')
      .set({ stufe: 'premium', status: 'gratis', netto: 0 })));
  await pruefe('ABO · … und auch nicht den Preis druecken', () =>
    assertFails(chefA().doc('firmen/' + A + '/abo/aktuell').update({ netto: 1 })));
  await pruefe('ABO · Ein Mitarbeiter schon gar nicht', () =>
    assertFails(mitA().doc('firmen/' + A + '/abo/aktuell').update({ netto: 0 })));
  await pruefe('ABO · Der Betreiber darf setzen', () =>
    assertSucceeds(adminX().doc('firmen/' + B + '/abo/aktuell')
      .set({ stufe: 'basic', status: 'gratis', netto: 0 })));

  /* Und die Gegenrichtung zur breiten Regel: ein erfundener Name unter
     abo/ darf nicht plötzlich jedem offenstehen. */
  await pruefe('ABO · auch ein anderer Name unter abo/ ist geschuetzt', () =>
    assertFails(mitA().doc('firmen/' + A + '/abo/irgendwas').get()));

  /* ══ Stufe B: die Abo-Stufe grenzt wirklich ab ══
     Nachweise sind der eine Riegel, der einer ist — eigene Sammlung,
     also in den Regeln durchsetzbar. Bei der Auswertung ginge das
     nicht: die rechnet aus Daten, die das Team ohnehin sieht.

     Zwei Dinge sind hier wichtiger als das Sperren selbst:
       1. OHNE Abo ist alles offen. Ein Kunde, dem die Haelfte fehlt,
          weil jemand ein Feld nicht ausgefuellt hat, waere der
          schlechtere Fehler.
       2. LESEN bleibt offen, auch auf Basic. Wer auf Basic wechselt,
          soll seine Nachweise noch herausholen koennen. Weggenommen
          wird das Anlegen. */
  const D = 'firma-d';
  await env.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await d.doc('firmen/' + D).set({ name: 'Firma D', aktiv: true });
    await d.doc('users/chefD').set({ name: 'Chef D', role: 'chef', firma: D, aktiv: true });
    await d.doc('firmen/' + D + '/certificates/alt')
      .set({ uid: 'chefD', art: 'ems', bis: '2027-01-01' });
  });
  const chefD = () => env.authenticatedContext('chefD').firestore();

  await pruefe('STUFE · ohne Abo ist alles offen (Nachweis anlegen geht)', () =>
    assertSucceeds(chefD().doc('firmen/' + D + '/certificates/n1')
      .set({ uid: 'chefD', art: 'ersthelfer', bis: '2027-06-01' })));

  await env.withSecurityRulesDisabled(async ctx => {
    await ctx.firestore().doc('firmen/' + D + '/abo/aktuell')
      .set({ stufe: 'basic', status: 'aktiv', netto: 29 });
  });
  await pruefe('STUFE · auf Basic kann er KEINEN Nachweis mehr anlegen', () =>
    assertFails(chefD().doc('firmen/' + D + '/certificates/n2')
      .set({ uid: 'chefD', art: 'trainer', bis: '2027-06-01' })));
  await pruefe('STUFE · … und auch keinen ändern', () =>
    assertFails(chefD().doc('firmen/' + D + '/certificates/alt').update({ bis: '2028-01-01' })));
  /* Der Punkt, an dem eine Preisstufe zum Datenverlust würde. */
  await pruefe('STUFE · aber die vorhandenen LESEN darf er weiterhin', () =>
    assertSucceeds(chefD().doc('firmen/' + D + '/certificates/alt').get()));

  await env.withSecurityRulesDisabled(async ctx => {
    await ctx.firestore().doc('firmen/' + D + '/abo/aktuell').update({ stufe: 'premium' });
  });
  await pruefe('STUFE · mit Premium geht es wieder', () =>
    assertSucceeds(chefD().doc('firmen/' + D + '/certificates/n3')
      .set({ uid: 'chefD', art: 'hygiene', bis: '2027-06-01' })));

  /* Gegenprobe: die Stufe darf nicht plötzlich ANDERE Sammlungen
     sperren. Wer eine Preisstufe einbaut und dabei das Tagesgeschäft
     erwischt, hat einen Kunden verloren, bevor er ihn hatte. */
  await env.withSecurityRulesDisabled(async ctx => {
    await ctx.firestore().doc('firmen/' + D + '/abo/aktuell').update({ stufe: 'basic' });
  });
  await pruefe('STUFE · Basic fasst das Tagesgeschäft NICHT an (Aufgabe anlegen)', () =>
    assertSucceeds(chefD().doc('firmen/' + D + '/studios/studio-0/todos/t9')
      .set({ title: 'Geht auch auf Basic' })));
  await pruefe('STUFE · Basic fasst den Chat NICHT an', () =>
    assertSucceeds(chefD().doc('firmen/' + D + '/channels/allgemein/messages/m9')
      .set({ uid: 'chefD', text: 'Hallo', ts: Date.now() })));

  console.log('\n════ SICHERHEITSREGELN – ausgefuehrt gegen den Emulator ════');
  protokoll.forEach(z => console.log(z));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  await env.cleanup();
  process.exit(gefallen ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
