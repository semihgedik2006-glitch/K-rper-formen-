# Was noch offen ist

Stand 11. August 2026.

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

## Aufräumen: was noch aussteht

Erledigt: Verzeichnis sortiert, `README.md` steht, `konfig.js`,
`firestore.rules`, `functions/index.js`, `firebase.json`, `sw.js` und der
Deploy-Workflow sind durchgegangen. Emoji und Eckenradien sind weg
beziehungsweise auf einer Leiter, beides mit `tests/test-gestaltung.js`
abgesichert.

Offen:

| Was | Umfang | Warum es zählt |
|---|---|---|
| **Kommentare in `index.html`** | 645 Blöcke | Der grösste verbliebene Posten. Rund ein Drittel der Datei ist Fliesstext. Die Aufsätze über 800 Zeichen sind weg, die mittellangen nicht. |
| **Kommentare in `tests/*.js`** | 142 KB | Jeder Durchlauf beginnt mit „WARUM ES DIESEN DURCHLAUF GIBT". |
| **25 echte Selektor-Kollisionen** | von 1.182 Selektoren | Dieselbe Eigenschaft zweimal für denselben Selektor, z. B. `transition` bei `.todo`. Zum Teil Absicht (der Bewegungs-Abschnitt überschreibt bewusst), zum Teil nicht — jede Stelle muss einzeln angesehen werden. |
| **Abstände** | noch nicht gemessen | Nach Farben, Symbolen und Rundungen der letzte Bereich ohne Leiter. |

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
Firebase-Zugang, Push-Schlüssel, Tabellen-Adresse, Fristen. `index.html` lädt
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
| **„Google-Tabellen abgleichen"** einmal drücken und prüfen, ob alle 14 Studios erscheinen | Lässt sich hier nicht nachstellen, weil der Abgleich auf ein echtes Tabellenblatt schreibt. |
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
