# Entscheidungen zur Veröffentlichung

Antworten des Betreibers auf die 18 Fragen aus
`StudioChat-Startklar.pdf`, handschriftlich, übermittelt am 26.10.2026.
Was daraus folgt, steht je Frage dabei. Offen ist nur F13.

| # | Frage (kurz) | Antwort | Was daraus folgt |
|---|---|---|---|
| F1 | Handbuch mit 115 Lösungen an fremde Studios? | **„alle mit Premium-Abo“** | Lösungen nur bei Premium (und Körperformen). **Achtung:** solange `loesungen-basis.js` öffentlich ausgeliefert wird, ist das kein Schloss — wer die Adresse kennt, lädt die Datei. Ein echtes Schloss heisst: Inhalt nur über den Server an Premium-Firmen (Baustein B3) |
| F2 | Weiss die Geschäftsführung Bescheid? | **„Ja, mein Chef weiss Bescheid und unterstützt das“** | erledigt. Empfehlung bleibt: zwei Sätze per Mail, dass das Handbuch in der App an zahlende Studios geht — das Handbuch ist Körperformen-Inhalt |
| F3 | Name der Demo-Firma | **Empfehlung passt** | „Studio Muster“, Orte Nordstadt, Südpark, Am Markt (Baustein B4) |
| F4 | Bleibt „StudioChat“? | **„können wir ändern, lass recherchieren, was möglich ist und Sinn macht“** | Recherche in `name-recherche.md` |
| F5 | Adresse der App | **„eigene Domain, aber Geld fehlt“** | Zwischenlösung ohne Kosten: eine zweite Hosting-Adresse im selben Firebase-Projekt (`<name>.web.app` statt `formenchat.web.app`). Domain später |
| F6 | Mailanbieter | **„vorerst Gmail, danach eigene“** | **Risiko für den Anwalt:** ein privates Gmail-Konto hat keinen AV-Vertrag. Über die Mails laufen Namen und Aufgaben der Beschäftigten des Kunden. In Anlage 2 muss stehen, was tatsächlich verwendet wird |
| F7 | Stripe Test oder live? | **„weiss noch nicht“** | nachsehen: Stripe-Dashboard → Schalter „Testmodus“ oben rechts; unter Entwickler → API-Schlüssel beginnt ein Testschlüssel mit `sk_test_`, ein echter mit `sk_live_` |
| F8 | Aufteilung Basic / Premium | **„passt, Formi soll aber auch zu Premium“** | Premium = Zeiterfassung, DATEV, Schulungen mit Video, Schichtplaner, Nachweise, Auswertung, Lösungen (F1), **Formi**. Formi für fremde Firmen ist ein eigener Baustein (B7), siehe unten |
| F9 | Preise 39/29 €, 69/49 € | **„ja, erstmal schon“** | Stripe-Preise so anlegen, Piloten 50 % für 6 Monate |
| F10 | Testphase mit Premium | **Ja** | Baustein B2 |
| F11 | Repository privat | **Ja, wie empfohlen** | ab dem ersten zahlenden Kunden. Vorher prüfen, wie viele Minuten die automatischen Tests im Monat brauchen und was GitHub für private Repositories frei lässt — **nicht nachgesehen** |
| F12 | Löschung nach Vertragsende | **Empfehlung passt** | 30 Tage, Werkzeug mit Vorschau und Protokoll (Baustein B5) |
| F13 | Kleinunternehmer / Steuerberater | **offen** | blockiert die erste Rechnung und die Steuereinstellung in Stripe — nicht den Bau |
| F14 | Anwalt, Paket | **Empfehlung passt** | Paket wie empfohlen. **Spannung mit F5:** Geld fehlt schon für die Domain; das Anwaltspaket ist der grössere Posten. Vorschlag: mit dem Chef besprechen, ob er Domain und Anwalt mitträgt — er trägt laut `docs/ABO-PLAN.md` den Gewinn mit |
| F15 | Support | **„Empfehlung passt, Frist auf eine Woche erhöhen, ohne Vertretung“** | Zusage: Mail, Antwort **innerhalb einer Woche**, keine Vertretung. Das gehört so in AGB und Preisblatt — eine kürzere Zusage, die nicht gehalten wird, ist schlechter. Hinweis: bei einem Ausfall ist eine Woche lang; ein Kunde wird danach fragen |
| F16 | Passwort für neuen Chef | **Empfehlung passt** | Link „Passwort setzen“ (Baustein B6) |
| F17 | EMS-Wissen für fremde Firmen | **Ja** | nach Bestätigung durch den Anwalt |
| F18 | Gibt es Interessenten? | **Ja** | **Namen fehlen noch** — wer, wie viele Studios, wie Kontakt |

---

## Formi für fremde Firmen (F8) — was dazugehört

Heute gibt es Formi nur für Körperformen (`GEHIRN_FIRMEN` in
`index.html` und `functions/index.js`). Formi läuft als Cloudflare
Worker mit eigener Datenbank und Workers AI (`tools/studio-gehirn/`).
Für fremde Firmen heisst das:

1. **Trennung im Worker:** Formis Wissen ist heute Körperformen-Wissen.
   Jede Firma braucht ihren eigenen Bereich, und Formi darf nie Wissen
   oder Gespräche einer anderen Firma verwenden.
2. **Unterauftragnehmer:** Cloudflare kommt in Anlage 2 zum AV-Vertrag
   und in die Datenschutzerklärung. Fragen und Antworten gehen dorthin.
   Ob das trägt, entscheidet der Anwalt.
3. **Kosten:** Workers AI rechnet über einem Tageskontingent nach
   Verbrauch ab. Je Firma braucht es eine Grenze.
4. **Schloss:** die Prüfung „Premium?“ gehört in den Worker, nicht nur
   in die App.

Aufwand: gross. Vorschlag: Premium startet mit allem anderen; Formi
kommt für fremde Firmen dazu, sobald 1–4 stehen. Bis dahin steht in
Premium „Formi folgt“ und nicht ein Knopf, der nichts tut.

---

## Bausteine in der Reihenfolge, in der sie gebaut werden

| # | Baustein | Befund | Stand |
|---|---|---|---|
| B1 | Firmengrenze: Kreuztest liest alle Sammlungen aus den Regeln | V8 | ✅ **26.10.2026** — 71 Pfade, alle geprüft, Gegenprobe mit erfundener Sammlung wird rot |
| B2 | Premium serverseitig (Zeiterfassung, DATEV, Schulungsvideos, Schichtplaner), Testphase als Premium | V7, V14 | offen |
| B3 | Lösungen (Handbuch) nur für Premium, Auslieferung über den Server | V5, F1 | offen |
| B4 | Demo „Studio Muster“ | V6 | offen |
| B5 | Firma endgültig löschen, mit Vorschau und Protokoll | V1 | offen |
| B6 | Neuer Chef bekommt einen Link statt eines Passworts | V16 | offen |
| B7 | Formi für fremde Firmen | F8 | offen, gross |
| B8 | Zweite Hosting-Adresse ohne „formenchat“ | V9, F5 | offen, braucht den Namen (F4) |
| B9 | AV-Vertrag in der App, AGB verweisen darauf; Support-Frist eine Woche | V2, F15 | offen |
