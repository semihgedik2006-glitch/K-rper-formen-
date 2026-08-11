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
| `test-oberflaeche.js` | aufklappbare Abschnitte, Sortierung, eigene Tastenkürzel |
| `test-navigation.js` | Zurück-Geste, Gruppen, Verwaltungs-Übersicht |
| `test-sicherung.js` | Stand der Nachtsicherung wird sichtbar gemeldet |
| `test-beitritt.js` | Firmencode und Freigabe in der Oberfläche |
| `test-nachladen.js` | Nachweise, Papierkorb und Sicherungen hängen nicht am App-Start |
| `test-dialoge.js` | Fenster: Fokus rein, Tabulator drin, Escape, Fokus zurück |
| `test-marker.js` | die vier gleitenden Marker sitzen und gleiten |
| `test-startzahlen.js` | Putzplan zählt sofort und über alle Studios |
| `test-startlesen.js` | Infos und schwarzes Brett stehen auf der Startseite |
| `test-standorte.js` | Studios aus der Datenbank, Kennungen bleiben stabil |
| `test-passwort.js` | Passwort anzeigen, Cursor, kein Klartext nach dem Wechsel |
| `test-recht.js` | Impressum und Datenschutz ohne Login, Warnung bei Lücken |
| `test-firma-link.js` | Firmenkennung aus dem Link, Unbrauchbares wird abgelehnt |
| `test-probe-schalter.js` | der Probelauf-Schalter greift nur auf der Probe-Adresse |
| `test-funktionen-pfade.js` | keine Cloud Function greift noch flach auf Firmendaten zu |
| `test-ausliefern.js` | jede gehostete Datei löst auch wirklich einen Deploy aus |
| `test-admin-firmen.js` | Betreiber-Bereich: Studiozahl, Firmen-Archiv, Abo und Gratis-Abo |
| `test-firma-stillgelegt.js` | gesperrte/gelöschte Firma: klare Meldung statt leerer App |
| `test-abo-stufe.js` | Abo-Stufe: ohne Abo alles offen, Basic zeigt was fehlt |
| `test-kuerzel-grund.js` | Kürzel im Putzplan, Grund an offenen Aufgaben |
| `test-sheets-kuerzel.js` | Google-Tabelle: neue Spalte „Kürzel", alte Zeilen ziehen richtig mit um |
| `test-funktionen-schalter.js` | abgeschaltete Funktionen: weg aus Leiste, Startseite, Team-Reitern und Verwaltung |
| `test-fehlerbericht.js` | Fehler im Betrieb: echte landen, Rauschen nicht, keine Endlosschleife |
| `test-sicherung-inhalt.js` | die Sicherung enthält wirklich alles Versprochene — und sagt, was nicht |

### Alle auf einmal

```bash
bash tests/alle.sh            # alle
bash tests/alle.sh chat       # nur die passenden
```

> **Nicht mit einem Einzeiler laufen lassen.** Bis August 2026 lief die
> Regression als `for f in tests/*.js; do node "$f" || echo kaputt; done`.
> 29 der Durchläufe geben aber gar keinen Exit-Code — sie schreiben
> „Fehler: …" und beenden sich mit 0. Der Einzeiler prüfte damit neun
> Durchläufe und meldete das Ergebnis für achtunddreißig. `alle.sh` kennt
> vier Fehlersignale und meldet zusätzlich jeden Durchlauf, der **gar
> nichts** ausgibt — ein stummer Test ist verdächtig, nicht gut.

### Messläufe (kein Grün/Rot, sondern Zahlen)

| Datei | misst |
|---|---|
| `audit-forensik.js` | Überlauf, Fingerziele, Kontrast, Fokus — 12 Ansichten × 3 Rollen × 11 Breiten |
| `audit-leistung.js` | Datenbankzugriffe, Speicher, Ladephase, lange Aufgaben, Bilder/s |
| `stress-echt.js` | ein App-Start bei echter Datenmenge — Lesevorgänge je Rolle und was das im Monat kostet |

`stress-echt.js` benutzt `stub-last.js` statt der kleinen Beispieldaten:
14 Studios, 57 Konten, 5.675 Dokumente. Mit `FAKTOR=5` lässt sich die
fünffache Menge durchspielen.

> **Die wichtigste Regel aus diesem Audit:** Ein Messwert ist erst dann ein
> Messwert, wenn das Messgerät geprüft wurde. Sechsmal war nicht die App
> kaputt, sondern der Prüfer — Farben ohne Alpha-Rechnung, ein Stub ohne
> Bereichsfilter, Elemente im eingeklappten Zustand gemessen. Wer hier
> etwas findet, prüft zuerst, ob er richtig misst.

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

---

## Die Durchläufe mit Emulator

Drei Prüfungen brauchen einen echten Firestore — nicht den Stub. Sie
laufen im **Emulator**, also lokal und ohne jedes Risiko:

```bash
cd tests/rules && npm install     # einmalig
npm test                          # alle drei
```

| Datei | prüft | Umfang |
|---|---|---|
| `security.test.js` | `firestore.rules`: wer darf was, und vor allem: wer darf **nichts** | 132 |
| `umzug.test.js` | `tools/umzug.js` an nachgebauten Daten — Zählung, Inhalte, Untersammlungen unter leeren Eltern | 12 |
| `funktionen.test.js` | die **Cloud Functions**, wirklich ausgeführt: erreicht jede Firma, und keine fremde | 79 |

> **Zu `funktionen.test.js`:** er lädt `functions/index.js` und löst die
> Funktionen über `.run()` aus, so wie Firebase es täte. Geprüft wird der
> Zustand **vor** dem Umzug (ohne Firmen muss alles flach laufen — das ist
> der Betrieb, heute Nacht), dass jeder Auslöser an **beiden** Pfaden
> hängt, und **nach** dem Umzug die Trennung. Der Papierkorb-Test legt in
> zwei Firmen absichtlich eine Datei mit derselben Kennung ab: verrutscht
> der Pfad, löscht die eine Firma die Datei der anderen — und nichts daran
> sähe nach einem Fehler aus.
>
> Er stellt seine Voraussetzung selbst her und prüft sie nach, statt sie
> anzunehmen. Beim ersten Lauf hinter `umzug.test.js` war er rot, weil
> dort schon eine Firma lag. Ein Test, der von der Reihenfolge abhängt,
> misst irgendwann das Falsche, und niemand merkt es.
>
> **Was er nicht abdeckt**, damit „alles grün" niemanden beruhigt, der es
> nicht sollte: geprüft wird nur, was eine sichtbare Spur hinterlässt —
> geschriebene und gelöschte Dokumente. `dueTaskReminder`, `certExpiry`,
> `appointmentMailScheduler` und der Monatsbericht enden in einer
> Push-Nachricht oder einer E-Mail und hinterlassen keine. Für die steht
> nur fest, dass sie über `alleFirmen()` und `W(firma)` gehen. Ob Push
> und Mail wirklich ankommen, lässt sich nur im Probe-Projekt an einem
> echten Gerät feststellen.

`test-funktionen-pfade.js` (oben in der Liste) braucht **keinen**
Emulator: er liest `functions/index.js` als Text. Beide zusammen, weil
sie verschiedene Fehler fangen — der eine, dass eine Funktion falsch
arbeitet, der andere, dass eine Funktion **vergessen** wurde. Gegen das
Vergessen hilft kein Verhaltenstest: der prüft nur, woran jemand gedacht
hat.
