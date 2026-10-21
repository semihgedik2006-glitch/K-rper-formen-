# Gemeinsame Gestaltung für die Schichtplaner-PDFs (Runde 169).
# Aufruf siehe eintragen.py und handbuch.py im selben Ordner.
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
                                TableStyle, KeepTogether, PageBreak)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping

SCHRIFT = "/usr/share/fonts/truetype/liberation/"
pdfmetrics.registerFont(TTFont("Sans", SCHRIFT + "LiberationSans-Regular.ttf"))
pdfmetrics.registerFont(TTFont("Sans-Bold", SCHRIFT + "LiberationSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Sans-Italic", SCHRIFT + "LiberationSans-Italic.ttf"))
addMapping("Sans", 0, 0, "Sans"); addMapping("Sans", 1, 0, "Sans-Bold"); addMapping("Sans", 0, 1, "Sans-Italic")

AKZENT = colors.HexColor("#0369A1")
TEXT = colors.HexColor("#0F172A")
GRAU = colors.HexColor("#475569")
LINIE = colors.HexColor("#CBD5E1")
ZEBRA = colors.HexColor("#F8FAFC")
ROT = colors.HexColor("#B42318")
GELB_F = colors.HexColor("#FEF3C7")
ROT_F = colors.HexColor("#FEE4E2")
GRUEN_F = colors.HexColor("#DCFCE7")
BLAU_F = colors.HexColor("#E0F2FE")

st = {
    "titel": ParagraphStyle("titel", fontName="Sans-Bold", fontSize=22, leading=27, textColor=TEXT, spaceAfter=4),
    "unter": ParagraphStyle("unter", fontName="Sans", fontSize=11.5, leading=16, textColor=GRAU, spaceAfter=12),
    "h1": ParagraphStyle("h1", fontName="Sans-Bold", fontSize=15, leading=19, textColor=AKZENT, spaceBefore=12, spaceAfter=6),
    "h2": ParagraphStyle("h2", fontName="Sans-Bold", fontSize=11.5, leading=15, textColor=TEXT, spaceBefore=9, spaceAfter=4),
    "text": ParagraphStyle("text", fontName="Sans", fontSize=10, leading=14.2, textColor=TEXT, spaceAfter=4),
    "klein": ParagraphStyle("klein", fontName="Sans", fontSize=8.8, leading=12, textColor=GRAU),
    "zelle": ParagraphStyle("zelle", fontName="Sans", fontSize=8.8, leading=11.6, textColor=TEXT),
    "zellek": ParagraphStyle("zellek", fontName="Sans-Bold", fontSize=8.8, leading=11.6, textColor=colors.white),
    "kasten": ParagraphStyle("kasten", fontName="Sans", fontSize=9.6, leading=13.4, textColor=TEXT),
}
BREITE = A4[0] - 36 * mm
P = Paragraph


def dokument(pfad, titel, fusszeile):
    def fuss(c, doc):
        c.saveState()
        c.setFont("Sans", 8.2); c.setFillColor(GRAU)
        c.drawString(18 * mm, 11 * mm, fusszeile)
        c.drawRightString(A4[0] - 18 * mm, 11 * mm, "Seite %d" % doc.page)
        c.setStrokeColor(AKZENT); c.setLineWidth(3); c.line(0, A4[1] - 1.5, A4[0], A4[1] - 1.5)
        c.restoreState()
    doc = BaseDocTemplate(pfad, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm,
                          bottomMargin=18 * mm, title=titel, author="StudioChat", subject=titel)
    doc.addPageTemplates([PageTemplate(id="s", frames=[Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")], onPage=fuss)])
    return doc


def tabelle(zeilen, breiten, kopf=True, farben=None):
    daten = [[P(str(z), st["zellek"] if (kopf and i == 0) else st["zelle"]) for z in zeile] for i, zeile in enumerate(zeilen)]
    t = Table(daten, colWidths=breiten, repeatRows=1 if kopf else 0)
    stil = [("GRID", (0, 0), (-1, -1), 0.5, LINIE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("ROWBACKGROUNDS", (0, 1 if kopf else 0), (-1, -1), [colors.white, ZEBRA])]
    if kopf: stil.append(("BACKGROUND", (0, 0), (-1, 0), AKZENT))
    for (zeile, farbe) in (farben or []):
        stil.append(("BACKGROUND", (0, zeile), (-1, zeile), farbe))
    t.setStyle(TableStyle(stil))
    return t


def kasten(text, farbe=BLAU_F, rand=AKZENT):
    t = Table([[P(text, st["kasten"])]], colWidths=[BREITE])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), farbe), ("LINEBEFORE", (0, 0), (0, -1), 3, rand),
                           ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                           ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9)]))
    return t


def punkte(liste, stil="text"):
    return [P("•&nbsp;&nbsp;" + x, st[stil]) for x in liste]
