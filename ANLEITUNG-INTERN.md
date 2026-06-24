# StudioChat – Körperformen Team-Portal

## Zugänge / Login (neu)
- **Mitarbeiter können sich nicht mehr selbst registrieren.** Der **Chef legt die
  Konten an** (Chef-Bereich → „Mitarbeiter anlegen": Name, E-Mail, Passwort, Studios)
  und gibt dem Mitarbeiter die Zugangsdaten. Studios lassen sich später jederzeit
  über „Mitarbeiter" ändern, Zugänge auch entfernen.
- **Chef-Konto anlegen:** einmalig über `…/intern.html#chef` mit dem Chef-Code.
- Wegen dieser Änderung müssen die **`firestore.rules` neu veröffentlicht** werden
  (sie erlauben dem Chef jetzt, Mitarbeiter-Profile zu verwalten).

## Phase 2: Dokumente & Google Sheets

### A) Dokumente-Ordner (Datei-Upload)
Neuer Tab **Dokumente**. Der **Chef** lädt Dateien (PDF, Word, Bilder …) hoch,
wählt die Studios und kann ein Dokument auch **„Als Aufgabe"** an Studios schicken
(erscheint dann als To-do mit Link). Mitarbeiter sehen/öffnen die Dokumente ihrer Studios.

**Einrichtung in Firebase (Console → Projekt formenchat):**
1. **Storage** → „Jetzt starten" → Region `europe-west` → aktivieren.
2. **Storage → Regeln** → Inhalt von **`storage.rules`** einfügen → Veröffentlichen.
3. **Firestore → Regeln** → die aktualisierte **`firestore.rules`** veröffentlichen
   (enthält jetzt die `documents`-Sammlung).

> Hinweis: Storage gehört zum Blaze-Plan (hast du schon). Datei-Limit aktuell 20 MB.

### B) Material live in Google Sheets
1. Neue Google-Tabelle öffnen → **Erweiterungen → Apps Script**.
2. Inhalt von **`MATERIAL-SHEETS.gs`** einfügen, speichern.
3. **Bereitstellen → Neue Bereitstellung → Web-App** (Ausführen als „Ich",
   Zugriff „Jeder") → **Web-App-URL kopieren**.
4. In `intern.html` oben einsetzen: `var SHEETS_WEBHOOK_URL = "DEINE_URL";`

Danach landet **jede Material-Änderung automatisch** im Blatt „Material"
(Spalten: Studio, Material, Vorhanden, Fehlt, Aktualisiert, von).
Der Excel-Download bleibt zusätzlich erhalten.

> Schick mir die Web-App-URL, dann trage ich sie für dich ein.

## Neu in dieser Version
- **Wiederkehrende Aufgaben:** Chef kann eine Aufgabe als *täglich* oder *wöchentlich*
  markieren – sie steht nach Tag/Woche automatisch wieder offen da (kein Server nötig).
- **Aufgaben gezielt mehreren Studios** zuweisen (Checkboxen + „Alle").
- **Material-Seite pro Studio:** jeder trägt vorhandene/fehlende Materialien ein
  (live synchron). Chef hat einen **Excel-Export** über alle Studios.
- **Auffällige Marker:** neue Nachricht/Info zeigt einen pulsierenden Punkt in der Navigation.
- **Chef-Entwürfe** für Ankündigung/Aufgabe werden automatisch zwischengespeichert.

> ⚠️ **Wichtig:** Wegen der neuen Material-Funktion musst du die **`firestore.rules`
> neu veröffentlichen** (Firebase → Firestore → Regeln → Inhalt von `firestore.rules`
> einfügen → Veröffentlichen). Sonst lässt sich Material nicht speichern.

---


Team-Chat (mit Fotos), Aufgaben pro Studio (mit Fotos), Ankündigungen,
Push-Benachrichtigungen und sichere Firebase-Regeln.

## Dateien

| Datei | Zweck | Pflicht |
|---|---|---|
| `intern.html` | Die App | ✅ |
| `firebase-messaging-sw.js` | Empfängt Push bei geschlossener App | nur für Push |
| `firestore.rules` | Sichere Datenbank-Regeln | ✅ (einmal einspielen) |
| `functions/` | Server-Funktion, die Push verschickt | nur für Push |

`intern.html` und `firebase-messaging-sw.js` müssen **im selben Ordner** liegen
und über **HTTPS** erreichbar sein (z. B. GitHub Pages).

---

## 1. Fotos im Chat & bei Aufgaben  ✅ läuft sofort, kostenlos

- Im Chat: auf das **Büroklammer-Symbol** tippen → Bild wählen → senden.
- Bei Aufgaben: Chef kann beim Erstellen ein **Foto** anhängen; jeder im Studio
  kann per **„Foto hinzufügen"** ein Foto an eine Aufgabe hängen (z. B. als Nachweis).
- Bilder werden automatisch verkleinert/komprimiert und direkt in der Datenbank
  gespeichert – **kein Blaze-Plan nötig**. (Nur Bilder, keine PDFs/Word-Dateien.)
- Tippen auf ein Bild öffnet es im Vollbild.

---

## 2. Echte Studio-Namen eintragen

Oben in `intern.html` im `<script>`:

```js
var STUDIOS = [
  "Hürth", "Köln-Süd", ...   // deine 15 echten Namen
];
```

> Wichtig: Reihenfolge nicht nachträglich umsortieren, sonst verschieben sich
> bestehende Aufgaben/Kanäle (sie hängen an der Position in der Liste).

**Mehrere Studios pro Mitarbeiter:** Bei der Registrierung kann ein Mitarbeiter
beliebig viele Studios anhaken (z. B. Hürth + Brühl + Longerich). Er sieht dann
alle Chat-Kanäle und Aufgaben dieser Studios und wird für alle benachrichtigt.

Chef-Code (zum Registrieren als Chef) ebenfalls dort ändern:
```js
var CHEF_PIN = "1234";   // BITTE ÄNDERN!
```

---

## 3. Sichere Firebase-Regeln einspielen  ✅ wichtig

1. [Firebase Console](https://console.firebase.google.com) → Projekt **formenchat**
   → **Firestore Database** → Tab **Regeln (Rules)**.
2. Den gesamten Inhalt von **`firestore.rules`** hineinkopieren → **Veröffentlichen**.

Damit darf nur, wer eingeloggt ist, etwas lesen; Aufgaben und Ankündigungen
kann nur ein Chef anlegen. (Ersetzt den unsicheren Testmodus.)

---

## 4. Push-Benachrichtigungen „auch bei gesperrtem Handy"

Das braucht 3 Schritte. **Ohne diese Schritte funktioniert die App trotzdem** –
nur die Benachrichtigung kommt dann nur, solange die App offen/im Hintergrund ist.

### Schritt A – Blaze-Plan aktivieren
Push über eine Server-Funktion braucht den **Blaze-Plan** (Pay-as-you-go).
Er hat ein großzügiges Gratis-Kontingent – für ein 15-Studio-Team entstehen
praktisch keine Kosten. Console → unten links **„Upgrade" → Blaze**.

### Schritt B – Web-Push-Schlüssel (VAPID) holen
Console → ⚙️ **Projekteinstellungen → Cloud Messaging** →
Abschnitt **„Web Push certificates"** → **Schlüsselpaar generieren** →
den **öffentlichen Schlüssel** kopieren und in `intern.html` eintragen:

```js
var VAPID_KEY = "HIER_DEN_SCHLÜSSEL_EINFÜGEN";
```

> Schick mir den Schlüssel, dann trage ich ihn ein.

### Schritt C – Server-Funktion hochladen
Einmalig am PC (Node.js + Firebase CLI nötig):

```bash
npm install -g firebase-tools      # Firebase CLI installieren
firebase login                     # mit deinem Google-Konto anmelden
cd <Projektordner>                 # Ordner mit dem functions/-Verzeichnis
firebase deploy --only functions   # Funktion hochladen
```

Danach verschickt Firebase automatisch Push, sobald eine neue Nachricht,
Aufgabe oder Ankündigung entsteht.

> Wenn dir Schritt C zu technisch ist: sag Bescheid, ich führe dich durch oder
> mache es mit dir zusammen.

### Auf dem Handy aktivieren
Nach dem Login erscheint oben im Chat ein Banner **„Benachrichtigungen aktivieren"**.
Antippen und erlauben. (iPhone: funktioniert nur, wenn die Seite über
„Teilen → Zum Home-Bildschirm" als App installiert wurde, iOS 16.4+.)

---

## Was ich noch von dir brauche

1. Die **15 echten Studio-Namen**.
2. Den **VAPID-Schlüssel** (Schritt B) – falls du Hintergrund-Push willst.
3. Sag, ob du beim **Funktion-Hochladen** (Schritt C) Hilfe brauchst.
