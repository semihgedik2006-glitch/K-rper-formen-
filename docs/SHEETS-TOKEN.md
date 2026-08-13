# Google-Tabelle absichern

Bis zum 13. August 2026 hat der Browser die Daten direkt an die
Apps-Script-Web-App geschickt. Deren Adresse stand in `konfig.js`, und
`konfig.js` bekommt jeder Besucher der Seite. Geprüft hat die Web-App
nichts: wer die Adresse las, konnte in die Tabelle schreiben.

Seitdem sendet die Cloud Function `sheetsPush`. Sie prüft Anmeldung und
Firma, baut die Daten neu auf und legt ein Token dazu. Das Token kennt
nur der Server.

**Damit das greift, sind zwei Handgriffe nötig, die nur du machen
kannst.** Solange sie fehlen, läuft der Abgleich weiter wie bisher — die
Tabelle nimmt dann eben noch alles an.

---

## Die Reihenfolge zählt

Erst das Token dem Server geben, dann das Skript darauf einstellen.
Andersherum weist die Web-App die Sendungen des Servers ab und die
Tabelle bleibt stehen, bis der zweite Schritt fertig ist.

---

## Schritt 1 — Token erzeugen und bei GitHub hinterlegen

Ein Token ist eine lange Zufallszeichenkette. Zum Beispiel diese Form:
30 Zeichen aus Buchstaben und Ziffern. Erfinde eine, oder nimm eine aus
einem Passwortgenerator.

1. GitHub → das Repo → **Settings** → **Secrets and variables** →
   **Actions** → **New repository secret**
2. Name: `SHEETS_TOKEN`, Wert: dein Token → **Add secret**
3. Noch ein Secret: Name `SHEETS_URL`, Wert die Web-App-Adresse
   (`https://script.google.com/macros/s/…/exec`).
   Optional — ohne dieses Secret nimmt die Function die bisherige
   Adresse. Nötig ist es, wenn du eine **neue** Bereitstellung anlegst.
4. GitHub → **Actions** → *Cloud Functions deployen* → **Run workflow**.
   Dauert etwa vier Minuten.

Danach schickt die Function das Token mit. Die Web-App ignoriert es
noch — sie kennt es ja nicht.

## Schritt 2 — Token im Apps Script hinterlegen

1. Die Google-Tabelle öffnen → **Erweiterungen** → **Apps Script**
2. Den Inhalt von `tools/MATERIAL-SHEETS.gs` komplett einfügen (alten
   Code ersetzen) und speichern
3. **Bereitstellen** → **Bereitstellungen verwalten** → Stift →
   Version: *Neue Version* → **Bereitstellen**.
   Die Adresse bleibt dabei gleich.
4. Links **Projekteinstellungen** (Zahnrad) → ganz unten
   **Skripteigenschaften** → **Skripteigenschaft hinzufügen**
   * Eigenschaft: `STUDIOCHAT_TOKEN`
   * Wert: dasselbe Token wie in Schritt 1
   * **Skripteigenschaften speichern**

Ab diesem Moment wirft die Web-App jede Sendung ohne dieses Token weg.

---

## Prüfen, ob es sitzt

In der App als Chef: **Verwaltung → System → Tabellen abgleichen**. Läuft
der Abgleich durch und stehen die Studios in der Tabelle, passt beides
zusammen.

Kommt nichts an, steht der Grund im Protokoll der Function:
Firebase-Konsole → Functions → `sheetsPush` → Protokolle.

| Meldung | Bedeutung |
|---|---|
| `Fehler: Token` | Die beiden Token sind nicht identisch. Meist ein Leerzeichen am Ende. |
| `HTTP 401` / `HTTP 403` | Die Bereitstellung steht nicht mehr auf „Zugriff: Jeder". |
| gar keine Zeile | Die App ruft nicht auf: steht `sheetsAbgleich` in `konfig.js` auf `true`? |

## Token wechseln

Erst das GitHub-Secret ändern und die Functions ausrollen, dann die
Skripteigenschaft. Dazwischen laufen beide Werte kurz auseinander und
der Abgleich pausiert; die nächste Änderung holt ihn nach, spätestens
der Knopf im Verwaltungsbereich.

---

## Was das nicht abdeckt

Wer in der App angemeldet und freigeschaltet ist, kann weiterhin
schreiben, was er in Material und Putzplan einträgt — das ist der Zweck
der Tabelle. Die Grenze verläuft zwischen *angemeldet* und *jeder im
Internet*, nicht innerhalb des Teams.

Gelesen werden konnte die Tabelle über die Web-App noch nie: `doGet`
gibt eine feste Zeile zurück, keine Daten.
