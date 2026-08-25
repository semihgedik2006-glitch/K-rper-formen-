/* ── Leere Zustände mit einem Weg heraus ──────────────────────────────
   „Noch keine Mitarbeiter angelegt" ist eine Feststellung. „Noch niemand
   da — Zugang anlegen" ist ein Weg.

   Geprüft wird nicht, dass irgendwo ein Knopf steht, sondern:

     1. Jeder Weg-Knopf zeigt auf ein Bedienelement, das es WIRKLICH
        gibt und das sichtbar ist. Ein leerer Zustand, der einen Weg
        verspricht und keinen hat, ist schlimmer als einer ohne.
     2. Der Knopf tut auch etwas — geklickt muss sich der Bildschirm
        messbar ändern.
     3. Wer den Weg nicht gehen DARF, bekommt ihn nicht angeboten.
        Ein Mitarbeiter sieht „+ Neu" bei den Aufgaben nicht; ihm einen
        Knopf dorthin zu zeigen wäre eine Sackgasse mit Einladung.
     4. Gegenprobe: ein Ziel, das es nicht gibt, muss auffallen.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* Alles leer: nur dann treten die leeren Zustände überhaupt auf.

   __users und __todos gab es in den Attrappen noch nicht. Ohne sie kamen
   zwei der vier verdrahteten Stellen im Durchlauf gar nicht vor — die
   Attrappe hatte dort Daten, der Durchlauf war grün, und zwei Wege waren
   ungeprüft. Genau das ist die Sorte grün, die nichts wert ist.

   __users bleibt NICHT leer: das eigene Konto muss drin sein, sonst
   scheitert die App an einer anderen Stelle und der Durchlauf misst
   wieder etwas anderes als er behauptet. */
const LEER = `
  window.__handovers = {};
  window.__board = [];
  window.__certs = [];
  window.__todos = {};
  window.__users = [{ id:'testuid', firma:'koerperformen', name:'Test Chef',
                      role:'chef', studios:['Hürth','Brühl'] }];
`;

const GRUPPEN = ['g-start', 'g-ich', 'g-komm', 'g-arbeit', 'g-team', 'g-chef'];

async function lauf(rolle, extra) {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 900 } });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) {
      errs.push('CONSOLE: ' + m.text().slice(0, 160));
    }
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-' + rolle + '.js' });
  await page.addInitScript(LEER);
  if (extra) await page.addInitScript(extra);
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);

  const gefunden = [];
  for (const g of GRUPPEN) {
    const da = await page.evaluate(x => {
      const k = document.querySelector('.mobnav [data-group="' + x + '"]');
      if (!k) return false; k.click(); return true;
    }, g);
    if (!da) continue;
    await page.waitForTimeout(500);
    /* Alle drei Sorten Unterreiter abklappern. Die Übergabe steht hinter
       einem Team-Reiter, die Mitarbeiterliste hinter einem Reiter der
       Verwaltung — ohne .chef-tab bliebe die ungeprüft, und genau das
       war beim ersten Durchlauf der Fall. */
    const unter = await page.evaluate(() => {
      const raus = [];
      document.querySelectorAll('[data-subview]').forEach(x => {
        if (x.offsetParent !== null) raus.push('sub:' + x.getAttribute('data-subview'));
      });
      document.querySelectorAll('[data-teamtab]').forEach(x => {
        if (x.offsetParent !== null) raus.push('team:' + x.getAttribute('data-teamtab'));
      });
      /* Ueber den Namen, nicht ueber den Index: buildChefTabs() baut die
         Leiste bei jedem Wechsel neu, danach zeigt ein gemerkter Index
         woandershin. */
      document.querySelectorAll('.chef-tab').forEach(x => {
        if (x.offsetParent !== null) raus.push('chef:' + x.textContent.trim());
      });
      return raus;
    });
    for (const u of [null].concat(unter)) {
      if (u) {
        await page.evaluate(x => {
          const art = x.slice(0, x.indexOf(':')), wert = x.slice(x.indexOf(':') + 1);
          let k = null;
          if (art === 'sub') k = document.querySelector('[data-subview="' + wert + '"]');
          else if (art === 'team') k = document.querySelector('[data-teamtab="' + wert + '"]');
          else k = [...document.querySelectorAll('.chef-tab')]
            .find(t => t.textContent.trim() === wert);
          if (k) k.click();
        }, u);
        await page.waitForTimeout(700);
      }
      const hier = await page.evaluate(() =>
        [...document.querySelectorAll('[data-leerzu]')]
          .filter(k => k.offsetParent !== null)
          .map(k => {
            const sel = k.getAttribute('data-leerzu');
            const ziel = document.querySelector(sel);
            return {
              text: k.textContent.trim(), sel,
              da: !!ziel,
              sichtbar: !!(ziel && ziel.offsetParent !== null),
            };
          }));
      hier.forEach(h => {
        if (!gefunden.some(x => x.sel === h.sel)) gefunden.push(h);
      });
    }
  }
  await b.close();
  return { errs, gefunden, page: null, browser: null };
}

(async () => {
  const errs = [];

  /* ── 1 + 2: als Verwaltung ── */
  const chef = await lauf('chef');
  errs.push(...chef.errs);
  console.log('Verwaltung — Wege gefunden: ' + chef.gefunden.length);
  chef.gefunden.forEach(g =>
    console.log('   „' + g.text + '" → ' + g.sel +
      (g.da ? (g.sichtbar ? ' ✓' : ' — Ziel da, aber unsichtbar') : ' — ZIEL FEHLT')));

  if (!chef.gefunden.length) {
    errs.push('AUFBAU: kein einziger Weg-Knopf gefunden — der Durchlauf misst nichts');
  }
  chef.gefunden.forEach(g => {
    if (!g.da) errs.push('SACKGASSE: „' + g.text + '" zeigt auf ' + g.sel + ', das es nicht gibt');
    else if (!g.sichtbar) errs.push('SACKGASSE: „' + g.text + '" zeigt auf ' + g.sel +
      ', das gerade unsichtbar ist — der Klick liefe ins Leere');
  });

  /* ── 2: tut der Knopf auch etwas? ── */
  {
    const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    const page = await b.newPage({ viewport: { width: 430, height: 900 } });
    page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
    await page.route('**://www.gstatic.com/**', r => r.abort());
    await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
    await page.addInitScript({ path: SP + '/stub-chef.js' });
    await page.addInitScript(LEER);
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2800);
    await page.evaluate(() => document.querySelector('.mobnav [data-group="g-team"]').click());
    await page.waitForTimeout(1100);
    await page.evaluate(() => {
      const t = document.querySelector('[data-teamtab="uebergabe"]'); if (t) t.click();
    });
    await page.waitForTimeout(700);

    const wirkung = await page.evaluate(async () => {
      const k = document.querySelector('#hoList [data-leerzu]');
      if (!k) return { fehler: 'kein Weg-Knopf in der Übergabe' };
      const ziel = document.querySelector(k.getAttribute('data-leerzu'));
      /* Vorher/nachher am ZIEL messen, nicht am Knopf: der Klick soll
         dort etwas auslösen, nicht hier. */
      const vorher = document.activeElement;
      k.click();
      await new Promise(r => setTimeout(r, 500));
      return {
        fehler: null,
        zielId: ziel && ziel.id,
        fokusGewandert: document.activeElement !== vorher,
        formularOffen: !!document.querySelector('#hoText, #hoNeu, [id^="ho"]:not(#hoList)'),
      };
    });
    console.log('Klick auf den Weg:', JSON.stringify(wirkung));
    if (wirkung.fehler) errs.push('WIRKUNG: ' + wirkung.fehler);
    else if (!wirkung.fokusGewandert && !wirkung.formularOffen) {
      errs.push('WIRKUNG: der Klick auf „Übergabe schreiben" hat nichts bewirkt');
    }
    await b.close();
  }

  /* ── 1b: die Mitarbeiterliste, gezielt ──
     Der Rundlauf oben erreicht sie nicht zuverlaessig: die Reiterleiste
     der Verwaltung wird bei jedem Wechsel neu gebaut, und die Liste
     rendert erst, wenn die Konten geladen sind. Statt an Wartezeiten zu
     drehen — was den Durchlauf langsam UND wackelig macht — steht sie
     hier als eigener, deterministischer Griff. */
  {
    const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    const page = await b.newPage({ viewport: { width: 430, height: 900 } });
    page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
    await page.route('**://www.gstatic.com/**', r => r.abort());
    await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
    await page.addInitScript({ path: SP + '/stub-chef.js' });
    await page.addInitScript(LEER);
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2800);
    await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const t = [...document.querySelectorAll('.chef-tab')].find(x => /Team/.test(x.textContent));
      if (t) t.click();
    });
    await page.waitForTimeout(1000);
    const emp = await page.evaluate(() => {
      const k = document.querySelector('#empList [data-leerzu]');
      if (!k) return { fehler: 'kein Weg-Knopf in der Mitarbeiterliste' };
      const ziel = document.querySelector(k.getAttribute('data-leerzu'));
      return { fehler: null, text: k.textContent.trim(), sel: k.getAttribute('data-leerzu'),
        da: !!ziel, sichtbar: !!(ziel && ziel.offsetParent !== null) };
    });
    console.log('Mitarbeiterliste:', JSON.stringify(emp));
    if (emp.fehler) errs.push('MITARBEITERLISTE: ' + emp.fehler);
    else if (!emp.da || !emp.sichtbar) {
      errs.push('SACKGASSE: „' + emp.text + '" → ' + emp.sel +
        (emp.da ? ' ist von diesem Reiter aus unsichtbar' : ' gibt es nicht'));
    }
    await b.close();
  }

  /* ── 3: wer nicht darf, bekommt keinen Weg angeboten ── */
  const ma = await lauf('mitarbeiter');
  errs.push(...ma.errs);
  console.log('\nMitarbeiter — Wege gefunden: ' + ma.gefunden.length);
  ma.gefunden.forEach(g => console.log('   „' + g.text + '" → ' + g.sel +
    (g.sichtbar ? ' ✓' : ' — ZIEL NICHT ERREICHBAR')));
  ma.gefunden.forEach(g => {
    if (!g.da || !g.sichtbar) {
      errs.push('SACKGASSE beim Mitarbeiter: „' + g.text + '" → ' + g.sel +
        ' ist für diese Rolle nicht da');
    }
  });

  /* ── 4: Gegenprobe ── */
  {
    const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    const page = await b.newPage({ viewport: { width: 430, height: 900 } });
    const konsole = [];
    page.on('console', m => konsole.push(m.text()));
    await page.route('**://www.gstatic.com/**', r => r.abort());
    await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
    await page.addInitScript({ path: SP + '/stub-chef.js' });
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2600);
    const meldung = await page.evaluate(async () => {
      const k = document.createElement('button');
      k.setAttribute('data-leerzu', '#gibtesnicht');
      document.body.appendChild(k);
      k.click();
      await new Promise(r => setTimeout(r, 200));
      k.remove();
      return true;
    });
    void meldung;
    const gemeldet = konsole.some(t => /zeigt ins Leere/.test(t));
    console.log('\nGegenprobe (Ziel gibt es nicht): ' + (gemeldet ? 'gemeldet ✓' : 'STILL'));
    if (!gemeldet) {
      errs.push('GEGENPROBE: ein Weg ins Nichts wird nicht gemeldet — dann fällt ' +
        'eine echte Sackgasse auch niemandem auf');
    }
    await b.close();
  }

  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Jeder leere Zustand mit Weg zeigt auf ein Bedienelement, das es gibt — ' +
      'und niemand bekommt einen Weg, den er nicht gehen darf');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
