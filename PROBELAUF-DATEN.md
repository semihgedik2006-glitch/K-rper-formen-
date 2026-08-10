# Echte Daten ins Probe-Projekt holen

Zweiter Teil der Vorbereitung für Stufe C. Eine Kopie eures Bestands
kommt nach `formenchat-probe`, damit der Umzug an echten Daten geprobt
wird und nicht an erfundenen.

**Warum echte Daten:** euer Bestand hat Eigenheiten aus Monaten Betrieb,
die ich nicht erfinden kann — Studios ohne Elterndokument, alte
Datensätze aus früheren Fassungen. Genau die sollen gefunden werden.

**Zeitbedarf:** 10 bis 20 Minuten, das meiste Wartezeit.
**Risiko für `formenchat`:** keins. Es wird nur **gelesen**.

---

## Der Weg: Cloud Shell

Ich hatte dir vorher tiefe Links in die Cloud-Konsole gegeben. Die ändern
sich ständig und funktionieren oft nicht — mein Fehler.

Stattdessen **Cloud Shell**: ein Terminal, das im Browser läuft und schon
bei deinem Google-Konto angemeldet ist. Nichts installieren, nichts
suchen. Du kopierst vier Befehle hinein, fertig.

### Cloud Shell öffnen

1. **[console.cloud.google.com](https://console.cloud.google.com)** öffnen
2. Oben rechts in der blauen Leiste auf das Symbol **`>_`**
   *(Kurztipp: heißt beim Draufzeigen „Cloud Shell aktivieren")*
3. Unten öffnet sich ein schwarzes Fenster. Beim ersten Mal fragt es
   „Cloud Shell autorisieren" → **Autorisieren**

Das war's. Alles Weitere ist Kopieren und Einfügen.

> **Einfügen** geht mit `Strg + V`, auf dem Mac `Cmd + V`. Nach jedem
> Block **Enter** drücken und warten, bis wieder ein Eingabezeichen
> erscheint.

---

## Schritt 0 — gibt es die Datenbank überhaupt?

**Das muss zuerst stimmen, sonst scheitert alles Weitere** — und zwar mit
Meldungen, die nach etwas anderem klingen.

```bash
gcloud firestore databases list --project=formenchat-probe
```

Kommt eine Zeile mit `(default)` und `europe-west1`: weiter mit Schritt 1.

Kommt `NOT_FOUND` oder eine leere Liste, fehlt die Datenbank. Anlegen:

```bash
gcloud firestore databases create \
  --location=europe-west1 \
  --type=firestore-native \
  --project=formenchat-probe
```

> ⚠ **`europe-west1` lässt sich nie wieder ändern** und muss dasselbe
> sein wie bei `formenchat`. Sonst prüft der Probelauf eine andere Welt.

### Warum das zuerst kommen muss

Der Dienst-Vertreter, dem in Schritt 2 die Leserechte gegeben werden,
`service-…@gcp-sa-firestore.iam.gserviceaccount.com`, **entsteht erst,
wenn Firestore im Projekt zum ersten Mal benutzt wird.** Ohne Datenbank
gibt es ihn nicht, und Schritt 2 antwortet mit
`Service account … does not exist` — was klingt, als stimme die Adresse
nicht, obwohl sie richtig ist.

---

## Schritt 1 — welche Sicherungen gibt es?

```bash
gcloud storage ls gs://formenchat.firebasestorage.app/sicherung/
```

Es kommt eine Liste wie:

```
gs://formenchat.firebasestorage.app/sicherung/2026-08-10/
gs://formenchat.firebasestorage.app/sicherung/2026-08-10/
```

**Merk dir die neueste** (unten). Falls die Liste leer ist: in der App
unter *Verwaltung → System → Zusätzlich sichern* einmal auslösen und
diesen Schritt wiederholen.

---

## Schritt 2 — das Probe-Projekt darf lesen

Der Import läuft **in `formenchat-probe`**, die Datei liegt aber im
Bucket von **`formenchat`**. Ohne Leserecht bricht er ab.

Beide Zeilen zusammen kopieren und einfügen:

```bash
gcloud storage buckets add-iam-policy-binding gs://formenchat.firebasestorage.app \
  --member=serviceAccount:service-692000066621@gcp-sa-firestore.iam.gserviceaccount.com \
  --role=roles/storage.objectViewer --project=formenchat

gcloud storage buckets add-iam-policy-binding gs://formenchat.firebasestorage.app \
  --member=serviceAccount:service-692000066621@gcp-sa-firestore.iam.gserviceaccount.com \
  --role=roles/storage.legacyBucketReader --project=formenchat
```

**Beide braucht es wirklich.** Die erste erlaubt, einzelne Dateien zu
lesen. Die zweite, den Ordner aufzulisten. Fehlt die zweite, bricht der
Import mit einer Meldung ab, die nach etwas ganz anderem klingt.

> Die Nummer `692000066621` ist die Projektnummer von `formenchat-probe`.
> Sie stand in der `firebaseConfig`, die du mir geschickt hast, als
> `messagingSenderId` — du musst sie nirgends nachschlagen.

Erfolg sieht so aus: eine Ausgabe, die mit `bindings:` anfängt und
mehrere Zeilen lang ist. Eine Warnung über „etag" ist normal.

---

## Schritt 3 — importieren

**Das Datum anpassen** auf die neueste Sicherung aus Schritt 1:

```bash
gcloud firestore import gs://formenchat.firebasestorage.app/sicherung/2026-08-10 \
  --project=formenchat-probe
```

> ⚠ **Der einzige Schritt, bei dem etwas kaputtgehen kann.** Hinter
> `--project=` muss **`formenchat-probe`** stehen. Stünde dort
> `formenchat`, würde eure echte Datenbank überschrieben. Lies die Zeile
> einmal, bevor du Enter drückst.

Die Antwort ist so etwas wie:

```
Waiting for [projects/formenchat-probe/.../operations/...] to finish...
```

Je nach Menge 5 bis 20 Minuten. Das Fenster kann offen bleiben.

**Wenn du nicht warten willst:** `Strg + C` bricht nur das *Warten* ab,
nicht den Import. Nachsehen mit:

```bash
gcloud firestore operations list --project=formenchat-probe --limit=1
```

Steht dort `done: true`, ist er durch.

---

## Schritt 4 — nachsehen

[console.firebase.google.com](https://console.firebase.google.com) →
`formenchat-probe` → **Firestore Database**

Dort sollten die bekannten Sammlungen stehen: `users`, `channels`,
`studios`, `documents`, `announcements`.

Wirf einen Blick in **`studios`**. Dort müssten `studio-0` bis
`studio-13` liegen, **viele davon grau**. Grau heißt: das Dokument
selbst existiert nicht, nur seine Untersammlungen.

**Genau die sind der Grund für den Probelauf.** Dort verliert ein Umzug
lautlos die Hälfte, wenn er falsch gebaut ist. Mein Test dafür ist grün —
aber an erfundenen Daten.

---

## Schritt 5 — mir Bescheid geben

| | |
|---|---|
| 1 | „Import durch" |
| 2 | die Ausgabe von Schritt 1 (welche Sicherung du genommen hast) |

Dann lasse ich den Umzug laufen: erst mit `--probe`, das schreibt nichts
und zählt nur, danach richtig mit Zählprüfung.

---

## Wenn etwas klemmt

| Meldung | was dahintersteckt |
|---|---|
| `PERMISSION_DENIED` | Schritt 2 fehlt oder nur eine der beiden Rollen |
| `NOT_FOUND` beim Bucket | Tippfehler — er heißt `formenchat.firebasestorage.app` |
| `does not contain a valid export` | falscher Ordner. Der Pfad endet auf das **Datum**, nicht auf eine Datei darin |
| `The caller does not have permission` bei Schritt 2 | dein Google-Konto ist bei `formenchat` nicht Inhaber. In der Cloud-Konsole unter *IAM* nachsehen |
| `Service account service-…@gcp-sa-firestore… does not exist` | **Schritt 0 fehlt.** Die Datenbank ist noch nicht angelegt, deshalb gibt es den Dienst-Vertreter nicht. Nicht die Adresse ist falsch. |
| `Project … or database '(default)' does not exist` | dasselbe: Schritt 0 fehlt. Das Projekt gibt es, die Datenbank nicht. |
| Nach Schritt 0 kommt trotzdem noch „does not exist" | eine Minute warten und erneut. Google legt den Vertreter kurz nach der Datenbank an. |
| Cloud Shell sagt „Projekt nicht gesetzt" | egal — bei jedem Befehl steht `--project` dabei |

Melde dich auch **mittendrin**. Lieber eine Zwischenfrage als ein Import
ins falsche Projekt.

---

## Wenn du lieber klickst

Es geht auch ohne Terminal, aber mit mehr Suchen:

1. Cloud-Konsole → oben links Projekt auf **`formenchat-probe`** stellen
2. Im Suchfeld ganz oben **„Firestore"** eingeben → **Firestore** öffnen
3. Links im Menü **Import/Export**
4. **Importieren** → **Durchsuchen** → Bucket
   `formenchat.firebasestorage.app` → Ordner `sicherung` → das Datum →
   die Datei, die auf `.overall_export_metadata` endet
5. **Importieren**

Schritt 2 von oben (die Leserechte) brauchst du trotzdem — den kannst du
über *Cloud Storage → Buckets → `formenchat.firebasestorage.app` →
Berechtigungen → Zugriff erteilen* geben, mit derselben Adresse und
denselben zwei Rollen.

---

## Danach

1. Umzug im Probe-Projekt, erst `--probe`, dann richtig
2. Zählprüfung: jede Sammlung vorher und nachher gleich viele Dokumente
3. Die 40 UI-Durchläufe gegen die umgezogenen Daten
4. Eine zweite Testfirma anlegen, Kreuztests dort scharf laufen lassen
5. Erst dann der Live-Umzug — und auch der ist eine **Kopie**: die alten
   Daten bleiben 30 Tage liegen, der Rückweg ist die vorherige
   App-Fassung
