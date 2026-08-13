# Sicherheits-Durchlauf

Stand 13. August 2026, drei Runden. Der erste Durchlauf (12. August) ging
ausschliesslich um Firmengrenzen; die zweite Runde nahm die Bereiche, die
damals offen blieben — und die dritte das, was am Ende der zweiten noch
als „nicht nachgeschlagen" dastand: die Sicherheitsregel im Browser, die
Fremdbibliotheken und die drei Nachbaranwendungen.

Geprüft wurde gegen den Emulator, gegen eine echte Browserinstanz und gegen
den Quelltext. Nichts Echtes wurde angegriffen. Was nicht messbar war, steht
unten als solches.

---

## Was geprüft wurde und was dabei herauskam

| Bereich | Ergebnis |
|---|---|
| Eingeschleuster Code (XSS) | ✅ 8 Muster, keins wird zu Code |
| Rechteausweitung über `users` | ✅ 10 Wege geprüft, alle zu |
| Firmencode und Abo lesbar? | ✅ nein |
| Kundenliste aufzählbar | 🔴 **war offen — behoben** |
| Google-Tabelle: offener Schreibweg | 🟠 **war offen — umgebaut, zwei Handgriffe fehlen** |
| Cloud Functions: Berechtigung je Endpunkt | ✅ 15 von 15, jetzt bei jedem Durchlauf nachgezählt |
| Speicher (Storage) | ✅ für jeden Client gesperrt |
| Geheimnisse im Quelltext | ✅ nur öffentliche Web-Schlüssel |
| Kommentare in der ausgelieferten Datei | 🟡 Hinweis, siehe unten |
| Content-Security-Policy | ✅ **eingebaut**, siehe unten |
| Bekannte Lücken in Fremdbibliotheken | 🔴 **11 gemeldet — jetzt 0** |
| Die drei Nachbaranwendungen | 🔴 **drei Funde behoben — zwei Seiten am 13.8. stillgelegt** |

---

## 🔴 Behoben: die vollständige Kundenliste war öffentlich abrufbar

`match /firmen/{f}` stand auf `allow read: if true`. In Firestore erlaubt
`read` **beides**: ein einzelnes Dokument holen (`get`) und die ganze
Sammlung auflisten (`list`).

Damit konnte jeder — ohne Anmeldung, mit drei Zeilen in der
Entwicklerkonsole — die Liste aller Kunden abrufen: Firmenname,
Kontenzahl, Studiozahl, Anlegedatum.

Das hebelt genau die Massnahme aus, die es verhindern sollte. Kennungen
bekommen beim Anlegen eine Zufallsendung (`mueller-7f3a` statt `mueller`),
damit sich die Kundenliste nicht erraten lässt. Raten war gar nicht nötig.

**Die Reparatur** trennt die beiden Rechte:

```
allow get:  if true;               // der Anmeldebildschirm braucht den Namen
allow list: if istAdminKonto();    // die Kundenliste gehoert dem Betreiber
```

Wer die Kennung kennt, sieht weiterhin Name und Zustand seiner Firma — das
braucht der Anmeldebildschirm, bevor jemand angemeldet ist. Aufzählen darf
nur der Betreiber; `listenFirmen()` in `index.html` läuft ohnehin nur für
ihn.

Nachgewiesen in `tests/rules/rechte.test.js`, in beide Richtungen.

---

## 🟠 Umgebaut: die Google-Tabelle nahm Daten von jedem an

Die App schiebt Material und Putzplan in eine Google-Tabelle. Das lief
über eine Apps-Script-Web-App, deren Adresse in `konfig.js` stand — und
`konfig.js` wird an jeden Besucher ausgeliefert. `doPost` prüfte
**nichts**. Wer die Adresse aus dem Quelltext las, konnte:

* beliebige Studios und Artikel in die Tabelle schreiben,
* freien Text in das Notizblatt setzen,
* durch wiederholte Aufrufe das Tageskontingent von Apps Script
  (rund 90 Minuten) aufbrauchen und damit den echten Abgleich lahmlegen.

**Was nie ging:** lesen. `doGet` gibt eine feste Zeile zurück, keine
Daten. Und an Firestore kommt darüber niemand — die Tabelle ist eine
Kopie, kein Zugang.

**Warum ein Token im Browser nichts gebracht hätte:** es stünde neben
der Adresse in derselben ausgelieferten Datei.

**Der Umbau** verlegt den Abgleich auf den Server:

| vorher | jetzt |
|---|---|
| Browser → Web-App, `mode:'no-cors'` | Browser → Cloud Function `sheetsPush` → Web-App |
| Adresse in `konfig.js` | Adresse in `functions/.env` (`SHEETS_URL`) |
| kein Token | Token aus `functions/.env`, geprüft in `doPost` |
| Nutzlast wird durchgereicht | Nutzlast wird auf dem Server neu gebaut |
| Absender kommt aus dem Browser | Absender kommt aus dem Profil |
| keine Grenze | Anmeldung, Freigabe, Firma, Tagesgrenze (3000) |

Die Function nimmt nur `art: material|putzplan` und eine Studioliste an.
Alles andere fällt weg: Feldnamen, Längen und Typen stehen fest, ein
zusätzliches Feld aus dem Browser erreicht die Tabelle nicht.

**Zwei Handgriffe fehlen noch**, und sie kann nur der Betreiber machen:
das Token als GitHub-Secret hinterlegen und dieselbe Zeichenkette als
Skripteigenschaft `STUDIOCHAT_TOKEN` setzen. Solange die Eigenschaft
fehlt, nimmt die Web-App weiter alles an — bewusst so, damit zwischen
den Schritten nichts stehenbleibt. Anleitung: `docs/SHEETS-TOKEN.md`.

Nachgewiesen in `tests/rules/funktionen.test.js` (16 Prüfungen: keine
Anmeldung, keine Freigabe, fremde Firma, Token liegt bei, Absender aus
dem Profil, erfundene Felder fallen weg) und in `tests/test-sheets.js`
(der Browser ruft `script.google.com` kein einziges Mal mehr auf, mit
Gegenprobe).

---

## 🟡 Hinweis: die App liefert 157 KB Kommentar an jeden Besucher aus

`index.html` ist die App. Wer sie öffnet, hat den kompletten Quelltext,
einschliesslich aller Kommentare — davon 27 mit sicherheitsrelevantem
Inhalt: welche Prüfung nur Anzeige ist und welche eine echte Grenze, wo
eine Regel greift und wo nicht.

Das ist **kein Leck**: die Grenzen stehen in `firestore.rules` und werden
auf dem Server durchgesetzt, nicht durch Unwissen. Aber es ist eine
Wegbeschreibung für jemanden, der sucht.

Die Meta-Kommentare (Inhaltsverzeichnis, Aufbaubeschreibung, Verweise auf
Tests und Dokumentation) sind am 13.8. entfernt worden. Der Rest sind
technische Notizen am Code.

**Wer das ganz zumachen will**, braucht einen Schritt beim Ausliefern, der
die Kommentare entfernt — und damit einen Build, den es bewusst nicht gibt
(siehe `README.md`). Das ist eine Abwägung, keine offene Baustelle.

**Nachtrag vom 13.8.:** die Frage erübrigt sich weitgehend, denn **das
Repository steht auf öffentlich**. Der komplette Quelltext ist ohnehin
für jeden lesbar, mitsamt Verlauf. Für die Sicherheit ändert das nichts
an den Grenzen — die stehen in `firestore.rules` und werden auf dem
Server durchgesetzt. Es hat aber eine harte Folge:

> **Kein Geheimnis darf jemals eingecheckt werden.** Kein Token, kein
> Passwort, kein Dienstkonto-Schlüssel — auch nicht kurz, auch nicht in
> einem gelöschten Commit. Der Verlauf bleibt lesbar.

Deshalb liegen die Zugangsdaten in GitHub-Secrets und landen erst beim
Ausrollen in `functions/.env` (das in `.gitignore` steht). Das Token für
die Google-Tabelle geht denselben Weg.

---

## ✅ Eingebaut: die Content-Security-Policy

Die App baut ihre Oberfläche mit `innerHTML`. Alles ist maskiert — acht
Angriffsmuster, keins wird zu Code. Die CSP ist die zweite Reihe: sie
führt eingeschleusten Code auch dann nicht aus, wenn eine Maskierung
irgendwann vergessen wird.

```
default-src 'none'
script-src  'self' https://www.gstatic.com 'sha256-…' 'sha256-…'
style-src   'self' 'unsafe-inline' https://fonts.googleapis.com
img-src     'self' data: blob:
connect-src 'self' https://*.googleapis.com https://*.cloudfunctions.net …
frame-src 'none' · object-src 'none' · base-uri 'none' · form-action 'none'
```

**`script-src` ohne `'unsafe-inline'`** — das ist der Punkt. Die beiden
Skriptblöcke der Datei sind einzeln über ihre Prüfsumme erlaubt, jeder
andere nicht. Ein `<script>` aus einem Chattext wird nicht ausgeführt,
selbst wenn er als Markup ankäme.

Der Preis dafür ist Pflege: ändert sich ein Zeichen im Skript, passt die
Prüfsumme nicht mehr und die App bliebe weiss. Deshalb gibt es
`tools/csp.js` (rechnet sie neu) und `tests/test-csp.js` (schlägt an,
sobald Regel und Datei auseinanderlaufen). Beim Einbau hat genau das
einmal angeschlagen, wie vorgesehen.

**Was dafür umgebaut wurde:** vier Ereignisse im Attribut
(`onclick="…"`, `onload="…"`). Die sind für die Regel fremder Code. Die
beiden Notschalter im Ladebildschirm liegen jetzt in einem eigenen
kleinen Block — getrennt vom grossen, damit sie auch dann funktionieren,
wenn die App selbst nicht hochkommt.

**`style-src` behält `'unsafe-inline'`.** Die Oberfläche setzt Farben und
Grössen an `style="…"` einzelner Elemente; dafür gibt es keine
Prüfsumme. Ein Stil führt keinen Code aus — die Regel verliert dadurch
nichts von dem, wofür sie hier steht.

**Gemessen statt gehofft:** zwölf Ansichten geöffnet, **0 Verletzungen**,
App läuft, und die Gegenprobe (eingeschleustes `<img onerror>`, ein
`<script>`-Element und ein per JS erzeugtes Skript) wird geblockt. Dazu
läuft die gesamte Oberflächen-Prüfung seitdem unter der Regel — sie steht
als `<meta>` in der Datei und gilt damit auch im Durchlauf, nicht nur im
Betrieb.

**Was im Betrieb auffällt, wird gemeldet:** blockt die Regel etwas
Echtes, geht es denselben Weg wie ein Fehler (Verwaltung → System). Ohne
das sähe man es nur in der Konsole eines fremden Handys.

**Kopfzeilen zusätzlich** (in `firebase.json`, weil es sie als `<meta>`
nicht gibt): `frame-ancestors 'none'` und `X-Frame-Options: DENY` gegen
Einbetten in eine fremde Seite, dazu `nosniff`, `Referrer-Policy` und
eine `Permissions-Policy`, die Ort, Kamera, Zahlung und USB abschaltet —
das Mikrofon bleibt, dort hängen die Sprachnachrichten.

---

## 🔴 Behoben: elf gemeldete Lücken in den Fremdbibliotheken

Im ersten Durchlauf stand hier „wurde nicht nachgeschlagen". Nachgeholt:
`npm audit` meldete **elf**, davon zwei hoch.

**Nodemailer 6.9.14 → 9.0.5.** Acht Meldungen. Zwei treffen genau
unseren Fall, denn die Empfängeradresse kommt aus einem Formular und geht
ohne Zwischenschritt an Endkundinnen:

* die Adress-Zerlegung lässt sich mit einer gebauten Adresse in eine
  Endlosrekursion treiben (hoch),
* eine Adresse kann in einer anderen Domain landen als der, die dasteht.

**fast-xml-parser, protobufjs, gaxios** ohne Bruch nachgezogen.

**`overrides: { uuid: ^11.1.1 }`.** Sieben Meldungen hängen an einer
alten `uuid` tief in den Google-Bibliotheken. Ein Weiterreichen von oben
gibt es nicht; npm schlug als „Reparatur" einen Rücksprung auf
firebase-admin 10 vor. Also von Hand hochgezogen.

**firebase-admin 14 bleibt aussen vor** — und das ist der interessante
Teil. Die Version entfernt die Schreibweise `admin.firestore()`, auf der
der gesamte Backend-Code steht. `umzug.test.js` ist beim Versuch sofort
umgefallen; ausgerollt hätte es Push, Mails und die Nachtsicherung
stillgelegt, ohne dass in der App etwas anders aussieht. Sicherheitlich
bringt der Sprung nichts: mit dem uuid-Override steht der Zähler auch
auf 12 auf null.

```
npm audit --omit=dev   11 (9 mittel, 2 hoch)  →  0
```

Dass Nodemailer 9 unsere Nachrichten unverändert baut — Empfänger,
Absender, Anzeigename, Umlaute — prüft `tests/test-mail-versand.js`.
Ob ein echter SMTP-Server sie annimmt, lässt sich hier nicht feststellen.

---

## 🟠 Behoben: eine Grenze in der Marketing-App war nur Anzeige

`marketing.html` meldet jeden ohne Chefrolle wieder ab: *„Dieser Bereich
ist der Geschäftsführung vorbehalten."* In den Regeln stand für
`mkProjects` und die Versionen darunter aber `istAktiv()` — **jeder
aktive Zugang** durfte lesen, anlegen und ändern, an der Oberfläche
vorbei.

Kein Datenleck im engeren Sinn: dort liegen Kampagnentexte, keine
Personendaten. Aber es ist die schlechteste Sorte Grenze — eine, an die
alle glauben. Und sie passt nicht zu ihrem Gegenstück: die teuren
KI-Aufrufe (`marketingChat`, `marketingImage`) sitzen serverseitig hinter
`requireChef`. Was dabei herauskommt, gehört demselben Kreis.

Jetzt `isChef()`, in beiden Regelblöcken (flach und je Firma).
Nachgewiesen in `tests/rules/rechte.test.js`, in beide Richtungen.

Mitgeprüft, weil es dieselbe Anwendungsfamilie ist: Kennzahlen je Studio,
Wettbewerbsliste und Expansionsplanung aus `wachstum.html`. Die standen
schon vorher richtig — nur eben ungeprüft.

---

## 🔴 Behoben: Erinnerungs- und Nachfass-Mails gingen seit dem Umzug nicht mehr raus

Kein Sicherheitsfund, sondern einer aus dem Blick auf die
Nachbaranwendungen — und der stillste Ausfall, den das Projekt bisher
hatte.

`wachstum.html` schreibt Termine flach nach `appointments/`. Die
Hauptanwendung ist am 10. August auf `firmen/<kennung>/…` umgezogen; die
Nachbaranwendungen sind dabei nicht mitgekommen. Für die Cloud Functions
gilt seitdem:

| | Weg | Stand |
|---|---|---|
| Bestätigung, Änderung, Storno | Auslöser, hängt an **beiden** Pfaden | lief weiter ✅ |
| Erinnerung X Stunden vorher | Zeitplan über `alleFirmen()` | **fand nichts mehr** ❌ |
| Nachfassen danach | dito | **fand nichts mehr** ❌ |

Kein Fehler im Protokoll, kein Eintrag, in der App sieht alles normal
aus: die Abfrage lief, sie lief nur am falschen Ort und kam leer zurück.
Genau das Muster, vor dem `docs/MANDANT-PLAN.md` warnt — nur eben in der
Anwendung, an die beim Umzug niemand gedacht hat.

Der Zeitplan läuft jetzt über `alleFirmenUndFlach()`: dieselbe Schleife,
zusätzlich die flachen Pfade — dieselbe Antwort, die `beideWelten()` bei
den Auslösern schon gibt. Kostet zwei leere Abfragen je Lauf und fällt
weg, wenn die flachen Daten aufgeräumt sind.

**Was hier nicht messbar war:** ob eine Mail wirklich ankommt. Ohne
SMTP-Zugang im Durchlauf hinterlässt der Versand keine Spur. Nachgewiesen
ist der Weg, nicht die Zustellung (`tests/test-funktionen-pfade.js`, mit
Gegenprobe, dass kein anderer Zeitplan die flachen Pfade mitnimmt).

---

## 🟠 Behoben: die Nachbarseiten arbeiteten im Probelauf in der echten Datenbank

`marketing.html` und `wachstum.html` trugen die Firebase-Zugangsdaten
fest im Quelltext — die des **Betriebs**. Die Weiche in `konfig.js`, die
auf der Probe-Adresse auf das Probe-Projekt umstellt, erreichte sie nie.

Wer also unter `formenchat-probe.web.app` eine dieser Seiten öffnete,
arbeitete in der echten Datenbank: echte Termine ändern, echte Mails an
Endkundinnen auslösen, echtes KI-Kontingent verbrauchen. Ein Probelauf,
der in den Betrieb schreibt, ist schlimmer als keiner — und man sieht es
der Seite nicht an.

Beide holen die Zugangsdaten jetzt aus `konfig.js`, wie die App.
`tests/test-probe-schalter.js` prüft für jede ausgelieferte Seite, dass
keine `projectId` mehr im Quelltext steht — mit Gegenprobe für
`werbung.html`, die gar kein Firebase hat und keins bekommen soll.

---

## ✅ Erledigt durch Stilllegung: die beiden Nachbarseiten

Am 13. August auf Ansage des Betreibers: `marketing.html` und
`wachstum.html` werden **nicht mehr ausgeliefert**, ihre Sammlungen
stehen auf `false`. Damit sind drei Punkte, die hier als offen standen,
keine Fragen mehr:

| Was hier stand | Warum es entfällt |
|---|---|
| Termine sind für jeden im Betrieb lesbar | kein Browser kommt mehr an `appointments` |
| Die Nachbarseiten kennen keine Firmen | die flachen Pfade sind für alle Clients zu |
| Beide ohne eigene CSP | sie werden nicht mehr ausgeliefert |

Der letzte Punkt war der gefährlichste: die Regeln für die flachen Pfade
fragten nur `istAktiv()`, nicht nach der Firma. Beim zweiten Kunden
hätten sich zwei Betriebe gegenseitig in die Termine gesehen, mitsamt
Namen und E-Mail-Adressen ihrer Endkundinnen. Jetzt kommt niemand mehr
heran — auch der Betreiber nicht.

**Was das nicht ist:** eine Reparatur. Wer die Seiten zurückholt, holt
die Lücke mit zurück. Der Umbau auf die Firmen-Pfade steht weiterhin in
`OFFEN.md`, als Bedingung für das Zurückholen statt als eigener Punkt.

**Die Cloud Functions bleiben.** Sie arbeiten mit Admin-Rechten und
unterliegen diesen Regeln nicht; der Termin-Mailversand liefe weiter,
falls noch Daten liegen. `marketingChat` und `marketingImage` sind
weiterhin erreichbar — hinter `requireChef`, aber ohne Oberfläche.

Geprüft in `tests/rules/rechte.test.js` (18 Sperren, mit Gegenprobe, dass
die App selbst nicht mitgesperrt ist) und in `tests/test-probe-schalter.js`
(ausgeliefert wird sie nicht, im Repo liegt sie noch).

---

## Was geprüft wurde und in Ordnung war

**Eingeschleuster Code (XSS).** Acht Muster — `<img onerror>`, `<script>`,
`<svg onload>`, Ausbruch aus Attributen mit `"` und `'`,
`javascript:`-Links, `<iframe>` und ein Muster, das die
Adress-Erkennung im Chat angreift — in Chatnachrichten, Namen, Aufgaben,
Notizen, Umfragen, Dokumenten und dem schwarzen Brett. Über zwölf
Ansichten hinweg: **kein einziges wird zu Code**, alle 31 Fundstellen
bleiben Text. Gegenprobe eingebaut, damit ein Durchlauf ohne Nutzdaten
nicht als grün durchgeht.

**Rechteausweitung.** Zehn Wege, sich selbst mehr zu geben, als man hat:
`admin:true` setzen (als Mitarbeiter und als Chef), `role:'chef'`,
`firma` wechseln, Studios zuteilen, und der heikelste — ein wartendes
Konto schaltet sich selbst auf `aktiv:true` und überspringt damit die
Freigabe des Chefs. Alle zehn scheitern. Dazu vier Gegenproben, dass der
richtige Weg noch funktioniert.

**Firmencode.** Nicht lesbar, weder für Mitarbeiter noch ohne Anmeldung.
Der Vergleich in den Regeln läuft über `get()` und unterliegt den Regeln
selbst nicht.

**Abo.** Ein Mitarbeiter kommt nicht heran; ein Chef sieht seines, kann es
aber nicht auf `premium` setzen.

**Cloud Functions.** Alle Endpunkte prüfen die Berechtigung: dreizehn
Aufrufe aus der App über `requireAdmin`/`requireChef`/`requireAuth`,
zwei HTTPS-Auslöser über einen Geheim-Schlüssel. Nachgezählt wird das
jetzt bei jedem Durchlauf (`tests/test-funktionen-pfade.js`) — von Hand
sieht man den fünfzehnten nicht mehr.

**Speicher.** `allow read, write: if false` — für jeden Client gesperrt.
Dort liegt der nächtliche Vollexport der Datenbank.

**Geheimnisse.** Kein privater Schlüssel, kein Dienstkonto, kein Token im
Repo. Gefunden wurden nur Firebase-Web-Schlüssel, die öffentlich sein
sollen: sie identifizieren das Projekt, sie berechtigen zu nichts.

---

## Was dieser Durchlauf nicht kann

* **Firebase Auth selbst** — Passwortregeln, Sperren nach Fehlversuchen,
  Sitzungsdauer. Das ist Googles Seite.
* **Ob jemand ein Passwort weitergibt.** Die häufigste Art, wie so eine
  App wirklich aufgemacht wird, und keine technische Frage.
* **Das Firebase-SDK im Browser** (10.12.2). Es kommt von `gstatic.com`
  und steht in keiner `package.json`; `npm audit` sieht es deshalb nicht.
  Die Server-Bibliotheken sind nachgeschlagen und stehen auf null.
* **Die drei Nachbaranwendungen** sind diesmal angesehen worden — auf
  Anmeldung, Rollenprüfung und die Regeln hinter ihren Sammlungen (ein
  Fund, oben). Was weiterhin fehlt: ein Angriffsdurchlauf mit
  eingeschleustem Text durch ihre Oberflächen, so wie `test-xss.js` ihn
  für die Hauptanwendung fährt.

---

## Belege

```
tests/test-xss.js              8 Muster · 12 Ansichten · 0 ausgeführt
tests/test-sheets.js           8 Prüfungen, davon 1 Gegenprobe
tests/test-funktionen-pfade.js 15 Endpunkte, jeder mit Berechtigungsprüfung
tests/rules/rechte.test.js     23 Prüfungen, davon 4 Gegenproben
tests/rules/security.test.js   165
tests/rules/kreuz.test.js      162
tests/rules/umzug.test.js      12
tests/rules/funktionen.test.js 99
tests/rules/rechte.test.js     33 (mit den Nachbaranwendungen)
tests/test-csp.js              33 Prüfungen · 2 Seiten · 0 Verletzungen
tests/test-mail-versand.js     8
npm audit --omit=dev           0
```
