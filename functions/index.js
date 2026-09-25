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
  let aufgaben = 0, putz = 0, nAufgaben = 0, nPutz = 0;
  if (await featureAn(firma, 'todos')) {
    const s1 = await ref.collection('todos').get();
    nAufgaben = s1.size;
    s1.forEach(d => { if (!erledigt(d.data() || {})) aufgaben++; });
  }
  if (await featureAn(firma, 'putzplan')) {
    const s2 = await ref.collection('cleaning').get();
    nPutz = s2.size;
    s2.forEach(d => { if (!erledigt(d.data() || {})) putz++; });
  }
  /* nAufgaben/nPutz getrennt, nicht nur die Summe: „Aufgaben erledigt"
     darf nicht in einem Studio gemeldet werden, das ueberhaupt keine
     Aufgaben hat. Null von null ist nicht fertig, sondern leer. */
  return { aufgaben, putz, gesamt: aufgaben + putz,
           nAufgaben, nPutz, dokumente: nAufgaben + nPutz };
}

/* Tagesstempel in Ortszeit. sv-SE liefert YYYY-MM-DD, das sortiert und
   vergleicht sich als Zeichenkette richtig. */
function tagBerlin(d) {
  return (d || new Date()).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
}

/* ── Push: EIN Punkt wurde abgehakt ──
   Die Mail meldet den Zustand eines Studios, dieser Push das einzelne
   Ereignis. Beides zusammen ist Absicht: das eine beantwortet „ist mein
   Studio durch?", das andere „was passiert gerade?".

   Nur an Leitung: ein Mitarbeiter braucht nicht zu wissen, wer was
   abgehakt hat. Dieselbe Grenze wie bei der Fertig-Mail und wie bei der
   Glocke in der App.

   Und nicht an den, der es getan hat — der weiss es. */
async function erledigtPush(firma, studioKey, t) {
  const wo = await studioName(firma, studioKey);
  const wer = t.doneBy || 'Jemand';
  const tokens = await collectTokens(
    d => (d.role === 'chef' || (d.role === 'leiter' && inStudio(d, studioKey))) &&
         willHaben(d, 'erledigt'),
    t.doneByUid || null, firma);
  if (!tokens.length) return;
  await sendPush(tokens, wo, wer + ' hat „' + (t.title || 'einen Punkt') + '" erledigt');
}

/* ── Welche der drei Meldungen ist faellig? ──
   Reine Rechnung, ohne Datenbank: Zustand jetzt, Merker von vorhin,
   heutiges Datum — heraus kommt die Liste der Mails.

   Aus dem Betrieb gewuenscht: eine Mail, wenn ALLES durch ist, und je
   eine, wenn NUR die Aufgaben bzw. NUR der Putzplan durch sind.

   „Nur" ist woertlich gemeint: ist im selben Augenblick alles fertig,
   geht die Studio-Mail raus und die beiden Teil-Mails nicht. Sonst
   laegen bei einem Studio, dessen letzter Haken beides abschliesst, drei
   Mails im Postfach, die dasselbe sagen.

   Ein fehlender Merker verhaelt sich wie „war nicht fertig" — deshalb
   `!== true` und nicht `=== false`. Sonst bliebe die allererste Meldung
   stumm, weil der Merker erst beim zweiten Mal existiert. Genau das ist
   beim ersten Anlauf passiert.

   HOECHSTENS EINMAL JE TAG UND STUDIO, wie gewuenscht. Ohne diese Sperre
   reicht EINE neu angelegte und gleich wieder abgehakte Aufgabe, um
   dieselbe Meldung ein zweites Mal auszuloesen — der Zustand springt ja
   wirklich von offen auf fertig. Bei 13 Studios ist das der Unterschied
   zwischen ein paar Mails und einem vollen Postfach. Der Stempel steht
   je Sorte: „Aufgaben fertig" am Mittag und „Studio fertig" am Abend
   sind zwei verschiedene Nachrichten. */
const STEMPEL_TAG = { alles: 'tagAlles', aufgaben: 'tagAufgaben', putz: 'tagPutz' };
function fertigMeldungen(stand, alt, heute) {
  const a = alt || {};
  const faellig = [];
  if (stand.gesamt === 0) {
    /* Ein Studio ganz ohne Aufgaben und ohne Putzplan ist nicht
       „fertig", es ist leer. Dafuer bekommt niemand eine Mail. */
    if (a.fertig !== true && stand.dokumente) faellig.push('alles');
  } else {
    if (stand.aufgaben === 0 && a.aufgabenFertig !== true && stand.nAufgaben) faellig.push('aufgaben');
    if (stand.putz === 0 && a.putzFertig !== true && stand.nPutz) faellig.push('putz');
  }
  return faellig.filter(f => a[STEMPEL_TAG[f]] !== heute);
}

const _fertigPruefen = async (change, ctx) => {
  const firma = ctx.params.firma || null;
  const studioKey = ctx.params.studioKey;
  if (!studioKey) return;

  /* Zuerst das einzelne Ereignis. Gemessen wird an doneAt und nicht an
     done: eine taegliche Aufgabe steht am naechsten Morgen wieder offen
     und wird abends erneut abgehakt — ueber done allein waere derselbe
     Punkt nie ein zweites Mal ein Ereignis. Dieselbe Rechnung wie
     meldPruefen() in der App. */
  const vor = change.before.exists ? (change.before.data() || {}) : null;
  const nach = change.after.exists ? (change.after.data() || {}) : null;
  if (nach && nach.done && (nach.doneAt || 0) > ((vor && vor.doneAt) || 0)) {
    try { await erledigtPush(firma, studioKey, nach); }
    catch (e) { console.error('erledigtPush:', e.message); }
  }

  const stand = await offenImStudio(firma, studioKey);
  const merker = W(firma).collection('config').doc('fertig-' + studioKey);
  const alt = await merker.get();
  const a = alt.exists ? (alt.data() || {}) : {};

  const neu = { fertig: stand.gesamt === 0,
                aufgabenFertig: stand.aufgaben === 0,
                putzFertig: stand.putz === 0, ts: Date.now() };

  const heute = tagBerlin();
  const senden = fertigMeldungen(stand, a, heute);
  /* Nichts zu melden UND nichts anders als vorhin: dann auch nicht
     schreiben. Der Ausloeser feuert bei JEDEM Haken, bei jeder neuen
     Aufgabe und bei jeder Aenderung an einem Text — das waeren mehrere
     hundert Schreibvorgaenge am Tag, nur um `ts` zu erneuern. */
  if (!senden.length && a.fertig === neu.fertig &&
      a.aufgabenFertig === neu.aufgabenFertig && a.putzFertig === neu.putzFertig) return;
  senden.forEach(f => { neu[STEMPEL_TAG[f]] = heute; });
  /* Was diesmal wirklich verschickt wurde, steht im Merker. Nicht als
     Beiwerk: ohne dieses Feld ist von aussen nicht zu unterscheiden, ob
     eine Meldung unterdrueckt wurde oder nie faellig war — weder im
     Durchlauf noch spaeter, wenn jemand fragt „warum kam da keine
     Mail?". Es kostet nichts, der Schreibvorgang findet ohnehin statt. */
  neu.gesendet = senden;
  await merker.set(neu, { merge: true });
  if (!senden.length) return;

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
  const fuss = '\n\nStand: ' + zeit + ' Uhr. Diese Meldung kommt höchstens ' +
    'einmal am Tag je Studio.\n\nZu viele dieser Mails? Unter Einstellungen → ' +
    'Meldungen lässt sich jede Sorte einzeln abschalten.';

  for (const f of senden) {
    if (f === 'alles') {
      await teamMail(firma, empfaenger, wo + ': alles erledigt',
        'In ' + wo + ' ist gerade nichts mehr offen — weder Aufgaben noch Putzplan.' +
        fuss, 'fertig');
    } else if (f === 'aufgaben') {
      await teamMail(firma, empfaenger, wo + ': Aufgaben erledigt',
        'In ' + wo + ' sind alle Aufgaben abgehakt.\n\n' +
        'Im Putzplan ' + (stand.putz === 1 ? 'steht noch 1 Punkt' :
          'stehen noch ' + stand.putz + ' Punkte') + ' offen.' + fuss, 'fertigTodos');
    } else {
      await teamMail(firma, empfaenger, wo + ': Putzplan fertig',
        'In ' + wo + ' ist der Putzplan komplett abgehakt.\n\n' +
        'Bei den Aufgaben ' + (stand.aufgaben === 1 ? 'steht noch 1 Punkt' :
          'stehen noch ' + stand.aufgaben + ' Punkte') + ' offen.' + fuss, 'fertigPutz');
    }
  }
};

const _fertigTodo = beideWelten('studios/{studioKey}/todos/{todoId}',
  _fertigPruefen, 'onWrite', { timeoutSeconds: 60 });
const _fertigPutz = beideWelten('studios/{studioKey}/cleaning/{putzId}',
  _fertigPruefen, 'onWrite', { timeoutSeconds: 60 });
exports.onTodoFertig = _fertigTodo.flach;
exports.onTodoFertigF = _fertigTodo.firma;
exports.onPutzFertig = _fertigPutz.flach;
exports.onPutzFertigF = _fertigPutz.firma;

/* ══ Tagesübersicht am Abend ═════════════════════════════════════════
   Die drei Meldungen oben kommen im Augenblick des Fertigwerdens. Sie
   beantworten nicht die Frage, mit der man den Tag abschliesst: WAS IST
   LIEGENGEBLIEBEN? Ein Studio, in dem nie etwas fertig wurde, meldet
   sich naemlich gar nicht — und ausgerechnet das ist das Studio, von
   dem man hoeren wollte.

   Deshalb genau eine Mail am Abend, mit allen Studios darin: eine
   Nachricht statt dreizehn, und der Blick geht auf die Zeilen, in denen
   noch etwas steht.

   20:30 Berlin: die Studios schliessen gegen 21 Uhr. Frueher hiesse
   „noch offen" nur „noch nicht dran gewesen".
   ═══════════════════════════════════════════════════════════════════ */
function standSatz(s) {
  if (s.gesamt === 0) return 'fertig';
  const teile = [];
  if (s.aufgaben) teile.push(s.aufgaben + (s.aufgaben === 1 ? ' Aufgabe' : ' Aufgaben'));
  if (s.putz) teile.push(s.putz + (s.putz === 1 ? ' Punkt im Putzplan' : ' Punkte im Putzplan'));
  return teile.join(' und ') + ' offen';
}

exports.tagesUebersicht = region
  .runWith({ timeoutSeconds: 540, memory: '256MB' })
  .pubsub.schedule('30 20 * * *')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    for (const firma of await alleFirmen()) {
      const namen = await alleStudios(firma);
      const keys = Object.keys(namen).sort((a, b) =>
        String(namen[a]).localeCompare(String(namen[b]), 'de'));
      const stand = {};
      for (const k of keys) {
        const s = await offenImStudio(firma, k);
        /* Ein Studio ohne Aufgaben und ohne Putzplan hat nichts zu
           melden. Es als „fertig" aufzufuehren waere gelogen. */
        if (s.dokumente) stand[k] = s;
      }
      /* Ueber die sortierte Liste filtern, nicht Object.keys(stand):
         die Reihenfolge im Postfach soll die alphabetische sein und
         nicht davon abhaengen, wie ein Objekt seine Schluessel haelt. */
      const mitInhalt = keys.filter(k => stand[k]);
      if (!mitInhalt.length) continue;

      /* Wer bekommt welche Zeilen? Der Chef alle, der Leiter seine.
         Eine Uebersicht ueber Studios, fuer die man nicht zustaendig
         ist, ist keine Uebersicht, sondern Rauschen. */
      const empfaenger = {};                    // uid -> [studioKey]
      for (const uid of await kontenImStudio(firma, null, 'chef')) {
        empfaenger[uid] = mitInhalt.slice();   // eigene Liste je Konto
      }
      for (const k of mitInhalt) {
        for (const uid of await kontenImStudio(firma, k, 'leiter')) {
          if (empfaenger[uid]) continue;        // ist schon als Chef dabei
          (empfaenger[uid] = empfaenger[uid] || []).push(k);
        }
      }

      const datum = new Date().toLocaleDateString('de-DE',
        { timeZone: 'Europe/Berlin', weekday: 'long', day: '2-digit', month: '2-digit' });

      for (const uid of Object.keys(empfaenger)) {
        const meine = empfaenger[uid];
        if (!meine.length) continue;
        const fertig = meine.filter(k => stand[k].gesamt === 0).length;
        const zeilen = meine.map(k => namen[k] + ': ' + standSatz(stand[k]));
        const betreff = meine.length === 1
          ? 'Tagesübersicht ' + namen[meine[0]] + ': ' + standSatz(stand[meine[0]])
          : 'Tagesübersicht: ' + fertig + ' von ' + meine.length + ' Studios fertig';
        await teamMail(firma, [uid], betreff,
          'Stand ' + datum + ', 20:30 Uhr:\n\n' + zeilen.join('\n') +
          '\n\nDiese Übersicht kommt einmal am Abend. Unter Einstellungen → ' +
          'Meldungen lässt sie sich abschalten.', 'tagesbericht');
      }
    }
    return null;
  });
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

    /* ── Die Testphase beginnt beim Anlegen, nicht beim ersten Klick ──
       JEDE NEUE FIRMA BEKOMMT HIER EINEN EINTRAG, und das ist der
       eigentliche Schalter der Paywall: "kein Eintrag" heisst ueberall
       sonst "voller Zugriff" — dabei bleibt es, denn darauf steht der
       Bestandsschutz. Neu ist nur, dass es ab jetzt keine Firma mehr
       OHNE Eintrag gibt. Wer heute schon da ist, bleibt offen; wer
       morgen dazukommt, hat eine Frist.

       Waere es andersherum geloest — "kein Eintrag" heisst "zu" —,
       ginge am Tag der Auslieferung jeder Bestandskunde zu, und der
       Fehler faellt erst auf, wenn das Telefon klingelt. */
    const tage = Math.max(1, Number(process.env.TEST_TAGE || 30));
    await db.collection('firmen').doc(kennung)
      .collection('abo').doc('aktuell').set({
        stufe: 'basic',
        status: 'test',
        netto: 0,
        bisAm: Date.now() + tage * 86400000,
        offenSeit: null,
        leiter: null,
        jeGezahlt: false,
        vonHand: false,
        firmaName: name,
        notiz: 'Testphase ' + tage + ' Tage, beim Anlegen gesetzt',
        gesetztVon: context.auth.uid,
        gesetztAm: Date.now(),
      });

    return {
      kennung: kennung, uid: konto.uid, passwort: passwort,
      studios: anzahl, testTage: tage,
    };
  });

/* ── Bestandsschutz ───────────────────────────────────────────────────
   Einmal laufen zu lassen, bevor die Paywall scharf wird: jede Firma,
   die es HEUTE schon gibt und die noch keinen Abo-Eintrag hat, bekommt
   fest 'gratis'.

   Warum ueberhaupt, wo "kein Eintrag" doch vollen Zugriff bedeutet?
   Weil diese Regel eines Tages jemandem zu lasch vorkommt. Steht bei
   jedem Bestandskunden ausdruecklich 'gratis', ueberlebt der
   Bestandsschutz auch die Aenderung, die ihn sonst still abraeumt —
   und man sieht in der Liste, dass es Absicht war und kein leeres Feld.

   ANSEHEN IST DIE VOREINSTELLUNG. Geschrieben wird nur mit
   wirklich:true — dieselbe Vorsichtsregel wie bei den Werkzeugen unter
   tools/, und aus demselben Grund: ein Lauf, der ueber alle Kunden
   geht, soll man erst sehen und dann ausfuehren. */
exports.bestandsschutz = region
  .https.onCall(async (data, context) => {
    await requireAdmin(context);
    const wirklich = !!(data && data.wirklich);
    const firmen = await db.collection('firmen').get();

    const betroffen = [];
    for (const f of firmen.docs) {
      const abo = await f.ref.collection('abo').doc('aktuell').get();
      if (abo.exists) continue;                 // hat schon einen Zustand
      betroffen.push({ kennung: f.id, name: (f.data() || {}).name || '' });
      if (!wirklich) continue;
      await f.ref.collection('abo').doc('aktuell').set({
        stufe: 'premium',
        status: 'gratis',
        netto: 0,
        bisAm: null,
        offenSeit: null,
        leiter: null,
        jeGezahlt: false,
        /* vonHand, damit die naechtliche Uhr diesen Eintrag nie
           anfasst. Bestandsschutz ist eine Entscheidung. */
        vonHand: true,
        firmaName: (f.data() || {}).name || '',
        notiz: 'Bestandsschutz — war vor der Paywall da',
        gesetztVon: context.auth.uid,
        gesetztAm: Date.now(),
      });
    }
    return {
      ok: true,
      wirklich: wirklich,
      anzahl: betroffen.length,
      firmen: betroffen,
    };
  });

/* ══════════════════════════════════════════════════════════════════════
   DAS ABO — ZUSTAENDE UND WAS SIE ERLAUBEN (Stufe C/D aus ABO-PLAN.md)

   'gratis' ist ein eigener Zustand, kein Preis von 0: eine Entscheidung,
   kein Zahlungsausfall — und darf nie in die Mahnstufen geraten. Genau
   darauf steht der Bestandsschutz fuer Koerperformen.

   DIE LEITER IST EINE EINBAHNSTRASSE NACH UNTEN, und sie wird nicht aus
   dem vorigen Zustand weitergestellt, sondern jedes Mal neu aus EINEM
   Datum gerechnet (offenSeit). Der Unterschied ist der zwischen einer
   Uhr, die man aufziehen muss, und einer, die man ablesen kann: laeuft
   der Zeitplan einen Tag nicht, steht eine weitergestellte Leiter still
   und ein Kunde behaelt Zugang, den er nicht mehr hat. Eine gerechnete
   holt den Tag beim naechsten Lauf von selbst auf.
   ══════════════════════════════════════════════════════════════════ */
const ABO_STUFEN = ['basic', 'premium'];

const ABO_STATUS = [
  'gratis',      // zahlt nie. Bestandsschutz, eigener Betrieb, Sonderfaelle
  'test',        // Testphase, laeuft bis bisAm
  'aktiv',       // bezahlt
  'gekuendigt',  // gekuendigt, laeuft aber noch bis bisAm
  'faellig',     // Zahlung offen — Tag 0
  'mahnung1',    // Tag 7
  'mahnung2',    // Tag 14
  'nurlesen',    // Tag 21 — sehen ja, aendern nein
  'zu',          // Tag 35 — kein Zugang mehr
];

/* Was ein Zustand erlaubt. DREI Stufen, und die Aufzaehlung steht
   ausdruecklich hier und nicht als Vergleich "ab Stufe X": wer eine
   Leiter mit > vergleicht, sperrt beim Einfuegen eines neuen Zustands
   versehentlich den halben Kundenstamm aus.

   KEIN EINTRAG HEISST VOLLER ZUGRIFF. Das ist der heutige Zustand fuer
   den eigenen Betrieb und fuer jeden Kunden, bei dem noch nichts
   eingetragen ist — ein Kunde, dem die App zugeht, weil jemand ein Feld
   nicht ausgefuellt hat, waere der schlechtere Fehler. Dieselbe
   Entscheidung wie bei aboStufe() in index.html. */
const ABO_NURLESEN = ['nurlesen'];
const ABO_ZU = ['zu'];

function aboZugriff(status) {
  const s = String(status || '');
  if (ABO_ZU.indexOf(s) >= 0) return 'zu';
  if (ABO_NURLESEN.indexOf(s) >= 0) return 'nurlesen';
  return 'voll';
}

/* ── Die Mahnleiter: zwei, nicht eine ──────────────────────────────────
   Wer schon einmal gezahlt hat, bekommt die lange Leiter aus Abschnitt 3
   des Plans: drei Wochen, in denen das Team GAR NICHTS merkt. Der Grund
   steht dort und gilt unveraendert — eine Aushilfe kann die Rechnung
   nicht bezahlen, und wer sie aussperrt, bestraft die Falsche und
   verliert den Kunden wegen der Sperre statt wegen des Preises.

   Wer noch nie gezahlt hat, dessen Testphase ist abgelaufen. Ihm
   dieselben fuenf Wochen zu geben hiesse, die Paywall abzuschaffen: die
   Testphase waere dann in Wahrheit zehn Wochen lang. Er kommt sofort
   auf nurlesen — sehen und herausholen ja, weiterarbeiten nein — und
   nach zwei Wochen ist zu.

   Beide Leitern lassen 'nurlesen' vor 'zu' stehen, und das ist kein
   Entgegenkommen: Putzplan, Dienstplan und Nachweise sind
   Betriebsunterlagen. Sie von einem Tag auf den anderen unerreichbar zu
   machen ist etwas anderes, als eine Software abzuschalten. */
const LEITERN = {
  lang: [
    { tag: 35, status: 'zu' },
    { tag: 21, status: 'nurlesen' },
    { tag: 14, status: 'mahnung2' },
    { tag: 7, status: 'mahnung1' },
    { tag: 0, status: 'faellig' },
  ],
  kurz: [
    { tag: 14, status: 'zu' },
    { tag: 0, status: 'nurlesen' },
  ],
};

/* WELCHE LEITER GILT, WIRD BEIM BETRETEN FESTGEHALTEN, nicht spaeter
   erraten. Die erste Fassung schloss sie aus "hat je gezahlt" — das
   war an genau einer Stelle falsch: wer regulaer KUENDIGT, hat gezahlt
   und bekaeme die lange Leiter, also fuenf Wochen Vollzugriff nach dem
   Vertragsende. Eine Kuendigung waere damit guenstiger als das Abo.

   Deshalb steht im Eintrag das Feld `leiter`. Gesetzt wird es dort, wo
   der Rueckstand entsteht, und dort ist immer klar, worum es sich
   handelt. `jeGezahlt` bleibt als Angabe fuer die Anzeige, ist aber
   keine Weiche mehr. */
function aboStufeNachTagen(offenSeit, leiterName, jetzt) {
  const leiter = LEITERN[leiterName] || LEITERN.kurz;
  const tage = Math.floor(((jetzt || Date.now()) - offenSeit) / 86400000);
  for (const stufe of leiter) {
    if (tage >= stufe.tag) return stufe.status;
  }
  return leiter[leiter.length - 1].status;
}

/* ── Abo-Zustand von Hand setzen (Stufe A) ────────────────────────────
   Der Betreiber kann jeden Zustand setzen — auch einen aus der
   Mahnleiter, etwa um eine Sperre zurueckzunehmen, waehrend eine
   Ueberweisung noch unterwegs ist.

   Als Function statt als Regel, weil hier gepruefte Werte (Stufennamen,
   Betraege, Datum) und ein Vermerk hingehoeren, wer es gesetzt hat. */

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

    /* Was vorher dastand, wird gebraucht: jeGezahlt darf eine Hand nicht
       versehentlich loeschen, sonst bekaeme ein langjaehriger Kunde beim
       naechsten Zahlungsausfall die kurze Testphasen-Leiter. */
    const ref = db.collection('firmen').doc(kennung).collection('abo').doc('aktuell');
    const alt = (await ref.get()).data() || {};

    /* Setzt der Betreiber von Hand einen Zustand OBERHALB der Mahnleiter,
       ist der Rueckstand erledigt — also muss die Uhr zurueckgestellt
       werden. Bliebe offenSeit stehen, faende der naechste naechtliche
       Lauf den alten Rueckstand wieder und sperrte sofort erneut. Genau
       so verliert man einen Kunden, dem man gerade geholfen hat. */
    const inLeiter = ['faellig', 'mahnung1', 'mahnung2', 'nurlesen', 'zu'];
    let offenSeit = alt.offenSeit || null;
    let leiter = alt.leiter || null;
    if (inLeiter.indexOf(status) < 0) {
      offenSeit = null;
      leiter = null;
    } else if (!offenSeit) {
      offenSeit = Date.now();
      /* Von Hand in die Leiter gesetzt: die lange, denn das tut der
         Betreiber bei einem zahlenden Kunden, der in Rueckstand ist.
         Steht schon eine drin, bleibt sie. */
      leiter = leiter || 'lang';
    }

    const eintrag = {
      stufe: stufe,
      status: status,
      netto: netto,
      bisAm: bisAm,                                  // null = unbefristet
      offenSeit: offenSeit,                          // null = nichts offen
      leiter: leiter,                                // 'lang' | 'kurz' | null
      /* Einmal wahr, immer wahr: es beschreibt die Vergangenheit.
         Nur noch Anzeige, keine Weiche — siehe aboStufeNachTagen(). */
      jeGezahlt: !!(alt.jeGezahlt || status === 'aktiv' || status === 'gekuendigt'),
      /* Von Hand gesetzt heisst: die Uhr laesst diesen Eintrag in Ruhe,
         bis wieder Bewegung von Stripe kommt. Sonst ueberschreibt der
         naechtliche Lauf eine Entscheidung, die jemand bewusst getroffen
         hat — etwa eine Kulanzfrist, waehrend eine Ueberweisung laeuft. */
      vonHand: true,
      notiz: String((data && data.notiz) || '').slice(0, 300),
      gesetztVon: context.auth.uid,
      gesetztVonName: ich.name || '',
      gesetztAm: Date.now(),
    };
    /* merge, damit die Stripe-Kennungen (kunde, abo) stehen bleiben —
       ein set() ohne merge wuerde die Verbindung zur Kasse kappen, und
       der naechste Webhook fuende die Firma nicht mehr. */
    await ref.set(eintrag, { merge: true });
    return Object.assign({ ok: true, kennung: kennung }, eintrag);
  });

/* ══════════════════════════════════════════════════════════════════════
   DIE KASSE — STRIPE (Stufe C aus docs/ABO-PLAN.md)

   KARTENDATEN FASST DIESE APP NIEMALS AN. Das ist keine Vorsicht,
   sondern der einzige gangbare Weg: wer Kartennummern selbst
   entgegennimmt, faellt unter PCI-DSS, und das ist fuer einen Betrieb
   dieser Groesse unbezahlbar. Der Kunde wird auf eine Seite von Stripe
   geschickt und kommt zurueck. Hier laeuft nur die Kennung des Abos
   durch, nie eine Nummer.

   ALLE SCHLUESSEL KOMMEN AUS process.env. Das Repository ist
   OEFFENTLICH — ein Stripe-Geheimschluessel darin waere nicht nur ein
   Fehler, sondern ein Schaden in echtem Geld, ab der Minute des
   Hochladens. Sie liegen in functions/.env, gefuellt aus
   GitHub-Secrets.

   OHNE SCHLUESSEL PASSIERT NICHTS, und das ist Absicht: fehlt
   STRIPE_SECRET, antworten die drei Endpunkte mit einer klaren Meldung,
   statt zu versuchen und auf halbem Weg liegenzubleiben. Die App kann
   dann alles ausser kassieren — genau der Zustand, in dem sie heute
   ausgeliefert wird.
   ══════════════════════════════════════════════════════════════════ */

let _stripe = null;
function stripeHolen() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET || '';
  if (!key) return null;
  /* Ohne feste Angabe nimmt die Bibliothek die Version, fuer die sie
     gebaut ist. Das ist hier richtig und nicht Bequemlichkeit: eine
     Version festzunageln, die aelter ist als die Bibliothek, hiesse
     Objekte in einer Form zu bekommen, fuer die der eingebaute Code
     nicht geschrieben wurde.

     WICHTIG, UND DAS WAR EIN FEHLER IN DER ERSTEN FASSUNG: diese
     Angabe gilt nur fuer AUFRUFE, die von hier ausgehen. Die Form der
     ZUGESTELLTEN Ereignisse bestimmt der Webhook-Endpunkt im
     Stripe-Dashboard, nicht diese Zeile. Deshalb liest der Haken
     unten beide Formen — siehe aboIdAusRechnung(). */
  _stripe = require('stripe')(key);
  return _stripe;
}

/* ══════════════════════════════════════════════════════════════════════
   DREI FELDER, DIE STRIPE VERSCHOBEN HAT

   Mit der API-Version 2025-03-31 ("basil") sind Felder weggefallen, die
   die erste Fassung dieses Hakens gelesen hat:

   | frueher                          | heute                                        |
   |----------------------------------|----------------------------------------------|
   | invoice.subscription             | invoice.parent.subscription_details.subscription |
   | subscription.current_period_end  | subscription.items.data[0].current_period_end |

   Nachgeprueft im CHANGELOG der installierten Bibliothek, nicht aus dem
   Gedaechtnis: „Remove support for ... `subscription` ... on `Invoice`"
   und „Remove support for `current_period_end` ... on `Subscription`".

   WARUM DAS NICHT MIT EINER VERSIONSANGABE ZU LOESEN IST: die Form der
   zugestellten Ereignisse haengt am WEBHOOK-ENDPUNKT im Dashboard, nicht
   am Client. Wer den Endpunkt heute anlegt, bekommt die neue Form —
   egal, was hier steht. Und wer spaeter die Kontoversion hochzieht,
   aendert sie erneut.

   Der Fehler waere leise gewesen: die Firma wuerde ueber den Kunden
   trotzdem gefunden, aber `bisAm` bliebe leer und die Abo-Kennung
   fehlte. In der App staende dann „laeuft" ohne Datum, und die
   Kuendigung ueber das Portal fiele auf die Uhr zurueck. Nichts davon
   wirft einen Fehler — es stimmt nur nicht.

   Also beide Formen lesen. Die neue zuerst, weil sie die kuenftige ist.
   ══════════════════════════════════════════════════════════════════ */

/* Stripe liefert Verweise entweder als Kennung oder — bei erweiterten
   Objekten — als das ganze Objekt. Beides kommt vor, je nachdem wie der
   Endpunkt eingestellt ist. Wer das nicht abfaengt, schreibt ein Objekt
   in ein Feld, in dem eine Kennung stehen soll, und merkt es erst beim
   naechsten Aufruf. */
function kennungVon(wert) {
  if (!wert) return null;
  return typeof wert === 'string' ? wert : (wert.id || null);
}

/* Die Abo-Kennung aus einer Rechnung. */
function aboIdAusRechnung(rechnung) {
  if (!rechnung) return null;
  const neu = rechnung.parent
    && rechnung.parent.subscription_details
    && rechnung.parent.subscription_details.subscription;
  return kennungVon(neu || rechnung.subscription);
}

/* Bis wann ist bezahlt? Aus der Rechnung: der Zeitraum der ersten
   Position. Dieses Feld hat Stripe NICHT verschoben. */
function periodeAusRechnung(rechnung) {
  const p = rechnung && rechnung.lines && rechnung.lines.data
    && rechnung.lines.data[0] && rechnung.lines.data[0].period;
  return p && p.end ? p.end * 1000 : null;
}

/* Bis wann laeuft ein Abo? Alt am Abo selbst, neu an der ersten
   Position. */
function periodeAusAbo(abo) {
  if (!abo) return null;
  const alt = abo.current_period_end;
  const neu = abo.items && abo.items.data && abo.items.data[0]
    && abo.items.data[0].current_period_end;
  const s = neu || alt;
  return s ? s * 1000 : null;
}

/* Wohin Stripe den Kunden zurueckschickt. Aus der Umgebung, damit der
   Probelauf nicht in den Betrieb zurueckfaellt — ein Kunde, der nach
   dem Bezahlen in der falschen App landet, haelt sie fuer kaputt. */
function appAdresse() {
  return (process.env.APP_URL || 'https://formenchat.web.app').replace(/\/+$/, '');
}

/* Zwei Posten je Stufe: der Grundpreis und der Aufschlag JE WEITEREM
   Studio. Genau die Form aus Abschnitt 4 des Plans — "je Studio,
   Mitarbeiter unbegrenzt". Die Preis-Kennungen legt man in Stripe an;
   hier stehen nur ihre Namen. */
function preiseFuer(stufe) {
  if (stufe === 'premium') {
    return {
      grund: process.env.STRIPE_PREIS_PREMIUM || '',
      studio: process.env.STRIPE_PREIS_PREMIUM_STUDIO || '',
    };
  }
  return {
    grund: process.env.STRIPE_PREIS_BASIC || '',
    studio: process.env.STRIPE_PREIS_BASIC_STUDIO || '',
  };
}

/* Wie viele Studios hat dieser Betrieb gerade? Die Zahl geht als Menge
   in den zweiten Posten. Stillgelegte Studios zaehlen nicht mit —
   sonst zahlt jemand fuer einen Standort, den er geschlossen hat. */
async function studiozahl(firma) {
  try {
    const d = await db.collection('firmen').doc(firma)
      .collection('config').doc('studios').get();
    const liste = d.exists ? (d.data().liste || []) : [];
    const offen = liste.filter(x => x && x.aktiv !== false).length;
    return Math.max(1, offen);
  } catch (e) {
    console.warn('studiozahl (' + firma + '):', e.message);
    return 1;
  }
}

function keineKasse() {
  return new functions.https.HttpsError('failed-precondition',
    'Die Bezahlung ist noch nicht eingerichtet. Bitte an den Betreiber wenden.');
}

/* ── Die Firma fuer die KASSE ─────────────────────────────────────────
   Bewusst NICHT firmaVonProfil(): das weist eine stillgelegte Firma ab
   — mit gutem Grund, denn dort geht es darum, nicht in fremde Daten zu
   schreiben.

   HIER WAERE DIESELBE PRUEFUNG DIE FALLE: ein Betrieb, der wegen
   Nichtzahlung stillgelegt ist, ist genau der, der zahlen will. Wer
   ihm die Kasse verschliesst, hat eine Sperre gebaut, aus der es
   keinen Weg zurueck gibt — und einen Kunden verloren, der bezahlen
   wollte.

   Geprueft wird deshalb nur, dass es die Firma ueberhaupt gibt: eine
   archivierte (geloeschte) Firma hat kein Dokument mehr, und fuer die
   waere ein Abo sinnlos. */
async function firmaFuerKasse(profil) {
  const f = (profil || {}).firma || KONFIG_FIRMA_RUECKFALL;
  if (!f) {
    throw new functions.https.HttpsError('failed-precondition',
      'Für diesen Betrieb gibt es noch keine Firmenkennung.');
  }
  const d = await db.collection('firmen').doc(f).get();
  if (!d.exists) {
    throw new functions.https.HttpsError('not-found',
      'Diesen Betrieb gibt es nicht mehr.');
  }
  return f;
}
const KONFIG_FIRMA_RUECKFALL = 'koerperformen';

/* ── Zur Kasse ────────────────────────────────────────────────────────
   Nur der Chef. Ein Mitarbeiter, der ein Abo fuer seinen Betrieb
   abschliesst, waere ein Vertrag ohne Vertretungsmacht. */
/* Stand der AGB, dem an der Kasse zugestimmt wird. Derselbe Wert wie
   AGB_STAND in index.html — tests/test-rechtliches.js prüft, dass beide
   gleich sind. */
const AGB_STAND = '2026-09-25';

exports.stripeKasse = region
  .https.onCall(async (data, context) => {
    const ich = await requireChef(context);
    const stripe = stripeHolen();
    if (!stripe) throw keineKasse();

    const firma = await firmaFuerKasse(ich);
    const stufe = ABO_STUFEN.indexOf(String((data && data.stufe) || '')) >= 0
      ? String(data.stufe) : 'basic';
    const preise = preiseFuer(stufe);
    if (!preise.grund) throw keineKasse();

    /* Runde 114: ohne Bestätigung keine Kasse. Die App zeigt den Haken
       (Unternehmer § 14 BGB, AGB, AV-Vertrag) und schickt den Stand mit;
       hier wird er ein zweites Mal geprüft — eine Grenze nur in der
       Oberfläche ist keine. */
    if (!data || data.unternehmer !== true || data.zustimmung !== AGB_STAND) {
      throw new functions.https.HttpsError('failed-precondition',
        'Bitte bestätige zuerst, dass du für ein Unternehmen buchst und den AGB ' +
        'und dem Vertrag zur Auftragsverarbeitung zustimmst.');
    }
    const ref = db.collection('firmen').doc(firma).collection('abo').doc('aktuell');
    const abo = (await ref.get()).data() || {};
    const studios = await studiozahl(firma);

    const posten = [{ price: preise.grund, quantity: 1 }];
    if (studios > 1 && preise.studio) {
      posten.push({ price: preise.studio, quantity: studios - 1 });
    }

    const firmaDoc = (await db.collection('firmen').doc(firma).get()).data() || {};

    /* client_reference_id UND metadata, und das ist keine Doppelung:
       das erste kommt bei checkout.session.completed zurueck, das
       zweite haengt am Abo selbst und ist noch da, wenn Monate spaeter
       eine Rechnung fehlschlaegt und keine Sitzung mehr existiert. */
    const sitzung = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: posten,
      client_reference_id: firma,
      customer: abo.kunde || undefined,
      customer_email: abo.kunde ? undefined : (ich.email || undefined),
      subscription_data: { metadata: { firma: firma, stufe: stufe } },
      metadata: { firma: firma, stufe: stufe, agb: AGB_STAND },
      allow_promotion_codes: true,
      locale: 'de',
      /* Die Anschrift wird fuer die Rechnung gebraucht — und bei
         Geschaeftskunden in der EU fuer die Frage, ob Reverse Charge
         greift. Das entscheidet Stripe anhand der USt-IdNr., nicht
         diese Funktion. */
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      success_url: appAdresse() + '/?kasse=ok',
      cancel_url: appAdresse() + '/?kasse=ab',
    });

    await ref.set({
      stufeGewuenscht: stufe,
      letzteKasse: Date.now(),
      firmaName: firmaDoc.name || '',
      /* Wer wann welchem Stand zugestimmt hat — der Nachweis, falls es
         je darauf ankommt. */
      zustimmung: { agb: AGB_STAND, av: AGB_STAND, unternehmer: true,
                    am: Date.now(), uid: (context.auth && context.auth.uid) || '', name: ich.name || '' },
    }, { merge: true });

    return { ok: true, url: sitzung.url };
  });

/* ── Rechnungen, Zahlungsmittel, Kuendigung ───────────────────────────
   Alles drei kann Stripe besser als wir, und alles drei gehoert dem
   Kunden. Selbst zu bauen hiesse, Rechnungen selbst zu erzeugen — und
   an deren Pflichtangaben scheitert man leise. */
exports.stripeVerwaltung = region
  .https.onCall(async (data, context) => {
    const ich = await requireChef(context);
    const stripe = stripeHolen();
    if (!stripe) throw keineKasse();

    const firma = await firmaFuerKasse(ich);
    const abo = (await db.collection('firmen').doc(firma)
      .collection('abo').doc('aktuell').get()).data() || {};
    if (!abo.kunde) {
      throw new functions.https.HttpsError('failed-precondition',
        'Für diesen Betrieb liegt noch kein Abo bei der Kasse.');
    }
    const sitzung = await stripe.billingPortal.sessions.create({
      customer: abo.kunde,
      return_url: appAdresse() + '/',
      locale: 'de',
    });
    return { ok: true, url: sitzung.url };
  });

/* ── Der Rueckweg von Stripe ──────────────────────────────────────────
   DIESE ADRESSE IST OEFFENTLICH, und sie setzt den Zustand, der
   darueber entscheidet, ob ein Betrieb arbeiten kann. Wer sie ohne
   Pruefung laesst, hat einen Knopf ins Internet gehaengt, mit dem
   jeder jede Firma freischalten oder sperren kann.

   GEPRUEFT WIRD MIT DER SIGNATUR, NICHT MIT EINEM SCHLUESSEL IN DER
   ADRESSE. Stripe unterschreibt jede Zustellung; constructEvent prueft
   die Unterschrift gegen STRIPE_WEBHOOK_SECRET und wirft, wenn sie
   nicht stimmt.

   UND ZWAR UEBER req.rawBody. Das ist der Punkt, an dem diese Bauart
   still kaputtgeht: Express hat den Text laengst zu einem Objekt
   gemacht, und JSON.stringify(req.body) ergibt NICHT dieselben Bytes —
   andere Reihenfolge, andere Leerzeichen. Die Pruefung schluege dann
   immer fehl, und die Versuchung waere gross, sie "vorerst"
   auszubauen. Firebase legt den Rohtext unter req.rawBody ab; genau
   der gehoert hier hin. */
exports.stripeHaken = region.https.onRequest(async (req, res) => {
  const stripe = stripeHolen();
  const geheim = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!stripe || !geheim) { res.status(503).send('Kasse nicht eingerichtet'); return; }

  let ereignis;
  try {
    ereignis = stripe.webhooks.constructEvent(
      req.rawBody, req.headers['stripe-signature'], geheim);
  } catch (e) {
    console.error('Stripe-Haken: Unterschrift stimmt nicht —', e.message);
    res.status(400).send('Unterschrift stimmt nicht');
    return;
  }

  try {
    await stripeEreignis(stripe, ereignis);
  } catch (e) {
    /* 500 heisst fuer Stripe: noch einmal versuchen. Genau das wollen
       wir — eine Zustellung, die an einem Netzfehler scheitert, darf
       nicht dazu fuehren, dass ein zahlender Kunde gesperrt bleibt. */
    console.error('Stripe-Haken (' + ereignis.type + '):', e);
    res.status(500).send('später noch einmal');
    return;
  }
  res.status(200).send('ok');
});

/* Die Firma zu einem Stripe-Objekt. Drei Wege, absichtlich in dieser
   Reihenfolge: die Kennung am Abo haelt am laengsten, die an der
   Sitzung gibt es nur beim ersten Mal, und der Kunde ist der Rueckweg,
   wenn beides fehlt. Findet keiner etwas, wird NICHTS gesetzt — lieber
   ein Ereignis, das liegen bleibt und im Protokoll steht, als eines,
   das die falsche Firma trifft. */
async function firmaZuStripe(stripe, obj) {
  const m = (obj && obj.metadata) || {};
  if (m.firma) return m.firma;
  if (obj && obj.client_reference_id) return obj.client_reference_id;

  /* aboIdAusRechnung deckt beide Formen ab; obj.id greift, wenn das
     Ereignis das Abo selbst ist (customer.subscription.*). */
  const aboId = aboIdAusRechnung(obj) || (obj && obj.id);
  if (aboId && String(aboId).startsWith('sub_')) {
    try {
      const s = await stripe.subscriptions.retrieve(String(aboId));
      if (s && s.metadata && s.metadata.firma) return s.metadata.firma;
    } catch (e) { /* weiter unten */ }
  }
  const kunde = obj && obj.customer;
  if (kunde) {
    const t = await db.collectionGroup('abo').where('kunde', '==', kunde).limit(2).get();
    /* Genau EINE Firma darf es sein. Zwei Treffer heissen, dass ein
       Stripe-Kunde an zwei Betrieben haengt — dann ist jede Wahl
       geraten, und geraten wird hier nicht. */
    if (t.size === 1) return t.docs[0].ref.parent.parent.id;
    if (t.size > 1) console.error('Stripe-Kunde ' + kunde + ' haengt an mehreren Firmen.');
  }
  return null;
}

async function stripeEreignis(stripe, ereignis) {
  const obj = ereignis.data.object;
  const firma = await firmaZuStripe(stripe, obj);
  if (!firma) {
    console.error('Stripe: keine Firma zu ' + ereignis.type + ' (' + ereignis.id + ')');
    return;
  }
  const ref = db.collection('firmen').doc(firma).collection('abo').doc('aktuell');

  /* Jedes Ereignis nimmt vonHand zurueck: sobald die Kasse wieder
      spricht, gilt wieder die Kasse. */
  const grund = { vonHand: false, letztesEreignis: ereignis.type, letztesEreignisAm: Date.now() };

  switch (ereignis.type) {
    case 'checkout.session.completed': {
      await ref.set(Object.assign({
        kunde: obj.customer || null,
        /* Checkout.Session.subscription gibt es weiterhin — aber als
           `string | Subscription`. Erweitert liefert Stripe das ganze
           Abo; dann laege hier ein Objekt statt einer Kennung, und der
           naechste Portal-Aufruf suchte nach einem Kunden namens
           [object Object]. */
        abo: kennungVon(obj.subscription),
        stufe: (obj.metadata && obj.metadata.stufe) || 'basic',
      }, grund), { merge: true });
      break;
    }

    case 'invoice.paid': {
      /* Bezahlt ist der einzige Zustand, der die Leiter wirklich
         loescht. Alles andere waere ein Rueckstand, der spaeter
         unerklaerlich wieder auftaucht. */
      await ref.set(Object.assign({
        status: 'aktiv',
        jeGezahlt: true,
        offenSeit: null,
        leiter: null,
        netto: typeof obj.amount_paid === 'number' ? obj.amount_paid / 100 : undefined,
        bisAm: periodeAusRechnung(obj),
        kunde: obj.customer || undefined,
        abo: aboIdAusRechnung(obj) || undefined,
      }, grund), { merge: true });
      break;
    }

    case 'invoice.payment_failed': {
      const alt = (await ref.get()).data() || {};
      await ref.set(Object.assign({
        status: alt.offenSeit ? alt.status : 'faellig',
        /* Die Uhr laeuft ab dem ERSTEN Fehlschlag. Stripe versucht es
           mehrfach; wer bei jedem Versuch neu anfaengt, sperrt nie. */
        offenSeit: alt.offenSeit || Date.now(),
        leiter: alt.leiter || 'lang',
      }, grund), { merge: true });
      break;
    }

    case 'customer.subscription.updated': {
      if (obj.cancel_at_period_end) {
        await ref.set(Object.assign({
          status: 'gekuendigt',
          bisAm: periodeAusAbo(obj),
        }, grund), { merge: true });
      } else if (obj.status === 'active') {
        await ref.set(Object.assign({
          status: 'aktiv', offenSeit: null, leiter: null,
          bisAm: periodeAusAbo(obj),
        }, grund), { merge: true });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      /* Vertragsende. NICHT sofort zu: der Putzplan, die Dienstplaene
         und die Nachweise sind Betriebsunterlagen, und zwei Wochen
         Nur-Lesen sind die Frist, in der jemand sie herausholen kann.

         Die KURZE Leiter, ausdruecklich. Wer gekuendigt hat, hat
         gezahlt — mit der langen Leiter waere eine Kuendigung fuenf
         Wochen Vollzugriff geschenkt und damit guenstiger als das Abo. */
      await ref.set(Object.assign({
        status: 'nurlesen',
        offenSeit: Date.now(),
        leiter: 'kurz',
        abo: null,
      }, grund), { merge: true });
      break;
    }

    default:
      /* Stripe schickt viel. Was hier nicht steht, geht niemanden an —
         aber es wird beantwortet, sonst versucht Stripe es tagelang. */
      break;
  }
}

/* ── Was das TEAM erfahren darf ───────────────────────────────────────
   Der Abo-Eintrag ist fuer den Chef und den Betreiber lesbar und fuer
   sonst niemanden — dort steht, was ein Betrieb zahlt, und das geht
   eine Aushilfe nichts an.

   Trotzdem muss die App jedem sagen koennen „gerade laesst sich nichts
   aendern". Ohne das laeuft ein Mitarbeiter beim Abhaken in einen
   Fehler, und die Oberflaeche behauptet das Gegenteil der Datenbank —
   genau der Zustand, der beim Sperren einer Firma zwei Tage lang
   unbemerkt blieb.

   Deshalb spiegelt dieser Ausloeser NUR DIE STUFE nach
   config/zugriff: voll, nurlesen oder zu. Kein Betrag, kein Datum,
   keine Mahnstufe. Dass ein Betrieb im Rueckstand ist, erfaehrt das
   Team hier nicht — und drei Wochen lang merkt es ohnehin nichts, das
   ist die Entscheidung aus Abschnitt 3 des Plans.

   ALS AUSLOESER UND NICHT ALS AUFRUF IN JEDER FUNKTION: den Zustand
   setzen inzwischen fuenf Stellen (von Hand, vier Stripe-Ereignisse,
   die Uhr, das Anlegen, der Bestandsschutz). Eine davon wuerde man
   irgendwann vergessen, und dann steht in der App etwas anderes als in
   der Datenbank. Hier haengt es an der Aenderung selbst. */
exports.aboZugriffSpiegeln = region
  .firestore.document('firmen/{firma}/abo/aktuell')
  .onWrite(async (change, ctx) => {
    const firma = ctx.params.firma;
    const nach = change.after.exists ? (change.after.data() || {}) : null;
    const vor = change.before.exists ? (change.before.data() || {}) : null;

    /* Zugang ganz entziehen oder zurueckgeben — siehe zuSchalten().
       Steht hier und nicht in der Uhr, weil der Zustand aus vier
       Richtungen kommen kann (Uhr, Stripe, von Hand, Anlegen) und eine
       davon man irgendwann vergisst. */
    await zuSchalten(firma, vor, nach ? nach.status : '');

    const stufeNeu = nach ? aboZugriff(nach.status) : 'voll';
    const stufeAlt = vor ? aboZugriff(vor.status) : 'voll';
    /* Nur bei echter Aenderung schreiben. Sonst loest jede Notiz am
       Abo einen Schreibvorgang aus, den alle Geraete als Aenderung
       zugestellt bekommen. */
    if (stufeNeu === stufeAlt && change.before.exists) return null;

    try {
      await db.collection('firmen').doc(firma)
        .collection('config').doc('zugriff')
        .set({ stufe: stufeNeu, stand: Date.now() });
      console.log('Zugriffsstufe ' + firma + ': ' + stufeAlt + ' → ' + stufeNeu);
    } catch (e) {
      console.error('Zugriffsstufe (' + firma + '):', e.message);
    }
    return null;
  });

/* ══════════════════════════════════════════════════════════════════════
   DIE UHR — die Mahnstufen weiterstellen (Stufe D aus ABO-PLAN.md)

   Laeuft jede Nacht und rechnet fuer jedes Abo den Zustand NEU aus dem
   Datum aus, statt ihn eine Stufe weiterzuschieben. Warum, steht oben
   bei LEITERN: eine Nacht ohne Lauf darf keinem Kunden Zugang
   schenken, den er nicht mehr hat.

   DREI DINGE FASST DIESE UHR NIE AN:
   · 'gratis' — das ist eine Entscheidung, kein Zahlungsausfall. Darauf
     steht der Bestandsschutz fuer Koerperformen und jeden, der die App
     heute benutzt.
   · Eintraege mit vonHand:true — der Betreiber hat bewusst etwas
     gesetzt, etwa eine Kulanzfrist waehrend eine Ueberweisung laeuft.
     Eine Uhr, die eine Entscheidung ueberschreibt, ist keine Hilfe.
   · Firmen ohne Abo-Eintrag — kein Eintrag heisst voller Zugriff, und
     eine Uhr, die daraus einen Rueckstand macht, sperrt den Betrieb
     wegen eines leeren Feldes aus.
   ══════════════════════════════════════════════════════════════════ */

const MAHN_TEXT = {
  faellig: {
    betreff: 'Zahlung offen',
    text: 'die letzte Abbuchung für StudioChat hat nicht geklappt.\n\n' +
      'Meist liegt es an einer abgelaufenen Karte. Unter Verwaltung → System → Abo ' +
      'lässt sich das Zahlungsmittel in einer Minute ändern.\n\n' +
      'Für das Team ändert sich vorerst nichts.',
  },
  mahnung1: {
    betreff: 'Zahlung weiterhin offen',
    text: 'die Zahlung für StudioChat ist seit einer Woche offen.\n\n' +
      'Unter Verwaltung → System → Abo lässt sich das Zahlungsmittel ändern.\n\n' +
      'Für das Team ändert sich weiterhin nichts.',
  },
  mahnung2: {
    betreff: 'Zahlung offen — in einer Woche nur noch lesen',
    text: 'die Zahlung für StudioChat ist seit zwei Wochen offen.\n\n' +
      'In einer Woche lässt sich in der App nichts mehr anlegen oder ändern. ' +
      'Sehen kann das Team dann weiterhin alles.\n\n' +
      'Unter Verwaltung → System → Abo lässt sich das Zahlungsmittel ändern.',
  },
  nurlesen: {
    betreff: 'StudioChat steht jetzt auf Nur-Lesen',
    text: 'in StudioChat lässt sich ab sofort nichts mehr anlegen oder ändern. ' +
      'Alles Vorhandene — Dienstpläne, Putzplan, Nachweise, Dokumente — bleibt ' +
      'sichtbar und lässt sich herausholen.\n\n' +
      'Sobald die Zahlung durch ist, ist alles sofort wieder da.',
  },
  zu: {
    betreff: 'StudioChat ist stillgelegt',
    text: 'der Zugang zu StudioChat ist stillgelegt.\n\n' +
      'Die Daten sind nicht gelöscht. Wer zahlt, ist einen Klick entfernt: ' +
      'die Anmeldung führt die Geschäftsführung weiterhin zur Kasse.',
  },
};

/* Die Chefs einer Firma. Eine Mahnung geht an die Geschaeftsfuehrung
   und an sonst niemanden — eine Aushilfe kann die Rechnung nicht
   bezahlen, und sie hat auch nichts damit zu tun. */
async function chefsVon(firma) {
  try {
    const s = await db.collection('users')
      .where('firma', '==', firma).where('role', '==', 'chef').get();
    return s.docs.filter(d => (d.data() || {}).aktiv !== false).map(d => d.id);
  } catch (e) {
    console.warn('chefsVon (' + firma + '):', e.message);
    return [];
  }
}

/* Absichtlich NICHT ueber teamMail(): das respektiert die
   Abschaltwuensche unter mailAus, und eine Zahlungserinnerung ist
   keine Benachrichtigungseinstellung. Wer sie abschalten koennte,
   erfuehre von der Sperre erst, wenn sie da ist. */
async function mahnMail(firma, status) {
  const vorlage = MAHN_TEXT[status];
  const mailer = getMailer();
  if (!vorlage || !mailer) return 0;
  const uids = await chefsVon(firma);
  if (!uids.length) return 0;
  const adressen = await adressenVon(uids);
  const von = process.env.MAIL_FROM || process.env.SMTP_USER;
  let raus = 0;
  for (const an of adressen) {
    try {
      await mailer.sendMail({
        from: '"StudioChat" <' + von + '>',
        to: an,
        subject: 'StudioChat: ' + vorlage.betreff,
        text: 'Guten Tag,\n\n' + vorlage.text + '\n\nViele Grüße\nStudioChat',
      });
      raus++;
    } catch (e) {
      console.error('Mahnmail an ' + an + ':', e.message);
    }
  }
  return raus;
}

/* ── 'zu' heisst wirklich zu ───────────────────────────────────────────
   Die Schreibsperre haengt an einem get() auf den Abo-Eintrag. Beim
   LESEN dasselbe zu tun, hiesse ein zusaetzlicher Lesevorgang bei
   JEDEM Zugriff der ganzen App — fuer eine Grenze, die hoffentlich nie
   jemanden trifft. Der Vermerk bei hatPremium() in firestore.rules
   sagt aus genau diesem Grund: nicht in inFirma() aufnehmen.

   Also anders herum: 'zu' setzt das Feld `aktiv` auf dem Firmen-
   Dokument, und dieses Feld prueft firmaLaeuft(f) laengst — in
   inFirma(f), also bei jedem Lesen und Schreiben. Kosten: null. Die
   Grenze ist dieselbe wie beim Sperren einer Firma von Hand, und die
   ist erprobt.

   `zuDurchAbo` merkt sich, WER gesperrt hat. Ohne diese Zeile wuerde
   eine eingehende Zahlung eine Firma wieder oeffnen, die der Betreiber
   von Hand stillgelegt hat — aus einem ganz anderen Grund. */
async function zuSchalten(firma, aboVorher, statusNachher) {
  const warZu = (aboVorher || {}).status === 'zu';
  const istZu = statusNachher === 'zu';
  if (warZu === istZu) return;
  const ref = db.collection('firmen').doc(firma);
  try {
    if (istZu) {
      await ref.set({ aktiv: false, zuDurchAbo: true }, { merge: true });
      console.log('Abo-Uhr: ' + firma + ' stillgelegt (Zahlung).');
    } else {
      const f = (await ref.get()).data() || {};
      if (f.zuDurchAbo !== true) {
        console.log('Abo-Uhr: ' + firma + ' bleibt gesperrt — nicht wegen der Zahlung.');
        return;
      }
      await ref.set({ aktiv: true, zuDurchAbo: false }, { merge: true });
      console.log('Abo-Uhr: ' + firma + ' wieder frei.');
    }
  } catch (e) {
    console.error('zuSchalten (' + firma + '):', e.message);
  }
}

/* Den Zustand EINES Abos neu bestimmen. Gibt zurueck, was sich aendern
   soll, oder null. Als eigene Funktion, damit ein Durchlauf sie ohne
   Datenbank und ohne Uhrzeit pruefen kann — die Leiter ist der Teil,
   bei dem ein Fehler Geld und Kunden kostet. */
function aboNeuRechnen(abo, jetzt) {
  if (!abo) return null;                          // kein Eintrag = voller Zugriff
  if (abo.status === 'gratis') return null;       // Entscheidung, kein Rueckstand
  if (abo.vonHand) return null;                   // der Betreiber hat entschieden

  let offenSeit = abo.offenSeit || null;
  let leiter = abo.leiter || null;

  /* Testphase oder gekuendigtes Abo abgelaufen: ab hier laeuft die
     kurze Leiter, und sie laeuft ab dem Ablaufdatum — nicht ab
     heute. Sonst verschenkt ein Lauf, der ein paar Tage aussetzt,
     genau diese Tage. */
  if (!offenSeit && abo.bisAm && jetzt > abo.bisAm &&
      (abo.status === 'test' || abo.status === 'gekuendigt')) {
    offenSeit = abo.bisAm;
    leiter = 'kurz';
  }
  if (!offenSeit) return null;

  const neu = aboStufeNachTagen(offenSeit, leiter || 'kurz', jetzt);
  if (neu === abo.status && offenSeit === abo.offenSeit) return null;
  return { status: neu, offenSeit: offenSeit, leiter: leiter || 'kurz' };
}

async function aboUhrLauf() {
  const jetzt = Date.now();
  let geprueft = 0, geaendert = 0, gemailt = 0;

  let snap;
  try {
    snap = await db.collectionGroup('abo').get();
  } catch (e) {
    console.error('Abo-Uhr: Abos nicht lesbar:', e.message);
    return { geprueft: 0, geaendert: 0, gemailt: 0, fehler: e.message };
  }

  for (const doc of snap.docs) {
    if (doc.id !== 'aktuell') continue;
    const firma = doc.ref.parent.parent ? doc.ref.parent.parent.id : null;
    if (!firma) continue;
    geprueft++;

    const abo = doc.data() || {};
    const aenderung = aboNeuRechnen(abo, jetzt);
    if (!aenderung) continue;

    try {
      await doc.ref.set(Object.assign({ uhrAm: jetzt }, aenderung), { merge: true });
      geaendert++;
      console.log('Abo-Uhr: ' + firma + ' → ' + aenderung.status);
      /* Das Stilllegen haengt am Ausloeser aboZugriffSpiegeln, nicht
         hier: es muss auch dann geschehen, wenn der Zustand von einer
         Stripe-Zustellung oder von Hand kommt. */
      /* Gemailt wird nur bei einem WECHSEL der Stufe, nicht jede
         Nacht. Fuenf gleiche Mahnungen liest niemand mehr. */
      gemailt += await mahnMail(firma, aenderung.status);
    } catch (e) {
      console.error('Abo-Uhr (' + firma + '):', e.message);
    }
  }
  console.log('Abo-Uhr: ' + geprueft + ' geprüft, ' + geaendert + ' geändert, ' +
    gemailt + ' Mails.');
  return { geprueft, geaendert, gemailt };
}

/* 03:45 — nach purgeTrash (03:30), damit sich die beiden Laeufe nicht
   um dieselben Dokumente streiten. */
exports.aboUhr = region
  .runWith({ timeoutSeconds: 300, memory: '256MB' })
  .pubsub.schedule('45 3 * * *')
  .timeZone('Europe/Berlin')
  .onRun(async () => { await aboUhrLauf(); return null; });

/* Zum Nachsehen, ohne bis 3:45 Uhr zu warten. Nur der Betreiber. */
exports.aboUhrJetzt = region
  .https.onCall(async (data, context) => {
    await requireAdmin(context);
    return await aboUhrLauf();
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

/* ══════════════════════════════════════════════════════════════════════
   KALENDER-ABO (.ics)

   Jede Person kann ihre Schichten im eigenen Kalender sehen — Google,
   Apple, Outlook, egal. Nicht als Kalender-Anbindung mit OAuth, sondern
   als ABO-LINK: eine Adresse, die der Kalender selbst regelmaessig neu
   liest.

   WARUM SO UND NICHT MIT OAUTH
   Ein Abo braucht keine Zustimmung bei Google, keine Token-Erneuerung,
   keinen Anbieter — und es funktioniert bei ALLEN Kalendern gleich.
   Der Preis: der Kalender entscheidet selbst, wie oft er neu liest
   (Google oft nur alle paar Stunden). Fuer "wann arbeite ich naechste
   Woche" ist das richtig, fuer kurzfristige Aenderungen nicht. Die App
   bleibt die Wahrheit, der Kalender ist die Bequemlichkeit.

   WO DER SCHLUESSEL LIEGT — und wo NICHT
   Der Link ist ein Dauerschluessel: wer ihn hat, sieht die Schichten,
   ohne sich anzumelden. Er darf deshalb NICHT ins users-Dokument. Das
   ist fuer jeden aktiven Kollegen lesbar (siehe firestore.rules) — ein
   Token dort koennte jeder mitlesen und weitergeben.
   Er liegt in privat/<uid>, und das liest und schreibt ausschliesslich
   der Besitzer selbst. Dafuer war keine neue Regel noetig.

   WARUM KEINE SUCHABFRAGE
   Der Link traegt die Kennung UND das Geheimnis: ?u=<uid>&t=<zufall>.
   Damit findet die Funktion die Person direkt, ohne Abfrage ueber alle
   Konten — kein zusaetzlicher Index, kein Aufzaehlen. Die Kennung ist
   ohnehin kein Geheimnis (sie steht in der App an jeder Schicht); das
   Geheimnis ist der Zufallsteil, und nur der wird verglichen.
   ══════════════════════════════════════════════════════════════════════ */

/* Berliner Wanduhrzeit in echte UTC-Zeit. Zwei Durchgaenge, weil der
   Versatz selbst vom Zeitpunkt abhaengt: im Sommer zwei Stunden, im
   Winter eine. Ein fester Wert waere ein halbes Jahr lang falsch.

   In der einen doppelten Stunde bei der Umstellung im Herbst ist die
   Wanduhrzeit mehrdeutig; dort trifft es die erste. Das ist bewusst
   hingenommen — eine Schicht, die genau in dieser Stunde beginnt, gibt
   es einmal im Jahr, und die Alternative waere eine Zeitzonenbibliothek
   im Auslieferungspfad. */
const _berlinFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Berlin', hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});
function _versatzMs(d) {
  const p = {};
  for (const t of _berlinFmt.formatToParts(d)) p[t.type] = t.value;
  const alsWaere = Date.UTC(+p.year, +p.month - 1, +p.day,
    p.hour === '24' ? 0 : +p.hour, +p.minute, +p.second);
  return alsWaere - d.getTime();
}
function berlinZuUtc(datum, zeit) {
  const [J, M, T] = String(datum).split('-').map(Number);
  const [h, m] = String(zeit || '00:00').split(':').map(Number);
  const roh = Date.UTC(J, (M || 1) - 1, T || 1, h || 0, m || 0, 0);
  let d = new Date(roh - _versatzMs(new Date(roh)));
  d = new Date(roh - _versatzMs(d));      // zweiter Durchgang
  return d;
}
function icsZeit(d) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
function icsDatum(s) { return String(s).replace(/-/g, ''); }

/* Sonderzeichen in ICS-Text. Ohne das zerreisst ein Komma im Studionamen
   den Eintrag — der Standard trennt Werte damit. */
function icsText(s) {
  return String(s == null ? '' : s)
    .replace(/\\/g, '\\\\').replace(/;/g, '\\;')
    .replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/* Zeilen laenger als 75 Zeichen muessen umgebrochen werden, sonst
   verwerfen manche Kalender den Eintrag. Gezaehlt wird in Bytes, nicht
   in Zeichen: "Hürth" ist fuenf Zeichen und sechs Bytes. */
function icsFalten(zeile) {
  const b = Buffer.from(zeile, 'utf8');
  if (b.length <= 75) return zeile;
  const teile = [];
  let start = 0, grenze = 75;
  while (start < b.length) {
    let ende = Math.min(start + grenze, b.length);
    // Nicht mitten in ein Mehrbyte-Zeichen schneiden
    while (ende > start && ende < b.length && (b[ende] & 0xc0) === 0x80) ende--;
    teile.push(b.slice(start, ende).toString('utf8'));
    start = ende; grenze = 74;             // Folgezeilen tragen ein Leerzeichen
  }
  return teile.join('\r\n ');
}

function icsBauen(zeilen) {
  return zeilen.map(icsFalten).join('\r\n') + '\r\n';
}

/* Der Zeitraum: vier Wochen zurueck, ein halbes Jahr voraus. Zurueck,
   damit die letzte Woche nachvollziehbar bleibt; nicht weiter, weil ein
   Abo, das jahrelange Historie mitschleppt, bei jedem Abruf waechst. */
const KAL_TAGE_ZURUECK = 28;
const KAL_TAGE_VORAUS = 182;

function kalTag(versatzTage) {
  const d = new Date(Date.now() + versatzTage * 86400000);
  return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
}

/* Aus einem Zeitstempel den TAG machen — in Berliner Zeit, nicht in UTC.

   EHRLICH GESAGT: heute schriebe auch die naive Rechnung dasselbe.
   `due` wird immer auf 23:59:59 Ortszeit gesetzt (beim Anlegen wie beim
   Verschieben), und 23:59 Ortszeit ist 21:59 oder 22:59 UTC — noch
   derselbe Tag. Auseinander gehen die beiden erst zwischen Mitternacht
   und 01:00 bzw. 02:00 Ortszeit; dort waere `toISOString()` der Vortag.

   Das hier steht trotzdem so, weil die naive Rechnung nur richtig ist,
   SOLANGE niemand eine Frist anders setzt. Eine Frist, die einen Tag zu
   frueh im Kalender steht, faellt niemandem als Fehler auf — man glaubt
   sie einfach und ist einen Tag zu frueh fertig oder zu spaet dran.
   Eine Zeile, die diese Annahme gar nicht erst braucht, kostet nichts. */
function berlinDatum(ms) {
  return new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
}

/* Ganztaegig heisst im Standard: DTEND ist der Tag DANACH. Stand bisher
   zweimal ausgeschrieben in den Abwesenheiten; jetzt einmal hier, weil
   die Fristen dieselbe Rechnung brauchen. */
function tagDanach(tag) {
  const d = new Date(String(tag) + 'T12:00:00Z');
  return new Date(d.getTime() + 86400000).toISOString().slice(0, 10);
}

/* Vergleich ohne Zeitverrat. Bei 32 zufaelligen Bytes ist der Unterschied
   theoretisch, aber er kostet nichts. */
function tokenGleich(a, b) {
  const A = Buffer.from(String(a || ''), 'utf8');
  const B = Buffer.from(String(b || ''), 'utf8');
  if (A.length !== B.length || !A.length) return false;
  return require('crypto').timingSafeEqual(A, B);
}

async function kalenderDaten(uid, firma, profil) {
  const von = kalTag(-KAL_TAGE_ZURUECK), bis = kalTag(KAL_TAGE_VORAUS);
  const p = profil || {};
  const studioKeys = p.studioKeys || [];
  const schichten = [], abwesend = [], fristen = [];

  /* Was abgeschaltet ist, steht auch nicht im Kalender.
     Bis hierher fehlte das: eine Firma konnte den Schichtplan
     ausschalten und bekam ihn ueber den Abo-Link weiter geliefert. Kein
     Datenleck — es sind die eigenen Schichten —, aber der Schalter hiess
     "aus" und war es nicht. */
  const magSchicht = await featureAn(firma, 'schicht');
  const magAbwesend = await featureAn(firma, 'abwesend');
  const magTodos = await featureAn(firma, 'todos');
  /* Ueber ALLE Studios, nicht nur die eigenen: wer einmal aushilft,
     bekommt dort eine Schicht, ohne dem Studio zugeordnet zu sein.
     Nach uid gefiltert wird im Code — eine Abfrage mit Bereich UND
     Gleichheit braeuchte einen zusammengesetzten Index. */
  let keys = [];
  try {
    const docs = await W(firma).collection('studios').listDocuments();
    keys = docs.map(d => d.id);
  } catch (e) { keys = []; }
  for (const k of (keys.length ? keys : (studioKeys || []))) {
    /* Der NAME, nicht die Kennung. Ohne diese Zeile stand im Kalender
       "Schicht · studio-1" — technisch richtig und fuer einen Menschen
       wertlos. Aufgefallen erst im Durchlauf: das Feld studioName wurde
       gelesen, aber nirgends gefuellt. */
    let woName = k;
    try { woName = await studioName(firma, k); } catch (e) { /* dann die Kennung */ }
    if (magSchicht) try {
      const s = await W(firma).collection('studios').doc(k).collection('shifts')
        .where('date', '>=', von).where('date', '<=', bis).get();
      s.forEach(d => {
        const x = d.data() || {};
        if (x.uid === uid) schichten.push(Object.assign({ id: d.id, sk: k, studioName: woName }, x));
      });
    } catch (e) { /* ein Studio ohne Schichten ist kein Fehler */ }
    if (magAbwesend) try {
      const a = await W(firma).collection('studios').doc(k).collection('absences')
        .where('from', '<=', bis).get();
      a.forEach(d => {
        const x = d.data() || {};
        if (x.uid !== uid) return;
        if (String(x.to || x.from) < von) return;        // ganz in der Vergangenheit
        /* Ein offener Urlaubsantrag ist noch kein Urlaub. Ihn in den
           Kalender zu schreiben hiesse, eine Zusage zu behaupten, die
           es nicht gibt. Krankmeldungen gelten sofort. */
        const st = x.type === 'krank' ? 'genehmigt' : (x.status || 'genehmigt');
        if (st !== 'genehmigt') return;
        abwesend.push(Object.assign({ id: d.id, sk: k }, x));
      });
    } catch (e) { /* dito */ }
    /* ── Aufgaben mit Frist ──
       WELCHE AUFGABE IST MEINE? Die Frage ist in der App schon zweimal
       beantwortet, und beide Male gleich: `checkDueReminders()` sagt
       "nur eigene oder nicht zugewiesene", `dueTaskReminder` schickt
       Zugewiesenes an die Person und Nichtzugewiesenes ans Studio. Hier
       eine dritte Antwort zu erfinden hiesse, dass der Kalender etwas
       anderes fuer wichtig haelt als die Erinnerung daneben.

       Zugewiesenes zaehlt also UEBERALL — auch in einem Studio, in dem
       ich sonst nicht stehe. Nicht zugewiesenes nur in MEINEN Studios;
       sonst stuenden in einem Kalender die offenen Aufgaben aller
       dreizehn Studios, und der Kalender waere nach einer Woche
       ungelesen. */
    if (magTodos) try {
      const t = await W(firma).collection('studios').doc(k).collection('todos').get();
      t.forEach(d => {
        const x = d.data() || {};
        if (!x.due) return;
        if (x.assignedTo ? x.assignedTo !== uid : !inStudio(p, k)) return;
        /* erledigt() und nicht `x.done`: eine taegliche Aufgabe ist nur
           INNERHALB ihres Zeitraums erledigt. Ein blosses done haette
           sie nach dem ersten Haken fuer immer aus dem Kalender
           genommen. */
        if (erledigt(x)) return;
        const tag = berlinDatum(x.due);
        if (tag < von || tag > bis) return;
        fristen.push({ art: 'aufgabe', id: k + '-' + d.id, tag: tag,
          titel: x.title || 'Aufgabe', desc: x.desc || '', wo: woName });
      });
    } catch (e) { /* ein Studio ohne Aufgaben ist kein Fehler */ }
  }

  /* ── Die eigenen To-dos ──
     Stehen unter privat/<uid>/aufgaben und gehoeren niemandem sonst.
     Kein Merkmalsschalter: die Liste ist die persoenliche, nicht die
     des Studios. */
  try {
    const e = await W(firma).collection('privat').doc(uid)
      .collection('aufgaben').get();
    e.forEach(d => {
      const x = d.data() || {};
      if (x.erledigt || !x.frist) return;
      const tag = String(x.frist).slice(0, 10);
      if (tag < von || tag > bis) return;
      fristen.push({ art: 'todo', id: d.id, tag: tag,
        titel: x.text || 'To-do', desc: x.notiz || '' });
    });
  } catch (e) { /* wer keine eigenen To-dos hat, hat die Sammlung nicht */ }

  /* ── Nachweise, die ablaufen ──
     Ein Erste-Hilfe-Schein mit Ablaufdatum ist eine Frist wie jede
     andere, und certExpiry erinnert ohnehin schon daran. Nur die
     eigenen — die Nachweise der Kollegen gehen niemanden etwas an. */
  try {
    const c = await W(firma).collection('certificates')
      .where('uid', '==', uid).get();
    c.forEach(d => {
      const x = d.data() || {};
      if (!x.bis) return;
      const tag = String(x.bis).slice(0, 10);
      if (tag < von || tag > bis) return;
      fristen.push({ art: 'nachweis', id: d.id, tag: tag,
        titel: x.bez || x.art || 'Nachweis', desc: '' });
    });
  } catch (e) { /* dito */ }

  return { schichten, abwesend, fristen };
}

exports.kalender = region.https.onRequest(async (req, res) => {
  const uid = String((req.query && req.query.u) || '').slice(0, 128);
  const tok = String((req.query && req.query.t) || '').slice(0, 128);
  /* Eine einzige Antwort fuer "kein Token", "falsches Token" und
     "Konto gibt es nicht". Wer raten will, soll aus der Antwort nicht
     lernen, ob eine Kennung existiert. */
  const abweisen = () => res.status(403)
    .set('Cache-Control', 'no-store')
    .send('Dieser Kalender-Link gilt nicht (mehr).');
  if (!uid || !tok) return abweisen();

  try {
    const prof = await db.collection('users').doc(uid).get();
    if (!prof.exists) return abweisen();
    const p = prof.data() || {};
    if (p.aktiv === false) return abweisen();
    const firma = p.firma || null;

    const geheim = await W(firma).collection('privat').doc(uid).get();
    const gespeichert = ((geheim.exists ? geheim.data() : {}) || {}).kalenderToken;
    if (!tokenGleich(gespeichert, tok)) return abweisen();

    const { schichten, abwesend, fristen } = await kalenderDaten(uid, firma, p);
    const jetzt = icsZeit(new Date());
    const z = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'PRODID:-//StudioChat//Schichtplan//DE',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'X-WR-CALNAME:' + icsText('StudioChat · ' + (p.name || 'Schichten')),
      'X-WR-TIMEZONE:Europe/Berlin',
    ];
    for (const s of schichten) {
      const start = berlinZuUtc(s.date, s.from || '09:00');
      let ende = berlinZuUtc(s.date, s.to || '17:00');
      /* Eine Schicht ueber Mitternacht (22:00–02:00) endet am naechsten
         Tag. Ohne das waere das Ende vor dem Anfang, und der Kalender
         zeigt gar nichts. */
      if (ende <= start) ende = new Date(ende.getTime() + 86400000);
      const wo = s.studioName || s.sk;
      z.push('BEGIN:VEVENT',
        'UID:schicht-' + icsText(s.id) + '@studiochat',
        'DTSTAMP:' + jetzt,
        'DTSTART:' + icsZeit(start),
        'DTEND:' + icsZeit(ende),
        'SUMMARY:' + icsText('Schicht · ' + wo),
        'LOCATION:' + icsText(wo));
      if (s.note) z.push('DESCRIPTION:' + icsText(s.note));
      z.push('END:VEVENT');
    }
    for (const a of abwesend) {
      /* Ganztaegig. DTEND ist bei VALUE=DATE der Tag DANACH — ohne das
         eine Tag Zuschlag fehlt der letzte Urlaubstag im Kalender. */
      z.push('BEGIN:VEVENT',
        'UID:abw-' + icsText(a.id) + '@studiochat',
        'DTSTAMP:' + jetzt,
        'DTSTART;VALUE=DATE:' + icsDatum(a.from),
        'DTEND;VALUE=DATE:' + icsDatum(tagDanach(a.to || a.from)),
        'SUMMARY:' + icsText(a.type === 'krank' ? 'Krank' : 'Urlaub'),
        'TRANSP:TRANSPARENT',
        'END:VEVENT');
    }
    /* ── Fristen ──
       GANZTAEGIG UND NICHT UM 23:59. Eine Aufgabe ist "bis Freitag"
       faellig, nicht "am Freitag um 23:59 Uhr" — ein Termin zu dieser
       Uhrzeit stuende im Kalender unter dem Tag statt darueber und
       traefe niemanden mehr, der ihn noch erledigen koennte.

       UND KEIN VTODO. Der Standard haette dafuer eine eigene Bauart,
       und sie waere die richtige — aber Google Kalender zeigt VTODO
       gar nicht an. Ein Eintrag, den der haeufigste Kalender
       stillschweigend verschluckt, ist schlechter als ein etwas
       unsauberer, den alle zeigen. */
    for (const f of fristen) {
      const wort = f.art === 'aufgabe' ? 'Aufgabe · '
        : f.art === 'todo' ? 'To-do · '
        : 'Nachweis läuft ab · ';
      z.push('BEGIN:VEVENT',
        'UID:' + f.art + '-' + icsText(f.id) + '@studiochat',
        'DTSTAMP:' + jetzt,
        'DTSTART;VALUE=DATE:' + icsDatum(f.tag),
        'DTEND;VALUE=DATE:' + icsDatum(tagDanach(f.tag)),
        'SUMMARY:' + icsText(wort + f.titel),
        /* Eine Frist belegt keine Zeit. Ohne TRANSPARENT sieht der
           ganze Tag fuer jeden, der die Verfuegbarkeit abfragt, belegt
           aus — und wer drei Fristen an einem Tag hat, waere dreimal
           den ganzen Tag "beschaeftigt". */
        'TRANSP:TRANSPARENT');
      const text = [f.desc, f.wo ? 'Studio: ' + f.wo : ''].filter(Boolean).join('\n');
      if (text) z.push('DESCRIPTION:' + icsText(text));
      z.push('END:VEVENT');
    }
    z.push('END:VCALENDAR');

    res.set('Content-Type', 'text/calendar; charset=utf-8')
      .set('Cache-Control', 'private, max-age=900')
      .status(200).send(icsBauen(z));
  } catch (e) {
    console.error('kalender:', e);
    res.status(500).set('Cache-Control', 'no-store').send('Fehler beim Erzeugen des Kalenders.');
  }
});

/* ══════════════════════════════════════════════════════════════════════
   ZEITERFASSUNG — SCHRITT 2: DIE PIN

   Gestempelt wird am Tablet im Studio (docs/ZEITERFASSUNG-PLAN.md). Damit
   das Tablet weiss, WER stempelt, braucht jede Person eine kurze PIN.

   AN DIESER STELLE STEHT ODER FAELLT DAS GANZE SYSTEM. Kann irgendjemand
   die PIN eines anderen lesen, kann er fuer ihn stempeln — und dann ist
   die Aufzeichnung als Nachweis nichts mehr wert.

   Deshalb vier Regeln, und keine davon ist verhandelbar:

   1. GESPEICHERT WIRD NIE DIE PIN, sondern scrypt(PIN, Salz). Ein Hash
      allein genuegt nicht: vier Ziffern sind zehntausend Moeglichkeiten,
      eine Regenbogentabelle dafuer passt auf einen USB-Stick. Das Salz
      ist je Person zufaellig, und scrypt ist absichtlich langsam.

   2. NIEMAND DARF IHN LESEN. Nicht der Kollege, nicht die Leitung, nicht
      der Chef, NICHT EINMAL DIE PERSON SELBST. Lesen muss ihn niemand;
      pruefen tut ihn der Server. In firestore.rules steht die Sammlung
      deshalb auf `if false` — wie appointments und emailTemplates.

   3. VERGLICHEN WIRD ZEITGLEICH (timingSafeEqual). Bei vier Ziffern ist
      der Zeitunterschied theoretisch — aber er kostet nichts, und die
      App macht es beim Kalender-Link schon so.

   4. SETZEN DARF NUR DIE PERSON SELBST. Kein Chef-Weg, keine
      Zuruecksetzung durch die Leitung mit anschliessendem "ich sag dir
      deine neue PIN". Wer seine PIN vergisst, setzt eine neue — mit
      seinem Passwort, also mit dem, was er ohnehin hat.

   WAS DAS NICHT LEISTET, und das steht auch im Plan: wer die PIN eines
   Kollegen KENNT, kann fuer ihn stempeln. Das ist bei jedem PIN-System
   so. Verhindert wird das Stempeln von zu Hause — dafuer sorgt das
   Terminal, nicht die PIN.
   ══════════════════════════════════════════════════════════════════════ */
const PIN_LAENGE_MIN = 4;
const PIN_LAENGE_MAX = 6;

/* Ziffernfolgen, die praktisch keine sind. Eine 1234 ist kein Schutz,
   sondern eine Einladung — und sie waere die haeufigste Wahl. */
function pinZuSchwach(pin) {
  if (/^(\d)\1*$/.test(pin)) return 'Alle Ziffern gleich';
  let auf = true, ab = true;
  for (let i = 1; i < pin.length; i++) {
    if (+pin[i] !== +pin[i - 1] + 1) auf = false;
    if (+pin[i] !== +pin[i - 1] - 1) ab = false;
  }
  if (auf || ab) return 'Ziffern der Reihe nach';
  return null;
}

function pinHashen(pin, salz) {
  /* scrypt mit den Vorgaben von Node. N=16384 ist der Standardwert und
     braucht auf der Function rund 50 ms — genug, um zehntausend
     Moeglichkeiten teuer zu machen, wenig genug fuer einen Stempel. */
  return require('crypto').scryptSync(String(pin), String(salz), 32).toString('hex');
}

/* Zu welcher Firma gehoert der Anrufer? Dieselbe Weiche wie ueberall:
   ohne Feld ist es der eigene Betrieb. */
async function anruferProfil(context) {
  requireAuth(context);
  const snap = await db.collection('users').doc(context.auth.uid).get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('failed-precondition', 'Kein Profil gefunden.');
  }
  const p = snap.data() || {};
  if (p.aktiv === false) {
    throw new functions.https.HttpsError('permission-denied',
      'Dieser Zugang ist noch nicht freigegeben.');
  }
  return { uid: context.auth.uid, profil: p, firma: p.firma || null };
}

/* ── PIN setzen oder aendern ──
   Wer schon eine hat, muss die alte nennen. Sonst koennte ein fremdes
   Handy, das jemand kurz offen liegen laesst, die PIN ueberschreiben —
   und danach fuer diese Person stempeln. */
exports.pinSetzen = region.https.onCall(async (data, context) => {
  const { uid, firma } = await anruferProfil(context);
  const neu = String((data && data.pin) || '').trim();
  const alt = String((data && data.alt) || '').trim();

  if (!new RegExp('^\\d{' + PIN_LAENGE_MIN + ',' + PIN_LAENGE_MAX + '}$').test(neu)) {
    throw new functions.https.HttpsError('invalid-argument',
      'Die PIN muss aus ' + PIN_LAENGE_MIN + ' bis ' + PIN_LAENGE_MAX + ' Ziffern bestehen.');
  }
  const schwach = pinZuSchwach(neu);
  if (schwach) {
    throw new functions.https.HttpsError('invalid-argument',
      'Diese PIN ist zu einfach (' + schwach + '). Bitte eine andere wählen.');
  }

  const ref = W(firma).collection('zeitPins').doc(uid);
  const vorher = await ref.get();
  if (vorher.exists) {
    const d = vorher.data() || {};
    if (!alt) {
      throw new functions.https.HttpsError('failed-precondition',
        'Bitte zuerst die bisherige PIN eingeben.');
    }
    if (!tokenGleich(pinHashen(alt, d.salz), d.hash)) {
      throw new functions.https.HttpsError('permission-denied',
        'Die bisherige PIN stimmt nicht.');
    }
  }

  const salz = require('crypto').randomBytes(16).toString('hex');
  await ref.set({
    hash: pinHashen(neu, salz),
    salz: salz,
    gesetztAm: Date.now(),
    /* Der Name steht MIT DABEI, obwohl er auch im Profil liegt. Grund:
       das Terminal listet Personen, bevor jemand eine PIN eingetippt
       hat — und es darf dafuer nicht die ganze Nutzerliste lesen
       duerfen. Spaeter liest die Stempel-Funktion hier nach. */
    name: (await db.collection('users').doc(uid).get()).data().name || ''
  });
  return { ok: true, gesetzt: true };
});

/* ── Hat diese Person schon eine PIN? ──
   Gibt ausdruecklich NUR ja/nein und das Datum zurueck. Kein Hash, kein
   Salz, keine Laenge — eine Auskunft, die verraet, wie lang die PIN ist,
   nimmt dem Angreifer schon Arbeit ab. */
exports.pinStatus = region.https.onCall(async (data, context) => {
  const { uid, firma } = await anruferProfil(context);
  const snap = await W(firma).collection('zeitPins').doc(uid).get();
  return { gesetzt: snap.exists, seit: snap.exists ? (snap.data() || {}).gesetztAm || 0 : 0 };
});

/* ── Pruefen ──
   KEIN exports., also kein Endpunkt. Diese Funktion benutzt spaeter das
   Stempeln; von aussen aufrufbar waere sie ein Orakel, an dem man eine
   vierstellige PIN in Minuten durchprobiert.

   Die Bremse dagegen gehoert in den Stempel-Weg und nicht hierher —
   sie steht als Schritt 4 im Plan. */
async function pinPruefen(firma, uid, pin) {
  const snap = await W(firma).collection('zeitPins').doc(String(uid || '')).get();
  if (!snap.exists) return false;
  const d = snap.data() || {};
  if (!d.salz || !d.hash) return false;
  return tokenGleich(pinHashen(String(pin || ''), d.salz), d.hash);
}

/* ══════════════════════════════════════════════════════════════════════
   ZEITERFASSUNG — SCHRITT 3 UND 4: TERMINAL UND STEMPELN

   WIE WEIST SICH DAS TERMINAL AUS? Das war die Entscheidung mit den
   meisten Folgen, und es gab zwei Wege.

   Weg A, verworfen: ein offener Endpunkt (onRequest), den ein nicht
   angemeldetes Tablet mit einem Geraete-Geheimnis aufruft. Das haette
   eine Adresse im Internet ergeben, an der jeder klopfen kann — und
   jeder Klopfversuch waere ein Versuch auf eine vierstellige PIN.

   Weg B, gebaut: das Tablet ist ganz normal angemeldet, mit irgendeinem
   aktiven Konto des Betriebs. Der Chef meldet es einmal an und laesst es
   angemeldet. Darauf lauft die App im Terminal-Modus.

   Damit braucht ein Stempel DREI Dinge gleichzeitig:
     1. ein angemeldetes, freigegebenes Konto DIESES Betriebs,
     2. das Geheimnis GENAU DIESES Terminals,
     3. die PIN der Person, die stempelt.

   Keines davon allein genuegt. Wer das Tablet stiehlt, hat 1 und 2 und
   kann trotzdem fuer niemanden stempeln. Wer eine PIN kennt, hat 3 und
   braucht trotzdem das Geraet im Studio.

   WARUM EIN GEHEIMNIS JE TERMINAL und nicht eines fuer den Betrieb:
   sonst haengt der ganze Betrieb an einem Wert, und ein verlorenes
   Tablet zwingt dazu, alle anderen neu einzurichten. Dieselbe
   Begruendung wie beim Kalender-Abo.

   UND EIN UNTERSCHIED ZUR PIN, der erklaert gehoert: das
   Terminal-Geheimnis sind 32 zufaellige Bytes. Sein Hash laesst sich
   nicht durchprobieren, anders als der einer vierstelligen PIN. Deshalb
   darf die Leitung die Terminal-Liste lesen, waehrend zeitPins fuer alle
   gesperrt ist. Der Unterschied ist nicht Bequemlichkeit, sondern
   Rechnung: zehntausend Moeglichkeiten gegen 2^256.
   ══════════════════════════════════════════════════════════════════════ */
const PIN_MAX_FEHLER = 5;
const PIN_SPERRE_MS = 5 * 60000;

function geheimHashen(wert) {
  return require('crypto').createHash('sha256').update(String(wert)).digest('hex');
}

/* ── Terminal anlegen ──
   Gibt das Geheimnis GENAU EINMAL zurueck. Danach steht nur noch sein
   Hash in der Datenbank — wer es verliert, legt ein neues Terminal an.
   Dasselbe Vorgehen wie bei den Passwoertern aus firmaAnlegen. */
exports.terminalAnlegen = region.https.onCall(async (data, context) => {
  const ich = await requireChef(context);
  const firma = (ich || {}).firma || null;
  const studioKey = String((data && data.studioKey) || '').trim();
  const name = String((data && data.name) || '').trim().slice(0, 40);
  if (!/^studio-\d+$/.test(studioKey)) {
    throw new functions.https.HttpsError('invalid-argument', 'Kein gültiges Studio angegeben.');
  }
  if (!name) {
    throw new functions.https.HttpsError('invalid-argument',
      'Bitte dem Gerät einen Namen geben — „Empfang" oder „Tablet hinten".');
  }
  const geheim = require('crypto').randomBytes(32).toString('hex');
  const ref = W(firma).collection('terminals').doc();
  await ref.set({
    studioKey, name,
    hash: geheimHashen(geheim),
    angelegtAm: Date.now(),
    angelegtVon: (ich || {}).name || '',
    letzterStempel: 0
  });
  await codeSaatSetzen(firma, ref.id);
  return { id: ref.id, geheim: geheim, name: name };
});

/* ── Terminal entfernen ──
   Ein verlorenes Tablet muss sich sperren lassen, und zwar sofort. */
exports.terminalEntfernen = region.https.onCall(async (data, context) => {
  const ich = await requireChef(context);
  const firma = (ich || {}).firma || null;
  const id = String((data && data.id) || '').trim();
  if (!id) throw new functions.https.HttpsError('invalid-argument', 'Keine Kennung angegeben.');
  await W(firma).collection('terminals').doc(id).delete();
  /* Die Saat mit wegraeumen. Bliebe sie stehen, erzeugte ein spaeter
     gleichnamiges Geraet Codes aus der Saat des entfernten — und das
     alte Tablet, das der Chef gerade gesperrt hat, koennte sie weiter
     ausrechnen. */
  await W(firma).collection('terminalCodes').doc(id).delete().catch(() => {});
  return { ok: true };
});

/* ══ DER CODE AM BILDSCHIRM ═══════════════════════════════════════════
   Damit jemand mit dem EIGENEN Handy stempeln kann, ohne dass die App
   je einen Standort anfasst: auf dem Terminal steht eine sechsstellige
   Zahl, die alle 30 Sekunden wechselt. Wer sie abtippt, war im Studio.

   WARUM DIE SAAT NICHT AUS DEM HASH DES GERAETS KOMMT, obwohl das
   bequem waere und keine neue Sammlung braeuchte: `terminals` darf die
   Leitung LESEN (32 zufaellige Bytes, ihr Hash laesst sich nicht
   durchprobieren — das steht so in firestore.rules). Wuerden die Codes
   aus diesem Hash folgen, koennte die Leitung sie zu Hause ausrechnen
   und ihr Team von ueberall stempeln lassen. Genau die Person, die es
   am ehesten wollte.

   Die Saat liegt deshalb in einer eigenen Sammlung, die die Regeln FUER
   ALLE sperren — derselbe Ort und derselbe Grund wie bei zeitPins.
   Lesen muss sie niemand: das Terminal fragt sie nie ab, es bekommt
   fertige Codes.

   WARUM EIN VORRAT UND NICHT EIN AUFRUF JE FENSTER: bei 30 Sekunden
   waeren das 2880 Funktionsaufrufe je Tablet und Tag. Der Vorrat von
   zehn Fenstern deckt fuenf Minuten; nachgeholt wird bei drei uebrigen.
   Wird ein Tablet gestohlen, sind hoechstens diese fuenf Minuten an
   Codes im Geraet — nicht mehr, als das Geraet selbst ohnehin hergibt. */
const CODE_FENSTER_MS = 30000;
const CODE_VORRAT = 10;

function codeFenster(ms) { return Math.floor(ms / CODE_FENSTER_MS); }

function codeAus(saat, fenster) {
  const roh = require('crypto').createHmac('sha256', String(saat))
    .update(String(fenster)).digest();
  /* Die ersten vier Bytes reichen fuer sechs Ziffern. Kein modulo auf
     dem ganzen Digest: die Zahl soll gleichverteilt sein, und 2^31 % 1e6
     verzerrt so wenig, dass es hier nicht ins Gewicht faellt. */
  const zahl = roh.readUInt32BE(0) & 0x7fffffff;
  return String(zahl % 1000000).padStart(6, '0');
}

async function codeSaatSetzen(firma, terminalId) {
  const saat = require('crypto').randomBytes(32).toString('hex');
  await W(firma).collection('terminalCodes').doc(terminalId).set({
    saat, angelegtAm: Date.now()
  });
  return saat;
}

/* Terminals aus der Zeit vor dieser Funktion haben keine Saat. Sie beim
   ersten Abruf anzulegen ist der Unterschied zwischen „laeuft weiter"
   und „der Chef muss jedes Geraet neu einrichten". */
async function codeSaatHolen(firma, terminalId) {
  const snap = await W(firma).collection('terminalCodes').doc(terminalId).get();
  const s = (snap.exists && (snap.data() || {}).saat) || null;
  return s || codeSaatSetzen(firma, terminalId);
}

/* ── Das Terminal holt seinen Codevorrat ──
   Nur gegen das Geraetegeheimnis. Ohne diese Pruefung koennte jeder
   Angemeldete den Vorrat abrufen und danach von zu Hause stempeln — die
   Ortsbindung waere weg, und zwar lautlos. */
exports.stempelCodes = region.https.onCall(async (data, context) => {
  const { firma } = await anruferProfil(context);
  const terminalId = String((data && data.terminalId) || '').trim();
  const geheim = String((data && data.geheim) || '').trim();
  if (!terminalId || !geheim) {
    throw new functions.https.HttpsError('invalid-argument', 'Es fehlt eine Angabe.');
  }
  const tSnap = await W(firma).collection('terminals').doc(terminalId).get();
  if (!tSnap.exists) {
    throw new functions.https.HttpsError('permission-denied',
      'Dieses Gerät ist nicht (mehr) als Terminal eingerichtet.');
  }
  if (!tokenGleich(geheimHashen(geheim), (tSnap.data() || {}).hash)) {
    throw new functions.https.HttpsError('permission-denied', 'Das Gerät weist sich nicht aus.');
  }
  const saat = await codeSaatHolen(firma, terminalId);
  const jetzt = Date.now();
  const erstes = codeFenster(jetzt);
  const codes = [];
  for (let i = 0; i < CODE_VORRAT; i++) codes.push(codeAus(saat, erstes + i));
  return {
    codes,
    /* Die Serverzeit mitgeben. Die Uhr eines Tablets am Empfang geht
       gern falsch, und ein Code, den der Server schon nicht mehr kennt,
       waere ein Fehler, den niemand erklaeren kann. */
    serverZeit: jetzt,
    abFenster: erstes,
    fensterMs: CODE_FENSTER_MS
  };
});

/* ── Mit dem eigenen Handy stempeln ──
   Zwei Schloesser, die zusammenpassen muessen:

     1. Der Chef hat DIESES Konto freigeschaltet (handyStempeln).
     2. Der Code vom Bildschirm im Studio stimmt.

   Eine PIN gibt es hier nicht, und das ist kein Vergessen: am Tablet
   ist sie noetig, weil das Geraet allen gehoert. Das eigene Handy ist
   bereits angemeldet — die PIN wuerde dasselbe zweimal beweisen.

   WAS DAS NICHT VERHINDERT: wer den Code abfotografiert und
   weitergibt, kann innerhalb des Fensters von woanders stempeln. Steht
   so im Plan und gehoert ins Verkaufsgespraech — eine Absicherung, die
   man fuer lueckenlos haelt, ist gefaehrlicher als eine, deren Luecke
   man kennt. */
exports.handyStempeln = region.https.onCall(async (data, context) => {
  const { uid, profil, firma } = await anruferProfil(context);
  if (profil.handyStempeln !== true) {
    throw new functions.https.HttpsError('permission-denied',
      'Für dieses Konto ist das Stempeln mit dem Handy nicht freigeschaltet.');
  }
  const code = String((data && data.code) || '').replace(/\D/g, '');
  if (code.length !== 6) {
    throw new functions.https.HttpsError('invalid-argument',
      'Bitte die sechs Ziffern vom Bildschirm im Studio eingeben.');
  }

  /* Welches Geraet gehoert zu diesem Code? Das beantwortet zugleich die
     Frage, in welchem Studio gestempelt wird — der Code traegt den Ort. */
  const jetzt = Date.now();
  const f = codeFenster(jetzt);
  const terms = await W(firma).collection('terminals').get();
  let treffer = null;
  for (const d of terms.docs) {
    const saat = await codeSaatHolen(firma, d.id);
    /* Das laufende UND das vorige Fenster. Sonst scheitert jeder, der
       beim Tippen in den Wechsel geraet — und das waere die Haelfte
       der Leute, die langsam tippen. */
    if (tokenGleich(code, codeAus(saat, f)) || tokenGleich(code, codeAus(saat, f - 1))) {
      treffer = { id: d.id, daten: d.data() || {} };
      break;
    }
  }
  if (!treffer) {
    throw new functions.https.HttpsError('permission-denied',
      'Dieser Code stimmt nicht mehr. Er wechselt alle 30 Sekunden — bitte den aktuellen vom Bildschirm nehmen.');
  }

  const tag = berlinDatum(new Date());
  const heute = await W(firma).collection('zeiten')
    .where('uid', '==', uid).where('tag', '==', tag).get();
  let letzteArt = null, letzteZeit = -1;
  heute.forEach((d) => {
    const z = d.data() || {};
    if ((z.ts || 0) > letzteZeit) { letzteZeit = z.ts || 0; letzteArt = z.art || null; }
  });
  const art = naechsterSchritt(letzteArt);
  const studioKey = treffer.daten.studioKey || '';

  await W(firma).collection('zeiten').add({
    uid, name: profil.name || '', studioKey,
    art, ts: jetzt, tag, monat: tag.slice(0, 7),
    fremd: !(profil.studioKeys || []).includes(studioKey),
    /* Womit gestempelt wurde, steht im Datensatz. Nicht als Misstrauen,
       sondern damit eine Auswertung spaeter ueberhaupt unterscheiden
       kann — und damit niemand behaupten muss, es sei dasselbe. */
    quelle: 'handy',
    terminalId: treffer.id, terminalName: treffer.daten.name || ''
  });
  await W(firma).collection('terminals').doc(treffer.id).update({ letzterStempel: jetzt });

  return { ok: true, art, ts: jetzt, name: profil.name || '', studioKey };
});

/* ── Was ist als Naechstes dran? ──
   Aus dem letzten Eintrag DES TAGES. Ohne Eintrag: kommen.

   Bewusst kein Blick auf gestern: eine Schicht ueber Mitternacht gibt es
   in einem EMS-Studio nicht (siehe Oeffnungszeiten, wo dieselbe Annahme
   die Eingabe begrenzt). Wer sie doch einmal braucht, bekommt hier einen
   sichtbaren Fehler statt einer stillen Fehlrechnung. */
function naechsterSchritt(letzteArt) {
  if (!letzteArt || letzteArt === 'gehen') return 'kommen';
  if (letzteArt === 'kommen' || letzteArt === 'zurueck') return 'pause';
  if (letzteArt === 'pause') return 'zurueck';
  return 'kommen';
}

/* ── Stempeln ──
   Der einzige Weg, der einen Zeitdatensatz erzeugt. Aus dem Browser gibt
   es keinen: `zeiten` steht in firestore.rules auf write:false.

   Der Grund ist nicht Misstrauen, sondern Beweiswert. Eine Aufzeichnung,
   die sich nachtraeglich beliebig aendern laesst, ist als Nachweis
   nichts wert — auch dann, wenn sie nie geaendert wurde. */
exports.stempeln = region.https.onCall(async (data, context) => {
  const { firma } = await anruferProfil(context);
  const terminalId = String((data && data.terminalId) || '').trim();
  const geheim = String((data && data.geheim) || '').trim();
  const uid = String((data && data.uid) || '').trim();
  const pin = String((data && data.pin) || '').trim();

  if (!terminalId || !geheim || !uid || !pin) {
    throw new functions.https.HttpsError('invalid-argument', 'Es fehlt eine Angabe.');
  }

  /* 1. Das Geraet. */
  const tSnap = await W(firma).collection('terminals').doc(terminalId).get();
  if (!tSnap.exists) {
    throw new functions.https.HttpsError('permission-denied',
      'Dieses Gerät ist nicht (mehr) als Terminal eingerichtet.');
  }
  const term = tSnap.data() || {};
  if (!tokenGleich(geheimHashen(geheim), term.hash)) {
    throw new functions.https.HttpsError('permission-denied', 'Das Gerät weist sich nicht aus.');
  }

  /* 2. Die Person — und zwar aus DIESEM Betrieb.
     NICHT mehr aus diesem Studio: hier stand bis zum 14.9. zusaetzlich
     eine Pruefung auf studioKeys. Sie ist weg, weil sie den haeufigsten
     ehrlichen Fall verbot — wer eine Schicht in einem anderen Studio
     uebernimmt, konnte dort nicht stempeln und stand mit einem Tag ohne
     Zeiten da.

     WAS DAS KOSTET, und das gehoert gesagt: mit Geraeteschluessel UND
     PIN einer Person laesst sich jetzt an jedem Terminal des Betriebs
     fuer sie stempeln. Vorher nur an denen ihres Studios. Beide
     Schluessel braucht es weiter, und die PIN kennt nur sie selbst —
     der Schutz sitzt dort, nicht in der Studio-Zuordnung.

     Wo jemand gestempelt hat, steht im Datensatz (`studioKey` ist das
     Studio des GERAETS). Ein Stempel ausserhalb des eigenen Studios ist
     damit sichtbar und nicht still. */
  const pSnap = await db.collection('users').doc(uid).get();
  if (!pSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Diese Person gibt es nicht.');
  }
  const person = pSnap.data() || {};
  const seine = person.firma || 'koerperformen';
  const meine = firma || 'koerperformen';
  if (seine !== meine || person.aktiv === false) {
    throw new functions.https.HttpsError('permission-denied', 'Dieser Zugang ist hier nicht gültig.');
  }
  const fremd = !(person.studioKeys || []).includes(term.studioKey);

  /* 3. Die PIN — mit Bremse.
     Ohne sie waere das Terminal ein Automat, an dem sich zehntausend
     Moeglichkeiten durchprobieren lassen. Gesperrt wird die PERSON und
     nicht das Geraet: sonst legt ein Scherzkeks mit fuenf Fehlversuchen
     das ganze Studio lahm. */
  const pinRef = W(firma).collection('zeitPins').doc(uid);
  const pinSnap = await pinRef.get();
  if (!pinSnap.exists) {
    throw new functions.https.HttpsError('failed-precondition',
      'Für diese Person ist noch keine PIN gesetzt.');
  }
  const p = pinSnap.data() || {};
  if (p.gesperrtBis && p.gesperrtBis > Date.now()) {
    const min = Math.ceil((p.gesperrtBis - Date.now()) / 60000);
    throw new functions.https.HttpsError('resource-exhausted',
      'Zu viele Fehlversuche. Bitte in ' + min + ' Minute' + (min === 1 ? '' : 'n') + ' erneut.');
  }
  if (!tokenGleich(pinHashen(pin, p.salz), p.hash)) {
    const fehler = (p.fehlversuche || 0) + 1;
    await pinRef.update(fehler >= PIN_MAX_FEHLER
      ? { fehlversuche: 0, gesperrtBis: Date.now() + PIN_SPERRE_MS }
      : { fehlversuche: fehler });
    throw new functions.https.HttpsError('permission-denied',
      fehler >= PIN_MAX_FEHLER
        ? 'Zu viele Fehlversuche. Fünf Minuten gesperrt.'
        : 'Falsche PIN. Noch ' + (PIN_MAX_FEHLER - fehler) + ' Versuche.');
  }
  if (p.fehlversuche || p.gesperrtBis) {
    await pinRef.update({ fehlversuche: 0, gesperrtBis: 0 });
  }

  /* 4. Schreiben.

     OHNE orderBy, und das ist keine Stilfrage. Hier stand
     `.orderBy('ts','desc').limit(1)` hinter zwei Gleichheitsfiltern.
     Firestore verlangt dafuer einen zusammengesetzten Index — und
     dieses Projekt verwaltet keinen einzigen: es gibt keine
     firestore.indexes.json, und firebase.json rollt nur Regeln aus.
     Der Emulator legt fehlende Indizes stillschweigend an, die
     Produktion nicht; der ALLERERSTE Stempel waere dort mit
     FAILED_PRECONDITION gescheitert.

     Ein Tag hat eine Handvoll Eintraege. Das Maximum ist in JS
     schneller gefunden, als ein Index angelegt waere — denselben Weg
     geht der Browser seit jeher (siehe papierkorbLaden in
     index.html). */
  const tag = berlinDatum(new Date());
  const heute = await W(firma).collection('zeiten')
    .where('uid', '==', uid).where('tag', '==', tag).get();
  let letzteArt = null, letzteZeit = -1;
  heute.forEach((d) => {
    const z = d.data() || {};
    if ((z.ts || 0) > letzteZeit) { letzteZeit = z.ts || 0; letzteArt = z.art || null; }
  });
  const art = naechsterSchritt(letzteArt);

  const jetzt = Date.now();
  await W(firma).collection('zeiten').add({
    uid, name: person.name || '', studioKey: term.studioKey,
    art, ts: jetzt, tag,
    /* `monat` ist Absicht und keine Bequemlichkeit: „Meine Zeiten"
       liest monatsweise ueber ZWEI GLEICHHEITSFILTER (uid, monat).
       Ein Bereich auf `tag` neben der Gleichheit auf `uid` braeuchte
       wieder einen zusammengesetzten Index — siehe oben. */
    monat: tag.slice(0, 7),
    /* Ausserhalb des eigenen Studios gestempelt. Nicht verboten (der
       Fall ist der Alltag beim Aushelfen), aber sichtbar. */
    fremd,
    quelle: 'terminal',
    terminalId, terminalName: term.name || ''
  });
  await tSnap.ref.update({ letzterStempel: jetzt });

  return { ok: true, art, ts: jetzt, name: person.name || '', fremd };
});

/* ══════════════════════════════════════════════════════════════════════
   STEMPEL KORRIGIEREN — MIT PROTOKOLL (P-09)

   Aus dem Betrieb, 24.9.2026:
     „füge hinzu das die leitung die zeiten ändern kann falls jemand sich
      nicht ausgestempelt hat oder so"

   `zeiten` bleibt fuer den Browser auf write:false, fuer JEDEN. Der Weg
   fuer eine Korrektur fuehrt hier durch, und er AENDERT NICHTS, was
   schon da ist:

     · zeitNachtragen legt einen NEUEN Stempel an (quelle 'korrektur'),
       mit Grund, wer ihn eingetragen hat und wann. Der typische Fall:
       der vergessene Feierabend.
     · zeitStornieren markiert einen vorhandenen Stempel als ungueltig
       (Feld `storno` mit wer/wann/Grund). Er bleibt stehen, mit allen
       seinen Feldern — die Auswertung rechnet nur nicht mehr mit ihm.

   Warum nicht einfach ueberschreiben: eine Arbeitszeitaufzeichnung, die
   der Arbeitgeber nachtraeglich unbemerkt aendern kann, ist als Nachweis
   nichts wert — auch dann, wenn nie jemand etwas geaendert hat. So
   bleibt jede Aenderung sichtbar: in „Meine Zeiten" sieht die Person
   selbst, was nachgetragen wurde, von wem und warum.

   Wer darf: der Chef ueberall im Betrieb, die Studioleitung in ihren
   Studios. Die EIGENEN Zeiten korrigiert eine Studioleitung nicht
   selbst, das macht die Geschaeftsfuehrung — sonst waere es genau die
   Aenderung ohne zweite Person, die der Beweiswert nicht vertraegt. */
const ZEIT_ARTEN = ['kommen', 'pause', 'zurueck', 'gehen'];
const KORREKTUR_TAGE_MAX = 62;

/* Ein Tag und eine Uhrzeit in Berliner Ortszeit als Zeitpunkt. Zweimal
   gerechnet, weil der Abstand zu UTC selbst vom Zeitpunkt abhaengt
   (Sommerzeit). */
function berlinZeitpunkt(tag, uhr) {
  const t = String(tag).split('-').map(Number);
  const u = String(uhr).split(':').map(Number);
  const wand = Date.UTC(t[0], t[1] - 1, t[2], u[0], u[1]);
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  function alsWand(ms) {
    const g = {};
    fmt.formatToParts(new Date(ms)).forEach((x) => { g[x.type] = x.value; });
    return Date.UTC(+g.year, +g.month - 1, +g.day, +g.hour, +g.minute);
  }
  let ts = wand - (alsWand(wand) - wand);
  ts = wand - (alsWand(ts) - ts);
  return ts;
}

function leitungFuerStudio(profil, studioKey) {
  const darf = profil.role === 'chef' ||
    (profil.role === 'leiter' && (profil.studioKeys || []).includes(studioKey));
  if (!darf) {
    throw new functions.https.HttpsError('permission-denied',
      'Korrigieren darf nur die Leitung dieses Studios.');
  }
}

function korrekturGrund(data) {
  const grund = String((data && data.grund) || '').trim().slice(0, 200);
  if (grund.length < 5) {
    throw new functions.https.HttpsError('invalid-argument',
      'Bitte kurz den Grund angeben, z. B. „Ausstempeln vergessen, laut Schichtplan bis 18 Uhr".');
  }
  return grund;
}

exports.zeitNachtragen = region.https.onCall(async (data, context) => {
  const { uid, profil, firma } = await anruferProfil(context);
  const personUid = String((data && data.uid) || '').trim();
  const tag = String((data && data.tag) || '').trim();
  const uhr = String((data && data.uhr) || '').trim();
  const art = String((data && data.art) || '').trim();
  const studioKey = String((data && data.studioKey) || '').trim();
  if (!personUid || !/^\d{4}-\d{2}-\d{2}$/.test(tag) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(uhr)) {
    throw new functions.https.HttpsError('invalid-argument', 'Tag oder Uhrzeit fehlt oder stimmt nicht.');
  }
  if (ZEIT_ARTEN.indexOf(art) < 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Unbekannte Art des Stempels.');
  }
  if (!/^studio-\d+$/.test(studioKey)) {
    throw new functions.https.HttpsError('invalid-argument', 'Kein gültiges Studio angegeben.');
  }
  const grund = korrekturGrund(data);
  leitungFuerStudio(profil, studioKey);

  const pSnap = await db.collection('users').doc(personUid).get();
  const person = pSnap.exists ? (pSnap.data() || {}) : null;
  if (!person || (person.firma || 'koerperformen') !== (firma || 'koerperformen')) {
    throw new functions.https.HttpsError('not-found', 'Diese Person gibt es in diesem Betrieb nicht.');
  }
  if (personUid === uid && profil.role !== 'chef') {
    throw new functions.https.HttpsError('permission-denied',
      'Die eigenen Zeiten korrigiert die Geschäftsführung.');
  }

  const ts = berlinZeitpunkt(tag, uhr);
  const jetzt = Date.now();
  if (ts > jetzt) {
    throw new functions.https.HttpsError('invalid-argument',
      'Ein Stempel in der Zukunft lässt sich nicht nachtragen.');
  }
  if (jetzt - ts > KORREKTUR_TAGE_MAX * 86400000) {
    throw new functions.https.HttpsError('invalid-argument',
      'Nachtragen geht bis ' + KORREKTUR_TAGE_MAX + ' Tage zurück.');
  }

  const ref = await W(firma).collection('zeiten').add({
    uid: personUid, name: person.name || '', studioKey,
    art, ts, tag, monat: tag.slice(0, 7),
    fremd: !(person.studioKeys || []).includes(studioKey),
    quelle: 'korrektur',
    grund, korrigiertVon: uid, korrigiertVonName: profil.name || '', korrigiertAm: jetzt
  });
  return { ok: true, id: ref.id, ts };
});

exports.zeitStornieren = region.https.onCall(async (data, context) => {
  const zid = String((data && data.id) || '').trim();
  if (!zid) throw new functions.https.HttpsError('invalid-argument', 'Kein Stempel angegeben.');
  const grund = korrekturGrund(data);
  const { uid, profil, firma } = await anruferProfil(context);
  const ref = W(firma).collection('zeiten').doc(zid);
  const snap = await ref.get();
  if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Diesen Stempel gibt es nicht.');
  const z = snap.data() || {};
  leitungFuerStudio(profil, z.studioKey || '');
  if (z.uid === uid && profil.role !== 'chef') {
    throw new functions.https.HttpsError('permission-denied',
      'Die eigenen Zeiten korrigiert die Geschäftsführung.');
  }
  if (z.storno) {
    throw new functions.https.HttpsError('failed-precondition',
      'Dieser Stempel ist schon als ungültig markiert.');
  }
  /* Nur dieses eine Feld kommt dazu. Zeitpunkt, Art, Gerät und Person
     bleiben, wie sie gestempelt wurden. */
  await ref.update({ storno: { von: uid, vonName: profil.name || '', am: Date.now(), grund } });
  return { ok: true };
});

/* ══════════════════════════════════════════════════════════════════════
   DATENSCHUTZVORFALL MELDEN (P-02, Runde 113)

   Aus dem Betrieb, 25.9.2026:
     „es soll einen knopf geben der mir nach ausfüllung sofort eine mail
      schickt mit einer bestimmten betonung von wichtigkeit"

   Jeder mit freigegebenem Zugang darf melden — eine Datenpanne bemerkt
   oft nicht die Geschäftsführung, sondern wer am Empfang sitzt.

   ── WAS PASSIERT ────────────────────────────────────────────────────
   1. Die Meldung wird ZUERST gespeichert (Sammlung `vorfaelle`, lesbar
      nur für den Betreiber). Scheitert danach die Mail, ist sie nicht
      verloren — und die Antwort sagt ehrlich, dass keine Mail ging.
   2. Dann die Mail an VORFALL_AN (Standard: die Adresse aus
      docs/av/VORFALL.md), mit `priority: 'high'`. Nodemailer setzt
      daraus X-Priority: 1, X-MSMail-Priority: High und Importance: High
      — die drei Kopfzeilen, an denen Outlook, Apple Mail und Gmail die
      Wichtigkeit erkennen. Dazu steht es im Betreff, denn nicht jedes
      Programm zeigt die Kopfzeilen an.
   3. In der Mail steht die eigene Frist aus dem AV-Vertrag (48 Stunden,
      § 8 Abs. 4) als Uhrzeit, nicht als Rechenaufgabe.

   ── GRENZE ──────────────────────────────────────────────────────────
   Höchstens fünf Meldungen je Person und 24 Stunden. Ein Knopf, der
   sofort eine Mail mit höchster Wichtigkeit auslöst, darf keine
   Mailschleuder sein.
   ══════════════════════════════════════════════════════════════════ */
const VORFALL_AN_STANDARD = 'S.gedik@kformen.com';
const VORFALL_FRIST_STUNDEN = 48;
const VORFALL_TAGESGRENZE = 5;
const VORFALL_LAEUFT = { ja: 'Ja, es läuft noch', nein: 'Nein, ist vorbei', unklar: 'Weiss ich nicht' };

function vorfallText(v, firmaName, fristBis) {
  return [
    'DATENSCHUTZVORFALL GEMELDET — BITTE SOFORT ANSEHEN',
    '',
    'Eigene Frist laut AV-Vertrag (§ 8 Abs. 4): Kunden benachrichtigen bis spätestens',
    '  ' + fristBis + ' (48 Stunden ab jetzt).',
    'Ablauf: docs/av/VORFALL.md, Schritt 1–6.',
    '',
    'Firma:        ' + firmaName + ' (' + (v.firma || '–') + ')',
    'Gemeldet von: ' + (v.name || '–') + ' · ' + (v.rolle || '–') + ' · ' + (v.email || 'keine Adresse'),
    'Rückruf:      ' + (v.rueckruf || '–'),
    'Bemerkt:      ' + (v.wann || '–'),
    'Läuft noch:   ' + (VORFALL_LAEUFT[v.laeuft] || v.laeuft),
    '',
    'WAS IST PASSIERT',
    v.was,
    '',
    'WER ODER WAS IST BETROFFEN',
    v.betroffen || '(nicht angegeben)',
    '',
    'Kennung der Meldung: ' + v.id
  ].join('\n');
}

exports.vorfallMelden = region.https.onCall(async (data, context) => {
  const { uid, profil, firma } = await anruferProfil(context);
  const text = (k, max) => String((data && data[k]) || '').trim().slice(0, max);
  const was = text('was', 4000);
  if (was.length < 10) {
    throw new functions.https.HttpsError('invalid-argument',
      'Bitte beschreib in einem Satz, was passiert ist.');
  }
  const laeuft = Object.prototype.hasOwnProperty.call(VORFALL_LAEUFT, data && data.laeuft) ? data.laeuft : 'unklar';

  const seit = Date.now() - 86400000;
  const bisher = await db.collection('vorfaelle').where('uid', '==', uid).get();
  if (bisher.docs.filter((d) => (d.get('ts') || 0) > seit).length >= VORFALL_TAGESGRENZE) {
    throw new functions.https.HttpsError('resource-exhausted',
      'Du hast heute schon ' + VORFALL_TAGESGRENZE + ' Meldungen geschickt. ' +
      'Ist es dringend, schreib direkt an ' + (process.env.VORFALL_AN || VORFALL_AN_STANDARD) + '.');
  }

  const ts = Date.now();
  const eintrag = {
    uid, name: profil.name || '', email: profil.email || '', rolle: profil.role || '',
    firma: firma || null, was, laeuft,
    wann: text('wann', 60), betroffen: text('betroffen', 2000), rueckruf: text('rueckruf', 200),
    ts, mail: 'offen'
  };
  const ref = await db.collection('vorfaelle').add(eintrag);

  let firmaName = firma || '–';
  if (firma) {
    const f = await db.collection('firmen').doc(firma).get();
    if (f.exists && f.get('name')) firmaName = f.get('name');
  }
  const fristBis = new Date(ts + VORFALL_FRIST_STUNDEN * 3600000).toLocaleString('de-DE',
    { timeZone: 'Europe/Berlin', weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const mailer = getMailer();
  let mail = false;
  if (mailer) {
    try {
      await mailer.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: process.env.VORFALL_AN || VORFALL_AN_STANDARD,
        replyTo: eintrag.email || undefined,
        priority: 'high',
        subject: '‼ DRINGEND: Datenschutzvorfall gemeldet – ' + firmaName + ' – Frist bis ' + fristBis,
        text: vorfallText(Object.assign({ id: ref.id }, eintrag), firmaName, fristBis)
      });
      mail = true;
    } catch (e) {
      console.error('Vorfall-Mail gescheitert:', ref.id, e && e.message);
    }
  }
  await ref.update({ mail: mail ? 'gesendet' : (mailer ? 'fehlgeschlagen' : 'nicht eingerichtet') });
  return { ok: true, id: ref.id, mail, fristBis };
});

/* ══════════════════════════════════════════════════════════════════════
   AUSKUNFT NACH ART. 15 DSGVO (P-10, Runde 114)

   Aus dem Betrieb, 25.9.2026, auf die Empfehlung „alles, was die Person
   selbst geschrieben hat oder was über sie gespeichert ist, und ein
   Knopf für den Chef, der daraus eine Datei macht": „Ja genau so".

   ── WER DARF ────────────────────────────────────────────────────────
   · die Person selbst (Ich → Daten)          → VOLLE Auskunft
   · die Geschäftsführung ihrer Firma         → Auskunft OHNE zwei Teile:
       - die Inhalte ihrer Direktnachrichten (nur die Zahl),
       - ihren persönlichen Bereich (privat/<uid>: eigene Termine,
         Notizen, Ziele …).
     Beides sieht der Chef in der App auch sonst nicht. Eine Auskunft,
     die ihm mehr zeigt als die App, wäre selbst eine Datenpanne. Der
     Hinweis dazu steht IN der Datei: die volle Fassung holt die Person
     selbst ab.

   ── WAS HINEINKOMMT ─────────────────────────────────────────────────
   Jedes Dokument der Firma, in dem die Person in einem der Felder aus
   AUSKUNFT_FELDER steht (uid, createdByUid, doneByUid …). Bewusst als
   Durchsuchen aller Sammlungen statt einer Liste einzelner Abfragen:
   eine neue Sammlung, die jemand vergisst einzutragen, wäre sonst still
   nicht dabei — und eine Auskunft, der etwas fehlt, ist falsch, nicht
   nur unvollständig.

   ── WAS NIE HINEINKOMMT ─────────────────────────────────────────────
   Felder mit hash, geheim, secret, pin, token im Namen (dieselbe Regel
   wie beim nächtlichen Export, tests/test-sicherung-inhalt.js), dazu
   zeitPins, terminalCodes und pushTokens ganz.
   ══════════════════════════════════════════════════════════════════ */
const AUSKUNFT_FELDER = ['uid', 'createdByUid', 'doneByUid', 'uploadedByUid', 'erfasstVonUid',
  'byUid', 'decidedByUid', 'deletedByUid', 'assignedTo', 'tauschVon', 'personUid',
  'korrigiertVon', 'createdBy', 'lastSender', 'vonUid', 'anUid'];
const AUSKUNFT_NIE = ['zeitPins', 'terminalCodes', 'pushTokens', 'vorfaelle', 'trash', 'versions', 'fehler', 'statistik'];
const AUSKUNFT_FELD_WEG = /hash|geheim|secret|pin|token/i;

function auskunftSauber(wert) {
  if (Array.isArray(wert)) return wert.map(auskunftSauber);
  if (wert && typeof wert === 'object') {
    if (typeof wert.toDate === 'function') return wert.toDate().toISOString();
    const aus = {};
    Object.keys(wert).forEach((k) => {
      if (AUSKUNFT_FELD_WEG.test(k)) return;
      aus[k] = auskunftSauber(wert[k]);
    });
    return aus;
  }
  /* Eingebettete Dateien (data:…) sind oft hunderte Kilobyte. In die
     Auskunft kommt, DASS es sie gibt, nicht der Inhalt. */
  if (typeof wert === 'string' && /^data:[^;]+;base64,/.test(wert) && wert.length > 2000) {
    return '[eingebettete Datei, ' + Math.round(wert.length * 0.75 / 1024) + ' KB]';
  }
  return wert;
}
function betrifft(d, uid) {
  if (!d) return false;
  if (AUSKUNFT_FELDER.some((f) => d[f] === uid)) return true;
  return ['participants', 'teilnehmer', 'mentions'].some((f) => Array.isArray(d[f]) && d[f].indexOf(uid) >= 0);
}

/* Geht alle Sammlungen der Firma durch und sammelt, was die Person
   betrifft. Eine Ebene tiefer nur dort, wo es Untersammlungen gibt
   (studios/<sk>/…, channels/<k>/messages) — eine Nachricht hat keine
   Kinder, und jede einzeln danach zu fragen, kostete bei tausend
   Nachrichten tausend Aufrufe. */
const AUSKUNFT_MIT_KINDERN = ['studios', 'channels'];
async function auskunftSammeln(wurzel, uid, voll, bereiche, flach) {
  const dazu = (name, d) => { (bereiche[name] = bereiche[name] || []).push(auskunftSauber(d)); };
  for (const s of await wurzel.listCollections()) {
    if (AUSKUNFT_NIE.indexOf(s.id) >= 0 || s.id === 'privat') continue;
    if (flach && ['users', 'firmen', 'firmenArchiv', 'beitritt'].indexOf(s.id) >= 0) continue;
    if (s.id === 'dms') {
      const q = await s.where('participants', 'array-contains', uid).get();
      for (const dm of q.docs) {
        const msgs = await dm.ref.collection('messages').get();
        const d = dm.data() || {};
        dazu('dms', voll
          ? { unterhaltung: dm.id, mit: d.names || {}, nachrichten: msgs.docs.map((m) => Object.assign({ id: m.id }, m.data())) }
          : { unterhaltung: dm.id, eigeneNachrichten: msgs.docs.filter((m) => m.get('uid') === uid).length,
              alleNachrichten: msgs.size, hinweis: 'Inhalte nur in der Auskunft, die die Person selbst abruft.' });
      }
      continue;
    }
    const q = await s.get();
    q.docs.forEach((x) => { if (betrifft(x.data(), uid)) dazu(s.id, Object.assign({ id: x.id }, x.data())); });
    if (AUSKUNFT_MIT_KINDERN.indexOf(s.id) < 0) continue;
    for (const eltern of await s.listDocuments()) {
      for (const kind of await eltern.listCollections()) {
        const k = await kind.get();
        k.docs.forEach((x) => {
          if (betrifft(x.data(), uid)) dazu(s.id + '/' + kind.id, Object.assign({ id: x.id, [s.id === 'studios' ? 'studio' : 'kanal']: eltern.id }, x.data()));
        });
      }
    }
  }
}

exports.auskunftErstellen = region.https.onCall(async (data, context) => {
  const { uid, profil, firma } = await anruferProfil(context);
  const personUid = String((data && data.uid) || uid).trim();
  const selbst = personUid === uid;
  if (!selbst && profil.role !== 'chef') {
    throw new functions.https.HttpsError('permission-denied',
      'Die Auskunft für eine andere Person erstellt nur die Geschäftsführung.');
  }
  const pSnap = await db.collection('users').doc(personUid).get();
  const person = pSnap.exists ? (pSnap.data() || {}) : null;
  if (!person || (person.firma || null) !== (firma || null)) {
    throw new functions.https.HttpsError('not-found', 'Diese Person gibt es in diesem Betrieb nicht.');
  }

  const wurzel = W(firma);
  const bereiche = {};
  await auskunftSammeln(wurzel, personUid, selbst, bereiche, !firma);
  if (selbst) {
    const privat = wurzel.collection('privat').doc(personUid);
    const pd = await privat.get();
    if (pd.exists) bereiche['privat'] = [auskunftSauber(pd.data())];
    for (const s of await privat.listCollections()) {
      const q = await s.get();
      bereiche['privat/' + s.id] = q.docs.map((x) => auskunftSauber(Object.assign({ id: x.id }, x.data())));
    }
  }
  const zahl = Object.keys(bereiche).reduce((n, k) => n + bereiche[k].length, 0);
  return {
    erstellt: new Date().toISOString(),
    erstelltVon: selbst ? 'die Person selbst' : 'Geschäftsführung (' + (profil.name || uid) + ')',
    fassung: selbst ? 'voll' : 'ohne Direktnachrichten-Inhalte und persönlichen Bereich',
    firma: firma || null,
    person: auskunftSauber(Object.assign({ uid: personUid }, person)),
    eintraege: zahl,
    bereiche
  };
});

/* ══════════════════════════════════════════════════════════════════════
   SCHULUNG — DER TEILNAHME-CODE

   Aus dem Betrieb, 22.9.2026:
     „Der Code soll am Anfang eines Webinars eingegeben werden vom
      Mitarbeiter, der erstellte Code soll vorher von der Leitung einem
      Namen zugewiesen werden, dann braucht der Mitarbeiter keinen
      eigenen Account, aber man kann tracken wer es war."

   ── WARUM DAS EIN EIGENER WEG IST UND NICHT EINFACH DAS KONTO ──────
   Eine Schulung laeuft auf dem Tablet im Studio, und dort ist ein
   Studio-Konto angemeldet — nicht die Person, die davor sitzt. Genau
   deshalb der Code: er sagt, WER es wirklich war, ohne dass jemand ein
   eigenes Konto braucht. Neue Leute koennen die Einarbeitung machen,
   bevor sie ueberhaupt einen Zugang haben.

   Mitgeschrieben wird trotzdem, WORAUF es lief: Geraetekonto, Studio
   und Uhrzeit. Das ist der zweite Teil derselben Frage aus dem Betrieb
   („dann muss man aber die Uhrzeit tracken und den Ort bzw. der Studio
   Account welcher genutzt wurde").

   ── DER CODE BLEIBT LESBAR — FUER DIE LEITUNG ──────────────────────
   Bis zum 22.9.2026 lag er gehasht und war nach dem Anlegen fuer
   niemanden mehr zu sehen, auch fuer die Leitung nicht. Aus dem
   Betrieb kam dazu:

     „ich wuerde mir wuenschen … das die codes nicht weg sind und sie
      keiner sehen kann sondern sie bei der verwaltung gespeichert
      werden, sodass man ihn immer wieder neu erstellen und ansehen und
      weiterleiten kann."

   Der Einwand trifft die Praxis: ein Code, den man nur einmal sieht,
   ist ein Zettel, der verlorengeht — und dann steht die Leitung da und
   muss fuer jeden Handgriff einen neuen erzeugen.

   WAS DAS KOSTET, und das ist keine Kleinigkeit: wer den Code lesen
   kann, KANN die Schulung im Namen dieser Person machen. Die Aussage
   des Nachweises verschiebt sich damit von „es war sicher sie" zu
   „es war sie, und die Leitung steht dafuer gerade". Fuer eine interne
   Unterweisung ist das die richtige Hoehe — wer die Auswertung
   besitzt, hat keinen Grund, sich selbst zu betruegen.

   WAS ES NICHT KOSTET: ein KOLLEGE kommt weiterhin nicht heran.
   `schulungTeilnehmer` darf nur die Leitung lesen — und die Person
   selbst ihren eigenen Datensatz. Und in die naechtliche Sicherung
   geht der Code nicht; sie traegt nur die Durchlaeufe.

   ── WARUM DER CODE EINEN OFFENEN VORDERTEIL HAT ────────────────────
   `M4K7-RPQ2-XT9B`. Die ersten vier Zeichen sind die Kennung des
   Teilnehmers und stehen im Klartext in der Datenbank; die acht
   dahinter sind das Geheimnis.

   Das ist kein Nachlassen, sondern Rechnen: scrypt braucht rund 50 ms.
   Ohne Vorderteil muesste die Funktion bei 39 Teilnehmern 39-mal
   hashen — zwei Sekunden, bei jedem Start. Mit Vorderteil ist es ein
   Zugriff und ein Hash. Die acht geheimen Zeichen aus einem Alphabet
   von 32 sind rund 10^12 Moeglichkeiten; die Bremse unten macht den
   Rest.
   ══════════════════════════════════════════════════════════════════ */

/* Ohne I, O, 0 und 1: diese vier werden auf einem Zettel und am Telefon
   zuverlaessig verwechselt, und ein Code, den man falsch abliest, ist
   ein Anruf bei der Leitung. */
const SCHULUNG_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SCHULUNG_KENNUNG_LAENGE = 4;
const SCHULUNG_GEHEIM_LAENGE = 8;
/* Die Bremse. Zehn Fehlversuche je Geraet und Stunde: wer den Code
   abgetippt und sich vertan hat, merkt nichts davon; wer probiert,
   kommt in einer Stunde auf zehn von 10^12. */
const SCHULUNG_VERSUCHE_MAX = 10;
const SCHULUNG_VERSUCHE_FENSTER_MS = 60 * 60 * 1000;

function schulungZeichen(n) {
  const b = require('crypto').randomBytes(n);
  let raus = '';
  for (let i = 0; i < n; i++) raus += SCHULUNG_ALPHABET[b[i] % SCHULUNG_ALPHABET.length];
  return raus;
}
/* Kleinbuchstaben, Leerzeichen und Bindestriche verzeihen: abgetippt
   wird das von einem Zettel, oft mit nassen Haenden. */
function schulungCodeNormal(roh) {
  return String(roh || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/* Chef ODER Studioleitung. Die Schulung ist Betriebsorganisation, nicht
   Geld und nicht Betriebswissen — dafuer waere `requireChef` zu eng:
   eingearbeitet wird im Studio, nicht in der Zentrale. */
async function requireLeitung(context) {
  requireAuth(context);
  const snap = await db.collection('users').doc(context.auth.uid).get();
  const p = snap.exists ? (snap.data() || {}) : {};
  if (p.aktiv === false) {
    throw new functions.https.HttpsError('permission-denied',
      'Dieser Zugang ist noch nicht freigegeben.');
  }
  if (p.role !== 'chef' && p.role !== 'leiter') {
    throw new functions.https.HttpsError('permission-denied',
      'Das darf nur die Leitung.');
  }
  return { uid: context.auth.uid, profil: p, firma: p.firma || null };
}

/* Einen Code erzeugen und ablegen. Gibt ihn EINMAL zurueck. */
async function schulungCodeSetzen(firma, teilnehmerId) {
  const F = W(firma);
  /* Die Kennung muss in der Firma einmalig sein, sonst zeigt sie auf
     den falschen Teilnehmer. Fuenf Anlaeufe: bei 32^4 = gut einer
     Million Moeglichkeiten und ein paar Dutzend Teilnehmern ist schon
     der erste praktisch immer frei. */
  /* Gefragt wird je Anlauf nach GENAU DIESER Kennung, nicht nach der
     ganzen Teilnehmerliste. Die Liste einmal zu holen waere der
     bequemere Weg und derselbe Fehler, der an anderer Stelle schon
     stand: ein Lesevorgang, der mit dem Betrieb waechst, fuer eine
     Frage, die mit einem einzigen zu beantworten ist. */
  let kennung = '';
  for (let i = 0; i < 5 && !kennung; i++) {
    const k = schulungZeichen(SCHULUNG_KENNUNG_LAENGE);
    const da = await F.collection('schulungTeilnehmer')
      .where('kennung', '==', k).limit(1).get();
    if (da.empty) kennung = k;
  }
  if (!kennung) {
    throw new functions.https.HttpsError('internal',
      'Es liess sich keine freie Kennung finden. Bitte noch einmal versuchen.');
  }
  const geheim = schulungZeichen(SCHULUNG_GEHEIM_LAENGE);
  return {
    kennung: kennung,
    /* Mit Bindestrichen: so steht er auf dem Zettel und so tippt man
       ihn ab. Beim Pruefen werden sie wieder weggeworfen. */
    code: kennung + '-' + geheim.slice(0, 4) + '-' + geheim.slice(4)
  };
}

/* ── Einen Teilnehmer anlegen ──
   Der Name ist der Zweck der ganzen Uebung: der Code haengt an ihm.
   `uid` ist freiwillig — wer ein Konto hat, sieht seine eigenen Zahlen
   damit spaeter im Ich-Bereich wieder. Wer keines hat, wird trotzdem
   sauber gefuehrt. */
exports.schulungTeilnehmerAnlegen = region.https.onCall(async (data, context) => {
  const { uid, profil, firma } = await requireLeitung(context);
  const name = String((data && data.name) || '').trim();
  if (name.length < 2 || name.length > 80) {
    throw new functions.https.HttpsError('invalid-argument',
      'Bitte Vor- und Nachnamen eintragen.');
  }
  const F = W(firma);
  const ref = F.collection('schulungTeilnehmer').doc();
  const gesetzt = await schulungCodeSetzen(firma, ref.id);
  await ref.set({
    name: name,
    /* Nur eine Kennung aus der eigenen Firma, und nur eine, die es
       gibt. Sonst haengte der Code an einer erfundenen Person. */
    uid: String((data && data.uid) || '') || null,
    studioKey: String((data && data.studioKey) || '') || null,
    kennung: gesetzt.kennung,
    /* Der Code im Klartext — die Entscheidung vom 22.9.2026, oben
       begruendet. Lesen darf ihn die Leitung und die Person selbst;
       ein Kollege nicht, und die Sicherung traegt ihn nicht. */
    code: gesetzt.code,
    gesperrt: false,
    angelegtVonUid: uid, angelegtVon: profil.name || '',
    ts: Date.now(), codeAm: Date.now()
  });
  return { ok: true, id: ref.id, name: name, code: gesetzt.code };
});

/* ── Einen neuen Code fuer denselben Teilnehmer ──
   Zettel verlegt, Code weitergegeben, jemand geht: dann ist der alte
   sofort wertlos. Der alte Eintrag wird geloescht, nicht ueberschrieben
   — sonst bliebe die alte Kennung als Leiche stehen und zeigte weiter
   auf diesen Teilnehmer. */
exports.schulungCodeNeu = region.https.onCall(async (data, context) => {
  const { firma } = await requireLeitung(context);
  const id = String((data && data.id) || '');
  if (!id) throw new functions.https.HttpsError('invalid-argument', 'Kein Teilnehmer angegeben.');
  const F = W(firma);
  const tSnap = await F.collection('schulungTeilnehmer').doc(id).get();
  if (!tSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Diesen Teilnehmer gibt es nicht.');
  }
  const alt = (tSnap.data() || {}).kennung;
  const gesetzt = await schulungCodeSetzen(firma, id);
  /* Den alten Hash-Eintrag wegraeumen, falls es noch einen gibt. Seit
     dem 22.9.2026 legt diese Funktion keinen mehr an; Codes, die
     vorher ausgegeben wurden, haben aber noch einen. */
  if (alt) await F.collection('schulungCodes').doc(alt).delete().catch(() => {});
  await tSnap.ref.update({
    kennung: gesetzt.kennung, code: gesetzt.code, codeAm: Date.now()
  });
  return { ok: true, code: gesetzt.code };
});

/* Die Bremse. Ein Zaehler je GERAET, nicht je Code: wer probiert, sitzt
   an einem Tablet und wechselt die Codes durch — der Code ist also die
   falsche Achse. */
async function schulungVersuchPruefen(firma, uid) {
  const ref = W(firma).collection('schulungVersuche').doc(uid);
  const snap = await ref.get();
  const d = snap.exists ? (snap.data() || {}) : {};
  const jetzt = Date.now();
  if ((jetzt - (d.seit || 0)) > SCHULUNG_VERSUCHE_FENSTER_MS) return { ref, zahl: 0, seit: jetzt };
  if ((d.zahl || 0) >= SCHULUNG_VERSUCHE_MAX) {
    throw new functions.https.HttpsError('resource-exhausted',
      'Zu viele Fehlversuche auf diesem Gerät. Bitte in einer Stunde noch einmal, ' +
      'oder die Leitung erzeugt einen neuen Code.');
  }
  return { ref, zahl: d.zahl || 0, seit: d.seit || jetzt };
}

/* ── Anfangen ──
   Der einzige Weg, auf dem ein Durchlauf entsteht. In firestore.rules
   ist `create` auf `schulungLaeufe` fuer JEDEN gesperrt — auch fuer die
   Leitung. Sonst koennte man sich mit der Browser-Konsole einen
   fertigen, bestandenen Durchlauf auf einen fremden Namen schreiben,
   und die ganze Liste waere eine Behauptung. */
exports.schulungStart = region.https.onCall(async (data, context) => {
  const { uid, profil, firma } = await anruferProfil(context);
  const roh = schulungCodeNormal(data && data.code);
  const modulId = String((data && data.modul) || '');
  if (!modulId) throw new functions.https.HttpsError('invalid-argument', 'Kein Modul angegeben.');
  if (roh.length !== SCHULUNG_KENNUNG_LAENGE + SCHULUNG_GEHEIM_LAENGE) {
    throw new functions.https.HttpsError('invalid-argument',
      'Der Code besteht aus ' + (SCHULUNG_KENNUNG_LAENGE + SCHULUNG_GEHEIM_LAENGE) +
      ' Zeichen. Bitte noch einmal ansehen.');
  }
  const F = W(firma);
  const bremse = await schulungVersuchPruefen(firma, uid);

  const kennung = roh.slice(0, SCHULUNG_KENNUNG_LAENGE);
  const geheim = roh.slice(SCHULUNG_KENNUNG_LAENGE);

  /* Gesucht wird ueber die KENNUNG — die vier offenen Zeichen vorn.
     Eine Abfrage, kein Durchgehen der ganzen Liste. */
  const tref = await F.collection('schulungTeilnehmer')
    .where('kennung', '==', kennung).limit(1).get();
  const tDoc = tref.empty ? null : tref.docs[0];
  const tDaten = tDoc ? (tDoc.data() || {}) : null;

  let stimmt = false;
  if (tDaten && tDaten.code) {
    /* Der Normalfall seit dem 22.9.2026: Klartext-Vergleich, zeitgleich.
       Dass der Code im Klartext liegt, ist eine bewusste Entscheidung —
       die Begruendung steht oben im Kopf dieses Abschnitts. */
    stimmt = tokenGleich(schulungCodeNormal(tDaten.code), roh);
  } else {
    /* RUECKFALL fuer Codes, die vor dem 22.9.2026 ausgegeben wurden:
       damals lag nur der Hash. Diese Zeilen duerfen weg, sobald kein
       Teilnehmer mehr ohne `code` dasteht. */
    const cSnap = await F.collection('schulungCodes').doc(kennung).get();
    const c = cSnap.exists ? (cSnap.data() || {}) : null;
    stimmt = !!c && tokenGleich(pinHashen(geheim, c.salz), c.hash);
  }
  if (!stimmt) {
    /* Hochzaehlen und dieselbe Auskunft wie bei einer falschen
       Kennung: ob der Vorderteil stimmt, geht niemanden etwas an. */
    await bremse.ref.set({ zahl: bremse.zahl + 1, seit: bremse.seit, letzter: Date.now() });
    throw new functions.https.HttpsError('permission-denied',
      'Dieser Code stimmt nicht.');
  }
  await bremse.ref.set({ zahl: 0, seit: Date.now(), letzter: Date.now() });

  /* Beim Rueckfall zeigt der Hash-Eintrag auf den Teilnehmer; im
     Normalfall haben wir ihn schon. */
  let tSnap = tDoc;
  if (!tSnap) {
    const cSnap2 = await F.collection('schulungCodes').doc(kennung).get();
    const c2 = cSnap2.exists ? (cSnap2.data() || {}) : {};
    tSnap = await F.collection('schulungTeilnehmer').doc(String(c2.teilnehmer || '')).get();
    if (!tSnap.exists) tSnap = null;
  }
  const t = tSnap ? (tSnap.data() || {}) : null;
  if (!t) throw new functions.https.HttpsError('not-found', 'Zu diesem Code gibt es keinen Namen mehr.');
  if (t.gesperrt) {
    throw new functions.https.HttpsError('permission-denied',
      'Dieser Code ist stillgelegt. Bitte bei der Leitung melden.');
  }

  /* ── Warum das Modul hier NICHT ueberprueft wird ──
     Der Grundstock der Schulungen liegt als Datei (schulungen-basis.js)
     und nicht in der Datenbank — dieselbe Rechnung wie beim Handbuch,
     und aus demselben Grund: in der Sammlung kostete er bei jedem
     Oeffnen so viele Lesevorgaenge, wie es Module gibt. Der Server
     sieht diese Datei nicht. Wuerde er hier auf die Sammlung pruefen,
     lehnte er JEDEN Start ab, solange kein einziges Modul von Hand
     angelegt wurde — also heute jeden.

     Das ist kein Loch: die Schranke dieses Weges ist der CODE, nicht
     die Modulkennung. Wer einen gueltigen Code hat, darf eine Schulung
     machen; welche, ist keine Frage der Sicherheit. Ein erfundener
     Modulname ergaebe hoechstens einen Durchlauf, den niemand
     zuordnen kann.

     Was aus der Sammlung kommt, wird trotzdem genommen — dann steht
     der Titel schon beim Anlegen im Datensatz. Bei einem Modul aus der
     Datei traegt ihn die App beim ersten Zwischenspeichern nach. */
  const mSnap = await F.collection('schulungen').doc(modulId).get();
  const m = mSnap.exists ? (mSnap.data() || {}) : null;
  if (m && m.aktiv === false) {
    throw new functions.https.HttpsError('not-found', 'Dieses Modul ist abgeschaltet.');
  }

  /* Wie oft hat dieselbe Person dieses Modul schon angefangen? Das ist
     die Zahl aus dem Betrieb („wie oft er alles geguckt hat"), und sie
     gehoert an den Durchlauf, nicht in eine Rechnung hinterher. */
  const frueher = await F.collection('schulungLaeufe')
    .where('teilnehmer', '==', tSnap.id).where('modul', '==', modulId).get();

  const jetzt = Date.now();
  const lauf = F.collection('schulungLaeufe').doc();
  await lauf.set({
    modul: modulId, modulTitel: (m && m.titel) || '', kategorie: (m && m.kategorie) || '',
    teilnehmer: tSnap.id, teilnehmerName: t.name || '',
    /* Steht die Person auch als Konto in der App, sieht sie ihre
       eigenen Zahlen spaeter im Ich-Bereich. Ohne Konto bleibt das
       Feld leer, und der Durchlauf ist trotzdem vollstaendig. */
    uid: t.uid || null,
    /* Worauf es lief. Genau die drei Angaben aus dem Betrieb. */
    geraetUid: uid, geraetName: profil.name || '',
    studioKey: t.studioKey || (profil.studioKeys || [])[0] || null,
    start: jetzt, ende: 0, aktivMs: 0,
    durchgang: frueher.size + 1,
    schritteGesehen: [], fragen: [],
    punkte: 0, bestanden: false, status: 'laeuft',
    ts: jetzt
  });
  return { ok: true, lauf: lauf.id, name: t.name || '', durchgang: frueher.size + 1 };
});

exports.__intern = { mailWillHaben, kontenImStudio, collectMonthly, monatsText, berichtHtml,
                     collectTokens, inStudio, willHaben, fertigMeldungen, standSatz,
                     berlinZuUtc, icsZeit, icsText, icsFalten, icsBauen, tokenGleich,
                     berlinDatum, tagDanach, erledigt,
                     pinZuSchwach, pinHashen, pinPruefen,
                     schulungZeichen, schulungCodeNormal, SCHULUNG_ALPHABET,
                     SCHULUNG_VERSUCHE_MAX, SCHULUNG_VERSUCHE_FENSTER_MS,
                     geheimHashen, naechsterSchritt,
                     codeFenster, codeAus, CODE_FENSTER_MS, CODE_VORRAT,
                     /* Die Abo-Leiter ist rein rechnerisch und damit ohne
                        Datenbank pruefbar — genau deshalb steht sie hier. */
                     aboZugriff, aboStufeNachTagen, aboNeuRechnen,
                     kennungVon, aboIdAusRechnung, periodeAusRechnung, periodeAusAbo,
                     ABO_STATUS, ABO_STUFEN, LEITERN,
                     vorfallText, betrifft, auskunftSauber,
                     /* Nur für tests/rules/vorfall.test.js: ein Ersatz-Versender,
                        der festhält, was er bekommt. Ohne ihn liesse sich die
                        Wichtigkeit der Mail nicht prüfen, ohne echt zu senden. */
                     mailerFuerDurchlauf: (m) => { _mailer = m; } };
