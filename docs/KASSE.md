# Die Kasse einrichten — Stripe

**Stand:** 16. September 2026 · Gebaut ist Stufe C, D und E aus
`docs/ABO-PLAN.md`. Was fehlt, sind die Schlüssel — und die kann nur du
anlegen.

---

## Vorweg: was heute passiert, wenn du nichts tust

**Nichts.** Und das ist Absicht.

Fehlt `STRIPE_SECRET`, antworten die drei Endpunkte mit „Die Bezahlung
ist noch nicht eingerichtet. Bitte an den Betreiber wenden." Die App
läuft vollständig weiter. Der Bestandsschutz greift, die Mahnleiter
läuft ins Leere, weil niemand einen Rückstand hat.

**Die Paywall ist damit heute für niemanden scharf.** Sie wird es erst,
wenn du einen Kunden anlegst — der bekommt beim Anlegen automatisch eine
Testphase.

> **Ein Punkt, der vor dem ersten zahlenden Kunden geklärt sein muss und
> nicht hier gelöst werden kann:** Geld einzunehmen ohne Impressum, AGB
> und — bei Verbrauchern — Widerrufsbelehrung ist abmahnfähig. Die
> Unterlagen dafür sind in Arbeit. Bis sie da sind: Stripe kannst du
> einrichten und im Testmodus ausprobieren, nur nicht scharf schalten.

---

## 1. Was du in Stripe anlegst

Im Stripe-Dashboard, **zuerst im Testmodus** (Schalter oben rechts).

### Produkt und Preise

Ein Produkt, **vier Preise**. Der Zuschnitt kommt aus
`docs/ABO-PLAN.md`, Abschnitt 1: bezahlt wird **je Studio**, Mitarbeiter
unbegrenzt.

| Preis | Wofür | Beispielbetrag |
|---|---|---|
| Basic Grundpreis | das erste Studio | 29 € netto / Monat |
| Basic je weiteres Studio | Standort 2, 3, … | 15 € netto / Monat |
| Premium Grundpreis | das erste Studio | 49 € netto / Monat |
| Premium je weiteres Studio | Standort 2, 3, … | 25 € netto / Monat |

**Die Beträge sind Platzhalter** und stehen so nirgends in der App —
sie stehen nur in Stripe. Ändern heißt: in Stripe ändern, nicht im Code.

Wichtig beim Anlegen:

* **Wiederkehrend**, monatlich.
* **Netto**, Steuer separat. Auch als Kleinunternehmer mit 0 %. Der
  Grund steht in `ABO-PLAN.md`, Abschnitt 5: wer Bruttopreise
  festschreibt, baut den Umstieg auf Regelbesteuerung später mühsam
  nach.
* Jeder Preis hat eine **Kennung** (`price_1ABC…`). Die brauchst du
  gleich.

### Der Webhook

Stripe → Entwickler → Webhooks → Endpunkt hinzufügen.

**Adresse:**
```
https://europe-west1-formenchat.cloudfunctions.net/stripeHaken
```

**Diese fünf Ereignisse auswählen — und nur diese:**

| Ereignis | Was es bewirkt |
|---|---|
| `checkout.session.completed` | merkt sich Kunde und Abo |
| `invoice.paid` | schaltet frei, löscht jeden Rückstand |
| `invoice.payment_failed` | startet die Mahnleiter |
| `customer.subscription.updated` | Kündigung vorgemerkt / wieder aktiv |
| `customer.subscription.deleted` | Vertragsende → zwei Wochen Nur-Lesen |

Stripe zeigt dir danach ein **Signaturgeheimnis** (`whsec_…`).

---

## 2. Was du in GitHub hinterlegst

**Settings → Secrets and variables → Actions → New repository secret.**

> **Niemals in den Quelltext.** Das Repository ist öffentlich. Ein
> Stripe-Geheimschlüssel darin ist kein Fehler, den man später
> ausbessert — er ist ab der Minute des Hochladens ein Schaden in echtem
> Geld. Stripe durchsucht GitHub selbst nach solchen Schlüsseln und
> sperrt sie; verlass dich aber nicht darauf.

| Secret | Woher | Pflicht? |
|---|---|---|
| `STRIPE_SECRET` | Entwickler → API-Schlüssel → **Geheimschlüssel** (`sk_…`) | ja |
| `STRIPE_WEBHOOK_SECRET` | aus Schritt 1, der Webhook (`whsec_…`) | ja |
| `STRIPE_PREIS_BASIC` | Preis-Kennung Basic Grundpreis (`price_…`) | ja |
| `STRIPE_PREIS_BASIC_STUDIO` | Preis-Kennung Basic je weiteres Studio | ja |
| `STRIPE_PREIS_PREMIUM` | Preis-Kennung Premium Grundpreis | nur für Premium |
| `STRIPE_PREIS_PREMIUM_STUDIO` | Preis-Kennung Premium je weiteres Studio | nur für Premium |
| `APP_URL` | `https://formenchat.web.app` | nein, das ist die Voreinstellung |
| `TEST_TAGE` | Länge der Testphase, Voreinstellung `30` | nein |

Danach einmal die Cloud Functions ausrollen. Der Lauf sagt dir im
Protokoll, ob er die Kasse gefunden hat — **er bricht nicht ab**, wenn
etwas fehlt, sondern warnt. Ein Deploy, der an einer fehlenden Kasse
scheitert, wäre der schlechtere Fehler.

---

## 3. Der Bestandsschutz — einmal laufen lassen

**Bevor du den ersten Kunden anlegst.**

Jede Firma, die es heute schon gibt, bekommt fest `gratis`. Das ist
technisch nicht nötig — „kein Eintrag" bedeutet ohnehin voller Zugriff —
aber es überlebt die Änderung, die diese Regel eines Tages jemandem zu
lasch vorkommen lässt.

Aufgerufen wird `bestandsschutz`. **Ansehen ist die Voreinstellung:**
ohne `wirklich: true` sagt die Funktion nur, wen sie anfassen würde.
Dieselbe Vorsichtsregel wie bei den Werkzeugen unter `tools/`.

---

## 4. Ausprobieren, bevor es echt wird

Im **Testmodus** von Stripe, mit der Testkarte `4242 4242 4242 4242`
(beliebiges künftiges Datum, beliebige Prüfziffer).

| Prüfen | Wie |
|---|---|
| Kasse geht auf | Verwaltung → System → Abo → „Abo buchen" |
| Freischaltung kommt an | nach dem Bezahlen: Zustand steht auf `läuft` |
| Zahlung schlägt fehl | Testkarte `4000 0000 0000 0341` |
| Mahnleiter läuft | `aboUhrJetzt` aufrufen statt bis 3:45 Uhr zu warten |
| Kündigung | im Stripe-Portal über „Rechnungen, Zahlungsmittel, kündigen" |

Erst wenn das alles stimmt, in Stripe auf **Livemodus** umstellen und
die Secrets gegen die Live-Schlüssel tauschen. **Der Webhook muss im
Livemodus neu angelegt werden** — er hat dort ein anderes
Signaturgeheimnis.

---

## 5. Was die App mit dem Geld NICHT tut

* **Kartendaten fasst sie nie an.** Der Kunde wird auf eine Seite von
  Stripe geschickt. Wer Kartennummern selbst entgegennimmt, fällt unter
  PCI-DSS, und das ist für einen Betrieb dieser Größe unbezahlbar.
* **Rechnungen erzeugt sie nicht.** Das macht Stripe. Ob dessen
  Rechnungen die deutschen Pflichtangaben erfüllen, muss jemand prüfen,
  der das darf.
* **Sie rechnet keine Steuer.** Das stellt man in Stripe ein, und zwar
  jemand, der weiß, ob Kleinunternehmerregelung oder Regelbesteuerung
  gilt und wann bei EU-Geschäftskunden Reverse Charge greift.

---

## 6. Wenn etwas nicht klappt

| Symptom | Ursache, fast immer |
|---|---|
| „Die Bezahlung ist noch nicht eingerichtet" | `STRIPE_SECRET` fehlt oder die Functions sind nicht neu ausgerollt |
| Kasse geht auf, aber nichts wird freigeschaltet | der Webhook fehlt, zeigt woanders hin, oder `STRIPE_WEBHOOK_SECRET` stimmt nicht |
| Im Stripe-Protokoll steht 400 „Unterschrift stimmt nicht" | Testmodus-Geheimnis gegen Livemodus-Endpunkt (oder umgekehrt) |
| Im Functions-Protokoll steht „keine Firma zu …" | das Abo trägt keine Firmenkennung — entsteht nur, wenn ein Abo von Hand in Stripe angelegt wurde, nicht über die App |
| Ein Betrieb bleibt gesperrt, obwohl gezahlt wurde | war er von Hand gesperrt (`firmaSperren`), macht die Zahlung ihn absichtlich nicht wieder auf — siehe `zuDurchAbo` |

**Wo du nachsiehst:** Stripe → Entwickler → Webhooks → der Endpunkt →
jede Zustellung mit Antwortcode. Eine `500` heißt: es wird erneut
versucht. Eine `400` heißt: die Unterschrift stimmte nicht, und es wird
**nicht** erneut versucht.
