#!/usr/bin/env node
/* Content-Security-Policy für index.html erzeugen.
 *
 *   node tools/csp.js            zeigt die Regel und ob sie noch passt
 *   node tools/csp.js --setzen   schreibt sie in die Datei
 *
 * Warum ein Werkzeug und nicht von Hand:
 * Die Regel erlaubt genau die beiden Skriptblöcke der Datei, jeden über
 * seine Prüfsumme. Ändert jemand ein Zeichen darin, passt die Prüfsumme
 * nicht mehr und der Browser führt den Block nicht mehr aus — die App
 * bleibt weiss. tests/test-csp.js schlägt deshalb an, sobald Regel und
 * Datei auseinanderlaufen; hier steht der Weg zurück.
 *
 * Die Alternative wäre 'unsafe-inline' im script-src. Damit wäre die
 * ganze Regel wertlos: sie soll ja gerade eingeschleusten Code am
 * Ausführen hindern.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WURZEL = path.join(__dirname, '..');
const DATEI = path.join(WURZEL, 'index.html');

/* Jede Seite bekommt genau das, was sie braucht — und sonst nichts.
   Eine gemeinsame Regel waere die Summe aller Ausnahmen und damit die
   schwaechste von allen. */
const SEITEN = {
  'index.html': {
    script: "'self' https://www.gstatic.com",
    /* Der eine fremde Pfad, und zwar genau dieser eine.
       Firestore prueft ueber diese 1×1-Grafik, ob ueberhaupt Netz da ist
       — nachgelesen im SDK:
         tn(e,t){ ... 2==t ? new Xe(i||"//www.google.com/images/cleardot.gif")
                            ... TestLoadImage ... }
       Sie wird NUR bei Fehlercode 2 des Kanals geladen. Blockiert man
       sie, feuert onerror, und Firestore schliesst daraus „kein Netz" —
       nach jeder kurzen Stoerung im Studio-WLAN also faelschlich offline
       und mit traegerem Wiederverbinden.
       CSP vergleicht den Pfad genau (die Anhaengsel ?zx=… zaehlen nicht
       mit): erlaubt ist dieses eine Bild, nicht google.com. */
    img: "'self' data: blob: https://www.google.com/images/cleardot.gif",
    medien: "'self' data: blob:",
    verbinden: "'self' https://*.googleapis.com https://*.cloudfunctions.net " +
      "https://*.firebaseio.com wss://*.firebaseio.com " +
      "https://*.firebasedatabase.app wss://*.firebasedatabase.app",
    worker: "'self'",
    manifest: "'self'",
  },
  /* Die oeffentliche Seite. Kein Firebase, keine Anmeldung, keine
     Datenbank — sie schickt nichts und holt nichts ausser Bildern von
     der Hauptseite. connect-src bleibt deshalb zu. */
  'werbung.html': {
    script: "'self'",
    /* Zwei Bilder von der Firmenseite, und genau diese zwei. Vorher
       stand hier der ganze Host — dann ist jede Adresse dort ein
       erlaubtes Ziel, und die Adresse einer Bildanfrage kann selbst die
       Nachricht sein. Hier ist nichts zu verraten (die Seite kennt
       weder Anmeldung noch Datenbank), aber eine Ausnahme soll so eng
       sein wie ihr Anlass. */
    img: "'self' data: " +
      "https://www.xn--krperformen-rfb.com/wp-content/themes/koerperformen/images/kf-logo.svg " +
      "https://www.xn--krperformen-rfb.com/wp-content/uploads/2020/03/emstesmal_simone.png",
    medien: "'none'",
    verbinden: "'none'",
    worker: "'none'",
    manifest: "'none'",
  },
};

/* Jeder <script>-Block ohne src. Der Inhalt geht Zeichen für Zeichen in
   die Prüfsumme, einschliesslich Zeilenumbrüchen.

   HTML-KOMMENTARE WERDEN VORHER AUSGEBLENDET, und zwar nach einem echten
   Fehler: in index.html stand ein erklärender Kommentar, in dem das Wort
   für ein öffnendes Skript-Tag ausgeschrieben war. Der Ausdruck unten
   kennt keine Kommentare — er hielt das für einen Block, bildete die
   Prüfsumme über den Kommentartext und ließ die des echten Skripts weg.
   Der Browser wies den Block daraufhin ab. Der Fehler war laut (die
   Seite funktionierte nicht), aber die Ursache stand an einer Stelle,
   an der niemand sucht.

   Gelesen wird von links nach rechts, genau wie ein Browser es tut: wer
   an einem Kommentaranfang steht, springt zum Kommentarende; wer an
   einem Skriptanfang steht, springt zu dessen Ende. Damit kann weder ein
   Kommentar im Skript noch ein Skript im Kommentar täuschen — bei zwei
   getrennten Durchläufen mit regulären Ausdrücken ginge genau das, und
   welcher zuerst läuft, entschiede das Ergebnis.

   Ausgeblendet wird mit Leerzeichen GLEICHER LÄNGE: so verschieben sich
   keine Positionen, und der Inhalt echter Skripte — auf den es für die
   Prüfsumme ankommt — bleibt Zeichen für Zeichen unangetastet. */
function ohneKommentare(html) {
  let aus = '';
  let i = 0;
  while (i < html.length) {
    if (html.startsWith('<!--', i)) {
      const e = html.indexOf('-->', i + 4);
      const bis = e < 0 ? html.length : e + 3;
      aus += ' '.repeat(bis - i);
      i = bis;
      continue;
    }
    const s = /^<script\b[^>]*>/i.exec(html.slice(i, i + 400));
    if (s) {
      const e = html.toLowerCase().indexOf('</script>', i + s[0].length);
      const bis = e < 0 ? html.length : e + 9;
      aus += html.slice(i, bis);        // Skripte unveraendert uebernehmen
      i = bis;
      continue;
    }
    aus += html[i];
    i++;
  }
  return aus;
}

function bloecke(html) {
  const sauber = ohneKommentare(html);
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  const out = [];
  let m;
  while ((m = re.exec(sauber))) out.push(m[1]);
  return out;
}

function pruefsumme(text) {
  return 'sha256-' + crypto.createHash('sha256').update(text, 'utf8').digest('base64');
}

/* Die Regel selbst. Alles, was nicht dasteht, ist verboten —
   default-src 'none' ist der Ausgangspunkt, nicht das Feigenblatt. */
function regel(hashes, seite) {
  const k = SEITEN[seite] || SEITEN['index.html'];
  return [
    "default-src 'none'",
    // Der eigene Code, sonst nichts. Kein 'unsafe-inline'.
    "script-src " + k.script + ' ' + hashes.map(h => "'" + h + "'").join(' '),
    /* Stile: 'unsafe-inline' bleibt nötig. Die Oberfläche setzt Farben und
       Grössen an style="…" der einzelnen Elemente, und dafür gibt es keine
       Prüfsumme. Ein Stil kann keinen Code ausführen; die Regel verliert
       damit nichts von dem, wofür sie hier steht. */
    "style-src 'self' 'unsafe-inline'",
    /* Schriften seit 17.9.2026 lokal unter schriften/ — kein Aufruf mehr
       zu Google beim Laden der Seite, also auch keine IP-Uebermittlung
       an einen Dritten (LG Muenchen I, 3 O 17493/20). fonts.googleapis.com
       und fonts.gstatic.com sind deshalb hier entfernt; stuenden sie noch
       drin, waere ein versehentlich wieder eingebauter Google-Link nicht
       zu bemerken. data: bleibt fuer eingebettete Symbolschriften.

       DIESE ZEILEN SIND DIE EINZIGE QUELLE DER REGEL. Wer die CSP nur im
       HTML aendert, verliert die Aenderung beim naechsten --setzen. */
    "font-src 'self' data:",
    // Bilder und Ton kommen aus der Datenbank als data:-Adressen (safeMedia).
    "img-src " + k.img,
    "media-src " + k.medien,
    // Firebase: Datenbank, Anmeldung, Meldungen, Cloud Functions.
    "connect-src " + k.verbinden,
    "worker-src " + k.worker,
    "manifest-src " + k.manifest,
    // Nichts davon braucht die App, und jedes davon ist ein Weg nach draussen.
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
}

const MARKE_AUF = '<meta http-equiv="Content-Security-Policy" content="';
const MARKE_ZU = '" />';

function vorhandene(html) {
  const i = html.indexOf(MARKE_AUF);
  if (i < 0) return null;
  const j = html.indexOf(MARKE_ZU, i);
  return html.slice(i + MARKE_AUF.length, j);
}

function neue(html, seite) {
  return regel(bloecke(html).map(pruefsumme), seite || 'index.html');
}

if (require.main === module) {
  const setzen = process.argv.indexOf('--setzen') >= 0;
  let schief = 0;

  Object.keys(SEITEN).forEach((seite) => {
    const datei = path.join(WURZEL, seite);
    const html = fs.readFileSync(datei, 'utf8');
    const soll = neue(html, seite);
    const ist = vorhandene(html);

    if (!setzen) {
      console.log('── ' + seite + ' (' + bloecke(html).length + ' Skriptblöcke)');
      console.log('   ' + soll.split('; ').join(';\n   '));
      console.log(ist === soll ? '   ✓ trägt genau diese Regel'
        : '   ✗ trägt eine andere — node tools/csp.js --setzen');
      if (ist !== soll) schief++;
      return;
    }
    if (ist === null) {
      console.error(seite + ': kein CSP-Meta-Element gefunden.');
      schief++;
      return;
    }
    fs.writeFileSync(datei, html.replace(MARKE_AUF + ist + MARKE_ZU, MARKE_AUF + soll + MARKE_ZU));
    console.log(seite + ': ' + (ist === soll ? 'unverändert' : 'Regel neu gesetzt'));
  });

  process.exit(schief ? 1 : 0);
}

module.exports = { bloecke, pruefsumme, regel, vorhandene, neue, DATEI, WURZEL, SEITEN };
