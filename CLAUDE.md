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
320 / 390 / 430 / 820 px, mindestens 44 × 44 px und im Bild. Gemessen,
nicht angesehen.

## Mergen

> „Du kannst immer selber mergen statt auf mich zu warten."

**Ich merge meine eigenen PRs selbst**, sobald CI grün ist, kein
Merge-Konflikt besteht und keine offenen Review-Kommentare da sind.
Nicht auf eine Freigabe warten. Danach den Zweig wieder auf `main`
setzen und prüfen, ob die Auslieferung durch ist.

**Auf der Demo direkt mergen** — andere benutzen die App parallel.

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
eigene App.

## Und danach

`docs/FORTSCHRITT.md` weiterschreiben: was gebaut wurde, was dabei
gefunden wurde und **warum** es so entschieden ist. Die Begründung ist
der Teil, der in einem halben Jahr zählt.
