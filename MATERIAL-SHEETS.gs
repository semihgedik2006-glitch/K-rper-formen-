/**
 * StudioChat – Material live in Google Sheets (mit schöner Formatierung)
 * =====================================================================
 * Empfängt die Materialdaten aus dem Portal, schreibt sie ins Blatt "Material"
 * und formatiert es automatisch (grüner Kopf, sortiert, fehlende Mengen rot).
 *
 * UPDATE (wenn schon eingerichtet):
 * 1. Diesen Code komplett einfügen (alten ersetzen) und speichern (💾).
 * 2. Oben "Bereitstellen" -> "Bereitstellungen verwalten" ->
 *    bei deiner Web-App auf das Stift-Symbol -> Version: "Neue Version" ->
 *    "Bereitstellen". Die URL bleibt gleich.
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
    }

    // Alte Zeilen dieses Studios entfernen
    var studio = data.studio || data.studioKey || '';
    var values = sh.getDataRange().getValues();
    for (var i = values.length - 1; i >= 1; i--) {
      if (values[i][0] === studio) sh.deleteRow(i + 1);
    }

    // Neue Zeilen anhängen
    var when = new Date(data.ts || Date.now());
    (data.items || []).forEach(function (it) {
      sh.appendRow([studio, it.name, it.have || 0, it.need || 0, when, data.updatedBy || '']);
    });

    formatSheet(sh);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

function formatSheet(sh) {
  var lastRow = sh.getLastRow();
  var lastCol = 6;

  // Kopfzeile: dunkelgrün mit Neon-Schrift, fixiert
  sh.getRange(1, 1, 1, lastCol)
    .setBackground('#0E1712').setFontColor('#19FF85')
    .setFontWeight('bold').setFontSize(11)
    .setHorizontalAlignment('left');
  sh.setFrozenRows(1);

  if (lastRow > 1) {
    var n = lastRow - 1;

    // Nach Studio, dann Material sortieren
    sh.getRange(2, 1, n, lastCol)
      .sort([{ column: 1, ascending: true }, { column: 2, ascending: true }]);

    // Grundfarbe Datenbereich
    sh.getRange(2, 1, n, lastCol).setBackground('#ffffff').setFontColor('#1f1f1f');

    // Spalte "Fehlt" (4) hervorheben
    var fehlt = sh.getRange(2, 4, n, 1).getValues();
    var bg = [], fc = [], fw = [];
    for (var r = 0; r < n; r++) {
      if (Number(fehlt[r][0]) > 0) { bg.push(['#ffd6d6']); fc.push(['#a30000']); fw.push(['bold']); }
      else { bg.push(['#eafff2']); fc.push(['#6a8a7c']); fw.push(['normal']); }
    }
    sh.getRange(2, 4, n, 1).setBackgrounds(bg).setFontColors(fc).setFontWeights(fw);

    // Zahlen mittig
    sh.getRange(2, 3, n, 2).setHorizontalAlignment('center');
  }

  // Rahmen + Spaltenbreiten
  sh.getRange(1, 1, Math.max(lastRow, 1), lastCol)
    .setBorder(true, true, true, true, true, true, '#d9e2dd', SpreadsheetApp.BorderStyle.SOLID);
  for (var c = 1; c <= lastCol; c++) sh.autoResizeColumn(c);
}

function doGet() {
  return ContentService.createTextOutput('StudioChat Material-Sync laeuft.');
}
