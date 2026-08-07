# Stand der Dinge

Stand: 7. August 2026. Vier Listen: **was offen ist**, **wo noch Fehler
stecken**, **was besser werden sollte** und **was dazukommen könnte**.

Ideen ausführlich mit Aufwand und Gegenargumenten: `IDEEN.md`.
Weg zum Verkauf: `VERKAUF.md`.

---

# 1 · Offen

## 🔵 Zwei Entscheidungen liegen bei dir

Beide blockieren Arbeit, die sonst fertig gebaut werden könnte:

| Was | Die Frage |
|---|---|
| **Schichttausch** | Muss die Leitung einen Tausch *bestätigen*, oder gilt er, sobald zwei sich einig sind? |
| **Zertifikate** (Erste Hilfe, Trainerlizenz, EMS-Einweisung) | Wer darf die Ablaufdaten sehen — nur die Person und der Chef, oder auch die Studio-Leitung? |

Mein Vorschlag: Leitung bestätigt (sonst steht im Plan, was niemand
verantwortet), und Zertifikate nur Person + Chef (Qualifikationsdaten sind
heikler als Putzpläne).

## ✅ Erledigt seit dem letzten Stand

- **Node.js 22** (Frist war 30.10.2026) — am 6. August umgestellt, alle 16
  Functions *aktualisiert*, nicht neu angelegt. Kein Ausfall, alle geplanten
  Läufe mit umgezogen.
- **Test-Chef-Konten** entfernt, zwei echte bleiben.
- **Sicherheitslücke Selbstregistrierung**: wer die Seite ansah, konnte sich
  per Chef-Code Vollzugriff auf alle 14 Studios geben. Die Regeln lassen jetzt
  nur noch `mitarbeiter` zu.

## 🏢 Mehrere Firmen in einer App

Nur nötig, wenn StudioChat wirklich verkauft wird — **und selbst dann erst
ab dem fünften oder sechsten Kunden.** Siehe `VERKAUF.md`: bis dahin ist ein
Firebase-Projekt je Kunde günstiger und schneller.

## 🤖 KI-Funktionen

Siehe `KI-PLAN.md`. Technisch vorbereitet, bewusst nicht gebaut. **Der
Knackpunkt ist der Datenschutz, nicht die Technik** — Stimmen und
Leistungsdaten an einen Dritten zu geben ist einwilligungs- und
mitbestimmungsrelevant.

## 🔍 Suche über alle Studios

Putzplan-Notizen, Abwesenheiten und Übergaben findet die Suche nur im gerade
geöffneten Studio.

**Das ist Absicht.** Alle 14 Studios dauerhaft mitzuladen würde die
Datenbank-Zugriffe vervielfachen — genau der Fehler, der bei der
Online-Anzeige schon einmal beinahe über das kostenlose Kontingent gegangen
wäre. Falls es gebraucht wird: als eigene Suche bauen, die nur auf
Knopfdruck lädt.

---

# 2 · Wo noch Fehler stecken

Ehrlich sortiert: das Erste ist ein echter Mangel, der Rest ist Kleinkram.

## 🟠 Google-Tabelle: Abgleich aller Studios kann an ein Limit stoßen

`syncAllPutzplanToSheets()` schickt 14 Studios nacheinander an das
Apps-Script. **Jede einzelne Sendung formatiert das komplette Blatt neu** —
Sortieren, Hintergründe, Rahmen, Spaltenbreiten. Bei 14 Sendungen
hintereinander sind das 14 volle Durchläufe.

Apps Script erlaubt 6 Minuten je Ausführung und rund 90 Minuten Laufzeit am
Tag. Heute reicht das. Wächst die Tabelle, oder melden sich mehrere Chefs
kurz hintereinander an (der Abgleich läuft 9 Sekunden nach jeder Anmeldung),
wird es eng — und dann fehlen einzelne Studios in der Tabelle, ohne dass es
irgendwo eine Fehlermeldung gibt.

**Zu tun:** entweder alle 14 Studios in *einer* Sendung übertragen und einmal
formatieren, oder das Formatieren vom Schreiben trennen. Beides ändert nur
`MATERIAL-SHEETS.gs` — die Datei muss man aber von Hand in Apps Script
einfügen, deshalb steht sie hier und ist nicht schon erledigt.

## 🟡 Wischen zum Abhaken ist nie auf einem echten Gerät geprüft worden

Berührungen lassen sich in der Testumgebung nicht nachstellen. Der Aufbau
stimmt, aber ob es sich gut anfühlt — und ob es nicht versehentlich beim
Scrollen auslöst — zeigt erst der Alltag. **Bitte einmal ausprobieren und
Bescheid sagen.**

## 🟡 Der Chef-Code steht im Quelltext der Seite

`CHEF_PIN` kann jeder lesen, der die Seite ansieht.

**Gefährlich ist das nicht mehr** — die Sicherheitsregeln lassen
Selbstregistrierung seit dem 6. August nur noch als `mitarbeiter` zu, egal
was der Code sagt. Es ist unsauber, nicht unsicher. Der saubere Weg sind
Einladungen statt Code (siehe `VERKAUF.md`, A2).

## 🟢 Kleinkram

- **Auto-Test kann Ausfall als Erfolg melden.** Ohne `NODE_PATH` bricht jeder
  Durchlauf ab, und weil dann keine Zeile `Fehler:` erscheint, sah die alte
  Schleife das als „alles gut". In `tests/README.md` korrigiert — die Falle
  ist beschrieben, damit sie niemanden noch einmal erwischt.
- **Papierkorb-Zähler** zeigt höchstens 100 Einträge (Grenze des Listeners).
  „Leeren" löscht entsprechend auch nur diese; die Meldung sagt das jetzt.

---

# 3 · Was besser werden sollte

## 🔴 Es gibt keine automatische Sicherung der Datenbank

Der wichtigste Punkt dieser ganzen Datei.

Was es gibt: die Wochen-Sicherung von Material und Putzplan im Archiv, die
Excel-Exporte und den 30-Tage-Papierkorb. Was es *nicht* gibt: eine Kopie,
aus der sich nach einem versehentlichen Löschen alles wiederherstellen ließe.

Bei eigenen Daten ist das ein Risiko, das man eingehen kann. Bei Kundendaten
nicht. Ein täglicher Export kostet wenige Cent im Monat — siehe `VERKAUF.md`,
B4.

## 🟠 Budget-Warnung bei Firebase setzen

Da Cloud Functions laufen, ist das Projekt im Blaze-Tarif. Das heißt nicht
„kostenpflichtig", sondern „nutzungsabhängig" — das kostenlose Kontingent
gilt weiter, und der Verbrauch liegt deutlich darunter.

Trotzdem: **ein Budget-Limit mit Warnmail kostet nichts** und fängt den Fall
ab, dass ein Fehler einmal eine Abfrageschleife baut. Fünf Minuten in der
Firebase-Konsole.

## 🟡 E-Mail-Absender auf die eigene Domain

Läuft über Gmail. Für den Monatsbericht an den eigenen Chef in Ordnung. Für
die **Termin-Mails an Kunden** vor dem echten Einsatz wechseln: eine
Terminbestätigung von einer gmail-Adresse wirkt nicht wie ein Unternehmen mit
14 Studios und landet öfter im Spam.

Nur fünf Werte in den GitHub-Secrets, siehe `MAIL-SETUP.md`. **Am Code ändert
sich nichts.**

## 🟡 `firebase-functions` ist veraltet

Beim Deploy erscheint der Hinweis, dass Fassung ^5.0.0 veraltet ist. **Kein
Ablaufdatum, nur ein Hinweis.** Bewusst nicht zusammen mit dem Node-Wechsel
geändert — bei zwei Änderungen auf einmal wäre bei einem Fehler nicht zu
erkennen gewesen, woran es lag. Kann in Ruhe nachgezogen werden; die neue
Fassung bringt laut Hinweis Änderungen mit sich, die geprüft werden müssen.

## 🟢 Konfiguration liegt an zu vielen Stellen

Der Firebase-Zugang steht in `index.html` **und** in `sw.js`. Solange es nur
um Körperformen geht, ist das egal. Beim zweiten Kunden wird garantiert eine
der beiden Stellen vergessen. Siehe `VERKAUF.md`, A1 — der Punkt, den ich
zuerst angehen würde.

---

# 4 · Was dazukommen könnte

Kurzfassung. Ausführlich mit Aufwand und Gegenargumenten in `IDEEN.md`.

## Zuerst

| | | |
|---|---|---|
| **Schichttausch mit Bestätigung** | läuft heute über WhatsApp, im Dienstplan steht danach die falsche Person | *Frage offen* |
| **Zertifikate mit Ablaufdatum** | fällt heute auf, wenn es zu spät ist | *Frage offen* |

## Danach — klein, aber nützlich

- **Wiedervorlage für einen selbst** — „erinnere mich Montag daran"
- **Notfall-Nachricht mit Empfangsbestätigung** — bleibt oben, bis jede
  Person bestätigt hat; der Chef sieht, wer fehlt. Genau *ein* Kanal dafür,
  sonst nutzt es sich ab
- **Dienstplan als Kalender abonnieren** (`.ics`) — Schichten landen im
  Handy-Kalender. Achtung: so eine Adresse ist ein Passwort
- **Foto-Nachweis beim Putzplan** — wie bei den Geräten

## Größer, braucht Vorlauf

- **Zeiterfassung (Kommen/Gehen)** — der größte Nutzen von allem, und mit
  Abstand der heikelste Punkt. Wird zum Nachweisdokument: fälschungssicher,
  nachvollziehbar korrigierbar, mitbestimmungspflichtig. Erst mit
  Steuerberater klären, dann bauen
- **Kennzahlen je Studio** — der Knackpunkt ist nicht die Anzeige, sondern
  woher die Zahlen kommen. Von Hand einträgt das niemand durch
- **Offline weiterarbeiten** — im Keller mancher Studios ist kein Empfang.
  Groß, zieht sich durch die ganze App, lohnt erst wenn es wirklich stört

## Was ich bewusst *nicht* vorschlage

- **Noch mehr Statistik im Chef-Bereich.** Mehr Zahlen heißt nicht mehr
  Überblick — eher weniger.
- **Ranglisten zwischen Mitarbeitern.** Klingt nach Motivation, wirkt im
  Alltag als Druck. Zwischen *Studios* zu vergleichen ist etwas anderes.
