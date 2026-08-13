/* StudioChat – Konfiguration
 *
 * Alles, was sich von Kunde zu Kunde unterscheidet, steht hier und sonst
 * nirgends. Neuer Kunde heisst: Datei kopieren, Werte austauschen.
 *
 * Geladen von index.html per <script src> und von sw.js per importScripts.
 * Darf deshalb keine Browser-Objekte benutzen (kein document, kein window).
 */
(function (global) {
  'use strict';

  var KONFIG = {

    /* Anzeigename und Firmenkennung sind zwei verschiedene Dinge und duerfen
       nie denselben Schluessel bekommen: in einem Objekt gewinnt der letzte.
       firma_anzeige steht auf Ausdrucken und in Mails, firma in den
       Datenbankpfaden. tests/test-konfig.js prueft das. */
    firma_anzeige: 'Körperformen',
    appName: 'StudioChat',

    /* Nur hinten anhaengen, nie umsortieren, nie loeschen: die Kennung in der
       Datenbank ist der Listenplatz ("studio-6"). Eine andere Reihenfolge
       ordnet allen bestehenden Daten ein anderes Studio zu. */
    studios: [
      'Longerich', 'Nippes', 'Ebertplatz', 'Rath', 'Porz', 'Rondorf',
      'Hürth', 'Brühl', 'Niederkassel Mondorf', 'Refrath', 'Overath',
      'Marialinden', 'Rösrath', 'Seelscheid'
    ],

    /* Firebase-Konsole → Projekteinstellungen → Meine Apps → Web-App.
       Diese Werte sind oeffentlich; geschuetzt wird ueber firestore.rules,
       nicht ueber Geheimhaltung. */
    firebase: {
      apiKey: 'AIzaSyAvYVUzTbT86jeH6bsCAS0PyK9ArNb6pRw',
      authDomain: 'formenchat.firebaseapp.com',
      databaseURL: 'https://formenchat-default-rtdb.europe-west1.firebasedatabase.app',
      projectId: 'formenchat',
      storageBucket: 'formenchat.firebasestorage.app',
      messagingSenderId: '873830492257',
      appId: '1:873830492257:web:07fb34b80fd47c1873e220',
      measurementId: 'G-H0WMHW25QT'
    },

    /* Muss zur Firestore-Region passen. */
    region: 'europe-west1',

    /* Firebase-Konsole → Cloud Messaging → Web-Push-Zertifikate.
       Leer: die App laeuft normal, nur ohne Meldungen bei geschlossener App. */
    vapidKey: 'BG-Ibkh7PLobYuR7_q2HC63kh7krkKYDi7zUzIAjoiCddfGr1vwq0Kaq1yDNvP27twUprl4H8o8y-9TC58hn_yI',

    /* Adresse der Apps-Script-Web-App, siehe tools/MATERIAL-SHEETS.gs.
       Leer: Material und Putzplan laufen normal, nur ohne Tabelle. */
    sheetsWebhook: 'https://script.google.com/macros/s/AKfycbygK9l443-M3GBhVDYTZQ0tNkGRvSRWYMgeOn6ksNdBDLMb6uc21Vm_20XfyUeibXu_aw/exec',

    /* Erledigte einmalige Aufgaben wandern nach so vielen Stunden ins Archiv.
       Wiederkehrende bleiben unberuehrt. */
    archivNachStunden: 3,

    /* Erledigte einmalige Putzaufgaben verschwinden nach so vielen Stunden
       ganz, auch aus der Google-Tabelle. */
    putzWegNachStunden: 24,

    /* Groesste Kantenlaenge fuer Fotos, die in der Datenbank landen. */
    bildMaxKante: 1280,

    /* false: die Daten liegen flach (studios/…, channels/…, config/…)
       true:  sie liegen unter firmen/<kennung>/…

       Schalter und Datenumzug gehoeren in einen Arbeitsgang. Umlegen ohne
       Umzug gibt eine leere App. Umziehen ohne Umlegen ist schlimmer: die
       Zeitplaene erkennen den Umzug am Dokument firmen/<kennung> und
       arbeiten sofort auf den neuen Pfaden, waehrend die App noch die alten
       liest — dann erinnert die App an laengst erledigte Aufgaben und meldet
       eine hakende Sicherung, die laeuft.

       Abbruch mitten im Umzug: das Dokument firmen/<kennung> loeschen. Die
       Kopie darunter bleibt liegen und alleFirmen() findet sie nicht, weil
       .get() Dokumente ohne Elterneintrag nicht sieht.

       Rueckweg: zurueck auf false und ausrollen. Die flachen Daten liegen
       unangetastet an ihrem Platz. */
    mandant: true,

    /* Kennung dieser Firma; zaehlt nur bei mandant:true. Konten ohne Feld
       "firma" gelten als zu dieser Firma gehoerig. */
    firma: 'koerperformen',

    /* Rueckfall fuer das Impressum. Gepflegt wird es je Firma in der App
       (Verwaltung → System → Rechtliche Angaben), diese Werte greifen nur
       fuer die eigene Firma und nur, solange dort nichts steht.

       Fehlt eine Pflichtangabe, zeigt die App das rot an, statt ein leeres
       Impressum als fertiges auszugeben. Die Texte selbst sind kein
       Programmierproblem: siehe docs/RECHT.md. */
    recht: {
      /* Pflichtangaben nach § 5 DDG */
      betreiber: '',          // z. B. 'Körperformen Köln GmbH'
      anschrift: '',          // Straße, PLZ, Ort – ein Postfach genügt nicht
      vertreten: '',          // Geschäftsführer / Inhaber
      telefon: '',
      email: '',              // muss existieren und gelesen werden
      register: '',           // z. B. 'Amtsgericht Köln, HRB 12345'
      ustId: '',              // falls vorhanden

      datenschutzKontakt: '', // Ansprechpartner oder Datenschutzbeauftragter

      /* Zusaetzliche Absaetze, die nur der Betrieb kennt — etwa eine
         Videoueberwachung. Jeder Eintrag wird ein eigener Absatz. */
      zusatz: []
    }
  };

  /* Probelauf-Umgebung.
     Dieselbe Datei laeuft in beiden Firebase-Projekten; welches gemeint ist,
     entscheidet die Adresse. Eine zweite konfig.js muesste man beim Ausrollen
     tauschen, und dabei erwischt man irgendwann das falsche Projekt.

     Aufzaehlung statt Muster: bei einer Weiche, die entscheidet, welche
     Datenbank die App anfasst, gehoert keine Mustererkennung hin. Ein Muster,
     das nur den Anfang prueft, haelt auch
     "formenchat-probe.example.com.fremd.de" fuer den Probelauf. */
  var PROBE_ADRESSEN = [
    'formenchat-probe.web.app',
    'formenchat-probe.firebaseapp.com'
  ];

  /* Hier darf der Probelauf unter keinen Umstaenden greifen. */
  var LIVE_ADRESSEN = [
    'formenchat.web.app',
    'formenchat.firebaseapp.com'
  ];

  var aufProbe = false;
  try {
    if (typeof location !== 'undefined') {
      var wirt = String(location.hostname).toLowerCase();
      var imBetrieb = LIVE_ADRESSEN.indexOf(wirt) >= 0;

      /* ?probe=1 als zweiter Weg, gebraucht fuer Adressen ausserhalb der
         Liste (z. B. cloudshell.dev). Auf den Adressen des Betriebs wird der
         Zusatz ignoriert, sonst genuegte ein Link, um jemandem eine leere App
         zu zeigen. */
      var gewuenscht = /(^|[?&])probe=1(&|$)/.test(String(location.search || ''));
      aufProbe = !imBetrieb && (PROBE_ADRESSEN.indexOf(wirt) >= 0 || gewuenscht);
    }
  } catch (e) {}

  if (aufProbe) {
    KONFIG.firebase = {
      apiKey: 'AIzaSyCTmUm4aEgra6AJQGcgBtL4aJR6lHu6aQ4',
      authDomain: 'formenchat-probe.firebaseapp.com',
      databaseURL: 'https://formenchat-probe-default-rtdb.europe-west1.firebasedatabase.app',
      projectId: 'formenchat-probe',
      storageBucket: 'formenchat-probe.firebasestorage.app',
      messagingSenderId: '692000066621',
      appId: '1:692000066621:web:23fca1cf7b3ec335d56e54'
    };
    KONFIG.mandant       = true;
    KONFIG.firma         = 'koerperformen';
    KONFIG.vapidKey      = '';   // kein Push in der Probe
    KONFIG.sheetsWebhook = '';   // keine echte Tabelle beschreiben
    KONFIG.firma_anzeige = 'PROBELAUF';
  }

  global.KONFIG = KONFIG;

})(typeof self !== 'undefined' ? self : this);
