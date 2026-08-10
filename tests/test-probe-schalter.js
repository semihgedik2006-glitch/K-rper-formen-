/* Der Probelauf-Schalter in konfig.js.

   Dieselbe Datei läuft in beiden Projekten; die Adresse entscheidet.
   Das ist bequem — und genau deshalb muss es festgenagelt sein: wenn
   dieser Schalter je auf der Live-Adresse greift, stellt er den Betrieb
   auf Datenpfade um, die dort nicht existieren. Das Ergebnis wäre eine
   leere App für vierzehn Studios.

   Geprüft wird deshalb vor allem die FALSCH-Richtung: alles, was
   irgendwie nach der echten Adresse aussieht, muss beim Betrieb
   bleiben.                                                            */
const path = require('path');
const KONFIG_DATEI = path.join(__dirname, '..', 'konfig.js');

function laden(hostname) {
  // Jedes Mal frisch: konfig.js liest location beim Laden aus.
  delete require.cache[require.resolve(KONFIG_DATEI)];
  const raum = { location: { hostname: hostname } };
  raum.self = raum;
  const vm = require('vm');
  const fs = require('fs');
  vm.createContext(raum);
  vm.runInContext(fs.readFileSync(KONFIG_DATEI, 'utf8'), raum,
    { filename: 'konfig.js' });
  return raum.KONFIG;
}

const errs = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) console.log('  ✓ ' + name);
  else { console.log('  ✗ ' + name + (zusatz ? '  — ' + zusatz : '')); errs.push(name); }
}

// ══ Der Betrieb bleibt der Betrieb ══
const LIVE = [
  'formenchat.web.app',
  'formenchat.firebaseapp.com',
  'localhost',
  '127.0.0.1',
  // Die gefährlichen Ähnlichkeiten: enthalten die Zeichenfolge, sind
  // aber NICHT die Probe-Adresse.
  'formenchat-probe.example.com.angreifer.de',
  'meinformenchat-probe.de',
  'formenchat-probexyz.web.app',
];
console.log('── Adressen, die beim BETRIEB bleiben müssen ──');
for (const h of LIVE) {
  const k = laden(h);
  pruefe(h, k.firebase.projectId === 'formenchat' && k.mandant === false,
    'projectId=' + k.firebase.projectId + ' mandant=' + k.mandant);
}

// ══ Die Probe ist die Probe ══
console.log('\n── Adressen, die zum PROBELAUF gehören ──');
for (const h of ['formenchat-probe.web.app', 'formenchat-probe.firebaseapp.com']) {
  const k = laden(h);
  pruefe(h, k.firebase.projectId === 'formenchat-probe' && k.mandant === true
    && k.firma === 'koerperformen',
    'projectId=' + k.firebase.projectId + ' mandant=' + k.mandant);
}

// ══ In der Probe darf nichts nach draußen wirken ══
console.log('\n── Der Probelauf fasst nichts Echtes an ──');
{
  const k = laden('formenchat-probe.web.app');
  pruefe('keine Push-Nachrichten', !k.vapidKey);
  pruefe('keine echte Google-Tabelle', !k.sheetsWebhook);
  pruefe('Speicher zeigt auf das Probe-Projekt',
    /formenchat-probe/.test(k.firebase.storageBucket), k.firebase.storageBucket);
}

// ══ Ohne location (Service Worker beim Start, Node) ══
console.log('\n── Ohne Adresse ──');
{
  delete require.cache[require.resolve(KONFIG_DATEI)];
  const vm = require('vm'); const fs = require('fs');
  const raum = {}; raum.self = raum;
  vm.createContext(raum);
  vm.runInContext(fs.readFileSync(KONFIG_DATEI, 'utf8'), raum, { filename: 'konfig.js' });
  pruefe('fällt auf den Betrieb zurück, nicht auf die Probe',
    raum.KONFIG.firebase.projectId === 'formenchat' && raum.KONFIG.mandant === false);
}

console.log(errs.length
  ? '\n✗ ' + errs.length + ' Fehler — der Schalter greift an der falschen Stelle'
  : '\n✓ Probe-Schalter: greift nur auf der Probe-Adresse, sonst nie');
process.exit(errs.length ? 1 : 0);
