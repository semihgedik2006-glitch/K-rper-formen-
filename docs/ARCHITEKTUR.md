# StudioChat — technische Architektur

**Stand:** 17. September 2026 · Für den Entwickler, der das Projekt
übernimmt.

---

## 1. Das Ungewöhnliche zuerst

Wer dieses Projekt zum ersten Mal öffnet, sucht nach Dingen, die es
nicht gibt. Deshalb vorweg:

| Es gibt **kein** | Stattdessen |
|---|---|
| Build-Schritt | `index.html` ist die Anwendung. Doppelklick, fertig |
| Bundler, Transpiler | Kein Webpack, kein Vite, kein Babel |
| Framework | Kein React, kein Vue. ES5-kompatibles JavaScript, direkt im Browser |
| `node_modules` im Wurzelverzeichnis | nur unter `functions/` und `tests/rules/` |
| Komponentendateien | 34.300 Zeilen in **einer** Datei (Stand 24.9.2026) |

**Das ist eine Entscheidung, keine Nachlässigkeit.** Die Begründung
steht in `README.md` unter „Warum es so gebaut ist". Kurzfassung: die
App läuft auf Tablets im Studio und auf privaten Handys, sie muss ohne
Netz weiterarbeiten, und sie wird von einer Person gepflegt. Ein
Build-Schritt wäre eine Stelle, an der das Ausliefern scheitern kann.

**Der Preis:** eine 26.000-Zeilen-Datei findet man nur mit der Suche.
Die Datei ist deshalb in klar beschriftete Abschnitte geteilt, und
jede heikle Stelle trägt einen Kommentar, der sagt **warum** — nicht
was.

---

## 2. Die Bestandteile

```
┌─────────────────────────────────────────────────────────────┐
│  BROWSER                                                     │
│                                                              │
│   index.html   ── die ganze Anwendung (34.300 Zeilen)        │
│   konfig.js    ── alles, was sich je Kunde unterscheidet     │
│   sw.js        ── Service Worker: Push, Offline              │
│   demo-daten.js── ersetzt das SDK, wenn ?demo in der Adresse │
│   loesungen-basis.js  ── 115 Probleme, erst beim             │
│                          ersten Öffnen der Hilfe             │
│   schulungen-basis.js ── die Module der Schulung,            │
│                          ebenso erst beim Öffnen             │
│                                                              │
│   5 Firebase-SDKs von gstatic.com:                           │
│   app · auth · firestore · messaging · functions             │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│  GOOGLE CLOUD — europe-west1 (St. Ghislain, Belgien)         │
│                                                              │
│   Firebase Hosting      ── liefert die vier Dateien aus      │
│   Firebase Auth         ── E-Mail + Passwort                 │
│   Cloud Firestore       ── die gesamte Datenhaltung          │
│     └─ firestore.rules  ── DIE Sicherheitsgrenze (1.910 Z.)  │
│   Cloud Functions       ── 59 Funktionen                     │
│   Cloud Messaging       ── Push                              │
│   Cloud Storage         ── NUR die nächtliche Sicherung      │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   SMTP-Anbieter    Google Apps Script     Stripe
   (Mailversand)    (Tabellenabgleich)     (Kasse)
```

---

## 3. Die eine Stelle, an der alles hängt: `S()` und `W()`

**Das Wichtigste an diesem Projekt.**

Mehrere Kundenbetriebe teilen sich eine Datenbank. Getrennt werden sie
über den Pfad:

```
firmen/<kennung>/todos/…
firmen/<kennung>/channels/…
firmen/<kennung>/zeiten/…
```

Im Browser stellt **eine einzige Funktion** dieses Präfix voran:

```js
S('todos')   →  firmen/koerperformen/todos
```

Serverseitig tut `W(firma)` dasselbe.

> **Ein einziges vergessenes Präfix würde einem Kunden die Daten eines
> anderen zeigen.** Deshalb gibt es diese Stelle genau einmal, und
> deshalb gibt es einen Durchlauf, der festhält, dass niemand daran
> vorbeischreibt (`tests/test-funktionen-pfade.js`).

**Die einzige Sammlung außerhalb** ist `users` — sie muss vor dem
Anmelden lesbar sein. Die Firmengrenze verlangt dort, dass Leser und
Konto dasselbe Feld `firma` tragen.

---

## 4. Wo die Grenzen wirklich stehen

Der wichtigste Satz für jeden, der hier etwas ändert:

> **Die Oberfläche zeigt. Die Regeln entscheiden.**

Ein manipulierter Browser kommt an der Oberfläche vorbei, an einer
Sicherheitsregel nicht. Jede Grenze, die etwas wert sein soll, gehört
deshalb nach `firestore.rules`.

Die tragenden Hilfsfunktionen dort:

| Funktion | Prüft |
|---|---|
| `istAktiv()` | Es gibt ein Profil **und** es ist freigegeben |
| `isChef()`, `isLeiter()` | Rolle aus dem eigenen Profil — nicht aus dem Aufruf |
| `manages(studioKey)` | Verwaltet dieses Studio — fürs **Schreiben** |
| `meinStudio(studioKey)` | Gehört dieses Studio zu meinen — fürs **Lesen** (seit 17.9.2026) |
| `inFirma(f)` | Gehört zu diesem Betrieb, und der Betrieb läuft |
| `schreibtIn(f)` | wie `inFirma`, **plus**: das Abo erlaubt Schreiben |
| `hatPremium(f)` | Abo-Stufe, nur dort wo eine Stufe wirklich abgrenzt |

**Warum `hatPremium` nicht in `inFirma` steht** — und warum das eine
Architekturentscheidung ist: jedes `get()` in einer Regel kostet einen
Lesevorgang. In `inFirma` aufgenommen wäre das ein zusätzlicher
Lesevorgang bei **jedem** Zugriff der ganzen App, für eine Grenze, die
zwei Sammlungen betrifft. Derselbe Gedanke trägt die Abo-Sperre: `zu`
setzt das Feld `aktiv` am Firmen-Dokument, das ohnehin geprüft wird.

---

## 5. Datenfluss am Beispiel „Aufgabe abhaken"

```
 1. Tippen        →  Oberfläche zeigt das Häkchen SOFORT
 2. Schreiben     →  S('studios').doc(sk).collection('todos').doc(id)
                        .update({done, doneBy, doneByUid, doneAt})
 3. Regel prüft   →  schreibtIn(f) && istAktiv()
                     && nur erlaubte Felder (todoMitarbeiterFelder)
 4. Ohne Netz     →  Firestore merkt es lokal und sendet später
 5. Auslöser      →  onTodoFertigF → Push an die Leitung
 6. Zuhörer       →  alle anderen Geräte bekommen die Änderung
```

**Punkt 3 ist die Grenze.** Die Regel lässt beim Abhaken nur eine feste
Liste von Feldern zu — `title`, `due` und `recurring` sind ausdrücklich
nicht dabei. Ein Feld, das die App weglässt, lässt sich in der Konsole
trotzdem mitschicken.

**Punkt 4 ist der Grund, warum die App im Studio funktioniert.** Kein
Netz im Keller heißt: es wird trotzdem abgehakt.

---

## 6. Die Serverseite

`functions/index.js`, 59 Exporte, alle in `europe-west1`.

| Art | Beispiele |
|---|---|
| **Auslöser** | `onNewMessage`, `onNewTodo`, `onTodoFertig`, `aboZugriffSpiegeln` |
| **Zeitpläne** | `dueTaskReminder`, `certExpiry`, `tagesUebersicht` (20:30), `monthlyReport`, `dailyBackup` (02:40), `purgeTrash` (03:30), `aboUhr` (03:45) |
| **Aufrufe aus der App** | `firmaAnlegen`, `aboSetzen`, `zugangEntfernen`, `stripeKasse`, `pinSetzen`, `stempeln` |
| **Offene Adressen** | `kalender`, `stripeHaken`, `runBirthdayCheckNow`, `monthlyReportNow` |

**Jeder Endpunkt prüft, wer ruft.** Ein `onCall` ist von jedem Rechner
der Welt erreichbar, sobald sein Name bekannt ist — und der Name steht
im Quelltext der App. `tests/test-funktionen-pfade.js` hält fest, dass
keiner ohne Prüfung bleibt, und trägt Gegenproben.

**Die vier offenen Adressen** hängen an einem Geheimnis. Beim Kalender
ist es eines **je Person**, zeitgleich verglichen — ein gemeinsames
hätte bedeutet, dass niemand seinen Link zurückziehen kann, ohne allen
anderen ihren kaputtzumachen.

### Beide Welten

Viele Auslöser gibt es **zweimal**: einmal für die flachen Altpfade
(`channels/…`) und einmal für die Firmenpfade
(`firmen/{firma}/channels/…`). Die Hilfsfunktion `beideWelten()` erzeugt
beide aus einer Beschreibung. Das ist kein Übergangszustand mehr — die
flachen Pfade sind Altdaten und gehören dem ersten Betrieb.

---

## 7. Das Demo-Verfahren

`?demo=chef` in der Adresse, und `demo-daten.js` **ersetzt das
Firebase-SDK**, bevor die Anwendung es zum ersten Mal benutzt.

* Keine Anmeldung, keine Abfrage, kein Schreibvorgang nach draußen.
* Alles liegt in einem JavaScript-Objekt und ist beim Neuladen weg.
* Es gibt **keinen Weg zu echten Daten** — auch nicht versehentlich.

**Präzise, weil der Unterschied zählt:** „kein Byte verlässt den
Browser" wäre zu viel behauptet. Die fünf SDK-Dateien werden weiterhin
von Googles Netz geladen. Heruntergeladen wird eine öffentliche
Bibliothek; gesendet wird nichts. `tests/test-demo.js` misst genau diese
Grenze — und zwar über eine Liste des **Erlaubten**, nicht des
Verbotenen: jede andere Anfrage ist ein Fund, auch eine, an die heute
niemand denkt.

---

## 8. Der Design-Schalter

Seit Runde 84 hängt das neue Aussehen an **einer** Klasse: `body.neu`.

Vier Quellen, die erste, die spricht, gewinnt:

1. `?neu=1` / `?neu=0` in der Adresse
2. das Gerät (`localStorage`)
3. Demo-Modus (immer an)
4. `config/design` — der Klick „für alle veröffentlichen", nur Chef

Damit lässt sich ein Umbau ausliefern, ohne dass jemand, der gerade
arbeitet, etwas merkt.

---

## 9. Ausliefern

Ein Workflow, vier Aufträge:

| Auftrag | Was |
|---|---|
| `regeltest` | Regeln, Umzug, Cloud Functions prüfen |
| `hosting` | die vier Dateien ausliefern |
| `rules` | `firestore.rules` + `storage.rules` |
| `deploy` | die 59 Functions, mit `.env` aus GitHub-Secrets |

**Was ausgeliefert wird, steht in `firebase.json`** als *ignore*-Liste —
alles, was nicht dort steht, ist öffentlich abrufbar. `docs/`, `tests/`,
`tools/`, `functions/` und alle `.md` sind ausgenommen.

`tests/test-ausliefern.js` meldet jede ausgelieferte Datei, die keinen
Deploy auslöst. Ein versehentlich abgelegtes `notizen.txt` fällt dort
auf, bevor es gemergt wird.

### Die Content-Security-Policy

`index.html` trägt eine CSP mit `default-src 'none'` und **sha256-Hashes
der Inline-Skripte**.

> **Nach jeder Änderung an einem Inline-Skript muss
> `node tools/csp.js --setzen` laufen.** Sonst startet die App stumm
> nicht. Das ist die häufigste Falle in diesem Projekt.

---

## 10. Abhängigkeiten

### Im Browser

| | Version | Wofür |
|---|---|---|
| Firebase JS SDK (compat) | 10.12.2 | app, auth, firestore, messaging, functions — **von `www.gstatic.com`** |
| Barlow, Barlow Condensed | — | 9 `woff2` unter `schriften/`, 195,8 KB — **seit 17.9.2026 lokal** |

Sonst nichts. Keine Icon-Bibliothek (eigene SVG), kein jQuery, kein
Lodash, kein Chart-Paket.

**Damit geht beim Laden der Seite genau ein Abruf an einen Dritten
hinaus: das Firebase-SDK.** Das ist gemessen, nicht angenommen —
`tests/test-schriften.js` schreibt jede Anfrage mit und lässt nur diese
eine durch. Bis zum 17.9.2026 kamen die Schriften dazu; siehe
`BEKANNTE-PROBLEME.md`, P-03.

### Serverseitig (`functions/package.json`)

| Paket | Version | Wofür |
|---|---|---|
| `firebase-admin` | ^12.7.0 | Datenbank- und Auth-Zugriff mit Adminrechten |
| `firebase-functions` | ^7.3.2 | Das Funktionsgerüst |
| `@google-cloud/firestore` | ^7.9.0 | Export für die Sicherung |
| `nodemailer` | ^9.1.1 | SMTP-Versand |
| `stripe` | ^22.6.2 | Die Kasse (seit 16.9.2026) |

Node 22. `npm audit --omit=dev` meldete zuletzt **0 Lücken**.

### Für die Durchläufe

| | Wofür |
|---|---|
| `playwright` + Chromium | 142 Durchläufe über die echte Oberfläche |
| `@firebase/rules-unit-testing` 4.0.1 | Regeltests im Emulator |
| `firebase-tools` 14.27.0 | **feste Version, ohne `^`** |

> Die feste Version ist eine Lehre: örtlich lag 15.26.0, die
> Auslieferung prüfte mit 14. Der neuere Emulator verzieh einen
> Regelpfad mit leerem Segment, der ältere nicht — örtlich 165 grün, in
> der Auslieferung 3 rot.

---

## 11. Technische Schulden

Getrennt nach **nachgewiesenem Problem** und **Verbesserungsvorschlag**.

### Nachgewiesen

| | Wo | Auswirkung |
|---|---|---|
| Studiogrenze beim Lesen: Brett, Dokumente, Chat-Kanäle | `firestore.rules` | **Art.-9-Daten sind seit 17.9. begrenzt** (`meinStudio()`); für die Sammlungen ausserhalb von `studios/…` ist es offen. `BEKANNTE-PROBLEME.md`, P-01 |
| ~~Google Fonts extern nachgeladen~~ | `index.html` | **behoben 17.9.2026** — lokal unter `schriften/` |
| Keine Lizenzdatei im öffentlichen Repository | Wurzelverzeichnis | Nutzungsrechte ungeklärt |
| Passwort-Mindestlänge 6 Zeichen | `index.html` | in `TOM.md` als offen geführt |
| Kein Verfahren für Datenschutzvorfälle | — | Pflicht nach Art. 33 DSGVO |
| Wiederherstellung nie geprobt | — | „eine Hoffnung, keine Maßnahme" |
| Keine Löschfrist für Stempelzeiten | `functions/index.js` | Daten bleiben unbegrenzt |
| Kein Korrekturweg für Stempel | — | ein vergessener Ausstempel bleibt falsch |

### Vorschlag, nicht Befund

| | Warum |
|---|---|
| 34.300 Zeilen in einer Datei | bewusst so; der Preis ist Auffindbarkeit |
| Flache Altpfade neben Firmenpfaden | verdoppelt jeden Auslöser |
| Zwei stillgelegte Seiten im Repo | `marketing.html`, `wachstum.html` — greifen noch flach zu |
| Auskunft nach Art. 15 ist Handarbeit | überschaubar zu bauen |

---

## 12. Wo man anfängt zu suchen

| Ich suche … | Ich schaue in … |
|---|---|
| eine Ansicht | `NAV` in `index.html`, dann `showView` |
| wer was darf | `firestore.rules`, die Hilfsfunktionen oben |
| einen Zeitplan | `functions/index.js`, `.pubsub.schedule(` |
| warum etwas so ist | den Kommentar darüber — sie erklären das Warum |
| was zuletzt passiert ist | `docs/FORTSCHRITT.md`, von unten |
| ob etwas geprüft ist | `tests/`, Dateiname nach Thema |
| was noch offen ist | `docs/OFFEN.md` |
