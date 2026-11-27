/* JEDE KENNUNG (id) GIBT ES NUR EINMAL — Aufräumen, 26.11.2026
 *
 * Anlass: Die Karte „Video per Link teilen" (Runde 308) bekam Kennungen
 * mit „vf…" — dasselbe Kürzel wie das Fenster „Problem melden" (Vorfall).
 * „vfTitel" und „vfFertig" gab es danach zweimal. document.getElementById
 * liefert dann das ERSTE Element: der Knopf „Schließen" im Vorfall-Fenster
 * hängte seinen Klick an die Videokarte, und die Überschrift des Fensters
 * zeigte auf ein Eingabefeld. Kein Test hat es gesehen, bis
 * tests/test-vorfall.js an genau diesem Knopf hängen blieb.
 *
 * Geprüft wird ohne Browser:
 *   1. im festen HTML (ohne Skripte und Kommentare) keine id doppelt;
 *   2. keine id, die ein Skript per innerHTML erzeugt („id=\"…\""), steht
 *      zugleich fest im HTML.
 *   3. Gegenprobe: die Prüfung findet eine eingeschleuste Doppelung.
 */
const fs = require('fs');
const path = require('path');

const DATEI = path.join(__dirname, '..', 'index.html');
let fehler = 0;
function pruefe(name, ok, detail) {
  console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok || !detail ? '' : '  — ' + detail));
  if (!ok) fehler++;
}

function untersuche(html) {
  const fest = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
                   .replace(/<!--[\s\S]*?-->/g, '');
  const zahl = {};
  for (const m of fest.matchAll(/\sid="([^"]+)"/g)) zahl[m[1]] = (zahl[m[1]] || 0) + 1;
  const doppelt = Object.keys(zahl).filter(k => zahl[k] > 1);
  const skripte = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(m => m[1]).join('\n');
  const erzeugt = new Set([...skripte.matchAll(/id=\\?"([A-Za-z][\w-]*)\\?"/g)].map(m => m[1]));
  const beides = [...erzeugt].filter(k => zahl[k]);
  return { doppelt, beides, anzahl: Object.keys(zahl).length };
}

console.log('\n── Kennungen in index.html ──');
const html = fs.readFileSync(DATEI, 'utf8');
const u = untersuche(html);
pruefe('Messung nicht leer: über 500 feste Kennungen gefunden', u.anzahl > 500, String(u.anzahl));
pruefe('keine feste Kennung doppelt', !u.doppelt.length, u.doppelt.join(', '));
pruefe('keine per Skript erzeugte Kennung steht zugleich fest im HTML', !u.beides.length, u.beides.join(', '));

console.log('\n── Gegenprobe ──');
/* Eingefügt vor dem LETZTEN </body> — das erste steht in einem Skript. */
const vorEnde = (zusatz) => { const i = html.lastIndexOf('</body>'); return html.slice(0, i) + zusatz + html.slice(i); };
const g1 = untersuche(vorEnde('<div id="vorfallModal"></div>'));
pruefe('GEGENPROBE eine eingeschleuste feste Doppelung wird gefunden', g1.doppelt.includes('vorfallModal'), g1.doppelt.join(', '));
const g2 = untersuche(vorEnde('<script>x.innerHTML=\'<b id="vorfallModal"></b>\';</script>'));
pruefe('GEGENPROBE eine per Skript erzeugte Doppelung wird gefunden', g2.beides.includes('vorfallModal'), g2.beides.join(', '));

console.log(fehler ? '\n✗ ' + fehler + ' Fehler' : '\n✓ Kennungen: jede gibt es nur einmal');
process.exit(fehler ? 1 : 0);
