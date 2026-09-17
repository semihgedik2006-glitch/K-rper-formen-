# StudioChat — wo was steht

**Stand:** 17. September 2026

Die Unterlagen sind über die Jahre gewachsen und heißen deutsch, weil
alles in diesem Projekt deutsch ist. Dieses Verzeichnis sagt, welche
Datei welche Frage beantwortet — und was es **nicht** gibt.

---

## Für den Einstieg

| Ich will … | Datei |
|---|---|
| das Projekt überhaupt verstehen | `README.md` |
| wissen, wie es technisch gebaut ist | `docs/ARCHITEKTUR.md` |
| wissen, **was die App kann** | `docs/FUNKTIONEN.md` |
| die App **benutzen** | `docs/HANDBUCH.md` · PDF: `docs/StudioChat-Handbuch.pdf` |

---

## Nach Thema

### Technik

| Frage | Datei |
|---|---|
| Architektur, Datenflüsse, Abhängigkeiten, technische Schulden | `ARCHITEKTUR.md` |
| Sammlungen, Felder, Regeln, Indexe, Sicherung | `DATENBANK.md` |
| Vollständige Funktionsliste mit Prüfstatus | `FUNKTIONEN.md` |
| Wie geprüft wird, und was **nicht** geprüft wird | `PRUEFPLAN.md` |
| Bekannte Probleme, Schweregrade, behobene Funde | `BEKANNTE-PROBLEME.md` |
| Ausliefern, Deploy, Rollback | `DEPLOY.md` |
| Gestaltungsregeln, Farbleitern, Abstände | `DESIGN-SYSTEM.md` |
| Sicherheitsbefunde und ihre Behebung — **einschließlich der Fehler** | `SICHERHEIT.md` |
| Mehrere Firmen in einer Datenbank | `MANDANT-PLAN.md` |

### Geschäft

| Frage | Datei |
|---|---|
| Abo-Modell, Preise, Mahnstufen, Entscheidungen | `ABO-PLAN.md` |
| **Kasse einrichten, Schritt für Schritt (Mac)** | `KASSE.md` |
| Verkaufsargumente, was noch fehlt | `VERKAUF.md` · `PITCH.md` |
| Zeiterfassung: Plan und offene Schritte | `ZEITERFASSUNG-PLAN.md` |

### Recht und Datenschutz

| Frage | Datei |
|---|---|
| Was die App mit Daten tut · Abgleich mit dem Rechts-Entwurf | `RECHT.md` |
| Auftragsverarbeitungsvertrag (Entwurf) | `av/AV-VERTRAG-ENTWURF.md` |
| Technische und organisatorische Maßnahmen | `av/TOM.md` |
| Unterauftragnehmer | `av/UNTERAUFTRAGNEHMER.md` |
| Löschkonzept | `av/LOESCHKONZEPT.md` |
| Verzeichnis von Verarbeitungstätigkeiten (Art. 30 Abs. 2) | `av/VERARBEITUNGSVERZEICHNIS.md` |
| Wo man anfängt | `av/README.md` |

### Verlauf

| Frage | Datei |
|---|---|
| **Was wann warum geändert wurde** — 90 Runden | `FORTSCHRITT.md` |
| Was noch offen ist | `OFFEN.md` |
| Was du selbst tun musst | `DEIN-TEIL.md` |
| Ideen, noch nicht entschieden | `IDEEN.md` · `ROADMAP.md` · `DESIGN-IDEEN.md` · `KI-PLAN.md` |

### Einrichtung und Betrieb

| Frage | Datei |
|---|---|
| Mailversand einrichten | `MAIL-SETUP.md` |
| Google-Tabelle anbinden | `SHEETS-TOKEN.md` |
| Probelauf einrichten | `PROBELAUF-EINRICHTEN.md` · `PROBELAUF-DATEN.md` |
| Kurzanleitungen für den Betrieb | `ANLEITUNG.txt` · `ANLEITUNG-MARKETING.txt` |

---

## Wo die üblichen Dateinamen zu finden sind

Wer nach der englischen Standardstruktur sucht: sie existiert hier unter
deutschen Namen. Die Zuordnung:

| Üblich | Hier |
|---|---|
| `ARCHITECTURE.md` | `ARCHITEKTUR.md` |
| `FEATURES.md` | `FUNKTIONEN.md` |
| `PAGES.md` | `FUNKTIONEN.md`, Abschnitt 4 |
| `AUTHENTICATION.md` | `FUNKTIONEN.md`, Abschnitt 3 |
| `USERS.md` | `FUNKTIONEN.md`, Abschnitte 2 und 12 |
| `CHAT.md` | `FUNKTIONEN.md`, Abschnitt 5 |
| `DATABASE.md` | `DATENBANK.md` |
| `FIREBASE.md` | `ARCHITEKTUR.md`, Abschnitt 2 · `DATENBANK.md` |
| `API.md` | `ARCHITEKTUR.md`, Abschnitt 6 |
| `SECURITY.md` | `SICHERHEIT.md` · `av/TOM.md` |
| `UX_UI.md` | `DESIGN-SYSTEM.md` |
| `WORKFLOWS.md` | `HANDBUCH.md` (aus Sicht des Benutzers) · `ARCHITEKTUR.md`, Abschnitt 5 (technisch) |
| `TESTING.md` | `PRUEFPLAN.md` |
| `KNOWN_ISSUES.md` | `BEKANNTE-PROBLEME.md` |
| `TECHNICAL_DEBT.md` | `ARCHITEKTUR.md`, Abschnitt 11 |
| `CHANGELOG.md` / `VERSION_HISTORY.md` | `FORTSCHRITT.md` |
| `TROUBLESHOOTING.md` | `KASSE.md` (Kasse) · `DEPLOY.md` (Auslieferung) |
| `CUSTOMER_MANUAL.md` | `HANDBUCH.md` |

**Warum keine zweite Fassung unter den englischen Namen:** zwei
Dokumente über dieselbe Sache driften auseinander, und man merkt es
erst, wenn eines falsch ist. Ein Verweis ist billiger als eine Kopie.

---

## Was es bewusst NICHT gibt

| | Warum |
|---|---|
| **Versionsnummern** | Es gibt keine. Die App wird fortlaufend ausgeliefert; der Stand ist der letzte Commit auf `main`. `FORTSCHRITT.md` zählt Runden, keine Versionen. **Eine Versionsnummer zu erfinden wäre eine Zusage über etwas, das es nicht gibt.** |
| **Eine Lizenzdatei** | offen, siehe `BEKANNTE-PROBLEME.md`, P-04 |
| **API-Dokumentation im OpenAPI-Sinn** | Es gibt keine öffentliche API. Die 59 Cloud Functions sind interne Endpunkte; sie stehen in `ARCHITEKTUR.md` |
| **Eine Komponentenbibliothek** | Es gibt keine Komponenten — `index.html` ist eine Datei |

---

## Was ich beim Erstellen dieser Übersicht gefunden habe

Zwei Dinge, die vorher niemandem aufgefallen sind — beide stehen
ausführlich in `BEKANNTE-PROBLEME.md`:

1. **Die Studiogrenze ist beim Lesen keine technische Grenze** (P-01).
   Betrifft unter anderem Krankmeldungen.
2. **Der Stripe-Haken las Felder, die es nicht mehr gibt** (B-01).
   Behoben am 17.9., mit 32 Zusicherungen festgehalten.

Beide sind beim **Schreiben der Dokumentation** aufgefallen, nicht beim
Programmieren. Das ist kein Zufall: wer eine Zusage aufschreiben muss,
prüft sie.
