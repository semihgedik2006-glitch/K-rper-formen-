# Rechtliches — was die App tut und was du tun musst

Stand 10. August 2026.

**Vorweg, damit es keine Missverständnisse gibt:** ich bin kein Anwalt und
darf keine Rechtsberatung geben. Was hier steht, ist eine Beschreibung
dessen, was die App technisch macht, und eine Liste dessen, was
üblicherweise verlangt wird. Ob euer konkreter Fall damit abgedeckt ist,
kann ich nicht beurteilen — und wer das anders behauptet, sollte es nicht.

---

## Stand 25.9.2026: was dazugekommen ist (Runde 113/114)

Aus dem Betrieb: *„ergänze alle rechtlichen schritte und füge ein was
nötig ist ebenso wie eine AGB und eine cookie zeile die jeder nutzer
einmal anklicken muss"*.

| Schritt | wo | Stand |
|---|---|---|
| **AGB in der App** | Rechtliches → Reiter „AGB“ (auch vor der Anmeldung) | § 1–11 aus `docs/AGB-ENTWURF.md`, ohne die Anmerkungen für den Anwalt |
| **Zustimmung an der Kasse** | Verwaltung → System → Abo: Haken „Ich buche für ein Unternehmen (§ 14 BGB) und stimme den AGB und dem AV-Vertrag zu“ | Ohne Haken ist der Knopf gesperrt, **und** `stripeKasse` lehnt ab. Gespeichert: wer, wann, welcher Stand (`abo/aktuell.zustimmung`). Damit ist die offene Frage aus dem AGB-Entwurf entschieden: „Ob die Kasse die Unternehmereigenschaft abfragen soll“ → ja |
| **Hinweis zur Speicherung** | beim ersten Öffnen, unten, auch vor der Anmeldung | Einmal **je Gerät** bestätigen (§ 25 TDDDG spricht von der Endeinrichtung). Die App setzt nur technisch notwendige Speicherung ein, also keine Einwilligung im Rechtssinn, sondern eine Auskunft. „Mehr dazu“ öffnet die Datenschutzerklärung |
| **Datenschutzerklärung ergänzt** | Rechtliches → Datenschutz | neu: „Auf deinem Gerät“, „Wenn etwas schiefgeht“ (Vorfall melden), Dokumente je Studio, Auskunft selbst herunterladen |
| **Auskunft nach Art. 15** | Ich → Daten; für den Chef: Team → Bearbeiten | P-10 behoben |
| **Datenschutzvorfall melden** | Alles → Was muss ich wissen? | P-02, Meldefrist 48 h im AV-Vertrag |
| **Lizenzdatei** | `LICENSE` | P-04 behoben |

**Weiterhin nur beim Anwalt:** ob AGB, AV-Vertrag und Datenschutzerklärung
in dieser Form tragen. Die App zeigt die AGB ohne den Vermerk „Entwurf“,
denn ein Kunde soll einen Vertragstext lesen und keine Notiz. **Geprüft
sind sie trotzdem nicht.** Das steht hier und in `docs/AGB-ENTWURF.md`.

---

## Was schon gebaut ist

| | |
|---|---|
| **Impressum und Datenschutz** | ein Fenster in der App, **auch ohne Anmeldung** erreichbar |
| **Inhalt liegt je Firma in der Datenbank** | `config/recht`, gepflegt in *Verwaltung → System → ⚖️ Rechtliche Angaben* |
| **`konfig.js` ist nur noch der Rückfall** | und zwar **ausschließlich für den eigenen Betrieb** — siehe unten |
| **Warnung bei Lücken** | fehlt eine Pflichtangabe, steht das rot über dem Text |
| **Warnung für den Chef** | zusätzlich als Karte in *Verwaltung → System* |
| **E-Mail-Bestätigung** | wird beim Anlegen verschickt, Leiste in der App, erneut sendbar |
| **Der Chef sieht den Stand** | in der Freigabe-Karte: „E-Mail bestätigt" oder „noch nicht" |

Ein Impressum hinter einem Login wäre keins. Deshalb steht es schon auf
dem Anmeldebildschirm.

**Warum ein leeres Impressum eine Warnung bekommt und nicht einfach leer
bleibt:** eine App, die eine leere Seite „Impressum" nennt, sieht erledigt
aus. Das ist gefährlicher als gar keine Seite.

---

## Was du eintragen musst — in der App

*Verwaltung → System → **⚖️ Rechtliche Angaben***. Nur der Chef sieht diese
Karte, gespeichert wird nach `config/recht` — **je Firma getrennt**.

**Warum nicht mehr in `konfig.js`:** diese Datei gilt für das ganze
Firebase-Projekt. Solange jeder Kunde ein eigenes Projekt bekam, war das
richtig. Seit mehrere Firmen in EINER Datenbank liegen, ist es falsch: der
zweite Kunde sähe entweder das Impressum von Körperformen oder eine
Warnung, die ihn an eine Datei schickt, an die er gar nicht herankommt.
Und impressumspflichtig ist jeder Betreiber selbst.

**Der Rückfall:** steht in `config/recht` nichts, gilt weiterhin der Block
`recht` aus `konfig.js` — aber **nur für den eigenen Betrieb**. Eine fremde
Firma ohne eigene Angaben bekommt die Warnung, nicht die Angaben von
Körperformen. Genau dieser Fehler ist bei der Studioliste schon einmal
passiert.

### Pflicht (§ 5 DDG)

| Feld | was hinein muss |
|---|---|
| `betreiber` | vollständiger Name, bei GmbH mit Rechtsform |
| `anschrift` | ladungsfähige Anschrift — **ein Postfach genügt nicht** |
| `vertreten` | Geschäftsführer oder Inhaber, mit Namen |
| `email` | muss existieren **und gelesen werden** |

Ohne diese vier zeigt die App die Warnung an. Das ist Absicht.

### Wenn zutreffend

| Feld | wann |
|---|---|
| `telefon` | keine Pflicht, aber üblich |
| `register` | bei Handelsregistereintrag, z. B. „Amtsgericht Köln, HRB 12345" |
| `ustId` | bei vorhandener USt-IdNr. |
| `datenschutzKontakt` | wenn es einen eigenen Ansprechpartner gibt |
| `zusatz` | Absätze, die nur ihr kennt — Videoüberwachung im Studio, Zeiterfassung, Zutrittssystem |

---

## Was die App tatsächlich mit Daten macht

Diese Liste ist am Programm nachprüfbar. Sie ist die Grundlage der
Datenschutzerklärung im Fenster — und sie ist der Teil, den ich
wahrheitsgemäß beantworten kann.

### Was gespeichert wird

**Zum Konto:** Name · E-Mail · Rolle · zugeordnete Studios · Profilbild
oder Symbol · Farbe · Geburtstag (freiwillig) · Zeitpunkt der letzten
Anmeldung.

**Aus der Arbeit:** Chatnachrichten mit Text, Fotos und **Sprachaufnahmen**
· Direktnachrichten · Aufgaben und wer sie wann abgehakt hat · Putzplan
und Notizen · Materialbestände · Gerätemeldungen mit Fotos · Schichten ·
**Urlaub und Krankmeldungen** · Übergaben · Qualifikationsnachweise mit
Ablaufdatum · Dokumente.

**Technisch:** ein Gerätekennzeichen für Push-Nachrichten, nur wenn
eingeschaltet.

### Die drei Punkte, die im Arbeitsverhältnis heikel sind

Ich hebe sie hervor, weil sie in einem Betrieb mit Beschäftigten
regelmäßig zu Rückfragen führen — nicht weil ich beurteilen kann, wie sie
zu bewerten sind:

1. **Krankmeldungen.** Die App speichert, wer wann krank war. Das sind
   Gesundheitsdaten (Art. 9 DSGVO) und damit die empfindlichste Kategorie
   im ganzen System.

   > **Bis zum 17.9.2026 war eine Krankmeldung für jeden freigegebenen
   > Beschäftigten des Betriebs abrufbar, nicht nur für das eigene
   > Studio** — die Studiogrenze stand beim Lesen allein in der
   > Oberfläche. Seit dem 17.9. hält sie die Datenbank selbst
   > (`meinStudio(studioKey)` für `shifts`, `absences`, `handovers`,
   > 27 Zusicherungen in `tests/rules/studiogrenze.test.js`). Der
   > Vorgang ist in `BEKANNTE-PROBLEME.md`, P-01, vollständig
   > festgehalten — **einschliesslich der Zeit, in der es so war.**
2. **Anwesenheitsanzeige.** Die App speichert, wann jemand zuletzt online
   war. Wer das als Kontrolle liest, liegt nicht ganz falsch.
3. **Sprachaufnahmen im Chat.** Hier stand „Stimme ist ein biometrisches
   Merkmal". **Das ist zu pauschal und am 14.9. berichtigt:** Art. 4
   Nr. 14 DSGVO verlangt eine *spezifische technische Verarbeitung*, die
   die eindeutige Identifizierung ermöglicht. Die App nimmt auf und gibt
   wieder — sie erkennt niemanden an der Stimme. Eine Sprachnachricht ist
   damit personenbezogenes Datum, aber nach dieser Lesart **nicht**
   Art. 9. Ein Anwalt sollte das bestätigen; die alte Fassung hätte einen
   Kunden zu einer Einwilligungslösung gedrängt, die er womöglich gar
   nicht braucht — und eine unnötige Einwilligung ist auch ein Fehler.

Alle drei sind Funktionen, die ihr wolltet und die sinnvoll sind. Sie
gehören nur in die Erklärung — und wahrscheinlich in eine Absprache mit
dem Team.

### Wo es liegt

Google Firebase, Region **europe-west1** (Belgien). Anbieter ist Google
Ireland Limited. Firestore, Authentication, Cloud Functions, Cloud
Storage. Die nächtliche Sicherung liegt in derselben Region.

Für die Google-Tabelle geht ein Auszug an Google Apps Script — ebenfalls
Google. Der Monatsbericht geht per Gmail hinaus.

### Wie lange

| | |
|---|---|
| Konto und Inhalte | solange das Konto besteht |
| Papierkorb | 30 Tage, dann endgültig weg |
| Wochensicherungen Material | 52 Wochen |
| Nächtliche Vollsicherung | **7 Tage** (Aufräumen läuft automatisch) |

> **Korrektur vom 14.9.:** Hier stand „30 Tage" für die nächtliche
> Vollsicherung. Im Code steht `BACKUP_TAGE = 7`. Aufgefallen ist es
> beim Erstellen der AV-Unterlagen, weil dort jede Frist eine Fundstelle
> bekommen musste — und diese keine hatte, die zu ihr passte. Eine
> Aufbewahrungsfrist zuzusagen, die das System nicht einhält, ist genau
> die Art Angabe, die in einem Vertrag teuer wird.

### Wer was sieht

Mitarbeiter ihr Studio · Studio-Leiter ihre Studios · Chef alles ·
niemand von außen. Durchgesetzt über **Sicherheitsregeln in der
Datenbank**, nicht nur über die Oberfläche — das ist der Unterschied
zwischen „man sieht es nicht" und „man kommt nicht heran". 61 automatische
Regeltests halten das fest.

---

## Was **nur** ein Anwalt machen kann

Das ist keine Bescheidenheit. Es sind die Punkte, an denen eine falsche
Auskunft von mir Geld kostet.

### 1. Die Texte selbst durchsehen

Der Datenschutztext im Fenster beschreibt korrekt, was passiert. Ob er
**vollständig** ist — Rechtsgrundlagen je Verarbeitung, Widerspruchsrecht,
Aufsichtsbehörde, Betroffenenrechte im richtigen Umfang — kann ich nicht
beurteilen.

### 2. Vereinbarung mit dem Betriebsrat oder dem Team

Sobald Beschäftigtendaten verarbeitet werden, ist die Rechtsgrundlage in
der Regel § 26 BDSG oder eine Betriebsvereinbarung. Bei Anwesenheitszeiten
und Krankmeldungen ist das kein Randthema.

### 3. Verzeichnis von Verarbeitungstätigkeiten

Muss geführt werden, sobald besondere Kategorien dabei sind — und
Krankmeldungen sind welche. Die Inhalte dafür stehen oben in diesem
Dokument; die Form muss jemand kennen, der sie kennt.

### 4. Auftragsverarbeitung mit Google

Für Firebase ist ein Vertrag zur Auftragsverarbeitung nötig. Google
stellt ihn bereit (Google Cloud Data Processing Addendum); er muss
angenommen und abgelegt werden.

### 5. **Sobald du an einen Kunden verkaufst**

Dann verarbeitest **du** Daten **für** den Kunden. Damit brauchst du:

- einen Auftragsverarbeitungsvertrag **mit deinem Kunden**, in dem du der
  Auftragsverarbeiter bist
- technische und organisatorische Maßnahmen, schriftlich
- eine Regelung zu Unterauftragnehmern (Google)
- eine Löschzusage nach Vertragsende

> **Seit dem 14.9. liegen die Entwürfe dafür in `docs/av/`:** Vertrag,
> TOM, Unterauftragnehmer, Löschkonzept und das Verarbeitungsverzeichnis
> nach Art. 30 Abs. 2, das **du** führen musst. Die technischen Angaben
> darin sind am Code nachgeprüft; die rechtlichen Formulierungen sind
> Entwurf und brauchen eine Durchsicht. Anfangen bei `docs/av/README.md`.

**Das ist der Punkt, an dem es aufhört, eine App-Frage zu sein.** Und es
ist derselbe Punkt, an dem `MANDANT-PLAN.md` empfiehlt, vor dem ersten
echten Kunden jemanden von außen auf die Datentrennung schauen zu lassen.

---

## Reihenfolge, die ich vorschlagen würde

| Wann | Was |
|---|---|
| **jetzt** | die vier Pflichtfelder in *Verwaltung → System → ⚖️ Rechtliche Angaben* eintragen — dauert fünf Minuten und die Warnung ist weg |
| **vor dem Einsatz im Team** | Datenschutztext einmal anwaltlich durchsehen lassen; Absprache mit dem Team zu Anwesenheit und Krankmeldungen |
| **vor dem ersten Kunden** | Auftragsverarbeitung, Verzeichnis, Blick von außen auf die Datentrennung |

---

## Was ich hier nicht getan habe

Ich habe **keine** fertige Datenschutzerklärung geschrieben und sie auch
nicht so genannt. Im Fenster steht ausdrücklich: *„Er beschreibt, was die
App tut, und ist am Programm nachprüfbar. Er ist keine anwaltlich geprüfte
Datenschutzerklärung."*

Der Grund: ein Text, der aussieht wie eine geprüfte Erklärung, aber keine
ist, ist schlechter als ein Text, der sagt, was er ist. Man verlässt sich
sonst darauf.

---

# Der Rechts-Entwurf vom 17. September 2026

Aus dem Betrieb kam ein Arbeitsentwurf („StudioChat – Rechtliche Angaben /
Legal Pack"). Was davon in die App konnte, ist drin. Was nicht, steht hier
— und es sind zwei verschiedene Arten von Problemen.

**Ich bin kein Anwalt.** Was hier steht, ist ein Abgleich zwischen dem
Entwurf und dem, was die Anwendung nachweislich tut. Jeder Punkt ist am
Code prüfbar. Ob eine Formulierung trägt, ist eine andere Frage.

---

## 1. Was eingetragen wurde

In `konfig.js`, Block `recht`:

| Feld | Wert | Quelle |
|---|---|---|
| `betreiber` | Semih Gedik | Entwurf, Abschnitt 1 |
| `anschrift` | Kendenicherstraße 15, 50354 Hürth | Nachtrag vom 17.9. |
| `vertreten` | Semih Gedik | Einzelunternehmen — der Inhaber selbst |
| `email` | S.gedik@kformen.com | Nachtrag vom 17.9. |

**Damit sind alle vier Pflichtangaben nach § 5 DDG da, und die rote
Warnung in der App ist weg.**

Zwei Anmerkungen dazu:

*Die Schreibweise der Straße.* Genannt war `Kendenicherstrasse.15`.
Eingetragen ist **`Kendenicherstraße 15`** — ein Wort, mit ß, ohne den
Punkt vor der Hausnummer, so ausdrücklich bestätigt am 17.9.

Zwischenstand am Vormittag des 17.9. war `Kendenicher Straße 15`, also
getrennt. Das war eine Vermutung von mir und keine Angabe; sie ist
zurückgenommen. **In einem Impressum wird nichts geraten** — eine
ladungsfähige Anschrift muss zustellbar sein.

*Diese Angaben sind ab sofort öffentlich.* Sie stehen auf jeder Seite
der App, auch ohne Anmeldung, und in einem öffentlichen Repository. Das
ist bei einem Impressum der Zweck und kein Versehen — es ist trotzdem
eine Privatanschrift. Wer das später ändern will, braucht eine
Geschäftsadresse; der Eintrag hier ist dann eine Zeile.

**Am 17.9. nachgereicht und eingetragen.** Im Entwurf standen an
diesen beiden Stellen noch Platzhalter in eckigen Klammern; sie wurden
bewusst nicht übernommen, bis die echten Werte da waren. Ein
Impressum, in dem „[vollständige ladungsfähige Anschrift]" steht,
sieht fertig aus und ist es nicht.


---

## 2. Wo der Entwurf dem widerspricht, was gebaut ist

**Das ist der wichtigere Teil.** Die Punkte unten sind keine
Formulierungsfragen — sie beschreiben ein anderes Produkt als das, was
seit dem 16.9. ausgeliefert ist.

### 2.1 Zahlungsarten — direkter Widerspruch

| | |
|---|---|
| **Entwurf, AGB** | „Vorgesehen sind insbesondere **PayPal, Überweisung und Rechnung**" |
| **Gebaut** | **Stripe.** Karte und SEPA-Lastschrift. Kein PayPal, keine Überweisung, keine Rechnungsstellung |

Die Anwendung erzeugt **keine Rechnungen** — das macht Stripe. PayPal ist
nicht angebunden. Wer die AGB so verwendet, sagt Zahlungsarten zu, die es
nicht gibt.

**Zu entscheiden:** entweder die AGB an Stripe anpassen, oder PayPal
zusätzlich anbinden. Ersteres ist eine Textänderung, Letzteres Arbeit.

### 2.2 „Zunächst kein fortlaufendes Abo" — trifft nicht mehr zu

Der Entwurf schreibt bei Laufzeit/Kündigung: *„Da zunächst kein
fortlaufendes Abo eingesetzt werden soll…"*

**Doch.** Seit dem 16.9. ist genau das gebaut: ein monatlich
wiederkehrendes Abo mit Testphase, Mahnstufen und Selbstbedienung. Der
Satz war zum Zeitpunkt des Entwurfs richtig und ist es seitdem nicht
mehr.

### 2.3 Der Preis — anderes Modell

| | |
|---|---|
| **Entwurf** | „59,00 € netto pro Monat" als Platzhalter |
| **Gebaut** | **je Studio**: Grundpreis + Aufschlag je weiterem Standort |

Die 59 € sind im gebauten Modell zufällig der Preis für **drei Studios
auf Basic** (29 + 2 × 15). Für ein Einzelstudio wären es 29 €, für
vierzehn 224 €. Ein Festpreis in den AGB widerspricht dem Rechner in der
Kasse.

### 2.4 Kündigungsfrist

Der Entwurf nennt „monatliche Kündbarkeit mit einer Kündigungsfrist von
einem Monat". Im Stripe-Portal kündigt der Kunde selbst, und das Abo
läuft bis zum Ende des **bezahlten Zeitraums** — keine zusätzliche
Frist. Das ist kundenfreundlicher als der Entwurf, aber es steht anders
drin.

### 2.5 Umsatzannahme

Der Entwurf geht von „zunächst ein Studio, geplanter Umsatz unter ca.
1.000 € jährlich" aus. Das ist für die Kleinunternehmerfrage relevant.
**Körperformen hat vierzehn Studios** — sie stehen allerdings auf
Bestandsschutz und zahlen nichts. Die Annahme trifft also zu, solange
kein fremder Kunde dazukommt; beim ersten Kunden mit mehreren Standorten
wird sie schnell falsch.

---

## 3. Wo der Entwurf offen lässt, was längst beantwortet ist

Diese Punkte sind kein Widerspruch, sondern Arbeit, die schon getan ist.
Der Entwurf fordert sie zu Recht — sie liegen nur woanders.

| Entwurf verlangt | Liegt vor in |
|---|---|
| „alle tatsächlich eingesetzten Dienste vollständig ergänzen" | `docs/av/UNTERAUFTRAGNEHMER.md` — vollständig **bis auf den Mailversand** |
| TOMs dokumentieren | `docs/av/TOM.md` — mit Fundstellen im Code, einschließlich der offenen Maßnahmen |
| Löschfristen festlegen | `docs/av/LOESCHKONZEPT.md` — vollständig **bis auf die Stempelzeiten** |
| VVT erstellen | `docs/av/VERARBEITUNGSVERZEICHNIS.md` |
| AVV-Entwurf | `docs/av/AV-VERTRAG-ENTWURF.md` |

**Zwei Lücken bleiben in beiden Papieren dieselben:** welcher Anbieter
den Mailversand macht, und wie lange Stempelzeiten aufbewahrt werden.

---

## 4. Wo der Entwurf etwas zusagt, das es nicht gibt

**Abschnitt 6 (TOMs)** nennt unter den vorgesehenen Maßnahmen die
„Protokollierung sicherheitsrelevanter Vorgänge" und „ein Verfahren für
Datenschutz- und Sicherheitsvorfälle".

**Beides gibt es nicht.**

| | Stand |
|---|---|
| Durchgängiges Protokoll administrativer Zugriffe | **nicht vorhanden** in der App. Google Cloud protokolliert auf seiner Ebene |
| Verfahren für einen Datenschutzvorfall | **nicht festgelegt** — keine benannte Person, kein Meldeweg, keine Vorlage |

Das Zweite ist eine **Pflicht**: Art. 33 DSGVO verlangt die Meldung an
die Aufsichtsbehörde binnen 72 Stunden, und Art. 33 Abs. 2 verpflichtet
den Auftragsverarbeiter, den Verantwortlichen unverzüglich zu
informieren. Als Aufwand ist es klein — eine Seite, eine Adresse, eine
Vorlage. Als Lücke ist es die ernsteste in diesem Abschnitt.

> **Am 17.9.2026 geschrieben: `av/VORFALL.md`.** Sechs Schritte, eine
> benannte Person, eine Meldevorlage, eine Aktenvorlage, eine
> Einstufungstabelle. **Die Lücke ist damit kleiner, nicht zu.** Es gibt
> weiterhin keine Vertretung — fällt die eine zuständige Person aus,
> läuft die Frist des Kunden weiter und niemand meldet. Das ist eine
> Entscheidung, kein Schreibvorgang, und sie gehört auf die Liste für
> den Anwalt.

---

## 5. Die Reihenfolge, die sich daraus ergibt

| Wann | Was | Wer |
|---|---|---|
| ~~jetzt~~ | ~~Anschrift und Geschäfts-E-Mail nennen~~ — **erledigt 17.9.** | Betreiber |
| ~~vor dem ersten Kunden~~ | ~~AGB an Stripe und an „je Studio" anpassen~~ — **Entwurf geschrieben 17.9.: `AGB-ENTWURF.md`**, Prüfung offen | ich, dann Anwalt |
| ~~vor dem ersten Kunden~~ | ~~Verfahren für Datenschutzvorfälle festlegen~~ — **geschrieben 17.9.: `av/VORFALL.md`.** Offen bleibt die **Vertretung** | Betreiber |
| **jetzt** | SMTP-Anbieter nennen — **die Zugangsdaten SIND hinterlegt** (im Ausrollprotokoll steht „SMTP-Zugangsdaten sind hinterlegt."). GitHub gibt ein Secret nicht zurück; der Anbieter steht in der Kopfzeile jeder Mail aus der App („Original anzeigen") | Betreiber |
| **jetzt** | Markenregister zu „StudioChat" abfragen — Vorarbeit und Anleitung in `MARKE.md`. **Zwei gleichnamige Produkte in derselben Branche gefunden** | Betreiber |
| **vor dem ersten Kunden** | Aufbewahrungsfrist für Stempelzeiten setzen | Anwalt |
| **vor dem ersten Kunden** | Entscheiden, ob § 8 des AGB-Entwurfs (30 Tage, Export) so zugesagt wird — **dann muss die Exportfunktion gebaut werden** | Betreiber, dann ich |
| **vor dem Livemodus** | gesamtes Paket anwaltlich durchsehen lassen | Anwalt |
