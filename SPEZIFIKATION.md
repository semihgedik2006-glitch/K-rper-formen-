# StudioChat – Spezifikation

Stand 8. August 2026. Was das Produkt ist, für wen, und nach welchen Regeln
es gebaut ist. Wer die App weiterentwickelt oder verkauft, sollte dieses
Dokument gelesen haben.

---

## 1. Was es ist

**StudioChat ist das interne Betriebssystem einer Studiokette.** Nicht ein
Messenger mit Zusatzfunktionen, sondern ein Werkzeug, das die immer gleichen
Fragen eines Betreibers mit mehreren Standorten beantwortet:

> *Wo bleibt gerade etwas liegen? Was ist kaputt? Wer wartet auf mich?*

Alles andere – Chat, Dateien, Schichtplan – ist Mittel zum Zweck.

**Erster Kunde:** Körperformen, 14 EMS-Studios im Raum Köln/Bonn.

### Der Unterschied zu WhatsApp

Die ehrliche Konkurrenz ist keine Software, sondern eine WhatsApp-Gruppe.
Was die nicht kann:

| | WhatsApp-Gruppe | StudioChat |
|---|---|---|
| Aufgaben mit Frist und Nachweis | – | ✅ |
| Wiederkehrende Aufgaben (Putzplan) | – | ✅ |
| Materialbestand, Einkaufsliste, Bestellmail | – | ✅ |
| Gerätehistorie („3× defekt in 90 Tagen") | – | ✅ |
| Schichttausch mit Freigabe | – | ✅ |
| Urlaubsantrag über alle Standorte | – | ✅ |
| Ablaufende Nachweise (Erste Hilfe, Lizenzen) | – | ✅ |
| Ausgeschiedene Mitarbeiter lesen nicht mit | – | ✅ |
| „Wo bleibt etwas liegen?" | – | ✅ |

Umgekehrt kann WhatsApp eines besser: **jeder hat es schon.** Deshalb muss
StudioChat sich beim Chat an WhatsApp messen lassen – ein Chat, der sich
schlechter anfühlt, kostet die ganze Einführung.

---

## 2. Rollen

Drei Rollen, kein Rechte-Baukasten. Mehr Rollen hieße: jemand muss sie
pflegen.

| Rolle | Sieht | Darf zusätzlich |
|---|---|---|
| **Mitarbeiter** | seine Studios | abhaken, melden, eintragen, schreiben |
| **Studio-Leiter** | seine Studios | Aufgaben erteilen, Schichten planen, Urlaub genehmigen, Geräte pflegen |
| **Chef** | alles | Zugänge und Rollen vergeben, Nachweise führen, System |

**Grundsätze, die nicht verhandelbar sind:**

- Selbstregistrierung ergibt **immer** die Rolle Mitarbeiter.
- Niemand ändert seine eigene Rolle oder Studio-Zuordnung.
- Niemand genehmigt sich selbst Urlaub.
- Nachweise sehen nur die betroffene Person und der Chef – die
  Studio-Leitung ausdrücklich nicht.
- Direktnachrichten liest niemand außer den zwei Beteiligten, auch der Chef
  nicht.

---

## 3. Datenmodell

Firestore, Region `europe-west1` (Belgien).

```
studios/{studioKey}/          studioKey = "studio-" + Listenplatz
  todos/                      Aufgaben (auch aus Geräte-Meldungen)
  cleaning/                   Putzplan-Aufgaben
  cleaningNotes/              Notizen zum Putzplan
  devices/                    Geräte mit Zustand
  deviceLog/                  Meldungen je Gerät (unveränderlich)
  shifts/                     Schichten inkl. Tausch-Zustand
  absences/                   Abwesenheiten mit Antrags-Status
  handovers/                  Übergaben an die nächste Schicht

channels/{kanal}/messages/    Chat, "allgemein" + je Studio
dms/{paarId}/messages/        Direktnachrichten
announcements/                Infos der Leitung mit Lesebestätigung
board/                        Schwarzes Brett (studioübergreifend)
documents/ + documentData/    Metadaten getrennt vom Dateiinhalt
inventory/{studioKey}         Material – EIN Dokument je Studio
certificates/                 Nachweise
archives/{jahr-KWnn}          Wochen-Sicherungen für die Vorhersage
users/, pushTokens/, config/  Konten, Geräte, Einstellungen
```

### Die eine Regel, die man kennen muss

**Der Studio-Schlüssel ist der Listenplatz, nicht der Name.**
`studioKey('Hürth') === 'studio-6'`, weil Hürth der siebte Eintrag in
`KONFIG.studios` ist.

> Wer die Liste umsortiert oder einen Eintrag löscht, ordnet **allen
> bestehenden Daten ein anderes Studio zu.** Neue Studios ausschließlich
> hinten anhängen. Ein geschlossenes Studio bleibt in der Liste stehen.

### Warum Material ein einziges Dokument je Studio ist

22 Artikel × 14 Studios als Einzeldokumente wären 308 Dokumente und ebenso
viele Schreibvorgänge beim Zählen. Als ein Dokument je Studio: 14 Dokumente,
ein Schreibvorgang je Studio, verzögert gebündelt.
**Preis dafür:** die Sicherheitsregeln können „Soll setzen" nicht von „Ist
eintragen" unterscheiden – beides steht im selben Dokument. Diese Trennung
ist eine Regel der Oberfläche, keine des Servers. Bewusst so entschieden.

---

## 4. Sicherheit

**Die Rechte werden auf dem Server geprüft, nicht in der App.** Die
Sicherheitsregeln (390 Zeilen) sind die eigentliche Grenze; was in der
Oberfläche versteckt ist, ist zusätzlich in der Datenbank gesperrt.

Bekannte Ausnahmen, ehrlich benannt:

| Stelle | Warum die Oberfläche entscheidet |
|---|---|
| Material: Soll-Menge und Löschen | ein Dokument je Studio, siehe oben |
| Aussehen und Meldungen | reine Geräte-Einstellungen, kein Serverbezug |

Weiteres:

- **Firestore-Listen** werden komplett abgelehnt, wenn auch nur ein
  zurückgegebenes Dokument unlesbar wäre. Jede Abfrage muss deshalb selbst
  filtern – das ist kein Stilmittel, sondern Pflicht.
- **Bilder und Sprachnachrichten** aus der Datenbank laufen durch
  `safeMedia()`, Links durch `safeUrl()`. Ohne diese Prüfung wäre ein
  gespeichertes `javascript:`-Feld ein Einfallstor.
- **Gelöschtes** liegt 30 Tage im Papierkorb.
- **Nächtliche Sicherung** um 02:40, sieben Tage Aufbewahrung.
- **Es gibt keinen Zugangscode**, mit dem man sich zum Chef machen könnte.

---

## 5. Automatische Abläufe

20 Cloud Functions, Region `europe-west1`.

| Wann | Was |
|---|---|
| 07:30 | Erinnerung an heute fällige Aufgaben |
| 08:00 | Geburtstagsgruß im Chat |
| 08:15 | Nachweise, die in 60/14/0 Tagen ablaufen |
| 02:40 | vollständige Sicherung der Datenbank (7 Tage) |
| 03:15 | erledigte einmalige Putzaufgaben endgültig entfernen |
| 03:30 | Papierkorb älter als 30 Tage löschen |
| 1. des Monats | Monatsbericht per E-Mail an den Chef |
| wöchentlich | Material und Putzplan ins Archiv sichern |
| bei Ereignis | Push-Nachrichten, Termin-Mails |

---

## 6. Technische Entscheidungen und ihr Preis

| Entscheidung | Vorteil | Preis |
|---|---|---|
| **Eine HTML-Datei** (11.474 Zeilen) | kein Build, kein Werkzeugkasten, in fünf Jahren noch lesbar | keine Modularisierung; Suchen statt Springen |
| **Kein Framework** | keine Abhängigkeit, die veraltet; 372 Funktionen in reinem JavaScript | mehr Handarbeit bei der Darstellung |
| **Alles im Speicher rechnen** | sofortige Reaktion, keine Serverkosten | ab etwa 40 Studios neu zu denken |
| **Ein Beobachter je Studio** | Live-Aktualisierung überall | 14 Verbindungen beim Chef |
| **Dateien als Text in der Datenbank** | kostenlos | Grenze bei ~0,7 MB je Datei |
| **Alles auf Deutsch, auch im Code** | der Kunde kann mitlesen | keine internationale Weitergabe ohne Übersetzung |
| **Firebase-Gratisstufe** | keine laufenden Kosten | Kontingente statt Skalierung |

---

## 7. Was das Produkt bewusst nicht tut

Wichtig für Gespräche mit Mitarbeitern und Mitarbeitervertretung – und ein
Verkaufsargument, kein Mangel:

- **Keine Standortverfolgung.**
- **Keine Arbeitszeiterfassung**, keine Stempeluhr.
- **Keine Leistungsmessung**, kein Ranking zwischen Mitarbeitern.
- **Kein Mitlesen von Direktnachrichten** – auch nicht durch den Chef.
- **Keine KI-Auswertung**, keine Weitergabe an Dritte.
- **Keine Werbung.**

Nicht gebaut, weil es der Sache schadet:

- **„Schreibt gerade …"** – eine Schreiboperation je Tastenanschlag und
  Person. Teuerster Effekt, geringster Nutzen.
- **Lesebestätigung im Teamchat** – wäre eine Anwesenheitskontrolle.
- **Urlaubskonto mit Resttagen** – das ist Lohnbuchhaltung, halb gebaut
  schlimmer als gar nicht.
- **Automatische Schichtplanung** – wer wann kann, hängt an Absprachen, die
  nicht in der App stehen.
- **Aufgaben per Ziehen umsortieren** – die Reihenfolge ergibt sich aus
  Frist und Dringlichkeit.

---

## 8. Grundsätze der Oberfläche

Diese fünf Sätze erklären neun von zehn Gestaltungsentscheidungen:

1. **Jede Seite beantwortet ihre Frage im ersten Bildschirm.** Was seltener
   gebraucht wird, ist zugeklappt und einen Tipp entfernt.
2. **Lesen kommt vor Schreiben.** Listen stehen vor Formularen.
3. **Dringlichkeit schlägt Alphabet** – außer da, wo die Reihenfolge etwas
   Körperliches abbildet (die Materialliste ist der Weg durchs Lager).
4. **Ein Fingerziel ist mindestens 44 Pixel hoch und beschriftet.**
5. **Nichts wird zweimal angeboten.** Zwei Wege zum selben Ort machen eine
   Oberfläche nicht bedienbarer, sondern unübersichtlicher.

---

## 9. Umfang

| | |
|---|---|
| Oberfläche | 11.474 Zeilen (8.395 JavaScript, 1.751 CSS) |
| Funktionen im Frontend | 372 |
| Cloud Functions | 20 |
| Sicherheitsregeln | 390 Zeilen |
| Automatische Durchläufe | 29 Dateien |
| Handbuch | 23 Kapitel, 15 Seiten als PDF |
| Betriebskosten | 0 € (Firebase-Gratisstufe) |
