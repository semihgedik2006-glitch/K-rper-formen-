/* ══════════════════════════════════════════════════════════════════════
   DEMO-MODUS — eine kleine Datenbank im Browser, sonst nichts

   Zweck: Wer über StudioChat nachdenkt, will die App ansehen, bevor er
   ein Konto anlegt. Niemand legt für einen Blick ein Konto an. Diese
   Datei macht aus `index.html?demo` eine vollständig bedienbare App mit
   erfundenen Daten — ohne Anmeldung, ohne Server, ohne Netz.

   ── Was hier NICHT passiert, und das ist der wichtigste Satz

   ES WIRD KEINE DATENBANK ANGEFASST. Diese Datei ersetzt das
   Firebase-SDK, bevor die App es zum ersten Mal benutzt. Es gibt keine
   Anmeldung, keine Abfrage, keinen Schreibvorgang nach draußen und
   keinen Weg zu echten Daten — auch nicht versehentlich. Alles, was
   jemand hier eintippt oder abhakt, liegt in einem JavaScript-Objekt und
   ist beim Neuladen wieder weg.

   PRÄZISE, WEIL DER UNTERSCHIED ZÄHLT: „kein einziges Byte verlässt den
   Browser" wäre zu viel behauptet. Die fünf SDK-Dateien werden weiterhin
   von Googles CDN geladen — sie stehen als <script> in index.html, und
   sie dort nur für die Demo herauszunehmen würde für alle anderen den
   Start verlangsamen (der Vorauslader findet dann keine festen
   Adressen mehr). Heruntergeladen wird also eine öffentliche
   Programmbibliothek; gesendet wird nichts. `tests/test-demo.js` misst
   genau diese Grenze — und zwar andersherum, als man zuerst denkt: dort
   steht eine Liste dessen, was die Demo anfassen DARF (eigene Adresse,
   Schriften, Bibliothek). Jede andere Anfrage ist ein Fund, auch eine,
   an die heute niemand denkt. Eine Liste des Verbotenen findet nur, was
   jemand vorher aufgeschrieben hat.

   ── Warum eine echte kleine Datenbank und nicht die Test-Attrappe

   `tests/stub-*.js` beantwortet Abfragen, verwirft aber Schreibvorgänge:
   für einen Durchlauf ist das richtig, für eine Vorführung wäre es
   tödlich. Wer in der Demo eine Aufgabe abhakt und nichts passiert,
   hält nicht die Demo für kaputt, sondern die App.

   Deshalb steht hier ein Speicher, der wirklich schreibt und seine
   Zuhörer wirklich benachrichtigt — dieselbe Mechanik wie bei Firestore,
   nur ohne Server. Abgehakte Aufgaben verschwinden, geschriebene
   Nachrichten erscheinen, Zahlen auf der Startseite ändern sich mit.

   ── Die Daten

   Die Standortnamen sind echt (aus `konfig.js`), alle Menschen,
   Nachrichten, Aufgaben und Zahlen sind erfunden. Erzeugt wird mit einem
   festen Startwert: zwei Aufrufe zeigen dieselbe Demo. Das ist kein
   Selbstzweck — wer zweimal dasselbe vorführt, will nicht beim zweiten
   Mal etwas anderes erklären müssen.

   ── Die Rolle

   `?demo=chef` (Voreinstellung), `?demo=leiter`, `?demo=mitarbeiter`.
   Der stärkste Moment einer Vorführung ist derselbe Bildschirm in einer
   anderen Rolle: der Chef sieht vierzehn Studios, der Mitarbeiter sein
   eigenes. Der Umschalter dafür sitzt in index.html.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Ohne ?demo tut diese Datei nichts. Sie wird in index.html auch nur
     dann überhaupt geladen — dieser Riegel ist die zweite Sperre, damit
     ein Versehen bei der Einbindung nicht die echte App ersetzt. */
  if (!/[?&]demo(=|&|$)/.test(location.search)) return;

  var ROLLE = (/[?&]demo=([a-z]+)/.exec(location.search) || [])[1] || 'chef';
  if (['chef', 'leiter', 'mitarbeiter', 'terminal'].indexOf(ROLLE) < 0) ROLLE = 'chef';

  /* ?demo=terminal macht aus dem Gerät die Stempeluhr am Empfang. Dafür
     liegt der Geräteschlüssel schon bereit — in einer Vorführung will
     niemand erst ein Terminal einrichten, um zu sehen, wie Stempeln
     aussieht.

     Der Weg ÜBER die Einrichtung ist trotzdem da und sehenswert: als
     Geschäftsführung unter Verwaltung → Studios. Wer beides zeigt, zeigt
     das ganze Bild. */
  var DEMO_PIN = '2946';
  var DEMO_TERMINAL = { id: 'demo-t6', geheim: 'demo'.repeat(16), name: 'Empfang' };
  /* Der Code fürs Handy steht in der Demo FEST. Im Betrieb wechselt er
     alle 30 Sekunden und wird auf dem Server gerechnet — hier gäbe das
     eine Vorführung, in der der Interessent tippt und dabei abläuft.
     Dass es nachgebaut ist und nicht echt, steht unten bei den
     Funktionen; niemand soll aus der Demo auf die Bauart schliessen. */
  var DEMO_CODE = '314159';
  if (ROLLE === 'terminal') {
    try {
      localStorage.setItem('kf_terminal', JSON.stringify(DEMO_TERMINAL));
    } catch (e) {}
  } else {
    /* Umgekehrt genauso wichtig: wer von „Terminal" zurück auf „Chef"
       schaltet, darf nicht in der Stempeluhr gefangen bleiben. */
    try { localStorage.removeItem('kf_terminal'); } catch (e) {}
  }

  var KENNUNG = 'koerperformen';
  var STUDIOS = [
    'Longerich', 'Nippes', 'Ebertplatz', 'Rath', 'Porz', 'Rondorf',
    'Hürth', 'Brühl', 'Niederkassel Mondorf', 'Refrath', 'Overath',
    'Marialinden', 'Rösrath', 'Seelscheid'
  ];
  function sk(i) { return 'studio-' + i; }

  /* Fester Startwert: dieselbe Demo bei jedem Aufruf. */
  var _z = 987654321;
  function zufall() { _z = (_z * 1103515245 + 12345) % 2147483648; return _z / 2147483648; }
  function waehle(a) { return a[Math.floor(zufall() * a.length)]; }
  function zahl(min, max) { return min + Math.floor(zufall() * (max - min + 1)); }
  var STD = 3600000, TAG = 86400000;
  function vorMin(n) { return Date.now() - n * 60000; }
  function vorStd(n) { return Date.now() - n * STD; }
  function vorTag(n) { return Date.now() - n * TAG; }
  function datum(n) {
    var d = new Date(); d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
      '-' + String(d.getDate()).padStart(2, '0');
  }
  /* Eine Uhrzeit von HEUTE. Stempel brauchen das: „vor drei Stunden"
     landet nach Mitternacht am Vortag, und dann steht in der Demo
     morgens niemand im Dienst. */
  function heuteUm(std, min) {
    var d = new Date(); d.setHours(std, min || 0, 0, 0);
    return d.getTime();
  }

  /* ── Erfundene Menschen ─────────────────────────────────────────────
     Bewusst gewöhnliche Namen und kein „Max Mustermann": eine Demo, in
     der alle Platzhalter heißen, sieht aus wie eine leere App. */
  var VORNAME = ['Lena', 'Jonas', 'Mira', 'Tobias', 'Nele', 'Sami', 'Carla',
    'Erik', 'Yara', 'Milan', 'Fine', 'Ruben', 'Alina', 'Kaspar',
    'Jette', 'Noah', 'Vera', 'Elias', 'Marlen', 'Timo', 'Sina',
    'Hendrik', 'Juna', 'Levi', 'Romy', 'Anton', 'Nora', 'Piet'];
  var NACHNAME = ['Brandt', 'Vogel', 'Sommer', 'Reinhardt', 'Lang', 'Böhm',
    'Keller', 'Winter', 'Haas', 'Schreiber', 'Kern', 'Ritter',
    'Falk', 'Stein', 'Adler', 'Berger'];

  var USERS = [];
  var ICH = null;
  (function leuteBauen() {
    var nr = 0;
    STUDIOS.forEach(function (name, i) {
      var wieViele = zahl(2, 4);
      for (var k = 0; k < wieViele; k++) {
        nr++;
        var rolle = k === 0 ? 'leiter' : 'mitarbeiter';
        USERS.push({
          id: 'demo-u' + nr,
          firma: KENNUNG,
          name: waehle(VORNAME) + ' ' + waehle(NACHNAME),
          role: rolle,
          aktiv: true,
          studios: [name],
          studioKeys: [sk(i)],
          avatar: waehle(['💪', '🏋️', '⚡', '🔥', '🌿', '☕', '🎧']),
          lastSeen: vorMin(zahl(1, 900))
        });
      }
    });
    /* Das Konto, mit dem der Betrachter unterwegs ist. Je nach Rolle
       sieht es einen anderen Ausschnitt — genau darum geht es. */
    if (ROLLE === 'chef') {
      ICH = {
        id: 'demo-ich', firma: KENNUNG, name: 'Demo-Geschäftsführung', role: 'chef',
        aktiv: true, handyStempeln: true, avatar: '💪',
        studios: STUDIOS.slice(), studioKeys: STUDIOS.map(function (_, i) { return sk(i); })
      };
    } else if (ROLLE === 'leiter') {
      ICH = {
        id: 'demo-ich', firma: KENNUNG, name: 'Demo-Studioleitung', role: 'leiter',
        aktiv: true, handyStempeln: true, avatar: '⚡',
        studios: [STUDIOS[6], STUDIOS[7]], studioKeys: [sk(6), sk(7)]
      };
    } else if (ROLLE === 'terminal') {
      /* Das Tablet am Empfang ist mit einem ganz normalen Konto des
         Betriebs angemeldet — genau so, wie es in Wirklichkeit läuft.
         Ein eigenes „Terminal-Konto" gibt es nicht und soll es nicht
         geben: der Schutz sitzt im Geräteschlüssel und in der PIN, nicht
         in einer Sonderrolle. */
      /* Ein ganz normaler Personenname und KEIN „Empfang Hürth".
         Zuerst hiess das Konto so — und stand damit als erste Kachel
         zwischen den Mitarbeitern, als waere das Tablet eine Person.
         Beim Nachsehen der Bilder aufgefallen, nicht beim Schreiben. */
      ICH = {
        id: 'demo-ich', firma: KENNUNG, name: 'Mara Velten', role: 'mitarbeiter',
        aktiv: true, handyStempeln: true, avatar: '🔥',
        studios: [STUDIOS[6]], studioKeys: [sk(6)]
      };
    } else {
      ICH = {
        id: 'demo-ich', firma: KENNUNG, name: 'Demo-Mitarbeiter', role: 'mitarbeiter',
        aktiv: true, handyStempeln: true, avatar: '🔥',
        studios: [STUDIOS[6]], studioKeys: [sk(6)]
      };
    }
    USERS.unshift(ICH);
  })();

  function leuteIn(studioKey) {
    return USERS.filter(function (u) {
      return u.id !== 'demo-ich' && (u.studioKeys || []).indexOf(studioKey) >= 0;
    });
  }
  function jemandIn(studioKey) {
    var l = leuteIn(studioKey);
    return l.length ? l[Math.floor(zufall() * l.length)] : ICH;
  }

  /* ── Der Speicher ───────────────────────────────────────────────────
     Ein Objekt, dessen Schlüssel der VOLLE Pfad ist:
       'firmen/koerperformen/studios/studio-6/todos' -> [ {…}, {…} ]
     Kein Abschneiden des Firmen-Vorsatzes wie in der Test-Attrappe: hier
     soll genau das laufen, was die App auch in Wirklichkeit tut. Wenn
     S() einen Pfad falsch baut, fällt es in der Demo auf. */
  var DB = {};
  var HORCHER = {};       // Pfad -> [callback]
  var EINZEL = {};        // Pfad/id -> [callback]  (Zuhörer auf ein Dokument)

  function P(name) { return 'firmen/' + KENNUNG + '/' + name; }
  function legen(pfad, liste) { DB[pfad] = liste; }
  function holen(pfad) { return DB[pfad] || (DB[pfad] = []); }

  function melden(pfad) {
    (HORCHER[pfad] || []).forEach(function (cb) {
      try { cb(schnapp(holen(pfad))); } catch (e) { console.error('Demo-Zuhörer', e); }
    });
    Object.keys(EINZEL).forEach(function (schl) {
      if (schl.indexOf(pfad + '/') !== 0) return;
      var id = schl.slice(pfad.length + 1);
      var d = holen(pfad).filter(function (x) { return x.id === id; })[0];
      EINZEL[schl].forEach(function (cb) {
        try { cb(einzelSchnapp(id, d)); } catch (e) { console.error('Demo-Zuhörer', e); }
      });
    });
  }

  function kopie(o) {
    var n = {};
    Object.keys(o).forEach(function (k) { if (k !== 'id') n[k] = o[k]; });
    return n;
  }
  /* `metadata` gehört dazu, auch wenn es hier nie etwas anderes sagt.
     Ohne das Feld war DIE GANZE MATERIAL-ANSICHT IN DER DEMO KAPUTT:
     `loadMaterial` liest `doc.metadata.hasPendingWrites`, um die eigene
     Eingabe nicht zu überschreiben — und stolperte über undefined.
     Null Zeilen, ein Fehler in der Konsole, und der Interessent sieht
     eine leere Seite.

     Gefunden beim Nachmessen der Klickwege, nicht von einem Durchlauf:
     test-demo prüft, was die Demo ANFASST, nicht, ob jede Ansicht
     etwas zeigt. Eine Attrappe, die nur die halbe Form eines Dokuments
     nachbaut, macht die Stellen kaputt, die die andere Hälfte lesen. */
  var METADATEN = { hasPendingWrites: false, fromCache: false };

  /* Eine FieldValue-Marke auf den alten Wert anwenden. Kennt die Marke
     nicht, ist der neue Wert einfach der neue Wert. */
  function markeEinloesen(alt, neu) {
    if (!neu || typeof neu !== 'object') return neu;
    if (Array.isArray(neu.__hinzu)) {
      var liste = Array.isArray(alt) ? alt.slice() : [];
      neu.__hinzu.forEach(function (w) { if (liste.indexOf(w) < 0) liste.push(w); });
      return liste;
    }
    if (Array.isArray(neu.__weg)) {
      var l2 = Array.isArray(alt) ? alt.slice() : [];
      return l2.filter(function (w) { return neu.__weg.indexOf(w) < 0; });
    }
    if (typeof neu.__increment === 'number') {
      return (typeof alt === 'number' ? alt : 0) + neu.__increment;
    }
    return neu;
  }
  function einzelSchnapp(id, d) {
    return { id: id, exists: !!d, metadata: METADATEN,
             data: function () { return d ? kopie(d) : undefined; } };
  }
  function schnapp(liste) {
    var docs = liste.map(function (d) {
      return {
        id: d.id, exists: true, metadata: METADATEN,
        data: function () { return kopie(d); },
        get: function (f) { return d[f]; }
      };
    });
    return {
      docs: docs, size: docs.length, empty: !docs.length, metadata: METADATEN,
      forEach: function (fn) { docs.forEach(fn); },
      /* docChanges: die App meldet damit neue Nachrichten. In der Demo
         ist beim ersten Schnappschuss alles „added", danach nur das
         wirklich Neue — mehr braucht sie nicht. */
      docChanges: function () {
        return docs.map(function (d) { return { type: 'added', doc: d }; });
      }
    };
  }

  var _nr = 0;
  function neueId() { return 'demo' + (++_nr) + '-' + Math.floor(zufall() * 100000); }

  /* ── Abfragen ───────────────────────────────────────────────────────
     where / orderBy / limit / limitToLast. Mehr benutzt die App nicht —
     nachgesehen, nicht angenommen: keine Transaktionen, keine Cursor,
     keine Sammlungsgruppen. */
  function anwenden(liste, f) {
    var r = liste.slice();
    (f.wo || []).forEach(function (w) {
      r = r.filter(function (d) {
        var v = d[w[0]], op = w[1], z = w[2];
        if (op === '==') return v === z;
        if (op === '!=') return v !== z;
        if (op === '>') return v > z;
        if (op === '>=') return v >= z;
        if (op === '<') return v < z;
        if (op === '<=') return v <= z;
        if (op === 'in') return Array.isArray(z) && z.indexOf(v) >= 0;
        if (op === 'not-in') return Array.isArray(z) && z.indexOf(v) < 0;
        if (op === 'array-contains') return Array.isArray(v) && v.indexOf(z) >= 0;
        if (op === 'array-contains-any') {
          return Array.isArray(v) && Array.isArray(z) && z.some(function (x) { return v.indexOf(x) >= 0; });
        }
        return true;
      });
    });
    if (f.sortier) {
      var feld = f.sortier[0], ab = f.sortier[1] === 'desc';
      r.sort(function (a, b) {
        var x = a[feld], y = b[feld];
        if (feld === '__name__') { x = a.id; y = b.id; }
        if (x === y) return 0;
        if (x === undefined || x === null) return 1;
        if (y === undefined || y === null) return -1;
        return (x < y ? -1 : 1) * (ab ? -1 : 1);
      });
    }
    if (f.grenze) r = r.slice(0, f.grenze);
    if (f.grenzeHinten) r = r.slice(Math.max(0, r.length - f.grenzeHinten));
    return r;
  }

  function abfrage(pfad, f) {
    f = f || {};
    function mit(neu) {
      var k = { wo: (f.wo || []).slice(), sortier: f.sortier, grenze: f.grenze, grenzeHinten: f.grenzeHinten };
      Object.keys(neu).forEach(function (s) { k[s] = neu[s]; });
      return abfrage(pfad, k);
    }
    return {
      _pfad: pfad,
      where: function (a, b, c) { return mit({ wo: (f.wo || []).concat([[a, b, c]]) }); },
      orderBy: function (a, b) { return mit({ sortier: [a, b || 'asc'] }); },
      limit: function (n) { return mit({ grenze: n }); },
      limitToLast: function (n) { return mit({ grenzeHinten: n }); },
      get: function () { return Promise.resolve(schnapp(anwenden(holen(pfad), f))); },
      onSnapshot: function (a, b) {
        var cb = typeof a === 'function' ? a : (a && a.next);
        if (!cb) return function () {};
        function feuern() { cb(schnapp(anwenden(holen(pfad), f))); }
        var huelle = function () { feuern(); };
        (HORCHER[pfad] = HORCHER[pfad] || []).push(huelle);
        setTimeout(feuern, 30);
        return function () {
          HORCHER[pfad] = (HORCHER[pfad] || []).filter(function (x) { return x !== huelle; });
        };
      },
      add: function (d) {
        var neu = Object.assign({ id: neueId() }, d);
        holen(pfad).push(neu);
        melden(pfad);
        return Promise.resolve({ id: neu.id });
      },
      doc: function (id) { return dokument(pfad, id); }
    };
  }

  function dokument(pfad, id) {
    if (id === undefined) id = neueId();
    var voll = pfad + '/' + id;
    return {
      id: id,
      _pfad: voll,
      collection: function (sub) { return abfrage(voll + '/' + sub); },
      get: function () {
        var d = holen(pfad).filter(function (x) { return x.id === id; })[0];
        return Promise.resolve(einzelSchnapp(id, d));
      },
      onSnapshot: function (a) {
        var cb = typeof a === 'function' ? a : (a && a.next);
        if (!cb) return function () {};
        function feuern() {
          var d = holen(pfad).filter(function (x) { return x.id === id; })[0];
          cb(einzelSchnapp(id, d));
        }
        (EINZEL[voll] = EINZEL[voll] || []).push(feuern);
        setTimeout(feuern, 30);
        return function () {
          EINZEL[voll] = (EINZEL[voll] || []).filter(function (x) { return x !== feuern; });
        };
      },
      set: function (d, opt) {
        var liste = holen(pfad);
        var i = liste.findIndex(function (x) { return x.id === id; });
        if (i < 0) liste.push(Object.assign({ id: id }, d));
        else if (opt && opt.merge) {
          /* Beim Verschmelzen dieselben Marken einloesen wie beim update —
             sonst haengt es vom Aufrufweg ab, ob arrayUnion wirkt. */
          Object.keys(d).forEach(function (k) {
            if (d[k] && d[k].__loeschen) delete liste[i][k];
            else liste[i][k] = markeEinloesen(liste[i][k], d[k]);
          });
        }
        else liste[i] = Object.assign({ id: id }, d);
        melden(pfad);
        return Promise.resolve();
      },
      update: function (d) {
        var liste = holen(pfad);
        var i = liste.findIndex(function (x) { return x.id === id; });
        if (i < 0) return Promise.reject(new Error('Dokument gibt es nicht'));
        Object.keys(d).forEach(function (k) {
          if (d[k] && d[k].__loeschen) delete liste[i][k];
          else liste[i][k] = markeEinloesen(liste[i][k], d[k]);
        });
        melden(pfad);
        return Promise.resolve();
      },
      delete: function () {
        DB[pfad] = holen(pfad).filter(function (x) { return x.id !== id; });
        melden(pfad);
        return Promise.resolve();
      }
    };
  }

  /* ══ Die Daten ══════════════════════════════════════════════════════ */

  /* ══ Der Abo-Zustand in der Demo ═════════════════════════════════════
     Bis zum 21.9.2026 kannte die Demo drei Werte (voll / nurlesen / zu)
     und nahm sie nur aus der Adresse entgegen. Beides war zu wenig:

     ERSTENS ist das nicht das Modell. Im Betrieb gibt es neun Zustaende,
     und die interessanten liegen dazwischen — die drei Mahnstufen, in
     denen noch gar nichts gesperrt ist und trotzdem etwas passiert.
     Wer nur „voll" und „zu" zeigen kann, zeigt das Abo-Modell nicht.

     ZWEITENS stand der Zusatz nirgends. Eine Einstellung, die es nur in
     der Adresszeile gibt, gibt es fuer den Benutzer nicht — aus dem
     Betrieb kam genau das zurueck.

     Die Liste hier ist die einzige Stelle: sie fuellt die Auswahl in der
     Demo-Leiste UND legt den Eintrag in der Datenbank an. Zwei Listen
     waeren zwei Wahrheiten. */
  var ABO_DEMO = [
    { id: 'test',       wort: 'Abo: Testphase' },
    { id: 'aktiv',      wort: 'Abo: bezahlt' },
    { id: 'gratis',     wort: 'Abo: dauerhaft gratis' },
    { id: 'faellig',    wort: 'Abo: Zahlung offen' },
    { id: 'mahnung1',   wort: 'Abo: 1. Mahnung' },
    { id: 'mahnung2',   wort: 'Abo: 2. Mahnung' },
    { id: 'nurlesen',   wort: 'Abo: nur noch lesen' },
    { id: 'zu',         wort: 'Abo: stillgelegt' },
    { id: 'gekuendigt', wort: 'Abo: gekündigt' },
    { id: 'keins',      wort: 'Kein Abo hinterlegt' }
  ];

  /* Dieselbe Rechnung wie aboZugriff() in functions/index.js. Sie steht
     hier ein zweites Mal, weil die Demo keinen Server hat — aber sie
     steht ABSICHTLICH so kurz, dass ein Unterschied auffiele. Wer die
     Liste dort aendert, aendert sie hier mit; tests/test-paywall.js
     faehrt beide Seiten gegeneinander. */
  function zugriffVon(status) {
    if (status === 'zu') return 'zu';
    if (status === 'nurlesen') return 'nurlesen';
    return 'voll';
  }

  /* Aufzaehlung statt Uebernahme: was aus einer Adresse kommt, gehoert
     geprueft, auch wenn es hier nur die Demo betrifft.

     'voll' bleibt gueltig, obwohl es kein Zustand des Modells ist —
     Links aus der Zeit davor sollen nicht ins Leere laufen. Es meint
     die Testphase, also den Zustand, in dem alles offen ist. */
  function aboAusAdresse() {
    try {
      var m = /[?&]abo=([a-z0-9]+)(&|$)/.exec(String(location.search || ''));
      if (!m) return 'test';
      if (m[1] === 'voll') return 'test';
      for (var i = 0; i < ABO_DEMO.length; i++) {
        if (ABO_DEMO[i].id === m[1]) return m[1];
      }
      return 'test';
    } catch (e) { return 'test'; }
  }

  legen('users', USERS.slice());
  legen(P('config'), [
    /* Öffnungszeiten sind gepflegt — ohne sie liesse sich in der Demo
       nicht zeigen, wofür sie da sind: „wie lange war der Laden
       unbeaufsichtigt" braucht sie als Bezug. Sonntag zu, wie üblich. */
    { id: 'studios', liste: STUDIOS.map(function (n, i) {
        return { id: sk(i), name: n, oeffnung: {
          mo: '07:00-21:00', di: '07:00-21:00', mi: '07:00-21:00',
          do: '07:00-21:00', fr: '07:00-21:00', sa: '09:00-15:00', so: ''
        } };
      }), naechste: STUDIOS.length },
    {
      id: 'marke', name: 'Körperformen', slogan: 'EMS-Training in Köln und Umgebung',
      /* Die rechtlichen Pflichtfelder bleiben in der Demo LEER und sagen
         das auch. Erfundene Angaben in ein Impressum zu schreiben wäre
         genau die Art Platzhalter, die schon einmal live gegangen ist. */
      demoHinweis: true
    },
    { id: 'features', schichtplan: true, putzplan: true, material: true, geraete: true,
      dokumente: true, probetraining: true, umfragen: true, nachweise: true },
    /* ── Die Zugriffsstufe ──
       Im Betrieb schreibt sie ausschliesslich der Server, abgeleitet
       aus dem Abo. In der Demo gibt es keinen Server, also wird sie
       aus demselben Zustand gerechnet, der auch die Abo-Karte fuellt.

       ABGELEITET, NICHT ZWEITES FELD: die Demo soll sich nicht
       widersprechen koennen. Eine App, die oben „nur noch lesen" zeigt
       und in der Verwaltung ein laufendes Abo, ist als Vorfuehrung
       schlimmer als gar keine.

       Die Testphase ist die Voreinstellung. Ein Besucher, der die Demo
       einfach oeffnet, sieht nie eine Sperre — die muss er in der
       Demo-Leiste ausdruecklich waehlen. */
    { id: 'zugriff', stufe: zugriffVon(aboAusAdresse()), stand: Date.now() }
  ]);

  /* Chat: ein allgemeiner Kanal, je Studio einer, dazu zwei Gruppen. */
  var SAETZE = [
    'Guten Morgen zusammen!', 'Die Lieferung ist da.', 'Wer kann heute Abend übernehmen?',
    'Handtücher sind knapp, ich habe nachbestellt.', 'Danke fürs Aufräumen gestern 🙏',
    'Kabine 2 ist wieder frei.', 'Neue Probetrainings-Termine stehen im Plan.',
    'Bitte denkt an die Desinfektion nach jedem Kunden.', 'Ich bin ab 14 Uhr da.',
    'Der Wasserspender läuft wieder.', 'Kurze Rückfrage zur Abrechnung.',
    'Bin heute 10 Minuten später, Bahn fällt aus.', 'Klappt, mache ich.',
    'Habe die Gurte geprüft, alles in Ordnung.', 'Kann jemand Samstag früh?'
  ];
  function nachrichtenFuer(kanal, wer, anzahl) {
    var r = [];
    for (var i = anzahl; i > 0; i--) {
      var u = wer[Math.floor(zufall() * wer.length)] || ICH;
      r.push({
        id: 'm-' + kanal + '-' + i, uid: u.id, name: u.name, role: u.role,
        studio: (u.studios || [])[0] || '', text: waehle(SAETZE),
        ts: vorMin(i * zahl(7, 40))
      });
    }
    return r;
  }
  legen(P('channels/allgemein/messages'), nachrichtenFuer('allgemein', USERS, 18));
  STUDIOS.forEach(function (n, i) {
    legen(P('channels/' + sk(i) + '/messages'), nachrichtenFuer(sk(i), leuteIn(sk(i)).concat([ICH]), zahl(4, 11)));
  });
  legen(P('channels/gruppe-leitung/messages'),
    nachrichtenFuer('leitung', USERS.filter(function (u) { return u.role !== 'mitarbeiter'; }), 7));

  /* Aufgaben, Putzplan, Geräte, Material, Schichten, Abwesenheiten,
     Übergaben — je Studio, mit unterschiedlichen Ständen, damit die
     Startseite etwas zu sagen hat. */
  var AUFGABEN = ['Geräte desinfizieren', 'Handtücher waschen', 'Wasserspender auffüllen',
    'Empfang aufräumen', 'Lager sortieren', 'Gurte prüfen', 'Probetrainings nachfassen',
    'Wäsche abholen', 'Getränke auffüllen', 'Fenster putzen'];
  var PUTZ = ['Böden wischen', 'Spiegel putzen', 'Toiletten reinigen', 'Kabinen auswischen',
    'Empfangstresen', 'Mülleimer leeren', 'Umkleiden'];
  var GERAETE = ['EMS-Gerät 1', 'EMS-Gerät 2', 'EMS-Gerät 3', 'Waschmaschine',
    'Trockner', 'Wasserspender', 'Musikanlage'];
  var POSTEN = ['Handtücher', 'Handschuhe', 'Desinfektionsmittel', 'Wasserflaschen',
    'Elektroden-Spray', 'Papierrollen', 'Müllbeutel'];

  STUDIOS.forEach(function (name, i) {
    var k = sk(i), leute = leuteIn(k);

    var todos = [];
    for (var a = 0; a < zahl(3, 7); a++) {
      var fertig = zufall() < 0.4;
      var wer = jemandIn(k);
      todos.push({
        id: 't-' + k + '-' + a, title: waehle(AUFGABEN), desc: '',
        done: fertig, doneBy: fertig ? wer.name : undefined,
        doneByUid: fertig ? wer.id : undefined,
        doneAt: fertig ? vorStd(zahl(1, 20)) : undefined,
        createdBy: 'Geschäftsführung', ts: vorTag(zahl(1, 20)),
        due: zufall() < 0.35 ? Date.now() + (zufall() < 0.4 ? -1 : 1) * zahl(1, 5) * TAG : undefined,
        dringend: zufall() < 0.15 ? true : undefined,
        recurring: zufall() < 0.25 ? waehle(['daily', 'weekly']) : undefined
      });
    }
    /* Eine Aufgabe, die NIEMANDEM gehört — damit „Ich übernehme das" in
       der Vorführung auch wirklich zu sehen ist. */
    todos.push({
      id: 't-' + k + '-frei', title: 'Neue Probetrainings einpflegen', desc: '',
      done: false, createdBy: 'Geschäftsführung', ts: vorTag(1)
    });
    legen(P('studios/' + k + '/todos'), todos);

    var putz = [];
    for (var c = 0; c < zahl(4, 7); c++) {
      var pf = zufall() < 0.5, pw = jemandIn(k);
      putz.push({
        id: 'c-' + k + '-' + c, title: waehle(PUTZ),
        recurring: waehle(['daily', 'weekly']),
        done: pf, doneBy: pf ? pw.name : undefined, doneByUid: pf ? pw.id : undefined,
        doneAt: pf ? vorStd(zahl(1, 10)) : undefined,
        ts: vorTag(zahl(10, 60))
      });
    }
    legen(P('studios/' + k + '/cleaning'), putz);

    var dev = [];
    for (var g = 0; g < zahl(3, 6); g++) {
      var zustand = zufall() < 0.12 ? 'defekt' : (zufall() < 0.12 ? 'wartung' : 'ok');
      var gw = jemandIn(k);
      dev.push({
        id: 'd-' + k + '-' + g, name: GERAETE[g % GERAETE.length],
        place: waehle(['Kabine links', 'Kabine rechts', 'Lager', 'Empfang']),
        status: zustand,
        lastNote: zustand === 'ok' ? undefined : waehle(['Weste links gibt keinen Impuls', 'Filter reinigen', 'Macht Geräusche']),
        lastBy: zustand === 'ok' ? undefined : gw.name,
        lastAt: zustand === 'ok' ? undefined : vorStd(zahl(2, 60)),
        ts: vorTag(zahl(30, 300))
      });
    }
    legen(P('studios/' + k + '/devices'), dev);

    var schichten = [];
    for (var t = 0; t < 7; t++) {
      for (var s = 0; s < zahl(1, 3); s++) {
        var su = jemandIn(k);
        schichten.push({
          id: 's-' + k + '-' + t + '-' + s, date: datum(t),
          from: waehle(['06:00', '09:00', '13:00', '16:00']),
          to: waehle(['12:00', '15:00', '18:00', '21:00']),
          uid: su.id, name: su.name
        });
      }
    }
    /* Eine eigene Schicht heute — sonst steht „Mein Dienst" leer und die
       wichtigste Karte der Startseite sagt in der Vorführung nichts. */
    if ((ICH.studioKeys || []).indexOf(k) >= 0) {
      schichten.push({ id: 's-' + k + '-ich', date: datum(0), from: '09:00', to: '14:00',
        uid: ICH.id, name: ICH.name });
    }
    legen(P('studios/' + k + '/shifts'), schichten);

    var abw = [];
    for (var v = 0; v < zahl(0, 2); v++) {
      var au = jemandIn(k);
      abw.push({
        id: 'v-' + k + '-' + v, from: datum(zahl(2, 20)), to: datum(zahl(21, 30)),
        type: waehle(['urlaub', 'krank']), uid: au.id, name: au.name,
        status: waehle(['offen', 'genehmigt']), ts: vorTag(zahl(1, 8))
      });
    }
    legen(P('studios/' + k + '/absences'), abw);

    var ueb = [];
    for (var h = 0; h < zahl(0, 2); h++) {
      var hu = jemandIn(k);
      ueb.push({
        id: 'h-' + k + '-' + h,
        text: waehle(['Rechte Beinpresse hakt beim Zurückfahren — Technik ist informiert.',
          'Neue Handtücher liegen im Lager hinten links.',
          'Schlüssel für den Putzschrank liegt jetzt im Tresor.',
          'Kundin hat Termin auf Donnerstag verschoben.']),
        uid: hu.id, name: hu.name, ts: vorStd(zahl(1, 20))
      });
    }
    legen(P('studios/' + k + '/handovers'), ueb);

    var posten = [];
    for (var m = 0; m < zahl(4, 7); m++) {
      var grenze = waehle([6, 10, 20, 24]);
      posten.push({ name: POSTEN[m % POSTEN.length], have: zahl(0, grenze + 6), limit: grenze, need: 0 });
    }
    DB[P('inventory')] = DB[P('inventory')] || [];
    DB[P('inventory')].push({ id: k, items: posten });
  });

  /* Schwarzes Brett, Aushänge, Nachweise, Probetrainings, Dokumente */
  var brett = [];
  for (var b = 0; b < 9; b++) {
    var bu = USERS[Math.floor(zufall() * USERS.length)];
    brett.push({
      id: 'b' + b, uid: bu.id, name: bu.name,
      text: waehle(['Suche Tausch für Samstagfrüh.', 'Fundsache: schwarze Trinkflasche am Empfang.',
        'Teamabend am 30., wer kommt mit?', 'Parkausweise sind da, bitte abholen.',
        'Neue Musikliste liegt auf dem Rechner.']),
      ts: vorTag(zahl(0, 9))
    });
  }
  legen(P('board'), brett);

  legen(P('announcements'), [
    { id: 'an1', uid: ICH.id, from: 'Geschäftsführung', target: 'all', pinned: true,
      text: 'Neue Öffnungszeiten ab Montag: 7–21 Uhr in allen Studios.',
      ts: vorTag(3), readBy: [] },
    { id: 'an2', uid: ICH.id, from: 'Geschäftsführung', target: sk(6),
      text: 'Bitte die Gurte nach jedem Training desinfizieren.',
      ts: vorStd(5), readBy: [] }
  ]);

  var nachweise = [];
  USERS.slice(0, 14).forEach(function (u, i) {
    nachweise.push({
      id: 'z' + i, uid: u.id, name: u.name,
      art: waehle(['ersthelfer', 'ems', 'trainer']),
      bis: datum(zahl(-20, 400)), ts: vorTag(zahl(30, 400))
    });
  });
  legen(P('certificates'), nachweise);

  var probe = [];
  STUDIOS.forEach(function (n, i) {
    for (var p = 0; p < zahl(2, 8); p++) {
      var pu = jemandIn(sk(i));
      /* `ts` und `erfasstVonName` fehlten hier, obwohl die App sie beim
         Eintragen setzt (index.html, probeSpeichern). Aufgefallen ist
         es erst, als der Export die Sammlung mitnahm: er sortiert nach
         `ts`, und Firestore laesst Dokumente OHNE das sortierte Feld
         ganz weg. In der Demo fiel das nicht auf — die Attrappe nimmt
         orderBy nicht so genau —, im Betrieb waere die Tabelle leer
         geblieben, ohne Fehlermeldung.

         Eine Demo, deren Datensaetze anders aussehen als die echten,
         prueft die falsche Sache. */
      var wann = vorTag(zahl(0, 28));
      probe.push({
        id: 'p-' + i + '-' + p, studioKey: sk(i), datum: wann, ts: wann,
        abschluss: zufall() < 0.45, vonUid: pu.id, vonName: pu.name,
        notiz: '', erfasstVon: pu.id, erfasstVonName: pu.name
      });
    }
  });
  legen(P('probetrainings'), probe);

  /* ── Anliegen ──
     Gab es in der Demo bisher gar nicht: die Sammlung blieb leer, und
     damit war der ganze Bereich „Anliegen" unvorfuehrbar — und im
     Export nicht pruefbar. Ein Zustand, den man nicht herbeifuehren
     kann, wird auch nicht geprueft.

     Drei Stueck, und zwar in allen drei Zustaenden, die es gibt: offen
     an die Geschaeftsfuehrung, offen an die Studioleitung, beantwortet.
     Eines davon vom angemeldeten Konto selbst — sonst saehe der
     Mitarbeiter in „meine Anliegen" nichts. */
  (function anliegenBauen(){
    var leiterIn = USERS.filter(function (u) { return u.role === 'leiter'; })[0] || ICH;
    legen(P('anliegen'), [
      { id: 'anl1', uid: ICH.id, name: ICH.name, an: 'chef', status: 'offen',
        titel: 'Zweiter Wäschekorb für die Kabine',
        text: 'Der eine läuft an Spitzentagen über, und dann liegt alles daneben.',
        ts: vorTag(3), quelle: { sammlung: 'ideen', id: 'i-demo-1' } },
      { id: 'anl2', uid: leiterIn.id, name: leiterIn.name, an: 'leiter',
        studioKey: (leiterIn.studioKeys || [])[0] || sk(0), status: 'offen',
        titel: 'Schichttausch Freitag',
        text: 'Ich könnte Freitag früher anfangen, wenn jemand den Abend übernimmt.',
        ts: vorTag(1), quelle: { sammlung: 'ziele', id: 'z-demo-1' } },
      { id: 'anl3', uid: ICH.id, name: ICH.name, an: 'chef', status: 'beantwortet',
        titel: 'Neue Handtücher',
        text: 'Die alten fusseln stark.',
        antwort: 'Bestellt, kommen nächste Woche.',
        antwortVon: 'Geschäftsführung', antwortAm: vorTag(5),
        ts: vorTag(9), quelle: { sammlung: 'ideen', id: 'i-demo-2' } }
    ]);
  })();

  legen(P('documents'), [
    { id: 'dok1', name: 'Hygieneplan 2026', fileName: 'hygieneplan.pdf', kat: 'Vorschriften',
      size: 184000, ts: vorTag(40), by: 'Geschäftsführung' },
    { id: 'dok2', name: 'Einweisung EMS-Gerät', fileName: 'einweisung.pdf', kat: 'Technik',
      size: 96000, ts: vorTag(120), by: 'Geschäftsführung' },
    { id: 'dok3', name: 'Notfallnummern', fileName: 'notfall.pdf', kat: 'Vorschriften',
      size: 21000, ts: vorTag(200), by: 'Geschäftsführung' }
  ]);

  /* ── Zeiterfassung in der Demo ──────────────────────────────────────
     Drei eingerichtete Terminals und die Stempel von heute. Ohne Stempel
     stünde in der Vorführung überall „noch nicht da", und der
     interessanteste Teil — wer ist im Haus, wer in der Pause — bliebe
     unsichtbar. */
  var HEUTE = new Date().toLocaleDateString('sv-SE');
  legen(P('terminals'), [
    { id: DEMO_TERMINAL.id, studioKey: sk(6), name: 'Empfang',
      hash: 'demo', angelegtAm: vorTag(40), angelegtVon: 'Demo-Geschäftsführung',
      letzterStempel: vorStd(1) },
    { id: 'demo-t7', studioKey: sk(7), name: 'Tablet Empfang',
      hash: 'demo', angelegtAm: vorTag(38), angelegtVon: 'Demo-Geschäftsführung',
      letzterStempel: vorStd(3) },
    { id: 'demo-t0', studioKey: sk(0), name: 'Rechner Büro',
      hash: 'demo', angelegtAm: vorTag(35), angelegtVon: 'Demo-Geschäftsführung',
      letzterStempel: 0 }
  ]);

  var STEMPEL = [];
  (function stempelBauen() {
    var nr = 0;
    /* `monat` gehört an JEDEN Stempel. „Meine Zeiten" liest monatsweise
       über zwei Gleichheitsfilter — ein Datensatz ohne das Feld ist
       dort unsichtbar, ohne dass irgendwo ein Fehler erscheint. */
    function stempel(u, k, art, ts, tag, term) {
      STEMPEL.push({ id: 'zt' + (++nr), uid: u.id, name: u.name, studioKey: k,
        art: art, ts: ts, tag: tag, monat: tag.slice(0, 7), fremd: false,
        terminalId: term, terminalName: 'Empfang' });
    }

    STUDIOS.forEach(function (name, i) {
      var k = sk(i);
      leuteIn(k).forEach(function (u, j) {
        /* Nicht alle sind da: in einem Studio arbeiten selten alle
           gleichzeitig, und eine Demo, in der jeder eingestempelt ist,
           zeigt den Normalfall nicht. */
        if (zufall() < 0.35) return;
        var start = 7 + zahl(0, 5);
        stempel(u, k, 'kommen', heuteUm(start, zahl(0, 55)), HEUTE, 'demo-t' + i);
        if (j === 0 && zufall() < 0.5) {
          stempel(u, k, 'pause', heuteUm(start + 4, zahl(0, 30)), HEUTE, 'demo-t' + i);
        }
      });
    });

    /* ── Die eigene Vorgeschichte ──
       Ohne sie stünde „Meine Zeiten" in der Vorführung leer da, und
       eine leere Karte zeigt nicht, was die Funktion kann. 45 Tage
       zurück, damit auch das Zurückblättern in den Vormonat etwas
       findet.

       EIN TAG BLEIBT ABSICHTLICH OFFEN (vor acht Tagen, kein „gehen").
       Genau daran zeigt sich, dass die App keine Zahl erfindet, wo die
       Endzeit fehlt — das ist der Teil, den ein Chef sehen will. */
    var meinStudio = (ICH.studioKeys || [])[0] || sk(6);
    var eigen = 0;
    for (var d = 45; d >= 1; d--) {
      var tagD = new Date(); tagD.setDate(tagD.getDate() - d);
      var wt = tagD.getDay();
      if (wt === 0) continue;                       // sonntags zu
      if (zufall() < 0.25) continue;                // frei, krank, Urlaub
      var tag = tagD.toLocaleDateString('sv-SE');
      function um(std, min) {
        var x = new Date(tagD); x.setHours(std, min, 0, 0); return x.getTime();
      }
      var an = 8 + zahl(0, 1);
      stempel(ICH, meinStudio, 'kommen', um(an, zahl(0, 50)), tag, 'demo-t6');
      if (d === 8) continue;                        // der vergessene Feierabend
      stempel(ICH, meinStudio, 'pause', um(an + 4, zahl(0, 20)), tag, 'demo-t6');
      stempel(ICH, meinStudio, 'zurueck', um(an + 4, 30 + zahl(0, 15)), tag, 'demo-t6');
      stempel(ICH, meinStudio, 'gehen', um(an + 8, zahl(0, 40)), tag, 'demo-t6');
      eigen++;
    }
    void eigen;
  })();
  legen(P('zeiten'), STEMPEL);

  legen('firmen', [{ id: KENNUNG, name: 'Körperformen', aktiv: true, kennung: KENNUNG }]);
  /* ── Das Abo in der Demo ──
     Hier stand `stufe: 'A'` — ein Wert, den es im Abo-Modell gar nicht
     gibt (die Stufen heissen basic und premium). Aufgefallen ist es
     erst, als die Abo-Karte gebaut wurde: sie zeigte „Basic · " mit
     einem Trennzeichen und nichts dahinter. Altbestand aus der Zeit,
     als der Eintrag nur herumlag und niemand ihn las.

     Der Zustand haengt jetzt an derselben Adresse wie die
     Zugriffsstufe, damit die Demo sich nicht widerspricht: eine App,
     die „nur noch lesen" anzeigt und daneben ein laufendes Abo, ist
     als Vorfuehrung schlimmer als gar keine. */
  /* Jeder Zustand braucht die Felder, aus denen die Abo-Karte ihre
     zweite Zeile baut — sonst steht dort eine Ueberschrift und nichts
     darunter, und die Vorfuehrung zeigt eine halb gefuellte Karte.

     Die Tage entsprechen der langen Mahnleiter aus functions/index.js
     (0 / 7 / 14 / 21 / 35). Das ist kein Zierrat: wer in der Demo
     „2. Mahnung" waehlt, soll „Seit 14 Tagen" lesen und nicht eine
     erfundene Zahl. */
  var ABO_STAND = aboAusAdresse();
  function aboEintrag(status) {
    var tag = 86400000, jetzt = Date.now();
    var e = { id: 'aktuell', stufe: 'premium', status: status, seit: vorTag(40) };
    if (status === 'test')            { e.bisAm = jetzt + 21 * tag; e.netto = 0; }
    else if (status === 'aktiv')      { e.bisAm = jetzt + 12 * tag; e.netto = 374; e.kunde = 'cus_demo'; }
    else if (status === 'gratis')     { e.netto = 0; }
    else if (status === 'gekuendigt') { e.bisAm = jetzt + 9 * tag; e.netto = 374; e.kunde = 'cus_demo'; }
    else if (status === 'faellig')    { e.offenSeit = jetzt;             e.netto = 374; e.kunde = 'cus_demo'; }
    else if (status === 'mahnung1')   { e.offenSeit = jetzt -  7 * tag;  e.netto = 374; e.kunde = 'cus_demo'; }
    else if (status === 'mahnung2')   { e.offenSeit = jetzt - 14 * tag;  e.netto = 374; e.kunde = 'cus_demo'; }
    else if (status === 'nurlesen')   { e.offenSeit = jetzt - 21 * tag;  e.netto = 374; e.kunde = 'cus_demo'; }
    else if (status === 'zu')         { e.offenSeit = jetzt - 35 * tag;  e.netto = 374; e.kunde = 'cus_demo'; }
    return e;
  }
  /* 'keins' legt KEINEN Eintrag an — das ist der Zustand jedes heutigen
     Bestandskunden, und er ist der wichtigste von allen: kein Eintrag
     muss „alles freigeschaltet" heissen und darf nicht wie ein Fehler
     aussehen. Ein Zustand, den man nicht vorfuehren kann, wird auch
     nicht geprueft. */
  legen(P('abo'), ABO_STAND === 'keins' ? [] : [aboEintrag(ABO_STAND)]);

  /* ══ Server-Funktionen in der Demo ══════════════════════════════════
     Die meisten gibt es hier nicht, und das sagt die Demo auch: was auf
     dem Server läuft, verschickt E-Mails oder legt Konten an, und beides
     gehört nicht in eine Vorführung.

     DREI AUSNAHMEN, und zwar die der Zeiterfassung. Ohne sie wäre der
     Stempel-Knopf ein Knopf, der nichts tut — und wer in einer Demo
     abhakt und nichts passiert, hält nicht die Demo für kaputt, sondern
     die App. Derselbe Satz wie beim Bau dieser Datei.

     NACHGEBAUT WIRD DER WEG, NICHT DIE SICHERHEIT. Das echte `stempeln`
     prüft drei Schlüssel gegen die Datenbank und rechnet scrypt; hier
     wird eine feste Demo-PIN verglichen. Das ist in Ordnung, weil hier
     nichts zu schützen ist — und es gehört gesagt, damit niemand aus der
     Demo auf die Bauart schliesst. */
  var DEMO_FUNKTIONEN = {
    /* ── Die zwei Wege zur Kasse ──
       Sie fuehren im Betrieb zu Stripe, und Stripe gibt es in der Demo
       nicht. Bis zum 21.9.2026 fielen sie deshalb in die allgemeine
       Abfuhr — „wuerde auf dem Server ausgefuehrt und zum Beispiel
       E-Mails verschicken". Das ist fuer die Kasse schlicht falsch (sie
       verschickt keine Mail) und half niemandem weiter: der Knopf sah
       aus wie kaputt.

       Sie werfen jetzt, statt etwas vorzutaeuschen. EINE ATTRAPPE WAERE
       HIER DAS FALSCHE: wer in einer Vorfuehrung auf eine nachgebaute
       Bezahlseite klickt, haelt sie fuer die echte und schliesst aus
       ihr auf Sicherheit, Preise und Ablauf. Der Satz sagt stattdessen,
       was passieren WUERDE — und wo man den Zustand danach ansieht. */
    stripeKasse: function () {
      throw new Error(
        'In der Demo führt das nicht zu Stripe. Im Betrieb öffnet sich hier ' +
        'die Bezahlseite von Stripe; Kartendaten sehen wir nie. Wie es danach ' +
        'aussieht, zeigt oben in der Demo-Leiste „Abo: bezahlt".');
    },
    stripeVerwaltung: function () {
      throw new Error(
        'In der Demo führt das nicht zu Stripe. Im Betrieb öffnet sich hier ' +
        'das Kundenportal von Stripe: Rechnungen, Zahlungsmittel, kündigen. ' +
        'Gekündigt sieht so aus wie oben „Abo: gekündigt".');
    },
    pinStatus: function () {
      return { gesetzt: true, seit: Date.now() - 40 * TAG };
    },
    pinSetzen: function (d) {
      if (!/^\d{4,6}$/.test(String(d.pin || ''))) {
        throw new Error('Die PIN muss aus 4 bis 6 Ziffern bestehen.');
      }
      return { ok: true, gesetzt: true };
    },
    terminalAnlegen: function (d) {
      var name = String(d.name || '').trim();
      if (!name) throw new Error('Bitte dem Gerät einen Namen geben.');
      var id = 'demo-neu-' + Math.floor(zufall() * 100000);
      holen(P('terminals')).push({
        id: id, studioKey: String(d.studioKey || ''), name: name,
        hash: 'demo', angelegtAm: Date.now(),
        angelegtVon: ICH.name, letzterStempel: 0
      });
      melden(P('terminals'));
      /* Auch in der Demo nur EINMAL sichtbar — sonst lernt der
         Interessent eine Bauart, die es nicht gibt. */
      return { id: id, name: name, geheim: 'demo' + 'x'.repeat(60) };
    },
    terminalEntfernen: function (d) {
      var pfad = P('terminals');
      DB[pfad] = holen(pfad).filter(function (t) { return t.id !== String(d.id || ''); });
      melden(pfad);
      return { ok: true };
    },
    /* Ein Vorrat aus lauter demselben Code. Im Betrieb kommen zehn
       verschiedene, je 30 Sekunden gültig, gerechnet aus einer Saat,
       die in einer für alle gesperrten Sammlung liegt. */
    stempelCodes: function () {
      var codes = [];
      for (var i = 0; i < 10; i++) codes.push(DEMO_CODE);
      return {
        codes: codes, serverZeit: Date.now(),
        abFenster: Math.floor(Date.now() / 30000), fensterMs: 30000
      };
    },
    handyStempeln: function (d) {
      if (ICH.handyStempeln !== true) {
        throw new Error('Für dieses Konto ist das Stempeln mit dem Handy nicht freigeschaltet.');
      }
      if (String(d.code || '').replace(/\D/g, '') !== DEMO_CODE) {
        throw new Error('Dieser Code stimmt nicht mehr. In dieser Demo ist er ' +
          DEMO_CODE + '.');
      }
      var studioKey = (ICH.studioKeys || [])[0] || sk(6);
      var tag = new Date().toLocaleDateString('sv-SE');
      var meine = holen(P('zeiten'))
        .filter(function (z) { return z.uid === ICH.id && z.tag === tag; })
        .sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
      var letzte = meine.length ? meine[meine.length - 1].art : null;
      var art = (!letzte || letzte === 'gehen') ? 'kommen'
              : (letzte === 'kommen' || letzte === 'zurueck') ? 'pause'
              : (letzte === 'pause') ? 'zurueck' : 'kommen';
      var jetzt = Date.now();
      holen(P('zeiten')).push({
        id: neueId(), uid: ICH.id, name: ICH.name || '', studioKey: studioKey,
        art: art, ts: jetzt, tag: tag, monat: tag.slice(0, 7), fremd: false,
        quelle: 'handy', terminalId: DEMO_TERMINAL.id, terminalName: DEMO_TERMINAL.name
      });
      melden(P('zeiten'));
      return { ok: true, art: art, ts: jetzt, name: ICH.name || '', studioKey: studioKey };
    },
    stempeln: function (d) {
      var term = holen(P('terminals'))
        .filter(function (t) { return t.id === String(d.terminalId || ''); })[0];
      if (!term) throw new Error('Dieses Gerät ist nicht (mehr) als Terminal eingerichtet.');
      if (String(d.pin || '') !== DEMO_PIN) {
        throw new Error('Falsche PIN. In dieser Demo ist sie ' + DEMO_PIN + '.');
      }
      var person = USERS.filter(function (u) { return u.id === String(d.uid || ''); })[0];
      if (!person) throw new Error('Diese Person gibt es nicht.');

      var tag = new Date().toLocaleDateString('sv-SE');
      var meine = holen(P('zeiten'))
        .filter(function (z) { return z.uid === person.id && z.tag === tag; })
        .sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
      var letzte = meine.length ? meine[meine.length - 1].art : null;
      var art = (!letzte || letzte === 'gehen') ? 'kommen'
              : (letzte === 'kommen' || letzte === 'zurueck') ? 'pause'
              : (letzte === 'pause') ? 'zurueck' : 'kommen';

      var jetzt = Date.now();
      var fremd = (person.studioKeys || []).indexOf(term.studioKey) < 0;
      holen(P('zeiten')).push({
        id: neueId(), uid: person.id, name: person.name || '',
        studioKey: term.studioKey, art: art, ts: jetzt, tag: tag,
        /* monat und fremd wie beim echten `stempeln` — ohne monat wäre
           der frisch gesetzte Stempel in „Meine Zeiten" unsichtbar. */
        monat: tag.slice(0, 7), fremd: fremd,
        terminalId: term.id, terminalName: term.name || ''
      });
      melden(P('zeiten'));
      term.letzterStempel = jetzt;
      melden(P('terminals'));
      return { ok: true, art: art, ts: jetzt, name: person.name || '', fremd: fremd };
    }
  };

  function demoAufruf(name, daten) {
    var f = DEMO_FUNKTIONEN[name];
    if (!f) {
      return Promise.reject(new Error(
        'Das läuft in der Demo nicht: „' + name + '" würde auf dem Server ausgeführt ' +
        'und zum Beispiel E-Mails verschicken.'));
    }
    try { return Promise.resolve({ data: f(daten) }); }
    catch (e) { return Promise.reject(e); }
  }

  /* ══ Das gefälschte Firebase ════════════════════════════════════════ */
  var fs = {
    settings: function () {},
    enablePersistence: function () { return Promise.resolve(); },
    collection: function (p) { return abfrage(p); },
    batch: function () {
      var auftraege = [];
      return {
        set: function (ref, d, o) { auftraege.push(function () { return ref.set(d, o); }); },
        update: function (ref, d) { auftraege.push(function () { return ref.update(d); }); },
        delete: function (ref) { auftraege.push(function () { return ref.delete(); }); },
        commit: function () {
          /* Ein Stapel schreibt wirklich — sonst tut in der Vorführung
             genau das nichts, was mehrere Studios auf einmal betrifft
             (Putzaufgabe an alle, Dokument als Aufgabe verteilen). */
          return Promise.all(auftraege.map(function (f) { return f(); }));
        }
      };
    }
  };

  /* emailVerified: true — sonst mahnt die App oben „Bitte bestätige
     demo@studiochat.example, die Mail ist unterwegs". In einer
     Vorführung ohne Konto ist das Unsinn, und es steht quer über dem
     ersten Eindruck. Es fehlte schlicht: `u.emailVerified` war
     undefined, und die Leiste prüft auf wahr. */
  var KONTO = { uid: ICH.id, email: 'demo@studiochat.example',
                displayName: ICH.name, emailVerified: true };

  window.firebase = {
    apps: [],
    initializeApp: function () { return { firestore: function () { return fs; } }; },
    app: function () {
      return { firestore: function () { return fs; }, functions: function () { return window.firebase.functions(); } };
    },
    firestore: function () { return fs; },
    auth: function () {
      return {
        currentUser: KONTO,
        onAuthStateChanged: function (cb) { setTimeout(function () { cb(KONTO); }, 40); return function () {}; },
        signInWithEmailAndPassword: function () { return Promise.resolve({ user: KONTO }); },
        createUserWithEmailAndPassword: function () {
          return Promise.reject(new Error('In der Demo lassen sich keine Konten anlegen.'));
        },
        sendPasswordResetEmail: function () { return Promise.resolve(); },
        setPersistence: function () { return Promise.resolve(); },
        signOut: function () {
          /* Abmelden führt aus der Demo heraus, nicht in einen leeren
             Anmeldebildschirm: sonst steht der Interessent vor einer
             Maske, in die er sich nicht einloggen kann. */
          location.href = location.pathname;
          return new Promise(function () {});
        }
      };
    },
    functions: function () {
      return { httpsCallable: function (name) { return function (d) { return demoAufruf(name, d || {}); }; } };
    },
    messaging: function () { return { onMessage: function () {}, getToken: function () { return Promise.resolve(''); } }; },
    storage: function () { return { ref: function () { return {}; } }; }
  };
  /* Die Marken von FieldValue — und zwar solche, die auch AUSGEWERTET
     werden. Bis zum 15.9. gab arrayUnion ein leeres Objekt zurück, das
     ungeprüft ins Feld geschrieben wurde. Danach war `readBy` kein
     Feld mehr, sondern `{}` — und die App fiel über
     `(a.readBy||[]).indexOf(...)`. Bei Leitung und Mitarbeiter, also
     genau bei den Rollen, die Aushänge lesen.

     Eine Attrappe, die eine Marke erzeugt und nicht einlöst, ist
     schlimmer als eine, die die Funktion gar nicht kennt: der Aufruf
     geht scheinbar durch und hinterlässt Unsinn. */
  firebase.firestore.FieldValue = {
    serverTimestamp: function () { return Date.now(); },
    increment: function (n) { return { __increment: n }; },
    arrayUnion: function () { return { __hinzu: [].slice.call(arguments) }; },
    arrayRemove: function () { return { __weg: [].slice.call(arguments) }; },
    delete: function () { return { __loeschen: true }; }
  };
  firebase.firestore.FieldPath = { documentId: function () { return '__name__'; } };
  firebase.auth.Auth = { Persistence: { LOCAL: 'local', SESSION: 'session', NONE: 'none' } };
  firebase.messaging.isSupported = function () { return false; };

  /* ══ Die Oberfläche der Demo ════════════════════════════════════════ */

  window.__demo = { rolle: ROLLE, name: ICH.name, studios: (ICH.studios || []).length };

  /* Die Klasse steht auf <html> und schaltet die Leiste ein. Sie wird
     HIER gesetzt und nicht im Markup: so kann es die Leiste ohne ?demo
     gar nicht geben, auch nicht für einen Wimpernschlag beim Laden. */
  document.documentElement.classList.add('demo');

  /* Nicht in den Suchergebnissen. Die Demo ist zum Verschicken da, nicht
     zum Gefundenwerden: eine Seite voller erfundener Aufgaben unter dem
     Namen Körperformen wäre in einer Suche das Gegenteil von hilfreich.
     Ein Meta-Element, das erst ein Skript setzt, ist keine Garantie —
     robots.txt sperrt zusätzlich, und der Link wird ohnehin nur
     weitergegeben. Beides zusammen, keins allein. */
  try {
    var mr = document.createElement('meta');
    mr.name = 'robots';
    mr.content = 'noindex, nofollow';
    document.head.appendChild(mr);
  } catch (e) {}

  document.addEventListener('DOMContentLoaded', function () {
    /* Im Terminal-Modus muss dastehen, welche PIN gilt. Ohne das tippt
       ein Interessent dreimal daneben und hält die Demo für kaputt —
       der teuerste Moment einer Vorführung. Gesetzt wird der Text HIER
       und nicht in index.html: die App soll von der Demo nichts wissen. */
    if (ROLLE === 'terminal') {
      var h = document.getElementById('tmHinweis');
      if (h) h.textContent = 'Demo: Name antippen, dann PIN ' + DEMO_PIN + ' eingeben.';

      /* „Terminal beenden" räumt den Schlüssel weg und lädt neu — in der
         Demo würde ihn diese Datei sofort wieder hinlegen, weil ?demo=
         terminal ja noch in der Adresse steht. Eine Schleife.

         Der Knopf bekommt deshalb hier eine andere Aufgabe. Ersetzt wird
         der ganze Knoten, weil das der einzige Weg ist, den Zuhörer der
         App loszuwerden, ohne sie selbst zu ändern. */
      var aus = document.getElementById('tmAus');
      if (aus) {
        var neu = aus.cloneNode(true);
        neu.textContent = 'Zurück zur App';
        neu.addEventListener('click', function () { location.search = '?demo=chef'; });
        aus.parentNode.replaceChild(neu, aus);
      }
    }

    /* Dasselbe für den Handy-Code: in der Demo steht er fest, und das
       muss dastehen. Sonst tippt der Interessent den ab, den das
       Terminal anzeigt — und der ist in der Demo derselbe, aber das
       weiss er nicht. Gesetzt wird das Feld gleich mit: eine Demo, in
       der man den Knopf sofort drücken kann, zeigt mehr als eine, in
       der man erst sechs Ziffern abtippt. */
    var hinw = document.querySelector('#ichHandyKarte .hint');
    if (hinw) {
      hinw.textContent = 'Demo: der Code lautet ' + DEMO_CODE +
        '. Im Betrieb steht er auf dem Bildschirm im Studio und wechselt ' +
        'alle 30 Sekunden.';
    }
    var feld = document.getElementById('ichHandyCode');
    if (feld) feld.value = DEMO_CODE;

    /* ── Die zwei Schalter der Demo-Leiste ──
       Beide laden neu statt umzubauen. Rolle und Abo-Zustand
       entscheiden, welche Studios, welche Kanäle und welche Knöpfe es
       überhaupt gibt — das im laufenden Betrieb umzustellen wäre ein
       zweiter, eigener Programmzustand, den niemand außer der Demo je
       benutzt. Ein Neuladen dauert eine Sekunde und kann nicht halb
       misslingen.

       BEIDE WERTE REISEN MIT. Vorher hiess es hier
       `location.search = '?demo=' + sel.value` — und damit fiel ein
       gewählter Abo-Zustand beim Rollenwechsel lautlos weg. Genau der
       Wechsel ist aber das Interessante: dieselbe Sperre einmal als
       Chef und einmal als Mitarbeiter, denn die App sagt beiden etwas
       anderes. */
    function neuLaden(rolle, abo) {
      location.search = '?demo=' + encodeURIComponent(rolle) +
                        '&abo=' + encodeURIComponent(abo);
    }

    var sel = document.getElementById('demoRolle');
    var aboSel = document.getElementById('demoAbo');

    if (aboSel) {
      aboSel.innerHTML = ABO_DEMO.map(function (z) {
        return '<option value="' + z.id + '">' + z.wort + '</option>';
      }).join('');
      aboSel.value = ABO_STAND;
      aboSel.addEventListener('change', function () {
        neuLaden(ROLLE, aboSel.value);
      });
    }

    if (!sel) return;
    sel.value = ROLLE;
    sel.addEventListener('change', function () {
      neuLaden(sel.value, ABO_STAND);
    });
  });
})();
