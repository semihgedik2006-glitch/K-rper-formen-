# Erzeugt docs/schichtplaner/Schichtplaner-Fragen.pdf (Runde 206).
# Aufruf: python3 fragen.py ../Schichtplaner-Fragen.pdf
#
# Aus dem Betrieb, 22.10.2026: „kanst du … uns alle fragen stellen welche
# wir beantworten müssen damit der schichtplan danach direkt klappt" und
# „gib mir die liste als pdf und auch die excel vorlage nochmal" und
# „sag mir was du von logx brauchst". Die Fragen stehen in inhalt.py —
# dieselbe Liste füllt das Blatt „Fragen" in der Excel-Vorlage.
import sys
from reportlab.lib.units import mm
from reportlab.platypus import Spacer, KeepTogether, Table, TableStyle, PageBreak
from stil import st, P, dokument, kasten, punkte, BREITE, LINIE, ZEBRA, AKZENT, GELB_F, colors
from inhalt import FRAGEN, LOGX

doc = dokument(sys.argv[1], "Schichtplaner – Fragen an die Geschäftsführung",
               "Schichtplaner für StudioChat · Fragen an die Geschäftsführung · Stand 22.10.2026")
s = []
s.append(P("Schichtplaner – was wir noch wissen müssen", st["titel"]))
s.append(P("24 Fragen. Sind sie beantwortet und ist die Excel-Vorlage ausgefüllt, "
           "erstellt StudioChat den ersten Monatsplan ohne Nacharbeit.", st["unter"]))
s.append(kasten("<b>So geht es am schnellsten:</b> Bei jeder Frage steht in der mittleren Spalte, was die App "
                "<b>heute</b> annimmt. Passt das, schreiben Sie einfach „passt“. Was Sie noch nicht wissen, "
                "darf leer bleiben – der Planer fragt dann nach, statt etwas anzunehmen. "
                "Die Antworten können hier, im Excel (Blatt „Fragen“) oder per Nachricht kommen – mit der Nummer davor."))
s.append(Spacer(1, 5 * mm))
s.append(kasten("<b>Was in die Excel-Vorlage gehört</b> (Fragen 2–5): Blatt „Studios“ (Öffnungszeiten), "
                "„Schichten“ (Zeiten), „Mitarbeiter“ (eine Zeile pro Person). <b>Nicht</b> hinein: Urlaub und "
                "Krankheit (kommen aus StudioChat), Wünsche für einzelne Tage (trägt jeder selbst ein), "
                "Gesundheitsangaben, Adressen, Telefonnummern.", GELB_F, colors.HexColor("#B45309")))

nr = 1
for thema, fragen in FRAGEN:
    s.append(P(thema, st["h1"]))
    zeilen = [[P("<b>Nr.</b>", st["zellek"]), P("<b>Frage</b>", st["zellek"]),
               P("<b>Heute in der App</b>", st["zellek"]), P("<b>Ihre Antwort</b>", st["zellek"])]]
    for frage, heute in fragen:
        zeilen.append([P(str(nr), st["zelle"]), P(frage, st["zelle"]), P(heute, st["klein"]), P("", st["zelle"])])
        nr += 1
    t = Table(zeilen, colWidths=[9 * mm, 72 * mm, 44 * mm, BREITE - 125 * mm], repeatRows=1)
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, LINIE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, 0), AKZENT),
        ("ROWBACKGROUNDS", (0, 1), (2, -1), [colors.white, ZEBRA]),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        # Platz zum Schreiben: jede Antwortzeile mindestens 22 mm hoch
    ]))
    t._argH = [None] + [22 * mm] * len(fragen)
    s.append(t)

s.append(PageBreak())
s.append(P("Was ich von LogX brauche", st["titel"]))
s.append(P("Damit der fertige Plan nicht von Hand abgetippt werden muss, sondern genau in "
           "dem Format herauskommt, das LogX erwartet – im besten Fall als Datei zum Importieren.", st["unter"]))
for i, (was, wie) in enumerate(LOGX, 1):
    s.append(KeepTogether([P("%d · %s" % (i, was), st["h2"]), P(wie, st["text"])]))
s.append(Spacer(1, 4 * mm))
s.append(kasten("<b>Bitte keine Zugangsdaten schicken</b> – kein Passwort, keinen Benutzernamen für LogX. "
                "Bildschirmfotos und exportierte Dateien reichen. Namen der Mitarbeiter dürfen darauf "
                "stehen; Gehälter, Adressen und Gesundheitsangaben bitte schwärzen.",
                colors.HexColor("#FEE4E2"), colors.HexColor("#B42318")))
s.append(Spacer(1, 4 * mm))
s.append(P("Was danach passiert", st["h2"]))
s += punkte([
    "Kann LogX importieren: Der Knopf „Für LogX kopieren“ wird zu „Datei für LogX“ – genau mit den Spalten und Formaten aus der Importvorlage.",
    "Kann LogX nicht importieren: Die Tabelle kommt in der Reihenfolge und mit den Kürzeln, die man in LogX eintippt – Zeile für Zeile so, wie die Maske fragt.",
    "Mit der Mitarbeiterliste werden Namen sicher zugeordnet; Abweichungen zeigt die App vor dem Übernehmen an.",
])
doc.build(s)
print("gespeichert", sys.argv[1])
