# Studienlage: Psychologische Wirkung von Gestaltung und Informationsarchitektur

Bericht für die Team-App des Studios. Stand 22.10.2026.

## Wie diese Quellen geprüft sind

Die Websuche hat funktioniert. Das direkte Öffnen von Seiten hat in dieser Umgebung **nicht** funktioniert: WebFetch und curl bekamen DNS- bzw. Proxy-Fehler, unter anderem bei PubMed Central, DOAJ und nngroup.com. Ich habe also **keinen Volltext und keine Verlagsseite selbst geöffnet.**

Die Kennzeichnung bedeutet deshalb:

- **(a)** Bibliografische Angaben und Abstract-Aussagen wurden über Suchtreffer bestätigt: Verlagsseite, PubMed, Uni-Repositorium, ACM, Autorenseite. Das Abstract habe ich nur in diesen Auszügen gesehen, nicht als ganzes Dokument.
- **(b)** Nur aus Sekundärquellen bekannt (Zusammenfassungen, Zitate in anderen Arbeiten, Presse) oder nicht begutachtet.

DOIs stehen nur dort, wo sie in den Treffern genannt wurden. Zahlen ohne Quelle sind weggelassen.

---

## Allgemein: Grundlagen der Wahrnehmung und Belastung

**1. Hick, W. E. (1952).** On the rate of gain of information. *Quarterly Journal of Experimental Psychology*, 4(1), 11–26. DOI 10.1080/17470215208416600.
**Hyman, R. (1953).** Stimulus information as a determinant of reaction time. *Journal of Experimental Psychology*, 45(3), 188–196. — **(b)**, Angaben über Wikipedia und Lehrunterlagen.
- **Kern:** Die Wahlreaktionszeit steigt linear mit der Information der Auswahl, also logarithmisch mit der Zahl gleich wahrscheinlicher Möglichkeiten. Hyman hat das auf ungleiche Wahrscheinlichkeiten erweitert.
- **Bezug:** Stützt **Maßnahme 1** nur schwach. Die Kosten wachsen logarithmisch, nicht linear. Von 10 auf 5 Punkte spart man also weniger, als es sich anfühlt. Nach Cockburn 2007 (Nr. 2) gilt das Gesetz ausserdem nur für **geübte** Nutzer.

**2. Cockburn, A., Gutwin, C., & Greenberg, S. (2007).** A predictive model of menu performance. *CHI '07*, 627–636. DOI 10.1145/1240624.1240723. — **(a)**
- **Kern:** Das Modell setzt die Menüzeit aus drei Teilen zusammen. Fitts für das Zeigen, **lineare visuelle Suche bei Neulingen**, Hick-Hyman für Geübte. Dazu kommt ein Übergang von Neuling zu Geübtem. Die Vorhersagen passten eng zu den Messungen bei vier Menüformen.
- **Bezug:** **Maßnahme 1 und 2.** Wer etwas „nicht findet“, sucht noch. Bei der Suche kostet jeder zusätzliche Eintrag linear Zeit. Weniger und **stabile** Einträge helfen deshalb Neulingen am meisten. Feste Positionen helfen beim Übergang zum Geübten.

**3. Cowan, N. (2001).** The magical number 4 in short-term memory: A reconsideration of mental storage capacity. *Behavioral and Brain Sciences*, 24(1), 87–114 (Kommentare 114–185). DOI 10.1017/S0140525X01003922. PMID 11515286. — **(a)**
- **Kern:** Das Kurzzeitgedächtnis fasst etwa **4 Einheiten („chunks“)**, nicht Millers 7 ± 2.
- **Bezug:** **Maßnahme 1** passt dazu (5 Bereiche). **Vorsicht:** Eine Navigation, die sichtbar bleibt, muss man nicht im Gedächtnis halten. Man *erkennt* sie (Nr. 6). Cowan ist deshalb kein Beweis für „höchstens 5 Menüpunkte“. Er stützt eher, dass **wenig gleichzeitig offen** sein soll: wenige offene Punkte auf „Heute“, nicht fünf Listen parallel. Siehe auch hcibook.com „menu breadth – not a case of Miller's 7±2“ (b).

**4. Sweller, J. (1988).** Cognitive load during problem solving: Effects on learning. *Cognitive Science*, 12(2), 257–285. DOI 10.1207/s15516709cog1202_4. — **(a)**
- **Kern:** Problemlösen über Mittel-Ziel-Analyse bindet viel Verarbeitungskapazität. Diese Kapazität fehlt dann für den Aufbau von Schemata, also fürs Lernen.
- **Bezug:** **Allgemein und Maßnahme 3.** Ein Bildschirm, auf dem man erst herausfinden muss, *wo* etwas ist, erzeugt „extrinsische“ Belastung, die für die eigentliche Arbeit fehlt. Die Übertragung von Lernaufgaben auf Arbeitsoberflächen ist **eine Ableitung**, kein Befund der Studie.

**5. Pirolli, P., & Card, S. (1999).** Information foraging. *Psychological Review*, 106(4), 643–675. DOI 10.1037/0033-295X.106.4.643. — **(a)**, nur bibliografisch und über Sekundärbeschreibung.
- **Kern:** Menschen suchen Informationen wie Tiere Futter. Hinweise wie Beschriftungen und Symbole haben eine „Duftspur“ (information scent). Danach schätzen Nutzer ab, ob sich ein Pfad lohnt.
- **Bezug:** **Maßnahme 2 relativiert:** Ein Sammelbegriff wie „Bestand“ hat für „Wo ist das Pad-Gel?“ womöglich **schwächeren Duft** als „Material“. Zusammenlegen funktioniert nur, wenn der Oberbegriff die Unterbegriffe sichtbar trägt, etwa „Bestand – Material, Geräte, Archiv“.

**6. Nielsen, J. (1994).** Enhancing the explanatory power of usability heuristics. *Proc. CHI '94*, 152–158. — **(a)**, bibliografisch und erste Seite.
- **Kern:** Eine Faktorenanalyse von Heuristiken an einer Datenbank echter Usability-Probleme. „Recognition rather than recall“ gehört zu den Heuristiken mit der höchsten Erklärkraft.
- **Bezug:** **Maßnahme 1 und 5 relativiert:** Alles hinter ☰ oder „…“ muss man *erinnern*, nicht erkennen. Das spricht dafür, Häufiges sichtbar zu lassen.

**7. Deci, E. L., Olafsen, A. H., & Ryan, R. M. (2017).** Self-determination theory in work organizations: The state of a science. *Annual Review of Organizational Psychology and Organizational Behavior*, 4, 19–43. DOI 10.1146/annurev-orgpsych-032516-113108. — **(a)**, bibliografisch.
- **Kern:** Ein Überblick über die Selbstbestimmungstheorie am Arbeitsplatz. Autonome Motivation ist günstiger als kontrollierte, und es zählen drei Grundbedürfnisse: Kompetenz, Autonomie, Eingebundenheit.
- **Bezug:** **Maßnahme 4 und allgemein.** Ein Werkzeug, das sich wie Kontrolle anfühlt („rote Zahl, du bist im Rückstand“), drückt eher auf kontrollierte Motivation. Sichtbare eigene Fortschritte („erledigt“) bedienen Kompetenz. Das ist **Ableitung**, kein UI-Experiment.

---

## Maßnahme 1: Navigation auf 5 Bereiche, Rest unter „Alles“ (☰)

**8. Miller, D. P. (1981).** The depth/breadth tradeoff in hierarchical computer menus. *Proceedings of the Human Factors Society 25th Annual Meeting*, 2, 296–300. — **(b)**
- **Kern:** 64 Ziele in vier Formen: 64¹, 2⁶, 4³, 8². Laut Sekundärquellen war **8² (zwei Ebenen mit je 8)** am schnellsten und fehlerärmsten. Tiefe kostete Zeit. Die Angaben zur Signifikanz sind in den Sekundärquellen widersprüchlich.
- **Bezug:** Stützt „zwei Ebenen mit mittlerer Breite“, also 5 Hauptbereiche plus „Alles“ mit einer weiteren Ebene. Mehr als zwei Ebenen werden gegen diesen Befund teuer.

**9. Kiger, J. I. (1984).** The depth/breadth trade-off in the design of menu-driven user interfaces. *International Journal of Man-Machine Studies*, 20, 201–213. — **(b)**
- **Kern:** In Sammelreferaten wird die Arbeit dazu gezählt, dass **mehr Tiefe keinen Vorteil** bringt. Häufig wird 8×8 als beste Form genannt. Diese Zahl konnte ich in den Treffern **nicht** bestätigen.
- **Bezug:** Gegenbefund zu „lieber tief als breit“. Die Breite der zweiten Ebene („Alles“) darf ruhig gross sein, solange sie gegliedert ist.

**10. Landauer, T. K., & Nachbar, D. W. (1985).** Selection from alphabetic and numeric menu trees using a touch screen: Breadth, depth, and width. *Proc. CHI '85*, 73–78. — **(b)**
- **Kern:** Wird zitiert als Befund, dass **mehr Breite** die Leistung verbessert. Das gilt bei *geordneten* (alphabetisch oder numerisch sortierten) Einträgen.
- **Bezug:** **Relativiert Maßnahme 1.** Eine breite, *gut geordnete* Liste unter „Alles“ ist schneller als eine verschachtelte. „Alles“ sollte flach und gruppiert sein, nicht weitere Untermenüs haben.

**11. Larson, K., & Czerwinski, M. (1998).** Web page design: Implications of memory, structure and scent for information retrieval. *Proc. CHI '98*, 25–32. DOI 10.1145/274644.274649 (über Suchtreffer). — **(a)**
- **Kern:** Tiefe verschlechterte die Suche. Eine **mittlere Struktur** schlug laut Abstract-Zusammenfassung aber auch die breiteste, flachste. Die genauen Formen (z. B. 8×8×8, 16×32, 32×16) kenne ich nur aus dem Gedächtnis, in dieser Sitzung **nicht bestätigt**. Die Autoren erklären das mit Gruppierung und Duftspur.
- **Bezug:** **Stützt Maßnahme 1** (zwei Ebenen) und mahnt zugleich: Breite allein reicht nicht. Die Gruppierung innerhalb von „Alles“ entscheidet.

**12. Zaphiris, P. (2000).** Depth vs. breadth in the arrangement of web links. *Proceedings of the 44th Human Factors and Ergonomics Society Annual Meeting*, 139–144. — **(a)**, Repositorium der Cyprus University of Technology.
**Zaphiris, P., Shneiderman, B., & Norman, K. L. (2002).** Expandable indexes vs. sequential menus for searching hierarchies on the World Wide Web. *Behaviour & Information Technology*. — **(a)**
- **Kern 2000:** „Task completion time increases as the depth of the web site structure increases.“
- **Kern 2002:** Weniger Tiefe verbesserte Tempo und Sucheffizienz. Aufklappbare Indizes waren bei tiefen Hierarchien **schlechter** als aufeinanderfolgende Menüs.
- **Bezug:** **Stützt Maßnahme 1** (flach halten). Der Befund von 2002 betrifft auch **Maßnahme 3**: Viel Aufklapp-Verschachtelung kann schaden.

**13. Nielsen Norman Group (2016).** Hidden navigation (Hamburger) study, 179 Teilnehmende, 6 Websites, Rechner und Handy, mit WhatUsersDo. Artikel: „Hamburger Menus and Hidden Navigation Hurt UX Metrics“, „Find Navigation on Mobile (Even Hamburger)“, „… on Desktop: Not Hamburger“. nngroup.com/articles/hamburger-menus/ — **(b), nicht begutachtet.** Die Seite liess sich hier nicht öffnen. Die Zahlen stammen aus Sekundärzusammenfassungen und widersprechen sich teilweise.
- **Kern:** Versteckte Navigation wurde seltener gefunden (Sekundärquelle: rund 20 % weniger; NN/g-Video: „fast halbiert“). Aufgaben dauerten länger, **am Rechner um etwa 39 %, am Handy um etwa 15 %**. Die Schwierigkeit wurde höher eingeschätzt. „Combo“ (einige Punkte sichtbar, Rest hinter ☰) war so gut wie die ganz sichtbare Navigation.
- **Bezug:** **Stützt Maßnahme 1 in der Combo-Form** (5 sichtbar plus ☰). **Wichtig für den PC:** Am Rechner schadet ein ☰ deutlich mehr. Dort sollten mehr Ziele sichtbar sein, etwa eine Seitenleiste.
- Eine begutachtete Studie speziell zu Hamburger-Menüs habe ich **nicht gefunden.**

**14. Sears, A., & Shneiderman, B. (1994).** Split menus: Effectively using selection frequency to organize menus. *ACM TOCHI*, 1(1), 27–51. DOI 10.1145/174630.174632. — **(a)**
- **Kern:** Die häufigsten Einträge kommen oben in einen eigenen Block. In Feldstudien sank die Auswahlzeit um **etwa 17–58 %**. Im Laborversuch waren die geteilten Menüs schneller als alphabetische und beliebter. Häufige, vertraute Einträge folgen eher dem logarithmischen Modell, seltene dem linearen.
- **Bezug:** **Stützt Maßnahme 1 und 5 direkt.** Die Wahl der 5 Hauptbereiche sollte sich nach der **gemessenen Nutzungshäufigkeit** richten, nicht nach der Organisationslogik. Seltenes wandert nach hinten.

## Maßnahme 2: Zusammenlegen (Bestand, Pinnwand, eine Nachrichtenliste)

- **Pirolli & Card 1999 (Nr. 5)** und **Larson & Czerwinski 1998 (Nr. 11):** Gruppieren hilft nur, wenn die Gruppe für die gesuchte Sache einen klaren Duft hat.
  - „Bestand“ ist ein abstrakter Begriff. Die Unterbegriffe gehören sichtbar dazu, oder die Suche findet über die Grenze hinweg.
  - „Pinnwand“ für Infos plus Brett ist unproblematischer, weil beides „Aushang“ ist.
- **Cockburn et al. 2007 (Nr. 2):** Zusammenlegen spart Einträge bei der linearen Suche. Es kostet aber, wenn Nutzer ein *altes* Ziel an der gewohnten Stelle erwarten. Der Wechsel vom Neuling zum Geübten beginnt neu.
- **Tuch et al. 2012 (Nr. 16, unten):** Prototypikalität, also Vertrautheit, wirkt auf den Eindruck. Eine **einzige Nachrichtenliste** (Gruppen und Direkt gemischt) ist das Muster, das WhatsApp, Signal und Slack geprägt haben. Das ist hier prototypisch und spricht für die Zusammenlegung. Die Übertragung ist eine Ableitung.
- Eine Studie, die genau „zwei Listen gegen eine gemischte Chatliste“ vergleicht, habe ich **nicht gefunden**.

## Maßnahme 3: „Erledigt“ einklappen (progressive disclosure)

**15. Carroll, J. M., & Carrithers, C. (1984).** Training wheels in a user interface. *Communications of the ACM*, 27(8), 800–806. — **(a)**, IBM-Research-Abstract.
- **Kern:** In einer Textverarbeitung waren fehlerträchtige Funktionen für Neulinge gesperrt. Ergebnis: schnelleres Lernen und bessere Leistung im Nachtest. Die Kontrollgruppe verbrachte **fast ein Viertel der Zeit** damit, Fehlerzustände zu reparieren.
- **Bezug:** Der klassische empirische Beleg für progressive disclosure. **Stützt Maßnahme 3 und 5:** Weniger Sichtbares heisst weniger Fehlgriffe. Er betrifft allerdings *Funktionen*, nicht erledigte Listeneinträge.

**Zeigarnik-Effekt (Ghibellini & Meier 2025).** *Humanities and Social Sciences Communications* (Nature-Portfolio), 12, Artikel s41599-025-05000-w. — **(a)** für die Kernaussage über das Abstract der Uni Bern; die Effektgrösse ist **(b)**.
- **Kern:** Die Metaanalyse fand **keinen allgemeinen Gedächtnisvorteil für unerledigte Aufgaben** (Zeigarnik). Es gibt aber eine allgemeine Tendenz, unterbrochene Aufgaben **wieder aufzunehmen** (Ovsiankina). Laut Sekundärquelle wurden 59 Publikationen ausgewertet, mit d ≈ 0,15 (unbestätigt).
- **Bezug:** Die populäre Begründung „offene Aufgaben im Blick halten, weil sie im Kopf nagen“ ist **wissenschaftlich schwach**. Belastbar ist: Offene Dinge ziehen zum Weitermachen. Daraus folgt: offene Aufgaben sichtbar, Erledigtes weg. Das passt zu Maßnahme 3.

**Masicampo, E. J., & Baumeister, R. F. (2011).** Consider it done! Plan making can eliminate the cognitive effects of unfulfilled goals. *Journal of Personality and Social Psychology*, 101(4), 667–683. DOI 10.1037/a0024192. — **(a)**
- **Kern:** Unerledigte Ziele verursachten aufdringliche Gedanken und schlechtere Leistung in einer fremden Aufgabe. Ein **konkreter Plan** (wann, wo, wie) beseitigte diese Störeffekte.
- **Bezug:** Für die App: Eine offene Aufgabe mit **Zuständigem und Termin** belastet weniger als eine ohne. Das stützt Felder wie „wer/bis wann“ und **relativiert** zugleich die Idee, Offenes immer laut anzuzeigen.

Gegenbefund zum Einklappen: **Zaphiris, Shneiderman & Norman 2002 (Nr. 12).** Aufklappbare Strukturen waren bei Tiefe schlechter. Daraus folgt: nur **eine** Ebene einklappen, also „Erledigt (12) ›“, nicht verschachtelt.

## Maßnahme 4: Ungelesen-Punkte statt Zahlen

**17. Kushlev, K., Proulx, J., & Dunn, E. W. (2016).** „Silence your phones“: Smartphone notifications increase inattention and hyperactivity symptoms. *Proc. CHI '16*, 1011–1020. — **(a)**
- **Kern:** Feldexperiment im Innersubjektplan mit **221** Teilnehmenden. Eine Woche lief mit Benachrichtigungen an und Telefon in Reichweite, eine mit Benachrichtigungen aus und Telefon weg. In der „An“-Woche berichteten sie mehr Unaufmerksamkeit und Hyperaktivität. Unaufmerksamkeit sagte geringere Produktivität und geringeres Wohlbefinden vorher. Gemessen wurde per Selbstauskunft.
- **Bezug:** Betrifft vor allem **Push**-Unterbrechungen, weniger stumme Abzeichen. **Stützt Maßnahme 4 indirekt:** weniger Unterbrechungsdruck.

**18. Stothart, C., Mitchum, A., & Yehnert, C. (2015).** The attentional cost of receiving a cell phone notification. *Journal of Experimental Psychology: Human Perception and Performance*, 41(4), 893–897. DOI 10.1037/xhp0000100. — **(a)**
- **Kern:** Schon das *Eintreffen* einer Benachrichtigung, ohne sie zu lesen, störte eine Aufmerksamkeitsaufgabe deutlich, ähnlich stark wie aktives Telefonieren oder Schreiben. Die Zahl „mehr als dreimal so viele Fehler“ stammt aus der Presse **(b)**.
- **Bezug:** Unterbrechung entsteht schon durch das Signal. Für die App heisst das: **Push** nur für Dinge, die wirklich mich betreffen.

**19. Pielot, M., Church, K., & de Oliveira, R. (2014).** An in-situ study of mobile phone notifications. *MobileHCI '14*, 233–242. DOI 10.1145/2628363.2628364. — **(a)**
- **Kern:** 15 Personen, eine Woche. Im Mittel **63,5 Benachrichtigungen pro Tag**, meist Messenger und Mail.
  - Mehr Benachrichtigungen gingen mit **mehr negativen Gefühlen** einher.
  - Mehr Nachrichten und soziale Updates gingen aber auch mit **mehr Verbundenheit** einher.
  - Sozialer Druck war ein Hauptgrund fürs sofortige Nachsehen.
- **Bezug:** **Stützt und relativiert Maßnahme 4.** Menge erzeugt Stress, persönliche Nachrichten erzeugen aber Verbundenheit. Deshalb **unterscheiden**: an mich gerichtet gegen allgemeines Rauschen.

**20. Mark, G., Gudith, D., & Klocke, U. (2008).** The cost of interrupted work: More speed and stress. *Proc. CHI '08*, 107–110. DOI 10.1145/1357054.1357072. — **(a)**
- **Kern:** Unterbrochene Aufgaben wurden **schneller** erledigt, bei gleicher Qualität. Der Preis waren **mehr Stress, Frustration, Zeitdruck und Anstrengung**.
- **Bezug:** Unterbrechungen sehen in Zahlen harmlos aus und kosten Befinden. Das stützt Maßnahme 4.

**21. Mark, G., Voida, S., & Cardello, A. (2012).** „A pace not dictated by electrons“: An empirical study of work without email. *Proc. CHI '12*, 555–564. — **(a)**
- **Kern:** 13 Beschäftigte, 5 Tage ohne E-Mail. Sie wechselten seltener das Fenster und blieben länger bei einer Sache. Die Herzratenvariabilität zeigte **weniger Stress**.
- **Bezug:** Kleine Stichprobe, aber physiologisch gemessen. Stützt gebündelte statt dauernd sichtbare Nachrichtenzähler.

**22. Bartoli, N., & Benedetto, S. (2022).** Driven by notifications – exploring the effects of badge notifications on user experience. *PLoS ONE*, 17(6), e0270888. DOI 10.1371/journal.pone.0270888. — **(a)**, nur Abstract-Inhalt über Suchtreffer; Effektgrössen **nicht** gesehen.
- **Kern:** Online-Experiment mit über 1.000 Teilnehmenden und 15 Gruppen. Ein Startbildschirm hatte 15 App-Symbole, eins davon mit Abzeichen. Apps **mit Abzeichen wurden deutlich häufiger zuerst angetippt.**
- **Bezug:** **Gegenbefund und Warnung zugleich:** Abzeichen *wirken*, sie lenken stark. Ein Abzeichen an etwas Unwichtigem zieht Aufmerksamkeit von Wichtigem ab. Ob **Punkt oder Zahl** besser ist, untersucht die Studie nicht. Ein Feldvergleich von Zahl gegen Punkt wurde **nicht gefunden.** Herstellerzahlen wie „+88 % Öffnungen durch Badges“ (Localytics) sind unbelegtes Marketing **(b)**.

Fazit zu 4: Die Belege stützen **weniger und gezieltere** Signale. Für „Punkt statt Zahl“ als Stressminderung gibt es **keine direkte Studie**. Das ist eine plausible Ableitung aus Nr. 17–21, keine Messung.

## Maßnahme 5: Seltenes ins „…“-Menü, Abmelden ins Profil

**23. Parhi, P., Karlson, A. K., & Bederson, B. B. (2006).** Target size study for one-handed thumb use on small touchscreen devices. *MobileHCI '06*. DOI 10.1145/1152215.1152260. — **(a)**
- **Kern:** Empfohlen sind **9,2 mm** für einzelne Ziele (Knöpfe) und **9,6 mm** für Folgen von Zielen (Tippen in Serie). Darüber gab es keine weitere Verbesserung von Leistung und Vorliebe.
- **Bezug:** Rund 9,2 mm entsprechen bei üblicher Dichte etwa 44–48 CSS-px, passend zur Hausregel 44 × 44. **Stützt Maßnahme 5:** Wer pro Zeile Bearbeiten, Löschen und Erledigt als eigene grosse Ziele zeigt, hat am Handy keinen Platz. Ein „…“-Ziel in voller Grösse ist besser als drei zu kleine.

**24. Bergstrom-Lehtovirta, J., & Oulasvirta, A. (2014).** Modeling the functional area of the thumb on mobile touchscreen surfaces. *Proc. CHI '14*, 1991–2000. — **(a)**
- **Kern:** Ein quadratisches Modell der mit dem Daumen erreichbaren Fläche, abhängig von Gerätegrösse, Handgrösse und Griff. Es passte gut auf die Bewegungsbahnen von 20 Teilnehmenden.
- **Bezug:** Wissenschaftliche Grundlage für die „Daumenzone“. Häufige Aktionen gehören unten in die Mitte, seltene dürfen nach oben oder ins „…“.
- Hoobers Daumenzonen-Zahlen (UXmatters, Buch) sind **nicht begutachtet (b)**.

**Fitts, P. M. (1954).** The information capacity of the human motor system in controlling the amplitude of movement. *Journal of Experimental Psychology*, 47(6), 381–391. — **(b)**, aus dem Gedächtnis und Sekundärzitaten; in dieser Sitzung nicht gesucht.
- **Kern:** Die Zeigezeit wächst mit dem Logarithmus von Distanz durch Zielbreite.
- **Bezug:** Ist in Cockburn 2007 (Nr. 2) als Baustein eingebaut.

**Sears & Shneiderman 1994 (Nr. 14)** und **Carroll & Carrithers 1984 (Nr. 15):** Seltenes nach hinten verlagern beschleunigt das Häufige. Weniger sichtbare zerstörerische Aktionen verringern Fehlgriffe. „Abmelden“ ist selten und folgenreich, das ist ein Fall für das Profilmenü.
**Gegenbefund:** **Nielsen 1994 (Nr. 6)** und **NN/g 2016 (Nr. 13).** Versteckte Funktionen werden seltener gefunden. Was im „…“ liegt, muss **überall dasselbe** „…“ an derselben Stelle sein, sonst wird aus Erkennen ein Erinnern.

## Ästhetik, Ersteindruck und visuelle Komplexität (betrifft alle Maßnahmen)

**16. Tuch, A. N., Presslaber, E. E., Stöcklin, M., Opwis, K., & Bargas-Avila, J. A. (2012).** The role of visual complexity and prototypicality regarding first impression of websites: Working towards understanding aesthetic judgments. *International Journal of Human-Computer Studies*, 70(11), 794–811. — **(a)**, Uni Basel und Google Research.
- **Kern:** Visuelle Komplexität und Prototypikalität wirken auf das Ästhetikurteil schon nach **50 ms**. Die Komplexität wirkt sogar nach **17 ms**. **Niedrige Komplexität plus hohe Prototypikalität** wurde am schönsten gefunden.
- **Bezug:** **Stützt Maßnahme 1–3** (weniger auf einem Bildschirm). „Prototypisch“ heisst: Muster bekannter Apps wie Tab-Leiste, ☰ und Chatliste nutzen, statt eigene zu erfinden.

**25. Lindgaard, G., Fernandes, G., Dudek, C., & Brown, J. (2006).** Attention web designers: You have 50 milliseconds to make a good first impression! *Behaviour & Information Technology*, 25, 115–126 (Heft 2 aus dem Gedächtnis). DOI 10.1080/01449290500330448. — **(a)**, bibliografisch; die 50-ms-Details nur **(b)** über Presse.
- **Kern:** Urteile über visuelle Anziehung entstehen sehr schnell. Sie stimmen nach 50 ms weitgehend mit späteren Urteilen überein.
- **Bezug:** Allgemein. Der Ersteindruck „zu viel“ entsteht vor jedem Lesen.

**26. Reinecke, K., Yeh, T., Miratrix, L., Mardiko, R., Zhao, Y., Liu, J., & Gajos, K. Z. (2013).** Predicting users' first impressions of website aesthetics with a quantification of perceived visual complexity and colorfulness. *Proc. CHI '13*, 2049–2058. — **(a)**
- **Kern:** 548 Freiwillige bewerteten 450 Websites. Modelle aus Komplexität und Farbigkeit plus Demografie erklärten **etwa die Hälfte der Varianz** im Ästhetikurteil nach 500 ms.
- Die Anschlussstudie **Reinecke & Gajos (2014)**, *Quantifying visual preferences around the world*, CHI '14, 11–20, sammelte **2,4 Mio. Bewertungen von fast 40.000 Personen**. Der Gipfel der Gefälligkeit hängt von der Gruppe ab: Höhere Bildung ging mit Ablehnung bunter und komplexer Seiten einher. — **(a)**
- **Bezug:** Die richtige Komplexität ist **nicht null**, sondern zielgruppenabhängig. Das passt zum Hauswunsch „ein wenig mehr Farbe und Leben“: Farbe darf bleiben, *Dichte* soll sinken.

**27. Kurosu, M., & Kashimura, K. (1995).** Apparent usability vs. inherent usability: Experimental analysis on the determinants of the apparent usability. *CHI '95 Conference Companion*, 292–293. — **(a)**
**Tractinsky, N., Katz, A. S., & Ikar, D. (2000).** What is beautiful is usable. *Interacting with Computers*, 13(2), 127–145. — **(a)**
- **Kern:** Bei 26 Geldautomaten-Layouts hing die *wahrgenommene* Bedienbarkeit stärker an der Ästhetik als an der tatsächlichen Bedienbarkeit (Kurosu & Kashimura). Bei Tractinsky prägte die Ästhetik das Urteil über die Bedienbarkeit **auch nach der Nutzung**, die echte Bedienbarkeit änderte es kaum.
- **Bezug:** **Allgemein und relativierend:** Ein aufgeräumter Eindruck senkt das Gefühl „zu viel“, auch wenn die Funktion gleich bleibt. Umgekehrt beweist eine gute Bewertung der Ästhetik nicht, dass man etwas *findet*. Deshalb nach der Umstellung **Findezeiten messen**, nicht nur Zufriedenheit abfragen.

## Gewohnheit und Motivation (Kennzeichnung)

**28. Fogg, B. J. (2009).** A behavior model for persuasive design. *Persuasive '09*. DOI 10.1145/1541948.1541999. — **(a)**, bibliografisch.
- **Kern:** Verhalten entsteht, wenn Motivation, Fähigkeit und Auslöser gleichzeitig zusammenkommen.
- **Hinweis:** Es ist ein **konzeptionelles Modell**, keine empirische Prüfung.
- **Bezug:** „Fähigkeit“ heisst hier: Wenn der nächste Schritt (Putzpunkt abhaken) einen Tipp entfernt liegt, braucht es weniger Motivation.

**Eyal, N. (2014).** *Hooked.* Ein Sachbuch, **nicht begutachtet** und kein Beleg. Hier nur der Vollständigkeit halber genannt. Für eine Arbeits-App ist ein „Hook“-Ziel (mehr Verweildauer) **ohnehin das falsche Ziel**.

**29. Hamari, J., Koivisto, J., & Sarsa, H. (2014).** Does gamification work? A literature review of empirical studies on gamification. *HICSS-47*, 3025–3034. DOI 10.1109/HICSS.2014.377. — **(a)**
- **Kern:** Die Effekte sind meist positiv, hängen aber **stark von Kontext und Nutzern** ab.
- **Bezug:** Gegenbefund-Charakter: Zähler, Abzeichen und Fortschrittsbalken *können* Engagement steigern. Ob sie das im Studio tun oder Druck erzeugen, ist nicht übertragbar und müsste gemessen werden.

---

## Was daraus für die App folgt

Jede Zeile nennt in Klammern die Quellennummern. „Ableitung“ heisst: Keine Studie hat genau das gemessen.

1. **5 Hauptbereiche sichtbar, Rest unter „Alles“, also Combo statt reinem ☰** (13, 8, 11). Die 5 Bereiche **nach gemessener Nutzungshäufigkeit wählen**, nicht nach Organigramm (14).
2. **„Alles“ flach und gruppiert, eine Ebene, keine Untermenüs darin** (10, 11, 12). Lieber 20 Einträge in 4 beschrifteten Gruppen als 4 Gruppen zum Aufklappen.
3. **Am PC nicht hinter ☰ verstecken:** eine Seitenleiste mit allen Bereichen. Versteckte Navigation kostete am Rechner am meisten, etwa +39 % Zeit laut Sekundärquelle (13).
4. **Zusammengelegte Bereiche tragen ihre alten Namen sichtbar mit**, etwa „Bestand · Material, Geräte, Archiv“. Die Suche findet weiter unter „Material“ (5, 11). Ableitung.
5. **Eine Nachrichtenliste:** Gruppen und Direkt gemischt, sortiert nach letzter Nachricht, Direktnachrichten erkennbar markiert. Das ist das prototypische Muster (16). Ableitung.
6. **„Erledigt“ einklappen, nur eine Ebene, mit Anzahl** („Erledigt (12) ›“). Offene Aufgaben mit **Zuständigem und Termin** zeigen: Ein konkreter Plan nimmt den Druck (15, Masicampo 2011, Ghibellini & Meier 2025, 12).
7. **Zahlen nur bei Dingen, die an mich gerichtet sind:** Direktnachricht, Erwähnung, mir zugewiesene Aufgabe. **Punkt** für „es gibt Neues“ in Gruppen und auf der Pinnwand. **Nichts** für allgemeine Aktivität (19, 22, 17). Ableitung; einen direkten Vergleich von Zahl und Punkt gibt es nicht.
8. **Abzeichen sparsam:** Sie lenken nachweislich den ersten Tipp (22). Ein Abzeichen an einem unwichtigen Bereich zieht vom wichtigen ab. Höchstens ein bis zwei Bereiche gleichzeitig markieren.
9. **Push-Benachrichtigungen nur für mich betreffende Dinge, mit Ruhezeiten ausserhalb der Schicht.** Schon das Eintreffen kostet Aufmerksamkeit (18). Die Menge geht mit negativen Gefühlen einher (19), Unterbrechungen kosten Stress (20, 21).
10. **„…“-Menü am Handy für Bearbeiten und Löschen, mit voller Zielgrösse ≥ 44 px (≈ 9,2 mm)** (23). Immer an derselben Stelle und mit demselben Symbol (6). **Am PC** Bearbeiten und Löschen beim Überfahren sichtbar machen statt verstecken (13, 3). Ableitung.
11. **Häufigste Aktion pro Bildschirm in die Daumenzone**, unten in der Mitte. Seltenes nach oben oder ins Menü (24, 14).
12. **Abmelden ins Profilmenü:** selten, folgenreich, nicht neben häufigen Zielen (15, 14).
13. **Weniger Dichte, nicht weniger Farbe** (16, 26, 27): Hauptlast der Entlastung ist die Zahl der Elemente pro Bildschirm.
14. **Wirkung messen statt fragen.** Vorher und nachher je 5 typische Aufgaben stoppen, etwa „Wo steht, wer heute putzt?“ und „Schick X eine Direktnachricht“. Ein schönerer Eindruck allein beweist keine bessere Findbarkeit (27).

### Offene Lücken (ehrlich)

- Keinen der Volltexte habe ich geöffnet: WebFetch war in dieser Umgebung gesperrt. Die Zahlen stammen aus Abstract-Auszügen und Sekundärquellen.
- Nicht gefunden:
  - eine begutachtete Studie zu Hamburger-Menüs;
  - einen Vergleich von **Zahlen-Abzeichen gegen Punkt**;
  - eine Studie zu gemischten gegen getrennte Chatlisten.
- Nicht bestätigt:
  - die genauen Ergebnisse von Kiger 1984 und Miller 1981 (nur Sekundärzitate, teilweise widersprüchlich);
  - die DOI von Reinecke 2013;
  - die Effektgrösse d ≈ 0,15 bei Ghibellini & Meier 2025.
- Nicht gesucht: Studien zu Fitts 1954 und Hoober (nur aus Sekundärwissen genannt).
