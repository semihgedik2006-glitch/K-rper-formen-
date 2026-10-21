# PDF 1: „Schichtplaner – Was die Geschäftsführung einträgt" (Runde 169)
# Aufruf: python3 eintragen.py <ziel.pdf>
import sys
from reportlab.lib.units import mm
from stil import *

doc = dokument(sys.argv[1], "Schichtplaner – Was die Geschäftsführung einträgt",
               "Schichtplaner · Vollständige Eintrage-Liste · Stand 21.10.2026")
s = []
s.append(P("Schichtplaner – alles, was Sie eintragen", st["titel"]))
s.append(P("Die vollständige Liste: was einmal eingerichtet wird, was jeden Monat ansteht und was laufend "
           "passiert. Je genauer die Angaben, desto weniger bleibt am Ende von Hand zu tun.", st["unter"]))

s.append(kasten("<b>Kurz gesagt:</b> Einmal die Excel-Vorlage ausfüllen und einlesen (ca. eine Stunde für 14 Studios, "
                "geschätzt). Danach pro Monat: auf die Wunschfrist warten, <b>„Plan erstellen“</b>, die roten und gelben "
                "Punkte klären, <b>veröffentlichen</b>. Krankmeldungen erscheinen von selbst unter „Ausfälle“ – mit "
                "Ersatzvorschlag zum Antippen."))
s.append(Spacer(1, 6))

s.append(P("Überblick: wer trägt was wo ein?", st["h1"]))
s.append(tabelle([
    ["Was", "Wo", "Wer", "Wie oft"],
    ["Studios, Schichtzeiten, Mitarbeiter-Angaben", "Excel-Vorlage → „Excel einlesen“", "Geschäftsführung", "einmal, danach bei Änderungen"],
    ["Feste Einteilungen, Sondertage, Einstellungen", "Excel-Vorlage <b>oder</b> App: Schichtplaner → Regeln &amp; Sonderfälle", "Geschäftsführung", "bei Bedarf"],
    ["Notiz zum Monat", "App: Regeln &amp; Sonderfälle", "Geschäftsführung", "jeden Monat (freiwillig)"],
    ["Wunsch-frei-Tage, früh/spät", "App: Team → Schichten → „Meine Wünsche“", "jede Mitarbeiterin, jeder Mitarbeiter", "jeden Monat bis zur Frist"],
    ["Urlaub (Antrag) und Krankmeldung", "App: Team → Abwesend", "Mitarbeiter; Leitung genehmigt Urlaub", "laufend"],
    ["App-Konto je Person (gleicher Name wie im Excel)", "App: Verwaltung → Team", "Geschäftsführung", "einmal je Person"],
], [52 * mm, 52 * mm, 38 * mm, BREITE - 142 * mm]))

# ── A ──
s.append(P("A · Einmalig: die Excel-Vorlage", st["h1"]))
s.append(P("Die leere Vorlage gibt es in der App unter Schichtplaner → Schritt „Team“ → <b>Vorlage</b>. Grau "
           "hinterlegte Zeilen und Zeilen mit „Beispiel“ werden beim Einlesen übersprungen. Die Spalten werden über "
           "ihre Überschrift gefunden – Spalten bitte nicht umbenennen, verschieben ist erlaubt.", st["text"]))

s.append(P("Blatt „Schichten“ – <i>Pflicht</i>", st["h2"]))
s.append(tabelle([
    ["Spalte", "Pflicht", "So eintragen", "Was der Planer damit macht"],
    ["Studio (oder „alle“)", "ja", "Studio aus der Liste oder <b>alle</b>", "„alle“ gilt für jedes Studio ohne eigene Zeilen"],
    ["Name der Schicht", "ja", "Früh, Spät, Samstag …", "erscheint im Plan, in LogX und im Team-Schichtplan"],
    ["Beginn / Ende", "ja", "07:00 / 14:00", "Dauer zählt für Stunden; vor 12 Uhr = „früh“"],
    ["An welchen Tagen?", "ja", "Mo–Fr · Sa · Mo, Mi, Fr · alle", "an anderen Tagen gibt es diese Schicht nicht"],
    ["Mindestens Personen", "ja", "1, 2 …", "so viele werden eingeteilt; weniger = rote Lücke"],
    ["Braucht jemanden mit …", "nein", "Abschluss, Probetraining …", "mind. eine Person mit dieser Fähigkeit (Spalte „Kann besonders“)"],
], [36 * mm, 13 * mm, 52 * mm, BREITE - 101 * mm]))

s.append(P("Blatt „Mitarbeiter“ – eine Zeile pro Person – <i>Pflicht</i>", st["h2"]))
s.append(tabelle([
    ["Spalte", "Pflicht", "So eintragen", "Was der Planer damit macht"],
    ["Name", "ja", "<b>genau wie das App-Konto</b> (Vor- und Nachname)", "verknüpft Wünsche, Urlaub, Krankmeldung und den Team-Schichtplan"],
    ["Rolle / Vertragsart", "ja", "Vollzeit, Teilzeit, Minijob, Azubi, Duales Studium …", "Minijob/Aushilfe: Monatsgrenze ist hart"],
    ["Hauptstudio", "ja", "aus der Liste", "wird bevorzugt eingeteilt"],
    ["Weitere Studios (Springer)", "nein", "Longerich, Rath", "darf dort einspringen; ohne Eintrag nur Hauptstudio"],
    ["Stunden pro Woche (Soll)", "ja*", "40, 20 …", "Soll im Monat = Woche × Tage ÷ 7; über 115 % nur mit Rückfrage"],
    ["Höchstens Std. pro Monat", "ja* (Minijob)", "z. B. 40", "<b>nie</b> überschritten"],
    ["Höchstens Tage pro Woche", "nein", "3, 5 …", "mehr nur als Rückfrage"],
    ["Darf allein im Studio sein?", "ja", "ja / nein", "„nein“: nur mit jemandem, der allein darf, in derselben Zeit"],
    ["Unter 18?", "ja", "ja / nein", "„ja“: nur 6–20 Uhr, höchstens 8 Std. (Jugendarbeitsschutz)"],
    ["Kann besonders …", "nein", "Probetraining, Abschluss", "für Schichten mit „Braucht jemanden mit …“"],
    ["Mo … So (7 Spalten)", "empfohlen", "ganztags · nur früh · nur spät · nie · nach Absprache · <b>9–14</b>", "„nie“ und Uhrzeiten sind hart; „nach Absprache“ = nur auf Nachfrage; leer = ganztags"],
    ["Feste Sperrzeiten", "nein", "Di Berufsschule, Mi Uni", "an diesem Wochentag nie (Wörter: Schule, Uni, Kurs, Sperre, nie)"],
    ["Lieber", "nein", "Früh / Spät / egal", "Vorliebe; „egal“ = früh und spät werden ausgeglichen"],
    ["Springt bei Ausfall ein?", "nein", "ja / nein", "„ja“: steht bei Krankheit anderer oben in der Ersatzliste"],
    ["Erster / Letzter Arbeitstag", "nein", "01.11.2026", "vorher bzw. danach nicht eingeplant (neu, Kündigung, Elternzeit)"],
    ["Bemerkung", "nein", "freier Text", "nur zur Information, wird nicht ausgewertet"],
], [38 * mm, 18 * mm, 50 * mm, BREITE - 106 * mm]))
s.append(P("* Entweder Wochenstunden (Soll) oder – bei Minijob – Monatsgrenze. Ohne beides weiß der Planer nicht, "
           "wie viel jemand arbeiten soll, und verteilt nur nach Verfügbarkeit.", st["klein"]))

s.append(P("Blatt „Studios“ – <i>empfohlen</i>", st["h2"]))
s.append(P("Öffnungszeiten, Mindestbesetzung, Stoßzeiten und Bemerkung je Studio. <b>Ehrlich:</b> Der Planer rechnet "
           "heute mit den Schichten (Blatt „Schichten“), nicht mit den Öffnungszeiten. Die Angaben werden gespeichert "
           "und sind die Grundlage, um später Schichten aus Öffnungszeiten abzuleiten.", st["text"]))

s.append(P("Blatt „Feste Schichten“ – <i>freiwillig</i>", st["h2"]))
s.append(tabelle([
    ["Spalte", "So eintragen", "Wirkung"],
    ["Person", "Name wie im Blatt „Mitarbeiter“", "wird zuerst eingeteilt, vor allen anderen"],
    ["Studio / Schicht", "Studio aus der Liste, Schichtname wie im Blatt „Schichten“", "genau diese Schicht"],
    ["Wochentage ODER Datum", "Mo, Mi  ·  oder  14.11.2026", "jede Woche an diesen Tagen bzw. nur an dem Tag"],
], [36 * mm, 70 * mm, BREITE - 106 * mm]))
s.append(P("Fest heißt: Wünsche und Höchsttage zählen dort nicht. Urlaub, Krankheit, Ruhezeit und Jugendschutz "
           "schon – dann steht ein Hinweis im Plan und der Platz wird normal besetzt.", st["klein"]))

s.append(KeepTogether([P("Blatt „Sondertage“ – <i>freiwillig</i>", st["h2"]), tabelle([
    ["Spalte", "So eintragen", "Wirkung"],
    ["Datum", "24.12.2026", "nur dieser Tag"],
    ["Studio", "Studio oder <b>alle</b>", ""],
    ["Art", "geschlossen · mehr Personen", "„geschlossen“: Schicht fällt weg · „mehr“: Mindestbesetzung steigt"],
    ["Schicht", "Schichtname oder leer", "leer = alle Schichten des Tages"],
    ["Wie viele mehr?", "1, 2 …", "nur bei „mehr Personen“"],
    ["Anlass", "Tag der offenen Tür, Inventur …", "steht im Planer"],
], [36 * mm, 60 * mm, BREITE - 96 * mm])]))

s.append(P("Blatt „Einstellungen“", st["h2"]))
s.append(tabelle([
    ["Einstellung", "Vorgabe", "Wirkung"],
    ["Wunschfrist (Tag im Vormonat)", "15", "bis zu diesem Tag 23:59 Uhr tragen Mitarbeiter Wünsche ein; Späteres zählt nicht"],
    ["Feiertage geschlossen?", "nein", "„ja“: an NRW-Feiertagen niemand eingeplant"],
    ["Höchstens Tage am Stück", "6", "der 7. Tag in Folge nur als Rückfrage"],
    ["Höchstens Wunsch-frei-Tage", "4", "mehr lässt die App nicht antippen; 0 = keine Grenze"],
], [56 * mm, 20 * mm, BREITE - 76 * mm]))

s.append(P("Blatt „Fragen“", st["h2"]))
s.append(P("Die 20 Fragen aus dem ersten Heft. Ihre Antworten fließen in die Regeln des Planers ein – siehe "
           "Abschnitt F unten, welche noch offen sind.", st["text"]))

# ── B ──
s.append(P("B · In der App: Schichtplaner → Regeln &amp; Sonderfälle", st["h1"]))
s.append(P("Alles aus den Blättern „Feste Schichten“, „Sondertage“ und „Einstellungen“ lässt sich auch direkt in "
           "der App pflegen – ohne die Datei neu einzulesen. Ein erneutes Einlesen überschreibt diese Angaben nur, "
           "wenn die Datei welche enthält.", st["text"]))
s += punkte([
    "<b>Einstellungen:</b> Wunschfrist, höchstens Tage am Stück, höchstens Wunsch-frei-Tage, Feiertage geschlossen.",
    "<b>Feste Einteilung:</b> Person, Studio, Schicht – dazu Wochentage antippen <i>oder</i> ein Datum wählen.",
    "<b>Sondertag:</b> Datum, Studio (oder alle), geschlossen / mehr Personen, Schicht, Anzahl, Anlass.",
    "<b>Notiz zum Monat:</b> steht oben im Planer (z. B. „Inventur am 14.“, „Lena ab 20. in Elternzeit“).",
    "Alles gilt beim <b>nächsten</b> „Plan erstellen“. Ein schon erstellter Plan ändert sich dadurch nicht von selbst.",
])

# ── C ──
s.append(P("C · Jeden Monat – die Checkliste", st["h1"]))
s.append(tabelle([
    ["Wann", "Wer", "Was"],
    ["bis zum 15. (Frist)", "alle im Plan", "„Meine Wünsche“ für den Folgemonat eintragen"],
    ["laufend", "alle", "Urlaub beantragen (Leitung genehmigt), Krankheit melden – Team → Abwesend"],
    ["ab dem 16.", "Geschäftsführung", "Regeln &amp; Sonderfälle prüfen (neue Sondertage? Notiz?)"],
    ["ab dem 16.", "Geschäftsführung", "<b>Plan erstellen</b> (dauert unter einer Sekunde)"],
    ["danach", "Geschäftsführung", "Studio-Kacheln von rot nach grün abarbeiten: Lücken besetzen, Rückfragen absprechen"],
    ["danach", "Geschäftsführung", "<b>Im Team-Schichtplan veröffentlichen</b> – alle sehen ihre Schichten"],
    ["danach", "Geschäftsführung", "<b>Für LogX kopieren</b> und in LogX einfügen"],
    ["bis Monatsende", "Geschäftsführung", "Unter „Ausfälle“ nach Krankmeldungen schauen und Ersatz antippen"],
], [32 * mm, 34 * mm, BREITE - 66 * mm]))

# ── D ──
s.append(P("D · Laufend – damit der Planer stimmt", st["h1"]))
s += punkte([
    "<b>Neue Person:</b> App-Konto anlegen (gleicher Name!), Zeile in der Excel-Tabelle ergänzen, neu einlesen – "
    "oder „Erster Arbeitstag“ eintragen.",
    "<b>Person geht:</b> „Letzter Arbeitstag“ eintragen und neu einlesen. Wer in der Datei fehlt, wird beim Einlesen "
    "aus dem Planer entfernt (die App fragt vorher).",
    "<b>Stunden oder Verfügbarkeit ändern sich:</b> Zeile ändern, neu einlesen.",
    "<b>Urlaub:</b> nur genehmigter oder noch offener Urlaub zählt; abgelehnter nicht.",
    "<b>Krankmeldung nach dem Erstellen:</b> erscheint unter „Ausfälle“. Ersatz antippen – ist der Plan schon "
    "veröffentlicht, wird die Schicht im Team-Schichtplan mitgeändert.",
])

# ── E ──
s.append(P("E · Häufige Stolpersteine beim Ausfüllen", st["h1"]))
s.append(tabelle([
    ["Fehler", "Folge", "So vermeiden"],
    ["Name anders als im App-Konto („Lisa M.“ vs. „Lisa Müller“)", "Wünsche, Urlaub und Veröffentlichen erreichen die Person nicht", "vollen Namen wie in der App; die App meldet „ohne Konto“"],
    ["Studio falsch geschrieben", "Zeile wird gemeldet und nicht übernommen", "Auswahlliste benutzen"],
    ["Schichtname in „Feste Schichten“ weicht ab", "feste Einteilung fehlt (wird gemeldet)", "Namen aus dem Blatt „Schichten“ kopieren"],
    ["Uhrzeit als Text „7 Uhr“", "nicht sicher lesbar", "07:00 oder 7:00"],
    ["Feste Schicht mit Datum ohne Jahr („14.11.“)", "Zeile wird gemeldet und nicht übernommen", "Datum mit Jahr: 14.11.2026 – oder Wochentage: Mo, Mi"],
    ["Weder Wochenstunden noch Monatsgrenze", "Person bekommt keine Zielstunden", "eine der beiden Spalten füllen"],
    ["Verfügbarkeit „vormittags“", "nicht verstanden → als ganztags gerechnet (Hinweis im Plan)", "nur früh / nur spät / 9–14"],
], [55 * mm, 55 * mm, BREITE - 110 * mm]))

s.append(P("F · Noch offene Fragen, die den Plan genauer machen", st["h1"]))
s += punkte([
    "Wer zählt als <b>Begleitung</b> für Personen, die nicht allein sein dürfen? (heute: jede Person mit „darf allein: ja“)",
    "<b>Mindestbesetzung je Tageszeit</b> und Stoßzeiten – heute über „Mindestens Personen“ je Schicht bzw. Sondertage.",
    "<b>Feiertage:</b> geöffnet oder geschlossen (Einstellung)?",
    "<b>Vorrang bei Konflikten:</b> heute Besetzung vor Wünschen – Wünsche werden nur als Rückfrage gebrochen.",
    "Sollen <b>Studioleitungen</b> für ihre Studios planen dürfen? (heute nur die Geschäftsführung)",
    "Wie trägt man in <b>LogX</b> ein? (Bildschirmfotos/Export – damit die Kopier-Tabelle genau passt)",
])
doc.build(s)
print("gespeichert", sys.argv[1])
