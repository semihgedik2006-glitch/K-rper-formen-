/* ══════════════════════════════════════════════════════════════════════
   FORMI PER MAIL – das Apps Script im Formi-Postfach (20.10.2026)

   Aus dem Betrieb: „nur Mail erstmal falls das möglich ist kostenlos";
   auf die Rückfrage, wer schreiben darf: „Jeder … kann formi auch direkt
   per Mail antworten dann und man sollte dann auch über die App Mails
   verschicken können".

   Das Skript läuft bei Google, nicht hier. Geprüft wird es mit nach-
   gebauten Apps-Script-Diensten (GmailApp, UrlFetchApp, …):
    · ohne FORMI_TOKEN passiert nichts;
    · eine neue Mail geht mit Schlüssel im Kopf an formiMail, die Antwort
      kommt in denselben Verlauf, danach gelesen + Label;
    · Abwesenheitsnotizen, noreply, Newsletter und eigene Mails bekommen
      keine Antwort (sonst schreiben sich zwei Automaten endlos an);
    · antwortet die Function nicht mit 200, bleibt die Mail ungelesen;
    · doPost verschickt nur mit richtigem Schlüssel und gültiger Adresse.

   NICHT geprüft (geht nur im echten Postfach): Gmail selbst, der
   Trigger, die echten Grenzen von Google.
   ══════════════════════════════════════════════════════════════════ */
const path = require('path');
let gut = 0, schlecht = 0;
function pruefe(was, ok, hinweis) {
  if (ok) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis !== undefined ? '  — ' + JSON.stringify(hinweis).slice(0, 300) : '')); }
}

function welt(opt) {
  const w = { abrufe: [], antworten: [], gesendet: [], props: Object.assign({ FORMI_TOKEN: 'tok-123' }, opt.props || {}) };
  const label = { name: 'formi' };
  w.verlaeufe = (opt.mails || []).map((m) => {
    const v = { gelesen: false, label: false };
    const n = {
      getFrom: () => m.von, getSubject: () => m.betreff || 'Frage', getPlainBody: () => m.text || 'Hallo?',
      isUnread: () => !v.gelesen, getHeader: (k) => (m.kopf || {})[k] || '',
      reply: (t, o) => w.antworten.push({ an: m.von, t, o })
    };
    v.getMessages = () => [n];
    v.markRead = () => { v.gelesen = true; };
    v.addLabel = () => { v.label = true; };
    return v;
  });
  global.PropertiesService = { getScriptProperties: () => ({ getProperty: (k) => w.props[k] || null }) };
  global.Session = { getEffectiveUser: () => ({ getEmail: () => 'formi.koerperformen@gmail.com' }) };
  global.GmailApp = {
    getUserLabelByName: () => label, createLabel: () => label,
    search: () => w.verlaeufe,
    sendEmail: (an, betreff, text, o) => w.gesendet.push({ an, betreff, text, o })
  };
  global.MailApp = { getRemainingDailyQuota: () => (opt.quota === undefined ? 90 : opt.quota) };
  global.UrlFetchApp = { fetch: (url, o) => { w.abrufe.push({ url, o }); const a = opt.antwort || { code: 200, body: { antwort: 'Hi, so geht das.' } };
    return { getResponseCode: () => a.code, getContentText: () => JSON.stringify(a.body) }; } };
  global.ContentService = { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ t, setMimeType() { return this; } }) };
  global.ScriptApp = { getProjectTriggers: () => [], deleteTrigger() {}, newTrigger: () => ({ timeBased: () => ({ everyMinutes: () => ({ create() {} }) }) }) };
  delete require.cache[require.resolve(path.join(__dirname, '..', 'tools', 'formi-mail', 'Code.gs'))];
  require.extensions['.gs'] = require.extensions['.gs'] || ((m, f) => m._compile(require('fs').readFileSync(f, 'utf8'), f));
  w.S = require(path.join(__dirname, '..', 'tools', 'formi-mail', 'Code.gs'));
  return w;
}

console.log('\n── Formi-Postfach (Apps Script) ──');
{
  const w = welt({ props: { FORMI_TOKEN: '' }, mails: [{ von: 'a@kformen.com' }] });
  pruefe('ohne FORMI_TOKEN: nichts abgerufen, nichts beantwortet', w.S.postfachPruefen() === 'kein Token' && !w.abrufe.length && !w.antworten.length);
}
{
  const w = welt({ mails: [{ von: 'Lea Meier <lea@kformen.com>', betreff: 'Westen', text: 'Wie wasche ich die Westen?' }] });
  w.S.postfachPruefen();
  const a = w.abrufe[0], p = a && JSON.parse(a.o.payload);
  pruefe('neue Mail → formiMail mit Schlüssel im Kopf, Absender ohne Namen, Betreff und Text',
    a && /cloudfunctions\.net\/formiMail$/.test(a.url) && a.o.headers['x-formi-token'] === 'tok-123' && p.von === 'lea@kformen.com' && p.betreff === 'Westen' && /Westen/.test(p.text), a && a.o);
  pruefe('… die Antwort kommt in denselben Verlauf, als „Formi · Körperformen"', w.antworten.length === 1 && w.antworten[0].t === 'Hi, so geht das.' && /Formi/.test(w.antworten[0].o.name));
  pruefe('… danach gelesen und mit Label', w.verlaeufe[0].gelesen && w.verlaeufe[0].label);
  pruefe('der Schlüssel steht NICHT im Inhalt der Anfrage', !/tok-123/.test(a.o.payload));
}
for (const [was, mail] of [
  ['Abwesenheitsnotiz (Auto-Submitted)', { von: 'b@kformen.com', kopf: { 'Auto-Submitted': 'auto-replied' } }],
  ['noreply-Absender', { von: 'Shop <no-reply@shop.de>' }],
  ['Newsletter (List-Unsubscribe)', { von: 'news@firma.de', kopf: { 'List-Unsubscribe': '<mailto:x@y>' } }],
  ['Mailer-Daemon', { von: 'MAILER-DAEMON@googlemail.com' }],
  ['eigene Mail des Postfachs', { von: 'Formi <formi.koerperformen@gmail.com>' }]
]) {
  const w = welt({ mails: [mail] });
  w.S.postfachPruefen();
  pruefe(was + ': keine Anfrage, keine Antwort, aber gelesen', !w.abrufe.length && !w.antworten.length && w.verlaeufe[0].gelesen);
}
{
  const w = welt({ mails: [{ von: 'c@kformen.com' }], antwort: { code: 500, body: {} } });
  w.S.postfachPruefen();
  pruefe('antwortet formiMail nicht mit 200: keine Antwort, Mail bleibt ungelesen (nächster Lauf versucht es wieder)', !w.antworten.length && !w.verlaeufe[0].gelesen);
}
{
  const w = welt({ mails: [{ von: 'd@kformen.com' }], antwort: { code: 200, body: { still: true } } });
  w.S.postfachPruefen();
  pruefe('„still" (z. B. Grenze erreicht): keine Antwort, aber gelesen', !w.antworten.length && w.verlaeufe[0].gelesen);
}
console.log('\n── Senden aus der App (doPost) ──');
{
  const w = welt({});
  const post = (d) => JSON.parse(w.S.doPost({ postData: { contents: JSON.stringify(d) } }).t);
  pruefe('falscher Schlüssel: nichts verschickt', post({ token: 'falsch', an: 'x@y.de', text: 'Hi' }).ok === false && !w.gesendet.length);
  pruefe('ohne Schlüssel: nichts verschickt', post({ an: 'x@y.de', text: 'Hi' }).ok === false && !w.gesendet.length);
  pruefe('ungültige Adresse: nichts verschickt', post({ token: 'tok-123', an: 'kein-mail', text: 'Hi' }).ok === false && !w.gesendet.length);
  const ok = post({ token: 'tok-123', an: 'lea@kformen.com', betreff: 'Schichtplan', text: 'Hallo Lea' });
  pruefe('richtiger Schlüssel: verschickt aus dem Formi-Postfach, mit Betreff und Text', ok.ok === true && w.gesendet.length === 1 && w.gesendet[0].an === 'lea@kformen.com' && w.gesendet[0].betreff === 'Schichtplan' && /Formi/.test(w.gesendet[0].o.name));
}
{
  const w = welt({ quota: 0 });
  const r = JSON.parse(w.S.doPost({ postData: { contents: JSON.stringify({ token: 'tok-123', an: 'x@y.de', text: 'Hi' }) } }).t);
  pruefe('Gmail-Tagesgrenze erreicht: ehrliche Meldung statt Fehler', r.ok === false && /Grenze/.test(r.fehler) && !w.gesendet.length);
}

console.log(schlecht
  ? '\n✗ Formi-Postfach: ' + schlecht + ' von ' + (gut + schlecht) + ' falsch'
  : '\n✓ Formi-Postfach: ' + gut + ' Zusicherungen');
process.exit(schlecht ? 1 : 0);
