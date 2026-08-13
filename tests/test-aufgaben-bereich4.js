/* Bereich 4 – Aufgaben: Platz bis zur ersten Aufgabe, Dringlichkeit zuerst,
   Aktionsblatt, ehrlicher Leerzustand, Anlegen ohne Umweg.

   Gemessen wird der Platz bis zur ersten Aufgabe, die Reihenfolge (was
   überfällig ist, steht oben) und dass der leere Bereich den aktiven
   Filter kennt, statt „gar keine Aufgaben" zu behaupten. */
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
  await page.waitForTimeout(1100);
  return { b, page };
}

(async () => {
  const errs = [];

  // ══ Chef ══
  {
    const { b, page } = await start('stub-chef.js', errs);

    const platz = await page.evaluate(() => {
      const sa = document.querySelector('#view-todos .scroll-area');
      const first = document.querySelector('.todo.overdue');
      return {
        tagesKarteWeg: !document.getElementById('todayCard'),
        kopf: Math.round(document.querySelector('#view-todos .view-head').getBoundingClientRect().height),
        ersteUeberfaellig: first ? Math.round(first.getBoundingClientRect().top - sa.getBoundingClientRect().top) : -1,
        ersteAufgabeIstUeberfaellig: !!(document.querySelector('.todo') || {}).classList &&
          document.querySelector('.todo').classList.contains('overdue'),
        erstesStudio: (document.querySelector('.studio-head') || {}).textContent || '',
        chipZahlen: [...document.querySelectorAll('.chip-num')].map(n => n.parentElement.dataset.tfilter + '=' + n.textContent),
      };
    });
    console.log('CHEF PLATZ:', JSON.stringify(platz));
    if (!platz.tagesKarteWeg) errs.push('Die doppelte Tagesuebersicht ist noch da');
    if (platz.ersteUeberfaellig < 0) errs.push('Keine ueberfaellige Aufgabe gefunden');
    if (platz.ersteUeberfaellig > 300) errs.push('Erste ueberfaellige erst bei y=' + platz.ersteUeberfaellig);
    if (!platz.ersteAufgabeIstUeberfaellig) errs.push('Die ueberfaellige Aufgabe steht nicht oben');
    if (!/Hürth/.test(platz.erstesStudio)) errs.push('Studio mit Ueberfaelligem steht nicht vorn: ' + platz.erstesStudio);
    if (!platz.chipZahlen.length) errs.push('Keine Zahlen an den Filtern');

    // Aktionsblatt
    const alteSymbole = await page.evaluate(() => document.querySelectorAll('.t-snooze,.t-del,.t-photo-add').length);
    if (alteSymbole) errs.push('Alte Mini-Symbole an der Aufgabe: ' + alteSymbole);

    await page.evaluate(() => document.querySelector('.t-mehr').click());
    await page.waitForTimeout(450);
    const blatt = await page.evaluate(() => {
      const acts = [...document.querySelectorAll('#tbActs .ms-act')];
      return {
        offen: document.getElementById('todoSheet').classList.contains('show'),
        titel: document.getElementById('tbWho').textContent,
        wo: document.getElementById('tbWhere').textContent,
        eintraege: acts.map(a => a.textContent.trim()),
        kleinste: acts.length ? Math.min(...acts.map(a => Math.round(a.getBoundingClientRect().height))) : 0,
      };
    });
    console.log('AKTIONSBLATT:', JSON.stringify(blatt, null, 1));
    if (!blatt.offen) errs.push('Das Aufgaben-Blatt oeffnet nicht');
    if (blatt.kleinste < 44) errs.push('Eintrag nur ' + blatt.kleinste + ' px hoch');
    ['Bearbeiten', 'Löschen'].forEach(w => {
      if (!blatt.eintraege.some(e => e.indexOf(w) >= 0)) errs.push(w + ' fehlt im Blatt');
    });
    if (!blatt.eintraege.some(e => /Tag später/.test(e))) errs.push('Frist verschieben fehlt bei faelliger Aufgabe');

    // Frist verschieben darf keinen prompt() mehr brauchen
    let promptGerufen = false;
    page.on('dialog', async d => { promptGerufen = true; await d.dismiss(); });
    await page.evaluate(() => document.querySelector('[data-tba="plus1"]').click());
    await page.waitForTimeout(500);
    console.log('nach „einen Tag später": Blatt zu =',
      await page.evaluate(() => !document.getElementById('todoSheet').classList.contains('show')),
      '| prompt =', promptGerufen);
    if (promptGerufen) errs.push('Frist verschieben fragt weiterhin per prompt()');

    // Ehrlicher Leerzustand
    await page.evaluate(() => document.querySelector('[data-tfilter="meine"]').click());
    await page.waitForTimeout(450);
    const leer = await page.evaluate(() => document.getElementById('todoArea').textContent.replace(/\s+/g, ' ').trim());
    console.log('LEER (Filter „Für mich"):', JSON.stringify(leer.slice(0, 90)));
    if (/Erstelle welche im Chef-Bereich/.test(leer)) errs.push('Der Leertext behauptet weiterhin, es gaebe keine Aufgaben');
    if (!/tippe auf/.test(leer)) errs.push('Der Leertext nennt keinen Ausweg');

    // Anlegen ohne Umweg
    await page.evaluate(() => document.querySelector('[data-tfilter="alle"]').click());
    await page.waitForTimeout(300);
    const knopfDa = await page.evaluate(() => {
      const k = document.getElementById('todoNew');
      const h2 = document.getElementById('todoTitle');
      if (!k) return null;
      const rk = k.getBoundingClientRect(), rh = h2.getBoundingClientRect();
      return {
        sichtbar: k.style.display !== 'none',
        hoehe: Math.round(rk.height),
        ueberlappt: !(rk.left >= rh.right || rk.right <= rh.left),
      };
    });
    console.log('„+ Neu":', JSON.stringify(knopfDa));
    if (!knopfDa || !knopfDa.sichtbar) errs.push('Kein Anlegen-Knopf auf der Aufgabenseite');
    if (knopfDa && knopfDa.ueberlappt) errs.push('Der Anlegen-Knopf liegt ueber dem Titel');
    if (knopfDa && knopfDa.hoehe < 38) errs.push('Anlegen-Knopf nur ' + knopfDa.hoehe + ' px hoch');

    await page.evaluate(() => document.getElementById('todoNew').click());
    await page.waitForTimeout(900);
    const gelandet = await page.evaluate(() => ({
      ansicht: (document.querySelector('.view.show') || {}).id,
      feldDa: !!document.getElementById('ntTitle'),
      reiterOffen: (document.querySelector('.chef-pane[data-cpane="erstellen"]') || {}).style.display !== 'none',
    }));
    console.log('nach „+ Neu":', JSON.stringify(gelandet));
    if (gelandet.ansicht !== 'view-chef') errs.push('„+ Neu" landet bei ' + gelandet.ansicht);
    if (!gelandet.reiterOffen) errs.push('Der Reiter „Erstellen" ist nicht offen');

    await page.screenshot({ path: SP + '/aufgaben-chef.png' });
    await b.close();
  }

  // ══ Mitarbeiter ══
  {
    const { b, page } = await start('stub-mitarbeiter.js', errs);
    const ma = await page.evaluate(() => {
      const sa = document.querySelector('#view-todos .scroll-area');
      const first = document.querySelector('.todo');
      return {
        bildschirme: +(sa.scrollHeight / sa.clientHeight).toFixed(2),
        ersteAufgabe: Math.round(first.getBoundingClientRect().top - sa.getBoundingClientRect().top),
        anlegenVersteckt: document.getElementById('todoNew').style.display === 'none',
        kamera: document.querySelectorAll('.t-cam').length,
        mehr: document.querySelectorAll('.t-mehr').length,
      };
    });
    console.log('MITARBEITER:', JSON.stringify(ma));
    if (!ma.anlegenVersteckt) errs.push('Mitarbeiter sieht den Anlegen-Knopf');
    if (ma.ersteAufgabe > 260) errs.push('Erste Aufgabe erst bei y=' + ma.ersteAufgabe);
    if (!ma.kamera) errs.push('Kein Foto-Knopf an der Aufgabe');

    // Ohne Foto und ohne Verwaltungsrechte stünde hinter „⋯" nur die Kamera,
    // die eine Zeile darüber schon sichtbar ist – also gibt es kein „⋯".
    if (ma.mehr) errs.push('Mitarbeiter sieht ein leeres „Mehr"-Menue: ' + ma.mehr);

    await page.screenshot({ path: SP + '/aufgaben-mitarbeiter.png' });
    await b.close();
  }

  console.log('\nFehler:', errs.length ? errs.join('\n  ') : 'keine');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
