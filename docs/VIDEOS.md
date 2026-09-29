# Schulungsvideos: der Speicherort

Stand 29.9.2026. Aus dem Betrieb:

> „Videos kommen noch speicher ort können wir vorbereiten so gut es geht"
> (24.9.2026)
>
> „ich hab jetzt die schulungsvideos in einem ordner, soll ich das auf
> github irgendwie posten oder direkt hier irgendwie" (29.9.2026)
>
> „formenchat-schulungsvideos isst eerstellt ich würde die daateien größe
> auf 4gb erhöhen weil ein video halt auch 4gb groß ist" (29.9.2026)

## Was fertig ist

| Teil | Stand |
|---|---|
| Der Eimer `formenchat-schulungsvideos` | **angelegt** am 29.9.2026 (Frankfurt) |
| Regeln `storage-videos.rules` | **fertig, geprüft, wird mit ausgerollt** (`firebase.json`, Ziel `videos`; `tests/rules/videos.test.js`, 15 Zusicherungen, im Emulator) |
| Knopf „Video hochladen“ im Editor | **fertig** (`tests/test-video-hochladen.js`, in der Demo) |
| Hochladen in den echten Eimer | **von hier aus nicht prüfbar**: das Firebase-SDK lädt im Test-Browser dieser Umgebung nicht. Der erste echte Versuch ist deiner. |

**Nicht auf GitHub, nicht in den Chat.** Das Repository ist öffentlich,
und GitHub nimmt keine Dateien über 100 MB an. Die Videos gehen direkt
vom Rechner in den Eimer.

## So lädst du ein Video hoch

Am Rechner, als Geschäftsführung oder Studioleitung:

1. **Ich → Schulung → Verwalten → Module**, beim Modul auf
   **„Bearbeiten“** (bei einem Modul aus dem Grundstock heißt das
   „Eigene Fassung anlegen“).
2. Beim Schritt **„Video“** (oder bei einem Lesetext, „Video dazu“) auf
   **„Video hochladen“** und die Datei wählen.
3. Warten, bis „Hochgeladen“ dasteht. Die App zeigt Prozent, Größe und
   ungefähre Restzeit. **Das Fenster muss offen bleiben.** Schließt man
   es, fragt der Browser nach.
4. Unten **„Speichern“**. Erst dann sieht das Team das Video statt „Video
   folgt“.

**Dauer (geschätzt, nicht gemessen):** 4 GB sind etwa 32 Gigabit. Bei
40 Mbit/s Upload sind das rund 14 Minuten, bei 10 Mbit/s knapp eine
Stunde. Den Upload des Studio-Internets kennt nur ihr.

## Was einmal eingerichtet werden muss

### Die Regeln des Eimers lesen das Profil aus der Datenbank

Die Regeln prüfen, ob jemand zur Firma gehört und welche Rolle er hat.
Dafür liest der Speicher in Firestore nach („Cross-Service-Regeln“).
Das braucht **einmal** eine Berechtigung für den Dienst-Vertreter des
Speichers. Beim Ausrollen aus GitHub heraus wird sie **nicht** vergeben:
`firebase-tools` überspringt diese Frage ohne Terminal
(`rulesDeploy.js`, `if (this.options.nonInteractive) return;`).

**Woran man es merkt:** Beim Hochladen steht „Der Speicher hat das Video
abgelehnt“, obwohl du Geschäftsführung bist und das Video unter 5 GB
liegt.

**Was dann hilft,** ein Befehl in der Cloud Shell
(<https://shell.cloud.google.com>, Projekt `formenchat`):

```bash
gcloud projects add-iam-policy-binding formenchat \
  --member="serviceAccount:service-$(gcloud projects describe formenchat --format='value(projectNumber)')@gcp-sa-firebasestorage.iam.gserviceaccount.com" \
  --role="roles/firebaserules.firestoreServiceAgent"
```

Das ist eine Rolle für einen Google-eigenen Dienst, kein Schlüssel und
kein Passwort. Den Befehl zweimal auszuführen schadet nicht.

## Was die Regeln erlauben

- **Lesen:** wer in dieser Firma angemeldet und freigegeben ist.
- **Verzeichnis auflisten:** niemand.
- **Hochladen:** nur Chef und Studioleitung, nur Videodateien, **höchstens
  5 GB** je Datei. Überschreiben geht nicht; ein neues Video ist eine
  neue Datei.
- **Löschen:** die Leitung.

**Warum 5 und nicht 4 GB:** Gewünscht war „4 GB, weil ein Video halt
auch 4 GB groß ist“. Der Mac zählt 1 GB = 1.000.000.000 Byte, Windows
zeigt 1.073.741.824 Byte als „GB“ an. Mit einer harten Grenze bei genau
4 wäre ein Video, das im Ordner „4,2 GB“ zeigt, knapp gescheitert. Die
Grenze steht an zwei Stellen (Regeln und `VIDEO_GRENZE` in `index.html`);
`test-video-hochladen` prüft, dass beide gleich sind.

**Was das nicht schützt:** Die Abspiel-Adresse eines Videos enthält
einen Schlüssel. Wer diese Adresse weitergibt, gibt das Video weiter.
Für Schulungsvideos ist das vertretbar, für etwas Vertrauliches wäre es
nicht der richtige Weg.

## Warum ein eigener Eimer

Im vorhandenen Speicher liegt unter `sicherung/` der nächtliche
Vollexport der Datenbank. Dort kommt **nichts anderes** hinein, und die
Regeln dort sind für jeden zu (`storage.rules`). Videos brauchen
dagegen Lesen für das ganze Team. Zwei so verschiedene Regeln in
einem Eimer sind genau die Stelle, an der irgendwann eine zu weite Zeile
die Sicherung mit öffnet. Deshalb: zweiter Eimer.

In `firebase.json` stehen seit dem 29.9.2026 **zwei Ziele**:
`sicherung` → `storage.rules`, `videos` → `storage-videos.rules`. Welcher
Eimer zu welchem Ziel gehört, steht in `.firebaserc`. Ziele statt
Eimernamen, weil der Speicher-Emulator der Regeltests nur Ziele kennt.

## Kosten (geschätzt, nicht gemessen)

Firebase berechnet Speicher und Abrufe. Die Preise stehen in der
Konsole unter „Nutzung und Abrechnung“. Bitte dort nachsehen; meine
Zahlen sind eine Größenordnung, keine Zusage.

- **Speicher:** 20 Videos à 4 GB sind 80 GB. Das ist ein niedriger
  einstelliger Euro-Betrag im Monat.
- **Abrufe:** Das ist der größere Posten. Schauen 40 Leute ein
  4-GB-Video ganz an, sind das 160 GB, und zwar **je Video**.
  Das kann schnell zweistellig werden.
- **Tipp, und der spart am meisten:** die Videos vor dem Hochladen
  kleiner exportieren. 1080p oder 720p reichen für eine Schulung, und
  aus 4 GB werden oft 300–800 MB. Das heißt ein Zehntel der Abrufkosten
  und ein Zehntel der Wartezeit beim Hochladen.

## Offen

- **Ein ersetztes Video bleibt im Eimer liegen.** „Anderes Video
  hochladen“ legt eine neue Datei an. Die alte löscht die App nicht,
  weil ein anderes Modul noch darauf zeigen könnte. Aufräumen geht in
  der Firebase-Konsole unter Storage → `formenchat-schulungsvideos`.
- **Wer ein Video wie weit angesehen hat,** misst die App wie bisher
  über den Durchlauf. Das hängt nicht am Speicherort.

## Die Alternative, und warum nicht

Ein YouTube-Video „nicht gelistet“ kostet nichts. Dann lässt sich aber
nicht messen, ob jemand es wirklich angesehen hat. Ein eingebettetes
fremdes Video liefert nur ein Häkchen, und ein Häkchen ist eine
Behauptung, keine Messung (entschieden am 22.9.2026). Eine
YouTube-Adresse in „Video dazu“ spielt der eigene Player auch **nicht**
ab, denn er braucht eine Videodatei, keine Webseite.
