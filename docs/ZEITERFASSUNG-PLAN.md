# Zeiterfassung — Plan

Stand 15. September 2026 · **Schritte 1 bis 5 gebaut**, davon 1 bis 4
ausgerollt und in der Demo (`index.html?demo=terminal`) bedienbar.
Alles ab 6 steht noch aus. Der Nachtrag am Ende beschreibt das
Stempeln mit dem eigenen Handy — entschieden, noch nicht gebaut.

---

## Warum

Zwei Gründe, und der zweite ist der wichtigere.

**Der Markt.** Ordio nimmt 89 € je Standort, Papershift 4–9 € je Kopf
plus Pauschale. StudioChat steht bei 15–25 € je Studio. Der Unterschied
ist nicht Frechheit — es ist **Zeiterfassung**. Sie verkaufen die
Erfüllung einer Pflicht, wir verkaufen bisher nur Organisation.

**Die Pflicht.** Seit dem EuGH-Urteil von 2019 und dem Beschluss des
Bundesarbeitsgerichts von 2022 sind Arbeitgeber in Deutschland
verpflichtet, Arbeitszeiten vollständig und nachvollziehbar zu erfassen —
**auch ohne eigenes Gesetz**. Ein Arbeitszeiterfassungsgesetz ist im
Juni 2026 als Referentenentwurf bekannt geworden, steht aber noch nicht
im Bundesgesetzblatt.

Jeder künftige Kunde hat diese Pflicht bereits. Heute kann StudioChat sie
nicht bedienen: der Schichtplan ist ein Plan, keine Stechuhr.

---

## Was entschieden ist

| Frage | Entscheidung |
|---|---|
| Wie wird gestempelt? | **Tablet am Empfang + PIN je Person** (Terminal) |
| Gehört die Zeiterfassung zur Basis? | **Ja.** Stempeln kann jeder Kunde |
| Was ist dann Premium? | **Auswertung und Lohn-Export** — und was daraus folgt |

> **Die zweite Entscheidung ist die klügere von beiden.** Stempeln in die
> Basis zu legen heißt: „erfüllt die Aufzeichnungspflicht" gilt für
> **jeden** Kunden und nicht nur für den teureren. Das ist ein Satz, den
> man im ersten Gespräch sagen kann. Was daraus wird — Arbeitszeitkonto,
> Überstunden, Lohn-Export, Auswertung — kostet extra, und das versteht
> jeder sofort.

---

## Wie es laufen soll

### Der Terminal-Modus

Ein Tablet oder ein alter Rechner am Empfang wird als **Terminal für ein
bestimmtes Studio** registriert. Darauf läuft die App in einem eigenen
Modus:

1. Liste der Personen dieses Studios, groß und mit Bild.
2. Antippen → PIN eingeben (vier Ziffern).
3. Der Knopf zeigt, was als Nächstes dran ist: **Kommen**,
   **Pause**, **Zurück**, **Gehen**.
4. Bestätigung mit Uhrzeit, fertig. Kein Menü, keine Untermenüs.

**Das ist die Ortsbindung, um die du gebeten hast** — und zwar eine
physische: wer stempeln will, muss am Gerät im Studio stehen.

### Warum nicht über den Standort

Crewmeister bietet zusätzlich GPS im Moment des Stempelns an. Für uns
wäre das ein Rückschritt:

* In `docs/av/LOESCHKONZEPT.md` steht ausdrücklich **„Keine
  Standortdaten"** — als Eigenschaft, nicht als Zufall.
* Die App sperrt Ortung heute per Kopfzeile
  (`Permissions-Policy: geolocation=()`).
* Standortdaten von Beschäftigten sind eine neue Datenkategorie, ein
  Punkt für den Betriebsrat und eine Zeile mehr im AV-Vertrag.

Ein Tablet am Empfang leistet dasselbe, ohne irgendetwas davon.

### Was das Terminal NICHT verhindert

**Ein Kollege, der die PIN kennt, kann für jemanden mitstempeln.** Das
ist bei jedem PIN-System so, auch bei Crewmeister. Wir bauen keine
Gesichtserkennung und keinen Fingerabdruck.

Was das Terminal verhindert, ist das Stempeln **von zu Hause** oder
**auf dem Weg** — und das ist der Fall, um den es praktisch geht.

Das gehört so gesagt und nicht verschwiegen: eine Absicherung, die man
für lückenlos hält, ist gefährlicher als eine, deren Lücke man kennt.

---

## Was der Chef davon hat

### Soll gegen Ist im Schichtplan

Die Schicht zeigt künftig beides: **geplant 09:00–14:00, tatsächlich
09:04–14:22**. Abweichungen sichtbar, ohne dass jemand nachrechnen muss.

### Wie lange war der Laden unbeaufsichtigt

Deine Idee, und die beste in diesem Plan. Für jeden Tag und jedes Studio:
Zeiträume innerhalb der Öffnungszeit, in denen **niemand** eingestempelt
war.

> **Dafür fehlt etwas, das es noch nicht gibt: Öffnungszeiten je
> Studio.** Nachgesehen — weder in der App noch in `konfig.js`. Ohne sie
> lässt sich „unbeaufsichtigt" nicht berechnen, denn nachts ist
> niemand da und das ist richtig so. Also gehören sie mit in diese
> Runde: je Studio und Wochentag eine Von-Bis-Zeit.

### Warnungen nach dem Arbeitszeitgesetz

Nachgeschlagen am 14.9., nicht aus dem Gedächtnis:

| Regel | Was das Gesetz sagt |
|---|---|
| **§ 3 ArbZG** | werktäglich höchstens 8 Stunden, Verlängerung auf 10 Stunden möglich |
| **§ 4 ArbZG** | Pause **30 Minuten** bei mehr als 6 bis 9 Stunden, **45 Minuten** bei mehr als 9 Stunden. Niemand länger als 6 Stunden ohne Pause |
| **§ 5 ArbZG** | **11 Stunden** ununterbrochene Ruhezeit nach Arbeitsende |

Die App kann anschlagen, wenn eine dieser Grenzen gerissen wird. **Was
sie nicht tut: behaupten, der Betrieb sei damit gesetzeskonform.**
Dieselbe Grenze wie bei den AV-Unterlagen — wir zeichnen auf und weisen
hin; ob das der Pflicht genügt, entscheidet der Kunde mit seinem Anwalt.

---

## Wie die Sicherheit gebaut wird

Das ist der Teil, an dem ein Zeiterfassungssystem steht oder fällt.

### Die PIN darf niemand lesen können

**Nicht der Kollege, nicht die Leitung, nicht der Chef, nicht das
Terminal.** Sonst kann jeder für jeden stempeln, und die ganze Erfassung
ist wertlos.

Deshalb:

* Gespeichert wird **nie die PIN**, sondern ein Hash mit zufälligem
  Salz.
* Er liegt an einem Ort, den die Regeln **für alle sperren** — auch für
  den Eigentümer. Lesen muss ihn niemand; prüfen tut ihn der Server.
* Geprüft wird in einer Cloud Function mit `timingSafeEqual`, damit die
  Antwortdauer nicht verrät, wie viele Ziffern stimmen. Genau der Weg,
  den der Kalender-Abo-Link schon geht.
* Setzen und Ändern darf nur die Person selbst — über eine Funktion, die
  den alten Wert nicht herausgibt.

### Das Terminal muss sich ausweisen

Ein registriertes Terminal bekommt ein **Geheimnis je Gerät**, das der
Chef beim Einrichten einmal sieht. Es liegt lokal im Gerät. Die
Stempel-Funktion prüft: gehört dieses Geheimnis zu diesem Studio?

Ein Geheimnis je Gerät und nicht eines für alle — sonst hinge der ganze
Betrieb an einem Wert, und ein verlorenes Tablet zwänge dazu, alle
anderen neu einzurichten. Dieselbe Begründung wie beim Kalender-Link.

### Gestempelt wird nur über den Server

Kein Schreibweg aus dem Browser in die Zeitdatensätze. **Niemand** darf
Zeiten anlegen oder ändern — auch der Chef nicht direkt.

Der Grund ist nicht Misstrauen, sondern Beweiswert: eine Aufzeichnung,
die sich nachträglich beliebig ändern lässt, ist als Nachweis nichts
wert. Korrekturen laufen deshalb über einen eigenen Weg:

* Der Chef **korrigiert nicht**, er legt eine **Korrektur an**, mit
  Grund und Zeitpunkt.
* Der ursprüngliche Eintrag bleibt stehen und bleibt sichtbar.
* Die Person sieht ihre eigenen Korrekturen.

Das ist mehr Arbeit als ein Bearbeiten-Stift und der einzige Weg, der
einer Prüfung standhält.

---

## Die Premium-Stufe

Entschieden: **Stempeln ist Basis. Was daraus wird, ist Premium.**

| # | Funktion | Stand | Warum sie trägt |
|---|---|---|---|
| 1 | **Auswertung, Excel-Export, Monatsbericht** | gebaut | bereits als Premium vorgesehen |
| 2 | **Nachweise mit Ablaufwarnung** | gebaut | echtes Schloss in den Regeln; Compliance, jemand haftet |
| 3 | **Arbeitszeitkonto mit Überstunden** | neu | Soll gegen Ist je Person, Plus- und Minusstunden. Die Zahl, nach der ein Chef als Erstes fragt |
| 4 | **Lohn-Export für den Steuerberater** | neu | Monatsdatei mit Stunden je Person. Braucht die Zeiterfassung als Grundlage |
| 5 | **Urlaubskonto mit Resturlaub** | neu | gibt es heute **nicht** — nachgesehen. Die App kennt Anträge, aber keinen Anspruch und keinen Rest |
| 6 | **Abdeckung: wann war der Laden unbeaufsichtigt** | neu | braucht Öffnungszeiten je Studio |
| 7 | **Warnungen nach dem Arbeitszeitgesetz** | neu | Pause vergessen, über zehn Stunden, Ruhezeit unter elf |
| 8 | **Echter Dateispeicher** | neu | hebt die 0,7-MB-Grenze. Kostet Geld je GB, erklärt den Aufpreis von selbst |

**Der Satz für das Verkaufsgespräch:**
*„Basic: der Laden läuft und die Zeit wird erfasst. Premium: was aus der
Zeit folgt — Konten, Lohn, Urlaub, Auswertung."*

> **Eine Falle bleibt, und sie steht schon seit August im Abo-Plan:**
> eine Funktion wegzunehmen, die ein Kunde bereits benutzt, geht nicht
> gut aus. Die Auswertung und die Nachweise gibt es heute für alle.
> Entweder die Stufen kommen, **bevor** jemand Kunde wird — oder
> Bestandskunden behalten dauerhaft, was sie hatten.
>
> Bei eurem eigenen Betrieb heißt das: ihr behaltet alles.

---

## Was neu in die Datenbank kommt

| Sammlung | Inhalt |
|---|---|
| `zeiten` | ein Datensatz je Stempelvorgang: uid, Studio, Art (kommen/pause/zurück/gehen), Zeitpunkt, Terminal |
| `zeitKorrekturen` | Korrekturen mit Grund, Urheber und Zeitpunkt — der Urbestand bleibt |
| `terminals` | registrierte Geräte je Studio, mit Hash des Geräte-Geheimnisses |
| `privat/<uid>/pinHash` | Hash der PIN, **für alle gesperrt**, geprüft nur vom Server |
| `config/oeffnungszeiten` | je Studio und Wochentag von–bis |
| `urlaubskonto` | Anspruch je Jahr und Person, Übertrag, verbraucht |

Jede davon braucht eigene Regeln und eigene Prüfungen im Regel-Durchlauf.

### Warum in `zeiten` auch ein Feld `monat` steht

Weil dieses Projekt **keinen einzigen zusammengesetzten Index
verwaltet**: es gibt keine `firestore.indexes.json`, und `firebase.json`
rollt nur Regeln aus. Firestore verlangt einen solchen Index, sobald
eine Abfrage Gleichheitsfilter mit einer Sortierung oder einem Bereich
auf einem **anderen** Feld verbindet. Mehrere Gleichheitsfilter allein
bedient es aus den Einzelfeld-Indizes.

Deshalb wird monatsweise abgefragt (`uid ==`, `monat ==`) statt über
einen Zeitraum auf `tag`. Im ganzen `index.html` gibt es aus demselben
Grund keine einzige Abfrage mit `where` **und** `orderBy` — die Notiz
bei `papierkorbLaden` sagt es seit Langem.

> **Beim Nachlesen gefunden:** genau diese Falle stand seit dem Ausrollen
> des Stempelns in `stempeln` — `where uid == … where tag == …
> .orderBy('ts','desc')`. Im Emulator läuft das, weil der Indizes
> stillschweigend anlegt; in der Produktion wäre der **allererste
> Stempel** mit `FAILED_PRECONDITION` gescheitert. Nachgeschlagen am
> 14.9. in der Firestore-Dokumentation, nicht aus dem Gedächtnis.
> **Behoben am 15.9. mit Schritt 5:** die Handvoll Einträge eines Tages
> wird geholt und das Maximum in JS gesucht. `tests/test-meine-zeiten.js`
> hält die Regel fest — eine Abfrage auf `zeiten` mit `orderBy` macht
> ihn rot. Gegenprobe gemacht: `orderBy` wieder eingesetzt, Durchlauf
> rot.
>
> Nachweisen liess sich der Fehlschlag selbst nicht: der Emulator legt
> fehlende Indizes stillschweigend an und kennt die Grenze gar nicht.
> Der Beleg ist die Firestore-Dokumentation, nicht eine Messung — das
> gehört dazugesagt.

---

## Reihenfolge

1. ✅ **Öffnungszeiten je Studio** — klein, unabhängig, wird später
   gebraucht.
2. ✅ **PIN setzen und prüfen** — Server-Funktion, Regeln, Prüfungen.
   Ohne das geht nichts weiter.
3. ✅ **Terminal registrieren** — Chef richtet ein Gerät ein.
4. ✅ **Stempeln** — der Terminal-Bildschirm und die Schreibfunktion.
5. ✅ **Eigene Zeiten sehen** — jede Person im Ich-Bereich.
6. **Soll gegen Ist im Schichtplan**.
7. **Korrekturen** durch die Leitung, mit Grund.
8. **Abdeckung und Warnungen** — braucht 1 und 4.
9. **Arbeitszeitkonto**, dann **Lohn-Export**, dann **Urlaubskonto**.

Die Punkte 1 bis 5 sind die Zeiterfassung. Alles ab 8 ist Premium.

---

## Was ich dabei nicht leisten kann

* **Die Zusage, dass damit die Aufzeichnungspflicht erfüllt ist.** Die
  App kann aufzeichnen. Ob die Aufzeichnung genügt, entscheidet der
  Kunde mit seinem Anwalt.
* **Die Beurteilung, ob eine Betriebsvereinbarung nötig ist.**
  Arbeitszeiterfassung ist Leistungs- und Verhaltenskontrolle und damit
  mitbestimmungspflichtig, wo ein Betriebsrat besteht (§ 87 BetrVG).
* **Lohnabrechnung.** Der Export liefert Stunden. Was daraus an Lohn
  wird, rechnet der Steuerberater.

---

## Was das für den Preis heißt

Mit Zeiterfassung steht StudioChat zum ersten Mal im selben Regal wie
Ordio und Papershift. Der Preis von 15–25 € je Studio war für ein
Organisationswerkzeug angesetzt.

**Das ist eine Entscheidung und keine Rechnung** — aber sie steht an,
sobald Punkt 5 der Reihenfolge fertig ist, und nicht erst danach.

---

## Nachtrag 15.9. — Stempeln mit dem eigenen Handy

Entschieden von Semih aus vier vorgelegten Wegen: **QR-Code am Studio**
(Weg 1) **und Freigabe je Konto** (Weg 4). Gegen GPS, nachdem drei
Dinge auf dem Tisch lagen:

1. Browser-GPS ist in Minuten gefälscht (Entwicklerwerkzeuge,
   Mock-Location-Apps). Es leistet nicht, wofür das Tablet da ist.
2. **Die AGB sind der falsche Hebel.** Das sind Daten der
   *Beschäftigten*, nicht der Kunden. Ein Vertrag zwischen StudioChat
   und dem Betrieb erlaubt keine Verarbeitung von Beschäftigtendaten;
   dafür braucht es eine Rechtsgrundlage, Transparenz nach Art. 13 und
   — wo ein Betriebsrat besteht — die Mitbestimmung nach § 87 Abs. 1
   Nr. 6 BetrVG.
3. „Keine Standortdaten" steht als Zusage in `LOESCHKONZEPT.md`,
   `TOM.md`, im Verarbeitungsverzeichnis und als Kopfzeile
   `Permissions-Policy: geolocation=()`.

### Wie es gebaut wird

Ein Kombinationsschloss aus zwei Teilen:

* **Der Chef schaltet es je Konto frei** (`handyStempeln` am
  Personendatensatz, gesetzt im Personen-Bearbeiter unter Verwaltung →
  Team). Ohne Freigabe geht nur das Tablet.
* **Der Code vom Bildschirm im Studio.** Das Terminal zeigt einen Code,
  der alle 30 Sekunden wechselt. Wer stempeln will, tippt ihn auf dem
  eigenen Handy ein. Das ist die Ortsbindung — ohne ein einziges
  Standortdatum.

Die Person weist sich durch ihr **angemeldetes Konto** aus. Eine PIN
braucht es dabei nicht: am Tablet ist sie nötig, weil das Gerät allen
gehört; das eigene Handy ist schon angemeldet.

### Kein QR-Bild, sondern sechs Ziffern — und warum

Ein QR-Code bräuchte eine Bibliothek. Die CSP dieser App erlaubt keine
fremden Skripte, und ein QR-Erzeuger im eigenen Code wären zweihundert
Zeilen, die nichts tragen, was sechs Ziffern nicht auch tragen.

**Der Code ist das Geheimnis, nicht seine Darstellung.** Sechs Ziffern
abtippen dauert vier Sekunden, braucht keine Kamera-Freigabe und
funktioniert auf jedem Telefon. Ein QR lässt sich später darüberlegen —
als Bequemlichkeit, mit demselben Code dahinter.

### Was dieser Weg NICHT verhindert

Wer den Code abfotografiert und weitergibt, kann innerhalb des
Zeitfensters von woanders stempeln. Dreißig Sekunden reichen dafür, wenn
jemand daneben steht und wartet.

Das gehört gesagt und nicht verschwiegen — genauso wie beim Tablet, wo
ein Kollege mit bekannter PIN mitstempeln kann. Eine Absicherung, die
man für lückenlos hält, ist gefährlicher als eine, deren Lücke man
kennt.

### Eine Falle in den Regeln, vorab notiert

`firestore.rules` sperrt beim Selbst-Bearbeiten genau diese Felder:
`role`, `studios`, `studio`, `studioKeys`, `aktiv`, `firma`, `admin`.
**`handyStempeln` muss in dieselbe Liste** — sonst schaltet sich jede
Person die Freigabe in der Browser-Konsole selbst frei, und die ganze
Freigabe ist eine Anzeige ohne Schloss.
