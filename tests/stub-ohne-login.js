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
  var fs = { settings:function(){}, enablePersistence:function(){ return Promise.resolve(); },
             collection:function(pfad){
               var k = kette();
               if (pfad === 'config') {
                 k.doc = function(id){
                   var o = kette();
                   if (id === 'beitrittSchalter') {
                     o.get = function(){ return Promise.resolve({ exists:true, id:id,
                       data:function(){ return { codeNoetig:true, freigabe:true }; } }); };
                   }
                   return o;
                 };
               }
               return k;
             },
             batch:function(){ return { set:function(){}, update:function(){}, delete:function(){}, commit:function(){ return Promise.resolve(); } }; } };
  var f = { httpsCallable: function(){ return function(){ return Promise.resolve({data:{}}); }; } };
  firebase.firestore.FieldValue = { arrayUnion:function(){return{};}, arrayRemove:function(){return{};}, serverTimestamp:function(){return Date.now();} };
  firebase.auth.Auth = { Persistence: { LOCAL:'local', SESSION:'session', NONE:'none' } };
  firebase.messaging.isSupported = function(){ return false; };
})();