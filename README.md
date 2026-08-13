# StudioChat

Internes Team-Portal für EMS-Studios: Chat, Aufgaben, Putzplan, Material,
Geräte, Dokumente, Schichten und Abwesenheiten. Läuft als installierbare
Web-App (PWA) auf dem Handy, ohne App-Store.

Mehrere Firmen teilen sich eine Datenbank. Jede sieht ausschließlich ihre
eigenen Daten; getrennt wird über den Pfad `firmen/<kennung>/…` und über die
Sicherheitsregeln.

| | |
|---|---|
| Betrieb | https://formenchat.web.app |
| Probelauf | https://formenchat-probe.web.app |
| Firebase-Projekt | `formenchat` (Blaze), Region `europe-west1` |

---

## Womit man anfängt

```bash
# Webserver im Projektordner starten — nicht in einem Unterordner,
# sonst laufen alle Tests gegen 404
python3 -m http.server 8765

# App öffnen
open http://127.0.0.1:8765/index.html
```

Die App braucht kein Build, keinen Bundler und keine Installation. Sie ist
eine HTML-Datei, die drei weitere Dateien lädt.

Alle Durchläufe auf einmal:

```bash
bash tests/alle.sh              # Oberfläche, 57 Durchläufe im Browser
cd tests/rules && npm test      # Sicherheitsregeln und Cloud Functions im Emulator
```

---

## Wo was liegt

### Die App

| Datei | Was drin steht |
|---|---|
| `index.html` | Die gesamte App: Aufbau, Aussehen und Ablauf in einer Datei |
| `konfig.js` | Alles, was sich von Kunde zu Kunde unterscheidet. Die einzige Datei, die beim Einrichten angefasst wird |
| `sw.js` | Service Worker: macht die App installierbar und nimmt Push-Nachrichten an |
| `manifest.json` | Name, Symbol und Startverhalten der installierten App |
| `icon.png`, `icon.svg` | Das Symbol |

### Der Server

| Pfad | Was drin steht |
|---|---|
| `functions/index.js` | Cloud Functions: Zeitpläne, E-Mail-Versand, Kontenverwaltung, Sicherung |
| `firestore.rules` | Wer welche Daten lesen und schreiben darf. Die einzige echte Grenze der App |
| `storage.rules` | Zugriff auf den Speicher. Dort liegt der nächtliche Vollexport |
| `firebase.json` | Hosting, Zwischenspeicher-Regeln, Emulator-Ports |

### Alles andere

| Pfad | Was drin steht |
|---|---|
| `tests/` | 57 Durchläufe durch die Oberfläche mit Playwright |
| `tests/rules/` | Regeltests und Cloud Functions gegen den Firestore-Emulator |
| `tools/` | Werkzeuge, die von Hand laufen: Umzug, Kontenprüfung, Apps Script |
| `docs/` | Sämtliche Dokumentation, siehe unten |
| `.github/workflows/` | Ausliefern nach Firebase |

### Drei weitere Anwendungen im selben Projekt

`marketing.html`, `wachstum.html` und `werbung.html` sind eigenständige
Seiten, die dasselbe Firebase-Projekt benutzen, aber nicht Teil von
StudioChat sind. Sie liegen im Auslieferungsverzeichnis, weil ihre Adressen
darauf zeigen.

| Datei | Was es ist | Anmeldung nötig |
|---|---|---|
| `marketing.html` | Internes Marketing-Werkzeug | ja |
| `wachstum.html` | Termine und Termin-E-Mails (Gegenstück zu `sendApptMail` in den Cloud Functions) | ja |
| `werbung.html` | Öffentliche Werbeseite eines Studios | nein |

---

## Warum es so gebaut ist

**Eine Datei statt eines Projekts mit Bundler.** Kein Build heißt: kein
Schritt, der zwischen „geändert" und „ausgeliefert" scheitern kann, und ein
Rückweg, der aus einer einzigen Datei besteht. Der Preis ist eine Datei mit
über 15.000 Zeilen — dagegen hilft die Gliederung im Kopf jeder Datei, nicht
das Aufteilen in zwanzig Dateien, die man alle offen haben muss.

**Firebase compat-SDK statt der modularen Fassung.** Die modulare Fassung
setzt einen Bundler voraus. Siehe oben.

**Kein Framework.** Die App rendert über Zeichenketten und `innerHTML`. Bei
zwölf Ansichten und einem Entwickler ist das weniger Aufwand als ein
Framework, das man mitversorgen muss.

**Datenpfade mit Firmenkennung.** `firmen/<kennung>/…` statt flacher
Sammlungen. `users` und `pushTokens` liegen bewusst weiterhin oben: an einem
Konto hängt der Login, nicht die Firma.

**Deutsch, durchgehend.** Oberfläche, Dokumentation, Namen im Code und
Commit-Nachrichten. Wer die App bedient, bedient sie auf Deutsch; wer den
Code liest, soll dieselben Wörter finden.

---

## Ausliefern

Ein Push auf `main` löst den Workflow aus, sobald sich eine ausgelieferte
Datei geändert hat.

| Job | Rollt aus | Hängt an |
|---|---|---|
| `regeltest` | — | — |
| `rules` | `firestore.rules`, `storage.rules` | `regeltest` |
| `deploy` | Cloud Functions | `regeltest` |
| `hosting` | die App | nichts |

`hosting` läuft absichtlich unabhängig: die App ist das eine, was man notfalls
schnell zurücknehmen können muss. Folge davon ist, dass die App vor den
Regeln draußen sein kann.

Die `paths`-Liste im Workflow ist die Liste der ausgelieferten Dateien. Fehlt
dort eine, passiert bei einer Änderung schlicht nichts — ohne Fehlermeldung.
`tests/test-ausliefern.js` vergleicht die Liste deshalb mit der `ignore`-Liste
aus `firebase.json`.

---

## Konventionen

**Namen sind deutsch und ausgeschrieben.** `abwesenheitLaden()`, nicht
`loadAbsence()` und nicht `absLd()`.

**Kommentare beantworten „warum", nicht „was".** Was der Code tut, steht im
Code. In den Kommentar gehört, was man beim Ändern wissen muss und aus dem
Code nicht sieht: eine Bedingung aus den Sicherheitsregeln, eine Reihenfolge,
die nicht vertauscht werden darf, ein naheliegender Weg, der nicht
funktioniert. Kein Verlauf, keine Daten, keine Begründungen in Aufsatzform.

**Jeder Fund bekommt einen Durchlauf.** Von Hand weggeräumt heißt: kommt
wieder. Jeder Test prüft beide Richtungen — dass der Fehler weg ist *und*
dass die richtige Seite noch funktioniert. Ein Test, der nur eine Richtung
kennt, wäre auch dann grün, wenn die Funktion ganz fehlt.

**Gestaltungsgrößen kommen aus `:root`, nie aus der Zeile.** Farben, Abstände,
Rundungen und Kurven stehen als Variablen ganz oben im `<style>`-Block.

| | Leiter |
|---|---|
| Rundung | `--r-xs` 8 · `--r-sm` 11 · `--r-md` 14 · `--r-lg` 18 · `--radius` 22 · `--radius-lg` 30 · `--r-pille` · `--r-rund` |
| Abstand | `--s1 --s2 --s4 --s6 --s8 --s10 --s12 --s16 --s20 --s24 --s32 --s40 --s48 --s56 --s72` |

Eine feste Zahl mitten im Stylesheet ist der Anfang der nächsten Sammlung aus
zwölf Werten, die dasselbe meinen. Vor dieser Regel gab es 52 verschiedene
Abstände zwischen 1 und 72 px, sieben davon einen Pixel auseinander.

**Symbole kommen aus `IKONEN`, nicht aus der Emoji-Tastatur.** `ikon('name')`
gibt ein SVG in `currentColor` zurück; es erbt Farbe und Größe von seinem
Knopf. Ein Emoji kann das nicht — es bringt eigene Farben mit, ignoriert
Hell und Dunkel und sieht auf jedem Gerät anders aus. Emoji bleiben nur, wo
sie Inhalt sind: Chat-Reaktionen, Avatare, Geburtstagsgruß.

**Dieselbe Eigenschaft nicht zweimal am selben Selektor.** Der `<style>`-Block
ist durch Anhängen gewachsen; steht `transition` einmal bei `.btn` oben und
noch einmal im Bewegungsabschnitt unten, gewinnt die spätere und an der
früheren dreht man vergeblich. Ein Selektor darf mehrfach vorkommen
(Grundregel oben, Zustand unten) — dieselbe Eigenschaft nicht.

Alles drei prüft `tests/test-gestaltung.js`, die `@keyframes`
`tests/test-bewegung-doppelt.js`.

---

## Dokumentation

Alles unter `docs/`.

**Was die App kann**
`HANDBUCH.md` Bedienung · `SPEZIFIKATION.md` Funktionsumfang ·
`DESIGN-SYSTEM.md` Farben, Abstände, Bausteine · `ROADMAP.md` ·
`IDEEN.md`

**Sicherheit**
`SICHERHEIT.md` was geprüft wurde, was gefunden wurde, was offen ist

**Betrieb**
`OFFEN.md` was noch aussteht · `DEIN-TEIL.md` Handgriffe für den Betreiber ·
`DEPLOY.md` · `MAIL-SETUP.md` E-Mail-Absender · `RECHT.md` Impressum und
Datenschutz

**Architektur und Entscheidungen**
`MANDANT-PLAN.md` mehrere Firmen in einer Datenbank · `ABO-PLAN.md` ·
`KI-PLAN.md` · `PROBELAUF-EINRICHTEN.md` · `PROBELAUF-DATEN.md` ·
`2E-PRUEFEN.md`

**Verlauf**
`FORTSCHRITT.md` jede Sitzung mit Fund, Reparatur und Beleg

**Vertrieb**
`VERKAUF.md` · `PITCH.md`
