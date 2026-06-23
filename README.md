# Körperformen – EMS-Studio Webseite

Moderne, animierte Marketing-Webseite für ein **Körperformen** EMS-Studio –
gebaut mit **Python (Flask)** im Backend und schickem Frontend
(HTML/CSS/JS-Animationen).

Aktuell konfiguriert für den Standort **Hürth**, aber so aufgebaut, dass
weitere Standorte mit wenigen Zeilen dazukommen.

## Features

- 🎨 Edles dunkelgrün/Neon-Look im Markenstil, mit vielen Animationen
  (Hero-Text-Reveal, schwebende Karten, Scroll-Effekte, Zähler, Exit-Popup)
- 📅 **Probetraining online buchen** – Wunschtag & -zeit, geht direkt ans Studio
- ✉️ **Kontaktformular mit echtem Mail-Versand** (SMTP)
- ⭐ **Google-Bewertungen & Maps** (Karte ohne API-Key eingebettet)
- 💬 **WhatsApp-Button** (schwebend) + Instagram / Facebook / Anrufen
- 🧱 Mehrere Standorte vorbereitet (Daten zentral in `config.py`)
- 📱 Voll responsiv & barrierearm (respektiert „reduzierte Bewegung")

## Schnellstart

```bash
# 1) Abhängigkeiten installieren
pip install -r requirements.txt

# 2) Konfiguration anlegen (Mail-Zugang optional)
cp .env.example .env
#   -> .env öffnen und Werte eintragen

# 3) Server starten
python app.py
```

Dann im Browser öffnen: <http://127.0.0.1:5000>

> Ohne SMTP-Zugang funktioniert alles trotzdem – Anfragen landen dann in
> `data/leads.jsonl` und werden in der Konsole angezeigt (ideal zum Testen).

## Projektstruktur

```
app.py                  Flask-Server: Seiten + Formular-Endpunkte + Mailversand
config.py               Studio-Daten (Texte, Adresse, Team, Bewertungen …)
requirements.txt        Python-Abhängigkeiten
.env.example            Vorlage für Konfiguration / Mail-Zugang
templates/index.html    Die Seite (mit Platzhaltern pro Studio)
static/css/styles.css   Komplettes Design
static/js/main.js        Animationen + Formular-Logik
index.html              Alte, eigenständige Version (Referenz, nicht mehr genutzt)
```

## Inhalte anpassen

Fast alles steckt in **`config.py`** im Block `STUDIOS`:
Adresse, Telefon, E-Mail, Öffnungszeiten, Social-Links, Team, Bewertungen,
Buchungszeiten usw.

### Weiteren Standort hinzufügen

In `config.py` einen neuen Eintrag nach dem Vorbild `"huerth"` ergänzen,
z. B. `"koeln"`. Die Seite ist dann unter `/koeln` erreichbar.

## E-Mail-Versand einrichten

In der `.env` die SMTP-Daten deines Mail-Anbieters eintragen
(`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_TO`).
Bei Gmail wird ein **App-Passwort** benötigt (nicht das normale Passwort).

## Noch zu erledigen (vor dem Live-Gang)

- [ ] Echte Team-Fotos & Namen eintragen
- [ ] Echte Google-Bewertungen / Bewertungs-Link & Rating einsetzen
- [ ] Impressum & Datenschutz rechtssicher ausfüllen
- [ ] SMTP-Zugang hinterlegen und Test-Mail prüfen
- [ ] Für Produktion einen WSGI-Server (z. B. gunicorn) + HTTPS nutzen
```

## Hinweis

Körperformen ist eine eingetragene Marke des jeweiligen Franchise-Gebers.
Diese Seite ist für den autorisierten Studio-Betrieb gedacht; bitte die
Marken- und CI-Vorgaben des Franchise-Systems beachten.
