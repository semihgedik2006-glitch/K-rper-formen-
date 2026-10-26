#!/usr/bin/env node
/* Kommentare beim Ausliefern entfernen (Runde 287).
 *
 *   node tools/ausliefern.js             zeigt, was es brächte (Zahlen)
 *   node tools/ausliefern.js --setzen    schreibt index.html OHNE Kommentare
 *
 * NUR IN DER AUSLIEFERUNG AUFRUFEN (Workflow „hosting"), nie im Repo
 * einchecken: das Repo behält jede Erklärung. Nach dem Setzen MUSS
 * `node tools/csp.js --setzen` laufen, denn die Prüfsumme der
 * Sicherheitsregel hängt am Skripttext — ohne sie bleibt die App weiss.
 *
 * Warum: index.html ist 3,15 MB gross, 943 KB gepackt — und 34 % davon
 * sind Erklärungen für Entwickler. Jede Person lädt sie bei jedem
 * Start mit (seit Runde 284 nur noch, wenn sich etwas geändert hat,
 * aber dann ganz). Ohne Kommentare sind es rund 540 KB gepackt.
 *
 * Wie: Drei Sorten, drei Wege, keiner mit einem regulären Ausdruck über
 * die ganze Datei (ein „//" in einer Adresse, ein „/*" in einer
 * Zeichenkette, ein „<!--" in einem Skript — jedes davon hätte den
 * Text zerrissen):
 *   - Skriptblöcke: acorn zerlegt den Code; nur was der Zerleger als
 *     Kommentar meldet, fällt weg. Zeichenketten, Vorlagen und reguläre
 *     Ausdrücke bleiben Zeichen für Zeichen.
 *   - Stilblöcke: ein kleiner Leser, der Zeichenketten und url(…)
 *     kennt und sonst Blockkommentare streicht.
 *   - HTML ausserhalb der Blöcke: <!-- … --> fällt weg.
 * Zeilenumbrüche bleiben erhalten, damit Fehlermeldungen im Browser
 * weiter auf dieselbe Zeile zeigen wie im Repo.
 *
 * Geprüft von tests/test-ausliefern-kommentare.js: das Ergebnis hat
 * dieselben Skriptblöcke (zerlegbar), dieselben Zeichenketten mit „//"
 * und „/*", und die App läuft damit (Gesamtdurchlauf gegen die
 * entkommentierte Datei, siehe docs/FORTSCHRITT.md Runde 287).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const WURZEL = path.join(__dirname, '..');

function acornLaden() {
  try { return require('acorn'); } catch (e) {}
  for (const p of [
    path.join(WURZEL, 'node_modules', 'acorn'),
    path.join(WURZEL, 'functions', 'node_modules', 'acorn'),
    path.join(WURZEL, 'tests', 'rules', 'node_modules', 'acorn'),
  ]) { try { return require(p); } catch (e) {} }
  throw new Error('acorn fehlt — `npm install --no-save acorn@8` im Projektordner (so macht es der Workflow).');
}

/* Zeilenumbrüche aus einem Stück Text behalten, alles andere weg. */
function nurUmbrueche(s) { return s.replace(/[^\n]/g, ''); }

/* Skript: acorn meldet jeden Kommentar mit Anfang und Ende. */
function skriptOhneKommentare(code, acorn) {
  const kommentare = [];
  acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', onComment: kommentare, allowHashBang: true });
  let aus = '', pos = 0;
  for (const k of kommentare) {
    aus += code.slice(pos, k.start) + nurUmbrueche(code.slice(k.start, k.end));
    pos = k.end;
  }
  return aus + code.slice(pos);
}

/* Stil: Blockkommentare weg, aber nicht in "…", '…' oder url(…). */
function stilOhneKommentare(css) {
  let aus = '', i = 0;
  while (i < css.length) {
    const c = css[i];
    if (c === '"' || c === "'") {
      const e = css.indexOf(c, i + 1);
      const bis = e < 0 ? css.length : e + 1;
      aus += css.slice(i, bis); i = bis; continue;
    }
    if (css.startsWith('url(', i)) {
      const e = css.indexOf(')', i + 4);
      const bis = e < 0 ? css.length : e + 1;
      aus += css.slice(i, bis); i = bis; continue;
    }
    if (css.startsWith('/*', i)) {
      const e = css.indexOf('*/', i + 2);
      const bis = e < 0 ? css.length : e + 2;
      aus += nurUmbrueche(css.slice(i, bis)); i = bis; continue;
    }
    aus += c; i++;
  }
  return aus;
}

/* Die Datei von links nach rechts, wie der Browser: ein Kommentar, ein
   Skript, ein Stil — jedes springt bis zu seinem Ende. */
function htmlOhneKommentare(html, acorn) {
  let aus = '', i = 0, skripte = 0, stile = 0;
  const unten = html.toLowerCase();
  while (i < html.length) {
    if (html.startsWith('<!--', i)) {
      const e = html.indexOf('-->', i + 4);
      const bis = e < 0 ? html.length : e + 3;
      aus += nurUmbrueche(html.slice(i, bis)); i = bis; continue;
    }
    const s = /^<script\b[^>]*>/i.exec(html.slice(i, i + 400));
    if (s) {
      const start = i + s[0].length;
      const e = unten.indexOf('</script>', start);
      const bis = e < 0 ? html.length : e;
      const code = html.slice(start, bis);
      aus += s[0];
      if (/\bsrc=/i.test(s[0]) || !code.trim()) aus += code;
      else { aus += skriptOhneKommentare(code, acorn); skripte++; }
      i = bis; continue;
    }
    const t = /^<style\b[^>]*>/i.exec(html.slice(i, i + 400));
    if (t) {
      const start = i + t[0].length;
      const e = unten.indexOf('</style>', start);
      const bis = e < 0 ? html.length : e;
      aus += t[0] + stilOhneKommentare(html.slice(start, bis)); stile++;
      i = bis; continue;
    }
    aus += html[i]; i++;
  }
  return { html: aus, skripte, stile };
}

/* Leere Zeilen, die durch das Streichen entstanden sind, dürfen NICHT
   weg — sonst stimmen die Zeilennummern nicht mehr. Nur Leerzeichen
   am Zeilenende (vom Kommentar übrig) gehen. */
function zeilenenden(s) { return s.replace(/[ \t]+$/gm, ''); }

function verarbeiten(datei, acorn) {
  const voll = path.join(WURZEL, datei);
  const vorher = fs.readFileSync(voll, 'utf8');
  const r = htmlOhneKommentare(vorher, acorn);
  const nachher = zeilenenden(r.html);
  if (nachher.split('\n').length !== vorher.split('\n').length) throw new Error(datei + ': Zeilenzahl hat sich geändert — das darf nicht sein.');
  return { datei, vorher, nachher, skripte: r.skripte, stile: r.stile };
}

function gzipGroesse(s) { return require('zlib').gzipSync(Buffer.from(s, 'utf8'), { level: 6 }).length; }

if (require.main === module) {
  const setzen = process.argv.includes('--setzen');
  const acorn = acornLaden();
  for (const datei of ['index.html', 'werbung.html']) {
    if (!fs.existsSync(path.join(WURZEL, datei))) continue;
    const r = verarbeiten(datei, acorn);
    const kb = n => Math.round(n / 1024) + ' KB';
    console.log(datei + ': ' + r.skripte + ' Skriptblöcke, ' + r.stile + ' Stilblöcke — ' +
      kb(Buffer.byteLength(r.vorher)) + ' → ' + kb(Buffer.byteLength(r.nachher)) +
      ' (gzip ' + kb(gzipGroesse(r.vorher)) + ' → ' + kb(gzipGroesse(r.nachher)) + ')');
    if (setzen) { fs.writeFileSync(path.join(WURZEL, datei), r.nachher); console.log('   geschrieben. Jetzt: node tools/csp.js --setzen'); }
  }
}

module.exports = { htmlOhneKommentare, skriptOhneKommentare, stilOhneKommentare, zeilenenden, verarbeiten, acornLaden };
