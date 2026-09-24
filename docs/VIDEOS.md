# Schulungsvideos: der Speicherort

Stand 24.9.2026. Aus dem Betrieb:

> „Videos kommen noch speicher ort können wir vorbereiten so gut es geht"

## Was schon fertig ist

| Teil | Stand |
|---|---|
| Schritt „Video“ und „Lesetext“ mit Feld `quelle` | **fertig**; solange es leer ist, steht „Video folgt“ bzw. „später als Video“ |
| Regeln für einen eigenen Video-Eimer (`storage-videos.rules`) | **fertig und geprüft** (`tests/rules/videos.test.js`, 15 Zusicherungen, im Emulator) |
| Der Eimer selbst | **fehlt**, ihn kann nur jemand mit Zugang zur Firebase-Konsole anlegen |
| Hochladen aus dem Editor | **nicht gebaut**, das kommt, sobald es den Eimer gibt (siehe unten) |

Bis dahin geht schon: im Editor einer Schulung bei „Video dazu“ die
**Adresse einer Videodatei** eintragen (eine `.mp4`, die irgendwo
abrufbar liegt). Die App spielt sie mit ihrem eigenen Player ab.

## Warum ein eigener Eimer

Im vorhandenen Speicher liegt unter `sicherung/` der nächtliche
Vollexport der Datenbank. Dort kommt **nichts anderes** hinein, und die
Regeln dort sind für jeden zu (`storage.rules`). Videos brauchen
dagegen Lesen für das ganze Team. Zwei so verschiedene Regeln in
einem Eimer sind genau die Stelle, an der irgendwann eine zu weite Zeile
die Sicherung mit öffnet. Deshalb: zweiter Eimer.

## Was die Regeln erlauben

- **Lesen:** wer in dieser Firma angemeldet und freigegeben ist.
- **Verzeichnis auflisten:** niemand.
- **Hochladen:** nur Chef und Studioleitung, nur Videodateien, höchstens
  500 MB je Datei. Überschreiben geht nicht; ein neues Video ist eine
  neue Datei.
- **Löschen:** die Leitung.

**Was das nicht schützt:** Die Abspiel-Adresse eines Videos enthält
einen Schlüssel. Wer diese Adresse weitergibt, gibt das Video weiter.
Für Schulungsvideos ist das vertretbar, für etwas Vertrauliches wäre es
nicht der richtige Weg.

## Was du tun musst (einmal, etwa 5 Minuten)

1. <https://console.firebase.google.com> → Projekt **formenchat** →
   **Storage**.
2. Oben rechts beim Eimer-Namen: **„Bucket hinzufügen“**.
   - Name zum Beispiel: `formenchat-schulungsvideos`
   - Standort: **europe-west3 (Frankfurt)**. Die Daten bleiben damit
     in Deutschland.
   - Speicherklasse: Standard
3. Mir den **Namen des Eimers** sagen. Den Namen, **kein** Schlüssel
   und kein Passwort: das Repository ist öffentlich, und für diesen
   Schritt braucht es keins.

Danach baue ich:
- den Eintrag in `firebase.json`, damit `storage-videos.rules` mit
  ausgerollt wird;
- `videoEimer` in `konfig.js`;
- im Editor den Knopf **„Video hochladen“** mit Fortschrittsanzeige.
  Die Datei landet unter
  `firmen/<firma>/schulungen/<modul>/…` und ihre Adresse steht
  danach automatisch in `quelle`.

## Kosten (geschätzt, nicht gemessen)

Firebase berechnet Speicher und Abrufe. Die Preise stehen in der
Konsole unter „Nutzung und Abrechnung“. Bitte dort nachsehen; meine
Zahlen sind eine Größenordnung, keine Zusage.

- **Speicher:** 20 Videos à 100 MB sind 2 GB. Das sind Cent-Beträge im
  Monat.
- **Abrufe:** Schauen 40 Leute jedes Video einmal, sind das rund 80 GB.
  Das ist der größere Posten, geschätzt im einstelligen bis niedrigen
  zweistelligen Euro-Bereich im Monat, **nur in diesem Monat**. Danach
  schaut nur noch, wer neu ist.
- **Tipp:** Die Videos vorher klein rechnen, 720p reicht für eine
  Schulung. Das spart am meisten.

## Die Alternative, und warum nicht

Ein YouTube-Video „nicht gelistet“ kostet nichts. Dann lässt sich aber
nicht messen, ob jemand es wirklich angesehen hat. Ein eingebettetes
fremdes Video liefert nur ein Häkchen, und ein Häkchen ist eine
Behauptung, keine Messung (entschieden am 22.9.2026). Eine
YouTube-Adresse in „Video dazu“ spielt der eigene Player auch **nicht**
ab, denn er braucht eine Videodatei, keine Webseite.
