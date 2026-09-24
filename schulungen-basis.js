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
   Messung. Bis der Eimer steht, bleibt `quelle` leer.

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
  stand: '2026-09-24',
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
          hinweis: 'Eingewöhnung: höchstens eine 20-Minuten-Einheit pro Woche. Danach mindestens 4 Tage Pause zwischen intensiven Einheiten.' },
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
    }
  ]
};
