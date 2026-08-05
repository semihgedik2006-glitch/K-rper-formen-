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
    // Putzplan wird in eigene Blätter geschrieben (siehe unten)
    if (data.type === 'putzplan') {
      return handlePutzplan(data);
    }
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

/* =====================================================================
 * PUTZPLAN – schreibt Reinigungsaufgaben ins Blatt "Putzplan" und die
 * Team-Notizen ins Blatt "Putzplan-Notizen". Zeigt, wer wann erledigt hat.
 * ===================================================================== */
function handlePutzplan(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var studio = data.studio || data.studioKey || '';

  // --- Aufgaben ---
  var sh = ss.getSheetByName('Putzplan') || ss.insertSheet('Putzplan');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Studio', 'Aufgabe', 'Wiederholung', 'Status', 'Erledigt von', 'Zeitpunkt', 'Aktualisiert']);
  }
  var vals = sh.getDataRange().getValues();
  for (var i = vals.length - 1; i >= 1; i--) {
    if (vals[i][0] === studio) sh.deleteRow(i + 1);
  }
  var now = new Date(data.ts || Date.now());
  (data.tasks || []).forEach(function (t) {
    sh.appendRow([studio, t.title || '', t.wiederholung || '', t.status || '',
      t.erledigtVon || '', t.zeitpunkt || '', now]);
  });
  formatPutzplan(sh);

  // --- Notizen ---
  var shN = ss.getSheetByName('Putzplan-Notizen') || ss.insertSheet('Putzplan-Notizen');
  if (shN.getLastRow() === 0) {
    shN.appendRow(['Studio', 'Notiz', 'von', 'Zeitpunkt']);
  }
  var valsN = shN.getDataRange().getValues();
  for (var j = valsN.length - 1; j >= 1; j--) {
    if (valsN[j][0] === studio) shN.deleteRow(j + 1);
  }
  (data.notes || []).forEach(function (n) {
    shN.appendRow([studio, n.text || '', n.by || '', n.zeit || '']);
  });
  formatNotes(shN);

  return ContentService.createTextOutput('ok');
}

function formatPutzplan(sh) {
  var lastRow = sh.getLastRow();
  var lastCol = 7;
  sh.getRange(1, 1, 1, lastCol)
    .setBackground('#0B0A1C').setFontColor('#22D3EE')
    .setFontWeight('bold').setFontSize(11).setHorizontalAlignment('left');
  sh.setFrozenRows(1);

  if (lastRow > 1) {
    var n = lastRow - 1;
    sh.getRange(2, 1, n, lastCol)
      .sort([{ column: 1, ascending: true }, { column: 2, ascending: true }]);

    var studios = sh.getRange(2, 1, n, 1).getValues();
    var status = sh.getRange(2, 4, n, 1).getValues();
    var shadeA = '#ffffff', shadeB = '#f0edfa';
    var tintA = '#e5dbff', tintB = '#d8c9fb';
    var grid = [], aBg = [], stBg = [], stFc = [], stFw = [];
    var blockIndex = -1, prev = null, blockStarts = [];
    for (var r = 0; r < n; r++) {
      var st = studios[r][0];
      if (st !== prev) { blockIndex++; prev = st; if (r > 0) blockStarts.push(r + 2); }
      var even = (blockIndex % 2 === 0);
      var shade = even ? shadeA : shadeB;
      grid.push([shade, shade, shade, shade, shade, shade, shade]);
      aBg.push([even ? tintA : tintB]);
      if (String(status[r][0]).toLowerCase() === 'erledigt') { stBg.push(['#dcfce7']); stFc.push(['#166534']); stFw.push(['bold']); }
      else { stBg.push(['#fef9c3']); stFc.push(['#854d0e']); stFw.push(['bold']); }
    }
    sh.getRange(2, 1, n, lastCol).setBackgrounds(grid).setFontColor('#1f1f1f');
    sh.getRange(2, 1, n, 1).setBackgrounds(aBg).setFontWeights(new Array(n).fill(['bold'])).setFontColor('#3b1d6e');
    sh.getRange(2, 4, n, 1).setBackgrounds(stBg).setFontColors(stFc).setFontWeights(stFw).setHorizontalAlignment('center');

    sh.getRange(1, 1, lastRow, lastCol)
      .setBorder(true, true, true, true, true, true, '#d5cfe6', SpreadsheetApp.BorderStyle.SOLID);
    blockStarts.forEach(function (rowNum) {
      sh.getRange(rowNum, 1, 1, lastCol)
        .setBorder(true, null, null, null, null, null, '#0B0A1C', SpreadsheetApp.BorderStyle.SOLID_THICK);
    });
  }
  for (var c = 1; c <= lastCol; c++) sh.autoResizeColumn(c);
}

function formatNotes(sh) {
  var lastRow = sh.getLastRow();
  var lastCol = 4;
  sh.getRange(1, 1, 1, lastCol)
    .setBackground('#0B0A1C').setFontColor('#F472B6')
    .setFontWeight('bold').setFontSize(11);
  sh.setFrozenRows(1);
  if (lastRow > 1) {
    sh.getRange(2, 1, lastRow - 1, lastCol)
      .setBorder(true, true, true, true, true, true, '#e2d5ec', SpreadsheetApp.BorderStyle.SOLID);
  }
  for (var c = 1; c <= lastCol; c++) sh.autoResizeColumn(c);
}

/* HINWEIS: Es gibt bewusst KEINE Zeitstempel-Prüfung mehr.
   Eine frühere Version hat Sendungen verworfen, deren Zeitstempel älter war
   als der zuletzt gespeicherte. Da der Zeitstempel von der Uhr des jeweiligen
   Handys kam, wurden bei leicht abweichenden Uhrzeiten dauerhaft Sendungen
   einzelner Geräte ignoriert – dadurch fehlten Studios und Aufgaben.
   Jede Sendung enthält immer den KOMPLETTEN aktuellen Stand eines Studios,
   deshalb ist "die zuletzt eingetroffene gewinnt" hier korrekt. Das Sperren
   (LockService) in doPost verhindert, dass sich zwei Sendungen überschneiden. */

function doGet() {
  return ContentService.createTextOutput('StudioChat Material-Sync laeuft.');
}
