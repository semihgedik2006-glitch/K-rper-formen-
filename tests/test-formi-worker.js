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
  /* 2.19 (23.10.2026, aus dem Betrieb: „er soll eher so wie chat gpt sein
     nur mit dem wissen von uns" — und auf die Rückfrage: „nur soll er es
     betonen wenn es nicht geprüft ist aber trotzdem antworten"). Vorher
     hiess die Regel „NICHTS erfinden" und Formi sagte oft nur „weiss ich
     nicht". Jetzt: immer antworten, Ungeprüftes kennzeichnen — konkrete
     Preise, Nummern und Namen bleiben tabu. */
  pruefe(/Nicht geprüft:/.test(sys) && /Erfinde trotzdem nie konkrete Preise, Telefonnummern/.test(sys), 'Systemtext: immer antworten, Ungeprüftes kennzeichnen, keine erfundenen Preise/Nummern');
  pruefe(/APP-LAGE/.test(sys) && /"grundlage"/.test(sys) && /wie ChatGPT/.test(sys), 'Systemtext: App-Lage, Grundlage, frei wie ChatGPT');
  pruefe(!w.brauchtPruefung({ art: 'frage', abgedeckt: false, grundlage: 'allgemein' }) && !w.brauchtPruefung({ art: 'frage', abgedeckt: false, grundlage: 'app' }) && w.brauchtPruefung({ art: 'frage', abgedeckt: false, grundlage: 'unsicher' }), 'Nur Ungeprüftes über unser Studio geht an Semih — Allgemeines und App-Lage nicht');
  /* 2.21 (23.10.2026, „gib formi nur noch mehr emotions und persönlichere
     und längere antworten"). */
  pruefe(/GEFÜHLE UND NÄHE/.test(sys) && /"stimmung"/.test(sys) && /80–200 Wörter/.test(sys) && /nenne nie IDs/.test(sys), 'Systemtext: Gefühle, Nähe, länger, keine IDs in der Antwort');
  pruefe(w.kiErgebnis({ antwort: 'x', art: 'frage', stimmung: 'begeistert', quellen: [] }, '', []).stimmung === 'begeistert' && w.kiErgebnis({ antwort: 'x', art: 'frage', stimmung: 'wütend', quellen: [] }, '', []).stimmung === null, 'Stimmung nur aus der festen Liste');
  /* 2.22: live kam trotz Anweisung „(ID 7)" und „(vgl. ID 57)" in Antworten. */
  pruefe(w.idsEntfernen('Lass ihn ausreden (ID 7). Trennen (vgl. ID 57). Siehe [ID 12, 13] bitte') === 'Lass ihn ausreden. Trennen. Siehe bitte' && w.idsEntfernen('Gerät Nr 5 piept') === 'Gerät Nr 5 piept', 'IDs in Klammern verschwinden, „Gerät Nr 5" bleibt');
  /* 2.27, live am 25.10.: „die Notfall-Abläufe (z. B. ID 97/175) befolgen". */
  pruefe(w.idsEntfernen('die Abläufe (z. B. ID 97/175) befolgen') === 'die Abläufe befolgen', '„(z. B. ID 97/175)" verschwindet auch');
  pruefe(w.kiErgebnis({ antwort: 'Mach das so (ID 3).', art: 'frage', quellen: [] }, '', []).antwort === 'Mach das so.', 'die Antwort kommt ohne ID');
  pruefe(/Kündige einen Witz nie an/.test(sys), 'Systemtext: Witze nicht ankündigen, bei Stress keiner');
  const kg = w.kiErgebnis({ antwort: 'x', art: 'frage', grundlage: 'erfunden', abgedeckt: false, quellen: [] }, '', []);
  pruefe(kg.grundlage === 'unsicher', 'unbekannte Grundlage → „unsicher" (lieber an Semih als still)');
  /* 2.11, live am 22.10.2026: „was kannst du alles" kam aus einem alten
     Wissenseintrag („Abläufe, Geräte, Hygiene …"), und „wie lege ich eine
     Aufgabe an" lautete „Das Studio-Wissen sagt leider nichts …". */
  pruefe(/IMMER aus dieser Liste/.test(sys), 'Systemtext: „was kannst du" kommt aus der Liste, nicht aus altem Wissen');
  pruefe(/Leg eine Aufgabe an:/.test(sys), 'Systemtext: zeigt, wie man Formi etwas anlegen lässt');
  pruefe(/Sprich nie vom "Studio-Wissen"/.test(sys), 'Systemtext: kein „Das Studio-Wissen sagt"');
  /* 2.18: Charakter „Kumpel aus dem Studio" — nur locker, Ernstes zuerst. */
  const sysSach = w.formiSystem({ ton: 'sachlich', vorname: 'Semih', kanal: 'app' });
  pruefe(/Kumpel aus dem Studio/.test(sys) && !/Kumpel aus dem Studio/.test(sysSach), 'Charakter nur im lockeren Ton');
  pruefe(sys.indexOf('ERNST GEHT VOR') >= 0 && sys.indexOf('ERNST GEHT VOR') < sys.indexOf('Running Gags'), 'Charakter: Ernstes (Notfall, Gesundheit) steht vor jedem Spruch');
  pruefe(/NACH der Antwort, nie statt ihr/.test(sys) && /nicht so, als wärst du ein Mensch/.test(sys), 'Charakter: Antwort zuerst, keine vorgetäuschte Menschlichkeit');
  const sysMail = w.formiSystem({ ton: 'locker', vorname: 'Mail', kanal: 'mail' });
  pruefe(!/heißt Mail/.test(sysMail) && /kennst du nicht/.test(sysMail), 'Mail: kein Vorname „Mail"');
  pruefe(/\d{1,2}:\d{2} Uhr$/.test(w.jetztText(Date.UTC(2026, 9, 22, 12, 5))), 'Uhrzeit in Köln: ' + w.jetztText(Date.UTC(2026, 9, 22, 12, 5)));
  pruefe(/14:05/.test(w.jetztText(Date.UTC(2026, 9, 22, 12, 5))), 'Sommerzeit: 12:05 UTC ist 14:05 in Köln');

  /* 2.12, live am 22.10.2026: „was tun wenn kunde lws hat" fand den
     Eintrag mit genau diesem Thema nicht — und die KI verweigerte bei
     Gesundheit selbst gefundenes Vorgehen. */
  const roh = [
    { thema: 'ein kunde will kündigen was soll ich machen', inhalt: 'Kunde fragen' },
    { thema: 'Was darf ich ins Studio-Gehirn schreiben?', inhalt: 'Keine Kundennamen' },
    { thema: 'was tun wenn kunde lws hat', inhalt: 'So gehst du vor' },
  ];
  pruefe(w.wissenRangieren(roh, w.suchbegriffe('was tun wenn kunde lws hat'))[0].thema === 'was tun wenn kunde lws hat', 'seltenes Wort im Thema (LWS) kommt nach vorn');
  pruefe(w.wissenRangieren(roh, w.suchbegriffe('kunde will kündigen'))[0].thema.startsWith('ein kunde will'), 'Gegenprobe: Kündigung bleibt vorn');
  pruefe(/Vorgehen für GENAU diese Situation[^\n]*gilt es — vollständig, mit den Schritten/.test(sys), 'Systemtext: ein passendes Gesundheits-Vorgehen aus dem Wissen wird vollständig wiedergegeben');
  /* 2.25. Aus dem Betrieb (24.10.2026): „ich hatte heute gefragt was ich tun soll wenn ein Kunde mitten im
     Training Durchfall hat und er meinte ich soll keine Kunden Daten weiter geben … und danach meinte er ich
     soll die Person hinsetzten was auch kein Sinn macht" — Ziel: „das Formi so wie du ist und auch rück Fragen
     stellt und wirklich versteht was ich meine". Rückfragen: „Nur wenn es wirklich zählt"; Gesundheit ohne
     Wissen: „Gesunder Menschenverstand + Hinweis". Was die echte KI daraus macht, prüft nur die Probe live. */
  pruefe(/Schwindel passt nicht zu Durchfall/.test(sys) && /Unpassendes lässt du komplett weg/.test(sys), 'Systemtext: nur Wissen, das zu GENAU dieser Situation passt (Schwindel ≠ Durchfall)');
  pruefe(/KEIN Datenschutzproblem — dann kein Hinweis/.test(sys) && !/Gesundheitsdaten nie per WhatsApp verschicken\./.test(sys), 'Systemtext: Datenschutz nur, wenn wirklich etwas weitergegeben wird');
  pruefe(/EINE kurze, konkrete Rückfrage/.test(sys) && /Fehlt nichts Entscheidendes, frag nicht/.test(sys), 'Systemtext: Rückfrage nur, wenn sie die Antwort ändert');
  pruefe(/praktische, vernünftige erste Schritte/.test(sys) && /Beginne dann mit "Nicht geprüft:"/.test(sys) && /Keine Diagnosen, keine Medikamente/.test(sys), 'Systemtext: Gesundheit ohne Wissen — gesunder Menschenverstand, markiert, ohne Diagnose');
  pruefe(/durchfall/.test(sys) && /"hinsetzen lassen" ist der Ablauf bei Schwindel/.test(sys), 'Systemtext: das Durchfall-Beispiel mit gutem und schlechtem Weg steht drin');
  pruefe(w.kiWissen(Array.from({ length: 8 }, (_, i) => ({ thema: 't' + i, inhalt: 'x'.repeat(100) }))).length === 5 && w.kiWissen([{ thema: 'a', inhalt: 'x'.repeat(9000) }, { thema: 'b', inhalt: 'y' }]).length === 1, 'an die KI höchstens 5 Einträge und 7.000 Zeichen (ein langer bleibt)');
  pruefe(w.kiWissen([{ thema: 'Quiz', inhalt: 'Richtig ist: In der App nachsehen.' }, { thema: 'Gerät aus', inhalt: '1. Akku prüfen' }])[0].thema === 'Gerät aus', '2.26: Einträge aus Schulungsfragen („Richtig ist:") kommen hinter echte Abläufe');
  pruefe(/nach dem Training stoppt man kein Training mehr/.test(sys) && /Verweise nie NUR auf eine andere Stelle/.test(sys) && /Kein Schluss-Absatz "Kurz gesagt/.test(sys), '2.26: Zeitpunkt beachten, nicht nur verweisen, kein „Kurz gesagt"');
  /* 2.27. Aus dem Betrieb (25.10.2026): „wir sorgen einfach dafür das er schritt für schritt besser wird …
     aber mann soll es merken auch". Gemessen: fast jede Antwort eine 5–7-Punkte-Liste mit „dokumentieren"
     und „Soll ich das als Aufgabe anlegen?"; „kann ich morgen früher gehen" versprach Unmögliches. */
  pruefe(/Fließtext statt Liste/.test(sys) && /höchstens 5 kurze Schritte/.test(sys), '2.27: Fließtext statt Liste, Liste nur für echte Abläufe');
  pruefe(/Biete nichts an, was nicht in WAS DU KANNST steht/.test(sys) && /nicht als Standard-Schluss/.test(sys), '2.27: keine Angebote, die Formi nicht kann, kein Standard-Angebot am Schluss');
  pruefe(/"kundin weint nach dem training"/.test(sys) && /"kann ich morgen früher gehen"/.test(sys) && /Tausch an/.test(sys), '2.27: Beispiele für Gefühl (weinende Kundin) und für ehrlich Unmögliches (früher gehen → Tausch)');
  pruefe(/112 nur bei echten Notfällen \(bewusstlos, Atemnot, Brustschmerz/.test(sys), '2.27: 112 nur bei echten Notfällen, mit den Zeichen');
  pruefe(w.denkenFuer({}).reasoning.effort === 'low' && w.denkenFuer({ FORMI_DENKEN: 'medium' }).reasoning.effort === 'medium' && w.denkenFuer({ FORMI_DENKEN: 'quatsch' }).reasoning.effort === 'low', 'Nachdenken per FORMI_DENKEN umstellbar, sonst „low"');
  pruefe(!/oder sag "Das weiß ich noch nicht sicher"/.test(sys), 'Systemtext: „weiß ich nicht sicher" nur ohne Wissen');

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

  /* ── 2.13: Suche nach Bedeutung und Lernschleife ───────────────────
     Die echten Fingerabdrücke (bge-m3) gibt es hier nicht. Die Attrappe
     rechnet Wörter in „Begriffe" um (Rücken = LWS = Lendenwirbelsäule …)
     — geprüft wird damit der WEG (speichern, laden, mischen, vorschlagen,
     freigeben), nicht die Güte des echten Modells. */
  console.log('\n2.13: Bedeutung und Lernschleife');
  {
    const v = [0.3, -0.5, 0.8, 0.1];
    const n = w.vektorNorm(v);
    const back = w.vektorAuspacken(w.vektorPacken(v));
    pruefe(Math.abs(w.aehnlich(n, back) - 1) < 0.02, 'Fingerabdruck packen/auspacken: Ähnlichkeit mit sich selbst ≈ 1 (' + w.aehnlich(n, back).toFixed(3) + ')');
    const anders = w.vektorAuspacken(w.vektorPacken([-0.3, 0.5, -0.8, -0.1]));
    pruefe(w.aehnlich(n, anders) < -0.95, 'Gegenteil ≈ −1');
    pruefe(JSON.stringify(w.rangMischen([[1, 2, 3], [3, 4]], 4)) === '[3,1,2,4]', 'Ranglisten mischen: in beiden vorn kommt zuerst (' + JSON.stringify(w.rangMischen([[1, 2, 3], [3, 4]], 4)) + ')');
    /* 2.15, live gemessen: „darf eine schwangere trainieren" — Volltext
       [Fachkunde 10, Herzschrittmacher 11, Wer darf kein 12], Bedeutung
       [Schwangerschaft 20, Periode 21, Wer darf kein 12]. */
    const sw = w.rangMischen([[10, 11, 12], [20, 21, 12]], 6, [1, w.GEWICHT_BEDEUTUNG]);
    pruefe(sw[0] === 12 && sw[1] === 20 && sw.indexOf(10) >= 0, 'Bedeutung zählt doppelt: Schwangerschaft auf Platz 2, der beste Volltext-Treffer bleibt unter den sechs für die KI (' + JSON.stringify(sw) + ')');
    const gl = w.rangMischen([[10, 11, 12], [20, 21, 12]], 6);
    pruefe(gl.indexOf(10) < gl.indexOf(20), 'Gegenprobe: mit gleichem Gewicht steht der Volltext davor (' + JSON.stringify(gl) + ')');
    pruefe(w.VEKTOR_MIN > 0.48 && w.VEKTOR_MIN <= 0.52, 'Schwelle zwischen Rauschen (≤ 0,48) und echten Treffern (≥ 0,52): ' + w.VEKTOR_MIN);
    pruefe(w.korrekturText('stimmt nicht, richtig ist: die Westen nur bei 30 Grad waschen') === 'die Westen nur bei 30 Grad waschen', 'Korrektur: Text nach „richtig ist" wird erkannt');
    pruefe(w.korrekturText('stimmt nicht') === '', 'Korrektur: bloßes „stimmt nicht" ist keine Richtigstellung');
    pruefe(w.korrekturText('Falsch. Bei Herzschrittmacher gar kein EMS, auch nicht mit Freigabe.').startsWith('Bei Herzschrittmacher'), 'Korrektur: „Falsch. …" wird erkannt');
  }
  {
    const BEGRIFFE = [['rücken', 'ruecken', 'lws', 'lendenwirbelsäule', 'kreuz', 'kreuzschmerzen'], ['weste', 'westen', 'waschen', 'wäsche', 'waschmaschine'], ['krampf', 'krämpfe', 'verkrampft'], ['kündigen', 'kündigung', 'vertrag']];
    const fake = (t) => {
      const v = new Array(16).fill(0.01);
      String(t).toLowerCase().split(/[^a-zäöüß]+/).forEach(x => { const g = BEGRIFFE.findIndex(b => b.includes(x)); if (g >= 0) v[g] += 1; });
      return v;
    };
    const env2 = { DB: d1(), STUDIO_KEY: 'k', ADMIN_KEY: 'admin' };
    const kiQ = [];
    const gefragt = [];
    env2.AI = { run: async (modell, e) => {
      if (/bge-m3/.test(modell)) return { data: e.text.map(fake), shape: [e.text.length, 16] };
      gefragt.push(modell);
      const a = kiQ.length ? kiQ.shift() : '';
      return { response: typeof a === 'string' ? a : JSON.stringify(a) };
    } };
    /* ohne das Startwissen aus schema.sql — hier zählen nur die drei */
    env2.DB.roh.exec('DELETE FROM wissen; DELETE FROM wissen_fts;');
    const lws = await w.wissenSpeichern(env2, { thema: 'Was tun wenn Kunde LWS hat', inhalt: 'Akut: erst ärztlich abklären. Chronisch und abgeklärt: EMS ist gut untersucht.', kategorie: 'Gesundheit & Atteste' });
    const weste = await w.wissenSpeichern(env2, { thema: 'Wie wasche ich die EMS-Westen?', inhalt: 'Schonprogramm, wenig Umdrehungen, 3–4 Kappen Pflegespüler.' });
    const krampf = await w.wissenSpeichern(env2, { thema: 'Ein Kunde bekommt einen Krampf', inhalt: 'Training pausieren, Muskel locker dehnen.' });
    const vk = env2.DB.roh.prepare('SELECT COUNT(*) AS n FROM wissen_vektor').get().n;
    pruefe(vk === 3, 'beim Speichern entsteht gleich der Fingerabdruck (' + vk + ' von 3)');
    const t1 = await w.findeWissen(env2, 'Kreuzschmerzen, was mach ich?');
    pruefe(t1.length && t1[0].id === lws, 'Bedeutung findet „LWS" für „Kreuzschmerzen", ohne gemeinsames Wort (' + t1.map(x => x.id).join(',') + ')');
    const t2 = await w.findeWissen(env2, 'wie wasche ich die westen');
    pruefe(t2.length && t2[0].id === weste, 'Gegenprobe: Wortsuche + Bedeutung — Westen bleibt vorn');
    env2.AI.run = (orig => async (m, e) => { if (/bge-m3/.test(m)) throw new Error('4006: daily free allocation'); return orig(m, e); })(env2.AI.run);
    const t3 = await w.findeWissen(env2, 'wie wasche ich die westen');
    pruefe(t3.length && t3[0].id === weste, 'fällt die Bedeutung aus (Kontingent), sucht Formi mit Wörtern weiter');
    env2.AI.run = async (modell, e) => {
      if (/bge-m3/.test(modell)) return { data: e.text.map(fake) };
      gefragt.push(modell);
      const a = kiQ.length ? kiQ.shift() : '';
      return { response: typeof a === 'string' ? a : JSON.stringify(a) };
    };
    env2.DB.roh.prepare('DELETE FROM wissen_vektor').run();
    const auf = await w.vektorenAufbauen(env2, 100);
    pruefe(auf.neu === 3 && auf.fertig, '„Bedeutung berechnen" holt fehlende Fingerabdrücke nach (' + JSON.stringify(auf) + ')');

    /* Lernlauf: Selbsttest findet Krampf über eine Umschreibung nicht → Vorschlag */
    env2.DB.roh.prepare("INSERT INTO offen (frage, status, erstellt) VALUES ('Kunde will kündigen, was tun?', 'offen', 1)").run();
    env2.DB.roh.prepare("INSERT INTO offen (frage, status, erstellt) VALUES ('Mein Rücken zwickt beim Training, weiter?', 'offen', 2)").run();
    env2.DB.roh.prepare("UPDATE wissen SET geaendert = 1 WHERE id = ?").run(krampf);
    kiQ.push({ frage: 'Kreuzschmerzen, darf der trainieren?' }, { frage: 'westen in die maschine?' }, { frage: 'Bein ist plötzlich steinhart, was jetzt?' });
    kiQ.push({ reicht: true, antwort: 'Kommt drauf an: akut erst ärztlich abklären, chronisch und abgeklärt ist EMS gut untersucht.', quellen: [lws] });
    const lauf = await w.lernlauf(env2, { tests: 3, luecken: 3 });
    const vs = env2.DB.roh.prepare("SELECT * FROM vorschlag ORDER BY id").all();
    const art = (a) => vs.filter(x => x.art === a);
    pruefe(lauf.getestet === 3 && art('frage').length === 1 && art('frage')[0].wissen_id === krampf, 'Selbsttest: 3 geprüft, Krampf über „Bein ist plötzlich steinhart" nicht gefunden → 1 Vorschlag (' + JSON.stringify(lauf) + ')');
    const l1 = art('luecke').find(x => /kündigen/.test(x.thema));
    const l2 = art('luecke').find(x => /Rücken/.test(x.thema));
    pruefe(l1 && l1.status === 'leer', 'Lücke ohne passendes Wissen (Kündigung): kein Entwurf, bleibt bei dir');
    pruefe(l2 && l2.status === 'neu' && /Nr\. \d/.test(l2.begruendung), 'Lücke mit Wissen (Rücken): Entwurf nur aus Wissen, mit Nummer (' + (l2 && l2.begruendung) + ')');
    pruefe(art('veraltet').length === 1 && art('veraltet')[0].wissen_id === krampf, 'veraltet: der seit Jahren unberührte Eintrag wird zur Prüfung vorgelegt');
    const nochmal = await w.lernlauf(env2, { tests: 0, luecken: 3 });
    pruefe(env2.DB.roh.prepare("SELECT COUNT(*) AS n FROM vorschlag").get().n === vs.length, 'zweiter Lauf: nichts doppelt vorgeschlagen');

    /* Freigeben */
    const fr = art('frage')[0];
    const u1 = await w.vorschlagUrteil(env2, { id: fr.id, gut: true });
    const krampfNeu = env2.DB.roh.prepare('SELECT inhalt FROM wissen WHERE id = ?').get(krampf).inhalt;
    pruefe(u1.ok && /Auch gefragt als: „Bein ist plötzlich steinhart/.test(krampfNeu), 'Selbsttest übernehmen: Frage steht im Eintrag');
    const t4 = await w.findeWissen(env2, 'Bein ist plötzlich steinhart, was jetzt?');
    pruefe(t4.slice(0, 3).some(x => x.id === krampf), '… und danach findet Formi ihn');
    const u2 = await w.vorschlagUrteil(env2, { id: l2.id, gut: true, inhalt: 'Geprüft: akut erst Arzt, chronisch mit Freigabe EMS möglich.' });
    pruefe(u2.ok && env2.DB.roh.prepare("SELECT status FROM offen WHERE id = ?").get(l2.ref).status === 'erledigt', 'Lücke übernehmen: offene Frage erledigt, mit deinem Text als Wissen');
    const u3 = await w.vorschlagUrteil(env2, { id: art('veraltet')[0].id, gut: false });
    pruefe(u3.ok && env2.DB.roh.prepare("SELECT status FROM vorschlag WHERE id = ?").get(art('veraltet')[0].id).status === 'verworfen', 'verwerfen geht');
    pruefe(!(await w.vorschlagUrteil(env2, { id: fr.id, gut: true })).ok, 'zweimal freigeben geht nicht');

    /* Doppelt */
    const d2 = await w.wissenSpeichern(env2, { thema: 'EMS-Westen waschen', inhalt: 'Westen im Schonprogramm waschen, Pflegespüler.' });
    const lauf2 = await w.lernlauf(env2, { tests: 0, luecken: 0, doppelt: 10 });
    /* Mit der groben Attrappe gilt auch die eben übernommene Rücken-Antwort
       als fast gleich zu LWS — das ist hier richtig so. Geprüft wird das
       Westen-Paar. */
    const dop = env2.DB.roh.prepare("SELECT * FROM vorschlag WHERE art = 'doppelt' AND ref = ?").get(d2);
    pruefe(dop && dop.wissen_id === weste && dop.ref === d2, 'doppelt: zwei fast gleiche Einträge werden vorgeschlagen (' + JSON.stringify(lauf2) + ')');
    const u4 = await w.vorschlagUrteil(env2, { id: dop.id, gut: true, inhalt: 'Schonprogramm, wenig Umdrehungen, Pflegespüler.' });
    pruefe(u4.ok && !env2.DB.roh.prepare('SELECT id FROM wissen WHERE id = ?').get(d2), 'zusammenführen: der zweite ist weg, der erste hat deinen Text');

    /* Korrektur aus dem Team über die echte Schnittstelle */
    const altFetch2 = global.fetch; global.fetch = async () => ({ ok: true, status: 200, text: async () => '{}', json: async () => ({}) });
    kiQ.push({ antwort: 'Westen: Schonprogramm.', art: 'frage', abgedeckt: true, quellen: [weste] });
    const fragen = async (text) => {
      const r = await w.default.fetch(new Request('https://x.test/api/frage', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-studio-key': 'k' },
        body: JSON.stringify({ frage: text, name: 'Anna Test', studio: 'Hürth', vorname: 'Anna' }) }), env2, { waitUntil() {} });
      return r.json();
    };
    await fragen('wie wasche ich die westen');
    await fragen('stimmt nicht, richtig ist: maximal 30 Grad und nie in den Trockner');
    const ko = env2.DB.roh.prepare("SELECT * FROM vorschlag WHERE art = 'korrektur'").get();
    pruefe(ko && ko.inhalt === 'maximal 30 Grad und nie in den Trockner' && ko.wissen_id === weste, 'Korrektur aus dem Team wird ein Vorschlag, mit dem Eintrag, den Formi benutzt hatte');
    const u5 = await w.vorschlagUrteil(env2, { id: ko.id, gut: true });
    pruefe(u5.ok && env2.DB.roh.prepare("SELECT COUNT(*) AS n FROM wissen WHERE quelle = 'Korrektur aus dem Team'").get().n === 1, 'Korrektur übernehmen: neues Wissen, Quelle „Korrektur aus dem Team"');
    global.fetch = altFetch2;

    /* Leitstand und Zahlen */
    const st = await (await w.default.fetch(new Request('https://x.test/api/statistik', { headers: { 'x-admin-key': 'admin' } }), env2, {})).json();
    pruefe(st.training.goldLernen === 2 && typeof st.vorschlaege === 'number' && st.vektoren.mit === st.vektoren.gesamt, 'Übersicht zählt Vorschläge, Bedeutung und freigegebene Paare (' + JSON.stringify({ g: st.training.goldLernen, v: st.vorschlaege, vk: st.vektoren }) + ')');
    const exp = await (await w.default.fetch(new Request('https://x.test/api/training/export', { headers: { 'x-admin-key': 'admin' } }), env2, {})).text();
    pruefe(/"quelle":"selbsttest"/.test(exp) && /"quelle":"korrektur"/.test(exp), 'Trainingsdaten enthalten Selbsttest- und Korrektur-Paare');
    const html = await (await w.default.fetch(new Request('https://x.test/leitstand'), env2, {})).text();
    pruefe(/"vorschlaege","Vorschläge"/.test(html) && /Jetzt lernen/.test(html) && /Bedeutung berechnen/.test(html), 'Leitstand: Reiter „Vorschläge", Knöpfe „Jetzt lernen" und „Bedeutung berechnen"');
    const ohne = await w.default.fetch(new Request('https://x.test/api/vorschlaege'), env2, {});
    pruefe(ohne.status === 401, 'Vorschläge nur mit ADMIN_KEY');

    /* ── 2.14 Viel Wissen auf einmal — als Vorschlag, Leitung gibt frei ── */
    const post = (pfad, body, kopf) => w.default.fetch(new Request('https://x.test' + pfad, { method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, kopf || { 'x-studio-key': 'k' }), body: JSON.stringify(body) }), env2, { waitUntil() {} });
    const wissenVorher = env2.DB.roh.prepare('SELECT COUNT(*) AS n FROM wissen').get().n;
    const westeThema = env2.DB.roh.prepare('SELECT thema, inhalt FROM wissen WHERE id = ?').get(weste);
    const imp = await (await post('/api/vorschlag/import', { von: 'Lea Leitung', vonId: 'uid-lea', quelle: 'Schulung', eintraege: [
      { thema: 'Hautkontakt der Elektroden', inhalt: 'Elektroden vor dem Training gut anfeuchten, sonst kribbelt es unangenehm.', kategorie: 'Training & EMS' },
      { thema: westeThema.thema.toUpperCase(), inhalt: 'Westen bei 30 Grad im Schonprogramm, danach hängend trocknen.' },
      { thema: westeThema.thema, inhalt: westeThema.inhalt },
      { thema: 'x', inhalt: 'zu kurz' }
    ] })).json();
    pruefe(imp.neu === 2 && imp.schonDa === 1 && imp.ungueltig === 1, 'Import: zwei neue Vorschläge, gleicher Text wird übersprungen, Unsinn abgelehnt (' + JSON.stringify(imp) + ')');
    pruefe(env2.DB.roh.prepare('SELECT COUNT(*) AS n FROM wissen').get().n === wissenVorher, 'Import macht NICHTS direkt zu Wissen');
    const imp2 = await (await post('/api/vorschlag/import', { eintraege: [{ thema: 'Hautkontakt der Elektroden', inhalt: 'Elektroden vor dem Training gut anfeuchten, sonst kribbelt es unangenehm.' }] })).json();
    pruefe(imp2.neu === 0 && imp2.schonDa === 1, 'Derselbe Import zweimal: kein doppelter Vorschlag');
    const zuViel = await (await post('/api/vorschlag/import', { eintraege: Array.from({ length: 60 }, (_, i) => ({ thema: 'Massentest ' + i, inhalt: 'Ein Eintrag zum Zählen Nummer ' + i })) })).json();
    pruefe(zuViel.neu === 50, 'Höchstens 50 Einträge je Import (' + zuViel.neu + ')');
    env2.DB.roh.prepare("UPDATE vorschlag SET status = 'verworfen' WHERE thema LIKE 'Massentest %'").run();

    const liste = await (await post('/api/vorschlag/liste', { vonId: 'uid-lea' })).json();
    const neuV = liste.liste.find(x => x.thema === 'Hautkontakt der Elektroden');
    const aendV = liste.liste.find(x => x.art === 'import' && x.wissenId === weste);
    pruefe(neuV && neuV.eigen === true && neuV.von === 'Lea Leitung' && aendV && /30 Grad/.test(aendV.inhalt) && aendV.alt === westeThema.inhalt, 'Liste für die App: Herkunft, „eigen" und bei bekanntem Thema der bisherige Text');
    pruefe(!liste.liste.some(x => x.art === 'doppelt') && !JSON.stringify(liste).includes('uid-lea'), 'App sieht keine „doppelt"-Vorschläge und keine fremden Kennungen');

    const eigen = await (await post('/api/vorschlag/entscheiden', { id: neuV.id, gut: true, von: 'Lea Leitung', vonId: 'uid-lea' })).json();
    pruefe(!eigen.ok && /jemand anderes/.test(eigen.fehler), 'Vier Augen: den eigenen Vorschlag kann man nicht selbst freigeben');
    const frei = await (await post('/api/vorschlag/entscheiden', { id: neuV.id, gut: true, von: 'Max Chef', vonId: 'uid-max', inhalt: 'Elektroden vor dem Training gut anfeuchten.' })).json();
    const neuW = env2.DB.roh.prepare("SELECT * FROM wissen WHERE thema = 'Hautkontakt der Elektroden'").get();
    pruefe(frei.ok && neuW && neuW.inhalt === 'Elektroden vor dem Training gut anfeuchten.' && neuW.kategorie === 'Training & EMS' && neuW.quelle === 'Schulung', 'Freigabe durch jemand anderen: Wissen mit geändertem Text, Kategorie und Quelle');
    pruefe(env2.DB.roh.prepare('SELECT geprueft_von FROM vorschlag WHERE id = ?').get(neuV.id).geprueft_von === 'Max Chef', 'Es steht dabei, wer freigegeben hat');
    const aend = await (await post('/api/vorschlag/entscheiden', { id: aendV.id, gut: true, von: 'Max Chef', vonId: 'uid-max' })).json();
    pruefe(aend.ok && /30 Grad/.test(env2.DB.roh.prepare('SELECT inhalt FROM wissen WHERE id = ?').get(weste).inhalt) && env2.DB.roh.prepare('SELECT COUNT(*) AS n FROM wissen').get().n === wissenVorher + 1, 'Bekanntes Thema: der Eintrag wird geändert, kein Doppel');
    const zweimal = await (await post('/api/vorschlag/entscheiden', { id: aendV.id, gut: false, von: 'Max Chef', vonId: 'uid-max' })).json();
    pruefe(!zweimal.ok, 'Schon entschieden bleibt entschieden');

    env2.DB.roh.prepare("INSERT INTO vorschlag (art, wissen_id, ref, thema, inhalt, status, schluessel, erstellt) VALUES ('doppelt', ?, ?, 'Test doppelt', 'x', 'neu', 'test-doppelt', 1)").run(weste, weste);
    const dopId = env2.DB.roh.prepare("SELECT id FROM vorschlag WHERE schluessel = 'test-doppelt'").get().id;
    const dopApp = await (await post('/api/vorschlag/entscheiden', { id: dopId, gut: true, von: 'Max Chef', vonId: 'uid-max' })).json();
    pruefe(!dopApp.ok && env2.DB.roh.prepare('SELECT id FROM wissen WHERE id = ?').get(weste), '„doppelt" (löscht) geht aus der App nicht — nur im Leitstand');
    const ohneSchl = await post('/api/vorschlag/import', { eintraege: [] }, { 'x-studio-key': 'falsch' });
    pruefe(ohneSchl.status === 401, 'Import nur mit Schlüssel');

    const such = await (await w.default.fetch(new Request('https://x.test/api/suche?q=' + encodeURIComponent('wie wasche ich die westen'), { headers: { 'x-admin-key': 'admin' } }), env2, {})).json();
    pruefe(Array.isArray(such.bedeutung) && such.bedeutung.length > 0 && typeof such.bedeutung[0].wert === 'number' && such.schwelle > 0 && such.ergebnis.some(x => x.id === weste), 'Suche-Diagnose: Wörter, Volltext, Ähnlichkeit ohne Schwelle, Ergebnis (' + JSON.stringify(such).slice(0, 160) + ')');
    const suchOhne = await w.default.fetch(new Request('https://x.test/api/suche?q=x', { headers: { 'x-studio-key': 'k' } }), env2, {});
    pruefe(suchOhne.status === 401, 'Suche-Diagnose nur im Leitstand');
    /* 2.22: wer eine Übung geprüft hat, steht dabei und im Export. */
    await w.trainingTabellen(env2);
    env2.DB.roh.prepare("INSERT INTO uebung (wissen_id, frage, antwort, status, erstellt) VALUES (1, 'testfrage claude', 'testantwort', 'neu', 1)").run();
    const uid = env2.DB.roh.prepare("SELECT id FROM uebung WHERE frage = 'testfrage claude'").get().id;
    const ur = await (await post('/api/uebung/urteil', { id: uid, gut: true, von: 'Claude (für Semih)' }, { 'x-admin-key': 'admin' })).json();
    pruefe(ur.ok && env2.DB.roh.prepare('SELECT geprueft_von FROM uebung WHERE id = ?').get(uid).geprueft_von === 'Claude (für Semih)', 'Übung: „geprüft von" wird gespeichert');
    const ex2 = await (await w.default.fetch(new Request('https://x.test/api/training/export', { headers: { 'x-admin-key': 'admin' } }), env2, {})).text();
    pruefe(/"geprueft_von":"Claude \(für Semih\)"/.test(ex2), 'Export nennt, wer geprüft hat');

    /* ── 2.19: gpt-oss zuerst, App-Lage im Gespräch, Grundlage ── */
    {
      const altRun = env2.AI.run, gesehen = [];
      const antworten = [{ antwort: 'Heute offen in Hürth: Briefkasten leeren (überfällig).', art: 'frage', grundlage: 'app', abgedeckt: false, quellen: [] },
        { antwort: 'Für Kniebeugen: Rücken gerade, Knie über den Fussspitzen.', art: 'frage', grundlage: 'allgemein', abgedeckt: false, quellen: [] }];
      env2.AI.run = async (modell, e) => {
        if (/bge-m3/.test(modell)) return { data: e.text.map(fake) };
        gesehen.push({ modell, text: JSON.stringify(e.messages || '') });
        return { response: JSON.stringify(antworten.shift() || {}) };
      };
      const altFetch3 = global.fetch; global.fetch = async () => ({ ok: true, status: 200, text: async () => '{}', json: async () => ({}) });
      const frag = async (frage, lage) => (await (await w.default.fetch(new Request('https://x.test/api/frage', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-studio-key': 'k' },
        body: JSON.stringify({ frage, name: 'Anna Test', studio: 'Hürth', vorname: 'Anna', lage }) }), env2, { waitUntil() {} })).json());
      const offenVor = env2.DB.roh.prepare("SELECT COUNT(*) AS n FROM offen").get().n;
      const a1 = await frag('was ist heute offen?', 'Offene Aufgaben Hürth: Briefkasten leeren (überfällig seit 21.10.)');
      pruefe(gesehen[0] && gesehen[0].modell === w.MODELL_ANTWORT && /gpt-oss-120b/.test(w.MODELL_ANTWORT), 'Antwort kommt zuerst von gpt-oss-120b (' + (gesehen[0] || {}).modell + ')');
      pruefe(/APP-LAGE/.test(gesehen[0].text) && /Briefkasten leeren/.test(gesehen[0].text), 'die App-Lage steht im Gespräch mit der KI');
      pruefe(a1.grundlage === 'app' && /Briefkasten/.test(a1.antwort) && !a1.offenId, 'Antwort aus der App-Lage: keine offene Frage an Semih (' + JSON.stringify(a1).slice(0, 120) + ')');
      pruefe(!JSON.stringify(env2.DB.roh.prepare("SELECT * FROM nachrichten ORDER BY id DESC LIMIT 3").all()).includes('überfällig seit 21.10'), 'die App-Lage wird nicht gespeichert');
      const a2 = await frag('wie mache ich eine saubere kniebeuge?');
      pruefe(a2.grundlage === 'allgemein' && /Allgemeines Wissen/.test(a2.antwort) && !a2.offenId, 'Allgemeines: freie Antwort mit Hinweis, keine offene Frage');
      pruefe(env2.DB.roh.prepare("SELECT COUNT(*) AS n FROM offen").get().n === offenVor, 'Semih bekommt dafür keine offenen Fragen');
      env2.AI.run = async (modell, e) => {
        if (/bge-m3/.test(modell)) return { data: e.text.map(fake) };
        gesehen.push({ modell, text: '' });
        if (modell === w.MODELL_ANTWORT) throw new Error('5023: model overloaded');
        return { response: JSON.stringify({ antwort: 'Ersatz antwortet.', art: 'frage', grundlage: 'allgemein', abgedeckt: false, quellen: [] }) };
      };
      const a3 = await frag('kurze frage zum training');
      pruefe(/Ersatz antwortet/.test(a3.antwort), 'fällt gpt-oss aus, antwortet das bisherige Modell');
      /* 2.20: „low" denken; lehnt das Modell den Parameter ab, ohne ihn nochmal. */
      const eingaben = [];
      env2.AI.run = async (modell, e) => {
        if (/bge-m3/.test(modell)) return { data: e.text.map(fake) };
        eingaben.push({ modell, reasoning: e.reasoning });
        if (modell === w.MODELL_ANTWORT && e.reasoning) throw new Error('5006: unknown field reasoning');
        return { response: JSON.stringify({ antwort: 'Ohne reasoning beantwortet.', art: 'frage', grundlage: 'allgemein', abgedeckt: false, quellen: [] }) };
      };
      const a4 = await frag('noch eine frage zum training');
      pruefe(eingaben[0] && eingaben[0].modell === w.MODELL_ANTWORT && eingaben[0].reasoning && eingaben[0].reasoning.effort === 'low', 'gpt-oss wird mit „low" gefragt');
      pruefe(eingaben[1] && eingaben[1].modell === w.MODELL_ANTWORT && !eingaben[1].reasoning && /Ohne reasoning/.test(a4.antwort), 'lehnt es den Parameter ab: dieselbe Frage ohne ihn, nicht gleich das schwächere Modell');

      /* 2.23: freigegebene Übungen gehen als geprüfte Beispiele mit.
         Aus dem Betrieb (23.10.2026): die 500 Trainingsfragen — „Ja" zur
         Empfehlung, die freigegebenen Paare direkt in den Antworten zu nutzen. */
      const ins = env2.DB.roh.prepare("INSERT INTO uebung (wissen_id, frage, antwort, status, erstellt) VALUES (?, ?, ?, ?, 1)");
      ins.run(weste, 'Wie wasche ich die Westen richtig?', 'Schonprogramm, wenig Hitze, 3–4 Kappen Pflegespüler – Beispielantwort GUT.', 'gut');
      ins.run(weste, 'Wie wasche ich die Westen nochmal?', 'NOCH NICHT GEPRÜFT – darf nicht mit.', 'neu');
      ins.run(weste, 'Westen falsch gewaschen?', 'VERWORFEN – darf nicht mit.', 'verworfen');
      ins.run(weste, 'Wer macht den Dienstplan?', 'PASST NICHT – kein gemeinsames Wort.', 'gut');
      const bsp = [];
      env2.AI.run = async (modell, e) => {
        if (/bge-m3/.test(modell)) return { data: e.text.map(fake) };
        bsp.push(JSON.stringify(e.messages || ''));
        return { response: JSON.stringify({ antwort: 'Schonprogramm.', art: 'frage', grundlage: 'wissen', abgedeckt: true, quellen: [weste] }) };
      };
      await frag('Wie wasche ich die Westen?');
      pruefe(/GEPRÜFTE BEISPIELE/.test(bsp[0] || '') && /Beispielantwort GUT/.test(bsp[0]), 'freigegebene Übung steht als geprüftes Beispiel im Gespräch mit der KI');
      pruefe(!/NOCH NICHT GEPRÜFT|VERWORFEN/.test(bsp[0] || ''), 'ungeprüfte und verworfene Übungen gehen nicht mit');
      pruefe(!/PASST NICHT/.test(bsp[0] || ''), 'Gegenprobe: ein freigegebenes Paar ohne gemeinsames Wort bleibt draussen');
      bsp.length = 0;
      await frag('Wer hat heute Dienst in Hürth?');
      pruefe(bsp[0] !== undefined && !/Beispielantwort GUT/.test(bsp[0]), 'Gegenprobe: zu einer fremden Frage kein Westen-Beispiel');
      const pr = await (await w.default.fetch(new Request('https://x.test/api/probe', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': 'admin' }, body: JSON.stringify({ frage: 'Wie wasche ich die Westen?' }) }), env2, { waitUntil() {} })).json();
      pruefe(Array.isArray(pr.beispiele) && pr.beispiele.includes('Wie wasche ich die Westen richtig?'), 'Probe im Leitstand zeigt, welche Beispiele mitgingen');
      /* 2.26: Probe mit eigenem Systemtext — zum Ausprobieren ohne Einspielen. */
      bsp.length = 0;
      const prS = await (await w.default.fetch(new Request('https://x.test/api/probe', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': 'admin' }, body: JSON.stringify({ frage: 'Wie wasche ich die Westen?', system: 'TESTSYSTEM-XYZ' }) }), env2, { waitUntil() {} })).json();
      pruefe(prS.eigenerText === true && /TESTSYSTEM-XYZ/.test(bsp[0] || '') && !/SO DENKST DU/.test(bsp[0] || ''), 'Probe: ein mitgegebener Systemtext ersetzt den echten (nur für diese Probe)');
      bsp.length = 0;
      await frag('Wie wasche ich die Westen?');
      pruefe(/SO DENKST DU/.test(bsp[0] || '') && !/TESTSYSTEM-XYZ/.test(bsp[0] || ''), 'Gegenprobe: die nächste echte Frage hat wieder den echten Systemtext');
      const prOhne = await w.default.fetch(new Request('https://x.test/api/probe', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-studio-key': 'k' }, body: JSON.stringify({ frage: 'x', system: 'BOESE' }) }), env2, { waitUntil() {} });
      pruefe(prOhne.status === 401 || prOhne.status === 403, 'Probe mit eigenem Systemtext nur mit Leitstand-Schlüssel (Studio-Schlüssel: ' + prOhne.status + ')');

      /* 2.24 Notbremse. Aus dem Betrieb (23.10.2026): „können wir die
         tageskontigenten nicht erhöhen irgendwie ?" → „Gratis + Notbremse". */
      const tag = w.heuteUtc();
      const setze = n => env2.DB.roh.prepare("INSERT INTO verbrauch (tag, neuronen, aufrufe) VALUES (?, ?, 0) ON CONFLICT(tag) DO UPDATE SET neuronen = excluded.neuronen").run(tag, n);
      const stand = () => env2.DB.roh.prepare("SELECT neuronen FROM verbrauch WHERE tag = ?").get(tag).neuronen;
      setze(0);
      const modelle = [];
      env2.AI.run = async (modell, e) => {
        if (/bge-m3/.test(modell)) return { data: e.text.map(fake) };
        modelle.push({ modell, text: JSON.stringify(e.messages || '') });
        return { response: JSON.stringify({ antwort: 'Schonprogramm.', art: 'frage', grundlage: 'wissen', abgedeckt: true, quellen: [weste] }), usage: { prompt_tokens: 8000, completion_tokens: 500 } };
      };
      await frag('Wie wasche ich die Westen?');
      const nachEiner = stand();
      pruefe(modelle[0].modell === w.MODELL_ANTWORT && nachEiner > 280 && nachEiner < 320, 'normal: gpt-oss, und die Antwort wird gebucht (' + Math.round(nachEiner) + ' Neuronen für 8000 + 500 Tokens, erwartet ≈ 289)');
      setze(7000); modelle.length = 0;
      const sp = await frag('Wie wasche ich die Westen?');
      pruefe(modelle.length === 1 && modelle[0].modell !== w.MODELL_ANTWORT && /gemma/.test(modelle[0].modell) && /Schonprogramm/.test(sp.antwort), 'ab 6.000: Sparmodus mit Gemma, kein gpt-oss (' + modelle.map(x => x.modell).join(', ') + ')');
      setze(9500); modelle.length = 0;
      const st = await frag('Wie wasche ich die Westen?');
      pruefe(modelle.length === 0 && /spare heute/.test(st.antwort) && /Schonprogramm|Pflegespüler/.test(st.antwort) && !st.offenId, 'ab 9.200: keine KI, Antwort aus dem Wissen');
      const offenVor2 = env2.DB.roh.prepare("SELECT COUNT(*) AS n FROM offen").get().n;
      const st2 = await frag('Xylophon Quartett Zeppelin');
      pruefe(modelle.length === 0 && st2.offenId && env2.DB.roh.prepare("SELECT COUNT(*) AS n FROM offen").get().n === offenVor2 + 1, 'ab 9.200 ohne passendes Wissen: keine KI, kein fremder Eintrag, die Frage wird gespeichert');
      const ll = await w.lernlauf(w.mitZaehler(env2));
      pruefe(ll.gespart && modelle.length === 0, 'kein Lernlauf, solange gespart wird');
      setze(0);
      env2.AI.run = async (modell, e) => { if (/bge-m3/.test(modell)) return { data: e.text.map(fake) }; throw new Error('4006: you have used up your daily free allocation of 10,000 neurons'); };
      await frag('Wie wasche ich die Westen?');
      pruefe(stand() >= w.KONTINGENT, 'meldet Cloudflare „aufgebraucht", steht der Zähler auf dem Kontingent (' + stand() + ')');
      const sta = await (await w.default.fetch(new Request('https://x.test/api/statistik', { headers: { 'x-admin-key': 'admin' } }), env2, { waitUntil() {} })).json();
      pruefe(sta.verbrauch && sta.verbrauch.stufe === 'stopp' && sta.verbrauch.kontingent === 10000, 'Statistik zeigt Verbrauch und Stufe (' + JSON.stringify(sta.verbrauch) + ')');
      setze(0);
      env2.AI.run = altRun; global.fetch = altFetch3;
    }
    {
      const viele = Array.from({ length: 6 }, (_, i) => ({ frage: 'Wie wasche ich die Westen ' + i + '?', antwort: 'a' + i }));
      const gew = w.vorbilderWaehlen('Wie wasche ich die Westen?', viele.concat([{ frage: 'Wie wasche ich die Westen 0?', antwort: 'doppelt' }]));
      pruefe(gew.length === w.MAX_VORBILDER && new Set(gew.map(x => x.frage)).size === gew.length, 'höchstens ' + w.MAX_VORBILDER + ' Beispiele, keine doppelte Frage');
      pruefe(w.vorbilderWaehlen('', viele).length === 0 && w.vorbilderWaehlen('Wie wasche?', []).length === 0, 'leere Frage oder keine Paare: keine Beispiele');
      pruefe(w.vorbilderText([{ frage: 'F1', antwort: 'x'.repeat(2000) }]).length < 800, 'ein langes Beispiel wird gekürzt');
      pruefe(w.stufeVon(5999, {}) === 'normal' && w.stufeVon(6000, {}) === 'spar' && w.stufeVon(9200, {}) === 'stopp' && w.stufeVon(100, { NEURONEN_SPAR: '50' }) === 'spar', 'Stufen: 6.000 Sparmodus, 9.200 Notbremse, per Variable einstellbar');
      pruefe(Math.round(w.neuronenSchaetzen('@cf/google/gemma-4-26b-a4b-it', {}, { usage: { prompt_tokens: 8000, completion_tokens: 500 } })) === 86, 'Gemma kostet für dieselbe Frage etwa ein Drittel (86 statt ≈ 289)');
      pruefe(w.neuronenSchaetzen('@cf/openai/gpt-oss-120b', { messages: [{ content: 'x'.repeat(3500) }] }, { response: 'y'.repeat(350) }) > 30, 'ohne usage wird aus der Textlänge geschätzt');
      pruefe(w.wissenPassend('Wie wasche ich die Westen?', [{ thema: 'Dusche', inhalt: 'Abfluss' }, { thema: 'Westen', inhalt: 'Schonprogramm' }]).thema === 'Westen' && !w.wissenPassend('Xylophon Zeppelin', [{ thema: 'Westen', inhalt: 'waschen' }]), 'Notbremse nimmt nur einen Eintrag mit gemeinsamem Suchwort');
      pruefe(w.sparWissen(Array.from({ length: 8 }, (_, i) => ({ thema: 't' + i, inhalt: 'x'.repeat(2000) }))).length === 2 && w.sparWissen([{ thema: 'a', inhalt: 'x'.repeat(9000) }]).length === 1, 'Sparmodus: höchstens 4 Einträge und 5.000 Zeichen, ein langer Eintrag bleibt');
    }

    /* ── 2.16 Sammelfreigabe: „ja sind zu viele klicks" ── */
    const Q = 'Schulung „Hygiene“';
    const viele = Array.from({ length: 25 }, (_, i) => ({ thema: 'Sammeltest ' + i, inhalt: 'Ein Eintrag aus der Schulung Nummer ' + i, kategorie: 'Geräte & Hygiene', quelle: Q }));
    await post('/api/vorschlag/import', { eintraege: viele });
    await post('/api/vorschlag/import', { eintraege: [{ thema: 'Sammeltest eigen', inhalt: 'Von Lea selbst vorgeschlagen, gleiche Quelle.' }], quelle: Q, von: 'Lea Leitung', vonId: 'uid-lea' });
    await post('/api/vorschlag/import', { eintraege: [{ thema: 'Andere Quelle A', inhalt: 'Gehört nicht zur Schulung, bleibt offen.' }, { thema: 'Andere Quelle B', inhalt: 'Gehört auch nicht zur Schulung.' }], quelle: 'Etwas anderes' });
    const gl2 = await (await post('/api/vorschlag/liste', { vonId: 'uid-lea' })).json();
    const gq = (gl2.gruppen || []).find(g => g.quelle === Q);
    pruefe(gq && gq.anzahl === 26 && gl2.liste.some(x => x.quelle === Q), 'Liste nennt Gruppen je Quelle (' + JSON.stringify(gl2.gruppen) + ')');
    const vorW = env2.DB.roh.prepare('SELECT COUNT(*) AS n FROM wissen').get().n;
    const r1 = await (await post('/api/vorschlag/entscheiden', { quelle: Q, gut: true, von: 'Lea Leitung', vonId: 'uid-lea' })).json();
    pruefe(r1.ok && r1.erledigt === w.SAMMEL_JE_AUFRUF && r1.uebrig === 5 && r1.uebersprungen === 1, 'Erster Aufruf: 20 übernommen, 5 übrig, der eigene übersprungen (' + JSON.stringify(r1) + ')');
    const r2 = await (await post('/api/vorschlag/entscheiden', { quelle: Q, gut: true, von: 'Lea Leitung', vonId: 'uid-lea' })).json();
    pruefe(r2.erledigt === 5 && r2.uebrig === 0, 'Zweiter Aufruf: der Rest (' + JSON.stringify(r2) + ')');
    pruefe(env2.DB.roh.prepare('SELECT COUNT(*) AS n FROM wissen').get().n === vorW + 25, '25 neue Einträge im Wissen');
    pruefe(env2.DB.roh.prepare("SELECT status FROM vorschlag WHERE thema = 'Sammeltest eigen'").get().status === 'neu', 'Vier Augen: der eigene Vorschlag bleibt offen');
    pruefe(env2.DB.roh.prepare("SELECT COUNT(*) AS n FROM vorschlag WHERE status = 'neu' AND quelle = 'Etwas anderes'").get().n === 2, 'Andere Quelle bleibt unberührt');
    const r3 = await (await post('/api/vorschlag/entscheiden', { quelle: 'Etwas anderes', gut: false, von: 'Max Chef', vonId: 'uid-max' })).json();
    pruefe(r3.erledigt === 2 && env2.DB.roh.prepare("SELECT COUNT(*) AS n FROM wissen WHERE thema LIKE 'Andere Quelle%'").get().n === 0, 'Alle verwerfen: nichts wird Wissen');
    const r4 = await (await post('/api/vorschlag/entscheiden', { quelle: '', gut: true })).json();
    pruefe(!r4.ok, 'Ohne Quelle: nichts');
    const lsHtml = await (await w.default.fetch(new Request('https://x.test/leitstand'), env2, {})).text();
    pruefe(/" übernehmen"/.test(lsHtml) && /\/api\/vorschlag\/entscheiden/.test(lsHtml), 'Leitstand hat die Sammelknöpfe');
    pruefe(!/confirm\(/.test(lsHtml.replace(/\/\*[\s\S]*?\*\//g, '')), 'Leitstand ruft kein confirm() auf (eingebettete Browser zeigen es nicht)');

    /* 2.17: der Knopf im echten Browser — der Leitstand läuft gegen
       diesen Worker (Anfragen werden in den Test umgeleitet). */
    let pw = null; try { pw = require('playwright'); } catch (e) { console.log('  (Playwright fehlt — Browser-Teil übersprungen)'); }
    if (pw) {
      await post('/api/vorschlag/import', { eintraege: [1, 2, 3].map(i => ({ thema: 'Knopftest ' + i, inhalt: 'Ein Eintrag für den Knopftest Nummer ' + i })), quelle: 'Schulung „Knopftest“' });
      const br = await pw.chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
      try {
        const pg = await br.newPage({ serviceWorkers: 'block', viewport: { width: 1280, height: 800 } });
        let dialog = 0; pg.on('dialog', d => { dialog++; d.dismiss(); });
        await pg.route('https://leitstand.test/**', async (route) => {
          const rq = route.request();
          const antwort = await w.default.fetch(new Request(rq.url(), { method: rq.method(), headers: rq.headers(), body: rq.method() === 'POST' ? rq.postData() : undefined }), env2, { waitUntil() {} });
          route.fulfill({ status: antwort.status, headers: Object.fromEntries(antwort.headers), body: Buffer.from(await antwort.arrayBuffer()) });
        });
        await pg.addInitScript(() => { try { sessionStorage.setItem('sg-key', 'admin'); } catch (e) {} });
        const seitenFehler = []; pg.on('pageerror', e => seitenFehler.push(e.message));
        await pg.goto('https://leitstand.test/leitstand');
        await pg.waitForTimeout(500);
        /* 2.24: Übersicht zeigt das Kontingent */
        const kk = await pg.waitForFunction(() => /KI-Kontingent heute/.test(document.body.innerText) && /von 10\.000 Neuronen/.test(document.body.innerText), null, { timeout: 5000 }).then(() => true).catch(() => false);
        pruefe(kk && !seitenFehler.length, 'Leitstand-Übersicht zeigt „KI-Kontingent heute" ohne Skriptfehler' + (seitenFehler.length ? ' (' + seitenFehler.join(' | ') + ')' : ''));
        await pg.evaluate(() => { tab = 'vorschlaege'; start(); });
        await pg.waitForFunction(() => [...document.querySelectorAll('button')].some(b => /Knopftest/.test(b.textContent)), null, { timeout: 5000 });
        /* Ein fester Griff, kein Locator nach Text: der Text ändert sich beim
           ersten Klick, ein Locator würde bis zum Zurücksetzen warten. */
        const knopf = await pg.locator('button', { hasText: 'Knopftest' }).elementHandle();
        await knopf.click(); await pg.waitForTimeout(150);
        const frage = await knopf.textContent();
        const nochOffen = env2.DB.roh.prepare("SELECT COUNT(*) AS n FROM vorschlag WHERE status = 'neu' AND quelle = 'Schulung „Knopftest“'").get().n;
        pruefe(/Nochmal klicken/.test(frage) && nochOffen === 3 && !dialog, 'Leitstand: erster Klick fragt im Knopf nach, ohne Dialog, nichts passiert (' + frage + ')');
        await knopf.click();
        await pg.waitForFunction(() => ![...document.querySelectorAll('button')].some(b => /Knopftest/.test(b.textContent)), null, { timeout: 8000 }).catch(() => {});
        const danach = env2.DB.roh.prepare("SELECT COUNT(*) AS n FROM vorschlag WHERE status = 'neu' AND quelle = 'Schulung „Knopftest“'").get().n;
        pruefe(danach === 0 && env2.DB.roh.prepare("SELECT COUNT(*) AS n FROM wissen WHERE thema LIKE 'Knopftest %'").get().n === 3, 'Leitstand: zweiter Klick übernimmt alle drei, der Knopf ist danach weg');
      } finally { await br.close(); }
    }
  }

  console.log(`\n${ok} bestanden, ${fehler} fehlgeschlagen`);
  process.exit(fehler ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
