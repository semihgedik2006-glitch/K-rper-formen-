/* ══════════════════════════════════════════════════════════════════════
   EMS-WISSEN: 57 FRAGEN, IN EIGENEN WORTEN, MIT WEG ZUM ORIGINAL

   Aus dem Betrieb, 24.9.2026:
     „schau dir mal diesen link an und füge ALLES was du dort an
      informationen zu dir nehmen kannst zu dem Hilfe Knopf hinzu
      ebenso mit Schlagwörtern und Empfehlungen"
   und auf die Rückfrage: „Lass uns A machen" — eigene Kurzfassungen
   mit Quelle und Link, keine Kopie.

   ── WARUM KEINE KOPIE ──────────────────────────────────────────────
   Die Quelle ist die FAQ von www.ems-training.de (57 Artikel, vier
   Kategorien). Ihre Nutzungsbedingungen (www.ems-training.de/
   urheberrecht) erlauben die Weiterverwendung nur mit sichtbarer
   Quelle, direktem Link und Autorennennung — und NICHT als
   „systematische Übernahme … ersetzend … ohne eigenen redaktionellen
   Mehrwert". Dieses Repository ist öffentlich; eine Abschrift wäre
   eine Veröffentlichung. Deshalb steht hier je Frage:
     kurz     die Antwort in zwei, drei Sätzen, selbst formuliert
     sagen    wie man es einem Kunden am Empfang erklärt
     achtung  wann Leitung oder Arzt gefragt werden
     stich    Schlagwörter für die Suche
     url      der Originalartikel — „Ganzen Artikel lesen ›"
   Das ist der Mehrwert: aus einem Lesetext für Endkunden wird eine
   Arbeitshilfe für das Studio.

   ── GEPRÜFT ────────────────────────────────────────────────────────
   Die Sicherheitsangaben (Kontraindikationen, Häufigkeit, Pausen,
   Betreuung) sind nicht nur aus der FAQ übernommen, sondern an den
   beiden Arbeiten nachgelesen, auf die sie sich beruft:
     · von Stengel S et al. (2024), Revised contraindications for the
       use of non-medical WB-EMS. Front Sports Act Living 6:1371723
       — Tabelle 3, absolute und relative Kontraindikationen
     · Kemmler W et al. (2023), Position statement and updated
       international guideline for safe and effective WB-EMS.
       Front Physiol 14:1174103 — 20 min, in den ersten 8–10 Wochen
       höchstens 1× pro Woche, danach ≥ 4 Tage Pause zwischen
       intensiven Einheiten, Betreuung 1:1 (1:2 vertretbar)
   Zwei FAQ-Artikel nennen „mindestens 5 Tage" Pause, die Leitlinie 4.

   ── DIE PAUSE: HAUSREGEL (24.9.2026) ───────────────────────────────
   Aus dem Betrieb: „bei uns sind es MINDESTENS 2 Tage". Das ist die
   Regel, die im Studio gilt, und sie steht hier als Hausregel — nicht
   als Aussage der Leitlinie. Was die Leitlinie für die ersten Wochen
   empfiehlt (höchstens einmal pro Woche), bleibt als Information
   dabei und ist als ihre Empfehlung gekennzeichnet. Die Pause steht in
   `wie-oft` und `kombinieren` sowie in der Schulung „EMS verstehen und
   erklären".

   ── ÄNDERN ─────────────────────────────────────────────────────────
   Von Hand gepflegt. Wer etwas ändert, zählt in sw.js VERSION hoch.
   Die Formulierungen sind eigene — nicht aus dem Original
   hineinkopieren, sondern dort nachlesen und neu schreiben.
   ══════════════════════════════════════════════════════════════════ */
window.EMS_WISSEN = {
  stand: '2026-09-24',
  quelle: 'www.ems-training.de (FAQ)',
  quelleUrl: 'https://www.ems-training.de/faq',
  lizenz: 'Eigene Kurzfassungen. Quelle: www.ems-training.de — Artikel dort vollständig.',

  kategorien: [
    { id: 'grundlagen', name: 'EMS-Grundlagen',           ico: 'blitz' },
    { id: 'gesundheit', name: 'Gesundheit & Sicherheit',  ico: 'schild' },
    { id: 'praxis',     name: 'Training & Praxis',        ico: 'hantel' },
    { id: 'kosten',     name: 'Kosten & Anbieter',        ico: 'wagen' }
  ],

  /* Die Internetsuche (Weg W1). Gepflegt vom Betrieb, 24.9.2026. Wer
     hier eine Seite ergänzt, prüft vorher, dass sie werbefrei genug
     ist, um sie Kunden zu nennen. */
  seiten: [
    { domain: 'ems-training.de',            name: 'EMS-TRAINING.DE (Magazin)' },
    { domain: 'test.de',                    name: 'Stiftung Warentest' },
    { domain: 'quarks.de',                  name: 'Quarks (WDR)' },
    { domain: 'faz.net',                    name: 'F.A.Z. Kaufkompass' },
    { domain: 'zeitschrift-sportmedizin.de', name: 'Deutsche Zeitschrift für Sportmedizin' },
    { domain: 'dshs-koeln.de',              name: 'Deutsche Sporthochschule Köln' },
    { domain: 'dtgv.de',                    name: 'DTGV (Qualitätsrankings)' },
    { domain: 'ems-anbieter.info',          name: 'EMS-Anbieter.info' }
  ],

  eintraege: [

  /* ── GRUNDLAGEN ─────────────────────────────────────────────────── */
  { id: 'was-ist-ems', kat: 'grundlagen', lesezeit: 3,
    frage: 'Was ist EMS-Training?',
    kurz: 'Ganzkörper-EMS verstärkt die eigene, bewusste Muskelanspannung mit elektrischen Impulsen von außen. Weil die großen Muskelgruppen gleichzeitig arbeiten, genügen etwa 20 Minuten, meist einmal pro Woche. Es ist ein aktives, betreutes Training — kein „Strom machen lassen".',
    sagen: ['Du bewegst dich selbst und spannst an; die Impulse verstärken das, was deine Muskeln ohnehin tun.',
            'Eine Einheit dauert rund 20 Minuten, in der Regel einmal die Woche, immer mit Trainer.'],
    achtung: 'Vorerkrankungen oder Beschwerden: vor dem ersten Training im Anamnesebogen klären, im Zweifel ärztlich.',
    stich: 'ems elektromyostimulation elektro muskel stimulation ganzkoerper ganzkörper wirkprinzip definition erklaerung',
    url: 'https://www.ems-training.de/faq/grundlagen/was-ist-ems-training',
    verwandt: ['technik', 'warum-wirkt', 'zwanzig-minuten'] },

  { id: 'technik', kat: 'grundlagen', lesezeit: 4,
    frage: 'Wie funktioniert EMS-Training technisch?',
    kurz: 'Das Steuergerät erzeugt Impulse, die über Elektroden, Funktionskleidung und Haut die Nerven reizen und den Muskel anspannen lassen. Entscheidend ist guter, feuchter Hautkontakt — trockene Haut leitet schlechter, der Reiz wird ungleichmäßig und unangenehm. „Kabellos" heißt nur, dass das Steuerteil am Körper sitzt; der Impuls läuft trotzdem über Elektroden.',
    sagen: ['Die Kleidung wird angefeuchtet, damit der Impuls gleichmäßig und angenehm ankommt.',
            'Gängig sind kurze Intervalle, etwa 4 Sekunden Anspannung und 4 Sekunden Pause.'],
    achtung: 'Kribbelt es nur an einer Stelle oder brennt es: Kontakt und Feuchtigkeit prüfen, nicht einfach die Intensität hochdrehen.',
    stich: 'technik impuls frequenz hertz elektrode feucht nass kleidung kabellos trockenelektrode ema mittelfrequenz kontakt haut',
    url: 'https://www.ems-training.de/faq/grundlagen/wie-funktioniert-ems-training-technisch',
    verwandt: ['kleidung', 'was-ist-ems'] },

  { id: 'geschichte', kat: 'grundlagen', lesezeit: 3,
    frage: 'Wo kommt EMS her?',
    kurz: 'Elektrische Reize werden seit der Antike zur Behandlung genutzt; im 18. und 19. Jahrhundert verstand man, dass Muskeln über elektrische Signale arbeiten. Lange blieb EMS örtlich begrenzt — in Physiotherapie, Reha und Leistungssport. Ganzkörper-EMS mit Weste entstand Anfang der 2000er-Jahre, maßgeblich in Deutschland.',
    sagen: ['EMS kommt aus Medizin und Reha — das Ganzkörper-Training gibt es seit rund zwanzig Jahren.'],
    achtung: '',
    stich: 'geschichte herkunft ursprung entwicklung reha physiotherapie historie',
    url: 'https://www.ems-training.de/faq/grundlagen/wo-kommt-ems-her-medizinische-urspruenge-und-entwicklung',
    verwandt: ['was-ist-ems'] },

  { id: 'warum-wirkt', kat: 'grundlagen', lesezeit: 5,
    frage: 'Warum wirkt EMS — was passiert im Muskel?',
    kurz: 'Zur eigenen Anspannung kommt ein äußerer Reiz; dadurch arbeiten mehr Muskelfasern gleichzeitig, auch schnellkräftige und tiefliegende. So entsteht ohne schwere Gewichte ein hoher Reiz — gelenkschonend, aber nicht harmlos. Wirkung und Sicherheit hängen an Dosierung, Pausen und Betreuung.',
    sagen: ['Es arbeiten viele Muskeln auf einmal, auch die tiefe Rumpfmuskulatur — deshalb ist es so kurz und trotzdem anstrengend.'],
    achtung: '',
    stich: 'wirkung muskelfasern tiefenmuskulatur gelenkschonend kraft koerperzusammensetzung',
    url: 'https://www.ems-training.de/faq/grundlagen/warum-wirkt-ems-training-was-passiert-im-muskel',
    verwandt: ['muskelaufbau', 'haltung', 'regeneration'] },

  { id: 'ems-tens', kat: 'grundlagen', lesezeit: 5,
    frage: 'EMS oder TENS — wo ist der Unterschied?',
    kurz: 'Beide arbeiten mit Strom über die Haut, wollen aber Verschiedenes: EMS löst Muskelkontraktionen aus und ist Training, TENS wirkt örtlich auf Nerven und soll Schmerzen lindern. Die Frage ist also nicht „was ist besser", sondern „Training oder Schmerzbehandlung".',
    sagen: ['TENS ist ein kleines Schmerzgerät für eine Stelle; EMS ist Muskeltraining für den ganzen Körper.'],
    achtung: '',
    stich: 'tens schmerz schmerzgeraet nervenstimulation unterschied vergleich',
    url: 'https://www.ems-training.de/faq/grundlagen/ems-vs-tens-wo-liegen-die-unterschiede',
    verwandt: ['was-ist-ems', 'ruecken'] },

  { id: 'fuer-wen', kat: 'grundlagen', lesezeit: 4,
    frage: 'Für wen ist EMS geeignet — und für wen nicht?',
    kurz: 'Geeignet ist Ganzkörper-EMS vor allem für gesunde Erwachsene, Einsteiger, Menschen mit wenig Zeit und viele Ältere — betreut und individuell dosiert. Ausgeschlossen ist es bei absoluten Kontraindikationen (z. B. Schwangerschaft, Herzschrittmacher, akute Infekte). Bei relativen Kontraindikationen (z. B. Diabetes, Krebs, Implantate) nur mit ärztlicher Freigabe.',
    sagen: ['Ob es für dich passt, klären wir vorher im Gesundheitsfragebogen — bei manchen Punkten brauchen wir eine ärztliche Freigabe.'],
    achtung: 'Grundlage ist immer der Anamnesebogen. Nicht am Empfang „aus dem Bauch" entscheiden.',
    stich: 'geeignet zielgruppe wer darf einsteiger aeltere senioren berufstaetige anamnese',
    url: 'https://www.ems-training.de/faq/grundlagen/fuer-wen-ist-ems-training-geeignet-und-fuer-wen-nicht',
    verwandt: ['kontraindikationen', 'sicher', 'alter'] },

  { id: 'zuhause', kat: 'grundlagen', lesezeit: 3,
    frage: 'Geht EMS-Training zu Hause?',
    kurz: 'Nur, wenn ein ausgebildeter Trainer kommt, das Gerät mitbringt und die Einheit steuert — nicht als Heimgerät in Eigenregie. Überlastung zeigt sich bei EMS oft erst zwei bis drei Tage später; Laien können das nicht einschätzen. Die Strahlenschutzkommission empfiehlt, solche Anwendungen an Fachkunde zu binden.',
    sagen: ['Ein EMS-Anzug für zu Hause ersetzt keinen Trainer — die Belastung merkt man oft erst Tage später.'],
    achtung: 'Kunden, die ein Heimgerät nutzen wollen: freundlich abraten, auf die Risiken (Überlastung, CK-Wert) hinweisen.',
    stich: 'zuhause heimgeraet heimtraining anzug kaufen eigenregie personal trainer hausbesuch',
    url: 'https://www.ems-training.de/faq/grundlagen/ist-ems-training-zu-hause-moeglich',
    verwandt: ['ck-wert', 'qualifikation', 'sicher'] },

  { id: 'vs-krafttraining', kat: 'grundlagen', lesezeit: 5,
    frage: 'EMS oder klassisches Krafttraining — was ist effektiver?',
    kurz: 'Beide können Kraft und Körperzusammensetzung ähnlich verbessern; eine deutsche Studie fand bei EMS vergleichbare Ergebnisse wie bei sehr intensivem Krafttraining, mit deutlich weniger Zeitaufwand. EMS ist oft die effizientere Lösung, Gewichtstraining bietet mehr Möglichkeiten für gezielten, sportartspezifischen Aufbau.',
    sagen: ['Nicht besser, aber viel zeitsparender — für viele passt es einfach besser in den Alltag.'],
    achtung: '',
    stich: 'krafttraining fitnessstudio vergleich effektiver hantel gewichte studie zeitaufwand',
    url: 'https://www.ems-training.de/faq/grundlagen/ems-vs-klassisches-krafttraining-was-ist-effektiver',
    verwandt: ['muskelaufbau', 'kombinieren', 'zwanzig-minuten'] },

  { id: 'wie-oft', kat: 'grundlagen', lesezeit: 3,
    frage: 'Wie oft sollte man EMS-Training machen?',
    kurz: 'Bei uns gilt: Zwischen zwei EMS-Einheiten liegen mindestens 2 Tage Pause. Einmal pro Woche bringt schon gute Ergebnisse; wer öfter kommt, braucht die Pause dazwischen, denn der Muskel wächst in der Erholung. Für den Einstieg empfiehlt die Leitlinie (Kemmler 2023) in den ersten 8 bis 10 Wochen höchstens eine Einheit pro Woche. Regelmäßig schlägt häufig.',
    sagen: ['Zwischen zwei Trainings liegen bei uns mindestens zwei Tage — die Muskeln wachsen in der Pause.'],
    achtung: 'Weniger als 2 Tage zwischen zwei Terminen: nicht buchen. Will jemand gleich zu Beginn öfter als einmal pro Woche kommen: Leitung fragen.',
    stich: 'haeufigkeit wie oft pro woche zweimal frequenz termine abstand pause',
    url: 'https://www.ems-training.de/faq/grundlagen/wie-oft-darf-und-sollte-ich-ems-training-machen',
    verwandt: ['regeneration', 'zwanzig-minuten', 'ck-wert'] },

  { id: 'erfolge', kat: 'grundlagen', lesezeit: 4,
    frage: 'Wie schnell sieht man Ergebnisse?',
    kurz: 'Die Wirkung spüren die meisten schon beim ersten Training. Mehr Körperspannung und Kraft im Alltag zeigen sich oft nach wenigen Einheiten, sichtbare Veränderungen meist nach einigen Wochen. Ausgangslage, Regelmäßigkeit, Ernährung und Schlaf entscheiden mit.',
    sagen: ['Spürbar oft schnell, sichtbar nach einigen Wochen — es ist Training, kein Zaubertrick.'],
    achtung: 'Keine Versprechen zu Kilo oder Zentimetern in bestimmter Zeit machen.',
    stich: 'erfolg ergebnisse wie schnell wochen sichtbar spuerbar vorher nachher',
    url: 'https://www.ems-training.de/faq/grundlagen/erste-erfolge-mit-ems-wie-schnell-sieht-man-ergebnisse',
    verwandt: ['wie-oft', 'bauchfett', 'muskelaufbau'] },

  { id: 'zwanzig-minuten', kat: 'grundlagen', lesezeit: 4,
    frage: 'Reichen wirklich 20 Minuten?',
    kurz: 'Ja. 20 Minuten sind beim Ganzkörper-EMS der Standard und zugleich die empfohlene Obergrenze für eine intensive Einheit. Bei 4 Sekunden Anspannung und 4 Sekunden Pause ist jede Muskelgruppe rund 10 Minuten aktiv — alle gleichzeitig.',
    sagen: ['20 Minuten sind nicht zu wenig, sondern das Maximum — mehr wäre zu viel.'],
    achtung: '',
    stich: '20 zwanzig minuten dauer lang genug kurz einheit',
    url: 'https://www.ems-training.de/faq/grundlagen/reichen-wirklich-20-minuten-ems-training-aus',
    verwandt: ['wie-oft', 'vs-krafttraining'] },

  /* ── GESUNDHEIT & SICHERHEIT ───────────────────────────────────── */
  { id: 'sicher', kat: 'gesundheit', lesezeit: 3,
    frage: 'Ist EMS-Training sicher?',
    kurz: 'Bei fachgerechter Anwendung ja. Sicher wird es durch geschulte Trainer, dokumentierte Anamnese, geprüfte Kontraindikationen, vorsichtigen Einstieg, genug Pause und ein Medizinprodukt als Gerät. Betreuung höchstens zu zweit pro Trainer; in den ersten 8–10 Wochen einmal pro Woche 20 Minuten.',
    sagen: ['Sicher ist es, weil wir vorher Gesundheitsfragen stellen, langsam einsteigen und du nie allein trainierst.'],
    achtung: 'Anamnese fehlt oder ist veraltet: vor dem Training nachholen.',
    stich: 'sicher sicherheit gefaehrlich risiko gefahr strom anamnese betreuung',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ist-ems-training-sicher',
    verwandt: ['kontraindikationen', 'ck-wert', 'qualifikation'] },

  { id: 'ck-wert', kat: 'gesundheit', lesezeit: 5,
    frage: 'Was bedeutet ein erhöhter Muskelwert (CK) im Blut nach EMS?',
    kurz: 'Die Kreatinkinase (CK) steigt nach starker Muskelbelastung; nach einer zu harten ersten EMS-Einheit kann sie sehr hoch ausfallen, der Gipfel liegt oft erst nach 72 bis 96 Stunden. Mit vorsichtiger Eingewöhnung fällt der Anstieg deutlich kleiner aus. Warnzeichen für eine Rhabdomyolyse: sehr starke Muskelschmerzen, ausgeprägte Schwäche, dunkler Urin.',
    sagen: ['Deshalb fangen wir sanft an — die erste Einheit ist bewusst leicht.'],
    achtung: 'Meldet ein Kunde dunklen Urin, starke Schwäche oder heftige Schmerzen nach dem Training: kein Training, sofort ärztlich abklären lassen und Leitung informieren.',
    stich: 'ck kreatinkinase muskelwert blutwert rhabdomyolyse urin dunkel niere blut labor',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/was-bedeutet-ein-erhoehter-muskelwert-im-blut-nach-ems',
    verwandt: ['muskelkater', 'probetraining', 'regeneration'] },

  { id: 'muskelkater', kat: 'gesundheit', lesezeit: 4,
    frage: 'Muskelkater nach EMS — normal oder Warnsignal?',
    kurz: 'Leichter bis mäßiger Muskelkater, der nach wenigen Tagen abklingt, ist eine normale Reaktion — besonders am Anfang. Ungewöhnlich stark, lange anhaltend oder mit Schwellung, Schwäche oder dunklem Urin ist er ein Warnsignal. Dann Training pausieren und ärztlich abklären.',
    sagen: ['Ein bisschen Muskelkater ist normal; wenn es richtig weh tut oder nicht weggeht, sag uns bitte Bescheid.'],
    achtung: 'Starke Beschwerden nach dem Training immer ernst nehmen, notieren und die Leitung informieren.',
    stich: 'muskelkater schmerzen muskelschmerz weh tut nachher tage steif',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/muskelkater-nach-ems-normal-oder-warnsignal',
    verwandt: ['ck-wert', 'regeneration'] },

  { id: 'bluthochdruck', kat: 'gesundheit', lesezeit: 4,
    frage: 'EMS bei Bluthochdruck — geht das?',
    kurz: 'Unbehandelter Bluthochdruck ist eine absolute Kontraindikation. Gut eingestellter Bluthochdruck zählt zu den Herz-Kreislauf-Erkrankungen und damit zu den relativen: möglich nach ärztlicher Freigabe, mit vorsichtigem Einstieg. Eine Pilotstudie fand während der Einheit keinen weiteren deutlichen Blutdruckanstieg — das ist keine pauschale Freigabe.',
    sagen: ['Bei Bluthochdruck brauchen wir vorher eine ärztliche Freigabe; ist er nicht behandelt, geht es leider nicht.'],
    achtung: 'Ohne Freigabe kein Training. Freigabe im Kundenprofil vermerken.',
    stich: 'bluthochdruck blutdruck hypertonie herz kreislauf tabletten',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ems-training-bei-bluthochdruck-ist-das-moeglich',
    verwandt: ['herz-kreislauf', 'kontraindikationen', 'medikamente'] },

  { id: 'arthrose', kat: 'gesundheit', lesezeit: 4,
    frage: 'Kann EMS bei Arthrose helfen?',
    kurz: 'Arthrose ist kein Ausschlussgrund. Besonders bei Kniearthrose zeigen Studien weniger Schmerzen, bessere Funktion und mehr Beinkraft (Evidenz: moderat). Der Vorteil: viel Muskelreiz ohne schwere Gewichte. Bei akuter Entzündung oder frischer Operation erst ärztlich klären.',
    sagen: ['Gerade bei Knieproblemen kann EMS gut passen, weil wir die Muskeln stärken, ohne das Gelenk mit Gewichten zu belasten.'],
    achtung: 'Akut geschwollenes, heißes Gelenk: kein Training, ärztlich abklären.',
    stich: 'arthrose gelenk knie huefte gelenkschmerzen verschleiss knorpel',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ems-training-bei-arthrose-kann-es-helfen',
    verwandt: ['prothese', 'rheuma', 'alter'] },

  { id: 'ruecken', kat: 'gesundheit', lesezeit: 6,
    frage: 'EMS bei Rückenproblemen oder Bandscheibenvorfall?',
    kurz: 'Am besten belegt ist der Nutzen bei chronischen, unspezifischen Rückenschmerzen: weniger Schmerz, mehr Rumpfkraft, vergleichbar mit klassischem Rückentraining. Akute Rückenschmerzen ohne Diagnose und akute Bandscheibenvorfälle sind relative Kontraindikationen — nur nach ärztlicher Abklärung. Nach der akuten Phase kann EMS mit Freigabe als Aufbautraining dienen.',
    sagen: ['Bei chronischen Rückenschmerzen ist EMS gut untersucht; bei einem frischen Bandscheibenvorfall brauchen wir erst eine ärztliche Freigabe.'],
    achtung: 'Taubheit, Ausstrahlung ins Bein oder Kraftverlust: kein Training, ärztlich abklären.',
    stich: 'ruecken rueckenschmerzen bandscheibe bandscheibenvorfall wirbelsaeule ischias lws hws hexenschuss',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ems-training-bei-rueckenproblemen-oder-bandscheibenvorfall-ist-das-sinnvoll',
    verwandt: ['haltung', 'nacken', 'kontraindikationen'] },

  { id: 'spirale', kat: 'gesundheit', lesezeit: 3,
    frage: 'EMS-Training mit Spirale — unbedenklich?',
    kurz: 'Eine Spirale steht nicht auf der Liste der Kontraindikationen. Nicht direkt nach dem Einsetzen trainieren, solange Schmerzen, Blutungen oder Druckgefühl bestehen. Bei Beschwerden, Fieber oder Unsicherheit vorher gynäkologisch abklären.',
    sagen: ['Mit Spirale geht es in der Regel — nur nicht direkt nach dem Einsetzen und nicht, wenn du Beschwerden hast.'],
    achtung: '',
    stich: 'spirale iud verhuetung kupferspirale hormonspirale frauenarzt gynaekologe',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ems-training-mit-spirale-ist-das-unbedenklich',
    verwandt: ['periode', 'kontraindikationen'] },

  { id: 'nach-geburt', kat: 'gesundheit', lesezeit: 6,
    frage: 'EMS nach der Geburt — was beachten?',
    kurz: 'Nicht im frühen Wochenbett. Der Einstieg richtet sich nach Heilung, Rückbildung und Beckenboden, nicht nach einem festen Datum. Voraussetzungen: keine Schmerzen, Blutungen oder Entzündung, verheilte Narben und ärztliche Freigabe — nach Kaiserschnitt oder Komplikationen meist später.',
    sagen: ['Nach der Geburt starten wir erst mit ärztlicher Freigabe — wann, hängt ganz von der Rückbildung ab.'],
    achtung: 'Ohne ärztliche Freigabe kein Start. Kaiserschnitt ist eine Operation im Stimulationsbereich.',
    stich: 'geburt nach der geburt wochenbett rueckbildung kaiserschnitt stillen mama baby beckenboden rektusdiastase',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ems-training-nach-der-geburt-was-sollte-man-beachten',
    verwandt: ['schwangerschaft', 'beckenboden', 'operation'] },

  { id: 'schwangerschaft', kat: 'gesundheit', lesezeit: 2,
    frage: 'Warum kein EMS in der Schwangerschaft?',
    kurz: 'Schwangerschaft ist eine absolute Kontraindikation — unabhängig von der Intensität. Für Ganzkörper-EMS in der Schwangerschaft gibt es keine belastbare Sicherheitsgrundlage. Stattdessen ärztlich oder physiotherapeutisch empfohlene Bewegung.',
    sagen: ['In der Schwangerschaft machen wir kein EMS — das gilt für jede Intensität. Nach der Geburt gerne wieder, mit ärztlicher Freigabe.'],
    achtung: 'Vertrag ruhen lassen statt kündigen — Leitung fragen, wie das Studio das regelt.',
    stich: 'schwanger schwangerschaft baby erwarten ss verboten',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ems-training-in-der-schwangerschaft-warum-nicht-erlaubt',
    verwandt: ['nach-geburt', 'kontraindikationen'] },

  { id: 'periode', kat: 'gesundheit', lesezeit: 2,
    frage: 'EMS während der Periode?',
    kurz: 'Grundsätzlich möglich; die Menstruation ist keine Kontraindikation. Maßgeblich ist das Befinden am Tag: bei starken Krämpfen, Kreislaufproblemen oder starker Blutung lieber pausieren oder deutlich leichter trainieren.',
    sagen: ['Wenn du dich gut fühlst, spricht nichts dagegen; wenn nicht, verschieben wir einfach.'],
    achtung: '',
    stich: 'periode menstruation tage krampf regelschmerzen blutung frau',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ems-waehrend-der-periode-ist-training-moeglich',
    verwandt: ['spirale'] },

  { id: 'operation', kat: 'gesundheit', lesezeit: 5,
    frage: 'EMS nach einer Operation — wann wieder?',
    kurz: 'Frische Operationen im Stimulationsbereich sind eine absolute Kontraindikation; offene oder genähte Wunden unter den Elektroden erst recht. Wieder einsteigen erst nach abgeschlossener Wundheilung, ausreichender Genesung und ärztlicher Freigabe — nach großen oder herznahen Eingriffen besonders zurückhaltend.',
    sagen: ['Nach einer OP starten wir wieder, wenn alles verheilt ist und die Ärztin oder der Arzt zugestimmt hat.'],
    achtung: 'Stents oder Bypass jünger als 6 Monate: absolute Kontraindikation.',
    stich: 'operation op eingriff narbe wunde naht nach der op reha wiedereinstieg',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ems-training-nach-operationen-ab-wann-wieder-moeglich',
    verwandt: ['prothese', 'kontraindikationen', 'herz-kreislauf'] },

  { id: 'herz-kreislauf', kat: 'gesundheit', lesezeit: 6,
    frage: 'EMS bei Herz-Kreislauf-Erkrankungen?',
    kurz: 'Herz-Kreislauf-Erkrankungen sind relative Kontraindikationen: nur mit schriftlicher ärztlicher Freigabe. Ausgeschlossen sind Herzschrittmacher und andere elektrische Implantate, Herzrhythmusstörungen, unbehandelter Bluthochdruck, arterielle Durchblutungsstörungen sowie Stents oder Bypässe unter 6 Monaten. Positive Daten aus der Kardiologie gelten für medizinische Settings, nicht als Freigabe fürs Studio.',
    sagen: ['Bei Herzthemen brauchen wir immer eine schriftliche ärztliche Freigabe — bei Schrittmacher oder Rhythmusstörungen geht es leider gar nicht.'],
    achtung: 'Herzschrittmacher, Defibrillator (ICD), Rhythmusstörungen: niemals trainieren lassen.',
    stich: 'herz herzschrittmacher schrittmacher icd defibrillator rhythmusstoerung vorhofflimmern stent bypass herzinfarkt kreislauf',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ems-training-bei-herz-kreislauf-erkrankungen-was-ist-zu-beachten',
    verwandt: ['bluthochdruck', 'kontraindikationen', 'medikamente'] },

  { id: 'uebergewicht', kat: 'gesundheit', lesezeit: 5,
    frage: 'Welche Vorteile hat EMS bei Übergewicht?',
    kurz: 'Kurz, eng betreut und vergleichsweise gelenkschonend — das macht den Einstieg für viele erst machbar. EMS kann Muskelkraft und Körperzusammensetzung verbessern. Es ersetzt aber weder Ernährung noch Alltagsbewegung.',
    sagen: ['Einmal die Woche 20 Minuten mit Trainer ist für viele der Anfang, der sich durchhalten lässt.'],
    achtung: '',
    stich: 'uebergewicht adipositas abnehmen gewicht dick bmi',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ems-training-bei-uebergewicht-welche-vorteile-gibt-es',
    verwandt: ['bauchfett', 'kalorien', 'abnehmspritze'] },

  { id: 'prothese', kat: 'gesundheit', lesezeit: 5,
    frage: 'EMS mit künstlichem Gelenk oder Prothese?',
    kurz: 'Implantate, die älter als 6 Monate sind, sind eine relative Kontraindikation: möglich nach ärztlicher Freigabe. Der Vorteil ist Muskelaufbau rund ums Gelenk ohne schwere Zusatzlast. In der frühen Phase nach der Operation ist EMS ausgeschlossen.',
    sagen: ['Mit einem künstlichen Gelenk geht EMS oft gut — frühestens nach Heilung und mit ärztlicher Freigabe.'],
    achtung: 'Elektrische Implantate (Schrittmacher, Neurostimulator, Insulinpumpe mit Elektronik) sind etwas anderes: absolute Kontraindikation.',
    stich: 'prothese kuenstliches gelenk implantat hueftprothese knieprothese tep endoprothese metall schraube platte',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ems-training-mit-kuenstlichen-gelenken-oder-prothesen-was-ist-moeglich',
    verwandt: ['operation', 'arthrose'] },

  { id: 'alter', kat: 'gesundheit', lesezeit: 4,
    frage: 'EMS im Alter — worauf achten?',
    kurz: 'Beim altersbedingten Muskelabbau ist Ganzkörper-EMS besonders gut untersucht: mehr Kraft, Muskelmasse und Alltagsfunktion. Alter allein schließt nichts aus, aber Vorerkrankungen, Implantate und Medikamente sind häufiger — deshalb sorgfältige Anamnese und langsames Steigern.',
    sagen: ['Gerade im Alter lohnt sich Muskeltraining; wir fragen nur genauer nach, was an Erkrankungen oder Medikamenten da ist.'],
    achtung: '',
    stich: 'alter aelter senioren rentner muskelabbau sarkopenie sturz 60 70 80',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ems-training-im-alter-gibt-es-besondere-vorsichtsmassnahmen',
    verwandt: ['lebensqualitaet', 'mobilitaet', 'medikamente'] },

  { id: 'lebensqualitaet', kat: 'gesundheit', lesezeit: 5,
    frage: 'Kann EMS die Lebensqualität im Alter verbessern?',
    kurz: 'Ja — der Nutzen zeigt sich vor allem im Alltag: leichter aufstehen, sicherer gehen, Treppen steigen, mehr zutrauen. Kurz, betreut und gelenkschonend ist das Format für viele Ältere realistischer als langes Gerätetraining.',
    sagen: ['Es geht nicht um Fitness, sondern darum, im Alltag sicher und selbstständig zu bleiben.'],
    achtung: '',
    stich: 'lebensqualitaet selbststaendig alltag aufstehen treppe gehen sicherheit',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/kann-ems-training-die-lebensqualitaet-im-alter-verbessern',
    verwandt: ['alter', 'mobilitaet'] },

  { id: 'abnehmspritze', kat: 'gesundheit', lesezeit: 5,
    frage: 'EMS und Abnehmspritze (GLP-1)?',
    kurz: 'Unter GLP-1-Medikamenten geht beim Abnehmen auch fettfreie Masse verloren — Muskeltraining ist deshalb besonders wichtig, und EMS ist ein kurzes, machbares Format dafür. Die Kombination ist plausibel, aber noch kaum direkt untersucht. Bei Übelkeit, Schwäche oder Kreislaufproblemen Belastung anpassen oder verschieben.',
    sagen: ['Mit der Spritze nimmst du ab — mit dem Training sorgst du dafür, dass es möglichst nicht die Muskeln sind.'],
    achtung: 'Wer kaum isst: nicht nüchtern trainieren lassen, vorher nach Essen und Befinden fragen.',
    stich: 'abnehmspritze glp ozempic wegovy semaglutid mounjaro tirzepatid spritze',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ems-training-und-abnehmspritze-glp-1-ist-das-sicher-und-sinnvoll',
    verwandt: ['uebergewicht', 'medikamente', 'ernaehrung'] },

  { id: 'beckenboden', kat: 'gesundheit', lesezeit: 6,
    frage: 'Hilft Ganzkörper-EMS dem Beckenboden?',
    kurz: 'Den Beckenboden trainiert Ganzkörper-EMS nicht gezielt, aber die Körpermitte drumherum — Bauch, Rücken, Gesäß —, mit der er zusammenarbeitet. Das kann Stabilität und Körperspannung verbessern. Bei deutlicher Inkontinenz, Senkung oder Schmerzen zuerst ärztlich oder physiotherapeutisch abklären.',
    sagen: ['EMS stärkt die ganze Körpermitte; ein spezielles Beckenbodentraining ersetzt es nicht.'],
    achtung: '',
    stich: 'beckenboden inkontinenz blase senkung harndrang nach schwangerschaft',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ganzkoerper-ems-training-fuer-den-beckenboden-hilft-es-bei-inkontinenz',
    verwandt: ['nach-geburt', 'haltung'] },

  { id: 'medikamente', kat: 'gesundheit', lesezeit: 5,
    frage: 'EMS und Medikamente — was beachten?',
    kurz: 'Medikamente sind kein pauschaler Ausschluss, gehören aber vollständig in die Anamnese — samt Grunderkrankung. Besonders nachfragen bei Insulin und anderen Blutzuckersenkern, Herz- und Blutdruckmitteln (z. B. Betablocker), Muskelrelaxanzien, Mitteln mit Müdigkeit oder Schwindel, Kortison und neuen Medikamenten. Die Leitlinie rät, 24–48 Stunden vorher auf Muskelrelaxanzien zu verzichten.',
    sagen: ['Sag uns bitte jedes neue Medikament — manche verändern, wie dein Körper auf das Training reagiert.'],
    achtung: 'Schwindel, Übelkeit, Schwäche am Trainingstag: nicht trainieren lassen.',
    stich: 'medikamente tabletten betablocker insulin blutverduenner kortison cortison muskelrelaxans schmerzmittel',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ems-training-und-medikamenteneinnahme-was-ist-zu-beachten',
    verwandt: ['diabetes', 'herz-kreislauf', 'kontraindikationen'] },

  { id: 'kontraindikationen', kat: 'gesundheit', lesezeit: 3,
    frage: 'Wer darf kein EMS-Training machen? (Kontraindikationen)',
    kurz: 'Absolut ausgeschlossen: akute Erkrankungen, Infekte und Entzündungen · frische Operationen im Stimulationsbereich · Arteriosklerose und arterielle Durchblutungsstörungen · Stents oder Bypässe unter 6 Monaten · unbehandelter Bluthochdruck · Schwangerschaft · elektrische Implantate, Herzschrittmacher · Herzrhythmusstörungen · schwere Blutungsneigung · neurologische Erkrankungen, Epilepsie · Bauchwand- und Leistenbrüche · akuter Einfluss von Alkohol oder Drogen. Nur mit ärztlicher Freigabe (relativ): Diabetes · Krebs · akute Rückenschmerzen ohne Diagnose · akute Neuralgie, Bandscheibenvorfall · Implantate älter als 6 Monate · Erkrankungen innerer Organe, v. a. Niere · Herz-Kreislauf-Erkrankungen · Schwindel bei Bewegung · stärkere Wassereinlagerungen · offene Haut, Wunden, Ekzeme, Verbrennungen im Elektrodenbereich · Medikamente zu diesen Erkrankungen.',
    sagen: ['Bei manchen Erkrankungen geht es gar nicht, bei anderen brauchen wir eine ärztliche Freigabe — das klären wir im Gesundheitsfragebogen.'],
    achtung: 'Stand: deutsche Konsensempfehlung 2024 (von Stengel et al.). Diabetes und Krebs sind seitdem relativ, nicht mehr absolut.',
    stich: 'kontraindikation kontraindikationen ausschluss ausschlusskriterien verboten nicht erlaubt wer darf nicht schwangerschaft herzschrittmacher implantat rhythmusstoerung bluthochdruck infekt fieber operation stent bypass epilepsie hernie leistenbruch blutung haemophilie alkohol diabetes krebs niere oedem',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/wer-darf-kein-ems-training-machen-kontraindikationen',
    verwandt: ['fuer-wen', 'sicher', 'herz-kreislauf'] },

  { id: 'diabetes', kat: 'gesundheit', lesezeit: 5,
    frage: 'EMS bei Diabetes?',
    kurz: 'Diabetes ist eine relative Kontraindikation: sinnvoll möglich, aber nur mit ärztlicher Freigabe. Muskeln nehmen viel Zucker auf, Krafttraining verbessert die Insulinempfindlichkeit. Unter Insulin kann der Blutzucker während und Stunden nach dem Training fallen.',
    sagen: ['Mit Diabetes geht es, wenn die Ärztin oder der Arzt zustimmt — bring bitte immer etwas Traubenzucker mit.'],
    achtung: 'Zittern, Schwitzen, Verwirrtheit während des Trainings: sofort stoppen, Zucker geben (Unterzuckerung), Leitung rufen.',
    stich: 'diabetes zucker insulin blutzucker unterzucker diabetiker typ 1 typ 2 metformin',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ist-ems-training-bei-diabetes-geeignet',
    verwandt: ['medikamente', 'kontraindikationen'] },

  { id: 'krebs', kat: 'gesundheit', lesezeit: 6,
    frage: 'EMS bei Krebs oder nach einer Tumorerkrankung?',
    kurz: 'Krebs ist seit 2024 eine relative, keine absolute Kontraindikation: nur nach ärztlicher Freigabe und mit enger Betreuung. Die Studienlage ist noch klein. Bei laufender Therapie, starker Schwäche oder Komplikationen gehört EMS eher in ein medizinisches Setting als in den normalen Studiobetrieb.',
    sagen: ['Das entscheiden wir nicht allein — bitte zuerst mit dem behandelnden Arzt sprechen.'],
    achtung: 'Immer die Leitung einbeziehen. Keine Heilversprechen.',
    stich: 'krebs tumor chemo chemotherapie onkologie bestrahlung fatigue erschoepfung',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ems-training-bei-krebs-oder-nach-tumorerkrankungen-was-ist-zu-beachten',
    verwandt: ['kontraindikationen', 'medikamente'] },

  { id: 'krampfadern', kat: 'gesundheit', lesezeit: 6,
    frage: 'EMS mit Krampfadern?',
    kurz: 'Ruhige, chronische Krampfadern sind kein Ausschluss — sie sind venös, nicht arteriell. Plötzliche einseitige Schwellung, Schmerz, Rötung oder Überwärmung können auf eine Thrombose oder Venenentzündung hindeuten: dann kein Training, sondern rasch ärztlich abklären. Ödeme sind eine relative Kontraindikation.',
    sagen: ['Mit Krampfadern geht es meistens — außer das Bein ist plötzlich dick, rot oder warm.'],
    achtung: 'Verdacht auf Thrombose: nicht trainieren, Kunde zum Arzt.',
    stich: 'krampfadern venen varizen thrombose schwellung bein oedem wasser',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/ems-training-mit-krampfadern-geht-das',
    verwandt: ['kontraindikationen', 'herz-kreislauf'] },

  { id: 'rheuma', kat: 'gesundheit', lesezeit: 5,
    frage: 'Kann EMS bei Rheuma helfen?',
    kurz: 'In stabilen Phasen und mit ärztlicher Freigabe kann EMS ein gelenkschonender Baustein für Kraft und Funktion sein. Im akuten Schub nicht — akute Entzündungen sind eine absolute Kontraindikation. Direkte Studien zu EMS bei Rheuma gibt es noch wenige.',
    sagen: ['In ruhigen Phasen kann es helfen, im Schub pausieren wir.'],
    achtung: '',
    stich: 'rheuma rheumatoide arthritis schub entzuendung gelenkentzuendung',
    url: 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/kann-ems-training-bei-rheuma-helfen',
    verwandt: ['arthrose', 'kontraindikationen'] },

  /* ── TRAINING & PRAXIS ─────────────────────────────────────────── */
  { id: 'kleidung', kat: 'praxis', lesezeit: 3,
    frage: 'Was zieht man beim EMS-Training an?',
    kurz: 'Spezielle EMS-Funktionskleidung direkt auf der Haut, ohne Unterwäsche darunter. Sie muss zum Gerät passen (vom Hersteller freigegeben, meist am Markenzeichen erkennbar), sonst leidet die Impulsübertragung. Jedes Mal frisch tragen; die Elektroden reinigt und desinfiziert das Studio.',
    sagen: ['Du bekommst von uns die passende Kleidung; drunter trägst du nichts. Bring nur Wechselsachen und ein Handtuch mit.'],
    achtung: '',
    stich: 'kleidung anziehen unterwaesche funktionswaesche anzug weste handtuch mitbringen was mitbringen',
    url: 'https://www.ems-training.de/faq/faq-praxis/ems-kleidung-was-ziehe-ich-beim-training-an',
    verwandt: ['technik', 'vorbereitung'] },

  { id: 'uebungen', kat: 'praxis', lesezeit: 3,
    frage: 'Welche Übungen gehören zu einem guten EMS-Training?',
    kurz: 'Einfache, kontrollierte Übungen: Haltepositionen, langsame Ausfallschritte, geführte Zug- und Rumpfbewegungen. Keine Sprünge oder komplizierten Abfolgen — sie lenken von der bewussten Anspannung ab. Den größten Unterschied macht die richtig eingestellte Impulsintensität.',
    sagen: ['Die Übungen sind bewusst einfach — die Arbeit macht die Kombination aus Anspannung und Impuls.'],
    achtung: '',
    stich: 'uebungen uebung kniebeuge ausfallschritt ablauf programm bewegung',
    url: 'https://www.ems-training.de/faq/faq-praxis/welche-ems-uebungen-gehoeren-zu-einem-effektiven-training',
    verwandt: ['technik', 'warum-wirkt'] },

  { id: 'bauchfett', kat: 'praxis', lesezeit: 3,
    frage: 'Hilft EMS gegen Bauchfett?',
    kurz: 'Gezielt nur am Bauch Fett abbauen geht nicht — mit keiner Methode. EMS stärkt aber Bauch- und Rumpfmuskulatur, verbessert Haltung und unterstützt den allgemeinen Fettabbau; dadurch kann der Bauch flacher wirken. Ernährung bleibt entscheidend.',
    sagen: ['Punktuell abnehmen geht leider nicht — aber eine starke Körpermitte und gute Haltung sieht man.'],
    achtung: 'Keine Zentimeter-Versprechen.',
    stich: 'bauch bauchfett flacher bauch taille fett abnehmen sixpack',
    url: 'https://www.ems-training.de/faq/faq-praxis/hilft-ems-training-dabei-bauchfett-zu-reduzieren-und-einen-flachen-bauch-zu-bekommen',
    verwandt: ['kalorien', 'uebergewicht', 'ernaehrung'] },

  { id: 'kalorien', kat: 'praxis', lesezeit: 4,
    frage: 'Wie viele Kalorien verbraucht EMS?',
    kurz: 'Eine feste Zahl gibt es nicht — sie hängt von Intensität, Muskelmasse und Anspannung ab. In einer Studie lag der Verbrauch mit EMS rund 17 % über denselben Übungen ohne; nach einer intensiven Einheit wurden bis zu 72 Stunden lang zusammen etwa 460 kcal zusätzlich gemessen. Der eigentliche Nutzen ist der Muskelreiz, nicht die Kalorienzahl.',
    sagen: ['EMS ist kein Kalorien-Workout — es wirkt über die Muskeln, auch in den Tagen danach.'],
    achtung: 'Die Studienwerte sind keine Garantie für jeden Kunden.',
    stich: 'kalorien kcal verbrauch verbrennen nachbrenneffekt energie',
    url: 'https://www.ems-training.de/faq/faq-praxis/wie-hoch-ist-der-kalorienverbrauch-beim-ems-training-und-wie-effektiv-ist-es',
    verwandt: ['bauchfett', 'uebergewicht'] },

  { id: 'cellulite', kat: 'praxis', lesezeit: 3,
    frage: 'Hilft EMS gegen Cellulite?',
    kurz: 'Entfernen kann EMS Cellulite nicht. Es kräftigt aber die Muskulatur unter Po, Oberschenkeln und Hüfte; die Kontur kann dadurch straffer wirken. Direkte Studien zu EMS und Cellulite gibt es kaum.',
    sagen: ['Weg ist sie danach nicht — aber straffere Muskeln darunter sieht man.'],
    achtung: 'Keine Heilversprechen.',
    stich: 'cellulite orangenhaut dellen po oberschenkel straff haut',
    url: 'https://www.ems-training.de/faq/faq-praxis/hilft-ems-training-wirklich-gegen-cellulite',
    verwandt: ['bauchfett', 'muskelaufbau'] },

  { id: 'vorbereitung', kat: 'praxis', lesezeit: 3,
    frage: 'Wie bereitet man sich auf EMS-Training vor?',
    kurz: 'Über den Tag ausreichend trinken; die Leitlinie nennt je 250–500 ml etwa 30 Minuten vorher und direkt danach. Rund 2 Stunden vorher eine leichte, kohlenhydratreiche Kleinigkeit essen, nicht nüchtern trainieren. Ausgeruht und gesund kommen, keinen Alkohol, und neue Medikamente oder Beschwerden melden.',
    sagen: ['Gut trinken, zwei Stunden vorher eine Kleinigkeit essen — und wenn du dich krank fühlst, lieber verschieben.'],
    achtung: 'Vor der Einheit Wasser anbieten.',
    stich: 'vorbereitung vorher trinken essen nuechtern wasser was mitbringen vor dem training',
    url: 'https://www.ems-training.de/faq/faq-praxis/wie-bereite-ich-mich-optimal-auf-mein-ems-training-vor',
    verwandt: ['ernaehrung', 'kleidung', 'medikamente'] },

  { id: 'regeneration', kat: 'praxis', lesezeit: 4,
    frage: 'Warum ist Regeneration bei EMS so wichtig?',
    kurz: 'Weil viele große Muskelgruppen gleichzeitig hart arbeiten, braucht der Körper Zeit, den Reiz zu verarbeiten — der Fortschritt entsteht in der Pause. Zu wenig Pause bringt längeren Muskelkater, Müdigkeit und weniger Wirkung. Hilfreich: Schlaf, Trinken, eiweißreiches Essen, lockere Bewegung an freien Tagen.',
    sagen: ['Die Muskeln werden in der Pause stärker, nicht im Training — deshalb nur einmal die Woche.'],
    achtung: 'Sehr starke Schmerzen, Schwäche oder dunkler Urin: pausieren und ärztlich abklären.',
    stich: 'regeneration pause erholung ruhetag schlaf abstand',
    url: 'https://www.ems-training.de/faq/faq-praxis/warum-ist-regeneration-beim-ems-training-so-wichtig',
    verwandt: ['wie-oft', 'muskelkater', 'ernaehrung'] },

  { id: 'ernaehrung', kat: 'praxis', lesezeit: 4,
    frage: 'Was isst man vor und nach dem EMS-Training?',
    kurz: 'Vorher: 2 bis 3 Stunden davor eine leichte Mahlzeit aus Kohlenhydraten und etwas Eiweiß (z. B. Haferflocken mit Joghurt), bei wenig Zeit ein kleiner Snack; nichts Fettiges, Schweres oder Blähendes. Nachher: Eiweiß, Kohlenhydrate, Gemüse, genug Flüssigkeit — innerhalb von ein, zwei Stunden reicht. Wichtiger als der Zeitpunkt ist die Ernährung über den ganzen Tag.',
    sagen: ['Vorher etwas Leichtes, nachher eine richtige Mahlzeit mit Eiweiß — und über den Tag genug trinken.'],
    achtung: '',
    stich: 'ernaehrung essen eiweiss protein kohlenhydrate snack mahlzeit nachher vorher shake',
    url: 'https://www.ems-training.de/faq/faq-praxis/ems-und-ernaehrung-was-esse-ich-am-besten-vor-und-nach-dem-training',
    autor: 'Stephan Müller (redaktionell eingebunden von der EMS-Training-Redaktion)',
    verwandt: ['vorbereitung', 'regeneration'] },

  { id: 'sport', kat: 'praxis', lesezeit: 3,
    frage: 'Verbessert EMS die sportliche Leistung?',
    kurz: 'Vor allem Kraft, Schnellkraft, Sprungkraft und Antritt — das zeigen Studien seit 2008, u. a. von der Deutschen Sporthochschule Köln. Im Sport ergänzt EMS das Athletiktraining, ersetzt es aber nicht. Für die Regeneration ist der Nutzen weniger klar belegt.',
    sagen: ['Für Sportler ist EMS eine Ergänzung für Schnellkraft — das normale Training bleibt.'],
    achtung: '',
    stich: 'sport sportler leistung schnellkraft sprungkraft athletik fussball verein',
    url: 'https://www.ems-training.de/faq/faq-praxis/kann-ems-training-die-sportliche-leistungsfaehigkeit-verbessern',
    verwandt: ['kombinieren', 'ausdauer'] },

  { id: 'muskelaufbau', kat: 'praxis', lesezeit: 4,
    frage: 'Wie gut baut EMS Muskeln auf?',
    kurz: 'Eine Meta-Analyse (2021) zeigt deutliche Effekte auf Muskelmasse und Kraft bei Nicht-Sportlern; im Vergleich mit hochintensivem Krafttraining ähnliche Ergebnisse in weniger Zeit. Aufbau braucht wie immer genügend Reiz, Wiederholung und Pause.',
    sagen: ['Ja, EMS baut Muskeln auf — mit viel weniger Zeitaufwand als das Gerätetraining.'],
    achtung: '',
    stich: 'muskelaufbau muskeln muskelmasse kraft aufbauen definition',
    url: 'https://www.ems-training.de/faq/faq-praxis/wie-effektiv-ist-ems-training-fuer-den-muskelaufbau',
    verwandt: ['vs-krafttraining', 'warum-wirkt'] },

  { id: 'ausdauer', kat: 'praxis', lesezeit: 4,
    frage: 'Verbessert EMS die Ausdauer?',
    kurz: 'Vor allem die Kraftausdauer der Muskeln — Alltag wie Treppensteigen fällt leichter. Effekte auf Herz-Kreislauf-Ausdauer oder Laufleistung sind möglich, aber uneinheitlich belegt. Ein echtes Ausdauertraining ersetzt EMS nicht.',
    sagen: ['Deine Muskeln halten länger durch — fürs Herz-Kreislauf-System bleibt Gehen, Radfahren oder Laufen wichtig.'],
    achtung: '',
    stich: 'ausdauer kondition cardio laufen joggen radfahren puste',
    url: 'https://www.ems-training.de/faq/faq-praxis/verbessert-ems-training-die-ausdauerleistung',
    verwandt: ['kombinieren', 'sport'] },

  { id: 'kombinieren', kat: 'praxis', lesezeit: 4,
    frage: 'Kann man EMS mit anderem Training kombinieren?',
    kurz: 'Ja, mit Plan: EMS als eigene Krafteinheit, Gewichtstraining und Ausdauer an anderen Tagen, zwischen zwei EMS-Einheiten bei uns mindestens 2 Tage Pause. Leichte Bewegung, Spaziergänge und Dehnen sind an freien Tagen unproblematisch und fördern die Erholung.',
    sagen: ['Klar — nur nicht am selben Tag hart ins Fitnessstudio, und dazwischen genug Pause.'],
    achtung: '',
    stich: 'kombinieren kombination fitnessstudio joggen zusaetzlich yoga sport daneben',
    url: 'https://www.ems-training.de/faq/faq-praxis/kann-man-ems-mit-anderen-trainingsformen-kombinieren',
    verwandt: ['regeneration', 'vs-krafttraining', 'ausdauer'] },

  { id: 'haltung', kat: 'praxis', lesezeit: 4,
    frage: 'Verbessert EMS Haltung und Rumpfstabilität?',
    kurz: 'Ganzkörper-EMS kräftigt Bauch, Rücken, Gesäß und die tiefe Rumpfmuskulatur. Studien zeigen mehr Rumpfkraft und weniger unspezifische Rückenschmerzen, vergleichbar mit klassischem Rückentraining. Haltung hängt aber auch von Sitzen, Bewegung und Stress ab.',
    sagen: ['Eine starke Körpermitte hilft beim Aufrichten — viele merken nach ein paar Wochen, dass sie gerader stehen.'],
    achtung: '',
    stich: 'haltung rumpf core stabilitaet koerpermitte aufrecht rundruecken sitzen buero',
    url: 'https://www.ems-training.de/faq/faq-praxis/hilft-ems-training-die-haltung-zu-verbessern-und-den-rumpf-zu-stabilisieren',
    verwandt: ['ruecken', 'nacken', 'beckenboden'] },

  { id: 'mobilitaet', kat: 'praxis', lesezeit: 3,
    frage: 'Macht EMS beweglicher?',
    kurz: 'Dehnbarer macht es nicht, aber kräftiger und stabiler — und damit fallen Aufstehen, Gehen und Treppensteigen leichter. Bei gebrechlichen Älteren verbesserten sich in einer Studie Aufstehen, Gehen und Gleichgewicht. Dehnen und Alltagsbewegung ersetzt EMS nicht.',
    sagen: ['Beweglicher im Sinne von „besser im Alltag bewegen": ja. Dehnen musst du trotzdem.'],
    achtung: '',
    stich: 'beweglichkeit mobilitaet dehnen gleichgewicht sturz flexibilitaet',
    url: 'https://www.ems-training.de/faq/faq-praxis/verbessert-ems-training-die-beweglichkeit-und-mobilitaet',
    verwandt: ['alter', 'lebensqualitaet'] },

  { id: 'nacken', kat: 'praxis', lesezeit: 3,
    frage: 'Hilft EMS bei Schulter- und Nackenverspannungen?',
    kurz: 'Bei muskulären Verspannungen durch Sitzen, Stress oder schwache Haltemuskulatur kann eine gestärkte Körpermitte Schultern und Nacken entlasten. Speziell zu Nacken und Schulter gibt es weniger Studien als zum Rücken.',
    sagen: ['Wenn Rücken und Rumpf stärker werden, müssen Schultern und Nacken weniger ausgleichen.'],
    achtung: 'Taubheit, Ausstrahlung in Arm oder Hand, Schwindel oder Beschwerden nach einem Unfall: nicht trainieren, ärztlich abklären.',
    stich: 'nacken schulter verspannung verspannungen hws kopfschmerzen buero bildschirm',
    url: 'https://www.ems-training.de/faq/faq-praxis/hilft-ems-training-bei-verspannungen-schulter',
    verwandt: ['haltung', 'ruecken'] },

  /* ── KOSTEN & ANBIETER ─────────────────────────────────────────── */
  { id: 'kosten', kat: 'kosten', lesezeit: 6,
    frage: 'Was kostet EMS-Training?',
    kurz: 'Richtwerte laut Quelle: Einzeleinheit meist ab etwa 49 €, Mitgliedschaften oft etwa 29 bis 49 € pro Woche; reine EMS-Studios im Schnitt rund 107 € im Monat (DSSV/Deloitte/DHfPG). Der größte Preisfaktor ist der Betreuungsschlüssel: 1:1 teurer, 1:2 günstiger. Man bezahlt eine betreute Dienstleistung, nicht nur Gerätezugang.',
    sagen: ['Du bezahlst nicht für Geräte, sondern für einen Trainer, der die ganze Einheit bei dir ist.'],
    achtung: 'Das sind Marktwerte, keine Preise unseres Studios. Für unsere Preise die aktuelle Preisliste nehmen.',
    stich: 'kosten preis preise teuer euro monat beitrag mitgliedschaft vertrag',
    url: 'https://www.ems-training.de/faq/kosten-und-anbieter/was-kostet-ems-training',
    verwandt: ['preisunterschiede', 'einzel-abo', 'krankenkasse'] },

  { id: 'preisunterschiede', kat: 'kosten', lesezeit: 5,
    frage: 'Warum sind EMS-Preise so unterschiedlich?',
    kurz: 'Vor allem wegen des Betreuungsschlüssels (1:1 oder 1:2), dazu Vertragsmodell und Laufzeit, Standort, Trainerqualifikation, Ausstattung, Hygiene und Zusatzleistungen. Warnsignale bei sehr billigen Angeboten: mehr als zwei Personen pro Trainer, keine direkte Betreuung, keine Fachkunde, keine Dokumentation.',
    sagen: ['Vergleich bitte nicht nur den Preis — sondern wie viele Leute ein Trainer gleichzeitig betreut.'],
    achtung: '',
    stich: 'preisunterschied billig guenstig vergleich konkurrenz angebot warum teurer',
    url: 'https://www.ems-training.de/faq/kosten-und-anbieter/wieso-unterscheiden-sich-die-preise-fuer-ems-training',
    verwandt: ['kosten', 'serioes'] },

  { id: 'probetraining', kat: 'kosten', lesezeit: 6,
    frage: 'Wie läuft ein EMS-Probetraining ab?',
    kurz: 'Gesundheitsfragen und Einweisung zuerst, dokumentiert. Dann Kleidung und Elektroden anlegen, kurze Impulsgewöhnung und ein leichtes, verkürztes Training — laut Leitlinie etwa 5 Minuten Gewöhnung und 12 Minuten Intervall, nicht bis zur Erschöpfung. Danach Nachgespräch; bis zur nächsten Einheit mindestens eine Woche.',
    sagen: ['Beim ersten Mal geht es ums Kennenlernen — kurz und bewusst leicht, der Trainer ist nur für dich da.'],
    achtung: 'Die erste Einheit NIE ausbelastend — das ist die Lage, in der der CK-Wert am stärksten steigt.',
    stich: 'probetraining probe erstes mal erste einheit schnuppern kennenlernen ablauf termin',
    url: 'https://www.ems-training.de/faq/kosten-und-anbieter/wie-laeuft-ein-ems-probetraining-ab',
    verwandt: ['ck-wert', 'serioes', 'kleidung'] },

  { id: 'serioes', kat: 'kosten', lesezeit: 5,
    frage: 'Woran erkennt man einen seriösen EMS-Anbieter?',
    kurz: 'Gesundheitsfragen vor dem ersten Training, Trainer mit Fachkunde nach NiSV, Betreuung während der ganzen Einheit und höchstens zwei Trainierende pro Trainer. Dazu Medizinprodukte als Geräte, passende Kleidung, Hygiene, Dokumentation, klare Preise und Verträge ohne Druck. Warnsignal: Heimgeräte für die Eigenanwendung verkaufen.',
    sagen: ['Frag ruhig nach — bei uns bekommst du auf jede dieser Fragen eine klare Antwort.'],
    achtung: '',
    stich: 'serioes anbieter studio qualitaet checkliste worauf achten vertrauen warnsignal',
    url: 'https://www.ems-training.de/faq/kosten-und-anbieter/wie-finde-ich-einen-serioesen-und-sicheren-ems-anbieter-in-meiner-naehe',
    verwandt: ['qualifikation', 'preisunterschiede', 'probetraining'] },

  { id: 'qualifikation', kat: 'kosten', lesezeit: 4,
    frage: 'Welche Qualifikation brauchen EMS-Trainer?',
    kurz: 'Für gewerbliches Ganzkörper-EMS ist die Fachkunde für EMF-Stimulation nach der NiSV Pflicht, spätestens alle fünf Jahre aufzufrischen. Grundlage ist eine sportfachliche Ausbildung, etwa eine Trainer-C- oder Übungsleiterlizenz mit mindestens 120 Lerneinheiten. Eine normale Trainerlizenz allein reicht nicht.',
    sagen: ['Unsere Trainer haben die gesetzlich vorgeschriebene EMS-Fachkunde — frag gern danach.'],
    achtung: 'Für die eigenen Nachweise: unter „Ich → Meine Nachweise" hinterlegen; Ablaufdatum im Blick halten.',
    stich: 'qualifikation fachkunde nisv trainer lizenz ausbildung zertifikat schulung nachweis',
    url: 'https://www.ems-training.de/faq/kosten-und-anbieter/welche-qualifikationen-muessen-ems-trainer-haben',
    verwandt: ['serioes', 'sicher'] },

  { id: 'krankenkasse', kat: 'kosten', lesezeit: 3,
    frage: 'Zahlt die Krankenkasse EMS-Training?',
    kurz: 'Gesetzliche Kassen zahlen EMS im Studio in der Regel nicht. Möglich eher, wenn EMS ärztlich verordnet und therapeutisch oder in der Reha eingesetzt wird; private und Zusatzversicherungen entscheiden je nach Tarif. Am besten vorher schriftlich bei der eigenen Versicherung fragen.',
    sagen: ['Meistens leider nicht — frag am besten schriftlich bei deiner Kasse, manche Zusatzversicherungen geben etwas dazu.'],
    achtung: 'Keine Zusagen zur Erstattung machen.',
    stich: 'krankenkasse kasse zuschuss erstattung versicherung praevention bezahlt aok tk barmer',
    url: 'https://www.ems-training.de/faq/kosten-und-anbieter/uebernimmt-die-krankenkasse-die-kosten-fuer-ems-training',
    verwandt: ['kosten'] },

  { id: 'einzel-abo', kat: 'kosten', lesezeit: 3,
    frage: 'Einzeleinheit oder Abo — was ist günstiger?',
    kurz: 'Die Einzeleinheit ist am flexibelsten, aber pro Termin am teuersten; Flex-Tarife liegen dazwischen, längere Mitgliedschaften sind pro Einheit meist am günstigsten. Weil EMS von Regelmäßigkeit lebt, passt für langfristige Ziele meist das Abo; die Einzeleinheit zum Testen.',
    sagen: ['Zum Ausprobieren eine Einzelstunde, für Ergebnisse ein fester Wochentermin.'],
    achtung: 'Konkrete Tarife: aktuelle Preisliste des Studios.',
    stich: 'einzel einzeleinheit abo mitgliedschaft flex tarif laufzeit kuendigung zehnerkarte',
    url: 'https://www.ems-training.de/faq/kosten-und-anbieter/was-kostet-eine-einzelne-ems-trainingseinheit-im-vergleich-zu-einem-abo',
    verwandt: ['kosten', 'preisunterschiede'] }
  ]
};
