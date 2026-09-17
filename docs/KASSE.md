# Die Kasse einrichten — Stripe, Schritt für Schritt

**Stand:** 17. September 2026 · Für macOS geschrieben.
Gebaut sind Stufe C, D und E aus `docs/ABO-PLAN.md`. Was fehlt, sind die
Schlüssel — und die kann nur du anlegen.

---

## Inhalt

1. [Was hier eigentlich passiert](#1-was-hier-eigentlich-passiert)
2. [Was heute passiert, wenn du nichts tust](#2-was-heute-passiert-wenn-du-nichts-tust)
3. [Vorbereitung auf dem Mac](#3-vorbereitung-auf-dem-mac)
4. [Schritt 1 — Stripe-Konto anlegen](#schritt-1--stripe-konto-anlegen)
5. [Schritt 2 — Testmodus verstehen](#schritt-2--testmodus-verstehen)
6. [Schritt 3 — Produkt und die vier Preise](#schritt-3--produkt-und-die-vier-preise)
7. [Schritt 4 — Den Geheimschlüssel holen](#schritt-4--den-geheimschlüssel-holen)
8. [Schritt 5 — Den Webhook einrichten](#schritt-5--den-webhook-einrichten)
9. [Schritt 6 — Die Schlüssel bei GitHub hinterlegen](#schritt-6--die-schlüssel-bei-github-hinterlegen)
10. [Schritt 7 — Ausrollen und nachsehen](#schritt-7--ausrollen-und-nachsehen)
11. [Schritt 8 — Bestandsschutz](#schritt-8--bestandsschutz)
12. [Schritt 9 — Alles durchspielen](#schritt-9--alles-durchspielen)
13. [Schritt 10 — Livemodus](#schritt-10--livemodus)
14. [Wie das Ganze funktioniert](#wie-das-ganze-funktioniert)
15. [Wenn etwas nicht klappt](#wenn-etwas-nicht-klappt)

---

## 1. Was hier eigentlich passiert

Bevor du irgendwo klickst, das Gesamtbild in einem Absatz — danach
ergibt jeder Schritt von selbst Sinn.

**Stripe ist die Kasse. StudioChat führt nur Buch.** Wenn ein Chef auf
„Abo buchen" drückt, baut dein Server bei Stripe eine *Bezahlseite* und
schickt den Chef dorthin. Er gibt seine Karte bei **Stripe** ein, nie
bei dir. Stripe kassiert, und sagt deinem Server anschließend Bescheid
— über eine Rückruf-Adresse, die *Webhook* heißt. Erst dieser Rückruf
schaltet die App frei.

```
   Chef drückt „Abo buchen"
            │
            ▼
   stripeKasse  ──────────►  Stripe baut eine Bezahlseite
   (dein Server)                      │
            ◄──── Adresse ────────────┘
            │
            ▼
   Chef landet bei Stripe, gibt die Karte ein, zahlt
            │
            ├──────────►  zurück in die App („Danke, wir prüfen")
            │
            └──────────►  Stripe ruft stripeHaken auf
                                   │
                                   ▼
                          Abo-Zustand auf „aktiv"
                                   │
                                   ▼
                    config/zugriff → alle Geräte frei
```

**Warum der Umweg über den Rückruf, statt einfach nach dem Bezahlen
freizuschalten?** Weil die Rückkehr in die App nichts beweist. Wer die
Adresse `?kasse=ok` kennt, könnte sie selbst aufrufen. Der Rückruf
dagegen kommt von Stripe, ist unterschrieben, und lässt sich nicht
fälschen. Deshalb sagt die App nach der Rückkehr auch nur *„Danke,
sobald die Zahlung durch ist, schaltet sich alles frei"* — und nicht
„bezahlt". Sie weiß es in dem Moment schlicht nicht.

**Drei Dinge fasst diese App nie an:**

| | Warum |
|---|---|
| **Kartennummern** | Wer sie selbst entgegennimmt, fällt unter PCI-DSS — ein Regelwerk mit Audits, das für einen Betrieb dieser Größe unbezahlbar ist |
| **Rechnungen** | Erzeugt Stripe. Ob sie die deutschen Pflichtangaben erfüllen, muss jemand prüfen, der das darf |
| **Steuer** | Stellt man in Stripe ein — von jemandem, der weiß, ob Kleinunternehmerregelung gilt |

---

## 2. Was heute passiert, wenn du nichts tust

**Nichts.** Und das ist Absicht.

Fehlt der Schlüssel `STRIPE_SECRET`, antworten die drei Endpunkte mit
„Die Bezahlung ist noch nicht eingerichtet." Die App läuft vollständig
weiter. Körperformen und jeder heutige Nutzer steht auf `gratis`, die
Mahnleiter läuft ins Leere, weil niemand einen Rückstand hat.

Nachgemessen am 16.9. an der ausgelieferten Adresse:

```
$ curl -i -X POST https://europe-west1-formenchat.cloudfunctions.net/stripeHaken
HTTP/2 503
Kasse nicht eingerichtet
```

**Die Paywall wird erst scharf, wenn du einen Kunden anlegst** — der
bekommt beim Anlegen automatisch 30 Tage Testphase.

> ### ⚠️ Einmal ernst, bevor du anfängst
>
> **Geld einzunehmen ohne Impressum, AGB und — bei Verbrauchern —
> Widerrufsbelehrung ist abmahnfähig.** Das ist kein Detail für später;
> es ist der Grund, warum die Reihenfolge in diesem Dokument so ist,
> wie sie ist.
>
> **Was du trotzdem heute tun kannst:** alles bis einschließlich
> Schritt 9. Der Testmodus ist ein abgetrennter Spielplatz — dort
> fließt kein Geld, und Stripe verlangt dafür keine Firmendaten.
> Livemodus (Schritt 10) erst, wenn die Unterlagen da sind.

---

## 3. Vorbereitung auf dem Mac

### Was du brauchst

| | |
|---|---|
| Ein Browser | für das Stripe-Dashboard |
| **Terminal** | ⌘ + Leertaste, „Terminal" tippen, Enter |
| **Homebrew** | der Paketverwalter für den Mac — prüfen mit `brew --version` |

Falls Homebrew fehlt: die Anleitung steht auf `brew.sh`. Es ist ein
einzelner Befehl, den du ins Terminal einfügst. Danach sagt dir das
Terminal noch, dass du zwei Zeilen zu deiner Shell hinzufügen sollst —
das gehört dazu, überspring es nicht.

### Die Stripe-Kommandozeile installieren

Brauchst du nicht zwingend, aber **sie spart dir in Schritt 9 eine
Menge Klickerei** — damit löst du Zahlungsfehlschläge und Kündigungen
auf Knopfdruck aus, statt in der Oberfläche danach zu suchen.

```bash
brew install stripe/stripe-cli/stripe
stripe login
```

`stripe login` öffnet den Browser; du bestätigst dort einmal, und das
Terminal ist danach mit deinem Konto verbunden. Der Zugang gilt für den
**Testmodus**, solange du nichts anderes sagst — genau richtig.

> **Auf einem Mac mit Apple-Chip** (M1 bis M5) liegt Homebrew unter
> `/opt/homebrew`. Sagt das Terminal `command not found: brew`, obwohl
> du es installiert hast, fehlt die Zeile in deiner Shell-Konfiguration.
> `eval "$(/opt/homebrew/bin/brew shellenv)"` hilft sofort; dauerhaft
> gehört sie in `~/.zprofile`.

---

## Schritt 1 — Stripe-Konto anlegen

Auf **`stripe.com`** rechts oben „Jetzt starten". E-Mail, Name,
Passwort, Land **Deutschland**.

Stripe fragt danach nach Unternehmensangaben, Steuernummer und
Bankverbindung. **Das kannst du jetzt überspringen** — es wird erst für
den Livemodus gebraucht. Suche nach einem Link wie „Später erledigen"
oder schließe den Assistenten einfach; du landest trotzdem im
Dashboard.

**Das Dashboard liegt ab jetzt unter `dashboard.stripe.com`.**

---

## Schritt 2 — Testmodus verstehen

Das ist der Schritt, den die meisten überspringen und später bereuen.

**Stripe hat zwei vollständig getrennte Welten:**

| | Testmodus | Livemodus |
|---|---|---|
| Geld | fließt nie | fließt wirklich |
| Karten | nur Testkarten | echte Karten |
| Schlüssel | `sk_test_…` | `sk_live_…` |
| Produkte, Preise, Kunden | eigene | eigene |
| Webhooks | eigene, **mit eigenem Signaturgeheimnis** | eigene |

**Nichts wird zwischen den Welten übernommen.** Ein Produkt, das du im
Testmodus anlegst, existiert im Livemodus nicht. Das ist kein Ärgernis,
sondern genau das, was du willst: du kannst alles bauen und
durchspielen, ohne dass etwas passiert.

**Umgeschaltet wird oben im Dashboard** — dort steht „Testmodus" bzw.
„Live-Modus". Sicherer als jeder Schalter sind aber diese Adressen, die
direkt im Testmodus landen:

| Wofür | Adresse |
|---|---|
| Produkte und Preise | `dashboard.stripe.com/test/products` |
| API-Schlüssel | `dashboard.stripe.com/test/apikeys` |
| Webhooks | `dashboard.stripe.com/test/webhooks` |
| Zahlungen ansehen | `dashboard.stripe.com/test/payments` |
| Abos ansehen | `dashboard.stripe.com/test/subscriptions` |

> **Ein Wort zur Menüführung:** Stripe baut sein Dashboard regelmäßig
> um, und ich kann nicht wissen, wie es heute aussieht. Die Adressen
> oben sind stabil, die Menünamen nicht. Findest du etwas nicht: im
> Dashboard gibt es oben eine **Suche** (⌘ + K auf dem Mac) — „Webhook"
> oder „API-Schlüssel" eintippen reicht.

---

## Schritt 3 — Produkt und die vier Preise

`dashboard.stripe.com/test/products` → **Produkt hinzufügen**

### Warum vier Preise und nicht einer

Der Zuschnitt kommt aus `docs/ABO-PLAN.md`, Abschnitt 1, und ist die
wichtigste Preisentscheidung des ganzen Modells: **bezahlt wird je
Studio, Mitarbeiter unbegrenzt.**

Ein Abo besteht deshalb aus **zwei Posten**:

```
   Kunde mit 3 Studios auf Basic
   ┌─────────────────────────────────────┐
   │ Basic Grundpreis      × 1   =  29 € │   ← erstes Studio
   │ Basic je Studio       × 2   =  30 € │   ← Standort 2 und 3
   ├─────────────────────────────────────┤
   │                              59 €   │
   └─────────────────────────────────────┘
```

Die Menge im zweiten Posten rechnet `stripeKasse` selbst aus: Anzahl
der **aktiven** Studios minus eins. Stillgelegte Standorte zählen nicht
mit — niemand soll für ein Studio zahlen, das er geschlossen hat.

Mal zwei, weil es zwei Stufen gibt. Macht vier.

### Das Produkt

**Name:** StudioChat
**Beschreibung:** Team-Portal für EMS- und Fitnessstudios

### Die vier Preise

Beim Anlegen des Produkts trägst du den ersten Preis ein; die anderen
drei fügst du danach über „Weiteren Preis hinzufügen" dazu.

| # | Beschreibung im Preis | Betrag (Beispiel) | Abrechnung |
|---|---|---|---|
| 1 | Basic — Grundpreis | 29,00 € | monatlich wiederkehrend |
| 2 | Basic — je weiteres Studio | 15,00 € | monatlich wiederkehrend |
| 3 | Premium — Grundpreis | 49,00 € | monatlich wiederkehrend |
| 4 | Premium — je weiteres Studio | 25,00 € | monatlich wiederkehrend |

**Diese Beträge sind Platzhalter.** Sie stehen nirgends im Code — nur
in Stripe. Ändern heißt: in Stripe ändern, nichts ausrollen.

**Bei jedem Preis auf drei Dinge achten:**

1. **Wiederkehrend**, nicht „einmalig". Monatlich.
2. **Netto**, Steuer separat — auch als Kleinunternehmer mit 0 %.
   Stripe nennt das „exklusive Steuer" (*tax behavior: exclusive*).
   Der Grund steht in `ABO-PLAN.md`, Abschnitt 5: wer Bruttopreise
   festschreibt, baut den Umstieg auf Regelbesteuerung später mühsam
   nach. Als Schalter ist es heute nichts, als Umbau später viel.
3. **Währung Euro.**

### Die Preis-Kennungen abschreiben

Jeder Preis hat eine Kennung der Form `price_1ABCdef…`. Die brauchst du
in Schritt 6.

Anklicken → die Kennung steht in der Detailansicht, meist mit einem
Kopier-Symbol daneben. **Schreib dir gleich auf, welche zu welchem
Preis gehört** — vier `price_1…`-Zeichenketten sehen nach zehn Minuten
alle gleich aus. Ein Zettel oder eine Notiz reicht; es sind keine
Geheimnisse, eine Preis-Kennung darf jeder sehen.

---

## Schritt 4 — Den Geheimschlüssel holen

`dashboard.stripe.com/test/apikeys`

Dort stehen zwei Schlüssel:

| | | |
|---|---|---|
| **Veröffentlichbarer Schlüssel** | `pk_test_…` | brauchst du **nicht** |
| **Geheimschlüssel** | `sk_test_…` | **den brauchst du** |

Der Geheimschlüssel ist zunächst verdeckt; „Enthüllen" anklicken, dann
kopieren.

> ### 🔴 Der Satz, der hier stehen muss
>
> **Dieser Schlüssel darf nie in den Quelltext.** Das Repository ist
> öffentlich. Ein Stripe-Geheimschlüssel darin ist kein Fehler, den man
> später ausbessert — er ist ab der Minute des Hochladens ein Schaden
> in echtem Geld. Wer ihn hat, kann in deinem Namen abbuchen und
> auszahlen.
>
> Stripe durchsucht GitHub selbst nach solchen Schlüsseln und sperrt
> sie meist binnen Minuten. **Verlass dich nicht darauf.**
>
> Er gehört ausschließlich in die GitHub-Secrets (Schritt 6). Von dort
> schreibt ihn der Ausroll-Lauf in `functions/.env`, und diese Datei
> steht in `.gitignore`.

---

## Schritt 5 — Den Webhook einrichten

`dashboard.stripe.com/test/webhooks` → **Endpunkt hinzufügen**

### Die Adresse

```
https://europe-west1-formenchat.cloudfunctions.net/stripeHaken
```

(Aus dem Ausroll-Protokoll vom 16.9. abgelesen, nicht geraten.)

### Die fünf Ereignisse — und was jedes bewirkt

Wähle genau diese aus. Stripe bietet über hundert an; alle zu
abonnieren bedeutet nur, dass dein Server ständig Dinge beantwortet,
die ihn nichts angehen.

| Ereignis | Wann | Was StudioChat damit tut |
|---|---|---|
| `checkout.session.completed` | Bezahlseite erfolgreich abgeschlossen | merkt sich Kunden- und Abo-Kennung |
| `invoice.paid` | eine Rechnung ist bezahlt | Zustand → **aktiv**, Rückstand gelöscht, „bezahlt bis" gesetzt |
| `invoice.payment_failed` | Abbuchung fehlgeschlagen | startet die **Mahnleiter** (Tag 0) |
| `customer.subscription.updated` | Kündigung vorgemerkt oder Abo wieder aktiv | Zustand → **gekündigt** bzw. **aktiv** |
| `customer.subscription.deleted` | Vertragsende erreicht | → **nur lesen**, nach 14 Tagen zu |

> **`invoice.paid` ist das wichtigste.** Es ist das einzige Ereignis,
> das einen Rückstand wirklich löscht. Alles andere wäre ein
> Rückstand, der Wochen später unerklärlich wieder auftaucht.

### ⚠️ Die API-Version des Endpunkts

**Das ist der Punkt, an dem diese Anleitung am 17.9. einen echten
Fehler in unserem eigenen Code gefunden hat, und deshalb steht er
ausführlich hier.**

Stripe hat mit der Version **2025-03-31 („basil")** Felder verschoben:

| früher | heute |
|---|---|
| `invoice.subscription` | `invoice.parent.subscription_details.subscription` |
| `subscription.current_period_end` | `subscription.items.data[0].current_period_end` |

Der Haken las die alten Felder. **Der Fehler wäre leise gewesen:** die
Firma würde über den Kunden trotzdem gefunden, der Zustand stünde auf
„läuft" — nur *bezahlt bis* bliebe leer und die Abo-Kennung fehlte.
Nichts davon wirft eine Fehlermeldung. Es stimmt nur nicht.

**Inzwischen liest der Haken beide Formen**, geprüft in
`tests/test-stripe-felder.js` (32 Zusicherungen, mit Gegenprobe gegen
die alte Fassung). **Du musst hier also nichts einstellen** — der
Endpunkt darf auf jeder Version stehen.

Was du trotzdem wissen solltest, weil es die häufigste Verwirrung bei
Stripe ist: **welche Form ein Ereignis hat, entscheidet der Endpunkt im
Dashboard — nicht der Code.** Eine Versionsangabe im Programm gilt nur
für Anfragen, die von dort ausgehen. Wer den Endpunkt neu anlegt,
bekommt die aktuelle Form.

### Das Signaturgeheimnis

Nach dem Anlegen zeigt Stripe ein **Signaturgeheimnis** der Form
`whsec_…`. Kopieren — das brauchst du in Schritt 6.

**Wofür es da ist:** die Webhook-Adresse ist öffentlich. Jeder im
Internet kann sie aufrufen, und sie setzt den Zustand, der darüber
entscheidet, ob ein Betrieb arbeiten kann. Ohne Prüfung wäre das ein
Knopf im Internet, mit dem jeder jede Firma freischalten oder sperren
kann.

Stripe unterschreibt deshalb jede Zustellung mit diesem Geheimnis. Der
Server rechnet die Unterschrift nach und weist alles ab, was nicht
stimmt — mit `400 Unterschrift stimmt nicht`.

---

## Schritt 6 — Die Schlüssel bei GitHub hinterlegen

Im Browser: dein Repository → **Settings** → **Secrets and variables**
→ **Actions** → **New repository secret**.

Für jeden Eintrag: Name genau so schreiben, Wert einfügen, speichern.

| Name | Wert | Pflicht? |
|---|---|---|
| `STRIPE_SECRET` | `sk_test_…` aus Schritt 4 | **ja** |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` aus Schritt 5 | **ja** |
| `STRIPE_PREIS_BASIC` | Preis-Kennung #1 | **ja** |
| `STRIPE_PREIS_BASIC_STUDIO` | Preis-Kennung #2 | **ja** |
| `STRIPE_PREIS_PREMIUM` | Preis-Kennung #3 | nur für Premium |
| `STRIPE_PREIS_PREMIUM_STUDIO` | Preis-Kennung #4 | nur für Premium |
| `APP_URL` | `https://formenchat.web.app` | nein, ist die Voreinstellung |
| `TEST_TAGE` | Länge der Testphase, z. B. `30` | nein, Voreinstellung 30 |

**Ein Secret lässt sich nach dem Speichern nicht mehr ansehen**, nur
überschreiben. Das ist so gewollt. Wenn du dir unsicher bist, ob du
richtig eingefügt hast: einfach neu setzen.

---

## Schritt 7 — Ausrollen und nachsehen

Die Secrets wirken erst beim nächsten Ausrollen der Cloud Functions.

**Am einfachsten:** im Browser zu **Actions** → Workflow „Cloud
Functions deployen" → **Run workflow**.

**Danach nachsehen, ob es angekommen ist.** Im Protokoll des Auftrags
`deploy` gibt es einen Schritt „Prüfen, ob die Kasse eingerichtet ist".
Er sagt dir eines von vier Dingen:

| Meldung | Bedeutung |
|---|---|
| „Die Kasse ist eingerichtet." | alles da |
| „Stripe ist nicht eingerichtet" | `STRIPE_SECRET` fehlt |
| „STRIPE_SECRET ist da, STRIPE_WEBHOOK_SECRET fehlt" | es kann bezahlt werden, aber die Freischaltung kommt nie an |
| „Stripe ist da, aber keine Preis-Kennung" | die Kasse lehnt jeden Aufruf ab |

**Der Lauf bricht bei keiner dieser Meldungen ab**, und das ist
Absicht: die App soll sich ausrollen lassen, bevor es eine Kasse gibt.
Genau so ist sie gebaut.

### Die Gegenprobe im Terminal

```bash
curl -i -X POST https://europe-west1-formenchat.cloudfunctions.net/stripeHaken
```

| Antwort | Bedeutung |
|---|---|
| `503 Kasse nicht eingerichtet` | die Schlüssel sind noch nicht angekommen |
| `400 Unterschrift stimmt nicht` | **richtig so** — die Kasse läuft und weist eine Anfrage ohne gültige Unterschrift ab |

Ein `400` ist hier die gute Nachricht.

---

## Schritt 8 — Bestandsschutz

**Einmal, bevor du den ersten Kunden anlegst.**

Jede Firma, die es heute schon gibt, bekommt fest `gratis`.

**Warum überhaupt, wo „kein Eintrag" doch vollen Zugriff bedeutet?**
Weil diese Regel eines Tages jemandem zu lasch vorkommen wird. Steht
bei jedem Bestandskunden ausdrücklich `gratis`, überlebt der
Bestandsschutz auch die Änderung, die ihn sonst still abräumt — und man
sieht in der Liste, dass es Absicht war und kein leeres Feld.

Aufgerufen wird die Funktion `bestandsschutz`. **Ansehen ist die
Voreinstellung:** ohne `wirklich: true` sagt sie nur, wen sie anfassen
würde. Dieselbe Vorsichtsregel wie bei den Werkzeugen unter `tools/`,
und aus demselben Grund — ein Lauf, der über alle Kunden geht, gehört
erst gesehen und dann ausgeführt.

---

## Schritt 9 — Alles durchspielen

**Im Testmodus.** Hier fließt kein Geld.

### Die Testkarten

| Nummer | Was sie tut |
|---|---|
| `4242 4242 4242 4242` | geht immer durch |
| `4000 0000 0000 0341` | erste Zahlung geht, **Folgeabbuchung schlägt fehl** |
| `4000 0000 0000 9995` | wird sofort abgelehnt (zu wenig Guthaben) |

Ablaufdatum: irgendein künftiges. Prüfziffer: irgendwelche drei
Ziffern. PLZ: irgendeine.

### Der Durchgang

| # | Was | Wo | Was stimmen muss |
|---|---|---|---|
| 1 | Abo buchen | Verwaltung → System → Abo | Stripe-Seite geht auf |
| 2 | Mit `4242…` bezahlen | Stripe | Rückkehr in die App mit „Danke …" |
| 3 | Freischaltung | nach ein paar Sekunden | Zustand steht auf **läuft**, mit Datum |
| 4 | Zustellung ansehen | `dashboard.stripe.com/test/webhooks` | jede Zeile mit Antwortcode `200` |
| 5 | Rechnungen | „Rechnungen, Zahlungsmittel, kündigen" | Stripe-Portal geht auf |
| 6 | Kündigen | im Portal | Zustand → **gekündigt**, mit Enddatum |

### Mit der Kommandozeile geht es schneller

Statt auf eine fehlgeschlagene Abbuchung zu warten:

```bash
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
```

Und die Mahnleiter musst du nicht abwarten — dafür gibt es
`aboUhrJetzt`, aufrufbar nur vom Betreiber. Setze in Stripe oder von
Hand ein `offenSeit` weit in die Vergangenheit und lass die Uhr laufen;
sie rechnet den Zustand neu aus.

> **Was du dabei sehen solltest**, und was das eigentliche Ergebnis
> dieses Schritts ist: bei `nurlesen` erscheint oben in der App eine
> rote Leiste. Für den Chef steht dort, was zu tun ist. Für das Team
> steht dort **„Das liegt nicht an dir"** — und die „Neu"-Knöpfe sind
> weg, damit niemand ein Formular ausfüllt, das beim Absenden
> scheitert.

---

## Schritt 10 — Livemodus

**Erst wenn alles oben stimmt und die Rechtsunterlagen da sind.**

1. In Stripe die Unternehmensangaben vervollständigen: Firmierung,
   Anschrift, Steuernummer, Bankverbindung, Ausweis. Das prüft Stripe,
   es dauert.
2. **Oben auf Livemodus umschalten.**
3. **Alles aus Schritt 3 noch einmal anlegen** — Produkt und die vier
   Preise. Der Testmodus hat sie nicht mitgebracht.
4. **Den Webhook neu anlegen.** Er hat im Livemodus ein **anderes**
   Signaturgeheimnis.
5. Die GitHub-Secrets überschreiben: `sk_live_…`, das neue `whsec_…`,
   die vier neuen Preis-Kennungen.
6. Neu ausrollen.
7. Eine echte Zahlung mit deiner eigenen Karte durchführen und
   anschließend erstatten. Ein Livemodus, der nie eine echte Zahlung
   gesehen hat, ist nicht geprüft.

---

## Wie das Ganze funktioniert

Für den Fall, dass in einem halben Jahr etwas klemmt und du wissen
musst, wo du suchst.

### Der Abo-Zustand

Alles hängt an **einem** Datensatz je Firma:
`firmen/<kennung>/abo/aktuell`. Er ist für den Chef dieser Firma und
für dich lesbar, für sonst niemanden — was ein Betrieb zahlt, geht eine
Aushilfe nichts an.

Neun Zustände:

```
  gratis      zahlt nie (Bestandsschutz)        ─┐
  test        Testphase, läuft bis bisAm         │  voller
  aktiv       bezahlt                            │  Zugriff
  gekuendigt  gekündigt, läuft bis bisAm         │
  faellig     Zahlung offen, Tag 0               │
  mahnung1    Tag 7                              │
  mahnung2    Tag 14                            ─┘
  nurlesen    Tag 21 — sehen ja, ändern nein
  zu          Tag 35 — kein Zugang
```

### Die zwei Mahnleitern

**Lang** (0 / 7 / 14 / 21 / 35 Tage) für einen Kunden, der schon
gezahlt hat. **Drei Wochen lang merkt das Team gar nichts** — nicht aus
Nettigkeit: eine Aushilfe kann die Rechnung nicht bezahlen. Wer sie
aussperrt, bestraft die Falsche und verliert den Kunden wegen der
Sperre statt wegen des Preises.

**Kurz** (sofort nur lesen, nach 14 Tagen zu) für eine abgelaufene
Testphase oder eine Kündigung.

> **Warum zwei und nicht eine:** wer regulär kündigt, *hat* gezahlt.
> Mit der langen Leiter hätte eine Kündigung fünf Wochen Vollzugriff
> geschenkt — sie wäre günstiger gewesen als das Abo. Das steckte in
> der ersten Fassung und ist beim Testschreiben aufgefallen.

### Die Uhr

Läuft jede Nacht um 3:45 Uhr und rechnet den Zustand **neu aus einem
Datum** aus (`offenSeit`), statt ihn eine Stufe weiterzuschieben.

Der Unterschied zeigt sich an dem Tag, an dem der Lauf ausfällt: eine
weitergestellte Leiter steht still, und ein Kunde behält Zugang, den er
nicht mehr hat. Eine gerechnete holt den Tag beim nächsten Lauf auf.

**Drei Dinge fasst sie nie an:** `gratis`, von Hand Gesetztes, und
Firmen ohne Eintrag.

### Wo die Grenze wirklich steht

**In `firestore.rules`, nicht in der App.** Bei `nurlesen` und `zu`
lässt die Datenbank keinen Schreibvorgang mehr zu — auch nicht vom
Chef, auch nicht an der Oberfläche vorbei.

**Lesen bleibt offen.** Dienstpläne, Putzplan und Nachweise sind
Betriebsunterlagen; sie von einem Tag auf den anderen unerreichbar zu
machen ist etwas anderes, als eine Software abzuschalten.

Bei `zu` wird zusätzlich der Zugang ganz entzogen — über das Feld
`aktiv` am Firmen-Dokument, das ohnehin bei jedem Zugriff geprüft wird.
Kosten: null.

### Und der Weg zurück

Ein Betrieb, der wegen einer offenen Zahlung stillgelegt ist, ist genau
der, der zahlen will. **Der Chef wird deshalb nicht abgemeldet** — er
bleibt angemeldet und sieht eine Seite mit einem Knopf zur Kasse.
Abgemeldet könnte er sie nicht aufrufen, denn die Kasse prüft
serverseitig, wer ruft.

---

## Wenn etwas nicht klappt

| Symptom | Ursache, fast immer |
|---|---|
| „Die Bezahlung ist noch nicht eingerichtet" | `STRIPE_SECRET` fehlt oder die Functions sind nicht neu ausgerollt |
| Kasse geht auf, aber nichts wird freigeschaltet | der Webhook fehlt, zeigt woanders hin, oder `STRIPE_WEBHOOK_SECRET` stimmt nicht |
| In Stripe steht `400 Unterschrift stimmt nicht` | Testmodus-Geheimnis gegen Livemodus-Endpunkt (oder umgekehrt) |
| In Stripe steht `503` | die Schlüssel sind nicht ausgerollt |
| Zustand steht auf „läuft", aber **ohne Datum** | genau der Fehler vom 16.9. — behoben; tritt er wieder auf, hat Stripe erneut ein Feld verschoben, und `tests/test-stripe-felder.js` ist die Stelle zum Nachsehen |
| Im Functions-Protokoll „keine Firma zu …" | das Abo trägt keine Firmenkennung — entsteht nur, wenn jemand ein Abo von Hand in Stripe anlegt statt über die App |
| Ein Betrieb bleibt gesperrt, obwohl gezahlt wurde | war er von Hand gesperrt, macht eine Zahlung ihn absichtlich nicht wieder auf — siehe `zuDurchAbo` |
| Kunde zahlt für ein geschlossenes Studio | die Menge wird beim Buchen berechnet, nicht laufend nachgeführt. Studios ändern → im Portal anpassen |

### Wo du nachsiehst

**Stripe:** `dashboard.stripe.com/test/webhooks` → den Endpunkt
anklicken → jede Zustellung mit Antwortcode und vollständiger Nutzlast.

* `200` — angekommen und verarbeitet
* `400` — Unterschrift stimmte nicht. **Wird nicht erneut versucht.**
* `500` — bei uns ging etwas schief. **Stripe versucht es erneut**, über
  Stunden. Das ist gewollt: eine Zustellung, die an einem Netzfehler
  scheitert, darf nicht dazu führen, dass ein zahlender Kunde gesperrt
  bleibt.

**Bei dir:** Firebase-Konsole → Functions → Protokolle. Oder im
Terminal:

```bash
firebase functions:log --only stripeHaken
```

---

## Was ich zu diesem Dokument nicht weiß

Zwei ehrliche Einschränkungen, damit du nicht daran zweifelst, wenn
etwas anders aussieht:

**Die Menüführung im Stripe-Dashboard** ändert sich regelmäßig, und ich
kenne den heutigen Stand nicht. Die Adressen in diesem Dokument sind
stabil, die Knopfbeschriftungen können abweichen. Die Suche im
Dashboard (⌘ + K) findet alles.

**Die Preisangaben von Stripe** (Gebühren je Zahlung) habe ich zuletzt
im August geprüft — die Zahlen stehen in `ABO-PLAN.md`, Abschnitt 4.
Nachsehen, bevor du damit rechnest.

**Was ich dagegen nachgeprüft habe** und worauf du dich verlassen
kannst: die verschobenen Felder aus Schritt 5 stammen aus dem
CHANGELOG der installierten Bibliothek (Version 22.6.2, API
2026-08-26), nicht aus dem Gedächtnis. Die Webhook-Adresse ist aus dem
Ausroll-Protokoll abgelesen. Die `503`-Antwort ist an der
ausgelieferten Adresse gemessen.
