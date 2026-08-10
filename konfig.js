/* =====================================================================
 * StudioChat – KONFIGURATION
 * =====================================================================
 * Alles, was sich von Kunde zu Kunde unterscheidet, steht in DIESER Datei
 * und sonst nirgends. Für einen neuen Kunden: Datei kopieren, die Werte
 * unten austauschen, fertig.
 *
 * Vorher standen dieselben Firebase-Zugangsdaten in index.html UND in
 * sw.js. Beim zweiten Kunden wird eine der beiden Stellen garantiert
 * vergessen – und der Fehler fällt erst auf, wenn Push-Nachrichten beim
 * falschen Projekt landen.
 *
 * Die Datei wird von index.html per <script src> geladen und von sw.js
 * per importScripts – deshalb funktioniert sie in beiden Welten und darf
 * KEINE Browser-Objekte (document, window) benutzen.
 * ===================================================================== */
(function (global) {
  'use strict';

  var KONFIG = {

    /* ── Firma ──────────────────────────────────────────────────────── */
    firma: 'Körperformen',
    appName: 'StudioChat',

    /* ── Studios ────────────────────────────────────────────────────────
       ACHTUNG: nur HINTEN anhängen, nie umsortieren und nie löschen.
       Die Kennung in der Datenbank ist der Listenplatz ("studio-6").
       Wer die Reihenfolge ändert, ordnet allen bestehenden Daten ein
       anderes Studio zu. */
    studios: [
      'Longerich', 'Nippes', 'Ebertplatz', 'Rath', 'Porz', 'Rondorf',
      'Hürth', 'Brühl', 'Niederkassel Mondorf', 'Refrath', 'Overath',
      'Marialinden', 'Rösrath', 'Seelscheid'
    ],

    /* ── Firebase ───────────────────────────────────────────────────────
       Firebase-Konsole → Projekteinstellungen → Meine Apps → Web-App.
       Diese Werte sind öffentlich; geschützt wird über die
       Sicherheitsregeln, nicht über Geheimhaltung. */
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

    /* Region der Cloud Functions – muss zur Firestore-Region passen */
    region: 'europe-west1',

    /* ── Push ───────────────────────────────────────────────────────────
       Firebase-Konsole → Projekteinstellungen → Cloud Messaging →
       Web Push-Zertifikate → Schlüsselpaar erzeugen.
       Leer lassen heißt: Fotos und Hinweise in der App funktionieren,
       aber keine Meldungen bei geschlossener App. */
    vapidKey: 'BG-Ibkh7PLobYuR7_q2HC63kh7krkKYDi7zUzIAjoiCddfGr1vwq0Kaq1yDNvP27twUprl4H8o8y-9TC58hn_yI',

    /* ── Google-Tabelle ─────────────────────────────────────────────────
       Adresse der Apps-Script-Web-App, siehe MATERIAL-SHEETS.gs.
       Leer lassen heißt: Material und Putzplan laufen normal, nur ohne
       automatische Tabelle. */
    sheetsWebhook: 'https://script.google.com/macros/s/AKfycbygK9l443-M3GBhVDYTZQ0tNkGRvSRWYMgeOn6ksNdBDLMb6uc21Vm_20XfyUeibXu_aw/exec',

    /* ── Verhalten ──────────────────────────────────────────────────────
       Erledigte einmalige Aufgaben verschwinden nach so vielen Stunden
       aus der aktiven Liste ins Archiv. Wiederkehrende bleiben davon
       unberührt. */
    archivNachStunden: 3,

    /* Erledigte einmalige PUTZaufgaben verschwinden nach so vielen
       Stunden ganz – auch aus der Google-Tabelle. */
    putzWegNachStunden: 24,

    /* Größte Kantenlänge für Fotos, die in der Datenbank landen. */
    bildMaxKante: 1280,

    /* ── Mehrere Firmen (Stufe 2 aus MANDANT-PLAN.md) ──────────────────
       AUS lassen, bis der Umzug der Daten gelaufen ist.

       Bei false liegen die Daten flach: studios/…, channels/…, config/…
       Bei true liegen sie unter firmen/<kennung>/…

       Der Schalter und der Umzug gehören ZUSAMMEN. Wer ihn umlegt, ohne
       dass die Daten umgezogen sind, bekommt eine leere App — die Pfade
       zeigen dann auf Sammlungen, die es noch nicht gibt. Das ist der
       harmlose Fall. Der umgekehrte, Umzug ohne Schalter, lässt die App
       weiter auf den alten Daten arbeiten, während die neuen veralten;
       auch nicht gut. Deshalb: beides in einem Schritt, und vorher der
       Probelauf (PROBELAUF-EINRICHTEN.md). */
    mandant: false,

    /* Kennung DIESER Firma. Zählt nur, wenn mandant:true ist.
       Bestehende Konten ohne Feld "firma" gelten als zu dieser Firma
       gehörig — sonst wäre nach dem Umschalten niemand mehr drin. */
    firma: 'koerperformen',

    /* ── Rechtliches ────────────────────────────────────────────────────
       ACHTUNG: Solange hier etwas fehlt, zeigt die App im Rechtliches-
       Fenster einen deutlichen Hinweis, und der Chef sieht in
       Verwaltung → System eine Warnung. Das ist Absicht: eine App, die
       ein leeres Impressum als fertiges anzeigt, ist schlimmer als eine
       ohne.

       WAS ICH NICHT LEISTEN KANN: die Texte selbst. Ein Impressum nach
       § 5 DDG und eine Datenschutzerklärung nach Art. 13 DSGVO müssen zu
       EUREM Betrieb passen und gehören vor den ersten fremden Nutzer
       einmal anwaltlich durchgesehen. Was hier steht, ist ein Gerüst,
       kein Rechtstext. Siehe RECHT.md.

       Beim Verkauf an einen Kunden wird dieser Block ausgetauscht – wie
       alles andere in dieser Datei auch. */
    recht: {
      /* Impressum – Pflichtangaben nach § 5 DDG */
      betreiber: '',          // z. B. 'Körperformen Köln GmbH'
      anschrift: '',          // Straße, PLZ, Ort – ein Postfach genügt NICHT
      vertreten: '',          // Geschäftsführer / Inhaber
      telefon: '',
      email: '',              // muss existieren und gelesen werden
      register: '',           // z. B. 'Amtsgericht Köln, HRB 12345'
      ustId: '',              // falls vorhanden

      /* Datenschutz */
      datenschutzKontakt: '', // Ansprechpartner oder Datenschutzbeauftragter
      /* Zusätzliche Absätze, die nur ihr kennt – etwa eine
         Videoüberwachung im Studio oder ein Zeiterfassungssystem.
         Jeder Eintrag wird als eigener Absatz angezeigt. */
      zusatz: []
    }
  };

  /* ── Probelauf-Umgebung ────────────────────────────────────────────
     Dieselbe Datei läuft in beiden Projekten. Welches gemeint ist,
     entscheidet die Adresse, unter der die App gerade liegt.

     WARUM SO und nicht mit zwei Dateien: eine zweite konfig.js müsste
     man beim Ausrollen tauschen — und genau dabei erwischt man
     irgendwann das falsche Projekt. Hier kann das nicht passieren. Auf
     formenchat.web.app greift dieser Block nie, egal was jemand tippt.

     Der Probelauf ist zugleich der einzige Ort, an dem mandant:true
     schon an ist. So lässt sich die Mandantenfähigkeit an echten
     (kopierten) Daten ansehen, ohne dass im Betrieb irgendetwas
     umgestellt wird. */
  /* Feste Liste statt Muster. Mein erstes Muster prüfte nur den Anfang,
     nicht das Ende — damit galt auch
     "formenchat-probe.example.com.irgendwo.de" als Probelauf. Vom Test
     gefunden. Bei einer Weiche, die entscheidet, WELCHE Datenbank die
     App anfasst, gehört keine Mustererkennung hin, sondern eine
     Aufzählung: was nicht draufsteht, ist Betrieb. */
  var PROBE_ADRESSEN = [
    'formenchat-probe.web.app',
    'formenchat-probe.firebaseapp.com'
  ];
  /* Die Adressen des BETRIEBS. Hier darf der Probelauf unter keinen
     Umständen greifen — auch nicht, wenn jemand ?probe=1 anhängt. */
  var LIVE_ADRESSEN = [
    'formenchat.web.app',
    'formenchat.firebaseapp.com'
  ];

  var aufProbe = false;
  try {
    if (typeof location !== 'undefined') {
      var wirt = String(location.hostname).toLowerCase();
      var imBetrieb = LIVE_ADRESSEN.indexOf(wirt) >= 0;
      /* Zweiter Weg: ?probe=1 anhängen. Gebraucht, weil sich das Hosting
         des Probe-Projekts aus Cloud Shell heraus nicht ausrollen liess
         (Upload-Fehler) — die App lässt sich dort aber direkt anzeigen,
         und die läuft dann unter einer cloudshell.dev-Adresse.

         Auf den Adressen des Betriebs wird der Zusatz IGNORIERT. Sonst
         wäre ein Link mit ?probe=1 genug, um jemandem eine leere App zu
         zeigen — die Pfade der Probe gibt es dort nicht. */
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
    KONFIG.mandant = true;          // hier wird die Trennung geprobt
    KONFIG.firma   = 'koerperformen';
    KONFIG.vapidKey = '';           // kein Push in der Probe
    KONFIG.sheetsWebhook = '';      // keine echte Tabelle beschreiben
    KONFIG.firma_anzeige = 'PROBELAUF';
  }

  global.KONFIG = KONFIG;

})(typeof self !== 'undefined' ? self : this);
