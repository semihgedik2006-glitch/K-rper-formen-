/* ── konfig.js: die Datei, die jeder Kunde bearbeitet ─────────────────
   Anzeigename und Firmenkennung dürfen nie denselben Schlüssel tragen:
   in einem Objekt gewinnt der letzte.

     · Wer für einen neuen Kunden den oberen ändert, glaubt den
       Anzeigenamen zu setzen — und ändert nichts.
     · Wer den unteren löscht, macht aus dem Anzeigenamen versehentlich
       die Datenbank-Kennung. Die App liest dann unter
       firmen/Körperformen/ und findet nichts. Keine Meldung, nur eine
       leere App.

   Diese Datei ist die einzige, die bei jedem Kunden von Hand angefasst
   wird — ein stiller Fehler darin trifft den, der am wenigsten
   nachsehen kann. Geprüft wird ohne Browser: Datei lesen und ausführen.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATEI = path.join(__dirname, '..', 'konfig.js');
const quelle = fs.readFileSync(DATEI, 'utf8');
const errs = [];

/* ══ 1. Kein Schlüssel zweimal ══
   Gesucht wird auf der obersten Ebene des KONFIG-Literals: Zeilen der
   Form "  name: …" mit genau vier Leerzeichen Einrückung. Verschachtelte
   Objekte (firebase, recht, probe) rücken tiefer ein und bleiben aussen
   vor — dort ist eine Wiederholung desselben Namens harmlos, weil sie zu
   verschiedenen Objekten gehört. */
{
  const zeilen = quelle.split('\n');
  const gesehen = {};
  const doppelt = [];
  zeilen.forEach((z, i) => {
    const m = /^ {4}([a-zA-Z_$][\w$]*)\s*:/.exec(z);
    if (!m) return;
    const name = m[1];
    if (gesehen[name]) doppelt.push(name + ' (Zeile ' + gesehen[name] + ' und ' + (i + 1) + ')');
    else gesehen[name] = i + 1;
  });
  console.log('Schlüssel auf oberster Ebene:', Object.keys(gesehen).length);
  if (doppelt.length) {
    errs.push('DOPPELT VERGEBEN: ' + doppelt.join(' · ') +
      ' — in einem Objekt gewinnt der letzte, der erste ist lautlos weg');
  }
}

/* ══ 2. Was am Ende wirklich herauskommt ══
   Nicht die Datei lesen, sondern sie ausführen. Genau das war der Punkt:
   im Quelltext STAND der Anzeigename, im Ergebnis war er nicht da. */
{
  const box = { console: { log() {}, warn() {}, error() {} } };
  box.window = box; box.self = box; box.globalThis = box;
  vm.createContext(box);
  try {
    vm.runInContext(quelle, box, { filename: 'konfig.js' });
  } catch (e) {
    errs.push('KAPUTT: konfig.js lässt sich nicht ausführen — ' + e.message);
  }
  const K = box.KONFIG;
  if (!K) {
    errs.push('FEHLT: konfig.js legt kein KONFIG an');
  } else {
    console.log('firma (Kennung):', JSON.stringify(K.firma));
    console.log('firma_anzeige  :', JSON.stringify(K.firma_anzeige));

    if (!K.firma) errs.push('FEHLT: die Firmenkennung (KONFIG.firma)');
    if (!K.firma_anzeige) {
      errs.push('FEHLT: der Anzeigename (KONFIG.firma_anzeige) — dann steht ' +
                'auf Ausdrucken die Datenbank-Kennung statt des Firmennamens');
    }
    /* Die Kennung steht in Datenbankpfaden UND im Anmeldelink. Umlaute
       und Grossbuchstaben gehören dort nicht hin — genau so sähe sie
       aus, wenn jemand versehentlich den Anzeigenamen einträgt. */
    if (K.firma && !/^[a-z0-9][a-z0-9-]*$/.test(String(K.firma))) {
      errs.push('VERWECHSELT: die Firmenkennung „' + K.firma + '" sieht aus wie ein ' +
                'Anzeigename. Sie steht in Datenbankpfaden und im Link — erlaubt sind ' +
                'nur Kleinbuchstaben, Ziffern und Bindestriche');
    }
    if (K.firma && K.firma_anzeige && K.firma === K.firma_anzeige) {
      errs.push('VERDÄCHTIG: Kennung und Anzeigename sind identisch — vermutlich ' +
                'wurde nur eines von beidem gepflegt');
    }
    if (!K.appName) errs.push('FEHLT: KONFIG.appName');
  }
}

console.log(errs.length
  ? '\n✗ ' + errs.join('\n✗ ')
  : '\n✓ konfig.js: kein Schlüssel doppelt, Kennung und Anzeigename getrennt und beide da');
process.exit(errs.length ? 1 : 0);
