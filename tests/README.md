# Tests

Automatische Durchläufe durch die App — ohne echtes Firebase, ohne echte Daten.

Bisher lagen diese Dateien nur in einem temporären Ordner und wären beim
nächsten Neustart verschwunden. Jetzt liegen sie im Projekt und lassen sich
jederzeit wieder ausführen.

---

## Wozu das gut ist

Die App ist eine einzige HTML-Datei mit über 8.000 Zeilen. Eine kleine Änderung
an einer Stelle kann etwas an ganz anderer Stelle kaputtmachen, ohne dass es
auffällt. Diese Durchläufe klicken die App nach jeder Änderung einmal komplett
durch und melden sich, wenn etwas nicht mehr stimmt.

Sie ersetzen **kein** Ausprobieren auf einem echten Gerät. Was sie nicht können:
Berührungen (also das Wischen zum Abhaken), echte Push-Nachrichten und alles,
was tatsächlich in die Datenbank schreibt.

---

## Ausführen

Nötig sind Node und Playwright mit Chromium.

```bash
# einfachen Webserver im Projektordner starten
cd /Pfad/zum/Projekt
python3 -m http.server 8765 &

# einen Durchlauf starten
cd tests
node test-mitarbeiter.js
```

Läuft Chromium woanders, den Pfad mitgeben:

```bash
CHROME=/Pfad/zu/chrome node test-mitarbeiter.js
```

Liegt Playwright global statt im Projektordner, muss Node wissen wo:

```bash
export NODE_PATH=$(npm root -g)
```

Ohne das bricht der Durchlauf mit `Cannot find module 'playwright'` ab — und
weil dann gar keine Zeile `Fehler:` erscheint, sieht die Schleife unten so
aus, als wäre alles in Ordnung. Deshalb meldet sie einen Abbruch ausdrücklich:

```bash
for f in test-*.js; do
  aus=$(node "$f" 2>&1)
  echo "$f -> $(echo "$aus" | grep -i '^Fehler' || echo '!! ABBRUCH')"
done
```

Am Ende jedes Durchlaufs steht `Fehler: keine` — oder es steht dort, was
schiefging.

---

## Die drei Rollen

Die Datei `stub-*.js` ersetzt Firebase durch feste Testdaten und meldet eine
bestimmte Person an. So lässt sich prüfen, dass jede Rolle genau das sieht,
was sie sehen soll.

| Datei | angemeldet als | Studios |
|---|---|---|
| `stub-chef.js` | Test Chef (Rolle *chef*) | alle 14 |
| `stub-leiter.js` | Test Leiter (Rolle *leiter*) | Hürth, Brühl |
| `stub-mitarbeiter.js` | Lisa Wagner (Rolle *mitarbeiter*) | nur Hürth |

---

## Was die Durchläufe abdecken

| Datei | prüft |
|---|---|
| `test-mitarbeiter.js` | die ganze App aus Sicht eines Mitarbeiters — die grösste Nutzergruppe |
| `test-leiter.js` | Studio-Leiter: sieht nur seine Studios |
| `test-final.js` | jede Ansicht öffnet sich, Startseite stimmt |
| `test-chef.js` | Chef-Reiter, Auswertung, Teilschritte, Rückgängig |
| `test-chat.js` | Antworten, Reaktionen, Erwähnungen, Bearbeiten |
| `test-all.js` | Aufgaben, Sortierung, Suche, Direktnachrichten |
| `test-voice.js` | Sprachnachrichten mit simuliertem Mikrofon |
| `test-ui.js` | schrumpfender Kopf, klebende Filter, Chat-Werkzeuge |
| `test-trash.js` | Papierkorb |
| `test-block3.js` | Rückgängig, Drucken, Aufgaben-Vorlagen |
| `test-block5.js` | Weiterleiten, Tastenkürzel, Mein Dienst |
| `test-block6.js` | Verbrauchs-Vorhersage, Urlaubsanträge |
| `test-block7.js` | Melde-Einstellungen |
| `test-block8.js` | Anheften, Dokument-Kategorien, erweiterte Suche |
| `test-bericht.js` | Testbericht-Knopf |
| `test-geraete.js` | Geräte- und Schadensbuch, für Chef und Mitarbeiter |
| `test-umfrage.js` | Umfragen im Chat, Anhängen-Menü, Breite des Schreibfelds |
| `test-putzplan.js` | erledigte Einmal-Aufgaben verschwinden nach einem Tag |
| `test-tausch.js` | Schichttausch in drei Schritten, Nachweise – für alle drei Rollen |

---

## Vor jedem Push

Zusätzlich zu den Durchläufen lohnen sich zwei schnelle Prüfungen der Datei
selbst — sie finden Tippfehler, bevor der Browser sie findet:

```bash
# 1) Ist das JavaScript in index.html syntaktisch in Ordnung?
python3 - <<'EOF'
import io, re, subprocess
s = io.open('index.html', encoding='utf-8').read()
b = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', s, re.S)
io.open('/tmp/pruef.js', 'w', encoding='utf-8').write(b[0])
r = subprocess.run(['node', '--check', '/tmp/pruef.js'], capture_output=True, text=True)
print('JS:', 'OK' if r.returncode == 0 else r.stderr[:400])
EOF

# 2) Sind alle HTML-Tags geschlossen?
python3 - <<'EOF'
from html.parser import HTMLParser
import io
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class P(HTMLParser):
    def __init__(s): super().__init__(convert_charrefs=True); s.st=[]; s.err=[]
    def handle_starttag(s,t,a):
        if t not in VOID: s.st.append((t, s.getpos()))
    def handle_endtag(s,t):
        if t in VOID: return
        if not s.st or s.st[-1][0] != t: s.err.append((t, s.getpos())); return
        s.st.pop()
p = P(); p.feed(io.open('index.html', encoding='utf-8').read())
print('HTML:', p.err or 'ok', '| nicht geschlossen:', p.st or 'keine')
EOF
```

Und für die Cloud Functions:

```bash
node --check functions/index.js
```
