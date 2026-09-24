# Hausregeln für Claude in diesem Projekt

Diese Datei steht hier, damit eine neue Sitzung nicht bei null anfängt.
Was hier steht, kommt aus dem Betrieb — nicht aus einer Vorlage.

## Sprache

**Alles auf Deutsch.** Oberfläche, Kommentare im Code, Commit-Texte,
Pull-Request-Beschreibungen, Unterlagen. Ohne Ausnahme.

## Was nicht behauptet wird

> „Wenn du etwas nicht testen kannst: sage es. Erfinde keine Ergebnisse."

Das ist die wichtigste Zeile dieser Datei. Eine Messung, die nicht
gelaufen ist, wird nicht berichtet; eine Zahl, die geschätzt ist, heisst
geschätzt. Ein Häkchen „habe ich gesehen" ist eine **Behauptung**, keine
Messung, und wird auch nicht als eine verkauft.

Dasselbe gilt in der App selbst: was fehlt, wird benannt. Ein Video, das
es noch nicht gibt, bekommt einen Platzhalter mit „Video folgt" und
keinen leeren Rahmen.

## Knöpfe

> „bitte achte auf sowas bei ALLEN knöpfen IMMER bevor es neue gibt …
> das ist sehr wichtig fürs design"

**Vor jeder Änderung an Knöpfen den Skill `knoepfe` lesen**
(`.claude/skills/knoepfe/`). Danach nachmessen: jedes Bedienelement bei
320 / 390 / 430 / 820 px **und am Rechner (1280 / 1440 / 1920 px)**,
mindestens 44 × 44 px und im Bild. Gemessen, nicht angesehen.

Die sichtbare Grösse reicht nicht: gemessen wird die **Trefferfläche**
per Hit-Test (`elementFromPoint`), in der Dichte „normal" **und**
„kompakt". Ein unsichtbar vergrösserter Knopf kann vom Scroll-Bereich
abgeschnitten werden — „alle 5 ›" traf so nur 35 px hoch.

## Der PC ist das Hauptgerät

> „bitte leg genau so viel Fokus auf die PC-Nutzung wie auf die
> Handy-Nutzung … obwohl das das Hauptgerät ist, welches wir aktuell
> nutzen" (24.9.2026)

- **Jede Änderung wird auch am Rechner angesehen und gemessen**: 1280 ×
  800, 1440 × 900 und 1920 × 1080, zusätzlich zu 320 / 390 / 430 / 820.
- **„Passt aufs Handy" ist nicht fertig.** Eine Ansicht, die am Rechner
  eine Spalte über 1.200 px zieht, ist dort genauso ungestaltet wie ein
  abgeschnittener Knopf auf dem Handy. Breite nutzen: zwei Spalten,
  Liste + Detail, Tastenkürzel, Hover.
- Im Bericht stehen die Zahlen für beide Geräte, nicht nur fürs Handy.

## Mergen

> „Du kannst immer selber mergen statt auf mich zu warten."

**Ich merge meine eigenen PRs selbst**, sobald CI grün ist, kein
Merge-Konflikt besteht und keine offenen Review-Kommentare da sind.
Nicht auf eine Freigabe warten. Danach den Zweig wieder auf `main`
setzen und prüfen, ob die Auslieferung durch ist.

**Auf der Demo direkt mergen** — andere benutzen die App parallel.

## Wie gearbeitet wird

> „Gib mir erstmal einen Plan und paar Rückfragen und dann bauen wir
> das Grundgerüst."

- **Ein neuer Bereich:** erst Plan und Rückfragen, dann das
  Grundgerüst, dann ausbauen.
- **„Sag du mir, was du besser findest":** eine Empfehlung mit
  Begründung geben — nicht eine Auswahlliste zurückschieben.
- **Andere benutzen die App parallel.** Eine Änderung, die echte Konten
  treffen könnte und sich hier nicht prüfen lässt (z. B. eine schärfere
  Leseregel), bekommt einen Übergang und ein Werkzeug, das zeigt, wen
  sie träfe.
- **Einen Test lockern, um grün zu werden, gibt es nicht.** Nur wenn der
  Wunsch aus dem Betrieb es deckt — dann mit dem Zitat im Test und offen
  im Bericht.

## Wie berichtet wird

> „schick mir im Anschluss immer nur eine Nachricht, wenn es nötig ist …
> nur am Ende eine kleine Zusammenfassung"

Keine Zwischenstände, kein „ich fange jetzt an". Eine Nachricht am Ende.

## Sicherheit — die drei, die wirklich weh tun

1. **Das Repository ist ÖFFENTLICH.** Kein Token, kein Schlüssel, kein
   Passwort kommt hinein. Apps-Script-Token in die Script Properties,
   Funktions-Geheimnisse über GitHub Secrets in `functions/.env`.
2. **Für `formenchat` (Betrieb) niemals nach einem Dienstkonto-Schlüssel
   fragen** und keine Produktions-Zugangsdaten anfassen. Die Werkzeuge
   unter `tools/` verweigern nicht-`-probe`-Projekte mit Absicht.
3. **Im Speicher-Eimer liegt unter `sicherung/` der nächtliche
   Vollexport der Datenbank** — jeder Chatverlauf, jede
   Direktnachricht, das ganze Team mit Mailadressen. Dort kommt nichts
   anderes hinein, und es gibt **nie** eine Regel
   `allow read: if request.auth != null`: registrieren kann sich in
   dieser App jeder selbst.

### Weitere Grenzen, die nicht verhandelt werden

- **Der Betreiber (Admin) sieht nur Firmen-Stammdaten** — es gibt
  bewusst keinen „als Chef ansehen"-Knopf.
- **Passwörter aus `firmaAnlegen`** werden genau einmal zurückgegeben
  und nirgends gespeichert.
- **Die Firmenkennung in der Adresse ist keine Sicherheitsgrenze.** Die
  Grenze sind die Regeln.
- **Der Abo-Zustand** liegt unter `firmen/<k>/abo/aktuell`, nicht am
  öffentlich lesbaren Firmendokument.
- **Der Export enthält nie** `zeitPins`, `terminalCodes`, `pushTokens`,
  `privat` oder Felder namens `hash`, `geheim`, `secret`
  (`tests/test-sicherung-inhalt.js`).
- **Studiogrenze beim Lesen:** Schichten, Abwesenheiten, Übergaben und
  Studio-Chats per Regel; Aufgaben, Putzplan, Geräte und Material
  bewusst betriebsweit. Stand und offene Punkte: `docs/BEKANNTE-PROBLEME.md`, P-01.

## Wie es aussehen soll — aus dem Betrieb

Jede Zeile hier ist ein Wunsch, der schon einmal ausgesprochen wurde.
Wer das Aussehen ändert, prüft gegen diese Liste.

| Wunsch | was daraus folgt |
|---|---|
| „am besten steht alles auf einer Seite ohne dass man scrollen muss" | Die Startseite passt auf einen Bildschirm. Was nicht passt, verschwindet **nie** stumm — es bleibt als Knopf unter „Ausserdem" |
| „es wirkt mit den grossen Symbolen immer noch voll überwältigend" | Wenige, grosse Dinge. In Listen das Zeichen ohne getönte Kachel |
| „die Grundstruktur … um Welten leichter zu navigieren, unabhängig von Suchfeldern" | Jedes Ziel in zwei Tipps über „Alles" |
| „die Farben mit den Übergängen gefallen mir … ein wenig mehr Farbe und Leben" | Farbe, die von einer Kante ausgeht und ausläuft; die Farbe folgt dem Bereich |
| „mehr Kontrast und viel mehr Tiefe … alles was anklickbar ist soll sich auch wie ein richtiger Knopf anfühlen" | Haarlinie + Kernschatten + Umgebungsschatten; gedrückt gibt nach |
| „richtig flüssig … im Idealfall 120 fps … schärfer … kontrastreich" | siehe unten |
| „das mit dem Firmencode muss nicht so penetrant sein" | Firmencode sichtbar, aber leise |

**Flüssig heisst konkret** (gemessen am 23.9.2026, CPU ÷4):
- keine Übergänge auf `width`, `height`, `padding`, `font-size` — Bewegung
  per `transform` (FLIP);
- keine Endlos-Animationen ohne Grund; einmalige Einblendungen mit
  `fill-mode: backwards`, nicht `both`;
- angemeldete, **vererbte** Farben (`@property`) nicht am `<body>`
  animieren — jedes Bild rechnet sonst die ganze Seite neu;
- im Klick nichts vermessen (`offsetLeft`, `getComputedStyle`) — im
  nächsten Bild bündeln, erst lesen, dann schreiben.

**Statusfarben nur für Status.** Rot, Bernstein und Grün heissen etwas;
eine Fläche in diesen Farben, die nichts meldet, macht sie bedeutungslos.

**Kontrast ≥ 4,5 : 1**, nachgemessen an echten Bildpunkten — das
Rechenmodell allein ist bei Verläufen zu pessimistisch.

## Zwei Dinge, die schon oft genug passiert sind

**`firestore.rules` gibt es ZWEIMAL** — flach und unter
`firmen/<kennung>/`. Eine Sammlung, die nur auf einem der beiden Pfade
steht, ist die Lücke, die in diesem Projekt schon fünfmal zugeschlagen
hat. Jede neue Sammlung kommt in beide, und der Regeltest prüft beide.

**Die Attrappen unter `tests/stub-*.js` haben ZWEI Einstiege** — `get()`
und `onSnapshot`. Eine Sammlung, die nur eine Seite kennt, macht jeden
Durchlauf darüber grün und aussagelos.

## Nach jeder Änderung an einem Inline-Skript

`node tools/csp.js --setzen` — sonst blockiert die Sicherheitsregel die
eigene App. **Auch nach einer reinen Kommentaränderung** im Skriptblock:
die Prüfsumme kennt keinen Unterschied zwischen Code und Kommentar.

## Fallen im Werkzeug — schon einmal hineingetappt

- Während ein Gesamtdurchlauf läuft, **nichts an `index.html` ändern**.
- **Nie `pkill -f` / `pgrep -f` mit einem Muster, das in der eigenen
  Befehlszeile steht** — das beendet die eigene Shell (Exit 144).
  Prozesse nach Nummer beenden.
- Python-Skripte mit deutschen Anführungszeichen („…") als **Datei**
  schreiben, nicht als Heredoc in `"…"`-Zeichenketten.
- `merge_pull_request` braucht die **volle** 40-stellige SHA.
- Live prüfen über `https://formenchat.web.app/`, nicht über
  `/index.html` — das leitet weiter.
- Das echte Firebase-SDK lädt im Test-Browser dieser Umgebung nicht
  (Proxy-Zertifikat). Der Anmeldeweg ist hier **nicht** testbar — sagen.
- Chromium ohne Bildschirm taktet mit 60 Hz: 120 fps lassen sich nicht
  direkt beobachten. Gemessen wird die Arbeit je Bild (Grenze 8,3 ms).

## Und danach

`docs/FORTSCHRITT.md` weiterschreiben: was gebaut wurde, was dabei
gefunden wurde und **warum** es so entschieden ist. Die Begründung ist
der Teil, der in einem halben Jahr zählt.
