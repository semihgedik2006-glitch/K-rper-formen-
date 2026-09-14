# Löschkonzept

Anlage 3 zum Auftragsverarbeitungsvertrag · Stand 14. September 2026

Was wann verschwindet — und was ausdrücklich **nicht** verschwindet.
Jede Zeile hat eine Fundstelle im Code.

---

## 1. Automatische Löschläufe

Diese laufen ohne Zutun, täglich, als geplante Cloud Functions.

| Was | Frist | Wann | Fundstelle |
|---|---|---|---|
| Papierkorb (gelöschte Aufgaben, Dokumente, Nachrichten) | **30 Tage** | täglich 03:30 | `purgeTrash` |
| Einmalige Putzaufgaben nach dem Abhaken | **24 Stunden** | täglich 03:15 | `purgeOneOffCleaning` |
| Vollsicherung der Datenbank | **7 Tage** | täglich 02:40 | `dailyBackup`, `BACKUP_TAGE = 7` |
| Wochensicherungen Material | **52 Wochen** | wöchentlich | `archives` |
| Übergaben im Blick der Startseite | **24 Stunden** sichtbar | — | Anzeigefenster, kein Löschen |

> **Beim Papierkorb ist eine Besonderheit zu kennen:** Bei gelöschten
> Dokumenten liegt der Dateiinhalt in einem zweiten Datensatz. Der Lauf
> löscht **beide** — der Verweis allein würde sonst verschwinden und der
> Inhalt bliebe liegen. Genau das war einmal der Fall und ist behoben.

---

## 2. Löschung auf Verlangen — Art. 17 DSGVO

### 2.1 Was der Kunde selbst kann

**Zugang entfernen** (Verwaltung → Team → Zugang entfernen). Das ruft
`zugangEntfernen` auf dem Server auf und löscht:

* das **Anmeldekonto** bei Firebase Authentication — die E-Mail-Adresse
  ist danach wieder frei,
* das **Profil** mit Name, Rolle, Studios, Symbol, Farbe, Geburtstag,
  Zeitpunkt der letzten Anmeldung.

Die Reihenfolge ist mit Absicht so: erst das Konto, dann das Profil.
Andersherum bliebe bei einem Fehler in der Mitte ein Konto ohne Profil
zurück — anmelden ginge weiter, die Adresse bliebe belegt, und niemand
sähe es.

### 2.2 Was dabei **stehen bleibt**

**Das ist der wichtigste Absatz dieses Dokuments.**

| Bleibt | Warum |
|---|---|
| Chatnachrichten der Person | Ein Verlauf, aus dem einzelne Beiträge verschwinden, ist als Verlauf wertlos |
| Wer welche Aufgabe abgehakt hat | Nachweis über erledigte Arbeit; `doneByUid` bleibt |
| Übergaben | Eine Übergabe ohne Absender ist keine Übergabe |
| Gerätemeldungen | Wartungshistorie je Gerät |
| Vergangene Schichten | Betriebliche Aufzeichnung |

Der Name bleibt in diesen Einträgen sichtbar, weil er dort mitgeschrieben
wurde.

> **Das muss der Verantwortliche wissen und seinem Team sagen.**
> „Zugang entfernt" heißt nicht „alle Daten gelöscht". Ob das zulässig
> ist, hängt von der Rechtsgrundlage ab, auf die sich der Kunde stützt
> (berechtigtes Interesse, Aufbewahrungspflichten) — das ist seine
> Abwägung und keine technische Frage.
>
> Eine vollständige Löschung **aller** Spuren einer Person gibt es
> heute nicht als Funktion. Sie wäre baubar, hätte aber den oben
> genannten Preis. Ohne eine ausdrückliche Entscheidung des Kunden
> wäre es falsch, sie stillschweigend zu bauen.

### 2.3 Persönlicher Bereich

Eigene Notizen, Termine, To-dos, Ziele und Wünsche liegen unter
`privat/<uid>/`. Sie sind besitzergebunden — niemand sonst kann sie
lesen — und werden mit dem Profil gelöscht.

Was jemand ausdrücklich **abgeschickt** hat (ein Wunsch an die Leitung,
ein Anliegen an die Geschäftsführung), liegt in einer eigenen Sammlung
und bleibt wie andere Arbeitsinhalte stehen.

### 2.4 Ende des Vertrages

Bei Beendigung löscht der Auftragsverarbeiter auf Weisung sämtliche
Daten des Verantwortlichen. Dafür gibt es serverseitige Funktionen:
`firmaSperren` (stilllegen, Daten bleiben) und `firmaLoeschen`
(entfernen, mit Archivierung der Stammdaten in `firmenArchiv`).

**Zu klären, bevor der erste Kunde geht:** ob `firmaLoeschen` die
Sicherungen mit erfasst. Die liegen nach Datum geordnet in Cloud Storage
und verfallen nach sieben Tagen von selbst — eine vollständige Löschung
ist also spätestens nach einer Woche erreicht, aber nicht sofort. Das
gehört so in den Vertrag und nicht als „unverzüglich".

---

## 3. Auskunft — Art. 15 DSGVO

**Es gibt dafür keine Funktion.**

Verlangt eine Beschäftigte beim Kunden Auskunft über alle zu ihr
gespeicherten Daten, muss heute jemand mit Zugang zur Datenbank
nachsehen und zusammenstellen. Die Daten liegen über mehrere Sammlungen
verteilt (Profil, Nachrichten, Aufgaben, Schichten, Abwesenheiten,
Nachweise, persönlicher Bereich).

Was die Person **selbst** sieht: ihr Profil, ihre Nachweise, ihre
Schichten, ihre Aufgaben und ihren gesamten persönlichen Bereich. Das
ist keine Auskunft nach Art. 15, aber es deckt einen Teil ab.

> Eine Zusage „auf Knopfdruck" wäre an dieser Stelle falsch. Im Vertrag
> steht deshalb eine Zusage über einen **Vorgang** und eine Frist, nicht
> über eine Funktion. Die Funktion steht auf der Liste
> (`docs/VERKAUF.md`, A5) und ist überschaubar — bis dahin ist es
> Handarbeit, und das ist auch so vereinbart.

---

## 4. Was gespeichert wird — vollständige Liste

Grundlage für Auskunft und Löschung. Am Programm nachprüfbar.

**Zum Konto:** Name · E-Mail-Adresse · Rolle · zugeordnete Studios ·
Profilbild oder Symbol · Farbe · Geburtstag (freiwillig) · Zeitpunkt der
letzten Anmeldung · Firmenzugehörigkeit · Aktiv-Kennzeichen.

**Aus der Arbeit:** Chatnachrichten mit Text, Fotos und Sprachaufnahmen ·
Direktnachrichten · Aufgaben samt Abhaker und Zeitpunkt · Putzplan und
Notizen · Materialbestände · Gerätemeldungen mit Fotos ·
Schichten · **Urlaub und Krankmeldungen** · Übergaben · Schwarzes Brett ·
Qualifikationsnachweise mit Ablaufdatum · Dokumente · Probetrainings
(Zahlen und Namen des eigenen Teams, **keine Kundennamen**) · Umfragen
und Reaktionen.

**Persönlich, für andere nicht lesbar:** eigene To-dos, Notizen,
Termine, Ziele, Wünsche.

**Technisch:** ein Gerätekennzeichen für Push-Nachrichten, nur wenn
eingeschaltet · ein Geheimnis je Person für den Kalender-Abo-Link ·
anonyme Nutzungszahlen je Tag (**ohne Konto, ohne Namen, ohne
Uhrzeit** — bewusst kein Protokoll je Person).

**Von Endkundinnen des Verantwortlichen:** Name, E-Mail-Adresse und
Termin, sofern die Terminfunktion genutzt wird.

---

## 5. Besondere Kategorien — Art. 9 DSGVO

**Krankmeldungen.** Die App speichert, wer wann krank war. Das sind
Gesundheitsdaten und die empfindlichste Kategorie im System. Sie sind
über die Regeln auf den Kreis beschränkt, der sie ohnehin sieht
(Betroffene, Leitung des Studios, Geschäftsführung) — aber sie sind da,
und der Vertrag muss sie ausdrücklich nennen.

**Sprachaufnahmen im Chat — eine Korrektur.** In `docs/RECHT.md` stand
bisher „Stimme ist ein biometrisches Merkmal". Das ist zu pauschal:
Art. 4 Nr. 14 DSGVO verlangt eine **spezifische technische
Verarbeitung**, die die eindeutige Identifizierung ermöglicht. Die App
nimmt auf und gibt wieder — sie erkennt niemanden an der Stimme. Eine
Sprachnachricht ist damit personenbezogenes Datum, aber nach meiner
Lesart nicht Art. 9.

> Diese Einordnung sollte ein Anwalt bestätigen. Ich nenne sie, weil die
> pauschale Fassung den Kunden zu einer Einwilligungslösung drängen
> würde, die er vielleicht gar nicht braucht — und eine unnötige
> Einwilligung ist auch ein Fehler.

**Anwesenheitsanzeige.** Die App speichert, wann jemand zuletzt online
war. Wer das als Verhaltenskontrolle liest, liegt nicht ganz falsch.
Kein Art. 9, aber ein Punkt für die Absprache mit dem Team.

---

## 6. Was die App bewusst NICHT speichert

Gehört in ein Löschkonzept, weil es die Fragen vorwegnimmt, die sonst
kommen:

* **Kein Protokoll je Person**, wer die App wann benutzt hat. Die
  Nutzungszahlen der Werkbank sind anonym: pro Tag, wie oft die App
  aufging und welche Seiten — ohne Konto, ohne Namen, ohne Uhrzeit. Die
  Sicherheitsregel hält das fest, nicht nur der Code.
* **Keine Standortdaten.** `Permissions-Policy: geolocation=()` sperrt
  es auf Ebene des Browsers.
* **Keine Kundennamen bei Probetrainings** — nur Zahlen und die Namen
  des eigenen Teams. Ein Durchlauf prüft es bei jedem Lauf mit
  (`tests/test-probetraining.js`).
* **Keine Zeiterfassung.** Der Schichtplan ist ein Plan, keine
  Stechuhr. Wer daraus Arbeitszeiten ableitet, leitet aus einer
  Absichtserklärung ab.
