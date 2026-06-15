# Körperformen – Internes Portal (`intern.html`)

Ein internes Portal für dein Team: **Team-Chat**, ein **Chef-Bereich** zum Rundschicken von
Infos und **To-dos pro Studio** (15 Stück), die die Mitarbeiter abhaken können.

Die Werbe-Website (`index.html`) bleibt davon komplett unberührt.

---

## 1. Schnellstart (sofort ausprobieren)

1. Öffne die Datei **`intern.html`** im Browser (Doppelklick oder über deinen Webspace).
2. **Als Mitarbeiter:** Namen eingeben, Studio wählen → *Anmelden*.
3. **Als Chef:** oben „Chef" wählen, Namen + **Chef-Code** eingeben → *Anmelden*.
   - Standard-Code: **`1234`** → bitte unbedingt ändern (siehe unten).

> **Demo-Modus:** Ohne weitere Einrichtung laufen die Daten nur **lokal im Browser**
> (verschiedene Tabs desselben Browsers synchronisieren sich). Zum echten Betrieb über
> mehrere Handys/PCs brauchst du den Live-Modus (Abschnitt 4).

---

## 2. Was kann das Portal?

| Bereich | Mitarbeiter | Chef |
|---|---|---|
| **Chat** | „Allgemein" (alle) + eigener Studio-Kanal | alle Kanäle (alle 15 Studios) |
| **Aufgaben** | sieht To-dos des eigenen Studios, kann abhaken | sieht & verteilt To-dos für alle Studios, kann löschen |
| **Infos** | sieht Ankündigungen an alle / an sein Studio | – |
| **Chef-Bereich** | – | Ankündigung an alle senden, Aufgaben erstellen, Studio-Übersicht |

**Der separate Chef-Link:** Hänge `#chef` an die Adresse an, z. B.
`…/intern.html#chef` – dann ist der Chef-Zugang direkt vorausgewählt.

---

## 3. Anpassungen (oben in `intern.html` im `<script>`)

```js
// Die 15 Studios – Namen frei ändern:
var STUDIOS = ["Studio 1","Studio 2", ... "Studio 15"];

// Chef-Code zum Anmelden – BITTE ÄNDERN:
var CHEF_PIN = "1234";
```

Du kannst z. B. die echten Studio-Namen/Städte eintragen.

---

## 4. Live-Modus: echter Betrieb über mehrere Geräte (kostenlos mit Firebase)

Damit **alle Mitarbeiter geräteübergreifend** chatten und dieselben Aufgaben sehen,
brauchst du eine kostenlose Online-Datenbank. Am einfachsten: **Firebase** von Google.

**Schritt für Schritt:**

1. Gehe auf <https://console.firebase.google.com> und melde dich mit einem Google-Konto an.
2. **„Projekt hinzufügen"** → Namen vergeben (z. B. `koerperformen-intern`) → erstellen.
3. Links im Menü **„Realtime Database"** → **„Datenbank erstellen"**.
   - Standort wählen (Europa, z. B. *europe-west1*).
   - Starte im **„Testmodus"** (für den Anfang ok; siehe Sicherheitshinweis unten).
4. Oben links aufs **Zahnrad → Projekteinstellungen → „Meine Apps" → Web-App `</>`**.
   - App-Namen vergeben, registrieren. Du bekommst einen Block `const firebaseConfig = {...}`.
5. Diese Werte in `intern.html` eintragen. Suche dort nach `var FIREBASE_CONFIG = null;`
   und ersetze es z. B. durch:

```js
var FIREBASE_CONFIG = {
  apiKey: "AIza…",
  authDomain: "koerperformen-intern.firebaseapp.com",
  databaseURL: "https://koerperformen-intern-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "koerperformen-intern",
  appId: "1:…:web:…"
};
```

> Wichtig: Die `databaseURL` muss dabei sein (steht in der Realtime-Database-Ansicht oben).

6. Speichern, Seite neu laden. Oben steht jetzt **„Live"** statt „Demo". Fertig 🎉

**Sicherheitshinweis:** Der Firebase-Testmodus erlaubt jedem mit der Adresse Zugriff und
läuft nach ~30 Tagen ab. Für den Dauerbetrieb solltest du in der Datenbank unter „Regeln"
einen Schutz einrichten (z. B. Firebase-Authentifizierung). Sag Bescheid, dann richte ich
dir passende Sicherheitsregeln ein.

---

## 5. Online stellen

`intern.html` ist eine einzelne Datei und läuft auf jedem Webspace. Wenn die Werbeseite
schon über **GitHub Pages** läuft, ist das Portal automatisch erreichbar unter:

```
https://DEIN-PAGES-LINK/intern.html
```

Tipp: Nicht öffentlich verlinken. Die Seite ist bereits auf `noindex` gesetzt
(taucht nicht bei Google auf).

---

## Fragen / Wünsche

Sag einfach Bescheid, wenn du möchtest:
- echte Studio-Namen statt „Studio 1–15",
- Login mit persönlichem Passwort pro Mitarbeiter,
- Foto-/Datei-Versand im Chat,
- E-Mail-/Push-Benachrichtigung bei neuen Aufgaben,
- sichere Firebase-Regeln.
