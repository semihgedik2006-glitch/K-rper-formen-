/* ── Die PIN-Rechnerei ────────────────────────────────────────────────

   Kein Browser, keine Datenbank — hier wird nur gerechnet. Genau
   deshalb lässt sich hier prüfen, was man sonst nur glaubt.

   Geprüft wird:
     1. Zu einfache PINs werden abgelehnt. 1234 ist die häufigste PIN
        der Welt; sie zuzulassen hiesse, die Absicherung abzuschaffen
        und das Kästchen trotzdem zu zeichnen.
     2. DAS SALZ WIRD WIRKLICH BENUTZT. Dieselbe PIN mit zwei Salzen
        muss zwei verschiedene Hashes ergeben. Ohne das wäre eine
        Tabelle mit zehntausend Einträgen genug, um jede PIN im Betrieb
        aufzulösen — und sie passt auf einen USB-Stick.
     3. Der Hash enthält die PIN nicht. Klingt selbstverständlich, ist
        aber der Fehler, den man macht, wenn man „Hash" schreibt und
        Base64 meint.
     4. Verglichen wird zeitgleich. Geprüft am Quelltext, weil sich das
        an der Rechnung selbst nicht zeigt.
     5. Das Prüfen ist KEIN Endpunkt. Wäre pinPruefen von aussen
        aufrufbar, hätte man ein Orakel, an dem sich vier Ziffern in
        Minuten durchprobieren lassen.

   NICHT GEPRÜFT: wie lange scrypt wirklich braucht. Das hängt an der
   Maschine, und eine Zahl von hier wäre für die Cloud Function nichts
   wert.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');

const DATEI = path.join(__dirname, '..', 'functions', 'index.js');
const quelle = fs.readFileSync(DATEI, 'utf8');

const errs = [];
function pruefe(name, ok, warum) {
  console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : '  — ' + warum));
  if (!ok) errs.push(name + ' — ' + warum);
}

/* Die beiden Funktionen aus der Quelle holen, ohne firebase-admin zu
   laden: index.js verbindet sich beim Laden mit der Datenbank, und das
   geht hier nicht. Ausgeschnitten statt nachgebaut — ein Nachbau würde
   prüfen, was ich hier hinschreibe, nicht was ausgeliefert wird. */
function schneide(name) {
  const i = quelle.indexOf('function ' + name + '(');
  if (i < 0) return null;
  let tiefe = 0, start = quelle.indexOf('{', i);
  for (let j = start; j < quelle.length; j++) {
    if (quelle[j] === '{') tiefe++;
    else if (quelle[j] === '}') { tiefe--; if (!tiefe) return quelle.slice(i, j + 1); }
  }
  return null;
}

const txtSchwach = schneide('pinZuSchwach');
const txtHash = schneide('pinHashen');
pruefe('pinZuSchwach gibt es', !!txtSchwach, 'ohne sie ist der Rest gegenstandslos');
pruefe('pinHashen gibt es', !!txtHash, 'ohne sie ist der Rest gegenstandslos');
if (!txtSchwach || !txtHash) { console.log('\n✗ Abbruch'); process.exit(1); }

const pinZuSchwach = new Function('return (' + txtSchwach + ')')();
const pinHashen = new Function('require', 'return (' + txtHash + ')')(require);

/* ── 1. Zu einfache PINs ── */
console.log('\n── Was abgelehnt werden muss ──');
[['0000', 'alle gleich'], ['1111', 'alle gleich'], ['9999', 'alle gleich'],
 ['1234', 'aufsteigend'], ['4321', 'absteigend'], ['123456', 'aufsteigend lang'],
 ['654321', 'absteigend lang'], ['3456', 'aufsteigend versetzt']]
  .forEach(([pin, warum]) => {
    pruefe('„' + pin + '" wird abgelehnt (' + warum + ')', !!pinZuSchwach(pin),
      'das ist eine der ersten PINs, die jemand probiert');
  });

console.log('\n── Was durchgehen muss ──');
['2946', '8351', '1357', '2468', '4071', '739204'].forEach(pin => {
  pruefe('„' + pin + '" geht durch', !pinZuSchwach(pin),
    'eine Regel, die zu viel ablehnt, treibt die Leute zu 1234 zurueck');
});

/* GEGENPROBE zur Prüfung selbst: fände sie gar nichts zu schwach, wären
   die Zeilen darüber auch grün. */
const abgelehnt = ['0000', '1234', '4321', '1111'].filter(p => pinZuSchwach(p)).length;
pruefe('GEGENPROBE die Prüfung lehnt überhaupt etwas ab', abgelehnt === 4,
  'sie hat ' + abgelehnt + ' von vier erkannt');

/* ── 2 + 3. Das Salz ── */
console.log('\n── Das Salz ──');
const a1 = pinHashen('2946', 'salzEins');
const a2 = pinHashen('2946', 'salzEins');
const b1 = pinHashen('2946', 'salzZwei');
const c1 = pinHashen('8351', 'salzEins');

pruefe('Gleiche PIN und gleiches Salz ergeben denselben Hash', a1 === a2,
  'sonst liesse sich nie etwas pruefen');
pruefe('DASSELBE PASSWORT MIT ANDEREM SALZ ergibt einen anderen Hash', a1 !== b1,
  'ohne wirksames Salz reicht eine Tabelle mit zehntausend Eintraegen fuer den ganzen Betrieb');
pruefe('Andere PIN, gleiches Salz ergibt einen anderen Hash', a1 !== c1,
  'sonst waere es kein Hash, sondern eine Verkleidung des Salzes');
pruefe('Der Hash enthält die PIN nicht im Klartext', a1.indexOf('2946') < 0,
  'das ist der Fehler, den man macht, wenn man Base64 fuer einen Hash haelt');
pruefe('Der Hash ist lang genug (32 Byte)', a1.length === 64,
  'gemessen ' + a1.length + ' Zeichen Hex');
pruefe('Der Hash ist reines Hex', /^[0-9a-f]+$/.test(a1), 'unerwartete Form: ' + a1.slice(0, 20));

/* ── 4 + 5. Am Quelltext ── */
console.log('\n── Am Quelltext ──');
pruefe('Gehasht wird mit scrypt', /scryptSync\s*\(/.test(txtHash),
  'ein schneller Hash (sha256, md5) macht zehntausend Moeglichkeiten wertlos billig');

const txtPruefen = schneide('pinPruefen') || '';
pruefe('pinPruefen vergleicht über tokenGleich',
  /tokenGleich\s*\(/.test(txtPruefen),
  'ein === waere ein Zeitleck: die Antwortdauer verriete, wie viele Ziffern stimmen');
pruefe('pinPruefen ist KEIN Endpunkt',
  quelle.indexOf('exports.pinPruefen') < 0,
  'von aussen aufrufbar waere sie ein Orakel fuer vier Ziffern');
pruefe('pinSetzen verlangt bei bestehender PIN die alte',
  /Bitte zuerst die bisherige PIN/.test(quelle),
  'sonst ueberschreibt ein kurz offen liegendes Handy die PIN und stempelt danach fuer die Person');
pruefe('Die PIN selbst wird nirgends gespeichert',
  !/\bpin\s*:\s*(neu|String\(\s*pin)/.test(quelle),
  'gespeichert gehoert der Hash, nie der Wert');
pruefe('pinStatus gibt weder Hash noch Salz zurück',
  !/return\s*\{[^}]*\b(hash|salz)\b/.test(schneide('') || '') &&
  /return \{ gesetzt: snap\.exists, seit:/.test(quelle),
  'eine Auskunft, die die Laenge verraet, nimmt dem Angreifer Arbeit ab');

/* ── Die Reihenfolge beim Stempeln ── */
console.log('\n── Was ist als Nächstes dran ──');
const txtSchritt = schneide('naechsterSchritt');
pruefe('naechsterSchritt gibt es', !!txtSchritt, 'ohne sie stempelt niemand');
if (txtSchritt) {
  const naechsterSchritt = new Function('return (' + txtSchritt + ')')();
  [[null, 'kommen', 'wer noch nichts getan hat, kommt'],
   ['gehen', 'kommen', 'nach Feierabend faengt ein neuer Durchgang an'],
   ['kommen', 'pause', 'wer da ist, macht als Naechstes Pause'],
   ['pause', 'zurueck', 'aus der Pause kommt man zurueck'],
   ['zurueck', 'pause', 'und kann wieder Pause machen']]
    .forEach(([vorher, erwartet, warum]) => {
      const ist = naechsterSchritt(vorher);
      pruefe('nach „' + (vorher || '—') + '" kommt „' + erwartet + '"', ist === erwartet,
        warum + ' — geliefert wurde „' + ist + '"');
    });
  /* Es gibt kein „gehen" als naechsten Schritt aus der Reihe heraus:
     Feierabend ist derselbe Knopf wie Pause, nur anders getippt. Das
     entscheidet die Oberflaeche, nicht diese Funktion — festgehalten,
     damit es niemand fuer eine Luecke haelt. */
  pruefe('Ein unbekannter Wert führt nicht ins Leere',
    naechsterSchritt('quatsch') === 'kommen',
    'ein kaputter Datensatz darf das Terminal nicht blockieren');
}

/* ── Die Bremse gegen Durchprobieren ── */
console.log('\n── Die Bremse ──');
pruefe('Es gibt eine Obergrenze für Fehlversuche',
  /PIN_MAX_FEHLER\s*=\s*\d+/.test(quelle),
  'ohne sie ist das Terminal ein Automat fuer zehntausend Moeglichkeiten');
pruefe('Sie ist klein genug (höchstens 10)',
  (+(/PIN_MAX_FEHLER\s*=\s*(\d+)/.exec(quelle) || [])[1] || 99) <= 10,
  'gemessen ' + (/PIN_MAX_FEHLER\s*=\s*(\d+)/.exec(quelle) || [])[1]);
pruefe('Gesperrt wird die PERSON, nicht das Gerät',
  /zeitPins.*\n?[\s\S]{0,400}?gesperrtBis/.test(quelle) &&
  !/terminals[\s\S]{0,200}gesperrtBis/.test(quelle),
  'sonst legt ein Scherzkeks mit fuenf Fehlversuchen das ganze Studio lahm');
pruefe('Ein richtiger Versuch setzt den Zähler zurück',
  /fehlversuche:\s*0/.test(quelle),
  'sonst summieren sich Vertipper ueber Wochen zu einer Sperre');

/* ── Was das Stempeln alles prüft ── */
console.log('\n── Drei Schlüssel, nicht einer ──');
const txtStempeln = (() => {
  const i = quelle.indexOf('exports.stempeln');
  const j = quelle.indexOf('\n});', i);
  return i < 0 ? '' : quelle.slice(i, j < 0 ? quelle.length : j + 4);
})();
pruefe('stempeln gibt es', !!txtStempeln, 'ohne sie ist der Rest gegenstandslos');
pruefe('1. ein angemeldetes Konto', /anruferProfil\s*\(\s*context\s*\)/.test(txtStempeln),
  'ohne Anmeldung waere es eine offene Adresse im Internet');
pruefe('2. das Geheimnis DIESES Terminals',
  /tokenGleich\s*\(\s*geheimHashen/.test(txtStempeln),
  'ohne Geraetepruefung stempelt man von zu Hause');
pruefe('3. die PIN der Person',
  /tokenGleich\s*\(\s*pinHashen/.test(txtStempeln),
  'ohne PIN stempelt einer fuer alle');
pruefe('Die Person muss zu DIESEM Studio gehören',
  /studioKeys[\s\S]{0,80}term\.studioKey/.test(txtStempeln),
  'sonst erzeugt ein Terminal in Huerth Stempel fuer jemanden in Porz');
pruefe('Die Person muss zu DIESEM Betrieb gehören',
  /seine\s*!==\s*meine/.test(txtStempeln),
  'sonst stempelt ein fremder Betrieb in unsere Aufzeichnung');
pruefe('Ein gesperrter Zugang stempelt nicht',
  /aktiv\s*===\s*false/.test(txtStempeln),
  'wer nicht mehr da ist, steht auch nicht mehr im Studio');

/* GEGENPROBE zu diesem Abschnitt: fände er die Prüfungen auch in einem
   Text ohne sie, wäre er wertlos. */
pruefe('GEGENPROBE die Suche findet nichts in leerem Text',
  !/tokenGleich\s*\(\s*geheimHashen/.test('exports.stempeln = () => {};'),
  'die Suchmuster treffen zu leicht');

console.log('\nFehler: ' + (errs.length ? '' : 'keine'));
errs.forEach(e => console.log('  ' + e));
process.exit(errs.length ? 1 : 0);
