/* Fenster über der Seite – für Leute, die nicht tippen wie wir.

   Geprüft wird an einem echten Fenster (Profil), mit echten Tastendrücken:

     1. Es meldet sich als Fenster an: role="dialog" und aria-modal.
     2. Beim Öffnen springt der Schreibcursor hinein – und nicht auf das
        Kreuz, sondern auf das erste Feld, mit dem man etwas tut.
     3. Der Tabulator kommt nicht mehr heraus. Zehnmal Tab, zehnmal
        Shift+Tab: der Fokus muss jedes Mal noch im Fenster stehen.
     4. Escape schließt.
     5. Danach steht der Fokus wieder auf dem Knopf, der es geöffnet hat.

   Was hier NICHT geprüft wird: wie sich ein echtes Vorleseprogramm
   verhält. Dafür bräuchte man VoiceOver oder NVDA, und das kann dieser
   Rechner nicht.                                                        */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 160));
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  // ══ 1. Alle Fenster melden sich als Fenster an ══
  const rollen = await page.evaluate(() => {
    const ids = ['profileModal', 'personModal', 'devModal', 'pollModal', 'todoEditModal',
      'fwdModal', 'keysModal', 'searchOverlay', 'msgSheet', 'todoSheet', 'docSheet'];
    return ids.map(id => {
      const w = document.getElementById(id);
      if (!w) return { id, fehlt: true };
      const box = w.querySelector('[role="dialog"]');
      return {
        id,
        rolle: !!box,
        modal: box ? box.getAttribute('aria-modal') === 'true' : false,
        benannt: box ? !!(box.getAttribute('aria-labelledby') || box.getAttribute('aria-label')) : false,
      };
    });
  });
  rollen.forEach(r => {
    if (r.fehlt) { errs.push('FEHLT: Fenster „' + r.id + '" gibt es gar nicht mehr'); return; }
    if (!r.rolle) errs.push('FEHLT: „' + r.id + '" hat kein role="dialog"');
    if (!r.modal) errs.push('FEHLT: „' + r.id + '" hat kein aria-modal');
    if (!r.benannt) errs.push('FEHLT: „' + r.id + '" hat keinen Namen (aria-labelledby)');
  });
  console.log('Fenster geprüft:', rollen.length);

  // ══ 2.–5. Am Profil-Fenster durchspielen ══
  // Erst einen echten Knopf fokussieren, damit es etwas zurückzugeben gibt.
  const aufmacher = await page.evaluate(() => {
    const k = document.getElementById('avatarBtn') ||
      document.querySelector('[data-act="profil"], .topbar button');
    if (!k) return null;
    k.id = k.id || 'testAufmacher';
    k.focus();
    return k.id;
  });
  if (!aufmacher) errs.push('KEIN TEST: kein Knopf gefunden, der das Profil öffnet');

  await page.evaluate(() => {
    const m = document.getElementById('profileModal');
    if (m) m.classList.add('show');
  });
  await page.waitForTimeout(300);

  const drin = await page.evaluate(() => {
    const m = document.getElementById('profileModal');
    const a = document.activeElement;
    return {
      imFenster: m.contains(a),
      element: a ? (a.id || a.tagName + '.' + a.className).slice(0, 40) : null,
      aufsKreuz: !!(a && /lb-close/.test(a.className || '')),
    };
  });
  console.log('Nach dem Öffnen steht der Fokus auf:', JSON.stringify(drin));
  if (!drin.imFenster) errs.push('FEHLT: Fokus springt beim Öffnen nicht ins Fenster');
  if (drin.aufsKreuz) errs.push('UNSCHÖN: Fokus landet auf dem Schließen-Kreuz statt auf dem ersten Feld');

  // Tabulator einsperren – vorwärts
  let raus = null;
  for (let i = 0; i < 12 && !raus; i++) {
    await page.keyboard.press('Tab');
    const wo = await page.evaluate(() => {
      const m = document.getElementById('profileModal'), a = document.activeElement;
      return m.contains(a) ? null : (a ? (a.id || a.tagName) : 'body');
    });
    if (wo) raus = 'Tab #' + (i + 1) + ' → ' + wo;
  }
  if (raus) errs.push('AUSBRUCH: Tabulator verlässt das Fenster (' + raus + ')');

  // und rückwärts
  let rausR = null;
  for (let i = 0; i < 12 && !rausR; i++) {
    await page.keyboard.press('Shift+Tab');
    const wo = await page.evaluate(() => {
      const m = document.getElementById('profileModal'), a = document.activeElement;
      return m.contains(a) ? null : (a ? (a.id || a.tagName) : 'body');
    });
    if (wo) rausR = 'Shift+Tab #' + (i + 1) + ' → ' + wo;
  }
  if (rausR) errs.push('AUSBRUCH: Shift+Tab verlässt das Fenster (' + rausR + ')');
  console.log('Tabulator bleibt drin:', !raus && !rausR);

  // Escape schließt
  await page.keyboard.press('Escape');
  await page.waitForTimeout(350);
  const zu = await page.evaluate(() => !document.getElementById('profileModal').classList.contains('show'));
  console.log('Escape schließt:', zu);
  if (!zu) errs.push('FEHLT: Escape schließt das Fenster nicht');

  // Fokus kommt zurück
  if (aufmacher && zu) {
    const zurueck = await page.evaluate(id => {
      const a = document.activeElement;
      return { id: a ? a.id : null, stimmt: !!a && a.id === id };
    }, aufmacher);
    console.log('Fokus danach:', JSON.stringify(zurueck));
    if (!zurueck.stimmt) errs.push('FEHLT: Fokus kehrt nicht zum Auslöser zurück (steht auf „' + zurueck.id + '")');
  }

  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ') : '\n✓ Dialoge: Tastatur kommt rein, bleibt drin und findet zurück');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
