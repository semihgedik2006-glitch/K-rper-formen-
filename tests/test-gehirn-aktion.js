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
const { gehirnBefehlPruefen: B, gehirnVorschlagPruefen: P, lageberichtOhneKi, geminiFehlerText, GEMINI_MODELLE, geminiJson, kiJson } = __intern;

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

  global.fetch = echt; console.error = fehlerAus;
  ende();
})();

function ende() {
console.log(schlecht
  ? '\n✗ Studio-Gehirn Rechnung: ' + schlecht + ' von ' + (gut + schlecht) + ' falsch'
  : '\n✓ Studio-Gehirn Rechnung: Vorschläge harmlos, Bericht ehrlich — ' + gut + ' Zusicherungen');
process.exit(schlecht ? 1 : 0);
}
