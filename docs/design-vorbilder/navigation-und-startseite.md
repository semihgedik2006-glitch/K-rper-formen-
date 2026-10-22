# Navigation und Startseite

Für die untere Leiste (Handy), die Seitenleiste (Rechner), „Alles“,
„Ausserdem“ und die Startseite. Was es schon gibt: Bereiche Start · Ich ·
Nachrichten · Aufgaben · Team · Verwaltung · Alles, je mit eigener Farbe
(`BEREICH_FARBE`); Schnellzugriffe mit „Anpassen“ und Rollen-Vorschlag
(Runde 103); Liste + Detail am Rechner ab 1100 px (Runde 120);
„Heute im Studio“ als Tagesband am Rechner; Tastenkürzel mit „?“.

---

### Apple HIG — Tab-Leiste: Wege, keine Aktionen

**Was die Richtlinie sagt:** Die Leiste unten dient dem Wechseln
zwischen Bereichen, nicht dem Auslösen von Aktionen. Sie bleibt beim
Wechseln sichtbar (ausser unter einem Dialog). Reiter werden nie
ausgeblendet oder deaktiviert — ist ein Bereich leer, erklärt er warum.
Beschriftung möglichst ein Wort. Abzeichen nur für wirklich Wichtiges.
Ein „Mehr“-Reiter versteckt Inhalte und ist zu vermeiden. Auf dem iPad
kann die Leiste zur Seitenleiste werden; wer Reiter selbst wählt,
bekommt anfangs höchstens fünf.

**Was wir übernehmen:**
- **Keine Aktion in der unteren Leiste** (kein „+“ in der Leiste — das
  gehört als Hauptknopf in die Ansicht, A2 in `DESIGN-RECHERCHE.md`).
- **Kein Bereich verschwindet je nach Zustand**; leere Bereiche zeigen
  einen leeren Zustand mit Weg (siehe `listen-aufgaben-abhaken.md`).
- **Zähler an der Leiste nur für Überfälliges / an mich Gerichtetes**,
  nicht für „neu im Kanal“. Alles andere als Punkt oder gar nicht.
- Beschriftung je **ein Wort** — so ist es schon; dabei bleiben.

**Wo in StudioChat:** untere Leiste, Seitenleiste am Rechner.

**Passt zu / reibt sich mit:** W2, W7 (Abzeichen rot = es brennt).
**Reibung:** „Alles“ ist im Grunde ein Mehr-Reiter. Hier gewinnt W3 („jedes
Ziel in zwei Tipps über Alles“) — „Alles“ bleibt. Ausgleich: was
täglich gebraucht wird, steht zusätzlich als Schnellzugriff da.

**Quelle:** [Apple HIG — Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)

---

### Android / Material — Leiste, Schiene, Seitenleiste nach Breite

**Was die Richtlinie sagt:** Unter 600 dp Breite eine Leiste unten, von
600 bis 839 dp eine schmale **Schiene** am linken Rand, ab 840 dp
ebenfalls Schiene oder auf Wunsch eine feste Seitenleiste. Eine Schiene
trägt drei bis sieben Ziele.

**Was wir übernehmen:**
- Für das **Tablet am Empfang (820 px)**: prüfen, ob dort heute die
  Leiste unten steht. Wenn ja: eine **Schiene links** (Zeichen + kurzes
  Wort, ≈ 80 px breit) gibt der Liste die volle Höhe zurück.
- Ab 1100 px die volle Seitenleiste wie heute.

**Wo in StudioChat:** Umschaltpunkt Leiste ↔ Seitenleiste.

**Passt zu / reibt sich mit:** W10, W1 (mehr Höhe für die Startseite am
Tablet). Vor dem Bauen bei 820 × 1180 und quer messen.

**Quelle:** [Android Developers — Build adaptive navigation](https://developer.android.com/develop/adaptive-apps/guides/build-adaptive-navigation);
die Spannweite 3–7 Ziele stammt nur aus der Kurzbeschreibung von
[Material 3 — Navigation rail](https://m3.material.io/components/navigation-rail/guidelines)
(Seite selbst nicht lesbar abgerufen — *nicht nachgeprüft*).

---

### Android — kanonische Layouts: Liste + Detail, Hilfsspalte

**Was die Richtlinie sagt:** Bei grosser Breite stehen Liste und Detail
nebeneinander; schmaler wird das Detail zur eigenen Seite mit Zurück.
Wird das Fenster schmaler, bleibt das Detail stehen. Daneben das Muster
„Hilfsspalte“: Hauptinhalt etwa zwei Drittel, Hilfsinhalt ein Drittel
(70/30); schmal wandert die Hilfe unter den Inhalt oder in ein Blatt.

**Was wir übernehmen:**
- Liste + Detail gibt es (Aufgaben, Anliegen). **Regel ergänzen:** wird
  das Fenster unter 1100 px gezogen, bleibt das **gewählte Detail**
  offen, nicht die Liste.
- **Hilfsspalte 70/30** als Muster für Formi angedockt (siehe
  `ki-assistent.md`) und für Vorschauen in Formularen.

**Wo in StudioChat:** alle Ansichten mit Liste + Detail; Formi am Rechner.

**Passt zu / reibt sich mit:** W10. Keine Reibung.

**Quelle:** [Android Developers — Canonical layouts](https://developer.android.com/develop/adaptive-apps/guides/canonical-layouts)

---

### Slack — vier feste Orte in der Seitenleiste

**Was die App macht:** Seit der Neugestaltung hat die Seitenleiste am
Rechner feste Orte: **Home** (Kanäle und Gespräche), **DMs**,
**Activity** (Erwähnungen, Antworten in eigenen Fäden, Reaktionen) und
**Files**. Gemerkte Dinge und Erinnerungen stehen ebenfalls dort.

**Was wir übernehmen:** Ein **eigener Ort „An mich“** im Bereich
Nachrichten, der Erwähnungen, Antworten auf eigene Nachrichten und
Danke-Meldungen bündelt — statt sie über Kanäle zu verteilen. Auf der
Startseite steht davon nur die Zahl unter „Neu für dich“.

**Wo in StudioChat:** Nachrichten (Kanäle als Spalte am Rechner seit
Runde 172), „Neu für dich“ auf der Startseite.

**Passt zu / reibt sich mit:** W3 (ein Ziel mehr — muss unter „Alles“
stehen). W2: es ersetzt Suchen, es kommt kein neuer Reiter in die
untere Leiste.

**Quelle:** [Slack Help — An overview of Slack's new design](https://slack.com/intl/en-au/help/articles/16764236868755-An-overview-of-Slacks-new-design)

---

### Linear — Seitenleiste selbst ordnen, Punkt statt Zahl

**Was die App macht:** Einträge der Seitenleiste lassen sich ziehen,
ausblenden oder in ein „Mehr“ schieben; ungelesene Meldungen zeigt man
wahlweise als **Zahl oder als Punkt**. In der Handy-App lässt sich die
untere Leiste umordnen und ein bestimmtes Projekt anheften. Bei der
Auffrischung 2026 wurden die Seitenleisten leicht gedimmt, damit der
Inhalt vorne steht.

**Was wir übernehmen:**
- Einstellung **„Ungelesenes als Punkt“** (Standard für Kanäle) — die
  Zahl bleibt für Überfälliges.
- Am Rechner die **Seitenleiste eine Stufe dunkler/ruhiger** als die
  Inhaltsfläche (eine Fläche aus der bestehenden Leiter, kein neuer Ton).
- Schnellzugriffe „Anpassen“ (gibt es) um **Ziehen zum Ordnen** ergänzen,
  mit Knöpfen ↑/↓ als sichtbarer Alternative.

**Wo in StudioChat:** Seitenleiste, Schnellzugriffe, Einstellungen.

**Passt zu / reibt sich mit:** W2 (Punkt ist leiser als Zahl). W8: die
gedimmte Leiste muss mit ihrer Schrift weiter ≥ 4,5 : 1 haben —
nachmessen (heute 13,7 : 1 im Stil Formi, Runde 178, also Luft).

**Quelle:** [Linear Changelog — Personalized sidebar](https://linear.app/changelog/2024-12-18-personalized-sidebar),
[Linear Changelog — Customize your navigation in Linear Mobile](https://linear.app/changelog/2026-01-22-customize-your-navigation-in-linear-mobile),
[Linear Changelog — UI refresh](https://linear.app/changelog/2026-03-12-ui-refresh)

---

### Things 3 — „Heute“ sammelt aus allen Listen, „Heute Abend“ unten

**Was die App macht:** Die Ansicht „Today“ zieht alles Fällige und für
heute Geplante aus allen Listen zusammen. Unten gibt es einen eigenen
Abschnitt „This Evening“ für das, was später am Tag dran ist. Auf dem
iPad lässt sich der Plus-Knopf an die Stelle ziehen, wo das Neue hin soll.

**Was wir übernehmen:**
- Startseite: oben „Jetzt“, ganz unten ein **Abschnitt „Zur
  Spätschicht / Übergabe“** für das, was heute noch, aber nicht jetzt
  dran ist — statt es zwischen Dringendes zu mischen.
- Das Ziehen des Plus-Knopfs **nicht** übernehmen: unsichtbare Geste.

**Wo in StudioChat:** Startseite („Das steht für dich an“).

**Passt zu / reibt sich mit:** W1 (ein Abschnitt mehr — passt er nicht,
geht er unter „Ausserdem“, nie stumm weg).

**Quelle:** [Wikipedia — Things (software)](https://en.wikipedia.org/wiki/Things_%28software%29),
[Curtis McHale — Magic Button in Things 3](https://curtismchale.ca/2020/10/26/magic-button-things-3)
(beides keine Herstellerseiten)

---

### Microsoft To Do — „Mein Tag“ beginnt jeden Morgen leer

**Was die App macht:** „Mein Tag“ leert sich jede Nacht. Was nicht
erledigt wurde, fällt in die normale Liste zurück und taucht am nächsten
Tag unter **Vorschläge** (Glühbirne oben) wieder auf; man holt es mit
einem Tipp zurück.

**Was wir übernehmen:** Für **persönliche** Punkte (eigene Erinnerungen,
von Formi angelegte „merk dir“): morgens frisch; Gestriges steht als
**eine** Zeile „3 von gestern — ansehen“, nicht als drei rote Zeilen.
Für Studio-Aufgaben gilt das **nicht**: Überfälliges bleibt sichtbar.

**Wo in StudioChat:** Startseite, Formi-Erinnerungen.

**Passt zu / reibt sich mit:** W1 (eine Zeile statt vieler), W7 (Gestriges
Persönliches ist kein Alarm).

**Quelle:** [Microsoft Support — My Day and suggestions](https://support.microsoft.com/en-us/ToDo/my-day-and-suggestions)

---

### Apple Fitness — Übersicht selbst zusammenstellen

**Was die App macht:** Ganz unten auf der Übersicht steht „Übersicht
bearbeiten“. Dann wackeln die Karten: mit Plus kommen neue dazu, mit
Minus gehen welche weg, gedrückt halten und ziehen ordnet sie.

**Was wir übernehmen:** Den **Ort** des Bearbeitens: ganz unten, als
leiser Knopf, nicht im Kopf. Den Ablauf (Minus an der Karte, Plus aus
einer Auswahl) für die Schnellzugriffe; Ordnen zusätzlich mit ↑/↓.

**Wo in StudioChat:** Schnellzugriffe „Anpassen“, ggf. Startseiten-Karten.

**Passt zu / reibt sich mit:** W1: eigene Karten dürfen die Startseite
nicht über einen Bildschirm treiben — Grenze fest einbauen, Überzähliges
unter „Ausserdem“. W6: Wackeln nur, solange bearbeitet wird, und bei
„weniger Bewegung“ gar nicht.

**Quelle:** [iDrop News — How to customize your iPhone's Fitness Summary](https://www.idropnews.com/how-to/how-to-customize-your-iphones-fitness-summary/227225)
(Fachpresse)

---

### Beekeeper — Schnellzugriffe auf der Startseite

Steht schon als A1 in `DESIGN-RECHERCHE.md` und ist gebaut (Runde 103).
Die dortige Quelle (Connecteam-Bericht über Beekeeper) konnte für diese
Sammlung **nicht erneut abgerufen werden** — *nicht nachgeprüft*.

---

## Top 3 zum sofort Übernehmen

1. **Zähler an der Leiste nur für Überfälliges und an mich Gerichtetes,
   sonst Punkt** (Apple HIG, Linear) — macht die Leiste ruhiger und den
   roten Zähler wieder bedeutsam.
2. **Beim Verkleinern unter 1100 px bleibt das gewählte Detail offen**
   (Android Liste + Detail) — kleine Regel, verhindert „wo war ich?“.
3. **Am Rechner Seitenleiste eine Stufe ruhiger als der Inhalt** (Linear)
   — eine Zeile CSS, danach Kontrast nachmessen.
