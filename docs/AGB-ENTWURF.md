# Allgemeine Geschäftsbedingungen — Entwurf, an das gebaute Produkt angeglichen

Stand 17. September 2026

> **Ich bin kein Anwalt und darf keine Rechtsberatung geben.** Dieser
> Entwurf ist kein geprüfter Vertragstext. Er leistet etwas anderes, und
> nur das: **er beschreibt das Produkt so, wie es wirklich gebaut ist.**
>
> Der Entwurf, der am 17.9. aus dem Betrieb kam, beschreibt an fünf
> Stellen ein anderes Produkt (siehe `docs/RECHT.md`, Abschnitt 2).
> Solche Stellen sind gefährlicher als eine unglückliche Formulierung:
> eine Zusage über eine Zahlungsart, die es nicht gibt, ist falsch, egal
> wie gut sie formuliert ist. **Die Formulierungen unten gehören zum
> Anwalt; die Sachangaben darin sind am Code nachprüfbar.**

---

## Was gegenüber dem Entwurf geändert wurde, und warum

| Stelle | Entwurf | Hier, weil so gebaut | Fundstelle |
|---|---|---|---|
| Zahlungsarten | PayPal, Überweisung, Rechnung | Stripe: Karte und SEPA-Lastschrift | `functions/index.js`, `stripeKasse` |
| Abo | „zunächst kein fortlaufendes Abo" | monatlich wiederkehrend, mit Testphase | `functions/index.js`, `aboUhr` |
| Preis | 59,00 € netto pauschal | Grundpreis + Aufschlag je weiterem Studio | `functions/index.js`, `preiseFuer` |
| Kündigung | Frist von einem Monat | zum Ende des bezahlten Zeitraums, Selbstbedienung | Stripe Billing Portal |
| Rechnungen | vom Anbieter | von Stripe erzeugt und zugestellt | Stripe |

---

## § 1 Geltungsbereich und Vertragspartner

(1) Diese Bedingungen gelten für die Überlassung der Software
**StudioChat** durch Semih Gedik, Kendenicherstraße 15, 50354 Hürth
(nachfolgend „Anbieter") an Unternehmen im Sinne von § 14 BGB
(nachfolgend „Kunde").

(2) **StudioChat richtet sich ausschließlich an Unternehmen.** Ein
Vertragsschluss mit Verbrauchern ist nicht vorgesehen.

> **Das ist eine Entscheidung, keine Formalie.** Sie erspart die
> Widerrufsbelehrung und die Verbraucherschlichtung — und sie muss dann
> auch durchgehalten werden: die Kasse darf keinem Verbraucher offen
> stehen. **NICHT GEPRÜFT:** ob die Kasse das heute wirklich verhindert.
> Sie fragt bisher nicht nach der Unternehmereigenschaft.

(3) Abweichende Bedingungen des Kunden gelten nur, soweit der Anbieter
ihnen schriftlich zustimmt.

---

## § 2 Gegenstand des Vertrags

(1) Der Anbieter stellt dem Kunden StudioChat als über das Internet
nutzbare Anwendung zur Verfügung (Software as a Service). Der Kunde
erhält keine Kopie der Software und kein Recht am Quellcode.

(2) Der Funktionsumfang ergibt sich aus der zum Zeitpunkt des
Vertragsschlusses gebuchten Stufe. Die Stufen heißen **Basic** und
**Premium**.

(3) Der Anbieter entwickelt die Anwendung fortlaufend weiter. Funktionen
können hinzukommen; eine Funktion, auf die der Kunde sich eingerichtet
hat, wird nicht ohne Vorankündigung entfernt.

(4) **Ein Verfügbarkeitsversprechen wird nicht abgegeben.** Die Anwendung
läuft auf Google Firebase; deren Verfügbarkeit liegt außerhalb des
Einflussbereichs des Anbieters.

> **Warum hier keine Zahl steht:** eine zugesagte Verfügbarkeit von
> 99,x % ist eine Zusage über einen fremden Dienst und ohne eigene
> Messung nicht belegbar. Es gibt in diesem System **keine
> Verfügbarkeitsmessung** — siehe `docs/BEKANNTE-PROBLEME.md`. Eine Zahl
> hier wäre erfunden.

---

## § 3 Zustandekommen des Vertrags

(1) Die Darstellung der Stufen ist kein bindendes Angebot.

(2) Der Vertrag kommt zustande, wenn der Kunde den Bezahlvorgang bei
Stripe abschließt und der Anbieter dies bestätigt.

(3) Vor dem Bezahlvorgang kann eine **Testphase** eingeräumt werden. Sie
endet automatisch; es entsteht daraus keine Zahlungspflicht, solange
kein Abo abgeschlossen wurde.

---

## § 4 Preise und Zahlung

(1) Der Preis richtet sich nach der Stufe und nach der **Zahl der
Studios**, die für den Kunden angelegt sind. Er setzt sich zusammen aus
einem Grundpreis und einem Aufschlag für jeden Standort ab dem zweiten.

(2) **Die zum Zeitpunkt des Vertragsschlusses geltenden Beträge werden
im Bezahlvorgang angezeigt, bevor der Kunde bestätigt.**

> **Das ist die wichtigste Zeile dieses Paragraphen, und sie ist
> absichtlich so gebaut.** Ein fester Betrag im Vertragstext und ein
> anderer in der Kasse ist der klassische Fehler; hier gilt, was der
> Kunde vor der Bestätigung sieht. Die Beträge stehen in Stripe (als
> Preis-Kennungen in `functions/.env`), nicht im Programmcode und nicht
> in diesem Text.
>
> **Vorschlag, noch nicht entschieden** (aus `docs/ABO-PLAN.md`):
>
> | | Basic | Premium |
> |---|---|---|
> | Grundpreis je Monat | 29 € | 49 € |
> | je weiterem Studio | 15 € | 25 € |
>
> **NICHT VERIFIZIERT:** ob diese Beträge marktgerecht sind. Es wurden
> keine Wettbewerbspreise erhoben.

(3) Alle Beträge verstehen sich **netto zuzüglich Umsatzsteuer**, soweit
diese anfällt.

> **UNKLAR und vom Kunden zu entscheiden:** der Anbieter ist derzeit als
> Einzelunternehmen ohne Umsatzsteuer-Identifikationsnummer geführt
> (`konfig.js`, `recht.ustId` ist leer). Ob die Kleinunternehmerregelung
> nach § 19 UStG greift, hängt am Umsatz — und der Entwurf geht von
> „unter ca. 1.000 € jährlich" aus, was beim ersten zahlenden Kunden mit
> mehreren Standorten nicht mehr stimmt. **Diese Zeile muss vor dem
> ersten Verkauf richtiggestellt werden**, und zwar in beide Richtungen:
> im Text hier und in den Stripe-Steuereinstellungen.

(4) Die Abrechnung erfolgt **monatlich im Voraus** über den
Zahlungsdienstleister Stripe. Zulässige Zahlungsarten sind **Zahlungskarte
und SEPA-Lastschrift**; welche davon angeboten werden, bestimmt Stripe
nach Land und Kundenart.

(5) **Rechnungen werden von Stripe erstellt und dem Kunden zugestellt.**
Der Anbieter erstellt keine eigenen Rechnungen.

(6) Ändert sich die Zahl der Studios, ändert sich der Preis ab der
nächsten Abrechnungsperiode entsprechend.

---

## § 5 Zahlungsverzug und Sperrung

(1) Kommt der Kunde mit einer Zahlung in Verzug, wird der Zugang in
Stufen eingeschränkt. Der Kunde wird vor jeder Stufe per E-Mail
benachrichtigt.

(2) Der Ablauf ist:

| Ab Tag | Was passiert |
|---|---|
| 0 | Hinweis in der Anwendung, E-Mail an die Geschäftsführung |
| 7 | erste Mahnung |
| 14 | zweite Mahnung |
| 21 | **Nur-Lesen**: alle Daten bleiben sichtbar, es kann nichts mehr eingetragen werden |
| 35 | **Gesperrt**: die Anwendung ist nicht mehr nutzbar |

(3) **Daten werden bei einer Sperrung nicht gelöscht.** Sie bleiben
erhalten und sind nach Zahlung sofort wieder verfügbar. Für die Löschung
nach Vertragsende gilt § 8.

> Die Stufen oben sind der im Programm hinterlegte Ablauf
> (`functions/index.js`, `LEITERN.lang`). Ein Vertragstext, der andere
> Fristen nennt als das Programm, hilft niemandem — **wenn der Anwalt
> andere Fristen für nötig hält, wird das Programm geändert, nicht nur
> der Text.**

(4) Der Zeitpunkt wird **jede Nacht neu berechnet** aus dem Tag, an dem
die erste Zahlung offen blieb. Es gibt keine Stufe, die
„weitergeschaltet" wird und stehenbleiben könnte.

---

## § 6 Laufzeit und Kündigung

(1) Der Vertrag läuft auf unbestimmte Zeit und verlängert sich
automatisch um jeweils einen Monat.

(2) **Der Kunde kann jederzeit selbst kündigen**, im Kundenportal von
Stripe, erreichbar aus der Anwendung heraus. Es ist kein Schreiben und
keine Frist nötig.

(3) Die Kündigung wirkt **zum Ende des bereits bezahlten Zeitraums.**
Bis dahin bleibt die Anwendung vollständig nutzbar; es wird nichts
anteilig erstattet und nichts nachberechnet.

(4) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt
beiden Seiten unberührt.

(5) Der Anbieter kann mit einer Frist von drei Monaten zum Monatsende
kündigen.

> **Hier weicht der gebaute Ablauf vom Entwurf zugunsten des Kunden ab**
> (der Entwurf sah einen Monat Frist vor). Das ist kein Versehen: bei
> einer Selbstbedienungskündigung im Portal gibt es keinen Ort, an dem
> eine zusätzliche Frist entstehen könnte, ohne dass man sie eigens
> einbaut.

---

## § 7 Pflichten des Kunden

(1) Der Kunde ist für die Konten seiner Beschäftigten verantwortlich:
für deren Anlage, für die Rechtevergabe und für die Löschung beim
Ausscheiden.

(2) **Der Kunde ist Verantwortlicher im Sinne der DSGVO**, der Anbieter
Auftragsverarbeiter. Der Abschluss eines Vertrags zur
Auftragsverarbeitung (Art. 28 DSGVO) ist Voraussetzung für die Nutzung;
der Entwurf liegt unter `docs/av/`.

(3) Der Kunde stellt sicher, dass der Einsatz in seinem Betrieb
arbeitsrechtlich zulässig ist — insbesondere, soweit ein Betriebsrat
besteht, die Mitbestimmung nach § 87 Abs. 1 Nr. 6 BetrVG.

> **Das betrifft vor allem die Zeiterfassung.** Wer Arbeitszeiten
> erfasst, führt eine technische Einrichtung ein, die zur
> Leistungskontrolle geeignet ist. Das ist mitbestimmungspflichtig, und
> zwar unabhängig davon, ob jemand sie tatsächlich zur Kontrolle nutzt.

(4) Der Kunde darf die Anwendung nicht Dritten außerhalb seines Betriebs
zugänglich machen.

---

## § 8 Daten nach Vertragsende

(1) Nach Ende des Vertrags bleiben die Daten des Kunden **30 Tage**
verfügbar. In dieser Zeit kann der Kunde einen Export verlangen.

(2) Danach werden sie gelöscht.

(3) Der Export steht dem Kunden jederzeit selbst zur Verfügung:
Verwaltung → System → **„Alles als Excel speichern"** bzw. **„Alles als
Daten-Datei (JSON)"**. Beide Dateien enthalten dieselben Daten.

> **Was der Export enthält** — die Datei sagt es selbst, in einem
> Verzeichnis ganz oben: Aufgaben, Material, Putzplan mit Notizen,
> Team, Infos, Chat der öffentlichen Kanäle, Geräte mit Verlauf,
> Schichten, Abwesenheiten, Übergaben, Schwarzes Brett, Dokumente
> (Angaben, ohne Dateiinhalt), Nachweise, **Stempelzeiten**,
> **Anliegen mit Antwort** und **Probetrainings**.
>
> **Was er bewusst NICHT enthält:** Direktnachrichten (die gehören zwei
> Personen, nicht dem Betrieb), den persönlichen Bereich jedes
> Einzelnen, die Inhalte hochgeladener Dateien, Stempel-PINs und
> Terminal-Codes sowie Fehlerberichte und Push-Kennungen.
>
> **Die drei fett gesetzten Bereiche kamen am 21.9.2026 dazu.** Bis
> dahin fehlten sie — ausgerechnet die mit Personenbezug. Eine Zusage
> „Sie können einen Export verlangen" ist ohne die Arbeitszeiten nicht
> eingelöst. Nachgemessen in `tests/test-sicherung-inhalt.js`,
> einschliesslich der Gegenprobe, dass **kein Geheimnis** in der Datei
> landet.

(4) **Die Inhalte hochgeladener Dateien sind im Export nicht enthalten.**
Der Kunde kann sie einzeln über die Anwendung herunterladen.

> **NICHT GEBAUT, und das gehört hier gesagt:** es gibt **keinen
> automatischen Ablauf, der nach 30 Tagen löscht** — das wäre beim
> heutigen Stand Handarbeit des Anbieters. Und es gibt **keinen
> Sammel-Download der Dateiinhalte**.
>
> **Bevor dieser Paragraph in einen unterschriebenen Vertrag geht, muss
> für beides entweder die Funktion gebaut oder der Text geändert
> werden** — eine zugesagte Löschfrist ohne Mechanismus ist eine
> Zusage, die niemand einhält. Siehe `docs/av/LOESCHKONZEPT.md`.

---

## § 9 Haftung

(1) Der Anbieter haftet unbeschränkt bei Vorsatz und grober
Fahrlässigkeit sowie bei Verletzung von Leben, Körper und Gesundheit.

(2) Bei einfacher Fahrlässigkeit haftet der Anbieter nur bei Verletzung
einer wesentlichen Vertragspflicht und der Höhe nach begrenzt auf den
vertragstypischen, vorhersehbaren Schaden.

(3) Die Haftung nach dem Produkthaftungsgesetz bleibt unberührt.

> **Diese drei Absätze sind Standard und gehören trotzdem geprüft.**
> Eine Haftungsbeschränkung, die zu weit geht, ist im Zweifel ganz
> unwirksam — dann haftet man mehr als ohne Klausel.

---

## § 10 Änderungen dieser Bedingungen

(1) Der Anbieter kann diese Bedingungen mit einer Frist von sechs Wochen
zum Monatsende ändern. Die Änderung wird dem Kunden in Textform
mitgeteilt.

(2) Widerspricht der Kunde nicht bis zum Wirksamwerden, gilt die
Änderung als angenommen. Auf diese Wirkung wird in der Mitteilung
gesondert hingewiesen.

(3) Widerspricht der Kunde, kann jede Seite zum Wirksamwerden kündigen.

---

## § 11 Schlussbestimmungen

(1) Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts.

(2) Gerichtsstand ist der Sitz des Anbieters, soweit der Kunde Kaufmann,
juristische Person des öffentlichen Rechts oder öffentlich-rechtliches
Sondervermögen ist.

(3) Sollte eine Bestimmung unwirksam sein, bleibt der Vertrag im Übrigen
wirksam.

---

## Was vor dem ersten Verkauf noch entschieden werden muss

Nicht Formulierungen — **Sachfragen, an denen etwas hängt:**

| | Wer entscheidet |
|---|---|
| Die tatsächlichen Beträge, und ob netto oder brutto | Betrieb |
| Umsatzsteuer: § 19 UStG oder nicht | Betrieb, mit Steuerberater |
| Ob § 8 so zugesagt wird: der **Export ist gebaut**, die **automatische Löschung nach 30 Tagen nicht** und ein Sammel-Download der Dateiinhalte auch nicht | Betrieb, dann ich |
| Ob die Kasse die Unternehmereigenschaft abfragen soll | Betrieb, dann ich |
| Ob die Mahnstufen aus § 5 rechtlich tragen | Anwalt |
| Ob die Haftungsklausel trägt | Anwalt |
