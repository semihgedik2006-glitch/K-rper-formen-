/* Minimaler Firebase-Ersatz, nur zum Ansehen der Oberfläche im Test.
   Simuliert einen angemeldeten Chef und leere Sammlungen. */
(function () {
  function unsub() { return function () {}; }
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

  var PROFILE = {
    name: 'Test Leiter', role: 'leiter', studios: ['Hürth', 'Brühl'],
    studioKeys: ['studio-6','studio-7'],
    studio: 'Hürth', avatar: '🧭', color: '#A78BFA',
    email: 'leiter@example.com'
  };
  var USERS = [
    { id:'testuid', name:'Test Leiter', role:'leiter', studios:['Hürth','Brühl'], studioKeys:['studio-6','studio-7'] },
    { id:'u9', name:'Der Chef', role:'chef', studios:[], email:'chef@example.com' },
    { id:'u2', name:'Anna Meier', role:'mitarbeiter', studios:['Hürth'], studioKeys:['studio-6'], lastSeen:Date.now()-60000 },
    { id:'u3', name:'Ben Kraus', role:'leiter', studios:['Brühl'], studioKeys:['studio-7'], lastSeen:Date.now()-3600000 },
    { id:'u4', name:'Alt-Konto Test', role:'chef', email:'test1@example.com' },
    { id:'u5', name:'', role:'chef', email:'test2@example.com' }
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
      audio:'data:audio/webm;codecs=opus;base64,GkXfo0AgQoaBAULygQ==', audioMs:14000 }
  ];
  var TODOS = {
    'studio-6': [
      { id: 't1', title: 'Geräte desinfizieren', desc: 'Nach jedem Training', done: false, createdBy: 'Chef', ts: Date.now() - 90000000, due: Date.now() - 86400000, steps:[{t:'Geräte abwischen',d:true},{t:'Gurte prüfen',d:false},{t:'Kabel aufrollen',d:false}] },
      { id: 't2', title: 'Handtücher waschen', desc: '', done: true, doneBy: 'Anna', doneAt: Date.now() - 3000, createdBy: 'Chef', ts: Date.now() - 80000000 },
      { id: 't3', title: 'Wasserspender auffüllen', desc: 'Beide Spender', done: false, createdBy: 'Chef', ts: Date.now() - 70000000, recurring: 'daily' }
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
  var CERTS = [
    { id:'z1', uid:'u2', name:'Anna Meier', art:'ersthelfer', bis:tag(-10), ts:Date.now() },
    { id:'z2', uid:'u3', name:'Ben Kraus',  art:'ems',        bis:tag(29), ts:Date.now() },
    { id:'z3', uid:'testuid', name:'Ich',   art:'trainer',    bis:tag(399), ts:Date.now() },
    { id:'z4', uid:'u2', name:'Anna Meier', art:'sonstiges', bez:'Ernaehrungsberater', bis:tag(119), ts:Date.now() }
  ];
  /* ── Der Umzug auf firmen/<kennung>/… (10.8.2026) ──
     Die App schickt seither jeden Zugriff durch S(), und das liefert
     'firmen/koerperformen/config' statt 'config'. Dieser Stub bildet
     die Daten weiterhin flach ab — der Aufbau der Testdaten hat mit
     der Mandantentrennung nichts zu tun.

     Deshalb wird der Firmen-Vorsatz hier an EINER Stelle abgeschnitten,
     statt jede Testdatei umzuschreiben. Als der Schalter umgelegt
     wurde, sind 12 Durchläufe rot geworden — zu Recht: sie suchten
     Daten, die der Stub unter dem alten Namen führte. */
  function collection(path) {
    path = String(path).replace(/^firmen\/[^/]+\//, '');
    return {
      _p: path,
      doc: function (id) {
        var docPath = path + '/' + id;
        return {
          /* Der Weg, den S() nimmt: db.collection('firmen').doc(k)
             .collection('todos'). Der landet NICHT bei fs.collection —
             und damit auch nicht bei den Attrappen, die einzelne Tests
             dort einhängen. Deshalb geht es für den Firmen-Vorsatz
             durch dieselbe Tür wie ein flacher Zugriff. Ohne das prüfen
             sechs Tests still an sich selbst vorbei. */
          collection: function (sub) {
            if (/^firmen\/[^/]+$/.test(docPath) && fs && fs.collection) return fs.collection(sub);
            return collection(docPath + '/' + sub);
          },
          get: function () {
            var data = (path === 'users') ? PROFILE : {};
            if (path === 'archives') { var a=ARCHIVES.filter(function(x){return x.id===id;})[0]; return Promise.resolve({ exists: !!a, id:id, data: function(){ return a||{}; } }); }
            return Promise.resolve({ exists: true, id: id, data: function () { return data; } });
          },
          set: function () { return Promise.resolve(); },
          update: function () { return Promise.resolve(); },
          delete: function () { return Promise.resolve(); },
          onSnapshot: function (cb) {
            if (path === 'inventory') {
              var inv = INVENTORY[id];
              try { cb({ exists: !!inv, id:id, metadata:{hasPendingWrites:false}, data: function(){ return inv || {items:[]}; } }); } catch (e) { console.error(e); }
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
      add: function () { return Promise.resolve({ id: 'neu' }); },
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
        var gm = /^channels\/(.+)\/messages$/.exec(path);
        var gh = /^studios\/(.+)\/handovers$/.exec(path);
        var list = gm ? (gm[1] === 'allgemein' ? MESSAGES : [])
          : gh ? (typeof HANDOVERS !== 'undefined' ? (HANDOVERS[gh[1]] || []) : [])
          : path === 'board' ? (typeof BOARD !== 'undefined' ? BOARD : [])
          : ga ? (ABSENCES[ga[1]] || [])
          : ms ? (SHIFTS[ms[1]] || [])
          : gc ? (CLEAN[gc[1]] || [])
          : gn ? (CLEANNOTES[gn[1]] || [])
          : gd ? (DEVICES[gd[1]] || [])
          : gl ? (DEVLOG[gl[1]] || [])
          : gt ? (TODOS[gt[1]] || [])
          : (path === 'certificates' ? CERTS
          : (path === 'inventory' ? Object.keys(INVENTORY).map(function (k) { return { id: k, items: INVENTORY[k].items }; }) : []));
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
        var mm = /^channels\/(.+)\/messages$/.exec(path);
        var list = m ? (TODOS[m[1]] || []) : mc ? (CLEAN[mc[1]] || []) : mn ? (CLEANNOTES[mn[1]] || []) :
                   msh ? (SHIFTS[msh[1]] || []) :
                   md ? (DEVICES[md[1]] || []) : ml ? (DEVLOG[ml[1]] || []) :
                   mm ? (mm[1]==='allgemein' ? MESSAGES : []) :
                   (path==='certificates' ? CERTS :
                   (path==='archives' ? ARCH_HIST.concat(ARCHIVES) : (path==='users' ? USERS : (path==='announcements' ? ANNS :
                   (path==='inventory' ? Object.keys(INVENTORY).map(function(k){ return {id:k, items:INVENTORY[k].items}; }) :
                   (path==='documents' ? DOCS : []))))));
        var docs = list.map(function (d) { return { id: d.id, data: function () { return d; } }; });
        try { cb(makeSnap(docs)); } catch (e) { console.error('SNAP', e); }
        return unsub();
      }
    };
  }
  var fs = {
    settings: function () {},
    enablePersistence: function () { return Promise.resolve(); },
    collection: function (p) { return collection(p); },
    batch: function () { return { set: function () {}, update: function () {}, delete: function () {}, commit: function () { return Promise.resolve(); } }; }
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
  firebase.auth.Auth = { Persistence: { LOCAL: 'local', SESSION: 'session', NONE: 'none' } };
  firebase.messaging.isSupported = function () { return false; };
})();
