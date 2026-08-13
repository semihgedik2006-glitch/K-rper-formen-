# Was fehlt, damit StudioChat verkaufbar ist

Stand: 7. August 2026.

Der Plan ist bewusst zweigeteilt: **Teil A kostet nichts** und lässt sich
sofort machen. **Teil B kostet Geld** und kann warten, bis ein Kunde
konkret ist. Nichts in Teil A verbaut etwas aus Teil B — die Reihenfolge
geht auf.

Eine Sache vorweg, weil sie die Erwartung setzt: **das Hindernis ist nicht
der Code.** Technisch ist StudioChat weiter als die meisten Werkzeuge, die
in dieser Preisklasse verkauft werden. Was fehlt, ist der rechtliche
Rahmen — und den kann ich vorbereiten, aber nicht abschließend klären.

---

## Die eine Entscheidung, die alles andere bestimmt

Bevor irgendetwas gebaut wird: **ein Firebase-Projekt je Kunde** oder
**ein Projekt für alle Kunden** (Mandantenfähigkeit)?

| | Ein Projekt je Kunde | Ein Projekt für alle |
|---|---|---|
| Umbau am Code | klein (Konfiguration herauslösen) | groß (jede Abfrage, jede Regel, jede Cloud Function) |
| Daten der Kunden | physisch getrennt | logisch getrennt, eine Regel-Lücke reicht |
| Im Verkaufsgespräch | „Ihre Daten liegen in Ihrem eigenen Projekt" | erklärungsbedürftig |
| Neuer Kunde | rund eine Stunde Einrichtung | ein Formular |
| Ab wie vielen Kunden mühsam? | etwa ab 10 | nie |
| Kostenloses Kontingent | **je Kunde einmal** | einmal für alle zusammen |

**Meine Empfehlung: ein Projekt je Kunde**, bis der fünfte oder sechste
Kunde da ist.

> ### ⚠️ Korrektur vom 10. August 2026
>
> Hier stand: *„Das kostenlose Kontingent gilt pro Projekt … der dritte
> Kunde bringt dich in die Abrechnung."* Das war **vor** dem Lasttest
> geschrieben, also ohne Messwerte.
>
> Jetzt gibt es welche: ein App-Start liest 380 Dokumente beim
> Mitarbeiter und 1.110 beim Chef, eine Firma mit 57 Konten kommt auf
> rund 153.000 Lesevorgänge am Tag. Das Freikontingent von 50.000
> Lesevorgängen ist damit **0,83 € im Monat je Kunde** wert — bei zehn
> Kunden macht der ganze Unterschied 7,50 € aus.
>
> **Das Kostenargument trägt die Entscheidung nicht.** Was bleibt, sind
> Datentrennung und Umbauaufwand. Beides zugunsten getrennter Projekte,
> aber aus anderen Gründen als hier ursprünglich behauptet.
>
> Der vollständige Plan für den anderen Weg steht in `MANDANT-PLAN.md`.

Der Umbau auf Mandantenfähigkeit bleibt jederzeit möglich. Er wird durch
diesen Weg nicht teurer. Wie er im Einzelnen abliefe — vier Rollenebenen
mit einem Admin über allen Firmen, Datenmodell, Regeln, Umzugsweg,
Risiken — steht in **`MANDANT-PLAN.md`**.

---

# Teil A — kostet nichts

## A1. Konfiguration aus dem Code lösen

Heute stehen die Dinge, die sich je Kunde unterscheiden, verstreut in den
Dateien:

| Was | Wo es heute steht |
|---|---|
| Liste der Studios | `index.html`, `STUDIOS` (Zeile ~2780) |
| Chef-Code | `index.html`, `CHEF_PIN` |
| Firebase-Zugang | `index.html` und `sw.js` — **an zwei Stellen** |
| Push-Schlüssel | `index.html`, `VAPID_KEY` |
| Projektname beim Deploy | `.github/workflows/deploy-functions.yml`, dreimal |
| Name „Körperformen" | an zwölf Stellen im Text |

Für einen zweiten Kunden müsste man das alles suchen und ändern — und die
doppelte Firebase-Angabe in `index.html` und `sw.js` wird garantiert einmal
vergessen. Das ist genau die Art Fehler, die erst beim Kunden auffällt.

**Was zu tun ist:** eine einzige Datei `konfig.js` mit Studios, Firmenname,
Firebase-Zugang, Push-Schlüssel und Farben. `index.html` und `sw.js` lesen
daraus. Danach ist ein neuer Kunde: Datei kopieren, sechs Werte eintragen,
fertig.

**Aufwand:** überschaubar. **Kosten:** keine.
**Wichtig:** die Reihenfolge in `STUDIOS` darf sich nie ändern — die
Datenbank-Kennungen hängen am Listenplatz. Das gilt dann je Kunde.

## A2. Den Chef-Code aus dem öffentlichen Quelltext nehmen

`CHEF_PIN` steht im Quelltext der Seite. Jeder, der die Seite ansieht, kann
ihn lesen.

Das ist heute **nicht mehr gefährlich** — die Sicherheitsregeln lassen
Selbstregistrierung nur noch als `mitarbeiter` zu, egal was der Code sagt
(behoben am 6. August). Aber im Verkaufsgespräch will man das nicht
erklären müssen, und beim nächsten Kunden sitzt vielleicht jemand, der den
Quelltext anschaut.

**Was zu tun ist:** Einladungen statt Code. Der Chef legt einen Zugang an,
die Person bekommt einen einmaligen Link. Die Prüfung passiert dort, wo sie
hingehört: in den Sicherheitsregeln, nicht im Browser.

**Aufwand:** mittel. **Kosten:** keine.

## A3. Testzugang mit erfundenen Daten

Der wirksamste Verkaufshebel und der billigste. Niemand kauft eine
Team-App, ohne sie angesehen zu haben — und niemand legt für einen Blick
ein Konto an.

Die Testumgebung dafür **existiert bereits**: in `tests/stub-*.js` liegen
drei fertige Datensätze für Chef, Studio-Leiter und Mitarbeiter. Daraus
einen Demo-Modus zu machen (`?demo=chef`), der ohne Anmeldung mit
erfundenen Daten läuft, ist wenig Arbeit.

**Aufwand:** klein. **Kosten:** keine.

## A4. Die Unterlagen, die ein Käufer verlangt

Das ist der Teil, an dem es ohne Vorbereitung hakt — nicht am Code.

Wer eine Personal-App an ein anderes Unternehmen verkauft, ist
**Auftragsverarbeiter** im Sinne der DSGVO. Der Kunde *muss* einen
Auftragsverarbeitungsvertrag mit dir schließen, sonst darf er die App
rechtlich nicht einsetzen. Ohne dieses Papier kommt kein seriöser Abschluss
zustande.

Was gebraucht wird:

1. **Auftragsverarbeitungsvertrag (AV-Vertrag)** nach Art. 28 DSGVO
2. **Beschreibung der technischen und organisatorischen Maßnahmen (TOM)** —
   also: wie sind die Daten geschützt. Das kann ich vollständig aus dem
   Code heraus beschreiben (Verschlüsselung unterwegs, Rollen, Regeln,
   Löschfristen).
3. **Liste der Unterauftragnehmer** — Google/Firebase (Server in
   `europe-west1`, also Belgien), der Mailversand.
4. **Verzeichnis der Verarbeitungstätigkeiten** — welche Daten, wozu, wie
   lange.
5. **Datenschutzerklärung und Impressum** für die App selbst.
6. **Löschkonzept** — was passiert beim Ausscheiden einer Person und beim
   Vertragsende.

**Aufwand:** Entwürfe kann ich schreiben, die TOM sogar ziemlich genau.
**Kosten:** keine — bis auf die anwaltliche Durchsicht, siehe B3.

## A5. Auskunft und Löschung je Person

Jede Person darf verlangen, alles über sich zu bekommen (Art. 15) und
gelöscht zu werden (Art. 17).

Beides ist heute nur von Hand möglich. Der Unterbau ist da: Papierkorb,
30-Tage-Löschung, Wochen-Archiv. Was fehlt, ist ein Knopf im Chef-Bereich:
„alle Daten dieser Person als Datei" und „Person vollständig entfernen".

**Aufwand:** mittel. **Kosten:** keine.

## A6. Sagen, was die App *nicht* tut

Ein Punkt, der im Verkauf mehr hilft als jede Funktion.

Eine Team-App in einem Betrieb mit Mitarbeitervertretung ist
mitbestimmungspflichtig, sobald sie zur Verhaltens- oder Leistungskontrolle
**geeignet** ist. Nicht erst, wenn man sie so einsetzt.

StudioChat steht dabei erst mal gut da: es gibt keine Standortverfolgung,
keine Tippgeschwindigkeit, keine Auswertung, wer wie schnell antwortet. Es
gibt einen „zuletzt online"-Punkt und die Angabe, wer eine Aufgabe erledigt
hat — beides begründbar.

Eine Seite, die das klar benennt, nimmt in jedem Gespräch mit einem
Betriebsrat den Druck raus. **Aufwand:** klein. **Kosten:** keine.

## A7. Preis und Angebot

Ohne Zahl kein Verkauf. Ein Blatt: was ist drin, was kostet es je Studio
oder je Person und Monat, was ist die Einrichtungspauschale, was ist im
Support enthalten.

Das ist keine Entwicklungsarbeit, sondern deine Entscheidung — ich kann
Vorlagen und einen Vergleich zu den üblichen Anbietern liefern.

---

# Teil B — kostet Geld, kann warten

## B1. Firebase: ihr seid bereits in der Abrechnung

Zur Einordnung, weil es oft falsch verstanden wird: **Cloud Functions
setzen den Blaze-Tarif voraus.** Da 16 Functions laufen, ist das Projekt
bereits dort. Blaze heißt nicht „kostenpflichtig", sondern
„nutzungsabhängig" — das kostenlose Kontingent gilt weiter, abgerechnet
wird erst darüber.

Bei einem Kunden mit 14 Studios liegt der Verbrauch nach allem, was die
Nutzung zeigt, deutlich innerhalb des Kontingents. Es ist trotzdem
richtig, ein **Budget-Limit mit Warnmail** zu setzen — das ist kostenlos
und verhindert die böse Überraschung, wenn ein Fehler einmal eine
Abfrageschleife baut.

**Wann es Geld kostet:** wenn Dauer-Listener über alle Studios laufen.
Genau deshalb steht in `OFFEN.md`, warum die studioübergreifende Suche
bewusst nicht gebaut ist.

## B2. Eigene Domain und Mailversand

Heute läuft der Mailversand über Gmail. Für den Monatsbericht an den
eigenen Chef ist das in Ordnung. Für einen zahlenden Kunden nicht: eine
Terminbestätigung von einer gmail-Adresse wirkt nicht wie ein Unternehmen
und landet öfter im Spam.

**Kosten:** Domain rund 10–20 € im Jahr, Postfach je nach Anbieter wenige
Euro im Monat. **Am Code ändert sich nichts** — nur fünf Werte in den
GitHub-Secrets, siehe `MAIL-SETUP.md`.

## B3. Anwaltliche Durchsicht

Die Papiere aus A4 kann ich entwerfen. Unterschreiben sollte sie niemand,
ohne dass jemand mit Zulassung draufgeschaut hat — es geht um Haftung
gegenüber deinem Kunden.

**Kosten:** je nach Kanzlei ein niedriger vierstelliger Betrag für AV-Vertrag,
Datenschutzerklärung und AGB als Paket. **Wann:** vor dem ersten Abschluss
mit einem fremden Unternehmen, nicht vorher.

## B4. Automatische Sicherung

Es gibt heute keine automatische Sicherung der Datenbank. Was es gibt: die
Wochen-Sicherung von Material und Putzplan im Archiv und die Excel-Exporte
— nützlich, aber kein Ersatz. Bei eigenen Daten ist das vertretbar; bei
Kundendaten ist es der Punkt, an dem es unangenehm wird.

Ein täglicher Export in einen Speicher-Eimer ist technisch klein.
**Kosten:** wenige Cent bis wenige Euro im Monat je Kunde.

## B5. Was du dir sparen kannst

- **App Store und Play Store.** StudioChat ist eine PWA und lässt sich über
  „Zum Home-Bildschirm" installieren. Das spart 99 € im Jahr bei Apple, 25 €
  einmalig bei Google — und vor allem die Freigabeverfahren bei jedem Update.
  Der einzige Nachteil: iOS erlaubt Push nur bei installierter PWA. Das ist
  in der App bereits berücksichtigt.
- **Eigene Server.** Es gibt keinen Grund dazu.

## B6. Der Posten, den fast alle unterschätzen

**Support.** Sobald jemand für die App bezahlt, ruft er an, wenn etwas
nicht geht — auch samstags um acht.

Das kostet kein Geld, sondern Zeit, und es ist der Posten, der über
Freude oder Frust entscheidet. Bevor der erste Kunde unterschreibt, sollte
festgelegt sein: erreichbar wann, Antwort innerhalb welcher Frist, und was
ausdrücklich nicht dazugehört.

---

## Reihenfolge, die ich vorschlagen würde

**Jetzt, kostenlos:**

1. A1 Konfiguration herauslösen — ohne das ist jeder weitere Schritt teurer
2. A3 Testzugang — der Punkt mit dem größten Hebel pro Aufwand
3. A4 Unterlagen entwerfen — dauert am längsten, blockiert am Ende alles
4. A6 „Was die App nicht tut" — eine Seite, große Wirkung
5. A2 Einladungen statt Chef-Code
6. A5 Auskunft und Löschung je Person
7. B1 Budget-Limit setzen (kostenlos, aber gehört in Teil B erklärt)

**Sobald ein Kunde konkret ist:**

8. A7 Preis festlegen
9. B3 anwaltliche Durchsicht
10. B2 eigene Domain und Mailversand
11. B4 automatische Sicherung
12. B6 Support-Zusage schriftlich

**Erst ab dem fünften oder sechsten Kunden:** Mandantenfähigkeit (siehe
`OFFEN.md`).

---

## Was ich dabei nicht leisten kann

Damit es nicht später als Zusage missverstanden wird:

- **Rechtsberatung.** Ich kann die Papiere entwerfen und die technische
  Seite präzise beschreiben. Ob sie im Streitfall tragen, entscheidet
  jemand mit Zulassung.
- **Die Zusicherung, dass die App DSGVO-konform *ist*.** Konform ist nicht
  eine Software, sondern ihr Einsatz. Ich kann dafür sorgen, dass die
  Technik dem nicht im Weg steht — mehr nicht.
- **Ob sich das rechnet.** Das hängt an deinem Preis und deiner Zeit, nicht
  am Code.
