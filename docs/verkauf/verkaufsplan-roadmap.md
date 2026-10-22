# StudioChat an Kunden bringen — Verkaufsplan und Roadmap

Stand: 22. Oktober 2026 · erstellt aus dem Code und den Unterlagen in
`docs/`, nicht aus dem Gedächtnis.

> **Auftrag aus dem Betrieb:** „einen konkreten verkaufsplan bzw roadmap
> erstellen was alles erledigt werden muss und wie wir premium von
> standard unterscheiden und so und das wir die app bald auch mal an
> kunden bringen können“

**Wie dieses Dokument zu lesen ist.** Abschnitt 1 sagt, was da ist —
jede Zeile mit Fundstelle. Abschnitt 2 schlägt Standard und Premium vor.
Abschnitt 3 ist die Liste bis zum ersten zahlenden Kunden. Abschnitt 4
ist der Vertrieb. Abschnitt 5 sind die Fragen, die nur ihr beantworten
könnt. Wer nur zwei Minuten hat: **Abschnitt 0**.

Dieses Dokument ersetzt die älteren Pläne nicht, es fasst sie zusammen
und bringt sie auf den Stand von heute. Wo sie inzwischen überholt sind,
steht das dabei:

| Ältere Unterlage | Stand dort | was sich seitdem geändert hat |
|---|---|---|
| `docs/VERKAUF.md` | 7.8.2026 | Mandantenfähigkeit, Demo, Abo, AV-Unterlagen sind inzwischen gebaut |
| `docs/ROADMAP.md` | 9.8.2026 | „Zeiterfassung bewusst nicht“ gilt nicht mehr — Stempeln ist gebaut (`functions/index.js`, `stempeln`, `handyStempeln`) |
| `docs/PITCH.md` | 8.8.2026 | „ein Kunde = eine Datei `konfig.js`“ und „keine Zeiterfassung“ stimmen nicht mehr; vor einem Gespräch neu fassen |
| `docs/ABO-PLAN.md` | 16.9.2026 | gilt weiter; Preise dort ausdrücklich Platzhalter |

---

## 0. Kurzfassung

1. **Technisch ist StudioChat verkaufsfähig.** Mehrere Firmen in einer
   App, Firma anlegen, 30 Tage Testphase, Abo mit Mahnstufen,
   Stripe-Kasse, Demo ohne Anmeldung, Export für kündigende Kunden,
   Auskunft nach Art. 15, AV-Unterlagen als Entwurf — alles im Code
   belegt (Abschnitt 1).
2. **Was fehlt, ist überwiegend kein Code:** anwaltliche Durchsicht von
   AGB/AV-Vertrag/Datenschutz, Gewerbe und Steuer, der Markenname, ein
   Support-Versprechen, ein Preis und eine neutrale Demo-Firma.
3. **Standard und Premium:** Standard = das ganze Tagesgeschäft fürs
   Team. Premium = Dinge, die Führung, Haftung oder laufende Kosten
   betreffen: **Zeiterfassung, Nachweise, Schulungen mit Nachweis,
   automatischer Schichtplaner, Auswertung/Kennzahlen/Monatsbericht**,
   später der Assistent Formi. Heute sind nur Nachweise und Auswertung
   abgegrenzt, und nur die Nachweise mit einem echten Schloss.
4. **Preisvorschlag je Studio, Mitarbeiter unbegrenzt:** Standard
   **39 €** + 29 € je weiterem Studio, Premium **69 €** + 49 € je
   weiterem Studio (netto/Monat). Vergleichbare Anbieter liegen bei
   umgerechnet 4–9 € je Kopf oder 89 € je Standort (Quellen in 2.4).
5. **Weg zum ersten Kunden:** 3 Pilotstudios aus dem EMS-Umfeld, 3 Monate
   zum Pilotpreis, Abrechnung zunächst per Rechnung + SEPA statt Stripe.
   Realistisch ist ein erster zahlender Kunde **8–12 Wochen** nach dem
   Start der Muss-Punkte — bestimmt vom Anwaltstermin, nicht vom Code.

---

## 1. Ist-Stand: was für den Verkauf schon da ist

Jede Zeile ist am Code oder an einem Test nachgesehen. „Nicht prüfbar“
heisst: von dieser Umgebung aus nicht feststellbar, nicht „fehlt“.

### 1.1 Produkt und Mehrfirmen-Betrieb

| Baustein | Stand | Beleg |
|---|---|---|
| Mehrere Firmen in einer Datenbank | ✅ seit 10./11.8.2026 | `firestore.rules` Zeile 1899 `match /firmen/{f}`, `docs/MANDANT-PLAN.md` |
| Firma anlegen | ✅, **nur durch den Betreiber** | `functions/index.js` `firmaAnlegen` → `requireAdmin` |
| Testphase beim Anlegen | ✅ 30 Tage, einstellbar | `functions/index.js` Zeile 1084, `TEST_TAGE` |
| Firma sperren / archivieren / zurückholen | ✅ | `firmaSperren`, `firmaLoeschen`, `firmaZurueckholen` |
| Einrichtungs-Karte für den neuen Chef | ✅ hakt sich an den Daten selbst ab | `tests/test-einrichtung.js` |
| Firmencode, Freigabe neuer Konten, QR-Beitritt | ✅ | `firmencodeSetzen`, `firmaBeitreten`, `tests/test-beitritt-qr.js` |
| Funktionen je Firma abschaltbar | ✅ 15 Schalter | `index.html`, `FEATURES` (Zeile 15587) |
| Zwei-Faktor | ✅ | `zweiFaktorStand`, `tests/rules/zweifaktor.test.js` |
| Umfang | `index.html` 47.004 Zeilen, 97 Cloud Functions, 200 Oberflächen-Durchläufe, 42 Regel-Testdateien | `wc -l`, `grep -c '^exports\.'`, `ls` (22.10.2026) |

**Was das für den Verkauf heisst:** ein neuer Kunde ist **ein Formular
beim Betreiber**, kein neues Firebase-Projekt. Selbst registrieren kann
sich eine Firma nicht — für Pilotkunden ist das richtig (man richtet es
gemeinsam ein), ab etwa zehn Kunden wird es ein Engpass.

### 1.2 Demo

| | Stand | Beleg |
|---|---|---|
| Demo ohne Anmeldung unter `?demo` | ✅ | `demo-daten.js`, `tests/test-demo.js` |
| Umschalter Rolle (Chef / Leitung / Mitarbeiter) | ✅ | `docs/VERKAUF.md` A3 |
| Umschalter Abo-Zustand (alle Zustände) | ✅ | `tests/test-demo-abo.js` |
| Kein Netzverkehr nach draussen | ✅ gemessen per Erlaubnisliste | `tests/test-demo.js` |
| Für Suchmaschinen gesperrt | ✅ | `robots.txt`, `noindex` |

**Was hier stört:** die Demo zeigt laut `docs/VERKAUF.md` **echte
Standortnamen von Körperformen**. Einem anderen EMS-Studio — also einem
Wettbewerber — die eigenen Standorte vorzuführen, ist im Gespräch
ungeschickt und markenrechtlich nicht unsere Entscheidung. → Roadmap M8.

### 1.3 Abo und Bezahlung

| | Stand | Beleg |
|---|---|---|
| Abo-Zustand je Firma, nicht öffentlich lesbar | ✅ `firmen/<k>/abo/aktuell` | `aboSetzen`, `tests/rules/abo-sperre.test.js` |
| Stufen Basic / Premium | ✅ | `index.html` `PREMIUM_TABS = ['nachweise','report']` |
| Mahnleiter (0/7/14/21/35 Tage), `nurlesen` und `zu` in den Regeln | ✅ | `aboUhr`, `tests/test-abo-leiter.js` |
| Stripe-Kasse, Webhook mit Signaturprüfung, Kundenportal | ✅ im Code | `stripeKasse`, `stripeHaken`, `stripeVerwaltung` |
| Stripe-Felder der aktuellen API-Version | ✅ | `tests/test-stripe-felder.js` |
| Zustimmung zu AGB + AV an der Kasse, nur Unternehmer | ✅ | `docs/RECHT.md` Stand 25.9. |
| Bestandsschutz für Körperformen (dauerhaft gratis) | ✅ | `bestandsschutz` |
| **Stripe-Schlüssel hinterlegt?** | **nicht prüfbar** | GitHub Secrets sind von hier nicht einsehbar; ohne sie antwortet die Kasse „noch nicht eingerichtet“ (`docs/FUNKTIONEN.md` §9) |
| Preise in Stripe | **offen** | `preiseFuer()` liest `STRIPE_PREIS_*`; ohne Preisentscheidung gibt es nichts einzutragen |

### 1.4 Rechtliches und Datenschutz

| | Stand | Beleg |
|---|---|---|
| Impressum + Datenschutz in der App, auch ohne Anmeldung, je Firma pflegbar | ✅ | `config/recht`, `docs/RECHT.md` |
| AGB in der App | ✅ **als ungeprüfter Entwurf** | `docs/AGB-ENTWURF.md` |
| AV-Vertrag, TOM, Unterauftragnehmer, Löschkonzept, Verarbeitungsverzeichnis, Vorfall-Ablauf | ✅ **als Entwurf** | `docs/av/` |
| Speicherhinweis je Gerät | ✅ | `docs/RECHT.md` |
| Auskunft nach Art. 15 auf Knopfdruck | ✅ | `auskunftErstellen`, P-10 behoben |
| Löschung beantragen / Konto löschen | ✅ | `loeschungBeantragen`, `kontoLoeschen` |
| Datenschutzvorfall melden | ✅ | `vorfallMelden`, P-02 |
| Löschfrist Stempelzeiten | ✅ | `stempelzeitenAblaufen` (nächtlich 3:50) |
| **Anwaltlich geprüft** | ❌ | steht in jeder dieser Dateien so |
| **Google Cloud DPA angenommen?** | **nicht prüfbar** | ein Häkchen in der Google-Konsole, `docs/av/UNTERAUFTRAGNEHMER.md` §1 |
| Mailversand als Unterauftragnehmer eingetragen | ❌ Platzhalter | `docs/av/UNTERAUFTRAGNEHMER.md` §3 |
| Apps-Script-Abfluss für fremde Kunden aus | **offen** | `docs/av/UNTERAUFTRAGNEHMER.md` §2 — als Entscheidung markiert |

### 1.5 Daten, Sicherung, Export

| | Stand | Beleg |
|---|---|---|
| Nächtlicher Vollexport | ✅ | `dailyBackup`, Eimer-Pfad `sicherung/` |
| Wiederherstellung geprobt | ✅ 27.9.2026, 678/678 Dokumente | P-07 |
| Export für kündigenden Kunden (Excel + JSON) | ✅ Selbstbedienung | P-11, Runde 93 |
| Export ohne Geheimnisse | ✅ | `tests/test-sicherung-inhalt.js` |

### 1.6 Mandantentrennung — der Punkt, der beim ersten fremden Kunden zählt

Bisher teilen sich **Körperformen und Testfirmen** die Datenbank. Mit dem
ersten fremden Kunden wird aus „logisch getrennt“ ein Versprechen.

- `tests/rules/kreuz.test.js` prüft für jede Sammlung in seiner Liste,
  dass Firma A nicht an Firma B kommt — **mit Gegenprobe**. Gut gebaut.
- **Aber die Liste ist von Hand gepflegt** und nennt **26 Pfade**. Unter
  `firmen/{f}` stehen heute **rund 50 Sammlungen** (Zählung über
  `match /…/` in `firestore.rules`). Dazugekommen sind seitdem u. a.
  `zeiten`, `zeitPins`, `terminals`, `schulung*`, `planer*`,
  `kennzahlen`, `bestellungen`, `anliegen`, `gehirn*`.
- Viele davon haben eigene Regeltests. Eine **reine Textsuche** fand für
  `gehirnGeheim`, `gehirnErinnerungen`, `vorfaelle` und `mailVersand`
  keinen erkennbaren Firmen-Kreuztest. Das ist **kein Befund einer
  Lücke**, sondern einer fehlenden Prüfung — die Suche ist grob.
- `CLAUDE.md` nennt fünf Lücken dieser Art in der Vergangenheit.

→ Roadmap M6: den Kreuztest aus `firestore.rules` **ableiten** statt
pflegen, damit eine neue Sammlung ohne Kreuztest rot wird.

### 1.7 Was Körperformen-eigen ist und beim Kunden nicht auftauchen darf

| | Stand | Beleg |
|---|---|---|
| Formi (Studio-Gehirn, KI) | ✅ nur Körperformen | `GEHIRN_FIRMEN = ['koerperformen']`, `index.html` Zeile 24976 |
| `ems-wissen.js`, `schulungen-basis.js`, `loesungen-basis.js` | **zu prüfen** | Inhalte aus dem eigenen Betrieb; ob sie für fremde Firmen erscheinen und ob das gewollt ist, ist eine Entscheidung (Frage 6) |
| Google-Tabelle per Apps Script | **zu prüfen** | siehe 1.4 |
| `marketing.html`, `wachstum.html` | ✅ stillgelegt | P-15, `firebase.json` |

### 1.8 Was bekannt offen ist (`docs/BEKANNTE-PROBLEME.md`)

| | für den Verkauf relevant, weil |
|---|---|
| P-01 Studiogrenze: Aufgaben, Putzplan, Geräte, Material bewusst betriebsweit lesbar | ein Kunde fragt „sieht Studio A die Daten von Studio B?“ — Antwort muss vorher feststehen |
| P-14 Premium-Auswertung ist kein echtes Schloss | gehört ins Verkaufsgespräch, bevor es jemand findet |
| P-17 Aufgaben brauchen bis zu 0,6 s bis zum ersten Bild | der meistgenutzte Bereich; in einer Demo fällt das auf |
| P-18 Konten ohne Studio-Kennung | betrifft Altkonten; bei Neukunden entsteht das nicht, ist zu bestätigen |

### 1.9 Was ganz fehlt

| | Folge |
|---|---|
| **Selbstregistrierung einer Firma** | jeder Kunde geht über den Betreiber — für Piloten gut, später Engpass |
| **Produktseite im Netz** (Preis, Demo-Link, Kontakt) | ohne sie gibt es keinen Ort, auf den man verweist |
| **Eigene Absenderdomain** | Betriebsmails gehen per SMTP über ein Gmail-Postfach (Runde 146); für Kunden wirkt das nicht wie ein Unternehmen, und Gmail hat ein Tageslimit von rund 500 Mails |
| **Verfügbarkeitsmessung / Statusseite** | AGB § 2 (4) sagt deshalb bewusst keine Verfügbarkeit zu |
| **Support-Weg** (Postfach, Zeiten, Fristen) | in keiner Unterlage festgelegt |
| **Markenprüfung „StudioChat“** | `docs/MARKE.md`: zwei Treffer in derselben Branche, darunter `studiochat.io` mit identischem Namen |

---

## 2. Standard und Premium

### 2.1 Der Grundsatz

Drei Regeln, aus den bisherigen Entscheidungen abgeleitet
(`docs/ABO-PLAN.md` §1–2):

1. **Das Tagesgeschäft ist nie Premium.** Wer Chat, Aufgaben, Putzplan
   oder Geräte sperrt, bricht den Betrieb des Kunden — und verliert ihn
   wegen der Sperre, nicht wegen des Preises.
2. **Sicherheit und Datenschutzrechte sind nie Premium.** Zwei-Faktor,
   Auskunft, Löschung, Export bei Kündigung gehören in jede Stufe. Wer
   Sicherheit verkauft, verkauft im Umkehrschluss Unsicherheit.
3. **Premium ist, was Führung, Haftung oder laufende Kosten betrifft** —
   und möglichst etwas, das ein **echtes Schloss** bekommen kann (Regel
   oder Cloud Function), nicht nur ausgeblendet wird.

### 2.2 Vorschlag

| Funktion | Standard | Premium | Schloss heute | Schloss möglich | Begründung |
|---|:-:|:-:|---|---|---|
| Teamchat, Direktnachrichten, Infos | ✅ | ✅ | — | — | ersetzt WhatsApp; ohne das kein Produkt |
| Aufgaben, Putzplan, Material, Geräte | ✅ | ✅ | — | — | Tagesgeschäft |
| Dokumente, Schwarzes Brett, Übergabe | ✅ | ✅ | — | — | Tagesgeschäft |
| Schichtplan (von Hand), Abwesenheiten | ✅ | ✅ | — | — | Grundbedarf jedes Studios |
| Hilfe im Studio (Rettungsring) | ✅ | ✅ | — | — | senkt Support-Last für **uns** |
| Probetraining-Zähler | ✅ | ✅ | — | — | klein, macht die App für EMS-Studios greifbar |
| Zwei-Faktor, Auskunft, Löschung, Export | ✅ | ✅ | — | — | Regel 2 |
| Bestellung per Mail | ✅ | ✅ | — | — | hängt am Material |
| **Nachweise mit Ablaufwarnung** | Lesen | ✅ | ✅ Regel | — | Haftung; schon heute echtes Schloss |
| **Zeiterfassung** (Terminal, Handy, Korrekturen) | — | ✅ | ❌ | ✅ in `stempeln`/`handyStempeln` serverseitig | Pflicht für Arbeitgeber, bei Wettbewerbern immer ein bezahltes Modul; läuft komplett über Cloud Functions → leicht echt zu sperren |
| **Schulungen mit Video und Nachweis** | — | ✅ | ❌ | ✅ Storage-Regel + `schulungStart` | kostet Speicher und Übertragung, also echtes Geld je Kunde |
| **Automatischer Schichtplaner** (Monatsplan, Ersatz bei Krankheit) | — | ✅ | ❌ (nur „Chef“) | ✅ Regel auf `planerPlaene` | spart der Leitung Stunden; klarer Mehrwert |
| **Auswertung, Kennzahlen je Studio, Monatsbericht-Mail** | — | ✅ | 🟡 ausgeblendet | teilweise: Monatsbericht und Excel serverseitig ja, Ansicht nein (P-14) | Führungsblick über Zeiträume |
| *(später)* **Formi, der Assistent** | — | ✅ oder Zusatz | — | ✅ im Worker | kostet je Aufruf echtes Geld; heute nur Körperformen, und Cloudflare stünde dann als Unterauftragnehmer im AV-Vertrag |

**Bestandsschutz-Regel bleibt:** Was ein Kunde benutzt hat, wird ihm
nicht weggenommen. Deshalb müssen die Stufen **vor dem ersten Kunden**
feststehen — nachträglich verschieben geht nur zu Gunsten des Kunden.

**Was ein Kunde auf Standard bei Premium-Funktionen sieht:** die Kachel
mit Schloss und „Premium“, wie heute bei den Nachweisen. Daten, die
schon da sind, bleiben lesbar (Entscheidung vom 11.8., `ABO-PLAN.md`).

### 2.3 Warum nicht nur ein Preis?

`docs/ABO-PLAN.md` hatte im August geraten: erst ein Preis, Stufen wenn
es echtes Premium gibt. **Das ist inzwischen der Fall.** Zeiterfassung,
Schulungen mit Video und der Schichtplaner sind seit September/Oktober
gebaut — damit ist Premium kein „Excel-Export für 20 €“ mehr, sondern
ein Paket, das man in einem Satz sagt: *„Standard ist Ihr Team, Premium
ist Ihre Verwaltung.“*

### 2.4 Preise der Vergleichsanbieter

**Wichtig zur Quelle:** die Preisseiten der Anbieter selbst waren aus
dieser Umgebung nicht erreichbar (Namensauflösung blockiert). Die Zahlen
stammen aus **Vergleichsportalen**, abgerufen am **22.10.2026**; wo sich
Portale widersprechen, stehen beide Werte. Vor einem Kundengespräch auf
der Herstellerseite nachsehen.

| Anbieter | Modell | Preis (netto, Monat) | Quelle, Stand der Quelle |
|---|---|---|---|
| **Ordio** | je Standort | Starter 89 €, Plus 129 €, Pro 149 € oder 169 € (Quellen widersprechen sich) | [OMR Ordio vs. Shiftbase](https://omr.com/en/reviews/vs/ordio-versus-shiftbase) 2026; [ordio.com/preise](https://www.ordio.com/preise?p=twoyears) |
| **Papershift** | je Mitarbeiter | Core 4 €, Premium 6 €, Professional 9 €, Jahresabo; Support-Pakete 39/99/399 € extra | [fastlancer.org](https://www.fastlancer.org/fastlancer-blog/papershift-review/) Juli 2026; [ki-syndikat.de](https://www.ki-syndikat.de/tools/papershift/) Juni 2026 |
| **Shiftbase** | Grundpreis + je Mitarbeiter | Basic 35–39 € inkl. 10 Nutzer, +3,25–3,75 € je weiterem; Premium ab 79 € | [trusted.de](https://trusted.de/shiftbase-zeiterfassung) 2026 (zweite trusted-Seite nennt 37,50 / 71,25 €) |
| **Connecteam** | je „Hub“, erste 30 Nutzer | kostenlos bis 10 Nutzer; Basic 29 $, Advanced 49 $, Expert 99 $ (Jahresabo), **je Hub** | [dupple.com](https://dupple.com/pricing/connecteam), Stand 19.5.2026 |
| **Deputy** | je Nutzer | uneinheitlich: Lite 7,50 $, Core 9,75 $, Pro 14,50 $ (Dez. 2025) bzw. ältere 2,50–4,50 $; Mindestumsatz 25 $/Monat | [softwareadvice.com](https://www.softwareadvice.com/retail/deputy-profile/), [deputy.com/pricing](https://deputy.com/pricing) — **unsicher** |
| **Staffbase** | Jahreslizenz auf Anfrage | keine Listenpreise; Schätzung eines Portals 3–6 € je Nutzer, sinnvoll ab mehreren hundert Mitarbeitern | [ki-syndikat.de](https://www.ki-syndikat.de/tools/staffbase/) — **Schätzung, kein Preis** |

**Was man daraus ablesen kann:**

- Ein EMS-Studio hat typischerweise wenige Leute je Standort (Annahme,
  nicht gemessen: 5–10). Bei 4–9 € je Kopf zahlt es bei
  Wettbewerbern grob **25–90 € je Studio und Monat**, Ordio als
  Standortmodell 89 €.
- Staffbase ist kein Wettbewerber für Studios — zu gross, zu teuer, kein
  Studio-Bezug. Taugt nur als Beleg, dass „Mitarbeiter-App“ ein Markt ist.
- Connecteam ist der gefährlichste Vergleich: **bis 10 Nutzer
  kostenlos**. Ein Einzelstudio fragt: „Warum nicht Connecteam?“ Die
  Antwort muss der Studio-Bezug sein (Putzplan, Geräte mit EMS-Bezug,
  Nachweise, Probetraining, deutsch, Server in der EU), nicht der Preis.

### 2.5 Preisvorschlag

Struktur wie gebaut: **Grundpreis (inkl. erstes Studio) + Aufschlag je
weiterem Studio, Mitarbeiter unbegrenzt** (`preiseFuer()`, vier
Stripe-Preise).

| | Standard | Premium |
|---|---|---|
| Grundpreis inkl. 1. Studio | **39 €** | **69 €** |
| je weiteres Studio | **29 €** | **49 €** |
| Mitarbeiter | unbegrenzt | unbegrenzt |
| Einrichtung | 0 € für Piloten, danach 199 € einmalig (mit Einweisung per Video) | dito |
| Testphase | 30 Tage (gebaut) | 30 Tage |

| Kunde | Studios | Standard | Premium | zum Vergleich Ordio Starter |
|---|---|---|---|---|
| Einzelstudio | 1 | 39 € | 69 € | 89 € |
| kleine Kette | 3 | 97 € | 167 € | 267 € |
| mittlere Kette | 8 | 242 € | 412 € | 712 € |
| Körperformen (nur zum Einordnen) | 14 | 416 € | 706 € | 1.246 € |

**Begründung der Höhe:**

- **Unter Ordio, aber nicht billig.** Ordio liefert Zeiterfassung mit
  Lohnexport; wir liefern Studio-Betrieb. Das ist ein anderes Produkt,
  der Abstand ist gewollt.
- **Standard bei 39 €** liegt für ein Einzelstudio auf Höhe von
  Papershift-Premium mit 6–7 Personen — ohne Kopfzählung. Der Satz
  dazu: *„Alle Ihre Leute, ein Preis je Studio.“*
- **Premium-Aufschlag 30 € / 20 €** ist kleiner als das, was die
  Zeiterfassung allein bei Kopfmodellen kostet. Premium soll die
  Normalwahl für Ketten werden, nicht die Ausnahme.
- **Jahreszahlung mit 2 Monaten Nachlass** anbieten — bindet Piloten
  und glättet die Einnahmen. Braucht in Stripe nur zwei weitere Preise
  (Kleinigkeit im Code, `preiseFuer` kennt heute nur monatlich).
- **Pilotpreis:** 50 % für 6 Monate gegen Rückmeldung und die Erlaubnis,
  als Referenz genannt zu werden. Danach Listenpreis.

> **Das sind Vorschläge, keine gemessenen Werte.** Ob ein
> Studiobetreiber 39 € zahlt, zeigt erst das dritte Gespräch. Die Zahlen
> sind so gewählt, dass man nach oben korrigieren kann — nach unten
> korrigieren bei Bestandskunden ist leicht, nach oben nicht.

**Was davon übrig bleibt** (aus `docs/ABO-PLAN.md`, gemessen bzw. am
14.9. bei Stripe nachgesehen): Firebase ~1,70 € je Kunde und Monat,
Zahlung per SEPA 0,35 € (+0,7 % mit Stripe Billing). **Der eigentliche
Kostenblock ist Support-Zeit.**

---

## 3. Roadmap bis zum ersten zahlenden Kunden

**Muss** = ohne das kein Vertrag. **Soll** = vor dem dritten Kunden.
**Kann** = wenn es sich ergibt. Aufwand grob: **S** bis ein halber Tag,
**M** ein bis drei Tage, **L** eine Woche oder mehr. „Wer“: **B** =
Betreiber (nur ihr könnt es), **C** = Claude im Repo.

### 3.1 Muss

| # | Was | Wer | Aufwand | warum |
|---|---|---|---|---|
| M1 | **Gewerbe anmelden, Steuerberater: Kleinunternehmer oder Regelbesteuerung**, dazu Krankenversicherung/Studentenstatus klären | B | S (Termin) | steht **vor** der ersten Rechnung; `ABO-PLAN.md` §5 |
| M2 | **Markenname entscheiden**: „StudioChat“ hat einen gleichnamigen Software-Anbieter (`docs/MARKE.md`). Registerrecherche (DPMA/EUIPO) oder umbenennen | B (+ Anwalt) | S–M | Umbenennen kostet mit jedem Kunden mehr; vor jedem gedruckten Blatt |
| M3 | **Anwaltliche Durchsicht** AGB, AV-Vertrag mit Anlagen, Datenschutzerklärung | B | L (Wartezeit), Kosten laut `VERKAUF.md` B3 „niedriger vierstelliger Betrag“ | ohne AV-Vertrag darf ein Kunde die App rechtlich nicht einsetzen |
| M4 | **Unterauftragnehmer vervollständigen**: Mailversand eintragen, Google-DPA in der Konsole bestätigen, Apps Script für fremde Firmen aus | B + C | S | Anlage 2 hat heute einen Platzhalter |
| M5 | **Stufen festschreiben** (Abschnitt 2) und Premium **serverseitig** sperren: Zeiterfassung in den Cloud Functions, Schulungsvideos in den Storage-Regeln, Schichtplaner in `firestore.rules` — **beide Pfade**, mit Regeltest und Gegenprobe | C | M | Bestandsschutz: was ein Kunde hatte, behält er. Also vorher. |
| M6 | **Kreuztest aus `firestore.rules` ableiten**: jede Sammlung unter `firmen/{f}` automatisch gegen Firma B prüfen; neue Sammlung ohne Eintrag = rot | C | M | der eine Fehler, der einen Kunden sofort kostet; heute Handliste mit 26 von ~50 |
| M7 | **Probelauf mit einer Testfirma** im Probe-Projekt: anlegen → Chef einladen → Team beitreten → Testphase → Stripe-**Test**zahlung → Mahnstufe → Export → Kündigung | B + C | M | der Weg ist in Teilen getestet, aber nie am Stück durchgespielt worden |
| M8 | **Neutrale Demo-Firma** („EMS-Studio Musterstadt“, erfundene Standorte) statt echter Körperformen-Standorte; Körperformen-Inhalte (`ems-wissen`, `schulungen-basis`, `loesungen-basis`) für fremde Firmen prüfen | C (+ B entscheidet) | M | einem Wettbewerber die eigenen Standorte zu zeigen, ist ungeschickt |
| M9 | **Abrechnung für Piloten festlegen**: Rechnung + SEPA-Mandat von Hand **oder** Stripe live | B | S | `ABO-PLAN.md` §9: für 1–5 Kunden ist Hand-Abrechnung günstiger; Abo-Zustand von Hand ist gebaut |
| M10 | **Support-Zusage schriftlich**: Kanal (Mail + WhatsApp-Business?), Erreichbarkeit (z. B. Mo–Fr 9–18 Uhr), Antwortfrist (z. B. 1 Werktag, Ausfall 4 h), was nicht dazugehört | B | S | `VERKAUF.md` B6; der Posten, der über Freude oder Frust entscheidet |
| M11 | **Eigene Domain + Absender** (`support@…`, `noreply@…`) statt Gmail | B (+ C: nur Secrets-Doku) | S | Vertrauen, Zustellbarkeit, Gmail-Tageslimit |
| M12 | **Preisblatt und aktualisierte Produktmappe** (eine Seite: was drin ist, Preise, Testphase, Kontakt) | C entwirft, B gibt frei | S | ohne Zahl kein Verkauf; `PITCH.md` ist inhaltlich überholt |

### 3.2 Soll — vor dem dritten Kunden

| # | Was | Wer | Aufwand |
|---|---|---|---|
| S1 | **Produktseite** (eigene Domain): Nutzen in einem Satz, drei Bilder, Demo-Link, Preise, Kontaktformular, Impressum | C + B | M |
| S2 | **Stripe live** schalten nach `docs/KASSE.md` (Schritt 10), Jahrespreise ergänzen | B + C | S–M |
| S3 | **Verfügbarkeitsmessung** (externer Pinger, Statusseite) — Voraussetzung für jede spätere Zusage | B + C | S |
| S4 | **Onboarding-Paket**: 3 kurze Videos (Chef richtet ein / Team tritt bei / erster Tag), Aushang mit QR-Code für die Studios. Platzhalter „Video folgt“, solange es sie nicht gibt | C + B | M |
| S5 | **P-01 entscheiden und erklären**: welche Bereiche studioübergreifend lesbar sind — als Satz im Preisblatt und in der Demo | B + C | S |
| S6 | **P-17 beheben** (Aufgaben bis 0,6 s) | C | M |
| S7 | **Support-Werkzeug für den Betreiber**: Firmenliste mit Abo-Zustand, letzter Aktivität, offenen Fehlern — **ohne** Einblick in Inhalte (Grenze aus `CLAUDE.md`) | C | M |
| S8 | **Kündigungsablauf** am Stück durchspielen: Export → Ende der Laufzeit → Archiv → Löschfrist laut Löschkonzept | B + C | S |

### 3.3 Kann

| # | Was | wann sinnvoll |
|---|---|---|
| K1 | Selbstregistrierung einer Firma mit Testphase | ab ~10 Kunden oder wenn Werbung läuft |
| K2 | Formi als Premium-Zusatz für fremde Firmen (Cloudflare in AV aufnehmen, Kosten je Aufruf begrenzen) | wenn Piloten danach fragen |
| K3 | Lohnexport (DATEV-Format) aus der Zeiterfassung | wenn ein Kunde mit Steuerbüro danach fragt |
| K4 | Anbindung an Studiosoftware (Termine/Mitglieder) | bewusst nicht (`ROADMAP.md`); nur auf Kundenwunsch |
| K5 | Englische Oberfläche | nicht vor dem DACH-Markt |

### 3.4 Reihenfolge und Zeitplan

```
Woche 1–2   M1 Gewerbe/Steuer · M2 Name · M9 Abrechnungsweg · M10 Support
            M5 Stufen festschreiben · M6 Kreuztest · M8 Demo-Firma   (C, parallel)
            → Anwaltstermin anfragen (M3), Unterlagen schicken
Woche 3–4   M4 Unterauftragnehmer · M7 Probelauf · M11 Domain/Mail · M12 Preisblatt
            erste Gespräche mit Pilotkandidaten (Demo, ohne Vertrag)
Woche 5–8   M3 Rückmeldung Anwalt einarbeiten → Pilotverträge
            S1 Produktseite · S4 Onboarding · S5 P-01
Woche 8–12  erster Pilot zahlt (Pilotpreis) · S2 Stripe live · S3 Messung
```

**Der kritische Pfad ist M3 (Anwalt)**, nicht der Code. Deshalb in
Woche 1 anfragen, auch wenn noch nicht alles fertig ist — die Entwürfe
in `docs/av/` und `docs/AGB-ENTWURF.md` reichen zum Anfragen.

### 3.5 Risiken

| Risiko | Wahrscheinlichkeit | Schaden | was dagegen hilft |
|---|---|---|---|
| **Firmengrenze in den Regeln hat eine Lücke** | gering bis mittel (5 Vorfälle in der Geschichte des Projekts) | sehr hoch — Daten eines Kunden beim anderen | M6, Regeltest auf beiden Pfaden, kein Merge ohne |
| **AV-Vertrag / AGB tragen nicht** | mittel | hoch — Haftung, Abmahnung | M3; nicht ohne Durchsicht unterschreiben |
| **Krankmeldungen = Gesundheitsdaten (Art. 9)** | sicher vorhanden | hoch | im AV-Vertrag ausdrücklich nennen (`docs/av/README.md` Punkt 1) |
| **Markenkonflikt „StudioChat“** | mittel | mittel — Umbenennung, Abmahnkosten | M2 vor dem ersten Druck |
| **Bus-Faktor 1** — ein Mensch kennt Betrieb, Code und Kunden | sicher | hoch bei Ausfall | Support-Zusage realistisch halten; Handbuch + `FORTSCHRITT.md`; Vertretung benennen |
| **Support frisst die Zeit** | hoch | mittel | Rettungsring, Onboarding-Videos, feste Zeiten, Pilotanzahl auf 3 begrenzen |
| **Abhängigkeit von Google/Firebase** | gering | hoch | Sicherung + geprobte Wiederherstellung (P-07) ist da |
| **Betriebsrat beim Kunden** (Zeiterfassung ist kontrollgeeignet) | mittel bei grösseren Ketten | Einführung verzögert sich | eine Seite „was die App nicht tut“ (`VERKAUF.md` A6): kein GPS, keine IP, keine Leistungsmessung (`FUNKTIONEN.md` §8) |
| **Steuer/Sozialversicherung als Student** | abhängig von Umsatz | hoch für die Person | M1, **vor** der ersten Rechnung |
| **WhatsApp ist kostenlos und schon da** | sicher | Kunde nutzt die App nicht | Pilot nur mit Chef, der die Gruppe aktiv abschaltet; Erfolg an Nutzung messen |
| **Körperformen-Marke im Verkauf an Wettbewerber** | mittel | Ärger im eigenen Haus | Frage 1; M8 |

---

## 4. Vertriebsplan

### 4.1 Zielgruppe

**Erste Wahl: EMS- und Mikrostudio-Ketten mit 2–10 Standorten in DACH.**

- Gemeinsamer Betrieb über mehrere Standorte ist genau das, wofür die
  App gebaut ist (Studio als Einheit, Leitung über alle).
- Ein Unternehmensprofil nennt rund **1.430 EMS-Anbieter** in
  Deutschland, fast die Hälfte des Marktes bei Einzelanbietern
  ([DUB-Profil 2025](https://www.dub.de/fileadmin/enterprisermarket/angebot/23604_Company_Profile_2025_DE_1750438713.pdf) — Werbeprofil,
  als Orientierung, nicht als Marktstudie).
- Laut Statista gehörten Bodystreet und Körperformen Ende 2023 zu den
  EMS-Ketten mit den meisten Standorten
  ([Statista](https://de.statista.com/statistik/daten/studie/701659/umfrage/ems-fitnessketten-in-deutschland-zahl-der-standorte)).
  Daraus folgt Frage 1: **Ist euer Betrieb Teil eines grösseren
  Körperformen-Netzes?** Wenn ja, sind die anderen Betreiber im selben
  Netz der naheliegendste Kanal überhaupt — und gleichzeitig die
  heikelste Absprache.

**Zweite Wahl:** Fitness- und Physiostudios mit Schichtbetrieb, Geräten
und Nachweispflichten (Erste Hilfe, Trainerlizenzen). Erst nach den
Piloten — jede Branche bringt Begriffe und Wünsche mit.

**Nicht:** Grossketten mit eigener IT und Ausschreibungen. Zu lange
Verkaufszyklen, Anforderungen (SLA, SSO, ISO-Zertifikat), die ein
Ein-Personen-Anbieter nicht erfüllt.

### 4.2 Kanäle, nach Aufwand je Abschluss geordnet

| Kanal | warum | erster Schritt |
|---|---|---|
| **Persönliches Netz** (Geschäftsführung Körperformen, Lieferanten, Gerätehersteller-Vertrieb, Trainerausbildungen) | Vertrauen ist schon da; „wir benutzen das selbst in 14 Studios“ | Liste mit 20 Namen, wer wen kennt |
| **Empfehlung durch Piloten** | EMS-Betreiber kennen sich; Ketten sind klein und vernetzt | Empfehlungsbonus: 1 Monat frei je geworbenem Kunden |
| **Branchentreffen** (FIBO Köln, regionale EMS-Stammtische, Schulungen der Gerätehersteller) | Zielgruppe an einem Ort; Köln ist um die Ecke | Termine 2027 prüfen; Demo auf Tablet |
| **LinkedIn / Instagram** mit kurzen Bildschirmvideos („so sieht der Putzplan aus“) | billig, zeigt statt behauptet | nach S1 Produktseite |
| **Gerätehersteller als Partner** | sehen jedes Studio; Geräte- und Schadensbuch ist für sie interessant | erst nach 3 zufriedenen Kunden ansprechen |

**Keine bezahlte Werbung vor dem dritten Kunden.** Jeder Euro dort
bringt Anfragen, die der Support noch nicht tragen kann.

### 4.3 Pilotkunden

- **Anzahl: drei.** Weniger zeigt nichts, mehr ist nicht zu betreuen.
- **Profil:** 2–6 Studios, Chef nutzt heute WhatsApp und ist unzufrieden
  damit, erreichbar für ein Gespräch alle zwei Wochen.
- **Angebot:** 30 Tage Testphase, dann 6 Monate zu 50 %, Einrichtung
  gratis, gemeinsamer Einrichtungstermin (60 min, per Video).
- **Gegenleistung:** Rückmeldetermin nach 2, 6 und 12 Wochen; Erlaubnis,
  als Referenz genannt zu werden; ehrliche Aussage, ob sie zum
  Listenpreis weiterzahlen würden.
- **Erfolg gemessen, nicht gefühlt:** nach 4 Wochen loggen sich ≥ 70 %
  der Mitarbeiter mindestens wöchentlich ein; die WhatsApp-Gruppe ist
  abgeschaltet; ≤ 2 Support-Anfragen je Woche. (Die Messung braucht die
  Betreiber-Übersicht S7 — **Zahlen, keine Inhalte**.)

### 4.4 Demo-Ablauf (20 Minuten)

Vorbereitet: Laptop **und** Handy, neutrale Demo-Firma (M8), `?demo`.

| Minute | was | warum |
|---|---|---|
| 0–3 | Frage: „Wie läuft das heute bei Ihnen — WhatsApp?“ Zuhören | das Problem soll der Kunde aussprechen, nicht wir |
| 3–7 | **Startseite als Chef**: wo hakt es gerade, über alle Studios | der Kernnutzen in einem Bild |
| 7–10 | **Aufgabe anlegen → Rolle wechseln → Mitarbeiter hakt ab** | der stärkste Moment laut `VERKAUF.md`: derselbe Bildschirm, andere Rolle |
| 10–13 | **Putzplan, Gerät defekt melden** → Aufgabe entsteht automatisch | der Studio-Bezug, den Connecteam nicht hat |
| 13–16 | **Premium**: Nachweise mit Ablaufwarnung, Zeiterfassung am Terminal, Schichtplaner | Stufenunterschied zeigen, nicht erklären |
| 16–18 | **Datenschutz**: Direktnachrichten liest auch der Chef nicht; kein GPS; Export auf Knopfdruck; Server in Belgien | die Frage, die sonst später kommt |
| 18–20 | Preisblatt, Pilotangebot, **Termin für die Einrichtung** vereinbaren | ein Gespräch ohne nächsten Schritt ist verloren |

**Nicht zeigen:** Formi (nur Körperformen), Stripe-Kasse (es gibt
bewusst keine nachgebaute Bezahlseite), alles Unfertige. Fragen nach
Unfertigem ehrlich beantworten: „gibt es noch nicht“.

### 4.5 Die ersten 90 Tage

| Zeitraum | Ziel | messbar |
|---|---|---|
| **Tag 1–30** | Muss-Punkte M1, M2, M5, M6, M8, M9, M10 erledigt; Anwalt beauftragt; Liste mit 20 Kontakten | 20 Namen, Anwaltstermin steht, Probelauf M7 grün |
| **Tag 31–60** | 8–10 Demo-Gespräche; 3 Piloten zugesagt; Anwaltsrückmeldung eingearbeitet; Produktseite online | Gesprächsliste mit Ergebnis je Gespräch; 3 unterschriebene AV-Verträge |
| **Tag 61–90** | 3 Piloten eingerichtet und aktiv; erste Rechnung (Pilotpreis); Rückmeldetermine; Preis anhand der Antworten prüfen | ≥ 70 % aktive Nutzer je Pilot; erste Zahlung eingegangen; Entscheidung „Listenpreis bleibt / ändert sich“ |

**Nach Tag 90** entscheidet sich anhand der Piloten, ob Stripe live
geht (S2), ob Selbstregistrierung kommt (K1) und ob eine zweite Branche
sinnvoll ist.

---

## 5. Fragen, die nur ihr beantworten könnt

| # | Frage | warum sie zählt |
|---|---|---|
| 1 | **Ist euer Betrieb Franchisenehmer eines Körperformen-Netzes, und weiss die Geschäftsführung/Zentrale vom Verkauf an andere Studios?** | bestimmt den wichtigsten Kanal und ein Risiko zugleich |
| 2 | **Name: bei „StudioChat“ bleiben (nach Registerrecherche) oder umbenennen?** | muss vor dem ersten gedruckten Blatt stehen |
| 3 | **Passt die Stufenaufteilung** — vor allem: Zeiterfassung und Schichtplaner als Premium? | Bestandsschutz macht sie nach dem ersten Kunden praktisch unveränderbar |
| 4 | **Preis 39/29 € und 69/49 € — passt das Gefühl?** Oder lieber ein einziger Preis je Studio? | Stripe-Preise und Preisblatt hängen daran |
| 5 | **Abrechnung der Piloten: Rechnung + SEPA von Hand oder gleich Stripe?** Sind die Stripe-Schlüssel schon hinterlegt? | von hier nicht prüfbar |
| 6 | **Sollen fremde Firmen das EMS-Wissen, die Schulungsinhalte und die 115 Lösungen aus dem eigenen Betrieb sehen?** | Mehrwert für Kunden — aber eigenes Know-how |
| 7 | **Wie viel Zeit pro Woche ist für Support da, und wer vertritt bei Krankheit/Prüfungen?** | bestimmt, wie viele Piloten gehen |
| 8 | **Ist der Steuerberater-/Gewerbe-Termin schon gemacht?** Kleinunternehmer ja/nein? | Rechnung und Stripe-Steuereinstellung hängen daran |
| 9 | **Gibt es schon Interessenten** — wer hat nach der App gefragt? | die ersten Piloten sind fast immer Leute, die schon gefragt haben |

---

## 6. Was in diesem Dokument nicht gesichert ist

Damit es nicht später als Zusage gelesen wird:

- **Wettbewerbspreise** stammen aus Vergleichsportalen, nicht von den
  Herstellerseiten (aus dieser Umgebung nicht erreichbar). Datum der
  Quelle steht jeweils dabei.
- **Die Preisvorschläge** sind abgeleitet, nicht am Markt getestet.
- **Mitarbeiterzahl je EMS-Studio (5–10)** ist eine Annahme.
- **Stripe-Schlüssel, Google-DPA, Mailanbieter** sind von hier nicht
  einsehbar.
- **Die Lücke im Kreuztest** (1.6) ist eine Zählung von Pfaden und eine
  Textsuche, **keine** nachgewiesene Lücke in den Regeln.
- **Rechtliches und Steuern:** keine Beratung. Die Punkte sind so
  formuliert, dass man weiss, wonach man fragt.
