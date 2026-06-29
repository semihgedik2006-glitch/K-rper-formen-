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

/* ── Täglicher Geburtstagsgruß vom System-Account ── */
exports.birthdayGreetings = region.pubsub
  .schedule('every day 08:00')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    const now = new Date();
    const mm = now.getMonth() + 1, dd = now.getDate(), year = now.getFullYear();
    // System-Account (Anzeige) sicherstellen
    await db.collection('users').doc('system')
      .set({ name: 'Körperformen 🎂', role: 'chef', system: true }, { merge: true });

    const snap = await db.collection('users').get();
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
      }
    }
    return null;
  });
