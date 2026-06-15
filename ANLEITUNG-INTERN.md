# Körperformen – Internes Portal (PWA)

Internes Portal mit Team-Chat, Aufgaben pro Studio und Chef-Bereich – läuft als **PWA**
(Progressive Web App), also wie eine echte App auf dem Handy.

## Die Dateien

Vier Dateien gehören zusammen und müssen **im selben Ordner** liegen:

| Datei | Zweck |
|---|---|
| `intern.html` | Die App selbst |
| `manifest.json` | Sagt dem Handy: „Ich bin eine App" |
| `sw.js` | Service Worker (Caching, schneller Start, offline) |
| `icon.svg` | App-Icon (KF-Logo) |

`index.html` (die Werbeseite) bleibt unberührt.

## Online stellen

Alle vier Dateien auf den Webspace oder zu **GitHub Pages** hochladen. Erreichbar dann
unter z. B. `https://DEIN-LINK/intern.html`.

> ⚠️ Wichtig: Damit der Service Worker funktioniert, muss die Seite über **HTTPS**
> erreichbar sein (GitHub Pages, Netlify, dein Hoster – alle modernen machen das automatisch).
> Auf `http://` funktionieren PWA-Features nicht.

## Auf dem Handy installieren

**Android (Chrome):** Im Login-Screen erscheint ein Knopf **„📲 Als App installieren"** –
einfach antippen. Alternativ Browser-Menü → „App installieren".

**iPhone (Safari):** Apple erlaubt PWAs nur über das Teilen-Menü:
1. Teilen-Symbol antippen (Quadrat mit Pfeil nach oben).
2. „Zum Home-Bildschirm" wählen.

Nach der Installation:
- App-Icon „KF Portal" auf dem Home-Screen.
- Beim Öffnen: Vollbild, kein Browser-Balken.
- **Startet sofort** beim zweiten Öffnen (alles ist im Cache).
- Login bleibt gespeichert.

## Firebase-Einstellungen (einmalig)

In <https://console.firebase.google.com> → Projekt **formenchat**:

1. **Authentication** → Sign-in method → **E-Mail/Passwort** aktivieren.
2. **Firestore Database** → erstellen (Testmodus, Region `europe-west1`).
3. **Authentication → Settings → Authorized domains** → falls die Seite nicht unter
   `formenchat.firebaseapp.com` läuft (z. B. GitHub Pages): **eigene Domain hinzufügen**.

## Anpassungen (in `intern.html` oben im `<script>`)

```js
var STUDIOS = ["Studio 1", ... "Studio 15"];  // echte Namen
var CHEF_PIN = "1234";                          // Chef-Code – BITTE ÄNDERN!
```

## Updates ausrollen

Wenn ich später Änderungen an `intern.html` oder `sw.js` mache:

1. Im **Service Worker** (`sw.js`) die Zeile `const VERSION = 'v3';` hochzählen
   (z. B. auf `'v4'`) – das löscht den alten Cache.
2. Alle Dateien neu hochladen.
3. Bei den Nutzern: App einmal schließen und neu öffnen – Update kommt automatisch.

## Falls etwas nicht klappt

- **Spinner bleibt ewig auf Handy:** App komplett schließen (aus dem App-Switcher wischen)
  und neu öffnen. Falls weiterhin: Browser-Cache leeren oder im privaten Modus testen.
- **„Als App installieren"-Knopf erscheint nicht:** Du bist nicht auf HTTPS, oder die
  App ist schon installiert. Auf iOS gibt es den Knopf nicht – dort musst du es über
  „Teilen → Zum Home-Bildschirm" machen.
- **Login klappt nicht:** Domain in Firebase „Authorized domains" eintragen (siehe oben).
