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

## 2. Export-Rolle fürs Dienstkonto (5 Minuten)

**Warum:** Seit dieser Runde sichert sich die Datenbank jede Nacht um 02:40
selbst, sieben Tage lang. Dafür braucht das Dienstkonto der Cloud Functions
**zwei** Berechtigungen: die Datenbank exportieren zu dürfen **und** in den
Speicher schreiben zu dürfen. Fehlt eine davon, kommt
`7 PERMISSION_DENIED: The caller does not have permission`.

Alles andere in der App ist davon nicht betroffen.

### Zuerst: welches Konto ist überhaupt gemeint?

Die App sagt es dir jetzt selbst. In der App:
**Verwaltung → System → „🛡 Jetzt zusätzlich sichern"**.

Kommt es nicht durch, steht unter dem Knopf ab sofort **die vollständige
Meldung mit dem Namen des Dienstkontos und den beiden Rollen** – rot
umrandet und markierbar. Genau diesen Namen brauchst du in Schritt 2.

Meist ist es `formenchat@appspot.gserviceaccount.com`.

### Schritt 1 — Export-Rolle

1. Öffnen: `https://console.cloud.google.com/iam-admin/iam?project=formenchat`
2. Oben rechts **„Von Google bereitgestellte Rollenzuweisungen einschließen"**
   anhaken – sonst fehlt die Zeile in der Liste.
3. Die Zeile mit dem Dienstkonto aus der Fehlermeldung suchen →
   **Stift-Symbol** am Ende der Zeile.
4. **„Weitere Rolle hinzufügen"** →
   **`Cloud Datastore Import Export Admin`**
   *(deutsch: „Cloud Datastore-Import/Export-Administrator")* → **Speichern**.

### Schritt 2 — Schreibrecht auf den Speicher

Das ist der Teil, der beim ersten Versuch gefehlt hat. Die Export-Rolle
erlaubt das Exportieren, aber nicht das **Ablegen** der Dateien.

1. Dieselbe Seite, dasselbe Dienstkonto, wieder **Stift-Symbol**.
2. **„Weitere Rolle hinzufügen"** →
   **`Storage Object Admin`**
   *(deutsch: „Storage-Objekt-Administrator")* → **Speichern**.

### Falls es dann immer noch klemmt

Die neue Fehlermeldung nennt auch den **Speicherort**, in den gesichert
werden soll – zum Beispiel `formenchat.firebasestorage.app`. Steht dort
„wurde nicht gefunden", ist der Speicher im Projekt noch gar nicht
eingerichtet:

**Firebase-Konsole → Storage → „Jetzt starten"**, Region `europe-west1`
wählen, fertig. Danach den Knopf noch einmal drücken.

> Hintergrund: Früher hieß der Standard-Speicher immer
> `<projekt>.appspot.com`. Firebase vergibt seit Ende 2024 Namen der Form
> `<projekt>.firebasestorage.app`. Die App hatte den alten Namen fest
> eingebaut und hätte selbst mit gesetzten Rollen ins Leere gesichert – das
> ist jetzt behoben: sie nimmt den Speicher, der im Projekt wirklich
> eingerichtet ist.

### Geprüft ist es, wenn …

„🛡 Jetzt zusätzlich sichern" meldet **✓ Sicherung angelegt** und nennt dabei
den Zielordner. Die Sicherungen liegen dann unter `sicherung/JJJJ-MM-TT`;
Ordner älter als sieben Tage räumt die App selbst weg.

Nach dem Speichern einer Rolle können **ein bis zwei Minuten** vergehen, bis
sie greift. Kommt der Fehler sofort wieder: kurz warten, noch einmal drücken.

---

## Danach: nichts mehr offen

| | |
|---|---|
| Apps Script eingefügt | ☐ |
| Export-Rolle gesetzt | ☐ |
| Storage-Objekt-Administrator gesetzt | ☐ |
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
