/* ============================================================
   Körperformen – Push-Benachrichtigungen (Firebase Cloud Functions, 1. Gen)
   Sendet Push, wenn eine neue Chat-Nachricht, Aufgabe oder Ankündigung entsteht.
   Region: europe-west1 (passend zu Firestore).
   ============================================================ */

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const region = functions.region('europe-west1');

/* ══════════════════════════════════════════════════════════════════════
   MEHRERE FIRMEN — der Zugriffspunkt (Stufe 2E aus docs/MANDANT-PLAN.md)

   W(firma) ist die Wurzel jedes Datenzugriffs, das Gegenstueck zu S() in
   index.html: ohne Firma die Datenbank selbst (flache Pfade), mit Firma das
   Dokument firmen/<kennung> darunter. Derselbe Code laeuft damit vor und
   nach dem Umzug.

   Jeder neue Zugriff muss hier durch. Eine Function, die den flachen Pfad
   direkt benutzt, findet nach dem Umschalten nichts mehr — ohne
   Fehlermeldung, es kommt nur keine Push-Nachricht an.
   tests/test-funktionen-pfade.js prueft das.
   ══════════════════════════════════════════════════════════════════════ */
function W(firma) {
  return firma ? db.collection('firmen').doc(firma) : db;
}

/* Alle Firmen, ueber die eine geplante Funktion laufen muss.
   Gibt es noch keine Firmen-Sammlung, liefert sie [null] — dann laeuft
   genau ein Durchgang auf den flachen Pfaden. So braucht keine einzige
   Funktion eine Fallunterscheidung. */
async function alleFirmen() {
  try {
    const s = await db.collection('firmen').get();
    if (s.empty) return [null];
    return s.docs
      .filter(d => (d.data() || {}).aktiv !== false)
      .map(d => d.id);
  } catch (e) {
    console.warn('alleFirmen:', e.message);
    return [null];
  }
}

/* ── Abgeschaltete Funktionen ────────────────────────────────────────
   Der Chef kann Bereiche ausblenden (config/features). Die Zeitplaene
   muessen das mitpruefen, sonst brummt das Handy um 7:30 Uhr wegen einer
   Aufgabe, die es in der App nicht mehr gibt.

   Fehlt das Dokument oder ist es nicht lesbar, gilt "an" — dieselbe
   Richtung wie in der App: im Zweifel eine Meldung zu viel. */
async function featureAn(firma, id) {
  try {
    const d = await W(firma).collection('config').doc('features').get();
    if (!d.exists) return true;
    return (d.data() || {})[id] !== false;
  } catch (e) {
    console.warn('features (' + (firma || 'flach') + '):', e.message);
    return true;
  }
}

/* Konten einer Firma. users liegt weiterhin oben (die Firma steht IM
   Profil), deshalb wird hier gefiltert statt verschachtelt.
   Ein Profil ohne Feld 'firma' gehoert zur Voreinstellung — sonst
   bekaeme nach dem Umschalten niemand mehr eine Meldung. */
function gehoertZu(daten, firma) {
  if (!firma) return true;
  const f = (daten || {}).firma || 'koerperformen';
  return f === firma;
}


/* Tokens aus pushTokens holen, die zu den Kriterien passen.
   filterFn(data) → true = an dieses Gerät senden. excludeUid = Absender nicht benachrichtigen. */
async function collectTokens(filterFn, excludeUid, firma) {
  const snap = await db.collection('pushTokens').get();
  const tokens = [];
  snap.forEach(doc => {
    const d = doc.data() || {};
    if (excludeUid && d.uid === excludeUid) return;
    /* Ein Gerätezeichen gehört zu einer Person, und die zu einer Firma.
       Ohne diesen Filter bekäme nach dem Umschalten die halbe Kundschaft
       die Nachrichten der anderen — der lauteste denkbare Bruch der
       Trennung, die 21 Kreuztests absichern. */
    if (firma && !gehoertZu(d, firma)) return;
    if (filterFn(d)) tokens.push(doc.id);
  });
  return tokens;
}

/* Gehört dieses Gerät zum Studio? (Mehrfach-Studios; alte Tokens mit Einzel-Feld weiter unterstützt) */
function inStudio(d, key) {
  if (Array.isArray(d.studioKeys)) return d.studioKeys.indexOf(key) >= 0;
  return d.studioKey === key;
}

/* Will dieses Gerät diese Art von Meldung überhaupt?
   Die Einstellungen stehen am Gerät-Eintrag (pushTokens), damit hier nicht
   für jedes Gerät zusätzlich das Profil geladen werden muss.
   Fehlt die Angabe (ältere Geräte), gilt sie als eingeschaltet – sonst
   würden bestehende Installationen stillschweigend verstummen. */
function willHaben(d, art) {
  const n = d && d.notify;
  if (!n) return true;
  return n[art] !== false;
}

/* Push an eine Liste von Tokens senden + ungültige Tokens aufräumen */
/* ══ Warum hier KEIN notification-Feld steht ═══════════════════════════
   Aus dem Betrieb: „Push-Nachrichten kommen an, meistens sogar doppelt."

   Genau daran lag es. Traegt eine FCM-Nachricht ein `notification`-Feld,
   zeigt der Browser sie im Hintergrund SELBST an — und ruft zusaetzlich
   onBackgroundMessage() im Service Worker auf, wo sw.js sie ein zweites
   Mal anzeigt. Zwei Meldungen fuer eine Nachricht. Das ist kein Fehler
   im Service Worker, sondern das dokumentierte Verhalten von FCM im Web.

   Deshalb gehen die Texte als DATEN raus. Dann feuert nur
   onBackgroundMessage, und angezeigt wird genau einmal — von uns.

   Der Preis: zeigt der Service Worker nichts an, kommt gar nichts. Das
   ist die richtige Seite des Handels — eine Meldung zu viel merkt sich
   niemand als Fehler, sie nervt nur, und genau das war die Rueckmeldung.

   Datenfelder muessen Zeichenketten sein; alles andere weist FCM ab. */
async function sendPush(tokens, title, body) {
  if (!tokens.length) return;
  const message = {
    data: { title: String(title || 'StudioChat'), body: String(body || '') },
    tokens: tokens.slice(0, 500)
  };
  const res = await admin.messaging().sendEachForMulticast(message);
  // Ungültige (abgemeldete) Tokens löschen
  const dead = [];
  res.responses.forEach((r, i) => {
    if (!r.success) {
      const code = r.error && r.error.code;
      if (code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token') {
        dead.push(tokens[i]);
      }
    }
  });
  await Promise.all(dead.map(t => db.collection('pushTokens').doc(t).delete().catch(() => {})));
}

/* ── Neue Chat-Nachricht ── */
/* ── Auslöser für beide Welten ──
   Ein Firestore-Auslöser braucht einen festen Pfad und kann nicht „flach
   ODER verschachtelt" hören. Jeder Handler wird deshalb zweimal
   registriert: auf dem alten Pfad und auf firmen/{firma}/….

   Der alte Auslöser fällt weg, sobald die flachen Daten aufgeräumt sind.
   Bis dahin deckt er die Lücke zwischen Datenumzug und App-Umschaltung ab —
   wer in dieser Zeit schreibt, bekäme sonst keine Meldung. */
function beideWelten(pfad, handler, art, opt) {
  art = art || 'onCreate';
  const r = opt ? region.runWith(opt) : region;
  return {
    flach: r.firestore.document(pfad)[art](handler),
    firma: r.firestore.document('firmen/{firma}/' + pfad)[art](handler),
  };
}

/* ── Die beiden Welten für einen Zeitplan ─────────────────────────────
   Ein Auslöser hängt an beiden Pfaden (beideWelten). Ein Zeitplan nicht:
   der läuft über alleFirmen() und sieht damit nur firmen/<kennung>/….

   Für Sammlungen, in die noch flach geschrieben wird, ist das ein
   stiller Ausfall. Genau das war bei den Terminen der Fall:
   wachstum.html schreibt nach appointments/, der Zeitplan suchte ab dem
   Umzug am 10.8. nur noch unter firmen/koerperformen/appointments — die
   Bestätigungsmail kam weiter (die hängt am Auslöser, und der hängt an
   beiden Pfaden), Erinnerung und Nachfassen nicht mehr. Ohne Fehler,
   ohne Eintrag, ohne dass in der App etwas anders aussieht.

   Kostet zwei leere Abfragen je Lauf, solange es flach nichts gibt.
   Fällt weg, wenn die flachen Daten aufgeräumt sind (docs/OFFEN.md). */
async function alleFirmenUndFlach() {
  const alle = await alleFirmen();
  if (alle.length === 1 && alle[0] === null) return alle;
  return alle.concat([null]);
}

/* Die Firma zu EINEM Profil — für Aufrufe aus der App, wo genau eine Person
   dahintersteht.

   null heisst: es gibt noch keine Firmen-Sammlung, also flache Pfade. Bei
   gesperrter oder unbekannter Firma wird abgebrochen statt auf flach
   zurueckzufallen — dort liegen die Daten der Voreinstellung, und still in
   fremde Daten zu schreiben ist schlimmer als eine Fehlermeldung. */
async function firmaVonProfil(profil) {
  const alle = await alleFirmen();
  if (alle.length === 1 && alle[0] === null) return null;
  const f = (profil || {}).firma || 'koerperformen';
  if (alle.indexOf(f) < 0) {
    throw new functions.https.HttpsError('permission-denied',
      'Diese Firma ist stillgelegt.');
  }
  return f;
}

const _neueNachricht = async (snap, ctx) => {
    const m = snap.data() || {};
    const channelId = ctx.params.channelId;
    const isGeneral = channelId === 'allgemein';
    const firma = ctx.params.firma || null;
    const tokens = await collectTokens(d => {
      if (!willHaben(d, 'chat')) return false;
      if (isGeneral) return true;                 // Allgemein → alle
      return inStudio(d, channelId) || d.role === 'chef'; // Studio-Kanal → Studio + Chefs
    }, m.uid, firma);
    const body = m.text ? m.text : (m.img ? '📷 Foto' : '');
    // Erwähnte Personen bekommen eine eigene, deutlichere Meldung ...
    const mentioned = Array.isArray(m.mentions) ? m.mentions : [];
    let mentionTokens = [];
    if (mentioned.length) {
      mentionTokens = await collectTokens(
        d => mentioned.indexOf(d.uid) >= 0 && willHaben(d, 'mentions'), m.uid, firma);
      await sendPush(mentionTokens, (m.name || 'Jemand') + ' hat dich erwähnt', body);
    }
    // ... und werden aus der normalen Meldung herausgenommen, damit sie
    // nicht zweimal benachrichtigt werden
    const rest = tokens.filter(t => mentionTokens.indexOf(t) < 0);
    await sendPush(rest, 'Neue Nachricht von ' + (m.name || 'Team'), body);
};
const _msg = beideWelten('channels/{channelId}/messages/{msgId}', _neueNachricht);
exports.onNewMessage = _msg.flach;
exports.onNewMessageF = _msg.firma;

/* ── Neue Aufgabe ── */
const _neueAufgabe = async (snap, ctx) => {
    const t = snap.data() || {};
    const studioKey = ctx.params.studioKey;
    const firma = ctx.params.firma || null;
    const tokens = await collectTokens(
      d => inStudio(d, studioKey) && willHaben(d, 'todos'),
      t.createdByUid, firma);
    await sendPush(tokens, 'Neue Aufgabe', t.title || '');

    /* Zusaetzlich per Mail. Push erreicht nur, wer die App installiert
       und Meldungen erlaubt hat; die Mail erreicht alle.

       Wer sie bekommt: ist die Aufgabe jemandem zugewiesen, nur diese
       Person. Sonst alle im betroffenen Studio. Der Ersteller nicht — er
       weiss es. */
    const empfaenger = t.assignedTo
      ? [t.assignedTo]
      : await kontenImStudio(firma, studioKey);
    const ohneErsteller = empfaenger.filter(uid => uid !== t.createdByUid);
    if (!ohneErsteller.length) return;

    const wo = await studioName(firma, studioKey);
    const frist = t.due ? '\nFällig: ' + new Date(t.due).toLocaleDateString('de-DE',
      { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' }) : '';
    await teamMail(firma, ohneErsteller,
      'Neue Aufgabe: ' + (t.title || 'ohne Titel'),
      'Für ' + wo + ' gibt es eine neue Aufgabe.\n\n' +
      (t.title || '') + '\n' +
      (t.desc ? t.desc + '\n' : '') + frist + '\n\n' +
      'Angelegt von ' + (t.createdBy || 'der Leitung') + '.\n' +
      'Abhaken in der App.', 'aufgabe');
};
const _todo = beideWelten('studios/{studioKey}/todos/{todoId}', _neueAufgabe);
exports.onNewTodo = _todo.flach;
exports.onNewTodoF = _todo.firma;


/* ══ „Das Studio ist durch" ══════════════════════════════════════════
   Der Chef bekommt eine Mail, sobald in einem Studio nichts mehr offen
   ist — Aufgaben und Putzplan zusammen.

   GENAU EINMAL JE ÜBERGANG, nicht einmal am Tag: gemerkt wird der
   Zustand (fertig ja/nein) in config/fertig-<studio>. Kommt danach eine
   neue Aufgabe dazu, steht das Studio wieder auf „offen" — und wenn sie
   abgehakt ist, darf die Meldung erneut kommen. Ohne dieses Gedächtnis
   käme bei jedem einzelnen Haken eine Mail, weil jeder Haken den
   Auslöser feuert.

   Was als offen zählt, ist bewusst dieselbe Rechnung wie in der App:
   eine wiederkehrende Aufgabe gilt nur in ihrer Periode als erledigt
   (isDone in index.html). Wer das hier ändert, ohne es dort zu ändern,
   verschickt Mails über einen Zustand, den niemand auf dem Bildschirm
   sieht.
   ═══════════════════════════════════════════════════════════════════ */

/* Beginn der laufenden Periode — Gegenstück zu periodStart() in der App.
   Deutsche Zeitzone, weil der Tag dort umspringt, wo die Studios stehen. */
function periodenStart(rep) {
  const jetzt = new Date();
  const berlin = new Date(jetzt.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const tag = new Date(berlin.getFullYear(), berlin.getMonth(), berlin.getDate());
  if (rep === 'weekly') {
    const wt = (tag.getDay() + 6) % 7;          // Montag = 0
    tag.setDate(tag.getDate() - wt);
  }
  /* Zurück in echte Millisekunden: der Umweg oben rechnet in Ortszeit,
     der Vergleich unten läuft gegen doneAt in UTC-Millisekunden. */
  return tag.getTime() - (berlin.getTime() - jetzt.getTime());
}

function erledigt(t) {
  if (t.recurring === 'daily' || t.recurring === 'weekly') {
    return !!t.done && (t.doneAt || 0) >= periodenStart(t.recurring);
  }
  if (t.recurring === 'custom' && t.intervalMs) {
    return !!t.done && !!t.doneAt && (Date.now() < (t.doneAt + t.intervalMs));
  }
  return !!t.done;
}

async function offenImStudio(firma, studioKey) {
  const ref = W(firma).collection('studios').doc(studioKey);
  let aufgaben = 0, putz = 0, dokumente = 0;
  if (await featureAn(firma, 'todos')) {
    const s1 = await ref.collection('todos').get();
    dokumente += s1.size;
    s1.forEach(d => { if (!erledigt(d.data() || {})) aufgaben++; });
  }
  if (await featureAn(firma, 'putzplan')) {
    const s2 = await ref.collection('cleaning').get();
    dokumente += s2.size;
    s2.forEach(d => { if (!erledigt(d.data() || {})) putz++; });
  }
  return { aufgaben, putz, gesamt: aufgaben + putz, dokumente };
}

const _fertigPruefen = async (change, ctx) => {
  const firma = ctx.params.firma || null;
  const studioKey = ctx.params.studioKey;
  if (!studioKey) return;

  const stand = await offenImStudio(firma, studioKey);
  const merker = W(firma).collection('config').doc('fertig-' + studioKey);
  const alt = await merker.get();
  /* null heisst „noch nie festgehalten". Wichtig, dass das NICHT wie
     „war offen" behandelt wird: sonst bliebe die allererste Meldung
     stumm, weil der Merker erst beim zweiten Mal existiert. Genau das
     ist beim ersten Anlauf passiert. */
  const warFertig = alt.exists ? ((alt.data() || {}).fertig === true) : null;
  const istFertig = stand.gesamt === 0;

  if (istFertig === warFertig) return;          // nichts hat sich geändert
  await merker.set({ fertig: istFertig, ts: Date.now() }, { merge: true });
  if (!istFertig) return;                       // wieder etwas offen: nur merken

  /* Ein Studio ganz ohne Aufgaben und ohne Putzplan ist nicht „fertig",
     es ist leer. Dafür bekommt niemand eine Mail. */
  if (!stand.dokumente) return;

  /* Chefs bekommen die Meldung fuer JEDES Studio, Studio-Leiter nur fuer
     IHRE. Vorher gingen die Mails ausschliesslich an Chefs — der
     Schalter „Studio fertig" in den Einstellungen war aber schon fuer
     jeden mit canManage() sichtbar, also auch fuer Leiter. Der hat
     ihnen etwas versprochen, das nie passiert ist.

     Fuer den Leiter ist es ausserdem die nuetzlichere Meldung: bei ihm
     sind es ein bis zwei Studios, nicht vierzehn. */
  const chefs = await kontenImStudio(firma, null, 'chef');
  const leiter = await kontenImStudio(firma, studioKey, 'leiter');
  /* Ein Konto, das beides ist, darf die Mail nicht doppelt bekommen.
     kontenImStudio filtert auf genau eine Rolle, aber die beiden Listen
     zusammenzuschuetten kann trotzdem Doppelte ergeben, sobald sich das
     Rollenmodell einmal aendert. Billiger als der Fehler. */
  const empfaenger = [...new Set(chefs.concat(leiter))];
  if (!empfaenger.length) return;
  const wo = await studioName(firma, studioKey);
  const zeit = new Date().toLocaleString('de-DE',
    { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  await teamMail(firma, empfaenger,
    wo + ': alles erledigt',
    'In ' + wo + ' ist gerade nichts mehr offen — weder Aufgaben noch Putzplan.\n\n' +
    'Stand: ' + zeit + ' Uhr.\n\n' +
    'Diese Meldung kommt einmal, wenn der letzte Punkt abgehakt ist. Kommt ' +
    'später etwas dazu und wird auch das erledigt, meldet sie sich erneut.\n\n' +
    'Zu viele dieser Mails? Unter Einstellungen → Meldungen lässt sich ' +
    'jede Sorte einzeln abschalten.', 'fertig');
};

const _fertigTodo = beideWelten('studios/{studioKey}/todos/{todoId}',
  _fertigPruefen, 'onWrite', { timeoutSeconds: 60 });
const _fertigPutz = beideWelten('studios/{studioKey}/cleaning/{putzId}',
  _fertigPruefen, 'onWrite', { timeoutSeconds: 60 });
exports.onTodoFertig = _fertigTodo.flach;
exports.onTodoFertigF = _fertigTodo.firma;
exports.onPutzFertig = _fertigPutz.flach;
exports.onPutzFertigF = _fertigPutz.firma;
/* ── Neue Ankündigung ── */
const _neuerAushang = async (snap, ctx) => {
    const a = snap.data() || {};
    const target = a.target || 'all';
    const tokens = await collectTokens(d => {
      if (!willHaben(d, 'ann')) return false;
      if (target === 'all') return true;
      return inStudio(d, target) || d.role === 'chef';
    }, a.uid, (ctx && ctx.params && ctx.params.firma) || null);
    await sendPush(tokens, '📣 ' + (a.from || 'Leitung'), a.text || '');
};
const _ann = beideWelten('announcements/{annId}', _neuerAushang);
exports.onNewAnnouncement = _ann.flach;
exports.onNewAnnouncementF = _ann.firma;

/* ── Neue Direktnachricht → Push an den Empfänger ── */
const _neueDm = async (snap, ctx) => {
    const m = snap.data() || {};
    const parts = String(ctx.params.dmId).split('_'); // ['dm', uidA, uidB]
    const peers = parts.slice(1);
    const recipient = peers.find(u => u !== m.uid);
    if (!recipient) return;
    const tokens = await collectTokens(
      d => d.uid === recipient && willHaben(d, 'dm'), m.uid, ctx.params.firma || null);
    const body = m.type === 'checklist' ? '📋 Checkliste' : (m.text || '');
    await sendPush(tokens, m.name || 'Neue Nachricht', body);
};
const _dm = beideWelten('dms/{dmId}/messages/{msgId}', _neueDm);
exports.onNewDm = _dm.flach;
exports.onNewDmF = _dm.firma;

/* ── Geburtstags-Logik (gemeinsam für den täglichen Lauf und den Test-Auslöser) ──
   Verschickt an alle, deren Geburtstag heute ist, einmal pro Jahr.
   Gibt die Anzahl der gesendeten Grüße zurück. */
async function processBirthdays() {
  const now = new Date();
  const mm = now.getMonth() + 1, dd = now.getDate(), year = now.getFullYear();
  // System-Account (Anzeige) sicherstellen. users bleibt oben — die
  // Firma steht IM Profil, nicht im Pfad.
  await db.collection('users').doc('system')
    .set({ name: 'Geburtstagsgruß 🎂', role: 'chef', system: true }, { merge: true });

  /* Der Glückwunsch landet im Chat DER Firma, zu der die Person gehört.
     Deshalb einmal die Firmenliste holen und je Profil zuordnen, statt
     über alle Firmen zu schleifen — das läse users sonst vierzehnmal. */
  const alle = await alleFirmen();
  const flach = alle.length === 1 && alle[0] === null;

  const snap = await db.collection('users').get();
  let sent = 0;
  for (const doc of snap.docs) {
    const u = doc.data() || {};
    if (!u.bday) continue;
    const p = String(u.bday).split('-');
    if (p.length < 3) continue;
    if (+p[1] !== mm || +p[2] !== dd || u.lastBdayDM === year) continue;

    const firma = flach ? null : (u.firma || 'koerperformen');
    /* Gesperrte oder unbekannte Firma: übergehen. Der flache Pfad wäre
       hier die falsche Rettung — dort liegen die Daten einer anderen. */
    if (!flach && alle.indexOf(firma) < 0) continue;
    const fName = await firmaAnzeigeName(firma);
    const gruss = fName + ' 🎂';

    const uid = doc.id;
    const dmId = 'dm_' + ['system', uid].sort().join('_');
    const ts = Date.now();
    await W(firma).collection('dms').doc(dmId).collection('messages').add({
      uid: 'system', name: gruss,
      /* Der Name der Firma statt eines festen: der Gruss kommt vom
         eigenen Betrieb, nicht von dem, fuer den die App gebaut wurde. */
      text: '🎉 Alles Gute zum Geburtstag, ' + (u.name || '') +
            '! Hab einen tollen Tag. – dein Team von ' + fName,
      ts: ts
    });
    const names = { system: gruss }; names[uid] = u.name || '';
    const readTs = { system: ts };
    await W(firma).collection('dms').doc(dmId).set({
      participants: ['system', uid], names: names,
      last: '🎉 Alles Gute zum Geburtstag!', lastTs: ts, lastSender: 'system', readTs: readTs
    }, { merge: true });
    // Push
    const tokens = await collectTokens(d => d.uid === uid, 'system', firma);
    await sendPush(tokens, gruss, 'Alles Gute zum Geburtstag! 🎉');
    await db.collection('users').doc(uid).update({ lastBdayDM: year });
    sent++;
  }
  return sent;
}

/* ── Täglicher Hinweis auf fällige Aufgaben (morgens um 7:30) ──
   Schaut in allen Studios nach offenen Aufgaben, die heute fällig sind oder
   schon überfällig, und schickt eine kurze Zusammenfassung an die Geräte
   des jeweiligen Studios. Zugewiesene Aufgaben gehen nur an die Person. */
exports.dueTaskReminder = region.pubsub
  .schedule('every day 07:30')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const limit = endOfDay.getTime();

    for (const firma of await alleFirmen()) {
    // Aufgaben abgeschaltet: dann auch keine Erinnerung an Aufgaben.
    if (!(await featureAn(firma, 'todos'))) continue;
    const studios = await W(firma).collection('studios').listDocuments();
    for (const studioRef of studios) {
      const snap = await studioRef.collection('todos').get();
      const offen = [];
      snap.forEach(doc => {
        const t = doc.data() || {};
        if (t.done) return;                  // erledigt (auch wiederkehrend, grob genug)
        if (!t.due || t.due > limit) return; // noch nicht fällig
        offen.push(t);
      });
      if (!offen.length) continue;

      const studioKey = studioRef.id;
      // Aufgaben mit fester Zuweisung getrennt behandeln
      const zugewiesen = offen.filter(t => t.assignedTo);
      const offenFuerAlle = offen.filter(t => !t.assignedTo);

      for (const t of zugewiesen) {
        const tk = await collectTokens(
          d => d.uid === t.assignedTo && willHaben(d, 'todos'), null, firma);
        await sendPush(tk, 'Aufgabe fällig', t.title || '');
      }
      if (offenFuerAlle.length) {
        const tk = await collectTokens(
          d => inStudio(d, studioKey) && willHaben(d, 'todos'), null, firma);
        const titel = offenFuerAlle.length === 1
          ? offenFuerAlle[0].title
          : offenFuerAlle.length + ' Aufgaben sind heute fällig';
        await sendPush(tk, 'Erinnerung', titel);
      }
    }
    }
    return null;
  });

/* ── Ablaufende Nachweise ──
   Erste-Hilfe-Kurs, Trainerlizenz, EMS-Einweisung, jedes mit eigenem
   Ablaufdatum.

   Gemeldet wird an genau drei Tagen: 60 und 14 Tage vorher und am Tag des
   Ablaufs. Nicht taeglich ab Tag 60 — eine Meldung, die 46-mal kommt, liest
   nach der dritten niemand mehr.

   Die Person bekommt ihre eigene Meldung, der Chef eine Sammelmeldung. Die
   Studio-Leitung bekommt nichts: Qualifikationsdaten gehen sie nichts an,
   so steht es auch in firestore.rules. */
const CERT_WARN_TAGE = [60, 14, 0];

exports.certExpiry = region
  .runWith({ timeoutSeconds: 120, memory: '256MB' })
  .pubsub.schedule('every day 08:15')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);

    for (const firma of await alleFirmen()) {
    let snap;
    try { snap = await W(firma).collection('certificates').get(); }
    catch (e) { console.error('Nachweise lesen:', e); continue; }

    const faellig = [];
    snap.forEach(doc => {
      const c = doc.data() || {};
      if (!c.bis) return;
      const bis = new Date(c.bis + 'T00:00:00');
      if (isNaN(bis.getTime())) return;
      const tage = Math.round((bis.getTime() - heute.getTime()) / 86400000);
      if (CERT_WARN_TAGE.indexOf(tage) < 0) return;
      faellig.push({ uid: c.uid, name: c.name || '', art: c.art || '', bez: c.bez || '', tage: tage });
    });
    if (!faellig.length) continue;

    const NAMEN = {
      ersthelfer: 'Erste-Hilfe-Kurs', trainer: 'Trainerlizenz', ems: 'EMS-Einweisung',
      hygiene: 'Hygieneschulung', brandschutz: 'Brandschutzhelfer', sonstiges: 'Nachweis'
    };
    const bezeichnung = c => (c.art === 'sonstiges' && c.bez) ? c.bez : (NAMEN[c.art] || 'Nachweis');
    const frist = t => t === 0 ? 'laeuft heute ab' : ('laeuft in ' + t + ' Tagen ab');

    // 1. Jede betroffene Person einzeln
    for (const c of faellig) {
      if (!c.uid) continue;
      try {
        const tk = await collectTokens(d => d.uid === c.uid, null, firma);
        await sendPush(tk, 'Nachweis ' + frist(c.tage), bezeichnung(c));
      } catch (e) { console.error('Nachweis-Push:', e); }
    }

    // 2. Der Chef einmal gesammelt
    try {
      const chefs = [];
      const users = await db.collection('users').get();
      users.forEach(d => {
        const u = d.data() || {};
        if (u.role === 'chef' && gehoertZu(u, firma)) chefs.push(d.id);
      });
      if (chefs.length) {
        const tk = await collectTokens(d => chefs.indexOf(d.uid) >= 0, null, firma);
        const text = faellig.length === 1
          ? (faellig[0].name + ': ' + bezeichnung(faellig[0]) + ' ' + frist(faellig[0].tage))
          : (faellig.length + ' Nachweise laufen demnaechst ab');
        await sendPush(tk, 'Nachweise', text);
      }
    } catch (e) { console.error('Nachweis-Chefmeldung:', e); }

    console.log('Nachweise' + (firma ? ' (' + firma + ')' : '') + ': ' +
      faellig.length + ' Meldungen verschickt.');
    }
    return null;
  });

/* ── Täglicher Geburtstagsgruß vom System-Account ── */
exports.birthdayGreetings = region.pubsub
  .schedule('every day 08:00')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    await processBirthdays();
    return null;
  });

/* ── TEST-Auslöser: führt den Geburtstags-Check sofort aus ──
   Aufruf:  .../runBirthdayCheckNow?key=GEHEIM
   Der Schlüssel kommt aus der Umgebungsvariable BDAY_TEST_KEY (functions/.env,
   die im GitHub-Workflow aus dem Secret BDAY_TEST_KEY geschrieben wird).
   Ohne korrekten Schlüssel: 403. */
exports.runBirthdayCheckNow = region.https.onRequest(async (req, res) => {
  const expected = process.env.BDAY_TEST_KEY || '';
  const got = String((req.query && req.query.key) || '');
  if (!expected || got !== expected) {
    res.status(403).send('Falscher oder fehlender Schlüssel.');
    return;
  }
  try {
    const sent = await processBirthdays();
    res.status(200).send('OK – Geburtstags-Check ausgeführt. Gesendete Grüße: ' + sent);
  } catch (e) {
    res.status(500).send('Fehler: ' + (e && e.message));
  }
});

/* ============================================================
   MARKETING-APP (marketing.html)
   Zwei geschützte KI-Funktionen über die Gemini-API. Der API-Schlüssel liegt
   nur auf dem Server (functions/.env), nie im Browser.
     marketingChat   Text-Modell (Ideen, Texte, Foto-Analyse)
     marketingImage  Bild-Modell
   ============================================================ */

/* Der Auftrag an das Modell. {firma} wird beim Aufruf ersetzt — hier darf
   kein Firmenname fest stehen, sonst laesst sich ein Kunde Werbetexte fuer
   einen fremden Betrieb schreiben und merkt es nicht: niemand prueft einen
   Text, den er selbst angefordert hat.

   Keine Ortsangabe: welche Standorte ein Betrieb hat, steht in seiner
   Studioliste. */
const MARKETING_SYSTEM_PROMPT =
  'Du bist der Marketing-Assistent des EMS-Studios "{firma}" (Body-Shaping, ' +
  '20-Minuten-EMS-Training, persönliche Betreuung, mehrere Standorte). ' +
  'Du hilfst dem Team bei Marketing-Kampagnen: Ideen, Konzepte, Post-Texte (Instagram, ' +
  'Facebook, Google), Flyer- und Plakat-Texte, Hashtags, Zielgruppen-Ansprache und ' +
  'Verbesserung bestehender Entwürfe. ' +
  'Antworte auf Deutsch. Sei konkret und direkt umsetzbar: liefere fertige Texte statt ' +
  'nur Ratschläge, nenne bei Post-Ideen immer Bildidee + Text + Hashtags, und passe ' +
  'Tonalität und Länge an den genannten Kanal an (Print = kurz und plakativ, ' +
  'Social = nahbar und aktivierend). Wenn ein Foto mitgeschickt wird, analysiere es ' +
  'konkret: Bildwirkung, Ausschnitt, Farben, Text-Overlay-Vorschläge und wofür es ' +
  'sich eignet. Formatiere mit kurzen Überschriften und Listen.';

/* Prüft Login und liefert eine saubere Fehlermeldung für die App */
function requireAuth(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Bitte zuerst einloggen.');
  }
}

/* ── Nur der Chef ──
   „Eingeloggt" ist bei dieser App KEINE Hürde: registrieren kann sich
   jeder selbst (Rolle Mitarbeiter). Für alles, was Geld kostet oder
   Betriebswissen preisgibt, reicht requireAuth deshalb nicht. */
async function requireChef(context) {
  requireAuth(context);
  const snap = await db.collection('users').doc(context.auth.uid).get();
  const rolle = snap.exists ? (snap.data() || {}).role : null;
  if (rolle !== 'chef') {
    throw new functions.https.HttpsError('permission-denied',
      'Dieser Bereich ist der Geschäftsführung vorbehalten.');
  }
  return snap.data() || {};
}

/* ══════════════════════════════════════════════════════════════════════
   BETREIBER-EBENE (Stufe D aus docs/MANDANT-PLAN.md)

   Nur fuer Konten mit admin:true. Das Feld ist bewusst kein Rollenwert: der
   Betreiber bleibt Chef seiner eigenen Firma und ist zusaetzlich Admin.
   Vergeben kann es nur ein Admin, erzwungen in firestore.rules.

   Diese Funktionen legen an, sperren und zaehlen. Sie lesen keinen Chat,
   keine Aufgaben und keine Personendaten fremder Firmen — dabei bleibt es.
   ══════════════════════════════════════════════════════════════════════ */
async function requireAdmin(context) {
  requireAuth(context);
  const snap = await db.collection('users').doc(context.auth.uid).get();
  if (!snap.exists || (snap.data() || {}).admin !== true) {
    throw new functions.https.HttpsError('permission-denied',
      'Dieser Bereich ist dem Betreiber vorbehalten.');
  }
  return snap.data();
}

/* Kennung aus einem Firmennamen. Mit Zufallsendung, damit man Kunden
   nicht durch Raten findet: die Kennung steht im Anmeldelink, und die
   Kundenliste gehoert niemandem ausser dem Betreiber. */
function firmaKennung(name) {
  const rein = String(name || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
  const zufall = Math.random().toString(36).slice(2, 6);
  return (rein || 'firma') + '-' + zufall;
}

/* ── Firma anlegen ──
   Firma, Anmeldekonto des ersten Chefs und dessen Profil in einem Zug:
   einzeln ist nichts davon brauchbar.

   Das Passwort wird hier erzeugt und einmal zurueckgegeben. Es wird nirgends
   gespeichert, weder in Firestore noch im Protokoll. */
exports.firmaAnlegen = region
  .https.onCall(async (data, context) => {
    await requireAdmin(context);
    const name = String((data && data.name) || '').trim();
    const email = String((data && data.email) || '').trim().toLowerCase();
    /* Wie viele Studios hat der Betrieb? Nicht jeder hat vierzehn.
       Voreinstellung 1: der haeufigste Fall ist ein einzelnes Studio,
       und anhaengen kann der Chef selbst jederzeit. */
    const anzahl = Math.min(50, Math.max(1, Math.floor(Number(
      (data && data.studios) || 1)) || 1));
    if (name.length < 2) {
      throw new functions.https.HttpsError('invalid-argument', 'Bitte einen Firmennamen angeben.');
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new functions.https.HttpsError('invalid-argument', 'Bitte eine gueltige E-Mail angeben.');
    }

    const kennung = firmaKennung(name);
    // Kennung schon vergeben? Bei vier Zufallszeichen unwahrscheinlich,
    // aber "unwahrscheinlich" ist kein Grund, es nicht zu pruefen.
    if ((await db.collection('firmen').doc(kennung).get()).exists) {
      throw new functions.https.HttpsError('already-exists',
        'Kennung bereits vergeben. Bitte noch einmal versuchen.');
    }

    /* Gibt es die Adresse schon? Dann NICHT stillschweigend
       weiterverwenden - das Konto gehoert bereits jemandem, womoeglich
       in einer anderen Firma. */
    let vorhanden = null;
    try { vorhanden = await admin.auth().getUserByEmail(email); } catch (e) { /* gut so */ }
    if (vorhanden) {
      throw new functions.https.HttpsError('already-exists',
        'Diese E-Mail hat bereits ein Konto. Bitte eine andere verwenden.');
    }

    // Passwort: lang genug, damit es nicht geraten wird, und aus einer
    // Zeichenmenge ohne Verwechslungsgefahr (kein l/I/0/O).
    const zeichen = 'abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ23456789';
    let passwort = '';
    for (let i = 0; i < 14; i++) {
      passwort += zeichen[Math.floor(Math.random() * zeichen.length)];
    }

    const konto = await admin.auth().createUser({
      email: email, password: passwort, displayName: 'Geschaeftsfuehrung',
    });

    await db.collection('firmen').doc(kennung).set({
      name: name,
      aktiv: true,
      angelegtAm: Date.now(),
      angelegtVon: context.auth.uid,
      zahlKonten: 1,
      zahlStudios: anzahl,
    });

    /* ── Die Studioliste MUSS hier entstehen ──
           Ohne dieses Dokument faellt die App auf KONFIG.studios zurueck, und
           das sind die vierzehn Standorte von Koerperformen. Ein neuer Kunde
           saehe beim ersten Anmelden die Standortliste eines fremden Betriebs.
    
           Die Namen sind neutral ("Studio 1"), umbenannt wird unter
           Verwaltung → Standorte. Die Kennungen (studio-0, studio-1, …) bleiben
           dabei stehen — daran haengen spaeter Aufgaben und Putzplaene. */
    const liste = [];
    for (let i = 0; i < anzahl; i++) {
      liste.push({ id: 'studio-' + i, name: 'Studio ' + (i + 1), aktiv: true });
    }
    await db.collection('firmen').doc(kennung)
      .collection('config').doc('studios')
      .set({ liste: liste, naechste: anzahl });

    await db.collection('users').doc(konto.uid).set({
      name: 'Geschaeftsfuehrung',
      email: email,
      role: 'chef',
      firma: kennung,
      studios: [],
      studioKeys: [],
      createdAt: Date.now(),
    });

    return { kennung: kennung, uid: konto.uid, passwort: passwort, studios: anzahl };
  });

/* ── Abo-Zustand setzen (Stufe A aus docs/ABO-PLAN.md) ────────────────
   Von Hand durch den Betreiber. Es fliesst kein Geld und es sperrt nichts —
   die App liest den Zustand und zeigt ihn an.

   Als Function statt als Regel, weil hier gepruefte Werte (Stufennamen,
   Betraege, Datum) und ein Vermerk hingehoeren, wer es gesetzt hat.

   'gratis' ist ein eigener Zustand, kein Preis von 0: eine Entscheidung,
   kein Zahlungsausfall — und darf nie in die Mahnstufen geraten. */
const ABO_STUFEN = ['basic', 'premium'];
const ABO_STATUS = ['aktiv', 'gratis', 'test', 'gekuendigt'];

exports.aboSetzen = region
  .https.onCall(async (data, context) => {
    const ich = await requireAdmin(context);
    const kennung = String((data && data.kennung) || '');
    const stufe = String((data && data.stufe) || '');
    const status = String((data && data.status) || '');
    if (!kennung) {
      throw new functions.https.HttpsError('invalid-argument', 'Keine Firma angegeben.');
    }
    if (ABO_STUFEN.indexOf(stufe) < 0) {
      throw new functions.https.HttpsError('invalid-argument',
        'Unbekannte Stufe. Moeglich: ' + ABO_STUFEN.join(', '));
    }
    if (ABO_STATUS.indexOf(status) < 0) {
      throw new functions.https.HttpsError('invalid-argument',
        'Unbekannter Zustand. Moeglich: ' + ABO_STATUS.join(', '));
    }
    if (!(await db.collection('firmen').doc(kennung).get()).exists) {
      throw new functions.https.HttpsError('not-found', 'Diese Firma gibt es nicht (mehr).');
    }

    /* Preise werden NETTO gefuehrt, die Steuer separat — auch solange
       sie 0 % ist. Wer Bruttopreise festschreibt, baut den Umstieg von
       Kleinunternehmer auf Regelbesteuerung spaeter muehsam nach.
       Begruendung in docs/ABO-PLAN.md, Abschnitt 5. */
    let netto = Number((data && data.netto) || 0);
    if (!isFinite(netto) || netto < 0) netto = 0;
    netto = Math.round(netto * 100) / 100;
    /* Gratis heisst gratis. Ein Gratis-Abo mit hinterlegtem Betrag
       waere eine Zeitbombe: sobald spaeter etwas abrechnet, was den
       Betrag liest, bekommt der Chef eine Rechnung, die ihm nie jemand
       angekuendigt hat. */
    if (status === 'gratis') netto = 0;

    let bisAm = (data && data.bisAm) ? Number(data.bisAm) : null;
    if (!bisAm || !isFinite(bisAm) || bisAm <= 0) bisAm = null;

    const eintrag = {
      stufe: stufe,
      status: status,
      netto: netto,
      bisAm: bisAm,                                  // null = unbefristet
      notiz: String((data && data.notiz) || '').slice(0, 300),
      gesetztVon: context.auth.uid,
      gesetztVonName: ich.name || '',
      gesetztAm: Date.now(),
    };
    await db.collection('firmen').doc(kennung)
      .collection('abo').doc('aktuell').set(eintrag);
    return Object.assign({ ok: true, kennung: kennung }, eintrag);
  });

/* ── Eine Firma löschen ───────────────────────────────────────────────
   Die Daten werden nicht angefasst. Sie bleiben unter firmen/<kennung>/…
   liegen, nur das Elterndokument wandert nach firmenArchiv. Danach findet
   .get() die Firma nicht mehr: alleFirmen() übergeht sie, die Regeln lassen
   niemanden hinein, sie verschwindet aus der Liste. (.get() sieht Dokumente
   ohne Elterneintrag nicht, listDocuments() schon — im Emulator gemessen
   und im Betrieb bestätigt.)

   Kein echtes Löschen, weil ein gekündigter Kunde zwei Wochen später anruft
   und noch eine Auswertung braucht. Endgültig entfernt wird von Hand mit
   einem Werkzeug, nicht mit einem Knopf in einer Oberfläche. */
exports.firmaLoeschen = region
  .https.onCall(async (data, context) => {
    const ich = await requireAdmin(context);
    const kennung = String((data && data.kennung) || '');
    if (!kennung) {
      throw new functions.https.HttpsError('invalid-argument', 'Keine Firma angegeben.');
    }
    /* Dieselbe Sperre wie beim Sperren: die eigene Firma nicht. Sonst
       loescht sich der Betreiber selbst heraus, und es gibt niemanden
       mehr, der ihn zurueckholt. */
    if (kennung === ich.firma) {
      throw new functions.https.HttpsError('failed-precondition',
        'Die eigene Firma kann nicht geloescht werden.');
    }
    const ref = db.collection('firmen').doc(kennung);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new functions.https.HttpsError('not-found', 'Diese Firma gibt es nicht (mehr).');
    }
    const daten = snap.data() || {};

    /* Zaehlen, BEVOR die Firma verschwindet — danach sieht man es nicht
       mehr, und im Archiv soll stehen, was da lag. */
    let konten = 0;
    try {
      const alle = await db.collection('users').get();
      konten = alle.docs.filter(d => (d.data() || {}).firma === kennung).length;
    } catch (e) { console.warn('Konten zaehlen:', e.message); }

    await db.collection('firmenArchiv').doc(kennung).set(Object.assign({}, daten, {
      geloeschtAm: Date.now(),
      geloeschtVon: context.auth.uid,
      zahlKontenBeimLoeschen: konten,
    }));
    await ref.delete();
    return { ok: true, kennung: kennung, konten: konten };
  });

/* ── … und zurückholen ──
   Der Gegenknopf. Ohne ihn waere der Papierkorb keiner. */
exports.firmaZurueckholen = region
  .https.onCall(async (data, context) => {
    await requireAdmin(context);
    const kennung = String((data && data.kennung) || '');
    if (!kennung) {
      throw new functions.https.HttpsError('invalid-argument', 'Keine Firma angegeben.');
    }
    const aRef = db.collection('firmenArchiv').doc(kennung);
    const snap = await aRef.get();
    if (!snap.exists) {
      throw new functions.https.HttpsError('not-found', 'Nichts im Archiv unter dieser Kennung.');
    }
    /* Nicht ueber eine laufende Firma druebersetzen. Kaeme es je dazu,
       waere die Kennung doppelt vergeben - und zwei Betriebe teilten
       sich einen Datenbestand. */
    if ((await db.collection('firmen').doc(kennung).get()).exists) {
      throw new functions.https.HttpsError('already-exists',
        'Unter dieser Kennung laeuft schon wieder eine Firma.');
    }
    const daten = snap.data() || {};
    delete daten.geloeschtAm;
    delete daten.geloeschtVon;
    delete daten.zahlKontenBeimLoeschen;
    daten.aktiv = true;
    daten.zurueckgeholtAm = Date.now();
    await db.collection('firmen').doc(kennung).set(daten);
    await aRef.delete();
    return { ok: true, kennung: kennung };
  });

/* ── Firma sperren oder wieder freigeben ──
   aktiv:false laesst niemanden mehr hinein. Die Daten bleiben
   unangetastet - fuer den Fall, dass eine Rechnung offen ist und
   danach doch bezahlt wird. */
exports.firmaSperren = region
  .https.onCall(async (data, context) => {
    const ich = await requireAdmin(context);
    const kennung = String((data && data.kennung) || '');
    const aktiv = (data && data.aktiv) === true;
    if (!kennung) {
      throw new functions.https.HttpsError('invalid-argument', 'Keine Firma angegeben.');
    }
    /* Die eigene Firma kann der Betreiber nicht sperren. Er saesse
       sonst selbst draussen, und niemand koennte ihn hereinlassen. */
    if (kennung === ich.firma) {
      throw new functions.https.HttpsError('failed-precondition',
        'Die eigene Firma kann nicht gesperrt werden.');
    }
    await db.collection('firmen').doc(kennung).set({ aktiv: aktiv }, { merge: true });
    return { ok: true, aktiv: aktiv };
  });

/* ── Zahlen fuer die Firmenliste ──
   Der Admin darf users nicht lesen - deshalb zaehlt diese Funktion fuer
   ihn. Sie gibt NUR Zahlen zurueck, keine Namen und keine Adressen. */
exports.firmenZahlen = region
  .https.onCall(async (data, context) => {
    await requireAdmin(context);
    const firmen = await db.collection('firmen').get();
    const nutzer = await db.collection('users').get();

    const zahlen = {};
    firmen.docs.forEach(f => { zahlen[f.id] = { konten: 0, letzte: 0 }; });
    nutzer.docs.forEach(u => {
      const d = u.data() || {};
      const f = d.firma || 'koerperformen';
      if (!zahlen[f]) return;
      zahlen[f].konten++;
      if ((d.lastSeen || 0) > zahlen[f].letzte) zahlen[f].letzte = d.lastSeen || 0;
    });

    // Studios je Firma
    await Promise.all(firmen.docs.map(async f => {
      try {
        const st = await db.collection('firmen').doc(f.id)
          .collection('config').doc('studios').get();
        const liste = st.exists ? (st.data().liste || []) : [];
        zahlen[f.id].studios = liste.filter(x => x && x.aktiv !== false).length;
      } catch (e) { zahlen[f.id].studios = 0; }
    }));
    return { zahlen: zahlen };
  });

/* ── Ist diese E-Mail-Adresse bestätigt? ──
   Der Chef soll vor der Freigabe sehen, ob eine Adresse echt ist. Die
   Information liegt in Firebase Auth, nicht in Firestore, und ein Client
   kann sie nur für sich selbst lesen — deshalb hier über das Admin-SDK.

   Der Client darf sich das Feld nicht selbst ins Profil schreiben: genau an
   der Stelle, an der die Angabe etwas wert sein soll, könnte er lügen.

   Zurück kommt nur ein Ja/Nein je Kennung. */
/* ══ Konten ohne Feld "firma" nachtragen ═══════════════════════════════
   users ist die einzige Sammlung ausserhalb von firmen/<kennung>/. Die
   Firmengrenze beim Lesen verlangt deshalb, dass Leser und Konto dieselbe
   Firma tragen — und dass die App gefiltert abfragt, weil Firestore Abfragen
   im Voraus prueft und nicht Dokument fuer Dokument.

   Konten aus der Zeit vor der Mandantenfaehigkeit haben das Feld nicht; fuer
   sie galt die stille Annahme "kein Feld = koerperformen". Diese Funktion
   schreibt sie hin.

   tools/firma-nachtragen.js tut dasselbe, braucht aber die Cloud Shell. Ein
   Wartungsschritt, der einen Rechner mit Google-Zugang voraussetzt, findet
   irgendwann nicht statt.

   Voreinstellung ist Ansehen; geschrieben wird nur mit wirklich:true. Konten
   einer anderen Firma werden nie angefasst — ein Werkzeug, das hier pauschal
   ueberschreibt, verschiebt Kunden in fremde Betriebe. */
exports.kontenNachtragen = region
  .runWith({ timeoutSeconds: 300 })
  .https.onCall(async (data, context) => {
    await requireAdmin(context);
    const firma = String((data && data.firma) || 'koerperformen').trim() || 'koerperformen';
    const wirklich = !!(data && data.wirklich);

    const snap = await db.collection('users').get();
    const ohne = [];
    const liste = [];
    let mit = 0, andere = 0;
    snap.forEach((d) => {
      const v = d.data() || {};
      const f = v.firma;
      if (f === undefined || f === null || String(f).trim() === '') {
        ohne.push(d.id);
        /* MIT NAMEN. Ein Werkzeug, das Konten einer Firma zuordnet, darf
           nicht nur "7 Stueck" melden: wer das druckt, ordnet blind zu.
           Unter den Konten ohne Feld koennen auch die eines Kunden
           sein. Hoechstens 50, damit die Antwort nicht ausufert. */
        if (liste.length < 50) {
          liste.push({
            name: String(v.name || '').slice(0, 60),
            email: String(v.email || '').slice(0, 80),
            rolle: String(v.role || '').slice(0, 20),
            angelegt: v.createdAt || null,
          });
        }
      } else if (f === firma) mit++;
      else andere++;
    });

    if (!wirklich || !ohne.length) {
      return { gesamt: snap.size, mit: mit, andere: andere,
               ohne: ohne.length, liste: liste, geschrieben: 0, firma: firma };
    }

    let geschrieben = 0;
    for (let i = 0; i < ohne.length; i += 400) {
      const stapel = db.batch();
      ohne.slice(i, i + 400).forEach((id) => {
        stapel.set(db.collection('users').doc(id), { firma: firma }, { merge: true });
      });
      await stapel.commit();
      geschrieben += Math.min(400, ohne.length - i);
    }

    /* Nachzaehlen statt behaupten. Bleibt etwas uebrig, sagt die Antwort
       das — und der naechste Schritt (strenge Regel) darf nicht kommen. */
    const nach = await db.collection('users').get();
    let restOhne = 0;
    nach.forEach((d) => {
      const f = (d.data() || {}).firma;
      if (f === undefined || f === null || String(f).trim() === '') restOhne++;
    });
    return { gesamt: nach.size, mit: mit + geschrieben, andere: andere,
             ohne: restOhne, geschrieben: geschrieben, firma: firma };
  });

exports.mailStatus = region
  .https.onCall(async (data, context) => {
    const ich = await requireChef(context);
    const uids = Array.isArray(data && data.uids) ? data.uids.slice(0, 50) : [];
    if (!uids.length) return { stand: {} };

    /* Firma pruefen, nicht nur die Rolle: mit requireChef allein konnte ein Chef
           beliebige Kennungen uebergeben und erfuhr, ob es das Konto gibt und ob
           dessen E-Mail bestaetigt ist — auch bei einem anderen Kunden. Jede
           Kennung wird deshalb erst gegen das eigene Team geprueft. */
    const meine = (ich || {}).firma || 'koerperformen';
    const profile = await db.getAll(
      ...uids.map((u) => db.collection('users').doc(String(u))));
    const erlaubt = {};
    profile.forEach((p) => {
      if (!p.exists) return;
      const f = (p.data() || {}).firma || 'koerperformen';
      if (f === meine) erlaubt[p.id] = true;
    });

    const stand = {};
    await Promise.all(uids.filter((u) => erlaubt[String(u)]).map(async (uid) => {
      try {
        const u = await admin.auth().getUser(String(uid));
        stand[uid] = !!u.emailVerified;
      } catch (e) {
        // Konto gibt es nicht mehr oder Kennung ist Unsinn: kein Grund,
        // den ganzen Aufruf scheitern zu lassen.
        stand[uid] = null;
      }
    }));
    return { stand: stand };
  });

/* ── Zugang wirklich entfernen ──
   Gemeldet aus dem Betrieb: „ich kann eine E-Mail, die ich schon benutzt
   und wieder geloescht habe, nicht noch einmal verwenden."

   Der Grund: „Zugang entfernen" loeschte nur das Profil in Firestore
   (users/<uid>). Das ANMELDEKONTO in Firebase Auth blieb stehen — und
   damit blieb die Adresse belegt. Beim naechsten Anlegen kam
   auth/email-already-in-use, und im Fenster stand eine Meldung, die man
   nicht deuten kann.

   Zweite, schlimmere Seite derselben Sache: der Bestaetigungstext sagte
   „Die Person kann sich danach nicht mehr anmelden." Das stimmte nicht.
   Anmelden ging weiter, es fehlte nur das Profil.

   Ein Profil zu loeschen kann der Chef selbst (firestore.rules). Ein
   Anmeldekonto zu loeschen kann nur der Server — deshalb diese Funktion.

   Drei Absicherungen, jede gegen einen konkreten Missbrauch:
     1. requireChef            kein Mitarbeiter loescht Zugaenge
     2. gleiche Firma          sonst loescht der Chef von A Konten bei B.
                               requireChef allein prueft nur die Rolle.
     3. nicht sich selbst      wer sich selbst entfernt, sperrt sich aus
                               und hinterlaesst eine Firma ohne Chef. */
exports.zugangEntfernen = region
  .https.onCall(async (data, context) => {
    const ich = await requireChef(context);
    const uid = String((data && data.uid) || '').trim();
    if (!uid) {
      throw new functions.https.HttpsError('invalid-argument', 'Keine Kennung angegeben.');
    }
    if (uid === context.auth.uid) {
      throw new functions.https.HttpsError('failed-precondition',
        'Den eigenen Zugang kann man hier nicht entfernen.');
    }

    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) {
      /* Kein Profil mehr, aber vielleicht noch ein Anmeldekonto — genau
         der Zustand, den die alte Fassung hinterlassen hat. Aufraeumen
         ist hier richtig, sonst bleibt die Adresse fuer immer belegt. */
      let weg = false;
      try { await admin.auth().deleteUser(uid); weg = true; } catch (e) { /* gab es nicht */ }
      return { profil: false, konto: weg };
    }

    const seine = (snap.data() || {}).firma || 'koerperformen';
    const meine = (ich || {}).firma || 'koerperformen';
    if (seine !== meine) {
      throw new functions.https.HttpsError('permission-denied',
        'Dieser Zugang gehört zu einem anderen Betrieb.');
    }

    /* Reihenfolge mit Absicht: erst das Anmeldekonto, dann das Profil.
       Andersherum bliebe bei einem Fehler in der Mitte genau der Zustand
       zurueck, den wir gerade abschaffen — Konto ohne Profil, Adresse
       belegt, niemand sieht es. */
    let konto = false;
    try { await admin.auth().deleteUser(uid); konto = true; }
    catch (e) {
      if (e && e.code !== 'auth/user-not-found') {
        console.error('zugangEntfernen, Auth:', e);
        throw new functions.https.HttpsError('internal',
          'Das Anmeldekonto liess sich nicht entfernen.');
      }
    }
    await db.collection('users').doc(uid).delete();
    return { profil: true, konto: konto };
  });

/* ── Eine belegte Adresse wieder freigeben ──
   Die Funktion oben verhindert neue Fälle. Die ALTEN bleiben: wer schon
   vor dieser Änderung jemanden entfernt hat, hat ein Anmeldekonto ohne
   Profil zurückgelassen — und dessen Adresse ist bis heute belegt. Beim
   Anlegen kommt auth/email-already-in-use, und niemand kann etwas dagegen
   tun, weil die Person in keiner Liste mehr steht.

   Freigegeben wird nur, was wirklich verwaist ist. Gibt es die Person
   noch, ist „freigeben" der falsche Weg — sie steht in der Team-Liste
   und wird dort entfernt, mit Rückfrage. Hier waere es ein Loeschen ohne
   Warnung. Und ein Konto einer anderen Firma bleibt tabu, sonst koennte
   ein Chef fremde Leute aussperren. */
exports.adresseFreigeben = region
  .https.onCall(async (data, context) => {
    const ich = await requireChef(context);
    const email = String((data && data.email) || '').trim().toLowerCase();
    if (!email || email.indexOf('@') < 1) {
      throw new functions.https.HttpsError('invalid-argument', 'Keine E-Mail-Adresse angegeben.');
    }

    let konto = null;
    try { konto = await admin.auth().getUserByEmail(email); }
    catch (e) { return { frei: true, nichtsZuTun: true }; }

    if (konto.uid === context.auth.uid) {
      throw new functions.https.HttpsError('failed-precondition',
        'Das ist die eigene Adresse.');
    }

    const snap = await db.collection('users').doc(konto.uid).get();
    if (snap.exists) {
      const seine = (snap.data() || {}).firma || 'koerperformen';
      const meine = (ich || {}).firma || 'koerperformen';
      if (seine !== meine) {
        throw new functions.https.HttpsError('permission-denied',
          'Diese Adresse gehört zu einem anderen Betrieb.');
      }
      throw new functions.https.HttpsError('failed-precondition',
        'Zu dieser Adresse gibt es noch einen Zugang im Team. ' +
        'Dort entfernen, dann ist sie frei.');
    }

    await admin.auth().deleteUser(konto.uid);
    return { frei: true, entfernt: konto.uid };
  });

/* ── Tagesgrenze für kostenpflichtige Aufrufe ──
   Das Projekt läuft auf Blaze, und eine Budget-Warnung warnt nur, sie stoppt
   nichts. Gezählt wird je Tag und je Art in einem Dokument. Die Grenze soll
   Unfälle abfangen (Fehler in einer Schleife, ein Nachmittag am
   Bild-Generator), nicht normale Arbeit behindern.

   Gezählt wird je Firma. Ein gemeinsamer Zähler wäre einfacher, würde aber
   den einen Kunden für den Übermut des anderen sperren. Das Gesamtrisiko
   (Kundenzahl × Grenze) steuert der Betreiber über die Zahl der Firmen. */
async function tagesGrenze(art, maximum, firma) {
  const tag = new Date().toISOString().slice(0, 10);
  const ref = W(firma).collection('config').doc('nutzung-' + tag);
  const stand = await db.runTransaction(async (t) => {
    const d = await t.get(ref);
    const alt = (d.exists ? d.data() : {}) || {};
    const neu = (alt[art] || 0) + 1;
    t.set(ref, Object.assign({}, alt, { [art]: neu, tag: tag }), { merge: true });
    return neu;
  });
  if (stand > maximum) {
    throw new functions.https.HttpsError('resource-exhausted',
      'Für heute ist die Grenze von ' + maximum + ' Aufrufen erreicht (' + art + '). ' +
      'Das ist eine Kostenbremse, kein Fehler – morgen geht es weiter.');
  }
  return stand;
}

/* Nachrichten aus der App validieren/begrenzen (Text + optionale Bilder) */
function sanitizeMessages(raw) {
  const msgs = Array.isArray(raw) ? raw.slice(-24) : [];
  const out = [];
  for (const m of msgs) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    if (typeof m.content === 'string') {
      out.push({ role: m.role, content: m.content.slice(0, 20000) });
    } else if (Array.isArray(m.content)) {
      const blocks = [];
      for (const b of m.content.slice(0, 6)) {
        if (!b) continue;
        if (b.type === 'text' && typeof b.text === 'string') {
          blocks.push({ type: 'text', text: b.text.slice(0, 20000) });
        } else if (b.type === 'image' && b.source && b.source.type === 'base64'
          && typeof b.source.data === 'string'
          && ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].indexOf(b.source.media_type) >= 0) {
          blocks.push({
            type: 'image',
            source: { type: 'base64', media_type: b.source.media_type, data: b.source.data }
          });
        }
      }
      if (blocks.length) out.push({ role: m.role, content: blocks });
    }
  }
  return out;
}

/* Unsere App-Nachrichtenform ({role, content}) in Geminis "contents"-Form
   übersetzen: role "assistant" → "model", Bild-Blöcke → inlineData. */
function toGeminiContents(messages) {
  return messages.map(m => {
    const role = m.role === 'assistant' ? 'model' : 'user';
    if (typeof m.content === 'string') {
      return { role, parts: [{ text: m.content }] };
    }
    const parts = m.content.map(b => {
      if (b.type === 'text') return { text: b.text };
      return { inlineData: { mimeType: b.source.media_type, data: b.source.data } };
    });
    return { role, parts };
  });
}

/* ── KI-Chat: Ideen, Texte, Foto-Analyse (Gemini) ── */
exports.marketingChat = region
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onCall(async (data, context) => {
    // requireChef, nicht requireAuth: sonst benutzt jeder selbst
    // registrierte Zugang den Gemini-Schluessel der Firma.
    const profil = await requireChef(context);
    /* Einmal ermitteln und wiederverwenden: die Firma wird gleich
       zweimal gebraucht (Tagesgrenze und Auftrag ans Modell), und
       firmaVonProfil() prueft dabei auch, ob die Firma stillgelegt
       ist. Zweimal aufrufen hiesse zweimal lesen fuer dieselbe
       Antwort. */
    const firma = await firmaVonProfil(profil);
    await tagesGrenze('marketingChat', 200, firma);
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new functions.https.HttpsError('failed-precondition',
        'GEMINI_API_KEY fehlt. Bitte als GitHub-Secret hinterlegen und Functions neu deployen (siehe ANLEITUNG-MARKETING.txt).');
    }
    const messages = sanitizeMessages(data && data.messages);
    if (!messages.length) {
      throw new functions.https.HttpsError('invalid-argument', 'Keine Nachricht übergeben.');
    }
    const body = {
      systemInstruction: { parts: [{ text: MARKETING_SYSTEM_PROMPT.replace(/\{firma\}/g, await firmaAnzeigeName(firma)) }] },
      contents: toGeminiContents(messages)
    };
    try {
      const resp = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify(body)
        }
      );
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        console.error('marketingChat HTTP ' + resp.status + ':', JSON.stringify(json).slice(0, 500));
        const msg = resp.status === 429
          ? 'Zu viele Anfragen – bitte kurz warten und erneut versuchen.'
          : 'KI-Anfrage fehlgeschlagen (' + resp.status + '): ' + ((json.error && json.error.message) || 'Unbekannter Fehler');
        throw new functions.https.HttpsError('internal', msg);
      }
      if (json.promptFeedback && json.promptFeedback.blockReason) {
        throw new functions.https.HttpsError('failed-precondition',
          'Die KI hat diese Anfrage abgelehnt. Bitte anders formulieren.');
      }
      const parts = (json.candidates && json.candidates[0] && json.candidates[0].content
        && json.candidates[0].content.parts) || [];
      const text = parts.filter(p => typeof p.text === 'string').map(p => p.text).join('\n').trim();
      return { text: text || 'Keine Antwort erhalten – bitte erneut versuchen.' };
    } catch (e) {
      if (e instanceof functions.https.HttpsError) throw e;
      console.error('marketingChat:', e);
      throw new functions.https.HttpsError('internal',
        'KI-Anfrage fehlgeschlagen: ' + ((e && e.message) || 'Unbekannter Fehler'));
    }
  });

/* Ziel-Pixelmaße pro Seitenverhältnis (lange Kante ~1200-1440px, gut für Social + Web-Vorschau) */
const ASPECT_DIMENSIONS = {
  '1:1':  { w: 1024, h: 1024 },
  '3:4':  { w: 900,  h: 1200 },
  '4:3':  { w: 1200, h: 900  },
  '9:16': { w: 810,  h: 1440 },
  '16:9': { w: 1440, h: 810  }
};
/* Automatischer Qualitäts-Zusatz zum Prompt – deutlich bessere, plakativere
   Ergebnisse als ein reiner Nutzer-Prompt (Pollinations braucht diese Hinweise). */
const IMAGE_QUALITY_SUFFIX =
  ', professionelle Werbefotografie, hochwertig, gestochen scharf, natürliches Licht, ' +
  'ansprechende Bildkomposition, hohe Auflösung, realistisch, kein Text im Bild';

/* ── Bild-Generierung (Pollinations.ai) ──
   Komplett kostenlos, kein Billing/Kreditkarte nötig. Liefert { mime, data } (Base64).
   aspect ist optional: "1:1", "3:4", "4:3", "9:16", "16:9". */
exports.marketingImage = region
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onCall(async (data, context) => {
    // Bilder sind der teuerste Aufruf im Projekt - hier zuerst pruefen.
    const profil = await requireChef(context);
    await tagesGrenze('marketingImage', 50, await firmaVonProfil(profil));
    const prompt = String((data && data.prompt) || '').slice(0, 4000).trim();
    if (!prompt) {
      throw new functions.https.HttpsError('invalid-argument', 'Bitte eine Bildbeschreibung eingeben.');
    }
    const aspect = String((data && data.aspect) || '');
    const dims = ASPECT_DIMENSIONS[aspect] || ASPECT_DIMENSIONS['1:1'];
    const seed = Math.floor(Math.random() * 1e9); // verhindert, dass gleiche Prompts immer dasselbe Bild liefern
    const fullPrompt = (prompt + IMAGE_QUALITY_SUFFIX).slice(0, 4000);
    const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(fullPrompt) +
      '?width=' + dims.w + '&height=' + dims.h + '&seed=' + seed +
      '&nologo=true&enhance=true&model=flux-realism';
    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        console.error('marketingImage HTTP ' + resp.status);
        throw new functions.https.HttpsError('internal',
          'Bild-Generierung fehlgeschlagen (' + resp.status + '). Bitte kurz warten und erneut versuchen.');
      }
      const buf = Buffer.from(await resp.arrayBuffer());
      if (!buf.length) {
        throw new functions.https.HttpsError('internal', 'Es wurde kein Bild erzeugt. Bitte erneut versuchen.');
      }
      return {
        mime: resp.headers.get('content-type') || 'image/jpeg',
        data: buf.toString('base64')
      };
    } catch (e) {
      if (e instanceof functions.https.HttpsError) throw e;
      console.error('marketingImage:', e);
      throw new functions.https.HttpsError('internal',
        'Bild-Generierung fehlgeschlagen: ' + ((e && e.message) || 'Unbekannter Fehler'));
    }
  });

/* ============================================================
   GOOGLE-TABELLE (Material und Putzplan)

   Bis 13.8.2026 hat der Browser direkt an die Apps-Script-Web-App
   gesendet. Deren Adresse stand dafür in konfig.js, also im Quelltext,
   den jeder Besucher bekommt — und doPost hat nichts geprüft. Wer die
   Adresse las, konnte in die Tabelle schreiben.

   Ein Token im Browser hätte daran nichts geändert: es stünde neben der
   Adresse. Deshalb geht der Abgleich jetzt über diese Function. Sie
   prüft Anmeldung und Firma, baut die Nutzlast neu auf und legt das
   Token dazu, das nur hier liegt (functions/.env aus GitHub-Secrets).

   Die Adresse selbst ist kein Geheimnis und war nie eines; sie steht
   unten als Rückfall, damit der Abgleich nicht stehenbleibt, solange
   SHEETS_URL nicht gesetzt ist. Geschützt wird über das Token.
   ============================================================ */

const SHEETS_ADRESSE_RUECKFALL =
  'https://script.google.com/macros/s/AKfycbygK9l443-M3GBhVDYTZQ0tNkGRvSRWYMgeOn6ksNdBDLMb6uc21Vm_20XfyUeibXu_aw/exec';

/* SHEETS_FIRMA: welcher Kundschaft die Tabelle gehört. Ohne diese Grenze
   würde ein zweiter Kunde auf derselben Installation seine Studios in
   die Tabelle von Körperformen schreiben. */
function sheetsZiel() {
  return {
    url: (process.env.SHEETS_URL || SHEETS_ADRESSE_RUECKFALL).trim(),
    token: (process.env.SHEETS_TOKEN || '').trim(),
    firma: (process.env.SHEETS_FIRMA || 'koerperformen').trim(),
  };
}

/* Steuerzeichen raus und harte Obergrenze: was hier durchgeht, landet in
   einer Tabellenzelle. */
function sheetsText(wert, maxLaenge) {
  return String(wert === undefined || wert === null ? '' : wert)
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .slice(0, maxLaenge);
}
function sheetsZahl(wert) {
  const n = Number(wert);
  return Number.isFinite(n) ? Math.max(0, Math.min(999999, Math.round(n))) : 0;
}

const SHEETS_MAX_STUDIOS = 60;
const SHEETS_MAX_ZEILEN = 500;

/* Die Nutzlast wird neu gebaut, nicht durchgereicht: nur diese Felder
   erreichen die Tabelle, in dieser Länge, mit diesen Typen. Ein
   zusätzliches Feld aus dem Browser fällt dabei weg. */
function sheetsMaterialStudio(roh, wer, wann) {
  return {
    studio: sheetsText(roh.studio, 80),
    studioKey: sheetsText(roh.studioKey, 80),
    items: (Array.isArray(roh.items) ? roh.items : [])
      .slice(0, SHEETS_MAX_ZEILEN)
      .map(it => ({
        name: sheetsText(it && it.name, 200),
        have: sheetsZahl(it && it.have),
        need: sheetsZahl(it && it.need),
      })),
    updatedBy: wer,
    ts: wann,
  };
}

function sheetsPutzStudio(roh, wer, wann) {
  return {
    studio: sheetsText(roh.studio, 80),
    studioKey: sheetsText(roh.studioKey, 80),
    tasks: (Array.isArray(roh.tasks) ? roh.tasks : [])
      .slice(0, SHEETS_MAX_ZEILEN)
      .map(t => ({
        title: sheetsText(t && t.title, 300),
        wiederholung: sheetsText(t && t.wiederholung, 60),
        status: sheetsText(t && t.status, 20),
        erledigtVon: sheetsText(t && t.erledigtVon, 80),
        kuerzel: sheetsText(t && t.kuerzel, 20),
        zeitpunkt: sheetsText(t && t.zeitpunkt, 40),
      })),
    notes: (Array.isArray(roh.notes) ? roh.notes : [])
      .slice(0, SHEETS_MAX_ZEILEN)
      .map(n => ({
        text: sheetsText(n && n.text, 1000),
        by: sheetsText(n && n.by, 80),
        kuerzel: sheetsText(n && n.kuerzel, 20),
        zeit: sheetsText(n && n.zeit, 40),
      })),
    updatedBy: wer,
    ts: wann,
  };
}

/* ── Abgleich anstoßen ──
   Die App schickt { art: 'material' | 'putzplan', studios: [...] } — ein
   Studio oder alle, dieselbe Form. Weitergegeben wird immer die
   Sammelform der Web-App; sie ersetzt die Zeilen der genannten Studios
   und lässt alle anderen stehen. */
exports.sheetsPush = region
  .runWith({ timeoutSeconds: 120 })
  .https.onCall(async (data, context) => {
    requireAuth(context);
    const snap = await db.collection('users').doc(context.auth.uid).get();
    const profil = snap.exists ? (snap.data() || {}) : null;
    /* aktiv:false heisst: wartet auf die Freigabe des Chefs. Ein solches
       Konto sieht in der App nichts und schreibt hier auch nichts. */
    if (!profil || profil.aktiv === false) {
      throw new functions.https.HttpsError('permission-denied',
        'Dieses Konto ist nicht freigeschaltet.');
    }
    const firma = await firmaVonProfil(profil);
    const ziel = sheetsZiel();
    if (!ziel.url) return { ok: false, grund: 'nicht-eingerichtet' };
    if ((firma || 'koerperformen') !== ziel.firma) {
      return { ok: false, grund: 'keine-tabelle' };
    }

    const art = String((data && data.art) || '');
    if (art !== 'material' && art !== 'putzplan') {
      throw new functions.https.HttpsError('invalid-argument',
        'Unbekannte Art: ' + art.slice(0, 40));
    }
    const roh = Array.isArray(data && data.studios) ? data.studios : [];
    if (!roh.length) return { ok: false, grund: 'nichts-zu-senden' };

    /* Kostenbremse wie bei den KI-Aufrufen, hier gegen das Tageskontingent
       von Apps Script (rund 90 Minuten). Ein Fehler in einer Schleife
       würde sonst den echten Abgleich für den Rest des Tages lahmlegen. */
    await tagesGrenze('sheetsPush', 3000, firma);

    const wer = sheetsText(profil.name, 80);
    const wann = Date.now();
    const studios = roh.slice(0, SHEETS_MAX_STUDIOS)
      .filter(s => s && typeof s === 'object')
      .map(s => art === 'material'
        ? sheetsMaterialStudio(s, wer, wann)
        : sheetsPutzStudio(s, wer, wann))
      .filter(s => s.studio || s.studioKey);
    if (!studios.length) return { ok: false, grund: 'nichts-zu-senden' };

    const nutzlast = {
      type: art === 'material' ? 'material-alle' : 'putzplan-alle',
      token: ziel.token,
      studios: studios,
    };

    try {
      const antwort = await fetch(ziel.url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(nutzlast),
      });
      const text = (await antwort.text().catch(() => '')).slice(0, 300);
      if (!antwort.ok) {
        console.error('sheetsPush HTTP ' + antwort.status + ': ' + text);
        throw new functions.https.HttpsError('internal',
          'Die Tabelle hat abgelehnt (' + antwort.status + ').');
      }
      /* Apps Script antwortet auch bei eigenen Fehlern mit 200 — deshalb
         wird der Text angesehen. "Token" heisst: das Geheimnis in
         functions/.env passt nicht zu dem im Skript. */
      if (/^Fehler/i.test(text)) {
        console.error('sheetsPush: ' + text);
        throw new functions.https.HttpsError('internal', text);
      }
      return { ok: true, studios: studios.length, antwort: text };
    } catch (e) {
      if (e instanceof functions.https.HttpsError) throw e;
      console.error('sheetsPush:', e);
      throw new functions.https.HttpsError('internal',
        'Abgleich fehlgeschlagen: ' + ((e && e.message) || 'Unbekannter Fehler'));
    }
  });

/* ============================================================
   WACHSTUM & BETRIEB (wachstum.html) – Termin-E-Mails
   Bestätigung beim Anlegen und beim Verschieben, Storno-Nachricht,
   Erinnerung X Stunden vorher und Follow-up danach.

   Versand über SMTP (Nodemailer); Zugangsdaten nur in functions/.env aus
   den GitHub-Secrets, nie im Browser. Einrichtung: docs/MAIL-SETUP.md.
   ============================================================ */

const nodemailer = require('nodemailer');

/* Wie viele Stunden vor dem Termin erinnert bzw. danach nachgefasst wird.
   Über functions/.env änderbar (REMINDER_HOURS / FOLLOWUP_HOURS). */
function reminderHours() { return +(process.env.REMINDER_HOURS || 24) || 24; }
function followupHours() { return +(process.env.FOLLOWUP_HOURS || 3) || 3; }

/* ── Mail an Konten dieser App ────────────────────────────────────────
   Nicht an Endkunden (das macht sendApptMail), sondern an das eigene
   Team: neue Aufgabe, Studio fertig.

   Die Adresse kommt aus Firebase Auth, nicht aus dem Profil: im Profil
   steht sie nur, wenn sie beim Anlegen mitgegeben wurde, und sie kann
   veraltet sein. Auth ist die Stelle, an der man sich wirklich anmeldet.

   Ohne SMTP-Zugang passiert nichts und es wird auch nichts behauptet —
   die Funktion sagt, wie viele Mails wirklich rausgingen. */
async function adressenVon(uids) {
  const raus = [];
  for (const uid of [...new Set(uids)].slice(0, 60)) {
    try {
      const u = await admin.auth().getUser(String(uid));
      if (u && u.email) raus.push(u.email);
    } catch (e) { /* Konto geloescht: dann eben keine Mail */ }
  }
  return raus;
}

/* ── Wer will diese Sorte Mail ueberhaupt? ──
   Aus dem Betrieb: „nicht JEDER Chef soll jede Mail zu jedem Thema
   bekommen." Bei 14 Studios heisst „Studio fertig" bis zu 14 Mails am
   Tag — an jeden Chef.

   Umgesetzt als LISTE DER ABGESCHALTETEN Themen, nicht der
   eingeschalteten. Der Unterschied ist wichtig: ein fehlendes Feld
   bedeutet damit „alles an", und der Bestand verhaelt sich unveraendert.
   Waere es andersherum, bekaeme nach dem Ausrollen niemand mehr etwas,
   bis alle zwoelf Konten von Hand nachgepflegt sind — und gemerkt haette
   es erst, wer eine Mail vermisst.

   Die Sperre liegt am Profil, nicht am Geraet: eine Mail geht an eine
   Adresse, nicht an ein Handy. Der Push-Schalter unter „Meldungen"
   bleibt davon unberuehrt und gilt weiter je Geraet. */
async function mailWillHaben(uids, thema) {
  if (!thema) return uids;
  const raus = [];
  for (const uid of [...new Set(uids)]) {
    try {
      const d = await db.collection('users').doc(String(uid)).get();
      const aus = (d.exists && d.data() && d.data().mailAus) || [];
      if (!Array.isArray(aus) || aus.indexOf(thema) < 0) raus.push(uid);
    } catch (e) {
      /* Profil nicht lesbar: dann lieber senden als stillschweigend
         verschlucken. Eine Mail zu viel merkt man, eine zu wenig nicht. */
      raus.push(uid);
    }
  }
  return raus;
}

async function teamMail(firma, uids, betreff, text, thema) {
  const mailer = getMailer();
  if (!mailer) return 0;
  const gewollt = await mailWillHaben(uids, thema);
  if (!gewollt.length) return 0;
  const adressen = await adressenVon(gewollt);
  if (!adressen.length) return 0;
  const von = process.env.MAIL_FROM || process.env.SMTP_USER;
  const name = await firmaAnzeigeName(firma);
  let gesendet = 0;
  for (const an of adressen) {
    try {
      await mailer.sendMail({
        from: '"' + name + '" <' + von + '>',
        to: an,
        subject: betreff,
        text: text,
      });
      gesendet++;
    } catch (e) {
      console.error('teamMail an ' + an + ':', e.message);
    }
  }
  return gesendet;
}

/* Konten eines Studios: aktiv, gehoert zur Firma, ist dem Studio
   zugeteilt. Der Chef zaehlt nicht mit — er bekommt eigene Meldungen. */
async function kontenImStudio(firma, studioKey, nurRolle) {
  const snap = await db.collection('users').get();
  const raus = [];
  snap.forEach((doc) => {
    const d = doc.data() || {};
    if (d.aktiv === false) return;
    if (!gehoertZu(d, firma)) return;
    if (nurRolle && d.role !== nurRolle) return;
    if (studioKey) {
      const keys = Array.isArray(d.studioKeys) ? d.studioKeys : [];
      if (keys.indexOf(studioKey) < 0) return;
    }
    raus.push(doc.id);
  });
  return raus;
}

/* ══ Anzeigename einer Firma ══════════════════════════════════════════
   Nicht die Kennung (die steht in den Pfaden), sondern der Name, den ein
   Mensch liest. Gebraucht in allem, was das Haus verlaesst: Terminmails,
   Absender, Geburtstagsgruss, Auftrag an das KI-Modell.

   Nirgends davon darf ein Name fest stehen. Terminmails gehen automatisch
   an die Endkunden des Studios, ohne dass jemand sie vorher liest.

   Zwischengespeichert je Aufruf: ein Zeitplan verschickt Dutzende Mails,
   und der Name aendert sich einmal im Jahr. */
const _firmaNamen = {};
async function firmaAnzeigeName(firma) {
  const key = firma || '_flach';
  if (_firmaNamen[key] !== undefined) return _firmaNamen[key];
  let name = '';
  if (firma) {
    try {
      const d = await db.collection('firmen').doc(firma).get();
      if (d.exists) name = String((d.data() || {}).name || '');
    } catch (e) { console.warn('Firmenname (' + firma + '):', e.message); }
  }
  /* Ohne Firma (flacher Betrieb vor dem Umzug) oder ohne Namen im
     Dokument bleibt es beim bisherigen Wert — sonst stuenden ploetzlich
     namenlose Mails im Postfach von Kundinnen. */
  _firmaNamen[key] = name || 'Körperformen';
  return _firmaNamen[key];
}

/* Standard-Vorlagen. Der Chef kann sie in wachstum.html (Tab "E-Mails")
   überschreiben – die überschriebenen Fassungen liegen in Firestore unter
   emailTemplates/<id> und gewinnen gegen diese Standards.
   Platzhalter: {name} {firma} {studio} {datum} {uhrzeit} {notiz} */
const MAIL_DEFAULTS = {
  confirm: {
    subject: 'Terminbestätigung – {firma} {studio}',
    body: 'Hallo {name},\n\nhiermit bestätigen wir deinen Termin im Studio {studio} von {firma}:\n\nDatum: {datum}\nUhrzeit: {uhrzeit} Uhr\n{notiz}\nBitte komm ein paar Minuten früher und bring bequeme Kleidung mit.\nFalls du den Termin nicht wahrnehmen kannst, gib uns bitte rechtzeitig Bescheid.\n\nBis bald!\nDein Team von {firma} · {studio}'
  },
  reminder: {
    subject: 'Erinnerung: dein Termin morgen – {firma} {studio}',
    body: 'Hallo {name},\n\nkleine Erinnerung an deinen Termin im Studio {studio} von {firma}:\n\nDatum: {datum}\nUhrzeit: {uhrzeit} Uhr\n\nWir freuen uns auf dich!\nDein Team von {firma} · {studio}'
  },
  followup: {
    subject: 'Danke für deinen Besuch – {firma} {studio}',
    body: 'Hallo {name},\n\ndanke, dass du heute bei uns im Studio {studio} warst – stark gemacht!\nDenk daran, ausreichend zu trinken. Muskelkater in den nächsten Tagen ist völlig normal.\n\nWenn dir das Training gefallen hat, empfiehl uns gern weiter.\nBis zum nächsten Mal!\n\nDein Team von {firma} · {studio}'
  },
  cancel: {
    subject: 'Termin storniert – {firma} {studio}',
    body: 'Hallo {name},\n\ndein Termin am {datum} um {uhrzeit} Uhr im Studio {studio} wurde storniert.\nWenn das ein Versehen war oder du einen neuen Termin möchtest, melde dich gern bei uns.\n\nDein Team von {firma} · {studio}'
  }
};

/* SMTP-Verbindung aus der Umgebung. Fehlen die Zugangsdaten, wird nichts
   versendet (die Termin-Verwaltung funktioniert trotzdem). */
let _mailer = null;
function getMailer() {
  if (_mailer) return _mailer;
  const host = process.env.SMTP_HOST || '';
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  if (!host || !user || !pass) return null;
  const port = +(process.env.SMTP_PORT || 587) || 587;
  _mailer = nodemailer.createTransport({
    host, port,
    secure: port === 465,
    auth: { user, pass }
  });
  return _mailer;
}

/* Vorlage laden (Firestore-Überschreibung → sonst Standard) und Platzhalter füllen */
async function buildMail(tplId, appt, firma) {
  let tpl = MAIL_DEFAULTS[tplId];
  try {
    const snap = await W(firma).collection('emailTemplates').doc(tplId).get();
    if (snap.exists) {
      const d = snap.data() || {};
      if (d.subject && d.body) tpl = { subject: String(d.subject), body: String(d.body) };
    }
  } catch (e) { console.error('emailTemplates/' + tplId + ':', e); }
  const when = new Date(+appt.startsAt || 0);
  const fmt = (opt) => when.toLocaleString('de-DE', Object.assign({ timeZone: 'Europe/Berlin' }, opt));
  const vals = {
    name: appt.customerName || '',
    firma: await firmaAnzeigeName(firma),
    studio: appt.studioName || '',
    datum: fmt({ weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
    uhrzeit: fmt({ hour: '2-digit', minute: '2-digit' }),
    notiz: appt.note ? ('Hinweis: ' + appt.note + '\n') : ''
  };
  const fill = (s) => String(s).replace(/\{(name|firma|studio|datum|uhrzeit|notiz)\}/g, (m, k) => vals[k]);
  return { subject: fill(tpl.subject), text: fill(tpl.body) };
}

/* E-Mail an die Kundin/den Kunden senden und den Versand am Termin vermerken.
   markField z. B. 'mailConfirmedAt' – verhindert Doppel-Versand. */
async function sendApptMail(apptRef, appt, tplId, markField, firma) {
  if (!appt.customerEmail) return false;
  const mailer = getMailer();
  if (!mailer) {
    console.log('E-Mail übersprungen (SMTP nicht konfiguriert):', tplId, apptRef.id);
    return false;
  }
  const mail = await buildMail(tplId, appt, firma);
  const fromAddr = process.env.MAIL_FROM || process.env.SMTP_USER;
  await mailer.sendMail({
    /* Der Absendername steht im Postfach der Kundin — die auffaelligste
       Stelle ueberhaupt. */
    from: '"' + (await firmaAnzeigeName(firma)) + ' ' + (appt.studioName || '') + '" <' + fromAddr + '>',
    to: appt.customerEmail,
    subject: mail.subject,
    text: mail.text
  });
  const patch = {}; patch[markField] = Date.now();
  await apptRef.update(patch).catch(() => {});
  return true;
}

/* ── Termin angelegt → Bestätigung ── */
const _neuerTermin = async (snap, ctx) => {
    const a = snap.data() || {};
    if (a.status === 'storniert') return;
    try { await sendApptMail(snap.ref, a, 'confirm', 'mailConfirmedAt', ctx.params.firma || null); }
    catch (e) { console.error('Bestätigungs-Mail:', e); }
};
const _appt = beideWelten('appointments/{apptId}', _neuerTermin, 'onCreate', { timeoutSeconds: 60 });
exports.onAppointmentCreated = _appt.flach;
exports.onAppointmentCreatedF = _appt.firma;

/* ── Termin geändert → Storno-Mail bzw. neue Bestätigung bei Verschiebung ── */
const _terminGeaendert = async (change, ctx) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    const firma = ctx.params.firma || null;
    try {
      // Stornierung: einmalig Storno-Mail
      if (after.status === 'storniert' && before.status !== 'storniert' && !after.mailCancelledAt) {
        await sendApptMail(change.after.ref, after, 'cancel', 'mailCancelledAt', firma);
        return;
      }
      // Verschiebung eines aktiven Termins: Bestätigung mit neuer Zeit,
      // Erinnerung/Follow-up für die neue Zeit wieder freigeben
      if (after.status !== 'storniert' && +after.startsAt !== +before.startsAt) {
        await change.after.ref.update({
          mailRemindedAt: admin.firestore.FieldValue.delete(),
          mailFollowupAt: admin.firestore.FieldValue.delete()
        }).catch(() => {});
        await sendApptMail(change.after.ref, after, 'confirm', 'mailConfirmedAt', firma);
      }
    } catch (e) { console.error('Termin-Update-Mail:', e); }
};
const _apptUp = beideWelten('appointments/{apptId}', _terminGeaendert, 'onUpdate', { timeoutSeconds: 60 });
exports.onAppointmentUpdated = _apptUp.flach;
exports.onAppointmentUpdatedF = _apptUp.firma;

/* ── Zeitplan: Erinnerungen vorher + Follow-ups danach ──
   Läuft alle 30 Minuten und arbeitet ein Zeitfenster ab; Doppel-Versand
   wird über mailRemindedAt / mailFollowupAt verhindert. */
exports.appointmentMailScheduler = region
  .runWith({ timeoutSeconds: 300 })
  .pubsub.schedule('every 30 minutes')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    const now = Date.now();
    const H = 3600000;

    /* Beide Welten, nicht nur die Firmen-Pfade: wachstum.html schreibt
       Termine weiterhin flach. Siehe alleFirmenUndFlach(). */
    for (const firma of await alleFirmenUndFlach()) {
    // Erinnerungen: Termine innerhalb der nächsten REMINDER_HOURS Stunden
    const remSnap = await W(firma).collection('appointments')
      .where('startsAt', '>=', now)
      .where('startsAt', '<=', now + reminderHours() * H)
      .get();
    for (const doc of remSnap.docs) {
      const a = doc.data() || {};
      if (a.status === 'storniert' || a.mailRemindedAt || !a.customerEmail) continue;
      try { await sendApptMail(doc.ref, a, 'reminder', 'mailRemindedAt', firma); }
      catch (e) { console.error('Erinnerungs-Mail ' + doc.id + ':', e); }
    }

    // Follow-ups: Termine, die vor mind. FOLLOWUP_HOURS Stunden waren
    // (Fenster: letzte 48 Stunden, damit Alt-Daten nicht angeschrieben werden)
    const fuSnap = await W(firma).collection('appointments')
      .where('startsAt', '>=', now - 48 * H)
      .where('startsAt', '<=', now - followupHours() * H)
      .get();
    for (const doc of fuSnap.docs) {
      const a = doc.data() || {};
      if (a.status === 'storniert' || a.mailFollowupAt || !a.customerEmail) continue;
      try { await sendApptMail(doc.ref, a, 'followup', 'mailFollowupAt', firma); }
      catch (e) { console.error('Follow-up-Mail ' + doc.id + ':', e); }
    }
    }
    return null;
  });

/* ============================================================
   MONATSBERICHT PER E-MAIL
   Am ersten Werktag des Monats um 08:00 Uhr an den Chef.

   Nur an Rolle "chef" — der Bericht enthält alle Studios, Studio-Leiter
   bekommen ihn deshalb nicht. Fehlt die SMTP-Einrichtung, passiert nichts
   und es wird protokolliert, statt dass die Funktion abbricht. Die
   Studio-Namen kommen aus den Benutzerprofilen, damit die Liste nicht ein
   zweites Mal gepflegt werden muss.
   ============================================================ */

/* Der Name EINES Studios, für Meldungen. Die Studioliste steht seit dem
   Umzug in der Datenbank (firmen/<kennung>/studios); die Profile sind
   nur der Rückfall, falls dort noch nichts steht. */
async function studioName(firma, key) {
  try {
    const d = await W(firma).collection('studios').doc(String(key)).get();
    const n = d.exists ? (d.data() || {}).name : null;
    if (n) return n;
  } catch (e) { /* Rueckfall unten */ }
  try {
    const map = await studioNameMap(firma);
    if (map[key]) return map[key];
  } catch (e) { /* dann eben die Kennung */ }
  return String(key);
}

/* Kennung "studio-7" → lesbarer Name, soweit aus den Profilen bekannt.
   users liegt weiterhin oben, deshalb wird nach Firma GEFILTERT, nicht
   verschachtelt: sonst stünden im Bericht des einen Kunden die
   Studionamen des anderen. */
async function studioNameMap(firma) {
  const map = {};
  try {
    const snap = await db.collection('users').get();
    snap.forEach(doc => {
      const d = doc.data() || {};
      if (!gehoertZu(d, firma)) return;
      const keys = Array.isArray(d.studioKeys) ? d.studioKeys : [];
      const names = Array.isArray(d.studios) ? d.studios : [];
      keys.forEach((k, i) => { if (names[i] && !map[k]) map[k] = names[i]; });
    });
  } catch (e) { console.error('studioNameMap:', e); }
  return map;
}

/* ALLE Studios, nicht nur die mit Personal.

   Vorher kamen die Studios des Berichts aus studioNameMap(), und die
   liest die Nutzerprofile. Ein Studio, dem gerade niemand zugewiesen
   ist — neu eroeffnet, umgebaut, Leitung gewechselt — tauchte im
   Bericht ueberhaupt nicht auf. Nicht mit Null, sondern gar nicht.
   Genau dort waeren offene Aufgaben am ehesten liegengeblieben, und der
   Bericht haette sie stillschweigend verschwiegen.

   Die Studioliste steht seit dem Umzug in der Datenbank. Die Profile
   bleiben als Rueckfall dabei — flache Altbestaende haben die Sammlung
   noch nicht. */
async function alleStudios(firma) {
  const namen = {};
  try {
    const snap = await W(firma).collection('studios').get();
    snap.forEach(d => { namen[d.id] = ((d.data() || {}).name) || d.id; });
  } catch (e) { console.error('Studios:', e); }
  try {
    const ausProfilen = await studioNameMap(firma);
    Object.keys(ausProfilen).forEach(k => { if (!namen[k]) namen[k] = ausProfilen[k]; });
  } catch (e) { /* dann eben nur die Sammlung */ }
  return namen;
}

/* Zahlen für einen Zeitraum einsammeln */
async function collectMonthly(vonMs, bisMs, firma) {
  const namen = await alleStudios(firma);
  const keys = Object.keys(namen);
  const zeilen = [];
  /* Die Summen heissen NICHT wie die Felder, die sie fuellen. Hier stand
     „let erledigt = 0" — und verdeckte damit die Funktion erledigt(),
     die drei Zeilen weiter unten aufgerufen wird. Der Aufruf warf einen
     TypeError, das try/catch drumherum hat ihn in die Protokollzeile
     geschrieben, und die Funktion lief mit halben Zahlen weiter. Ein
     Bericht, der ploetzlich „0 offen" meldet, sieht aus wie eine gute
     Nachricht. */
  let summeErledigt = 0, offen = 0, ueberfaellig = 0, fehlt = 0;
  let putzErledigt = 0, putzOffen = 0;
  const proPerson = {};
  const jetzt = Date.now();
  /* Was konkret zu tun ist — über alle Studios gesammelt, nicht je
     Studio. Der Bericht soll die Frage „wo muss ich ran" beantworten,
     und die stellt sich über den ganzen Betrieb. */
  const sUeberListe = [];

  for (const key of keys) {
    let sErledigt = 0, sOffen = 0, sUeber = 0;
    try {
      const snap = await W(firma).collection('studios').doc(key).collection('todos').get();
      snap.forEach(doc => {
        const t = doc.data() || {};
        /* Im Zeitraum ERLEDIGT: die Arbeit hat stattgefunden, auch wenn
           eine taegliche Aufgabe inzwischen wieder offen ist. */
        if (t.doneAt && t.doneAt >= vonMs && t.doneAt <= bisMs) {
          sErledigt++; summeErledigt++;
          const wer = t.doneBy || 'Unbekannt';
          proPerson[wer] = (proPerson[wer] || 0) + 1;
        }
        /* AKTUELL offen: hier stand „!t.done", und das zaehlte falsch.
           Eine taegliche Aufgabe, die gestern abgehakt wurde, hat
           done:true und galt damit als erledigt — obwohl sie heute
           wieder ansteht. Die Fertig-Meldung rechnet seit jeher mit
           erledigt(), das die Wiederholung beruecksichtigt. Der Bericht
           hat den offenen Bestand also systematisch zu niedrig
           ausgewiesen, und zwar genau bei den Aufgaben, die jeden Tag
           anfallen. */
        if (!erledigt(t)) {
          sOffen++; offen++;
          if (t.due && jetzt > t.due) {
            sUeber++; ueberfaellig++;
            /* Nicht nur zaehlen, sondern benennen. „3 ueberfaellig" sagt
               niemandem, was zu tun ist; „Brandschutzbegehung, 12 Tage"
               schon. Bewusst gedeckelt — eine Mail mit 200 Zeilen liest
               niemand, und wo 200 offen sind, ist die Liste nicht das
               Problem. */
            if (sUeberListe.length < 25) {
              sUeberListe.push({
                studio: namen[key] || key,
                titel: String(t.title || t.text || 'Ohne Titel').slice(0, 70),
                tage: Math.floor((jetzt - t.due) / 86400000),
                wer: t.assignee || t.fuer || ''
              });
            }
          }
        }
      });
    } catch (e) { console.error('Aufgaben ' + key + ':', e); }

    /* Der Putzplan fehlte im Bericht komplett — gezaehlt wurden nur
       todos. In einem EMS-Studio ist der Putzplan der groessere Teil
       der taeglichen Arbeit; ein Bericht ohne ihn beantwortet die Frage
       „laeuft es rund" mit der Haelfte der Zahlen. */
    let pErledigt = 0, pOffen = 0;
    try {
      const snap = await W(firma).collection('studios').doc(key).collection('cleaning').get();
      snap.forEach(doc => {
        const c = doc.data() || {};
        if (c.doneAt && c.doneAt >= vonMs && c.doneAt <= bisMs) {
          pErledigt++; putzErledigt++;
          const wer = c.doneBy || c.by;
          if (wer) proPerson[wer] = (proPerson[wer] || 0) + 1;
        }
        /* Dieselbe Rechnung wie bei der Fertig-Meldung: erledigt()
           kennt taeglich und woechentlich. */
        if (!erledigt(c)) { pOffen++; putzOffen++; }
      });
    } catch (e) { console.error('Putzplan ' + key + ':', e); }

    let sFehlt = 0;
    const sFehltListe = [];
    try {
      const inv = await W(firma).collection('inventory').doc(key).get();
      const items = (inv.exists && inv.data().items) || [];
      items.forEach(it => {
        const n = (it.limit > 0) ? Math.max(0, it.limit - (it.have || 0)) : (it.need || 0);
        if (n > 0) {
          sFehlt += n; fehlt += n;
          /* WAS fehlt, nicht nur wie viel. „2 Artikel fehlen" laesst
             offen, ob es Handtuecher oder Desinfektionsmittel sind —
             und das eine kann man verschieben, das andere nicht. */
          sFehltListe.push({ name: String(it.name || 'Artikel').slice(0, 40), n: n });
        }
      });
    } catch (e) { console.error('Material ' + key + ':', e); }

    zeilen.push({
      name: namen[key] || key, erledigt: sErledigt, offen: sOffen, ueber: sUeber,
      putzErledigt: pErledigt, putzOffen: pOffen, fehlt: sFehlt,
      fehltListe: sFehltListe
    });
  }

  /* Sortiert nach dem, was Aufmerksamkeit braucht — nicht nach Fleiss.
     Vorher stand das Studio mit den meisten Erledigungen oben; wer den
     Bericht ueberfliegt, sah zuerst das, wo alles laeuft. Ueberfaellig
     zuerst, dann offen, dann fehlendes Material. Bei Gleichstand nach
     Namen, damit die Reihenfolge zwischen zwei Berichten nicht springt. */
  zeilen.sort((a, b) =>
    (b.ueber - a.ueber) ||
    ((b.offen + b.putzOffen) - (a.offen + a.putzOffen)) ||
    (b.fehlt - a.fehlt) ||
    a.name.localeCompare(b.name, 'de'));
  /* Ablaufende Nachweise. Gehoeren in den Bericht, weil sie die einzige
     Sorte offener Punkte sind, die von selbst schlimmer wird und nicht
     im Putzplan auftaucht — ein abgelaufener Erste-Hilfe-Schein faellt
     erst auf, wenn er gebraucht wird. */
  const nachweise = [];
  try {
    const snap = await W(firma).collection('certificates').get();
    const heute = new Date(); heute.setHours(0, 0, 0, 0);
    snap.forEach(doc => {
      const c = doc.data() || {};
      if (!c.bis) return;
      const tage = Math.round((new Date(c.bis + 'T00:00:00') - heute) / 86400000);
      if (tage > 60) return;
      nachweise.push({
        name: String(c.name || 'Unbekannt').slice(0, 40),
        art: String((c.art === 'sonstiges' && c.bez) ? c.bez : (c.art || 'Nachweis')).slice(0, 40),
        tage: tage
      });
    });
    nachweise.sort((a, b) => a.tage - b.tage);
  } catch (e) { console.error('Nachweise:', e); }

  return {
    zeilen, erledigt: summeErledigt, offen, ueberfaellig, fehlt,
    putzErledigt, putzOffen, proPerson, studios: keys.length,
    ueberListe: sUeberListe, nachweise
  };
}

/* Die Kennungen der Nachweis-Arten sind in der App hinterlegt, nicht in
   den Functions. Damit im Bericht nicht „ersthelfer" steht, hier
   dieselben Namen — bewusst mit Rueckfall auf die Kennung, damit eine
   neue Art nicht zu einer leeren Zeile wird. */
const CERT_NAMEN = {
  ersthelfer: 'Erste-Hilfe-Kurs', trainer: 'Trainerlizenz',
  ems: 'EMS-Einweisung', hygiene: 'Hygieneschulung',
  brandschutz: 'Brandschutzhelfer', sonstiges: 'Sonstiges'
};
function certName(art) { return CERT_NAMEN[art] || art; }

function monatsText(d, vonD, bisD) {
  const dat = (x) => x.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const tage = Math.max(1, Math.round((bisD - vonD) / 86400000));
  const L = [];

  /* KEINE Spaltentabelle mehr.

     Hier stand eine mit padEnd() ausgerichtete Tabelle. Die setzt eine
     Schreibmaschinenschrift voraus — Postfaecher zeigen Text aber
     proportional, und auf dem Handy brach die 52 Zeichen lange
     Trennlinie zusaetzlich um. Das Ergebnis waren verrutschte Spalten
     und zwei Striche verschiedener Laenge. Aus dem Betrieb kam dazu
     genau ein Wort: verwirrend.

     Wer die Mail als reinen Text liest, bekommt jetzt ganze Saetze je
     Studio. Die Tabelle steht in der HTML-Fassung, wo sie ausgerichtet
     bleibt, weil das Postfach die Spalten setzt und nicht ich. */
  L.push('STUDIOCHAT — BERICHT');
  L.push(dat(vonD) + ' bis ' + dat(bisD) + ' (' + tage +
    (tage === 1 ? ' Tag' : ' Tage') + ') · alle ' + d.studios + ' Studios');
  L.push('');

  // ── Was zu tun ist, ganz nach oben ──
  const tun = [];
  if (d.ueberListe.length) {
    tun.push('ÜBERFÄLLIG (' + d.ueberfaellig + ')');
    d.ueberListe.forEach(u => {
      tun.push('  · ' + u.studio + ': ' + u.titel + ' — seit ' + u.tage +
        (u.tage === 1 ? ' Tag' : ' Tagen') + (u.wer ? ' (' + u.wer + ')' : ''));
    });
    if (d.ueberfaellig > d.ueberListe.length) {
      tun.push('  · … und ' + (d.ueberfaellig - d.ueberListe.length) + ' weitere');
    }
    tun.push('');
  }
  const mitMaterial = d.zeilen.filter(z => z.fehltListe && z.fehltListe.length);
  if (mitMaterial.length) {
    tun.push('MATERIAL NACHBESTELLEN (' + d.fehlt + ' Stück)');
    mitMaterial.forEach(z => {
      tun.push('  · ' + z.name + ': ' +
        z.fehltListe.map(f => f.name + ' ' + f.n + '×').join(', '));
    });
    tun.push('');
  }
  if (d.nachweise && d.nachweise.length) {
    const ab = d.nachweise.filter(n => n.tage < 0);
    const bald = d.nachweise.filter(n => n.tage >= 0);
    tun.push('NACHWEISE');
    ab.forEach(n => tun.push('  · ABGELAUFEN: ' + n.name + ' — ' + certName(n.art) +
      ' (seit ' + Math.abs(n.tage) + ' Tagen)'));
    bald.forEach(n => tun.push('  · ' + n.name + ' — ' + certName(n.art) +
      ' läuft in ' + n.tage + (n.tage === 1 ? ' Tag' : ' Tagen') + ' ab'));
    tun.push('');
  }

  if (tun.length) {
    L.push('── WAS ZU TUN IST ──');
    L.push('');
    tun.forEach(z => L.push(z));
  } else {
    L.push('── WAS ZU TUN IST ──');
    L.push('');
    L.push('  Nichts. Nichts überfällig, kein Material fehlt, kein Nachweis');
    L.push('  läuft in den nächsten 60 Tagen ab.');
    L.push('');
  }

  L.push('── ZAHLEN ──');
  L.push('');
  L.push('  Erledigt im Zeitraum: ' + (d.erledigt + d.putzErledigt) +
    ' (' + d.erledigt + ' Aufgaben, ' + d.putzErledigt + ' Putzplan)');
  L.push('  Aktuell offen: ' + (d.offen + d.putzOffen) +
    ' (' + d.offen + ' Aufgaben, ' + d.putzOffen + ' Putzplan)');
  L.push('  Davon überfällig: ' + d.ueberfaellig);
  L.push('  Fehlende Artikel: ' + d.fehlt);
  L.push('');

  /* Ganze Saetze statt Spalten. Sortiert bleibt nach dem, was
     Aufmerksamkeit braucht — oben steht, wo etwas liegt. */
  L.push('── NACH STUDIO (oben liegt am meisten) ──');
  L.push('');
  d.zeilen.forEach(z => {
    const offenGes = z.offen + z.putzOffen;
    const erlGes = z.erledigt + z.putzErledigt;
    if (!offenGes && !erlGes && !z.fehlt) {
      L.push('  ' + z.name + ': nichts hinterlegt');
      return;
    }
    const teile = [];
    teile.push(offenGes + ' offen');
    if (z.ueber) teile.push(z.ueber + ' überfällig');
    if (z.fehlt) teile.push(z.fehlt + (z.fehlt === 1 ? ' Artikel fehlt' : ' Artikel fehlen'));
    teile.push(erlGes + ' erledigt');
    L.push('  ' + z.name + ': ' + teile.join(' · '));
  });

  const leute = Object.keys(d.proPerson).sort((a, b) =>
    (d.proPerson[b] - d.proPerson[a]) || a.localeCompare(b, 'de'));
  if (leute.length) {
    L.push('');
    /* Die Überschrift nennt jetzt beides. Vorher stand hier nur „wer hat
       wie viel erledigt", waehrend die Zahlen Aufgaben UND Putzplan
       zusammenzaehlten — die Summe passte dann zu keiner der beiden
       Zahlen weiter oben und sah nach einem Fehler aus. */
    L.push('── WER HAT WIE VIEL ERLEDIGT (Aufgaben + Putzplan) ──');
    L.push('');
    leute.forEach(n => L.push('  ' + n + ': ' + d.proPerson[n]));
  }
  L.push('');
  L.push('Alle Zahlen im Detail: StudioChat → Verwaltung → Auswertung.');
  L.push('Abschalten: Einstellungen → Meldungen.');
  return L.join('\n');
}

/* ══ Der Bericht als HTML ═════════════════════════════════════════════
   Warum ueberhaupt HTML: eine Tabelle aus Leerzeichen richtet sich nur
   in Schreibmaschinenschrift aus. Postfaecher setzen Text proportional,
   und auf dem Handy bricht eine lange Zeile zusaetzlich um. Hier setzt
   das Postfach die Spalten — dafuer sind Tabellen da.

   Regeln fuer Mail-HTML, alle drei hier eingehalten:
     - Stile INLINE. <style> im Kopf wird von einigen Postfaechern
       entfernt, und dann steht der Bericht nackt da.
     - <table> statt flex/grid. Aeltere Postfaecher koennen beides nicht.
     - Keine Bilder, keine Schriften von aussen. Ein Bericht, der auf
       eine Internetverbindung wartet, ist kein Bericht.

   Die Textfassung geht in derselben Mail mit. Wer HTML abgeschaltet hat
   — und wer es aus dem Postfach heraus weiterleitet — bekommt dann
   nicht eine leere Seite, sondern denselben Inhalt in Saetzen. */
function eh(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function berichtHtml(d, vonD, bisD) {
  const dat = (x) => x.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const tage = Math.max(1, Math.round((bisD - vonD) / 86400000));
  const TEXT = '#1a1c23', GRAU = '#6b7280', LINIE = '#e5e7eb';
  const ROT = '#b91c1c', ROTBG = '#fef2f2', GELB = '#92400e', GELBBG = '#fffbeb';
  const GRUEN = '#15803d', GRUENBG = '#f0fdf4', BLAU = '#1d4ed8';
  const F = 'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Arial,sans-serif';
  const H = [];

  /* Eigener Grund, nicht der des Postfachs.

     Der erste ausgelieferte Bericht wurde auf einem Handy im
     DUNKELMODUS gelesen. Eine Mail ohne eigene Hintergrundfarbe erbt den
     des Postfachs — dann steht dunkler Text auf dunklem Grund, und die
     farbigen Kaesten unten (helles Rot, helles Gelb) haetten als einzige
     einen Hintergrund gehabt. Deshalb traegt die Mail ihre helle Flaeche
     selbst, ueber ein bgcolor am aeusseren <table>: das respektieren
     auch Postfaecher, die HTML sonst umfaerben. */
  H.push('<table cellpadding="0" cellspacing="0" border="0" width="100%" ' +
    'bgcolor="#ffffff" style="background:#ffffff;margin:0;padding:0"><tr>' +
    '<td align="center" bgcolor="#ffffff" style="background:#ffffff;padding:0">');
  H.push('<div style="' + F + ';max-width:640px;margin:0 auto;padding:20px;' +
    'background:#ffffff;color:' + TEXT + ';font-size:15px;line-height:1.5;text-align:left">');

  // ── Kopf ──
  H.push('<div style="border-bottom:2px solid ' + TEXT + ';padding-bottom:12px;margin-bottom:20px">');
  H.push('<div style="font-size:22px;font-weight:700;letter-spacing:-.3px">StudioChat — Bericht</div>');
  H.push('<div style="color:' + GRAU + ';font-size:14px;margin-top:4px">' +
    eh(dat(vonD)) + ' bis ' + eh(dat(bisD)) + ' &middot; ' + tage +
    (tage === 1 ? ' Tag' : ' Tage') + ' &middot; alle ' + d.studios + ' Studios</div>');
  H.push('</div>');

  /* ── Was zu tun ist — ganz oben ──
     Ein Bericht, der mit Summen anfaengt, beantwortet die Frage „lief es
     gut". Die Frage, mit der jemand die Mail oeffnet, ist aber „muss ich
     etwas tun". Also steht die zuerst. */
  const kasten = (farbe, bg, titel, zeilen) => {
    H.push('<div style="background:' + bg + ';border-left:4px solid ' + farbe +
      ';padding:12px 14px;margin-bottom:12px;border-radius:0 6px 6px 0">');
    H.push('<div style="font-weight:700;color:' + farbe + ';font-size:13px;' +
      'text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">' + eh(titel) + '</div>');
    zeilen.forEach(z => H.push('<div style="margin:3px 0">' + z + '</div>'));
    H.push('</div>');
  };

  H.push('<div style="font-size:13px;font-weight:700;color:' + GRAU +
    ';text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">Was zu tun ist</div>');

  let wasZuTun = false;

  if (d.ueberListe.length) {
    wasZuTun = true;
    const z = d.ueberListe.map(u =>
      '<b>' + eh(u.studio) + '</b> &middot; ' + eh(u.titel) +
      ' <span style="color:' + ROT + '">seit ' + u.tage +
      (u.tage === 1 ? ' Tag' : ' Tagen') + '</span>' +
      (u.wer ? ' <span style="color:' + GRAU + '">(' + eh(u.wer) + ')</span>' : ''));
    if (d.ueberfaellig > d.ueberListe.length) {
      z.push('<span style="color:' + GRAU + '">… und ' +
        (d.ueberfaellig - d.ueberListe.length) + ' weitere</span>');
    }
    kasten(ROT, ROTBG, 'Überfällig (' + d.ueberfaellig + ')', z);
  }

  const mitMaterial = d.zeilen.filter(x => x.fehltListe && x.fehltListe.length);
  if (mitMaterial.length) {
    wasZuTun = true;
    kasten(GELB, GELBBG, 'Material nachbestellen (' + d.fehlt + ' Stück)',
      mitMaterial.map(z => '<b>' + eh(z.name) + '</b> &middot; ' +
        z.fehltListe.map(f => eh(f.name) + ' <b>' + f.n + '&times;</b>').join(', ')));
  }

  if (d.nachweise && d.nachweise.length) {
    wasZuTun = true;
    kasten(GELB, GELBBG, 'Nachweise (' + d.nachweise.length + ')',
      d.nachweise.map(n => n.tage < 0
        ? '<b>' + eh(n.name) + '</b> &middot; ' + eh(certName(n.art)) +
          ' <span style="color:' + ROT + ';font-weight:700">abgelaufen seit ' +
          Math.abs(n.tage) + ' Tagen</span>'
        : '<b>' + eh(n.name) + '</b> &middot; ' + eh(certName(n.art)) +
          ' <span style="color:' + GELB + '">läuft in ' + n.tage +
          (n.tage === 1 ? ' Tag' : ' Tagen') + ' ab</span>'));
  }

  if (!wasZuTun) {
    kasten(GRUEN, GRUENBG, 'Nichts liegt an',
      ['Nichts überfällig, kein Material fehlt, und kein Nachweis läuft in ' +
       'den nächsten 60 Tagen ab.']);
  }

  // ── Zahlen ──
  H.push('<div style="font-size:13px;font-weight:700;color:' + GRAU +
    ';text-transform:uppercase;letter-spacing:.6px;margin:24px 0 10px">Auf einen Blick</div>');
  H.push('<table cellpadding="0" cellspacing="0" border="0" width="100%" style="' + F + '">');
  const zahl = (was, wert, zusatz, farbe) => {
    H.push('<tr>' +
      '<td style="padding:7px 0;border-bottom:1px solid ' + LINIE + ';font-size:15px">' + eh(was) + '</td>' +
      '<td style="padding:7px 0;border-bottom:1px solid ' + LINIE + ';text-align:right;' +
        'font-size:19px;font-weight:700;color:' + (farbe || TEXT) + ';white-space:nowrap">' + wert + '</td>' +
      '<td style="padding:7px 0 7px 10px;border-bottom:1px solid ' + LINIE + ';color:' + GRAU +
        ';font-size:13px;white-space:nowrap">' + (zusatz || '') + '</td></tr>');
  };
  zahl('Erledigt im Zeitraum', d.erledigt + d.putzErledigt,
    d.erledigt + ' Aufgaben &middot; ' + d.putzErledigt + ' Putzplan', GRUEN);
  zahl('Aktuell offen', d.offen + d.putzOffen,
    d.offen + ' Aufgaben &middot; ' + d.putzOffen + ' Putzplan');
  zahl('Davon überfällig', d.ueberfaellig, '', d.ueberfaellig ? ROT : TEXT);
  zahl('Fehlende Artikel', d.fehlt, '', d.fehlt ? GELB : TEXT);
  H.push('</table>');

  // ── Nach Studio ──
  H.push('<div style="font-size:13px;font-weight:700;color:' + GRAU +
    ';text-transform:uppercase;letter-spacing:.6px;margin:24px 0 4px">Nach Studio</div>');
  H.push('<div style="color:' + GRAU + ';font-size:13px;margin-bottom:10px">' +
    'Oben steht, wo am meisten liegt.</div>');
  H.push('<table cellpadding="0" cellspacing="0" border="0" width="100%" style="' + F + ';font-size:14px">');
  H.push('<tr>' +
    '<th align="left"  style="padding:6px 4px;border-bottom:2px solid ' + LINIE + ';color:' + GRAU + ';font-size:12px;font-weight:600">Studio</th>' +
    '<th align="right" style="padding:6px 4px;border-bottom:2px solid ' + LINIE + ';color:' + GRAU + ';font-size:12px;font-weight:600">offen</th>' +
    '<th align="right" style="padding:6px 4px;border-bottom:2px solid ' + LINIE + ';color:' + GRAU + ';font-size:12px;font-weight:600">überf.</th>' +
    '<th align="right" style="padding:6px 4px;border-bottom:2px solid ' + LINIE + ';color:' + GRAU + ';font-size:12px;font-weight:600">Material</th>' +
    '<th align="right" style="padding:6px 4px;border-bottom:2px solid ' + LINIE + ';color:' + GRAU + ';font-size:12px;font-weight:600">erledigt</th></tr>');
  d.zeilen.forEach(z => {
    const offenGes = z.offen + z.putzOffen, erlGes = z.erledigt + z.putzErledigt;
    const leer = !offenGes && !erlGes && !z.fehlt;
    const td = (inhalt, farbe, fett) =>
      '<td align="right" style="padding:7px 4px;border-bottom:1px solid ' + LINIE +
      ';color:' + (farbe || TEXT) + (fett ? ';font-weight:700' : '') + '">' + inhalt + '</td>';
    H.push('<tr>' +
      '<td style="padding:7px 4px;border-bottom:1px solid ' + LINIE + ';' +
        (leer ? 'color:' + GRAU : 'font-weight:600') + '">' + eh(z.name) +
        (leer ? ' <span style="font-size:12px">(nichts hinterlegt)</span>' : '') + '</td>' +
      td(leer ? '–' : offenGes, leer ? GRAU : null, !leer && offenGes > 0) +
      td(z.ueber || (leer ? '–' : '0'), z.ueber ? ROT : GRAU, !!z.ueber) +
      td(z.fehlt || (leer ? '–' : '0'), z.fehlt ? GELB : GRAU, !!z.fehlt) +
      /* Eine gruene Null ist eine falsche gute Nachricht: „0 erledigt"
         heisst, dass dort nichts passiert ist. */
      td(leer ? '–' : erlGes, (leer || !erlGes) ? GRAU : GRUEN) +
      '</tr>');
  });
  H.push('</table>');

  // ── Wer ──
  const leute = Object.keys(d.proPerson).sort((a, b) =>
    (d.proPerson[b] - d.proPerson[a]) || a.localeCompare(b, 'de'));
  if (leute.length) {
    const hoechste = d.proPerson[leute[0]] || 1;
    H.push('<div style="font-size:13px;font-weight:700;color:' + GRAU +
      ';text-transform:uppercase;letter-spacing:.6px;margin:24px 0 4px">Wer hat wie viel erledigt</div>');
    /* Aufgaben UND Putzplan. Ohne diesen Zusatz passte die Summe zu
       keiner der beiden Zahlen weiter oben und sah nach einem Fehler
       aus — im ersten ausgelieferten Bericht standen oben 3 erledigte
       Aufgaben und hier 26. */
    H.push('<div style="color:' + GRAU + ';font-size:13px;margin-bottom:10px">' +
      'Aufgaben und Putzplan zusammen.</div>');
    H.push('<table cellpadding="0" cellspacing="0" border="0" width="100%" style="' + F + ';font-size:14px">');
    leute.forEach(n => {
      const v = d.proPerson[n];
      const breite = Math.max(3, Math.round(v / hoechste * 100));
      H.push('<tr>' +
        '<td width="35%" style="padding:5px 4px">' + eh(n) + '</td>' +
        '<td style="padding:5px 4px">' +
          '<div style="background:' + BLAU + ';height:8px;border-radius:4px;width:' + breite + '%"></div>' +
        '</td>' +
        '<td width="42" align="right" style="padding:5px 4px;font-weight:700">' + v + '</td></tr>');
    });
    H.push('</table>');
  }

  H.push('<div style="margin-top:26px;padding-top:14px;border-top:1px solid ' + LINIE +
    ';color:' + GRAU + ';font-size:13px">' +
    'Alle Zahlen im Detail: StudioChat &rarr; Verwaltung &rarr; Auswertung.<br>' +
    'Diese Mail lässt sich abschalten: Einstellungen &rarr; Meldungen.</div>');
  H.push('</div>');
  H.push('</td></tr></table>');
  return H.join('');
}

/* Bericht bauen und verschicken.

   nurUid: wenn gesetzt, geht der Bericht NUR an dieses Konto. Das ist
   der Weg fuer den Knopf „Bericht jetzt anfordern". Wer sich die
   aktuellen Zahlen ansehen will, soll dafuer nicht vier Kolleginnen
   anschreiben — und beim Zeitplan am Monatsersten bleibt es beim
   Rundschreiben an alle. */
async function sendMonthlyReport(vonD, bisD, firma, nurUid) {
  const mailer = getMailer();
  if (!mailer) { console.log('Bericht übersprungen: SMTP nicht eingerichtet.'); return 0; }

  let empfaenger = [];
  let abgemeldet = 0;
  try {
    const snap = await db.collection('users').where('role', '==', 'chef').get();
    snap.forEach(doc => {
      const d = doc.data() || {};
      if (!gehoertZu(d, firma)) return;
      if (nurUid && doc.id !== nurUid) return;
      /* Wer den Bericht abbestellt hat, bekommt ihn nicht — ausser er
         fordert ihn gerade selbst an. Einen Knopf zu druecken und dann
         nichts zu bekommen, weil man vor Monaten den Zeitplan
         abbestellt hat, waere nicht zu erklaeren. */
      const aus = Array.isArray(d.mailAus) ? d.mailAus : [];
      if (!nurUid && aus.indexOf('bericht') >= 0) { abgemeldet++; return; }
      if (d.email) empfaenger.push(d.email);
    });
  } catch (e) { console.error('Chef-Konten:', e); }
  if (!empfaenger.length) {
    console.log('Bericht: kein Chef mit E-Mail' +
      (abgemeldet ? ' (' + abgemeldet + ' abbestellt)' : '') + '.');
    return 0;
  }

  const daten = await collectMonthly(vonD.getTime(), bisD.getTime(), firma);
  const text = monatsText(daten, vonD, bisD);
  const tage = Math.max(1, Math.round((bisD - vonD) / 86400000));
  /* Der Betreff nennt den Zeitraum, nicht den Monat. „Monatsbericht
     August" ueber sieben Tage war schlicht falsch — und im Postfach ist
     der Betreff das Einzige, was man vor dem Oeffnen sieht. */
  const dat = (x) => x.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  const betreff = 'StudioChat-Bericht · ' + tage + (tage === 1 ? ' Tag' : ' Tage') +
    ' bis ' + dat(bisD);
  const fromAddr = process.env.MAIL_FROM || process.env.SMTP_USER;

  /* Beide Fassungen in einer Mail. Das Postfach nimmt HTML, wenn es
     kann, sonst den Text — und wer HTML abgeschaltet hat, bekommt keine
     leere Seite. */
  await mailer.sendMail({
    from: '"StudioChat" <' + fromAddr + '>',
    to: empfaenger.join(', '),
    subject: betreff,
    text,
    html: berichtHtml(daten, vonD, bisD)
  });
  console.log('Bericht an', empfaenger.length, 'Empfänger gesendet.');
  return empfaenger.length;
}

/* Zeitplan: täglich 08:00 – gesendet wird nur am Monatsersten.
   (Ein eigener Monats-Zeitplan ginge auch, aber so lässt sich der Lauf
   leichter nachvollziehen und im Fehlerfall am Folgetag nachholen.) */
exports.monthlyReport = region
  .runWith({ timeoutSeconds: 300, memory: '256MB' })
  .pubsub.schedule('0 8 * * *')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    const jetzt = new Date();
    if (jetzt.getDate() !== 1) return null;      // nur am Monatsersten
    const von = new Date(jetzt.getFullYear(), jetzt.getMonth() - 1, 1, 0, 0, 0);
    const bis = new Date(jetzt.getFullYear(), jetzt.getMonth(), 0, 23, 59, 59);
    for (const firma of await alleFirmen()) {
      /* Je Firma ein eigener Lauf und eine eigene Mail. Ein Fehler bei
         einem Kunden darf die Berichte der anderen nicht verschlucken —
         deshalb liegt das try INNERHALB der Schleife. */
      try { await sendMonthlyReport(von, bis, firma); }
      catch (e) { console.error('Monatsbericht (' + (firma || 'flach') + '):', e); }
    }
    return null;
  });

/* Zum Ausprobieren, ohne bis zum Monatsersten zu warten.
   Aufruf: /monthlyReportNow?key=<BDAY_TEST_KEY>&tage=30 */
exports.monthlyReportNow = region
  .runWith({ timeoutSeconds: 300 })
  .https.onRequest(async (req, res) => {
    const key = process.env.BDAY_TEST_KEY || '';
    if (!key || req.query.key !== key) { res.status(403).send('Kein Zugriff.'); return; }
    const tage = Math.min(370, Math.max(1, +(req.query.tage || 30) || 30));
    const bis = new Date();
    const von = new Date(Date.now() - tage * 86400000);
    try {
      let n = 0;
      for (const firma of await alleFirmen()) n += await sendMonthlyReport(von, bis, firma);
      res.status(200).send(n
        ? ('Bericht über ' + tage + ' Tage an ' + n + ' Empfänger gesendet.')
        : 'Nichts gesendet – siehe Protokoll (SMTP oder Chef-E-Mail fehlt).');
    } catch (e) {
      console.error('monthlyReportNow:', e);
      res.status(500).send('Fehler: ' + e.message);
    }
  });

/* ── Testbericht auf Knopfdruck ──
   Der HTTPS-Auslöser oben braucht einen Geheim-Schlüssel, der als
   GitHub-Secret nicht mehr auslesbar ist. Diese Fassung prüft stattdessen
   die Anmeldung: nur ein angemeldeter Chef darf sie auslösen. Die Rolle wird
   hier auf dem Server geprüft, nicht in der App. */
exports.sendTestReport = region
  .runWith({ timeoutSeconds: 300, memory: '256MB' })
  .https.onCall(async (data, context) => {
    requireAuth(context);

    const uid = context.auth.uid;
    const snap = await db.collection('users').doc(uid).get();
    const profil = snap.exists ? (snap.data() || {}) : {};
    if (profil.role !== 'chef') {
      throw new functions.https.HttpsError('permission-denied',
        'Nur der Chef kann den Bericht anfordern.');
    }

    const tage = Math.min(370, Math.max(1, +((data && data.tage) || 30) || 30));
    const bis = new Date();
    const von = new Date(Date.now() - tage * 86400000);

    /* Nur an den, der drueckt. Vorher ging der Knopf an ALLE Chef-Konten
       — wer die aktuellen Zahlen sehen wollte, schrieb damit ungefragt
       seine Kolleginnen an. Das Rundschreiben bleibt dem Zeitplan am
       Monatsersten vorbehalten. */
    const empfaenger = await sendMonthlyReport(von, bis, await firmaVonProfil(profil), uid);
    if (!empfaenger) {
      // Ehrlich sagen, woran es liegt, statt "hat nicht geklappt"
      const mailer = getMailer();
      throw new functions.https.HttpsError('failed-precondition', mailer
        ? 'Für dein Konto ist keine E-Mail-Adresse hinterlegt.'
        : 'Der E-Mail-Versand ist noch nicht eingerichtet (SMTP-Zugangsdaten fehlen).');
    }
    return { ok: true, empfaenger: empfaenger, tage: tage };
  });

/* ── Tägliche Sicherung der Datenbank ──
   Firestore-Export in den Standard-Speicher des Projekts: konsistent über
   alle Sammlungen und serverseitig, belastet also weder App noch
   Lese-Kontingent. Wochen-Archiv, Excel-Export und Papierkorb sind kein
   Ersatz — keiner davon holt nach einem versehentlichen Löschen alles
   zurück.

   Aufbewahrt werden sieben Tage, Ordner nach Datum.

   Der Dienstaccount der Functions braucht dafür die Rolle "Cloud Datastore
   Import Export Admin". Fehlt sie, steht das im Protokoll. */
const BACKUP_TAGE = 7;

/* ── Wohin die Sicherung geht ──
   Kein fester Bucket-Name: Firebase vergibt je nach Alter des Projekts
   "<projekt>.appspot.com" oder "<projekt>.firebasestorage.app", ein fest
   eingetragener Name zeigt im falschen Projekt ins Leere.
   admin.storage().bucket() nimmt den, der wirklich eingerichtet ist. */
function sicherungsBucket() {
  try {
    const b = admin.storage().bucket();
    if (b && b.name) return b.name;
  } catch (e) { /* faellt unten auf den alten Namen zurueck */ }
  const projekt = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || '';
  return projekt + '.appspot.com';
}

/* Unter welchem Konto laeuft diese Funktion? Genau dieses Konto braucht die
   Export-Rolle - und genau danach sucht man in der Google-Konsole. */
function dienstkonto() {
  return process.env.FUNCTION_IDENTITY ||
    ((process.env.GCLOUD_PROJECT || '') + '@appspot.gserviceaccount.com');
}

/* Eine Fehlermeldung, mit der man etwas anfangen kann. „PERMISSION_DENIED"
   allein sagt nicht, WEM was fehlt. */
function sicherungsFehler(e) {
  const roh = (e && e.message) || String(e);
  const abgelehnt = /PERMISSION_DENIED|permission/i.test(roh);
  if (abgelehnt) {
    return 'Dem Dienstkonto ' + dienstkonto() + ' fehlt die Berechtigung. ' +
      'In der Google-Konsole unter IAM diesem Konto die Rolle ' +
      '„Cloud Datastore Import Export Admin" geben – und ' +
      '„Storage-Objekt-Administrator" für den Speicher ' + sicherungsBucket() + '. ' +
      'Nach dem Speichern ein bis zwei Minuten warten. (' + roh + ')';
  }
  if (/not found|does not exist|404/i.test(roh)) {
    return 'Der Speicher ' + sicherungsBucket() + ' wurde nicht gefunden. ' +
      'In der Firebase-Konsole unter „Storage" einmal einrichten. (' + roh + ')';
  }
  return roh;
}

/* Was bei der letzten Sicherung herauskam - in die Datenbank, damit die App
   es anzeigen kann.
   Grund: Eine Sicherung, die nachts still scheitert, merkt monatelang
   niemand. Genau das ist hier passiert: der Speicher war nie eingerichtet,
   und im Protokoll stand es zwar, aber ins Protokoll schaut keiner. */
async function sicherungStatus(ok, ziel, fehler) {
  /* Der Export umfasst die GANZE Datenbank, also alle Firmen auf einmal.
     Der Stand muss trotzdem bei jeder einzelnen landen: die App liest
     ihn unter der eigenen Firma, und ein Chef, dem dort nichts steht,
     sieht dauerhaft „Sicherung hakt" — die Warnung, die genau dann
     verstummen soll, wenn alles läuft. */
  const stand = {
    ts: Date.now(),
    ok: !!ok,
    ziel: ziel || '',
    fehler: fehler || ''
  };
  for (const firma of await alleFirmen()) {
    try {
      await W(firma).collection('config').doc('sicherung').set(stand, { merge: false });
    } catch (e) {
      console.error('Sicherungsstand (' + (firma || 'flach') + ') nicht geschrieben: ' + e.message);
    }
  }
}

async function exportieren(zielPfad) {
  const projekt = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
  if (!projekt) throw new Error('Projektkennung fehlt.');
  const ziel = 'gs://' + sicherungsBucket() + '/' + zielPfad;
  const { FirestoreAdminClient } = require('@google-cloud/firestore').v1;
  const client = new FirestoreAdminClient();
  const [op] = await client.exportDocuments({
    name: client.databasePath(projekt, '(default)'),
    outputUriPrefix: ziel,
    collectionIds: []            // leer = alles
  });
  return { ziel: ziel, op: op && op.name };
}

exports.dailyBackup = region
  .runWith({ timeoutSeconds: 540, memory: '256MB' })
  .pubsub.schedule('40 2 * * *')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    const heute = new Date().toISOString().slice(0, 10);      // 2026-08-07

    try {
      const r = await exportieren('sicherung/' + heute);
      console.log('Sicherung gestartet: ' + r.ziel + ' (' + r.op + ')');
      await sicherungStatus(true, r.ziel, '');
    } catch (e) {
      const text = sicherungsFehler(e);
      console.error('Sicherung fehlgeschlagen: ' + text);
      await sicherungStatus(false, '', text);
      return null;
    }

    // Alte Ordner wegraeumen, damit der Speicher nicht endlos waechst
    try {
      const grenze = new Date(Date.now() - BACKUP_TAGE * 86400000)
        .toISOString().slice(0, 10);
      const bucket = admin.storage().bucket(sicherungsBucket());
      const [dateien] = await bucket.getFiles({ prefix: 'sicherung/' });
      let weg = 0;
      for (const f of dateien) {
        // Zwei Formen: "sicherung/2026-08-09/..." aus dem naechtlichen Lauf
        // und "sicherung/manuell-2026-08-09-01-28-53/..." vom Knopf. Die
        // zweite fiel frueher durch das Raster und waere fuer immer liegen
        // geblieben - bei jedem Druck auf den Knopf eine mehr.
        const m = /^sicherung\/(?:manuell-)?(\d{4}-\d{2}-\d{2})/.exec(f.name);
        if (m && m[1] < grenze) { await f.delete().catch(() => {}); weg++; }
      }
      if (weg) console.log('Sicherung: ' + weg + ' alte Dateien entfernt.');
    } catch (e) {
      console.error('Sicherung aufraeumen: ' + e.message);
    }
    return null;
  });

/* Zum Ausprobieren, ohne bis 2:40 Uhr zu warten. Nur fuer den Chef -
   die Rolle wird hier auf dem Server geprueft. */
exports.backupNow = region
  .runWith({ timeoutSeconds: 540, memory: '256MB' })
  .https.onCall(async (data, context) => {
    /* Betreiber, nicht Chef: exportieren() zieht die komplette Datenbank
           (collectionIds: [] = alles). Als Chef-Funktion konnte ein Kunde einen
           Vollexport aller anderen Kunden ausloesen und ueber sicherungStatus()
           den Sicherungsstand jeder Firma ueberschreiben.
    
           Die Daten waren dabei nie erreichbar — der Speicher ist fuer jeden
           Client gesperrt (storage.rules). Es ging um Kosten, den fremden
           Anstoss und die falsche Anzeige.
    
           Die naechtliche Sicherung laeuft fuer alle weiter. */
    await requireAdmin(context);
    const stempel = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    try {
      const r = await exportieren('sicherung/manuell-' + stempel);
      await sicherungStatus(true, r.ziel, '');
      return { ok: true, ziel: r.ziel };
    } catch (e) {
      const text = sicherungsFehler(e);
      await sicherungStatus(false, '', text);
      throw new functions.https.HttpsError('internal', text);
    }
  });

/* ── Erledigte einmalige Putzaufgaben wegräumen ──
   Die App blendet sie schon einen Tag nach dem Abhaken aus. Hier
   verschwinden sie wirklich aus der Datenbank, sonst waechst der Putzplan
   jedes Studios endlos.

   Wiederkehrende bleiben unberuehrt, die setzen sich von selbst zurueck.
   Nicht erledigte bleiben ebenfalls stehen — offene Arbeit verschwinden zu
   lassen waere schlimmer als eine lange Liste. */
exports.purgeOneOffCleaning = region
  .runWith({ timeoutSeconds: 300, memory: '256MB' })
  .pubsub.schedule('15 3 * * *')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    const grenze = Date.now() - 24 * 3600000;
    const refs = [];

    for (const firma of await alleFirmen()) {
    let studios;
    try { studios = await W(firma).collection('studios').listDocuments(); }
    catch (e) { console.error('Studios lesen (' + (firma || 'flach') + '):', e); continue; }

    for (const ref of studios) {
      try {
        // Nur ein where, damit kein zusaetzlicher Index noetig wird
        const snap = await ref.collection('cleaning').where('done', '==', true).get();
        snap.forEach(doc => {
          const t = doc.data() || {};
          if (t.recurring) return;                    // wiederkehrend: bleibt
          if (!t.doneAt || t.doneAt > grenze) return; // noch keine 24 Stunden
          refs.push(doc.ref);
        });
      } catch (e) { console.error('Putzplan ' + ref.id + ':', e); }
    }
    }
    if (!refs.length) return null;

    try {
      for (let i = 0; i < refs.length; i += 400) {
        const batch = db.batch();
        refs.slice(i, i + 400).forEach(r => batch.delete(r));
        await batch.commit();
      }
      console.log('Putzplan: ' + refs.length + ' erledigte Einmal-Aufgaben entfernt.');
    } catch (e) { console.error('Putzplan aufraeumen:', e); }
    return null;
  });

/* ── Tages-Sicherung ─────────────────────────────────────────────────
   Die Wochen-Sicherung wird innerhalb der Woche ueberschrieben; damit war
   der Montag am Dienstag weg. Putzplan und Aufgaben setzen sich taeglich
   zurueck, also braucht es einen Stand je Tag.

   Abends um 23:45, nicht morgens: eine Sicherung um 8 Uhr haelt fest, dass
   noch nichts getan wurde.

   Auf dem Server, nicht in der App: der Wochenlauf im Browser des Chefs las
   462 Dokumente auf dessen Geraet und Datenvolumen. */
exports.dailyArchive = region
  .runWith({ timeoutSeconds: 300, memory: '256MB' })
  .pubsub.schedule('45 23 * * *')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    const jetzt = new Date();
    /* Der Tag in Berliner Zeit — nicht in UTC. Um 23:45 Ortszeit ist es
       in UTC schon der naechste Tag, und die Sicherung landete unter
       dem falschen Datum. */
    const tag = jetzt.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });

    for (const firma of await alleFirmen()) {
      try {
        const studios = await W(firma).collection('studios').listDocuments();
        const material = {};
        const invSnap = await W(firma).collection('inventory').get();
        invSnap.forEach(d => {
          material[d.id] = ((d.data() || {}).items || []).map(it => ({
            name: it.name || '', have: it.have || 0, limit: it.limit || 0,
            need: (it.limit > 0) ? Math.max(0, it.limit - (it.have || 0)) : (it.need || 0),
          }));
        });

        const cleaning = {}, aufgaben = {};
        for (const ref of studios) {
          const [cSnap, nSnap, tSnap] = await Promise.all([
            ref.collection('cleaning').get(),
            ref.collection('cleaningNotes').orderBy('ts', 'desc').limit(50).get(),
            ref.collection('todos').get(),
          ]);
          cleaning[ref.id] = {
            tasks: cSnap.docs.map(d => {
              const t = d.data() || {};
              return {
                title: t.title || '',
                rep: t.recurring || 'einmalig',
                status: t.done ? 'erledigt' : 'offen',
                /* Das Kuerzel steht vorn: bei einem Zugang je Studio ist
                   der Kontoname immer derselbe und sagt nichts. */
                by: t.done ? (t.doneKuerzel || t.doneBy || '') : '',
                konto: t.done ? (t.doneBy || '') : '',
                at: t.doneAt || null,
              };
            }),
            notes: nSnap.docs.map(d => {
              const n = d.data() || {};
              /* Wie bei den Putzpunkten: Kuerzel vorn, Konto daneben. */
              return {
                text: n.text || '',
                by: n.kuerzel || n.by || '',
                konto: n.by || '',
                at: n.ts || null,
              };
            }),
          };
          /* Aufgaben gehoerten bisher gar nicht in die Sicherung. Genau
             sie sind aber der Grund fuer die taegliche: "man kann die
             taeglichen Aufgaben nicht verfolgen". */
          aufgaben[ref.id] = tSnap.docs.map(d => {
            const t = d.data() || {};
            return {
              title: t.title || '',
              status: t.done ? 'erledigt' : 'offen',
              by: t.done ? (t.doneBy || '') : '',
              at: t.doneAt || null,
              due: t.due || null,
              /* Der Grund, warum etwas NICHT erledigt wurde. Ohne ihn
                 sieht der Chef im Rueckblick nur eine offene Zeile. */
              grund: t.grund || '',
              grundVon: t.grundVon || '',
            };
          });
        }

        await W(firma).collection('archives').doc(tag).set({
          tag: tag,
          label: jetzt.toLocaleDateString('de-DE',
            { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
              timeZone: 'Europe/Berlin' }),
          updatedAt: Date.now(),
          updatedBy: 'Automatische Tages-Sicherung',
          material: material,
          cleaning: cleaning,
          aufgaben: aufgaben,
        }, { merge: true });
      } catch (e) {
        console.error('Tages-Sicherung (' + (firma || 'flach') + '):', e.message);
      }
    }
    return null;
  });

/* ── Papierkorb automatisch leeren ──
   Gelöschtes bleibt 30 Tage liegen. Ohne diesen Lauf wächst der Papierkorb
   ewig: bei Aufgaben mit Foto sind das schnell hunderte Kilobyte je Eintrag.

   Bei gelöschten Dokumenten liegt der Dateiinhalt weiterhin in
   documentData; der wird hier mit entfernt, sonst bleibt der Platz belegt,
   obwohl niemand mehr an die Datei herankommt. */
exports.purgeTrash = region
  .runWith({ timeoutSeconds: 300, memory: '256MB' })
  .pubsub.schedule('30 3 * * *')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    const grenze = Date.now() - 30 * 86400000;

    // Alle zu loeschenden Verweise sammeln. Je Eintrag koennen es zwei sein
    // (der Papierkorb-Eintrag und der Dateiinhalt), darum kommen wir bei 400
    // Eintraegen auf bis zu 800 Loeschungen - ein Firestore-Stapel fasst aber
    // nur 500. Deshalb in Haeppchen von 400 abarbeiten.
    const refs = [];
    let n = 0;

    for (const firma of await alleFirmen()) {
      let snap;
      try {
        snap = await W(firma).collection('trash')
          .where('deletedAt', '<', grenze).limit(400).get();
      } catch (e) { console.error('Papierkorb lesen (' + (firma || 'flach') + '):', e); continue; }
      if (snap.empty) continue;

      snap.forEach(doc => {
        const t = doc.data() || {};
        refs.push(doc.ref);
        if (t.col === 'documents' && t.orig && t.data && t.data.kind !== 'link') {
          /* Der Dateiinhalt liegt bei DERSELBEN Firma. Ohne W(firma)
             wäre das ein Löschen im Nachbarhaus — und zwar an einem
             Ort, an dem eine gleichnamige Kennung durchaus vorkommt. */
          refs.push(W(firma).collection('documentData').doc(t.orig));
        }
        n++;
      });
    }
    if (!refs.length) return null;

    try {
      for (let i = 0; i < refs.length; i += 400) {
        const batch = db.batch();
        refs.slice(i, i + 400).forEach(r => batch.delete(r));
        await batch.commit();
      }
      console.log('Papierkorb: ' + n + ' Eintraege endgueltig entfernt.');
    } catch (e) { console.error('Papierkorb leeren:', e); }
    return null;
  });

/* ── Nur zum Pruefen ──────────────────────────────────────────────────
   mailWillHaben() entscheidet, wer eine Sorte Mail ueberhaupt bekommt.
   Ohne diesen Ausgang koennte ein Durchlauf nur pruefen, dass eine
   Funktion nicht abstuerzt — nicht, WER am Ende uebrig bleibt. Und
   genau das ist hier die Frage.

   kontenImStudio() entscheidet, WER ueberhaupt in Frage kommt. Seit die
   Fertig-Meldung auch an Studio-Leiter geht, haengt daran die Frage, ob
   ein Leiter die Mail nur fuer SEINE Studios bekommt — die teuerste
   Sorte Fehler, weil eine Mail zu viel niemandem auffaellt, der sie
   nicht bekommen sollte.

   Bewusst unter einem eigenen Namen und nicht als exports.<name>:
   alles, was oben mit exports. anfaengt, waere ein ausgerollter
   Endpunkt. Diese hier sind keiner. */
exports.__intern = { mailWillHaben, kontenImStudio, collectMonthly, monatsText, berichtHtml };
