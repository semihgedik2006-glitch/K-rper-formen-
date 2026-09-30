/* ══════════════════════════════════════════════════════════════════════
   DAS GRUNDGERÜST DER SCHULUNGEN

   Aus dem Betrieb, 22.9.2026:
     „ich möchte einen bereich für eine art webinar und onboarding …
      wo dann jegliche schritte mit videos und interaktivität erklärt
      werden und danach noch fragen gestellt werden … Am anfang möchte
      ich nur das grundgerüst, ich gebe dir dann die videos oder poste
      sie extern irgendwo und wir bauen diese dann ein."

   Hier stehen die Module. DREI zum Anfangen, damit der ganze Weg
   begehbar ist — Kategorie wählen, Code eingeben, Schritte durchgehen,
   Fragen beantworten, Ergebnis. Sie sind echt und nicht erfunden: der
   Inhalt stammt aus demselben Mitarbeiter-Handbuch wie die 115
   Problemlösungen.

   ── WO DIE VIDEOS HINKOMMEN ────────────────────────────────────────
   Ein Schritt der Art `video` hat ein Feld `quelle`. Solange es `null`
   ist, zeigt die App einen Platzhalter mit der vorgesehenen Länge und
   sagt ehrlich, dass das Video noch fehlt — sie tut NICHT so, als sei
   der Schritt erledigt.

   Entschieden ist: eigener Speicher, ein ZWEITER Eimer, niemals der
   mit der nächtlichen Sicherung. Nur mit eigenem Player lässt sich
   „wirklich angesehen" messen; bei einem eingebetteten fremden Video
   bliebe ein Häkchen, und ein Häkchen ist eine Behauptung, keine
   Messung. Seit dem 29.9.2026 steht der Eimer: ein Video aus dem
   Grundstock trägt `quelle: 'speicher:<pfad>'` (siehe Modul 9).

   ── WARUM DAS EINE DATEI IST UND NICHT EINE SAMMLUNG ───────────────
   Dieselbe Rechnung wie beim Handbuch: in der Datenbank kostete jedes
   Öffnen so viele Lesevorgänge, wie es Module gibt. Als Datei kostet
   es nichts, liegt im Zwischenspeicher und ist auch ohne Netz da — und
   ohne Netz ist genau der Fall, in dem im Studio geschult wird.

   Die Sammlung `schulungen` gibt es trotzdem: was der Betrieb selbst
   anlegt, landet dort und wird dazugemischt. Heute ist sie leer.

   ── ÄNDERN ─────────────────────────────────────────────────────────
   Diese Datei wird von Hand gepflegt, anders als loesungen-basis.js.
   Wer ein Modul ändert, zählt in sw.js VERSION hoch — sonst liegt auf
   den Geräten eine Woche lang die alte Fassung.
   ══════════════════════════════════════════════════════════════════ */
window.SCHULUNGEN_BASIS = {
  stand: '2026-09-30',
  quelle: 'Körper Formen — Mitarbeiter-Handbuch',

  /* Die Kategorien. Umbenennen ist eine Zeile; die `id` bleibt, sonst
     verlieren die Durchläufe ihre Zuordnung. */
  kategorien: [
    { id: 'einarbeitung', name: 'Einarbeitung',        ico: 'rakete' },
    { id: 'geraet',       name: 'Gerät & Elektroden',  ico: 'hantel' },
    { id: 'hygiene',      name: 'Hygiene',             ico: 'tropfen' },
    { id: 'notfall',      name: 'Notfall & Sicherheit', ico: 'schild' },
    { id: 'kunde',        name: 'Kundengespräch',      ico: 'person' },
    { id: 'verkauf',      name: 'Verkauf & Beratung',  ico: 'wagen' },
    { id: 'ablauf',       name: 'Abläufe',             ico: 'wiederholen' },
    { id: 'ems',          name: 'EMS-Wissen',          ico: 'blitz' }
  ],

  module: [
    /* ── 1 ──────────────────────────────────────────────────────────
       Das Einarbeitungsmodul. Bewusst als erstes und bewusst kurz: es
       ist das, was jemand am ersten Tag sieht, und der erste Tag ist
       ohnehin voll. */
    {
      id: 'm-start', nr: 1, kat: 'einarbeitung',
      titel: 'Dein erster Tag im Studio',
      beschreibung: 'Wie ein Tag abläuft, wo was steht, und an wen du dich wendest.',
      dauer: 10, pflicht: true, gueltigMonate: 0,
      strenge: 'alles',
      schritte: [
        { art: 'text', titel: 'Willkommen',
          text: 'Diese Schulung dauert etwa zehn Minuten. Du kannst sie jederzeit ' +
                'anhalten und später weitermachen — deine Antworten bleiben stehen.\n\n' +
                'Am Ende stehen ein paar Fragen. Sie sind kein Test, an dem du ' +
                'scheitern kannst: falsch beantwortet heisst, dass du es noch einmal ' +
                'versuchst, bis es sitzt.' },
        { art: 'video', titel: 'Ein Tag im Studio', dauer: 240, quelle: null,
          hinweis: 'Rundgang: Empfang, Trainingsfläche, Umkleide, Lager.' },
        { art: 'text', titel: 'Die drei festen Punkte',
          text: 'Öffnen, der laufende Betrieb, Schliessen. Alles andere hängt ' +
                'dazwischen.\n\nWas beim Öffnen und Schliessen zu tun ist, steht als ' +
                'Liste in der App unter Aufgaben — du musst es nicht auswendig können, ' +
                'aber du musst wissen, wo es steht.' },
        { art: 'bestaetigen', titel: 'Kurz bestätigen',
          text: 'Ich weiss, wo die Öffnungs- und Schliessliste in der App steht.' },
        { art: 'video', titel: 'Wen frage ich wann?', dauer: 180, quelle: null,
          hinweis: 'Studioleitung, Teamchat, Hilfe im Studio — und was wohin gehört.' }
      ],
      fragen: [
        { frage: 'Ein Gerät piept beim Einschalten dreimal und geht wieder aus. Was ist der erste Schritt?',
          antworten: [
            'Das Gerät weiter benutzen, es geht meistens von selbst',
            'In der App unter „Hilfe im Studio" nachsehen',
            'Sofort die Geschäftsführung anrufen',
            'Das Gerät auf- und wieder zuschrauben'
          ], richtig: 1,
          hinweis: 'Der Rettungsring oben in der Kopfzeile. Dort stehen 115 Probleme ' +
                   'samt Schritten — das piepende Gerät ist eines davon.' },
        { frage: 'Du bist unsicher, ob eine Aufgabe schon erledigt ist. Was tust du?',
          antworten: [
            'Ich mache sie sicherheitshalber noch einmal',
            'Ich lasse es, jemand anders wird es gemacht haben',
            'Ich sehe in der App nach, wer sie abgehakt hat',
            'Ich frage am nächsten Tag nach'
          ], richtig: 2,
          hinweis: 'An jeder erledigten Aufgabe steht, wer sie wann abgehakt hat. ' +
                   'Das ist genau der Grund, warum es dort steht.' }
      ]
    },

    /* ── 2 ────────────────────────────────────────────────────────── */
    {
      id: 'm-hygiene', nr: 2, kat: 'hygiene',
      titel: 'Hygiene nach jedem Training',
      beschreibung: 'Was nach jeder Einheit passieren muss — und warum es nicht warten kann.',
      dauer: 8, pflicht: true,
      /* Hygieneunterweisungen laufen ab. Zwölf Monate ist der übliche
         Rhythmus; die App meldet sich rechtzeitig. */
      gueltigMonate: 12,
      strenge: 'alles',
      schritte: [
        { art: 'text', titel: 'Warum sofort und nicht später',
          text: 'EMS-Ausrüstung liegt direkt auf der Haut, und sie ist nach dem ' +
                'Training feucht. Was eine Stunde liegen bleibt, ist nicht mehr nur ' +
                'schmutzig — es riecht, und es überträgt.\n\n' +
                'Deshalb gilt: erst reinigen, dann alles andere.' },
        { art: 'video', titel: 'Trainingsplatz reinigen', dauer: 210, quelle: null,
          hinweis: 'Reihenfolge, Mittel, Einwirkzeit.' },
        { art: 'video', titel: 'Elektroden und Weste desinfizieren', dauer: 260, quelle: null,
          hinweis: 'Besonders die Kontaktflächen — dort sitzt der Schweiss.' },
        { art: 'bestaetigen', titel: 'Kurz bestätigen',
          text: 'Ich weiss, wo Desinfektionsmittel und Tücher stehen und wen ich ' +
                'informiere, wenn etwas leer ist.' }
      ],
      fragen: [
        { frage: 'Wann wird der Trainingsplatz gereinigt?',
          antworten: [
            'Direkt nach jeder Einheit',
            'Einmal in der Mitte des Tages',
            'Am Abend beim Schliessen',
            'Wenn der nächste Kunde sich beschwert'
          ], richtig: 0,
          hinweis: 'Direkt danach. Alles andere sammelt sich, und gesammelt wird ' +
                   'es nicht besser.' },
        { frage: 'Das Desinfektionsmittel ist leer und es ist keines im Lager. Was tust du?',
          antworten: [
            'Mit Wasser weitermachen, ist besser als nichts',
            'Im Material-Bereich als fehlend melden und die Leitung informieren',
            'Die nächsten Termine absagen',
            'Aus einem anderen Studio welches holen, ohne Bescheid zu sagen'
          ], richtig: 1,
          hinweis: 'Melden ist der Punkt: was nur einer weiss, bestellt niemand nach.' },
        { frage: 'Worauf kommt es beim Desinfizieren der Elektroden besonders an?',
          antworten: [
            'Dass es schnell geht',
            'Dass die Kontaktflächen erfasst werden und das Mittel einwirken kann',
            'Dass man Handschuhe trägt',
            'Dass man es vor dem Kunden macht'
          ], richtig: 1,
          hinweis: 'Einwirkzeit ist kein Vorschlag. Ein kurz überwischter Kontakt ' +
                   'sieht sauber aus und ist es nicht.' }
      ]
    },

    /* ── 3 ────────────────────────────────────────────────────────── */
    {
      id: 'm-notfall', nr: 3, kat: 'notfall',
      titel: 'Wenn einem Kunden schlecht wird',
      beschreibung: 'Der Ablauf bei Kreislaufproblemen während oder nach dem Training.',
      dauer: 9, pflicht: true, gueltigMonate: 12,
      strenge: 'alles',
      schritte: [
        { art: 'text', titel: 'Der häufigste Fall',
          text: 'EMS ist anstrengender, als es aussieht. Kreislaufprobleme kommen ' +
                'vor — meistens harmlos, manchmal nicht. Der Unterschied ist nicht ' +
                'am Anfang zu erkennen, und genau deshalb gibt es einen festen ' +
                'Ablauf statt eines Bauchgefühls.' },
        { art: 'video', titel: 'Der Ablauf, Schritt für Schritt', dauer: 300, quelle: null,
          hinweis: 'Training stoppen, hinlegen, Beine hoch, ansprechbar halten.' },
        { art: 'bestaetigen', titel: 'Kurz bestätigen',
          text: 'Ich weiss, wo der Erste-Hilfe-Kasten hängt und wo die Notrufnummern stehen.' },
        { art: 'text', titel: 'Danach',
          text: 'Jeder Vorfall wird festgehalten — auch der, bei dem am Ende nichts ' +
                'war. Nicht als Formalität: wenn derselbe Kunde ein zweites Mal ' +
                'Probleme hat, ist der erste Eintrag das, woran man es merkt.' }
      ],
      fragen: [
        { frage: 'Einem Kunden wird während des Trainings schwindelig. Was ist der erste Schritt?',
          antworten: [
            'Das Training auf niedrigerer Stufe fortsetzen',
            'Das Training sofort stoppen',
            'Ein Glas Wasser holen',
            'Warten, ob es von selbst besser wird'
          ], richtig: 1,
          hinweis: 'Zuerst stoppen. Alles andere kommt danach.' },
        { frage: 'Der Kunde erholt sich nach fünf Minuten und sagt, es sei nichts gewesen. Was tust du?',
          antworten: [
            'Nichts weiter, er hat es ja selbst gesagt',
            'Den Vorfall festhalten und die Leitung informieren',
            'Den Kunden nach Hause schicken und das Training nachholen',
            'Den nächsten Termin absagen'
          ], richtig: 1,
          hinweis: 'Auch der Vorfall, bei dem nichts war, wird festgehalten. Beim ' +
                   'zweiten Mal ist der erste Eintrag das, woran man es merkt.' },
        { frage: 'Wer entscheidet, ob ein Rettungsdienst gerufen wird?',
          antworten: [
            'Immer nur die Studioleitung',
            'Der Kunde selbst',
            'Wer dabei ist — im Zweifel wird gerufen',
            'Die Geschäftsführung nach einem Anruf'
          ], richtig: 2,
          hinweis: 'Im Zweifel rufen. Ein Rettungswagen, der umsonst kommt, ist ' +
                   'ein guter Tag; der andere Fall ist keiner.' }
      ]
    },

    /* ══ EMS-WISSEN ALS SCHULUNG (Runde 104, 24.9.2026) ══════════════
       Aus dem Betrieb: „und dann können wir passend dazu Schulungen
       erstellen die auch etwas länger sind wo man dann erstmal was
       lesen muss und das dann später durch videos ersetzt werden kann"
       und: „Pflichtmodul muss es erstmal nicht geben".

       Der Lesestoff steht NICHT hier, sondern in ems-wissen.js — ein
       Schritt der Art `lesen` nennt nur die Einträge (`ems`). So gibt es
       jeden Text genau einmal: wer im Hilfe-Fenster eine Antwort
       berichtigt, berichtigt sie auch in der Schulung.

       `quelle` (das Video) ist bei allen noch null. Sobald ein Video da ist, steht es
       über dem Text, und der Text bleibt als „Zum Nachlesen" darunter. */
    {
      id: 'm-ems-grundlagen', nr: 4, kat: 'ems',
      titel: 'EMS verstehen und erklären',
      beschreibung: 'Was EMS ist, wie es wirkt, warum 20 Minuten einmal pro Woche reichen — so, dass du es jedem Kunden erklären kannst.',
      dauer: 20, pflicht: false, gueltigMonate: 0,
      strenge: 'alles',
      schritte: [
        { art: 'text', titel: 'Worum es geht',
          text: 'Diese Schulung ist zum Lesen. Später kommen Videos dazu; bis dahin ' +
                'stehen die Texte hier, jeweils mit dem Weg zum ausführlichen Artikel.\n\n' +
                'Weiter geht es, wenn du bis unten gelesen hast. Am Ende stehen ein paar ' +
                'Fragen — falsch heisst nur: noch einmal ansehen.' },
        { art: 'lesen', titel: 'Was EMS ist und wie es wirkt', quelle: null,
          ems: ['was-ist-ems', 'technik', 'warum-wirkt'] },
        { art: 'lesen', titel: 'Wie oft, wie lange, wie schnell', quelle: null,
          ems: ['zwanzig-minuten', 'wie-oft', 'erfolge'] },
        { art: 'lesen', titel: 'Abgrenzen können', quelle: null,
          ems: ['ems-tens', 'vs-krafttraining', 'zuhause', 'geschichte'] }
      ],
      fragen: [
        { frage: 'Ein Kunde fragt: „Liege ich da einfach und der Strom macht alles?" Was stimmt?',
          antworten: [
            'Ja, bewegen muss man sich nicht',
            'Nein — man spannt selbst an und bewegt sich, die Impulse verstärken das',
            'Nur beim ersten Mal muss man mitmachen',
            'Das hängt vom Gerät ab'
          ], richtig: 1,
          hinweis: 'EMS verstärkt die eigene, bewusste Anspannung. Es ist aktives Training, kein „Strom machen lassen".' },
        { frage: 'Wie lange dauert eine intensive Ganzkörper-EMS-Einheit höchstens?',
          antworten: ['10 Minuten', '20 Minuten', '45 Minuten', 'So lange der Kunde möchte'], richtig: 1,
          hinweis: '20 Minuten sind Standard UND Obergrenze. Jede Muskelgruppe ist dabei rund 10 Minuten aktiv.' },
        { frage: 'Ein neuer Kunde möchte in den ersten Wochen zweimal pro Woche kommen. Was sagt die Leitlinie?',
          antworten: [
            'Gerne, mehr bringt mehr',
            'In den ersten 8–10 Wochen höchstens einmal pro Woche',
            'Zweimal ist genau richtig',
            'Das entscheidet der Kunde'
          ], richtig: 1,
          hinweis: 'Eingewöhnung laut Leitlinie: höchstens eine 20-Minuten-Einheit pro Woche. Und immer gilt bei uns: mindestens 2 Tage Pause zwischen zwei Einheiten.' },
        /* Hausregel, 24.9.2026: „bei uns sind es MINDESTENS 2 Tage". */
        { frage: 'Wie viel Pause liegt bei uns mindestens zwischen zwei EMS-Einheiten?',
          antworten: ['Keine — jeden Tag geht', '1 Tag', 'Mindestens 2 Tage', 'Zwei Wochen'], richtig: 2,
          hinweis: 'Mindestens 2 Tage. Der Fortschritt entsteht in der Pause; wer zu früh wiederkommt, trainiert auf müde Muskeln.' },
        { frage: 'Warum wird die Funktionskleidung angefeuchtet?',
          antworten: [
            'Damit sie kühlt',
            'Damit der Impuls gleichmäßig und angenehm übertragen wird',
            'Aus hygienischen Gründen',
            'Damit sie besser sitzt'
          ], richtig: 1,
          hinweis: 'Trockene Haut leitet schlecht; der Reiz wird dann ungleichmäßig und unangenehm.' },
        { frage: 'Ein Kunde will sich einen EMS-Anzug für zu Hause kaufen. Was ist die beste Antwort?',
          antworten: [
            'Gute Idee, dann spart er sich den Weg',
            'Davon abraten: Überlastung merkt man oft erst Tage später, EMS gehört in fachkundige Hände',
            'Nur, wenn er vorher dreimal im Studio war',
            'Das ist uns egal'
          ], richtig: 1,
          hinweis: 'Laien können die Belastung nicht einschätzen — sie zeigt sich oft erst 2 bis 3 Tage später.' },
        { frage: 'Was ist der Unterschied zwischen EMS und TENS?',
          antworten: [
            'Keiner, beides ist dasselbe',
            'EMS ist Muskeltraining, TENS ein örtliches Schmerzgerät',
            'TENS ist die stärkere Version von EMS',
            'EMS ist nur für Sportler'
          ], richtig: 1,
          hinweis: 'EMS löst Muskelkontraktionen aus; TENS wirkt örtlich auf Nerven gegen Schmerzen.' }
      ]
    },

    {
      id: 'm-ems-sicherheit', nr: 5, kat: 'ems',
      titel: 'Kontraindikationen und Sicherheit',
      beschreibung: 'Wer nicht trainieren darf, wer nur mit ärztlicher Freigabe, und welche Warnzeichen du nach dem Training ernst nimmst.',
      dauer: 25, pflicht: false, gueltigMonate: 0,
      strenge: 'alles',
      schritte: [
        { art: 'lesen', titel: 'Wann EMS sicher ist', quelle: null,
          ems: ['sicher', 'fuer-wen'] },
        { art: 'lesen', titel: 'Kontraindikationen', quelle: null,
          ems: ['kontraindikationen'] },
        { art: 'bestaetigen', titel: 'Kurz bestätigen',
          text: 'Ich weiss: bei einer absoluten Kontraindikation wird nicht trainiert, bei einer relativen nur mit ärztlicher Freigabe — und im Zweifel frage ich die Leitung.' },
        { art: 'lesen', titel: 'Nach dem Training: normal oder Warnsignal?', quelle: null,
          ems: ['muskelkater', 'ck-wert'] },
        { art: 'lesen', titel: 'Medikamente', quelle: null,
          ems: ['medikamente'] }
      ],
      fragen: [
        { frage: 'Ein Kunde mit Herzschrittmacher möchte ein Probetraining. Was gilt?',
          antworten: [
            'Mit niedriger Intensität geht es',
            'Mit ärztlicher Freigabe geht es',
            'Kein EMS — elektrische Implantate sind eine absolute Kontraindikation',
            'Nur mit Weste, ohne Arm-Elektroden'
          ], richtig: 2,
          hinweis: 'Herzschrittmacher und andere elektrische Implantate: absolute Kontraindikation, auch mit Freigabe nicht.' },
        { frage: 'Eine Kundin hat gut eingestellten Diabetes. Was gilt seit 2024?',
          antworten: [
            'Absolute Kontraindikation',
            'Relative Kontraindikation — nur mit ärztlicher Freigabe',
            'Kein Thema, einfach trainieren',
            'Nur morgens trainieren'
          ], richtig: 1,
          hinweis: 'Diabetes und Krebs sind seit der Konsensempfehlung 2024 relativ, nicht mehr absolut: Freigabe nötig.' },
        { frage: 'Welches davon ist KEINE absolute Kontraindikation?',
          antworten: ['Schwangerschaft', 'Akuter Infekt mit Fieber', 'Implantat, älter als 6 Monate', 'Unbehandelter Bluthochdruck'], richtig: 2,
          hinweis: 'Implantate älter als 6 Monate sind relativ (Freigabe). Die anderen drei schließen EMS aus.' },
        { frage: 'Zwei Tage nach dem ersten Training meldet ein Kunde sehr starke Muskelschmerzen und dunklen Urin. Was tust du?',
          antworten: [
            'Das ist normaler Muskelkater',
            'Kein Training; er soll das sofort ärztlich abklären lassen, und die Leitung wird informiert',
            'Ihm empfehlen, viel zu trinken und nächste Woche wiederzukommen',
            'Die Intensität beim nächsten Mal senken'
          ], richtig: 1,
          hinweis: 'Starke Schmerzen, Schwäche, dunkler Urin sind Warnzeichen (erhöhter CK-Wert, Rhabdomyolyse) — ärztlich abklären.' },
        { frage: 'Warum ist die erste Einheit bewusst leicht und verkürzt?',
          antworten: [
            'Damit der Kunde wiederkommt',
            'Weil nach einer zu harten ersten Einheit der Muskelwert (CK) besonders stark ansteigen kann',
            'Weil das Gerät erst warm werden muss',
            'Das ist nur eine Empfehlung für Ältere'
          ], richtig: 1,
          hinweis: 'Gerade die erste Einheit darf nicht ausbelastend sein; mit Eingewöhnung fällt der Anstieg deutlich kleiner aus.' },
        { frage: 'Ein Kunde hat heute ein Muskelrelaxans genommen. Was ist richtig?',
          antworten: [
            'Egal, Hauptsache er fühlt sich fit',
            'Angeben lassen und klären; die Leitlinie rät, 24–48 Stunden vorher darauf zu verzichten',
            'Dann einfach die Intensität verdoppeln',
            'Muskelrelaxanzien sind ein Pluspunkt für EMS'
          ], richtig: 1,
          hinweis: 'Muskelrelaxanzien verändern Muskelspannung und Körpergefühl — die Steuerung wird unsicher.' }
      ]
    },

    {
      id: 'm-ems-gruppen', nr: 6, kat: 'ems',
      titel: 'Besondere Kundengruppen',
      beschreibung: 'Herz und Kreislauf, Schwangerschaft und nach der Geburt, Rücken und Gelenke, Alter, Übergewicht — was geht, was nicht, was vorher geklärt wird.',
      dauer: 35, pflicht: false, gueltigMonate: 0,
      strenge: 'alles',
      schritte: [
        { art: 'lesen', titel: 'Herz, Kreislauf, Stoffwechsel', quelle: null,
          ems: ['bluthochdruck', 'herz-kreislauf', 'diabetes'] },
        { art: 'lesen', titel: 'Frauen: Schwangerschaft, Geburt, Periode', quelle: null,
          ems: ['schwangerschaft', 'nach-geburt', 'periode', 'spirale', 'beckenboden'] },
        { art: 'lesen', titel: 'Rücken, Gelenke, nach einer Operation', quelle: null,
          ems: ['ruecken', 'arthrose', 'prothese', 'operation', 'rheuma', 'krampfadern'] },
        { art: 'lesen', titel: 'Alter, Gewicht, Krebs', quelle: null,
          ems: ['alter', 'lebensqualitaet', 'uebergewicht', 'abnehmspritze', 'krebs'] }
      ],
      fragen: [
        { frage: 'Eine Kundin erzählt, dass sie schwanger ist. Was gilt?',
          antworten: [
            'Mit niedriger Intensität weiter',
            'Kein EMS während der Schwangerschaft — unabhängig von der Intensität',
            'Bis zum dritten Monat ist es erlaubt',
            'Mit ärztlicher Freigabe geht es'
          ], richtig: 1,
          hinweis: 'Schwangerschaft ist eine absolute Kontraindikation. Nach der Geburt wieder, mit ärztlicher Freigabe.' },
        { frage: 'Ab wann kann eine Kundin nach der Geburt wieder mit EMS anfangen?',
          antworten: [
            'Nach genau sechs Wochen',
            'Individuell — nach Rückbildung und Heilung und mit ärztlicher Freigabe',
            'Sofort, EMS hilft bei der Rückbildung',
            'Erst nach einem Jahr'
          ], richtig: 1,
          hinweis: 'Es gibt kein festes Datum. Nach Kaiserschnitt oder Komplikationen meist später.' },
        { frage: 'Ein Kunde hat unbehandelten Bluthochdruck. Was gilt?',
          antworten: ['Mit Freigabe möglich', 'Absolute Kontraindikation', 'Kein Problem', 'Nur mit Pulsuhr'], richtig: 1,
          hinweis: 'UNBEHANDELT schließt aus. Gut eingestellt: relative Kontraindikation, Freigabe nötig.' },
        { frage: 'Bei welchen Rückenbeschwerden ist EMS am besten untersucht?',
          antworten: [
            'Frischer Bandscheibenvorfall',
            'Chronische, unspezifische Rückenschmerzen',
            'Rückenschmerzen nach einem Unfall',
            'Akute Rückenschmerzen ohne Diagnose'
          ], richtig: 1,
          hinweis: 'Chronisch-unspezifisch ist gut belegt. Akute Schmerzen ohne Diagnose und akute Bandscheibenvorfälle: erst ärztlich klären.' },
        { frage: 'Das Bein eines Kunden mit Krampfadern ist plötzlich einseitig dick, rot und warm. Was tust du?',
          antworten: [
            'Leichter trainieren',
            'Kein Training; das kann eine Thrombose sein — sofort ärztlich abklären',
            'Das Bein hochlegen und dann trainieren',
            'Die Elektrode am Bein weglassen'
          ], richtig: 1,
          hinweis: 'Ruhige Krampfadern sind kein Ausschluss — akute Warnzeichen schon.' },
        { frage: 'Warum passt EMS gut zu einer Abnehmspritze (GLP-1)?',
          antworten: [
            'Weil EMS schneller abnehmen lässt',
            'Weil beim Abnehmen auch Muskelmasse verloren geht und Muskeltraining sie erhalten hilft',
            'Weil die Spritze sonst nicht wirkt',
            'Weil man dann nicht mehr essen muss'
          ], richtig: 1,
          hinweis: 'Muskelerhalt ist der Punkt. Wer kaum isst: nicht nüchtern trainieren lassen.' }
      ]
    },

    {
      id: 'm-ems-ergebnisse', nr: 7, kat: 'ems',
      titel: 'Ergebnisse ehrlich erklären',
      beschreibung: 'Muskelaufbau, Bauchfett, Kalorien, Cellulite, Haltung — was EMS wirklich kann, und was man nicht versprechen darf.',
      dauer: 30, pflicht: false, gueltigMonate: 0,
      strenge: 'alles',
      schritte: [
        { art: 'lesen', titel: 'Körper und Figur', quelle: null,
          ems: ['muskelaufbau', 'bauchfett', 'kalorien', 'cellulite'] },
        { art: 'lesen', titel: 'Haltung, Beweglichkeit, Ausdauer, Sport', quelle: null,
          ems: ['haltung', 'nacken', 'mobilitaet', 'ausdauer', 'sport'] },
        { art: 'lesen', titel: 'Rund um das Training', quelle: null,
          ems: ['vorbereitung', 'ernaehrung', 'regeneration', 'kombinieren', 'uebungen', 'kleidung'] }
      ],
      fragen: [
        { frage: 'Eine Kundin möchte „nur am Bauch" abnehmen. Was ist ehrlich?',
          antworten: [
            'Mit EMS geht gezielter Fettabbau am Bauch',
            'Gezielt nur an einer Stelle geht mit keiner Methode — EMS stärkt aber die Körpermitte und unterstützt den allgemeinen Fettabbau',
            'Dafür braucht es zwei Einheiten pro Woche',
            'Nur mit Bauchelektrode'
          ], richtig: 1,
          hinweis: 'Punktuelles Abnehmen gibt es nicht. Haltung und eine starke Körpermitte sieht man trotzdem.' },
        { frage: 'Wie viele Kalorien verbraucht eine EMS-Einheit?',
          antworten: [
            'Immer genau 500',
            'Das lässt sich nicht pauschal sagen; der Nutzen liegt im Muskelreiz, nicht in der Kalorienzahl',
            'Etwa so viel wie ein Marathon',
            'Keine'
          ], richtig: 1,
          hinweis: 'Es hängt von Intensität, Muskelmasse und Anspannung ab. Studienwerte sind keine Garantie für jeden.' },
        { frage: 'Hilft EMS gegen Cellulite?',
          antworten: [
            'Ja, sie verschwindet nach zehn Einheiten',
            'Entfernen kann EMS sie nicht, aber straffere Muskeln darunter können die Kontur verbessern',
            'Nein, EMS verschlimmert Cellulite',
            'Nur mit Creme'
          ], richtig: 1,
          hinweis: 'Keine Heilversprechen. Die Studienlage speziell zu Cellulite ist dünn.' },
        { frage: 'Was sollte ein Kunde vor dem Training essen?',
          antworten: [
            'Gar nichts, nüchtern ist besser',
            'Etwa 2 Stunden vorher eine leichte, kohlenhydratreiche Kleinigkeit',
            'Direkt davor eine große Mahlzeit',
            'Nur Eiweißshake'
          ], richtig: 1,
          hinweis: 'Nicht nüchtern trainieren. Dazu je 250–500 ml trinken, etwa 30 Minuten vorher und direkt danach.' },
        { frage: 'Ein Kunde will direkt nach EMS noch schweres Beintraining im Fitnessstudio machen. Was rätst du?',
          antworten: [
            'Super, doppelt hält besser',
            'Trainingsreize trennen: anderes Krafttraining an anderen Tagen, zwischen intensiven Einheiten genug Pause',
            'Nur Arme trainieren',
            'Vorher statt nachher'
          ], richtig: 1,
          hinweis: 'Der Fortschritt entsteht in der Pause. Lockere Bewegung an freien Tagen ist dagegen gut.' }
      ]
    },

    {
      id: 'm-ems-beratung', nr: 8, kat: 'ems',
      titel: 'Beratung, Preise und Probetraining',
      beschreibung: 'Wie ein gutes Probetraining abläuft, woran Kunden einen seriösen Anbieter erkennen, und was du zu Preisen und Krankenkasse sagen kannst.',
      dauer: 20, pflicht: false, gueltigMonate: 0,
      strenge: 'alles',
      schritte: [
        { art: 'lesen', titel: 'Das Probetraining', quelle: null,
          ems: ['probetraining'] },
        { art: 'lesen', titel: 'Qualität, die man zeigen kann', quelle: null,
          ems: ['serioes', 'qualifikation'] },
        { art: 'lesen', titel: 'Preise und Krankenkasse', quelle: null,
          ems: ['kosten', 'preisunterschiede', 'einzel-abo', 'krankenkasse'] }
      ],
      fragen: [
        { frage: 'Wie lange dauert der Trainingsteil im ersten Probetraining laut Leitlinie etwa?',
          antworten: ['20 Minuten, wie immer', 'Rund 5 Minuten Gewöhnung und 12 Minuten Intervall — nicht ausbelastend', '30 Minuten, damit man es spürt', '5 Minuten'], richtig: 1,
          hinweis: 'Das erste Training ist verkürzt und leicht. Bis zur nächsten Einheit mindestens eine Woche.' },
        { frage: 'Wie viele Kunden darf ein Trainer beim Ganzkörper-EMS gleichzeitig betreuen?',
          antworten: ['Einen, höchstens zwei', 'Bis zu vier', 'So viele Geräte da sind', 'Das ist nicht geregelt'], richtig: 0,
          hinweis: 'Empfohlen ist 1:1, im nicht-medizinischen Bereich 1:2 vertretbar — mehr nicht.' },
        { frage: 'Welche Qualifikation ist für gewerbliches Ganzkörper-EMS Pflicht?',
          antworten: ['Keine besondere', 'Die Fachkunde nach NiSV, spätestens alle fünf Jahre aufgefrischt', 'Ein Physiotherapie-Studium', 'Ein Erste-Hilfe-Kurs genügt'], richtig: 1,
          hinweis: 'Eine normale Trainerlizenz reicht allein nicht.' },
        { frage: 'Ein Kunde fragt, ob die Krankenkasse EMS bezahlt. Was ist richtig?',
          antworten: [
            'Ja, immer',
            'Gesetzliche Kassen zahlen es im Studio meist nicht; am besten schriftlich bei der eigenen Versicherung fragen',
            'Nur private Kassen, immer',
            'Wir rechnen direkt mit der Kasse ab'
          ], richtig: 1,
          hinweis: 'Keine Zusagen zur Erstattung machen — nachfragen lassen.' },
        { frage: 'Ein Kunde vergleicht uns mit einem sehr billigen Angebot. Worauf kannst du hinweisen?',
          antworten: [
            'Dass billig immer schlecht ist',
            'Auf den Betreuungsschlüssel, die Fachkunde, Anamnese, Hygiene und Dokumentation',
            'Dass wir auch billiger werden',
            'Auf gar nichts'
          ], richtig: 1,
          hinweis: 'Nicht den Preis schlechtreden — zeigen, was darin steckt.' }
      ]
    },

    /* ── 9 ──────────────────────────────────────────────────────────
       DAS BERATUNGSGESPRÄCH — 15 Videos, aufeinander aufbauend.

       Aus dem Betrieb, 29.9.2026: „alle 15 videos sollen in eine
       schulung rein weil das ja alles auf einander aufbaut … passende
       fragen zu dem jeweiligen video und paar andere fragen welche mit
       den infos aus den videos beantwortet oder hergeleitet werden
       können".

       Die Fragen stammen aus den Abschriften der Videos (abgehört am
       30.9.2026). Jede Frage mit `nach` kommt direkt nach diesem
       Schritt; die ohne `nach` stehen am Ende und verbinden mehrere
       Videos. Konkrete Preise aus den Beispielgesprächen werden bewusst
       NICHT abgefragt — sie ändern sich, und dann wäre die Schulung
       falsch.

       Die Videos liegen im Video-Eimer des Betriebs. `quelle` nennt den
       PFAD, keine Adresse: die App holt sich die Abspiel-Adresse erst
       beim Abspielen, und das erlauben die Regeln nur der eigenen Firma
       (storage-videos.rules). Deshalb auch `firma`: in einem anderen
       Betrieb bliebe jedes Video stumm. */
    {
      id: 'm-beratung', nr: 9, kat: 'verkauf', firma: 'koerperformen',
      titel: 'Das Beratungsgespräch — vom Anruf bis zur Empfehlung',
      beschreibung: '15 Videos: Terminvereinbarung, Begrüßung, Bedarfsanalyse, Angebot, Einwände, Weiterempfehlung — mit Beispielgesprächen.',
      dauer: 150, pflicht: true, gueltigMonate: 0,
      /* Aus dem Betrieb, 30.9.2026: „mache es alles etwas schwieriger es
         soll ja auch nicht jeder direkt bestehen". Bei einer Grenze zählt
         der ERSTE Versuch; danach zeigt die App die richtige Antwort mit
         Hinweis, und es geht weiter. Wer unter 80 % bleibt, macht die
         Schulung noch einmal. */
      strenge: 'grenze', grenze: 80,
      schritte: [
        /* 0 */
        { art: 'text', titel: 'Worum es geht',
          text: 'Diese Schulung zeigt Schritt für Schritt, wie aus einem Interessenten ein ' +
                'Mitglied wird, das lange und zufrieden bleibt: vom ersten Anruf über das ' +
                'Beratungsgespräch bis zur Weiterempfehlung.\n\n' +
                'Die Videos bauen aufeinander auf. Nach jedem kommen Fragen dazu, am Ende noch ' +
                'einige, die mehrere Videos verbinden.\n\n' +
                'So wird gewertet: Es zählt jeweils die ERSTE Antwort. Liegst du daneben, siehst du ' +
                'die richtige Antwort und einen Hinweis — dann geht es weiter. Bestanden ist ab 80 % ' +
                'richtig; sonst machst du die Schulung noch einmal.\n\n' +
                '„Weiter" geht bei jedem Video erst, wenn du es angesehen hast. Vorspulen zählt nicht.\n\n' +
                'In den Videos ist mehrfach vom Handout die Rede. Die Zusammenfassung ' +
                'dazu bekommst du bei deiner Studioleitung.\n\n' +
                'Alles zusammen dauert gut zwei Stunden. Du musst es nicht am Stück machen.' },
        /* 1 */
        { art: 'video', titel: '1 · Einleitung', dauer: 180,
          quelle: 'speicher:firmen/koerperformen/schulungen/neu/1790716558504-1-Einleitung.mp4',
          text: 'Authentisch bleiben, nicht für den Kunden denken, und herausfinden, was er möchte und warum.' },
        /* 2 */
        { art: 'video', titel: '2 · Terminvereinbarung: Call-in und Walk-in', dauer: 486,
          quelle: 'speicher:firmen/koerperformen/schulungen/neu/1790788418123-2-Call-In.mp4',
          text: 'Der Interessent ruft an oder kommt vorbei. Ziel: ein Termin, zeitnah, mit Alternativfrage.' },
        /* 3 */
        { art: 'video', titel: '3 · Call-out: wir rufen an', dauer: 154,
          quelle: 'speicher:firmen/koerperformen/schulungen/neu/1790716613582-3-Call-out.mp4',
          text: 'Eine Anfrage kommt über Formular, Homepage oder E-Mail. So schnell wie möglich anrufen.' },
        /* 4 */
        { art: 'video', titel: '4 · Begrüßung', dauer: 465,
          quelle: 'speicher:firmen/koerperformen/schulungen/neu/1790788426859-4-Begru-ung.mp4',
          text: 'Mit Namen begrüßen, Überblick geben, Eisbrecherfragen, ehrliches Interesse, loben.' },
        /* 5 */
        { art: 'video', titel: '5 · Bedarfsanalyse', dauer: 496,
          quelle: 'speicher:firmen/koerperformen/schulungen/neu/1790788432659-5-Bedarfsanalyse.mp4',
          text: 'Das Herzstück: nicht nur was der Kunde möchte, sondern warum. Vom rationalen zum emotionalen Ziel.' },
        /* 6 */
        { art: 'video', titel: '5.1 · Beispiel: Begrüßung und Bedarfsanalyse', dauer: 947,
          quelle: 'speicher:firmen/koerperformen/schulungen/neu/1790788439628-5.1-Beispiel-Begru-ung_Bedarfsanalyse.mp4',
          text: 'Ein ganzes Gespräch bis zum Training — achte darauf, wie aus „Rücken" ein Bild wird.' },
        /* 7 */
        { art: 'video', titel: '6 · Nach dem Training und Angebotspräsentation', dauer: 505,
          quelle: 'speicher:firmen/koerperformen/schulungen/neu/1790788451871-6-Angebotspra-sentation.mp4',
          text: 'Ziele im Training erwähnen, loben, Ziele zusammenfassen — dann sicher und selbstbewusst eine Empfehlung aussprechen.' },
        /* 8 */
        { art: 'video', titel: '6.1 · Beispiel: Angebotspräsentation', dauer: 302,
          quelle: 'speicher:firmen/koerperformen/schulungen/neu/1790716665852-6.1-Beispiel-Angebotspra-sentation.mp4',
          text: 'Zusammenfassen, zwei Varianten, eine Empfehlung — und dann selbstverständlich weiter.' },
        /* 9 */
        { art: 'video', titel: '7 · Einwandbehandlung', dauer: 717,
          quelle: 'speicher:firmen/koerperformen/schulungen/neu/1790716680623-7-Einwandbehandlung.mp4',
          text: 'Einwände vorbereiten, hinterfragen, isolieren und gemeinsam eine Lösung finden.' },
        /* 10 */
        { art: 'video', titel: '7.1 · Beispiel: Einwandbehandlung', dauer: 355,
          quelle: 'speicher:firmen/koerperformen/schulungen/neu/1790788466520-7.1-Beispiel-Einwandbehandlung.mp4',
          text: '„Ich schlaf noch eine Nacht drüber" — und was wirklich dahintersteckt.' },
        /* 11 */
        { art: 'video', titel: '8 · Weiterempfehlung', dauer: 194,
          quelle: 'speicher:firmen/koerperformen/schulungen/neu/1790716715637-8-Weiterempfehlung.mp4',
          text: 'Die einfachste und günstigste Art, neue Mitglieder zu gewinnen — passiv und aktiv.' },
        /* 12 */
        { art: 'video', titel: '9 · VIP-Einladung', dauer: 361,
          quelle: 'speicher:firmen/koerperformen/schulungen/neu/1790716726093-9-VIP-Einladung.mp4',
          text: 'Direkt nach der Anmeldung zwei Einladungen verschenken lassen — und wie man sie nachfasst.' },
        /* 13 */
        { art: 'video', titel: '9.1 · Beispiel: VIP-Einladung', dauer: 121,
          quelle: 'speicher:firmen/koerperformen/schulungen/neu/1790716733807-9.1-Beispiel-VIP-Einladung.mp4',
          text: 'So klingt es im echten Gespräch.' },
        /* 14 */
        { art: 'video', titel: '10 · Rollenspiel: das ganze Beratungsgespräch', dauer: 1757,
          quelle: 'speicher:firmen/koerperformen/schulungen/neu/1790788484103-10-Rollenspiel-Beratungsgespra-ch-komplett.mp4',
          text: 'Das ganze Gespräch am Stück, knapp 30 Minuten — von der Begrüßung bis zur VIP-Einladung. ' +
                'Vieles kennst du aus den Beispielen 5.1, 6.1, 7.1 und 9.1; neu ist das Einkleiden vor dem Training. ' +
                'Achte darauf, wie sich die Schritte aneinanderreihen.' },
        /* 15 */
        { art: 'video', titel: '11 · Kein Abschluss — was jetzt?', dauer: 164,
          quelle: 'speicher:firmen/koerperformen/schulungen/neu/1790788488979-11-Kein-Abschluss.mp4',
          text: 'Der Interessent entscheidet sich heute nicht. So wird trotzdem ein zweiter Termin daraus — und warum zwei Tage später angerufen wird.' },
        /* 16 */
        { art: 'bestaetigen', titel: 'Üben',
          text: 'Ich formuliere die Antworten auf „Was kostet das?" und auf die häufigsten ' +
                'Einwände in meinen eigenen Worten und übe sie im Team.' }
      ],
      fragen: [
        /* ── 1 Einleitung ── */
        { nach: 1, frage: 'Warum merkt ein Interessent sofort, wenn du dich verstellst oder unsicher bist?',
          antworten: [
            'Weil er vorher Bewertungen gelesen hat',
            'Weil er mehrere Studios vergleicht',
            'Weil er in der Beratung dein Spiegel ist',
            'Weil er schon einmal EMS gemacht hat'
          ], richtig: 2,
          hinweis: '„Der Interessent ist immer Spiegel des Beraters." Stress, Unsicherheit und Verstellen überträgt sich — deshalb: du selbst bleiben.' },
        { nach: 1, frage: 'Du kommst gehetzt aus drei Terminen, der nächste Interessent wartet schon. Was ist laut Einleitung richtig?',
          antworten: [
            'Begrüßen, Getränk anbieten, kurz rausgehen und durchatmen',
            'Sofort anfangen, damit er nicht noch länger wartet',
            'Den Termin an einen Kollegen abgeben, der gerade frei ist',
            'Mit dem Training anfangen und das Gespräch nachholen'
          ], richtig: 0,
          hinweis: 'Der Interessent soll eine entspannte Stunde haben. Zwei Minuten Durchatmen verhindern, dass sich dein Stress auf ihn überträgt.' },
        { nach: 1, frage: 'Welcher Gedanke vor dem Gespräch macht einen Abschluss laut Video am unwahrscheinlichsten?',
          antworten: [
            '„Der hat sich bestimmt schon gut informiert."',
            '„Hoffentlich finde ich sein Ziel heraus."',
            '„Der hat ja extra einen Termin gemacht."',
            '„Das ist bestimmt zu teuer für den."'
          ], richtig: 3,
          hinweis: 'Niemals für den Kunden denken: „wenn ihr euch denkt, das ist bestimmt zu teuer für den, dann wird das auch zu teuer für den sein."' },
        { nach: 1, frage: 'Was ist im Beratungsgespräch laut Einleitung die eigentliche Aufgabe?',
          antworten: [
            'Herausfinden, was der Kunde möchte',
            'Herausfinden, was er möchte — und warum',
            'Das Training so gut wie möglich erklären',
            'Die passende Laufzeit für ihn festlegen'
          ], richtig: 1,
          hinweis: 'Das „Was" reicht nicht. Um das „Warum" geht es in allen folgenden Videos.' },

        /* ── 2 Call-in / Walk-in ── */
        { nach: 2, frage: 'Welchen Wert hat laut Video ein neues Abo im Schnitt — ohne Empfehlungen und Verlängerungen?',
          antworten: [
            'Etwa 2.500 Euro',
            'Etwa 500 Euro',
            'Etwa 1.200 Euro',
            'Etwa 5.000 Euro'
          ], richtig: 0,
          hinweis: '„Wenn jemand anruft, dann rufen da potenziell mindestens 2.500 Euro an." Deshalb ist schon der erste Anruf so wichtig.' },
        { nach: 2, frage: 'Ein Anrufer fragt als Erstes: „Was kostet das?" Was steckt laut Video in über 80 % der Fälle dahinter?',
          antworten: [
            'Er will Preise mit anderen Studios vergleichen',
            'Er prüft, ob er es sich leisten kann',
            'Er weiß nicht, was er sonst fragen soll',
            'Er hat ein günstigeres Angebot gesehen'
          ], richtig: 2,
          hinweis: 'Die meisten waren noch nie in einem EMS-Studio. Eigentlich möchten sie eingeladen werden.' },
        { nach: 2, frage: 'Wie antwortest du am besten auf die erste Frage „Was kostet das?"',
          antworten: [
            'Den günstigsten Wochenbetrag nennen und dann einladen',
            'Fragen, ob er schon EMS gemacht hat, und kostenlos einladen',
            'Freundlich erklären, dass es am Telefon keine Preise gibt',
            'Alle Laufzeiten kurz erklären, dann nach dem Ziel fragen'
          ], richtig: 1,
          hinweis: 'Erst einladen. Fragt er ein zweites Mal nach, ehrlich: „die meisten entscheiden sich für …" — und zurück zum Termin.' },
        { nach: 2, frage: 'Der Anrufer fragt zum zweiten Mal nach dem Preis. Was gilt laut Video?',
          antworten: [
            'Noch einmal ausweichen, spätestens beim dritten Mal nennen',
            'Alle Varianten mit Preisen aufzählen',
            'Auf die Homepage verweisen, dort steht alles',
            'Offen die Variante nennen, die die meisten wählen, dann Termin'
          ], richtig: 3,
          hinweis: '„Man braucht der Frage nicht drei, vier Mal ausweichen." Interessenten wissen, dass es mehr kostet als ein Fitnessstudio.' },
        { nach: 2, frage: 'Warum sollen Termine möglichst zeitnah vereinbart werden?',
          antworten: [
            'Damit der Kalender über die Woche gleichmäßig gefüllt ist',
            'Weil sonst ein anderer Trainer den Termin übernimmt',
            'Damit der Interessent keine Zeit hat, Preise zu vergleichen',
            'Weil die Lust jetzt da ist — in zwei Wochen kommen viele nicht'
          ], richtig: 3,
          hinweis: '„Wenn ihr die für in zwei Wochen terminiert, dann wird die Wahrscheinlichkeit, dass sie kommen, sehr gering."' },
        { nach: 2, frage: 'Was gehört laut Video einen Tag vor dem vereinbarten Termin dazu?',
          antworten: [
            'Eine E-Mail mit Preisliste und Anfahrtsbeschreibung schicken',
            'Anrufen und bestätigen: Anfahrt, trinken, Handtuch, Sportschuhe',
            'Nichts — ein Bestätigungsanruf wirkt unsicher und aufdringlich',
            'Den Termin an einen erfahrenen Kollegen übergeben, der Zeit hat'
          ], richtig: 1,
          hinweis: 'Den Termin bestätigen gehört zum Service. Wer nicht erreichbar ist, bekommt eine SMS vom Studio-Handy.' },

        /* ── 3 Call-out ── */
        { nach: 3, frage: 'Über ein Online-Formular kommt eine Anfrage rein. Was ist die richtige Reihenfolge, wenn du ihn nicht erreichst?',
          antworten: [
            'Anrufen — E-Mail — am nächsten Tag noch einmal anrufen',
            'E-Mail — zwei Tage warten — dann anrufen',
            'Anrufen — SMS — nach einer Woche noch einmal anrufen',
            'E-Mail — anrufen — Anfrage nach drei Tagen schließen'
          ], richtig: 0,
          hinweis: 'So schnell wie möglich anrufen. Nicht erreicht: E-Mail, und am nächsten Tag noch einmal anrufen.' },
        { nach: 3, frage: 'Warum gewinnt beim Call-out oft das Studio, das sich zuerst meldet?',
          antworten: [
            'Weil es professioneller wirkt als die anderen',
            'Weil die Werbung dann noch frisch im Kopf ist',
            'Weil viele zwei, drei Studios gleichzeitig anschreiben',
            'Weil der Interessent dann noch keinen Preis kennt'
          ], richtig: 2,
          hinweis: '„Die, die sich als erstes melden und als erstes einen Termin haben, sind die Gewinner."' },
        { nach: 3, frage: 'Womit erhöhst du bei einer Online-Aktion laut Video die Erscheinungsquote?',
          antworten: [
            'Mit einem Rabatt für den ersten Monat',
            'Mit einer Erinnerung eine Stunde vor dem Termin',
            'Indem du auf sein Ziel eingehst und neugierig machst',
            'Indem du den Termin möglichst weit hinaus legst'
          ], richtig: 2,
          hinweis: 'Z. B. beim Rücken-Programm: nach den Beschwerden fragen, kurz sagen, warum EMS passt — dann mit Alternativfrage einladen.' },

        /* ── 4 Begrüßung ── */
        { nach: 4, frage: 'Was nennt das Video den „ersten Herzensöffner"?',
          antworten: [
            'Den Interessenten mit Namen begrüßen',
            'Ein Getränk anbieten',
            'Ihn für den ersten Schritt loben',
            'Mit Vornamen vorstellen'
          ], richtig: 0,
          hinweis: 'Den Namen vorher im Terminplaner nachsehen — nicht erst, wenn die Tür aufgeht.' },
        { nach: 4, frage: 'Woraus bildet sich das „magische Viereck"?',
          antworten: [
            'Aus Blickkontakt, Händedruck, Name und Lächeln',
            'Aus Begrüßung, Überblick, Eisbrecher und Lob',
            'Aus Stimme, Haltung, Kleidung und Lächeln',
            'Aus Mundwinkeln und Schultern'
          ], richtig: 3,
          hinweis: 'Je größer das Viereck aus Mundwinkeln und Schultern, desto positiver die Ausstrahlung.' },
        { nach: 4, frage: 'Welcher Satz gehört laut Video in den Überblick zu Beginn — und warum?',
          antworten: [
            '„Wir fangen gleich mit dem Training an" — damit keine Zeit verloren geht',
            '„Erst Ziele, dann Training, dann wie du mitmachen kannst" — gegen Unsicherheit',
            '„Am Ende zeige ich Ihnen unsere Preise" — damit er vorbereitet ist',
            '„Das Ganze dauert etwa 20 Minuten" — damit er seinen Tag planen kann'
          ], richtig: 1,
          hinweis: 'Viele waren noch nie in einem Studio und sind unsicher. Wer weiß, was passiert, entspannt sich. Dazu fragen, ob man Notizen machen darf.' },
        { nach: 4, frage: 'Wozu sind die Eisbrecherfragen außer zum Warmwerden noch gut?',
          antworten: [
            'Sie liefern Infos, die später bei Einwänden helfen',
            'Sie zeigen, ob er sich die Mitgliedschaft leisten kann',
            'Sie ersetzen die Bedarfsanalyse bei eiligen Terminen',
            'Sie sind nur fürs Gefühl, danach nicht mehr wichtig'
          ], richtig: 0,
          hinweis: 'Wer sagt, das Fitnessstudio war nichts für ihn, hat dir ein Argument für später gegeben.' },
        { nach: 4, frage: 'Du oder Sie — was empfiehlt der Trainer?',
          antworten: [
            'Immer Du — beim Sport duzt man sich, das lockert auf',
            'Immer Sie, bis der Interessent von sich aus das Du anbietet',
            'Mit Vornamen vorstellen und darauf achten, was ihm lieber ist',
            'Du bei Jüngeren, Sie bei Älteren — das passt fast immer'
          ], richtig: 2,
          hinweis: 'Viele bieten dann selbst das Du an. Wer gesiezt werden möchte, wird gesiezt.' },
        { nach: 4, frage: 'Was ist laut Video besser, wenn du im Gespräch eine Frage vergessen hast?',
          antworten: [
            'Den Fragebogen noch einmal von vorn durchgehen, sicher ist sicher',
            'Sie einfach vergessen — lieber ehrliches Interesse als Roboter',
            'Das Gespräch kurz unterbrechen und im Leitfaden nachsehen',
            'Sie auf jeden Fall am Ende des Trainings noch nachholen'
          ], richtig: 1,
          hinweis: '„Lieber man vergisst mal eine Frage, als wenn man die ganze Zeit überlegen muss." Unsicherheit spiegelt sich.' },

        /* ── 5 Bedarfsanalyse ── */
        { nach: 5, frage: 'Welche Aussage über Kaufentscheidungen macht das Video?',
          antworten: [
            'Sie sind etwa zur Hälfte emotional, zur Hälfte rational',
            'Sie sind vor allem eine Frage des Preises',
            'Sie sind rational, das Gefühl kommt erst danach',
            'Heute geht man zum Teil von 100 % emotional aus'
          ], richtig: 3,
          hinweis: 'Früher ging man von 80 % emotional aus, heute zum Teil von 100 % — rational wird im Nachhinein erklärt.' },
        { nach: 5, frage: 'Woran erkennst du, dass ein Ziel emotional ist?',
          antworten: [
            'Der Kunde nennt eine genaue Zahl',
            'Der Kunde wird dabei laut',
            'Es hat mit Aussehen zu tun',
            'Man kann es sich als Bild vorstellen'
          ], richtig: 3,
          hinweis: '„5 Kilo abnehmen" ist keins. „5 Kilo abnehmen, um im Urlaub im Lieblingsbikini am Strand zu liegen" schon.' },
        { nach: 5, frage: 'Was ist das „dominante Kaufmotiv"?',
          antworten: [
            'Der Preis, den er höchstens zahlen will',
            'Der Hauptgrund, warum er jetzt hier sitzt',
            'Das Ziel, das am schnellsten erreichbar ist',
            'Die Laufzeit, die ihn am meisten anspricht'
          ], richtig: 1,
          hinweis: 'Er sitzt nicht da, weil er Rückenschmerzen hat, sondern für das, was er ohne sie tun könnte.' },
        { nach: 5, frage: 'Welche Reihe entspricht dem Leitfaden „Vergangenheit — Gegenwart — Zukunft"?',
          antworten: [
            '„Wie lange schon?" — „Wann merken Sie es?" — „Was wäre anders, wenn …?"',
            '„Waren Sie im Fitnessstudio?" — „Was trainieren Sie?" — „Was planen Sie?"',
            '„Was hat Sie hergeführt?" — „Was kostet es?" — „Wann starten Sie?"',
            '„Wie alt sind Sie?" — „Wie fit sind Sie?" — „Wie fit wollen Sie sein?"'
          ], richtig: 0,
          hinweis: 'Die Zukunft ist immer das emotionale Ziel.' },
        { nach: 5, frage: 'Was ist ein „Weg-von-Motiv"?',
          antworten: [
            'Der Wunsch, vom alten Fitnessstudio wegzukommen',
            'Ein Ziel, das er aufgeben möchte',
            'Was passiert, wenn er NICHT startet — z. B. eine OP',
            'Der Grund, warum er früher aufgehört hat'
          ], richtig: 2,
          hinweis: 'Hin-zu- und Weg-von-Motive verstärken. „Was wäre mit Ihrem Rücken, wenn Sie nicht starten?"' },
        { nach: 5, frage: 'Welche Frage gehört zur Einwandvorbehandlung?',
          antworten: [
            '„Welche Laufzeit stellen Sie sich denn so vor?"',
            '„Was haben Sie bisher im Fitnessstudio gezahlt?"',
            '„Wie lange überlegen Sie schon, etwas zu tun?"',
            '„Wann könnten Sie denn zum Training wiederkommen?"'
          ], richtig: 2,
          hinweis: 'Sagt er später „muss noch überlegen", kannst du darauf zurückkommen. Ebenso: „Gibt es jemanden, der Sie unterstützt?"' },
        { nach: 5, frage: 'In welcher Reihenfolge geht es am Ende der Bedarfsanalyse weiter?',
          antworten: [
            'Kontraindikationen mit Unterschrift — Ziele zusammenfassen — Training',
            'Training — Ziele zusammenfassen — Kontraindikationen unterschreiben',
            'Angebot zeigen — Kontraindikationen besprechen — Training',
            'Ziele zusammenfassen — Training — Kontraindikationen unterschreiben'
          ], richtig: 0,
          hinweis: 'Kein Training ohne Unterschrift zu den gesundheitlichen Einschränkungen. Vor dem Training die Ziele zusammenfassen: „damit ich nichts vergessen habe".' },

        /* ── 5.1 Beispiel ── */
        { nach: 6, frage: 'Nathalie sagt, im Fitnessstudio habe ihr die Anleitung gefehlt. Was macht der Berater daraus?',
          antworten: [
            'Er erklärt, wie gut die Geräte bei uns sind',
            'Er fragt nach, welches Studio das war und warum',
            'Er empfiehlt ihr einen festen Trainingsplan für zu Hause',
            '„Dir ist wichtig, dass jemand an deiner Seite ist"'
          ], richtig: 3,
          hinweis: 'Zuhören, zusammenfassen, zurückspiegeln — daraus wird später das Argument „immer ein Personal Training".' },
        { nach: 6, frage: 'Welches Bild steht bei Nathalie am Ende hinter „weniger Rückenschmerzen"?',
          antworten: [
            'Wieder im Fitnessstudio mithalten und mehr Sport machen können',
            'Freunden nicht absagen, bessere Laune, die Mutter heben können',
            'Weniger Kopfschmerztabletten nehmen und besser schlafen können',
            'Morgens ohne Schmerzen aufstehen und fit in den Tag starten'
          ], richtig: 1,
          hinweis: 'Aus „Rücken" werden konkrete Situationen — das ist das emotionale Ziel.' },
        { nach: 6, frage: 'Welche Punkte nennt der Berater, bei denen man nur nach Rücksprache mit dem Arzt trainiert?',
          antworten: [
            'Herzschrittmacher, akute Tumorerkrankung, Epilepsie, Schwangerschaft',
            'Knieprobleme, Migräne, hoher Blutdruck, Diabetes Typ 2',
            'Bandscheibenvorfall, Schwangerschaft, Asthma, Bluthochdruck',
            'Herzschrittmacher, Migräne, frühere Knieprobleme, Übergewicht'
          ], richtig: 0,
          hinweis: 'Blutdruck und Diabetes fragt er zusätzlich „zur Trainingsgestaltung". Die vollständige Liste liegt im Studio und wird abgezeichnet.' },

        /* ── 6 Angebotspräsentation ── */
        { nach: 7, frage: 'Warum sagst du im Training bei einer Übung dazu, wofür sie ist?',
          antworten: [
            'Damit er die Übung sauber und richtig ausführt',
            'Damit das Training professioneller und ruhiger wirkt',
            'Weil er es sonst nicht mit seinem Ziel verbindet',
            'Weil er die Muskeln sonst gar nicht richtig spürt'
          ], richtig: 2,
          hinweis: 'Nur weil DU weißt, dass die Übung für Schulter und Nacken ist, weiß es der Kunde noch lange nicht.' },
        { nach: 7, frage: 'Wie sprichst du nach dem Training über die Chipkarte?',
          antworten: [
            '„Wenn du dich anmeldest, bekommst du auch eine Chipkarte."',
            '„Deine Werte sind gespeichert — nächstes Mal geht es direkt los."',
            '„Die Chipkarte zeige ich dir, wenn du Mitglied bist."',
            '„Die Chipkarte kostet einmalig eine kleine Gebühr."'
          ], richtig: 1,
          hinweis: 'Wir reden so, als wäre er schon Mitglied. Das ist der Übergang zur Angebotspräsentation.' },
        { nach: 7, frage: 'Der Interessent kann sich nicht zwischen Laufzeiten entscheiden. Was sagt das Video dazu?',
          antworten: [
            'Alle Laufzeiten gleichwertig vorstellen und ihn wählen lassen',
            'Mit der kürzesten beginnen, damit er sich traut',
            'Ihm die Unterlagen für zu Hause mitgeben',
            'Immer eine Variante empfehlen — sonst schläft er drüber'
          ], richtig: 3,
          hinweis: 'Ohne Empfehlung heißt es: „Muss ich noch eine Nacht drüber schlafen." Entscheidet er sich anders: ankreuzen — auch gut.' },
        { nach: 7, frage: 'Welche Formulierung empfiehlt das Handout-Beispiel im Video?',
          antworten: [
            '„Der Vertrag über 24 Monate kostet dich 25 Euro die Woche."',
            '„Der Beitrag liegt bei 24 Monaten bei 25 Euro die Woche."',
            '„Die Kosten für dein Training sind nur 25 Euro die Woche."',
            '„Du investierst nur 25 Euro die Woche in deine Gesundheit."'
          ], richtig: 3,
          hinweis: 'Mitgliedschaft statt Vertrag, Investition statt Kosten oder Beitrag, Bestätigung statt Unterschrift.' },
        { nach: 7, frage: 'Was ist laut Video ein Hauptgrund, warum sich jemand nicht anmeldet?',
          antworten: [
            'Die Laufzeit ist ihm zu lang',
            'Das emotionale Ziel wurde nicht gefunden',
            'Die einmaligen Gebühren sind zu hoch',
            'Das Training war zu anstrengend'
          ], richtig: 1,
          hinweis: 'Wurden die Emotionen nicht geweckt, heißt es hinterher „zu teuer".' },
        { nach: 7, frage: 'Wie präsentierst du die Mitgliedschaften laut Video — und warum?',
          antworten: [
            'Sicher und selbstbewusst — Zweifel überträgt sich auf ihn',
            'Zurückhaltend und leise, damit er sich nicht gedrängt fühlt',
            'Möglichst schnell, damit die Zahlen nicht lange abschrecken',
            'Schriftlich zum Mitnehmen, damit er alles in Ruhe lesen kann'
          ], richtig: 0,
          hinweis: 'Günstiger als ein Personal Training für rund 25 Euro die Woche geht es kaum. Kein Grund, sich zu verstecken.' },

        /* ── 6.1 Beispiel ── */
        { nach: 8, frage: 'Womit begründet der Berater im Beispiel die 24 Monate?',
          antworten: [
            'Dass 24 Monate die beliebteste Laufzeit sind',
            'Dass es die 24 Monate gerade im Angebot günstiger gibt',
            'Mit ihren eigenen Worten: Ziel erreichen UND halten',
            'Dass ein Jahr für ihr Ziel auf jeden Fall zu kurz ist'
          ], richtig: 2,
          hinweis: 'Die Frage aus der Bedarfsanalyse („möchtest du es dann auch halten?") zahlt sich hier aus.' },
        { nach: 8, frage: 'Nathalie hat sich für 24 Monate entschieden. Was tut der Berater als Nächstes?',
          antworten: [
            'Er fragt noch einmal, ob sie sich wirklich sicher ist',
            'Er gibt ihr die Unterlagen zum Durchlesen mit nach Hause',
            'Er macht selbstverständlich weiter: Outfit, Gebühren, Bank',
            'Er bietet ihr zur Sicherheit doch lieber 12 Monate an'
          ], richtig: 2,
          hinweis: 'Je selbstverständlicher man es erklärt, desto selbstverständlicher ist es für den Kunden.' },

        /* ── 7 Einwandbehandlung ── */
        { nach: 9, frage: 'Ein begeisterter Interessent will „nächste Woche anrufen und dann festmachen". Wie viele kommen laut Video wieder?',
          antworten: [
            'Weniger als 10 Prozent',
            'Ungefähr jeder Zweite',
            'Ungefähr jeder Dritte',
            'Etwa 25 Prozent von ihnen'
          ], richtig: 0,
          hinweis: 'Die Motivation flacht zu Hause ab — wie das Blatt Papier im Video.' },
        { nach: 9, frage: 'Welche Reihenfolge der Einwandbehandlung zeigt das Video?',
          antworten: [
            'Verständnis — hinterfragen — Lösung — isolieren — Bedingungsfrage — abschließen',
            'Hinterfragen — Verständnis — Bedingungsfrage — isolieren — Lösung — abschließen',
            'Widersprechen — erklären — Verständnis — isolieren — Rabatt — Bedingungsfrage',
            'Durchatmen/schweigen — Verständnis — hinterfragen — isolieren — Bedingungsfrage — Lösung'
          ], richtig: 3,
          hinweis: 'Sechs Schritte. Nicht sofort losschießen („stimmt doch gar nicht"), erst durchatmen und Verständnis zeigen.' },
        { nach: 9, frage: '„Wenn ich dich richtig verstehe, ist es also nur die Laufzeit?" — was ist das?',
          antworten: [
            'Die Bedingungsfrage',
            'Den Einwand isolieren',
            'Den Einwand hinterfragen',
            'Verständnis zeigen'
          ], richtig: 1,
          hinweis: 'Isolieren heißt: sicherstellen, dass es der EINZIGE Punkt ist. Danach kommt die Bedingungsfrage.' },
        { nach: 9, frage: 'Welche Frage ist die Bedingungsfrage?',
          antworten: [
            '„Wenn wir dafür eine Lösung finden — startest du dann?"',
            '„Was genau stört dich denn an der Laufzeit noch?"',
            '„Was wäre denn für dich die optimale Lösung dafür?"',
            '„Gibt es sonst noch Fragen oder Punkte, die offen sind?"'
          ], richtig: 0,
          hinweis: 'Erst die Zusage für den Fall einer Lösung — dann die Lösung anbieten oder finden lassen.' },
        { nach: 9, frage: 'Ein Interessent fürchtet einen Umzug. Welche Lösung zeigt das Video?',
          antworten: [
            '12 Monate, damit er schneller wieder raus ist',
            'Monatlich kündbar, dafür zum höheren Wochenbetrag',
            '24 Monate, Sonderkündigungsrecht beim Umzug notiert',
            'Erst nach dem Umzug anmelden, im neuen Studio vor Ort'
          ], richtig: 2,
          hinweis: 'Die günstigste Variante, und das außerordentliche Kündigungsrecht wird ausdrücklich in die Mitgliedschaft geschrieben.' },
        { nach: 9, frage: 'Du willst die einmaligen Gebühren aufteilen oder die Wäsche schenken. Was muss vorher sein?',
          antworten: [
            'Der Kunde muss bereits unterschrieben haben',
            'Es muss mit der Inhaberin / dem Inhaber abgesprochen sein',
            'Es muss als offizielle Aktion auf der Homepage stehen',
            'Der Kunde muss sich für die 24 Monate entscheiden'
          ], richtig: 1,
          hinweis: '„Muss natürlich auch mit Inhabern dementsprechend abgesprochen sein" — eine Philosophiefrage des Studios.' },
        { nach: 9, frage: '„Ich muss noch mal überlegen." Wie ordnet das Video diesen Satz ein?',
          antworten: [
            'Als klares Nein, das man respektieren sollte',
            'Als Zeichen, dass er noch woanders unterschreiben will',
            'Als Bitte um schriftliche Unterlagen für zu Hause',
            'Als Vorwand — dahinter steckt meist Preis oder Laufzeit'
          ], richtig: 3,
          hinweis: '„Du überlegst schon so lange — welche Fragen sind noch offen?" Dann kommt meist der eigentliche Einwand.' },
        { nach: 9, frage: 'Warum ist EMS laut Video teurer als ein normales Fitnessstudio — und womit vergleichst du?',
          antworten: [
            'Wegen der teuren Technik — im Vergleich mit anderen EMS-Studios',
            'Wegen der Miete in bester Lage — im Vergleich mit Physiotherapie',
            'Wegen der Wäsche — im Vergleich mit eigener Sportkleidung',
            'Immer Personal Training — mobile Trainer nehmen 80–100 € je Einheit'
          ], richtig: 3,
          hinweis: '„Wir können es nur so günstig anbieten, weil du zu uns kommst." Und: eine Investition in die Gesundheit.' },

        /* ── 7.1 Beispiel ── */
        { nach: 10, frage: 'Was steckt im Beispiel hinter Nathalies „eine Nacht drüber schlafen"?',
          antworten: [
            'Sie will es erst noch mit ihrem Partner besprechen',
            'Die einmaligen Beträge am Anfang sind ihr zu viel',
            'Die 24 Monate sind ihr am Ende doch zu lang',
            'Ihr ist der Wochenbetrag auf Dauer zu hoch'
          ], richtig: 1,
          hinweis: 'Den Wochenbetrag fand sie in Ordnung. Durch Nachfragen kommt der wahre Einwand heraus.' },
        { nach: 10, frage: 'Wie kommt im Beispiel die Lösung zustande?',
          antworten: [
            'Er fragt nach ihrer optimalen Lösung — sie schlägt es selbst vor',
            'Der Berater senkt ihr den Wochenbetrag um ein paar Euro',
            'Er schenkt ihr sofort die Wäsche im Wert von 60 Euro',
            'Er holt die Studioleitung dazu, die einen Rabatt gibt'
          ], richtig: 0,
          hinweis: 'Lösung finden lassen: Was der Kunde selbst vorschlägt, trägt er auch mit. Am Ende: auf drei Monate aufgeteilt.' },

        /* ── 8 Weiterempfehlung ── */
        { nach: 11, frage: 'Was kostet ein neues Mitglied laut Video über klassische Werbung im Schnitt?',
          antworten: [
            '50 bis 80 Euro',
            '300 bis 400 Euro',
            '150 bis 200 Euro',
            'Über 500 Euro'
          ], richtig: 2,
          hinweis: 'Werbebudget geteilt durch Neumitglieder: 150 bis 200 Euro. Eine Empfehlung kostet nichts.' },
        { nach: 11, frage: 'Was ist die Voraussetzung für eine PASSIVE Weiterempfehlung?',
          antworten: [
            'Ein zufriedenes Mitglied',
            'Eine Prämie für den Empfehler',
            'Ein begeistertes Mitglied',
            'Ein Mitglied mit langer Laufzeit'
          ], richtig: 2,
          hinweis: 'Zufrieden reicht nicht. Begeistert ist, wessen Erwartungen übertroffen wurden — z. B. durch „Magic Moments".' },
        { nach: 11, frage: 'Wer ist laut Video der „König der Empfehler"?',
          antworten: [
            'Der gerade neu gewonnene Kunde',
            'Das langjährigste Mitglied',
            'Wer die meisten Freunde im Studio hat',
            'Wer schon einmal jemanden mitgebracht hat'
          ], richtig: 0,
          hinweis: 'Deshalb gehört die aktive Weiterempfehlung direkt ins Beratungsgespräch.' },

        /* ── 9 VIP-Einladung ── */
        { nach: 12, frage: 'Wie viele VIP-Einladungen bekommt ein Neumitglied, und was sind sie wert?',
          antworten: [
            'Eine Einladung im Wert von 100 Euro',
            'Drei Einladungen, je 25 Euro',
            'Zwei Einladungen, je 100 Euro',
            'Zwei Einladungen, je 50 Euro'
          ], richtig: 3,
          hinweis: '„Zwei hochwertige VIP-Einladungen im Wert von 100 Euro" — jede entspricht 50 Euro.' },
        { nach: 12, frage: 'Was bekommt das Neumitglied, wenn sich der Eingeladene anmeldet?',
          antworten: [
            'Einen Monat gratis',
            '50 Euro gutgeschrieben',
            'Eine zweite Wäsche gratis',
            'Nichts — die Einladung ist das Geschenk'
          ], richtig: 1,
          hinweis: '„Damit das nicht unfair dir gegenüber ist … bekommst auch du 50 Euro gutgeschrieben."' },
        { nach: 12, frage: 'Das Neumitglied möchte die Nummer des Kollegen nicht einfach herausgeben. Was tust du?',
          antworten: [
            'Namen notieren, reservieren — in zwei Tagen rufst du eh an',
            'Die Einladung mitgeben, damit er sie dem Kollegen gibt',
            'Die Einladung lieber gleich für jemand anderen verwenden',
            'Den Kollegen selbst über die Firma ausfindig machen'
          ], richtig: 0,
          hinweis: 'Und: Wir rufen niemanden an, ohne dass das Mitglied vorher Bescheid gesagt hat.' },
        { nach: 12, frage: 'Welches Wort sollst du am Telefon mit der eingeladenen Person NICHT benutzen?',
          antworten: [
            '„VIP-Einladung"',
            '„Personal Training"',
            '„Probetraining"',
            '„Beratung"'
          ], richtig: 2,
          hinweis: 'Sie hat eine hochwertige VIP-Einladung von jemandem bekommen, der an sie gedacht hat — kein „Probetraining".' },
        { nach: 12, frage: 'Wie oft spricht laut Video ein Neumitglied eine Empfehlung aus, wenn man fragt?',
          antworten: [
            'Etwa jeder Zehnte',
            'Etwa jeder Zweite',
            'Etwa jeder Fünfte',
            'Fast jeder'
          ], richtig: 1,
          hinweis: 'Der größte Fehler ist, gar nicht zu fragen — weil man froh ist, dass unterschrieben wurde.' },
        { nach: 12, frage: '„Mir fällt gerade niemand ein." Was machst du?',
          antworten: [
            'Die Einladungen gleich verfallen lassen, um nicht zu drängen',
            'Sie ihm mitgeben, damit er sie später verteilen kann',
            'Freundlich weiter nachfragen, bis doch ein Name kommt',
            'Bis zum nächsten Training liegen lassen, dann nachfragen'
          ], richtig: 3,
          hinweis: '„Man muss es einfach erlebt haben" — nach dem Erzählen fällt oft jemandem jemand ein.' },

        /* ── 9.1 Beispiel ── */
        { nach: 13, frage: 'Wann bringt der Berater im Beispiel die VIP-Einladungen ins Spiel?',
          antworten: [
            'Schon bei der Begrüßung, um Stimmung zu machen',
            'Beim dritten Training, wenn sie sich eingelebt hat',
            'Zwei Tage später beim Anruf nach dem Training',
            'Nach der Anmeldung, bevor der nächste Termin gebucht wird'
          ], richtig: 3,
          hinweis: 'Als „kleine Überraschung" — genau dann, wenn die Begeisterung am größten ist.' },

        /* ── 10 Rollenspiel ── */
        { nach: 14, frage: 'Nathalie fragt, ob sie die Unterwäsche anlassen darf. Was sagt der Berater?',
          antworten: [
            'Nein, sonst funktioniert das Training mit Strom gar nicht',
            'Stoff leitet etwas schlechter — wenn sie sich wohler fühlt: ja',
            'Ja, das macht für das Training überhaupt keinen Unterschied',
            'Das entscheidet der Trainer später je nach Übung und Gerät'
          ], richtig: 1,
          hinweis: '„Mir ist wichtig, dass du dich wohlfühlst." Ehrlich erklären, dann entscheiden lassen.' },
        { nach: 14, frage: 'Wie oft fasst der Berater im Rollenspiel Nathalies Ziele zusammen, bevor sie unterschreibt?',
          antworten: [
            'Zweimal: vor dem Training und vor dem Angebot',
            'Einmal, ganz am Ende vor der Unterschrift',
            'Gar nicht — er fragt die Ziele nur einmal ab',
            'Nach jeder Übung einmal kurz im Training'
          ], richtig: 0,
          hinweis: 'Vor dem Training („damit wir nichts vergessen") und vor den Zahlen — die Emotion noch einmal wecken.' },

        /* ── 11 Kein Abschluss ── */
        { nach: 15, frage: 'Der Interessent will sich heute nicht entscheiden. Welcher Satz führt am ehesten zum zweiten Termin?',
          antworten: [
            '„Wir können ja schon mal nach einem Termin schauen."',
            '„Melde dich einfach bei uns, wenn du so weit bist."',
            '„Lass uns nächste Woche noch mal richtig trainieren."',
            '„Ich rufe dich in ein paar Tagen noch einmal an."'
          ], richtig: 2,
          hinweis: 'Auf „schauen wir mal nach einem Termin" kommt meist „muss erst in meinen Kalender gucken".' },
        { nach: 15, frage: 'Wen rufst du zwei Tage nach dem ersten Training an?',
          antworten: [
            'Nur die Interessenten, die noch überlegen',
            'Nur die neuen Mitglieder, zur Begrüßung',
            'Beide — neue Mitglieder und die, die noch überlegen',
            'Nur die, die nicht zum Folgetermin kamen'
          ], richtig: 2,
          hinweis: 'Manche kennen keinen Muskelkater und wundern sich. Der Anruf gehört zum Service und sichert den nächsten Termin.' },

        /* ── Zum Schluss: über mehrere Videos ── */
        { frage: 'Am Ende sagt ein Interessent: „Ich muss noch mit meinem Partner sprechen." Welche Frage aus der Bedarfsanalyse hilft jetzt?',
          antworten: [
            '„Gibt es jemanden, der Sie bei Ihrem Vorhaben unterstützt?"',
            '„Wie sind Sie auf uns aufmerksam geworden?"',
            '„Haben Sie schon einmal EMS gemacht?"',
            '„Wenn Sie Ihr Ziel erreichen — möchten Sie es halten?"'
          ], richtig: 0,
          hinweis: 'Einwandvorbehandlung: Hat er gesagt, sein Partner steht hinter ihm, kannst du darauf zurückkommen.' },
        { frage: 'Welche Reihenfolge hat das ganze Beratungsgespräch?',
          antworten: [
            'Begrüßung — Training — Bedarfsanalyse — Angebot — Empfehlung',
            'Bedarfsanalyse — Begrüßung — Angebot — Training — Empfehlung',
            'Begrüßung — Bedarfsanalyse — Angebot — Training — Empfehlung',
            'Begrüßung — Bedarfsanalyse — Training — Angebot — Empfehlung'
          ], richtig: 3,
          hinweis: 'Das sagt der Berater schon im Überblick: erst Ziele, dann Training, danach wie man mitmachen kann — und die Empfehlung ganz am Schluss.' },
        { frage: 'Welche Technik taucht bei der Terminvereinbarung UND bei der Laufzeit auf?',
          antworten: [
            'Die Bedingungsfrage',
            'Die Alternativfrage',
            'Das Schweigen',
            'Die Einwandvorbehandlung'
          ], richtig: 1,
          hinweis: '„Eher vormittags oder abends?" — „eher 12 oder 24 Monate?" Zwei Möglichkeiten statt einer offenen Frage.' },
        { frage: 'In der Bedarfsanalyse hast du erfahren, dass der Arzt eine Bandscheiben-OP in Aussicht gestellt hat. Beim Angebot sagt er „zu teuer". Wie nutzt du das?',
          antworten: [
            'Verständnis zeigen, dann das Weg-von-Motiv ansprechen',
            'Gar nicht — Gesundheit ist zu privat für den Verkauf',
            'Ihm sagen, dass er sonst sicher operiert wird',
            'Einen Rabatt anbieten, weil es medizinisch ist'
          ], richtig: 0,
          hinweis: 'Ehrlich bleiben — keine Versprechen, keine Angst. Aber: „Was ist mit deinem Rücken, wenn du nicht startest?"' },
        { frage: 'Warum lohnt es sich, einen Einwand zu den einmaligen Gebühren zu lösen, statt den Interessenten ziehen zu lassen?',
          antworten: [
            'Weil die Gebühren ohnehin verhandelbar sind',
            'Weil er sonst eine schlechte Bewertung schreibt',
            'Weil ein Abo im Schnitt rund 2.500 Euro wert ist',
            'Weil sonst die Monatszahlen nicht stimmen'
          ], richtig: 2,
          hinweis: 'Aus Video 2 und 7: rund 2.500 Euro, dazu Empfehlungen und Verlängerungen. Immer abgesprochen mit der Inhaberin / dem Inhaber.' },
        { frage: 'Welcher dieser Sätze widerspricht dem, was die Videos lehren?',
          antworten: [
            '„Kann ich mir vorstellen, dass sich das erst mal viel anhört."',
            '„Das ist bestimmt nichts für dich, oder?"',
            '„Günstiger als ein Personal Training für rund 25 € die Woche geht es kaum."',
            '„Deine Werte sind gespeichert, nächstes Mal geht es direkt los."'
          ], richtig: 1,
          hinweis: 'Niemals für den Kunden denken — und nichts in den Mund legen. Die anderen drei stehen so in den Videos.' }
      ]
    }
  ]
};
