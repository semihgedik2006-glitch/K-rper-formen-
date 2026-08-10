# Echte Daten ins Probe-Projekt holen

Zweiter Teil der Vorbereitung für Stufe C. Das Projekt `formenchat-probe`
steht — jetzt kommt eine Kopie eures Bestands hinein, damit der Umzug an
echten Daten geprobt wird und nicht an erfundenen.

**Warum echte Daten:** euer Bestand hat Eigenheiten aus Monaten Betrieb,
die ich nicht erfinden kann — Studios ohne Elterndokument, alte
Datensätze aus früheren Fassungen, Nachrichten mit Anhängen. Genau die
sollen gefunden werden. Ein selbstgebauter Testbestand prüft nur, ob mein
Programm zu meiner Vorstellung passt.

**Zeitbedarf:** 15 bis 25 Minuten, das meiste Wartezeit.
**Kosten:** ein paar Cent für den Import.
**Risiko für `formenchat`:** keins. Es wird nur **gelesen**.

---

## Schritt 0 — was ihr schon habt

Ihr braucht **keinen neuen Export.** Die nächtliche Sicherung schreibt
seit dem 9. August jede Nacht einen vollständigen Firestore-Export nach:

```
gs://formenchat.firebasestorage.app/sicherung/JJJJ-MM-TT
```

Genau dieses Format liest der Import. Ihr importiert also die Sicherung
von letzter Nacht.

**Nachsehen, welche da sind:**
[console.cloud.google.com/storage/browser](https://console.cloud.google.com/storage/browser)
→ Projekt `formenchat` → Bucket `formenchat.firebasestorage.app` →
Ordner `sicherung/`

Merk dir den Ordnernamen der neuesten, z. B. `2026-08-11`.

> Wenn dort nichts liegt: in der App unter *Verwaltung → System →
> Zusätzlich sichern* einmal von Hand auslösen. Das legt
> `sicherung/manuell-<Zeitstempel>` an, das geht genauso.

---

## Schritt 1 — das Probe-Projekt darf den Ordner lesen

Das ist die Stelle, an der es klemmt, wenn man sie überspringt. Der
Import läuft **im Probe-Projekt**, die Datei liegt aber im Bucket von
`formenchat`. Ohne Leserecht bricht er mit `PERMISSION_DENIED` ab —
dieselbe Meldung wie damals bei der Sicherung.

1. [console.cloud.google.com/storage/browser](https://console.cloud.google.com/storage/browser)
   → Projekt **`formenchat`**
2. Bei `formenchat.firebasestorage.app` rechts auf die **drei Punkte** →
   **Zugriff bearbeiten** *(oder: Bucket öffnen → Reiter **BERECHTIGUNGEN**)*
3. **Zugriff erteilen**
4. Bei **Neue Hauptkonten** genau das hier einfügen:

   ```
   service-692000066621@gcp-sa-firestore.iam.gserviceaccount.com
   ```

   > Das ist der Dienst-Vertreter, mit dem Firestore in **deinem
   > Probe-Projekt** arbeitet. Die Nummer 692000066621 ist die
   > Projektnummer von `formenchat-probe` — sie stand in der
   > `firebaseConfig`, die du mir geschickt hast, als
   > `messagingSenderId`.

5. Zwei Rollen vergeben:
   - **Storage-Objekt-Betrachter** (`Storage Object Viewer`)
   - **Storage Legacy Bucket Reader**

   Die zweite wird gern vergessen. Ohne sie kann der Import die einzelnen
   Dateien lesen, aber den Ordner nicht auflisten — und bricht mit einer
   Meldung ab, die nach etwas anderem klingt.

6. **Speichern**

> **Bekommt das Probe-Projekt damit Zugriff auf eure Daten?** Ja — Lesezugriff
> auf diesen einen Bucket. Das ist der Zweck. Rückgängig machen kannst du
> es hinterher an derselben Stelle, und ich würde es auch empfehlen, sobald
> der Probelauf durch ist.

---

## Schritt 2 — importieren

1. [console.cloud.google.com/firestore/import-export](https://console.cloud.google.com/firestore/import-export)
2. Oben Projekt auf **`formenchat-probe`** umstellen — **bitte zweimal
   hinsehen.** Ein Import in das falsche Projekt würde eure echten Daten
   überschreiben. Es ist die einzige Stelle in dieser Anleitung, an der
   etwas kaputtgehen kann.
3. **Importieren**
4. Bei **Dateiname** den Pfad zur Metadatendatei eintragen:

   ```
   formenchat.firebasestorage.app/sicherung/2026-08-11/2026-08-11.overall_export_metadata
   ```

   *(Datum anpassen. Über **Durchsuchen** kannst du die Datei auch
   auswählen — dann stimmt der Name sicher.)*

5. **Importieren** → je nach Menge 5 bis 20 Minuten

Der Fortschritt steht auf derselben Seite unter **Aktuelle Vorgänge**.

---

## Schritt 3 — nachsehen, ob es angekommen ist

[console.firebase.google.com](https://console.firebase.google.com) →
`formenchat-probe` → **Firestore Database**

Dort sollten jetzt die bekannten Sammlungen stehen: `users`, `channels`,
`studios`, `documents`, `announcements` und die anderen. Wirf einen Blick
in `studios` — dort müssten `studio-0` bis `studio-13` liegen, viele
davon **grau dargestellt**. Grau heißt: das Dokument selbst existiert
nicht, nur seine Untersammlungen.

**Genau die sind der Grund für den Probelauf.** Sie sind die Stelle, an
der ein Umzug lautlos die Hälfte verliert, und der Test dafür ist schon
grün — aber an erfundenen Daten.

---

## Schritt 4 — mir Bescheid geben

Schick mir:

| | |
|---|---|
| 1 | „Import durch" |
| 2 | die Zahl, die in Firestore unter **Nutzung** als Dokumentenanzahl steht (grobe Angabe genügt) |

Dann lasse ich den Umzug im Probe-Projekt laufen — erst mit `--probe`,
das schreibt nichts und zählt nur, danach richtig, mit Zählprüfung
hinterher.

---

## Wenn etwas klemmt

| Meldung | was dahintersteckt |
|---|---|
| `PERMISSION_DENIED` beim Import | Schritt 1 fehlt oder eine der beiden Rollen |
| „Bucket does not exist" | Bucketname vertippt — er heißt `formenchat.firebasestorage.app`, ohne `gs://` |
| „not a valid export" | die `.overall_export_metadata` fehlt im Pfad; eine einzelne Sammlungsdatei genügt nicht |
| Import läuft ewig | normal bei mehreren tausend Dokumenten; die Seite zeigt den Fortschritt |

Melde dich auch **mittendrin**, wenn du unsicher bist. Der einzige Schritt
mit echtem Schadenspotential ist Nummer 2 — dort wird in ein Projekt
geschrieben, und es muss `formenchat-probe` sein.

---

## Danach

1. Umzug im Probe-Projekt, erst `--probe`, dann richtig
2. Zählprüfung: jede Sammlung vorher und nachher gleich viele Dokumente
3. Die 40 UI-Durchläufe gegen die umgezogenen Daten
4. Eine zweite Testfirma anlegen und die Kreuztests dort scharf laufen
   lassen — bisher laufen sie gegen erfundene Firmen
5. Erst dann der Live-Umzug bei euch. Und auch der ist eine **Kopie**:
   die alten Daten bleiben 30 Tage liegen, der Rückweg ist die
   vorherige App-Fassung.
