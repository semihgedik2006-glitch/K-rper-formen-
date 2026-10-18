/* ══════════════════════════════════════════════════════════════════════
   STUDIO-GEHIRN: „ANLEGEN LASSEN" UND LAGEBERICHT (Runde 150) — Rechnung

   Was die KI vorschlägt, ist fremde Eingabe. gehirnVorschlagPruefen
   macht daraus etwas, das die App gefahrlos ins Formular füllen kann.
   Geprüft ohne Datenbank und ohne KI:
   1. Nur „aufgabe" oder „ankuendigung"; alles andere → kein Vorschlag.
   2. Studios nur aus denen, die die Person verwalten darf — ein
      fremdes Studio, das die KI nennt, fällt heraus.
   3. „alle" heisst beim Chef alle; bei der Studioleitung ihre eigenen.
   4. Eine Ankündigung geht an genau ein Ziel oder „alle" (wie im Formular).
   5. Frist nur im Format YYYY-MM-DD und nicht in der Vergangenheit.
   6. Längen sind begrenzt, Teilschritte höchstens 12.
   7. „wichtig" gibt es nur bei Ankündigungen.
   8. Der Bericht ohne KI nennt die Zahlen und die Studios mit Offenem.
   ══════════════════════════════════════════════════════════════════ */
const { __intern } = require('../functions/index.js');
const { gehirnVorschlagPruefen: P, lageberichtOhneKi } = __intern;

let gut = 0, schlecht = 0;
function pruefe(was, b, info) {
  if (b) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (info !== undefined ? '  — ' + JSON.stringify(info) : '')); }
}
const NAMEN = { 'studio-1': 'Hürth', 'studio-2': 'Brühl', 'studio-3': 'Köln-Porz' };
const ALLE = Object.keys(NAMEN);
const HEUTE = '2026-10-18';

console.log('── Vorschlag prüfen ──');
pruefe('unbekannter Typ → kein Vorschlag', P({ typ: 'keins', titel: 'x' }, NAMEN, ALLE, 'chef', HEUTE) === null);
pruefe('Aufgabe ohne Titel → kein Vorschlag', P({ typ: 'aufgabe', titel: '  ' }, NAMEN, ALLE, 'chef', HEUTE) === null);

let v = P({ typ: 'aufgabe', titel: 'Geräte desinfizieren', studios: ['Hürth', 'brühl'], frist: '2026-10-23',
            schritte: ['abwischen', 'trocknen'] }, NAMEN, ALLE, 'chef', HEUTE);
pruefe('Studios über den Namen gefunden, gross/klein egal', v && v.studioKeys.join() === 'studio-1,studio-2', v);
pruefe('Frist übernommen', v && v.frist === '2026-10-23', v);
pruefe('Teilschritte übernommen', v && v.schritte.length === 2, v);
pruefe('„wichtig" gibt es bei Aufgaben nicht', v && v.wichtig === false);

v = P({ typ: 'aufgabe', titel: 'X', studios: ['Hürth', 'Brühl'] }, NAMEN, ['studio-1'], 'leiter', HEUTE);
pruefe('Leitung: fremdes Studio fällt heraus', v && v.studioKeys.join() === 'studio-1', v);

v = P({ typ: 'aufgabe', titel: 'X', studios: ['alle'] }, NAMEN, ALLE, 'chef', HEUTE);
pruefe('Chef: „alle" bleibt alle', v && v.alle === true, v);
v = P({ typ: 'aufgabe', titel: 'X', studios: ['alle'] }, NAMEN, ['studio-1', 'studio-3'], 'leiter', HEUTE);
pruefe('Leitung: „alle" heisst ihre eigenen Studios', v && v.alle === false && v.studioKeys.join() === 'studio-1,studio-3', v);

v = P({ typ: 'aufgabe', titel: 'X', studios: ['Mars'] }, NAMEN, ALLE, 'chef', HEUTE);
pruefe('unbekanntes Studio → keines angekreuzt', v && v.studioKeys.length === 0 && !v.alle, v);

v = P({ typ: 'aufgabe', titel: 'X', frist: '2026-10-01' }, NAMEN, ALLE, 'chef', HEUTE);
pruefe('Frist in der Vergangenheit fällt weg', v && v.frist === '', v);
v = P({ typ: 'aufgabe', titel: 'X', frist: 'Freitag' }, NAMEN, ALLE, 'chef', HEUTE);
pruefe('Frist im falschen Format fällt weg', v && v.frist === '', v);

v = P({ typ: 'aufgabe', titel: 'A'.repeat(500), schritte: Array(30).fill('s') }, NAMEN, ALLE, 'chef', HEUTE);
pruefe('Titel auf 120 Zeichen begrenzt', v && v.titel.length === 120, v && v.titel.length);
pruefe('höchstens 12 Teilschritte', v && v.schritte.length === 12, v && v.schritte.length);

v = P({ typ: 'ankuendigung', text: 'Teamabend am Freitag', studios: ['Hürth', 'Brühl'], wichtig: true }, NAMEN, ALLE, 'chef', HEUTE);
pruefe('Ankündigung: genau ein Ziel', v && v.studioKeys.length === 1, v);
pruefe('Ankündigung: „wichtig" bleibt', v && v.wichtig === true, v);
v = P({ typ: 'ankuendigung', text: 'Info', studios: ['alle'] }, NAMEN, ['studio-1'], 'leiter', HEUTE);
pruefe('Leitung: Ankündigung an „alle" wird zu ihrem Studio', v && v.alle === false && v.studioKeys.join() === 'studio-1', v);

console.log('\n── Bericht ohne KI ──');
const t = lageberichtOhneKi('tag', { fragen: 12, abgedeckt: 9, offenGesamt: 2, ideen: [{}] },
  [{ name: 'Hürth', aufgaben: 2, putz: 1 }, { name: 'Brühl', aufgaben: 0, putz: 0 }]);
pruefe('nennt Fragen und Antworten aus dem Wissen', /12 Fragen/.test(t) && /9 direkt/.test(t), t);
pruefe('nennt offene Fragen im Leitstand', /2 Fragen warten/.test(t), t);
pruefe('nennt die Idee', /1 neue Idee/.test(t), t);
pruefe('nennt das Studio mit Offenem, nicht das fertige', /Hürth \(2 Aufgaben und 1 Punkt im Putzplan offen\)/.test(t) && !/Brühl/.test(t), t);
const t2 = lageberichtOhneKi('woche', null, [{ name: 'Hürth', aufgaben: 0, putz: 0 }]);
pruefe('ohne Worker-Zahlen sagt er das ehrlich', /nicht abrufbar/.test(t2), t2);
pruefe('alles erledigt wird so gesagt', /alles abgehakt/.test(t2), t2);

console.log(schlecht
  ? '\n✗ Studio-Gehirn Rechnung: ' + schlecht + ' von ' + (gut + schlecht) + ' falsch'
  : '\n✓ Studio-Gehirn Rechnung: Vorschläge harmlos, Bericht ehrlich — ' + gut + ' Zusicherungen');
process.exit(schlecht ? 1 : 0);
