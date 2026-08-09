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

## Was hier drinsteht

Jeder Test sagt im Namen, was er schützt. Drei Tests beginnen mit
`BEKANNT:` – die halten bewusst getragene Schwächen fest, damit eine
Änderung daran auffällt. Und zwar in **beide** Richtungen: wird eine davon
behoben, fällt der Test ebenfalls um und muss angepasst werden.
