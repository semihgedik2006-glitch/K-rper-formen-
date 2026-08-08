# Was du machen musst

Stand 8. August 2026. Zwei Handgriffe, beide einmalig, beide kostenlos.
Zusammen rund zehn Minuten. Danach ist nichts mehr offen.

Beide brauchen **den Google-Account, der das Firebase-Projekt `formenchat`
besitzt** – also deinen.

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

## 2. Export-Rolle fürs Dienstkonto (3 Minuten)

**Warum:** Seit dieser Runde sichert sich die Datenbank jede Nacht um 02:40
selbst, sieben Tage lang. Dafür muss das Dienstkonto der Cloud Functions die
Datenbank exportieren dürfen. **Diese Berechtigung fehlt noch** – bis dahin
läuft die Sicherung jede Nacht ins Leere, ohne dass es jemand merkt.

Alles andere in der App ist davon nicht betroffen.

### So geht's

1. **IAM-Seite öffnen:**
   `https://console.cloud.google.com/iam-admin/iam?project=formenchat`
   (mit dem Google-Konto anmelden, dem das Projekt gehört)

2. In der Liste die Zeile suchen:
   **`formenchat@appspot.gserviceaccount.com`**
   *(Anzeigename meist „App Engine default service account")*

   Falls sie nicht auftaucht: oben rechts **„Von Google bereitgestellte
   Rollenzuweisungen einschließen"** anhaken.

3. Am Ende der Zeile auf das **Stift-Symbol** („Prinzipal bearbeiten").

4. **„Weitere Rolle hinzufügen"** → im Suchfeld eintippen:
   **`Cloud Datastore Import Export Admin`**
   *(auf Deutsch: „Cloud Datastore-Import/Export-Administrator")*
   → auswählen → **Speichern**.

### Geprüft ist es, wenn …

In der App: **Verwaltung → System → „🛡 Jetzt zusätzlich sichern"**.
Unter dem Knopf muss eine Erfolgsmeldung erscheinen. Kommt stattdessen ein
Fehler mit *permission* oder *PERMISSION_DENIED*, hat die Rolle noch nicht
gegriffen – zwei Minuten warten und noch einmal drücken.

Die Sicherungen landen danach unter
`gs://formenchat.appspot.com/sicherung/JJJJ-MM-TT`.
Ordner, die älter als sieben Tage sind, räumt die App selbst weg.

---

## Danach: nichts mehr offen

| | |
|---|---|
| Apps Script eingefügt | ☐ |
| Export-Rolle gesetzt | ☐ |
| „Google-Tabellen abgleichen" zeigt alle 14 Studios | ☐ |
| „Jetzt zusätzlich sichern" meldet Erfolg | ☐ |

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
