/* Minimaler Firebase-Ersatz, nur zum Ansehen der Oberfläche im Test.
   Simuliert einen angemeldeten Chef und leere Sammlungen. */
(function () {
  function unsub() { return function () {}; }
  /* Antwortverzoegerung, damit sich der LADEZUSTAND ueberhaupt pruefen
     laesst. Ohne sie antwortet die Attrappe sofort, und jeder Durchlauf
     ueber „was steht da, bevor die Daten kommen" misst nichts.
     window.__langsam = Millisekunden, vor dem Laden gesetzt. */
  function spaeter(fn) {
    var ms = +(window.__langsam || 0);
    if (ms > 0) { setTimeout(fn, ms); return; }
    fn();
  }
  function makeSnap(docs) {
    docs = docs || [];
    return {
      docs: docs, empty: !docs.length, size: docs.length,
      forEach: function (f) { docs.forEach(f); },
      docChanges: function () { return []; }
    };
  }
  /* Schichten und Abwesenheiten liegen relativ zu HEUTE. Mit festen Daten
     lief der Test irgendwann ins Leere: am 8. August war die Schicht vom
     7. August Vergangenheit, und „Ich kann nicht" erschien nicht mehr. */
  function tag(n) {
    var d = new Date(); d.setDate(d.getDate() + (n || 0));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
      '-' + String(d.getDate()).padStart(2, '0');
  }

  /* window.__admin (vor dem Laden gesetzt) macht daraus den Betreiber.
     Der Reiter „🏛 Firmen" haengt an diesem einen Feld — admin ist
     bewusst KEIN Rollenwert, sondern ein Zusatz: der Betreiber bleibt
     Chef seiner eigenen Firma. */
  var PROFILE = {
    name: 'Test Chef', role: 'chef', studios: ['Hürth', 'Brühl'],
    studio: 'Hürth', avatar: '💪', color: '#00E06E',
    firma: 'koerperformen'
  };
  if (window.__admin) PROFILE.admin = true;
  /* window.__firma macht daraus das Konto einer FREMDEN Firma. Gebraucht
     wird das dort, wo eigeneFirma() den Unterschied macht — bei der
     Studioliste und beim Impressum darf ein anderer Betrieb nichts von
     Körperformen zu sehen bekommen. */
  if (window.__firma) PROFILE.firma = window.__firma;
    /* firma an JEDEM Konto — so sieht es nach tools/firma-nachtragen.js
     aus. Ohne das Feld findet die gefilterte Abfrage in
     listenAllUsers() nichts und die Personenliste bleibt leer; deshalb
     muss das Nachtragen vor dem Ausrollen laufen. */
var USERS = [
    { id:'testuid', firma:'koerperformen', name:'Test Chef', role:'chef', studios:['Hürth','Brühl'] },
    { id:'u2', firma:'koerperformen', name:'Anna Meier', role:'mitarbeiter', studios:['Hürth'], studioKeys:['studio-6'], lastSeen:Date.now()-60000 },
    { id:'u3', firma:'koerperformen', name:'Ben Kraus', role:'leiter', studios:['Brühl'], studioKeys:['studio-7'], lastSeen:Date.now()-3600000 },
    { id:'u4', firma:'koerperformen', name:'Alt-Konto Test', role:'chef', email:'test1@example.com' },
    { id:'u5', firma:'koerperformen', name:'', role:'chef', email:'test2@example.com' }
  ];
  var MESSAGES = [
    { id:'m1', uid:'u2', name:'Anna Meier', role:'mitarbeiter', studio:'Hürth',
      text:'Guten Morgen zusammen!', ts:Date.now()-7200000,
      reactions:{'👍':['u3','testuid'],'🎉':['u3']} },
    { id:'m2', uid:'u3', name:'Ben Kraus', role:'leiter', studio:'Brühl',
      text:'@TestChef kannst du bitte die Handtücher nachbestellen?', ts:Date.now()-3600000,
      mentions:['testuid'] },
    { id:'m3', uid:'testuid', name:'Test Chef', role:'chef',
      text:'Klar, mache ich heute.', ts:Date.now()-600000, editedAt:Date.now()-500000,
      replyTo:'m2', replyName:'Ben Kraus', replyText:'kannst du bitte die Handtücher nachbestellen?', pinned:true },
    { id:'m4', uid:'u2', name:'Anna Meier', role:'mitarbeiter', studio:'Hürth',
      text:'', ts:Date.now()-300000,
      audio:'data:audio/webm;codecs=opus;base64,GkXfo0AgQoaBAULygQ==', audioMs:14000 },
    { id:'m5', uid:'u3', name:'Ben Kraus', role:'leiter', studio:'Brühl',
      text:'', ts:Date.now()-120000,
      poll:{ q:'Wer kann Samstag früh?', opts:['Ich kann','Ich kann nicht','Nur ab 10 Uhr'] },
      votes:{ u2:0, u3:2 } },
    // Direkt hinterher, dieselbe Person: muss gruppiert werden (kein zweiter Kopf)
    { id:'m6', uid:'u3', name:'Ben Kraus', role:'leiter', studio:'Brühl',
      text:'Sagt bitte kurz Bescheid.', ts:Date.now()-60000 }
  ];
  var TODOS = {
    'studio-6': [
      { id: 't1', title: 'Geräte desinfizieren', desc: 'Nach jedem Training', done: false, createdBy: 'Chef', ts: Date.now() - 90000000, due: Date.now() - 86400000, steps:[{t:'Geräte abwischen',d:true},{t:'Gurte prüfen',d:false},{t:'Kabel aufrollen',d:false}] },
      { id: 't2', title: 'Handtücher waschen', desc: '', done: true, doneBy: 'Anna', doneAt: Date.now() - 3000, createdBy: 'Chef', ts: Date.now() - 80000000 },
      { id: 't3', title: 'Wasserspender auffüllen', desc: 'Beide Spender', done: false, createdBy: 'Chef', ts: Date.now() - 70000000, recurring: 'daily' },
      // Aus einer Defektmeldung entstanden: traegt die Geraete-Kennung. Eine
      // ZWEITE Meldung zu demselben Geraet darf keine zweite Aufgabe anlegen.
      { id: 't5', title: '🔧 EMS-Gerät 2 defekt', desc: 'Weste links gibt keinen Impuls', devId: 'd2',
        done: false, createdBy: 'Anna Meier', ts: Date.now() - 7200000 }
    ],
    'studio-7': [
      { id: 't4', title: 'Empfang aufräumen', desc: '', done: false, createdBy: 'Chef', ts: Date.now() - 60000000 }
    ]
  };
  var CLEAN = {
    'studio-6': [
      { id:'c1', title:'Böden wischen', recurring:'daily', done:true, doneBy:'Anna', doneAt:Date.now()-5400000, ts:Date.now()-90000000 },
      /* c2 laesst sich ueber window.__ppPause pausieren — so kann ein
         Durchlauf den Zustand pruefen, ohne erst zu klicken. */
      { id:'c2', title:'Spiegel putzen', recurring:'weekly', done:false, ts:Date.now()-80000000,
        pausiertBis: (window.__ppPause && window.__ppPause.id==='c2') ? window.__ppPause.bis : null },
      { id:'c3', title:'Toiletten reinigen', recurring:'daily', done:false, ts:Date.now()-70000000 },
      // einmalig, vor 30 Stunden abgehakt -> muss verschwunden sein
      { id:'c4', title:'Fenster putzen (alt)', done:true, doneBy:'Ben', doneAt:Date.now()-30*3600000, ts:Date.now()-60000000 },
      // einmalig, vor 2 Stunden abgehakt -> muss noch stehen
      { id:'c5', title:'Lager aufräumen', done:true, doneBy:'Anna', doneAt:Date.now()-2*3600000, ts:Date.now()-50000000 },
      // einmalig, NICHT erledigt -> bleibt, egal wie alt
      { id:'c6', title:'Vorhänge waschen', done:false, ts:Date.now()-200*3600000 }
    ]
  };
  var DEVICES = {
    'studio-6': [
      { id:'d1', name:'EMS-Gerät 1', place:'Kabine links', status:'ok', ts:Date.now()-90000000 },
      { id:'d2', name:'EMS-Gerät 2', place:'Kabine rechts', status:'defekt',
        lastNote:'Weste links gibt keinen Impuls', lastBy:'Anna Meier', lastAt:Date.now()-7200000, ts:Date.now()-90000000 },
      { id:'d3', name:'Waschmaschine', place:'Lager', status:'wartung',
        lastNote:'Filter reinigen', lastBy:'Ben Kraus', lastAt:Date.now()-86400000, ts:Date.now()-90000000 }
    ]
  };
  var DEVLOG = {
    'studio-6': [
      { id:'l1', devId:'d2', devName:'EMS-Gerät 2', art:'defekt', text:'Weste links gibt keinen Impuls',
        by:'Anna Meier', byUid:'u2', ts:Date.now()-7200000 },
      { id:'l2', devId:'d2', devName:'EMS-Gerät 2', art:'behoben', text:'Kabel getauscht',
        by:'Ben Kraus', byUid:'u3', ts:Date.now()-30*86400000 },
      { id:'l3', devId:'d2', devName:'EMS-Gerät 2', art:'defekt', text:'Gleiches Problem wieder',
        by:'Anna Meier', byUid:'u2', ts:Date.now()-60*86400000 },
      { id:'l4', devId:'d2', devName:'EMS-Gerät 2', art:'defekt', text:'Und nochmal',
        by:'Anna Meier', byUid:'u2', ts:Date.now()-80*86400000 },
      { id:'l5', devId:'d3', devName:'Waschmaschine', art:'wartung', text:'Filter reinigen',
        by:'Ben Kraus', byUid:'u3', ts:Date.now()-86400000 }
    ]
  };
  var CLEANNOTES = {
    'studio-6': [
      { id:'n1', text:'Wischmopp ist kaputt, bitte neuen bestellen.', by:'Anna', byUid:'u2', ts:Date.now()-3600000 },
      { id:'n2', text:'Reinigungsmittel fast leer.', by:'Ben', byUid:'u3', ts:Date.now()-7200000 }
    ]
  };
  var ARCHIVES = [
    { id:'2026-KW31', week:'2026-KW31', label:'27.07.–02.08.2026', updatedAt:Date.now()-7*86400000,
      material:{'studio-6':[{name:'Handtücher',have:12,limit:20,need:8},{name:'Desinfektion',have:5,limit:5,need:0}]},
      cleaning:{'studio-6':{tasks:[{title:'Böden wischen',rep:'täglich',status:'erledigt',by:'Anna',at:'01.08. 14:30 Uhr'}],notes:[{text:'Mopp kaputt',by:'Anna',at:'01.08. 09:00 Uhr'}]}} },
    { id:'2026-KW32', week:'2026-KW32', label:'03.08.–09.08.2026', updatedAt:Date.now()-3600000,
      material:{'studio-6':[{name:'Handtücher',have:20,limit:20,need:0}]},
      cleaning:{'studio-6':{tasks:[{title:'Spiegel putzen',rep:'wöchentlich',status:'offen',by:'',at:''}],notes:[]}} }
  ];
  var INVENTORY = {
    'studio-6': { items:[
      {name:'Handtücher', have:12, limit:20, need:0},
      {name:'Handschuhe', have:4, limit:10, need:0},
      {name:'Desinfektionsmittel', have:2, limit:6, need:0},
      {name:'Wasserflaschen', have:30, limit:24, need:0}
    ]},
    'studio-7': { items:[
      {name:'Handtücher', have:5, limit:20, need:0},
      {name:'Desinfektionsmittel', have:1, limit:6, need:0}
    ]}
  };
  var ANNS = [
    { id:'a1', uid:'testuid', from:'Test Chef', text:'Neue Öffnungszeiten ab Montag: 7–21 Uhr.',
      target:'all', ts:Date.now()-4*86400000, pinned:true, readBy:['u2'] },
    { id:'a2', uid:'testuid', from:'Test Chef', text:'Bitte die Gurte nach jedem Training desinfizieren.',
      target:'studio-6', ts:Date.now()-2*3600000, readBy:[] }
  ];
  /* Probetrainings: bewusst mit unterschiedlichen Quoten je Studio und
     je Person, damit ein Durchlauf die Rechnung wirklich pruefen kann
     und nicht nur, dass ueberhaupt etwas dasteht. */
  var PROBE = [
    { id:'p1', studioKey:'studio-6', datum:Date.now()-2*86400000, abschluss:true,  vonUid:'u2', vonName:'Anna Meier' },
    { id:'p2', studioKey:'studio-6', datum:Date.now()-3*86400000, abschluss:true,  vonUid:'u2', vonName:'Anna Meier' },
    { id:'p3', studioKey:'studio-6', datum:Date.now()-4*86400000, abschluss:false, vonUid:'u2', vonName:'Anna Meier' },
    { id:'p4', studioKey:'studio-6', datum:Date.now()-5*86400000, abschluss:false, vonUid:'u3', vonName:'Ben Kraus' },
    { id:'p5', studioKey:'studio-7', datum:Date.now()-6*86400000, abschluss:true,  vonUid:'u3', vonName:'Ben Kraus' },
    /* Aelter als 30 Tage: faellt aus dem Standard-Zeitraum heraus. */
    { id:'p6', studioKey:'studio-7', datum:Date.now()-60*86400000, abschluss:false, vonUid:'u3', vonName:'Ben Kraus' },
    /* Vom Empfang eingetragen, auf eine andere Person gebucht. */
    { id:'p7', studioKey:'studio-6', datum:Date.now()-1*86400000, abschluss:true, vonUid:'u3', vonName:'Ben Kraus',
      erfasstVon:'testuid', erfasstVonName:'Test Chef' },
    /* Ohne Konto: nur ein Name. Zaehlt trotzdem als eigene Person. */
    { id:'p8', studioKey:'studio-6', datum:Date.now()-2*86400000, abschluss:true, vonUid:null, vonName:'Marcel',
      erfasstVon:'testuid', erfasstVonName:'Test Chef' },
    { id:'p9', studioKey:'studio-7', datum:Date.now()-3*86400000, abschluss:false, vonUid:null, vonName:'marcel ',
      erfasstVon:'testuid', erfasstVonName:'Test Chef' }
  ];
  var ABSENCES = {
    'studio-6': [
      { id:'a1', from:tag(13), to:tag(21), type:'urlaub', uid:'u2', name:'Anna Meier',
        status:'offen', note:'Sommerurlaub', ts:Date.now()-86400000 },
      { id:'a2', from:tag(3), to:tag(4), type:'krank', uid:'u3', name:'Ben Kraus',
        status:'genehmigt', ts:Date.now()-3600000 },
      { id:'a3', from:tag(25), to:tag(29), type:'urlaub', uid:'u3', name:'Ben Kraus',
        status:'genehmigt', decidedBy:'Test Chef', decidedAt:Date.now()-7200000, ts:Date.now()-172800000 }
    ]
  };
  // Drei Wochen-Sicherungen mit sinkenden Beständen → Vorhersage rechenbar
  var ARCH_HIST = [
    { id:'2026-KW29', week:'2026-KW29', label:'13.07.–19.07.2026', updatedAt:Date.now()-21*86400000,
      material:{'studio-6':[{name:'Handtücher',have:30,limit:20},{name:'Handschuhe',have:20,limit:10},{name:'Desinfektionsmittel',have:10,limit:6}]},
      cleaning:{} },
    { id:'2026-KW30', week:'2026-KW30', label:'20.07.–26.07.2026', updatedAt:Date.now()-14*86400000,
      material:{'studio-6':[{name:'Handtücher',have:24,limit:20},{name:'Handschuhe',have:14,limit:10},{name:'Desinfektionsmittel',have:7,limit:6}]},
      cleaning:{} },
    { id:'2026-KW31b', week:'2026-KW31b', label:'27.07.–02.08.2026', updatedAt:Date.now()-7*86400000,
      material:{'studio-6':[{name:'Handtücher',have:18,limit:20},{name:'Handschuhe',have:9,limit:10},{name:'Desinfektionsmittel',have:4,limit:6}]},
      cleaning:{} }
  ];
  var DOCS = [
    { id:'d1', name:'Hygieneplan 2026', kind:'file', size:120000, cat:'hygiene', studios:'all', ts:Date.now()-86400000, uploadedBy:'Chef' },
    { id:'d2', name:'Gerätewartung Anleitung', kind:'link', url:'https://example.com', cat:'technik', studios:'all', ts:Date.now()-172800000, uploadedBy:'Chef' },
    { id:'d3', name:'Arbeitsvertrag Muster', kind:'file', size:88000, cat:'personal', studios:'all', ts:Date.now()-259200000, uploadedBy:'Chef' }
  ];
  /* Übergaben. Gab es hier bisher gar nicht — HANDOVERS wurde an zwei
     Stellen abgefragt und war nirgends definiert, der Wächter
     `typeof HANDOVERS !== 'undefined'` hat das stillschweigend
     geschluckt. Seit die Übergabe auf der Startseite steht, braucht es
     echte Daten.

     Bewusst gemischt: eine FREMDE (muss als ungelesen zählen), eine
     EIGENE (darf es nicht — wer sie selbst geschrieben hat, braucht
     keinen Punkt), eine ALTE (älter als sieben Tage, fällt raus) und
     eine aus einem ZWEITEN Studio (zeigt, dass die Startseite über alle
     eigenen Studios geht, nicht nur über das im Team-Bereich gewählte). */
  var HANDOVERS = {
    'studio-6': [
      { id:'h1', text:'Rechte Beinpresse hakt beim Zurückfahren — Technik ist informiert.',
        uid:'u2', name:'Anna Meier', ts:Date.now()-2*3600000 },
      { id:'h2', text:'Neue Handtücher liegen im Lager hinten links.',
        uid:'testuid', name:'Test Chef', ts:Date.now()-5*3600000 },
      { id:'h3', text:'Uralte Übergabe, darf nicht mehr auftauchen.',
        uid:'u3', name:'Ben Kraus', ts:Date.now()-9*86400000 },
      /* Der Eintrag, der die 24-Stunden-Grenze WIRKLICH prüft.
         „Uralt" mit neun Tagen fiele auch bei einem Sieben-Tage-Fenster
         raus — mit ihm allein wäre die Verkürzung von sieben Tagen auf
         einen Tag ungeprüft geblieben. Dieser hier ist drei Tage alt:
         vorher sichtbar, jetzt nicht mehr. */
      { id:'h5', text:'Drei Tage alt — bei sieben Tagen sichtbar, bei einem nicht.',
        uid:'u3', name:'Ben Kraus', ts:Date.now()-3*86400000 }
    ],
    'studio-7': [
      /* Bewusst die NEUESTE von allen. Die Startseite zeigt nur die
         zwei jüngsten; läge diese hier auf Platz drei, käme sie nie ins
         Bild — und die Behauptung „es gehen alle eigenen Studios ein"
         wäre nicht mehr zu prüfen, sondern nur noch zu hoffen. */
      { id:'h4', text:'Schlüssel für den Putzschrank liegt jetzt im Tresor.',
        uid:'u3', name:'Ben Kraus', ts:Date.now()-1*3600000 }
    ]
  };
  var SHIFTS = {
    'studio-6': [
      // eigene Schicht -> "Ich kann nicht" muss erscheinen
      { id:'s1', date:tag(0), from:'09:00', to:'14:00', uid:'testuid', name:'Ich' },
      // fremde, ausgeschriebene Schicht -> "Ich uebernehme"
      { id:'s2', date:tag(0), from:'16:00', to:'21:00', uid:'u2', name:'Anna Meier',
        tausch:'offen', tauschVon:'u2', tauschTs:Date.now()-3600000 },
      // jemand hat zugesagt -> wartet auf die Leitung
      { id:'s3', date:tag(0), from:'06:00', to:'09:00', uid:'u3', name:'Ben Kraus',
        tausch:'zugesagt', tauschNeu:{ uid:'u2', name:'Anna Meier' }, tauschTs:Date.now()-1800000 }
    ],
    'studio-7': [
      { id:'s4', date:tag(0), from:'10:00', to:'15:00', uid:'testuid', name:'Ich' }
    ]
  };
  /* Ein Durchlauf kann die Nachweise ersetzen, indem er vorher
     window.__certs hinlegt — sonst gilt diese Liste. Ohne das liesse sich
     nicht pruefen, was mit „selbst eingetragen", „bestaetigt" und den
     freiwilligen Angaben passiert: die stehen hier absichtlich nicht
     drin, damit die uebrigen Durchlaeufe den alten Zustand sehen. */
  var CERTS = [
    { id:'z1', uid:'u2', name:'Anna Meier', art:'ersthelfer', bis:tag(-10), ts:Date.now() },
    { id:'z2', uid:'u3', name:'Ben Kraus',  art:'ems',        bis:tag(29), ts:Date.now() },
    { id:'z3', uid:'testuid', name:'Ich',   art:'trainer',    bis:tag(399), ts:Date.now() },
    { id:'z4', uid:'u2', name:'Anna Meier', art:'sonstiges', bez:'Ernaehrungsberater', bis:tag(119), ts:Date.now() }
  ];
  // Stand der naechtlichen Sicherung: hier absichtlich GESCHEITERT, damit der
  // Test sieht, dass die App den Grund nennt statt zu schweigen.
  var SICHERUNG = {
    ts: Date.now() - 9 * 3600000,
    ok: false,
    ziel: '',
    fehler: 'Der Speicher formenchat.firebasestorage.app wurde nicht gefunden. ' +
      'In der Firebase-Konsole unter „Storage" einmal einrichten.'
  };
  /* ── Der Firmen-Vorsatz ──
     Die App schickt jeden Zugriff durch S(), und das liefert
     'firmen/koerperformen/config' statt 'config'. Diese Attrappe bildet
     die Daten flach ab — der Aufbau der Testdaten hat mit der
     Mandantentrennung nichts zu tun.

     Der Vorsatz wird deshalb hier an EINER Stelle abgeschnitten, statt
     in jeder Testdatei. */
  function collection(path) {
    path = String(path).replace(/^firmen\/[^/]+\//, '');
    return {
      _p: path,
      doc: function (id) {
        var docPath = path + '/' + id;
        return {
          /* Der Pfad muss AM Verweis haengen, nicht nur im Verschluss:
             ein Stapelschreiben (db.batch) bekommt genau dieses Objekt
             und sonst nichts. Ohne das Feld konnte die Attrappe nicht
             sagen, WOHIN ein Stapel geschrieben haette. */
          _pfad: docPath,
          /* Der Weg, den S() nimmt: db.collection('firmen').doc(k)
             .collection('todos'). Der landet NICHT bei fs.collection —
             und damit auch nicht bei den Attrappen, die einzelne Tests
             dort einhängen. Deshalb geht es für den Firmen-Vorsatz
             durch dieselbe Tür wie ein flacher Zugriff. Ohne das prüfen
             sechs Tests still an sich selbst vorbei. */
          collection: function (sub) {
            var mf = /^firmen\/([^/]+)$/.exec(docPath);
            /* abo MUSS je Firma antworten. Die Weiche darunter wirft den
               Firmen-Vorsatz weg — richtig für die Testdaten, die flach
               liegen, aber hier würden sich zwei Kunden ein Abo teilen.
               Also vorher abfangen. */
            if (mf && sub === 'abo') {
              var kennung = mf[1];
              return {
                doc: function () {
                  return {
                    get: function () {
                      var a = (window.__abos || {})[kennung];
                      return Promise.resolve({
                        exists: !!a, id: 'aktuell',
                        data: function () { return a || {}; }
                      });
                    },
                    set: function () { return Promise.resolve(); },
                    onSnapshot: function () { return unsub(); }
                  };
                }
              };
            }
            if (mf && fs && fs.collection) return fs.collection(sub);
            return collection(docPath + '/' + sub);
          },
          get: function () {
            var data = (path === 'users') ? PROFILE : {};
            if (path === 'config' && id === 'sicherung') {
              return Promise.resolve({ exists: true, id: id, data: function () { return SICHERUNG; } });
            }
            /* Studioliste und Firmencode. Beides gab es hier bisher
               nicht — die Durchläufe kamen mit der Liste aus konfig.js
               aus. Die Einrichtungs-Karte fragt aber genau danach: sind
               die Studios noch „Studio 1"? Ist ein Code gesetzt? */
            if (path === 'config' && id === 'studios' && window.__studios) {
              var st = window.__studios;
              return Promise.resolve({ exists: true, id: id,
                data: function () { return st; } });
            }
            if (path === 'config' && id === 'registrierung') {
              /* __regKaputt bildet den Normalfall im Betrieb nach: das
                 Dokument ist fuer niemanden lesbar ausser dem Chef, und
                 ein Fehlschlag muss anders behandelt werden als „leer". */
              if (window.__regKaputt) return Promise.reject(new Error('permission-denied'));
              var rc = window.__regCode;
              return Promise.resolve({ exists: rc !== null && rc !== undefined, id: id,
                data: function () { return { code: rc || '', freigabe: !!rc }; } });
            }
            /* Abgeschaltete Funktionen. Ohne __features gibt es das
               Dokument NICHT — und genau das ist der Normalfall, den
               jeder andere Durchlauf voraussetzt: alles an. */
            if (path === 'config' && id === 'features') {
              var f = window.__features;
              return Promise.resolve({ exists: !!f, id: id,
                data: function () { return f || {}; } });
            }
            /* Farbe der Firma. Ohne __marke gibt es das Dokument NICHT —
               und das ist der Normalfall: heute hat kein Betrieb einen
               Eintrag, und die App darf dann nichts umfaerben. */
            /* Das Firmendokument selbst — daraus kommt der ANZEIGENAME
               fuer Anmeldebildschirm, Fenstertitel, Ausdrucke und
               Bestellmail. */
            if (path === 'firmen') {
              return Promise.resolve({ exists: true, id: id, data: function () {
                return { name: window.__firmaName || 'Körperformen', aktiv: true };
              } });
            }
            if (path === 'config' && id === 'marke') {
              var mk = window.__marke;
              return Promise.resolve({ exists: !!mk, id: id,
                data: function () { return mk || {}; } });
            }
            /* Das eigene privat/<uid>-Dokument. Darin steht seit dem
               19.8. der Gelesen-Stand für Übergabe und Brett. Ohne
               __privatDoc gibt es das Dokument NICHT — und das ist der
               Normalfall: dann gilt alles als ungelesen, was die
               harmlosere Richtung ist. */
            if (path === 'privat') {
              var pd = window.__privatDoc;
              return Promise.resolve({ exists: !!pd, id: id,
                data: function () { return pd || {}; } });
            }
            /* Impressum/Datenschutz je Firma. Ohne __recht gibt es das
               Dokument NICHT — das ist der Normalfall, auf dem jeder
               andere Durchlauf steht: dann gilt der Rückfall auf
               konfig.js, und zwar nur für die eigene Firma. */
            if (path === 'config' && id === 'recht') {
              var rr = window.__recht;
              return Promise.resolve({ exists: !!rr, id: id,
                data: function () { return rr || {}; } });
            }
            if (path === 'archives') { var a=ARCHIVES.filter(function(x){return x.id===id;})[0]; return Promise.resolve({ exists: !!a, id:id, data: function(){ return a||{}; } }); }
            return Promise.resolve({ exists: true, id: id, data: function () { return data; } });
          },
          /* Geschriebenes merken. Ohne das kann ein Durchlauf nur pruefen,
             dass ein Knopf klickbar war — nicht, WAS in der Datenbank
             landet. Beim Impressum ist genau das die Frage. */
          set: function (d) {
            (window.__schreib = window.__schreib || []).push({ pfad: docPath, daten: d });
            return Promise.resolve();
          },
          /* update() merkt sich seit dem 18.8. ebenfalls mit — und zwar
             getrennt von set(), weil der Unterschied zaehlt: ein
             Kalendereintrag, der beim Aendern per set() geschrieben
             wird, verliert alle Felder, die im Formular gerade nicht
             gefuellt sind. Ohne diese Zeile koennte ein Durchlauf das
             nicht auseinanderhalten. */
          update: function (d) {
            (window.__schreib = window.__schreib || [])
              .push({ pfad: docPath, art: 'update', daten: d });
            return Promise.resolve();
          },
          delete: function () {
            (window.__schreib = window.__schreib || [])
              .push({ pfad: docPath, art: 'delete' });
            return Promise.resolve();
          },
          onSnapshot: function (cb) {
            if (path === 'inventory') {
              var inv = INVENTORY[id];
              try { cb({ exists: !!inv, id:id, metadata:{hasPendingWrites:false}, data: function(){ return inv || {items:[]}; } }); } catch (e) { console.error(e); }
              return unsub();
            }
            if (path === 'config' && id === 'features') {
              var ff = window.__features;
              try { cb({ exists: !!ff, id:id, metadata:{hasPendingWrites:false},
                         data: function(){ return ff || {}; } }); } catch (e) {}
              return unsub();
            }
            try { cb({ exists: false, metadata:{hasPendingWrites:false}, data: function () { return {}; } }); } catch (e) {}
            return unsub();
          }
        };
      },
      // Einfacher Gleichheits-Filter, damit Abfragen wie
      // .where('status','==','defekt') im Test auch wirklich filtern.
      where: function (feld, op, wert) {
        var k = collection(path);
        k._filter = (this._filter || []).concat(
          op === '==' ? [{ f: feld, v: wert }] : []);
        return k;
      },
      orderBy: function () { return this; },
      limit: function () { return this; },
      limitToLast: function () { return this; },
      /* Auch add() festhalten, nicht nur set(): sonst kann ein
         Durchlauf nur pruefen, dass ein Knopf klickbar war — nicht, WAS
         angelegt wird. Bei der eigenen Aufgabe des Mitarbeiters ist
         genau das die Frage (createdByUid fehlt -> Regel weist ab). */
      add: function (d) {
        (window.__schreib = window.__schreib || []).push({ pfad: path + '/(neu)', daten: d });
        return Promise.resolve({ id: 'neu' });
      },
      get: function () {
        // Dieselben Sammlungen wie bei onSnapshot bedienen. Sonst sieht ein
        // Test, der einmalig liest (z. B. der Tabellen-Abgleich), nichts.
        var ms = /^studios\/(.+)\/shifts$/.exec(path);
        var gc = /^studios\/(.+)\/cleaning$/.exec(path);
        var gn = /^studios\/(.+)\/cleaningNotes$/.exec(path);
        var gd = /^studios\/(.+)\/devices$/.exec(path);
        var gl = /^studios\/(.+)\/deviceLog$/.exec(path);
        var gt = /^studios\/(.+)\/todos$/.exec(path);
        var ga = /^studios\/(.+)\/absences$/.exec(path);
        /* Chat und Brett fehlten hier, obwohl onSnapshot sie kennt. Wer
           EINMALIG liest — die vollstaendige Sicherung tut genau das —
           bekam eine leere Antwort und haette daraus geschlossen, in der
           App fehle etwas. Der Durchlauf test-sicherung-inhalt.js ist
           genau darauf gestossen. */
        /* Eigene Termine, To-dos und Notizen aus „Mein Bereich".
           Nur wenn ein Durchlauf window.__privat vorher hinlegt — sonst
           saehen alle anderen ploetzlich Eintraege, wo sie einen leeren
           Zustand erwarten. */
        var gp = /^privat\/[^/]+\/(termine|notizen|aufgaben|ziele)$/.exec(path);
        if (gp) {
          var pl = ((window.__privat || {})[gp[1]] || []);
          return Promise.resolve(makeSnap(pl.map(function (d) {
            return { id: d.id, data: function () { return d; } };
          })));
        }
        var gm = /^channels\/(.+)\/messages$/.exec(path);
        var gh = /^studios\/(.+)\/handovers$/.exec(path);
        var list = gm ? (gm[1] === 'allgemein' ? MESSAGES : [])
          : gh ? ((window.__handovers || (typeof HANDOVERS !== 'undefined' ? HANDOVERS : {}))[gh[1]] || [])
          : path === 'board' ? (typeof BOARD !== 'undefined' ? BOARD : [])
          : ga ? (ABSENCES[ga[1]] || [])
          : ms ? (SHIFTS[ms[1]] || [])
          : gc ? (CLEAN[gc[1]] || [])
          : gn ? (CLEANNOTES[gn[1]] || [])
          : gd ? (DEVICES[gd[1]] || [])
          : gl ? (DEVLOG[gl[1]] || [])
          : gt ? ((window.__todos || TODOS)[gt[1]] || [])
          : (path === 'certificates' ? (window.__certs || CERTS)
          /* probetrainings fehlte hier, obwohl onSnapshot sie kennt —
             dieselbe Luecke wie zuvor bei board und den Uebergaben. Wer
             EINMALIG liest, bekam eine leere Antwort: `ichZahlenLaden()`
             tut genau das, und die Karte „Meine Zahlen" zeigte deshalb
             in JEDEM Durchlauf 0 Probetrainings. Gruen, und ohne jede
             Aussage. Gefunden beim Bau der Ziele, die aus derselben
             Abfrage lesen. */
          : (path === 'probetrainings' ? (window.__probe || PROBE)
          : (path === 'statistik' ? (window.__statistik || [])
          : (path === 'inventory' ? Object.keys(INVENTORY).map(function (k) { return { id: k, items: INVENTORY[k].items }; }) : []))));
        var self = this;
        if (self._filter && self._filter.length) {
          list = list.filter(function (d) {
            return self._filter.every(function (f) { return d[f.f] === f.v; });
          });
        }
        return Promise.resolve(makeSnap(list.map(function (d) {
          return { id: d.id, data: function () { return d; } };
        })));
      },
      onSnapshot: function (cb) {
        var m = /^studios\/(.+)\/todos$/.exec(path);
        var mc = /^studios\/(.+)\/cleaning$/.exec(path);
        var mn = /^studios\/(.+)\/cleaningNotes$/.exec(path);
        var msh = /^studios\/(.+)\/shifts$/.exec(path);
        var md = /^studios\/(.+)\/devices$/.exec(path);
        var ml = /^studios\/(.+)\/deviceLog$/.exec(path);
        var ma = /^studios\/(.+)\/absences$/.exec(path);
        if (ma) {
          var al = ABSENCES[ma[1]] || [];
          try { cb(makeSnap(al.map(function (d) { return { id: d.id, data: function () { return d; } }; }))); } catch (e) { console.error(e); }
          return unsub();
        }
        /* Übergaben fehlten hier, obwohl get() sie kennt. Der
           Team-Bereich hört mit onSnapshot zu — dort stand die Liste
           deshalb IMMER leer, und jeder Durchlauf, der sie geprüft
           hätte, hätte nichts geprüft. Gefunden beim Bau von
           test-verlinkung.js: 0 von 15 Proben gerendert. */
        var mho = /^studios\/(.+)\/handovers$/.exec(path);
        if (mho) {
          var hl = ((window.__handovers ||
                     (typeof HANDOVERS !== 'undefined' ? HANDOVERS : {}))[mho[1]] || []);
          /* Auch dieser Zweig muss sich den Zuhoerer merken, sonst
             erreicht __nachschub() die Uebergaben nicht — er gibt dann
             0 zurueck, und ein Durchlauf, der darauf baut, prueft ins
             Leere statt rot zu werden. */
          (HORCHER[path] = HORCHER[path] || []).push(cb);
          try { cb(makeSnap(hl.map(function (d) {
            return { id: d.id, data: function () { return d; } }; }))); }
          catch (e) { console.error(e); }
          return unsub();
        }
        var mp = /^privat\/[^/]+\/(termine|notizen|aufgaben|ziele)$/.exec(path);
        if (mp) {
          var pl2 = ((window.__privat || {})[mp[1]] || []);
          try { cb(makeSnap(pl2.map(function (d) {
            return { id: d.id, data: function () { return d; } }; }))); }
          catch (e) { console.error(e); }
          return unsub();
        }
        var mm = /^channels\/(.+)\/messages$/.exec(path);
        var list = m ? ((window.__todos || TODOS)[m[1]] || []) : mc ? (CLEAN[mc[1]] || []) : mn ? (CLEANNOTES[mn[1]] || []) :
                   msh ? (SHIFTS[msh[1]] || []) :
                   md ? (DEVICES[md[1]] || []) : ml ? (DEVLOG[ml[1]] || []) :
                   mm ? (mm[1]==='allgemein' ? MESSAGES : []) :
                   (path==='certificates' ? (window.__certs || CERTS) :
                   (path==='archives' ? ARCH_HIST.concat(ARCHIVES) : (path==='users' ? (window.__users || USERS) : (path==='announcements' ? ANNS :
                   (path==='inventory' ? Object.keys(INVENTORY).map(function(k){ return {id:k, items:INVENTORY[k].items}; }) :
                   (path==='probetrainings' ? (window.__probe || PROBE) :
                   /* board fehlte hier, obwohl get() es kennt. Das
                      Schwarze Brett haengt mit onSnapshot zu — es blieb
                      deshalb IMMER leer, und jeder Durchlauf darueber
                      haette nichts geprueft. Dieselbe Luecke wie bei den
                      Uebergaben, gefunden beim Bau der Erwaehnungen. */
                   (path==='board' ? (window.__board || []) :
                   (path==='documents' ? DOCS :
                   /* Firmen und Archiv: leer, ausser ein Test legt vorher
                      window.__firmen / window.__firmenArchiv hin. So merkt
                      keiner der anderen Durchlaeufe etwas davon. */
                   (path==='firmen' ? (window.__firmen||[]) :
                   (path==='firmenArchiv' ? (window.__firmenArchiv||[]) : []))))))))));
        var docs = list.map(function (d) { return { id: d.id, data: function () { return d; } }; });
        /* Zuhoerer merken, damit ein ZWEITER Schnappschuss moeglich ist.
           Die Attrappe feuerte bisher genau einmal je Sammlung. Fuer
           alles, was VERAENDERUNGEN erkennt — die Glocke vergleicht
           doneAt vorher gegen nachher — ist ein einziger Schnappschuss
           aber gar keine Probe: es gibt nichts zu vergleichen, und ein
           Durchlauf darueber waere immer gruen. */
        (HORCHER[path] = HORCHER[path] || []).push(cb);
        spaeter(function () { try { cb(makeSnap(docs)); } catch (e) { console.error('SNAP', e); } });
        return unsub();
      }
    };
  }
  var HORCHER = {};
  /* Feuert die Zuhoerer einer Sammlung noch einmal, mit neuen Daten.
     Rueckgabe ist die Anzahl der bedienten Zuhoerer: 0 heisst, der Pfad
     stimmt nicht — sonst prueft der Durchlauf hinterher ins Leere. */
  window.__nachschub = function (pfad, liste) {
    var cbs = HORCHER[pfad] || [];
    var docs = (liste || []).map(function (d) {
      return { id: d.id, data: function () { return d; } };
    });
    cbs.forEach(function (cb) { try { cb(makeSnap(docs)); } catch (e) { console.error('NACHSCHUB', e); } });
    return cbs.length;
  };
  var fs = {
    settings: function () {},
    enablePersistence: function () { return Promise.resolve(); },
    collection: function (p) { return collection(p); },
    /* ── Stapelschreiben merkt sich jetzt auch, was es schreibt ──
       Vorher verwarf der Stapel alles stillschweigend. Jeder Durchlauf
       ueber eine Funktion, die db.batch() benutzt — Putzaufgabe fuer
       mehrere Studios anlegen ist die groesste davon — meldete deshalb
       „schreibt nichts", und das stimmte nur fuer die Attrappe.

       Dieselbe Ablage wie bei set/update, damit ein Durchlauf nicht
       wissen muss, welchen Weg der Code nimmt. */
    batch: function () {
      var sammlung = [];
      function merke(art, ref, d) {
        sammlung.push({ pfad: (ref && ref._pfad) || '(unbekannt)', art: art, daten: d });
      }
      return {
        set: function (ref, d) { merke('set', ref, d); },
        update: function (ref, d) { merke('update', ref, d); },
        delete: function (ref) { merke('delete', ref); },
        commit: function () {
          window.__schreib = (window.__schreib || []).concat(sammlung);
          sammlung = [];
          return Promise.resolve();
        }
      };
    }
  };
  window.firebase = {
    initializeApp: function () { return { firestore: function () { return fs; } }; },
    apps: [],
    app: function () { return {
      firestore: function () { return fs; },
      functions: function () { return window.firebase.functions(); }
    }; },
    auth: function () {
      return {
        onAuthStateChanged: function (cb) { setTimeout(function () { cb({ uid: 'testuid', email: 'test@test.de' }); }, 60); return unsub(); },
        signInWithEmailAndPassword: function () { return Promise.resolve({ user: { uid: 'testuid' } }); },
        signOut: function () { return Promise.resolve(); },
        setPersistence: function () { return Promise.resolve(); },
        currentUser: { uid: 'testuid' }
      };
    },
    firestore: function () { return fs; },
    functions: function () {
      return { httpsCallable: function (name) {
        return function (data) {
          window.__aufruf = { name: name, data: data };
          return Promise.resolve({ data: { ok: true, empfaenger: 1, tage: (data && data.tage) || 30 } });
        };
      } };
    },
    messaging: function () { return { onMessage: function () {}, getToken: function () { return Promise.resolve(''); } }; },
    storage: function () { return { ref: function () { return {}; } }; }
  };
  firebase.firestore.FieldValue = {
    arrayUnion: function () { return {}; }, arrayRemove: function () { return {}; },
    serverTimestamp: function () { return Date.now(); },
    /* increment fehlte hier, und das kostete eine halbe Stunde: die
       Fehlermeldung der App rief fv.increment(1), bekam "is not a
       function" und wurde vom eigenen try/catch still geschluckt. Der
       Durchlauf meldete daraufhin "wird gar nicht gemeldet" — richtig,
       aber aus dem falschen Grund. */
    increment: function (n) { return { __increment: n }; }
  };
  /* FieldPath fehlte. Die Werkbank sortiert die Tagesdokumente über
     FieldPath.documentId() — ohne diesen Eintrag fliegt „undefined is
     not an object", noch bevor die Abfrage gebaut ist. */
  firebase.firestore.FieldPath = { documentId: function () { return '__name__'; } };
  firebase.auth.Auth = { Persistence: { LOCAL: 'local', SESSION: 'session', NONE: 'none' } };
  firebase.messaging.isSupported = function () { return false; };
})();
