/* ── Stempel-Erinnerung (Runde 238) ──────────────────────────────────
   Aus dem Betrieb, 23.10.2026: „mach die errinerungen und vlt auch in
   kobi mit formi und einer mail oder so".

   Teil A — die Rechnung (stempelErinnerungen), ohne Datenbank:
     · 15 min nach Schichtbeginn ohne Stempel → „kommen", einmal
     · 30 min nach Schichtende noch eingestempelt → „gehen", einmal
     · ohne Schicht 10 h nach dem Kommen → „gehen"
     · GEGENPROBEN: gestempelt, Feierabend schon gestempelt, Urlaub,
       Krank, abgelehnter Urlaub (zählt NICHT als frei), vor/nach dem
       Fenster, geteilter Dienst, Pause zählt als „noch da"
   Teil B — ein ganzer Lauf im Emulator (stempelErinnernFirma): wer
     bekommt Push, wer Mail; Mail nur bei „gehen"; mailAus 'stempel' und
     ein Gerät mit notify.stempel=false schalten ab; ein deaktiviertes
     Konto und eine andere Firma bekommen nichts.
   ───────────────────────────────────────────────────────────────────── */
const path = require('path');

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8791';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'demo-funktionen';
process.env.GOOGLE_CLOUD_PROJECT = 'demo-funktionen';

let bestanden = 0, gefallen = 0;
const protokoll = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) { bestanden++; protokoll.push('  ✓ ' + name); }
  else { gefallen++; protokoll.push('  ✗ ' + name + (zusatz ? '\n      ' + zusatz : '')); }
}

(async () => {
  const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
  const fns = require(path.join(__dirname, '..', '..', 'functions', 'index.js'));
  const I = fns.__intern;
  const heute = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
  const t = (hhmm) => I.berlinZuUtc(heute, hhmm).getTime();
  const MIN = 60000;
  const SCH = [{ uid: 'anna', from: '09:00', to: '17:00', studio: 'Hürth' }];
  const r = (o) => I.stempelErinnerungen(Object.assign({ heute, schichten: SCH, stempel: [], abwesend: [] }, o));
  const arten = (l) => l.map((e) => e.uid + ':' + e.art).join(',');

  protokoll.push('  ── A. Die Rechnung ──');
  pruefe('9:15 ohne Stempel → „kommen"', arten(r({ jetzt: t('09:15') + 5000 })) === 'anna:kommen');
  pruefe('… mit Studio und Uhrzeit im Text', /Hürth hat um 09:00 begonnen/.test((r({ jetzt: t('09:15') + 5000 })[0] || {}).text || ''));
  pruefe('GEGENPROBE 9:14 (vor dem Fenster) → nichts', arten(r({ jetzt: t('09:14') })) === '');
  pruefe('GEGENPROBE 9:30 (nächster Lauf) → nicht noch einmal', arten(r({ jetzt: t('09:30') + 5000 })) === '');
  pruefe('GEGENPROBE eingestempelt → nichts', arten(r({ jetzt: t('09:15') + 5000, stempel: [{ uid: 'anna', art: 'kommen', ts: t('08:58') }] })) === '');
  pruefe('GEGENPROBE ein stornierter Stempel zählt nicht → „kommen"',
    arten(r({ jetzt: t('09:15') + 5000, stempel: [{ uid: 'anna', art: 'kommen', ts: t('08:58'), storno: { von: 'x' } }] })) === 'anna:kommen');
  const da = [{ uid: 'anna', art: 'kommen', ts: t('08:55') }];
  pruefe('17:30 noch eingestempelt → „gehen"', arten(r({ jetzt: t('17:30') + 5000, stempel: da })) === 'anna:gehen');
  pruefe('… „seit 08:55" im Text', /seit 08:55/.test((r({ jetzt: t('17:30') + 5000, stempel: da })[0] || {}).text || ''));
  pruefe('in der Pause zählt als „noch da" → „gehen"',
    arten(r({ jetzt: t('17:30') + 5000, stempel: da.concat([{ uid: 'anna', art: 'pause', ts: t('12:00') }]) })) === 'anna:gehen');
  pruefe('GEGENPROBE 17:15 → noch nichts', arten(r({ jetzt: t('17:15') + 5000, stempel: da })) === '');
  pruefe('GEGENPROBE 17:45 → nicht noch einmal', arten(r({ jetzt: t('17:45') + 5000, stempel: da })) === '');
  pruefe('GEGENPROBE Feierabend gestempelt → nichts',
    arten(r({ jetzt: t('17:30') + 5000, stempel: da.concat([{ uid: 'anna', art: 'gehen', ts: t('17:02') }]) })) === '');
  pruefe('ohne Schicht: 10 h nach dem Kommen → „gehen"',
    arten(r({ schichten: [], jetzt: t('08:00') + 10 * 60 * MIN, stempel: [{ uid: 'ben', art: 'kommen', ts: t('08:00') }] })) === 'ben:gehen');
  pruefe('GEGENPROBE ohne Schicht nach 9:45 h → nichts',
    arten(r({ schichten: [], jetzt: t('17:45'), stempel: [{ uid: 'ben', art: 'kommen', ts: t('08:00') }] })) === '');
  pruefe('ohne Schicht und ohne Stempel → nichts', arten(r({ schichten: [], jetzt: t('12:00') })) === '');
  const urlaub = (status) => [{ uid: 'anna', type: 'urlaub', from: heute, to: heute, status }];
  pruefe('GEGENPROBE Urlaub (genehmigt) → nichts', arten(r({ jetzt: t('09:15') + 5000, abwesend: urlaub('genehmigt') })) === '');
  pruefe('GEGENPROBE krank → nichts', arten(r({ jetzt: t('09:15') + 5000, abwesend: [{ uid: 'anna', type: 'krank', from: heute, to: heute }] })) === '');
  pruefe('abgelehnter Urlaub ist KEIN freier Tag → „kommen"', arten(r({ jetzt: t('09:15') + 5000, abwesend: urlaub('abgelehnt') })) === 'anna:kommen');
  pruefe('Urlaub einer ANDEREN Person ändert nichts', arten(r({ jetzt: t('09:15') + 5000, abwesend: [{ uid: 'ben', type: 'urlaub', from: heute, to: heute }] })) === 'anna:kommen');
  const geteilt = [{ uid: 'anna', from: '08:00', to: '12:00' }, { uid: 'anna', from: '16:00', to: '20:00' }];
  const vormittag = [{ uid: 'anna', art: 'kommen', ts: t('07:58') }, { uid: 'anna', art: 'gehen', ts: t('12:03') }];
  pruefe('geteilter Dienst: Feierabend um 12, zweite Schicht 16 Uhr ohne Stempel → „kommen"',
    arten(r({ schichten: geteilt, jetzt: t('16:15') + 5000, stempel: vormittag })) === 'anna:kommen');
  pruefe('GEGENPROBE geteilter Dienst: nach 12 Uhr keine „gehen"-Erinnerung',
    arten(r({ schichten: geteilt, jetzt: t('12:30') + 5000, stempel: vormittag })) === '');
  const m = I.stempelErinnernMail({ titel: '⏱️ Feierabend vergessen?', text: 'X' }, 'Anna Beispiel');
  pruefe('Mail: Betreff ohne Zeichen, Anrede mit Vorname, Weg zum Abschalten',
    m.betreff === 'Feierabend vergessen?' && /^Hallo Anna,/.test(m.text) && /abschalten/.test(m.text), JSON.stringify(m));

  protokoll.push('  ── B. Ein Lauf im Emulator ──');
  const db = admin.firestore();
  const F = 'firmen/koerperformen/';
  const LEUTE = {
    sr_anna: { name: 'Anna', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-9'] },
    sr_ben: { name: 'Ben', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-9'], mailAus: ['stempel'] },
    sr_cem: { name: 'Cem', role: 'mitarbeiter', firma: 'koerperformen', aktiv: false, studioKeys: ['studio-9'] },
    sr_dora: { name: 'Dora', role: 'mitarbeiter', firma: 'fremdfirma', aktiv: true, studioKeys: ['studio-9'] }
  };
  for (const [uid, p] of Object.entries(LEUTE)) {
    await db.doc('users/' + uid).set(p);
    try { await admin.auth().deleteUser(uid); } catch (e) { /* gab es nicht */ }
    await admin.auth().createUser({ uid, email: uid + '@beispiel.test' });
  }
  await db.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });
  await db.doc(F + 'studios/studio-9').set({ name: 'Testhausen' });
  /* Schichten so gelegt, dass „jetzt" genau 30 min nach dem Ende liegt. */
  const jetzt = Date.now();
  const hhmm = (ts) => new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
  const ende = jetzt - 30 * MIN - 60000, anfang = ende - 4 * 3600000;
  const tagDerSchicht = new Date(anfang).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
  if (tagDerSchicht !== heute || hhmm(anfang) > hhmm(ende)) {
    protokoll.push('  (Teil B übersprungen: kurz nach Mitternacht reicht der Tag nicht für eine 4-Stunden-Schicht — ' + hhmm(jetzt) + ')');
  } else {
    for (const uid of ['sr_anna', 'sr_ben', 'sr_cem', 'sr_dora']) {
      await db.doc(F + 'studios/studio-9/shifts/s-' + uid).set({ uid, date: heute, from: hhmm(anfang), to: hhmm(ende) });
      await db.doc(F + 'zeiten/z-' + uid).set({ uid, art: 'kommen', ts: anfang - 5 * MIN, tag: heute, monat: heute.slice(0, 7), studioKey: 'studio-9' });
    }
    await db.doc('pushTokens/tok-anna').set({ uid: 'sr_anna', firma: 'koerperformen', notify: { stempel: true } });
    await db.doc('pushTokens/tok-ben').set({ uid: 'sr_ben', firma: 'koerperformen', notify: { stempel: false } });
    await db.doc('pushTokens/tok-dora').set({ uid: 'sr_dora', firma: 'fremdfirma' });
    const gepusht = [], gemailt = [];
    I.mailerFuerDurchlauf({ sendMail: async (x) => { gemailt.push(x); return { messageId: 'x' }; } });
    const bericht = await I.stempelErinnernFirma('koerperformen', jetzt, { push: async (tokens, titel, text) => { gepusht.push({ tokens, titel, text }); } });
    I.mailerFuerDurchlauf(null);
    const von = (uid) => bericht.find((b) => b.uid === uid);
    pruefe('Anna: „gehen" mit Push UND Mail', von('sr_anna') && von('sr_anna').art === 'gehen' && von('sr_anna').push === 1 && von('sr_anna').mail === 1, JSON.stringify(bericht));
    pruefe('… die Mail geht an Annas Adresse, Betreff „Feierabend vergessen?"',
      gemailt.length === 1 && gemailt[0].to === 'sr_anna@beispiel.test' && gemailt[0].subject === 'Feierabend vergessen?', JSON.stringify(gemailt.map((x) => [x.to, x.subject])));
    pruefe('… der Push geht nur an Annas Gerät', gepusht.length === 1 && JSON.stringify(gepusht[0].tokens) === '["tok-anna"]', JSON.stringify(gepusht));
    pruefe('GEGENPROBE Ben (Push am Gerät aus, Mail abbestellt): erinnert, aber kein Push, keine Mail',
      von('sr_ben') && von('sr_ben').push === 0 && von('sr_ben').mail === 0, JSON.stringify(von('sr_ben')));
    pruefe('GEGENPROBE Cem (deaktiviert): nichts', !von('sr_cem'));
    pruefe('GEGENPROBE Dora (andere Firma): nichts', !von('sr_dora'));
    const zweiter = await I.stempelErinnernFirma('koerperformen', jetzt + 15 * MIN, { push: async () => {} });
    pruefe('GEGENPROBE der nächste Lauf 15 min später: keine zweite Erinnerung', zweiter.length === 0, JSON.stringify(zweiter));
  }

  /* Aufräumen — dieselben Pfade benutzen andere Tests. */
  for (const pfad of [F + 'studios/studio-9/shifts', F + 'zeiten']) {
    const rest = await db.collection(pfad).get();
    for (const d of rest.docs) if (/^(s|z)-sr_/.test(d.id)) await d.ref.delete();
  }
  for (const id of ['tok-anna', 'tok-ben', 'tok-dora']) await db.doc('pushTokens/' + id).delete();
  await db.doc(F + 'studios/studio-9').delete();

  console.log('\n══ Stempel-Erinnerung ══');
  protokoll.forEach((x) => console.log(x));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  if (gefallen) { console.log('\n✗ Die Stempel-Erinnerung erinnert falsch, doppelt oder die Falschen.'); process.exit(1); }
  console.log('\n✓ Stempel-Erinnerung: einmal, nur wer wirklich vergessen hat, Push und Mail abschaltbar — ' + bestanden + ' Zusicherungen');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
