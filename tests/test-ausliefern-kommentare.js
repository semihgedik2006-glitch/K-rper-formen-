/* ── Kommentare beim Ausliefern entfernen: bleibt der Code derselbe? ──
   (Runde 287) tools/ausliefern.js streicht in der Auslieferung die
   Erklärungen aus index.html. Ein Streicher, der ein „//" in einer
   Adresse oder ein „/*" in einer Zeichenkette erwischt, zerreisst die
   App — leise, erst auf dem Handy. Deshalb wird hier nicht geprüft, ob
   Kommentare WEG sind (das wäre leicht), sondern ob der CODE gleich
   geblieben ist: Zeichen für Zeichen dieselbe Folge von Sprachzeichen
   (Token) vor und nach dem Streichen, in jedem Skriptblock.

   Dazu Gegenproben mit gebauten Fällen (Adresse mit //, Vorlage mit
   ${}, regulärer Ausdruck mit /*), und die Zeilenzahl: sie muss gleich
   bleiben, damit Fehlermeldungen im Browser auf die Zeile im Repo
   zeigen. Braucht acorn (im Scratchpad/Projekt: npm install acorn@8). */
const fs = require('fs');
const path = require('path');
const WURZEL = path.join(__dirname, '..');
const A = require(path.join(WURZEL, 'tools', 'ausliefern.js'));

let gut = 0, schlecht = 0;
function pruefe(name, ok, info) {
  if (ok) { gut++; console.log('  ✓ ' + name); }
  else { schlecht++; console.log('  ✗ ' + name + (info ? '  — ' + info : '')); }
}

let acorn;
try { acorn = A.acornLaden(); } catch (e) { console.log('Fehler: ' + e.message); process.exit(1); }

function tokens(code) {
  return [...acorn.tokenizer(code, { ecmaVersion: 'latest' })].map(t => t.type.label + ':' + (t.value === undefined ? '' : String(t.value)));
}
function gleich(a, b) { return a.length === b.length && a.every((x, i) => x === b[i]); }
function bloecke(html) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g; const o = []; let m;
  while ((m = re.exec(html))) o.push(m[1]);
  return o;
}

console.log('\n── Gebaute Fälle ──');
{
  const code = "var a='http://x.de/y';// Kommentar\nvar b=`v ${1+/* k */2} // nicht`;\nvar c=/\\/\\*nicht\\*\\//g; /* weg */\nvar d=\"/* bleibt */\"; // weg\n";
  const aus = A.skriptOhneKommentare(code, acorn);
  pruefe('Adresse mit // bleibt', aus.indexOf("'http://x.de/y'") >= 0, aus);
  pruefe('Zeichenkette mit /* bleibt', aus.indexOf('"/* bleibt */"') >= 0);
  pruefe('regulärer Ausdruck mit /* bleibt', aus.indexOf('/\\/\\*nicht\\*\\//g') >= 0);
  pruefe('Vorlage mit // im Text bleibt', aus.indexOf('// nicht`') >= 0);
  pruefe('Zeilenkommentar weg', aus.indexOf('// Kommentar') < 0 && aus.indexOf('// weg') < 0);
  pruefe('Blockkommentar weg (auch in ${})', aus.indexOf('/* k */') < 0 && aus.indexOf('/* weg */') < 0);
  pruefe('gleiche Zeilenzahl', aus.split('\n').length === code.split('\n').length);
  pruefe('gleiche Token', gleich(tokens(code), tokens(aus)));
  const css = ".a{background:url(/*x*/bild.png)}/* weg */.b{content:\"/* bleibt */\"}";
  const c2 = A.stilOhneKommentare(css);
  pruefe('Stil: url(…) und Zeichenkette bleiben, Kommentar weg', c2 === ".a{background:url(/*x*/bild.png)}.b{content:\"/* bleibt */\"}", c2);
  const html = "<!-- weg --><p>a</p><script>var s='<!-- bleibt -->';// weg\n</script><style>/* weg */p{}</style>";
  const h2 = A.htmlOhneKommentare(html, acorn).html;
  pruefe('HTML-Kommentar weg, im Skript bleibt die Zeichenkette', h2.indexOf('<!-- weg -->') < 0 && h2.indexOf("'<!-- bleibt -->'") >= 0 && h2.indexOf('// weg') < 0 && h2.indexOf('/* weg */') < 0, h2);
  /* GEGENPROBE: ein Streicher mit regulärem Ausdruck über alles würde
     die Adresse zerreissen — so sähe das Ergebnis aus, und so darf es
     nicht aussehen. */
  const naiv = code.replace(/\/\/.*$/gm, '');
  pruefe('GEGENPROBE: der naive Weg zerreisst die Adresse (sonst prüft der Test nichts)', naiv.indexOf("'http://x.de/y'") < 0);
}

console.log('\n── index.html und werbung.html ──');
for (const datei of ['index.html', 'werbung.html']) {
  const r = A.verarbeiten(datei, acorn);
  const vor = bloecke(r.vorher), nach = bloecke(r.nachher);
  pruefe(datei + ': gleich viele Skriptblöcke (' + vor.length + ')', vor.length === nach.length && vor.length > 0);
  vor.forEach((b, i) => {
    let ok = false, info = '';
    try { ok = gleich(tokens(b), tokens(nach[i] || '')); } catch (e) { info = e.message; }
    pruefe(datei + ': Block ' + i + ' hat dieselben Token', ok, info);
  });
  pruefe(datei + ': gleiche Zeilenzahl', r.vorher.split('\n').length === r.nachher.split('\n').length);
  const stile = (r.nachher.match(/<style[\s\S]*?<\/style>/g) || []).join('');
  pruefe(datei + ': kein Kommentar mehr in den Stilen', !/\/\*/.test(stile));
  pruefe(datei + ': kein HTML-Kommentar mehr ausserhalb der Skripte', !/<!--/.test(r.nachher.replace(/<script[\s\S]*?<\/script>/g, '')));
  const vorherKB = Math.round(Buffer.byteLength(r.vorher) / 1024), nachherKB = Math.round(Buffer.byteLength(r.nachher) / 1024);
  pruefe(datei + ': kleiner geworden (' + vorherKB + ' → ' + nachherKB + ' KB)', nachherKB < vorherKB);
}

console.log('\n' + (schlecht ? '✗ ' : '✓ ') + 'Ausliefern ohne Kommentare: ' + gut + ' grün, ' + schlecht + ' rot');
console.log('Fehler: ' + (schlecht ? schlecht + ' Prüfung(en)' : 'keine'));
process.exit(schlecht ? 1 : 0);
