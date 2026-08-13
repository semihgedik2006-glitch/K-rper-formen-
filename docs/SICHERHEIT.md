# Sicherheits-Durchlauf

Stand 13. August 2026. Der erste Durchlauf (12. August) ging ausschliesslich
um Firmengrenzen; dieser hier nimmt die Bereiche, die damals offen blieben.

Geprüft wurde gegen den Emulator, gegen eine echte Browserinstanz und gegen
den Quelltext. Nichts Echtes wurde angegriffen. Was nicht messbar war, steht
unten als solches.

---

## Was geprüft wurde und was dabei herauskam

| Bereich | Ergebnis |
|---|---|
| Eingeschleuster Code (XSS) | ✅ 8 Muster, keins wird zu Code |
| Rechteausweitung über `users` | ✅ 10 Wege geprüft, alle zu |
| Firmencode und Abo lesbar? | ✅ nein |
| Kundenliste aufzählbar | 🔴 **war offen — behoben** |
| Google-Tabelle: offener Schreibweg | 🟠 **war offen — umgebaut, zwei Handgriffe fehlen** |
| Cloud Functions: Berechtigung je Endpunkt | ✅ 15 von 15, jetzt bei jedem Durchlauf nachgezählt |
| Speicher (Storage) | ✅ für jeden Client gesperrt |
| Geheimnisse im Quelltext | ✅ nur öffentliche Web-Schlüssel |
| Kommentare in der ausgelieferten Datei | 🟡 Hinweis, siehe unten |
| Content-Security-Policy | 🟡 fehlt, siehe unten |

---

## 🔴 Behoben: die vollständige Kundenliste war öffentlich abrufbar

`match /firmen/{f}` stand auf `allow read: if true`. In Firestore erlaubt
`read` **beides**: ein einzelnes Dokument holen (`get`) und die ganze
Sammlung auflisten (`list`).

Damit konnte jeder — ohne Anmeldung, mit drei Zeilen in der
Entwicklerkonsole — die Liste aller Kunden abrufen: Firmenname,
Kontenzahl, Studiozahl, Anlegedatum.

Das hebelt genau die Massnahme aus, die es verhindern sollte. Kennungen
bekommen beim Anlegen eine Zufallsendung (`mueller-7f3a` statt `mueller`),
damit sich die Kundenliste nicht erraten lässt. Raten war gar nicht nötig.

**Die Reparatur** trennt die beiden Rechte:

```
allow get:  if true;               // der Anmeldebildschirm braucht den Namen
allow list: if istAdminKonto();    // die Kundenliste gehoert dem Betreiber
```

Wer die Kennung kennt, sieht weiterhin Name und Zustand seiner Firma — das
braucht der Anmeldebildschirm, bevor jemand angemeldet ist. Aufzählen darf
nur der Betreiber; `listenFirmen()` in `index.html` läuft ohnehin nur für
ihn.

Nachgewiesen in `tests/rules/rechte.test.js`, in beide Richtungen.

---

## 🟠 Umgebaut: die Google-Tabelle nahm Daten von jedem an

Die App schiebt Material und Putzplan in eine Google-Tabelle. Das lief
über eine Apps-Script-Web-App, deren Adresse in `konfig.js` stand — und
`konfig.js` wird an jeden Besucher ausgeliefert. `doPost` prüfte
**nichts**. Wer die Adresse aus dem Quelltext las, konnte:

* beliebige Studios und Artikel in die Tabelle schreiben,
* freien Text in das Notizblatt setzen,
* durch wiederholte Aufrufe das Tageskontingent von Apps Script
  (rund 90 Minuten) aufbrauchen und damit den echten Abgleich lahmlegen.

**Was nie ging:** lesen. `doGet` gibt eine feste Zeile zurück, keine
Daten. Und an Firestore kommt darüber niemand — die Tabelle ist eine
Kopie, kein Zugang.

**Warum ein Token im Browser nichts gebracht hätte:** es stünde neben
der Adresse in derselben ausgelieferten Datei.

**Der Umbau** verlegt den Abgleich auf den Server:

| vorher | jetzt |
|---|---|
| Browser → Web-App, `mode:'no-cors'` | Browser → Cloud Function `sheetsPush` → Web-App |
| Adresse in `konfig.js` | Adresse in `functions/.env` (`SHEETS_URL`) |
| kein Token | Token aus `functions/.env`, geprüft in `doPost` |
| Nutzlast wird durchgereicht | Nutzlast wird auf dem Server neu gebaut |
| Absender kommt aus dem Browser | Absender kommt aus dem Profil |
| keine Grenze | Anmeldung, Freigabe, Firma, Tagesgrenze (3000) |

Die Function nimmt nur `art: material|putzplan` und eine Studioliste an.
Alles andere fällt weg: Feldnamen, Längen und Typen stehen fest, ein
zusätzliches Feld aus dem Browser erreicht die Tabelle nicht.

**Zwei Handgriffe fehlen noch**, und sie kann nur der Betreiber machen:
das Token als GitHub-Secret hinterlegen und dieselbe Zeichenkette als
Skripteigenschaft `STUDIOCHAT_TOKEN` setzen. Solange die Eigenschaft
fehlt, nimmt die Web-App weiter alles an — bewusst so, damit zwischen
den Schritten nichts stehenbleibt. Anleitung: `docs/SHEETS-TOKEN.md`.

Nachgewiesen in `tests/rules/funktionen.test.js` (16 Prüfungen: keine
Anmeldung, keine Freigabe, fremde Firma, Token liegt bei, Absender aus
dem Profil, erfundene Felder fallen weg) und in `tests/test-sheets.js`
(der Browser ruft `script.google.com` kein einziges Mal mehr auf, mit
Gegenprobe).

---

## 🟡 Hinweis: die App liefert 157 KB Kommentar an jeden Besucher aus

`index.html` ist die App. Wer sie öffnet, hat den kompletten Quelltext,
einschliesslich aller Kommentare — davon 27 mit sicherheitsrelevantem
Inhalt: welche Prüfung nur Anzeige ist und welche eine echte Grenze, wo
eine Regel greift und wo nicht.

Das ist **kein Leck**: die Grenzen stehen in `firestore.rules` und werden
auf dem Server durchgesetzt, nicht durch Unwissen. Aber es ist eine
Wegbeschreibung für jemanden, der sucht.

Die Meta-Kommentare (Inhaltsverzeichnis, Aufbaubeschreibung, Verweise auf
Tests und Dokumentation) sind am 13.8. entfernt worden. Der Rest sind
technische Notizen am Code.

**Wer das ganz zumachen will**, braucht einen Schritt beim Ausliefern, der
die Kommentare entfernt — und damit einen Build, den es bewusst nicht gibt
(siehe `README.md`). Das ist eine Abwägung, keine offene Baustelle.

**Nachtrag vom 13.8.:** die Frage erübrigt sich weitgehend, denn **das
Repository steht auf öffentlich**. Der komplette Quelltext ist ohnehin
für jeden lesbar, mitsamt Verlauf. Für die Sicherheit ändert das nichts
an den Grenzen — die stehen in `firestore.rules` und werden auf dem
Server durchgesetzt. Es hat aber eine harte Folge:

> **Kein Geheimnis darf jemals eingecheckt werden.** Kein Token, kein
> Passwort, kein Dienstkonto-Schlüssel — auch nicht kurz, auch nicht in
> einem gelöschten Commit. Der Verlauf bleibt lesbar.

Deshalb liegen die Zugangsdaten in GitHub-Secrets und landen erst beim
Ausrollen in `functions/.env` (das in `.gitignore` steht). Das Token für
die Google-Tabelle geht denselben Weg.

---

## 🟡 Hinweis: keine Content-Security-Policy

Die App baut ihre Oberfläche mit `innerHTML`. Heute ist alles maskiert —
nachgewiesen mit acht Angriffsmustern in `tests/test-xss.js`. Eine CSP
wäre die zweite Reihe: sie würde eingeschleusten Code auch dann nicht
ausführen, wenn eine Maskierung irgendwann vergessen wird.

Sie fehlt. Einbauen hiesse `script-src` einschränken — und die App lädt
das Firebase-SDK von `gstatic.com` und Schriften von Google. Machbar, aber
eine eigene Runde mit sorgfältigem Nachmessen: eine zu enge CSP legt die
App still.

---

## Was geprüft wurde und in Ordnung war

**Eingeschleuster Code (XSS).** Acht Muster — `<img onerror>`, `<script>`,
`<svg onload>`, Ausbruch aus Attributen mit `"` und `'`,
`javascript:`-Links, `<iframe>` und ein Muster, das die
Adress-Erkennung im Chat angreift — in Chatnachrichten, Namen, Aufgaben,
Notizen, Umfragen, Dokumenten und dem schwarzen Brett. Über zwölf
Ansichten hinweg: **kein einziges wird zu Code**, alle 31 Fundstellen
bleiben Text. Gegenprobe eingebaut, damit ein Durchlauf ohne Nutzdaten
nicht als grün durchgeht.

**Rechteausweitung.** Zehn Wege, sich selbst mehr zu geben, als man hat:
`admin:true` setzen (als Mitarbeiter und als Chef), `role:'chef'`,
`firma` wechseln, Studios zuteilen, und der heikelste — ein wartendes
Konto schaltet sich selbst auf `aktiv:true` und überspringt damit die
Freigabe des Chefs. Alle zehn scheitern. Dazu vier Gegenproben, dass der
richtige Weg noch funktioniert.

**Firmencode.** Nicht lesbar, weder für Mitarbeiter noch ohne Anmeldung.
Der Vergleich in den Regeln läuft über `get()` und unterliegt den Regeln
selbst nicht.

**Abo.** Ein Mitarbeiter kommt nicht heran; ein Chef sieht seines, kann es
aber nicht auf `premium` setzen.

**Cloud Functions.** Alle Endpunkte prüfen die Berechtigung: dreizehn
Aufrufe aus der App über `requireAdmin`/`requireChef`/`requireAuth`,
zwei HTTPS-Auslöser über einen Geheim-Schlüssel. Nachgezählt wird das
jetzt bei jedem Durchlauf (`tests/test-funktionen-pfade.js`) — von Hand
sieht man den fünfzehnten nicht mehr.

**Speicher.** `allow read, write: if false` — für jeden Client gesperrt.
Dort liegt der nächtliche Vollexport der Datenbank.

**Geheimnisse.** Kein privater Schlüssel, kein Dienstkonto, kein Token im
Repo. Gefunden wurden nur Firebase-Web-Schlüssel, die öffentlich sein
sollen: sie identifizieren das Projekt, sie berechtigen zu nichts.

---

## Was dieser Durchlauf nicht kann

* **Firebase Auth selbst** — Passwortregeln, Sperren nach Fehlversuchen,
  Sitzungsdauer. Das ist Googles Seite.
* **Ob jemand ein Passwort weitergibt.** Die häufigste Art, wie so eine
  App wirklich aufgemacht wird, und keine technische Frage.
* **Bekannte Lücken in Fremdbibliotheken.** Im Einsatz sind
  Firebase JS SDK 10.12.2, firebase-admin 12.x, firebase-functions 7.x.
  Ob dafür etwas gemeldet ist, wurde hier nicht nachgeschlagen.
* **Die drei Nachbaranwendungen** (`marketing.html`, `wachstum.html`,
  `werbung.html`) sind nur oberflächlich angesehen worden: sie verlangen
  eine Anmeldung, und die serverseitigen Grenzen der KI-Funktionen liegen
  in den Cloud Functions. Ein eigener Durchlauf steht dafür aus.

---

## Belege

```
tests/test-xss.js              8 Muster · 12 Ansichten · 0 ausgeführt
tests/test-sheets.js           8 Prüfungen, davon 1 Gegenprobe
tests/test-funktionen-pfade.js 15 Endpunkte, jeder mit Berechtigungsprüfung
tests/rules/rechte.test.js     23 Prüfungen, davon 4 Gegenproben
tests/rules/security.test.js   165
tests/rules/kreuz.test.js      162
tests/rules/umzug.test.js      12
tests/rules/funktionen.test.js 99
```
