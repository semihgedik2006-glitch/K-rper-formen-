const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = process.env.SP || __dirname;

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  await page.mouse.click(215, 400).catch(() => {});
  await page.waitForTimeout(1500);

  const GROUP = { home:'g-start', chat:'g-komm', dm:'g-komm', ann:'g-komm',
                  todos:'g-arbeit', putzplan:'g-arbeit', material:'g-arbeit',
                  team:'g-team', docs:'g-arbeit', chef:'g-chef', archive:'g-chef' };
  async function go(view) {
    await page.evaluate(g => document.querySelector('.mobnav [data-group="' + g + '"]').click(), GROUP[view]);
    await page.waitForTimeout(450);
    const sub = await page.$('[data-subview="' + view + '"]');
    if (sub) { await sub.click(); await page.waitForTimeout(500); }
  }

  await go('chat');

  const base = await page.evaluate(() => ({
    nachrichten: document.querySelectorAll('.msg').length,
    zitate: document.querySelectorAll('.msg-quote').length,
    reaktionen: document.querySelectorAll('.react').length,
    erwaehnungen: document.querySelectorAll('.mention').length,
    hervorgehoben: document.querySelectorAll('.msg.mentioned').length,
    bearbeitetMarke: document.querySelectorAll('.edited').length,
    gruppiert: document.querySelectorAll('.msg.grp').length,
    kanalBadges: document.querySelectorAll('.chan-badge').length,
  }));
  console.log('Darstellung:', JSON.stringify(base, null, 1));

  // Antworten starten – über das Aktionsblatt
  await page.evaluate(() => document.querySelectorAll('.msg')[0].click());
  await page.waitForTimeout(350);
  await page.evaluate(() => document.querySelector('[data-ma="reply"]').click());
  await page.waitForTimeout(350);
  const reply = await page.evaluate(() => ({
    leiste: getComputedStyle(document.getElementById('composeBar')).display,
    titel: document.getElementById('cbTitle').textContent,
  }));
  console.log('Antwort-Leiste:', JSON.stringify(reply));

  // Abbrechen
  await page.evaluate(() => document.getElementById('cbCancel').click());
  await page.waitForTimeout(250);
  console.log('Nach Abbrechen versteckt:',
    await page.evaluate(() => getComputedStyle(document.getElementById('composeBar')).display === 'none'));

  // Reaktionen liegen jetzt im Aktionsblatt
  await page.evaluate(() => document.querySelectorAll('.msg')[0].click());
  await page.waitForTimeout(350);
  console.log('Emoji-Reihe im Blatt:',
    await page.evaluate(() => document.querySelectorAll('#msSheetReact .ms-emoji').length) + ' Emojis');
  await page.evaluate(() => document.getElementById('msSheetClose').click());
  await page.waitForTimeout(250);

  await page.screenshot({ path: SP + '/chat-features.png' });
  console.log('Fehler:', errs.length ? errs.join('|') : 'keine');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
