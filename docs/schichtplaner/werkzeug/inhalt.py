# Gemeinsamer Inhalt für PDF und Excel – damit beide dieselben Fragen tragen.

FRAGEN = [
    ("Studios und Öffnungszeiten", [
        ("Welche Öffnungszeiten hat jedes der 14 Studios an welchem Wochentag? (Die Namen stehen schon im Excel – bitte prüfen.)",
         "Bitte im Excel im Blatt „Studios“ eintragen."),
        ("An welchen Feiertagen sind die Studios zu? Gibt es Betriebsferien?", ""),
    ]),
    ("Schichten und Besetzung", [
        ("Gibt es feste Schichten (z. B. Früh 7–14 Uhr, Spät 14–21 Uhr) oder wechselnde Zeiten? Sind sie in allen Studios gleich?",
         "Bitte im Excel im Blatt „Schichten“ eintragen."),
        ("Wie viele Leute müssen mindestens gleichzeitig im Studio sein? Gibt es Zeiten, Tage oder Studios, an denen es mehr sein müssen (Stoßzeiten)?", ""),
        ("Wer darf nicht allein im Studio sein – nur Azubis und Neue, oder auch bestimmte Personen? Und wer zählt als „Begleitung“, damit diese Person nicht mehr allein ist?", ""),
        ("Gibt es Aufgaben, die nur bestimmte Personen können (z. B. Probetraining, Kasse, Abschluss am Abend, Erste Hilfe)? Muss in jeder Schicht mindestens eine solche Person da sein?", ""),
        ("Werden Regionalleiter mit in den Plan eingeteilt, oder stehen sie nur bei Bedarf zur Verfügung?", ""),
    ]),
    ("Arbeitszeit und Fairness", [
        ("Wie lang darf eine Schicht höchstens sein, und ab wann gibt es Pause?", ""),
        ("Wie viele Tage am Stück darf jemand höchstens arbeiten? Gibt es feste freie Tage?", ""),
        ("Wie werden Wochenenden und Feiertage verteilt – reihum, oder hat jemand fest frei?", ""),
        ("Gibt es Mitarbeiter unter 18 Jahren? Für sie gelten strengere Regeln (z. B. keine späten Schichten).", ""),
        ("Minijobs: Gilt pro Person eine feste Höchstzahl an Stunden im Monat? Wenn nein: Wie hoch ist der Stundenlohn, damit die Maschine die Grenze ausrechnen kann?", ""),
    ]),
    ("Wünsche und Konflikte", [
        ("Was hat Vorrang, wenn sich etwas beisst? Bitte in eine Reihenfolge bringen: Besetzung · vereinbarte Stunden · Wünsche der Mitarbeiter · Fairness.", ""),
        ("Bis wann vor dem Monat müssen die Wünsche eingetragen sein (z. B. bis zum 15. des Vormonats)?", ""),
        ("Wie viele Wunsch-frei-Tage darf jeder pro Monat angeben?", ""),
        ("Wenn eine Schicht nicht zu besetzen ist: Soll die Maschine nur die Lücke melden oder gleich vorschlagen, wen man fragen könnte?", ""),
    ]),
    ("Ablauf und LogX", [
        ("Wer prüft und veröffentlicht den Plan – nur Sie, oder auch die Studioleiter für ihre Studios?", ""),
        ("Wie weit im Voraus soll der Plan fertig sein (z. B. am 20. für den nächsten Monat)?", ""),
        ("Wie wird heute in LogX eingetragen? Hilfreich wären Bildschirmfotos und ein exportierter alter Plan.", ""),
        ("Kann LogX Dateien importieren oder exportieren (Excel/CSV)? Gibt es eine Mitarbeiterliste zum Exportieren?", ""),
    ]),
]

ROLLEN = ["Vollzeit", "Teilzeit", "Minijob", "Duales Studium", "Azubi", "Werkstudent", "Aushilfe", "Studioleitung", "Regionalleitung"]
VERFUEGBAR = ["ganztags", "nur früh", "nur spät", "nie", "nach Absprache"]
VORLIEBE = ["Früh", "Spät", "egal"]
JANEIN = ["ja", "nein"]
TAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

STUDIOS = ['Longerich', 'Nippes', 'Ebertplatz', 'Rath', 'Porz', 'Rondorf', 'Hürth', 'Brühl', 'Niederkassel Mondorf', 'Refrath', 'Overath', 'Marialinden', 'Rösrath', 'Seelscheid']
