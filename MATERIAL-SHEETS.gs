/**
 * StudioChat – Material live in Google Sheets (mit schöner Formatierung)
 * =====================================================================
 * Schreibt die Materialdaten ins Blatt "Material" und formatiert es:
 * grüner Kopf, nach Studio sortiert, klare Studio-Blöcke (abwechselnde
 * Schattierung + Trennlinie), fehlende Mengen rot.
 *
 * UPDATE (wenn schon eingerichtet):
 * 1. Diesen Code komplett einfügen (alten ersetzen) und speichern (💾).
 * 2. "Bereitstellen" -> "Bereitstellungen verwalten" -> Stift-Symbol ->
 *    Version: "Neue Version" -> "Bereitstellen". URL bleibt gleich.
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

    var studio = data.studio || data.studioKey || '';
    var values = sh.getDataRange().getValues();
    for (var i = values.length - 1; i >= 1; i--) {
      if (values[i][0] === studio) sh.deleteRow(i + 1);
    }

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

  // Kopfzeile
  sh.getRange(1, 1, 1, lastCol)
    .setBackground('#0E1712').setFontColor('#19FF85')
    .setFontWeight('bold').setFontSize(11).setHorizontalAlignment('left');
  sh.setFrozenRows(1);

  if (lastRow > 1) {
    var n = lastRow - 1;

    // Nach Studio, dann Material sortieren
    sh.getRange(2, 1, n, lastCol)
      .sort([{ column: 1, ascending: true }, { column: 2, ascending: true }]);

    var studios = sh.getRange(2, 1, n, 1).getValues();
    var fehlt = sh.getRange(2, 4, n, 1).getValues();

    // zwei Schattierungen, die pro Studio-Block wechseln
    var shadeA = '#ffffff', shadeB = '#e9f1ee';
    var stTintA = '#bfe9d2', stTintB = '#a3ddc0';

    var grid = [], aBg = [], aFw = [], fBg = [], fFc = [], fFw = [];
    var blockIndex = -1, prev = null, blockStarts = [];
    for (var r = 0; r < n; r++) {
      var st = studios[r][0];
      if (st !== prev) { blockIndex++; prev = st; if (r > 0) blockStarts.push(r + 2); }
      var even = (blockIndex % 2 === 0);
      var shade = even ? shadeA : shadeB;
      grid.push([shade, shade, shade, shade, shade, shade]);
      aBg.push([even ? stTintA : stTintB]);
      aFw.push(['bold']);
      if (Number(fehlt[r][0]) > 0) { fBg.push(['#ffd6d6']); fFc.push(['#a30000']); fFw.push(['bold']); }
      else { fBg.push(['#eafff2']); fFc.push(['#7a9a8c']); fFw.push(['normal']); }
    }

    // Hintergründe setzen
    sh.getRange(2, 1, n, lastCol).setBackgrounds(grid).setFontColor('#1f1f1f');
    sh.getRange(2, 1, n, 1).setBackgrounds(aBg).setFontWeights(aFw).setFontColor('#0a3a24'); // Studio-Spalte
    sh.getRange(2, 4, n, 1).setBackgrounds(fBg).setFontColors(fFc).setFontWeights(fFw);        // Fehlt
    sh.getRange(2, 3, n, 2).setHorizontalAlignment('center');

    // erst das feine Gesamtgitter ...
    sh.getRange(1, 1, lastRow, lastCol)
      .setBorder(true, true, true, true, true, true, '#cfdad4', SpreadsheetApp.BorderStyle.SOLID);
    // ... dann die DICKE Trennlinie oben an jedem neuen Studio (gewinnt)
    blockStarts.forEach(function (rowNum) {
      sh.getRange(rowNum, 1, 1, lastCol)
        .setBorder(true, null, null, null, null, null, '#0E1712', SpreadsheetApp.BorderStyle.SOLID_THICK);
    });
  } else {
    sh.getRange(1, 1, 1, lastCol)
      .setBorder(true, true, true, true, true, true, '#cfdad4', SpreadsheetApp.BorderStyle.SOLID);
  }

  for (var c = 1; c <= lastCol; c++) sh.autoResizeColumn(c);
}

function doGet() {
  return ContentService.createTextOutput('StudioChat Material-Sync laeuft.');
}
