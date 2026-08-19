const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = process.env.SP || __dirname;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600); await page.mouse.click(215, 400).catch(() => {}); await page.waitForTimeout(2200);

  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
  await page.waitForTimeout(500);
  const sub = await page.$('[data-subview="chef"]'); if (sub) { await sub.click(); await page.waitForTimeout(600); }
  await page.evaluate(() => [...document.querySelectorAll('.chef-tab')].find(t => /System/.test(t.textContent)).click());
  await page.waitForTimeout(600);

  const karte = await page.evaluate(() => ({
    da: !!document.getElementById('repTestSend'),
    zeitraeume: [...document.querySelectorAll('#repTestTage option')].map(o => o.textContent),
    knopf: (document.getElementById('repTestSend') || {}).textContent,
    eigenBox: (document.getElementById('repTageEigenBox') || {}).offsetParent !== null,
  }));
  console.log('KARTE:', karte);
  if (!karte.da) errs.push('Der Knopf fehlt');
  /* Das Feld für die eigene Zahl steht anfangs NICHT da. Zwei
     Zeitraum-Angaben nebeneinander lassen offen, welche gilt. */
  if (karte.eigenBox) errs.push('Das Feld für die eigene Zahl steht schon da, bevor „Andere" gewählt ist');
  if (karte.zeitraeume.length < 5) errs.push('Nur ' + karte.zeitraeume.length + ' Zeiträume zur Auswahl');

  await page.selectOption('#repTestTage', '7');
  await page.evaluate(() => document.getElementById('repTestSend').click());
  await page.waitForTimeout(900);
  const nach = await page.evaluate(() => ({
    aufruf: window.__aufruf,
    hinweis: document.getElementById('repTestNote').textContent,
    toast: document.getElementById('toast').textContent,
  }));
  console.log('NACH KLICK:', nach);
  /* Was wirklich an den Server geht. Ein Auswahlfeld, das den Wert
     nicht mitschickt, sähe genauso aus. */
  if (!nach.aufruf || nach.aufruf.name !== 'sendTestReport') {
    errs.push('Es wird nicht sendTestReport gerufen (' + JSON.stringify(nach.aufruf) + ')');
  } else if (!nach.aufruf.data || nach.aufruf.data.tage !== 7) {
    errs.push('Der gewählte Zeitraum kommt nicht mit: ' + JSON.stringify(nach.aufruf.data));
  }
  /* „an dich" — der Knopf schickt seit dem 19.8. nur an das eigene
     Konto. Vorher schrieb er ungefragt alle Chef-Konten an. */
  if (!/an dich/.test(nach.hinweis)) {
    errs.push('Die Rückmeldung sagt nicht, dass der Bericht an einen selbst geht: „' +
      nach.hinweis + '"');
  }
  if (!/7 Tage/.test(nach.hinweis)) {
    errs.push('Die Rückmeldung nennt den Zeitraum nicht: „' + nach.hinweis + '"');
  }

  /* ── Eigene Anzahl Tage ── */
  await page.selectOption('#repTestTage', 'eigen');
  await page.waitForTimeout(300);
  const eigen = await page.evaluate(async () => {
    const box = document.getElementById('repTageEigenBox');
    const sichtbar = box && box.offsetParent !== null;
    document.getElementById('repTageEigen').value = '45';
    window.__aufruf = null;
    document.getElementById('repTestSend').click();
    await new Promise(r => setTimeout(r, 900));
    return { sichtbar, aufruf: window.__aufruf,
      hinweis: document.getElementById('repTestNote').textContent };
  });
  console.log('EIGENE ZAHL:', JSON.stringify(eigen));
  if (!eigen.sichtbar) errs.push('Nach „Andere" erscheint kein Zahlenfeld');
  if (!eigen.aufruf || !eigen.aufruf.data || eigen.aufruf.data.tage !== 45) {
    errs.push('Die eigene Zahl kommt nicht am Server an: ' + JSON.stringify(eigen.aufruf));
  }

  /* Gegenprobe: Unsinn wird gedeckelt, nicht durchgereicht. Der Server
     deckelt ohnehin — aber die Zeile darunter muss dieselbe Zahl nennen
     wie die Mail, sonst widersprechen sich Anzeige und Postfach. */
  const zuViel = await page.evaluate(async () => {
    document.getElementById('repTageEigen').value = '9999';
    window.__aufruf = null;
    document.getElementById('repTestSend').click();
    await new Promise(r => setTimeout(r, 900));
    return { aufruf: window.__aufruf,
      hinweis: document.getElementById('repTestNote').textContent };
  });
  console.log('ZU VIEL:', JSON.stringify(zuViel));
  if (!zuViel.aufruf || zuViel.aufruf.data.tage !== 370) {
    errs.push('9999 Tage werden nicht auf 370 gedeckelt: ' + JSON.stringify(zuViel.aufruf));
  }

  await page.screenshot({ path: SP + '/bericht-knopf.png' });
  console.log('Fehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
