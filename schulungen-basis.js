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
      strenge: 'alles',
      schritte: [
        /* 0 */
        { art: 'text', titel: 'Worum es geht',
          text: 'Diese Schulung zeigt Schritt für Schritt, wie aus einem Interessenten ein ' +
                'Mitglied wird, das lange und zufrieden bleibt: vom ersten Anruf über das ' +
                'Beratungsgespräch bis zur Weiterempfehlung.\n\n' +
                'Die Videos bauen aufeinander auf. Nach den meisten kommen ein paar Fragen dazu, ' +
                'am Ende noch einige, die mehrere Videos verbinden. Falsch beantwortet heißt: ' +
                'Hinweis lesen, noch einmal versuchen.\n\n' +
                'In den Videos ist mehrfach vom Handout die Rede, mit Musterantworten und ' +
                'Mustertelefonat. Frag deine Studioleitung danach.\n\n' +
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
        { nach: 1, frage: 'Warum ist es so wichtig, in der Beratung man selbst zu bleiben?',
          antworten: [
            'Weil ein lockeres Gespräch kürzer dauert',
            'Weil es im Handout so steht',
            'Weil der Interessent der Spiegel des Beraters ist — wer sich verstellt, gestresst oder unsicher ist, den durchschaut er',
            'Weil Interessenten lieber mit Kollegen sprechen, die sie schon kennen'
          ], richtig: 2,
          hinweis: 'Im Video: „der Interessent ist immer Spiegel des Beraters". Verstellen, Stress und Unsicherheit merkt er sofort.' },
        { nach: 1, frage: 'Du hattest drei Termine hintereinander und merkst, dass du gestresst bist. Der nächste Interessent ist da. Was tust du?',
          antworten: [
            'Ihn begrüßen, Platz nehmen lassen, ein Getränk anbieten — kurz rausgehen, durchatmen, dann entspannt anfangen',
            'Gleich loslegen, damit er nicht warten muss',
            'Den Termin verschieben',
            'Schnell einen Kollegen schicken'
          ], richtig: 0,
          hinweis: 'Der Interessent soll eine entspannte, gute Stunde haben. Zwei Minuten Durchatmen sind besser als ein gestresster Start.' },
        { nach: 1, frage: 'Ein Interessent wirkt auf dich so, als könne er sich das nicht leisten. Was gilt?',
          antworten: [
            'Dann gleich die günstigste Variante anbieten',
            'Das Gespräch kürzer halten',
            'Den Preis erst gar nicht nennen',
            'Niemals für den Kunden denken — das Gespräch genauso führen wie mit jedem anderen'
          ], richtig: 3,
          hinweis: '„Wenn ihr euch denkt, das ist bestimmt zu teuer für den, dann wird das auch zu teuer für den sein."' },
        { nach: 1, frage: 'Was ist die eigentliche Aufgabe im Beratungsgespräch?',
          antworten: [
            'Möglichst schnell den Preis nennen',
            'Herausfinden, was der Kunde möchte — und vor allem warum',
            'Das Studio und die Geräte zeigen',
            'Die Vorteile von EMS vollständig erklären'
          ], richtig: 1,
          hinweis: 'Das Interesse ist schon da: er hat sich informiert, angerufen, einen Termin gemacht und ist hergefahren. Jetzt geht es um das Warum.' },

        /* ── 2 Call-in / Walk-in ── */
        { nach: 2, frage: 'Ein Interessent ruft an und fragt als Erstes: „Was kostet das?" Was steckt meistens dahinter?',
          antworten: [
            'Er weiß schlicht nicht, was er sonst fragen soll — und möchte eigentlich eingeladen werden',
            'Er will Preise vergleichen',
            'Er will wissen, ob er es sich leisten kann',
            'Er hat schon woanders unterschrieben'
          ], richtig: 0,
          hinweis: 'In über 80 % der Fälle. Die meisten waren noch nie in einem EMS-Studio und wissen nicht, was sie fragen sollen.' },
        { nach: 2, frage: 'Wie reagierst du auf „Was kostet das?" am Telefon?',
          antworten: [
            'Alle Preise und Laufzeiten vorlesen',
            'Sagen, dass man am Telefon keine Preise nennt',
            'Fragen, ob er schon mal EMS gemacht hat, und ihn zu einem kostenlosen, unverbindlichen Beratungsgespräch einladen',
            'Auf die Homepage verweisen'
          ], richtig: 2,
          hinweis: 'Einladen statt Preisliste. Fragt er ein zweites Mal nach, ehrlich antworten: „die meisten entscheiden sich für …" — und wieder zum Termin.' },
        { nach: 2, frage: 'Wie schlägst du den Termin vor?',
          antworten: [
            '„Wann hätten Sie denn mal Zeit?"',
            'Mit einer Alternativfrage: „Passt es Ihnen eher vormittags oder abends?" — dann zwei konkrete Zeiten',
            '„Rufen Sie einfach an, wenn es passt."',
            'Mit dem nächsten freien Termin in zwei Wochen'
          ], richtig: 1,
          hinweis: 'Immer eine Alternativfrage — und zeitnah. Ein Termin in zwei Wochen wird selten wahrgenommen.' },
        { nach: 2, frage: 'Jemand fragt: „Was ist das mit dem Strom genau?" Wie antwortest du?',
          antworten: [
            'Mit einem ausführlichen Fachvortrag über Reizstrom',
            'Dass das schwer zu erklären ist',
            'Mit dem Hinweis auf Studien',
            'Kurz und knapp: die ganze Muskulatur gleichzeitig, nur 20 Minuten, individuell auf die Ziele — und dann die Einladung'
          ], richtig: 3,
          hinweis: 'Kein Fachvortrag. Kurz erklären, dann einladen: „Wir nehmen uns eine Stunde Zeit, dann lernen Sie es live kennen."' },
        { nach: 2, frage: 'Was gehört zum Service, wenn der Termin ein paar Tage in der Zukunft liegt?',
          antworten: [
            'Nichts, er hat ja zugesagt',
            'Eine Rechnung schicken',
            'Am Tag vorher anrufen und den Termin bestätigen: Anfahrt, vorher etwas trinken, Handtuch und Sportschuhe',
            'Einen Flyer per Post senden'
          ], richtig: 2,
          hinweis: 'Den Termin einen Tag vorher bestätigen. Wer nicht erreichbar ist, bekommt eine SMS vom Studio-Handy.' },

        /* ── 3 Call-out ── */
        { nach: 3, frage: 'Über die Homepage kommt eine Anfrage für ein Probetraining. Wann meldest du dich?',
          antworten: [
            'Sobald du sie siehst — am besten direkt anrufen',
            'Innerhalb der nächsten Woche',
            'Wenn gerade wenig los ist',
            'Erst, wenn er sich ein zweites Mal meldet'
          ], richtig: 0,
          hinweis: 'Viele schreiben zwei, drei Studios an. Wer sich zuerst meldet und zuerst einen Termin hat, gewinnt.' },
        { nach: 3, frage: 'Du erreichst den Interessenten nicht. Was dann?',
          antworten: [
            'Nichts — er meldet sich schon',
            'Jede Stunde anrufen, bis er abnimmt',
            'Die Anfrage löschen',
            'Eine E-Mail schreiben und, wenn keine Antwort kommt, am nächsten Tag noch einmal anrufen'
          ], richtig: 3,
          hinweis: 'Anrufen, E-Mail, am nächsten Tag noch einmal anrufen.' },
        { nach: 3, frage: 'Wie machst du einen Interessenten aus einer Online-Aktion (z. B. einem Rücken-Programm) neugierig?',
          antworten: [
            'Gar nicht — einfach einen Termin nennen',
            'Auf sein Ziel eingehen: nach den Beschwerden fragen und kurz sagen, warum EMS dafür passt — dann einladen',
            'Ihm per Mail die Preisliste schicken',
            'Ihm sagen, dass das Programm fast ausgebucht ist'
          ], richtig: 1,
          hinweis: 'Das erhöht die Erscheinungsquote: auf das Ziel eingehen (z. B. tiefliegende Muskulatur, bandscheibenschonend), dann mit Alternativfrage terminieren.' },

        /* ── 4 Begrüßung ── */
        { nach: 4, frage: 'Um 15 Uhr steht Herr Mayer im Terminplaner, und um 15 Uhr kommt jemand herein, den du nicht kennst. Wie begrüßt du ihn?',
          antworten: [
            'Offen und herzlich mit Namen: „Herzlich willkommen, Herr Mayer!" — den Namen hast du vorher nachgesehen',
            '„Hallo, was kann ich für Sie tun?"',
            'Erst im PC nachsehen, wer das sein könnte',
            'Warten, bis er sich vorstellt'
          ], richtig: 0,
          hinweis: 'Der Name ist der erste Herzensöffner. Vorher in den Plan schauen, nicht erst, wenn die Tür aufgeht.' },
        { nach: 4, frage: 'Warum gibst du dem Interessenten am Anfang einen kurzen Überblick über die Stunde?',
          antworten: [
            'Damit er weiß, wie lange es dauert',
            'Weil es so vorgeschrieben ist',
            'Weil viele unsicher sind — noch nie in einem Studio gewesen — und Unsicherheit das Letzte ist, was wir wollen',
            'Damit er gleich weiß, was es kostet'
          ], richtig: 2,
          hinweis: '„Wir sprechen erst über deine Ziele, dann trainieren wir, danach zeige ich dir, wie du mitmachen kannst." Und fragen, ob man sich Notizen machen darf.' },
        { nach: 4, frage: 'Wozu dienen die Eisbrecherfragen (z. B. „Wie sind Sie auf uns aufmerksam geworden?")?',
          antworten: [
            'Nur für die Statistik',
            'Um warm zu werden — und sie liefern Infos, die später bei Angebot und Einwänden helfen',
            'Um Zeit zu überbrücken, bis das Gerät bereit ist',
            'Um zu prüfen, ob er zahlungsfähig ist'
          ], richtig: 1,
          hinweis: 'Wer z. B. sagt, das Fitnessstudio sei nichts für ihn gewesen, hat dir schon ein Argument für später gegeben.' },
        { nach: 4, frage: 'Du oder Sie?',
          antworten: [
            'Immer Du, das ist beim Sport so',
            'Immer Sie',
            'Das entscheidet die Studioleitung für alle',
            'Mit Vornamen vorstellen und darauf achten, wie der Interessent es gerne hätte'
          ], richtig: 3,
          hinweis: 'Viele bieten dann selbst das Du an. Wer gesiezt werden möchte, wird gesiezt — er soll sich wohlfühlen.' },
        { nach: 4, frage: 'Ein Interessent hat gelesen, man habe nach EMS riesigen Muskelkater. Was sagst du?',
          antworten: [
            'Dass das stimmt und dazugehört',
            'Dass das nur Gerüchte aus dem Internet sind',
            'Dass das erste Training moderat ist, die Werte gespeichert werden und man sich nach und nach steigert',
            'Nichts, das merkt er schon'
          ], richtig: 2,
          hinweis: '„Heute übertreiben wir nicht, damit du dich die nächsten Tage noch bewegen kannst."' },

        /* ── 5 Bedarfsanalyse ── */
        { nach: 5, frage: 'Welches Ziel ist emotional?',
          antworten: [
            '5 Kilo abnehmen, um wieder in den Lieblingsbikini zu passen und sich im Sommerurlaub am Strand wohlzufühlen',
            '5 Kilo abnehmen',
            'Rückenschmerzen in der Lendenwirbelsäule loswerden',
            'Zweimal die Woche trainieren'
          ], richtig: 0,
          hinweis: 'Emotional ist ein Ziel, wenn man es sich als Bild vorstellen kann.' },
        { nach: 5, frage: 'Wer redet in einer guten Bedarfsanalyse mehr?',
          antworten: [
            'Der Berater — er erklärt das Training',
            'Beide gleich viel',
            'Das hängt vom Interessenten ab',
            'Der Interessent — der Berater stellt offene, geschickte Fragen'
          ], richtig: 3,
          hinweis: 'Offene Fragen, damit der Interessent ins Reden kommt.' },
        { nach: 5, frage: 'Der Interessent sagt: „Ich habe Rückenschmerzen." Mit welcher Frage kommst du vom rationalen zum emotionalen Ziel?',
          antworten: [
            '„Seit wann genau?"',
            '„Was wäre für Sie anders, wenn die Schmerzen weg wären?"',
            '„Waren Sie schon beim Arzt?"',
            '„Welche Übungen machen Sie zu Hause?"'
          ], richtig: 1,
          hinweis: '„Was wäre anders, wenn …?" Dann kommen die Bilder: abends mit den Kindern spielen statt auf der Couch liegen.' },
        { nach: 5, frage: 'Was bedeutet „Vergangenheit, Gegenwart, Zukunft" im Leitfaden zur Kaufmotivsuche?',
          antworten: [
            'Wie lange hat er es schon — in welchen Situationen merkt er es — was wäre in Zukunft anders',
            'Früher trainiert, heute nicht, später vielleicht',
            'Die Reihenfolge von Begrüßung, Training und Angebot',
            'Die drei Laufzeiten der Mitgliedschaft'
          ], richtig: 0,
          hinweis: 'Die Zukunft ist immer das emotionale Ziel.' },
        { nach: 5, frage: 'Warum fragst du: „Wenn Sie Ihr Ziel erreicht haben, möchten Sie es dann auch halten?"',
          antworten: [
            'Um das Gespräch zu verlängern',
            'Um zu prüfen, ob er ehrlich ist',
            'Weil jeder Ja sagt — und du später bei der Laufzeit darauf zurückkommen kannst: er hat es selbst gesagt',
            'Das ist eine Frage für das Ende der Mitgliedschaft'
          ], richtig: 2,
          hinweis: 'Das gehört zur Einwandvorbehandlung. Was der Interessent selbst ausspricht, hat mehr Nachdruck als jede Empfehlung.' },
        { nach: 5, frage: 'Was muss vor dem ersten Training passieren?',
          antworten: [
            'Nichts, das Training geht vor',
            'Die Ziele zusammenfassen und über Kontraindikationen sprechen — mit Unterschrift',
            'Die Mitgliedschaft unterschreiben',
            'Eine Körperanalyse'
          ], richtig: 1,
          hinweis: 'Kein Training ohne Unterschrift zu den gesundheitlichen Einschränkungen. Und vorher zusammenfassen, „dass ich nichts vergessen habe".' },

        /* ── 5.1 Beispiel ── */
        { nach: 6, frage: 'Im Beispiel sagt Nathalie, im Fitnessstudio habe ihr die Anleitung gefehlt, und Zeit habe sie kaum. Was macht der Berater daraus?',
          antworten: [
            'Er geht nicht darauf ein',
            'Er empfiehlt ihr ein anderes Fitnessstudio',
            'Er fragt nach ihrem Budget',
            'Er fasst es zusammen: ihr ist wichtig, dass jemand an ihrer Seite ist, und der Zeitfaktor — und genau das bietet EMS'
          ], richtig: 3,
          hinweis: 'Zuhören, zusammenfassen, zurückspiegeln — daraus werden später die Argumente.' },
        { nach: 6, frage: 'Welches Bild steckt bei Nathalie am Ende hinter „weniger Rückenschmerzen"?',
          antworten: [
            'Sie will Muskeln aufbauen',
            'Sie will weniger Medikamente nehmen',
            'Am Wochenende Freunden nicht mehr absagen müssen, mit besserer Laune von der Arbeit kommen, ihre Mutter heben können',
            'Sie will schneller laufen'
          ], richtig: 2,
          hinweis: 'Aus einem rationalen Ziel („Rücken") werden konkrete Situationen — das emotionale Ziel.' },
        { nach: 6, frage: 'Bei welchen Punkten darf man laut Beispiel nur nach Rücksprache mit dem Arzt trainieren?',
          antworten: [
            'Herzschrittmacher, akute Tumorerkrankung, Epilepsie, Schwangerschaft',
            'Leichte Knieprobleme',
            'Rückenschmerzen und Migräne',
            'Übergewicht'
          ], richtig: 0,
          hinweis: 'Diese Kontraindikationen werden genannt und abgezeichnet. Die vollständige Liste liegt im Studio.' },

        /* ── 6 Angebotspräsentation ── */
        { nach: 7, frage: 'Warum erwähnst du im Training bei einer Übung, wofür sie ist („die ist jetzt speziell für deinen Nacken")?',
          antworten: [
            'Damit das Training länger wirkt',
            'Weil die Übung sonst nicht wirkt',
            'Das ist nicht nötig',
            'Weil der Kunde es sonst nicht weiß — so verbindet er das Training mit seinem Ziel'
          ], richtig: 3,
          hinweis: 'Nur weil du weißt, wofür die Übung ist, weiß es der Kunde noch lange nicht.' },
        { nach: 7, frage: 'Wie sprichst du nach dem Training mit dem Interessenten?',
          antworten: [
            'Zurückhaltend, damit er sich nicht gedrängt fühlt',
            'Als wäre er schon Mitglied: „Deine Werte sind auf deiner Chipkarte gespeichert, beim nächsten Mal geht es direkt los."',
            'Gar nicht, er soll sich erst umziehen',
            'Du fragst direkt, ob er unterschreiben will'
          ], richtig: 1,
          hinweis: 'Wir gehen davon aus, dass er sich anmeldet. Kaufentscheidungsfragen wie „Kannst du dir vorstellen, wiederzukommen?" leiten zum Angebot über.' },
        { nach: 7, frage: 'Was machst du, bevor du die Mitgliedschaften zeigst?',
          antworten: [
            'Die Ziele noch einmal zusammenfassen und die Emotionen wecken — das letzte Gespräch darüber ist 20 Minuten her',
            'Die Preisliste vorlesen',
            'Fragen, wie viel er ausgeben möchte',
            'Den Vertrag ausdrucken'
          ], richtig: 0,
          hinweis: 'Erst die Emotion, dann Zahlen, Daten, Fakten.' },
        { nach: 7, frage: 'Du zeigst mehrere Laufzeiten. Was darf nie fehlen?',
          antworten: [
            'Der Hinweis auf die Kündigungsfrist',
            'Ein Rabatt',
            'Eine klare Empfehlung — sonst heißt es „Ich schlaf noch eine Nacht drüber"',
            'Ein Vergleich mit anderen Studios'
          ], richtig: 2,
          hinweis: 'Immer eine Variante empfehlen, mit Begründung aus seinen Zielen. Entscheidet er sich für eine andere: ankreuzen — auch gut.' },
        { nach: 7, frage: 'Welche Formulierung passt?',
          antworten: [
            '„Der 24-Monats-Vertrag kostet dich 25 Euro die Woche."',
            '„Bei der 24-Monats-Variante investierst du nur 25 Euro die Woche in deine Gesundheit."',
            '„Unterschreib bitte hier den Vertrag."',
            '„Die Kosten sind leider etwas höher."'
          ], richtig: 1,
          hinweis: 'Mitgliedschaft statt Vertrag, Investition statt Kosten, Bestätigung statt Unterschrift. Kleinigkeiten mit großer Wirkung.' },
        { nach: 7, frage: 'Was ist laut Video ein Hauptgrund, wenn sich ein Interessent nicht anmeldet?',
          antworten: [
            'Der Preis',
            'Das Training war zu anstrengend',
            'Die Laufzeit',
            'Das emotionale Ziel wurde nicht gefunden'
          ], richtig: 3,
          hinweis: 'Wenn die Emotionen nicht geweckt wurden, heißt es hinterher „zu teuer".' },

        /* ── 6.1 Beispiel ── */
        { nach: 8, frage: 'Im Beispiel entscheidet sich Nathalie für 24 Monate. Womit begründet der Berater die Empfehlung?',
          antworten: [
            'Dass die meisten 24 Monate machen',
            'Mit einem Sonderangebot',
            'Mit ihren eigenen Worten: ihr ist wichtig, das Ziel nicht nur zu erreichen, sondern zu halten',
            'Dass 12 Monate nicht mehr angeboten werden'
          ], richtig: 2,
          hinweis: 'Die Frage aus der Bedarfsanalyse („möchten Sie es dann auch halten?") zahlt sich hier aus.' },
        { nach: 8, frage: 'Nathalie hat sich entschieden. Wie geht es im Beispiel weiter?',
          antworten: [
            'Er nimmt selbstverständlich die nächsten Punkte auf: Outfit oder Wäscheservice, einmalige Beträge, Bankverbindung',
            'Der Berater fragt noch einmal, ob sie wirklich sicher ist',
            'Er gibt ihr die Unterlagen für zu Hause mit',
            'Er bietet einen Rabatt an'
          ], richtig: 0,
          hinweis: 'Je selbstverständlicher man es erklärt, desto selbstverständlicher ist es für den Kunden.' },

        /* ── 7 Einwandbehandlung ── */
        { nach: 9, frage: 'Ein begeisterter Interessent sagt: „Ich ruf nächste Woche an und mache dann alles fest." Wie viele kommen tatsächlich wieder?',
          antworten: [
            'Fast alle',
            'Etwa die Hälfte',
            'Rund 30 Prozent',
            'Weniger als 10 Prozent'
          ], richtig: 3,
          hinweis: 'Die Motivation flacht zu Hause ab — wie das Blatt Papier im Video. Deshalb den Einwand im Gespräch behandeln.' },
        { nach: 9, frage: 'Der Interessent sagt: „Das ist aber teuer." Was ist dein erster Schritt?',
          antworten: [
            'Sofort widersprechen: für Personal Training ist das günstig',
            'Durchatmen, kurz schweigen, Verständnis zeigen',
            'Einen Rabatt anbieten',
            'Die günstigste Laufzeit vorschlagen'
          ], richtig: 1,
          hinweis: 'Nicht losschießen. „Kann ich mir vorstellen, dass sich das erst mal viel anhört."' },
        { nach: 9, frage: '„Wenn ich dich richtig verstehe, geht es also nur um die Laufzeit?" — wie heißt dieser Schritt?',
          antworten: [
            'Einwand isolieren',
            'Einwand ignorieren',
            'Einwand wiederholen',
            'Einwand abschließen'
          ], richtig: 0,
          hinweis: 'Erst hinterfragen, woran es liegt — dann isolieren, ob das der einzige Punkt ist.' },
        { nach: 9, frage: 'Welche Frage ist die Bedingungsfrage?',
          antworten: [
            '„Warum finden Sie das teuer?"',
            '„Was verdienen Sie denn?"',
            '„Wenn wir dafür eine Lösung finden — kannst du dir dann vorstellen, mit dem Training zu starten?"',
            '„Möchten Sie noch einmal darüber schlafen?"'
          ], richtig: 2,
          hinweis: 'Danach die Lösung anbieten — oder den Kunden fragen: „Was wäre für dich die optimale Lösung?"' },
        { nach: 9, frage: 'Du möchtest die einmaligen Gebühren auf zwei, drei Monate verteilen oder die Wäsche schenken. Was muss vorher klar sein?',
          antworten: [
            'Nichts, das darf jeder Berater selbst entscheiden',
            'Dass es mit der Inhaberin bzw. dem Inhaber abgesprochen ist',
            'Dass der Kunde schon unterschrieben hat',
            'Dass es schriftlich im Handout steht'
          ], richtig: 1,
          hinweis: 'Im Video ausdrücklich: „muss natürlich auch mit Inhabern abgesprochen sein" — eine Philosophiefrage des Studios.' },
        { nach: 9, frage: '„Ich muss noch mal überlegen" ist meistens …',
          antworten: [
            'ein klares Nein',
            'ein Zeichen, dass er woanders unterschreibt',
            'eine Bitte um Unterlagen',
            'ein Vorwand — dahinter steckt ein Einwand wie Preis oder Laufzeit'
          ], richtig: 3,
          hinweis: 'Nachfragen: „Du überlegst schon so lange — welche Fragen sind noch offen?" Dann kommt meistens der eigentliche Einwand.' },
        { nach: 9, frage: 'Der Interessent fragt, warum EMS mehr kostet als ein normales Fitnessstudio. Was ist der wichtigste Punkt?',
          antworten: [
            'Die teure Technik',
            'Die Miete ist höher',
            'Es ist ein Personal Training — es ist immer jemand an deiner Seite',
            'Die Geräte kommen aus Deutschland'
          ], richtig: 2,
          hinweis: 'Trainer, die mit dem Gerät nach Hause kommen, nehmen 80 bis 100 Euro pro Einheit. Und: eine Investition in die Gesundheit.' },

        /* ── 7.1 Beispiel ── */
        { nach: 10, frage: 'Im Beispiel will Nathalie „eine Nacht drüber schlafen". Was steckt tatsächlich dahinter?',
          antworten: [
            'Die einmaligen Beträge zu Beginn sind ihr auf einmal zu viel',
            'Sie will mit ihrem Partner sprechen',
            'Die Laufzeit ist ihr zu lang',
            'Das Training hat ihr nicht gefallen'
          ], richtig: 0,
          hinweis: 'Der Wochenbetrag war in Ordnung. Durch Nachfragen kommt der wahre Einwand heraus — und die Lösung: aufteilen auf drei Monate.' },
        { nach: 10, frage: 'Wie findet der Berater im Beispiel die Lösung?',
          antworten: [
            'Er senkt den Wochenbetrag',
            'Er gibt nach und lässt sie gehen',
            'Er holt den Chef dazu',
            'Er fragt: „Was wäre für dich eine optimale Lösung?" — und sie schlägt selbst vor, den Anfang aufzulockern'
          ], richtig: 3,
          hinweis: 'Die Lösung finden lassen: Was der Kunde selbst vorschlägt, trägt er auch mit.' },

        /* ── 8 Weiterempfehlung ── */
        { nach: 11, frage: 'Was kostet uns ein neues Mitglied über klassische Werbung (Flyer, Anzeigen) im Schnitt — und was über eine Empfehlung?',
          antworten: [
            'Beides etwa 50 Euro',
            'Werbung 150 bis 200 Euro, Empfehlung 0 Euro',
            'Werbung 20 Euro, Empfehlung 100 Euro',
            'Beides nichts'
          ], richtig: 1,
          hinweis: 'Und ein empfohlener Interessent ist auch leichter zu überzeugen: Menschen hören eher auf Freunde als auf Werbung.' },
        { nach: 11, frage: 'Was ist die Voraussetzung für eine passive Weiterempfehlung?',
          antworten: [
            'Ein begeistertes Mitglied — dessen Erwartungen übertroffen wurden',
            'Ein zufriedenes Mitglied',
            'Ein Mitglied mit 24 Monaten Laufzeit',
            'Ein Rabatt für Empfehlungen'
          ], richtig: 0,
          hinweis: 'Nett, freundlich und gutes Training sind selbstverständlich. Begeisterung kommt durch „Magic Moments" außer der Reihe.' },
        { nach: 11, frage: 'Wer ist der „König der Empfehler"?',
          antworten: [
            'Das langjährigste Mitglied',
            'Die Studioleitung',
            'Der gerade neu gewonnene Kunde',
            'Freunde der Trainer'
          ], richtig: 2,
          hinweis: 'Deshalb bauen wir die aktive Weiterempfehlung direkt ins Beratungsgespräch ein.' },

        /* ── 9 VIP-Einladung ── */
        { nach: 12, frage: 'Was bekommt ein Neumitglied direkt nach der Anmeldung angeboten?',
          antworten: [
            'Einen Rabatt auf die nächste Laufzeit',
            'Zwei VIP-Einladungen zum Verschenken an Freunde oder Bekannte',
            'Eine kostenlose Körperanalyse',
            'Ein zweites Trainingsoutfit'
          ], richtig: 1,
          hinweis: 'Zwei Einladungen im Wert von je 50 Euro — „als Neumitglied hast du ein besonderes Privileg".' },
        { nach: 12, frage: 'Das Neumitglied nennt einen Kollegen, möchte aber die Nummer nicht einfach herausgeben. Was tust du?',
          antworten: [
            'Die Nummer trotzdem erfragen',
            'Die Einladung verfallen lassen',
            'Den Kollegen selbst im Internet suchen',
            'Den Namen notieren, die Einladung reservieren — du rufst das Mitglied ohnehin in zwei Tagen an, bis dahin kann es mit dem Kollegen sprechen'
          ], richtig: 3,
          hinweis: 'Unkompliziert bleiben. Und: Wir rufen niemanden an, ohne dass das Mitglied vorher Bescheid gesagt hat.' },
        { nach: 12, frage: 'Du rufst die eingeladene Person an. Was sagst du?',
          antworten: [
            '„Sie haben ein kostenloses Probetraining gewonnen."',
            '„Möchten Sie Mitglied werden?"',
            'Dass Soundso eine hochwertige VIP-Einladung an sie verschenkt hat: ein Personal Training mit individueller Beratung',
            'Die Preise'
          ], richtig: 2,
          hinweis: 'Nicht „Probetraining" sagen. Die Einladung kommt von jemandem, der an sie gedacht hat.' },
        { nach: 12, frage: 'Was ist laut Video der größte Fehler bei der Weiterempfehlung?',
          antworten: [
            'Gar nicht zu fragen — dabei spricht jeder Zweite eine Empfehlung aus',
            'Zu früh fragen',
            'Zu viele Einladungen zu verschenken',
            'Die Einladungen zu spät auszudrucken'
          ], richtig: 0,
          hinweis: 'Man ist froh, dass der Kunde unterschrieben hat, und vergisst es. Jeder Zweite empfiehlt — man muss es nur anbieten.' },
        { nach: 12, frage: '„Mir fällt gerade keiner ein." Was dann?',
          antworten: [
            'Die Einladungen gleich verfallen lassen',
            'Nachhaken, bis ein Name kommt',
            'Sie ihm für zu Hause mitgeben',
            'Die Einladung bis zum nächsten Training liegen lassen und dann noch einmal ansprechen'
          ], richtig: 3,
          hinweis: '„Du wirst merken, wenn du erzählst — man muss es einfach erlebt haben." Beim nächsten Training noch einmal fragen.' },

        /* ── 9.1 Beispiel ── */
        { nach: 13, frage: 'Wann bringt der Berater im Beispiel die VIP-Einladungen ins Spiel?',
          antworten: [
            'Ganz am Anfang, bei der Begrüßung',
            'Direkt nach der Anmeldung, bevor der nächste Termin gebucht wird — als „kleine Überraschung"',
            'Erst beim dritten Training',
            'Per E-Mail nach einer Woche'
          ], richtig: 1,
          hinweis: 'Der gerade gewonnene Kunde ist begeistert — genau dann.' },

        /* ── 10 Rollenspiel ── */
        { nach: 14, frage: 'Im Rollenspiel fragt Nathalie, ob sie unter dem Trainingsoutfit die Unterwäsche anlassen darf. Was sagt der Berater?',
          antworten: [
            'Die meisten ziehen alles darunter aus, weil jeder Stoff dazwischen etwas weniger leitet — wenn sie sich wohler fühlt, darf sie sie anlassen',
            'Nein, das geht nicht',
            'Ja, das ist sogar besser',
            'Das muss sie selbst herausfinden'
          ], richtig: 0,
          hinweis: '„Mir ist wichtig, dass du dich wohlfühlst." Ehrlich erklären, dann entscheiden lassen.' },
        { nach: 14, frage: 'Was passiert im Rollenspiel direkt vor dem Training?',
          antworten: [
            'Die Mitgliedschaft wird unterschrieben',
            'Die Preise werden genannt',
            'Kontraindikationen besprechen und abzeichnen lassen, die Ziele zusammenfassen, das Trainingsoutfit geben',
            'Die VIP-Einladungen werden verschenkt'
          ], richtig: 2,
          hinweis: 'Erst Gesundheit und Ziele, dann Training — Angebot und Empfehlung kommen danach.' },
        /* ── 11 Kein Abschluss ── */
        { nach: 15, frage: 'Der Interessent möchte sich heute nicht entscheiden. Wie vereinbarst du den nächsten Termin?',
          antworten: [
            '„Wir können ja schon mal nach einem Termin schauen."',
            'Verständnis zeigen und vorschlagen, nächste Woche noch einmal richtig zu trainieren — die Werte sind gespeichert, das zweite Mal macht mehr Spaß — und danach weiterschauen',
            'Ihn bitten, sich zu melden, wenn er so weit ist',
            'Ihm die Preisliste mitgeben'
          ], richtig: 1,
          hinweis: 'Auf „schauen wir mal nach einem Termin" kommt meist „muss erst in meinen Kalender gucken". Ein zweites Training ist ein Grund wiederzukommen.' },
        { nach: 15, frage: 'Wen rufst du zwei Tage nach dem ersten Training an?',
          antworten: [
            'Nur die, die noch überlegen',
            'Nur die neuen Mitglieder',
            'Niemanden, das wirkt aufdringlich',
            'Beide: neue Mitglieder und Interessenten, die noch überlegen — fragen, wie es ihnen geht, und den nächsten Termin bestätigen'
          ], richtig: 3,
          hinweis: 'Manche kennen keinen Muskelkater und wundern sich, warum es wehtut. Der Anruf gehört zum Service — und sichert den nächsten Termin.' },

        /* ── Zum Schluss: über mehrere Videos ── */
        { frage: 'Ein Interessent aus einer Online-Aktion sagt am Ende: „Ich muss noch mal mit meinem Partner sprechen." Welche Frage aus der Bedarfsanalyse hilft dir jetzt?',
          antworten: [
            '„Wie sind Sie auf uns aufmerksam geworden?"',
            '„Haben Sie schon mal EMS gemacht?"',
            '„Gibt es jemanden, der Sie bei Ihrem Vorhaben unterstützt?"',
            '„Wie viel wiegen Sie?"'
          ], richtig: 2,
          hinweis: 'Einwandvorbehandlung: Hat er vorhin gesagt, sein Partner steht hinter ihm, kannst du jetzt darauf zurückkommen.' },
        { frage: 'Bring die Schritte des Beratungsgesprächs in die richtige Reihenfolge.',
          antworten: [
            'Begrüßung — Bedarfsanalyse — Training — Angebot (und Einwände) — Weiterempfehlung',
            'Angebot — Begrüßung — Training — Bedarfsanalyse — Empfehlung',
            'Bedarfsanalyse — Begrüßung — Angebot — Training — Weiterempfehlung',
            'Training — Begrüßung — Angebot — Bedarfsanalyse — Weiterempfehlung'
          ], richtig: 0,
          hinweis: 'Das sagt der Berater auch gleich am Anfang: „Wir sprechen über deine Ziele, dann trainieren wir, danach zeige ich dir, wie du mitmachen kannst."' },
        { frage: 'An drei Stellen im Gespräch fasst du die Ziele des Interessenten zusammen. Welche Reihe stimmt?',
          antworten: [
            'Nur ganz am Ende',
            'Beim Anruf, bei der Begrüßung und beim Abschied',
            'Gar nicht — der Kunde weiß ja, was er will',
            'Am Ende der Bedarfsanalyse, vor der Angebotspräsentation, und in der Einwandbehandlung greifst du sie wieder auf'
          ], richtig: 3,
          hinweis: 'Die Ziele sind der rote Faden: aufschreiben, zusammenfassen, im richtigen Moment wieder aufgreifen.' },
        { frage: 'Welche Technik taucht bei der Terminvereinbarung UND bei der Laufzeitwahl auf?',
          antworten: [
            'Der Rabatt',
            'Die Alternativfrage: „eher vormittags oder abends?" — „eher 12 oder 24 Monate?"',
            'Das Schweigen',
            'Die Preisliste'
          ], richtig: 1,
          hinweis: 'Zwei Möglichkeiten zur Wahl statt eines offenen „Wann?" oder „Was möchtest du?".' },
        { frage: 'Ein Interessent sagt beim Angebot „zu teuer". Du hast in der Bedarfsanalyse erfahren, dass sein Arzt ihm eine Bandscheiben-OP in Aussicht gestellt hat. Wie nutzt du das?',
          antworten: [
            'Mit Verständnis, dann das Weg-von-Motiv aufgreifen: was passiert mit dem Rücken, wenn er nicht startet?',
            'Gar nicht, das ist privat',
            'Ihm sagen, dass er sonst sicher operiert wird',
            'Einen Rabatt anbieten, damit er die OP vermeidet'
          ], richtig: 0,
          hinweis: 'Hin-zu- und Weg-von-Motive verstärken das Ziel. Ehrlich bleiben — keine Versprechen, keine Angst machen.' },
        { frage: 'Warum lohnt es sich, einen Einwand über die einmaligen Gebühren zu lösen (z. B. aufteilen), statt den Interessenten ziehen zu lassen?',
          antworten: [
            'Weil sonst die Statistik schlecht aussieht',
            'Weil die Gebühren sowieso verhandelbar sind',
            'Weil ein Abo im Schnitt rund 2.500 Euro wert ist — plus Empfehlungen und Verlängerungen',
            'Weil er sonst eine schlechte Bewertung schreibt'
          ], richtig: 2,
          hinweis: 'Das kam schon im Video zur Terminvereinbarung: „Wenn jemand anruft, rufen potenziell mindestens 2.500 Euro an." Abgesprochen mit der Inhaberin bzw. dem Inhaber.' }
      ]
    }
  ]
};
