/* Schichttausch in drei Schritten und Nachweise mit Ablaufdatum.
   Beides hat Rechte, die sich je Rolle unterscheiden – deshalb zweimal. */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function lauf(stub, wer) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push(wer + ' PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push(wer + ' CONSOLE: ' + m.text().slice(0, 200)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/' + stub });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600); await page.mouse.click(215, 400).catch(() => {}); await page.waitForTimeout(2400);
  await page.evaluate(() => { window.confirm = () => true; });

  console.log('\n===== ' + wer + ' =====');

  // ── Schichttausch ──
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-team"]').click());
  await page.waitForTimeout(450);
  const sub = await page.$('[data-subview="team"]');
  if (sub) { await sub.click(); await page.waitForTimeout(900); }
  await page.evaluate(() => {
    const sel = document.getElementById('teamStudio');
    if ([...sel.options].some(o => o.value === 'studio-6')) { sel.value = 'studio-6'; sel.onchange(); }
  });
  await page.waitForTimeout(900);

  const t = await page.evaluate(() => ({
    zeilen: [...document.querySelectorAll('.tausch-row')].map(r => r.textContent.replace(/\s+/g, ' ').trim()),
    abgeben: document.querySelectorAll('[data-tausch-ab]').length,
    uebernehmen: document.querySelectorAll('[data-tausch-nehmen]').length,
    bestaetigen: document.querySelectorAll('[data-tausch-ja]').length,
    ablehnen: document.querySelectorAll('[data-tausch-nein]').length,
  }));
  console.log('SCHICHTTAUSCH:', JSON.stringify(t, null, 1));

  if (!t.abgeben) errs.push(wer + ': kein "Ich kann nicht" an der eigenen Schicht');
  if (!t.uebernehmen) errs.push(wer + ': kein "Ich übernehme" an der ausgeschriebenen Schicht');

  const darfBestaetigen = (wer === 'chef' || wer === 'leiter');
  if (darfBestaetigen && !t.bestaetigen) errs.push(wer + ': darf bestätigen, sieht aber keinen Knopf');
  if (!darfBestaetigen && t.bestaetigen) errs.push(wer + ': darf NICHT bestätigen, sieht aber einen Knopf');

  // Ausschreiben auslösen
  if (t.abgeben) {
    await page.evaluate(() => document.querySelector('[data-tausch-ab]').click());
    await page.waitForTimeout(600);
    console.log('nach "Ich kann nicht":', await page.evaluate(() => (document.getElementById('toast') || {}).textContent));
  }

  // ── Nachweise: eigene im Profil ──
  await page.evaluate(() => document.getElementById('uAvatar').click());
  await page.waitForTimeout(500);
  const reiter = await page.evaluate(() => [...document.querySelectorAll('[data-pmtab]')].map(x => x.textContent.trim()));
  console.log('PROFIL-REITER:', JSON.stringify(reiter));
  if (!reiter.some(r => /Nachweise/.test(r))) errs.push(wer + ': Reiter "Nachweise" fehlt im Profil');

  await page.evaluate(() => document.querySelector('[data-pmtab="nachweise"]').click());
  await page.waitForTimeout(800);
  console.log('EIGENE NACHWEISE:', JSON.stringify(await page.evaluate(() =>
    [...document.querySelectorAll('#pmCerts .cert-item')].map(c => ({
      was: c.querySelector('.cert-title').textContent.trim(),
      rest: c.querySelector('.cert-st').textContent.trim(),
    })))));
  await page.evaluate(() => document.getElementById('pmClose').click());
  await page.waitForTimeout(400);

  // ── Nachweise: Chef-Bereich ──
  const chefBereich = await page.$('.mobnav [data-group="g-chef"]');
  if (chefBereich) {
    await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
    await page.waitForTimeout(500);
    const cs = await page.$('[data-subview="chef"]'); if (cs) { await cs.click(); await page.waitForTimeout(700); }
    const hatReiter = await page.evaluate(() =>
      [...document.querySelectorAll('.chef-tab')].some(t => /Nachweise/.test(t.textContent)));
    console.log('Chef-Reiter "Nachweise" da:', hatReiter);

    if (hatReiter) {
      await page.evaluate(() => [...document.querySelectorAll('.chef-tab')].find(t => /Nachweise/.test(t.textContent)).click());
      await page.waitForTimeout(800);
      console.log('NACHWEIS-BEREICH:', JSON.stringify(await page.evaluate(() => ({
        zaehler: (document.getElementById('certCount') || {}).textContent,
        laeuftAb: [...document.querySelectorAll('#certSoon .cert-item')].map(c => c.textContent.replace(/\s+/g, ' ').trim().slice(0, 62)),
        alle: document.querySelectorAll('#certList .cert-item').length,
        personen: [...document.querySelectorAll('#certPerson option')].length,
        arten: [...document.querySelectorAll('#certArt option')].map(o => o.textContent.trim()),
      })), null, 1));

      // Reihenfolge: das Abgelaufene muss ganz oben stehen
      const erste = await page.evaluate(() => {
        const e = document.querySelector('#certList .cert-st');
        return e ? e.className : '';
      });
      if (erste && !/weg/.test(erste)) errs.push('Abgelaufener Nachweis steht nicht oben');

      // Ohne Datum darf nichts gespeichert werden
      await page.evaluate(() => document.getElementById('certAdd').click());
      await page.waitForTimeout(400);
      console.log('ohne Datum:', await page.evaluate(() => (document.getElementById('toast') || {}).textContent));
    } else if (wer === 'chef') {
      errs.push('Chef sieht den Reiter "Nachweise" nicht');
    }
  } else if (wer === 'chef') {
    errs.push('Chef kommt nicht in den Verwaltungsbereich');
  }

  await page.screenshot({ path: SP + '/tausch-' + wer + '.png' });
  await b.close();
  return errs;
}

(async () => {
  let alle = [];
  for (const [stub, wer] of [['stub-chef.js', 'chef'], ['stub-leiter.js', 'leiter'], ['stub-mitarbeiter.js', 'mitarbeiter']]) {
    alle = alle.concat(await lauf(stub, wer));
  }
  console.log('\nFehler:', alle.length ? alle.join('\n  ') : 'keine');
  process.exit(alle.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
