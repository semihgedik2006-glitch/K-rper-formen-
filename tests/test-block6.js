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
  await page.evaluate(() => { window.confirm = () => true; });

  const GROUP = { material: 'g-arbeit', team: 'g-team' };
  async function go(view) {
    await page.evaluate(g => document.querySelector('.mobnav [data-group="' + g + '"]').click(), GROUP[view]);
    await page.waitForTimeout(450);
    const sub = await page.$('[data-subview="' + view + '"]');
    if (sub) { await sub.click(); await page.waitForTimeout(650); }
  }

  // ── Verbrauchs-Vorhersage ──
  await go('material');
  await page.selectOption('#matStudio', 'studio-6').catch(() => {});
  await page.waitForTimeout(1000);
  console.log('VORHERSAGE:', JSON.stringify(await page.evaluate(() => ({
    sichtbar: document.getElementById('fcCard').style.display !== 'none',
    titel: document.getElementById('fcTitle').textContent,
    zeilen: [...document.querySelectorAll('.fc-row')].map(r => ({
      artikel: r.querySelector('b').textContent,
      reicht: r.querySelector('.fc-w').textContent,
      stufe: r.querySelector('.fc-w').className.replace('fc-w ', ''),
      basis: r.querySelector('.fc-sub').textContent,
    })),
  })), null, 1));
  await page.screenshot({ path: SP + '/vorhersage.png' });

  await page.selectOption('#matStudio', 'studio-7').catch(() => {});
  await page.waitForTimeout(900);
  console.log('Studio ohne Verlauf:', await page.evaluate(() => document.getElementById('fcList').textContent.trim().slice(0, 120)));

  // ── Urlaubsanträge ──
  await go('team');
  await page.waitForTimeout(900);
  await page.selectOption('#teamStudio', 'studio-6').catch(() => {});
  await page.waitForTimeout(1000);
  console.log('ABWESENHEITEN:', JSON.stringify(await page.evaluate(() => ({
    zeilen: [...document.querySelectorAll('.abs-row')].map(r => ({
      wer: (r.querySelector('b') || {}).textContent,
      status: (r.querySelector('.abs-status') || {}).textContent,
      knoepfe: [...r.querySelectorAll('.abs-actions button')].map(b => b.textContent),
    })),
  })), null, 1));

  const hatOk = await page.evaluate(() => !!document.querySelector('[data-absok]'));
  if (hatOk) {
    await page.evaluate(() => document.querySelector('[data-absok]').click());
    await page.waitForTimeout(700);
    console.log('Nach Genehmigen – Toast:', await page.evaluate(() => document.getElementById('toast').textContent));
  } else {
    console.log('KEIN Genehmigen-Knopf gefunden');
  }
  await page.screenshot({ path: SP + '/urlaub.png' });

  console.log('Fehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
