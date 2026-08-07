const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = process.env.SP || __dirname;

(async () => {
  // --use-fake-device-for-media-capture liefert ein synthetisches Mikrofon,
  // damit die Aufnahme im Test wirklich läuft.
  const b = await chromium.launch({
    executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-capture', '--alsa-input-device=null', '--no-sandbox'],
  });
  const ctx = await b.newContext({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2, permissions: ['microphone'] });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.mouse.click(215, 400).catch(() => {});
  await page.waitForTimeout(1800);

  const GROUP = { chat:'g-komm', dm:'g-komm' };
  async function go(view) {
    await page.evaluate(g => document.querySelector('.mobnav [data-group="' + g + '"]').click(), GROUP[view]);
    await page.waitForTimeout(450);
    const sub = await page.$('[data-subview="' + view + '"]');
    if (sub) { await sub.click(); await page.waitForTimeout(500); }
  }

  await go('chat');
  console.log('MIKROFON-KNOPF:', await page.evaluate(() => ({
    imChat: !!document.getElementById('chatMic') && document.getElementById('chatMic').style.display !== 'none',
    beiDirekt: !!document.getElementById('dmMic'),
    unterstuetzt: !!(navigator.mediaDevices && window.MediaRecorder),
    format: (() => { const k = ['audio/webm;codecs=opus','audio/webm','audio/mp4'];
      return k.find(x => window.MediaRecorder && MediaRecorder.isTypeSupported(x)) || 'keins'; })(),
  })));

  console.log('MIKROFON-PROBE:', await page.evaluate(async () => {
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: true });
      const n = st.getTracks().length;
      st.getTracks().forEach(t => t.stop());
      return { ok: true, spuren: n, sichererKontext: window.isSecureContext };
    } catch (e) { return { ok: false, fehler: e.name + ': ' + e.message, sichererKontext: window.isSecureContext }; }
  }));

  // Aufnahme starten
  await page.evaluate(() => document.getElementById('chatMic').click());
  await page.waitForTimeout(2500);
  const running = await page.evaluate(() => ({
    leisteSichtbar: document.getElementById('recBar').classList.contains('show'),
    zeit: document.getElementById('recTime').textContent,
    hinweis: document.getElementById('recHint').textContent,
    micLeuchtet: document.getElementById('chatMic').classList.contains('rec-on'),
  }));
  console.log('WÄHREND AUFNAHME:', JSON.stringify(running));
  await page.screenshot({ path: SP + '/voice-rec.png' });

  // Beenden
  await page.evaluate(() => document.getElementById('recStop').click());
  await page.waitForTimeout(1500);
  const done = await page.evaluate(() => ({
    leisteWeg: !document.getElementById('recBar').classList.contains('show'),
    vorschauDa: document.getElementById('recPrev').classList.contains('show'),
    tonGeladen: (document.getElementById('recAudio').src || '').slice(0, 30),
    laengeBytes: (document.getElementById('recAudio').src || '').length,
    toast: document.getElementById('toast').textContent,
  }));
  console.log('NACH AUFNAHME:', JSON.stringify(done));
  await page.screenshot({ path: SP + '/voice-prev.png' });

  // Senden (Stub nimmt es entgegen)
  await page.evaluate(() => document.getElementById('chatSend').click());
  await page.waitForTimeout(700);
  console.log('NACH SENDEN:', await page.evaluate(() => ({
    vorschauWeg: !document.getElementById('recPrev').classList.contains('show'),
  })));

  // Verwerfen-Weg prüfen
  await page.evaluate(() => document.getElementById('chatMic').click());
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById('recCancel').click());
  await page.waitForTimeout(600);
  console.log('NACH ABBRECHEN:', await page.evaluate(() => ({
    leisteWeg: !document.getElementById('recBar').classList.contains('show'),
    keineVorschau: !document.getElementById('recPrev').classList.contains('show'),
    toast: document.getElementById('toast').textContent,
  })));

  // Anzeige einer empfangenen Sprachnachricht
  console.log('ANZEIGE im Chat:', await page.evaluate(() => ({
    abspieler: document.querySelectorAll('.msg-audio audio').length,
    laengeLabel: [...document.querySelectorAll('.au-len')].map(x => x.textContent),
  })));

  console.log('Fehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
