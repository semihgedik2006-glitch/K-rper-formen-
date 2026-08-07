const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = process.env.SP || __dirname;

(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-capture', '--alsa-input-device=null', '--no-sandbox'],
  });
  const ctx = await b.newContext({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2, permissions: ['microphone'], hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await page.mouse.click(215, 400).catch(() => {});
  await page.waitForTimeout(1900);

  const GROUP = { home:'g-start', chat:'g-komm', dm:'g-komm', ann:'g-komm',
                  todos:'g-arbeit', putzplan:'g-arbeit', material:'g-arbeit',
                  team:'g-team', docs:'g-team', chef:'g-chef', archive:'g-chef' };
  async function go(view) {
    await page.evaluate(g => document.querySelector('.mobnav [data-group="' + g + '"]').click(), GROUP[view]);
    await page.waitForTimeout(450);
    const sub = await page.$('[data-subview="' + view + '"]');
    if (sub) { await sub.click(); await page.waitForTimeout(550); }
  }

  // ── Aufgaben-Screen: wie viel Platz nimmt der feste Kopf? ──
  await go('todos');
  const vorher = await page.evaluate(() => {
    const area = document.querySelector('#view-todos .scroll-area');
    const head = document.querySelector('#view-todos .view-head');
    return {
      kopfHoehe: Math.round(head.getBoundingClientRect().height),
      listeStartetBei: Math.round(area.getBoundingClientRect().top),
      sichtbareListe: Math.round(area.getBoundingClientRect().height),
      scrollbar: area.scrollHeight > area.clientHeight,
    };
  });
  console.log('AUFGABEN oben (ungescrollt):', JSON.stringify(vorher));
  await page.screenshot({ path: SP + '/ui-todos-oben.png' });

  // Scrollen → Kopf muss schrumpfen, Filter kleben bleiben
  await page.evaluate(() => { document.querySelector('#view-todos .scroll-area').scrollTop = 300; });
  await page.waitForTimeout(700);
  const nachher = await page.evaluate(() => {
    const head = document.querySelector('#view-todos .view-head');
    const tools = document.querySelector('#view-todos .sticky-tools');
    return {
      kopfHoehe: Math.round(head.getBoundingClientRect().height),
      kopfKompakt: head.classList.contains('tight'),
      untertitelSichtbar: head.querySelector('p').getBoundingClientRect().height > 2,
      filterNochSichtbar: tools.getBoundingClientRect().top < 250 && tools.getBoundingClientRect().bottom > 0,
      filterKlebt: tools.classList.contains('stuck'),
    };
  });
  console.log('AUFGABEN nach Scrollen:', JSON.stringify(nachher));
  console.log('→ Platzgewinn:', vorher.kopfHoehe - nachher.kopfHoehe, 'px');
  await page.screenshot({ path: SP + '/ui-todos-gescrollt.png' });

  // ── Chat: Werkzeuge erst bei Antippen ──
  await go('chat');
  const t0 = await page.evaluate(() => {
    const t = document.querySelector('.msg .msg-tools');
    return { breite: Math.round(t.getBoundingClientRect().width), sichtbar: getComputedStyle(t).opacity };
  });
  await page.evaluate(() => document.querySelectorAll('.msg')[0].click());
  await page.waitForTimeout(500);
  const t1 = await page.evaluate(() => {
    const t = document.querySelector('.msg .msg-tools');
    return { breite: Math.round(t.getBoundingClientRect().width), sichtbar: getComputedStyle(t).opacity,
             offeneNachrichten: document.querySelectorAll('.msg.tools-open').length };
  });
  console.log('CHAT-WERKZEUGE vorher:', JSON.stringify(t0), '→ nach Tippen:', JSON.stringify(t1));

  // ── Sprachnachricht: Halten sendet automatisch ──
  const mic = await page.$('#chatMic');
  const box = await mic.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2).catch(() => {});
  await page.waitForTimeout(300);
  console.log('Kurzes Tippen startet freihändig:', await page.evaluate(() => ({
    leiste: document.getElementById('recBar').classList.contains('show'),
    fertigKnopfSichtbar: document.getElementById('recStop').style.display !== 'none',
    hinweis: document.getElementById('recHint').textContent,
  })));
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.getElementById('recStop').click());
  await page.waitForTimeout(1200);
  console.log('Nach "Fertig" (Tipp-Modus → Vorschau):', await page.evaluate(() => ({
    vorschau: document.getElementById('recPrev').classList.contains('show'),
  })));
  await page.evaluate(() => document.getElementById('recDiscard').click());
  await page.waitForTimeout(400);

  // Halten → automatisch senden
  const nachrichtenVorher = await page.evaluate(() => document.querySelectorAll('.msg').length);
  await page.evaluate(() => { window.__gesendet = 0; });
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1800);
  const beimHalten = await page.evaluate(() => ({
    leiste: document.getElementById('recBar').classList.contains('show'),
    hinweis: document.getElementById('recHint').textContent,
    fertigVersteckt: document.getElementById('recStop').style.display === 'none',
  }));
  console.log('WÄHREND HALTEN:', JSON.stringify(beimHalten));
  await page.mouse.up();
  await page.waitForTimeout(1500);
  console.log('NACH LOSLASSEN:', await page.evaluate(() => ({
    vorschauOffen: document.getElementById('recPrev').classList.contains('show'),
    leisteWeg: !document.getElementById('recBar').classList.contains('show'),
  })), '(Vorschau muss ZU sein = automatisch gesendet)');

  // ── Eigener Chat-Hintergrund ──
  await page.evaluate(() => document.getElementById('uAvatar').click());
  await page.waitForTimeout(600);
  await page.evaluate(() => document.querySelector('[data-pmtab=aussehen]').click());
  await page.waitForTimeout(500);
  console.log('AUSSEHEN-MENÜ:', await page.evaluate(() => ({
    hintergruende: [...document.querySelectorAll('#bgOpts .opt span')].map(x => x.textContent),
    fotoZeileVersteckt: document.getElementById('bgOwnRow').style.display === 'none',
  })));
  await page.evaluate(() => document.querySelector('[data-bg=eigenes]').click());
  await page.waitForTimeout(500);
  console.log('Nach Wahl "Eigenes Foto":', await page.evaluate(() => ({
    fotoZeileSichtbar: document.getElementById('bgOwnRow').style.display === 'flex',
    hinweisSichtbar: document.getElementById('bgOwnNote').style.display === 'block',
    hinweisText: document.getElementById('bgOwnNote').textContent.trim().slice(0, 60),
  })));
  await page.screenshot({ path: SP + '/ui-aussehen.png' });

  console.log('Fehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
