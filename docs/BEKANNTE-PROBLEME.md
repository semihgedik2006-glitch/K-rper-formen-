# StudioChat — bekannte Probleme

**Stand:** 17. September 2026

Die zentrale Liste. Jeder Eintrag ist am Code nachprüfbar; wo etwas
Einschätzung ist, steht das dabei.

**Diese Liste gehört in die Anlage und nicht in eine Schublade.** Ein
Kunde, der sie liest, weiß woran er ist — und ein Kunde, der sie nicht
bekommt, findet die Lücken trotzdem, nur später und im falschen Moment.

| Schweregrad | Bedeutung |
|---|---|
| **KRITISCH** | Daten fremder Personen erreichbar, oder Geld geht verloren |
| **HOCH** | Rechtliche Pflicht nicht erfüllt, oder ein Kunde wird ausgesperrt |
| **MITTEL** | Funktion fehlt, für die es eine Erwartung gibt |
| **NIEDRIG** | Unschönheit, kein Schaden |
| **INFO** | Bewusste Entscheidung, die man kennen muss |

---

## P-01 · Die Studiogrenze beim Lesen

| | |
|---|---|
| **Schweregrad** | **HOCH** |
| **Status** | **Für die Personendaten behoben am 17.9.2026, für die Studio-Chats am 23.9.2026.** Aufgaben, Putzplan, Geräte, Material: **bewusst offen**. Dokumente mit Zielstudio: **offen** (siehe unten) |
| **Gefunden** | 16.9.2026, beim Erstellen der Rechtsantworten |

**Was war das Problem?** Die Leseregel prüfte nur, ob jemand ein
freigegebenes Konto **dieses Betriebs** hat — nicht, zu welchem Studio
er gehört:

```
allow read: if inFirma(f) && istAktiv();
```

Damit standen **Krankmeldungen** — Gesundheitsdaten nach Art. 9 DSGVO,
die empfindlichste Kategorie im System — jedem freigegebenen
Beschäftigten des Betriebs offen, nicht nur dem eigenen Studio. Nicht
über Betriebsgrenzen hinweg; dort hielt die Grenze immer.

---

### Behoben: die drei Sammlungen mit Personendaten

| Sammlung | Was drinsteht |
|---|---|
| `shifts` | wer wann arbeitet |
| `absences` | Urlaub, frei — **und krank** |
| `handovers` | Übergaben, oft mit Namen von Kundinnen |

Neue Regelfunktion in `firestore.rules`:

```
function meinStudio(studioKey) {
  return isChef() || studioKey in myProfile().get('studioKeys', []);
}
```

`manages()` gab es schon, aber die fragt nach dem **Verwalten** und ist
für einen Mitarbeiter immer falsch. Fürs Lesen braucht es die weitere
Frage: ein Mitarbeiter darf die Schichten *seines* Studios sehen, nur
nichts daran ändern.

**Kein `get()` darin.** `myProfile()` ist ohnehin schon gelesen; die
Prüfung kostet keinen zusätzlichen Lesevorgang.

**Und die Abfragen?** Der befürchtete Preis ist nicht angefallen.
Firestore weist eine Abfrage komplett ab, sobald auch nur ein Treffer
nicht gelesen werden dürfte — die Anwendung hätte also überall gefiltert
abfragen müssen. **Beim Nachsehen fragt sie ohnehin schon je Studio ab**
(`S('studios').doc(sk).collection('absences')`), und `sk` kommt aus
`session.studioKeys` oder aus einer Auswahlliste, die selbst schon
begrenzt ist (`buildTeamSelect`). Es war keine einzige Abfrage zu
ändern.

> **Das ist der Grund, warum man erst misst und dann plant.** Der
> geschätzte Aufwand für diesen Punkt war „Arbeit an jeder betroffenen
> Stelle". Der tatsächliche war eine Regelfunktion und sechs Zeilen.

**Nachgemessen:** `tests/rules/studiogrenze.test.js`, 27 Zusicherungen.
Mitarbeiter, Leiter mit zwei von drei Studios, Chef ohne eigene Studios,
ein Konto ganz ohne `studioKeys`, dazu die Abfrage und nicht nur das
einzelne Dokument — und die Gegenproben in beide Richtungen.

---

### Bewusst NICHT behoben: Aufgaben, Putzplan, Geräte, Material

Diese bleiben betriebsweit lesbar. **Das ist eine Entscheidung:** ein
defektes Gerät soll auch melden können, wer gerade aushilft, und eine
Putzaufgabe ist keine Personenangabe. Personenbezogen ist daran nur,
*wer* abgehakt oder gemeldet hat.

Wer das anders sieht, ändert es — und ändert `tests/rules/studiogrenze.test.js`
mit, wo diese Offenheit als Gegenprobe festgehalten ist.

### Behoben am 23.9.2026: die Studio-Chats

Bei der Durchsicht des ganzen Repos nachgesehen, was hier bis dahin
„NICHT GEPRÜFT" hiess: `kanalErlaubt()` gab für jeden Kanal ausser den
beiden Leitungsgruppen `true` zurück. **Jeder freigegebene Beschäftigte
des Betriebs konnte den Chat jedes Studios lesen und hineinschreiben** —
die Oberfläche zeigte nur die eigenen, die Regel liess alle zu.
Nachgewiesen mit einem Test, der vor der Änderung rot war (6 × „GING
DURCH", beide Welten).

Jetzt: `allgemein` für alle, Studio-Kanäle über `meinStudio()`, die
Leitungsgruppen wie bisher. **Mit einem Übergang:** ein Konto ohne
gespeichertes `studioKeys` behält das alte Verhalten, damit niemand
seinen eigenen Studio-Chat verliert. Ob es solche Konten im Betrieb
gibt, liess sich von hier aus nicht prüfen (kein Zugang zur echten
Datenbank, mit Absicht). **`tools/konten-pruefen.js` zählt sie jetzt**;
steht dort 0, darf die Übergangszeile in `kanalErlaubt()` weg.

`tests/rules/studiogrenze.test.js`: 45 Zusicherungen (+18).

### Weiterhin offen: Dokumente (und das Brett)

**Dokumente** tragen ein Zielfeld `studios` („alle" oder eine Liste von
Studios), und die Oberfläche zeigt jedem nur, was für seine Studios
bestimmt ist (`docVisible()`). Die Regel liest dieses Feld aber nicht:
ein Dokument, das nur für ein Studio bestimmt ist, kann jeder
Beschäftigte des Betriebs über die Konsole lesen.

**Warum nicht gleich mitbehoben:** die App holt alle Dokumente in EINER
ungefilterten Abfrage. Eine Regel je Dokument liesse diese Abfrage für
jeden ausser dem Chef komplett scheitern — die Dokumentenseite wäre
leer. Nötig wären zwei Abfragen (die „alle"-Dokumente und die mit dem
eigenen Studio im Zielfeld) und ein Feld, das Firestore abfragen kann.
Das ist ein Umbau mit eigener Prüfung, keine Zeile. **Empfehlung:**
angehen, sobald Dokumente mit Personenbezug an einzelne Studios gehen
(Dienstanweisungen sind unkritisch, Abmahnungen oder Gesundheitsnachweise
wären es nicht — die gehören ohnehin nicht dorthin).

**Das Brett** hat kein Studiofeld und ist betriebsweit gedacht („für das
ganze Team"). Eine Studiogrenze dort wäre eine neue Funktion, keine
Reparatur.

> **`docs/av/TOM.md` wurde am 17.9. berichtigt:** die Tabelle „Wer
> welche Daten sieht" trägt jetzt eine dritte Spalte — **Wodurch
> gehalten**. Ebenso der Datenschutztext in der App, der bis dahin
> behauptete, die Aufteilung sei „über Sicherheitsregeln in der
> Datenbank" geregelt.

---

## P-02 · Kein Verfahren für Datenschutzvorfälle

| | |
|---|---|
| **Schweregrad** | **HOCH** |
| **Status** | **Teilweise behoben am 17.9.2026** |
| **Betroffen** | Organisation, nicht Code |

Art. 33 DSGVO verlangt die Meldung an die Aufsichtsbehörde binnen **72
Stunden**; Art. 33 Abs. 2 verpflichtet den Auftragsverarbeiter, den
Verantwortlichen **unverzüglich** zu informieren.

**Geschrieben am 17.9.2026:** `docs/av/VORFALL.md` — sechs Schritte
(stoppen, feststellen, Kunden melden, dokumentieren, Art. 34, abstellen),
eine benannte Person mit Adresse, eine Meldevorlage, eine Aktenvorlage,
eine Einstufungstabelle mit sieben Beispielen und die Ablage der Akten.

**Was damit NICHT behoben ist**, und warum der Punkt offen bleibt:

| | |
|---|---|
| **Keine Vertretung** | Ein Einzelunternehmen hat keine Meldekette. Fällt die eine Person aus, meldet niemand — und die Frist des Kunden läuft weiter. **Entschieden am 25.9.2026:** bleibt so, wird im AV-Vertrag offengelegt; die eigene Meldefrist steigt dafür von 24 auf 48 Stunden. |
| **Ein einziger Meldeweg** | Eine E-Mail-Adresse. Ist das Postfach Teil des Vorfalls, gibt es keinen zweiten. |
| **Die Behördenanschrift fehlt** | Bewusst: eine veraltete Adresse in einer Notfallvorlage ist schlimmer als keine. |
| **Nie erprobt** | Ein Verfahren, das nie gelaufen ist, ist eine Annahme. Ein Trockenlauf dauert eine Stunde. |

**Aufwand für den Rest:** die Vertretung ist entschieden (keine,
offengelegt). Offen bleiben der zweite Meldeweg und ein Trockenlauf.

---

## P-03 · Google Fonts wurden extern nachgeladen

| | |
|---|---|
| **Schweregrad** | **MITTEL** |
| **Status** | **BEHOBEN am 17.9.2026** |
| **Betroffen** | `index.html`, `werbung.html` |

*Barlow* und *Barlow Condensed* kamen von `fonts.googleapis.com` und
`fonts.gstatic.com`. Dabei ging die IP-Adresse des Besuchers an Google —
**beim Laden der Seite, vor jeder Anmeldung und vor jedem Hinweis.** Das
LG München I hat 2022 (3 O 17493/20) entschieden, dass das ohne
Einwilligung einen Unterlassungsanspruch begründen kann; die
Rechtsprechung ist nicht einheitlich.

**Behoben:** neun `woff2`-Dateien der latin-Teilmenge liegen jetzt unter
`schriften/` (zusammen 195,8 KB, gemessen). In beiden HTML-Dateien
stehen statt der `<link>`-Zeilen neun `@font-face`-Regeln. `font-src`
und `style-src` in der CSP sind auf `'self'` eingeengt — erzeugt aus
`tools/csp.js`, nicht von Hand.

**Nachgemessen** in `tests/test-schriften.js` (28 Zusicherungen): jede
Anfrage der geladenen Seite wird mitgeschrieben; zu `fonts.googleapis`
und `fonts.gstatic` geht keine mehr. Zusätzlich wird die Breite desselben
Textes in Barlow und in einer nicht existierenden Schrift verglichen —
sonst wäre eine sauber geladene, aber nirgends benutzte Schrift ein
grüner Durchlauf.

> **Was NICHT behoben ist, und auch nicht behoben werden sollte:** das
> Firebase-SDK kommt weiter von `www.gstatic.com`. Das ist derselbe
> Google-Host. Der Unterschied ist die Notwendigkeit — ohne das SDK gibt
> es keine App, ohne Google Fonts nur eine andere Schrift. Die Formel
> „läuft ohne jeden Drittabruf" wäre also falsch, und sie stand am
> Vormittag des 17.9. in einem Kommentar in `index.html`, bis der neue
> Durchlauf fünf Anfragen nach `gstatic.com/firebasejs` gezählt hat.
> `werbung.html` holt ausserdem Logo und Trainingsfoto vom eigenen
> Webauftritt.

---

## P-04 · Keine Lizenzdatei im öffentlichen Repository

| | |
|---|---|
| **Schweregrad** | **MITTEL** |
| **Status** | Open |

Öffentlich einsehbar ist nicht gemeinfrei — ohne Lizenzdatei gilt das
normale Urheberrecht. Trotzdem ist der Zustand unklar: soll der Code
geschützt sein, gehört eine Lizenzdatei hin, die die Nutzung
ausdrücklich verbietet; oder das Repository auf privat.

**Aufwand:** fünf Minuten.

---

## P-05 · Passwort-Mindestlänge 6 Zeichen

| | |
|---|---|
| **Schweregrad** | **MITTEL** |
| **Status** | Open |

Sechs Zeichen sind nach heutigem Stand wenig. Eine Erhöhung auf zwölf
ist **eine Zeile**. Steht in `docs/av/TOM.md` ausdrücklich als offene
Maßnahme — nicht als Zusage, weil sie heute nicht wahr wäre.

---

## P-06 · Kein Zweitfaktor

| | |
|---|---|
| **Schweregrad** | **MITTEL** |
| **Status** | Open |

Für Chef- und Betreiberkonten wäre er angemessen. Ein Betreiberkonto
kann Firmen anlegen, sperren und Abos setzen.

---

## P-07 · Wiederherstellung aus der Sicherung nie geprobt

| | |
|---|---|
| **Schweregrad** | **MITTEL** |
| **Status** | Open |

Der Weg ist bekannt — Firestore-Import aus dem Sicherungsordner. Geübt
wurde er nie.

> „Eine Wiederherstellung, die nie geübt wurde, ist eine **Hoffnung und
> keine Maßnahme**." (`docs/av/TOM.md`)

---

## P-08 · Keine Löschfrist für Stempelzeiten

| | |
|---|---|
| **Schweregrad** | **MITTEL** |
| **Status** | Open — bewusst nicht von uns gesetzt |

Stempelzeiten bleiben unbegrenzt liegen. § 16 Abs. 2 ArbZG nennt zwei
Jahre für Aufzeichnungen über die werktägliche Arbeitszeit hinaus; wie
lange darüber hinaus, ist eine Abwägung zwischen Aufbewahrungspflicht
und Datenminimierung.

**Eine Frist, die niemand gesetzt hat, ist keine Frist, sondern ein
Versäumnis.**

---

## P-09 · Kein Korrekturweg für vergessene Stempel

| | |
|---|---|
| **Schweregrad** | **MITTEL** |
| **Status** | **BEHOBEN am 24.9.2026** (B-44) |

`zeiten` steht auf `allow write: if false` — für jeden. Wer vergisst
auszustempeln, hat einen falschen Eintrag, der so stehen bleibt.

**Das ist zugleich die Stärke und die Härte:** eine
Arbeitszeitaufzeichnung, die der Arbeitgeber nachträglich ändern kann,
ist als Nachweis weniger wert. Die saubere Lösung wäre eine
Korrekturfunktion **mit Protokoll** — wer hat wann was geändert und
warum. Sie ist nicht gebaut.

**Bis dahin gehört in die AGB**, dass Korrekturen außerhalb des Systems
dokumentiert werden.

---

## P-10 · Auskunft nach Art. 15 ist Handarbeit

| | |
|---|---|
| **Schweregrad** | **MITTEL** |
| **Status** | Open |

Verlangt eine Beschäftigte alle Daten über sich, muss jemand mit
Datenbankzugang nachsehen und zusammenstellen. Die Daten liegen über
mehrere Sammlungen verteilt.

Im Vertragsentwurf steht deshalb eine Zusage über einen **Vorgang** und
eine Frist, nicht über eine Funktion. Eine Zusage „auf Knopfdruck" wäre
falsch.

---

## P-11 · Kein Export für einen kündigenden Kunden

| | |
|---|---|
| **Schweregrad** | **MITTEL** |
| **Status** | Open |

Ein vollständiger Export wäre heute Handarbeit über die
Firebase-Konsole. Wer einen Export im Vertrag zusagt, sagt einen Vorgang
zu und sollte eine Frist nennen, die Handarbeit zulässt.

---

## P-12 · Team-Seite springt beim Öffnen nach unten

| | |
|---|---|
| **Schweregrad** | **NIEDRIG** |
| **Status** | **BEHOBEN am 24.9.2026** (B-42) |
| **Gemessen** | altes Design 235 px, neues 239 px; am 24.9.2026 218 px (Leitung, 390 px) |

Vorbestehend, nicht durch den Design-Umbau entstanden.

---

## P-13 · Was bei „Zugang entfernen" stehen bleibt

| | |
|---|---|
| **Schweregrad** | **INFO** — bewusste Entscheidung |
| **Status** | Won't Fix, solange der Kunde nichts anderes verlangt |

Gelöscht werden Anmeldekonto, Profil und der persönliche Bereich.
**Stehen bleiben:** Chatnachrichten, wer welche Aufgabe abgehakt hat,
Übergaben, Gerätemeldungen, vergangene Schichten, Stempelzeiten. Der
Name bleibt dort sichtbar, weil er mitgeschrieben wurde.

**Der Grund:** ein Verlauf, aus dem einzelne Beiträge verschwinden, ist
als Verlauf wertlos; eine Übergabe ohne Absender ist keine Übergabe.

**Das muss der Kunde wissen und seinem Team sagen.** „Zugang entfernt"
heißt nicht „alle Daten gelöscht".

---

## P-14 · Premium bei der Auswertung ist kein echtes Schloss

| | |
|---|---|
| **Schweregrad** | **INFO** |
| **Status** | Won't Fix |

Die Auswertung rechnet aus Daten, die das Team ohnehin sehen darf. Die
Ansicht wird ausgeblendet, nicht gesperrt — wer technisch versiert ist,
kommt an die Zahlen. Bei den **Nachweisen** greift dagegen eine echte
Regel.

**Das gehört ins Verkaufsgespräch, bevor es jemand anders findet.**

---

## P-15 · Zwei stillgelegte Seiten greifen noch flach zu

| | |
|---|---|
| **Schweregrad** | **INFO** |
| **Status** | Won't Fix — dokumentiert |

`marketing.html` (13-mal) und `wachstum.html` (23-mal) greifen ohne
`firmen/<kennung>/` zu. Beide werden seit 13.8.2026 **nicht mehr
ausgeliefert**, die Sammlungen dahinter stehen auf `false`.

> **Wer sie zurückholt, indem er nur die zwei Zeilen in `firebase.json`
> streicht, stellt genau das Leck wieder her, wegen dem sie stillgelegt
> wurden:** zwei Kunden sähen sich gegenseitig in den Terminen, mit
> Namen und E-Mail-Adressen ihrer Endkundinnen.

Die Reihenfolge zum Zurückholen steht in `firebase.json`;
`tests/test-nebenseiten.js` schlägt an, wenn jemand sie umdreht.

---

## P-16 · Kein Analysedienst, keine Kundenverwaltung

| | |
|---|---|
| **Schweregrad** | **INFO** |

Beides wird regelmäßig vermutet und ist **nicht vorhanden**. Siehe
`docs/FUNKTIONEN.md`, Abschnitte 6 und 11.

---

## P-17 · Die Aufgaben brauchen bis zum ersten Bild zu lange

| | |
|---|---|
| **Schweregrad** | **MITTEL** (meistgenutzter Bereich) |
| **Gemessen** | 24.9.2026, Demo Chef (61 Aufgaben), 390 × 844, CPU ÷4 |

- **Messung:** Ein Tipp auf „Aufgaben" braucht bis zum ersten
  gezeichneten Bild 245–577 ms, gemessen über fünf Tipps.
  - Vor Runde 103, P1 war es genauso (331–577 ms); P1 hat es also nicht
    verursacht.
  - Zum Vergleich: der Putzplan braucht 119–329 ms.
- **Gefunden:** über `test-akzent`. Seine Farbprobe bei 90 ms fiel dort
  in einem von drei Läufen vor das erste Bild. Der Durchlauf misst
  seitdem den Wechsel zum Putzplan; die langsame Seite steht hier statt
  in einem gelockerten Test.
- **Vermutete Ursache:** Die ganze Liste wird auf einmal gebaut und
  vermessen. Geprüft ist das noch nicht.
- **Nächster Schritt:** `content-visibility` für die Zeilen unterhalb
  des Bildschirms, dann erneut messen, am Handy und am PC.
- **BEHOBEN am 24.9.2026 (B-43).** Die Vermutung stimmte zur Hälfte:
  der Klick selbst kostet nur 25–35 ms, der Rest war Stil und Layout
  für alle 61 Zeilen. Zeilen ab der 13. tragen jetzt
  `content-visibility:auto`. Median bis zum ersten Bild, CPU ÷4:
  390 px 176 → 104 ms, 1440 px 156 → 121 ms. `test-aufgaben-tempo`
  prüft die Ursache und dass späte Zeilen voll benutzbar bleiben — die
  Zeit selbst druckt er nur aus, weil er neben einem zweiten Browser
  läuft.

---

## Behoben

| ID | Was | Wann |
|---|---|---|
| **B-01** | Stripe-Haken las drei Felder, die es seit API 2025-03-31 nicht mehr gibt. Wäre leise gewesen: Zustand „läuft" ohne Datum | 17.9.2026, `tests/test-stripe-felder.js` |
| **B-02** | Zahlseite behauptete „eine Zahlung ist offen" — bei jeder von Hand gesperrten Firma falsch | 16.9.2026 |
| **B-03** | Demo trug `stufe: 'A'`, einen Wert, den es im Abo-Modell nie gab | 16.9.2026 |
| **B-04** | Mahnleiter wurde aus „hat je gezahlt" erraten — eine Kündigung wäre günstiger gewesen als das Abo | 16.9.2026 |
| **B-05** | Papierkorb löschte bei Dokumenten nur den Verweis, der Inhalt blieb liegen | früher |
| **B-06** | Flache Pfade waren für Konten fremder Firmen lesbar | früher, im Emulator nachgemessen |
| **B-07** | Firmencode war über die allgemeine `config`-Regel für jeden Eingeloggten lesbar | früher |
| **B-08** | Untere Leiste stand bei reduzierter Bewegung auf x=0 | Runde 84 |
| **B-09** | **Die Akzentfarbe kam an der Hauptfarbe nie an.** `markeAnwenden()` lief nach `applyPrefs()` und räumte `--accent` weg, sobald **keine** Firmenfarbe gesetzt war — der Normalfall. Zweite Ursache: gesetzt wurde am `<html>`, aber `body.light{}` setzt dieselben Namen noch einmal | 21.9.2026, `tests/test-akzent.js` |
| **B-10** | **56 getönte Flächen trugen die Akzentfarbe fest verdrahtet** (`rgba(34,211,238,…)`) — Chips, markierte Zeilen, Fokusringe, beide Knopfformen. Wer auf Grün stellte, bekam grüne Ränder und violette Knöpfe | 21.9.2026 |
| **B-11** | **Weisse Schrift auf dem Hauptknopf war im dunklen Modus nie lesbar**: gemessen 2,14:1 in der Mitte des Verlaufs, Untergrenze dieser App ist 4,5. Ein `text-shadow` stand als Notbehelf dabei | 21.9.2026, `tests/test-akzent.js` |
| **B-12** | **Die Deckkraft `.24` der getönten Knopffläche war für Cyan gemessen** und galt pauschal. Pink fällt bei denselben `.24` auf 4,17:1. Sie wird jetzt je Farbe gerechnet | 21.9.2026 |
| **B-13** | `kasseRueckweg()` warf nach der Rückkehr von Stripe die **ganze** Adresse weg — samt `?firma=`, `?neu=` und `?demo=` | 21.9.2026, `tests/test-demo-abo.js` |
| **B-14** | **Zwei Elemente hiessen `hilfeTitel`** — die Überschrift des Hilfe-Fensters und das Eingabefeld im Formular darin. `getElementById` gab die Überschrift zurück, `.value` war `undefined`: **jedes Speichern scheiterte still** an der Prüfung „Bitte sag in einem Satz, worum es geht". Gefunden, weil der Probelauf den Titel nachgelesen hat, statt dem Knopf zu glauben | 22.9.2026, `tests/test-loesungen.js` |
| **B-15** | **Die Kopfzeile lief bei 320px um 50 Pixel über**, als der sechste Knopf dazukam — Querlauf der ganzen Seite, Abmelden ausserhalb des Bildes. Bei der Leitung auch noch bei 390px. Nebenbefund: die Glocke wurde dabei auf 20px zusammengedrückt, weit unter der 44-Pixel-Regel | 22.9.2026, `tests/test-abgeschnitten.js` |
| **B-16** | **`loesungen-basis.js` löste keinen Deploy aus** — die Datei wird ausgeliefert, stand aber in keinem `paths`-Muster des Ablaufs. Änderungen am Grundstock wären nie im Betrieb angekommen | 22.9.2026, `tests/test-ausliefern.js` |
| **B-17** | **„Zurück" führte aus der Trefferliste in eine Kategorie von vorhin.** Wer gesucht, gelesen und zurückgegangen ist, stand plötzlich in einer Liste, die er zehn Minuten vorher geöffnet hatte — und tippte seine Suche noch einmal | 22.9.2026 |
| **B-18** | **`schulungStart` hätte JEDEN Start abgelehnt.** Die Funktion prüfte das Modul gegen die Sammlung `schulungen` — die Module liegen aber als Datei, und die sieht der Server nicht. Solange kein Modul von Hand angelegt ist, also jeden. Die Schranke dieses Weges ist der Code, nicht die Modulkennung; die Prüfung ist raus | 22.9.2026 |
| **B-19** | **Die Code-Anzeige trug zwei `<b>`** — eines um den Namen, eines um den Code. Der Probelauf las prompt den Namen aus und tippte ihn als Code ein. Was eine Prüfung verwechselt, verwechselt auch ein Mensch | 22.9.2026, `tests/test-schulung.js` |
| **B-20** | **Der Hinweis nach einer falschen Antwort stand halb unter dem Bildrand** — bei 390 px gemessen y=776 von 844. Ausgerechnet der Text, der erklären soll, war der einzige, den niemand sah | 22.9.2026 |
| **B-21** | **Die Pfeilknöpfe im Modul-Editor wurden bei 320px auf 41 Pixel gequetscht** — das Auswahlfeld daneben nahm ihnen den Platz. Drei Pixel unter der Regel dieser App; das Feld darf schrumpfen, die Griffe nicht | 22.9.2026 |
| **B-22** | **`▴` als Zeichen für „nach oben"** — `▾` steht in dieser App schon als Auf/Zu-Marke, `▴` wäre ein zweites für dieselbe Sache gewesen. Jetzt dasselbe Zeichen, gedreht. Derselbe Fall wie in Runde 96, diesmal vor dem Durchlauf bemerkt | 22.9.2026 |

| **B-23** | **Zwei verschiedene Zeilen trugen dasselbe Merkmal `data-schmodul`** — die neuen Zeilen unter „Das steht für dich an" und die Modulkarten darunter. Sie haben aber einen anderen Aufbau; der Probelauf suchte alle Modulkarten, fand die neuen mit und brach ab. Ein Merkmal, das zwei Dinge meint, ist keins | 22.9.2026 |
| **B-24** | **Der Probelauf klappte die falsche Zeile zu** — er griff nach dem ersten „Code zeigen"-Knopf der Liste statt nach dem in der offenen Zeile. Die Teilnehmer stehen alphabetisch, die geprüfte Person war nicht die erste. Ergebnis: er öffnete eine zweite Zeile, statt die erste zu schliessen | 22.9.2026 |
| **Entscheidung, kein Fehler** | **Der Schulungs-Code liegt seit heute im Klartext** statt gehasht — auf Ansage aus dem Betrieb. Der Preis steht offen in `functions/index.js`, `docs/DATENBANK.md` und im Handbuch: wer den Code lesen kann, kann die Schulung im Namen dieser Person machen. Lesen darf ihn nur die Leitung und jede Person ihren eigenen | 22.9.2026 |
| **B-25** | **Ein Block der Startseite fiel stumm weg, wenn der Bildschirm nicht reichte** — beim Chef auf 390×844 seit Runde 93 „Offen", also genau die offenen Aufgaben, die auf Wunsch überhaupt erst auf die Startseite gekommen waren. Unbemerkt, weil der Test mit 900 px Höhe misst. Jetzt bleibt ein Knopf unter „Ausserdem" | 23.9.2026 |
| **B-26** | **Die Einblendung der Aufgabenzeilen hielt jede Zeile dauerhaft fest** (`animation-fill-mode: both`) — 61 aktive Animationen auch Sekunden nach dem Öffnen. Dazu liefen der Glanz auf 14 Fortschrittsbalken und das Pulsieren „überfällig" endlos. Zusammen: 12–14 ms Arbeit je Bild beim Scrollen, jetzt 6,8 (CPU ÷4) | 23.9.2026 |
| **B-27** | **Ein Tipp auf die untere Leiste vermass die neue Seite im Mittel rund achtmal** (65 Layouts bei acht Tipps) — der Marker las `offsetLeft` mitten im Aufbau. Im Mittel 194 ms je Tipp (CPU ÷4), jetzt 52 | 23.9.2026 |
| **B-28** | **Das Farbgleiten beim Bereichswechsel berechnete in jedem Bild die ganze Seite neu** (1627 Elemente, 74–98 ms je Bild) — die Farbe glitt mit rund fünf Bildern je Sekunde. Jetzt gleitet nur der Rahmen; die Seite springt in einem Schritt | 23.9.2026 |
| **B-29** | **`--accent-d` war identisch mit `--accent`** — die Textstufe hiess „dunkel", war es aber nicht. Im Hellmodus lagen dadurch drei Stellen unter 4,5:1 (Chip „Alle" 3,86 · offener Kanal 3,93 · „Drucken" 4,19), gemessen an echten Bildpunkten | 23.9.2026 |
| **B-30** | **Ein beim Einpassen gekürzter Block verlor seinen Filter** — der nachträglich eingesetzte Ausgang nahm das Ziel der ersten Zeile, liess den Filter weg und nannte keine Zahl. Ein gekürzter Block „Offen" führte so in die ungefilterte Aufgabenliste | 23.9.2026 |
| **B-31** | **„alle N ›" im obersten Block der Startseite traf nur 35 px hoch** — die Trefferfläche ragt 22 px über die Knopfmitte, der Scroll-Bereich schnitt sie nach 12 ab. Per Hit-Test gemessen, im Bild unsichtbar. Jetzt 45 × 45, auch in der Dichte „kompakt" | 23.9.2026 |
| **B-32** | **Die Studio-Chats waren für den ganzen Betrieb lesbar und beschreibbar** — `kanalErlaubt()` gab für jeden Studio-Kanal `true` zurück; die Oberfläche zeigte nur die eigenen. Mit einem Test belegt, der vorher rot war (6 × „GING DURCH", beide Welten). Jetzt Regel, mit Übergang für Konten ohne `studioKeys` (P-01) | 23.9.2026 |
| **B-33** | **Die Startadresse `/` wurde bis zu einer Stunde zwischengespeichert** — `firebase.json` verbot es nur für `/index.html`, die App öffnet aber `/`. Gemessen: `max-age=3600`, und nach einer Auslieferung kam noch der alte Stand | 23.9.2026 |
| **B-34** | **Die Auslieferung lief mit Node 20**, Lebensende April 2026; die Funktionen verlangen 22 | 23.9.2026 |
| **B-35** | **`docs/av/TOM.md` beschrieb die Studiogrenze schlechter, als sie ist** („nur Oberfläche") — seit dem 17.9. hielt die Regel sie für die Personendaten. Auch eine zu schlechte Beschreibung in einer Vertragsunterlage ist eine falsche | 23.9.2026 |
| **B-36** | **„Braucht Aufmerksamkeit" listete Überfälliges und fehlendes Material je Studio** — beim Chef der Demo 14 Zeilen „N Artikel fehlen", drei Bildschirme lang, und die Studio-Tafel darunter sagte dasselbe noch einmal. Jetzt je Art eine Summe; die Aufschlüsselung steht nur in der Tafel (Bento) | 24.9.2026 |
| **B-37** | **Studios ohne Rückstand standen mit `opacity:.72`** in der Tafel — das drückte den Namen unter 4,5 : 1. Im Bento („klein") volle Schriftfarbe, ruhig durch Fläche statt durch Blässe | 24.9.2026 |
| **B-38** | **Aufgaben mit Frist bekamen im Kalender unter „Ich" nie einen Punkt** — die Reihenfolge der Punkte kannte die Art `aufgabe` nicht, die Zeile stand nur in der Liste. Gefunden beim Herauslösen von `ichPunkteHTML()` für den Wochenstreifen | 24.9.2026 |
| **B-39** | **„Dienst · Hürth" stand bei 320 px in drei Zeilen untereinander** (Ich → Woche) — `.ich-was` hatte `flex:1` ohne Grundbreite und schrumpfte auf gut 40 px | 24.9.2026 |
| **B-40** | **Beim Abhaken federten alle erledigten Haken auf einmal, und das grüne Aufleuchten der Zeile war nie zu sehen** — `.todo.done .check` lief bei jedem Neuzeichnen (15 Federn für eine Aufgabe), und der Horcher ersetzte die Zeile nach 0 ms, bevor `.just-done` ein Bild bekam. Jetzt federt der eine Haken, über das Neuzeichnen hinweg | 24.9.2026 |
| **B-41** | **Neue Inhalte kamen nach einer Auslieferung bis zu einer Woche lang nicht an.** Die Schulungsdatei stand mit `max-age=604800` im Zwischenspeicher, und der Service Worker holte beim Update durch diesen Zwischenspeicher. `VERSION` hochzählen legte also einen neuen Vorrat mit der alten Datei an. Die fünf EMS-Schulungen waren live und „nirgends bei mir“ (aus dem Betrieb). Jetzt holt der Service Worker mit `cache:'reload'`, und die Inhaltsdateien kommen mit `no-cache`. `test-zwischenspeicher` spielt eine Auslieferung durch, mit dem alten Stand als Gegenprobe | 24.9.2026 |
| **B-42** | **Die Team-Seite rollte beim Öffnen von selbst nach unten** (P-12) — zwei Zeitgeber scrollten zum heutigen Tag, 218 px bei der Leitung am Handy; oben verschwand „Wartet auf deine Entscheidung". Jetzt rollt nichts; die vergangenen Tage der Woche stehen am Handy in einer Zeile, am Rechner steht die Woche in sieben Spalten. Nebenbei: ‹ › waren 38 × 44 (kompakt 30), das ✕ an einer Schicht gut 28 × 20 | 24.9.2026 |
| **B-43** | **Die Aufgaben brauchten bis zum ersten Bild zu lange** (P-17) — Stil und Layout für alle Zeilen, auch die unsichtbaren. Jetzt `content-visibility:auto` ab der 13. Zeile; Median 176 → 104 ms (Handy, CPU ÷4) | 24.9.2026 |
| **B-44** | **Kein Korrekturweg für vergessene Stempel** (P-09). Jetzt Verwaltung → Zeiten: die Leitung trägt nach (`zeitNachtragen`) oder markiert als ungültig (`zeitStornieren`), nur mit Grund; der ursprüngliche Stempel bleibt, die Person sieht die Korrektur mit Name und Grund. Die Studioleitung korrigiert ihre eigenen Zeiten nicht selbst | 24.9.2026 |

Die vollständige Fassung mit Begründungen steht in
`docs/FORTSCHRITT.md` — chronologisch, 103 Runden.
