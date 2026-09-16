/* ══════════════════════════════════════════════════════════════════════
   DIE ABO-LEITER

   Der Teil des Abo-Modells, bei dem ein Fehler unmittelbar Geld und
   Kunden kostet: wer zu frueh gesperrt wird, kuendigt; wer nie gesperrt
   wird, zahlt nicht. Beides faellt in der Oberflaeche nicht auf.

   Geprueft wird die RECHNUNG, nicht die Datenbank — aboStufeNachTagen
   und aboNeuRechnen sind absichtlich reine Funktionen. Deshalb braucht
   dieser Durchlauf keinen Emulator und laeuft in Millisekunden.

   Jede Zusicherung hier hat eine Gegenprobe oder einen Nachbarwert:
   "nach 21 Tagen nurlesen" allein waere auch dann gruen, wenn die
   Funktion IMMER nurlesen zurueckgaebe.
   ══════════════════════════════════════════════════════════════════ */
const { __intern } = require('../functions/index.js');
const { aboZugriff, aboStufeNachTagen, aboNeuRechnen, ABO_STATUS, LEITERN } = __intern;

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
const TAG = 86400000;
const T0 = Date.UTC(2026, 0, 1);
const nachTagen = (n) => T0 + n * TAG;

console.log('\n── Was ein Zustand erlaubt ──');
/* Die wichtigste Zeile im ganzen Durchlauf: kein Eintrag heisst voller
   Zugriff. Waere das falsch, ginge die App fuer jeden Betrieb zu, bei
   dem noch nichts eingetragen ist — und das ist heute jeder. */
pruefe('kein Abo-Eintrag = voller Zugriff', aboZugriff(undefined) === 'voll',
  'sonst sperrt ein leeres Feld den Betrieb aus');
pruefe('leerer Zustand = voller Zugriff', aboZugriff('') === 'voll');
pruefe('unbekannter Zustand = voller Zugriff', aboZugriff('irgendwas') === 'voll',
  'ein Tippfehler im Zustand darf niemanden aussperren');

['gratis', 'test', 'aktiv', 'gekuendigt', 'faellig', 'mahnung1', 'mahnung2']
  .forEach(s => pruefe(s + ' = voller Zugriff', aboZugriff(s) === 'voll'));
pruefe('nurlesen = nurlesen', aboZugriff('nurlesen') === 'nurlesen');
pruefe('zu = zu', aboZugriff('zu') === 'zu');

/* GEGENPROBE: haette jemand die Aufzaehlung zu weit gefasst, waere
   oben alles gruen. Also muss mindestens ein Zustand NICHT voll sein. */
pruefe('GEGENPROBE es gibt überhaupt eine Sperre',
  ABO_STATUS.some(s => aboZugriff(s) !== 'voll'),
  'wenn jeder Zustand vollen Zugriff gibt, prüft dieser Durchlauf nichts');

console.log('\n── Die lange Leiter: wer schon gezahlt hat ──');
/* Aus docs/ABO-PLAN.md, Abschnitt 3: drei Wochen, in denen das Team
   GAR NICHTS merkt. Geprueft wird jede Stufe an ihrem ersten Tag UND
   am Tag davor — sonst wuerde eine Leiter, die einen Tag zu frueh
   schaltet, nicht auffallen. */
const lang = (t) => aboStufeNachTagen(T0, 'lang', nachTagen(t));
[
  [0, 'faellig'], [6, 'faellig'],
  [7, 'mahnung1'], [13, 'mahnung1'],
  [14, 'mahnung2'], [20, 'mahnung2'],
  [21, 'nurlesen'], [34, 'nurlesen'],
  [35, 'zu'], [400, 'zu'],
].forEach(([t, soll]) => pruefe('Tag ' + t + ' → ' + soll, lang(t) === soll,
  'ist: ' + lang(t)));

pruefe('das Team merkt drei Wochen lang nichts',
  [0, 7, 14, 20].every(t => aboZugriff(lang(t)) === 'voll'),
  'genau das ist die Entscheidung aus Abschnitt 3 des Plans');
pruefe('ab Tag 21 ist Schluss mit Ändern', aboZugriff(lang(21)) === 'nurlesen');
pruefe('ab Tag 35 ist zu', aboZugriff(lang(35)) === 'zu');

console.log('\n── Die kurze Leiter: abgelaufene Testphase, Kündigung ──');
const kurz = (t) => aboStufeNachTagen(T0, 'kurz', nachTagen(t));
[[0, 'nurlesen'], [13, 'nurlesen'], [14, 'zu'], [99, 'zu']]
  .forEach(([t, soll]) => pruefe('Tag ' + t + ' → ' + soll, kurz(t) === soll,
    'ist: ' + kurz(t)));

/* DER UNTERSCHIED IST DER PUNKT. Waeren beide Leitern gleich, waere
   eine Kuendigung fuenf Wochen Vollzugriff — guenstiger als das Abo.
   Genau dieser Fehler steckte in der ersten Fassung, die die Leiter
   aus "hat je gezahlt" erraten hat. */
pruefe('die kurze Leiter sperrt früher als die lange',
  aboZugriff(kurz(0)) !== 'voll' && aboZugriff(lang(0)) === 'voll',
  'sonst ist die Testphase in Wahrheit doppelt so lang');
pruefe('nach einer Kündigung gibt es keine fünf Wochen Vollzugriff',
  aboZugriff(kurz(1)) !== 'voll');

console.log('\n── Was die Uhr anfasst und was nicht ──');
const jetzt = nachTagen(100);

pruefe('kein Eintrag: nichts zu tun', aboNeuRechnen(null, jetzt) === null);
pruefe('gratis wird NIE angefasst',
  aboNeuRechnen({ status: 'gratis', bisAm: T0, offenSeit: T0, leiter: 'lang' }, jetzt) === null,
  'darauf steht der Bestandsschutz für Körperformen');
pruefe('von Hand gesetzt wird NIE überschrieben',
  aboNeuRechnen({ status: 'faellig', offenSeit: T0, leiter: 'lang', vonHand: true }, jetzt) === null,
  'sonst überschreibt die Uhr eine Kulanzfrist');
pruefe('aktiv ohne Rückstand: nichts zu tun',
  aboNeuRechnen({ status: 'aktiv', bisAm: nachTagen(300) }, jetzt) === null);

/* GEGENPROBE zu den drei Zeilen oben: derselbe Eintrag OHNE den
   Schutz muss sehr wohl etwas ergeben. Sonst wuerde eine kaputte
   Funktion, die immer null liefert, hier als gruen durchgehen. */
const ohneSchutz = aboNeuRechnen({ status: 'faellig', offenSeit: T0, leiter: 'lang' }, jetzt);
pruefe('GEGENPROBE ohne vonHand rechnet die Uhr sehr wohl',
  ohneSchutz && ohneSchutz.status === 'zu',
  'sonst prüfen die drei Zeilen darüber nichts');

console.log('\n── Abgelaufene Testphase ──');
/* Die Uhr rechnet ab dem ABLAUFDATUM, nicht ab heute. Ein Lauf, der
   ein paar Tage aussetzt, darf die Tage nicht verschenken. */
const test20 = aboNeuRechnen({ status: 'test', bisAm: T0 }, nachTagen(20));
pruefe('Testphase 20 Tage abgelaufen → zu (kurze Leiter)',
  test20 && test20.status === 'zu', 'ist: ' + JSON.stringify(test20));
pruefe('die Uhr rechnet ab dem Ablaufdatum, nicht ab heute',
  test20 && test20.offenSeit === T0,
  'sonst verschenkt ein ausgefallener Lauf genau diese Tage');
pruefe('die Testphase bekommt die kurze Leiter',
  test20 && test20.leiter === 'kurz');

const test5 = aboNeuRechnen({ status: 'test', bisAm: T0 }, nachTagen(5));
pruefe('Testphase 5 Tage abgelaufen → nurlesen, noch nicht zu',
  test5 && test5.status === 'nurlesen', 'ist: ' + JSON.stringify(test5));
pruefe('laufende Testphase wird nicht angefasst',
  aboNeuRechnen({ status: 'test', bisAm: nachTagen(200) }, jetzt) === null,
  'wer noch in der Testphase ist, darf nichts merken');

console.log('\n── Gekündigt: läuft bis bisAm, dann kurze Leiter ──');
pruefe('gekündigt, Laufzeit noch offen: nichts zu tun',
  aboNeuRechnen({ status: 'gekuendigt', bisAm: nachTagen(200) }, jetzt) === null,
  'bezahlt ist bezahlt, auch nach der Kündigung');
const gek = aboNeuRechnen({ status: 'gekuendigt', bisAm: T0 }, nachTagen(3));
pruefe('gekündigt und Laufzeit vorbei → nurlesen',
  gek && gek.status === 'nurlesen' && gek.leiter === 'kurz',
  'ist: ' + JSON.stringify(gek));

console.log('\n── Die Leitern sind absteigend sortiert ──');
/* aboStufeNachTagen laeuft die Leiter von oben durch und nimmt den
   ersten Treffer. Waere eine Leiter falsch sortiert, lieferte sie
   immer die erste Stufe — und die Pruefungen oben waeren Zufall. */
Object.keys(LEITERN).forEach(name => {
  const tage = LEITERN[name].map(s => s.tag);
  const sortiert = tage.every((t, i) => i === 0 || tage[i - 1] > t);
  pruefe('Leiter "' + name + '" ist absteigend sortiert', sortiert,
    'sonst greift immer die erste Stufe: ' + tage.join(', '));
  pruefe('Leiter "' + name + '" endet bei Tag 0',
    tage[tage.length - 1] === 0, 'sonst gibt es einen Tag ohne Zustand');
});

console.log('\n' + (schlecht ? '✗ ' + schlecht + ' Fehler, ' : '✓ alles grün, ') +
  gut + ' Zusicherungen');
process.exit(schlecht ? 1 : 0);
