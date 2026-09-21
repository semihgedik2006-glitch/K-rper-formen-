# StudioChat — Prüfplan und Prüfdokumentation

**Stand:** 17. September 2026

Dieses Projekt hat **keine manuelle Testliste, die jemand abarbeitet.**
Es hat 128 ausführbare Durchläufe, die bei jeder Änderung laufen. Dieses
Dokument beschreibt, wie sie gebaut sind, was sie abdecken und — der
wichtigere Teil — **was sie nicht abdecken**.

---

## 1. Der Grundsatz: eine Prüfung ohne Gegenprobe prüft nichts

Der Satz steht in diesem Projekt an vielen Stellen im Quelltext, und er
ist der Grund, warum die Durchläufe etwas wert sind.

**Das Problem:** Eine Regel „verbiete alles" macht jeden Test grün, der
nur prüft, dass etwas **nicht** geht. Eine Funktion, die immer `null`
liefert, macht jeden Test grün, der auf „kein Treffer" prüft.

**Die Antwort:** Jeder sicherheitsrelevante Durchlauf trägt eine
**Gegenprobe** — die Maßnahme wird versuchsweise ausgehebelt, und wenn
der Durchlauf dann nicht rot wird, prüft er nichts.

Drei Beispiele aus dem Bestand:

```js
// aus tests/rules/abo-sperre.test.js
await darf('GEGENPROBE Schreiben geht überhaupt (Betrieb ohne Abo)', …);
await darfNicht('GEGENPROBE derselbe Vorgang bei nurlesen geht nicht', …);
```

```js
// aus tests/test-stripe-felder.js — die ALTE Fassung nachgebaut
const altAboId = (o) => (o && o.subscription) || null;
pruefe('GEGENPROBE die alte Fassung findet das Abo NICHT mehr',
  altAboId(rechnungHeute) === null && aboIdAusRechnung(rechnungHeute) === 'sub_1');
```

```js
// aus tests/test-demo.js — eine Liste des ERLAUBTEN, nicht des Verbotenen
```

> Der dritte ist der lehrreichste. Der erste Anlauf suchte nach Wörtern
> wie „firestore" und „googleapis" — und schlug bei der Schriftart und
> bei der SDK-Datei selbst an. Eine Liste des Verbotenen findet nur,
> woran jemand gedacht hat. Eine Liste des Erlaubten findet jede neue
> Anfrage, auch eine, die es heute noch gar nicht gibt.

---

## 2. Was es gibt

| Art | Anzahl | Womit | Dauer |
|---|---|---|---|
| **Oberfläche** | 115 Dateien | Playwright + Chromium, gegen die echte Anwendung | ~25 Min |
| **Sicherheitsregeln** | 13 Dateien, **1.001 Zusicherungen** | Firestore-Emulator | ~2 Min |
| **Reine Rechnung** | 2 Dateien, 80 Zusicherungen | Node, ohne Browser und Datenbank | < 1 Sek |

**Gestartet wird** mit `bash tests/alle.sh` bzw.
`cd tests/rules && npm test`.

---

## 3. Die Regeltests — wo die Grenzen geprüft werden

Das ist der Teil, der wirklich Sicherheit prüft. Die Oberfläche kann man
umgehen, die Regeln nicht.

| Datei | Zusicherungen | Prüft |
|---|---|---|
| `security.test.js` | 172 | Rollenrechte, fremde Felder, Grundsperren |
| `funktionen.test.js` | 187 | die Cloud Functions gegen die Regeln |
| `kreuz.test.js` | 166 | **32 Sammlungen: kommt Betrieb A an Betrieb B?** |
| `rechte.test.js` | 110 | wer darf was, je Rolle |
| `zeitpin.test.js` | 90 | Stempel-PINs, Terminals, Zeiten |
| `kalender.test.js` | 47 | Kalender-Abo, Geheimnis je Person |
| `reaktionen.test.js` | 46 | nur die eigene Reaktion |
| `anliegen.test.js` | 45 | die erste Sammlung, die nicht jeder liest |
| `abo-sperre.test.js` | **42** | `nurlesen` und `zu` — neu am 16.9. |
| `umfragen.test.js` | 32 | nur die eigene Stimme |
| `fremde-felder.test.js` | 33 | kein Feld, das nicht erlaubt ist |
| `konten-pruefen.test.js` | 19 | das Prüfwerkzeug selbst |
| `umzug.test.js` | 12 | der Mandanten-Umzug |

**`kreuz.test.js` ist der wichtigste.** Er prüft für 32 Sammlungen, dass
ein Betrieb nicht an die Daten eines anderen kommt — lesend wie
schreibend, einzeln wie über Abfragen, jeweils mit Gegenprobe.

---

## 4. Die Oberflächen-Durchläufe nach Thema

115 Dateien. Nach Gebiet sortiert:

| Gebiet | Durchläufe |
|---|---|
| **Sicherheit** | `xss`, `xss-werbung`, `csp`, `passwort`, `beitritt`, `zugang-rolle`, `firma-stillgelegt`, `nebenseiten` |
| **Abo und Kasse** | `abo-leiter`, `abo-stufe`, `stripe-felder`, `paywall`, `demo-abo` |
| **Zeiterfassung** | `terminal`, `zeitpin`, `handy-stempeln`, `meine-zeiten` |
| **Gestaltung** | `gestaltung`, `knoepfe`, `fingerziele`, `abgeschnitten`, `quer`, `rahmen`, `marker`, `neu-design`, `neu-messlatte` |
| **Bereiche** | `chat-bereich3`, `aufgaben-bereich4`, `material-bereich5`, `geraete-bereich6`, `team-bereich7`, `dokumente-bereich8`, `verwaltung-bereich9`, `einstellungen-bereich10` |
| **Demo und Auslieferung** | `demo`, `ausliefern`, `konfig`, `lizenzen`, `nachladen`, `schriften` |
| **Server** | `funktionen-pfade`, `funktionen-schalter`, `mail-versand`, `sheets`, `sicherung`, `kalender` |
| **Recht** | `recht`, `recht-firma` |
| **Alltag** | `alltag`, `all`, `final`, `oberflaeche`, `ui`, `navigation` |

**Fünf davon sind Messungen, keine Prüfungen** und deshalb besonders
wertvoll:

* `abgeschnitten` — sucht abgeschnittenen Text bei drei Breiten
* `fingerziele` — misst, ob jedes Ziel groß genug ist (≥ 44 px)
* `neu-messlatte` — fährt drei Durchläufe **ein zweites Mal** mit
  `?neu=1`
* `schriften` — schreibt jede Anfrage der geladenen Seite mit und misst
  die Breite desselben Textes in Barlow und in einer nicht existierenden
  Schrift (seit 17.9.2026)
* `demo-abo` — misst die Abo-Karte in allen zehn Zuständen und die
  Demo-Leiste auf vier Breiten. **Fragt die gerechnete Darstellung, nicht
  den Text:** dass „Zahlung offen" und „Seit 14 Tagen" ineinanderliefen,
  konnte `textContent` nicht sehen — es liest beides zusammen (seit
  21.9.2026)

> **`neu-messlatte` entstand aus einem Fund, der teuer hätte werden
> können:** 109 grüne Durchläufe sagten nichts über das neue Design
> aus, weil keiner es je geladen hatte.

---

## 5. Prüffälle im Einzelnen — die wichtigsten

Nach dem Schema, das ein Prüfer erwartet.

### T-01 · Betrieb A kommt nicht an Betrieb B

| | |
|---|---|
| **Datei** | `tests/rules/kreuz.test.js` |
| **Voraussetzung** | Zwei Betriebe mit je einem Chef und einem Mitarbeiter |
| **Schritte** | Für jede der 32 Sammlungen: lesen, schreiben, abfragen — als Chef von A auf Daten von B |
| **Erwartet** | Jeder Zugriff wird abgewiesen |
| **Gegenprobe** | Chef von B liest sein eigenes — muss gehen |
| **Ergebnis** | **166 bestanden, 0 gefallen** (17.9.2026) |

### T-02 · Nur-Lesen sperrt jedes Schreiben

| | |
|---|---|
| **Datei** | `tests/rules/abo-sperre.test.js` |
| **Voraussetzung** | Vier Betriebe: ohne Abo, `gratis`, `nurlesen`, `zu` |
| **Schritte** | Lesen und Schreiben in allen vier, als Mitarbeiter und als Chef |
| **Erwartet** | Lesen überall; Schreiben nur in den ersten beiden |
| **Besonders** | **Kein Abo-Eintrag = voller Zugriff.** Am Tag der Auslieferung hat kein Bestandskunde einen Eintrag |
| **Gegenprobe** | Derselbe Vorgang, gleicher Aufrufer, gleiche Daten — nur anderer Betrieb |
| **Ergebnis** | **42 bestanden, 0 gefallen** |

### T-03 · Die Mahnleiter rechnet richtig

| | |
|---|---|
| **Datei** | `tests/test-abo-leiter.js` |
| **Voraussetzung** | keine — reine Rechnung, ohne Datenbank |
| **Schritte** | Jede Stufe an ihrem ersten Tag **und am Tag davor** |
| **Erwartet** | 0→fällig, 7→mahnung1, 14→mahnung2, 21→nurlesen, 35→zu |
| **Besonders** | Die kurze Leiter muss **früher** sperren als die lange — sonst ist eine Kündigung günstiger als das Abo |
| **Ergebnis** | **48 bestanden, 0 gefallen** |

### T-04 · Stripe-Felder in beiden Formen

| | |
|---|---|
| **Datei** | `tests/test-stripe-felder.js` |
| **Anlass** | Fund vom 17.9.: der Haken las drei Felder, die es seit API 2025-03-31 nicht mehr gibt |
| **Schritte** | Jede Hilfsfunktion gegen alte **und** neue Nutzlast |
| **Gegenprobe** | Die **alte Fassung nachgebaut** und gegen eine heutige Nutzlast laufen lassen — sie muss versagen |
| **Ergebnis** | **32 bestanden, 0 gefallen** |

### T-05 · Die Demo fasst keine Datenbank an

| | |
|---|---|
| **Datei** | `tests/test-demo.js` |
| **Schritte** | Alle Ansichten in drei Rollen durchgehen, jede Netzanfrage mitschneiden |
| **Erwartet** | Nur eigene Adresse, Schriften, SDK-Bibliothek |
| **Besonders** | Liste des **Erlaubten**, nicht des Verbotenen |
| **Ergebnis** | grün, keine Fehler |

### T-06 · Stillgelegte Firma sperrt niemanden aus

| | |
|---|---|
| **Datei** | `tests/test-firma-stillgelegt.js` |
| **Schritte** | Vier Zustände × zwei Rollen |
| **Erwartet** | Chef → Zahlseite **mit Weg zur Kasse**; Team → Meldung |
| **Besonders** | **Bei Netzfehler wird durchgelassen.** Wer bei jedem Netzzucken aussperrt, hat eine Störung gebaut, kein Sicherheitsmerkmal |
| **Ergebnis** | grün |

### T-07 · Jeder Endpunkt prüft, wer ruft

| | |
|---|---|
| **Datei** | `tests/test-funktionen-pfade.js` |
| **Schritte** | Quelltext zerlegen, jeden `onCall`/`onRequest` prüfen |
| **Erwartet** | `requireAuth`/`Chef`/`Admin`, oder ein Geheimnis, zeitgleich verglichen |
| **Besonders** | **Keine Ausnahmeliste.** Ein neuer Endpunkt ist rot, bis jemand entscheidet |
| **Ergebnis** | grün |

### T-08 · Kein abgeschnittener Text

| | |
|---|---|
| **Datei** | `tests/test-abgeschnitten.js` |
| **Schritte** | Bei 320, 360 und 390 px jede Ansicht messen |
| **Erwartet** | Kein Element breiter als sein Behälter |
| **Ergebnis** | grün — hat zuletzt „WARTET AUF DEINE ENTSCHEIDUNG" bei 327 > 320 px gefunden |

---

## 6. Ergebnis des letzten vollständigen Laufs

**17. September 2026**

| | |
|---|---|
| Oberfläche | **115 von 115 grün** |
| Regeln | **1.001 Zusicherungen, 0 gefallen** |
| Rechnung | 80 Zusicherungen, 0 gefallen |

> **Eine Zeile sieht rot aus und ist es nicht.**
> `test-nebenseiten` gibt bewusst eine `✗`-Zeile aus — das ist die
> eingebaute Gegenprobe („wachstum.html hätte ausgeliefert 20 offene
> Zugriffe"). Der Durchlauf selbst endet grün. Wer nach `✗` greppt,
> zählt sie fälschlich als Fehler.

---

## 7. Was NICHT geprüft wird

**Der ehrlichste Abschnitt dieses Dokuments.**

| Nicht geprüft | Warum |
|---|---|
| **Echte iOS- und Android-Geräte** | geprüft wird mit Chromium unter Linux. Safari verhält sich bei `svh`, bei Tastatur-Einblendung und bei Audio anders |
| **Echte Netzbedingungen** | kein gedrosseltes Netz, kein Funkloch mitten im Schreibvorgang |
| **Last** | es gibt `test-last`, aber keine Messung mit echten gleichzeitigen Nutzern |
| **Der Livemodus von Stripe** | nie eine echte Zahlung |
| **Wiederherstellung aus der Sicherung** | nie geprobt |
| **Ein Penetrationstest durch Dritte** | nicht erfolgt. Es gibt keine ISO 27001 und keinen SOC-Bericht für StudioChat selbst — nur für die Plattform darunter |
| **Barrierefreiheit im engeren Sinn** | Fingerziele und Kontraste werden gemessen; ein Test mit Vorlesegerät fand nicht statt |
| **Die ausgelieferten Regeln in der Produktivdatenbank** | bräuchte Produktivzugriff |

---

## 8. Wie man einen neuen Durchlauf schreibt

Die Hausregeln, aus dem Bestand abgelesen:

1. **Deutsch.** Dateiname, Ausgaben, Kommentare.
2. **Erst messen, dann behaupten.** Kein „sieht gut aus" — eine Zahl.
3. **Jede Zusicherung braucht eine Gegenprobe** oder einen Nachbarwert.
   „Nach 21 Tagen nurlesen" allein wäre auch grün, wenn die Funktion
   **immer** nurlesen lieferte.
4. **Den Weg nehmen, den ein Mensch nimmt.** Nicht Innereien aufrufen —
   die Anwendung läuft in einer Kapsel, und das ist Absicht.
5. **Sagen, warum es den Durchlauf gibt.** Der Kopfkommentar nennt den
   Fund, aus dem er entstanden ist.
6. **Keine Ausnahmeliste.** „Außer X" macht einen Lauf grün und die
   Prüfung für alles Künftige wertlos.
