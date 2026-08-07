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
| 5 | Material | ⚪ offen | – |
| 6 | Geräte | ⚪ offen | – |
| 7 | Team | ⚪ offen | – |
| 8 | Dokumente | ⚪ offen | – |
| 9 | Verwaltung | ⚪ offen | – |
| 10 | Einstellungen | ⚪ offen | – |
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
