/**
 * Formi per Mail – Apps Script im eigenen Formi-Gmail-Postfach
 * =====================================================================
 * Aus dem Betrieb (20.10.2026): „nur Mail erstmal falls das möglich ist
 * kostenlos". Dieses Skript läuft im Formi-Postfach (ein eigenes, kosten-
 * loses Gmail) und braucht keinen Server:
 *
 *  1. Alle 5 Minuten (Trigger) schaut es nach ungelesenen Mails im
 *     Posteingang, schickt den neuen Text an die Cloud Function
 *     „formiMail" und antwortet im selben Verlauf mit dem, was Formi
 *     zurückgibt. Danach: gelesen und Label „formi".
 *  2. Als Web-App nimmt es Mails aus der App entgegen (formiMailSenden)
 *     und verschickt sie aus diesem Postfach.
 *
 * Einrichten: tools/formi-mail/ANLEITUNG.md.
 *
 * IN DIESEM CODE STEHT KEIN SCHLÜSSEL. Das Repository ist öffentlich.
 * Der Schlüssel liegt in den Skript-Eigenschaften (FORMI_TOKEN), dieselbe
 * Zeichenfolge wie das GitHub Secret FORMI_MAIL_TOKEN.
 *
 * Nicht beantwortet werden: automatische Mails (Abwesenheitsnotizen,
 * Newsletter, „noreply", Mailer-Daemon) – sonst schreiben sich zwei
 * Automaten endlos an –, und Mails aus diesem Postfach selbst.
 */

var FUNKTION_STANDARD = 'https://europe-west1-formenchat.cloudfunctions.net/formiMail';
var LABEL = 'formi';
var PRO_LAUF = 15;

function eigenschaft_(name) {
  return PropertiesService.getScriptProperties().getProperty(name) || '';
}

/* Einmal von Hand ausführen: legt das Label und den 5-Minuten-Trigger an. */
function einrichten() {
  if (!eigenschaft_('FORMI_TOKEN')) throw new Error('Zuerst unter Projekteinstellungen → Skripteigenschaften FORMI_TOKEN setzen.');
  if (!GmailApp.getUserLabelByName(LABEL)) GmailApp.createLabel(LABEL);
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'postfachPruefen') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('postfachPruefen').timeBased().everyMinutes(5).create();
  return 'eingerichtet';
}

/* Absenderadresse aus „Name <a@b.de>" */
function adresse_(von) {
  var m = /<([^>]+)>/.exec(String(von || ''));
  return String(m ? m[1] : von || '').trim().toLowerCase();
}

/* Automatische Mails erkennen – darauf antwortet Formi nie. */
function automatisch_(nachricht, von) {
  if (/(^|[._-])(no-?reply|do-?not-?reply|mailer-daemon|postmaster|bounce)/i.test(von)) return true;
  var kopf = function (n) { try { return String(nachricht.getHeader(n) || ''); } catch (e) { return ''; } };
  if (/^(auto-replied|auto-generated)/i.test(kopf('Auto-Submitted'))) return true;
  if (/^(bulk|list|junk|auto_reply)$/i.test(kopf('Precedence').trim())) return true;
  if (kopf('List-Id') || kopf('List-Unsubscribe') || kopf('X-Autoreply') || kopf('X-Autorespond')) return true;
  return false;
}

/* Der Trigger: neue Mails lesen, an Formi geben, antworten. */
function postfachPruefen() {
  var token = eigenschaft_('FORMI_TOKEN');
  if (!token) return 'kein Token';
  var url = eigenschaft_('FUNKTION_URL') || FUNKTION_STANDARD;
  var ich = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  var label = GmailApp.getUserLabelByName(LABEL) || GmailApp.createLabel(LABEL);
  var verlaeufe = GmailApp.search('in:inbox is:unread', 0, PRO_LAUF);
  var bearbeitet = 0;
  verlaeufe.forEach(function (verlauf) {
    var nachrichten = verlauf.getMessages();
    var neu = nachrichten.filter(function (n) { return n.isUnread(); });
    var letzte = neu[neu.length - 1];
    var von = letzte ? adresse_(letzte.getFrom()) : '';
    if (!letzte || von === ich || automatisch_(letzte, von)) {
      verlauf.markRead(); verlauf.addLabel(label); return;
    }
    var antwort;
    try {
      antwort = UrlFetchApp.fetch(url, {
        method: 'post', contentType: 'application/json', muteHttpExceptions: true,
        headers: { 'x-formi-token': token },
        payload: JSON.stringify({ von: von, betreff: letzte.getSubject(), text: letzte.getPlainBody() })
      });
    } catch (e) {
      return; // Netz weg: ungelesen lassen, der nächste Lauf versucht es wieder
    }
    if (antwort.getResponseCode() !== 200) return;
    var d = {};
    try { d = JSON.parse(antwort.getContentText() || '{}'); } catch (e) { d = {}; }
    if (d.antwort) letzte.reply(String(d.antwort), { name: 'Formi · Körperformen' });
    verlauf.markRead(); verlauf.addLabel(label);
    bearbeitet++;
  });
  return bearbeitet;
}

/* Web-App: Mails aus der App verschicken (Function formiMailSenden).
   Web-Apps sehen keine Kopfzeilen – der Schlüssel steht im Inhalt. */
function doPost(e) {
  var aus = function (o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); };
  var d = {};
  try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) { return aus({ ok: false, fehler: 'kein JSON' }); }
  var token = eigenschaft_('FORMI_TOKEN');
  if (!token || String(d.token || '') !== token) return aus({ ok: false, fehler: 'Kein Zugriff' });
  var an = String(d.an || '').trim();
  if (!/^[^\s@<>(),;:"']{1,64}@[a-z0-9.-]{1,120}\.[a-z]{2,24}$/i.test(an)) return aus({ ok: false, fehler: 'Adresse ungültig' });
  if (MailApp.getRemainingDailyQuota() < 1) return aus({ ok: false, fehler: 'Für heute sind keine Mails mehr frei (Gmail-Grenze).' });
  GmailApp.sendEmail(an, String(d.betreff || 'Nachricht aus dem Studio').slice(0, 120), String(d.text || '').slice(0, 5000), { name: 'Formi · Körperformen' });
  return aus({ ok: true });
}

/* Für node-Tests (tests/test-formi-mail-skript.js) – in Apps Script ohne Wirkung. */
if (typeof module !== 'undefined') module.exports = { postfachPruefen: postfachPruefen, doPost: doPost, einrichten: einrichten, adresse_: adresse_, automatisch_: automatisch_ };
