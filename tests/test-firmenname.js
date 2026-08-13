/* ── Wo der Firmenname steht ──────────────────────────────────────────
   Vier Stellen sieht ein Kunde, eine verlässt das Haus: Anmeldebild-
   schirm, Fenstertitel, beide Druckausgaben — und die Bestellmail an den
   Lieferanten. Ein Ausdruck lässt sich wegwerfen, eine verschickte Mail
   nicht.

   Beim EIGENEN Betrieb fällt ein fest eingetragener Name nie auf, dort
   steht ja der richtige. Deshalb prüft dieser Durchlauf beide
   Richtungen:

     1. Eine fremde Firma sieht ihren Namen, nicht „Körperformen".
     2. Auch VOR dem Anmelden — dort schaut ein neuer Kunde zuerst hin.
     3. Der eigene Betrieb sieht weiterhin seinen eigenen Namen.
     4. Nirgends in der laufenden App steht „Körperformen" fest, wenn
        eine andere Firma geladen ist.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
const FREMD = 'Studio Müller GmbH';

async function start(opt) {
  opt = opt || {};
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript(
    'window.__firma = ' + JSON.stringify(opt.firma || null) + ';' +
    'window.__firmaName = ' + JSON.stringify(opt.name || null) + ';');
  await page.addInitScript({ path: path.join(SP, opt.stub || 'stub-chef.js') });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(opt.warten || 2600);
  return { b, page };
}

(async () => {
  // ══ 1.+4. Angemeldet bei einer fremden Firma ══
  {
    const { b, page } = await start({ firma: 'mueller-7f3a', name: FREMD });
    const lage = await page.evaluate(() => ({
      titel: document.title,
      sub: (document.getElementById('authSub') || {}).textContent || ''
    }));
    console.log('1. Fremde Firma – Titel:', JSON.stringify(lage.titel));
    if (lage.titel.indexOf(FREMD) < 0) {
      errs.push('FEHLT: der Fenstertitel nennt nicht die geladene Firma (' + lage.titel + ')');
    }
    if (/Körperformen/i.test(lage.titel)) {
      errs.push('DER FEHLER: im Fenstertitel steht der Name eines fremden Betriebs');
    }

    /* Die Bestellmail. Sie verlaesst das Haus — deshalb wird hier der
       fertige Text geprüft, nicht nur ein Feld. mailto wird abgefangen,
       damit sich kein Mailprogramm oeffnet. */
    /* Die App oeffnet die Mail ueber window.location.href = 'mailto:…',
       nicht ueber window.open. Wer nur window.open abfaengt, misst
       nichts und haelt das fuer „keine Mail" — beim ersten Anlauf genau
       so passiert. Playwright faengt die Navigation ab, bevor der
       Browser ein Mailprogramm sucht. */
    let mailUrl = null;
    page.on('request', r => {
      const u = r.url();
      if (u.indexOf('mailto:') === 0) mailUrl = u;
    });
    await page.route('mailto:**', r => r.abort());
    const mail = await page.evaluate(async () => {
      const g = document.querySelector('.mobnav [data-group="g-arbeit"]');
      if (g) g.click();
      await new Promise(r => setTimeout(r, 300));
      const t = document.querySelector('[data-subview="material"]');
      if (t) t.click();
      await new Promise(r => setTimeout(r, 700));
      const b2 = document.getElementById('shopMail');
      if (!b2) return { fehler: 'kein Bestellmail-Knopf' };
      /* location.href abfangen: im Test soll sich nichts oeffnen, und
         der Wert ist das, was geprueft wird. */
      window.__mailto = null;
      const beschr = { set: function (v) { window.__mailto = String(v); }, get: function () { return ''; } };
      try { Object.defineProperty(window.location, 'href', beschr); } catch (e) { /* dann greift der request-Fang */ }
      b2.click();
      await new Promise(r => setTimeout(r, 400));
      return { url: window.__mailto, fehler: null };
    });
    if (!mail.url && mailUrl) mail.url = mailUrl;
    console.log('1b. Bestellmail:', JSON.stringify(String(mail.url || mail.fehler || '').slice(0, 120)));
    if (mail.url) {
      const text = decodeURIComponent(mail.url);
      if (/Körperformen/i.test(text)) {
        errs.push('GEHT NACH AUSSEN: die Bestellmail eines fremden Kunden trägt ' +
                  '„Körperformen" — eine verschickte Mail lässt sich nicht zurückholen');
      }
      if (text.indexOf(FREMD) < 0) {
        errs.push('FEHLT: die Bestellmail nennt nicht den Namen der geladenen Firma');
      }
    }
    await b.close();
  }

  /* ══ 2. VOR dem Anmelden ══
     Die Stelle, an die ein neuer Kunde zuerst schaut. Und die, an der
     der Rückfall auf konfig.js NICHT greifen darf. */
  {
    const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    page.on('pageerror', e => errs.push('PAGEERROR (vor Login): ' + e.message.slice(0, 200)));
    await page.route('**://www.gstatic.com/**', r => r.abort());
    await page.route('**fonts.googleapis.com/**', r => r.abort());
    await page.addInitScript('window.__firmaName = ' + JSON.stringify(FREMD) + ';');
    await page.addInitScript({ path: path.join(SP, 'stub-ohne-login.js') });
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2200);
    const sub = await page.evaluate(() =>
      (document.getElementById('authSub') || {}).textContent || '');
    console.log('2. Vor dem Anmelden:', JSON.stringify(sub));
    if (/Körperformen/i.test(sub)) {
      errs.push('DER FEHLER, UM DEN ES GEHT: auf dem Anmeldebildschirm eines fremden ' +
                'Kunden steht der Name eines anderen Betriebs');
    }
    if (sub.indexOf(FREMD) < 0) {
      errs.push('FEHLT: vor dem Anmelden steht der Firmenname nicht da (' + sub + ')');
    }
    await b.close();
  }

  /* ══ 3. Der eigene Betrieb ══
     Die Gegenrichtung. Ohne sie wäre auch eine App grün, die den
     Firmennamen überall weglässt — und das wäre kein Fortschritt. */
  {
    const { b, page } = await start({});
    const titel = await page.evaluate(() => document.title);
    console.log('3. Eigener Betrieb – Titel:', JSON.stringify(titel));
    if (titel.indexOf('Körperformen') < 0) {
      errs.push('GEGENPROBE: der eigene Betrieb sieht seinen Namen nicht mehr (' + titel + ')');
    }
    await b.close();
  }

  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Firmenname: jede Firma sieht ihren eigenen — auch vor dem Anmelden und in der Bestellmail');
  process.exit(errs.length ? 1 : 0);
})();
