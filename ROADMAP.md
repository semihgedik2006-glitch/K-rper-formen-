# StudioChat – Roadmap

Stand 8. August 2026. Was als Nächstes kommt, in der Reihenfolge, in der es
sich lohnt – und was es kostet.

Die zehn Bereiche des Master-Audits sind durch. Alles hier ist **Ausbau**,
nichts davon ist nötig, damit die App im Alltag funktioniert.

---

## Phase 0 — Was jetzt sofort ansteht (du)

Zwei Handgriffe, beide einmalig. Anleitung in `DEIN-TEIL.md`.

| Was | Warum | Dauer |
|---|---|---|
| `MATERIAL-SHEETS.gs` in Apps Script einfügen | die Google-Tabelle läuft sonst mit der alten, langsamen Fassung | 5 Min |
| Speicher in `europe-west1` anlegen, dann die zwei Rollen setzen | ohne Speicher gibt es keinen Ort für die nächtliche Sicherung – sie läuft seit dem Einbau ins Leere | 10 Min |

> Dabei kommt heraus, was vorher niemandem klar war: **das Projekt liegt auf
> dem Bezahlplan Blaze.** Anders ließen sich die 20 Cloud Functions gar nicht
> bereitstellen. Der Verbrauch bleibt im Freikontingent, der Speicher kostet
> Cent-Beträge – aber eine Budget-Warnung ist ab jetzt sinnvoll.

---

## Phase 1 — Bevor ein zweiter Kunde kommt

Alles kostenlos, alles ohne neue Abhängigkeit.

| # | Was | Warum | Aufwand |
|---|---|---|---|
| 1.1 | **Eigene Absenderadresse für E-Mails** | Berichte kommen von einer Gmail-Adresse; bei einem fremden Kunden wirkt das nicht wie ein Produkt | klein, aber Domain nötig |
| 1.2 | **Einrichtungs-Assistent beim ersten Start** | heute wird `konfig.js` von Hand bearbeitet. Ein geführter Ablauf (Firma, Studios, Firebase-Daten) macht aus „ich richte das ein" ein „der Kunde richtet das ein" | mittel |
| 1.3 | **Wischen zum Abhaken auch im Putzplan prüfen** | funktioniert bei Aufgaben bestätigt; im Putzplan nur im Code gleich, nie am Gerät geprüft | klein |
| 1.4 | **Fehlerbericht bei Abstürzen** | heute merkt niemand, wenn bei einem Mitarbeiter etwas nicht lädt | klein |
| 1.5 | **Die Datei-Sicherung im Browser vervollständigen** | „Alles als Daten-Datei" umfasst heute Aufgaben, Material, Team und Infos – nicht Chat, Geräte, Schichten, Abwesenheiten, Dokumente, Nachweise. Als zweites Standbein neben der nächtlichen Sicherung wäre das ehrlicher | mittel |

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

## Phase 3 — Mehrere Kunden in einer App

Erst ab dem fünften bis sechsten Kunden sinnvoll. Vorher ist ein eigenes
Firebase-Projekt je Kunde einfacher, sicherer und billiger.

| # | Was | Warum |
|---|---|---|
| 3.1 | **Mandantenfähigkeit** | eine Datenbank für alle Kunden, getrennt über eine Firmen-Kennung. Betrifft jede Abfrage und jede Sicherheitsregel |
| 3.2 | **Abrechnung** | Pläne, Rechnungen, Zahlungsanbieter |
| 3.3 | **Verwaltungsoberfläche für dich** | Kunden anlegen, Kontingente sehen |

**Warnung:** Phase 3 ist kein Ausbau, sondern ein Umbau. Wer sie zu früh
beginnt, verlangsamt jede weitere Änderung. Bis dahin gilt: **ein Kunde =
ein Firebase-Projekt = eine `konfig.js`.**

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

1. **Phase 0** – zwei Handgriffe, sonst laufen Sicherung und Tabelle nicht
   richtig.
2. **1.1 eigene Absenderadresse** – die einzige Stelle, an der die App
   heute noch nach Bastelei aussieht.
3. **1.2 Einrichtungs-Assistent** – macht aus einem Projekt ein Produkt.
4. Alles andere nach Bedarf.
