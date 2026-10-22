# Dienstplan und Schichten

Für Team → Schichten, Ich → Meine Woche, „Heute im Studio“ und den
Schichtplaner. Was es schon gibt (nicht doppelt bauen): Wochenstreifen
mit Punkten, immer alle sieben Tage (Runde 103); Schicht abgeben /
übernehmen / bestätigen (`tauschHTML()`), Angebote auf der Startseite;
am Rechner die Woche in sieben Spalten; „Heute im Studio“ als Tagesband
mit Balken je Schicht und Jetzt-Linie; offene Schichten als
„＋ besetzen“; Schichtplaner mit Monatsplan für alle Studios (Runde 156,
169).

---

### Google Kalender — Ansicht wählen, und sie bleibt

**Was die App macht:** Es gibt Tag, Woche, Monat, Jahr, eine
Terminliste und „4 Tage“; die Anzahl Tage lässt sich in den
Einstellungen frei festlegen. Die zuletzt gewählte Ansicht wird zum
Standard, bis man wieder wechselt.

**Was wir übernehmen:**
- **Die zuletzt gewählte Ansicht merken** (je Gerät in `PREFS`), statt
  bei jedem Öffnen auf „Woche“ zurückzuspringen.
- **„3 Tage“ fürs Tablet am Empfang (820 px)**: gestern · heute · morgen
  in drei Spalten — sieben Spalten werden dort zu schmal für Namen.
- Eine **Listenansicht** („Termine“) als Handy-Standard für „Meine
  Woche“ — die gibt es im Grunde schon; sie heisst dann auch so.

**Wo in StudioChat:** Team → Schichten, Ich → Meine Woche.

**Passt zu / reibt sich mit:** W10 (Rechner: Woche; Tablet: 3 Tage;
Handy: Liste). W3: der Umschalter ist ein Segment, kein Menü.

**Quelle:** [Google Calendar Help — Artikel 37189 (Ansichten)](https://support.google.com/calendar/answer/37189)

---

### Deputy — Tastenkürzel, Gruppieren, „wirkt nur auf das Sichtbare“

**Was die App macht:** Tag, Woche und Monat lassen sich mit den Tasten
`d`, `w`, `m` wechseln. Die Woche lässt sich nach Person oder nach
Bereich gruppieren; nach Person stehen die Leute links in einer Spalte,
ihre Schichten in einer Zeile, und Urlaub/Abwesenheit steht im selben
Raster. „Veröffentlichen“ und Sammeländerungen wirken **nur auf die
gerade sichtbaren** Schichten.

**Was wir übernehmen:**
- **Tastenkürzel am Rechner**: `t` Tag, `w` Woche, `m` Monat, `←`/`→`
  blättern, `h` heute. In `keysModal` („?“) eintragen.
- **Umschalter „nach Person / nach Studio“** im Schichtplaner.
- **Abwesenheiten im selben Raster** als schraffierte Fläche, nicht in
  einer eigenen Liste.
- Sammel-Knöpfe beschriften, worauf sie wirken: „Diese Woche · Hürth
  veröffentlichen (12 Schichten)“.

**Wo in StudioChat:** Schichtplaner, Team → Schichten am Rechner.

**Passt zu / reibt sich mit:** W10. W7: Abwesenheit ist **kein** Status
im Sinne von Alarm — neutrale Schraffur, nicht Bernstein.

**Quelle:** [Deputy Blog — Scheduling just got quicker, easier and monthly](https://www.deputy.com/au/blog/deputy-scheduling-just-got-quicker-easier-and-monthly)

---

### Planday (Rechner) — Kopfzeile des Plans und Farben

**Was die App macht:** Oben links: Abteilung, Umschalter
Mitarbeitende / Gruppen / Positionen, Zeitraum (Tag, Woche, 2 Wochen,
Monat), ein Knopf „Heute“ und Pfeile. Oben rechts: Ansicht, Vorlagen,
Werkzeuge, Filter. Schichten sind farbig nach Zustand: offen rot,
genehmigt grün, „zu verkaufen“ gelb, Entwurf orange, normal grau; dazu
eine Ampel je Person für Ist- gegen Vertragsstunden.

**Was wir übernehmen:**
- Die **Ordnung der Kopfzeile**: links „wo und wann“ (Studio, Zeitraum,
  Heute, ‹ ›), rechts „was tun“ (Vorlagen, Werkzeuge). Eine Zeile am
  Rechner, zwei am Handy.
- Die **Stunden-Ampel je Person** (unter / genau / über Soll) im
  Schichtplaner — das *ist* ein Status, Farbe ist hier richtig.
- **Nicht** übernehmen: offene Schichten rot. Eine offene Schicht ist
  eine Einladung, kein Alarm — gestrichelter Rahmen + „＋ besetzen“
  bleibt. Rot erst, wenn sie in < 24 h beginnt und niemand da ist.

**Wo in StudioChat:** Schichtplaner, Team → Schichten.

**Passt zu / reibt sich mit:** **W7 ist hier der Massstab**: Planday
färbt fünf Zustände; bei uns tragen höchstens zwei eine Statusfarbe.

**Quelle:** [Planday Help — Get to know the desktop schedule](https://help.planday.com/en/articles/30153-get-to-know-the-desktop-schedule)

---

### Planday (Handy) — meine und offene Schichten oben

**Was die App macht:** In der neuen Plan-Seite der App stehen die
**eigenen Schichten oben**, direkt darunter die **offenen**, damit man
sie vergleichen kann. Ein blauer Punkt markiert Tage mit eigener
Schicht; wer in mehreren Abteilungen arbeitet, schaltet um. Die alte
Ansicht lässt sich in den Einstellungen zurückholen.

**Was wir übernehmen:**
- In „Meine Woche“ **unter den eigenen Schichten ein Block „Offen in
  deinem Studio“** (max. drei Zeilen, Rest „alle n ›“) — heute stehen
  Angebote auf der Startseite, aber nicht neben der eigenen Woche.
- Punkte im Wochenstreifen gibt es schon; dabei bleiben.

**Wo in StudioChat:** Ich → Meine Woche (`ich:woche`).

**Passt zu / reibt sich mit:** W1 (gedeckelt auf drei Zeilen), W9 (der
„alle n ›“-Knopf — genau dieser Knopf traf einmal nur 35 px, siehe
`CLAUDE.md`; per Hit-Test messen).

**Quelle:** [Planday Help — Updates to the schedule page on Planday app](https://help.planday.com/en/articles/102186-updates-to-the-schedule-page-on-planday-app)

---

### Microsoft Teams Shifts — „Meine Schichten“ und „Team“

**Was die App macht:** „Meine Schichten“ zeigt die eigenen kommenden
Schichten; ein Tipp öffnet die Details, dort lässt sich tauschen oder
anbieten. Unter dem Teamnamen führt „Team-Schichten“ zum Plan aller;
ein Tipp auf einen Tag zeigt, wer da ist.

**Was wir übernehmen:** Den Ablauf haben wir. Übernehmen lässt sich die
**Reihenfolge der Knöpfe im Detail**: zuerst „Tauschen“ / „Anbieten“,
erst danach Informationen — wer eine Schicht antippt, will meist etwas
mit ihr tun.

**Wo in StudioChat:** Schicht-Detail (Aktionsblatt am Handy).

**Passt zu / reibt sich mit:** W2, A2 in `DESIGN-RECHERCHE.md`
(Hauptaktion in der Daumenzone).

**Quelle:** [Microsoft Support — View your shifts in Shifts](https://support.microsoft.com/en-us/teams/shifts/view-your-shifts-in-shifts)

---

### Skello — vier Ansichten, jede mit einer Frage

**Was die App macht:** Woche nach Person (Standard, mit Stundenzähler),
Woche nach Position (eine Schicht mehreren zuweisen), **Tag mit der
Zahl der eingeplanten Leute je Viertelstunde** und Monat mit Summen und
Urlaubsständen. Jede Ansicht beantwortet eine andere Frage.

**Was wir übernehmen:**
- Unter dem Tagesband „Heute im Studio“ eine **Besetzungszeile**: je
  Stunde die Zahl der Leute als kleine Ziffer; eine **Lücke (0 Personen
  während der Öffnungszeit)** wird markiert — das ist ein Status, also
  Bernstein bzw. Rot, wenn sie jetzt ist.
- Jede Ansicht im Schichtplaner bekommt eine **Unterzeile mit ihrer
  Frage**: „Wer arbeitet wann?“, „Ist jede Stunde besetzt?“, „Passen die
  Stunden?“.

**Wo in StudioChat:** „Heute im Studio“ (Rechner), Schichtplaner.

**Passt zu / reibt sich mit:** W7 (Farbe nur an der Lücke), W10. W1: auf
der Startseite nur am Rechner, am Handy höchstens als Satz („09–10 Uhr
ist niemand eingeplant“).

**Quelle:** [Skello Help — How to use the different schedule views](https://help.skello.io/en/articles/8680464-how-to-use-the-different-schedule-views-on-skello)

---

## Top 3 zum sofort Übernehmen

1. **Lücken-Zeile unter „Heute im Studio“** (Skello) — sagt in einem
   Blick, ob jede Stunde besetzt ist; das ist im EMS-Studio die
   eigentliche Frage.
2. **„Offen in deinem Studio“ direkt unter der eigenen Woche** (Planday
   App) — Angebot und eigene Schichten nebeneinander.
3. **Zuletzt gewählte Ansicht merken + Tastenkürzel `t`/`w`/`m`/`h`**
   (Google Kalender, Deputy) — klein, und am Rechner sofort spürbar.
