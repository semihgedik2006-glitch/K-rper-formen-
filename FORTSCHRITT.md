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
| — | *Abschluss: Spezifikation, Design-System, Roadmap, Pitch* | ⚪ offen | – |

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

## Was aus früheren Runden noch offen ist

Details in `OFFEN.md`.

Vollständig in `OFFEN.md`. Kurzfassung:

| Was | Wer |
|---|---|
| `MATERIAL-SHEETS.gs` in Apps Script einfügen | **du** |
| Export-Rolle für den Dienstaccount setzen (sonst schlägt die Sicherung fehl) | **du** |
| Wischen zum Abhaken am echten Gerät prüfen | **du** |
| E-Mail-Absender auf eigene Domain vor Kunden-Mails | du, später |
| Google-Tabelle: Formatieren vom Schreiben trennen | ich, bei Bedarf |
| Suche über alle Studios | bewusst nicht gebaut |
| Mehrere Firmen in einer App | ab dem 5./6. Kunden |
| KI-Funktionen | Datenschutz zuerst |
