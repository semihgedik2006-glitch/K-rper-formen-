# -*- coding: utf-8 -*-
"""
Körperformen – Flask-Webseite.

Startet die Marketing-Seite und nimmt Kontakt- sowie
Probetraining-Anfragen entgegen (echter Mail-Versand + lokale Sicherung).

Starten:
    pip install -r requirements.txt
    python app.py
    -> http://127.0.0.1:5000
"""

import json
import logging
import smtplib
import ssl
from datetime import datetime
from email.message import EmailMessage
from pathlib import Path

from flask import Flask, abort, jsonify, render_template, request

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:  # python-dotenv optional, aber empfohlen
    pass

from config import DEFAULT_STUDIO, STUDIOS, get_studio, settings  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
log = logging.getLogger("koerperformen")

app = Flask(__name__)
app.config["SECRET_KEY"] = settings.SECRET_KEY

DATA_DIR = Path(__file__).parent / "data"
LEADS_FILE = DATA_DIR / "leads.jsonl"


# ------------------------------------------------------------
#  Hilfsfunktionen
# ------------------------------------------------------------
def save_lead(kind: str, data: dict) -> None:
    """Anfrage lokal als Backup speichern (eine JSON-Zeile pro Lead)."""
    DATA_DIR.mkdir(exist_ok=True)
    record = {"typ": kind, "zeit": datetime.now().isoformat(timespec="seconds"), **data}
    with LEADS_FILE.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, ensure_ascii=False) + "\n")


def send_email(subject: str, body: str, reply_to: str | None = None) -> bool:
    """Benachrichtigung per SMTP verschicken. Gibt True bei Erfolg zurück."""
    if not settings.mail_configured:
        log.warning("SMTP nicht konfiguriert – Mail wird NICHT gesendet. "
                    "Anfrage liegt aber in %s.", LEADS_FILE)
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.MAIL_FROM
    msg["To"] = settings.MAIL_TO
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            if settings.SMTP_USE_TLS:
                server.starttls(context=ssl.create_default_context())
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.send_message(msg)
        log.info("E-Mail an %s versendet: %s", settings.MAIL_TO, subject)
        return True
    except Exception as exc:  # noqa: BLE001 – wir wollen die Seite nie crashen lassen
        log.error("E-Mail-Versand fehlgeschlagen: %s", exc)
        return False


def clean(value, max_len: int = 2000) -> str:
    return str(value or "").strip()[:max_len]


# ------------------------------------------------------------
#  Routen – Seiten
# ------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html", studio=get_studio(DEFAULT_STUDIO))


@app.route("/<slug>")
def studio_page(slug):
    if slug not in STUDIOS:
        abort(404)
    return render_template("index.html", studio=get_studio(slug))


# ------------------------------------------------------------
#  Routen – Formular-Endpunkte (JSON)
# ------------------------------------------------------------
@app.route("/api/contact", methods=["POST"])
def api_contact():
    form = request.get_json(silent=True) or request.form
    # Honeypot gegen Spam-Bots: unsichtbares Feld muss leer bleiben
    if clean(form.get("website")):
        return jsonify(ok=True), 200

    name = clean(form.get("name"), 120)
    email = clean(form.get("email"), 160)
    message = clean(form.get("message"), 4000)
    studio = clean(form.get("studio"), 60) or DEFAULT_STUDIO

    if not name or "@" not in email or not message:
        return jsonify(ok=False, error="Bitte fülle alle Felder korrekt aus."), 400

    data = {"studio": studio, "name": name, "email": email, "message": message}
    save_lead("kontakt", data)
    send_email(
        subject=f"[Körperformen {studio}] Neue Kontaktanfrage von {name}",
        body=f"Studio: {studio}\nName: {name}\nE-Mail: {email}\n\nNachricht:\n{message}",
        reply_to=email,
    )
    return jsonify(ok=True, message="Danke! Wir melden uns innerhalb von 24 Stunden. 💪"), 200


@app.route("/api/booking", methods=["POST"])
def api_booking():
    form = request.get_json(silent=True) or request.form
    if clean(form.get("website")):
        return jsonify(ok=True), 200

    name = clean(form.get("name"), 120)
    email = clean(form.get("email"), 160)
    phone = clean(form.get("phone"), 60)
    date = clean(form.get("date"), 40)
    slot = clean(form.get("slot"), 80)
    note = clean(form.get("note"), 2000)
    studio = clean(form.get("studio"), 60) or DEFAULT_STUDIO

    if not name or "@" not in email or not phone or not date:
        return jsonify(ok=False, error="Bitte Name, E-Mail, Telefon und Wunschtermin angeben."), 400

    data = {"studio": studio, "name": name, "email": email, "phone": phone,
            "date": date, "slot": slot, "note": note}
    save_lead("probetraining", data)
    send_email(
        subject=f"[Körperformen {studio}] Probetraining-Buchung von {name}",
        body=(f"Studio: {studio}\nName: {name}\nE-Mail: {email}\nTelefon: {phone}\n"
              f"Wunschtag: {date}\nWunschzeit: {slot}\n\nNotiz:\n{note or '–'}"),
        reply_to=email,
    )
    return jsonify(
        ok=True,
        message="Top! Deine Anfrage ist da – wir bestätigen deinen Termin telefonisch. 📅",
    ), 200


@app.errorhandler(404)
def not_found(_):
    return render_template("index.html", studio=get_studio(DEFAULT_STUDIO)), 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=settings.DEBUG)
