# Sicherheitstests der Firestore-Regeln

Die Regeln sind die **einzige echte Grenze** dieser App. Was in der
Oberfläche versteckt ist, kann jeder mit der Entwicklerkonsole aufrufen.

Diese Tests laufen gegen den Firestore-Emulator und prüfen die Regeln
**ausgeführt**, nicht gelesen.

```bash
cd tests/rules
npm install     # einmalig
npm test
```

Braucht Java (der Emulator ist ein Java-Programm) und lädt beim ersten Lauf
die Emulator-Datei herunter.

Läuft außerdem bei jedem Push in GitHub Actions – **bevor** die Regeln
ausgerollt werden. Fällt ein Test um, wird nichts deployt.

## Die Dateien

| Datei | prüft |
|---|---|
| `security.test.js` | wer was lesen und schreiben darf — und vor allem, wer nichts darf |
| `kreuz.test.js` | dieselbe Frage über alle 32 Sammlungen hinweg, in beide Richtungen |
| `rechte.test.js` | Rechteausweitung (`admin`, `role`, `aktiv`, `firma`) und Aufzählbarkeit von Firmen und Konten |
| `umzug.test.js` | das Umzugswerkzeug an nachgebauten Daten |
| `funktionen.test.js` | die Cloud Functions, wirklich ausgeführt |

## Was hier drinsteht

Jeder Test sagt im Namen, was er schützt. Drei Tests beginnen mit
`BEKANNT:` – die halten bewusst getragene Schwächen fest, damit eine
Änderung daran auffällt. Und zwar in **beide** Richtungen: wird eine davon
behoben, fällt der Test ebenfalls um und muss angepasst werden.
