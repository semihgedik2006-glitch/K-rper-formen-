/* Bereich 8 – Dokumente: Platz für den Namen, ganze Zeile öffnet,
   Verwaltungs-Aktionen im Blatt, „Als Aufgabe" fragt nach.

   Vorher drückten drei Knöpfe (Öffnen · Als Aufgabe · ✕) den Namen auf eine
   schmale Spalte – „Gerätewartung Anleitung" brach mitten im Wort um. Und
   „Als Aufgabe" verteilte ohne Rückfrage eine Aufgabe an alle 14 Studios. */
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
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-arbeit"]').click());
  await page.waitForTimeout(600);
  const s = await page.$('[data-subview="docs"]');
  if (s) { await s.click(); await page.waitForTimeout(1400); }
  return { b, page };
}

(async () => {
  const errs = [];

  // ══ Mitarbeiter: lesen und öffnen ══
  {
    const { b, page } = await start('stub-mitarbeiter.js', errs);

    const liste = await page.evaluate(() => {
      const sa = document.querySelector('#view-docs .scroll-area');
      const docs = [...document.querySelectorAll('.doc')];
      const namen = [...document.querySelectorAll('.doc-info b')];
      return {
        anzahl: docs.length,
        bildschirme: +(sa.scrollHeight / sa.clientHeight).toFixed(2),
        ersteY: docs[0] ? Math.round(docs[0].getBoundingClientRect().top - sa.getBoundingClientRect().top) + sa.scrollTop : -1,
        hoehen: docs.map(d => Math.round(d.getBoundingClientRect().height)),
        namensBreite: namen.length ? Math.round(namen[0].getBoundingClientRect().width) : 0,
        maxZeilen: Math.max(...namen.map(n => Math.round(n.getBoundingClientRect().height / 22))),
        katEinzeilig: (() => { const r = document.getElementById('docCatRow'); return r ? r.getBoundingClientRect().height < 55 : false; })(),
        mehrKnoepfe: document.querySelectorAll('.doc-mehr').length,
        zeileKlickbar: docs[0] ? docs[0].getAttribute('role') === 'button' : false,
      };
    });
    console.log('LISTE:', JSON.stringify(liste));
    if (liste.namensBreite < 240) errs.push('Namensspalte nur ' + liste.namensBreite + ' px breit');
    if (liste.maxZeilen > 2) errs.push('Ein Name braucht ' + liste.maxZeilen + ' Zeilen');
    if (!liste.katEinzeilig) errs.push('Die Kategorie-Leiste bricht um');
    if (liste.mehrKnoepfe) errs.push('Mitarbeiter sieht ' + liste.mehrKnoepfe + ' Verwaltungs-Menues');
    if (!liste.zeileKlickbar) errs.push('Die Zeile ist nicht als Knopf ausgezeichnet');
    if (liste.bildschirme > 1.3) errs.push('Die Seite ist ' + liste.bildschirme + ' Bildschirme lang');

    // Ein Tipp auf die Zeile muss die Datei holen
    await page.evaluate(() => { window.__geholt = []; });
    await page.evaluate(() => document.querySelector('.doc').click());
    await page.waitForTimeout(700);
    const toastText = await page.evaluate(() => (document.querySelector('.toast') || {}).textContent || '');
    console.log('nach Tipp auf die Zeile:', JSON.stringify(toastText.slice(0, 40)));
    if (!/öffnet|Datei/i.test(toastText)) errs.push('Der Tipp auf die Zeile oeffnet nichts: ' + toastText);

    await page.screenshot({ path: SP + '/docs-mitarbeiter.png' });
    await b.close();
  }

  // ══ Chef: Aktionsblatt und Rückfragen ══
  {
    const { b, page } = await start('stub-chef.js', errs);

    const chef = await page.evaluate(() => {
      const d = document.querySelector('.doc');
      return {
        mehrDa: !!d.querySelector('.doc-mehr'),
        mehrHoehe: Math.round(d.querySelector('.doc-mehr').getBoundingClientRect().height),
        alteKnoepfe: document.querySelectorAll('.doc-task,.doc-del').length,
        hochladenZu: (() => { const c = document.getElementById('docUploadCard'); return c.getBoundingClientRect().height < 100; })(),
      };
    });
    console.log('CHEF:', JSON.stringify(chef));
    if (!chef.mehrDa) errs.push('Kein Verwaltungs-Menue am Dokument');
    if (chef.mehrHoehe < 44) errs.push('Das Menue ist nur ' + chef.mehrHoehe + ' px hoch');
    if (chef.alteKnoepfe) errs.push('Die alten Knoepfe sind noch da: ' + chef.alteKnoepfe);

    await page.evaluate(() => document.querySelector('.doc-mehr').click());
    await page.waitForTimeout(500);
    const blatt = await page.evaluate(() => {
      const acts = [...document.querySelectorAll('#dbActs .ms-act')];
      return {
        offen: document.getElementById('docSheet').classList.contains('show'),
        titel: document.getElementById('dbWho').textContent,
        eintraege: acts.map(a => a.textContent.trim()),
        kleinste: acts.length ? Math.min(...acts.map(a => Math.round(a.getBoundingClientRect().height))) : 0,
      };
    });
    console.log('BLATT:', JSON.stringify(blatt));
    if (!blatt.offen) errs.push('Das Dokument-Blatt oeffnet nicht');
    if (blatt.kleinste < 44) errs.push('Eintrag nur ' + blatt.kleinste + ' px hoch');
    ['Aufgabe', 'Löschen'].forEach(w => {
      if (!blatt.eintraege.some(e => e.indexOf(w) >= 0)) errs.push(w + ' fehlt im Blatt');
    });

    // „Als Aufgabe" muss nachfragen und alle Studios nennen
    let frage = '';
    page.on('dialog', async d => { frage = d.message(); await d.dismiss(); });
    await page.evaluate(() => document.querySelector('[data-dba="aufgabe"]').click());
    await page.waitForTimeout(600);
    console.log('RÜCKFRAGE:', JSON.stringify(frage.replace(/\s+/g, ' ').slice(0, 80)));
    if (!frage) errs.push('„Als Aufgabe" verteilt ohne Rueckfrage');
    if (frage && !/14 Studios/.test(frage)) errs.push('Die Rueckfrage nennt die Anzahl nicht: ' + frage);

    await page.screenshot({ path: SP + '/docs-chef.png' });
    await b.close();
  }

  console.log('\nFehler:', errs.length ? errs.join('\n  ') : 'keine');
})().catch(e => { console.error(e); process.exit(1); });
