# -*- coding: utf-8 -*-
"""
Zentrale Konfiguration & Studio-Daten für die Körperformen-Webseite.

Neuen Standort hinzufügen?  Einfach unten in STUDIOS einen weiteren
Eintrag nach dem Vorbild "huerth" ergänzen – die Seite ist dann unter
/<slug> erreichbar (z. B. /koeln).  Mehr musst du nicht anfassen.
"""

import os
from urllib.parse import quote_plus


def maps_embed_url(query: str) -> str:
    """Google-Maps-Embed-URL ohne API-Key (für ein einfaches Karten-iframe)."""
    return f"https://www.google.com/maps?q={quote_plus(query)}&output=embed"


def maps_link(query: str) -> str:
    """Direktlink zu Google Maps (Routenplanung im neuen Tab)."""
    return f"https://www.google.com/maps/search/?api=1&query={quote_plus(query)}"


# ============================================================
#  STUDIOS – hier alle Standortdaten pflegen
# ============================================================
STUDIOS = {
    "huerth": {
        "slug": "huerth",
        "name": "Körperformen Hürth",
        "brand_suffix": "Hürth",          # erscheint hinter dem Logo
        "city": "Hürth",
        "badge": "EMS-Training in Hürth · Nur 20 Min / Woche",

        # Kontakt
        "address": "Krankenhausstr. 111",
        "postal_city": "50354 Hürth",
        "phone_display": "02233 966 71 81",
        "phone_tel": "+4922339667181",
        "email": "huerth@koerperformen.com",
        "hours": "Mo–Fr 8–21 Uhr · Sa 10–16 Uhr",

        # Social / Messaging
        "instagram": "https://www.instagram.com/koerperformen_huerth/",
        "facebook": "https://www.facebook.com/koerperformen.huerth/",
        # WhatsApp-Nummer im internationalen Format OHNE + und ohne Leerzeichen
        "whatsapp": "4922339667181",

        # Google
        "google_reviews_url": "https://www.google.com/search?q=Körperformen+Hürth+Bewertungen",
        "google_rating": "4,9",
        "google_rating_count": "120",

        # Bilder
        "hero_image": "https://www.xn--krperformen-rfb.com/wp-content/uploads/2020/03/emstesmal_simone.png",

        # Inhaber / Impressum
        "owner": "Marcel Almeida",

        # Statistik-Leiste im Hero
        "stats": [
            {"count": 20, "suffix": "", "label": "Minuten / Woche"},
            {"count": 10000, "suffix": "+", "label": "Zufriedene Mitglieder"},
            {"count": 98, "suffix": "%", "label": "Weiterempfehlung"},
            {"count": 12, "suffix": "", "label": "Jahre Erfahrung"},
        ],

        # Team
        "team": [
            {
                "name": "Marcel Almeida",
                "role": "Studioleiter & Head-Trainer",
                "text": "Über 12 Jahre Erfahrung in EMS-Training und Gesundheitssport. "
                        "Dein Ansprechpartner für alle Fragen rund ums Training.",
                "photo": "",
            },
            {
                "name": "[Name eintragen]",
                "role": "EMS-Spezialist & Personal Trainer",
                "text": "Zertifizierter EMS-Coach mit Fokus auf Rehabilitation, "
                        "Muskelaufbau und individuelle Trainingspläne.",
                "photo": "",
            },
            {
                "name": "[Name eintragen]",
                "role": "Ernährungsberaterin & Trainerin",
                "text": "Kombiniert EMS-Training mit Ernährungscoaching für maximale "
                        "und langfristige Ergebnisse.",
                "photo": "",
            },
        ],

        # Google-Rezensionen (echte später hier eintragen)
        "reviews": [
            {
                "stars": 5,
                "text": "In 12 Wochen habe ich mich komplett verändert – und endlich keine "
                        "Rückenschmerzen mehr. Das EMS-Training hier ist einfach unglaublich effektiv!",
                "pill": "−8 kg in 12 Wochen",
                "initials": "SK",
                "author": "Sandra K.",
                "since": "Mitglied seit 1 Jahr",
            },
            {
                "stars": 5,
                "text": "Trotz Vollzeitjob und Familie – 20 Minuten pro Woche haben mein Leben "
                        "verändert. Mehr Energie, weniger Schmerzen, bessere Laune. Klare Empfehlung!",
                "pill": "+6 kg Muskelmasse",
                "initials": "MB",
                "author": "Markus B.",
                "since": "Mitglied seit 2 Jahren",
            },
            {
                "stars": 5,
                "text": "Definierter, stärker und selbstbewusster. Ich freue mich auf jede Einheit. "
                        "Das Team ist super professionell und immer motivierend!",
                "pill": "−12 cm Bauchumfang",
                "initials": "LM",
                "author": "Lena M.",
                "since": "Mitglied seit 8 Monaten",
            },
        ],

        # Kundenstimmen (Zitat-Kacheln)
        "quotes": [
            {
                "text": "Endlich ein Training, das in meinen Alltag passt. Das Team ist super "
                        "motivierend und ich sehe echte Fortschritte.",
                "initials": "JK", "author": "Julia K.", "since": "Mitglied seit 2 Jahren",
            },
            {
                "text": "Nach meiner Rücken-OP hatte ich Angst vor Sport. Hier wurde ich behutsam "
                        "wieder aufgebaut – ich bin unendlich dankbar.",
                "initials": "TB", "author": "Thomas B.", "since": "Mitglied seit 1 Jahr",
            },
            {
                "text": "Professionell, sauber, persönlich. Die 20 Minuten haben es in sich – "
                        "und die Ergebnisse sprechen für sich!",
                "initials": "AM", "author": "Aylin M.", "since": "Mitglied seit 8 Monaten",
            },
        ],

        # Mögliche Wunschzeiten für die Probetraining-Buchung
        "booking_slots": [
            "Vormittags (8–12 Uhr)",
            "Mittags (12–15 Uhr)",
            "Nachmittags (15–18 Uhr)",
            "Abends (18–21 Uhr)",
            "Samstag (10–16 Uhr)",
        ],
    },
}

DEFAULT_STUDIO = "huerth"


def get_studio(slug: str | None = None) -> dict:
    """Studio-Daten anhand des Slugs holen (mit Karten-URLs angereichert)."""
    studio = dict(STUDIOS.get(slug or DEFAULT_STUDIO, STUDIOS[DEFAULT_STUDIO]))
    full_address = f"{studio['name']}, {studio['address']}, {studio['postal_city']}"
    studio["maps_embed"] = maps_embed_url(full_address)
    studio["maps_link"] = maps_link(full_address)
    studio["whatsapp_link"] = (
        f"https://wa.me/{studio['whatsapp']}"
        f"?text={quote_plus('Hallo! Ich interessiere mich für ein kostenloses Probetraining.')}"
    )
    return studio


class Settings:
    """Server- & Mail-Einstellungen aus Umgebungsvariablen (.env)."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-bitte-aendern")
    DEBUG = os.environ.get("FLASK_DEBUG", "0") == "1"

    SMTP_HOST = os.environ.get("SMTP_HOST", "")
    SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
    SMTP_USER = os.environ.get("SMTP_USER", "")
    SMTP_PASS = os.environ.get("SMTP_PASS", "")
    SMTP_USE_TLS = os.environ.get("SMTP_USE_TLS", "1") == "1"

    MAIL_FROM = os.environ.get("MAIL_FROM", "") or SMTP_USER
    MAIL_TO = os.environ.get("MAIL_TO", "") or SMTP_USER

    @property
    def mail_configured(self) -> bool:
        return bool(self.SMTP_HOST and self.SMTP_USER and self.MAIL_TO)


settings = Settings()
