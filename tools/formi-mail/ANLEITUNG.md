# Formi per Mail einrichten (kostenlos, ca. 15 Minuten)

Formi bekommt ein eigenes Gmail-Postfach. Ein kleines Google-Skript in
diesem Postfach schaut alle 5 Minuten nach neuen Mails, fragt Formi und
antwortet im selben Verlauf. Über dasselbe Skript verschickt Formi Mails
aus der App.

Kosten: keine. Grenzen von Google für ein normales Gmail: rund 100
verschickte Mails am Tag, 20 000 Abrufe am Tag. Formi selbst begrenzt
auf 10 Mails je Absender und 150 insgesamt am Tag.

> **Nie** einen Schlüssel in diesen Ordner, in den Code oder in einen
> Chat schreiben. Das Repository ist öffentlich.

## 1. Postfach anlegen
Ein neues Google-Konto anlegen, z. B. `formi.koerperformen@gmail.com`.
Dieses Postfach nutzt nur Formi.

## 2. Einen Schlüssel ausdenken
Eine lange, zufällige Zeichenfolge (mind. 32 Zeichen), z. B. aus einem
Passwort-Manager. Sie kommt an **zwei** Stellen hin, **nirgends sonst**:
- in GitHub (Schritt 5) als `FORMI_MAIL_TOKEN`
- im Skript (Schritt 3) als `FORMI_TOKEN`

## 3. Das Skript anlegen
1. Im Formi-Konto angemeldet: <https://script.google.com> → „Neues Projekt",
   Name „Formi Mail".
2. Den ganzen Inhalt von `tools/formi-mail/Code.gs` einfügen (den
   Beispielcode ersetzen) und speichern.
3. Links „Projekteinstellungen" (Zahnrad) → ganz unten
   „Skripteigenschaften" → „Eigenschaft hinzufügen":
   - `FORMI_TOKEN` = der Schlüssel aus Schritt 2
4. Oben die Funktion `einrichten` auswählen → „Ausführen". Google fragt
   nach Berechtigungen (Gmail lesen/senden, externe Abrufe, Trigger) —
   das ist das eigene Formi-Konto, also zulassen.

## 4. Als Web-App bereitstellen (für Mails aus der App)
„Bereitstellen" → „Neue Bereitstellung" → Typ „Web-App":
- Ausführen als: **Ich** (das Formi-Konto)
- Zugriff: **Jeder**

Die angezeigte Web-App-URL (endet auf `/exec`) kopieren. „Jeder" ist
nötig, damit die Cloud Function sie erreicht — ohne den Schlüssel
verschickt sie nichts.

## 5. In GitHub eintragen
Repository → Settings → Secrets and variables → Actions → „New repository
secret":
- `FORMI_MAIL_TOKEN` = der Schlüssel aus Schritt 2
- `FORMI_MAIL_URL` = die Web-App-URL aus Schritt 4

Danach einmal die Functions ausrollen (Actions → „Cloud Functions deployen" →
„Run workflow"), damit sie die neuen Werte kennen.

## 6. Leitungs-Code festlegen
In der App: Formi öffnen → oben „Persönlichkeit" → „Mail-Code der
Leitung" (sieht nur die Geschäftsführung). Mindestens 8 Zeichen. Wer ihn
in eine Mail schreibt, legt per Mail Aufgaben und Ankündigungen an:

```
Code: DeinCode
Aufgabe für Hürth: Wasserspender auffüllen bis Freitag
```

Formi antwortet mit dem, was angelegt wurde. Fünf falsche Codes an einem
Tag → für den Rest des Tages werden keine Codes mehr angenommen.

## Testen
Eine Mail an das Formi-Postfach schicken, z. B. „Wie wasche ich die
Westen?". Nach spätestens 5 Minuten kommt die Antwort. In der App: zu
Formi „Schreib eine Mail an …@… : …" sagen → Entwurf → „Senden".

## Wer darf schreiben?
Jeder, der die Adresse kennt (so entschieden am 20.10.2026). Ohne Code
bekommt man nur Antworten aus dem Studio-Wissen — keine Teamdaten, keine
Schichtpläne, nichts aus der App. Wer die Adresse also nach aussen gibt,
gibt das Studio-Wissen nach aussen.
