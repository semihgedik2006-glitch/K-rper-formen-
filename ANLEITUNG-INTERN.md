# Körperformen – Internes Portal

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

> Schick mir die 15 Namen, dann trage ich sie für dich ein.
> Wichtig: Reihenfolge nicht nachträglich umsortieren, sonst verschieben sich
> bestehende Aufgaben/Kanäle (sie hängen an der Position in der Liste).

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
