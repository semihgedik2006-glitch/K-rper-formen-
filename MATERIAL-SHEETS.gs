/**
 * StudioChat – Material und Putzplan live in Google Sheets
 * =====================================================================
 * Schreibt die Daten aus der App in die Blätter "Material", "Putzplan"
 * und "Putzplan-Notizen" und formatiert sie lesbar: farbige Kopfzeile,
 * nach Studio sortiert, Blöcke abwechselnd schattiert, Fehlendes rot,
 * Erledigtes grün.
 *
 * UPDATE (wenn schon eingerichtet):
 * 1. Diesen Code komplett einfügen (alten ersetzen) und speichern (💾).
 * 2. "Bereitstellen" → "Bereitstellungen verwalten" → Stift-Symbol →
 *    Version: "Neue Version" → "Bereitstellen". Die URL bleibt gleich.
 *
 * ---------------------------------------------------------------------
 * NEU AM 11. AUGUST 2026: die Spalte "Kürzel"
 *
 * Im Putzplan steht sie zwischen "Erledigt von" und "Zeitpunkt", bei den
 * Notizen zwischen "von" und "Zeitpunkt". Grund: am Anfang bekommt nicht
 * jede Person einen Zugang, sondern jedes Studio einen — der Kontoname
 * ist dann bei jeder Zeile derselbe und sagt nichts darüber, wer
 * tatsächlich davorstand.
 *
 * Die vorhandenen Zeilen ziehen beim ersten Lauf nach dem Bereitstellen
 * von selbst um (kopfAngleichen). Zugeordnet wird über den Spalten-
 * NAMEN, nicht über die Position; sonst stünde der Zeitpunkt danach
 * unter "Kürzel". Es ist nichts von Hand zu tun, und es geht nichts
 * verloren.
 *
 * ---------------------------------------------------------------------
 * WAS SICH GEGENÜBER DER ALTEN FASSUNG GEÄNDERT HAT
 *
 * 1. Zeilen werden nicht mehr einzeln gelöscht.
 *    Vorher lief für jede zu ersetzende Zeile ein eigener deleteRow().
 *    Bei 14 Studios à 20 Artikeln waren das hunderte Einzelaufrufe – der
 *    mit Abstand teuerste Teil. Jetzt wird das Blatt einmal gelesen, im
 *    Speicher zusammengebaut und mit EINEM setValues() zurückgeschrieben.
 *
 * 2. Alle Studios auf einmal.
 *    Die App kann jetzt "alle 14 Studios" in einer einzigen Sendung
 *    schicken (type: 'material-alle' bzw. 'putzplan-alle'). Vorher waren
 *    das 14 Sendungen, von denen jede das komplette Blatt neu formatiert
 *    hat. Apps Script erlaubt 6 Minuten je Ausführung und rund 90 Minuten
 *    am Tag – das wurde mit wachsender Tabelle eng, und dann fehlten
 *    einzelne Studios, ohne dass irgendwo eine Fehlermeldung stand.
 *
 * 3. Formatiert wird einmal am Ende, nicht je Studio.
 * ---------------------------------------------------------------------
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.type === 'putzplan')       return handlePutzplan([data]);
    if (data.type === 'putzplan-alle')  return handlePutzplan(data.studios || []);
    if (data.type === 'material-alle')  return handleMaterial(data.studios || []);
    return handleMaterial([data]);      // Einzelnes Studio (Standardfall)

  } catch (err) {
    // Fehler sichtbar machen statt still schlucken – sonst sucht man lange
    console.error('doPost: ' + err);
    return ContentService.createTextOutput('Fehler: ' + err);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('StudioChat Sync laeuft.');
}

/* =====================================================================
 * Gemeinsamer Kern
 * ===================================================================== */

/** Blatt holen, notfalls anlegen, Kopfzeile sicherstellen. */
function blattHolen(name, kopf) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) { sh.appendRow(kopf); return sh; }
  kopfAngleichen(sh, kopf);
  return sh;
}

/**
 * Für jede Spalte der NEUEN Kopfzeile: an welcher Stelle stand sie in der
 * alten? -1 heisst "gab es noch nicht".
 *
 * Zugeordnet wird über den NAMEN, nicht über die Position. Genau darauf
 * kommt es an: kommt eine Spalte in der Mitte dazu, wandert alles
 * dahinter eine Stelle nach rechts. Ohne diese Zuordnung stünde in einer
 * gewachsenen Tabelle danach der Zeitpunkt unter "Kürzel" — und niemand
 * würde es merken, weil beides irgendwie plausibel aussieht.
 */
function spaltenAbbildung(alt, neu) {
  return neu.map(function (name) {
    for (var i = 0; i < alt.length; i++) {
      if (String(alt[i]).trim() === String(name).trim()) return i;
    }
    return -1;
  });
}

/**
 * Kopfzeile auf den heutigen Stand bringen und die vorhandenen Zeilen
 * mit umziehen. Passiert genau einmal, beim ersten Lauf nach einer
 * Änderung; danach ist die Kopfzeile gleich und die Funktion tut nichts.
 *
 * Eine Spalte, die es nicht mehr gibt, fällt dabei weg — mitsamt ihrem
 * Inhalt. Das ist gewollt, aber es ist der Grund, warum hier nur
 * Kopfzeilen stehen sollten, die wirklich gebraucht werden.
 */
function kopfAngleichen(sh, kopf) {
  var breite = Math.max(sh.getLastColumn(), kopf.length);
  var alt = sh.getRange(1, 1, 1, breite).getValues()[0];

  var gleich = true;
  for (var k = 0; k < breite; k++) {
    var soll = k < kopf.length ? String(kopf[k]) : '';
    if (String(alt[k] === undefined || alt[k] === null ? '' : alt[k]).trim() !== soll) {
      gleich = false; break;
    }
  }
  if (gleich) return;

  var abb = spaltenAbbildung(alt, kopf);
  var alle = sh.getDataRange().getValues();
  var umgezogen = [];
  for (var i = 1; i < alle.length; i++) {
    var z = alle[i];
    if (!z[0] && !z[1]) continue;                       // Leerzeile
    umgezogen.push(abb.map(function (q) {
      return (q < 0 || z[q] === undefined || z[q] === null) ? '' : z[q];
    }));
  }

  if (sh.getMaxRows() > 1) {
    sh.getRange(2, 1, sh.getMaxRows() - 1, breite).clearContent().clearFormat();
  }
  sh.getRange(1, 1, 1, kopf.length).setValues([kopf]);
  if (umgezogen.length) {
    if (sh.getMaxRows() < umgezogen.length + 1) {
      sh.insertRowsAfter(sh.getMaxRows(), umgezogen.length + 1 - sh.getMaxRows());
    }
    sh.getRange(2, 1, umgezogen.length, kopf.length).setValues(umgezogen);
  }
}

/**
 * Ersetzt alle Zeilen der genannten Studios durch neue – in einem Rutsch.
 *
 * @param sh        das Blatt
 * @param spalten   Anzahl Spalten
 * @param ersetzen  Namen der Studios, deren Zeilen weg sollen
 * @param neu       die neuen Zeilen (Arrays)
 */
function zeilenErsetzen(sh, spalten, ersetzen, neu) {
  var weg = {};
  ersetzen.forEach(function (s) { weg[s] = true; });

  var alle = sh.getDataRange().getValues();
  var kopf = alle[0];
  var behalten = [];
  for (var i = 1; i < alle.length; i++) {
    var zeile = alle[i];
    // Leerzeilen und Zeilen der zu ersetzenden Studios fallen weg
    if (!zeile[0] && !zeile[1]) continue;
    if (weg[zeile[0]]) continue;
    /* Auf die volle Breite bringen. getValues() liefert nur so viele
       Spalten, wie tatsächlich beschrieben sind — eine Zeile ohne
       Kürzel käme sonst kürzer zurück, und setValues() lehnt ein
       Rechteck mit unterschiedlich langen Zeilen ab. */
    var z = zeile.slice(0, spalten);
    while (z.length < spalten) z.push('');
    behalten.push(z);
  }

  var daten = behalten.concat(neu);

  // Nach Studio, dann nach dem zweiten Feld sortieren – hier statt im
  // Blatt, das spart einen weiteren Aufruf an die Tabelle.
  daten.sort(function (a, b) {
    var s = String(a[0]).localeCompare(String(b[0]), 'de');
    return s !== 0 ? s : String(a[1]).localeCompare(String(b[1]), 'de');
  });

  // Alles unter der Kopfzeile leeren und in EINEM Aufruf neu schreiben
  var vorher = Math.max(0, sh.getMaxRows() - 1);
  if (vorher > 0) sh.getRange(2, 1, vorher, spalten).clearContent().clearFormat();
  if (daten.length) {
    // Genug Zeilen? Sonst welche anhängen.
    if (sh.getMaxRows() < daten.length + 1) {
      sh.insertRowsAfter(sh.getMaxRows(), daten.length + 1 - sh.getMaxRows());
    }
    sh.getRange(2, 1, daten.length, spalten).setValues(daten);
  }
  return daten;
}

/** Wechselnde Schattierung je Studio-Block + Rahmen. */
function bloeckeFaerben(sh, daten, spalten, hellA, hellB, tonA, tonB, textfarbe) {
  var n = daten.length;
  if (!n) return [];
  var grid = [], stBg = [], blockStarts = [];
  var block = -1, vorher = null;
  for (var r = 0; r < n; r++) {
    var st = daten[r][0];
    if (st !== vorher) { block++; vorher = st; if (r > 0) blockStarts.push(r + 2); }
    var gerade = (block % 2 === 0);
    var ton = gerade ? hellA : hellB;
    var zeile = [];
    for (var c = 0; c < spalten; c++) zeile.push(ton);
    grid.push(zeile);
    stBg.push([gerade ? tonA : tonB]);
  }
  sh.getRange(2, 1, n, spalten).setBackgrounds(grid).setFontColor('#1f1f1f');
  sh.getRange(2, 1, n, 1).setBackgrounds(stBg)
    .setFontWeights(grid.map(function () { return ['bold']; }))
    .setFontColor(textfarbe);
  return blockStarts;
}

function rahmenSetzen(sh, zeilen, spalten, fein, dick, blockStarts) {
  sh.getRange(1, 1, zeilen + 1, spalten)
    .setBorder(true, true, true, true, true, true, fein, SpreadsheetApp.BorderStyle.SOLID);
  blockStarts.forEach(function (r) {
    sh.getRange(r, 1, 1, spalten)
      .setBorder(true, null, null, null, null, null, dick, SpreadsheetApp.BorderStyle.SOLID_THICK);
  });
}

function kopfFaerben(sh, spalten, hintergrund, schrift) {
  sh.getRange(1, 1, 1, spalten)
    .setBackground(hintergrund).setFontColor(schrift)
    .setFontWeight('bold').setFontSize(11).setHorizontalAlignment('left');
  sh.setFrozenRows(1);
}

/* =====================================================================
 * MATERIAL
 * ===================================================================== */
function handleMaterial(sendungen) {
  var SP = 6;
  var sh = blattHolen('Material',
    ['Studio', 'Material', 'Vorhanden', 'Fehlt', 'Aktualisiert', 'von']);

  var studios = [], neu = [];
  sendungen.forEach(function (d) {
    var studio = d.studio || d.studioKey || '';
    if (!studio) return;
    studios.push(studio);
    var wann = new Date(d.ts || Date.now());
    (d.items || []).forEach(function (it) {
      neu.push([studio, it.name, it.have || 0, it.need || 0, wann, d.updatedBy || '']);
    });
  });

  var daten = zeilenErsetzen(sh, SP, studios, neu);

  kopfFaerben(sh, SP, '#0E1712', '#19FF85');
  if (daten.length) {
    var starts = bloeckeFaerben(sh, daten, SP, '#ffffff', '#e9f1ee', '#bfe9d2', '#a3ddc0', '#0a3a24');

    // "Fehlt" hervorheben: rot wenn etwas fehlt, sonst dezent grün
    var fBg = [], fFc = [], fFw = [];
    daten.forEach(function (z) {
      if (Number(z[3]) > 0) { fBg.push(['#ffd6d6']); fFc.push(['#a30000']); fFw.push(['bold']); }
      else                  { fBg.push(['#eafff2']); fFc.push(['#7a9a8c']); fFw.push(['normal']); }
    });
    sh.getRange(2, 4, daten.length, 1).setBackgrounds(fBg).setFontColors(fFc).setFontWeights(fFw);
    sh.getRange(2, 3, daten.length, 2).setHorizontalAlignment('center');

    rahmenSetzen(sh, daten.length, SP, '#cfdad4', '#0E1712', starts);
  }
  for (var c = 1; c <= SP; c++) sh.autoResizeColumn(c);

  return ContentService.createTextOutput('ok ' + studios.length + ' Studio(s), ' + neu.length + ' Zeilen');
}

/* =====================================================================
 * PUTZPLAN (Aufgaben + Notizen)
 * ===================================================================== */
function handlePutzplan(sendungen) {
  var SP = 8, SN = 5;

  /* "Kürzel" steht neben "Erledigt von", nicht an dessen Stelle.
     Der Kontoname sagt, an welchem Gerät gearbeitet wurde — am Anfang
     hat jedes Studio einen Zugang, nicht jede Person. Das Kürzel sagt,
     wer davorstand. Erst beides zusammen beantwortet die Frage. */
  var sh = blattHolen('Putzplan',
    ['Studio', 'Aufgabe', 'Wiederholung', 'Status',
     'Erledigt von', 'Kürzel', 'Zeitpunkt', 'Aktualisiert']);
  var shN = blattHolen('Putzplan-Notizen',
    ['Studio', 'Notiz', 'von', 'Kürzel', 'Zeitpunkt']);

  var studios = [], neu = [], neuN = [];
  sendungen.forEach(function (d) {
    var studio = d.studio || d.studioKey || '';
    if (!studio) return;
    studios.push(studio);
    var wann = new Date(d.ts || Date.now());
    (d.tasks || []).forEach(function (t) {
      neu.push([studio, t.title || '', t.wiederholung || '', t.status || '',
                t.erledigtVon || '', t.kuerzel || '', t.zeitpunkt || '', wann]);
    });
    (d.notes || []).forEach(function (n) {
      neuN.push([studio, n.text || '', n.by || '', n.kuerzel || '', n.zeit || '']);
    });
  });

  // --- Aufgaben ---
  var daten = zeilenErsetzen(sh, SP, studios, neu);
  kopfFaerben(sh, SP, '#0B0A1C', '#22D3EE');
  if (daten.length) {
    var starts = bloeckeFaerben(sh, daten, SP, '#ffffff', '#f0edfa', '#e5dbff', '#d8c9fb', '#3b1d6e');

    var stBg = [], stFc = [];
    daten.forEach(function (z) {
      if (String(z[3]).toLowerCase() === 'erledigt') { stBg.push(['#dcfce7']); stFc.push(['#166534']); }
      else                                          { stBg.push(['#fef9c3']); stFc.push(['#854d0e']); }
    });
    sh.getRange(2, 4, daten.length, 1).setBackgrounds(stBg).setFontColors(stFc)
      .setFontWeights(daten.map(function () { return ['bold']; }))
      .setHorizontalAlignment('center');

    /* Das Kürzel ist die Spalte, nach der der Chef filtert. Deshalb
       mittig und fett — sonst geht sie zwischen zwei Textspalten unter. */
    sh.getRange(2, 6, daten.length, 1)
      .setFontWeights(daten.map(function () { return ['bold']; }))
      .setHorizontalAlignment('center');

    rahmenSetzen(sh, daten.length, SP, '#d5cfe6', '#0B0A1C', starts);
  }
  for (var c = 1; c <= SP; c++) sh.autoResizeColumn(c);

  // --- Notizen ---
  var datenN = zeilenErsetzen(shN, SN, studios, neuN);
  kopfFaerben(shN, SN, '#0B0A1C', '#F472B6');
  if (datenN.length) {
    var startsN = bloeckeFaerben(shN, datenN, SN, '#ffffff', '#fdf2f8', '#fbcfe8', '#f9a8d4', '#831843');
    rahmenSetzen(shN, datenN.length, SN, '#e2d5ec', '#0B0A1C', startsN);
  }
  for (var c2 = 1; c2 <= SN; c2++) shN.autoResizeColumn(c2);

  return ContentService.createTextOutput('ok ' + studios.length + ' Studio(s), ' + neu.length + ' Aufgaben');
}

/* HINWEIS: Es gibt bewusst KEINE Zeitstempel-Prüfung.
   Eine frühere Fassung hat Sendungen verworfen, deren Zeitstempel älter war
   als der zuletzt gespeicherte. Da der Zeitstempel von der Uhr des jeweiligen
   Handys kam, wurden bei leicht abweichenden Uhrzeiten dauerhaft Sendungen
   einzelner Geräte ignoriert – dadurch fehlten Studios und Aufgaben.
   Jede Sendung enthält immer den KOMPLETTEN aktuellen Stand der genannten
   Studios, deshalb ist "die zuletzt eingetroffene gewinnt" hier korrekt.
   Das Sperren (LockService) in doPost verhindert Überschneidungen. */
