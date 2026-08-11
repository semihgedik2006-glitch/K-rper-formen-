/* Firebase-Attrappe OHNE angemeldeten Nutzer.

   stub-chef.js meldet sofort einen Chef an – damit kommt man nie an den
   Anmeldebildschirm. Diese Attrappe hier meldet niemanden an: sie liefert
   leere Sammlungen und einen auth-Zustand von null.

   Gebraucht von allem, was VOR dem Login passiert: Passwortfeld,
   Selbstanmeldung, Impressum und Datenschutz. Ein Impressum hinter einem
   Login ist keins – also muss es auch ohne Login prüfbar sein.

   config/beitrittSchalter liefert beide Schranken auf "an", damit der
   Reiter „Konto anlegen" überhaupt erscheint.                          */
(function(){
  function unsub(){ return function(){}; }
  window.firebase = {
    initializeApp: function(){ return {}; }, apps: [], app: function(){ return {
      firestore: function(){ return fs; }, functions: function(){ return f; } }; },
    auth: function(){ return {
      onAuthStateChanged: function(cb){ setTimeout(function(){ cb(null); }, 40); return unsub(); },
      signInWithEmailAndPassword: function(){ return Promise.reject({ code:'auth/wrong-password' }); },
      signOut: function(){ return Promise.resolve(); },
      setPersistence: function(){ return Promise.resolve(); },
      currentUser: null }; },
    firestore: function(){ return fs; },
    functions: function(){ return f; },
    messaging: function(){ return { onMessage:function(){}, getToken:function(){ return Promise.resolve(''); } }; },
    storage: function(){ return { ref: function(){ return {}; } }; }
  };
  var leer = { docs:[], empty:true, size:0, forEach:function(){}, docChanges:function(){ return []; } };
  function kette(){ var k = {
    doc: function(){ return k; }, collection: function(){ return k; },
    where: function(){ return k; }, orderBy: function(){ return k; },
    limit: function(){ return k; }, limitToLast: function(){ return k; },
    get: function(){ return Promise.resolve({ exists:false, data:function(){ return {}; }, docs:[], forEach:function(){} }); },
    onSnapshot: function(cb){ try{ cb(leer); }catch(e){} return unsub(); },
    set: function(){ return Promise.resolve(); }, update: function(){ return Promise.resolve(); },
    add: function(){ return Promise.resolve({id:'x'}); }, delete: function(){ return Promise.resolve(); } };
    return k; }
  /* Absichtlich eine eigene Funktion statt fs.collection: der Rücksprung
     aus der Firmen-Kette ist Innenleben dieses Stubs. Ginge er durch
     fs.collection, schriebe ihn der Pfad-Mitschnitt in
     test-firma-link.js als zweiten, flachen Zugriff mit — und der Test
     meldete „liest auch flach", obwohl die App das nie getan hat. */
  function sammlung(pfad){
    /* Auch VOR dem Anmelden läuft alles durch S(): _firma
       kommt dann aus dem Link, mit KONFIG.firma als Rückfall.
       Der Anmeldebildschirm fragt also nach
       'firmen/koerperformen/config'. Vorsatz abschneiden,
       die Testdaten bleiben flach. */
    pfad = String(pfad).replace(new RegExp('^firmen/[^/]+/'), '');
    var k = kette();
    /* S() baut den Pfad NICHT als Zeichenkette, sondern als
       Kette: collection('firmen').doc(k).collection('config').
       kette() gibt für alles dasselbe Objekt zurück — die
       Weiche unten wäre also nie erreicht worden, und der
       Anmeldebildschirm hätte den Beitritts-Schalter nicht
       gefunden. Hier zurück durch die Vordertür. */
    if (pfad === 'firmen') {
      k.doc = function(){
        var o = kette();
        o.collection = function(sub){ return sammlung(sub); };
        return o;
      };
      return k;
    }
    if (pfad === 'config') {
      k.doc = function(id){
        var o = kette();
        if (id === 'beitrittSchalter') {
          o.get = function(){ return Promise.resolve({ exists:true, id:id,
            data:function(){ return { codeNoetig:true, freigabe:true }; } }); };
        }
        /* Das Impressum aus der Datenbank – ausdruecklich auch hier, VOR
           dem Anmelden. Ohne diesen Zweig kaeme der Durchlauf nie an den
           Fall, um den es geht: eine fremde Firma, deren Angaben nur in
           der Datenbank stehen und nicht in konfig.js. Fuer die eigene
           Firma faellt das nicht auf, weil dort der Rueckfall greift. */
        if (id === 'recht') {
          o.get = function(){
            var r = window.__recht;
            return Promise.resolve({ exists: !!r, id:id,
              data:function(){ return r || {}; } });
          };
        }
        return o;
      };
    }
    return k;
  }
  var fs = { settings:function(){}, enablePersistence:function(){ return Promise.resolve(); },
             collection:function(pfad){ return sammlung(pfad); },
             batch:function(){ return { set:function(){}, update:function(){}, delete:function(){}, commit:function(){ return Promise.resolve(); } }; } };
  var f = { httpsCallable: function(){ return function(){ return Promise.resolve({data:{}}); }; } };
  firebase.firestore.FieldValue = { arrayUnion:function(){return{};}, arrayRemove:function(){return{};}, serverTimestamp:function(){return Date.now();} };
  firebase.auth.Auth = { Persistence: { LOCAL:'local', SESSION:'session', NONE:'none' } };
  firebase.messaging.isSupported = function(){ return false; };
})();