# 20 Ideen: was Formi noch können sollte, und wie die App leichter wird

Stand 24.10.2026. Aus dem Betrieb: „gib mir selber noch 20 Ideen was formi
Design technisch noch können sollte und wie wir das ganze Interface viel
leichter und besser machen können".

Grundlage: `docs/design-vorbilder/` (vor allem `studien-psychologie.md`,
`ki-assistent.md`, `navigation-und-startseite.md`) und was in den Runden
bis 262 schon gebaut ist. Was es schon gibt (Suche mit Strg+K, Abend- und
Wochenbericht, Wischen, leere Zustände mit nächstem Schritt), steht hier
nicht noch einmal.

Jede Idee nennt den Gewinn und, wo es eine gibt, die Studie dahinter.

## A. Formi — Gestaltung und Verhalten

1. **Auf Formi ziehen = „kümmere dich".** Eine Aufgabe, eine Nachricht oder
   ein Gerät auf die Kugel ziehen. Formi bietet drei Dinge an: erinnern,
   weitergeben, abhaken. Das Loch „zieht" sichtbar an, sobald etwas in die
   Nähe kommt. *Gewinn:* ein Weg ohne Menü; man erkennt statt zu erinnern
   (Nielsen 1994).
2. **Lange drücken auf Formi: ein Ring mit vier Aufträgen.** Die vier, die
   diese Person am häufigsten gibt, rund um das Loch. *Gewinn:* feste Lage,
   Daumen-Reichweite; Fitts' Gesetz bevorzugt kurze Wege zu grossen Zielen.
3. **Die Scheibe als Tagesstand, lesbar.** Die Scheibe füllt sich schon mit
   dem Tag (`fk-tag-0…3`). Neu wäre: Fährt die Maus darüber oder hält man
   den Finger darauf, steht „7 von 11 erledigt" daneben. *Gewinn:* sichtbarer
   eigener Fortschritt stützt Kompetenz (Deci u. a. 2017).
4. **Formi statt Ladekreisel.** Überall, wo die App wartet, dreht sich eine
   kleine Scheibe, kein Standard-Kreisel. *Gewinn:* ein Zeichen für „Warten"
   in der ganzen App.
5. **Formis Spur an der Zeile.** Was Formi geändert hat (`formiAt` gibt es
   schon), trägt ein winziges Loch am Rand der Zeile. Antippen zeigt, wann
   und auf wessen Auftrag. *Gewinn:* Vertrauen, weil nachvollziehbar
   (`ki-assistent.md`: zeigen, was die KI getan hat).
6. **Morgens kommt der Tag aus dem Loch.** Beim ersten Öffnen am Tag „spuckt"
   Formi die drei wichtigsten Punkte auf „Heute" (weisses Loch, einmal am
   Tag, kurz). *Gewinn:* ein klarer Einstieg mit höchstens drei Dingen
   (Cowan 2001: etwa vier Einheiten gleichzeitig).
7. **Formi wird schwerer, wenn viel offen ist.** Ein dichterer, langsamerer
   Wirbel, wenn sich Offenes staut; leicht und schnell, wenn alles erledigt
   ist. Keine Statusfarben, nur Bewegung und Dichte. *Gewinn:* Stimmung auf
   einen Blick, ohne rote Zahl, die Druck macht (Deci u. a. 2017).
8. **Insel für Laufendes, nicht nur für Formi.** Die Insel aus Runde 250
   zeigt auch „Eingestempelt seit 06:58" oder „Sprachnachricht wird
   gesendet". *Gewinn:* ein fester Ort für alles, was gerade läuft, wie bei
   Apple.
9. **Formi im Hellmodus als „Tinte".** Im hellen Stil ist das Loch ein
   tiefer Tintenpunkt mit feiner Scheibe statt Leuchten. *Gewinn:* Formi
   passt zu jedem Stil, ohne zu blenden.
10. **Ein Formi-Ton statt vieler Klänge.** Ein einziger kurzer, tiefer Ton
    für „erledigt" (wie Apple Pay) statt mehrerer Effekte. Lautlos per
    Schalter wie heute. *Gewinn:* ein wiedererkennbares Signal, weniger
    Lärm.

## B. Die App leichter und besser machen

11. **„Meine Schicht" als eine Liste.** Alles, was ich in meiner Schicht
    tun muss (Putzplan, Aufgaben, Übergabe lesen, Material prüfen), in EINER
    Liste mit Haken, in der Reihenfolge des Tages. *Gewinn:* keine Suche
    über Bereiche (Sweller 1988: weniger Suchlast, mehr Kopf für die
    Arbeit).
12. **Am Rechner überall Liste + Detail.** Aufgaben, Nachrichten, Team und
    Geräte zweispaltig: links die Liste, rechts das Geöffnete, ohne
    Seitenwechsel. *Gewinn:* der PC ist das Hauptgerät; Breite nutzen statt
    eine Spalte über 1.200 px ziehen.
13. **Ein „+" mit Vorschlägen je Ort.** Auf jeder Seite derselbe Plus-Knopf
    an derselben Stelle; im Putzplan schlägt er „Punkt anlegen" vor, im
    Team „Abwesenheit". *Gewinn:* stabile Lage, weniger Hauptknöpfe
    (Cockburn u. a. 2007: feste Positionen beschleunigen Geübte).
14. **Rückgängig statt Nachfragen.** Löschen, Abhaken, Verschieben sofort
    ausführen, unten 8 Sekunden „Rückgängig". Bestätigungsdialoge nur noch
    bei Dingen, die nicht zurückgehen. *Gewinn:* weniger Tipps, weniger
    Unterbrechung.
15. **Glocke gebündelt.** „3 neue in Hürth" als eine Zeile statt drei;
    aufklappen zeigt die einzelnen. *Gewinn:* weniger gleichzeitig offen
    (Cowan 2001).
16. **Felder, die mitdenken.** Beim Anlegen einer Aufgabe stehen Studio,
    Frist „heute" und die letzte Person schon drin; nur der Titel ist leer.
    *Gewinn:* drei Felder weniger je Vorgang.
17. **Fokus am Rechner.** Taste F blendet alles aus ausser der aktuellen
    Liste, zum Abarbeiten. Formi bleibt als kleiner Punkt. *Gewinn:* weniger
    Reize bei konzentrierter Arbeit.
18. **Erste Woche mit Formi.** Neue im Team bekommen an den ersten fünf
    Tagen je einen 1-Minuten-Rundgang („Zeig mir wie" gibt es schon), immer
    zum Thema des Tages: Stempeln, Putzplan, Übergabe, Chat, Schulung.
    *Gewinn:* Lernen in kleinen Stücken statt einer langen Einführung.
19. **Leere Fläche ist erlaubt.** Pro Ansicht höchstens eine Karte mit
    Kante und Schatten (die wichtigste); der Rest steht ruhig auf dem
    Grund. *Gewinn:* das Auge findet den Einstieg sofort („wenige, grosse
    Dinge" aus `CLAUDE.md`).
20. **Sprache vereinheitlichen.** Jeder Knopf ist ein Verb („Abhaken",
    „Senden", „Eintragen"), jede Überschrift ein Ding; dieselbe Sache heisst
    überall gleich (z. B. nie „Bestand" und „Material" für dasselbe).
    *Gewinn:* stärkere „Duftspur" beim Suchen (Pirolli & Card 1999).

## Empfehlung

Zuerst **11 (Meine Schicht)**, **12 (Liste + Detail am PC)** und **1
(Auf Formi ziehen)**. Die ersten beiden sparen jeden Tag die meisten
Tipps. Die dritte macht Formi vom Schmuck zum Werkzeug.

## Stand (25.10.2026)

Auf „mach alles davon und alles was noch offen ist" sind alle 20 gebaut:

| Idee | Runde | wo man es sieht |
|---|---|---|
| 1 Auf Formi ziehen | 279 | am Rechner eine Aufgabe/einen Putzpunkt auf die Kugel ziehen |
| 2 Ring beim Lange-Drücken | 279 | Formi gedrückt halten oder Rechtsklick |
| 3 Tagesstand lesbar | 278 | am Rechner mit der Maus über Formi |
| 4 Formi statt Ladekreisel | 278 | in jedem Knopf, der länger als 300 ms speichert |
| 5 Formis Spur | 278 | „über Formi · 09:14" an der Zeile |
| 6 Morgens aus dem Loch | 279 | erster Blick auf „Heute" am Tag |
| 7 Schwer bei Stau | 278 | Formis Wirbel ab 8 / 15 offenen Punkten |
| 8 Insel für Laufendes | 279 | eingestempelt: „Im Dienst seit …" oben |
| 9 Tinte im hellen Stil | 278 | Stil „Hell" |
| 10 Ein Formi-Ton | 278 | Formi-Fenster, „erledigt" |
| 11 Meine Schicht | 281 | „Heute" → Meine Schicht |
| 12 Liste + Detail am Rechner | 281 | Aufgabe → „…" ab 1100 px |
| 13 „+" mit Vorschlägen | 280 | „+ Anlegen" auf „Heute" am Rechner |
| 14 Rückgängig statt Nachfragen | 280 | Löschen von Aufgabe, Ankündigung, Nachricht, Schicht |
| 15 Glocke gebündelt | 280 | Glocke → „3 neue in Hürth" |
| 16 Felder, die mitdenken | 280 | Verwaltung → Neue Aufgabe: Studios |
| 17 Fokus | 280 | Taste F am Rechner |
| 18 Erste Woche | 279 | neue Konten, „Heute" |
| 19 Eine Karte mit Kante | 281 | „Heute" und Karten-Seiten |
| 20 Sprache | 280 | Knöpfe: „Löschen", „Hinzufügen", „Schließen" |

Bewusst offen geblieben: die Material-Liste behält ihre Rückfrage (siehe
Runde 280).
