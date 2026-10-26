/* Kopiert die ausgelieferte Web-App nach www/, damit Capacitor sie in die
   iOS-App packen kann. Die Liste entspricht dem, was Firebase Hosting
   ausliefert (siehe firebase.json → hosting.ignore) – nur ohne die
   stillgelegten Seiten. Die App bleibt EINE Codebasis: geändert wird
   immer im Wurzelverzeichnis, hier wird nur kopiert. */
const fs = require('fs');
const path = require('path');
const quelle = path.join(__dirname, '..');
const ziel = path.join(__dirname, 'www');
const dateien = ['index.html', 'konfig.js', 'demo-daten.js', 'loesungen-basis.js',
  'schulungen-basis.js', 'ems-wissen.js', 'schichtplaner.js', 'qrcode.js',
  'icon.png', 'icon.svg', 'formi-push.svg', 'manifest.json', 'sw.js'];
const ordner = ['schriften', 'vorlagen'];
fs.rmSync(ziel, { recursive: true, force: true });
fs.mkdirSync(ziel, { recursive: true });
for (const d of dateien) fs.copyFileSync(path.join(quelle, d), path.join(ziel, d));
for (const o of ordner) fs.cpSync(path.join(quelle, o), path.join(ziel, o), { recursive: true });
console.log('www/ gefüllt:', dateien.length, 'Dateien,', ordner.length, 'Ordner');
