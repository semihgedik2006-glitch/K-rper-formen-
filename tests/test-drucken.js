/* ── Was aus dem Drucker kommt ────────────────────────────────────────
   Putzplan und Einkaufsliste hängen in den Studios als Zettel an der
   Wand. Für beide gibt es eine Druckvorlage, und die funktioniert.

   Was fehlte, war der dritte Fall: `body > *{display:none}` blendet beim
   Drucken alles aus, und #printArea ist leer, solange niemand auf
   „Drucken" gedrückt hat. Wer aus einer beliebigen Ansicht Strg+P tippt
   — oder am Handy „Drucken" im Systemmenü wählt —, bekam ein
   vollständig WEISSES BLATT. Kein Fehler, kein Hinweis, nichts.

   Geprüft wird deshalb:
     1. Ohne Vorlage steht ein Hinweis auf dem Papier, der die zwei
        echten Wege nennt.
     2. Mit Vorlage steht die Vorlage da — und der Hinweis NICHT.
        (Sonst hätte man den einen Fehler gegen einen anderen getauscht.)
     3. Beim Ansichtswechsel wird der Druckbereich geleert. Sonst druckt
        man zwei Bildschirme später einen Plan, den man nicht meinte.
     4. Im Ausdruck steht nichts von der Bedienung — keine Navigation,
        keine Knöpfe.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 900, height: 1100 } });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  /* Der Druck-Dialog würde den Durchlauf anhalten. */
  await page.evaluate(() => { window.__gedruckt = 0; window.print = function () { window.__gedruckt++; }; });

  /* ── 1: ohne Vorlage ── */
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(250);
  const leer = await page.evaluate(() => ({
    text: document.body.innerText.trim(),
    sichtbar: [...document.body.children]
      .filter(x => getComputedStyle(x).display !== 'none').map(x => x.id || x.className),
  }));
  console.log('Ohne Vorlage sichtbar:', JSON.stringify(leer.sichtbar));
  console.log('  Text:', JSON.stringify(leer.text.slice(0, 80)));
  if (!leer.text) {
    errs.push('LEERES BLATT: aus einer normalen Ansicht kommt nichts aus dem Drucker');
  }
  /* Ohne /i geht das schief: die Ueberschrift wird per CSS in Versalien
     gesetzt, und innerText liefert den GERENDERTEN Text. „Putzplan"
     findet man in „PUTZPLAN" nicht. Beim ersten Anlauf hat der Durchlauf
     genau daran drei Fehler gemeldet, die keine waren. */
  if (!/Putzplan/i.test(leer.text) || !/Material/i.test(leer.text)) {
    errs.push('Der Hinweis nennt nicht beide Wege: „' + leer.text.slice(0, 90) + '"');
  }

  /* ── 4: keine Bedienung auf dem Papier ── */
  const bedienung = await page.evaluate(() => {
    const stoerer = ['.mobnav', '.topbar', '.subnav', '.chat-channels', '.side'];
    /* getClientRects(), nicht display: `body > *{display:none}` blendet
       die ELTERN aus, und display wird nicht vererbt — .topbar meldet
       weiterhin „flex", obwohl nichts davon auf dem Papier landet.
       Genau das hat der erste Anlauf als Fund gemeldet. Was zaehlt, ist,
       ob das Element eine Flaeche hat. */
    return stoerer.filter(s => {
      const e = document.querySelector(s);
      return e && e.getClientRects().length > 0;
    });
  });
  console.log('Bedienelemente im Ausdruck:', JSON.stringify(bedienung));
  if (bedienung.length) {
    errs.push('AUF DEM PAPIER: ' + bedienung.join(', ') + ' wird mitgedruckt');
  }

  /* ── 2: mit Vorlage ── */
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-arbeit"]').click());
  await page.waitForTimeout(600);
  await page.evaluate(() => { const k = document.querySelector('[data-subview="putzplan"]'); if (k) k.click(); });
  await page.waitForTimeout(900);
  /* Ein Studio, das wirklich einen Plan hat — sonst weist die Funktion
     zu Recht ab und der Durchlauf misst den falschen Fall. */
  await page.evaluate(() => {
    const s = document.getElementById('ppStudio');
    if (s) { s.value = 'studio-6'; s.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { const k = document.getElementById('ppPrint'); if (k) k.click(); });
  await page.waitForTimeout(600);
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(250);
  const plan = await page.evaluate(() => ({
    gedruckt: window.__gedruckt,
    text: document.body.innerText.trim(),
    hinweisAn: getComputedStyle(document.getElementById('printHinweis')).display !== 'none',
  }));
  console.log('Mit Vorlage — print() gerufen:', plan.gedruckt,
    '· Hinweis sichtbar:', plan.hinweisAn);
  console.log('  Text:', JSON.stringify(plan.text.slice(0, 70)));
  if (!plan.gedruckt) errs.push('Der Drucken-Knopf im Putzplan löst kein Drucken aus');
  if (!/Putzplan/i.test(plan.text) || !/Kürzel/i.test(plan.text)) {
    errs.push('Die Putzplan-Vorlage steht nicht auf dem Papier: „' + plan.text.slice(0, 90) + '"');
  }
  if (plan.hinweisAn) {
    errs.push('DOPPELT: der Hinweis „nicht zum Ausdrucken gedacht" steht MIT auf der Vorlage');
  }

  /* ── 3: Ansichtswechsel leert den Druckbereich ── */
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-start"]').click());
  await page.waitForTimeout(700);
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(250);
  const nachher = await page.evaluate(() => ({
    text: document.body.innerText.trim().slice(0, 60),
    leer: !document.getElementById('printArea').innerHTML,
  }));
  console.log('Nach Ansichtswechsel:', JSON.stringify(nachher));
  if (!nachher.leer) {
    errs.push('Der Putzplan von vorhin hängt noch im Druckbereich — zwei Ansichten ' +
      'weiter druckt man ihn ungewollt');
  }
  if (!/nicht zum Ausdrucken/i.test(nachher.text)) {
    errs.push('Nach dem Wechsel erscheint der Hinweis nicht wieder');
  }

  await page.screenshot({ path: SP + '/drucken.png', fullPage: true });
  await b.close();
  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Drucken: Vorlage wenn eine da ist, sonst ein Hinweis mit den zwei Wegen — ' +
      'und nie beides, nie die Bedienung');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
