/* ══════════════════════════════════════════════════════════════════════
   DIE FELDER, DIE STRIPE VERSCHOBEN HAT

   Am 17.9. gefunden, einen Tag nach der Auslieferung. Der Haken las
   drei Felder, die es in der aktuellen API-Version nicht mehr gibt:

     invoice.subscription            → invoice.parent.subscription_details.subscription
     subscription.current_period_end → subscription.items.data[0].current_period_end

   Weggefallen mit 2025-03-31 („basil"), nachgeprueft im CHANGELOG der
   installierten Bibliothek — nicht aus dem Gedaechtnis.

   WARUM EINE VERSIONSANGABE IM CODE DAS NICHT LOEST, und das ist der
   Kern: die Form der ZUGESTELLTEN Ereignisse bestimmt der
   Webhook-Endpunkt im Dashboard, nicht der Client. Wer den Endpunkt
   heute anlegt, bekommt die neue Form, egal was im Code steht.

   UND WARUM ES OHNE DIESEN DURCHLAUF NIEMAND GEMERKT HAETTE: nichts
   davon wirft einen Fehler. Die Firma wird ueber den Kunden trotzdem
   gefunden, der Zustand steht auf „laeuft" — nur `bisAm` bleibt leer
   und die Abo-Kennung fehlt. In der App staende dann ein laufendes Abo
   ohne Datum, und die Kuendigung ueber das Portal fiele auf die Uhr
   zurueck. Ein Fehler, den man erst sieht, wenn ein Kunde anruft.

   Geprueft wird deshalb BEIDE Formen, jede einzeln, mit Gegenprobe.
   ══════════════════════════════════════════════════════════════════ */
const { __intern } = require('../functions/index.js');
const { kennungVon, aboIdAusRechnung, periodeAusRechnung, periodeAusAbo } = __intern;

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

const SEK = 1789000000;            // irgendein Zeitstempel in Sekunden
const MS = SEK * 1000;

console.log('\n── Kennung oder ganzes Objekt ──');
/* Stripe liefert Verweise mal als Zeichenkette, mal als erweitertes
   Objekt. Wer das nicht abfaengt, schreibt "[object Object]" in ein
   Feld, in dem eine Kennung stehen soll. */
pruefe('Zeichenkette bleibt Zeichenkette', kennungVon('sub_123') === 'sub_123');
pruefe('erweitertes Objekt wird zur Kennung',
  kennungVon({ id: 'sub_123', object: 'subscription' }) === 'sub_123');
pruefe('null bleibt null', kennungVon(null) === null);
pruefe('undefined wird null', kennungVon(undefined) === null);
pruefe('Objekt ohne id wird null', kennungVon({ object: 'subscription' }) === null);

console.log('\n── Abo-Kennung aus einer Rechnung ──');
/* ALTE Form, bis 2025-03-31 */
pruefe('ALT: invoice.subscription',
  aboIdAusRechnung({ subscription: 'sub_alt' }) === 'sub_alt');
/* NEUE Form, ab basil */
pruefe('NEU: invoice.parent.subscription_details.subscription',
  aboIdAusRechnung({
    parent: { type: 'subscription_details',
              subscription_details: { subscription: 'sub_neu' } }
  }) === 'sub_neu',
  'GENAU DIESER FALL war der Fehler vom 16.9.');
pruefe('NEU, erweitert: dort steht das ganze Abo',
  aboIdAusRechnung({
    parent: { subscription_details: { subscription: { id: 'sub_neu', object: 'subscription' } } }
  }) === 'sub_neu');

/* Die neue Form gewinnt, wenn beide dastehen — sie ist die kuenftige. */
pruefe('beide da: die neue Form gewinnt',
  aboIdAusRechnung({
    subscription: 'sub_alt',
    parent: { subscription_details: { subscription: 'sub_neu' } }
  }) === 'sub_neu');

/* Eine Rechnung ohne Abo gibt es wirklich — etwa eine einzelne
   Rechnung, die jemand von Hand in Stripe anlegt. Die darf nicht
   abstuerzen und nicht raten. */
pruefe('Rechnung ohne Abo: null, kein Absturz',
  aboIdAusRechnung({ id: 'in_1', customer: 'cus_1' }) === null);
pruefe('parent ohne subscription_details: null',
  aboIdAusRechnung({ parent: { type: 'quote_details' } }) === null);
pruefe('gar keine Rechnung: null', aboIdAusRechnung(null) === null);

/* GEGENPROBE: gaebe die Funktion IMMER etwas zurueck, waeren die
   Zeilen oben auch bei einer kaputten Fassung gruen. */
pruefe('GEGENPROBE es gibt Faelle mit und ohne Treffer',
  aboIdAusRechnung({ subscription: 'sub_x' }) !== null &&
  aboIdAusRechnung({}) === null);

console.log('\n── Bis wann ist bezahlt: aus der Rechnung ──');
/* Dieses Feld hat Stripe NICHT verschoben — geprueft wird es
   trotzdem, denn das naechste Mal faellt es vielleicht doch weg. */
pruefe('lines.data[0].period.end wird zu Millisekunden',
  periodeAusRechnung({ lines: { data: [{ period: { start: 1, end: SEK } }] } }) === MS);
pruefe('Rechnung ohne Positionen: null',
  periodeAusRechnung({ lines: { data: [] } }) === null);
pruefe('Position ohne Zeitraum: null',
  periodeAusRechnung({ lines: { data: [{}] } }) === null);
pruefe('gar keine Rechnung: null', periodeAusRechnung(null) === null);

console.log('\n── Bis wann läuft das Abo ──');
pruefe('ALT: subscription.current_period_end',
  periodeAusAbo({ current_period_end: SEK }) === MS);
pruefe('NEU: items.data[0].current_period_end',
  periodeAusAbo({ items: { data: [{ current_period_end: SEK }] } }) === MS,
  'GENAU DIESER FALL war der zweite Fehler vom 16.9.');
pruefe('beide da: die neue Form gewinnt',
  periodeAusAbo({
    current_period_end: 1,
    items: { data: [{ current_period_end: SEK }] }
  }) === MS);
pruefe('Abo ohne Zeitraum: null', periodeAusAbo({ id: 'sub_1' }) === null);
pruefe('gar kein Abo: null', periodeAusAbo(null) === null);

console.log('\n── Was das für eine echte Zustellung heißt ──');
/* Eine Nutzlast, wie der Webhook sie HEUTE bekommt — in der Form, die
   ein frisch angelegter Endpunkt liefert. Der Durchlauf haelt damit
   fest, was in der Datenbank landet, nicht nur was eine Hilfsfunktion
   zurueckgibt. */
const rechnungHeute = {
  id: 'in_1', object: 'invoice', customer: 'cus_1', amount_paid: 5900,
  parent: { type: 'subscription_details',
            subscription_details: { subscription: 'sub_1', metadata: { firma: 'test-1a2b' } } },
  lines: { data: [{ period: { start: SEK - 2592000, end: SEK } }] },
};
pruefe('heutige Zustellung: Abo-Kennung gefunden',
  aboIdAusRechnung(rechnungHeute) === 'sub_1');
pruefe('heutige Zustellung: bezahlt bis gefunden',
  periodeAusRechnung(rechnungHeute) === MS,
  'ohne diese Zeile stünde in der App „läuft" ohne Datum');

/* Und dieselbe Rechnung in der alten Form — ein Endpunkt, der auf eine
   aeltere Version eingestellt ist, muss genauso funktionieren. */
const rechnungFrueher = {
  id: 'in_1', object: 'invoice', customer: 'cus_1', amount_paid: 5900,
  subscription: 'sub_1',
  lines: { data: [{ period: { start: SEK - 2592000, end: SEK } }] },
};
pruefe('ältere Zustellung: Abo-Kennung gefunden',
  aboIdAusRechnung(rechnungFrueher) === 'sub_1');
pruefe('ältere Zustellung: bezahlt bis gefunden',
  periodeAusRechnung(rechnungFrueher) === MS);
pruefe('beide Formen ergeben DASSELBE',
  aboIdAusRechnung(rechnungHeute) === aboIdAusRechnung(rechnungFrueher) &&
  periodeAusRechnung(rechnungHeute) === periodeAusRechnung(rechnungFrueher),
  'sonst haengt der Zustand eines Kunden davon ab, wann sein Endpunkt angelegt wurde');

console.log('\n── GEGENPROBE: findet dieser Durchlauf den alten Fehler? ──');
/* Die entscheidende Frage an jeden Durchlauf: wuerde er rot, wenn der
   Fehler noch da waere? Hier steht deshalb die ALTE Fassung nachgebaut
   — Zeile fuer Zeile so, wie sie am 16.9. ausgeliefert wurde — und
   laeuft gegen eine heutige Nutzlast.

   Sie muss versagen. Tut sie es nicht, prueft alles oben nichts. */
const altAboId = (o) => (o && o.subscription) || null;
const altPeriode = (o) => (o && o.current_period_end) ? o.current_period_end * 1000 : null;

pruefe('GEGENPROBE die alte Fassung findet das Abo NICHT mehr',
  altAboId(rechnungHeute) === null && aboIdAusRechnung(rechnungHeute) === 'sub_1',
  'wenn die alte Fassung hier etwas fände, wäre der Fehler nie einer gewesen');
pruefe('GEGENPROBE die alte Fassung findet den Zeitraum NICHT mehr',
  altPeriode({ items: { data: [{ current_period_end: SEK }] } }) === null &&
  periodeAusAbo({ items: { data: [{ current_period_end: SEK }] } }) === MS);
/* Und andersherum: an der ALTEN Nutzlast war die alte Fassung richtig.
   Das gehoert dazu, sonst liest sich der Fund wie ein Anfangsfehler —
   er war keiner, die Form hat sich geaendert. */
pruefe('GEGENPROBE an der alten Nutzlast war die alte Fassung richtig',
  altAboId(rechnungFrueher) === 'sub_1');

console.log('\n── Der Code liest kein weggefallenes Feld mehr ──');
/* Eine Textprüfung, absichtlich grob: sie findet die Rueckfaelle, die
   jemand beim naechsten Mal wieder direkt hinschreibt. */
const fs = require('fs');
const quelle = fs.readFileSync(require.resolve('../functions/index.js'), 'utf8');
/* Nur ausserhalb von Kommentaren und ausserhalb der Hilfsfunktionen,
   die beide Formen absichtlich kennen. */
const ohneKommentare = quelle
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const inHilfe = /function periodeAusAbo[\s\S]*?\n}/.exec(ohneKommentare);
const rest = ohneKommentare.replace(inHilfe ? inHilfe[0] : '', '');
pruefe('kein obj.current_period_end mehr im Haken',
  !/obj\.current_period_end/.test(rest),
  'das Feld gibt es seit 2025-03-31 nicht mehr auf dem Abo');
pruefe('kein obj.subscription mehr beim Rechnungs-Ereignis',
  !/abo:\s*obj\.subscription\b/.test(rest),
  'auf einer Rechnung gibt es das Feld nicht mehr');

console.log('\n' + (schlecht ? '✗ ' + schlecht + ' Fehler, ' : '✓ alles grün, ') +
  gut + ' Zusicherungen');
process.exit(schlecht ? 1 : 0);
