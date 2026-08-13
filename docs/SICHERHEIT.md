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
| Google-Tabelle: offener Schreibweg | 🟠 **offen, siehe unten** |
| Cloud Functions: Berechtigung je Endpunkt | ✅ 14 von 14 |
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

## 🟠 Offen: die Google-Tabelle nimmt Daten von jedem an

Die App schiebt Material und Putzplan in eine Google-Tabelle. Das läuft
über eine Apps-Script-Web-App, deren Adresse in `konfig.js` steht — und
`konfig.js` wird an jeden Besucher ausgeliefert.

`doPost` in `tools/MATERIAL-SHEETS.gs` prüft **nichts**. Wer die Adresse
aus dem Quelltext liest, kann:

* beliebige Studios und Artikel in die Tabelle schreiben,
* freien Text in das Notizblatt setzen,
* durch wiederholte Aufrufe das Tageskontingent von Apps Script
  (rund 90 Minuten) aufbrauchen und damit den echten Abgleich lahmlegen.

**Was NICHT geht:** lesen. `doGet` gibt eine feste Zeile zurück, keine
Daten. Und an Firestore kommt darüber niemand — die Tabelle ist eine
Kopie, kein Zugang.

**Warum es sich nicht schnell zunageln lässt:** der Browser sendet mit
`mode:'no-cors'` direkt an die Web-App. Jedes Geheimnis, das der Browser
mitschicken könnte, stünde in `konfig.js` und wäre damit genauso öffentlich
wie die Adresse. Ein Token im Client ist hier Theater.

**Der richtige Weg** ist, den Abgleich vom Browser auf den Server zu
verlegen: eine Cloud Function schickt die Daten, das Geheimnis liegt in
`functions/.env`, und `doPost` weist alles ohne dieses Geheimnis ab.
Aufwand rund eine Sitzung, dazu einmal Apps Script neu bereitstellen.

**Bis dahin gilt:** der Schaden ist auf die Tabelle begrenzt und
reversibel — der nächste echte Abgleich überschreibt die betroffenen
Studios wieder.

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

**Cloud Functions.** Alle 14 Endpunkte prüfen die Berechtigung:
sieben `requireAdmin`, drei `requireChef`, zwei `requireAuth`, zwei
HTTPS-Auslöser mit Geheim-Schlüssel.

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
tests/rules/rechte.test.js     23 Prüfungen, davon 4 Gegenproben
tests/rules/security.test.js   165
tests/rules/kreuz.test.js      162
tests/rules/umzug.test.js      12
tests/rules/funktionen.test.js 83
```
