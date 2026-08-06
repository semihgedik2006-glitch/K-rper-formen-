# E-Mail-Versand einrichten

Ohne diese Einrichtung versendet StudioChat **keine** E-Mails. Betroffen sind:

- der **Monatsbericht** an den Chef (automatisch am Monatsersten)
- die **Termin-Mails** an Kunden aus `wachstum.html` — Bestätigung, Erinnerung,
  Follow-up und Storno

Die App selbst funktioniert ohne SMTP vollständig weiter. Es fehlen nur die
E-Mails.

---

## Kurzfassung

Fünf Werte als GitHub-Secrets hinterlegen, Workflow einmal laufen lassen,
fertig. Dauert etwa zehn Minuten.

| Secret | Beispiel |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `deine@adresse.de` |
| `SMTP_PASS` | das App-Passwort |
| `MAIL_FROM` | `deine@adresse.de` |

Eintragen unter:
**https://github.com/semihgedik2006-glitch/K-rper-formen-/settings/secrets/actions**
→ *New repository secret*

---

## Welchen Anbieter nehmen?

### Zum Ausprobieren: Gmail

Am schnellsten eingerichtet, kostenlos, etwa 500 Mails pro Tag.

**Gut für:** den Monatsbericht an dich selbst.

**Weniger gut für:** Mails an Kunden. Eine Terminbestätigung von
`semihgedik2006@gmail.com` wirkt nicht wie von einem Unternehmen mit
14 Studios — und landet häufiger im Spam.

### Für Kunden-Mails: die eigene Domain

Wenn Körperformen eine Geschäftsadresse hat (IONOS, Strato, All-Inkl, Google
Workspace …), nimm deren SMTP-Zugang. Die Zugangsdaten stehen im Kundenbereich
des Anbieters unter „E-Mail" oder „Postfach".

**Vorteil:** Absender ist eure eigene Domain, bessere Zustellung, professioneller
Auftritt.

### Alternative: ein Versanddienst

Brevo, Resend oder Mailjet haben kostenlose Kontingente (etwa 300 Mails am Tag)
und sind auf Zustellbarkeit ausgelegt. Lohnt sich, sobald regelmäßig Kunden
angeschrieben werden.

> **Empfehlung:** Jetzt mit Gmail einrichten, damit du den Bericht endlich
> siehst. Bevor die Termin-Mails an echte Kunden gehen, auf die eigene Domain
> umstellen — dafür müssen nur die fünf Werte ausgetauscht werden.

---

## Gmail einrichten (Schritt für Schritt)

### 1. Bestätigung in zwei Schritten einschalten

App-Passwörter gibt es nur mit aktivierter Zwei-Faktor-Anmeldung.

**https://myaccount.google.com/security** → *Bestätigung in zwei Schritten*

Ist sie schon an, weiter zu Schritt 2.

### 2. App-Passwort erzeugen

**https://myaccount.google.com/apppasswords**

- Name eingeben, z. B. `StudioChat`
- Auf *Erstellen* tippen
- Google zeigt **16 Zeichen in vier Vierergruppen** an, z. B. `abcd efgh ijkl mnop`

> **Die Leerzeichen weglassen.** Einzutragen ist `abcdefghijklmnop`.
> Das Passwort wird nur einmal angezeigt — also gleich kopieren.

Das ist **nicht** dein normales Google-Passwort. Es gilt nur für diesen einen
Zweck und lässt sich jederzeit einzeln widerrufen.

### 3. Die fünf Secrets anlegen

**https://github.com/semihgedik2006-glitch/K-rper-formen-/settings/secrets/actions**

Für jeden Wert einmal *New repository secret*:

```
SMTP_HOST   smtp.gmail.com
SMTP_PORT   587
SMTP_USER   semihgedik2006@gmail.com
SMTP_PASS   abcdefghijklmnop        (dein App-Passwort, ohne Leerzeichen)
MAIL_FROM   semihgedik2006@gmail.com
```

`MAIL_FROM` muss bei Gmail dieselbe Adresse sein wie `SMTP_USER` — Google
lässt keinen fremden Absender zu.

### 4. Neu deployen

**https://github.com/semihgedik2006-glitch/K-rper-formen-/actions**
→ *Cloud Functions deployen* → *Run workflow*

Nach ein bis zwei Minuten ist es aktiv.

### 5. Ausprobieren

In StudioChat: **Verwaltung → Chef → ⚙️ System → „Testbericht jetzt senden"**

---

## Prüfen, ob es geklappt hat

Der Workflow schreibt es jetzt selbst ins Protokoll. Unter *Actions* den
letzten Lauf öffnen, Job *deploy*, Schritt **„Prüfen, ob der E-Mail-Versand
eingerichtet ist"**:

- `SMTP-Zugangsdaten sind hinterlegt.` → passt
- gelbe Warnung → mindestens ein Wert fehlt

---

## Wenn es nicht klappt

**„Der E-Mail-Versand ist noch nicht eingerichtet"**
Mindestens einer der Werte `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` fehlt oder ist
leer. Achtung: nach dem Anlegen eines Secrets muss der Workflow **erneut**
laufen — bestehende Functions bekommen den Wert nicht rückwirkend.

**„Kein Chef-Konto mit hinterlegter E-Mail-Adresse gefunden"**
Der Versand steht, aber im Benutzerprofil fehlt die Adresse. In der
Firebase-Konsole unter *Firestore → users → dein Konto* das Feld `email`
prüfen.

**`Invalid login: 535-5.7.8 Username and Password not accepted`**
Das App-Passwort stimmt nicht. Häufigste Ursache: die Leerzeichen wurden
mitkopiert. Neu erzeugen und ohne Leerzeichen eintragen.

**`Missing credentials for "PLAIN"`**
`SMTP_USER` oder `SMTP_PASS` ist leer.

**Die Mail kommt nicht an**
Zuerst im Spam-Ordner nachsehen. Bei Gmail als Absender landen automatisch
erzeugte Mails dort besonders oft — ein weiterer Grund, für Kunden-Mails auf
die eigene Domain zu wechseln.

---

## Sicherheit

Die Zugangsdaten liegen als GitHub-Secrets und werden erst beim Deploy in
`functions/.env` geschrieben. Sie stehen **nicht** im Code und sind für niemanden
sichtbar, der das Repository liest.

Deshalb gilt weiterhin: **Cloud Functions nicht vom eigenen Rechner deployen**
(siehe `DEPLOY.md`). Dort fehlt die `.env`, und die Werte gingen dabei verloren.
