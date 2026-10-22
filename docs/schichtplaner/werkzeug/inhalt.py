# Gemeinsamer Inhalt für PDF und Excel – damit beide dieselben Fragen tragen.

# Runde 206: die vollständige Liste, nach der der erste echte Plan ohne
# Nacharbeit läuft. Aus dem Betrieb, 22.10.2026: „kanst du … uns alle
# fragen stellen welche wir beantworten müssen damit der schichtplan
# danach direkt klappt". Je Frage steht, was die App HEUTE annimmt —
# passt das, reicht „passt".
FRAGEN = [
    ("A · Ohne diese Angaben gibt es keinen Plan", [
        ("Welche Studios sollen im ersten Monat mitgeplant werden – alle 14 oder zum Testen erst eins oder zwei?",
         "Empfehlung: erst ein Studio."),
        ("Öffnungszeiten je Studio und Wochentag.",
         "Ins Excel, Blatt „Studios“."),
        ("Schichten je Studio: Name, Beginn, Ende, an welchen Wochentagen. Sind sie in allen Studios gleich?",
         "Ins Excel, Blatt „Schichten“. Heute in der Demo: Früh 7–14, Spät 14–21, Samstag 9–14."),
        ("Das Team: eine Zeile pro Person – Name genau wie in der App, Hauptstudio, in welchen Studios sie aushilft, Stunden pro Woche (Minijob: Monatsgrenze).",
         "Ins Excel, Blatt „Mitarbeiter“."),
        ("Wer kann wann grundsätzlich nicht? (z. B. „nie Dienstag“, „nur früh“, „Di Uni“)",
         "Ins Excel, Blatt „Mitarbeiter“, Spalten Mo–So und „Sperrzeiten“."),
    ]),
    ("B · Besetzung", [
        ("Wie viele Personen müssen mindestens gleichzeitig im Studio sein?",
         "Heute: 1 je Schicht."),
        ("Gibt es Stoßzeiten, Tage oder Studios, an denen mehr Leute da sein müssen? Wann, wo, wie viele?",
         "Heute: nur über „Sondertage“ für einzelne Daten."),
        ("Wer darf nicht allein im Studio sein (Azubis, Neue, bestimmte Personen)? Und wer zählt als Begleitung?",
         "Heute: Begleitung ist jede Person mit „darf allein: ja“."),
        ("Muss in bestimmten Schichten jemand mit einer bestimmten Fähigkeit da sein (Probetraining, Kasse, Abschluss am Abend, Erste Hilfe)? In welchen?",
         "Heute: je Schicht eine Fähigkeit („Braucht jemanden mit …“)."),
        ("Werden Studioleitungen und Regionalleiter fest eingeplant oder nur bei Bedarf?",
         "Heute: wie alle anderen, wenn sie im Blatt „Mitarbeiter“ stehen."),
    ]),
    ("C · Arbeitszeit", [
        ("Wie lang darf eine Schicht höchstens sein, und ab wann gibt es Pause?",
         "Heute: wird nicht geprüft."),
        ("Wie viele Tage am Stück darf jemand höchstens arbeiten?",
         "Heute: 6."),
        ("Höchstens wie viele Tage pro Woche – für alle gleich oder je Person?",
         "Heute: je Person im Excel, sonst ohne Grenze."),
        ("Gibt es Mitarbeiter unter 18?",
         "Wenn ja, gilt automatisch: nur 6–20 Uhr, höchstens 8 Stunden."),
        ("Feiertage in NRW: geschlossen oder offen? Gibt es Betriebsferien?",
         "Heute: offen (umschaltbar)."),
    ]),
    ("D · Wünsche und Fairness", [
        ("Bis zum wievielten des Vormonats müssen Wünsche eingetragen sein?",
         "Heute: bis zum 15."),
        ("Wie viele Wunsch-frei-Tage darf jede Person im Monat angeben?",
         "Heute: keine Grenze."),
        ("Was hat Vorrang, wenn es sich beisst? Bitte in eine Reihenfolge: Besetzung · vereinbarte Stunden · Wünsche · Fairness.",
         "Heute: Besetzung zuerst; ein Wunsch wird nur als Rückfrage gebrochen."),
        ("Wochenenden: reihum verteilen, oder hat jemand fest frei?",
         "Heute: reihum, so gleich wie möglich."),
        ("Fällt jemand aus: nur die Lücke melden oder gleich vorschlagen, wen man fragen kann?",
         "Heute: bis zu drei Vorschläge."),
    ]),
    ("E · Ablauf", [
        ("Wer erstellt und veröffentlicht den Plan – nur die Geschäftsführung oder auch die Studioleitung für ihr Studio?",
         "Heute: nur die Geschäftsführung."),
        ("Bis wann muss der Plan für den nächsten Monat fertig sein (z. B. am 20.)?",
         "Heute: keine Frist."),
        ("Muss die Leitung jeden Schichttausch bestätigen?",
         "Heute: ja."),
        ("Wird der Plan danach noch in LogX eingetragen? (Was ich dafür brauche: letzte Seite)",
         "Heute: „Für LogX kopieren“ legt eine Tabelle in die Zwischenablage."),
    ]),
]

# Was ich von LogX brauche, um den Plan genau passend zu übergeben.
LOGX = [
    ("Ein exportierter alter Monatsplan",
     "So, wie LogX ihn als Excel- oder CSV-Datei ausgibt. Gibt es keinen Export: ein Ausdruck oder PDF des Plans."),
    ("Kann LogX Schichten importieren?",
     "Wenn ja: die Beispiel- oder Vorlagedatei für den Import oder die Hilfeseite dazu (Spalten, Datums- und Zeitformat, Trennzeichen)."),
    ("Bildschirmfotos",
     "1) der Dienstplan in der Wochen- bzw. Monatsansicht, 2) das Fenster, in dem man eine Schicht anlegt (alle Felder sichtbar), 3) die Liste der Schicht- bzw. Dienstarten mit ihren Kürzeln."),
    ("Mitarbeiterliste aus LogX",
     "Name und – falls es sie gibt – Personalnummer. Dann ordnet die App die Personen sicher zu, auch bei gleichen Namen."),
    ("Wie heisst das Programm genau, welche Version, und wer betreut es?",
     "Steht meist unter „Hilfe“ oder „Über“. Hat LogX eine Schnittstelle (API), wäre das der Weg ohne Kopieren."),
    ("Wie tragen Sie heute in LogX ein – und wie lange dauert es?",
     "Kurz in eigenen Worten, Schritt für Schritt. Damit sehe ich, wo die Zeit liegt."),
]

ROLLEN = ["Vollzeit", "Teilzeit", "Minijob", "Duales Studium", "Azubi", "Werkstudent", "Aushilfe", "Studioleitung", "Regionalleitung"]
VERFUEGBAR = ["ganztags", "nur früh", "nur spät", "nie", "nach Absprache"]
VORLIEBE = ["Früh", "Spät", "egal"]
JANEIN = ["ja", "nein"]
TAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

STUDIOS = ['Longerich', 'Nippes', 'Ebertplatz', 'Rath', 'Porz', 'Rondorf', 'Hürth', 'Brühl', 'Niederkassel Mondorf', 'Refrath', 'Overath', 'Marialinden', 'Rösrath', 'Seelscheid']
