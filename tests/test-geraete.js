/* Geräte- und Schadensbuch: Liste, Zustände, Verlauf, Rechte.
   Geprüft wird für Chef und Mitarbeiter – die Rechte unterscheiden sich. */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function lauf(stub, wer) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/' + stub });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600); await page.mouse.click(215, 400).catch(() => {}); await page.waitForTimeout(2400);

  console.log('\n===== ' + wer + ' =====');

  // Über die Gruppe "Arbeit" zur neuen Seite
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-arbeit"]').click());
  await page.waitForTimeout(450);
  const sub = await page.$('[data-subview="geraete"]');
  if (!sub) { errs.push('Geraete-Seite ist in der Unter-Navigation nicht erreichbar'); }
  else { await sub.click(); await page.waitForTimeout(800); }

  // Auf das Studio wechseln, fuer das die Testdaten liegen (Huerth = studio-6).
  // Der Chef landet sonst alphabetisch zuerst bei Bruehl.
  await page.evaluate(() => {
    const sel = document.getElementById('devStudio');
    if ([...sel.options].some(o => o.value === 'studio-6')) {
      sel.value = 'studio-6'; sel.onchange();
    }
  });
  await page.waitForTimeout(800);

  console.log('SEITE:', JSON.stringify(await page.evaluate(() => {
    const sec = document.getElementById('view-geraete');
    return {
      offen: sec.classList.contains('show'),
      titel: (document.getElementById('devListTitle') || {}).textContent,
      zaehler: (document.getElementById('devCount') || {}).textContent,
      geraete: [...document.querySelectorAll('.dev-item')].map(d => ({
        name: d.querySelector('.dev-title').textContent,
        zustand: d.querySelector('.dev-st').textContent.trim(),
        meta: d.querySelector('.dev-meta').textContent.slice(0, 40),
      })),
      warnung: document.getElementById('devAlert').style.display !== 'none'
        ? document.getElementById('devAlert').textContent.trim() : null,
      aufnehmenSichtbar: document.getElementById('devAddCard').style.display !== 'none',
    };
  }), null, 1));

  // Reihenfolge: Defektes muss oben stehen
  const reihe = await page.evaluate(() => [...document.querySelectorAll('.dev-item .dev-st')].map(s => s.className));
  if (reihe.length && !/defekt/.test(reihe[0])) errs.push('Defektes Geraet steht nicht oben');

  // Gerät öffnen → Verlauf und Knöpfe
  await page.evaluate(() => document.querySelectorAll('.dev-item')[0].click());
  await page.waitForTimeout(500);
  console.log('FENSTER:', JSON.stringify(await page.evaluate(() => ({
    offen: document.getElementById('devModal').classList.contains('show'),
    name: (document.getElementById('devmName') || {}).textContent,
    ort: (document.getElementById('devmPlace') || {}).textContent,
    defektKnopf: !!document.getElementById('devmDefekt'),
    wartungKnopf: !!document.getElementById('devmWartung'),
    inOrdnungSichtbar: document.getElementById('devmOk').style.display !== 'none',
    entfernenSichtbar: document.getElementById('devmDel').style.display !== 'none',
    verlaufEintraege: document.querySelectorAll('#devmLog .dev-log').length,
    verlaufErster: (document.querySelector('#devmLog .dev-log-text') || {}).textContent,
  })), null, 1));

  // Ohne Text darf keine Meldung rausgehen
  await page.evaluate(() => document.getElementById('devmDefekt').click());
  await page.waitForTimeout(400);
  console.log('OHNE TEXT:', await page.evaluate(() => (document.getElementById('toast') || {}).textContent));

  // Mit Text
  await page.fill('#devmText', 'Gurt gerissen');
  await page.evaluate(() => document.getElementById('devmDefekt').click());
  await page.waitForTimeout(700);
  console.log('MIT TEXT:', await page.evaluate(() => ({
    toast: (document.getElementById('toast') || {}).textContent,
    feldLeer: document.getElementById('devmText').value === '',
  })));

  await page.evaluate(() => document.getElementById('devmClose').click());
  await page.waitForTimeout(300);
  console.log('Fenster zu:', await page.evaluate(() => !document.getElementById('devModal').classList.contains('show')));

  await page.screenshot({ path: SP + '/geraete-' + wer + '.png' });
  await b.close();
  return errs;
}

(async () => {
  const a = await lauf('stub-chef.js', 'chef');
  const c = await lauf('stub-mitarbeiter.js', 'mitarbeiter');
  const alle = a.concat(c);
  console.log('\nFehler:', alle.length ? alle.join('\n  ') : 'keine');
})().catch(e => { console.error(e); process.exit(1); });
