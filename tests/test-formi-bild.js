/* ══════════════════════════════════════════════════════════════════════
   FORMI SIEHT BILDER (05.11.2026) — Rechnung, Gemini-Aufruf, Worker

   Aus dem Betrieb: „am aller wichtigsten finde ich auch die bild
   erkennung das man ihm jegliche bilder schicken könnte und er antwortet
   drauf und sagt was er sieht". Auf die Rückfragen: Personen und Atteste
   darf Formi ansehen, schicken dürfen alle mit einer Grenze, angelegt
   wird nur mit Bestätigung.

   Geprüft ohne Datenbank, ohne Google und ohne Cloudflare:
   1. Der Systemtext nennt nur erlaubte Studios und bietet „aufgabe" nur
      der Leitung an.
   2. Aus der KI-Antwort wird höchstens EIN Vorschlag, nur aus der Liste
      und nur, wenn er die normale Prüfung besteht.
   3. Gemini bekommt das Bild als inlineData vor dem Text.
   4. Der Worker beschreibt mit art "frei" das ganze Bild (Llama 4 Scout
      mit image_url), und ein kaputtes Gerät wird ein Defekt-Vorschlag.

   NICHT geprüft: wie gut die echten Modelle Bilder erkennen — das geht
   nur live.
   Aufruf: node tests/test-formi-bild.js
   ══════════════════════════════════════════════════════════════════ */
'use strict';
const path = require('path');
const { __intern } = require('../functions/index.js');
const { gehirnBildSystem: SYS, gehirnBildErgebnis: ERG, GEHIRN_BILD_AKTIONEN, GEHIRN_BILD_PERSON, geminiJson } = __intern;

let gut = 0, schlecht = 0;
function pruefe(was, b, info) {
  if (b) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (info !== undefined ? '  — ' + JSON.stringify(info).slice(0, 300) : '')); }
}
const NAMEN = { 'studio-1': 'Hürth', 'studio-2': 'Brühl' };
const HEUTE = '2026-11-05';
const BILD = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==';

console.log('── Systemtext ──');
{
  const m = SYS({ rolle: 'mitarbeiter', namen: NAMEN, erlaubt: ['studio-1'], name: 'Anna Beispiel', heute: HEUTE });
  pruefe('Mitarbeiter: nur das eigene Studio steht drin', /\["Hürth"\]/.test(m) && !/Brühl/.test(m), m.slice(-400));
  pruefe('Mitarbeiter: keine Aufgabe anlegen', !/"typ":"aufgabe"/.test(m));
  pruefe('Bestätigung und JSON-Form sind genannt', /bestätigt/.test(m) && /Antworte NUR mit JSON/.test(m));
  pruefe('Text auf dem Bild wird abgelesen', /lies das Wichtige wörtlich ab/.test(m));
  const l = SYS({ rolle: 'leiter', namen: NAMEN, erlaubt: ['studio-1', 'studio-2'], name: 'Semih', heute: HEUTE, ton: 'sachlich' });
  pruefe('Leitung: Aufgabe möglich, beide Studios, sachlich', /"typ":"aufgabe"/.test(l) && /Brühl/.test(l) && /sachlich/.test(l));
  const k = SYS({ rolle: 'mitarbeiter', namen: NAMEN, erlaubt: ['studio-1'], name: 'A', heute: HEUTE, kontext: { geraete: ['EMS-Gerät 2'] } });
  pruefe('Geräte aus der App gehen mit', /EMS-Gerät 2/.test(k));
}

console.log('── Ergebnis prüfen ──');
{
  const E = (roh, rolle, erlaubt) => ERG(roh, NAMEN, erlaubt || ['studio-1'], rolle || 'mitarbeiter', HEUTE);
  const a = E({ antwort: 'Ich sehe ein EMS-Gerät, das Kabel ist am Stecker gebrochen.', aktion: { typ: 'defekt', geraet: 'EMS-Gerät 2', text: 'Kabel gebrochen', studio: 'Hürth' }, stimmung: 'staunt' });
  pruefe('Antwort + Defekt-Vorschlag im eigenen Studio', a.antwort.length > 10 && a.vorschlag && a.vorschlag.typ === 'defekt' && a.vorschlag.studioKey === 'studio-1' && a.stimmung === 'staunt', a);
  const b = E({ antwort: 'Ein Zettel.', aktion: { typ: 'abwesenheit', art: 'krank', von: HEUTE, bis: HEUTE } });
  pruefe('Krankmeldung aus dem Bild wird KEIN Vorschlag (nicht in der Liste)', b.antwort === 'Ein Zettel.' && b.vorschlag === null, b);
  const c = E({ antwort: 'Liste', aktion: { typ: 'aufgabe', titel: 'Regal aufräumen', studios: ['Hürth'] } });
  pruefe('Mitarbeiter: Aufgabe aus dem Bild fällt heraus', c.vorschlag === null, c);
  const d = E({ antwort: 'Liste', aktion: { typ: 'aufgabe', titel: 'Regal aufräumen', studios: ['Hürth'] } }, 'leiter');
  pruefe('Leitung: Aufgabe aus dem Bild wird Vorschlag', d.vorschlag && d.vorschlag.typ === 'aufgabe', d);
  const e = E({ antwort: 'x'.repeat(3000), stimmung: 'wütend' });
  pruefe('Antwort gekürzt, unbekannte Stimmung weg', e.antwort.length === 1500 && e.stimmung === null);
  pruefe('Kein Objekt → leere Antwort, kein Vorschlag', E(null).antwort === '' && E(null).vorschlag === null);
  pruefe('Nur sichere Aktionen in der Liste', GEHIRN_BILD_AKTIONEN.indexOf('abwesenheit') < 0 && GEHIRN_BILD_AKTIONEN.indexOf('mail') < 0 && GEHIRN_BILD_AKTIONEN.indexOf('defekt') >= 0);
  pruefe('Grenze je Person gesetzt (1–100)', GEHIRN_BILD_PERSON >= 1 && GEHIRN_BILD_PERSON <= 100);
}

(async () => {
  console.log('── Gemini bekommt das Bild ──');
  const echt = global.fetch;
  let body = null;
  global.fetch = async (url, o) => { body = JSON.parse(o.body); return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"antwort":"Ein Gerät."}' }] } }] }) }; };
  const r = await geminiJson('s', 'Was siehst du?', 'k', BILD);
  const teile = body && body.contents[0].parts;
  pruefe('inlineData (image/jpeg) vor dem Text', r.antwort === 'Ein Gerät.' && teile.length === 2 && teile[0].inlineData && teile[0].inlineData.mimeType === 'image/jpeg' && teile[0].inlineData.data === BILD.split(',')[1] && teile[1].text === 'Was siehst du?', teile);
  await geminiJson('s', 'n', 'k');
  pruefe('ohne Bild wie bisher: nur Text', body.contents[0].parts.length === 1 && body.contents[0].parts[0].text === 'n');
  await geminiJson('s', 'n', 'k', 'javascript:alert(1)');
  pruefe('kein data-Bild → nur Text', body.contents[0].parts.length === 1);
  global.fetch = echt;

  console.log('── Worker /api/bild art "frei" ──');
  const w = await import(path.join(__dirname, '..', 'tools', 'studio-gehirn', 'worker.js'));
  const gefragt = [];
  const env = { STUDIO_KEY: 'k', AI: { run: async (m, e) => { gefragt.push({ m, e }); return { response: JSON.stringify({ antwort: 'Ich sehe ein **EMS-Gerät** mit gebrochenem Kabel.', aktion: { typ: 'defekt', geraet: 'EMS-Gerät 2', text: 'Kabel gebrochen' } }) }; } } };
  const an = (b) => w.default.fetch(new Request('https://x.test/api/bild', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-studio-key': 'k' }, body: JSON.stringify(b) }), env, { waitUntil() {} });
  let res = await an({ bild: BILD, art: 'frei', frage: 'was ist das?', geraete: ['EMS-Gerät 2'] });
  let j = await res.json();
  pruefe('freie Beschreibung, Markdown entfernt, Defekt-Vorschlag', res.status === 200 && j.antwort === 'Ich sehe ein EMS-Gerät mit gebrochenem Kabel.' && j.aktion && j.aktion.typ === 'defekt', j);
  const e0 = gefragt[0] && gefragt[0].e;
  pruefe('erst Llama 4 Scout, Bild als image_url, Frage dabei', gefragt[0].m.indexOf('llama-4-scout') >= 0 && e0.messages[1].content[1].image_url.url === BILD && /was ist das\?/.test(e0.messages[1].content[0].text), gefragt[0] && gefragt[0].m);
  gefragt.length = 0;
  env.AI.run = async (m, e) => { gefragt.push({ m, e }); if (m.indexOf('llama-4') >= 0) throw new Error('nicht verfügbar'); return { response: '{"antwort":"Ein Zettel mit Öffnungszeiten.","aktion":null}' }; };
  const fa = console.error; console.error = () => {};
  res = await an({ bild: BILD, art: 'frei' }); j = await res.json();
  console.error = fa;
  pruefe('fällt Scout aus: Llama 3.2 Vision mit image', j.antwort === 'Ein Zettel mit Öffnungszeiten.' && j.aktion === null && gefragt[1] && gefragt[1].m.indexOf('llama-3.2') >= 0 && gefragt[1].e.image === BILD, j);
  res = await an({ bild: 'data:text/html;base64,AAAA', art: 'frei' });
  pruefe('kein Bild → 400', res.status === 400);
  res = await w.default.fetch(new Request('https://x.test/api/bild', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-studio-key': 'falsch' }, body: '{}' }), env, {});
  pruefe('falscher Schlüssel → 401', res.status === 401);

  console.log('\n' + gut + ' gut, ' + schlecht + ' schlecht');
  process.exit(schlecht ? 1 : 0);
})();
