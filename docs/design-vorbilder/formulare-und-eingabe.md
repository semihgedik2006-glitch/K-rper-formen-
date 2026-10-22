# Formulare und Eingabe

Für „Neu anlegen“ (Aufgabe, Putzaufgabe, Probetraining, Defekt,
Abwesenheit, Schicht), Dialoge, Aktionsblätter am Handy und Formis
„Anlegen lassen“ (Vorschau-Karte seit Runde 153). Offen laut Runde 178:
Formulare und Fenster tragen noch nicht den Stil „Formi“.

---

### GOV.UK — eine Frage je Seite

**Was die Richtlinie sagt:** Die britische Verwaltung beginnt Formulare
mit **einer Frage pro Seite**; die Frage ist die Überschrift. Gruppiert
wird nur, wenn Tests es stützen. Oben immer ein Zurück-Link, der Knopf
heisst „Weiter“ und steht links. Freiwillige Felder tragen „(optional)“,
Pflichtfelder **kein** Sternchen. Hinweistext ein kurzer Satz. Begründet
wird das damit, dass unsichere Nutzer besser zurechtkommen, es auf dem
Handy gut funktioniert und Fehler, Verzweigungen und Zwischenspeichern
einfacher werden.

**Was wir übernehmen:**
- Für **Abläufe mit Verzweigung** am Handy (Abwesenheit melden:
  Art → Zeitraum → Vertretung?; Defekt melden: Gerät → Was ist kaputt →
  Foto) **ein Schritt je Blatt**, mit Fortschritt „2 von 3“.
- Kurze Formulare (≤ 4 Felder, keine Verzweigung) bleiben **ein** Blatt.
- **„(optional)“ statt Sternchen** überall.

**Wo in StudioChat:** Abwesenheit, Defekt melden, Probetraining anlegen.

**Passt zu / reibt sich mit:** W2 (eine Sache auf einmal), W1-Geist.
Reibung mit W10: am Rechner **nicht** in Schritte zerlegen — dort alles
auf einer Fläche in zwei Spalten (siehe unten).

**Quelle:** [GOV.UK Design System — Question pages](https://design-system.service.gov.uk/patterns/question-pages),
[GOV.UK Design Notes — One thing per page](https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/)

---

### GOV.UK — „Antworten prüfen“ vor dem Absenden

**Was die Richtlinie sagt:** Vor dem Absenden steht eine Prüfseite: je
Abschnitt eine Überschrift und eine Liste der Antworten, **an jeder
Antwort ein „Ändern“**. Ändern führt zur Frage und danach direkt zurück
zur Prüfseite, nicht durch den ganzen Ablauf. Übersprungenes steht als
„Nicht angegeben“. Der Knopf nennt die Handlung (sinngemäss „Annehmen
und senden“). Kurze Antworten in zwei Dritteln der Breite, damit „Ändern“
nah bleibt.

**Was wir übernehmen:**
- **Formis Vorschau-Karte genau so bauen**: Zeile je Feld, rechts
  „Ändern“ (springt ins Feld, danach zurück zur Karte), unten ein Knopf
  mit Verb und Ziel: „Aufgabe für Hürth anlegen“.
- Dieselbe Karte für alles, **was andere sehen**: Schicht anbieten,
  Nachricht an alle Studios, Übergabe.
- Leere Felder als „Nicht angegeben“ zeigen statt sie wegzulassen.

**Wo in StudioChat:** Formi „Anlegen lassen“, Schicht anbieten, Übergabe.

**Passt zu / reibt sich mit:** W9 („Ändern“ als Text-Knopf mit
44-px-Trefferfläche, auch wenn er klein aussieht). Passt zur 3-s-
„Stopp“-Absprache: die Karte ist das „vorher“, Stopp das „nachher“.

**Quelle:** [GOV.UK Design System — Check answers](https://design-system.service.gov.uk/patterns/check-answers)

---

### Apple HIG — Blätter (Sheets)

**Was die Richtlinie sagt:** Ein Blatt ist für eine **kurze,
abgeschlossene** Aufgabe; Langes gehört in eine Vollansicht. Immer nur
**ein** Blatt auf einmal — öffnet ein Blatt ein weiteres, wird das erste
vorher geschlossen. „Fertig“ steht nie allein, sondern mit „Abbrechen“;
alle drei (Zurück, Abbrechen, Fertig) zusammen nie. Am iPhone gibt es
halbe und volle Höhe mit einem **Griff** oben; Wischen nach unten
schliesst, und bei ungespeicherten Änderungen wird vorher gefragt. Am
Mac schwebt das Blatt zentriert über dem abgedunkelten Fenster. Wer
wiederholt eingibt und das Ergebnis beobachten will, braucht eine
Seitenfläche statt eines Blatts.

**Was wir übernehmen:**
- **Ein Blatt zur Zeit** — prüfen, wo heute ein Aktionsblatt ein zweites
  öffnet (z. B. Auswahl aus einem Anlegen-Blatt), und dort das erste
  schliessen oder innerhalb des Blatts weiterblättern.
- **Halbe Höhe** für Auswahlen (Studio wählen, Zeitpunkt „Später“),
  **volle Höhe** für Formulare mit Tastatur.
- **Wischen zum Schliessen mit Rückfrage**, wenn schon etwas eingetippt ist.
- Am Rechner kein Blatt von unten, sondern **zentrierter Dialog**
  (max. 640 px) — oder bei wiederholter Eingabe eine Seitenfläche.

**Wo in StudioChat:** alle Aktionsblätter und Dialoge.

**Passt zu / reibt sich mit:** W10, W5 (Griff ist ein echter Knopf mit
Trefferfläche, siehe Material unten).

**Quelle:** [Apple HIG — Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)

---

### Material — Blatt von unten: Masse

**Was die Richtlinie sagt:** Es gibt ein modales Blatt (mit Abdunklung,
Seite dahinter gesperrt) und ein Standard-Blatt (Seite bleibt bedienbar).
Standardbreite höchstens **640 dp**. Der Griff hat mindestens **48 × 48 dp**
Fläche, oben müssen 48 dp frei bleiben; mit Bildschirmlesern klappt ein
Tipp auf den Griff auf und zu.

**Was wir übernehmen:**
- Aktionsblätter **max. 640 px breit**, ab 820 px zentriert.
- **Griff-Trefferfläche 48 × 48** (sichtbar nur der Strich), mit
  `role="button"` und Beschriftung „Grösse ändern“; Tipp wechselt halbe
  ↔ volle Höhe.
- Formis kompaktes Fenster ist im Grunde ein **Standard-Blatt** (App
  bleibt bedienbar) — gleiche Regeln.

**Wo in StudioChat:** Aktionsblätter, Formi kompakt am Handy.

**Passt zu / reibt sich mit:** W9 (48 ≥ 44), W10.

**Quelle:** [Material Components Android — Bottom Sheet](https://gitea.com/784622644/material-components-android/src/branch/master/docs/components/BottomSheet.md)
(Spiegel des Google-Repositorys)

---

### Baymard — Prüfen im Feld, aber nicht zu früh

**Was die Studie sagt:** Fehler nicht melden, solange jemand noch
tippt; die meisten Felder beim **Verlassen** prüfen. Felder mit fester
Länge (Code, Telefonnummer) dürfen prüfen, sobald genug Zeichen da sind.
Eine Fehlermeldung verschwindet **sofort** beim Korrigieren, nicht erst
beim Verlassen. Ein Haken an gültigen Feldern spart das Nachkontrollieren.
Die Prüfung beim Absenden bleibt trotzdem nötig.

**Was wir übernehmen:**
- Prüfen **beim Verlassen**; Felder mit fester Länge (z. B. der
  Stempel-Code, falls er eine hat — im Code nachsehen) prüfen sofort bei
  voller Länge.
- Fehlertext **unter** dem Feld, verschwindet beim ersten richtigen
  Zeichen.
- Haken an gültigen Feldern **nur** bei Feldern, die man falsch machen
  kann (Mail, Code, Passwort ≥ 8 Zeichen) — nicht an jedem Namen.

**Wo in StudioChat:** Anmelden, Passwort, Stempeln, Firma anlegen.

**Passt zu / reibt sich mit:** W7: Rot am Fehler und Grün am Haken
**sind** Status — richtig eingesetzt. W8: Fehlertext in `--danger` als
**Text**-Marke, nicht die Flächenfarbe (`DESIGN-SYSTEM.md`, „Fläche und
Text sind zwei verschiedene Dinge“).

**Quelle:** [Baymard Institute — Inline form validation](https://baymard.com/blog/inline-form-validation)

---

### Android — Hilfsspalte: Formular links, Vorschau rechts

**Was die Richtlinie sagt:** Bei grosser Breite nimmt der Hauptinhalt
etwa zwei Drittel, eine Hilfsspalte ein Drittel (70/30). Schmal wandert
die Hilfe unter den Inhalt oder in ein Blatt.

**Was wir übernehmen:** **Am Rechner ab 1100 px**: Anlegen-Formulare als
zwei Spalten — links die Felder (≈ 2/3), rechts eine **Live-Vorschau**,
wie der Eintrag in der Liste aussehen wird (≈ 1/3). Am Handy entfällt
die Spalte; dort übernimmt die Prüf-Karte (GOV.UK oben) die Vorschau.

**Wo in StudioChat:** Aufgabe, Putzaufgabe, Nachricht an alle,
Probetraining — am Rechner.

**Passt zu / reibt sich mit:** W10 (Breite nutzen statt 1.200 px breiter
Felder). GOV.UK empfiehlt für kurze Antworten ebenfalls zwei Drittel.

**Quelle:** [Android Developers — Canonical layouts](https://developer.android.com/develop/adaptive-apps/guides/canonical-layouts)

---

## Top 3 zum sofort Übernehmen

1. **Prüf-Karte mit „Ändern“ an jeder Zeile und einem Knopf mit Verb +
   Ziel** (GOV.UK) — für Formis „Anlegen lassen“ und alles, was andere
   sehen.
2. **Am Rechner: Formular links, Live-Vorschau rechts (70/30)**
   (Android) — macht die breiten Formulare am Hauptgerät sinnvoll.
3. **Ein Blatt zur Zeit, Griff mit 48 × 48 Trefferfläche, max. 640 px
   breit** (Apple HIG, Material) — Aufräumen der Aktionsblätter.
