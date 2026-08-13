/* ── Der Probelauf-Schalter in konfig.js ──────────────────────────────
   Dieselbe Datei läuft in beiden Projekten; die Adresse entscheidet.
   Greift dieser Schalter je auf der Live-Adresse, stellt er den Betrieb
   auf Datenpfade um, die dort nicht existieren — eine leere App für
   vierzehn Studios.

   Geprüft wird deshalb vor allem die Falsch-Richtung: alles, was
   irgendwie nach der echten Adresse aussieht, muss beim Betrieb
   bleiben. Entscheidend ist die projectId — sie bestimmt, welche
   Datenbank die App anfasst. Der gefährliche Fall „?probe=1 auf der
   Betriebsadresse" hat einen eigenen Abschnitt.
   ───────────────────────────────────────────────────────────────────── */
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
  pruefe('keine echte Google-Tabelle', k.sheetsAbgleich === false);
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
   Die Daten liegen unter firmen/koerperformen/… Stünde mandant wieder auf
   false, läse die App die FLACHEN Daten — die gibt es noch, sie stehen
   aber seit dem Umzug still. Kein Fehler, keine leere App: eine App mit
   dem Stand von damals. Das ist die Sorte Ausfall, die tagelang
   niemandem auffällt.

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

/* ══ Der Schalter muss jede ausgelieferte Seite erreichen ══
   marketing.html und wachstum.html trugen die Zugangsdaten fest im
   Quelltext. Auf der Probe-Adresse arbeiteten sie damit in der ECHTEN
   Datenbank — der Schalter oben lief ins Leere, weil ihn dort niemand
   las. Ein Probelauf, der in den Betrieb schreibt, ist schlimmer als
   keiner, und man sieht es der Seite nicht an. */
console.log('\n── Jede Seite holt die Zugangsdaten aus konfig.js ──');
{
  const fs = require('fs');
  /* marketing.html und wachstum.html sind am 13.8. stillgelegt worden
     und werden nicht mehr ausgeliefert — was in ihnen steht, erreicht
     keinen Browser mehr. Sie stehen unten in der Sperr-Prüfung. */
  const SEITEN = ['index.html'];
  SEITEN.forEach((datei) => {
    const roh = fs.readFileSync(path.join(__dirname, '..', datei), 'utf8');
    pruefe(datei + ': lädt konfig.js',
      /<script src="konfig\.js"><\/script>/.test(roh));
    /* Eine projectId im Quelltext heisst: diese Seite entscheidet selbst,
       welche Datenbank sie anfasst. Genau das darf keine tun. */
    const fest = roh.match(/projectId\s*:\s*["'][^"']+["']/g) || [];
    pruefe(datei + ': keine projectId fest im Quelltext', fest.length === 0,
      fest.join(' '));
    pruefe(datei + ': benutzt KONFIG.firebase',
      /KONFIG\.firebase/.test(roh));
  });

  /* werbung.html ist die öffentliche Seite ohne Firebase — die darf und
     soll gar nichts davon haben. Gegenprobe, damit die Liste oben nicht
     stillschweigend zur Liste aller HTML-Dateien wird. */
  const werbung = fs.readFileSync(path.join(__dirname, '..', 'werbung.html'), 'utf8');
  pruefe('GEGENPROBE werbung.html braucht kein Firebase',
    !/firebase/i.test(werbung));
}

/* ══ Die stillgelegten Seiten bleiben stillgelegt ══
   Sie liegen weiter im Repo — mit Absicht, damit man sie auf Ansage
   zurückholen kann. Ausgeliefert werden sie nicht, und ihre Sammlungen
   stehen in den Regeln auf false. Beides gehört geprüft: eine
   ignore-Zeile ist schnell versehentlich entfernt. */
console.log('\n── marketing.html und wachstum.html sind stillgelegt ──');
{
  const fs = require('fs');
  const fb = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'firebase.json'), 'utf8'));
  const ignoriert = fb.hosting.ignore || [];
  ['marketing.html', 'wachstum.html'].forEach((datei) => {
    pruefe(datei + ': wird nicht ausgeliefert', ignoriert.indexOf(datei) >= 0,
      'steht nicht in hosting.ignore — dann ist die Seite wieder im Netz');
    pruefe(datei + ': liegt weiterhin im Repo',
      fs.existsSync(path.join(__dirname, '..', datei)),
      'geloescht statt stillgelegt — zurueckholen geht dann nur ueber den Verlauf');
  });

  const regeln = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  ['mkProjects', 'appointments', 'emailTemplates', 'studioMetrics',
   'competitors', 'expansionLeads'].forEach((sammlung) => {
    /* Beide Bloecke, flach und je Firma. Der flache ist der wichtigere:
       dort fragten die Regeln nur istAktiv(), nicht nach der Firma. */
    const treffer = regeln.split('\n')
      .map((z, i) => ({ z, i }))
      .filter(x => x.z.indexOf('match /' + sammlung + '/') >= 0);
    const offen = treffer.filter(x => {
      const block = regeln.split('\n').slice(x.i, x.i + 4).join(' ');
      return block.indexOf('if false') < 0;
    });
    pruefe(sammlung + ': in beiden Bloecken gesperrt',
      treffer.length >= 2 && offen.length === 0,
      treffer.length + ' Stelle(n), davon ' + offen.length + ' offen');
  });

  /* Gegenprobe: die Sperre gilt diesen Sammlungen, nicht allen. */
  pruefe('GEGENPROBE die App selbst ist nicht mitgesperrt',
    /match \/todos\/\{[^}]+\} \{[\s\S]{0,200}?allow read/.test(regeln) ||
    regeln.indexOf("match /studios/{studioKey}/todos/{todoId}") >= 0);
}

console.log(errs.length
  ? '\n✗ ' + errs.length + ' Fehler — der Schalter greift an der falschen Stelle'
  : '\n✓ Probe-Schalter: greift nur auf der Probe-Adresse, sonst nie');
process.exit(errs.length ? 1 : 0);
