# PDF 2: „Schichtplaner – Handbuch, Grenzen, Beobachten" (Runde 169)
# Aufruf: python3 handbuch.py <ziel.pdf>
# Jede Zahl hier ist gemessen (siehe docs/FORTSCHRITT.md, Runde 169) oder
# ausdrücklich als Schätzung bezeichnet.
import sys
from reportlab.lib.units import mm
from stil import *

doc = dokument(sys.argv[1], "Schichtplaner – Handbuch, Grenzen, Beobachten",
               "Schichtplaner · Handbuch und Grenzen · Stand 21.10.2026")
s = []
s.append(P("Schichtplaner – was er kann, wo seine Grenzen sind", st["titel"]))
s.append(P("Für die Geschäftsführung und für alle, die den Planer betreuen: wie er entscheidet, was er "
           "(noch) nicht kann, worauf man in den ersten Monaten achten sollte und was als Nächstes sinnvoll wäre.",
           st["unter"]))

s.append(kasten("<b>Der Grundsatz:</b> Der Planer entscheidet nach festen Regeln, ohne KI. Gleiche Angaben "
                "ergeben denselben Plan, und jede Einteilung trägt ihren Grund. Was er nicht sicher entscheiden kann, "
                "legt er als <b>Lücke</b> (rot) oder <b>Rückfrage</b> (gelb) vor – er bricht nie still eine Regel."))

# 1
s.append(P("1 · Was er kann", st["h1"]))
s.append(tabelle([
    ["Funktion", "Wo", "Kurz"],
    ["Monatsplan für alle Studios", "Schichtplaner → „Plan erstellen“", "alle Studios, alle Schichten, unter 1,5 s (gemessen)"],
    ["Excel einlesen", "Schritt „Team“", "Mitarbeiter, Schichten, Studios, feste Schichten, Sondertage, Einstellungen"],
    ["Feste Einteilungen", "Regeln &amp; Sonderfälle", "Person X immer Mo Früh in Studio Y – oder an einem Datum"],
    ["Sondertage", "Regeln &amp; Sonderfälle", "Schicht geschlossen oder mehr Personen an einem Tag"],
    ["Wünsche der Mitarbeiter", "Team → Schichten → „Meine Wünsche“", "Wunsch-frei-Tage und früh/spät bis zur Frist"],
    ["Urlaub &amp; Krankheit", "kommt aus „Abwesend“", "beim Erstellen ausgeschlossen; danach als „Ausfälle“"],
    ["Ausfälle mit Ersatz", "oben im Planer", "Krankmeldung nach dem Erstellen → 3 passende Ersatzleute zum Antippen"],
    ["Umbesetzen &amp; Tauschen", "Plan antippen", "beste Kandidaten oben, ausgegraut mit Grund; Tausch am selben Tag"],
    ["Fairness", "Stunden im Studio", "Wochenenden, Feiertage, früh/spät reihum; Soll-Stunden; Kennzahlen"],
    ["Veröffentlichen", "„Fertig?“", "in den Team-Schichtplan (Tausch, Kalender-Abo, Meine Woche)"],
    ["Für LogX kopieren", "„Fertig?“", "Tabelle Datum · Tag · Studio · Schicht · Beginn · Ende · Name"],
    ["Änderungen nach Veröffentlichung", "automatisch", "Ersatz/Tausch ändert die veröffentlichte Schicht mit"],
], [44 * mm, 46 * mm, BREITE - 90 * mm]))

# 2
s.append(P("2 · Wie er entscheidet", st["h1"]))
s.append(P("Für jeden Tag des Monats, in dieser Reihenfolge:", st["text"]))
s += punkte([
    "<b>1. Feste Einteilungen</b> der Geschäftsführung zuerst.",
    "<b>2. Die knappsten Plätze zuerst:</b> eine Schicht, für die nur eine Person infrage kommt, wird vor den anderen besetzt.",
    "<b>3. Je Platz die beste Person</b> nach Punkten (unten). Findet sich ohne Regelbruch niemand, wird geprüft, ob jemand "
    "<i>nur</i> an einer weichen Regel scheitert – dann Einteilung als <b>Rückfrage</b>. Sonst <b>Lücke</b> mit Grund.",
])
s.append(P("Harte Regeln – werden nie gebrochen", st["h2"]))
s.append(tabelle([
    ["Regel", "Herkunft"],
    ["Urlaub (genehmigt oder offen) und Krankheit", "Abwesend in StudioChat"],
    ["„nie“, Uhrzeitfenster („9–14“), „nach Absprache“, feste Sperrzeiten", "Excel: Mo … So, Sperrzeiten"],
    ["vor dem ersten / nach dem letzten Arbeitstag", "Excel"],
    ["eine Schicht pro Person und Tag", "fest eingebaut"],
    ["11 Stunden Ruhe vor und nach jeder Schicht – auch über die Monatsgrenze", "Arbeitszeitgesetz § 5"],
    ["höchstens 10 Stunden je Schicht", "Arbeitszeitgesetz § 3"],
    ["unter 18: nur 6–20 Uhr, höchstens 8 Stunden", "Jugendarbeitsschutzgesetz (strenge Auslegung)"],
    ["Minijob/Aushilfe: Monatsgrenze in Stunden", "Excel: Höchstens Std. pro Monat"],
    ["„darf nicht allein“: nur mit jemandem, der allein darf, zur selben Zeit im selben Studio", "Excel"],
    ["„braucht jemanden mit …“: mind. eine Person mit dieser Fähigkeit", "Excel: Schichten / Kann besonders"],
    ["nur Haupt- und Springer-Studios", "Excel"],
], [118 * mm, BREITE - 118 * mm]))
s.append(P("Weiche Regeln – nur als sichtbare Rückfrage gebrochen", st["h2"]))
s.append(tabelle([
    ["Regel", "Wann gebrochen"],
    ["Wunsch-frei-Tag (vor der Frist eingetragen)", "nur wenn sonst niemand da wäre"],
    ["Höchstens Tage pro Woche", "dito"],
    ["mehr als 115 % der Soll-Stunden", "dito"],
    ["mehr Tage am Stück als eingestellt (Vorgabe 6)", "dito"],
], [118 * mm, BREITE - 118 * mm]))
s.append(P("Punkte – wer vorne liegt (offen im Code, nach den Antworten anpassbar)", st["h2"]))
s.append(tabelle([
    ["Merkmal", "Punkte"],
    ["Hauptstudio (statt Springer)", "+30"],
    ["unter Soll (je fehlender Schichtlänge)", "+4 je Schicht, höchstens +40; über Soll bis −20"],
    ["Vorliebe früh/spät erfüllt / verfehlt", "+12 / −12"],
    ["„egal“: Ausgleich früh/spät", "−2 je Schicht Ungleichgewicht"],
    ["Wochenende: je schon gearbeitetem Wochenendtag", "−15"],
    ["Feiertag: je schon gearbeitetem Feiertag", "−20"],
    ["lange Ketten: ab dem 4. Tag am Stück", "−4 je weiterem Tag"],
    ["hat die benötigte Fähigkeit", "+25"],
    ["beim Ersatz: „springt bei Ausfall ein: ja“", "+20"],
], [118 * mm, BREITE - 118 * mm]))

# 3
s.append(P("3 · Krankheit, Urlaub, Tausch", st["h1"]))
s += punkte([
    "<b>Beim Erstellen:</b> wer an einem Tag abwesend ist, kommt dort nicht vor.",
    "<b>Danach:</b> Beim Öffnen lädt der Planer die Abwesenheiten neu. Wer im Plan steht und jetzt krank oder im Urlaub ist, "
    "erscheint unter <b>„Ausfälle“</b> – mit bis zu drei Ersatzleuten, die alle harten Regeln erfüllen. Ein Tipp trägt ein.",
    "<b>Veröffentlichter Plan:</b> Ersatz und Tausch ändern die Schicht im Team-Schichtplan mit (gleiche Schicht, neue Person).",
    "<b>Tauschen:</b> Wer am selben Tag eine andere Schicht hat, wird mit dem Knopf „Tauschen“ angeboten – nur, wenn es in "
    "<i>beide</i> Richtungen nach den Regeln geht (z. B. nicht, wenn danach ein Azubi allein stünde).",
    "<b>Vergangene Tage</b> erscheinen nicht mehr als Ausfall.",
])

# 4
s.append(P("4 · Wer was sieht (Datenschutz)", st["h1"]))
s.append(tabelle([
    ["Daten", "Wer liest", "Wer schreibt"],
    ["Angaben je Person (Stunden, Verfügbarkeit …)", "Geschäftsführung; die Person ihre eigene Zeile", "Geschäftsführung"],
    ["Wünsche", "Geschäftsführung; die Person ihre eigenen", "nur die Person selbst"],
    ["Entwurf des Monats", "nur Geschäftsführung", "nur Geschäftsführung"],
    ["Schichten, Regeln, Frist", "alle im Betrieb (Frist muss jeder sehen)", "Geschäftsführung"],
    ["Veröffentlichte Schichten", "wie bisher: das Team des Studios", "Geschäftsführung"],
], [62 * mm, 62 * mm, BREITE - 124 * mm]))
s.append(P("Die Grenzen stehen in den Sicherheitsregeln der Datenbank, nicht nur in der Oberfläche – "
           "geprüft mit 65 Regeltests in beiden Datenpfaden. Studioleitungen haben (noch) keinen Zugriff.", st["klein"]))

# 5
s.append(P("5 · Grenzen – ehrlich und mit Zahlen", st["h1"]))
s.append(tabelle([
    ["Grenze", "Was das bedeutet"],
    ["<b>Rechenzeit</b>: 60 Personen, 14 Studios, 3 Schichten/Tag: 0,8 s; 150 Personen: 1,4 s (gemessen auf dem Server-Rechner)",
     "am Handy vermutlich 2–4× länger (geschätzt, nicht gemessen)"],
    ["<b>Plangröße</b>: ein Monat mit ~1.800 Einsätzen = 590 KB; Grenze je Dokument 1 MB",
     "ab ~900 KB fallen die Begründungstexte weg; darüber Meldung statt Speichern (geschätzt ab ~3.500 Einsätzen)"],
    ["<b>Feste Schichtblöcke</b>", "keine frei gleitenden Arbeitszeiten; Öffnungszeiten werden gespeichert, aber noch nicht genutzt"],
    ["<b>Eine Schicht pro Tag</b> je Person", "keine geteilten Dienste (vormittags + abends)"],
    ["<b>Schrittweises Verfahren</b>", "kein Optimum über den ganzen Monat: eine Lücke, die erst durch Umstellen mehrerer Tage verschwände, bleibt eine Lücke (dann Tausch von Hand)"],
    ["<b>„Braucht jemanden mit …“</b>", "eine Fähigkeit je Schicht"],
    ["<b>Feiertage</b>", "nur NRW; „geschlossen“ gilt für alle Studios"],
    ["<b>Minijob</b>", "Grenze in Stunden, nicht in Euro; Zuschläge werden nicht berechnet"],
    ["<b>Jugendschutz</b>", "strenge Auslegung (6–20 Uhr, 8 Std.); Ausnahmen müssten eingetragen werden"],
    ["<b>Namen</b>", "Zuordnung Excel ↔ App-Konto über den Namen; ohne Konto wird geplant, aber nicht veröffentlicht"],
    ["<b>Nur Geschäftsführung</b>", "Studioleitungen sehen den Planer nicht"],
    ["<b>Gleichzeitig bearbeiten</b>", "zwei Personen am selben Monat: wer zuletzt speichert, gewinnt"],
    ["<b>Benachrichtigung</b>", "Ersatzleute bekommen keine eigene Push-Nachricht „du springst ein“ – nur die Schicht im Plan"],
    ["<b>LogX</b>", "keine Verbindung; die Tabelle wird kopiert und eingefügt. Spaltenformat noch nicht mit LogX abgeglichen"],
    ["<b>Excel</b>", "nur .xlsx; geprüft mit Dateien aus openpyxl und LibreOffice – <b>nicht</b> mit Microsoft Excel"],
    ["<b>Wunschfrist</b>", "hält die App und der Planer ein, nicht die Datenbankregel"],
], [78 * mm, BREITE - 78 * mm]))

# 6
s.append(P("6 · Was in den ersten Monaten beobachten", st["h1"]))
s.append(tabelle([
    ["Beobachten", "Woran man es merkt", "Was tun"],
    ["Vergleich mit dem Handplan", "Planer-Entwurf weicht stark vom gewohnten Plan ab", "fehlende Regel finden (Feste Schicht, Sondertag, Verfügbarkeit) und eintragen"],
    ["Personen ohne App-Konto", "Meldung beim Einlesen „ohne Konto“", "Konto mit gleichem Namen anlegen"],
    ["Viele Rückfragen bei denselben Personen", "gelbe Punkte häufen sich", "Soll-Stunden, Höchsttage oder Wünsche prüfen"],
    ["Viele Lücken in einem Studio", "rote Kachel", "Springer zuordnen (Weitere Studios) oder Mindestbesetzung prüfen"],
    ["Hinweis „nicht verstanden“", "unter „Hinweise zum ganzen Plan“", "Verfügbarkeit in erlaubter Form schreiben"],
    ["Unfaire Verteilung", "Fairness-Zeile: Wochenenden/Feiertage mit großem Unterschied", "melden – Punkte werden nachgezogen"],
    ["Ausfälle nicht erledigt", "rote Karte „Ausfälle“ bleibt", "Ersatz antippen oder im Plan tauschen"],
    ["Doppelte Schichten im Team-Plan", "eine Person steht zweimal", "nur über den Planer veröffentlichen; von Hand Eingetragenes bleibt neben dem Planer stehen"],
    ["Offene Urlaubsanträge", "Person fehlt im Plan, obwohl Antrag noch nicht genehmigt", "gewollt: offene Anträge zählen als abwesend – rechtzeitig entscheiden"],
], [44 * mm, 56 * mm, BREITE - 100 * mm]))

# 7
s.append(P("7 · Verbesserungsvorschläge – in sinnvoller Reihenfolge", st["h1"]))
s.append(tabelle([
    ["#", "Vorschlag", "Nutzen"],
    ["1", "LogX anschauen und die Kopier-Tabelle bzw. eine Import-Datei genau passend machen", "kein Umsortieren mehr in LogX"],
    ["2", "Push an die Ersatzperson mit „Übernehmen / Kann nicht“", "Ausfälle ohne Telefonieren lösen"],
    ["3", "Studioleitungen für ihre Studios freischalten (lesen, Ausfälle ersetzen)", "Arbeit verteilt sich"],
    ["4", "Automatisches Nachbessern: Lücken durch Tauschketten schließen", "weniger Handarbeit bei knappen Studios"],
    ["5", "Schichten aus Öffnungszeiten und Stoßzeiten ableiten (gleitende Zeiten)", "genauer bei unterschiedlichen Öffnungszeiten"],
    ["6", "Soll/Ist mit der Zeiterfassung (Stempeln) abgleichen; Stundenkonto", "faire Stunden über Monate"],
    ["7", "Mehrere Fähigkeiten je Schicht; Qualifikationen mit Ablaufdatum (aus „Nachweise“)", "z. B. Erste Hilfe immer im Studio"],
    ["8", "Fairness über mehrere Monate (Wochenenden des Vormonats mitzählen)", "gerechter auf lange Sicht"],
    ["9", "Plan-Versionen und „Rückgängig“; Hinweis bei gleichzeitiger Bearbeitung", "Sicherheit bei mehreren Bearbeitern"],
    ["10", "Excel-Ausfüllhilfe direkt in der App (Mitarbeiter-Angaben als Formular)", "ohne Excel pflegen"],
], [8 * mm, 108 * mm, BREITE - 116 * mm]))

# 8
s.append(P("8 · Wie es geprüft ist", st["h1"]))
s += punkte([
    "<b>82 Prüfungen der Rechnung</b> (ohne Browser): harte Regeln, Wünsche, Lücken, Feiertage, feste Einteilungen, "
    "Sondertage, Tage am Stück, Fairness, Krankheit → Ersatz, Tausch, Vormonat, Excel-Blätter. Zu jeder Regel eine Gegenprobe "
    "(Regel abgeschaltet → Prüfung rot).",
    "<b>97 Prüfungen der Oberfläche</b> in der Demo, inklusive Trefferflächen bei 320–1920 px Breite.",
    "<b>65 Sicherheitsregel-Prüfungen</b> in beiden Datenpfaden.",
    "<b>Nicht geprüft:</b> Schreiben in die echte Datenbank (im Testbrowser nicht möglich) und Dateien aus Microsoft Excel.",
], "text")
doc.build(s)
print("gespeichert", sys.argv[1])
