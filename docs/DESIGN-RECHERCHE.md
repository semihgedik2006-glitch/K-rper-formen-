# Design-Recherche: was vergleichbare Apps anders machen

Stand: 23. September 2026.

`DESIGN-IDEEN.md` sammelt dreissig Vorschläge, **alle aus
Bildschirmfotos der eigenen App** abgeleitet. Diese Datei ist der Blick
nach aussen: Apps für Beschäftigte ohne Schreibtisch (Studio, Gastro,
Handel, Pflege), die grossen Gestaltungssysteme von 2025/26 und die
Fitnessbranche selbst.

**Wie damit umgehen:** das ist eine Auswahlliste, kein Auftrag. Zu jeder
Idee steht, was sie hier konkret hiesse, was sie kostet, was dagegen
spricht — und ob sie mit dem kollidiert, was aus dem Betrieb schon als
Wunsch kam (siehe `CLAUDE.md`, „Wie es aussehen soll"). Wo sie
kollidiert, steht das dabei; entschieden wird dann im Betrieb, nicht hier.

Was es in der App **schon gibt**, habe ich vorher nachgesehen und nicht
als neu verkauft: kurzes Vibrieren beim Tippen (`tick()`), Lob als
Brett-Eintrag, ein Glückwunsch beim Abhaken, Geburtstage.

---

## Was die Recherche im Kern sagt

1. **Um die Schicht herum gebaut, nicht um den Schreibtisch.** Die Apps,
   die im Alltag bleiben, sind „um eine Schicht gebaut, nicht um einen
   Browser" ([MangoApps](https://www.mangoapps.com/glossary/frontline-employee-app)).
   Beim Öffnen steht da, was *jetzt* ansteht — offene Aufgaben, die
   nächste Schicht, Wichtiges von oben ([Beekeeper](https://connecteam.com/reviews/beekeeper/)).
   **Das macht die Startseite hier seit Runde 87 schon so.**
2. **Wie eine Verbraucher-App, nicht wie Firmensoftware.** Beschäftigte,
   die mit dem Smartphone aufgewachsen sind, senken ihre Erwartungen am
   Arbeitsplatz nicht ([Flip](https://www.getflip.com/blog/frontline-app/)).
3. **Anmelden ohne Firmen-Mail.** Die fehlende Firmen-Adresse ist das
   grösste Hindernis für Beschäftigte ohne Schreibtisch; QR-Code und
   Telefonnummer statt E-Mail ([Flip](https://www.getflip.com/blog/frontline-worker-app/),
   [Blink](https://www.joinblink.com/intelligence/best-employee-communication-apps)).
4. **Grösse, Farbe und Form lenken den Blick — messbar.** Google hat für
   „Material 3 Expressive" 46 Studien mit über 18.000 Personen gemacht:
   wichtige Bedienelemente wurden **bis zu viermal schneller gefunden**,
   und der Abstand zwischen Älteren (45+) und Jüngeren verschwand
   ([Google Design](https://design.google/library/expressive-material-design-google-research)).
5. **Durchsichtiges Glas kostet Lesbarkeit.** Die Nielsen Norman Group
   zu Apples „Liquid Glass" (iOS 26): Text über wechselndem Hintergrund
   hat zu wenig Kontrast, schwebende Leisten verdecken Inhalt, Bewegung
   um ihrer selbst willen lenkt ab ([NN/g](https://www.nngroup.com/articles/liquid-glass/)).
   **Das bestätigt die Richtung der letzten Runde** (deckende Leisten,
   Endlos-Animationen raus).

---

## A · Startseite und Wege

### A1. Eigene Schnellzugriffe auf der Startseite
*Vorbild: Beekeeper „Shortcuts on Home"* ([Quelle](https://connecteam.com/reviews/beekeeper/))

Jede Person heftet bis zu drei Ziele an, die sie täglich braucht — der
Empfang „Putzplan" und „Stempeln", die Leitung „Schichtplan" und
„Anliegen". Als eine Zeile kleiner Knöpfe über der Heute-Liste.

*Aufwand:* klein bis mittel (Auswahl in „Alles" per langem Druck, Ablage
in `PREFS`). **Dagegen:** kostet eine Zeile auf einer Seite, die auf
einen Bildschirm passen soll. **Kollision:** keine — „Ausserdem" fängt
ab, was dadurch nicht mehr passt.

> **Umgesetzt in Runde 103** — mit drei Abweichungen von diesem Entwurf:
> die Zeile steht **unten** über der Leiste statt oben (Daumenzone, wie
> A2; oben hat das Überfällige Vorrang), gewählt wird über einen
> sichtbaren Knopf „Anpassen" statt per langem Druck (eine unsichtbare
> Geste darf nie der einzige Weg sein), und ohne eigene Wahl steht ein
> Vorschlag je Rolle da. Auf Bildschirmen unter 640 px Höhe nur die
> Zeichen — sonst passte die Startseite beim iPhone SE nicht mehr.

### A2. Die Hauptaktion gross und in der Daumenzone
*Vorbild: Material 3 Expressive („Size"), Prüf-Apps im Aussendienst* ([Google Design](https://design.google/library/expressive-material-design-google-research), [BasinCheck](https://basincheck.com/resources/best-mobile-safety-audit-apps))

Je Ansicht **eine** Aktion, die deutlich grösser ist als alles andere und
im unteren Drittel sitzt, wo der Daumen hinkommt: „Abhaken" im Putzplan,
„Stempeln" in den Zeiten, „Senden" im Chat. Heute sitzt „+ Neu" oben
rechts — der am schwersten erreichbare Punkt auf einem grossen Telefon.

*Aufwand:* mittel (ein schwebender Hauptknopf je Ansicht, Abstand zur
unteren Leiste). **Dagegen:** ein schwebender Knopf verdeckt die letzte
Zeile einer Liste; die Liste braucht dann unten Platz. **Kollision:**
keine, sofern er deckend ist (siehe NN/g oben).

> **Umgesetzt in Runde 103** für die drei Anlegen-Knöpfe (Aufgabe,
> Putzaufgabe, Probetraining), nur auf dem Handy. Die Liste bekommt
> unten Platz, beim Scrollen rückt der Knopf auf das Pluszeichen
> zusammen. **Nicht** gemacht: „Abhaken" im Putzplan (das ist eine
> Handlung je Zeile, keine je Seite), „Stempeln" (am Handy braucht es
> den Code vom Bildschirm im Studio — ein Eingabefeld, kein einzelner
> Knopf; es hat in „Ich" schon eine eigene Karte) und „Senden" im Chat
> (sitzt dort schon unten).

### A3. Bento-Kacheln — aber nur in der Verwaltung
*Vorbild: Bento-Raster* ([Superfiles](https://superfiles.in/bento-grid-ui-design-trend.php), [Moburst](https://www.moburst.com/blog/top-mobile-web-design-trends/))

Kacheln verschiedener Grösse, auf einen Blick zu lesen. Gut für
Übersichten, schlecht für Abläufe. **Für die Startseite rate ich ab:**
genau so ein Kachelraster ist in Runde 86 gestrichen worden, weil es
dieselben Zahlen zeigte wie die Liste darunter. **In „Verwaltung →
Überblick" des Chefs** passt es dagegen: 14 Studios, eine Kachel je
Studio, die grösste für das mit dem meisten Rückstand.

*Aufwand:* mittel. **Dagegen:** die Verwaltung hat schon eine Liste der
Studios nach Rückstand. Die Kacheln müssten sie ersetzen, nicht
daneben stehen — zwei Übersichten derselben Sache sind eine zu viel.

> **Umgesetzt in Runde 103**: die bestehende Studio-Tafel ist jetzt ein
> Bento-Raster (gross / normal / klein nach Rückstand), und „Braucht
> Aufmerksamkeit" nennt Überfälliges und fehlendes Material nur noch als
> Summe — vorher je Studio, beim Chef der Demo 14 Zeilen. Die Tafel
> startet weiter zugeklappt: der Überblick soll höchstens 2,4 Bildschirme
> lang sein (`test-verwaltung-bereich9`).

---

## B · Schicht und Woche

### B1. Wochenstreifen mit Punkten
*Vorbild: 7shifts* ([Wissensbasis](https://kb.7shifts.com/hc/en-us/articles/4417514375827-Check-Your-Schedule))

Oben in „Meine Woche" ein Streifen Mo–So, wischbar; an Tagen mit Dienst
ein Punkt, der heutige Tag hervorgehoben. Ein Tipp auf einen Tag zeigt
ihn. Heute steht dort „Diese Woche" mit einer einzigen Zeile — die
Woche als Form fehlt.

*Aufwand:* klein. **Dagegen:** bei 320 px bleiben nach den Seitenrändern
(je 14 px) 292 px — sieben Tage zu je 44 px brauchen 308. **Es passt
also nicht**: entweder fünf Tage sichtbar und der Rest per Wischen,
oder der Streifen bekommt auf sehr schmalen Geräten schmalere Ränder.
Nachgerechnet, nicht gemessen — vor dem Bauen messen.

### B2. Schicht abgeben und übernehmen
*Vorbild: Deputy, 7shifts* ([Agendrix](https://www.agendrix.com/blog/best-shift-scheduling-apps))

„Ich kann nicht" gibt es schon. Der zweite Schritt fehlt: die Schicht
wird dem Team angeboten, jemand tippt „Übernehme ich", die Leitung
bestätigt. Das ist eine Funktion, keine Gestaltung — steht hier, weil
Nutzerbewertungen von 7shifts und Deputy genau das Tauschen und Anbieten
von Schichten ausdrücklich loben.

*Aufwand:* mittel bis gross (Regeln, Benachrichtigung, Bestätigung).
Gehört eher nach `IDEEN.md`.

---

## C · Gefühl und Bewegung

### C1. Federnde Rückmeldung an den zwei wichtigsten Stellen
*Vorbild: Material 3 Expressive, „expressive motion springs"* ([M3](https://m3.material.io/blog/building-with-m3-expressive))

Beim Abhaken und beim Senden federt der Knopf kurz nach (Überschwingen,
dann Ruhe) — und nur dort. Alles andere bleibt ruhig. „Bewegung um
ihrer selbst willen" ist genau das, was NN/g kritisiert; Bewegung als
Antwort auf einen Tipp ist das Gegenteil.

*Aufwand:* klein (`transform` mit einer Federkurve — `--spring` gibt es
schon). **Dagegen:** nichts, solange es bei `transform`/`opacity` bleibt
(siehe `CLAUDE.md`, „Flüssig heisst konkret"). Passt zu Idee 19 in
`DESIGN-IDEEN.md`.

### C2. Formen-Kontrast: rund für Aktionen, eckig für Inhalt
*Vorbild: Material 3 Expressive, „Shape"* ([Supercharge](https://supercharge.design/blog/material-3-expressive))

Knöpfe als Pillen, Karten mit kleinerem Radius — die Form sagt, was man
drücken kann. Heute sind Karten, Zeilen und Knöpfe ähnlich rund.

*Aufwand:* klein (die Radius-Leiter gibt es). **Dagegen:** der Eindruck
„weich und rund" ist bisher gewollt; ein Umbau aller Karten wäre
sichtbar gross. Erst an einer Ansicht ausprobieren.

---

## D · Team und Anerkennung

### D1. „Danke" direkt an der erledigten Sache
*Vorbild: Blink Recognition, Kudos-Funktionen* ([Blink](https://www.joinblink.com/features/recognition), [Stadium](https://www.bystadium.com/blog/kudos-employee-recognition))

Lob gibt es als Brett-Eintrag — man muss dafür an einen anderen Ort und
einen Text schreiben. Vorbild ist das Danke **an der Stelle, wo die
Arbeit sichtbar ist**: an einer abgehakten Aufgabe, einer Übergabe,
einem erledigten Putzpunkt ein kleiner Knopf „Danke". Die Person sieht
es auf ihrer Startseite unter „Neu für dich".

*Aufwand:* klein bis mittel (ein Feld am Eintrag, eine Zeile auf der
Startseite). **Dagegen:** Zählen und Ranglisten — siehe unten, davon
rate ich ab.

---

## E · Schulung

### E1. Der offene Rest ist sichtbar
*Vorbild: LinkedIn-Profilfortschritt (Zeigarnik-Effekt)* ([StriveCloud](https://www.strivecloud.io/blog/gamification-examples-onboarding))

Unerledigtes bleibt im Kopf. Statt „3 Module" steht an der Schulung „2
von 3 geschafft — eines fehlt noch", mit einem Balken, der den Rest
zeigt. Laut der Quelle bis zu 50 % mehr Abschlüsse als bei statischen
Formularen — **eine Herstellerangabe, nicht unabhängig geprüft**.

*Aufwand:* klein. **Kollision:** keine; „Das steht für dich an" gibt es
seit Runde 100, das hier wäre die Zahl dazu.

### E2. Eine Wiederholungsfrage nach zwei Wochen
*Vorbild: Axonify, verteiltes Wiederholen* ([Raccoon Gang](https://raccoongang.com/blog/best-microlearning-apps-and-platforms/))

Zwei Wochen nach einer Schulung erscheint unter „Neu für dich" **eine**
Frage daraus. Richtig: fertig. Falsch: der Hinweis dazu. Kein neuer
Durchlauf, kein Nachweis — nur Erinnern.

*Aufwand:* mittel. **Dagegen:** wird es als Kontrolle empfunden, schadet
es. Ergebnisse deshalb nur für die Person selbst, nicht für die Leitung.

---

## F · Zugang

### F1. Beitreten per QR-Code am Empfang
*Vorbild: Flip, Blink* ([Flip](https://www.getflip.com/blog/frontline-worker-app/))

Der Firmencode existiert und soll „nicht penetrant" sein. Ein QR-Code
auf dem Studio-Tablet (aus der Verwaltung heraus angezeigt) trägt ihn
mit: scannen, Name eingeben, fertig — die Freigabe durch den Chef bleibt.

*Aufwand:* klein bis mittel (QR-Erzeugung ohne fremde Bibliothek ist
Aufwand; eine eingebettete kleine Bibliothek braucht einen Eintrag in
der Sicherheitsregel). **Dagegen:** ein fotografierter QR-Code ist ein
weitergegebener Firmencode — die Freigabe durch den Chef ist deshalb
Pflicht, nicht Zierde.

---

## Wenn ich fünf auswählen müsste

| | Idee | warum zuerst |
|---|---|---|
| 1 | **B1 Wochenstreifen** | klein, sofort sichtbar, füllt die leerste Ansicht der App |
| 2 | **A2 Hauptaktion in der Daumenzone** | grösster Gewinn im Alltag; Googles Zahlen sprechen dafür |
| 3 | **D1 „Danke" an der Sache** | macht Lob so leicht wie ein Tipp; kostet wenig |
| 4 | **C1 federnde Rückmeldung** | „lebendig", ohne die Bildrate zu kosten |
| 5 | **E1 offener Rest in der Schulung** | eine Zeile, direkt nach der Schulungs-Runde |

---

## Wovon ich abrate — mit Grund

**Schwebende, durchsichtige Glas-Leisten (iOS-26-Stil).** Die NN/g hat
die Lesbarkeitsprobleme dokumentiert, und die letzte Runde hat Kopfzeile
und untere Leiste gerade deckend gemacht, weil „schärfer" und
„kontrastreich" gewünscht war. Beides zugleich geht nicht.

**Ranglisten und Punkte unter Kolleginnen.** In Lern- und Lob-Apps weit
verbreitet ([MobieTrain](https://raccoongang.com/blog/best-microlearning-apps-and-platforms/),
[HubEngage](https://www.hubengage.com/guides/employee-recognition-software/)).
Hier aber: eine Rangliste, wer wie viel abhakt oder wie schnell eine
Schulung macht, ist eine **Leistungs- und Verhaltenskontrolle** — in
einem Betrieb mit Betriebsrat mitbestimmungspflichtig (§ 87 Abs. 1 Nr. 6
BetrVG) und datenschutzrechtlich heikel. Das ist eine rechtliche
Einschätzung ohne Prüfung durch eine Fachperson — vor einer solchen
Funktion fragen.

**Serien („5 Tage am Stück") in der Schulung.** Motiviert bei
freiwilligem Lernen; bei Pflichtschulungen wird daraus Druck. Wenn
überhaupt, nur für die Person selbst sichtbar.

**Bento-Kacheln auf der Startseite.** Siehe A3 — das war in Runde 86
schon einmal da und ist mit Grund gegangen.

---

## Quellen

- [Flip — What is a Frontline App?](https://www.getflip.com/blog/frontline-app/)
- [Flip — What Is a Frontline Worker App?](https://www.getflip.com/blog/frontline-worker-app/)
- [MangoApps — Frontline Employee App: What Makes One Stick](https://www.mangoapps.com/glossary/frontline-employee-app)
- [Connecteam — Beekeeper Review](https://connecteam.com/reviews/beekeeper/)
- [Blink — Best employee communication apps 2026](https://www.joinblink.com/intelligence/best-employee-communication-apps)
- [Blink — Recognition](https://www.joinblink.com/features/recognition)
- [Google Design — Expressive Material Design research](https://design.google/library/expressive-material-design-google-research)
- [Material Design 3 — Building with M3 Expressive](https://m3.material.io/blog/building-with-m3-expressive)
- [Supercharge — Material 3 Expressive](https://supercharge.design/blog/material-3-expressive)
- [Nielsen Norman Group — Liquid Glass Is Cracked](https://www.nngroup.com/articles/liquid-glass/)
- [Superfiles — Bento Grid UI Design Guide](https://superfiles.in/bento-grid-ui-design-trend.php)
- [Moburst — Mobile Design Trends 2026](https://www.moburst.com/blog/top-mobile-web-design-trends/)
- [7shifts — Check Your Schedule](https://kb.7shifts.com/hc/en-us/articles/4417514375827-Check-Your-Schedule)
- [Agendrix — Best Shift Scheduling Apps 2026](https://www.agendrix.com/blog/best-shift-scheduling-apps)
- [StriveCloud — Onboarding gamification examples](https://www.strivecloud.io/blog/gamification-examples-onboarding)
- [Raccoon Gang — Best Microlearning Apps 2026](https://raccoongang.com/blog/best-microlearning-apps-and-platforms/)
- [Stadium — Kudos Employee Recognition](https://www.bystadium.com/blog/kudos-employee-recognition)
- [HubEngage — Employee Recognition Software](https://www.hubengage.com/guides/employee-recognition-software/)
- [BasinCheck — Mobile Safety Audit Apps](https://basincheck.com/resources/best-mobile-safety-audit-apps)
