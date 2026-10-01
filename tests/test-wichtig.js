/* ══════════════════════════════════════════════════════════════════════
   WICHTIG — BITTE BESTÄTIGEN (Runde 135)

   IDEEN.md: „Für den seltenen Fall, dass etwas wirklich alle sofort
   erreichen muss: Ankündigung, die oben stehen bleibt, bis jede Person
   sie bestätigt hat. Der Chef sieht, wer noch fehlt."

   1. Die Leitung setzt beim Schreiben den Haken „Wichtig"; der Aushang
      trägt das Abzeichen, und die Zählung heisst „bestätigt", nicht
      „gelesen".
   2. Bei der gemeinten Person steht oben eine Leiste — OHNE
      Schliessknopf, in jedem Bereich.
   3. „Lesen" führt zum Aushang; „Gelesen und verstanden" trägt die
      Person ein, die Leiste verschwindet, am Aushang steht „bestätigt".
   4. Gegenproben: ein normaler Aushang macht keine Leiste und keinen
      Knopf; ein wichtiger für ein anderes Studio auch nicht.
   5. Fingerziele ≥ 44 × 44 per Hit-Test bei 320/390/430/820/1280/1440/
      1920, normal und kompakt; kein waagerechtes Scrollen.

   Die Demo legt keinen wichtigen Aushang an — eine dauerhafte Leiste
   verschöbe jede Startseiten-Prüfung. Der Test schreibt ihn selbst in
   die Demo-Datenbank, so wie der Server ihn ausliefern würde.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 200) : '')); }
}
const TREFFER = (el) => {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0 };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--;
  while (u < innerHeight && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--;
  while (re < innerWidth && trifft(re + 1, cy)) re++;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1) };
};
const ANN = 'firmen/koerperformen/announcements';

async function oeffne(b, rolle, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  p.on('dialog', d => d.accept());
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
function anlegen(p, id, felder) {
  return p.evaluate(([pfad, id, f]) => {
    const d = Object.assign({ uid: 'chef-x', from: 'Geschäftsführung', target: 'all',
      ts: Date.now(), readBy: [] }, f);
    return firebase.firestore().collection(pfad).doc(id).set(d);
  }, [ANN, id, felder]).then(() => p.waitForTimeout(700));
}
function leiste(p) {
  return p.evaluate(() => {
    const l = document.getElementById('wichtigLeiste');
    return { da: !!l && !l.hidden && !!l.offsetParent, text: l ? l.textContent.replace(/\s+/g, ' ').trim() : '',
             zu: !!(l && l.querySelector('.ml-zu')) };
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── Die Leitung schreibt ──');
  {
    const p = await oeffne(b, 'chef', 1440, 900);
    const r = await p.evaluate(async () => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      const g = document.querySelector('.mobnav [data-group="g-chef"], #side [data-group="g-chef"]');
      if (g) { g.click(); await w(700); }
      const k = document.querySelector('#chefHome [data-cgo="erstellen"]'); if (k) { k.click(); await w(900); }
      const haken = document.getElementById('bcWichtig');
      const karte = haken && haken.closest('.card.fold');
      if (karte && karte.classList.contains('zu')) { karte.querySelector('.fold-head').click(); await w(500); }
      if (!haken) return { haken: false };
      document.getElementById('bcText').value = 'Ab sofort: Elektroden nach JEDEM Training tauschen.';
      haken.click(); await w(100);
      const markiert = document.getElementById('bcWichtigWrap').classList.contains('on');
      document.getElementById('bcSend').click(); await w(1200);
      return { haken: true, markiert, danach: haken.checked };
    });
    pruefe('am Formular gibt es den Haken „Wichtig"', r.haken);
    pruefe('… angetippt ist die Zeile markiert', r.markiert);
    pruefe('… nach dem Senden ist er wieder aus (nicht aus Versehen beim nächsten)', r.danach === false);
    const gespeichert = await p.evaluate((pfad) => firebase.firestore().collection(pfad).get().then(sn =>
      sn.docs.map(d => d.data()).filter(d => /Elektroden nach JEDEM/.test(d.text || ''))[0] || null), ANN);
    pruefe('gespeichert mit wichtig: true und leerer Liste', !!gespeichert && gespeichert.wichtig === true &&
      Array.isArray(gespeichert.bestaetigtVon) && gespeichert.bestaetigtVon.length === 0, JSON.stringify(gespeichert));
    await p.evaluate(async () => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      showView('ann'); await w(800);
    }).catch(async () => {
      await p.evaluate(() => { const a = document.querySelector('[data-view="ann"], [data-subview="ann"]'); if (a) a.click(); });
    });
    await p.waitForTimeout(800);
    const anz = await p.evaluate(() => {
      const el = [...document.querySelectorAll('#annArea .ann')].find(x => /Elektroden nach JEDEM/.test(x.textContent));
      return el ? { wichtig: el.classList.contains('wichtig'), abz: !!el.querySelector('.ann-wichtig'),
                    zahl: (el.querySelector('.ann-read') || {}).textContent || '',
                    knopf: !!el.querySelector('[data-annok]') } : null;
    });
    pruefe('der Aushang trägt „Wichtig"', !!anz && anz.wichtig && anz.abz, JSON.stringify(anz));
    pruefe('die Leitung sieht „… bestätigt", nicht „gelesen"', !!anz && /bestätigt/.test(anz.zahl) && !/gelesen/.test(anz.zahl), anz && anz.zahl);
    pruefe('die Geschäftsführung bekommt selbst keinen Bestätigen-Knopf', !!anz && !anz.knopf);
    pruefe('ohne Skriptfehler (Leitung)', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── Bei der Mitarbeiterin ──');
  const p = await oeffne(b, 'mitarbeiter', 390, 844);
  let l = await leiste(p);
  pruefe('ohne wichtigen Aushang keine Leiste', !l.da, l.text);
  await anlegen(p, 'w-normal', { text: 'Teamabend am Freitag.' });
  l = await leiste(p);
  pruefe('GEGENPROBE ein normaler Aushang macht keine Leiste', !l.da, l.text);
  await anlegen(p, 'w-fremd', { text: 'Nur für ein anderes Studio.', target: 'studio-0', wichtig: true, bestaetigtVon: [] });
  l = await leiste(p);
  pruefe('GEGENPROBE ein wichtiger für ein ANDERES Studio auch nicht', !l.da, l.text);
  await anlegen(p, 'w-echt', { text: 'Neue Hygieneregel: Elektroden nach jedem Training tauschen.', wichtig: true, bestaetigtVon: ['u5'] });
  l = await leiste(p);
  pruefe('ein wichtiger für alle: oben steht die Leiste', l.da && /Wichtig/.test(l.text) && /Hygieneregel/.test(l.text), l.text);
  pruefe('… ohne Schliessknopf', !l.zu);
  const ueberall = await p.evaluate(async () => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    const t = document.querySelector('.mobnav [data-group="g-ich"]'); if (t) { t.click(); await w(600); }
    const l = document.getElementById('wichtigLeiste');
    return !l.hidden && !!l.offsetParent;
  });
  pruefe('… und sie bleibt in einem anderen Bereich stehen', ueberall);

  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    await p.setViewportSize({ width: w, height: h });
    await p.waitForTimeout(250);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const m = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return { t: T(document.getElementById('wichtigAuf')), quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      pruefe(w + ' px ' + dichte + ': „Lesen" trifft ' + m.t.w + '×' + m.t.h + ', nichts ragt hinaus',
        m.t.w >= 44 && m.t.h >= 44 && m.quer <= 0, JSON.stringify(m));
    }
  }
  await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
  await p.setViewportSize({ width: 390, height: 844 });

  await p.evaluate(() => document.getElementById('wichtigAuf').click());
  await p.waitForTimeout(900);
  const dort = await p.evaluate(() => {
    const el = document.querySelector('#annArea [data-annid="w-echt"]');
    const r = el ? el.getBoundingClientRect() : null;
    return { da: !!el, imBild: !!r && r.top >= 0 && r.bottom <= innerHeight + 2,
             knopf: !!(el && el.querySelector('[data-annok]')), sicht: (document.querySelector('.view.show') || {}).id };
  });
  pruefe('„Lesen" führt zum Aushang, und er steht im Bild', dort.da && dort.imBild, JSON.stringify(dort));
  pruefe('… mit „Gelesen und verstanden"', dort.knopf);
  pruefe('GEGENPROBE der normale Aushang hat keinen solchen Knopf',
    await p.evaluate(() => !document.querySelector('#annArea [data-annid="w-normal"] [data-annok]')));
  const lesenAllein = await p.evaluate((pfad) => firebase.firestore().collection(pfad).doc('w-echt').get()
    .then(d => d.data()), ANN);
  pruefe('das Öffnen allein bestätigt nichts', (lesenAllein.bestaetigtVon || []).indexOf('demo-ich') < 0,
    JSON.stringify(lesenAllein.bestaetigtVon));

  for (const [w, h] of [[320, 568], [390, 844], [1280, 800], [1920, 1080]]) {
    await p.setViewportSize({ width: w, height: h });
    await p.waitForTimeout(250);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const m = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const el = document.querySelector('[data-annok]');
        el.scrollIntoView({ block: 'center' });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return T(el);
      }, TREFFER.toString());
      pruefe(w + ' px ' + dichte + ': „Gelesen und verstanden" trifft ' + m.w + '×' + m.h, m.w >= 44 && m.h >= 44);
    }
  }
  await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
  await p.setViewportSize({ width: 390, height: 844 });

  await p.evaluate(() => document.querySelector('[data-annok="w-echt"]').click());
  await p.waitForTimeout(1000);
  const nach = await p.evaluate((pfad) => firebase.firestore().collection(pfad).doc('w-echt').get().then(d => ({
    daten: d.data(),
    fertig: (document.querySelector('#annArea [data-annid="w-echt"] .ann-ok-fertig') || {}).textContent || '',
    knopf: !!document.querySelector('#annArea [data-annid="w-echt"] [data-annok]')
  })), ANN);
  pruefe('bestätigt: eingetragen ist genau die eigene Kennung, dazu „gelesen"',
    JSON.stringify(nach.daten.bestaetigtVon) === JSON.stringify(['u5', 'demo-ich']) &&
    (nach.daten.readBy || []).indexOf('demo-ich') >= 0, JSON.stringify(nach.daten));
  pruefe('… am Aushang steht „Von dir bestätigt", der Knopf ist weg', /bestätigt/.test(nach.fertig) && !nach.knopf, nach.fertig);
  l = await leiste(p);
  pruefe('… und die Leiste ist weg', !l.da, l.text);
  pruefe('ohne Skriptfehler (Mitarbeiterin)', !p._fehler.length, p._fehler.join(' | '));
  await p.close();

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Wichtig — bitte bestätigen: die Leiste bleibt, bis bestätigt ist — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
