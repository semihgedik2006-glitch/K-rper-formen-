/* ══════════════════════════════════════════════════════════════════════
   MEINE SCHICHT, LISTE + DETAIL AM RECHNER, EINE KARTE (Runde 281) —
   Ideen 11, 12, 19 aus docs/ideen/formi-und-oberflaeche-20.md

   Aus dem Betrieb (25.10.2026): „mach alles davon".

   Geprüft:
   11. Oben auf „Heute" ein Schalter Überblick / Meine Schicht (je ≥ 44,
       bei 820–1920 in beiden Dichten; am Handy steht „Meine Schicht ›"
       unter „Ausserdem", damit keine Kategorie dafür weichen muss).
       „Meine Schicht" zeigt EINE Liste
       für mein Studio: jeder offene Putzpunkt einzeln mit Haken; gemerkt
       nach dem Neuladen; zurück auf Überblick sind die Gruppen wieder da.
   12. Am Rechner (≥ 1100) dockt das Aufgaben-Blatt rechts an: die Liste
       bleibt sichtbar und klickbar (Hit-Test auf eine andere Zeile trifft
       die Zeile, nicht das Blatt), die Beschreibung steht dabei; Esc
       schliesst. Bei 820 bleibt es das Blatt.
   19. Auf „Heute" trägt nur die erste Gruppe Formis schillernde Kante.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const path = require('path');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
async function oeffne(b, w, h, vorher) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  if (vorher) await p.addInitScript(vorher);
  /* Seit Runde 296 hat die Leitung eigene Reiter (Überblick, Meine
     Schicht, Zusammenfassung, test-startseite-leitung.js). Der Schalter
     „Überblick / Meine Schicht" und die Gruppen werden bei den
     Mitarbeitern geprüft. */
  await p.addInitScript({ path: path.join(__dirname, 'stub-mitarbeiter.js') });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(900);
  p._ctx = ctx;
  return p;
}
const zeige = (p, id) => p.evaluate((id) => { history.pushState({ v: id }, '', '#' + id); window.dispatchEvent(new PopStateEvent('popstate', { state: { v: id } })); }, id);
const TREFFER = (el) => {
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0, imBild: false };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--; while (u < innerHeight && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--; while (re < innerWidth && trifft(re + 1, cy)) re++;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1), imBild: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── 11 Meine Schicht ──');
    for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      const p = await oeffne(b, w, h, () => { try { /* nur beim ersten Laden — beim Neuladen soll die Wahl bleiben */ if (!sessionStorage.getItem('erst')) { sessionStorage.setItem('erst', '1'); localStorage.removeItem('kf_heute_modus'); } localStorage.setItem('kf_formi_morgen', new Date().toLocaleDateString('sv-SE')); } catch (e) {} });
      for (const dichte of ['normal', 'kompakt']) {
        if (dichte === 'kompakt') { await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt')); await p.waitForTimeout(200); }
        const k = await p.evaluate((TR) => [...document.querySelectorAll('#heuteListe [data-hmodus]')].map(x => Object.assign({ t: x.textContent, an: x.getAttribute('aria-pressed') }, (eval(TR))(x))), TREFFER.toString());
        /* Bis Runde 294 stand am Handy (< 700) im Überblick nur „Meine
           Schicht ›" unter „Ausserdem" — oben kostete der Schalter eine
           ganze Kategorie. Seit Runde 295 darf „Heute" am Handy scrollen
           (aus dem Betrieb, 29.10.2026: „NUR auf handy ist es auch ok wenn
           man scrollen muss etwas"); der Schalter steht deshalb überall
           oben. Der alte Zweig bleibt für ein Gerät ohne Karten stehen. */
        if (w < 700 && !(await p.evaluate(() => !!document.querySelector('#heuteListe.bereichskarten')))) pruefe(`${w} px ${dichte}: „Meine Schicht" unter „Ausserdem" ${k.map(x => x.w + '×' + x.h).join(', ')}`, k.length === 1 && /Meine Schicht/.test(k[0].t) && k.every(x => x.w >= 44 && x.h >= 44 && x.imBild) && await p.evaluate(() => !!document.querySelector('#heuteListe .heute-rest [data-hmodus="schicht"]')), JSON.stringify(k));
        else pruefe(`${w} px ${dichte}: Schalter ${k.map(x => x.t + ' ' + x.w + '×' + x.h).join(', ')}`, k.length === 2 && k.every(x => x.w >= 44 && x.h >= 44 && x.imBild) && k[0].an === 'true', JSON.stringify(k));
      }
      if (w === 390 || w === 1440) {
        await p.click('#heuteListe [data-hmodus="schicht"]'); await p.waitForTimeout(400);
        const oben = await p.evaluate((TR) => [...document.querySelectorAll('#heuteListe .heute-modus [data-hmodus]')].map(x => Object.assign({ an: x.getAttribute('aria-pressed') }, (eval(TR))(x))), TREFFER.toString());
        pruefe(`${w} px: in „Meine Schicht" steht oben der Schalter zurück (${oben.map(x => x.w + '×' + x.h).join(', ')})`, oben.length === 2 && oben[1].an === 'true' && oben.every(x => x.w >= 44 && x.h >= 44 && x.imBild), JSON.stringify(oben));
        const s = await p.evaluate(() => { const bl = [...document.querySelectorAll('#heuteListe .heute-block')];
          return { bloecke: bl.map(x => x.getAttribute('data-btitel')), putzMitHaken: document.querySelectorAll('#heuteListe [data-hhak="putz"]').length, gemerkt: localStorage.getItem('kf_heute_modus') }; });
        pruefe(`${w} px: „Meine Schicht": ${s.bloecke.join(' | ')}, ${s.putzMitHaken} Putzpunkte einzeln mit Haken`, /^Meine Schicht/.test(s.bloecke[0] || '') && s.putzMitHaken >= 1 && s.gemerkt === 'schicht' && !s.bloecke.some(x => /^(Überfällig|Putzplan)$/.test(x)), JSON.stringify(s));
        await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => !!document.querySelector('#app.show')); await p.waitForTimeout(900);
        pruefe(`${w} px: nach dem Neuladen bleibt „Meine Schicht"`, await p.evaluate(() => /^Meine Schicht/.test((document.querySelector('#heuteListe .heute-block') || {}).getAttribute ? document.querySelector('#heuteListe .heute-block').getAttribute('data-btitel') : '')));
        await p.click('#heuteListe [data-hmodus="ueberblick"]'); await p.waitForTimeout(400);
        pruefe(`${w} px: GEGENPROBE Überblick: die Gruppen sind wieder da`, await p.evaluate(() => [...document.querySelectorAll('#heuteListe .heute-block')].some(x => /Überfällig|Heute|Putzplan/.test(x.getAttribute('data-btitel')))));
      }
      pruefe(`${w} px: ohne Skriptfehler`, !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }

    console.log('\n── 12 Liste + Detail am Rechner ──');
    for (const [w, h, dock] of [[1440, 900, true], [1920, 1080, true], [1280, 800, true], [820, 1180, false]]) {
      const p = await oeffne(b, w, h);
      await zeige(p, 'todos'); await p.waitForTimeout(700);
      const zeilen = p.locator('#todoArea .todo:not(.done) [data-tmehr] >> visible=true');
      if ((await zeilen.count()) < 2) { pruefe(`${w} px: zwei offene Aufgaben zum Prüfen`, false, String(await zeilen.count())); await p._ctx.close(); continue; }
      await zeilen.first().click(); await p.waitForTimeout(500);
      const d = await p.evaluate(() => { const s = document.getElementById('todoSheet'), r = s.querySelector('.ms-card').getBoundingClientRect();
        const z = [...document.querySelectorAll('#todoArea .todo:not(.done)')].filter(x => x.getClientRects().length)[1], q = z.getBoundingClientRect(), t = document.elementFromPoint(q.left + 40, q.top + q.height / 2);
        return { offen: s.classList.contains('show'), dock: s.classList.contains('angedockt'), links: Math.round(r.left), breit: Math.round(r.width), trifftZeile: !!(t && z.contains(t)), rand: getComputedStyle(document.querySelector('.main')).marginRight, mehr: document.getElementById('tbMehr').textContent.length }; });
      if (dock) {
        pruefe(`${w} px: Blatt rechts angedockt (${d.links}+${d.breit}), die Liste daneben bleibt klickbar`, d.offen && d.dock && d.links >= w - 402 && d.trifftZeile && d.rand === '400px', JSON.stringify(d));
        await p.keyboard.press('Escape'); await p.waitForTimeout(250);
        pruefe(`${w} px: Esc schliesst, die Liste hat wieder die volle Breite`, await p.evaluate(() => !document.getElementById('todoSheet').classList.contains('show') && getComputedStyle(document.querySelector('.main')).marginRight === '0px'));
      } else {
        pruefe(`${w} px: GEGENPROBE schmal: das Blatt bleibt ein Blatt`, d.offen && !d.dock, JSON.stringify(d));
      }
      pruefe(`${w} px: ohne Skriptfehler`, !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }

    console.log('\n── 19 Eine Karte mit Kante ──');
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const p = await oeffne(b, w, h);
      /* Runde 295: in den Karten der Mitarbeiter trägt die KARTE die Kante. */
      const k = await p.evaluate(() => [...document.querySelectorAll('#heuteListe.bereichskarten .heute-block, #heuteListe:not(.bereichskarten) .heute-liste')].filter(x => x.getClientRects().length).map(x => (getComputedStyle(x).backgroundImage.match(/gradient/g) || []).length));
      pruefe(`${w} px: nur die erste Gruppe schillert (${k.join(', ')} Verläufe)`, k.length >= 2 && k[0] >= 2 && k.slice(1).every(n => n < 2), JSON.stringify(k));
      await p._ctx.close();
    }
  } finally { await b.close(); }
  console.log(`\n${schlecht ? '✗' : '✓'} Meine Schicht, Detail, eine Karte: ${schlecht ? schlecht + ' von ' + (gut + schlecht) + ' falsch' : 'alle ' + gut + ' Zusicherungen erfüllt'}`);
  process.exit(schlecht ? 1 : 0);
})();
