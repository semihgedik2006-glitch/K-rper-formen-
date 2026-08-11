# Abo-Modell für StudioChat — Planung

**Stand:** 11. August 2026 · **Nichts davon ist gebaut.** Dieses Blatt ist
zum Entscheiden da, nicht zum Ausrollen.

---

## ✅ Entschieden am 11. August 2026

| | Frage | Entscheidung |
|---|---|---|
| **1** | Wofür wird bezahlt? | **Je Studio.** Mitarbeiter unbegrenzt |
| **2** | Basic gegen Premium? | nach Funktionen getrennt, Vorschlag in Abschnitt 2 — noch offen im Detail |
| **3** | Wenn nicht gezahlt wird? | **Mahnungen → nichts mehr bearbeiten → gar kein Zugriff.** Ausgeführt in Abschnitt 3 |
| **4** | Steuern | **beide Fälle vorbereiten** (Kleinunternehmer und Regelbesteuerung) — Abschnitt 5 |

Die Begründungen zu 1 und 3 stehen unverändert unten. Sie sind jetzt
Beleg, nicht mehr Vorschlag.

---

## 1. Warum ich von „je Mitarbeiter" abrate

Du hast gesagt: der Chef zahlt, und für jeden weiteren Mitarbeiter kommt
ein Betrag dazu. Das ist die übliche Bauart bei Software, und bei dieser
App halte ich sie für **falsch**. Drei Gründe:

**Der Kunde fängt an zu sparen — an deiner App.** Wenn jeder Zugang Geld
kostet, teilen sich zwei Aushilfen ein Konto. Genau das habt ihr in
`konten-pruefen.js` schon als Problem gefunden. Eine App, in der nicht
alle drin sind, verliert ihren Zweck: der Putzplan stimmt nicht mehr,
der Chat erreicht nicht alle, die Schichten hängen an Karteileichen.

**Die Zahl schwankt zu stark.** EMS-Studios arbeiten mit Aushilfen und
Studenten. Ein Betrieb hat im Januar 40 Leute und im März 52. Eine
Rechnung, die jeden Monat anders aussieht, erzeugt Rückfragen — und
Rückfragen kosten dich Zeit, die teurer ist als der Unterschied.

**Es passt nicht zu eurem eigenen Aufbau.** Die App ist um **Studios**
gebaut: Aufgaben, Putzplan, Schichten, Material, Geräte — alles hängt an
`studio-N`. Das Studio ist die stabile Einheit. Der Kunde denkt auch so
(„ich habe drei Standorte"), und seit gestern gibst du beim Anlegen
genau das an.

> **Und das Beste daran:** je Studio wächst der Preis mit dem Umsatz des
> Kunden. Ein Betrieb mit acht Standorten kann acht Standorte bezahlen.
> Ein Einzelstudio zahlt wenig und bleibt trotzdem Kunde.

**Mitarbeiter unbegrenzt.** Das ist obendrein ein Verkaufsargument, das
sich in einem Satz sagen lässt: *„Alle Ihre Leute, ohne Aufpreis."*

> **Entschieden: je Studio.** Der Rechner kann weiterhin beide Modelle
> nebeneinander zeigen — nicht, weil die Entscheidung wackelt, sondern
> weil sie sich damit in einem Verkaufsgespräch begründen lässt.

---

## 2. Was Basic von Premium unterscheiden sollte

Die Versuchung ist, dem Basic-Kunden willkürlich etwas wegzunehmen. Das
merkt er und ärgert sich. Besser sind zwei Sorten von Grenzen:

**a) Was dich echtes Geld kostet.** Die KI-Funktionen rufen Google an,
und das wird abgerechnet. Es gibt dafür seit gestern schon eine
Tagesgrenze je Firma — die Aufhängung ist also gebaut.

**b) Was Fachwissen oder Haftung mitbringt.** Nachweise (Erste Hilfe,
Trainerlizenzen) mit Ablaufwarnung sind Compliance. Wer das braucht,
zahlt dafür.

Ein Vorschlag als Ausgangspunkt — **das ist eine Liste zum Streichen,
nicht mein letztes Wort:**

| Funktion | Basic | Premium |
|---|---|---|
| Chat, Direktnachrichten, Umfragen | ✅ | ✅ |
| Aufgaben, Putzplan, Wochenarchiv | ✅ | ✅ |
| Schichtplan, Urlaub, Schichttausch | ✅ | ✅ |
| Material und Bestellvorschlag | ✅ | ✅ |
| Dokumente, Schwarzes Brett | ✅ | ✅ |
| Push-Benachrichtigungen | ✅ | ✅ |
| **Nachweise mit Ablaufwarnung** | — | ✅ |
| **Geräte- und Schadensbuch** | — | ✅ |
| **Monatsbericht per E-Mail** | — | ✅ |
| **Auswertung / Statistik** | — | ✅ |
| **Export nach Excel / Google-Tabelle** | — | ✅ |
| **KI für Werbetexte und Bilder** | — | ✅ |

**Warum die Trennung so liegt:** alles, was das Team *täglich* braucht,
ist in Basic. Sonst funktioniert die App nicht, und ein Kunde, dessen
Team nicht arbeiten kann, kündigt. Premium ist, was der **Chef** will:
Überblick, Nachweise, Auswertung, Marketing.

> **Achtung, eine Falle:** eine Funktion wegnehmen, die der Kunde schon
> benutzt hat, geht nicht gut aus. Wenn du Stufen einführst, dann
> **bevor** jemand Kunde wird — oder Bestandskunden behalten dauerhaft,
> was sie hatten. Das ist keine Nettigkeit, das ist Rechtsfrieden.

---

## 3. Was passiert, wenn nicht gezahlt wird

**Das ist die Entscheidung, die weh tut, wenn sie falsch ist.** Und es
ist dieselbe Frage wie beim Sperren einer Firma — mit demselben Risiko.

Stell dir vor: Freitagabend, ein Studio hat Vollbetrieb, und die
Kreditkarte des Chefs ist vor drei Tagen abgelaufen. Wenn die App dann
zu ist, steht ein Team ohne Putzplan, ohne Schichten, ohne Chat da. Der
Kunde kündigt — **wegen der Sperre, nicht wegen des Preises.**

**✅ Entschieden:** Mahnungen → nichts mehr bearbeiten → gar kein
Zugriff. Ausbuchstabiert sieht das so aus:

| Tag | Zustand | Was der **Chef** sieht | Was das **Team** merkt |
|---|---|---|---|
| 0 | `faellig` | Leiste im Chef-Bereich, dazu eine E-Mail | **nichts** |
| 7 | `mahnung1` | deutlichere Leiste, zweite E-Mail | **nichts** |
| 14 | `mahnung2` | Leiste rot, dritte E-Mail mit Datum der Sperre | **nichts** |
| 21 | `nurlesen` | Hinweis oben in der App | alles sichtbar, **nichts mehr anlegen oder ändern** |
| 35 | `zu` | kein Zugang mehr, Meldung „stillgelegt" | dasselbe |
| 65 | *Archiv* | Firma wandert ins Archiv des Betreibers | — |

**Warum das Team drei Wochen lang gar nichts merkt.** Nicht aus
Nettigkeit: eine Aushilfe kann die Rechnung nicht bezahlen. Wer sie
aussperrt, bestraft die Falsche und verliert den Kunden **wegen der
Sperre, nicht wegen des Preises**. Drei Wochen sind genug, dass ein
Chef eine abgelaufene Karte bemerkt, und kurz genug, dass es nicht
folgenlos bleibt.

**Warum „nur lesen" vor „gar nichts".** Der Putzplan von letzter Woche,
die Nachweise, die Dienstpläne — das sind Betriebsunterlagen. Sie von
einem Tag auf den anderen unerreichbar zu machen, ist etwas anderes als
eine Software abzuschalten. Zwei Wochen Nur-Lesen sind die Frist, in der
sich jemand die Sachen herausholen kann, die er braucht.

**Warum 30 Tage zwischen „zu" und Archiv.** Weil das Archiv der Punkt
ist, ab dem nichts mehr in der App sichtbar ist — auch nicht für den
Betreiber. Wer nach vier Wochen doch noch zahlt, soll einen Klick
entfernt sein.

### Was davon schon gebaut ist

| | |
|---|---|
| Ins Archiv legen, ohne Daten anzufassen | `firmaLoeschen` ✅ |
| Mit einem Klick zurückholen | `firmaZurueckholen` ✅ |
| Kein Zugang mehr, mit klarer Meldung | `aktiv:false` + `firmaLaeuft(f)` in den Regeln ✅ |
| Nur-Lesen | **fehlt** — neuer Zustand in den Regeln |
| Die Uhr, die die Stufen weiterstellt | **fehlt** — ein Zeitplan, ähnlich `purgeTrash` |

**Der Zustand `nurlesen` ist die einzige neue Grenze**, und er gehört in
`firestore.rules`, nicht in die App. Sonst schreibt jeder weiter, der
die Adresse kennt. Genau dieser Fehler ist beim Sperren zwei Tage lang
unbemerkt geblieben — die Lehre daraus steht in Abschnitt 6.

> **Eine Warnung zu den Fristen.** Ob eine Sperre nach 35 Tagen zulässig
> ist, hängt am Vertrag (AGB, Laufzeit, Zahlungsverzug) — nicht an
> meinem Vorschlag. Die Zahlen sind ein Entwurf für das Gespräch mit dem
> Anwalt, kein Ergebnis davon.

---

## 4. Ein Vorschlag mit Zahlen

**Alle Beträge sind Platzhalter.** Ich kenne euren Markt nicht und habe
keine Wettbewerbspreise geprüft. Sie zeigen die *Form*, nicht die Höhe.

| | Basic | Premium |
|---|---|---|
| Grundpreis je Monat | 29 € | 49 € |
| je weiteres Studio | 15 € | 25 € |
| Mitarbeiter | unbegrenzt | unbegrenzt |
| Einrichtung einmalig | 0 € | 0 € |

Was das für verschiedene Kunden hieße:

| Kunde | Studios | Basic | Premium |
|---|---|---|---|
| Einzelstudio | 1 | 29 € | 49 € |
| kleine Kette | 3 | 59 € | 99 € |
| mittlere Kette | 8 | 134 € | 224 € |
| **euer eigener Betrieb** | **14** | **224 €** | **374 €** |

> Die letzte Zeile ist der nützlichste Satz für ein Verkaufsgespräch:
> *„Wir benutzen das selbst, in vierzehn Studios."* Und sie sagt dir,
> was die App euch intern wert ist.

### Was dir davon bleibt

| Posten | je Kunde und Monat |
|---|---|
| Firebase (gemessen, nicht geschätzt) | **~1,70 €** |
| Stripe-Gebühr (grob 1,5 % + 0,25 € bei einer Karte aus der EU) | **~1,15 €** bei 59 € |
| **Zusammen** | **~2,85 €** |

Bei einem Kunden mit drei Studios auf Basic bleiben von 59 € rund
**56 €**. Die Infrastruktur ist bei diesem Geschäft **nicht** der
Kostenfaktor — deine Zeit für Support ist es.

> **Zwei Warnungen zu diesen Zahlen.** Die 1,70 € sind an einem
> App-Start mit 14 Studios und einem Jahr Daten **gemessen** und stehen
> in `MANDANT-PLAN.md`. Die Stripe-Gebühren habe ich **nicht** geprüft —
> Gebührenmodelle ändern sich, und mein Wissensstand ist nicht die
> Preisliste von heute. Nachsehen, bevor du damit rechnest.

---

## 5. Steuern — beide Fälle vorbereiten

**Vorweg, und das ist keine Floskel:** ich bin kein Steuerberater. Was
hier steht, ist eine **Orientierung, damit du weißt, wonach du fragst**
— keine Auskunft, auf die du dich verlassen darfst. Beträge und Grenzen
ändern sich, und mein Wissensstand ist nicht der Gesetzestext von heute.

### Die beiden Fälle

| | **Kleinunternehmer** (§ 19 UStG) | **Regelbesteuerung** |
|---|---|---|
| Umsatzsteuer auf der Rechnung | **keine** | ja, mit Satz und Betrag |
| Hinweis auf der Rechnung | Pflicht: Grund für die fehlende USt | — |
| Vorsteuer (z. B. Firebase, Werkzeuge) | **nicht abziehbar** | abziehbar |
| Voranmeldungen ans Finanzamt | keine | regelmäßig |
| Aufwand | klein | spürbar, ohne Software kaum machbar |

**Der Punkt, der bei B2B oft übersehen wird:** deine Kunden sind
Studios, also Unternehmen. Für die ist die Umsatzsteuer **durchlaufend**
— sie holen sie sich zurück. Ein Preis „59 € netto" tut einem Studio
genauso weh wie „59 € ohne USt". Regelbesteuerung ist im B2B-Geschäft
also **kein Preisnachteil**, anders als bei Privatkunden.

Umgekehrt: als Kleinunternehmer kannst du dir die Umsatzsteuer auf deine
eigenen Kosten (Firebase, Domain, Werkzeuge) **nicht** zurückholen.

### Was ich zu deiner Lage vermute

Du hast gefragt, ob ich raten kann. Kann ich — **als Vermutung, die du
prüfen lässt**, nicht als Auskunft:

- **Am Anfang fast sicher Kleinunternehmer.** Mit ein bis fünf Kunden
  liegst du deutlich unter jeder Umsatzgrenze. Der Aufwand der
  Regelbesteuerung stünde in keinem Verhältnis.
- **Der Umstieg kommt schneller, als man denkt.** Bei je Studio und den
  Beträgen aus Abschnitt 4 reichen schon wenige mittlere Ketten. Die
  Grenze gilt außerdem **rückwirkend fürs Folgejahr** — man rutscht
  hinein, ohne etwas zu tun. Deshalb: von Anfang an so bauen, dass die
  Umstellung ein Schalter ist und kein Umbau.
- **Man kann freiwillig verzichten**, um Vorsteuer zu ziehen. Ob sich
  das lohnt, hängt an deinen Ausgaben — genau die Rechnung, die ein
  Steuerberater in zehn Minuten macht.

### Was bei dir als Student obendrauf kommt — und wichtiger ist

**Das ist der Teil, den ich für dringender halte als die Umsatzsteuer.**
Regelmäßige Einnahmen neben dem Studium können Dinge berühren, die
nichts mit dem Finanzamt zu tun haben:

- **Familienversicherung.** Wer über die Eltern krankenversichert ist,
  hat eine Einkommensgrenze. Wird sie überschritten, wird die eigene
  Versicherung fällig — und die kostet mehr, als das Abo am Anfang
  einbringt.
- **Werkstudentenstatus.** Der hängt an Arbeitszeit und Art der
  Tätigkeit. Selbständige Einnahmen daneben sind nicht automatisch ein
  Problem, aber auch nicht automatisch keins.
- **BAföG**, falls relevant: eigene Einkommensgrenzen, eigene Fristen.
- **Gewerbeanmeldung.** Software gegen wiederkehrendes Entgelt zu
  verkaufen, ist in aller Regel ein Gewerbe. Das ist eine Anmeldung beim
  Amt, keine große Sache — aber sie steht **vor** der ersten Rechnung.
> **Die Eigentumsfrage ist geklärt (11.8.2026).** Ich hatte sie hier als
> Risiko notiert: wem gehört eine App, die für einen Betrieb gebaut
> wurde, in dem man selbst arbeitet? Antwort: sie gehört dir, sie ist
> für deinen Chef entstanden, und er trägt den gemeinsamen Gewinn mit.
> Damit ist der Punkt erledigt und steht hier nur noch als Verlauf —
> nicht mehr als offene Frage.

### Was das für den Bau heißt

Damit beide Fälle vorbereitet sind, muss genau **eine** Sache stimmen:
Preise werden **netto** geführt und die Steuer separat, auch wenn sie
zunächst 0 % beträgt. Wer Bruttopreise fest verdrahtet, baut den Umstieg
später mühsam nach.

Bei Stripe ist das ein Schalter, kein Umbau — es kennt Kleinunternehmer,
Steuersätze und Reverse Charge. **Dass es das kennt, heißt nicht, dass
es für dich richtig eingestellt ist.** Das prüft jemand, der es darf.

### Der Rest, der ebenfalls kein Code ist

- **Pflichtangaben auf der Rechnung.** Feste Liste. Stripe kann
  Rechnungen erzeugen — ob sie genügen, muss jemand prüfen, der das darf.
- **AGB und Preisangaben.** Laufzeit, Kündigung, was mit den Daten
  danach passiert. Bei Geschäftskunden gelten andere Regeln als bei
  Verbrauchern.
- **Auftragsverarbeitung.** Steht schon in `VERKAUF.md`: sobald fremde
  Betriebe Personendaten in deinem System haben, braucht es Verträge.

**Der Satz, den ich dir mitgebe:** ein Abo-Modell ist zu 20 % Software
und zu 80 % Buchhaltung, Steuern und Verträge. Der Teil, den ich bauen
kann, ist der kleinere.

---

## 6. Wie es technisch aussähe

**Kartendaten fasst diese App niemals an.** Das ist keine Vorsicht,
sondern der einzige gangbare Weg: wer Kartennummern selbst entgegennimmt,
fällt unter Sicherheitsauflagen (PCI-DSS), die für einen Betrieb eurer
Größe unbezahlbar sind. Der Kunde wird stattdessen auf eine Seite des
Zahlungsanbieters geschickt und kommt zurück.

**Empfehlung: Stripe.** Nicht weil es das Beste ist, sondern weil es das
mit Abstand am besten dokumentierte ist und Abo-Verwaltung, Rechnungen,
Mahnwesen und Steuersätze mitbringt. Alternativen (Paddle, Lemon
Squeezy) treten als Verkäufer auf und nehmen dir die Umsatzsteuer ganz
ab — dafür ist die Gebühr höher. **Das ist eine Frage an deinen
Steuerberater, keine technische.**

Der Umbau in Stufen, so wie beim Umzug:

| | Was | Risiko |
|---|---|---|
| **A** ✅ | Abo-Zustand unter `firmen/<kennung>/abo/aktuell`, von Hand gesetzt. Die App liest und zeigt ihn, sperrt aber nichts | keins |
| **B** | Die Stufen greifen: Premium-Funktionen sichtbar/unsichtbar, in der App **und in den Regeln** | gering |
| **C** | Stripe anbinden: Bezahlseite, Rückmeldung per Webhook, Zustand wird automatisch gesetzt | **hoch** — echtes Geld |
| **D** | Der Zustand `nurlesen` in den Regeln, dazu die Uhr, die die Mahnstufen aus Abschnitt 3 weiterstellt | mittel |
| **E** | Selbstbedienung: Kunde ändert Stufe, sieht Rechnungen, kündigt | gering |

### ✅ Stufe A ist gebaut — 11. August 2026

Unter **Verwaltung → 🏛 Firmen** hat jede Firma jetzt eine Abo-Zeile und
einen Knopf „ändern": Stufe (Basic/Premium), Zustand, Preis **netto**,
Laufzeit, Notiz.

**Vier Zustände**, und `gratis` ist einer davon — nicht ein Preis von 0
mit Beigeschmack:

| | |
|---|---|
| `aktiv` | läuft, wird bezahlt |
| `gratis` | kostenlos, dauerhaft oder befristet |
| `test` | Testphase |
| `gekuendigt` | gekündigt |

Der Unterschied zwischen `gratis` und „0 €" zählt: ein Gratis-Abo ist
eine **Entscheidung**, kein Zahlungsausfall — es darf nie in die
Mahnstufen aus Abschnitt 3 geraten.

**Wo der Zustand liegt und warum:** `firmen/<kennung>/abo/aktuell`,
nicht im Firmen-Dokument. Letzteres ist öffentlich lesbar, weil der
Anmeldebildschirm den Firmennamen braucht. Was ein Kunde zahlt, geht
niemanden etwas an — am wenigsten einen Wettbewerber, der die Kennung
errät. Lesen darf es der Betreiber und der Chef der eigenen Firma;
schreiben nur der Betreiber.

**Was schon erzwungen wird, obwohl noch nichts abrechnet:**

- `gratis` setzt den Betrag **auf dem Server** auf 0. Die Oberfläche
  blendet das Feld zwar aus, aber die Oberfläche ist keine Grenze. Ein
  Gratis-Abo mit hinterlegtem Betrag wäre eine Zeitbombe: sobald später
  etwas abrechnet, was den Betrag liest, bekommt der Chef eine Rechnung,
  die ihm nie jemand angekündigt hat.
- Negative Beträge werden zu 0. Kein Angriff — ein Tippfehler, der
  später eine Gutschrift auslösen könnte.
- Erfundene Stufen und Zustände werden abgewiesen.
- Es steht drin, **wer** es wann gesetzt hat.

**Belegt durch 20 Prüfungen**: 10 gegen die Regeln (wer darf lesen, wer
darf schreiben, und ob eine breitere Regel darüberliegt), 10 gegen die
ausgeführte Funktion.

**Was Stufe A ausdrücklich nicht tut:** sperren. Premium-Funktionen sind
für Basic-Kunden weiterhin sichtbar. Das ist Stufe B — und die Grenze
gehört dann in `firestore.rules`, nicht in die App.

> **Die Regel-Falle, die hier wieder lauert.** Wenn Premium-Funktionen
> nur in der App ausgeblendet werden, sind sie nicht abgeschaltet — wer
> die Adresse kennt, kommt trotzdem heran. Die Grenze muss in
> `firestore.rules` stehen, so wie `firmaLaeuft(f)` seit gestern. Und
> genau wie dort gilt: **ohne Test ist so eine Grenze eine Behauptung.**
> Beim Sperren war sie zwei Tage lang eine.

---

## 7. Was ich dabei nicht leisten kann

- **Ich kann keine echte Zahlung testen.** Stripe hat einen Testmodus
  mit Spielkarten; damit lässt sich viel prüfen. Ob am Ende Geld auf
  eurem Konto ankommt, sieht man erst, wenn es passiert.
- **Ich kann die Gebühren nicht bestätigen.** Mein Wissensstand ist
  nicht die heutige Preisliste. Bevor du mit einer Zahl rechnest, sieh
  sie beim Anbieter nach.
- **Ich kann nichts zu Steuern und Verträgen sagen.** Siehe Abschnitt 5.
  Das ist kein Formalsatz — es ist der Teil, an dem so ein Vorhaben
  wirklich scheitert.
- **Ich kann dir den Preis nicht nennen.** Was der Markt zahlt, weiß
  jemand, der mit euren Wettbewerbern gesprochen hat. Ich kann rechnen,
  was übrig bleibt — das ist etwas anderes.

---

## 8. Was ich vorschlagen würde

1. **Zahlen durchspielen** — mit dem Rechner, den ich dir dazu gebaut
   habe. Nichts davon ist verbindlich, aber es zeigt schnell, welche
   Form funktioniert.
2. **Die drei Entscheidungen treffen** (Abschnitt 1–3). Ohne sie ist
   jeder Code Raten.
3. **Mit dem Steuerberater reden**, bevor irgendetwas gebaut wird. Wenn
   dabei „Kleinunternehmer, keine Umsatzsteuer" herauskommt, sieht das
   Ergebnis anders aus als bei „Regelbesteuerung mit EU-Kunden".
4. **Stufe A bauen** — Abo-Zustand von Hand. Kostet wenig, du kannst
   alles ausprobieren, und nichts davon fasst Geld an.
5. **Erst dann** über Stripe reden.

Punkt 3 vor Punkt 4. Nicht umgekehrt.
