# Listen, Aufgaben, Abhaken

Für Aufgaben, Putzplan, Material, Geräte — überall, wo eine Zeile einen
Haken hat. Was es schon gibt: Rückgängig-Leiste nach dem Löschen
(`offerUndo`, 8 s, Mitte unten über der Leiste), Papierkorb 30 Tage,
Rückgängig mit Countdown im Formi-Gehirn (10 s), Feder beim Abhaken
(`checkPop`, Runde 103/123), eigene Reihenfolge (Runde 148), Fehler in
der Liste statt im Toast (Runde 109), leere Zustände mit nächstem Schritt
(Idee 14), Wischen zum Antworten im Chat (Runde 123).

---

### Gmail — „Rückgängig“ nach dem Senden

**Was die App macht:** Nach dem Senden erscheint unten links ein dunkles
Feld mit „Rückgängig“. Die Mail geht erst nach Ablauf der Frist wirklich
raus. Standard sind 5 Sekunden; in den Einstellungen lassen sich 10, 20
oder 30 Sekunden wählen.

**Was wir übernehmen:**
- **Frist je Person wählbar** (8 / 15 / 30 s) unter Einstellungen →
  Bedienung. Standard bleibt 8 s.
- **Am Rechner die Leiste unten links** statt in der Mitte: unten rechts
  sitzt die Formi-Kugel, in der Mitte oft der Hauptknopf. Am Handy
  prüfen, ob die mittige Leiste (max. `100vw − 32px`) die Kugel
  (z 150, über der Leiste) überlappt — **nicht gemessen**, vor dem Bauen
  bei 320 / 390 px per Hit-Test prüfen.
- Für Formi-Aktionen, die andere sehen, gilt dasselbe Prinzip „erst nach
  Ablauf wirklich“ — das ist die 3-s-„Stopp“-Absprache aus Runde 177.

**Wo in StudioChat:** `#undoBar`, `offerUndo()`, Formi-Aktionen.

**Passt zu / reibt sich mit:** W9 (Rückgängig-Knopf ≥ 44 px hoch), W10.

**Quelle:** [NC State OIT — Unsend an email in Gmail](https://oit.ncsu.edu/2022/03/15/unsend-an-email-in-gmail/)
(Hochschul-Hilfeseite, nicht Google selbst)

---

### Material / Flutter — Meldung mit Knopf verschwindet nicht von allein

**Was die Richtlinie sagt:** Kurze Meldungen („Snackbar“) sitzen unten
und werden **über** einer unteren Leiste oder einem schwebenden Knopf
verankert, nicht darunter. Sie tragen höchstens eine Aktion. Flutter hat
geändert, dass eine Meldung **mit** Knopf nicht mehr von selbst
verschwindet, sondern bis zum Wegtippen bleibt — begründet mit
Barrierefreiheit (wer langsamer liest oder tippt, verpasst sonst den
Knopf) und mit der Material-3-Vorgabe.

**Was wir übernehmen:** Die Rückgängig-Leiste **pausiert, solange sie
den Fokus hat oder die Maus darüber steht**, und läuft danach weiter.
Ganz stehen lassen nur, wenn eine Bildschirmlese-Hilfe aktiv ist — das
lässt sich im Browser nicht verlässlich erkennen, deshalb: Pausieren als
Mindestmass, längere Frist als Einstellung (siehe Gmail).

**Wo in StudioChat:** `#undoBar`, Formi-Rückgängig mit Countdown.

**Passt zu / reibt sich mit:** W6: der Countdown-Balken läuft per
`transform: scaleX()`, nicht per `width`.

**Quelle:** [Flutter — SnackBar with action no longer auto-dismisses](https://docs.flutter.dev/release/breaking-changes/snackbar-with-action-behavior-update),
[Material Components Android — Snackbar](https://gitea.com/784622644/material-components-android/src/branch/master/docs/components/Snackbar.md)
(Spiegel des Google-Repositorys)

---

### Todoist — Wischaktionen, die man selbst festlegt

**Was die App macht:** In der Handy-App lassen sich die Wischaktionen
nach links und rechts frei belegen: Erledigen, Planen, Löschen,
Erinnerung (Auswählen nur Android). Eingestellt wird das unter Allgemein
→ „Swipe actions“.

**Was wir übernehmen:**
- **Nach rechts wischen = abhaken** in Aufgaben und Putzplan, mit
  derselben Feder wie beim Tippen. **Nach links = „Später“** (Zeitpunkt
  wählen).
- **Kein Löschen per Wischen.** Löschen bleibt im Menü der Zeile.
- Wischen ist **nur Abkürzung**: der Haken und das Menü bleiben sichtbar.
- Am Rechner gibt es kein Wischen — dafür beim Überfahren die Knöpfe
  einblenden (so wie beim Antworten im Chat).

**Wo in StudioChat:** Aufgabenzeilen, Putzplan-Zeilen.

**Passt zu / reibt sich mit:** W6 (Zeile folgt dem Finger per
`translateX`, Farbe dahinter per `opacity`). W7: die Fläche hinter
„abhaken“ darf Grün sein — sie meldet „wird erledigt“; „Später“ in der
Bereichsfarbe, nicht Bernstein. Reibung: kollidiert mit dem Zurück-Wisch
am Rand des iPhones — Wischfläche erst ab 24 px vom Rand.

**Quelle:** [Todoist Help — How to change your swipe actions](https://www.todoist.com/help/articles/how-to-change-your-swipe-actions-D5DQOQz6)

---

### Google Tasks — Erledigtes unten, eingeklappt

**Was die App macht:** Erledigte Aufgaben wandern in einen Bereich
„Erledigt“, der sich mit einem Pfeil auf- und zuklappen lässt. In der
Sortierung „Meine Reihenfolge“ zieht man Aufgaben an ihren Platz.

**Was wir übernehmen:** Unter jeder Liste **eine** Zeile „Erledigt (5)
›“, standardmässig zu. Aufgeklappt bleibt bis zum Verlassen der Ansicht.
Die eben abgehakte Zeile bleibt **kurz** an ihrem Platz (Feder, dann
Wegfahren per `transform`), damit man sieht, was passiert ist.

**Wo in StudioChat:** Aufgaben, Putzplan (prüfen, wie Erledigtes heute
dargestellt wird, und nur angleichen).

**Passt zu / reibt sich mit:** W1/W2 (weniger Zeilen im Blick). W9: die
ganze Zeile „Erledigt (5)“ ist die Trefferfläche.

**Quelle:** [Google Tasks Help — Artikel 7675629](https://support.google.com/tasks/answer/7675629)

---

### Nielsen Norman Group — drei Regeln für leere Zustände

**Was die Richtlinie sagt:** Ein leerer Bereich soll (1) den
**Systemstatus** zeigen — lädt es, ist ein Fehler passiert, oder gibt es
wirklich nichts? —, (2) **erklären**, wofür der Bereich da ist und wie er
sich füllt, und (3) einen **direkten Weg** zum Anfangen anbieten.

**Was wir übernehmen:** Eine Prüfliste für jede Liste — **drei
verschiedene Texte**, nie derselbe:

| Zustand | Beispiel Putzplan |
|---|---|
| lädt | ruhige Platzhalterzeilen, kein „Nichts da“ |
| Fehler | „Konnte nicht laden — nochmal versuchen“ + was trotzdem geht |
| wirklich leer | „Für heute ist nichts geplant. **Putzaufgabe anlegen**“ |
| alles erledigt | „Alles erledigt“ mit Lob ist erlaubt — das ist ein Erfolg, kein leerer Zustand |

**Wo in StudioChat:** `.leer-block`, alle Listen.

**Passt zu / reibt sich mit:** passt zu Idee 14 und Idee 16; neu ist nur
die Trennung „lädt“ ↔ „leer“ als feste Regel.

**Quelle:** [NN/g — Empty states in complex applications (3 Leitlinien)](https://nngroup.com/articles/empty-state-interface-design)

---

### Apple HIG — Listen: gewählte Zeile bleibt markiert

**Was die Richtlinie sagt:** In Listen, die zu einer Detailansicht
führen, bleibt die gewählte Zeile **dauerhaft** hervorgehoben, damit man
den Weg sieht; in Auswahllisten leuchtet sie nur kurz, dann erscheint
ein Haken. Zeilentexte knapp; bei engen Spalten kann die Kürzung **in
der Mitte** Anfang und Ende lesbar halten. Am Mac: Spalte durch Klick
auf die Überschrift sortieren, bei breiten Tabellen abwechselnde
Zeilenfarben.

**Was wir übernehmen:**
- Liste + Detail am Rechner: die gewählte Zeile trägt **Akzentkante
  links + Fläche `--bg-3`**, solange das Detail offen ist.
- **Kürzung in der Mitte** für Gerätenamen und Dateinamen
  („Laufband…Hürth 2“) — nur dort, wo das Ende unterscheidet.
- Tabellen in der Verwaltung: Sortieren per Klick auf die Überschrift.

**Wo in StudioChat:** Aufgaben und Anliegen am Rechner, Geräte, Material,
Verwaltung.

**Passt zu / reibt sich mit:** W4 (Kante in Bereichsfarbe), W10.

**Quelle:** [Apple HIG — Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables)

---

### Connecteam — „Quick Tasks“: anlegen am PC, abhaken am Handy

**Was die App macht:** Leitungen legen Aufgaben am Rechner oder Handy an
(einzeln, für Gruppen, mit Teilaufgaben, Bildern, Fristen) und sehen, wer
sie gesehen und erledigt hat. Mitarbeitende sehen sie am Handy und können
selbst Aufgaben anlegen, statt anzurufen.

**Was wir übernehmen:** Die **Aufteilung der Geräte** als Leitbild: am
Rechner die Anlege- und Übersichtsansicht (zwei Spalten, Vorlagen), am
Handy das schnelle Abhaken. **Nicht** übernehmen: „gesehen von …“.

**Wo in StudioChat:** Aufgaben (Leitung am Rechner, Team am Handy).

**Passt zu / reibt sich mit:** W10. **Reibung:** „gesehen“ ist
Sichtbarkeit über Personen — dieselbe Abwägung wie bei den
Gelesen-Häkchen (Idee 11 in `DESIGN-IDEEN.md`, abgeraten).

**Quelle:** [Connecteam Help — The value of Quick Tasks](https://help.connecteam.com/en/articles/4291518-the-value-of-quick-tasks)

---

## Top 3 zum sofort Übernehmen

1. **Rückgängig-Leiste pausiert bei Fokus/Hover, am Rechner unten links**
   (Flutter/Material, Gmail) — und vorher messen, ob sie am Handy die
   Formi-Kugel trifft.
2. **„Erledigt (n)“ als eingeklappte Zeile unter jeder Liste** (Google
   Tasks) — weniger Zeilen im Blick, nichts geht verloren.
3. **Drei getrennte Texte für lädt / Fehler / leer** (NN/g) als feste
   Regel in jeder Liste.
