# Design-Ideen

Stand: 26. August 2026. **Neun davon sind gebaut** — 1, 2, 3, 7, 8, 9,
14 und 27, plus 30 und 13 in anderer Form. Sie sind unten abgehakt; die
Begründungen bleiben stehen, auch dort, wo sie sich als falsch
herausgestellt haben. Was aus ihnen wurde, steht in `FORTSCHRITT.md`,
Runde 55 und 56.

**Drei meiner Begründungen waren falsch** (27, 30, 13). Zu jeder steht
unten ein Nachtrag mit dem, was tatsächlich gemessen wurde. Sie stehen
absichtlich noch da: eine Ideenliste, aus der man die Irrtümer
herausstreicht, sieht klüger aus, als sie war.

Ursprünglicher Stand: 24. August 2026. Dreißig Vorschläge, **alle aus Bildschirmfotos der
laufenden App abgeleitet**, nicht aus einem Gestaltungskatalog. Zu jedem
steht, was er kostet und was dagegen spricht.

`IDEEN.md` daneben sammelt *Funktionen*. Hier geht es nur darum, wie sich
das anfühlt, was schon da ist.

Ursprünglich war nichts davon gebaut. Sechs Punkte tragen inzwischen
eine Marke oben — der Rest ist weiterhin Auswahlliste.

---

## Der eine Befund, aus dem die Hälfte folgt

Auf der Startseite haben **Einrichtung**, **Mein Dienst**, **Von der
Leitung** und **Übergabe** exakt dieselbe Fläche, denselben Rahmen,
denselben Schatten und dieselbe Überschrift in Versalien. Der einzige
Unterschied im ganzen Bild sind die drei Warnbalken dazwischen — die
haben eine farbige Kante.

**Wenn alles gleich laut ist, ist nichts laut.** Eine Karte, die man
einmal im Quartal braucht (Einrichtung), sieht aus wie die, die man
jeden Morgen liest (Übergabe). Die Punkte 1–6 gehen alle darauf zurück.

---

## A · Rangfolge und Dichte

### 1. Karten in drei Gewichten statt einem  ✅ *gebaut (25.8.)*

Heute gibt es genau eine `.card`. Vorschlag: `.card stumm` (flach, kein
Schatten — zum Nachschlagen), `.card` (wie heute) und `.card jetzt`
(farbige Kante plus `--e2` — was heute dran ist).

*Aufwand: klein.* **Dagegen:** jede Karte muss zugeordnet werden, und
falsch zugeordnet ist schlimmer als gar nicht. Wenn „Einrichtung" laut
bleibt, hat man nichts gewonnen.

### 2. Nicht mehr alles in Versalien  ✅ *gebaut (25.8.)*

`EINRICHTUNG · MEIN DIENST · VON DER LEITUNG · ÜBERGABE · AUFGABEN ·
HÜRTH` — jede Überschrift schreit. Versalien liest man messbar langsamer,
und sie können nichts mehr betonen, wenn alles sie hat.

Vorschlag: Versalien nur noch für die **Seitenüberschrift**, Kartentitel
in normaler Schreibung mit Gewicht 700.

*Aufwand: klein, aber überall sichtbar.*

### 3. Der Seitenkopf ist zu hoch  ✅ *gebaut (26.8.)*

In „Aufgaben" stehen **fünf Schichten** übereinander, bevor die erste
Aufgabe kommt: Titel, Untertitel, Suchfeld, Filterzeile,
Fortschrittsbalken. Auf einem 430er-Handy beginnt der Inhalt bei 30 %.

Vorschlag: den Untertitel beim Scrollen ausblenden (`.tight` gibt es
schon), das Suchfeld erst auf die Lupe hin.

*Aufwand: klein.* **Dagegen:** ein verstecktes Suchfeld kostet einen
Tipp — bei langen Listen der falsche Tausch.

### 4. Fortschritt als Ring, nicht als Text

„2 von 5 offen" und „1 von 3 erledigt" muss man lesen. Ein 20-px-Ring
daneben sieht man.

*Aufwand: klein* — ein SVG-Kreis mit `stroke-dasharray`.

### 5. Dichte-Schalter: kompakt / normal

Für einen Chef mit 14 Studios ist die heutige Luftigkeit teuer, für den
Trainer am Empfang ist eng zu eng. Ein Schalter, der die Abstandsleiter
um einen Faktor skaliert.

*Aufwand: klein*, weil `--s1 … --s72` schon eine Leiter ist.

### 6. Reiter und Filter sehen gleich aus

Im Aufgabenbereich ist **„Aufgaben"** (Navigation) eine gefüllte Pille —
und **„Alle"** (Filter) auch. Zwei Bedeutungen, ein Aussehen.

Vorschlag: Filter bleiben Pillen, Navigations-Reiter bekommen einen
Unterstrich statt der Füllung.

*Aufwand: mittel*, der gleitende Marker muss mit.

---

## B · Chat — der meistbenutzte Bildschirm

### 7. Der Audio-Player ist ein Fremdkörper  ✅ *gebaut (25.8.)*

Sprachnachrichten benutzen den **eingebauten Browser-Player**: weiß,
eckig, eigene Typografie, mitten in einer dunklen Blase. Das ist die
auffälligste Stelle der ganzen App, an der die Gestaltung aufhört.

Vorschlag: eigener Player mit Wellenform, Abspielknopf in Markenfarbe,
Dauer, Tempo 1× / 1,5×.

*Aufwand: mittel.* **Bringt pro Zeile Code am meisten fürs Auge.**

> **Nachtrag 25.8.: gebaut, aber OHNE Wellenform** — und das war eine
> Entscheidung, keine Abkürzung. Um sie ehrlich zu zeichnen, müsste man
> die Datei dekodieren und die Amplituden auslesen, je Nachricht, mit
> Codecs, die nicht überall gehen. Der billige Weg wäre, aus der
> Nachrichten-Kennung Pseudozufall zu ziehen und Balken zu malen. Das
> sieht aus wie eine Messung, ist aber keine.
>
> Stattdessen: echter Fortschritt, echte Zeit, echtes Tempo (1× / 1,5× /
> 2×), Schieber als `input[type=range]`, damit Tastatur und
> Vorlesegeräte springen können. Eine echte Wellenform bleibt als
> eigener Punkt offen.

### 8. Fünf Leisten über der ersten Nachricht  ✅ *gebaut (26.8.)*

Reiter · „Meldungen an?" · Studios/Gruppen · Kanalreihe · angeheftete
Nachricht. Das Gespräch beginnt bei 45 % der Bildschirmhöhe.

Vorschlag: „Meldungen an?" nach dem ersten Wegtippen nur noch in den
Einstellungen; Studios/Gruppen und Kanalreihe in **eine** Zeile.

*Aufwand: mittel.*

> **Nachtrag 26.8.: die Hälfte gebaut.** „Meldungen an?" (58px) lässt
> sich wegtippen und bleibt weg — mit Ersatzweg in den Einstellungen,
> ohne den es eine Sackgasse geworden wäre. Studios/Gruppen und
> Kanalreihe sind **nicht** zusammengelegt: das sind zwei verschiedene
> Fragen (welche Art, welcher Kanal), und in eine Zeile gequetscht
> hätte man vierzehn Studios hinter dem Umschalter versteckt.
>
> Dazu die Zahl, die vorher fehlte: bei 740px Bildschirmhöhe bekommt das
> Gespräch **35 %** — 260 von 740 Pixeln.

### 9. Eigene Nachrichten deutlicher  ✅ *gebaut (26.8.)*

Heute sind sie nur leicht eingerückt und getönt. Vorschlag: eigene Blase
in `--tipp-1`, fremde in `--bg-2`, dazu eine kleine Sprechblasen-Ecke.

*Aufwand: klein.*

### 10. Datumstrenner kleben lassen

„Heute" / „Gestern" gibt es. Beim Scrollen oben festkleben, dann weiß man
immer, wo man zeitlich steht.

*Aufwand: klein.*

### 11. Gelesen-Häkchen

Ein Haken gesendet, zwei gelesen.

*Aufwand: mittel.* **Dagegen — und das ist ernst:** ein Schreibvorgang je
Leser je Nachricht. Bei 57 Konten und einem lebhaften Kanal ist das
nachzurechnen, **bevor** es gebaut wird, nicht danach. Und es ist ein
weiteres Stück Sichtbarkeit über Personen.

### 12. Antwort-Vorschau anklickbar

Tippen springt zur Originalnachricht und hebt sie kurz hervor.

*Aufwand: klein.*

---

## C · Zustände — was man sieht, wenn nichts da ist

### 13. Skelette statt leerer Flächen  ⚠️ *Annahme war falsch (26.8.)*

Beim Start ist kurz alles leer. Drei graue Balken in Kartenform wirken
schneller, obwohl nichts schneller ist.

*Aufwand: klein.*

> **Nachtrag 26.8.: die Annahme stimmt nicht.** Die Startseite ist
> vollständig aufgebaut, sobald man sie sieht. Verdeckt wurde sie von
> etwas anderem: der Startbildschirm lag auf einem **festen Zeitgeber
> von 3200 ms** und wartete nicht auf die App.
>
> ```
> vorher   2611 ms
> nachher   832 ms
> ```
>
> Skelette hätten das kaschiert, statt es zu beheben — die Lösung für
> ein Problem, das es nicht gab. Eine echte Ladeanzeige bleibt trotzdem
> offen für den Fall, dass die Datenbank langsam ist; nur ist das ein
> anderer Fall als der Start.

### 14. Leere Zustände mit nächstem Schritt  ✅ *gebaut (25.8.)*

„Noch keine Mitarbeiter angelegt" ist eine Feststellung. „Noch niemand da
— **Zugang anlegen**" ist ein Weg.

*Aufwand: klein, aber an vielen Stellen.*

### 15. Offline sichtbar machen, nicht nur melden

Die Leiste oben gibt es. Zusätzlich: Karten, deren Daten aus dem
Zwischenspeicher kommen, leicht entsättigen.

*Aufwand: mittel.* **Dagegen:** wenn man es falsch trifft, verwirrt es
mehr, als es hilft.

### 16. Fehler gehören in die Liste, nicht in einen Toast

Ein Toast ist nach drei Sekunden weg. Wenn eine Liste nicht laden konnte,
gehört das dorthin, wo die Liste wäre — mit „nochmal versuchen".

*Aufwand: mittel.*

---

## D · Bewegung

### 17. Ansichtswechsel mit Richtung

Heute blendet die neue Ansicht ein. Innerhalb einer Gruppe seitwärts
schieben — in der Richtung, in der der Reiter liegt. Man merkt sich
dadurch, wo man ist.

*Aufwand: mittel.* Bei `prefers-reduced-motion` aus — das kann die App
schon.

### 18. Zahlen zählen hoch

Startseiten-Kacheln, „2 von 5". 400 ms.

*Aufwand: klein.*

### 19. Abhaken mit Gewicht

Funken und Lob gibt es. Es fehlt, dass die Karte kurz zusammensackt,
bevor sie nach „erledigt" wandert.

*Aufwand: klein.*

### 20. Wischen zum Antworten im Chat

Nach rechts ziehen. Kennt jeder.

*Aufwand: mittel.*

### 21. Zum Aktualisieren ziehen

**Dagegen, und ich würde es lassen:** die App horcht live, es gäbe nichts
zu aktualisieren. Eine Geste, die nichts tut, ist schlimmer als keine.
Sinnvoll nur dort, wo einmalig geladen wird — Übergabe und Archiv.

*Aufwand: mittel.*

---

## E · Identität

### 22. Die Firmenfarbe darf mehr

`markeAnwenden()` gibt es, aber `--brand` ist überall derselbe Verlauf.
Die Firmenfarbe könnte den Verlauf färben, nicht nur Details.

*Aufwand: klein.* **Dagegen:** je Farbe den Kontrast nachrechnen, sonst
wird der Hauptknopf unlesbar. Ohne diese Rechnung nicht bauen.

### 23. Studio-Farbe

14 Studios, alle gleich grau. Je Studio ein fester Ton **aus einer
Leiter** (nicht frei wählbar) an Marke, Kanal und Schicht. Man erkennt
sein Studio dann am Rand des Auges.

*Aufwand: mittel.*

### 24. Avatare ohne Grellheit

Das grüne „TC" in der Kopfzeile sticht heraus wie ein Warnlicht — und
steht direkt neben dem Bericht-Knopf, der eigentlich der lauteste sein
soll.

Vorschlag: Avatarfarben nicht frei, sondern aus einer abgestimmten
Leiter. Oder milder: nur die Sättigung deckeln.

*Aufwand: klein.* **Dagegen:** man nimmt Leuten ihre Farbe weg.

### 25. Ein blasses Bereichszeichen hinter dem Seitentitel

Rein dekorativ. **Ehrlich: der schwächste Punkt dieser Liste** — steht
nur drin, weil er billig ist.

---

## F · Kleinigkeiten, die sofort wirken

### 26. Die Kamera in der Aufgabenzeile ist versteckt

Klein, grau, unten rechts — dabei ist sie der schnellste Weg, einen
Schaden zu belegen. Solange die Aufgabe offen ist: „Foto" danebenschreiben.

*Aufwand: winzig.*

### 27. Zahlen tabellarisch setzen  ✅ *gebaut (25.8.) — war fast schon fertig*

`font-variant-numeric: tabular-nums` überall, wo Zahlen untereinander
stehen: Uhrzeiten in „Mein Dienst", Bestände im Material, Zähler im
Bericht. Heute springen die Spalten.

*Aufwand: winzig, Wirkung sofort.*

> **Nachtrag 25.8.: war größer angekündigt als er war.** Ein Durchlauf
> über neun Ansichten hat gesucht, wo Zahlen *untereinander* stehen —
> nicht, wo Zahlen vorkommen. `tabular-nums` war schon an allen
> relevanten Stellen gesetzt; ein einziger echter Fund (`.pcount`), dazu
> die Material-Felder und die Zeitspalte der Direktnachrichten. „Der
> beste Aufwand-Nutzen-Punkt der Liste" stand hier zu Recht — nur war
> der Nutzen bereits eingesammelt.

### 28. Eine Regel für Datum und Uhrzeit

Startseite: „heute 21:10 Uhr". Chat: „21:10". Übergabe: „heute 22:10
Uhr". Drei Schreibweisen für dieselbe Sache.

*Aufwand: klein* — eine Funktion, viele Aufrufstellen.

### 29. Tastenkürzel sichtbar machen

Es gibt sie (Cmd/Strg + K) und es gibt `keysModal`. Was fehlt, ist der
Weg dorthin: „?" drücken öffnet die Übersicht.

*Aufwand: klein.*

### 30. Eine echte Druckansicht  ⚠️ *Annahme war falsch (25.8.)*

Putzplan und Materialliste werden im Studio ausgedruckt und an die Wand
gehängt. Es gibt `no-print`, aber keine Druckgestaltung — heute kommt
Dunkelmodus mit Navigationsleiste aus dem Drucker.

*Aufwand: mittel.* **Bringt im Alltag mehr, als es aussieht.**

> **Nachtrag 25.8.: die Annahme oben stimmt nicht.** Nachgemessen haben
> Putzplan **und** Einkaufsliste je eine fertige Vorlage — schwarz auf
> weiß, mit Spalten zum Abhaken —, und beide funktionieren. Aus dem
> Drucker kommt kein Dunkelmodus.
>
> Kaputt war etwas anderes: wer aus **irgendeiner anderen** Ansicht
> Strg+P tippt, bekam ein vollständig **weißes Blatt**. `body >
> *{display:none}` blendet alles aus, und `#printArea` ist leer, solange
> niemand auf einen der beiden Knöpfe gedrückt hat. Das ist behoben — es
> steht jetzt drauf, wo die Vorlagen liegen.

---

## Wenn ich fünf auswählen müsste

| | Warum |
|---|---|
| **27** Zahlen tabellarisch | winzig, wirkt sofort, kein Risiko |
| **7** Eigener Audio-Player | die auffälligste Stelle, an der die Gestaltung aufhört |
| **1 + 2** Kartengewichte und weniger Versalien | zusammen lösen sie den Befund ganz oben |
| **14** Leere Zustände mit nächstem Schritt | betrifft jeden neuen Betrieb am ersten Tag |
| **30** Druckansicht | wird täglich gebraucht und ist heute unbenutzbar |

## Wovon ich abraten würde

* **21 Zum Aktualisieren ziehen** — eine Geste ohne Funktion.
* **25 Bereichszeichen** — Dekoration ohne Aussage.
* **11 Gelesen-Häkchen** — nicht wegen der Gestaltung, sondern wegen der
  Schreibkosten und weil es wieder Sichtbarkeit über Personen ist. Erst
  nachrechnen.
