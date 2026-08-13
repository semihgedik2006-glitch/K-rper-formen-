/* ── Drei Kleinigkeiten aus dem Alltag ────────────────────────────────
   Pausierte Putzpunkte, „Ich übernehme das", und die Farbe der Firma.
   Zusammen in einem Durchlauf, weil für einen einzelnen Knopf sonst
   niemand einen schreibt — und Wochen später merkt jemand, dass er
   nichts tut.

     1. Ein pausierter Punkt bleibt SICHTBAR, aber ohne Haken. Versteckt
        sucht ihn in vier Wochen jemand vergeblich.
     2. Pausierte zählen NICHT in „x von y erledigt". Sonst steht dort
        dauerhaft eine Zahl, die niemand erreichen kann.
     3. Der Knopf schreibt ein Enddatum — die Aufgabe kommt von selbst
        zurück, gelöscht wird nichts.
     4. „Ich übernehme das" steht nur an OFFENEN Aufgaben ohne Besitzer
        und schreibt die eigene Kennung.
     5. An einer Aufgabe, die schon jemandem gehört, steht der Knopf
        nicht — sonst nimmt man sie einem anderen lautlos weg.
     6. Die Firmenfarbe kommt aus der Datenbank und setzt --accent. Ohne
        Eintrag bleibt alles wie vorher.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];

function tagPlus(n) {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toLocaleDateString('sv-SE');
}

async function start(opt) {
  opt = opt || {};
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript(
    'window.__marke = ' + JSON.stringify(opt.marke || null) + ';' +
    'window.__ppPause = ' + JSON.stringify(opt.ppPause || null) + ';');
  /* Schreibvorgänge mitschneiden: was wirklich in der Datenbank landet,
     ist die Frage — nicht was auf dem Schirm steht. */
  await page.addInitScript(`
    window.__updates = [];
    var warten = setInterval(function(){
      if (!window.firebase || !window.firebase.firestore) return;
      clearInterval(warten);
      var fs = window.firebase.firestore();
      var echt = fs.collection.bind(fs);
      function an(k, name){
        var d = k.doc && k.doc.bind(k); if(!d) return k;
        k.doc = function(id){
          var o = d(id);
          if (o.update && !o.update.__um) {
            var up = o.update;
            o.update = function(daten){
              window.__updates.push({ sammlung: name, id: id, daten: daten });
              return up.apply(o, arguments);
            };
            o.update.__um = true;
          }
          var c = o.collection && o.collection.bind(o);
          if (c) o.collection = function(sub){ return an(c(sub), sub); };
          return o;
        };
        return k;
      }
      fs.collection = function(p){ return an(echt(p), p); };
    }, 2);
    setTimeout(function(){ clearInterval(warten); }, 3000);`);
  await page.addInitScript({ path: path.join(SP, opt.stub || 'stub-chef.js') });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  return { b, page };
}

async function zumPutzplan(page) {
  await page.evaluate(() => {
    const g = document.querySelector('.mobnav [data-group="g-arbeit"]');
    if (g) g.click();
  });
  await page.waitForTimeout(350);
  await page.evaluate(() => {
    const t = document.querySelector('[data-subview="putzplan"]');
    if (t) t.click();
  });
  await page.waitForTimeout(600);
  // Putzdaten hat im Stub nur Hürth (studio-6) — siehe test-kuerzel-grund
  await page.evaluate(() => {
    const sel = document.getElementById('ppStudio');
    if (!sel) return;
    sel.value = 'studio-6';
    if (sel.onchange) sel.onchange();
  });
  await page.waitForTimeout(600);
}

(async () => {
  // ══ 1.+2. Ein pausierter Punkt: sichtbar, ohne Haken, zählt nicht ══
  {
    const { b, page } = await start({ ppPause: { id: 'c2', bis: tagPlus(14) } });
    await zumPutzplan(page);
    const lage = await page.evaluate(() => {
      const p = document.querySelector('#ppList .pp-item.pausiert');
      const prog = document.getElementById('ppProgress');
      return {
        da: !!p,
        titel: p ? (p.querySelector('.pp-title') || {}).textContent : null,
        haken: !!(p && p.querySelector('[data-check]')),
        text: p ? p.textContent : '',
        fortschritt: prog ? prog.textContent : '',
        gesamt: document.querySelectorAll('#ppList .pp-item').length
      };
    });
    console.log('1. Pausiert:', JSON.stringify(lage));
    if (!lage.da) {
      errs.push('VERSTECKT: der pausierte Punkt ist gar nicht mehr da — in vier Wochen ' +
                'sucht jemand einen Punkt, den es scheinbar nicht gibt');
    } else {
      if (lage.haken) errs.push('FALSCH: ein pausierter Punkt hat trotzdem einen Haken');
      if (lage.text.indexOf('pausiert bis') < 0) {
        errs.push('FEHLT: es steht nicht dabei, bis wann pausiert ist');
      }
      if (lage.fortschritt.indexOf('pausiert') < 0) {
        errs.push('FEHLT: der Fortschritt sagt nicht, dass etwas pausiert ist');
      }
      /* Der eigentliche Punkt: die Zahl muss erreichbar bleiben. */
      const m = /(\d+) von (\d+) erledigt/.exec(lage.fortschritt);
      if (m && Number(m[2]) >= lage.gesamt) {
        errs.push('MITGEZÄHLT: der pausierte Punkt steckt in „x von y" — dann steht dort ' +
                  'dauerhaft eine Zahl, die niemand erreichen kann');
      }
    }
    await b.close();
  }

  // ══ 3. Der Knopf schreibt ein Enddatum, nicht ein Löschen ══
  {
    const { b, page } = await start({});
    await zumPutzplan(page);
    const geschrieben = await page.evaluate(async () => {
      const b2 = document.querySelector('#ppList [data-pause]');
      if (!b2) return 'kein Knopf';
      b2.click();
      await new Promise(r => setTimeout(r, 500));
      const u = window.__updates.filter(x => x.sammlung === 'cleaning');
      return u.length ? u[u.length - 1].daten : 'nichts geschrieben';
    });
    console.log('3. Pausieren schreibt:', JSON.stringify(geschrieben));
    if (typeof geschrieben === 'string') {
      errs.push('FEHLT: ' + geschrieben + ' — pausieren tut nichts');
    } else if (!geschrieben.pausiertBis) {
      errs.push('FEHLT: es wird kein Enddatum geschrieben, die Pause hätte kein Ende');
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(geschrieben.pausiertBis)) {
      errs.push('FALSCH: das Enddatum sieht nicht aus wie ein Datum (' + geschrieben.pausiertBis + ')');
    }
    await b.close();
  }

  // ══ 4.+5. „Ich übernehme das" ══
  {
    const { b, page } = await start({ stub: 'stub-mitarbeiter.js' });
    await page.evaluate(() => {
      const g = document.querySelector('.mobnav [data-group="g-arbeit"]');
      if (g) g.click();
    });
    await page.waitForTimeout(700);
    const lage = await page.evaluate(async () => {
      const offen = document.querySelector('.todo:not(.done) [data-tnimm]');
      const zahlVorher = document.querySelectorAll('[data-tnimm]').length;
      /* Gegenprobe im selben Durchlauf: an einer Karte, die schon eine
         Zuweisung trägt, darf KEIN Übernehmen-Knopf stehen. */
      const schonVergeben = [].slice.call(document.querySelectorAll('.todo'))
        .filter(k => k.querySelector('.t-assign'))
        .filter(k => k.querySelector('[data-tnimm]')).length;
      if (!offen) return { fehler: 'kein Übernehmen-Knopf an einer offenen Aufgabe' };
      offen.click();
      await new Promise(r => setTimeout(r, 500));
      const u = window.__updates.filter(x => x.sammlung === 'todos');
      return {
        zahlVorher, schonVergeben,
        geschrieben: u.length ? u[u.length - 1].daten : null
      };
    });
    console.log('4. Übernehmen:', JSON.stringify(lage));
    if (lage.fehler) errs.push('FEHLT: ' + lage.fehler);
    else {
      if (!lage.geschrieben || !lage.geschrieben.assignedTo) {
        errs.push('FEHLT: „Ich übernehme das" schreibt keine Zuweisung');
      }
      if (lage.geschrieben && !lage.geschrieben.assignedName) {
        errs.push('FEHLT: der Name fehlt — dann steht bei den anderen „für ?"');
      }
      if (lage.schonVergeben) {
        errs.push('WEGGENOMMEN: auch an einer bereits zugewiesenen Aufgabe steht der Knopf — ' +
                  'damit nimmt man sie einem anderen lautlos weg');
      }
    }
    await b.close();
  }

  // ══ 6. Die Farbe der Firma ══
  {
    const { b, page } = await start({ marke: { farbe: 'gruen' } });
    const farbe = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--accent').trim());
    /* Grün hat ZWEI Werte: einen für den dunklen Modus, einen für den
       hellen. Genau darin liegt der Sinn der festen Auswahl — eine
       einzige Farbe wäre in einem der beiden Modi schlecht lesbar. Der
       Durchlauf darf sich deshalb nicht auf einen Wert festlegen; beim
       ersten Anlauf tat er das und meldete einen Fehler, der keiner war
       (der Testbrowser stand auf hell). */
    console.log('6. Farbe gesetzt:', JSON.stringify(farbe));
    const gruen = ['#34d399', '#047857'];
    if (!farbe) errs.push('FEHLT: die Firmenfarbe wird nicht angewendet');
    else if (gruen.indexOf(farbe.toLowerCase()) < 0) {
      errs.push('FALSCH: es wird nicht die gewählte Farbe gesetzt (' + farbe +
                ', erwartet einer von ' + gruen.join(' / ') + ')');
    }
    await b.close();
  }

  /* ══ 6b. Ohne Eintrag ändert sich NICHTS ══
     Der wichtigere der beiden Fälle: heute hat kein Betrieb einen
     Eintrag. Würde die App trotzdem etwas setzen, sähen alle vierzehn
     Studios morgen früh eine andere Farbe, ohne dass jemand etwas
     bestellt hätte. */
  {
    const { b, page } = await start({});
    const farbe = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--accent').trim());
    console.log('6b. Ohne Eintrag:', JSON.stringify(farbe));
    if (farbe) {
      errs.push('UNGEFRAGT: ohne Eintrag wird trotzdem eine Farbe gesetzt (' + farbe + ')');
    }
    await b.close();
  }

  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Alltag: Pause zählt nicht mit, Übernehmen schreibt sich zu, Farbe nur auf Wunsch');
  process.exit(errs.length ? 1 : 0);
})();
