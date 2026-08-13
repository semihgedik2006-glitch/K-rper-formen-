# Stufe 2E prüfen — und wie es tatsächlich gelaufen ist

**Was hier geprüft wird:** ob die Cloud Functions nach dem Umzug wirklich
anspringen. Das ist die eine Sache, die 53 Prüfungen im Emulator *nicht*
beweisen können — dort gibt es keine echten Auslöser, sondern nur einen
Aufruf von Hand.

---

## ✅ ERLEDIGT am 10. August 2026, 22:19 Uhr

**Nicht im Probe-Projekt, sondern direkt im Betrieb** — und zwar sicher.
Warum es anders kam, steht weiter unten; hier zuerst der Beleg.

Eine Testnachricht nach `firmen/pruef-2e/channels/test/messages/…` im
Projekt `formenchat`, geschrieben um 22:19:16. Zwei Sekunden später:

```
22:19:18  onNewMessageF: Function execution started
22:19:19  onNewMessageF: Function execution took 604 ms, finished with status: 'ok'
```

Und der Pfad, den Google selbst zurückgibt:

```
resource: .../documents/firmen/{firma}/channels/{channelId}/messages/{msgId}
state:    ACTIVE
```

Damit ist belegt, was Stufe 2E geändert hat: **Firestore liefert
Ereignisse an den verschachtelten Pfad aus, im echten Projekt.**

### Warum das im Betrieb gefahrlos war

Der gefährliche Gedanke daran war: wenn dadurch `alleFirmen()` plötzlich
eine Firma sieht, halten ab diesem Moment **alle Zeitpläne den Betrieb
für umgezogen** und fassen die echten Daten nicht mehr an. Genau der
Ausfall, den 2E verhindern soll — ausgelöst von der Prüfung selbst.

Deshalb vorher im Emulator gemessen statt vermutet:

```
collection("firmen").get().empty     : true (size 0)
collection("firmen").listDocuments() : 1  pruef-2e
alleFirmen() ergäbe: [null] → flach, wie heute
```

Das Elterndokument `firmen/pruef-2e` wird nie geschrieben, und `.get()`
sieht solche Phantom-Eltern nicht — nur `listDocuments()`. `alleFirmen()`
benutzt `.get()`. Im Betrieb bestätigt: `Firmen vorher: 0`,
`Firmen nachher: 0`.

Push ging an niemanden: die Funktion filtert die Geräte nach Firma
`pruef-2e`, und die hat kein Mensch. Die Testnachricht wurde danach
wieder entfernt.

### Warum nicht im Probe-Projekt

Der Deploy dorthin ist **zweimal an derselben Stelle gescheitert**:

```
Unable to retrieve the repository metadata for .../repositories/gcf-artifacts.
Ensure that the Cloud Functions service account has
'artifactregistry.repositories.list' and 'artifactregistry.repositories.get'
```

Das Probe-Projekt bekam zum ersten Mal Cloud Functions; Google musste
dafür vier Dienste erst einschalten, und dem Dienstkonto fehlt danach
das Recht auf die neu angelegte Artefakt-Ablage. Ein Google-Problem in
einem frischen Projekt, ohne Bezug zu diesem Code.

Falls es später doch gebraucht wird — der Einzeiler dafür:

```bash
PN=$(gcloud projects describe formenchat-probe --format='value(projectNumber)') && \
gcloud projects add-iam-policy-binding formenchat-probe \
  --member="serviceAccount:service-$PN@gcf-admin-robot.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"
```

### Eine Falle für die nächsten Befehle

In einem `node -e "…"` mit **doppelten** Anführungszeichen frisst die
Shell ein `!`:

```
-bash: !v.empty: event not found
```

Das kam bei der Prüfung vor. Hier ohne Folgen — die entscheidende
Zahl stand ohnehin daneben — aber beim Umzug gehört so etwas nicht in
eine Zeile, die etwas schreibt. Also: einfache Anführungszeichen oder
gleich eine Datei.

---

## Die ursprüngliche Anleitung

Steht unverändert hier, falls das Probe-Projekt später doch gebraucht
wird. **Dauer:** ungefähr 15 Minuten, alles in Google Cloud Shell.

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
