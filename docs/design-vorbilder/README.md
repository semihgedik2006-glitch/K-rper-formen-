# Design-Vorbilder aus anderen Apps

Stand: 22. Oktober 2026.

Aus dem Betrieb (Semih): „gib in github für claude code einen ordner an
mit design und layout vorschlägen aus anderen apps welche wir nutzen und
kopieren können“.

Dieser Ordner ist genau das: eine Sammlung von **Bedienmustern** aus Apps
und Gestaltungsrichtlinien, die es schon gibt und die sich bewährt haben —
sortiert nach Themen, jeweils mit dem Bezug zu StudioChat und mit Quelle.

## Wie Claude Code diesen Ordner benutzt

1. **Vor jeder Gestaltungsänderung** die passende Datei lesen (Tabelle
   unten). Bei Knöpfen zusätzlich, wie immer, den Skill `knoepfe`.
2. **Muster übernehmen, nicht Marken.** Übernommen werden Abläufe,
   Abstände, Reihenfolgen, Verhalten. **Nie** fremde Logos, Bilder,
   Bildschirmfotos, Symbole, Schriften, Markennamen oder Texte. Ein
   Muster wie „Rückgängig-Leiste unten“ gehört niemandem; das Aussehen
   von Gmail schon.
3. **Immer gegen die Wünsche-Tabelle in `CLAUDE.md` prüfen** („Wie es
   aussehen soll — aus dem Betrieb“). Jedes Vorbild hier hat dafür den
   Abschnitt **Passt zu / reibt sich mit**. Wenn ein Vorbild mit einem
   Wunsch aus dem Betrieb kollidiert, gewinnt der Wunsch.
4. **Erst nachsehen, ob es das schon gibt.** Viele Muster stehen schon in
   der App (Rückgängig-Leiste, Liste + Detail am Rechner, Wochenstreifen,
   Schnellzugriffe). Dann steht das in der Datei dabei — nicht doppelt
   bauen, sondern das Bestehende verbessern.
5. **Nichts behaupten.** Die Beschreibungen der fremden Apps stammen aus
   den verlinkten Seiten. Was dort nicht stand, steht hier als
   *nicht nachgeprüft*. Maße für StudioChat sind **Vorschläge** — vor dem
   Bauen messen (320 / 390 / 430 / 820 und 1280 / 1440 / 1920 px).

Diese Sammlung ergänzt `docs/DESIGN-RECHERCHE.md` (Ideen aus vergleichbaren
Apps, schon teilweise gebaut) und `docs/DESIGN-IDEEN.md` (Ideen aus den
eigenen Bildschirmfotos). Was dort schon steht, wird hier nur verlinkt.

## Inhalt

| Datei | worum es geht | Vorbilder |
|---|---|---|
| [`ki-assistent.md`](ki-assistent.md) | Formi: Kugel, kompaktes Fenster, Vorschläge, Zeigen-was-ich-tue, Bestätigen/Rückgängig, Seitenkontext | 9 |
| [`navigation-und-startseite.md`](navigation-und-startseite.md) | untere Leiste, Seitenleiste am Rechner, „Heute“-Startseite, Anpassen | 8 (+1 Verweis) |
| [`listen-aufgaben-abhaken.md`](listen-aufgaben-abhaken.md) | Abhaken, Wischen, Rückgängig, Erledigt-Bereich, leere Zustände | 7 |
| [`dienstplan-und-schichten.md`](dienstplan-und-schichten.md) | Wochen-/Tagesansicht, offene Schichten, Tauschen, Besetzung | 6 |
| [`farbe-tiefe-bewegung.md`](farbe-tiefe-bewegung.md) | Dunkelmodus, Tiefe/Schatten, Farbleitern, Bewegung nur per `transform` | 7 |
| [`formulare-und-eingabe.md`](formulare-und-eingabe.md) | kurze Formulare, Prüfen vor dem Speichern, Blätter am Handy, zwei Spalten am PC | 6 |
| [`studien-psychologie.md`](studien-psychologie.md) | Studienlage (PubMed, Scholar, ACM) zu Navigation, Menütiefe, Zusammenlegen, Erledigt-Bereich, Abzeichen und Stress, Zielgrössen – mit ehrlicher Kennzeichnung, was selbst geprüft ist (Runde 187) | ca. 25 Quellen |

Zusammen **43 Vorbilder** (einige Quellen wie Android „Canonical
layouts“ tauchen in zwei Dateien mit verschiedenem Bezug auf).

## Wenn du X baust → lies Y

| Wenn du … baust oder änderst | lies zuerst |
|---|---|
| etwas an Formi (Kugel, Fenster, Antworten, Aktionen, Vorschläge) | `ki-assistent.md` |
| etwas, das Formi **für jemanden erledigt** (abhaken, anlegen, senden) | `ki-assistent.md` + `listen-aufgaben-abhaken.md` (Rückgängig) |
| die untere Leiste, die Seitenleiste, „Alles“, „Ausserdem“ | `navigation-und-startseite.md` |
| Abzeichen, Zahlen, Punkte, Benachrichtigungen, das Zusammenlegen von Bereichen | `studien-psychologie.md` |
| die Startseite oder Schnellzugriffe | `navigation-und-startseite.md` |
| eine Ansicht am Rechner (ab 1100 px) | `navigation-und-startseite.md` (Liste + Detail) + `formulare-und-eingabe.md` (zwei Spalten) |
| eine Liste mit Haken (Aufgaben, Putzplan, Material) | `listen-aufgaben-abhaken.md` |
| einen leeren Zustand oder eine Fehlermeldung in einer Liste | `listen-aufgaben-abhaken.md` |
| den Schichtplan, „Meine Woche“, „Heute im Studio“, Tausch | `dienstplan-und-schichten.md` |
| Farben, Verläufe, Schatten, den Stil „Formi“, Hell/Dunkel | `farbe-tiefe-bewegung.md` |
| eine Animation oder einen Übergang | `farbe-tiefe-bewegung.md` (und `CLAUDE.md`, „Flüssig heisst konkret“) |
| ein Formular, einen Dialog, ein Aktionsblatt, „Neu anlegen“ | `formulare-und-eingabe.md` |
| eine Vorschau vor dem Speichern (auch Formis „Anlegen lassen“) | `formulare-und-eingabe.md` + `ki-assistent.md` |

## Die Wünsche aus dem Betrieb — Kurzzeichen

In den Dateien steht bei **Passt zu / reibt sich mit** jeweils das
Kurzzeichen und ein paar Worte. Die Langfassung steht in `CLAUDE.md`.

| | Wunsch (aus `CLAUDE.md`) |
|---|---|
| **W1** | Startseite passt auf einen Bildschirm; was nicht passt, bleibt als Knopf unter „Ausserdem“ |
| **W2** | wenige, grosse Dinge; in Listen das Zeichen ohne getönte Kachel |
| **W3** | jedes Ziel in zwei Tipps über „Alles“ |
| **W4** | Farbe geht von einer Kante aus und läuft aus; die Farbe folgt dem Bereich |
| **W5** | was anklickbar ist, fühlt sich wie ein richtiger Knopf an (Haarlinie, Schatten, gibt nach) |
| **W6** | flüssig: Bewegung nur per `transform`/`opacity`, keine Endlos-Animation, Grenze 8,3 ms je Bild |
| **W7** | Rot, Bernstein, Grün nur für Status |
| **W8** | Kontrast ≥ 4,5 : 1, an echten Bildpunkten gemessen |
| **W9** | Trefferfläche ≥ 44 × 44 px per Hit-Test, normal und kompakt |
| **W10** | der PC ist das Hauptgerät: Breite nutzen (zwei Spalten, Liste + Detail, Tastenkürzel, Hover) |
| **W11** | Firmencode sichtbar, aber leise |

## Wie ein neues Vorbild eingetragen wird

```markdown
### <App oder Richtlinie> — <ein Muster in drei Worten>

**Was die App macht:** 2–4 Sätze, eigene Worte, nur was in der Quelle steht.

**Was wir übernehmen:** konkret — Maße, Ablauf, Verhalten. Vorschlag ≠ Messung.

**Wo in StudioChat:** Ansicht / Funktion (mit Schlüssel wie bei `wo`, falls es einen gibt).

**Passt zu / reibt sich mit:** W-Kurzzeichen + Begründung.

**Quelle:** [Titel](Link) — selbst abgerufen, sonst *nicht nachgeprüft*.
```

Regeln für Quellen: nur Links, die tatsächlich abgerufen oder in
Suchergebnissen gesehen wurden. Herstellerseiten (Hilfe, Richtlinien,
Blog) vor Fremdartikeln. Zitate höchstens ein kurzer Halbsatz.

## Was hier bewusst nicht drinsteht

- **Durchsichtiges Glas mit Weichzeichner** (iOS-26-Stil) — siehe
  `DESIGN-RECHERCHE.md`, „Wovon ich abrate“, und Runde 178: Glas ohne
  Weichzeichner, fast deckend.
- **Ranglisten, Punkte, „Gesehen von …“** — Leistungs- und
  Verhaltenskontrolle, siehe `DESIGN-RECHERCHE.md` und `DESIGN-IDEEN.md`
  Punkt 11.
- **Bento-Kacheln auf der Startseite** — Runde 86 gestrichen, aus Grund.
