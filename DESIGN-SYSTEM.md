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

**Größen** (aus dem Code):

| Element | Größe |
|---|---|
| Seitentitel `h2` | `clamp(1.4rem, 3.5vw, 1.9rem)` |
| Kartentitel `h3` | ~1,05 rem |
| Fließtext | 0,92–0,97 rem |
| Nebentext | 0,84–0,90 rem |
| Metadaten | 0,72–0,78 rem |
| Marken/Abzeichen | 0,62–0,74 rem, Großbuchstaben, `letter-spacing:.5px` |

Die Schriftgröße ist über die Einstellungen in drei Stufen skalierbar –
neue Größen deshalb **relativ** (`rem`), nie in Pixeln.

---

## 3. Maße

| Marke | Wert | Wofür |
|---|---|---|
| `--r-xs` | `10px` | Eingabefelder, kleine Knöpfe |
| `--r-sm` | `14px` | Listenzeilen, Dokumente |
| `--r-md` | `18px` | Umfragen, Geräte, Menüs |
| `--radius` | `22px` | Karten |
| `--radius-lg` | `30px` | große Flächen |
| — | `999px` | Chips, Marken, runde Knöpfe |

> `--r-md` und `--r-sm` wurden an zehn Stellen benutzt, ohne je definiert
> zu sein. Eine undefinierte Variable macht die **ganze** Angabe ungültig
> – Umfragen, Geräteliste, Anhang-Menü und Aufgaben-Vorlagen standen
> deshalb mit rechten Winkeln da, während alles daneben rund war.
> Niemandem aufgefallen, weil nichts kaputt aussah, nur anders.

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

**Abstände:** 6 · 8 · 10 · 14 · 18 · 22 px. Keine Zwischenwerte erfinden.

**Dichte:** rund 15 % enger als in den ersten Fassungen (Karten
`13–19px` statt `16–24px`, Abstand zwischen Karten 12 statt 16). Auf einem
390er-Handy passt dadurch etwa eine Karte mehr aufs Bild. **Die 44 Pixel
für den Finger sind davon ausgenommen** – enger wird das Auge, nicht die
Trefferfläche. Wo beides kollidiert, gewinnt der Finger über die
unsichtbare `::after`-Fläche.

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

Ausnahme: Symbole **innerhalb** einer Zeile, die selbst anklickbar ist
(die Kamera in der Aufgaben-Fußzeile). Dort ist die ganze Zeile das Ziel.

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

### Leerer Bereich `emptyHTML(titel, text)`
Muss **den Grund und den Ausweg** nennen. Nicht „Keine Aufgaben", sondern
„Keine dir zugewiesenen Aufgaben – es gibt 4, tippe auf ‚Alle'".

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
- [ ] Nur Farbvariablen benutzt, keine festen Werte?
- [ ] Funktioniert es in hell **und** dunkel?
- [ ] Sagt der leere Zustand Grund und Ausweg?
- [ ] Hat alles Löschende eine Rückfrage oder Rückgängig?
- [ ] Sind die Geräteränder (`--sa*`) berücksichtigt?
- [ ] Bei 390 Pixeln Breite gemessen – nicht geschätzt?
- [ ] Gibt es die Funktion woanders schon? Dann dort verlinken, nicht
      nachbauen.
