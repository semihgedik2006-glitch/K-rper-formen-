/* Der Probelauf-Schalter in konfig.js.

   Dieselbe Datei läuft in beiden Projekten; die Adresse entscheidet.
   Das ist bequem — und genau deshalb muss es festgenagelt sein: wenn
   dieser Schalter je auf der Live-Adresse greift, stellt er den Betrieb
   auf Datenpfade um, die dort nicht existieren. Das Ergebnis wäre eine
   leere App für vierzehn Studios.

   Geprüft wird deshalb vor allem die FALSCH-Richtung: alles, was
   irgendwie nach der echten Adresse aussieht, muss beim Betrieb
   bleiben.

   ── Geändert am 10. August 2026, nach dem Umzug ──
   Vorher stand hier überall zusätzlich `mandant === false` als Merkmal
   des Betriebs. Seit dem Umzug ist mandant AUCH im Betrieb true, und
   die Prüfungen wurden rot.

   Wichtig ist, WAS ich daraufhin geändert habe: nicht das Ergebnis,
   sondern die Behauptung. `mandant` war ohnehin nur ein schwacher
   Stellvertreter. Woran wirklich alles hängt, ist die `projectId` —
   sie entscheidet, WELCHE Datenbank die App anfasst. Genau die wird
   weiter in jeder Richtung geprüft, und der gefährliche Fall
   („?probe=1 auf der Betriebsadresse") ebenfalls.

   Beim Umschreiben hatte hier zuerst gestanden: „dass der Schalter im
   Betrieb an ist, sichert test-firma-link.js ab." Das war falsch — der
   setzt mandant in seinem eigenen Aufbau auf true und sieht die
   ausgelieferte Datei nie an. Die Prüfung hätte also niemand gemacht.
   Sie steht jetzt unten als eigener Abschnitt.                        */
const path = require('path');
const KONFIG_DATEI = path.join(__dirname, '..', 'konfig.js');

function laden(hostname, suche) {
  // Jedes Mal frisch: konfig.js liest location beim Laden aus.
  delete require.cache[require.resolve(KONFIG_DATEI)];
  const raum = { location: { hostname: hostname, search: suche || '' } };
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
  pruefe(h, k.firebase.projectId === 'formenchat' && !!k.vapidKey,
    'projectId=' + k.firebase.projectId + ' vapidKey=' + (k.vapidKey ? 'da' : 'LEER'));
}

// ══ Die Probe ist die Probe ══
console.log('\n── Adressen, die zum PROBELAUF gehören ──');
for (const h of ['formenchat-probe.web.app', 'formenchat-probe.firebaseapp.com']) {
  const k = laden(h);
  pruefe(h, k.firebase.projectId === 'formenchat-probe' && !k.vapidKey
    && k.firma === 'koerperformen',
    'projectId=' + k.firebase.projectId + ' vapidKey=' + (k.vapidKey ? 'DA' : 'leer'));
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
    raum.KONFIG.firebase.projectId === 'formenchat' && !!raum.KONFIG.vapidKey);
}

// ══ Der Zusatz ?probe=1 ══
console.log('\n── ?probe=1 ──');
{
  const a = laden('8080-cs-1-2-3.cloudshell.dev', '?probe=1');
  pruefe('greift auf einer fremden Adresse (Cloud Shell, localhost)',
    a.firebase.projectId === 'formenchat-probe' && !a.vapidKey);

  const b = laden('formenchat.web.app', '?probe=1');
  pruefe('wird auf der BETRIEBS-Adresse ignoriert',
    b.firebase.projectId === 'formenchat' && !!b.vapidKey,
    'projectId=' + b.firebase.projectId + ' vapidKey=' + (b.vapidKey ? 'da' : 'LEER'));

  const c = laden('formenchat.firebaseapp.com', '?x=1&probe=1&y=2');
  pruefe('auch mitten in anderen Parametern ignoriert',
    c.firebase.projectId === 'formenchat' && !!c.vapidKey);

  const d = laden('localhost', '?probe=11');
  pruefe('probe=11 ist nicht probe=1', d.firebase.projectId === 'formenchat',
    'projectId=' + d.firebase.projectId);

  const e = laden('localhost', '');
  pruefe('ohne Zusatz bleibt localhost beim Betrieb',
    e.firebase.projectId === 'formenchat');
}

/* ══ Der Firmen-Schalter selbst ══
   Seit dem Umzug am 10.8.2026 liegen die Daten unter firmen/koerperformen/…
   Stünde mandant wieder auf false, läse die App die FLACHEN Daten — die
   gibt es noch, sie stehen aber seit dem Umzug still. Kein Fehler, keine
   leere App: eine App mit dem Stand von damals. Das ist die Sorte
   Ausfall, die tagelang niemandem auffällt.

   Wenn dieser Abschnitt jemals rot wird, ist das entweder ein Versehen
   oder ein bewusster Rückweg. In beiden Fällen soll es jemand SEHEN und
   die Zeile hier von Hand ändern — nicht stillschweigend passieren. */
console.log('\n── Der Firmen-Schalter im Betrieb ──');
{
  for (const h of ['formenchat.web.app', 'formenchat.firebaseapp.com']) {
    const k = laden(h);
    pruefe(h + ': mandant ist an (Umzug ist gelaufen)', k.mandant === true,
      'mandant=' + k.mandant + ' — flache Daten stehen seit dem 10.8. still');
  }
  const k = laden('formenchat.web.app');
  pruefe('Firmenkennung gesetzt', k.firma === 'koerperformen', 'firma=' + k.firma);
}

console.log(errs.length
  ? '\n✗ ' + errs.length + ' Fehler — der Schalter greift an der falschen Stelle'
  : '\n✓ Probe-Schalter: greift nur auf der Probe-Adresse, sonst nie');
process.exit(errs.length ? 1 : 0);
