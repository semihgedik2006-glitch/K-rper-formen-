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

/* Tokens aus pushTokens holen, die zu den Kriterien passen.
   filterFn(data) → true = an dieses Gerät senden. excludeUid = Absender nicht benachrichtigen. */
async function collectTokens(filterFn, excludeUid) {
  const snap = await db.collection('pushTokens').get();
  const tokens = [];
  snap.forEach(doc => {
    const d = doc.data() || {};
    if (excludeUid && d.uid === excludeUid) return;
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
exports.onNewMessage = region.firestore
  .document('channels/{channelId}/messages/{msgId}')
  .onCreate(async (snap, ctx) => {
    const m = snap.data() || {};
    const channelId = ctx.params.channelId;
    const isGeneral = channelId === 'allgemein';
    const tokens = await collectTokens(d => {
      if (!willHaben(d, 'chat')) return false;
      if (isGeneral) return true;                 // Allgemein → alle
      return inStudio(d, channelId) || d.role === 'chef'; // Studio-Kanal → Studio + Chefs
    }, m.uid);
    const body = m.text ? m.text : (m.img ? '📷 Foto' : '');
    // Erwähnte Personen bekommen eine eigene, deutlichere Meldung ...
    const mentioned = Array.isArray(m.mentions) ? m.mentions : [];
    let mentionTokens = [];
    if (mentioned.length) {
      mentionTokens = await collectTokens(
        d => mentioned.indexOf(d.uid) >= 0 && willHaben(d, 'mentions'), m.uid);
      await sendPush(mentionTokens, (m.name || 'Jemand') + ' hat dich erwähnt', body);
    }
    // ... und werden aus der normalen Meldung herausgenommen, damit sie
    // nicht zweimal benachrichtigt werden
    const rest = tokens.filter(t => mentionTokens.indexOf(t) < 0);
    await sendPush(rest, 'Neue Nachricht von ' + (m.name || 'Team'), body);
  });

/* ── Neue Aufgabe ── */
exports.onNewTodo = region.firestore
  .document('studios/{studioKey}/todos/{todoId}')
  .onCreate(async (snap, ctx) => {
    const t = snap.data() || {};
    const studioKey = ctx.params.studioKey;
    const tokens = await collectTokens(
      d => inStudio(d, studioKey) && willHaben(d, 'todos'), t.createdByUid);
    await sendPush(tokens, 'Neue Aufgabe', t.title || '');
  });

/* ── Neue Ankündigung ── */
exports.onNewAnnouncement = region.firestore
  .document('announcements/{annId}')
  .onCreate(async (snap) => {
    const a = snap.data() || {};
    const target = a.target || 'all';
    const tokens = await collectTokens(d => {
      if (!willHaben(d, 'ann')) return false;
      if (target === 'all') return true;
      return inStudio(d, target) || d.role === 'chef';
    }, a.uid);
    await sendPush(tokens, '📣 ' + (a.from || 'Leitung'), a.text || '');
  });

/* ── Neue Direktnachricht → Push an den Empfänger ── */
exports.onNewDm = region.firestore
  .document('dms/{dmId}/messages/{msgId}')
  .onCreate(async (snap, ctx) => {
    const m = snap.data() || {};
    const parts = String(ctx.params.dmId).split('_'); // ['dm', uidA, uidB]
    const peers = parts.slice(1);
    const recipient = peers.find(u => u !== m.uid);
    if (!recipient) return;
    const tokens = await collectTokens(
      d => d.uid === recipient && willHaben(d, 'dm'), m.uid);
    const body = m.type === 'checklist' ? '📋 Checkliste' : (m.text || '');
    await sendPush(tokens, m.name || 'Neue Nachricht', body);
  });

/* ── Geburtstags-Logik (gemeinsam für den täglichen Lauf und den Test-Auslöser) ──
   Verschickt an alle, deren Geburtstag heute ist, einmal pro Jahr.
   Gibt die Anzahl der gesendeten Grüße zurück. */
async function processBirthdays() {
  const now = new Date();
  const mm = now.getMonth() + 1, dd = now.getDate(), year = now.getFullYear();
  // System-Account (Anzeige) sicherstellen
  await db.collection('users').doc('system')
    .set({ name: 'Körperformen 🎂', role: 'chef', system: true }, { merge: true });

  const snap = await db.collection('users').get();
  let sent = 0;
  for (const doc of snap.docs) {
    const u = doc.data() || {};
    if (!u.bday) continue;
    const p = String(u.bday).split('-');
    if (p.length < 3) continue;
    if (+p[1] === mm && +p[2] === dd && u.lastBdayDM !== year) {
      const uid = doc.id;
      const dmId = 'dm_' + ['system', uid].sort().join('_');
      const ts = Date.now();
      await db.collection('dms').doc(dmId).collection('messages').add({
        uid: 'system', name: 'Körperformen 🎂',
        text: '🎉 Alles Gute zum Geburtstag, ' + (u.name || '') + '! Hab einen tollen Tag. – dein Körperformen-Team',
        ts: ts
      });
      const names = { system: 'Körperformen 🎂' }; names[uid] = u.name || '';
      const readTs = { system: ts };
      await db.collection('dms').doc(dmId).set({
        participants: ['system', uid], names: names,
        last: '🎉 Alles Gute zum Geburtstag!', lastTs: ts, lastSender: 'system', readTs: readTs
      }, { merge: true });
      // Push
      const tokens = await collectTokens(d => d.uid === uid, 'system');
      await sendPush(tokens, 'Körperformen 🎂', 'Alles Gute zum Geburtstag! 🎉');
      await db.collection('users').doc(uid).update({ lastBdayDM: year });
      sent++;
    }
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

    const studios = await db.collection('studios').listDocuments();
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
          d => d.uid === t.assignedTo && willHaben(d, 'todos'), null);
        await sendPush(tk, 'Aufgabe fällig', t.title || '');
      }
      if (offenFuerAlle.length) {
        const tk = await collectTokens(
          d => inStudio(d, studioKey) && willHaben(d, 'todos'), null);
        const titel = offenFuerAlle.length === 1
          ? offenFuerAlle[0].title
          : offenFuerAlle.length + ' Aufgaben sind heute fällig';
        await sendPush(tk, 'Erinnerung', titel);
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

    let snap;
    try { snap = await db.collection('certificates').get(); }
    catch (e) { console.error('Nachweise lesen:', e); return null; }

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
    if (!faellig.length) return null;

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
        const tk = await collectTokens(d => d.uid === c.uid, null);
        await sendPush(tk, 'Nachweis ' + frist(c.tage), bezeichnung(c));
      } catch (e) { console.error('Nachweis-Push:', e); }
    }

    // 2. Der Chef einmal gesammelt
    try {
      const chefs = [];
      const users = await db.collection('users').get();
      users.forEach(d => { if ((d.data() || {}).role === 'chef') chefs.push(d.id); });
      if (chefs.length) {
        const tk = await collectTokens(d => chefs.indexOf(d.uid) >= 0, null);
        const text = faellig.length === 1
          ? (faellig[0].name + ': ' + bezeichnung(faellig[0]) + ' ' + frist(faellig[0].tage))
          : (faellig.length + ' Nachweise laufen demnaechst ab');
        await sendPush(tk, 'Nachweise', text);
      }
    } catch (e) { console.error('Nachweis-Chefmeldung:', e); }

    console.log('Nachweise: ' + faellig.length + ' Meldungen verschickt.');
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

/* ── Tagesgrenze für kostenpflichtige Aufrufe ──
   Das Projekt läuft auf dem Bezahlplan Blaze, und eine Budget-Warnung
   warnt nur – sie stoppt nichts. Ein Fehler in einer Schleife oder ein
   übermütiger Nachmittag am Bild-Generator wären sonst unbegrenzt.
   Gezählt wird je Tag und je Art, in EINEM Dokument.
   Bewusst kein Sekundengenauigkeit-Limit: die Grenze soll Unfälle
   abfangen, nicht normale Arbeit behindern. */
async function tagesGrenze(art, maximum) {
  const tag = new Date().toISOString().slice(0, 10);
  const ref = db.collection('config').doc('nutzung-' + tag);
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
    await requireChef(context);
    await tagesGrenze('marketingChat', 200);
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
    await requireChef(context);
    await tagesGrenze('marketingImage', 50);
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
async function buildMail(tplId, appt) {
  let tpl = MAIL_DEFAULTS[tplId];
  try {
    const snap = await db.collection('emailTemplates').doc(tplId).get();
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
async function sendApptMail(apptRef, appt, tplId, markField) {
  if (!appt.customerEmail) return false;
  const mailer = getMailer();
  if (!mailer) {
    console.log('E-Mail übersprungen (SMTP nicht konfiguriert):', tplId, apptRef.id);
    return false;
  }
  const mail = await buildMail(tplId, appt);
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
exports.onAppointmentCreated = region
  .runWith({ timeoutSeconds: 60 })
  .firestore.document('appointments/{apptId}')
  .onCreate(async (snap) => {
    const a = snap.data() || {};
    if (a.status === 'storniert') return;
    try { await sendApptMail(snap.ref, a, 'confirm', 'mailConfirmedAt'); }
    catch (e) { console.error('Bestätigungs-Mail:', e); }
  });

/* ── Termin geändert → Storno-Mail bzw. neue Bestätigung bei Verschiebung ── */
exports.onAppointmentUpdated = region
  .runWith({ timeoutSeconds: 60 })
  .firestore.document('appointments/{apptId}')
  .onUpdate(async (change) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    try {
      // Stornierung: einmalig Storno-Mail
      if (after.status === 'storniert' && before.status !== 'storniert' && !after.mailCancelledAt) {
        await sendApptMail(change.after.ref, after, 'cancel', 'mailCancelledAt');
        return;
      }
      // Verschiebung eines aktiven Termins: Bestätigung mit neuer Zeit,
      // Erinnerung/Follow-up für die neue Zeit wieder freigeben
      if (after.status !== 'storniert' && +after.startsAt !== +before.startsAt) {
        await change.after.ref.update({
          mailRemindedAt: admin.firestore.FieldValue.delete(),
          mailFollowupAt: admin.firestore.FieldValue.delete()
        }).catch(() => {});
        await sendApptMail(change.after.ref, after, 'confirm', 'mailConfirmedAt');
      }
    } catch (e) { console.error('Termin-Update-Mail:', e); }
  });

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

    // Erinnerungen: Termine innerhalb der nächsten REMINDER_HOURS Stunden
    const remSnap = await db.collection('appointments')
      .where('startsAt', '>=', now)
      .where('startsAt', '<=', now + reminderHours() * H)
      .get();
    for (const doc of remSnap.docs) {
      const a = doc.data() || {};
      if (a.status === 'storniert' || a.mailRemindedAt || !a.customerEmail) continue;
      try { await sendApptMail(doc.ref, a, 'reminder', 'mailRemindedAt'); }
      catch (e) { console.error('Erinnerungs-Mail ' + doc.id + ':', e); }
    }

    // Follow-ups: Termine, die vor mind. FOLLOWUP_HOURS Stunden waren
    // (Fenster: letzte 48 Stunden, damit Alt-Daten nicht angeschrieben werden)
    const fuSnap = await db.collection('appointments')
      .where('startsAt', '>=', now - 48 * H)
      .where('startsAt', '<=', now - followupHours() * H)
      .get();
    for (const doc of fuSnap.docs) {
      const a = doc.data() || {};
      if (a.status === 'storniert' || a.mailFollowupAt || !a.customerEmail) continue;
      try { await sendApptMail(doc.ref, a, 'followup', 'mailFollowupAt'); }
      catch (e) { console.error('Follow-up-Mail ' + doc.id + ':', e); }
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

/* Kennung "studio-7" → lesbarer Name, soweit aus den Profilen bekannt */
async function studioNameMap() {
  const map = {};
  try {
    const snap = await db.collection('users').get();
    snap.forEach(doc => {
      const d = doc.data() || {};
      const keys = Array.isArray(d.studioKeys) ? d.studioKeys : [];
      const names = Array.isArray(d.studios) ? d.studios : [];
      keys.forEach((k, i) => { if (names[i] && !map[k]) map[k] = names[i]; });
    });
  } catch (e) { console.error('studioNameMap:', e); }
  return map;
}

/* Zahlen für einen Zeitraum einsammeln */
async function collectMonthly(vonMs, bisMs) {
  const namen = await studioNameMap();
  const keys = Object.keys(namen);
  const zeilen = [];
  let erledigt = 0, offen = 0, ueberfaellig = 0, fehlt = 0;
  const proPerson = {};
  const jetzt = Date.now();

  for (const key of keys) {
    let sErledigt = 0, sOffen = 0, sUeber = 0;
    try {
      const snap = await db.collection('studios').doc(key).collection('todos').get();
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
      const inv = await db.collection('inventory').doc(key).get();
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
async function sendMonthlyReport(vonD, bisD) {
  const mailer = getMailer();
  if (!mailer) { console.log('Monatsbericht übersprungen: SMTP nicht eingerichtet.'); return 0; }

  let empfaenger = [];
  try {
    const snap = await db.collection('users').where('role', '==', 'chef').get();
    snap.forEach(doc => {
      const d = doc.data() || {};
      if (d.email) empfaenger.push(d.email);
    });
  } catch (e) { console.error('Chef-Konten:', e); }
  if (!empfaenger.length) { console.log('Monatsbericht: kein Chef mit E-Mail gefunden.'); return 0; }

  const daten = await collectMonthly(vonD.getTime(), bisD.getTime());
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
    try { await sendMonthlyReport(von, bis); }
    catch (e) { console.error('Monatsbericht:', e); }
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
      const n = await sendMonthlyReport(von, bis);
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

    const empfaenger = await sendMonthlyReport(von, bis);
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
  try {
    await db.collection('config').doc('sicherung').set({
      ts: Date.now(),
      ok: !!ok,
      ziel: ziel || '',
      fehler: fehler || ''
    }, { merge: false });
  } catch (e) {
    console.error('Sicherungsstand nicht geschrieben: ' + e.message);
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
    let studios;
    try { studios = await db.collection('studios').listDocuments(); }
    catch (e) { console.error('Studios lesen:', e); return null; }

    const refs = [];
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
    let snap;
    try {
      snap = await db.collection('trash').where('deletedAt', '<', grenze).limit(400).get();
    } catch (e) { console.error('Papierkorb lesen:', e); return null; }
    if (snap.empty) return null;

    // Alle zu loeschenden Verweise sammeln. Je Eintrag koennen es zwei sein
    // (der Papierkorb-Eintrag und der Dateiinhalt), darum kommen wir bei 400
    // Eintraegen auf bis zu 800 Loeschungen - ein Firestore-Stapel fasst aber
    // nur 500. Deshalb in Haeppchen von 400 abarbeiten.
    const refs = [];
    let n = 0;
    snap.forEach(doc => {
      const t = doc.data() || {};
      refs.push(doc.ref);
      if (t.col === 'documents' && t.orig && t.data && t.data.kind !== 'link') {
        refs.push(db.collection('documentData').doc(t.orig));
      }
      n++;
    });
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
