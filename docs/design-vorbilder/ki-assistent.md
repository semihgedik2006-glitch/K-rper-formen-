# KI-Assistent: schwebende Kugel, kompaktes Fenster, Mitdenken

Für **Formi**. Stand der App (Runde 177/178): Kugel `#formiKugel` unten
rechts, kompaktes Fenster als Standard (`aria-modal=false`, App dahinter
bleibt bedienbar), „Groß“ für Vollbild, Zeiger fliegt per `transform` zum
Ziel, am Rechner bleibt Formi beim Seitenwechsel offen. Abgesprochen:
Abhaken/Öffnen/Erinnern ohne Rückfrage mit Rückgängig; was andere sehen,
erst nach 3 Sekunden mit „Stopp“; **Löschen nie**. Offen ist Etappe 2:
„Formi weiss, auf welcher Seite man ist“ und „Zeig mir wie“.

Dieses Dokument sammelt, wie andere das lösen — als Baukasten für Etappe 2
und 3.

---

### Intercom Messenger — Launcher und „Home“ beim ersten Öffnen

**Was die App macht:** Der Hilfe-Chat vieler Webseiten sitzt als runder
Knopf in einer Ecke. Betreiber wählen links oder rechts und stellen den
Abstand zur Seite und nach unten getrennt ein; das Zeichen im Kreis wird
nicht grösser gemacht, der Kreis hat Innenabstand. Beim ersten Öffnen
erscheint ein „Home“-Bereich aus wenigen Bausteinen (Gespräch beginnen,
Hilfe durchsuchen, Neuigkeiten), danach die Gespräche.

**Was wir übernehmen:**
- Die Lage der Kugel über **zwei Variablen** steuern (`--formi-rechts`,
  `--formi-unten`) statt fester Werte an mehreren Stellen — dann lässt
  sich die Kugel je Ansicht verschieben (z. B. über einem Hauptknopf
  A2 aus `DESIGN-RECHERCHE.md`), ohne neue Sonderfälle.
- Formi-Fenster **ohne Verlauf** = ein kleines „Home“ mit höchstens drei
  Bausteinen: „Was steht an?“, „Frag mich etwas“, „Zeig mir wie …“. Mit
  Verlauf: direkt das letzte Gespräch.

**Wo in StudioChat:** `#formiKugel`, kompaktes Formi-Fenster.

**Passt zu / reibt sich mit:** W2 (drei Bausteine, nicht mehr). W9: die
Kugel darf optisch klein wirken, die Trefferfläche bleibt ≥ 44 × 44.
Reibung: ein Home ist eine Ebene mehr — nur zeigen, wenn es noch nichts
zum Weitermachen gibt.

**Quelle:** [Intercom Help — Customizing the Intercom Messenger](https://www.intercom.com/help/configuring-for-your-product-or-site/customizing-the-intercom-messenger),
[Intercom Help — Set up and customize the Home space](https://www.intercom.com/help/en/articles/6612589-set-up-and-customize-the-home-space)

---

### Notion AI — Gesicht unten rechts, Tastenkürzel, Quellenwahl

**Was die App macht:** Ein runder Knopf mit Gesicht unten rechts öffnet
die KI **neben** der Seite, nicht statt ihr; aus der Seitenleiste geht es
in eine Vollansicht. Am Rechner gibt es ein Tastenkürzel. Unten im
Eingabefeld wählt man, worauf sich die Antwort stützen soll („alle
Quellen“ oder eine bestimmte), und mit „@“ erwähnt man eine bestimmte
Seite. Der Verlauf liegt im ⋯-Menü.

**Was wir übernehmen:**
- **Quellen-Chip im Eingabefeld:** „Diese Seite“ · „Mein Studio“ · „Alle
  Studios“ (letzteres nur, wenn die Rolle es darf). Standard: diese Seite.
  So weiss man, worauf sich „hak das zweite ab“ bezieht.
- **„@“ für Personen und Seiten**, mit derselben Liste wie im Chat.
- Verlauf hinter ⋯, nicht als eigener Reiter im kompakten Fenster.

**Wo in StudioChat:** Eingabezeile des Formi-Fensters; Taste J gibt es
seit Runde 161 schon.

**Passt zu / reibt sich mit:** W10 (Tastenkürzel, neben der Arbeit). W2:
der Chip ist **ein** Element, keine Leiste aus drei Knöpfen.

**Quelle:** [Notion Help — Everything you can do with Notion AI](https://www.notion.com/help/guides/everything-you-can-do-with-notion-ai)

---

### Microsoft Copilot in Edge — Seitenleiste mit Seitenkontext

**Was die App macht:** Copilot öffnet als Leiste am rechten Rand des
Browsers. Fragen zur Seite nutzen den Seiteninhalt; andere Fragen nur
Adresse und Titel. Beim ersten Mal wird gefragt bzw. informiert, ob der
Kontext genutzt werden darf, und es gibt einen Schalter, das abzustellen.
Startvorschläge werden aus den offenen Tabs gebildet; dazu feste Knöpfe
wie „Zusammenfassen“.

**Was wir übernehmen:**
- **Am Rechner ab 1440 px Formi als angedockte rechte Spalte**, die den
  Inhalt schmaler macht statt ihn zu verdecken (Vorschlag: 380–420 px).
  Bei 1280 px bleibt das schwebende Fenster. Vor dem Bauen messen, ob
  die Liste + Detail-Ansichten (ab 1100 px) dann noch Platz haben.
- Eine **leise Kontextzeile** oben im Fenster: „Formi sieht: Aufgaben ·
  Hürth“ mit Tipp zum Ändern. Das ist zugleich die Antwort auf „Formi
  weiss, wo du bist“ — sichtbar statt heimlich.
- **Startvorschläge aus der aktuellen Ansicht**: in Aufgaben „Was ist
  überfällig?“, im Schichtplan „Wer kann Samstag?“, im Putzplan „Was
  fehlt heute noch?“.

**Wo in StudioChat:** Formi am Rechner (`formiBleibtOffen`), Etappe 2.

**Passt zu / reibt sich mit:** W10 (Breite nutzen statt überlagern).
W1: angedockt verdeckt nichts. Reibung: unter 1440 px wird es eng —
dort schwebend lassen.

**Quelle:** [Microsoft Support — Getting started with Copilot in Microsoft Edge](https://support.microsoft.com/topic/3fe6c1d4-9bd8-4492-a063-2cc6a5d01fef)

---

### Gemini auf Android — schwebendes Feld statt Vollbild

**Was die App macht:** Beim Aufrufen erscheint ein schwebendes Feld über
der laufenden App, mit einem Lichtschein an der Kante; Antworten kommen
in diesem Feld, die App bleibt sichtbar. Ein Chip fragt zum aktuellen
Bildschirm und ändert seine Beschriftung je nach App (bei Videos „zu
diesem Video“). Ein Tipp in die obere rechte Ecke vergrössert auf
Vollbild.

**Was wir übernehmen:**
- **Ein Kontext-Chip, dessen Text der Seite folgt**: „Frag zu dieser
  Aufgabe“, „… zu dieser Schicht“, „… zu diesem Gerät“. Ein Chip, nicht
  fünf.
- Den **Lichtschein an der Kante** nur **einmal beim Öffnen** (≤ 600 ms,
  `opacity` einer Pseudo-Ebene), in der Bereichsfarbe.
- „Groß“ oben rechts — so ist es schon gebaut; beibehalten.

**Wo in StudioChat:** kompaktes Formi-Fenster.

**Passt zu / reibt sich mit:** W4 (Licht von der Kante, Bereichsfarbe).
W6: kein pulsierender Dauerschein. W7: nie in Rot/Grün/Bernstein.

**Quelle:** [Android Authority — Gemini floating overlay update](https://androidauthority.com/gemini-floating-overlay-update-3472508)
(Fachpresse, keine Herstellerseite)

---

### Apple Spotlight (macOS Tahoe) — Aktionen direkt aus der Suche

**Was die App macht:** In der Systemsuche lassen sich Aktionen direkt
ausführen (Mail schicken, Notiz anlegen), ohne die App zu wechseln.
„Quick Keys“ sind kurze Zeichenfolgen, die direkt zu einer Aktion führen.
Filter grenzen auf eine Art von Ergebnis ein; Vorschläge kommen aus den
eigenen Gewohnheiten.

**Was wir übernehmen:**
- In der Suche (Strg/Cmd + K) **Aktionen als Ergebnisse**: „Aufgabe
  anlegen“, „Schicht anbieten“, „Defekt melden“ — mit Eingabetaste
  ausführbar, Formi übernimmt den Rest.
- **Kurzzeichen am Rechner** (z. B. `a` + Leertaste = Aufgabe) nur als
  **Abkürzung**, nie als einziger Weg.

**Wo in StudioChat:** Suche (Strg/Cmd + K), `keysModal` („?“).

**Passt zu / reibt sich mit:** W10 (Tastatur). W3 bleibt: jede Aktion
ist auch über „Alles“ erreichbar. `DESIGN-RECHERCHE.md` A1: eine
unsichtbare Geste darf nie der einzige Weg sein.

**Quelle:** [Apple Newsroom — macOS Tahoe 26](https://www.apple.com/newsroom/2025/06/macos-tahoe-26-makes-the-mac-more-capable-productive-and-intelligent-than-ever/)

---

### Claude in Chrome (Anthropic) — Plan zuerst, dann handeln

**Was die App macht:** Der Browser-Assistent hat Stufen: jede Aktion
bestätigen (vorher zeigt er einen **Plan** mit den Seiten, die er nutzen
wird; man kann ihn ändern), automatisch mit Sicherheitsprüfung, oder ganz
ohne Rückfrage. Unabhängig von der Stufe fragt er vor heiklen Schritten,
und manches tut er nie — u. a. Käufe und endgültiges Löschen.

**Was wir übernehmen:**
- **Plan-Karte vor mehrschrittigen Aufträgen** („Ich werde: 1. Schicht
  Sa 9–14 anbieten · 2. Team Hürth benachrichtigen“) mit „Los“ und
  „Ändern“. Einzelschritte (abhaken, öffnen) weiter ohne Karte.
- **Eine feste Liste „macht Formi nie“** sichtbar unter „Was Formi kann“:
  löschen, Passwörter, Abo/Zahlung, Rollen ändern.
- Später je Person wählbar: „Formi fragt vorher“ / „Formi handelt, mit
  Rückgängig“.

**Wo in StudioChat:** Formi-Aktionen (Etappe 3), Hilfe zu Formi.

**Passt zu / reibt sich mit:** passt genau zur Absprache aus Runde 177
(Löschen nie, 3 s „Stopp“). W2: die Karte ersetzt die Rückfrage, sie
kommt nicht zusätzlich.

**Quelle:** [Claude Help — Claude in Chrome permissions guide](https://support.claude.com/en/articles/12902446-claude-in-chrome-permissions-guide)

---

### Apple Human Interface Guidelines — Generative KI

**Was die Richtlinie sagt:** Menschen behalten die Kontrolle: Neues muss
sich verwerfen, zurücknehmen oder neu erzeugen lassen. Bearbeiten,
Rückgängig, Nochmal gehören **neben** das Ergebnis, und eine Korrektur
soll sichtbar „angekommen“ sein. Beim Warten **konkret** sagen, was
passiert, statt allgemein „wird verarbeitet“. Vor Unumkehrbarem fragen;
Zerstörerisches nicht automatisieren. Für den Anfang kuratierte
Vorschläge; bei einer Absage erklären, wie es besser geht; freiwilliges
Daumen hoch/runter.

**Was wir übernehmen:**
- **Statuszeile mit Verb und Ziel**: „Suche offene Aufgaben in Hürth …“,
  „Lege Aufgabe ‚Laufband 2 prüfen‘ an …“ — nie nur Punkte.
- Unter jeder Formi-Aktion **eine Zeile**: `Rückgängig · Ändern ·
  Nochmal` (Trefferfläche je ≥ 44 px, am Handy Pillen).
- Nach „Ändern“ eine kurze Bestätigung „Übernommen“ an der geänderten
  Stelle (Zeile leuchtet einmal im Akzent).
- Daumen hoch/runter nur an Antworten, nicht an Aktionen.

**Wo in StudioChat:** Antworten und Aktionskarten im Formi-Fenster.

**Passt zu / reibt sich mit:** W5 (die drei sind echte Knöpfe), W7
(„Übernommen“ ist Akzent, nicht Grün — Grün nur, wenn etwas erledigt ist).

**Quelle:** [Apple HIG — Generative AI](https://developer.apple.com/design/human-interface-guidelines/generative-ai)

---

### Microsoft HAX — 18 Leitlinien als Prüfliste

**Was die Richtlinie sagt:** Microsoft Research hat 18 Leitlinien für
KI im Umgang mit Menschen formuliert und an Produkten getestet. Für
Formi die wichtigsten: klar machen, was das System kann (G1) und wie gut
(G2); Kontext der Situation zeigen (G4); leicht aufrufen, leicht
wegschicken, leicht korrigieren (G7–G9); erklären, warum etwas passiert
ist (G11); Folgen einer Handlung vorher zeigen (G16); globale Schalter
(G17).

**Was wir übernehmen:** Vor jeder Formi-Runde diese acht als Prüfliste
im Bericht abhaken — mit Fundstelle im Code, nicht als Gefühl:

| | Frage an die neue Funktion |
|---|---|
| G1/G2 | Steht in „Was Formi kann“, was es kann und wo es unsicher ist? |
| G4 | Sieht man, welchen Kontext Formi benutzt (Kontextzeile)? |
| G8 | Lässt sich Formi mit einem Tipp / Esc wegschicken? |
| G9 | Lässt sich das Ergebnis mit einem Tipp korrigieren oder zurücknehmen? |
| G11 | Gibt es „Warum?“ an Vorschlägen, die Formi selbst bringt? |
| G16 | Steht vor dem Handeln, was danach anders ist (Plan-Karte)? |
| G17 | Lässt sich das „Melden von selbst“ global abschalten? |

**Wo in StudioChat:** jeder Formi-PR, Abschnitt „Geprüft“ in `FORTSCHRITT.md`.

**Passt zu / reibt sich mit:** passt zu „nichts behaupten“ in `CLAUDE.md`.

**Quelle:** [Microsoft HAX Toolkit — Guidelines & Patterns](https://www.microsoft.com/en-us/haxtoolkit/library/pattern/),
[Microsoft Research — Guidelines for Human-AI Interaction](https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/)

---

### Shape of AI — „Wayfinders“: der erste Satz ist der schwerste

**Was die Sammlung zeigt:** Eine Muster-Bibliothek für KI-Oberflächen.
Die Gruppe „Wayfinders“ hilft beim ersten Satz: Vorschläge, Vorlagen,
Beispiele, sanfte Hinweise und **Rückfragen**, wenn eine Bitte zu vage
ist.

**Was wir übernehmen:**
- **Rückfrage als Chips statt Freitext**: „Welches Studio?“ → `Hürth`
  `Porz` `Alle` — ein Tipp statt Tippen.
- **Vorlagen** für Wiederkehrendes: „Übergabe für heute schreiben“ füllt
  ein Gerüst, das man ergänzt.

**Wo in StudioChat:** Rückfragen in Formi (seit Runde 162), Übergabe.

**Passt zu / reibt sich mit:** W9 (Chips ≥ 44 px hoch, auch wenn sie
schmal aussehen). W2: höchstens drei bis vier Chips auf einmal.

**Quelle:** [Shape of AI — Wayfinders](https://www.shapeof.ai/pattern-types/wayfinders)

---

## Die Fensterformen nebeneinander

| Form | Vorbild | wann in StudioChat |
|---|---|---|
| Kugel | Intercom, Notion | immer, ausser im Chat und auf Formis Seite |
| kompaktes Fenster über der App | Gemini, Notion | Handy und Rechner < 1440 px |
| angedockte rechte Spalte | Copilot in Edge | Vorschlag: Rechner ≥ 1440 px |
| Vollbild („Groß“) | Gemini (Ecke oben rechts) | auf Wunsch; Leinwände nur hier |

## Top 3 zum sofort Übernehmen

1. **Statuszeile mit Verb + Ziel und darunter `Rückgängig · Ändern ·
   Nochmal`** an jeder Formi-Aktion (Apple HIG). Klein, sofort sichtbar,
   stärkt Vertrauen.
2. **Kontextzeile „Formi sieht: <Seite> · <Studio>“ plus ein Kontext-Chip
   mit wechselndem Text** (Copilot, Gemini) — die sichtbare Hälfte von
   Etappe 2.
3. **Plan-Karte vor mehrschrittigen Aufträgen** mit „Los“ / „Ändern“
   (Claude in Chrome) — passt zur Absprache „was andere sehen, erst mit
   Stopp“.
