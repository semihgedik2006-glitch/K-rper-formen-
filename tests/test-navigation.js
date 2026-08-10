/* Navigation: Gruppen, Zurück-Geste, Verwaltungs-Übersicht.

   Die Zurück-Geste ist der wichtigste Teil davon – auf einem installierten
   Android-PWA gibt es keine sichtbare Zurück-Schaltfläche, und vorher hat
   sie die App verlassen. */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function start(stub, errs, breite) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: breite || 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/' + stub });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await page.mouse.click(195, 400).catch(() => {});
  await page.waitForTimeout(2700);
  return { b, page };
}
const ansicht = page => page.evaluate(() => {
  const v = document.querySelector('.view.show');
  return v ? v.id : 'KEINE';
});

(async () => {
  const errs = [];

  // ── 1. Gruppen und ihre Unterseiten ──
  {
    const { b, page } = await start('stub-chef.js', errs);
    const gruppen = await page.evaluate(() =>
      [...document.querySelectorAll('.mobnav button span:not(.badge):not(.ndot)')].map(s => s.textContent));
    console.log('GRUPPEN:', JSON.stringify(gruppen));
    const soll = ['Start', 'Chat', 'Betrieb', 'Team', 'Verwaltung'];
    if (JSON.stringify(gruppen) !== JSON.stringify(soll)) {
      errs.push('Gruppen stimmen nicht: ' + JSON.stringify(gruppen));
    }

    await page.evaluate(() => document.querySelector('.mobnav [data-group="g-arbeit"]').click());
    await page.waitForTimeout(600);
    const unter = await page.evaluate(() => [...document.querySelectorAll('[data-subview]')].map(s => s.textContent.trim()));
    console.log('BETRIEB:', JSON.stringify(unter));
    if (!unter.some(u => /Dokumente/.test(u))) errs.push('Dokumente liegt nicht unter Betrieb');
    if (unter.length !== 5) errs.push('Betrieb hat ' + unter.length + ' statt 5 Unterseiten');
    await b.close();
  }

  // ── 2. Zurück-Geste ──
  {
    const { b, page } = await start('stub-chef.js', errs);

    await page.evaluate(() => document.querySelector('.mobnav [data-group="g-komm"]').click());
    await page.waitForTimeout(550);
    await page.evaluate(() => document.querySelector('.mobnav [data-group="g-arbeit"]').click());
    await page.waitForTimeout(550);
    const hash = await page.evaluate(() => location.hash);
    console.log('ZURÜCK – Adresse nach zwei Wechseln:', hash, '| Ansicht:', await ansicht(page));
    if (!hash) errs.push('Ansichten haben keine eigene Adresse');

    // Fenster öffnen -> Zurück schliesst ZUERST das Fenster
    await page.evaluate(() => document.getElementById('uAvatar').click());
    await page.waitForTimeout(600);
    if (!await page.evaluate(() => document.getElementById('profileModal').classList.contains('show'))) {
      errs.push('Profil-Fenster liess sich nicht oeffnen');
    }
    await page.goBack(); await page.waitForTimeout(700);
    const nachFenster = {
      fensterZu: await page.evaluate(() => !document.getElementById('profileModal').classList.contains('show')),
      ansicht: await ansicht(page),
    };
    console.log('  nach Zurück (Fenster war offen):', JSON.stringify(nachFenster));
    if (!nachFenster.fensterZu) errs.push('Zurueck hat das Fenster nicht geschlossen');
    if (nachFenster.ansicht !== 'view-todos') errs.push('Zurueck hat gleichzeitig die Ansicht gewechselt');

    // Jetzt eine Ansicht pro Geste
    await page.goBack(); await page.waitForTimeout(700);
    const a1 = await ansicht(page);
    await page.goBack(); await page.waitForTimeout(700);
    const a2 = await ansicht(page);
    console.log('  weiter zurück:', a1, '->', a2);
    if (a1 !== 'view-chat') errs.push('Erster Schritt zurueck landet bei ' + a1 + ' statt view-chat');
    if (a2 !== 'view-home') errs.push('Zweiter Schritt zurueck landet bei ' + a2 + ' statt view-home');

    // Die Seite darf dabei nie verlassen werden
    if (await ansicht(page) === 'KEINE') errs.push('Die App wurde verlassen');
    await b.close();
  }

  // ── 3. Verwaltung: Übersicht -> Reiter -> zurück ──
  {
    const { b, page } = await start('stub-chef.js', errs);
    await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
    await page.waitForTimeout(900);

    const uebersicht = await page.evaluate(() => ({
      titel: document.getElementById('chefTitle').textContent,
      kacheln: [...document.querySelectorAll('.chef-card .cc-title')].map(t => t.textContent),
      zahlen: [...document.querySelectorAll('.chef-card .cc-num')]
        .filter(n => n.style.display !== 'none').map(n => n.textContent),
      reiterVersteckt: document.getElementById('chefBar').style.display === 'none',
    }));
    console.log('VERWALTUNG:', JSON.stringify(uebersicht, null, 1));
    // Feste Zahl war ein schlechter Test: sie schlaegt bei jedem neuen
    // Reiter fehl und sagt nichts darueber, ob die Uebersicht STIMMT.
    // Geprueft wird jetzt, dass jeder Reiter aus CHEFTABS genau eine
    // Kachel hat und keine doppelt ist.
    const ERWARTET = ['Überblick', 'Erstellen', 'Team', 'Studios', 'Nachweise',
                      'Auswertung', 'System'];
    ERWARTET.forEach(function (w) {
      if (!uebersicht.kacheln.some(function (k) { return k.indexOf(w) >= 0; })) {
        errs.push('Kachel „' + w + '" fehlt in der Verwaltung');
      }
    });
    if (uebersicht.kacheln.length !== ERWARTET.length) {
      errs.push('Chef sieht ' + uebersicht.kacheln.length + ' Kacheln, erwartet ' +
        ERWARTET.length + ': ' + uebersicht.kacheln.join(', '));
    }
    if (new Set(uebersicht.kacheln).size !== uebersicht.kacheln.length) {
      errs.push('Eine Kachel steht doppelt: ' + uebersicht.kacheln.join(', '));
    }
    if (!uebersicht.reiterVersteckt) errs.push('Reiterleiste ist auf der Uebersicht sichtbar');
    if (!uebersicht.zahlen.length) errs.push('Keine Kachel zeigt eine Zahl');

    await page.evaluate(() => document.querySelector('[data-cgo="system"]').click());
    await page.waitForTimeout(800);
    const drin = await page.evaluate(() => ({
      titel: document.getElementById('chefTitle').textContent,
      kachelnWeg: document.getElementById('chefHome').style.display === 'none',
      zurueckDa: document.getElementById('chefBar').style.display !== 'none',
      paneOffen: !!document.querySelector('.chef-pane[data-cpane="system"]') &&
                 document.querySelector('.chef-pane[data-cpane="system"]').style.display !== 'none',
    }));
    console.log('  in System:', JSON.stringify(drin));
    if (!drin.kachelnWeg) errs.push('Kacheln bleiben sichtbar, obwohl ein Reiter offen ist');
    if (!drin.zurueckDa) errs.push('Kein Zurueck-Knopf im Reiter');
    if (!drin.paneOffen) errs.push('Der Inhalt des Reiters ist nicht sichtbar');

    // Zurück-Geste muss zuerst zur Übersicht führen, nicht aus der Ansicht
    await page.goBack(); await page.waitForTimeout(800);
    console.log('  Zurück-Geste ->', await page.evaluate(() => document.getElementById('chefTitle').textContent),
                '| Ansicht:', await ansicht(page));
    if (await ansicht(page) !== 'view-chef') errs.push('Zurueck verlaesst den Verwaltungsbereich statt zur Uebersicht zu gehen');
    if (await page.evaluate(() => document.getElementById('chefHome').style.display === 'none')) {
      errs.push('Zurueck fuehrt nicht zur Uebersicht');
    }
    await page.screenshot({ path: SP + '/navigation-verwaltung.png' });
    await b.close();
  }

  // ── 4. Startseite: keine Wand aus Nullen, kein doppelter Schnellzugriff ──
  {
    const { b, page } = await start('stub-mitarbeiter.js', errs);
    const home = await page.evaluate(() => {
      const sa = document.querySelector('#view-home .scroll-area');
      const tiles = [...document.querySelectorAll('#homeGrid .home-tile')];
      return {
        bildschirme: +(sa.scrollHeight / sa.clientHeight).toFixed(2),
        kacheln: tiles.map(t => t.querySelector('.hn').textContent + ' ' + t.querySelector('.hl').textContent),
        blass: tiles.filter(t => t.classList.contains('null')).length,
        ersteHatZahl: tiles.length ? +tiles[0].querySelector('.hn').textContent > 0 : false,
        schnellzugriffWeg: !document.getElementById('quickGrid'),
      };
    });
    console.log('STARTSEITE:', JSON.stringify(home, null, 1));
    if (!home.schnellzugriffWeg) errs.push('Der doppelte Schnellzugriff ist noch da');
    if (home.kacheln.length && !home.ersteHatZahl) errs.push('Eine Null steht vor einer echten Zahl');
    if (home.bildschirme > 1.6) errs.push('Startseite ist ' + home.bildschirme + ' Bildschirme lang');
    await b.close();
  }

  console.log('\nFehler:', errs.length ? errs.join('\n  ') : 'keine');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
