# Abo-Modell für StudioChat — Planung

**Stand:** 11. August 2026 · **Nichts davon ist gebaut.** Dieses Blatt ist
zum Entscheiden da, nicht zum Ausrollen.

---

## Das Wichtigste zuerst: die drei Entscheidungen

Alles andere hängt daran. Sie sind deine, nicht meine — aber ich sage
dir zu jeder, was ich für richtig halte und warum.

| | Frage | Mein Rat |
|---|---|---|
| **1** | Wofür wird bezahlt: je Studio oder je Person? | **Je Studio** — Begründung unten, sie ist der wichtigste Abschnitt hier |
| **2** | Was unterscheidet Basic von Premium? | Nach Funktionen trennen, die **dich** Geld kosten oder Fachwissen brauchen |
| **3** | Was passiert, wenn nicht gezahlt wird? | Stufenweise, nie sofort aussperren — Begründung unten |

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

### Wenn du trotzdem je Person willst

Dann bitte mit **Staffel statt Stückpreis**: bis 10 Personen im
Grundpreis, 11–25 ein Aufschlag, ab 26 der nächste. Das nimmt der
Rechnung das Schwanken. Sag Bescheid, dann rechne ich das durch.

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

Mein Vorschlag, vier Stufen:

| Wann | Was |
|---|---|
| Zahlung schlägt fehl | Freundliche Leiste im Chef-Bereich. **Nur der Chef sieht sie.** Das Team merkt nichts |
| nach 7 Tagen | Leiste wird deutlicher, dazu eine E-Mail |
| nach 14 Tagen | **Nur-Lesen**: alles sichtbar, nichts Neues anlegen. Das Team kann arbeiten, aber es tut weh |
| nach 30 Tagen | Firma wandert ins **Archiv** — das gibt es seit gestern, samt Zurückholen |

**Nie eine Sperre mitten am Tag, nie ohne Vorwarnung, und niemals so,
dass ein Mitarbeiter den Fehler des Chefs ausbaden muss.**

Der Weg dorthin ist schon gebaut: `firmaLoeschen` legt die Firma ins
Archiv, ohne Daten anzufassen, `firmaZurueckholen` holt sie mit einem
Klick zurück. Das Abo müsste diese Knöpfe nur automatisch drücken.

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

## 5. Was du dabei nicht vergessen darfst — Steuern und Recht

**Hier höre ich auf, und zwar nicht aus Bequemlichkeit.** Ich bin weder
Steuerberater noch Anwalt, und beides ist an dieser Stelle kein Beiwerk,
sondern die Hauptsache.

Was ich dir nennen kann, damit du weißt, wonach du fragst:

- **Umsatzsteuer.** Sobald du regelmäßig verkaufst, wird es relevant.
  Es gibt die Kleinunternehmerregelung, es gibt Grenzen, und es gibt
  Sonderregeln für Kunden im EU-Ausland (Reverse Charge). Das gehört zu
  deinem Steuerberater, **bevor** die erste Rechnung rausgeht.
- **Pflichtangaben auf der Rechnung.** Es gibt eine feste Liste, was
  draufstehen muss. Stripe kann Rechnungen erzeugen — ob sie deinen
  Anforderungen genügen, muss jemand prüfen, der das darf.
- **AGB und Preisangaben.** Was ist die Laufzeit, wie wird gekündigt,
  was passiert mit den Daten danach. Bei Geschäftskunden gelten andere
  Regeln als bei Verbrauchern.
- **Auftragsverarbeitung.** Steht schon in `VERKAUF.md` und gilt hier
  genauso: sobald fremde Betriebe Personendaten in deinem System haben,
  braucht es Verträge.

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
| **A** | Abo-Zustand am Firmen-Dokument (`abo: {stufe, status, studios, bisAm}`), von Hand gesetzt. Die App liest ihn, sperrt aber noch nichts | keins |
| **B** | Die Stufen greifen: Premium-Funktionen sichtbar/unsichtbar, in der App **und in den Regeln** | gering |
| **C** | Stripe anbinden: Bezahlseite, Rückmeldung per Webhook, Zustand wird automatisch gesetzt | **hoch** — echtes Geld |
| **D** | Mahnstufen automatisch (die vier Stufen aus Abschnitt 3) | mittel |
| **E** | Selbstbedienung: Kunde ändert Stufe, sieht Rechnungen, kündigt | gering |

**Stufe A allein ist schon nützlich** und kostet fast nichts: du kannst
Kunden von Hand auf „Premium bis 31.12." setzen und alles ausprobieren,
lange bevor Geld fließt. Genau das würde ich zuerst bauen.

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
