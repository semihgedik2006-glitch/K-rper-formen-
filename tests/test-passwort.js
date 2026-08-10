/* Passwort anzeigen.

   Auf einem Handy tippt man sich an einem Passwort mit Sonderzeichen die
   Finger wund und sieht nie, was danebenging.

   Geprüft wird:
     1. An jedem der drei Passwortfelder sitzt ein Knopf.
     2. Er schaltet wirklich um – und wieder zurück.
     3. Der Cursor steht danach am ENDE, nicht am Anfang. Sonst tippt man
        beim Weiterschreiben mitten ins eigene Passwort.
     4. Er löst kein Absenden aus (type="button").
     5. Beim Wechsel zwischen Anmelden und Registrieren wird wieder
        verborgen – auf einem Studio-Tablet schaut der Nächste mit.
     6. Er ist 44 Pixel groß und schiebt das Feld nicht aus der Karte.    */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Ohne Stub: der Anmeldebildschirm soll stehen bleiben.
const KEIN_LOGIN = `
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
})();`;

(async () => {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 320, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 160));
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript(KEIN_LOGIN);
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);

  // ══ 1. Drei Felder, drei Knöpfe ══
  const anzahl = await page.evaluate(() => ({
    felder: document.querySelectorAll('input[type="password"], .pw-wrap .inp').length,
    knoepfe: document.querySelectorAll('.pw-auge').length,
    typen: [...document.querySelectorAll('.pw-auge')].map(k => k.getAttribute('type')),
  }));
  console.log('Felder/Knöpfe:', JSON.stringify(anzahl));
  if (anzahl.knoepfe !== 3) errs.push('FEHLT: ' + anzahl.knoepfe + ' Knöpfe statt 3');
  if (anzahl.typen.some(t => t !== 'button')) {
    errs.push('GEFÄHRLICH: ein Knopf hat kein type="button" – er sendet das Formular ab');
  }

  // ══ 6. Größe und kein Überlauf, bei 320 px ══
  const mass = await page.evaluate(() => {
    const k = document.querySelector('[data-pw="lgPw"]');
    const f = document.getElementById('lgPw');
    const r = k.getBoundingClientRect(), rf = f.getBoundingClientRect();
    return {
      breite: Math.round(r.width), hoehe: Math.round(r.height),
      imFeld: r.right <= rf.right + 1 && r.left >= rf.left,
      seitenBreite: document.documentElement.scrollWidth,
      textEndet: Math.round(rf.right - r.width) > Math.round(rf.left),
    };
  });
  console.log('Knopfmaß:', JSON.stringify(mass));
  if (mass.hoehe < 44 || mass.breite < 44) errs.push('FINGERZIEL: nur ' + mass.breite + '×' + mass.hoehe + ' px');
  if (!mass.imFeld) errs.push('FEHLT: der Knopf sitzt nicht im Feld');
  if (mass.seitenBreite > 321) errs.push('ÜBERLAUF: Seite ist ' + mass.seitenBreite + ' px breit bei 320');

  // ══ 2.+3. Umschalten und Cursor ══
  await page.fill('#lgPw', 'GeheimesPasswort123!');
  await page.evaluate(() => document.querySelector('[data-pw="lgPw"]').click());
  await page.waitForTimeout(200);
  const auf = await page.evaluate(() => {
    const f = document.getElementById('lgPw'), k = document.querySelector('[data-pw="lgPw"]');
    return { typ: f.type, gedrueckt: k.getAttribute('aria-pressed'),
             label: k.getAttribute('aria-label'),
             cursor: f.selectionStart, laenge: f.value.length,
             fokus: document.activeElement === f };
  });
  console.log('Aufgedeckt:', JSON.stringify(auf));
  if (auf.typ !== 'text') errs.push('FEHLT: das Passwort wird nicht sichtbar');
  if (auf.gedrueckt !== 'true') errs.push('FEHLT: aria-pressed bleibt auf false');
  if (!/verbergen/i.test(auf.label || '')) errs.push('FEHLT: die Beschriftung wechselt nicht');
  if (auf.fokus && auf.cursor !== auf.laenge) {
    errs.push('CURSOR: steht auf ' + auf.cursor + ' statt am Ende (' + auf.laenge + ')');
  }

  await page.evaluate(() => document.querySelector('[data-pw="lgPw"]').click());
  await page.waitForTimeout(200);
  const zu = await page.evaluate(() => {
    const f = document.getElementById('lgPw'), k = document.querySelector('[data-pw="lgPw"]');
    return { typ: f.type, gedrueckt: k.getAttribute('aria-pressed'), wert: f.value };
  });
  console.log('Wieder verborgen:', JSON.stringify(zu));
  if (zu.typ !== 'password') errs.push('FEHLT: zurückschalten geht nicht');
  if (zu.wert !== 'GeheimesPasswort123!') errs.push('DATENVERLUST: das Eingetippte ist weg');

  // ══ 5. Beim Wechsel wieder verbergen ══
  await page.evaluate(() => document.querySelector('[data-pw="lgPw"]').click());
  await page.waitForTimeout(150);
  const gewechselt = await page.evaluate(() => {
    const t = document.querySelector('[data-authmode="register"]');
    if (!t || t.offsetParent === null) return false;
    t.click(); return true;
  });
  if (!gewechselt) errs.push('FEHLT: kein erreichbarer Umschalter zu „Konto anlegen"');
  await page.waitForTimeout(400);
  const nachWechsel = await page.evaluate(() =>
    [...document.querySelectorAll('.pw-wrap .inp')].map(f => f.type));
  console.log('Nach dem Wechsel:', JSON.stringify(nachWechsel));
  if (nachWechsel.some(t => t !== 'password')) {
    errs.push('OFFEN GEBLIEBEN: nach dem Wechsel steht ein Passwort noch im Klartext');
  }

  await page.screenshot({ path: SP + '/passwort.png' });
  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ') : '\n✓ Passwort: Knopf zeigt, verbirgt und verrät nichts beim Wechsel');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
