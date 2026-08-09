# Was noch offen ist

Stand 8. August 2026, nach Abschluss des Master-Audits.

## Es ist nichts mehr offen. ✅

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
| **`MATERIAL-SHEETS.gs`** in Apps Script einfügen und neu bereitstellen | Die Datei im Projekt ist neu; ohne den Schritt läuft die alte Fassung weiter. Anleitung steht oben in der Datei. |
| **Speicher anlegen und Export-Rollen** setzen | Sonst schlägt die nächtliche Sicherung fehl (siehe oben). |
| **Wischen zum Abhaken** einmal am Gerät prüfen | Berührungen lassen sich hier nicht nachstellen. |

Budget-Warnung bei Firebase: **doch nötig.** Die Annahme „keine Karte
hinterlegt, also kann nichts abgebucht werden" hat sich nicht gehalten –
das Projekt läuft auf Blaze, sonst gäbe es keine Cloud Functions. Der
Verbrauch bleibt im Freikontingent, aber gewarnt wird von allein niemand.
Fünf Minuten: Cloud-Konsole → Abrechnung → Budgets, 5 € mit Warnung bei
50 % und 100 %.

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

### Mehrere Firmen in einer App

Erst ab dem fünften oder sechsten Kunden. Bis dahin ist ein Firebase-Projekt
je Kunde günstiger und schneller — siehe `VERKAUF.md`.

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
