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

## P-01 · Die Studiogrenze ist beim Lesen keine technische Grenze

| | |
|---|---|
| **Schweregrad** | **HOCH** |
| **Status** | Open |
| **Gefunden** | 16.9.2026, beim Erstellen der Rechtsantworten |
| **Betroffen** | Aufgaben, Putzplan, Geräte, Material, Aushänge, Schichten, **Abwesenheiten**, Übergaben, Brett, **Dokumente**, Chat-Kanäle |

**Was ist das Problem?** Die Leseregel prüft für diese Sammlungen nur,
ob jemand ein freigegebenes Konto **dieses Betriebs** hat — nicht, zu
welchem Studio er gehört:

```
allow read: if inFirma(f) && istAktiv();
```

**Warum ist es relevant?** Unter den Abwesenheiten stehen
**Krankmeldungen** — Gesundheitsdaten nach Art. 9 DSGVO, die
empfindlichste Kategorie im System. Sie sind damit für jeden
freigegebenen Beschäftigten des Betriebs lesbar, nicht nur für dessen
Studio.

**Was könnte passieren?** Wer die Anwendung umgeht und direkt mit der
Datenbank spricht, kommt an die Daten anderer Studios **seines eigenen
Betriebs**. Über Betriebsgrenzen hinweg nicht — dort hält die Grenze.

**Wie beheben?** Zwei Stellschrauben:

1. Kollegen nur „abwesend" ohne Grund anzeigen — die Unterscheidung
   Urlaub/Krank bliebe der Leitung vorbehalten.
2. Die Leseregel um eine Studioprüfung ergänzen.

**Der Preis von (2):** Firestore weist eine Abfrage komplett ab, sobald
auch nur ein Treffer nicht gelesen werden dürfte. Die Anwendung müsste
an jeder betroffenen Stelle gefiltert abfragen. Arbeit, aber kein Umbau.

> **`docs/av/TOM.md` enthält eine Tabelle („Mitarbeiter — die eigenen
> zugeordneten Studios"), die nach diesem Fund zu weit gefasst ist und
> vor der Weitergabe berichtigt werden muss.**

---

## P-02 · Kein Verfahren für Datenschutzvorfälle

| | |
|---|---|
| **Schweregrad** | **HOCH** |
| **Status** | Open |
| **Betroffen** | Organisation, nicht Code |

Art. 33 DSGVO verlangt die Meldung an die Aufsichtsbehörde binnen **72
Stunden**; Art. 33 Abs. 2 verpflichtet den Auftragsverarbeiter, den
Verantwortlichen **unverzüglich** zu informieren.

Es fehlt: eine benannte Person, ein Meldeweg zu jedem Kunden, eine
Vorlage, ein Ort für die Dokumentation.

**Aufwand:** klein. Eine Seite, eine Adresse, eine Vorlage.
**Als Lücke:** die ernsteste organisatorische in dieser Liste.

---

## P-03 · Google Fonts werden extern nachgeladen

| | |
|---|---|
| **Schweregrad** | **MITTEL** |
| **Status** | Open |
| **Betroffen** | `index.html` |

*Barlow* und *Barlow Condensed* kommen von `fonts.googleapis.com` und
`fonts.gstatic.com`. Dabei geht die IP-Adresse des Besuchers an Google.

**Die einzige Stelle im System, an der ohne Not Daten an einen Dritten
gehen.** Das LG München I hat 2022 (3 O 17493/20) entschieden, dass das
ohne Einwilligung einen Unterlassungsanspruch begründen kann; die
Rechtsprechung ist nicht einheitlich.

**Wie beheben?** Die Schriften lokal ausliefern. Es sind zwei Familien.
Danach läuft die Anwendung **ohne jeden Drittabruf**.

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

Die vollständige Fassung mit Begründungen steht in
`docs/FORTSCHRITT.md` — chronologisch, 90 Runden.
