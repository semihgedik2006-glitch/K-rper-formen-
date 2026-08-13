# KI in StudioChat — Plan (noch nicht gebaut)

Stand: August 2026. Dieses Dokument ist eine Entscheidungsgrundlage, kein
Bauplan zum sofortigen Loslegen. Nichts davon ist eingebaut.

---

## Die gute Nachricht zuerst

Die halbe Arbeit ist schon getan. In `functions/index.js` gibt es bereits
eine funktionierende KI-Anbindung für die Marketing-App (`marketingChat`,
Gemini 2.5 Flash). Das Muster stimmt und ist sicher gebaut:

- Der API-Schlüssel liegt **auf dem Server**, nie im Browser
- Der Aufruf geht über eine Cloud Function, nicht direkt aus der App
- `GEMINI_API_KEY` ist bereits als GitHub-Secret hinterlegt und wird beim
  Deploy in `functions/.env` geschrieben

Für StudioChat müsste man also keine neue Infrastruktur bauen, sondern nur
neue Funktionen nach demselben Muster ergänzen.

---

## Was wirklich Sinn ergibt

Sortiert nach **Nutzen geteilt durch Aufwand**. Die ersten drei sind die,
die ich empfehlen würde.

### 1. Sprachnachricht → Text ⭐ beste Idee

Jede Sprachnachricht bekommt automatisch eine Abschrift darunter.

**Warum das die stärkste Idee ist:** Sprachnachrichten sind bequem zum
*Senden*, aber lästig zum *Empfangen*. Wer 14 Studios betreut, will nicht
zwölf Mal 40 Sekunden zuhören. Mit Abschrift liest man es in Sekunden,
findet es über die Suche wieder, und wer gerade im Training steht, kann
mitlesen statt abzuspielen.

- **Aufwand:** klein. Die Aufnahme liegt bereits als Datenblock in der
  Nachricht. Eine Function nimmt sie entgegen, schickt sie an Gemini und
  schreibt das Ergebnis in dasselbe Dokument (Feld `transcript`).
- **Auslöser:** Firestore-Trigger auf neue Nachrichten mit `audio`
- **Anzeige:** grauer Text unter dem Abspieler, klein, aufklappbar

### 2. Tagesbericht für den Chef ⭐

Einmal am Abend eine Zusammenfassung: Was ist heute in allen Studios
passiert? Drei bis fünf Sätze, keine Zahlenwüste.

> „In Hürth und Brühl wurde alles abgehakt. In Porz sind seit drei Tagen
> vier Aufgaben offen, darunter zwei überfällige. Anna hat gemeldet, dass
> der Wischmopp kaputt ist. Insgesamt fehlen 23 Handtücher, überwiegend
> in Brühl."

- **Aufwand:** klein bis mittel. Die Daten liegen alle schon vor — es geht
  nur darum, sie zusammenzufassen statt aufzulisten.
- **Auslöser:** geplante Function, z. B. 19:00 Uhr (wie `birthdayGreetings`)
- **Zustellung:** als Ankündigung, per Push oder per E-Mail

### 3. Aufgaben aus normaler Sprache erzeugen ⭐

Der Chef tippt oder spricht:

> „Bitte bis Freitag in allen Studios die Geräte desinfizieren und die
> Handtücher zählen"

Die App schlägt zwei fertige Aufgaben vor — mit Titel, Frist Freitag,
allen 14 Studios angehakt. Der Chef prüft und bestätigt.

- **Aufwand:** mittel. Die KI liefert strukturierte Daten zurück, die App
  füllt damit das bestehende Formular.
- **Wichtig:** Es wird **vorgeschlagen, nicht angelegt.** Der Chef sieht,
  was passieren würde, und drückt auf Bestätigen. Eine KI, die ungefragt
  in 14 Studios Aufgaben verteilt, verliert schnell das Vertrauen.

### 4. Notizen automatisch in Aufgaben verwandeln

„Wischmopp ist kaputt, bitte neuen bestellen" in den Putzplan-Notizen →
Vorschlag für eine Material-Aufgabe.

- **Aufwand:** mittel. Gleiches Muster wie Nummer 3.
- **Nutzen:** Notizen gehen heute leicht unter.

### 5. Material-Vorhersage

„Handtücher in Rath reichen noch etwa zwei Wochen."

- **Aufwand:** mittel. Die Wochen-Sicherungen im Archiv sind die
  Datengrundlage — je länger die App läuft, desto besser wird das.
- **Ehrliche Einschätzung:** Dafür braucht es dafür gar keine KI. Ein
  simpler Mittelwert über die letzten Wochen tut es genauso und ist
  nachvollziehbarer. Ich würde das **ohne** KI bauen.

### 6. Fragen über die eigenen Daten stellen

„Wann hat Anna zuletzt die Böden gewischt?" — freie Frage, freie Antwort.

- **Aufwand:** groß. Braucht ein Verfahren, das erst die passenden Daten
  heraussucht und dann fragt (Retrieval). Sonst müsste man die halbe
  Datenbank mitschicken.
- **Ehrliche Einschätzung:** klingt beeindruckend, wird aber selten
  benutzt und ist am schwersten verlässlich zu bekommen. **Zuletzt**, wenn
  überhaupt.

### 7. Formulierungshilfe für Ankündigungen

Stichpunkte rein, freundlicher Text raus.

- **Aufwand:** sehr klein.
- **Ehrliche Einschätzung:** nett, aber niemand wird deswegen die App
  öffnen. Mitnehmen, wenn ohnehin gebaut wird.

---

## Was technisch nötig wäre

| Punkt | Stand heute | Zu tun |
|---|---|---|
| KI-Zugang | ✅ `GEMINI_API_KEY` hinterlegt | Prüfen, ob das Kontingent reicht |
| Sicheres Aufrufmuster | ✅ existiert (`marketingChat`) | Übernehmen |
| Cloud Functions | ✅ laufen, Deploy automatisch | Neue Functions ergänzen |
| Kostenbremse | ❌ fehlt | **Muss gebaut werden** — siehe unten |
| Rechtliches | ❌ offen | **Der eigentliche Knackpunkt** — siehe unten |

### Kostenbremse — nicht optional

Ohne Begrenzung kann ein Fehler in einer Schleife über Nacht hohe Kosten
verursachen. Nötig wäre:

- Zähler pro Benutzer und Tag in einer Sammlung `aiUsage`
- Obergrenze in der Function selbst, nicht nur in der Oberfläche
- Budget-Alarm in der Google Cloud Console (schickt eine Mail bei z. B. 5 €)

### Was es kostet

Bei eurer Größe: **sehr wenig.** Ein Tagesbericht über 14 Studios ist
ungefähr so viel Text wie zwei Seiten — das kostet Bruchteile von Cent.
Selbst 50 Sprachnachrichten am Tag plus täglicher Bericht landen
größenordnungsmäßig im Bereich weniger Euro pro Monat.

**Aber:** Die genauen Preise ändern sich, und ich kenne den aktuellen
Stand nicht sicher. Vor einer Entscheidung bitte die aktuelle Preisliste
von Google prüfen und einen Budget-Alarm setzen. Meine Zahl ist eine
Größenordnung, keine Zusage.

---

## Der eigentliche Knackpunkt: Datenschutz

Das ist **kein Nebenaspekt**, sondern die Frage, an der es hängt. StudioChat
ist eine Mitarbeiter-App in Deutschland. Sobald KI ins Spiel kommt, werden
personenbezogene Daten von Beschäftigten an einen Dritten übertragen.

Konkret bei den Ideen oben:

- **Sprachnachricht → Text:** Die Stimme eines Mitarbeiters geht an Google.
  Stimme ist ein biometrisches Merkmal — das ist heikler als Text.
- **Tagesbericht:** Enthält Namen und Leistungsdaten („Anna hat 12 Aufgaben
  erledigt, Ben 3"). Das ist Verhaltens- und Leistungskontrolle.
- **Aufgaben erzeugen:** Am unproblematischsten — meist keine Personendaten.

### Was ihr braucht

1. **Auftragsverarbeitungsvertrag (AVV)** mit Google für den KI-Dienst
2. **Verzeichnis von Verarbeitungstätigkeiten** ergänzen
3. **Mitarbeiter informieren** — transparent, vorher, schriftlich
4. **Betriebsrat beteiligen**, falls vorhanden. Leistungs- und
   Verhaltenskontrolle ist mitbestimmungspflichtig (§ 87 BetrVG). Auch ohne
   Betriebsrat ist der Tagesbericht mit Namensnennung heikel.
5. **Datenschutz-Folgenabschätzung** prüfen — bei biometrischen Daten
   (Stimme) und Beschäftigtendaten liegt das nahe
6. **Freiwilligkeit:** Sprachabschrift sollte abschaltbar sein

> ⚠️ Ich bin kein Anwalt und das ist keine Rechtsberatung. Bevor
> Mitarbeiterdaten an eine KI gehen, sprich mit jemandem, der das
> beurteilen kann — bei 14 Studios lohnt sich eine Stunde Beratung.

### Ein Weg, der vieles entschärft

**Namen vor dem Senden entfernen.** Statt „Anna hat die Böden gewischt"
schickt man „Mitarbeiter A hat die Böden gewischt" und setzt die Namen
danach wieder ein. Die KI sieht nie, wer gemeint ist.

Das funktioniert gut für den Tagesbericht und für Aufgaben. Für die
Sprachabschrift funktioniert es **nicht** — die Stimme lässt sich nicht
anonymisieren.

---

## Empfehlung

**Schritt 1 — jetzt, ohne KI:** Material-Vorhersage als einfache
Durchschnittsrechnung. Kein Datenschutzthema, keine laufenden Kosten,
sofort nützlich.

**Schritt 2 — nach dem Rechts-Check:** Tagesbericht für den Chef, mit
anonymisierten Namen. Größter Nutzen bei überschaubarem Risiko.

**Schritt 3 — wenn Schritt 2 gut läuft:** Aufgaben aus Sprache erzeugen,
immer als Vorschlag zum Bestätigen.

**Schritt 4 — nur mit ausdrücklicher Zustimmung jedes Einzelnen:**
Sprachnachricht → Text. Die nützlichste Funktion, aber auch die mit dem
höchsten Datenschutzgewicht. Als Wahlmöglichkeit im Profil, standardmäßig
aus.

**Nicht bauen:** Freie Fragen über die Datenbank. Viel Aufwand, wenig
Verlässlichkeit, und es lädt dazu ein, Fragen zu stellen, die man über
Mitarbeiter nicht stellen sollte.

---

## Was ich als Nächstes bräuchte

Wenn du das angehen willst:

1. Deine Entscheidung, **welche** Funktion zuerst
2. Klärung der Datenschutzfrage — mindestens für die Funktionen mit
   Personenbezug
3. Ein Budget-Limit, das du setzen möchtest (z. B. 10 € im Monat)

Dann baue ich es nach demselben Muster wie die bestehende Marketing-KI:
Schlüssel auf dem Server, Aufruf über eine Function, Zähler gegen
Kostenüberraschungen, und alles Wichtige weiterhin vom Menschen bestätigt.
