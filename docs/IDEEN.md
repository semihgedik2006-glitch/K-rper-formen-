# Was wir noch einbauen könnten

Stand: 7. August 2026. Sortiert nach dem, was im Alltag am meisten bringt —
nicht nach dem, was am einfachsten zu bauen ist. Zu jedem Punkt steht dabei,
was er kostet und was dagegen spricht, damit die Entscheidung nicht blind
fällt.

Nichts davon ist gebaut. Das ist eine Auswahlliste.

---

## Die drei, die ich zuerst bauen würde

### 1. Geräte- und Schadensbuch

**Das Problem:** Geht ein EMS-Gerät kaputt, steht das heute irgendwo im Chat
und ist nach zwei Tagen nach oben gescrollt. Niemand weiß, welches Gerät wie
oft ausfällt, und beim Techniker-Anruf fehlt die Vorgeschichte.

**Was es wird:** Pro Studio eine Liste der Geräte. „Defekt melden" macht ein
Foto, eine kurze Beschreibung und legt automatisch eine Aufgabe für die
Leitung an. Der Verlauf bleibt am Gerät hängen — beim dritten Ausfall
desselben Geräts in zwei Monaten sieht man das sofort.

**Aufwand:** mittel. Eine neue Sammlung, eine Ansicht, ein Formular. Die
Foto- und Aufgaben-Mechanik gibt es schon.

**Was dagegen spricht:** nichts Grundsätzliches. Es muss nur jemand einmalig
die Geräte eintragen.

---

### 2. Schichttausch mit Bestätigung

**Das Problem:** Schichttausch läuft heute über WhatsApp und mündliche
Zusagen. Im Dienstplan steht danach die falsche Person, und wer wirklich da
war, weiß hinterher niemand mehr.

**Was es wird:** „Ich kann nicht" an einer Schicht schreibt sie ins Studio
aus. Kollegen mit passender Berechtigung sehen das Angebot, einer nimmt es
an, die Leitung bestätigt mit einem Tipp — erst dann ändert sich der
Dienstplan. Alle drei Schritte stehen später in der Historie.

**Aufwand:** mittel. Die Schichten und die Push-Nachrichten gibt es schon;
neu sind der Status-Ablauf und die Regeln, wer was darf.

**Was dagegen spricht:** Es muss klar sein, ob die Leitung bestätigen *muss*
oder ob der Tausch auch ohne sie gilt. Diese Frage gehört vorher geklärt,
nicht nachträglich.

---

### 3. Schulungen und Zertifikate mit Ablaufdatum

**Das Problem:** Erste-Hilfe-Kurs, Trainerlizenz, EMS-Einweisung nach
Strahlenschutzverordnung — jedes mit eigenem Ablaufdatum. Das fällt heute
auf, wenn es zu spät ist.

**Was es wird:** Je Person eine Liste mit Nachweis und Gültigkeit. 60 und 14
Tage vorher eine Erinnerung an die Person und an die Leitung. Im Chef-Bereich
eine Ansicht „läuft demnächst ab".

**Aufwand:** klein bis mittel. Der nächtliche Lauf für Aufgaben-Erinnerungen
kann das mit erledigen.

**Was dagegen spricht:** Gesundheits- und Qualifikationsdaten sind heikler
als Putzpläne. Wer sie sehen darf, muss eng gefasst werden — Vorschlag: nur
die Person selbst und der Chef, nicht die Studio-Leitung.

---

## Lohnt sich, ist aber kein Notfall

### Umfragen im Chat

„Wer kann Samstag?" mit Antwortknöpfen statt 30 Einzelnachrichten. Das
Ergebnis steht direkt in der Nachricht. **Aufwand:** klein. Die
Reaktions-Mechanik im Chat ist schon fast das, was man braucht.

### Materialbestellung als fertige Mail

Die Einkaufsliste gibt es. Was fehlt, ist der Knopf „an Lieferant senden" mit
einer sauberen Bestellmail und einem Vermerk, wann zuletzt bestellt wurde.
**Aufwand:** klein — der Mailversand steht bereits.
**Vorher zu klären:** die Absenderadresse (siehe `OFFEN.md`, dort ist der
Wechsel auf die eigene Domain ohnehin fällig).

### Dienstplan als Kalender abonnieren

Eine `.ics`-Adresse je Person, die sich in Apple- oder Google-Kalender
eintragen lässt. Danach stehen die Schichten auf dem Handy, ohne dass jemand
die App öffnen muss. **Aufwand:** klein bis mittel, braucht eine kleine
Cloud Function.
**Achtung:** So eine Adresse ist ein Passwort. Sie muss lang und zufällig
sein und sich zurückziehen lassen.

### Wiedervorlage für einen selbst

„Erinnere mich Montag daran." Kein neuer Aufgaben-Typ, nur eine Aufgabe, die
bis dahin niemand sieht. **Aufwand:** klein.

### Notfall-Nachricht mit Empfangsbestätigung

Für den seltenen Fall, dass etwas wirklich alle sofort erreichen muss:
Ankündigung, die oben stehen bleibt, bis jede Person sie bestätigt hat. Der
Chef sieht, wer noch fehlt. **Aufwand:** klein — Ankündigungen zeigen schon
an, wer gelesen hat.
**Wichtig:** genau ein Kanal dafür, sonst nutzt sich das ab und wird zum
normalen Rauschen.

---

## Größere Brocken — nur mit Vorlauf

### Zeiterfassung (Kommen/Gehen)

Der größte Nutzen von allem hier, und mit Abstand der heikelste Punkt.

Arbeitszeiterfassung ist in Deutschland Pflicht, und eine App, die sie
übernimmt, wird zum Nachweisdokument. Das heißt: fälschungssicher,
nachvollziehbar korrigierbar, aufbewahrungspflichtig — und
mitbestimmungspflichtig, sobald es einen Betriebsrat gibt.

**Meine Einschätzung:** technisch machbar, aber nichts, was man nebenbei
einbaut. Erst mit Steuerberater und Arbeitsrecht klären, was verlangt wird,
dann bauen. Vorher wäre es ein Werkzeug, auf das sich niemand berufen kann.

### Kennzahlen je Studio

Probetrainings, Abschlüsse, Kündigungen, Mitgliederzahl als Kacheln im
Chef-Bereich, mit Verlauf über die Monate.

**Der Knackpunkt ist nicht die Anzeige, sondern woher die Zahlen kommen.**
Von Hand eintragen hält niemand durch. Sinnvoll wird das erst, wenn die Zahlen
automatisch aus dem System kommen, in dem die Verträge liegen. Solange das
nicht geklärt ist, würde ich es lassen.

### Offline weiterarbeiten

Im Keller mancher Studios ist kein Empfang. Heute geht dann nichts.
Machbar wäre: Aufgaben abhaken und Nachrichten schreiben landen in einer
Warteschlange und gehen raus, sobald wieder Netz da ist.

**Aufwand:** groß, und es zieht sich durch die ganze App. Firestore bringt
einen Teil davon mit, aber das Verhalten bei Konflikten — zwei Leute haken
dieselbe Aufgabe offline ab — muss man selbst entscheiden. Lohnt sich erst,
wenn das im Alltag wirklich stört.

---

## Was ich bewusst nicht vorschlage

- **Noch mehr Statistik im Chef-Bereich.** Die Auswertung zeigt heute das
  Wesentliche. Mehr Zahlen heißt nicht mehr Überblick — eher weniger.
- **Bewertungen oder Ranglisten zwischen Mitarbeitern.** Klingt nach
  Motivation, wirkt im Alltag als Druck. Zwischen *Studios* zu vergleichen
  ist etwas anderes und wäre vertretbar.
- **KI-Funktionen.** Nicht wegen der Technik — siehe `KI-PLAN.md` und
  `OFFEN.md`. Es fehlt die datenschutzrechtliche Grundlage, nicht der Code.

---

## Wenn du dich für etwas entscheidest

Sag mir, welche Punkte — und ob es mehrere auf einmal sein sollen. Bei
Nummer 2 und 3 brauche ich vorher je eine Antwort von dir; sie steht oben
jeweils unter „Was dagegen spricht".
