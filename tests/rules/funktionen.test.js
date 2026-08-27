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
   Geprüft wird, was eine Spur hinterlässt: geschriebene und gelöschte
   Dokumente — und seit dem 19.8. auch das, was eine Funktion
   ZURÜCKGIBT. dueTaskReminder, certExpiry und appointmentMailScheduler
   enden in einer Push-Nachricht oder einer Mail und hinterlassen
   nichts; für sie steht nur fest, dass sie über alleFirmen() und
   W(firma) gehen (tests/test-funktionen-pfade.js).

   Der Bericht stand bis dahin in derselben Liste, und das war zu
   pauschal: nicht prüfbar ist nur der VERSAND. Die ZAHLEN kommen aus
   collectMonthly(), das aus der Datenbank liest und ein Objekt
   zurückgibt — nachzählbar. Beim ersten Anlauf sind dabei drei
   Ungenauigkeiten herausgefallen, darunter ein verdeckter Funktionsname,
   der das Ergebnis still halbiert hat. Ein Jahr lang hätte niemand
   gemerkt, dass „0 offen" ein Fehler war und keine gute Nachricht.

   Ob Push auf einem Gerät ankommt und ob eine Mail zugestellt wird,
   lässt sich hier weiterhin nicht feststellen.
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

    /* ══ Zugang entfernen ══
       Gemeldet: „eine schon benutzte und wieder geloeschte E-Mail laesst
       sich nicht noch einmal verwenden." Grund war, dass „Zugang
       entfernen" nur das Profil loeschte und das ANMELDEKONTO stehen
       liess — damit blieb die Adresse belegt.

       Geprueft wird deshalb genau das, worauf es ankommt: ist die
       Adresse hinterher wieder frei? */
    {
      const auth = admin.auth();
      const mail = 'weg-' + Date.now() + '@beispiel.test';
      await db.doc('users/chefAlpha').set({ name: 'Chef', role: 'chef', firma: 'alpha' });

      const konto = await auth.createUser({ email: mail, password: 'geheim123' });
      await db.doc('users/' + konto.uid).set({ name: 'Geht wieder', role: 'mitarbeiter',
        firma: 'alpha', email: mail });

      await fns.zugangEntfernen.run({ uid: konto.uid }, { auth: { uid: 'chefAlpha' } });

      pruefe('Zugang entfernen: das Profil ist weg',
        !(await db.doc('users/' + konto.uid).get()).exists);

      let nochDa = true;
      try { await auth.getUserByEmail(mail); } catch (e) { nochDa = false; }
      pruefe('Zugang entfernen: das ANMELDEKONTO ist auch weg — das war der Fehler',
        nochDa === false, 'die Adresse waere weiter belegt');

      /* Der eigentliche Beweis: dieselbe Adresse noch einmal benutzen. */
      let wieder = null;
      try { wieder = await auth.createUser({ email: mail, password: 'geheim456' }); }
      catch (e) { wieder = null; }
      pruefe('Zugang entfernen: dieselbe E-Mail laesst sich wieder verwenden', !!wieder);
      if (wieder) await auth.deleteUser(wieder.uid);

      /* ── Gegenproben. Ohne sie waere „loescht Konten" auch dann gruen,
         wenn es JEDES Konto loescht, egal von wem und aus welcher Firma. ── */
      const fremd = await auth.createUser({
        email: 'fremd-' + Date.now() + '@beispiel.test', password: 'geheim123' });
      await db.doc('users/' + fremd.uid).set({ name: 'Bei Beta', role: 'mitarbeiter',
        firma: 'beta' });
      let abgewiesen = false;
      try { await fns.zugangEntfernen.run({ uid: fremd.uid }, { auth: { uid: 'chefAlpha' } }); }
      catch (e) { abgewiesen = true; }
      pruefe('GEGENPROBE Chef von Alpha entfernt KEINEN Zugang bei Beta', abgewiesen);
      pruefe('GEGENPROBE dessen Profil steht noch',
        (await db.doc('users/' + fremd.uid).get()).exists);
      await auth.deleteUser(fremd.uid);

      await db.doc('users/mitAlpha').set({ name: 'Mitarbeiter', role: 'mitarbeiter',
        firma: 'alpha' });
      let alsMit = false;
      try { await fns.zugangEntfernen.run({ uid: 'chefAlpha' }, { auth: { uid: 'mitAlpha' } }); }
      catch (e) { alsMit = true; }
      pruefe('GEGENPROBE ein Mitarbeiter entfernt gar nichts', alsMit);

      let selbst = false;
      try { await fns.zugangEntfernen.run({ uid: 'chefAlpha' }, { auth: { uid: 'chefAlpha' } }); }
      catch (e) { selbst = true; }
      pruefe('GEGENPROBE der Chef entfernt sich nicht selbst', selbst);

      /* ══ Der ALTE Fall: ein Konto ohne Profil ══
         Genau das hat die frühere Fassung hinterlassen. Diese Adressen
         sind bis heute belegt, und die Person steht in keiner Liste —
         es gab also keinen Weg, sie freizubekommen. */
      const alt = 'verwaist-' + Date.now() + '@beispiel.test';
      const waise = await auth.createUser({ email: alt, password: 'geheim123' });
      // kein Profil: genau der zurueckgebliebene Zustand
      await fns.adresseFreigeben.run({ email: alt }, { auth: { uid: 'chefAlpha' } });
      let nochWaise = true;
      try { await auth.getUserByEmail(alt); } catch (e) { nochWaise = false; }
      pruefe('Adresse freigeben: das verwaiste Konto ist weg', nochWaise === false);

      let neuMoeglich = null;
      try { neuMoeglich = await auth.createUser({ email: alt, password: 'geheim456' }); }
      catch (e) { neuMoeglich = null; }
      pruefe('Adresse freigeben: die Adresse ist wieder benutzbar', !!neuMoeglich);
      if (neuMoeglich) await auth.deleteUser(neuMoeglich.uid);

      /* Gegenprobe: eine Adresse, hinter der noch eine AKTIVE Person
         steht, darf so nicht verschwinden — dafuer gibt es die
         Team-Liste mit Rückfrage. */
      const aktivMail = 'aktiv-' + Date.now() + '@beispiel.test';
      const aktiv = await auth.createUser({ email: aktivMail, password: 'geheim123' });
      await db.doc('users/' + aktiv.uid).set({ name: 'Arbeitet noch',
        role: 'mitarbeiter', firma: 'alpha' });
      let geschuetzt = false;
      try { await fns.adresseFreigeben.run({ email: aktivMail }, { auth: { uid: 'chefAlpha' } }); }
      catch (e) { geschuetzt = true; }
      pruefe('GEGENPROBE eine Adresse mit aktivem Zugang wird NICHT freigegeben', geschuetzt);
      let stehtNoch = true;
      try { await auth.getUserByEmail(aktivMail); } catch (e) { stehtNoch = false; }
      pruefe('GEGENPROBE deren Anmeldekonto steht noch', stehtNoch);
      await auth.deleteUser(aktiv.uid);
      if (waise && waise.uid) { try { await auth.deleteUser(waise.uid); } catch (e) {} }
    }

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

  /* ── „Das Studio ist durch" ──
     Der Auslöser feuert bei JEDEM Haken. Ohne Gedächtnis käme bei jedem
     eine Mail. Geprüft wird deshalb der Merker, nicht die Mail: ob eine
     Mail wirklich zugestellt wird, lässt sich hier ohnehin nicht sehen
     (kein SMTP im Durchlauf).

     Der Merker ist die eigentliche Logik — er entscheidet, ob überhaupt
     gesendet wird. */
  {
    /* Eigenes Studio, nicht studio-0: dort liegen Reste aus den
       Abschnitten davor (Papierkorb, Einmal-Putzaufgaben). Das Studio
       wäre nie leer, und der Merker käme nie auf fertig — beim ersten
       Anlauf sah das nach einem Fehler in der Function aus und war
       einer im Testaufbau. */
    const sk = 'studio-fertig';
    const merker = () => db.doc('firmen/alpha/config/fertig-' + sk).get();
    const todo = (id) => db.doc('firmen/alpha/studios/' + sk + '/todos/' + id);
    const putz = (id) => db.doc('firmen/alpha/studios/' + sk + '/cleaning/' + id);
    /* Der Auslöser bekommt Pfad-Parameter mit; .run() erwartet sie so,
       wie Firebase sie liefert.

       before/after tragen jetzt auch data(). Vorher stand hier nur
       exists, und das war eine Attrappe, die weniger konnte als die
       Wirklichkeit: seit der Auslöser den EINZELNEN Haken erkennt
       (Push „X hat Y erledigt"), liest er die Daten des Dokuments. Ein
       Aufruf ohne data() hätte hier eine Ausnahme geworfen — und der
       Fehler wäre einer im Testaufbau gewesen, nicht im Code. */
    const lauf = async (art, daten) => {
      const leer = { exists: false, data: () => undefined };
      const voll = (d) => ({ exists: true, data: () => (d || {}) });
      await fns.onTodoFertigF.run({
        before: art === 'neu' ? leer : voll(daten && daten.vor),
        after:  art === 'weg' ? leer : voll(daten && daten.nach),
      }, { params: { firma: 'alpha', studioKey: sk, todoId: 'x' } });
    };

    await db.doc('firmen/alpha/config/features').set({ todos: true, putzplan: true });
    await todo('a1').set({ title: 'Offen', done: false });
    await putz('p1').set({ title: 'Wischen', done: false });
    await lauf('neu');
    let m = await merker();
    pruefe('fertig: mit offenen Punkten steht der Merker auf nicht fertig',
      m.exists && (m.data() || {}).fertig === false,
      m.exists ? JSON.stringify(m.data()) : 'kein Merker');

    await todo('a1').update({ done: true, doneAt: Date.now() });
    await lauf('haken');
    m = await merker();
    pruefe('fertig: ein offener Putzpunkt reicht, dass es NICHT fertig ist',
      (m.data() || {}).fertig === false, JSON.stringify(m.data()));

    await putz('p1').update({ done: true, doneAt: Date.now() });
    await lauf('haken');
    m = await merker();
    pruefe('fertig: mit dem letzten Haken kippt der Merker auf fertig',
      (m.data() || {}).fertig === true, JSON.stringify(m.data()));

    /* Der Punkt, um den es geht: derselbe Zustand meldet sich nicht
       zweimal. Der Merker darf nicht zurückspringen. */
    await lauf('haken');
    m = await merker();
    pruefe('fertig: ein weiterer Lauf ändert nichts (keine zweite Mail)',
      (m.data() || {}).fertig === true, JSON.stringify(m.data()));

    await todo('a2').set({ title: 'Noch was', done: false });
    await lauf('neu');
    m = await merker();
    pruefe('fertig: eine neue Aufgabe stellt zurück auf offen',
      (m.data() || {}).fertig === false, JSON.stringify(m.data()));

    /* Wiederkehrende Aufgaben: „erledigt" gilt nur in ihrer Periode.
       Eine gestern abgehakte Tagesaufgabe ist heute wieder offen — sonst
       meldete das Studio sich morgens als fertig, ohne dass jemand da
       war. */
    await todo('a2').delete();
    await todo('a3').set({
      title: 'Täglich', recurring: 'daily', done: true,
      doneAt: Date.now() - 40 * 3600000,
    });
    await lauf('haken');
    m = await merker();
    pruefe('fertig: gestern erledigte Tagesaufgabe zählt heute als offen',
      (m.data() || {}).fertig === false, JSON.stringify(m.data()));

    await todo('a3').update({ doneAt: Date.now() });
    await lauf('haken');
    m = await merker();
    pruefe('GEGENPROBE heute erledigt zählt als erledigt',
      (m.data() || {}).fertig === true, JSON.stringify(m.data()));

    /* Abgeschaltete Bereiche zählen nicht mit: wer den Putzplan
       ausblendet, soll nicht auf ewig „nicht fertig" sein. */
    await db.doc('firmen/alpha/config/features').set({ todos: true, putzplan: false });
    await putz('p2').set({ title: 'Ausgeblendet', done: false });
    await lauf('neu');
    m = await merker();
    pruefe('fertig: ein abgeschalteter Bereich hält das Studio nicht auf',
      (m.data() || {}).fertig === true, JSON.stringify(m.data()));
    await db.doc('firmen/alpha/config/features').set({ todos: true, putzplan: true });

    /* ── Drei Meldungen statt einer ──
       Gewünscht: eine Mail, wenn alles durch ist — und je eine, wenn NUR
       die Aufgaben bzw. NUR der Putzplan durch sind.

       Geprüft wird das Feld `gesendet` im Merker. Ohne es ließe sich von
       außen nicht unterscheiden, ob eine Meldung unterdrückt wurde oder
       nie fällig war: der Merker sähe in beiden Fällen gleich aus, und
       ein Durchlauf über die Tagessperre hätte gar nichts gemessen. */
    const sauber = async () => {
      for (const c of ['todos', 'cleaning']) {
        const s = await db.collection('firmen/alpha/studios/' + sk + '/' + c).get();
        for (const d of s.docs) await d.ref.delete();
      }
      await db.doc('firmen/alpha/config/fertig-' + sk).delete();
    };
    const gesendet = async () => ((await merker()).data() || {}).gesendet || [];

    await sauber();
    await todo('b1').set({ title: 'Aufgabe', done: true, doneAt: Date.now() });
    await putz('q1').set({ title: 'Wischen', done: false });
    await lauf('haken', { vor: { done: false }, nach: { done: true, doneAt: Date.now() } });
    pruefe('drei Sorten: nur Aufgaben durch → Meldung "aufgaben"',
      JSON.stringify(await gesendet()) === '["aufgaben"]',
      JSON.stringify((await merker()).data()));

    await putz('q1').update({ done: true, doneAt: Date.now() });
    await lauf('haken', { vor: { done: false }, nach: { done: true, doneAt: Date.now() } });
    pruefe('drei Sorten: jetzt auch der Putzplan → Meldung "alles", nicht "putz"',
      JSON.stringify(await gesendet()) === '["alles"]',
      JSON.stringify((await merker()).data()));

    /* Der Kern der Tagessperre: derselbe Übergang ein zweites Mal am
       selben Tag meldet sich NICHT. Ohne sie reicht eine neu angelegte
       und gleich abgehakte Aufgabe für eine zweite Mail. */
    await todo('b2').set({ title: 'Noch was', done: false });
    await lauf('neu', { nach: { title: 'Noch was', done: false } });
    pruefe('Tagessperre: eine neue Aufgabe stellt zurück auf offen',
      ((await merker()).data() || {}).fertig === false,
      JSON.stringify((await merker()).data()));
    await todo('b2').update({ done: true, doneAt: Date.now() });
    await lauf('haken', { vor: { done: false }, nach: { done: true, doneAt: Date.now() } });
    pruefe('Tagessperre: zweimal am selben Tag fertig meldet nur einmal',
      JSON.stringify(await gesendet()) === '[]',
      JSON.stringify((await merker()).data()));

    /* GEGENPROBE: mit dem Stempel von gestern muss dieselbe Lage wieder
       melden. Sonst wäre oben nicht die Sperre grün, sondern irgendetwas
       anderes — etwa ein Merker, der gar nicht mehr kippt. */
    await db.doc('firmen/alpha/config/fertig-' + sk)
      .set({ fertig: false, tagAlles: '2000-01-01' }, { merge: true });
    await lauf('haken', { vor: { done: false }, nach: { done: true, doneAt: Date.now() } });
    pruefe('GEGENPROBE Tagessperre: mit gestrigem Stempel meldet es wieder',
      JSON.stringify(await gesendet()) === '["alles"]',
      JSON.stringify((await merker()).data()));

    /* Ein Studio ohne Putzplan darf nicht „Putzplan fertig" melden.
       Null von null ist nicht fertig, sondern leer. */
    await sauber();
    await todo('c1').set({ title: 'Einzige Aufgabe', done: true, doneAt: Date.now() });
    await lauf('haken', { vor: { done: false }, nach: { done: true, doneAt: Date.now() } });
    pruefe('leer: ohne Putzplan meldet nur "alles", nie "putz"',
      JSON.stringify(await gesendet()) === '["alles"]',
      JSON.stringify((await merker()).data()));
    await sauber();
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

  /* ══ Wer bekommt welche Mail? ══
     Aus dem Betrieb: „nicht JEDER Chef soll jede Mail zu jedem Thema
     bekommen." Bei 14 Studios heisst „Studio fertig" bis zu 14 Mails am
     Tag — an jeden Chef.

     Der Punkt, an dem das teuer wird, ist nicht das Abschalten, sondern
     die Vorgabe: die Liste nennt die ABGESCHALTETEN Themen. Waere es
     andersherum, bekaeme nach dem Ausrollen niemand mehr etwas, bis
     alle zwoelf Konten von Hand nachgepflegt sind — und gemerkt haette
     es erst, wer eine Mail vermisst. Genau das prueft die erste Runde. */
  {
    const willHaben = fns.__intern && fns.__intern.mailWillHaben;
    if (!willHaben) {
      pruefe('Mail-Filter überhaupt erreichbar', false);
    } else {
      await db.collection('users').doc('mailAlles').set({ name: 'Alles', role: 'chef' });
      await db.collection('users').doc('mailOhneFertig')
        .set({ name: 'Ohne Fertig', role: 'chef', mailAus: ['fertig'] });
      await db.collection('users').doc('mailOhneAlles')
        .set({ name: 'Stille', role: 'chef', mailAus: ['fertig', 'bericht', 'aufgabe'] });
      await db.collection('users').doc('mailKaputt')
        .set({ name: 'Kaputt', role: 'chef', mailAus: 'keine-liste' });

      const alle = ['mailAlles', 'mailOhneFertig', 'mailOhneAlles', 'mailKaputt'];
      const fertig  = await willHaben(alle, 'fertig');
      const bericht = await willHaben(alle, 'bericht');
      const aufgabe = await willHaben(alle, 'aufgabe');
      const ohneThema = await willHaben(alle, null);
      const unbekannt = await willHaben(['gibtEsNicht'], 'fertig');

      pruefe('MAIL · ohne Feld bekommt weiterhin alles',
        fertig.includes('mailAlles') && bericht.includes('mailAlles') &&
        aufgabe.includes('mailAlles'));
      pruefe('MAIL · wer „fertig" abschaltet, fällt dort raus',
        !fertig.includes('mailOhneFertig'));
      /* Und NUR dort. Ein Schalter, der gleich alles mit abschaltet,
         waere schlimmer als keiner. */
      pruefe('MAIL · bekommt Bericht und Aufgabe aber weiter',
        bericht.includes('mailOhneFertig') && aufgabe.includes('mailOhneFertig'));
      pruefe('MAIL · wer alles abschaltet, bekommt nichts',
        !fertig.includes('mailOhneAlles') && !bericht.includes('mailOhneAlles') &&
        !aufgabe.includes('mailOhneAlles'));
      /* Kein Thema angegeben heisst: alter Aufruf, niemand faellt raus.
         Damit bleibt jede Mail, die noch kein Thema traegt, unveraendert. */
      pruefe('MAIL · ohne Thema wird nicht gefiltert',
        ohneThema.length === alle.length);
      /* Ein kaputtes Feld darf nicht dazu fuehren, dass jemand still
         keine Mails mehr bekommt. Lieber eine zu viel — die merkt man. */
      pruefe('MAIL · ein kaputtes Feld sperrt niemanden aus',
        fertig.includes('mailKaputt'));
      pruefe('MAIL · ein unbekanntes Konto wird nicht verschluckt',
        unbekannt.length === 1);

      /* GEGENPROBE zur Runde selbst: wenn der Filter einfach alles
         durchliesse, waere oben fast alles gruen. Diese Zeile faellt
         dann um. */
      pruefe('GEGENPROBE der Filter lässt NICHT einfach alles durch',
        fertig.length < alle.length);
    }
  }

  /* ══ Wer bekommt „Studio fertig"? ══
     Aus dem Betrieb: „Studio Leiter sollen Mails bekommen wenn IHRE
     Studios alle Aufgaben erledigt haben."

     Vorher ging die Meldung ausschliesslich an Chefs. Der Schalter dafuer
     war aber schon fuer jeden mit canManage() sichtbar, also auch fuer
     Leiter — er hat ihnen etwas versprochen, das nie passiert ist.

     Das Teure an dieser Aenderung ist die andere Richtung: eine Mail zu
     viel faellt dem nicht auf, der sie nicht bekommen sollte. Deshalb
     steht hier nicht nur „der Leiter bekommt sie", sondern vor allem
     „der Leiter des ANDEREN Studios bekommt sie nicht". */
  {
    const konten = fns.__intern && fns.__intern.kontenImStudio;
    if (!konten) {
      pruefe('kontenImStudio überhaupt erreichbar', false);
    } else {
      await db.collection('users').doc('fChef')
        .set({ name: 'Chef', role: 'chef', firma: 'alpha' });
      await db.collection('users').doc('fLeiterA')
        .set({ name: 'Leiter A', role: 'leiter', firma: 'alpha', studioKeys: ['st-a'] });
      await db.collection('users').doc('fLeiterB')
        .set({ name: 'Leiter B', role: 'leiter', firma: 'alpha', studioKeys: ['st-b'] });
      await db.collection('users').doc('fMit')
        .set({ name: 'Mitarbeiter', role: 'mitarbeiter', firma: 'alpha', studioKeys: ['st-a'] });
      await db.collection('users').doc('fLeiterAus')
        .set({ name: 'Weg', role: 'leiter', firma: 'alpha', studioKeys: ['st-a'], aktiv: false });
      /* Fremde Firma, gleiche Studio-Kennung. Kennungen sind je Betrieb
         vergeben, „st-a" gibt es also mehrfach — ohne die Firmen-Grenze
         bekaeme der Leiter eines fremden Betriebs unsere Meldung. */
      await db.collection('users').doc('fFremd')
        .set({ name: 'Fremd', role: 'leiter', firma: 'beta', studioKeys: ['st-a'] });

      const chefs   = await konten('alpha', null, 'chef');
      const leiterA = await konten('alpha', 'st-a', 'leiter');
      const leiterB = await konten('alpha', 'st-b', 'leiter');
      const alleA   = await konten('alpha', 'st-a');

      pruefe('FERTIG · der Chef ist dabei, ohne Studio-Bindung',
        chefs.includes('fChef'));
      pruefe('FERTIG · der Leiter seines Studios ist dabei',
        leiterA.includes('fLeiterA'));
      /* Der Kern. Ohne diese Zeile waere auch „schickt an alle Leiter"
         gruen — und aus einer nuetzlichen Meldung wuerde genau der
         Mailberg, den der Betrieb loswerden wollte. */
      pruefe('FERTIG · der Leiter eines ANDEREN Studios ist NICHT dabei',
        !leiterA.includes('fLeiterB') && !leiterB.includes('fLeiterA'));
      pruefe('FERTIG · ein Mitarbeiter im Studio ist NICHT dabei',
        !leiterA.includes('fMit'));
      pruefe('FERTIG · ein abgeschaltetes Konto ist NICHT dabei',
        !leiterA.includes('fLeiterAus') && !alleA.includes('fLeiterAus'));
      pruefe('FERTIG · eine fremde Firma ist NICHT dabei',
        !leiterA.includes('fFremd') && !chefs.includes('fFremd'));
      /* Ohne Rollenfilter kommen alle im Studio — sonst haette die
         Einschraenkung oben gar nichts zu tun gehabt. */
      pruefe('GEGENPROBE ohne Rollenfilter ist der Mitarbeiter sehr wohl dabei',
        alleA.includes('fMit') && alleA.includes('fLeiterA'));
    }
  }

  /* ── Push „X hat Y erledigt": welche GERÄTE ──
     Die Mail geht an Konten, der Push an Geräte, und die stehen in einer
     eigenen Sammlung mit eigenen Feldern. Beides sieht ähnlich aus und
     ist es nicht: ein Gerät trägt seine Rolle selbst, es kann einen
     eigenen Schalter aus haben, und es gehört einer Person, die den
     Haken womöglich gerade selbst gesetzt hat.

     Geprüft wird die Auswahl, nicht die Zustellung. Ob eine Meldung auf
     einem Handy erscheint, lässt sich hier nicht feststellen. */
  {
    const sammle = fns.__intern && fns.__intern.collectTokens;
    const imStudio = fns.__intern && fns.__intern.inStudio;
    const will = fns.__intern && fns.__intern.willHaben;
    if (!sammle) {
      pruefe('collectTokens überhaupt erreichbar', false);
    } else {
      const T = {
        chef:      { uid: 'pChef',   role: 'chef',        firma: 'alpha' },
        leiterA:   { uid: 'pLeitA',  role: 'leiter',      firma: 'alpha', studioKeys: ['st-a'] },
        leiterB:   { uid: 'pLeitB',  role: 'leiter',      firma: 'alpha', studioKeys: ['st-b'] },
        mitarb:    { uid: 'pMit',    role: 'mitarbeiter', firma: 'alpha', studioKeys: ['st-a'] },
        chefStumm: { uid: 'pStumm',  role: 'chef',        firma: 'alpha', notify: { erledigt: false } },
        fremd:     { uid: 'pFremd',  role: 'chef',        firma: 'beta' },
      };
      for (const k of Object.keys(T)) await db.collection('pushTokens').doc('tok-' + k).set(T[k]);

      /* Wortgleich die Bedingung aus erledigtPush(). Sie hier
         abzuschreiben ist der schwache Punkt dieses Abschnitts und mit
         Absicht in Kauf genommen: die Funktion selbst schickt, und
         Schicken geht hier nicht. */
      const waehle = (studioKey, ausser) => sammle(
        d => (d.role === 'chef' || (d.role === 'leiter' && imStudio(d, studioKey))) &&
             will(d, 'erledigt'),
        ausser, 'alpha');

      const a = await waehle('st-a', null);
      pruefe('PUSH · das Gerät des Chefs bekommt es', a.includes('tok-chef'));
      pruefe('PUSH · der Leiter DIESES Studios bekommt es', a.includes('tok-leiterA'));
      pruefe('PUSH · der Leiter eines ANDEREN Studios nicht', !a.includes('tok-leiterB'));
      pruefe('PUSH · ein Mitarbeiter nicht', !a.includes('tok-mitarb'));
      pruefe('PUSH · wer den Schalter aus hat, nicht', !a.includes('tok-chefStumm'));
      pruefe('PUSH · eine fremde Firma nicht', !a.includes('tok-fremd'));

      /* Wer selbst abgehakt hat, weiss es. */
      const ohneChef = await waehle('st-a', 'pChef');
      pruefe('PUSH · das eigene Gerät bleibt aussen vor',
        !ohneChef.includes('tok-chef') && ohneChef.includes('tok-leiterA'));

      /* Ohne die Bedingung kämen alle — sonst hätte oben nichts geprüft. */
      const alle = await sammle(() => true, null, 'alpha');
      pruefe('GEGENPROBE ohne Filter sind Mitarbeiter und Stummer sehr wohl dabei',
        alle.includes('tok-mitarb') && alle.includes('tok-chefStumm'));

      for (const k of Object.keys(T)) await db.collection('pushTokens').doc('tok-' + k).delete();
    }
  }

  /* ── Welche Mail ist fällig? Die reine Rechnung ──
     fertigMeldungen() bekommt Zustand, Merker und Datum und gibt die
     Liste zurück. Ohne Datenbank, deshalb hier vollständig durchspielbar
     — im Auslöser oben ist nur der Weg durch die häufigen Fälle. */
  {
    const f = fns.__intern && fns.__intern.fertigMeldungen;
    const satz = fns.__intern && fns.__intern.standSatz;
    if (!f) {
      pruefe('fertigMeldungen überhaupt erreichbar', false);
    } else {
      const H = '2026-08-27';
      const S = (auf, pu, nA, nP) => ({ aufgaben: auf, putz: pu, gesamt: auf + pu,
                                        nAufgaben: nA, nPutz: nP, dokumente: nA + nP });
      const j = (x) => JSON.stringify(x);

      pruefe('RECHNUNG · alles offen meldet nichts',
        j(f(S(2, 1, 3, 2), {}, H)) === '[]');
      pruefe('RECHNUNG · nur Aufgaben durch meldet "aufgaben"',
        j(f(S(0, 1, 3, 2), {}, H)) === '["aufgaben"]');
      pruefe('RECHNUNG · nur Putzplan durch meldet "putz"',
        j(f(S(2, 0, 3, 2), {}, H)) === '["putz"]');
      pruefe('RECHNUNG · beides durch meldet NUR "alles"',
        j(f(S(0, 0, 3, 2), {}, H)) === '["alles"]');
      pruefe('RECHNUNG · ein leeres Studio meldet nichts',
        j(f(S(0, 0, 0, 0), {}, H)) === '[]');
      /* Der Fall, der ohne getrennte Zählung falsch wäre: ein Studio
         ganz ohne Putzplan hat den Putzplan nicht „geschafft". */
      pruefe('RECHNUNG · ohne Putzplan gibt es kein "putz"',
        j(f(S(1, 0, 3, 0), {}, H)) === '[]');
      pruefe('RECHNUNG · war schon fertig meldet nicht erneut',
        j(f(S(0, 0, 3, 2), { fertig: true }, H)) === '[]');
      pruefe('RECHNUNG · Stempel von heute sperrt',
        j(f(S(0, 0, 3, 2), { tagAlles: H }, H)) === '[]');
      pruefe('RECHNUNG · Stempel von gestern sperrt nicht',
        j(f(S(0, 0, 3, 2), { tagAlles: '2026-08-26' }, H)) === '["alles"]');
      /* Der Merker fehlt beim allerersten Mal ganz. Behandelte man das
         wie „war fertig", bliebe die erste Meldung für immer stumm. */
      pruefe('RECHNUNG · ohne Merker wird gemeldet',
        j(f(S(0, 0, 3, 2), null, H)) === '["alles"]');

      pruefe('SATZ · fertig heisst fertig', satz(S(0, 0, 3, 2)) === 'fertig');
      pruefe('SATZ · Einzahl bei einem Punkt',
        satz(S(1, 1, 3, 2)) === '1 Aufgabe und 1 Punkt im Putzplan offen');
      pruefe('SATZ · nur die Seite, auf der etwas steht',
        satz(S(0, 3, 3, 2)) === '3 Punkte im Putzplan offen');
    }
  }

  /* ══ Der Bericht: stimmen die Zahlen? ══
     Aus dem Betrieb: „eine viel bessere und genauere Mail-Berichterstattung
     […] es soll IMMER von allen Studios sein und schön sortiert."

     Bis heute stand im Kopf dieser Datei, der Monatsbericht sei nicht
     prüfbar, weil er nur eine Mail hinterlässt. Das stimmte für den
     VERSAND — nicht für die Zahlen. collectMonthly() liest aus der
     Datenbank und gibt ein Objekt zurück; genau das lässt sich hier
     ausrechnen und nachzählen. Drei Ungenauigkeiten sind dabei
     herausgekommen, und alle drei stehen unten als eigene Behauptung. */
  {
    const collect = fns.__intern && fns.__intern.collectMonthly;
    const text = fns.__intern && fns.__intern.monatsText;
    if (!collect) {
      pruefe('collectMonthly überhaupt erreichbar', false);
    } else {
      const T = Date.now();
      const imZeitraum = T - 3 * 86400000;
      const davor      = T - 60 * 86400000;
      const gestern    = T - 30 * 3600000;
      const B = 'firmen/bericht';
      await db.doc(B).set({ name: 'Berichtsfirma', aktiv: true });

      /* Drei Studios in der Sammlung. st-leer bekommt ABSICHTLICH
         keine Person zugewiesen — das ist der Fall, an dem der alte
         Bericht gescheitert ist. */
      await db.doc(B + '/studios/st-nord').set({ name: 'Nord' });
      await db.doc(B + '/studios/st-sued').set({ name: 'Süd' });
      await db.doc(B + '/studios/st-leer').set({ name: 'Neu eröffnet' });
      await db.collection('users').doc('bChef')
        .set({ name: 'Chef', role: 'chef', firma: 'bericht',
               studioKeys: ['st-nord', 'st-sued'], studios: ['Nord', 'Süd'] });

      // Nord: eine im Zeitraum erledigt, eine überfällig offen
      await db.doc(B + '/studios/st-nord/todos/t1')
        .set({ title: 'Erledigt im Zeitraum', done: true, doneAt: imZeitraum, doneBy: 'Anna' });
      await db.doc(B + '/studios/st-nord/todos/t2')
        .set({ title: 'Überfällig', done: false, due: T - 86400000 });
      // Ausserhalb des Zeitraums erledigt — darf NICHT mitzählen
      await db.doc(B + '/studios/st-nord/todos/t3')
        .set({ title: 'Lange her', done: true, doneAt: davor, doneBy: 'Anna' });
      /* Der Kern der zweiten Ungenauigkeit: eine TÄGLICHE Aufgabe,
         gestern abgehakt. done:true — der alte Bericht zählte sie
         deshalb als nicht offen, obwohl sie heute wieder ansteht. */
      await db.doc(B + '/studios/st-nord/todos/t4')
        .set({ title: 'Täglich, gestern erledigt', done: true, doneAt: gestern,
               doneBy: 'Ben', recurring: 'daily' });
      // Putzplan — fehlte im Bericht komplett
      await db.doc(B + '/studios/st-nord/cleaning/c1')
        .set({ title: 'Böden', done: true, doneAt: imZeitraum, doneBy: 'Anna' });
      await db.doc(B + '/studios/st-nord/cleaning/c2')
        .set({ title: 'Fenster', done: false });
      await db.doc(B + '/inventory/st-nord')
        .set({ items: [{ name: 'Handtücher', have: 5, limit: 20 }] });

      // Süd: nur eine offene Aufgabe, nichts überfällig
      await db.doc(B + '/studios/st-sued/todos/s1')
        .set({ title: 'Offen', done: false });

      // st-leer: gar nichts.

      const d = await collect(T - 7 * 86400000, T, 'bericht');
      const namen = d.zeilen.map(z => z.name);

      /* 1. ALLE Studios. Vorher kamen sie aus den Nutzerprofilen —
            „Neu eröffnet" hat niemanden und fehlte deshalb ganz. Nicht
            mit Null, sondern gar nicht. */
      pruefe('BERICHT · alle drei Studios sind drin, auch das ohne Personal',
        d.zeilen.length === 3 && namen.includes('Neu eröffnet'));
      pruefe('BERICHT · die Zahl im Kopf stimmt mit der Liste überein',
        d.studios === d.zeilen.length);

      /* 2. Der Putzplan zählt mit. */
      pruefe('BERICHT · der Putzplan ist erfasst',
        d.putzErledigt === 1 && d.putzOffen === 1);

      /* 3. Wiederholung: gestern erledigt heisst heute wieder offen. */
      const nord = d.zeilen.find(z => z.name === 'Nord');
      pruefe('BERICHT · eine täglich wiederkehrende Aufgabe zählt heute wieder als offen',
        nord && nord.offen === 2);
      pruefe('BERICHT · sie zählt trotzdem als im Zeitraum erledigt',
        nord && nord.erledigt === 2);

      // Ausserhalb des Zeitraums bleibt draussen
      pruefe('BERICHT · was vor dem Zeitraum erledigt wurde, zählt nicht mit',
        d.erledigt === 2);
      pruefe('BERICHT · überfällig wird getrennt gezählt',
        d.ueberfaellig === 1 && nord.ueber === 1);
      pruefe('BERICHT · fehlendes Material kommt aus dem Bestand',
        d.fehlt === 15);

      /* 4. Sortierung: oben steht, wo etwas liegt — nicht, wo am
            meisten geschafft wurde. Gegenprobe zur alten Reihenfolge:
            nach „erledigt" sortiert stünde Nord auch oben, deshalb
            prüft die zweite Zeile das Ende der Liste. */
      pruefe('BERICHT · oben steht das Studio mit Überfälligem',
        d.zeilen[0].name === 'Nord');
      pruefe('BERICHT · das Studio ohne alles steht unten',
        d.zeilen[d.zeilen.length - 1].name === 'Neu eröffnet');

      pruefe('BERICHT · wer was erledigt hat, steht drin',
        d.proPerson['Anna'] === 2 && d.proPerson['Ben'] === 1);

      if (text) {
        const t = text(d, new Date(T - 7 * 86400000), new Date(T));
        pruefe('BERICHT · der Text nennt alle Studios',
          /Nord/.test(t) && /Süd/.test(t) && /Neu eröffnet/.test(t));
        pruefe('BERICHT · der Text sagt, über wie viele Studios er geht',
          /alle 3 Studios/.test(t));
        pruefe('BERICHT · der Text nennt den Putzplan getrennt',
          /Putzplan/.test(t));
        /* Ein leeres Studio muss als leer erkennbar sein. Sonst liest
           sich „0 offen" wie „alles geschafft", obwohl dort nur nichts
           eingerichtet ist. */
        pruefe('BERICHT · der Text nennt kein Studio ohne Eintrag als erledigt',
          /nichts hinterlegt/.test(t));

        /* ── Wie die Mail AUSSIEHT ──
           Aus dem Betrieb zur ersten ausgelieferten Fassung: „das sieht
           grade sehr verwirrend aus."

           Ursache war eine mit Leerzeichen ausgerichtete Tabelle. Die
           setzt eine Schreibmaschinenschrift voraus; Postfächer setzen
           Text proportional, und auf dem Handy brach die Trennlinie um.
           Deshalb prüft die erste Zeile ausdrücklich, dass so etwas
           nicht zurückkommt. */
        pruefe('MAIL · der Text baut KEINE Spaltentabelle mehr',
          !/─{20,}/.test(t) && !/\s{6,}\d/.test(t));
        /* Was zu tun ist, steht VOR den Zahlen. Ein Bericht, der mit
           Summen anfängt, beantwortet „lief es gut" — die Frage beim
           Öffnen ist aber „muss ich etwas tun". */
        pruefe('MAIL · „was zu tun ist" steht vor den Zahlen',
          t.indexOf('WAS ZU TUN IST') >= 0 &&
          t.indexOf('WAS ZU TUN IST') < t.indexOf('ZAHLEN'));
        pruefe('MAIL · die Personen-Überschrift nennt beide Quellen',
          /Aufgaben \+ Putzplan/.test(t));
      }

      const html = fns.__intern && fns.__intern.berichtHtml;
      if (html) {
        const h = html(d, new Date(T - 7 * 86400000), new Date(T));
        /* Der erste Bericht wurde auf einem Handy im DUNKELMODUS
           gelesen. Ohne eigene Hintergrundfarbe erbt die Mail den Grund
           des Postfachs — dunkler Text auf dunklem Grund. */
        pruefe('MAIL · die HTML-Fassung bringt ihren eigenen hellen Grund mit',
          /bgcolor="#ffffff"/.test(h) && /background:#ffffff/.test(h));
        /* Stile inline, nicht im Kopf: <style> wird von einigen
           Postfächern entfernt, und dann steht der Bericht nackt da. */
        pruefe('MAIL · keine Stile im Kopf, die ein Postfach entfernen kann',
          !/<style/i.test(h));
        pruefe('MAIL · nichts wird von aussen nachgeladen',
          !/<img|src=|@import|https?:\/\/fonts/i.test(h));
        /* Tabellen statt flex/grid — ältere Postfächer können beides
           nicht, und dann steht alles untereinander. */
        pruefe('MAIL · die Spalten stehen in einer echten Tabelle',
          /<table/.test(h) && !/display:\s*(flex|grid)/.test(h));
        pruefe('MAIL · die überfälligen Aufgaben stehen mit Namen drin',
          /Überfällig/.test(h) && /Nord/.test(h));
        pruefe('MAIL · Studios ohne Eintrag sind als solche erkennbar',
          /nichts hinterlegt/.test(h));
        pruefe('MAIL · der Text ist gegen HTML gesichert',
          h.indexOf('<script') < 0);

        /* GEGENPROBE: ohne offene Punkte muss die Mail das SAGEN, nicht
           einfach einen leeren Kasten zeigen. */
        const leer = Object.assign({}, d, {
          ueberListe: [], nachweise: [], ueberfaellig: 0, fehlt: 0,
          zeilen: d.zeilen.map(z => Object.assign({}, z, { fehltListe: [], ueber: 0, fehlt: 0 }))
        });
        const hLeer = html(leer, new Date(T - 7 * 86400000), new Date(T));
        pruefe('GEGENPROBE ohne offene Punkte sagt die Mail „nichts liegt an"',
          /Nichts liegt an/.test(hLeer) && !/Überfällig \(/.test(hLeer));
        const tLeer = text(leer, new Date(T - 7 * 86400000), new Date(T));
        pruefe('GEGENPROBE auch die Textfassung sagt es',
          /Nichts\./.test(tLeer));
      }
    }
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
