/* ══════════════════════════════════════════════════════════════════════
   DOPPELTE FUNKTIONSNAMEN IN index.html (20.10.2026)

   Gefunden beim Umbau des Schichtplaners: Runde 156 brachte eine
   Funktion spStand(text, fehler) mit — und den Namen gab es schon, für
   den Sprachnachrichten-Spieler. Bei zwei gleichnamigen Funktionen in
   einem Skript gewinnt still die spätere. Die Sprachnachrichten zeigten
   danach weder Fortschritt noch Abspielen/Anhalten; kein Durchlauf und
   keine Fehlermeldung merkte etwas.

   Dieser Durchlauf liest die Inline-Skripte und meldet jeden Namen, der
   zweimal als `function name(` auf oberster Ebene steht.

   BEKANNT (steht hier, damit eine Änderung daran auffällt):
   · wartetAufFreigabe — zweimal, die zweite Fassung (über ohneBetrieb)
     ist die wirksame. Gleiche Absicht, aber nicht gleicher Inhalt; wer
     die erste liest, liest die falsche. Offen in FORTSCHRITT, Runde 168.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

let gut = 0, schlecht = 0;
function pruefe(was, b, info) {
  if (b) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (info ? '  — ' + info : '')); }
}
const BEKANNT = ['wartetAufFreigabe'];

function doppelte(quelle) {
  const namen = {};
  (quelle.match(/^function [A-Za-z_$][\w$]*/gm) || []).forEach((z) => {
    const n = z.slice(9); namen[n] = (namen[n] || 0) + 1;
  });
  return Object.keys(namen).filter((n) => namen[n] > 1);
}

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const skripte = (html.match(/<script>[\s\S]*?<\/script>/g) || []).join('\n');
const funde = doppelte(skripte);
const neu = funde.filter((n) => BEKANNT.indexOf(n) < 0);
pruefe('kein Funktionsname steht zweimal (ausser den bekannten)', !neu.length, neu.join(', '));
pruefe('die bekannten Doppelten sind noch da (sonst hier austragen)', BEKANNT.every((n) => funde.indexOf(n) >= 0),
  BEKANNT.filter((n) => funde.indexOf(n) < 0).join(', '));
pruefe('der Sprachnachrichten-Spieler hat seinen spStand für sich', (skripte.match(/^function spStand\(/gm) || []).length === 1);
// Gegenprobe: der Fall von Runde 156, nachgestellt
pruefe('GEGENPROBE: zwei gleichnamige Funktionen werden erkannt',
  doppelte('function spStand(sp){}\nfunction x(){}\nfunction spStand(t, f){}\n').join() === 'spStand');

console.log('\n' + (schlecht ? '✗ Fehler: ' + schlecht : '✓ Fehler: keine') + ' — doppelte Namen, ' + gut + ' Prüfungen');
process.exit(schlecht ? 1 : 0);
