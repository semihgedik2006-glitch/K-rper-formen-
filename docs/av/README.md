# Unterlagen für die Auftragsverarbeitung

Stand 14. September 2026.

**Wofür das hier ist.** Wer eine Personal-App an ein anderes Unternehmen
verkauft, ist **Auftragsverarbeiter** im Sinne der DSGVO. Der Kunde muss
einen Vertrag nach Art. 28 mit dir schließen, sonst darf er die App
rechtlich nicht einsetzen. Ohne dieses Papier kommt kein seriöser
Abschluss zustande — das ist keine Formalie, sondern die Stelle, an der
ein Verkaufsgespräch endet.

---

## Was hier liegt

| Datei | Was es ist | Wer es braucht |
|---|---|---|
| `AV-VERTRAG-ENTWURF.md` | Der Vertrag selbst, Art. 28 Abs. 3 | Kunde unterschreibt, du unterschreibst |
| `TOM.md` | Technische und organisatorische Maßnahmen, Art. 32 | Anlage zum Vertrag |
| `UNTERAUFTRAGNEHMER.md` | Wen du einschaltest | Anlage zum Vertrag |
| `LOESCHKONZEPT.md` | Was wann verschwindet | Anlage, und für Art. 17 |
| `VERARBEITUNGSVERZEICHNIS.md` | Art. 30 Abs. 2 — dein eigenes | brauchst **du**, nicht der Kunde |

---

## Der Satz, der über allem steht

**Ich bin kein Anwalt und darf keine Rechtsberatung geben.**

Was ich leisten kann, ist die Hälfte, die sonst am längsten dauert und am
schlechtesten gemacht wird: **die technische Seite präzise und
nachprüfbar beschreiben.** Jede Angabe in `TOM.md` und
`LOESCHKONZEPT.md` hat eine Fundstelle im Code. Wo etwas fehlt, steht
das dort als Lücke und nicht als Beschönigung.

Was ich **nicht** leisten kann:

* ob die Formulierungen im Streitfall tragen,
* ob dein konkreter Einsatz zulässig ist,
* ob eine Maßnahme „angemessen" im Sinne von Art. 32 ist — das ist eine
  Abwägung und keine Messung.

Eine anwaltliche Durchsicht dieser Entwürfe ist deutlich billiger als
eine Erstellung von null. Genau dafür sind sie gemacht.

---

## Drei Dinge, die du vor dem ersten Kundengespräch wissen solltest

### 1. Krankmeldungen sind Gesundheitsdaten

Die App speichert, wer wann krank war. Das ist Art. 9 DSGVO, die
empfindlichste Kategorie im ganzen System. Der AV-Vertrag muss das
ausdrücklich abdecken, und der Kunde braucht dafür eine Rechtsgrundlage
im Arbeitsverhältnis — die liefert nicht die App, sondern er.

### 2. Auskunft nach Art. 15 gibt es noch nicht

Verlangt eine Beschäftigte beim Kunden alle Daten über sich, muss heute
jemand von Hand in der Datenbank nachsehen. Es gibt keinen Knopf dafür.
Das steht so in `LOESCHKONZEPT.md`, und es steht auch im Vertragsentwurf
— eine Zusage, die die Technik nicht einhält, ist schlimmer als keine.

Als Funktion ist das überschaubar (`docs/VERKAUF.md`, Punkt A5). Solange
sie fehlt, ist es eine Zusage über einen **Vorgang**, nicht über einen
Knopf: du machst es von Hand, innerhalb der Frist.

### 3. Beim Entfernen eines Zugangs bleiben die Nachrichten stehen

`zugangEntfernen` löscht das Anmeldekonto und das Profil. Was die Person
geschrieben hat — Chatnachrichten, abgehakte Aufgaben, Übergaben —
bleibt. Das ist bewusst so: eine Übergabe, aus der nachträglich der
Absender verschwindet, ist keine Übergabe mehr.

Aber es **muss im Vertrag stehen**, und der Kunde muss es seinem Team
sagen. Stillschweigend ist es der Unterschied zwischen „gelöscht" und
„gelöscht, außer".

---

## Was du noch selbst eintragen musst

In `UNTERAUFTRAGNEHMER.md` stehen zwei Lücken, die ich nicht füllen kann:

* **Der Mailversand.** `functions/index.js` nimmt Zugangsdaten aus
  `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS`. Welcher Anbieter das ist, weiß
  nur du — und genau der gehört in die Liste.
* **Deine eigene Firmierung und Anschrift** als Auftragsverarbeiter.

Beides ist im Text als `[…]` markiert.

---

## Reihenfolge, die ich vorschlagen würde

1. `TOM.md` und `LOESCHKONZEPT.md` lesen — dort steht, was die App
   wirklich tut. Wenn dir darin etwas nicht gefällt, ist es leichter
   geändert als erklärt.
2. Die zwei Lücken in `UNTERAUFTRAGNEHMER.md` füllen.
3. Alles zusammen zu einem Anwalt. Eine Durchsicht, keine Erstellung.
4. Erst danach den Entwurf einem Kunden vorlegen.

Was **nicht** funktioniert: den Entwurf ungeprüft verschicken. Ein AV-
Vertrag ist das erste Papier, das die Rechtsabteilung eines Kunden liest
— und das erste, an dem sie beurteilt, wie ernst der Rest gemeint ist.
