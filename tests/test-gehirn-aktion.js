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
const { geminiSperreAufheben, geminiGesperrt, gehirnKontextText: KT, gehirnWeg: W, gehirnBefehlPruefen: B, gehirnVorschlagPruefen: P, lageberichtOhneKi, geminiFehlerText, GEMINI_MODELLE, geminiJson, kiJson } = __intern;

let gut = 0, schlecht = 0;
function pruefe(was, b, info) {
  if (b) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (info !== undefined ? '  — ' + JSON.stringify(info) : '')); }
}
const NAMEN = { 'studio-1': 'Hürth', 'studio-2': 'Brühl', 'studio-3': 'Köln-Porz' };
const ALLE = Object.keys(NAMEN);
const HEUTE = '2026-10-18';

console.log('── Etappe 3: Material, Probetraining, Formi meldet sich (23.10.2026) ──');
{
  /* Aus dem Betrieb (23.10.2026), Rückfragen zu Etappe 3: Formulare
     „Gerät defekt melden, Material nachbestellen, Urlaub/Frei beantragen,
     Probetraining eintragen"; melden bei „Morgens: dein Tag, Fällig &
     überfällig, Fehlendes Material/Defekt, Schichtende-Check"; „So oft
     wie nötig". */
  const NAM = { 'studio-1': 'Hürth', 'studio-2': 'Brühl' };
  const MB = (r, erlaubt) => B(r, NAM, erlaubt || ['studio-1'], 'mitarbeiter', '2026-10-23');
  const m1 = MB({ typ: 'material', artikel: 'Westen M', ist: '2', studio: 'Hürth' });
  pruefe('Material: Artikel, Ist-Zahl, Studio', m1 && m1.typ === 'material' && m1.artikel === 'Westen M' && m1.ist === 2 && m1.fehlt === null && m1.studioKey === 'studio-1', m1);
  const m2 = MB({ typ: 'material', artikel: 'Gurte', fehlt: 3 });
  pruefe('Material: „es fehlen 3" ohne Studio → eigenes Studio', m2 && m2.fehlt === 3 && m2.ist === null && m2.studioKey === 'studio-1', m2);
  pruefe('Material: ohne Zahl, negative oder riesige Zahl → nichts', MB({ typ: 'material', artikel: 'Gurte' }) === null && MB({ typ: 'material', artikel: 'Gurte', ist: -1 }) === null && MB({ typ: 'material', artikel: 'Gurte', fehlt: 0 }) === null && MB({ typ: 'material', artikel: 'Gurte', ist: 100000 }) === null);
  pruefe('Material: „nur noch 0" ist eine gültige Zahl', MB({ typ: 'material', artikel: 'Gurte', ist: 0 }).ist === 0);
  pruefe('Material: fremdes Studio fällt aufs eigene zurück', MB({ typ: 'material', artikel: 'Gurte', ist: 1, studio: 'Brühl' }).studioKey === 'studio-1');
  const p1 = MB({ typ: 'probe', datum: '2026-10-23', abschluss: true, notiz: 'x'.repeat(400) });
  pruefe('Probetraining: Datum, Abschluss, Notiz gekürzt', p1 && p1.typ === 'probe' && p1.abschluss === true && p1.notiz.length === 200 && p1.studioKey === 'studio-1', p1);
  pruefe('Probetraining: ohne Datum → heute; „abschluss" nur bei true', MB({ typ: 'probe', abschluss: 'ja' }).datum === '2026-10-23' && MB({ typ: 'probe', abschluss: 'ja' }).abschluss === false);
  pruefe('Probetraining: Zukunft oder älter als 30 Tage → nichts', MB({ typ: 'probe', datum: '2026-10-24' }) === null && MB({ typ: 'probe', datum: '2026-09-22' }) === null && MB({ typ: 'probe', datum: '2026-09-23' }) !== null);
  const sysE = __intern.gehirnAktionSystem({ rolle: 'mitarbeiter', namen: NAM, erlaubt: ['studio-1'], name: 'Lea', heute: '2026-10-23' });
  pruefe('Systemtext kennt „material" und „probe", Probetraining ohne Kundennamen', /"typ":"material"/.test(sysE) && /"typ":"probe"/.test(sysE) && /OHNE Kundennamen/.test(sysE));
  pruefe('Systemtext: eine Situation mit einem Kunden („Kunde hat Durchfall") ist immer eine Frage, nie „keins" (24.10.2026)', /Kunde hat Durchfall[^']*IMMER "frage" — nie "keins", nie "abwesenheit"/.test(sysE));
  pruefe('ein ungültiges „material"/„probe" wird „unklar", nicht als Frage beantwortet', W({ typ: 'material' }, null) === 'unklar' && W({ typ: 'probe' }, null) === 'unklar');

  const I = __intern;
  pruefe('Morgens: Dienst, Überfälliges, heute Fälliges, Putzpunkte in einem Satz',
    I.formiTagText({ schichten: [{ von: '09:00', bis: '17:00', studio: 'Hürth' }], ueberfaellig: 1, heute: 3, putz: 5 }) === 'Dienst 09:00–17:00 in Hürth · 1 Aufgabe ist überfällig · 3 Aufgaben sind heute fällig · 5 Putzpunkte offen.');
  pruefe('Morgens: nichts zu sagen → keine Meldung', I.formiTagText({ schichten: [] }) === null);
  pruefe('Schichtende: fehlende Übergabe und offene Putzpunkte', I.formiSchichtendeText({ studio: 'Hürth', uebergabe: false, putz: 1 }) === 'Deine Schicht in Hürth ist zu Ende: Übergabe noch nicht geschrieben · 1 Putzpunkt offen.');
  pruefe('Schichtende: alles erledigt → keine Meldung', I.formiSchichtendeText({ studio: 'Hürth', uebergabe: true, putz: 0 }) === null);
  const mn = I.formiMaterialNeu([{ name: 'Westen M', limit: 5, have: 4 }, { name: 'Gurte', need: 2 }], [{ name: 'Westen M', limit: 5, have: 1 }, { name: 'Gurte', need: 2 }, { name: 'Kabel', limit: 3, have: 3 }, { name: 'Neu', need: 1 }]);
  pruefe('Material: nur was jetzt mehr fehlt als vorher (Westen 1→4, Neu), nicht Unverändertes oder Volles', JSON.stringify(mn) === JSON.stringify([{ name: 'Westen M', fehlt: 4 }, { name: 'Neu', fehlt: 1 }]), mn);
  pruefe('Material: aufgefüllt → keine Meldung', I.formiMaterialNeu([{ name: 'Gurte', need: 2 }], [{ name: 'Gurte', need: 0 }]).length === 0);
  const t0 = Date.parse('2026-10-23T10:00:00Z');
  const fv = I.formiFristVorbei([{ title: 'A', due: t0 - 10 * 60000 }, { title: 'B', due: t0 - 40 * 60000 }, { title: 'C', due: t0 - 5 * 60000, done: true }, { title: 'D', due: t0 + 60000 }, { title: 'E', due: t0 - 60000, archived: true }], t0 - 30 * 60000, t0);
  pruefe('Frist vorbei: nur offene, deren Frist im letzten Fenster verstrich — jede genau einmal', fv.map(x => x.title).join() === 'A', fv);
  pruefe('Schichtende-Fenster: 17:00 Berlin (15:00 UTC im Oktober) liegt in (14:50, 15:05]', I.formiSchichtEndeIn('2026-10-23', '17:00', Date.parse('2026-10-23T14:50:00Z'), Date.parse('2026-10-23T15:05:00Z')) && !I.formiSchichtEndeIn('2026-10-23', '17:00', Date.parse('2026-10-23T15:00:00Z'), Date.parse('2026-10-23T15:15:00Z')) && !I.formiSchichtEndeIn('2026-10-23', 'kaputt', 0, Infinity));
}
console.log('── Daumen prüfen (20.10.2026) ──');
{
  const BP = __intern.gehirnBewertungPruefen;
  pruefe('hoch und runter gehen durch', BP({ wert: 1, nachricht: 7 }).wert === 1 && BP({ wert: -1, nachricht: '7' }).nachricht === 7);
  pruefe('anderer Wert → nichts', BP({ wert: 5, nachricht: 7 }) === null && BP({ wert: 0, nachricht: 7 }) === null);
  pruefe('ohne gültige Nachricht → nichts', BP({ wert: 1 }) === null && BP({ wert: 1, nachricht: -3 }) === null && BP({ wert: 1, nachricht: 1.5 }) === null);
  pruefe('ein Name aus dem Aufruf wird nicht übernommen', !('name' in BP({ wert: 1, nachricht: 7, name: 'Chef' })));
}
console.log('── Rückfrage, mehrere Aufträge, Ton (20.10.2026) ──');
{
  const NAM = { 'studio-1': 'Hürth' };
  const RF = (r) => B(r, NAM, ['studio-1'], 'mitarbeiter', '2026-10-20');
  const rf = RF({ typ: 'rueckfrage', frage: 'Meinst du den Putzplan oder die Aufgaben?', optionen: ['Öffne den Putzplan', 'Öffne die Aufgaben', 'Öffne den Putzplan', 'x'.repeat(200)] });
  pruefe('Rückfrage: Optionen ohne Doppel, höchstens 3, gekürzt', rf && rf.typ === 'rueckfrage' && rf.optionen.length === 3 && rf.optionen[2].length === 80, rf);
  pruefe('Rückfrage mit nur einer Option → nichts', RF({ typ: 'rueckfrage', frage: 'Was?', optionen: ['A'] }) === null);
  const M = __intern.gehirnMehrfach;
  const zwei = M({ befehle: [{ typ: 'abhaken', bereich: 'putzplan', was: 'Klo' }, { typ: 'frage' }, { typ: 'abhaken', bereich: 'putzplan', was: 'Handtücher' }, { typ: 'abhaken', bereich: 'putzplan', was: 'Spiegel' }] }, RF);
  pruefe('mehrere Aufträge: höchstens 3 gelesen, die Frage fällt heraus', zwei && zwei.length === 2 && zwei[1].was === 'Handtücher', zwei);
  pruefe('nur ein gültiger Auftrag → kein Mehrfach', M({ befehle: [{ typ: 'abhaken', bereich: 'putzplan', was: 'Klo' }, { typ: 'keins' }] }, RF) === null);
  pruefe('ohne befehle → kein Mehrfach', M({ typ: 'abhaken' }, RF) === null);
  /* Verlauf (20.10.2026, „er kann nicht auf vorherige nachrichten
     eingehen"): höchstens vier Wechsel, gekürzt, nur Hintergrund. */
  /* Formi per Mail (20.10.2026, aus dem Betrieb: „per Mail Aufgaben etc.
     anlegen … mit einem Geheim-Code welche die Leitung nur kennt"). */
  const CL = __intern.formiCodeLesen;
  const c1 = CL('Hallo Formi\nCode: Sommer2026!\nAufgabe für Hürth: Wasser auffüllen');
  pruefe('Mail-Code: wird gefunden und aus dem Text genommen; mit und ohne Satzzeichen geprüft',
    c1.code === 'Sommer2026!' && c1.codes.indexOf('Sommer2026') >= 0 && !/Sommer2026/.test(c1.text) && /Wasser auffüllen/.test(c1.text), c1);
  pruefe('Mail-Code: ohne „Code:" kein Code', CL('Wie wasche ich die Westen?').code === '' && CL('Der Code der Tür ist kaputt').code === '');
  pruefe('Mail-Code: auch „Geheimcode = …"', CL('geheimcode = abcd1234').code === 'abcd1234');
  const MT = __intern.formiMailText;
  pruefe('Mail-Text: Zitat und „Am … schrieb" fallen weg', MT('Neue Frage?\n\nAm 20.10.2026 um 10:00 schrieb Formi <f@g.de>:\n> alte Antwort') === 'Neue Frage?');
  pruefe('Mail-Text: Signatur ab „--" fällt weg, höchstens 2000 Zeichen', MT('Frage\n-- \nLea Meier\nTel 0123') === 'Frage' && MT('x'.repeat(5000)).length === 2000);
  const H = __intern.formiCodeHash, G = __intern.formiGleich;
  pruefe('Code-Hash: mit Salz, gleicher Code + Salz = gleicher Hash, anderes Salz = anderer', H('abc12345', 's1') === H('abc12345', 's1') && H('abc12345', 's1') !== H('abc12345', 's2') && H('abc12345', 's1').length === 64);
  pruefe('Vergleich: nur bei Gleichheit, leer ist nie gleich', G('a', 'a') && !G('a', 'b') && !G('', '') && !G(undefined, undefined));
  const RE = __intern.FORMI_MAIL_RE;
  pruefe('Mailadressen: gültig / ungültig', RE.test('lea@kformen.com') && RE.test('a.b-c@sub.domain.de') && !RE.test('keine') && !RE.test('a@b') && !RE.test('x y@z.de') && !RE.test('<a@b.de>'));
  const mailV = B({ typ: 'mail', an: 'Lea@KFormen.com', betreff: '  Schicht   morgen ', text: 'Hi Lea' }, NAM, ['studio-1'], 'mitarbeiter', '2026-10-20');
  pruefe('Aktion „mail": Adresse klein, Betreff gekürzt, nur Entwurf (keine Rolle nötig)', mailV && mailV.typ === 'mail' && mailV.an === 'lea@kformen.com' && mailV.betreff === 'Schicht morgen' && mailV.text === 'Hi Lea', mailV);
  pruefe('Aktion „mail": ohne gültige Adresse oder Text → nichts', B({ typ: 'mail', an: 'lea', text: 'x' }, NAM, ['studio-1'], 'mitarbeiter', '2026-10-20') === null && B({ typ: 'mail', an: 'a@b.de', text: ' ' }, NAM, ['studio-1'], 'mitarbeiter', '2026-10-20') === null);
  const AS = __intern.gehirnAktionSystem;
  const sysM = AS({ rolle: 'mitarbeiter', namen: { a: 'Hürth' }, erlaubt: ['a'], name: 'Lea Meier', heute: '2026-10-20' });
  const sysC = AS({ rolle: 'chef', namen: { a: 'Hürth' }, erlaubt: ['a'], name: 'Chef', heute: '2026-10-20', verlauf: [{ f: 'x', a: 'y' }] });
  pruefe('Systemtext: kennt „mail", Aufgaben nur für die Leitung, Verlauf nur wenn mitgegeben', /"typ":"mail"/.test(sysM) && !/"typ":"aufgabe"/.test(sysM) && /"typ":"aufgabe"/.test(sysC) && /Bisheriges Gespräch/.test(sysC) && !/Bisheriges Gespräch/.test(sysM) && /Lea Meier/.test(sysM));

  const VT = __intern.gehirnVerlaufText;
  pruefe('Verlauf: ohne Liste kein Text', VT() === '' && VT('x') === '' && VT([{ a: 'nur Antwort' }]) === '');
  const vt = VT([1, 2, 3, 4, 5, 6].map(n => ({ f: 'Satz ' + n + ' ' + 'x'.repeat(400), a: 'Ergebnis ' + n })));
  pruefe('Verlauf: nur die letzten vier, jeder Satz gekürzt, als Hintergrund markiert und mit Auftrag zum Ergänzen',
    !/Satz 2 /.test(vt) && /Satz 3 /.test(vt) && /Satz 6 /.test(vt) && !/x{201}/.test(vt) && /NUR Hintergrund/.test(vt) && /"frage":"die Frage als vollständiger Satz/.test(vt), vt.slice(0, 160));
  const A = __intern.gehirnAuftrag;
  pruefe('Vorname und Ton gehen an das Gehirn, Ton nur locker/sachlich', A({ text: 'x', ton: 'sachlich' }, { name: 'Lea Meier' }).body.vorname === 'Lea' &&
    A({ text: 'x', ton: 'sachlich' }, { name: 'Lea' }).body.ton === 'sachlich' && A({ text: 'x', ton: 'frech' }, { name: 'Lea' }).body.ton === 'locker');
}
console.log('── Stimme entfernt (Runde 274) ──');
{
  /* Aus dem Betrieb (24.10.2026): „das vor lesen ist auch unnötig". */
  const F = require('fs').readFileSync(require('path').join(__dirname, '..', 'functions', 'index.js'), 'utf8');
  pruefe('keine Stimm-Function mehr (gehirnStimme)', !/exports\.gehirnStimme\b/.test(F) && !__intern.gehirnStimmePruefen);
}
console.log('── Erinnerung, Tausch, Stichpunkte (20.10.2026) ──');
{
  const EP = __intern.gehirnErinnerungPruefen, J = Date.now();
  pruefe('Erinnerung: in 1 Stunde mit Text → geht', EP({ text: '  Wäsche  aufhängen ', wann: J + 3600000 }, J).text === 'Wäsche aufhängen');
  pruefe('Erinnerung: in der Vergangenheit, zu bald oder > 7 Tage → nichts', EP({ text: 'x', wann: J - 1 }, J) === null && EP({ text: 'x', wann: J + 5000 }, J) === null && EP({ text: 'x', wann: J + 8 * 86400000 }, J) === null);
  pruefe('Erinnerung: ohne Text → nichts; Text auf 140 gekürzt', EP({ text: ' ', wann: J + 3600000 }, J) === null && EP({ text: 'y'.repeat(300), wann: J + 3600000 }, J).text.length === 140);
  const NAM = { 'studio-1': 'Hürth' };
  const BB = (r) => B(r, NAM, ['studio-1'], 'mitarbeiter', '2026-10-20');
  const morgen = new Date(Date.now() + 86400000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
  const ki = BB({ typ: 'erinnerung', wann: morgen + 'T09:30', text: 'Handtücher' });
  pruefe('KI-Erinnerung „morgen 09:30" wird zur Zeit in UTC, Text bleibt', ki && ki.typ === 'erinnerung' && ki.wann > Date.now() && new Date(ki.wann).toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }) === '09:30' && ki.text === 'Handtücher', ki);
  pruefe('KI-Erinnerung mit kaputter Zeit → nichts', BB({ typ: 'erinnerung', wann: 'morgen', text: 'x' }) === null);
  pruefe('Tausch: Datum heute oder später → geht; gestern → nichts', BB({ typ: 'tausch', datum: '2026-10-25' }).datum === '2026-10-25' && BB({ typ: 'tausch', datum: '2026-10-19' }) === null);
  const ST = __intern.gehirnStichpunkteText;
  pruefe('Stichpunkte: jede Zeile mit •, Spiegelstriche weg, höchstens 8', ST('- Klo putzen\n* Handtücher fehlen\n\n• Lea kommt später') === '• Klo putzen\n• Handtücher fehlen\n• Lea kommt später' && ST(Array(12).fill('a').join('\n')).split('\n').length === 8);
  pruefe('Stichpunkte: leer → leer', ST('') === '' && ST(null) === '');
}
console.log('── Formi lernt: Leitung gibt frei (Runde 183, 22.10.2026) ──');
{
  const WP = __intern.gehirnWissenPruefen, VI = __intern.gehirnVonId;
  pruefe('unbekannte Art → nichts', WP({ art: 'loeschen', id: 3 }) === null && WP(null) === null);
  pruefe('Liste schickt nichts mit', JSON.stringify(WP({ art: 'liste', von: 'Fremd' }).body) === '{}');
  const e = WP({ art: 'entscheiden', id: '12', gut: true, inhalt: '  Neuer Text für Formi  ', vonId: 'gefälscht' });
  pruefe('Entscheiden: Nummer, ja/nein, Text gekürzt — keine Kennung vom Gerät', e.body.id === 12 && e.body.gut === true && e.body.inhalt === 'Neuer Text für Formi' && !('vonId' in e.body));
  pruefe('Entscheiden: „gut" nur bei echtem true', WP({ art: 'entscheiden', id: 4, gut: 'ja' }).body.gut === false);
  pruefe('Entscheiden ohne gültige Nummer oder mit zu kurzem Text → nichts', WP({ art: 'entscheiden', id: 0, gut: true }) === null && WP({ art: 'entscheiden', id: 2.5 }) === null && WP({ art: 'entscheiden', id: 2, gut: true, inhalt: 'kurz' }) === null);
  const v = WP({ art: 'vorschlagen', thema: 'Handtücher', inhalt: 'Handtücher liegen im Schrank links.', kategorie: 'Erfunden' });
  pruefe('Vorschlagen: genau ein Eintrag, unbekannte Kategorie → Sonstiges, Quelle fest', v.body.eintraege.length === 1 && v.body.eintraege[0].kategorie === 'Sonstiges' && v.body.quelle === 'Studioleitung (App)');
  pruefe('Vorschlagen ohne Thema oder Text → nichts', WP({ art: 'vorschlagen', thema: 'ab', inhalt: 'lang genug hier' }) === null && WP({ art: 'vorschlagen', thema: 'Thema', inhalt: 'kurz' }) === null);
  const sm = WP({ art: 'entscheiden', quelle: '  Schulung „Hygiene“ ', gut: true, inhalt: 'wird ignoriert' });
  pruefe('Sammelfreigabe: Quelle getrimmt, kein Text, „gut" nur bei true', sm.body.quelle === 'Schulung „Hygiene“' && sm.body.gut === true && !('inhalt' in sm.body) && !('id' in sm.body) && WP({ art: 'entscheiden', quelle: 'Schulung X', gut: 1 }).body.gut === false);
  pruefe('Sammelfreigabe ohne echte Quelle → nichts', WP({ art: 'entscheiden', quelle: ' a ' }) === null && WP({ art: 'entscheiden', quelle: 5 }) === null);
  pruefe('Kennung für vier Augen: stabil, nicht die uid', VI('abc') === VI('abc') && VI('abc') !== VI('abd') && !VI('abc').includes('abc') && VI('abc').length === 24);
}
console.log('── Lage aus der App (Runde 217) ──');
{
  const GA = __intern.gehirnAuftrag;
  const f = GA({ art: 'frage', text: 'was ist offen', lage: 'Aufgaben: Briefkasten' }, { name: 'Anna Test', studio: 'Hürth' });
  pruefe('Frage nimmt die Lage mit', f.body.lage === 'Aufgaben: Briefkasten');
  pruefe('Lage höchstens 9000 Zeichen', GA({ art: 'frage', text: 'x', lage: 'a'.repeat(20000) }, {}).body.lage.length === 9000);
  pruefe('ohne Lage kein Feld, Idee nie mit Lage', !('lage' in GA({ art: 'frage', text: 'x' }, {}).body) && !('lage' in GA({ art: 'idee', text: 'x', lage: 'y' }, {}).body));
  pruefe('Lage nur als Text', !('lage' in GA({ art: 'frage', text: 'x', lage: { boese: 1 } }, {}).body));
}
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


console.log('\n── Steuern: Befehle aus dem Katalog (19.10.2026) ──');
/* Aus dem Betrieb: „das die ki die ganze app steuern kann". Entschieden:
   alle, aber nur mit den eigenen Rechten; Lesen sofort, Speichern mit Vorschau. */
{
  const ERL = Object.keys(NAMEN).slice(0, 1);
  let b = B({ typ: 'navigation', ziel: 'putzplan', studio: NAMEN[ERL[0]] }, NAMEN, ERL, 'mitarbeiter', HEUTE);
  pruefe('Öffnen: Ziel aus dem Katalog, Studio aus den eigenen', b && b.typ === 'navigation' && b.ziel === 'putzplan' && b.studioKey === ERL[0], b);
  pruefe('Öffnen: unbekanntes Ziel wird verworfen', B({ typ: 'navigation', ziel: 'admin' }, NAMEN, ERL, 'chef', HEUTE) === null);
  pruefe('Öffnen: Verwaltung nicht für Mitarbeiter', B({ typ: 'navigation', ziel: 'chef' }, NAMEN, ERL, 'mitarbeiter', HEUTE) === null);
  const fremd = Object.keys(NAMEN).find(k => ERL.indexOf(k) < 0);
  b = B({ typ: 'abfrage', was: 'aufgaben', studio: NAMEN[fremd] }, NAMEN, ERL, 'mitarbeiter', HEUTE);
  pruefe('Abfrage: fremdes Studio wird nicht übernommen', b && b.typ === 'abfrage' && b.studioKey === '', b);
  pruefe('Abfrage: nur bekannte Arten', B({ typ: 'abfrage', was: 'gehaelter' }, NAMEN, ERL, 'chef', HEUTE) === null);
  const morgen = new Date(new Date(HEUTE + 'T12:00:00Z').getTime() + 864e5).toISOString().slice(0, 10);
  b = B({ typ: 'abwesenheit', art: 'urlaub', von: morgen, bis: '' }, NAMEN, ERL, 'mitarbeiter', HEUTE);
  pruefe('Abwesenheit: Urlaub ab morgen, ohne Ende = ein Tag, eigenes Studio', b && b.art === 'urlaub' && b.bis === morgen && b.studioKey === ERL[0], b);
  pruefe('Abwesenheit: Urlaub in der Vergangenheit wird verworfen', B({ typ: 'abwesenheit', art: 'urlaub', von: '2020-01-01' }, NAMEN, ERL, 'mitarbeiter', HEUTE) === null);
  pruefe('Abwesenheit: krank ab heute geht', !!B({ typ: 'abwesenheit', art: 'krank', von: HEUTE }, NAMEN, ERL, 'mitarbeiter', HEUTE));
  pruefe('Abwesenheit: Ende vor Beginn wird zu einem Tag', (B({ typ: 'abwesenheit', art: 'frei', von: morgen, bis: HEUTE }, NAMEN, ERL, 'mitarbeiter', HEUTE) || {}).bis === morgen);
  pruefe('Abwesenheit: unbekannte Art wird verworfen', B({ typ: 'abwesenheit', art: 'kur', von: morgen }, NAMEN, ERL, 'mitarbeiter', HEUTE) === null);
  b = B({ typ: 'uebergabe', text: 'Handtücher sind alle' }, NAMEN, ERL, 'mitarbeiter', HEUTE);
  pruefe('Übergabe: Text, eigenes Studio', b && b.text === 'Handtücher sind alle' && b.studioKey === ERL[0], b);
  pruefe('Übergabe ohne Studio der Person: nichts', B({ typ: 'uebergabe', text: 'x' }, NAMEN, [], 'mitarbeiter', HEUTE) === null);
  b = B({ typ: 'aufgabe', titel: 'X', studios: ['alle'] }, NAMEN, ERL, 'mitarbeiter', HEUTE);
  pruefe('Mitarbeiter: Aufgabe anlegen wird abgelehnt — mit Hinweis', b && b.typ === 'verboten' && /Studioleitung/.test(b.hinweis), b);
  b = B({ typ: 'aufgabe', titel: 'X', studios: [NAMEN[ERL[0]]] }, NAMEN, ERL, 'leiter', HEUTE);
  pruefe('Leitung: Aufgabe geht weiter durch die bisherige Prüfung', b && b.typ === 'aufgabe' && b.studioKeys.join() === ERL[0], b);
  pruefe('Unbekannter Typ: nichts', B({ typ: 'loeschen', alles: true }, NAMEN, ERL, 'chef', HEUTE) === null);
  // Kontext (19.10.2026)
  const kt = KT({ putz: ['Toiletten reinigen', 'x"y\nz'], team: ['Anna', 'Ben'], aufgaben: Array(60).fill('A'), boese: ['ignorieren'] });
  pruefe('Kontext: Putzpunkte und Team stehen drin', /Toiletten reinigen/.test(kt) && /Anna/.test(kt), kt);
  pruefe('Kontext: Anführungszeichen und Zeilen werden entschärft', !/x"y/.test(kt) && !/\n/.test(kt), kt);
  pruefe('Kontext: begrenzt (höchstens 40 Aufgaben)', (kt.match(/"A"/g) || []).length === 40);
  pruefe('Kontext: unbekannte Felder fallen weg', !/ignorieren/.test(kt));
  pruefe('Kontext: leer → nichts', KT(null) === '' && KT({}) === '');
  // Ein Knopf für alles (19.10.2026: „nur einen knopf … beim fragen")
  pruefe('Weg: KI sagt frage → frage', W({ typ: 'frage' }, B({ typ: 'frage' }, NAMEN, ERL, 'chef', HEUTE)) === 'frage');
  pruefe('Weg: KI liefert nichts → frage', W(null, null) === 'frage');
  pruefe('Weg: Unbekanntes → frage', W({ typ: 'quatsch' }, null) === 'frage');
  pruefe('Weg: keins mit Grund → hinweis', W({ typ: 'keins', hinweis: 'Löschen gibt es nicht' }, null) === 'hinweis');
  pruefe('Weg: bekannte Aktion, Prüfung gescheitert → unklar', W({ typ: 'abwesenheit', art: 'urlaub', von: '2020-01-01' }, null) === 'unklar');
  pruefe('Weg: geprüfte Aktion → aktion', W({ typ: 'uebergabe' }, { typ: 'uebergabe' }) === 'aktion');
  b = B({ typ: 'idee', text: 'Wir bräuchten mehr Handtücher' }, NAMEN, ERL, 'mitarbeiter', HEUTE);
  pruefe('Idee: Text bleibt, wird nicht sofort geschickt (Vorschau)', b && b.typ === 'idee' && /Handtücher/.test(b.text), b);
  b = B({ typ: 'abhaken', bereich: 'putzplan', was: 'Westen waschen' }, NAMEN, ERL, 'mitarbeiter', HEUTE);
  pruefe('Abhaken: Bereich und Stichwort', b && b.typ === 'abhaken' && b.bereich === 'putzplan' && b.was === 'Westen waschen', b);
  pruefe('Abhaken: unbekannter Bereich wird verworfen', B({ typ: 'abhaken', bereich: 'material', was: 'x' }, NAMEN, ERL, 'chef', HEUTE) === null);
  pruefe('Abhaken: ohne Stichwort nichts', B({ typ: 'abhaken', bereich: 'aufgabe', was: ' ' }, NAMEN, ERL, 'chef', HEUTE) === null);
  b = B({ typ: 'defekt', geraet: 'Gerät 2', text: 'piept dreimal' }, NAMEN, ERL, 'mitarbeiter', HEUTE);
  pruefe('Defekt: Gerät, Text, eigenes Studio', b && b.typ === 'defekt' && b.geraet === 'Gerät 2' && b.studioKey === ERL[0], b);
  pruefe('Defekt: ohne Gerät nichts', B({ typ: 'defekt', geraet: '', text: 'x' }, NAMEN, ERL, 'mitarbeiter', HEUTE) === null);
}

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

console.log('\n── KI-Ausfall: Ersatz und Grund ──');
/* Live am 18.10.2026: „Anlegen lassen" meldete nur „nicht geantwortet". */
pruefe('mehr als ein Modell zum Ausweichen', Array.isArray(GEMINI_MODELLE) && GEMINI_MODELLE.length >= 2, GEMINI_MODELLE);
pruefe('429 sagt: Kontingent', /Kontingent/.test(geminiFehlerText(429)), geminiFehlerText(429));
pruefe('403 sagt: Schlüssel', /Schlüssel/.test(geminiFehlerText(403)), geminiFehlerText(403));
pruefe('500 nennt die Nummer', /\(500\)/.test(geminiFehlerText(500)), geminiFehlerText(500));
pruefe('ohne Status: unlesbare Antwort', /lesbare/.test(geminiFehlerText(0)), geminiFehlerText(0));

(async () => {
  const echt = global.fetch;
  const fehlerAus = console.error; console.error = () => {};
  const antwortMit = (status, text) => ({ ok: status === 200, status,
    json: async () => status === 200 ? { candidates: [{ content: { parts: [{ text }] } }] } : { error: { message: 'x' } } });
  let gerufen = [];
  global.fetch = async (url) => { gerufen.push(url); return gerufen.length === 1 ? antwortMit(429) : antwortMit(200, '{"typ":"keins"}'); };
  const r = await geminiJson('s', 'n', 'k');
  pruefe('erstes Modell 429 → das zweite antwortet', r && r.typ === 'keins' && gerufen.length === 2 && gerufen[1].includes(GEMINI_MODELLE[1]), gerufen);
  gerufen = [];
  global.fetch = async (url) => { gerufen.push(url); return antwortMit(403); };
  let f = null; try { await geminiJson('s', 'n', 'k'); } catch (e) { f = e; }
  pruefe('Schlüssel abgelehnt → kein weiteres Modell, Grund in der Meldung', f && gerufen.length === 1 && /Schlüssel/.test(f.message), [gerufen.length, f && f.message]);
  gerufen = [];
  global.fetch = async (url) => { gerufen.push(url); return antwortMit(429); };
  f = null; try { await geminiJson('s', 'n', 'k'); } catch (e) { f = e; }
  pruefe('alle überlastet → jedes Modell versucht, Meldung „Kontingent"', f && gerufen.length === GEMINI_MODELLE.length && /Kontingent/.test(f.message), [gerufen.length, f && f.message]);
  /* Live am 18.10.2026: Gemini antwortete mit 402 (Zahlung). */
  gerufen = [];
  global.fetch = async (url) => { gerufen.push(url); return antwortMit(402); };
  f = null; try { await geminiJson('s', 'n', 'k'); } catch (e) { f = e; }
  pruefe('402 → kein weiteres Gemini-Modell, Meldung „Zahlung"', f && gerufen.length === 1 && /Zahlung/.test(f.message), [gerufen.length, f && f.message]);

  process.env.STUDIO_GEHIRN_KEY = 'test';
  gerufen = [];
  global.fetch = async (url) => { gerufen.push(url);
    if (url.includes('generativelanguage')) return antwortMit(402);
    return { ok: true, status: 200, json: async () => ({ ergebnis: { typ: 'aufgabe', titel: 'Test' } }) }; };
  const e2 = await kiJson('s', 'n', 'k');
  pruefe('Gemini 402 → Studio-Gehirn (/api/json) springt ein', e2 && e2.titel === 'Test' && gerufen.length === 2 && /\/api\/json$/.test(gerufen[1]), gerufen);
  /* Nach 402 fragt kiJson Gemini 30 Minuten nicht mehr (19.10.2026,
     „die ki braucht echt lang"). */
  pruefe('nach 402 ist Gemini gesperrt', geminiGesperrt());
  gerufen = [];
  global.fetch = async (url) => { gerufen.push(url); return { ok: true, status: 200, json: async () => ({ ergebnis: { typ: 'x' } }) }; };
  await kiJson('s', 'n', 'k');
  pruefe('… gesperrt: direkt das Studio-Gehirn, kein Gemini-Aufruf', gerufen.length === 1 && /\/api\/json$/.test(gerufen[0]), gerufen);
  geminiSperreAufheben();

  geminiSperreAufheben();
  gerufen = [];
  global.fetch = async (url) => { gerufen.push(url);
    if (url.includes('generativelanguage')) return antwortMit(402);
    return { ok: false, status: 404, json: async () => ({}) }; };
  f = null; try { await kiJson('s', 'n', 'k'); } catch (e) { f = e; }
  pruefe('beide aus → Meldung trägt den Gemini-Grund', f && /Zahlung/.test(f.message), f && f.message);

  gerufen = [];
  global.fetch = async (url) => { gerufen.push(url); return { ok: true, status: 200, json: async () => ({ ergebnis: { typ: 'keins' } }) }; };
  const e3 = await kiJson('s', 'n', '');
  pruefe('ohne Gemini-Schlüssel direkt das Studio-Gehirn', e3 && e3.typ === 'keins' && gerufen.length === 1, gerufen);
  delete process.env.STUDIO_GEHIRN_KEY;

  /* formiMail: ohne eingerichteten oder mit falschem Schlüssel kommt
     niemand durch; eine ungültige Absenderadresse bekommt keine Antwort. */
  const FM = require('../functions/index.js').formiMail;
  const anruf = (kopf, body) => new Promise((fertig) => {
    const res = { code: 200, status(c) { this.code = c; return this; }, json(d) { fertig({ code: this.code, d }); }, send(d) { fertig({ code: this.code, d }); } };
    FM({ method: 'POST', get: (k) => kopf[k.toLowerCase()], body }, res);
  });
  delete process.env.FORMI_MAIL_TOKEN;
  pruefe('formiMail ohne FORMI_MAIL_TOKEN: 503, nichts passiert', (await anruf({ 'x-formi-token': 'egal' }, { von: 'a@b.de', text: 'x' })).code === 503);
  process.env.FORMI_MAIL_TOKEN = 'richtig-123';
  pruefe('formiMail mit falschem Schlüssel: 401', (await anruf({ 'x-formi-token': 'falsch' }, { von: 'a@b.de', text: 'x' })).code === 401);
  pruefe('formiMail ohne Schlüssel: 401', (await anruf({}, { von: 'a@b.de', text: 'x' })).code === 401);
  const still = await anruf({ 'x-formi-token': 'richtig-123' }, { von: 'kein-absender', text: 'x' });
  pruefe('formiMail mit ungültigem Absender: keine Antwort („still")', still.code === 200 && still.d && still.d.still === true, still);
  delete process.env.FORMI_MAIL_TOKEN;

  global.fetch = echt; console.error = fehlerAus;
  ende();
})();

function ende() {
console.log(schlecht
  ? '\n✗ Studio-Gehirn Rechnung: ' + schlecht + ' von ' + (gut + schlecht) + ' falsch'
  : '\n✓ Studio-Gehirn Rechnung: Vorschläge harmlos, Bericht ehrlich — ' + gut + ' Zusicherungen');
process.exit(schlecht ? 1 : 0);
}
