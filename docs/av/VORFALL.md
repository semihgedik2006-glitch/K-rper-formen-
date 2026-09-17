# Verfahren bei Datenschutzvorfällen (Art. 33, 34 DSGVO)

Anlage 5 zum Auftragsverarbeitungsvertrag · Stand 17. September 2026

**Wofür das hier ist.** Art. 33 Abs. 2 DSGVO verpflichtet den
Auftragsverarbeiter, den Verantwortlichen nach Bekanntwerden einer
Verletzung des Schutzes personenbezogener Daten **unverzüglich** zu
informieren. Der Verantwortliche — also der Kunde — hat dann **72
Stunden**, um die Aufsichtsbehörde zu benachrichtigen (Art. 33 Abs. 1).

Die 72 Stunden laufen für den Kunden. Sie beginnen, wenn *ihm* der
Vorfall bekannt wird — und das hängt davon ab, wie schnell ich ihn
erreiche. **Das ist der Grund, warum dieses Blatt existiert: nicht die
Meldung ist das Schwierige, sondern sie unter Zeitdruck zum ersten Mal
zu erfinden.**

> **Ich bin kein Anwalt.** Dieses Blatt beschreibt einen Ablauf und
> stellt Vorlagen bereit. Ob im konkreten Fall eine meldepflichtige
> Verletzung vorliegt, ist eine Rechtsfrage. Im Zweifel wird gemeldet:
> eine Meldung zu viel kostet Zeit, eine Meldung zu wenig kostet mehr.

---

## 1. Wer zuständig ist

| | |
|---|---|
| **Verantwortlich für Meldungen** | Semih Gedik, Kendenicherstraße 15, 50354 Hürth |
| **Erreichbar unter** | S.gedik@kformen.com |
| **Vertretung** | *offen — siehe Abschnitt 7* |

Ein Einzelunternehmen hat keine Meldekette. Das ist ehrlicher, als eine
zu behaupten, und es hat eine Folge, die in Abschnitt 7 steht.

---

## 2. Was ein meldepflichtiger Vorfall ist

Art. 4 Nr. 12 DSGVO: eine Verletzung der Sicherheit, die zur
**Vernichtung, zum Verlust, zur Veränderung oder zur unbefugten
Offenlegung** von personenbezogenen Daten führt — ob versehentlich oder
absichtlich.

Für dieses System heißt das konkret:

| Beispiel | Vorfall? |
|---|---|
| Eine Sicherheitsregel gibt Daten eines anderen Betriebs frei | **Ja**, und schwer |
| Ein Konto wird übernommen (Passwort erraten, Gerät verloren) | **Ja** |
| Krankmeldungen sind für Beschäftigte anderer Studios lesbar | **Ja** — Art.-9-Daten |
| Eine Sicherung liegt an einer Stelle, die zu weit offen ist | **Ja** |
| Ein Chatbild wird versehentlich an den falschen Kanal gesendet | **Nein**, aber im Betrieb zu klären |
| Die App ist zwei Stunden nicht erreichbar | **Ja**, wenn Daten dabei verloren gehen; sonst nein |
| Ein Fehler löscht Aufgaben, die nicht wiederherstellbar sind | **Ja** (Verlust) |

**Auch ein Vorfall, der nur *möglicherweise* Daten betrifft, wird
behandelt wie einer.** Die Einschätzung kommt später; die Uhr läuft ab
der Kenntnis.

---

## 3. Der Ablauf, in dieser Reihenfolge

### Schritt 1 — Stoppen (sofort)

Zuerst das Leck schließen, nicht untersuchen. Die schnellsten Mittel:

| Lage | Mittel |
|---|---|
| Eine Regel gibt zu viel frei | `firestore.rules` ändern und ausrollen: `firebase deploy --only firestore:rules` |
| Ein Konto ist übernommen | Firebase-Konsole → Authentication → Konto deaktivieren |
| Die ganze App muss stillstehen | Firebase-Konsole → Hosting → Version zurückrollen (siehe `docs/DEPLOY.md`) |
| Eine Cloud Function macht Schaden | Firebase-Konsole → Functions → Funktion löschen |

**Nichts wegräumen, was als Beleg dient.** Protokolle nicht löschen,
keine Daten „bereinigen". Was geändert werden muss, wird vorher
gesichert.

### Schritt 2 — Feststellen (innerhalb einer Stunde)

Vier Fragen, schriftlich beantwortet — auch wenn die Antwort „unbekannt"
lautet:

1. **Was ist passiert?** Ein Satz.
2. **Welche Daten, wessen Daten, wie viele?**
3. **Seit wann, bis wann?**
4. **Wer hat tatsächlich zugegriffen — und ist das belegbar?**

Belege: Firebase-Konsole → Firestore → Nutzung; Google Cloud →
Logging; für die App selbst die Sammlung `fehler` (siehe
`docs/DATENBANK.md`).

> **„Unbekannt" ist eine zulässige Antwort und eine schlechte
> Grundlage.** Wo sie steht, wird im Zweifel zum Nachteil des Betroffenen
> eingeschätzt, nicht zum eigenen Vorteil.

### Schritt 3 — Kunden benachrichtigen (unverzüglich, spätestens 24 Stunden)

Betroffen ist, wessen Daten im Spiel sind. Bei einem Fehler in der
gemeinsamen Codebasis sind das **alle Kunden**, nicht nur der, bei dem
es aufgefallen ist.

Adressen: das Feld `email` in `firmen/<kennung>` (Betreiberansicht →
Firmen). Jede Firma hat mindestens eine Geschäftsführung; deren Adressen
stehen in `users`.

Vorlage: Abschnitt 4.

**24 Stunden ist meine eigene Zusage, nicht das Gesetz.** Das Gesetz
sagt „unverzüglich". Eine Zahl ist überprüfbar, „unverzüglich" nicht —
und der Kunde braucht Vorlauf innerhalb seiner 72 Stunden.

### Schritt 4 — Dokumentieren (immer, auch ohne Meldung)

Art. 33 Abs. 5: **jeder** Vorfall wird dokumentiert, auch der, der nicht
gemeldet wird. Die Dokumentation ist der Nachweis, dass die
Entscheidung gegen eine Meldung eine Entscheidung war.

**Ort:** `docs/av/vorfaelle/JJJJ-MM-TT-kurzname.md` in diesem
Repository — *sofern der Vorfall keine personenbezogenen Daten in den
Text zwingt.* **Das Repository ist öffentlich.** Wo Namen, Adressen
oder Inhalte nötig sind, gehört die Akte nicht hierher, sondern in eine
Ablage des Betriebs; hier steht dann nur ein Verweis mit Datum,
Kurzname und Ergebnis.

Vorlage: Abschnitt 5.

### Schritt 5 — Betroffene benachrichtigen (Art. 34)

Das ist **Sache des Kunden**, nicht meine: er ist der Verantwortliche
gegenüber seinen Beschäftigten. Meine Aufgabe ist, ihm dafür alles zu
liefern, was er braucht — insbesondere eine belastbare Aussage darüber,
wessen Daten betroffen sind.

Art. 34 verlangt die Benachrichtigung bei **hohem Risiko**. Bei
Gesundheitsdaten (Krankmeldungen) ist davon im Zweifel auszugehen.

### Schritt 6 — Abstellen und nachprüfen

Erst wenn die Meldungen draußen sind: die Ursache beseitigen und **einen
Durchlauf schreiben, der genau diesen Fall festhält.** Ein behobener
Fehler ohne Durchlauf kommt wieder — das ist in diesem Projekt die
Hausregel und hier hat sie einen zusätzlichen Grund: der Durchlauf ist
der Beleg gegenüber der Aufsichtsbehörde, dass die Maßnahme wirkt.

---

## 4. Vorlage: Meldung an den Kunden

> **Betreff:** Sicherheitsvorfall in StudioChat — Ihre Meldefrist nach
> Art. 33 DSGVO läuft
>
> Sehr geehrte Damen und Herren,
>
> als Ihr Auftragsverarbeiter informiere ich Sie nach Art. 33 Abs. 2
> DSGVO über eine Verletzung des Schutzes personenbezogener Daten.
>
> **1. Was geschehen ist**
> *(ein bis drei Sätze, ohne Beschönigung)*
>
> **2. Wann es geschehen ist und wann es mir bekannt wurde**
> Zeitraum des Vorfalls: …
> Mir bekannt geworden am: … um … Uhr
>
> **3. Welche Daten betroffen sind**
> Kategorien: …
> Betroffene Personen: … *(Zahl oder Schätzung mit Begründung)*
>
> **4. Welche Folgen wahrscheinlich sind**
> …
>
> **5. Was ich bereits getan habe**
> …
>
> **6. Was noch offen ist**
> …
>
> **Ihre Frist:** Sie haben nach Art. 33 Abs. 1 DSGVO **72 Stunden ab
> Ihrer Kenntnis**, um Ihre Aufsichtsbehörde zu benachrichtigen. Für
> Nordrhein-Westfalen ist das die Landesbeauftragte für Datenschutz und
> Informationsfreiheit NRW. Ob eine Meldung erforderlich ist,
> entscheiden Sie als Verantwortlicher; ich stelle Ihnen dafür jede
> Auskunft zur Verfügung.
>
> Für Rückfragen bin ich unter S.gedik@kformen.com und jederzeit
> telefonisch erreichbar.
>
> Semih Gedik

---

## 5. Vorlage: Akte

```
# Vorfall JJJJ-MM-TT — <Kurzname>

Bekannt geworden:   JJJJ-MM-TT HH:MM   durch <wen/was>
Zeitraum:           JJJJ-MM-TT HH:MM bis JJJJ-MM-TT HH:MM
Eingestuft als:     meldepflichtig / nicht meldepflichtig
Begründung:

## Was passiert ist

## Welche Daten betroffen waren
Kategorien:
Personen (Zahl oder Schätzung):
Art.-9-Daten betroffen:   ja / nein

## Was sofort getan wurde
HH:MM
HH:MM

## Wer wann benachrichtigt wurde
Kunden:              JJJJ-MM-TT HH:MM
Aufsichtsbehörde:    durch den Kunden / nicht erforderlich
Betroffene:          durch den Kunden / nicht erforderlich

## Ursache

## Was dagegen getan wurde
Änderung:
Durchlauf, der es festhält:

## Was daraus gelernt wurde
```

---

## 6. Wo die Aufsichtsbehörde sitzt

Zuständig ist die Behörde des **Verantwortlichen**, also des Kunden —
nach dessen Sitz. Für einen Betrieb in Nordrhein-Westfalen ist das die
Landesbeauftragte für Datenschutz und Informationsfreiheit
Nordrhein-Westfalen.

**NICHT VERIFIZIERT:** Anschrift, Telefonnummer und das Online-Formular
der Behörde stehen hier bewusst nicht. Sie ändern sich, und eine
veraltete Adresse in einer Notfallvorlage ist schlimmer als keine. Vor
dem ersten Ernstfall einmal nachschlagen und hier eintragen —
zusammen mit dem Anwalt, der die AV-Unterlagen durchsieht.

---

## 7. Was an diesem Verfahren offen ist

**Es gibt keine Vertretung.** Fällt die eine zuständige Person aus —
Urlaub ohne Empfang, Krankheit, Unfall —, läuft die Frist des Kunden
weiter und niemand meldet. Das ist die eigentliche Schwachstelle dieses
Blatts, und sie lässt sich nicht durch Formulierung beheben.

Drei mögliche Antworten, keine davon umgesetzt:

1. Eine zweite Person benennen, die Zugang zur Firebase-Konsole und zu
   den Kundenadressen hat.
2. Eine automatische Meldung einrichten, die bei bestimmten Ereignissen
   an alle Kunden geht. Technisch machbar, aber eine Fehlmeldung an alle
   Kunden ist selbst ein Schaden.
3. Den Kunden im AV-Vertrag sagen, dass es keine Vertretung gibt. Ehrlich
   und ein Verkaufshindernis.

**Das gehört auf die Liste der Fragen an den Anwalt**, zusammen mit den
Punkten aus `docs/RECHT.md`.

Ebenfalls offen:

* **Der Meldeweg ist eine E-Mail-Adresse.** Ist das Postfach Teil des
  Vorfalls, gibt es keinen zweiten Weg.
* **Es hat noch nie einen Vorfall gegeben**, an dem dieser Ablauf geprüft
  worden wäre. Ein Verfahren, das nie gelaufen ist, ist eine Annahme.
  Ein Trockenlauf — einen erfundenen Vorfall einmal durch alle sechs
  Schritte führen — dauert eine Stunde und wäre die erste Prüfung.
