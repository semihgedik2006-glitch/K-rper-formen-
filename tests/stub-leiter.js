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
  var PROFILE = {
    name: 'Test Leiter', role: 'leiter', studios: ['Hürth', 'Brühl'],
    studioKeys: ['studio-6','studio-7'],
    studio: 'Hürth', avatar: '💪', color: '#00E06E'
  };
  var TODOS = {
    'studio-6': [
      { id: 't1', title: 'Geräte desinfizieren', desc: 'Nach jedem Training', done: false, createdBy: 'Chef', ts: Date.now() - 90000000, due: Date.now() - 86400000 },
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
      { id:'c2', title:'Spiegel putzen', recurring:'weekly', done:false, ts:Date.now()-80000000 },
      { id:'c3', title:'Toiletten reinigen', recurring:'daily', done:false, ts:Date.now()-70000000 }
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
  function collection(path) {
    return {
      _p: path,
      doc: function (id) {
        var docPath = path + '/' + id;
        return {
          collection: function (sub) { return collection(docPath + '/' + sub); },
          get: function () {
            var data = (path === 'users') ? PROFILE : {};
            if (path === 'archives') { var a=ARCHIVES.filter(function(x){return x.id===id;})[0]; return Promise.resolve({ exists: !!a, id:id, data: function(){ return a||{}; } }); }
            return Promise.resolve({ exists: true, id: id, data: function () { return data; } });
          },
          set: function () { return Promise.resolve(); },
          update: function () { return Promise.resolve(); },
          delete: function () { return Promise.resolve(); },
          onSnapshot: function (cb) { try { cb({ exists: false, data: function () { return {}; } }); } catch (e) {} return unsub(); }
        };
      },
      where: function () { return this; },
      orderBy: function () { return this; },
      limit: function () { return this; },
      limitToLast: function () { return this; },
      add: function () { return Promise.resolve({ id: 'neu' }); },
      get: function () { return Promise.resolve(makeSnap([])); },
      onSnapshot: function (cb) {
        var m = /^studios\/(.+)\/todos$/.exec(path);
        var mc = /^studios\/(.+)\/cleaning$/.exec(path);
        var mn = /^studios\/(.+)\/cleaningNotes$/.exec(path);
        var list = m ? (TODOS[m[1]] || []) : mc ? (CLEAN[mc[1]] || []) : mn ? (CLEANNOTES[mn[1]] || []) : (path==='archives' ? ARCHIVES : []);
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
    batch: function () { return { set: function () {}, delete: function () {}, commit: function () { return Promise.resolve(); } }; }
  };
  window.firebase = {
    initializeApp: function () { return { firestore: function () { return fs; } }; },
    apps: [],
    app: function () { return { firestore: function () { return fs; } }; },
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
    messaging: function () { return { onMessage: function () {}, getToken: function () { return Promise.resolve(''); } }; },
    storage: function () { return { ref: function () { return {}; } }; }
  };
  firebase.firestore.FieldValue = {
    arrayUnion: function () { return {}; }, arrayRemove: function () { return {}; },
    serverTimestamp: function () { return Date.now(); }
  };
  firebase.auth.Auth = { Persistence: { LOCAL: 'local', SESSION: 'session', NONE: 'none' } };
  firebase.messaging.isSupported = function () { return false; };
})();
