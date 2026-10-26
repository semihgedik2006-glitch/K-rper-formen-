# Was zur Veröffentlichung noch fehlt — Prüfung und Plan

Stand: 26. Oktober 2026, geprüft auf `main` mit Stand PR #340.
Ergänzt `verkaufsplan-roadmap.md` (Abschnitt 3 dort bleibt der Überblick;
hier stehen die Einzelbefunde und der Weg, sie abzuarbeiten).

> **Auftrag aus dem Betrieb:** „prüf mal alles was zur veröffentlichung
> fehlen würde und gib mir konkrete fragen und eine liste was noch fehlt
> und wie wir sie am besten angehen schritt für schritt“

> **Stand 26.10.2026, abends:** Die Antworten auf die Fragen stehen in
> `entscheidungen.md`, die Namensrecherche in `name-recherche.md`.
> V8 (Kreuztest) ist erledigt: der Durchlauf liest alle 71 Pfade des
> Firmen-Zweigs aus den Regeln.

**„Veröffentlichung“ heisst hier:** eine fremde Firma bekommt einen
Zugang, unterschreibt, zahlt — und nichts davon fällt uns danach auf die
Füsse.

---

## 1. Was heute gemessen wurde

| Prüfung | Ergebnis | wie |
|---|---|---|
| App erreichbar | ✅ `https://formenchat.web.app/` antwortet 200 | `curl` |
| **Stripe im Betrieb eingerichtet** | ✅ **ja** — der Webhook antwortet „Unterschrift stimmt nicht“ (400). Ohne Schlüssel käme „Kasse nicht eingerichtet“ (503), siehe `functions/index.js`, `stripeHaken` | `curl` ohne Anmeldung; harmlos, der Endpunkt ist öffentlich |
| Stripe Test- oder Livemodus | **nicht feststellbar** | steht nur im Stripe-Dashboard |
| Kasse verlangt Anmeldung | ✅ „Bitte zuerst einloggen.“ | `curl` auf `stripeKasse` |
| Durchläufe Abo, Paywall, Demo, Einrichtung, Sicherung, Stripe-Felder, Auskunft, Lizenzen, Stilllegung, Firmenverwaltung | ✅ **13 von 13 grün** | `bash tests/alle.sh <muster>` lokal, 26.10.2026 |
| Regeltest (Firestore) | ✅ grün in CI | GitHub Actions `regeltest` auf diesem Zweig |
| Anmeldeweg mit echtem Firebase | **nicht testbar** in dieser Umgebung (Proxy-Zertifikat, siehe `CLAUDE.md`) | — |

**Nicht gelaufen:** der Gesamtdurchlauf aller ~200 Oberflächentests und
die Messungen bei 320–1920 px. Für eine reine Doku-Änderung nicht nötig;
vor der Freigabe an einen Kunden schon (Schritt 4.7).

---

## 2. Befunde — was fehlt oder nicht stimmt

Sortiert nach **Muss** (ohne das keine Veröffentlichung), **Soll** (vor
dem dritten Kunden), **Kann**. Jede Zeile hat eine Fundstelle.

### 2.1 Muss

| # | Befund | Fundstelle | warum es zählt |
|---|---|---|---|
| **V1** | **Die AGB versprechen eine Löschung, die es nicht gibt.** § 8 (2): „Danach werden sie gelöscht.“ Der Code archiviert nur; „endgültig entfernt wird von Hand mit einem Werkzeug“ — **dieses Werkzeug gibt es nicht** (`tools/` enthält keins). Das Löschkonzept sagt zum Vertragsende nichts. Auch die Anmeldekonten der Firma bleiben bestehen | `functions/index.js` `firmaLoeschen` (Kommentar), `tools/`, `docs/av/LOESCHKONZEPT.md` | ein Versprechen im Vertrag, das wir nicht halten können — und nach Art. 28 Abs. 3 g DSGVO eine Pflicht des Auftragsverarbeiters |
| **V2** | **Die AGB in der App verweisen auf das Repository.** § 7 (2): „der Entwurf liegt unter docs/av/“ — ein Kunde kann damit nichts anfangen, und „Entwurf“ steht in einem Vertragstext | `index.html`, `AGB_HTML` | der Kunde muss den AV-Vertrag **in der App** lesen und annehmen können |
| **V3** | **Stripe steht in keiner Datenschutzunterlage.** Weder Datenschutzerklärung noch Verarbeitungsverzeichnis noch Unterauftragnehmer nennen Stripe, obwohl Name, Mail und Zahlungsdaten der Geschäftsführung dorthin gehen | `docs/av/*.md` (0 Treffer), `index.html` | Pflichtangabe; der Anwalt muss entscheiden, ob Stripe Empfänger oder Unterauftragnehmer ist |
| **V4** | **Der Mailversand ist als Unterauftragnehmer nicht eingetragen** (Platzhalter), und er läuft über die SMTP-Daten in den GitHub Secrets — laut Runde 146 ein Gmail-Postfach | `docs/av/UNTERAUFTRAGNEHMER.md` §3, `deploy-functions.yml` `SMTP_*` | Anlage 2 zum AV-Vertrag ist unvollständig; Gmail für fremde Kunden wirkt nicht wie ein Unternehmen |
| **V5** | **Die 115 Lösungen sind das Körperformen-Mitarbeiterhandbuch im Wortlaut** — und werden **jeder Firma** angezeigt. Ausserdem liegt die Datei öffentlich im Repository und auf dem Hoster | `loesungen-basis.js` Kopf: „Quelle: Körper Formen — Mitarbeiter-Handbuch … der Wortlaut ist der des Handbuchs“; `index.html` lädt ohne Firmenprüfung | wem das Handbuch gehört, ist offen — und es ginge an Wettbewerber |
| **V6** | **Die Demo ist Körperformen**: Name, Slogan „EMS-Training in Köln und Umgebung“, die 14 echten Standorte | `demo-daten.js` Zeilen 99, 574, 1390 | einem Wettbewerber die eigenen Standorte vorzuführen — und die Marke ohne Absprache zu zeigen |
| **V7** | **Premium sperrt nur Nachweise und Auswertung.** Zeiterfassung, DATEV-Datei, Schulungen mit Video und der Schichtplaner stehen jeder Stufe offen | `index.html` `PREMIUM_TABS = ['nachweise','report']` | was ein Kunde einmal hat, bekommt er nicht weggenommen (Bestandsschutz) — die Stufen müssen **vor** dem ersten Kunden stehen |
| **V8** ✅ | **Der Kreuztest der Firmengrenze ist eine Handliste** *(erledigt 26.10.: liest jetzt alle Pfade aus den Regeln)*: 34 Einträge, unter `firmen/{f}` stehen **56 Sammlungen** | `tests/rules/kreuz.test.js`, `firestore.rules` | keine nachgewiesene Lücke, aber eine neue Sammlung kann ungeprüft durchrutschen — fünfmal passiert (`CLAUDE.md`) |
| **V9** | **Die Adresse heisst `formenchat`** — `formenchat.web.app`, Anmeldefenster von Google zeigen `formenchat.firebaseapp.com` | `konfig.js` `firebase.authDomain`, Hosting | ein fremder Kunde sieht den Namen eines anderen Betriebs |
| **V10** | **„Zugang anfragen“ führt ins Leere**: `vertriebMail` ist leer, das Fenster zeigt nur einen Hinweis | `konfig.js` | der einzige Weg, wie ein Interessent sich aus der App meldet |
| **V11** | **Der Name „StudioChat“ ist nicht geprüft** — gleichnamiges Softwareprodukt `studiochat.io` | `docs/MARKE.md` | Umbenennen wird mit jedem Kunden teurer |
| **V12** | **Nichts davon ist anwaltlich geprüft**: AGB, AV-Vertrag mit Anlagen, Datenschutzerklärung | jede Datei sagt es selbst | ohne AV-Vertrag darf der Kunde die App nicht einsetzen |
| **V13** | **Gewerbe, Steuer, Versicherung** ungeklärt (Kleinunternehmer? Familienversicherung als Student?) | `docs/ABO-PLAN.md` §5 | steht vor der ersten Rechnung; Stripe-Steuereinstellung hängt daran |

### 2.2 Soll

| # | Befund | Fundstelle | Folge |
|---|---|---|---|
| **V14** | **Die Testphase startet als Basic.** Ein Interessent sieht Premium während der 30 Tage nur als Schloss | `functions/index.js` `firmaAnlegen`: `stufe: 'basic', status: 'test'` | er kauft, was er kennt — also Basic |
| **V15** | **„Konto ohne Feld `firma` = Körperformen“** an 7 Stellen in der App, rund 20 in den Functions und in den Regeln (`inFirma`) | `firestore.rules` `inFirma`, `index.html`, `functions/index.js` | heute durch die Freigabe abgesichert (jede Selbstanmeldung startet inaktiv), aber eine Altlast aus der Zeit mit einer Firma. Ein Fehler beim Freigeben gäbe Zugang zu Körperformen |
| **V16** | **Passwort aus `firmaAnlegen`** geht einmal an den Betreiber, der es dem neuen Chef weitergeben muss — der Weg dafür ist nicht festgelegt | `firmaAnlegen` → `passwort` | ein Passwort per WhatsApp ist der schlechteste Start; besser ein Link „Passwort setzen“ (`authMailSenden` kann das) |
| **V17** | **EMS-Wissen** sind eigene Kurzfassungen der FAQ von ems-training.de, mit Quelle. Deren Bedingungen erlauben Weiterverwendung mit Quelle — ob das in einem **bezahlten** Produkt gilt, ist nicht geprüft | `ems-wissen.js` Kopf | Frage an den Anwalt, kein Code |
| **V18** | **DATEV-Datei** wurde nie in einem echten LODAS eingespielt | `docs/datev/LIES-MICH.md` | im Verkauf nicht als „DATEV-fähig“ zusagen, bis das Lohnbüro es bestätigt |
| **V19** | **Keine Verfügbarkeitsmessung**, keine Statusseite | AGB § 2 (4) | ohne Messung keine Zusage; bei einer Störung erfährt man es vom Kunden |
| **V20** | **33 Durchläufe prüfen noch das bisherige Aussehen** | `docs/BEKANNTE-PROBLEME.md` P-20 | ein Teil der Tests misst nicht mehr, was ausgeliefert wird |
| **V21** | **Das ganze Produkt ist öffentlich im Netz.** `LICENSE` verbietet die Nutzung, kopieren lässt es sich trotzdem | `LICENSE`, `CLAUDE.md` | Frage 10: bleibt das so? |
| **V22** | **Keine Produktseite** mit Preis, Demo-Link, Kontakt, Impressum des **Anbieters** | — | die App-Impressen sind die der Kunden; der Anbieter braucht eine eigene Seite |

### 2.3 Was schon steht und nicht mehr auf die Liste gehört

Kurz, damit es nicht doppelt bearbeitet wird: Mehrfirmen-Betrieb, Firma
anlegen mit Testphase, Mahnleiter mit Mails (`mahnMail`), Nur-Lesen und
Sperre in den Regeln, Stripe-Kasse und -Portal (eingerichtet),
Zustimmung zu AGB/AV an der Kasse, Export bei Kündigung, Auskunft,
Löschantrag, Vorfallmeldung, Zwei-Faktor, nächtliche Sicherung mit
geprobter Wiederherstellung, Löschfrist für Stempelzeiten, Formi nur für
Körperformen, Google-Tabelle nur für eine Firma (`SHEETS_FIRMA`).

---

## 3. Konkrete Fragen

Jede Frage mit meiner Empfehlung, damit „passt so“ als Antwort reicht.

| # | Frage | Empfehlung | blockiert |
|---|---|---|---|
| 1 | **Gehört das Mitarbeiterhandbuch (115 Lösungen) dir oder Körperformen — und darf es an fremde Studios?** | Für fremde Firmen **ausblenden**; ihnen einen leeren Rettungsring mit „eigene Lösungen anlegen“ geben. Die Datei aus dem öffentlichen Hosting nehmen und nur für Körperformen laden | V5 |
| 2 | **Weiss die Körperformen-Geschäftsführung, dass die App an andere Studios geht, und ist sie einverstanden?** Ist euer Betrieb Teil eines grösseren Körperformen-Netzes? | schriftlich klären, bevor die erste Demo bei einem Fremden läuft | V5, V6, Vertrieb |
| 3 | **Neutraler Name für die Demo-Firma?** | „Studio Muster“ mit erfundenen Orten (Nordstadt, Südpark, Am Markt) | V6 |
| 4 | **Bleibt „StudioChat“?** | Registerrecherche DPMA/EUIPO in Auftrag geben (ein Anwalt macht das mit V12 zusammen). Fällt sie schlecht aus: jetzt umbenennen, nicht nach dem ersten Kunden | V11 |
| 5 | **Welche Adresse soll die App haben?** (z. B. `app.<eure-domain>.de`) | eigene Domain, auf Firebase Hosting verbunden; `authDomain` auf dieselbe Domain | V9, V4 |
| 6 | **Welcher Mailanbieter für `support@` und `noreply@`?** | ein Anbieter mit Servern in der EU und AV-Vertrag (für die Wahl reicht der Satz „EU, AV-Vertrag, eigene Domain“) | V4, V10 |
| 7 | **Stripe: Test- oder Livemodus, und sind die vier Preise angelegt?** | erst einen kompletten Durchgang im **Testmodus** (Schritt 4.6), dann live | V7, Abrechnung |
| 8 | **Passt die Stufenaufteilung** — Zeiterfassung, DATEV, Schulungen mit Video, Schichtplaner als Premium? | ja; Nachweise und Auswertung bleiben Premium | V7 |
| 9 | **Testphase mit Premium statt Basic?** | **ja** — 30 Tage alles, danach wählt der Kunde | V14 |
| 10 | **Bleibt das Repository öffentlich?** | **privat machen, sobald der erste fremde Kunde zahlt.** Zu prüfen ist vorher, ob die Actions auf dem kostenlosen Kontingent dann noch reichen | V21 |
| 11 | **Wie lange nach Vertragsende werden Daten gelöscht, und wer drückt den Knopf?** | 30 Tage wie in den AGB, danach ein Werkzeug, das Datenbank, Dateien und Anmeldekonten der Firma löscht und ein Protokoll schreibt; Sicherungen laufen nach 7 Tagen von selbst aus | V1 |
| 12 | **Kleinunternehmer oder Regelbesteuerung — Termin beim Steuerberater gemacht?** | vor dem ersten Abschluss | V13 |
| 13 | **Welcher Anwalt, welches Budget?** | ein Paket: AGB, AV-Vertrag mit Anlagen, Datenschutzerklärung, Markenrecherche, Nutzung EMS-Wissen | V12, V11, V17 |
| 14 | **Support: welche Zeiten, welcher Kanal, wer vertritt dich?** | Mo–Fr 9–18 Uhr per Mail, Antwort am nächsten Werktag, Ausfall binnen 4 Stunden; Vertretung benennen | Vertrag |
| 15 | **Wie bekommt ein neuer Chef sein Passwort?** | per Link „Passwort setzen“ an seine Mail, nicht als Text | V16 |
| 16 | **Gibt es schon Interessenten?** | die ersten drei werden die Piloten | Vertrieb |

---

## 4. Schritt für Schritt

Die Reihenfolge folgt einer Regel: **erst entscheiden, dann bauen, dann
prüfen lassen, dann verkaufen.** Was nur du entscheiden kannst, steht
vorne, weil alles andere darauf wartet. „Fertig, wenn“ ist das
Prüfkriterium, nicht ein Gefühl.

### Schritt 1 — Entscheidungen (Woche 1, ~2 Stunden von dir)

Die 16 Fragen aus Abschnitt 3 beantworten. Wo du „passt so“ sagst, gilt
die Empfehlung.

**Fertig, wenn:** jede Frage eine Antwort hat; Frage 2 schriftlich mit
der Geschäftsführung.

### Schritt 2 — Termine anstossen (Woche 1, parallel)

1. **Anwalt** anfragen (Paket aus Frage 13). Die Entwürfe in `docs/av/`
   und `docs/AGB-ENTWURF.md` reichen für die Anfrage — nicht warten, bis
   alles fertig ist. **Das ist der längste Weg.**
2. **Steuerberater**, Gewerbeanmeldung, Krankenkasse fragen.
3. **Domain** kaufen, Mailanbieter wählen.

**Fertig, wenn:** drei Termine stehen, Domain gehört dir.

### Schritt 3 — Bauen, was im Code fehlt (Woche 1–3, Claude)

Je Punkt ein eigener PR, jeder mit Test und Gegenprobe:

| Reihenfolge | Was | Befund | Aufwand |
|---|---|---|---|
| 3.1 | **Kreuztest aus `firestore.rules` ableiten**: jede Sammlung unter `firmen/{f}` gegen Firma B, neue Sammlung ohne Eintrag = rot | V8 | M |
| 3.2 | **Premium serverseitig**: Zeiterfassung und DATEV in den Functions, Schulungsvideos in `storage-videos.rules`, Schichtplaner in `firestore.rules` (beide Pfade); Testphase = Premium | V7, V14 | M |
| 3.3 | **Demo-Firma neutral**, Körperformen-Inhalte nur für Körperformen laden | V5, V6 | M |
| 3.4 | **Firma endgültig löschen**: Werkzeug für Datenbank, Dateien und Konten, mit Vorschau „das träfe es“ und Protokoll; Löschkonzept ergänzen | V1 | M |
| 3.5 | **AV-Vertrag in der App** (Rechtliches → Reiter „AV-Vertrag“), § 7 (2) der AGB darauf zeigen lassen | V2 | S |
| 3.6 | **Neuer Chef bekommt einen Link statt eines Passworts** | V16 | S |
| 3.7 | Altlast „Konto ohne firma = Körperformen“: zuerst ein Werkzeug, das zeigt, **welche Konten es betrifft**; erst danach nachtragen und die Ausnahme in den Regeln entfernen (Hausregel für echte Konten) | V15 | M |

Danach jeweils `node tools/csp.js --setzen`, Messung der Knöpfe bei
320 / 390 / 430 / 820 / 1280 / 1440 / 1920 px und ein Eintrag in
`NEUIGKEITEN`, wo etwas sichtbar ist.

**Fertig, wenn:** alle sieben PRs gemergt, Regeltest und Gesamtdurchlauf
grün.

### Schritt 4 — Einrichten und durchspielen (Woche 3–4, du + Claude)

1. **Domain** auf Firebase Hosting verbinden, `authDomain` umstellen
   (V9). *Danach Anmeldung mit Google einmal von Hand prüfen — hier
   nicht testbar.*
2. **Mail**: neue SMTP-Werte in die GitHub Secrets (`MAIL-SETUP.md`),
   Testmail an web.de, GMX, Outlook (V4).
3. `vertriebMail` setzen (V10).
4. **Unterlagen ergänzen**: Mailanbieter und Stripe in `docs/av/` und
   Datenschutzerklärung (V3, V4) — Formulierung aus der Anwaltsantwort.
5. **Stripe-Preise** anlegen (Testmodus) und als Secrets hinterlegen.
6. **Probelauf am Stück** mit einer Testfirma: anlegen → Link an den
   Chef → Team tritt per QR bei → 30 Tage Premium → Testzahlung →
   Mahnstufe vorstellen (`aboUhrJetzt`) → Export → Kündigung →
   Löschwerkzeug. Jeder Schritt mit Bildschirmfoto.
7. **Gesamtdurchlauf** aller Tests und Messung an allen sieben Breiten.

**Fertig, wenn:** der Probelauf ohne Handarbeit durchgeht und das
Protokoll in `docs/FORTSCHRITT.md` steht.

### Schritt 5 — Anwalt einarbeiten (Woche 4–7)

1. Rückmeldung in `docs/AGB-ENTWURF.md`, `docs/av/` und die Texte in der
   App übernehmen.
2. Vermerk „Entwurf“ überall entfernen, wo der Anwalt freigegeben hat —
   und nur dort.
3. Stand mit Datum in `docs/RECHT.md` festhalten.

**Fertig, wenn:** der Anwalt schriftlich freigegeben hat.

### Schritt 6 — Auftritt (Woche 5–7, parallel zu 5)

1. **Produktseite** auf der eigenen Domain: ein Satz Nutzen, drei Bilder
   aus der neutralen Demo, Demo-Link, Preise, Kontakt, **Impressum und
   Datenschutz des Anbieters**.
2. **Preisblatt** (eine Seite) und Produktmappe neu fassen — `PITCH.md`
   ist überholt.
3. **Onboarding**: drei kurze Videos (Chef richtet ein / Team tritt bei /
   erster Tag) und ein Aushang mit QR-Code. Solange ein Video fehlt:
   Platzhalter „Video folgt“.
4. **Statusmessung**: externer Pinger auf die App und eine Function.

**Fertig, wenn:** die Seite online ist und ein Fremder ohne Erklärung
die Demo findet.

### Schritt 7 — Erste Kunden (ab Woche 7)

1. **Drei Pilotstudios** ansprechen (zuerst wer schon gefragt hat).
2. Demo nach `verkaufsplan-roadmap.md` §4.4, 20 Minuten.
3. Firma anlegen, gemeinsamer Einrichtungstermin (60 min).
4. AV-Vertrag und AGB an der Kasse bestätigen lassen.
5. Rückmeldungen nach 2, 6, 12 Wochen.
6. Erst danach: Stripe live, Werbung, Selbstregistrierung.

**Fertig, wenn:** die erste Zahlung eingegangen ist.

---

## 5. Zeitbedarf grob

| Schritt | Kalenderzeit | deine Zeit |
|---|---|---|
| 1 Entscheidungen | Woche 1 | ~2 h |
| 2 Termine | Woche 1 | ~1 h + Termine |
| 3 Bauen | Woche 1–3 | Abnahme je PR ~15 min |
| 4 Einrichten | Woche 3–4 | ~3 h |
| 5 Anwalt | Woche 4–7 (Wartezeit) | ~2 h |
| 6 Auftritt | Woche 5–7 | ~4 h (Videos) |
| 7 Piloten | ab Woche 7 | ~2 h je Pilot zum Start |

**Der Engpass ist der Anwalt**, nicht der Code. Deshalb steht er in
Schritt 2 und nicht in Schritt 5.

---

## 6. Was hier nicht gesichert ist

- Ob Stripe im Test- oder Livemodus läuft — nur im Dashboard sichtbar.
- Ob das Google-DPA in der Cloud-Konsole angenommen ist.
- Der Anmeldeweg mit dem echten Firebase — in dieser Umgebung nicht
  testbar.
- Der Gesamtdurchlauf aller Oberflächentests ist für diese Prüfung
  **nicht** gelaufen, nur die 13 verkaufsrelevanten.
- Rechtliche Einschätzungen (V3, V5, V17) sind Fragen, keine Antworten.
