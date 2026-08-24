/* ── Waagerechtes Schieben in der ganzen App ──────────────────────────
   Misst, was sich mit dem Finger seitwaerts schieben LAESST. Das ist
   nicht dasselbe wie „ist zu breit":

     · overflow:hidden / clip → per Skript schiebbar (scrollLeft geht),
       mit dem Finger NICHT. Zaehlt hier nicht, wird aber als Hinweis
       ausgegeben, weil dort etwas abgeschnitten wird.
     · <input> → scrollt intern beim Tippen. Kein Seitenwackeln.
     · overflow-x:auto/scroll mit scrollWidth > clientWidth → ECHT.

   Ausgabe je Fund: Ansicht, Breite, Rolle, Wahl, Ueberhang in Pixeln.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = '/home/user/K-rper-formen-/tests';
const APP = 'http://127.0.0.1:8765/index.html';
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const ANSICHTEN = {
  'g-start': ['home'],
  'g-ich': ['ich'],
  'g-komm': ['chat', 'dm', 'ann'],
  'g-arbeit': ['todos', 'putzplan', 'material', 'geraete', 'probe', 'docs'],
  'g-team': ['team'],
  'g-chef': ['chef', 'archive'],
};

const MESSEN = () => {
  const funde = [], hinweise = [];
  const wahl = el => {
    if (el === document.documentElement) return 'html';
    if (el === document.body) return 'body';
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    if (el.className && typeof el.className === 'string') {
      s += '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.');
    }
    return s;
  };
  const alle = [document.documentElement, document.body, ...document.querySelectorAll('*')];
  for (const el of alle) {
    if (!el.getClientRects().length && el !== document.documentElement && el !== document.body) continue;
    const ueber = el.scrollWidth - el.clientWidth;
    if (ueber <= 1) continue;
    const ox = getComputedStyle(el).overflowX;
    const tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') continue;
    if (ox === 'hidden' || ox === 'clip') { hinweise.push(wahl(el) + ' +' + ueber); continue; }
    if (ox === 'visible' && el !== document.documentElement && el !== document.body) continue;
    funde.push({ w: wahl(el), u: ueber, ox });
  }
  return { funde, hinweise: hinweise.slice(0, 8) };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const alleFunde = [], alleHinweise = new Set();

  for (const rolle of ['chef', 'mitarbeiter']) {
    for (const breite of [320, 390, 430]) {
      const page = await b.newPage({ viewport: { width: breite, height: 780 } });
      await page.route('**://www.gstatic.com/**', r => r.abort());
      await page.route('**fonts.googleapis.com/**', r => r.abort());
      await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
      await page.addInitScript({ path: SP + '/stub-' + rolle + '.js' });
      await page.goto(APP, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2600);

      for (const [gruppe, views] of Object.entries(ANSICHTEN)) {
        const gDa = await page.evaluate(g => {
          const k = document.querySelector('.mobnav [data-group="' + g + '"]');
          if (!k) return false; k.click(); return true;
        }, gruppe);
        if (!gDa) continue;
        await page.waitForTimeout(320);
        for (const v of views) {
          const vDa = await page.evaluate(x => {
            const k = document.querySelector('[data-subview="' + x + '"]');
            if (k) { k.click(); return true; }
            return !!document.getElementById('view-' + x);
          }, v);
          if (!vDa) continue;
          await page.waitForTimeout(420);
          const r = await page.evaluate(MESSEN);
          r.hinweise.forEach(h => alleHinweise.add(v + '@' + breite + ' ' + h));
          r.funde.forEach(f => alleFunde.push(
            rolle + ' ' + breite + 'px ' + v + ' → ' + f.w + ' (+' + f.u + 'px, overflow-x:' + f.ox + ')'));
        }
      }
      await page.close();
      console.log('fertig: ' + rolle + ' ' + breite + 'px');
    }
  }
  await b.close();

  console.log('\n=== ECHT SCHIEBBAR (' + alleFunde.length + ') ===');
  [...new Set(alleFunde)].forEach(f => console.log('  ✗ ' + f));
  console.log('\n=== nur abgeschnitten, nicht schiebbar (' + alleHinweise.size + ') ===');
  [...alleHinweise].slice(0, 25).forEach(h => console.log('  · ' + h));
  process.exit(alleFunde.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
