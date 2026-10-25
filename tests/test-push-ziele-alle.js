/* ── Jede Push-Meldung führt irgendwohin (Runde 268) ──────────────────
   Aus dem Betrieb, 25.10.2026, auf „die anderen Meldungen öffnen nur die
   App": „ja mach den rest auch mit ziel".

   Ohne Browser: liest functions/index.js und prüft JEDEN Aufruf von
   sendPush(…) und formiPush(…) —
     · er trägt ein Ziel (letztes Argument, Ansicht der App),
     · jedes genannte Ziel gibt es als Ansicht (id="view-…" in index.html),
     · nur Kleinbuchstaben (sw.js und sendPush lassen sonst nichts durch).
   Ein Durchlauf, der nur die heutigen Aufrufe kennt, wäre beim nächsten
   neuen Push still veraltet — deshalb wird gezählt, nicht aufgezählt.

   GEGENPROBEN am selben Prüfer: ein Aufruf ohne Ziel, ein Ziel, das es
   nicht gibt, und eines mit Grossbuchstaben werden gefunden.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

const QUELLE = fs.readFileSync(path.join(__dirname, '..', 'functions', 'index.js'), 'utf8');
const APP = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const ANSICHTEN = new Set([...APP.matchAll(/id="view-([a-z]+)"/g)].map((m) => m[1]));
/* Wo das Ziel nur durchgereicht wird (der Aufrufer nennt es). */
const DURCHGEREICHT = /^(ziel|ziel \|\| '[a-z]+')$/;

/* Die Argumente eines Aufrufs, auf oberster Ebene getrennt. Klammern,
   Zeichenketten (auch mit „…") und Vorlagen werden übersprungen. */
function argumente(text, start) {
  const args = []; let tiefe = 0, akt = '', i = start, in_ = null;
  for (; i < text.length; i++) {
    const c = text[i];
    if (in_) { akt += c; if (c === '\\') { akt += text[++i]; continue; } if (c === in_) in_ = null; continue; }
    if (c === '\'' || c === '"' || c === '`') { in_ = c; akt += c; continue; }
    if (c === '(' || c === '[' || c === '{') { tiefe++; akt += c; continue; }
    if (c === ')' || c === ']' || c === '}') {
      if (tiefe === 0) { args.push(akt.trim()); return args; }
      tiefe--; akt += c; continue;
    }
    if (c === ',' && tiefe === 0) { args.push(akt.trim()); akt = ''; continue; }
    akt += c;
  }
  return null;
}
function pruefer(text) {
  const funde = [], fehler = [];
  for (const m of text.matchAll(/\b(sendPush|formiPush)\(/g)) {
    const vor = text.slice(Math.max(0, m.index - 15), m.index);
    if (/function\s+$/.test(vor)) continue;                     // die Definition selbst
    const args = argumente(text, m.index + m[0].length);
    if (!args) { fehler.push('nicht lesbar bei ' + m.index); continue; }
    const soll = m[1] === 'sendPush' ? 5 : 5;                  // (tokens, titel, text, von, ziel) bzw. (firma, filter, titel, text, ziel)
    const zeile = text.slice(0, m.index).split('\n').length;
    if (args.length < soll) { fehler.push('Zeile ' + zeile + ': ' + m[1] + ' ohne Ziel'); continue; }
    const ziel = args[soll - 1];
    if (DURCHGEREICHT.test(ziel)) { funde.push({ zeile, ziele: ['(durchgereicht)'] }); continue; }
    const woerter = [...ziel.matchAll(/'([^']*)'/g)].map((x) => x[1]);
    if (!woerter.length) { fehler.push('Zeile ' + zeile + ': Ziel ist kein fester Name: ' + ziel); continue; }
    for (const w of woerter) {
      if (!/^[a-z]{2,20}$/.test(w)) fehler.push('Zeile ' + zeile + ': Ziel „' + w + '" ist kein Wort aus Kleinbuchstaben');
      else if (!ANSICHTEN.has(w)) fehler.push('Zeile ' + zeile + ': Ansicht „' + w + '" gibt es nicht');
    }
    funde.push({ zeile, ziele: woerter });
  }
  return { funde, fehler };
}

console.log('\n── Alle Push-Aufrufe in functions/index.js ──');
const r = pruefer(QUELLE);
r.funde.forEach((f) => console.log('    Zeile ' + f.zeile + ' → ' + f.ziele.join(' / ')));
pruefe('es gibt Push-Aufrufe zu prüfen (' + r.funde.length + ' gefunden)', r.funde.length >= 20, String(r.funde.length));
pruefe('jeder trägt ein Ziel, und jedes Ziel ist eine Ansicht der App', !r.fehler.length, r.fehler.join(' | '));

console.log('\n── Gegenproben am Prüfer ──');
const g1 = pruefer("async function x(){ await sendPush(tokens, 'Titel', text); }");
pruefe('GEGENPROBE ein Aufruf ohne Ziel wird gefunden', g1.fehler.length === 1 && /ohne Ziel/.test(g1.fehler[0]), JSON.stringify(g1));
const g2 = pruefer("await sendPush(tokens, 'T', 'x', null, 'gibtsnicht');");
pruefe('GEGENPROBE eine Ansicht, die es nicht gibt, wird gefunden', g2.fehler.length === 1 && /gibt es nicht/.test(g2.fehler[0]), JSON.stringify(g2));
const g3 = pruefer("await formiPush(firma, f, 'T', 'x', 'Zeit');");
pruefe('GEGENPROBE Grossbuchstaben werden gefunden', g3.fehler.length === 1 && /Kleinbuchstaben/.test(g3.fehler[0]), JSON.stringify(g3));
const g4 = pruefer("await sendPush(tokens, 'Hat „X\" erledigt', wer + ' (a, b)', null, 'todos');");
pruefe('GEGENPROBE Kommas und Klammern in Texten verwirren den Prüfer nicht', !g4.fehler.length && g4.funde.length === 1, JSON.stringify(g4));

console.log(schlecht
  ? '\n✗ Push-Ziele: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
  : '\n✓ Jede Push-Meldung führt irgendwohin — ' + gut + ' Zusicherungen');
process.exit(schlecht ? 1 : 0);
