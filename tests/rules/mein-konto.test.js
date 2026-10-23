/* ── Mein Konto (Runde 222) ───────────────────────────────────────────
   Aus dem Betrieb, 23.10.2026: „mitarbeiter können sich nur einstempeln
   und ihre eigenen stunden sehen ob plus oder minus und halt alles was
   sie sonst bräuchten".

   meinKonto liest mit Serverrechten, was die Person selbst nicht lesen
   darf (zeitAbschluesse, lohnEinstellungen, planerTeam), und gibt NUR
   die eigene Zeile heraus. Geprüft wird vor allem das Zweite: in der
   Antwort steht nichts von einer anderen Person — weder ihr Konto noch
   ihr Name noch ihre Vertragsstunden.

   Dass Anna zeitAbschluesse selbst NICHT lesen darf, prüft
   monatsabschluss.test.js in beiden Welten; daran ändert sich nichts.
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
async function scheitert(name, versprechen, muster) {
  try { await versprechen; gefallen++; protokoll.push('  ✗ ' + name + ' — GING DURCH'); }
  catch (e) {
    const ok = !muster || muster.test(String(e.message || e));
    if (ok) { bestanden++; protokoll.push('  ✓ ' + name); }
    else { gefallen++; protokoll.push('  ✗ ' + name + ' — falscher Grund: ' + e.message); }
  }
}
const LEUTE = {
  anna: { name: 'Anna', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
  ben:  { name: 'Bennet', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
  neu:  { name: 'Neu',  role: 'mitarbeiter', firma: 'koerperformen', aktiv: false, studioKeys: ['studio-1'] },
  zoe:  { name: 'Zoe',  role: 'mitarbeiter', firma: 'fremdfirma',    aktiv: true, studioKeys: ['studio-1'] },
  flo:  { name: 'Flo',  role: 'mitarbeiter', aktiv: true, studioKeys: ['studio-1'] }
};

(async () => {
  const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
  const fns = require(path.join(__dirname, '..', '..', 'functions', 'index.js'));
  const I = fns.__intern;
  const db = admin.firestore();
  const F = 'firmen/koerperformen/';
  const lauf = (uid) => ({ auth: { uid } });

  /* ── Rechnung ohne Datenbank ── */
  pruefe('monateVor: über den Jahreswechsel', JSON.stringify(I.monateVor('2026-02', 3)) === '["2026-01","2025-12","2025-11"]',
    JSON.stringify(I.monateVor('2026-02', 3)));
  pruefe('eigeneRegel: Unsinn wird 0, über 14 h auch', JSON.stringify(I.eigeneRegel({ 1: 'viel', 2: 900, 3: 360 }).tage) ===
    JSON.stringify({ 1: 0, 2: 0, 3: 360, 4: 0, 5: 0, 6: 0, 7: 0 }));
  pruefe('eigeneRegel: ohne Stunden kein Soll, aber der Urlaub bleibt', (function () {
    const r = I.eigeneRegel({ u: 25 }); return r.tage === null && r.urlaubJahr === 25;
  })());
  pruefe('eigeneRegel: Urlaub über 60 Tage gilt nicht', I.eigeneRegel({ u: 400 }).urlaubJahr === null);
  pruefe('eigeneAbschlussZeile: ein wieder geöffneter Monat zählt nicht',
    I.eigeneAbschlussZeile({ monat: '2026-09', abgeschlossen: false, zeilen: [{ uid: 'anna', konto: 5 }] }, 'anna') === null);

  /* ── Daten ── */
  for (const [uid, p] of Object.entries(LEUTE)) await db.doc('users/' + uid).set(Object.assign({}, p));
  await db.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });
  await db.doc('firmen/fremdfirma').set({ name: 'Fremd', aktiv: true });
  const laufend = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' }).slice(0, 7);
  const [m1, m2, m3] = I.monateVor(laufend, 3);
  const zeile = (uid, konto) => ({ uid, name: uid === 'anna' ? 'Anna' : 'Bennet', ist: 6000, soll: 5900,
    gutschrift: 0, saldo: 100, uebertrag: konto - 100, konto, tage: 20, offen: 0 });
  await db.doc(F + 'zeitAbschluesse/' + m1).set({ monat: m1, abgeschlossen: true, am: 1,
    zeilen: [zeile('anna', 120), zeile('ben', -4321)] });
  await db.doc(F + 'zeitAbschluesse/' + m2).set({ monat: m2, abgeschlossen: false, am: 1,
    zeilen: [zeile('anna', 777)] });
  await db.doc(F + 'zeitAbschluesse/' + m3).set({ monat: m3, abgeschlossen: true, am: 1,
    zeilen: [zeile('ben', -9999)] });
  await db.doc(F + 'lohnEinstellungen/zeitregeln').set({ regeln: {
    anna: { 1: 480, 2: 480, 3: 480, 4: 480, 5: 480, u: 28 },
    ben:  { 1: 333, u: 19 } } });
  await db.doc(F + 'planerTeam/p-anna').set({ uid: 'anna', name: 'Anna', wocheStd: 40, maxTageWoche: 5 });
  await db.doc(F + 'planerTeam/p-ben').set({ uid: 'ben', name: 'Bennet', wocheStd: 17.5 });
  /* Dieselben Dokumente ohne Firma — dort darf Anna (mit Firma) nichts finden. */
  await db.doc('zeitAbschluesse/' + m1).set({ monat: m1, abgeschlossen: true, zeilen: [zeile('anna', 5555), zeile('flo', 42)] });
  await db.doc('lohnEinstellungen/zeitregeln').set({ regeln: { flo: { 6: 240, u: 12 } } });

  /* ── Anna ── */
  const a = await fns.meinKonto.run({}, lauf('anna'));
  const roh = JSON.stringify(a);
  pruefe('Anna bekommt ihren abgeschlossenen Vormonat', a.ok && a.monate.length === 1 && a.monate[0].monat === m1 && a.monate[0].konto === 120, roh);
  pruefe('… nicht den wieder geöffneten Monat (777)', roh.indexOf('777') < 0);
  pruefe('… ihr Soll je Wochentag und 28 Tage Urlaub', a.regel && a.regel[1] === 480 && a.regel[6] === 0 && a.urlaubJahr === 28, roh);
  pruefe('… ihre Vertragsstunden', a.vertrag.wocheStd === 40 && a.vertrag.maxTageWoche === 5, roh);
  pruefe('IN DER ANTWORT STEHT NICHTS VON BEN: kein Konto (−4321, −9999)', roh.indexOf('4321') < 0 && roh.indexOf('9999') < 0, roh);
  pruefe('… kein Name, keine Stunden, kein Urlaub (333, 17.5, 19)', !/Bennet|ben|333|17\.5|"19"|:19\b/.test(roh), roh);
  pruefe('… und nichts aus den Pfaden ohne Firma (5555)', roh.indexOf('5555') < 0, roh);
  pruefe('… nur diese Felder, keine Zeilenliste', JSON.stringify(Object.keys(a).sort()) === JSON.stringify(['monat', 'monate', 'ok', 'regel', 'urlaubJahr', 'vertrag']), Object.keys(a).join(','));

  /* ── Ben: dieselbe Funktion, seine Zahlen ── */
  const b = await fns.meinKonto.run({}, lauf('ben'));
  pruefe('Ben bekommt seine zwei Monate, älter zuerst', b.monate.length === 2 && b.monate[0].monat === m3 && b.monate[1].konto === -4321, JSON.stringify(b));
  pruefe('… und nichts von Anna (120, 28, 40)', JSON.stringify(b).indexOf('120') < 0 && b.urlaubJahr === 19 && b.vertrag.wocheStd === 17.5);

  /* ── Wer nichts bekommt ── */
  const z = await fns.meinKonto.run({}, lauf('zoe'));
  pruefe('Eine andere Firma: leer, kein Soll', z.monate.length === 0 && z.regel === null && z.urlaubJahr === null, JSON.stringify(z));
  const f = await fns.meinKonto.run({}, lauf('flo'));
  pruefe('Ohne Firma: die flachen Pfade, nur die eigene Zeile', f.monate.length === 1 && f.monate[0].konto === 42 && f.regel[6] === 240 && JSON.stringify(f).indexOf('5555') < 0, JSON.stringify(f));
  await scheitert('Ohne Anmeldung → abgewiesen', fns.meinKonto.run({}, {}), /einloggen/);
  await scheitert('Ein nicht freigegebener Zugang → abgewiesen', fns.meinKonto.run({}, lauf('neu')), /freigegeben/);
  /* Was man mitschickt, ändert nichts: es gibt keinen Parameter „für wen". */
  const fremd = await fns.meinKonto.run({ uid: 'ben' }, lauf('anna'));
  pruefe('GEGENPROBE: Anna fragt mit uid=ben — sie bekommt trotzdem ihr eigenes', fremd.monate[0].konto === 120 && JSON.stringify(fremd).indexOf('4321') < 0);

  /* Aufräumen — andere Tests benutzen dieselben Namen im selben Emulator. */
  for (const pfad of [F + 'zeitAbschluesse', F + 'planerTeam', 'zeitAbschluesse']) {
    const rest = await db.collection(pfad).get();
    for (const d of rest.docs) await d.ref.delete();
  }
  await db.doc(F + 'lohnEinstellungen/zeitregeln').delete();
  await db.doc('lohnEinstellungen/zeitregeln').delete();

  console.log('\n══ Mein Konto ══');
  protokoll.forEach((x) => console.log(x));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  if (gefallen) { console.log('\n✗ meinKonto gibt zu viel oder das Falsche heraus.'); process.exit(1); }
  console.log('\n✓ Mein Konto: nur die eigene Zeile, nur abgeschlossene Monate — ' + bestanden + ' Zusicherungen');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
