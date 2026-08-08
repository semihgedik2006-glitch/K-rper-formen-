/* Bereich 6 – Geräte: wo ist etwas kaputt, welcher Knopf ist der auffälligste,
   und legt eine zweite Meldung eine zweite Aufgabe an?

   Vorher öffnete die Seite beim ersten alphabetischen Studio und meldete
   „Noch keine Geräte" – während in einem anderen Studio eines defekt war. */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function start(stub, errs) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/' + stub });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await page.mouse.click(195, 400).catch(() => {});
  await page.waitForTimeout(2700);
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-arbeit"]').click());
  await page.waitForTimeout(600);
  const s = await page.$('[data-subview="geraete"]');
  if (s) { await s.click(); await page.waitForTimeout(1600); }
  return { b, page };
}

(async () => {
  const errs = [];

  // ══ Chef: findet er das defekte Gerät, ohne 14 Studios durchzuklicken? ══
  {
    const { b, page } = await start('stub-chef.js', errs);

    const wo = await page.evaluate(() => {
      const w = document.getElementById('devWo');
      const knoepfe = [...w.querySelectorAll('.dev-wo')];
      return {
        sichtbar: w.style.display !== 'none' && w.getBoundingClientRect().height > 0,
        studios: knoepfe.map(k => k.textContent.trim()),
        hoehe: knoepfe.length ? Math.round(knoepfe[0].getBoundingClientRect().height) : 0,
        offenesStudio: document.getElementById('devListTitle').textContent,
        geraeteHier: document.querySelectorAll('.dev-item').length,
      };
    });
    console.log('WO DEFEKT:', JSON.stringify(wo));
    if (!wo.sichtbar) errs.push('Die Uebersicht „Wo etwas defekt ist" fehlt');
    if (!wo.studios.some(s => /Hürth/.test(s))) errs.push('Huerth wird nicht genannt: ' + JSON.stringify(wo.studios));
    if (wo.hoehe < 40) errs.push('Der Studio-Knopf ist nur ' + wo.hoehe + ' px hoch');

    // Antippen muss ins Studio wechseln
    await page.evaluate(() => document.querySelector('.dev-wo').click());
    await page.waitForTimeout(1300);
    const nach = await page.evaluate(() => ({
      titel: document.getElementById('devListTitle').textContent,
      geraete: document.querySelectorAll('.dev-item').length,
      alarm: document.getElementById('devAlert').textContent.replace(/\s+/g, ' '),
      alarmSichtbar: document.getElementById('devAlert').style.display !== 'none',
    }));
    console.log('nach Antippen:', JSON.stringify(nach));
    if (!/Hürth/.test(nach.titel)) errs.push('Der Wechsel ins Studio hat nicht geklappt: ' + nach.titel);
    if (!nach.geraete) errs.push('Nach dem Wechsel keine Geraete sichtbar');
    if (!/EMS-Gerät 2/.test(nach.alarm)) errs.push('Der Hinweis nennt das Geraet nicht: ' + nach.alarm);

    // Der Hinweis muss zum Gerät führen
    await page.evaluate(() => document.querySelector('[data-devgo]').click());
    await page.waitForTimeout(700);
    const fenster = await page.evaluate(() => {
      const m = document.getElementById('devModal');
      const d = document.getElementById('devmDefekt').getBoundingClientRect();
      const o = document.getElementById('devmOk');
      return {
        offen: m.classList.contains('show'),
        name: document.getElementById('devmName').textContent,
        defektBreite: Math.round(d.width),
        okBreite: o.style.display === 'none' ? 0 : Math.round(o.getBoundingClientRect().width),
        okIstPrimaer: o.className.indexOf('btn-primary') >= 0,
        sortierZeilen: (() => {
          const r = document.getElementById('devSort');
          return r ? Math.round(r.getBoundingClientRect().height / 40) : 0;
        })(),
      };
    });
    console.log('FENSTER:', JSON.stringify(fenster));
    if (!fenster.offen) errs.push('„ansehen" oeffnet das Geraet nicht');
    if (fenster.okIstPrimaer) errs.push('„Wieder in Ordnung" ist weiterhin der auffaelligste Knopf');
    if (fenster.defektBreite <= fenster.okBreite) {
      errs.push('„Defekt melden" ist nicht groesser als „Wieder in Ordnung": ' +
        fenster.defektBreite + ' vs ' + fenster.okBreite);
    }

    // Zweite Defektmeldung darf keine zweite Aufgabe anlegen
    const geschrieben = await page.evaluate(async () => {
      window.__neueTodos = [];
      const echt = firebase.firestore().batch;
      firebase.firestore().batch = function () {
        const b = echt.call(this);
        const set = b.set;
        b.set = function (ref, data) {
          if (data && data.title) window.__neueTodos.push(data.title);
          return set.apply(this, arguments);
        };
        return b;
      };
      document.getElementById('devmText').value = 'Immer noch kaputt';
      document.getElementById('devmDefekt').click();
      await new Promise(r => setTimeout(r, 800));
      return window.__neueTodos;
    });
    console.log('bei erneuter Meldung angelegte Aufgaben:', JSON.stringify(geschrieben));
    if (geschrieben.length) {
      errs.push('Erneute Defektmeldung legt eine zweite Aufgabe an: ' + JSON.stringify(geschrieben));
    }

    await page.screenshot({ path: SP + '/geraete-chef.png' });
    await b.close();
  }

  // ══ Mitarbeiter ══
  {
    const { b, page } = await start('stub-mitarbeiter.js', errs);
    const ma = await page.evaluate(() => {
      const sa = document.querySelector('#view-geraete .scroll-area');
      const erste = document.querySelector('.dev-item');
      const sr = document.querySelector('#devSort');
      return {
        woVersteckt: document.getElementById('devWo').style.display === 'none',
        ersteY: erste ? Math.round(erste.getBoundingClientRect().top - sa.getBoundingClientRect().top) : -1,
        sortHoehe: sr ? Math.round(sr.getBoundingClientRect().height) : 0,
        sortSchiebbar: sr ? sr.scrollWidth > sr.clientWidth : false,
        aufnehmenVersteckt: document.getElementById('devAddCard').style.display === 'none',
        defektesOben: (document.querySelector('.dev-item .dev-st') || {}).textContent || '',
      };
    });
    console.log('MITARBEITER:', JSON.stringify(ma));
    if (!ma.woVersteckt) errs.push('Mitarbeiter sieht die Studio-Uebersicht');
    if (!ma.aufnehmenVersteckt) errs.push('Mitarbeiter sieht „Geraet aufnehmen"');
    if (ma.ersteY > 260) errs.push('Erstes Geraet erst bei y=' + ma.ersteY);
    if (ma.sortHoehe > 60) errs.push('Die Sortierleiste ist ' + ma.sortHoehe + ' px hoch (mehrzeilig?)');
    if (!/defekt/.test(ma.defektesOben)) errs.push('Das defekte Geraet steht nicht oben');

    await page.screenshot({ path: SP + '/geraete-mitarbeiter.png' });
    await b.close();
  }

  console.log('\nFehler:', errs.length ? errs.join('\n  ') : 'keine');
})().catch(e => { console.error(e); process.exit(1); });
