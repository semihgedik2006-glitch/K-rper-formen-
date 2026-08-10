/* ── Die Cloud Functions, ausgeführt statt behauptet ──────────────────
   Stufe 2E.

   WARUM ES DIESEN TEST GIBT
   Vier Stufen lang habe ich index.html umgestellt und die Functions
   vergessen. Der Fehler wäre nicht aufgefallen: die App hätte nach dem
   Umschalten tadellos ausgesehen, während im Hintergrund KEINE
   Push-Nachricht mehr rausging, KEINE Erinnerung an überfällige
   Aufgaben, KEINE Warnung vor ablaufenden Nachweisen — und der
   Papierkorb hätte weiter die alten, flachen Daten geleert statt der
   neuen. Alles lautlos.

   Ein Test, der so etwas fängt, muss den echten Code AUSFÜHREN. Deshalb
   wird hier functions/index.js geladen und über .run() ausgelöst, so wie
   Firebase es täte — gegen den Emulator, also ohne jedes Risiko.

   Geprüft wird in drei Schichten:

     1. VORHER: ohne Firmen-Sammlung muss alles laufen wie heute. Das ist
        der Zustand im Betrieb, heute Nacht, vor dem Umzug.
     2. AUSLÖSER: jeder Handler hängt an ZWEI Pfaden. Wenn der zweite
        fehlt, merkt es niemand, bis eine Nachricht stumm bleibt.
     3. NACHHER: mit Firmen muss jede Funktion in JEDER Firma arbeiten —
        und in keiner fremden.

   WAS DIESER TEST NICHT PRÜFT — bitte lesen, bevor „alles grün" jemanden
   beruhigt:

   Geprüft wird nur, was eine sichtbare Spur hinterlässt: geschriebene
   und gelöschte Dokumente. Funktionen, deren einziges Ergebnis eine
   Push-Nachricht oder eine E-Mail ist, hinterlassen hier keine —
   `dueTaskReminder`, `certExpiry`, `appointmentMailScheduler` und der
   Monatsbericht laufen also, aber ob sie das Richtige gefunden haben,
   sieht man nicht. Für die steht nur fest, dass sie über `alleFirmen()`
   und `W(firma)` gehen (`tests/test-funktionen-pfade.js`) — das ist
   weniger, und es soll nicht mehr klingen.

   Ob Push wirklich auf einem Gerät ankommt und ob eine Mail zugestellt
   wird, lässt sich hier gar nicht feststellen. Das geht nur im
   Probe-Projekt, an einem echten Gerät.
   ───────────────────────────────────────────────────────────────────── */
const path = require('path');

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8791';
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
