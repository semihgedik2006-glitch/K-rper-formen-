/* Gleitende Marker in Navigation, Reitern und Verwaltung.

   Ein Marker gleitet zum aktiven Reiter, statt dass eine gefüllte Pille
   springt. Geprüft wird, dass er

     1. beim ersten Bild schon steht (nicht von links hereinfährt),
     2. beim Wechsel wirklich die Stelle wechselt,
     3. genau über dem aktiven Reiter sitzt – auf ein paar Pixel,
     4. nach einem Größenwechsel wieder passt,
     5. bei „Bewegung reduzieren" ohne Übergang springt.

   Gemessen wird der Marker über die CSS-Marken --ind-x/--ind-w, nicht am
   Bild: das Pseudo-Element ::before hat kein eigenes DOM.             */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const lies = sel => `(() => {
  const b = document.querySelector(${JSON.stringify(sel)});
  if (!b) return null;
  const st = b.style;
  return {
    x: parseFloat(st.getPropertyValue('--ind-x')) || 0,
    y: parseFloat(st.getPropertyValue('--ind-y')) || 0,
    w: parseFloat(st.getPropertyValue('--ind-w')) || 0,
    h: parseFloat(st.getPropertyValue('--ind-h')) || 0,
    o: parseFloat(st.getPropertyValue('--ind-o')) || 0,
    sofort: b.classList.contains('sofort'),
  };
})()`;

const aktiv = (sel, kind) => `(() => {
  const b = document.querySelector(${JSON.stringify(sel)});
  const a = b && b.querySelector(${JSON.stringify(kind)});
  if (!a) return null;
  return { x: a.offsetLeft, y: a.offsetTop, w: a.offsetWidth, h: a.offsetHeight,
           text: (a.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 20) };
})()`;

function passt(m, a, name, errs) {
  if (!m || !a) { errs.push('KEIN TEST: ' + name + ' nicht gefunden'); return; }
  if (m.o !== 1) { errs.push('FEHLT: Marker in ' + name + ' ist unsichtbar (--ind-o ' + m.o + ')'); return; }
  const dx = Math.abs(m.x - a.x), dw = Math.abs(m.w - a.w), dh = Math.abs(m.h - a.h);
  if (dx > 2) errs.push('DANEBEN: ' + name + ' – Marker bei x=' + m.x + ', Reiter „' + a.text + '" bei x=' + a.x);
  if (dw > 2) errs.push('FALSCHE BREITE: ' + name + ' – Marker ' + m.w + ' px, Reiter ' + a.w + ' px');
  if (dh > 2) errs.push('FALSCHE HÖHE: ' + name + ' – Marker ' + m.h + ' px, Reiter ' + a.h + ' px');
}

async function starten(browser, errs, ruhe) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 160));
  });
  if (ruhe) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  return page;
}

(async () => {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await starten(b, errs, false);

  // ══ 1. Untere Leiste steht beim ersten Bild ══
  const nav0 = await page.evaluate(lies('.mobnav'));
  const navA = await page.evaluate(aktiv('.mobnav', 'button.active'));
  console.log('Untere Leiste:', JSON.stringify(nav0), '· aktiv:', JSON.stringify(navA));
  passt(nav0, navA, 'untere Leiste', errs);

  // ══ 2. Wechsel bewegt ihn ══
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-arbeit"]').click());
  await page.waitForTimeout(700);
  const nav1 = await page.evaluate(lies('.mobnav'));
  const navA1 = await page.evaluate(aktiv('.mobnav', 'button.active'));
  console.log('nach Wechsel:', JSON.stringify(nav1), '· aktiv:', JSON.stringify(navA1));
  if (nav1 && nav0 && nav1.x === nav0.x) errs.push('STEHT: Marker der unteren Leiste bewegt sich beim Wechsel nicht');
  passt(nav1, navA1, 'untere Leiste nach Wechsel', errs);

  // ══ 3. Reiter der Gruppe ══
  const sub0 = await page.evaluate(lies('#subnav'));
  const subA = await page.evaluate(aktiv('#subnav', '.subtab.on'));
  console.log('Gruppenreiter:', JSON.stringify(sub0), '· aktiv:', JSON.stringify(subA));
  passt(sub0, subA, 'Gruppenreiter', errs);

  await page.evaluate(() => {
    const t = [...document.querySelectorAll('#subnav .subtab')].find(x => !x.classList.contains('on'));
    if (t) t.click();
  });
  await page.waitForTimeout(700);
  const sub1 = await page.evaluate(lies('#subnav'));
  const subA1 = await page.evaluate(aktiv('#subnav', '.subtab.on'));
  if (sub1 && sub0 && sub1.x === sub0.x && sub1.w === sub0.w) {
    errs.push('STEHT: Marker der Gruppenreiter bewegt sich nicht');
  }
  passt(sub1, subA1, 'Gruppenreiter nach Wechsel', errs);

  // ══ 4. Verwaltungs-Reiter ══
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const k = document.querySelector('#chefHome [data-cgo="team"]');
    if (k) k.click();
  });
  await page.waitForTimeout(900);
  const chef0 = await page.evaluate(lies('#chefTabs'));
  const chefA = await page.evaluate(aktiv('#chefTabs', '.chef-tab.on'));
  console.log('Verwaltungsreiter:', JSON.stringify(chef0), '· aktiv:', JSON.stringify(chefA));
  passt(chef0, chefA, 'Verwaltungsreiter', errs);

  await page.evaluate(() => {
    const t = [...document.querySelectorAll('#chefTabs .chef-tab')].find(x => !x.classList.contains('on'));
    if (t) t.click();
  });
  await page.waitForTimeout(800);
  const chef1 = await page.evaluate(lies('#chefTabs'));
  const chefA1 = await page.evaluate(aktiv('#chefTabs', '.chef-tab.on'));
  if (chef1 && chef0 && chef1.x === chef0.x && chef1.w === chef0.w) {
    errs.push('STEHT: Marker der Verwaltungsreiter bewegt sich nicht');
  }
  passt(chef1, chefA1, 'Verwaltungsreiter nach Wechsel', errs);

  // ══ 5. Nach Größenwechsel sitzt er wieder ══
  await page.setViewportSize({ width: 600, height: 844 });
  await page.waitForTimeout(700);
  const nach = await page.evaluate(lies('#chefTabs'));
  const nachA = await page.evaluate(aktiv('#chefTabs', '.chef-tab.on'));
  console.log('nach Größenwechsel:', JSON.stringify(nach));
  passt(nach, nachA, 'Verwaltungsreiter nach Größenwechsel', errs);

  await page.screenshot({ path: SP + '/marker-chef.png' });
  await page.close();

  // ══ 6. „Bewegung reduzieren": kein Übergang ══
  const ruhig = await starten(b, errs, true);
  const dauer = await ruhig.evaluate(() => {
    const bar = document.querySelector('.mobnav');
    if (!bar) return null;
    const cs = getComputedStyle(bar, '::before');
    return { transition: cs.transitionDuration, verzug: cs.transitionDelay };
  });
  console.log('Bei Bewegung-reduzieren:', JSON.stringify(dauer));
  // „.01ms" schreibt sich als 1e-05s. Nicht auf Ziffern prüfen, sondern
  // rechnen: alles unter einer Millisekunde ist für das Auge sofort.
  const laengste = Math.max(0, ...String(dauer && dauer.transition || '0s')
    .split(',').map(x => parseFloat(x) || 0));
  if (laengste > 0.001) {
    errs.push('FEHLT: Marker gleitet trotz „Bewegung reduzieren" (' + dauer.transition + ')');
  }
  // Der Marker muss trotzdem SITZEN, nur eben ohne Weg dorthin
  const rm = await ruhig.evaluate(lies('.mobnav'));
  const ra = await ruhig.evaluate(aktiv('.mobnav', 'button.active'));
  passt(rm, ra, 'untere Leiste bei Bewegung-reduzieren', errs);
  await ruhig.close();

  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ') : '\n✓ Marker: sitzen, gleiten und halten sich an „Bewegung reduzieren"');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
