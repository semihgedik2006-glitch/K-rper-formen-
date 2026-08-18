/* ── Eigene To-dos: Reihenfolge, Stern, Ändern ────────────────────────
   Aus dem Betrieb gewünscht: mehr Optionen, und eine Liste, die man
   verschieben und direkt abhaken kann.

   Drei Stellen, an denen ein Fehler teuer wäre:

     1. Nach dem Verschieben muss die neue Reihenfolge GESPEICHERT sein.
        Eine Liste, die beim nächsten Öffnen wieder anders steht, ist
        schlimmer als eine, die man gar nicht sortieren kann.
     2. Es dürfen nur die Zeilen geschrieben werden, die sich wirklich
        bewegt haben. Sonst schickt jedes Loslassen so viele
        Schreibvorgänge, wie die Liste lang ist.
     3. Der Griff muss die einzige Stelle sein, an der das Ziehen
        anfängt — sonst lässt sich die Liste auf dem Handy nicht mehr
        scrollen, ohne etwas zu verschieben.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
const pruefe = (b, m) => { if (!b) errs.push(m); };

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 430, height: 900 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 200)));
  p.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text())) {
      fehler.push('KONSOLE: ' + m.text().slice(0, 160));
    }
  });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  await p.addInitScript(() => {
    window.__privat = { aufgaben: [
      { id: 'a', text: 'Erstens',  erledigt: false, sort: 0, ts: 100 },
      { id: 'b', text: 'Zweitens', erledigt: false, sort: 1, ts: 200 },
      { id: 'c', text: 'Drittens', erledigt: false, sort: 2, ts: 300 }
    ] };
  });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2600);

  await p.evaluate(async () => {
    document.querySelector('.mobnav [data-group="g-ich"]').click();
    await new Promise(r => setTimeout(r, 400));
    document.querySelector('[data-ichtab="todo"]').click();
    await new Promise(r => setTimeout(r, 500));
  });

  // ══ 1. Ausgangslage ══
  const start = await p.evaluate(() => ({
    reihe: [...document.querySelectorAll('#ichTodoListe .ich-tdo')]
      .map(z => z.querySelector('.ich-tdo-txt').textContent.trim()),
    griffe: document.querySelectorAll('#ichTodoListe [data-ichgriff]').length,
    sterne: document.querySelectorAll('#ichTodoListe [data-ichtdostern]').length,
    aendern: document.querySelectorAll('#ichTodoListe [data-ichtdobearb]').length
  }));
  console.log('Start:', JSON.stringify(start.reihe));
  pruefe(JSON.stringify(start.reihe) === JSON.stringify(['Erstens', 'Zweitens', 'Drittens']),
    'REIHENFOLGE: die Liste startet als ' + JSON.stringify(start.reihe));
  pruefe(start.griffe === 3, 'GRIFFE: ' + start.griffe + ' statt 3');
  pruefe(start.sterne === 3, 'STERNE: ' + start.sterne + ' statt 3');
  pruefe(start.aendern === 3, 'ÄNDERN: ' + start.aendern + ' Knöpfe statt 3');

  // ══ 2. Verschieben: die letzte Zeile nach ganz oben ══
  {
    const griff = await p.$('#ichTodoListe .ich-tdo:last-child [data-ichgriff]');
    const erste = await p.$('#ichTodoListe .ich-tdo:first-child');
    if (!griff || !erste) errs.push('FEHLT: Griff oder erste Zeile nicht gefunden');
    else {
      await p.evaluate(() => { window.__schreib = []; });
      const g = await griff.boundingBox();
      const e = await erste.boundingBox();
      await p.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
      await p.mouse.down();
      // In Schritten, sonst sieht der Beobachter nur Anfang und Ende
      for (let i = 1; i <= 6; i++) {
        await p.mouse.move(g.x + g.width / 2,
          g.y + g.height / 2 + (e.y - g.y) * i / 6);
        await p.waitForTimeout(40);
      }
      await p.mouse.up();
      await p.waitForTimeout(500);

      const r = await p.evaluate(() => ({
        reihe: [...document.querySelectorAll('#ichTodoListe .ich-tdo')]
          .map(z => z.querySelector('.ich-tdo-txt').textContent.trim()),
        schreib: window.__schreib
      }));
      console.log('Nach dem Ziehen:', JSON.stringify(r.reihe));
      console.log('  geschrieben:', JSON.stringify(r.schreib));

      pruefe(r.reihe[0] === 'Drittens',
        'ZIEHEN: oben steht ' + JSON.stringify(r.reihe[0]) + ' statt „Drittens" — ' +
        'die Zeile ist nicht mitgekommen');
      pruefe(r.reihe.length === 3,
        'ZIEHEN: die Liste hat jetzt ' + r.reihe.length + ' Zeilen statt 3');

      /* Gespeichert? Ohne das steht die Liste beim nächsten Öffnen
         wieder anders — schlimmer als gar kein Sortieren. */
      const geschrieben = r.schreib.filter(w => /aufgaben\//.test(w.pfad));
      pruefe(geschrieben.length > 0,
        'NICHT GESPEICHERT: das Verschieben löst keinen Schreibvorgang aus');
      pruefe(geschrieben.every(w => w.art === 'update'),
        'ZIEHEN: geschrieben wurde ' +
        JSON.stringify(geschrieben.map(w => w.art)) + ' statt lauter update');
      pruefe(geschrieben.every(w => typeof (w.daten || {}).sort === 'number'),
        'ZIEHEN: es wird kein sort geschrieben (' +
        JSON.stringify(geschrieben.map(w => w.daten)) + ')');
      /* Und nur was sich bewegt hat. Bei drei Zeilen, von denen eine
         ganz nach oben wandert, ändern sich alle drei Positionen —
         mehr als drei wären trotzdem falsch. */
      pruefe(geschrieben.length <= 3,
        'ZU VIELE SCHREIBVORGÄNGE: ' + geschrieben.length + ' bei einer Liste ' +
        'von 3 Zeilen — offenbar wird bei jeder Bewegung geschrieben');
    }
  }

  /* ══ 2b. GEGENPROBE ══
     Ziehen NEBEN dem Griff darf nichts verschieben. Ohne diese Runde
     wäre der Durchlauf auch dann grün, wenn die ganze Zeile ziehbar
     wäre — und dann kann man auf dem Handy nicht mehr scrollen. */
  {
    const vorher = await p.evaluate(() =>
      [...document.querySelectorAll('#ichTodoListe .ich-tdo')]
        .map(z => z.querySelector('.ich-tdo-txt').textContent.trim()));
    const txt = await p.$('#ichTodoListe .ich-tdo:last-child .ich-tdo-txt');
    const ziel = await p.$('#ichTodoListe .ich-tdo:first-child');
    const t = await txt.boundingBox(), z = await ziel.boundingBox();
    await p.mouse.move(t.x + 10, t.y + t.height / 2);
    await p.mouse.down();
    for (let i = 1; i <= 5; i++) {
      await p.mouse.move(t.x + 10, t.y + t.height / 2 + (z.y - t.y) * i / 5);
      await p.waitForTimeout(35);
    }
    await p.mouse.up();
    await p.waitForTimeout(400);
    const nachher = await p.evaluate(() =>
      [...document.querySelectorAll('#ichTodoListe .ich-tdo')]
        .map(z => z.querySelector('.ich-tdo-txt').textContent.trim()));
    console.log('Gegenprobe (neben dem Griff):', JSON.stringify(nachher));
    pruefe(JSON.stringify(vorher) === JSON.stringify(nachher),
      'GEGENPROBE: Ziehen NEBEN dem Griff hat sortiert (' + JSON.stringify(vorher) +
      ' → ' + JSON.stringify(nachher) + ') — dann lässt sich die Liste auf dem ' +
      'Handy nicht mehr scrollen');
  }

  // ══ 3. Stern ══
  {
    const r = await p.evaluate(async () => {
      window.__schreib = [];
      const s = document.querySelector('#ichTodoListe [data-ichtdostern]');
      const vorher = s.classList.contains('an');
      s.click();
      await new Promise(r => setTimeout(r, 350));
      return { vorher, nachher: s.classList.contains('an'), schreib: window.__schreib };
    });
    console.log('Stern:', r.vorher, '→', r.nachher, '·', JSON.stringify(r.schreib));
    pruefe(r.vorher === false && r.nachher === true,
      'STERN: der Zustand springt nicht um (' + r.vorher + ' → ' + r.nachher + ')');
    const w = r.schreib[0];
    pruefe(w && w.daten && w.daten.wichtig === true,
      'STERN: geschrieben wurde ' + JSON.stringify(w && w.daten));
  }

  // ══ 4. Ändern in der Zeile ══
  {
    const r = await p.evaluate(async () => {
      document.querySelector('#ichTodoListe [data-ichtdobearb]').click();
      await new Promise(r => setTimeout(r, 300));
      const felder = document.querySelectorAll('#ichTodoListe [data-tdf]').length;
      const fokus = document.activeElement && document.activeElement.getAttribute('data-tdf');

      window.__schreib = [];
      document.querySelector('[data-tdf="text"]').value = 'Umbenannt';
      document.querySelector('[data-tdf="notiz"]').value = 'mit Notiz';
      document.querySelector('[data-tdf="frist"]').value = '2026-12-24';
      document.querySelector('[data-tdspeichern]').click();
      await new Promise(r => setTimeout(r, 450));
      return { felder, fokus, schreib: window.__schreib };
    });
    console.log('Ändern · Felder:', r.felder, '· Fokus:', r.fokus);
    console.log('  geschrieben:', JSON.stringify(r.schreib));
    pruefe(r.felder === 3, 'ÄNDERN: ' + r.felder + ' Felder statt 3 (Text, Frist, Notiz)');
    pruefe(r.fokus === 'text', 'ÄNDERN: der Cursor steht in ' + JSON.stringify(r.fokus));
    const w = r.schreib[0];
    if (!w) errs.push('ÄNDERN: „Speichern" schreibt nichts');
    else {
      pruefe(w.art === 'update', 'ÄNDERN: geschrieben wurde „' + w.art + '"');
      pruefe(w.daten.text === 'Umbenannt',
        'ÄNDERN: Text = ' + JSON.stringify(w.daten.text));
      pruefe(w.daten.notiz === 'mit Notiz',
        'ÄNDERN: Notiz = ' + JSON.stringify(w.daten.notiz));
      pruefe(w.daten.frist === '2026-12-24',
        'ÄNDERN: Frist = ' + JSON.stringify(w.daten.frist));
    }
    // GEGENPROBE: leerer Text wird abgewiesen
    const leer = await p.evaluate(async () => {
      document.querySelector('#ichTodoListe [data-ichtdobearb]').click();
      await new Promise(r => setTimeout(r, 300));
      window.__schreib = [];
      document.querySelector('[data-tdf="text"]').value = '   ';
      document.querySelector('[data-tdspeichern]').click();
      await new Promise(r => setTimeout(r, 400));
      const n = window.__schreib.length;
      const ab = document.querySelector('[data-tdabbruch]');
      if (ab) ab.click();
      await new Promise(r => setTimeout(r, 250));
      return n;
    });
    pruefe(leer === 0, 'GEGENPROBE: ein leeres To-do wurde gespeichert (' + leer + ')');
  }

  if (fehler.length) errs.push(fehler.slice(0, 3).join(' | '));
  console.log('Konsole:', fehler.length ? fehler.length + ' Meldungen' : 'sauber');

  await b.close();
  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ To-dos: verschieben speichert die Reihenfolge, nur der Griff zieht, ' +
      'Stern und Ändern schreiben was sie sollen');
  process.exit(errs.length ? 1 : 0);
})();
