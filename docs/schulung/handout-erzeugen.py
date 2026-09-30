# Handout „Das Beratungsgespräch" — aus den Abschriften der 15 Schulungsvideos.
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                Table, TableStyle, KeepTogether, PageBreak, ListFlowable, ListItem)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

F = '/usr/share/fonts/truetype/liberation/'
pdfmetrics.registerFont(TTFont('LS', F + 'LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LS-B', F + 'LiberationSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('LS-I', F + 'LiberationSans-Italic.ttf'))
pdfmetrics.registerFont(TTFont('LS-BI', F + 'LiberationSans-BoldItalic.ttf'))
from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily('LS', normal='LS', bold='LS-B', italic='LS-I', boldItalic='LS-BI')

TINTE = colors.HexColor('#1B2430')
AKZENT = colors.HexColor('#0E6E74')
LEISE = colors.HexColor('#5B6573')
FLAECHE = colors.HexColor('#EEF5F5')
LINIE = colors.HexColor('#C9D6D8')

S = {
  'titel': ParagraphStyle('titel', fontName='LS-B', fontSize=24, leading=28, textColor=TINTE, spaceAfter=4),
  'unter': ParagraphStyle('unter', fontName='LS', fontSize=11.5, leading=15, textColor=LEISE, spaceAfter=14),
  'h1': ParagraphStyle('h1', fontName='LS-B', fontSize=15, leading=19, textColor=AKZENT, spaceBefore=14, spaceAfter=6, keepWithNext=1),
  'h2': ParagraphStyle('h2', fontName='LS-B', fontSize=11.5, leading=15, textColor=TINTE, spaceBefore=8, spaceAfter=3, keepWithNext=1),
  'txt': ParagraphStyle('txt', fontName='LS', fontSize=10, leading=14, textColor=TINTE, spaceAfter=4),
  'klein': ParagraphStyle('klein', fontName='LS', fontSize=8.5, leading=11.5, textColor=LEISE),
  'zitat': ParagraphStyle('zitat', fontName='LS-I', fontSize=10, leading=14, textColor=TINTE, leftIndent=8),
  'box': ParagraphStyle('box', fontName='LS', fontSize=9.8, leading=13.5, textColor=TINTE),
}

def P(t, st='txt'): return Paragraph(t, S[st])
def liste(punkte, st='txt'):
    return ListFlowable([ListItem(P(p, st), leftIndent=12, value='•') for p in punkte],
                        bulletType='bullet', bulletFontName='LS', bulletFontSize=9, leftIndent=12, bulletColor=AKZENT)
def satz(t):
    """Ein Beispielsatz zum Nachsprechen — mit Rand links."""
    tb = Table([[P(t, 'zitat')]], colWidths=[170*mm])
    tb.setStyle(TableStyle([('LINEBEFORE', (0,0), (0,0), 2.2, AKZENT), ('LEFTPADDING', (0,0), (-1,-1), 8),
                            ('TOPPADDING', (0,0), (-1,-1), 3), ('BOTTOMPADDING', (0,0), (-1,-1), 3)]))
    return tb
def kasten(titel, inhalt):
    zeilen = [[P('<b>' + titel + '</b>', 'box')]] + [[x] for x in inhalt]
    tb = Table(zeilen, colWidths=[170*mm])
    tb.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), FLAECHE), ('BOX', (0,0), (-1,-1), 0.6, LINIE),
                            ('LEFTPADDING', (0,0), (-1,-1), 9), ('RIGHTPADDING', (0,0), (-1,-1), 9),
                            ('TOPPADDING', (0,0), (-1,-1), 3), ('BOTTOMPADDING', (0,0), (-1,-1), 3)]))
    return KeepTogether([tb, Spacer(1, 6)])
def tabelle(kopf, zeilen, breiten):
    daten = [[P('<b>' + k + '</b>', 'box') for k in kopf]] + [[P(z, 'box') for z in r] for r in zeilen]
    tb = Table(daten, colWidths=[b*mm for b in breiten], repeatRows=1)
    tb.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), FLAECHE), ('LINEBELOW', (0,0), (-1,-1), 0.4, LINIE),
                            ('VALIGN', (0,0), (-1,-1), 'TOP'), ('LEFTPADDING', (0,0), (-1,-1), 5),
                            ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4)]))
    return KeepTogether([tb, Spacer(1, 6)])

def fuss(c, doc):
    c.saveState()
    c.setFont('LS', 8); c.setFillColor(LEISE)
    c.drawString(20*mm, 12*mm, 'Das Beratungsgespräch — Leitfaden zur Schulung · Körperformen')
    c.drawRightString(190*mm, 12*mm, 'Seite %d' % doc.page)
    c.setStrokeColor(LINIE); c.setLineWidth(0.5); c.line(20*mm, 16*mm, 190*mm, 16*mm)
    c.restoreState()

ziel = sys.argv[1]
doc = BaseDocTemplate(ziel, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=18*mm, bottomMargin=22*mm,
                      title='Das Beratungsgespräch — Leitfaden', author='Körperformen', subject='Handout zur Schulung')
doc.addPageTemplates([PageTemplate(id='s', frames=[Frame(20*mm, 22*mm, 170*mm, 257*mm, id='f')], onPage=fuss)])
st = []

st += [P('Das Beratungsgespräch', 'titel'),
       P('Leitfaden zur Schulung — vom ersten Anruf bis zur Weiterempfehlung', 'unter'),
       kasten('Wofür dieses Blatt da ist', [
         P('Eine Zusammenfassung der 15 Schulungsvideos zum Nachschlagen: der rote Faden, die wichtigsten Sätze '
           'und die Zahlen, die in den Videos genannt werden. Es ersetzt nicht das Original-Handout aus dem Seminar — '
           'es ist aus den Videos zusammengestellt.', 'box'),
         P('Preise und Gebühren stehen hier bewusst nicht. Sie ändern sich; was gerade gilt, weiß die Studioleitung.', 'box')]),
       P('Der rote Faden', 'h1'),
       tabelle(['#', 'Schritt', 'Worum es geht'], [
         ['1', 'Terminvereinbarung', 'Call-in, Walk-in, Call-out — schnell und zeitnah zum Termin'],
         ['2', 'Begrüßung', 'Mit Namen, Überblick geben, warm werden, loben, Angst nehmen'],
         ['3', 'Bedarfsanalyse', 'Nicht nur <i>was</i> er möchte, sondern <i>warum</i> — das emotionale Ziel'],
         ['4', 'Training', 'Ziele erwähnen, loben, so reden, als wäre er schon Mitglied'],
         ['5', 'Angebotspräsentation', 'Ziele zusammenfassen, eine klare Empfehlung, sicher und selbstbewusst'],
         ['6', 'Einwandbehandlung', 'Hinterfragen, isolieren, Bedingungsfrage, gemeinsam eine Lösung'],
         ['7', 'Weiterempfehlung', 'VIP-Einladungen direkt nach der Anmeldung'],
         ['8', 'Nachfassen', 'Nach zwei Tagen anrufen; ohne Abschluss: zweites Training vereinbaren'],
       ], [10, 45, 115]),
       P('Grundhaltung', 'h1'),
       liste(['<b>Du selbst bleiben.</b> Der Interessent ist der Spiegel des Beraters: Wer sich verstellt, gestresst '
              'oder unsicher ist, den durchschaut er.',
              '<b>Gestresst?</b> Begrüßen, Platz nehmen lassen, Getränk anbieten — kurz rausgehen, durchatmen, dann '
              'entspannt ins Gespräch.',
              '<b>Niemals für den Kunden denken.</b> Wer denkt „das ist bestimmt zu teuer für den", sorgt genau dafür.',
              '<b>Das Interesse ist schon da.</b> Er hat sich informiert, angerufen, einen Termin gemacht und ist '
              'hergefahren. Die meisten wissen, dass es mehr kostet als ein normales Fitnessstudio.']),
       ]

st += [P('1 · Terminvereinbarung', 'h1'),
       P('Warum es zählt', 'h2'),
       P('Wer anruft oder vorbeikommt, hat den ersten Kontakt mit dem Studio. Ein Abo hat im Schnitt einen Wert von '
         'rund <b>2.500 Euro</b> — Empfehlungen und Verlängerungen noch nicht eingerechnet. Klappt schon der Termin nicht, '
         'wird es mit dem Mitgliederzuwachs schwer.'),
       P('„Was kostet das?"', 'h2'),
       P('In über <b>80 %</b> der Fälle will der Anrufer damit nicht vergleichen — er weiß schlicht nicht, was er sonst '
         'fragen soll. Eigentlich möchte er eingeladen werden.'),
       satz('„Schön, dass Sie sich für unser Studio interessieren. Haben Sie schon einmal EMS-Training gemacht? — Nein? '
            'Dann lade ich Sie gern kostenlos und unverbindlich ein: ein individuelles Beratungsgespräch, wir nehmen uns '
            'eine Stunde Zeit. Passt es Ihnen eher vormittags oder abends?"'),
       P('Fragt er ein <b>zweites Mal</b> nach dem Preis: nicht drei-, viermal ausweichen, sondern offen antworten — '
         'und zurück zum Termin.'),
       satz('„Es gibt verschiedene Varianten, die meisten unserer Gäste entscheiden sich für … Welche für Sie passt, '
            'schauen wir gern im kostenlosen Gespräch. Lieber morgen um 20 Uhr oder übermorgen?"'),
       P('„Was ist das mit dem Strom?"', 'h2'),
       P('Kein Fachvortrag — kurz und knapp, dann einladen.'),
       satz('„Durch die besondere Technik trainieren wir die gesamte Muskulatur gleichzeitig — deshalb dauert das '
            'Training nur 20 Minuten. Je nach Ihren Zielen wird es individuell gestaltet. Damit wir das genau besprechen '
            'können, lade ich Sie gern ein …"'),
       P('Auf Nachfrage: niederfrequenter Reizstrom bringt den Muskel zum Anspannen — der Reiz kommt sonst vom Gehirn. '
         'Deshalb lassen sich Bauch, Rücken, Beine einzeln ansteuern.', 'klein'),
       P('Regeln für jeden Termin', 'h2'),
       liste(['Immer eine <b>Alternativfrage</b>: „eher vormittags oder abends?" — dann zwei konkrete Zeiten.',
              '<b>Zeitnah</b> terminieren. Ein Termin in zwei Wochen wird selten wahrgenommen — die Lust ist jetzt da.',
              'Walk-in: offen und herzlich begrüßen, kein großer Rundgang, einen Termin vereinbaren.',
              '<b>Einen Tag vorher bestätigen</b>: Uhrzeit, Anfahrt, vorher etwas trinken, Handtuch und Sportschuhe. '
              'Nicht erreicht: SMS vom Studio-Handy.']),
       P('Call-out — wir rufen an', 'h2'),
       liste(['Anfrage über Formular, Homepage oder E-Mail: <b>so schnell wie möglich anrufen</b>. Viele schreiben zwei, '
              'drei Studios an — wer sich zuerst meldet und zuerst einen Termin hat, gewinnt.',
              'Nicht erreicht: E-Mail schreiben, am nächsten Tag noch einmal anrufen.',
              'Bei Online-Aktionen neugierig machen: auf das Ziel eingehen (z. B. Rücken), kurz sagen, warum EMS passt '
              '(tiefliegende Muskulatur, gelenk- und bandscheibenschonend, immer jemand an der Seite) — dann mit '
              'Alternativfrage einladen.']),
       ]

st += [P('2 · Begrüßung', 'h1'),
       liste(['<b>Herzensöffner Nummer eins: mit Namen begrüßen.</b> Vorher im Terminplaner nachsehen, wer kommt — nicht '
              'erst suchen, wenn die Tür aufgeht.',
              '<b>Das magische Viereck</b> aus Mundwinkeln und Schultern: je größer, desto positiver die Ausstrahlung.',
              'Platz und Getränk anbieten, dann einen <b>Überblick</b> geben — viele waren noch nie in einem Studio und sind unsicher.']),
       satz('„Wir bleiben kurz hier sitzen und sprechen über Ihre Ziele, Wünsche und Vorstellungen. Danach trainieren wir '
            'gemeinsam, und im Anschluss zeige ich Ihnen, wie Sie bei uns mitmachen können. Damit ich Sie optimal beraten '
            'kann, mache ich mir ein paar Notizen — ist das in Ordnung?"'),
       liste(['<b>Du oder Sie:</b> mit Vornamen vorstellen und darauf achten, was dem Interessenten lieber ist.',
              '<b>Eisbrecherfragen:</b> „Waren Sie schon mal in einem Fitnessstudio?", „Wie sind Sie auf uns aufmerksam '
              'geworden — was hat Sie angesprochen?" Die Antworten helfen später bei Angebot und Einwänden.',
              '<b>Ehrliches Interesse</b> statt Fragebogen-Roboter. Lieber eine Frage vergessen als unsicher wirken.',
              '<b>Loben und bestätigen:</b> „Wie lange überlegen Sie schon? — Klasse, dass Sie den ersten Schritt gemacht '
              'haben, der ist für viele der schwierigste. Die nächsten gehen wir gemeinsam."',
              '<b>Angst nehmen:</b> Das erste Training wird moderat, die Werte werden gespeichert, man steigert sich nach und nach.']),
       ]

st += [P('3 · Bedarfsanalyse — das Herzstück', 'h1'),
       P('Nicht nur herausfinden, <b>was</b> der Kunde möchte, sondern <b>warum</b>. Das Warum ist immer ein emotionales Ziel. '
         'Jede Kaufentscheidung ist emotional — heute geht man zum Teil von 100 % aus; rational wird sie hinterher erklärt.'),
       tabelle(['Rational', 'Emotional (ein Bild)'], [
         ['5 Kilo abnehmen', '5 Kilo abnehmen, um im Sommerurlaub im Lieblingsbikini am Strand zu liegen'],
         ['Rückenschmerzen in der Lendenwirbelsäule', 'Abends nach der Arbeit mit den Kindern spielen statt auf der Couch zu liegen'],
       ], [60, 110]),
       liste(['<b>Offene Fragen.</b> Bei einer guten Bedarfsanalyse redet der Interessent mehr als der Berater.',
              '<b>Das dominante Kaufmotiv</b> ist der Hauptgrund, warum er hier sitzt — nicht der Rücken, sondern was er '
              'ohne Schmerzen tun könnte.',
              '<b>Die Lieblingsfrage:</b> „Was wäre für Sie anders, wenn die Schmerzen weg wären?" oder „In welchen '
              'Situationen merken Sie es besonders?"',
              '<b>Verstärker:</b> Hin-zu- und Weg-von-Motive. „Was wäre mit Ihrem Rücken, wenn Sie nicht starten?" — '
              'z. B. der Arzt hat eine OP oder Medikamente in Aussicht gestellt.']),
       kasten('Leitfaden zur Kaufmotivsuche', [
         P('<b>Vergangenheit:</b> „Wie lange haben Sie das schon?"', 'box'),
         P('<b>Gegenwart:</b> „In welchen Situationen merken Sie es besonders? Wo schränkt es Sie ein?"', 'box'),
         P('<b>Zukunft:</b> „Was wäre für Sie konkret anders, wenn es weg wäre?" — das ist das emotionale Ziel.', 'box')]),
       P('Einwandvorbehandlung', 'h2'),
       P('Fragen, die später helfen, wenn ein Einwand kommt:'),
       liste(['„Wie lange überlegen Sie schon, etwas für Ihre Gesundheit zu tun?" — für „ich muss noch überlegen".',
              '„Gibt es jemanden, der Sie bei Ihrem Vorhaben unterstützt?" — für „ich muss mit meinem Partner sprechen".',
              '„Wenn Sie Ihr Ziel erreicht haben, möchten Sie es dann auch halten?" — niemand sagt nein, und später '
              'begründet es die längere Laufzeit mit seinen eigenen Worten.']),
       P('Vor dem Training', 'h2'),
       liste(['<b>Gesundheit:</b> „Gibt es gesundheitlich etwas, worauf wir achten müssen?" Nur nach Rücksprache mit dem Arzt '
              'u. a. bei Herzschrittmacher, akuter Tumorerkrankung, Epilepsie, Schwangerschaft. Zur Trainingsgestaltung '
              'auch nach Blutdruck und Diabetes fragen. Die vollständige Liste der Kontraindikationen liegt im Studio — '
              '<b>kein Training ohne Unterschrift</b>.',
              '<b>Ziele zusammenfassen</b>, „damit ich nichts vergessen habe" — und: „Dann zeige ich Ihnen jetzt, wie wir '
              'gemeinsam Ihre Ziele erreichen."']),
       ]

st += [P('4 · Training und 5 · Angebotspräsentation', 'h1'),
       liste(['Im Training <b>die Ziele erwähnen</b>: „Die Übung ist speziell für deinen Nacken." Nur weil du weißt, wofür '
              'sie ist, weiß es der Kunde noch nicht.',
              'Danach <b>ehrlich loben</b>: „Fürs erste Mal hat es richtig gut geklappt."',
              '<b>So reden, als wäre er schon Mitglied:</b> „Deine Werte sind auf der Chipkarte gespeichert, beim nächsten '
              'Mal geht es direkt los."',
              '<b>Kaufentscheidungsfrage</b> als Übergang: „Kannst du dir vorstellen, wiederzukommen? Gibt es sonst noch Fragen?"',
              '<b>Sicher und selbstbewusst</b> präsentieren. Wer denkt „hoffentlich sagt er nicht nein", hört nein.',
              '<b>Vorher die Ziele zusammenfassen</b> — das letzte Gespräch darüber ist rund 20 Minuten her.',
              '<b>Immer eine Empfehlung</b> aussprechen, begründet mit seinen Worten. Ohne Empfehlung heißt es: „Ich schlaf '
              'noch eine Nacht drüber." Entscheidet er sich anders: ankreuzen, auch gut.',
              'Die einmaligen Posten <b>einfach und selbstverständlich</b> erklären. Das Startpaket enthält die Trainingsplanung '
              'für die ganze Mitgliedschaft — dazu z. B. Ernährungsgespräch und Analyse, und die Trainer bilden sich regelmäßig fort.']),
       satz('„Du hast gesagt, dir ist wichtig, schmerzfrei mit den Kindern spielen zu können — und über dein Lieblingshemd '
            'haben wir auch gesprochen. Du wolltest dein Ziel nicht nur erreichen, sondern halten. Da kommen die 24 Monate '
            'infrage — die Variante, die die meisten unserer Mitglieder machen."'),
       P('Wörter, die wirken', 'h2'),
       tabelle(['Statt', 'Besser'], [
         ['Vertrag', 'Mitgliedschaft'],
         ['Kosten, Beitrag', 'Investition — „du investierst nur … die Woche in deine Gesundheit"'],
         ['Unterschrift', 'Bestätigung — „hier brauche ich noch deine Bestätigung"'],
       ], [50, 120]),
       P('Ein Hauptgrund, warum sich jemand nicht anmeldet: Das emotionale Ziel wurde nicht gefunden. Dann heißt es hinterher „zu teuer".', 'klein'),
       ]

st += [P('6 · Einwandbehandlung', 'h1'),
       P('Einwände lassen sich vorbereiten — dann sind sie nicht schlimm. Wichtig ist, sie <b>im Gespräch</b> zu behandeln: '
         'Selbst von denen, die begeistert „nächste Woche festmachen" wollen, kommen <b>weniger als 10 %</b> wieder. Zu Hause '
         'flacht die Motivation ab — wie ein Blatt Papier, das man immer kleiner faltet.'),
       tabelle(['Schritt', 'So klingt es'], [
         ['1. Durchatmen, schweigen', 'Nicht losschießen („stimmt doch gar nicht, für Personal Training ist das günstig").'],
         ['2. Verständnis zeigen', '„Kann ich mir vorstellen, dass sich das erst mal viel anhört — mehr als im Fitnessstudio."'],
         ['3. Hinterfragen', '„Gibt es sonst noch Fragen oder Punkte, die offen sind?"'],
         ['4. Isolieren', '„Wenn ich dich richtig verstehe, geht es nur noch um die Laufzeit?"'],
         ['5. Bedingungsfrage', '„Wenn wir dafür eine Lösung finden — kannst du dir vorstellen, zu starten?"'],
         ['6. Lösung', 'Anbieten — oder finden lassen: „Was wäre für dich die optimale Lösung?"'],
       ], [45, 125]),
       P('Beispiele aus den Videos', 'h2'),
       liste(['<b>Laufzeit unsicher</b> („ich bräuchte 2–3 Monate, um zu sehen, ob es passt"): mit der kürzeren Variante '
              'starten und notieren, dass jederzeit auf die günstigere gewechselt werden kann.',
              '<b>Umzug möglich:</b> mit der günstigsten Variante starten und ein außerordentliches Kündigungsrecht für den '
              'Umzug ausdrücklich in die Mitgliedschaft schreiben.',
              '<b>Einmalige Gebühren zu viel auf einmal:</b> auf zwei oder drei Monate aufteilen — oder die Wäsche schenken. '
              '<b>Nur, wenn es mit der Inhaberin / dem Inhaber abgesprochen ist.</b> Lieber aufteilen, als ein Abo im Wert von '
              'rund 2.500 Euro zu verlieren.',
              '<b>„Das ist aber teuer":</b> „Was meinst du, warum ist es mehr als im normalen Studio?" — Es ist immer ein '
              'Personal Training, immer jemand an deiner Seite. Mobile Trainer, die mit dem Gerät nach Hause kommen, nehmen '
              '80–100 Euro je Einheit. Und: eine Investition in die Gesundheit.',
              '<b>„Ich muss noch mal überlegen"</b> ist meist ein Vorwand. „Du überlegst schon zwölf Monate — wo kann ich dich '
              'noch unterstützen, welche Frage ist offen?" Oder: „Was ist mit deinem Schmerz nach Feierabend, wenn du nicht '
              'startest?" Dahinter kommt meist Preis oder Laufzeit — dann weiter mit den sechs Schritten.']),
       P('Üben', 'h2'),
       P('Antworten auf „Was kostet das?" und auf die häufigsten Einwände in eigenen Worten formulieren und im Team '
         'untereinander üben — man muss es ein paar Mal gemacht haben.'),
       ]

st += [P('7 · Weiterempfehlung und VIP-Einladung', 'h1'),
       liste(['Die einfachste und günstigste Art, neue Mitglieder zu gewinnen: Über klassische Werbung kostet ein neues Mitglied '
              'im Schnitt <b>150–200 Euro</b>, über eine Empfehlung <b>nichts</b> — und Empfohlene sind leichter zu überzeugen.',
              '<b>Passiv:</b> Wir warten, bis ein Mitglied empfiehlt. Voraussetzung ist ein <b>begeistertes</b>, nicht nur zufriedenes '
              'Mitglied — Erwartungen übertreffen, z. B. mit „Magic Moments".',
              '<b>Aktiv:</b> Wir haben es selbst in der Hand. Der „König der Empfehler" ist der <b>gerade neu gewonnene Kunde</b>.']),
       P('Die VIP-Einladung', 'h2'),
       P('Direkt nach der Anmeldung, bevor der nächste Termin gebucht wird — als „kleine Überraschung":'),
       satz('„Als Neumitglied hast du ein besonderes Privileg: Du kannst zwei VIP-Einladungen im Wert von 100 Euro an Freunde '
            'oder Bekannte verschenken — ein Personal Training mit individueller Beratung, so wie du es heute erlebt hast. Fällt '
            'dir spontan jemand ein?"'),
       liste(['Namen notieren. „Es gehört zu unserem Service, sie persönlich einzuladen." <b>Niemand wird angerufen, ohne dass das '
              'Mitglied vorher Bescheid gesagt hat.</b>',
              'Nummer nicht zur Hand oder darf nicht herausgegeben werden: Einladung reservieren — „ich rufe dich in zwei Tagen '
              'sowieso an, bis dahin kannst du mit ihr sprechen".',
              '„Mir fällt keiner ein": Einladung bis zum nächsten Training liegen lassen und dann noch einmal fragen.',
              'Wird der Eingeladene Mitglied, bekommt das Neumitglied <b>50 Euro</b> gutgeschrieben. Der Gutschein (50 Euro) wird '
              'dem Eingeladenen aufs Startpaket angerechnet.',
              'Am Telefon mit der eingeladenen Person <b>nicht „Probetraining"</b> sagen: „… hat Ihnen eine hochwertige '
              'VIP-Einladung im Wert von 50 Euro geschenkt — ein Personal Training mit individueller Beratung, auf Wunsch mit '
              'Körperanalyse. Wie hört sich das für Sie an?"',
              '<b>Der größte Fehler: nicht fragen.</b> Jeder Zweite spricht eine Empfehlung aus — man muss es nur anbieten.']),
       ]

st += [P('8 · Nachfassen und kein Abschluss', 'h1'),
       liste(['<b>Kein Abschluss heute?</b> Verständnis zeigen und ein zweites richtiges Training vorschlagen — nicht „schauen '
              'wir mal nach einem Termin", sonst heißt es „muss erst in meinen Kalender gucken".',
              '<b>Zwei Tage nach dem ersten Training anrufen</b> — neue Mitglieder genauso wie die, die noch überlegen: Wie geht '
              'es dir? Manche kennen keinen Muskelkater und wundern sich. Dabei den nächsten Termin bestätigen.']),
       satz('„Kann ich gut verstehen, das war viel Neues. Mein Vorschlag: Wir trainieren nächste Woche noch einmal richtig '
            'zusammen — die Werte sind schon gespeichert, und das zweite Mal macht immer mehr Spaß als das erste. Danach '
            'schauen wir weiter."'),
       Spacer(1, 8),
       kasten('Checkliste für jedes Gespräch', [
         P('□ Name vorher nachgesehen, mit Namen begrüßt · Überblick gegeben · Notizen erlaubt', 'box'),
         P('□ Eisbrecher, ehrliches Interesse, gelobt · Angst vor dem Training genommen', 'box'),
         P('□ Emotionales Ziel gefunden (Vergangenheit — Gegenwart — Zukunft) · Einwandvorbehandlung gefragt', 'box'),
         P('□ Kontraindikationen besprochen und unterschrieben · Ziele zusammengefasst', 'box'),
         P('□ Im Training Ziele erwähnt · gelobt · wie ein Mitglied behandelt', 'box'),
         P('□ Vor dem Angebot Ziele zusammengefasst · eine Empfehlung · sicher präsentiert', 'box'),
         P('□ Einwand: durchatmen, Verständnis, hinterfragen, isolieren, Bedingungsfrage, Lösung', 'box'),
         P('□ VIP-Einladungen angeboten · nächster Termin gebucht · Anruf nach zwei Tagen eingeplant', 'box')]),
       Spacer(1, 6),
       P('Zusammengestellt am 30.9.2026 aus den Abschriften der 15 Schulungsvideos „Das Beratungsgespräch". '
         'Zahlen und Formulierungen stammen aus den Videos; Preise und Gebühren sind absichtlich weggelassen.', 'klein'),
       ]

doc.build(st)
print('ok', ziel)
