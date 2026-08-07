/* Die App aus Sicht eines normalen Mitarbeiters durchgehen.
   Das ist die grösste Nutzergruppe – bisher war nur Chef und Leiter geprüft. */
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
  await page.addInitScript({ path: SP + '/stub-mitarbeiter.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1700); await page.mouse.click(215, 400).catch(() => {}); await page.waitForTimeout(2400);

  // 1) Was sieht ein Mitarbeiter in der Navigation?
  console.log('NAVIGATION:', JSON.stringify(await page.evaluate(() => ({
    gruppen: [...document.querySelectorAll('.mobnav button span:not(.badge):not(.ndot)')].map(s => s.textContent),
    verwaltungSichtbar: !!document.querySelector('.mobnav [data-group="g-chef"]'),
  }))));

  const GROUP = { home:'g-start', chat:'g-komm', dm:'g-komm', ann:'g-komm',
                  todos:'g-arbeit', putzplan:'g-arbeit', material:'g-arbeit',
                  team:'g-team', docs:'g-team' };
  async function go(view) {
    await page.evaluate(g => document.querySelector('.mobnav [data-group="' + g + '"]').click(), GROUP[view]);
    await page.waitForTimeout(420);
    const sub = await page.$('[data-subview="' + view + '"]');
    if (sub) { await sub.click(); await page.waitForTimeout(620); }
  }

  // 2) Jede erreichbare Seite öffnen und prüfen, dass sie wirklich Inhalt hat
  for (const v of ['home','chat','dm','ann','todos','putzplan','material','team','docs']) {
    await go(v);
    const r = await page.evaluate(id => {
      const sec = document.getElementById('view-' + id);
      const area = sec.querySelector('.scroll-area, .chat-scroll, #todoArea');
      return {
        offen: sec.classList.contains('show'),
        inhalt: area ? area.textContent.replace(/\s+/g, ' ').trim().length : 0,
      };
    }, v);
    console.log(('  ' + v).padEnd(12), r.offen ? '✓ offen' : '✗ NICHT OFFEN', '| Zeichen Inhalt:', r.inhalt);
    if (!r.offen) errs.push('Ansicht ' + v + ' liess sich nicht oeffnen');
  }

  // 3) Startseite: passt sie für einen Mitarbeiter?
  await go('home');
  console.log('STARTSEITE:', JSON.stringify(await page.evaluate(() => ({
    gruss: (document.getElementById('homeGreet') || {}).textContent,
    untertitel: (document.getElementById('homeSub') || {}).textContent,
    kacheln: [...document.querySelectorAll('#homeGrid .home-tile .hl')].map(x => x.textContent),
    meinDienst: document.getElementById('myShiftCard').style.display !== 'none',
    dienstInhalt: (document.getElementById('myShiftList') || {}).textContent.replace(/\s+/g,' ').slice(0, 70),
    schnellzugriff: [...document.querySelectorAll('#quickGrid .quick span')].map(x => x.textContent),
  }))));

  // 4) Aufgaben: darf abhaken, aber nicht löschen oder Fristen verschieben
  await go('todos');
  console.log('AUFGABEN:', JSON.stringify(await page.evaluate(() => ({
    aufgaben: document.querySelectorAll('.todo').length,
    abhakenKnoepfe: document.querySelectorAll('.todo .check').length,
    loeschKnoepfe: document.querySelectorAll('.todo .t-del').length,
    fristKnoepfe: document.querySelectorAll('.todo [data-snooze]').length,
    teilschritte: document.querySelectorAll('.sub-item').length,
    titel: (document.getElementById('todoTitle') || {}).textContent,
  }))));

  // 5) Material: darf eintragen, aber Soll nicht ändern; keine Einkaufsliste
  await go('material');
  await page.waitForTimeout(700);
  console.log('MATERIAL:', JSON.stringify(await page.evaluate(() => ({
    studioAuswahl: [...document.querySelectorAll('#matStudio option')].map(o => o.textContent),
    istFelderAenderbar: [...document.querySelectorAll('.num.have')].filter(i => !i.readOnly).length,
    sollFelderGesperrt: [...document.querySelectorAll('.num.limit')].filter(i => i.readOnly).length,
    einkaufsliste: document.getElementById('shopCard').style.display !== 'none',
    vorhersage: document.getElementById('fcCard').style.display !== 'none',
  }))));

  // 6) Putzplan: abhaken ja, anlegen nein
  await go('putzplan');
  await page.waitForTimeout(700);
  console.log('PUTZPLAN:', JSON.stringify(await page.evaluate(() => ({
    aufgaben: document.querySelectorAll('.pp-item').length,
    loeschKnoepfe: document.querySelectorAll('.pp-del').length,
    anlegenFormular: !!document.getElementById('ppAdd'),
    notizFeld: !!document.getElementById('ppNoteInput'),
    druckenKnopf: !!document.getElementById('ppPrint'),
  }))));

  // 7) Chat: anheften darf nur die Verwaltung
  await go('chat');
  await page.evaluate(() => { const m = document.querySelector('.msg'); if (m) m.click(); });
  await page.waitForTimeout(400);
  console.log('CHAT:', JSON.stringify(await page.evaluate(() => ({
    kanaele: [...document.querySelectorAll('.chan')].map(c => c.textContent),
    anheftenKnopf: document.querySelectorAll('[data-pin]').length,
    weiterleiten: document.querySelectorAll('[data-fwd]').length,
    mikrofon: !!document.getElementById('chatMic'),
    angeheftetSichtbar: document.getElementById('pinBar').classList.contains('show'),
    loesenKnopfSichtbar: document.getElementById('pinOff').style.display !== 'none',
  }))));

  // 8) Team: Urlaub beantragen ja, genehmigen nein
  await go('team');
  await page.waitForTimeout(800);
  console.log('TEAM:', JSON.stringify(await page.evaluate(() => ({
    schichtEintragen: !!document.getElementById('shAdd'),
    abwesenheitMelden: !!document.getElementById('abAdd'),
    genehmigenKnoepfe: document.querySelectorAll('[data-absok]').length,
    brettSchreiben: !!document.getElementById('bbText'),
  }))));

  // 9) Einstellungen
  await page.evaluate(() => document.getElementById('uAvatar').click());
  await page.waitForTimeout(600);
  console.log('EINSTELLUNGEN:', JSON.stringify(await page.evaluate(() => ({
    reiter: [...document.querySelectorAll('[data-pmtab]')].map(t => t.textContent.trim()),
  }))));
  await page.evaluate(() => document.getElementById('pmClose').click());
  await page.waitForTimeout(400);

  // 10) Suche
  await page.evaluate(() => document.getElementById('searchBtn').click());
  await page.waitForTimeout(300);
  await page.fill('#searchInput', 'handt');
  await page.waitForTimeout(500);
  console.log('SUCHE "handt":', JSON.stringify(await page.evaluate(() =>
    [...document.querySelectorAll('.sr')].map(r => r.querySelector('.sr-type').textContent))));

  await page.evaluate(() => document.getElementById('searchClose').click());
  await page.waitForTimeout(300);
  await go('home');
  await page.screenshot({ path: SP + '/mitarbeiter-start.png' });

  console.log('\nFehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
