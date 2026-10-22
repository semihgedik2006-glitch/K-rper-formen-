# Farbe, Tiefe, Bewegung

Für Farben, Verläufe, Schatten, Hell/Dunkel/Formi und jede Animation.
Pflicht daneben: `CLAUDE.md` („Flüssig heisst konkret“, Statusfarben,
Kontrast) und `docs/DESIGN-SYSTEM.md` (Farbmarken, `akzentAnwenden()`,
`tippDeckung()`, Schattenleiter `--e1…--e3`). Was es schon gibt:
Bereichsfarben („Lebendig“), gerechnete Tönung je Farbe, `@property`-
Übergänge, Stil „Formi“ mit Raum, Glas ohne Weichzeichner, Lichtimpuls
einmal je Wechsel (Runde 178).

---

### Apple HIG — Dunkelmodus: heller ist näher

**Was die Richtlinie sagt:** Im Dunkeln gibt es zwei Sätze von
Hintergründen: **Grund** (dunkler, tritt zurück) und **erhöht** (heller,
kommt nach vorn) — ein Dialog über der Seite ist heller als die Seite.
Kontrast mindestens 4,5 : 1, bei eigenen Farben und kleiner Schrift
**7 : 1 anstreben**. Weisse Bildflächen leicht abdunkeln, damit sie nicht
leuchten. Und: keine app-eigene Hell/Dunkel-Wahl anbieten, sondern der
Systemeinstellung folgen.

**Was wir übernehmen:**
- **Tiefe im Dunkeln über Helligkeit, nicht nur über Schatten**: jede
  Ebene (Seite → Karte → Blatt/Dialog → Menü) eine Stufe heller. Dunkle
  Schatten auf dunklem Grund sieht man kaum.
- **Ziel 7 : 1 für Text unter 14 px** (Untertitel, Zeitstempel), 4,5 : 1
  bleibt die Untergrenze.
- Hochgeladene Fotos (Geräte, Schäden) im Dunkeln mit `filter:
  brightness(.9)` — einmalig, nicht animiert.

**Wo in StudioChat:** Flächen-Token im Stil Formi und Dunkel, Dialoge,
Aktionsblätter (laut Runde 178 noch ohne Lichtkante).

**Passt zu / reibt sich mit:** W5, W8. **Reibung:** StudioChat hat
bewusst eine eigene Wahl (Formi / Hell / Dunkel / Automatisch) — das war
ein Wunsch aus dem Betrieb (Runde 178). Hier gewinnt der Betrieb;
„Automatisch“ bleibt als Weg für alle, die dem System folgen wollen.

**Quelle:** [Apple HIG — Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)

---

### Material — Höhenstufen: Ruhe 0–3, Berührung 4–5

**Was die Richtlinie sagt:** Material kennt sechs Höhen (0 bis +5).
Ruhende Elemente liegen auf 0 bis +3, **Überfahren und Ziehen** heben
auf +4 / +5. Beim Drücken kann die Höhe auf 0 fallen — das Element gibt
nach.

**Was wir übernehmen:**
- **Drei Zustände je Knopf**: ruhend `--e1`, Hover (nur Maus) `--e2`,
  gedrückt flach + `translateY(1px)`. Das ist W5 in Zahlen.
- **Schatten nicht animieren** (`box-shadow` kostet Malarbeit je Bild).
  Stattdessen: der stärkere Schatten liegt auf `::after` und wird nur
  per `opacity` eingeblendet.

**Wo in StudioChat:** `.btn`, Karten mit Klick, Zeilen am Rechner.

**Passt zu / reibt sich mit:** W5, W6. Keine Reibung, wenn die
Pseudo-Ebene genutzt wird.

**Quelle:** [Material Web — Elevation](https://material-web.dev/components/elevation)

---

### web.dev — nur `transform` und `opacity`, Ebenen sparsam

**Was die Richtlinie sagt:** Nur `transform` und `opacity` kann der
Browser ohne Neuberechnung von Layout und Malerei bewegen. Bewegte
Elemente bekommen mit `will-change: transform` eine eigene Ebene —
aber **nicht alles befördern**, jede Ebene kostet Speicher. Andere
Bewegungen per FLIP auf `transform` zurückführen.

**Was wir übernehmen:**
- `will-change` **nur während** der Bewegung setzen (Klasse an, nach
  `transitionend` ab), nie dauerhaft an Listen.
- Beim Bericht die **Ebenen** in den DevTools zählen, nicht nur die
  Zeit je Bild.

**Wo in StudioChat:** Formi-Zeiger, Ansichtswechsel, Feder beim
Abhaken, `.hud-ein`.

**Passt zu / reibt sich mit:** W6 — das ist die Quelle hinter der Regel.

**Quelle:** [web.dev — Stick to compositor-only properties and manage layer count](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count)

---

### Apple HIG — Bewegung: kurz, abbrechbar, nicht bei jedem Tipp

**Was die Richtlinie sagt:** Bewegung nur mit Zweck. Rückmeldung kurz
und genau. Bei **häufigen** Handgriffen eigener Elemente eher keine
zusätzliche Bewegung. Niemand soll auf das Ende einer Animation warten
müssen. Bewegung darf nie der einzige Träger einer Information sein;
ergänzen durch Ton oder Vibration.

**Was wir übernehmen:**
- **Faustregel für StudioChat**: Was man **mehr als zehnmal am Tag**
  tippt (Abhaken, Senden, Reiterwechsel), bewegt sich höchstens 200 ms.
  Seltenes (Seite öffnen, Formi-Zeiger) darf 400–700 ms.
- **Jede Bewegung ist unterbrechbar**: ein zweiter Tipp während des
  Zeigerflugs bricht ab und führt sofort aus.
- Erfolg nie **nur** durch Bewegung zeigen — Haken + Text bleiben, die
  Vibration (`tick()`) gibt es schon.

**Wo in StudioChat:** alle Übergänge; Formi-Zeiger (Runde 177).

**Passt zu / reibt sich mit:** W6. Passt zur „spürbar, aber gezielt“-Wahl
aus Runde 178.

**Quelle:** [Apple HIG — Motion](https://developer.apple.com/design/human-interface-guidelines/motion)

---

### Linear — Thema aus drei Grössen

**Was die App macht:** Linear hat die Farben auf LCH umgestellt (gleiche
Helligkeit sieht gleich hell aus) und erzeugt helles und dunkles Thema
aus **drei Eingaben: Grundton, Akzent, Kontrast** — statt fast hundert
einzeln gepflegter Werte je Thema. Der Kontrastregler erzeugt auch
Hochkontrast-Themen. Weniger Blau in der Bedienoberfläche, Text
kräftiger.

**Was wir übernehmen:**
- Die **Richtung** bestätigt `akzentAnwenden()` + `tippDeckung()`: Farben
  rechnen, nicht wählen. Als dritte Grösse fehlt bei uns der
  **Kontrast**: eine Einstellung „Mehr Kontrast“, die Text eine
  Stufe kräftiger und Linien `--line-2` statt `--line` macht.
- Bei neuen Farben in LCH/OKLCH **denken**, aber wegen alter
  Studio-Tablets weiter als Hex/RGB **ausliefern** (siehe
  `DESIGN-SYSTEM.md`: kein `color-mix()`).

**Wo in StudioChat:** Einstellungen → Aussehen; `akzentAnwenden()`.

**Passt zu / reibt sich mit:** W8, „mehr Kontrast und viel mehr Tiefe“
aus der Wünsche-Tabelle.

**Quelle:** [Linear — How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui)

---

### Stripe — Farbleiter mit Stufen-Regel

**Was die App macht:** Stripe hat seine Farben in einem wahrnehmungs-
gleichmässigen Farbraum (CIELAB) neu aufgebaut, sodass jede Farbe auf
derselben Stufe gleich hell wirkt. Regel: **fünf Stufen Abstand** reichen
für kleinen Text, **vier** für Symbole und grosse Schrift.

**Was wir übernehmen:** Für Bereichsfarben eine Leiter mit
nummerierten Stufen und diese Regel als **Test**: Text auf Fläche nur,
wenn ≥ 5 Stufen auseinander — zusätzlich zur Messung an echten
Bildpunkten (die bleibt Pflicht, W8).

**Wo in StudioChat:** `ACCENTS`, `tests/test-akzent.js`.

**Passt zu / reibt sich mit:** W4, W8.

**Quelle:** [Stripe Blog — Designing accessible color systems](https://stripe.com/it-ca/blog/accessible-color-systems)

---

### Arc (Browser) — jeder Bereich hat seine Farbe

**Was die App macht:** Arc gruppiert Tabs in „Spaces“, und jeder Space
kann ein eigenes Farbthema haben; beim Wechseln ändert sich das ganze
Erscheinungsbild. Die Seitenleiste links trägt Adresse, Lesezeichen und
Tabs.

**Was wir übernehmen:** Bestätigung für „die Farbe folgt dem Bereich“ —
gibt es als „Lebendig“. Neu: die **Seitenleiste am Rechner** trägt die
Bereichsfarbe als **Verlauf von der linken Kante** (≤ 12 % Deckung,
läuft nach 40 % der Breite aus), nicht als Fläche.

**Wo in StudioChat:** Seitenleiste am Rechner.

**Passt zu / reibt sich mit:** W4 (Kante, ausläufend). W6: Farbe der
Seitenleiste **nicht** über ein vererbtes `@property` am `<body>`
animieren — eigene Pseudo-Ebene mit `opacity`-Überblendung.

**Quelle:** [SlashGear — Arc browser features](https://www.slashgear.com/1634601/best-arc-browser-features/)
(Fachpresse, keine Herstellerseite)

---

## Nicht nachgeprüft

Material 3 Expressive (Federn, Formen, Grösse) steht in
`DESIGN-RECHERCHE.md` (C1, C2). Die Seite
[m3.material.io — Building with M3 Expressive](https://m3.material.io/blog/building-with-m3-expressive)
liess sich für diese Sammlung nur ohne Inhalt abrufen (braucht
JavaScript) — *nicht nachgeprüft*.

## Top 3 zum sofort Übernehmen

1. **Hover-Schatten per `opacity` einer Pseudo-Ebene statt
   `box-shadow`-Übergang** (Material + web.dev) — „richtiger Knopf“ ohne
   Malarbeit je Bild.
2. **Ebenen im Dunkeln über Helligkeit staffeln, Ziel 7 : 1 für kleine
   Schrift** (Apple HIG) — schliesst die offene Stelle „Dialoge ohne
   Lichtkante“ aus Runde 178 gleich mit.
3. **Häufiges ≤ 200 ms, alles unterbrechbar** (Apple HIG Motion) — als
   Regel ins Design-System.
