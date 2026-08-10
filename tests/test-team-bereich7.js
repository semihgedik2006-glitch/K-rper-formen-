/* Bereich 7 – Team: lesen vor schreiben, heute im Bild, wartende Anträge.

   Vorher stand auf drei von vier Reitern das Eingabeformular VOR der Liste –
   bei den Abwesenheiten 536 Pixel hoch, die Liste begann erst bei Pixel 647.
   Und offene Urlaubsanträge sah die Verwaltung nur im gerade geöffneten
   Studio. */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function start(stub, errs) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/' + stub });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await page.mouse.click(195, 400).catch(() => {});
  await page.waitForTimeout(2700);
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-team"]').click());
  await page.waitForTimeout(1700);
  return { b, page };
}

// Auf einem Reiter: wo beginnt die Liste, und steht das Formular dahinter?
const reiterMessen = (page, listeId) => page.evaluate(id => {
  const sa = document.querySelector('#view-team .scroll-area');
  const liste = document.getElementById(id);
  // Gemessen wird das EINGABEFELD selbst, nicht die Karte drumherum: bei der
  // Uebergabe liegen Liste und Feld in derselben Karte.
  const pane = [...document.querySelectorAll('#view-team > .scroll-area > div[id^="teamPane"]')]
    .find(p => p.style.display !== 'none');
  const feld = pane ? pane.querySelector('input,textarea') : null;
  const karte = feld ? feld.closest('.card') : null;
  return {
    listeY: Math.round(liste.getBoundingClientRect().top - sa.getBoundingClientRect().top) + sa.scrollTop,
    eintraege: liste.children.length,
    feldY: feld ? Math.round(feld.getBoundingClientRect().top - sa.getBoundingClientRect().top) + sa.scrollTop : -1,
    karteZu: karte ? karte.classList.contains('zu') : false,
  };
}, listeId);

(async () => {
  const errs = [];

  // ══ Mitarbeiter: lesen vor schreiben ══
  {
    const { b, page } = await start('stub-mitarbeiter.js', errs);

    // Schichtplan: heute muss vollständig im Bild sein
    const plan = await page.evaluate(() => {
      const sa = document.querySelector('#view-team .scroll-area');
      const h = document.querySelector('#shiftGrid .shift-day.today');
      const f = sa.getBoundingClientRect();
      return {
        heuteDa: !!h,
        heuteGanzImBild: h ? (h.getBoundingClientRect().bottom <= f.bottom + 1 &&
                              h.getBoundingClientRect().top >= f.top - 1) : false,
        tage: document.querySelectorAll('#shiftGrid .shift-day').length,
        daueErklaerung: /Wer arbeitet wann/.test(document.getElementById('teamPaneSchicht').textContent),
      };
    });
    console.log('SCHICHTPLAN:', JSON.stringify(plan));
    if (!plan.heuteDa) errs.push('Kein Heute im Schichtplan');
    if (!plan.heuteGanzImBild) errs.push('Der heutige Tag liegt nicht vollstaendig im Bild');
    if (plan.tage !== 7) errs.push('Der Plan zeigt ' + plan.tage + ' statt 7 Tage');
    if (plan.daueErklaerung) errs.push('Die Dauererklaerung ueber dem Plan ist zurueck');

    for (const [tab, liste] of [['abwesend', 'absList'], ['uebergabe', 'hoList'], ['brett', 'bbList']]) {
      await page.evaluate(x => document.querySelector('[data-teamtab="' + x + '"]').click(), tab);
      await page.waitForTimeout(600);
      const m = await reiterMessen(page, liste);
      console.log('REITER ' + tab + ':', JSON.stringify(m));
      if (!m.eintraege) errs.push(tab + ': keine Eintraege in der Liste');
      if (m.listeY > 260) errs.push(tab + ': die Liste beginnt erst bei y=' + m.listeY);
      // Ein zugeklapptes Formular hat kein sichtbares Feld – das ist in Ordnung.
      if (m.feldY >= 0 && !m.karteZu && m.feldY < m.listeY) {
        errs.push(tab + ': das Eingabefeld steht vor der Liste (' + m.feldY + ' < ' + m.listeY + ')');
      }
    }

    // Die Melde-Karte muss zugeklappt starten und sich öffnen lassen
    await page.evaluate(() => document.querySelector('[data-teamtab="abwesend"]').click());
    await page.waitForTimeout(500);
    const falten = await page.evaluate(() => {
      const k = document.querySelector('[data-fold="abwmelden"]');
      const vorher = Math.round(k.getBoundingClientRect().height);
      k.querySelector('h3').click();
      return { vorher: vorher, karte: !!k };
    });
    await page.waitForTimeout(500);
    const offen = await page.evaluate(() => Math.round(document.querySelector('[data-fold="abwmelden"]').getBoundingClientRect().height));
    console.log('MELDEN aufklappen:', falten.vorher, '→', offen);
    if (falten.vorher > 120) errs.push('Die Melde-Karte startet aufgeklappt (' + falten.vorher + ' px)');
    if (offen <= falten.vorher) errs.push('Die Melde-Karte laesst sich nicht aufklappen');

    const wartetWeg = await page.evaluate(() => document.getElementById('teamWartet').style.display === 'none');
    if (!wartetWeg) errs.push('Mitarbeiter sieht die Antrags-Uebersicht');

    await page.screenshot({ path: SP + '/team-mitarbeiter.png' });
    await b.close();
  }

  // ══ Chef: wartende Anträge über alle Studios ══
  {
    const { b, page } = await start('stub-chef.js', errs);

    const wartet = await page.evaluate(() => {
      const w = document.getElementById('teamWartet');
      const k = [...w.querySelectorAll('.dev-wo')];
      return {
        sichtbar: w.style.display !== 'none' && w.getBoundingClientRect().height > 0,
        studios: k.map(x => x.textContent.trim()),
        hoehe: k.length ? Math.round(k[0].getBoundingClientRect().height) : 0,
        offenesStudio: document.getElementById('teamStudio').selectedOptions[0].textContent,
      };
    });
    console.log('WARTET:', JSON.stringify(wartet));
    if (!wartet.sichtbar) errs.push('Die Uebersicht „Wartet auf deine Entscheidung" fehlt');
    if (!wartet.studios.some(s => /Hürth/.test(s))) errs.push('Huerth fehlt: ' + JSON.stringify(wartet.studios));
    if (wartet.hoehe < 40) errs.push('Der Knopf ist nur ' + wartet.hoehe + ' px hoch');

    // Antippen: Studio wechseln UND auf den Abwesenheits-Reiter springen
    await page.evaluate(() => document.querySelector('#teamWartet .dev-wo').click());
    await page.waitForTimeout(1400);
    const danach = await page.evaluate(() => ({
      studio: document.getElementById('teamStudio').selectedOptions[0].textContent,
      reiter: (document.querySelector('[data-teamtab].on') || {}).textContent,
      paneOffen: document.getElementById('teamPaneAbwesend').style.display !== 'none',
      genehmigen: document.querySelectorAll('[data-absok]').length,
    }));
    console.log('nach Antippen:', JSON.stringify(danach));
    if (!/Hürth/.test(danach.studio)) errs.push('Der Studio-Wechsel hat nicht geklappt: ' + danach.studio);
    if (!danach.paneOffen) errs.push('Der Abwesenheits-Reiter ist nicht offen');
    if (!danach.genehmigen) errs.push('Kein Genehmigen-Knopf am offenen Antrag');

    await page.screenshot({ path: SP + '/team-chef.png' });
    await b.close();
  }

  console.log('\nFehler:', errs.length ? errs.join('\n  ') : 'keine');
  process.exit((errs || fehler).length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
