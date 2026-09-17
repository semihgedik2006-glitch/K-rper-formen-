# Technische und organisatorische Maßnahmen (Art. 32 DSGVO)

Anlage 1 zum Auftragsverarbeitungsvertrag · Stand 14. September 2026

**Diese Beschreibung ist am Programm nachprüfbar.** Jede Angabe hat eine
Fundstelle. Wo eine Maßnahme fehlt oder schwach ist, steht das hier —
eine geschönte TOM ist im Schadensfall ein Beweismittel gegen den
Verfasser.

---

## 1. Vertraulichkeit (Art. 32 Abs. 1 lit. b)

### 1.1 Zutrittskontrolle — Rechenzentren

Keine eigene Hardware. Alle Verarbeitung läuft bei Google Cloud
Platform, Region **europe-west1 (St. Ghislain, Belgien)**.
`functions/index.js:12` · `konfig.js` (`region`).

Die Zutrittskontrolle zu den Rechenzentren obliegt Google und ist über
deren Zertifizierungen belegt (ISO 27001, SOC 2/3). Siehe
`UNTERAUFTRAGNEHMER.md`.

### 1.2 Zugangskontrolle — wer sich anmelden kann

* Anmeldung über Firebase Authentication mit E-Mail und Passwort.
* **Passwort-Mindestlänge: 6 Zeichen** (`index.html:11153`).
* Konten müssen nach der Registrierung **freigegeben** werden, bevor sie
  etwas sehen: ein Profil ohne `aktiv` kommt an keine Daten heran. Die
  Regel prüft das, nicht nur die Oberfläche (`firestore.rules`,
  `istAktiv()`).
* Wer sich einem bestehenden Betrieb zuordnen will, muss dessen
  **Firmencode** kennen, sofern einer gesetzt ist.
* Zugänge entfernt ausschließlich der Server (`zugangEntfernen`), nicht
  der Browser. Dabei wird auch das Anmeldekonto gelöscht, nicht nur das
  Profil.

> **Bekannte Schwäche, ausdrücklich benannt:** sechs Zeichen sind nach
> heutigem Stand wenig. Eine Erhöhung auf zwölf Zeichen ist eine Zeile
> und sollte vor dem ersten fremden Kunden passieren. Sie steht nicht
> hier als Zusage, weil sie heute nicht wahr wäre.
>
> **Zweitfaktor gibt es nicht.** Für Konten mit Chef-Rechten wäre er
> angemessen. Auch das ist eine offene Maßnahme und keine vorhandene.

### 1.3 Zugriffskontrolle — wer welche Daten sieht

Der Kern des Systems, und der Grund, warum die App mehrere Kunden
nebeneinander tragen kann.

**Die Betriebsgrenze wird in den Sicherheitsregeln der Datenbank
(`firestore.rules`) durchgesetzt, nicht in der Oberfläche.** Das ist der
Unterschied zwischen „man sieht es nicht" und „man kommt nicht heran":
ein manipulierter Browser kommt an der Oberfläche vorbei, an der Regel
nicht.

**Die Studiogrenze wird beim Lesen bisher NUR in der Oberfläche
durchgesetzt.** Diese Zeile stand hier bis zum 17.9.2026 falsch — die
Tabelle las sich so, als hielte die Datenbank auch sie. Der Unterschied
ist für einen Auftraggeber wesentlich, deshalb steht er jetzt in der
Tabelle selbst:

| Rolle | Sichtbereich | Wodurch gehalten |
|---|---|---|
| Mitarbeiter | die eigenen zugeordneten Studios | **nur Oberfläche** (siehe unten) |
| Studioleitung | die von ihr verwalteten Studios | Oberfläche; Schreibrechte zusätzlich in der Regel (`manages()`) |
| Geschäftsführung | alle Studios des **eigenen** Betriebs | Regel |
| Betreiber (Admin) | Firmen-Stammdaten, **keine Inhalte** der Kunden | Regel |

> **Offener Punkt, bekannt und dokumentiert:** an rund elf Sammlungen
> lautet die Leseregel `inFirma(f) && istAktiv()`, prüft also die Firma
> und nicht das Studio. Wer im Betrieb angemeldet ist und ein
> Datenbankwerkzeug bedienen kann, erreicht damit auch Einträge anderer
> Studios — **einschliesslich Abwesenheiten und Krankmeldungen, also
> Gesundheitsdaten nach Art. 9 DSGVO.** Siehe
> `docs/BEKANNTE-PROBLEME.md`, P-01. Schreiben ist davon nicht
> betroffen: dort steht `manages(studioKey)` in der Regel.

**Mandantentrennung:** jeder Zugriff auf Betriebsdaten läuft durch eine
einzige Stelle im Code (`S(name)`), die den Pfad
`firmen/<kennung>/…` voranstellt. Ein einziges vergessenes Präfix würde
einem Kunden die Daten eines anderen zeigen; deshalb gibt es diese
Stelle genau einmal und einen Durchlauf, der das festhält.

**Der Betreiber sieht keine Kundeninhalte.** Es gibt bewusst keinen
„als Chef ansehen"-Knopf. Was der Admin sieht, sind Firmenname,
Kennung, Abo-Stufe und Nutzerzahl.

**Belegt durch:** `tests/rules/` — **864 Zusicherungen** über Sicherheit,
Kreuzzugriffe zwischen Betrieben, Rollenrechte, Reaktionen, Umfragen,
fremde Felder, Kalender und Anliegen. Jeder Durchlauf prüft ausdrücklich
auch, was **nicht** gehen darf, und trägt Gegenproben: eine Regel
„verbiete alles" wäre sonst grün.

### 1.4 Trennungskontrolle

* Daten verschiedener Kunden liegen unter getrennten Pfaden
  (`firmen/<kennung>/…`) und sind durch die Regeln gegeneinander
  abgeschottet. `tests/rules/kreuz.test.js` prüft für **32 Sammlungen**,
  dass ein Betrieb nicht an die Daten eines anderen kommt — lesend wie
  schreibend, einzeln wie über Abfragen.
* Persönliche Daten (eigene Notizen, Termine, Ziele, Wünsche) liegen
  unter `privat/<uid>/` und sind besitzergebunden. Kein Kollege und
  keine Leitung liest sie. Was jemand ausdrücklich abschickt, wandert in
  eine eigene Sammlung — der Nutzer entscheidet je Eintrag, an wen.

### 1.5 Verschlüsselung

| Wo | Was |
|---|---|
| Übertragung Browser ↔ Server | TLS, erzwungen. Der Server schickt `Strict-Transport-Security: max-age=31556926; includeSubDomains; preload` — **am 14.9. an der ausgelieferten Adresse nachgemessen**, nicht aus der Konfiguration abgelesen |
| Speicherung | Verschlüsselung im Ruhezustand durch Google Cloud (AES-256), Standard bei Firestore und Cloud Storage |
| Mailversand | SMTP über TLS (Port 587 STARTTLS bzw. 465 implizit), `functions/index.js:1962` |

**Keine Ende-zu-Ende-Verschlüsselung.** Der Betreiber könnte technisch
auf die Daten zugreifen — das ist bei einem Auftragsverarbeiter der
Normalfall und wird hier genannt, damit niemand etwas anderes annimmt.

---

## 2. Integrität (Art. 32 Abs. 1 lit. b)

### 2.1 Eingabekontrolle — wer hat was getan

* Abgehakte Aufgaben und Putzpunkte tragen **Kennung und Namen** der
  Person sowie den Zeitpunkt (`doneByUid`, `doneBy`, `doneAt`).
  Die Kennung ist entscheidend: zwei Personen können „Anna" heißen, und
  ein Name ändert sich bei Heirat.
* Chatnachrichten tragen Absenderkennung und Zeitstempel; bearbeitete
  Nachrichten tragen zusätzlich `editedAt` und sind als bearbeitet
  gekennzeichnet.
* Gerätemeldungen führen ein Protokoll je Gerät mit Melder und Zeitpunkt.
* Anliegen an die Leitung sind gegen nachträgliche Textänderung
  geschützt: die Regel lässt beim Beantworten **nur**
  `antwort`, `antwortVon`, `antwortAm` und `status` zu. Wer antwortet,
  kann den ursprünglichen Text nicht umschreiben.

### 2.2 Weitergabekontrolle

* Kein Datenexport an Dritte außer den in `UNTERAUFTRAGNEHMER.md`
  genannten.
* Der Kalender-Abo-Link trägt ein **Geheimnis je Person**, kein
  gemeinsames: jeder kann seinen eigenen Link zurückziehen, ohne allen
  anderen ihren kaputtzumachen. Der Vergleich läuft zeitgleich
  (`timingSafeEqual`), damit die Antwortdauer nicht verrät, wie viele
  Zeichen stimmen. Ein Durchlauf prüft, dass jeder offene Endpunkt der
  Cloud Functions ein solches Geheimnis hat — **ohne Ausnahmeliste**.
* Die Oberfläche setzt eine **Content-Security-Policy** mit
  `default-src 'none'` durch, erzeugt aus den tatsächlichen Skripten
  (`tools/csp.js`). Ein eingeschleustes Skript wird nicht ausgeführt.
  Nachgemessen im Browser, nicht aus der Kopfzeile gelesen
  (`tests/test-csp.js`, `tests/test-xss.js`,
  `tests/test-xss-werbung.js`).
* Zusätzliche Kopfzeilen, am 14.9. an der ausgelieferten Adresse
  gemessen: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Content-Security-Policy: frame-ancestors 'none'`,
  `Permissions-Policy: geolocation=(), camera=(), payment=(), usb=(), microphone=(self)`.

### 2.3 Abwehr von Fremdcode

Alle Abhängigkeiten der Cloud Functions werden regelmäßig geprüft.
Stand 14.9.: `npm audit --omit=dev` meldet **0 Lücken**. Das Firebase-SDK
im Browser steht auf 10.12.2; die einzige dafür gemeldete Lücke
(CVE-2024-11023) ist seit 10.9.0 behoben.

---

## 3. Verfügbarkeit und Belastbarkeit (Art. 32 Abs. 1 lit. b, c)

### 3.1 Sicherung

| Was | Rhythmus | Aufbewahrung | Fundstelle |
|---|---|---|---|
| Vollsicherung der Datenbank | täglich 02:40 | **7 Tage** | `functions/index.js`, `BACKUP_TAGE = 7` |
| Tages-Sicherung der Bestände | täglich 23:45 | rollierend | `dailyArchive` |
| Wochensicherung Material | wöchentlich | 52 Wochen | `archives` |

> **Korrektur gegenüber einer älteren Angabe:** In `docs/RECHT.md` stand
> „Nächtliche Vollsicherung: 30 Tage". Das ist falsch — im Code stehen
> **7**. Eine Frist zuzusagen, die das System nicht einhält, ist genau
> die Art Angabe, die in einem AV-Vertrag teuer wird. Hier steht, was
> das Programm tut. Ob sieben Tage genügen, ist eine Entscheidung; sie
> zu ändern ist eine Zeile.

Der Stand der letzten Sicherung ist in der App sichtbar (Verwaltung →
System) und nennt bei einem Fehlschlag den Grund, statt zu schweigen.

### 3.2 Wiederherstellbarkeit

Rückspielen erfolgt über den Firestore-Import aus dem Sicherungsordner.
**Nicht geprobt.** Eine Wiederherstellung, die nie geübt wurde, ist eine
Hoffnung und keine Maßnahme — das gehört zur Wahrheit dieser Anlage.
Als Übung ist es überschaubar; sie steht in `docs/OFFEN.md`.

### 3.3 Verfügbarkeit im Betrieb

* Die App funktioniert **ohne Netz weiter**: Eingetipptes und Abgehaktes
  wird lokal gemerkt und gesendet, sobald wieder Verbindung besteht
  (Firestore-Offline-Speicher).
* Ausfälle der Plattform selbst liegen bei Google; eine eigene
  Verfügbarkeitszusage gibt es **nicht**. Wer eine braucht, muss sie
  ausdrücklich vereinbaren — siehe `AV-VERTRAG-ENTWURF.md`, § 11.

---

## 4. Verfahren zur Überprüfung (Art. 32 Abs. 1 lit. d)

Das ist der Teil, den die meisten TOM-Anlagen mit einem Satz abtun.

* **102 automatische Durchläufe** über die Oberfläche in drei Rollen,
  bei jeder Änderung.
* **864 Zusicherungen** über die Sicherheitsregeln der Datenbank.
* Jeder sicherheitsrelevante Durchlauf trägt **Gegenproben**: die
  Maßnahme wird versuchsweise ausgehebelt, und wenn der Durchlauf dann
  nicht rot wird, prüft er nichts. Das ist im Vorgehen festgeschrieben,
  nicht Zufall.
* Die Auslieferung ist ihrerseits geprüft: jede öffentlich abrufbare
  Datei muss auch einen Deploy auslösen, sonst schlägt ein Durchlauf an
  (`tests/test-ausliefern.js`).
* Sicherheitsbefunde und ihre Behebung sind in `docs/SICHERHEIT.md`
  dokumentiert, **einschließlich der Fehler**, die dabei gemacht wurden.

**Was das nicht ist:** ein Penetrationstest durch Dritte, eine
Zertifizierung oder ein Audit. Es gibt keine ISO 27001 und keinen
SOC-Bericht für StudioChat selbst — nur für die Plattform darunter.

---

## 5. Auftragskontrolle

* Der Auftragsverarbeiter verarbeitet ausschließlich nach Weisung des
  Verantwortlichen (siehe Vertrag § 4).
* Der Kreis der Personen mit administrativem Zugang ist auf
  `[…]` begrenzt und in `VERARBEITUNGSVERZEICHNIS.md` benannt.
* Vertraulichkeitsverpflichtung nach Art. 28 Abs. 3 lit. b: siehe
  Vertrag § 5.

---

## 6. Offene Maßnahmen — ehrlich als offen geführt

| Maßnahme | Stand | Aufwand |
|---|---|---|
| Passwort-Mindestlänge auf 12 Zeichen | offen | eine Zeile |
| Zweitfaktor für Chef-Konten | offen | mittel |
| Auskunft je Person auf Knopfdruck (Art. 15) | **fehlt**, heute Handarbeit | mittel |
| Wiederherstellung aus der Sicherung einmal proben | nicht geprobt | klein |
| Externer Penetrationstest | nicht erfolgt | Geld |

Diese Liste gehört in die Anlage und nicht in eine Schublade. Ein Kunde,
der sie liest, weiß woran er ist — und ein Kunde, der sie nicht
bekommt, findet die Lücken trotzdem, nur später und im falschen Moment.
