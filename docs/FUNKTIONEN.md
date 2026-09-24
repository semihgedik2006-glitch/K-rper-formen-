# StudioChat — vollständige Funktionsübersicht

**Stand:** 17. September 2026 · Erhoben am Quelltext, nicht aus dem
Gedächtnis.

Dieses Dokument ist die **Bestandsliste**: was es gibt, was es nicht
gibt, und was ich nicht prüfen konnte. Es ist die Grundlage für das
Kundenhandbuch — was hier nicht steht, darf dort nicht behauptet werden.

---

## Wie dieses Dokument zu lesen ist

| Kennzeichnung | Bedeutung |
|---|---|
| **VERIFIZIERT** | Am Quelltext nachgewiesen. Wo es nützlich ist, steht die Fundstelle dabei. |
| **NICHT GEFUNDEN** | Gesucht und nicht vorhanden. Das ist eine Aussage, keine Lücke im Bericht. |
| **NICHT VERIFIZIERBAR** | Ich kann es von hier aus nicht prüfen — meist, weil es Produktivzugriff bräuchte. |
| **TEILWEISE** | Vorhanden, aber nicht so vollständig, wie der Name nahelegt. |
| **VERMUTUNG** | Eine Einschätzung, ausdrücklich keine Feststellung. |

**Was ich nicht prüfen konnte, und warum das hier steht:** Ich habe
keinen Zugang zum Produktivprojekt `formenchat` und fordere ihn nicht
an. Alles, was den Zustand der laufenden Datenbank oder der
Firebase-Konsole betrifft, ist deshalb **NICHT VERIFIZIERBAR** — nicht
weil es fehlt, sondern weil ich es nicht sehen darf.

---

## 1. Kennzahlen

| | | Quelle |
|---|---|---|
| Anwendung | `index.html`, **34.300 Zeilen** | `wc -l` |
| Serverfunktionen | **62** Cloud Functions | `grep -c '^exports\.'` |
| Sicherheitsregeln | `firestore.rules`, **2.170 Zeilen** | `wc -l` |
| Automatische Durchläufe (Oberfläche) | **142** (139 `test-*`, dazu zwei Prüfungen und ein Belastungstest) | `ls tests/*.js` ohne `stub-` |
| Automatische Durchläufe (Regeln) | **17 Dateien**, 1.177 Einzelprüfungen (gezählt am 24.9.2026) | `tests/rules/` |
| Ansichten | 16 | `NAV` in `index.html` |
| Sammlungen in der Datenbank | 31 | `firestore.rules` |
| Build-Schritt | **keiner** | kein `package.json` im Wurzelverzeichnis |

---

## 2. Rollen

**VERIFIZIERT.** Drei Rollen und ein Zusatzkennzeichen.

| Rolle | Wert im Profil | Was sie bedeutet |
|---|---|---|
| Mitarbeiter | `role: 'mitarbeiter'` | Normaler Zugang |
| Studioleitung | `role: 'leiter'` | Verwaltet die ihr zugeordneten Studios |
| Geschäftsführung | `role: 'chef'` | Verwaltet alle Studios des eigenen Betriebs |
| Betreiber | `admin: true` **zusätzlich** auf einem Chef-Konto | Sieht Firmen-Stammdaten, **keine Inhalte** |

**Das Zeiterfassungsterminal ist keine Rolle**, sondern ein
registriertes Gerät. Es meldet sich nicht als Benutzer an.

Das Feld `admin` vergibt ausschließlich ein Admin; die Sicherheitsregel
verhindert ausdrücklich, dass sich jemand selbst dazu macht.

---

## 3. Anmeldung und Konto

| Funktion | Status | Anmerkung |
|---|---|---|
| Anmeldung E-Mail + Passwort | **VERIFIZIERT** | Firebase Authentication |
| Google-Login, Apple-Login, SSO | **NICHT GEFUNDEN** | `GoogleAuthProvider` kommt im Quelltext nicht vor |
| Selbstregistrierung | **VERIFIZIERT** | erzeugt immer `mitarbeiter`, erzwungen in den Regeln |
| Firmencode beim Registrieren | **VERIFIZIERT** | je Betrieb einstellbar, liegt an einem für niemanden lesbaren Ort |
| Freigabe durch den Chef | **VERIFIZIERT** | je Betrieb einstellbar; ohne Freigabe kommt das Konto an **keine** Daten |
| Passwort zurücksetzen | **VERIFIZIERT** | auf dem Anmeldebildschirm und durch den Chef auslösbar |
| E-Mail-Bestätigung | **TEILWEISE** | wird verschickt und angezeigt, **blockiert den Zugang aber nicht** |
| Passwort-Mindestlänge | **VERIFIZIERT: 6 Zeichen** | in `docs/av/TOM.md` ausdrücklich als zu kurz geführt |
| Zwei-Faktor-Authentifizierung | **NICHT GEFUNDEN** | offen geführt in `TOM.md` |
| Automatische Abmeldung bei Inaktivität | **NICHT GEFUNDEN** | |
| Sperre nach Fehlversuchen | **TEILWEISE** | Firebase drosselt selbst (`auth/too-many-requests`); eine eigene Sperre gibt es nicht |
| Geräte-/Sitzungsverwaltung | **NICHT GEFUNDEN** | keine Liste angemeldeter Geräte, kein „überall abmelden" |
| Konto sperren | **VERIFIZIERT** | `aktiv: false`, wirkt auf Regelebene |
| Zugang entfernen | **VERIFIZIERT** | `zugangEntfernen`, nur Chef; löscht Anmeldekonto **und** Profil |
| Eigenes Konto löschen | **NICHT GEFUNDEN** | die Funktion weist den eigenen Zugang ausdrücklich ab |

---

## 4. Die 16 Ansichten

**VERIFIZIERT** aus dem `NAV`-Verzeichnis.

| Ansicht | Kennung | Wer | Zweck |
|---|---|---|---|
| Start | `home` | alle | Was heute ansteht |
| Alles | `alles` | alle | Verzeichnis aller Ziele (nur im neuen Design) |
| Übersicht | `ich` | alle | Eigene Schichten, Zeiten, Daten |
| Persönlich | `persoenlich` | alle | Eigene Notizen, Termine, Ziele — für niemanden sonst lesbar |
| Chat | `chat` | alle | Kanäle je Studio |
| Direkt | `dm` | alle | Direktnachrichten zwischen zwei Personen |
| Infos | `ann` | alle | Aushänge der Leitung |
| Aufgaben | `todos` | alle | Aufgaben mit Frist |
| Putzplan | `putzplan` | alle | Putzpunkte zum Abhaken |
| Material | `material` | alle | Bestand und was fehlt |
| Geräte | `geraete` | alle | Geräte- und Schadensbuch |
| Probetraining | `probe` | alle | Durchgeführt und abgeschlossen, mit Quote |
| Team | `team` | alle | Schichten, Abwesenheiten, Übergabe, Schwarzes Brett |
| Dokumente | `docs` | alle | Dateien fürs Team |
| Archiv | `archive` | Leitung | Wochensicherungen Material |
| Verwaltung | `chef` | Leitung | neun Unterbereiche, siehe unten |

### Die neun Unterbereiche der Verwaltung

| Reiter | Wer | Zweck |
|---|---|---|
| Überblick | Leitung | Zahlen zum Betrieb |
| Erstellen | Leitung | Aufgaben, Aushänge, Umfragen anlegen |
| Team | nur Chef | Konten anlegen, freigeben, entfernen |
| Studios | nur Chef | Standorte anlegen und umbenennen |
| Firmen | **nur Betreiber** | Kunden anlegen, sperren, Abo eintragen |
| Nachweise | nur Chef | Qualifikationen mit Ablaufwarnung (**Premium**) |
| Anliegen | Leitung | Wünsche und Anliegen aus dem Team |
| Auswertung | Leitung | Zahlen über einen Zeitraum (**Premium**) |
| System | Leitung | Einstellungen, Papierkorb, Sicherung, Recht, Design, **Abo** |

---

## 5. Chat und Nachrichten

| Funktion | Status | Anmerkung |
|---|---|---|
| Kanäle je Studio | **VERIFIZIERT** | plus „Chefs" und „Leitung" mit Rollenprüfung |
| Frei gebildete Gruppen | **NICHT GEFUNDEN** | Kanäle folgen den Studios |
| Direktnachrichten 1:1 | **VERIFIZIERT** | nur die beiden Beteiligten können lesen — auch nicht der Chef, auch nicht der Betreiber |
| Text senden | **VERIFIZIERT** | max. 2.000 Zeichen, in der Regel erzwungen |
| Fotos senden | **VERIFIZIERT** | verkleinert auf 1.280 px längste Kante |
| Sprachaufnahmen | **VERIFIZIERT** | begrenzt, „etwa 30 Sekunden" |
| Nachricht bearbeiten | **VERIFIZIERT: 15 Minuten** | nur der Verfasser, Kennzeichen „bearbeitet" |
| Eigene Nachricht löschen | **VERIFIZIERT: 1 Stunde** | |
| Fremde Nachricht löschen | **VERIFIZIERT** | Chef und Studioleitung, jederzeit |
| Fremde Nachricht **bearbeiten** | **NICHT MÖGLICH** | die Regel lässt nur `pinned` zu |
| Anheften | **VERIFIZIERT** | Sache der Verwaltung |
| Reaktionen | **VERIFIZIERT** | sechs Zeichen, nur mit der eigenen Kennung |
| Umfragen | **VERIFIZIERT** | nur die eigene Stimme änderbar |
| Erwähnungen (@) | **VERIFIZIERT** | erzeugen eine eigene Push-Meldung |
| Ungelesen-Anzeige | **VERIFIZIERT** | |
| Lesestatus je Person | **NICHT GEFUNDEN** | kein „gelesen von …" |
| Suche im Chat | **VERIFIZIERT** | es gibt eine ansichtsübergreifende Suche |
| Nachrichten im Papierkorb | **NICHT GEFUNDEN — mit Absicht** | Kommentar im Code: „ein Papierkorb voller Nachrichten wäre eher ein Datenschutzproblem als eine Hilfe" |
| Chat-Hintergrundbild | **VERIFIZIERT** | liegt nur im Browser des Geräts |

### Hilfe im Studio (seit 22.9.2026)

Der Rettungsring in der Kopfzeile. 115 Probleme aus dem
Mitarbeiter-Handbuch, jedes mit nummerierten Schritten, dazu alles, was
das Team selbst festhält.

| | Stand | Anmerkung |
|---|---|---|
| Von jeder Seite aus erreichbar | **VERIFIZIERT** | `tests/test-loesungen.js` — Knopf und Zeile in „Alles" |
| 115 Einträge aus dem Handbuch | **VERIFIZIERT** | nachgezählt, `loesungen-basis.js` |
| Stichwortsuche mit Synonymen und einem Tippfehler | **VERIFIZIERT** | gegen den erwarteten Eintrag, mit Gegenprobe |
| **KI** | **NICHT VORHANDEN — und so beschriftet** | der Hinweis im Fenster nennt Synonyme, nicht KI; geprüft |
| Blättern nach Kategorie, ganze Liste durchgehen | **VERIFIZIERT** | 14 Kacheln mit Anzahl |
| Handbuch-Eintrag ändern legt eine eigene Fassung an | **VERIFIZIERT** | `basis`-Feld; der Eintrag steht danach **nicht** zweimal da (geprüft) |
| „Änderung verwerfen" stellt das Handbuch wieder her | **VERIFIZIERT** | Löschen der eigenen Fassung |
| Anlegen darf jeder Aktive | **VERIFIZIERT** | `tests/rules/loesungen.test.js` |
| Ändern und Löschen eigener Einträge: Verfasser und Verwaltung | **VERIFIZIERT** | dito, beide Welten; fremder Eintrag hat keinen Knopf und sagt warum |
| Firmenweit lesbar, mit Studio-Marke | **VERIFIZIERT** | bewusst keine Schranke — siehe P-01 |
| Bis zu drei Fotos, im Browser verkleinert, auch nachträglich | **VERIFIZIERT** | 1280 px / 300 KB, je Foto ein eigenes Dokument |
| Fotos erst beim Öffnen eines Eintrags geladen | **VERIFIZIERT** | die Liste lädt keines (Gegenprobe) |
| Im Export enthalten (Text und Schritte, ohne Fotos) | **VERIFIZIERT** | `tests/test-sicherung-inhalt.js` |
| Der Grundstock kostet keinen Lesevorgang | **VERIFIZIERT** | statische Datei, im Vorrat des Service Workers |
| **Video** | **NICHT VORHANDEN** | braucht echten Dateispeicher; die Begründung steht in `FORTSCHRITT.md`, Runde 95 |

### Schulung (seit 22.9.2026) — Grundgerüst

Webinare mit Schritten, Fragen und einem Nachweis. **Die Videos fehlen
noch**; das ist Absicht und der nächste Schritt.

| | Stand | Anmerkung |
|---|---|---|
| Module Schritt für Schritt, mit Fragen am Ende | **VERIFIZIERT** | `tests/test-schulung.js` |
| Teilnahme-Code statt Login | **VERIFIZIERT** | falscher Code wird abgewiesen, richtiger startet — beides geprüft |
| Ohne eigenes Konto benutzbar | **VERIFIZIERT** | der Durchlauf trägt einen Namen, auch wenn `uid` leer ist |
| Der Code bleibt bei der Verwaltung und ist wieder abrufbar | **VERIFIZIERT** | „Code zeigen" holt ihn hervor, Kopieren und Weitergeben daneben — `tests/test-schulung.js` |
| Zugeklappt steht nur die Kennung da | **VERIFIZIERT** | Gegenprobe: der geheime Teil steht in der geschlossenen Liste nicht |
| Ein Kollege kommt an keinen fremden Code | **VERIFIZIERT** | auch nicht über eine Abfrage der ganzen Sammlung — `tests/rules/schulung.test.js`, beide Welten |
| Drei Reiter in der Verwaltung, jeder mit seiner Zahl | **VERIFIZIERT** | `tests/test-schulung.js` |
| „Das steht für dich an" ganz oben, nur bei Pflichtmodulen | **VERIFIZIERT** | mit Gegenprobe, dass nichts Freiwilliges dort landet |
| Bremse gegen Durchprobieren | **VERIFIZIERT im Code** | 10 Fehlversuche je Gerät und Stunde; im Emulator nicht nachgestellt |
| Zeitpunkt, Studio und Gerätekonto am Durchlauf | **VERIFIZIERT** | steht in der Liste der Leitung |
| Fehlversuche je Frage gezählt **und erklärt** | **VERIFIZIERT** | falsch angeklickt bringt einen Hinweis, nicht nur ein Kreuz |
| Aktive Zeit statt Wanduhr | **VERIFIZIERT im Code** | zählt nur bei sichtbarem Fenster und offener Seite |
| Niemand kann einen Durchlauf anlegen | **VERIFIZIERT** | `tests/rules/schulung.test.js`, beide Welten |
| Ein fertiger Durchlauf ändert sich nicht mehr | **VERIFIZIERT** | dito — auch die Leitung kommt nicht mehr heran |
| Jeder sieht seine eigenen Zahlen | **VERIFIZIERT** | Karte oben auf der Seite; die Regeln lassen es ausdrücklich zu |
| Im Export enthalten | **VERIFIZIERT** | `tests/test-sicherung-inhalt.js` — mit der Gegenprobe, dass die einzelnen Fehlgriffe NICHT mitgehen |
| **Videos** | **NOCH NICHT** | entschieden ist eigener Speicher (zweiter Eimer). Bis dahin steht am Platzhalter „Video folgt" samt vorgesehener Länge |
| **„wirklich angesehen"** | **NOCH NICHT MESSBAR** | geht erst mit eigenem Player. Ein Häkchen wäre eine Behauptung, keine Messung — deshalb gibt es keines |
| Modul-Editor für die Leitung | **VERIFIZIERT** | anlegen, ändern, Schritte und Fragen sortieren, löschen — `tests/test-schulung.js` |
| Eigene Fassung eines Datei-Moduls | **VERIFIZIERT** | ersetzt es in der Liste, steht **nicht** zusätzlich daneben (Gegenprobe) |
| „Eigene Fassung verwerfen" stellt das Original her | **VERIFIZIERT** | dito |
| Halbe Fragen werden abgewiesen | **VERIFIZIERT** | ohne Titel, mit nur einer Antwort, mit Markierung auf einer leeren Antwort |

### Führung durch die App (seit 22.9.2026)

| | Stand | Anmerkung |
|---|---|---|
| Startet **einmal für jedes Konto**, auch auf einem geteilten Gerät | **VERIFIZIERT** | am Konto gemerkt (`users.tourGesehen`), nicht am Gerät; `tests/test-fuehrung.js` prüft beide Richtungen |
| Startet beim ersten Mal von selbst | **VERIFIZIERT** | `tests/test-fuehrung.js`, 175 Zusicherungen |
| Beim zweiten Mal nicht mehr | **VERIFIZIERT** | pro Gerät gemerkt, mit Fassungsnummer |
| Rollenabhängig | **VERIFIZIERT** | Chef 9 Schritte, Leiter 7, Mitarbeiter 6 |
| Jederzeit abbrechbar | **VERIFIZIERT** | |
| Wiederholbar | **VERIFIZIERT** | Profil → Aussehen |
| Im Terminal-Betrieb aus | **VERIFIZIERT** | dort liegt der Stempelbildschirm über allem |

### Aussehen (Profil → Aussehen, gilt nur auf diesem Gerät)

| Kann man einstellen | Stand | Anmerkung |
|---|---|---|
| Hell / Dunkel / Automatisch | **VERIFIZIERT** | `test-aussehen` |
| Schriftgröße, vier Stufen | **VERIFIZIERT** | |
| Dichte: normal oder kompakt | **VERIFIZIERT** | nur die Abstände; Schrift und Trefferflächen bleiben |
| Akzentfarbe: **„Lebendig" + 10 feste** | **VERIFIZIERT** | `test-akzent`, 79 Zusicherungen |
| Chat-Hintergrund, 9 + eigenes Foto | **VERIFIZIERT** | |
| Hintergrund der ganzen App, 5 | **VERIFIZIERT** | |
| Alles zurücksetzen | **VERIFIZIERT** | nimmt Meldungen, Tastenkürzel und Daten **nicht** mit |

**„Lebendig" ist die Voreinstellung** (seit 21.9.2026): die Akzentfarbe
ist die des Bereichs, in dem man steht — Start blau, Ich violett,
Nachrichten türkis, Aufgaben orange, Team pink, Verwaltung und Alles
schiefergrau. Knöpfe, Reiter, Abzeichen, Ränder und Schleier ziehen mit.
Wer eine feste Farbe wählt, bekommt sie überall.

Grün und Rot sind **keine** Bereichsfarben: sie sind in der ganzen App
„erledigt" und „überfällig". Die Begründung steht in
`DESIGN-SYSTEM.md`.

---

## 6. Kunden, Mitglieder, Kontakte

**NICHT VORHANDEN.** Diese Frage kommt regelmäßig, deshalb hier
ausdrücklich:

StudioChat ist ein **internes Team-Portal**. Es verwaltet keine
Studiokunden, keine Mitgliedschaften, keine Verträge und keine
Endkundenkontakte.

| Was es einmal gab | Status |
|---|---|
| Terminverwaltung (`appointments`) | **stillgelegt** — Regeln auf `false`, Oberfläche seit 13.8.2026 nicht mehr ausgeliefert |
| Marketing-Seiten (`marketing.html`, `wachstum.html`) | **stillgelegt** — nicht mehr ausgeliefert |
| `competitors`, `expansionLeads`, `studioMetrics`, `mkProjects` | **stillgelegt** — Regeln auf `false` |

Die Cloud Functions dafür bestehen fort. Das steht auch so im
Verarbeitungsverzeichnis, weil das beschreiben muss, was **möglich**
ist, nicht nur was gerade läuft.

**Die einzige Ausnahme:** Probetrainings werden gezählt — aber
ausdrücklich **ohne Kundennamen**, nur Zahlen und die Namen des eigenen
Teams. Ein Durchlauf prüft das bei jedem Lauf mit.

---

## 7. Arbeitsorganisation

| Funktion | Status | Anmerkung |
|---|---|---|
| Aufgaben mit Frist | **VERIFIZIERT** | Mitarbeiter dürfen seit 13.8. einmalige Aufgaben im eigenen Studio anlegen |
| Wiederkehrende Aufgaben | **VERIFIZIERT** | nur die Verwaltung |
| Abhaken mit Nachweis | **VERIFIZIERT** | Kennung, Name und Zeitpunkt werden mitgeschrieben |
| Foto zur Aufgabe | **VERIFIZIERT** | |
| Putzplan | **VERIFIZIERT** | Anlegen Chefsache, Abhaken darf jeder |
| Material mit Soll-Bestand | **VERIFIZIERT** | Eintragen darf jeder, das Soll setzt die Verwaltung |
| Geräte- und Schadensbuch | **VERIFIZIERT** | mit Protokoll je Gerät |
| Schichtplan | **VERIFIZIERT** | Einteilen nur die Verwaltung |
| Abwesenheiten | **VERIFIZIERT** | **zwei Arten: Urlaub und Krank** |
| Übergaben | **VERIFIZIERT** | 24 Stunden auf der Startseite sichtbar |
| Putzplan auf der Startseite (neues Aussehen) | **VERIFIZIERT** | ein Studio: die Punkte; mehrere: je Studio mit Zahl; ein Tipp öffnet das richtige Studio — nachgesehen für Mitarbeiter und Chef |
| Pausierte Putzpunkte zählen dort nicht | **VERIFIZIERT** | `tests/test-startseite-putz.js`, mit Gegenprobe: ohne Pause zählt derselbe Punkt |
| Kein Block fällt mehr stumm weg („Ausserdem") | **VERIFIZIERT** | `tests/test-startseite-offen.js`, mit Gegenprobe: ein zu kleiner Knopf (30 px) färbt den Durchlauf rot |
| Schwarzes Brett | **VERIFIZIERT** | Aushänge und Schichttausch |
| Dokumente | **TEILWEISE** | max. ~0,7 MB je Datei; größere nur als Link. **Hochladen und Löschen nur Chef und Leitung** |
| Qualifikationsnachweise | **VERIFIZIERT** | mit Ablaufwarnung; **Premium** |
| Anliegen an die Leitung | **VERIFIZIERT** | gegen nachträgliche Textänderung geschützt |
| Persönlicher Bereich | **VERIFIZIERT** | Notizen, Termine, Ziele — besitzergebunden |

---

## 8. Zeiterfassung

| Funktion | Status | Anmerkung |
|---|---|---|
| Stempeln am Terminal | **VERIFIZIERT** | Gerätegeheimnis + PIN der Person |
| Stempeln mit dem eigenen Telefon | **VERIFIZIERT** | Freigabe je Konto + sechsstelliger Code, der alle 30 Sekunden wechselt |
| Erfasst wird | **VERIFIZIERT** | Person, Zeitpunkt, Art, Studio, Gerät, Quelle, „fremdes Studio"-Kennzeichen |
| Standort / GPS | **NICHT ERFASST** | zusätzlich gesperrt durch `Permissions-Policy: geolocation=()` |
| IP-Adresse | **NICHT ERFASST** | |
| Gerätefingerabdruck | **NICHT ERFASST** | nur welches registrierte Terminal |
| Nachträglich ändern | **NICHT MÖGLICH** | `zeiten` steht auf `allow write: if false` — für **jeden**; überschrieben wird auch bei einer Korrektur nichts |
| Korrekturweg | **VERIFIZIERT** (24.9.2026) | Verwaltung → Zeiten: die Leitung trägt einen Stempel nach oder markiert einen als ungültig, **nur mit Grund**; beides bleibt sichtbar, auch für die Person selbst |
| Eigene Zeiten einsehen | **VERIFIZIERT** | vollständig |
| Automatische Löschfrist | **NICHT GEFUNDEN** | Stempelzeiten bleiben unbegrenzt liegen — offen, siehe `docs/RECHT.md` |
| PIN zurücksetzen durch die Leitung | **NICHT MÖGLICH** | der Hash liegt an einem Ort, den die Regeln für **alle** sperren |

---

## 9. Abo und Bezahlung

**Neu seit 16./17. September 2026.**

| Funktion | Status | Anmerkung |
|---|---|---|
| Abo-Zustand je Firma | **VERIFIZIERT** | neun Zustände, siehe `docs/ABO-PLAN.md` |
| Stufen Basic / Premium | **VERIFIZIERT** | Nachweise sind ein echter Riegel, die Auswertung nur ausgeblendet |
| Testphase beim Anlegen | **VERIFIZIERT** | 30 Tage, einstellbar über `TEST_TAGE` |
| Bestandsschutz | **VERIFIZIERT** | `bestandsschutz`, Ansehen ist die Voreinstellung |
| Stripe-Kasse | **VERIFIZIERT im Code**, **NICHT VERIFIZIERBAR im Betrieb** | ohne Schlüssel antwortet der Endpunkt `503` — das ist gemessen |
| Webhook mit Signaturprüfung | **VERIFIZIERT** | `constructEvent` über `req.rawBody` |
| Rechnungen, Kündigung | **VERIFIZIERT** | über das Stripe-Portal, nicht in der App |
| Mahnleiter | **VERIFIZIERT** | zwei Leitern, 48 Zusicherungen |
| Zustand `nurlesen` in den Regeln | **VERIFIZIERT** | 54 Schreibregeln, 42 Zusicherungen mit Gegenproben |
| PayPal, Überweisung, Rechnungsstellung | **NICHT GEFUNDEN** | widerspricht dem AGB-Entwurf, siehe `docs/RECHT.md` |

---

## 10. Benachrichtigungen

| Funktion | Status | Anlass |
|---|---|---|
| Push aufs Handy | **VERIFIZIERT** | neue Nachricht, neue Aufgabe, neuer Aushang, Direktnachricht, Erwähnung |
| Erinnerung an fällige Aufgaben | **VERIFIZIERT** | geplanter Lauf |
| Ablaufende Nachweise | **VERIFIZIERT** | geplanter Lauf |
| Geburtstagsgrüße | **VERIFIZIERT** | geplanter Lauf |
| Tagesübersicht per E-Mail | **VERIFIZIERT** | 20:30 Uhr |
| Monatsbericht per E-Mail | **VERIFIZIERT** | am Monatsersten |
| Je Thema abschaltbar | **VERIFIZIERT** | Feld `mailAus` im Profil |
| Mahnmails | **VERIFIZIERT — bewusst NICHT abschaltbar** | eine Zahlungserinnerung ist keine Benachrichtigungseinstellung |

---

## 11. Was die App bewusst NICHT tut

**VERIFIZIERT**, jeweils mit Fundstelle in `docs/av/LOESCHKONZEPT.md`.

* **Kein Protokoll je Person**, wer die App wann benutzt hat. Die
  Nutzungszahlen sind anonym: pro Tag, ohne Konto, ohne Namen, ohne
  Uhrzeit. Die Sicherheitsregel lässt dort nur drei Felder durch.
* **Keine Standortdaten.**
* **Keine Kundennamen bei Probetrainings.**
* **Kein Analysedienst.** Kein Google Analytics, kein Meta Pixel, kein
  Clarity, kein Hotjar. Die Content-Security-Policy würde ein
  Tracking-Skript blockieren, selbst wenn es jemand einbaute.
* **Keine Cookies.** `document.cookie` kommt im Quelltext nicht vor;
  verwendet wird `localStorage`.
* **Keine Ende-zu-Ende-Verschlüsselung.** Der Betreiber könnte über die
  Firebase-Konsole technisch auf die Daten zugreifen. Das ist bei einem
  Auftragsverarbeiter der Normalfall und steht hier, damit niemand
  etwas anderes annimmt.

---

## 12. Berechtigungsmatrix

**VERIFIZIERT** aus `firestore.rules`. „Oberfläche" und „Regel" werden
getrennt ausgewiesen, weil der Unterschied der Kern der Sache ist.

| Funktion | Mitarbeiter | Leitung | Chef | Betreiber |
|---|---|---|---|---|
| Aufgaben abhaken | ✓ | ✓ | ✓ | — |
| Aufgaben anlegen (einmalig, eigenes Studio) | ✓ | ✓ | ✓ | — |
| Aufgaben anlegen (wiederkehrend) | — | ✓ | ✓ | — |
| Putzpunkte abhaken | ✓ | ✓ | ✓ | — |
| Putzplan anlegen | — | — | ✓ | — |
| Material eintragen | ✓ | ✓ | ✓ | — |
| Chat schreiben | ✓ | ✓ | ✓ | — |
| Fremde Nachricht löschen | — | ✓ | ✓ | — |
| Direktnachrichten anderer lesen | — | — | **—** | **—** |
| Dokumente hochladen | **—** | ✓ | ✓ | — |
| Schichten einteilen | — | ✓ | ✓ | — |
| Abwesenheit melden | ✓ | ✓ | ✓ | — |
| Abwesenheit genehmigen | — | ✓ | ✓ | — |
| Nachweise sehen | nur eigene | nur eigene | alle | — |
| Konten anlegen / freigeben | — | — | ✓ | — |
| Rolle ändern | — | — | ✓ | — |
| Studios anlegen | — | — | ✓ | — |
| Einstellungen ändern | — | — | ✓ | — |
| Abo ansehen | — | — | ✓ | ✓ |
| Abo von Hand setzen | — | — | — | ✓ |
| Firmen anlegen / sperren | — | — | — | ✓ |
| Kundeninhalte einsehen | — | — | — | **—** |
| Stempelzeiten anderer | — | eigene Studios | alle | — |
| Stempel-PIN lesen | — | — | — | **—** |

> ### ⚠️ Die Studiogrenze beim LESEN — halb technisch, halb Anzeige
>
> **Gefunden am 16.9.2026, für die Personendaten behoben am 17.9.2026.**
> Ausführlich in `docs/BEKANNTE-PROBLEME.md`, P-01.
>
> Zwischen **Betrieben** hält die Grenze technisch — 32 Sammlungen
> geprüft, mit Gegenproben.
>
> Zwischen **Studios desselben Betriebs** gilt seit dem 17.9. zweierlei:
>
> | | |
> |---|---|
> | **Schichten, Abwesenheiten, Übergaben** | technisch begrenzt, `meinStudio(studioKey)` in der Regel |
> | Aufgaben, Putzplan, Geräte, Material, Aushänge, Brett, Dokumente, Chat-Kanäle | **betriebsweit lesbar** |
>
> Die zweite Zeile ist für `studios/…` eine **Entscheidung** (ein
> defektes Gerät soll auch melden können, wer aushilft) und für Brett,
> Dokumente und Chat eine **offene Frage** — die liegen nicht unter
> einem Studio und bräuchten ein Feld im Dokument.
>
> Beim **Schreiben** war die Grenze immer echt (`manages()`).
>
> Echte Leseschranken gibt es bei: Direktnachrichten, persönlichem
> Bereich, Nachweisen, Stempelzeiten, Stempel-PINs.

---

## 13. Was ich nicht prüfen konnte

Vollständigkeitshalber, damit niemand es für geprüft hält:

| | Warum |
|---|---|
| Die ausgelieferten Firestore-Regeln in der Datenbank | bräuchte Produktivzugriff. Der Ausroll-Lauf meldet Erfolg; die Regeln selbst sind über den Emulator geprüft |
| Welche Firebase-Produkte in der Konsole aktiviert sind | dasselbe. Was die App **lädt**, ist verifiziert: fünf SDKs |
| Ob der Google-AV-Vertrag angenommen wurde | ein Häkchen in der Cloud-Konsole |
| Welcher SMTP-Anbieter eingesetzt wird | liegt in den GitHub-Secrets |
| Ladezeiten, Firestore-Lese-/Schreibzahlen im Betrieb | **NICHT GEMESSEN** |
| Ob die Wiederherstellung aus der Sicherung funktioniert | **nie geprobt** — steht so in `TOM.md` |
| Verhalten auf echten iOS-Geräten | geprüft wird mit Chromium |
