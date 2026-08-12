/* ── Das Kürzel in der Google-Tabelle ─────────────────────────────────
   WARUM ES DIESEN DURCHLAUF GIBT

   Die Tabelle bekommt eine neue Spalte, und zwar MITTEN im Blatt:
   „Kürzel" zwischen „Erledigt von" und „Zeitpunkt". Das ist der
   gefährlichste Ort dafür.

   In der Tabelle des Betriebs stehen schon Zeilen. Wer eine Spalte in
   der Mitte einfügt und die alten Zeilen einfach stehen lässt, hat
   danach den Zeitpunkt unter „Kürzel" stehen — und es fällt niemandem
   auf, weil beides irgendwie plausibel aussieht. Eine falsche Auskunft,
   die wie eine richtige aussieht, ist schlimmer als gar keine.

   Der Umbau ordnet deshalb über den SPALTENNAMEN zu, nicht über die
   Position. Genau das wird hier gemessen.

   WAS DIESER DURCHLAUF NICHT KANN
   Er führt den Code in einer nachgebauten Tabelle aus, nicht in Google
   Apps Script. Er beweist die Logik, nicht das Zusammenspiel mit Google.
   Ob die neue Fassung dort läuft, zeigt sich erst nach dem erneuten
   Bereitstellen — das steht oben in tools/MATERIAL-SHEETS.gs.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const errs = [];
/* Über GS lässt sich eine andere Fassung einhängen. Gebraucht für die
   Gegenprobe: eine absichtlich kaputte Fassung MUSS hier durchfallen,
   sonst misst der Durchlauf nichts. */
const QUELLE = process.env.GS || path.join(__dirname, '..', 'tools', 'MATERIAL-SHEETS.gs');

/* ── Eine Tabelle, die sich wie eine Tabelle verhält ──
   Wichtig ist vor allem setValues: es nimmt nur ein Rechteck an. Genau
   daran scheitert es in echt, wenn eine alte Zeile kürzer ist als die
   neue Kopfzeile — deshalb meckert der Nachbau hier genauso. */
function Blatt(name, inhalt) {
  this.name = name;
  this.zeilen = (inhalt || []).map(function (z) { return z.slice(); });
  this.maxRows = Math.max(this.zeilen.length, 20);
}
Blatt.prototype.gefuellt = function (z) {
  return z && z.some(function (c) { return c !== '' && c !== null && c !== undefined; });
};
Blatt.prototype.getLastRow = function () {
  var n = 0, self = this;
  this.zeilen.forEach(function (z, i) { if (self.gefuellt(z)) n = i + 1; });
  return n;
};
Blatt.prototype.getLastColumn = function () {
  var n = 0;
  this.zeilen.forEach(function (z) {
    z.forEach(function (c, j) { if (c !== '' && c !== null && c !== undefined) n = Math.max(n, j + 1); });
  });
  return n;
};
Blatt.prototype.appendRow = function (z) {
  this.zeilen.push(z.slice());
  this.maxRows = Math.max(this.maxRows, this.zeilen.length);
};
Blatt.prototype.getMaxRows = function () { return this.maxRows; };
Blatt.prototype.insertRowsAfter = function (_nach, wieviele) { this.maxRows += wieviele; };
Blatt.prototype.setFrozenRows = function () { return this; };
Blatt.prototype.autoResizeColumn = function () { return this; };
Blatt.prototype.getDataRange = function () {
  return this.getRange(1, 1, this.getLastRow(), this.getLastColumn());
};
Blatt.prototype.getRange = function (r, c, nr, nc) {
  const sh = this;
  const nix = function () { return bereich; };
  const bereich = {
    getValues: function () {
      const raus = [];
      for (let i = 0; i < nr; i++) {
        const zeile = [];
        for (let j = 0; j < nc; j++) {
          const q = sh.zeilen[r - 1 + i];
          const v = q ? q[c - 1 + j] : undefined;
          zeile.push(v === undefined || v === null ? '' : v);
        }
        raus.push(zeile);
      }
      return raus;
    },
    setValues: function (werte) {
      if (werte.length !== nr) {
        throw new Error('setValues: ' + werte.length + ' Zeilen für ' + nr + ' Plätze');
      }
      werte.forEach(function (z, i) {
        if (z.length !== nc) {
          throw new Error('setValues: Zeile ' + i + ' hat ' + z.length +
                          ' Spalten, das Rechteck ist ' + nc + ' breit');
        }
        while (sh.zeilen.length < r + i) sh.zeilen.push([]);
        for (let j = 0; j < nc; j++) sh.zeilen[r - 1 + i][c - 1 + j] = z[j];
      });
      sh.maxRows = Math.max(sh.maxRows, sh.zeilen.length);
      return bereich;
    },
    clearContent: function () {
      for (let i = 0; i < nr; i++) {
        const q = sh.zeilen[r - 1 + i];
        if (!q) continue;
        for (let j = 0; j < nc; j++) q[c - 1 + j] = '';
      }
      return bereich;
    },
    clearFormat: nix, setBackground: nix, setBackgrounds: nix, setFontColor: nix,
    setFontColors: nix, setFontWeight: nix, setFontWeights: nix, setFontSize: nix,
    setHorizontalAlignment: nix, setBorder: nix, setNumberFormat: nix
  };
  return bereich;
};

function umgebung() {
  const blaetter = {};
  const sandkasten = {
    SpreadsheetApp: {
      getActiveSpreadsheet: function () {
        return {
          getSheetByName: function (n) { return blaetter[n] || null; },
          insertSheet: function (n) { blaetter[n] = new Blatt(n); return blaetter[n]; }
        };
      },
      BorderStyle: { SOLID: 'solid', SOLID_THICK: 'dick' }
    },
    ContentService: { createTextOutput: function (t) { return { text: t }; } },
    LockService: { getScriptLock: function () { return { waitLock: function () {}, releaseLock: function () {} }; } },
    console: console
  };
  vm.createContext(sandkasten);
  vm.runInContext(fs.readFileSync(QUELLE, 'utf8'), sandkasten, { filename: 'MATERIAL-SHEETS.gs' });
  return { s: sandkasten, blaetter: blaetter, setzen: function (n, inhalt) { blaetter[n] = new Blatt(n, inhalt); } };
}

function kopfVon(bl) { return bl.zeilen[0].map(String); }
function zeileMit(bl, studio, aufgabe) {
  return bl.zeilen.slice(1).find(function (z) { return z[0] === studio && z[1] === aufgabe; });
}

const SENDUNG = {
  studio: 'Hürth', studioKey: 'studio-6', ts: 1770000000000,
  tasks: [
    { title: 'Spiegel putzen', wiederholung: 'täglich', status: 'erledigt',
      erledigtVon: 'Studio Hürth', kuerzel: 'AB', zeitpunkt: '11.08.2026, 09:12' },
    { title: 'Böden wischen', wiederholung: 'täglich', status: 'offen',
      erledigtVon: '', kuerzel: '', zeitpunkt: '' }
  ],
  notes: [{ text: 'Wischmopp ist durch', by: 'Studio Hürth', kuerzel: 'CD', zeit: '11.08.2026, 09:20' }]
};

// ══ 1. Frisches Blatt: die Spalte ist da und trägt das Kürzel ══
{
  const u = umgebung();
  u.s.handlePutzplan([SENDUNG]);

  const bl = u.blaetter['Putzplan'];
  const kopf = kopfVon(bl);
  console.log('Kopfzeile Putzplan:', JSON.stringify(kopf));
  if (kopf[5] !== 'Kürzel') {
    errs.push('FEHLT: „Kürzel" steht nicht an sechster Stelle (' + kopf[5] + ')');
  }
  const z = zeileMit(bl, 'Hürth', 'Spiegel putzen');
  console.log('Zeile:', JSON.stringify(z ? z.slice(0, 7) : null));
  if (!z) errs.push('FEHLT: die Zeile ist gar nicht angekommen');
  else {
    if (z[5] !== 'AB') errs.push('FEHLT: das Kürzel steht nicht in der Kürzel-Spalte (' + z[5] + ')');
    if (z[4] !== 'Studio Hürth') errs.push('FALSCH: der Kontoname ist verschwunden — das Kürzel soll ihn ergänzen');
    if (z[6] !== '11.08.2026, 09:12') errs.push('FALSCH: der Zeitpunkt sitzt nicht mehr in seiner Spalte (' + z[6] + ')');
  }
  /* Eine OFFENE Aufgabe darf kein Kürzel tragen. Sonst steht dort, wer
     zuletzt am Tablet war, und das liest sich wie „hat es gemacht". */
  const offen = zeileMit(bl, 'Hürth', 'Böden wischen');
  if (offen && offen[5]) errs.push('FALSCH: eine offene Aufgabe trägt ein Kürzel (' + offen[5] + ')');

  const bn = u.blaetter['Putzplan-Notizen'];
  console.log('Kopfzeile Notizen:', JSON.stringify(kopfVon(bn)));
  if (kopfVon(bn)[3] !== 'Kürzel') errs.push('FEHLT: die Notizen haben keine Kürzel-Spalte');
  if (bn.zeilen[1] && bn.zeilen[1][3] !== 'CD') {
    errs.push('FEHLT: das Kürzel der Notiz fehlt (' + (bn.zeilen[1] || [])[3] + ')');
  }
}

/* ══ 2. Der eigentliche Punkt: eine Tabelle, in der schon etwas steht ══
   Sieben Spalten, alte Kopfzeile, Zeilen von zwei Studios. Gesendet wird
   nur für Hürth. Brühl wird also NICHT ersetzt — und muss den Umbau
   trotzdem heil überstehen. */
{
  const u = umgebung();
  u.setzen('Putzplan', [
    ['Studio', 'Aufgabe', 'Wiederholung', 'Status', 'Erledigt von', 'Zeitpunkt', 'Aktualisiert'],
    ['Brühl', 'Fenster', 'wöchentlich', 'erledigt', 'Studio Brühl', '04.08.2026, 18:00', 'alt'],
    ['Hürth', 'Spiegel putzen', 'täglich', 'offen', '', '', 'alt']
  ]);

  u.s.handlePutzplan([SENDUNG]);
  const bl = u.blaetter['Putzplan'];
  console.log('Kopfzeile nach Umbau:', JSON.stringify(kopfVon(bl)));

  const brühl = zeileMit(bl, 'Brühl', 'Fenster');
  console.log('Brühl nach dem Umbau:', JSON.stringify(brühl));
  if (!brühl) errs.push('VERLOREN: die Zeile eines fremden Studios ist beim Umbau verschwunden');
  else {
    if (brühl[4] !== 'Studio Brühl') errs.push('VERSCHOBEN: „Erledigt von" bei Brühl stimmt nicht (' + brühl[4] + ')');
    /* Das ist der Fehler, um den es hier geht: ohne Zuordnung über den
       Namen stünde jetzt „04.08.2026, 18:00" unter „Kürzel". */
    if (brühl[5] !== '') {
      errs.push('DER FEHLER, UM DEN ES GEHT: bei einer alten Zeile steht etwas ' +
                'unter „Kürzel", das keins ist (' + brühl[5] + ')');
    }
    if (brühl[6] !== '04.08.2026, 18:00') {
      errs.push('VERSCHOBEN: der Zeitpunkt von Brühl ist nicht mehr in seiner Spalte (' + brühl[6] + ')');
    }
  }
  const huerth = zeileMit(bl, 'Hürth', 'Spiegel putzen');
  if (!huerth || huerth[5] !== 'AB') {
    errs.push('FEHLT: die neu gesendete Zeile trägt kein Kürzel (' + (huerth || [])[5] + ')');
  }
  if (huerth && huerth[3] !== 'erledigt') {
    errs.push('FALSCH: der neue Stand hat den alten nicht ersetzt (' + huerth[3] + ')');
  }
}

// ══ 3. Zweimal hintereinander ändert nichts mehr ══
//    Ein Umbau, der bei jedem Lauf wieder losgeht, würde die Tabelle bei
//    jeder Sendung neu durchschütteln.
{
  const u = umgebung();
  u.s.handlePutzplan([SENDUNG]);
  const nach1 = JSON.stringify(u.blaetter['Putzplan'].zeilen);
  u.s.handlePutzplan([SENDUNG]);
  const nach2 = JSON.stringify(u.blaetter['Putzplan'].zeilen);
  console.log('Zweiter Lauf verändert nichts:', nach1 === nach2);
  if (nach1 !== nach2) errs.push('UNRUHIG: derselbe Stand zweimal gesendet ergibt zwei verschiedene Tabellen');
}

// ══ 4. Das Material-Blatt bleibt unberührt ══
//    Es teilt sich blattHolen mit dem Putzplan. Wenn der Umbau dort
//    anspringt, wäre eine Änderung am Putzplan eine am Material.
{
  const u = umgebung();
  u.setzen('Material', [
    ['Studio', 'Material', 'Vorhanden', 'Fehlt', 'Aktualisiert', 'von'],
    ['Brühl', 'Handtücher', 12, 0, 'alt', 'Chef']
  ]);
  u.s.handleMaterial([{ studio: 'Hürth', ts: 1770000000000, updatedBy: 'Chef',
                        items: [{ name: 'Seife', have: 3, need: 1 }] }]);
  const bl = u.blaetter['Material'];
  console.log('Material-Kopfzeile:', JSON.stringify(kopfVon(bl)));
  const alt = zeileMit(bl, 'Brühl', 'Handtücher');
  if (!alt) errs.push('VERLOREN: das Material eines fremden Studios ist weg');
  else if (alt[2] !== 12) errs.push('VERSCHOBEN: die Materialzahlen sitzen falsch (' + alt[2] + ')');
}

console.log(errs.length
  ? '\n✗ ' + errs.join('\n✗ ')
  : '\n✓ Tabelle: Kürzel-Spalte da, alte Zeilen ziehen richtig mit um, zweiter Lauf ist ruhig');
process.exit(errs.length ? 1 : 0);
