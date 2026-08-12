# Rechtliches — was die App tut und was du tun musst

Stand 10. August 2026.

**Vorweg, damit es keine Missverständnisse gibt:** ich bin kein Anwalt und
darf keine Rechtsberatung geben. Was hier steht, ist eine Beschreibung
dessen, was die App technisch macht, und eine Liste dessen, was
üblicherweise verlangt wird. Ob euer konkreter Fall damit abgedeckt ist,
kann ich nicht beurteilen — und wer das anders behauptet, sollte es nicht.

---

## Was schon gebaut ist

| | |
|---|---|
| **Impressum und Datenschutz** | ein Fenster in der App, **auch ohne Anmeldung** erreichbar |
| **Inhalt liegt je Firma in der Datenbank** | `config/recht`, gepflegt in *Verwaltung → System → ⚖️ Rechtliche Angaben* |
| **`konfig.js` ist nur noch der Rückfall** | und zwar **ausschließlich für den eigenen Betrieb** — siehe unten |
| **Warnung bei Lücken** | fehlt eine Pflichtangabe, steht das rot über dem Text |
| **Warnung für den Chef** | zusätzlich als Karte in *Verwaltung → System* |
| **E-Mail-Bestätigung** | wird beim Anlegen verschickt, Leiste in der App, erneut sendbar |
| **Der Chef sieht den Stand** | in der Freigabe-Karte: „E-Mail bestätigt" oder „noch nicht" |

Ein Impressum hinter einem Login wäre keins. Deshalb steht es schon auf
dem Anmeldebildschirm.

**Warum ein leeres Impressum eine Warnung bekommt und nicht einfach leer
bleibt:** eine App, die eine leere Seite „Impressum" nennt, sieht erledigt
aus. Das ist gefährlicher als gar keine Seite.

---

## Was du eintragen musst — in der App

*Verwaltung → System → **⚖️ Rechtliche Angaben***. Nur der Chef sieht diese
Karte, gespeichert wird nach `config/recht` — **je Firma getrennt**.

**Warum nicht mehr in `konfig.js`:** diese Datei gilt für das ganze
Firebase-Projekt. Solange jeder Kunde ein eigenes Projekt bekam, war das
richtig. Seit mehrere Firmen in EINER Datenbank liegen, ist es falsch: der
zweite Kunde sähe entweder das Impressum von Körperformen oder eine
Warnung, die ihn an eine Datei schickt, an die er gar nicht herankommt.
Und impressumspflichtig ist jeder Betreiber selbst.

**Der Rückfall:** steht in `config/recht` nichts, gilt weiterhin der Block
`recht` aus `konfig.js` — aber **nur für den eigenen Betrieb**. Eine fremde
Firma ohne eigene Angaben bekommt die Warnung, nicht die Angaben von
Körperformen. Genau dieser Fehler ist bei der Studioliste schon einmal
passiert.

### Pflicht (§ 5 DDG)

| Feld | was hinein muss |
|---|---|
| `betreiber` | vollständiger Name, bei GmbH mit Rechtsform |
| `anschrift` | ladungsfähige Anschrift — **ein Postfach genügt nicht** |
| `vertreten` | Geschäftsführer oder Inhaber, mit Namen |
| `email` | muss existieren **und gelesen werden** |

Ohne diese vier zeigt die App die Warnung an. Das ist Absicht.

### Wenn zutreffend

| Feld | wann |
|---|---|
| `telefon` | keine Pflicht, aber üblich |
| `register` | bei Handelsregistereintrag, z. B. „Amtsgericht Köln, HRB 12345" |
| `ustId` | bei vorhandener USt-IdNr. |
| `datenschutzKontakt` | wenn es einen eigenen Ansprechpartner gibt |
| `zusatz` | Absätze, die nur ihr kennt — Videoüberwachung im Studio, Zeiterfassung, Zutrittssystem |

---

## Was die App tatsächlich mit Daten macht

Diese Liste ist am Programm nachprüfbar. Sie ist die Grundlage der
Datenschutzerklärung im Fenster — und sie ist der Teil, den ich
wahrheitsgemäß beantworten kann.

### Was gespeichert wird

**Zum Konto:** Name · E-Mail · Rolle · zugeordnete Studios · Profilbild
oder Symbol · Farbe · Geburtstag (freiwillig) · Zeitpunkt der letzten
Anmeldung.

**Aus der Arbeit:** Chatnachrichten mit Text, Fotos und **Sprachaufnahmen**
· Direktnachrichten · Aufgaben und wer sie wann abgehakt hat · Putzplan
und Notizen · Materialbestände · Gerätemeldungen mit Fotos · Schichten ·
**Urlaub und Krankmeldungen** · Übergaben · Qualifikationsnachweise mit
Ablaufdatum · Dokumente.

**Technisch:** ein Gerätekennzeichen für Push-Nachrichten, nur wenn
eingeschaltet.

### Die drei Punkte, die im Arbeitsverhältnis heikel sind

Ich hebe sie hervor, weil sie in einem Betrieb mit Beschäftigten
regelmäßig zu Rückfragen führen — nicht weil ich beurteilen kann, wie sie
zu bewerten sind:

1. **Krankmeldungen.** Die App speichert, wer wann krank war. Das sind
   Gesundheitsdaten (Art. 9 DSGVO) und damit die empfindlichste Kategorie
   im ganzen System.
2. **Anwesenheitsanzeige.** Die App speichert, wann jemand zuletzt online
   war. Wer das als Kontrolle liest, liegt nicht ganz falsch.
3. **Sprachaufnahmen im Chat.** Stimme ist ein biometrisches Merkmal.

Alle drei sind Funktionen, die ihr wolltet und die sinnvoll sind. Sie
gehören nur in die Erklärung — und wahrscheinlich in eine Absprache mit
dem Team.

### Wo es liegt

Google Firebase, Region **europe-west1** (Belgien). Anbieter ist Google
Ireland Limited. Firestore, Authentication, Cloud Functions, Cloud
Storage. Die nächtliche Sicherung liegt in derselben Region.

Für die Google-Tabelle geht ein Auszug an Google Apps Script — ebenfalls
Google. Der Monatsbericht geht per Gmail hinaus.

### Wie lange

| | |
|---|---|
| Konto und Inhalte | solange das Konto besteht |
| Papierkorb | 30 Tage, dann endgültig weg |
| Wochensicherungen Material | 52 Wochen |
| Nächtliche Vollsicherung | 30 Tage (Aufräumen läuft automatisch) |

### Wer was sieht

Mitarbeiter ihr Studio · Studio-Leiter ihre Studios · Chef alles ·
niemand von außen. Durchgesetzt über **Sicherheitsregeln in der
Datenbank**, nicht nur über die Oberfläche — das ist der Unterschied
zwischen „man sieht es nicht" und „man kommt nicht heran". 61 automatische
Regeltests halten das fest.

---

## Was **nur** ein Anwalt machen kann

Das ist keine Bescheidenheit. Es sind die Punkte, an denen eine falsche
Auskunft von mir Geld kostet.

### 1. Die Texte selbst durchsehen

Der Datenschutztext im Fenster beschreibt korrekt, was passiert. Ob er
**vollständig** ist — Rechtsgrundlagen je Verarbeitung, Widerspruchsrecht,
Aufsichtsbehörde, Betroffenenrechte im richtigen Umfang — kann ich nicht
beurteilen.

### 2. Vereinbarung mit dem Betriebsrat oder dem Team

Sobald Beschäftigtendaten verarbeitet werden, ist die Rechtsgrundlage in
der Regel § 26 BDSG oder eine Betriebsvereinbarung. Bei Anwesenheitszeiten
und Krankmeldungen ist das kein Randthema.

### 3. Verzeichnis von Verarbeitungstätigkeiten

Muss geführt werden, sobald besondere Kategorien dabei sind — und
Krankmeldungen sind welche. Die Inhalte dafür stehen oben in diesem
Dokument; die Form muss jemand kennen, der sie kennt.

### 4. Auftragsverarbeitung mit Google

Für Firebase ist ein Vertrag zur Auftragsverarbeitung nötig. Google
stellt ihn bereit (Google Cloud Data Processing Addendum); er muss
angenommen und abgelegt werden.

### 5. **Sobald du an einen Kunden verkaufst**

Dann verarbeitest **du** Daten **für** den Kunden. Damit brauchst du:

- einen Auftragsverarbeitungsvertrag **mit deinem Kunden**, in dem du der
  Auftragsverarbeiter bist
- technische und organisatorische Maßnahmen, schriftlich
- eine Regelung zu Unterauftragnehmern (Google)
- eine Löschzusage nach Vertragsende

**Das ist der Punkt, an dem es aufhört, eine App-Frage zu sein.** Und es
ist derselbe Punkt, an dem `MANDANT-PLAN.md` empfiehlt, vor dem ersten
echten Kunden jemanden von außen auf die Datentrennung schauen zu lassen.

---

## Reihenfolge, die ich vorschlagen würde

| Wann | Was |
|---|---|
| **jetzt** | die vier Pflichtfelder in *Verwaltung → System → ⚖️ Rechtliche Angaben* eintragen — dauert fünf Minuten und die Warnung ist weg |
| **vor dem Einsatz im Team** | Datenschutztext einmal anwaltlich durchsehen lassen; Absprache mit dem Team zu Anwesenheit und Krankmeldungen |
| **vor dem ersten Kunden** | Auftragsverarbeitung, Verzeichnis, Blick von außen auf die Datentrennung |

---

## Was ich hier nicht getan habe

Ich habe **keine** fertige Datenschutzerklärung geschrieben und sie auch
nicht so genannt. Im Fenster steht ausdrücklich: *„Er beschreibt, was die
App tut, und ist am Programm nachprüfbar. Er ist keine anwaltlich geprüfte
Datenschutzerklärung."*

Der Grund: ein Text, der aussieht wie eine geprüfte Erklärung, aber keine
ist, ist schlechter als ein Text, der sagt, was er ist. Man verlässt sich
sonst darauf.
