# Deployen — auch wenn GitHub streikt

Am 6. August stand GitHub Actions über eine Stunde still: jeder Lauf blieb in
der Warteschlange und wurde nach 15 Minuten abgebrochen. Beide Workflows waren
betroffen, also nichts, was sich am Code beheben lässt. Damit das nie wieder
alles aufhält, gibt es jetzt **zwei Wege**.

---

## Weg 1: automatisch (Normalfall)

Push nach `main` → GitHub deployt von selbst. Nichts zu tun.

Es laufen dann:

| Job | Was er tut |
|---|---|
| `rules` | Sicherheitsregeln (`firestore.rules`) |
| `hosting` | die App auf Firebase Hosting |
| `deploy` | die Cloud Functions |

Zusätzlich baut GitHub Pages weiter mit — die App liegt danach an zwei Adressen,
und wenn eine hakt, ist die andere trotzdem aktuell.

---

## Weg 2: von deinem Mac aus (wenn GitHub hängt)

Dauert etwa zwei Minuten und braucht **kein** GitHub.

### Einmalig einrichten

```bash
npm install -g firebase-tools
firebase login
cd ~
git clone https://github.com/semihgedik2006-glitch/K-rper-formen-.git
```

Beim Login öffnet sich der Browser — mit dem Google-Konto anmelden, das Zugriff
auf das Firebase-Projekt `formenchat` hat.

> Ist `firebase-tools` schon installiert, meldet npm eventuell einen
> Rechte-Fehler (`EACCES`). Das betrifft nur den *Update*-Versuch und ist
> egal — mit `firebase --version` prüfen, ob es da ist. Nur wenn der Befehl
> gar nicht gefunden wird, muss wirklich installiert werden.

### Bei jeder Änderung

```bash
cd ~/K-rper-formen-
git pull
firebase deploy --only hosting
```

Nach etwa 30 Sekunden ist die App live.

> **Immer `--only hosting` verwenden.**
> Ein reines `firebase deploy` würde auch die Cloud Functions mitnehmen — und
> die verlieren dabei ihre Geheimschlüssel. `SMTP_PASS`, `BDAY_TEST_KEY` und
> die übrigen Werte liegen als GitHub-Secrets und werden erst im Workflow in
> `functions/.env` geschrieben. Auf dem eigenen Rechner gibt es diese Datei
> nicht; ein Deploy von dort lädt die Functions ohne diese Werte hoch, und
> danach funktionieren Termin-Mails und Monatsbericht nicht mehr.
>
> **Faustregel: die App vom eigenen Rechner, die Functions über GitHub.**

### Einzelne Teile deployen

```bash
# nur die App (der Normalfall vom eigenen Rechner)
firebase deploy --only hosting

# nur die Sicherheitsregeln – unbedenklich, braucht keine Geheimschlüssel
firebase deploy --only firestore:rules
```

Die **Cloud Functions** bitte über GitHub deployen lassen (siehe Kasten oben).
Muss es doch einmal vom eigenen Rechner sein, vorher `functions/.env` mit allen
Werten anlegen — sonst gehen sie beim Hochladen verloren.

---

## Warum Firebase Hosting dazugekommen ist

Nicht nur wegen der Ausfälle. Es löst auch ein Problem, das es vorher dauerhaft
gab:

**GitHub Pages schickt fest `Cache-Control: max-age=600` mit.** Der Browser
liefert die App also bis zu zehn Minuten lang aus seinem eigenen Zwischenspeicher
— auch wenn längst eine neue Fassung online ist. Genau deshalb sah die App nach
einem Deploy manchmal noch alt aus.

Bei Firebase Hosting bestimmen wir das selbst (`firebase.json`):

- `index.html`, alle weiteren Seiten und `sw.js` → **nie** zwischenspeichern
- Bilder und Symbole → eine Woche zwischenspeichern (die ändern sich nie)

Damit kommt jede Änderung sofort an, sobald die App neu geladen wird.

**Kosten:** Firebase Hosting ist im kostenlosen Tarif enthalten — 10 GB Speicher
und 360 MB Übertragung pro Tag. Die App ist rund 350 KB groß; selbst bei 1000
Aufrufen am Tag sind das etwa 350 MB, und die meisten Aufrufe kommen ohnehin aus
dem Zwischenspeicher der installierten App.

---

## Welche Adresse gilt?

Nach dem ersten Hosting-Deploy ist die App zusätzlich erreichbar unter:

```
https://formenchat.web.app
```

Beide Adressen zeigen dieselbe App und dieselben Daten — es ist dasselbe
Firebase-Projekt. Du kannst also weiter die GitHub-Pages-Adresse benutzen und
die Firebase-Adresse als Ausweichlösung behalten.

**Empfehlung für später:** Wenn die eigene Domain kommt, hänge sie an Firebase
Hosting statt an GitHub Pages. Dort sind die Zwischenspeicher-Regeln richtig
gesetzt, das Zertifikat wird automatisch verlängert, und du bist nicht mehr auf
die GitHub-Warteschlange angewiesen.

---

## Wenn etwas nicht klappt

**`firebase: command not found`**
`npm install -g firebase-tools` erneut ausführen. Falls es an Rechten scheitert:
`sudo npm install -g firebase-tools`.

**`Error: Failed to get Firebase project formenchat`**
Falsches Google-Konto. `firebase logout`, dann `firebase login` mit dem
richtigen Konto.

**`HTTP Error: 403, The caller does not have permission`**
Dem Konto fehlt eine Rolle im Projekt. In der Firebase-Konsole unter
*Einstellungen → Nutzer und Berechtigungen* prüfen.

**Die Änderung ist trotzdem nicht zu sehen**
Die installierte App auf dem iPhone einmal ganz schließen (aus der
App-Übersicht hochwischen) und neu öffnen. Seit August sucht sie beim
Zurückkommen selbst nach einer neuen Fassung, aber beim allerersten Mal nach
dem Update braucht es diesen einen Neustart noch.

---

## Nach jedem Squash-Merge: `main` zurück in den Zweig

**Zweimal passiert, zweimal eine halbe Stunde gekostet, beide Male ohne
eine einzige Fehlermeldung.** Deshalb steht es hier und nicht in
jemandes Gedächtnis.

Die PRs dieses Projekts werden **als Squash** gemergt. Damit liegt der
Inhalt eines PR in `main` als **ein neuer Commit**, während der
Arbeitszweig dieselben Änderungen noch als seine eigenen trägt. Git
sieht danach beide Seiten als geändert — der Zweig steht im Konflikt
mit `main`, sobald man auf ihm weiterarbeitet.

### Warum das die Prüfungen verschluckt

Für einen **konfliktbehafteten** Pull Request kann GitHub keinen
Merge-Commit bilden. Ohne den startet es die `pull_request`-Läufe **gar
nicht erst**:

```
get_check_runs  →  {"total_count": 0, "check_runs": []}
get_status      →  {"state": "pending", "total_count": 0}
```

Das sieht aus wie „läuft noch". Es ist „läuft nie". Es gibt keine
Fehlermeldung, keine rote Zeile, nichts — der PR wartet einfach für
immer.

### Was zu tun ist

Direkt nach dem Merge, **bevor** weitergearbeitet wird:

```bash
git fetch origin main
git merge --no-edit origin/main
```

Gibt es Konflikte, sind es in aller Regel genau die Stellen, die der
gemergte PR geändert hat — beide Seiten tragen dieselbe Arbeit, der
Zweig meist in der neueren Fassung.

**Vor dem Auflösen aber nachzählen, nicht annehmen:**

```bash
git diff HEAD origin/main | grep '^+' | grep -v '^+++'
```

Steht dort nur die ältere Fassung dessen, was der Zweig geändert hat,
ist `--ours` richtig. Steht dort etwas, das der Zweig nicht kennt, ist
es das nicht.

Danach gegenprüfen, dass die aufgelöste Datei **byteweise** dieselbe ist
wie vor dem Merge — sonst misst die Regression, die vorher grün war,
etwas anderes als das, was gepusht wird:

```bash
diff -q index.html /pfad/zur/kopie-vor-dem-merge.html
```

### Woran man es erkennt, wenn es schon passiert ist

`mergeable_state` des PR steht auf `"dirty"`. Das ist die eine Stelle,
an der GitHub es überhaupt sagt.
