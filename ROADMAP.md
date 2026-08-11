# StudioChat – Roadmap

Stand 9. August 2026. Was als Nächstes kommt, in der Reihenfolge, in der es
sich lohnt – und was es kostet.

Die zehn Bereiche des Master-Audits sind durch. Alles hier ist **Ausbau**,
nichts davon ist nötig, damit die App im Alltag funktioniert.

---

## Phase 0 — erledigt ✅

Am 9. August abgeschlossen: Speicher in `europe-west1`, beide Rollen fürs
Dienstkonto, erste Sicherung durchgelaufen, Budget-Warnung, `MATERIAL-SHEETS.gs`
neu bereitgestellt, Wischen im Putzplan am Gerät bestätigt. Belege in
`DEIN-TEIL.md`.

> Dabei kam heraus, was vorher niemandem klar war: **das Projekt liegt auf
> dem Bezahlplan Blaze.** Anders ließen sich die 20 Cloud Functions gar nicht
> bereitstellen. Der Verbrauch bleibt im Freikontingent, der Speicher kostet
> Cent-Beträge. Budget-Warnung steht (0 €, meldet beim ersten Cent).

**Ab hier ist alles Ausbau.** Nichts davon ist nötig, damit die App im
Alltag funktioniert.

---

## Phase 1 — Bevor ein zweiter Kunde kommt

Alles kostenlos, alles ohne neue Abhängigkeit.

| # | Was | Warum | Aufwand |
|---|---|---|---|
| 1.1 | **Eigene Absenderadresse für E-Mails** | Berichte kommen von einer Gmail-Adresse; bei einem fremden Kunden wirkt das nicht wie ein Produkt | klein, aber Domain nötig |
| 1.2 | **Einrichtungs-Assistent beim ersten Start** | heute wird `konfig.js` von Hand bearbeitet. Ein geführter Ablauf (Firma, Studios, Firebase-Daten) macht aus „ich richte das ein" ein „der Kunde richtet das ein" | mittel |
| ~~1.4~~ | ~~**Fehlerbericht bei Abstürzen**~~ | ✅ **11.8.2026 erledigt.** Verwaltung → System → 🐞 Fehler im Betrieb. Gleiche Fehler werden gezählt, Rauschen und Netzfehler bleiben draussen, melden darf jeder und lesen nur der Chef | – |
| ~~1.5~~ | ~~**Die Datei-Sicherung im Browser vervollständigen**~~ | ✅ **11.8.2026 erledigt.** Jetzt sind Chat, Putzplan mit Kürzeln, Geräte mit Verlauf, Schichten, Abwesenheiten, Übergaben, Brett, Dokument-Angaben und Nachweise dabei. Was fehlt (Direktnachrichten, Dateiinhalte), steht in der Datei selbst | – |

---

## Phase 2 — Wenn die App wachsen soll

Ab hier wird es an einzelnen Stellen kostenpflichtig. Jede Position nennt
den Preis.

| # | Was | Warum | Kosten |
|---|---|---|---|
| 2.1 | **Echter Dateispeicher statt Datenbank** | hebt die 0,7-MB-Grenze für Dokumente auf | Firebase Storage, ab ~0,03 €/GB/Monat |
| 2.2 | **Serverseitige Filter statt „alles im Speicher"** | die Grenze liegt bei etwa 40 Studios oder einigen hundert Aufgaben je Studio | Entwicklungsaufwand, keine laufenden Kosten |
| 2.3 | **Sammel-Dokument für Studio-Zahlen** | die drei Übersichten („wo etwas los ist", „wo etwas defekt ist", „wartet auf dich") fragen heute je Studio einzeln ab | Entwicklungsaufwand |
| 2.4 | **Volltextsuche über den ganzen Verlauf** | heute findet die Suche den offenen Kanal vollständig und das Neueste der anderen | Suchdienst, ab ~20 €/Monat |
| 2.5 | **Kanalauswahl mit Suchfeld** | ab etwa 25 Studios trägt die waagerechte Leiste nicht mehr | klein |

---

## Phase 3 — Mehrere Kunden in einer App · weitgehend erledigt ✅

> Diese Phase stand hier bis zum 11. August 2026 als ferne Zukunft, mit
> der Warnung „erst ab dem fünften bis sechsten Kunden". Gekommen ist es
> anders: der Umzug lief am 10. August, seit dem 11. arbeitet der
> Betrieb auf den Firmen-Pfaden. Die Warnung war trotzdem richtig — es
> war ein Umbau, kein Ausbau, und er hat mehrere Sitzungen gekostet.

| # | Was | Stand |
|---|---|---|
| 3.1 | **Mandantenfähigkeit** | ✅ 10./11.8. — 156 Dokumente umgezogen, `mandant: true` live, jede Abfrage, jede Regel und jede Cloud Function auf Firmen-Pfaden. Belege in `MANDANT-PLAN.md` und `2E-PRUEFEN.md` |
| 3.2 | **Abrechnung** | 🟡 halb. Abo je Firma von Hand setzen samt Gratis-Abo steht (Stufe A und B). Stripe, automatische Mahnungen und Selbstbedienung sind geplant und bewusst nicht gebaut — siehe `ABO-PLAN.md` |
| 3.3 | **Verwaltungsoberfläche** | ✅ 11.8. — Firmen anlegen, sperren, löschen mit Archiv, zurückholen, Zahlen, Abo setzen |

**Was von der Warnung bleibt:** ein neuer Kunde bekommt weiterhin eine
eigene Firmen-Kennung in derselben Datenbank, nicht ein eigenes Projekt.
Der Rückweg auf die flachen Pfade steht noch — die Alt-Daten werden
frühestens Mitte September aufgeräumt, siehe `OFFEN.md`.

---

## Was bewusst nicht auf der Roadmap steht

| Idee | Warum nicht |
|---|---|
| Native App im App Store | Die PWA leistet dasselbe. Ein Store-Eintrag heißt: Konten, Gebühren, Prüfverfahren, zwei zusätzliche Fassungen zu pflegen |
| KI-Auswertung der Chats | Datenschutz zuerst, und die Fragen eines Studios lassen sich rechnen |
| Zeiterfassung | Steht im Handbuch unter „was die App bewusst nicht tut". Das ist ein Versprechen an die Mitarbeiter |
| Kundenverwaltung / Termine | Dafür haben die Studios ihr Kassensystem. Zwei Systeme mit denselben Daten laufen auseinander |
| Freie Rollen und Rechte | Drei Rollen kann man erklären. Ein Rechte-Baukasten muss gepflegt werden |

---

## Reihenfolge, wenn Zeit knapp ist

1. **1.1 eigene Absenderadresse** – die einzige Stelle, an der die App
   heute noch nach Bastelei aussieht.
2. **1.2 Einrichtungs-Assistent** – macht aus einem Projekt ein Produkt.
3. Alles andere nach Bedarf.
