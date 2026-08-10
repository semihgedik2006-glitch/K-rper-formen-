# Stufe 2E im Probe-Projekt prüfen — deine Klickanleitung

**Was hier geprüft wird:** ob die Cloud Functions nach dem Umzug wirklich
anspringen. Das ist die eine Sache, die 53 Prüfungen im Emulator *nicht*
beweisen können — dort gibt es keine echten Auslöser, sondern nur einen
Aufruf von Hand.

**Dauer:** ungefähr 15 Minuten, alles in Google Cloud Shell.

---

## Vorab: was hier NICHT geht, und warum

Ich hatte dir gesagt: *„im Probe-Projekt eine Nachricht schreiben und
sehen, ob Push ausgelöst wird."* **Das geht so nicht**, und das ist meine
Ungenauigkeit — nicht deine.

In `konfig.js` steht für den Probelauf ausdrücklich:

```js
KONFIG.vapidKey = '';           // kein Push in der Probe
```

Ohne diesen Schlüssel kann sich in der Probe **kein Gerät für Push
anmelden**. Es gibt dort also gar keine Empfänger. Eine Nachricht würde
die Funktion zwar auslösen, aber es käme nichts an — und zwar aus einem
Grund, der nichts mit Stufe 2E zu tun hat. Ich hätte dich losgeschickt,
um eine Stille zu deuten, die schon vorher feststand.

Das war Absicht beim Einrichten der Probe: sie soll niemandem aufs Handy
funken. Diese Entscheidung bleibt.

**Was stattdessen geprüft wird, und was das taugt:**

| | |
|---|---|
| Springt der Auslöser auf dem **neuen Pfad** an? | ✅ hier prüfbar |
| Findet die Funktion die **richtigen Daten**? | ✅ hier prüfbar |
| Kommt Push auf einem **echten Handy** an? | ❌ nicht hier — und das war vorher schon so |

Genau die ersten beiden sind das, was Stufe 2E geändert hat. Der Versand
selbst ist unveränderter Code, der seit Monaten läuft.

---

## Schritt 1 — Cloud Shell öffnen

1. [console.cloud.google.com](https://console.cloud.google.com) öffnen
2. Oben rechts auf das Symbol **`>_`** (Cloud Shell aktivieren)
3. Unten öffnet sich ein schwarzes Fenster. Warte, bis eine Zeile mit
   deinem Namen und `$` erscheint.

Alles Weitere ist Kopieren und Einfügen. **Einfügen mit Strg+V** (auf dem
Mac Cmd+V), abschicken mit Enter.

---

## Schritt 2 — Das Projekt holen

```bash
cd ~ && rm -rf kf && git clone -q https://github.com/semihgedik2006-glitch/K-rper-formen-.git kf && cd kf && git log --oneline -1
```

In der letzten Zeile muss **`Stufe 2C–2E`** stehen. Steht dort etwas
anderes, warte eine Minute und wiederhole den Befehl.

---

## Schritt 3 — Die Functions ins Probe-Projekt ausrollen

```bash
cd ~/kf/functions && npm install --no-audit --no-fund
```

Das dauert ein bis zwei Minuten. Danach:

```bash
cd ~/kf && npx firebase-tools deploy --only functions --project formenchat-probe
```

> **Wenn er nach Anmeldung fragt:** in Cloud Shell bist du schon
> angemeldet. Sollte er trotzdem fragen, den angezeigten Link öffnen und
> das Google-Konto wählen, mit dem das Projekt angelegt wurde.

> **Wenn eine Meldung über Berechtigungen kommt:** schick sie mir
> unverändert. Nicht raten, nicht wiederholen.

Am Ende muss dort stehen:

```
✔  Deploy complete!
```

**Das allein ist noch kein Beweis.** Es heisst nur: die Dateien liegen
oben. Ob sie anspringen, sagt Schritt 5.

---

## Schritt 4 — Eine Nachricht in die Probe schreiben

Zwei Wege — nimm den, der dir leichter fällt.

**Weg A: über die App.** Vorschau starten:

```bash
cd ~/kf && python3 -m http.server 8080
```

Dann oben rechts in Cloud Shell auf **Webvorschau** → **Vorschau auf Port
8080**. Es öffnet sich ein neuer Tab. **Hänge an die Adresse `?probe=1`
an** und lade neu. Oben muss **PROBELAUF** stehen. Anmelden, in einen
Chat gehen, irgendetwas schreiben.

> Der Server blockiert diesen Tab. Für Schritt 5 brauchst du einen
> zweiten: auf das **`+`** oben in der Cloud-Shell-Leiste klicken.

**Weg B: ohne App**, direkt in die Datenbank — schneller, wenn die
Vorschau zickt. Im zweiten Tab:

```bash
cd ~/kf && node -e "
const admin=require('./functions/node_modules/firebase-admin');
admin.initializeApp({projectId:'formenchat-probe'});
admin.firestore().doc('firmen/koerperformen/channels/allgemein/messages/'+Date.now())
 .set({uid:'pruef',name:'Prüfung 2E',text:'Auslöser-Test '+new Date().toLocaleTimeString('de-DE'),ts:Date.now()})
 .then(()=>{console.log('✓ Nachricht geschrieben');process.exit(0)});
"
```

---

## Schritt 5 — Nachsehen, ob die Funktion angesprungen ist

**Das ist der eigentliche Test.** Warte eine halbe Minute, dann:

```bash
cd ~/kf && npx firebase-tools functions:log --only onNewMessageF -n 20 --project formenchat-probe
```

### So liest du das Ergebnis

**Es hat geklappt**, wenn dort Zeilen mit `onNewMessageF` stehen und eine
davon `Function execution started` heisst — mit einer Uhrzeit von eben.
Dann ist bewiesen: der Auslöser hängt am Pfad `firmen/koerperformen/…`
und springt an.

Dass danach kein Push rausging, ist **richtig so** — siehe oben, in der
Probe gibt es keine Empfänger.

**Es hat NICHT geklappt**, wenn gar nichts kommt oder nur ältere Einträge.
Dann schick mir die Ausgabe unverändert. Bitte nichts nachbessern.

### Die Gegenprobe — bitte nicht überspringen

Ein Protokoll, das immer etwas zeigt, zeigt nichts. Also derselbe Blick
auf den **alten** Auslöser:

```bash
cd ~/kf && npx firebase-tools functions:log --only onNewMessage -n 20 --project formenchat-probe
```

Hier darf **nichts von eben** stehen — du hast ja auf den neuen Pfad
geschrieben. Steht dort trotzdem ein frischer Eintrag, hat einer der
beiden Auslöser den falschen Pfad, und ich muss das ansehen, bevor
irgendetwas live geht.

---

## Was du mir schickst

Vier Dinge, unverändert kopiert:

1. Die letzte Zeile aus Schritt 3 (`Deploy complete!` oder der Fehler)
2. Die Ausgabe von Schritt 5, erster Befehl (`onNewMessageF`)
3. Die Ausgabe von Schritt 5, Gegenprobe (`onNewMessage`)
4. Falls irgendwo etwas rot war: diese Meldung, vollständig

Bitte nichts weglassen, was nach Fehler aussieht. Genau daran ist beim
letzten Mal eine halbe Stunde draufgegangen: im Deploy-Protokoll stand
„uploading rules", aber nie „released" — und ich habe die Meldung
gedeutet, statt sie zu lesen.

---

## Und danach?

Dann kommt der **Live-Umzug**. Die Schritte stehen in `OFFEN.md`. Bis
dahin ändert sich im Betrieb nichts: `KONFIG.mandant` steht auf `false`,
die App läuft auf den alten Pfaden, und die neuen Auslöser warten
einfach.
