/* ── Firmencode: nie doppelt, Beitritt nur mit Code, Chef gibt frei (Runde 117) ──

   Aus dem Betrieb, 25.9.2026:
     „Chef bestätigt trotzdem bzw ein chef der jeweiligen firma und der
      chef legt ja auch den code an (achte darauf das kein code jemals
      sich doppeln kann egal wie viele firmen es gibt)"

   Die Funktionen werden hier AUSGEFÜHRT, gegen den Emulator:
     1. firmencodeSetzen: nur der Chef; derselbe Code (auch anders
        geschrieben: klein, mit Bindestrich) wird für eine zweite Firma
        abgewiesen — über das Verzeichnis UND über Altbestand, der nur
        in config/registrierung steht. Ein neuer Code räumt den alten
        Verzeichniseintrag weg. „Code erzeugen" liefert einen freien.
     2. firmaBeitreten: richtiger Code → Firma gesetzt, aber INAKTIV
        (Chef muss freigeben). Falscher Code → abgewiesen, gezählt; nach
        zehn Fehlversuchen ist für eine Stunde Schluss. Ein alter Code
        der Firma gilt nicht mehr. Wer schon im Team ist, kann nicht.
     3. beitrittZurueckziehen: zurück auf „ohne Firma".
     4. kontoLoeschen: nur für Konten ohne Team; ein Teammitglied nicht.
     5. firmencodesPruefen (Betreiber): nennt doppelte Altcodes nach
        Firma, nie den Code selbst.
   ───────────────────────────────────────────────────────────────────── */
const path = require('path');

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8791';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'demo-funktionen';
process.env.GOOGLE_CLOUD_PROJECT = 'demo-funktionen';

const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
const fns = require(path.join(__dirname, '..', '..', 'functions', 'index.js'));
const db = admin.firestore();

let bestanden = 0, gefallen = 0;
const protokoll = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) { bestanden++; protokoll.push('  ✓ ' + name); }
  else { gefallen++; protokoll.push('  ✗ ' + name + (zusatz ? '\n      ' + String(zusatz).slice(0, 300) : '')); }
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
const profil = async (uid) => (await db.doc('users/' + uid).get()).data() || null;

(async () => {
  /* Sauber anfangen: Andere Dateien schreiben in dasselbe Emulator-
     Projekt (auch eine Firma „beta" mit eigenem Code) — der Altbestand-
     Abgleich sähe sonst fremde Codes. Geleert wird über den Endpunkt des
     Emulators; recursiveDelete brach nach vielen Daten mit „call already
     cancelled" ab. */
  const antwort = await fetch('http://' + process.env.FIRESTORE_EMULATOR_HOST +
    '/emulator/v1/projects/demo-funktionen/databases/(default)/documents', { method: 'DELETE' });
  if (!antwort.ok) throw new Error('Emulator nicht geleert: ' + antwort.status);

  await db.doc('firmen/alpha').set({ name: 'Alpha GmbH', aktiv: true });
  await db.doc('firmen/beta').set({ name: 'Beta GmbH', aktiv: true });
  await db.doc('firmen/zu').set({ name: 'Zu GmbH', aktiv: false });
  await db.doc('users/chefA').set({ name: 'Chef A', role: 'chef', firma: 'alpha', aktiv: true });
  await db.doc('users/chefB').set({ name: 'Chef B', role: 'chef', firma: 'beta', aktiv: true });
  await db.doc('users/mitA').set({ name: 'Mit A', role: 'mitarbeiter', firma: 'alpha', aktiv: true });
  await db.doc('users/admin1').set({ name: 'Betreiber', role: 'chef', firma: 'alpha', aktiv: true, admin: true });
  for (const g of ['gast1', 'gast2', 'gast3', 'gast4', 'gast5']) {
    await db.doc('users/' + g).set({ name: g, role: 'mitarbeiter', firma: '_ohne', aktiv: false });
  }
  // Altbestand: zwei Firmen mit demselben Code, VOR Runde 117 gesetzt
  await db.doc('firmen/zu/config/registrierung').set({ code: 'ALT-1234' });
  await db.doc('firmen/beta/config/registrierung').set({ code: 'alt1234' });

  // ══ 1. firmencodeSetzen ══
  await scheitert('Mitarbeiter darf keinen Code setzen', fns.firmencodeSetzen.run({ code: 'MEIN-CODE' }, als('mitA')), /Geschäftsführung/);
  await scheitert('Zu kurz wird abgewiesen', fns.firmencodeSetzen.run({ code: 'ab1' }, als('chefA')), /6 bis 32/);
  const r1 = await fns.firmencodeSetzen.run({ code: 'Sommer-2026' }, als('chefA'));
  pruefe('Chef A setzt „Sommer-2026"', r1.codeNorm === 'SOMMER2026', JSON.stringify(r1));
  const v1 = (await db.doc('firmencodes/SOMMER2026').get()).data();
  pruefe('… das Verzeichnis kennt ihn für Alpha', v1 && v1.firma === 'alpha', JSON.stringify(v1));
  const k1 = (await db.doc('firmen/alpha/config/registrierung').get()).data();
  const s1 = (await db.doc('firmen/alpha/config/beitrittSchalter').get()).data();
  pruefe('… und config/registrierung + Schalter stehen', k1.codeNorm === 'SOMMER2026' && s1.codeNoetig === true && s1.freigabe === true);
  await scheitert('NIE DOPPELT: Chef B bekommt denselben Code nicht', fns.firmencodeSetzen.run({ code: 'SOMMER-2026' }, als('chefB')), /anderer Betrieb/);
  await scheitert('NIE DOPPELT: auch nicht anders geschrieben („sommer 2026")', fns.firmencodeSetzen.run({ code: 'sommer 2026' }, als('chefB')), /anderer Betrieb/);
  await scheitert('NIE DOPPELT: Altbestand zählt mit (Code steht nur in config/registrierung einer anderen Firma)',
    fns.firmencodeSetzen.run({ code: 'ALT1234' }, als('chefA')), /anderer Betrieb/);
  const r2 = await fns.firmencodeSetzen.run({ code: 'Herbst-2026' }, als('chefA'));
  pruefe('Chef A wechselt auf „Herbst-2026"', r2.codeNorm === 'HERBST2026');
  pruefe('… der alte Verzeichniseintrag ist weg', !(await db.doc('firmencodes/SOMMER2026').get()).exists);
  const r3 = await fns.firmencodeSetzen.run({ code: 'SOMMER-2026' }, als('chefB'));
  pruefe('… und jetzt darf Chef B „Sommer-2026" nehmen', r3.codeNorm === 'SOMMER2026');
  const z = await fns.firmencodeSetzen.run({ zufall: true }, als('chefA'));
  pruefe('„Code erzeugen": 8 Zeichen als 4-4, ohne 0/O/1/I', /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(z.code), z.code);
  pruefe('… und steht im Verzeichnis für Alpha', ((await db.doc('firmencodes/' + z.codeNorm).get()).data() || {}).firma === 'alpha');
  pruefe('… „Herbst-2026" ist damit frei', !(await db.doc('firmencodes/HERBST2026').get()).exists);

  // ══ 2. firmaBeitreten ══
  await scheitert('Alter Code von Alpha gilt nicht mehr', fns.firmaBeitreten.run({ code: 'Herbst-2026' }, als('gast1')), /gibt es nicht/);
  const b1 = await fns.firmaBeitreten.run({ code: z.code.toLowerCase().replace('-', ' ') }, als('gast1'));
  const p1 = await profil('gast1');
  pruefe('Richtiger Code (klein, mit Leerzeichen) → Alpha', b1.firma === 'alpha' && b1.name === 'Alpha GmbH', JSON.stringify(b1));
  pruefe('… aber INAKTIV — der Chef gibt frei', p1.firma === 'alpha' && p1.aktiv === false && p1.role === 'mitarbeiter'
    && Array.isArray(p1.studioKeys) && !p1.studioKeys.length, JSON.stringify(p1));
  await scheitert('Mit offener Anfrage kein zweiter Code', fns.firmaBeitreten.run({ code: 'SOMMER-2026' }, als('gast1')), /zurück/);
  await scheitert('Wer im Team ist, kann nicht beitreten', fns.firmaBeitreten.run({ code: 'SOMMER-2026' }, als('mitA')), /schon zu einem Betrieb/);
  // Beta hat inzwischen per firmencodeSetzen einen neuen Code — für
  // diesen Fall den Altbestand wiederherstellen (steht dann doppelt).
  await db.doc('firmen/beta/config/registrierung').set({ code: 'alt1234' });
  await scheitert('Altcode, der in ZWEI Firmen steht, gilt für keine', fns.firmaBeitreten.run({ code: 'ALT-1234' }, als('gast2')), /nicht eindeutig/);
  await db.doc('firmen/zu/config/registrierung').set({ code: 'NUR-ZU-99' });
  await scheitert('Stillgelegter Betrieb nimmt niemanden an', fns.firmaBeitreten.run({ code: 'NUR-ZU-99' }, als('gast2')), /keine Anmeldungen/);
  await db.doc('firmen/beta/config/registrierung').set({ code: 'BETA-ALT-7' });
  await db.doc('firmencodes/SOMMER2026').delete();
  const b2 = await fns.firmaBeitreten.run({ code: 'beta alt 7' }, als('gast3'));
  pruefe('Altcode, der nur bei EINER Firma steht, gilt (Beta)', b2.firma === 'beta');
  pruefe('… und wird im Verzeichnis nachgetragen', ((await db.doc('firmencodes/BETAALT7').get()).data() || {}).firma === 'beta');

  for (let i = 0; i < 10; i++) {
    await fns.firmaBeitreten.run({ code: 'FALSCH' + i }, als('gast4')).catch(() => {});
  }
  await scheitert('Nach zehn Fehlversuchen: eine Stunde Pause — auch mit dem richtigen Code',
    fns.firmaBeitreten.run({ code: z.code }, als('gast4')), /Zu viele Versuche/);

  // ══ 3. beitrittZurueckziehen ══
  await fns.beitrittZurueckziehen.run({}, als('gast1'));
  const p1b = await profil('gast1');
  pruefe('Zurückgezogen: wieder ohne Firma, inaktiv', p1b.firma === '_ohne' && p1b.aktiv === false, JSON.stringify(p1b));
  await scheitert('Ein Teammitglied hat nichts zurückzuziehen', fns.beitrittZurueckziehen.run({}, als('mitA')), /keine offene Anfrage/);

  // ══ 4. kontoLoeschen ══
  await scheitert('Ohne Bestätigung wird nicht gelöscht', fns.kontoLoeschen.run({}, als('gast5')), /bestätigen/);
  await scheitert('Ein Teammitglied löscht sich nicht selbst (Aufbewahrung)', fns.kontoLoeschen.run({ bestaetigt: true }, als('mitA')), /Geschäftsführung/);
  pruefe('… sein Profil steht noch', !!(await profil('mitA')));
  await fns.kontoLoeschen.run({ bestaetigt: true }, als('gast5'));
  pruefe('Konto ohne Team: gelöscht', !(await profil('gast5')));

  // ══ 5. firmencodesPruefen ══
  await db.doc('firmen/zu/config/registrierung').set({ code: 'DOPPEL-42' });
  await db.doc('firmen/beta/config/registrierung').set({ code: 'doppel 42' });
  await scheitert('Nur der Betreiber', fns.firmencodesPruefen.run({}, als('chefA')));
  const pr = await fns.firmencodesPruefen.run({}, als('admin1'));
  const text = JSON.stringify(pr);
  pruefe('Betreiber sieht: Beta und Zu teilen sich einen Code', pr.doppelt.length === 1 &&
    pr.doppelt[0].slice().sort().join() === 'beta,zu', text);
  pruefe('… ohne dass der Code in der Antwort steht', !/DOPPEL-?\s?42/i.test(text), text);

  console.log('\nFirmencode und Beitritt (Runde 117)\n' + protokoll.join('\n'));
  console.log('\n' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  process.exit(gefallen ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
