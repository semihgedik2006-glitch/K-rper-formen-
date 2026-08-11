/* ── Kürzel im Putzplan und Grund an der Aufgabe ──────────────────────
   Beides kommt aus demselben Umstand: am Anfang bekommt nicht jede
   Person einen eigenen Zugang, sondern jedes Studio einen. Damit steht
   unter jedem Haken derselbe Name, und der Chef weiss nicht, wer was
   getan hat — und schon gar nicht, warum etwas liegen blieb.

   Geprüft wird deshalb vor allem, ob die Auskunft am Ende STIMMT:

     1. Das Kürzel wird beim Abhaken mitgeschrieben.
     2. Es bleibt auf dem Gerät (nächste Schicht, dasselbe Tablet).
     3. Ohne Kürzel bleibt alles wie vorher — niemand wird gezwungen.
     4. Der Grund steht IN der Liste, nicht nur im Blatt dahinter. Wer
        ihn im Vorbeigehen nicht sieht, sieht ihn nie.
     5. An einer ERLEDIGTEN Aufgabe gibt es kein Grundfeld. Ein
        stehengebliebener Grund an etwas Erledigtem führt in die Irre.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];

async function start(kuerzel) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  /* Schreibvorgänge mitschneiden: was beim Abhaken wirklich in der
     Datenbank landet, ist die Frage — nicht was auf dem Schirm steht. */
  await page.addInitScript(`
    window.__updates = [];
    ${kuerzel ? "try{ localStorage.setItem('kf_pp_kuerzel', " + JSON.stringify(kuerzel) + "); }catch(e){}" : ''}
    var warten = setInterval(function(){
      if (!window.firebase || !window.firebase.firestore) return;
      clearInterval(warten);
      var fs = window.firebase.firestore();
      var echt = fs.collection.bind(fs);
      fs.collection = function(p){
        var k = echt(p);
        var d = k.doc && k.doc.bind(k);
        if (d) k.doc = function(id){
          var o = d(id);
          var c = o.collection && o.collection.bind(o);
          if (c) o.collection = function(sub){
            var kk = c(sub);
            var dd = kk.doc.bind(kk);
            kk.doc = function(id2){
              var oo = dd(id2);
              var up = oo.update;
              oo.update = function(daten){
                window.__updates.push({ sammlung: sub, id: id2, daten: daten });
                return up ? up.apply(oo, arguments) : Promise.resolve();
              };
              return oo;
            };
            return kk;
          };
          return o;
        };
        return k;
      };
    }, 2);
    setTimeout(function(){ clearInterval(warten); }, 3000);`);
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
  await page.waitForTimeout(700);
  /* Die Auswahl steht auf Brühl, und Putzdaten hat im Stub nur Hürth
     (studio-6). Ohne diesen Schritt prüft der Durchlauf einen leeren
     Putzplan und meldet „kein Putzpunkt da" — was wie ein Fehler in der
     App aussieht und einer im Testaufbau ist. */
  await page.evaluate(() => {
    const sel = document.getElementById('ppStudio');
    if (!sel) return;
    sel.value = 'studio-6';
    if (sel.onchange) sel.onchange();
  });
  await page.waitForTimeout(600);
}

(async () => {
  // ══ 1. Mit Kürzel: es landet im Schreibvorgang ══
  {
    const { b, page } = await start('AB');
    await zumPutzplan(page);
    const feld = await page.evaluate(() => {
      const f = document.getElementById('ppKuerzel');
      return f ? f.value : null;
    });
    console.log('Feld beim Öffnen:', JSON.stringify(feld));
    if (feld !== 'AB') errs.push('FEHLT: das gemerkte Kürzel steht nicht im Feld (' + feld + ')');

    const geschrieben = await page.evaluate(async () => {
      const c = document.querySelector('#ppList [data-check]');
      if (!c) return 'kein Putzpunkt da';
      c.click();
      await new Promise(r => setTimeout(r, 400));
      const u = window.__updates.filter(x => x.sammlung === 'cleaning');
      return u.length ? u[u.length - 1].daten : 'nichts geschrieben';
    });
    console.log('Abhaken mit Kürzel:', JSON.stringify(geschrieben));
    if (!geschrieben || geschrieben.doneKuerzel !== 'AB') {
      errs.push('FEHLT: das Kürzel wird beim Abhaken nicht mitgeschrieben');
    }
    /* Der Kontoname muss TROTZDEM mit — beides zusammen beantwortet die
       Frage: an welchem Gerät, und wer stand davor. */
    if (!geschrieben || !geschrieben.doneBy) {
      errs.push('FEHLT: der Kontoname fehlt jetzt — das Kürzel soll ihn ergänzen, nicht ersetzen');
    }
    await b.close();
  }

  // ══ 2. Ohne Kürzel: alles wie vorher, niemand wird gezwungen ══
  {
    const { b, page } = await start(null);
    await zumPutzplan(page);
    const geschrieben = await page.evaluate(async () => {
      const c = document.querySelector('#ppList [data-check]');
      if (!c) return 'kein Putzpunkt da';
      c.click();
      await new Promise(r => setTimeout(r, 400));
      const u = window.__updates.filter(x => x.sammlung === 'cleaning');
      return u.length ? u[u.length - 1].daten : 'nichts geschrieben';
    });
    console.log('Abhaken ohne Kürzel:', JSON.stringify(geschrieben));
    if (!geschrieben || !geschrieben.doneBy) {
      errs.push('KAPUTT: ohne Kürzel wird gar nichts mehr geschrieben');
    }
    if (geschrieben && geschrieben.doneKuerzel) {
      errs.push('FALSCH: ohne Eingabe steht trotzdem ein Kürzel drin');
    }
    await b.close();
  }

  // ══ 3. Das Kürzel bleibt auf dem Gerät ══
  {
    const { b, page } = await start(null);
    await zumPutzplan(page);
    const gemerkt = await page.evaluate(async () => {
      const f = document.getElementById('ppKuerzel');
      if (!f) return 'kein Feld';
      f.value = 'CD';
      f.dispatchEvent(new Event('input'));
      await new Promise(r => setTimeout(r, 150));
      return localStorage.getItem('kf_pp_kuerzel');
    });
    console.log('Gemerkt:', JSON.stringify(gemerkt));
    if (gemerkt !== 'CD') errs.push('FEHLT: das Kürzel wird nicht auf dem Gerät gemerkt');
    await b.close();
  }

  // ══ 4. Der Grund: im Blatt setzbar, in der LISTE sichtbar ══
  {
    const { b, page } = await start('AB');
    await page.evaluate(() => {
      const g = document.querySelector('.mobnav [data-group="g-arbeit"]');
      if (g) g.click();
    });
    await page.waitForTimeout(600);

    const lage = await page.evaluate(async () => {
      // Eine OFFENE Aufgabe suchen und ihr Blatt öffnen
      const karte = document.querySelector('.todo:not(.done)');
      if (!karte) return { fehler: 'keine offene Aufgabe' };
      const mehr = karte.querySelector('[data-tmehr]');
      if (!mehr) return { fehler: 'kein Mehr-Knopf' };
      mehr.click();
      await new Promise(r => setTimeout(r, 350));
      const box = document.getElementById('tbGrundBox');
      const sichtbarOffen = box && getComputedStyle(box).display !== 'none';

      const f = document.getElementById('tbGrund');
      if (f) f.value = 'Reinigungsmittel war leer';
      const sp = document.getElementById('tbGrundSpeichern');
      if (sp) sp.click();
      await new Promise(r => setTimeout(r, 500));
      const u = window.__updates.filter(x => x.sammlung === 'todos');
      return {
        sichtbarOffen: sichtbarOffen,
        geschrieben: u.length ? u[u.length - 1].daten : null
      };
    });
    console.log('Grund:', JSON.stringify(lage));
    if (lage.fehler) errs.push('AUFBAU: ' + lage.fehler);
    else {
      if (!lage.sichtbarOffen) errs.push('FEHLT: bei einer offenen Aufgabe gibt es kein Grundfeld');
      if (!lage.geschrieben || lage.geschrieben.grund !== 'Reinigungsmittel war leer') {
        errs.push('FEHLT: der Grund wird nicht gespeichert');
      }
      /* Wer und wann — sonst fragt der Chef nach einer Woche, von wann
         die Notiz ist, und niemand weiss es. */
      if (lage.geschrieben && !lage.geschrieben.grundVon) {
        errs.push('FEHLT: beim Grund steht nicht, wer ihn geschrieben hat');
      }
      if (lage.geschrieben && lage.geschrieben.grundVon !== 'AB') {
        errs.push('FALSCH: der Grund trägt nicht das Kürzel (' + lage.geschrieben.grundVon + ')');
      }
    }
    await b.close();
  }

  // ══ 5. An einer ERLEDIGTEN Aufgabe kein Grundfeld ══
  {
    const { b, page } = await start(null);
    await page.evaluate(() => {
      const g = document.querySelector('.mobnav [data-group="g-arbeit"]');
      if (g) g.click();
    });
    await page.waitForTimeout(600);
    const zu = await page.evaluate(async () => {
      const karte = document.querySelector('.todo.done');
      if (!karte) return 'keine erledigte Aufgabe';
      const mehr = karte.querySelector('[data-tmehr]');
      if (!mehr) return 'kein Mehr-Knopf';
      mehr.click();
      await new Promise(r => setTimeout(r, 350));
      const box = document.getElementById('tbGrundBox');
      return box ? getComputedStyle(box).display : 'keine Box';
    });
    console.log('Erledigte Aufgabe, Grundfeld:', zu);
    if (zu !== 'none' && zu !== 'keine erledigte Aufgabe') {
      errs.push('FALSCH: auch an einer erledigten Aufgabe steht ein Grundfeld (' + zu + ')');
    }
    await b.close();
  }

  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Kürzel und Grund: werden mitgeschrieben, bleiben am Gerät, und ohne Eingabe ändert sich nichts');
  process.exit(errs.length ? 1 : 0);
})();
