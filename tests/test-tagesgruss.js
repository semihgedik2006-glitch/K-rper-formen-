/* ══ EIN GRUSS FÜR DIE GANZE APP (Runde 220) ═══════════════════════════
   Gesehen am 23.10.2026 um 3 Uhr: oben auf der Startseite „Guten Morgen,
   Lisa", daneben Formis Blase „Guten Abend, Lisa! Früh dran! …". Zwei
   Stellen rechneten die Tageszeit getrennt, mit verschiedenen Grenzen.

   Geprüft wird zu vier Uhrzeiten (3, 7, 14, 20 Uhr, Uhr des Browsers
   gestellt): Kopf der Startseite und Formis Tagesgruss sagen dasselbe, und
   Formis Satz passt zur Uhrzeit (nachts kein „Früh dran").
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

const FAELLE = [
  { uhr: 3, gruss: 'Guten Abend', nicht: /Früh dran|frühe Vogel|Montagmorgen/ },
  { uhr: 7, gruss: 'Guten Morgen', nicht: /Endspurt|Noch wach/ },
  { uhr: 14, gruss: 'Hallo', nicht: /Noch wach|Früh dran/ },
  { uhr: 20, gruss: 'Guten Abend', nicht: /Früh dran|Noch wach/ }
];

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const f of FAELLE) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true, isMobile: true, timezoneId: 'Europe/Berlin' });
    /* Ein Mittwoch, damit weder „Montagmorgen" noch „Freitag" hineinspielt. */
    await ctx.clock.install({ time: new Date('2026-10-21T' + String(f.uhr).padStart(2, '0') + ':10:00+02:00') });
    const p = await ctx.newPage();
    const fehler = [];
    p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.route('**fonts.googleapis.com/**', r => r.abort());
    await p.addInitScript(() => { try { localStorage.setItem('kf_tour', '1:testuid'); localStorage.removeItem('kf_formi_gruss'); } catch (e) {} });
    await p.addInitScript({ path: SP + '/stub-mitarbeiter.js' });
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
    /* Formis Tagesgruss kommt kurz nach dem Start. */
    const blase = await p.waitForFunction(() => { const x = document.getElementById('formiBlase'); return x && !x.hidden && x.textContent.trim() ? x.textContent.trim() : null; }, null, { timeout: 12000, polling: 200 })
      .then(h => h.jsonValue(), () => '');
    const kopf = await p.evaluate(() => (document.getElementById('homeGreet') || {}).textContent || '');
    const wo = f.uhr + ' Uhr';
    pruefe(wo + ': Kopf „' + kopf + '"', kopf.indexOf(f.gruss + ',') === 0, kopf);
    pruefe(wo + ': Formi grüsst gleich („' + blase.slice(0, 60) + '")', blase.indexOf(f.gruss) === 0, blase);
    pruefe(wo + ': Formis Satz passt zur Uhrzeit', !!blase && !f.nicht.test(blase), blase);
    pruefe(wo + ': ohne Skriptfehler', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }
  await b.close();
  console.log(schlecht
    ? '\n✗ Tagesgruss: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Tagesgruss: Kopf und Formi sagen zu jeder Uhrzeit dasselbe — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
