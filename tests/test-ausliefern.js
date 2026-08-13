/* ── Wird alles ausgeliefert, was ausgeliefert werden soll? ────────────
   Zwei Listen, die auseinanderlaufen können:

     firebase.json   → was Firebase Hosting ausliefert
     der Workflow    → was einen Deploy auslöst

   Jede Datei in der ersten muss in der zweiten vorkommen. Fehlt eine,
   kann man sie ändern und mergen, und es geschieht nichts: kein Deploy,
   keine Fehlermeldung. Genau so war konfig.js zwei Monate lang nicht
   ausrollbar — ausgerechnet die Datei, die entscheidet, welche Datenbank
   die App anfasst.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');

const WURZEL = path.join(__dirname, '..');
const ABLAUF = path.join(WURZEL, '.github', 'workflows', 'deploy-functions.yml');

const errs = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) console.log('  ✓ ' + name);
  else { console.log('  ✗ ' + name + (zusatz ? '  — ' + zusatz : '')); errs.push(name); }
}

/* ── Was liefert Firebase Hosting aus? ──
   public: '.' heisst: alles im Projektordner, ausser was in "ignore"
   steht. Hier interessieren nur die Dateien direkt in der Wurzel —
   Unterordner (Bilder o. ä.) prüft der Ablauf ohnehin nicht einzeln. */
const fbjson = JSON.parse(fs.readFileSync(path.join(WURZEL, 'firebase.json'), 'utf8'));
const host = fbjson.hosting || {};
const ignore = host.ignore || [];

function ignoriert(datei) {
  return ignore.some(muster => {
    if (muster === datei) return true;
    // Nur die Muster, die auf Wurzeldateien passen können: '*.md', '**/.*'
    const m = muster.replace(/^\*\*\//, '');
    if (m.startsWith('*.')) return datei.endsWith(m.slice(1));
    if (m === '.*') return datei.startsWith('.');
    return false;
  });
}

const wurzelDateien = fs.readdirSync(WURZEL)
  .filter(f => fs.statSync(path.join(WURZEL, f)).isFile())
  .filter(f => !ignoriert(f))
  .sort();

/* ── Was löst einen Deploy aus? ──
   Kein YAML-Leser, sondern die Zeilen unter "paths:" bis zum nächsten
   Schlüssel. Reicht für diese eine Datei und spart eine Abhängigkeit. */
const zeilen = fs.readFileSync(ABLAUF, 'utf8').split('\n');
const muster = [];
let drin = false;
for (const z of zeilen) {
  if (/^\s*paths:\s*$/.test(z)) { drin = true; continue; }
  if (!drin) continue;
  const m = z.match(/^\s*-\s*'([^']+)'\s*$/);
  if (m) { muster.push(m[1]); continue; }
  if (/^\s*#/.test(z) || /^\s*$/.test(z)) continue;   // Kommentar, Leerzeile
  break;                                              // nächster Schlüssel
}

function ausgeloest(datei) {
  return muster.some(p => {
    if (p === datei) return true;
    if (p.startsWith('*.')) return datei.endsWith(p.slice(1)) && !datei.includes('/');
    if (p.endsWith('/**')) return datei.startsWith(p.slice(0, -2));
    return false;
  });
}

console.log('── Was Firebase Hosting ausliefert ──');
console.log('  ' + wurzelDateien.join(', ') + '\n');

console.log('── Was einen Deploy auslöst ──');
console.log('  ' + muster.join(', ') + '\n');

pruefe('die Auslöser-Liste wurde überhaupt gefunden', muster.length >= 5,
  muster.length + ' Einträge — steht "paths:" noch im Ablauf?');
pruefe('es gibt ausgelieferte Dateien zu prüfen', wurzelDateien.length >= 3,
  wurzelDateien.length + ' gefunden');

console.log('── Jede ausgelieferte Datei löst auch einen Deploy aus ──');
for (const d of wurzelDateien) {
  pruefe(d, ausgeloest(d),
    'wird ausgeliefert, steht aber in keinem Muster — Änderungen daran ' +
    'landen in main und nie im Betrieb');
}

/* ── Gegenprobe ──
   Ein Prüfer, der nie anschlägt, prüft nichts. */
console.log('\n── Gegenprobe ──');
pruefe('eine erfundene Datei würde auffallen', !ausgeloest('gibtesnicht.xyz'),
  'das Muster passt auf ALLES — dann prüft dieser Durchlauf nichts');

console.log(errs.length
  ? '\n✗ ' + errs.length + ' Fehler — es gibt Dateien, die man nicht ausrollen kann'
  : '\n✓ Ausliefern: jede gehostete Datei löst auch einen Deploy aus');
process.exit(errs.length ? 1 : 0);
