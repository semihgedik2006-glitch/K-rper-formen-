/* ── Dieselbe Messlatte, noch einmal unter dem Schalter ───────────────
   Das neue Design (docs/FORTSCHRITT.md, Runde 84) hängt an der Klasse
   `neu` am body. Ohne sie greift keine seiner Regeln — und genau das
   ist der Haken für die Durchläufe: sie starten die App ohne Schalter,
   messen also die Schriftgrössen und den Schnitt von gestern und sind
   grün, während im neuen Design Text abgeschnitten wird.

   GENAU SO IST ES PASSIERT. Die Schrift-Leiter ist unter `neu` eine
   Stufe höher. Damit passte „WARTET AUF DEINE ENTSCHEIDUNG" — Versalien,
   --ls-l, white-space:nowrap — auf einem 320er-Gerät nicht mehr:
   gemessen 327px Inhalt in 320px Fläche. `test-abgeschnitten` war
   trotzdem grün. Er hatte recht: was er zu sehen bekam, war in Ordnung.

   Deshalb laufen die drei Messungen, die von der GEOMETRIE handeln, ein
   zweites Mal — mit ?neu=1:

     test-abgeschnitten   verschluckt ein Kasten Text?
     test-knoepfe         sitzt jedes Zeichen mittig, liegt kein
                          Abzeichen auf seinem Symbol?
     test-quer            lässt sich etwas seitwärts schieben, das
                          nicht soll?

   Warum nur diese drei und nicht alle 109: die anderen prüfen
   VERHALTEN, und das ändert der Schalter nicht — er ändert Abstände,
   Grössen und den Schnitt der Navigation. Was am Schalter selbst hängt,
   prüft test-neu-design.js. Was an Pixeln hängt, prüft dieser hier.

   Zusammen rund zwei Minuten (64 + 13 + 40 s gemessen), also innerhalb
   der 240 s, die tests/alle.sh je Durchlauf gibt.
   ─────────────────────────────────────────────────────────────────── */
const { spawnSync } = require('child_process');
const path = require('path');

const SP = __dirname;
const BASIS = process.env.APP || 'http://127.0.0.1:8765/index.html';
/* Hängt der Aufrufer schon etwas an, korrekt verbinden statt blind ein
   Fragezeichen anzuhängen — sonst misst der Durchlauf eine Adresse, die
   es nicht gibt, und meldet Fehler, die keine sind. */
const MIT_NEU = BASIS + (BASIS.indexOf('?') >= 0 ? '&' : '?') + 'neu=1';

const DURCHLAEUFE = ['test-abgeschnitten', 'test-knoepfe', 'test-quer'];

console.log('── Dieselbe Messlatte, mit ?neu=1 ──');
console.log('   ' + MIT_NEU);

const rot = [];
for (const name of DURCHLAEUFE) {
  const r = spawnSync(process.execPath, [path.join(SP, name + '.js')], {
    env: Object.assign({}, process.env, { APP: MIT_NEU }),
    encoding: 'utf8',
    timeout: 200000,
  });
  const aus = (r.stdout || '') + (r.stderr || '');
  /* Zwei Fehlersignale, weil die Durchläufe zwei kennen: der Exit-Code
     und ein ✗ in der Ausgabe. Wer nur eines prüft, prüft nichts —
     dieselbe Lehre steht oben in tests/alle.sh. */
  const schlecht = r.status !== 0 || /✗/.test(aus);
  if (schlecht) {
    rot.push(name);
    console.log('\n  FEHLGESCHLAGEN: ' + name + ' (Exit ' + r.status + ')');
    /* Die Diagnose MITNEHMEN. Ein Läufer, der beim Fehlschlag die
       Ausgabe wegwirft, zwingt zum Raten. */
    aus.split('\n').filter(z => /✗|>|Abgeschnitten|WAAGERECHT|SENKRECHT|Fehler/.test(z))
      .slice(0, 12).forEach(z => console.log('    ' + z.trim().slice(0, 150)));
  } else {
    console.log('  ' + '✓' + ' ' + name);
  }
}

console.log('');
if (rot.length) {
  console.log('✗ Im neuen Design schlagen ' + rot.length + ' Messung(en) fehl: ' + rot.join(', '));
  process.exit(1);
}
console.log('✓ Neues Design: nichts abgeschnitten, jeder Knopf sitzt, nichts schiebt seitwärts');
process.exit(0);
