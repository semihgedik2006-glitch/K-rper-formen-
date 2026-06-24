/**
 * StudioChat – Material live in Google Sheets
 * ============================================
 * Empfängt die Materialdaten aus dem Portal und schreibt sie in dieses Tabellenblatt.
 *
 * Einrichtung:
 * 1. Google-Tabelle öffnen (oder neu anlegen).
 * 2. Menü: Erweiterungen → Apps Script.
 * 3. Diesen kompletten Code dort einfügen und speichern.
 * 4. Oben rechts: Bereitstellen → Neue Bereitstellung → Typ „Web-App".
 *    - Ausführen als: Ich
 *    - Zugriff: „Jeder" (Anyone)
 *    - Bereitstellen → die Web-App-URL kopieren.
 * 5. Die URL in intern.html bei  var SHEETS_WEBHOOK_URL = "..."  einsetzen.
 *
 * Danach landet jede Material-Änderung automatisch hier im Blatt „Material".
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Material') || ss.insertSheet('Material');

    if (sh.getLastRow() === 0) {
      sh.appendRow(['Studio', 'Material', 'Vorhanden', 'Fehlt', 'Aktualisiert', 'von']);
      sh.getRange(1, 1, 1, 6).setFontWeight('bold');
    }

    var studio = data.studio || data.studioKey || '';

    // Bestehende Zeilen dieses Studios entfernen (von unten nach oben)
    var values = sh.getDataRange().getValues();
    for (var i = values.length - 1; i >= 1; i--) {
      if (values[i][0] === studio) sh.deleteRow(i + 1);
    }

    // Neue Zeilen anhängen
    var when = new Date(data.ts || Date.now());
    var items = data.items || [];
    items.forEach(function (it) {
      sh.appendRow([studio, it.name, it.have || 0, it.need || 0, when, data.updatedBy || '']);
    });

    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

// Zum Testen im Editor (optional)
function doGet() {
  return ContentService.createTextOutput('StudioChat Material-Sync laeuft.');
}
