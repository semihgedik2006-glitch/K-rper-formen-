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
      if (isGeneral) return true;                 // Allgemein → alle
      return inStudio(d, channelId) || d.role === 'chef'; // Studio-Kanal → Studio + Chefs
    }, m.uid);
    const body = m.text ? m.text : (m.img ? '📷 Foto' : '');
    await sendPush(tokens, 'Neue Nachricht von ' + (m.name || 'Team'), body);
  });

/* ── Neue Aufgabe ── */
exports.onNewTodo = region.firestore
  .document('studios/{studioKey}/todos/{todoId}')
  .onCreate(async (snap, ctx) => {
    const t = snap.data() || {};
    const studioKey = ctx.params.studioKey;
    const tokens = await collectTokens(d => inStudio(d, studioKey), t.createdByUid);
    await sendPush(tokens, 'Neue Aufgabe', t.title || '');
  });

/* ── Neue Ankündigung ── */
exports.onNewAnnouncement = region.firestore
  .document('announcements/{annId}')
  .onCreate(async (snap) => {
    const a = snap.data() || {};
    const target = a.target || 'all';
    const tokens = await collectTokens(d => {
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
    const tokens = await collectTokens(d => d.uid === recipient, m.uid);
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
    requireAuth(context);
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

/* Ziel-Pixelmaße pro Seitenverhältnis (lange Kante ~1200px, reicht für Social + Web-Vorschau) */
const ASPECT_DIMENSIONS = {
  '1:1':  { w: 1024, h: 1024 },
  '3:4':  { w: 900,  h: 1200 },
  '4:3':  { w: 1200, h: 900  },
  '9:16': { w: 810,  h: 1440 },
  '16:9': { w: 1440, h: 810  }
};

/* ── Bild-Generierung (Pollinations.ai) ──
   Komplett kostenlos, kein API-Key nötig – im Gegensatz zu Googles Bild-Modellen,
   die selbst im "kostenlosen" Tarif ein Kontingent von 0 haben (Rechnungskonto Pflicht).
   Liefert { mime, data } (Base64). aspect ist optional: "1:1", "3:4", "4:3", "9:16", "16:9". */
exports.marketingImage = region
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onCall(async (data, context) => {
    requireAuth(context);
    const prompt = String((data && data.prompt) || '').slice(0, 4000).trim();
    if (!prompt) {
      throw new functions.https.HttpsError('invalid-argument', 'Bitte eine Bildbeschreibung eingeben.');
    }
    const aspect = String((data && data.aspect) || '');
    const dims = ASPECT_DIMENSIONS[aspect] || ASPECT_DIMENSIONS['1:1'];
    const seed = Math.floor(Math.random() * 1e9); // verhindert, dass gleiche Prompts immer dasselbe Bild liefern
    const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt) +
      '?width=' + dims.w + '&height=' + dims.h + '&seed=' + seed +
      '&nologo=true&model=flux';
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
