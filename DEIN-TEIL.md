# Was du machen musst

Stand 9. August 2026. Die Sicherung läuft seit heute Nacht – offen ist nur
noch die Google-Tabelle (Abschnitt E bzw. 1) und ein Wisch im Putzplan.

Beide brauchen **den Google-Account, der das Firebase-Projekt `formenchat`
besitzt** – also deinen.

---

# Schnellanleitung – Schritt für Schritt

> **Stand 9. August 2026, 03:28 Uhr: A, B, C und D sind erledigt.**
> Die Sicherung läuft – der erste Lauf von Hand hat geklappt:
> `✓ gs://formenchat.firebasestorage.app/sicherung/manuell-2026-08-09-01-28-53`
> Die nächtliche Sicherung meldet sich ab jetzt von allein, wenn sie einmal
> nicht durchkommt. **Offen sind nur noch E (Google-Tabelle) und F
> (Wischen im Putzplan).**

Der Reihe nach abarbeiten. Die Begründungen stehen weiter unten; hier steht
nur, was du klickst. **Melde dich vorher mit dem Google-Account an, dem
`formenchat` gehört.**

## A · Speicher anlegen (2 Minuten)

> Das ist die Ursache. Ohne diesen Schritt bringt alles andere nichts.

1. Öffne
   `https://console.firebase.google.com/project/formenchat/storage`
2. Knopf **„Jetzt starten"** (je nach Fassung „Erste Schritte") anklicken.
3. Es kommt ein Fenster zu den Sicherheitsregeln.
   **„Im Produktionsmodus starten"** wählen → **Weiter**.
   *(Die App liest dort nichts. Nur die Server-Funktion legt Sicherungen ab,
   und die geht an den Regeln vorbei.)*
4. Jetzt fragt er nach dem **Speicherort**. Dort muss **`europe-west1`**
   stehen (Belgien).
   - Steht es schon da und lässt sich nicht ändern: **gut so**, weiter.
   - Kannst du wählen: **`europe-west1`** nehmen.
   > ⚠️ Der Ort lässt sich später **nicht** mehr ändern. Und er muss
   > derselbe sein wie der der Datenbank, sonst verweigert der Export.
5. **Fertig** / **Erstellen** klicken. Nach ein paar Sekunden siehst du eine
   leere Dateiliste. Das ist richtig so.

**Geschafft, wenn:** oben auf der Seite ein Name wie
`gs://formenchat.firebasestorage.app` steht.

## B · Die zwei Rollen setzen (5 Minuten)

1. Öffne
   `https://console.cloud.google.com/iam-admin/iam?project=formenchat`
2. Oben rechts über der Tabelle den Haken bei
   **„Von Google bereitgestellte Rollenzuweisungen einschließen"** setzen.
   Ohne den Haken fehlt die gesuchte Zeile in der Liste.
3. In der Spalte *Hauptkonto* die Zeile
   **`formenchat@appspot.gserviceaccount.com`** suchen.
   *(Falls sie anders heißt: Der genaue Name steht in der App unter
   Verwaltung → System, wenn du den Sicherungs-Knopf drückst.)*
4. Ganz rechts in dieser Zeile auf das **Stift-Symbol** (Bearbeiten).
5. **„+ Weitere Rolle hinzufügen"** → ins Suchfeld `Import` tippen →
   **„Cloud Datastore-Import/Export-Administrator"** auswählen.
6. Noch einmal **„+ Weitere Rolle hinzufügen"** → ins Suchfeld
   `Storage-Objekt` tippen → **„Storage-Objekt-Administrator"** auswählen.
7. **Speichern**.
8. **Ein bis zwei Minuten warten.** Rollen greifen nicht sofort.

**Geschafft, wenn:** in der Zeile des Dienstkontos beide Rollen stehen.

## C · Prüfen (1 Minute)

1. App öffnen → **Verwaltung** → Reiter **System**.
2. Karte **„💾 Daten sichern"** aufklappen.
3. **„🛡 Jetzt zusätzlich sichern"** drücken → Rückfrage mit **OK**
   bestätigen.
4. Warten, bis die Meldung kommt.

- **✓ Sicherung angelegt** → fertig. Ab jetzt läuft sie jede Nacht um 2:40
  von allein.
- **Rot** → im Kasten steht der Grund im Klartext. Steht dort „fehlt die
  Berechtigung": noch eine Minute warten und noch einmal drücken.

Ab sofort steht in dieser Karte immer **„Letzte Sicherung: …"** – grün, wenn
die Nacht geklappt hat, rot mit Grund, wenn nicht. Fällt eine Nacht aus,
steht es zusätzlich ganz oben in *Überblick → Braucht Aufmerksamkeit*. Du
musst also nicht mehr danach schauen.

## D · Budget-Warnung (5 Minuten, empfohlen)

> Nicht nötig, damit etwas läuft. Aber sinnvoll, seit klar ist, dass das
> Projekt auf dem Bezahlplan Blaze liegt.

1. Öffne `https://console.cloud.google.com/billing`
2. Das Rechnungskonto anklicken, das zu `formenchat` gehört.
3. Links im Menü **„Budgets & Benachrichtigungen"**.
4. **„Budget erstellen"**.
5. Name: `StudioChat`. Weiter.
6. Bei *Betrag* **`5`** eintragen (5 € im Monat). Weiter.
7. Bei den Schwellen **50 %** und **100 %** anhaken, E-Mail an dich. Weiter.
8. **Fertigstellen**.

Danach bekommst du eine E-Mail, lange bevor irgendetwas spürbar wird.

## E · Google-Tabelle: neuen Code einfügen (5 Minuten)

Unabhängig von allem oben. Ausführlich mit Begründung in Abschnitt 1 weiter
unten – kurz:

1. `https://github.com/semihgedik2006-glitch/K-rper-formen-/blob/main/MATERIAL-SHEETS.gs`
   öffnen → **„Copy raw file"** (Symbol über dem Code rechts).
2. Die Google-Tabelle öffnen → **Erweiterungen → Apps Script**.
3. Im Editor **alles markieren** (Strg+A) → **einfügen** → **speichern**
   (Strg+S).
4. Oben rechts **„Bereitstellen" → „Bereitstellungen verwalten"** → am
   **bestehenden** Eintrag das **Stift-Symbol** → bei *Version* **„Neue
   Version"** → **„Bereitstellen"**.
   > ⚠️ Nicht „Neue Bereitstellung" anlegen. Nur beim Bearbeiten der
   > bestehenden bleibt die Adresse gleich – sie steht fest in `konfig.js`.

**Geprüft, wenn:** App → Verwaltung → System →
**„🔄 Google-Tabellen abgleichen"**, danach stehen in der Tabelle alle
**14 Studios** in *Material* und *Putzplan*.

## F · Nebenbei, wenn du im Studio bist

Einmal im **Putzplan** über eine Zeile nach rechts wischen. Bei den Aufgaben
hast du bestätigt, dass es geht; im Putzplan ist es derselbe Code, aber nie
an einem echten Gerät ausprobiert – die automatischen Durchläufe können keine
Berührungen nachstellen.

---

## 1. Google-Tabelle: neuen Code einfügen (5 Minuten)

**Warum:** Die Datei `MATERIAL-SHEETS.gs` im Projekt wurde neu geschrieben.
Die alte Fassung löschte in der Tabelle jede Zeile einzeln – bei 14 Studios
à 20 Artikeln waren das hunderte Einzelaufrufe. Apps Script erlaubt sechs
Minuten je Ausführung und rund 90 Minuten am Tag; das wurde eng, und dann
fehlten einzelne Studios in der Tabelle, **ohne dass irgendwo eine
Fehlermeldung stand**.

Die neue Fassung baut das Blatt im Speicher zusammen und schreibt es mit
einem einzigen Aufruf. Solange du sie nicht einfügst, läuft die alte weiter.

### So geht's

1. **Den neuen Code holen.**
   Im Projekt die Datei `MATERIAL-SHEETS.gs` öffnen und **komplett**
   markieren und kopieren.
   Direkt im Browser:
   `https://github.com/semihgedik2006-glitch/K-rper-formen-/blob/main/MATERIAL-SHEETS.gs`
   → Knopf **„Copy raw file"** oben rechts über dem Code.

2. **Apps Script öffnen.**
   Die Google-Tabelle öffnen, in der Material und Putzplan landen →
   Menü **Erweiterungen → Apps Script**.

3. **Alten Code ersetzen.**
   Im Editor **alles markieren** (Strg+A bzw. Cmd+A) und den kopierten Code
   **einfügen**. Dann **speichern** (Disketten-Symbol oder Strg+S).

4. **Neu bereitstellen.**
   Oben rechts **„Bereitstellen" → „Bereitstellungen verwalten"** →
   am bestehenden Eintrag das **Stift-Symbol** →
   bei *Version* **„Neue Version"** wählen → **„Bereitstellen"**.

   > **Wichtig:** unbedingt die *bestehende* Bereitstellung bearbeiten, nicht
   > eine neue anlegen. Nur so bleibt die Adresse gleich. In `konfig.js` steht
   > sie fest hinterlegt:
   > `https://script.google.com/macros/s/AKfycbygK9l443-…/exec`
   > Eine neue Bereitstellung hätte eine andere Adresse – dann käme in der
   > Tabelle gar nichts mehr an.

### Geprüft ist es, wenn …

In der App: **Verwaltung → System → „🔄 Google-Tabellen abgleichen"**.
Danach stehen in der Tabelle **alle 14 Studios** in den Blättern *Material*
und *Putzplan*, mit farbiger Kopfzeile, rot für Fehlendes und grün für
Erledigtes. Vorher fehlten oft die letzten Studios.

---

## 2. Nächtliche Sicherung zum Laufen bringen (10 Minuten)

**Warum:** Seit dieser Runde soll sich die Datenbank jede Nacht um 02:40
selbst sichern, sieben Tage lang. Sie tut es nicht. Deine Fehlermeldung sagt
warum – und das ist die eigentliche Ursache, nicht die Rolle:

> `5 NOT_FOUND: Google Cloud Storage bucket does not exist:
> formenchat.firebasestorage.app`

**Im Projekt ist überhaupt kein Speicher eingerichtet.** Es gibt also gar
keinen Ort, an den die Sicherung geschrieben werden könnte. Deshalb hilft
auch keine weitere Rolle, solange das nicht steht.

Alles andere in der App ist davon nicht betroffen und läuft normal.

### Vorab, damit es keine Überraschung gibt: dein Projekt ist auf Blaze

Ich hatte im Kopf, dass wir uns die ganze Zeit in der Gratisstufe bewegen –
du hattest gesagt, es sei keine Karte hinterlegt. Das stimmt so nicht, und du
solltest es wissen, bevor du weiterklickst:

**Das Projekt `formenchat` läuft auf dem Bezahlplan „Blaze".** Der Beleg ist
eindeutig: Cloud Functions lassen sich *nur* auf Blaze bereitstellen, und
unsere 20 Funktionen sind heute um 16:07 Uhr fehlerfrei ausgerollt worden und
laufen. Genau deshalb kam bei dir überhaupt eine Meldung aus der Funktion
zurück. Auf der Gratisstufe wäre schon der Aufruf abgewiesen worden.

Blaze heißt: irgendwo an diesem Google-Konto **hängt ein Zahlungsmittel**.
Es heißt nicht, dass etwas abgebucht wird – der Verbrauch von 14 Studios
liegt bei den meisten Diensten im monatlichen Freikontingent, und bisher ist
offensichtlich nichts angefallen. Aber die Bremse „es geht ja gar nicht,
abzubuchen" gibt es nicht.

**Empfehlung, fünf Minuten:** ein Budget mit Warnung anlegen.
`https://console.cloud.google.com/billing` → *Budgets & Benachrichtigungen* →
Budget **5 €**, Warnung bei 50 % und 100 %. Dann bekommst du eine E-Mail,
lange bevor irgendetwas spürbar wird. Du hattest gesagt, das brauchst du
nicht – die Annahme dahinter war aber, dass keine Karte hinterlegt ist.

### Schritt 1 — Speicher anlegen

1. Öffnen: `https://console.firebase.google.com/project/formenchat/storage`
2. **„Jetzt starten"**.
3. Bei der Region **`europe-west1` (Belgien)** wählen.
   > **Das muss europe-west1 sein.** Ein Firestore-Export kann nur in einen
   > Speicher am *selben* Ort geschrieben werden, und die Datenbank liegt in
   > europe-west1. Eine andere Region lehnt der Export ab.
4. Regeln: die vorgeschlagenen („nur angemeldete Nutzer") übernehmen. Die App
   liest und schreibt dort nichts – nur die Server-Funktion legt Sicherungen
   ab, und die geht an den Regeln vorbei.

**Was das kostet:** Die 5 GB, die Google umsonst gibt, gelten nur für
US-Regionen – europe-west1 wird berechnet, mit etwa **2 Cent je Gigabyte und
Monat**. Sieben Kopien dieser Datenbank sind weit unter einem Gigabyte. Das
sind **Cent-Beträge im Monat**, keine Euro. Ich sage es trotzdem dazu, weil
„kostet nichts" hier nicht mehr ganz stimmen würde.

### Schritt 2 — Die beiden Rollen fürs Dienstkonto

Erst wenn der Speicher steht, ist die Rolle überhaupt der nächste
Stolperstein. Das Dienstkonto der Cloud Functions braucht **zwei**
Berechtigungen: die Datenbank exportieren zu dürfen **und** in den Speicher
schreiben zu dürfen. Fehlt eine, kommt
`7 PERMISSION_DENIED: The caller does not have permission`.

Welches Konto gemeint ist, sagt die App selbst: **Verwaltung → System →
„🛡 Jetzt zusätzlich sichern"**. Kommt es nicht durch, steht unter dem Knopf
die vollständige Meldung mit dem Namen des Dienstkontos – rot umrandet und
markierbar. Meist ist es `formenchat@appspot.gserviceaccount.com`.

1. Öffnen: `https://console.cloud.google.com/iam-admin/iam?project=formenchat`
2. Oben rechts **„Von Google bereitgestellte Rollenzuweisungen einschließen"**
   anhaken – sonst fehlt die Zeile in der Liste.
3. Die Zeile mit dem Dienstkonto suchen → **Stift-Symbol** am Ende der Zeile.
4. **„Weitere Rolle hinzufügen"** →
   **`Cloud Datastore Import Export Admin`**
   *(deutsch: „Cloud Datastore-Import/Export-Administrator")*.
5. Noch einmal **„Weitere Rolle hinzufügen"** →
   **`Storage Object Admin`**
   *(deutsch: „Storage-Objekt-Administrator")* → **Speichern**.

Beide Rollen zusammen in einem Rutsch – die erste erlaubt das Exportieren,
die zweite das **Ablegen** der Dateien. Beim ersten Anlauf hatte ich dir nur
die erste genannt; das war mein Fehler.

Nach dem Speichern können **ein bis zwei Minuten** vergehen, bis eine Rolle
greift. Kommt der Fehler sofort wieder: kurz warten, noch einmal drücken.

### Geprüft ist es, wenn …

„🛡 Jetzt zusätzlich sichern" meldet **✓ Sicherung angelegt** und nennt dabei
den Zielordner. Die Sicherungen liegen dann unter `sicherung/JJJJ-MM-TT`;
Ordner älter als sieben Tage räumt die App selbst weg.

**Und ab jetzt musst du nicht mehr danach suchen.** Die Server-Funktion
schreibt nach jedem nächtlichen Versuch mit, ob er durchkam. Die App zeigt
das an zwei Stellen:

- in **Verwaltung → System → Daten sichern** als Zeile „Letzte Sicherung: …",
  grün bei Erfolg, rot mit dem vollständigen Grund bei einem Fehlschlag
- ganz oben in **Braucht Aufmerksamkeit**, sobald eine Nacht ausgefallen ist

Genau das hat vorher gefehlt: Der Fehler stand nur im Protokoll von Google,
und dort schaut niemand hin. Deshalb ist monatelang niemandem aufgefallen,
dass gar nicht gesichert wurde.

> Nebenbei behoben: Früher hieß der Standard-Speicher immer
> `<projekt>.appspot.com`. Firebase vergibt seit Ende 2024 Namen der Form
> `<projekt>.firebasestorage.app`. Die App hatte den alten Namen fest
> eingebaut und hätte selbst mit Speicher und Rollen ins Leere gesichert.
> Sie nimmt jetzt den Speicher, der im Projekt wirklich eingerichtet ist.

---

## Danach: nichts mehr offen

| | |
|---|---|
| Speicher in `europe-west1` angelegt | ☑ 9.8. |
| Export-Rolle gesetzt | ☑ 9.8. |
| Storage-Objekt-Administrator gesetzt | ☑ 9.8. |
| „Jetzt zusätzlich sichern" meldet Erfolg | ☑ 9.8. |
| Budget-Warnung angelegt *(0 €, meldet beim ersten Cent)* | ☑ 9.8. |
| Apps Script eingefügt | ☐ |
| „Google-Tabellen abgleichen" zeigt alle 14 Studios | ☐ |
| Wischen im Putzplan am Gerät geprüft | ☐ |

> **Zum Budget:** 0 € heißt, du bekommst die Mail beim allerersten Cent. Ein
> Budget **stoppt nichts**, es meldet nur – Google rechnet weiter. Wenn die
> Mails nerven, später auf 1 € stellen.

---

## Zwei Dinge, die du nur wissen musst

**Wischen zum Abhaken im Putzplan.** Bei den Aufgaben hast du bestätigt, dass
es funktioniert. Im Putzplan ist es derselbe Code, aber nie an einem echten
Gerät ausprobiert – die automatischen Durchläufe können keine Berührungen.
Wenn du das nächste Mal im Studio bist: einmal über eine Putzplan-Zeile nach
rechts wischen.

**Die Studio-Liste in `konfig.js`.** Neue Studios nur **hinten** anhängen.
Nie umsortieren, nie löschen – auch nicht bei einer Schließung. In der
Datenbank steht der Listenplatz, nicht der Name; wer die Reihenfolge ändert,
ordnet allen bestehenden Daten ein anderes Studio zu.
