# StudioChat — die Datenbank

**Stand:** 17. September 2026 · Cloud Firestore, Region `europe-west1`
(St. Ghislain, Belgien).

Erhoben aus `firestore.rules` und `index.html`. Wo ein Feldname nicht
aus einer Regel, sondern nur aus dem Schreibvorgang stammt, steht das
dabei — Firestore hat kein Schema, also ist die Regel die einzige
Stelle, die ein Feld wirklich festlegt.

---

## 1. Der Aufbau in einem Bild

```
users/{uid}                          ← die EINZIGE Sammlung außerhalb
                                        (muss vor dem Anmelden lesbar sein)

firmen/{kennung}                     ← Stammdaten, öffentlich lesbar (get)
   │
   ├── abo/aktuell                   ← was der Betrieb zahlt (Chef + Betreiber)
   │
   ├── config/
   │     ├── studios                 ← die Standortliste
   │     ├── features                ← welche Ansichten an sind
   │     ├── marke                   ← Name, Farbe
   │     ├── recht                   ← Impressum je Betrieb
   │     ├── design                  ← neues Aussehen für alle?
   │     ├── zugriff                 ← voll / nurlesen / zu  (nur Server)
   │     ├── registrierung           ← der Firmencode (für NIEMANDEN lesbar)
   │     └── beitrittSchalter        ← Freigabe an/aus
   │
   ├── channels/{kanal}/messages/    ← Teamchat
   ├── dms/{paar}/messages/          ← Direktnachrichten
   │
   ├── studios/{studioKey}/
   │     ├── todos/                  ← Aufgaben
   │     ├── cleaning/               ← Putzplan
   │     ├── cleaningNotes/
   │     ├── devices/                ← Geräte
   │     ├── deviceLog/              ← Protokoll je Gerät
   │     ├── shifts/                 ← Schichten
   │     ├── absences/               ← Urlaub und Krank
   │     └── handovers/              ← Übergaben
   │
   ├── inventory/{studioKey}         ← Material
   ├── announcements/                ← Aushänge
   ├── board/                        ← Schwarzes Brett
   ├── documents/  +  documentData/  ← Dokumente (Verweis + Inhalt)
   ├── loesungen/  +  loesungBilder/ ← Probleme und was hilft (Text + Fotos)
   ├── certificates/                 ← Nachweise (Premium)
   ├── probetrainings/               ← Zahlen, KEINE Kundennamen
   ├── anliegen/                     ← Wünsche an die Leitung
   ├── trash/                        ← Papierkorb, 30 Tage
   ├── archives/                     ← Wochensicherungen Material
   ├── statistik/{tag}               ← anonyme Tageszahlen
   ├── fehler/{sig}                  ← Fehlermeldungen
   ├── pushTokens/{token}            ← Geräte für Meldungen
   ├── privat/{uid}/…                ← persönlicher Bereich
   │
   ├── terminals/{id}                ← registrierte Stempelgeräte
   ├── zeiten/{id}                   ← Stempelzeiten   (write: false)
   ├── zeitPins/{uid}                ← PIN-Hash        (read+write: false)
   └── terminalCodes/{id}            ← Code-Saat       (read+write: false)

firmenArchiv/{kennung}               ← gelöschte Firmen
```

**Stillgelegt** (Regeln auf `false`, bestehen aber als Pfad):
`appointments`, `emailTemplates`, `studioMetrics`, `competitors`,
`expansionLeads`, `mkProjects`.

**Flache Altpfade** ohne `firmen/<kennung>/` existieren parallel und
gehören dem ersten Betrieb. Die App schreibt dort nicht mehr.

---

## 2. Die wichtigsten Sammlungen im Einzelnen

### `users/{uid}`

Die einzige Sammlung außerhalb der Firmenpfade.

| Feld | Typ | Anmerkung |
|---|---|---|
| `name` | Text | |
| `email` | Text | |
| `role` | Text | `mitarbeiter` / `leiter` / `chef` |
| `admin` | bool | **nur der Betreiber.** Vergibt ausschließlich ein Admin |
| `firma` | Text | die Firmenkennung. **Das ist die Mandantengrenze** |
| `studios` | Liste | Klarnamen der Studios |
| `studioKeys` | Liste | Kennungen (`studio-6`) |
| `aktiv` | bool | `false` = freigegeben, aber gesperrt |
| `createdAt`, `lastSeen` | Zahl | Zeitstempel |
| `color`, `icon`, `photo` | Text | Darstellung |
| `birthday` | Text | freiwillig |
| `mailAus` | Liste | abgeschaltete Mail-Themen |
| `handyStempeln` | bool | darf mit dem eigenen Telefon stempeln |

**Was ein Benutzer an sich selbst NICHT ändern darf** — steht so in der
Regel, nicht nur in der App:

```
['role','studios','studio','studioKeys','aktiv','firma','admin','handyStempeln']
```

**Lesen:** nur Konten **derselben Firma**. `users` liegt außerhalb der
Firmenpfade, deshalb muss die Regel es dort ausdrücklich verlangen —
und die App muss gefiltert abfragen, weil Firestore Abfragen im Voraus
prüft und nicht Dokument für Dokument.

---

### `firmen/{kennung}`

| Feld | Anmerkung |
|---|---|
| `name` | Anzeigename |
| `aktiv` | `false` = stillgelegt. **Prüft `firmaLaeuft(f)` bei jedem Zugriff** |
| `zuDurchAbo` | merkt sich, ob die Abo-Uhr gesperrt hat — damit eine Zahlung keine von Hand gesperrte Firma öffnet |
| `angelegtAm`, `angelegtVon` | |
| `zahlKonten`, `zahlStudios` | Zahlen beim Anlegen |

**`allow get: if true`** — jeder darf **ein** Firmendokument lesen, denn
der Anmeldebildschirm braucht den Namen.
**`allow list: if istAdminKonto()`** — aufzählen darf nur der Betreiber.

> Die Trennung von `get` und `list` ist der Punkt: mit `read: true`
> könnte jeder die **ganze Kundenliste** abrufen, mit Namen, Konten- und
> Studiozahl. Die Zufallsendung in der Kennung (`mueller-7f3a`) soll
> genau das verhindern und nützte dann nichts.

---

### `firmen/{kennung}/abo/aktuell`

**Lesen:** Betreiber und der Chef dieser Firma. **Schreiben:** nur der
Betreiber (und die Serverfunktionen mit Adminrechten).

| Feld | Anmerkung |
|---|---|
| `stufe` | `basic` / `premium` |
| `status` | einer von neun — siehe `docs/ABO-PLAN.md` |
| `netto` | Betrag je Monat, **netto** |
| `bisAm` | bezahlt bzw. Testphase bis |
| `offenSeit` | seit wann ein Rückstand besteht. **Aus diesem einen Datum rechnet die Uhr** |
| `leiter` | `lang` / `kurz` — welche Mahnleiter gilt |
| `jeGezahlt` | nur Anzeige, keine Weiche |
| `vonHand` | der Betreiber hat entschieden — die Uhr fasst es nicht an |
| `kunde`, `abo` | Stripe-Kennungen |
| `gesetztVon`, `gesetztVonName`, `gesetztAm` | wer hat es gesetzt |
| `letztesEreignis`, `letztesEreignisAm` | was Stripe zuletzt meldete |

> **Warum das nicht im Firmen-Dokument steht**, obwohl es bequemer
> wäre: das ist öffentlich lesbar, weil der Anmeldebildschirm den Namen
> braucht. Was ein Kunde zahlt, geht niemanden etwas an — am wenigsten
> einen Wettbewerber, der die Kennung errät.

---

### `firmen/{kennung}/config/zugriff`

**Neu seit 16.9.2026.** Der einzige Weg, auf dem das Team von einer
Sperre erfährt.

| Feld | Werte |
|---|---|
| `stufe` | `voll` / `nurlesen` / `zu` |
| `stand` | Zeitstempel |

**Mehr steht nicht drin** — kein Betrag, kein Datum, keine Mahnstufe.
Dass ein Betrieb im Rückstand ist, geht das Team nichts an; dass gerade
nichts gespeichert wird, schon.

**Lesen:** jeder Aktive. **Schreiben:** ausschließlich der Server
(Auslöser `aboZugriffSpiegeln`) — dem Chef ist es ausdrücklich
verboten, damit er die Leiste nicht wegklicken kann.

---

### `firmen/{kennung}/config/registrierung`

Der **Firmencode**. **Für Clients nicht lesbar** — auch nicht für den
Chef, obwohl er ihn setzen darf.

> Die allgemeine Regel `config/{doc}` würde ihn sonst für jeden
> Eingeloggten lesbar machen und die Sperre wäre Dekoration. Deshalb
> steht `registrierung` in der Leseregel ausdrücklich ausgenommen. In
> Firestore gilt **jede** zutreffende Regel, nicht die speziellste —
> diese Falle ist in derselben Datei zweimal aufgetreten.

Beim Registrieren legt die App den eingegebenen Code unter
`beitritt/{uid}` ab; die Regel für `users/{uid}` liest ihn dort nach.
**Er kommt bewusst nicht ins Profil** — das ist für alle Aktiven lesbar.

---

### `firmen/{kennung}/zeiten/{id}` — Stempelzeiten

| Feld | Anmerkung |
|---|---|
| `uid`, `name` | Person |
| `studioKey` | Studio **des Geräts** |
| `art` | `kommen` / `pause` / `zurueck` / `feierabend` |
| `ts`, `tag`, `monat` | Zeitpunkt, Datum, Monat |
| `fremd` | außerhalb des eigenen Studios gestempelt |
| `quelle` | `terminal` / `handy` / `korrektur` (seit 24.9.2026) |
| `terminalId`, `terminalName` | welches Gerät |
| `grund`, `korrigiertVon`, `korrigiertVonName`, `korrigiertAm` | nur bei `quelle: korrektur` — wer hat nachgetragen, wann, warum |
| `storno` | `{ von, vonName, am, grund }` — als ungültig markiert; der Stempel bleibt, gerechnet wird ohne ihn |

```
allow read:  eigene Zeiten ODER Leitung dieses Studios
allow write: if false
```

**Niemand** kann über die Anwendung einen Stempel ändern oder löschen —
auch nicht der Chef, auch nicht der Betreiber. Geschrieben wird
ausschließlich serverseitig.

**Korrigieren (P-09, seit 24.9.2026)** geht über zwei Funktionen, und
keine davon überschreibt etwas:
`zeitNachtragen` legt einen neuen Stempel mit `quelle: korrektur` und
Grund an; `zeitStornieren` hängt an einen vorhandenen Stempel nur das
Feld `storno`. Dürfen: der Chef überall, die Studioleitung in ihren
Studios, nicht an den eigenen Zeiten. Die Person sieht jede Korrektur
mit Name und Grund in „Meine Zeiten". Geprüft in
`tests/rules/zeitkorrektur.test.js` (Emulator) und
`tests/test-zeitkorrektur.js` (Oberfläche).

**Kein Standort, keine IP, kein Gerätefingerabdruck.**
`monat` ist Absicht: „Meine Zeiten" liest monatsweise über zwei
Gleichheitsfilter; ein Bereichsfilter auf `tag` bräuchte einen
zusammengesetzten Index.

---

### `firmen/{kennung}/statistik/{tag}`

```
request.resource.data.keys().hasOnly(['tag','starts','ansichten'])
```

**Die Sammlung kann keine Person aufnehmen, weil die Datenbank nur drei
Felder durchlässt.** Das ist die eigentliche Zusage — nicht, dass die
App keine Namen schreibt, sondern dass sie es nicht könnte.

---

### `firmen/{kennung}/trash/{id}` — Papierkorb

| Feld | Anmerkung |
|---|---|
| `col` | aus welcher Sammlung |
| `sk` | Studio |
| `orig` | ursprüngliche Kennung |
| `data` | der ganze Datensatz |
| `deletedBy`, `deletedByUid`, `deletedAt` | **wer wann gelöscht hat** |

Umfasst genau fünf Arten: **Aufgaben, Putzaufgaben, Ankündigungen,
Dokumente, Brett-Beiträge.** Chatnachrichten ausdrücklich nicht.

Der Lauf `purgeTrash` (täglich 03:30) löscht nach **30 Tagen** — bei
Dokumenten **beide** Datensätze, Verweis und Inhalt.

---

### `firmen/{kennung}/documents/` und `documentData/`

Geteilt, weil der Dateiinhalt groß ist und nicht bei jeder Listenabfrage
mitkommen soll.

| `documents` | `documentData` |
|---|---|
| `name`, `fileName`, `kind`, `size`, `type`, `cat`, `studios`, `uploadedBy`, `uploadedByUid`, `ts` | `data` — Base64 |

`kind` ist `file` oder `link`. Bei `link` gibt es keinen zweiten
Datensatz; die Datei liegt beim Drittanbieter des Kunden.

> **Es gibt keinen echten Dateispeicher.** Cloud Storage enthält
> ausschließlich die nächtliche Sicherung; die Storage-Regeln sperren
> jeden Client-Zugriff vollständig.

---

### Schulung: fünf Sammlungen (seit 22.9.2026)

Webinare mit Videos und Fragen — und ein Nachweis, wer sie wann gemacht
hat.

| Sammlung | Was drin steht | Wer darf |
|---|---|---|
| `schulungen` | Module, die der Betrieb SELBST anlegt: `titel`, `kategorie`, `beschreibung`, `dauer`, `pflicht`, `gueltigMonate`, `strenge`, `grenze`, `schritte[]`, `fragen[]`, `basis`, `aktiv`. Der Grundstock liegt als Datei (`schulungen-basis.js`) und kostet nichts | lesen: jeder Aktive · schreiben: die Leitung |
| `schulungTeilnehmer` | `name`, `uid` (freiwillig), `kennung`, **`code` (Klartext)**, `codeAm`, `gesperrt` | lesen: die Leitung und die Person selbst · schreiben: die Leitung |
| `schulungCodes/{kennung}` | `salz`, `hash`, `teilnehmer` — **nur noch Rückfall für Codes von vor dem 22.9.2026** | **niemand** — `allow read, write: if false` |
| `schulungVersuche/{uid}` | die Bremse gegen Durchprobieren | **niemand** |
| `schulungLaeufe` | ein Durchlauf: `teilnehmer`, `teilnehmerName`, `uid`, `modul`, `geraetUid`, `geraetName`, `studioKey`, `start`, `ende`, `aktivMs`, `durchgang`, `schritteGesehen`, `fragen[]`, `punkte`, `bestanden`, `status` | lesen: die Leitung und die Person selbst · **anlegen: niemand** · ändern: nur das Gerät, nur solange `status == 'laeuft'` |

**`allow create: if false` auf `schulungLaeufe` ist die Zeile, auf die es
ankommt.** Ein Durchlauf entsteht ausschliesslich in der Cloud Function
`schulungStart`, und erst, nachdem der Teilnahme-Code gestimmt hat.
Dürfte der Browser ihn anlegen, schriebe sich jeder mit der Konsole
einen fertigen, bestandenen Durchlauf auf einen fremden Namen — und die
ganze Liste wäre eine Behauptung statt eines Nachweises.

**Der Code steht seit dem 22.9.2026 im Klartext** an
`schulungTeilnehmer`. Bis dahin lag er gehasht und war nach dem Anlegen
für niemanden mehr zu sehen — auch nicht für die Leitung. Aus dem
Betrieb kam dazu:

> „ich würde mir wünschen … das die codes nicht weg sind und sie keiner
> sehen kann sondern sie bei der verwaltung gespeichert werden, sodass
> man ihn immer wieder neu erstellen und ansehen und weiterleiten kann."

Der Einwand trifft die Praxis: ein Code, den man nur einmal sieht, ist
ein Zettel, der verlorengeht.

**Damit ist die Leseregel dieser Sammlung die einzige Sperre, die noch
zählt**, und sie ist eng: die Leitung — und jede Person ihren eigenen
Datensatz. Ein Kollege kommt weder an ein fremdes Dokument noch über
eine Abfrage der ganzen Sammlung heran; beides steht als Gegenprobe in
`tests/rules/schulung.test.js`, in beiden Welten.

**Was das kostet:** wer den Code lesen kann, *kann* die Schulung im
Namen dieser Person machen. Der Nachweis sagt damit „es war sie, und die
Leitung steht dafür gerade" statt „es war mit Sicherheit sie". Für eine
interne Unterweisung ist das die richtige Höhe. In die nächtliche
Sicherung geht der Code nicht — sie trägt nur die Durchläufe.

Der Code sieht aus wie `M4K7-RPQ2-XT9B`. Die ersten vier Zeichen sind die
**Kennung**; über sie findet die Funktion den Teilnehmer mit EINER
Abfrage statt mit einem Durchgang durch die ganze Liste. Die acht
dahinter sind das Geheimnis: aus einem Alphabet von 32 rund 10¹²
Möglichkeiten, und zehn Fehlversuche je Gerät und Stunde machen den Rest.

**`basis` funktioniert wie bei den Lösungen.** Ein Modul aus der Datei
lässt sich nicht an Ort und Stelle ändern — wer es trotzdem ändert, legt
einen eigenen Datensatz an, dessen `basis` auf die Datei-ID zeigt, unter
dem festen Dokumentnamen `basis-<id>`. Die App zeigt dann den eigenen
**statt** des Datei-Moduls; löscht man ihn, gilt wieder das Original.

Der feste Name ist kein Schmuck: mit einer zufälligen Kennung legten
zwei Leute, die dasselbe Modul am selben Tag ändern, zwei Fassungen an,
und die App müsste raten, welche gilt.

**`aktivMs` ist nicht die Wanduhr.** Der Zähler läuft nur, wenn das
Fenster vorn und die Seite offen ist — wer den Bildschirm sperrt und
Mittag macht, sammelt keine Minuten. Eine Dauer, die das mitzählt, ist
als Auskunft wertlos und als Leistungsangabe unfair.

---

### `users/{uid}` — das Feld `tourGesehen` (seit 22.9.2026)

Eine Zahl: die Fassung der Führung, die dieses Konto durchlaufen hat.

**Warum am Konto und nicht am Gerät.** Auf dem Tablet am Empfang melden
sich nacheinander mehrere Leute an — Abmelden ist dort der häufigste
Griff überhaupt. Läge der Stand nur im Browser-Speicher, bekäme nur der
erste die Führung, und die übrigen erführen nie, dass es sie gibt.

Der Browser-Speicher (`kf_tour`) bleibt als **Rückfall** für den Fall,
dass der Schreibvorgang aufs Konto scheitert — dann fängt die Führung
nicht bei jeder Anmeldung wieder an. Er trägt die Kontokennung mit sich
(`"<fassung>:<uid>"`) und gilt ausdrücklich nur für dieses eine Konto auf
diesem einen Gerät.

Die Regeln brauchten dafür keine Änderung: ein Konto darf sein eigenes
Profil ändern, solange es Rolle, Studios, `aktiv`, `firma`, `admin` und
`handyStempeln` nicht anfasst.

---

### `firmen/{kennung}/loesungen/` und `loesungBilder/` (seit 22.9.2026)

Probleme aus dem Studio und was dagegen hilft. Genauso geteilt wie die
Dokumente, und aus demselben Grund — hier kommt ein zweiter dazu:

> Ein Firestore-Dokument darf **1 MB** tragen. Drei Fotos im selben
> Dokument sprengen das, und zwar erst beim dritten — also lange
> nachdem jemand geglaubt hat, es funktioniere. Deshalb liegt **jedes
> Foto in seinem eigenen Dokument**.

| `loesungen` | `loesungBilder` |
|---|---|
| `titel`, `problem`, `schritte` (Liste), `loesung` (dieselben Schritte am Stück), `kategorie`, `studios`, `bilder` (Liste von IDs), `basis`, `uid`, `vonName`, `ts`, `geaendertVon`, `geaendertAm` | `data` — Base64, dazu `uid` und `ts` |

**`schritte` und `loesung` stehen beide da.** `schritte` ist die
Wahrheit — eine Anleitung ist eine Reihenfolge. `loesung` trägt
denselben Text am Stück, weil die Tabellenfassung des Exports eine
Zelle braucht und weil jeder Eintrag von vor dem 22.9. nur dieses Feld
hat. Fehlt `schritte`, zerlegt die App `loesung` an den Zeilenumbrüchen.

**`basis` ist der Grund, warum die 115 Handbuch-Einträge nichts
kosten.** Der Grundstock liegt als Datei (`loesungen-basis.js`), nicht
in der Datenbank — in der Datenbank läge er bei 39 Konten bei rund
10.000 Lesevorgängen am Tag, für Inhalte, die sich nie ändern (freies
Kontingent: 50.000). Wer einen davon ändert oder ein Foto anhängt, legt
einen **eigenen** Datensatz an, dessen `basis` auf die Handbuch-ID
zeigt; die App zeigt dann den eigenen statt des Grundstocks. Der
Dokumentname ist dabei fest: `basis-<id>`. Das ist kein Schmuck — mit
einer zufälligen ID legten zwei Leute, die denselben Eintrag am selben
Tag bessern, zwei Fassungen an, und die App müsste raten, welche gilt.

**`geaendertVon` / `geaendertAm`:** Wer berichtigt, ersetzt nicht den
Verfasser. `uid` und `vonName` bleiben stehen — sonst übernähme die
Leitung mit einer geradegezogenen Zeile die Urheberschaft.

`studios` ist entweder `'all'` oder eine Liste von Studio-Kennungen.
**Die Angabe ist eine Herkunft, keine Schranke:** gelesen wird
firmenweit, weil ein Problem aus Rondorf in Brühl genauso weiterhilft.

Die Fotos werden im Browser auf **1280 px und 300 KB** verkleinert
(`fileToCompressedDataURL`) und **erst beim Aufklappen** geladen — bei
dreissig Einträgen zu drei Fotos wären es sonst neunzig Lesevorgänge je
Listenaufruf.

**Video gibt es nicht.** Es bräuchte echten Dateispeicher, und der Eimer
daneben enthält die nächtliche Vollsicherung der Datenbank. Die
Begründung steht in `FORTSCHRITT.md`, Runde 95.

---

## 3. Indexe

**NICHT VERIFIZIERBAR** von hier aus: Es gibt keine
`firestore.indexes.json` im Repository, und die tatsächlich angelegten
zusammengesetzten Indexe stehen in der Firebase-Konsole.

Was aus dem Code hervorgeht: an mehreren Stellen ist die
**Datenmodellierung so gewählt, dass kein zusammengesetzter Index nötig
ist** — etwa das Feld `monat` bei den Stempelzeiten. Der Kommentar dort
nennt den Grund ausdrücklich.

---

## 4. Wie Firestore-Abfragen und Regeln zusammenspielen

Der Punkt, über den man in diesem Projekt zweimal stolpert:

> **Firestore prüft eine Abfrage im Voraus, nicht Dokument für
> Dokument.** Sobald auch nur ein möglicher Treffer nicht gelesen werden
> dürfte, wird die **ganze** Abfrage abgewiesen.

Deshalb muss die App dort, wo die Regel einschränkt, **selbst schon
gefiltert abfragen**. Beim Papierkorb sieht man es: der Chef sortiert
direkt in der Abfrage, der Leiter muss zusätzlich nach seinen Studios
filtern — sonst bekäme er gar nichts.

Das ist auch der Grund, warum eine Studiogrenze beim Lesen nachträglich
Arbeit ist: nicht die Regel, sondern jede betroffene Abfrage.

---

## 5. Sicherung

| Was | Rhythmus | Aufbewahrung |
|---|---|---|
| Vollexport der Datenbank | täglich 02:40 | **7 Tage** |
| Tages-Sicherung der Bestände | täglich 23:45 | rollierend |
| Wochensicherung Material | wöchentlich | 52 Wochen |

Der Vollexport liegt in Cloud Storage unter `sicherung/JJJJ-MM-TT/`.

> **Dort liegt alles auf einmal** — jeder Chatverlauf, jede
> Direktnachricht, das komplette Team mit E-Mail-Adressen. Eine einzige
> zu weite Storage-Regel wöge schwerer als jede Lücke in den
> Firestore-Regeln. Deshalb: `allow read, write: if false` für alle.

**Wiederherstellung: nie geprobt.** Steht so in `docs/av/TOM.md`.
