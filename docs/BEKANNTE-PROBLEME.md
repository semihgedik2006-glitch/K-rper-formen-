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
| **Status** | **Für die Personendaten behoben am 17.9.2026.** Für den Rest: **bewusst offen** |
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

### Ebenfalls offen: Dokumente, Brett, Chat-Kanäle

Die liegen nicht unter `studios/<key>/`, sondern direkt beim Betrieb.
Eine Studiogrenze gäbe es dort nur über ein Feld im Dokument, und das
ist eine andere Aufgabe als diese hier. **NICHT GEPRÜFT**, ob sie nötig
ist.

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
| **Keine Vertretung** | Ein Einzelunternehmen hat keine Meldekette. Fällt die eine Person aus, meldet niemand — und die Frist des Kunden läuft weiter. |
| **Ein einziger Meldeweg** | Eine E-Mail-Adresse. Ist das Postfach Teil des Vorfalls, gibt es keinen zweiten. |
| **Die Behördenanschrift fehlt** | Bewusst: eine veraltete Adresse in einer Notfallvorlage ist schlimmer als keine. |
| **Nie erprobt** | Ein Verfahren, das nie gelaufen ist, ist eine Annahme. Ein Trockenlauf dauert eine Stunde. |

**Aufwand für den Rest:** die Vertretung ist eine Entscheidung, kein
Schreibvorgang.

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
| **Status** | Open |

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
| **Status** | Open |
| **Gemessen** | altes Design 235 px, neues 239 px |

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

Die vollständige Fassung mit Begründungen steht in
`docs/FORTSCHRITT.md` — chronologisch, 94 Runden.
