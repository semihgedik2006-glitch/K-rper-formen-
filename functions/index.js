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
   MEHRERE FIRMEN — der Zugriffspunkt (Stufe 2E aus MANDANT-PLAN.md)

   In index.html laeuft jeder Datenzugriff durch S(). Hier fehlte das
   Gegenstueck: die Functions arbeiteten weiter auf den flachen Pfaden.
   Nach dem Umschalten haetten sie nichts mehr gefunden — die App haette
   funktioniert, aber KEINE Push-Nachricht, keine Erinnerung an
   ueberfaellige Aufgaben, keine Warnung vor ablaufenden Nachweisen.
   Lautlos, ohne Fehlermeldung.

   Aufgefallen ist das erst kurz vor dem Live-Umzug. Ich hatte in Stufe
   2A nur index.html gezaehlt, obwohl der Plan "jede Cloud Function"
   ausdruecklich nennt.

   W(firma) ist die Wurzel: ohne Firma die Datenbank selbst (flach, wie
   heute), mit Firma das Dokument darunter. Damit laeuft derselbe Code
   vor UND nach dem Umzug — und spaeter fuer mehrere Kunden.
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
async function sendPush(tokens, title, body) {
  if (!tokens.length) return;
  const message = {
    notification: { title, body: body || '' },
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
   Ein Firestore-Auslöser braucht einen festen Pfad; er kann nicht
   „flach ODER verschachtelt" hören. Also wird jeder Handler ZWEIMAL
   registriert: einmal auf dem alten Pfad, einmal auf firmen/{firma}/….

   Warum nicht einfach umstellen: zwischen dem Umzug der Daten und dem
   Umschalten der App liegt eine Lücke von Minuten. Wer in dieser Zeit
   etwas schreibt, bekäme sonst keine Meldung. Der alte Auslöser fällt
   weg, wenn die flachen Daten aufgeräumt werden — frühestens 30 Tage
   nach dem Umzug. */
function beideWelten(pfad, handler, art, opt) {
  art = art || 'onCreate';
  const r = opt ? region.runWith(opt) : region;
  return {
    flach: r.firestore.document(pfad)[art](handler),
    firma: r.firestore.document('firmen/{firma}/' + pfad)[art](handler),
  };
}

/* Die Firma zu EINEM Profil — für Aufrufe aus der App, wo genau eine
   Person dahintersteht.

   null heisst: es gibt noch keine Firmen-Sammlung, also flache Pfade wie
   heute. Ist die Firma dagegen gesperrt oder unbekannt, wird abgebrochen
   statt auf flach zurückzufallen: dort liegen die Daten der
   Voreinstellung, und still in fremde Daten zu schreiben ist schlimmer
   als eine Fehlermeldung. */
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
    const tokens = await collectTokens(
      d => inStudio(d, studioKey) && willHaben(d, 'todos'),
      t.createdByUid, ctx.params.firma || null);
    await sendPush(tokens, 'Neue Aufgabe', t.title || '');
};
const _todo = beideWelten('studios/{studioKey}/todos/{todoId}', _neueAufgabe);
exports.onNewTodo = _todo.flach;
exports.onNewTodoF = _todo.firma;

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
    .set({ name: 'Körperformen 🎂', role: 'chef', system: true }, { merge: true });

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

    const uid = doc.id;
    const dmId = 'dm_' + ['system', uid].sort().join('_');
    const ts = Date.now();
    await W(firma).collection('dms').doc(dmId).collection('messages').add({
      uid: 'system', name: 'Körperformen 🎂',
      text: '🎉 Alles Gute zum Geburtstag, ' + (u.name || '') + '! Hab einen tollen Tag. – dein Körperformen-Team',
      ts: ts
    });
    const names = { system: 'Körperformen 🎂' }; names[uid] = u.name || '';
    const readTs = { system: ts };
    await W(firma).collection('dms').doc(dmId).set({
      participants: ['system', uid], names: names,
      last: '🎉 Alles Gute zum Geburtstag!', lastTs: ts, lastSender: 'system', readTs: readTs
    }, { merge: true });
    // Push
    const tokens = await collectTokens(d => d.uid === uid, 'system', firma);
    await sendPush(tokens, 'Körperformen 🎂', 'Alles Gute zum Geburtstag! 🎉');
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
   Erste-Hilfe-Kurs, Trainerlizenz, EMS-Einweisung: jedes mit eigenem
   Ablaufdatum. Ohne Erinnerung faellt das erst auf, wenn es zu spaet ist.

   Gemeldet wird an GENAU zwei Tagen: 60 und 14 Tage vorher, dazu einmal am
   Tag des Ablaufs. Absichtlich nicht taeglich ab Tag 60 - eine Meldung, die
   46-mal kommt, liest nach der dritten niemand mehr.

   Die Person bekommt ihre eigene Meldung, der Chef eine Sammelmeldung.
   Die Studio-Leitung bekommt nichts: Qualifikationsdaten gehen sie nichts
   an (siehe firestore.rules). */
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
   Zwei geschützte KI-Funktionen, beide über die Gemini-API
   (kostenloses Kontingent, keine Kreditkarte nötig). Der API-Schlüssel
   liegt NUR hier auf dem Server (functions/.env), nie im Browser.
   - marketingChat  → Text-Modell (Ideen, Texte, Foto-Analyse)
   - marketingImage → Bild-Modell (Bild-Generierung)
   ============================================================ */

const MARKETING_SYSTEM_PROMPT =
  'Du bist der Marketing-Assistent des EMS-Studios "Körperformen" (Body-Shaping, ' +
  '20-Minuten-EMS-Training, persönliche Betreuung, mehrere Standorte im Raum Köln/Hürth). ' +
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
   BETREIBER-EBENE (Stufe D aus MANDANT-PLAN.md)

   Nur fuer Konten mit admin:true. Das Feld ist bewusst KEIN Rollenwert:
   der Betreiber bleibt Chef seiner eigenen Firma und ist zusaetzlich
   Admin. Vergeben kann es nur ein Admin - erzwungen in firestore.rules.

   WAS DER ADMIN HIER NICHT BEKOMMT: Zugriff auf Inhalte fremder Firmen.
   Diese Funktionen legen an, sperren und zaehlen. Sie lesen keinen Chat,
   keine Aufgaben und keine Personendaten. Das war die Entscheidung, die
   im Verkaufsgespraech den Satz erlaubt: "Ich komme an Ihre Daten nicht
   heran."
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
   Legt die Firma an, erzeugt das Anmeldekonto des ersten Chefs und
   schreibt sein Profil. Alles drei zusammen, denn einzeln ist nichts
   davon brauchbar: eine Firma ohne Chef kann niemand einrichten, und
   ein Chef ohne Firma sieht nichts.

   Das Passwort wird hier erzeugt und EINMAL zurueckgegeben. Es wird
   nirgends gespeichert - weder in Firestore noch im Protokoll. */
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
       Ohne dieses Dokument faellt die App auf KONFIG.studios zurueck —
       und das sind die vierzehn Standorte von Koerperformen. Ein neuer
       Kunde haette beim ersten Anmelden die Standortliste eines
       fremden Betriebs vor sich gehabt. Kein Datenleck im engeren
       Sinn, aber eines, das jedes Verkaufsgespraech beendet.

       Die Namen sind bewusst neutral: "Studio 1", "Studio 2". Wie die
       Standorte wirklich heissen, weiss nur der Kunde, und er benennt
       sie unter Verwaltung → Standorte selbst um. Die Kennungen
       (studio-0, studio-1, …) bleiben dabei stehen — daran haengen
       spaeter Aufgaben und Putzplaene. */
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

/* ── Abo-Zustand setzen (Stufe A aus ABO-PLAN.md) ────────────────────
   Von Hand, durch den Betreiber. Es fliesst kein Geld, es sperrt noch
   nichts — die App LIEST den Zustand und zeigt ihn an, mehr nicht.

   Warum trotzdem eine Cloud Function und nicht nur eine Regel: hier
   gehoert Pruefung hin, die eine Regel schlecht kann (Stufennamen,
   Betraege, Datum), und ein Vermerk, WER es gesetzt hat. Bei allem, was
   spaeter Geld bedeutet, will man das nachlesen koennen.

   'gratis' ist ein eigener Zustand, kein Preis von 0 mit Beigeschmack.
   Der Unterschied zaehlt: ein Gratis-Abo ist eine Entscheidung, kein
   Zahlungsausfall — und es darf nie in die Mahnstufen geraten.        */
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
       Begruendung in ABO-PLAN.md, Abschnitt 5. */
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

/* ── Eine Firma löschen — in den Papierkorb, nicht in den Ofen ────────
   Was hier NICHT passiert: die Daten werden nicht angefasst. Sie
   bleiben unter firmen/<kennung>/… liegen, nur ihr Elterndokument
   wandert nach firmenArchiv. Dadurch findet .get() die Firma nicht
   mehr — alleFirmen() übergeht sie, die Regeln lassen niemanden mehr
   hinein, sie verschwindet aus der Liste.

   Dass genau das funktioniert, ist keine Vermutung: dieselbe
   Eigenschaft (.get() sieht Dokumente ohne Elterneintrag nicht,
   listDocuments() schon) wurde am 10.8.2026 im Emulator gemessen und
   im Betrieb bestätigt.

   Warum kein echtes Löschen: ein Kunde, der kündigt, ruft erfahrungs-
   gemäss zwei Wochen später an und braucht noch eine Auswertung. Wer
   dann "ist weg" sagen muss, hat nichts gewonnen. Endgültig entfernt
   wird von Hand, bewusst, mit einem Werkzeug — nicht mit einem Knopf
   in einer Oberfläche.                                              */
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
   kann sie nur für sich selbst lesen. Hier steht sie deshalb über das
   Admin-SDK zur Verfügung.

   Warum nicht einfach der Client ein Feld "emailBestaetigt: true" ins
   eigene Profil schreiben lässt: weil er lügen kann. Genau der Punkt,
   an dem die Angabe etwas wert sein soll, wäre sie wertlos.

   Zurück kommt nur ein Ja/Nein je Kennung - keine Adresse, kein Name,
   kein Zeitpunkt. Mehr braucht die Freigabe-Karte nicht.               */
exports.mailStatus = region
  .https.onCall(async (data, context) => {
    await requireChef(context);
    const uids = Array.isArray(data && data.uids) ? data.uids.slice(0, 50) : [];
    if (!uids.length) return { stand: {} };
    const stand = {};
    await Promise.all(uids.map(async (uid) => {
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

/* ── Tagesgrenze für kostenpflichtige Aufrufe ──
   Das Projekt läuft auf dem Bezahlplan Blaze, und eine Budget-Warnung
   warnt nur – sie stoppt nichts. Ein Fehler in einer Schleife oder ein
   übermütiger Nachmittag am Bild-Generator wären sonst unbegrenzt.
   Gezählt wird je Tag und je Art, in EINEM Dokument.
   Bewusst kein Sekundengenauigkeit-Limit: die Grenze soll Unfälle
   abfangen, nicht normale Arbeit behindern.

   Gezählt wird JE FIRMA. Ein gemeinsamer Zähler wäre die bequemere
   Variante, aber dann sperrt der übermütige Nachmittag des einen Kunden
   den nächsten aus — und der bekommt eine Kostenbremse zu sehen, die
   ihn nichts angeht. Das Gesamtrisiko (Kundenzahl × Grenze) steuert der
   Betreiber darüber, wie viele Firmen er anlegt. */
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
    // Vorher stand hier nur requireAuth: JEDER selbst registrierte Zugang
    // konnte den Gemini-Schluessel der Firma benutzen.
    const profil = await requireChef(context);
    await tagesGrenze('marketingChat', 200, await firmaVonProfil(profil));
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
      systemInstruction: { parts: [{ text: MARKETING_SYSTEM_PROMPT }] },
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
   WACHSTUM & BETRIEB (wachstum.html) – Termin-E-Mails
   Automatischer Versand an Kundinnen/Kunden:
   - Bestätigung beim Anlegen (bzw. bei Terminverschiebung erneut)
   - Storno-Nachricht, wenn ein Termin storniert wird
   - Erinnerung X Stunden vorher + Follow-up danach (Zeitplan-Funktion)
   Versand über einen normalen SMTP-Zugang (Nodemailer). Zugangsdaten
   liegen NUR in functions/.env (aus GitHub-Secrets), nie im Browser.
   Empfohlen: Brevo Free (300 Mails/Tag, keine Kreditkarte). Alternativ
   funktioniert jeder SMTP-Zugang, z. B. Gmail mit App-Passwort.
   Details in ANLEITUNG.txt, Abschnitt 10.
   ============================================================ */

const nodemailer = require('nodemailer');

/* Wie viele Stunden vor dem Termin erinnert bzw. danach nachgefasst wird.
   Über functions/.env änderbar (REMINDER_HOURS / FOLLOWUP_HOURS). */
function reminderHours() { return +(process.env.REMINDER_HOURS || 24) || 24; }
function followupHours() { return +(process.env.FOLLOWUP_HOURS || 3) || 3; }

/* Standard-Vorlagen. Der Chef kann sie in wachstum.html (Tab "E-Mails")
   überschreiben – die überschriebenen Fassungen liegen in Firestore unter
   emailTemplates/<id> und gewinnen gegen diese Standards.
   Platzhalter: {name} {studio} {datum} {uhrzeit} {notiz} */
const MAIL_DEFAULTS = {
  confirm: {
    subject: 'Terminbestätigung – Körperformen {studio}',
    body: 'Hallo {name},\n\nhiermit bestätigen wir deinen Termin im Körperformen-Studio {studio}:\n\nDatum: {datum}\nUhrzeit: {uhrzeit} Uhr\n{notiz}\nBitte komm ein paar Minuten früher und bring bequeme Kleidung mit.\nFalls du den Termin nicht wahrnehmen kannst, gib uns bitte rechtzeitig Bescheid.\n\nBis bald!\nDein Körperformen-Team {studio}'
  },
  reminder: {
    subject: 'Erinnerung: dein Termin morgen – Körperformen {studio}',
    body: 'Hallo {name},\n\nkleine Erinnerung an deinen Termin im Körperformen-Studio {studio}:\n\nDatum: {datum}\nUhrzeit: {uhrzeit} Uhr\n\nWir freuen uns auf dich!\nDein Körperformen-Team {studio}'
  },
  followup: {
    subject: 'Danke für deinen Besuch – Körperformen {studio}',
    body: 'Hallo {name},\n\ndanke, dass du heute bei uns im Studio {studio} warst – stark gemacht!\nDenk daran, ausreichend zu trinken. Muskelkater in den nächsten Tagen ist völlig normal.\n\nWenn dir das Training gefallen hat, empfiehl uns gern weiter.\nBis zum nächsten Mal!\n\nDein Körperformen-Team {studio}'
  },
  cancel: {
    subject: 'Termin storniert – Körperformen {studio}',
    body: 'Hallo {name},\n\ndein Termin am {datum} um {uhrzeit} Uhr im Studio {studio} wurde storniert.\nWenn das ein Versehen war oder du einen neuen Termin möchtest, melde dich gern bei uns.\n\nDein Körperformen-Team {studio}'
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
    studio: appt.studioName || '',
    datum: fmt({ weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
    uhrzeit: fmt({ hour: '2-digit', minute: '2-digit' }),
    notiz: appt.note ? ('Hinweis: ' + appt.note + '\n') : ''
  };
  const fill = (s) => String(s).replace(/\{(name|studio|datum|uhrzeit|notiz)\}/g, (m, k) => vals[k]);
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
    from: '"Körperformen ' + (appt.studioName || '') + '" <' + fromAddr + '>',
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

    for (const firma of await alleFirmen()) {
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
   ------------------------------------------------------------
   Am ersten Werktag des Monats um 08:00 Uhr geht eine Zusammenfassung des
   vergangenen Monats an den Chef. Gedacht als Ersatz für "mal eben durch
   alle 14 Studios klicken".

   Bewusste Entscheidungen:
   - Nur an Konten mit der Rolle "chef". Studio-Leiter bekommen ihn nicht,
     weil er alle Studios enthält.
   - Fehlt die SMTP-Einrichtung, passiert nichts (und es wird protokolliert)
     statt dass die Funktion mit einem Fehler abbricht.
   - Die Studio-Namen kommen aus den Benutzerprofilen. Die Funktion kennt
     die Reihenfolge der Studio-Liste in der App nicht und soll sie auch
     nicht doppelt pflegen müssen.
   ============================================================ */

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

/* Zahlen für einen Zeitraum einsammeln */
async function collectMonthly(vonMs, bisMs, firma) {
  const namen = await studioNameMap(firma);
  const keys = Object.keys(namen);
  const zeilen = [];
  let erledigt = 0, offen = 0, ueberfaellig = 0, fehlt = 0;
  const proPerson = {};
  const jetzt = Date.now();

  for (const key of keys) {
    let sErledigt = 0, sOffen = 0, sUeber = 0;
    try {
      const snap = await W(firma).collection('studios').doc(key).collection('todos').get();
      snap.forEach(doc => {
        const t = doc.data() || {};
        if (t.doneAt && t.doneAt >= vonMs && t.doneAt <= bisMs) {
          sErledigt++; erledigt++;
          const wer = t.doneBy || 'Unbekannt';
          proPerson[wer] = (proPerson[wer] || 0) + 1;
        }
        if (!t.done) {
          sOffen++; offen++;
          if (t.due && jetzt > t.due) { sUeber++; ueberfaellig++; }
        }
      });
    } catch (e) { console.error('Aufgaben ' + key + ':', e); }

    let sFehlt = 0;
    try {
      const inv = await W(firma).collection('inventory').doc(key).get();
      const items = (inv.exists && inv.data().items) || [];
      items.forEach(it => {
        const n = (it.limit > 0) ? Math.max(0, it.limit - (it.have || 0)) : (it.need || 0);
        if (n > 0) { sFehlt += n; fehlt += n; }
      });
    } catch (e) { console.error('Material ' + key + ':', e); }

    zeilen.push({ name: namen[key] || key, erledigt: sErledigt, offen: sOffen, ueber: sUeber, fehlt: sFehlt });
  }

  zeilen.sort((a, b) => b.erledigt - a.erledigt);
  return { zeilen, erledigt, offen, ueberfaellig, fehlt, proPerson };
}

function monatsText(d, vonD, bisD) {
  const dat = (x) => x.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const L = [];
  L.push('Monatsbericht StudioChat');
  L.push('Zeitraum: ' + dat(vonD) + ' bis ' + dat(bisD));
  L.push('');
  L.push('AUF EINEN BLICK');
  L.push('  Aufgaben erledigt:      ' + d.erledigt);
  L.push('  Aktuell offen:          ' + d.offen);
  L.push('  Davon überfällig:       ' + d.ueberfaellig);
  L.push('  Fehlende Artikel:       ' + d.fehlt);
  L.push('');
  L.push('NACH STUDIO');
  d.zeilen.forEach(z => {
    const ges = z.erledigt + z.offen;
    const pct = ges ? Math.round(z.erledigt / ges * 100) : 0;
    L.push('  ' + z.name.padEnd(22) + String(z.erledigt).padStart(4) + ' erledigt · ' +
      String(z.offen).padStart(3) + ' offen' +
      (z.ueber ? ' · ' + z.ueber + ' überfällig' : '') +
      (z.fehlt ? ' · ' + z.fehlt + ' Artikel fehlen' : '') +
      '   (' + pct + '%)');
  });
  const leute = Object.keys(d.proPerson).sort((a, b) => d.proPerson[b] - d.proPerson[a]);
  if (leute.length) {
    L.push('');
    L.push('WER HAT WIE VIEL ERLEDIGT');
    leute.forEach(n => L.push('  ' + n.padEnd(22) + String(d.proPerson[n]).padStart(4)));
  }
  L.push('');
  L.push('Alle Zahlen im Detail findest du in StudioChat unter Verwaltung → Auswertung.');
  return L.join('\n');
}

/* Bericht bauen und an alle Chef-Konten schicken */
async function sendMonthlyReport(vonD, bisD, firma) {
  const mailer = getMailer();
  if (!mailer) { console.log('Monatsbericht übersprungen: SMTP nicht eingerichtet.'); return 0; }

  let empfaenger = [];
  try {
    const snap = await db.collection('users').where('role', '==', 'chef').get();
    snap.forEach(doc => {
      const d = doc.data() || {};
      if (!gehoertZu(d, firma)) return;
      if (d.email) empfaenger.push(d.email);
    });
  } catch (e) { console.error('Chef-Konten:', e); }
  if (!empfaenger.length) { console.log('Monatsbericht: kein Chef mit E-Mail gefunden.'); return 0; }

  const daten = await collectMonthly(vonD.getTime(), bisD.getTime(), firma);
  const text = monatsText(daten, vonD, bisD);
  const monat = vonD.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  const fromAddr = process.env.MAIL_FROM || process.env.SMTP_USER;

  await mailer.sendMail({
    from: '"StudioChat" <' + fromAddr + '>',
    to: empfaenger.join(', '),
    subject: 'Monatsbericht ' + monat + ' – StudioChat',
    text
  });
  console.log('Monatsbericht an', empfaenger.length, 'Empfänger gesendet.');
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
   Der HTTPS-Auslöser oben braucht einen Geheim-Schlüssel. Der liegt als
   GitHub-Secret und lässt sich dort nicht mehr auslesen – man muss ihn also
   irgendwo notiert haben. Das ist unnötig umständlich.

   Diese Fassung prüft stattdessen die Anmeldung: nur wer in der App als Chef
   eingeloggt ist, darf sie auslösen. Kein Schlüssel, kein Notizzettel.
   Die Rolle wird HIER auf dem Server geprüft, nicht in der App – sonst
   könnte sie jemand umgehen. */
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

    const empfaenger = await sendMonthlyReport(von, bis, await firmaVonProfil(profil));
    if (!empfaenger) {
      // Ehrlich sagen, woran es liegt, statt "hat nicht geklappt"
      const mailer = getMailer();
      throw new functions.https.HttpsError('failed-precondition', mailer
        ? 'Kein Chef-Konto mit hinterlegter E-Mail-Adresse gefunden.'
        : 'Der E-Mail-Versand ist noch nicht eingerichtet (SMTP-Zugangsdaten fehlen).');
    }
    return { ok: true, empfaenger: empfaenger, tage: tage };
  });

/* ── Tägliche Sicherung der Datenbank ──
   Der schwerwiegendste offene Punkt: es gab keine. Wochen-Archiv,
   Excel-Export und der 30-Tage-Papierkorb sind kein Ersatz - keiner davon
   holt nach einem versehentlichen Loeschen alles zurueck.

   Gesichert wird mit dem eingebauten Firestore-Export in den
   Standard-Speicher des Projekts. Das ist der Weg, den Google selbst
   vorsieht: konsistent ueber alle Sammlungen hinweg, und es laeuft
   serverseitig - der Export belastet weder die App noch das Kontingent
   fuer Lesezugriffe.

   Aufbewahrt werden sieben Taege (Ordner nach Datum). Wer weiter zurueck
   muss, holt sich den Ordner aus dem Speicher.

   WICHTIG: Der Dienstaccount der Functions braucht dafuer die Rolle
   "Cloud Datastore Import Export Admin". Fehlt sie, steht das im
   Protokoll - siehe OFFEN.md. */
const BACKUP_TAGE = 7;

/* ── Wohin die Sicherung geht ──
   Frueher stand hier fest "<projekt>.appspot.com". Firebase vergibt seit
   Ende 2024 aber Namen der Form "<projekt>.firebasestorage.app" - in einem
   neueren Projekt zeigte der feste Name deshalb ins Leere.
   admin.storage().bucket() nimmt den Speicher, der im Projekt wirklich
   eingerichtet ist. */
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
    requireAuth(context);
    const uid = context.auth.uid;
    const prof = await db.collection('users').doc(uid).get();
    if (!prof.exists || (prof.data() || {}).role !== 'chef') {
      throw new functions.https.HttpsError('permission-denied', 'Nur der Chef darf sichern.');
    }
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
   Die App blendet sie schon einen Tag nach dem Abhaken aus (und laesst sie
   auch aus der Google-Tabelle weg). Hier verschwinden sie zusaetzlich
   wirklich aus der Datenbank - sonst waechst der Putzplan jedes Studios
   endlos weiter, obwohl niemand die alten Eintraege je wieder sieht.

   Wiederkehrende Aufgaben bleiben unberuehrt; die setzen sich von selbst
   zurueck. Nicht erledigte bleiben ebenfalls stehen - die Arbeit einfach
   verschwinden zu lassen waere schlimmer als eine lange Liste. */
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

/* ── Tages-Sicherung: was war heute los? ─────────────────────────────
   Es gab bisher nur eine WOCHEN-Sicherung, und die wurde innerhalb der
   Woche immer wieder ueberschrieben. Damit war der Montag am Dienstag
   weg. Putzplan und Aufgaben setzen sich aber taeglich zurueck — wer
   nachvollziehen will, was an einem bestimmten Tag erledigt wurde,
   hatte keine Chance.

   ZWEI ENTSCHEIDUNGEN, die das Ergebnis bestimmen:

   1. ABENDS, nicht morgens. Eine Sicherung um 8 Uhr zeigt einen leeren
      Putzplan — sie haelt fest, dass noch nichts getan wurde. Nuetzlich
      ist der Stand um 23:45.

   2. AUF DEM SERVER, nicht in der App. Der Wochenlauf im Browser des
      Chefs las 462 Dokumente, und zwar auf seinem Geraet und seinem
      Datenvolumen. Taeglich waere das schlimmer. Hier laeuft es einmal,
      fuer alle, und niemand muss dafuer die App offen haben.        */
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
              return { text: n.text || '', by: n.by || '', at: n.ts || null };
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
   Gelöschtes bleibt 30 Tage liegen und verschwindet dann von selbst.
   Ohne diesen Lauf würde der Papierkorb ewig wachsen: bei Aufgaben mit
   Foto sind das schnell hunderte Kilobyte je Eintrag.

   Wichtig: Bei gelöschten Dokumenten liegt der Dateiinhalt weiterhin in
   documentData. Der wird hier mit entfernt – sonst bliebe der Platz
   dauerhaft belegt, obwohl niemand mehr an die Datei herankommt. */
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
