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

const DATEI = path.join(__dirname, '..', 'index.html');

/* Jeder <script>-Block ohne src. Der Inhalt geht Zeichen für Zeichen in
   die Prüfsumme, einschliesslich Zeilenumbrüchen. */
function bloecke(html) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

function pruefsumme(text) {
  return 'sha256-' + crypto.createHash('sha256').update(text, 'utf8').digest('base64');
}

/* Die Regel selbst. Alles, was nicht dasteht, ist verboten —
   default-src 'none' ist der Ausgangspunkt, nicht das Feigenblatt. */
function regel(hashes) {
  return [
    "default-src 'none'",
    // Der eigene Code und das Firebase-SDK. Kein 'unsafe-inline'.
    "script-src 'self' https://www.gstatic.com " + hashes.map(h => "'" + h + "'").join(' '),
    /* Stile: 'unsafe-inline' bleibt nötig. Die Oberfläche setzt Farben und
       Grössen an style="…" der einzelnen Elemente, und dafür gibt es keine
       Prüfsumme. Ein Stil kann keinen Code ausführen; die Regel verliert
       damit nichts von dem, wofür sie hier steht. */
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com data:",
    // Bilder und Ton kommen aus der Datenbank als data:-Adressen (safeMedia).
    "img-src 'self' data: blob:",
    "media-src 'self' data: blob:",
    // Firebase: Datenbank, Anmeldung, Meldungen, Cloud Functions.
    "connect-src 'self' https://*.googleapis.com https://*.cloudfunctions.net " +
      "https://*.firebaseio.com wss://*.firebaseio.com " +
      "https://*.firebasedatabase.app wss://*.firebasedatabase.app",
    "worker-src 'self'",
    "manifest-src 'self'",
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

function neue(html) {
  return regel(bloecke(html).map(pruefsumme));
}

if (require.main === module) {
  const html = fs.readFileSync(DATEI, 'utf8');
  const soll = neue(html);
  const ist = vorhandene(html);

  if (process.argv.indexOf('--setzen') < 0) {
    console.log(soll.split('; ').join(';\n  '));
    console.log('\nSkriptblöcke: ' + bloecke(html).length);
    console.log(ist === soll ? '\n✓ index.html trägt genau diese Regel'
      : '\n✗ index.html trägt eine andere Regel — node tools/csp.js --setzen');
    process.exit(ist === soll ? 0 : 1);
  }

  if (ist === null) {
    console.error('Kein CSP-Meta-Element in index.html gefunden.');
    process.exit(1);
  }
  fs.writeFileSync(DATEI, html.replace(MARKE_AUF + ist + MARKE_ZU, MARKE_AUF + soll + MARKE_ZU));
  console.log(ist === soll ? 'Unverändert.' : 'Regel neu gesetzt.');
}

module.exports = { bloecke, pruefsumme, regel, vorhandene, neue, DATEI };
