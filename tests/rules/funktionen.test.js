/* ── Die Cloud Functions, ausgeführt statt behauptet ──────────────────
   Stufe 2E. functions/index.js wird geladen und über .run() ausgelöst,
   so wie Firebase es täte — gegen den Emulator, also ohne Risiko.

   Ein Test, der eine vergessene Umstellung fängt, muss den echten Code
   ausführen: eine Function auf dem alten Pfad sieht man nicht, die App
   läuft weiter, es kommt nur keine Push-Nachricht mehr an.

   Drei Schichten:

     1. VORHER: ohne Firmen-Sammlung läuft alles wie bisher.
     2. AUSLÖSER: jeder Handler hängt an ZWEI Pfaden. Fehlt der zweite,
        merkt es niemand, bis eine Nachricht stumm bleibt.
     3. NACHHER: mit Firmen arbeitet jede Funktion in JEDER Firma — und
        in keiner fremden.

   NICHT GEPRÜFT — bevor „alles grün" jemanden beruhigt:
   Geprüft wird nur, was eine Spur hinterlässt, also geschriebene und
   gelöschte Dokumente. Funktionen, deren einziges Ergebnis eine
   Push-Nachricht oder eine E-Mail ist, hinterlassen keine:
   dueTaskReminder, certExpiry, appointmentMailScheduler und der
   Monatsbericht laufen zwar, aber ob sie das Richtige gefunden haben,
   sieht man hier nicht. Für sie steht nur fest, dass sie über
   alleFirmen() und W(firma) gehen (tests/test-funktionen-pfade.js).

   Ob Push auf einem Gerät ankommt und ob eine Mail zugestellt wird,
   lässt sich hier gar nicht feststellen.
   ───────────────────────────────────────────────────────────────────── */
const path = require('path');

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8791';
/* firmaAnlegen legt ein echtes Anmeldekonto an. Ohne diese Zeile
   versucht das Admin-SDK das gegen die echte Google-API — und
   scheitert an fehlenden Zugangsdaten, was wie ein Fehler in der
   Funktion aussieht und keiner ist. */
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'demo-funktionen';
process.env.GOOGLE_CLOUD_PROJECT = 'demo-funktionen';

const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
const fns = require(path.join(__dirname, '..', '..', 'functions', 'index.js'));
const db = admin.firestore();

let bestanden = 0, gefallen = 0;
const protokoll = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) { bestanden++; protokoll.push('  ✓ ' + name); }
  else { gefallen++; protokoll.push('  ✗ ' + name + (zusatz ? '\n      ' + zusatz : '')); }
}


function pfadVon(fn) {
  const e = fn && (fn.__endpoint || fn.__trigger);
  const r = e && e.eventTrigger &&
    ((e.eventTrigger.eventFilters && e.eventTrigger.eventFilters.resource) ||
     e.eventTrigger.resource);
  return String(r || '').replace(/^.*\/documents\//, '');
}
function artVon(fn) {
  const e = fn && (fn.__endpoint || fn.__trigger);
  const t = e && e.eventTrigger && e.eventTrigger.eventType;
  return String(t || '').split('.').pop();
}

const TAG = 86400000;

(async () => {

  /* ══ 1. VORHER — ohne Firmen läuft alles flach ══
     Das ist kein Randfall: genau so steht die Datenbank im Betrieb, bis
     der Umzug läuft. Wäre die Umstellung hier falsch, hätte ich den
     Papierkorb kaputt gemacht, bevor überhaupt jemand umgezogen ist.

     Die Voraussetzung wird HERGESTELLT und dann NACHGEPRÜFT, nicht
     angenommen: läuft dieser Test hinter umzug.test.js im selben
     Emulator, liegt dort schon eine Firma — und dann prüfte Abschnitt 1
     etwas ganz anderes, als sein Name sagt. Genau so ist er beim ersten
     Lauf rot geworden. Ein Test, der von der Reihenfolge abhängt, misst
     irgendwann das Falsche und niemand merkt es. */
  {
    for (const d of (await db.collection('firmen').get()).docs) await d.ref.delete();
    const rest = (await db.collection('firmen').get()).size;
    pruefe('Ausgangslage: keine Firmen in der Datenbank', rest === 0, rest + ' übrig');

    await db.doc('trash/alt').set({ deletedAt: Date.now() - 40 * TAG, col: 'todos' });
    await db.doc('trash/frisch').set({ deletedAt: Date.now() - 3 * TAG, col: 'todos' });
    await db.doc('studios/studio-0/cleaning/c-alt')
      .set({ done: true, doneAt: Date.now() - 3 * TAG, recurring: false });
    await db.doc('studios/studio-0/cleaning/c-offen').set({ done: false });

    await fns.purgeTrash.run({});
    await fns.purgeOneOffCleaning.run({});

    pruefe('ohne Firmen: alter Papierkorb-Eintrag wird geleert',
      !(await db.doc('trash/alt').get()).exists);
    pruefe('ohne Firmen: frischer Eintrag bleibt',
      (await db.doc('trash/frisch').get()).exists);
    pruefe('ohne Firmen: erledigte Einmal-Putzaufgabe verschwindet',
      !(await db.doc('studios/studio-0/cleaning/c-alt').get()).exists);
    pruefe('ohne Firmen: offene Putzaufgabe bleibt',
      (await db.doc('studios/studio-0/cleaning/c-offen').get()).exists);
  }

  /* ══ 2. AUSLÖSER — jeder Handler hängt an beiden Pfaden ══
     Ein Firestore-Auslöser kann nicht „flach ODER verschachtelt" hören.
     Fehlt der zweite, bleibt nach dem Umschalten jede Meldung aus — und
     zwar ohne Fehler im Protokoll, weil ja nichts ausgelöst wird. Das
     ist der leiseste denkbare Ausfall, also wird er hier nachgezählt. */
  {
    const paare = [
      ['Chat-Nachricht', fns.onNewMessage, fns.onNewMessageF,
        'channels/{channelId}/messages/{msgId}', 'create'],
      ['Aufgabe', fns.onNewTodo, fns.onNewTodoF,
        'studios/{studioKey}/todos/{todoId}', 'create'],
      ['Aushang', fns.onNewAnnouncement, fns.onNewAnnouncementF,
        'announcements/{annId}', 'create'],
      ['Direktnachricht', fns.onNewDm, fns.onNewDmF,
        'dms/{dmId}/messages/{msgId}', 'create'],
      ['Termin angelegt', fns.onAppointmentCreated, fns.onAppointmentCreatedF,
        'appointments/{apptId}', 'create'],
      ['Termin geändert', fns.onAppointmentUpdated, fns.onAppointmentUpdatedF,
        'appointments/{apptId}', 'update'],
    ];
    for (const [name, flach, firma, pfad, art] of paare) {
      pruefe(name + ': alter Pfad', pfadVon(flach) === pfad, pfadVon(flach));
      pruefe(name + ': Firmen-Pfad', pfadVon(firma) === 'firmen/{firma}/' + pfad,
        pfadVon(firma));
      pruefe(name + ': beide auf ' + art,
        artVon(flach) === art && artVon(firma) === art,
        artVon(flach) + ' / ' + artVon(firma));
    }
  }

  /* ══ 3. NACHHER — mit Firmen ══ */
  await db.doc('firmen/alpha').set({ name: 'Alpha', aktiv: true });
  await db.doc('firmen/beta').set({ name: 'Beta', aktiv: true });
  await db.doc('firmen/gesperrt').set({ name: 'Gesperrt', aktiv: false });

  /* ── Papierkorb ──
     Der heikelste Lauf im ganzen Projekt: er LÖSCHT. Zwei Dinge müssen
     stimmen — er muss jede Firma erreichen, und er darf beim Aufräumen
     einer Firma nichts in einer anderen anfassen. Deshalb liegt in
     beiden Firmen ein documentData-Eintrag mit DERSELBEN Kennung: wenn
     der Pfad verrutscht, löscht Alphas Aufräumen Betas Datei, und
     nichts daran sähe nach einem Fehler aus. */
  {
    for (const f of ['alpha', 'beta', 'gesperrt']) {
      await db.doc('firmen/' + f + '/trash/t-alt').set({
        deletedAt: Date.now() - 40 * TAG, col: 'documents',
        orig: 'gemeinsam', data: { kind: 'pdf' }
      });
      await db.doc('firmen/' + f + '/trash/t-frisch')
        .set({ deletedAt: Date.now() - 3 * TAG, col: 'todos' });
      await db.doc('firmen/' + f + '/documentData/gemeinsam').set({ b64: 'xx' });
    }

    await fns.purgeTrash.run({});

    for (const f of ['alpha', 'beta']) {
      pruefe(f + ': alter Eintrag geleert',
        !(await db.doc('firmen/' + f + '/trash/t-alt').get()).exists);
      pruefe(f + ': frischer Eintrag bleibt',
        (await db.doc('firmen/' + f + '/trash/t-frisch').get()).exists);
      pruefe(f + ': eigener Dateiinhalt mit entfernt',
        !(await db.doc('firmen/' + f + '/documentData/gemeinsam').get()).exists);
    }
    /* Gesperrt heisst stillgelegt: dort wird nicht gearbeitet, auch nicht
       aufgeräumt. Sonst liefe der Betrieb einer gekündigten Firma still
       weiter — und beim Löschen ist „lieber nichts tun" die richtige
       Vorgabe. */
    pruefe('gesperrte Firma wird nicht angefasst',
      (await db.doc('firmen/gesperrt/trash/t-alt').get()).exists);
    pruefe('gesperrte Firma: Dateiinhalt unberührt',
      (await db.doc('firmen/gesperrt/documentData/gemeinsam').get()).exists);
    /* Die flachen Daten sind nach dem Umzug die Kopie für den Rückweg.
       Würde der Papierkorb sie weiter leeren, verlöre der Rückweg mit
       jedem Tag ein Stück — genau dann, wenn man ihn braucht. */
    pruefe('flache Alt-Daten bleiben nach dem Umzug liegen',
      (await db.doc('trash/frisch').get()).exists);
  }

  /* ── Putzplan ── */
  {
    for (const f of ['alpha', 'beta', 'gesperrt']) {
      await db.doc('firmen/' + f + '/studios/studio-0/cleaning/c-alt')
        .set({ done: true, doneAt: Date.now() - 3 * TAG, recurring: false });
      await db.doc('firmen/' + f + '/studios/studio-0/cleaning/c-wieder')
        .set({ done: true, doneAt: Date.now() - 3 * TAG, recurring: true });
      await db.doc('firmen/' + f + '/studios/studio-0/cleaning/c-offen')
        .set({ done: false });
    }

    await fns.purgeOneOffCleaning.run({});

    for (const f of ['alpha', 'beta']) {
      pruefe(f + ': erledigte Einmal-Aufgabe verschwindet',
        !(await db.doc('firmen/' + f + '/studios/studio-0/cleaning/c-alt').get()).exists);
      pruefe(f + ': wiederkehrende bleibt',
        (await db.doc('firmen/' + f + '/studios/studio-0/cleaning/c-wieder').get()).exists);
      pruefe(f + ': offene bleibt',
        (await db.doc('firmen/' + f + '/studios/studio-0/cleaning/c-offen').get()).exists);
    }
    pruefe('Putzplan: gesperrte Firma wird nicht angefasst',
      (await db.doc('firmen/gesperrt/studios/studio-0/cleaning/c-alt').get()).exists);
  }

  /* ── Geburtstagsgruß landet im Chat der EIGENEN Firma ──
     Hier steht die Firma nicht im Pfad des Auslösers, sondern IM PROFIL
     — users bleibt oben. Genau solche Stellen rutschen durch: der Code
     sieht flach aus und ist es nicht. Der Gruß an eine Person aus Beta
     darf nicht in Alphas Chatverlauf auftauchen. */
  {
    const heute = new Date();
    const bday = '1990-' + String(heute.getMonth() + 1).padStart(2, '0') +
      '-' + String(heute.getDate()).padStart(2, '0');
    await db.doc('users/u-alpha').set({ name: 'Anna', firma: 'alpha', bday: bday });
    await db.doc('users/u-beta').set({ name: 'Bea', firma: 'beta', bday: bday });
    await db.doc('users/u-gesperrt').set({ name: 'Gerd', firma: 'gesperrt', bday: bday });
    await db.doc('users/u-ohne').set({ name: 'Ohne', bday: bday });

    await fns.birthdayGreetings.run({});

    const dm = (f, uid) => 'firmen/' + f + '/dms/dm_' +
      ['system', uid].sort().join('_');
    pruefe('Geburtstag: Gruß liegt bei alpha',
      (await db.doc(dm('alpha', 'u-alpha')).get()).exists);
    pruefe('Geburtstag: Gruß liegt bei beta',
      (await db.doc(dm('beta', 'u-beta')).get()).exists);
    pruefe('Geburtstag: Annas Gruß NICHT bei beta',
      !(await db.doc(dm('beta', 'u-alpha')).get()).exists);
    pruefe('Geburtstag: Beas Gruß NICHT bei alpha',
      !(await db.doc(dm('alpha', 'u-beta')).get()).exists);

    /* ── Der NAME im Gruß ──
       Steht der Firmenname fest im Code, geht der Gruß an die
       Mitarbeiter eines Kunden im Namen eines fremden Betriebs.
       Geprüft wird deshalb der Text selbst: „liegt am richtigen Ort"
       und „trägt den richtigen Namen" sind zwei verschiedene
       Aussagen. */
    const grussText = async (f, uid) => {
      const q = await db.collection(dm(f, uid) + '/messages').get();
      return q.empty ? '' : String((q.docs[0].data() || {}).text || '');
    };
    const tA = await grussText('alpha', 'u-alpha');
    const tB = await grussText('beta', 'u-beta');
    pruefe('Geburtstag: Annas Gruß nennt Alpha', tA.indexOf('Alpha') >= 0);
    pruefe('Geburtstag: Beas Gruß nennt Beta', tB.indexOf('Beta') >= 0);
    /* Die Gegenrichtung — ohne sie wäre auch ein Gruß grün, der beide
       Namen nennt oder gar keinen. */
    pruefe('Geburtstag: Annas Gruß nennt NICHT Beta', tA.indexOf('Beta') < 0);
    pruefe('Geburtstag: kein fester Firmenname mehr im Gruß',
      tA.indexOf('Körperformen') < 0 && tB.indexOf('Körperformen') < 0);
    /* Ein Profil ohne Feld "firma" gehört zur Voreinstellung. Nach dem
       Umzug gibt es die als Firma koerperformen — hier im Test nicht,
       also darf für diese Person NICHTS geschrieben werden statt
       irgendwo. */
    pruefe('Geburtstag: gesperrte Firma bekommt nichts',
      !(await db.doc(dm('gesperrt', 'u-gesperrt')).get()).exists);
    pruefe('Geburtstag: unbekannte Firma landet nicht flach',
      !(await db.doc('dms/dm_' + ['system', 'u-ohne'].sort().join('_')).get()).exists);
    pruefe('Geburtstag: nichts landet flach',
      !(await db.doc('dms/dm_' + ['system', 'u-alpha'].sort().join('_')).get()).exists);
  }

  /* ── Die KI-Kostenbremse zählt bei der eigenen Firma ──
     Der dritte Weg, auf dem eine Firma bestimmt wird: nicht aus dem Pfad
     (Auslöser) und nicht aus der Schleife (Zeitplan), sondern aus dem
     Profil des Anrufers — firmaVonProfil().

     Der Aufruf scheitert hier absichtlich: ohne GEMINI_API_KEY bricht
     marketingChat ab. Aber ERST danach — gezählt wird vorher. Genau das
     macht ihn prüfbar, ohne je Gemini anzufassen: übrig bleibt der
     Zählerstand, und der muss bei der richtigen Firma stehen.

     Warum das zählt: ein gemeinsamer Zähler würde bedeuten, dass der
     übermütige Nachmittag des einen Kunden den nächsten aussperrt. */
  {
    const heute = new Date().toISOString().slice(0, 10);
    await db.doc('users/chef-alpha')
      .set({ name: 'Chef A', role: 'chef', firma: 'alpha' });
    await db.doc('users/chef-gesperrt')
      .set({ name: 'Chef G', role: 'chef', firma: 'gesperrt' });

    let fehler = null;
    try {
      await fns.marketingChat.run(
        { messages: [{ role: 'user', content: 'Hallo' }] },
        { auth: { uid: 'chef-alpha' } });
    } catch (e) { fehler = e; }

    const zaehler = await db.doc('firmen/alpha/config/nutzung-' + heute).get();
    pruefe('KI-Grenze: zählt bei der eigenen Firma',
      zaehler.exists && (zaehler.data() || {}).marketingChat === 1,
      zaehler.exists ? JSON.stringify(zaehler.data()) : 'kein Zählerstand');
    pruefe('KI-Grenze: zählt nicht flach',
      !(await db.doc('config/nutzung-' + heute).get()).exists);
    pruefe('KI-Grenze: zählt nicht bei beta',
      !(await db.doc('firmen/beta/config/nutzung-' + heute).get()).exists);
    pruefe('KI-Grenze: der Aufruf scheitert danach am fehlenden Schlüssel',
      !!fehler, fehler ? '' : 'kein Fehler — läuft hier etwa gegen echtes Gemini?');

    /* Eine gesperrte Firma darf nicht auf die flachen Pfade zurückfallen.
       Ein stiller Rückfall wäre schlimmer als eine Fehlermeldung: dort
       liegen die Daten der Voreinstellung. */
    let fehler2 = null;
    try {
      await fns.marketingChat.run(
        { messages: [{ role: 'user', content: 'Hallo' }] },
        { auth: { uid: 'chef-gesperrt' } });
    } catch (e) { fehler2 = e; }
    pruefe('KI-Grenze: gesperrte Firma wird abgewiesen',
      !!fehler2 && /stillgelegt/.test(String(fehler2.message || '')),
      fehler2 ? String(fehler2.message) : 'kein Fehler');
    pruefe('KI-Grenze: gesperrte Firma zählt nirgends',
      !(await db.doc('firmen/gesperrt/config/nutzung-' + heute).get()).exists &&
      !(await db.doc('config/nutzung-' + heute).get()).exists);
  }

  /* ── Firma anlegen: die Studioliste MUSS dabei entstehen ──
     Ohne sie fällt die App auf KONFIG.studios zurück, und ein neuer
     Kunde sähe beim ersten Anmelden die vierzehn Standorte von
     Körperformen. Kein Datenleck im engeren Sinn — aber es beendet
     jedes Verkaufsgespräch. */
  {
    await db.doc('users/betreiber').set({ name: 'Betreiber', role: 'chef',
      firma: 'alpha', admin: true });

    let kennung = null, fehler = null;
    try {
      const r = await fns.firmaAnlegen.run(
        { name: 'Studio Müller GmbH', email: 'chef-' + Date.now() + '@mueller.example',
          studios: 3 },
        { auth: { uid: 'betreiber' } });
      kennung = r && r.kennung;
    } catch (e) { fehler = e; }

    pruefe('Firma anlegen: geht durch', !!kennung,
      fehler ? String(fehler.message) : 'keine Kennung zurückbekommen');

    if (kennung) {
      const st = await db.doc('firmen/' + kennung + '/config/studios').get();
      const liste = st.exists ? (st.data().liste || []) : [];
      pruefe('Firma anlegen: die Studioliste liegt gleich mit da', st.exists);
      pruefe('Firma anlegen: genau so viele Studios wie bestellt', liste.length === 3,
        liste.length + ' statt 3');
      pruefe('Firma anlegen: neutrale Namen, keine fremden Standorte',
        liste.every(s => /^Studio \d+$/.test(s.name || '')),
        JSON.stringify(liste.map(s => s.name)));
      pruefe('Firma anlegen: Kennungen ab studio-0 durchgezählt',
        liste.map(s => s.id).join(',') === 'studio-0,studio-1,studio-2',
        liste.map(s => s.id).join(','));

      /* ── Löschen: der Papierkorb, nicht der Ofen ── */
      await fns.firmaLoeschen.run({ kennung: kennung }, { auth: { uid: 'betreiber' } });
      pruefe('Löschen: die Firma ist aus der Liste verschwunden',
        !(await db.doc('firmen/' + kennung).get()).exists);
      pruefe('Löschen: sie steht im Archiv',
        (await db.doc('firmenArchiv/' + kennung).get()).exists);
      /* Der eigentliche Punkt: die DATEN sind noch da. Sonst wäre es
         kein Papierkorb, sondern eine Löschtaste mit Zwischenschritt. */
      pruefe('Löschen: die Daten liegen unangetastet darunter',
        (await db.doc('firmen/' + kennung + '/config/studios').get()).exists);
      /* Und die Zeitpläne lassen sie in Ruhe — genau die Eigenschaft,
         die am 10.8. im Emulator gemessen wurde: .get() sieht
         Dokumente ohne Elterneintrag nicht. */
      const nachLoeschen = await db.collection('firmen').get();
      pruefe('Löschen: die Zeitpläne übergehen sie',
        !nachLoeschen.docs.some(d => d.id === kennung),
        nachLoeschen.docs.map(d => d.id).join(','));

      /* ── Zurückholen ── */
      await fns.firmaZurueckholen.run({ kennung: kennung }, { auth: { uid: 'betreiber' } });
      const zurueck = await db.doc('firmen/' + kennung).get();
      pruefe('Zurückholen: die Firma ist wieder da', zurueck.exists);
      pruefe('Zurückholen: und läuft wieder',
        zurueck.exists && (zurueck.data() || {}).aktiv === true);
      pruefe('Zurückholen: das Archiv ist leer',
        !(await db.doc('firmenArchiv/' + kennung).get()).exists);
      pruefe('Zurückholen: die Studioliste steht noch',
        (await db.doc('firmen/' + kennung + '/config/studios').get()).exists);

      // aufräumen, damit die Gegenprobe unten sauber zählt
      await db.doc('firmen/' + kennung).delete();
    }

    /* ── Die eigene Firma bleibt tabu ──
       Sonst löscht sich der Betreiber selbst heraus, und es gibt
       niemanden mehr, der ihn zurückholt. */
    let selbst = null;
    try {
      await fns.firmaLoeschen.run({ kennung: 'alpha' }, { auth: { uid: 'betreiber' } });
    } catch (e) { selbst = e; }
    pruefe('Löschen: die EIGENE Firma geht nicht', !!selbst,
      'sie wurde gelöscht — der Betreiber hätte sich selbst ausgesperrt');
    pruefe('Löschen: alpha steht noch', (await db.doc('firmen/alpha').get()).exists);

    /* ── Und niemand ausser dem Betreiber ── */
    await db.doc('users/nurchef').set({ name: 'Nur Chef', role: 'chef', firma: 'beta' });
    let fremd = null;
    try {
      await fns.firmaLoeschen.run({ kennung: 'alpha' }, { auth: { uid: 'nurchef' } });
    } catch (e) { fremd = e; }
    pruefe('Löschen: ein Chef ohne admin darf nicht', !!fremd);
  }

  /* ── Abo festlegen (Stufe A) ──
     Kein Geld im Spiel, es sperrt nichts. Trotzdem geprüft, weil hier
     Zahlen stehen, die später Rechnungen werden. */
  {
    const holen = () => db.doc('firmen/beta/abo/aktuell').get();

    await fns.aboSetzen.run(
      { kennung:'beta', stufe:'premium', status:'aktiv', netto:224, notiz:'Absprache' },
      { auth:{ uid:'betreiber' } });
    let a = (await holen()).data() || {};
    pruefe('Abo: Stufe und Preis kommen an',
      a.stufe === 'premium' && a.netto === 224, JSON.stringify(a));
    pruefe('Abo: unbefristet, wenn kein Datum gesetzt ist', a.bisAm === null, String(a.bisAm));
    pruefe('Abo: es steht drin, wer es gesetzt hat', a.gesetztVon === 'betreiber');

    /* Der Punkt, an dem später jemand Geld verlieren könnte: ein
       Gratis-Abo mit hinterlegtem Betrag. Sobald etwas abrechnet, was
       den Betrag liest, bekommt der Chef eine Rechnung, die ihm nie
       jemand angekündigt hat. Der Server muss das erzwingen — die
       Oberfläche blendet das Feld zwar aus, aber die Oberfläche ist
       keine Grenze. */
    await fns.aboSetzen.run(
      { kennung:'beta', stufe:'premium', status:'gratis', netto:224 },
      { auth:{ uid:'betreiber' } });
    a = (await holen()).data() || {};
    pruefe('Abo: gratis heisst wirklich 0 €, auch wenn ein Betrag mitkommt',
      a.status === 'gratis' && a.netto === 0, JSON.stringify(a));

    /* Ein befristetes Gratis-Abo — der Fall „mein Chef bekommt es
       kostenlos, aber ich will es einmal im Jahr ansehen". */
    const bis = Date.now() + 200 * 86400000;
    await fns.aboSetzen.run(
      { kennung:'beta', stufe:'premium', status:'gratis', bisAm:bis },
      { auth:{ uid:'betreiber' } });
    a = (await holen()).data() || {};
    pruefe('Abo: Befristung wird übernommen', a.bisAm === bis, String(a.bisAm));

    // ── Was NICHT gehen darf ──
    const faellt = async (daten, uid) => {
      try { await fns.aboSetzen.run(daten, { auth:{ uid: uid || 'betreiber' } }); return false; }
      catch (e) { return true; }
    };
    pruefe('Abo: erfundene Stufe wird abgewiesen',
      await faellt({ kennung:'beta', stufe:'unbegrenzt', status:'aktiv' }));
    pruefe('Abo: erfundener Zustand wird abgewiesen',
      await faellt({ kennung:'beta', stufe:'basic', status:'geschenkt' }));
    pruefe('Abo: unbekannte Firma wird abgewiesen',
      await faellt({ kennung:'gibtesnicht', stufe:'basic', status:'aktiv' }));
    pruefe('Abo: ein Chef ohne admin darf nicht',
      await faellt({ kennung:'beta', stufe:'basic', status:'gratis' }, 'nurchef'));

    /* Negative Preise: kein Angriff, aber ein Tippfehler, der später
       eine Gutschrift auslösen könnte. */
    await fns.aboSetzen.run(
      { kennung:'beta', stufe:'basic', status:'aktiv', netto:-50 },
      { auth:{ uid:'betreiber' } });
    a = (await holen()).data() || {};
    pruefe('Abo: negativer Preis wird zu 0, nicht zu -50', a.netto === 0, String(a.netto));
  }

  /* ── Google-Tabelle: was den Browser verlässt und was ankommt ──
     Bis 13.8. hat der Browser direkt an die Apps-Script-Web-App
     gesendet, deren Adresse in konfig.js stand. Jetzt geht der Weg über
     sheetsPush. Geprüft wird deshalb genau das, was diese Function
     ausmacht: sie lässt niemanden durch, der nicht angemeldet und
     freigeschaltet ist, sie legt das Token dazu, und sie übernimmt die
     Nutzlast nicht, sondern baut sie neu auf.

     Die Web-App wird dabei nicht angefasst: fetch wird ersetzt und die
     Sendung abgefangen. */
  {
    const echterFetch = global.fetch;
    let gesendet = null;
    global.fetch = async (url, opt) => {
      gesendet = { url: url, body: JSON.parse((opt && opt.body) || '{}') };
      return { ok: true, status: 200, text: async () => 'ok 1 Studio(s), 2 Zeilen' };
    };
    process.env.SHEETS_URL = 'https://beispiel.invalid/exec';
    process.env.SHEETS_TOKEN = 'token-nur-auf-dem-server';
    process.env.SHEETS_FIRMA = 'alpha';

    await db.doc('users/mit-alpha')
      .set({ name: 'Mit A', role: 'mitarbeiter', firma: 'alpha', aktiv: true });
    await db.doc('users/wart-alpha')
      .set({ name: 'Wartend', role: 'mitarbeiter', firma: 'alpha', aktiv: false });
    await db.doc('users/chef-beta')
      .set({ name: 'Chef B', role: 'chef', firma: 'beta', aktiv: true });

    const faellt = async (daten, ctx) => {
      try { await fns.sheetsPush.run(daten, ctx); return false; }
      catch (e) { return true; }
    };
    const material = {
      art: 'material',
      studios: [{
        studio: 'Longerich', studioKey: 'studio-0',
        /* Was ein Angreifer mitschicken würde: einen fremden Absender,
           einen Zeitstempel und ein Feld, das es gar nicht gibt. */
        updatedBy: 'Der Chef', ts: 1,
        items: [
          { name: 'Handtücher', have: '4', need: 2, geheim: 'x' },
          { name: 'Kabel', have: -5, need: 'viele' }
        ]
      }]
    };

    pruefe('Tabelle: ohne Anmeldung geht nichts',
      await faellt(material, {}));
    pruefe('Tabelle: ein Konto ohne Freigabe darf nicht senden',
      await faellt(material, { auth: { uid: 'wart-alpha' } }));
    pruefe('Tabelle: unbekannte Art wird abgewiesen',
      await faellt({ art: 'rechnungen', studios: [{ studio: 'X' }] },
        { auth: { uid: 'mit-alpha' } }));
    pruefe('Tabelle: bis hierher wurde nichts gesendet', gesendet === null);

    const r = await fns.sheetsPush.run(material, { auth: { uid: 'mit-alpha' } });
    pruefe('Tabelle: der Abgleich läuft durch', !!(r && r.ok), JSON.stringify(r));
    pruefe('Tabelle: die Sendung geht an die Adresse aus der Umgebung',
      gesendet && gesendet.url === 'https://beispiel.invalid/exec',
      gesendet ? gesendet.url : 'nichts gesendet');
    pruefe('Tabelle: das Token liegt bei',
      gesendet && gesendet.body.token === 'token-nur-auf-dem-server');
    pruefe('Tabelle: als Sammelform (ersetzt nur die genannten Studios)',
      gesendet && gesendet.body.type === 'material-alle',
      gesendet ? String(gesendet.body.type) : '');

    const s0 = gesendet && gesendet.body.studios && gesendet.body.studios[0];
    pruefe('Tabelle: der Absender kommt aus dem Profil, nicht aus der Sendung',
      s0 && s0.updatedBy === 'Mit A', s0 ? String(s0.updatedBy) : '');
    pruefe('Tabelle: der Zeitstempel wird auf dem Server gesetzt',
      s0 && s0.ts > 1600000000000, s0 ? String(s0.ts) : '');
    pruefe('Tabelle: Zahlen kommen als Zahlen an, negative als 0',
      s0 && s0.items[0].have === 4 && s0.items[1].have === 0 && s0.items[1].need === 0,
      s0 ? JSON.stringify(s0.items) : '');
    pruefe('Tabelle: erfundene Felder fallen weg',
      s0 && s0.items[0].geheim === undefined);

    /* Zwei Kunden, eine Tabelle: ohne diese Grenze schriebe der zweite
       Kunde seine Studios in die Tabelle des ersten. */
    gesendet = null;
    const fremd = await fns.sheetsPush.run(
      { art: 'material', studios: [{ studio: 'Fremd', studioKey: 'studio-0', items: [] }] },
      { auth: { uid: 'chef-beta' } });
    pruefe('Tabelle: eine fremde Firma bekommt keine Verbindung',
      fremd && fremd.ok === false && fremd.grund === 'keine-tabelle',
      JSON.stringify(fremd));
    pruefe('Tabelle: und es wird auch nichts gesendet', gesendet === null);

    /* Wie bei den KI-Aufrufen: die Kostenbremse zählt je Firma. Hier
       geht es um das Tageskontingent von Apps Script. */
    const heute = new Date().toISOString().slice(0, 10);
    const z = (await db.doc('firmen/alpha/config/nutzung-' + heute).get()).data() || {};
    pruefe('Tabelle: der Abgleich wird bei der eigenen Firma gezählt',
      z.sheetsPush === 1, JSON.stringify(z));

    /* Antwortet die Web-App mit einer Fehlerzeile, ist der Aufruf
       fehlgeschlagen — auch wenn HTTP 200 danebensteht. Apps Script
       schickt eigene Fehler mit 200. */
    global.fetch = async () => ({ ok: true, status: 200, text: async () => 'Fehler: Token' });
    pruefe('Tabelle: „Fehler: Token" gilt als Fehlschlag, nicht als Erfolg',
      await faellt(material, { auth: { uid: 'mit-alpha' } }));

    global.fetch = echterFetch;
    delete process.env.SHEETS_URL;
    delete process.env.SHEETS_TOKEN;
    delete process.env.SHEETS_FIRMA;
  }

  /* ══ 4. Der Test, der rot werden muss ══
     Ein Prüfer, der nie anschlägt, prüft nichts. Also wird hier
     absichtlich eine Firma vorgetäuscht, die es nicht gibt, und
     nachgesehen, ob die Prüfungen oben das überhaupt bemerken würden. */
  {
    const vorher = gefallen;
    pruefe('(Gegenprobe) erfundene Firma hat keinen Papierkorb',
      (await db.doc('firmen/gibtesnicht/trash/t-alt').get()).exists);
    const hatAngeschlagen = gefallen === vorher + 1;
    gefallen = vorher;                       // die Gegenprobe zählt nicht mit
    protokoll.pop();
    pruefe('Gegenprobe: eine falsche Behauptung wird rot',
      hatAngeschlagen);
  }

  console.log('\n══ Cloud Functions gegen den Emulator ══');
  protokoll.forEach(z => console.log(z));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  if (gefallen) {
    console.log('\n✗ Die Functions arbeiten nicht auf den Pfaden, auf denen sie sollen.');
    process.exit(1);
  }
  console.log('\n✓ Jede geprüfte Funktion erreicht jede Firma — und keine fremde.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
