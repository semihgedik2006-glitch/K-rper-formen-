# Was noch offen ist

Stand 17. August 2026.

> **Neu bei dir seit dem 17.8.:** `KONFIG.vertriebMail` in `konfig.js`.
> Auf dem Anmeldebildschirm gibt es jetzt „Ich führe ein Studio" mit
> einem Angebot-Fenster. Solange das Feld leer ist, steht dort ein
> Hinweis statt eines Knopfes — eine Adresse gehört nicht in ein
> öffentliches Repo, die trägst du selbst ein.
>
> **Und eine Entscheidung, die ich nicht treffen kann:** das Fenster
> nennt bewusst **keinen Preis**. Die Zahlen in `ABO-PLAN.md` sind dort
> selbst als Platzhalter markiert. Sobald du einen echten Preis hast,
> ist er eine Zeile.

## Auf einen Blick

Das Ausführliche steht weiter unten und in `SICHERHEIT.md`. Hier nur die
Liste, sortiert nach dem, was zuerst dran wäre.

### Bei dir

| Was | Wo | Dauer |
|---|---|---|
| **Firmencode setzen** | App → Verwaltung → Team | 2 Min |
| **Vier rechtliche Pflichtfelder** | App → Verwaltung → System | 5 Min |
| **`STUDIOCHAT_TOKEN` im Apps Script** | `SHEETS-TOKEN.md` | 10 Min |
| Datenschutztext über einen Anwalt | vor dem ersten fremden Kunden | – |
| Eigene Absenderadresse (Domain) | vor dem ersten fremden Kunden | – |
| Steuerberater | vor dem ersten echten Geld (Abo C–E) | – |

> Die drei oberen stehen seit dem 11.8. hier. Sie sind der Grund für die
> Einrichtungs-Karte auf der Startseite — solange sie offen sind, steht
> sie dort.

### Bei mir · Sicherheit

| Was | Dringlichkeit | Aufwand |
|---|---|---|
| **`users`-Regel scharf stellen** — geht erst, wenn an jedem Konto `firma` steht (Verwaltung → Firmen → „Konten ohne Firma") | **vor dem zweiten Kunden** | klein |
| **`allow create` auf `users` fragt nicht nach der Firma** — ein Chef von A kann ein Konto anlegen, das auf Firma B zeigt. Hängt an derselben Voraussetzung wie die Zeile darüber und ist in `tests/rules/rechte.test.js` als `BEKANNT OFFEN` festgehalten | **vor dem zweiten Kunden** | klein |
| **Firebase-SDK im Browser** (10.12.2) auf gemeldete Lücken prüfen | wenn Zeit ist | klein |
| **Angriffsdurchlauf durch `werbung.html`** (wie `test-xss.js`) | wenn Zeit ist | klein |
| Flache Alt-Daten aufräumen | ab Mitte September | ½ Sitzung |

### Erledigt am 17. August: die Fehlerliste des Chefs

Aus dem Betrieb gemeldet — elf rote Zeilen unter Verwaltung → System, alle
harmlos, aber sie verdeckten alles Echte. Zwei Ursachen, beide belegt statt
vermutet:

| Meldung | Ursache | Behandlung |
|---|---|---|
| `img-src: …/cleardot.gif?zx=…`, sechsmal | Firestore prüft bei einer Kanalstörung über diese 1×1-Grafik, ob überhaupt Netz da ist. Im SDK nachgelesen: `2==t ? new Xe(i\|\|"//www.google.com/images/cleardot.gif") … TestLoadImage`. Blockiert man sie, feuert `onerror` — und Firestore schliesst daraus **„kein Netz"**. Nach jeder kurzen WLAN-Störung also fälschlich offline. | genau dieser **Pfad** in `img-src` erlaubt, nicht der Host |
| `connect-src: …firebase-*.js.map`, fünfmal | Quelltext-Karten. Die holt nur die Entwicklerkonsole, nie ein Handy im Studio. | nicht mehr gemeldet |

Dazu die eigentliche Ursache der **Menge**: das Anhängsel `?zx=…` ist bei
jeder Prüfung anders, und der Meldeschlüssel enthielt es. Aus einer Sache
wurden so sechs Einträge. Jetzt wird der Fragezeichen-Teil abgeschnitten:
eine Zeile mit einem Zähler.

Belegt statt behauptet — im Browser gemessen, dass CSP beim Pfadvergleich
das `?…` ignoriert: `cleardot.gif?zx=abc` lädt, `anderes.gif` **auf
demselben Host** bleibt blockiert. Steht als Gegenprobe in
`tests/test-csp.js`. Dabei fiel auf, dass `werbung.html` den ganzen Host
`xn--krperformen-rfb.com` für Bilder offen hatte — jetzt sind es die zwei
Bilder, die sie wirklich lädt.

> **Drei Punkte sind am 13.8. weggefallen, nicht erledigt worden:**
> `marketing.html` und `wachstum.html` sind stillgelegt. Damit sind die
> Nachbarseiten auf den Firmen-Pfaden, ihre fehlende CSP und die für jeden
> lesbaren Termine keine Fragen mehr — es kommt kein Browser mehr an diese
> Sammlungen. Siehe unten.

### Stillgelegt am 13. August

`marketing.html` und `wachstum.html` werden nicht mehr ausgeliefert
(`firebase.json`), und ihre Sammlungen stehen in `firestore.rules` auf
`false`: `mkProjects`, `appointments`, `emailTemplates`, `studioMetrics`,
`competitors`, `expansionLeads`.

Die Dateien bleiben im Repo. **Zurückholen** heisst: die zwei Zeilen aus
`firebase.json` streichen und die Regeln aus dem Verlauf zurückholen
(`git show 6253c61 -- firestore.rules`). Vorher muss aber der Umbau auf
die Firmen-Pfade nachgeholt werden — sonst ist die Lücke wieder da, die
das Stilllegen geschlossen hat.

Die Cloud Functions bleiben unangetastet: sie arbeiten mit Admin-Rechten
und unterliegen den Regeln nicht. `marketingChat` und `marketingImage`
sind weiter erreichbar, aber nur für den Chef und ohne Oberfläche.

> **Probetraining:** in der App stehen nur Zahlen und die Namen des
> eigenen Teams — keine Kundennamen, keine Kontaktdaten. Das ist der
> Grund, warum dafür kein eigener Absatz im Datenschutztext nötig ist.
> `tests/test-probetraining.js` prüft es bei jedem Durchlauf mit.

### Bei mir · Ausbau

| Was | Warum | Aufwand |
|---|---|---|
| Einrichtungs-Assistent | macht aus dem Projekt ein Produkt | mittel |
| Echter Dateispeicher | hebt die 0,7-MB-Grenze | mittel, ab ~0,03 €/GB |
| Serverseitige Filter | Grenze liegt bei ~40 Studios | mittel |
| Sammel-Dokument für Studio-Zahlen | drei Übersichten fragen je Studio einzeln | mittel |
| Kanalauswahl mit Suchfeld | ab ~25 Studios trägt die Leiste nicht mehr | klein |
| Volltextsuche über den ganzen Verlauf | heute nur der offene Kanal vollständig | ab ~20 €/Monat |
| Abo Stufe C–E (Stripe, Mahnungen) | erst nach dem Steuerberater | gross |

### Was sich hier nicht beweisen lässt

* Ob Push auf einem echten Handy ankommt.
* Ob der Server wirklich keine Erinnerung schickt, wenn eine Funktion
  abgeschaltet ist.
* Ob die Sicherheitsregel im echten Browser mit dem echten Firebase-SDK
  hält — Chromium kommt aus der Entwicklungsumgebung nicht ins Netz.
  Verstösse melden sich in der App unter Verwaltung → System.

---

## ✅ Der Umzug auf die Firmen-Pfade ist durch

Am 10. August gelaufen und am 11. abgeschlossen. Alle sieben Schritte,
die hier standen, sind erledigt — die Belege stehen in
`MANDANT-PLAN.md` und `2E-PRUEFEN.md`.

| | Schritt | |
|---|---|---|
| 1 | Auslöser auf dem neuen Pfad springt an | ✅ 10.8., 22:19 Uhr |
| 2 | Nachtsicherung geprüft | ✅ 10.8., 00:40, erfolgreich |
| 3 | Umzug der Daten | ✅ 156 Dokumente, Zählprüfung sauber |
| 4 | Regeln ausgerollt, „released" im Protokoll nachgelesen | ✅ |
| 5 | `admin: true` am Betreiber-Konto | ✅ |
| 6 | `KONFIG.mandant` auf `true`, App ausgerollt | ✅ 10.8., 23:15 Uhr |
| 7 | flache Alt-Daten aufräumen | **frühestens Mitte September** |

**Schritt 7 ist bewusst offen.** Die flachen Daten sind der Rückweg:
`mandant` zurück auf `false` und ausrollen, dann liest die App wieder
sie. Wer sie vorher wegräumt, nimmt sich diese Möglichkeit. Aufgeräumt
wird von Hand, nicht von einem Zeitplan.

## Was danach noch aufgefallen ist — alles erledigt

| Fund | |
|---|---|
| „Sperren" hat nie etwas gesperrt (Regeln und App sahen nie ins Firmendokument) | ✅ 11.8., mit Gegenprobe |
| Eine neue Firma sah die 14 Standorte von Körperformen | ✅ 11.8. |
| `konfig.js` löste keinen Deploy aus — zwei Monate lang | ✅ 11.8., plus `test-ausliefern.js` |
| `renderFirmenArchiv` stürzte an `fmtDate()` ab | ✅ 11.8., plus erster Test für den Admin-Bereich |
| Stillgelegte Firma: der Chef kam in eine leere App statt einer Meldung | ✅ 11.8. |
| Kürzel in der Google-Tabelle (Putzplan und Notizen) | ✅ 11.8., Skript neu bereitgestellt und bestätigt |
| Funktionen abschaltbar (Schichtplan, Abwesenheiten und neun weitere) | ✅ 11.8., mit Gegenprobe |
| Fehler bei Mitarbeitern blieben unbemerkt | ✅ 11.8., Verwaltung → System → 🐞 |

## Nach dem Sicherheits-Durchlauf (12. August 2026)

| Fund | Stand |
|---|---|
| Neue Konten landeten in der falschen Firma (`createEmployee`/`doRegister` ohne `firma`) | ✅ 12.8. |
| Vollsicherung von jedem Chef auslösbar — exportiert ALLE Kunden | ✅ nur noch Betreiber |
| `mailStatus` prüfte die Rolle, nicht die Firma | ✅ 12.8. |
| `users` ohne Firmenprüfung beim Lesen | ⏳ **wartet auf das Nachtragen** |
| `appointments` mit Kundennamen für alle lesbar und änderbar | ✅ bewusst so — im Studio machen alle Termine |

**Der offene Punkt:** Die strenge `users`-Regel kommt erst, wenn an jedem
Konto das Feld `firma` steht (Verwaltung → Firmen → „Konten ohne Firma").
Solange es nur einen Betrieb gibt, ist das Leck folgenlos — es muss aber
zu sein, **bevor der erste fremde Kunde dazukommt.** Damit es nicht
vergessen wird, steht es in `firestore.rules` bei `match /users`, in
`index.html` bei `listenAllUsers()` und im Kreuztest (`OFFENES_LOCH`).

## Aufräumen: abgeschlossen

Die Liste aus dem August ist abgearbeitet:

| Was | Stand |
|---|---|
| Verzeichnis sortiert, `README.md` als Einstieg | ✅ |
| Erzähl-Kommentare (Datum, Vorgeschichte, Ich-Form) | ✅ 79 → 0, auch in `tools/` und `storage.rules` |
| 467 Emoji als Symbole | ✅ ein Satz aus 24 Konturzeichen |
| Zwölf Eckenradien | ✅ eine Leiter, 179 Verwendungen |
| 52 Abstandswerte | ✅ eine Leiter, 623 Verwendungen |
| 23 Selektor-Kollisionen | ✅ 0 |

Abgesichert durch `tests/test-gestaltung.js` und
`tests/test-bewegung-doppelt.js` — beide ohne Browser, beide mit
Gegenproben, damit ein leerer Stylesheet nicht als grün durchgeht.

**Was bewusst bleibt:** rund 28 % Kommentaranteil. Was noch dasteht, wird
beim Ändern gebraucht — die Bedingung aus den Regeln, die Reihenfolge, die
nicht vertauscht werden darf, der naheliegende Weg, der nicht funktioniert.
Die Menge war nie das Ziel, die Form schon.

**Was als Nächstes anstünde**, wenn jemand weiter aufräumen will: der
`<style>`-Block ist thematisch nicht sortiert — Chat-Regeln stehen an neun
Stellen. Das ist kein Fehler und ändert nichts am Verhalten; es kostet nur
Suchzeit. Ein Umsortieren wäre eine eigene Runde mit eigenem Risiko
(Reihenfolge entscheidet bei gleicher Spezifität), und der Nutzen ist
geringer als bei allem oben.

## Aus dem Sicherheits-Durchlauf vom 13. August

Vollständig in `docs/SICHERHEIT.md`. Aus der dritten Runde (Sicherheitsregel
im Browser, Fremdbibliotheken, Nachbaranwendungen) bleiben zwei Punkte:

| Was | Wer | Aufwand |
|---|---|---|
| **Termine sind für jeden im Betrieb lesbar.** `appointments` trägt Name, E-Mail, Telefon und Notizen der Endkundinnen; lesen darf das jeder aktive Zugang, über alle Studios. Das steht so in den Regeln und war eine Entscheidung — aber es sind Daten Dritter. Einengen heisst Regel **und** Abfrage in `wachstum.html` zusammen ändern, weil Firestore Abfragen im Voraus prüft. | du entscheidest, ich baue | eine halbe Sitzung |
| **`marketing.html` und `wachstum.html` ohne eigene CSP.** Zusammen 101 Ereignisse im Attribut (`onclick="…"`) — genau das, was die Regel verbietet. Erst umstellen auf `addEventListener`, dann die Regel. Beide verlangen eine Anmeldung; die Kopfzeilen aus `firebase.json` gelten für sie mit. `werbung.html` ist seit dem 13.8. mit dabei. | ich | eine Sitzung |

**Zwei Funde aus dem Blick auf die Nachbaranwendungen sind behoben:**
Erinnerungs- und Nachfass-Mails gingen seit dem Umzug am 10.8. nicht mehr
raus (`wachstum.html` schreibt Termine flach, der Zeitplan suchte nur
noch unter `firmen/…`), und beide Nachbarseiten arbeiteten auf der
Probe-Adresse in der echten Datenbank, weil sie die Zugangsdaten fest im
Quelltext trugen. Beides in `SICHERHEIT.md`.

**Die eigentliche Aufräumarbeit steht aus:** `marketing.html` und
`wachstum.html` benutzen durchgehend die flachen Pfade, nicht
`firmen/<kennung>/…`. Bei einem Kunden ist das folgenlos. Beim zweiten
landen beide in denselben Sammlungen — und die Regeln für die flachen
Pfade fragen nur, ob jemand aktiv ist, nicht zu welcher Firma er gehört.
Dann sähe der eine Kunde die Termine des anderen, mitsamt Namen und
E-Mail-Adressen der Endkundinnen. **Das muss vor dem zweiten Kunden
erledigt sein**, zusammen mit dem Aufräumen der flachen Daten.

**Die Google-Tabelle ist umgebaut und läuft** ✅ — am 13.8. bestätigt. Der
Browser kennt die Adresse der Web-App nicht mehr; gesendet wird über die
Cloud Function `sheetsPush`.

Ob die Web-App fremde Sendungen auch wirklich abweist, hängt allein an
der Skripteigenschaft `STUDIOCHAT_TOKEN`: ist sie gesetzt, ist die
Tabelle zu; fehlt sie, nimmt die Web-App weiter alles an — wie vorher,
also kein Rückschritt. Schritt für Schritt in `docs/SHEETS-TOKEN.md`.

## Offen, weil noch niemand hingeschaut hat

- **Ob Push auf einem echten Handy ankommt.** Der Versand ist
  unveränderter Code, der seit Monaten läuft, und der Auslöser ist im
  Betrieb belegt. Aber zwischen „die Funktion lief" und „es hat
  gebrummt" liegt ein Gerät, das ich nicht habe.
- **Das Abo-Modell.** Stufe A und B stehen (Abo je Firma von Hand
  setzen, Gratis-Abo, Basic grenzt Nachweise und Monatsbericht ab).
  Stufe C bis E — Stripe, automatische Mahnungen, Selbstbedienung —
  sind geplant und bewusst nicht gebaut; siehe `ABO-PLAN.md`. Vor dem
  ersten echten Geld steht ein Gespräch mit dem Steuerberater, nicht
  Code.
- **Ob auf dem Server wirklich keine Erinnerung mehr hinausgeht**, wenn
  eine Funktion abgeschaltet ist. Der Code prüft es (`featureAn` in
  `functions/index.js`), aber im Emulator gibt es keine Empfänger — das
  Ausbleiben lässt sich dort nicht messen. Fällt frühestens auf, wenn
  jemand Aufgaben abschaltet und am nächsten Morgen um 7:30 Uhr nichts
  brummt.

**Vier rechtliche Pflichtfelder** (Betreiber, Anschrift, vertretungs-
berechtigte Person, E-Mail) sind noch leer — solange steht in der App eine
rote Warnung. Einzutragen seit dem 11.8.2026 **in der App**:
*Verwaltung → System → ⚖️ Rechtliche Angaben*, je Firma getrennt.
Der Datenschutztext gehört vor dem ersten fremden Kunden einmal über einen
Anwaltstisch; siehe `RECHT.md`.

---

## Ein Schritt offen: der Firmencode

**Verwaltung → Team → „🔑 Wer darf sich anmelden"** — Code eintragen,
Haken bei der Freigabe setzen, speichern. Zwei Minuten, in der App.

Bis dahin kann sich jeder anmelden, der die Adresse kennt, und sieht
Teamchat, Personenliste, Aufgaben und Dokumente. Für bestehende Konten
ändert sich durch die Einstellung nichts.

---

## Alles andere ist erledigt ✅

Stand 9. August 2026. Alle Handgriffe aus `DEIN-TEIL.md` sind erledigt:

| Was | Wann |
|---|---|
| Speicher in `europe-west1` angelegt | 9.8. |
| Beide Rollen fürs Dienstkonto gesetzt | 9.8. |
| Erste Sicherung durchgelaufen (`sicherung/manuell-2026-08-09-01-28-53`) | 9.8. |
| Budget-Warnung angelegt | 9.8. |
| `MATERIAL-SHEETS.gs` in Apps Script neu bereitgestellt | 9.8. |
| Wischen zum Abhaken im Putzplan am Gerät bestätigt | 9.8. |

> Dabei kam heraus, dass `formenchat` auf dem **Bezahlplan Blaze** liegt –
> anders ließen sich die Cloud Functions gar nicht bereitstellen. Die
> Annahme „keine Karte hinterlegt, also kann nichts abgebucht werden" war
> falsch; deshalb steht jetzt eine Budget-Warnung.

Was ab hier kommt, ist **Ausbau, kein Rückstand** – siehe `ROADMAP.md`.

---

## Alte Fassung dieser Liste

Die folgenden Punkte stammen aus der Zeit vor dem Audit. Sie sind
abgearbeitet und stehen hier nur noch als Verlauf.


Stand: 7. August 2026, nach der Aufräum-Runde.

Ideen: `IDEEN.md` · Weg zum Verkauf: `VERKAUF.md` · Audit-Fortschritt:
`FORTSCHRITT.md` · Was die App kann: `HANDBUCH.md`

---

## ✅ In dieser Runde erledigt

| Was | War |
|---|---|
| **Tägliche Sicherung der Datenbank** | 🔴 der schwerste offene Punkt |
| **Konfiguration an einer Stelle** (`konfig.js`) | 🟡 lag doppelt in `index.html` und `sw.js` |
| **Chef-Code aus dem Quelltext entfernt** | 🟡 stand für jeden lesbar in der Seite |
| **`firebase-functions` auf 7.x** | 🟡 Fassung 5 war veraltet |
| **Suche mit Wort statt nur Lupe** | 🟡 N7 |
| **Zuletzt offene Ansicht wiederherstellen** | 🟡 N8 |
| **Chef sieht „Wo etwas los ist"** | 🟠 H4 |

### Tägliche Sicherung

`dailyBackup` läuft nachts um 2:40 und exportiert die komplette Datenbank
in den Speicher des Projekts (`sicherung/JJJJ-MM-TT/`). Aufbewahrt werden
sieben Tage, ältere Ordner räumt derselbe Lauf weg.

Zusätzlich gibt es **Verwaltung → System → Daten sichern → „Jetzt zusätzlich
sichern"** — nur für den Chef, die Rolle wird auf dem Server geprüft.

> **Einmalig nötig:** ein Speicher im Projekt (Firebase-Konsole → Storage,
> Region `europe-west1`) und zwei Rollen für den Dienstaccount –
> **Cloud Datastore Import Export Admin** und **Storage Object Admin**.
> Fehlt eines davon, scheitert die Sicherung. Seit dem 8. August steht der
> Grund dafür in der App unter *Verwaltung → System*, nicht mehr nur im
> Protokoll von Google.

### Konfiguration

Alles Kundenspezifische steht jetzt in **`konfig.js`**: Firma, Studios,
Firebase-Zugang, Push-Schlüssel, Schalter für die Tabelle, Fristen. `index.html` lädt
sie per `<script src>`, `sw.js` per `importScripts` — dieselbe Datei für
beide. Vorher standen die Firebase-Daten an zwei Stellen; beim zweiten Kunden
wäre garantiert eine vergessen worden.

Damit ist Punkt **A1** aus `VERKAUF.md` erledigt: ein neuer Kunde heißt jetzt
*Datei kopieren, sechs Werte eintragen*.

### Chef-Code

Der Einstieg `#chef` und der Code im Quelltext sind entfallen. Der allererste
Chef-Zugang entsteht bei der Einrichtung des Projekts, jeder weitere über
*Verwaltung → Team → Zugang anlegen*.

---

## 🔵 Bei dir

| Was | Warum |
|---|---|
| **Vier Pflichtfelder** in *Verwaltung → System → ⚖️ Rechtliche Angaben* eintragen | Ohne vollständiges Impressum darf die App nicht öffentlich genutzt werden. Fünf Minuten. Solange es fehlt, warnt die App selbst. Details in `RECHT.md`. |
| **Firmencode setzen** in *Verwaltung → Team* | Solange er leer ist, kann sich jeder anmelden, der die Adresse kennt — und der Reiter „Konto anlegen" erscheint erst dann. |
| **Datenschutztext durchsehen lassen** vor dem Einsatz im Team | Krankmeldungen sind Gesundheitsdaten, die Anwesenheitsanzeige liest sich als Kontrolle, Stimme ist biometrisch. Siehe `RECHT.md`. |
| **`STUDIOCHAT_TOKEN` in den Skripteigenschaften setzen** — `docs/SHEETS-TOKEN.md` | Der Abgleich läuft (13.8. bestätigt). Ohne diese Eigenschaft nimmt die Web-App aber weiterhin Sendungen von jedem an, der ihre Adresse kennt. Zehn Minuten. |
| **Probelauf-Projekt anlegen** — `PROBELAUF-EINRICHTEN.md` | Nur für Stufe C (Umzug auf mehrere Firmen). **Nicht dringend**, wird erst gebraucht, wenn der Umzug vorbereitet wird. 20–30 Minuten, keine Kosten. |

**In der Firebase-Konsole selbst ist für die laufende App nichts offen.**
Speicher, Export-Rollen, Budget-Warnung und Blaze stehen seit dem
9. August. Das Probelauf-Projekt ist der einzige neue Punkt dort — und
der gehört zur Zukunft, nicht zum Betrieb.

~~`MATERIAL-SHEETS.gs` einfügen~~ · ~~Speicher + Export-Rollen~~ ·
~~Wischen zum Abhaken~~ · ~~Budget-Warnung~~ — alle am 9. August erledigt.

### Die verbindliche Kostenzahl steht nur bei dir

Der Lasttest rechnet mit **rund 1,32 € im Monat** für die Datenbank
(14 Studios, 57 Konten, 6 App-Starts je Person und Tag). Das ist eine
Rechnung aus gemessenen Lesevorgängen und einer Preisliste — **nicht** aus
deinem Konto. Die echte Zahl steht in der Firebase-Konsole unter
*Firestore → Nutzung*. Ein Blick dorthin nach einer normalen Arbeitswoche
sagt mehr als jede Schätzung von hier.

---

## 🟡 Noch offen

### E-Mail-Absender auf die eigene Domain

Läuft über Gmail. Für den Monatsbericht in Ordnung; für **Termin-Mails an
Kunden** vor dem echten Einsatz wechseln — eine Bestätigung von einer
gmail-Adresse wirkt nicht wie ein Unternehmen mit 14 Studios und landet öfter
im Spam. Nur fünf Werte in den GitHub-Secrets, siehe `MAIL-SETUP.md`. **Am
Code ändert sich nichts.**

### Google-Tabelle: Formatieren vom Schreiben trennen

Entschärft (ein `setValues()` statt hunderter `deleteRow()`, alle Studios in
einer Sendung), aber jede Sendung formatiert weiterhin das ganze Blatt neu.
Bei deutlich größeren Tabellen wäre der nächste Schritt, das Formatieren nur
noch bei Bedarf laufen zu lassen.

### Suche über alle Studios

Putzplan-Notizen, Abwesenheiten und Übergaben findet die Suche nur im gerade
geöffneten Studio. **Das ist Absicht** — alle 14 Studios dauerhaft
mitzuladen würde die Datenbank-Zugriffe vervielfachen. Falls nötig: als
eigene Suche bauen, die nur auf Knopfdruck lädt.

### Mehrere Firmen in einer App (4. Ebene: Admin)

**Vollständig geplant, nichts gebaut** — siehe `MANDANT-PLAN.md`. Vier
Ebenen: Mitarbeiter, Studio-Leiter, Chef (benennt seine Studios selbst),
Admin über allen Firmen. Der Admin sieht Verwaltung, keine Inhalte.

Aufwand nach Stufen: Studios in die Datenbank ~1 Sitzung ohne Risiko ·
Firmen-Trennung ~2–3 Sitzungen **mit Eingriff in Live-Daten** ·
Admin-Oberfläche ~1 Sitzung.

Mein Vorschlag: **Stufe 1 jetzt** (nützt sofort, auch ohne zweiten Kunden),
Stufe 2 und 3 erst, wenn ein Kunde konkret ist.

Das frühere Kostenargument aus `VERKAUF.md` gilt nicht mehr — das
Freikontingent ist nachgerechnet nur 0,83 € je Kunde und Monat wert.

### KI-Funktionen

Siehe `KI-PLAN.md`. Technisch vorbereitet, bewusst nicht gebaut. Der
Knackpunkt ist der Datenschutz, nicht die Technik.

---

## Kleinigkeiten

- **Alle Ansichten stehen dauerhaft im HTML.** Schnell beim Umschalten, aber
  bei deutlich mehr Ansichten wird die Datei unhandlich. Kein Problem bei
  zwölf.
- **Startseiten-Zahlen** werden über alle Studios im Speicher gerechnet. Bei
  100 Studios neu zu denken.
