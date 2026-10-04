/* ── BESTELLUNG PER MAIL (Runde 137) ─────────────────────────────────
   Aus dem Betrieb, 4.10.2026: „Bestellung per Mail" — aus der
   Materialliste mit einem Knopf eine fertige Bestellmail an den
   Lieferanten, plus Vermerk, wann zuletzt bestellt wurde.

   Zwei Teile:

   A. Die Regeln für das Protokoll bestellungen/, in BEIDEN Welten:
      · der Chef liest alles (auch ungefiltert abgefragt)
      · eine Studio-Leitung liest, was ihre Studios betrifft — auch als
        Abfrage array-contains-any, genau so, wie die App fragt
      · … aber nicht die Bestellung eines fremden Studios
      · ein Mitarbeiter liest nichts
      · schreiben kann niemand, auch der Chef nicht — „bestellt" darf nur
        dastehen, wenn der Server die Mail wirklich verschickt hat

   B. bestellungSenden, AUSGEFÜHRT gegen den Emulator, mit einem
      Ersatz-Versender, der festhält, was er bekommt:
      · ohne Lieferant → klare Absage, nichts protokolliert
      · ohne Mailversand → „nicht eingerichtet", nichts protokolliert
      · mit beidem → die Mail geht an den Lieferanten, Kopie und
        Antwort an die bestellende Person, die Positionen stehen drin,
        und erst dann steht sie im Protokoll
      · ein Mitarbeiter darf nicht, eine Leitung nur für ihre Studios
      · eine freie Empfängeradresse aus dem Aufruf wird NICHT benutzt
      · Versand gescheitert → nichts protokolliert
      · die Tagesgrenze
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8791';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'demo-funktionen';
process.env.GOOGLE_CLOUD_PROJECT = 'demo-funktionen';
delete process.env.SMTP_HOST; delete process.env.SMTP_USER; delete process.env.SMTP_PASS;
process.env.MAIL_FROM = 'app@example.org';

const { initializeTestEnvironment, assertFails, assertSucceeds } =
  require(path.join(__dirname, 'node_modules', '@firebase/rules-unit-testing'));
const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
const fns = require(path.join(__dirname, '..', '..', 'functions', 'index.js'));
const db = admin.firestore();

let bestanden = 0, gefallen = 0;
const protokoll = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) { bestanden++; protokoll.push('  ✓ ' + name); }
  else { gefallen++; protokoll.push('  ✗ ' + name + (zusatz ? '\n      ' + zusatz : '')); }
}
async function darf(name, versprechen) {
  try { await assertSucceeds(versprechen); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — sollte gehen, ging nicht (' + String(e.message).slice(0, 80) + ')'); }
}
async function darfNicht(name, versprechen) {
  try { await assertFails(versprechen); bestanden++; protokoll.push('  ✓ ' + name); }
  catch (e) { gefallen++; protokoll.push('  ✗ ' + name + ' — GING DURCH'); }
}
async function scheitert(name, versprechen, muster) {
  try { await versprechen; gefallen++; protokoll.push('  ✗ ' + name + ' — GING DURCH'); }
  catch (e) {
    const ok = !muster || muster.test(String(e.message || e));
    if (ok) { bestanden++; protokoll.push('  ✓ ' + name); }
    else { gefallen++; protokoll.push('  ✗ ' + name + ' — falscher Grund: ' + e.message); }
  }
}
const als = (uid) => ({ auth: { uid } });

const B1 = { ts: 2, vonUid: 'chef', vonName: 'Max', an: 'shop@lieferant.de', studioKeys: ['studio-1'],
             positionen: [{ name: 'Handtücher', menge: 10, studios: [{ key: 'studio-1', n: 10 }] }] };
const B2 = { ts: 1, vonUid: 'chef', vonName: 'Max', an: 'shop@lieferant.de', studioKeys: ['studio-9'],
             positionen: [{ name: 'Westen', menge: 2, studios: [{ key: 'studio-9', n: 2 }] }] };

(async () => {
  /* ══ A. Regeln ══ */
  const env = await initializeTestEnvironment({
    projectId: 'demo-regeltest',
    firestore: { host: '127.0.0.1', port: 8791,
      rules: fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8') }
  });
  for (let v = 1; ; v++) {
    try { await env.clearFirestore(); break; }
    catch (e) { if (v >= 3) throw e; await new Promise((r) => setTimeout(r, 1000 * v)); }
  }
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await d.doc('firmen/eins').set({ name: 'Betrieb eins', aktiv: true });
    await d.doc('users/chef').set({ name: 'Max', role: 'chef', firma: 'eins', aktiv: true, studioKeys: [] });
    await d.doc('users/lei').set({ name: 'Lea', role: 'leiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/ma').set({ name: 'Mara', role: 'mitarbeiter', firma: 'eins', aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/altchef').set({ name: 'Altchef', role: 'chef', aktiv: true, studioKeys: [] });
    await d.doc('users/altlei').set({ name: 'Altlea', role: 'leiter', aktiv: true, studioKeys: ['studio-1'] });
    await d.doc('users/altma').set({ name: 'Altma', role: 'mitarbeiter', aktiv: true, studioKeys: ['studio-1'] });
    for (const p of ['firmen/eins/', '']) {
      await d.doc(p + 'bestellungen/b1').set(B1);
      await d.doc(p + 'bestellungen/b2').set(B2);
    }
  });
  const fs_ = (uid) => env.authenticatedContext(uid).firestore();
  for (const [welt, chef, lei, ma, p] of [['firmen/eins', 'chef', 'lei', 'ma', 'firmen/eins/'],
                                          ['flach', 'altchef', 'altlei', 'altma', '']]) {
    protokoll.push('\n  ── Regeln: ' + welt + ' ──');
    await darf('der Chef fragt alle Bestellungen ab', fs_(chef).collection(p + 'bestellungen').limit(20).get());
    await darf('die Studio-Leitung fragt mit array-contains-any [ihre Studios] ab',
      fs_(lei).collection(p + 'bestellungen').where('studioKeys', 'array-contains-any', ['studio-1']).limit(20).get());
    await darf('… und liest eine Bestellung ihres Studios', fs_(lei).doc(p + 'bestellungen/b1').get());
    await darfNicht('… aber keine eines fremden Studios', fs_(lei).doc(p + 'bestellungen/b2').get());
    await darfNicht('… und nicht alles ungefiltert', fs_(lei).collection(p + 'bestellungen').limit(20).get());
    await darfNicht('ein Mitarbeiter liest keine Bestellung', fs_(ma).doc(p + 'bestellungen/b1').get());
    await darfNicht('der Chef trägt selbst keine Bestellung ein',
      fs_(chef).doc(p + 'bestellungen/neu').set(Object.assign({}, B1, { ts: 9 })));
    await darfNicht('die Studio-Leitung auch nicht', fs_(lei).doc(p + 'bestellungen/neu').set(B1));
    await darfNicht('niemand ändert eine Bestellung nachträglich',
      fs_(chef).doc(p + 'bestellungen/b1').update({ ts: 5 }));
    await darf('GEGENPROBE: der Chef hinterlegt den Lieferanten (config/lieferant)',
      fs_(chef).doc(p + 'config/lieferant').set({ name: 'Frottee GmbH', email: 'shop@lieferant.de' }));
    await darfNicht('die Studio-Leitung ändert den Lieferanten nicht',
      fs_(lei).doc(p + 'config/lieferant').set({ email: 'ich@woanders.de' }));
  }
  await env.cleanup();

  /* ══ B. bestellungSenden ══ */
  protokoll.push('\n  ── bestellungSenden ──');
  const W = 'firmen/koerperformen/';
  await db.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });
  await db.doc('users/chef').set({ name: 'Max', role: 'chef', firma: 'koerperformen', aktiv: true, studioKeys: [], email: 'max@example.org' });
  await db.doc('users/lei').set({ name: 'Lea', role: 'leiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'], email: 'lea@example.org' });
  await db.doc('users/ma').set({ name: 'Mara', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] });
  await db.doc(W + 'studios/studio-1').set({ name: 'Mitte' });
  await db.doc(W + 'studios/studio-2').set({ name: 'Nord' });
  const alte = await db.collection(W + 'bestellungen').get();
  for (const d of alte.docs) await d.ref.delete();
  const anzahl = async () => (await db.collection(W + 'bestellungen').get()).size;

  const POS = [{ name: 'Handtücher', menge: 12, studios: [{ key: 'studio-1', n: 4 }, { key: 'studio-2', n: 8 }] },
               { name: 'Desinfektion 1 l', menge: 3, studios: [{ key: 'studio-1', n: 3 }] }];

  await scheitert('ohne hinterlegten Lieferanten → klare Absage',
    fns.bestellungSenden.run({ positionen: POS }, als('chef')), /kein Lieferant/);
  await db.doc(W + 'config/lieferant').set({ name: 'Frottee GmbH', email: 'shop@lieferant.de', kundennr: 'K-4711' });
  await scheitert('ohne Mailversand → „nicht eingerichtet"',
    fns.bestellungSenden.run({ positionen: POS }, als('chef')), /nicht eingerichtet/);
  pruefe('… und nichts im Protokoll', (await anzahl()) === 0);

  const gesendet = [];
  let kaputt = false;
  fns.__intern.mailerFuerDurchlauf({ sendMail: async (m) => {
    if (kaputt) throw new Error('SMTP weg');
    gesendet.push(m); return { messageId: 'x' };
  } });

  await scheitert('ein Mitarbeiter bestellt nicht', fns.bestellungSenden.run({ positionen: POS }, als('ma')), /Leitung/);
  await scheitert('die Studio-Leitung nicht für ein fremdes Studio',
    fns.bestellungSenden.run({ positionen: POS }, als('lei')), /eigenen Studios/);
  await scheitert('ohne Positionen', fns.bestellungSenden.run({ positionen: [] }, als('chef')), /nichts zu bestellen/);
  await scheitert('Menge 0 oder Text statt Zahl',
    fns.bestellungSenden.run({ positionen: [{ name: 'X', menge: 'viel', studios: [] }] }, als('chef')), /Menge/);
  pruefe('nichts davon ging raus', gesendet.length === 0 && (await anzahl()) === 0);

  const r = await fns.bestellungSenden.run({ positionen: POS, notiz: 'Bitte bis Freitag.',
    an: 'jemand@fremd.de' }, als('chef'));
  const m = gesendet[0] || {};
  pruefe('die Mail geht raus', gesendet.length === 1 && r && r.ok === true);
  pruefe('an den hinterlegten Lieferanten — NICHT an die Adresse aus dem Aufruf', m.to === 'shop@lieferant.de', m.to);
  pruefe('Kopie und Antwort an die bestellende Person', m.cc === 'max@example.org' && m.replyTo === 'max@example.org', m.cc + ' / ' + m.replyTo);
  pruefe('Absender ist der bisherige, mit dem Namen des Betriebs', /^"Körperformen" <app@example\.org>$/.test(m.from || ''), m.from);
  pruefe('Betreff: Bestellung, Betrieb, Datum', /^Bestellung Körperformen · \d{2}\.\d{2}\.\d{4}$/.test(m.subject || ''), m.subject);
  const t = m.text || '';
  pruefe('im Text: Anrede, Kundennummer, Positionen mit Menge', /Guten Tag Frottee GmbH,/.test(t) &&
    /Kundennummer K-4711/.test(t) && /· Handtücher: 12 Stück/.test(t) && /· Desinfektion 1 l: 3 Stück/.test(t), t);
  pruefe('… die Aufteilung mit Studionamen statt Kennungen', /Handtücher – Mitte: 4, Nord: 8/.test(t), t);
  pruefe('… die Anmerkung und wer bestellt hat', /Anmerkung:\nBitte bis Freitag\./.test(t) && /\nMax\nKörperformen/.test(t), t);
  const log = r && r.id ? (await db.doc(W + 'bestellungen/' + r.id).get()).data() : null;
  pruefe('danach steht sie im Protokoll, unter firmen/<kennung>/', !!log && log.vonUid === 'chef' && log.vonName === 'Max' &&
    log.an === 'shop@lieferant.de' && log.positionen.length === 2, JSON.stringify(log));
  pruefe('… mit den betroffenen Studios (für die Leseregel der Leitung)',
    !!log && JSON.stringify(log.studioKeys.slice().sort()) === '["studio-1","studio-2"]');
  pruefe('… und nicht flach', !(await db.doc('bestellungen/' + r.id).get()).exists);

  const r2 = await fns.bestellungSenden.run({ positionen: [{ name: 'Westen', menge: 2, studios: [{ key: 'studio-1', n: 2 }] }] }, als('lei'));
  pruefe('die Studio-Leitung bestellt für ihr Studio', r2 && r2.ok && (gesendet[1] || {}).cc === 'lea@example.org');
  const ids = (await db.collection(W + 'bestellungen').limit(5).get()).docs.map((d) => d.id);
  pruefe('ohne Sortierung kommt die neueste zuerst (Kennung läuft rückwärts)', ids[0] === r2.id, ids.join(', '));
  await scheitert('die Leitung bestellt nichts ohne Studio dazu',
    fns.bestellungSenden.run({ positionen: [{ name: 'Westen', menge: 2, studios: [] }] }, als('lei')), /Studio/);

  kaputt = true;
  const vorher = await anzahl();
  await scheitert('Versand gescheitert → ehrliche Meldung', fns.bestellungSenden.run({ positionen: POS }, als('chef')), /ging nicht raus/);
  pruefe('… und kein „bestellt" im Protokoll', (await anzahl()) === vorher);
  kaputt = false;

  const grenze = fns.__intern.BESTELL_TAGESGRENZE;
  while ((await anzahl()) < grenze) await fns.bestellungSenden.run({ positionen: POS }, als('chef'));
  await scheitert('die ' + (grenze + 1) + '. Bestellung an einem Tag → abgewiesen',
    fns.bestellungSenden.run({ positionen: POS }, als('chef')), /schon 10/);

  await db.doc('firmen/koerperformen/abo/aktuell').set({ status: 'nurlesen' });
  await scheitert('im Abo-Zustand „nur lesen" wird nicht bestellt',
    fns.bestellungSenden.run({ positionen: POS }, als('chef')), /nichts ändern/);
  await db.doc('firmen/koerperformen/abo/aktuell').delete();

  // Der Text ohne Datenbank: ohne Aufteilung kein leerer Abschnitt
  const tx = fns.__intern.bestellText({ positionen: [{ name: 'A', menge: 1, studios: [] }], namen: {}, firmaName: 'F' });
  pruefe('ohne Aufteilung und ohne Anmerkung keine leeren Abschnitte',
    !/Aufteilung/.test(tx) && !/Anmerkung/.test(tx) && /^Guten Tag,/.test(tx), tx);

  console.log('\n── Bestellung per Mail ──');
  protokoll.forEach((z) => console.log(z));
  console.log('\n' + (gefallen
    ? '✗ ' + gefallen + ' Fehler, ' + bestanden + ' in Ordnung'
    : '✓ Bestellung: nur an den hinterlegten Lieferanten, nur protokolliert, was wirklich rausging — ' + bestanden + ' Zusicherungen'));
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
