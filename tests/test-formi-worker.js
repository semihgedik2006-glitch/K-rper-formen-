/* Prüft den Cloudflare Worker „studio-gehirn" (tools/studio-gehirn/worker.js)
   ohne Cloudflare: D1 wird durch node:sqlite mit demselben Schema ersetzt,
   Workers AI durch eine Attrappe, die vorgegebene Antworten liefert und
   mitschreibt, was gefragt wurde.

   Was das NICHT prüft: wie die echten Modelle (Llama 3.3, Gemma) auf den
   neuen Systemtext reagieren. Das zeigt erst der Verlauf im Leitstand
   nach dem Einspielen.

   Aufruf: node tests/test-formi-worker.js */
'use strict';
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const WURZEL = path.join(__dirname, '..', 'tools', 'studio-gehirn');
let fehler = 0, ok = 0;
function pruefe(bedingung, text) {
  if (bedingung) { ok++; console.log('  ✓ ' + text); }
  else { fehler++; console.log('  ✗ ' + text); }
}

/* D1-Ersatz: prepare(sql).bind(...).run()/first()/all() */
function d1() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(WURZEL, 'schema.sql'), 'utf8').replace(/unixepoch\(\) \* 1000/g, String(Date.now())));
  const stmt = (sql, werte) => ({
    bind: (...w) => stmt(sql, w),
    run: async () => { const r = db.prepare(sql).run(...(werte || [])); return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; },
    first: async () => db.prepare(sql).get(...(werte || [])) || null,
    all: async () => ({ results: db.prepare(sql).all(...(werte || [])) }),
  });
  return { prepare: sql => stmt(sql), roh: db };
}

/* Workers-AI-Ersatz: liefert der Reihe nach die vorgegebenen Antworten. */
function ki(antworten) {
  const gefragt = [];
  return {
    gefragt,
    run: async (modell, eingabe) => {
      gefragt.push({ modell, eingabe });
      const a = antworten.length ? antworten.shift() : '';
      return { response: typeof a === 'string' ? a : JSON.stringify(a) };
    },
  };
}

(async () => {
  const w = await import(path.join(WURZEL, 'worker.js'));

  console.log('Rein rechnerisch');
  pruefe(w.vornameSauber('Mail') === '', '„Mail" ist kein Vorname (kam bei Formi-Mails als Name an)');
  pruefe(w.vornameSauber('Unbekannt') === '', '„Unbekannt" ist kein Vorname');
  pruefe(w.vornameSauber('Semih') === 'Semih', 'echter Vorname bleibt');
  pruefe(w.kanalVon('studiochat', 'studiochat:Mail max') === 'mail', 'Mail wird am Absender erkannt');
  pruefe(w.kanalVon('studiochat', 'studiochat:Semih Gedik') === 'app', 'App bleibt App');
  pruefe(w.istUnsinn('dfsgshjsh'), '„dfsgshjsh" ist Tastatursalat (live 21.10.)');
  pruefe(!w.istUnsinn('was geht'), '„was geht" ist kein Salat');
  pruefe(!w.istUnsinn('Wie wasche ich die Westen?'), 'echte Frage ist kein Salat');
  pruefe(!w.istUnsinn('Staubsaugerbeutel'), 'langes deutsches Wort ist kein Salat');
  pruefe(!w.istUnsinn('ok'), '„ok" geht an die KI (Smalltalk), nicht an die Salat-Antwort');

  /* Die echten Antworten aus dem Leitstand-Verlauf, 18.–21.10.2026 */
  const faelle = [
    ['Hallo, ich bin Semih. Ich kann dir bei Fragen rund um das Studio helfen.', 'Semih', 'Hallo! Ich kann dir bei Fragen rund um das Studio helfen.'],
    ['Hallo, ich bin Mail. Leider kann ich dir nicht genau sagen, wann wir aufhaben.', 'Mail', 'Hallo! Leider kann ich dir nicht genau sagen, wann wir aufhaben.'],
    ['Hallo Semih, ich bin das Studio-Gehirn, dein digitaler Assistent. Ich helfe dir.', 'Semih', 'Hallo Semih! Ich helfe dir.'],
    ['Ich bin Semih. Für Hürth kannst du die Aufgaben einsehen.', 'Semih', 'Für Hürth kannst du die Aufgaben einsehen.'],
    ['So wäschst du die Westen: 1. Schonprogramm.', 'Semih', 'So wäschst du die Westen: 1. Schonprogramm.'],
  ];
  for (const [roh, vorname, soll] of faelle) {
    const ist = w.vorstellungEntfernen(roh, vorname);
    pruefe(ist === soll, 'Vorstellung entfernt: „' + roh.slice(0, 40) + '…" → „' + ist.slice(0, 50) + '"');
  }
  pruefe(w.vorstellungEntfernen('Ich bin mir nicht sicher, frag die Leitung.', 'Semih') === 'Ich bin mir nicht sicher, frag die Leitung.', '„Ich bin mir nicht sicher" bleibt stehen');

  pruefe(!w.brauchtPruefung({ art: 'smalltalk', abgedeckt: false }), 'Smalltalk wird keine offene Frage');
  pruefe(!w.brauchtPruefung({ art: 'unklar', abgedeckt: false }), 'Unklares wird keine offene Frage');
  pruefe(!w.brauchtPruefung({ art: 'kunde', abgedeckt: false }), 'Kundenmail wird keine offene Frage');
  pruefe(w.brauchtPruefung({ art: 'frage', abgedeckt: false }), 'echte Frage ohne Wissen geht an Semih');
  pruefe(!w.brauchtPruefung({ art: 'frage', abgedeckt: true }), 'Frage aus dem Wissen geht nicht an Semih');

  const sys = w.formiSystem({ ton: 'locker', vorname: 'Semih', kanal: 'app' });
  pruefe(/Du heißt Formi/.test(sys), 'Systemtext: Name Formi');
  pruefe(/Du bist NICHT Semih/.test(sys), 'Systemtext: KI ist nicht der Fragende');
  pruefe(!/mit dem Vornamen/.test(sys), 'Systemtext: kein „Einstieg mit dem Vornamen" mehr');
  pruefe(/Aufgaben und Ankündigungen anlegen/.test(sys), 'Systemtext: kennt das Anlegen (stand vorher „kann ich nicht")');
  pruefe(/NICHTS erfinden/.test(sys), 'Systemtext: nichts Internes erfinden');
  /* 2.11, live am 22.10.2026: „was kannst du alles" kam aus einem alten
     Wissenseintrag („Abläufe, Geräte, Hygiene …"), und „wie lege ich eine
     Aufgabe an" lautete „Das Studio-Wissen sagt leider nichts …". */
  pruefe(/IMMER aus dieser Liste/.test(sys), 'Systemtext: „was kannst du" kommt aus der Liste, nicht aus altem Wissen');
  pruefe(/Leg eine Aufgabe an:/.test(sys), 'Systemtext: zeigt, wie man Formi etwas anlegen lässt');
  pruefe(/Sprich nie vom "Studio-Wissen"/.test(sys), 'Systemtext: kein „Das Studio-Wissen sagt"');
  const sysMail = w.formiSystem({ ton: 'locker', vorname: 'Mail', kanal: 'mail' });
  pruefe(!/heißt Mail/.test(sysMail) && /kennst du nicht/.test(sysMail), 'Mail: kein Vorname „Mail"');
  pruefe(/\d{1,2}:\d{2} Uhr$/.test(w.jetztText(Date.UTC(2026, 9, 22, 12, 5))), 'Uhrzeit in Köln: ' + w.jetztText(Date.UTC(2026, 9, 22, 12, 5)));
  pruefe(/14:05/.test(w.jetztText(Date.UTC(2026, 9, 22, 12, 5))), 'Sommerzeit: 12:05 UTC ist 14:05 in Köln');

  pruefe(!w.whatsappAktiv({}), 'WhatsApp ohne WA_AKTIV aus');
  pruefe(w.whatsappAktiv({ WA_AKTIV: '1' }), 'WhatsApp mit WA_AKTIV=1 an');

  console.log('\nDurch die echte Schnittstelle /api/frage (D1 = sqlite, KI = Attrappe)');
  const sendungen = [];
  const altFetch = global.fetch;
  global.fetch = async (url) => { sendungen.push(String(url)); return { ok: false, status: 401, text: async () => '{}', json: async () => ({}) }; };
  const env = { DB: d1(), STUDIO_KEY: 'test-schluessel', WA_TOKEN: 'x', ADMIN_NUMBERS: '4917600000000' };
  const frage = async (text, name, kiAntworten) => {
    env.AI = ki(kiAntworten);
    const r = await w.default.fetch(new Request('https://x.test/api/frage', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-studio-key': 'test-schluessel' },
      body: JSON.stringify({ frage: text, name, studio: 'Hürth', vorname: name.split(' ')[0] }),
    }), env, { waitUntil() {} });
    return { status: r.status, daten: await r.json(), ki: env.AI.gefragt };
  };
  const offen = () => env.DB.roh.prepare("SELECT COUNT(*) AS n FROM offen WHERE status = 'offen'").get().n;

  let r = await frage('was geht', 'Semih Gedik', [{ antwort: 'Hey Semih! Alles gut hier. Was steht an?', art: 'smalltalk', abgedeckt: false, quellen: [] }]);
  pruefe(r.status === 200 && !r.daten.offenId && offen() === 0, 'Smalltalk: Antwort, aber keine offene Frage');
  pruefe(!/Noch nicht geprüft/.test(r.daten.antwort), 'Smalltalk: kein „Noch nicht geprüft"');

  r = await frage('dfsgshjsh', 'Semih Gedik', []);
  pruefe(r.ki.length === 0 && offen() === 0, 'Tastatursalat: keine KI, keine offene Frage');

  r = await frage('Wie lege ich eine Aufgabe an?', 'Semih Gedik', [{ antwort: 'Hallo, ich bin Semih. Das weiß ich noch nicht, ich gebe es an Semih.', art: 'frage', abgedeckt: false, quellen: [] }]);
  pruefe(offen() === 1 && /Noch nicht geprüft/.test(r.daten.antwort), 'echte Frage ohne Wissen: offene Frage für Semih');
  pruefe(!/^Hallo, ich bin Semih/.test(r.daten.antwort), 'falsche Vorstellung wird entfernt: „' + r.daten.antwort.slice(0, 45) + '…"');
  const user = r.ki[0].eingabe.messages[1].content;
  pruefe(/^JETZT: /.test(user), 'KI bekommt Datum und Uhrzeit');
  pruefe(/Semih: was geht\nFormi: /.test(user), 'Verlauf heißt „Formi", nicht „Gehirn"');

  r = await frage('Sehr geehrtes Team, ich interessiere mich für Ihr EMS-Training. Was kostet es?', 'Mail kunde123', [{ antwort: 'Danke für die Nachricht! Hier schreibt der interne Assistent des Teams. Das Studio meldet sich bei Ihnen.', art: 'kunde', abgedeckt: false, quellen: [] }]);
  pruefe(offen() === 1, 'Kundenmail: keine offene Frage');
  pruefe(/Kanal: E-Mail/.test(r.ki[0].eingabe.messages[0].content), 'Kundenmail: KI weiß, dass es eine Mail ist');
  pruefe(!/heißt Mail/.test(r.ki[0].eingabe.messages[0].content), 'Kundenmail: „Mail" ist kein Name');

  const vorher = env.DB.roh.prepare("SELECT COUNT(*) AS n FROM nachrichten WHERE typ = 'zustellfehler'").get().n;
  pruefe(sendungen.length === 0 && vorher === 0, 'ohne WA_AKTIV kein WhatsApp-Versand und kein Zustellfehler im Verlauf');

  env.WA_AKTIV = '1';
  await frage('Was mache ich wenn das Kabel kaputt ist?', 'Anna Test', [{ antwort: 'Weiß ich noch nicht.', art: 'frage', abgedeckt: false, quellen: [] }]);
  pruefe(sendungen.some(u => /graph\.facebook\.com/.test(u)), 'mit WA_AKTIV=1 geht die Meldung an die Admins wieder raus');
  global.fetch = altFetch;

  console.log(`\n${ok} bestanden, ${fehler} fehlgeschlagen`);
  process.exit(fehler ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
