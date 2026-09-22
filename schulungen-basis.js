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
  stand: '2026-09-22',
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
    { id: 'ablauf',       name: 'Abläufe',             ico: 'wiederholen' }
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
    }
  ]
};
