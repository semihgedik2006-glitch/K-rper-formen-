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

## Sitzung 44 · Die strenge Regel ausgerollt — und ein zweites Loch gefunden 🔴🟢

Der Betreiber hat die Vorbedingung geprüft und gemeldet:

```
12 Konten · 11 mit „koerperformen" · 1 andere Firma · 0 ohne Feld
✓ Alles gesetzt. Die strenge Regel kann ausgerollt werden.
```

Damit war der Weg frei für den Punkt, der seit dem 17.8. als `BEKANNT
OFFEN` festgehalten war: `allow create: if isChef()` fragte nicht nach
der Firma.

### Erst gemessen, dann geschrieben

Statt die eine bekannte Zeile zu ändern, erst im Emulator nachgesehen,
**was heute wirklich möglich ist**:

```
MÖGLICH  Chef A legt ein Konto mit firma:beta an
MÖGLICH  Neuling legt sich SELBST mit firma:beta an
MÖGLICH  Neuling liest danach ein Konto von Beta
```

Der zweite Weg stand nirgends. Er ist der **leichtere und
gefährlichere**: er braucht keinen Chef-Zugang, nur eine Anmeldung. Der
Grund lag daneben — `codeStimmt()` liest seit jeher den **flachen**
`config/registrierung`, während der Code seit dem Umzug unter
`firmen/<kennung>/config/registrierung` liegt. Die Prüfung ging am
richtigen Dokument vorbei.

### Was jetzt gilt

| | |
|---|---|
| Chef legt an | nur in der **eigenen** Firma (`firma == meineFirma()`) |
| Selbst anlegen | die beanspruchte Firma muss **ihren eigenen** Code haben — `codeStimmtFuer(uid, firma)` |

```
gesperrt Chef A legt ein Konto mit firma:beta an
gesperrt Neuling legt sich SELBST mit firma:beta an
gesperrt Neuling liest ein Konto von Beta
```

### Eine Verschärfung wieder zurückgenommen

Zwischendurch stand hier zusätzlich: „sofort aktiv nur mit vorgezeigtem
Code". Das hat **zwei bestehende Prüfungen umgeworfen** — „Neuanmeldung
als Mitarbeiter ist erlaubt" und „OHNE Schranken: Selbstregistrierung
geht wie bisher". Beide legen ein Profil ohne Feld `firma` an, in der
alten Form, und beide halten eine bewusste Entscheidung fest: **ein
Betrieb ohne hinterlegten Code ist offen.**

Diese Entscheidung gehört dem Betreiber, nicht der Regel. Also
zurückgenommen und im Kommentar festgehalten, warum. Was bleibt, ist die
engere und richtige Aussage: wer eine Firma beansprucht, **die** einen
Code hat, muss ihn kennen.

**Für den Betrieb heisst das:** der Firmencode (Verwaltung → Team, zwei
Minuten) schliesst jetzt zusätzlich diese Tür. Die Zeile stand schon
länger auf der Liste; seit heute hängt mehr daran.

```
Regeln 165 · Kreuz 132 · Rechte 84 · Umzug 12 · Functions 118
```

Sechs neue Prüfungen, drei davon Gegenproben — dass der Chef in der
eigenen Firma weiterhin anlegt, dass die Anmeldung mit dem richtigen Code
durchgeht und mit dem falschen nicht.

---

# 45 · „Merge hat nicht geklappt" — der Merge schon, die Prüfung nicht

**17. August 2026**

Gemeldet mit vier Worten. Der Merge selbst war nachweislich durch:
`main` stand auf `385dd69`, der Pull Request auf `merged: true`. Rot war
etwas anderes — der Lauf danach.

```
Cloud Functions deployen · 385dd69
  hosting     ✅ grün      die App ging raus
  regeltest   ❌ rot       162 bestanden, 3 gefallen
  rules       ⏭️ übersprungen
  deploy      ⏭️ übersprungen
```

Die App war also draußen, die neuen **Regeln nicht**. Genau die aus
Runde 44, die gerade erst scharf gestellt wurden. Sichtbar kaputt war
nichts — deshalb hätte es lange so bleiben können.

## Die drei gefallenen Prüfungen

```
✗ Neuanmeldung als Mitarbeiter ist erlaubt
✗ OHNE Schranken: Selbstregistrierung geht wie bisher
✗ MIT RICHTIGEM Code und aktiv:false: angenommen
```

Alle drei legen ein Profil **ohne Feld `firma`** an. Dieselben drei
Prüfungen liefen hier auf dem Rechner grün. Fünfmal.

## Warum hier grün und dort rot

Nicht der Code war anders, sondern das Werkzeug:

| | Version |
|---|---|
| `tests/rules/package.json` | `^14.0.0` |
| `tests/rules/node_modules` (hier) | **15.26.0** |
| `npm install` in der Auslieferung | **14.27.0** |

Ohne Sperrdatei holt sich die Auslieferung bei jedem Lauf die neueste
14er. Hier lag seit irgendwann eine 15er. Die beiden Emulatoren sind
sich bei einer Sache uneinig:

```
codeDerFirma(f)  →  firmen/$(f)/config/registrierung
```

Ist `f` leer — und das ist es bei jedem Profil ohne Firma — entsteht
`firmen//config/registrierung`, ein Pfad mit leerem Segment. Der
Emulator aus 15 nimmt das hin und antwortet „gibt es nicht". Der aus 14
bricht die Auswertung ab. Abbruch heißt in Firestore: verboten.

Nachgemessen, nicht vermutet: dieselbe Datei, derselbe Commit, nur die
Version getauscht.

```
firebase-tools 15.26.0 → 165 bestanden, 0 gefallen
firebase-tools 14.27.0 → 162 bestanden, 3 gefallen
```

## Der Fix

Der Pfad darf gar nicht erst gebaut werden. Der nicht genommene Zweig
eines `?:` wird nicht ausgewertet:

```
function codeDerFirma(f) {
  return f == ''
    ? flacherCode()
    : (exists(…firmen/$(f)/config/registrierung)
        ? get(…).data.get('code', '')
        : flacherCode());
}
```

Für den Betrieb ändert sich damit nichts: ein Konto ohne Firmenfeld
wird wie vorher am flachen `config/registrierung` gemessen.

## Die eigentliche Lehre

Der Regelfehler ist die kleinere Hälfte. Die größere: **eine Prüfung,
die woanders läuft als die Auslieferung, prüft nichts.** Sie ist
schlimmer als keine, weil sie Sicherheit vortäuscht. Fünf grüne
Durchläufe in Runde 44 haben genau nichts bewiesen.

Zwei Dinge dagegen:

1. Feste Versionen in `tests/rules/package.json` — kein `^`, kein `~`.
2. `tests/test-regelumgebung.js`, neu. Prüft keine Regel, sondern das
   Werkzeug: sind die Versionen fest, liegt genau das installiert, und
   installiert die Werkbank aus derselben Liste. Mit Gegenprobe — mit
   `^14.0.0` und mit einer falschen Zahl wird sie rot, beides gemessen.

## Und eine dritte Sache, die dabei auffiel

Der Pull Request selbst hatte **gar keine Prüfung**: `total_count: 0`.
Die Werkbank lief nur beim Push auf `main`. Ein Regelfehler fiel also
grundsätzlich erst auf, wenn `main` ihn schon hatte — und weil `hosting`
absichtlich nicht an `regeltest` hängt, war die App dann trotzdem
draußen. Genau diese Kombination hat die vier Worte erzeugt.

`regeltest` läuft jetzt auch bei `pull_request`, bewusst ohne
`paths`-Filter: die Liste oben ist die der *ausgelieferten* Dateien,
nicht die der Dinge, die eine Regel umwerfen können. Eine Änderung an
`tests/rules/**` liefert nichts aus und gehört trotzdem geprüft.

Das Gegenstück dazu ist wichtiger als der Auslöser selbst: `rules`,
`hosting` und `deploy` tragen jetzt `if: github.event_name !=
'pull_request'`. Ohne das wäre jeder offene Zweig ein Deploy in die
Produktion gewesen — die Absicherung wäre schlimmer als die Lücke.
Beides steht in derselben Prüfung, beides mit Gegenprobe gemessen.

```
Regeln 165 · Kreuz 132 · Rechte 84 · Umzug 12 · Functions 118
        alles unter firebase-tools 14.27.0, der Version der Auslieferung
```

---

# 46 · „Mein Bereich" — ein Ort für das, was einen selbst betrifft

**17. August 2026**

Gewünscht als „ein ganz neuer Bereich, der für jeden selber ist". Der
Anlass dafür stand schon vorher in der App, nur verteilt. Wer wissen
wollte, wann er arbeitet, was er zu tun hat und wann sein Schein
abläuft, besuchte drei Seiten und ein Fenster:

| Was | Wo es steckte |
|---|---|
| Mein Dienst | Karte auf Start |
| Meine Aufgaben | Betrieb → Aufgaben, gefiltert |
| Urlaub / Krank | Team → Abwesend |
| Meine Nachweise | Einstellungs-Fenster hinter dem Avatar |

## Was der Bereich ist — und was er nicht ist

Vier Reiter: **Woche · Kalender · Notizen · Ich**.

Er legt dabei **nichts doppelt an**. Schichten, Abwesenheiten,
Aufgaben, Nachweise und Probetrainings werden dort gelesen, wo sie
ohnehin liegen — die Seite ist eine zweite Brille auf vorhandene Daten,
keine zweite Ablage. Neu ist nur, was es vorher nirgends gab: eigene
Termine und Notizen.

In der Wochenliste steht neben jeder Zeile, woher sie stammt. Ohne das
steht „Zahnarzt" neben „Dienst Hürth" und niemand weiß mehr, was die
Verwaltung sieht und was nicht.

## Die Stelle in der Leiste war eine Entscheidung

Zweite Stelle, nicht letzte. Hinten anzuhängen wäre bequemer gewesen
und hätte den Bereich beim Chef auf Platz sechs geschoben — also hinter
den Rand der Leiste. Etwas, das man wegwischen muss, um es zu finden,
ist für einen neuen Bereich dasselbe wie nicht vorhanden. Chat rutscht
dafür auf drei und bleibt auch auf 320 Pixel im Bild.

## Privat heißt privat — und die Grenze steht daneben

Termine und Notizen liegen unter `firmen/<f>/privat/<uid>/`. Das ist
die einzige Sammlung dieser App, die der Chef **nicht** lesen darf. In
der Regel steht bewusst kein `isChef()` und kein Admin: ein Notizblock,
bei dem man überlegen muss, was man hineinschreibt, ist keiner.

Die `uid` steckt im **Pfad**, nicht im Dokument. Damit entscheidet die
Regel ohne einen einzigen `get()`, und eine Abfrage über fremde
Einträge ist gar nicht erst formulierbar.

Was **nicht** stimmt und deshalb direkt am Notizblock steht: das ist
eine Regel für Clients, keine Verschlüsselung. Wer Zugang zur
Firebase-Konsole hat, liest mit. Der Hinweis nennt beides — „kein
anderes Konto kommt hier heran, auch die Verwaltung nicht" **und**
„verschlüsselt ist es aber nicht". Ein Versprechen, das die Technik
nicht hält, wäre schlimmer als gar kein Notizblock, und der Durchlauf
prüft genau diesen zweiten Halbsatz mit.

## Zwei Fehler, die beim Bauen aufgefallen sind

**Abwesenheiten mit `where('from', …)` im Fenster.** Eine Woche Urlaub
hat `from` vor dem Zeitraum und `to` danach — mit einer Abfrage auf
`from` fällt ausgerechnet die durch, die man am dringendsten sehen
will. Jetzt `where('to','>=',von)` und das andere Ende beim Filtern.

**`--f-*` als Textfarbe.** Die Statusfarben sind Flächen, keine
Schriftfarben: halbdurchsichtig auf halbdurchsichtig ist nicht lesbar.
Für Schrift gibt es `--ok-tx`, `--warm-tx`, `--danger-tx`, und die sind
in beiden Modi gesetzt.

## Nachgemessen

```
Regeln 165 · Kreuz 132 · Rechte 100 · Umzug 12 · Functions 118
                                ↑ 16 neue, alle zu „privat"
```

Die 16 behaupten etwas: mit einer auf `isChef()` aufgeweiteten Regel
werden genau **sieben** davon rot, der Betreiber eingeschlossen.
Gemessen, dann zurückgesetzt.

`tests/test-mein-bereich.js`, neu. Prüft nicht „der Reiter ist da",
sondern die drei Stellen, an denen ein Fehler teuer wäre: **was**
geschrieben wird und **wohin** (`privat/<uid>/termine`, nicht in eine
geteilte Sammlung), dass der Hinweis beide Hälften sagt, und dass keine
Fläche leer bleibt. Dazu der Kalender gegen eine Behauptung, die
stimmen muss — der Februar hat nie 31 Tage; über 13 Monatswechsel
gemessen: `30,31,30,31,31,28,31,30,31,30,31,31,30`.

Gegenproben überall: ein leerer Titel schreibt nichts, ein erfundener
Reiter schaltet nichts, und ein echter `console.error` kommt trotz der
Konsolen-Sperre an — sonst wäre die Prüfung ab dem ersten Tag Zierrat.

---

# 47 · Leichter, eine To-do-Liste, und weniger Erklärung

**18. August 2026**

Rückmeldung nach einem Tag Betrieb: der Bereich soll ansprechender und
leichter aussehen, eine To-do-Liste bekommen, mehr im Kalender
zulassen — und die Erklärungstexte sollen weg.

## Die Erklärungstexte

Am Notizblock stand: „Kein anderes Konto kommt hier heran – auch die
Verwaltung nicht. Verschlüsselt ist es aber nicht: wer Zugang zur
Datenbank selbst hat, kann es lesen."

Gestrichen, auf Wunsch aus dem Betrieb, mit einer Begründung, die
trägt: es ist kein Tagebuch, und wer die App benutzt, muss die
Datenbank dahinter nicht kennen. Ich hatte den Satz eingebaut, weil ich
kein Versprechen geben wollte, das die Technik nicht hält. Das bleibt
richtig für die Regel — der Kommentar in `firestore.rules` sagt es
weiterhin —, aber es gehört nicht in die Oberfläche eines
Notizblocks für Arbeitsnotizen.

Mitgegangen sind die anderen drei Absätze (Kalender, Nachweise,
Zahlen). Zusammen 4 Hinweisabsätze, jetzt **null**.

Was die Prüfung STATT der alten Behauptung festhält, ist das, was der
Wunsch eigentlich meinte:

```
✗ ZU VIEL TEXT: im Bereich stehen Erklärungsabsätze (…)
✗ WIEDER DA: die Erklärung über Datenbank und Verschlüsselung …
```

Eine Erklärung schleicht sich sonst zurück — drei Sätze später steht
wieder ein Absatz über der Eingabe.

## Leichter: Blätter statt Karten

Die anderen Seiten sind Werkzeug für den Betrieb. Diese hier sieht man
morgens einmal an. Deshalb `.ich-blatt` statt `.card`: Abstand statt
Kasten, eine Trennlinie nur da, wo wirklich zwei Dinge nebeneinander
stehen.

Der Kalender hat den größten Sprung gemacht:

| vorher | jetzt |
|---|---|
| `min-height:44px` | `aspect-ratio:1` — quadratisch auf jeder Breite |
| heute mit Ring | heute **gefüllt**, gewählt mit Ring |
| `gap:2px` | `gap:4px`, größere Radien |
| drei `btn-ghost` | eigene, ruhigere `.ich-pfeil` |

Die feste Höhe war der eigentliche Fehler: auf einem breiten Bildschirm
wuchs das Raster in die Breite und blieb 44 Pixel hoch — sieben
Briefkastenschlitze. Und zwei Ringe nebeneinander (heute, gewählt)
lesen sich als zwei gleichrangige Zustände; jetzt ist einer gefüllt.

## To-do-Liste

Eigener Reiter, eigene Sammlung `privat/<uid>/aufgaben`. **Getrennt von
den Studio-Aufgaben** unter Betrieb: die kommen von der Leitung und
gehören einem Studio. Was man sich selbst vornimmt, geht niemanden
sonst etwas an — und soll auch niemanden sonst erreichen.

Mit Frist stehen die Punkte am jeweiligen Tag in Woche und Kalender.
Kästchen 24 Pixel sichtbar, 44 tastbar (`::after`-Fläche): das ist das,
was man am häufigsten trifft, und Daumen sind ungenau. Erledigtes
klappt hinter eine `.nachfrage` weg.

Enter im Textfeld legt an, und der Fokus bleibt stehen — wer einen
Punkt einträgt, trägt meistens zwei ein.

## Mehr im Kalender

Aus Titel + Uhrzeit wurden **Titel, Von, Bis, Ort, Notiz**. Das
Formular liegt hinter einer Aufklappzeile: wer nur nachsehen will, was
ansteht, soll nicht durch sechs leere Felder scrollen.

Ein Ende vor dem Anfang wird abgewiesen statt still gespeichert — sonst
stünde später „14:00–09:00" im Kalender und niemand wüsste, was gemeint
war. Ort und Notiz stehen unter der Zeile, nicht daneben: auf 320 Pixel
wäre sonst der Titel das erste, was abgeschnitten wird.

## Der Fehler, den ich fast wieder gemacht hätte

Beim Umbau des CSS habe ich fünf Token benutzt, die es nicht gibt:
`--r-8`, `--r-12`, `--s14`, `--lh-locker`, `--ls-weit`. Genau die
Sorte, die keine Fehlermeldung erzeugt — eine undefinierte Variable
macht die Eigenschaft ungültig, und die Zelle sieht dann eben anders
aus.

Gefunden, weil ich diesmal **vor** dem Testlauf jedes `var(--…)` im
neuen Block gegen die Definitionen geprüft habe. Das ist jetzt der
Handgriff: nach jedem CSS-Block einmal gegenlesen, welche Variablen es
wirklich gibt.

## Nachgemessen

```
Rechte 103 · davon 19 zu „privat"
```

Drei neue darunter halten fest, dass die Platzhalter-Zeile `{rest=**}`
auch Sammlungen abdeckt, die es beim Schreiben der Regel noch nicht
gab — `aufgaben` kam einen Tag später dazu. Wer die Zeile später durch
eine Liste einzelner Sammlungen ersetzt, macht jede neue lautlos
öffentlich; ab jetzt fällt das auf.

---

# 48 · Tippfehler, eine zuckende Kopfzeile, und ein Kalender mit Arten

**18. August 2026**

Drei Meldungen aus dem Betrieb an einem Tag. Zwei davon sind Fehler,
die ich selbst gebaut hatte.

## „Es ist voll der Film, wenn man sich verschrieben hat"

Der Artikelname in der Materialliste stand als reiner **Text** in der
Zeile. Bedienbar waren nur die drei Zahlen und das Löschkreuz. Wer sich
vertippt hatte, musste die Zeile löschen und neu anlegen — und verlor
dabei Soll- und Ist-Bestand.

Jetzt ein Feld, das wie Text aussieht, bis man hineintippt. Kein
Bearbeiten-Knopf, kein Modus: die Zeile ist an derselben Stelle
dieselbe Sache.

Gespeichert wird beim **Verlassen**, nicht bei jedem Tastendruck —
sonst stünde nach „Handtuc" eine Sekunde lang genau das in der
Datenbank, und wer gleichzeitig zählt, sieht es. Escape nimmt zurück,
leer wird abgewiesen. Ändern darf, wer auch löschen darf.

## Die zuckende Animation beim Scrollen

Eine echte Rückkopplung, kein Gefühl. Die Kopfzeile liegt **außerhalb**
des Scroll-Bereichs; schrumpft sie, wird der Bereich höher, und damit
sinkt der größte mögliche `scrollTop`. Bei knapp scrollbarem Inhalt
fiel er unter die Schwelle, die Marke ging weg, der Kopf wuchs,
`scrollTop` stieg wieder darüber — und von vorn.

```
ohne Bremse   47px Überhang → 17 Wechsel in gut einer Sekunde
mit Bremse    47px Überhang →  0
              287px Überhang →  1   (der gewollte)
```

Die Bremse: schrumpfen nur, wenn danach noch genug Weg übrig bleibt
(`gibtHer + 28`). Der Wert wird **gemessen**, nicht geschätzt — die
Schriftgrößen-Einstellung verschiebt ihn, und eine feste Zahl wäre bei
einer der Einstellungen falsch.

Auf einer Seite, die ohnehin kaum scrollt, bringt das Schrumpfen auch
nichts. Es ist also keine Einschränkung, sondern das Weglassen einer
Bewegung ohne Nutzen.

## Kalender: ändern, ganztägig, vier Arten

**Ändern statt löschen-und-neu.** Dieselbe Frustration wie bei der
Materialliste. Zwei Dinge daran sind leicht zu übersehen und beide
geprüft:

- Es muss ein `update()` sein, kein `set()`. Ein `set()` aus einem
  Formular heraus löscht jedes Feld, das gerade nicht gefüllt ist — der
  Eintrag verlöre still seine Notiz.
- Das **Datum** darf nicht mitgeschrieben werden. Man bearbeitet den
  Eintrag von seinem Tag aus; ein Tippfehler-Fix wäre sonst ein
  Verschieben auf den gerade angeklickten Tag.

**Ganztägig** blendet die Uhrzeiten aus, statt sie zu sperren — ein
graues Feld, das man nicht bedienen kann, wirft die Frage auf, warum es
da ist. Eine Uhrzeit, die vorher im Feld stand, wird beim Speichern
verworfen; ein ganztägiger Eintrag mit Uhrzeit ist ein Widerspruch.

**Vier Arten** (Allgemein, Privat, Arbeit, Wichtig) mit je einer Farbe,
an drei Stellen dieselbe: Punkt im Raster, Plakette in der Liste,
Auswahl im Formular. Nicht mehr als vier — ab etwa fünf Tönen
unterscheidet man sie in einem 6-Pixel-Punkt nicht mehr zuverlässig,
und dann ist die Farbe keine Hilfe, sondern Dekoration.

## Drei Fehler, die beim Bauen auffielen

**`withBusy()` machte mein Zurücksetzen rückgängig.** Der Helfer merkt
sich den Knopftext beim Klick und stellt ihn in seinem `done()` wieder
her. Das läuft in derselben Microtask-Kette wie das `then()` des
Speicherns — „Eintragen" wurde also sofort wieder zu „Speichern". Ein
`setTimeout(…, 0)` ist ein Macrotask und kommt danach.

**Der Test lief auf einer unsichtbaren Karte.** Ein Abschnitt klickte
denselben Tag an, den ein früherer schon gewählt hatte — der Umschalter
wählte ihn damit ab. Die Tageskarte war zu, die Knöpfe darin fand
`querySelector` trotzdem, und die Runde meldete grün. Seitdem prüft sie
zuerst, ob die Karte überhaupt sichtbar ist.

**Der Gegencheck zur Scroll-Bremse war zuerst wertlos.** Ich hatte die
Bremse ausgehängt, ohne den CSP-Hash neu zu setzen. Das Skript wurde
blockiert, alles maß 0, und der Durchlauf wurde rot mit „MESSUNG LEER"
— also aus dem richtigen Grund rot, aber nicht aus dem, den ich prüfen
wollte. Zweiter Anlauf mit gültigem Hash: die 17 Wechsel.

## Nachgemessen

`tests/test-scrollkopf.js` und `tests/test-material-name.js`, beide
neu, beide mit Gegenprobe in **beide** Richtungen. Beim Scrollkopf ist
die zweite Hälfte die wichtigere: ohne sie wäre der Durchlauf auch dann
grün, wenn die Bremse so scharf steht, dass die Kopfzeile nie mehr
schrumpft — die Funktion wäre stillschweigend abgeschafft.

Nebenbei repariert: `test-material-bereich5.js` las den Artikelnamen
über `textContent`. Bei einem `<input>` ist das immer leer — die Runde
verglich `""` mit `""` und war grün, egal an welcher Stelle die Zeile
zurückkam.

Und der Attrappe beigebracht, `update()` und `delete()` mitzuschreiben.
Ohne das kann ein Durchlauf `set()` und `update()` nicht
auseinanderhalten — und genau dieser Unterschied entscheidet, ob eine
Änderung die Notiz behält.

---

# 49 · Kalender und To-dos: verschieben statt neu anlegen

**18. August 2026**

Eine lange Wunschliste aus dem Betrieb. Zwei Punkte davon sind hier
drin, drei stehen noch aus (Notizen für den Trainer-Alltag, Lizenzen
selbst eintragen, Animationen).

## Kalender

**Doppelklick legt sofort an.** Tag doppelklicken → Formular auf, Datum
gesetzt, Cursor im Titel. Auf dem Handy gibt es keinen Doppelklick;
dort bleibt der Weg über die Tageskarte.

Der Punkt, an dem das schiefgeht: der Doppelklick muss den Tag
**wählen**, nicht nur das Formular öffnen. Sonst landet der Eintrag am
zuletzt offenen Tag. Der Durchlauf wählt deshalb erst einen anderen Tag
und prüft dann, wo wirklich angelegt wird.

**Verschieben** heißt: das Datum steht im Formular. Kein Ziehen, das auf
dem Handy ohnehin schwer zu treffen ist. Nach dem Verschieben geht die
Ansicht mit — bliebe sie am alten Tag, sähe Verschieben aus wie Löschen.

**Wiederholung** wöchentlich, zweiwöchentlich, monatlich. Bewusst nicht
vervielfacht geschrieben: es bleibt **ein** Dokument, gerechnet wird
beim Anzeigen. Sonst hätte „jede Woche" nach einem Jahr 52 Zeilen, und
eine Änderung müsste 52-mal nachgezogen werden.

Preis davon, offen gesagt: eine einzelne Ausnahme („diese Woche fällt
aus") gibt es nicht. Das wäre ein Feld mit Ausnahmelisten — mehr
Maschinerie, als ein Notizkalender verdient.

**Wochenansicht.** Der Monat zeigt, *dass* etwas ist; die Woche zeigt,
*wann*. Beide teilen sich dieselbe Zelle und dieselben Punkte — zwei
Bauarten für dasselbe laufen sonst auseinander.

**Am Rechner auf eine Seite.** Ab 821 px flachere Zellen, Raster auf
640 px gedeckelt, Raster und Tageskarte nebeneinander. Gemessen: 359 px
Raster in 758 px Platz. Auf dem Handy bleibt die Zelle quadratisch —
dort braucht der Daumen die Fläche.

## To-dos

**Verschieben per Griff**, gezogen mit Zeigerereignissen statt
HTML5-Drag: funktioniert auf dem Handy wie mit der Maus.

Der Griff ist die **einzige** Stelle mit `touch-action:none`. Wäre die
ganze Zeile ziehbar, ließe sich die Liste auf dem Handy nicht mehr
scrollen, ohne etwas zu verschieben. Der Durchlauf zieht deshalb einmal
am Griff (muss sortieren) und einmal daneben (darf nicht).

Geschrieben wird erst beim Loslassen, und nur die Zeilen, deren
Position sich wirklich geändert hat.

**Handsortierung gewinnt vor der Frist.** Zwei Ordnungen gleichzeitig
wären nicht erklärbar: man zieht etwas nach oben und es rutscht wieder
weg. Die Frist steht weiter daneben und wird überfällig rot, sortiert
aber nicht mehr um.

Dazu Stern für Wichtiges, Notiz je Punkt, und Ändern direkt in der
Zeile — die wird zum kleinen Formular und wieder zurück.

## Nachgemessen

```
Wöchentlich ab dem 12. → 12., 19., 26. — und NICHT am 13.
                          dabei 2 Dokumente in der Ablage, nicht 5
Doppelklick auf den 20. → angelegt am 20., obwohl der 5. offen war
Verschieben 05. → 20.   → update, Ansicht folgt
Woche                   → 7 Tage, Montag bis Sonntag, lückenlos
Am Rechner              → 359px Raster in 758px Platz

Ziehen am Griff   → 3× update mit sort 0,1,2
Ziehen daneben    → keine Änderung
```

Zwei neue Durchläufe, `tests/test-kalender.js` und
`tests/test-todos.js`. Beide mit Gegenprobe: ohne die Runde „nicht am
13." wäre auch ein „fällt immer" grün, und ohne „neben dem Griff" auch
eine Liste, die sich beim Scrollen selbst sortiert.

Nachgezogen: die Behauptung „beim Ändern wird kein `datum` geschrieben"
stimmt nicht mehr — das Datum **ist** das Verschiebe-Feld. Sie prüft
jetzt, dass eine Änderung ohne Anfassen des Feldes den Eintrag an
seinem Tag lässt. Der eingespielte Termin liegt dafür bewusst nicht am
Monatsersten, sonst wäre „bleibt an seinem Tag" nicht von „nimmt den
angeklickten Tag" zu unterscheiden.

---

# 50 · Nicht jeder Chef bekommt jede Mail

**18. August 2026**

Aus dem Betrieb: „das nicht JEDER Chef jede Mail bekommt zu jedem Thema,
und dass er das selber ausschalten kann."

Bei 14 Studios heißt „Studio fertig" bis zu **14 Mails am Tag** — an
jeden Chef. Wer das nicht abstellen kann, stellt irgendwann den ganzen
Absender ab, und dann kommt auch die eine Mail nicht mehr an, auf die es
ankommt.

Drei Sorten, je Konto abschaltbar: neue Aufgabe, Studio fertig
(nur Chefs), Monatsbericht (nur Chefs).

## Zwei Entscheidungen, die den Unterschied machen

**Gespeichert wird, was AUS ist** (`mailAus`), nicht was an ist. Sonst
bekäme nach dem Ausrollen niemand mehr etwas, bis jedes Konto von Hand
nachgepflegt ist. So gilt ohne Zutun weiter alles wie bisher.

**Gerät und Konto stehen getrennt untereinander**, mit zwei
Überschriften. Der Push-Schalter gilt je Gerät, der Mail-Schalter je
Konto. Hält man das für dasselbe, stellt man das Falsche ab und wundert
sich.

Ein Mitarbeiter sieht nur „neue Aufgabe". Die anderen zwei bekommt er
nie — ein Schalter dafür verspräche etwas, das ohnehin nicht passiert.

Keine Regeländerung nötig: `mailAus` fällt nicht unter die gesperrten
Felder, die ein Konto an sich selbst nicht ändern darf.

## Nachgemessen

```
Vorgabe          → alle drei an
„fertig" aus     → users/<uid>  mailAus:["fertig"]
„bericht" dazu   →              mailAus:["fertig","bericht"]
„fertig" zurück  →              mailAus:["bericht"]
Mitarbeiter      → sieht nur „aufgabe"
```

Serverseitig filtert `mailWillHaben(uids, thema)` vor dem Versand;
`sendMonthlyReport` überspringt abbestellte Chefs und schreibt die Zahl
ins Protokoll. Acht Behauptungen dazu im Emulator, darunter
ausdrücklich: **der Filter lässt NICHT einfach alles durch.**

---

# 51 · Notizen, Nachweise, Bewegung

**18. August 2026**

Die letzten drei Punkte der Wunschliste aus Runde 49.

## Notizen für den Trainer-Alltag

Was sich ein Trainer notiert, ist selten „eine Notiz". Es ist etwas über
eine Kundin (Knie, Ziel, Vorliebe), etwas über eine Einheit, oder etwas,
das er noch angehen muss. Bisher war das eine einzige lange Liste, und
man musste das jedes Mal aus dem Text herauslesen.

Vier Arten, **dieselben vier Töne wie im Kalender** — bewusst nicht
dieselben Namen: „privat" und „Arbeit" passen auf einen Termin, nicht
auf eine Notiz. Die Art steht als 3px-Streifen links, nicht als
eingefärbter Kasten: vier getönte Kästen untereinander sind ein
Farbkasten, kein Notizblock.

Ändern geht an Ort und Stelle statt löschen und neu schreiben, und zwar
per `update()`. Ein `set()` hätte `fest` und `ts` stillschweigend
mitgelöscht — die angeheftete Notiz wäre nach dem Korrigieren eines
Tippfehlers nach unten gerutscht und ohne Datum dagestanden.

Suche und Filter erscheinen **erst ab fünf Notizen**. Darunter sind sie
zwei Bedienelemente, die nichts tun außer Platz wegnehmen.

Zwei Dinge, die ohne Absicht kaputt gewesen wären:

- Der Horcher feuert auch, **während jemand tippt**. Der halb getippte
  Satz im offenen Änderungsfeld überlebt das Neuzeichnen jetzt.
- Suchbegriff und Filter werden beim Abmelden geleert. Auf einem
  geteilten Gerät stünde sonst der Name einer Kundin im Suchfeld, deren
  Notiz dem vorigen Konto gehört.

## Nachweise

Selbst eintragen ging schon — aber im Profilfenster, also dort, wo
niemand danach sucht. „Mein Bereich" zeigt die eigenen Nachweise und
hatte keinen Weg dorthin. Jetzt steht dort ein Knopf, der **dasselbe**
Formular aufschlägt; ein zweites wäre die zweite Stelle, an der ein
neues Feld vergessen wird.

Drei freiwillige Angaben dazu, eingeklappt: ausgestellt von, ausgestellt
am, Nummer. Genau die drei sucht man beim Verlängern zusammen. Der
schnelle Weg bleibt zwei Felder.

Zwei Fehler, die dabei aufgefallen sind:

- Der Ich-Bereich zeigte die **rohe Kennung**: „ersthelfer" statt
  „Erste-Hilfe-Kurs", und bei „Sonstiges" nicht das, was jemand selbst
  hineingeschrieben hatte.
- Man sah nicht, ob ein Nachweis selbst eingetragen oder von der
  Verwaltung bestätigt ist. Ohne diesen Unterschied ist die
  Selbsteintragung ein Freibrief.

Die Zusatzangaben sieht auch die Verwaltung, in derselben Zeile, in der
sie bestätigt. Wer nicht sieht, von wem der Nachweis ist, bestätigt eine
Zeile statt eines Nachweises.

## Bewegung

Der interessante Teil war nicht, **dass** sich etwas bewegt, sondern wo
sich nichts bewegen darf.

Bewegt wird nur, was sich auf einen Klick hin ändert: der Reiterwechsel
und das Blättern im Kalender. Vor und zurück laufen in verschiedene
Richtungen — das ist die einzige Stelle hier, an der die Bewegung etwas
**sagt**: man sieht, ob man vor- oder zurückgeblättert hat, ohne die
Beschriftung zu lesen. „Heute" springt bewusst ohne Richtung.

**Nicht** animiert werden die einzelnen Zeilen. Die Notizliste wird bei
jedem Tastendruck im Suchfeld neu gezeichnet; eine Animation je Zeile
wäre dort kein Einlaufen, sondern ein Flackern bei jedem Buchstaben.

Die Bewegungs-Klasse wird nach `animationend` wieder abgeräumt. Mit
`animation-fill-mode:both` bliebe sie sonst für immer am Element
hängen — „Heute" trüge noch die Richtung des letzten Klicks.

## Nachgemessen

```
Ändern            → update {text, kategorie} — kein ts, kein fest
Anheften          → update {fest:true}, Notiz steht oben, auch als älteste
Filter „Kunde"    → 3 von 6
Suche „knie"      → 1 Treffer, Groß-/Kleinschreibung egal
Bei 2 Notizen     → keine Suchzeile

Nachweis speichern → aussteller, von, nummer landen mit
Ausstellung nach Ablauf → 0 Schreibvorgänge, Meldung kommt
Ohne Zusatzangaben → 0 Zusatzzeilen, 0 Marken

Reiterwechsel     → ichPaneEin, nach 700 ms nichts mehr
Zweiter Klick nach 80 ms → Bewegung startet bei 0 ms neu
Beim Tippen       → 0 Animationen in der Liste
„Bewegung reduzieren" → 0 Animationen, Deckkraft trotzdem 1
```

Drei neue Durchläufe. **Vier Gegenproben nachgestellt**, und zwei davon
haben etwas gefunden:

| Gegenprobe | Ergebnis |
|---|---|
| Filter ausgehebelt | 7 rot ✓ |
| `update` durch `set` ersetzt | 1 rot ✓ |
| Rohkennung wiederhergestellt | 4 rot ✓ |
| Animations-Neustart entfernt | **grün** ✗ |

Die letzte war zuerst wertlos: der Durchlauf wartete 600 ms zwischen den
Klicks, da hatte der Aufräumer die Klasse längst entfernt — die Behauptung
wäre auch ohne Neustart grün gewesen. Mit 80 ms Abstand, also so, wie man
wirklich drei Monate weiterblättert, greift sie: 83 ms statt 0.

Es genügt dabei **nicht**, dass eine Animation läuft — sie lief ja
schon. Sie muss von vorn laufen, und das steht nur in der verstrichenen
Zeit.

---

# 52 · Übergabe dorthin, wo sie gelesen wird — und ein Bericht, der stimmt

**19. August 2026**

Vier Wünsche aus dem Betrieb, und beim Nachrechnen sind **vier Fehler**
herausgefallen, nach denen niemand gefragt hatte. Drei davon im Bericht.

## Übergabe auf der Startseite

> „das man die Übergabe auch auf der Startseite sieht direkt weil sonst
> macht das ja kein Sinn"

Genau so war es. Die Übergabe stand im Team-Bereich hinter zwei Klicks
**und** einer Studio-Auswahl — also da, wo sie niemand liest, der gerade
zur Schicht kommt. Das ist der einzige Zweck einer Übergabe.

Jetzt steht sie in „Zum Lesen", über **alle eigenen Studios**, nicht nur
über das im Team-Bereich zufällig gewählte. Bei mehr als einem Studio
steht der Ort dabei; ohne ihn wären vierzehn Übergaben untereinander
eine Auskunft ohne Ort.

Geladen wird wie „Mein Dienst": einmal, kurz gemerkt, kein Dauerhorcher.
Ein Horcher je Studio wären beim Chef vierzehn offene Verbindungen für
eine Karte mit drei Zeilen.

## Alles als gesehen markieren

Der Knopf erscheint **nur, wenn wirklich etwas ungelesen ist**, und
nennt die Zahl. „Alles gelesen" ohne Zahl lässt offen, ob man drei
Punkte wegklickt oder dreißig.

Zwei Wege, mit Absicht verschieden:

| | wo gespeichert | warum |
|---|---|---|
| Aushänge | `readBy` am Dokument | die Verwaltung muss sehen, **wer** noch nicht gelesen hat |
| Übergabe, Brett | Zeitstempel unter `privat/<uid>` | niemand muss wissen, wer einen Bretteintrag gelesen hat |

Ein `readBy` für die Übergabe hieße: jeder schreibt in jedes fremde
Dokument, die Liste wächst mit jedem Konto, und die Regeln müssten
Schreibrechte auf fremde Übergaben öffnen. Ein Zeitstempel im eigenen
Bereich ist **ein** Schreibvorgang, braucht keine Regeländerung und
verrät nichts.

**Eigenes zählt nicht als ungelesen.** Wer seine Übergabe gerade selbst
geschrieben hat, braucht dafür keinen Punkt.

### Zwei Funde nebenbei

**Die Verwaltung sah Punkte, die sie nie abstellen konnte.**
`markAnnouncementsRead()` trägt Chefs bewusst nicht in `readBy` ein,
damit der Überblick „12 gelesen" nur das Team zählt. Für einen Chef war
`readBy` also immer leer — der Punkt stand dauerhaft an jedem eigenen
Aushang. Ein Hinweis, der nie ausgeht, ist keiner; mit dem neuen Knopf
wäre er nie wieder verschwunden.

**Der Punkt blieb nach dem Klick stehen.** `markAnnouncementsRead()`
schrieb in die Datenbank, aber nicht in die lokale Liste — der Punkt ging
erst aus, wenn der Horcher die Runde zurückbrachte. Also genau die
Verzögerung, gegen die der Knopf gebaut ist. Gefunden hat das der eigene
Durchlauf, nicht das Auge.

## Studio-Leiter bekommen die Fertig-Mail

> „Studio Leiter sollen Mails bekommen wenn IHRE Studios alle Aufgaben
> erledigt haben"

Die Meldung ging bisher ausschließlich an Chefs. Der Schalter „Studio
fertig" war aber schon für jeden mit `canManage()` sichtbar — **also
auch für Leiter, die die Mail nie bekamen.** Der Schalter hat ihnen
etwas versprochen, das nicht passiert ist.

Für den Leiter ist es außerdem die nützlichere Meldung: bei ihm sind es
ein bis zwei Studios, nicht vierzehn. Der Hinweistext sagt das jetzt
rollenabhängig — und die Studiozahl kommt aus den echten Studios statt
aus dem Text. Ein Betrieb mit drei Studios las hier bisher von vierzehn.

## Der Bericht

> „eine viel bessere und genauere Mail Bericht Erstattung […] es soll
> IMMER von allen Studios sein und schön sortiert"

Beim Nachrechnen kamen drei Ungenauigkeiten heraus:

**1. Nicht alle Studios.** Die Studioliste des Berichts kam aus den
*Nutzerprofilen*. Ein Studio ohne zugewiesene Person — neu eröffnet,
umgebaut, Leitung gewechselt — tauchte überhaupt nicht auf. Nicht mit
Null, sondern **gar nicht**. Genau dort wären offene Aufgaben am
ehesten liegengeblieben.

**2. Der Putzplan fehlte komplett.** Gezählt wurden nur `todos`. In
einem EMS-Studio ist der Putzplan der größere Teil der täglichen
Arbeit; ein Bericht ohne ihn beantwortet „läuft es rund" mit der Hälfte
der Zahlen.

**3. „Offen" wurde zu niedrig gezählt.** Der Bericht prüfte `!t.done`,
die Fertig-Meldung dagegen `erledigt()`, das Wiederholungen kennt. Eine
**tägliche** Aufgabe, gestern abgehakt, hat `done:true` — der Bericht
zählte sie als nicht offen, obwohl sie heute wieder ansteht. Und zwar
systematisch bei genau den Aufgaben, die jeden Tag anfallen.

Dazu: sortiert nach dem, **was Aufmerksamkeit braucht** (überfällig,
dann offen, dann Material), nicht mehr nach Fleiß. Wer den Bericht
überfliegt, liest die ersten drei Zeilen — dort muss stehen, wo etwas
klemmt, nicht wo alles läuft. Spaltenbreite aus den echten Namen. Ein
Studio ganz ohne Einträge wird ausdrücklich benannt, sonst liest sich
„0 offen" wie „alles geschafft".

**Der Knopf schickt nur noch an einen selbst.** Vorher schrieb er
ungefragt alle Chef-Konten an — wer die aktuellen Zahlen sehen wollte,
weckte damit vier Kolleginnen. Das Rundschreiben bleibt dem Zeitplan am
Monatsersten. Zeitraum frei wählbar: 7/14/30/90/180/365 oder eine eigene
Zahl bis 370.

Der Betreff nennt jetzt den Zeitraum. „Monatsbericht August" über sieben
Tage war schlicht falsch, und im Postfach ist der Betreff das Einzige,
was man vor dem Öffnen sieht.

## Der vierte Fund — und der teuerste

In `collectMonthly` hieß der Zähler `erledigt` **und verdeckte damit die
Funktion `erledigt()`**, die drei Zeilen weiter aufgerufen wird. Der
Aufruf warf einen `TypeError`, das `try/catch` schrieb ihn in eine
Protokollzeile, und die Funktion lief mit halben Zahlen weiter:

```
mit Fehler:   erledigt 1 · offen 0 · überfällig 0 · Putzplan 1/0
richtig:      erledigt 2 · offen 3 · überfällig 1 · Putzplan 1/1
```

Nichts daran sieht nach einem Fehler aus. Ein Bericht, der plötzlich
„0 offen" meldet, liest sich wie eine gute Nachricht.

Gefunden hat ihn nur, dass der Bericht überhaupt zum ersten Mal
nachgerechnet wurde. Im Kopf von `funktionen.test.js` stand ein Jahr
lang, der Monatsbericht sei nicht prüfbar, weil er nur eine Mail
hinterlässt. Das war zu pauschal: nicht prüfbar ist der **Versand**. Die
**Zahlen** kommen aus einer Funktion, die ein Objekt zurückgibt — und
ein Objekt kann man nachzählen.

## Nachgemessen

```
Übergabe (Mitarbeiter)  → 2 Einträge, 1 Punkt (die eigene zählt nicht)
                          9 Tage alt fällt raus, fremdes Studio fällt raus
Übergabe (Chef)         → 3 Einträge aus zwei Studios, Ort steht dabei
„alles gelesen"         → privat/testuid {gelesenHo, gelesenBrett}
                          + 2× readBy an den Aushängen
                          Punkte danach 0/0, Knopf weg
Mit gespeichertem Stand → 0 Punkte, Einträge bleiben sichtbar

Fertig-Mail  → Chef ja · Leiter seines Studios ja
               Leiter des ANDEREN Studios nein · Mitarbeiter nein
               abgeschaltetes Konto nein · fremde Firma nein

Bericht      → 3 von 3 Studios, auch das ohne Personal
               Putzplan 1 erledigt / 1 offen
               tägliche Aufgabe: heute wieder offen UND im Zeitraum erledigt
               vor dem Zeitraum erledigt zählt nicht
               oben Nord (überfällig), unten das leere Studio
Zeitraum     → 45 kommt als 45 an, 9999 wird auf 370 gedeckelt
```

## Gegenproben

| Gegenprobe | Ergebnis |
|---|---|
| Gelesen-Stand nicht mehr auslesen | 1 rot ✓ |
| Filter ohne Rollen-Einschränkung | Mitarbeiter ist dabei ✓ |

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

---

# 53 · Nichts wackelt mehr, alles ist anklickbar

**24. August 2026**

> „kannst du in der ganzen app horizontales scrollen entfernen und die
> knöpfe alle überarbeiten nochmal und kannszt du nummern, mails, links
> und das logo anklickbar machen und das logo führt zurück zum start
> bildschirm"

Vier Wünsche. Beim Nachmessen sind daraus **fünf Befunde** geworden, von
denen drei nicht im Wunsch standen.

## Erst messen, dann ändern

Die erste Messung meldete Funde in `.ab-t`, `.pin-txt`, `.pb-name` und
in mehreren Eingabefeldern. Alle falsch. Der Unterschied, an dem sie
vorbeigemessen hat:

| | `scrollLeft` bewegt sich | mit dem Finger schiebbar |
|---|---|---|
| `overflow:hidden` / `clip` | ja | **nein** |
| `<input>`, `<textarea>` | ja | nein (scrollt beim Tippen) |
| `overflow-x:auto/scroll` | ja | **ja** |

Erst mit dieser Unterscheidung blieb ein einziger echter Fund übrig:
30px auf der Startseite bei 320px Breite.

## Befund 1 — eine Zeile CSS hat die Startseite verschoben

Nicht die Karte war zu breit, sondern eine Regel:

```css
.setup-txt i em{white-space:nowrap}   /* damit „Verwaltung → System"
                                         zusammenbleibt */
```

Der Pfad passt auf einem 320px-Gerät nicht in eine Zeile, konnte nicht
umbrechen und hat die Einrichtungs-Karte auf **336px in einem 292px
breiten Kasten** gedrückt. Ein umgebrochener Pfad ist lesbar; eine
Seite, die wackelt, nicht.

Dazu `overflow-x:hidden` auf `.scroll-area`. Steht `overflow-y` auf
`auto` und `overflow-x` auf dem Vorgabewert, rechnet der Browser
`overflow-x` **ebenfalls als auto** — die Fläche war also grundsätzlich
schiebbar, sobald irgendein Kind zu breit wurde. Das ist eine Sperre und
kein Ersatz fürs Aufräumen: was überläuft, wird jetzt abgeschnitten
statt scrollbar, und genau das meldet `test-abgeschnitten.js`. Aus einem
wackelnden Bildschirm wird ein sichtbarer Fund.

## Befund 2 — die Hauptnavigation lag halb neben dem Bild

Nach dem Wunsch nicht gesucht, beim Messen gefunden: die untere Leiste
hatte **462px Inhalt** — bei 320, 360, 390 *und* 430px Breite.
„Verwaltung" war auf jedem Handy nur nach einem Wisch erreichbar.

`min-width:74px` bei `flex:0 0 auto` war die Ursache: „Ich" braucht 23px
Schrift und bekam dieselben 74 wie „Verwaltung" mit 72.

```
                Überhang   schmalster   breitester
  320px            0           44           81
  360px            0           44           91
  390px            0           47           97
  430px            0           53          103
```

Der Weg über Zeilenumbruch war die Alternative und ist gemessen keine:
„Verwal-tung" zweizeilig macht die Leiste auf **allen** Geräten 13px
höher, für ein einziges Wort.

## Befund 3 — die 44-Pixel-Regel im Kopf

Im Quelltext stand seit Runde 52: *„die hält in der Kopfzeile keiner ein
… gehört in eine eigene Änderung, weil sie die Höhe auf jedem Gerät
verschiebt."* Erledigt. Kosten gemessen: **sechs Pixel** (63 → 69), und
zwar nur, weil die Marke als Knopf ohnehin 50px belegt.

Folgekosten, gemessen und behoben: vier Knöpfe mal acht Pixel sind 32,
und die fehlten der Marke. Bei 390px standen **157px Schriftzug in einem
130px breiten Kasten**. Der Schriftzug fällt deshalb schon ab 420px weg
statt erst ab 360; ab 430 steht er wieder vollständig da. Kleiner setzen
wäre die naheliegende Alternative — auf `--t-xs` heruntergerechnet
bleiben zwei Pixel Überhang, und dann ist er zu klein zum Lesen **und**
abgeschnitten.

## Befund 4 — eine Medienabfrage ohne Wirkung

Die Regeln für die schmalen Reiterleisten standen zuerst oben bei der
Kopfzeile und taten nichts. Eine Medienabfrage erhöht die Spezifität
nicht; es entscheidet die Reihenfolge, und `.subtab` weiter unten hat
sie wieder überschrieben. **Nichts hat das gemeldet** — aufgefallen ist
es nur, weil hinterher nachgemessen wurde.

## Befund 5 — Links waren unsichtbar

`linkify()` lief längst in der Übergabe, am schwarzen Brett, bei den
Aushängen und in den Putzplan-Notizen. Gestylt war aber nur
`.msg .body a` im Chat, und `a{color:inherit;text-decoration:none}` ganz
oben ebnet alles ein. Anklickbar und nicht erkennbar ist dasselbe wie
nicht vorhanden.

## Was jetzt anklickbar ist

Vier Formen statt einer: `http(s)://`, `www.…`, Mail-Adresse,
Rufnummer. Die Rufnummer ist eng gefasst — sie muss mit `+` oder `0`
beginnen und lang genug sein. Das ist die eigentliche Behauptung, und
`test-verlinkung.js` prüft sie mit acht Gegenproben:

| bleibt Text | warum |
|---|---|
| `12.08.2025` | beginnt nicht mit 0 oder + |
| `01.09.2026` | nach der 0 kommt nur **eine** Ziffer |
| `08:30` | Doppelpunkt gehört nicht zum Zeichensatz |
| `1.234,56` | Komma auch nicht |
| `Hausnummer 12`, `PLZ 50354`, `Gerät 0123`, `Version 2.4.1` | zu kurz |

Dazu: Satzzeichen am Ende gehören zum Satz. „Schau auf https://kf.de."
führte vorher auf eine Adresse mit Punkt hinten dran, also ins Leere.

Sicherheit: der Text ist bereits durch `esc()`. Anführungszeichen stehen
als `&quot;` und können aus dem `href` nicht ausbrechen; keines der vier
Muster lässt ein anderes Schema als `http`, `https`, `mailto` oder `tel`
zu.

## Die Marke ist ein Knopf

Ein Logo, das nichts tut, ist ein Griff ins Leere — fast jeder tippt
dort hin, wenn er sich verlaufen hat. Echter `<button>` statt `div` mit
Zuhörer: mit der Tastatur erreichbar, für Vorlesegeräte als Handlung
erkennbar. `showView('home')` und nicht `history.back()`: „zurück"
landet dort, wo man vorher war, „Start" immer am selben Ort.

## Was weiter waagerecht scrollt — mit Absicht

| Leiste | Grund |
|---|---|
| `.subnav` | „Betrieb" hat sechs Reiter, der längste heißt „Probetraining". Umgebrochen: vier Zeilen und 162 statt 42 Pixel bei 320px |
| `.chat-channels` | bis zu 14 Studios plus Gruppen |
| `.chip-row`, `.sort-row` | Filter; umbrechend nahmen sie 150px über einer Liste mit drei Einträgen |

Was gefehlt hat, war die Zusage, dass man dabei nicht die Orientierung
verliert. Für die Kanalreihe im Chat gibt es das seit langem, für die
Reiterleiste nicht — `subtabSichtbarMachen()` schiebt den offenen Reiter
jetzt in die Mitte des Bildes.

## Ein Fund in den Attrappen

Beide Attrappen kannten Übergaben nur bei `get()`, nicht bei
`onSnapshot()` — und der Team-Bereich hört zu. Die Liste dort stand also
**immer leer**, und jeder Durchlauf, der sie geprüft hätte, hätte nichts
geprüft. Aufgefallen, weil `test-verlinkung.js` „0 von 15 Proben
gerendert" meldete, statt stillschweigend grün zu sein.

## Gegenproben

| Gegenprobe | Ergebnis |
|---|---|
| altes `min-width:74px` wiederhergestellt | `test-quer.js` meldet „mobnav +64px" in jeder Ansicht ✓ |
| acht Nicht-Nummern durch `linkify()` | keine einzige verlinkt ✓ |
| Logo-Klick aus dem Team-Bereich | `view-team` → `view-home` ✓ |
| Marke mit `elementFromPoint` an beiden Rändern | trifft `tbHome`, keinen Nachbarn ✓ |

---

# 54 · Die Werkbank, und Knöpfe mit Farbe

**24. August 2026**

Zwei Wünsche, beide vage, beide erst nach Nachfragen brauchbar geworden.

## „Geheime Aktivitäten nur für den Admin"

Gewünscht war: wer hat die App wann benutzt, plus ein Cheat-Code auf
eine versteckte Seite. Gebaut ist die Hälfte davon, und die andere
bewusst nicht.

**Nicht gebaut: ein Protokoll je Person.** „Wer war wann in der App" ist
Verhaltenskontrolle, gehört in die Datenschutzerklärung und
wahrscheinlich in eine Absprache mit dem Team — und es beantwortet keine
Frage, die diese App stellen muss. Die nützliche Frage ist eine andere:
**was benutzt niemand?** Die geht ohne jede Person.

Der Nutzer hat sich nach dieser Vorlage für die anonyme Hälfte plus die
Technik-Werkzeuge entschieden. Das ist der Grund, warum es dieses
Kapitel gibt: die vage Bitte hätte auch als Personenprotokoll enden
können.

### Was gezählt wird

```
statistik/2026-08-24
  tag:       '2026-08-24'
  starts:    { 'studio-6': 12 }
  ansichten: { todos: 30, chat: 55 }
```

Kein `uid`, kein Name, keine Uhrzeit. **Und das ist keine Zusage der
Oberfläche:** `firestore.rules` lässt an dieser Sammlung genau diese drei
Felder durch (`keys().hasOnly`). Wer eine `uid` mitschicken will, wird
von der Datenbank abgewiesen — auch wenn er `index.html` ändert.
`rechte.test.js` prüft das mit drei Runden (uid, Name, Zeitstempel).

### Der Griff ist eine Schublade, kein Safe

Steht so im Quelltext, damit sich niemand darauf verlässt: das Repo ist
öffentlich, jeder kann nachlesen, dass es sieben Tipps sind. Geschützt
ist nur, was auch ohne die Seite geschützt wäre.

Für alle anderen passiert beim Tippen **nichts** — keine Meldung, kein
Zähler, kein „fast geschafft". Ein Hinweis wäre die Einladung,
weiterzuprobieren.

## „Die Knöpfe sehen alle zu grau aus"

Das ließ sich nachzählen: **56 von 102 Knöpfen** tragen `btn-ghost`, und
das war eine 5-%-Tönung. Der häufigste Knopf war der unauffälligste.

| Fläche gegen Grund (1,0 = nicht zu unterscheiden) | dunkel | hell |
|---|---|---|
| `btn-ghost` | 1,15 | 1,09 |
| `icon-btn` | 1,13 | 1,09 |

Drei neue Marken (`--tipp-1`, `--tipp-2`, `--tipp-kante`) für alles, was
man antippt. `--auf-1` trug bisher beides: den stillen Grund eines
Eingabefelds **und** den häufigsten Knopf. Solange dasselbe Grau an
beidem klebt, sieht ein Knopf aus wie ein Kasten.

Die Stärke ist die obere Grenze, nicht Geschmack:

| Tönung | Fläche | Text |
|---|---|---|
| .13 | 1,28 | 6,05 |
| .18 | 1,42 | 5,44 |
| **.24** | **1,62** | **4,78** ← gewählt |
| .30 | 1,86 | 4,15 ✗ |

Mehr Tönung heißt weniger Kontrast für die Schrift darauf. `.24` ist der
kräftigste Wert, der die 4,5:1 nicht bezahlt.

## Der Fehler dieser Runde

Ein Kommentar im Stylesheet war zu früh geschlossen:

```css
--auf-3:rgba(255,255,255,.16);
/* Kommentar auf … Kommentar zu */
   Text, der zu keinem Kommentar mehr gehört
   … nochmal zu */
--tipp-1:rgba(56,189,248,.24);
```

CSS überspringt ab einem Fehler **bis zum nächsten Semikolon** — und das
stand am Ende von `--tipp-1`. Die Marke war weg, `--tipp-2` und
`--tipp-kante` zwei Zeilen darunter blieben. Der Knopf bekam Rand und
Schriftfarbe, aber keine Füllung: **er sah aus wie halb geändert, nicht
wie kaputt.** Genau deshalb fällt so etwas nicht auf — mir auch erst auf
dem Bildschirmfoto.

Der Wachposten dagegen steht jetzt in `test-gestaltung.js`: nach dem
Entfernen aller ordentlich geschlossenen Kommentare darf kein einzelner
Marker übrig sein.

**Der erste Versuch war eine Prüfung auf fehlende `var()`-Marken — und
hätte den Fehler nicht gefunden.** Ein regulärer Ausdruck sieht
`--tipp-1:` im Text stehen und hält die Marke für gesetzt; nur der
Browser verwirft sie. Eine Prüfung, die ihren eigenen Anlass nicht
findet, ist keine. Wieder ausgebaut.

Beim Schreiben des Kommentars dazu ist mir derselbe Fehler noch einmal
passiert, diesmal in JavaScript. Node meldete `SyntaxError`. Das ist der
ganze Unterschied: **JavaScript sagt Bescheid, CSS verschluckt es.**

## Zwei Messungen, die zuerst falsch waren

1. **Der `icon-btn`-Kontrast.** Gemessen wurde der erste sichtbare
   `.icon-btn` im Dokument — das ist der Bericht-Knopf, und der trägt
   absichtlich `border-color:transparent` und eine eigene Füllung. Die
   Zahlen (1,76/1,31) galten für den Sonderfall, nicht für die Regel.
   Mit Filter: 1,13/1,09.
2. **Der Vergleich mit dem Filter-Chip.** „Der Chip schafft am Rand
   8,63, der Knopf nur 2,68" — der Chip hat aber eine **deckende**
   Fläche, der Knopf eine Tönung. Das ist kein Vergleich, sondern zwei
   verschiedene Messungen nebeneinander. Aus dem Kommentar entfernt.

## Gegenproben

| Gegenprobe | Ergebnis |
|---|---|
| Wachposten aus `werkbankAuf()` entfernt | „LECK: ein Mitarbeiter bekommt die Werkbank zu sehen" ✓ |
| `uid` in die Zählung eingebaut | „ZU VIEL: die Zählung schickt das Feld uid mit" ✓ |
| Kommentar wieder kaputt gemacht | „KOMMENTAR KAPUTT" — mit der verschluckten Zeile im Text ✓ |
| CSP-Hashes nach einer Änderung nicht neu gesetzt | die Seite tat gar nichts; „nicht offen" hieß **tot**, nicht „bewacht" |

---

# 55 · Fünf Ideen aus der Liste, zwei davon anders als gedacht

**25. August 2026**

Der Nutzer hat die fünf ausgewählt, die ich vorgeschlagen hatte. Bei
zweien stimmte meine eigene Begründung nicht — das steht hier zuerst,
weil es die nützlichere Hälfte des Kapitels ist.

## Zwei Ideen waren größer angekündigt als sie waren

**Idee 27, Zahlen tabellarisch.** Angekündigt als „heute springen die
Spalten". Ein Durchlauf über neun Ansichten hat gesucht, wo Zahlen
*untereinander* stehen — nicht, wo Zahlen vorkommen. Ergebnis:
`tabular-nums` war schon an allen relevanten Stellen gesetzt. Ein
einziger echter Fund (`.pcount`), dazu zwei Kleinigkeiten.

**Idee 30, Druckansicht.** Angekündigt als „heute kommt Dunkelmodus mit
Navigationsleiste aus dem Drucker". Nachgemessen stimmt davon **nichts**:
Putzplan und Einkaufsliste haben je eine fertige Vorlage, schwarz auf
weiß, mit Spalten zum Abhaken, und beide funktionieren.

Es gab trotzdem etwas zu holen, nur woanders — siehe unten.

## Was wirklich kaputt war: das weiße Blatt

`body > *{display:none}` blendet beim Drucken alles aus, und
`#printArea` ist leer, solange niemand auf einen der beiden
Drucken-Knöpfe gedrückt hat. Wer aus **irgendeiner anderen** Ansicht
Strg+P tippt, bekam ein vollständig weißes Blatt. Kein Fehler, kein
Hinweis, nichts.

Ein leeres Blatt sagt nicht, dass man den falschen Weg genommen hat. Es
sagt gar nichts. Jetzt steht dort, wo die zwei Vorlagen liegen. Dazu
wird `#printArea` beim Ansichtswechsel geleert — sonst druckt man zwei
Bildschirme weiter einen Plan, den man nicht meinte.

## Idee 14 war besser als die Idee

`emptyHTML()` kennt seit jeher einen vierten Parameter für eine
Handlung. Nachgezählt: **neunzehn Aufrufe, kein einziger hat ihn
gefüllt.** Der Mechanismus war da, es hat ihn nur nie jemand benutzt —
deshalb bestand jeder leere Bildschirm aus grauem Text und einer
Sackgasse.

Vier Stellen sind jetzt verdrahtet. „Aufgabe anlegen" nur für die
Verwaltung: ein Mitarbeiter sieht „+ Neu" gar nicht, und ein Knopf, der
ins Leere zeigt, ist schlechter als der bloße Satz.

## Der Fehler, der teuer geworden wäre

`bindMessageTools` hat eine Ausnahmeliste — alles, was selbst anklickbar
ist, soll nicht das Nachrichtenmenü öffnen. Darin stand `audio`. Das
reichte, solange das `<audio>`-Element **selbst** die sichtbare
Steuerung war. Seit der eigene Abspieler eigene Knöpfe hat und das
`<audio>` auf `display:none` steht, traf `audio` dort nichts mehr:

> Jeder Tipp auf Abspielen, Tempo oder Schieber öffnete stattdessen
> „Antworten / Weiterleiten / Löschen".

Der Abspieler wäre unbenutzbar gewesen — ohne Fehler im Protokoll, ohne
dass irgendetwas kaputt aussieht. Aufgefallen ist es nur, weil ein
Bildschirmfoto nach dem Tempo-Klick plötzlich das Menü zeigte.

**Die Lehre:** wer eine eingebaute Steuerung ersetzt, muss suchen, wo
das eingebaute Element beim Namen genannt wird. Es steht selten dort, wo
man arbeitet.

Der Test dazu hat zwei Gegenproben, die zusammengehören: der Abspieler
darf das Menü **nicht** öffnen, und ein Tipp auf den Nachrichtentext
muss es **weiterhin** öffnen. Ohne die zweite hätte man die Ausnahme zu
weit ziehen und das Menü ganz abschalten können.

## Keine Wellenform, und warum

Alle anderen Messenger haben eine, und sie sieht gut aus. Um sie ehrlich
zu zeichnen, müsste man die Datei dekodieren und die Amplituden auslesen
— je Nachricht, mit Codecs, die nicht überall gehen. Der billige Weg
wäre, aus der Nachrichten-Kennung Pseudozufall zu ziehen und Balken zu
malen. **Das sieht aus wie eine Messung, ist aber keine.** Lieber ein
ehrlicher Fortschrittsbalken als eine hübsche Lüge.

## Der Läufer hat beim Fehlschlag geschwiegen

`test-chat-bereich3` fiel in einem vollen Lauf um und war danach dreimal
einzeln grün. Warum, ließ sich nicht mehr sagen: `alle.sh` schrieb bei
einem Exit-Code ungleich null nur „Exit-Code 1" und verwarf die Ausgabe.

Ein Läufer, der genau dann schweigt, wenn etwas kaputt ist, zwingt zum
Raten. Er nimmt jetzt die Fundzeilen mit. Im nächsten vollen Lauf war
der Durchlauf grün — **woran er beim ersten Mal scheiterte, weiß ich
weiterhin nicht.** Beim nächsten Mal steht es da.

## Vier Messfehler, alle meine

| Wo | Was |
|---|---|
| `icon-btn`-Kontrast (Runde 54) | am Bericht-Knopf gemessen, einem Sonderfall mit `border-color:transparent` |
| Vergleich mit dem Filter-Chip | deckende Fläche gegen Tönung — kein Vergleich |
| `test-drucken` × 3 | `innerText` liefert den **gerenderten** Text; „Putzplan" findet man in „PUTZPLAN" nicht |
| `test-drucken` | `getComputedStyle(x).display` verrät nicht, ob ein **Vorfahr** ausgeblendet ist |

## Gegenproben

| Gegenprobe | Ergebnis |
|---|---|
| Ziel eines leeren Zustands gibt es nicht | in der Konsole gemeldet ✓ |
| Tipp auf den Nachrichtentext | Menü öffnet weiterhin ✓ |
| Vorlage im Druckbereich | Hinweis erscheint **nicht** mit ✓ |
| absichtlich kaputter Durchlauf | Läufer nennt jetzt den Grund ✓ |
| `letter-spacing` doppelt gesetzt | `test-gestaltung.js` gemeldet ✓ |
| Zeichen „mikrofon" ungenutzt | gemeldet — und die Ursache waren zwei Inline-Kopien ✓ |

Regression: **86 grün · 0 rot · 0 ohne Ausgabe**, in einem Lauf.

---

# 56 · Der Rahmen kostet Platz und Zeit

**26. August 2026**

Vier Ideen aus der Liste — 8, 9, 3 und 13. Bei **13 war meine eigene
Begründung falsch, und der echte Fund war größer als die Idee.**

## Idee 13: nicht Skelette, sondern 1,8 Sekunden

In `DESIGN-IDEEN.md` stand: *„Beim Start ist kurz alles leer. Drei graue
Balken in Kartenform wirken schneller, obwohl nichts schneller ist."*

Nachgemessen stimmt das nicht. Die Startseite ist vollständig aufgebaut,
sobald man sie sieht. Verdeckt wurde sie von etwas anderem: der
Startbildschirm lag auf einem **festen Zeitgeber von 3200 ms**. Er
wartete nicht auf die App und ging nicht früher, wenn sie fertig war.

```
vorher   2611 ms   (2627 / 2602 / 2605)
nachher   832 ms   (854 / 838 / 805)
```

**1,8 Sekunden bei jedem Öffnen.** Und zwar wirklich, nicht gefühlt: dort
wurde nichts geladen, dort wurde gewartet. Skelette hätten genau das
kaschiert, statt es zu beheben — sie wären die Lösung für ein Problem
gewesen, das es nicht gab.

Untergrenze 650 ms, sonst blitzt der Bildschirm bei einem warmen Start
nur auf; ein Zucken ist unruhiger als eine kurze Pause. Die 3200 bleiben
als Notausgang, falls die Anmeldung hängt.

Damit das überhaupt messbar wurde, haben beide Attrappen jetzt
`window.__langsam` — eine Antwortverzögerung. Ohne sie antwortet die
Attrappe sofort, und jeder Durchlauf über „was steht da, bevor die Daten
kommen" misst nichts.

## Idee 3: Suche und Filter in eine Zeile

| | vorher | nachher |
|---|---|---|
| Aufgaben, Inhalt ab | 407px | **353px** |
| Material, Inhalt ab | 607px | **555px** |

Bei Material blieben auf einem 844er-Handy vorher **unter 200px** für die
eigentliche Liste. Die Suche schrumpft auf ihre Lupe, solange nichts
drinsteht, und wird breit, sobald sie den Fokus hat **oder etwas
eingetippt ist** — auch nachdem der Finger weg ist. Ein Feld, das sich
mit dem Suchwort darin zuklappt, versteckt den Grund, warum die Liste
kurz ist.

Was danach noch über dem Inhalt steht, ist Inhalt: Studio-Auswahl,
Fehlt-Hinweis, Tabellenkopf.

## Idee 8: der Hinweis, den man nicht loswurde

„Meldungen an?" erschien, solange die Berechtigung *unentschieden* war —
also bei jedem, der sich nicht entscheidet, für immer. 58 von 740 Pixeln,
jeden Tag, für eine Frage, die man einmal beantwortet.

**Das Wegtippen wäre ohne Ersatz eine Sackgasse gewesen:** die
Einstellungen sagten wörtlich *„Tippe oben im Banner auf Erlauben"*. Der
Hinweis war der einzige Weg. Deshalb steht der Knopf jetzt auch unter
Einstellungen → Meldungen, sichtbar genau dann, wenn die Berechtigung
offen ist.

## Idee 9: eigene Nachrichten

| Tönung | eigen/fremd | Text auf der eigenen Blase |
|---|---|---|
| .12 (vorher) | 1,11 | 14,01 |
| .24 | 1,43 | 10,92 |
| **.34** | **1,83** | **8,55** |

Bei 1,0 wären die Blasen nicht zu unterscheiden. Dazu eine untere Ecke,
die die Richtung zeigt — eine Sprechblase ohne Dreieck, die jede
Gruppierung überlebt.

## Drei Messfehler, alle meine

1. **Der Grund unter den Sprechblasen.** Die erste Sonde las ihn aus
   `.chat-scroll`. Das Element hat gar keinen eigenen Hintergrund;
   `getComputedStyle` liefert dann `rgba(0,0,0,0)`, und als Farbe gelesen
   ist das **Schwarz**. Im Dunkeln fiel es nicht auf, im Hellen kippten
   die Zahlen ins Absurde („Text 1,06" wäre unlesbar).
2. **Die Breite des Suchfelds** wurde gemessen, *während* es den Fokus
   hatte — dann macht es schon `:has(input:focus)` breit. Die Klasse
   `.offen` war damit ungeprüft, und die Gegenprobe blieb grün.
3. **„Das Gespräch beginnt bei 45 %"** stand in der Ideenliste. Das war
   aus einem Bildschirmfoto mit zufälliger Scrollposition abgelesen. Der
   Chat scrollt ans Ende; die erste Nachricht liegt *über* dem Bild
   (gemessen −65px). Die richtige Frage ist, wie hoch die Fläche ist, in
   der Nachrichten stehen: **35 % bei 740px Bildschirmhöhe.**

## Ein Fund, den man nicht unsichtbar machen darf

`test-abgeschnitten.js` meldete nach dem Umbau: *„#todoSearch — 76 px
Text in 0 px Feld."* Zusammengeklappt ist das Feld 44px breit, davon
gehen 40 für die Lupe und 6 für den Rand ab.

`opacity:0` am `::placeholder` wäre eine Zeile gewesen — der Text stünde
dann aber weiterhin im Dokument und wäre weiterhin abgeschnitten. **Ein
Fund, den man unsichtbar macht, ist nicht behoben.** Der Platzhalter wird
jetzt entfernt, solange das Feld schmal ist; die Beschriftung hängt an
einem `aria-label`, sonst wäre das Feld für ein Vorlesegerät namenlos.

## Der Läufer hat sich bezahlt gemacht

Seit Runde 55 nennt `alle.sh` bei einem Fehlschlag den Grund. Beim ersten
vollen Lauf dieser Runde stand direkt in der Zusammenfassung:
*„✗ test-abgeschnitten — Exit-Code 1 — ✗ 2 Stelle(n) schneiden ihren
Inhalt ab: #todoSearch, #matSearch"*. In Runde 55 hätte dort nur
„Exit-Code 1" gestanden, und die Ursache hätte einen Extralauf gekostet.

## Gegenproben

| Gegenprobe | Ergebnis |
|---|---|
| Zeitgeber wiederhergestellt | „bleibt 2625 ms stehen" ✓ |
| Klasse `.offen` abgeschaltet | „bleibt schmal (48px)" ✓ |
| Emoji statt Zeichen im Kreuz-Knopf | `test-gestaltung.js` gemeldet ✓ |
| `line-height:1` fest statt `--lh-1` | gemeldet ✓ |

---

# 57 · Drei Kanäle für eine Meldung — und eine Zeile, die verschwunden war

**27. August 2026**

Gewünscht war *„ein Benachrichtigungsfeld für Chefs, wo eine Nachricht
aufploppt, wenn eine Aufgabe erledigt wurde"* — und Mails, wenn **alle
Aufgaben**, **nur der Putzplan** oder **beides** fertig sind.

Vier Rückfragen, vier Antworten, und die sind die Bauanleitung:

| Frage | Antwort |
|---|---|
| Was heißt „aufploppen"? | **alle drei**: Glocke mit Liste, Toast in der App, Push aufs Handy |
| Welche Studios? | **alle** — Chef alle 13, Leiter seine, Mitarbeiter keine |
| Wie kommen die Mails? | **drei einzelne Schalter** *und* eine Tagesübersicht am Abend |
| Wie oft darf dasselbe Studio melden? | **einmal pro Tag je Studio** |

## Die wichtigste Entscheidung: keine neue Sammlung

Der naheliegende Bau wäre eine Sammlung `meldungen` gewesen — jede
Erledigung schreibt eine Zeile, die Glocke liest sie. Bei 13 Studios und
rund 65 Erledigungen am Tag sind das **65 zusätzliche Schreibvorgänge
täglich**, plus Regeln, plus Aufräumen.

Nachgesehen, was schon da ist: `cachedTodos` und `cachedClean` werden für
**alle verwalteten Studios ohnehin beobachtet** (`listenTodoStudio`,
`listenClean`). Die Meldungen entstehen deshalb aus dem Vergleich zweier
Schnappschüsse — reines Ablesen. **Kein zusätzlicher Schreibvorgang,
keine neue Regel, keine Kosten.**

Der Preis, offen gesagt: die Liste überlebt kein Neuladen. Wer die
Historie braucht, findet sie unter „Zuletzt passiert" auf der Startseite.
Für die Frage, die die Glocke beantwortet — *was lief, während ich
woanders war?* — reicht sie.

Verglichen wird `doneAt`, nicht `done`. Eine tägliche Aufgabe steht am
nächsten Morgen wieder offen und wird abends erneut abgehakt; über `done`
allein wäre derselbe Punkt nie ein zweites Mal ein Ereignis.

## Drei Kanäle, drei Fragen

| Kanal | beantwortet | stört |
|---|---|---|
| Glocke | Was lief heute? | nie — man geht hin |
| Toast | Gerade passiert. | nur bei offener App |
| Push | Auch bei geschlossener App. | am Gerät abschaltbar |

Ein Schalter für Toast **und** Push, nicht zwei: beide sagen dasselbe,
nur zu verschiedenen Zeitpunkten. Die Glocke hat keinen Schalter — etwas
abzuschalten, das nur dann etwas sagt, wenn man hinschaut, wäre ein
Schalter ohne Wirkung.

## „Nur" ist wörtlich gemeint

Drei Mailsorten, aber nie drei Mails für einen Haken:

```
alles offen        →  nichts
Aufgaben durch     →  „Aufgaben erledigt"   (fertigTodos)
Putzplan durch     →  „Putzplan fertig"     (fertigPutz)
beides durch       →  „alles erledigt"      (fertig)  — und nur diese
```

Dazu die Tagessperre: derselbe Übergang meldet höchstens einmal je Tag
und Studio. Ohne sie reicht **eine** neu angelegte und gleich abgehakte
Aufgabe für eine zweite Mail — der Zustand springt ja wirklich von offen
auf fertig.

Damit sich das überhaupt **prüfen** lässt, schreibt der Merker jetzt
`gesendet: [...]` mit. Ohne dieses Feld sähe ein unterdrückter Fall
genauso aus wie einer, der nie fällig war — der Durchlauf hätte grün
gemeldet, ohne etwas gemessen zu haben. Es kostet nichts; der
Schreibvorgang findet ohnehin statt.

## Die Tagesübersicht ist die einzige, die etwas Neues sagt

Alle drei Meldungen oben kommen im Augenblick des Fertigwerdens. Ein
Studio, in dem **nie etwas fertig wurde**, meldet sich damit gar nicht —
und ausgerechnet das ist das Studio, von dem man hören wollte.

Deshalb um 20:30 Uhr eine Mail mit allen Studios darin, auch den leer
gebliebenen. Eine Nachricht statt dreizehn, und der Blick geht auf die
Zeilen, in denen noch etwas steht.

## Der Fund: eine Zeile, die es nicht mehr gab

Beim Einfügen des Melde-Blocks in `index.html` ist der **Kopf der
Funktion darunter** verlorengegangen:

```js
function localNotify(title, body, art){      ← diese Zeile fehlte
  if(art && PREFS.notify && PREFS.notify[art]===false) return;
```

Folge: Syntaxfehler, die App startete überhaupt nicht. Der Durchlauf
klickte daraufhin auf eine Glocke, die es nie geben würde, und lief
**240 Sekunden in den Zeitablauf, ohne einen einzigen Satz auszugeben.**
Vier Minuten Warten für die Auskunft „nichts".

Der eigentliche Fehler war meiner. Der zweite Fehler war, dass er so
teuer zu finden war. `test-glocke.js` prüft jetzt als erstes, ob
`#app.show` überhaupt da ist, und bricht mit der Browser-Fehlermeldung
ab, statt auf ein Element zu warten, das nie kommt.

## Die Glocke kostet der Marke ihren Schriftzug — aber nur beim Chef

Ein Knopf mehr in der Kopfzeile sind 44 Pixel plus Abstand.
`test-abgeschnitten.js` meldete prompt: *„#tbHome — 157 > 127 px bei
430 px"*. Nachgemessen mit erzwungenem Schriftzug, Chef-Konto, in
Zehnerschritten:

| Breite | Kasten | Schriftzug |
|---|---|---|
| 430 px | 127 px | 157 px — abgeschnitten |
| 460 px | 150 px | 157 px — abgeschnitten |
| **470 px** | **157 px** | **157 px — passt** |

Die Grenze steht deshalb auf **469px** und nicht auf einer runden Zahl.
Und sie hängt an `body.rolle-leitung`, nicht an der Breite allein: ein
Mitarbeiter hat Bericht- und Glocken-Knopf gar nicht. Ihm den Schriftzug
wegzunehmen, weil beim Chef der Platz knapp ist, wäre der Fehler, den man
beim Messen mit genau einem Konto macht.

## Der zweite Fund: grün für etwas, das die App nicht tat

„Was ich selbst abgehakt habe, muss mir niemand melden" hängt an
`doneByUid`. Der Durchlauf prüfte das und war grün.

Er war grün, weil die **Attrappe** das Feld mitbrachte. Die App schrieb
es beim Abhaken einer Aufgabe gar nicht — nur der Putzplan tat das:

```js
// Putzplan, seit jeher
.update({ done, doneBy, doneByUid, doneKuerzel, doneAt })
// Aufgaben, bis heute
.update({ done, doneBy, doneAt })
```

Im Betrieb hätte jeder Chef seinen eigenen Haken als Meldung
zurückbekommen. Aufgefallen ist es beim Nachsehen, nicht beim Testen —
und das ist der eigentliche Punkt: **eine Attrappe, die großzügiger ist
als die Wirklichkeit, macht jeden Durchlauf darüber wertlos.**

`test-glocke.js` klickt deshalb jetzt ein echtes Kästchen an und liest,
was zur Datenbank ginge (`window.__schreib`). Gegenprobe: Feld wieder
entfernt → *„Abhaken schreibt kein doneByUid: {done, doneBy, doneAt}"*.

Nebenbei ist der Name als Kennung ohnehin die schlechtere Wahl: zwei
Personen können „Anna" heißen, und ein Name ändert sich, wenn jemand
heiratet.

## Die Attrappe konnte nicht messen, was hier zu messen ist

`stub-chef.js` und `stub-mitarbeiter.js` feuerten je Sammlung **genau
einen** Schnappschuss. Für alles, was *Veränderungen* erkennt, ist das
keine Probe: es gibt nichts zu vergleichen, und ein Durchlauf darüber
wäre immer grün gewesen.

Beide haben jetzt `window.__nachschub(pfad, liste)` — derselbe Zuhörer,
neue Daten. Der Rückgabewert ist die Zahl der bedienten Zuhörer, und der
Durchlauf schlägt bei **0** an: sonst prüfte er ins Leere, wenn der Pfad
sich einmal ändert.

## Gegenproben

Jede Behauptung einmal absichtlich kaputt gemacht:

| Eingriff | Ergebnis |
|---|---|
| `meldPruefen` gibt sofort zurück | 8 Funde, darunter „Zahl ist "" statt "1"" ✓ |
| „selbst abgehakt" nicht mehr gefiltert | „Zahl ist "3" statt "2"" ✓ |
| Toast ignoriert den Schalter | „Schalter aus, trotzdem ein Toast" ✓ |
| `doneByUid` beim Abhaken weggenommen | „Abhaken schreibt kein doneByUid" ✓ |
| Tagessperre entfernt | „zweimal am selben Tag meldet nur einmal" rot ✓ |

Die letzte lief gegen den Emulator: 165 statt 166 bestanden, genau die
eine Zeile.

## Und der Gestaltungs-Durchlauf hat mein eigenes CSS kassiert

Vier Zeilen im neuen Stylesheet standen neben der Leiter, nicht auf ihr:

| gemeldet | war | ist |
|---|---|---|
| `FESTER ABSTAND: 1px` | `margin-top:1px` | `var(--s1)` |
| `FESTER ABSTAND: 2px` | `gap:2px` | `var(--s2)` |
| `FESTE SCHRIFTANGABE 12px` | `font-size:12px` | `var(--t-xs)` |
| `FESTE SCHRIFTANGABE 19px` | `line-height:19px` | `display:grid; place-items:center` |

Die letzte ist die interessante: `line-height:19px` war nur ein Trick,
um die Zahl in ihrem Kreis zu zentrieren. `.tab .badge` macht dasselbe
seit jeher über `place-items` — ohne festen Wert, und die Zahl sitzt auch
dann mittig, wenn jemand die Schrift größer stellt. Der Durchlauf hat
nicht nur eine Zahl gefunden, sondern die schlechtere Lösung.

## Eine Zeile, die ich zurückgenommen habe

Im Fenster stand zuerst *„Was heute in deinen Studios abgehakt wurde."*
Das stimmt nicht: die Liste beginnt beim Öffnen der App, nicht um
Mitternacht. Wer sie morgens öffnet, sieht nichts — und läse „heute" als
„heute ist nichts passiert" statt als „seit dem Öffnen ist nichts
passiert". Jetzt steht dort, was wirklich gilt.

## Was hier NICHT bewiesen ist

- **Dass eine Mail ankommt.** Kein SMTP im Durchlauf. Belegt ist, welche
  Sorte `teamMail` mit welchem Thema aufruft — nicht, was im Postfach
  landet.
- **Dass ein Push auf einem Handy erscheint.** Chromium hier hat kein
  Netz. Belegt ist nur die **Auswahl** der Geräte — Rolle, Studio,
  eigener Schalter, eigener Haken — und zwar über `collectTokens` im
  Emulator. Die Bedingung selbst steht dabei zweimal da, in
  `erledigtPush` und im Durchlauf. Das ist die schwache Stelle dieses
  Abschnitts und bewusst in Kauf genommen: die Funktion selbst
  *verschickt*, und Verschicken geht hier nicht.
- **Die Tagesübersicht um 20:30 Uhr** ist nur im Code belegt, nicht in
  einem Lauf: ein Zeitplan hinterlässt keine Spur in der Datenbank.

---

# 58 · Ein Weg statt zwei — und 22 doppelte Symbole

**28. August 2026**

## Zwei Wege für dieselbe Handlung

Eine Aufgabe legt man über **„+ Neu" in der Kopfzeile** an. Eine
Putzaufgabe lag hinter einer Karte am **Fuß der Putzplan-Seite** — hinter
der Liste und hinter den Notizen. Wer sie anlegen wollte, musste erst an
allem vorbeiscrollen, was er gerade nicht suchte.

| | vorher | jetzt |
|---|---|---|
| Griff | Karte am Seitenfuß | „+ Neu" in der Kopfzeile |
| Studio | jedes Mal von Hand ankreuzen | das oben gewählte ist vorbelegt |
| nach dem Anlegen | Formular bleibt leer stehen | Fenster geht zu |

**Die Vorauswahl ist der eigentliche Gewinn.** Wer auf der Putzplan-Seite
von Hürth steht und dort etwas anlegt, meint in aller Regel Hürth —
vorher fing das Anlegen trotzdem regelmäßig mit *„Bitte mindestens ein
Studio wählen"* an.

Die Feld-Kennungen sind bewusst unverändert geblieben (`ppTitle`,
`ppStudios`, `ppRepeat` …). `addPutzTask()` und `buildPutzplanSelect()`
greifen darauf zu; ein Umzug im Markup sollte nicht die halbe Logik
mitreißen.

**Nicht mitgemacht:** Mitarbeiter dürfen weiterhin keine Putzaufgaben
anlegen. Bei den Aufgaben dürfen sie es seit dem 13.8. — beim Putzplan
sagt `firestore.rules` `allow create: if manages(studioKey)`. Das
gleichzuziehen ist eine Entscheidung über Zuständigkeit, keine über
Oberfläche, und gehört in eine eigene Runde.

## Der Fund: 22 Knöpfe zeichnen ihr Symbol doppelt

Auf dem ersten Bildschirmfoto der neuen Kopfzeile standen **zwei
Drucker** nebeneinander. Ursache: der Knopf trug beides —

```html
<button data-ikon="drucken" …><svg class="sym">…</svg> Drucken</button>
```

`ikonenEinsetzen()` hängt sein SVG per `insertAdjacentHTML('afterbegin')`
davor, das handgeschriebene bleibt stehen. Nachgezählt im laufenden
Browser: **22 von 108** Elementen mit `data-ikon` waren so — Drucken,
Als Excel, Kopieren, Bestellmail, Foto hinzufügen, Defekt melden,
Checkliste senden und fünfzehn weitere.

Jeder einzelne war sichtbar falsch, und keiner ist je gemeldet worden.
**Ein doppeltes Symbol sieht aus wie Absicht, wenn man es nicht sucht.**

Genau das war der Grund, aus dem `data-ikon` überhaupt eingeführt wurde:
eine Quelle je Bild. Die 22 waren die Reste der Umstellung — beide
Fassungen standen noch da.

`test-gestaltung.js` prüft es jetzt an der Quelle, nicht am Bildschirm:
ein Element mit `data-ikon` darf kein eigenes `<svg>` enthalten.
Gegenprobe mit einem zurückgebauten Knopf: *„SYMBOL DOPPELT: 1
Element(e) … (drucken (#ppPrint))"* ✓

## Die Attrappe verschluckte Stapelschreiben

`addPutzTask()` schreibt über `db.batch()` — für mehrere Studios auf
einmal. Der Stapel der Attrappe war:

```js
batch: function () { return { set: function () {}, … } }
```

Alles still verworfen. Der erste Lauf meldete darum *„Anlegen schreibt
nichts"*, und das stimmte nur für die Attrappe. Beide Attrappen legen
jetzt auch Stapel in `window.__schreib` ab, und der Verweis trägt seinen
Pfad mit (`_pfad`) — ohne den kann ein Stapel nicht sagen, **wohin** er
geschrieben hätte.

## Und gleich die erste Empfehlung: Putzaufgabe bearbeiten

Bis heute konnte man eine Putzaufgabe nur **löschen**. Ein Tippfehler im
Titel kostete Löschen und Neuanlegen — und damit die gesamte
Erledigt-Historie des Punktes. Aufgaben haben ihr Bearbeiten-Fenster seit
Langem.

Gebaut ist es als **derselbe Dialog** mit zwei Zuständen, nicht als
zweites, fast gleiches Fenster:

| | Anlegen | Bearbeiten |
|---|---|---|
| Überschrift | Neue Putzaufgabe | Putzaufgabe bearbeiten |
| Knopf | Putzaufgabe erstellen | Änderung speichern |
| Studio-Auswahl | da, vorbelegt | **weg** |

Zwei Formulare für dieselben vier Felder laufen auseinander, sobald eines
davon ein Feld dazubekommt — genau das ist dem Putzplan gegenüber den
Aufgaben schon einmal passiert.

Die Studio-Auswahl fällt beim Ändern weg: eine Putzaufgabe liegt in genau
einem Studio, und sie woandershin zu schieben ist etwas anderes, als sie
zu ändern.

**Was das Update NICHT anfasst:** `done`, `doneBy`, `doneAt`,
`doneByUid`, `doneKuerzel`, `pausiertBis`. Der Haken von heute Morgen
überlebt eine Titeländerung — der Durchlauf prüft jedes dieser Felder
einzeln.

Die Felder des eigenen Intervalls werden bei **jeder** Wiederholungsart
mitgeschrieben (leer, wenn keine). Sonst bliebe an einer Aufgabe, die von
„alle 3 Tage" auf „täglich" umgestellt wird, das alte `intervalMs`
stehen, und `erledigt()` rechnete weiter damit.

## Ein Fehler, den ich beim Nachlesen des eigenen Diffs gefunden habe

```js
ppN.addEventListener('click', oeffnePutzAufgabe);
```

`addEventListener` übergibt das MouseEvent als erstes Argument, und
`oeffnePutzAufgabe()` hält das erste Argument für die zu bearbeitende
Aufgabe. Das Fenster wäre im Bearbeiten-Zustand aufgegangen — mit einem
Klick-Ereignis als Aufgabe. Jetzt steht dort eine Hülle.

## Der teuerste Fund: eine geteilte Klasse ändert, was ausgewählt wird

Der saubere Lauf danach meldete **88 grün, 1 rot** — `test-block3` mit
einem Zeitablauf. Die Ausgabe nannte den Grund selbst:

```
<div data-auf="1" class="show" id="putzModal"> intercepts pointer events
```

`test-block3` klickt `document.querySelector('.pp-del')`, um eine
Putzaufgabe zu **löschen**. Ich hatte dem neuen Stift dieselbe Klasse
gegeben — der gleichen Maße wegen — und er steht in der Zeile **davor**.
Der Durchlauf drückte also den Stift, das Bearbeiten-Fenster ging auf und
fing alles Weitere ab.

**Eine Klasse ist ein Name, keine Formatvorlage.** Wer sie teilt, teilt
auch, was sie auswählt. Der Stift heißt jetzt `pp-edit`; das gemeinsame
Aussehen steht als `.pp-del,.pp-edit{…}` da, wo es hingehört.

Kein Testproblem: hätte jemand im Betrieb eine Putzaufgabe löschen
wollen, wäre es ihm genauso gegangen — der erste Griff in der Zeile war
nicht mehr der, für den er gehalten wurde.

Beide Durchläufe halten den Fall jetzt fest. Gegenprobe mit
zurückgegebener Klasse: `test-putzplan-anlegen` meldet *„Der erste
.pp-del ist nicht der Papierkorb, sondern „bearbeiten""*, `test-block3`
fällt wieder um. ✓

## Zwei Rote, die ich selbst verursacht habe

Der volle Lauf meldete vier Rote. Zwei waren die Umgebung nach einem
Container-Neustart (dieselben zwei wie in Runde 57). Die anderen beiden —
`test-werkbank` und `test-zugang-rolle`, beide mit *„Cannot read
properties of null"* — waren **meine**: ich habe `index.html` bearbeitet,
während der Lauf lief. Zwischen zwei Änderungen stimmte der CSP-Hash
nicht, die App startete nicht, und die Durchläufe klickten ins Leere.

Einzeln nachgefahren waren beide sofort grün. Die Lehre steht hier, weil
sie mir zum zweiten Mal passiert ist: **während `alle.sh` läuft, wird
keine Datei angefasst.**

## Gegenproben

| Eingriff | Ergebnis |
|---|---|
| Vorauswahl abgeschaltet | „angekreuzt ist []" + drei Folgefehler ✓ |
| Fenster bleibt nach dem Anlegen offen | „steht noch offen" ✓ |
| `data-manage-only` am Knopf entfernt | „Mitarbeiter sieht + Neu" ✓ |
| Doppel-SVG am Drucken-Knopf zurückgebaut | `test-gestaltung` rot ✓ |
| Bearbeiten schreibt `done:false` mit | „fasst „done" an — das löscht den Haken" ✓ |
| beide Rücksetzer von `_ppEdit` entfernt | „+ Neu hängt im Ändern-Zustand" ✓ |

**Eine Gegenprobe hat zweimal nicht gebissen, und das ist eine Aussage
über den Durchlauf, nicht über den Code.** `_ppEdit` wird an zwei
unabhängigen Stellen zurückgesetzt — beim Schließen und bei jedem Öffnen.
Ein einzelner Eingriff bricht das deshalb nicht; erst beide zusammen
machen die Prüfung rot. Sie misst also etwas, der Code ist nur doppelt
abgesichert. Das nachzusehen war die eigentliche Arbeit — „grün geblieben"
heißt sonst genauso gut „prüft nichts".

Der neue Durchlauf vergleicht die **Lage** der beiden „+ Neu"-Knöpfe,
nicht ihr Vorhandensein: gleiche Höhe, gleicher Abstand rechts, jeweils
auf zehn Pixel genau. „Steht auch dort" ist die Behauptung, also wird das
gemessen.

---

# 59 · Suchen, Filtern, und aus einer Notiz wird eine Aufgabe

**31. August 2026**

Empfehlung 2 und 5 aus der Liste von Runde 58.

## Suchen und Filtern — aber nur, was es hier geben kann

Die Aufgaben haben Suchfeld, vier Filter-Chips und Sortierung. Der
Putzplan hatte eine nackte Liste; bei zwölf Punkten je Studio ist das
derselbe Bedarf.

Übernommen sind **drei** Chips, nicht vier:

| Aufgaben | Putzplan | warum |
|---|---|---|
| Alle | Alle | |
| Nur offene | Nur offene | |
| Überfällig | — | Putzaufgaben haben keine Frist |
| Für mich | — | Putzaufgaben haben keine Zuweisung |
| — | **Pausiert** | die Zahl stand schon da, der Weg dorthin fehlte |

**Ein Filter, der nie etwas findet, ist ein Versprechen ohne Deckung.**
Der Durchlauf schlägt deshalb an, wenn „Überfällig" oder „Für mich" hier
auftauchen — nicht nur, wenn die drei richtigen fehlen.

„Pausiert" gibt es umgekehrt nur hier: die Fortschrittszeile nannte die
Zahl längst („2 pausiert"), aber es gab keinen Weg, sich diese zwei
anzusehen.

## Die Zahl, die stimmt und trotzdem lügt

Die Fortschrittszeile zählt **immer den ganzen Plan**, nie das Gefilterte.
Sonst stünde bei „Nur offene" plötzlich

```
0 von 3 erledigt · 2 pausiert
```

— rechnerisch richtig und als Aussage falsch, weil zwei Punkte längst
abgehakt sind. Die Gegenprobe macht genau das und meldet den Satz oben
wörtlich.

## Ein Fehler in der Reihenfolge

Der Zähler „X von Y" las die gezeigten Zeilen aus dem DOM:

```js
document.querySelectorAll('#ppList .pp-item').length
```

Der Aufruf steht aber **vor** dem Schreiben der Liste — gezählt wurde
damit der vorige Durchgang. Auf dem Bildschirm stand „5 von 5", während
drei Punkte dastanden. Die Zahl kommt jetzt als Argument herein.

Gefunden nicht durch Nachdenken, sondern durch Hinsehen: die Probe gab
`{"punkte":3,"zaehler":"5 von 5"}` aus, und die zwei Zahlen passten nicht
zueinander.

## Aus einer Notiz wird eine Aufgabe

„Wischmopp ist kaputt" landete in den Notizen und blieb dort liegen. Bei
den Geräten gibt es den Weg längst — eine Defektmeldung erzeugt eine
Aufgabe mit `devId` —, beim Putzplan fehlte er.

Jetzt steht an jeder Notiz **„→ Putzaufgabe"** (nur für die Leitung, weil
`firestore.rules` das Anlegen ohnehin auf sie beschränkt). Der Knopf
öffnet dasselbe Fenster im **Anlege**-Zustand, mit dem Notiztext als
Titel und dem aktuellen Studio vorbelegt.

**Die Notiz bleibt stehen.** Sie automatisch zu löschen hieße, jemandem
seine Nachricht wegzunehmen, weil man sie gelesen hat. Der Löschknopf
steht daneben; das ist eine eigene Entscheidung.

## Gegenproben

| Eingriff | Ergebnis |
|---|---|
| Fortschritt zählt die gefilterten | „ändert sich mit dem Filter: 2 von 5 → 0 von 3" ✓ |
| Zähler wieder aus dem DOM gelesen | „„5 von 5", gezeigt werden 3 von 5" ✓ |
| Notiz-Knopf öffnet im Bearbeiten-Zustand | „öffnet im Bearbeiten-Zustand" ✓ |
| Notiz-Knopf auch für Mitarbeiter | „Mitarbeiter sieht → Putzaufgabe" ✓ |

Und `test-gestaltung.js` hat wieder mein eigenes CSS kassiert:
`.pp-note-tat` setzte `color` zweimal — einmal in der gemeinsamen Regel
mit `.pp-note-del`, einmal in der eigenen. Die erste war damit tot. Der
gemeinsame Teil trägt jetzt keine Farbe mehr.

---

# 60 · „Das sieht auch wieder so off aus" — und der ältere Fehler dahinter

**31. August 2026**

Gemeldet wurde die Glocke mit ihrem Abzeichen. Gefunden wurden **zwei**
Fehler, und der ältere war nicht der, um den es ging.

## Fehler 1, der eigentliche: das Symbol saß nicht in der Mitte

```css
button[data-ikon]:not(.btn){display:inline-flex;align-items:center;gap:var(--s6)}
```

Diese Zeile ist für Knöpfe mit Symbol **und** Wort gedacht. Sie
überschreibt dabei das `place-items:center` von `.icon-btn` und setzt
selbst **kein** `justify-content` — das Zeichen rutscht also an den
linken Rand.

Gemessen, app-weit: **drei Knöpfe, alle 12 Pixel daneben.**

```
tbBericht  dx=-12   (44x44)
tbGlocke   dx=-12   (44x44)
chatMic    dx=-12   (46x46)
```

Der Fehler war älter als das Abzeichen. Aufgefallen ist er erst, weil
rechts eine Lücke klaffte, in der die neue Zahl allein stand.

## Fehler 2: das Abzeichen war zu groß und saß in der Ecke

19px auf einem 44px-Knopf — 43 % der Breite, hart in die Ecke gedrückt,
mit einem Ring, der in den Rand schnitt. Meine eigene Begründung im Code
war falsch: *„Maße wie `.tab .badge`"*. Dieselbe Größe, die **neben**
Text gut liest, ist **auf** einem 44er-Knopf zu groß.

Jetzt 16px, über der Ecke sitzend statt in ihr.

## Die beiden haben sich gegenseitig verdeckt

Das ist der interessante Teil. Solange das Symbol 12px links stand, lag
das alte Abzeichen **neben** der Glocke — gemessen 0 px² Überdeckung.
Erst mit mittigem Symbol wird sichtbar, was es angerichtet hätte:

| | Überdeckung des Symbols |
|---|---|
| altes Abzeichen, Symbol mittig | **64 px²** |
| neues Abzeichen, Symbol mittig | **0 px²** |

**Wenn eine Messung „unauffällig" sagt, obwohl das Auge etwas sieht,
fehlt der zweite Fehler.**

## Die Regel wird hergeleitet, nicht gewählt

Naheliegend wäre gewesen: *„ein Abzeichen darf höchstens 40 % der
Knopfbreite belegen."* Das hätte die zwei Fälle getrennt (43 % gegen
36 %) — aber nur, weil die Zahl dazwischenpasst. Eine ans Ergebnis
angepasste Schwelle hält bis zum nächsten Sonderfall.

*„Ein Abzeichen darf nicht auf dem Symbol liegen"* trennt dieselben
Fälle **und** sagt, warum es schlecht aussah.

## Und die Reichweite einer gemeinsamen Regel wird gemessen

`justify-content:center` pauschal auf `button[data-ikon]` war die
einfache Korrektur. Vorher nachgemessen, welche Knöpfe sich dadurch
bewegen:

```
tbBericht   1 ->  13  ✓ gewollt
tbGlocke    1 ->  13  ✓ gewollt
chatMic     1 ->  13  ✓ gewollt
Umfrage    12 ->  32  ✗ ein Menüeintrag, der zu Recht links steht
```

Deshalb trägt die Korrektur nur `.icon-btn` und `.attach-btn`.

## Aus der Rückmeldung wurde eine Prüfung, kein Vorsatz

*„bitte achte auf sowas bei ALLEN Knöpfen IMMER bevor es neue gibt"* —
ein Vorsatz rutscht beim nächsten Mal wieder durch. `test-knoepfe.js`
geht jetzt jede Ansicht ab: **165 Nur-Symbol-Knöpfe und 25 Abzeichen**
je Lauf.

Dazu `.claude/skills/knoepfe/` mit der Reihenfolge (erst messen, dann
bauen, dann gegenprüfen) und den zwei Fallen, die mich beim Messen
selbst erwischt haben.

## Zwei Fallen beim Messen

1. **Verstecktes Wort zählt als Text.** Meine erste Sonde filterte über
   `textContent` und übersah `tbGlocke` und `tbBericht` — beide tragen
   ein unsichtbares Wort („Bericht", die „0" des Abzeichens). Sie fand
   nur `chatMic`. Erst die Prüfung auf *sichtbaren* Inhalt fand alle drei.
2. **`getBoundingClientRect` allein reicht nicht**, wenn man wissen will,
   welche Regel gewinnt. Die Ursache stand erst fest, nachdem der
   Durchlauf `document.styleSheets` nach allen passenden Regeln gefragt
   hat.

## Gegenproben

| Eingriff | Ergebnis |
|---|---|
| Zentrierung zurückgenommen | 3× „NICHT MITTIG … -12/0 px" ✓ |
| altes Abzeichen (19px in der Ecke) | „ABZEICHEN AUF DEM SYMBOL — 64 px²" ✓ |

---

# 61 · Die stillgelegten Nebenseiten — und eine Warnung an die Anleitung

**31. August 2026**

## Erst eine Korrektur an mir selbst

Ich hatte gemeldet: *„`marketing.html` und `wachstum.html` schreiben auf
flache Pfade — mit einem zweiten Kunden lesen und schreiben beide Seiten
in dieselben Sammlungen."* Die Zahlen stimmten (23 und 13 flache
Zugriffe), der Schluss war falsch.

**Beide Seiten sind seit dem 13.8.2026 stillgelegt**, an zwei Stellen
gleichzeitig: `firebase.json` liefert sie nicht aus, und in
`firestore.rules` stehen ihre Sammlungen auf `allow read, write: if
false` — flach *und* unter `firmen/`. Kein Browser kommt an diese Daten,
auch der erste Kunde nicht.

Ich hatte `db.collection(...)` gezählt und daraus auf ein Leck
geschlossen, ohne zu prüfen, ob die Seiten überhaupt erreichbar sind.
Eine Vermutung als Befund verkauft.

## Was wirklich das Risiko ist

Nicht der heutige Zustand, sondern die **Anleitung zum Zurückholen**. In
`firebase.json` stand:

> *„die beiden Zeilen unten streichen und ausrollen holt sie zurück"*

und in `firestore.rules`:

> *„dieses false durch die Regeln ersetzen, die im Verlauf stehen"*

Wer dem folgt, holt das Leck mit zurück: die alten Regeln fragten nur
`istAktiv()` — genau daran lag es —, und der Code greift weiterhin flach
zu. Zwei Kunden sähen sich gegenseitig in den Terminen, mitsamt Namen
und E-Mail-Adressen ihrer Endkundinnen.

An beiden Stellen steht jetzt die Reihenfolge:

1. `S()` einbauen, alle Aufrufe umstellen (`users` bleibt oben — ein
   Profil muss vor der Anmeldung findbar sein)
2. `tools/umzug.js` um die Sammlungen erweitern, Daten kopieren
3. firmengebundene Regeln setzen, **nicht** die alten
4. erst zuletzt die zwei Zeilen aus `firebase.json`

## Und eine Prüfung, die anschlägt, wenn jemand sie umdreht

Eine Warnung im Kommentar liest, wer den Kommentar liest.
`tests/test-nebenseiten.js` prüft beide Hälften der Abschaltung
gegeneinander:

| Lage | Urteil |
|---|---|
| nicht ausgeliefert, Regeln zu | ✓ abgeschaltet |
| ausgeliefert, Regeln zu | ✗ die Seite lädt und tut nichts |
| ausgeliefert, Code noch flach | ✗ **das Leck ist wieder offen** |

**Gegenprobe:** die zwei Zeilen aus `firebase.json` gestrichen, sonst
nichts geändert — genau das, was die alte Anleitung sagte. Ergebnis:
acht Funde, die ersten beiden wörtlich *„ist ausgeliefert und greift
NICHT mehr flach zu"*. ✓

Vorbild ist `test-funktionen-pfade.js`, das dasselbe für
`functions/index.js` bewacht. Dort war es nötig, weil ein flacher
Zugriff niemandem auffällt — hier auch.

## Der dritte Punkt fiel aus, und dahinter lag etwas anderes

Geplant war, `werbung.html` durch `test-xss.js` zu ziehen. Nachgemessen
hat die Seite **keine Angriffsfläche**:

```
innerHTML 0 · outerHTML 0 · document.write 0 · insertAdjacentHTML 0
location.search 0 · location.hash 0 · URLSearchParams 0 · eval 0
```

dazu eine eigene CSP mit Skript-Hash. Ein Durchlauf darüber wäre grün
gewesen und hätte nichts bewiesen — die Sorte Grün, gegen die dieses
Projekt sonst anschreibt.

## Dafür lag darunter etwas Ernsteres

`werbung.html` wird ausgeliefert und hatte ein Kontaktformular: Name,
E-Mail, Nachricht, Knopf „Probetraining anfragen". Darüber stand *„Wir
melden uns innerhalb von 24 Stunden bei dir – versprochen."* Nach dem
Absenden erschien *„Danke! Wir melden uns innerhalb von 24 Stunden. 💪"*

**Die Nachricht ging nirgendwohin.** Kein `fetch`, kein
`XMLHttpRequest`, kein `action`, kein Formspree — nur
`note.textContent = …` und `form.reset()`. Im Quelltext stand daneben:

```html
<!-- HINWEIS: Für echten Versand einen Backend-Service einbinden (z.B. Formspree) -->
```

Der Platzhalter ist live gegangen. Wer ihn ausgefüllt hat, bekam ein
ausdrückliches Versprechen und nie eine Antwort — während Telefonnummer,
E-Mail-Adresse und Anschrift direkt daneben standen und funktionieren.

**Nicht stillschweigend geändert**, weil die zwei Wege verschieden teuer
sind: den Text ehrlich machen (fünf Minuten) oder echten Versand bauen
(Cloud Function plus Regel für einen öffentlichen, nicht angemeldeten
Schreibweg — ein Spam-Tor, das eine Bremse braucht). Entschieden wurde
**ehrlich machen**.

Jetzt stehen an der Stelle die zwei Wege, die funktionieren: Telefon
zuerst, weil der Termin dort im selben Gespräch steht, daneben E-Mail
mit vorbereitetem Betreff und Textgerüst. Beides sind gewöhnliche
Verweise — sie funktionieren auch, wenn JavaScript scheitert. Das ist
der Punkt.

**Ein Formular, das nur so tut, ist schlechter als gar keins:** es hält
jemanden davon ab, den Weg zu gehen, der wirklich funktioniert.

Der Exit-Intent hing am Fokus im Formular. Er zählt jetzt den Griff zu
Telefon oder E-Mail — wer schon anruft, braucht kein Fenster mehr.

## Und noch ein toter Link auf derselben Seite

Im Fußbereich stehen **„Datenschutz" und „AGB" als `href="#"`**. Beide
führen nirgendwohin. `werbung.html` ist eine öffentliche, gewerbliche
Seite; die App hat ihre Angaben unter Verwaltung → System, diese Seite
hat gar keine.

Steht in `OFFEN.md` und ist bewusst nicht von mir gelöst: das ist
dieselbe Frage wie die vier rechtlichen Pflichtfelder — eine
Entscheidung, kein Handgriff.

---

# 62 · Eine Erwähnung, die aussah wie eine Ansprache

## Der Fund

Die `@Erwähnung` war eine reine **Chat-Sache**. Nur dort wurde ein Name
hervorgehoben, nur dort kam eine Meldung an.

Derselbe Satz an jedem anderen Ort — Übergabe, Schwarzes Brett,
Putzplan-Notiz, Direktnachricht, Lesemodus, Ankündigung — war
**schlichter Text**. „@Anna bitte übernehmen" in einer Übergabe erreichte
Anna nicht.

Das ist die schlimmere Sorte Fehler: nicht *„es geht nicht"*, sondern
*„es sieht aus, als ginge es"*. Wer den Satz schreibt, hat den Eindruck,
Bescheid gesagt zu haben. Und im Chat funktioniert es ja — die Erwartung
ist also gelernt.

## Zwei Hälften, die zusammengehören

| | |
|---|---|
| **Hervorheben** | `markMentions()` um jeden Text, der von Menschen kommt |
| **Melden** | `mentions:[]` wird **beim Schreiben** gespeichert, `erwMelden()` liest es beim Zuhören |

Warum mitgeschrieben und nicht beim Lesen errechnet: wer erwähnt wurde,
hängt an der Personenliste **zum Zeitpunkt des Schreibens**. Ein später
umbenanntes Konto verlöre die Erwähnung sonst rückwirkend. Dieselbe
Überlegung wie im Chat, deshalb dieselbe Lösung.

Zehn Stellen gehen jetzt durch `markMentions()`: Übergabe, Brett, drei
im Lesemodus, Putzplan-Notiz, Direktnachricht, Kanal-Chat und zweimal
Ankündigungen. Zwei Stellen bleiben bewusst draußen — E-Mail-Adressen in
einer Liste (dort steht kein `@Name`, sondern ein `@Anbieter`) und das
Impressum (Angaben des Betreibers, keine Beiträge von Menschen). Beide
stehen mit Grund in einer Ausnahmeliste im Durchlauf, damit „gehört
dazu" eine Entscheidung ist und kein Vergessen.

## Drei Fälle, die NICHT melden

Jeder mit Grund, alle drei nachgemessen:

* **älter als der App-Start** — sonst bräche beim Anmelden die ganze
  Woche als „gerade erwähnt" herein
* **selbst geschrieben** — wer sich selbst nennt, weiß es
* **schon gemeldet** — der Zuhörer wird beim Wechsel auf die Team-Seite
  neu aufgebaut; dieselbe Meldung zweimal ist schlimmer als keine

## Der Toast ist nach 2,7 Sekunden weg

Damit wäre die Erwähnung eine Meldung, die man verpassen kann, und
danach nicht mehr auffindbar. Im Chat leistet `.msg.mentioned` genau
das — ein Rahmen in Akzentfarbe. Außerhalb gab es nichts.

Jetzt tragen `.ho-item` und `.bb-item` dieselbe Markierung, mit
**bewusst derselben Optik**: wer sie im Chat gelernt hat, muss sie hier
nicht neu lernen.

Markiert wird auch die **selbst geschriebene** Erwähnung. Wiederfinden
und Melden sind zwei verschiedene Fragen: melden nein, wiederfinden ja.

## Zwei Lücken in den Attrappen, gefunden beim Bauen

Beide derselben Sorte — und beide hätten jeden Durchlauf darüber
**stumm grün** gemacht:

1. **`board` fehlte in `onSnapshot`**, obwohl `get()` es kannte. Das
   Schwarze Brett hört mit `onSnapshot` zu. `#bbList` war deshalb
   *immer* leer; ein Durchlauf über das Brett hätte null Zeilen gemessen
   und nichts gemeldet.
2. **Die Übergaben merkten sich ihren Zuhörer nicht.** `__nachschub()`
   erreichte sie nicht und gab 0 zurück. Der neue Durchlauf prüft diese
   Rückgabe jetzt ausdrücklich als *erste* Zeile — alles Danach hinge
   sonst in der Luft.

Dazu ein dritter Stolperstein, der keine Lücke war, sondern eine falsche
Annahme von mir: die Probe legte ihre Daten unter `studio-6` ab, der
Team-Bereich startet aber auf dem **alphabetisch ersten** Studio
(Brühl = `studio-7`). Der Durchlauf liest den Schlüssel jetzt ab, statt
ihn zu raten.

## Der Durchlauf

`tests/test-erwaehnungen.js` — 20 Prüfungen, davon **vier Gegenproben**,
weil sonst „hebt hervor" nur hieße „setzt irgendwo ein span":

* ein Text **ohne** `@` bekommt keine Markierung
* `@Niemand Da` bleibt schlichter Text — sonst würde jedes `@Wort`
  eingefärbt
* die Quelltext-Regel schlägt bei einer künstlich vergessenen Stelle
  auch wirklich an — und zwar mit **derselben Funktion**, die den echten
  Quelltext prüft, nicht mit einer nachgebauten
* die Regel sieht überhaupt Stellen (zehn)

Die Markierung wird **an der Randfarbe** nachgemessen, nicht am
Klassennamen: eine Klasse, die dransteht und nichts ändert, wäre sonst
grün.

---

# 63 · Reaktionen — und die Regel, die schon vorher zu schwach war

## Der Anlass

Reagieren war, wie die Erwähnung vorher, eine reine Chat-Sache. Am
Schwarzen Brett und an den Aushängen der Leitung gab es keinen Weg, auf
etwas zu antworten, ausser einen eigenen Beitrag zu schreiben. Für
*„gesehen, finde ich gut"* ist das zu viel Aufwand — also passiert es
nicht, und der Verfasser hört nie etwas.

## Der Fund, der wichtiger war als das Feature

Reagieren heisst, in ein Dokument zu schreiben, das jemand anderem
gehört. Am Brett stand `allow update: if false` — das musste aufgehen.
Beim Nachsehen, wie der Chat es macht, stand dort:

```
affectedKeys().hasOnly(['reactions'])
```

Das Feld durfte angefasst werden, sein **Inhalt aber beliebig**. Jeder
Eingeloggte konnte damit

* die Reaktionen aller anderen löschen,
* eine fremde Kennung eintragen (*„Anna hat das mit ❤️ versehen"*),
* ein beliebiges Zeichen setzen,
* eine beliebig grosse Liste hineinschreiben.

Keiner dieser Fälle sieht hinterher nach einem Angriff aus. Er sieht aus
wie eine gewöhnliche Reaktion — genau deshalb fällt er nicht auf.

Zu verschmerzen war das, solange es **eine** Stelle war. Mit Brett und
Aushängen wären es drei geworden. **Eine schwache Regel, die man dreimal
kopiert, bleibt.** Also einmal richtig: `nurEigeneReaktion()` in
`firestore.rules`, benutzt von allen dreien, in beiden Welten (flach und
unter `firmen/`).

Der Kern ist eine einzige Idee: auf beiden Seiten die eigene Kennung
entfernen und dann vergleichen. Was danach noch verschieden ist, gehört
jemand anderem.

## Grün aus dem falschen Grund

Der erste Durchlauf war 40 von 40 grün — und eine Zeile davon log.
*„Eine riesige Liste geht NICHT"* fiel nur, weil dabei nebenbei die
Reaktion eines anderen verschwand. Eine riesige Liste aus **lauter
eigenen Kennungen in einem neuen Zeichen** hätte durchgehen müssen.

Im Emulator nachgemessen statt angenommen:

```
LOCH OFFEN: 4000 eigene Kennungen sind durchgegangen
```

`removeAll()` streicht **alle** Vorkommen — Dubletten der eigenen
Kennung sind für den Vergleich unsichtbar. Ein Dokument darf 1 MB gross
sein; wer es vollschreibt, macht es unbrauchbar, und bezahlt wird es vom
Betreiber.

Die Regel hat jetzt eine zweite Zeile: das Entfernen der eigenen Kennung
darf die Liste um **höchstens einen** Eintrag kürzen. Dazu die
Gegenprobe, dass *einmal* die eigene Kennung im selben Zeichen weiterhin
geht — sonst hiesse die Zeile nur „lange Listen sind verboten"; verboten
ist die Dublette.

## Die Oberfläche: eine Funktion, nicht drei

`reactionsHTML(m, art)` und `toggleReaction(mid, e, art)` bedienen alle
drei Orte. Die Sorte fährt am Knopf mit (`data-rtyp`). Drei Kopien wären
der naheliegende Weg gewesen — und drei Kopien laufen auseinander,
sobald eine davon einen Sonderfall bekommt. Genau das war bei den
Erwähnungen eine Runde vorher der Fund.

Im Chat kommt der Zeichenwähler über das Nachrichtenblatt (langer
Druck). Brett und Aushang haben kein Blatt; dort steht ein gedämpftes
`+` in der Zeile, das die sechs Zeichen aufklappt. Es steht **immer**
da, auch ohne eine einzige Reaktion — sonst gäbe es keinen Weg, die
erste zu setzen.

## Nicht dabei: die Übergabe

Eine Übergabe ist betrieblich, gilt 24 Stunden und geht von einer
Schicht an die nächste. Ein 🎉 darunter ist Lärm, kein Signal. Weggelassen
mit Grund, nicht vergessen.

## Prüfungen

| Wo | Was |
|---|---|
| `tests/rules/reaktionen.test.js` | **46 Fälle im Emulator**, an allen drei Orten dieselben: fremde Reaktion löschen, alles wegwischen, fremde Kennung eintragen, fremdes Zeichen, 4000 Dubletten, Text nebenbei ändern, wartendes Konto, anonym, fremde Firma |
| `tests/test-reaktionen.js` | **25 Prüfungen im Browser**: steht der Weg da, und schreibt er das, was die Regel durchlässt |

Das ist keine Doppelung, sondern die andere Richtung. Eine Oberfläche,
die etwas schreibt, das die Regel abweist, ist ein Knopf, der nichts tut
— und das merkt man erst im Betrieb.

Dazu vier Zeilen, die es sonst nicht gäbe: das `+` trägt Text und fällt
deshalb durch `test-knoepfe.js`, das nur Nur-Symbol-Knöpfe misst. Also
hier von Hand nachgemessen — gleiche Höhe, eine Linie, in der Flucht des
Textes darüber, kein Überlauf.

Und drei Runden, die prüfen, was **nicht** aufgehen durfte: das Brett
bleibt unbearbeitbar (auch für den Verfasser, auch für den Chef), und
der Gelesen-Haken am Aushang funktioniert weiterhin — er lief bisher
über dieselbe Zeile.

---

# 64 · Aus einem Fund wurde eine Klasse

## Wie es anfing

Runde 63 hat an den Reaktionen eine schwache Regel gefunden:
`hasOnly(['reactions'])` liess das Feld anfassen, seinen Inhalt aber
beliebig. Beim Weiterbauen stand die naheliegende Frage im Raum —
**Einzelfall oder Bauart?**

Es war die Bauart. Zwei weitere Stellen, beide seit Monaten live, beide
nach demselben Muster.

## Zweitens: Umfragen

Eine Zeile neben den Reaktionen stand für das Abstimmen dasselbe:
`hasOnly(['votes'])`. Im Emulator nachgemessen, **bevor** eine Zeile
Regel geschrieben wurde:

```
DURCHGEGANGEN: fremde Stimmen umdrehen (2:1 Ja -> 0:3 Nein)
DURCHGEGANGEN: alle Stimmen loeschen
DURCHGEGANGEN: Stimme fuer eine Antwort, die es nicht gibt (99)
DURCHGEGANGEN: Stimme als Text statt Zahl
```

Eine Reaktion ist Geschmack. **Eine Umfrage entscheidet etwas.**
„Samstag öffnen?" von 2:1 Ja auf 0:3 Nein zu drehen sieht man dem
Ergebnis hinterher nicht an, und es gibt keine zweite Aufzeichnung, an
der es auffallen würde.

`votes` ist nach Kennung geschlüsselt (`{uid: antwortNr}`), deshalb hier
`diff()` auf der Karte selbst statt des `removeAll`-Umwegs von den
Reaktionen: *„höchstens der eigene Schlüssel darf sich unterscheiden"*
ist genau die Aussage, die gebraucht wird.

Dazu zwei Dinge, die vorher niemand prüfte: die Antwortnummer muss eine
**Zahl sein, die es wirklich gibt**, und ohne Umfrage im Dokument
entsteht gar kein `votes`-Feld — sonst liesse sich an jeder Nachricht
eins anlegen.

Und ein Fall, der beim Schreiben der Regel erst auffiel: wer die
**Antworten nachträglich umschreibt**, dreht das Ergebnis, ohne eine
einzige Stimme anzufassen. Aus „Ja" wird „Nein", und die 2 steht
plötzlich woanders. Auch das geht jetzt nicht mehr — auch nicht für den
Verfasser.

## Drittens: der Gelesen-Haken

Die dritte Liste, die jeder anfassen darf. Auch dort ging alles durch:
fremde als gelesen eintragen, fremde Haken löschen, 4000 Dubletten.

Der wiegt schwerer, als er aussieht. Die Oberfläche zeigt der Leitung
mit Namen, **wer eine Pflichtinfo noch nicht gesehen hat**. Einen fremden
Haken zu setzen heisst, jemanden aus dieser Liste zu nehmen, ohne dass er
die Info je gesehen hat. Genau der Zweck der Funktion.

## Eine Aussage, drei Benutzer

Die Kernaussage steht jetzt einmal da:

```
nurMeineKennung(alt, neu)
```

*Nur die eigene Kennung darf sich bewegt haben, und sie darf höchstens
einmal dastehen.* Benutzt von den Reaktionen (über `gleichOhneMich`) und
vom Gelesen-Haken. Drei Fassungen derselben Überlegung wären drei
Gelegenheiten, eine davon zu vergessen — und genau so ist dieser ganze
Fund überhaupt entstanden.

## Prüfungen

* `tests/rules/umfragen.test.js` neu — **24 Fälle**, davon 5 zum
  Gelesen-Haken
* Alle Regeltests zusammen: **678 bestanden · 0 gefallen**
* Zu jeder Sperre die Gegenprobe, dass der richtige Weg noch geht:
  abstimmen so, **wie `votePoll()` wirklich schreibt** (`votes.<uid>`,
  nicht die ganze Karte); der Verfasser ändert seine eigene Stimme; die
  Leitung darf den Aushang weiterhin bearbeiten. Ohne die drei wäre eine
  Regel, die alles verbietet, die beste gewesen.
* An der Oberfläche war **nichts zu ändern** — die App schrieb schon
  immer nur den eigenen Schlüssel. Die Lücke war ausschliesslich die
  Regel, und genau darum fiel sie im Betrieb nie auf.

---

# 65 · Die Umfrage am Schwarzen Brett

## Warum sie dorthin gehört

Eine Umfrage gab es bisher nur im Chat. Dort ist sie nach zwanzig
Nachrichten weg — und zwar genau bei der Sorte Frage, die tagelang offen
bleibt: *„Wer kann Samstag früh?"*, *„Welche Öffnungszeiten wollen wir?"*.
Am Brett steht sie, bis sie beantwortet ist.

Das war der Auslöser für die letzten beiden Runden und ist zweimal von
dem überholt worden, was beim Nachsehen darunter zum Vorschein kam.
Jetzt steht sie.

## Ein Dialog, zwei Ziele

Der Umfrage-Dialog gibt es weiterhin **einmal**. `openPoll(art)` merkt
sich das Ziel in `_pollZiel` — und zwar dort und nicht am Knopf, weil
zwischen Aufmachen und Senden mehrere Klicks liegen. `pollHTML(m, art)`
und `votePoll(id, i, art)` bedienen beide Orte.

Dieselbe Entscheidung wie bei den Reaktionen, aus demselben Grund: zwei
Kopien laufen auseinander, sobald eine davon einen Sonderfall bekommt.

Der Hinweis im Dialog und die Aufschrift des Sendeknopfs sagen, **wo**
die Umfrage landet. Ohne das ist der Dialog an beiden Orten derselbe,
und man weiss beim Senden nicht mehr, welchen Knopf man vorhin gedrückt
hat.

## Die Regel war die halbe Arbeit

Am Brett stand `allow update` nur für `nurEigeneReaktion()` offen.
Abstimmen ist derselbe Schreibvorgang in ein fremdes Dokument und
braucht denselben Beweis — jetzt `nurEigeneReaktion() || nurEigeneStimme()`,
beides dieselben Funktionen wie im Chat.

Acht neue Fälle im Emulator, darunter die zwei, auf die es ankommt: die
**Frage lässt sich nachträglich nicht umschreiben** (auch nicht vom
Verfasser — sonst dreht man das Ergebnis, ohne eine Stimme anzufassen),
und **Reagieren geht weiterhin**. Die Regel ist jetzt ein ODER aus zwei
Funktionen; ein Klammerfehler hätte still die eine oder die andere
ausgeschaltet.

## Ein Knopf, der 252 Pixel zu breit war

Der erste Anlauf gab dem Umfrage-Knopf `width:100%`. Nachgemessen war er
damit **252px breiter als „Anpinnen"** — die Nebenhandlung hätte lauter
geschrien als die Haupthandlung.

Jetzt stehen beide in Inhaltsbreite nebeneinander, nach dem Muster, das
im Projekt schon existiert (`Eintragen / Abbrechen`). Kein eigenes
erfunden, wo eines da war.

`test-knoepfe.js` misst nur Nur-Symbol-Knöpfe; dieser trägt Symbol UND
Text und fällt dort durch. Also im eigenen Durchlauf nachgemessen:
gleiche Höhe, eine Zeile, **genau ein Symbol** (die Falle vom August,
als 22 Knöpfe ihr Zeichen doppelt zeichneten), kein Überlauf bei 430px.

## Eine Kleinigkeit mit sichtbarer Wirkung

Eine Umfrage hat keinen Text — die Frage steht in der Umfrage. Ohne eine
Abfrage in `renderBoard` stünde darüber ein **leerer Absatz**, der die
Frage sichtbar nach unten schiebt. Wird geprüft, und zwar gegen einen
gewöhnlichen Aushang, der seinen Textabsatz behalten muss.

## Prüfungen

* `tests/test-brett-umfrage.js` neu — **23 Prüfungen**
* `tests/rules/umfragen.test.js` um 8 Fälle am Brett erweitert
* Alle Regeltests zusammen: **686 bestanden · 0 gefallen**
* Eine Gegenprobe, die leicht zu vergessen wäre: **das Ziel darf nicht
  kleben.** Wer nach einer Brett-Umfrage im Chat eine stellt, muss sie im
  Chat bekommen — sonst landet sie stillschweigend am falschen Ort, und
  das merkt man erst, wenn jemand danach fragt.

## Nachtrag zu 65 · Der rote Durchlauf hatte recht, aber nicht mit dem, was er sagte

Die volle Regression war **94 grün · 1 rot**: `test-erwaehnungen`, mit
der Meldung *„Schwarzes Brett: mentions wird beim Anlegen nicht
mitgeschrieben"*. Der Aushang war in Ordnung. Gemeint war die Umfrage —
und zwar aus zwei Gründen gleichzeitig.

**Erstens die Prüfung selbst.** Sie nahm `quelle.indexOf(...)`, also die
ERSTE Fundstelle von `S('board').add`. Bis gestern gab es genau eine.
Jetzt gibt es zwei, und der Durchlauf sah nur noch die neue. *Eine
Prüfung, die auf die erste Fundstelle zeigt, wandert mit dem Code weg
von dem, was sie bewachen soll.* Sie verlangt jetzt **jede** Stelle und
nennt beim Fehlschlag die Zeilennummern.

**Zweitens ein echter Fund darunter.** Die **Frage** einer Umfrage ist
Menschentext und ging nur durch `esc()`, nicht durch `markMentions()`.
„@Anna Meier kannst du Samstag früh?" war schlichter Text — und das
nicht erst seit gestern, sondern **im Chat, seit es Umfragen gibt**.
Dazu schrieb `sendPoll` gar kein `mentions[]`, weil es aus `text` käme
und der bei einer Umfrage leer ist.

Beides ist jetzt zu, an einer Stelle für beide Orte.

### Warum die Regel es nicht gesehen hat

Sie sucht `linkify(esc(` — jeden Text, in dem auch Verweise erkannt
werden. Die Umfragefrage geht nur durch `esc(`. Auf `esc(` auszuweiten
geht nicht: das steht an hunderten Stellen für Namen, Kennungen und
Zahlen, und **eine Regel mit hundert Ausnahmen prüft nichts mehr.**

Also steht die Grenze jetzt im Durchlauf benannt, und die eine Stelle
wird eigens bewacht: `pollHTML` muss die Frage durch `markMentions`
schicken.

### Und ein Eigentor

Nach dem Einbau schlug die Regel auf einen **Kommentar** an, in dem
`linkify(esc(` als Text vorkam. Eine Regel, um die herum man Kommentare
formulieren muss, erzieht zum Umformulieren statt zum Nachdenken. Sie
blendet Kommentarzeilen jetzt aus — mit Gegenprobe, dass das Ausblenden
nur Kommentare schluckt und keinen Code, sonst wäre sie immer grün.

---

# 66 · Dritte Schicht derselben Klasse — und ein Fund, der nicht mir gehört

## Die Frage, die die Runde ausgelöst hat

Zweimal hintereinander war der wertvollste Fund nicht das Feature,
sondern die Antwort auf *„Einzelfall oder Klasse?"*. Also die Frage zu
Ende gestellt: **an welchen Stellen darf jemand in ein fremdes Dokument
schreiben, und ist dort geprüft, was?**

Fünf Stellen erlauben einem beliebigen aktiven Konto zu schreiben. Zwei
davon waren gravierend.

## Was durchging

Bei Reaktionen, Stimmen und dem Gelesen-Haken war das FELD erlaubt, sein
Inhalt aber beliebig. Hier war noch weniger geprüft:

```
allow update: if istAktiv();
```

Im Emulator nachgemessen, **bevor** eine Zeile Regel geschrieben wurde:

```
DURCHGEGANGEN: Aufgabe in einem FREMDEN Studio umbenennen
DURCHGEGANGEN: fremde Aufgabe auf jemand anderen umschreiben
DURCHGEGANGEN: sich selbst eine WIEDERKEHRENDE Aufgabe geben
DURCHGEGANGEN: fremde Erledigung zuruecknehmen
DURCHGEGANGEN: Putzaufgabe im fremden Studio umbenennen
DURCHGEGANGEN: den TEXT des anderen umschreiben
DURCHGEGANGEN: die Nachricht auf sich selbst umschreiben
```

**Der dritte Fall ist der lehrreichste.** `allow create` verbietet einem
Mitarbeiter ausdrücklich, sich eine wiederkehrende Aufgabe zu geben —
die Bedingung steht dort mit eigenem Kommentar. Anlegen und danach
ändern hat sie schlicht umgangen. *Eine Sperre, die nur beim Anlegen
greift, ist keine Sperre.*

**Die letzten beiden sind die schwersten.** In einer Direktnachricht
konnte der Empfänger den Text des Absenders umschreiben — und mit `uid`
und `name` auch, wer ihn geschrieben haben soll. In einem 1:1-Gespräch
gibt es keine Zeugen: *„das habe ich nie geschrieben"* steht dann gegen
einen Verlauf, der etwas anderes behauptet.

## Die Oberfläche war die ganze Zeit strenger als die Regel

„Bearbeiten", die Frist-Knöpfe, „Löschen" und „Pausieren" stehen in der
App hinter `canManage()`. Nur wusste das niemand ausser der App — und
wer nicht die App benutzt, war an keine davon gebunden.

## Die Feldlisten sind abgelesen, nicht geraten

Für jede erlaubte Feldgruppe gibt es eine Schreibstelle im Client:

| Aufgaben (Mitarbeiter im eigenen Studio) | woher |
|---|---|
| `done, doneBy, doneByUid, doneAt` | abhaken |
| `steps` | Teilschritte |
| `assignedTo, assignedName` | „ich übernehme das" |
| `grund, grundVon, grundAm` | Grund für die Verzögerung |
| `photo, photoBy, photoAt` | Foto anhängen |

Nicht dabei: `title`, `due`, `recurring`, `createdByUid`.

Beim Putzplan sind es fünf Felder (mit Kürzel); Umbenennen und
**Pausieren** bleiben draussen, weil beides in der App hinter `chef`
steht. Bei Direktnachrichten gibt es im Client genau **eine**
Schreibstelle — das Checklisten-Häkchen `items` —, und die alte
Klammerbemerkung *„(z. B. Checklisten-Häkchen)"* nannte sie sogar
schon. Aus dem „z. B." ist jetzt eine Aufzählung geworden.

Dazu: `participants` einer Direktnachricht darf sich beim Mitschreiben
des Verlaufs nicht verändern. Wer einen Dritten hineinschreibt, gibt ihm
das Leserecht auf ein 1:1-Gespräch.

## Die Hälfte, die hier mehr wiegt

Eine zu strenge Regel bricht **still**, bis jemand eine Aufgabe nicht
abhaken kann. Von den 33 Prüfungen sind deshalb 13 Gegenproben: abhaken,
zurücknehmen, Teilschritte, übernehmen, Grund, Foto, der Chef benennt
um, der Leiter in seinem Studio, der Chef pausiert, das Häkchen in der
Direktnachricht, der Verlauf wird mitgeschrieben — auch mit
`participants` in umgekehrter Reihenfolge, weil die Gegenseite das
Gespräch angelegt haben kann.

## Und ein Fund, der nicht dieser Runde gehört

Eine Prüfzeile fiel um, die belegen sollte, dass der Chef der anderen
Firma an eine Aufgabe auf dem **flachen** Pfad nicht herankommt. Er
kommt heran — und nicht nur er.

Nachgemessen liest **jedes aktive Konto einer zweiten Firma**, auch ein
einfacher Mitarbeiter, auf den flachen Pfaden Aufgaben, Chat, Brett,
Ankündigungen, Übergaben, Dokumente und Dienstplan.

`OFFEN.md` kennt das — aber enger: dort steht es zu `appointments` und
den beiden Nachbarseiten. Der Umfang ist jetzt dort richtig notiert,
mitsamt der Reihenfolge, in der es zu lösen ist.

**Nicht in dieser Runde behoben, und zwar mit Grund.** Der naheliegende
Schutz hängt daran, was in den echten Konten im Feld `firma` steht.
Steht dort schon überall die Kennung des bestehenden Betriebs, sperrt
eine Prüfung auf „leer" den **laufenden Betrieb aus seinen eigenen Daten
aus**. Das lässt sich von hier aus nicht messen, und es ist keine Regel,
die man auf Verdacht ausrollt.

Es als bestandene Prüfung zu behaupten wäre die Sorte Grün, gegen die
dieses Projekt anschreibt. Also steht es als Fund da, nicht als Haken.

Warum es so lange unbemerkt blieb: `kreuz.test.js` deckt
zweiunddreissig Sammlungen ab — **alle im Firmen-Zweig**. Der flache
Zweig daneben war nie Gegenstand.

## Prüfungen

* `tests/rules/fremde-felder.test.js` neu — **33 Fälle**, davon 13 Gegenproben
* Alle Regeltests zusammen: **719 bestanden · 0 gefallen**
* An der Oberfläche war **nichts** zu ändern: die App schrieb schon
  immer nur diese Felder. Die Lücke war ausschliesslich die Regel.

---

# 67 · Statt auf die Zahl zu warten, das Werkzeug dafür bauen

Runde 66 endete mit einem Fund, den ich **nicht** beheben konnte: auf den
flachen Pfaden liest jedes Konto einer zweiten Firma den Kernbestand mit.
Der naheliegende Schutz — flache Regeln nur für Konten der
Voreinstellung — hängt an einer Zahl, die ich von hier aus nicht messen
kann: **wie viele Konten tragen schon ein Feld `firma`, und mit welchem
Wert?** Ist es jedes, sperrt eine Prüfung auf „leer" den laufenden
Betrieb aus seinen eigenen Daten aus.

Darauf zu warten wäre bequem. Besser ist, den Weg zur Antwort zu bauen.

## Zwei Auszählungen in `tools/konten-pruefen.js`

Das Werkzeug gibt es längst, es **liest nur** und darf deshalb gegen das
echte Projekt laufen. Es kannte das Feld `firma` bisher gar nicht.

| | |
|---|---|
| **FIRMEN-ZUORDNUNG** | wie viele Profile mit welcher Kennung, wie viele mit leerem Feld, wie viele ganz ohne — plus die Zusammenfassung „x ohne, y mit" |
| **WO LIEGEN DIE DATEN** | je Sammlung: wie viele Dokumente noch flach, wie viele unter `firmen/<k>/…` |

Die zweite beantwortet die andere Hälfte der Entscheidung: **stehen die
flachen Spalten auf 0, ist der flache Regelsatz entbehrlich** — das ist
der einfachere der beiden Wege und macht die Regel-Frage gegenstandslos.

Gezählt wird mit `count()`, nicht durch Herunterladen. Bei 13 Studios
und Monaten an Verlauf wäre das sonst teuer, und wir wollen hier gar
nichts sehen, nur zählen.

## Ein Werkzeug, das falsch zählt, ist schlimmer als keins

Es sähe plausibel aus und führte zur falschen Entscheidung — bei einer
Entscheidung, die man nur einmal falsch treffen muss. Also läuft das
**echte Werkzeug als eigener Prozess gegen den Emulator**, so wie
`umzug.test.js` es für den Umzug tut.

Die Ausgangslage ist mit Absicht gemischt: Profile mit Kennung, ohne
Feld, mit leerem Feld, aus einer zweiten Firma; Daten flach **und**
unter `firmen/`. Eine Zählung, die nur einen Fall kennt, lässt sich
nicht von einer kaputten unterscheiden.

Dazu zwei Gegenproben (ein Profil mehr, ein Brett-Eintrag mehr — gehen
die Zahlen mit?) und die wichtigste Zusicherung: **das Werkzeug hat
nichts geschrieben.** Genau das ist der Grund, aus dem es an die echte
Datenbank darf.

## Und ein Fehler in meiner eigenen Prüfung

Einzeln gelaufen war der neue Durchlauf 19/19 grün. Im Gesamtlauf fielen
vier Zeilen um: alle Regeltests teilen sich dasselbe Emulator-Projekt,
und `users` und `board` trugen noch die Reste der vorherigen.

Das ist die schlimmere Sorte Fehler — **grün, solange man ihn einzeln
laufen lässt.** Wer absolute Zahlen prüft, muss die Ausgangslage selbst
herstellen; die anderen Durchläufe tun das über `env.clearFirestore()`,
dieser über den Aufräum-Endpunkt des Emulators.

## Prüfungen

* `tests/rules/konten-pruefen.test.js` neu — **19 Fälle**, davon 2 Gegenproben
* Alle Regeltests zusammen: **738 bestanden · 0 gefallen**

## Was jetzt zu tun ist

```
node tools/konten-pruefen.js --projekt formenchat
```

Liest nur. Die zwei neuen Abschnitte beantworten die Frage aus Runde 66;
danach ist die Firmengrenze auf den flachen Pfaden eine halbe Sitzung.

---

# 68 · Eine Sortierung für die ganze App

## Der Auftrag

*„Ich möchte, dass man beim Putzplan oder bei den Aufgaben oder bei den
Materialien nach täglich und wöchentlich sortieren kann, und auch nach
Dringlichkeit, was der Chef dann angibt, und dass man die Materialliste
zum Beispiel nach Alphabet sortieren kann — und lass uns dieses ganze
Prinzip mal in der ganzen App verteilen."*

## Erst nachgesehen, was es schon gibt

| Ansicht | Sortierung | merkt sie sich? |
|---|---|---|
| Dokumente, Geräte, Nachweise | Chips (`sortLeiste`) | ja, in `PREFS.sort` |
| Aufgaben | eigenes Auswahlfeld | **nein** |
| Putzplan, Material | — | — |

**Drei Bauarten für dieselbe Sache**, und die Aufgaben vergassen die
Wahl nach jedem Neuladen — sie stand in einer blossen Variablen. Genau
das ist die „generelle Organisation", nach der gefragt war.

`sortFeld()` ist jetzt die eine Bauart für Werkzeugzeilen: ein schmales
Auswahlfeld, das neben Suche und Filtern Platz hat, mit **derselben
Ablage wie die Chips**. Die Chips bleiben, wo sie eine eigene Zeile
haben — dort sind sie einen Griff schneller, und sie umzubauen wäre
Bewegung ohne Gewinn. Was zählt, ist nicht die Form, sondern dass es
**eine** Ablage gibt.

## Die gefährlichste Stelle war das Material

Dort ist der Listenindex die **Kennung**: die Eingabefelder tragen
`data-idx`, geschrieben wird mit `_matItems[idx]`. Wer die Liste
umsortiert, schreibt getippte Zahlen ins falsche Material — und zwar
**lautlos**, weil die Zeile richtig aussieht.

Deshalb wird eine Kopie sortiert, die ihren ursprünglichen Index
mitführt; `_matItems` selbst bleibt unberührt. Der Durchlauf misst genau
das: nach dem Sortieren muss jede Zeile ihre alte Kennung tragen — plus
die Gegenprobe, dass die Kennungen danach **nicht** mehr der Reihe nach
stehen, sonst hätte gar keine Sortierung stattgefunden.

## Ein geratener Wert, der nichts getan hätte

Für „nach Rhythmus" standen im ersten Anlauf deutsche Werte
(`taeglich`, `woechentlich`) und ein `monatlich`, das es gar nicht gibt.
Im Datenbestand heissen sie **`daily`, `weekly`, `custom`** und leer für
einmalig. Die Sortierung hätte alles auf denselben Rang gelegt und damit
nichts getan — und **wenn sie nichts tut, fällt sie nicht auf**.
Nachgelesen in `#ppRepeat`, statt es stehen zu lassen.

Täglich steht vor wöchentlich, weil das die Reihenfolge ist, in der man
sie abarbeitet. Alphabetisch wäre es genau verkehrt herum. Ein eigenes
Intervall wird nach seiner **Länge** einsortiert: „alle 2 Tage" gehört
neben täglich, nicht hinter einmalig.

## Dringlichkeit — drei Stufen, eine Skala

`hoch` · normal · `niedrig`, dieselbe Skala für Aufgaben **und**
Putzplan. Zwei Skalen wären zwei Sprachen für dieselbe Frage. Fünf
Stufen wären zwei, die niemand benutzt und die trotzdem jedes Mal zu
wählen sind.

**„Normal" trägt keine Marke.** Trägt jede Zeile eine, fällt keine mehr
auf — angezeigt wird nur, was vom Normalfall abweicht.

In jeder Sortierung bleiben erledigte Punkte unten, auch wenn sie
„dringend" tragen: **eine abgehakte Aufgabe ist nicht mehr dringend.**

## Und ein Ertrag aus Runde 66

Dass die Dringlichkeit Chefsache ist, kostete **keine Zeile Regel**. Die
Feldgrenze aus Runde 66 lässt einem Mitarbeiter nur die dort benannten
Felder, und `prio` steht nicht darunter. Im Emulator nachgemessen:

```
gesperrt:      Mitarbeiter setzt prio an einer Aufgabe
gesperrt:      Mitarbeiter setzt prio im Putzplan
DURCHGEGANGEN: GEGENPROBE Chef setzt prio an einer Aufgabe
DURCHGEGANGEN: GEGENPROBE Chef setzt prio im Putzplan
```

Ein neues Feld ist damit von sich aus sicher, statt es einzeln
nachzuziehen. Das ist der Zins auf die Sicherheitsrunden.

## Prüfungen

* `tests/test-sortierung.js` neu — **16 Prüfungen**, davon 3 Gegenproben
* `test-quer` grün — die neuen Felder sitzen in den ohnehin scrollbaren
  Werkzeugzeilen und schieben nichts aus dem Bild
* `test-gestaltung` · `test-knoepfe` grün

Sieben Zeilen des Durchlaufs waren beim ersten Lauf rot — **alle sieben
mein Auslesen, nicht die App**: der Titel steht in `.pp-title` vor den
Marken (`textContent` nahm sie mit), und die Materialtabelle ist ein
Raster aus `.mat-row`, kein `<tr>`. Nachgelesen im Quelltext, statt die
Erwartung anzupassen.

## Nachtrag zu 68 · Eine Regel, die für ein einziges Feld geschrieben war

Die Regression war **95 grün · 1 rot**: `test-rahmen`, mit
*„Material: der Inhalt beginnt erst bei 584px"*. Die Grenze liegt bei
580, und der Durchlauf hatte recht.

Ursache war eine Zeile, die niemand angefasst hatte:

```css
.mat-bar select{flex:1;min-width:160px}
```

Geschrieben für das **eine** Auswahlfeld, das dort stand (Studio). Als
das Sortierfeld dazukam, erbte es `flex:1` und 160px Mindestbreite.
Zusammen 444px auf 396px Platz — die Zeile brach um, wurde 79 statt
50 Pixel hoch, und der Inhalt begann 34 Pixel tiefer.

**Das ist die Sorte Nebenwirkung, die man nicht sieht.** Die Sortierung
funktionierte tadellos; kaputt war etwas drei Bildschirmzeilen darüber.
Ohne `test-rahmen` wäre es niemandem aufgefallen, bis jemand sich
gewundert hätte, warum das Material so weit unten anfängt.

Behoben, indem die Regel auf das Feld eingeengt wurde, für das sie
gedacht war (`.mat-bar #matStudio`), und der Platz **gerechnet** statt
geschätzt: 396px stehen zur Verfügung, Suche nimmt 48, der Zähler 68,
die Lücken 30 — bleiben rund 250 für Studio und Sortierung zusammen.
Deshalb kurze Wörter im Materialfeld („Liste", „A–Z", „Fehlt",
„Wenig da") und eine Höchstbreite, statt es auf Kante zu setzen.

Ergebnis: der Inhalt beginnt jetzt bei **555px** — schlanker als die
607, mit denen die Prüfung ursprünglich eingeführt wurde, und schlanker
als vor dieser Runde.

---

# 69 · Filtern über Knöpfe — und warum es eine zweite Gruppe braucht

## Der Auftrag

*„Kannst du bitte auch machen, dass man zum Beispiel nur tägliche
anzeigen kann, und so mit den Knöpfen."*

## Die Entscheidung, die dahintersteckt

Die vorhandenen Knöpfe — *Alle · Nur offene · Pausiert* — sind **eine
Auswahl**: einer ist an, die anderen aus. Rhythmus und Dringlichkeit
naiv dazuzustellen hätte bedeutet, dass „nur offene" und „nur tägliche"
sich gegenseitig aufheben. Genau die Kombination ist aber die
interessante: *welche täglichen Punkte sind heute noch offen?*

Also eine **zweite, unabhängige Gruppe**, durch einen Strich getrennt
und mit UND verknüpft:

```
Alle · Nur offene · Pausiert  │  Täglich · Wöchentlich · Dringend
```

Der Strich ist kein Schmuck. Ohne ihn sieht die Zeile aus wie eine
einzige Auswahl, und niemand probiert, zwei davon zusammen zu benutzen.

**Schalter, keine Auswahl.** Nochmal antippen macht sie wieder aus —
ein Filter, den man nicht loswird, ist eine Falle: man müsste die Seite
neu laden. Zwei Rhythmen zugleich gibt es dagegen nicht, eine Aufgabe
hat genau einen; dort löst der zweite Klick den ersten ab.

Bei den Aufgaben dieselbe Bauart mit *Dringend*. Beim Material gab es
den Gedanken schon — „nur was fehlt" ist genau das.

## Zwei Funde, die keine waren

Der erste Durchlauf sah nach zwei Fehlern aus. Beide waren meine
Messung:

**„Täglich fertig" blieb bei „Nur offene" stehen.** `isDone()` verlangt
für eine tägliche Aufgabe `doneAt >= heute` — sie setzt sich täglich
zurück. Mein Prüfdatum stand auf `5`, also 1970. Die Zeile galt damit
**zu Recht** wieder als offen.

**„Wöchentlich" lieferte nichts.** Weil „Dringend" aus dem Schritt davor
noch an war. Auch richtig.

Und eine dritte Zeile war rot, weil ich eine **Reihenfolge** verglich,
wo es um die **Menge** ging: die Sortierung stand noch auf
„Dringlichkeit". Verglichen wird jetzt als Menge — die Reihenfolge ist
im Abschnitt darüber geprüft.

## Prüfungen

* `tests/test-sortierung.js` erweitert — jetzt **25 Prüfungen** (sortieren
  und filtern), davon 5 Gegenproben
* `test-knoepfe` · `test-gestaltung` · `test-quer` · `test-rahmen` grün —
  die neuen Knöpfe sitzen in der ohnehin scrollbaren Werkzeugzeile und
  schieben nichts aus dem Bild

## Nachtrag zu 69 · Drei Fragen, drei Gruppen

Aus der Rückmeldung, mit Bildschirmfoto: *„kannst du nur noch die
Trennung deutlicher machen — dieser Strich zwischen Pausiert und
Täglich müsste auch noch zwischen Wöchentlich und Dringend."*

Zu Recht, und zwar aus zwei Gründen:

**Es sind drei Fragen, nicht zwei.** Zustand (*Alle · Nur offene ·
Pausiert*), Rhythmus (*Täglich · Wöchentlich*) und Dringlichkeit
(*Dringend*). Rhythmus ist eine Auswahl innerhalb der Gruppe — eine
Aufgabe hat genau einen —, Dringlichkeit ein Schalter. Sie in eine
Gruppe zu stecken behauptet eine Verwandtschaft, die es nicht gibt.

**Und ein Trenner, den man nicht sieht, trennt nichts.** 1px in
`--line-2` war auf dem Handy nicht vom Abstand zwischen den Knöpfen zu
unterscheiden. Jetzt 2px und mehr Luft links und rechts als zwischen den
Knöpfen selbst — die Gruppen fallen dadurch auch über den **Abstand**
auseinander, nicht nur über den Strich.

`--line-3` gibt es nicht; die Leiter hat nur `--line` und `--line-2`,
und der Kommentar an der Stelle sagt, dass `--line-2` der kräftige ist.
Also den vorhandenen Ton doppelt so breit, statt einen neuen zu
erfinden.

```
Alle · Nur offene · Pausiert │ Täglich · Wöchentlich │ Dringend
```

Drei neue Prüfungen halten es fest: dass es **zwei** Striche sind, wo
sie stehen, und dass sie breit genug sind, um aufzufallen. Ohne die
letzte könnte jemand die Breite zurückdrehen und der Durchlauf bliebe
grün.

---

# 70 · Der Kalender, den niemand einrichten muss

Aus dem Gespräch über Anbindungen: *„lohn export klingt interessant …
und das mit dem calender sync klingt auch mega."* → **„mach den
kalender."**

## Warum ein Abo-Link und keine Kalender-Anbindung

Der naheliegende Weg wäre gewesen, sich mit Google Kalender zu
verbinden: OAuth, Zustimmungsfenster, Termine per API schreiben. Das
hätte drei Nachteile, von denen jeder für sich reicht:

* Es gälte **nur für Google**. Wer ein iPhone hat, hätte nichts davon.
* Jeder müsste **sein Konto verbinden** — ein Zustimmungsfenster mit
  „StudioChat möchte auf Ihren Kalender zugreifen“, und danach hätten
  wir Schreibrechte auf dem privaten Kalender eines Mitarbeiters. Die
  will ich gar nicht haben.
* Wir müssten **jede Änderung nachziehen**. Schicht getauscht, Urlaub
  genehmigt, Krankmeldung — jedes Mal ein Schreibvorgang, und jeder
  kann schiefgehen, ohne dass es jemand merkt.

Ein **ICS-Abo** dreht die Richtung um. Der Kalender fragt bei uns nach,
nicht umgekehrt. Google, Apple und Outlook können das alle, seit
Jahren, mit derselben Adresse. Wir schreiben nirgendwo hin, wir
antworten nur. Und wenn sich eine Schicht ändert, ändert sich beim
nächsten Nachfragen die Antwort — es gibt nichts nachzuziehen.

Der Preis, ehrlich benannt: **wie oft nachgefragt wird, entscheidet der
Kalender selbst.** Bei Google sind das oft ein paar Stunden. Das steht
auch so in der App, direkt unter dem Link — eine Zusage „sofort“, die
wir nicht halten können, wäre schlechter als die Wahrheit.

## Wo das Geheimnis liegt, und warum genau dort

Der Link ist ein Dauerschlüssel: wer ihn hat, sieht die Schichten, ohne
sich anzumelden. Anders geht es nicht — ein Kalender meldet sich nicht
an. Also ist die einzige Frage, **wer an den Schlüssel kommt.**

Der bequeme Platz wäre `users/<uid>` gewesen — das Profil, das ohnehin
schon geladen ist. Genau dort darf er nicht liegen: das Profil ist für
**jeden aktiven Kollegen lesbar**. Der Schlüssel läge damit für die
ganze Firma offen, und der ganze Aufwand wäre umsonst.

Er liegt deshalb in `privat/<uid>` — dieselbe Stelle, an der schon der
Gelesen-Stand steht, und die einzige, die nur der Besitzer liest und
schreibt. **Nicht behauptet, sondern gemessen:**

```
── Kommt jemand an Annas Kalender-Geheimnis? ──
gesperrt:      Kollege liest privat/anna
gesperrt:      CHEF liest privat/anna
gesperrt:      Kollege ueberschreibt es
── Gegenprobe ──
DURCHGEGANGEN: Anna selbst liest es
DURCHGEGANGEN: Anna selbst setzt es
```

Auch der Chef nicht. Das ist kein Versehen, sondern der Punkt: der
Schlüssel öffnet einen Kalender ohne Anmeldung, und niemand ausser dem
Besitzer soll ihn weitergeben können.

Der Zufall kommt aus `crypto.getRandomValues`, nicht aus
`Math.random` — 24 Byte, 48 Hex-Zeichen. Für eine Avatar-Farbe reicht
`Math.random`, für einen Schlüssel nicht.

`firestore.rules` musste dafür **nicht angefasst** werden. `privat/{uid}`
war in beiden Welten schon besitzergebunden. Eine Regel, die man für ein
neues Feld nicht ändern muss, ist eine, die von vornherein die richtige
Frage gestellt hat.

## Fünfmal dieselbe Absage

Die Funktion weist auf fünf Wegen ab — falsches Geheimnis, fremdes
Geheimnis, gar keins, keine Kennung, Kennung gibt es nicht — und sagt
**jedes Mal denselben Satz**: „Dieser Kalender-Link gilt nicht (mehr).“

Unterschiedliche Absagen wären ein Verzeichnis: „gibt es nicht“ gegen
„falsches Geheimnis“ verrät, welche uid existiert. Der Vergleich läuft
über `crypto.timingSafeEqual`, damit auch die **Dauer** der Absage
nichts verrät. Ein eigener Durchlauf prüft, dass die fünf Antworten
zeichengleich sind — sonst schleicht sich beim nächsten Umbau eine
gesprächige Fehlermeldung ein.

## Zeitzone: zwei Durchgänge, nicht einer

Schichten stehen als `2026-03-29` + `09:00` in der Datenbank — Ortszeit,
ohne Zone. Ein ICS braucht UTC. Die naive Rechnung „minus eine Stunde“
ist im Sommer falsch, „minus zwei“ im Winter, und **am
Umstellungssonntag ist beides falsch.**

`berlinZuUtc()` rechnet deshalb zweimal: erst den Versatz an der
groben Stelle bestimmen, dann mit dem Ergebnis noch einmal — weil der
Versatz vom Zeitpunkt abhängt, den man gerade erst ausrechnet.
Nachgemessen an Winter (+1), Sommer (+2), dem Umstellungstag selbst und
einer Schicht über Mitternacht.

## Was im Kalender steht — und was mit Absicht nicht

Drin: die eigenen Schichten (28 Tage zurück, 182 voraus), auch die
Aushilfs-Schicht in einem fremden Studio, Urlaub und Krankmeldungen.
Beim Urlaub ist der letzte Tag mitgezählt (`DTEND` = Tag danach, so
will es der Standard — sonst fehlt der letzte Urlaubstag im Kalender).

Nicht drin: **offene Urlaubsanträge.** Ein Antrag ist kein Termin. Stünde
er im Kalender, sähe er aus wie genehmigt, und jemand plant darauf.
Krankmeldungen dagegen gelten sofort — sie brauchen keine Genehmigung.

Und nicht drin: die Schichten der anderen. Der Kalender ist der eigene.

## Zwei Fehler, die der Durchlauf gefunden hat

**Der Knopf hat gelogen.** `withBusy()` stellt am Ende die alte
Beschriftung wieder her — richtig für einen Ladezustand, falsch hier:
aus „Neuen Link erzeugen“ wurde wieder „Link erzeugen“, während der
Link daneben stand. `withBusy` dafür umzubauen hätte dutzende andere
Knöpfe angefasst; dieser eine schaltet sich jetzt selbst.

**Der falsche Dialog wurde zurückgescrollt.** `switchPmTab` griff mit
`document.querySelector('.pm-box')` — das nimmt den **ersten von zehn**.
Solange der Profil-Bereich kurz war, fiel es nicht auf. Jetzt auf
`#profileModal .pm-box` eingegrenzt.

**Und einer, der schweigend falsch gewesen wäre:** die Studionamen
wurden nie aufgelöst. Im Kalender hätte „Schicht · studio-1“ gestanden.

## Die Knopf-Prüfung sah die Hälfte nicht

Aus der stehenden Regel — *„bitte achte auf sowas bei ALLEN Knöpfen
IMMER, bevor es neue gibt“* — lief `test-knoepfe` vor dem Ausliefern.
Grün. Und das war die eigentliche Entdeckung dieser Runde:

**Der Durchlauf ging nur ab, was über die untere Leiste erreichbar
ist.** Dialoge nicht. Die neuen Knöpfe sitzen in den Einstellungen —
sie waren nie gemessen worden. Grün hiess hier „nicht hingesehen“.

Jetzt geht der Durchgang auch die vier Reiter des Einstellungs-Dialogs
ab: **190 Nur-Symbol-Knöpfe statt 165**, davon 25 in Dialogen. Mit einer
Gegenprobe darauf, dass der Dialog überhaupt aufging — ginge der Klick
ins Leere, liefe die Schleife durch und meldete nichts.

Dazu eine vierte Regel, die aus Runde 58 kommt und bisher nur im
Gedächtnis stand: ein Knopf mit `data-ikon`, der schon ein eigenes
`<svg>` trägt, bekommt ein zweites eingesetzt. Damals waren es 22
Stück. Jetzt fällt es beim nächsten Mal von selbst auf.

## Geprüft

* `tests/rules/kalender.test.js` — **23 Prüfungen**, echter Handler
  gegen den Emulator: gültiges ICS, CRLF, die fünf Absagen,
  zurückgezogener Link, deaktiviertes Konto, Maskierung von Komma und
  Semikolon, Faltung auf 75 Byte ohne Mehrbyte-Zeichen zu zerschneiden
* `tests/test-kalender-abo.js` — **22 Prüfungen** im Browser: der Knopf
  sagt die Wahrheit, geschrieben wird nur `privat/<uid>`, zweimal
  drücken gibt zweimal etwas anderes, Zurückziehen räumt auf
* `test-knoepfe` erweitert und grün · `test-gestaltung` grün
* Volle Regression

**Nicht geprüft, und das ist zu sagen:** der Chromium hier kommt nicht
ins Netz. Dass Google Kalender das Abo wirklich frisst, kann erst
jemand mit einem echten Konto bestätigen. Das ICS ist gegen den
Standard geprüft, nicht gegen Google.

## Nachtrag zu 70 · Der Wächter hatte recht, die Regel war zu eng

Nach dem Pushen — und bevor die volle Regression durch war, das war
der Fehler — wurde `regeltest` rot:

```
✗ kalender: prüft einen Geheim-Schlüssel
  — ein onRequest ohne Schlüssel ist eine offene Adresse
```

`tests/test-funktionen-pfade.js` verlangt von **jedem** `onRequest`
einen Schlüssel aus `process.env`. Die Regel stammt aus dem
Sicherheits-Durchgang vom 13.8. und ist gut: eine offene Adresse in den
Functions merkt sonst niemand.

`kalender` hat keinen solchen Schlüssel — und darf keinen haben. Ein
gemeinsamer Schlüssel hiesse: die ganze Firma hängt an einem Geheimnis,
und niemand kann seinen eigenen Link zurückziehen, ohne allen anderen
ihren kaputtzumachen. Das Geheimnis gehört pro Nutzer.

**Der bequeme Fix wäre eine Ausnahmeliste gewesen** — „ausser
kalender". Der hätte diesen einen Lauf grün gemacht und die Prüfung für
jeden künftigen Endpunkt entwertet. Stattdessen kennt die Regel jetzt
die zweite Bauart: ein eigenes Geheimnis, **zeitgleich verglichen**.

Und die neue Bauart ist damit **strenger** als die alte, nicht weicher:
ein `if (gespeichert === tok)` zählt ausdrücklich nicht. Die
Antwortdauer verriete sonst, wie viele Zeichen stimmen, und ein
Schlüssel, den man Zeichen für Zeichen erraten kann, ist keiner. Dazu
eine Prüfung, dass `tokenGleich` auch wirklich `timingSafeEqual`
benutzt — sonst stünde die Regel auf einem Funktionsnamen.

Drei Gegenproben halten es fest: ein `onRequest` ganz ohne Geheimnis
wird erkannt, einer mit `===` wird erkannt, und der alte onCall-Fall
weiterhin auch.

Reproduziert und belegt, nicht behauptet:

```
── mit der ALTEN Prüfung ──   ✗ kalender …   Exit: 1
── mit der NEUEN ──           Exit: 0
```

**Die Lehre ist aber nicht die Regel, sondern der Zeitpunkt.** Der
Durchlauf lief lokal längst — ich habe nur nicht auf ihn gewartet. Ein
Wächter, dessen Ergebnis man nicht abwartet, ist ein Wächter, den man
sich sparen kann.

---

# 71 · Alles mit Frist gehört in den Kalender

*„kannst du noch dafür sorgen das aufgaben und so auch im kalender
eingetragen werden wenn diese ein fälligkeits datum haben"*

Der Kalender aus Runde 70 trug nur Schichten, Urlaub und
Krankmeldungen. Jetzt auch alles, was ein Datum hat, bis zu dem es
fertig sein muss:

* **Studio-Aufgaben** mit Frist
* die **eigenen To-dos** aus dem Ich-Bereich
* **Nachweise**, die ablaufen

## Die eine Frage, die alles entscheidet

**Welche Aufgabe ist meine?** Davon hängt ab, ob der Kalender nützt oder
nach einer Woche ungelesen bleibt. Nimmt man alles mit, stehen in einem
Kalender die offenen Aufgaben aller dreizehn Studios.

Die Frage war schon **zweimal beantwortet**, und beide Male gleich:

* `checkDueReminders()` in der App: *„Nur eigene oder nicht zugewiesene
  Aufgaben melden"*
* `dueTaskReminder` in den Functions: Zugewiesenes an die Person,
  Nichtzugewiesenes ans Studio

Eine dritte Antwort zu erfinden hätte geheißen, dass der Kalender etwas
anderes für wichtig hält als die Erinnerung daneben. Also dieselbe
Regel, wörtlich:

* **zugewiesen → überall**, auch in einem Studio, in dem ich sonst nicht
  stehe (wer aushilft, bekommt dort Aufgaben)
* **nicht zugewiesen → nur in meinen Studios**

## Drei Dinge, die man leicht falsch macht

**Ganztägig, nicht um 23:59.** `due` steht als Zahl auf 23:59:59. Ein
Termin zu dieser Uhrzeit stünde im Kalender *unter* dem Tag statt
darüber — und träfe niemanden mehr, der ihn noch erledigen könnte.

**`TRANSP:TRANSPARENT`.** Eine Frist belegt keine Zeit. Ohne diese Zeile
gilt der ganze Tag als belegt; wer drei Fristen an einem Tag hat, wäre
dreimal den ganzen Tag „beschäftigt".

**Kein VTODO.** Der Standard hat für Aufgaben eine eigene Bauart, und
sie wäre die richtige — aber **Google Kalender zeigt VTODO gar nicht
an**. Ein Eintrag, den der häufigste Kalender stillschweigend
verschluckt, ist schlechter als ein etwas unsauberer, den alle zeigen.

## `erledigt()` statt `done`

Eine **tägliche** Aufgabe ist nur *innerhalb ihres Zeitraums* erledigt.
Ein blosses `t.done` hätte sie nach dem ersten Haken für immer aus dem
Kalender genommen. Die Funktion dafür gab es server-seitig schon
(`erledigt()`), also benutzt statt nachgebaut.

Nachgewiesen mit einer Sonde: `erledigt(x)` durch `x.done` ersetzt →
**2 rote Zeilen**. Grün heisst hier also etwas.

## Ein Schalter, der „aus" hiess und es nicht war

Beim Bauen aufgefallen, nicht gemeldet: `kalenderDaten` fragte **kein
einziges Merkmal** ab. Eine Firma konnte den Schichtplan ausschalten und
bekam ihn über den Abo-Link weiter geliefert. Kein Datenleck — es sind
die eigenen Schichten —, aber der Schalter log.

Jetzt hängen Schichten an `schicht`, Abwesenheiten an `abwesend`,
Aufgaben an `todos`. Die eigenen To-dos **nicht**: die persönliche Liste
hängt nicht am Studio-Schalter. Mit Gegenprobe, dass jeder Schalter nur
trifft, was er heisst.

## Ein Kommentar, den die Sonde widerlegt hat

Ich hatte geschrieben, die naive UTC-Rechnung (`toISOString`) sei „im
Winter falsch". **Stimmt nicht.** Die Sonde zeigte: bei 23:59 Ortszeit
liefern beide denselben Tag (23:59 Berlin = 21:59/22:59 UTC).
Auseinander gehen sie erst **kurz nach Mitternacht**, wo die naive
Rechnung den Vortag nennt.

Und weil `due` heute immer auf 23:59:59 gesetzt wird — beim Anlegen wie
beim Verschieben —, wäre die naive Rechnung **derzeit sogar richtig**.
`berlinDatum()` steht trotzdem da: sie ist nur richtig, *solange*
niemand eine Frist anders setzt. Eine Frist, die einen Tag zu früh im
Kalender steht, fällt niemandem als Fehler auf — man glaubt sie einfach.

Kommentar und Prüfung sagen das jetzt so, statt eine Gefahr zu
behaupten, die es nicht gibt.

## Geprüft

* `tests/rules/kalender.test.js` — von 23 auf **47 Prüfungen**
* Drei Sonden, jede mit ihrem eigenen Rot:
  * Studio-Grenze entfernt → 2 rot
  * `erledigt()` → `done` → 2 rot
  * `berlinDatum` → `toISOString` → 1 rot
* ganze Regelsuite grün (785 Prüfungen) · volle Regression

---

# 72 · Der zweite Schreibtisch

*„können wir den ICH bereich noch so weiter ausbauen das man den auch
täglich nutzen kann ODER wir machen einen exklusiven bereich … für alle
persönlichen sachen, wie todos, kalender, aufgaben, ziele, wünsche"*

Auf Nachfrage: **beides**. *„sodass man es getrennt hat aber es auf der
ich seite dennoch angezeigt wird aber wenn man es bearbeiten will wird
man auf den 2ten schreibtisch weitergeleitet."*

Das ist stimmiger, als es zuerst klingt, und es löst genau die Sorge
auf, die ich gegen einen zweiten Bereich hatte — **zwei Orte für
dieselbe Sache**. Hier gibt es weiter genau *einen* Ort zum Bearbeiten;
der andere zeigt nur.

**Ich = die Brille. Persönlich = die Werkstatt.**

Das sind zwei verschiedene Tätigkeiten. Morgens will man wissen, was
ansteht. Sonntagabend räumt man auf, trägt ein, denkt nach. Sieben
Reiter nebeneinander hätten beides in eine Reihe gezwungen und keins
von beidem gut gemacht.

## Warum kein siebter Knopf — und warum ich trotzdem gemessen habe

Im Code stand aus einer früheren Runde die Begründung, ein sechster
Eintrag rutsche beim Chef aus dem Bild. **Nachgemessen, statt geglaubt:**

| | Chef | Mitarbeiter |
|---|---|---|
| heute @320px | 6/6 im Bild | 5/5 |
| mit einer siebten | **7/7 im Bild** (Inhalt 327px) | 6/6 |

Ein siebter Knopf hätte also gepasst. Gebaut wurde er trotzdem nicht:
**„Betrieb" hält seit jeher sechs Ansichten hinter EINEM Knopf.** Die
Frage „was betrifft mich" braucht keine zwei Einträge in der Leiste,
sondern zwei Reiter. Die Weiterleitung ist damit ein Reiterwechsel und
kein Sprung in eine fremde Gegend.

Der alte Kommentar war also nicht falsch, aber seine Zahlen galten
nicht mehr. Beides steht jetzt so da.

## Was umgezogen ist

**Übersicht** (vorher fünf Reiter, jetzt drei): Woche · Kalender · Ich
**Persönlich** (neu): To-do · Notizen — und später Ziele und Wünsche

Die eigene Aufgabe steht **weiter in der Wochenliste**, zwischen Dienst
und Urlaub, mit ihrer Herkunfts-Markierung. Ein Klick darauf führt
hinüber. Ein Dienst führt bewusst **nicht** weg — der gehört der
Planung, nicht mir.

## Drei Fehler, die die Messung gefunden hat

**`font: inherit` war falsch.** Die Kurzform setzt auch die
Schriftgröße, und zwar auf die des Elternteils. `button.ich-zeile` wiegt
schwerer als `.ich-zeile`, also schlug sie das `font-size:var(--t-sm)`:
**16px statt 13,76px** — die anklickbare Zeile war zwei Punkt größer als
die zwanzig daneben. Jetzt nur die drei Eigenschaften, die der Browser
wirklich anders setzt.

**41,8px sind kein Fingerziel.** Die Zeile als Knopf war zu klein. Nur
den Knopf zu vergrößern hätte genau eine Zeile 2px höher gemacht als
ihre Nachbarn — also `min-height:44px` an *alle* Zeilen. Jetzt sind sie
gleich und groß genug.

**Der Durchlauf stürzte ab, statt zu melden.** `querySelector(...).click()`
auf null wirft, und dann sagt die Ausgabe nur *dass* etwas fehlt, nicht
*was*. Genau dann braucht man die Diagnose.

## Und ein Fehler in meiner Prüfmethode

Die drei Sonden meldeten beim ersten Anlauf **null rote Zeilen** — und
das sah aus wie „die Prüfungen greifen nicht". Der wahre Grund:

**Wer `index.html` ändert, muss `tools/csp.js --setzen` nachziehen.**
Sonst passt der Hash nicht, der Browser sperrt das Skript, und man misst
die Sperre statt der Änderung. Eine Sonde ohne diesen Schritt beweist
gar nichts — und hätte mich beinahe glauben lassen, meine eigenen neuen
Prüfungen seien wertlos.

Mit korrektem Hash:

```
Sonde 1  Weiterleitung entfernt      → 2 rot
Sonde 2  Zeile wieder als div        → 3 rot
Sonde 3  zweite Ansicht aus der Gruppe → 7 rot
```

## Was noch NICHT da ist

**Abhaken direkt aus der Wochenliste.** Ich hatte es zwischenzeitlich in
einen Code-Kommentar geschrieben, bevor es gebaut war — und wieder
herausgenommen. Ein Kommentar, der etwas verspricht, das es nicht gibt,
ist schlimmer als keiner. Es gehört zu Runde ⑤.

## Der Plan dahinter

① **Rahmen + Umzug** (diese Runde) · ② Ziele · ③ Wünsche ·
④ die Leitungs-Seite für Abgeschicktes · ⑤ Tagesbrille schärfen

Vereinbart wurde außerdem: **Ziele** in allen drei Bedeutungen (privat,
Arbeitszahlen, mit der Leitung vereinbart), **Wünsche** ebenso (Urlaub
und Schicht, Vorschläge ans Studio, private Liste) — wobei Urlaub und
Schichttausch auf die **vorhandenen** Wege verlinken statt sie zu
doppeln. Und: **die Leitung sieht nichts, außer es wird ausdrücklich
abgeschickt**, wobei man je Eintrag wählt, an wen.

## Geprüft

* `tests/test-mein-bereich.js` erweitert — der Weg zwischen beiden
  Ansichten ist jetzt eigener Prüfstoff, mit drei Sonden belegt
* `test-knoepfe` (200 Knöpfe) · `test-gestaltung` · `test-navigation` ·
  `test-rahmen` · `test-quer` (52 Messungen) grün
* volle Regression

---

# 73 · Ziele — zwei Bauarten hinter einem Balken

Runde ② des persönlichen Bereichs. Zwei Sorten Ziel, EINE Darstellung:

* **„Selbst zählen"** — ein Wert, den man antippt (10 Bücher, 3× Sport)
* **„Aus meinen Zahlen"** — gelesen aus dem, was die App ohnehin rechnet

Der Unterschied ist nur, *woher* der Stand kommt. Für den Lesenden ist
es dieselbe Frage — wie weit bin ich —, also dieselbe Zeile.

## Die Runde wurde billiger, weil die Daten schon da waren

`ichZahlenLaden()` rechnet seit langem **fünf eigene Kennzahlen**:
Probetrainings, davon abgeschlossen, Quote, erledigte Studio-Aufgaben,
erledigte eigene To-dos. Ein Arbeitsziel muss also nichts Neues
erheben — es stellt nur einen Zielwert daneben.

Einzige echte Arbeit: `ichZahlenLaden` rechnet fest über 90 Tage, ein
Ziel will „diesen Monat". `zielStart()` nimmt deshalb den **Ersten**
und nicht „vor dreissig Tagen" — der Unterschied ist am 28. eines
Monats gewaltig.

## Ein Ziel ohne Zahl gibt es nicht

„Besser werden" lässt sich nicht abhaken und steht nach vier Wochen
unverändert da. Daran sterben Zielelisten. Deshalb immer ein Zielwert,
notfalls 1 — der Durchlauf weist ein Ziel mit Wert 0 ab.

## Keine neue Regel — und das ist kein Zufall

Die Ziele liegen unter `privat/<uid>/ziele`. Das deckt in
`firestore.rules` schon das `match /{rest=**}` besitzergebunden ab, in
beiden Welten. Genau wie beim Kalender-Schlüssel:

> **Eine Sammlung, die von ihrem ORT her privat ist, kann eine falsche
> Regel gar nicht erst öffnen.**

## Der Fund dieser Runde gehört nicht mir

Beim Bauen zeigte die Zielzeile hartnäckig `0/2`. Die Sonde führte
nicht zu meinem Code, sondern zur Attrappe:

**Der `get()`-Zweig von `stub-chef.js` kannte `probetrainings` gar
nicht — nur `onSnapshot`.** `ichZahlenLaden()` liest aber einmalig.
Die Karte „Meine Zahlen" zeigte deshalb in **jedem** Durchlauf
0 Probetrainings, 0 Abschlüsse, keine Quote. Grün, und ohne jede
Aussage.

Das ist exakt die Lücke, die im Stub schon zweimal dokumentiert steht —
einmal für `board`, einmal für die Übergaben. Beim dritten Mal war sie
also eine **Klasse**, nicht ein Einzelfall. Nach dem Schliessen zeigt
die Karte 4 Probetrainings, 2 Abschlüsse, 50 % Quote.

## Und eine Ausgangslage, die ich korrigiert habe statt der Erwartung

Der erste Lauf meldete `0/2` statt `3/2`. Nach dem Stub-Fix stand dort
`3/2` — und das Ziel rutschte damit unter „Erreicht", weil 3 ≥ 2. Mein
Prüfabschnitt „offen" hätte den Fall dann gar nicht mehr geprüft.

Behoben wurde die **Ausgangslage** (Zielwert 5 statt 2), nicht die
Erwartung. Eine Erwartung ans Ergebnis anzupassen ist der bequemste
Weg, eine Prüfung wertlos zu machen.

## `progressHTML` kann jetzt Überschuss

`done === total` wurde zu `done >= total`, die Balkenbreite auf 100 %
gedeckelt. Für Aufgaben ändert beides nichts — dort kann `done` nie
grösser als `total` werden. Für ein Ziel schon: **25 von 20** sagt die
Zahl weiterhin die Wahrheit, während der Balken in seiner Schiene
bleibt. Ohne den Deckel lief er auf 250 % heraus (gemessen).

Dazu ein drittes Argument `lob`: bei einem Ziel heisst es „erreicht",
bei Aufgaben weiter „alles erledigt".

## Ehrlich bei der einen Zahl, die wackelt

Erledigte Studio-Aufgaben werden **nur** gelöscht, wenn jemand in der
Verwaltung „Archiv leeren" drückt — automatisch passiert das nicht
(nachgesehen in `clearArchive()` und in allen Zeitplänen). Passiert es
doch, sinkt die Zahl. Deshalb steht der Hinweis genau an dieser
Kennzahl und nirgends sonst; ein Satz über jedem Feld wäre der
Erklärungsabsatz, den `test-mein-bereich` ausdrücklich verbietet.

## Die Knopf-Prüfung war ZUM ZWEITEN MAL zu klein

Dasselbe Muster wie in Runde 72, eine Ebene tiefer: der Durchgang
besuchte die Ansicht „Persönlich" — aber **nicht ihre Reiter**. Die
Knöpfe unter „Ziele" wären ungemessen geblieben.

```
165 → 190   (Dialoge dazu, Runde 72)
190 → 215   (Reiter innerhalb einer Ansicht, jetzt)
```

Beide Male war der Lauf vorher grün. Grün hiess beide Male: nicht
hingesehen.

## Was NICHT in dieser Runde ist

**Entwicklungsziele mit der Leitung.** Sie brauchen dieselbe
Absende-Mechanik wie die Wünsche (privat → abgeschickt → beantwortet,
samt Empfängerwahl). Die einmal zu bauen und für beides zu benutzen ist
sauberer, als sie hier zu bauen und in ③ noch einmal anzufassen. Ein
„Entwicklungsziel", das man nicht abschicken kann, wäre ohnehin nur ein
privates Ziel mit einem anderen Wort davor.

Ebenfalls nicht dabei: eine Frist am Ziel (und damit im Kalender).

## Geprüft

* `tests/test-ziele.js` (neu) — 22 Prüfungen, vier Sonden mit eigenem Rot:
  * Zeitraum ignorieren → `4/5` statt `3/5`
  * Balken ohne Deckel → `250%`
  * Ziel in eine geteilte Sammlung → falscher Ort erkannt
  * `+1` auch bei gelesenen Zielen → erkannt
* `test-knoepfe` erweitert (215 Knöpfe) · `test-gestaltung` ·
  `test-mein-bereich` · `test-quer` · `test-rahmen` grün
* volle Regression

---

# 74 · Wünsche — und der erste Weg nach draußen

Runde ③ des persönlichen Bereichs. Bis hierher war alles dort privat.
Diese Runde baut den einen Weg heraus — und zwar so, dass man ihn
selbst gehen muss.

## Eine Vereinfachung, die beim Bauen entstand

Geplant war eine dritte Zielart „Entwicklungsziel mit der Leitung".
Beim Bauen fiel auf: **das IST nur ein Ziel, das man abgeschickt hat.**

Eine eigene Art dafür wäre ein zweiter Weg zum selben Ort gewesen — und
hätte nebenbei verboten, ein gewöhnliches Ziel zu teilen. Jetzt hat
*jedes* Ziel und *jeder* Wunsch denselben Knopf. Weniger Code, mehr
möglich.

## Drei Zustände, und man sieht sie

```
privat        Voreinstellung. Niemand sonst kann es lesen.
abgeschickt   liegt in anliegen/, lesbar NUR für den gewählten Kreis
beantwortet   die Antwort steht an der Zeile
```

**Das Private bleibt die Wahrheit**, das Abgeschickte ist eine Abschrift
mit eigenem Leben. Wer nach dem Abschicken den Text ändert, ändert die
Abschrift nicht — sonst stünde bei der Leitung hinterher etwas anderes,
als sie beantwortet hat. Zurückziehen und neu schicken geht jederzeit;
eine **beantwortete** Bitte nicht mehr, sonst wäre die Antwort mit weg.

## Die erste Sammlung, die nicht jeder Aktive lesen darf

Abwesenheiten, Übergaben und das Schwarze Brett stehen dem ganzen Team
offen. Das ist dort richtig. Bei `anliegen` wäre es der ganze
Unterschied:

> Ein Anliegen an die Geschäftsführung, das der Kollege nebenan
> mitliest, ist kein Anliegen an die Geschäftsführung.

`tests/rules/anliegen.test.js` — **45 Prüfungen in beiden Welten**, und
der Kern ist die Liste dessen, was NICHT geht:

* Kollege liest ein fremdes Anliegen
* Studioleitung liest eines, das an den Chef ging
* Studioleitung eines **fremden** Studios liest mit
* jemand schickt in fremdem Namen ab
* jemand legt es gleich als „beantwortet" an
* **die Leitung schreibt den Text um statt zu antworten**
* der Absender zieht eine beantwortete Bitte zurück
* ein Kollege löscht ein fremdes Anliegen

Der vorletzte Fall ist der teuerste: ohne `hasOnly(['antwort',
'antwortVon','antwortAm','status'])` könnte die Leitung den Titel
ändern, und hinterher stünde etwas anderes da, als abgeschickt wurde.

Dazu ein eigener Abschnitt für **Abfragen**: Firestore prüft bei einer
Liste jede Zeile, und eine einzige verbotene lässt die ganze Abfrage
scheitern. Deshalb fragt der Chef die ganze Sammlung ab, eine
Studioleitung je Studio mit `where()`.

## Was NICHT gebaut wurde, obwohl es auf der Liste stand

**Urlaub und Schichttausch.** Für beides gibt es längst einen Weg —
Urlaubsantrag mit Status, den die Verwaltung über alle Studios sieht,
und Schichttausch am Schwarzen Brett mit Zusage. Ein zweiter Weg
daneben wäre kein Feature, sondern eine zweite Stelle, an der ein
Vorgang liegen bleibt.

Im Wünsche-Reiter stehen deshalb nur **zwei Verweise** dorthin. Und
wenn das Merkmal in einer Firma abgeschaltet ist, sagt der Verweis das,
statt ins Leere zu führen.

Neu ist nur, was es wirklich noch nicht gab: der **Schichtwunsch vor
der Planung** — als gewöhnliches Anliegen an die Studioleitung.

## Die Gegenseite, sonst wäre es ein Knopf ins Nichts

Verwaltung → **Anliegen**. Der Chef sieht alles, eine Studioleitung nur
das an ihre Studios Gerichtete. Antworten geht in einer Zeile.

Ein Knopf, der etwas losschickt, ohne dass irgendwo etwas ankommt, ist
der schlechteste Zustand von allen — weil man ihn nicht sieht. Deshalb
kam ④ in dieselbe Runde.

## Eine Lehre über das Prüfen selbst

Drei Sonden gegen den neuen Durchlauf. Die erste meldete **nichts** —
und sah damit aus wie „die Prüfung greift nicht". Der wahre Grund war
mein eigenes Zitieren in der Sonde: sie hatte die Datei gar nicht
verändert.

> **Eine Sonde, die nicht bestätigt, dass sie gegriffen hat, beweist
> nichts.** Seitdem zählt jede Sonde erst ihre Treffer.

Mit Treffer-Zählung dann alle drei rot:

```
„Nur für mich" bekommt einen Abschicken-Knopf → FALLE erkannt
Rückverweis weglassen                        → 2 rot
Beim Antworten ein fünftes Feld              → erkannt
```

Die letzte ist die wichtigste: schriebe der Client ein fünftes Feld,
wäre es im Durchlauf grün und in Produktion von der Regel abgelehnt.
Der Durchlauf zählt deshalb die Felder, statt nur zu prüfen, dass
geschrieben wurde.

## Und ein Fund von test-gestaltung

Zweimal `2px` fest hingeschrieben statt `var(--s2)`. Kleinigkeit — aber
genau so franst eine Leiter aus, und dann gibt es sie nur noch auf dem
Papier.

## Geprüft

* `tests/rules/anliegen.test.js` (neu) — **45 Prüfungen**, beide Welten,
  zwei Sonden gegen die Regel (Lesen freigeben → 5 rot; `hasOnly`
  entfernen → 3 rot)
* `tests/test-wuensche.js` (neu) — Wünsche, Abschicken, Antwort,
  Leitungs-Seite; drei Sonden mit eigenem Rot
* `test-knoepfe` (215) · `test-gestaltung` · `test-quer` ·
  `test-mein-bereich` · `test-ziele` grün
* volle Regression

---

# 75 · Die Tagesbrille — abhaken, wo man hinsieht

Runde ⑤ und damit die letzte des persönlichen Bereichs.

Seit Runde 72 gilt: **angezeigt drüben, gepflegt hier.** Die Wochenliste
zeigte die eigene Aufgabe, zum Bearbeiten ging es nach „Persönlich".
Was fehlte, war das Naheliegendste: **abhaken.**

Wer morgens sieht, was ansteht, will es wegtippen können. Dafür die
Seite zu wechseln macht aus einem Handgriff drei — und genau daran
scheitert eine Tagesansicht.

## Zwei Bedienelemente, also kein Knopf mehr

Die Zeile war seit Runde 72 ein einziger `<button>`. Mit einem Kästchen
darin geht das nicht: **ein `<button>` in einem `<button>` gibt es
nicht.** Also wieder ein `div` mit zwei Bedienelementen — einem Kästchen
und dem Text, der hinüberführt. Beide mit der Tastatur erreichbar.

Das Kästchen ist **dasselbe wie in der To-do-Liste** (`.ich-hak`): 24px
sichtbar, über `::after inset:-10px` auf 44px Fingerziel gedehnt. Ein
zweites zu erfinden hieße, zwei Haken zu pflegen, die gleich aussehen
sollen.

## Beide Sorten, eine Stelle

Abhaken geht für die **eigenen To-dos** und für **Studio-Aufgaben**, die
mir zugewiesen sind. Dafür musste `ichEintraegeFuer()` erst einmal
Kennungen mitgeben — sie standen bisher gar nicht in der Zeile, weil
niemand sie brauchte.

Und das Schreiben einer Studio-Aufgabe steht jetzt in einer eigenen
Funktion `aufgabeHaken()`, statt in der Klickbindung der Aufgabenliste:

> Eine Abschrift wäre eine zweite Stelle, an der `doneByUid` vergessen
> wird — und **genau das ist dort schon einmal passiert.** Der Kommentar
> an der alten Stelle erzählt es: die Attrappe lieferte das Feld, der
> Durchlauf war grün, geprüft wurde etwas, das die App nicht schrieb.

## Der Durchlauf wurde rot, und das war richtig

`test-mein-bereich` prüfte „die To-do-Zeile ist ein `<button>`". Nach
dem Umbau ist sie ein `div` — also rot.

**Nicht aufgeweicht, sondern verschärft.** Aus einer Prüfung wurden
fünf:

* der Text ist ein Knopf (Tastatur)
* es gibt ein Kästchen mit `role="checkbox"`
* das Kästchen ist **≥44px** — gemessen wird die über `::after`
  gedehnte Fläche, nicht das sichtbare Kästchen
* das Abhaken **schreibt** nach `privat/<uid>/aufgaben` mit
  `erledigt:true`
* das Abhaken springt **nicht** nebenbei auf den zweiten Schreibtisch

Der letzte ist der, den man ohne Prüfung nie bemerkt: zwei
Bedienelemente in einer Zeile, und wer das Kästchen trifft, will
abhaken — nicht die Seite wechseln.

## Drei Sonden, alle mit Treffer-Zählung

Seit Runde 74 zählt jede Sonde erst, ob sie überhaupt gegriffen hat.

```
Haken weglassen                    Treffer 1 → 3 rot
Beim Abhaken zusätzlich springen   Treffer 1 → 1 rot
Fingerziel-Dehnung entfernen       Treffer 1 → „nur 24px hoch"
```

## Geprüft

* `test-mein-bereich` — von einer Prüfung auf fünf, drei Sonden
* `test-knoepfe` (215) · `test-gestaltung` · `test-quer` ·
  `test-bewegung-ich` · `test-todos` grün
* volle Regression

## Der Plan ist damit durch

```
① Rahmen + Umzug     ✅ Runde 72
② Ziele              ✅ Runde 73
③ Wünsche + Absenden ✅ Runde 74
④ Leitungs-Seite     ✅ Runde 74
⑤ Tagesbrille        ✅ Runde 75
```

**Was der persönliche Bereich jetzt kann:** Woche und Kalender mit
Betrieb und Privatem nebeneinander, abhaken direkt in der Tagesliste,
eigene To-dos und Notizen, Ziele in zwei Bauarten, Wünsche in drei
Bedeutungen — und für Ziele wie Wünsche ein Weg nach draußen, den man
selbst gehen muss, mit sichtbarem Zustand und Antwort.

**Was ausdrücklich NICHT dazugekommen ist:** ein zweiter Weg für Urlaub
oder Schichttausch. Beides hat seinen eigenen, und der bleibt der
einzige.

---

# 76 · Drei alte Punkte — und der Fund lag jedes Mal woanders

Aus der Liste abgearbeitet: SDK-Lücken prüfen, Angriffsdurchlauf durch
`werbung.html`, flache Alt-Daten. Bei allen dreien war das Ergebnis
nicht das erwartete.

## 1 · Der Browser-SDK ist sauber — der Server war es nicht

Firebase JS SDK 10.12.2: **eine** gemeldete Lücke insgesamt
(CVE-2024-11023, `_authTokenSyncURL` über einen `FIREBASE_DEFAULTS`-
Cookie), behoben in **10.9.0**. Wir liegen darüber. Zwei Quellen
befragt, nicht eine: die CVE-Datenbank und die Advisory-Liste bei
GitHub. Beide nennen genau diese eine.

Nebenbei: die aktuelle Fassung ist **12.19.0**, wir sind zwei
Hauptversionen zurück. Kein Sicherheitsgrund zu springen — aber wenn
einmal etwas gemeldet wird, ist der Sprung größer.

**Der eigentliche Fund kam von `npm audit` in `functions/`:**

| | |
|---|---|
| **nodemailer 9.0.5** | vier Meldungen, eine davon *hoch* |
| **qs** (über express) | zwei Meldungen, mittel |

Die schwerwiegendste: *„Recipient-domain validation bypass via RFC 5322
comment mis-parsing"*. Eine Adresse wie `kunde@gut.de(x)boese.de` wird
von der Prüfung als `gut.de` gelesen und von nodemailer an
`gut.deboese.de` zugestellt. Diese App verschickt Terminbestätigungen an
Endkundinnen — genau der Fall.

Behoben mit dem **kleinsten** Sprung, der alle vier schließt: **9.1.1**
statt 9.0.5. Der Weg auf 10.x wäre größer gewesen, ohne mehr zu lösen.
`qs` über einen Override auf 6.16.0. Danach: **0 Lücken**.

`test-mail-versand` bestätigt, dass die Nachrichten unverändert
gerendert werden — und schreibt die Fassung selbst in seine
Erfolgsmeldung.

## 2 · Der Angriffsdurchlauf, der keiner sein durfte

Auf der Liste stand „wie `test-xss.js` für die App". Beim Hinsehen war
die ehrliche Antwort: **so geht es hier nicht.**

`werbung.html` hat **kein `innerHTML`, keine Formulare, keine Datenbank
und liest nichts aus der Adresszeile** — nachgemessen. Es gibt nichts
einzuspeisen. Ein Durchlauf, der trotzdem Nutzlast hineinschiebt, wäre
grün und hätte nichts geprüft.

Gebaut wurde deshalb eine **Härtungsprüfung**: der heutige Zustand ist
gut, und genau der kann still verlorengehen. Und zwar **gemessen statt
gelesen** — die Sicherheitsregel wird im laufenden Browser auf die Probe
gestellt:

* ein nachträglich eingefügtes `<script>` muss scheitern
* ein nachträglich gesetztes `onclick` muss scheitern
* **während der eigene Skriptblock der Seite gelaufen sein muss** —
  ohne diese Hälfte wäre „nichts lief" das grünste Ergebnis von allen
* kein Ereignis im Markup, jedes `target="_blank"` mit `noopener`
* sechs Richtlinien, deren Fehlen je eine eigene Tür aufmacht
* `frame-ancestors` und `X-Frame-Options` als **Dateiprüfung** in
  `firebase.json`, ausdrücklich so benannt: der örtliche Testserver
  schickt sie nicht, sie kommen von Firebase Hosting

Zwei Fehler waren dabei meine eigenen:

**Der Durchlauf fand seinen eigenen Müll.** Abschnitt 1 fügt zum Testen
ein `div` mit `onclick` ein, Abschnitt 3 meldete es als „Ereignis im
Markup". Jetzt räumt jeder Versuch hinter sich auf.

**Ein zu allgemeiner Suchbegriff.** Gesucht wurde nach `onerror` — und
gefunden wurde der **Kommentar** im Skriptblock der Seite („Kein onload
und kein onerror mehr im Markup"). `textContent` nimmt Skripttext mit.
Jetzt trägt die Nutzlast eine eigene Marke.

## 3 · Der Punkt, der seit Monaten auf eine Messung wartete

In `OFFEN.md` stand: die flachen Pfade sind für **jedes** aktive Konto
lesbar, auch für eines aus einer zweiten Firma. Ein einfacher
Mitarbeiter kam an Aufgaben, Chat, Brett, Ankündigungen, Übergaben,
Dokumente und den Dienstplan. Und daneben: *„lässt sich von hier aus
nicht messen … keine Regel, die man auf Verdacht ausrollt."*

**Die Messung stand die ganze Zeit in `konfig.js`.**

Dort steht `mandant: true`. Die App arbeitet also längst auf den
Firmen-Pfaden — und die sind durch `inFirma('koerperformen')` geschützt,
das verlangt: `firma == 'koerperformen'` **oder** `firma == ''`. Ein
Konto mit einem anderen Wert wäre dort **seit dem 17.8. ausgesperrt**,
und das wäre aufgefallen.

Der alte Vorbehalt galt für eine Prüfung auf **leer**. Eine Bedingung,
die **beides** zulässt, braucht die Verteilung gar nicht:

```
function aufFlachenPfaden() {
  return istAktiv()
    && (meineFirma() == '' || meineFirma() == 'koerperformen');
}
```

Angewandt auf **79 Regeln** in 26 Sammlungen. Ausdrücklich *nicht*
dabei: `users`, `beitritt`, die zwei Registrierungs-Schalter, `privat`,
`pushTokens`, `firmenArchiv` — ein neues Konto hat noch kein Profil, und
wer sich anmelden will, muss vorher lesen dürfen.

### Zwei Fehler beim Umbau, beide vom Werkzeug gefunden

**Mehrzeilige Regeln in eine Zeile gequetscht.** Mein erster
Transformator fügte alle Zeilen einer Regel zusammen — und ein
`//`-Kommentar darin kommentierte den Rest weg. Der Emulator meldete
„Unexpected 'allow'" an drei Stellen. Der zweite Anlauf lässt die Zeilen
stehen und ergänzt nur Kopf und Klammer.

**Ein Drittel der Regeln übersprungen.** Der Umbau fügt Zeilen ein,
dadurch verschieben sich alle folgenden Blöcke — und ihre gemerkten
Zeilennummern zeigten ins Leere. Sichtbar wurde es daran, dass bei
`board`, `documents` und `handovers` ausgerechnet das erste
`allow read` unangetastet blieb. Von hinten nach vorn: **79 statt 48**.

Der zweite Fehler ist der lehrreichere: der erste Anlauf war
*syntaktisch fehlerfrei* und hätte drei Sammlungen weiter offen
gelassen. Gefunden hat ihn nicht der Compiler, sondern der Kreuztest.

### Schritt 3: der Grund, warum es so lange unbemerkt blieb

`kreuz.test.js` deckte **zweiunddreißig** Sammlungen ab — alle im
Firmen-Zweig. Der flache daneben war **nie** Gegenstand. Es war nicht
falsch geprüft, es war nicht geprüft.

Jetzt vier Prüfungen je flacher Sammlung: fremde Firma liest nicht,
schreibt nicht — und **zwei Gegenproben**, dass der eigene Betrieb
weiter herankommt, mit leerem Feld *und* mit Kennung. Die zweite ist
die gefährliche: sperrt die neue Grenze den laufenden Betrieb aus,
fällt es hier auf und nicht am Montagmorgen.

### Und eine Regel, die richtig war, während meine Prüfung falsch war

Die Gegenprobe für `certificates` schlug fehl. Ursache: ein Nachweis
ist **persönlich**, ein Kollege darf ihn nicht lesen — meine Prüfung
ließ ein fremdes Zeugnis lesen wollen. Korrigiert wurde die Prüfung
(je Konto ein eigener Nachweis), nicht die Regel.

### Vier Regeltests hatten eine Firma, die es nie gibt

`rechte`, `reaktionen`, `umfragen`, `fremde-felder` legten ihre Konten
unter `firma: 'alpha'` an und griffen auf **flache** Pfade zu — mit dem
neuen Schutz zu Recht abgewiesen (8 + 14 rote Zeilen). Nicht die Regel
war falsch, sondern die Ausgangslage: die flachen Pfade gehören dem
ersten Betrieb, also heisst er dort auch so.

## Geprüft

* **864 Regelprüfungen** grün (`kreuz` allein 166, davon 34 neu für den
  flachen Zweig)
* Sonde: Schutz ausgehebelt → **das dokumentierte Leck kommt zurück**,
  Zeile für Zeile wie in `OFFEN.md` beschrieben
* `tests/test-xss-werbung.js` (neu) — vier Sonden mit eigenem Rot
* `npm audit` in `functions/`: **0 Lücken** (vorher 1 hoch, 1 mittel)
* volle Regression

## Was bei diesem Punkt offen bleibt

Die flachen Daten **löschen**. Das braucht Produktionszugang, den ich
nicht habe und nicht anfordere. Es ist jetzt aber Aufräumen und keine
Sicherheitsfrage mehr — an die Daten kommt keine fremde Firma heran.

---

# 77 · Nachgemessen — und der Fund war eine Regel, die sich selbst aufhob

Der Auftrag war zweiteilig: *„miss das mal nach und korrigiere auf
fehler"*. Nachgemessen wurde, was ich in Runde 76 selbst behauptet
hatte — und die Behauptung hielt nicht.

## Zuerst die Korrektur an mir selbst

In `OFFEN.md` steht seit Monaten „Sammel-Dokument für Studio-Zahlen —
**drei Übersichten fragen je Studio einzeln ab**". Ich hatte das dem
Nutzer als den teuersten offenen Punkt genannt.

Es stimmt nicht. `homeBrennpunkte` („Wo etwas los ist") liest aus
`cachedTodos[sk]` und `_invAll[sk]` — **aus dem Speicher, nicht aus der
Datenbank**. Die drei Übersichten setzen zusammen **null** zusätzliche
Abfragen ab.

Was je Studio läuft, sind die **Beobachter**, die diese Speicher füllen —
und die stehen für den Chat, die Aufgaben und den Putzplan ohnehin da.
`audit-leistung.js` misst für den Chef bei 14 Studios:

| | |
|---|---|
| einmalige Abfragen beim Start | 19 |
| dauerhafte Beobachter | 56 |
| davon je Studio | 14× Chat-Nachrichten, 14× Aufgaben, 14× Putzplan |
| nach 3 Runden durch alle Ansichten | 66 offen, **konstant** — kein Leck |

Ein Sammel-Dokument für die Zahlen der Startseite würde daran nichts
ändern, weil die Zahlen dort gar nicht herkommen. Die Zeile in
`OFFEN.md` ist entsprechend korrigiert, statt sie stehen zu lassen.

## Der eigentliche Fund: min-height stand zweimal da

`audit-forensik.js` meldete sechs Fingerziele unter 44 Pixeln. **Zwei
davon waren falsch** — die Forensik misst das gemalte Rechteck, und das
Haus kennt zwei Wege zu 44px: den Knopf groß machen, oder eine
unsichtbare Fläche darüberlegen. `.sp-play` ist 34px gemalt und 44px zu
treffen; als Fehler gemeldet zu werden ist dort das Gegenteil von wahr.

Also mit der Methode gemessen, die `test-sprachabspieler.js` längst
benutzt — `elementFromPoint` von der Mitte nach außen tasten:

| Element | gemalt | Trefferhöhe | |
|---|---|---|---|
| `.sp-play` | 34×34 | 44 | in Ordnung |
| `.sp-tempo` | 31×19 | 44 | in Ordnung |
| `.chat-art` | 96×36 | **42** | zwei Pixel an die Kanalleiste verloren |
| `.sp-schieber` | 129×22 | **22** | kein `::after` |
| `.t-nimm` | 142×19 | **20** | kein `::after` |

Und dann die app-weite Erhebung, die es vorher nie gab — sie fand
**sieben** Bauformen, nicht fünf. Darunter `+ Neu` in Aufgaben, Putzplan
und Probetraining mit 40px: die wichtigste Handlung der jeweiligen Seite.

Bei zweien davon stand das Fingerziel **im Stylesheet und galt trotzdem
nie**:

```
.mat-row .num{width:100%;min-height:44px; … ;min-height:40px;…}
.mat-alert-go{ … min-height:44px; … ;min-height:36px}
```

`min-height` zweimal in derselben Regel, die zweite gewinnt. Jemand hat
das Fingerziel eingebaut, und es ist seither wirkungslos.

Zweimal derselbe Fehler ist keine Einzelheit, also alle 1529 Regeln
durchsucht: **genau diese zwei**. Die drei weiteren Treffer
(`100vh → 100svh`, `100vh → 100dvh`) sind Absicht — Rückfall für
Browser, die die neue Einheit nicht kennen.

## Ein größeres Ziel darf nicht mehr Fehlgriffe bedeuten

`.t-nimm` („Ich übernehme das") liegt in der Überschriftszeile einer
Aufgabe. Eine unsichtbare 44px-Fläche darüber deckt Text ab, der heute
nichts tut — nachgemessen, nicht vermutet. Trotzdem wäre sie riskant,
denn **Übernehmen lässt sich in der App nicht wieder lösen.**

Dabei fiel der vierte Fund an: der Kommentar über dem Klickweg sagte
*„und wer schon drinsteht, löst sich damit wieder"*. Zwei Zeilen weiter
steht `if(t && t.assignedTo) return;`, und sobald die Aufgabe vergeben
ist, wird der Knopf gar nicht mehr gezeichnet. **Der Satz versprach elf
Monate lang etwas, das der Code darunter nie getan hat.**

Gelöst ohne die Grundsatzfrage zu beantworten: nachgefragt wird **nur
beim neu hinzugekommenen, unsichtbaren Teil** der Fläche. Wer die Marke
selbst trifft, meint sie — ein Klick, keine Rückfrage, so ist es dort
ausdrücklich beschlossen. Wer 15 Pixel daneben trifft, wollte vielleicht
die Überschrift lesen. Tastatur-Enter liefert `clientY` 0 und zählt
nicht als danebentippen.

Ob ein Mitarbeiter eine übernommene Aufgabe wieder abgeben darf, ist
eine Frage an den Betrieb und keine an mich. Sie steht jetzt in
`OFFEN.md`.

## Der Durchlauf, der gefehlt hat

`test-knoepfe.js` war grün, während sieben Bauformen zu klein waren. Er
prüft Symbol-Zentrierung und Abzeichen — beides wichtig, beides nicht
die Größe. Die Größe prüften vier Einzeldurchläufe für vier Einzelstellen,
also genau dort, wo schon einmal jemand hingesehen hatte.

`tests/test-fingerziele.js` misst jetzt **jedes** Bedienelement in
**jeder** Ansicht in **allen drei Rollen**, und zwar die Trefferfläche
statt des Rechtecks: 916 Elemente, Schwelle 44px, **keine
Ausnahmeliste**. Eine Liste geduldeter Fälle wäre bequem gewesen —
sieben Einträge, und ab sofort fände er nur noch Neues. Sie sind
stattdessen alle behoben.

### Zwei Fallen beim Messen, in beide hineingetappt

**Wer nicht rollt, misst das Sichtfenster.** Ein Knopf am unteren
Bildrand liefert unter seiner Mitte `<main>` statt seiner selbst — ein
tadelloser 44er erscheint mit 23. Das erzeugte im Material fünf falsche
Treffer.

**Ein Eingriff kann einen zweiten Fehler freilegen.** Nach dem Anheben
der Material-Felder sanken drei davon scheinbar auf 23. Das war Falle 1
und kein neuer Schaden. Wenn eine Zahl nach einer Korrektur schlechter
aussieht: erst die Messung prüfen, dann den Code.

### Gegenprobe

Der Durchlauf enthält außerdem eine Probe auf sich selbst: erreicht er
weniger als vier Ansichten oder findet er weniger als 40 Bedienelemente,
meldet er das als Fehler. Ohne das wäre „null Verstöße" auch dann grün,
wenn ein Wahlausdruck nicht mehr passt — derselbe Fehler wie „nichts
lief war das grünste Ergebnis" beim Härtungsdurchlauf der Werbeseite.

Zurückgebaut (`.kopf-plus` auf 40px, `::after` von `.t-nimm` entfernt):
**8 Funde in drei Rollen**, jeder mit Klasse, gemessenem Wert und dem
Element, das die Pixel nimmt.

## Geprüft

* `test-fingerziele` (neu): 916 Bedienelemente, 3 Rollen, 0 unter 44px
* Gegenprobe: zwei Korrekturen zurückgebaut → 8 rote Zeilen
* `test-knoepfe`, `test-gestaltung`, `test-abgeschnitten`, `test-quer`,
  `test-sprachabspieler` — alle grün nach den CSS-Eingriffen
* `audit-leistung` und `audit-forensik` als Ausgangsmessung
* CSS-Scan über 1529 Regeln auf Eigenschaften, die sich selbst aufheben
* volle Regression

## Was NICHT behauptet wird

Die Ladephase misst `audit-leistung` mit vierfach gedrosselter CPU:
**55 lange Aufgaben, die längste 1050 ms.** Das ist gemessen, aber auf
einem absichtlich verlangsamten Gerät — was ein echtes Handy im Studio
tut, ist damit nicht gesagt und wird hier auch nicht gesagt. Es steht
als eigener Punkt in `OFFEN.md`.

---

# 78 · Der Testzugang — und drei Fehler, die nur beim Bauen sichtbar wurden

*„wir müssen langsam an dem schritt der veröffentlichung arbeiten weil
ich potentielle kunden habe so langsam und ich denen ja auch was
präsentieren muss"*

Dafür gab es schon einen Plan: `docs/VERKAUF.md`, Punkt **A3 —
Testzugang mit erfundenen Daten**, dort beschrieben als *„der wirksamste
Verkaufshebel und der billigste"*. Seit Wochen offen.

`index.html?demo` startet die App jetzt ohne Anmeldung gegen eine kleine
Datenbank im Browser. Oben eine Leiste „Demo — erfundene Daten", darin
ein Umschalter für die Rolle.

## Die Einschätzung im eigenen Plan war falsch

Dort stand, die Test-Attrappen aus `tests/stub-*.js` reichten dafür und
es sei „wenig Arbeit". Beides stimmte nicht.

Die Attrappen **beantworten Abfragen, verwerfen aber Schreibvorgänge**.
Für einen Durchlauf ist das genau richtig. Für eine Vorführung ist es
tödlich: wer eine Aufgabe abhakt und nichts passiert, hält nicht die
Demo für kaputt, sondern die App. `demo-daten.js` ist deshalb eine
wirklich schreibende Datenbank mit lebenden Zuhörern geworden.

Der Umfang wurde dabei **nachgesehen statt geraten**: die App benutzt
keine `FieldValue`, keine Transaktionen, keine Cursor und keine
Sammlungsgruppen. Gebraucht werden `where`/`orderBy`/`limit`/
`limitToLast`, `set`/`update`/`delete`/`add`, Stapelschreiben und
Zuhörer auf Sammlung wie Einzeldokument. Genau das steht drin — nicht
mehr.

## Fehler 1: eine Zusage, die ich nicht halten konnte

Im Kopf der Datei stand zuerst **„kein einziges Byte verlässt den
Browser"**. Der erste Durchlauf lief in eine Zeitüberschreitung und
zeigte warum: die fünf SDK-Dateien werden weiterhin von Googles CDN
geladen. Sie stehen als feste Zeilen in `index.html`, und sie nur für
die Demo herauszunehmen würde für alle anderen den Start verlangsamen —
der Vorauslader des Browsers findet dann keine festen Adressen mehr.

Der Satz ist berichtigt: heruntergeladen wird eine öffentliche
Programmbibliothek, **gesendet wird nichts**. Das ist die Zusage, die
trägt, und `tests/test-demo.js` misst genau sie.

## Fehler 2: ein Kommentar, der die Seite lahmlegte

Der Demo-Modus startete nicht. Der Browser meldete *„Refused to execute
inline script"* — und `demo-daten.js` wurde nie angefordert.

Ursache: **mein erklärender HTML-Kommentar enthielt das Wort für ein
öffnendes Skript-Tag, ausgeschrieben.** `tools/csp.js` sucht die
Inline-Blöcke mit einem regulären Ausdruck und kennt keine Kommentare.
Es hielt den Kommentar für einen Block, bildete dessen Prüfsumme und
ließ die des echten Skripts weg.

Der Fehler war laut — nichts funktionierte —, aber die Ursache stand an
einer Stelle, an der niemand sucht. Deshalb nicht nur der Kommentar
geändert, sondern **das Werkzeug**: `csp.js` liest jetzt von links nach
rechts wie ein Browser. Wer an einem Kommentaranfang steht, springt zum
Kommentarende; wer an einem Skriptanfang steht, zu dessen Ende.

Der erste Entwurf dafür hatte dasselbe Henne-Ei-Problem — zwei getrennte
Durchläufe mit regulären Ausdrücken, und welcher zuerst läuft, entschied
das Ergebnis. Ein Durchlauf von links nach rechts kennt die Frage nicht.

## Fehler 3: meine Prüfung befragte einen Leichnam

`test-demo` meldete „Abhaken wirkt nicht" — während die Kachelsumme auf
der Startseite von 106 auf 105 ging. Beides konnte nicht stimmen.

Es lag an der Prüfung: sie hielt den DOM-Knoten der Aufgabe fest, klickte
und fragte danach denselben Knoten. Die Aufgabenliste zeichnet sich nach
einem Schreibvorgang aber neu — der festgehaltene Knoten hing in keinem
Dokument mehr und trug für immer den alten Zustand. Jetzt wird nach der
Kennung neu gesucht.

**Dritter Fall derselben Art in diesem Durchgang:** vorher schon „wer
nicht ins Bild rollt, misst das Sichtfenster" und „eine Zahl, die nach
einer Korrektur schlechter aussieht, ist zuerst ein Verdacht gegen die
Messung".

## Die Prüfung auf das, was man nicht sieht

Dass die Demo läuft, sieht man beim Vorführen sofort. Dass **nichts nach
draußen geht**, sieht man nie — und genau deshalb wird es gemessen.

`tests/test-demo.js` zählt jede Anfrage der Seite. Der erste Anlauf
suchte nach verdächtigen Wörtern (`firestore`, `googleapis`) und schlug
prompt bei der Schriftart und bei `firebase-firestore-compat.js` an —
beides harmlos. Eine Liste des Verbotenen ist außerdem die schwächere
Bauart: sie findet nur, woran jemand gedacht hat.

Jetzt steht dort eine Liste des **Erlaubten**: eigene Adresse,
Schriften, die Bibliothek. Alles andere ist ein Fund, auch etwas, das es
heute noch nicht gibt.

## Geprüft

* `test-demo` (neu): ohne `?demo` ändert sich nichts · mit `?demo`
  startet die App durch · **0 Anfragen nach draußen** · Daten da ·
  Abhaken wirkt (46 → 45 offene, Startseite 106 → 105) · Chef 15 Kanäle
  gegen Mitarbeiter 2 · keine erfundenen Rechtsangaben
* Gegenprobe: ein eingebautes `fetch` zu firestore **und** verworfene
  Schreibvorgänge → **drei rote Zeilen**, jede mit Messwert
* `test-csp`, `test-fingerziele`, `test-knoepfe`, `test-gestaltung`,
  `test-navigation` nach dem Eingriff grün
* volle Regression

## Was die Demo ausdrücklich nicht tut

Die **rechtlichen Pflichtfelder bleiben leer** und sagen das auch.
Erfundene Angaben in ein Impressum zu schreiben wäre genau die Art
Platzhalter, die auf `werbung.html` schon einmal live gegangen ist —
dort stand „wir melden uns innerhalb von 24 Stunden" an einem Formular,
das nirgendwohin sendete. Ein Durchlauf prüft jetzt, dass in der Demo
weder eine Musterstraße noch eine erfundene Umsatzsteuer-Nummer steht.

Cloud Functions laufen nicht. Wer in der Demo etwas auslöst, das eine
E-Mail verschicken würde, bekommt einen Satz, der das sagt — statt einer
Fehlermeldung oder, schlimmer, einer stillen Nichtreaktion.

---

# 79 · Zeiterfassung, Schritt 1 und 2: Öffnungszeiten und die PIN

Der Anfang des größten Baus bisher. Der Plan steht in
`docs/ZEITERFASSUNG-PLAN.md`; hier sind die ersten beiden Schritte.

## Schritt 1 — Öffnungszeiten je Studio

Der unscheinbarste Teil, und er steht am Anfang, weil ohne ihn die Frage
gar nicht gestellt werden kann, die den ganzen Bau ausgelöst hat:
**„wie lange war der Laden unbeaufsichtigt".** Nachts ist niemand da,
und das ist richtig so.

Beim Nachsehen stellte sich heraus: **es gibt keine Öffnungszeiten** —
weder in der App noch in `konfig.js`. Sie liegen jetzt im vorhandenen
Dokument `config/studios`, je Studio und Wochentag.

**Warum dort und nicht in einer eigenen Sammlung:** `config/studios` hat
bereits Regeln, die nur die Leitung schreiben lassen, und die Liste wird
ohnehin überall gelesen, wo Studios vorkommen. Eine neue Sammlung hieße
eine neue Regel, eine neue Prüfung und einen zweiten Ort, an dem etwas
fehlen kann.

Drei Entscheidungen im Kleinen, jede mit einem Grund:

* **Leerer Wert heißt geschlossen, kein Wert heißt „nicht gepflegt".**
  Der Unterschied zählt: sonst meldet die Abdeckungsrechnung später für
  jedes ungepflegte Studio vierundzwanzig Stunden ohne Aufsicht.
* **„bis" vor „von" wird abgelehnt**, mit Nennung des Tages. Eine
  Nachtschicht über Mitternacht gibt es in einem EMS-Studio nicht; sie
  stillschweigend zuzulassen hieße, dass die Rechnung später Unsinn
  ergibt, ohne dass es jemand merkt.
* **„Für alle Tage übernehmen".** Die häufigste Eingabe ist „jeden Tag
  dasselbe". Sie sieben Mal zu tippen ist der schnellste Weg, dass es
  niemand pflegt.

`tests/test-oeffnungszeiten.js` prüft unter anderem, dass beim Speichern
**alle vierzehn Studios** in der Liste bleiben — ein Dialog, der die
übrigen verliert, ist schlimmer als keiner. Gegenprobe: zwei Korrekturen
zurückgebaut → fünf rote Zeilen.

## Schritt 2 — die PIN

Hier steht oder fällt das ganze System. **Kann irgendjemand die PIN
eines anderen lesen, kann er für ihn stempeln — und dann ist die
Aufzeichnung als Nachweis nichts mehr wert.**

Vier Regeln, keine davon verhandelbar:

1. **Gespeichert wird nie die PIN**, sondern `scrypt(PIN, Salz)`. Ein
   Hash allein genügt nicht: vier Ziffern sind zehntausend
   Möglichkeiten, eine Tabelle dafür passt auf einen USB-Stick. Das Salz
   ist je Person zufällig.
2. **Niemand darf ihn lesen** — nicht der Kollege, nicht die Leitung,
   nicht der Chef, **nicht einmal die Person selbst**. `zeitPins` steht
   in `firestore.rules` auf `if false`, in beiden Welten.
3. **Verglichen wird zeitgleich** (`timingSafeEqual`), wie beim
   Kalender-Link.
4. **Setzen darf nur die Person selbst**, und wer schon eine hat, muss
   die alte nennen. Kein Weg, über den die Leitung eine PIN vergibt —
   wer das kann, kann auch für jemanden stempeln.

### Der Eintrag, den man beim Bauen weglässt

`tests/rules/zeitpin.test.js` prüft acht Wege an den Hash, und der
wichtigste ist: **die Person selbst darf ihren eigenen Hash nicht
lesen.** Überall sonst in dieser App darf der Eigentümer sein eigenes
Dokument lesen — hier wäre `if request.auth.uid == uid` der bequeme
Fehler. Bequem, weil er anderswo richtig ist.

Gegenprobe: genau diese Regel eingesetzt → **eine rote Zeile**, und zwar
diese.

Die Gegenprobe zur Ausgangslage ist keine Leseprobe auf `zeitPins`,
sondern eine **daneben**: dieselben Konten müssen am Schwarzen Brett
weiter arbeiten können. Sonst wäre der Durchlauf auch grün, wenn die
Testdaten kaputt sind.

### Der Wächter kannte die neue Bauform nicht

`test-funktionen-pfade` verlangt von jedem `onCall` ein
`require(Auth|Chef|Admin)(context)` im Rumpf. `pinSetzen` und
`pinStatus` rufen stattdessen `anruferProfil(context)` — das prüft
requireAuth **und** zusätzlich, dass das Konto freigegeben ist, ist also
strenger.

Dieselbe Lehre wie beim Kalender im August: **nicht als Ausnahmeliste.**
Anerkannt wird die Bauform, und zwar nur, wenn die Hilfsfunktion
wirklich tut, was ihr Name behauptet — geprüft wird, dass sie
`requireAuth(context)` ruft **und** gesperrte Zugänge abweist. Sonst
stünde die Regel auf einem Funktionsnamen, und den kann jeder vergeben.

Gegenprobe: `requireAuth` aus `anruferProfil` entfernt → **drei rote
Zeilen**, die Hilfsfunktion und beide Endpunkte.

## Ein Fehler beim Bauen, und er war lehrreich

Nach einer Änderung startete die App gar nicht: *„Unexpected string"*.
Ursache war meine eigene Werkzeugbenutzung — in einer Perl-Ersetzung ist
`$(` eine **Perl-Variable** (die Gruppen-ID). Sie wurde zur Zahl
ausgewertet, und aus `var b=$('id')` wurde `var b=0'id')`.

Gefunden wurde es nicht durch Lesen, sondern durch **halbierendes
Suchen**: die Inline-Blöcke einzeln durch den Parser, dann im kaputten
Block die erste Zeile eingegrenzt, ab der es nicht mehr aufgeht. Zwei
Minuten statt zwanzig.

Die Lehre ist nicht „Perl ist heikel", sondern: **eine Ersetzung, die
Quelltext erzeugt, gehört danach durch einen Parser** — und nicht nur
durch `grep -c`, das genau diesen Fehler gemeldet hätte als „1 Treffer,
alles gut".

## Geprüft

* `test-oeffnungszeiten` (neu) · Gegenprobe → 5 rot
* `tests/rules/zeitpin.test.js` (neu): 30 Zusicherungen in beiden Welten ·
  Gegenprobe → 1 rot, und zwar der Eintrag, den man weglässt
* `test-zeitpin` (neu): Salz wirkt, Hash ohne Klartext, scrypt, kein
  Endpunkt · Gegenprobe zur Prüfung selbst
* `test-funktionen-pfade` erweitert · Gegenprobe → 3 rot
* `test-mein-bereich` um die PIN-Karte erweitert: **0 direkte
  Schreibvorgänge** nach `zeitPins`, der Weg läuft nur über den Server
* volle Regel-Durchläufe grün

## Was ausdrücklich noch nicht geht

Stempeln. Es gibt die PIN und die Öffnungszeiten, aber kein Terminal und
keine Zeitdatensätze — Schritte 3 bis 5 im Plan. Wer die PIN heute setzt,
setzt sie für etwas, das es noch nicht gibt; die Karte sagt das auch so.

---

# 80 · Zeiterfassung, Schritt 3 und 4: das Terminal steht

Ein Tablet am Empfang wird zur Stempeluhr. Der Chef richtet es ein, das
Team stempelt darauf. Damit ist die Zeiterfassung von Ende zu Ende da —
was fehlt, ist das, was man daraus rechnet.

## Wie sich das Terminal ausweist

Die Entscheidung mit den meisten Folgen, und es gab zwei Wege.

**Verworfen:** ein offener Endpunkt, den ein nicht angemeldetes Tablet
mit einem Geräte-Geheimnis ruft. Das wäre eine Adresse im Internet, an
der jeder klopfen kann — und jeder Klopfversuch ein Versuch auf eine
vierstellige PIN.

**Gebaut:** das Tablet ist ganz normal angemeldet. Ein Stempel braucht
damit **drei Dinge gleichzeitig**:

| | |
|---|---|
| 1 | ein angemeldetes, freigegebenes Konto **dieses** Betriebs |
| 2 | das Geheimnis **genau dieses** Terminals |
| 3 | die PIN der Person |

Wer das Tablet stiehlt, hat zwei davon und kann für niemanden stempeln.
Wer eine PIN kennt, braucht trotzdem das Gerät im Studio.

**Ein Geheimnis je Terminal**, nicht eines für den Betrieb — sonst zwingt
ein verlorenes Tablet dazu, alle anderen neu einzurichten. Dieselbe
Begründung wie beim Kalender-Abo.

**Und ein Unterschied zur PIN, der erklärt gehört:** das
Terminal-Geheimnis sind 32 zufällige Bytes, sein Hash lässt sich nicht
durchprobieren. Deshalb darf die Leitung die Terminal-Liste lesen,
während `zeitPins` für alle gesperrt ist. Der Unterschied ist Rechnung
und nicht Geschmack: zehntausend Möglichkeiten gegen 2^256.

## Was der Bildschirm anders macht als der Rest der App

**64 Pixel statt 44.** Gestempelt wird im Vorbeigehen, oft mit nassen
Händen, manchmal von jemandem, der die App sonst nie öffnet.

**Bei vier Ziffern wird nicht von selbst abgeschickt.** Eine PIN darf
fünf oder sechs Stellen haben; ein Automat, der nach der vierten
losrennt, macht daraus stillschweigend einen Fehlversuch.

**Was das Terminal nicht kann, und das ist Absicht:** keine Zeiten
ansehen, keine korrigieren, keine fremden Studios. Ein Gerät, das offen
am Empfang steht, ist kein Ort für Auskünfte über Arbeitszeiten von
Kollegen.

## Drei Fehler, und alle drei waren meine

### 1. `S('users')` — der Kommentar stand da, ich habe ihn überlesen

`users` ist die **eine** Sammlung, die nicht unter `firmen/<kennung>/`
liegt: beim Anmelden weiß die App noch nicht, zu welcher Firma jemand
gehört. Das steht so im Code. Ich habe trotzdem `S('users')` geschrieben,
und die Personenliste im Terminal blieb leer.

Gefunden hat es der Durchlauf, nicht ich.

### 2. Der vierte Fall derselben Attrappen-Lücke

`collection('users').get()` lieferte **0** — auch ohne Filter. Der
`get()`-Zweig von `stub-chef.js` kannte `users` nicht, nur `onSnapshot`.

Dieselbe Lücke wie zuvor bei `board`, bei den Übergaben und bei
`probetrainings`. **Beim vierten Mal ist es keine Einzelheit.** Behoben,
und mit einem Hinweis versehen: wer die Attrappe erweitert, trägt eine
Sammlung an **beiden** Stellen ein. Eine Sammlung, die nur eine Hälfte
kennt, macht jeden Durchlauf darüber grün und aussagelos.

### 3. Meine erste Gegenprobe war wertlos — und hätte mich beruhigt

Die wichtigste Prüfung dieses Bauteils lautet: **ohne Schlüssel darf der
Terminal-Bildschirm nicht erscheinen.** Ein Fehler dort verdeckt allen
Mitarbeitern die ganze App, sofort nach dem Ausrollen — und auf dem
eigenen Gerät sieht man ihn nie, weil dort ein Schlüssel liegt.

Die Gegenprobe dazu wurde **nicht rot**. Fast hätte ich das als „die
Prüfung ist eben schon gut" verbucht. Der wahre Grund: meine Sonde ließ
den Bildschirm nur kurz aufblitzen, und ich habe drei Sekunden später
gemessen.

Mit einer ehrlichen Sonde schlägt sie an:
*„OHNE SCHLÜSSEL IST DER TERMINAL-BILDSCHIRM SICHTBAR"*.

**Die Lehre ist nicht „Sonden sorgfältiger bauen", sondern: eine
Gegenprobe, die nicht rot wird, ist ein Befund und kein Ergebnis.**

### Nachtrag: drei Fehler, die nicht aus der App kamen

`firebase.firestore` ist eine **Funktion mit Eigenschaften**
(`FieldValue`, `FieldPath`). Meine Test-Attrappe hat sie ersetzt und nur
die Funktion kopiert — die Eigenschaften waren weg, und die App fiel dort
um, wo sie `fv.increment()` ruft. Drei PAGEERROR, und keiner davon aus
dem Code, den ich prüfen wollte.

## Geprüft

* `test-terminal` (neu): ohne Schlüssel bleibt der Bildschirm weg ·
  Einrichten zeigt den Schlüssel einmal · er landet **nur** lokal ·
  mit Schlüssel übernimmt der Bildschirm · nur Leute dieses Studios ·
  kein Selbstabschicken bei vier Ziffern · **0 direkte Schreibvorgänge**
  in `zeiten` · ein Fehlversuch räumt die PIN weg
* Gegenprobe auf die teuerste Zusage → rot, mit dem richtigen Satz
* `tests/rules/zeitpin.test.js`: **68 Zusicherungen** in beiden Welten ·
  Gegenprobe (Schreiben erlaubt) → fünf rote Zeilen
* `test-zeitpin`: Reihenfolge, Bremse, drei Schlüssel · mit Gegenproben
* **Volle Regression: 105 grün · 0 rot · 0 ohne Ausgabe**

## Was jetzt fehlt

Schritt 5 bis 9 aus `docs/ZEITERFASSUNG-PLAN.md`: die eigenen Zeiten
sehen, Soll gegen Ist im Schichtplan, Korrekturen mit Grund, die
Abdeckung („wie lange war der Laden unbeaufsichtigt"), das
Arbeitszeitkonto, der Lohn-Export, das Urlaubskonto.

**Und eine Entscheidung, die jetzt ansteht und nicht später:** mit der
Zeiterfassung steht StudioChat zum ersten Mal im selben Regal wie Ordio
und Papershift. Die 15–25 € je Studio waren für ein
Organisationswerkzeug angesetzt.

---

# Runde 81 — Meine Zeiten, jeder am Terminal, und ein Index, der in der Produktion umgefallen wäre

15. September 2026

## Der teuerste Fund der Runde stand in eigenem Code

`stempeln` fragte:

```js
.where('uid','==',uid).where('tag','==',tag).orderBy('ts','desc').limit(1)
```

Firestore verlangt dafür einen **zusammengesetzten Index**: sobald
Gleichheitsfilter mit einer Sortierung auf einem anderen Feld
zusammenkommen, reichen die Einzelfeld-Indizes nicht mehr. Dieses
Projekt verwaltet keinen einzigen — es gibt keine
`firestore.indexes.json`, und `firebase.json` rollt nur Regeln aus.

**Der Emulator legt fehlende Indizes stillschweigend an. Die Produktion
nicht.** Der allererste echte Stempel wäre mit `FAILED_PRECONDITION`
gescheitert — und zwar nach grüner Regression, grüner CI und grünem
Deploy.

Im ganzen `index.html` gibt es aus genau diesem Grund keine einzige
Abfrage mit `where` **und** `orderBy`; die Notiz bei `papierkorbLaden`
sagt es seit Langem. Die Stempel-Funktion war die eine Stelle, die
ausscherte, und ich habe sie selbst geschrieben.

Behoben: die Handvoll Einträge eines Tages holen, das Maximum in JS
suchen. **Nachweisen liess sich der Fehlschlag nicht** — der Emulator
kennt die Grenze gar nicht. Beleg ist die Firestore-Dokumentation,
nachgeschlagen am 14.9., nicht eine Messung. Das gehört dazugesagt.

## Schritt 5: Meine Zeiten

Im Ich-Bereich, direkt unter der Stempel-PIN. Monat blättern, Tag
antippen, die einzelnen Stempel aufklappen.

**Gelesen wird monatsweise über zwei Gleichheitsfilter (`uid`, `monat`)
und ohne `orderBy`** — aus demselben Grund wie oben. Deshalb schreibt
`stempeln` jetzt ein Feld `monat` mit.

**Ein Tag ohne Feierabend bekommt keine Zahl.** Er zeigt „Feierabend
fehlt" und einen Strich. Eine gerechnete Null wäre bequemer und wäre
gelogen: sie behauptet „null Stunden gearbeitet", wo in Wahrheit die
Endzeit fehlt. Der laufende Tag zählt bis jetzt und sagt „läuft".

## Jeder im Betrieb kann an jedem Terminal stempeln

Auf Wunsch von Semih. Vorher filterte das Terminal auf das Studio des
Geräts — und verbot damit den häufigsten ehrlichen Fall: wer eine
Schicht woanders übernimmt, konnte dort nicht stempeln und stand mit
einem Tag ohne Zeiten da.

Was das kostet, und das gehört gesagt: mit Geräteschlüssel **und** PIN
lässt sich jetzt an jedem Terminal des Betriebs für eine Person
stempeln, nicht nur an denen ihres Studios. Beide Schlüssel braucht es
weiter, und die PIN kennt nur sie selbst. Wer von auswärts stempelt,
steht mit `fremd: true` im Datensatz — sichtbar, nicht still.

Die Liste zeigt die eigenen Leute zuerst, alle anderen darunter mit
ihrem Studio. Das Suchfeld erscheint erst, wenn die Kacheln nicht mehr
auf einen Bildschirm passen — **gemessen (`scrollHeight > clientHeight`)
und nicht ab einer ausgedachten Personenzahl**.

## Eine Prüfung, die ihre eigene Behauptung nie gemessen hat

Im Kopf von `test-terminal.js` stand: „zeigt nur Leute DIESES Studios".
Als der Filter fiel, blieb der Durchlauf **grün** — die Zeile war ein
Kommentar und keine Prüfung. Aufgefallen ist es nur, weil ich die
Gegenprobe gemacht habe.

Dieselbe Lehre wie in Runde 80, jetzt zum zweiten Mal: *eine Gegenprobe,
die nicht rot wird, ist ein Befund und kein Ergebnis.* Jetzt stehen
sieben Zusicherungen dort, wo vorher ein Satz stand.

## Vier Schönheitsfehler, gefunden beim Ansehen der eigenen Bilder

Nicht beim Schreiben — beim Nachsehen von Bildschirmfotos aus der
laufenden App:

1. **„Stempeln" sah aus wie „Löschen"** — beide trugen `.tm-taste.weg`,
   also dieselbe graue Bauform. Der bestätigende Knopf wie der
   abräumende, nebeneinander, am Empfang im Vorbeigehen.
2. **Die Kacheln klebten oben links** in einer leeren Fläche. Jetzt
   `align-content: safe center` (im Chromium nachgemessen: unterstützt),
   mit `@supports`-Rückfall.
3. **150px Kachelbreite liess jeden zweiten Namen umbrechen** („Juna /
   Ritter"). Mit 220px vier Spalten und einzeilige Namen — nachgemessen:
   alle 40 Namen 18px hoch.
4. **Die Demo mahnte zur E-Mail-Bestätigung.** `emailVerified` fehlte
   schlicht im Demo-Konto, und die Leiste prüft auf wahr. In einer
   Vorführung ohne Konto ist das Unsinn, und es stand quer über dem
   ersten Eindruck.

Dazu: das Demo-Konto des Tablets hiess „Empfang Hürth" und stand damit
als erste Kachel zwischen den Mitarbeitern, als wäre das Tablet eine
Person. Heisst jetzt wie ein Mensch.

## Die AV-Unterlagen sagten die Unwahrheit

In `docs/av/LOESCHKONZEPT.md` stand unter „Was die App bewusst NICHT
speichert": **„Keine Zeiterfassung."** Seit PR #123 falsch — und in
einer Unterlage, die zum Anwalt und zum Kunden geht, ist das der
schlimmste Satz von allen: eine Zusage, die der Betrieb nicht hält.

Ersetzt durch eine Aufstellung, was erfasst wird und was nicht,
einschliesslich des Teils, der weiter gilt: **keine Standortdaten.**
Dazu ein neuer Abschnitt 3.2 im Verarbeitungsverzeichnis mit den zwei
Hinweisen, die dem Verantwortlichen gehören und nicht uns — § 87 Abs. 1
Nr. 6 BetrVG und die Information nach Art. 13.

Und eine Frist, die **offen bleibt und offen genannt wird**: wie lange
Stempelzeiten aufbewahrt werden, ist nicht von uns zu setzen.

## Geprüft

* `test-meine-zeiten` (neu): Karte, Monatssumme, Tage · **Tag ohne
  Feierabend bekommt keine Zahl** · Aufklappen zeigt die Stempel ·
  Fingerziel 44px · **die Abfrage benutzt kein `orderBy`** · **0
  Schreibvorgänge** aus dem Browser · Monat zurück fragt den richtigen
  Monat ab · „Heute" führt zurück
* Zwei Gegenproben, beide rot: Lücken-Kennzeichnung entfernt → „steht
  mit einer Zahl da, die es nicht gibt"; `orderBy` eingesetzt → der
  Index-Satz
* `test-terminal` um sieben Zusicherungen erweitert; Gegenprobe
  (Studio-Filter zurück) → drei rote Zeilen
* `test-demo`, `test-knoepfe`, `test-gestaltung`, `test-abgeschnitten`,
  `test-quer`, `test-fingerziele`: grün

## Was jetzt fehlt

Schritt 6 bis 9 aus `docs/ZEITERFASSUNG-PLAN.md`. Und aus dem Gespräch
vom 15.9. zwei Punkte, die Semih ausgewählt hat:

* **QR-Code am Studio** — ein wechselnder Code, den man mit dem eigenen
  Handy scannt. Keine Standortdaten, kein Eingriff in die AV-Unterlagen.
* **Freigabe je Konto** — der Chef erlaubt bestimmten Konten das
  Stempeln ohne Terminal; wo gestempelt wurde, wird festgehalten und
  nicht geprüft.

Gegen GPS hat er sich entschieden, nachdem drei Dinge auf dem Tisch
lagen: Browser-GPS ist in Minuten gefälscht, die AGB sind für
Beschäftigtendaten der falsche Hebel, und „Keine Standortdaten" steht
als Zusage in drei Unterlagen plus einer Kopfzeile.

---

# Runde 82 — Stempeln mit dem eigenen Handy

15. September 2026

Semih hatte gefragt, ob bestimmte Konten auch ohne Tablet stempeln
können, „wenn sie an einem bestimmten Ort sind" — und vorgeschlagen,
das über GPS zu lösen und „einfach in den AGB" zu ändern.

## Drei Dinge lagen vor der Entscheidung auf dem Tisch

1. **Browser-GPS ist in Minuten gefälscht** (Entwicklerwerkzeuge,
   Mock-Location-Apps). Es leistet gerade nicht, wofür das Tablet da
   ist.
2. **Die AGB sind der falsche Hebel.** Das sind Daten der
   *Beschäftigten*, nicht der Kunden. Ein Vertrag zwischen StudioChat
   und dem Betrieb erlaubt keine Verarbeitung von Beschäftigtendaten;
   dafür braucht es eine Rechtsgrundlage, Information nach Art. 13 und
   — wo ein Betriebsrat besteht — Mitbestimmung nach § 87 Abs. 1 Nr. 6
   BetrVG.
3. „Keine Standortdaten" steht als Zusage in drei Unterlagen plus einer
   Kopfzeile.

Gewählt wurden daraufhin Weg 1 und 4: **Code am Studio** plus
**Freigabe je Konto**.

## Sechs Ziffern statt eines QR-Bildes

Eine bewusste Abweichung von „QR-Code", und sie ist vorgelegt worden,
nicht stillschweigend gemacht. Ein QR bräuchte eine Bibliothek; die CSP
lässt keine fremden Skripte zu, und ein eigener Erzeuger wären
zweihundert Zeilen ohne Gewinn.

**Der Code ist das Geheimnis, nicht seine Darstellung.** Sechs Ziffern
abtippen dauert vier Sekunden, braucht keine Kamera-Freigabe und
funktioniert auf jedem Telefon. Ein QR lässt sich später darüberlegen —
mit demselben Verfahren dahinter.

## Die Entscheidung mit den meisten Folgen: wo die Saat liegt

Naheliegend wäre gewesen, die Codes aus dem Hash des Geräts abzuleiten
— kein neues Feld, keine neue Sammlung.

**Das wäre ein Loch gewesen.** `terminals` darf die Leitung lesen (32
zufällige Bytes, ihr Hash lässt sich nicht durchprobieren — so steht es
in den Regeln, und das ist richtig). Folgten die Codes daraus, könnte
die Leitung sie zu Hause ausrechnen und ihr Team von überall stempeln
lassen. **Genau die Person mit dem stärksten Motiv und dem leichtesten
Zugang.**

Die Saat liegt deshalb in `terminalCodes`, für alle gesperrt — derselbe
Ort und derselbe Grund wie bei `zeitPins`. Lesen muss sie niemand: das
Terminal holt fertige Codes.

## Ein Vorrat statt eines Aufrufs je Fenster

Bei 30 Sekunden wären das 2880 Funktionsaufrufe je Tablet und Tag. Der
Vorrat deckt zehn Fenster, nachgeholt wird bei drei übrigen. Wird ein
Tablet gestohlen, sind höchstens fünf Minuten an Codes darin — nicht
mehr, als das Gerät ohnehin hergibt.

**Die Uhr des Servers zählt**, nicht die des Tablets: ein Rechner am
Empfang geht gern falsch, und dann zeigt er einen Code, den der Server
längst vergessen hat.

## Die Falle, die ich vorab notiert hatte — und die es wirklich gab

`firestore.rules` sperrt beim Selbst-Bearbeiten `role`, `aktiv`,
`studioKeys` und andere. **`handyStempeln` gehört in dieselbe Liste.**
Ohne das schaltet sich jede Person die Freigabe in der Browser-Konsole
selbst frei, und die Freigabe des Chefs ist eine Anzeige ohne Schloss.

Gegenprobe gemacht: Feld aus der Sperrliste genommen → zwei rote
Zeilen, genau die richtigen.

## Ein eigener Fehler beim Werkzeuggebrauch, zum zweiten Mal

Eine Perl-Ersetzung mit `(?:💪|⚡|🔥)` — einer **nicht-fangenden**
Gruppe. `$2` war leer, und vier Emoji wurden gelöscht. Gefunden, weil
ich den Diff gelesen habe statt nur den Trefferzähler.

Dieselbe Lehre wie am 14.9. mit `$(`: *eine Ersetzung, die Quelltext
erzeugt, gehört danach durch einen Parser und durch den Diff — nicht
nur durch `grep -c`.* Beim zweiten Mal ist es keine Einzelheit.

## Und eine Messung, die den Zufall mitgemessen hat

Mein Durchlauf las den Meldungskasten einen Moment nach dem Stempeln —
da stand schon die Aufgaben-Erinnerung der App darin. Gemeldet wurde
ein Fehler, den es nicht gab. Jetzt werden **alle** Meldungen über
einen MutationObserver mitgeschrieben. Eine Messung, die auf den
richtigen Moment angewiesen ist, misst den Zufall mit.

## Geprüft

* `test-handy-stempeln` (neu): ohne Freigabe **keine Karte** · mit
  Freigabe Feld und Knopf · zu kurzer Code erreicht den Server **nicht**
  · Stempel geht über die Funktion, **0 Schreibvorgänge** in `zeiten` ·
  das Terminal **holt** den Code (rechnet ihn nicht) und weist sich dabei
  mit dem Gerätegeheimnis aus · **ohne Antwort bleibt die Anzeige leer**
  · der Haken beim Chef ist 44px und wird gespeichert
* Drei Gegenproben, alle rot: Karte immer sichtbar · Längenprüfung
  entfernt · Anzeige ohne Antwort
* `tests/rules/zeitpin.test.js`: **90 Zusicherungen** (vorher 68).
  Zwei Gegenproben rot: Saat für die Leitung geöffnet → vier Zeilen;
  `handyStempeln` aus der Sperrliste → zwei Zeilen
* Die Code-Erzeugung einzeln nachgerechnet: deterministisch,
  sechsstellig, und bei 20 000 Fenstern 19 796 verschiedene Codes — die
  204 Kollisionen sind genau der Geburtstagswert für eine
  Gleichverteilung über 10^6

## Was dieser Weg nicht verhindert

Wer den Code abfotografiert und weitergibt, kann innerhalb des Fensters
von woanders stempeln. Steht so im Code, im Plan und gehört ins
Verkaufsgespräch — genau wie beim Tablet, wo ein Kollege mit bekannter
PIN mitstempeln kann.

---

# Runde 83 — was der Kunde sah, und was drei eigene Messfehler beinahe daraus gemacht hätten

15. September 2026

Diese Runde kam nicht aus dem Plan, sondern aus zwei Sätzen aus dem
Betrieb:

> „so einige Tasten [gehen] nicht immer, wie beim Terminal das zurück"
> „die Übersicht ist schlecht und nicht organisiert … man muss jede
> Funktion suchen … fünf Klicks für Gruppen-Chats"

## Der teuerste Fund: drei tote Knöpfe am Terminal

Die Bindungen für „‹ Zurück", das Suchfeld und **„Terminal beenden"**
standen in `if(session.role==='chef')`, zusammen mit dem *Einrichten*
von Terminals. Das Einrichten gehört dorthin, das *Bedienen* nicht: ein
Terminal läuft mit einem ganz normalen Mitarbeiter-Konto.

Auf jedem echten Gerät hiess das: wer sich vertippt, kommt aus der
PIN-Maske nicht mehr heraus; bei vierzig Leuten findet man niemanden;
und **das Tablet kommt nie wieder aus dem Stempel-Modus** — der einzige
Ausweg wäre gewesen, den Browserspeicher zu löschen.

**Warum kein Durchlauf es fand:** `test-terminal.js` lief mit
`stub-chef.js`, also mit der einen Rolle, die ein Terminal nie bedient.
Attrappen für Leitung und Mitarbeiter gibt es seit Langem; dieser
Durchlauf nutzte sie nicht.

Dazu der **fünfte Fall derselben Attrappen-Lücke**, diesmal in
`stub-mitarbeiter.js`: `users` kannte nur `onSnapshot`, nicht `get()`.
Der Hinweis dazu steht seit dem vierten Fall in `stub-chef.js` — er half
nicht, weil ihn niemand liest, der die *andere* Datei bearbeitet.

## Zwei Leisten versteckten die halbe App

Gemessen als Chef auf 390px: unter „Betrieb" waren von sechs Reitern
**drei** zu sehen (381px Überhang), im Chat von fünfzehn Kanälen
**drei** (1107px). Material, Geräte, Probetraining und Dokumente
standen ausserhalb des Bildes — man musste *wissen*, dass es sie gibt.

Gelöst mit **dreimal demselben Muster**: neben der Leiste ein Knopf, der
eine senkrechte Liste öffnet. „Alle" bei den Reitern, „Alle Kanäle" im
Chat (Studios *und* Gruppen untereinander, mit Suche), „Alle Studios"
als Chip in den Aufgaben. Der Knopf erscheint **nur bei Überlauf**,
gemessen über einen ResizeObserver.

Dreimal dasselbe Muster ist eine Hausregel; drei verschiedene Lösungen
für dasselbe Problem wären drei Dinge zum Lernen gewesen.

## Zwei eigene Entwürfe, beide von Durchläufen widerlegt

**Der Reiter-Umbruch.** `flex-wrap:wrap` zeigte alle sechs — und schob
den Inhalt auf 429px. `test-rahmen` wurde rot und hatte recht: den
Durchlauf gibt es, **weil** die erste Aufgabe einmal bei 407px begann.

**Das Raster über der Aufgabenliste.** Es schob die erste *überfällige*
Aufgabe auf y=2017. `test-aufgaben-bereich4` wurde rot und hatte recht:
die Liste sortiert längst nach Dringlichkeit — eine zweite Übersicht
darüber hat den Überblick **verdeckt**, nicht gegeben.

Beide Male derselbe Denkfehler: *alles zeigen, indem man den Inhalt aus
dem Bild drückt, gewinnt nichts.*

Und beide Male hatte ich vorher falsch geplant: ich wollte eine
Studio-Übersicht **bauen**, die es längst gab (in der Verwaltung, hinter
einem Falz). Was fehlte, war nicht der Überblick, sondern das
**Eingrenzen** — 238 Bedienelemente auf zwölf Bildschirmhöhen werden 37,
und die erste Aufgabe bleibt bei y=165.

## Drei Messfehler, keiner davon ein Befund

Sie hätten fast **siebzig erfundene Defekte** ergeben:

1. Fenster mit `style.display='flex'` geöffnet — ein Inline-Stil schlägt
   die Klasse `.show`, also blieben sie beim Schliessen „offen".
   16 falsche Funde.
2. Den **gemalten Kasten** gemessen statt der Trefferfläche. `.lb-close`
   ist 40px gemalt und 44px zu treffen (`::after`).
3. **Mitten in die Aufklapp-Animation** gemessen: eine skalierte Kiste
   meldet 41 statt 44. 54 Funde schrumpften danach auf 15.

Übrig blieb **ein** echter: die Studio-Ankreuzzeilen waren 36px statt
44.

> **Die Lehre, und sie ist unbequemer als die Funde:** wenn eine Messung
> *sehr viele* Fehler auf einmal meldet, ist der erste Verdacht die
> Messung. Sechzehn kaputte Schliessen-Knöpfe in einer App, die täglich
> benutzt wird, hätte längst jemand gemeldet.

## Zwei kaputte Ansichten in der Demo — im Verkaufswerkzeug

Gefunden vom neuen Abschnitt in `test-demo.js`, der jede Ansicht jeder
Rolle einmal öffnet:

* **Material war in der ganzen Demo leer.** `loadMaterial` liest
  `doc.metadata.hasPendingWrites`; die Demo baute Dokumente ohne
  `metadata`.
* **`readBy.indexOf is not a function`** bei Leitung und Mitarbeiter.
  Die Demo erzeugte `FieldValue`-Marken und löste sie nie ein:
  `arrayUnion` schrieb ein leeres Objekt ins Feld.

> Eine Attrappe, die eine Marke erzeugt und nicht einlöst, ist
> schlimmer als eine, die die Funktion gar nicht kennt — der Aufruf geht
> scheinbar durch und hinterlässt Unsinn.

## Ein Durchlauf, der grün war, ohne zu messen

`test-ueberblick` las `#studioGrid` global. Während des Umzugs war das
ein **verstecktes** Element — grün, ohne Aussage. Er prüft jetzt zuerst
die Sichtbarkeit.

## Und ein Verstoss gegen die eigene Regel

Ich habe während eines laufenden Durchlaufs an `index.html`
weitergearbeitet. Ergebnis: sieben rote Zeilen, von denen **eine** echt
war — die übrigen sechs maßen eine halb umgebaute Datei mit veralteten
CSP-Hashes. Ich hatte dem Benutzer zuerst „sieben" gemeldet und musste
es auf „eine" korrigieren.

*Ein Durchlauf, dessen Dateien sich unter ihm ändern, misst nichts.*
Steht seit August in dieser Datei. Heute selbst gebrochen.

## Die Squash-Falle, zum zweiten Mal

PRs werden als Squash gemergt; der Zweig steht danach im Konflikt mit
`main`. Und für einen konfliktbehafteten PR bildet GitHub **keinen
Merge-Commit** — also startet es die `pull_request`-Läufe **gar nicht
erst**. `total_count: 0`, keine Fehlermeldung, sieht aus wie „läuft
noch".

Zweimal dasselbe heisst: es gehört in die Doku, nicht ins Gedächtnis.
Steht jetzt in `docs/DEPLOY.md`, mit Befehlen und dem einen Ort, an dem
GitHub es überhaupt sagt (`mergeable_state: "dirty"`).

## Geprüft

* `test-navi-sichtbar` (neu): 3 Rollen × 3 Breiten — keine Leiste darf
  Einträge **ohne Ausweg** verstecken, und der Ausweg darf nicht
  dastehen, wenn alles passt. Gegenprobe → vier rote Zeilen mit den
  versteckten Einträgen beim Namen
* `test-terminal` um einen Abschnitt **als Mitarbeiter** erweitert;
  Gegenprobe → drei rote Zeilen
* `test-demo` geht jede Ansicht jeder Rolle durch
* `test-ueberblick`: Sichtbarkeit, Eingrenzen, Weg zurück
* **Volle Regression: 108 grün · 0 rot · 0 ohne Ausgabe**
* **Regel-Durchläufe: 234 Zusicherungen, 0 gefallen**

## Was offen bleibt

Schritt 6 bis 9 der Zeiterfassung. Und die Frage, die keine Messung
beantwortet: **ob es sich jetzt besser anfühlt.** Gemessen ist, dass
nichts mehr hinter einer Wischbewegung liegt und dass der Chef von 238
auf 37 kommt. Ob das reicht, sagt der Kunde.

---

## Runde 84 — Das neue Design, hinter einem Schalter

**Anlass**, wörtlich aus dem Betrieb:

> „es sieht alles gleich aus ich will das man einen unterschied schon
> erkennt und das es halt schön geordnet ist wenn es sein muss können wir
> auch das ganze grund gerüst ändern aber es soll übersichtlich wirken
> sodass es ein klein kind verstehen würde"

und, während der Umbau schon lief:

> „merge alles DIREKT aber NUR auf der demo weil ja grade auch andere die
> app benutzen und wenn irgendwas doch falsch ist soll es nicht direkt
> alles ändern sondern mit einem klick veröffentlicht werden"

Die zweite Nachricht bestimmt die Bauform der ersten.

### Was gemessen wurde, bevor etwas geändert wurde

Chef, 390×844, Demo:

| Befund | Wert |
|---|---|
| Erster echter Inhalt auf Start | y ≈ 240 |
| „HALLO, DEMO-GESCHÄFTSFÜHRUNG" über zwei Zeilen | ≈ 150px |
| Flächenarten auf Start | eine — dieselbe weisse Karte für Einrichtung, Warnung und jede Aufgabe |
| Unterscheidbarkeit Start / Betrieb / Team | nur an der Leiste unten |

Der Befund war nicht „hässlich", sondern **alles gleich laut**. Wenn
nichts hervorsticht, muss man lesen statt sehen.

### Der Schalter — zuerst gebaut, absichtlich

Das gesamte neue Aussehen hängt an **einer** Klasse am `body`: `neu`.
Ohne sie greift keine einzige neue CSS-Regel und kein neuer Zweig in der
Navigation. Die App im Studio bleibt Zeile für Zeile die bisherige.

Vier Quellen, die erste die etwas sagt gewinnt:

1. `?neu=1` / `?neu=0` in der Adresse — zum Vergleichen in zwei Tabs
2. Dieses Gerät (`localStorage`) — „für mich ausprobieren"
3. Demo-Modus — dort immer an
4. `config/design.neu` — **der eine Klick für alle**

Bedient wird das in **Verwaltung → System → Neues Design**. Zwei Knöpfe:
auf diesem Gerät ausprobieren, und für alle veröffentlichen (mit
Rückfrage, und derselbe Knopf nimmt es zurück). Die Karte nennt
ausserdem, *woher* die gerade sichtbare Antwort kommt — ohne das drückt
jemand „für alle" und bei ihm ändert sich nichts, weil sein
Geräteschalter dagegensteht.

Regeländerung: **keine**. `match /config/{doc}` erlaubt Lesen für jeden
Aktiven und Schreiben nur dem Chef — in beiden Welten, flach und unter
`inFirma(f)`.

`designLaden()` hat ein `try/catch` um den **Aufruf**, nicht nur ein
`.catch` um das Versprechen: bricht `S()` selbst ab, flöge der Fehler
synchron und das `Promise.all` beim Start würde mit ihm platzen. Eine
App, die wegen eines Design-Schalters gar nicht erst startet, wäre der
teuerste denkbare Fehler an dieser Stelle.

### Was der Nutzer ausgewählt hat

Vier Fragen, vier Antworten — alle vier sind umgesetzt:

| Frage | Antwort |
|---|---|
| Wie tief? | **Auch das Grundgerüst** |
| Unterschied woran? | **Farbe + grosse Symbole** |
| Startseite? | **Was heute dran ist** |
| Dichte? | **Weniger und grösser** |

### 1. Untere Leiste: vier statt sechs

`Start · Aufgaben · Nachrichten · Mehr`. „Ich", „Team" und „Verwaltung"
liegen in einer **Lade**, die aus der Leiste nach oben ausfährt — grosse
beschriftete Zeilen mit Zweitzeile, keine Symbole.

Warum überhaupt: sechs Knöpfe waren auf 320px exakt 44px breit — die
Untergrenze für einen Daumen, und es war nichts übrig.

Die Lade ist **Teil der Leiste**, kein eigenes Fenster: ein Fenster wäre
ein dritter Ort gewesen, an dem Navigation stattfindet. Sie schliesst
über denselben Knopf, beim Tippen daneben und mit Esc.
`position:absolute` hält sie ausserhalb des Flusses — sonst verschöbe
sie beim Öffnen die Knöpfe, und der gleitende Marker (er misst
`offsetTop`) sässe daneben.

Zwei Dinge, die sonst still gebrochen wären und deshalb ausdrücklich
nachgezogen sind: „Mehr" trägt die Marke, wenn man in einem Bereich
dahinter steht (sonst zeigt die Leiste nirgendwohin), und „Mehr" erbt
den ungelesen-Punkt von allem, was dahinter liegt.

### 2. Bereichsfarbe und grosses Zeichen

Sechs Töne, einer je Bereich, durchgezogen durch Kopf, Reiterleiste und
die gleitende Füllung unten.

**Keiner davon ist eine Statusfarbe.** Der erste Anlauf nahm
`rgba(52,211,153,…)` für Nachrichten und `rgba(251,191,36,…)` für
Aufgaben — also exakt `--ok` und `--warm`. `test-gestaltung` hat das
gefunden, und der Durchlauf hatte recht: eine grüne Fläche, die nicht
„in Ordnung" heisst, und eine gelbe, die nicht warnt, machen die
Statusfarben bedeutungslos. Ersetzt durch Teal, Orange und Pink.

Der **Bereichskopf** (≈89px) ersetzt auf dem Handy die Überschrift der
einzelnen Seite — die steht ohnehin im Reiter darunter, und zweimal
dasselbe kostet nur Höhe. Er rückt beim Scrollen zusammen. Der
„+ Neu"-Knopf wandert in ihn hinein: davor stand er allein in einer
sonst leeren Zeile, 56px für ein Bedienelement. Umgehängt wird das echte
Element, nicht eine Kopie — sein Klick-Zuhörer hängt daran.

Die Unterzeile zählt nur dort, wo Zählen eine Handlung auslöst: offene
und überfällige Aufgaben, ungelesene Nachrichten. Wo sich nichts zählen
lässt, das sich auch ändert, steht ein Satz. Eine Zahl, die immer
dieselbe ist, liest nach zwei Tagen niemand mehr.

### 3. Startseite: was heute dran ist

Überfällig zuerst (mit Namen, Studio und „seit N Tagen"), dann heute,
dann Ungelesenes. Höchstens drei plus vier, der Rest als „und N
weitere". Jede Zeile führt dorthin, wo man die Sache erledigt.

Der Unterschied zu den Kachel-Zahlen ist nicht die Form, sondern die
Aussage: „3 überfällig" nennt eine Menge und verlangt einen zweiten
Klick, um zu erfahren welche.

**Gemessen und korrigiert:** zuerst stand die Liste hinter der
Einrichtungskarte — die erste überfällige Aufgabe begann bei **y=682**,
auf einem 844er-Handy fast unten. Jetzt steht sie ganz oben, y=230 (davon
44 die Demo-Leiste, die es in der echten App nicht gibt). Die
Einrichtung ist eine Sache von einmal, die überfällige Aufgabe eine von
jedem Morgen.

Der Hinweisbalken „N Aufgaben sind überfällig" entfällt im neuen Design:
die Liste darüber nennt jede davon beim Namen, und Wiederholung ist
genau die Unruhe, gegen die umgebaut wurde.

### 4. Weniger und grösser

Statt hundert Einzelregeln ist die **Stufenleiter selbst** verschoben —
sieben Schriftgrössen an einer Stelle, ~7 % höher, und alles was sie
benutzt wächst mit. Dazu `--zeile: 64px` als Mindesthöhe jeder
antippbaren Zeile und mehr Luft in den Karten.

### Geprüft

`tests/test-neu-design.js` (neu). Der erste Abschnitt misst **das
bisherige Design ohne Schalter** — sechs Knöpfe, keine Lade, kein
Bereichskopf, leere Heute-Liste, sichtbare Seitenüberschrift. Wäre der
rot, wäre alles andere egal.

Danach: jede der sechs Gruppen ist auf dem Weg erreichbar, den ein
Mensch geht (die drei hinter „Mehr" über „Mehr", nicht per Direktklick
auf ein verstecktes Element); jeder Bereich hat eine eigene Farbe und
keine zwei teilen sich eine; jede Startzeile ist ≥64px hoch, nennt die
Sache beim Namen und führt irgendwohin; die Zahl im Bereichskopf wird
gegen die Liste darunter nachgezählt; die Lade hat drei Wege hinaus.
Zuletzt drei Rollen × drei Breiten (320/390/430): Trefferflächen über
`elementFromPoint`, kein Überhang, kein abgeschnittenes Wort, kein
seitliches Scrollen.

### Zwei eigene Fehler, beide von Durchläufen gefunden

**1. `classList.toggle(name, undefined)` schaltet um, statt zu setzen.**
`designAnwenden()` läuft absichtlich sehr früh, und zu dem Zeitpunkt ist
`_designNeu` zwar hochgezogen, aber noch nicht zugewiesen — also
`undefined`. Die bisherige App bekam dadurch für einige hundert
Millisekunden die Klasse `neu`. Unsichtbar hinter dem Startbild, aber
lang genug, dass die untere Leiste in diesem Fenster vermessen wurde;
die gleitende Füllung stand danach dauerhaft auf x=0 statt x=4.

`test-marker` hat es gefunden, und **nur** in der Fassung mit „Bewegung
reduzieren" — dort blendet das Startbild zu einem anderen Zeitpunkt aus,
und deshalb fiel die Messung genau in dieses Fenster. Der Unterschied
zwischen einem Fehler, der in einer von zwei Fassungen auftritt, und
keinem Fehler ist keiner.

Die Lehre ist grösser als die Zeile: **eine Zusage, die an einem
`undefined` hängt, ist keine Zusage.** Der ganze Sinn des Schalters war
„live ändert sich nichts", und genau das hat er kurzzeitig gebrochen.
`layoutNeu()` gibt jetzt immer einen Wahrheitswert zurück, und
`designAnwenden()` erzwingt ihn noch einmal.

Zwei falsche Erklärungen standen vorher im Weg — „buildNav vergisst
`active`" und „der Vorfahr ist versteckt". Beide klangen plausibel,
beide waren falsch, und beide hätten sich durch Nachdenken nicht
widerlegen lassen. Widerlegt hat sie erst eine Spur, die JEDE
Schreibung von `--ind-x` samt Aufrufstapel mitschrieb. **Wer rät, prüft
nicht.**

(Was aus der ersten falschen Erklärung übrig blieb, ist trotzdem
richtig: `buildNav()` markiert jetzt am Ende selbst, statt sich darauf
zu verlassen, dass jemand danach `showView` ruft — `featuresAnwenden()`
tat das nämlich nie.)

**2. Bereichsfarben, die Statusfarben besetzen.** Siehe oben —
`test-gestaltung`. Der Durchlauf hatte recht, und zwar aus einem Grund,
den ich beim Aussuchen der Farben schlicht nicht bedacht hatte.

### Ein dritter Fund — und eine Lücke in den Durchläufen selbst

Die stehende Regel aus dem Betrieb lautet: **vor neuen Knöpfen erst
messen** (`.claude/skills/knoepfe`). Angewandt auf die neue untere
Leiste hat sie sofort etwas gefunden — aber erst, nachdem klar war,
dass die Messung so, wie sie lief, gar nichts über das neue Design
sagen konnte.

`test-abgeschnitten` startet die App **ohne Schalter**. Er misst also
die Schriftgrössen von gestern und ist grün, egal was unter `neu`
passiert. Mit `?neu=1` gestartet fand er im Team-Bereich sofort:

    WAAGERECHT  .scroll-area  327 > 320 px  · bei 320 px · team
                „Wartet auf deine Entscheidung"

`.sec-head span` trägt `white-space:nowrap`, Versalien und `--ls-l`.
Mit der um eine Stufe höheren Schrift passt das auf einem 320er-Gerät
nicht mehr. Behoben durch Umbrechen-Erlauben, nicht durch eine engere
Laufweite: die hätte genau dieses eine Wort gerettet und beim nächsten
längeren wieder versagt.

Die eigentliche Lehre ist aber nicht die CSS-Zeile, sondern:

> **Ein Durchlauf prüft nur das, was er zu sehen bekommt.** 109 grüne
> Durchläufe sagten nichts über das neue Design aus, weil keiner von
> ihnen es je geladen hat.

Deshalb gibt es jetzt `tests/test-neu-messlatte.js`: dieselben drei
Messungen, die von Geometrie handeln — abgeschnitten, Knöpfe, seitwärts
schieben — laufen ein zweites Mal mit `?neu=1`. Die übrigen prüfen
Verhalten, und das ändert der Schalter nicht.

Gegenprobe gemacht: Regel entfernt → rot (327 > 320), Regel zurück →
grün. Ein Prüfer, der nie anschlägt, prüft nichts.

---

## Runde 85 — Die Grundstruktur, nicht das Aussehen

**Anlass**, wörtlich, nachdem Runde 84 ausgeliefert war:

> „du hast jetzt alles grösser gemacht und so aber es ist nichts an der
> struktur anders wie wäre es wenn wir dafür sorgen das es mehr an der
> seite zum tippen gibt und ein kleinkind sich wirklich gut zurecht
> finden würde und damit meine ich NICHT das es kindlicher aussieht
> sondern die GRUNDSTRUKTUR besser gestalltet ist und es damit um
> wellten leichter ist zu navigieren unabhängig von suchfeldern"

Er hatte recht. Sechs Knöpfe auf vier zu kürzen ist eine Umsortierung
desselben Baums, kein neuer Baum. Runde 84 hat das Aussehen geändert und
die Struktur angefasst, ohne sie zu verbessern.

### Gemessen, bevor etwas geändert wurde

Alle 24 Ziele der App als Chef auf 390px durchgeklickt, jeder Weg
gezählt:

| | |
|---|---|
| Ziele | 24 |
| davon mit 3+ Tipps | **15** |
| verschiedene Bedienarten | **6** |
| Reiter unter „Aufgaben" sichtbar | **2 von 6** |

Die letzte Zeile ist der eigentliche Befund. **Material, Geräte,
Probetraining und Dokumente gab es auf dem Bildschirm nicht.** Man
musste wissen, dass es sie gibt, und dann eine Leiste zur Seite wischen.
Das ist nicht „unübersichtlich" — das ist eine App, die ihren eigenen
Inhalt versteckt. Und „Betrieb" als Name ist ein Eimer, kein Wegweiser:
wer fragt „wo melde ich ein kaputtes Gerät?", kommt über „Aufgaben →
wischen → Geräte" nie an.

### Was der Nutzer ausgewählt hat

| Frage | Antwort |
|---|---|
| Wo soll die eine Liste sitzen? | **Beides** — Schublade und eigene Seite |
| Was wird aus den Reitern oben? | **Bleiben als Abkürzung**, aber alle sichtbar |
| Wie heissen die Überschriften? | **Als Frage** |

### Gebaut

**Eine Liste, „Alles".** Jedes Ziel der App, gruppiert nach der Frage,
mit der man kommt: *Was soll ich tun? · Was ist im Studio? · Wer
arbeitet wann? · Was gibt es Neues? · Meine Sachen · Verwalten.* Jede
Zeile trägt Zeichen, Namen, einen Satz wozu, und eine Zahl, wo es eine
gibt.

Sie liegt an zwei Orten und wird von **einer** Funktion gezeichnet: als
Seite hinter dem vierten Knopf unten, und als Schublade über der Seite,
auf der man gerade steht. Zwei Wahrheiten wären eine zu viel.

**Der Griff ist die Kopfzeile des Bereichs.** Das war „mehr an der seite
zum tippen": gemessen 374×85 Pixel auf einem 390er-Gerät — das grösste
Ziel auf dem Bildschirm, auf jeder Seite an derselben Stelle. Dazu Esc,
Tippen daneben, das Kreuz, und Wischen vom linken Rand.

**Abgeleitet, nicht abgeschrieben.** Die Einträge kommen aus `FEATURES`
(Team-Reiter), `chefTabsFuerMich()` (Verwaltung) und `NAV`. Eine zweite,
von Hand gepflegte Liste würde beim ersten neuen Reiter auseinander­
laufen, und zwar still.

**Die „Mehr"-Lade aus Runde 84 ist weg.** Sie war eine eigene Bedienart
für drei Ziele und hat die Tiefe nicht verringert, sondern verschoben.

**Die Reiterleiste bricht um statt zu schieben.** Alle sechs sind
sichtbar, auf 320, 390 und 430 Pixeln. „Alle" wird nicht mehr gebraucht.

### Gemessen, nachdem gebaut war

| | vorher | nachher |
|---|---|---|
| Ziele | 24 | 26 |
| Tipps je Ziel | 1–3, Schnitt 2,50 | **genau 2, für jedes** |
| Bedienarten für den verlässlichen Weg | 6 | **1** |
| Reiter sichtbar (390px) | 2 von 6 | **6 von 6** |
| erste Aufgabe beginnt bei | y=401 | y=449 |

Die letzte Zeile ist der Preis: **48 Pixel mehr Kopf.** Der Nutzer hatte
bei der Auswahl ausdrücklich „ca. 90px" in Kauf genommen; es sind
weniger geworden. Dafür ist keine Seite der App mehr unsichtbar.

Geprüft wird das nicht als Behauptung, sondern als Durchlauf: `test-neu-
design.js` klickt **jedes** der 26 Ziele einzeln an, jeweils von der
Startseite aus, über Griff und Liste — und prüft, dass zwei Tipps
reichen, dass die richtige Seite kommt UND der richtige Unterreiter
sitzt. Ein Inhaltsverzeichnis, das die Seite trifft und dort den
falschen Reiter zeigt, hat nicht geliefert.

### Vier Funde beim Bauen, jeder durch Messen

1. **Die Schublade stand immer offen.** `[hidden]` wiegt (0,1,0) und
   verliert gegen `body.neu .alles-lade` (0,2,1). Im Quelltext sah
   nichts falsch aus; gesehen hat es erst der Bildschirmabzug.
2. **Die Kopfzeile schnitt ab:** „45 offen · 5 über…". Gerechnet blieben
   bei 390px 120 Pixel für einen Satz, der 165 braucht. Behoben, indem
   „+ Neu" auf dem Handy nur noch das Pluszeichen zeigt (dieselbe
   Bauform wie `.sk-wort` beim Suchen-Knopf) — und auf 320px zusätzlich
   kleinerer Titel und umbrechende Unterzeile.
3. **Die Reiter brauchten drei Zeilen** (116px), und die erste Aufgabe
   begann bei y=489. Ohne die Zeichen in den Reitern sind es zwei Zeilen
   und y=449. Das Zeichen sagt dort ohnehin wenig — die Beschriftung
   steht daneben; im Bereichskopf darüber bleibt es gross und farbig.
4. **`test-demo` fiel um**, und zwar zu Recht: er klickte fest
   `.mobnav [data-group="g-chef"]`, und das gibt es in der Demo nicht
   mehr. Statt den Selektor zu flicken, geht er jetzt den Weg, den ein
   Mensch ginge — erst die Leiste, sonst die Liste. Derselbe Durchlauf
   misst damit beide Fassungen.

**110 Durchläufe grün.**

---

## Runde 86 — Die Startseite ausgedünnt

**Anlass**, wörtlich: „die startseite sieht sehr überwältigend aus noch
das müssten wir minimieren · bitte entferne diese rechtlichen schritte
sachen aus der einrichtung bzw lass uns das jetzt einfach endlich machen
· das mit dem firmencode muss jetzt auch nicht so penetrant sein, das
ist nicht ÜBER wichtig."

### Gemessen, bevor etwas geändert wurde

Chef, 390px, Demo: **5,31 Bildschirme (3047px), zehn Überschriften,
zwölf Blöcke.** Mitarbeiter: 2,20 Bildschirme.

Drei Blöcke sagten dasselbe wie die Liste darüber, nur als Zahl statt
als Sache:

| Block | Höhe | sagt |
|---|---|---|
| Überblick (Kachelraster) | 330px | „45 offene Aufgaben · 5 überfällig" |
| Wo etwas los ist | 270px | „Rondorf: 2 überfällig · 5 Artikel fehlen" |
| Mein Dienst (7 Tage) | 642px | vierzehn Schichtzeilen |

Die Heute-Liste nennt dieselben Aufgaben beim Namen, mit Studio und seit
wann. **Und seit es „Alles" gibt, muss die Startseite kein
Inhaltsverzeichnis mehr sein:** jede Zahl, die dort stand, steht in der
Liste an ihrer Sache, zwei Tipps entfernt. Das ist der eigentliche
Grund, warum sich jetzt streichen lässt, was vorher gebraucht wurde.

### Geändert (alles nur unter `body.neu`)

- **Kachelraster und „Wo etwas los ist" fallen weg** — doppelt.
- **„Mein Dienst" zeigt heute und morgen, höchstens drei Zeilen**, mit
  einem Weg zum Rest („und N weitere — ganze Woche ansehen"). Eine
  gekürzte Liste ohne Ausgang verschweigt, dass sie gekürzt ist.
- **Übergabe und Schwarzes Brett starten zugeklappt.** „Von der Leitung"
  bleibt offen: eine Anweisung der Geschäftsführung ist keine
  Nachschlage-Karte, und wer sie zuklappt, hat sie nicht gelesen. Eine
  eigene Entscheidung (`PREFS.folds`) überstimmt das weiterhin.
- **Einrichtungsschritte sind antippbare Zeilen**, die dorthin führen,
  wo der Schritt erledigt wird. Der Wegweiser („Verwaltung → System →
  …") entfällt dadurch. Ein Auftrag, der einem den Weg beschreibt,
  statt ihn zu gehen, ist ein halber Auftrag.
- **Der Text „Es fehlt: …" ist kurz** („4 Pflichtangaben fehlen noch")
  — er stand über vier Zeilen und machte die Karte rund 120px höher.

### Der Firmencode

`empfohlen: true`. Heisst: steht unten, zählt nicht in „N von M offen",
und die Einrichtungskarte verschwindet, sobald nur noch empfohlene
Schritte offen sind.

**Nicht weg.** Der Satz darunter stimmt weiterhin: ohne Code kann sich
jeder anmelden, der die Adresse kennt. Wer das weiss und trotzdem so
entscheidet, entscheidet es — wer es nicht weiss, kann es nicht. Deshalb
bleibt die Zeile an ihrem Platz, nur leiser.

### Ergebnis

| | vorher | nachher |
|---|---|---|
| Chef | 5,31 Bildschirme | **2,75** |
| Mitarbeiter | 2,20 Bildschirme | **1,36** |
| Überschriften (Chef) | 10 | 8 |

### Wie das geprüft wird

**Nicht gegen eine ausgedachte Schwelle.** „Höchstens drei Bildschirme"
hätte nur getrennt, was ohnehin getrennt ist. Stattdessen lädt
`test-neu-design.js` dieselbe Rolle zweimal — mit `?neu=0` und `?neu=1`,
gleiche Daten, gleiche Runde — und vergleicht. Dazu die Gegenprobe, dass
das Kachelraster im BISHERIGEN Schnitt noch dasteht; sonst verglichen
beide Messungen dasselbe.

Eine Zusage musste dabei zurückgenommen werden: „weniger Überschriften"
gilt beim Mitarbeiter nicht. Der neue Schnitt nimmt „Überblick" weg und
setzt „Überfällig" und „Heute" dafür — das geht genau auf. Das ist kein
Rückschritt, sondern der Tausch, um den es ging: eine Überschrift, die
eine Zahl ankündigt, gegen eine, die eine Sache ankündigt. Geprüft wird
deshalb „nicht mehr", und die Kürzung misst die Zeile darüber.

### Offen beim Nutzer

Die vier Pflichtangaben nach § 5 DDG (Betreiber · Anschrift ·
vertretungsberechtigte Person · E-Mail). Sobald sie da sind,
verschwindet der Einrichtungsschritt von selbst — entweder eingetragen
in der App oder als `KONFIG.recht` in `konfig.js`. Ein Impressum ist per
Gesetz öffentlich; im Quelltext steht dann nichts, was nicht ohnehin in
der App für jeden sichtbar wäre.

**110 Durchläufe grün.**

---

## Runde 87 — Start passt auf einen Bildschirm

**Anlass**, wörtlich: „die neue ist immer noch zu voll für mein geschmack,
am besten steht alles auf einer seite ohne das man scrollen muss yk · und
es wirkt jetzt mit den grossen symbolen immer noch voll überwältigend
irgendwie."

### Zuerst: der Widerspruch, offen benannt

„Alles auf eine Seite" und „weniger und grösser" (seine Wahl aus Runde
84: Zeilen mindestens 64px) ziehen gegeneinander. Aufgelöst, indem nicht
die Zeilen kleiner werden, sondern **ihre Anzahl**. Und „grosse Symbole"
(Runde 84) gilt weiterhin für das EINE Bereichszeichen oben — nicht für
eine getönte Kachel vor jeder Listenzeile.

### Gemessen, bevor etwas geändert wurde

| Gerät | Kopf | Bereich | Leiste | **Platz** | drin |
|---|---|---|---|---|---|
| 390×844 | 69 | 85 | 71 | **550px** | 1579px |
| 360×780 | 69 | 77 | 71 | **494px** | 1608px |
| 320×568 | 69 | 77 | 71 | **282px** | 1671px |

Bei 550 Pixeln Platz und 1579 Pixeln Inhalt ist die Frage nicht, was man
kürzt, sondern was überhaupt bleiben darf.

### Start ist jetzt NUR die Liste

Alles andere ist nicht weg, sondern umgezogen:

| vorher eigener Block | jetzt |
|---|---|
| Einrichtung (353px) | eine Zeile |
| Hinweisbalken | Zeilen (Material, Angeheftetes) |
| Mein Dienst (206px) | eine Zeile |
| Von der Leitung | eine Zeile |
| Übergabe, Schwarzes Brett | „Alles" → Wer arbeitet wann |
| Zuletzt passiert | ersatzlos |

**Das war erst möglich, nachdem es „Alles" gab.** Vorher wäre dasselbe
Verstecken gewesen.

### Die Symbole

Vor jeder Zeile stand eine getönte 34px-Kachel. Sechs davon
untereinander sind sechs Flächen, die um Aufmerksamkeit bitten, und
keine sagt etwas, was daneben nicht in Worten stünde. Jetzt nur noch der
Strich des Zeichens in der Farbe der Zeile; die Dringlichkeit trägt der
farbige Balken links. Das Bereichszeichen oben ging von 46 auf 38 —
**nachgemessen bringt das keine Höhe** (der Kopf wird vom Text getragen,
nicht vom Zeichen), es geht allein um das Gewicht im Bild. Der Kommentar
im Quelltext behauptete zuerst etwas anderes und ist korrigiert.

### Wie „passt auf eine Seite" durchgesetzt wird

**Gerechnet wird nicht, gemessen wird.** Eine Rechnung aus Zeilenhöhe mal
Anzahl wäre bei jeder Schriftgrösseneinstellung, jedem längeren
Studionamen und jedem Gerät anders falsch. Also: zeichnen, nachsehen ob
es überläuft, kürzen, wieder nachsehen.

Zwei Regeln dabei, beide aus einem Fehler gelernt:

1. **Nicht messen, was nicht liegt.** Wäre die Ansicht beim Zeichnen noch
   versteckt, wäre `clientHeight` 0 und die Schleife räumte die ganze
   Liste ab. Dieselbe Klasse Fehler wie beim gleitenden Marker in Runde
   84.
2. **Zuerst kürzen, dann streichen.** Der erste Anlauf nahm immer die
   unterste Kategorie ganz weg. Im Bild blieben dadurch 85 Pixel leer,
   während „54 Artikel fehlen" verschwunden war — eine ganze Aussage weg,
   für Platz, der gar nicht gebraucht wurde. Jetzt fallen Zeilen beim
   LÄNGSTEN Block, bis überall nur noch eine steht; erst dann eine ganze
   Kategorie. Dass es fünf überfällige Aufgaben gibt, sagt die
   Überschrift ohnehin; dass Material fehlt, sagt sonst niemand.

**Verschwiegen wird nichts:** jede Überschrift nennt die volle Zahl
(„Überfällig · 5") und trägt „alle 5 ›". Wo gekürzt wurde, wird der
Ausgang nachträglich eingesetzt — geprüft wird genau das.

### Ergebnis

| | Runde 84 | Runde 86 | **jetzt** |
|---|---|---|---|
| Chef | 5,31 Bildschirme | 2,75 | **1,00** |
| Mitarbeiter | 2,20 Bildschirme | 1,36 | **1,00** |

Auf allen drei Geräten, beide Rollen, ohne Scrollen — mit Gegenprobe,
dass es im bisherigen Design NICHT passt (1726px in 606px). Ohne die
Gegenprobe leuchtete der Abschnitt auch dann grün, wenn die Messung
nichts misst.

**110 Durchläufe grün.**

---

## Runde 88 — Farbe zurück, ohne wieder voll zu werden

**Anlass**, wörtlich: „neues layout ist bisschen besser aber noch nicht
ganz perfekt lass es uns noch mehr anpassen und die farben mit den
übergängen gefallen mir auch sehr aber sorg dafür dass ein wenig mehr
farbe und leben wieder da ist."

### Was schiefgelaufen war

Beim Ausdünnen in Runde 87 sind mit den getönten Kacheln auch die
**Farbflächen** verschwunden. Übrig blieben weisse Zeilen mit einem
4px-Strich. Richtig war, die Kacheln wegzunehmen; falsch war, die Farbe
mitzunehmen. Das ist der Unterschied zwischen „ruhig" und „leblos", und
den hat er sofort gesehen.

### Das Mittel: sein eigener Hinweis

„Die Farben mit den Übergängen gefallen mir" — das ist der Bereichskopf,
der seine Tönung nach unten auslaufen lässt. Dieselbe Sprache jetzt an
drei Stellen:

| Stelle | Übergang |
|---|---|
| Bereichskopf | Tönung oben, nach unten aus |
| Zeile der Heute-Liste | Tönung an der farbigen Kante, nach 62 % aus |
| Strich hinter der Überschrift | Farbe links, nach 40 % ins Graue |

Farbe, die von einer Kante ausgeht, statt einer Fläche, die man anmalt.

### Vier Kategorien, vier Farben

`--kat` und `--kat-f` je Zeilenart; alles darunter (Balken, Fläche,
Zeichen, Pfeil, Punkt in der Überschrift) liest nur noch diese zwei
Werte. Eine Stelle statt fünf.

| Kategorie | Farbe | warum |
|---|---|---|
| Überfällig | Rot (`--danger`) | ist ein Status |
| Heute | Bernstein (`--warm`) | ist ein Status |
| Neu für dich | Bereichston | ist keiner |
| Zu erledigen | Violett | ist keiner |

Die beiden unteren nehmen ausdrücklich **keine** Statusfarbe — sonst
wäre wieder kaputt, was `test-gestaltung` in Runde 84 gefunden hat.

### Sechs Fragen, sechs Farben

Die Liste „Alles" war 26 graue Zeilen. Jetzt trägt jede Frage einen der
sechs Bereichstöne, und die Kachel davor ist ein Verlauf in dieser Farbe
statt eines grauen Kastens. Die Kachel bleibt dort — anders als auf der
Startseite: dort standen sechs davon auf einem Bildschirm, der EINE
Frage beantworten soll; hier sind sie das Raster, an dem man 26 Zeilen
entlangliest.

### Ein Fund im Bild

„Zu erledigen" hatte zuerst `--accent-glow` als Tönung — den
**persönlichen** Akzentton. Im Bild lief dadurch eine violette Kante in
eine türkise Fläche. Kein Test schlägt bei so etwas an; gesehen hat es
der Bildschirmabzug. Jetzt ein eigener Ton, hell und dunkel getrennt.

### Unverändert

Start passt weiterhin auf einen Bildschirm (574px in 574px, alle drei
Geräte), jedes Ziel weiterhin in zwei Tipps, und ohne Schalter ist alles
wie vorher.

**110 Durchläufe grün.**

---

## Runde 89 — Tiefe, Kontrast, Schärfe

**Anlass**, wörtlich: „der hintergrund im dunkel und hell modus [muss]
mitspielen · mehr kontrast und viel mehr tiefe einbauen in 3D objekten ·
alles was anklickbar ist soll sich auch wie ein richtiger knopf anfühlen
und etwas tiefe haben · die farben sollen knackiger und kontrastreicher
sein und viel bessere genauere übergänge · falls nötig bau die farben
mit java oder so ein statt im html · (SO DASS ICH GLEICH SOFORT EINEN
UNTERSCHIED SEHE)."

### Zur Bitte, die Farben „mit Java" zu bauen

**Nicht gemacht**, und der Grund lässt sich messen: ein Skript läuft
erst, nachdem das erste Bild schon steht — man sähe beim Start einen
Moment lang die falschen Farben. Das ist dieselbe Klasse Fehler, die in
Runde 84 die untere Leiste auf x=0 gesetzt hat: gemessen, bevor etwas
lag.

An **einer** Stelle steuerbar ist es trotzdem, nur eben in CSS: alles
liest die Leitern in `body.neu`, und wer die ändert, ändert die ganze
App.

### Die Höhen-Leiter wurde NEU BELEGT, nicht ergänzt

Dieselben Namen (`--e1/--e2/--e3`), reichere Werte. Dadurch hebt sich
jedes Bauteil, das sie schon benutzt, auf einmal — statt dreissig
Einzelregeln.

Jede Stufe hat drei Lagen, und das ist der Unterschied zwischen
„Schatten" und „Tiefe":

1. eine **Haarlinie** (`0 0 0 1px`) — die Kante, die Schärfe gibt
2. ein **enger, dunkler Kernschatten** — das Objekt sitzt auf
3. ein **weiter, weicher Umgebungsschatten** — der Raum darum

Dazu innen oben eine helle Linie (`--kante`): so fängt eine erhabene
Fläche im echten Licht an. Und `--e-tief` für gedrückt: zwei Lagen statt
drei, Kernschatten nach innen.

Im Hellmodus ist der Ring eine echte graue Linie statt Schwarz mit
halber Deckung — sonst sieht jede Karte aus, als läge Russ um sie herum.

### Der Grund, auf dem alles liegt

Eine einzelne Farbe ist eine Wand. Zwei weiche Lichter darüber — eines
in der **Bereichsfarbe** oben, eines kühl unten — geben dem Bild eine
Richtung, ohne dass man ein Muster erkennt. `background-attachment:fixed`,
damit es beim Scrollen nicht mitwandert: Grund bleibt Grund.

### Anfassbar

Ein Knopf ist erhaben, wenn drei Dinge zusammenkommen: Lichtkante oben
innen, Schatten darunter, **und eine Bewegung beim Drücken, die beides
zurücknimmt.** Fehlt das Dritte, ist es ein Bild von einem Knopf.

Gedrückt heisst `translateY(1px)` plus Schatten nach innen — kein
Schrumpfen. Flächen, die beim Antippen kleiner werden, sehen nach
Spielzeug aus; sie sollen nachgeben, nicht wegrutschen.

Nicht alles schwebt: die Verzeichniszeilen liegen flach (sie sind ein
Inhaltsverzeichnis, keine Kacheln), von den Reitern ist nur der offene
erhaben (sechs erhabene Flächen nebeneinander sind keine Leiste mehr,
sondern eine Wand), und der Bereichskopf gibt nur nach.

### Knackiger

Bereichs- und Gruppentöne eine Stufe heller und die Tönungen von .16 auf
.26–.30. Die Zeilen der Startseite haben jetzt **drei** Farbhalte statt
zwei: die Farbe steht kurz, läuft zügig aus und ist ab 58 % ganz weg.
Zwei Halte gaben einen Verlauf, der über die ganze Zeile schmiert; drei
geben eine Kante mit Abklang. Dazu ein **farbiger Schatten** je Zeile —
der Unterschied zwischen „liegt auf dem Blatt" und „gehört dorthin".

Schärfe: `--line` von .08 auf .13, `--text-2/-3` und die `--auf-*`-Stufen
angehoben. Der Hauptton bleibt, wie er war — er war nie das Problem.

### Ein Fund, den der Durchlauf geliefert hat

Der erste Anlauf war **eine grosse Sammelregel** für ein Dutzend
Bauformen, gefolgt von Ausnahmen, die `box-shadow` und `transition`
gleich wieder überschrieben. `test-gestaltung` fand **neun Selektoren**,
bei denen dieselbe Eigenschaft zweimal stand — an der ersten hätte man
ewig gedreht, ohne dass sich etwas tut. Jetzt setzt jede Bauform ihre
Tiefe an genau einer Stelle: dort, wo sie ohnehin beschrieben ist.

Ausserdem: `g-alles` hatte keinen eigenen Ton und fiel auf
`var(--accent)` zurück — also auf die **persönliche** Akzentfarbe. Die
Kopfzeile des Verzeichnisses hätte die Farbe gewechselt, sobald jemand
seinen Akzent umstellt. Ein Verzeichnis, dessen Farbe von einer
Einstellung abhängt, ist keine Ordnung.

**110 Durchläufe grün.**

---

## Runde 90 — Das Abo-Modell mit Kasse und Paywall

**Anlass**, wörtlich: „lass uns schonmal ein abo modell bauen mit zahlung
und alles drum und dran das man sozusagen eine paywall hat bevor man die
app nutzen kann".

Vier Entscheidungen vorab abgefragt, weil sie die Arbeit verschieden
gemacht hätten: **Stripe** · **Bestandsschutz dauerhaft gratis** ·
**Testphase, dann zu** · **Basic und Premium wie gebaut**.

Damit sind die Stufen C, D und E aus `docs/ABO-PLAN.md` gebaut. Die
Planung dort stammt vom 11. August und ist unverändert gültig geblieben
— sie hat den Bau getragen, statt umgeschrieben zu werden.

### Die Grenze steht in den Regeln, nicht in der App

Der Vermerk bei `abo/{doc}` in `firestore.rules` stand seit August da
und sagte genau, was zu tun ist: *„Wenn später der Zustand `nurlesen`
dazukommt, gehört die Prüfung in JEDES allow der Firma — nicht in die
App. Beim Sperren war dieser Fehler zwei Tage lang unbemerkt, und die
Oberfläche behauptete derweil das Gegenteil."*

Also `schreibtIn(f)` statt `inFirma(f)` an **54 Schreibregeln**. Lesen
bleibt offen: Dienstpläne, Putzplan und Nachweise sind
Betriebsunterlagen, und sie von einem Tag auf den anderen unerreichbar
zu machen ist etwas anderes, als eine Software abzuschalten.

**Drei Sammlungen ausdrücklich ausgenommen** — `pushTokens`, `fehler`,
`statistik`. Die erste ist die Anmeldung eines Geräts und kein Inhalt;
wer sie mitsperrt, lässt jedes Handy beim Start in einen Fehler laufen,
ausgerechnet bei einem Kunden, der ohnehin gerade eine schlechte
Nachricht bekommt. Die anderen beiden wären genau dann still, wenn man
sie braucht.

### `zu` heißt wirklich zu — aber ohne die Lesekosten zu verdoppeln

Die Schreibsperre hängt an einem `get()` auf den Abo-Eintrag. Beim
**Lesen** dasselbe zu tun hieße: ein zusätzlicher Lesevorgang bei jedem
Zugriff der ganzen App, für eine Grenze, die hoffentlich nie jemanden
trifft. Der Vermerk bei `hatPremium()` warnt aus genau diesem Grund
davor, so etwas in `inFirma()` aufzunehmen.

Also anders herum: `zu` setzt `aktiv` auf dem Firmen-Dokument, und das
prüft `firmaLaeuft(f)` längst — in `inFirma(f)`, also bei jedem Zugriff.
Kosten: null. Die Grenze ist dieselbe wie beim Sperren von Hand, und
die ist erprobt.

`zuDurchAbo` merkt sich, **wer** gesperrt hat. Ohne dieses Feld würde
eine eingehende Zahlung eine Firma wieder öffnen, die der Betreiber aus
einem ganz anderen Grund stillgelegt hat.

### Der Fund, der am teuersten gewesen wäre

Der erste Anlauf schloss aus „hat je gezahlt", welche Mahnleiter gilt.
Das war an **genau einer Stelle** falsch: wer regulär **kündigt**, hat
gezahlt — und hätte damit nach Vertragsende die lange Leiter bekommen,
also fünf Wochen Vollzugriff. **Eine Kündigung wäre günstiger gewesen
als das Abo.**

Aufgefallen ist es beim Schreiben von `test-abo-leiter.js`, an der
Zeile „die kurze Leiter sperrt früher als die lange". Jetzt steht die
Leiter als Feld im Eintrag und wird dort gesetzt, wo der Rückstand
entsteht — da ist immer klar, worum es sich handelt.

### Die Uhr rechnet, sie stellt nicht weiter

Der Zustand wird jede Nacht neu aus **einem** Datum berechnet, nicht
vom vorigen Zustand aus eine Stufe weitergeschoben. Der Unterschied
zeigt sich an dem Tag, an dem der Lauf ausfällt: eine weitergestellte
Leiter steht still, und ein Kunde behält Zugang, den er nicht mehr hat.
Eine gerechnete holt den Tag beim nächsten Lauf von selbst auf.

Drei Dinge fasst sie nie an: `gratis` (darauf steht der Bestandsschutz),
von Hand Gesetztes (sonst überschreibt sie eine Kulanzfrist) und Firmen
ohne Eintrag.

### Die Einbahnstraße, die beinahe entstanden wäre

Ein Betrieb, der wegen einer offenen Zahlung stillgelegt ist, ist genau
der, der zahlen will. Bis hierher wurde **jeder** abgemeldet — und
abgemeldet kann niemand die Kasse aufrufen, denn die prüft
serverseitig, wer ruft.

Der Chef bleibt jetzt angemeldet und sieht eine Seite mit einem Knopf.
`stripeKasse` benutzt deshalb ausdrücklich **nicht** `firmaVonProfil()`
— das weist eine stillgelegte Firma ab, mit gutem Grund, aber hier wäre
genau das die Falle.

### Was das Team erfährt und was nicht

Den Abo-Eintrag darf nur der Chef lesen: was ein Betrieb zahlt, geht
eine Aushilfe nichts an. Trotzdem muss die App jedem sagen können
„gerade lässt sich nichts ändern" — sonst läuft ein Mitarbeiter beim
Abhaken in einen Fehler und hält die App für kaputt.

Ein Auslöser auf dem Abo-Eintrag spiegelt deshalb **nur die Stufe**
nach `config/zugriff`: voll, nurlesen oder zu. Kein Betrag, kein Datum,
keine Mahnstufe. Als Auslöser und nicht als Aufruf in jeder Funktion,
weil den Zustand inzwischen fünf Stellen setzen — eine davon vergisst
man.

Der Satz für das Team lautet „**Das liegt nicht an dir**". Die
Alternative wäre, dass eine Aushilfe glaubt, sie habe etwas
kaputtgemacht.

### Zwei Funde nebenbei

*Die Demo trug `stufe: 'A'`* — einen Wert, den es im Abo-Modell nie
gab. Altbestand aus der Zeit, als der Eintrag nur herumlag und niemand
ihn las. Sichtbar wurde er erst, als die Abo-Karte ihn anzeigte:
„Basic · " mit einem Trennzeichen und nichts dahinter.

*Die Zahlseite behauptete einen Grund, den sie nicht kennen kann.*
„Für diesen Betrieb ist eine Zahlung offen" stand dort — bei jedem von
Hand gesperrten Betrieb schlicht falsch, und es wäre die erste
Falschaussage gewesen, die der Kunde liest. Der Browser weiß nicht,
warum gesperrt wurde; beides setzt dasselbe Feld. Jetzt steht dort kein
Grund, und ein Durchlauf hält fest, dass auch keiner hineinwandert.

### Ohne Schlüssel passiert nichts

Fehlt `STRIPE_SECRET`, antworten die drei Endpunkte mit „Die Bezahlung
ist noch nicht eingerichtet". Die App läuft vollständig weiter.
Derselbe Grundsatz wie in Abschnitt 6 des Plans: **kein Kaufknopf,
solange es keine Kasse gibt.** Einrichten: `docs/KASSE.md`.

Und der Punkt, der nicht hier gelöst werden kann: Geld einzunehmen ohne
Impressum, AGB und — bei Verbrauchern — Widerrufsbelehrung ist
abmahnfähig. Stripe lässt sich einrichten und im Testmodus ausprobieren;
scharf geschaltet wird erst, wenn die Unterlagen da sind.

**112 Durchläufe grün · 1.001 Zusicherungen in den Regeltests**
(davon 42 neue für die Sperre, mit Gegenproben) · 48 auf die reine
Rechnung der Mahnleiter · 28 auf das, was ein Mensch zu lesen bekommt.

---

## Runde 91 — Schriften ins Haus, und was dabei auffiel

**17. September 2026.** Zwei Entscheidungen aus dem Betrieb („beim
ersten JA und beim zweiten auch JA"), dazu die Aufforderung, die
Widersprüche selbst auszubessern. Die zweite Entscheidung war „Google
Fonts lokal ausliefern". Was danach kam, war nicht geplant.

### Die Schriften

Neun `woff2`-Dateien der latin-Teilmenge, zusammen **195,8 KB**, liegen
jetzt unter `schriften/`. In `index.html` und `werbung.html` stehen statt
der `<link>`-Zeilen neun `@font-face`-Regeln. Der `media="print"`-Trick
ist weg: er sollte verhindern, dass ein Abruf ins Netz das Zeichnen
aufhält — eine Datei vom eigenen Server braucht das nicht.

Nur latin, nicht latin-ext, vietnamesisch oder kyrillisch. Latin deckt
`U+0000–00FF` ab: ä, ö, ü, ß, alle Akzente, € und die typografischen
Anführungszeichen. **Acht ungenutzte Dateien sind kein Vorteil.**

Damit ist `P-03` behoben. Bis zum 17.9. ging die IP-Adresse jedes
Besuchers an Google, **beim Laden der Seite, vor jeder Anmeldung und vor
jedem Hinweis** — der Fall, den das LG München I 2022 entschieden hat
(3 O 17493/20).

### Die CSP wird erzeugt, nicht geschrieben

Erster Versuch: die `font-src`-Zeile im HTML von Hand geändert. Danach
`node tools/csp.js --setzen` — und die Änderung war weg. **Die Regel
entsteht aus einer Vorlage in `tools/csp.js`**, und dort stand
`font-src https://fonts.gstatic.com data:` fest verdrahtet.

Das ist kein Ärgernis, sondern die richtige Bauweise: es gibt genau eine
Stelle, an der die Regel steht. Sie steht jetzt auf `'self' data:` —
und das ist mehr als Kosmetik. **Stünde Google dort noch, fiele ein
versehentlich wieder eingebauter Google-Link niemandem auf.** Die Regel
bewacht damit auch die Entscheidung, nicht nur den Code.

### Eine Formel, die falsch war

Im Kommentar stand am Vormittag: *„Damit läuft die App OHNE JEDEN
DRITTABRUF."* Der neue Durchlauf hat fünf Anfragen an
`gstatic.com/firebasejs` gezählt. **Das Firebase-SDK kommt weiter von
einem Google-Host.**

Der Unterschied ist die Notwendigkeit — ohne das SDK gibt es keine App,
ohne Google Fonts nur eine andere Schrift. Aber „ohne jeden Drittabruf"
ist trotzdem falsch, und der Satz stand in einer Datei, die
Datenschutzfragen beantworten soll. Er ist ersetzt, in `index.html`, in
`ARCHITEKTUR.md` und in `BEKANNTE-PROBLEME.md`.

**Der Absatz gehörte außerdem in den Datenschutztext der App** — dort
stand bisher nur, WO die Daten liegen, nicht dass schon das Öffnen der
Seite eine Verbindung zu Google herstellt. Jetzt steht es da.

### Und eine zweite, die schlimmer war

Im selben Text stand: *„Mitarbeiter sehen ihr eigenes Studio. […]
geregelt über Sicherheitsregeln in der Datenbank, nicht nur über die
Oberfläche."*

Der zweite Halbsatz stimmt für die **Firmengrenze**. Für die
**Studiogrenze** stimmt er nicht: an rund elf Sammlungen lautet die
Leseregel `inFirma(f) && istAktiv()`. Das ist `P-01`, seit dem 16.9.
bekannt — aber niemandem war aufgefallen, dass die App es den
Beschäftigten gegenüber **anders behauptet**, und zwar in dem Text, den
sie zur Frage „wer sieht meine Krankmeldung?" lesen.

Der Text sagt es jetzt so, wie es ist. Er wird wieder kürzer, wenn die
Grenze in den Regeln steht — **nicht vorher.** Eine Zusage, die man erst
noch einlösen will, ist im Datenschutztext eine falsche Angabe.

Dieselbe Berichtigung in `av/TOM.md`: die Tabelle „Wer welche Daten
sieht" trägt jetzt eine dritte Spalte, **Wodurch gehalten**.

### Sieben Pixel

`test-marker` wurde rot: der gleitende Marker unter der Navigation war
beim ersten Aufbau **51 px breit, der Reiter darüber 58 px**. Nach dem
ersten Reiterwechsel stimmte es wieder.

Der Marker misst sich am Reiter, und der Reiter ist so breit wie sein
Wort — aber das Wort hat erst dann seine richtige Breite, wenn die
richtige Schrift da ist. **Das war schon immer so**; auch die Schriften
von Google kamen nach dem ersten Zeichnen. Seit sie lokal liegen, kommen
sie nur *zuverlässig* spät genug, und dadurch wurde es messbar.

Behoben über `document.fonts.ready` — keine Zeitgeber, kein Raten.
Angehängt wird die Zusage nicht beim Laden, sondern dann, wenn ein
Marker zum ersten Mal gesetzt wird: sonst kann sie schon aufgelöst sein,
bevor die Navigation überhaupt existiert, und misst eine Leiste, die es
nicht gibt.

> **Sieben Pixel sind der Grund, aus dem etwas „off" aussieht, ohne dass
> jemand sagen kann, warum.** Genau dafür gibt es `test-marker`.

### Ein Durchlauf, der eine Frage verloren hatte

`test-csp` fragte bisher, ob der kleine Skriptblock läuft — daran, ob er
das Schrift-Stylesheet von `media="print"` auf `all` gestellt hat. Den
Nebeneffekt gibt es nicht mehr. **Eine Zusicherung, die niemand mehr
auslösen kann, prüft nichts.**

Statt sie zu löschen, prüft der Durchlauf jetzt die Behauptung, für die
der kleine Block überhaupt existiert: *er läuft auch dann, wenn der
grosse ausfällt.* Dafür wird der grosse Block unterwegs aus der Datei
entfernt — die Prüfsummen gelten einzeln, das Entfernen eines Blocks
macht die anderen nicht ungültig — und dann der Knopf geklickt. Mit
Gegenprobe, dass die Anmeldemaske vorher nicht schon offen stand.

`test-gestaltung` hatte ein stilleres Problem: es nahm den **ersten**
`<style>`-Block, und das ist seit dem 17.9. der mit den neun
`@font-face`-Regeln. Alle Leitern leer, alle Zählungen null — **und ein
Durchlauf, der nichts mehr findet, findet auch nichts Schlechtes.**
Gerettet haben es die Gegenproben, die genau darauf angelegt sind. Jetzt
wird der grösste Block genommen.

### Neu: `tests/test-schriften.js`

Vier Fragen, 28 Zusicherungen:

1. **Geht noch etwas an Google?** Jede Anfrage der geladenen Seite wird
   mitgeschrieben. Durch darf genau eine: das Firebase-SDK.
2. **Kommen die Schriften an?** `document.fonts`, nicht die Existenz
   einer Regel.
3. **Wird auch wirklich Barlow gezeichnet?** Derselbe Text wird in
   Barlow und in einer nicht existierenden Schrift gemessen. *Eine
   sauber geladene, aber nirgends benutzte Schrift wäre sonst ein grüner
   Durchlauf.*
4. **Sind es Schriftdateien?** Die ersten vier Zeichen einer `woff2`
   sind `wOF2`. Eine Fehlerseite, die `curl` als Datei abgelegt hat,
   hätte sonst eine Grösse und ginge durch.

Zwei Gegenproben haben beim ersten Lauf angeschlagen und waren beide
berechtigt: die Suche nach Google-Links traf den Fliesstext der
Erklärung (**ein Prüfer, der den Namen im Kommentar für einen Abruf
hält, zwingt dazu, die Erklärung zu löschen**), und die Messung verglich
`serif` mit einer erfundenen Schrift — die ja auf `serif` zurückfällt.

### Recht: die Widersprüche, ausgebessert

**`docs/AGB-ENTWURF.md`** — der AGB-Entwurf aus dem Betrieb beschreibt an
fünf Stellen ein anderes Produkt. Alle fünf sind jetzt am gebauten Stand
ausgerichtet: Stripe statt PayPal/Überweisung/Rechnung, laufendes Abo
statt „zunächst keins", Preis je Studio statt 59 € pauschal, Kündigung
zum Ende des bezahlten Zeitraums, Rechnungen von Stripe.

Der Preis steht **absichtlich nicht als Zahl im Vertragstext**: es gilt,
was der Kunde vor der Bestätigung in der Kasse sieht. Ein fester Betrag
im Vertrag und ein anderer in der Kasse ist der klassische Fehler.

§ 8 (Daten nach Vertragsende) trägt eine Warnung, die unbequem ist:
**die zugesagte Exportfunktion und die automatische Löschung nach 30
Tagen gibt es nicht.** Entweder wird gebaut oder der Text geändert.

**`docs/av/VORFALL.md`** — das Verfahren nach Art. 33/34. Sechs Schritte,
eine benannte Person, eine Meldevorlage, eine Aktenvorlage, eine
Einstufungstabelle mit sieben Beispielen. Die Akten kommen **nicht**
ungefiltert in dieses Repository: es ist öffentlich.

Offen bleibt der eigentliche Punkt: **es gibt keine Vertretung.** Fällt
die eine zuständige Person aus, läuft die Frist des Kunden weiter und
niemand meldet. Das ist eine Entscheidung, kein Schreibvorgang.

**`docs/MARKE.md`** — der Name. Die offene Suche hat **zwei gleichnamige
Produkte in derselben Branche** gefunden: `studiochat.io` (KI-Agenten,
identische Schreibweise, kein Impressum) und „Studio Chat" als Funktion
in Studio Pro, einer Verwaltungssoftware für Tanz- und Sportstudios.
Die Register selbst konnte ich von hier aus **nicht** abfragen — DPMA
und TMview suchen über Formulare mit Sitzung, nicht über eine Adresse.
Das steht so da, mit der Anleitung für die Viertelstunde.

### Die Anschrift

Genannt war `Kendenicherstrasse.15`. Am Vormittag des 17.9. stand in
`RECHT.md` `Kendenicher Straße 15` — getrennt. Das war meine Vermutung
und keine Angabe. Bestätigt und eingetragen ist **`Kendenicherstraße 15`**:
ein Wort, mit ß. **In einem Impressum wird nichts geraten.**

### Und dann P-01, weil der Weg kürzer war als gedacht

Die zweite Entscheidung aus dem Betrieb war die Studiogrenze. Der Plan
dafür stand seit dem 16.9. und war abschreckend: *„Firestore weist eine
Abfrage komplett ab, sobald auch nur ein Treffer nicht gelesen werden
dürfte — die Anwendung müsste an jeder betroffenen Stelle gefiltert
abfragen."*

**Beim Nachsehen fragt sie ohnehin schon je Studio ab.** Jede Stelle
lautet `S('studios').doc(sk).collection('absences')`, und `sk` kommt aus
`session.studioKeys` oder aus einer Auswahlliste, die selbst schon
begrenzt ist (`buildTeamSelect`). **Es war keine einzige Abfrage zu
ändern** — der geschätzte Aufwand war „Arbeit an jeder betroffenen
Stelle", der tatsächliche eine Regelfunktion und sechs Zeilen.

```
function meinStudio(studioKey) {
  return isChef() || studioKey in myProfile().get('studioKeys', []);
}
```

`manages()` gab es schon, aber die fragt nach dem **Verwalten** und ist
für einen Mitarbeiter immer falsch. Fürs Lesen braucht es die weitere
Frage. Kein `get()` darin: `myProfile()` ist ohnehin gelesen.

Geändert wurden `shifts`, `absences` und `handovers` — die drei
Sammlungen mit Personendaten, in beiden Welten (flach und unter
`firmen/`). **Aufgaben, Putzplan und Geräte bleiben betriebsweit
lesbar**, und das ist eine Entscheidung: ein defektes Gerät soll auch
melden können, wer gerade aushilft. Sie steht als Gegenprobe im neuen
`tests/rules/studiogrenze.test.js` — **27 Zusicherungen**, darunter ein
Leiter mit zwei von drei Studios, ein Chef ganz ohne eigene Studios und
ein Konto ohne das Feld `studioKeys`.

Offen bleiben Brett, Dokumente und Chat-Kanäle. Die liegen nicht unter
einem Studio; dort bräuchte es ein Feld im Dokument, und das ist eine
andere Aufgabe.

**114 Durchläufe · 28 neue Zusicherungen für die Schriften · 27 für die
Studiogrenze.** Die vier Roten waren alle echt: eine falsche Formel, eine
falsche Zusage im Datenschutztext, sieben Pixel und ein Zerleger, der am
falschen Ort gemessen hat.

---

## Runde 92 — Das Abo-Modell vorführbar machen

**21. September 2026.** Aus dem Betrieb, wörtlich:

> *„Ich kann im Demo Modus dass mit den Abo Modellen nicht testen."*

Er hatte recht, und der Grund war nicht, dass etwas fehlte.

### Was war

Die Zustände gab es alle — im Code, in den Regeln, in den Durchläufen.
Umstellen ließ sich der Zustand aber nur über einen Zusatz in der
Adresse, `?abo=nurlesen`, und der stand nirgends. Nicht in der App,
nicht in `VERKAUF.md`, nicht in der Demo-Leiste.

> **Eine Einstellung, die es nur in der Adresszeile gibt, gibt es für
> den Benutzer nicht.** Das ist kein Bedienfehler auf seiner Seite,
> sondern ein Baufehler auf meiner.

Dazu kannte die Demo nur drei Werte — `voll`, `nurlesen`, `zu` — und
damit ausgerechnet die uninteressanten: ganz offen und ganz zu. **Die
drei Mahnstufen, in denen noch gar nichts gesperrt ist und trotzdem
etwas passiert, ließen sich überhaupt nicht zeigen.** Das ist aber der
Teil, den man in einem Verkaufsgespräch erklären muss: drei Wochen lang
merkt das Team nichts, nur der Chef sieht die Karte.

### Was jetzt ist

Ein zweiter Umschalter in der Demo-Leiste, neben dem für die Rolle, mit
**allen zehn Zuständen** — die neun des Modells plus „kein Abo
hinterlegt", den Zustand jedes heutigen Bestandskunden.

Jeder Zustand legt den Datenbankeintrag an, den er braucht: die
Mahnstufen mit den Tagen der langen Mahnleiter aus `functions/index.js`
(0 / 7 / 14 / 21 / 35), damit „2. Mahnung" auch wirklich **„Seit 14
Tagen"** liest und keine erfundene Zahl.

Die Zugriffsstufe wird aus demselben Zustand **abgeleitet** statt als
zweites Feld geführt. Eine Demo, die oben „nur noch lesen" zeigt und in
der Verwaltung ein laufendes Abo, ist als Vorführung schlimmer als gar
keine.

### Drei Fehler, die dabei herausfielen

**1. Der Rollenwechsel warf den Abo-Zustand weg.** `location.search =
'?demo=' + wert` — lautlos. Gerade dieser Wechsel ist das Interessante:
derselbe Zustand sagt dem Chef *„was zu tun ist"* und dem Team *„das
liegt nicht an dir"*. Beide Werte reisen jetzt mit.

**2. „Seit 0 Tagen."** Am ersten Tag der Mahnleiter rechnet die Formel
null, und eine Null in einem Satz liest sich wie ein Fehler, nicht wie
„heute". Aufgefallen ist das erst, als sich der Zustand vorführen ließ —
**vorher gab es ihn nur im Kopf.**

**3. „Zahlung offenSeit 14 Tagen."** `#aboStand` trägt zwar
`.setup-zeile`, setzt aber `display:block` am Element; `<b>` und
`<span>` sind beide inline und liefen ineinander. Gefunden auf dem
Bildschirmfoto, nicht im Durchlauf: **`textContent` liest beides
zusammen und merkt den Unterschied nie.** Der neue Durchlauf fragt
deshalb die gerechnete Darstellung — wo endet das eine, wo beginnt das
andere.

### Was der Knopf in der Demo tut

Er führt nicht zu Stripe, und er sagt das jetzt auch. Vorher fiel er in
die allgemeine Abfuhr („würde auf dem Server ausgeführt und zum Beispiel
E-Mails verschicken") — für die Kasse schlicht falsch, sie verschickt
keine Mail, und der Knopf sah aus wie kaputt.

**Keine nachgebaute Bezahlseite.** Wer in einer Vorführung auf eine
gefälschte Kasse klickt, schließt aus ihr auf Preise, Ablauf und
Sicherheit. Stattdessen steht dauerhaft unter den Knöpfen, was im
Betrieb passieren würde — **dauerhaft, nicht als Meldung:** gemessen
überschreibt die Aufgaben-Erinnerung der Demo den Toast nach 300 ms, und
drei Sätze liest ohnehin niemand in zweieinhalb Sekunden.

### Und die Leiste selbst

Zwei Auswahlfelder statt einem, und die alte Regel `margin-left:auto`
galt für jedes — gemessen lag das zweite bei 390 px Breite von 245 bis
408 px in einer 390 px breiten Leiste, also **zur Hälfte hinter dem
Rand**. Auffallen konnte das nicht: die Leiste hat `overflow:hidden`,
die Seite scrollt also nicht seitwärts, und ein halb abgeschnittenes
Auswahlfeld sieht aus wie eines, das eben so breit ist.

Jetzt bekommt nur das erste den Schub, beide dürfen schrumpfen. Geprüft
auf 320, 390, 430 und 820 px, mitsamt der 44-px-Fingerregel.

### Neu: `tests/test-demo-abo.js`

**108 Zusicherungen.** Alle zehn Zustände über den Weg, den ein Mensch
nimmt — untere Leiste, Lade „Alles", Verwaltung, Reiter System. Je
Zustand: steht die Überschrift richtig, steht eine Erklärung darunter,
stehen die zwei untereinander, warnt die Leiste oben genau dann, wenn
gesperrt ist.

Dazu die Gegenproben: ohne `?demo` ist die Leiste unsichtbar, die
Beschriftungen sind keine Kennungen, und die Texte für Chef und Team
sind wirklich verschieden.

**Die Gegenprobe zur Gegenprobe:** beim ersten Bauen brach der Durchlauf
ab, als die Auswahl fehlte, statt zu melden — und ein Abbruch
verschweigt alles, was danach käme, ausgerechnet in dem Fall, den er
finden soll. Nachgemessen: ohne die Auswahl meldet er jetzt 13 Fehler
und läuft zu Ende.

**115 Durchläufe.**

---

## Runde 93 — Export, offene Aufgaben, und das Aussehen in die Hand des Benutzers

**21. September 2026.** Vier Wünsche aus dem Betrieb in einem Satz. Jeder
davon hat beim Nachsehen einen Fehler freigelegt, den vorher niemand
gesehen hatte.

### 1. Der Export war unvollständig — und ich hatte ihn falsch beschrieben

Zuerst die Berichtigung an mir selbst: in `AGB-ENTWURF.md` stand, es gebe
**keine** Selbstbedienungs-Exportfunktion. Das war zu pauschal. Es gibt
sie seit langem (`exportAllJson`, `exportAllXls`, nur für den Chef).

Beim Nachmessen fehlten aber **drei Sammlungen, und zwar genau die mit
Personenbezug**:

| | |
|---|---|
| `zeiten` | Arbeitszeiten der Beschäftigten |
| `anliegen` | was jemand der Leitung geschrieben hat, samt Antwort |
| `probetrainings` | wer wann eines gemacht hat und ob es zum Abschluss kam |

> **Wer einen Vertrag kündigt und „seine Daten" mitnehmen will, meint
> zuallererst die Arbeitszeiten.** Ohne sie ist die Zusage „Sie können
> einen Export verlangen" nicht eingelöst.

Dass der Chef diese drei **ungefiltert abfragen darf**, ist gemessen und
nicht angenommen: die Regeln prüfen je Dokument
(`resource.data.uid == …`), und Firestore entscheidet über eine Abfrage
vorher und im Ganzen. Der `isChef()`-Zweig trägt sie — mitsamt der
Gegenprobe, dass ein Mitarbeiter dieselbe Abfrage **nicht** stellen darf
und dass auch der Chef an die **Stempel-PINs nicht herankommt**.

**Zwei Fehler in meiner ersten Fassung**, beide beim Aufmachen der
erzeugten Datei gefunden:

* Die Stempelarten standen als erfundenes „kommt/geht" da. Das Vokabular
  gibt es im Datenbestand nicht; es heisst `kommen/pause/zurueck/gehen`,
  und `TM_WORT` übersetzt es — dieselbe Liste, die auch die Oberfläche
  benutzt.
* Ich hatte in einen Kommentar geschrieben, Probetrainings enthielten
  „Namen von Interessenten, also Daten Dritter". **Falsch.** Ein Eintrag
  hält fest, welcher *Mitarbeiter* eines gemacht hat. Der Unterschied ist
  nicht akademisch: als Kundendaten wäre das eine Sache für die
  Datenschutzerklärung, als Leistungsdaten von Beschäftigten eine für die
  Mitbestimmung.

`test-sicherung-inhalt.js` prüft jetzt zusätzlich, dass **kein Geheimnis**
in der Datei landet — nicht nur Direktnachrichten, sondern `zeitPins`,
`terminalCodes`, `pushTokens`, `privat` und die Felder `hash`, `geheim`,
`secret`. Die alte Frage prüfte einen Fall; sie sagte nichts über den
nächsten Bereich, den jemand aufnimmt.

Und in der Attrappe fehlten `zeiten` und `anliegen` ganz — **der fünfte
Fall derselben Lücke** nach `board`, den Übergaben, `probetrainings` und
`users`. Der Kommentar dort verlangt seit dem vierten Mal, eine Sammlung
an *beiden* Stellen einzutragen; jetzt stehen sie dort.

### 2. Offene Aufgaben standen nirgends

> *„ich möchte das beim home bildschirm in der app wieder die offenen
> aufgaben stehen oder zumindest ganz klar das aufgaben offen sind."*

Gemessen, bevor etwas geändert wurde:

| Rolle | offen | davon auf der Startseite |
|---|---|---|
| Mitarbeiter | 5 von 5 | **keine** |
| Leiter | 7 von 8 | **keine** |
| Chef | 48 von 61 | nur die 5 überfälligen |

Zwei Ursachen, beide eine Zeile:

**`renderHeute()` sprang über jede Aufgabe ohne Frist** (`if(!t.due)
return;`). Die meisten Aufgaben haben keine. Neuer Block „Offen", ganz
unten — oben steht, was einen Zeitbezug hat; ohne Frist ist offen, nicht
dringend.

**Das Abzeichen an „Aufgaben" konnte nie erscheinen.** Es suchte
`[data-mbadge="todos"]`, die Knöpfe tragen aber die Gruppen-Kennung
`g-arbeit`. Der Selektor traf nichts — seit dem Umbau der Leiste war es
tot. Dazu zählte es für den Chef ausdrücklich gar nichts.

> **Ein Abzeichen, das fehlt, sieht aus wie „nichts offen".** Deshalb
> fällt so etwas nie auf.

Der Ruhe-Satz hiess „Keine Aufgabe ist über ihrer Frist" und stand auch
bei fünf offenen Aufgaben da — wörtlich richtig und trotzdem
irreführend. Jetzt kann er gar nicht mehr erscheinen, solange etwas
offen ist, und darf deshalb „Alles erledigt" sagen.

**Und das Abzeichen lag auf dem Symbol**, 88 px² Überdeckung — gemessen,
kaum dass es zum ersten Mal sichtbar war. Ursache war `right:50%`: der
Kasten wächst damit nach **links**, also auf das Zeichen zu. Mit einem
Anker auf der linken Kante wächst er nach rechts in den freien Raum.
Nachgemessen auch mit „99+": Überdeckung 0.

### 3. Das Aussehen

> *„das ganze aussehen für sich sollte man selber viel mehr customizen
> können und die hintergründe sollen besser aussehen."*

| | vorher | jetzt |
|---|---|---|
| Akzentfarben | 6 | **10** |
| Chat-Hintergründe | 6 + Foto | **9 + Foto** |
| Hintergrund der ganzen App | — | **5** |

**Die Hintergründe hatten alle nur eine Ebene.** „Punkte" war ein
Punktraster auf nichts. Jetzt liegt unter jedem Muster ein weicher
Verlauf: das Muster gibt die Textur, der Verlauf die Tiefe.

**Und sie ignorierten die Akzentfarbe.** Violett und Cyan standen fest im
Stylesheet — wer auf Grün stellte, bekam trotzdem einen violetten
Schimmer. **Eine Einstellung, die eine zweite stillschweigend
überstimmt, ist keine Einstellung.** Jetzt kommen die Schleier aus der
gewählten Farbe, in zwei Stärken und im Hellen deutlich schwächer.

Der neue App-Hintergrund liegt auf `.app` und nicht auf `body`: der
Anmeldebildschirm und die Zahlseite bleiben ruhig. Fest hinter dem
Inhalt, nicht mitscrollend — **ein Hintergrund, den man bemerkt, ist
keiner.**

**Ein Fehler, den erst das Bildschirmfoto zeigte:** in der Vorschau
sah „Gitter" aus wie ein grobes violettes Raster. `background-size` gilt
für **alle** Ebenen — der Verlauf darunter wurde auf 20 px mitgekachelt.
Jetzt eine Grösse je Ebene.

### 4. Der Weg zurück

> *„man sollte auch alle funktionen wieder zurücksetzten können das man
> einfach das standard design von uns geniessen kann."*

Ein Knopf, ganz unten, mit Rückfrage. Er setzt Modus, Schriftgröße,
Farbe und **beide** Hintergründe zurück.

Was er **nicht** anfasst, und das ist der wichtigere Teil: Meldungen,
Tastenkürzel, Sortierungen, aufgeklappte Abschnitte, die
Lieferantenadresse — und nichts in der Datenbank. Deshalb steht dort
eine Aufzählung und kein `PREFS = {}`: wer später ein Feld hinzufügt,
nimmt es nicht versehentlich mit. Das eigene Chat-Foto wird abgewählt,
nicht gelöscht — **„zurücksetzen" heisst nicht „vernichten".**

> Der eigentliche Grund für diesen Knopf: wer vier Einstellungen
> verstellt hat und das Ergebnis nicht mag, erinnert sich an keine davon
> mehr. Ein Weg zurück nimmt dem Ausprobieren das Risiko — und erst
> dadurch probiert jemand überhaupt etwas aus.

### Zwei Funde von `test-gestaltung`, beide von mir

`.app` stand zweimal im Stylesheet, weil ich einen zweiten Block
angelegt hatte statt die Eigenschaft in den vorhandenen zu schreiben —
und „dieselbe Eigenschaft zweimal" ist genau die Falle, vor der die
Regel warnt.

Und „Dämmerung" trug seine zwei warmen Töne in der Zeile. Der Prüfer
kennt diesen Amberton, weil es **die Warnfarbe ist**. Beide Werte stehen
jetzt als Marken im einen dafür vorgesehenen Block, mit einer hellen
Fassung — und bei .13 weit unter jeder Statusfläche.

### Neu

| | |
|---|---|
| `tests/test-startseite-offen.js` | 29 Zusicherungen. Vergleicht die Startseite gegen den Zähler der Aufgabenliste statt gegen eine feste Zahl |
| `tests/test-aussehen.js` | 34 Zusicherungen. Verstellt **alle fünf** Einstellungen und setzt dann zurück — inklusive Neuladen |

**Die Gegenprobe zur Gegenprobe:** `test-startseite-offen` fand die
Kästchen zum Abhaken zunächst nicht (es sind `<button class="check">`,
keine `<input type="checkbox">`). Er hat das **gemeldet** statt grün zu
sein — eine Gegenprobe, die nicht lief, ist keine.

**117 Durchläufe.**

---

## Runde 94 — Die Farbe gehört dem Bereich, und die Demo führt zur Kasse

Aus dem Betrieb, 21.9.2026:

> „ich würde noch wollen das sich das standard design an eine bunte
> mischung anpasst, also wenn home grün ist dann sind auch alle knöpfe
> grün, wenn man dann zu ich wechselt und das rot ist dann werden auch
> alle knöpfe rot […] und das komplett dann im system integriert […]
> und ausserdem klappt das mit dem demo abo test immer noch nicht weil
> der demo modus mich nicht auf stripe weiter leitet."

Beim Nachmessen kam zuerst etwas anderes heraus, als der Wunsch
vermuten liess.

### Die Akzentwahl von gestern kam an der Hauptfarbe nie an

Gemessen am fertig gebauten Knopf, dunkler Modus, Einstellung „Grün":

| | |
|---|---|
| `--accent` | `#38BDF8` ← der Wert aus dem Stylesheet |
| `--accent-2` | `#22D3EE` ← der Wert aus der Einstellung |

**Nur die zweite Farbe kam an.** Zwei Ursachen, beide im Code
unsichtbar:

1. `markeAnwenden()` lief **nach** `applyPrefs()` und räumte `--accent`,
   `--accent-d`, `--accent-glow` und `--on-accent` wieder weg, wenn
   **keine** Firmenfarbe gesetzt ist — und das ist der Normalfall.
2. Gesetzt wurde am `<html>`, aber `body.light{}` setzt dieselben Namen
   noch einmal. **Ein Wert am Vorfahren verliert gegen eine Regel, die
   den Nachfahren trifft.** Im hellen Modus konnte die Wahl deshalb gar
   nicht ankommen.

Beides zusammen heisst: die Akzentfarbe hat seit ihrem Einbau nie
gewirkt. Der Wunsch aus dem Betrieb hat einen Fehler freigelegt, den
niemand gesucht hat.

### Und 56 Flächen, die fest verdrahtet waren

`--brand` (jeder Hauptknopf), `--tipp-*` (56 von 102 Knöpfen),
ausgewählte Chips, markierte Zeilen, Fokusringe, „heute"-Marken: alles
mit `rgba(34,211,238,…)` fest im Stylesheet. Wer auf Grün stellte, bekam
grüne Ränder und violette Knöpfe.

> **Eine Einstellung, die an 56 Stellen nicht ankommt, sieht aus wie
> eine Einstellung ohne Wirkung — und genau so wurde sie gemeldet.**

Sie lesen ihre Farbe jetzt aus `--akz-rgb`, einer **Kommaliste**. So
kann `rgba(var(--akz-rgb),.12)` überall dort stehen, wo vorher
`rgba(34,211,238,.12)` stand: jede Deckkraft bleibt exakt, nur der
Farbton wandert. Bewusst kein `color-mix()` — auf alten Studio-Tablets
fiele die Farbe still auf „transparent".

### Die Bereichsfarben gab es schon

Beim Bauen kam heraus, dass `--ber` / `--ber-f` längst existieren, mit
einer ausgeschriebenen Begründung im Stylesheet:

> „Sie sind bewusst nicht der persönliche Akzent: der Akzent sagt DAS
> KANNST DU DRÜCKEN, die Bereichsfarbe sagt HIER BIST DU."

Der Wunsch hebt die Trennung auf. Dann darf es aber **keine zweite
Liste** geben: `BEREICH_FARBE` nennt zu jedem Bereich den
`ACCENTS`-Eintrag mit **demselben Farbton**, den `--ber` dort schon
trägt. Der erste Anlauf hatte eine eigene Zuordnung — und überschrieb
dabei `data-bereich`, worauf die Kopfzeile ihre Farbe verlor. Gefunden
beim Nachmessen der Leiste, nicht im Code.

### Grün für Start und Rot für „Ich" gibt es trotzdem nicht

Grün ist in dieser App `--ok`, Rot ist `--danger`. Ein Bereich, der
dauerhaft in einer Statusfarbe steht, nimmt ihr die Bedeutung —
derselbe Fehler steckte im ersten Anlauf der Bereichsfarben, und
`test-gestaltung` hat ihn damals gefunden. Die Farben wechseln also, aber
in den sechs Tönen ohne Aussage: Blau, Violett, Türkis, Orange, Pink,
Schiefer. **Wer es anders will, ändert sieben Zeilen.**

### Die Tönung ist jetzt gerechnet

`--tipp-1` trug fest `.24`, mit dem Vermerk „bei `.30` fällt der Text auf
4,15:1". Das stimmte — **für Cyan.** Gemessen mit den Bereichsfarben
fällt Pink bei denselben `.24` auf **4,17** (hell 4,37).

> **Eine Zahl, die für eine Farbe gemessen wurde, gilt nicht für alle.**

`tippDeckung()` geht von der Obergrenze so weit herunter, bis der Text
über 4,5:1 liegt. Zehn Akzente, sieben Bereiche, zwei Modi — alle
nachgemessen, alle über 4,5.

### Zweiter Fund an mir selbst: der zweite Ton

Auf dem Bildschirmfoto der Aufgaben-Ansicht stand ein **oranger Kopf
über pinken Studio-Überschriften**. Ursache: `--accent-2` kam aus dem
Paar in `ACCENTS`, und der Partner von Orange ist Pink. Als schmaler
Verlauf auf einem Knopf ist das eine warme Kante; als Flächenfarbe über
einer ganzen Liste sind es zwei Aussagen in einem Bereich, der eine sein
sollte. In „Lebendig" ist der zweite Ton deshalb **derselbe Farbton, nur
heller bzw. dunkler**.

### Dritter Fund an mir selbst: es sprang, statt zu gleiten

„damit es einfach lebendig und interaktiv wirkt" ist eine Zusage über
Bewegung — also gemessen statt behauptet. Ergebnis beim ersten Anlauf,
fünf Messpunkte nach dem Bereichswechsel (30, 90, 160, 250, 400 ms):

    rgb(45,212,191) · rgb(45,212,191) · rgb(45,212,191) · …

**Fünfmal derselbe Wert.** Eine gewöhnliche `transition` auf dem Knopf
bringt nichts, wenn sich nur die *Variable* ändert, aus der seine Farbe
kommt: für den Browser ist eine benutzerdefinierte Eigenschaft erst
einmal Text, und Text lässt sich nicht zwischenrechnen.

Mit `@property` wird sie als **Farbe** angemeldet. Dieselbe Messung
danach:

    96,165,250 → 82,178,234 → 59,199,207 → 46,211,192 → 45,212,191

> **Alte Geräte verlieren nichts:** kennt ein Browser `@property` nicht,
> überliest er den Block und die Farbe wechselt wie bisher sofort. Das
> ist der Unterschied zu `color-mix()`, das in diesem Fall auf
> „transparent" fiele — deshalb steht es an keiner Stelle dieser App.

`--brand` ist ein Verlauf und damit keine Farbe. Er steht deshalb seit
heute als **Formel** an `body{}` statt als Zeichenkette aus dem Skript —
gebaut aus den beiden Farben, die gleiten können, folgt er ihnen Bild
für Bild. Ein Inline-Wert aus dem Skript hätte die Formel überstimmt.

**Und eine Nebenwirkung, die 84 Fehlmeldungen erzeugt hat:** angemeldete
Eigenschaften gibt der Browser nicht mehr als `#60A5FA` zurück, sondern
als `RGB(96, 165, 250)`. `test-akzent` verglich Zeichenketten und meldete
84 Fehler, die keine waren. Er vergleicht jetzt Zahlen.

### Die Demo führt jetzt zur Kasse

Der Einwand traf doppelt: der Knopf warf eine Erklärung statt
weiterzuführen, und der zweite Knopf („Rechnungen, Zahlungsmittel,
kündigen") steht erst da, wenn es schon einen Kunden bei Stripe gibt —
in der Voreinstellung „Testphase" also nie.

Die alte Begründung bleibt trotzdem richtig: **eine nachgebaute
Bezahlseite wäre das Falsche**, weil man aus ihr auf Sicherheit, Preise
und Ablauf schliesst. Der Weg führt deshalb auf eine Zwischenseite, die
Stripe nicht nachstellt, sondern sagt, was im Betrieb dort passiert — und
in den Zustand danach klicken lässt. Nachgebaut wird der **Weg**, nicht
die Gegenstelle: die Funktion gibt eine Adresse zurück, wie die echte es
tut, und der Knopf in der App sperrt sich und beschriftet sich
unverändert selbst.

### Dabei gefunden: `kasseRueckweg()` warf die ganze Adresse weg

`history.replaceState({}, '', location.pathname)` — nach der Rückkehr von
Stripe war alles weg, was sonst im Link stand: `?firma=` (die
Firmenkennung), `?neu=` (das Design auf diesem Gerät) und `?demo=`. Die
Kennung kam aus dem Speicher zurück, es war also kein Datenverlust — aber
ein geteilter Link hörte nach einem Kassengang auf, der geteilte Link zu
sein. Jetzt fällt nur das eine Merkmal weg.

### Neu

| | |
|---|---|
| `tests/test-akzent.js` | 117 Zusicherungen. Geht alle sieben Bereiche in beiden Modi ab, misst die Farbe am fertigen Knopf, rechnet den Kontrast der getönten Fläche **und des Hauptknopfes** und prüft, dass der Wechsel über Zwischenwerte läuft |
| `tests/test-demo-abo.js` | +13 auf 121. Der ganze Weg zur Kasse, mit der Gegenprobe, dass auf der Zwischenseite **kein Eingabefeld** steht |

**Die Gegenprobe, ohne die alles grün wäre:** eine fest gewählte Farbe
muss in jedem Bereich **gleich** bleiben. Ohne diese Zeile wäre der
Durchlauf auch mit einer App grün, die die Einstellung ignoriert und
einfach immer bunt macht.

**Und ein Fund von `test-gestaltung` an mir:** die neue
Übergangs-Regel nannte `.chef-tab`, `.opt` und `.chip` — die drei tragen
weiter unten längst eine `transition`, und die spätere gewinnt. Eine
Regel, an der man vergeblich dreht, ist schlimmer als keine.

**118 Durchläufe.**

---

## Runde 95 — Eine Führung, ein Ort für Lösungen, und vier Design-Punkte

Aus dem Betrieb, 22.9.2026:

> „design technisch können wir noch einiges ausbessern […] UND ich würde
> gerne den einrichtungs assistenten bauen das man am anfang eine ganze
> führung durch die app bekommt […] und ich würde noch einen bereich
> wollen wo man videos und texte zu bestimmten problemen hochladen kann
> die in einem studio anfallen."

### 1. Die Führung

Rollenabhängig, auf dem echten Bildschirm, jederzeit abbrechbar und über
Profil → Aussehen wiederholbar. Gemessen: **Chef 9 Schritte, Leiter 7,
Mitarbeiter 6.**

> **Eine Führung, die allen dasselbe zeigt, zeigt den meisten das
> Falsche** — und wer in Schritt 6 etwas sieht, das er nie anfassen darf,
> glaubt ihr ab da nicht mehr.

Der Lichtkegel ist **ein** Element mit einem 9999 px grossen Schatten
nach aussen. So gibt es ein Loch im Dunkel, ohne vier Rechtecke zu
rechnen, die bei jeder Drehung wieder falsch stehen.

**Zwei Funde an mir selbst, beide aus der Geometrie:**

Die Karte lag **auf** dem Licht — erst bei „Lösungen" (382×506 px
ausgeleuchtet, Karte mittendrin), dann, nach einer festen Obergrenze,
immer noch bei „Verwaltung". Eine feste Zahl weiss nichts von der Karte.
Jetzt wird zurückgerechnet: so hoch, dass die Karte darunter noch ganz
ins Bild passt.

Und der Ring ragte **2 px unter den Bildschirm und 4 daneben** — die
Höhe allein zu begrenzen reicht nicht, wenn das Ziel am Rand sitzt.

**Ein dritter Fund, diesmal im Durchlauf selbst:** die Zeile „Titel
länger als 8 Zeichen" schlug bei „Das Team" an — acht Zeichen genau. Eine
Schwelle, die ans Ergebnis angepasst war statt an die Frage.

### 2. Der Bereich „Lösungen"

Probleme aus dem Studio und was dagegen hilft: Titel, Problem, Anleitung,
Kategorie, Studios, bis zu drei Fotos. Mit Filter, Suche und Aufklappen.

**Text und Fotos zuerst, Video später** — und das ist keine Sparversion,
sondern die Reihenfolge:

> Im vorhandenen Speicher-Eimer liegt unter `sicherung/` der nächtliche
> **Vollexport der Datenbank**. Die Regeln dort stehen aus gutem Grund
> auf `allow read, write: if false`. Videos gehören niemals in denselben
> Eimer, und es darf nie eine Regel geben, die pauschal „angemeldet =
> darf lesen" sagt — anmelden kann sich in dieser App jeder selbst.

Fotos kann die App längst: sie werden im Browser auf 1280 px und 300 KB
verkleinert und liegen in der Datenbank. Das kostet nichts.

**Jedes Foto ist ein eigenes Dokument.** Ein Firestore-Dokument darf
1 MB tragen; drei Fotos im selben Dokument sprengen das — und zwar erst
beim dritten, also lange nachdem jemand geglaubt hat, es funktioniere.

**Geladen werden sie erst beim Aufklappen.** Dreissig Einträge zu drei
Fotos wären neunzig Lesevorgänge und ein paar Megabyte, jedes Mal.

Die Regeln stehen in **beiden** Fassungen, flach und unter
`firmen/<kennung>/`. Gelesen wird firmenweit, geändert nur vom Verfasser
und der Verwaltung. `tests/rules/loesungen.test.js` hält beides fest,
mit der Gegenprobe zur Gegenprobe: dass ein Kollege aus einem **anderen**
Studio lesen darf, ist die Zeile, ohne die auch eine Regel „verbiete
alles" grün wäre.

Und der Export trägt sie. **Eine neue Sammlung, die nicht mitgeht, ist
genau die Zusage, die einen Tag vorher gebrochen war.**

### 3. Vier Design-Punkte

| | |
|---|---|
| **Knöpfe nicht mehr in Versalien** | Für Überschriften am 25.8. entschieden, bei den Knöpfen stehengeblieben — und dort fällt es am meisten auf: „RECHNUNGEN, ZAHLUNGSMITTEL, KÜNDIGEN" über zwei Zeilen |
| **Ansichtswechsel mit Richtung** | Die neue Ansicht kommt aus der Richtung, in der sie in der Navigation liegt. Die Reihenfolge stammt aus `NAVGROUPS` — eine zweite wäre eine zweite Wahrheit |
| **Dichte: kompakt** | Nur die Abstandsleiter ab `--s10`. **Schriftgröße, Zeilenhöhe und die 44-px-Trefferflächen gehen ausdrücklich nicht mit** — eine kompakte Ansicht, die man nicht mehr trifft, ist keine Einstellung, sondern ein Fehler. Nachgemessen: 326 Bedienelemente, 0 unter 44 px |
| **Fehler in der Liste** | Lässt sich die Lösungsliste nicht laden, steht das dort, wo die Liste wäre — nicht in einem Toast, der nach drei Sekunden weg ist |

**Ein Fund von `test-gestaltung`:** das Auf/Zu-Zeichen war `▴`/`▾`. `▾`
ist in dieser App als Textzeichen erlaubt, `▴` wäre ein zweites gewesen.
Jetzt dasselbe Zeichen, gedreht — und damit auch eine Bewegung, die
sagt, was passiert.

### Neu

| | |
|---|---|
| `tests/test-fuehrung.js` | 175 Zusicherungen. Stellt den **ersten Start** nach, geht jeden Schritt jeder Rolle ab und misst, ob der Lichtkegel auf etwas Wirkliches zeigt (`elementFromPoint`) und die Karte ihn nicht verdeckt |
| `tests/test-loesungen.js` | 19 Zusicherungen. Der Weg über die Leiste und über „Alles", Filter und Suche gegen die Zahl davor, mit Gegenprobe *(in Runde 96 neu geschrieben — der Bereich zog um)* |
| `tests/rules/loesungen.test.js` | 30 Zusicherungen, beide Welten |

**120 Durchläufe.**

---

## Runde 96 — Der Rettungsring: 115 Probleme, einen Griff weit weg

> „kannst du diesen lösungen bereich ganz wo andern hinpacken irgendwie
> oben oder so das man auf einen knopf drückt und dann wird gefragt was
> das problem ist und die probleme sind dann nach key wörtern sortiert
> oder man findet die durch eine art ki oder so oder man kann direkt
> selber die ganze liste durchgehen das jedes mögliche problem vom
> mitarbeiter geklärt werden kann und alles schritt für schritt erklärt
> wird, ich gebe dir auch eine pdf mit 115 problemen und wie man sie
> löst und alles, kannst du mir dies schonmal eintragen das wir eine
> art grundbase haben und sorge dafür das man schon erstellte sachen
> auch bearbeiten und/oder bilder hinzufügen kann."

Der Bereich war **einen Tag alt** und lag schon falsch. Er hing als
siebter Reiter unter „Betrieb" — drei Tipps entfernt, und man musste
wissen, dass es ihn gibt. Ein Problem hat man aber **jetzt**, mitten in
etwas anderem: am Gerät, an der Theke, mit dem Kunden daneben.

Jetzt ist er ein **Rettungsring in der Kopfzeile**, von jeder Seite aus
sichtbar. Das Fenster legt sich über das, was offen ist, und gibt
hinterher genau dorthin zurück.

Bewusst kein Fragezeichen: ein Fragezeichen heisst „Anleitung zu dieser
App", hier geht es um das Studio.

### 1. Die PDF: 115 Probleme, 564 Schritte

Aus dem Mitarbeiter-Handbuch gelesen, nicht abgetippt und nicht
umformuliert — der Wortlaut ist der des Handbuchs. 13 Kategorien,
Nummern 1 bis 115 ohne Lücke.

In diesem Container gibt es **kein `pdftotext` und kein Poppler**, und
`pypdf` bricht beim Import ab (`_cffi_backend` fehlt). Die Streams sind
deshalb von Hand entpackt: ASCII85, dann Flate. Der erste Durchgang
hielt den **letzten Schritt jedes Problems** für die nächste Kategorie —
eine Kategoriezeile erkennt man daran, dass sie nicht auf „." endet und
dass eine Problem-Überschrift darauf folgt. Nachgezählt: 13 / 115 / 564.

**Warum eine Datei und nicht 115 Datensätze.** In der Datenbank kostete
der Grundstock bei jedem Öffnen 115 Lesevorgänge — bei 39 Konten und ein
paar Sitzungen am Tag rund **10.000 am Tag**, für Inhalte, die sich nie
ändern. Das freie Kontingent liegt bei 50.000. Als Datei kostet er
**nichts**, liegt im Zwischenspeicher des Browsers und im Vorrat des
Service Workers — und ist damit genau dann da, wenn das WLAN der Grund
fürs Nachschlagen ist. Geladen wird sie erst beim ersten Öffnen der
Hilfe: 47 KB, die die meisten Sitzungen nie brauchen.

### 2. Drei Wege, weil Menschen verschieden suchen

| | |
|---|---|
| **Tippen** | „gerät piept", „handtücher alle" — nach Stichwörtern gewichtet: Titel schlägt Stichwort schlägt Fliesstext |
| **Blättern** | 14 Kacheln, jede mit ihrer Anzahl |
| **Alles durchgehen** | die ganze Liste, für den ersten Arbeitstag |

**Es ist keine KI, und das Fenster sagt es auch.** Es ist eine
Stichwortsuche mit 35 Synonymgruppen, die einen Tippfehler verzeiht
(Levenshtein ≤ 1 ab fünf Zeichen, Wortanfang ab vier). Sie läuft im
Gerät, kostet nichts und geht ohne Netz.

> „KI" auf etwas zu schreiben, das keine ist, wäre eine Zusage über eine
> Fähigkeit, die es nicht gibt — und jemand, der ihr vertraut, tippt
> einen ganzen Satz ein und bekommt nichts. Der Durchlauf prüft, dass
> im Hinweistext „andere Wörter" steht und **nicht** „KI".

Umlaute werden aufgelöst statt entfernt: „gerät" und „geraet" finden
dasselbe. Auf einer Handytastatur schreibt in der Eile niemand den
Umlaut.

### 3. Bearbeiten, ohne das Handbuch zu verlieren

Der ausdrückliche Wunsch — und die interessante Stelle.

Wer einen Handbuch-Eintrag ändert, legt einen **eigenen** Datensatz an,
dessen Feld `basis` auf die Handbuch-ID zeigt. Die App zeigt dann den
eigenen. Das Handbuch bleibt unangetastet, nur geänderte Einträge kosten
etwas — und **„Änderung verwerfen"** stellt es jederzeit wieder her.

Der Dokumentname ist fest: `basis-<id>`. Mit einer zufälligen ID legten
zwei Leute, die denselben Eintrag am selben Tag bessern, zwei Fassungen
an, und die App müsste raten, welche gilt.

**Wer berichtigt, ersetzt nicht den Verfasser.** `uid` und `vonName`
bleiben stehen; wer geändert hat, steht daneben. Sonst übernähme die
Leitung mit einer geradegezogenen Zeile die Urheberschaft.

Die wichtigste Zahl des Durchlaufs ist deshalb eine Gegenprobe: **nach
dem Ändern eines Handbuch-Eintrags stehen immer noch 119 in der Liste,
nicht 120.** Stünde dasselbe Problem zweimal da — einmal richtig, einmal
veraltet —, wüsste niemand, welcher gilt.

Fotos lassen sich auch **später noch** anhängen, an denselben Knopf. Am
Handbuch darf das jeder; an einem eigenen Eintrag die verfassende Person
und die Leitung. Ein fremder Eintrag hat **keinen Knopf** und einen Satz,
der sagt warum — ein Knopf, der an der Regel scheitert, ist schlimmer
als keiner.

### 4. Was dabei gefunden wurde

| | |
|---|---|
| **Zwei Elemente hiessen `hilfeTitel`** | die Überschrift des Fensters und das Eingabefeld im Formular. `getElementById` gab die Überschrift zurück, `.value` war `undefined` — **jedes Speichern scheiterte still** an „Bitte sag in einem Satz, worum es geht". Gefunden, weil der Probelauf den Titel nachgelesen hat, statt dem Knopf zu glauben |
| **`.hk-wort` war schon vergeben** | von der Überschrift „Heute" auf der Startseite. Das Wort neben dem Rettungsring hätte nie die Regel bekommen, die es auf schmalen Bildschirmen ausblendet. Jetzt `.hi-wort` |
| **„Zurück" führte in die falsche Liste** | wer aus der Trefferliste heraus las, landete in einer Kategorie von vorhin und hatte seine Suche verloren. Jetzt merkt sich das Fenster, woher der Eintrag angeklickt wurde |
| **Das Wort „Hilfe" erst ab 900 px** | bei 700 px stünden „Hilfe" und „Suchen" nebeneinander in einer Zeile, die ohnehin Name, Studio und vier Knöpfe trägt |
| **`ansichtAn('loesungen')` gibt jetzt `false`** | die Seite gibt es nicht mehr, aber ein Verlaufseintrag aus einer offenen Sitzung oder ein weitergeleiteter Link zeigen noch dorthin |
| **Abmelden warf einen Fehler** | `stopListeners()` fasste `_loesUnsub` an, und die Variable gibt es nicht mehr. Gefunden von `test-firma-link` und `test-firmenname`, beide mit *PAGEERROR: _loesUnsub is not defined* |
| **Die Kopfzeile lief bei 320px über** | siehe unten — der eigene Abschnitt |
| **Der Rettungsring galt als toter Ballast** | `allesIkon(name)` sucht erst in `NAV`, und dort steht er nicht mehr. `test-gestaltung` sieht nur wörtliche `ikon('name')`-Aufrufe; jetzt steht einer da |
| **`loesungen-basis.js` löste keinen Deploy aus** | die Datei wird ausgeliefert, stand aber in keinem `paths`-Muster. Änderungen am Grundstock wären nie im Betrieb angekommen. `test-ausliefern.js` |

### 5. Was mitging

| | |
|---|---|
| **Kategorien** | die fünf der ersten Fassung (`geraet`, `technik`, `ablauf`, `kunde`, `sonstig`) werden abgebildet: `ablauf` → `routine`. Ohne diese Zeile fielen alte Einträge unter „Sonstiges", ohne dass es auffiele |
| **`schritte` neben `loesung`** | `schritte` ist die Wahrheit — eine Anleitung ist eine Reihenfolge. `loesung` trägt denselben Text am Stück weiter, weil die Tabellenfassung des Exports eine Zelle braucht und jeder Eintrag von vor heute nur dieses Feld hat |
| **Der Export** | trägt jetzt `schritte` als Liste und `herkunft` — „aus dem Studio" oder „Änderung am Handbuch-Eintrag b23". Ohne sie liest man eine Studio-Fassung und hält sie für eine eigene Entdeckung |
| **Der Schalter** | „Lösungen" heisst jetzt „Hilfe im Studio" und schaltet den Rettungsring ab. Er hängt nicht in der Navigation — `buildNav()` kommt nicht an ihm vorbei, also steht die Zeile in `featureKartenAnwenden()` |
| **Service Worker** | `v6`, mit `loesungen-basis.js` im Vorrat |

### 6. Die Kopfzeile hatte kein Budget mehr

Der Rettungsring war der **sechste** Knopf in einer Zeile, die schon
fünf trug. Nachgemessen bei 320px: 50 Pixel über dem Rand, Querlauf der
ganzen Seite, Abmelden ausserhalb des Bildes. Bei der Leitung auch noch
bei 390px. `test-abgeschnitten.js` hat es gemeldet, nicht das Auge.

Damit hat die Zeile eine Regel bekommen, die im Design-System steht:
**wer ihr einen Knopf hinzufügt, nimmt einen heraus** — und zwar nicht
den, den man am wenigsten mag, sondern den, der **vollständig woanders
steht**.

| | |
|---|---|
| **Hell/Dunkel** | gegangen, ab 520px abwärts. Steht ganz in Profil → Aussehen, hinter dem Kürzel einen Finger breit daneben — dort sogar reicher: Hell, Dunkel **und** „wie das Gerät", was ein Umschalter mit zwei Zuständen gar nicht ausdrücken kann |
| **Bericht an mich** | gegangen, ab 360px abwärts. Derselbe Knopf steht in Verwaltung → Berichte und in der Werkbank |
| **Suchen** | geblieben — auf dem Handy der einzige Weg dorthin |
| **Abmelden** | geblieben — am Schichtwechsel auf einem geteilten Tablet der häufigste Griff überhaupt |
| **Glocke** | geblieben — sie trägt eine Zahl, und eine Meldung, die man nicht sieht, ist keine |

Nebenbefund: die Glocke wurde bei 320px auf **20 Pixel** zusammen­gedrückt,
weit unter der 44-Pixel-Regel dieser App. Sie hat jetzt wieder ihre
vollen 44.

### Neu und geändert

| | |
|---|---|
| `loesungen-basis.js` | 115 Einträge, 47 KB. Entsteht aus der PDF, wird **nicht von Hand gepflegt** |
| `tests/test-loesungen.js` | neu geschrieben: **38 Zusicherungen**. Die Suche wird gegen den *erwarteten* Eintrag gemessen, nicht gegen „es kam irgendetwas" — „elektrde" muss die Elektrode bringen, „kaputt" etwas Beschädigtes. Dazu das echte Foto durch die ganze Kette und die Gegenprobe, dass die Liste keines auf Vorrat lädt |
| `tests/test-funktionen-schalter.js` | + der Rettungsring folgt seinem Schalter, mit Gegenprobe |
| `tests/test-navigation.js` | „Betrieb" hat wieder **sechs** Unterseiten |
| `tests/test-sicherung-inhalt.js` | `schritte` und `herkunft` in der Datei |
| das Probefoto | 89 Byte, im Durchlauf selbst erzeugt statt als Datei abgelegt: `tests/*.png` ist in `.gitignore` (dort landen die Bildschirmfotos). Es geht den ganzen Weg: Auswahl → Verkleinern → Vorschau → Speichern → Anzeigen |
| `tests/test-neu-design.js` | eine Zeile in „Alles” führt jetzt auf ein **Fenster** statt auf eine Seite — dieselbe Zusage, anderer Beleg |
| `firebase.json`, `deploy-functions.yml` | `loesungen-basis.js` löst einen Deploy aus und bekommt eine Woche Zwischenspeicher |

**120 Durchläufe.**

---

## Runde 97 — „Bei jedem einmal" heisst am Konto, nicht am Gerät

> „die führung soll bei jedem einmal starten und du kannst den pr
> mergen."

Die erste Hälfte war fast schon erfüllt: der gemerkte Stand lag im
Browser-Speicher, und der ist bei keinem der heutigen Kolleginnen und
Kollegen gesetzt — die Führung wäre bei allen einmal gelaufen.

**Fast.** Auf dem Tablet am Empfang melden sich nacheinander mehrere
Leute an; Abmelden ist dort der häufigste Griff überhaupt, und im Code
steht es auch so („Neu laden statt nur abmelden: so startet der nächste
Kollege …"). Am Gerät gemerkt hätte **nur der erste** die Führung
bekommen. Die übrigen hätten nie erfahren, dass es sie gibt — und
„bei jedem einmal" wäre eine Zusage geblieben, die das Studio-Tablet
still gebrochen hätte.

Jetzt entscheidet das **Konto**: `users/{uid}.tourGesehen`, eine Zahl,
die Fassung der Führung. Die Regeln brauchten dafür nichts — ein Konto
darf sein eigenes Profil ändern, solange es Rolle, Studios, `aktiv`,
`firma`, `admin` und `handyStempeln` nicht anfasst.

**Der Browser-Speicher bleibt** — als Rückfall, nicht als Wahrheit.
Scheitert der Schreibvorgang aufs Konto (kein Netz im Keller), fängt
die Führung sonst bei jeder Anmeldung wieder an. Er trägt deshalb die
Kontokennung mit sich — `"<fassung>:<uid>"` — und gilt ausdrücklich
nur für dieses eine Konto auf diesem einen Gerät.

### Die Zeile, die es beweist

Ein einzelner neuer Punkt in `tests/test-fuehrung.js`, und er ist der
ganze Unterschied:

> **„ein fremder Stand auf demselben Gerät hält sie NICHT auf"**

Das Gerät hat die Führung schon gesehen — aber für jemand anderen. Sie
muss trotzdem starten. Zusammen mit der Zeile eine Handbreit darüber
(„mit gemerktem Stand startet sie NICHT") zeigen die beiden, dass
wirklich das Konto entscheidet und nicht einfach immer oder nie
gestartet wird. Dazu: der Stand steht danach auch **am Konto**, nicht
nur im Browser.

Kein guter Zeitpunkt ohne einen Fund — aber diesmal gab es keinen: die
sechs Attrappen mussten nur die Form mitgehen (`'1:testuid'` statt
`'1'`), weil sie einen wiederkehrenden Benutzer nachstellen und das
jetzt eben so aussieht.

| | |
|---|---|
| Oberfläche | **123 Dateien, alle sauber** |
| `tests/test-fuehrung.js` | **177 Zusicherungen** (+2) |

**120 Durchläufe.**

---

## Runde 98 — Schulung: der Code ist die Schranke, nicht das Login

> „ich möchte einen bereich für eine art webinar und onboarding … wo
> dann jegliche schritte mit videos und interaktivität erklärt werden
> und danach noch fragen gestellt werden … und wir können dann in einer
> liste sehen wer es alles gemacht hat und wann und wie lange und was
> alles falsch ist und wie oft er gebraucht hat um eine frage richtig zu
> beantworten … Am anfang möchte ich nur das grundgerüst."

Auf die Rückfrage, was der Code der Leitung tun soll, kam die Antwort,
die den ganzen Entwurf umgedreht hat:

> „Der Code soll am Anfang eines Webinars eingegeben werden vom
> Mitarbeiter, der erstellte Code soll vorher von der Leitung einem
> Namen zugewiesen werden, **dann braucht der Mitarbeiter keinen eigenen
> Account**, aber man kann tracken wer es war … dann muss man aber die
> Uhrzeit tracken und den Ort bzw. der Studio Account welcher genutzt
> wurde."

Ich hatte eine **Gegenzeichnung danach** vorgeschlagen — Mitarbeiter
macht fertig, Leitung bestätigt. Der Vorschlag war schlechter, und zwar
aus einem Grund, den ich nicht gesehen hatte: **geschult wird am Tablet
im Studio.** Dort ist ein Studio-Konto angemeldet, nicht die Person, die
davor sitzt. Eine Gegenzeichnung hätte das Problem hinterher geflickt;
der Code löst es vorher.

Und er kann mehr: **neue Leute können die Einarbeitung machen, bevor sie
überhaupt einen Zugang haben.** Genau dafür ist ein Onboarding da.

### 1. Der Code

`M4K7-RPQ2-XT9B`. Die Leitung legt einen Teilnehmer an und sieht den Code
**genau einmal** — danach niemand mehr, auch sie nicht.

Er liegt gehasht (scrypt), und `schulungCodes` steht auf `allow read,
write: if false`, für alle. Dieselbe Überlegung wie bei der Stempel-PIN
und aus demselben Grund ernst gemeint:

> Wer die Code-Liste lesen kann, macht die Schulung für einen Kollegen —
> und der ganze Nachweis ist wertlos.

**Die ersten vier Zeichen sind offen.** Das ist kein Nachlassen, sondern
Rechnen: scrypt braucht rund 50 ms. Ohne einen offenen Vorderteil müsste
die Funktion bei 39 Teilnehmern 39-mal hashen — **zwei Sekunden bei jedem
Start**. Mit ihm ist es ein Zugriff und ein Hash. Die acht geheimen
Zeichen aus einem Alphabet von 32 sind rund 10¹² Möglichkeiten; zehn
Fehlversuche je Gerät und Stunde machen den Rest. Kein I, O, 0 und 1 —
die vier werden auf einem Zettel zuverlässig verwechselt.

### 2. Die Zeile, auf die es ankommt

```
match /schulungLaeufe/{lId} { allow create: if false; }
```

**Für alle. Auch für den Chef.** Ein Durchlauf entsteht ausschliesslich
in `schulungStart`, und erst, nachdem der Code gestimmt hat.

> Dürfte der Browser ihn anlegen, schriebe sich jeder mit der Konsole
> einen fertigen, bestandenen Durchlauf auf einen fremden Namen. Die
> ganze Liste wäre eine Behauptung statt eines Nachweises — und eine
> Schulungsliste, der man nicht glauben kann, ist schlimmer als gar
> keine: man glaubt ihr trotzdem.

Die zweite tragende Zeile: **ein abgeschlossener Durchlauf ändert sich
nicht mehr**, auch nicht durch die Leitung. Dasselbe Muster wie beim
bestätigten Nachweis.

Der teuerste Fall stand nicht im Auftrag und ist trotzdem geprüft: das
Tablet DARF am laufenden Durchlauf schreiben — es könnte ihn also mitten
im Lauf **auf einen anderen Namen umhängen**. Die Regel hält
`teilnehmer`, `modul` und `geraetUid` fest.

### 3. Was ehrlich gemessen wird und was nicht

| | |
|---|---|
| **Aktive Zeit** | Der Zähler läuft nur, wenn das Fenster vorn und die Seite offen ist. Wer den Bildschirm sperrt und Mittag macht, sammelt keine Minuten — eine Dauer, die das mitzählt, ist als Auskunft wertlos und als Leistungsangabe unfair |
| **Fehlversuche** | je Frage gezählt — und **erklärt**. Falsch angeklickt bringt einen Hinweis, der sagt warum. „Falsch" allein bringt niemandem etwas bei |
| **„Wirklich angesehen"** | **geht heute nicht** und wird auch nicht behauptet. Solange kein Video hinterlegt ist, steht am Platzhalter „Video folgt" samt vorgesehener Länge. Ein Häkchen wäre eine Behauptung, keine Messung |

Zur letzten Zeile: der Betrieb hat **eigenen Speicher** gewählt, einen
zweiten Eimer — niemals den mit der nächtlichen Sicherung. Nur mit
eigenem Player lässt sich Abspielzeit wirklich messen. Das ist der
nächste Schritt, wenn die Videos da sind.

### 4. Jeder sieht seine eigenen Zahlen

Ausdrücklich so entschieden. Dauer, Fehlversuche und Wiederholungen sind
Leistungsdaten; sie nur der Leitung zu zeigen, wäre eine heimliche Akte.
Oben auf der Seite steht für jeden, was er gemacht hat und wie es lief —
und die Regeln lassen genau das zu (`resource.data.uid ==
request.auth.uid`).

Im Export geht der **Nachweis** mit, samt Dauer, Punkten, Fehlversuchen
und Durchgang. NICHT mit geht, welche Antwort jemand angeklickt hat: die
Zahl der Versuche sagt der Leitung alles, was sie braucht, und ein Export
liegt jahrelang in einer Ablage.

### 5. Der Fund beim Bauen

**Der Server hätte JEDEN Start abgelehnt.** `schulungStart` prüfte das
Modul gegen die Sammlung `schulungen` — die Module liegen aber als Datei
(`schulungen-basis.js`, dieselbe Rechnung wie beim Handbuch), und die
sieht der Server nicht. Solange kein einziges Modul von Hand angelegt
ist, also **heute jeden**.

Die Prüfung ist raus, und die Begründung steht an ihrer Stelle: **die
Schranke dieses Weges ist der Code, nicht die Modulkennung.** Wer einen
gültigen Code hat, darf eine Schulung machen; welche, ist keine Frage
der Sicherheit.

Dazu zwei kleinere: die Code-Anzeige trug zwei `<b>`, und der Probelauf
las prompt den Namen statt des Codes aus — *was eine Prüfung
verwechselt, verwechselt auch ein Mensch*. Und der Hinweis nach einer
falschen Antwort stand bei 390 px gemessen auf y=776 von 844, also halb
unter dem Rand: ausgerechnet der Text, der erklären soll.

### Neu

| | |
|---|---|
| `schulungen-basis.js` | drei Module aus dem Mitarbeiter-Handbuch, mit Platzhaltern für die Videos |
| `tests/rules/schulung.test.js` | **56 Zusicherungen**, beide Welten |
| `tests/test-schulung.js` | **45 Zusicherungen** — der ganze Weg über „Ich“: Code anlegen, falscher Code, richtiger Code, Schritte, „Verstanden"-Haken mit Gegenprobe, gezielt danebenklicken, Ergebnis, Liste |
| 3 Cloud Functions | `schulungTeilnehmerAnlegen`, `schulungCodeNeu`, `schulungStart` |
| 5 Sammlungen | zwei davon auf `if false` |

### 6. Nachtrag am selben Tag: sie liegt unter „Ich"

> „platziere sie wo anders als Aufgaben, weil das nicht zu Aufgaben
> zählt halt."

Der Einwand trifft, und zwar genau. Unter „Betrieb" liegt, was **heute**
im Studio zu tun ist — Aufgaben, Putzplan, Material, Geräte. Eine
Schulung steht nicht auf der Liste des Tages; sie gehört zu dem, was man
selbst kann und nachweist. Dieselbe Frage wie „Meine Zeiten" und
„Meine Nachweise", und die stehen unter „Ich".

Die Auswertung für die Leitung bleibt auf derselben Seite, hinter dem
Knopf oben rechts. Sie zweimal zu bauen — einmal hier, einmal in der
Verwaltung — wären zwei Stellen, an denen dieselbe Liste auseinander
laufen kann.

„Betrieb" hat damit wieder **sechs** Reiter, „Ich" hat **drei**.

**Was noch fehlt** und ausdrücklich so vereinbart ist: die Videos, der
eigene Speicher-Eimer, die echte Abspielmessung — und ein Editor, mit
dem die Leitung Module selbst anlegt. Bis dahin kommen Module als Datei
ins Repo.

**121 Durchläufe.**

---

## Runde 99 — Beides geht: Datei UND Editor

> „Ich würde sie lieber AUCH pflegen können, also dass beides geht."

Der Grundstock bleibt eine Datei und kostet keinen Lesevorgang. Was die
Leitung selbst anlegt, steht in der Sammlung `schulungen` und wird
dazugemischt — und ein Modul **aus der Datei** bekommt bei Bedarf eine
**eigene Fassung**, die sich darüberlegt.

Dasselbe Muster wie bei den 115 Problemlösungen, und die entscheidende
Zahl ist auch dieselbe:

> **Nach einer eigenen Fassung stehen genauso viele Module da wie
> vorher.** Stünde dasselbe Modul zweimal in der Liste — einmal
> richtig, einmal veraltet —, wüsste niemand, welches gilt.

„Eigene Fassung verwerfen" stellt das Original jederzeit wieder her.
Das ist der Grund, warum der Grundstock eine Datei bleiben darf: was das
Studio ändert, ist zurücknehmbar, und das Original war nie in Gefahr.

### Der Editor

Titel, Kategorie, Dauer, Pflicht, Gültigkeit in Monaten, Strenge der
Fragen. Schritte in vier Arten (Text, Video, Bild, Verstanden-Haken),
verschiebbar und löschbar. Fragen mit zwei bis sechs Antworten, der
richtigen und einem Hinweis.

**Der Entwurf liegt im Speicher, nicht in der Datenbank.** Ein Modul mit
acht Schritten und sechs Fragen wäre sonst ein paar hundert
Schreibvorgänge, bloss weil jemand einen Satz tippt. Und neu gezeichnet
wird nur, wenn sich der AUFBAU ändert — bei jedem Tastendruck spränge
der Eingabezeiger an den Anfang.

### Zwei Funde beim Nachmessen

| | |
|---|---|
| **Die Pfeilknöpfe wurden bei 320px auf 41 Pixel gequetscht** | drei unter der Regel dieser App. Das Auswahlfeld daneben darf schrumpfen, die Griffe nicht |
| **`▴` wäre ein zweites Zeichen** für dieselbe Sache | `▾` steht in dieser App schon als Auf/Zu-Marke. Jetzt dasselbe Zeichen, gedreht — derselbe Fall wie bei den Lösungen in Runde 96, und diesmal vor dem Durchlauf bemerkt |

Dazu eine Kleinigkeit, die trotzdem zählt: in der Modulliste stand
„1 Schritte". Eine Zahl, die man anzeigt, bekommt das Wort, das zu ihr
passt.

### Und der Umzug

> „platziere sie wo anders als Aufgaben, weil das nicht zu Aufgaben
> zählt halt."

Die Seite liegt jetzt unter **„Ich"**. Nachgemessen kostet das keinen
Griff: „Ich" stand nie in der unteren Leiste (die trägt Start,
Aufgaben, Nachrichten und „Alles"), und über „Alles" sind es dieselben
**zwei Tipps** wie vorher über die Reiterzeile. `test-neu-design`
belegt das für jedes Ziel der Liste.

| | |
|---|---|
| `tests/test-schulung.js` | **66 Zusicherungen** (+21) |
| Bedienelemente im Editor | 74 je Breite, bei 320/390/430 px **0 unter 44 px, 0 über den Rand** |

**121 Durchläufe.**

---

## Runde 100 — Die Codes bleiben, und die Verwaltung wird flacher

Drei Wünsche auf einmal, und einer davon endete mit
„sag du mir einfach, was du für besser einschätzen würdest."

### 1. „Das die codes nicht weg sind"

> „ich würde mir wünschen … das die codes nicht weg sind und sie keiner
> sehen kann sondern sie bei der verwaltung gespeichert werden, sodass
> man ihn immer wieder neu erstellen und ansehen und weiterleiten kann."

Bis heute lag der Code gehasht, wie eine Stempel-PIN, und war nach dem
Anlegen für niemanden mehr zu sehen — auch nicht für die Leitung. Der
Einwand trifft die Praxis: **ein Code, den man nur einmal sieht, ist ein
Zettel, der verlorengeht.** Dann steht die Leitung da und erzeugt für
jeden Handgriff einen neuen.

Jetzt steht er im Klartext an `schulungTeilnehmer`. In der Liste sieht
man zunächst nur die Kennung — die vier offenen Zeichen vorn, die allein
nichts aufschliessen. **„Code zeigen"** holt ihn hervor, daneben stehen
**Kopieren** und **Weitergeben**, ein zweiter Druck räumt ihn weg.

Zugeklappt, weil zwanzig vollständige Codes untereinander jeder
mitliest, der einmal auf den Bildschirm sieht.

**Was das kostet, und es steht jetzt an vier Stellen offen da** — im
Kopf der Funktion, in den Regeln, in `DATENBANK.md` und im Handbuch:

> Wer den Code lesen kann, **kann** die Schulung im Namen dieser Person
> machen. Der Nachweis sagt damit nicht mehr „es war mit Sicherheit
> sie", sondern „es war sie, und die Leitung steht dafür gerade".

Für eine interne Unterweisung ist das die richtige Höhe: wer die
Auswertung besitzt, hat keinen Grund, sich selbst zu betrügen.

**Was es NICHT kostet**, und das ist die Zeile, die diesen Schritt
tragbar macht: ein Kollege kommt weiterhin an keinen fremden Code.
`schulungTeilnehmer` darf nur die Leitung lesen — und jede Person ihren
eigenen Datensatz. Neu geprüft, in beiden Welten:

| | |
|---|---|
| ein Kollege liest einen fremden Eintrag | **verboten** |
| … und auch die ganze Sammlung auf einmal | **verboten** — der Weg drumherum |
| … und auch gefiltert auf eine fremde Kennung | **verboten** |
| GEGENPROBE die Leitung liest die ganze Liste | **erlaubt** — sonst wäre der Bereich tot |

In die nächtliche Sicherung geht der Code nicht; sie trägt nur die
Durchläufe. Die alten, gehashten Codes bleiben als Rückfall lesbar und
werden beim nächsten „Neuer Code" weggeräumt — niemand muss etwas tun.

### 2. „Das es aufbautechnisch leichter ist"

Die Verwaltung bestand aus drei Karten untereinander: Teilnehmer,
Module, Auswertung. Auf 390 Pixeln ein Streifen von über zweitausend
Pixeln — wer die Auswertung wollte, scrollte an einem Formular und
einer Modulliste vorbei, die er gerade nicht brauchte.

Jetzt **drei Reiter**, und **in jedem Reiter steht seine Zahl**: man
sieht, wo etwas ist, bevor man hinklickt. Dieselbe Chipzeile wie in der
Übersicht darüber — kein neues Bedienmuster für dieselbe Sache.

Und auf der Übersicht steht jetzt oben **„Das steht für dich an"**: die
offenen Pflichtmodule. Vorher las man dafür jede Karte durch und suchte
das Wort „Pflicht". Der Kasten steht **nur da, wenn etwas offen ist** —
einer, der jeden Tag „alles erledigt" sagt, nimmt Platz für eine
Nachricht, die man einmal braucht.

### 3. „Eventuell ein weiteres Modul, wo Hilfe und Schulung steht"

Gefragt war meine Einschätzung, und sie lautet: **nein, kein siebter
Bereich** — und zwar genau, weil der Wunsch dahinter „leichter" hiess.

Die untere Leiste hat **vier feste Plätze** (Start, Aufgaben,
Nachrichten, Alles). Ein siebter Bereich hätte dort keinen bekommen und
wäre nur über „Alles" erreichbar gewesen — also über genau die Liste,
in der beide ohnehin stehen. Dazu eine Farbe, ein Untertitel, ein
Eintrag in der Seitenleiste: mehr Struktur für denselben Weg.

Also steht er als **Überschrift in dieser Liste**: „Was muss ich
wissen?" mit Hilfe im Studio und Schulung darunter. Zwei Tipps, wie zu
jedem anderen Ziel. Dazu zwei weitere Verbindungen, die nichts kosten:

* unten auf der Schulungsseite ein Knopf zur **Hilfe im Studio**
* der Rettungsring bleibt, wo er ist — oben in der Leiste

Die Trennung ist inhaltlich und hat einen Satz: **Schulung sagt, wie es
geht, bevor es soweit ist; Hilfe sagt es, wenn es gerade brennt.**

### Zwei Funde beim Nachmessen

| | |
|---|---|
| **Zwei verschiedene Zeilen trugen `data-schmodul`** | die neuen Fällig-Zeilen und die Modulkarten. Der Probelauf suchte alle Modulkarten und fand die neuen mit — anderer Aufbau, Abbruch. Ein Merkmal, das zwei Dinge meint, ist keins |
| **Der Probelauf klappte die falsche Zeile zu** | er griff nach dem ersten „Code zeigen" der Liste statt nach dem in der offenen Zeile. Die Teilnehmer stehen alphabetisch — die geprüfte Person war nicht die erste |

| | |
|---|---|
| `tests/test-schulung.js` | **81 Zusicherungen** (+13) |
| `tests/rules/schulung.test.js` | **62 Zusicherungen** (+6), beide Welten |
| Bedienelemente, gemessen bei 320/390/430/820 px | Übersicht 10, Verwaltung 4–15 je Reiter — **0 unter 44 px, 0 über den Rand, kein Seitwärtsscrollen** |

**124 Durchläufe.**

---

## Runde 101 — Putzplan auf die Startseite, und die App wird flüssig

> „kannst du noch den putzplan zur startseite hinzufügen, und es design
> technisch auch noch etwas überarbeiten alles so das die app richtig
> flüssig läuft im ideal fall auch mit 120fps und alles soll etwas
> schärfer wirken und das design soll over all einfach flüssig und
> kontrastreich und gut aussehen"

### 1. Der Putzplan auf der Startseite

Die Zahl gab es längst (`putzOffenGesamt()`), sie landete aber nur in
der Begrüssung des bisherigen Aussehens. Im neuen stand der Putzplan
nirgends.

Jetzt ein eigener Block, **direkt unter „Heute"** — er hat einen
Tagesbezug, und ein ungeputztes Gerät sieht der Kunde, eine ungelesene
Nachricht nicht. In Teal: Blau ist auf der Startseite der Bereichston,
Rot und Bernstein sind Status, Violett „Zu erledigen" — und Grün wäre
„in Ordnung", was eine offene Putzliste gerade nicht ist.

| wer | was steht da |
|---|---|
| **ein Studio** (Empfang) | die Punkte selbst, „täglich"/„wöchentlich" darunter, tägliche zuerst |
| **mehrere Studios** (Leitung) | eine Zeile je Studio, meister Rückstand zuerst, die ersten zwei Punkte darunter |

Pausierte Punkte zählen nicht — eine Pause heisst „steht nicht an", eine
Zeile auf der Startseite ist eine Aufforderung. Ein Tipp öffnet den
Putzplan **genau dieses Studios**; `data-hsk` stand dafür schon lange im
Markup, gelesen hat es bis heute niemand.

### Dabei gefunden: ein Block fiel stumm weg

Die Startseite passt auf einen Bildschirm (Runde 87). Reichte der Platz
nicht, fiel der unterste Block weg — **ohne Spur**. Beim Chef auf
390×844 war das seit Runde 93 „Offen", also genau die offenen Aufgaben,
die auf Wunsch überhaupt erst dorthin gekommen waren. Unbemerkt, weil
`test-startseite-offen` mit 900 px Höhe misst.

Mit dem Putzplan hätte es auch den Mitarbeiter getroffen („Offen · 5"
verschwand). Jetzt bleibt von jedem weggefallenen Block ein Knopf unter
**„Ausserdem"** — Name, Zahl, ein Tipp in die gefilterte Liste. Eine
Zeile Höhe statt einer ganzen Kategorie, und nichts ist verschwiegen.

**Ein Test wurde dafür angepasst, und das gehört gesagt:**
`test-startseite-offen` verlangte beim Chef den vollen Block „Offen" mit
Aufgaben beim Namen. Der Wunsch vom 21.9. hiess aber wörtlich „die
offenen Aufgaben … **oder zumindest** ganz klar dass Aufgaben offen
sind". Beide Formen sind jetzt erlaubt; geprüft wird in beiden, dass die
Zahl stimmt, der Weg in die gefilterte Liste führt und der Knopf ein
Fingerziel ist — mit Gegenprobe (auf 30 px verkleinert → rot).

### 2. Flüssig — gemessen, nicht geschätzt

**Wie gemessen wurde, und was sich hier NICHT messen lässt:** Chromium
ohne Bildschirm taktet mit 60 Hz; 120 Bilder je Sekunde lassen sich in
dieser Umgebung nicht direkt beobachten. Gemessen wurde deshalb die
**Arbeit je Bild** — für 120 fps stehen 8,3 ms zur Verfügung — und zwar
mit **auf ein Viertel gedrosselter CPU**, wie ein Studio-Tablet. Was auf
der Grafikkarte läuft, sieht diese Umgebung nicht (sie hat keine).

**Zuerst gesucht, dann geändert.** Die naheliegenden Verdächtigen —
Weichzeichner, Schatten, Verläufe, fester Hintergrund — hat das
Ausschlussverfahren entlastet: jeden einzeln abgeschaltet, keiner
änderte etwas. Die Ursachen waren andere:

| Fund | Wirkung | jetzt |
|---|---|---|
| Einblendung `rowIn` mit `fill-mode: both` | hielt alle 61 Aufgabenzeilen als aktive Animation fest, auch Sekunden später | `backwards` — gleicher Ablauf, danach frei |
| Glanz auf 14 Fortschrittsbalken | lief endlos | einmal |
| „überfällig" pulsierte | endlos, ~3 ms je Bild beim Scrollen | dreimal, dann still |
| Bereichskopf schrumpfte über `font-size`, `width`, `height`, `padding` | 0,3 s lang in jedem Bild ein volles Layout der Liste darunter, genau beim Scrollen | ein Layout, Bewegung per `transform` (FLIP) |
| Marker las `offsetLeft` mitten im Seitenaufbau | im Mittel rund acht Layouts je Tipp (65 bei acht Tipps) | gebündelt im nächsten Bild: erst lesen, dann schreiben |
| Farbgleiten am `<body>` (angemeldete, **vererbte** Farben) | jedes Bild die ganze Seite neu: 1627 Elemente, 74–98 ms | Seite springt einmal, gleiten tut nur der Rahmen |
| `getComputedStyle` bei jedem Wechsel für einen festen Wert | ein Stil-Durchgang je Tipp | einmal je Farbmodus |
| Einblendung auf allen 61 Zeilen | 50 davon unter dem Bildschirmrand | nur die ersten zwölf |

**Ergebnis**, CPU ÷4, Chef-Konto der Demo:

| | vorher | jetzt |
|---|---|---|
| Aufgaben scrollen, Arbeit je Bild (Dauerzustand) | 12,4–13,8 ms | **6,8 ms** |
| … verpasste Bilder | 19–30 von ~120 | **3 von 146** |
| Tipp auf die untere Leiste, bis fertig | 194 ms (max. 322) | **52 ms** (max. 109) |
| Bildzeiten beim Bereichswechsel, p95 | 150 ms | **50 ms** |
| Chat scrollen | 2,3 ms, 0 verpasst | unverändert |

**Wo es noch nicht bei 120 ist, ehrlich:** das ERSTE Bild nach einem
Bereichswechsel. Dort ändert sich die Akzentfarbe, und weil sie vererbt
wird, rechnet der Browser die ganze Seite einmal neu (78–97 ms bei CPU ÷4).
Das ist jetzt einmal statt fünfmal — aber es ist da. Der nächste Hebel
wären weniger Elemente je Seite (die Aufgaben tragen 1185) oder
`content-visibility` für Zeilen unter dem Rand; beides ist ein grösserer
Umbau und hier nicht gemacht.

**Das Farbgleiten bleibt.** Es kam aus dem Betrieb („damit es einfach
lebendig und interaktiv wirkt", 21.9.) und `test-akzent` misst es. Es
liegt jetzt nur am Rahmen — Kopfzeile, Seitenleiste (ab 821 px),
Demo-Leiste. Und eine Annahme vom 21.9. war zu pauschal: „eine
gewöhnliche Transition am Knopf bringt nichts". Das gilt für
**Verläufe**; bei einfachen Farben gleitet sie sehr wohl — nachgemessen
an der unteren Leiste, die das jetzt so macht.

### 3. Kontrast — an echten Bildpunkten

Jeder sichtbare Text auf elf Seiten, beide Farbmodi, gegen seinen
Hintergrund. Das Rechenmodell nimmt bei Verläufen den ungünstigsten
Farbhalt und ist damit absichtlich pessimistisch; **jeder Treffer wurde
deshalb am Bildschirmfoto nachgeprüft**: 20 verschiedene Stellen, davon
17 in Wahrheit in Ordnung (5,3 bis 19 : 1). Drei nicht, alle im
Hellmodus, alle nach demselben Muster — Akzentfarbe als Text auf einer
Tönung derselben Farbe:

| Stelle | vorher | jetzt |
|---|---|---|
| Chip „Alle" (Aufgaben) | 3,86 : 1 | **5,84 : 1** |
| offener Kanal (Chat) | 3,93 : 1 | **5,54 : 1** |
| „Drucken" (Putzplan) | 4,19 : 1 | **6,33 : 1** |

Die Ursache war ein Name, der etwas versprach: `--accent-d`, „d" wie
dunkel, war **identisch** mit `--accent`. Jetzt wird die Textstufe im
Hellmodus je Farbe gerechnet — so weit abgedunkelt, bis sie auf der
stärksten Tönung über der dunkelsten hellen Fläche 4,6 : 1 hat. Die
Tönungen selbst bleiben kräftig; blasser zu machen hätte genau die Farbe
genommen, um die es bei „lebendig" ging.

### 4. Schärfer

Kopfzeile und untere Leiste waren zu 93–96 % deckend, mit Weichzeichner
dahinter. Unter ihnen scrollt aber nichts — nachgemessen auf vier Seiten,
beide Modi: die Scroll-Bereiche enden bei y=772, die Leiste beginnt bei
773. Der Weichzeichner verwischte also nur den stehenden Hintergrund.
Jetzt deckend, mit derselben Farbe (`--bg` ist genau rgb(18,19,28)) und
einer klaren Linie. Was das der Grafikkarte erspart, lässt sich hier
**nicht messen** — auf schwachen Tablets ist es bekanntermassen spürbar.

### Zwei weitere Funde beim Nachmessen

| | |
|---|---|
| **Ein gekürzter Block verlor seinen Filter** | Wird beim Einpassen gekürzt, setzt `heuteKopfAusgang()` nachträglich „alle ›" ein — mit dem Ziel der ersten Zeile, ohne Filter, ohne Zahl. Ein gekürzter Block „Offen" führte so in die UNgefilterte Aufgabenliste. Jetzt stehen Ziel, Filter und Zahl am Block, und der Ausgang nimmt sie von dort. Gefunden vom neuen `test-startseite-putz` |
| **„alle 5 ›" traf nur 35 px hoch** | Die Trefferfläche (`::after`, 44 px) ragt 22 px über die Knopfmitte; beim OBERSTEN Block schnitt der Scroll-Bereich sie nach 12 ab. Im Bild unsichtbar, per Hit-Test gemessen. Jetzt 10 px Luft über der Liste — als `max(var(--s10),10px)`, weil `--s10` in der Dichte „kompakt" nur 8 px ist und es dort nachgemessen 43 statt 44 wurden |

**Und ein Fehler von mir, der gehört dazu:** eine Kommentarkorrektur im
Skriptblock, danach `tools/csp.js --setzen` vergessen — die
Sicherheitsregel blockierte das Skript, und ein laufender Gesamtdurchlauf
war ab dort wertlos. Abgebrochen, Regel gesetzt, von vorn.

### Tests

| | |
|---|---|
| `tests/test-startseite-putz.js` | **neu**, 14 Zusicherungen — mit Gegenprobe zur Pause |
| `tests/test-startseite-offen.js` | volle Form oder Mindestform, siehe oben |
| Startseite, jedes Ziel per Hit-Test | ≥ 44 × 44 px bei 320/390/430/820, Dichte normal UND kompakt, Mitarbeiter und Chef — vorher „alle 5 ›" 35 px |

**125 Durchläufe, alle sauber.**

---

## Runde 102 — Das ganze Repo durchgesehen, Regeln festgehalten, Design-Recherche

> „Kannst du bitte das ganze GitHub-Repo durchgehen und alles
> überarbeiten und nach Fehlern gucken und alles aktualisieren und dir
> selber die Regeln anlegen, die ich dir gegeben hatte. Außerdem suche
> im Netz nach guten Design-Ideen für so eine Art der App."

### Wie durchgesehen wurde

Nicht durchgelesen und für gut befunden, sondern mit Prüfungen, die
etwas finden können:

| Prüfung | Ergebnis |
|---|---|
| Syntax aller `.js`, der drei Inline-Skripte in `index.html` und der Nebenseiten | sauber |
| alle `.json` | gültig |
| 785 Verweise auf Element-IDs gegen das Markup | alle vorhanden |
| 821 IDs im Markup auf Doppelte | keine |
| Sammlungen in beiden Regel-Welten (flach / `firmen/<k>/`) | 36 in beiden; die Abweichungen sind gewollt |
| Sammlungen, die der Code benutzt, gegen die Regeln | alle abgedeckt (fünf über `privat/{uid}/{rest=**}`) |
| **jedes** Ziel aus „Alles" in drei Rollen, beide Farbmodi, 390 und 1100 px, dazu alle Verwaltungsreiter | **0 Skriptfehler, 0 Konsolenfehler** |
| `npm audit` der Cloud Functions | 0 Lücken |
| alle Regeltests | 16 Dateien, **1.141 Einzelprüfungen**, 0 rot |

**Was ich NICHT prüfen konnte:** den echten Anmeldeweg. Das
Firebase-SDK von `gstatic.com` lädt im Test-Browser dieser Umgebung
nicht (der Browser vertraut dem Proxy-Zertifikat nicht; `curl` mit dem
Zertifikat kommt durch). Die App zeigt dann richtig „Firebase konnte
nicht geladen werden" mit „Neu laden" — aber ob Anmelden, Registrieren
und Passwort-Vergessen gegen das echte Firebase funktionieren, ist hier
nicht belegt.

### Gefunden und behoben

**1. Die Studio-Chats waren für den ganzen Betrieb lesbar — und
beschreibbar.** Das war der gewichtigste Fund. `kanalErlaubt()` gab für
jeden Kanal ausser den zwei Leitungsgruppen `true` zurück; die
Oberfläche zeigt jedem nur seine Studios, die Regel liess alle zu. In
einem Studio-Chat steht schnell „Anna ist heute krank".

Vorher bewiesen, nicht vermutet: der neue Test war mit der alten Regel
rot, **6 × „GING DURCH"**, in beiden Welten. Jetzt grün.

Eine alte Notiz im Regelwerk sagte, eine Verschärfung brauche „eine
eigene Runde", weil Leute quer über Studios arbeiten. Das Argument trägt
nicht — `studioKanaele()` zeigt ohnehin nur die eigenen Studios. **Das
echte Risiko war ein anderes:** die Regel liest das gespeicherte Feld
`studioKeys`, die App rechnet aus den Studio-*Namen*, und an mehreren
Stellen im Code steht ein Rückfall für Konten ohne `studioKeys`. Solche
Konten hätten ihren eigenen Chat verloren. Ob es sie im Betrieb gibt,
konnte ich nicht nachsehen — mit Absicht kein Zugang zur echten
Datenbank. Deshalb:

* **ein Übergang:** Konten ohne `studioKeys` behalten vorerst das alte
  Verhalten;
* **`tools/konten-pruefen.js` zählt sie jetzt** („OHNE studioKeys") und
  sagt, was zu tun ist. Steht dort 0, darf die Übergangszeile weg.

Beides mit Test: `studiogrenze.test.js` 45 Zusicherungen (+18),
`konten-pruefen.test.js` mit Gegenprobe.

**2. Die Startadresse `/` wurde bis zu einer Stunde zwischengespeichert.**
`firebase.json` verbot das Zwischenspeichern nur für `/index.html` — die
App öffnet aber `/`. Gemessen: `cache-control: max-age=3600`, und direkt
nach der letzten Auslieferung lieferte `/` noch den alten Stand. Jetzt
ein eigener Eintrag für `/`.

**3. Die Auslieferung lief mit Node 20** — Lebensende April 2026, und
die Cloud Functions verlangen ohnehin 22. Jetzt Node 22, dazu die
Actions in ihren aktuellen Hauptversionen (checkout v7, setup-node v7,
setup-java v6, auth v3). **Vor dem Wechsel in deren `action.yml`
nachgesehen**, dass es jede Eingabe, die hier benutzt wird, weiter gibt
— die Zusammenfassungen der Release-Seiten waren bei den Daten
nachweislich unzuverlässig.

**4. Eine Datenschutz-Unterlage beschrieb den Schutz schlechter, als er
ist.** `docs/av/TOM.md` — die Unterlage, die Kunden zum
Auftragsverarbeitungsvertrag bekommen — sagte noch „Studiogrenze beim
Lesen NUR in der Oberfläche". Seit dem 17.9. hält die Regel sie für die
Personendaten, jetzt auch für den Chat. Auch eine zu schlechte
Beschreibung ist eine falsche. Dazu dort 864 statt 1.141 Prüfungen.

**5. Veraltete Angaben in README und Unterlagen:** „über 15.000 Zeilen"
(es sind 31.777), „zwölf Ansichten" (17), „genau zwei Skriptblöcke" (3),
„120 Durchläufe" (125), Schulung fehlte in der Beschreibung, und die zwei
seit dem 13.8. stillgelegten Nebenseiten standen noch als ausgeliefert
da. Im Dokumentenverzeichnis fehlten zwei Dateien.

### Gefunden und bewusst NICHT behoben

**Dokumente mit Zielstudio.** Dokumente tragen ein Feld `studios`, die
Oberfläche zeigt sie nur diesen Studios, die Regel liest es nicht. Ein
Dokument für ein einzelnes Studio kann also jeder im Betrieb über die
Konsole lesen. Nicht gleich mitbehoben, weil die App alle Dokumente in
**einer** ungefilterten Abfrage holt — eine Regel je Dokument liesse die
Dokumentenseite für alle ausser dem Chef leer. Das ist ein Umbau mit
eigener Prüfung. Steht in P-01.

**Die grossen Versionssprünge.** Firebase-SDK im Browser 10.12.2 →
12.19.0, `firebase-admin` 12 → 14, `nodemailer` 9 → 10,
`@google-cloud/firestore` 7 → 9. Keine davon hat eine bekannte Lücke
(`npm audit`: 0). Aber jeder ist ein Hauptversionssprung, und den
Browser-Teil kann ich hier nicht einmal laden (siehe oben). Einen
Sprung, den man nicht prüfen kann, auf eine App zu setzen, die gerade
andere benutzen, wäre das Gegenteil von „aktualisieren". Gemacht ist
nur `firebase-functions` 7.3.2 → 7.4.0 (innerhalb der erlaubten
Spanne; die Funktionen laden damit).

### Die Regeln

`CLAUDE.md` hatte die Grundregeln. Dazu gekommen, was bisher nur im
Verlauf stand:

* **Wie gearbeitet wird** — erst Plan und Rückfragen bei einem neuen
  Bereich; auf „sag du mir" eine Empfehlung statt einer Auswahl;
  Übergänge, wo andere parallel arbeiten; kein Test wird zum
  Grünwerden gelockert.
* **Weitere Grenzen** — Admin ohne Kundeninhalte, Einmal-Passwörter,
  Kennung in der Adresse ist keine Grenze, Abo-Zustand, was nie in den
  Export gehört, Stand der Studiogrenze.
* **Wie es aussehen soll** — die Design-Wünsche aus dem Betrieb mit den
  eigenen Worten und was jeweils daraus folgt; dazu „flüssig heisst
  konkret" aus der letzten Runde.
* **Fallen im Werkzeug** — sieben Dinge, in die ich selbst getappt bin.

### Design-Recherche

`docs/DESIGN-RECHERCHE.md`, elf Ideen aus vergleichbaren Apps (Beekeeper,
Blink, Flip, 7shifts, Deputy), aus Googles Forschung zu „Material 3
Expressive" und aus der Kritik der Nielsen Norman Group an Apples
Glas-Design — jede mit Quelle, Aufwand, Gegenargument und Abgleich mit
den bisherigen Wünschen. Zwei Behauptungen im ersten Entwurf waren
falsch und sind vor dem Einchecken korrigiert: der Wochenstreifen
passt bei 320 px **nicht** mit sieben 44-px-Tagen (292 px Platz, 308
gebraucht), und „der meistgelobte Punkt jeder Vergleichs-App" war mehr,
als die Quellen hergaben.

**Oberfläche: 125 Durchläufe, alle sauber. Regeln: 16 Dateien, 1.141 Einzelprüfungen, alle grün.**


---

## Runde 103 — Block A der Design-Recherche: Wege, Daumen, Bento

> „dann lass bei der designrecherche systematisch anfangen und als
> erstes block A machen eventuell"

Block A aus `docs/DESIGN-RECHERCHE.md` heisst „Startseite und Wege" und
hat drei Ideen. Alle drei sind gebaut, jede mit einer Abweichung vom
Entwurf, die beim Bauen aufgefallen ist. Die Abweichungen stehen jetzt
auch in der Recherche-Datei bei der jeweiligen Idee.

### A1 · Eigene Schnellzugriffe

Unten auf der Startseite, direkt über der Leiste: drei Ziele und
„Anpassen". Ein Tipp auf „Anpassen" öffnet eine Liste, die aufgebaut
ist wie „Alles" (dieselben Überschriften, dieselben Ziele). Gewählt wird
durch Antippen; die Zahl rechts sagt, an welcher Stelle der Knopf unten
stehen wird.

**Warum unten, obwohl der Entwurf „über der Heute-Liste" sagte.** Aus
demselben Grund wie A2: oben ist auf einem grossen Telefon der Punkt,
den der Daumen am schlechtesten erreicht. Ein Absprung, den man jeden
Tag nimmt, gehört dorthin, wo er ohne Umgreifen geht. Und oben stünde er
vor dem Überfälligen, und das hat mehr Recht auf den ersten Blick.

**Warum ein Knopf „Anpassen" statt eines langen Drucks.** Eine Geste,
die man nicht sieht, darf nie der einzige Weg sein. Diese Regel steht
schon an der Schublade („Vom linken Rand wischen").

**Warum ein Vorschlag, wenn noch nichts gewählt ist.** Eine leere Zeile
erklärt nicht, wofür sie da ist; drei brauchbare Ziele tun es. Die
Vorschläge:
- Mitarbeiter: Putzplan, Meine Zeiten, Geräte.
- Leitung: Schichtplan, Anliegen, Putzplan.
- Chef: Überblick, Schichtplan, Anliegen.

„Zum Vorschlag" nimmt die eigene Wahl zurück.

**Warum am Gerät und je Konto (`PREFS.schnell[uid]`).** Am
Empfangs-Tablet melden sich mehrere Leute nacheinander an, also darf
einer allein dort nicht für alle entscheiden. Aufs Konto in der
Datenbank geht es bewusst nicht: dafür bräuchte es eine neue Stelle in
beiden Regel-Welten, für drei Wörter, die man in zehn Sekunden neu
wählt.

**Abgeleitet, nicht abgeschrieben.** Ein Schnellzugriff ist nur ein
Schlüssel auf einen Eintrag aus `allesGruppen()`. Wird eine Funktion
abgeschaltet, fällt der Eintrag dort heraus und damit auch hier. Kein
Schnellzugriff kann ins Leere führen. Die Ziel-Attribute kommen aus
einer gemeinsamen Funktion `allesZielAttr()`, damit „Alles" und die
Schnellzugriffe nicht auseinanderlaufen.

**Was dabei gefunden wurde.** Die Zusage „ohne dass man scrollen muss"
brach auf dem iPhone SE (320 × 568). `test-neu-design` hat es gemeldet:
287 Pixel Inhalt in 257 Platz. Die Zeile kostete dort mit Wort 80
Pixel. Unter 640 Pixel Höhe stehen deshalb nur die Zeichen; der Name
bleibt als `title` und `aria-label` am Knopf. Die Zusage ist älter und
wiegt schwerer als das Wort.

### A2 · Die Hauptaktion in Daumennähe

Auf dem Handy steht „+ Aufgabe", „+ Putzaufgabe" oder „+ Probetraining"
jetzt unten rechts über der Leiste: 56 Pixel hoch, deckend, mit dem
Wort, WAS angelegt wird. Die Fläche ist dieselbe wie bei jedem
Hauptknopf (`.btn-primary`), weil deren Kontrast längst nachgerechnet
ist.

- **Das echte Element wandert,** keine Kopie: `kopfPlusUmhaengen()`
  hängte den Knopf schon bisher um, jetzt mit einem zweiten Ziel. Der
  Klick-Zuhörer bleibt einer.
- **Beim Scrollen rückt er auf das Pluszeichen zusammen,** im selben
  Takt wie der Bereichskopf. Voll ausgeschrieben würde er die rechte
  Hälfte der Zeile verdecken, die man gerade liest. Die Breite springt,
  statt zu gleiten: ein Übergang auf `width` wäre genau die
  Layout-Bewegung, die seit Runde 101 verboten ist.
- **Die Liste bekommt unten Platz,** sonst läge der letzte Eintrag samt
  „…" für immer unter dem Knopf.
- **Meldung und „Rückgängig" rücken darüber.** Direkt nach dem Anlegen
  ist genau der Moment, in dem man beides braucht.
- **Die Höhe der unteren Leiste liest ein `ResizeObserver`.** Dichte,
  Schriftgrösse und der Rand am iPhone ändern sie; gemessen wird dort,
  wo der Browser ohnehin gerade gemessen hat, nicht im Klick.

**Nicht mitgewandert:**
- „Verwalten" in der Schulung, weil es nichts anlegt.
- „Abhaken" im Putzplan, weil das eine Handlung je Zeile ist, keine je
  Seite.
- „Stempeln", weil es am Handy den Code vom Studio-Bildschirm braucht,
  also ein Eingabefeld ist und kein einzelner Knopf.
- „Senden" im Chat, weil es dort schon unten sitzt.

Am Rechner bleibt alles oben: dort gibt es keine Daumenzone.

### A3 · Bento in der Verwaltung

Die Studio-Tafel unter „Verwaltung → Überblick" ist jetzt ein
Bento-Raster. Die Grösse sagt die Reihenfolge:
- **Gross:** das eine Studio mit dem meisten Rückstand, mit den
  ältesten Sachen darin beim Namen (zwei auf dem Handy, vier am
  Rechner).
- **Normal:** die übrigen mit Rückstand.
- **Klein:** die ohne Rückstand, drei in einer Zeile.

Vorher sah „Rondorf hat fünf Überfällige" genauso aus wie „Brühl ist
fertig".

Die Recherche hatte selbst den Einwand notiert: „Zwei Übersichten
derselben Sache sind eine zu viel." Das stimmte schon vorher, nur an
einer anderen Stelle. „Braucht Aufmerksamkeit" listete Überfälliges und
fehlendes Material **je Studio**; beim Chef der Demo waren das 14
Zeilen „N Artikel fehlen", drei Bildschirme lang, und die Tafel darunter
sagte dasselbe noch einmal. Jetzt steht dort je Art eine Zeile mit der
Summe und wo („54 Artikel fehlen · in 14 Studios: …"). Die
Aufschlüsselung je Studio steht nur noch in der Tafel.

Weitere Änderungen an der Tafel:
- **Die Kacheln sind jetzt `<button>`** statt `<div>` mit Klick, also
  mit der Tastatur erreichbar.
- **„Klein" ist ruhig, aber nicht blass.** Das alte
  `.sauber{opacity:.72}` drückte den Namen unter 4,5 : 1.
- **Die Karte startet weiter zugeklappt.** `test-verwaltung-bereich9`
  hält fest, dass der Überblick höchstens 2,4 Bildschirme lang ist, und
  vierzehn offene Kacheln wären mehr. Ich hatte sie zuerst aufgeklappt,
  und der Durchlauf wurde zu Recht rot.
- **Die fünf Kennzahlen darüber:** auf dem Handy stand „Team" allein in
  einer halben Zeile. Die übrig bleibende letzte Kachel nimmt jetzt die
  ganze Breite.

### Geprüft

- **Neuer Durchlauf `tests/test-block-a.js` mit 38 Zusicherungen,**
  darunter drei Gegenproben:
  - die Wahl eines fremden Kontos gilt nicht;
  - im bisherigen Design gibt es keine Schnellzugriffe;
  - am Rechner bleibt „+ Neu" oben.
- **Gegen den Stand vor der Runde** ist der Durchlauf rot. Er prüft
  also etwas.
- **Trefferflächen per `elementFromPoint`:**
  - geprüft: jeder Schnellzugriff, jede Zeile und jeder Knopf im
    Auswahlfenster sowie der Daumen-Knopf, offen und zusammengerückt;
  - bei 320 / 390 / 430 / 820 px, in „normal" und „kompakt", als
    Mitarbeiter und als Chef;
  - 520 Messungen, alle mindestens 44 × 44 und im Bild.
- **Kontrast an echten Bildpunkten:** Schnellzugriffe, „Anpassen", der
  Daumen-Knopf und das grosse Bento-Feld liegen in beiden Farbmodi
  zwischen 6,0 und 19,1 : 1.
  - Eine Messung war falsch: für die kleine Stellen-Marke im
    Auswahlfenster ergab die Bildpunkt-Methode 1,86 : 1. Sie hatte die
    Zeile um die 24-Pixel-Marke herum gemessen, nicht die Marke selbst.
  - Nachgerechnet aus den berechneten Farben sind es 7,3 : 1 (dunkel)
    und 7,6 : 1 (hell).
  - Den „Fix", den ich schon eingebaut hatte, habe ich wieder
    herausgenommen.
- **Oberfläche:** 126 Durchläufe, alle sauber.


---

## Runde 103, zweiter Teil — Block B: Schicht und Woche

> „mach danach weiter mit block b"

Block A war zu diesem Zeitpunkt gemerged (#147) und live nachgeprüft:
die ausgelieferte Seite ist bytegleich mit `main`.

### B1 · Der Wochenstreifen

Oben in „Ich → Woche" stehen jetzt sieben Felder, Mo bis So. Jedes
zeigt den Wochentag, das Datum und einen Punkt je Art Eintrag (Dienst,
frei, Termin, To-do, Aufgabe). Heute ist gefüllt. Ein Tipp zeigt in der
Liste darunter nur diesen Tag, die Überschrift nennt ihn und bietet
„ganze Woche". Ein zweiter Tipp zeigt wieder alles.

- **Breite:** Die Recherche hatte vorher gerechnet: sieben Tage zu
  44 px sind 308 px, bei 320 px bleiben 288. Statt wischbar zu werden,
  läuft der Streifen unter 340 px bis an den Bildschirmrand (45,7 px je
  Tag). Der Abstand zwischen den Tagen steckt **innen** (das sichtbare
  Feld hat 2 px Rand), damit die ganze Spalte trifft. Nachgemessen per
  `elementFromPoint` bei 320, 390, 430 und 820 px.
- **Dieselben Punkte wie im Kalender:** `ichPunkteHTML()` ist aus
  `ichZelle()` herausgelöst und wird von beiden benutzt. Dabei ist
  aufgefallen, dass Aufgaben mit Frist (`aufgabe`) im Kalender nie einen
  Punkt bekamen; die Reihenfolge der Punkte kannte die Art nicht. Jetzt
  kennt sie sie.
- **Beim Nachsehen gefunden:** Bei 320 px stand „Dienst · Hürth" in
  der Wochenliste in drei Zeilen untereinander. `.ich-was` hatte
  `flex:1` ohne Grundbreite und schrumpfte auf gut 40 px. Mit `8em`
  Grundbreite bricht jetzt die Uhrzeit in die nächste Zeile, nicht das
  Wort.

### B2 · Schichttausch — die Recherche lag falsch

Die Recherche sagte „der zweite Schritt fehlt". Das stimmte nicht. „Ich
kann nicht" → „Ich übernehme" → „Bestätigen" gibt es seit Langem, in
beiden Regel-Welten abgesichert. Die Korrektur steht jetzt in der
Recherche-Datei selbst.

Was wirklich fehlte, war die **Sichtbarkeit**. Ein Angebot stand nur im
Schichtplan, und dort nur für das Studio, das gerade gewählt ist. Wer
eine Schicht abgab, war darauf angewiesen, dass ein Kollege zufällig
den Plan öffnet.

Jetzt gibt es auf der Startseite den Block **„Zum Übernehmen"**, direkt
unter „Heute":
- Angebote aus den eigenen Studios („Morgen · 16:00–21:00 / Juna Ritter
  gibt ab");
- bei der Leitung zuerst, was auf ihre Bestätigung wartet („Tausch
  bestätigen · Sa., 26.09. / Lena Brandt statt Sami Brandt · …").
  Zuerst stand dort „Lena Brandt übernimmt – bestätigen?". Das war bei
  390 px abgeschnitten, und abgeschnitten fehlte genau das Wort, das
  sagt, was zu tun ist.
- Ein Tipp öffnet den Schichtplan im **richtigen Studio** und in der
  **richtigen Woche**. Dort steht dann „Ich übernehme".

**Keine Abfrage zusätzlich, keine Regel neu.** `loadMyShifts()` holte
schon immer alle Schichten der eigenen Studios für die nächsten sieben
Tage und warf alles weg, was nicht die eigene war. Die Angebote kommen
aus genau diesen Daten.

**Nicht gemacht:**
- Eine Push-Nachricht beim Ausschreiben. Das braucht eine Cloud
  Function, also etwas, das ich hier nicht gegen das echte Firebase
  prüfen kann.
- Für den Chef ohne eigene Studio-Zuordnung bleibt „Tausch bestätigen"
  leer, weil `loadMyShifts()` nur die eigenen Studios liest. Die
  Leitung eines Studios sieht es.

**Demo:** Im ersten eigenen Studio gibt es jetzt ein Angebot und eine
Zusage. Die Kollegen kommen aus `leuteIn()`, nicht aus `jemandIn()`:
jede zusätzliche Zufallsziehung hätte alle folgenden Demo-Daten
verschoben, und darauf verlassen sich andere Durchläufe.

### Geprüft

- **Neuer Durchlauf `tests/test-block-b.js`** mit 27 Zusicherungen,
  darunter zwei Gegenproben:
  - ein leerer Tag sagt „nichts eingetragen", statt still die Woche zu
    zeigen;
  - der Mitarbeiter sieht keine Bestätigen-Zeile.
- **Gegen den Stand von Block A** ist der Durchlauf rot.
- **Oberfläche:** 127 Durchläufe. Einer war rot, und zu Recht:
  `test-neu-design` meldete für den Chef beim iPhone SE (320 × 568) „339
  Pixel Inhalt in 294 Platz".
  - **Ursache:** Mit „Zum Übernehmen" kam eine sechste Kategorie dazu.
    „Ausserdem" stand danach in vier Reihen, und die Schnellzugriffe aus
    Block A nahmen darunter weitere 56 Pixel.
  - **Kleinere Knöpfe gehen nicht,** weil 44 px die Grenze sind.
    Kompaktere Abstände brachten 30 Pixel; es fehlten 45.
  - **Entschieden:** Unter 600 Pixeln Höhe entfällt die Zeile der
    Schnellzugriffe. „Alles auf einer Seite" ist dort die ältere und
    wichtigere Zusage, und die Ziele bleiben zwei Tipps entfernt über
    „Alles".
  - **Danach:** 350 in 350, grün. Die übrigen 126 Durchläufe waren
    sauber.


---

## Runde 103, dritter Teil — Block C: Gefühl und Bewegung

> „mach dann block c weiter"

Block B war zu diesem Zeitpunkt gemerged (#148).

### C1 · Federn beim Abhaken und Senden — und nur dort

Die Recherche schlug vor, den Haken beim Abhaken nachfedern zu lassen.
Beim Nachsehen stellte sich heraus: das gab es schon (`checkPop`), nur
an der falschen Stelle. Zwei Dinge waren kaputt, beide gemessen:

- **Die Feder lief auf allen erledigten Haken.** Die Regel hiess
  `.todo.done .check`, also jede erledigte Aufgabe bei jedem Zeichnen
  der Liste. Hakte der Chef der Demo eine Aufgabe ab, federten
  gleichzeitig **15** Haken. Das ist genau die „Bewegung um ihrer
  selbst willen", die die NN/g kritisiert.
- **Das grüne Aufleuchten der Zeile ging verloren.** Der Horcher
  zeichnet die Liste im selben Augenblick neu, in dem man abhakt.
  Gemessen war nach 0 ms schon ein neuer Knoten da, und die Klasse
  `.just-done` hing am alten.

Jetzt merkt sich `frischMerken()` den Zeitpunkt. Die neu gezeichnete
Zeile trägt `.just-done` weiter, und `--seit` (eine negative
`animation-delay`) setzt die Bewegung dort fort, wo sie war, statt sie
neu anzufangen. Nach 700 ms ist Schluss, auch wenn die Liste danach
noch einmal gezeichnet wird. Dasselbe gilt im Putzplan.

**Senden:** Der Knopf federt einmal (Web Animations). Eine Klasse neu
zu starten hätte im Klick das Layout gelesen (`offsetWidth`), und das
verbietet „flüssig heisst konkret".

**Weniger Bewegung:** Wer im System „Bewegung reduzieren" eingestellt
hat, bekommt keine Feder, weder am Haken noch am Senden-Knopf.

### C2 · Formen-Kontrast, als Versuch nur auf der Startseite

Die Recherche sagt ausdrücklich „erst an einer Ansicht ausprobieren",
also ist es genau eine:
- **Inhaltszeilen:** 14 statt 22 px Radius.
- **Knöpfe unter „Ausserdem":** bleiben Pillen.

Ob das auf die anderen Ansichten übertragen wird, soll im Betrieb nach
dem Ansehen entschieden werden. Zurück ist es eine Zeile.

### Geprüft

- **Neuer Durchlauf `tests/test-block-c.js`** mit 17 Zusicherungen,
  darunter zwei Gegenproben mit „weniger Bewegung".
- **Gegen den Stand von Block B** sind 6 davon rot:
  - 15 Federn statt einer;
  - kein Aufleuchten nach dem Neuzeichnen;
  - keine Feder am Senden-Knopf;
  - 22 px Radius statt 14.
- **Eine Zusicherung prüft zu wenig:** „beim Öffnen federt nichts" ist
  auch mit dem alten Stand grün. Die Federn sind beim Messen nach
  900 ms schon vorbei. Den Unterschied zeigt erst „ein späteres
  Neuzeichnen federt nicht noch einmal" (vorher 15).
- **Oberfläche:** 128 Durchläufe, alle sauber.
- **Am PC angesehen** (1440 × 900): Die Feder und der Formen-Kontrast
  wirken dort genauso. C1 hängt nicht an der Breite, C2 gilt für die
  Startseite in jeder Breite.

### Der PC ist das Hauptgerät

> „bitte leg genau so viel Fokus auf die PC-Nutzung wie auf die
> Handy-Nutzung … obwohl das das Hauptgerät ist"

Das stimmte: A1 bis C2 waren am Handy gemessen und am PC nur
angesehen. Seit dieser Runde steht in `CLAUDE.md`, dass jede Änderung
auch bei 1280, 1440 und 1920 px gemessen wird.

Die erste Messung am PC (1440 × 900):
- **Aufgaben:** Der erste Eintrag beginnt bei 486 px, 5 von 61 sind zu
  sehen, und jede Zeile ist 1.174 px breit.
- **Putzplan:** Der erste Punkt beginnt bei 684 px.

Der Platz ist da, er wird nur nicht genutzt. Die Vorschläge dazu (Liste
und Detail nebeneinander, Putzplan als Raster, Startseite in zwei
Spalten) stehen zur Entscheidung aus.


---

## Runde 103, vierter Teil — Block D: „Danke" an der Sache, und „Was ist neu"

> „mach dann weiter mit block d"
>
> „sorge bitte dafür, dass man nach jedem Merge einen Unterschied auch
> sehen kann in der App oder es zumindest nachvollziehen kann"

### D1 · Danke an der erledigten Aufgabe

An einer erledigten Aufgabe eines Kollegen steht jetzt „Danke" (44 px,
Pille). Ein Tipp macht daraus „Bedankt", ein zweiter nimmt es zurück.
Wer die Aufgabe erledigt hat, sieht „Danke von …" an der Zeile und oben
auf der Startseite unter „Neu für dich". Ein Tipp dort gilt als gelesen.

**Die Regel zuerst.** `nurEigenesDanke()` in `firestore.rules`, beide
Welten, geprüft am Emulator (`tests/rules/danke.test.js`, 36
Prüfungen). Jeder darf nur seinen eigenen Eintrag in der Karte `danke`
setzen oder löschen, und zwar:
- nur an einer erledigten Aufgabe,
- nicht an der eigenen,
- nur mit `fuer` = `doneAt` der aktuellen Erledigung,
- ohne zusätzliche Felder,
- nicht aus einem fremden Studio oder einer fremden Firma.

Die Gegenprobe gegen die alte Regel: 6 rot. Und die neue Regel steht
als ODER neben der alten, sie verengt nichts. Abhaken und „Ich
übernehme" gehen wie vorher, auch das ist geprüft.

**Warum `fuer`.** Tägliche Aufgaben setzen sich nicht durch einen
Schreibvorgang zurück, sondern durch die Uhr (`isDone()` vergleicht mit
dem Periodenbeginn). Ein Danke von gestern stünde sonst heute an einer
Aufgabe, die noch niemand gemacht hat.

**Warum kein Zähler.** Siehe „Wovon ich abrate" in der Recherche: eine
Rangliste unter Kollegen ist Leistungskontrolle. Am Dokument steht nur,
wer Danke gesagt hat.

**Nicht am Putzplan.** Dort hakt oft das Empfangstablet ab, und ein
Danke an den „Studio-Zugang" erreicht niemanden.

**Beim Bauen gefunden:**
- **Erledigte Aufgaben sind blass** (`opacity:.58`). Ein Knopf darin
  sah aus wie abgeschaltet und läge unter 4,5 : 1. Bei Zeilen mit
  Danke wird deshalb jedes Teil ausser dem Danke zurückgenommen, nicht
  die ganze Zeile.
- **Einmalige erledigte Aufgaben wandern nach 3 Stunden ins Archiv.**
  Ein Danke an ihnen ist danach nur noch auf der Startseite zu sehen.
  Die Demo hat deshalb zwei frisch erledigte Beispiele. Sie kommen ohne
  Zufallsziehung aus, damit sich die übrigen Demo-Daten nicht
  verschieben.

### Was ist neu

`NEUIGKEITEN` in `index.html`: ein Eintrag je Auslieferung, oben der
aktuelle Stand. Nach einer Auslieferung steht auf der Startseite oben
rechts „Neu". Die Pille sitzt dort, wo auf anderen Seiten „+ Neu"
steht: kein zusätzlicher Platz, am PC und am Handy dieselbe Stelle.

Ein Tipp zeigt:
- die Liste mit dem Stand,
- je Eintrag, was man sieht,
- „Zeigen ›" dorthin.

Der Tipp gilt als gesehen, bis zur nächsten Auslieferung (am Gerät
gemerkt). Dauerhaft liegt die Liste unter „Alles → Was muss ich wissen?
→ Was ist neu".

Die Regel dazu steht in `CLAUDE.md`: **ein PR ohne Eintrag ist nicht
fertig.** Rückwirkend eingetragen sind die Blöcke A bis D dieser Runde.

**Eine Einschränkung, offen gesagt:** Die Pille, die Startseiten-Blöcke
und die Schnellzugriffe gibt es nur im **neuen Design**. Ob euer
Betrieb es firmenweit eingeschaltet hat, kann ich von hier nicht sehen
(kein Zugriff auf die echte Datenbank). Im Demo-Modus ist es immer an.

### Geprüft

- **Oberfläche:** `tests/test-block-d.js` mit 26 Zusicherungen, **am
  PC (1440 × 900) und am Handy (390 × 844)**, darunter drei
  Gegenproben:
  - kein Danke-Knopf an der eigenen Aufgabe;
  - kein Danke-Knopf an offenen Aufgaben;
  - kein Zähler je Person.
- **Regeln:** 17 Dateien, 1.177 Einzelprüfungen, alle grün.
- **Oberfläche gesamt:** 129 Durchläufe. Einer war rot, zweimal zu
  Recht:
  - **Der Test:** `test-neu-design` kannte als Zeile in „Alles", die ein
    Fenster öffnet statt einer Seite, nur „Hilfe im Studio". „Was ist
    neu" ist dieselbe Art; der Test prüft jetzt, dass sein Fenster
    aufgeht.
  - **Die App:** Beim iPhone SE (568 px hoch) brach die Kopfzeile mit
    der „Neu"-Pille um, und die Startseite war 339 px hoch in 332 Platz.
    Unter 640 px Höhe steht die Pille deshalb nicht da; die Liste bleibt
    unter „Alles".
  - **Danach** grün, die übrigen 128 waren sauber.


---

## Runde 103, fünfter Teil — P2: Putzplan, Inhalt zuerst (PC und Handy)

> „innerhalb der Testphase aus den letzten Wochen ist aufgefallen, dass
> der am meisten benutzte Bereich der Aufgaben- und Putzplan-Bereich
> ist und der Startbildschirm, aber der Chat eher wenig genutzt wird"
>
> „bitte leg genau so viel Fokus auf die PC-Nutzung wie auf die
> Handy-Nutzung"

### Vorher gemessen

Gemessen wurde, wo der erste Putzpunkt beginnt (Demo, Chef):

| | Handy (390 × 844) | PC (1440 × 900) |
|---|---|---|
| erster Punkt beginnt bei | y = 764 | y = 684 |
| Bedienelemente davor | 17 | 17 |
| Punkte sichtbar | 1, halb unter der Leiste | 3 von 5 |

Davor standen: die Studio-Auswahl (am PC ein 1.174 px breites Feld),
„Drucken" in einer eigenen Zeile, zwei Reihen Filter, die Sortierung,
die Kopfzeile einer Karte und das Kürzelfeld „Wer hakt ab?".

### Gebaut

- **Eine Leiste:** Studio, Fortschrittsbalken mit „3 von 5 erledigt",
  „Wer hakt ab?", „Filter", „Drucken".
  - **Filter und Kürzelfeld klappen auf**, wenn man sie braucht.
  - **Am Knopf steht der Zustand:** „Filter 2" sagt, dass zwei Filter
    laufen; „Wer: AB" sagt, wer gerade abhakt. Enter im Kürzelfeld
    klappt es wieder zu.
- **Gruppen nach Rhythmus:** Täglich, Wöchentlich, In eigenem Abstand,
  Einmalig — jede mit „x von y" und einem schmalen Balken. Ist eine
  Gruppe fertig, wird sie grün.
  - **Am PC stehen die Gruppen nebeneinander.**
  - **Nur in der Standard-Sortierung.** Wer ausdrücklich nach Name,
    Rhythmus, „zuletzt" oder Dringlichkeit sortiert, bekommt die flache
    Liste in genau dieser Reihenfolge. `test-sortierung` hat das beim
    ersten Versuch gemeldet: gruppiert stand ein erledigter täglicher
    Punkt über einem offenen wöchentlichen, und „offene vor erledigten"
    gilt beim Sortieren über den ganzen Plan.
- **Kein Kartenrahmen** um den Plan: er ist der Inhalt der Seite.

### Beim Bauen gefunden

- **Abgehakte Putzpunkte hatten ein leeres Kästchen.** Durchgestrichen,
  aber mit leerem Haken sahen sie zugleich erledigt und offen aus. Die
  Regel für das gefüllte Kästchen galt nur für `.todo`, nie für
  `.pp-item`.
- **Ein Haken liess den ganzen Plan neu einlaufen.** Der Horcher zeichnet
  die Liste bei jeder Änderung neu, und `listIn` lief dann auf allen
  Punkten erneut, gestaffelt: gemessen 4 Animationen für einen Haken.
  Jetzt läuft der Plan nur beim ersten Zeichnen eines Studios ein;
  danach federt nur, was man abgehakt hat. Dazu `backwards` statt
  `both`, nach unserer eigenen Regel.
- **Beinahe durchgerutscht:** Nach einer Änderung im Skriptblock
  fehlte `tools/csp.js --setzen`, und die Messung lief gegen eine App,
  die gar nicht startete. Genau die Falle, die in `CLAUDE.md` steht;
  bemerkt, weil die Messung „nicht gefunden" meldete statt einer Zahl.

### Nachher gemessen

| | Handy (390 × 844) | PC (1440 × 900) | PC (1280 × 800) |
|---|---|---|---|
| erster Punkt (Chef) | y = 478 | y = 410 | y = 410 |
| erster Punkt (Mitarbeiter) | y = 426 | y = 410 | y = 410 |
| Punkte sichtbar | 3 | alle 5 | alle 5 |

### Geprüft

- **Neuer Durchlauf `tests/test-p2-putzplan.js`** mit 25 Zusicherungen,
  bei 390, 1280 und 1440 px, dazu die Leiste bei 320 px (jedes Element
  mindestens 44 × 44 und im Bild).
- **Gegenproben:**
  - nach Name sortiert ergibt eine flache Liste;
  - ein Haken lässt den Plan nicht neu einlaufen (vorher 4).
- **Zwei alte Durchläufe öffnen jetzt zuerst „Filter"**, wie ein Mensch
  es täte: `test-sortierung` und `test-putzplan-werkzeuge`. Vorher
  tippte `page.fill('#ppSearch')` in ein zugeklapptes Feld und wartete
  bis zum Abbruch.
- **Oberfläche:** 130 Durchläufe, alle sauber.

## Runde 103, sechster Teil — P1: Aufgaben am PC, Liste links und Detail rechts

> „bitte leg genau so viel Fokus auf die PC-Nutzung wie auf die
> Handy-Nutzung, … obwohl das das Hauptgerät ist"

### Vorher gemessen

Gemessen wurde, wo die erste Aufgabe beginnt und wie viele **ganz** im
Bild stehen (Demo):

| | PC 1440 × 900, Chef | PC 1440 × 900, Mitarbeiter | PC 1280 × 800, Mitarbeiter | Handy 390 × 844, Chef |
|---|---|---|---|---|
| erste Aufgabe bei | y = 486 | y = 443 | y = 443 | y = 449 |
| ganz im Bild | 4 von 61 | 4 von 5 | 3 von 5 | 3 von 61 |

Am PC war jede Zeile 1.174 px breit, und über der Liste stand der
Seitenkopf „Aufgaben" ein zweites Mal — unter dem Bereichskopf, der
dasselbe schon sagte. Auf der Startseite stand so „Guten Morgen" doppelt.

### Gebaut

- **Ab 1100 px zwei Spalten:** links die Liste, rechts die gewählte
  Aufgabe im Detail.
  - Das Detail zeigt Beschreibung, Teilschritte zum Antippen, Grund,
    Studio, Frist, Rhythmus, Zuständig, Erstellt von, Erledigt, das
    Danke, das Foto.
  - Knöpfe: „Abhaken" bzw. „Wieder öffnen", „Bearbeiten" (Leitung),
    „Foto", „Grund, Frist, mehr …".
  - Die Spalte bleibt beim Scrollen stehen (`sticky`).
- **Ohne eigene Wahl steht die erste OFFENE Aufgabe im Detail.** Wer
  eine Zeile anklickt, behält seine Wahl, auch wenn die Liste neu
  gezeichnet wird.
- **„Abhaken" im Detail drückt den Haken der Zeile.** So gibt es nur
  einen Weg zum Abhaken — mit Feder, Danke und allem, was daran hängt.
- **Am PC schlankere Zeilen:** Beschreibung, Teilschritte, Foto und Fuss
  stehen im Detail, nicht in der Zeile.
- **Tastatur**, nur in den Aufgaben, nur am PC, nie beim Tippen oder bei
  offenem Fenster: ↑/↓ (oder k/j) wählen, x oder Leertaste hakt ab,
  e bearbeitet, Enter öffnet „Grund, Frist, mehr".
- **„+ Neu" steht am PC im Bereichskopf.** Der doppelte Seitenkopf ist
  im neuen Design bei jeder Breite weg — damit auch das doppelte „Guten
  Morgen" auf der Startseite (P3 zum Teil vorweggenommen).
- **Am Handy bleibt alles, wie es war:** keine Detailspalte, ein Tipp
  auf die Zeile wählt nichts, „+ Aufgabe" bleibt unten in der
  Daumenzone.

### Warum so

- **Liste und Detail statt aufklappender Zeilen.** Am PC ist Breite
  da, aber Höhe knapp. Eine aufklappende Zeile schiebt alles darunter
  weg; eine Detailspalte lässt die Liste stehen, und man sieht beim
  Durchgehen mit ↓ sofort, worum es geht.
- **Ab 1100 px, nicht ab 820.** Darunter würde die Liste neben einer
  340 px breiten Detailspalte so schmal, dass Titel umbrechen.
- **Tastenkürzel ohne Umschalt- oder Strg-Taste**, weil am PC mit einer
  Hand an der Maus gearbeitet wird. Sie greifen nicht, solange ein Feld
  den Fokus hat — sonst hakte ein „x" im Suchfeld ab.

### Beim Bauen gefunden

- **Die Wahl sprang zurück.** Nach jedem Neuzeichnen wählte die Liste
  wieder die erste offene Aufgabe, auch wenn man eine andere angeklickt
  hatte. Jetzt merkt sich `_todoWahlVonHand`, dass gewählt wurde.
- **`hidden` an einem `.btn` wirkte nicht**, weil `.btn` `display`
  setzt. Im Detail wird deshalb über `style.display` geschaltet.
- **Eine Angabe doppelt** (`.td-info dt`, `margin`) — `test-gestaltung`
  hat es gemeldet, zusammengelegt.

### Nachher gemessen

| | PC 1440 × 900, Chef | PC 1440 × 900, Mitarbeiter | PC 1280 × 800, Mitarbeiter | Handy 390 × 844, Chef |
|---|---|---|---|---|
| erste Aufgabe bei | **y = 406** (486) | **y = 363** (443) | **y = 363** (443) | y = 449 (unverändert) |
| ganz im Bild | **7** von 61 (4) | **5** von 5 (4) | **5** von 5 (3) | 3 von 61 (unverändert) |

Nebenbei rückt auch der Putzplan am PC weiter nach oben, weil der
doppelte Kopf dort ebenfalls wegfällt: erster Punkt bei y = 331 statt
410 (1440 × 900).

Die Handy-Zahlen sind mit Absicht unverändert: dort war P2 der Schritt,
und die Aufgaben am Handy bekommen ihren eigenen (kompaktere Filter,
Gruppen nach Frist) — noch nicht gebaut.

### Geprüft

- **Neuer Durchlauf `tests/test-p1-aufgaben.js`** mit 28 Zusicherungen:
  - bei 1440 und 1280 px Detail, erste offene, Klick, ↓, x, „Abhaken";
  - Trefferflächen im Detail bei 1920, 1440 und 1280 px, in der Dichte
    „normal" und „kompakt" (per `elementFromPoint`);
  - Gegenprobe am Handy (390): keine Detailspalte, ein Tipp wählt nichts.
- **Was ist neu:** Eintrag „Aufgaben am PC: Liste links, Detail rechts".
- **Ein alter Durchlauf zieht mit:** `test-block-a` prüfte am Rechner, dass
  „+ Neu" im Seitenkopf steht. Der ist am PC jetzt weg, der Knopf steht
  im Bereichskopf. Die Gegenprobe prüft weiter dasselbe (nicht in der
  Daumenzone, sichtbar, oben) — nur mit dem neuen Ort, und sagt das im
  Test.
- **Oberfläche:** 131 Durchläufe; 130 im ersten Gesamtlauf sauber,
  `test-block-a` nach der Anpassung sauber.

## Runde 103, siebter Teil — P3: Startseite am PC in zwei Spalten

> „bitte leg genau so viel Fokus auf die PC-Nutzung wie auf die
> Handy-Nutzung"

### Vorher gemessen

Am PC lief „Was heute dran ist" als EINE Spalte über 1.174 px. Was
unten nicht mehr passte, fiel nach „Ausserdem" — während neben jeder
Zeile rund 800 px leer blieben.

| | PC 1440 × 900, Chef | PC 1440 × 900, Mitarbeiter | PC 1280 × 800, Mitarbeiter |
|---|---|---|---|
| Kategorien sichtbar | 4 | 4 | 3 |
| Zeilen sichtbar | 4 | 4 | 3 |
| nur als Knopf unter „Ausserdem" | 3 | 2 | 3 |

Das doppelte „Guten Morgen" (Seitenkopf unter dem Bereichskopf) ist
schon mit P1 weggefallen.

### Gebaut

- **Ab 1100 px zwei Spalten**, oben bündig. Links steht, was eine Frist
  oder einen Tag hat und getan werden muss: Überfällig, Heute, Zum
  Übernehmen, Offen. Rechts steht der Stand und was gelesen werden will:
  Putzplan, Neu für dich, Zu erledigen.
- **Am PC mehr Zeilen je Block**, zum Beispiel Überfällig bis 5 statt 3
  und Offen bis 5 statt 2. Die Einpassung (`heutePasst`) kürzt ohnehin,
  was nicht passt.
- **Fortschritt über dem Putzplan**, nur am PC: „44 von 70 erledigt"
  mit Balken in der Farbe des Putzplans. Grün wird er erst, wenn alles
  erledigt ist, denn dann ist es ein Status.
- **Wer das Fenster über die Grenze zieht**, bekommt die passende Form,
  ohne neu zu laden (`matchMedia`-Wechsel).

### Warum so

- **Links das Tun, rechts der Stand.** So bleibt die Leserichtung
  dieselbe wie am Handy: oben links steht das Dringendste. Nach
  Kategorie abwechselnd zu verteilen hätte „Überfällig" und „Putzplan"
  gleich hoch gestellt, und der Rang wäre wieder Zufall.
- **Gekürzt wird in der höheren Spalte.** Eine Zeile in der kürzeren
  wegzunehmen, gibt keinen Pixel frei — die Seite ist so hoch wie ihre
  höchste Spalte.
- **Der Fortschritt nicht am Handy:** Dort zählt jede Zeile Höhe, und
  „Putzplan · 6" sagt das Nötige.

### Beim Bauen gefunden

- **Die Einpassung kürzte bei Gleichstand „Überfällig" zuerst.** Der
  Kommentar über `heutePasst` verspricht das Gegenteil („ihre Zeilen
  fallen erst, wenn alles andere schon weg ist"), der Vergleich war
  aber `>` statt `>=`: bei zwei gleich langen Blöcken gewann der obere.
  Am PC sichtbar: „Überfällig · 4" mit einer Zeile, „Offen" darunter mit
  zweien. Am Handy wirkt der Unterschied nicht, dort steht am Ende ohnehin
  überall eine Zeile.
- **Der Fortschrittsbalken war zuerst blau** (der Bereichston aus
  `.pg-balken`). Er gehört zum Putzplan-Block, also Teal.

### Nachher gemessen

| | PC 1440 × 900, Chef | PC 1440 × 900, Mitarbeiter | PC 1280 × 800, Mitarbeiter | Handy 390 × 844 |
|---|---|---|---|---|
| Kategorien sichtbar | **7** (4) | **6** (4) | **6** (3) | 3 (unverändert) |
| Zeilen sichtbar | **10** (4) | **9** (4) | **9** (3) | 3 (unverändert) |
| unter „Ausserdem" | **0** (3) | **0** (2) | **0** (3) | unverändert |

**Offen fürs Handy:** Beim Chef steht dort „Putzplan · 26" nur unter
„Ausserdem". Der meistgenutzte Bereich bekommt am Handy mit P5 einen
eigenen Knopf in der unteren Leiste; die Startseite am Handy bleibt
deshalb in diesem Schritt unverändert.

### Geprüft

- **Neuer Durchlauf `tests/test-p3-startseite.js`** mit 30 Zusicherungen:
  - zwei Spalten bei 1100, 1280, 1440 und 1920 px, oben bündig, auf
    einen Bildschirm passend, keine Kategorie unter „Ausserdem" beim
    Chef 1440;
  - Fortschritt, Gleichstand-Regel, Fensterbreite ändern ohne Neuladen;
  - Trefferflächen aller Knöpfe der Liste bei 1100, 1280, 1440 und
    1920 px, in „normal" und „kompakt";
  - Gegenprobe am Handy (Chef und Mitarbeiter): eine Spalte, kein
    Balken, passt.
- **Was ist neu:** Eintrag „Startseite am PC: zwei Spalten".
- **Oberfläche:** 132 Durchläufe, alle sauber.

## Runde 103, achter Teil — P4: die Seitenleiste am PC nach Nutzung

> „der am meisten benutzte Bereich [ist] der Aufgaben- und
> Putzplan-Bereich und der Startbildschirm, aber der Chat eher wenig"

### Vorher gemessen (Demo, 1440 × 900)

- **Reihenfolge:** Start · Ich · Nachrichten · Aufgaben · Team ·
  Verwaltung · Alles. Nachrichten stand vor Aufgaben.
- **Putzplan:** nur als dritter Reiter hinter „Aufgaben", also zwei
  Klicks für den meistgenutzten Bereich.
- **Schnellzugriffe:** unten auf der Startseite in einer 600 px schmalen
  Reihe. Sie waren für den Daumen gedacht, den es am PC nicht gibt, und
  nahmen der Liste darüber 86 px (Scroll-Bereich 619 px hoch).
- **Einträge der Seitenleiste:** 43 px hoch, in der Dichte „kompakt"
  37 px.

### Gebaut

- **Neue Reihenfolge:** Start · Aufgaben · **Putzplan** · Ich ·
  Nachrichten · Team · Verwaltung · Alles.
- **Putzplan hat einen eigenen Eintrag.** Im Putzplan trägt er die
  Marke, nicht „Aufgaben". Unter „Aufgaben" bleibt er zusätzlich als
  Reiter.
- **Schnellzugriffe in der Seitenleiste** unter einer Trennlinie: die
  drei gewählten und „Anpassen", auf jeder Seite. Am PC stehen sie
  nicht mehr unten auf der Startseite. Der Hinweis im Wahlfenster nennt
  den Ort, der für das Gerät stimmt.
- **Mindesthöhe 44 px** für jeden Eintrag der Seitenleiste; das
  Seitenmenü scrollt, falls ein sehr niedriges Fenster es verlangt.

### Warum so

- **Putzplan als zusätzlicher Knopf, nicht als neue Gruppe.** An der
  Gruppe hängen die Bereichsfarbe, die Reiterzeile, die Richtung der
  Seitenwechsel und rund 35 Durchläufe. Ein zweiter, kürzerer Weg auf
  dieselbe Seite ändert davon nichts. Eine eigene Gruppe hätte all das
  neu verteilt, ohne dass jemand etwas davon sieht.
- **Schnellzugriffe links statt unten.** Am PC ist links der Ort, an dem
  man navigiert; unten ist er nur am Handy richtig. So sind sie auf
  jeder Seite erreichbar, und die Startseite bekommt ihre Höhe zurück.

### Beim Bauen gefunden

- **Die Einträge der Seitenleiste waren nie 44 px hoch:** 43 in
  „normal", 37 in „kompakt". Das war auf `main` genauso nachgemessen.
  Kein Durchlauf hatte die Seitenleiste am PC per Hit-Test gemessen;
  `test-p4-seitenleiste` tut es jetzt bei fünf Grössen und in beiden
  Dichten.

### Nachher gemessen

| | vorher | nachher |
|---|---|---|
| Klicks bis zum Putzplan (PC) | 2 | **1** |
| Höhe der Startseiten-Liste, 1440 × 900 | 619 px | **705 px** |
| Einträge der Seitenleiste, normal / kompakt | 43 / 37 px | **44 / 44 px** |
| Handy | — | unverändert |

### Geprüft

- **Neuer Durchlauf `tests/test-p4-seitenleiste.js`** mit 31
  Zusicherungen:
  - Reihenfolge je Rolle, Putzplan mit einem Klick und mit Marke;
  - die Schnellzugriffe führen hin, „Anpassen" öffnet die Wahl, eine
    geänderte Wahl steht sofort links;
  - Trefferflächen bei 1100, 1280 × 720, 1366 × 768, 1440 und 1920,
    in „normal" und „kompakt";
  - Gegenproben: am Handy bleiben die Schnellzugriffe unten, und das
    bisherige Design ist unverändert.
- **Was ist neu:** Eintrag „PC: Putzplan mit einem Klick,
  Schnellzugriffe links".
- **Oberfläche:** 133 Durchläufe, alle sauber.

## Runde 103, neunter Teil — P5: die untere Leiste am Handy nach Nutzung

> „der am meisten benutzte Bereich [ist] der Aufgaben- und
> Putzplan-Bereich und der Startbildschirm, aber der Chat eher wenig"

### Vorher (Demo, 390 × 844)

- **Leiste unten:** Start · Aufgaben · Nachrichten · Alles.
- **Putzplan:** zwei Tipps (Aufgaben, dann Reiter Putzplan).
  Nachrichten: einer.
- **Vorgeschlagene Schnellzugriffe:** Mitarbeiter bekamen „Putzplan"
  als ersten Vorschlag, die Leitung als dritten.

### Gebaut

- **Leiste unten:** Start · Aufgaben · **Putzplan** · Alles. Im
  Putzplan trägt „Putzplan" die Marke, nicht „Aufgaben".
- **Nachrichten unter „Alles"** (zwei Tipps). Ungelesenes bleibt
  sichtbar: „Alles" trägt den Punkt jeder Gruppe, die unten keinen
  eigenen Knopf hat, und die Startseite nennt Neues unter „Neu für
  dich". Welche Gruppe unten steht, liest die App jetzt aus der
  gezeichneten Leiste statt aus der Liste `NEU_LEISTE`. So stimmt der
  Punkt auch dann, wenn ein Knopf ersetzt wurde.
- **Ersatz:** Ist der Putzplan im Betrieb abgeschaltet, rückt
  „Nachrichten" an seine Stelle; ein Platz in der Leiste bleibt nie leer.
- **Vorschlag für die Schnellzugriffe:** „Meine Woche" statt
  „Putzplan", denn der steht jetzt unten und links. Wer selbst gewählt
  hat, behält seine Wahl.
- **Die Führung** hat einen Putzplan-Schritt. Der Nachrichten-Schritt
  zeigt am Handy auf „Alles" statt ins Leere.

### Warum so

- **Vier Knöpfe, nicht fünf.** Bei 320 px wären fünf Knöpfe je 64 px
  breit, und „Nachrichten" passte nicht mehr lesbar hinein. Die Leiste
  hat vier Plätze, weil vier ein lesbares Wort tragen (siehe Kommentar
  an `NEU_LEISTE`).
- **Nur im neuen Design.** Das bisherige Design behält seine Leiste;
  eine Gegenprobe prüft das.

### Beim Bauen gefunden

- **`test-quer` liess im neuen Design Bereiche still aus.** Eine Gruppe
  ohne eigenen Knopf in der Leiste wurde übersprungen (`continue`):
  Ich, Team und Verwaltung schon seit dem neuen Design, mit P5 auch die
  Nachrichten. `test-neu-messlatte` hat es an der Zahl der Messungen
  bemerkt (28 statt genug). Jetzt geht der Durchlauf wie ein Mensch über
  „Alles" und misst diese Bereiche mit — mehr Abdeckung als vorher.
- **Die Führung zeigte am Handy auf den Nachrichten-Knopf**, den es
  unten nicht mehr gibt. Sie zeigt jetzt auf „Alles".

### Durchläufe, die den neuen Weg gehen

Sie prüfen jeweils dasselbe wie vorher, nur auf dem neuen Weg; jeder
nennt den Grund im Test.

- `test-neu-design`: erwartet „Start, Aufgaben, Putzplan, Alles".
- `test-akzent`: misst den Farbwechsel von Start nach Aufgaben (Orange)
  statt nach Nachrichten (Teal).
- `test-block-c` und `test-navi-sichtbar`: in den Chat über „Alles".
- `test-block-a`: der neue Vorschlag „Meine Woche". Dazu prüft „die
  Auswahl zeigt die drei Gewählten mit ihrer Stelle" jetzt, dass die
  Stellen 1, 2 und 3 je einmal dastehen. Vorher prüfte es, dass die
  erste Zeile die Stelle 1 trägt, was nur zufällig stimmte: die Liste
  steht in der Reihenfolge von „Alles", nicht der Wahl.

### Nachher gemessen

| | vorher | nachher |
|---|---|---|
| Tipps bis zum Putzplan (Handy) | 2 | **1** |
| Tipps bis zu den Nachrichten (Handy) | 1 | 2 |
| Knöpfe der Leiste bei 320 / 390 / 430 / 820 px, normal und kompakt | ≥ 44 × 44 | ≥ 44 × 44, im Bild |

### Geprüft

- **Neuer Durchlauf `tests/test-p5-leiste.js`** mit 22 Zusicherungen,
  darunter:
  - eine neue Chatnachricht in der Demo setzt den Punkt an „Alles";
  - die Gegenprobe im bisherigen Design.
- **Was ist neu:** Eintrag „Handy: Putzplan unten in der Leiste".
- **`test-akzent` misst den Farbwechsel jetzt zum Putzplan** (erst zu
  den Aufgaben versucht). Bei den Aufgaben fiel die Probe bei 90 ms in
  einem von drei Läufen vor das erste Bild. Die Aufgaben brauchen bis
  dahin 245–577 ms (CPU ÷4); vor P1 war es genauso. Das ist kein
  Fehler der Farbe, sondern eine langsame Seite. Sie steht als **P-17**
  in `docs/BEKANNTE-PROBLEME.md` und ist der nächste Schritt.
- **Oberfläche:** 134 Durchläufe; 133 im Gesamtlauf sauber, `test-akzent` nach der Umstellung auf den Putzplan fünfmal hintereinander sauber.

## Runde 104, erster Teil — das Profil-Blatt steht am Handy fest

> „Die Profilseite auf dem Handy, wo man das Aussehen etc. bearbeiten
> kann, ist nicht fixiert und lässt sich horizontal sowie vertikal
> verschieben — das ist nicht so optimal auf dem Handy."

### Gemessen

- **Quer:** Das Blatt war bei 320, 390 und 430 px jeweils **4 px breiter
  als der Bildschirm** (`scrollWidth` 392 bei 388). Ein Querwisch mit
  echten Touch-Ereignissen schob es um genau diese 4 px.
- **Ursache:** Die Fläche unter „Speichern" (`#pmSave::after`) reichte
  fest 24 px nach links und rechts. Am Handy hat das Blatt aber nur
  20 px Innenabstand; die 4 px darüber hinaus machten es quer
  scrollbar.
- **Senkrecht:** Weder am Blatt noch am abgedunkelten Rand stand ein
  `overscroll-behavior`. Auf iOS läuft die Bewegung am Anfang oder Ende
  dann an die Seite dahinter weiter, und der ganze Bildschirm federt
  mit.

### Gebaut

- **Der seitliche Rand der Fläche kommt aus `--pm-rand`.** Die Variable
  wird dort gesetzt, wo auch der Innenabstand gesetzt wird: 24 px am
  Rechner, 20 px am Handy.
- **Am Handy** tragen alle Blätter `overscroll-behavior: contain` und
  `touch-action: pan-y`: der Inhalt scrollt senkrecht, quer gibt es
  nichts zu schieben. Der abgedunkelte Rand daneben trägt
  `touch-action: none`.

### Nicht prüfbar hier

Das Nachfedern von iOS Safari gibt es in Chromium nicht. Geprüft ist
die Regel, die es abstellt, nicht das Federn selbst. Ob es auf einem
iPhone ganz weg ist, muss am Gerät bestätigt werden.

### Geprüft

- **Neuer Durchlauf `tests/test-profil-fest.js`** mit 24 Zusicherungen
  bei 320, 390 und 430 px, mit echten Touch-Ereignissen:
  - nicht breiter als der Bildschirm;
  - ein Querwisch verschiebt nichts;
  - ein Wisch senkrecht scrollt den Inhalt, das Blatt bleibt stehen;
  - am Ende läuft nichts weiter;
  - ein Wisch neben dem Blatt bewegt nichts;
  - „Speichern" ≥ 44 × 44.
- **Gegenprobe gegen `main`:** 6 von 24 falsch, nämlich Breite und
  Querwisch bei allen drei Breiten.
- **Gefunden beim Bauen des Tests:** `Input.synthesizeScrollGesture`
  mit „touch" scrollte in dieser Umgebung gar nichts, auch die
  Aufgabenliste nicht. Ein Test damit wäre immer grün gewesen. Der
  Durchlauf schickt deshalb einzelne Touch-Ereignisse
  (`Input.dispatchTouchEvent`).
- **Oberfläche:** 135 Durchläufe, alle sauber.

## Runde 104, zweiter Teil — EMS-Wissen im Hilfe-Fenster

> „schau dir mal diesen link an und füge ALLES was du dort an
> informationen zu dir nehmen kannst zu dem Hilfe Knopf/Seite hinzu
> ebenso mit Schlagwörtern und Empfehlungen … das man oben eine frage
> stellen kann und … das System die Sachen anzeigt die am ehesten dazu
> passen würden also so wie google aber NUR für Ems training"

Auf die Rückfrage entschieden: **A** (eigene Kurzfassungen mit Quelle
und Link statt einer Kopie) und **W1** (intern suchen, dazu ein Knopf
ins Internet, beschränkt auf eine Liste seriöser Seiten).

### Die Quelle

Die FAQ von www.ems-training.de hat 57 Artikel in vier Kategorien:
Grundlagen 11, Gesundheit & Sicherheit 24, Praxis 15, Kosten &
Anbieter 7. 56 davon stammen von der Redaktion der Seite, einer von
einem externen Autor (Stephan Müller, Ernährung). Die Artikel liegen als
Daten in der Seite. Ausgelesen wurden sie mit einem Skript, weil ein
einfacher Abruf nur die Kategorien zeigt.

### Warum keine Kopie

Die Seite erlaubt Weiterverwendung nur mit Quelle, Link und
Autorennennung. Sie verbietet ausdrücklich die „systematische Übernahme
… ersetzend … ohne eigenen redaktionellen Mehrwert“, und Texte externer
Autoren sind von der Freigabe ausgenommen. Das Repository ist
öffentlich, eine Abschrift wäre also eine Veröffentlichung.

Deshalb steht in `ems-wissen.js` je Frage:
- eine **Kurzfassung in eigenen Worten**;
- **„So erklärst du es“**: ein, zwei Sätze für den Kunden;
- **„Achtung“**: wann Leitung oder Arzt gefragt werden;
- **Schlagwörter**;
- **„Passt auch dazu“**;
- der **Link auf genau diesen Artikel**, mit Autor und Lesezeit.

Aus einem Lesetext für Endkunden wird so eine Arbeitshilfe für den
Empfang. Das ist der Mehrwert, den die Bedingungen verlangen.

### Fachlich nachgeprüft

Die Sicherheitsangaben stehen nicht nur, weil die FAQ sie nennt. Sie
sind an den beiden Arbeiten nachgelesen, auf die sich die FAQ beruft:

- **von Stengel et al. 2024** (Kontraindikationen, Tabelle 3): Die
  absoluten und relativen Kontraindikationen stimmen Wort für Wort mit
  dem Eintrag „Kontraindikationen“ überein.
- **Kemmler et al. 2023** (Leitlinie):
  - 20 Minuten;
  - in den ersten 8–10 Wochen höchstens 1× pro Woche;
  - danach ≥ 4 Tage Pause zwischen intensiven Einheiten;
  - Betreuung 1:1, im nicht-medizinischen Bereich 1:2 vertretbar;
  - Einstieg mit 5 Minuten Gewöhnung und 12 Minuten Intervall;
  - je 250–500 ml Flüssigkeit 30 Minuten vorher und direkt danach;
  - 24–48 Stunden vorher keine Muskelrelaxanzien.
- **Ein Widerspruch in der Quelle:** Zwei FAQ-Artikel nennen „mindestens
  5 Tage“ Pause. Hier steht durchgehend der Wert der Leitlinie,
  4 Tage.

Nicht nachgeprüft sind Einzelstudien, etwa die 17 % bzw. 460 kcal beim
Kalorienverbrauch, und die Preisangaben. Sie sind als Angaben der Quelle
gekennzeichnet. Die Preise tragen zusätzlich den Hinweis, dass es
Marktwerte sind und nicht die Preise des Studios.

### Gebaut

- **Ein Suchfeld für beides.** Handbuch (115) und EMS-Wissen (57)
  stehen in einer Trefferliste nach derselben Wertung; jede Zeile sagt,
  woher sie kommt. Zwei getrennte Listen hätten verlangt, vorher zu
  wissen, wo die Antwort liegt.
- **Suchwörter:** 36 neue Synonymgruppen für EMS, zum Beispiel
  Schrittmacher = Implantat, Ozempic = Abnehmspritze, schwanger =
  Schwangerschaft.
- **„Häufig gefragt“:** elf Schlagwörter zum Antippen. Dazu vier
  EMS-Kacheln mit Zahl und eine Detailansicht mit Kurzfassung, „So
  erklärst du es“, „Achtung“ (Bernstein, weil es eine Warnung ist),
  „Ganzen Artikel lesen ›“, „Passt auch dazu“, Schlagwörtern und dem
  Satz „keine ärztliche Beratung“.
- **Im Internet suchen (W1):** Google in neuem Tab, die Frage immer mit
  „EMS“ davor und beschränkt auf die acht Seiten, die der Betrieb
  genannt hat. Der Hinweis dazu sagt, dass die Frage an Google geht,
  also keine Kundennamen.
- **Eine Datei wie das Handbuch:** Sie wird erst beim Öffnen geladen,
  liegt im Vorrat des Service Workers (`sw.js` v8) und ist im
  Auslieferungsablauf eingetragen. Es gibt keinen Lesevorgang in der
  Datenbank, und alles läuft ohne Netz.

### Beim Bauen gefunden

- **Lose Treffer:** „Schrittmacher“ brachte auf Platz vier „Kunde möchte
  Trainingspause“, über ein Synonym und ein Wort im Fliesstext. Jetzt
  fällt weg, was unter 35 % des besten Treffers liegt.
- **Tippfehler schlecht gewichtet:** „muskelkatr“ fand zuerst „Warum
  wirkt EMS — was passiert im Muskel?“. Ein kurzes Wort, das nur der
  Anfang der Eingabe ist („muskel“), zählte fest 0,75 und schlug den
  eigentlich gemeinten Tippfehler-Treffer (0,5). Jetzt zählt so ein
  Wort nach dem Anteil, den es abdeckt.
- **„Schliessen“ im Hilfe-Fenster war am Rechner 40 × 40**, auch auf
  `main`; jetzt ist er 44 × 44.
- **Die Kopfzeile am PC erfüllt die 44-px-Regel nicht:** Glocke,
  Hell/Dunkel und Abmelden sind 40 × 40, Bericht, Hilfe und Suchen
  36 px hoch. Sie wurde bisher nur am Handy gemessen. Das ist ein
  eigener nächster Schritt, weil es die Höhe der Kopfzeile ändert.

### Durchläufe

- **Neu: `tests/test-ems-wissen.js`** mit 53 Zusicherungen:
  - 57 Einträge, 11/24/15/7, jeder mit eigenem Originallink;
  - acht Fragen gegen den erwarteten Eintrag an Platz 1, darunter ein
    Tippfehler und ein Synonym;
  - „gerät piept“ bleibt beim Handbuch;
  - Internet-Knopf: „EMS“, die acht Seiten, neuer Tab, `noopener`,
    Warnung;
  - Gegenprobe mit einem Unsinnswort;
  - Eintrag, Kachel, Schlagwort;
  - Trefferflächen bei 320 / 390 / 430 / 820 / 1280 / 1440 / 1920 px,
    in „normal“ und „kompakt“, auf Start-, Treffer- und Eintragsansicht.
- **`test-loesungen`: die Prüfung „elektrde“ gilt jetzt je Quelle.**
  Vorher musste jeder Treffer „Elektrode“ im Titel tragen. Jetzt steht
  dort zu Recht auch „Wie funktioniert EMS-Training technisch?“. Geprüft
  wird: jeder Handbuch-Treffer trägt „Elektrode“ im Titel, jeder
  EMS-Treffer führt „elektrode“ in seinen Schlagwörtern. So streng wie
  vorher, nur für zwei Quellen.
- **Gesamtdurchlauf: 136 von 136 grün**, mit dem neuen Durchlauf.

## Runde 104, dritter Teil — Schulungen zum Lesen

> „dann können wir passend dazu Schulungen erstellen die auch etwas
> länger sind wo man dann erstmal was lesen muss und das dann später
> durch videos ersetzt werden kann" — „Pflichtmodul muss es erstmal
> nicht geben" (24.9.2026)

### Was gebaut wurde

- **Neue Schrittart `lesen`.** Ein Lesetext kann auf zwei Wegen
  entstehen. Er kann Einträge aus `ems-wissen.js` nennen (`ems: [...]`)
  oder eigenen Text tragen, den die Leitung im Editor unter
  „Lesetext (lang)“ schreibt. `quelle` ist das Video dazu:
  - Solange es fehlt, steht am Schritt „Etwa N Minuten Lesezeit ·
    später als Video“.
  - Sobald es da ist, steht das Video oben und der Text darunter als
    „Zum Nachlesen“.
- **„Weiter“ ist erst frei, wenn BEIDES erfüllt ist**:
  - Man hat bis zum Ende gescrollt. Eine Marke unter dem Text muss im
    Bild gewesen sein (`IntersectionObserver`).
  - Eine Mindestzeit ist vergangen: die Hälfte der üblichen Lesezeit
    bei 200 Wörtern pro Minute, mindestens 15 Sekunden.

  Die Seite sagt, woran es liegt („bis zum Ende gelesen“ /
  „Noch N Sekunden“). Beim Zurückblättern gilt ein gelesener Schritt als
  gelesen. Ist ein Video da, entfällt die Sperre, weil das Video selbst
  die Zeit braucht.
- **Fünf Module in der neuen Kategorie „EMS-Wissen“**, keines Pflicht:
  EMS verstehen und erklären; Kontraindikationen und Sicherheit;
  Besondere Kundengruppen; Ergebnisse ehrlich erklären; Beratung, Preise
  und Probetraining. Zusammen haben sie 17 Lese-Schritte und 28 Fragen, und
  jede Frage hat einen Hinweis, der erklärt statt tadelt.
- **Am Rechner** (ab 1.100 px):
  - Der Text steht auf Lesebreite (68 Zeichen, gemessen 615 px).
  - Rechts daneben stehen die Abschnitte des Schritts zum Springen.

  Eine Textzeile über die ganze Kartenbreite von 1.175 px läse niemand
  bis zum Ende. Nur schmal gesetzt, bliebe aber die halbe Karte leer.

### Warum so entschieden

- **Der Lesestoff steht nicht in `schulungen-basis.js`, sondern wird
  aus `ems-wissen.js` genommen.** So gibt es jeden Text genau einmal.
  Wer eine Antwort im Hilfe-Fenster berichtigt, berichtigt sie auch in
  der Schulung. Zwei Fassungen wären nach der ersten Korrektur zwei
  verschiedene.
- **Die Lesesperre ist kein Beweis fürs Verstehen.** Dafür stehen am
  Ende die Fragen. Sie verhindert nur das Wegklicken in zwei Sekunden.
  Die Hälfte der Lesezeit ist bewusst knapp: wer schnell liest, soll
  nicht warten müssen.
- **Eine eigene Fassung behält die Verweise.** Der Editor speichert
  bei einem Lesetext `ems` und `quelle` mit. Ohne das wäre ein
  EMS-Modul nach dem ersten Speichern leer, und niemand hätte es
  gemerkt, weil das Textfeld im Editor ohnehin leer ist. Der Editor
  sagt deshalb dazu, welche Texte aus dem EMS-Wissen dazugehören.
- **Keine Regeländerung nötig:** `schulungen` prüft keine Felder
  einzelner Schritte (beide Pfade gelesen, `firestore.rules` Z. 955 und
  1813).

### Durchläufe

- **Neu: `tests/test-ems-schulung.js`** mit 69 Zusicherungen:
  - Kategorie, fünf Module, keines Pflicht, noch kein Video;
  - Lesetext = Einträge aus dem EMS-Wissen, mit Originallinks in einem
    neuen Tab;
  - Sperre mit einer Gegenprobe je Hälfte: nur Zeit hält gesperrt, nur
    gescrollt hält gesperrt, erst beides öffnet „Weiter“;
  - ein Druck auf den gesperrten Knopf bleibt ohne Wirkung;
  - Zurückblättern;
  - Editor: „Lesetext (lang)“, Video-Feld, Hinweis auf die EMS-Texte;
    nach dem Speichern als eigene Fassung steht der Text noch da;
  - Trefferflächen bei 7 Breiten × 2 Dichten; Lesebreite und
    Seitenleiste am Rechner, Gegenprobe am Handy.

  Die Mindestzeit wird im Durchlauf über `Date.now` vorgestellt, nicht
  abgewartet.
- **Gesamtdurchlauf: 137 von 137 grün.** Beim ersten Lauf war
  `test-gestaltung` rot: die Marke „Ende des Textes“ hatte einen festen
  Buchstabenabstand (`.06em`). Er steht jetzt auf der Leiter
  (`--ls-m`); danach wurden `test-gestaltung`, `test-ems-schulung` und
  `test-csp` einzeln wiederholt, alle grün.

## Runde 104, vierter Teil — Kopfzeile: 44 px auf jedem Gerät

In Runde 104 (zweiter Teil) als offen notiert: Die Kopfzeile war nur am
Handy gemessen worden.

### Gemessen vorher (elementFromPoint, Leitung, „normal")

| Breite | zu klein |
|---|---|
| 1280 / 1440 / 1920 | Bericht 99 × 36, Glocke 40 × 40, Hilfe 82 × 36, Suchen 102 × 36, Hell/Dunkel 40 × 40, Abmelden 40 × 40, Kürzel 38 × 38 |
| 820 | wie oben; Kopfzeile 86 px hoch (Name auf zwei Zeilen) |
| 600 | **Abmelden 0 × 0** (aus dem Bild), Glocke 20 × 40 |
| 320–430 | Kürzel 38 × 38 (sonst alles 44) |

Der Mitarbeiter hatte dasselbe Bild, ohne Bericht und Glocke.

### Was geändert ist

- `.topbar .icon-btn{min-width:44px;min-height:44px;flex-shrink:0}`.
  Bericht, Hilfe und Suchen haben jetzt `min-height:44px` statt 36.
  Das Kürzel misst 44 × 44.
- **Name und Rolle stehen erst ab 1.100 px da**, vorher ab 600 px.
  Dazwischen brach der Name um.
- **Leitung zwischen 521 und 599 px:** Hell/Dunkel fällt weg wie am
  Handy (es steht unter Profil → Aussehen), und die Abstände sind so
  eng wie am Handy. Ohne das fehlten bei 521 px 22 px.
- **Die Kopfzeile ist 69 statt 66 px hoch** (kompakt 63 statt 60).
  Drei Pixel für sieben Griffe, die vorher zu klein waren.

### Was dabei schiefging

**Der erste Versuch setzte `width:44px`.** Diese Regel schlug wegen
höherer Spezifität das `width:auto` von Bericht, Hilfe und Suchen. Am
Rechner stand danach „Beric“ im Knopf. Der Hit-Test war trotzdem grün,
denn 44 px stimmten ja. Das Bildschirmfoto hat es gezeigt, nicht die
Messung. Deshalb prüft der neue Durchlauf zusätzlich, dass kein Wort
über seinen Knopf hinausragt (`scrollWidth > clientWidth`). Gegenprobe
mit der alten Regel: Bericht 57 > 42 und Suchen 49 > 42 werden
gemeldet.

### Durchläufe

- **Neu: `tests/test-kopfzeile.js`** mit 192 Zusicherungen:
  - Leitung und Mitarbeiter, 12 Breiten von 320 bis 1920 px, normal
    und kompakt;
  - geprüft werden Trefferfläche, abgeschnittene Wörter, Höhe und
    Querlauf;
  - Name ab 1.100 px, mit Gegenprobe darunter.
- **Gesamtdurchlauf: 138 von 138 grün.** Die Kopfzeile ist drei Pixel
  höher; kein bestehender Durchlauf hing an ihrer Höhe.

## Runde 105 — Die Schulung, die „nirgends“ war

> „ja lass uns das mit der ki nicht machen dann lieber wenn es keine
> kostenlosen alternativen gibt, dann lass uns lieber das aktuelle
> verbessern … und wo finde ich die neue schulung die ist niergends bei
> mir“ (24.9.2026)

### Die Ursache

`schulungen-basis.js` kam laut `firebase.json` mit `max-age=604800`,
also eine Woche Zwischenspeicher. Der Kommentar dort versprach: wer
`VERSION` in `sw.js` hochzählt, dessen Datei holt jedes Gerät beim
nächsten Start. Das stimmte nicht:
- `addAll()` im Service Worker holt **durch** den HTTP-Zwischenspeicher
  des Browsers.
- Wer die Schulungen in der Woche davor einmal geöffnet hatte, bekam
  beim Update die alte Datei in den neuen Vorrat.
- Das Aktualisieren im Hintergrund legte sie danach jedes Mal wieder
  hinein.

Die fünf Module waren ausgeliefert (live nachgeprüft: `m-ems-` 5-mal in
der Datei) und auf dem Gerät trotzdem nicht da. Dasselbe hätte jede
künftige Änderung am Handbuch getroffen (`loesungen-basis.js`).

### Die Reparatur, an zwei Stellen

- **`sw.js`:**
  - Der Vorrat wird mit `cache:'reload'` geholt, also am
    HTTP-Zwischenspeicher vorbei.
  - Die drei Inhaltsdateien fragen beim Aktualisieren im Hintergrund
    mit `no-cache` nach; ein 304 kostet fast nichts.
  - `VERSION` steht auf v10. Damit richtet sich jedes Gerät beim
    nächsten Öffnen neu ein und holt dabei die frische Datei.
- **`firebase.json`:** Die drei Inhaltsdateien kommen mit `no-cache`
  statt einer Woche. Offline geht nichts verloren, weil sie im Vorrat
  des Service Workers liegen.

Zwei Stellen, weil jede allein reicht. Das zeigt der Durchlauf
ausdrücklich, damit ein späteres Zurückdrehen der einen nicht wieder
alles kaputtmacht.

### Gefunden werden

Die Schulungen lagen unter „Ich → Schulung“, drei Tipps weit weg von
der Stelle, an der man über EMS nachliest. Das Hilfe-Fenster führt jetzt
hin:
- **Startseite der Hilfe:** „Als Schulung lernen — 5 Module zum Lesen“
  öffnet die Schulungen, schon gefiltert auf „EMS-Wissen“.
- **EMS-Eintrag:** Unter „Als Schulung“ steht das Modul, das diesen
  Text enthält. Ein Tipp führt direkt zur Code-Eingabe dieses Moduls.
  Ein laufender Durchlauf wird dabei nicht weggeworfen.
- Beides nur, wenn der Bereich „Schulung“ für die Firma an ist.

### Die KI

Wird nicht gebaut, auf Ansage. Stattdessen wird das Bestehende
verbessert.

### Durchläufe

- **Neu: `tests/test-zwischenspeicher.js`** mit 9 Zusicherungen.
  - Ein eigener kleiner Server liefert die App mit den **echten**
    Kopfzeilen aus `firebase.json` aus. Der Durchlauf spielt eine
    Auslieferung durch (neue Datei, neue `VERSION`) und liest danach,
    was in der App ankommt.
  - Durchgespielt werden drei Lagen:
    - wie im Repo: die neue Fassung kommt an;
    - nur der Service Worker ist repariert: sie kommt auch an;
    - **Gegenprobe mit dem alten Stand:** die alte Fassung bleibt
      liegen. Damit ist gezeigt, dass der Durchlauf den Fehler wirklich
      nachstellt.
  - Ersetzt wird dabei nur das Firebase-SDK im Service Worker (Push).
    Es lädt in dieser Umgebung nicht, und ohne es richtet sich der
    Service Worker gar nicht ein.
- **`test-ems-schulung`** hat jetzt 81 Zusicherungen (vorher 69). Neu
  geprüft werden, bei 390 und 1440 px:
  - der Weg von der Hilfe zu den Schulungen;
  - vom Eintrag zum passenden Modul;
  - Gegenprobe: ein Handbuch-Eintrag hat keinen Schulungs-Knopf.
- **Gesamtdurchlauf: 139 von 139 grün.**

## Runde 106 — Entscheidungen aus dem Betrieb, erster Teil

> „ich entscheide: 1. bei uns sind es MINDESTENS 2 tage 2. Videos kommen
> noch speicher ort können wir vorbereiten so gut es geht 3. Erstmal
> keine aber füge hinzu das die leitung die zeiten ändern kann falls
> jemand sich nicht ausgestempelt hat … und die aufgaben kannst du in
> deiner reihenfolge machen ausser das längere passwort" (24.9.2026)

### Die Pause: mindestens 2 Tage, als Hausregel

- Geändert sind `ems-wissen.js` („Wie oft“, „Kombinieren“) und die
  Schulung „EMS verstehen und erklären“: neuer Hinweis und eine neue
  Frage „Wie viel Pause liegt bei uns mindestens …?“.
- **Die Hausregel steht als Hausregel da, nicht als Aussage der
  Leitlinie.** Was die Leitlinie für den Einstieg empfiehlt (in den
  ersten 8–10 Wochen höchstens einmal pro Woche), bleibt als ihre
  Empfehlung gekennzeichnet stehen. Die App soll nicht behaupten, eine
  Quelle sage etwas, das sie nicht sagt.
- `test-ems-wissen` prüft die 2 Tage. Gegenprobe: nirgends steht mehr
  eine andere Mindestpause als Regel.

### P-17: Aufgaben schneller

- Der Klick kostet 25–35 ms. Das Warten danach war Stil und Layout
  für alle 61 Zeilen, gemessen per Trace: `UpdateLayoutTree` über 686
  Elemente.
- Zeilen ab der 13. tragen jetzt `content-visibility:auto` mit einer
  Platzhalterhöhe.
- Median bis zum ersten Bild, CPU ÷4:
  - 390 px: 176 → 104 ms;
  - 1440 px: 156 → 121 ms.
- **Warum ab der 13.:** Dieselbe Grenze gilt schon für die
  Einblendung. Zwölf Zeilen füllen auch ein grosses Tablet.
- **Nicht angefasst:** Nach dem ersten Bild laufen noch ein paar Bilder
  mit je rund 130 Stil-Elementen (etwa 10 ms bei CPU ÷4). Das ist der
  Farbübergang des Bereichs und liegt unter der Grenze von 8,3 ms je
  Bild bei voller Geschwindigkeit.

### P-12: Team springt nicht mehr

- Der Sprung war gewollt. Zwei Zeitgeber rollten zum heutigen Tag,
  bei der Leitung am Handy 218 px, und „Wartet auf deine Entscheidung“
  verschwand dabei oben.
- **Jetzt rollt nichts:**
  - Am Handy stehen die vergangenen Tage der laufenden Woche in einer
    Zeile („Mo 21.09. – Mi 23.09. · 0 Schichten · Anzeigen ›“).
  - Am Rechner steht die Woche in sieben Spalten nebeneinander.
  - `heuteInsBild()` greift nur noch, wenn vom heutigen Tag gar nichts
    zu sehen ist.
- **Dabei gefunden:** ‹ › neben „Heute“ waren 38 × 44 (kompakt
  30 × 44), das ✕ an einer Schicht gut 28 × 20. Beide sind jetzt
  44 × 44.
- **`test-team-bereich7` ist offen geändert.** Er verlangte „heute
  VOLLSTÄNDIG im Bild“, und das ging nur mit dem Rollen, das P-12 war.
  Jetzt verlangt er: nicht gerollt, Überschrift und erste Schicht zu
  sehen. Das Zitat der Freigabe steht im Test. Der Demo-Mitarbeiter hat
  heute einen 348 px hohen Tag, dessen Ende 48 px unter dem Rand liegt.

### Durchläufe

- **Neu: `test-team-woche`** mit 38 Zusicherungen:
  - kein Rollen, heute im Bild, Wartet im Bild;
  - die Zeile auf- und zuklappen;
  - Gegenprobe: in der nächsten Woche gibt es die Zeile nicht;
  - sieben Spalten bei 1280, 1440 und 1920 px;
  - Trefferflächen bei 7 Breiten × 2 Dichten.
- **Neu: `test-aufgaben-tempo`** mit 14 Zusicherungen. Er prüft die
  Ursache, und dass späte Zeilen voll benutzbar und fast gleich hoch
  bleiben. Die Zeit druckt er nur aus.
- **Gesamtdurchlauf: 141, davon zuerst 2 rot, beide behoben:**
  - `test-gestaltung`: ein „✕“ stand im Text der Neuigkeit. Jetzt
    steht dort „das Kreuz zum Entfernen“.
  - `test-block-c`: Eine gerade abgehakte Aufgabe rutscht beim
    Umsortieren unter die 12. Zeile. Dort bekam sie
    `content-visibility:auto`, und ihre Feder (checkPop) startete nicht
    mehr. Eine Zeile mit `.just-done` ist jetzt ausgenommen.

  Danach wurden `test-gestaltung`, `test-block-c`,
  `test-aufgaben-tempo`, `test-csp`, `test-neu-design` und
  `test-team-woche` einzeln wiederholt, alle grün.

## Runde 106, zweiter Teil — Vergessenen Feierabend nachtragen (P-09)

> „füge hinzu das die leitung die zeiten ändern kann falls jemand sich
> nicht ausgestempelt hat oder so" (24.9.2026)

### Was gebaut wurde

- **Zwei neue Funktionen, und keine überschreibt etwas:**
  - `zeitNachtragen` legt einen **neuen** Stempel an: `quelle:
    'korrektur'`, dazu Grund und wer/wann. Die Uhrzeit gilt als
    Berliner Ortszeit, auch über die Sommerzeit (`berlinZeitpunkt`,
    zweimal gerechnet).
  - `zeitStornieren` hängt an einen vorhandenen Stempel nur `storno`
    (wer, wann, Grund). Zeitpunkt, Art und Gerät bleiben, gerechnet
    wird ohne ihn.
- **Wer darf:**
  - der Chef im ganzen Betrieb;
  - die Studioleitung in ihren Studios, **nicht an den eigenen
    Zeiten**. Das macht die Geschäftsführung, sonst wäre es eine
    Änderung ohne zweite Person.
- **Grenzen:** Ein Grund ist Pflicht (mindestens 5 Zeichen).
  Nachgetragen wird nicht in die Zukunft und höchstens 62 Tage zurück,
  also der laufende Monat plus die Abrechnung des Vormonats.
- **Verwaltung → Zeiten** (neuer Reiter für die ganze Leitung):
  - Studio und Monat wählen; die Tage ohne Feierabend stehen oben.
  - Ein Tipp öffnet den Tag mit Formular (Art, Uhrzeit, Grund) und an
    jedem Stempel „Ungültig …“.
  - Am Rechner steht der Tag rechts neben der Liste, gleich der erste
    ohne Tipp.
- **„Meine Zeiten“:** Jeder korrigierte Tag trägt „korrigiert“. Unter
  dem Stempel steht „nachgetragen von … · Grund“ bzw. „ungültig · …“.
  Die Person sieht also jede Änderung an ihren Zeiten.
- **Export:** Die Stempelzeiten-Tabelle hat zwei neue Spalten,
  „nachgetragen“ und „ungültig“, jeweils mit Name und Grund.
- **Demo:** Im Studio Hürth hat jemand gestern nicht ausgestempelt.
  Das ist ohne `zufall()` gebaut, damit sich die übrigen Demo-Daten
  nicht verschieben.

### Warum so entschieden

- **Nicht überschreiben.** Eine Arbeitszeitaufzeichnung, die der
  Arbeitgeber nachträglich unbemerkt ändern kann, ist als Nachweis
  wenig wert, auch wenn nie jemand etwas geändert hat. So bleibt jede
  Korrektur sichtbar, mit Name und Grund, auch für die Person selbst.
  Die Regeln bleiben auf `write: false` für alle.
- **Kein Löschen.** Ein Stempel, der gar nicht hätte da sein sollen,
  wird ungültig, nicht weg.
- **Eine Löschfrist gibt es weiter nicht** („Erstmal keine“, aus dem
  Betrieb).

### Durchläufe

- **Neu: `tests/rules/zeitkorrektur.test.js`** mit 21 Zusicherungen.
  Er führt die Funktionen gegen den Emulator aus und läuft in
  `npm test` mit, also auch in CI.
  - Geprüft: Nachtragen mit allen Feldern in der Firma; 18:00 heisst
    18:00 in Berlin; stornieren lässt den Stempel unverändert.
  - Abgewiesen werden: Mitarbeiter, Leitung eines anderen Studios,
    Leitung an sich selbst, ohne Grund, Zukunft, zu weit zurück,
    unbekannte Art, fremde Firma, zweimal stornieren.
  - Gegenprobe: Die Geschäftsführung korrigiert die Studioleitung.
- **Neu: `tests/test-zeitkorrektur.js`** mit 38 Zusicherungen. Er geht
  den Weg durch die Oberfläche in der Demo:
  - Mitarbeiter ohne Reiter; der fehlende Feierabend steht oben.
  - Gegenprobe ohne Uhrzeit oder Grund: nichts wird eingetragen.
  - Nachtragen, danach ungültig markieren: die Zeile bleibt,
    durchgestrichen, mit Grund.
  - Die Studioleitung sieht nur Studio 6 und 7 und bekommt an den
    eigenen Zeiten kein Formular; Gegenprobe beim Team.
  - Am Rechner steht der Tag neben der Liste.
  - Trefferflächen bei 7 Breiten × 2 Dichten.
- **Gesamtdurchlauf: 142, davon zuerst 2 rot, beide wegen der neuen
  Kachel „Zeiten“.** `test-navigation` erwartete 8 Kacheln für den
  Chef, `test-verwaltung-bereich9` 5 für die Studioleitung. Beide
  erwarten jetzt die neue Kachel ausdrücklich, mit dem Zitat aus dem
  Betrieb im Test, und wurden einzeln wiederholt: grün.
- **Regeln und Funktionen im Emulator (`npm test` in `tests/rules`):**
  alles grün, auch die neuen Tests `zeitkorrektur` (21) und `videos`
  (15).

## Runde 106, dritter Teil — Der Speicherort für die Schulungsvideos

> „Videos kommen noch speicher ort können wir vorbereiten so gut es
> geht"

- **`storage-videos.rules`**: Regeln für einen **zweiten** Eimer. Dem
  Sicherungs-Eimer bleibt `storage.rules`, dort ist alles zu.
  - Lesen darf, wer in der Firma freigegeben ist.
  - Auflisten darf niemand.
  - Hochladen darf nur die Leitung, nur `video/*`, unter 500 MB.
  - Überschreiben darf niemand, löschen die Leitung.
- **Noch nicht ausgerollt.** Ein Eintrag in `firebase.json` für einen
  Eimer, den es noch nicht gibt, bräche die ganze Auslieferung ab. Die
  Datei steht deshalb in der `ignore`-Liste des Hostings, damit sie
  nicht ausgeliefert wird, und wartet.
- **`tests/rules/videos.test.js`** mit 15 Zusicherungen, im
  Speicher-Emulator. Er läuft ab jetzt in `npm test` mit; dafür steht
  `storage` in `emulators:exec --only` und in `firebase.json` (Port
  9199).
  - **Dabei gefunden:** Der Emulator liess ein Überschreiben als
    „create“ durch. Jetzt verlangt die Regel ausdrücklich
    `resource == null`. Ob die Produktion das genauso tut, ist hier
    nicht prüfbar; die Zeile schadet dort nicht.
- **`docs/VIDEOS.md`**: was fertig ist, was fehlt, die fünf Minuten in
  der Konsole, Kosten als **Schätzung**, und warum YouTube nicht passt.
- **Offen gesagt:** Eine Abspiel-Adresse mit Token umgeht die Regeln.
  Wer sie weitergibt, gibt das Video weiter. Das steht in der
  Regeldatei und in `docs/VIDEOS.md`.
