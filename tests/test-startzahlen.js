/* „Alles erledigt", obwohl der Putzplan voll ist.

   Gemeldet aus dem Betrieb: die Startseite zeigte beim Öffnen der App
   „Alles erledigt" – die offenen Putzaufgaben tauchten erst auf, nachdem
   man einmal auf den Putzplan gegangen war.

   Grund: die Startseite zählte _ppTasks, und darin stand nur das Studio,
   das im Putzplan gerade geöffnet war. Beim Start: nichts. Danach: eins
   von vierzehn.

   Dieser Durchlauf prüft beides:
     1. Die Zahl steht SOFORT, ohne den Putzplan je geöffnet zu haben.
     2. Sie zählt ALLE Studios, die mich etwas angehen – nicht nur eins.

   Der Stub liefert Putzaufgaben in zwei Studios (studio-6 und studio-7),
   damit ein Fehler „zählt nur das erste" auffällt.                     */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Zwei Studios mit offenen Putzaufgaben in den Chef-Stub schieben.
const ZWEI_STUDIOS = `
(function(){
  var fs = window.firebase.firestore();
  var echt = fs.collection.bind(fs);
  var EXTRA = {
    'studio-6': [
      { id:'x1', title:'Böden wischen',     done:false, ts: Date.now()-90000000 },
      { id:'x2', title:'Spiegel putzen',    done:false, ts: Date.now()-80000000 },
      { id:'x3', title:'Toiletten',         done:true,  doneAt: Date.now()-3600000, ts: Date.now()-70000000 }
    ],
    'studio-7': [
      { id:'y1', title:'Empfang wischen',   done:false, ts: Date.now()-60000000 },
      { id:'y2', title:'Kabinen',           done:false, ts: Date.now()-50000000 }
    ]
  };
  window.__erwartetOffen = 4;   // 2 + 2
  fs.collection = function(pfad){
    var k = echt(pfad);
    if (pfad === 'studios') {
      var d = k.doc.bind(k);
      k.doc = function(sk){
        var o = d(sk);
        var c = o.collection.bind(o);
        o.collection = function(sub){
          var q = c(sub);
          if (sub === 'cleaning' && EXTRA[sk]) {
            var liste = EXTRA[sk];
            var kette = { orderBy:function(){ return kette; }, limit:function(){ return kette; },
              where:function(){ return kette; },
              get:function(){ return Promise.resolve(snap()); },
              onSnapshot:function(cb){ try{ cb(snap()); }catch(e){ console.error(e); } return function(){}; } };
            function snap(){
              var docs = liste.map(function(t){ return { id:t.id, data:function(){ return t; } }; });
              return { docs:docs, size:docs.length, empty:!docs.length,
                       forEach:function(f){ docs.forEach(f); }, docChanges:function(){ return []; } };
            }
            return kette;
          }
          return q;
        };
        return o;
      };
    }
    return k;
  };
})();`;

(async () => {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 160));
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.addInitScript(ZWEI_STUDIOS);
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // ══ 1. Ohne den Putzplan je geöffnet zu haben ══
  const start = await page.evaluate(() => {
    const kacheln = [...document.querySelectorAll('#homeGrid .home-tile')].map(t => ({
      zahl: (t.querySelector('.hn') || {}).getAttribute ? t.querySelector('.hn').getAttribute('data-zahl') : null,
      text: (t.querySelector('.hl') || {}).textContent || '',
    }));
    return {
      kacheln,
      allesErledigt: !!document.querySelector('#homeGrid .home-ruhe'),
      erwartet: window.__erwartetOffen,
    };
  });
  const putz = start.kacheln.find(k => /Putzplan/.test(k.text));
  console.log('Kacheln beim Start:', JSON.stringify(start.kacheln));
  console.log('„Alles erledigt" angezeigt:', start.allesErledigt);

  if (start.allesErledigt) {
    errs.push('DER GEMELDETE FEHLER: „Alles erledigt", obwohl ' + start.erwartet + ' Putzaufgaben offen sind');
  }
  if (!putz) {
    errs.push('FEHLT: gar keine Putzplan-Kachel auf der Startseite');
  } else if (Number(putz.zahl) !== start.erwartet) {
    errs.push('FALSCHE ZAHL: Putzplan-Kachel zeigt ' + putz.zahl +
      ', offen sind aber ' + start.erwartet + ' (zählt sie nur ein Studio?)');
  }

  // ══ 2. Nach dem Öffnen des Putzplans darf sich die Zahl NICHT ändern ══
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-arbeit"]').click());
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    const e = document.querySelector('[data-subview="putzplan"]'); if (e) e.click();
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-start"]').click());
  await page.waitForTimeout(1200);

  const danach = await page.evaluate(() => {
    const t = [...document.querySelectorAll('#homeGrid .home-tile')]
      .find(x => /Putzplan/.test((x.querySelector('.hl') || {}).textContent || ''));
    return t ? t.querySelector('.hn').getAttribute('data-zahl') : null;
  });
  console.log('Nach dem Putzplan-Besuch:', danach);
  if (putz && danach !== putz.zahl) {
    errs.push('WACKELT: Zahl war ' + putz.zahl + ', nach dem Besuch ' + danach +
      ' – die Startseite hängt immer noch am geöffneten Studio');
  }

  await page.screenshot({ path: SP + '/startzahlen.png' });
  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ') : '\n✓ Startzahlen: Putzplan zählt sofort und über alle Studios');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
