# StudioChat – SWOT und Pitch

Stand 8. August 2026.

---

## Der Pitch in einem Satz

> **StudioChat beantwortet die einzige Frage, die ein Studiobetreiber jeden
> Morgen hat: Wo bleibt gerade etwas liegen?**

## In dreißig Sekunden

Wer mehrere Studios betreibt, führt sie über eine WhatsApp-Gruppe. Aufgaben
verschwinden im Verlauf, ein defektes Gerät steht zwischen Urlaubsgrüßen,
und niemand weiß, in welchem Studio die Handtücher ausgehen. Ausgeschiedene
Mitarbeiter lesen mit.

StudioChat ersetzt diese Gruppe durch ein Werkzeug, das den Betrieb kennt:
Aufgaben mit Frist und Foto-Nachweis, Putzplan mit Wiederholung,
Materialbestand mit Einkaufsliste und fertiger Bestellmail, Gerätehistorie
mit Wiederholungstäter-Warnung, Schichttausch mit Freigabe, Urlaubsanträge
über alle Standorte.

Und auf jedem Bildschirm steht oben, **wo** gerade etwas hakt.

Läuft im Browser, installiert sich wie eine App, kostet im Betrieb nichts.

## In zwei Minuten (Vorführung)

1. **Startseite als Chef.** „Wo etwas los ist" – vier Studios, gewichtet
   nach Dringlichkeit. Antippen → man ist im Studio.
2. **Aufgaben.** Überfälliges steht oben, Studios mit Problemen zuerst.
   Abhaken durch Wischen, Foto als Nachweis.
3. **Geräte.** „EMS-Gerät 2 ist defekt · ansehen". Verlauf: *3× defekt in
   90 Tagen*. Eine Meldung erzeugt automatisch eine Aufgabe – aber nur eine.
4. **Material.** „3 Artikel fehlen · nur diese zeigen". Einkaufsliste über
   alle Studios, Bestellmail fertig vorbereitet.
5. **Team.** „Wartet auf deine Entscheidung: Hürth 1" → Urlaubsantrag,
   genehmigen.

Fünf Bildschirme, fünf Antworten, keine Schulung nötig.

---

## SWOT

### Stärken

- **Löst ein echtes, teures Problem.** Ein ausgefallenes EMS-Gerät kostet
  Termine. Ein vergessener Erste-Hilfe-Kurs kostet mehr.
- **Der „Wo?"-Blick** – auf Startseite, bei Geräten und im Team dieselbe
  Form. Kein Messenger hat das, und kein allgemeines Aufgabenwerkzeug kennt
  „Studio".
- **Betriebskosten null.** Firebase-Gratisstufe trägt 14 Studios mühelos.
- **Vollständig auf Deutsch**, auch im Code – der Kunde kann mitlesen.
- **Ein neuer Kunde = eine Datei.** `konfig.js` austauschen, fertig.
- **29 automatische Durchläufe** – jede Änderung wird durchgeklickt, bevor
  sie live geht.
- **Datenschutz als Verkaufsargument:** keine Ortung, keine Zeiterfassung,
  keine Leistungsmessung, kein Mitlesen. Das steht so im Handbuch und ist
  in Gesprächen mit Mitarbeitern Gold wert.
- **15-seitiges Handbuch**, das ein Mensch lesen kann.

### Schwächen

- **Eine Datei mit 11.474 Zeilen.** Wartbar, solange eine Person sie kennt.
  Zu zweit wird es eng.
- **Skalierbarkeit ist gedeckelt.** Alles wird im Speicher gerechnet, ein
  Beobachter je Studio. Ab etwa 40 Studios muss umgebaut werden.
- **Dateien liegen als Text in der Datenbank**, Grenze ~0,7 MB. Größeres
  nur als Link.
- **Kein Einrichtungs-Assistent.** Ein neuer Kunde braucht jemanden, der
  `konfig.js` und Firebase versteht.
- **E-Mails kommen von einer Gmail-Adresse.**
- **Ein Kunde.** Alle Annahmen stammen aus einem Betrieb.
- **Bus-Faktor 1.**

### Chancen

- **Franchise-Ketten.** EMS-Studios sind fast immer Ketten – wer eines
  überzeugt, bekommt oft mehrere.
- **Übertragbar.** Physiotherapie, Friseure, Fahrschulen, Bäckereien: überall
  dieselbe Struktur – mehrere Standorte, Schichtbetrieb, Material, Geräte,
  Nachweispflichten. Nur `konfig.js` und ein paar Wörter ändern sich.
- **Nachweispflichten wachsen.** Dokumentation ist ein Argument, das von
  selbst stärker wird.
- **Der Preis ist konkurrenzlos.** Wettbewerber verlangen pro Kopf und
  Monat; hier liegen die Betriebskosten bei null.

### Risiken

- **WhatsApp ist umsonst und schon installiert.** Die Einführung scheitert
  nicht an Funktionen, sondern an Gewohnheit. Deshalb muss der Chat
  mithalten – das war der Grund für Bereich 3.
- **Ein einzelner schlechter Tag** (Push kommt nicht an, App lädt nicht)
  wirft das Team zurück in die Gruppe.
- **Firebase-Kontingente.** Kostenlos, bis es das nicht mehr ist. Bei 14
  Studios weit entfernt, aber es gibt keine Warnung, bevor es eng wird.
- **Abhängigkeit von Google.** Auth, Datenbank, Push, Hosting, Functions,
  Tabellen – alles aus einem Haus.
- **Als Produkt fehlt der Rahmen:** Vertrag, Auftragsverarbeitung,
  Verfügbarkeitszusage, Unterstützung. Für den eigenen Betrieb egal, für
  einen fremden Kunden nicht.

---

## Was ein Käufer als Erstes fragen wird

| Frage | Ehrliche Antwort |
|---|---|
| „Was kostet der Betrieb?" | Bei eurer Größe nichts. Firebase-Gratisstufe. |
| „Was, wenn ihr wegfallt?" | Der Quelltext ist eine Datei, alles auf Deutsch kommentiert. Die Daten liegen in eurem eigenen Firebase-Projekt. |
| „Können meine Leute mitgelesen werden?" | Direktnachrichten nein, auch vom Chef nicht. Steht im Handbuch. |
| „Was ist mit Arbeitszeiterfassung?" | Gibt es bewusst nicht. |
| „Wie lange dauert die Einführung?" | Zugänge anlegen, Studios eintragen, loslegen. Keine Schulung nötig – aber jemand muss Firebase einrichten. |
| „Wie viele Studios verträgt das?" | Bis etwa 40 wie gebaut. Darüber ist ein Umbau nötig, der bekannt und beschrieben ist. |
| „Wer hat es sonst noch?" | Ein Betrieb mit 14 Studios, seit Sommer 2026 im Einsatz. |

---

## Preisidee (unverbindlich)

Die Betriebskosten sind null; der Preis bildet Arbeit und Betreuung ab.

| Modell | Preis | Enthält |
|---|---|---|
| **Einrichtung** | einmalig | Firebase-Projekt, `konfig.js`, Zugänge, Einweisung |
| **Betreuung** | monatlich je Betrieb, nicht je Kopf | Aktualisierungen, Fehlerbehebung, Sicherung |
| **Eigenbetrieb** | einmalig | Quelltext und Handbuch, Betrieb beim Kunden |

**Nicht pro Kopf abrechnen.** Ein Studio mit 20 Aushilfen zahlt sonst mehr
als eines mit fünf Vollzeitkräften – bei gleichem Nutzen. Und es bestraft
genau das, was man will: dass alle die App benutzen.
