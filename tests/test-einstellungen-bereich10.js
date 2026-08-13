/* Bereich 10 – Einstellungen: Speichern erreichbar, Reiter lesbar,
   Aussehen nach Häufigkeit geordnet.

   Vorher lag „Speichern" ganz unten in einem Fenster, das scrollt: Namen
   ändern, dann 124 Pixel weiterscrollen, um zu speichern. Und der vierte
   Reiter („Nachweise") wurde am rechten Rand abgeschnitten. */
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
  await page.evaluate(() => document.getElementById('uAvatar').click());
  await page.waitForTimeout(900);
  return { b, page };
}

const speichernImBild = page => page.evaluate(() => {
  const box = document.querySelector('#profileModal .pm-box');
  const s = document.getElementById('pmSave');
  if (s.offsetParent === null) return 'versteckt';
  const rb = box.getBoundingClientRect(), rs = s.getBoundingClientRect();
  return rs.bottom <= rb.bottom + 2 && rs.top >= rb.top - 2;
});

(async () => {
  const errs = [];
  const { b, page } = await start('stub-mitarbeiter.js', errs);

  // ── Reiter passen nebeneinander ──
  const reiter = await page.evaluate(() => {
    const bar = document.querySelector('#profileModal .pm-tabs');
    const t = [...bar.querySelectorAll('.pm-tab')];
    return {
      anzahl: t.length,
      ueberlauf: bar.scrollWidth > bar.clientWidth + 1,
      hoehe: Math.round(bar.getBoundingClientRect().height),
      letzterGanzImBild: t.length
        ? t[t.length - 1].getBoundingClientRect().right <= bar.getBoundingClientRect().right + 1
        : false,
      /* Frueher trug jeder Reiter ein Emoji, das auf schmalen Geraeten per
         CSS ausgeblendet wurde, damit die vier nebeneinander passen. Die
         Emoji sind weg — geprueft wird jetzt, dass keins zurueckkommt und
         die Reiter trotzdem passen. */
      symbole: bar.querySelectorAll('.t-ico, .sym').length,
    };
  });
  console.log('REITER:', JSON.stringify(reiter));
  if (reiter.anzahl !== 4) errs.push('Es gibt ' + reiter.anzahl + ' statt 4 Reiter');
  if (reiter.ueberlauf) errs.push('Die Reiterleiste laeuft ueber');
  if (!reiter.letzterGanzImBild) errs.push('Der letzte Reiter ist abgeschnitten');
  if (reiter.symbole) errs.push('Die Reiter tragen wieder ' + reiter.symbole +
    ' Symbol(e) — auf 390 Pixeln passen dann keine vier mehr nebeneinander');

  // ── Speichern bleibt erreichbar, egal wie weit man scrollt ──
  console.log('SPEICHERN oben:', await speichernImBild(page));
  if (await speichernImBild(page) !== true) errs.push('„Speichern" ist oben nicht im Bild');

  await page.evaluate(() => { document.querySelector('#profileModal .pm-box').scrollTop = 400; });
  await page.waitForTimeout(350);
  const nachScroll = await speichernImBild(page);
  console.log('SPEICHERN nach Scrollen:', nachScroll);
  if (nachScroll !== true) errs.push('„Speichern" verschwindet beim Scrollen');

  // Der Knopf darf nichts verdecken, was man noch braucht
  const ueberdeckt = await page.evaluate(() => {
    const s = document.getElementById('pmSave').getBoundingClientRect();
    const farben = document.getElementById('pmColors');
    if (!farben) return false;
    const f = farben.getBoundingClientRect();
    return f.bottom > s.top && f.top < s.bottom;
  });
  if (ueberdeckt) console.log('Hinweis: der Knopf liegt über der Farbwahl (beim Scrollen normal)');

  // ── Aussehen: Hell/Dunkel steht oben ──
  await page.evaluate(() => document.querySelector('[data-pmtab="aussehen"]').click());
  await page.waitForTimeout(500);
  const aus = await page.evaluate(() => {
    const pane = document.getElementById('pmPaneAussehen');
    const labels = [...pane.querySelectorAll('label')].map(l => l.textContent.trim());
    const box = document.querySelector('#profileModal .pm-box');
    const th = document.getElementById('thOpts').getBoundingClientRect();
    const bb = box.getBoundingClientRect();
    return {
      reihenfolge: labels,
      hellDunkelOhneScrollen: th.top >= bb.top - 2 && th.bottom <= bb.bottom + 2,
      speichernVersteckt: document.getElementById('pmSave').offsetParent === null,
    };
  });
  console.log('AUSSEHEN:', JSON.stringify(aus));
  if (!/Hell/.test(aus.reihenfolge[0])) errs.push('Oben steht ' + aus.reihenfolge[0] + ' statt Hell/Dunkel');
  if (!aus.hellDunkelOhneScrollen) errs.push('Hell/Dunkel ist ohne Scrollen nicht erreichbar');
  if (!aus.speichernVersteckt) errs.push('„Speichern" steht im Aussehen-Reiter, obwohl sofort uebernommen wird');

  // ── Meldungen und Nachweise laden ohne Fehler ──
  for (const t of ['melden', 'nachweise']) {
    await page.evaluate(x => document.querySelector('[data-pmtab="' + x + '"]').click(), x = t);
    await page.waitForTimeout(600);
    const inhalt = await page.evaluate(() => {
      const pane = [...document.querySelectorAll('#profileModal div[id^="pmPane"]')].find(p => p.offsetParent !== null);
      return { id: pane.id, text: pane.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) };
    });
    console.log(' ' + t + ':', JSON.stringify(inhalt));
    if (/Wird geladen/.test(inhalt.text)) errs.push(t + ' bleibt beim Laden haengen');
  }

  await page.screenshot({ path: SP + '/einstellungen.png' });
  await b.close();

  // ── Chef: Löschknopf am Nachweis ist groß genug ──
  {
    const { b: b2, page: p2 } = await start('stub-chef.js', errs);
    await p2.evaluate(() => document.querySelector('[data-pmtab="nachweise"]').click());
    await p2.waitForTimeout(800);
    const del = await p2.evaluate(() => {
      const x = document.querySelector('#pmCerts .cert-del');
      if (!x) return null;
      const r = x.getBoundingClientRect();
      return { breite: Math.round(r.width), hoehe: Math.round(r.height) };
    });
    console.log('CHEF Loeschknopf am Nachweis:', JSON.stringify(del));
    if (del && del.hoehe < 44) errs.push('Der Loeschknopf ist nur ' + del.hoehe + ' px hoch');
    await b2.close();
  }

  console.log('\nFehler:', errs.length ? errs.join('\n  ') : 'keine');
  process.exit((errs || fehler).length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
