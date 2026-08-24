/* ── Waagerechtes Schieben ────────────────────────────────────────────
   Nichts in der App darf sich seitwaerts schieben lassen — ausser den
   Leisten, bei denen das Absicht ist. Genau diese Unterscheidung ist
   hier festgehalten, und zwar als LISTE: was nicht drinsteht, ist ein
   Fund.

   WAS ALS SCHIEBBAR ZAEHLT
   Nicht „ist zu breit", sondern „laesst sich mit dem Finger schieben":
     · overflow:hidden oder clip → per Skript schiebbar (scrollLeft
       bewegt sich), mit dem Finger nicht. Zaehlt hier nicht — dafuer
       gibt es test-abgeschnitten.js.
     · <input>/<textarea> → scrollt intern beim Tippen. Kein Wackeln.
     · overflow-x:auto oder scroll mit scrollWidth > clientWidth → echt.
   Die erste Messung dieser Sorte hat genau daran vorbeigemessen und
   Funde gemeldet, die keine waren.

   DIE ERLAUBTEN LEISTEN, jede mit Grund:
     .subnav       „Betrieb" hat sechs Reiter, der laengste heisst
                   „Probetraining". Umgebrochen braeuchte die Leiste bei
                   320px vier Zeilen und 162 statt 42 Pixel — 120 Pixel,
                   die der Liste darunter fehlen. Der offene Reiter wird
                   dafuer ins Bild geschoben (subtabSichtbarMachen).
     .chat-channels  bis zu 14 Studios plus Gruppen. Der offene Kanal
                   wird ins Bild geschoben (kanalSichtbarMachen).
     .chip-row     Filter in einer Zeile; umbrechend nahm die Leiste
                   150px ueber einer Liste mit drei Eintraegen.
     .sort-row     dasselbe fuer die Sortierung.

   NICHT erlaubt und deshalb nicht in der Liste: .mobnav. Die untere
   Leiste ist die Hauptnavigation — was man dort wegwischen muss, gibt
   es nicht. Sie stand mit 462px Inhalt in einer 320 bis 430px breiten
   Leiste, „Verwaltung" lag also auf JEDEM Handy halb neben dem Bild.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const ERLAUBT = ['subnav', 'chat-channels', 'chip-row', 'sort-row', 'pm-tabs'];

const ANSICHTEN = {
  'g-start': ['home'], 'g-ich': ['ich'], 'g-komm': ['chat', 'dm', 'ann'],
  'g-arbeit': ['todos', 'putzplan', 'material', 'geraete', 'probe', 'docs'],
  'g-team': ['team'], 'g-chef': ['chef', 'archive'],
};

const MESSEN = erlaubt => {
  const funde = [];
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
    if (el.nodeType !== 1) continue;
    const tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') continue;
    const istWurzel = el === document.documentElement || el === document.body;
    if (!istWurzel && !el.getClientRects().length) continue;
    const ueber = el.scrollWidth - el.clientWidth;
    if (ueber <= 1) continue;
    const ox = getComputedStyle(el).overflowX;
    if (ox === 'hidden' || ox === 'clip') continue;
    if (ox === 'visible' && !istWurzel) continue;
    if (!istWurzel && erlaubt.some(k => el.classList.contains(k))) continue;
    funde.push(wahl(el) + ' +' + ueber + 'px');
  }
  return funde;
};

(async () => {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  let gemessen = 0;

  for (const rolle of ['chef', 'mitarbeiter']) {
    for (const breite of [320, 390]) {
      const page = await b.newPage({ viewport: { width: breite, height: 800 } });
      page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
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
        await page.waitForTimeout(300);
        for (const v of views) {
          const vDa = await page.evaluate(x => {
            const k = document.querySelector('[data-subview="' + x + '"]');
            if (k) { k.click(); return true; }
            return !!document.getElementById('view-' + x);
          }, v);
          if (!vDa) continue;
          await page.waitForTimeout(400);
          gemessen++;
          const funde = await page.evaluate(MESSEN, ERLAUBT);
          funde.forEach(f => errs.push(rolle + ' ' + breite + 'px · ' + v + ' → ' + f));
        }
      }
      await page.close();
    }
  }
  await b.close();

  console.log('Gemessen: 2 Rollen × 2 Breiten × alle Ansichten = ' + gemessen + ' Messungen');
  console.log('Erlaubte Leisten: ' + ERLAUBT.join(', '));
  /* Eine Messung, die nichts gemessen hat, ist kein gruener Durchlauf.
     Bei 13 Ansichten mal vier Durchgaengen sind es mindestens 40. */
  if (gemessen < 40) errs.push('AUFBAU: nur ' + gemessen + ' Messungen — da stimmt der Weg durch die App nicht');

  const einmalig = [...new Set(errs)];
  console.log(einmalig.length
    ? '\n✗ ' + einmalig.slice(0, 20).join('\n✗ ')
    : '\n✓ Nichts laesst sich seitwaerts schieben ausser den Leisten, bei denen es Absicht ist');
  process.exit(einmalig.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
