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
  pruefe(/geprüftes internes Vorgehen/.test(sys), 'Systemtext: Gesundheits-Vorgehen aus dem Wissen wird wiedergegeben');
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
  }

  console.log(`\n${ok} bestanden, ${fehler} fehlgeschlagen`);
  process.exit(fehler ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
