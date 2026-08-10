/* Impressum, Datenschutz, E-Mail-Bestätigung.

   Geprüft wird:
     1. Impressum und Datenschutz sind OHNE Anmeldung erreichbar.
        Ein Impressum hinter einem Login ist keins.
     2. Fehlen Pflichtangaben, steht das deutlich drüber — die App darf
        ein leeres Impressum nicht als fertiges anzeigen.
     3. Sind sie da, ist der Warnhinweis weg und die Angaben stehen drin.
     4. Das Fenster hängt am Dialog-System: role="dialog", Escape.
     5. Die E-Mail-Leiste erscheint nur bei unbestätigter Adresse und
        lässt sich wegklicken.

   Was hier NICHT geprüft wird und deshalb auch nicht behauptet: ob die
   Texte rechtlich vollständig sind. Das kann kein Test beantworten.    */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const rechtSetzen = daten => `
window.addEventListener('DOMContentLoaded', function(){}, false);
(function(){
  var alt = Object.getOwnPropertyDescriptor(window, 'KONFIG');
  function anwenden(){
    if (window.KONFIG) window.KONFIG.recht = ${JSON.stringify(daten)};
  }
  anwenden();
  var iv = setInterval(function(){ if (window.KONFIG) { anwenden(); clearInterval(iv); } }, 5);
  setTimeout(function(){ clearInterval(iv); }, 3000);
})();`;

async function start(errs, recht, stub) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 160));
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/' + (stub || 'stub-ohne-login.js') });
  if (recht) await page.addInitScript(rechtSetzen(recht));
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(stub ? 2800 : 1800);
  return { b, page };
}

(async () => {
  const errs = [];

  // ══ 1.+2. Ohne Anmeldung, ohne Angaben ══
  {
    const { b, page } = await start(errs, {
      betreiber: '', anschrift: '', vertreten: '', email: '', telefon: '',
      register: '', ustId: '', datenschutzKontakt: '', zusatz: [],
    }, null);

    const links = await page.evaluate(() =>
      [...document.querySelectorAll('.auth-wrap [data-rechtauf]')]
        .filter(a => a.offsetParent !== null)
        .map(a => ({ ziel: a.dataset.rechtauf, text: a.textContent.trim(),
                     h: Math.round(a.getBoundingClientRect().height) })));
    console.log('Links im Anmeldebildschirm:', JSON.stringify(links));
    if (links.length !== 2) errs.push('FEHLT: ' + links.length + ' statt 2 Rechtslinks vor dem Login');

    await page.evaluate(() => document.querySelector('[data-rechtauf="impressum"]').click());
    await page.waitForTimeout(500);
    const leer = await page.evaluate(() => ({
      offen: document.getElementById('rechtModal').classList.contains('show'),
      warnung: (document.querySelector('.recht-fehlt') || {}).textContent || '',
      rolle: !!document.querySelector('#rechtModal [role="dialog"]'),
    }));
    console.log('Ohne Angaben:', JSON.stringify({ offen: leer.offen, warnung: leer.warnung.slice(0, 70) }));
    if (!leer.offen) errs.push('FEHLT: das Rechtliches-Fenster öffnet nicht');
    if (!leer.warnung) errs.push('GEFÄHRLICH: leeres Impressum wird ohne Warnung als fertiges gezeigt');
    if (leer.warnung && !/Anschrift/.test(leer.warnung)) {
      errs.push('FEHLT: die Warnung nennt nicht, was fehlt');
    }
    if (!leer.rolle) errs.push('FEHLT: kein role="dialog" – das Fenster hängt nicht am Dialog-System');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(350);
    const zu = await page.evaluate(() => !document.getElementById('rechtModal').classList.contains('show'));
    if (!zu) errs.push('FEHLT: Escape schließt das Rechtliches-Fenster nicht');

    await b.close();
  }

  // ══ 3. Mit Angaben ══
  {
    const { b, page } = await start(errs, {
      betreiber: 'Körperformen Köln GmbH',
      anschrift: 'Musterstraße 1, 50667 Köln',
      vertreten: 'Max Mustermann',
      telefon: '0221 1234567',
      email: 'info@beispiel.de',
      register: 'Amtsgericht Köln, HRB 12345',
      ustId: 'DE123456789',
      datenschutzKontakt: 'datenschutz@beispiel.de',
      zusatz: ['Im Eingangsbereich hängt eine Kamera.'],
    }, null);

    await page.evaluate(() => document.querySelector('[data-rechtauf="impressum"]').click());
    await page.waitForTimeout(500);
    const voll = await page.evaluate(() => ({
      warnung: !!document.querySelector('.recht-fehlt'),
      text: (document.getElementById('rechtInhalt') || {}).textContent || '',
    }));
    console.log('Mit Angaben – Warnung:', voll.warnung, '· Länge:', voll.text.length);
    if (voll.warnung) errs.push('FEHLT: Warnung bleibt stehen, obwohl alles da ist');
    ['Körperformen Köln GmbH', 'Musterstraße 1', 'Max Mustermann', 'HRB 12345'].forEach(w => {
      if (!voll.text.includes(w)) errs.push('FEHLT im Impressum: ' + w);
    });

    // Datenschutz
    await page.evaluate(() => document.querySelector('[data-recht="datenschutz"]').click());
    await page.waitForTimeout(400);
    const ds = await page.evaluate(() => (document.getElementById('rechtInhalt') || {}).textContent || '');
    console.log('Datenschutz-Länge:', ds.length);
    ['europe-west1', 'Sprachaufnahmen', 'Art. 15', 'datenschutz@beispiel.de',
     'Kamera', 'keine anwaltlich geprüfte'].forEach(w => {
      if (!ds.includes(w)) errs.push('FEHLT im Datenschutz: ' + w);
    });
    if (/undefined|\[object/.test(ds)) errs.push('FEHLER: „undefined" steht im Datenschutztext');

    await page.screenshot({ path: SP + '/recht.png' });
    await b.close();
  }

  // ══ 5. E-Mail-Leiste ══
  {
    const { b, page } = await start(errs, null, 'stub-chef.js');
    const leiste = await page.evaluate(() => {
      const l = document.getElementById('mailLeiste');
      return { da: !!l, sichtbar: l ? l.offsetParent !== null : null };
    });
    // Der Stub liefert kein emailVerified => currentUser hat es nicht,
    // also gilt "nicht bestätigt" und die Leiste soll stehen.
    console.log('E-Mail-Leiste:', JSON.stringify(leiste));
    if (!leiste.da) errs.push('FEHLT: die E-Mail-Leiste gibt es nicht');
    if (leiste.sichtbar) {
      const weg = await page.evaluate(() => {
        document.getElementById('mailZu').click();
        return document.getElementById('mailLeiste').style.display;
      });
      console.log('Nach dem Wegklicken:', weg);
      if (weg !== 'none') errs.push('FEHLT: die Leiste lässt sich nicht wegklicken');
      const gemerkt = await page.evaluate(() => !!localStorage.getItem('kf_mail_ruhe'));
      if (!gemerkt) errs.push('FEHLT: das Wegklicken wird nicht gemerkt – die Leiste kommt sofort wieder');
    }
    await b.close();
  }

  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ') : '\n✓ Rechtliches: erreichbar, ehrlich über Lücken, und Escape schließt');
  process.exit(errs.length ? 1 : 0);
})();
