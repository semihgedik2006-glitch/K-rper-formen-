# Körperformen – Internes Portal (`intern.html`)

Internes Portal fürs Team: **Team-Chat**, **Chef-Bereich** für Rundnachrichten und
**To-dos pro Studio** (15 Stück) zum Abhaken. Läuft **geräteübergreifend** über
**Firebase** (Login + Echtzeit-Datenbank). Die Werbeseite (`index.html`) bleibt unberührt.

---

## 1. Was schon eingerichtet ist

- **Firebase-Projekt:** `formenchat` – die Zugangsdaten (Config) sind bereits in
  `intern.html` eingetragen.
- **Login:** E-Mail + Passwort (Firebase Authentication).
- **Datenbank:** Firestore (Chat, Aufgaben, Ankündigungen – alles live auf allen Geräten).

## 2. Was du in der Firebase-Konsole noch aktivieren musst

In <https://console.firebase.google.com> → Projekt **formenchat**:

1. **Authentication** → „Get started" → Tab **Sign-in method** →
   **E-Mail/Passwort** aktivieren.
2. **Firestore Database** → „Datenbank erstellen" → **Testmodus** → Region **europe-west1**.
   *(Wichtig: Firestore, nicht Realtime Database.)*

Danach funktioniert Registrierung und Login sofort.

## 3. Online stellen

`intern.html` ist eine einzelne Datei. Auf deinen Webspace oder GitHub Pages laden →
erreichbar z. B. unter `https://DEIN-LINK/intern.html`.

## 4. Auf dem Handy nutzen („wie eine App")

1. Den Link im **Handy-Browser** öffnen (Safari auf iPhone, Chrome auf Android).
2. Menü öffnen → **„Zum Home-Bildschirm hinzufügen"**.
3. Es erscheint ein App-Symbol **„KF Portal"**. Beim Öffnen läuft es im **Vollbild**
   wie eine echte App. Der Login bleibt gespeichert – kein ständiges Neu-Anmelden.

> Falls mal „Verbindung wird hergestellt…" zu lange steht: nach 12 Sekunden erscheint
> automatisch der Login bzw. ein **„Neu laden"**-Knopf. Meist hilft kurz neu laden
> oder Internetverbindung prüfen.

## 5. Anpassungen (oben in `intern.html` im `<script>`)

```js
var STUDIOS = ["Studio 1", ... "Studio 15"];  // echte Namen eintragen
var CHEF_PIN = "1234";                          // Chef-Code – BITTE ÄNDERN!
```

- **Mitarbeiter** registriert sich mit Name + Studio.
- **Chef** registriert sich mit dem Chef-Code (Standard `1234`).
- Separater Chef-Link: `…/intern.html#chef` (Chef-Tab ist dann vorausgewählt).

## 6. Sicherheit (empfohlen)

Der Firestore-**Testmodus** erlaubt jedem mit der Adresse Zugriff und läuft nach ~30 Tagen
ab. Für den Dauerbetrieb sollten echte Sicherheitsregeln rein (nur eingeloggte Nutzer).
Sag Bescheid – dann richte ich dir passende Firestore-Regeln ein.
