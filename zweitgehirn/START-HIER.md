# Zweitgehirn – Start hier

Ein Wissensspeicher, den Claude für dich pflegt und den du in Obsidian liest.

Der Unterschied zu "Datei hochladen und fragen": Claude sucht nicht bei jeder
Frage neu in deinen Rohdateien herum. Er baut aus ihnen ein Wiki – verlinkte
Markdown-Seiten – und hält es aktuell. Jede neue Quelle wird eingearbeitet,
statt nur abgelegt. Das Wiki wird mit jeder Quelle besser. Genau das passiert
bei einem Datei-Upload eben **nicht**.

---

## Was schon fertig ist

```
zweitgehirn/
├── CLAUDE.md              Die Regeln. Das wichtigste File. Schon ausgefüllt.
├── START-HIER.md          Diese Anleitung.
├── raw-sources/           Deine Rohquellen. Noch leer – Schritt 3.
│   ├── LIESMICH.md
│   └── Memory-VORLAGE.md  Zum Ausfüllen, wenn du kein Material hast.
├── wiki/                  Claudes Bereich. Du liest hier, du schreibst nicht.
│   ├── index.md           Katalog aller Seiten.
│   ├── log.md             Zeitleiste: was wann passiert ist.
│   └── vorlagen/          Muster für Quellen-, Themen-, Akteursseiten.
└── werkzeuge/
    ├── morgen_digest.py   Morgen-Briefing im Terminal.
    └── suche.sh           Volltextsuche über den Vault.
```

Schritt 1 und 2 der Anleitung sind damit erledigt. Es fehlen noch Obsidian auf
deinem Rechner (Schritt 1b), dein Material (Schritt 3) und der erste Lauf
(Schritt 4).

---

## Schritt 1b – Obsidian installieren

1. Auf [obsidian.md](https://obsidian.md) herunterladen, kostenlos.
2. Öffnen → **"Ordner als Vault öffnen"** → diesen `zweitgehirn/`-Ordner wählen.
   Kein neuer Vault, sondern der bestehende Ordner.
3. Links siehst du die Ordnerstruktur, unten links das Graph-Symbol.

Obsidian ist nur das Fenster. Der eigentliche Nutzen steckt in den Ordnern, dem
Schema und Claude. Ohne Obsidian funktioniert alles genauso – nur weniger schön.

## Schritt 2 – Das Schema verstehen (`CLAUDE.md`)

Lies `CLAUDE.md` einmal durch. Das ist die Datei, die aus Claude einen
disziplinierten Wiki-Pfleger macht statt eines Chatbots. Sie legt fest:

- **raw-sources/ ist unantastbar.** Claude liest daraus, schreibt nie hinein.
- **wiki/ gehört Claude.** Du liest, du schreibst nicht von Hand.
- Wie Seiten aufgebaut sind, wie verlinkt wird, wie Widersprüche markiert werden.
- Was bei Ingest, Frage und Gesundheitscheck jeweils passiert.

Ich habe die Vorlage auf dein Studio zugeschnitten (EMS, Marketing,
Kundenbindung, Betrieb, Franchise). Wenn dich etwas stört: ändern. Das Schema
ist ein lebendes Dokument, du entwickelst es mit der Zeit weiter.

## Schritt 3 – Rohquellen einfüllen

**Hier hören die meisten auf.** Ordner angelegt, dann vor dem leeren
Verzeichnis gesessen. Nicht machen. Kipp einfach alles rein, was du schon hast:

- Artikel, die du gespeichert und nie wieder gelesen hast
- Notizen aus Podcasts, YouTube, Büchern
- Gesprächsprotokolle, Kundengespräche, Teambesprechungen
- Alte Auswertungen, Zahlen, Projektnotizen
- Was schiefgelaufen ist und was du daraus gelernt hast

Als `.md` oder `.txt` in `raw-sources/`. Nicht umbenennen, nicht sortieren,
nicht aufräumen – das ist Claudes Job.

**Du hast nichts?** Kopiere `raw-sources/Memory-VORLAGE.md` zu
`raw-sources/Memory.md` und füll sie aus. Oder rede 20 Minuten mit Claude über
dein Studio, deine Ziele und woran du gerade hängst, und speichere das Gespräch
als `Memory.md` ab. Das reicht für den Anfang.

Der Vault muss nicht vollständig sein, um zu nützen. Er muss echt sein.

## Schritt 4 – Claude das Wiki bauen lassen

Terminal im Ordner `zweitgehirn/` öffnen, dann:

```bash
claude -p "Lies alles in raw-sources/. Baue daraus das Wiki in wiki/ nach den \
Regeln in CLAUDE.md auf: erst index.md, dann eine Seite pro Quelle, dann \
Themenseiten. Verlinke Verwandtes als [[seitenname]]. Schreib alles nach log.md \
und zeig mir am Ende jede angefasste Datei." --allowedTools Bash,Write,Read,Edit
```

Dann laufen lassen. Bei einer Handvoll Quellen dauert das ein paar Minuten.

Danach: Obsidian auf der einen Bildschirmhälfte, Claude auf der anderen. Klick
dich durch die Links, schau dir die Graph-Ansicht an. Obsidian ist die
Werkbank, Claude der Handwerker, das Wiki das Werkstück.

## Schritt 5 – Der tägliche Betrieb

Drei Handgriffe, mehr ist es nicht.

### Neue Quelle einarbeiten (Ingest)

Datei in `raw-sources/` legen, dann:

```bash
claude -p "Ich habe eine neue Datei in raw-sources/ abgelegt. Verarbeite sie \
nach dem Ingest-Ablauf aus CLAUDE.md und zeig mir jede angefasste Datei." \
--allowedTools Bash,Write,Read,Edit
```

Ein Artikel berührt oft 5–15 Wiki-Seiten. Claude findet dabei Verbindungen, die
du nicht gesehen hast, markiert Widersprüche zu Bestehendem und protokolliert
alles.

### Das Wiki befragen

Ab etwa zehn Quellen wird es interessant:

- "Was sind laut wiki/ die drei größten Lücken in meinem Verständnis von
  Kundenbindung?"
- "Vergleiche, was Quelle A und Quelle B über Probetrainings sagen. Wo
  widersprechen sie sich?"
- "Schreib mir ein 500-Wörter-Briefing zu Preisgestaltung – nur aus dem, was in
  diesem Wiki steht."

**Der entscheidende Punkt:** Gute Antworten wandern zurück ins Wiki, nach
`wiki/antworten/`. Sonst verschwinden sie im Chatverlauf. Jede Frage macht die
nächste Antwort besser – das ist die Schleife, die den Unterschied macht.

### Gesundheitscheck (einmal pro Woche)

```bash
claude -p "Führe einen Lint-Lauf nach CLAUDE.md durch und schreib den Bericht \
nach wiki/lint-bericht.md." --allowedTools Bash,Write,Read
```

Findet Widersprüche, verwaiste Seiten, fehlende Themenseiten, veraltete
Aussagen. Das ist deine Qualitätskontrolle: Wenn Claude einmal etwas leicht
Falsches schreibt und du es zurückspeicherst, baut die nächste Antwort auf dem
Fehler auf. Der wöchentliche Check fängt das ab, bevor es sich fortpflanzt.

## Schritt 6 – Automatisieren (optional)

**Morgen-Briefing.** Zeigt offene Punkte aus `Memory.md`, neue Rohquellen der
letzten 24 Stunden und die letzten Log-Einträge:

```bash
python3 werkzeuge/morgen_digest.py
python3 werkzeuge/morgen_digest.py --stunden 72   # nach dem Wochenende
```

Täglich um 7:30 Uhr automatisch (macOS/Linux, `crontab -e`):

```
30 7 * * * cd /pfad/zu/zweitgehirn && /usr/bin/python3 werkzeuge/morgen_digest.py >> /tmp/digest.log 2>&1
```

**Suche.** Solange das Wiki klein ist, reicht:

```bash
./werkzeuge/suche.sh "kundenbindung"
./werkzeuge/suche.sh -w "preise"     # nur im Wiki
```

**Gesprächsprotokoll verarbeiten.** Nach Team- oder Kundengesprächen:

```bash
claude -p "Lies raw-sources/gespraech-heute.md. Zieh alle Entscheidungen \
heraus, alle Aufgaben mit Verantwortlichem und Frist, und fass es in drei \
Punkten zusammen. Aufgaben nach wiki/aufgaben.md, Entscheidungen nach \
wiki/entscheidungen.md, dazu eine Themenseite mit Rückverweis." \
--allowedTools Bash,Write,Read,Edit
```

## Nützliche Kleinigkeiten

- **Obsidian Web Clipper** (Browser-Erweiterung): macht aus jedem Artikel mit
  einem Klick eine Markdown-Datei in `raw-sources/`. Der schnellste Weg zu
  Material.
- **Graph-Ansicht** in Obsidian: zeigt die Form deines Wissens – was hängt
  zusammen, was ist ein Knotenpunkt, was hängt in der Luft.
- **Dataview-Plugin**: baut automatisch Tabellen aus dem YAML-Kopf der Seiten
  (`typ`, `tags`, `aktualisiert`). Der Kopf ist in den Vorlagen schon angelegt.
- **Git**: liegt hier ohnehin schon drin. Versionsverlauf für dein Wissen –
  du kannst jederzeit sehen, was Claude wann geändert hat, und es zurückdrehen.
- **Datenschutz**: Kundendaten gehören nicht ungefiltert ins Repo, erst recht
  nicht in ein öffentliches. Das Schema sagt Claude, dass er anonymisieren soll –
  aber die erste Entscheidung, was überhaupt hineinkommt, triffst du.

---

Ursprungsidee: Andrej Karpathy,
[LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).
