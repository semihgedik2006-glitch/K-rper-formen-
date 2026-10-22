# Erzeugt vorlagen/Schichtplaner-Vorlage.xlsx (Runde 156/169).
# Aufruf: python3 vorlage.py ../../../vorlagen/Schichtplaner-Vorlage.xlsx
import sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter
from inhalt import FRAGEN, ROLLEN, VERFUEGBAR, VORLIEBE, JANEIN, TAGE, STUDIOS

AKZENT = "0369A1"
KOPF = PatternFill("solid", fgColor=AKZENT)
HELL = PatternFill("solid", fgColor="E0F2FE")
BEISPIEL = PatternFill("solid", fgColor="F1F5F9")
WEISS = Font(name="Calibri", bold=True, color="FFFFFF", size=11)
FETT = Font(name="Calibri", bold=True, size=11)
GRAU = Font(name="Calibri", italic=True, color="64748B", size=11)
TITEL = Font(name="Calibri", bold=True, size=16, color=AKZENT)
LINIE = Side(style="thin", color="CBD5E1")
RAND = Border(left=LINIE, right=LINIE, top=LINIE, bottom=LINIE)
UMBRUCH = Alignment(wrap_text=True, vertical="top")
MITTE = Alignment(wrap_text=True, vertical="center", horizontal="center")

wb = Workbook()


def kopfzeile(ws, zeile, spalten):
    for i, (name, breite) in enumerate(spalten, 1):
        c = ws.cell(row=zeile, column=i, value=name)
        c.fill, c.font, c.alignment, c.border = KOPF, WEISS, MITTE, RAND
        ws.column_dimensions[get_column_letter(i)].width = breite
    ws.row_dimensions[zeile].height = 34


def liste(ws, werte, bereich, hinweis, streng=True):
    dv = DataValidation(type="list", formula1='"' + ",".join(werte) + '"', allow_blank=True,
                        showErrorMessage=True, errorStyle="stop" if streng else "warning",
                        errorTitle="Bitte aus der Liste wählen",
                        error=hinweis, promptTitle="Auswahl", prompt=hinweis, showInputMessage=True)
    ws.add_data_validation(dv)
    dv.add(bereich)


def rahmen(ws, z1, z2, s2):
    for z in range(z1, z2 + 1):
        for s in range(1, s2 + 1):
            c = ws.cell(row=z, column=s)
            c.border = RAND
            c.alignment = UMBRUCH


# ── Blatt 1: Anleitung ─────────────────────────────────────────────
ws = wb.active
ws.title = "Anleitung"
ws.column_dimensions["A"].width = 4
ws.column_dimensions["B"].width = 100
ws["B1"] = "Schichtplaner – Vorlage zum Ausfüllen"
ws["B1"].font = TITEL
texte = [
    ("Wozu?", None),
    ("Aus diesen Angaben erstellt der Schichtplaner in StudioChat jeden Monat einen Entwurf für alle 14 Studios. "
     "Sie prüfen ihn, ändern bei Bedarf und übernehmen ihn nach LogX.", "t"),
    ("Was wird wo eingetragen?", None),
    ("1.  „Fragen“ – die Regeln für den ganzen Betrieb. Einmal beantworten.", "t"),
    ("2.  „Studios“ – Öffnungszeiten und Mindestbesetzung je Studio. Die Namen sind schon eingetragen – bitte prüfen.", "t"),
    ("3.  „Schichten“ – die festen Schichtzeiten. Gelten sie überall gleich, reicht eine Zeile mit Studio „alle“.", "t"),
    ("4.  „Mitarbeiter“ – eine Zeile pro Person. Grau hinterlegte Zeilen sind Beispiele und können gelöscht werden.", "t"),
    ("5.  „Feste Schichten“ (freiwillig) – wer immer oder an einem bestimmten Tag fest eingeplant ist. Der Planer setzt diese zuerst.", "t"),
    ("6.  „Sondertage“ (freiwillig) – Tage mit geschlossener Schicht oder mehr Personen (Event, Inventur, Heiligabend).", "t"),
    ("7.  „Einstellungen“ – Wunschfrist, Feiertage, höchstens Tage am Stück, höchstens Wunsch-frei-Tage.", "t"),
    ("Feste Schichten, Sondertage und Einstellungen lassen sich auch später direkt im Planer in der App ändern.", "t"),
    ("Was NICHT hier hinein gehört", None),
    ("•  Urlaub und Krankheit – das steht in StudioChat unter Abwesenheiten und wird automatisch berücksichtigt.", "t"),
    ("•  Wünsche für einzelne Tage – die tragen die Mitarbeiter jeden Monat selbst in StudioChat ein (mit Frist).", "t"),
    ("•  Gesundheitsangaben, private Adressen, Telefonnummern – werden für den Plan nicht gebraucht.", "t"),
    ("Tipps", None),
    ("•  Felder mit Auswahlliste: Zelle anklicken, rechts erscheint ein kleiner Pfeil.", "t"),
    ("•  Nicht sicher? Lieber in „Bemerkung“ in eigenen Worten schreiben als eine Spalte leer lassen.", "t"),
    ("•  Unbekanntes darf leer bleiben – der Planer fragt dann nach, statt etwas anzunehmen.", "t"),
]
z = 3
for text, art in texte:
    if art is None and z > 3:
        z += 1
    c = ws.cell(row=z, column=2, value=text)
    if art is None:
        c.font = Font(name="Calibri", bold=True, size=12, color=AKZENT)
        ws.row_dimensions[z].height = 22
    else:
        c.alignment = Alignment(wrap_text=True, vertical="top")
        ws.row_dimensions[z].height = 32 if len(text) > 110 else 18
    z += 1

# ── Blatt 2: Fragen ────────────────────────────────────────────────
ws = wb.create_sheet("Fragen")
# Runde 206: eigene Spalte „Heute in der App" — passt die Vorgabe,
# genügt als Antwort „passt".
kopfzeile(ws, 1, [("Nr.", 6), ("Thema", 22), ("Frage", 62), ("Heute in der App", 40), ("Antwort", 50)])
z, nr = 2, 1
for thema, fragen in FRAGEN:
    for frage, zusatz in fragen:
        ws.cell(row=z, column=1, value=nr).alignment = MITTE
        ws.cell(row=z, column=2, value=thema)
        ws.cell(row=z, column=3, value=frage)
        ws.cell(row=z, column=4, value=zusatz).font = GRAU
        a = ws.cell(row=z, column=5)
        a.fill = HELL
        ws.row_dimensions[z].height = 48
        z += 1
        nr += 1
rahmen(ws, 2, z - 1, 5)
for zz in range(2, z):
    ws.cell(row=zz, column=1).alignment = MITTE
ws.freeze_panes = "A2"

# ── Blatt 3: Studios ───────────────────────────────────────────────
ws = wb.create_sheet("Studios")
spalten = [("Studio", 22)] + [(t + "\nÖffnungszeit", 13) for t in TAGE] + \
          [("Mindestens\nanwesend", 12), ("Stoßzeiten / mehr Personen nötig", 30), ("Bemerkung", 30)]
kopfzeile(ws, 1, spalten)
for i, name in enumerate(STUDIOS, 2):
    ws.cell(row=i, column=1, value=name).font = FETT
    ws.row_dimensions[i].height = 22
rahmen(ws, 2, len(STUDIOS) + 1, len(spalten))
ws.cell(row=len(STUDIOS) + 3, column=1, value="Beispiel für eine Zeile: Mo 07:00–21:00 · mindestens 1 · „Mo–Do 16–20 Uhr 2 Personen“ · „Sa nur bis 14 Uhr“").font = GRAU
liste(ws, ["1", "2", "3", "4"], "I2:I15", "Wie viele Personen mindestens gleichzeitig? (Andere Zahl: in Bemerkung)", streng=False)
ws.freeze_panes = "B2"

# ── Blatt 4: Schichten ─────────────────────────────────────────────
ws = wb.create_sheet("Schichten")
spalten = [("Studio\n(oder „alle“)", 20), ("Name der Schicht", 18), ("Beginn", 10), ("Ende", 10),
           ("An welchen Tagen?", 18), ("Mindestens\nPersonen", 12), ("Braucht jemanden mit …", 26), ("Bemerkung", 30)]
kopfzeile(ws, 1, spalten)
beispiele = [("alle", "Früh", "07:00", "14:00", "Mo–Fr", 1, "", "Beispiel – bitte anpassen"),
             ("alle", "Spät", "14:00", "21:00", "Mo–Fr", 1, "Abschluss", "Beispiel – bitte anpassen"),
             ("alle", "Samstag", "09:00", "14:00", "Sa", 1, "", "Beispiel – bitte anpassen")]
for i, zeile in enumerate(beispiele, 2):
    for s, wert in enumerate(zeile, 1):
        c = ws.cell(row=i, column=s, value=wert)
        c.fill, c.font = BEISPIEL, GRAU
rahmen(ws, 2, 40, len(spalten))
for i, zeile in enumerate(beispiele, 2):
    for s in range(1, len(spalten) + 1):
        ws.cell(row=i, column=s).fill = BEISPIEL
liste(ws, ["alle"] + STUDIOS, "A2:A40", "Studio aus der Liste oder „alle“")
ws.freeze_panes = "A2"

# ── Blatt 5: Mitarbeiter ───────────────────────────────────────────
ws = wb.create_sheet("Mitarbeiter")
spalten = [("Name", 20), ("Rolle /\nVertragsart", 16), ("Hauptstudio", 18), ("Weitere Studios\n(Springer)", 26),
           ("Stunden pro\nWoche (Soll)", 12), ("Höchstens\nStd. pro Monat", 13), ("Höchstens\nTage pro Woche", 13),
           ("Darf allein\nim Studio sein?", 13), ("Unter 18?", 10), ("Kann besonders …\n(Probetraining, Kasse, Abschluss)", 28)] + \
          [(t, 13) for t in TAGE] + \
          [("Feste Sperrzeiten\n(Berufsschule, Uni …)", 28), ("Lieber", 10),
           ("Springt bei\nAusfall ein?", 13), ("Erster\nArbeitstag", 13), ("Letzter\nArbeitstag", 13), ("Bemerkung", 34)]
kopfzeile(ws, 1, spalten)
beispiele = [
    ["Beispiel: Lisa M.", "Minijob", "Nippes", "Longerich, Ebertplatz", "", 40, 3, "ja", "nein", "Probetraining",
     "nur spät", "nie", "nur spät", "nie", "ganztags", "ganztags", "nie", "", "Spät", "ja", "", "", "samstags nur alle zwei Wochen"],
    ["Beispiel: Tom K.", "Azubi", "Porz", "", 40, "", 5, "nein", "ja", "",
     "ganztags", "nie", "ganztags", "ganztags", "ganztags", "nie", "nie", "Di Berufsschule", "Früh", "nein", "01.11.2026", "", "nicht allein – immer mit Studioleitung"],
]
for i, zeile in enumerate(beispiele, 2):
    for s, wert in enumerate(zeile, 1):
        c = ws.cell(row=i, column=s, value=wert)
        c.font = GRAU
ende = 150
rahmen(ws, 2, ende, len(spalten))
for i in range(2, 2 + len(beispiele)):
    for s in range(1, len(spalten) + 1):
        ws.cell(row=i, column=s).fill = BEISPIEL
liste(ws, ROLLEN, "B2:B%d" % ende, "Rolle aus der Liste wählen", streng=False)
liste(ws, STUDIOS, "C2:C%d" % ende, "Hauptstudio aus der Liste wählen")
liste(ws, JANEIN, "H2:I%d" % ende, "ja oder nein")
liste(ws, VERFUEGBAR, "K2:Q%d" % ende,
      "ganztags · nur früh · nur spät · nie · nach Absprache – oder eigene Uhrzeit, z. B. 9–14", streng=False)
liste(ws, VORLIEBE, "S2:S%d" % ende, "Früh, Spät oder egal")
liste(ws, JANEIN, "T2:T%d" % ende, "ja = wird bei Krankheit anderer zuerst gefragt")
ws.freeze_panes = "B2"
ws.auto_filter.ref = "A1:%s%d" % (get_column_letter(len(spalten)), ende)

# ── Blatt 6: Feste Schichten ───────────────────────────────────────
ws = wb.create_sheet("Feste Schichten")
spalten = [("Person\n(Name wie im Blatt Mitarbeiter)", 28), ("Studio", 20), ("Schicht\n(Name wie im Blatt Schichten)", 22),
           ("Wochentage ODER Datum", 24), ("Bemerkung", 36)]
kopfzeile(ws, 1, spalten)
for i, zeile in enumerate([("Lisa M.", "Nippes", "Spät", "Mo, Mi", "Beispiel – bitte anpassen"),
                           ("Tom K.", "Porz", "Früh", "14.11.2026", "Beispiel – Einweisung neues Gerät")], 2):
    for s_, wert in enumerate(zeile, 1):
        c = ws.cell(row=i, column=s_, value=wert); c.fill, c.font = BEISPIEL, GRAU
rahmen(ws, 2, 60, len(spalten))
liste(ws, STUDIOS, "B2:B60", "Studio aus der Liste")
ws.freeze_panes = "A2"

# ── Blatt 7: Sondertage ────────────────────────────────────────────
ws = wb.create_sheet("Sondertage")
spalten = [("Datum\n(TT.MM.JJJJ)", 14), ("Studio\n(oder „alle“)", 20), ("Art", 22), ("Schicht\n(leer = alle)", 18),
           ("Wie viele\nmehr?", 11), ("Anlass / Notiz", 40)]
kopfzeile(ws, 1, spalten)
for i, zeile in enumerate([("24.12.2026", "alle", "geschlossen", "Spät", "", "Beispiel – Heiligabend nur bis 14 Uhr"),
                           ("07.11.2026", "Rath", "mehr Personen", "Samstag", 1, "Beispiel – Tag der offenen Tür")], 2):
    for s_, wert in enumerate(zeile, 1):
        c = ws.cell(row=i, column=s_, value=wert); c.fill, c.font = BEISPIEL, GRAU
rahmen(ws, 2, 80, len(spalten))
liste(ws, ["alle"] + STUDIOS, "B2:B80", "Studio aus der Liste oder „alle“")
liste(ws, ["geschlossen", "mehr Personen"], "C2:C80", "geschlossen = Schicht fällt weg · mehr Personen = Mindestbesetzung steigt")
ws.freeze_panes = "A2"

# ── Blatt 8: Einstellungen ─────────────────────────────────────────
ws = wb.create_sheet("Einstellungen")
kopfzeile(ws, 1, [("Einstellung", 46), ("Wert", 14), ("Erklärung", 70)])
for i, zeile in enumerate([
        ("Wunschfrist (Tag im Vormonat)", 15, "Bis zu diesem Tag tragen die Mitarbeiter ihre Wünsche für den Folgemonat ein."),
        ("Feiertage geschlossen?", "nein", "ja = an NRW-Feiertagen wird niemand eingeplant."),
        ("Höchstens Tage am Stück", 6, "Mehr Tage hintereinander nur als sichtbare Rückfrage."),
        ("Höchstens Wunsch-frei-Tage pro Person und Monat", 4, "0 = keine Grenze.")], 2):
    for s_, wert in enumerate(zeile, 1):
        ws.cell(row=i, column=s_, value=wert)
    ws.cell(row=i, column=2).fill = HELL
rahmen(ws, 2, 5, 3)
liste(ws, JANEIN, "B3:B3", "ja oder nein")

for blatt in wb.worksheets:
    blatt.page_setup.orientation = "landscape"
    blatt.page_setup.paperSize = blatt.PAPERSIZE_A4
    blatt.page_setup.fitToWidth = 1
    blatt.page_setup.fitToHeight = 0
    blatt.sheet_properties.pageSetUpPr.fitToPage = True
    blatt.print_title_rows = "1:1" if blatt.title != "Anleitung" else None
wb.active = wb.worksheets.index(wb["Anleitung"])
wb.save(sys.argv[1])
print("gespeichert", sys.argv[1])
