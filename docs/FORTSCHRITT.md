# Master Audit – laufende Liste

Die eine Datei, in der immer steht, wo wir stehen. Wird nach jeder Sitzung
aktualisiert.

**Vorgehen:** ein Bereich pro Sitzung, kompromisslos durchleuchtet, sofort
umgesetzt. Erst wenn er sitzt, geht es zum nächsten.

---

## Wo wir stehen

| # | Bereich | Stand | Sitzung |
|---|---|---|---|
| 1 | **Navigation** | 🟢 fertig | 1–2 |
| 2 | **Startseite** | 🟢 fertig | 2–3 |
| 3 | **Chat** | 🟢 fertig | 4 |
| 4 | **Aufgaben** | 🟢 fertig | 5 |
| 5 | **Material** | 🟢 fertig | 6 |
| 6 | **Geräte** | 🟢 fertig | 7 |
| 7 | **Team** | 🟢 fertig | 8 |
| 8 | **Dokumente** | 🟢 fertig | 9 |
| 9 | **Verwaltung** | 🟢 fertig | 10 |
| 10 | **Einstellungen** | 🟢 fertig | 11 |
| — | **Abschluss: Spezifikation, Design-System, Roadmap, Pitch** | 🟢 fertig | 12 |

⚪ offen · 🟡 in Arbeit · 🟢 fertig

---

## Sitzung 1 — 7. August 2026

### Vorab erledigt (aus der letzten Runde)

| Was | Stand |
|---|---|
| Google-Tabelle: einzelne `deleteRow()`-Aufrufe ersetzt, alle Studios in einer Sendung | ✅ |
| Aufklappbare Abschnitte auf allen Seiten | ✅ |
| Startseite in drei benannte Blöcke | ✅ |
| Tastenkürzel frei belegbar | ✅ |
| Sortierung bei Geräten, Dokumenten, Nachweisen | ✅ |
| Geräte umbenennen und umziehen | ✅ |
| **Aufgaben nachträglich bearbeiten** (war noch offen) | ✅ |

### Bereich 1 · Navigation

#### Gefundene Probleme

| # | Problem | Schwere | Stand |
|---|---|---|---|
| N1 | **Zurück-Geste verließ die App komplett** | 🔴 kritisch | ✅ behoben |
| N2 | Kein Verlauf, keine Adresse je Ansicht — nichts verlinkbar | 🔴 hoch | ✅ behoben |
| N3 | Offene Fenster ließen sich nicht mit Zurück schließen | 🟠 mittel | ✅ behoben |
| N4 | Gruppennamen „Austausch" / „Arbeit" sind keine Wörter, die jemand benutzt | 🟠 mittel | ✅ behoben |
| N5 | „Dokumente" sitzt unter „Team" — passt inhaltlich nicht | 🟠 mittel | ✅ behoben |
| N6 | Verwaltung hat drei Ebenen (Bereich → Ansicht → Reiter), ohne Zurück dazwischen | 🟠 mittel | ✅ behoben |
| N7 | Suche ist nur eine Lupe ohne Beschriftung | 🟡 klein | ✅ behoben |
| N8 | Kein Weg zur zuletzt besuchten Ansicht beim Neustart | 🟡 klein | ✅ behoben |

#### N1–N3 — was gebaut wurde

Die App hat **nie einen Verlaufseintrag angelegt**. Nachgemessen: nach zwei
Klicks stand `history.length` auf 2, und ein Zurück verließ die Seite.

Auf einem installierten Android-PWA gibt es keine sichtbare
Zurück-Schaltfläche — die Geste **ist** die Navigation. Jeder Mitarbeiter,
der sie benutzt, fliegt raus und muss die App neu öffnen. Das ist kein
Schönheitsfehler, das ist ein täglicher Abbruch mitten in der Arbeit.

Jetzt:

- Jeder Ansichtswechsel legt einen Eintrag an, mit Adresse (`#geraete`).
- Geöffnete Fenster legen ihren **eigenen** Eintrag an. Zurück schließt
  deshalb zuerst das Fenster und geht erst danach eine Ansicht zurück.
- Von Hand geschlossene Fenster räumen ihren Eintrag wieder ab, damit die
  nächste Geste nicht ins Leere läuft.
- Kein zweiter Eintrag für dieselbe Ansicht — sonst müsste man zweimal
  zurück, um einmal zurückzukommen.

Nachgemessen: Chat → Aufgaben → Profil öffnen → dreimal zurück landet exakt
bei Chat und dann bei Start. Ein Schritt pro Geste.

#### Health Score · Navigation

| Kriterium | vorher | jetzt | Begründung |
|---|---|---|---|
| UX | 3/10 | 7/10 | Die Zurück-Geste war ein täglicher Abbruch. Offen: Benennung und die dritte Ebene in der Verwaltung. |
| UI | 6/10 | 7/10 | Leisten sind sauber, aber innerhalb einer Gruppe fehlt der aktive Zustand auf einen Blick. |
| Performance | 8/10 | 8/10 | Ansichten liegen alle im DOM, es wird nur umgeschaltet — schnell, aber siehe Skalierbarkeit. |
| Skalierbarkeit | 5/10 | 5/10 | Alle 12 Ansichten stehen dauerhaft im HTML. Bei 20+ Ansichten wird die Datei unhandlich. |
| Wartbarkeit | 6/10 | 7/10 | Navigation liegt jetzt in Tabellen (`NAVGROUPS`, `AKTIONEN`) statt verstreut. |
| Konsistenz | 7/10 | 8/10 | Zurück verhält sich jetzt überall gleich. |
| Investor | 5/10 | 6/10 | „Die Zurück-Taste schließt die App" fällt in jeder Demo auf. Das ist weg. |
| Kaufwahrscheinlichkeit | 6/10 | 7/10 | Kein Kunde kauft nach einer Demo, in der die App zufällig zugeht. |
| Innovationsgrad | 4/10 | 4/10 | Solide Standard-Navigation. Kein Alleinstellungsmerkmal — und das ist hier richtig so. |
| Aufwand | — | klein | Rund 60 Zeilen, keine Umbauten an bestehenden Aufrufen. |

---

## Sitzung 2 — 7. August 2026

**Leitentscheidung von dir:** wir optimieren ab jetzt für **verkaufbar**.
Maßstab in allen Bereichen: *jemand ohne Einweisung muss es verstehen.*

### Bereich 1 · Navigation — abgeschlossen 🟢

| Was | Vorher | Jetzt |
|---|---|---|
| Gruppennamen | Start · Austausch · Arbeit · Team · Verwaltung | Start · **Chat** · **Betrieb** · Team · Verwaltung |
| Dokumente | unter „Team" | unter **Betrieb** (5 Unterseiten) |
| Verwaltung | sechs Reiter, sofort ein Formular, kein Zurück | **Übersicht mit sechs Kacheln**, je ein Satz Erklärung und eine Zahl → hinein → Zurück heraus |

Der Verwaltungsbereich war die Stelle, an der ein fremder Studiobetreiber
aufgegeben hätte: sechs Reiter, beim Öffnen sofort ein Formular, und raten,
was in den anderen steckt. Jetzt steht auf jeder Kachel ein Satz, was
dahinter liegt, plus eine Zahl (überfällige Aufgaben, ablaufende Nachweise,
Einträge im Papierkorb) — man sieht, wo etwas los ist, **bevor** man
hineingeht.

Die Zurück-Geste führt im Verwaltungsbereich zuerst zur Übersicht, nicht
aus der Ansicht heraus.

### Bereich 2 · Startseite — begonnen 🟡

| # | Problem | Schwere | Stand |
|---|---|---|---|
| H1 | **Die Hälfte der Kacheln zeigte eine Null** — drei von sechs beim Mitarbeiter | 🟠 mittel | ✅ behoben |
| H2 | **Schnellzugriff duplizierte die Navigation** Wort für Wort | 🟠 mittel | ✅ behoben |
| H3 | Kein „alles gut"-Zustand — bei nichts zu tun sah man sechs Nullen | 🟠 mittel | ✅ behoben |
| H4 | Chef und Mitarbeiter sehen fast dieselbe Startseite | 🟠 mittel | ✅ behoben |
| H5 | Ein neuer Nutzer lernt beim ersten Öffnen nicht, was die App ist | 🟠 mittel | ✅ Willkommen-Karte reicht |
| H6 | „Zuletzt passiert" lädt Ereignisse, die niemand liest | 🟡 klein | ✅ zusammengeklappt |

**H1/H3:** Kacheln mit Null rutschen nach hinten und werden blass. Ist alles
auf null, steht dort **„Alles erledigt"** statt sechs Nullen.

**H2:** Acht Kacheln mit denselben Namen und Symbolen wie die Leiste
darunter — dieselbe Funktion zweimal auf einem Bildschirm, rund ein Drittel
der Seite. Ersatzlos gestrichen. Wer eine eigene Reihenfolge will, hat dafür
die frei belegbaren Tastenkürzel.

**Messbar:** Startseite von **1,80 auf 1,31 Bildschirme** geschrumpft.

#### Health Score · Startseite

| Kriterium | vorher | jetzt | Begründung |
|---|---|---|---|
| UX | 5/10 | 7/10 | Kürzer, das Wichtige oben. Offen: Chef und Mitarbeiter brauchen unterschiedliche Startseiten. |
| UI | 6/10 | 8/10 | Klare Blöcke, keine Wand aus Nullen, ein echter Ruhezustand. |
| Performance | 7/10 | 8/10 | Ein Drittel weniger DOM auf dem am häufigsten geöffneten Bildschirm. |
| Skalierbarkeit | 6/10 | 6/10 | Zahlen werden über alle Studios im Speicher gerechnet — bei 100 Studios neu zu denken. |
| Wartbarkeit | 7/10 | 8/10 | Eine Kachel-Tabelle statt zweier paralleler Listen. |
| Konsistenz | 6/10 | 8/10 | Gleiche Abschnittslogik wie auf den anderen Seiten. |
| Investor | 5/10 | 7/10 | „Warum steht hier dreimal 0 und die Navigation zweimal?" fällt in jeder Demo. Weg. |
| Kaufwahrscheinlichkeit | 6/10 | 7/10 | Der erste Bildschirm entscheidet — der ist jetzt aufgeräumt. |
| Innovationsgrad | 4/10 | 5/10 | Der Ruhezustand ist ein kleiner, aber eigener Gedanke. |
| Aufwand | — | klein | Rund 40 Zeilen, eine gelöschte Funktion. |

---

## Sitzung 3 — 7. August 2026 · Aufräum-Runde

Auftrag: **alles Offene beenden.**

### Aus der Alt-Liste erledigt

| Was | War | Jetzt |
|---|---|---|
| **Tägliche Datenbank-Sicherung** | 🔴 es gab keine | `dailyBackup` 2:40 Uhr, sieben Tage Aufbewahrung, plus Knopf „Jetzt zusätzlich sichern" für den Chef |
| **Konfiguration an einer Stelle** | 🟡 doppelt in `index.html` + `sw.js` | `konfig.js` — beide laden dieselbe Datei |
| **Chef-Code im Quelltext** | 🟡 für jeden lesbar | `#chef`-Einstieg und Code ersatzlos entfernt |
| **`firebase-functions` veraltet** | 🟡 Fassung 5 | auf 7.3.2, alle 20 Functions laden geprüft |

### Bereich 1 · Navigation — Rest erledigt

- **N7** Suche: ab Tablet-Breite steht das Wort „Suchen" neben der Lupe,
  mit dem Kürzel im Titel.
- **N8** Die zuletzt offene Ansicht wird wiederhergestellt — aber nur
  innerhalb von zwei Stunden und nur bei Arbeitsansichten. Chat und
  Direktnachrichten bewusst nicht: dort stünde man sonst mitten in einem
  Gespräch, ohne den Tagesüberblick gesehen zu haben. Eine Adresse in der
  Zeile schlägt beides.

### Bereich 2 · Startseite — abgeschlossen 🟢

**H4 war der wichtigste Punkt unter „verkaufbar".** Der Chef sah dieselbe
Startseite wie ein Mitarbeiter: Summen über 14 Studios, aber nirgends, *wo*
etwas los ist. Er musste raten, welches Studio er sich ansieht.

Neu: **„Wo etwas los ist"** — höchstens vier Studios, sortiert nach
Dringlichkeit (überfällig zählt zehnfach, fehlendes Material dreifach,
offene Aufgaben einfach). Antippen springt in die offenen Aufgaben genau
dieses Studios. Erscheint erst ab zwei verwalteten Studios — für einen
Mitarbeiter mit einem Studio wäre die Zeile sinnlos.

Gemessen: Chef 1,72 Bildschirme (mit der neuen Zeile), Mitarbeiter 1,31.

**H5:** Die Willkommen-Karte beim ersten Start deckt das ab. Eine zweite
Erklärungsebene würde die Seite wieder aufblähen — bewusst nicht gebaut.

**H6:** „Zuletzt passiert" ist eine aufklappbare Karte und startet
zugeklappt. Wer es braucht, klappt es auf.

#### Health Score · Startseite (abschließend)

| Kriterium | Sitzung 2 | jetzt | Begründung |
|---|---|---|---|
| UX | 7/10 | **9/10** | Chef und Mitarbeiter bekommen, was sie brauchen. Ein Sprung führt zum Ort des Problems. |
| UI | 8/10 | 8/10 | unverändert gut |
| Performance | 8/10 | 8/10 | Die neue Zeile rechnet auf schon geladenen Daten, keine zusätzlichen Abfragen |
| Skalierbarkeit | 6/10 | 6/10 | unverändert — bei 100 Studios neu zu denken |
| Wartbarkeit | 8/10 | 8/10 | |
| Konsistenz | 8/10 | 9/10 | gleiche Abschnittslogik wie überall |
| Investor | 7/10 | **8/10** | „Wo brennt es?" ist die Frage, die ein Betreiber stellt — sie wird jetzt beantwortet |
| Kaufwahrscheinlichkeit | 7/10 | **8/10** | |
| Innovationsgrad | 5/10 | **6/10** | Die gewichtete Dringlichkeit ist ein eigener Gedanke |
| Aufwand | — | klein | rund 50 Zeilen |

---

## Sitzung 4 — 7. August 2026 · Bereich 3 · Chat

Der Bildschirm, auf dem die meiste Zeit verbracht wird. Die Frage beim
Durchleuchten war nicht „ist das schön", sondern: **warum sollte ein Studio
dafür WhatsApp verlassen?**

### Gefundene Probleme

| # | Problem | Schwere | Stand |
|---|---|---|---|
| C1 | **Der Verlauf bekam 37 % der Ansicht.** Seitenkopf, Untertitel und ein fünfzeiliger Hinweisbalken fraßen den Rest — sichtbar waren zwei Nachrichten | 🔴 kritisch | ✅ behoben |
| C2 | **Erwähnungen funktionierten praktisch nicht.** `@AnnaMeier` musste ohne Leerzeichen exakt getippt werden, ohne jeden Hinweis. Dabei ist die Erwähnung die einzige Meldung, die auch bei offenem Chat durchkommt | 🔴 hoch | ✅ behoben |
| C3 | **Werkzeuge 21 × 19 Pixel**, unbeschriftet („☺" = Reagieren, „↪" = Weiterleiten). Weit unter dem, was ein Daumen trifft | 🟠 mittel | ✅ behoben |
| C4 | **15 Kanäle alphabetisch** in einer waagerecht überlaufenden Leiste. „Seelscheid" lag hinter sechs Wischbewegungen — auch wenn dort als Einzigem etwas los war | 🟠 mittel | ✅ behoben |
| C5 | **Die Suche fand nur den offenen Kanal.** „Wo stand das nochmal?" hieß: in jedem Studio einzeln nachsehen | 🟠 mittel | ✅ behoben |
| C6 | **Ein langer Text drückte den Verlauf auf 166 Pixel** — zwei Nachrichten blieben übrig | 🟠 mittel | ✅ behoben |
| C7 | **Jede Nachricht wiederholte Name, Rolle und Uhrzeit**, auch die dritte derselben Person in einer Minute | 🟡 klein | ✅ behoben |
| C8 | Der Platzhalter im Schreibfeld war länger als das Feld und wurde mitten im Wort abgeschnitten | 🟡 klein | ✅ behoben |

### Was gebaut wurde

**C1 — der Verlauf bekommt die Seite zurück.** Überschrift „Team-Chat" und
Untertitel sind weg: In einem Messenger *ist* der Verlauf die Seite, und der
Untertitel erzählte jeden Tag dasselbe. Der Hinweisbalken für Meldungen ist
von fünf Zeilen auf eine geschrumpft.
Gemessen an einem 390er-Handy: **244 → 403 Pixel, 37 % → 61 %.**

**C2 — Erwähnungen, die man findet.** `@` tippen öffnet eine Vorschlagsliste
mit den Namen aus dem Team; Antippen oder Enter setzt den vollen Namen ein.
Namen mit Leerzeichen werden erkannt (`@Anna Meier`), die alte Schreibweise
ohne Leerzeichen weiterhin auch. Pfeiltasten wählen, Enter übernimmt — und
sendet dabei nicht versehentlich die Nachricht.

**C3 — Aktionsblatt statt Mini-Symbole.** Ein Tipp auf die Nachricht öffnet
ein Blatt von unten: Absender und Uhrzeit im Kopf, eine Reihe Reaktionen zum
Sofort-Antippen, darunter beschriftete Einträge à **48 Pixel** — Antworten,
Weiterleiten, Text kopieren, Anheften, Bearbeiten, Löschen. Nebenbei fiel
damit die Werkzeugleiste aus der Blase weg, was C7 erst möglich machte.

**C4 — Kanäle nach Dringlichkeit.** „Allgemein" bleibt vorn, dann der offene
Kanal, dann die mit ungelesenen Nachrichten, dann die zuletzt aktiven. Neu
geordnet wird **beim Betreten** des Chats, nicht bei jeder eintreffenden
Nachricht: eine Leiste, die sich unter dem Daumen umsortiert, trifft man
nicht. Der offene Kanal wird immer ins Bild gescrollt.

**C5 — Suche über alle Kanäle.** Für die Ungelesen-Zähler liegen die letzten
zwölf Nachrichten jedes Kanals ohnehin schon im Speicher. Die Suche greift
jetzt darauf zu: **keine einzige zusätzliche Abfrage**, aber Treffer aus
allen Studios. Jeder Treffer nennt seinen Kanal, Antippen wechselt dorthin.

**C7 — Gruppierung.** Folgt eine Nachricht derselben Person innerhalb von
fünf Minuten, entfällt der Kopf.

### Health Score · Chat

| Kriterium | vorher | jetzt | Begründung |
|---|---|---|---|
| UX | 4/10 | **8/10** | Zwei sichtbare Nachrichten waren kein Messenger. Erwähnungen funktionieren jetzt überhaupt erst. |
| UI | 6/10 | **8/10** | Ruhigere Blasen, beschriftete Aktionen, keine abgeschnittenen Texte. |
| Performance | 7/10 | 7/10 | Unverändert: 15 gleichzeitige Kanal-Beobachter für einen Chef. Die Suche kostet nichts extra. |
| Skalierbarkeit | 5/10 | 6/10 | Die Kanalleiste trägt 15 Einträge. Ab etwa 25 Studios braucht es eine Auswahl mit Suche statt einer Leiste. |
| Wartbarkeit | 6/10 | **8/10** | Ein Aktionsblatt statt sechs einzeln verdrahteter Knopf-Sorten; Anheften und Löschen liegen jetzt in eigenen Funktionen. |
| Konsistenz | 7/10 | 8/10 | Dasselbe Blatt-Muster wie in den anderen Bereichen. |
| Investor | 5/10 | **8/10** | „Warum nicht WhatsApp?" ist beantwortbar: Kanäle je Studio, Umfragen, Anheften, Rollen, Erwähnungen — auf einem Bildschirm, der wie ein Messenger aussieht. |
| Kaufwahrscheinlichkeit | 5/10 | **8/10** | Der Chat ist in jeder Vorführung der zweite Klick. |
| Innovationsgrad | 4/10 | 6/10 | Die nach Dringlichkeit sortierte Kanalleiste und die Suche ohne Zusatzkosten sind eigene Gedanken. |
| Aufwand | — | mittel | rund 260 Zeilen, davon 40 gelöscht |

### Bewusst NICHT gebaut

- **„Schreibt gerade …"** — kostet eine Schreiboperation pro Tastenanschlag
  und pro Person. Bei 14 Studios ist das der teuerste Effekt der ganzen App,
  für den geringsten Nutzen.
- **Lesebestätigung im Chat** — bei Ankündigungen der Leitung ist sie
  sinnvoll und vorhanden. Im Teamchat wäre sie eine Anwesenheitskontrolle;
  das Handbuch verspricht ausdrücklich das Gegenteil.
- **Volltextsuche über den gesamten Verlauf aller Kanäle** — dafür bräuchte
  es einen Suchdienst. Für 14 Studios steht der Aufwand nicht dafür.

---

## Sitzung 5 — 7. August 2026 · Bereich 4 · Aufgaben

Der Bereich, für den die App überhaupt angeschafft wird: nachhalten, dass
Dinge gemacht werden. Leitfrage: **wie lange dauert es, bis jemand sieht,
was liegen geblieben ist?**

### Gefundene Probleme

| # | Problem | Schwere | Stand |
|---|---|---|---|
| A1 | **Ein Chef musste 571 Pixel scrollen**, bis die erste überfällige Aufgabe im Bild war. Studios waren alphabetisch sortiert — eine überfällige Aufgabe in Seelscheid lag hinter dreizehn Blöcken | 🔴 kritisch | ✅ behoben |
| A2 | **Der leere Bereich log.** Filter „Für mich" ohne Treffer meldete „Noch keine Aufgaben. Erstelle welche im Chef-Bereich." — obwohl vier existierten | 🔴 hoch | ✅ behoben |
| A3 | **Die Tagesübersicht duplizierte Startseite und Filterleiste.** „Guten Abend, Lisa 👋 · 2 offen · 1 überfällig" — und 100 Pixel darunter dieselben Filter noch einmal | 🟠 mittel | ✅ behoben |
| A4 | **„Foto hinzufügen" als Knopf über die volle Breite an JEDER Aufgabe** — 46 Pixel auch an den vielen, die nie eines bekommen | 🟠 mittel | ✅ behoben |
| A5 | **Werkzeuge 25 × 27 Pixel**, unbeschriftet (✎ ⏰ 🗑) | 🟠 mittel | ✅ behoben |
| A6 | **„Frist verschieben" fragte per `prompt()`**: „1 = einen Tag später, 7 = eine Woche, 0 = entfernen" — eine Zahl eintippen für drei Möglichkeiten | 🟠 mittel | ✅ behoben |
| A7 | **Kein Weg, eine Aufgabe anzulegen**, ohne die Liste zu verlassen: Verwaltung → Erstellen → Formular suchen | 🟠 mittel | ✅ behoben |
| A8 | **Standard-Sortierung kannte keine Dringlichkeit** — allein das Erstellungsdatum entschied | 🟡 klein | ✅ behoben |

### Was gebaut wurde

**A1 — Dringlichkeit bestimmt die Reihenfolge.** Innerhalb eines Studios
stehen überfällige Aufgaben oben (älteste Frist zuerst). Für die Verwaltung
rutschen zusätzlich die Studios mit überfälligen Aufgaben nach vorn; alle
übrigen bleiben alphabetisch, damit sich nur verschiebt, was sich verschieben
muss.
Gemessen: **Chef 571 → 225 Pixel, Mitarbeiter 295 → 183.** Auf einem 844er
Bildschirm heißt das: sichtbar ohne zu scrollen.

**A2 — der leere Bereich sagt die Wahrheit.** „Keine dir zugewiesenen
Aufgaben — es gibt 4 Aufgaben, tippe auf ‚Alle', um sie zu sehen." Nennt den
Grund und den Ausweg.

**A3 — die Tagesübersicht ist weg, die Zahlen sind an die Filter gewandert.**
„Nur offene 3", „Überfällig 1". Ein Ort statt drei, und 112 Pixel mehr für
die Liste.

**A4/A5 — schlankere Zeilen, Aktionsblatt wie im Chat.** Die Kamera sitzt als
Symbol in der Fußzeile; Bearbeiten, Frist und Löschen liegen hinter „⋯" in
einem Blatt mit 48 Pixel hohen, beschrifteten Einträgen. Ein Mitarbeiter
ohne Foto an der Aufgabe bekommt gar kein „⋯" — dahinter stünde nur die
Kamera, die eine Zeile darüber schon sichtbar ist.
Aufgabenhöhen: **271 → 242, 169 → 140, 117 → 112 Pixel.**

**A6 — Frist verschieben ohne Zahlen-Eingabe.** Drei Einträge im Blatt statt
`prompt()`. Gerechnet wird weiterhin ab heute.

**A7 — „+ Neu" auf der Aufgabenseite**, führt direkt ins Formular und setzt
den Schreibcursor in den Titel.

### Health Score · Aufgaben

| Kriterium | vorher | jetzt | Begründung |
|---|---|---|---|
| UX | 5/10 | **9/10** | Was liegen geblieben ist, steht ohne Scrollen im Bild. Der leere Bereich schickt niemanden mehr in die Irre. |
| UI | 6/10 | **8/10** | Kürzere Zeilen, beschriftete Aktionen, keine doppelten Filter. |
| Performance | 7/10 | 7/10 | Unverändert: ein Listener je Studio, alles im Speicher sortiert. |
| Skalierbarkeit | 5/10 | 6/10 | Die Sortierung nach Dringlichkeit hilft genau dann, wenn es viele Studios sind. Bei mehreren hundert Aufgaben je Studio bräuchte es serverseitige Filter. |
| Wartbarkeit | 6/10 | **8/10** | Ein Aktionsblatt statt drei einzeln verdrahteter Knöpfe; Leertexte an einer Stelle. |
| Konsistenz | 6/10 | **9/10** | Dasselbe Blatt-Muster wie im Chat, dieselbe Dringlichkeits-Logik wie auf der Startseite. |
| Investor | 6/10 | **9/10** | „Zeig mir, was in meinen 14 Studios liegen bleibt" ist in einem Blick beantwortet. |
| Kaufwahrscheinlichkeit | 6/10 | **9/10** | Das ist der Bereich, für den bezahlt wird. |
| Innovationsgrad | 4/10 | 6/10 | Studios nach Dringlichkeit statt nach Alphabet ist ein eigener Gedanke. |
| Aufwand | — | mittel | rund 220 Zeilen, davon 70 gelöscht |

### Bewusst NICHT gebaut

- **Aufgaben per Ziehen umsortieren** — die Reihenfolge ergibt sich aus Frist
  und Dringlichkeit. Eine von Hand gesetzte Reihenfolge müsste gespeichert,
  zwischen Personen abgeglichen und bei jeder neuen Aufgabe gepflegt werden.
- **Unteraufgaben mit eigener Frist** — dafür gibt es Teilschritte. Eine
  zweite Ebene mit eigenen Fristen macht aus einer To-do-Liste ein
  Projektwerkzeug, das in einem Studio niemand pflegt.
- **Kommentare an Aufgaben** — dafür ist der Chat da, und zwar der des
  Studios. Eine zweite Kommentarspur würde nur seltener gelesen.

---

## Sitzung 6 — 7. August 2026 · Bereich 5 · Material

Die einzige Seite, auf der jemand **tippt statt tippt-und-weg**: Bestand
zählen, Zahlen eintragen, weitergehen. Leitfrage: **kann man damit im Lager
stehen und zählen, ohne sich zu verklicken?**

### Gefundene Probleme

| # | Problem | Schwere | Stand |
|---|---|---|---|
| M1 | **Der Nachbestell-Hinweis war nie zu sehen.** Das Markup trug ein Inline-`display:none`, das die Klasse `show` nicht überschreiben kann — „⚠️ 3 Artikel fehlen" wurde seit jeher gebaut und nie angezeigt | 🔴 kritisch | ✅ behoben |
| M2 | **Die Namensspalte war 103 Pixel breit.** „Bein-Manschetten Größe 2 (Paare)" brach auf **fünf** Zeilen um; drei Zahlenfelder und ein Löschknopf nahmen den Rest | 🔴 hoch | ✅ behoben |
| M3 | **Löschen ohne Rückfrage, direkt neben dem Zahlenfeld.** Ein Fehlgriff beim Zählen entfernte den Artikel sofort und endgültig | 🔴 hoch | ✅ behoben |
| M4 | **Mitarbeiter durften löschen, aber kein Soll setzen.** Genau verkehrt herum | 🟠 mittel | ✅ behoben |
| M5 | **Kein Weg von „3 Artikel fehlen" zu den drei Artikeln.** Bei 22 Zeilen sucht man sie einzeln | 🟠 mittel | ✅ behoben |
| M6 | **Die Spaltenköpfe scrollten weg** — nach zehn Zeilen weiß niemand mehr, ob die mittlere Spalte „Soll" oder „Ist" ist | 🟠 mittel | ✅ behoben |
| M7 | **Der Excel-Export über alle Studios stand ganz oben**, über der Liste, in die täglich Zahlen eingetragen werden | 🟡 klein | ✅ behoben |
| M8 | Ein dreizeiliger Erklärsatz („Soll = … Ist = … Fehlt …") stand dauerhaft über der Tabelle | 🟡 klein | ✅ behoben |

### Was gebaut wurde

**M1 — der Hinweis erscheint.** Ein einzeiliger Fehler mit großer Wirkung:
die Warnung, für die der ganze Bereich da ist, war unsichtbar. Jetzt steht
sie über der Liste — und ist zugleich der Weg zum Filter.

**M2 — der Name bekommt Platz.** Zahlenfelder von 56 auf 50 Pixel, Abstände
enger, Löschknopf nur für die Verwaltung, Silbentrennung an. Namensspalte
**103 → 160 Pixel**, längster Name **fünf → zwei Zeilen**, Tabelle
**1.727 → 1.298 Pixel**. Alle Zeilen sind jetzt gleich hoch — das Auge
findet die Spalte wieder, ohne zu suchen.

**M3/M4 — Löschen ist eine Verwaltungssache mit Rückfrage.** Und danach acht
Sekunden Rückgängig, mit Rückkehr an dieselbe Stelle in der Liste.
*Hinweis zur Ehrlichkeit:* die Sicherheitsregeln erlauben allen Angemeldeten
das Schreiben der Material-Sammlung — der Server kann „Soll setzen" nicht von
„Ist eintragen" unterscheiden, weil beides im selben Dokument steht. Diese
Trennung ist eine Regel der Oberfläche, genau wie beim Soll-Feld vorher auch.

**M5 — „nur diese zeigen".** Ein Tipp auf den Hinweis blendet alles
Vollständige aus, ein zweiter zeigt wieder alles. Zeilen mit Fehlbestand sind
zusätzlich getönt.

**Die Reihenfolge bleibt bewusst, wie sie ist.** Anders als bei den Aufgaben
wird hier **nicht** nach Dringlichkeit sortiert: Die Liste bildet den Weg
durchs Lager ab, und wer zählt, geht sie von oben nach unten durch. Eine
Liste, die sich beim Eintragen umsortiert, macht das Zählen unmöglich.
Deshalb Filter statt Sortierung.

### Health Score · Material

| Kriterium | vorher | jetzt | Begründung |
|---|---|---|---|
| UX | 4/10 | **8/10** | Man kann die Liste im Lager benutzen, ohne den Namen raten oder sich verklicken zu müssen. |
| UI | 5/10 | **8/10** | Gleich hohe Zeilen, klebende Köpfe, getönte Fehlbestände. |
| Performance | 8/10 | 8/10 | Unverändert: ein Dokument je Studio, verzögertes Speichern. |
| Skalierbarkeit | 6/10 | 6/10 | Ein Dokument je Studio trägt einige hundert Artikel. Darüber bräuchte es eine eigene Sammlung. |
| Wartbarkeit | 6/10 | 7/10 | Weniger Sonderfälle im Aufbau der Zeile. |
| Konsistenz | 5/10 | **8/10** | Rückfrage und Rückgängig wie überall sonst; Rollentrennung wie beim Soll-Feld. |
| Investor | 5/10 | **8/10** | Einkaufsliste, Bestellmail und Verbrauchs-Vorhersage waren schon stark — sie standen nur hinter einer Tabelle, die man nicht lesen konnte. |
| Kaufwahrscheinlichkeit | 6/10 | **8/10** | |
| Innovationsgrad | 6/10 | 6/10 | Die Vorhersage aus echten Wochen-Sicherungen bleibt der originelle Teil. |
| Aufwand | — | klein | rund 90 Zeilen |

### Bewusst NICHT gebaut

- **Sortierung nach Fehlbestand** — siehe oben: die Reihenfolge ist der Weg
  durchs Lager.
- **Barcode-Scannen** — klingt gut, scheitert daran, dass Handtücher und
  Manschetten keine Strichcodes tragen.
- **Automatische Bestellung beim Lieferanten** — die Bestellmail ist fertig
  vorbereitet; wer wirklich bestellt, soll ein Mensch bleiben.

---

## Sitzung 7 — 8. August 2026 · Bereich 6 · Geräte

Der Bereich mit dem höchsten Geldwert dahinter: ein defektes EMS-Gerät heißt
ausgefallene Termine. Leitfrage: **wie schnell weiß die Leitung, dass etwas
kaputt ist — und wo?**

### Gefundene Probleme

| # | Problem | Schwere | Stand |
|---|---|---|---|
| G1 | **Die Seite öffnete beim ersten Studio nach dem Alphabet** und meldete dort „Noch keine Geräte" — während in einem anderen Studio ein Gerät defekt war. Um das zu finden, musste ein Chef 14 Studios einzeln durchklicken | 🔴 kritisch | ✅ behoben |
| G2 | **Jede erneute Defektmeldung legte eine neue Aufgabe an.** Wer dasselbe Gerät dreimal meldete, weil sich nichts tat, erzeugte drei identische Aufgaben | 🔴 hoch | ✅ behoben |
| G3 | **„Wieder in Ordnung" war der auffälligste Knopf im Fenster** — farbig hervorgehoben, während „Defekt melden" daneben unscheinbar war. Wer schnell etwas melden wollte, setzte damit ein defektes Gerät versehentlich auf „in Ordnung" | 🟠 mittel | ✅ behoben |
| G4 | **Der Hinweis nannte das Gerät nicht.** „1 Gerät defekt – die Leitung hat dazu je eine Aufgabe bekommen" — welches, stand nirgends, und anklickbar war er auch nicht | 🟠 mittel | ✅ behoben |
| G5 | **Die Sortierleiste nahm drei Zeilen** (rund 150 Pixel) über einer Liste mit drei Geräten | 🟡 klein | ✅ behoben |
| G6 | Der Untertitel war zwei Zeilen lang und erklärte jeden Tag dasselbe | 🟡 klein | ✅ behoben |

### Was gebaut wurde

**G1 — „Wo etwas defekt ist".** Beim Öffnen der Seite eine kurze Abfrage über
alle verwalteten Studios: welche haben ein defektes Gerät, und wie viele.
Als Reihe anzutippender Studios ganz oben, in derselben Sprache wie „Wo etwas
los ist" auf der Startseite.
Bewusst **kein Live-Beobachter je Studio**: das wären 14 dauerhafte
Verbindungen für eine Zahl, die sich selten ändert. Stattdessen ein
Lesevorgang je Studio, fünf Minuten lang zwischengespeichert.

**G2 — eine Aufgabe je Gerät.** Die erzeugte Aufgabe trägt jetzt die
Geräte-Kennung. Eine zweite Meldung zu einem Gerät, das schon eine offene
Aufgabe hat, landet nur noch im Verlauf — und sagt das auch: „Defekt vermerkt
– es gibt schon eine offene Aufgabe dazu."

**G3 — Knöpfe nach Häufigkeit gewichtet.** „⚠ Defekt melden" bekommt die
volle Breite (348 Pixel), „Wartung fällig" und „Wieder in Ordnung" teilen
sich die Zeile darunter (je 170).

**G4 — der Hinweis nennt Ross und Reiter:** „⚠ **EMS-Gerät 2** ist defekt ·
ansehen" — und öffnet das Gerät.

**G5 — Sortierleiste einzeilig zum Schieben**, wie die Kanäle im Chat. Gilt
auch für Dokumente und Nachweise, die dieselbe Leiste benutzen: 150 → 33
Pixel.

### Nebenbei repariert: die Testdaten hatten ein Verfallsdatum

Beim Durchlauf fiel `test-tausch` aus — nicht wegen einer Änderung, sondern
weil in den Testdaten feste Datumsangaben standen (`2026-08-07`). Über Nacht
wurde daraus Vergangenheit, und „Ich kann nicht" erschien folgerichtig nicht
mehr. Schichten, Abwesenheiten und Nachweise werden jetzt **relativ zu heute**
erzeugt. Sonst wäre in ein paar Tagen die halbe Testreihe rot geworden, ohne
dass jemand etwas kaputt gemacht hätte.

### Health Score · Geräte

| Kriterium | vorher | jetzt | Begründung |
|---|---|---|---|
| UX | 5/10 | **9/10** | Die Frage „wo ist etwas kaputt" wird auf dem ersten Bildschirm beantwortet, statt in 14 Studios versteckt. |
| UI | 7/10 | **8/10** | Weniger Kopf, einzeilige Sortierung, klare Knopf-Hierarchie. |
| Performance | 7/10 | 7/10 | Eine Abfrage je Studio beim Öffnen, fünf Minuten gepuffert. Live-Beobachter bleiben auf ein Studio beschränkt. |
| Skalierbarkeit | 6/10 | 6/10 | Bei 50 Studios wären 50 Abfragen zu viel; dann gehörte die Zahl in ein Sammel-Dokument. |
| Wartbarkeit | 7/10 | 8/10 | Die Verknüpfung Gerät ↔ Aufgabe läuft jetzt über eine Kennung statt über den Titel. |
| Konsistenz | 6/10 | **9/10** | „Wo etwas defekt ist" spricht dieselbe Sprache wie „Wo etwas los ist". |
| Investor | 6/10 | **9/10** | Verlauf je Gerät, Wiederholungstäter-Warnung und Studio-Übersicht sind zusammen ein Argument, das kein Messenger hat. |
| Kaufwahrscheinlichkeit | 6/10 | **9/10** | Ein ausgefallenes EMS-Gerät kostet Termine — hier wird echtes Geld gespart. |
| Innovationsgrad | 6/10 | 7/10 | „3× defekt in 90 Tagen" plus die Aufgaben-Kopplung ist ein eigener Gedanke. |
| Aufwand | — | mittel | rund 140 Zeilen |

### Bewusst NICHT gebaut

- **Ein Live-Beobachter je Studio** für die Defekt-Übersicht — teuer für eine
  Zahl, die sich selten ändert.
- **QR-Codes am Gerät** zum Direkt-Melden — klingt gut, aber in einem Studio
  mit vier Geräten findet man das richtige auch in der Liste. Bei einer Kette
  mit 40 Geräten je Standort wäre es sinnvoll.
- **Wartungsintervalle mit Erinnerung** — dafür gibt es wiederkehrende
  Aufgaben. Ein zweites Fristensystem daneben würde nur auseinanderlaufen.

---

## Sitzung 8 — 8. August 2026 · Bereich 7 · Team

Vier Reiter in einem Bereich: Schichten, Abwesenheiten, Übergabe, Brett.
Leitfrage: **wie viel muss man wegscrollen, bevor man das sieht, weswegen
man hergekommen ist?**

### Gefundene Probleme

| # | Problem | Schwere | Stand |
|---|---|---|---|
| T1 | **Auf drei von vier Reitern stand das Eingabeformular VOR der Liste.** Bei den Abwesenheiten 536 Pixel hoch — die Liste begann bei Pixel 403 (Mitarbeiter) bzw. **647** (Chef). Wer nachsehen will, wer im Urlaub ist, bekommt zuerst ein leeres Antragsformular | 🔴 kritisch | ✅ behoben |
| T2 | **Urlaubsanträge waren nur im geöffneten Studio sichtbar.** Wer in Seelscheid Urlaub beantragt hatte, wartete, bis jemand zufällig dieses Studio aufmacht. Das ist kein Anzeigefehler, das ist ein hängengebliebener Vorgang | 🔴 hoch | ✅ behoben |
| T3 | **Der heutige Tag hing halb aus dem Bild.** Der Sprung dorthin benutzte `block:'nearest'` — liegt die Karte zur Hälfte im Bild, hält der Browser sie für sichtbar und rührt sich nicht | 🟠 mittel | ✅ behoben |
| T4 | Eine Dauererklärung über dem Plan („Wer arbeitet wann? Abwesenheiten werden automatisch angezeigt.") kostete jeden Tag dieselben 40 Pixel | 🟡 klein | ✅ behoben |

### Was gebaut wurde

**T1 — lesen vor schreiben.** Auf allen Reitern steht jetzt die Liste vorn:

| Reiter | Liste begann bei | jetzt |
|---|---|---|
| Abwesend (Mitarbeiter) | 403 px | **178 px** |
| Abwesend (Chef) | 647 px | **180 px** |
| Brett | hinter 383 px Formular | **181 px** |
| Übergabe | hinter dem Eingabefeld | Feld unter der Liste |

Die Formulare für Abwesenheit und Aushang starten **zugeklappt** (58 Pixel)
und öffnen sich mit einem Tipp auf die Überschrift — dasselbe Muster wie
überall sonst in der App.

**T2 — „Wartet auf deine Entscheidung".** Beim Öffnen der Seite eine Abfrage
über alle verwalteten Studios nach offenen Anträgen. Als Reihe anzutippender
Studios ganz oben; ein Tipp wechselt ins Studio **und** öffnet den
Abwesenheits-Reiter, sodass der Genehmigen-Knopf direkt im Bild ist.
Gleiches Verfahren wie bei den Geräten: ein Lesevorgang je Studio, fünf
Minuten gepuffert, kein Dauer-Beobachter.

**T3 — heute wirklich im Bild.** Statt `scrollIntoView` wird gerechnet: hängt
die heutige Karte unten heraus, wird genau so weit gescrollt, dass sie ganz
sichtbar ist. Zusammen mit T4 passt die ganze Woche jetzt auf einen
Bildschirm.

### Health Score · Team

| Kriterium | vorher | jetzt | Begründung |
|---|---|---|---|
| UX | 4/10 | **8/10** | Man sieht sofort, was los ist, statt an einem Formular vorbeizuscrollen. |
| UI | 6/10 | **8/10** | Gleiche Faltlogik wie im Rest der App, ganze Woche auf einem Bildschirm. |
| Performance | 7/10 | 7/10 | Vier Live-Beobachter je Studio wie bisher, dazu eine gepufferte Abfrage beim Öffnen. |
| Skalierbarkeit | 5/10 | 6/10 | Bei 50 Studios wäre die Antrags-Abfrage zu teuer; dann gehörte sie in ein Sammel-Dokument. |
| Wartbarkeit | 6/10 | 7/10 | Die Studio-Übersichten von Geräten und Team teilen sich Aussehen und Muster. |
| Konsistenz | 5/10 | **9/10** | „Wartet auf deine Entscheidung" spricht dieselbe Sprache wie „Wo etwas defekt ist" und „Wo etwas los ist". |
| Investor | 5/10 | **8/10** | Schichttausch mit Bestätigung und Urlaubsfreigabe über 14 Studios ist ein Argument, das kein Messenger hat. |
| Kaufwahrscheinlichkeit | 5/10 | **8/10** | Urlaubsanträge, die liegen bleiben, sind ein Ärgernis mit Namen. |
| Innovationsgrad | 5/10 | 6/10 | Der dreistufige Schichttausch war schon eigen; die studioübergreifende Freigabe kommt dazu. |
| Aufwand | — | klein | rund 120 Zeilen, davon 40 nur verschoben |

### Bewusst NICHT gebaut

- **Urlaubskonto mit Resttagen** — dafür bräuchte es Vertragsdaten,
  Übertrag aus dem Vorjahr und Teilzeitfaktoren. Das ist Lohnbuchhaltung,
  nicht Studioalltag, und halb gebaut wäre es schlimmer als gar nicht.
- **Automatische Schichtplanung** — wer wann kann, hängt an Absprachen, die
  nicht in der App stehen. Ein Vorschlag, den man jedes Mal korrigieren muss,
  ist langsamer als selbst eintragen.
- **Stempeluhr / Kommen-Gehen** — steht ausdrücklich im Handbuch unter „was
  die App bewusst nicht tut" und bleibt so.

---

## Sitzung 9 — 8. August 2026 · Bereich 8 · Dokumente

Der kleinste Bereich – und trotzdem mit einem Knopf darin, der ohne Rückfrage
14 Aufgaben anlegt. Leitfrage: **kann man den Namen des Dokuments lesen, und
kann man sich hier teuer verklicken?**

### Gefundene Probleme

| # | Problem | Schwere | Stand |
|---|---|---|---|
| D1 | **„Als Aufgabe" verteilte ohne Rückfrage** eine Aufgabe an jedes betroffene Studio – bei „Alle Studios" sind das 14, die man einzeln wieder löschen muss. Der Knopf war 130 × 48 Pixel groß und lag direkt neben „Öffnen" | 🔴 hoch | ✅ behoben |
| D2 | **Drei Knöpfe drückten den Namen auf eine schmale Spalte.** „Gerätewartung Anleitung" brach mitten im Wort um; die Zeile war 160 statt 94 Pixel hoch | 🟠 mittel | ✅ behoben |
| D3 | **Kategorie-Leiste zweizeilig** (72 Pixel) über einer Liste mit drei Einträgen | 🟡 klein | ✅ behoben |
| D4 | Der Untertitel („…die dein Chef für dich hinterlegt hat") war zwei Zeilen lang und las sich für den Chef selbst seltsam | 🟡 klein | ✅ behoben |

### Was gebaut wurde

**D1 — Rückfrage mit Namen.** „‚Hygieneplan 2026' als Aufgabe an 14 Studios
verteilen? Longerich, Nippes, Ebertplatz …" — man sieht, was passiert,
bevor es passiert.

**D2 — die Zeile selbst öffnet das Dokument.** „Öffnen" als eigener Knopf ist
weg (96 Pixel), Verteilen und Löschen ziehen ins Aktionsblatt hinter „⋯" —
dasselbe Muster wie im Chat, bei Aufgaben und bei Geräten. Ein Pfeil rechts
zeigt, dass die Zeile anklickbar ist; sie ist auch mit der Tastatur
erreichbar (`role="button"`, Enter und Leertaste).
Ergebnis: **Namensspalte 252 Pixel, alle Zeilen einzeilig, 160 → 94 Pixel
Zeilenhöhe.** Beim Chef passen jetzt alle Dokumente auf einen Bildschirm.

**D3 — Kategorien einzeilig zum Schieben**, wie die Sortierung und die
Kanäle im Chat: 72 → 42 Pixel.

### Health Score · Dokumente

| Kriterium | vorher | jetzt | Begründung |
|---|---|---|---|
| UX | 6/10 | **8/10** | Namen lesbar, ein Tipp öffnet, kein Verklicken mit 14 Folgen. |
| UI | 5/10 | **8/10** | Gleich hohe Zeilen, einzeilige Leisten, gleiche Sprache wie die übrigen Bereiche. |
| Performance | 7/10 | 7/10 | Unverändert: ein Beobachter über 200 Dokumente, Dateiinhalte werden erst beim Öffnen geholt. |
| Skalierbarkeit | 5/10 | 5/10 | Unverändert die Schwachstelle: Dateien liegen als Text in der Datenbank, Grenze rund 0,7 MB. Ab vielen großen Dateien führt kein Weg an echtem Speicher vorbei — kostet dann aber Geld. |
| Wartbarkeit | 7/10 | 8/10 | Ein Blatt-Muster für vier Bereiche statt vier eigener Knopfreihen. |
| Konsistenz | 6/10 | **9/10** | |
| Investor | 5/10 | 7/10 | „Hygieneplan an alle 14 Studios als Aufgabe" ist eine Funktion, die man in einer Vorführung zeigt. |
| Kaufwahrscheinlichkeit | 5/10 | 7/10 | |
| Innovationsgrad | 5/10 | 6/10 | Dokument → Aufgabe in einem Zug ist ein eigener Gedanke. |
| Aufwand | — | klein | rund 80 Zeilen |

### Bewusst NICHT gebaut

- **Eigenes Suchfeld** in den Dokumenten — die Suche oben findet sie bereits,
  samt Kategorie und Studio. Ein zweites Feld an derselben Stelle wäre genau
  die Doppelung, die auf der Startseite und bei den Aufgaben schon weg ist.
- **Versionierung von Dokumenten** — wer den Hygieneplan aktualisiert, lädt
  ihn neu hoch. Ein Versionsbaum will gepflegt werden, und niemand im Studio
  wird das tun.
- **Echter Dateispeicher statt Datenbank** — würde die 0,7-MB-Grenze
  aufheben, kostet aber ab dem ersten Byte Geld. Bleibt bewusst offen, bis es
  jemand braucht; der Link-Weg (Drive/Dropbox) trägt bis dahin.

---

## Sitzung 10 — 8. August 2026 · Bereich 9 · Verwaltung

Sechs Reiter, das größte Stück der App. Der Bereich hatte in Sitzung 1 schon
eine Übersichtsseite bekommen — jetzt ging es um das, was **hinter** den
Kacheln liegt. Leitfrage: **steht in jedem Reiter oben das, weswegen man ihn
öffnet?**

### Gefundene Probleme

| # | Problem | Schwere | Stand |
|---|---|---|---|
| V1 | **„Überblick" war 4,76 Bildschirme lang, und „Braucht Aufmerksamkeit" stand ganz unten** — hinter 1.600 Pixeln Studio-Tabelle. Der Reiter, dessen ganzer Zweck „was hakt gerade" ist, zeigte das zuletzt | 🔴 hoch |  ✅ behoben |
| V2 | **„Erstellen" begann mit der Ankündigung.** Das Aufgabenformular — der Grund, aus dem man den Reiter öffnet, und das Ziel des „+ Neu"-Knopfs von der Aufgabenseite — lag 350 Pixel tiefer | 🟠 mittel | ✅ behoben |
| V3 | **„Nachweise" 3,16 und „Auswertung" 3,28 Bildschirme** — alles gleichzeitig offen, obwohl je eine Karte die eigentliche Antwort ist | 🟠 mittel | ✅ behoben |
| V4 | **„Übersicht aller Studios" behauptete beim Leiter etwas Falsches** — er sieht nur seine eigenen | 🟡 klein | ✅ behoben |

### Was gebaut wurde

Kein neues Konzept, sondern das bestehende konsequent angewendet: **oben das,
wofür man kommt; der Rest zugeklappt.** Genau so war der Reiter „System"
schon gebaut — er war mit 1,3 Bildschirmen der kürzeste und übersichtlichste
von allen. Die anderen fünf ziehen jetzt nach.

| Reiter | vorher | jetzt | oben steht |
|---|---|---|---|
| Überblick | 4,76 | **1,99** | 🚨 Braucht Aufmerksamkeit |
| Erstellen | 3,09 | **2,59** | ✅ Neue Aufgabe erstellen |
| Nachweise | 3,16 | **1,33** | ⏳ Läuft demnächst ab |
| Auswertung | 3,28 | **1,61** | 📈 Bericht |
| Team | 1,69 | 1,69 | war schon richtig |
| System | 1,30 | 1,30 | war das Vorbild |

Beim Leiter heißt die Tabelle jetzt „Übersicht **deiner** Studios".

### Health Score · Verwaltung

| Kriterium | vorher | jetzt | Begründung |
|---|---|---|---|
| UX | 5/10 | **8/10** | Jeder Reiter beantwortet seine Frage im ersten Bildschirm. |
| UI | 6/10 | **8/10** | Ein Faltmuster über alle sechs Reiter statt sechs Eigenheiten. |
| Performance | 7/10 | 7/10 | Unverändert; zugeklappte Karten werden weiterhin gerechnet, nur nicht angezeigt. |
| Skalierbarkeit | 6/10 | 6/10 | Die Studio-Tabelle wächst linear mit den Studios — zugeklappt stört das nicht mehr. |
| Wartbarkeit | 7/10 | 8/10 | Reihenfolge und Faltung stecken im Markup, nicht in Sonderlogik. |
| Konsistenz | 6/10 | **9/10** | |
| Investor | 6/10 | **8/10** | „Zeig mir, was in meinen Studios hakt" ist zwei Tipps entfernt statt fünf Bildschirme. |
| Kaufwahrscheinlichkeit | 6/10 | **8/10** | Dieser Bereich entscheidet, ob ein Betreiber die App für ein Werkzeug oder für ein Formular hält. |
| Innovationsgrad | 5/10 | 5/10 | Hier war nichts zu erfinden, nur aufzuräumen. |
| Aufwand | — | klein | rund 60 Zeilen, überwiegend verschoben |

### Bewusst NICHT gebaut

- **Reiter-Reihenfolge frei belegbar** — sechs Reiter, die jeder anders
  sortiert, machen jede Anleitung wertlos.
- **Zahlen auch auf „Erstellen" und „Auswertung"** — dort gibt es nichts zu
  zählen, was auf eine Handlung wartet. Eine Zahl ohne Bedeutung ist
  schlechter als keine.

---

## Sitzung 11 — 8. August 2026 · Bereich 10 · Einstellungen

Der letzte Bereich. Vier Reiter in einem Fenster, das scrollt — und genau
daraus entstand der Fehler. Leitfrage: **kann man eine Einstellung ändern
und sie auch speichern, ohne zu suchen?**

### Gefundene Probleme

| # | Problem | Schwere | Stand |
|---|---|---|---|
| E1 | **„Speichern" lag unter dem sichtbaren Rand.** Das Fenster ist 760 Pixel hoch, der Inhalt 884 – Namen ändern, dann 124 Pixel weiterscrollen, um zu speichern. Auf kleineren Handys mehr | 🔴 hoch | ✅ behoben |
| E2 | **Der vierte Reiter war abgeschnitten.** „Nachweise" ragte über den rechten Rand hinaus – wer ihn nicht kennt, findet ihn nicht | 🟠 mittel | ✅ behoben |
| E3 | **„Aussehen" war nach Geschmack sortiert, nicht nach Bedarf.** Der Chat-Hintergrund stand oben, **Hell/Dunkel 700 Pixel weiter unten** – dabei stellt man das ein, weil man etwas nicht lesen kann | 🟠 mittel | ✅ behoben |
| E4 | Der Löschknopf am eigenen Nachweis war 21 × 25 Pixel groß | 🟡 klein | ✅ behoben |

### Was gebaut wurde

**E1 — „Speichern" klebt am unteren Rand.** `position:sticky` mit einer
mitlaufenden Fläche darunter, damit der Text nicht durchscheint. Gemessen:
oben wie nach 400 Pixeln Scrollen immer vollständig im Bild.

**E2 — die Reiter passen.** Unter 480 Pixeln Breite entfällt das Symbol; die
vier Wörter allein passen nebeneinander. Zusätzlich ist die Leiste seitlich
schiebbar, falls eine Übersetzung einmal länger ausfällt.
Leistenhöhe nebenbei 59 → 42 Pixel.

**E3 — Aussehen nach Häufigkeit:** Hell/Dunkel · Schriftgröße · Akzentfarbe ·
Chat-Hintergrund. Hell/Dunkel ist jetzt ohne Scrollen erreichbar.

**E4 — Löschknopf 36 × 44 Pixel**, wie überall sonst.

### Gut so gelassen

Nicht alles war kaputt. Diese drei Entscheidungen waren schon richtig und
bleiben unverändert:

- **Kein Speichern-Knopf im Aussehen-Reiter** — die Änderung greift sofort,
  und ein Knopf, der nichts tut, verwirrt.
- **Meldungen gelten je Gerät**, nicht je Person. Wer im Studio ein Tablet
  teilt, will dort andere Töne als auf dem eigenen Handy.
- **Nachweise sind für die betroffene Person nur lesbar.** Wer sein eigenes
  Ablaufdatum verlängern könnte, macht die Nachweispflicht wertlos.

### Health Score · Einstellungen

| Kriterium | vorher | jetzt | Begründung |
|---|---|---|---|
| UX | 5/10 | **8/10** | Speichern immer erreichbar, alle vier Reiter sichtbar, Wichtiges oben. |
| UI | 7/10 | 8/10 | Schmalere Reiterleiste, gleiche Knopfgrößen wie im Rest der App. |
| Performance | 8/10 | 8/10 | Unverändert. |
| Skalierbarkeit | 7/10 | 7/10 | Vier Reiter sind das Maximum für ein Fenster dieser Breite; ein fünfter bräuchte ein anderes Muster. |
| Wartbarkeit | 7/10 | 7/10 | |
| Konsistenz | 6/10 | **9/10** | Knopfgrößen und Faltverhalten wie überall. |
| Investor | 5/10 | 7/10 | Hell/Dunkel und Schriftgröße sind das, was in einer Vorführung als Erstes ausprobiert wird. |
| Kaufwahrscheinlichkeit | 5/10 | 7/10 | |
| Innovationsgrad | 5/10 | 5/10 | Einstellungen sollen nicht originell sein. |
| Aufwand | — | klein | rund 50 Zeilen |

### Bewusst NICHT gebaut

- **Einstellungen als eigene Seite statt Fenster** — vier Reiter passen in
  ein Fenster, und der Weg zurück ist ein Tipp. Eine eigene Seite bräuchte
  einen Platz in der Navigation, den sie nicht verdient.
- **Aussehen für alle Geräte synchronisieren** — wer am Tablet im Studio
  große Schrift braucht, will sie nicht auf dem eigenen Handy.
- **Mehr Akzentfarben** — neun reichen, und jede weitere muss in hell und
  dunkel geprüft werden.

---

## Alle zehn Bereiche sind durch

| Bereich | UX vorher → jetzt | Kaufwahrscheinlichkeit vorher → jetzt |
|---|---|---|
| Navigation | 3 → 9 | 4 → 8 |
| Startseite | 5 → 9 | 6 → 8 |
| Chat | 4 → 8 | 5 → 8 |
| Aufgaben | 5 → 9 | 6 → 9 |
| Material | 4 → 8 | 6 → 8 |
| Geräte | 5 → 9 | 6 → 9 |
| Team | 4 → 8 | 5 → 8 |
| Dokumente | 6 → 8 | 5 → 7 |
| Verwaltung | 5 → 8 | 6 → 8 |
| Einstellungen | 5 → 8 | 5 → 7 |

**Drei Muster haben sich durchgesetzt und tragen jetzt überall:**

1. **„Wo etwas los ist"** — dieselbe Form auf der Startseite, bei den
   Geräten und im Team. Ein Betreiber mit 14 Standorten fragt immer dasselbe:
   *wo?*
2. **Das Aktionsblatt von unten** — Chat, Aufgaben, Dokumente. Beschriftete
   Einträge à 48 Pixel statt Symbolen unter 30 Pixel.
3. **Lesen vor Schreiben, Wichtiges vor Vollständigem** — jede Seite
   beantwortet ihre Frage im ersten Bildschirm; der Rest ist zugeklappt.

**Was offen bleibt und bewusst offen bleibt:** Skalierbarkeit. Die App rechnet
alles im Speicher und beobachtet je Studio. Bei 14 Studios ist das richtig und
kostenlos. Ab etwa 40 Studios oder mehreren hundert Aufgaben je Studio müsste
serverseitig gefiltert werden — und ab da kostet es Geld. Das ist keine
Nachlässigkeit, sondern die Entscheidung, für die aktuelle Größe zu bauen.

---

## Sitzung 12 — 8. August 2026 · Abschluss

Die vier Dokumente aus dem Master-Prompt. Alle im Projekt, zusätzlich als
eine PDF-Mappe (15 Seiten).

| Datei | Was drinsteht |
|---|---|
| `SPEZIFIKATION.md` | Was das Produkt ist, Rollen, Datenmodell, Sicherheit, technische Entscheidungen **mit ihrem Preis**, was es bewusst nicht tut |
| `DESIGN-SYSTEM.md` | Farben, Schrift, Maße, Bewegung – **aus dem Code ausgelesen, nicht erfunden**. Dazu die fünf Bausteine, die überall tragen, und eine Prüfliste |
| `ROADMAP.md` | Vier Phasen mit Kosten je Position. Und was bewusst nicht draufsteht |
| `PITCH.md` | Pitch in einem Satz / 30 Sekunden / 2 Minuten, vollständige SWOT, die sieben Fragen eines Käufers mit ehrlichen Antworten, Preisidee |
| `DEIN-TEIL.md` | Die zwei Handgriffe, die nur der Projekt-Eigentümer machen kann – mit Klickwegen und Prüfschritt |
| `StudioChat-Produktmappe.pdf` | Die ersten vier als eine Mappe |

### Drei Dinge, die beim Schreiben aufgefallen sind

**1. Das Design-System war schon da, nur ungeschrieben.** Die Werte mussten
nicht erfunden werden – sie standen in `:root`. Was fehlte, war die Regel
dazu: *wann* nimmt man ein Aktionsblatt, *wann* klappt eine Karte zu, *wann*
ist Rot falsch. Das ist jetzt aufgeschrieben, mit Beispielen aus dem Audit.

**2. Die 44-Pixel-Regel war der häufigste Fund des ganzen Audits.** Chat
(21 × 19), Aufgaben (25 × 27), Nachweise (21 × 25), Material, Dokumente.
Fünf Bereiche, derselbe Fehler. Deshalb steht er im Design-System jetzt als
harte Regel mit Tabelle.

**3. Die ehrlichste Zeile der Spezifikation** ist die Tabelle „Technische
Entscheidungen und ihr Preis". Eine Datei mit 11.474 Zeilen ist keine
Nachlässigkeit, sondern eine Entscheidung – aber sie hat einen Preis, und
der steht jetzt dort. Dasselbe für „alles im Speicher rechnen" und „Dateien
als Text in der Datenbank".

### Health Score · Produkt als Ganzes

| Kriterium | Bewertung | Begründung |
|---|---|---|
| UX | **8/10** | Zehn Bereiche durchgemessen, jede Seite beantwortet ihre Frage im ersten Bildschirm. |
| UI | **8/10** | Ein Design-System, das drei Muster überall gleich anwendet. |
| Performance | 7/10 | Für 14 Studios mehr als schnell genug; die Grenzen sind bekannt und beschrieben. |
| Skalierbarkeit | **5/10** | Die schwächste Zahl, und das bleibt so. Ab etwa 40 Studios Umbau nötig. Bewusst nicht vorgebaut. |
| Wartbarkeit | 7/10 | Deutsch kommentiert, 29 Durchläufe – aber eine Datei und Bus-Faktor 1. |
| Konsistenz | **9/10** | |
| Investor | **8/10** | Klares Problem, klarer Unterschied zu WhatsApp, Betriebskosten im Cent-Bereich. |
| Kaufwahrscheinlichkeit | **8/10** | Was fehlt, ist kein Feature, sondern der Rahmen: Vertrag, Auftragsverarbeitung, Einrichtungs-Assistent. |
| Innovationsgrad | 6/10 | Der „Wo?"-Blick und die Verbrauchs-Vorhersage aus echten Wochen-Sicherungen sind eigen. Der Rest ist gutes Handwerk. |

---

## Sitzung 13 · Nachtrag: die Sicherung, die nie lief 🟢

Ausgelöst durch zwei echte Fehlermeldungen aus dem Betrieb – erst
`7 PERMISSION_DENIED`, dann `5 NOT_FOUND: bucket does not exist`.

### Was wirklich los war

Drei Fehler übereinander, von außen nach innen:

| # | Fehler | Wessen |
|---|---|---|
| 1 | In `DEIN-TEIL.md` stand nur eine der zwei nötigen Rollen | meiner |
| 2 | Der Zielspeicher war fest auf `<projekt>.appspot.com` verdrahtet, das Projekt hat aber `formenchat.firebasestorage.app` | meiner |
| 3 | **Es gab im Projekt gar keinen Speicher.** Nie eingerichtet | deiner – am 9.8. erledigt |

Alle drei sind erledigt. **Am 9. August um 03:28 Uhr lief die erste
Sicherung durch:** `gs://formenchat.firebasestorage.app/sicherung/manuell-2026-08-09-01-28-53`.

Beim Nachziehen fiel noch ein vierter auf: Das nächtliche Wegräumen alter
Ordner erkannte nur `sicherung/JJJJ-MM-TT/`, nicht
`sicherung/manuell-JJJJ-MM-TT-…/`. Jede Sicherung von Hand wäre für immer
liegen geblieben – bei einem Blaze-Projekt heißt das: bezahlt für immer.
Behoben, das Raster erkennt jetzt beide Formen.

### Der eigentliche Fund

Nicht der Speicher – **dass niemand gemerkt hat, dass nichts gesichert
wurde.** Die Funktion schrieb ihren Fehler brav ins Protokoll von Google.
Dort schaut niemand hin. Eine Sicherung, deren Scheitern man nicht sieht,
ist keine Sicherung, sondern ein beruhigendes Gefühl.

**Behoben:** Die Server-Funktion schreibt nach jedem Versuch nach
`config/sicherung`. Die App zeigt es an zwei Stellen –
in *System → Daten sichern* mit dem vollen Grund (rot, markierbar, die Karte
klappt dafür von selbst auf und schiebt den Grund ins Bild), und ganz oben in
*Braucht Aufmerksamkeit*, sobald eine Nacht ausgefallen ist.

### Was dabei sonst noch herauskam

**Das Projekt liegt auf dem Bezahlplan Blaze.** Wir sind zwölf Sitzungen lang
davon ausgegangen, alles laufe in der Gratisstufe und es sei keine Karte
hinterlegt. Das ist nicht haltbar: Cloud Functions lassen sich ausschließlich
auf Blaze bereitstellen, und die 20 Funktionen laufen. Alle Dokumente, die
„Betriebskosten null" versprachen, sind korrigiert – es sind Cent-Beträge,
nicht null. Und die Budget-Warnung, die wir gestrichen hatten, ist wieder
empfohlen.

**Nebenbei:** `.btn-sm` war 36 Pixel hoch – der letzte Rest aus der Zeit vor
der 44-Pixel-Regel, gefunden am Knopf „Jetzt zusätzlich sichern". Jetzt 44,
83 Knöpfe in der ganzen App, alle 30 Durchläufe weiter grün.

| Kriterium | vorher | nachher |
|---|---|---|
| Verlässlichkeit der Sicherung | **2/10** – lief nie, niemand wusste es | **9/10** – läuft nachweislich, räumt sich auf und meldet sich, wenn eine Nacht ausfällt |
| Ehrlichkeit der Unterlagen | 5/10 – „kostet nichts" war falsch | 9/10 |
| Fingerziele | 9/10 | **10/10** |

**Neuer Durchlauf:** `tests/test-sicherung.js` – prüft, dass eine
gescheiterte Sicherung ganz oben gemeldet wird, dass der Klick im
System-Reiter landet, die Karte aufgeht, der Grund im Bild steht und sich
markieren lässt.

---

## Sitzung 14 · Forensik-Durchlauf 🟢

Erst ein Messwerkzeug gebaut (`tests/audit-forensik.js`), dann damit
12 Ansichten × 3 Rollen × 11 Breiten durchgemessen.

**Bemerkenswert: vier Fehler steckten im Messwerkzeug selbst.** Halb­durch­
sichtige Flächen wurden nicht übereinandergelegt; `showView()` und `PREFS`
sind wegen der IIFE nicht global, weshalb der ganze Ansichten­durchlauf
still ins Leere lief; Verläufe wurden als Weiß gelesen; Emoji tragen ihre
Farbe selbst. Ein Werkzeug, das man nicht selbst prüft, liefert Zahlen, die
schlimmer sind als keine.

| Befund | vorher | nachher |
|---|---|---|
| Kontrast unter 4,5:1 | **43** (schlechteste 1,4:1) | **0** |
| Fingerziele unter 44 px | **75** | **3** (im Anhang-Menü, während der Einblendung gemessen) |
| Waagerechter Überlauf 320–1920 px | 0 | 0 |
| Fokus unsichtbar beim Tabben | 0 | 0 |

**Ursache der Farbfehler:** Fläche und Text verwechselt. `--warm`/`--danger`
sind Flächen mit dunklem Text darauf – wurden aber auch als Textfarbe
benutzt, und im Hellmodus gab es sie dort nie, weil `body.light` sie nicht
neu definiert. Dazu 21 fest eingetragene Dunkelmodus-Hexwerte.

**Der unauffälligste Fund:** Ein `<button>` erbt die Textfarbe nicht. Fünf
Bauteile liefen mit Browser-Schwarz, darunter die Studiozeilen von „Wo etwas
los ist" – Kontrast 1,3 auf der dunklen Karte. Ein Zeichen im Reset behebt
die ganze Klasse.

Außerdem: `.scroll-fab` hob sein eigenes `position:absolute` weiter unten
wieder auf; „Desinfektionsmittel" schob die Materialzeile aus der Karte
(fehlendes `min-width:0`); `firebase-storage-compat.js` wurde bei jedem
Start geladen (40.329 Bytes) und nirgends benutzt.

**Nicht gemessen** – und deshalb auch nicht behauptet: echte Ladezeit auf
einem Gerät, Verhalten bei 500 Studios, Offline- und Mehrbenutzer-Abgleich,
Sicherheitsdurchlauf. Siehe Abschlussbericht.

---

## Sitzung 15 · Security-Durchlauf 🟢

Bis hierher waren die Sicherheitsregeln **nur gelesen** worden. Jetzt gibt
es `tests/rules/security.test.js`: 32 Prüfungen, die im Firestore-Emulator
ausgeführt werden und in CI laufen, **bevor** die Regeln ausgerollt werden.
Fällt eine um, wird nichts deployt.

| # | Befund | Schwere |
|---|---|---|
| 1 | **`storage.rules` war nie in Kraft.** Kein `storage`-Abschnitt in `firebase.json`, kein Deploy im Workflow. Gültig war, was die Konsole beim Anlegen des Speichers gesetzt hat – außerhalb der Versionsverwaltung. Und seit dem 9.8. liegt in genau diesem Speicher der **nächtliche Vollexport der Datenbank** | **P1** |
| 2 | **Leiter konnte fremde Dokumentinhalte überschreiben.** `documentData` prüfte kein Studio, die Metadaten desselben Dokuments schon | P2 |
| 3 | **Offener Kostenkanal.** `marketingChat`/`marketingImage` prüften nur „eingeloggt" – und registrieren kann sich jeder selbst. Auf Blaze mit hinterlegtem Zahlungsmittel | **P1** |

Befund 2 wurde **erst durch den Test entdeckt**, nicht durch Lesen.

**Der Testschritt ist beim ersten CI-Lauf selbst durchgefallen** – ich hatte
lokal mit einer Kopie der Regeldatei getestet statt mit dem echten Layout.
Immerhin hat das Tor getan, wofür es da ist: der Rollout wurde übersprungen.

Drei bewusst getragene Schwächen sind als `BEKANNT:`-Tests festgehalten,
damit eine Änderung daran auffällt – in beide Richtungen.

**Offen und ausdrücklich keine Codeänderung:** Die App erlaubt **offene
Selbstregistrierung**, und fast alle Leseregeln lauten „eingeloggt". Wer die
Adresse kennt, legt sich ein Konto an und liest Teamchat, Personenliste,
Aufgaben und Dokumente. Das zu ändern ist eine Produktentscheidung – siehe
Bericht.

---

## Sitzung 16 · Leistungs-Durchlauf 🟢

Neues Werkzeug `tests/audit-leistung.js`: zählt Datenbankzugriffe je Pfad,
prüft Speicher und offene Beobachter über drei Runden durch alle Ansichten,
misst die Ladephase mit gedrosselter CPU, lange Aufgaben und die Bildrate
beim Scrollen.

### Der Fund, der alles andere in den Schatten stellt

**Die App zeigte bis zu 12,6 Sekunden eine weiße Seite.** Im Kopf hing ein
gewöhnliches Stylesheet von `fonts.googleapis.com`. Ein Stylesheet blockiert
das Zeichnen – solange Google nicht antwortet, sieht der Nutzer nichts.
Keinen Text, nicht einmal den Ladebildschirm.

Aufgefallen ist es nur, weil die **gedrosselte und die ungedrosselte Messung
fast identisch** waren: 13,2 s gegen 12,6 s. Es war nie die Rechenleistung,
es war Warten. Hätte ich nur einmal gemessen, wäre es als „die App ist halt
groß" durchgegangen.

| erste Farbe | vorher | nachher |
|---|---|---|
| ohne Drosselung | 12.648 ms | **80 ms** |
| CPU 4-fach gedrosselt | 13.244 ms | **240 ms** |
| lange Aufgaben (>50 ms) | 14, längste 664 ms | 12, längste 284 ms |

Dieselbe Falle steckte in `marketing.html`, `werbung.html` und
`wachstum.html` – dort sogar als `@import` im `<style>`, was zusätzlich
serialisiert lädt.

### Drei Beobachter auf derselben Sammlung

`listenAllUsers`, `listenEmployees` und `listenChefs` lagen gleichzeitig auf
`users`. Die letzten beiden zusammen sind genau die erste: jedes
Nutzerdokument doppelt geliefert, doppelt abgerechnet – und die drei konnten
sich widersprechen, weil sie zu verschiedenen Zeiten eintrafen.
Beobachter beim Start: **42 → 40**, auf `users`: **3 → 1**.

### Auch am Messwerkzeug war ein Fehler

Der Stub gibt bei `orderBy()`/`limit()` dasselbe Objekt zurück – dadurch
wurde `onSnapshot` mehrfach umhüllt und die **Länge der Abfragekette** statt
der Beobachter gezählt. Aus 14 Studios wurden 28. Das ist in dieser Runde
schon der zweite Fall: **ein Werkzeug, das man nicht selbst prüft, liefert
Zahlen, die schlimmer sind als keine.**

### Gut, ohne Zutun

Scrollen im Chat 60 Bilder/s. Speicher (2,9 MB) und DOM-Knoten über drei
Runden durch alle 12 Ansichten stabil – kein Leck durch Navigation, trotz
258 `addEventListener` ohne ein einziges `removeEventListener`.

---

## Sitzung 17 · Motion-Durchlauf 🟢

Der letzte ungemessene Bereich.

### Der Befund, der zählt

**Zehn JS-gesteuerte weiche Scrolls, die `prefers-reduced-motion` gar nicht
erreicht.** Der CSS-Block schaltet Übergänge und Animationen ab —
`scrollIntoView({behavior:'smooth'})` ist aber JavaScript und läuft
unbeirrt weiter. Für Menschen mit Gleichgewichtsstörungen ist unerwartetes
Gleiten der schlimmste Auslöser, schlimmer als jedes Einblenden.

Behoben mit zwei Helfern (`sanftInsBild`, `sanftScrollen`), durch die jetzt
**alle zehn** Aufrufstellen laufen.

### Zweiter Befund: Verzögerungen blieben stehen

Der Reduce-Block setzte nur die Dauer auf 0,01 ms. `transition-delay` und
`animation-delay` (18 Stellen) blieben — das Element bewegt sich dann zwar
nicht mehr, erscheint aber verspätet. Das wirkt wie ein Hänger, nicht wie
Ruhe. Jetzt mit erfasst, dazu `scroll-behavior:auto`.

| mit „Bewegung reduzieren" | vorher | nachher |
|---|---|---|
| Übergänge über 50 ms | — | **0** |
| stehengebliebene Verzögerungen | 3 | **0** |
| laufende Animationen | — | **0** |

(Ohne die Einstellung: 29 Übergänge, 3 Verzögerungen, 17 Animationen —
alles bleibt wie es war.)

### Bestandsaufnahme

38 `@keyframes`, drei Kurven-Marken konsequent verwendet (107 Stellen).
Daneben aber 8× `ease-in-out`, 4× `ease`, 2× `linear` — kleine
Unstimmigkeit, kein Fehler. Fünf Übergänge bewegen Eigenschaften, die
Layout auslösen (`width` 4×, `height`, `max-height`, `padding`,
`margin-top`). Zwei `@keyframes` sind doppelt definiert (`viewIn`,
`checkPop`) — tote Regeln, die stillschweigend überschrieben werden.
Alles notiert, nichts davon behoben: der Nutzen steht nicht dafür.

---

## Sitzung 18 · Beitritt: Firmencode und Freigabe 🟢

Die letzte offene Frage aus dem Security-Durchlauf – und die einzige, die
eine Produktentscheidung brauchte.

**Vorher:** Wer die Adresse der App kannte, legte sich ein Konto an und las
Teamchat, Personenliste, Aufgaben und Dokumente.

**Jetzt:** zwei getrennt schaltbare Schranken in *Verwaltung → Team*.

| Schranke | Was sie verhindert |
|---|---|
| Firmencode | dass ein Fremder überhaupt ein Konto anlegt |
| Freigabe durch den Chef | dass ein Konto etwas sieht, bevor jemand es bestätigt |

### Die Stelle, an der es leicht falsch geworden wäre

Der naheliegende Weg — den Code ins Profil schreiben — wäre eine Attrappe
gewesen: `users` ist für alle Aktiven lesbar, jeder Kollege hätte ihn
nachschlagen können. Er liegt jetzt in `beitritt/{uid}`, das **niemand**
lesen darf; die Regel vergleicht ihn per `get()`, und das unterliegt den
Regeln nicht.

Zweiter Fallstrick, im Entwurf gefunden: In Firestore gilt **jede**
zutreffende Regel, nicht die speziellste. Die allgemeine `config/{doc}`-
Regel hätte den Code trotzdem für jeden Eingeloggten geöffnet. Jetzt
ausdrücklich ausgenommen.

### Sicherung gegen Aussperren

Beide Schranken sind **aus**, solange sie nicht eingeschaltet werden, und
ein Profil ohne das Feld `aktiv` gilt als aktiv. Ein bestehender Betrieb
merkt von der Änderung nichts. Zwei Tests halten genau das fest.

**52 Regeltests** (von 32), **31 UI-Durchläufe** (von 30) – alle grün.
`signedIn()` ist an 56 Stellen zu `istAktiv()` geworden.

---

## Sitzung 19 · Lasttest in echter Größe 🟢

Bis hierher war alles über das Verhalten bei echten Datenmengen
**geschätzt**. Der Skalierbarkeits-Wert von 5/10 aus dem Motion-Durchlauf
war eine Vermutung, kein Messwert. Jetzt ist er einer.

`tests/stub-last.js` erzeugt den Bestand, der nach ungefähr einem Jahr
Betrieb wirklich in der Datenbank liegt: 14 Studios, 57 Konten, 5.675
Dokumente, 120 Nachrichten je Kanal, 52 Wochensicherungen.
`tests/stress-echt.js` zählt, was ein einziger App-Start davon liest —
**getrennt nach Rolle**, denn 56 von 57 Konten sind kein Chef.

### Gemessen

| Rolle | vorher | nachher |
|---|---|---|
| Mitarbeiter (42×) | 356 | 356 |
| Leitung (14×) | 417 | 413 |
| Chef (1×) | **1.122** | **930** |

Dazu: „bis alles ruhig ist" beim Chef von 2,95 s auf 1,70 s.

Startseite gefüllt: 433 ms · mit vierfach gedrosselter CPU 2,3 s ·
60 Bilder/s beim Scrollen durch 120 Nachrichten · 5 MB Speicher nach drei
Runden durch alle Ansichten · keine Konsolenfehler.

**Die Geschwindigkeit war nie das Problem.** Was auffiel, war zweierlei:

**1. Drei Beobachter hingen am App-Start, die dort nicht hingehören.**
Nachweise, Papierkorb und die 52 Wochensicherungen — zusammen 192
Dokumente, für Karten, die der Chef an den meisten Tagen nicht öffnet. Die
Sicherungen sind die teuersten: jedes Wochen-Dokument enthält alle 14
Studios. Sie laden jetzt beim ersten Öffnen der Ansicht, die sie braucht,
nach dem schon vorhandenen `ensure…Loaded`-Muster.

**2. `maybeArchiveWeek()` lief bis zu zwölfmal am Tag.**
Der Lauf liest Material, Putzplan und Notizen aller 14 Studios: 462
Dokumente. Die Sperre stand auf zwei Stunden — also über 5.000
Lesevorgänge täglich auf dem Gerät des Chefs, für eine *Wochen*-Sicherung.
Jetzt einmal am Tag. Der Knopf „Diese Woche jetzt sichern" geht weiterhin
sofort.

### Was das kostet

| | |
|---|---|
| Lesevorgänge je Tag (57 Konten, 6 Starts) | 129.984 |
| davon frei | 50.000 |
| **Firestore-Lesen je Monat** | **rund 1,32 €** |
| bei fünffacher Datenmenge | 2,69 € |
| Freikontingent reicht für | etwa 21 Konten |

Nicht darin: Speicherplatz, Cloud Functions, KI-Aufrufe, Push und die
nächtliche Sicherung. Die Preise stammen aus der Liste, nicht aus einer
Live-Abfrage — **die verbindliche Zahl steht in der Firebase-Konsole unter
Firestore → Nutzung.** Firestore kann beim Neustart außerdem auf den
lokalen Zwischenspeicher zurückgreifen und nur Änderungen nachladen; wie
oft das greift, lässt sich hier nicht messen.

### Und wieder war mein Messgerät kaputt

Zum sechsten Mal in diesem Audit. Diesmal gleich zweifach:

- Der Stub verstand nur `==`, keine Bereichsfilter. `loadMyShifts()`
  grenzt auf sieben Tage ein — der Stub lieferte trotzdem alles. Aus 224
  Schichten wurden gemessene 1.176, und ein sauberer Code sah nach dem
  größten Kostenposten aus.
- Eine Ansicht schien beim Öffnen 462 Dokumente zu lesen. Das war
  `maybeArchiveWeek()`, das vier Sekunden nach dem Start losläuft und
  zufällig in diesen Messschritt fiel. Der Zähler wartet jetzt, bis er
  stillsteht, bevor er abliest.

Die eigentliche Erkenntnis der Sitzung ist dieselbe wie in Sitzung 14:
**Ein Messwert ist erst dann ein Messwert, wenn das Messgerät geprüft
wurde.** Beide Male hätte ich sonst am falschen Ende optimiert.

### Fingerziele: der Befund war auch falsch

Aus dem Forensik-Durchlauf standen noch „3 Fingerziele unter 44 px" offen.
Alle drei sind Scheintreffer: der Prüfer maß den *eingeklappten* Zustand,
in dem ein `transform:scale(.9)` aus 44 Pixeln 40 macht. Der Prüfer
überspringt jetzt, was gerade gar nicht antippbar ist — und sagt dazu, wie
viel er übersprungen hat, damit der Filter nicht heimlich zu viel
wegnimmt. Ergebnis über alle Ansichten, Rollen und elf Breiten:
**0 Überlauf, 0 Fingerziel, 0 Kontrast, 0 Fokus.**

### Dialoge: die Tastatur kommt jetzt heraus

Sieben Fenster hatten kein `role="dialog"`, keinen Fokus-Käfig und gaben
den Fokus beim Schließen nicht zurück. Escape funktionierte schon. Der
Tabulator wanderte aber weiter durch die Seite *dahinter* — wer den
Fokusrahmen nicht sieht, tippt dann in ein Formular, das gar nicht gemeint
ist.

Nachgeholt an *einer* Stelle statt an sieben: ein Beobachter merkt, wenn
die Klasse `show` kommt oder geht. Dieselbe Liste wie `closeAllModals()`,
damit nicht zwei Listen auseinanderlaufen. Fünf gleichlautende CSS-Blöcke
sind dabei zu einer Regel geworden, der Hintergrund hinter offenen
Fenstern liegt jetzt im Token `--scrim` — im hellen Modus war er vorher
derselbe fast schwarze Wert wie im dunklen.

`tests/test-dialoge.js` drückt zwölfmal Tab und zwölfmal Shift+Tab und
prüft, dass der Fokus jedes Mal noch im Fenster steht, dass Escape
schließt und dass der Fokus danach wieder auf dem Knopf sitzt, der das
Fenster geöffnet hat. Was **nicht** geprüft ist: wie sich ein echtes
Vorleseprogramm verhält. Dafür bräuchte es VoiceOver oder NVDA.

**33 UI-Durchläufe** (von 31), **52 Regeltests** — alle grün.


---

## Sitzung 20 · Design nach deinen Antworten 🟢

Diesmal nicht nach meinem Geschmack, sondern nach vier Fragen und deinen
Antworten: **runder wie Apple-Symbole · deutlichere Kanten · kräftigere
Schrift · mehr Farbkontrast · kräftige Bewegung · kompakter · Apple-Gefühl.**

Zwei deiner Wünsche zogen gegeneinander. Beide sind auflösbar, nicht
widersprüchlich:

| Spannung | Auflösung |
|---|---|
| runder ↔ deutlichere Kanten | Genau das macht Apple: großzügige Rundung **plus** haarscharfe 1-px-Linie. Rundung hoch, Linie von 9 % auf 14 % Deckkraft, Schatten flacher und enger. |
| kompakter ↔ 44-px-Fingerziele | Enger wird das Auge, nicht der Finger. Die unsichtbare `::after`-Trefferfläche gab es schon. |

### Der Fund, mit dem ich nicht gerechnet hatte

`--r-md` und `--r-sm` wurden an **zehn Stellen** benutzt und waren
**nirgends definiert**. Eine undefinierte Variable macht die ganze Angabe
ungültig – Umfragen, Geräteliste, Anhang-Menü und die Aufgaben-Vorlagen
standen mit rechten Winkeln da, während alles daneben rund war. Kein Test
hätte das je gemeldet: es sah nicht kaputt aus, nur anders.

### Was jetzt anders ist

| | vorher | jetzt |
|---|---|---|
| Karten-Rundung | 18 px | 22 px, plus echte Superellipse wo der Browser sie kann |
| Linien | 9 % / 17 % | 14 % / 26 % |
| Schatten | `0 8px 24px` | `0 4px 14px` – flacher, enger |
| Zweitzeilen-Text (dunkel) | `#B4B8C8` | `#C6CAD8` |
| Karten-Innenabstand | 16–24 px | 13–19 px |
| Abstand zwischen Karten | 16 px | 12 px |

Die Apple-Ecke steht hinter `@supports (corner-shape: …)`. Wer sie nicht
kann, sieht die normale Rundung – kein Ersatzweg, kein Risiko. Nachgesehen:
das Chromium hier (141) kann sie, die Bildschirmfotos zeigen sie also
wirklich. **Ob Safari auf dem iPhone sie kann, weiß ich nicht** – dort
greift dann die normale 22-px-Rundung, und der Unterschied fällt nur im
direkten Vergleich auf.

### Bewegung: der gleitende Marker, jetzt überall

Die Kanalreihe im Chat hatte ihn seit Sitzung 18. Jetzt haben ihn alle
vier Stellen: **untere Leiste, Reiter der Gruppe, Kanalreihe,
Verwaltungs-Reiter.** Vorher sprang eine gefüllte Pille von Reiter zu
Reiter – man sah, wo man ankam, aber nicht, woher.

Dazu: Karten laufen über sieben statt vier Stufen ein, der Druck beim
Antippen geht auf `scale(.88)` statt `.9`, und die Zahlen auf den Kacheln
zählen hoch (`hochzaehlen`, aus bei „Bewegung reduzieren", nicht über 60).

**Zwei Fehler beim Bauen, beide durch den Test gefunden:**

- `offsetParent` taugt nicht als Sichtbarkeitsprüfung. Die untere Leiste
  ist `position:fixed`, und dort ist `offsetParent` **immer** `null` –
  mein Marker war damit überall abgeschaltet, auch auf dem Handy.
- Mein eigener Test las `1e-05s` (das sind die `.01ms` aus der
  Ruhe-Regel) als „gleitet trotzdem". Er rechnet jetzt, statt Ziffern zu
  suchen.

`tests/test-marker.js` misst die Marken `--ind-x/-y/-w/-h` gegen
`offsetLeft/Top/Width/Height` des aktiven Reiters – auf zwei Pixel genau,
an allen vier Stellen, nach Wechsel und nach Größenwechsel, und prüft, dass
bei „Bewegung reduzieren" nichts gleitet.

### „Alles erledigt", obwohl der Putzplan voll war 🔴 → 🟢

Aus dem Betrieb gemeldet. Der Grund war schlimmer als die Meldung: die
Startseite zählte `_ppTasks`, und darin stand **nur das Studio, das im
Putzplan gerade geöffnet war**. Beim App-Start: nichts, also „Alles
erledigt". Danach: eins von vierzehn.

Jetzt läuft es wie bei den Aufgaben – ein Beobachter je Studio,
`cachedClean`, und die Putzplan-Seite liest aus demselben Speicher statt
einen eigenen anzulegen. `tests/test-startzahlen.js` legt Putzaufgaben in
**zwei** Studios an, damit ein „zählt nur das erste" auffällt.

### Startseite: „Zum Lesen"

Auch aus dem Betrieb: *„mehr Infos auf der Startseite, zum Beispiel das
schwarze Brett, damit man das nicht überall suchen muss."*

Vorher stand oben nur `📣 2 neue Infos von der Leitung ›`. Worum es ging,
erfuhr man erst nach dem Klicken. Das schwarze Brett lag im Team-Bereich
und wurde überhaupt erst geladen, wenn man dorthin ging.

Jetzt: zwei Karten mit dem **Text**, drei Einträge je Karte, auf drei
Zeilen gekürzt (per CSS, nicht im Text). Und dabei **weniger** auf dem
Bildschirm, nicht mehr: die alte Hinweiszeile ist weg, und ein
angehefteter Aushang steht oben als Hinweis **oder** unten im Text, nie
beides.

### Was das kostet

Ehrlich gerechnet, denn die Korrektur kostet Lesevorgänge:

| | Mitarbeiter | Chef |
|---|---|---|
| vor dieser Sitzung | 356 | 930 |
| Putzplan über alle Studios | +12 | +168 |
| schwarzes Brett auf der Startseite | +12 | +12 |
| **jetzt** | **380** | **1.110** |

Von **1,32 € auf rund 1,55 € im Monat.** Das Brett lädt beim Start nur
zwölf Einträge und erst auf der Team-Seite alle fünfzig – das allein spart
über 13.000 Lesevorgänge am Tag.

### Geprüft

**37 UI-Durchläufe** (von 33), alle grün. Forensik über drei Rollen, zwölf
Ansichten und elf Breiten: **0 Überlauf, 0 Fingerziel, 0 Kontrast,
0 Fokus** – auch nach den neuen Farben.

Dabei noch ein echter Fund: die Leiste mit der angehefteten Nachricht war
38 Pixel hoch, die 44er-Trefferfläche von „ansehen" ragte oben und unten
heraus und wurde vom Chatverlauf abgefangen. Gemessen kam der Finger an
**23 Pixel**. Jetzt `min-height:46px`.

**Nicht geprüft und deshalb nicht behauptet:** wie die neuen Rundungen auf
einem echten iPhone aussehen (Superellipsen kann Chromium hier, Safari
vielleicht anders), und ob „kräftige Bewegung" im Alltag angenehm bleibt.
Das sagt nur der Betrieb nach einer Woche.


---

## Sitzung 21 · Stufe 1: Studios gehören dem Chef 🟢

Der erste Teil aus `MANDANT-PLAN.md`. Die Studioliste stand in
`konfig.js`, also im Code — ein neues Studio hieß: Datei ändern und neu
ausrollen. Jetzt liegt sie in `config/studios`, und der Chef pflegt sie
selbst unter *Verwaltung → 🏢 Studios*.

### Die eiserne Regel

Die Datenbank-Kennung eines Studios hängt an seinem Platz in der Liste.
`studio-6` ist Hürth, weil Hürth an sechster Stelle steht — und daran
hängen alle Aufgaben, Schichten, Putzpläne, Geräte und Chats. Deshalb:

| Handgriff | | |
|---|---|---|
| anlegen | nächste freie Nummer | nie eine wiederverwendete |
| umbenennen | nur der Name | Kennung bleibt |
| schließen | `aktiv:false` | Daten bleiben lesbar |
| löschen | **gibt es nicht** | weder Knopf noch Regel |

Und die Sicherung, damit ein bestehender Betrieb nichts merkt: **fehlt das
Dokument, gilt weiterhin `konfig.js`.** Die Liste wird beim ersten
Speichern genau so angelegt, wie sie heute ist — `studio-0` bis
`studio-13` bleiben gültig, **keine einzige Datenwanderung.**

### Der Fehler, den mein eigener Test gefunden hat

Ich hatte die Wachstums-Sperre in eine eigene Regel geschrieben:

```
match /config/studios {
  allow update: if isChef()
    && request.resource.data.liste.size() >= resource.data.liste.size();
}
```

Grün geprüft, gedacht: sitzt. Der Regeltest sagte: *„auch der Chef kann
die Liste NICHT kürzen — Expected request to fail, but it succeeded."*

Der Grund ist genau der, vor dem ich zwei Stunden vorher in
`MANDANT-PLAN.md` gewarnt hatte: die allgemeine Regel `config/{doc}`
erlaubt dem Chef `write`, und **in Firestore genügt eine zutreffende
Regel, die erlaubt.** Meine Sperre hing in der Luft. Dieselbe Falle wie
beim Firmencode in Sitzung 18, in derselben Datei, ein zweites Mal — und
diesmal hätte sie im Ernstfall Daten dem falschen Studio zugeordnet.

Behoben mit `allow write: if isChef() && doc != 'studios'`. **61
Regeltests** (von 52), alle grün.

### Passwort anzeigen

Ein Auge in jedem der drei Passwortfelder. Zwei Kleinigkeiten, die es
sonst kaputt machen: `type="button"`, sonst sendet der Knopf das Formular
ab — und der Cursor springt nach dem Umschalten ans Ende zurück, sonst
tippt man mitten ins eigene Passwort. Beim Wechsel zwischen den Reitern
wird wieder verborgen; auf einem Studio-Tablet schaut der Nächste mit.

### 🔴 Die Selbstregistrierung war nie erreichbar

Beim Bauen des Passwort-Tests aufgefallen und deshalb hier festgehalten,
weil es peinlich ist: **`setAuthMode('register')` wurde nirgends
aufgerufen.** Das Formular stand auf `display:none`, es gab keine Reiter,
und die CSS-Klasse `.auth-tab` existierte ohne ein einziges Element dazu.

Der ganze Beitritts-Mechanismus aus Sitzung 18 — Firmencode, Freigabe,
Wartebildschirm, Freigabe-Karte für den Chef — war gebaut, geprüft, mit
52 Regeltests abgesichert **und für keinen Menschen erreichbar.** Zwei
Tests haben es nicht gemerkt, weil sie `if (t) t.click()` schrieben: kein
Element, kein Klick, kein Fehler.

Jetzt gibt es die Reiter, und sie erscheinen **nur**, wenn der Chef einen
Firmencode gesetzt oder die Freigabe eingeschaltet hat. Ohne wenigstens
eine Schranke bleibt es beim Satz „Dein Chef legt dein Konto an" — ein
Formular anzubieten, das die Regeln danach abweisen, wäre schlimmer als
keins.

### Geprüft

**38 UI-Durchläufe** (von 36) und **61 Regeltests** — alle grün.

`tests/test-standorte.js` prüft, was Daten kosten könnte: dass ohne
Dokument weiter `konfig.js` gilt, dass ein umbenanntes Studio seine
Kennung behält, dass ein neues die nächste freie bekommt, dass ein
geschlossenes aus den Auswahllisten verschwindet aber in der Liste
bleibt — und dass es keinen Löschen-Knopf gibt.

`tests/test-passwort.js` drückt das Auge, prüft Cursorstellung,
Knopftyp, 44 Pixel bei 320 px Breite und dass nach dem Reiterwechsel
nichts im Klartext stehen bleibt.

**Nicht gebaut und ausdrücklich offen:** E-Mail-Bestätigung, der
ansprechendere Anmeldebildschirm, das Rechtliche — und der eigene Code je
Chef, der Stufe 2 braucht.


---

## Sitzung 22 · Der Rest der Liste 🟢

### Anmeldebildschirm

Der gleitende Marker sitzt jetzt auch auf den Anmeldereitern — **fünf
Stellen, eine Bewegung**: untere Leiste, Gruppenreiter, Kanalreihe,
Verwaltung, Anmeldung. Dazu ein dritter Farbfleck im Hintergrund, die
Felder laufen einzeln statt als Block ein, und das Feld, in dem man
gerade schreibt, hebt sich leicht heraus — auf einem Handy mit
aufgeklappter Tastatur oft der einzige Anhaltspunkt, wo man ist.

### E-Mail-Bestätigung

Beim Anlegen geht eine Bestätigungsmail raus. In der App steht eine
Leiste, solange die Adresse unbestätigt ist, mit „Mail erneut senden".

**Bewusst keine Sperre.** Eine Bestätigungsmail landet regelmäßig im Spam
oder kommt bei Firmen-Postfächern gar nicht an. Wer die App darauf
sperrt, sperrt im Zweifel ein ganzes Studio-Team aus, das gerade
arbeitet. Die Schranke, die wirklich schützt, ist die Freigabe durch den
Chef — **und der sieht jetzt in der Freigabe-Karte, ob die Adresse
bestätigt ist**, bevor er entscheidet.

Das musste über eine Cloud Function laufen (`mailStatus`). Der Grund
steht im Code: `emailVerified` liegt in Firebase Auth, und ein Client
kann es nur für sich selbst lesen. Ein Feld „bestätigt: ja" im eigenen
Profil könnte man selbst hineinschreiben — genau da, wo die Angabe zählen
soll, wäre sie wertlos.

Die Leiste lässt sich wegklicken, das merkt sich das Gerät sieben Tage.
Ein Hinweis, den man einmal wegwischt und nie wiedersieht, ist kein
Hinweis.

### Rechtliches

Impressum und Datenschutz als Fenster, **auch ohne Anmeldung erreichbar**
— ein Impressum hinter einem Login ist keins. Der Inhalt kommt aus
`konfig.js` unter `recht:`, ist also je Kunde austauschbar wie Studios
und Farben.

**Fehlt eine Pflichtangabe, steht das rot über dem Text**, und der Chef
sieht zusätzlich eine Warnkarte in *Verwaltung → System*. Eine App, die
eine leere Seite „Impressum" nennt, sieht erledigt aus — das ist
gefährlicher als gar keine Seite.

Der Datenschutztext beschreibt, was die App **tatsächlich** tut, und ist
am Programm nachprüfbar: welche Felder gespeichert werden, dass
Sprachaufnahmen und Krankmeldungen dabei sind, Region europe-west1,
Aufbewahrungsfristen, wer was sieht. Im Text steht ausdrücklich:
*„Er ist keine anwaltlich geprüfte Datenschutzerklärung."*

`RECHT.md` hält die Grenze fest. Kurzfassung: die vier Pflichtfelder sind
fünf Minuten Arbeit. Die Texte durchsehen, die Absprache mit dem Team zu
Anwesenheitszeiten und Krankmeldungen, das Verarbeitungsverzeichnis und —
**sobald ein Kunde dazukommt** — die Auftragsverarbeitung gehören einem
Anwalt. Drei Punkte hebe ich dort hervor, weil sie im Arbeitsverhältnis
regelmäßig Rückfragen auslösen: Krankmeldungen sind Gesundheitsdaten,
die Anwesenheitsanzeige liest sich als Kontrolle, und Stimme ist ein
biometrisches Merkmal.

### 🔴 Der Regressionslauf prüfte 9 von 38 Durchläufen

Der schwerste Fund dieser Sitzung, und er betrifft mich.

Nach dem Rebase gab `test-navigation.js` aus: *„Chef sieht 7 statt 6
Kacheln"* — und mein Regressionslauf hatte kurz vorher „alles grün"
gemeldet. Grund: der Läufer war ein Einzeiler, der nur den Exit-Code
prüfte. **29 der 38 Durchläufe geben aber gar keinen.** Sie schreiben
„Fehler: …" in die Ausgabe und beenden sich mit 0.

Faktisch geprüft waren neun Durchläufe, gemeldet achtunddreißig.

Der siebte kaputte Messfühler in diesem Audit — und der einzige, der
nicht einen falschen Befund erzeugt, sondern eine **Zusage gedeckt hat,
die es nicht gab.** Die „alle grün"-Meldungen aus Sitzung 19 bis 21 waren
in dieser Form nicht belegt. Ob damals etwas stumm rot war, lässt sich
rückwirkend nicht mehr sagen; der Lauf von heute deckt den aktuellen
Stand ab, und der enthält alle Änderungen von damals.

Behoben:

| | |
|---|---|
| `tests/alle.sh` | kennt vier Fehlersignale statt einem — Exit-Code, `✗`, `Fehler:` mit Inhalt, `PAGEERROR` — und meldet Durchläufe, die **gar nichts** ausgeben |
| alle 38 Durchläufe | setzen jetzt einen Exit-Code |
| `test-navigation.js` | die feste Zahl 6 ist raus; geprüft wird, dass jeder erwartete Reiter genau eine Kachel hat und keine doppelt ist |

Der Befund selbst war harmlos — durch den neuen Studios-Reiter sind es
sieben Kacheln. Aber das wusste ich erst, nachdem ich hingesehen habe.

### Geprüft

`tests/test-recht.js` — Impressum und Datenschutz ohne Anmeldung
erreichbar · Warnung bei fehlenden Pflichtangaben · Angaben stehen drin,
wenn sie da sind · `role="dialog"` und Escape · E-Mail-Leiste erscheint
und lässt sich wegklicken. **Nicht geprüft und deshalb nicht behauptet:
ob die Texte rechtlich vollständig sind.** Das kann kein Test
beantworten.

Dabei kam noch ein Fund heraus: das Dialog-System lief erst **nach** dem
Login. Der Anmeldebildschirm hatte also weder `role="dialog"` noch
Escape — beim Rechtliches-Fenster fällt das auf, weil es dort steht.

`tests/stub-ohne-login.js` ist neu: eine Firebase-Attrappe, die
*niemanden* anmeldet. `stub-chef.js` meldet sofort einen Chef an, damit
kommt man nie an den Anmeldebildschirm — und genau das hat verdeckt, dass
die Selbstregistrierung nie erreichbar war.


---

## Das Audit ist abgeschlossen

Dreizehn Sitzungen, zehn Bereiche, 30 automatische Durchläufe, zwölf
zusammengeführte Änderungssätze.

**Und es ist nichts mehr offen.** Am 9. August sind auch die letzten
Handgriffe aus `DEIN-TEIL.md` erledigt worden:

| Was | Beleg |
|---|---|
| Speicher `europe-west1`, beide Rollen | erste Sicherung durchgelaufen: `sicherung/manuell-2026-08-09-01-28-53` |
| Budget-Warnung | 0 €, meldet beim ersten Cent |
| `MATERIAL-SHEETS.gs` neu bereitgestellt | bestehende Bereitstellung bearbeitet, Adresse unverändert |
| Wischen zum Abhaken im Putzplan | am echten Gerät bestätigt |

Damit ist auch der letzte Punkt geschlossen, der seit Monaten in `OFFEN.md`
stand — und der einzige, den kein automatischer Durchlauf je hätte prüfen
können: eine Berührung auf einem echten Bildschirm.

---

## Sitzung 23 · Mehrere Firmen in einer App 🟢

Die Frage, die diese Sitzung ausgelöst hat: *„Wie läuft das ab, wenn ich
es einem Kunden verkaufe? Der sieht ja nur meine Studios."* Antwort: gar
nicht — bis jetzt. Gebaut wurde eine **vierte Ebene über allem**, damit
jeder Kunde seine eigenen Studios benennt und keiner die Daten des
anderen sieht.

### Was der Reihe nach entstanden ist

| | Was | Zustand |
|---|---|---|
| **1** | Studios kommen aus der Datenbank statt aus dem Code — der Chef benennt sie selbst | ✅ |
| **2A** | Jeder Datenzugriff der App läuft durch **eine** Funktion `S()` | ✅ 114 Stellen |
| **2B** | `firma` am Konto, Kennung im Link, Regeln, 21 Kreuztests | ✅ |
| **2C** | Umzugs-Werkzeug, Probelauf an echten Daten | ✅ im Probe-Projekt |
| **2D** | Admin-Oberfläche: Firmen anlegen, sperren, zählen | ✅ |
| **2E** | Die **Cloud Functions** auf dieselben Pfade bringen | ✅ |
| **Live** | Der Umzug der echten Daten | **steht noch aus** |

Alles Weitere dazu steht in `MANDANT-PLAN.md`. Hier nur, was man wissen
sollte, ohne es zu lesen.

### Die Entscheidung, die den Verkauf trägt

Der Admin sieht **Firmennamen und Zahlen — keine Inhalte.** Keinen Chat,
keine Aufgabe, keinen Namen eines Mitarbeiters. Es gibt bewusst keinen
Knopf „als Chef ansehen", obwohl er leicht zu bauen wäre. Der Grund ist
ein Satz, der im Verkaufsgespräch stimmen muss: *„Ich komme an Ihre Daten
nicht heran."* Ein Knopf, der das Gegenteil kann, macht diesen Satz zur
Lüge — auch wenn ihn nie jemand drückt.

Das Passwort einer neu angelegten Firma wird **einmal** angezeigt und
nirgends gespeichert.

### Zwei Dinge nebenbei, die du direkt merkst

**Ein Chef kann einem anderen Chef die Rechte nicht mehr entziehen.** Der
Knopf ist weg, und die Regel dahinter auch — nicht nur die Anzeige. Wer
sein eigenes Konto verwaltet, sieht dort jetzt „geschützt".

**Das Passwort lässt sich beim Anmelden ansehen**, und beim Anlegen eines
Kontos geht eine Bestätigungsmail raus.

### Der Fehler dieser Sitzung

Ich habe in Stufe 2A gezählt: „114 Zugriffe in `index.html`" — und
`functions/index.js` nie mitgezählt, obwohl mein eigener Plan sie
ausdrücklich nennt. **Vier Stufen lang habe ich an meinem Plan
vorbeigearbeitet.**

Was das bedeutet hätte: nach dem Umschalten wäre die App tadellos
gewesen, und im Hintergrund nichts mehr passiert. Keine Push-Nachricht,
keine Erinnerung an überfällige Aufgaben, keine Warnung vor ablaufenden
Nachweisen, kein Monatsbericht. Ohne eine einzige Fehlermeldung.

Aufgefallen ist es, weil ich vor dem Live-Umzug noch einmal nachgesehen
habe, statt ihn zu starten. Der Umzug wurde deshalb **abgebrochen, bevor
er lief** — das ist der einzige Grund, warum hier „gebaut" statt
„repariert" steht.

Gegen die Wiederholung stehen jetzt zwei Prüfer: einer, der die
Functions wirklich **ausführt** (53 Prüfungen gegen den Emulator), und
einer, der die Datei Zeile für Zeile liest und bei jedem flachen Zugriff
anschlägt — auch bei einem, der erst morgen dazukommt. Denn mein Fehler
war kein falscher Pfad, sondern eine **vergessene Datei**, und dagegen
hilft kein Verhaltenstest: der prüft nur, woran jemand gedacht hat.

### Was jetzt gilt

| | |
|---|---|
| UI-Durchläufe | 42 |
| Regeltests | 105 |
| Umzugs-Prüfungen | 12 |
| Cloud-Function-Prüfungen | 53 |

**Im Betrieb ist noch nichts umgestellt.** `KONFIG.mandant` steht auf
`false`, die App läuft auf den flachen Pfaden wie immer. Der ganze Umbau
ist gebaut und geprüft, aber noch nicht scharfgeschaltet — das ist der
nächste Schritt, und er ist der einzige mit echtem Risiko.

---

## Sitzung 24 · Der Umzug — und was der erste echte Kunde gebraucht hätte 🟢

Der Umzug auf die Firmen-Pfade ist gelaufen: **156 Dokumente**,
Zählprüfung sauber, die App liest sie seit dem 10.8. um 23:15 Uhr.
Danach kamen drei Fragen aus der Praxis, und zwei davon deckten Fehler
auf, die im Verkaufsgespräch teuer geworden wären.

### Was jetzt geht

| | |
|---|---|
| **Studiozahl beim Anlegen** | 1 bis 50, Voreinstellung 1. Nicht jeder hat vierzehn. |
| **Neutrale Namen** | „Studio 1", „Studio 2" … — die richtigen trägt der Kunde selbst ein |
| **Firma löschen** | wandert ins Archiv, Daten bleiben liegen, ein Klick holt sie zurück |

### Der Fund, den du gemacht hast

„Sonst weiß ja jede Firma, was meine Firma hat" — **genau so war es.**
Eine neu angelegte Firma hatte keine eigene Standortliste, und die App
fiel dann auf die Liste aus `konfig.js` zurück. Das sind die vierzehn
Standorte von Körperformen. Der neue Kunde hätte beim allerersten
Anmelden die Standortliste eines fremden Betriebs vor sich gehabt.

Kein Datenleck im engeren Sinn — die Namen stehen auch auf eurer
Webseite. Aber es sagt dem Kunden das Gegenteil von dem, was du ihm
verkaufst.

### Der Fund, den ich dabei gemacht habe

**„Sperren" hat nie etwas gesperrt.** Der Knopf setzte ein Häkchen am
Firmeneintrag, und ausser den nächtlichen Abläufen hat nie jemand
hineingesehen — weder die Sicherheitsregeln noch die App. Der gesperrte
Kunde konnte weiterarbeiten wie vorher.

Im Bestätigungsfenster stand dabei wörtlich: *„Niemand aus diesem
Betrieb kommt danach mehr hinein."* Das war schlicht unwahr.

Warum es niemandem auffiel: **es gab keinen Test dafür.** Jetzt gibt es
zehn. Und die Gegenprobe ist gelaufen — nimmt man die neue Regel wieder
heraus, fallen genau die vier Zugriffsprüfungen um. Vorher kam der
gesperrte Chef also wirklich überall hin.

### Und ein Prüfer, der sich selbst überführt hat

Der Test gegen das Standort-Leck war beim ersten Anlauf **grün — und
wertlos.** Er schaute auf den sichtbaren Text des Anmeldebildschirms,
und die Standortliste ist dort ausgeblendet, bis man auf „Konto anlegen"
geht. Er hat also nichts gesehen und das für „nichts da" gehalten.

Aufgefallen ist es nur durch die Gegenprobe daneben: die eigene Firma
*muss* ihre Standorte sehen. Als die auch leer war, stand fest, dass die
Messung nichts taugt.

Dieselbe Gegenprobe deckte danach auf, dass meine Reparatur gar nicht
wirkte — die Funktion, die die Liste setzt, weist leere Listen ab (damit
ein kaputtes Dokument nicht die Standorte wegräumt). „Keine Studios" war
damit gar nicht ausdrückbar.

**Zwei Fehler, beide gefunden von einer Zeile, deren einzige Aufgabe es
ist, zu prüfen, ob der Test überhaupt etwas prüft.**

### Was jetzt gilt

| | |
|---|---|
| UI-Durchläufe | 43 |
| Regeltests | 115 |
| Umzugs-Prüfungen | 12 |
| Cloud-Function-Prüfungen | 69 |

---

## Sitzung 25 · Das Abo — und drei Punkte aus dem Betrieb 🟢

Zwei Stränge in einer Runde. Der erste beantwortet die Frage, wie aus
der App ein Geschäft wird. Der zweite kommt aus dem Alltag im Studio
und ist der kleinere, aber der dringendere.

### Das Abo-Modell

Entschieden ist: **je Studio**, nicht je Mitarbeiter. Ein Studio mit
vier Teilzeitkräften zahlt sonst mehr als eines mit zwei Vollzeitkräften,
obwohl es dieselbe App benutzt — und der Chef fängt an, Zugänge zu
sparen. Genau das Verhalten, das die App unbrauchbar macht.

Gebaut ist bisher **Stufe A und B**:

| | |
|---|---|
| **Stufe A** | Abo je Firma von Hand setzen: Stufe, Zustand, Betrag, Laufzeit |
| **Gratis-Abo** | eigener Zustand, kein Betrag daneben — für deinen Chef |
| **Stufe B** | Basic grenzt zwei Bereiche ab: Nachweise und Monatsbericht |

Nicht gebaut, bewusst: Stripe, automatische Mahnungen, Selbstbedienung.
Das steht als Stufe C bis E in `ABO-PLAN.md`. Es soll noch nicht live
gehen, und deshalb geht es das auch nicht.

Der Abo-Zustand liegt unter `firmen/<kennung>/abo/aktuell` und **nicht**
am Firmeneintrag selbst. Der ist öffentlich lesbar, damit der Name auf
dem Anmeldebildschirm stehen kann — Preise gehören dort nicht hin.

### Der Fehler, den du gefunden hast

„Wenn ich da am Abo was ändere, wird ein Fenster geöffnet, was auch
nicht verschwindet." **Das Fenster stand dauerhaft mitten in der Seite.**

`#aboModal` fehlte in allen sechs CSS-Regeln der Fenster und hatte damit
nie ein `display: none`. Die Klasse `show` sass völlig richtig — sie
hatte nur keine Wirkung.

Und mein Test war grün, weil er `classList.contains('show')` geprüft
hat. **Ich habe den Schalter gemessen statt das Licht.** Er misst jetzt
die Sichtbarkeit, und zwar in drei Zuständen — der wichtigste ist der
erste: *vor* dem Klick muss es zu sein. Genau das war der Fehler.

### Drei Punkte aus dem Studio-Alltag

Alle drei haben denselben Ursprung: am Anfang bekommt nicht jede Person
einen Zugang, sondern **jedes Studio einen**. Damit steht unter jedem
Haken derselbe Name.

**1. Kürzel im Putzplan.** Ein Feld „Wer hakt ab?" über der Liste —
einmal oben, nicht bei jedem Haken einzeln. Zwölf Punkte einzeln tippen
wäre der sichere Weg, dass es niemand ausfüllt. Das Kürzel bleibt auf
dem **Gerät**, wie ein Namensschild zum Schichtbeginn: das Konto gehört
dem Studio, das Kürzel der Person, die gerade da ist. Es **ergänzt** den
Kontonamen, ersetzt ihn nicht.

**2. Grund an offenen Aufgaben.** Optional, mit Wer und Wann. Er steht
**in der Liste**, nicht nur im Blatt dahinter — der Chef öffnet nicht
jede offene Aufgabe einzeln, er scrollt. An einer erledigten Aufgabe
gibt es kein Grundfeld; ein stehengebliebener Grund führt in die Irre.

**3. Tägliche statt wöchentliche Sicherung.** `dailyArchive`, 23:45,
je Firma, mit Material, Putzplan (inkl. Kürzel) und neu den Aufgaben
samt Grund. Zwei Entscheidungen dahinter:

- **Abends, nicht morgens.** Eine Aufnahme am Morgen hält korrekt fest,
  dass noch nichts getan wurde.
- **Auf dem Server, nicht im Browser.** Der wöchentliche Lauf kostete
  **462 Lesezugriffe auf dem Gerät des Chefs**. Jetzt ist es eine
  Existenzprüfung; geschrieben wird im Gerät nur noch, wenn der Server
  nichts abgelegt hat.

### Meine eigenen Fehler in dieser Runde

- Der Grund-Block landete zuerst im **Dokument**-Blatt statt im
  Aufgaben-Blatt. Der Anker `blatt.classList.add('show')` kommt mehrfach
  vor, und ich hatte das erste Vorkommen erwischt.
- Meine Tabelle „Premium gegen Basic" war **zweimal falsch** — aus dem
  Kopf geschrieben statt aus der App gelesen. Das Geräte- und
  Schadensbuch ist eine Team-Ansicht, und die KI-Funktionen haben gar
  keine Oberfläche.
- Der neue Test landete auf Brühl, wo die Testdaten keinen Putzplan
  haben, und meldete „kein Putzpunkt da" — das sah nach einem Fehler in
  der App aus und war einer im Testaufbau.

### Was jetzt gilt

| | |
|---|---|
| UI-Durchläufe | 48 |
| Regeltests | 132 |
| Umzugs-Prüfungen | 12 |
| Cloud-Function-Prüfungen | 79 |

Ausgerollt am 11.8. um 16:14 Uhr. `dailyArchive` steht im Deploy-
Protokoll als *Successful create* — die geplante Aufgabe existiert also
wirklich, sie wurde nicht nur hochgeladen.

### Nachgereicht: das Kürzel in der Google-Tabelle

Meine Rückfrage war berechtigt und die Antwort eindeutig: „das da auch
die kürzel sind". Gemeint war die **Google-Tabelle**, und die hatte ich
nicht angefasst.

Jetzt hat sie eine eigene Spalte **„Kürzel"** — im Putzplan zwischen
„Erledigt von" und „Zeitpunkt", bei den Notizen zwischen „von" und
„Zeitpunkt". Eine eigene Spalte statt „AB (Studio Hürth)" in einer
gemischten Zelle, weil man nur so danach **filtern und sortieren** kann.
Genau dafür ist sie da: einmal alles sehen, was eine Person gemacht hat.

Notizen hatten bisher gar kein Kürzel. Das ist mitgezogen — unter einer
Notiz stand sonst derselbe Studio-Zugang wie überall.

**Der heikle Teil war der Umbau der schon gefüllten Tabelle.** Eine
Spalte mitten hinein zu setzen und die alten Zeilen stehen zu lassen,
hätte den Zeitpunkt unter „Kürzel" geschoben. Falsch — aber plausibel
aussehend, und deshalb schlimmer als ein sichtbarer Fehler. Zugeordnet
wird darum über den Spalten**namen**, nicht über die Position.

Die Gegenprobe steht: mit absichtlich positionsbasierter Zuordnung
meldet der Durchlauf genau das.

```
✗ DER FEHLER, UM DEN ES GEHT: bei einer alten Zeile steht etwas
  unter „Kürzel", das keins ist (04.08.2026, 18:00)
```

**Was ich hier nicht prüfen kann:** `tests/test-sheets-kuerzel.js` führt
den Code in einer nachgebauten Tabelle aus, nicht in Google Apps Script.
Er belegt die Logik, nicht das Zusammenspiel mit Google. Und die Tabelle
ändert sich erst, wenn das Skript **neu bereitgestellt** wird — das ist
ein Handgriff, der nur bei dir möglich ist.

---

## Sitzung 26 · Funktionen an- und abschalten 🟢

„Der Schichtplan und der Abwesenheitsplan sind für unser Studio unnötig,
andere würden es brauchen."

Das ist etwas anderes als das Abo. Das Abo sagt, wofür bezahlt wurde;
diese Schalter sagen, was ein Betrieb überhaupt benutzt. Eine App, die
zur Hälfte aus ungenutzten Seiten besteht, wirkt nicht reichhaltig,
sondern unaufgeräumt — und beim ersten fremden Kunden ist genau das der
Moment, in dem er aufgibt.

### Zwölf Schalter, Verwaltung → System → 🧩 Funktionen

| | |
|---|---|
| Ganze Seiten | Teamchat, Direktnachrichten, Infos, Aufgaben, Putzplan, Material, Geräte, Dokumente |
| Im Team-Bereich | Schichtplan, Abwesenheiten, Übergabe, Schwarzes Brett |

**Abgeschaltet heisst überall weg**, nicht nur in der Navigation: aus der
unteren Leiste, von den Kacheln und Hinweisen der Startseite, aus dem
Chef-Überblick, aus den Team-Reitern samt der Seite dahinter — und aus
dem Verwaltungsbereich.

Der letzte Punkt war ein echtes Loch. „Neue Aufgabe erstellen" liegt
beim Chef, nicht in der Aufgabenansicht. Ohne diese Zeile hätte er
weiter Aufgaben angelegt, während für das Team die ganze Ansicht
abgeschaltet ist — sie wären in der Datenbank gelandet und niemand hätte
sie je gesehen.

### Vier Entscheidungen

- **Voreinstellung ist alles an.** Ein Kunde, dem die Hälfte fehlt, weil
  irgendwo ein Feld leer ist, wäre der schlechtere Fehler. Dieselbe
  Überlegung wie beim Abo.
- **Es wird nichts gelöscht.** Wieder einschalten bringt alles
  unverändert zurück. Ein Schalter, den man nicht gefahrlos drücken
  kann, wird nie gedrückt.
- **Die Team-Seite hat keinen eigenen Schalter.** Sie verschwindet, wenn
  kein Reiter mehr übrig ist. Ein zusätzlicher Schalter hätte einen
  Zustand erlaubt, den niemand erklären kann: Team an, alles darin aus.
- **Die Erinnerung um 7:30 Uhr prüft mit.** Ein Handy, das wegen einer
  Aufgabe brummt, die es in der App gar nicht mehr gibt, macht den
  Schalter zur Lüge.

### Was diese Schalter ausdrücklich NICHT sind

Sie räumen auf, sie sperren nicht. Wer sich auskennt, kommt an die Daten
dahinter weiterhin heran — `config/features` ist für jeden Eingeloggten
lesbar, weil die App es beim Start braucht. Für echte Grenzen sind die
Rollen und die Regeln da.

Das steht so in der App unter den Schaltern, im Quelltext und hier.
Dieselbe Ehrlichkeit wie bei der Auswertung unter Basic: eine
Bequemlichkeit, kein Riegel.

### Der Fehler, den die Gegenprobe gefunden hat — meiner

Mein erster Prüfer für die „Hintertür" war **grün, ohne etwas zu
prüfen.** Er setzte den gemerkten letzten Stand auf eine abgeschaltete
Ansicht und stellte fest, dass die App die Startseite zeigt. Nur: dieser
Weg greift im Testaufbau überhaupt nicht — nachgemessen an der Fassung
von **vor** dieser Runde, wo es den Wächter noch gar nicht gab. Das
Ergebnis war dasselbe.

Aufgefallen ist es nur, weil ich den Wächter versuchsweise entfernt habe
und der Durchlauf trotzdem grün blieb. Jetzt läuft die Prüfung über die
**Zurück-Taste**, die wirklich auslöst.

Mit entfernten Wächtern meldet der Durchlauf **zwölf** Fehler statt
keinem.

### Was jetzt gilt

| | |
|---|---|
| UI-Durchläufe | 49 |
| Regeltests | 136 |
| Umzugs-Prüfungen | 12 |
| Cloud-Function-Prüfungen | 79 |

Nicht geprüft: ob auf dem Server wirklich keine Erinnerung hinausgeht.
Im Emulator gibt es keine Empfänger, an die etwas gehen könnte — belegt
ist der Aufruf im Code, nicht das Ausbleiben auf einem Gerät.

---

## Sitzung 27 · Fehler im Betrieb werden sichtbar 🟢

Bisher galt: wenn bei einem Mitarbeiter etwas nicht lädt, erfährt es
niemand. Er sagt es vielleicht — vielleicht auch nicht. Und bei **einem
Zugang je Studio** weiss hinterher ohnehin keiner mehr, wer davorstand.

Jetzt landet so etwas still in der Datenbank, und der Chef sieht es
unter **Verwaltung → System → 🐞 Fehler im Betrieb**: Text, Ansicht,
Person, Stelle im Quelltext und wie oft. Ein Knopf „erledigt" räumt den
Eintrag weg.

### Vier Entscheidungen

- **Kein Toast, nichts Rotes für den Mitarbeiter.** Wer arbeitet, soll
  arbeiten. Eine technische Meldung, die niemand versteht, macht nur
  Angst und ändert nichts.
- **Gleiche Fehler werden gezählt, nicht aneinandergereiht.** Ein
  kaputter Bildschirm feuert sonst hundertmal, und die Liste ist nach
  einer Minute wertlos. Dazu höchstens fünf verschiedene je Sitzung.
- **Rauschen bleibt draussen.** „Script error." und die
  ResizeObserver-Schleife sagen nichts; Netzfehler sind kein Fehler,
  sondern ein Zug. Wer das mitsammelt, hat nach einer Woche eine Liste,
  die niemand mehr aufmacht.
- **Melden darf jeder, lesen nur der Chef.** Sonst würde ausgerechnet
  der Fehler nicht gemeldet, der einen Mitarbeiter trifft. Und in einer
  Meldung steht, wer sie ausgelöst hat und was er gerade tat — das ist
  nichts fürs ganze Team.

### Zwei eigene Fehler, beide erwähnenswert

**Mein `try/catch` hat einen echten Programmierfehler still
verschluckt.** Im Testaufbau fehlte `FieldValue.increment`, die Meldung
stolperte darüber, und das `catch` schluckte es lautlos. Der Durchlauf
meldete „wird gar nicht gemeldet" — richtig, aber aus dem falschen
Grund. Ausgerechnet bei einer Fehlermelde-Funktion Fehler zu
verschlucken ist der passendste Fehler dieser Runde. Jetzt schreibt das
`catch` eine Zeile in die Konsole.

**Und mein Testaufbau hat einen Fehler gemeldet, den es nicht gab:** er
wickelte denselben Schreibaufruf doppelt ein und zählte damit jeden
Vorgang zweimal. Ich war schon dabei, in der App nach der Ursache zu
suchen. Gefunden hat es eine Gegenprobe über die Konsole: der Auslöser
feuert genau einmal, geschrieben wurde zweimal — also lag es am
Messgerät, nicht am Gemessenen.

Dieselbe Verwechslung ein zweites Mal: die Prüfung der Obergrenze zählte
Schreib**vorgänge** statt Mel**dungen** und meldete „ohne Bremse", wo
die Bremse sauber griff.

### Gegenprobe

Mit entfernten Wächtern (Rauschfilter, Bremse, Sammeln) meldet der
Durchlauf drei Fehler statt keinem.

### Was jetzt gilt

| | |
|---|---|
| UI-Durchläufe | 50 |
| Regeltests | 143 |
| Umzugs-Prüfungen | 12 |
| Cloud-Function-Prüfungen | 79 |

---

## Sitzung 28 · Die Sicherung sagt jetzt die Wahrheit 🟢

Der Knopf hiess **„⬇️ Alles als Daten-Datei"** und lud die Hälfte:
Aufgaben, Material, Team und Infos. Nicht dabei waren Chat, Putzplan,
Geräte, Schichten, Abwesenheiten, Übergaben, Brett, Dokumente und
Nachweise.

An einer **Sicherungs**funktion ist das die unangenehmste Stelle für
eine Halbwahrheit: sie fällt erst an dem Tag auf, an dem man die Datei
braucht — also wenn ohnehin schon etwas schiefgegangen ist.

### Was jetzt drin ist

Alles, was der Chef lesen darf: Aufgaben **mit Grund**, Material,
Putzplan **mit Kürzeln**, Putz-Notizen, Chat aller öffentlichen Kanäle,
Geräte mit Verlauf, Schichten, Abwesenheiten, Übergaben, Schwarzes
Brett, Team, Infos, Dokument-Angaben und Nachweise.

### Was bewusst fehlt — und das steht in der Datei

| Nicht enthalten | Warum |
|---|---|
| **Direktnachrichten** | Die gehören zwei Personen, nicht dem Betrieb. Der Chef darf sie nach den Regeln gar nicht lesen. Keine Lücke, sondern der Sinn |
| **Inhalt hochgeladener Dateien** | Liegt als Base64 in der Datenbank und würde die Datei vervielfachen. Dafür ist die nächtliche Datenbank-Sicherung da |
| **Fehlerberichte, Push-Kennungen** | Technik, keine Betriebsdaten |

Der eigentliche Punkt: **eine Sicherung mit einer bekannten Lücke ist
brauchbar, eine mit einer unbekannten ist gefährlich.** Deshalb steht in
jeder Datei ein Verzeichnis — im JSON ganz oben, im Excel als erste
Tabelle. War beim Zusammenstellen etwas nicht lesbar, wird auch das dort
vermerkt statt still weggelassen. Der Chat ist auf die neuesten 1000
Nachrichten je Kanal begrenzt; auch das steht dort.

### Eine Lücke im Testaufbau, keine in der App

Der Chat war beim **einmaligen Lesen** leer, obwohl er beim Mitlauschen
da ist — im Testaufbau fehlte der Zweig für `channels/…/messages` in
`get()`. Hätte ich das nicht nachgesehen, hätte ich in der App nach
einer Ursache gesucht, die es nicht gibt. Dritte Verwechslung dieser
Art an einem Abend; alle drei sind in den Prüfern vermerkt.

### Gegenprobe

Mit der alten, halben Sicherung meldet der neue Durchlauf vier Fehler
statt keinem — darunter der wichtigste: *„die Datei sagt nicht, was
NICHT drin ist — genau das war der alte Fehler."*

### Was jetzt gilt

| | |
|---|---|
| UI-Durchläufe | 51 |
| Regeltests | 143 |
| Umzugs-Prüfungen | 12 |
| Cloud-Function-Prüfungen | 79 |

---

## Sitzung 29 · Das Impressum gehört dem Betreiber 🟢

`KONFIG.recht` galt für das **ganze Firebase-Projekt**. Das war richtig,
solange ein Kunde ein eigenes Projekt bekam. Seit mehrere Firmen in
einer Datenbank liegen, ist es falsch: der zweite Kunde sähe entweder
das Impressum von Körperformen oder eine rote Warnung, die ihn an eine
Datei schickt, an die er gar nicht herankommt. Und impressumspflichtig
ist jeder Betreiber selbst — das kann ihm niemand abnehmen.

Jetzt liegen die Angaben je Firma unter `config/recht`, und der Chef
pflegt sie unter **Verwaltung → System → ⚖️ Rechtliche Angaben**.

### Zwei Entscheidungen

- **Der Rückfall auf `konfig.js` bleibt — aber nur für die eigene
  Firma.** Sonst stünde der eigene Betrieb am Tag der Umstellung ohne
  Impressum da. Für eine fremde Firma kommt bewusst nichts heraus:
  lieber die ehrliche Warnung als die Angaben eines anderen Betriebs.
  Genau dieser Fehler ist bei der Studioliste schon passiert.
- **Das Dokument gilt als Ganzes oder gar nicht.** Einzelne leere Felder
  werden nicht aus `konfig.js` nachgefüllt — sonst entstünde aus zwei
  Betrieben ein drittes Impressum, das es nirgends gibt.

### Diese Runde hat ein Agent gebaut

Beauftragt mit dem vollen Kontext: die Fallen dieses Projekts (jede
zutreffende Regel gilt; beide Regelzweige pflegen; Rückfall nur für die
eigene Firma), Gegenprobe als Pflicht, nichts erfinden, nicht committen.

**Er hat sauber gearbeitet und an der richtigen Stelle Halt gemacht.**
Statt eine Sicherheitsregel eigenmächtig weiter aufzumachen, hat er den
Punkt als Frage vorgelegt: er hatte das Lesen auf Angemeldete
beschränkt, wie beauftragt — und selbst angemerkt, dass das dem Satz
widerspricht, der im Quelltext steht: *„Ein Impressum hinter einem Login
ist keins."*

### Was ich daraufhin ergänzt habe

**1. Öffentlich lesbar**, wie es `config/studios` und
`config/beitrittSchalter` aus demselben Grund schon halten. § 5 DDG
verlangt „leicht erkennbar, unmittelbar erreichbar", und der Inhalt ist
per Definition öffentlich: Name, Anschrift, Vertretung, Telefon, E-Mail.
Beim **Schreiben** endet die Nachbarschaft — Chef A darf das Impressum
von B nicht überschreiben.

**2. Das Stück, ohne das die Regel nichts genützt hätte:** die Angaben
wurden **vor dem Anmelden gar nicht geladen**. `rechtLaden()` lief erst
in `showApp()`. Bei der eigenen Firma wäre das nie aufgefallen, weil
dort `konfig.js` einspringt — dieselbe Blindstelle wie beim
Standort-Leck: ein Fehler, den nur der erste fremde Kunde bemerkt hätte.

Gegenprobe dafür:

```
✗ DAS IMPRESSUM HINTER DEM LOGIN: eine fremde Firma zeigt ihre Angaben
  vor dem Anmelden nicht — genau dann, wenn sie gebraucht werden
```

### Was jetzt gilt

| | |
|---|---|
| UI-Durchläufe | 52 |
| Regeltests | 158 |
| Umzugs-Prüfungen | 12 |
| Cloud-Function-Prüfungen | 79 |

Alle Zahlen selbst nachgemessen, nicht aus dem Bericht des Agenten
übernommen.

---

## Sitzung 28 · Der Sicherheits-Durchlauf 🔴🟢

Auftrag: *„schauen wie man sich theoretisch rein hacken könnte und diese
Lücken dann schliessen."* Geprüft wurde gegen Emulator und Quelltext —
nichts Echtes wurde angegriffen, und was nicht messbar war, steht unten
als solches.

**Vier Funde. Alle vier waren Firmengrenzen.** Genau die Linie, die
diese App am teuersten überschreiten kann — und alle vier wären erst
beim ersten fremden Kunden sichtbar geworden. Das ist der schlechteste
denkbare Zeitpunkt.

### 🔴 Neue Konten landeten in der falschen Firma

Der ernsteste Fund, und er kam nicht aus der Prüfliste, sondern aus
einer Zahl im Betrieb. Die Karte „Konten ohne Firma" meldete *7 ohne
Feld*. Die Frage dahinter — **warum haben sieben kein Feld, wenn die
Umstellung längst durch ist?** — führte direkt darauf:

Weder „Zugang anlegen" noch die Selbstregistrierung schrieben `firma`.
Und ein fehlendes Feld gilt überall als *koerperformen*:

```
inFirma(f) := meineFirma() == f || (meineFirma() == '' && f == 'koerperformen')
```

Ein Kunden-Chef hätte damit Mitarbeiter angelegt, **die in fremde Daten
zeigen**. Kein Leseleck — ein Schreibweg in die falsche Firma.

### 🔴 Jeder sah jedes Konto jeder Firma

`users` ist die einzige Sammlung, die nicht unter `firmen/<kennung>/`
liegt. Beim Schreiben stand die Firmenprüfung, beim Lesen nicht. Und die
App horchte von selbst ungefiltert auf die ganze Sammlung.

Gemessen, bevor es repariert wurde:

```
Mitarbeiter von Alpha liest das Konto des Chefs von Beta: true
  gelesen: {"name":"Chef B","role":"chef","firma":"beta",
            "email":"chef@beta-kunde.de","bday":"1985-03-04"}
Ganze users-Sammlung lesbar? Dokumente: 2
```

Die Reparatur brauchte drei Teile, die nur zusammen funktionieren:
strenge Regel, gefilterte Abfrage, und das Feld an **jedem** Konto.
Firestore prüft Abfragen im Voraus, nicht Dokument für Dokument — ohne
den Filter hätte die Regel die ganze Abfrage abgelehnt und das Team
stünde vor einer leeren Personenliste.

### 🟠 Jeder Chef konnte die ganze Datenbank exportieren

`backupNow` prüfte „ist Chef". `exportieren()` zieht aber alles
(`collectionIds: []`), also alle Kunden auf einmal — und überschrieb
über `sicherungStatus()` den Sicherungsstand *jeder* Firma. Die Daten
waren nie in Gefahr: der Speicher ist für jeden Client gesperrt. Es ging
um Kosten, den fremden Anstoss und eine falsche Anzeige.

### 🟡 `mailStatus` prüfte die Rolle, nicht die Firma

Ein Chef konnte beliebige Kennungen übergeben und erfuhr, ob es das
Konto gibt und ob dessen E-Mail bestätigt ist. Schwer auszunutzen —
aber es ist die Firmengrenze.

### ⚪ Bewusst so belassen

`appointments` enthält Kundennamen und ist für jeden aktiven
Mitarbeiter lesbar und änderbar. Vorgelegt, vom Betreiber entschieden:
im Studio machen alle Termine. Steht jetzt mit Begründung in den Regeln,
damit es beim nächsten Durchlauf nicht wieder als „ungeklärt" hochkommt.

### Der eigentliche Ertrag: `tests/rules/kreuz.test.js`

Der bisherige Sicherheits-Durchlauf prüfte die Firmengrenze an **sieben**
Sammlungen. Im Firmen-Zweig der Regeln stehen **zweiunddreissig**. Die
restlichen fünfundzwanzig waren nicht falsch — sie waren **nie
nachgewiesen**. Das ist ein Unterschied, den man erst merkt, wenn es zu
spät ist.

Jetzt läuft eine Schleife über alle, viermal je Sammlung. Der vierte
Punkt ist der wichtigste: **die Gegenrichtung.** Ein Kreuztest auf einem
falsch geschriebenen Pfad ist immer grün — niemand kommt an ein
Dokument, das nirgends liegt.

### Die Reihenfolge, die nicht verhandelbar war

Der Betreiber hatte keinen Zugang zur Cloud Shell. Ein Wartungsschritt,
der einen Rechner mit Google-Zugang voraussetzt, findet irgendwann nicht
statt — also wurde daraus ein Knopf (`kontenNachtragen`, Verwaltung →
Firmen). Damit verschob sich die Reihenfolge, und die `users`-Reparatur
musste **wieder aus dem PR heraus**:

1. Knopf ausrollen → 2. nachtragen → 3. Regel scharf stellen.

In der Zwischenzeit stand das Loch offen, und zwar **mit Ansage**: an
drei Stellen im Quelltext und im Kreuztest, dessen drei `users`-Zeilen
den offenen Zustand ausdrücklich prüften. Ein Sicherheitsloch, das man
wegkommentiert, ist eines, das man vergisst.

Belegt geschlossen am 12.8. nach dem Nachtragen im Betrieb:
*8 Konten · 7 mit koerperformen · 1 andere Firma · 0 ohne Feld.*

### Was die Regression dabei geleistet hat

Zwei Durchläufe wurden rot, **beide zu Recht**:

- `test-beitritt` fand keine wartenden Konten mehr, weil die Testdaten
  kein Feld `firma` hatten. **Genau das wäre im Betrieb passiert** — die
  Regression hat das Risiko vorgeführt, bevor es jemanden traf.
- `test-sicherung` hielt fest, dass der Chef den Vollsicherungs-Knopf
  sieht. Prüft jetzt beide Richtungen: beim Chef weg, beim Betreiber da
  und gross genug.

Und einmal meldete sie **49 rote** — ein Testserver lief im falschen
Ordner und lieferte für alles 404. Kein Fehler in der App. Dass
`alle.sh` das als 49 rote meldet und nicht als „alles grün", ist genau
richtig.

### Was ich nicht geprüft habe

Firebase Auth selbst, die Google-Infrastruktur, das Google-Konto des
Betreibers, und ob jemand ein Passwort weitergibt. Alles davon liegt
ausserhalb dessen, was hier messbar ist.

### Was jetzt gilt

| | |
|---|---|
| UI-Durchläufe | 54 |
| Regeltests | 165 |
| **Kreuztests (neu)** | **162** |
| Umzugs-Prüfungen | 12 |
| Cloud-Function-Prüfungen | 79 |

---

## Sitzung 30 · Bewegung — und zwei Kurven, die es zweimal gab 🟢

Auftrag: *„baue eventuell noch paar smoothere animationen ein und so."*

Der erste Griff wäre gewesen, neue Bewegung dazuzubauen. Vorher
nachgezählt, was schon da ist:

```
Keyframes gesamt: 38
DOPPELT definiert: viewIn, checkPop
```

**Zwei von 38 waren doppelt vergeben.** Das ist dieselbe Sorte Fehler
wie der doppelte Schlüssel `firma` in `konfig.js`: in CSS gewinnt die
spätere Definition, die frühere ist lautlos weg. Der Unterschied zu
einem Schönheitsfehler:

- `.view.show` stand mit `.32s var(--ease-out)` und weiter unten mit
  `.5s var(--ease-ios)`. Wer oben an der Dauer drehte, änderte nichts.
  Ein Ansichtswechsel ist die häufigste Bewegung der App — und die
  Stelle, an der man beim Nachbessern zuerst nachsieht.
- Bei `checkPop` war es heikler. `.fab-count.show` benutzt denselben
  Namen und bekam dadurch eine Kurve, für die es nie geschrieben wurde:
  gemeint war `.32s ease-out`, wirksam ist `45% scale(1.3)` mit
  Feder-Kurve. Kein Absturz, keine Meldung — die Bedeutung verschiebt
  sich einfach an einer Stelle, die niemand mehr im Blick hat.

Beide toten Fassungen sind raus, an ihrer Stelle steht jeweils ein
Kommentar mit dem Grund. So findet der nächste Durchlauf sie nicht
wieder als „fehlende Animation".

### Was neu dazukam

Nichts Erfundenes. Die drei Listen, die in den letzten Sitzungen
entstanden sind — Einrichtungs-Schritte, Firmenfarbe, Nachweise —
erschienen hart, während daneben alles gleitet. Sie benutzen jetzt
`rowIn` mit derselben Staffelung wie `.todo`, und der Haken beim
Bestätigen eines Nachweises federt wie jeder andere Haken:

```
.setup-zeile,.marke-chip,.cert-item{animation:rowIn .3s var(--ease-ios) both}
.cert-bestaetigt{animation:checkPop .45s var(--spring)}
```

Eine neue Kurve für dasselbe Gefühl wäre der Anfang des nächsten
Doppel-Eintrags gewesen.

Nachgezählt danach: **39 Keyframes, keiner doppelt.**

### Damit es nicht wiederkommt

Von Hand weggeräumt heißt: kommt beim nächsten Mal wieder. Deshalb
`tests/test-bewegung-doppelt.js` — ohne Browser, liest nur die Datei:

1. kein `@keyframes`-Name zweimal,
2. jede benutzte Animation ist auch definiert (ein Tippfehler im Namen
   bewegt gar nichts und fällt sonst niemandem auf),
3. Gegenprobe: es gibt überhaupt Bewegung — sonst wäre eine
   `index.html` ganz ohne Animation der grünste Durchlauf von allen.

Regression danach: **57 grün, 0 rot.** (56 vorher, plus der neue.)

---

## Sitzung 31 · Aufräumen: Struktur und Kommentare 🟢

Auftrag: *„die ganze App soll null wirken wie ein Vibe Code"* und *„organisiere
den Code so, dass man versteht, warum was wo liegt — aber lass diese komischen
Erklärungen weg, die wirken wie von KI."*

### Erst gemessen

| Datei | Zeichen | davon Kommentar |
|---|---|---|
| `index.html` | 776.207 | 32,5 % |
| `functions/index.js` | 87.719 | 35,5 % |
| `firestore.rules` | 57.742 | 49,5 % |
| `konfig.js` | 11.000 | **71,1 %** |
| `tests/*.js` | 638.041 | 22,3 % |
| **gesamt** | **1.589.175** | **29,5 %** |

Fast ein Drittel des Projekts war Fliesstext. Nicht Kommentare im üblichen
Sinn, sondern Aufsätze mit Datum, Vorgeschichte und Schlussfolgerung — genau
das, was der Auftraggeber als „wirkt wie von KI" beschrieben hat. Zwei
Beispiele: ein Block von 25 Zeilen über die Vollsicherung, von denen fünf
Zeilen den nötigen Inhalt trugen; ein Block von 13 Zeilen über das
Schriften-Laden, dessen Kern in vier Zeilen passt.

**Die Regel, nach der jetzt gekürzt wird** (steht in `README.md`): in den
Kommentar gehört, was man beim Ändern wissen muss und aus dem Code nicht
sieht — eine Bedingung aus den Regeln, eine Reihenfolge, die nicht vertauscht
werden darf, ein naheliegender Weg, der nicht funktioniert. Kein Verlauf,
keine Daten, keine Begründung in Aufsatzform.

### Das Verzeichnis

Im Wurzelverzeichnis lagen 19 Markdown-Dateien, zwei `.txt`, zwei PDF, ein
Apps-Script und ein Python-Werkzeug — zusammen mit vier HTML-Anwendungen.
Wer das Projekt zum ersten Mal öffnet, findet dort keinen Einstieg, sondern
eine Ablage. Es gab **kein README**.

| vorher | jetzt |
|---|---|
| 19 `.md` + 2 `.txt` + 2 PDF im Wurzelverzeichnis | alles unter `docs/` |
| `MATERIAL-SHEETS.gs`, `tools-md2pdf.py` im Wurzelverzeichnis | unter `tools/` |
| kein Einstiegspunkt | `README.md` |

`README.md` beantwortet die Frage aus dem Auftrag direkt: eine Tabelle je
Verzeichnis, dazu ein Abschnitt „Warum es so gebaut ist" mit den fünf
Entscheidungen, die sonst niemand nachvollziehen kann (eine Datei statt
Bundler, compat-SDK, kein Framework, Firmenpfade, durchgehend Deutsch).

Dazu ein Abschnitt über die drei Anwendungen, die kein StudioChat sind:
`marketing.html`, `wachstum.html`, `werbung.html`. Sie liegen im selben
Auslieferungsverzeichnis und benutzen dasselbe Firebase-Projekt. Das ist
vertretbar, aber es muss irgendwo stehen.

### Zwei Funde nebenbei

**Handbuch und Produktmappe waren öffentlich abrufbar.** Beide PDF lagen im
Auslieferungsverzeichnis, und `*.pdf` stand in keiner `ignore`-Liste — sie
waren unter `formenchat.web.app/StudioChat-Produktmappe.pdf` für jeden
herunterladbar. Mit `docs/**` in `firebase.json` ist das zu.

**Die `ignore`-Muster griffen nur im Wurzelverzeichnis.** `"*.md"` deckt
`docs/HANDBUCH.md` nicht ab; ohne die Umstellung auf `**/*.md` wäre beim
Verschieben die gesamte Dokumentation online gegangen. Aufgefallen beim
Nachrechnen, nicht beim Ausrollen.

### Was in dieser Runde gekürzt wurde

Gezielt die Aufsätze, nicht flächendeckend. Blöcke über 800 Zeichen:

| Datei | vorher | nachher |
|---|---|---|
| `index.html` | 13 | 2 |
| `functions/index.js` | 7 | 1 |
| `konfig.js` | 4 | 1 |

Die beiden verbliebenen in `index.html` sind das neue Inhaltsverzeichnis und
die Aufbaubeschreibung des Style-Blocks — Wegweiser, keine Aufsätze.

Dazu überarbeitet: `firestore.rules` (die vier längsten Blöcke), `sw.js`,
`firebase.json` und der Deploy-Workflow.

**Nachgewiesen, dass nur Kommentare fielen:** die Nicht-Kommentar-Zeilen sind
vorher und nachher identisch — 1.386 in `functions/index.js`, 745 in
`firestore.rules`, 11.409 in `index.html`. Dazu Syntaxprüfung von JavaScript
und HTML.

Ehrlich zur Gesamtzahl: der Kommentaranteil über das ganze Projekt ist von
29,5 % auf 28,9 % gefallen. Die Aufsätze sind weg, die vielen mittellangen
Blöcke nicht — `index.html` hat weiterhin 658 Kommentarblöcke, `tests/*.js`
zusammen 142 KB. Das ist Arbeit für mehrere Runden.

### Was gemessen, aber noch nicht angefasst ist

- **467 Emoji als Symbole** in Oberfläche und Code (148 im Markup, 319 im
  JavaScript). Daneben stehen echte Inline-SVG. Diese Mischung ist der
  auffälligste Hinweis auf schnell zusammengesetzten Code, den ein Betrachter
  sofort sieht.
- **Zwölf verschiedene Eckenradien** (6, 7, 8, 9, 10, 11, 12, 13, 14, 22 px,
  50 %, 999 px). Ein gepflegtes System hat drei bis vier, als Variablen.
- **85 Selektoren doppelt definiert** (von 1.182), darunter `.todo` und
  `.check` je viermal. Dieselbe Bauart wie die doppelten `@keyframes` aus
  Sitzung 30: gewachsen durch Anhängen, und beim Ändern greift man ins Leere.

Regression: **57 grün, 0 rot**, dazu die Emulator-Durchläufe für Regeln und
Cloud Functions.

---

## Sitzung 32 · Ein Symbolsatz und eine Rundungs-Leiter 🟢

Die beiden Punkte, die man **ohne Quelltext** sieht — der Rest der Liste aus
Sitzung 31 bleibt offen.

### 467 Emoji → ein Satz Konturzeichen

Ein Emoji bringt eigene Farben mit, ignoriert Hell- und Dunkelmodus und sieht
auf jedem Betriebssystem anders aus. Daneben standen in derselben App schon
echte Inline-SVG. Diese Mischung ist der auffälligste Hinweis auf schnell
zusammengesetzten Code, und sie fällt jedem auf, der die App zum ersten Mal
öffnet.

Entschieden wurde: **raus, und ein Symbol nur dort, wo es etwas tut.**

| | vorher | nachher |
|---|---|---|
| Markup | 190 | 0 |
| Skript | 173 | 8 |

Die verbliebenen acht sind Inhalt, kein Bedienelement: die sechs
Chat-Reaktionen, das Befehlstasten-Zeichen in der Tastenkürzel-Liste und der
Geburtstagsgruss.

`IKONEN` enthält 24 Zeichen im 24er Raster, Kontur, `currentColor` — dadurch
erbt jedes Symbol Farbe und Grösse von seinem Knopf. `ikon('name')` gibt das
fertige SVG zurück, ein unbekannter Name eine leere Zeichenkette statt eines
Platzhalters.

Vor einer Überschrift steht jetzt gar nichts mehr. „📅 Mein Dienst" war keine
Information, sondern Dekoration; die Überschrift liest sich ohne besser.

### Zwölf Eckenradien → sechs Stufen

Es gab bereits eine Leiter in `:root` — benutzt wurde sie **vierzehnmal**,
daneben standen über neunzig feste Werte zwischen 2 und 30 px. Ein
Gestaltungssystem, das auf dem Papier existiert und im Stylesheet nicht.

```
--r-xs:8px  --r-sm:11px  --r-md:14px  --r-lg:18px
--radius:22px  --radius-lg:30px
--r-pille:999px   Knöpfe und Chips
--r-rund:50%      Avatare und runde Knöpfe
```

Jeder feste Wert liegt jetzt auf einer Stufe — 179 Verwendungen. Zwei bleiben
mit Grund: das Konfetti-Teilchen (2 px) und das Kästchen eines Teilschritts
(5 px), beide einmalig, für beide gibt es keine Stufe.

Einzelne Ecken haben sich dabei um ein bis zwei Pixel geändert. Das war die
bewusste Entscheidung: eine Leiter, die man einhält, ist mehr wert als
neunzig Werte, die zufällig entstanden sind.

### `tests/test-gestaltung.js`

Ohne Browser, liest die Datei:

1. kein Emoji ausserhalb der Inhalts-Liste,
2. jedes `ikon('name')` gibt es auch im Satz — ein Tippfehler liefert sonst
   eine leere Zeichenkette und der Knopf bleibt stumm,
3. jedes fest ausgeschriebene SVG im Markup zeichnet **dieselben Pfade** wie
   der Satz (im Markup kann keine Funktion laufen, also gibt es beide
   Fassungen — sie dürfen nicht auseinanderdriften),
4. kein toter Symbol-Ballast,
5. keine festen Rundungen ausser den zwei begründeten,
6. Gegenproben: der Satz wird wirklich benutzt, die Leiter auch.

### Zwischenfall: die Arbeitskopie ist zweimal zurückgesprungen

Mitten in der Sitzung stand das Verzeichnis plötzlich wieder auf dem Stand
vom 11. August — samt `.git`. Beim ersten Mal fiel es auf, weil `konfig.js`
den längst behobenen doppelten Schlüssel wieder hatte; beim zweiten Mal,
weil `test-bewegung-doppelt.js` fehlte und die doppelten `@keyframes` zurück
waren.

Verloren ging nichts: alles hing an gepushten Commits. Die Lehre steht hier,
weil sie sich wiederholen kann — **nach jedem abgeschlossenen Schritt
committen und pushen**, nicht erst am Ende einer Sitzung. Beim zweiten Mal
lagen zwei Stunden Arbeit nur auf der Platte und mussten aus den Skripten im
Kritzelordner neu aufgebaut werden.

---

## Sitzung 33 · Die Aufräum-Liste abgearbeitet 🟢

Alle vier verbliebenen Punkte aus Sitzung 31/32.

### 1. Die Erzähl-Kommentare

Gemessen wurde nicht die Menge, sondern die **Form**. Ein Kommentar mit
Datum, Vorgeschichte und Schlussfolgerung ist das, was der Auftraggeber als
„wirkt wie von KI" beschrieben hat.

| | vorher | nachher |
|---|---|---|
| Blöcke mit Erzähl-Merkmal (Datum, „Vorher…", „Aufgefallen…", Ich-Form) | 79 | **0** |
| Blöcke über 800 Zeichen | 34 | 26 |

Belegt, dass dabei nur Kommentare fielen: Nicht-Kommentar-Zeilen vorher und
nachher identisch — 11.454 in `index.html`, 640 in `firestore.rules`. Dazu
Syntaxprüfung von JavaScript, HTML und allen Testdateien.

Angefasst: `index.html` (58 Blöcke), `firestore.rules` (4),
`functions/index.js` (2), 25 Testdateien, alle drei Attrappen.

**Die Menge ist bewusst nicht das Ziel gewesen.** Der Kommentaranteil liegt
weiter bei rund 28 % — was bleibt, ist der Teil, der beim Ändern gebraucht
wird: die Bedingung aus den Regeln, die Reihenfolge, die nicht vertauscht
werden darf, der naheliegende Weg, der nicht funktioniert.

### 2. Die Abstands-Leiter

`padding`, `margin` und `gap` standen mit **52 verschiedenen Werten**
zwischen 1 und 72 px im Stylesheet — sieben davon lagen einen Pixel
auseinander.

```
--s1:1px  --s2:2px  --s4:4px  --s6:6px  --s8:8px  --s10:10px  --s12:12px
--s16:16px  --s20:20px  --s24:24px  --s32:32px  --s40:40px  --s48:48px
--s56:56px  --s72:72px
```

623 Angaben liegen jetzt auf einer Sprosse, **keine einzige feste Pixelzahl
bleibt übrig**. Grösste Verschiebung 2 px, bei den häufigen Werten 1 px.
`clamp()`, `calc()`, negative Werte und mm (Druck) bleiben unangetastet.

Der Name nennt den Wert (`--s12` = 12 px). Semantische Namen (xs/sm/md)
hätten hier nur eine zweite Übersetzungsebene eingezogen — bei einem
2-px-Raster ist die Zahl die ehrlichere Auskunft.

**Nachgewiesen, dass sich nichts verzogen hat:** `audit-forensik.js` vorher
und nachher, 12 Ansichten × 11 Breiten:

```
UNERREICHBAR 0 · UEBERLAUF 0 · VERDECKT 0 · FINGERZIEL 0 · KONTRAST 0 · FOKUS 0
```

Beide Läufe zeichenweise identisch.

### 3. Die Selektor-Kollisionen

23 Selektoren setzten **dieselbe Eigenschaft an zwei Stellen**. Die spätere
gewinnt, die frühere ist toter Code — dieselbe Falle wie bei den doppelten
`@keyframes`.

Die Hauptursache war ein dreifach gestapeltes Druck-Feedback: Grundregeln,
ein Block „Micro-Interaktionen" und ganz unten der Abschnitt „Bewegung im
Apple-Stil". Der unterste gewinnt; die beiden darüber waren bis auf zwei
Selektoren wirkungslos. Wer `.btn{transition:…}` oben änderte, änderte
nichts.

Alle 23 aufgelöst: die Bewegungsschicht besitzt jetzt `transition` und
`:active transform`, die Grundregeln setzen sie nicht mehr. **0 Kollisionen.**

### 4. `tests/test-gestaltung.js` deckt jetzt alles ab

| | |
|---|---|
| kein Emoji ausserhalb der Inhalts-Liste | ✓ |
| jedes `ikon('name')` gibt es im Satz | ✓ |
| jedes feste SVG im Markup zeichnet dieselben Pfade wie der Satz | ✓ |
| kein toter Symbol-Ballast | ✓ |
| keine festen Rundungen | ✓ |
| keine festen Abstände | ✓ |
| keine Eigenschaft zweimal am selben Selektor | ✓ |
| dazu sechs Gegenproben, damit ein leerer Stylesheet nicht grün wird | ✓ |

### Prüfung

```
58 grün · 0 rot · 0 ohne Ausgabe          Oberfläche
Regeln 165 · Kreuztests 162 · Umzug 12 · Functions 83   Emulator
Forensik: 0 Funde in allen sechs Kategorien
```

---

## Sitzung 34 · Sicherheits-Durchlauf und die Google-Tabelle 🔴🟢

Der zweite Durchlauf (der erste, 12.8., ging nur um Firmengrenzen). Voll
in `docs/SICHERHEIT.md`; hier nur, was gefunden und was gebaut wurde.

### 🔴 Die vollständige Kundenliste war öffentlich abrufbar

`match /firmen/{f}` stand auf `allow read: if true`. In Firestore erlaubt
`read` **beides**: ein Dokument holen (`get`) und die Sammlung auflisten
(`list`). Ohne Anmeldung waren damit Firmenname, Kontenzahl, Studiozahl
und Anlegedatum aller Kunden abrufbar.

Das hebelte genau die Massnahme aus, die es verhindern sollte: Kennungen
bekommen eine Zufallsendung (`mueller-7f3a`), damit man Kunden nicht
durch Raten findet. Raten war nicht nötig.

```
allow get:  if true;               // der Anmeldebildschirm braucht den Namen
allow list: if istAdminKonto();    // die Kundenliste gehoert dem Betreiber
```

### 🟠 Die Google-Tabelle nahm Daten von jedem an

Die Adresse der Apps-Script-Web-App stand in `konfig.js` — also im
Quelltext jedes Besuchers — und `doPost` prüfte nichts. Ein Token im
Browser hätte daran nichts geändert: es stünde daneben.

| | vorher | jetzt |
|---|---|---|
| Weg | Browser → Web-App | Browser → `sheetsPush` → Web-App |
| Adresse | `konfig.js` | `functions/.env` |
| Token | keins | nur auf dem Server, geprüft in `doPost` |
| Nutzlast | durchgereicht | auf dem Server neu gebaut |
| Absender | aus dem Browser | aus dem Profil |
| Grenze | keine | Anmeldung, Freigabe, Firma, 3000/Tag |

`konfig.js` hat statt der Adresse nur noch den Schalter
`sheetsAbgleich`. Die Web-App weist ohne Token ab — **sobald das Token
gesetzt ist**; solange die Skripteigenschaft fehlt, nimmt sie weiter
alles an. Das ist Absicht, damit zwischen den beiden Handgriffen nichts
stehenbleibt. Anleitung: `docs/SHEETS-TOKEN.md`, Schritt G in
`DEIN-TEIL.md`.

### Was geprüft wurde und hielt

| | |
|---|---|
| Eingeschleuster Code | 8 Muster · 12 Ansichten · **0 ausgeführt**, 31 Fundstellen bleiben Text |
| Rechteausweitung | 10 Wege (`admin:true`, `role:'chef'`, Firma wechseln, sich selbst freischalten) — alle zu |
| Firmencode, Abo | für Mitarbeiter und ohne Anmeldung nicht lesbar |
| Cloud Functions | 15 von 15 Endpunkten prüfen die Berechtigung |
| Speicher | für jeden Client gesperrt |
| Geheimnisse im Repo | keine, nur öffentliche Web-Schlüssel |

### Zwei Dinge, die dabei nebenbei klar wurden

**Das Repository ist öffentlich.** Der Quelltext ist ohnehin für jeden
lesbar, mitsamt Verlauf. An den Grenzen ändert das nichts — die stehen
in `firestore.rules`. Es macht aber eine Regel unumgänglich: kein Token,
kein Passwort, kein Dienstkonto-Schlüssel darf jemals eingecheckt
werden, auch nicht kurz. Steht jetzt in `README.md`.

**Zwei Tests hätten fast Falsches behauptet.** Eine Gegenprobe setzte
`admin:true` auf dasselbe Konto, mit dem danach weitergeprüft wurde —
drei „Funde" waren in Wahrheit der Testaufbau. Und die XSS-Gegenprobe
las `innerText`, der nur Sichtbares liefert; von zwölf Ansichten ist
immer nur eine im Bild, also meldete sie „nichts geprüft". Beides
korrigiert, beides am Fundort kommentiert.

### Nachgezogen: die Kommentare im Markup

Beim Aufräumen in Sitzung 33 war nur der `<script>`-Teil dran. Im Markup
standen weiter Banner aus Gleichheitszeichen und mehrzeilige Absätze, die
den Aufbau der Seite erzählen — genau die Sorte, die als „wirkt wie von
KI" beanstandet wurde.

| | vorher | nachher |
|---|---|---|
| `index.html` | 122 | 66 |
| `werbung.html` | 25 | 24, alle Banner auf den Namen gekürzt |
| `marketing.html` · `wachstum.html` | je 12 | je 11 |

Was bleibt, benennt einen Abschnitt (`<!-- CHAT -->`) und erklärt nichts.
Belegt, dass nur Kommentare fielen: `index.html` ohne Kommentare vorher
und nachher zeichenweise identisch, 14.414 Zeilen.

### Prüfung

```
Regeln 165 · Kreuz 162 · Rechte 23 · Umzug 12 · Functions 99   Emulator
XSS 8 Muster · Tabelle 8 Prüfungen · Endpunkte 15              Browser/Text
60 Durchläufe im Browser
```

Ein echter Fund dabei: `test-putzplan.js` hing an einer `fetch`-Anfrage
an `script.google.com`. Die gibt es seit dem Umbau nicht mehr — der Test
war rot, und zwar zu Recht. Er fängt jetzt den Aufruf von `sheetsPush`
ab.

Neu: `tests/rules/rechte.test.js`, `tests/test-xss.js`,
`tests/test-sheets.js`, `tests/stub-xss.js`; erweitert:
`tests/rules/funktionen.test.js` (+16), `tests/test-funktionen-pfade.js`
(jeder Endpunkt).

---

## Sitzung 35 · Sicherheitsrunde drei 🔴🟢

Die drei Punkte, die am Ende von Runde zwei als „nicht geprüft"
dastanden. Voll in `docs/SICHERHEIT.md`.

### 🔴 Elf gemeldete Lücken in den Fremdbibliotheken

Nie nachgeschlagen — stand so als Lücke im Bericht. `npm audit` meldete
elf, davon zwei hoch.

| | |
|---|---|
| nodemailer 6.9.14 → 9.0.5 | acht Meldungen; zwei treffen unseren Fall, weil die Empfängeradresse aus einem Formular kommt und ohne Zwischenschritt an Endkundinnen geht |
| fast-xml-parser · protobufjs · gaxios | ohne Bruch nachgezogen |
| `overrides: uuid ^11.1.1` | sieben Meldungen hängen an einer alten `uuid` tief in den Google-Bibliotheken; ein Weiterreichen von oben gibt es nicht |

**firebase-admin 14 bleibt draussen, und das ist der Fund im Fund.** Die
Version entfernt `admin.firestore()` — die Schreibweise, auf der der
ganze Backend-Code steht. `umzug.test.js` fiel beim Versuch sofort um.
Ausgerollt hätte es Push, Mails und die Nachtsicherung stillgelegt, und
in der App hätte man nichts davon gesehen. Sicherheitlich bringt der
Sprung nichts: mit dem uuid-Override steht der Zähler auch auf 12 auf
null.

```
npm audit --omit=dev   11 (9 mittel, 2 hoch)  →  0
```

### ✅ Die Content-Security-Policy

`script-src` **ohne** `'unsafe-inline'`: die beiden Skriptblöcke sind
einzeln über ihre Prüfsumme erlaubt, jeder andere nicht. Ein `<script>`
aus einem Chattext wird nicht ausgeführt, selbst wenn er als Markup
ankäme. `default-src 'none'` als Ausgangspunkt, dazu `frame-src`,
`object-src`, `base-uri` und `form-action` auf `'none'`.

Dafür umgebaut: vier Ereignisse im Attribut. Die zwei Notschalter im
Ladebildschirm liegen jetzt in einem eigenen kleinen Block — getrennt vom
grossen, damit sie auch dann funktionieren, wenn die App nicht hochkommt.

Der Preis ist Pflege: ein geändertes Zeichen im Skript, und die
Prüfsumme passt nicht mehr. `tools/csp.js` rechnet sie neu,
`tests/test-csp.js` schlägt an, sobald Regel und Datei auseinanderlaufen
— beim Einbau hat das prompt funktioniert.

Gemessen: zwölf Ansichten, **0 Verletzungen**, App läuft, und die
Gegenprobe (eingeschleustes `<img onerror>`, ein `<script>`-Element, ein
per JS erzeugtes Skript) wird geblockt. Die Regel steht als `<meta>` in
der Datei — seitdem läuft die ganze Oberflächen-Prüfung unter ihr, nicht
nur der Betrieb. Blockt sie im Betrieb etwas Echtes, geht die Meldung
denselben Weg wie ein Fehler: Verwaltung → System.

Dazu Kopfzeilen in `firebase.json`, die es als `<meta>` nicht gibt:
kein Einbetten in fremde Seiten, `nosniff`, `Referrer-Policy`,
`Permissions-Policy` ohne Ort, Kamera, Zahlung und USB.

**`werbung.html` hat ihre eigene, engere Regel bekommen** — die
öffentliche Seite, die jeder ohne Anmeldung aufruft. Sie braucht weniger
und bekommt weniger: `connect-src 'none'`, `media-src 'none'`,
`worker-src 'none'`, Bilder nur von der eigenen Hauptseite. Drei
Ereignisse im Attribut sind dafür umgezogen, darunter das `onerror`, das
das Logo ausblendet, wenn die Hauptseite es nicht liefert — der Ersatz
wird im Durchlauf mitgeprüft, indem das Logo absichtlich abgewiesen wird.

`marketing.html` und `wachstum.html` bleiben vorerst ohne: dort stehen
zusammen 101 solche Attribute, und für beide gibt es bis heute keinen
einzigen automatischen Durchlauf, der einen Umbau absichern würde.

### 🟠 Eine Grenze in der Marketing-App war nur Anzeige

`marketing.html` meldet jeden ohne Chefrolle wieder ab. In den Regeln
stand für `mkProjects` trotzdem `istAktiv()` — jeder aktive Zugang durfte
lesen und schreiben, an der Oberfläche vorbei. Kein Leck im engeren Sinn
(dort liegen Kampagnentexte), aber die schlechteste Sorte Grenze: eine,
an die alle glauben. Jetzt `isChef()`, in beiden Regelblöcken.

Mitgeprüft: Kennzahlen, Wettbewerb, Expansion aus `wachstum.html`. Die
standen schon richtig — nur eben ungeprüft.

### 🔴 Und ein Fund, der nichts mit Sicherheit zu tun hat

Beim Blick auf die Nachbaranwendungen: `wachstum.html` schreibt Termine
flach nach `appointments/`, die Hauptanwendung ist am 10.8. auf
`firmen/<kennung>/…` umgezogen. Die Nachbaranwendungen sind nicht
mitgekommen.

| | Weg | Stand seit 10.8. |
|---|---|---|
| Bestätigung, Änderung, Storno | Auslöser, hängt an beiden Pfaden | lief weiter |
| Erinnerung vorher · Nachfassen danach | Zeitplan über `alleFirmen()` | **fand nichts mehr** |

Kein Fehler, kein Eintrag, in der App sieht alles normal aus: die
Abfrage lief, nur am falschen Ort, und kam leer zurück. Genau das
Muster, vor dem `MANDANT-PLAN.md` warnt — in der Anwendung, an die beim
Umzug niemand gedacht hat.

Der Zeitplan läuft jetzt über `alleFirmenUndFlach()`. Dazu ein zweiter
Fund derselben Herkunft: beide Nachbarseiten trugen die Zugangsdaten des
**Betriebs** fest im Quelltext. Auf der Probe-Adresse arbeiteten sie
damit in der echten Datenbank — echte Termine, echte Mails an
Endkundinnen. Jetzt holen sie `konfig.js` wie die App, und
`test-probe-schalter.js` prüft für jede ausgelieferte Seite, dass keine
`projectId` mehr im Quelltext steht.

### Prüfung

```
Regeln 165 · Kreuz 162 · Rechte 33 · Umzug 12 · Functions 99   Emulator
CSP 33 Prüfungen (2 Seiten) · Mailversand 8 · npm audit 0       neu
61 Durchläufe im Browser, alle unter der neuen Regel
```

---

## Sitzung 36 · Die Symbole kommen zurück 🟢

Rückmeldung nach dem Aufräumen: *„das sieht jetzt alles so leer aus."*
Berechtigt. Nachgezählt, was beim Emoji-Ausbau in Sitzung 32 wirklich
passiert ist:

| | |
|---|---|
| Stellen, die ein Symbol verloren | 244 |
| davon Überschriften | 55 |
| davon Knöpfe und Reiter | 55 |
| davon Auswahl-Einträge | 13 |
| Symbole, die zurückkamen | 40 |

Der Rest stand nackt da. Am deutlichsten in der Verwaltung: die acht
Kacheln hatten `ico:''` — leer geräumt und nie wieder gefüllt. Dasselbe
bei Dokument-Kategorien, Nachweis-Arten und Gerätezuständen, zusammen 24
leere Felder.

### Was jetzt anders ist

**`data-ikon="name"` statt ausgeschriebenem SVG.** Vorher stand jedes
Symbol zweimal in der Datei — einmal im Satz, einmal als SVG im Markup.
Zwei Fassungen desselben Bildes laufen auseinander. Jetzt nennt das
Markup nur den Namen, `ikonenEinsetzen()` hängt das SVG beim Start ein.
Eine Quelle, und eine Überschrift ohne Symbol ist eine Entscheidung
statt eines Versehens.

**Der Satz ist von 24 auf 57 Symbole gewachsen.** Alle im selben
24er-Raster, Kontur, `currentColor`. Nachgesehen wurde nicht im Code,
sondern auf einem Kontaktabzug — `zahnrad` sah aus wie `sonne` und ist
jetzt ein Regler.

**Emoji bleiben in `<option>`.** Eine Auswahlliste zeigt nur Text, dort
ist kein SVG möglich: entweder ein Emoji oder gar keine Marke, und
„Urlaub / Krank / Frei" ohne Unterscheidung ist schlechter. Steht als
begründete Ausnahme im Prüfer, nicht in der Zeichenliste — sonst wären
dieselben Emoji überall wieder erlaubt.

**Keine Symbole in den Team-Reitern.** Vier Reiter mit Symbol passen auf
390 Pixeln nicht nebeneinander; der vierte war abgeschnitten. Derselbe
Grund wie im Profil.

### Zwei Funde beim Bauen

**Der Prüfer war halb blind.** `tests/test-gestaltung.js` schnitt
Kommentare mit einem Muster über die ganze Datei heraus — und im Markup
steht `accept="image/*"`. Das öffnete einen Kommentar, der erst 84 KB
später im Skript wieder zuging: **der halbe Body war für jede Prüfung
unsichtbar.** Ein Emoji dort wäre nie gefunden worden, und der Durchlauf
meldete trotzdem grün. Jetzt wird je Bereich geschnitten.

**Textprüfung allein reicht nicht.** `textContent` wirft das eingehängte
SVG wieder hinaus — genau so standen „Reicht noch" und „Übersicht aller
Studios" wieder nackt da, während die Datei behauptete, sie hätten ein
Symbol. Der Prüfer öffnet jetzt fünf Ansichten im Browser und sieht
nach, ob jede Marke ihr Symbol trägt.

---

## Sitzung 37 · Zwei Seiten stillgelegt 🟢

Ansage des Betreibers: `marketing.html` und `wachstum.html` werden nicht
mehr gebraucht, nicht ausgebessert, nur zugesperrt — bei Bedarf
zurückholbar.

Das ist die bessere Antwort als jede Reparatur gewesen. Drei Punkte der
Sicherheitsliste sind damit nicht abgearbeitet, sondern **weggefallen**:

| Was offen war | Warum es entfällt |
|---|---|
| Termine für jeden im Betrieb lesbar (Daten Dritter) | kein Browser kommt mehr an `appointments` |
| Nachbarseiten kennen keine Firmen — beim zweiten Kunden ein Datenleck | die flachen Pfade sind für alle Clients zu |
| Beide ohne eigene CSP (101 Ereignisse im Attribut) | sie werden nicht mehr ausgeliefert |

**Zwei Schlösser statt einem.** Nicht ausliefern allein reicht nicht: die
Sammlungen wären über die Datenbank weiter erreichbar, und die Adresse
einer HTML-Datei ist kein Geheimnis. Deshalb beides — `firebase.json`
liefert sie nicht mehr aus, und `firestore.rules` stellt `mkProjects`,
`appointments`, `emailTemplates`, `studioMetrics`, `competitors` und
`expansionLeads` in **beiden** Blöcken auf `false`.

**Die Dateien bleiben liegen.** Gelöscht wäre schneller, aber
„zurückholen auf Ansage" hiesse dann Archäologie im Verlauf. So sind es
zwei Zeilen.

**Was die Tests jetzt prüfen:** nicht mehr „der Chef darf, der
Mitarbeiter nicht", sondern dass **niemand** herankommt — 18 Sperren in
`rechte.test.js`, dazu die Gegenprobe, dass die App selbst nicht
mitgesperrt ist. Und in `test-probe-schalter.js`, dass beide Seiten
weiterhin im Repo liegen, aber nicht ausgeliefert werden: eine
ignore-Zeile ist schnell versehentlich entfernt.

Die Cloud Functions bleiben unangetastet — sie arbeiten mit
Admin-Rechten und unterliegen den Regeln nicht.

```
Regeln 165 · Kreuz 132 · Rechte 44 · Umzug 12 · Functions 99
```

Kreuz verliert 30 Prüfungen, Rechte gewinnt 11: die sechs Sammlungen
brauchen keine Firmen-Trennung mehr, wenn niemand sie lesen darf.

---

## Sitzung 38 · Gestaltung: sechs Leitern und die Regel „erst kurz" 🟢

Ansage: elf Punkte, systematisch statt drauflos — weniger sichtbare
Rahmen, mehr Whitespace, klarere Typografie, stärkere Hierarchie, weniger
Text, bessere Karten, klarere Statusindikatoren, konsistentere Knöpfe,
bessere leere Zustände, bessere Microinteractions. Und nachgereicht:
„Standardmäßig kurz. Details auf Nachfrage."

### Was gemessen wurde, bevor etwas angefasst wurde

| | vorher | nachher |
|---|---|---|
| `font-size` — verschiedene Werte | **52** | 7 (+ 3 begründete Ausnahmen) |
| `line-height` | 13 | 4 |
| `letter-spacing` | 12 | 4 |
| `box-shadow` | **28** | 5 |
| Statustönungen für 3 Aussagen | **40** | 12 |
| feste Pixel bei Abstand/Rundung | 17 versteckte | 0 |
| Flächen, die im Hellmodus verschwanden | **32** | 0 |
| Hinweis-Absätze über 95 Zeichen | 31 | 16 |
| längster Hinweis-Absatz | 443 Zeichen | 150 |
| sichtbarer Hinweistext gesamt | 8.495 Zeichen | 5.655 |

### Die Leitern

**Schrift.** Zwischen `.72` und `.78` lagen sechs verschiedene Größen —
Unterschiede, die niemand sieht, kosten genau das, wofür sie gedacht
waren. Sieben Stufen `--t-2xs … --t-2xl`, dazu vier Zeilenabstände und
vier Laufweiten. 289 Angaben liegen darauf. Fest bleiben nur `pt`
(Druck), `clamp()` (der mitschrumpfende Seitentitel) und die `16px` an
Eingabefeldern — darunter zoomt iOS beim Antippen hinein.

**Höhe statt Rahmen.** Drei Stufen `--e1/2/3` plus zwei für Leisten am
unteren Rand, die nach oben werfen. Dazu ist `--line` von 14 % auf 8 %
heruntergegangen: der Rahmen ist die feine Kante obendrauf, nicht das,
was die Karte trägt. Karten bekommen dafür `--e1` und eine Stufe mehr
Innenabstand.

**Status.** 40 Tönungen für drei Aussagen — `.10`, `.11`, `.12`, `.14`,
`.15`, `.16`, `.18` nebeneinander, dazu zwei verschiedene Rot und zwei
verschiedene Grün. Zwei Plaketten mit derselben Bedeutung sahen dadurch
unterschiedlich aus. Jetzt zwölf Marken: je Aussage leise / normal /
stark / Kante.

### Der Seitentitel war so groß wie der Kartentitel

Gemessen bei 430 Pixeln Breite: `h2` kam aus `clamp(1.4rem,3.5vw,1.9rem)`
auf **22,4 px**, der Kartentitel `h3` stand fest auf `--t-xl` = **21,8
px**. Ein halber Pixel Unterschied zwischen „wo bin ich" und „was steht
in dieser Karte" — das ist keine Hierarchie, das ist Zufall.

Seitentitel jetzt `--t-2xl` (28 px), Kartentitel `--t-lg` (18 px). Beide
liegen damit auf der Leiter statt auf einer Rechnung, die zufällig
dasselbe Ergebnis lieferte. Das Zusammenschrumpfen beim Scrollen macht
ohnehin `.view-head.shrink.tight h2` — dafür war die Rechnung nie
zuständig. `.fold-head h3` fiel dabei weg: die Regel setzte genau den
Wert, den `.card h3` jetzt schon hat.

### Weniger Text

Zwölf Aufklapper `<details class="nachfrage">`. Der Fall, den der
Betreiber genannt hat, steht jetzt so da:

> **Studios werden geschlossen, nicht gelöscht**
> Geschlossene Studios verschwinden aus allen Auswahllisten, ihre Daten
> bleiben lesbar. Wieder öffnen geht jederzeit.
> › Warum kann ich Studios nicht löschen?

`<details>` statt eines eigenen Schalters: kennt „offen" von sich aus,
tastaturbedienbar, wird von Vorlesehilfen angesagt, braucht keine Zeile
Skript — was mit der CSP ohnehin besser zusammenpasst.

Die Einrichtungs-Karte auf der Startseite zeigt jetzt nur noch das
Offene; die erledigten Schritte liegen hinter „3 Schritte schon
erledigt". Die Karte ist damit von fünf auf zwei Zeilen geschrumpft —
„Mein Dienst" steht wieder ohne Scrollen da.

### Der Hellmodus war an 32 Stellen halb blind

Beim Durchsehen der Bilder fiel eine Plakette auf: „kein Abschluss" beim
Probetraining stand im Hellmodus ohne Fläche da, während „Abschluss"
daneben eine grüne trug. Die Regel dahinter:
`background:rgba(255,255,255,.07)`.

Im Dunkeln genau richtig. Auf einer **weißen** Karte ist Weiß auf Weiß
nichts. Die Suche danach fand **32 solcher Stellen** — Eingabefelder,
`.btn-ghost`, `.icon-btn`, Fortschrittsschienen, Chips. Im Browser
nachgemessen: `.inp`, `.btn-ghost`, `.icon-btn` und `.pbar` lieferten in
**beiden** Modi denselben Wert. Getragen wurden sie im Hellmodus nur noch
von ihrem Rahmen; wer keinen hatte, war weg.

Jetzt drei Marken `--auf-1/2/3`, die den Modus kennen: im Dunkeln heller,
im Hellen dunkler. Sechs eigene `body.light`-Regeln, die genau dieses Loch
einzeln geflickt hatten, sind damit überflüssig und gelöscht. Zwei
Ausnahmen bleiben weiß, beide mit Grund: der Schließen-Knopf im
Bildbetrachter liegt in beiden Modi auf schwarzem Grund, und der
Rollbalken hat seine eigene Hell-Regel.

### Drei Fehler, die dabei aufgefallen sind

**1. Der Abstands-Prüfer hatte ein Loch.** Er übersprang jede Angabe, in
der ein `clamp()` oder `calc()` vorkam — *die ganze Angabe*. Bei
`padding:15px clamp(14px,4vw,28px) 9px` standen die 15 und die 9
jahrelang unbemerkt fest drin. Jetzt wird nur die Rechnung selbst
herausgenommen, der Rest geprüft: 17 versteckte Festwerte kamen zum
Vorschein, alle liegen jetzt auf der Leiter.

**2. Namenskollision.** Die Aufklapper hießen zuerst `.mehr` — es gibt
aber schon `.alert-bar.mehr`. Die Regel `.mehr{margin-top:…}` hätte den
Hinweisbalken auf der Startseite stillschweigend mitverschoben. Umbenannt
in `.nachfrage`, bevor es jemand sieht.

**3. Ein Knopf ohne Trefferfläche.** Die Lese-Plakette an einer
Ankündigung war 17 Pixel hoch. Sie bekommt dieselbe unsichtbare
`::after`-Fläche wie `.mini-link` und `.recht-link` — 44 Pixel, ohne dass
sich am Aussehen etwas ändert.

### Knöpfe und leere Zustände

Drei Knöpfe im Ladebildschirm trugen ihre Gestalt im `style`-Attribut,
inklusive eigener Markenfarbe. Sie sind jetzt `.btn .btn-primary` /
`.btn-ghost` wie alle anderen.

`emptyHTML()` nimmt zwei Angaben mehr: ein eigenes Symbol und Markup für
den nächsten Schritt. Vorher trug jeder leere Bereich dasselbe
Klemmbrett. Fünfzehn handgemalte `<p style="color:…">Keine …</p>` sind zu
`emptyMini()` geworden.

Die Chef-Karten bekommen einen Winkel am Rand: sie **sind** Knöpfe, sahen
aber aus wie Kästen, die man anschaut.

### Was der Prüfer jetzt kann

`tests/test-gestaltung.js` hat drei neue Abschnitte — feste Schriftmaße,
feste Schatten, feste Statustönungen — je mit Gegenprobe, dass die Leiter
auch wirklich benutzt wird. Nachgewiesen, dass sie greifen: mit
absichtlich eingebauten Verstößen (`.83rem`, `1.42`, ein fremder
Schatten, `rgba(251,78,109,.19)`) schlagen alle vier an.

```
Forensik: UNERREICHBAR 0 · UEBERLAUF 0 · VERDECKT 0 ·
          FINGERZIEL 0 · KONTRAST 0 · FOKUS 0
```

### Was bewusst nicht angefasst wurde

Die Quotenbalken beim Probetraining sind unabhängig vom Wert grün. Ab
welcher Abschlussquote ein Balken „gut" ist, ist eine Frage des Betriebs,
keine des Designs — das erfinde ich nicht. Wenn der Chef eine Schwelle
nennt (oder „gegen den eigenen Schnitt" als Regel will), ist es eine
Zeile.

---

## Sitzung 39 · „Irgendwie sieht alles gleich aus" 🔴🟢

Rückmeldung des Betreibers nach dem Merge von #80. Berechtigt — und der
Fehler war meiner.

### Erst geprüft, ob es überhaupt draußen ist

Zwei Verdächtige, beide ausgeschlossen:

| Verdacht | Befund |
|---|---|
| nicht ausgeliefert | `formenchat.web.app/index.html` enthält 37× `nachfrage` und 22× `--auf-1` — die neue Fassung liegt live |
| Zwischenspeicher | der Service Worker holt HTML mit `cache:'no-store'`, Netz zuerst. Er kann gar keine alte Seite zeigen, solange man online ist |

Also stimmte die Beobachtung: es **sah** aus wie vorher.

### Warum

Die ganze Sitzung 38 lief auf der **Marken**-Ebene. 52 Schriftgrößen auf
sieben, 40 Statustönungen auf zwölf — richtig, notwendig und per
Definition unsichtbar. Zwei Dinge, die ich als „weniger Rahmen, bessere
Karten" verbucht hatte, taten schlicht nichts:

**1. Der Karten-Schatten ist im Dunkeln unsichtbar.** Nachgerechnet:

```
Grund   --bg   #12131C
e1 darauf      rgb(15,16,24)   → Unterschied zum Grund: 4 von 255
```

Ein schwarzer Schatten auf fast schwarzem Grund. Ich hatte „Höhe statt
Rahmen" gebaut — und dann den Rahmen drangelassen. Beides zugleich ist
keins von beidem.

**2. `--line` von 14 % auf 8 %** ist ein leiserer Strich, aber immer noch
ein Strich. Jede Karte blieb ein Kasten.

### Was jetzt anders ist

| | |
|---|---|
| Karten | **kein Rahmen mehr.** `--bg-2` liegt sichtbar über `--bg`, das trägt |
| Hinweisbalken | Farbkante links (3 px) statt Vollrahmen, Fläche von `--f-*` auf `--f-*-leise` |
| Karteninnenabstand | `clamp(17,3.8vw,23)` → `clamp(18,4.2vw,26)` |
| Abstand zwischen Karten | `--s12` → `--s20` |
| Chef-Karte | `--r-md` → `--r-lg`, Innenabstand oben/unten auf `--s20` |
| Aufgaben- und Dokumentzeile | Rahmen weg, Innenabstand auf `--s16` bzw. `--s12` |

Drei gleich laute Umrandungen nebeneinander sind kein Hinweis, sondern
Krach. Die Kante links sagt dasselbe und lässt die Zeile ruhig.

### Gegenprobe, die zu dieser Änderung gehört

Ein Rahmen kann eine Fläche tragen, die sonst im Grund verschwindet.
Deshalb ein eigener Durchlauf im Browser: für jede Karte die erste
nicht-durchsichtige Fläche darüber suchen und mit der eigenen
vergleichen. **In beiden Modi verschwindet keine.**

```
Gestaltung ✓ · Forensik 0 Funde (hell und dunkel) · Regression 65 grün
```

### Die Lehre

Aufräumen ist keine Gestaltung. Eine Leiter macht die nächste Änderung
billig — sie ist nicht selbst die Änderung. Wer beides in einem Zug
liefert, muss am Ende hinsehen und fragen: *sieht man es?* Diese Frage
hat der Betreiber gestellt, nicht ich.

---

## Sitzung 40 · Elf rote Zeilen, die keine waren 🔴🟢

Aus dem Betrieb gemeldet: unter Verwaltung → System standen elf Fehler.
Alle harmlos — und genau deshalb schlimm, denn sie verdeckten alles Echte.

### Zwei Ursachen, beide nachgelesen statt vermutet

**1. `cleardot.gif`, sechsmal.** Kommt aus dem Firestore-SDK. Im
heruntergeladenen `firebase-firestore-compat.js` nachgesehen:

```js
function tn(e,t){ e.j.info("Error code "+t),
  2==t ? ( i=new Xe(i||"//www.google.com/images/cleardot.gif") … TestLoadImage … ) }
```

Firestore lädt diese 1×1-Grafik **nur bei Fehlercode 2 des Kanals**, um zu
prüfen, ob überhaupt Netz da ist. Blockiert man sie, feuert `onerror`, und
die Antwort lautet „kein Netz". Nach jeder kurzen Störung im Studio-WLAN
hält sich die App also für offline und verbindet träger wieder.

Das ist kein Rauschen, das war ein echter Nachteil. Erlaubt ist jetzt
**dieser eine Pfad** — nicht google.com.

**2. `*.js.map`, fünfmal.** Quelltext-Karten. Die holt nur die
Entwicklerkonsole. Der Chef sah fünf rote Zeilen, weil jemand F12
gedrückt hatte. Werden nicht mehr gemeldet.

### Die eigentliche Ursache der Menge

Das Anhängsel `?zx=…` ist bei jeder Prüfung anders, und der
Meldeschlüssel enthielt es. Aus **einer** Sache wurden so sechs Einträge —
und weil `fehlerMelden` je Sitzung bei fünf Meldungen dichtmacht,
verdrängt eine einzige Netzstörung alles andere. Jetzt wird der
Fragezeichen-Teil abgeschnitten: eine Zeile mit einem Zähler.

### Was daran belegt ist

Die Ausnahme steht auf der Behauptung, CSP vergleiche den **Pfad** und
ignoriere dabei das `?…`. Stimmt das nicht, ist entweder die Netzprüfung
weiter blockiert (dann war die Änderung sinnlos) oder google.com ist ganz
offen (dann ist sie gefährlich). Also gemessen:

```
GELADEN   cleardot.gif?zx=abc123
BLOCKIERT https://www.google.com/images/anderes.gif
```

Beides steht als Gegenprobe in `tests/test-csp.js`, dazu vier Prüfungen in
`tests/test-fehlerbericht.js` — darunter die wichtigste: eine **echte**
Verletzung (`boeser-server.example`) muss weiterhin gemeldet werden, sonst
ist der Filter zu grob und die Regel blind.

### Ein Altfall fiel dabei mit auf

Der neue Prüfer „img-src erlaubt keinen fremden Host pauschal" schlug
sofort bei `werbung.html` an: dort stand der ganze Host
`xn--krperformen-rfb.com`. Dort ist nichts zu verraten — die Seite kennt
weder Anmeldung noch Datenbank —, aber eine Ausnahme soll so eng sein wie
ihr Anlass. Jetzt sind es die zwei Bilder, die sie wirklich lädt.

```
CSP ✓ · Fehlerbericht ✓ · Regression 65 grün
```

---

## Sitzung 41 · „Verschoben und abgeschnitten" — und was dahinter lag 🔴🟢

Drei Beobachtungen aus dem Betrieb: der Suchen-Knopf sitze schief, manches
sei abgeschnitten, und auf dem Startbildschirm funktioniere „der
Chef-Knopf nicht ganz". Alle drei stimmten. Hinter jeder lag etwas
Grösseres.

### 1. „Verschoben" — die App hatte drei Seitenränder

Der Knopf selbst stand richtig (Zeichen exakt mittig, 9,5 px auf jeder
Seite). Verschoben war das Suchfeld, das er öffnet:

| | war | ist |
|---|---|---|
| seitlicher Rand | `var(--s16)` = 16 px | derselbe wie die Karten |
| Oberkante | 56 px — die Leiste ist 63 hoch, das Feld lag **7 px in ihr drin** und verdeckte den Knopf, mit dem man es aufgemacht hatte | unter der Leiste |

Die Ursache war allgemeiner: es gab **drei** Seitenränder —
`clamp(14px,4vw,26px)` in der Kopfleiste, `clamp(14px,4vw,28px)` im
Inhalt, `16px` im Suchfeld. Jetzt eine Marke `--rand`, 18 Stellen.

### 2. „Abgeschnitten" — acht Stellen, keine davon sichtbar für die Forensik

Der Platzhalter der Suche brauchte **348 px** und hatte je nach Gerät
195 bis 304. Also auf **jedem** Bildschirm abgeschnitten, seit es ihn gibt.

Die Forensik prüft Überlauf der *Seite* und fand null — das ist eine
andere Sorte: der Kasten steht richtig, nur der Inhalt passt nicht hinein
und wird stillschweigend weggeschnitten. Nichts ragt heraus, nichts
scrollt, es fehlt einfach. Dafür gibt es jetzt
`tests/test-abgeschnitten.js`: Platzhalter werden mit `canvas.measureText`
in derselben Schrift nachgemessen, dazu `scrollWidth/scrollHeight` gegen
`clientWidth/clientHeight` bei `overflow:hidden`. Drei Bildschirmbreiten,
elf Ansichten, Suche und Anmeldung.

Gefunden und behoben: 8 Stellen. Die schlimmste war `#matNewName` —
„Eigenes Material hinzufügen …" (248 px) in einem **70 px** breiten Feld,
weil der Knopf daneben 144 px nimmt. Unter 380 px rutscht er jetzt in die
zweite Zeile.

> **Der Prüfer hat sich zuerst selbst belogen.** Der erste Durchlauf
> meldete „0 abgeschnitten" — er hatte im abgemeldeten Zustand den
> *Ladebildschirm* gemessen, weil die App ohne echtes Firebase dort
> stehen bleibt. Ein Prüfer, der nichts sieht, meldet grün. Jetzt prüft
> er nach, ob er überhaupt angekommen ist, und meldet sonst
> „MESSUNG LEER".

### 3. „Der Chef-Knopf" — er war nie einer

Auf dem Anmeldebildschirm stand: *„Noch keinen Zugang? Dein **Chef** legt
dein Konto an."* — „Chef" fett und in Textfarbe, also aussehend wie ein
Knopf. Er war keiner.

Dahinter lag ein zweiter, schlimmerer Fall. Unter „Konto anlegen" gab es
eine Wahl zwischen **Mitarbeiter** und **Chef**, mit `cursor:pointer`,
Umrandung und Hover. Diese Kacheln hatten **keinen einzigen Zuhörer** —
und `doRegister` legt ohnehin immer einen Mitarbeiter an, erzwungen in
`firestore.rules`, damit sich niemand mit dem Firmencode selbst zum Chef
macht. Die Oberfläche bot also eine Wahl an, die es nicht gibt und nie
geben wird. Entfernt, dazu die tote Variable `regRole` und 11 Zeilen CSS.

### 4. Neun Fenster mit dem Standardknopf des Browsers

Beim Bauen des neuen Fensters fiel auf, dass sein Schliessen-Kreuz als
grauer Kasten erschien. Die Regel hiess `#lightbox .lb-close` — gestylt
war damit **nur** der Bildbetrachter. Nachgemessen am Profil-Fenster:

```
pmClose: Hintergrund rgb(239,239,239) · Rahmen 2px schwarz · 18×20 px
```

Neun Fenster, alle mit einem 18×20-Knopf zum Schliessen — bei einer
Hausregel von 44. Zwei davon (`ownTodoModal`, `probeModal`, beide aus
Sitzung 38) hatten **gar kein Zeichen darin**, nur ein `aria-label`.

Warum es nie auffiel: die Forensik läuft über Ansichten und öffnet keinen
Dialog. Der neue Durchlauf macht jetzt jedes Fenster einmal auf.

### 5. Drei Listen, die dieselbe sein sollten

Beim Nachprüfen des Kreuzes kam heraus, dass `aboModal`, `ownTodoModal`
und `probeModal` sich **weder mit Escape noch mit der Zurück-Geste**
schliessen liessen. Grund: drei Listen von Fenstern —

| Liste | fehlten |
|---|---|
| `DIALOGE` (Fokusfalle, aria) | `ownTodoModal`, `probeModal` |
| `closeAllModals` | `aboModal`, `ownTodoModal`, `probeModal` |
| `anyModalOpen` | dieselben drei |

Der Kommentar bei `DIALOGE` versprach seit Sitzung 31: *„Die Liste ist
dieselbe wie in closeAllModals — bewusst, damit nicht zwei Listen
auseinanderlaufen."* Sie waren längst auseinander, und es war eine dritte
dazugekommen. Jetzt eine, aus der sich die beiden anderen bedienen. An
`anyModalOpen` hing es wirklich: Escape fragt zuerst dort nach, ob
überhaupt etwas offen ist.

### 6. Was jetzt auf dem ersten Bildschirm steht

Statt der Sackgasse zwei Wege, und beide führen irgendwohin:

* **„Ich arbeite in einem Studio"** — eine Auskunft. Verschwindet, wenn
  die Selbstanmeldung offen ist; dann gibt es ja den Reiter.
* **„Ich führe ein Studio"** — ein Knopf. Öffnet ein Angebot-Fenster:
  *„Schluss mit WhatsApp und Zetteln am Tresen"*, vier konkrete Punkte,
  und der stärkste Satz, den dieses Produkt hat: **„Wir benutzen es
  selbst — jeden Tag, in vierzehn Studios."**

**Ohne Preise und ohne Kaufknopf**, und beides mit Grund: die Zahlen in
`ABO-PLAN.md` sind ausdrücklich als Platzhalter markiert („Ich kenne
euren Markt nicht"), und Stripe ist Stufe C und wartet auf den
Steuerberater. Eine Zahl dort wäre eine Zusage, die der Betrieb nie
gemacht hat; ein Knopf, der nach Bezahlen aussieht und keins ist, kostet
mehr Vertrauen als er einbringt.

Die Anfrage geht per `mailto` an `KONFIG.vertriebMail`. Ist das Feld leer
— und im Auslieferungsstand ist es das, das Repo ist öffentlich —, steht
dort ein Hinweis statt eines toten Knopfes.

```
Abgeschnitten 0 · Fenster 11, alle Kreuze gross genug · Regression 65 grün
```

---

## Sitzung 42 · Drei Meldungen aus dem Betrieb, drei echte Fehler 🔴🟢

### 1. „Ich kann keinen Chef anlegen"

```js
<select id="emRole">   bot drei Rollen an
createEmployee()       kannte zwei:
    var role = value==='leiter' ? 'leiter' : 'mitarbeiter';
```

„Chef" fiel auf „Mitarbeiter" — **ohne Fehlermeldung, mit grüner
Bestätigung**. Die Datenbankregeln erlauben es seit jeher
(`allow create: if isChef()`), es kam nur nie dort an.

Dazu zwei Dinge am selben Feld: der Hinweis darunter stand fest auf
„Studio-Leiter", egal was gewählt war, und „mindestens ein Studio" galt
auch für den Chef, der ohnehin alle hat. Ohne Auswahl bekommt er jetzt
alle eingetragen — nicht aus Bequemlichkeit: ein paar Stellen lesen
`studioKeys` direkt (Empfängerkreis einer Ankündigung), eine leere Liste
liesse ihn dort ins Leere laufen.

### 2. Der Suchen-Knopf, mit Bild belegt

Ab 700 px schaltet eine Regel das Wort „Suchen" neben die Lupe. `.icon-btn`
ist aber ein **Grid mit `place-items:center`**, gedacht für genau ein Kind.
Das zweite legte das Grid in eine zweite **Zeile**, und die feste Höhe von
36 px liess es unten herausstehen:

```
Zeichen y=13 · Wort y=39 · Wortunterkante 55 · Knopfrand 52
```

Warum es keine Prüfung fand: die Forensik misst bei 390 px, dort ist das
Wort `display:none`. **Niemand hat je oberhalb von 430 px gemessen.**
`test-abgeschnitten.js` prüft jetzt auch 820 px und kennt eine vierte Art
— Inhalt, der aus seinem eigenen Knopf herausragt, ohne dass irgendwo
`overflow:hidden` steht.

### 3. „Gelöschte E-Mails lassen sich nicht wieder verwenden"

„Zugang entfernen" löschte nur `users/<uid>`. Das **Anmeldekonto in
Firebase Auth blieb stehen** — die Adresse damit für immer belegt, und
beim nächsten Anlegen kam `auth/email-already-in-use`.

Der Bestätigungstext behauptete dabei: *„Die Person kann sich danach nicht
mehr anmelden."* Das stimmte nicht. Anmelden ging weiter, es fehlte nur
das Profil.

| neu | was sie tut |
|---|---|
| `zugangEntfernen` | löscht Anmeldekonto **und** Profil. Erst das Konto, dann das Profil — andersherum bliebe bei einem Fehler genau der Zustand zurück, den wir abschaffen |
| `adresseFreigeben` | für die **alten** Fälle: ein Konto ohne Profil, dessen Adresse bis heute belegt ist. Steht noch eine aktive Person dahinter, wird abgelehnt — dafür gibt es die Team-Liste mit Rückfrage |

In der App erscheint bei „E-Mail bereits verwendet" jetzt ein Knopf
*„Adresse freigeben und erneut anlegen"* statt einer Meldung, gegen die
man nichts tun kann.

```
Regeln 165 · Kreuz 132 · Rechte 67 · Umzug 12 · Functions 118 — alle grün
```

Jede neue Funktion mit Gegenproben, und die sind hier die wichtigere
Hälfte: ein Chef von Alpha entfernt keinen Zugang bei Beta, ein
Mitarbeiter entfernt gar nichts, der Chef entfernt sich nicht selbst, und
eine Adresse mit aktivem Zugang wird nicht freigegeben.

### Nebenbei: ein bekanntes Loch festgehalten

`allow create: if isChef()` fragt nicht nach der Firma — ein Chef von A
kann ein Konto anlegen, das auf Firma B zeigt. **Nicht** in diesem Zug
behoben: die Bedingung bräuchte `request.resource.data.firma ==
meineFirma()`, und das liefert bei Konten ohne Feld `firma` leer. Dann
könnte der Chef gar keine Zugänge mehr anlegen — genau die Funktion, um
die es hier ging. Erst müssen alle Konten das Feld tragen. Der
Regel-Durchlauf hält den Zustand als `BEKANNT OFFEN` fest.

---

## Sitzung 43 · Zwei Runden, die nicht jeder mitliest 🟢

Auftrag: ein eigener Chat für die Chefs und einer für die Studio-Leiter,
in dem die Chefs mit drin sind. Nachgereicht: als eigener Reiter, nicht
in dieselbe Leiste.

| Kanal | wer |
|---|---|
| `gruppe-chefs` | nur Chefs |
| `gruppe-leitung` | Chefs **und** Studio-Leiter |

### Die Sperre steht in den Regeln, nicht in der Oberfläche

`buildChannels()` zeigt einem Mitarbeiter diese Knöpfe gar nicht — aber
wer die Konsole öffnet, ruft den Pfad direkt auf. Eine Liste, die man
nicht sieht, ist keine Sperre. Deshalb `kanalErlaubt(kanal)` in
`firestore.rules`, angewandt auf **read, create, update und delete**, und
in **beiden** Blöcken (flach und Firmen-Pfad).

Zwölf Prüfungen im Emulator, darunter drei Gegenproben — ohne sie wäre
„die Gruppen sind dicht" auch dann grün, wenn der ganze Chat zu wäre:

```
✓ Chefrunde: ein Studio-Leiter kommt NICHT hinein
✓ Chefrunde: ein Mitarbeiter schreibt auch nicht hinein
✓ Leitungsrunde: der Chef ist auch drin
✓ GEGENPROBE der normale Teamchat bleibt fuer alle offen
✓ GEGENPROBE ein Mitarbeiter liest weiterhin seinen Studiokanal
```

### Ein eigener Reiter, kein sechzehnter Kanal

Bei vierzehn Studios stünde „Chefs" hinter sechs Wischbewegungen. Über
der Kanalleiste sitzt jetzt eine schmale Umschaltung **Studios |
Gruppen** — bewusst anders aussehend als die Kanäle selbst (kleiner, in
einer Wanne), damit niemand denkt, „Gruppen" sei auch nur ein Kanal.

Sie erscheint **nur, wenn es etwas dahinter gibt**: ein Mitarbeiter
bekommt sie nicht zu sehen. Ein Reiter, hinter dem nichts liegt, ist
schlimmer als keiner.

| Rolle | Reiter | Gruppen |
|---|---|---|
| Chef | ja | Chefs · Leitung |
| Studio-Leiter | ja | Leitung |
| Mitarbeiter | **nein** | — |

### Zwei Kleinigkeiten, die sonst später weh getan hätten

* **Ungelesenes** wird für *alle* eigenen Kanäle gezählt, nicht nur für
  die gerade gezeigten — sonst merkt ein Chef nichts von der Chefrunde,
  solange er auf „Studios" steht.
* **Der offene Kanal** wird beim Umschalten mitgezogen. Ohne das stünde
  man vor einer Leiste ohne Markierung und läse einen Kanal, den man
  nicht sieht.

### Was bewusst NICHT mitgeändert wurde

`allow read: if istAktiv()` gilt für `allgemein` und die Studiokanäle
weiterhin für jeden Aktiven — auch für Studios, in denen er nicht
arbeitet. Das ist eine alte Entscheidung, und sie hier nebenbei zu
verschärfen wäre falsch: es braucht eine eigene Runde mit einem Blick
darauf, wer im Betrieb quer über Studios arbeitet. Steht als Kommentar
bei `kanalErlaubt`.

---

## Was aus früheren Runden noch offen ist

Vollständig in `OFFEN.md`. Kurzfassung:

| Was | Wer |
|---|---|
| ~~Speicher + zwei Rollen + Budget-Warnung~~ | ✅ 9.8. erledigt |
| ~~`MATERIAL-SHEETS.gs` in Apps Script einfügen~~ | ✅ 9.8. erledigt |
| ~~Wischen zum Abhaken am echten Gerät prüfen~~ | ✅ 9.8. bestätigt |
| E-Mail-Absender auf eigene Domain vor Kunden-Mails | du, später |
| Google-Tabelle: Formatieren vom Schreiben trennen | ich, bei Bedarf |
| Suche über alle Studios | bewusst nicht gebaut |
| Mehrere Firmen in einer App | ab dem 5./6. Kunden |
| KI-Funktionen | Datenschutz zuerst |
