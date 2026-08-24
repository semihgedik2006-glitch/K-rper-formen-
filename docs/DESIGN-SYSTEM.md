# StudioChat – Design-System

Stand 8. August 2026. Die Werte hier sind **aus dem Code ausgelesen**, nicht
erfunden. Wer etwas Neues baut, findet hier die Bausteine, damit es nicht
nach einem Fremdkörper aussieht.

---

## 1. Farben

Alle Farben liegen als CSS-Variablen in `:root` (dunkel) und `body.light`
(hell). **Nie eine Farbe direkt schreiben** – sonst fehlt sie im anderen
Modus.

### Flächen

| Marke | Dunkel | Hell | Wofür |
|---|---|---|---|
| `--bg` | `#12131C` | `#F4F6FA` | Seitengrund |
| `--bg-2` | `#1C1E2A` | `#FFFFFF` | Karten, Fenster, Blasen |
| `--bg-soft` | `#171925` | `#EDF0F6` | Eingabefelder, Reiterleisten |
| `--bg-3` | `#252838` | `#E3E8F1` | betonte Flächen |
| `--line` | weiß 9 % | schwarz 10 % | ruhige Trennlinie |
| `--line-2` | weiß 17 % | schwarz 18 % | Rahmen von Bedienelementen |
| `--scrim` | `rgba(6,10,7,.7)` | `rgba(17,23,38,.52)` | hinter offenen Fenstern |

Das Dunkel ist ein **Schiefer-Blau**, kein Schwarz: sachlich und über lange
Zeit angenehmer zu lesen als harter Neon-Kontrast.

### Marke

| Marke | Dunkel | Hell | Wofür |
|---|---|---|---|
| `--accent` | `#38BDF8` | `#0369A1` | primär, Cyan aus dem Logo |
| `--accent-2` | `#A78BFA` | `#6D28D9` | Violett, zweite Ebene |
| `--accent-3` | `#F472B6` | `#BE185D` | Pink, Akzent |
| `--brand` | Verlauf Violett → Cyan → Pink, 135° |
| `--on-accent` | `#0A1420` | `#FFFFFF` | Text auf Akzentflächen |

Die hellen Töne sind bewusst **dunkler als die dunklen** – auf Weiß wäre
`#38BDF8` nicht lesbar.

### Bedeutung — Fläche und Text sind zwei verschiedene Dinge

Das ist die wichtigste Regel dieses Abschnitts, und sie wurde teuer gelernt:
**dieselbe Farbe kann nicht zugleich eine gute Fläche und ein guter Text
sein.** Deshalb gibt es je zwei Marken.

| Marke | Dunkel | Hell | Wofür |
|---|---|---|---|
| `--warm` | `#FBBF24` | `#FBBF24` | **Fläche**: Punkte, Balken, Chips – trägt immer dunklen Text |
| `--danger` | `#FB4E6D` | `#FB4E6D` | **Fläche**: dito |
| `--ok` | `#34D399` | `#047857` | **Fläche** für Erfolg |
| `--warm-tx` | `#FFB38C` | `#92400E` | **Text** auf warmer Tönung |
| `--danger-tx` | `#FF8A8A` | `#B42318` | **Text** auf roter Tönung |
| `--ok-tx` | `#34D399` | `#047857` | **Text** für Erfolg |

**Regel:** Rot heißt „kaputt oder zu spät". Gelb heißt „bald oder wartet".
Nie Rot für „wartet auf Entscheidung" – ein Urlaubsantrag ist kein Defekt.

**Regel:** Für Text **nie** `--warm` oder `--danger` nehmen, sondern die
`-tx`-Marke. Wer das verwechselt, baut Text mit Kontrast 1,7 auf Weiß – im
Dunkelmodus fällt es niemandem auf, im Hellmodus ist er unlesbar.

> Wie das gefunden wurde: ein Messdurchlauf über alle Ansichten, beide
> Modi, mit übereinandergelegten halbtransparenten Flächen. 43 Stellen
> unter 4,5:1, die schlechteste bei 1,4:1. Jeder Wert oben ist gegen Weiß,
> gegen die Seitenfarbe und gegen die jeweilige Tönung nachgerechnet.
> Nachprüfen: `node tests/audit-forensik.js chef`

### Die getönte Fläche dazu

Eine Plakette braucht nicht nur die Textfarbe, sondern auch den Grund,
auf dem sie sitzt. Dafür gibt es eine eigene Leiter — **eine Stufe je
Zweck**, nicht je Bauteil:

| | leise | normal | stark | Kante |
|---|---|---|---|---|
| gut | `--f-ok-leise` | `--f-ok` | `--f-ok-stark` | `--k-ok` |
| Achtung | `--f-warn-leise` | `--f-warn` | `--f-warn-stark` | `--k-warn` |
| kaputt | `--f-bad-leise` | `--f-bad` | `--f-bad-stark` | `--k-bad` |

* **leise** — große Flächen: eine ganze Tabellenzeile, eine ganze Karte
* **normal** — Plaketten, Chips, Hinweisbalken
* **stark** — Finger drauf (`:hover`, `:active`)
* **`--k-*`** — die Kante zur Fläche

> Vorher standen hier **40 verschiedene Tönungen für drei Aussagen**:
> `.10`, `.11`, `.12`, `.14`, `.15`, `.16`, `.18` nebeneinander, dazu
> zwei verschiedene Rot (`251,78,109` und `239,68,68`) und zwei
> verschiedene Grün. Zwei Plaketten mit derselben Bedeutung sahen
> dadurch unterschiedlich aus — und niemand konnte sagen, welche die
> richtige war. Seit dem 13.8.2026 sind es 80 Stellen auf zwölf Marken.
>
> Einzige Ausnahme: `@keyframes`. Ein Puls, der von `.55` nach `0`
> läuft, ist Bewegung, keine Statusfläche — auf eine Sprosse gezogen
> wäre die Bewegung weg.

### Ein `<button>` erbt keine Textfarbe

Ohne eigene Angabe nimmt er das Schwarz des Browsers. Auf einer dunklen
Karte sind das 1,3:1. Deshalb steht im Reset `button{color:inherit}` –
aber wer eine neue Farbe braucht, setzt sie ausdrücklich.

### Text

`--text` (Hauptton) · `--text-2` (Nebentext) · `--text-3` (Metadaten).
Drei Stufen, mehr nicht.

---

## 2. Schrift

| Marke | Familie | Wofür |
|---|---|---|
| `--font-head` | Barlow Condensed, 500–800 | Überschriften, Zahlen, Marken |
| `--font-body` | Barlow, 300–700 | alles andere |

**Größen — sieben Stufen, jede mit einer Aufgabe:**

| Marke | Wert | Wofür |
|---|---|---|
| `--t-2xs` | `.70rem` | Abzeichen, Zähler |
| `--t-xs` | `.78rem` | Hinweise, Meta, Zeitangaben |
| `--t-sm` | `.86rem` | Zweitzeile, Sekundärtext |
| `--t-md` | `.95rem` | Fließtext |
| `--t-lg` | `1.12rem` | Kartentitel |
| `--t-xl` | `1.36rem` | Abschnittstitel |
| `--t-2xl` | `1.75rem` | Seitentitel |

> **Vorher waren es 52 verschiedene Werte** zwischen `.58` und `2rem` —
> zwischen `.72` und `.78` allein sechs. Unterschiede, die niemand sieht,
> kosten genau das, wofür sie gedacht waren: Hierarchie. Wenn sich nichts
> unterscheidet, ist auch nichts wichtiger. Seit dem 13.8.2026 liegen
> 289 Angaben auf diesen sieben Stufen.
>
> Drei Ausnahmen, alle begründet: `pt` in der Druckausgabe (dort ist
> Millimeter das Maß), `clamp()` beim Seitentitel (er schrumpft beim
> Scrollen mit) und die `16px` an Eingabefeldern — darunter zoomt iOS
> beim Antippen in die Seite hinein.

**Zeilenabstand und Laufweite** haben ihre eigenen Leitern:

| Marke | Wert | Wofür |
|---|---|---|
| `--lh-1` | `1` | bewusster Reset, z. B. große Zahlen |
| `--lh-eng` | `1.25` | Überschriften |
| `--lh` | `1.5` | Fließtext (auch der Grundwert am `body`) |
| `--lh-weit` | `1.65` | längere Absätze, aufgeklappte Erklärungen |
| `--ls-eng` | `-.02em` | nur große Überschriften |
| `--ls-s` | `.02em` | Knöpfe |
| `--ls-m` | `.05em` | kleine Versalien |
| `--ls-l` | `.12em` | Abschnittsmarken |

Negative Laufweite nur bei großen Überschriften, weite nur bei Versalien —
dort braucht das Auge die Luft wirklich.

Die Schriftgröße ist über die Einstellungen in drei Stufen skalierbar –
neue Größen deshalb **relativ** (`rem`), nie in Pixeln.

---

## 2b. Höhe statt Rahmen

Eine Karte hebt sich ab, indem sie **über** dem Grund liegt, nicht indem
man sie umrandet.

| Marke | Wofür |
|---|---|
| `--e1` | Karten, Plaketten, alles, was nur eine Stufe über dem Grund liegt |
| `--e2` | angehoben: Karte unter dem Finger, klebende Werkzeugleiste |
| `--e3` | Fenster über der Seite, Aktionsblatt |
| `--e1-oben` | Leiste am unteren Rand — wirft nach **oben** |
| `--e3-oben` | Blatt, das von unten hochfährt |

> Vorher standen **28 verschiedene** `box-shadow`-Angaben im Stylesheet.
> Nicht geprüft werden Ringe (`0 0 0 Npx`): ein Fokusring und ein Puls
> sind keine Höhe, sondern eine Umrandung.

Dazu ist `--line` bewusst **leise** (weiß 8 % / schwarz 9 %): der Rahmen
ist die feine Kante obendrauf, nicht das, was die Karte trägt.
`--line-2` bleibt kräftig — dort, wo die Kante eine Aufgabe hat:
Eingabefelder, aktive Zustände, Trennung im Formular.

### Eine Stufe über der Fläche: `--auf-1/2/3`

Für alles, was **auf** einer Karte liegt und sich von ihr abheben soll,
ohne eine eigene Farbe zu haben: Eingabefeld, stiller Knopf,
Fortschrittsschiene, neutrale Plakette.

| Marke | Wofür |
|---|---|
| `--auf-1` | Grundzustand: Eingabefeld, `.btn-ghost`, `.icon-btn` |
| `--auf-2` | Finger drauf, Schiene eines Balkens, Plakette |
| `--auf-3` | betont, z. B. der Zähler in einem aktiven Chip |

> **Warum das eine Marke sein muss.** Vorher stand an 32 Stellen fest
> „Weiß 5 %". Im Dunkeln ist das genau richtig. Auf einer **weißen**
> Karte ist Weiß auf Weiß nichts — diese Bauteile wurden im Hellmodus
> nur noch von ihrem Rahmen getragen, und wer keinen hatte (die
> Plakette „kein Abschluss", die Schiene eines Quotenbalkens), war
> unsichtbar. Nachgemessen im Browser: `.inp`, `.btn-ghost`,
> `.icon-btn` und `.pbar` lieferten in **beiden** Modi denselben Wert.
>
> „Eine Stufe höher" heißt im Dunkeln heller und im Hellen dunkler.
> Das kann nur eine Marke wissen, kein fester Wert.

Zwei Ausnahmen bleiben weiß: der Schließen-Knopf im Bildbetrachter (er
liegt in beiden Modi auf schwarzem Grund) und der Rollbalken (der hat
eine eigene Hell-Regel).

---

## 3. Maße

| Marke | Wert | Wofür |
|---|---|---|
| `--r-xs` | `8px` | Eingabefelder, kleine Knöpfe, Kästchen |
| `--r-sm` | `11px` | Listenzeilen, Dokumente, Chips |
| `--r-md` | `14px` | Umfragen, Geräte, Menüs |
| `--r-lg` | `18px` | größere Blöcke |
| `--radius` | `22px` | Karten |
| `--radius-lg` | `30px` | große Flächen |
| `--r-pille` | `999px` | Knöpfe und Marken |
| `--r-rund` | `50%` | Avatare, runde Knöpfe |

> **Feste Werte gehören nicht ins Stylesheet.** Die Leiter gab es schon
> länger, benutzt wurde sie vierzehnmal — daneben standen über neunzig
> feste Werte zwischen 2 und 30 px, zwölf verschiedene für dieselbe Sache.
> Seit dem 13.8.2026 liegt jede Rundung auf einer Stufe (179 Stellen).
> Zwei Ausnahmen bleiben, beide einmalig und begründet: das
> Konfetti-Teilchen (2 px) und das Kästchen eines Teilschritts (5 px).
> `tests/test-gestaltung.js` schlägt an, wenn ein fester Wert dazukommt.

> Eine **undefinierte** Variable macht die ganze Angabe ungültig — als
> `--r-md` und `--r-sm` einmal fehlten, standen Umfragen, Geräteliste,
> Anhang-Menü und Aufgaben-Vorlagen mit rechten Winkeln da, während alles
> daneben rund war. Aufgefallen ist es niemandem: es sah nicht kaputt aus,
> nur anders.

### Symbole

Ein Satz, ein Stil: 24er Raster, Kontur, `stroke-width:2`, `currentColor`.
Definiert in `IKONEN`, ausgegeben von `ikon('name')`, gestylt über `.sym`
(1,05 em, erbt Farbe und Größe vom umgebenden Element).

Im festen Markup steht dasselbe SVG ausgeschrieben — dort kann keine
Funktion laufen. Beide Fassungen müssen dieselben Pfade zeichnen; geprüft
wird das im selben Durchlauf.

**Kein Emoji als Bedienelement.** Ein Emoji bringt eigene Farben mit,
ignoriert Hell und Dunkel und sieht auf jedem Betriebssystem anders aus.
Bis zum 13.8.2026 standen 467 davon in der App, neben echten Inline-SVG —
diese Mischung ist das Erste, was jemandem auffällt, der die App zum
ersten Mal sieht.

Erlaubt bleiben Emoji nur, wo sie **Inhalt** sind: die sechs
Chat-Reaktionen, Avatare, der Geburtstagsgruß.

**Vor einer Überschrift steht kein Symbol.** „📅 Mein Dienst" war keine
Information, sondern Dekoration.

### Die Apple-Ecke

Apples Symbole sind keine Kreisbögen, sondern **Superellipsen**: die
Rundung setzt früher an und läuft weicher aus. Wo der Browser das kann,
bekommt jede gerundete Fläche `corner-shape: var(--ecke)` – hinter
`@supports`, also ohne Risiko für ältere Geräte. Runde Sachen (`999px`)
bleiben außen vor, sonst würden aus Chips Kästen.

Chromium ab 139 kann es (hier geprüft mit 141). Für Safari auf dem iPhone
ist es **nicht** nachgesehen – dort greift dann `--radius`, und der
Unterschied fällt nur im direkten Vergleich auf.

**Seitenrand:** `clamp(14px, 4vw, 28px)` – auf dem Handy schmal, am Rechner
großzügig. Dazu immer die Geräteränder addieren:
`padding-left: calc(clamp(14px,4vw,28px) + var(--sal))`.
Ohne `--sat/--sab/--sal/--sar` liegen Knöpfe am iPhone unter der
Statusleiste und lassen sich nicht antippen.

**Abstände:** eine Leiter in `:root`, der Name nennt den Wert.

| | |
|---|---|
| fein | `--s1` 1 · `--s2` 2 · `--s4` 4 · `--s6` 6 · `--s8` 8 |
| normal | `--s10` 10 · `--s12` 12 · `--s16` 16 · `--s20` 20 · `--s24` 24 |
| grob | `--s32` 32 · `--s40` 40 · `--s48` 48 · `--s56` 56 · `--s72` 72 |

> **Keine festen Pixelangaben bei `padding`, `margin` und `gap`.** Vor der
> Leiter standen dort 52 verschiedene Werte zwischen 1 und 72 px — sieben
> davon einen Pixel auseinander, weil jeder einzeln so lange geschoben
> wurde, bis er passte. `tests/test-gestaltung.js` schlägt an, wenn wieder
> einer auftaucht. Ausgenommen sind `clamp()`, `calc()`, negative Werte und
> mm (Druck): dort steht bewusst eine Rechnung, keine Sprosse.

**Dichte:** rund 15 % enger als in den ersten Fassungen (Karten
`13–19px` statt `16–24px`, Abstand zwischen Karten 12 statt 16). Auf einem
390er-Handy passt dadurch etwa eine Karte mehr aufs Bild. **Die 44 Pixel
für den Finger sind davon ausgenommen** – enger wird das Auge, nicht die
Trefferfläche. Wo beides kollidiert, gewinnt der Finger über die
unsichtbare `::after`-Fläche.

---

## 3b. Knöpfe — die Rangfolge

> **Grau ist die Farbe von „liegt da", nicht von „drücke mich".**

| | Aussehen | wofür |
|---|---|---|
| `btn-primary` | Marken-Verlauf, weiße Schrift, großer Schein | die eine Handlung, die man auf dieser Seite tun soll |
| `btn-ghost` | getönte Fläche (`--tipp-1`), Kante (`--tipp-kante`), Schrift in `--accent-d`, kleiner Schatten | alles andere Antippbare |
| `btn-danger` | rot getönt, rote Kante und Schrift | löschen, defekt melden |
| `:disabled` | grau | **der einzige graue Zustand** |

Die drei Marken `--tipp-1` (Ruhe), `--tipp-2` (Finger drauf) und
`--tipp-kante` gehören allem, was man antippt. Sie sind bewusst von
`--auf-1/2/3` getrennt: die tragen den stillen Grund eines Eingabefelds.
Solange dasselbe Grau an beidem klebt, sieht ein Knopf aus wie ein
Kasten — vorher unterschied sich `btn-ghost` von seiner Karte um
**1,15:1** (dunkel) und **1,09:1** (hell); bei 1,0 wären sie identisch.

**Wie stark getönt werden darf, ist keine Geschmacksfrage.** Mehr Tönung
heißt weniger Kontrast für die Schrift darauf:

| Tönung | Fläche/Grund | Text/Fläche |
|---|---|---|
| .13 | 1,28 | 6,05 |
| .18 | 1,42 | 5,44 |
| **.24** | **1,62** | **4,78** ← die Grenze |
| .30 | 1,86 | 4,15 ✗ |

Wer die Werte anfasst, misst beide Spalten nach. Unter 4,5:1 geht die
Schrift nicht.

**Werkzeuge sind keine Handlungen.** `.icon-btn` (Suchen, Hell/Dunkel,
Abmelden) trägt dieselbe Tönung, aber der Bericht-Knopf daneben ist
*deckend* — derselbe Abstand wie `btn-primary` zu `btn-ghost`. Als die
Werkzeuge noch grau waren, reichte für ihn eine schwache Tönung; danach
war ausgerechnet die Handlung das Blasseste in der Zeile. **Eine
Aufwertung ist nie nur lokal:** wer eine Gruppe lauter macht, macht ihre
Nachbarn leiser.

---

## 4. Fingerziele — die harte Regel

> **Alles, was man antippt, ist mindestens 44 Pixel hoch.**

Das war der häufigste Fund im gesamten Audit. Gefunden und behoben:

Es gibt **zwei** Wege, sie einzuhalten:

**1. Sichtbar größer machen** – wo Platz ist (Chips, Reiter, Knöpfe):
`min-height:44px` plus `display:inline-flex;align-items:center`.

**2. Nur die Trefferfläche vergrößern** – wo ein Symbol klein aussehen
soll (Löschen, Anheften, Reaktion, Haken). Eine unsichtbare Fläche legt
sich zentriert darüber:

```css
.mein-symbol{position:relative}
.mein-symbol::after{content:'';position:absolute;left:50%;top:50%;
  transform:translate(-50%,-50%);width:max(100%,44px);height:max(100%,44px)}
```

Auge und Finger bekommen so verschiedene Größen. Die Zeile bleibt schlank.

Gemessen wird nicht die gemalte Höhe, sondern was der Finger trifft –
`document.elementFromPoint` 21 Pixel über und unter der Mitte.

| Bauteil | vorher | jetzt |
|---|---|---|
| Kanalauswahl `.chan` | 30 | 44 |
| Filter-Chips `.chip` | 31 | 44 |
| Reiter im Team `.pm-tab` | 35 | 44 |
| Umfrage-Antwort `.poll-opt` | 36 | 44 |
| „Ich kann nicht" `.tausch-btn` | 24 | 44 |
| Zahlenfeld Material `.num` | 40 | 44 |
| Wochenknöpfe `.wk-btns .btn` | 38 | 44 |
| Reaktion, Anheften, Löschen, Haken | 19–34 | 44 (unsichtbar) |
| Kopfzeile `.icon-btn` unter 520px | 36 | 44 *(24.8.)* |
| Marke `.tb-brand` | 38×20 | 44×50 *(24.8.)* |
| Untere Leiste, schmalster Eintrag | – | 44 breit *(24.8.)* |

Ausnahme: Symbole **innerhalb** einer Zeile, die selbst anklickbar ist
(die Kamera in der Aufgaben-Fußzeile). Dort ist die ganze Zeile das Ziel.

**Die Kopfzeile war die letzte Ausnahme — sie ist am 24.8. weggefallen.**
Sie stand ein halbes Jahr auf 36px, mit dem Argument, dass 44 die Zeile
sprengen würden. Nachgemessen kostet es **sechs Pixel** (63 → 69), und
zwar nur, weil die Marke als Knopf ohnehin 50 belegt. Wer eine solche
Ausnahme im Quelltext festhält, sollte die Zahl daneben schreiben — hier
stand nur die Behauptung, und die war zu teuer geschätzt.

Zwei Folgen, die zur Regel gehören:

* Die Marke bekommt ihre Höhe über `padding` **plus gleich großen
  negativen `margin`**. Der Griff wächst, die Zeile nicht.
* Vier Knöpfe mal acht Pixel sind 32, und die fehlen woanders. Hier dem
  Schriftzug: er weicht jetzt schon ab 420px statt erst ab 360.
  Eine Vergrößerung ist nie nur lokal.

---

## 4b. Waagerecht schieben — die Liste

> **Der Bildschirm wackelt nicht. Leisten dürfen schieben, Seiten nicht.**

Erlaubt sind genau fünf Leisten, jede mit Grund:

| Leiste | Grund |
|---|---|
| `.subnav` | „Betrieb" hat sechs Reiter, der längste heißt „Probetraining". Umgebrochen: vier Zeilen und 162 statt 42 Pixel bei 320px |
| `.chat-channels` | bis zu 14 Studios plus Gruppen |
| `.chip-row` | Filter; umbrechend nahm die Leiste 150px über einer Liste mit drei Einträgen |
| `.sort-row` | dasselbe für die Sortierung |
| `.pm-tabs` | passt inzwischen überall, bleibt als Notausgang |

Alles andere ist ein Fund — `tests/test-quer.js` hält die Liste fest.
**Die untere Leiste steht ausdrücklich nicht darin:** was man in der
Hauptnavigation wegwischen muss, gibt es für den Benutzer nicht.

**Wer eine Leiste schieben lässt, schuldet zwei Dinge:**

1. Der aktive Eintrag muss ins Bild geschoben werden
   (`kanalSichtbarMachen`, `subtabSichtbarMachen`). Sonst weiß niemand,
   wo er ist.
2. `scrollIntoView({inline:'center'})`, nicht `'nearest'`. Steht der
   offene Eintrag ganz rechts, sieht man bei `'nearest'` zwar ihn, aber
   keinen Nachbarn — und damit nicht, dass es weitergeht.

### Beim Messen: was zählt als schiebbar

| | `scrollLeft` bewegt sich | mit dem Finger schiebbar |
|---|---|---|
| `overflow:hidden` / `clip` | ja | **nein** |
| `<input>`, `<textarea>` | ja | nein (scrollt beim Tippen) |
| `overflow-x:auto/scroll` | ja | **ja** |

Die erste Messung dieser Sorte hat genau daran vorbeigemessen und
Funde gemeldet, die keine waren.

### Zwei Fallen

* **`overflow-y:auto` allein macht auch waagerecht scrollbar.** Steht
  `overflow-x` auf dem Vorgabewert, rechnet der Browser ihn ebenfalls
  als `auto`. `.scroll-area` braucht deshalb ausdrücklich
  `overflow-x:hidden` — als Sperre, nicht als Ersatz fürs Aufräumen:
  was überläuft, wird dann abgeschnitten, und das meldet
  `test-abgeschnitten.js`.
* **`white-space:nowrap` ist die häufigste Ursache.** Ein Pfad, eine
  Mail-Adresse, eine Nummer — was nicht umbrechen darf, drückt seinen
  Kasten auf. Auf 320px kostet ein einziges `nowrap` 30 Pixel
  Seitenversatz. Nur dort setzen, wo die Länge feststeht (eine
  Rufnummer: ja; eine Mail-Adresse: nein).

---

## 5. Bewegung

| Marke | Kurve | Wofür |
|---|---|---|
| `--ease-out` | `cubic-bezier(.16,1,.3,1)` | Einblenden, Ansichtswechsel |
| `--ease-ios` | `cubic-bezier(.32,.72,0,1)` | Gleiten, Aufklappen |
| `--spring` | `cubic-bezier(.34,1.42,.64,1)` | Druck-Rückmeldung, Pop |

**Dauern:** 180 ms (Rückmeldung) · 260–350 ms (Blätter, Aufklappen) ·
460–500 ms (Fenster von unten).

### Der gleitende Marker

An **vier** Stellen dieselbe Bewegung: untere Leiste, Reiter der Gruppe,
Kanalreihe im Chat, Verwaltungs-Reiter. Vorher sprang eine gefüllte Pille
von Reiter zu Reiter – man sah, wo man ankam, aber nicht, woher.

Ein `::before` am Behälter, gesteuert über vier Marken, die JavaScript am
aktiven Reiter **misst** (nicht schätzt):

```css
.leiste{position:relative}
.leiste::before{content:'';position:absolute;left:0;top:0;
  height:var(--ind-h,38px);width:var(--ind-w,0);
  transform:translate(var(--ind-x,0),var(--ind-y,0));
  opacity:var(--ind-o,0);
  transition:transform .42s var(--ease-ios),width .42s var(--ease-ios),
             height .42s var(--ease-ios),opacity .2s}
.leiste.sofort::before{transition:none}
```

| Funktion | wofür |
|---|---|
| `markerSetzen(behälter, aktiv)` | gleitet hin |
| `markerSofort(behälter, aktiv)` | steht sofort da – beim ersten Aufbau |
| `gruppenMarker() subnavMarker() chefTabMarker() kanalMarker()` | die vier Stellen |
| `markerNeuMessen()` | nach Drehen oder Größenwechsel |

Zwei Fallen, beide schon hineingetreten:

- **`offsetParent` taugt nicht als Sichtbarkeitsprüfung.** Die untere
  Leiste ist `position:fixed`, und dort ist `offsetParent` immer `null` –
  die Prüfung hätte den Marker überall abgeschaltet. Richtig ist
  `getComputedStyle(bar).display === 'none'`.
- **Die Höhe gehört gemessen, nicht ins CSS geschrieben.** Sobald ein
  Reiter zweizeilig wird oder jemand die Schrift vergrößert, sitzt ein
  fester Wert daneben.

### Zahlen zählen hoch

`hochzaehlen(wurzel)` zählt jede `[data-zahl]` von 0 hoch. Nur beim
Neuaufbau, nicht bei jedem Neuzeichnen. Grenzen bewusst: über **60** wird
nicht gezählt (dauert zu lange), und bei „Bewegung reduzieren" gar nicht –
zählende Ziffern sind genau die Art Flackern, die dann stört.

### „Bewegung reduzieren" ernst nehmen

`@media (prefers-reduced-motion: reduce)` setzt Dauer **und Verzögerung**
auf null und schaltet Animationen ab. Nachgemessen: 29 Übergänge, 3
Verzögerungen und 17 laufende Animationen werden zu **0 / 0 / 0**.

Die Verzögerung gehört ausdrücklich dazu. Nur die Dauer abzuschalten reicht
nicht — das Element bewegt sich dann zwar nicht mehr, erscheint aber immer
noch verspätet. Das wirkt wie ein Hänger, nicht wie Ruhe.

> **CSS erreicht nicht alles.** `scrollIntoView({behavior:'smooth'})` ist
> JavaScript und läuft unbeirrt weiter — und gerade unerwartetes Gleiten ist
> bei Gleichgewichtsstörungen der schlimmste Auslöser, schlimmer als jedes
> Einblenden. Deshalb **nie direkt** `scrollIntoView`/`scrollTo` mit
> `behavior:'smooth'` aufrufen, sondern immer `sanftInsBild(el, opt)` bzw.
> `sanftScrollen(flaeche, opt)`. Die fragen die Einstellung ab und schalten
> auf `auto` um.

### Was sich neu zeichnet, darf sich nicht bewegen

Die härteste Regel in diesem Abschnitt, und die am leichtesten zu
übersehene: **eine Einlauf-Animation gehört nur an Elemente, die sich auf
einen Klick hin ändern — nie an solche, die bei jedem Tastendruck neu
gezeichnet werden.**

Die Notizliste in „Mein Bereich" wird bei jedem Buchstaben im Suchfeld
neu aufgebaut. Ein `listIn` je Zeile wäre dort kein Einlaufen mehr,
sondern ein Flackern bei jedem Buchstaben. Bewegt wird deshalb nur der
Reiterwechsel und das Blättern im Kalender.

Wenn die Bewegung etwas **sagen** kann, soll sie es. Vor und zurück
laufen im Kalender in verschiedene Richtungen — man sieht, wohin man
geblättert hat, ohne die Beschriftung zu lesen. „Heute" springt bewusst
ohne Richtung: es geht weder vor noch zurück.

### Eine Animation neu starten

Eine Klasse ein zweites Mal hinzuzufügen, die schon dran ist, tut
**nichts**. Wer zweimal schnell auf „vor" klickt, sieht ab dem zweiten
Klick keine Bewegung mehr. Der Neustart braucht drei Schritte, und der
mittlere ist der, den man weglässt:

```js
el.classList.remove(klasse);
el.offsetHeight;          // Messung erzwingen — ohne die fasst der
el.classList.add(klasse); // Browser beides zu nichts zusammen
```

Dazu gehört das Abräumen nach `animationend`: mit
`animation-fill-mode:both` bleibt die Klasse sonst für immer am Element
und legt ihr Ergebnis weiter über den normalen Zustand.

> **Ein Durchlauf, der prüft, ob „eine Animation läuft", prüft zu wenig.**
> Beim zweiten Klick lief ja schon eine. Geprüft gehört die **verstrichene
> Zeit**: bei 0 fängt sie von vorn an, bei 83 ms lief die alte weiter. Und
> die Klicks müssen dicht genug beieinander liegen, dass der Aufräumer
> noch nicht dran war — sonst ist die Behauptung auch ohne Neustart grün.
> Genau so ist sie hier beim ersten Anlauf durchgerutscht.

---

## 6. Bausteine

### Karte `.card`
Grundfläche für alles. Mit `data-fold="name"` wird sie aufklappbar; der
Zustand merkt sich das Gerät in `PREFS.folds`. `data-fold-offen="1"` startet
offen.
**Wann zuklappen:** wenn die Karte ein Formular ist oder ein Beleg zu der
Karte darüber. Nie die Karte, die die Frage der Seite beantwortet.

### Aktionsblatt `.msg-sheet`
Gleitet von unten, dunkler Grund dahinter. Kopf mit Bezug (wer/was/wann),
optional eine Reaktionsreihe, dann `.ms-act`-Einträge à 48 Pixel mit Symbol
**und Wort**, zuletzt „Abbrechen".
Benutzt von: Chat-Nachricht, Aufgabe, Dokument.
**Wann:** sobald es mehr als zwei Aktionen an einem Listeneintrag gibt.

### Studio-Übersicht `.dev-wo`
Reihe anzutippender Studios mit Zahl, darüber eine `.sec-head`-Überschrift
und ein erklärender Satz. Rot = defekt, gelb = wartet.
Benutzt von: „Wo etwas los ist" (Start), „Wo etwas defekt ist" (Geräte),
„Wartet auf deine Entscheidung" (Team).
**Wann:** immer, wenn eine Seite nur ein Studio zeigt, das Problem aber
woanders liegen kann.

### Chip-Reihe `.chip-row` / `.sort-row`
Eine Zeile, seitlich schiebbar, nie umbrechend. Zahl am Chip über
`.chip-num`.
**Warum nicht umbrechen:** vier Filter in drei Zeilen sind 150 Pixel über
einer Liste mit drei Einträgen.

### Leerer Bereich `emptyHTML(titel, text, symbol, tat)`
Muss **den Grund und den Ausweg** nennen. Nicht „Keine Aufgaben", sondern
„Keine dir zugewiesenen Aufgaben – es gibt 4, tippe auf ‚Alle'".

`symbol` ist ein Name aus `IKONEN`. Vorher trug jeder leere Bereich
dasselbe Klemmbrett; jetzt trägt er seines — beim Wischen erkennt man
dadurch, **welcher** Bereich gerade leer ist. `tat` nimmt fertiges
Markup für den nächsten Schritt auf, meist einen `.btn`.

### Kurze Zeile statt leerer Karte: `emptyMini(text)`
Für Stellen, an denen ein ganzer leerer Bereich zu groß wäre — eine Zeile
in einer Karte, eine Spalte in einer Tabelle. Vorher stand an fünfzehn
solchen Stellen dieselbe Angabe im `style`-Attribut.

### Details auf Nachfrage: `<details class="nachfrage">`
```html
<p class="hint">Ein Satz.</p>
<details class="nachfrage">
  <summary>Warum ist das so?</summary>
  <div class="nachfrage-text"><p>Der lange Grund.</p></div>
</details>
```
**Die Regel im ganzen Haus: standardmäßig kurz, Details auf Nachfrage.**
Eine vollständige Begründung ist beim ersten Mal hilfreich und ab dem
zweiten Mal eine Wand, die man überliest.

`<details>` statt eines eigenen Schalters: es kennt „offen" von sich aus,
lässt sich mit der Tastatur bedienen, wird von Vorlesehilfen angesagt und
braucht keine Zeile Skript — was mit der Sicherheitsregel der Seite (CSP)
ohnehin besser zusammenpasst.

> Der Name ist `nachfrage`, nicht `mehr`: `.alert-bar.mehr` gibt es
> bereits. Eine Regel `.mehr{margin-top:…}` hätte den Hinweisbalken
> stillschweigend mitverschoben.

### Startseite: „Zum Lesen"
Zwischen „Mein Dienst" und „Überblick". Zwei Karten, beide klappbar und
beide **von selbst weg**, wenn nichts drinsteht:

| Karte | Inhalt | Link |
|---|---|---|
| 📣 Von der Leitung | die drei jüngsten Aushänge, die mich betreffen | Alle › |
| 📌 Schwarzes Brett | die drei jüngsten Einträge | Alle › |

Der Text wird per CSS auf drei Zeilen gekürzt (`-webkit-line-clamp`),
**nicht** im Text abgeschnitten – wer alles will, tippt auf „Alle".
Ungelesenes bekommt einen Punkt, kein Wort.

**Die Regel dahinter: nichts zweimal auf einem Bildschirm.** Die alte
Hinweiszeile „2 neue Infos von der Leitung ›" ist weggefallen, weil der
Text jetzt darunter steht. Angeheftete Aushänge erscheinen oben als
Hinweis **oder** unten im Text, nie beides. Eine Karte, in der „noch
nichts da" steht, ist auf einer Startseite nur Platzverschwendung.

### Fenster über der Seite (Dialog)
Fünf Fenster (`profileModal`, `personModal`, `devModal`, `pollModal`,
`todoEditModal`) teilen sich **eine** CSS-Regel; `fwdModal` und `keysModal`
hängen mit eigener z-Ebene daran. Der Grund dahinter ist das Token
`--scrim` — nicht direkt `rgba(...)` schreiben, sonst hat der helle Modus
wieder einen fast schwarzen Schleier.

Ein neues Fenster braucht **nur zwei Dinge**: das Kürzel in die Liste
`DIALOGE` in `index.html` und in `closeAllModals()`. Alles Weitere kommt
von allein:

| | woher |
|---|---|
| `role="dialog"`, `aria-modal`, Name | `dialogeVorbereiten()` setzt sie beim Start |
| Fokus springt beim Öffnen hinein | Beobachter auf der Klasse `show` |
| Tabulator bleibt drin | ein globaler Tab-Fänger, oberstes offenes Fenster gewinnt |
| Escape schließt | `bindShortcuts()` → `closeAllModals()` |
| Fokus kehrt zum Auslöser zurück | derselbe Beobachter |

**Die beiden Listen dürfen nicht auseinanderlaufen.** Steht ein Fenster nur
in einer, fehlt ihm entweder der Fokus-Käfig oder Escape.

### Rückgängig `offerUndo(text, fn)`
Acht Sekunden. Für alles, was löscht. Zusätzlich `confirm()`, wenn die
Wirkung über den eigenen Bildschirm hinausgeht (14 Studios, alle Kollegen).

### Text, der sich ändern lässt, ohne Modus
Wo ein Wert nur angezeigt wird, den man gelegentlich korrigiert: ein
Eingabefeld, das **wie Text aussieht**, bis man hineintippt
(`.mat-name-inp` als Muster). Kein Bearbeiten-Knopf, kein zweiter
Zustand — die Zeile bleibt an derselben Stelle dieselbe Sache.

```
ruhend    background:none; border:1.5px solid transparent
hover     background:var(--auf-1)
fokus     background:var(--auf-1); border-color:var(--accent)
```

Dazu drei Regeln, die sonst wehtun:
- **Speichern beim Verlassen**, nicht bei jedem Tastendruck. Sonst steht
  „Handtuc" für eine Sekunde in der Datenbank, und wer gleichzeitig
  daraufschaut, sieht es.
- **Escape stellt den alten Wert wieder her.** Ohne Rückweg traut sich
  niemand hineinzutippen.
- **Leer wird abgewiesen**, nicht gespeichert.

Und im Test: `textContent` eines `<input>` ist **immer leer**. Wer eine
Textzeile zu einem Feld macht, muss jede Prüfung mitziehen, die den
Wert liest — sonst vergleicht sie `""` mit `""` und ist grün.

### Ziehen: ein Griff, nicht die ganze Zeile
Sortierbare Listen werden mit **Zeigerereignissen** gebaut, nicht mit
HTML5-Drag — nur so funktioniert es auf dem Handy wie mit der Maus.

`touch-action:none` gehört **ausschließlich** auf den Griff. Steht es auf
der Zeile, lässt sich die Liste auf dem Handy nicht mehr scrollen, ohne
etwas zu verschieben — und das merkt man erst am echten Gerät.

```
.ich-griff{touch-action:none; cursor:grab}     ← nur hier
.ich-tdo  { … }                                ← nichts davon
```

Geschrieben wird beim **Loslassen**, nicht bei jeder Bewegung, und nur
die Zeilen, deren Position sich wirklich geändert hat.

Jeder Test dazu braucht zwei Züge: einen **am** Griff (muss sortieren)
und einen **daneben** (darf nicht). Ohne den zweiten ist auch eine
Liste grün, die sich beim Scrollen selbst umsortiert.

### Nur eine Ordnung pro Liste
Wenn der Nutzer von Hand sortieren darf, gewinnt seine Reihenfolge —
vor Datum, Priorität und allem anderen. Zwei Ordnungen gleichzeitig
sind nicht erklärbar: man zieht etwas nach oben und es rutscht wieder
weg. Andere Merkmale dürfen weiterhin **auffallen** (überfällig rot),
aber nicht mehr umsortieren.

### Höchstens vier Farben für eine Kategorie
Ab etwa fünf Tönen unterscheidet man sie in einem 6-Pixel-Punkt nicht
mehr zuverlässig. Dann ist die Farbe keine Hilfe mehr, sondern
Dekoration — und die Liste braucht wieder Text, um lesbar zu sein.
Dieselbe Farbe muss an **allen** Stellen dieselbe Sache heißen: Punkt im
Raster, Plakette in der Liste, Auswahl im Formular.

### Kein Zustand, den man nicht bedienen kann
Ein graues, gesperrtes Feld wirft die Frage auf, warum es da ist. Wenn
eine Auswahl ein Feld gegenstandslos macht (`ganztägig` → Uhrzeiten),
blende es **aus**, statt es zu sperren. Und verwirf den Wert beim
Speichern: ein ganztägiger Termin mit Uhrzeit ist ein Widerspruch, den
niemand später erklären kann.

### Blatt `.ich-blatt` — Abstand statt Kasten
Für Seiten, die man **ansieht** statt bedient. Kein Grund, kein Rahmen,
keine Füllung: nur ein Abschnitt mit `margin-bottom` und einer
Überschriftenzeile `.ich-kopf`. Trennlinien nur zwischen Zeilen
innerhalb eines Blatts.

`.card` bleibt für alles, wo etwas **getan** wird — Formulare, Listen
mit Aktionen, alles mit einem Knopf darin. Faustregel: brauchst du einen
Rahmen, damit klar ist, wo der Klickbereich aufhört? Dann `.card`.
Liest man nur? Dann `.ich-blatt`.

### Prüfe jede `var(--…)`, bevor du den Testlauf startest
Eine undefinierte CSS-Variable erzeugt **keine Fehlermeldung**. Die
Eigenschaft wird ungültig, das Element sieht eben anders aus, und kein
Durchlauf meldet etwas. Am 17.8. wären so die Kalenderpunkte unsichtbar
geworden (`--s5` gibt es nicht), am 18.8. hätte es fünf weitere
getroffen (`--r-8`, `--r-12`, `--s14`, `--lh-locker`, `--ls-weit`).

Die Leitern heißen **nicht** nach ihrem Pixelwert:

```
Rundung    --r-xs 8 · --r-sm 11 · --r-md 14 · --r-lg 18 · --r-pille · --r-rund
Abstand    --s1 2 4 6 8 10 12 16 20 24 32 40 48 56 72   (kein --s5, kein --s14)
Zeilen     --lh-1 · --lh-eng · --lh · --lh-weit
Laufweite  --ls-eng · --ls-s · --ls-m · --ls-l
```

Nach jedem neuen CSS-Block einmal gegenlesen, welche es wirklich gibt.

### Herkunftsmarke `.ich-quelle`
Eine kleine Plakette am Ende einer Zeile, die sagt, **woher** die Zeile
kommt. Gebaut für „Mein Bereich", wo Betriebsdaten und Privates
untereinanderstehen: ohne sie steht „Zahnarzt" neben „Dienst Hürth" und
niemand weiß mehr, was die Verwaltung sieht.

```
.ich-quelle          neutral   Dienst, Aufgabe
.ich-quelle.privat   grün      nur du
.ich-quelle.warn     gelb      läuft bald ab
.ich-quelle.bad      rot       abgelaufen
```

**Regel dahinter, und die gilt überall:** Mischt eine Liste Daten aus
mehreren Quellen, muss die Quelle an der Zeile stehen — nicht in der
Überschrift darüber. Überschriften scrollen weg.

### Statusfarben sind Flächen, keine Schriftfarben
`--f-*` und `--k-*` sind halbdurchsichtige Füllungen und Kanten. Als
`color:` gesetzt ergeben sie halbdurchsichtige Schrift auf
halbdurchsichtigem Grund — messbar unlesbar. Für Schrift gibt es
`--ok-tx`, `--warm-tx`, `--danger-tx`, und die sind in **beiden** Modi
gesetzt.

```
richtig   background:var(--f-warn); color:var(--warm-tx)
falsch    background:var(--k-warn); color:var(--f-warn-stark)
```

---

## 7. Rollen in der Oberfläche

| Attribut | Sichtbar für |
|---|---|
| `data-chef-only="1"` | nur Chef |
| `data-manage-only="1"` | Chef und Leiter |
| (nichts) | alle |

Beides wird in `applyRoleVisibility()` gesetzt. **Verlass dich darauf nie
allein** – die Sicherheitsregeln müssen dasselbe sagen.

---

## 8. Sprache

- **Deutsch, ohne Fachwörter.** „Fehlt" statt „Differenz", „Wo etwas los
  ist" statt „Priorisierung".
- **Du**, nicht Sie.
- **Knöpfe sagen, was passiert:** „Defekt melden", nicht „Absenden".
- **Meldungen nennen das Ding beim Namen:** „EMS-Gerät 2 ist defekt", nicht
  „1 Gerät defekt".
- **Zahlen vor Adjektiven:** „3 Artikel fehlen", nicht „einige Artikel
  fehlen".
- Auch **Kommentare im Code sind auf Deutsch** und erklären das *Warum*,
  nicht das *Was*.

---

## 9. Prüfliste für neue Oberfläche

Vor dem Einchecken durchgehen:

- [ ] Beantwortet die Seite ihre Frage im ersten Bildschirm?
- [ ] Steht die Liste vor dem Formular?
- [ ] Ist jedes Fingerziel ≥ 44 Pixel hoch und beschriftet?
- [ ] Nur Marken benutzt, keine festen Werte? Das gilt für **alle** sechs
      Leitern: Farbe, Rundung, Abstand, Schrift, Höhe, Status.
      `node tests/test-gestaltung.js` schlägt an, wenn eine dazukommt.
- [ ] Funktioniert es in hell **und** dunkel?
- [ ] Sagt der leere Zustand Grund und Ausweg — und trägt er sein eigenes
      Symbol?
- [ ] Steht die Begründung **hinter** einer Nachfrage statt davor?
      Standardmäßig kurz.
- [ ] Hat alles Löschende eine Rückfrage oder Rückgängig?
- [ ] Sind die Geräteränder (`--sa*`) berücksichtigt?
- [ ] Bei 390 Pixeln Breite gemessen – nicht geschätzt?
- [ ] Gibt es die Funktion woanders schon? Dann dort verlinken, nicht
      nachbauen.
- [ ] Erscheint Suchen/Filtern erst, wenn es etwas zu suchen gibt?
      Bei vier Einträgen sind es zwei Bedienelemente ohne Aufgabe. Die
      Schwelle gehört mitgeprüft — sonst weiß niemand, ob sie stimmt oder
      ob die Zeile einfach immer da ist.
- [ ] Bewegt sich nichts, was bei jedem Tastendruck neu gezeichnet wird?
      (siehe Abschnitt 5)
- [ ] Überlebt halb Getipptes ein Neuzeichnen? Ein Horcher feuert auch,
      **während** jemand schreibt — und ein verlorener Satz meldet sich
      nicht.
- [ ] Wird beim Ändern `update()` benutzt, nicht `set()`? `set()` löscht
      jedes Feld mit, das im Formular gerade nicht steht.
- [ ] Werden Zustand und Suchbegriff beim Abmelden geleert? Auf einem
      geteilten Gerät steht sonst der Name einer Kundin im Suchfeld,
      deren Eintrag dem vorigen Konto gehört.
- [ ] Geht ein Hinweis, den man **abstellen** kann, auch wirklich aus?
      Ein Ungelesen-Punkt, der für eine Rolle nie verschwinden kann, ist
      kein Hinweis mehr — man sieht ihn nach zwei Tagen nicht mehr, und
      dann auch nicht an dem Tag, an dem er stimmt. (So stand jahrelang
      ein Punkt an jedem Aushang der Verwaltung.)
- [ ] Wird die **lokale** Liste beim Schreiben mitgezogen? Ein Klick, der
      erst wirkt, wenn der Horcher die Runde zurückbringt, sieht aus wie
      einer, der nichts getan hat — und wird ein zweites Mal gedrückt.
- [ ] Steht das Ergebnis dort, wo es gebraucht wird? Eine Übergabe hinter
      zwei Klicks und einer Studio-Auswahl liest niemand, der gerade zur
      Schicht kommt. Das war ihr einziger Zweck.
