/* ── Keine Bewegung zweimal definiert ─────────────────────────────────
   In CSS gewinnt die spätere Definition; die frühere ist lautlos toter
   Code. Bei @keyframes hat das zwei Folgen, die man nicht sieht: wer an
   der früheren Dauer dreht, ändert nichts, und ein Element, das den
   Namen mitbenutzt, bekommt eine Kurve, für die es nie geschrieben
   wurde.

   Ohne Browser, liest nur die Datei:

     1. Kein @keyframes-Name zweimal.
     2. Jede benutzte Animation ist auch definiert — ein Tippfehler im
        Namen bewegt gar nichts und fällt sonst niemandem auf.
     3. Gegenprobe: es gibt überhaupt Bewegung. Sonst wäre eine Datei
        ganz ohne Animation der grünste Durchlauf von allen.
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
