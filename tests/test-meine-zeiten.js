/* ── Meine Zeiten ─────────────────────────────────────────────────────

   Was am Tablet gestempelt wurde, muss jeder für sich selbst nachsehen
   können. Ohne das ist die Zeiterfassung eine Einbahnstrasse: man
   stempelt hinein und sieht nie wieder, was daraus geworden ist.

   Geprüft wird:

     · Die Karte steht im Ich-Bereich und zeigt die Tage des Monats.
     · EIN TAG OHNE FEIERABEND BEKOMMT KEINE ZAHL. Wer das Gehen
       vergisst, sieht „Feierabend fehlt" und einen Strich. Eine
       gerechnete Null wäre bequemer und wäre gelogen — sie behauptet
       „null Stunden gearbeitet", wo in Wahrheit die Endzeit fehlt.
     · Ein Tag klappt auf und zeigt die einzelnen Stempel.
     · Der Monat lässt sich zurückblättern, und die Abfrage fragt dann
       auch wirklich den anderen Monat ab.
     · DIE ABFRAGE BENUTZT KEIN orderBy. Das ist keine Stilfrage:
       Gleichheitsfilter plus Sortierung auf einem dritten Feld
       verlangen in Firestore einen zusammengesetzten Index, und dieses
       Projekt verwaltet keinen einzigen (es gibt keine
       firestore.indexes.json). Eine solche Abfrage läuft im Emulator
       grün und scheitert in der Produktion beim ersten Versuch.
     · Es wird NICHTS in `zeiten` geschrieben. Der einzige Schreibweg
       ist die Server-Funktion; die Regeln sagen write:false.
     · Die Tageszeile ist ein Fingerziel von 44 Pixeln.

   WIE HIER GEMOGELT WIRD: die Test-Attrappe kennt `zeiten` nicht.
   Dieser Durchlauf legt eine eigene Antwort für genau diesen Pfad
   darüber und merkt sich dabei jede Filterbedingung. Er prüft damit den
   Weg der App, nicht die Datenbank — was die Datenbank zulässt, steht
   in tests/rules/zeitpin.test.js.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* Attrappe für `zeiten`, die die Filter ernst nimmt — sonst sagt der
   Monatswechsel nichts aus. Läuft NACH stub-chef.js. */
const ZUSATZ = `
(function(){
  var echt = window.firebase.firestore;

  function tagText(d){ return d.toLocaleDateString('sv-SE'); }
  function um(d, std, min){
    var x = new Date(d); x.setHours(std, min, 0, 0); return x.getTime();
  }
  var heute = new Date();
  var gestern = new Date(heute); gestern.setDate(heute.getDate() - 1);
  var vorgestern = new Date(heute); vorgestern.setDate(heute.getDate() - 2);
  function monatVon(t){ return t.slice(0,7); }

  function z(d, art, std, min){
    var t = tagText(d);
    return { id:'z'+t+art, uid:'testuid', name:'Test Chef', studioKey:'huerth',
             art:art, ts:um(d, std, min), tag:t, monat:monatVon(t),
             terminalId:'t1', terminalName:'Empfang' };
  }

  /* Vorgestern: voller Tag mit Pause. Gestern: Feierabend vergessen.
     Heute: im Dienst. */
  var DIESER = [
    z(vorgestern,'kommen',7,58), z(vorgestern,'pause',12,0),
    z(vorgestern,'zurueck',12,30), z(vorgestern,'gehen',16,32),
    z(gestern,'kommen',9,0),
    z(heute,'kommen',8,0)
  ];
  /* Ein Eintrag im VORMONAT, damit das Zurückblättern etwas zu zeigen
     hat. Der 15. liegt in jedem Monat. */
  var vor = new Date(heute.getFullYear(), heute.getMonth()-1, 15);
  var VORMONAT = [ z(vor,'kommen',8,0), z(vor,'gehen',14,0) ];

  window.__zeitAbfragen = [];
  window.__zeitSchreib = [];

  function snapAus(liste){
    var docs = liste.map(function(d){
      return { id:d.id, exists:true, data:function(){ return d; } };
    });
    return { docs:docs, size:docs.length, empty:!docs.length,
             forEach:function(f){ docs.forEach(f); },
             docChanges:function(){ return docs.map(function(d){ return {type:'added',doc:d}; }); } };
  }

  function kette(bed){
    return {
      where:function(f,op,v){ return kette(bed.concat([[f,op,v]])); },
      orderBy:function(f,r){
        bed.__sortiert = true;
        window.__zeitAbfragen.push({ where:bed.slice(), orderBy:String(f) });
        return kette(bed);
      },
      limit:function(){ return kette(bed); },
      get:function(){
        window.__zeitAbfragen.push({ where:bed.slice(), orderBy:bed.__sortiert ? 'ja' : null });
        var alle = DIESER.concat(VORMONAT);
        var raus = alle.filter(function(d){
          return bed.every(function(b){
            if(b[1] !== '==') return true;
            return d[b[0]] === b[2];
          });
        });
        return Promise.resolve(snapAus(raus));
      },
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
    if(/(^|\\/)zeiten$/.test(String(p))) return kette([]);
    return alteColl(p);
  };
  /* Die Anhaengsel mitnehmen — firebase.firestore ist eine Funktion MIT
     Eigenschaften (FieldValue, FieldPath). Wer nur die Funktion ersetzt,
     raeumt sie ab; die App faellt dann dort um, wo sie fv.increment()
     ruft, und die Fehler kommen aus dem Durchlauf statt aus der App. */
  var neu = function(){ return fs; };
  Object.keys(echt).forEach(function(k){ neu[k] = echt[k]; });
  neu.FieldValue = echt.FieldValue;
  neu.FieldPath = echt.FieldPath;
  window.firebase.firestore = neu;

  /* pinStatus soll die Karte nicht mit einem Fehler fuellen. */
  var alteFn = window.firebase.functions;
  window.firebase.functions = function(){
    return { httpsCallable:function(name){
      return function(){ return Promise.resolve({ data:{ gesetzt:true, seit:Date.now() } }); };
    } };
  };
  void alteFn;
})();
`;

async function starten(errs) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
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
  await page.addInitScript({ content: ZUSATZ });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  return { b, page };
}

async function zurKarte(page) {
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-ich"]').click());
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const t = document.querySelector('[data-ichtab="daten"]');
    if (t) t.click();
  });
  await page.waitForTimeout(1200);
}

(async () => {
  const errs = [];
  const { b, page } = await starten(errs);
  await zurKarte(page);

  /* ══ 1. Die Karte, die Summe, die Tage ═════════════════════════════ */
  const k = await page.evaluate(() => {
    const karte = document.getElementById('ichZeitenKarte');
    const zeilen = [...document.querySelectorAll('#ichZeitenListe [data-ztag]')];
    return {
      karte: !!karte && getComputedStyle(karte).display !== 'none',
      summe: (document.getElementById('ichZeitSumme') || {}).textContent || '',
      monat: (document.getElementById('ichZeitMonat') || {}).textContent || '',
      neben: (document.getElementById('ichZeitNeben') || {}).textContent || '',
      tage: zeilen.length,
      texte: zeilen.map(z => (z.textContent || '').replace(/\s+/g, ' ').trim())
    };
  });
  console.log('KARTE:', JSON.stringify(k));
  if (!k.karte) errs.push('Die Karte „Meine Zeiten" fehlt oder ist unsichtbar');
  if (k.tage !== 3) errs.push('Erwartet 3 Tage im Monat, angezeigt ' + k.tage);
  if (!/^\d+:\d\d h$/.test(k.summe)) errs.push('Die Monatssumme sieht nicht aus wie eine Dauer: „' + k.summe + '"');
  if (!/\d{4}/.test(k.monat)) errs.push('Der Monatsname fehlt: „' + k.monat + '"');

  /* Vorgestern: 07:58–16:32 mit 30 Minuten Pause = 8:04 */
  const voll = k.texte.find(t => /8:04 h/.test(t));
  if (!voll) errs.push('Der volle Tag rechnet nicht 8:04 h: ' + JSON.stringify(k.texte));

  /* ══ 2. Der Tag ohne Feierabend bekommt KEINE Zahl ═════════════════ */
  const offen = k.texte.find(t => /Feierabend fehlt/.test(t));
  console.log('OHNE FEIERABEND:', JSON.stringify(offen || null));
  if (!offen) {
    errs.push('Ein Tag ohne „gehen" wird nicht als lückenhaft gekennzeichnet — ' +
      'er steht mit einer Zahl da, die es nicht gibt');
  } else if (/\d:\d\d h/.test(offen)) {
    errs.push('Der Tag ohne Feierabend bekommt trotzdem eine Stundenzahl: „' + offen + '"');
  }

  /* ══ 3. Aufklappen zeigt die einzelnen Stempel ═════════════════════ */
  const auf = await page.evaluate(() => {
    const zeilen = [...document.querySelectorAll('#ichZeitenListe [data-ztag]')];
    const ziel = zeilen[zeilen.length - 1];        // der volle Tag, unten
    const tag = ziel.getAttribute('data-ztag');
    ziel.click();
    const box = document.getElementById('mzs-' + tag);
    return {
      tag: tag,
      offen: box ? !box.hidden : false,
      stempel: box ? box.querySelectorAll('.mz-s').length : 0,
      text: box ? (box.textContent || '').replace(/\s+/g, ' ').trim() : '',
      aria: ziel.getAttribute('aria-expanded')
    };
  });
  console.log('AUFGEKLAPPT:', JSON.stringify(auf));
  if (!auf.offen) errs.push('Ein Tag lässt sich nicht aufklappen');
  if (auf.stempel !== 4) errs.push('Der volle Tag zeigt ' + auf.stempel + ' statt 4 Stempel');
  if (!/Feierabend/.test(auf.text)) errs.push('Die Stempelarten stehen nicht ausgeschrieben: „' + auf.text + '"');
  if (auf.aria !== 'true') errs.push('aria-expanded wird nicht mitgeführt');

  /* ══ 4. Fingerziel der Tageszeile ══════════════════════════════════ */
  const ziel = await page.evaluate(() => {
    const z = document.querySelector('#ichZeitenListe [data-ztag]');
    if (!z) return null;
    z.scrollIntoView({ block: 'center' });
    const r = z.getBoundingClientRect();
    return { h: Math.round(r.height), b: Math.round(r.width) };
  });
  console.log('FINGERZIEL:', JSON.stringify(ziel));
  if (ziel && ziel.h < 44) errs.push('Die Tageszeile ist nur ' + ziel.h + 'px hoch');

  /* ══ 5. Kein orderBy, keine Schreibzugriffe ════════════════════════ */
  const abfrage = await page.evaluate(() => ({
    abfragen: window.__zeitAbfragen || [],
    schreib: window.__zeitSchreib || []
  }));
  console.log('ABFRAGEN:', JSON.stringify(abfrage.abfragen));
  const mitSort = abfrage.abfragen.filter(a => a.orderBy);
  if (mitSort.length) {
    errs.push('Die Abfrage auf `zeiten` benutzt orderBy — das verlangt einen ' +
      'zusammengesetzten Index, den dieses Projekt nicht verwaltet: ' + JSON.stringify(mitSort[0]));
  }
  if (!abfrage.abfragen.length) errs.push('Es wurde gar nicht nach Zeiten gefragt');
  const felder = (abfrage.abfragen[0] || {}).where || [];
  if (!felder.some(f => f[0] === 'uid' && f[2] === 'testuid')) {
    errs.push('Die Abfrage filtert nicht auf die eigene uid: ' + JSON.stringify(felder));
  }
  if (!felder.some(f => f[0] === 'monat')) {
    errs.push('Die Abfrage filtert nicht auf den Monat — sie holt damit alles, ' +
      'was je gestempelt wurde: ' + JSON.stringify(felder));
  }
  if (abfrage.schreib.length) {
    errs.push('AUS DEM BROWSER WIRD IN `zeiten` GESCHRIEBEN: ' + JSON.stringify(abfrage.schreib[0]));
  }

  /* ══ 6. Einen Monat zurück ═════════════════════════════════════════ */
  const zurueck = await page.evaluate(() => {
    document.getElementById('ichZeitPrev').click();
    return true;
  });
  void zurueck;
  await page.waitForTimeout(900);
  const vm = await page.evaluate(() => ({
    monat: (document.getElementById('ichZeitMonat') || {}).textContent || '',
    tage: document.querySelectorAll('#ichZeitenListe [data-ztag]').length,
    letzte: (window.__zeitAbfragen || []).slice(-1)[0] || null
  }));
  console.log('VORMONAT:', JSON.stringify(vm));
  if (vm.tage !== 1) errs.push('Im Vormonat steht 1 Tag bereit, angezeigt ' + vm.tage);
  const m = (vm.letzte && vm.letzte.where || []).find(f => f[0] === 'monat');
  if (!m) errs.push('Beim Zurückblättern wurde nicht neu nach dem Monat gefragt');
  else {
    const soll = (() => {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1);
      return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
    })();
    if (m[2] !== soll) errs.push('Der Vormonat wurde als „' + m[2] + '" abgefragt, erwartet „' + soll + '"');
  }

  /* ══ 7. „Heute" führt zurück ═══════════════════════════════════════ */
  await page.evaluate(() => document.getElementById('ichZeitHeute').click());
  await page.waitForTimeout(900);
  const heute = await page.evaluate(() => document.querySelectorAll('#ichZeitenListe [data-ztag]').length);
  console.log('ZURÜCK AUF HEUTE:', heute);
  if (heute !== 3) errs.push('„Heute" führt nicht in den laufenden Monat zurück (' + heute + ' Tage)');

  await b.close();

  console.log('\nFehler: ' + (errs.length ? '' : 'keine'));
  errs.forEach(e => console.log('  ' + e));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
