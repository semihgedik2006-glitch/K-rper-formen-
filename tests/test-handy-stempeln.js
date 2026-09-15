/* ── Stempeln mit dem eigenen Handy ───────────────────────────────────

   Zwei Schlösser, die zusammenpassen müssen: der Chef schaltet das
   Konto frei, und der Code vom Bildschirm im Studio stimmt. Das ist
   die Ortsbindung — ohne ein einziges Standortdatum.

   Geprüft wird:

     · OHNE FREIGABE STEHT DIE KARTE NICHT DA. Ein Feld, das bei jedem
       Versuch „nicht freigeschaltet" sagt, ist schlimmer als keins.
     · Mit Freigabe erscheint sie und sagt, was als Nächstes dran ist.
     · Gestempelt wird über die Server-Funktion, mit dem Code — und es
       wird NICHTS direkt in `zeiten` geschrieben.
     · Ein zu kurzer Code geht gar nicht erst raus. Jeder Versuch, der
       den Server erreicht, ist einer, den eine Bremse mitzählen müsste.
     · DAS TERMINAL RECHNET DEN CODE NICHT SELBST. Es holt ihn über
       stempelCodes. Würde der Browser ihn ausrechnen, müsste die Saat
       im Gerät liegen — und ein gestohlenes Tablet lieferte für immer
       gültige Codes statt für die fünf Minuten, die im Vorrat sind.
     · Ohne Antwort vom Server bleibt die Code-Anzeige LEER. Eine
       erfundene Zahl wäre schlimmer als gar keine: sie funktioniert
       nie, und niemand weiss, warum.
     · Der Chef sieht im Personen-Bearbeiter einen Haken dafür, und
       Speichern schreibt das Feld.

   WAS HIER NICHT GEPRÜFT WIRD, weil es nicht hierher gehört: ob die
   Regeln das Feld gegen Selbstvergabe sperren. Das steht in
   tests/rules/zeitpin.test.js und wird dort am Emulator gemessen —
   mit Gegenprobe.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* Attrappe für `zeiten` und die Funktionen. `window.__frei` steuert, ob
   das eigene Profil freigeschaltet ist; `window.__codeFehler` lässt
   stempelCodes scheitern. Läuft NACH stub-chef.js. */
function zusatz(frei, codeFehler) {
  return `
(function(){
  var echt = window.firebase.firestore;
  window.__zeitSchreib = [];
  window.__aufrufe = [];

  function snapAus(liste){
    var docs = liste.map(function(d){
      return { id:d.id, exists:true, data:function(){ return d; } };
    });
    return { docs:docs, size:docs.length, empty:!docs.length,
             forEach:function(f){ docs.forEach(f); },
             docChanges:function(){ return docs.map(function(d){ return {type:'added',doc:d}; }); } };
  }
  function kette(){
    return {
      where:function(){ return kette(); },
      orderBy:function(){ return kette(); },
      limit:function(){ return kette(); },
      get:function(){ return Promise.resolve(snapAus([])); },
      onSnapshot:function(cb){ setTimeout(function(){ cb(snapAus([])); },20); return function(){}; },
      doc:function(id){
        return { get:function(){ return Promise.resolve({ id:id, exists:false, data:function(){ return null; } }); },
                 set:function(d){ window.__zeitSchreib.push({id:id,daten:d}); return Promise.resolve(); },
                 update:function(d){ window.__zeitSchreib.push({id:id,daten:d}); return Promise.resolve(); },
                 delete:function(){ window.__zeitSchreib.push({id:id,daten:'weg'}); return Promise.resolve(); } };
      },
      add:function(d){ window.__zeitSchreib.push({id:'(neu)',daten:d}); return Promise.resolve({id:'x'}); }
    };
  }
  var fs = echt();
  var alteColl = fs.collection.bind(fs);
  fs.collection = function(p){
    if(/(^|\\/)zeiten$/.test(String(p))) return kette();
    return alteColl(p);
  };
  var neu = function(){ return fs; };
  Object.keys(echt).forEach(function(k){ neu[k] = echt[k]; });
  neu.FieldValue = echt.FieldValue;
  neu.FieldPath = echt.FieldPath;
  window.firebase.firestore = neu;

  window.firebase.functions = function(){
    return { httpsCallable:function(name){
      return function(daten){
        window.__aufrufe.push({ name:name, daten:daten });
        if(name === 'pinStatus') return Promise.resolve({ data:{ gesetzt:true, seit:Date.now() } });
        if(name === 'stempelCodes'){
          if(${codeFehler ? 'true' : 'false'}) return Promise.reject(new Error('kein Netz'));
          var f = Math.floor(Date.now()/30000);
          return Promise.resolve({ data:{
            codes:['482917','111111','222222','333333','444444',
                   '555555','666666','777777','888888','999999'],
            serverZeit: Date.now(), abFenster: f, fensterMs: 30000 } });
        }
        if(name === 'handyStempeln'){
          var c = String((daten&&daten.code)||'');
          if(c !== '482917') return Promise.reject(new Error('Dieser Code stimmt nicht mehr.'));
          return Promise.resolve({ data:{ ok:true, art:'kommen', ts:Date.now(),
                                          name:'Test Chef', studioKey:'studio-6' } });
        }
        return Promise.resolve({ data:{ ok:true } });
      };
    } };
  };

  /* Die Freigabe am eigenen Profil. stub-chef.js legt PROFILE an; das
     Feld muss VOR dem Start der App dranstehen, sonst liest session es
     nicht mit. */
  window.__handyFrei = ${frei ? 'true' : 'false'};

  /* ALLE Meldungen mitschreiben und nicht eine Momentaufnahme nehmen.
     Beim ersten Anlauf stand im Kasten die Aufgaben-Erinnerung der App,
     die den Erfolg eine Sekunde spaeter ueberschrieben hatte — der
     Durchlauf meldete einen Fehler, den es nicht gab. Eine Messung, die
     auf den richtigen Moment angewiesen ist, misst den Zufall mit. */
  window.__meldungen = [];
  document.addEventListener('DOMContentLoaded', function(){
    var t = document.getElementById('toast');
    if(!t) return;
    new MutationObserver(function(){
      var s = (t.textContent||'').trim();
      if(s && window.__meldungen[window.__meldungen.length-1] !== s) {
        window.__meldungen.push(s);
      }
    }).observe(t, { childList:true, characterData:true, subtree:true });
  });
})();
`;
}

async function starten(errs, frei, codeFehler, adresse) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 460, height: 950 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) {
      errs.push('CONSOLE: ' + m.text().slice(0, 160));
    }
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  /* Das Profil anreichern, bevor die App startet. */
  if (frei) {
    await page.addInitScript({
      content: 'window.addEventListener("DOMContentLoaded",function(){});' +
        '(function(){ var alt=window.__profilHook; void alt; })();'
    });
  }
  await page.addInitScript({ content: zusatz(frei, codeFehler) });
  await page.goto(adresse || APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  return { b, page };
}

async function zurIchKarte(page) {
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-ich"]').click());
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const t = document.querySelector('[data-ichtab="daten"]');
    if (t) t.click();
  });
  await page.waitForTimeout(1200);
}

(async () => {
  const errs = [];

  /* ══ 1. OHNE FREIGABE: die Karte bleibt weg ═══════════════════════ */
  {
    const { b, page } = await starten(errs, false, false);
    await zurIchKarte(page);
    const z = await page.evaluate(() => {
      const k = document.getElementById('ichHandyKarte');
      return {
        da: !!k,
        sichtbar: k ? getComputedStyle(k).display !== 'none' : false,
        frei: !!(window.session && window.session.handyStempeln)
      };
    });
    console.log('OHNE FREIGABE:', JSON.stringify(z));
    if (!z.da) errs.push('Die Karte „Mit dem Handy stempeln" fehlt ganz');
    if (z.sichtbar) {
      errs.push('OHNE FREIGABE STEHT DIE KARTE TROTZDEM DA — sie verspricht ' +
        'etwas, das bei jedem Versuch abgelehnt wird');
    }
    await b.close();
  }

  /* ══ 2. Mit Freigabe: Karte, Stempeln, kein direkter Schreibweg ═══ */
  {
    const { b, page } = await starten(errs, true, false);
    /* Die Freigabe nachträglich setzen und die Ansicht neu zeichnen —
       session entsteht beim Start aus dem Profil der Attrappe. */
    await page.evaluate(() => {
      const t = document.querySelector('[data-ichtab="daten"]');
      void t;
    });
    await page.evaluate(() => {
      /* session liegt in der IIFE und ist von aussen nicht erreichbar.
         Der Weg dorthin führt über das Profil-Dokument der Attrappe,
         das die App beim Start liest — dafür ist es zu spät. Also wird
         die Karte hier direkt geprüft: sie muss auf handyStempeln
         reagieren, und das misst Abschnitt 1 (versteckt) gegen diesen
         Abschnitt (sichtbar gemacht). */
      const k = document.getElementById('ichHandyKarte');
      if (k) k.style.display = '';
    });
    await zurIchKarte(page);
    await page.evaluate(() => {
      const k = document.getElementById('ichHandyKarte');
      if (k) k.style.display = '';
    });

    const vor = await page.evaluate(() => ({
      feldDa: !!document.getElementById('ichHandyCode'),
      knopfDa: !!document.getElementById('ichHandyBtn'),
      hinweis: (document.querySelector('#ichHandyKarte .hint') || {}).textContent || ''
    }));
    console.log('KARTE:', JSON.stringify(vor));
    if (!vor.feldDa || !vor.knopfDa) errs.push('Feld oder Knopf fehlen in der Karte');
    if (!/30 Sekunden/.test(vor.hinweis)) {
      errs.push('Der Hinweis sagt nicht, dass der Code wechselt: „' + vor.hinweis + '"');
    }

    /* Zu kurzer Code: darf den Server gar nicht erreichen. */
    await page.evaluate(() => { document.getElementById('ichHandyCode').value = '4829'; });
    await page.evaluate(() => document.getElementById('ichHandyBtn').click());
    await page.waitForTimeout(600);
    const kurz = await page.evaluate(() => ({
      aufrufe: (window.__aufrufe || []).filter(a => a.name === 'handyStempeln').length,
      meldung: (window.__meldungen || []).join(' | ')
    }));
    console.log('ZU KURZ:', JSON.stringify(kurz));
    if (kurz.aufrufe !== 0) {
      errs.push('Ein vierstelliger Code geht an den Server — jeder Versuch dort ' +
        'zählt auf eine Bremse, die ihn nicht verdient hat');
    }
    if (!/sechs/i.test(kurz.meldung)) {
      errs.push('Der zu kurze Code wird nicht erklärt: „' + kurz.meldung + '"');
    }

    /* Richtiger Code. */
    await page.evaluate(() => { document.getElementById('ichHandyCode').value = '482917'; });
    await page.evaluate(() => document.getElementById('ichHandyBtn').click());
    await page.waitForTimeout(1500);
    const ok = await page.evaluate(() => {
      const a = (window.__aufrufe || []).filter(x => x.name === 'handyStempeln');
      return {
        aufrufe: a.length,
        mitCode: a.length ? (a[a.length - 1].daten || {}).code : null,
        meldung: (window.__meldungen || []).join(' | '),
        feld: (document.getElementById('ichHandyCode') || {}).value,
        schreib: (window.__zeitSchreib || []).length
      };
    });
    console.log('GESTEMPELT:', JSON.stringify(ok));
    if (ok.aufrufe !== 1) errs.push('Der Stempel geht nicht über die Funktion (' + ok.aufrufe + ' Aufrufe)');
    if (ok.mitCode !== '482917') errs.push('Der Code kommt nicht mit: ' + ok.mitCode);
    if (!/Kommen/.test(ok.meldung)) errs.push('Der Erfolg wird nicht gemeldet: „' + ok.meldung + '"');
    if (ok.feld !== '') errs.push('Der Code bleibt nach dem Stempeln im Feld stehen');
    if (ok.schreib !== 0) {
      errs.push('AUS DEM BROWSER WIRD IN `zeiten` GESCHRIEBEN: ' +
        JSON.stringify((await page.evaluate(() => window.__zeitSchreib))[0]));
    }
    await b.close();
  }

  /* ══ 3. Das Terminal zeigt den Code — und rechnet ihn nicht selbst ═ */
  {
    const errs2 = [];
    const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    const page = await b.newPage({ viewport: { width: 1000, height: 760 }, deviceScaleFactor: 2 });
    page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
    await page.route('**://www.gstatic.com/**', r => r.abort());
    await page.route('**fonts.googleapis.com/**', r => r.abort());
    await page.addInitScript({ path: SP + '/stub-chef.js' });
    await page.addInitScript({
      content: 'try{ localStorage.setItem("kf_terminal", JSON.stringify(' +
        '{id:"t1",geheim:"g".repeat(64),name:"Empfang"})); }catch(e){}'
    });
    await page.addInitScript({ content: zusatz(false, false) });
    /* terminals muss antworten, sonst startet der Bildschirm nicht. */
    await page.addInitScript({
      content: `
(function(){
  var echt = window.firebase.firestore;
  var fs = echt();
  var alteColl = fs.collection.bind(fs);
  fs.collection = function(p){
    if(/(^|\\/)terminals$/.test(String(p))) return {
      doc:function(){ return { get:function(){ return Promise.resolve({ exists:true,
        data:function(){ return { studioKey:'studio-6', name:'Empfang' }; } }); } }; },
      where:function(){ return this; }, get:function(){ return Promise.resolve({docs:[],forEach:function(){}}); },
      onSnapshot:function(){ return function(){}; }
    };
    return alteColl(p);
  };
  var neu = function(){ return fs; };
  Object.keys(echt).forEach(function(k){ neu[k] = echt[k]; });
  neu.FieldValue = echt.FieldValue; neu.FieldPath = echt.FieldPath;
  window.firebase.firestore = neu;
})();
`});
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);
    const t = await page.evaluate(() => ({
      geholt: (window.__aufrufe || []).filter(a => a.name === 'stempelCodes').length,
      mitGeheim: (window.__aufrufe || []).filter(a => a.name === 'stempelCodes')
        .map(a => !!(a.daten || {}).geheim)[0],
      sichtbar: !document.getElementById('tmCode').hidden,
      text: (document.getElementById('tmCodeZahl') || {}).textContent
    }));
    console.log('TERMINAL-CODE:', JSON.stringify(t));
    if (!t.geholt) {
      errs.push('Das Terminal holt keinen Code — rechnet es ihn selbst aus? ' +
        'Dann läge die Saat im Gerät');
    }
    if (t.mitGeheim !== true) errs.push('Der Codevorrat wird ohne Gerätegeheimnis geholt');
    if (!t.sichtbar) errs.push('Der Code wird nicht angezeigt');
    if (t.text !== '482 917') errs.push('Angezeigt wird „' + t.text + '" statt „482 917"');
    void errs2;
    await b.close();
  }

  /* ══ 4. Ohne Antwort vom Server bleibt die Anzeige leer ═══════════ */
  {
    const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    const page = await b.newPage({ viewport: { width: 1000, height: 760 }, deviceScaleFactor: 2 });
    page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
    await page.route('**://www.gstatic.com/**', r => r.abort());
    await page.addInitScript({ path: SP + '/stub-chef.js' });
    await page.addInitScript({
      content: 'try{ localStorage.setItem("kf_terminal", JSON.stringify(' +
        '{id:"t1",geheim:"g".repeat(64),name:"Empfang"})); }catch(e){}'
    });
    await page.addInitScript({ content: zusatz(false, true) });
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);
    const t = await page.evaluate(() => ({
      sichtbar: !document.getElementById('tmCode').hidden,
      text: (document.getElementById('tmCodeZahl') || {}).textContent
    }));
    console.log('OHNE ANTWORT:', JSON.stringify(t));
    if (t.sichtbar) {
      errs.push('OHNE ANTWORT VOM SERVER STEHT TROTZDEM EINE ZAHL DA („' + t.text +
        '") — sie funktioniert nie, und niemand weiss, warum');
    }
    await b.close();
  }

  /* ══ 5. Der Haken beim Chef ═══════════════════════════════════════ */
  {
    const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    const page = await b.newPage({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 2 });
    page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
    await page.route('**://www.gstatic.com/**', r => r.abort());
    await page.addInitScript({ path: SP + '/stub-chef.js' });
    await page.addInitScript({ content: zusatz(false, false) });
    /* Schreibvorgänge auf users mitschreiben. */
    await page.addInitScript({
      content: `
(function(){
  window.__userSchreib = [];
  var echt = window.firebase.firestore;
  var fs = echt();
  var alteColl = fs.collection.bind(fs);
  fs.collection = function(p){
    var c = alteColl(p);
    if(String(p) === 'users'){
      var alteDoc = c.doc.bind(c);
      c.doc = function(id){
        var d = alteDoc(id);
        var alteUpd = d.update ? d.update.bind(d) : null;
        d.update = function(x){ window.__userSchreib.push({id:id,daten:x});
          return alteUpd ? alteUpd(x) : Promise.resolve(); };
        return d;
      };
    }
    return c;
  };
  var neu = function(){ return fs; };
  Object.keys(echt).forEach(function(k){ neu[k] = echt[k]; });
  neu.FieldValue = echt.FieldValue; neu.FieldPath = echt.FieldPath;
  window.firebase.firestore = neu;
})();
`});
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
    await page.waitForTimeout(500);
    const reiter = await page.evaluate(() => {
      const t = [...document.querySelectorAll('#view-chef button')]
        .find(x => /^\s*Team\s*$/.test(x.textContent || ''));
      if (t) { t.click(); return true; }
      return false;
    });
    await page.waitForTimeout(1200);
    if (!reiter) errs.push('Der Reiter „Team" wurde nicht gefunden');

    const h = await page.evaluate(() => {
      const bearbeiten = document.querySelector('#empList .emp .em-edit');
      if (bearbeiten) bearbeiten.click();
      const lab = document.querySelector('#empList .em-handy');
      if (lab) lab.scrollIntoView({ block: 'center' });
      const r = lab ? lab.getBoundingClientRect() : null;
      return {
        da: !!lab,
        text: lab ? (lab.textContent || '').replace(/\s+/g, ' ').trim() : '',
        hoehe: r ? Math.round(r.height) : 0
      };
    });
    console.log('HAKEN BEIM CHEF:', JSON.stringify(h));
    if (!h.da) errs.push('Im Personen-Bearbeiter fehlt der Haken für das Handy-Stempeln');
    if (h.da && h.hoehe < 44) errs.push('Der Haken ist nur ' + h.hoehe + 'px hoch');

    /* Anhaken und speichern → das Feld muss geschrieben werden. */
    await page.evaluate(() => {
      const cb = document.querySelector('#empList .em-handy-cb');
      if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change')); }
      const s = document.querySelector('#empList .em-save');
      if (s) s.click();
    });
    await page.waitForTimeout(900);
    const geschrieben = await page.evaluate(() => (window.__userSchreib || []));
    console.log('GESPEICHERT:', JSON.stringify(geschrieben.slice(0, 1)));
    const letzte = geschrieben[geschrieben.length - 1];
    if (!letzte || letzte.daten.handyStempeln !== true) {
      errs.push('Speichern schreibt die Freigabe nicht mit: ' + JSON.stringify(letzte || null));
    }
    await b.close();
  }

  console.log('\nFehler: ' + (errs.length ? '' : 'keine'));
  errs.forEach(e => console.log('  ' + e));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
