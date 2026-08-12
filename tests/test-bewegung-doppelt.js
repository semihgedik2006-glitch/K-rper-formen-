/* ── Keine Bewegung zweimal definiert ─────────────────────────────────
   WARUM ES DIESEN DURCHLAUF GIBT
   Am 12.8.2026 waren zwei von 38 @keyframes doppelt vergeben: `viewIn`
   und `checkPop`. In CSS gewinnt die spätere Definition, die frühere
   ist lautlos weg — dieselbe Falle wie der doppelte Schlüssel `firma`
   in konfig.js.

   Es ist kein Schönheitsfehler:

     · `.view.show` stand mit .32s ease-out und weiter unten mit .5s
       ease-ios. Wer oben an der Dauer drehte, änderte nichts. Der
       Ansichtswechsel ist die häufigste Bewegung der App.
     · `.fab-count.show` benutzt `checkPop` und bekam dadurch eine
       Kurve, für die es nie geschrieben wurde.

   Kein Absturz, keine Meldung, kein roter Durchlauf — die Bedeutung
   verschiebt sich einfach an einer Stelle, die niemand mehr im Blick
   hat. Genau die Sorte Fehler, die von selbst wiederkommt, wenn man
   sie nur einmal von Hand wegräumt.

   Geprüft wird ohne Browser: die Datei lesen und zählen.

     1. Kein @keyframes-Name zweimal.
     2. Jede benutzte Animation ist auch definiert (ein Tippfehler im
        Namen bewegt gar nichts und fällt sonst niemandem auf).
     3. Gegenprobe: es gibt überhaupt Bewegung — sonst wäre auch eine
        Datei ohne jede Animation grün.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');

const DATEI = path.join(__dirname, '..', 'index.html');
const quelle = fs.readFileSync(DATEI, 'utf8');
const errs = [];

/* Nur der Stilteil. Im JavaScript stehen Zeichenketten wie
   'animation:none', die hier nichts zu suchen haben. */
const stil = (quelle.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []).join('\n');
if (!stil) errs.push('KAPUTT: kein <style>-Block in index.html gefunden');

/* ══ 1. Kein Name zweimal ══ */
const wo = {};
const reDef = /@(?:-webkit-)?keyframes\s+([A-Za-z_][\w-]*)/g;
let m;
while ((m = reDef.exec(stil))) {
  const name = m[1];
  const zeile = stil.slice(0, m.index).split('\n').length;
  (wo[name] = wo[name] || []).push(zeile);
}
const namen = Object.keys(wo);
const doppelt = namen.filter(n => wo[n].length > 1);

console.log('Keyframes gesamt:', namen.length);
console.log('doppelt         :', doppelt.length ? doppelt.join(', ') : 'keine');

if (doppelt.length) {
  errs.push('DOPPELT DEFINIERT: ' +
    doppelt.map(n => n + ' (Zeilen ' + wo[n].join(' und ') + ')').join(' · ') +
    ' — die spätere gewinnt, die frühere ist toter Code');
}

/* ══ 2. Jede benutzte Animation ist auch definiert ══
   `animation:` und `animation-name:` einsammeln. Der Name ist das erste
   Wort, das keine Dauer, keine Kurve und kein Schlüsselwort ist. */
const REGIE = {
  none: 1, initial: 1, inherit: 1, unset: 1, infinite: 1, alternate: 1,
  'alternate-reverse': 1, reverse: 1, normal: 1, forwards: 1, backwards: 1,
  both: 1, running: 1, paused: 1, linear: 1, ease: 1, 'ease-in': 1,
  'ease-out': 1, 'ease-in-out': 1, 'step-start': 1, 'step-end': 1
};
const benutzt = {};
const reNutz = /animation(?:-name)?\s*:\s*([^;}]+)/g;
while ((m = reNutz.exec(stil))) {
  const zeile = stil.slice(0, m.index).split('\n').length;
  m[1].split(',').forEach(teil => {
    teil.replace(/var\([^)]*\)/g, ' ')          // var(--ease-ios) raus
        .replace(/(cubic-bezier|steps)\([^)]*\)/g, ' ')
        .trim().split(/\s+/).forEach(w => {
      if (!w) return;
      if (REGIE[w]) return;
      if (/^[\d.]/.test(w)) return;             // .3s, 300ms, 2
      if (!/^[A-Za-z_][\w-]*$/.test(w)) return;
      if (!benutzt[w]) benutzt[w] = zeile;
    });
  });
}
const fehlend = Object.keys(benutzt).filter(n => !wo[n]);
console.log('benutzte Namen  :', Object.keys(benutzt).length);
if (fehlend.length) {
  errs.push('BENUTZT, ABER NICHT DEFINIERT: ' +
    fehlend.map(n => n + ' (Zeile ' + benutzt[n] + ')').join(' · ') +
    ' — bewegt sich gar nichts, und niemand merkt es');
}

/* ══ 3. Gegenprobe ══
   Ohne sie wäre eine index.html ohne jede Animation der grünste
   Durchlauf von allen. */
if (namen.length < 20) {
  errs.push('GEGENPROBE: nur ' + namen.length + ' Keyframes — entweder ist ' +
            'die Bewegung verschwunden oder dieser Durchlauf misst am ' +
            'falschen Ort');
}

console.log(errs.length
  ? '\n✗ ' + errs.join('\n✗ ')
  : '\n✓ Bewegung: ' + namen.length + ' Keyframes, keiner doppelt, keiner fehlt');
process.exit(errs.length ? 1 : 0);
