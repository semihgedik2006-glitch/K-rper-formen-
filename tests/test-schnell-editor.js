/* ══════════════════════════════════════════════════════════════════════
   SCHNELLZUGRIFFE SELBST ZUSAMMENSTELLEN (Runde 116)

   Aus dem Betrieb, 25.9.2026:
     „lass einen die seite komplett selber anpassen das sich jeder seine
      gewünschten shortcuts dort einfügen kann, am besten in einer art
      mini editor welche das zeigt dann muss man sich nicht irgendwie
      die zahlen merken"

   Geprüft wird:
   1. Am Rechner: das Fenster zeigt OBEN die Vorschau in der Reihenfolge
      der Seitenleiste. Bis zu SECHS lassen sich wählen, ein siebter wird
      abgelehnt. Die Seitenleiste zeigt alle sechs, mit Taste, wo es eine
      gibt. ↓ tauscht, × entfernt — und die Seitenleiste folgt sofort.
      In der Liste steht keine Stellen-Ziffer mehr.
   2. Am Handy: dieselbe Wahl, unten auf der Startseite die ersten drei;
      in der Vorschau sind die übrigen als „nur am Rechner" markiert.
   3. Jeder Knopf der Vorschau und der Seitenleiste trifft ≥ 44 × 44 —
      bei 320 / 390 / 430 / 820 / 1280 / 1440 / 1920 px, normal und
      kompakt; nichts ragt seitlich hinaus.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
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
async function oeffne(b, w, h, rolle, init) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  if (init) await p.addInitScript(init);
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
const vorschau = (p) => p.evaluate(() =>
  [...document.querySelectorAll('#schnellVorschau .sz-v-zeile')].map(z => ({
    name: z.querySelector('.sz-v-name').childNodes[0].textContent.trim(),
    nurPc: z.classList.contains('nur-pc'),
    taste: (z.querySelector('kbd') || {}).textContent || '',
  })));
const seitenleiste = (p) => p.evaluate(() =>
  [...document.querySelectorAll('#side .side-schnell .ss-knopf:not(.ss-anpassen)')].map(k => ({
    name: (k.querySelector('span') || {}).textContent || '',
    taste: (k.querySelector('kbd') || {}).textContent || '',
    tasteSichtbar: !!(k.querySelector('kbd') && k.querySelector('kbd').getClientRects().length),
    title: k.getAttribute('title') || '',
  })));
const klick = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, sel);

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  let gemerkt = null;

  console.log('\n── 1. Am Rechner (1440 × 900) ──');
  {
    const p = await oeffne(b, 1440, 900, 'mitarbeiter');
    pruefe('„Anpassen" in der Seitenleiste öffnet das Fenster',
      await klick(p, '#schnellAnpassenSeite') &&
      await p.evaluate(() => document.getElementById('schnellModal').classList.contains('show')));
    await p.waitForTimeout(300);
    const v0 = await vorschau(p);
    const sl0 = await seitenleiste(p);
    pruefe('die Vorschau zeigt die Wahl in der Reihenfolge der Seitenleiste',
      v0.length === 3 && v0.map(x => x.name).join('|') === sl0.map(x => x.name).join('|'),
      JSON.stringify({ v0, sl0 }));
    const ziffern = await p.evaluate(() => [...document.querySelectorAll('#schnellListe .sz-stelle')].map(x => x.textContent.trim()));
    pruefe('in der Liste keine Stellen-Ziffer mehr, sondern ein Haken',
      ziffern.length === 3 && ziffern.every(z => z === ''), JSON.stringify(ziffern));
    const hinweis = await p.evaluate(() => document.getElementById('schnellHinweis').textContent);
    pruefe('der Hinweis sagt „bis zu sechs" und „am Handy die ersten drei"', /sechs/.test(hinweis) && /ersten drei/.test(hinweis), hinweis);

    // drei dazu
    const frei = await p.evaluate(() => [...document.querySelectorAll('#schnellListe .kn-zeile:not(.an)')].map(z => z.dataset.schnellwahl));
    for (const k of ['material', 'putzplan', 'chat'].filter(x => frei.includes(x)).concat(frei).slice(0, 3)) {
      await klick(p, '#schnellListe [data-schnellwahl="' + k + '"]');
      await p.waitForTimeout(150);
    }
    const v6 = await vorschau(p);
    pruefe('sechs lassen sich wählen', v6.length === 6, JSON.stringify(v6.map(x => x.name)));
    pruefe('die Plätze 4–6 sind als „nur am Rechner" markiert',
      v6.map(x => x.nurPc).join() === 'false,false,false,true,true,true');
    const zahl = await p.evaluate(() => document.querySelector('#schnellVorschau .sz-v-zahl').textContent);
    pruefe('„6 von 6 gewählt"', /6 von 6/.test(zahl), zahl);
    const nochFrei = await p.evaluate(() => (document.querySelector('#schnellListe .kn-zeile:not(.an)') || {}).dataset);
    await klick(p, '#schnellListe [data-schnellwahl="' + nochFrei.schnellwahl + '"]');
    await p.waitForTimeout(200);
    pruefe('ein siebter wird abgelehnt', (await vorschau(p)).length === 6);

    const sl6 = await seitenleiste(p);
    pruefe('die Seitenleiste zeigt alle sechs, in derselben Reihenfolge',
      sl6.map(x => x.name).join('|') === v6.map(x => x.name).join('|'), JSON.stringify(sl6));
    const mitTaste = v6.filter(x => x.taste);
    /* Bei drei steht die Taste sichtbar in der Zeile; ab vier (zwei
       Spalten) ist dafür kein Platz — dann im title, und im Fenster. */
    pruefe('wo es eine Taste gibt, steht sie in der Vorschau und im title der Seitenleiste',
      mitTaste.length >= 1 && mitTaste.every(x => (sl6.find(y => y.name === x.name) || {}).title.endsWith('Taste ' + x.taste)),
      JSON.stringify({ v6, sl6 }));
    const sl3taste = sl0.filter(x => x.taste);
    pruefe('bei drei steht die Taste sichtbar in der Seitenleiste', sl3taste.length >= 1 && sl3taste.every(x => x.tasteSichtbar), JSON.stringify(sl0));
    const spalten = await p.evaluate(() => {
      const box = document.querySelector('#side .side-schnell');
      const lefts = new Set([...box.querySelectorAll('.ss-knopf:not(.ss-anpassen)')].map(k => Math.round(k.getBoundingClientRect().left)));
      const zu = [...box.querySelectorAll('.ss-knopf:not(.ss-anpassen) span')].filter(s => s.scrollWidth > s.clientWidth + 1).map(s => s.textContent);
      return { viele: box.classList.contains('viele'), spalten: lefts.size, zu };
    });
    pruefe('ab vier: zwei Spalten in der Seitenleiste', spalten.viele && spalten.spalten === 2, JSON.stringify(spalten));
    pruefe('kein Wort abgeschnitten', !spalten.zu.length, JSON.stringify(spalten.zu));

    // Die angezeigte Taste führt wirklich dorthin
    const mitT = await p.evaluate(() => {
      const z = [...document.querySelectorAll('#schnellVorschau .sz-v-zeile')].find(x => x.querySelector('kbd'));
      return z ? { taste: z.querySelector('kbd').textContent, key: z.querySelector('[data-szweg]').dataset.szweg } : null;
    });
    await klick(p, '#schnellFertig');
    await p.waitForTimeout(300);
    if (mitT) {
      await p.evaluate(() => document.activeElement && document.activeElement.blur());
      await p.keyboard.press(mitT.taste.length === 1 ? mitT.taste : mitT.taste);
      await p.waitForTimeout(700);
      const ansicht = await p.evaluate(() => (document.querySelector('.view.show') || {}).id);
      const ziel = { home: 'view-home', chat: 'view-chat', todos: 'view-todos', team: 'view-team', geraete: 'view-geraete',
                     putzplan: 'view-putzplan', material: 'view-material', dm: 'view-dm', ann: 'view-ann' }[mitT.key];
      pruefe('die angezeigte Taste „' + mitT.taste + '" führt dorthin (' + mitT.key + ')', !ziel || ansicht === ziel, ansicht);
    }

    // ↓ und ×
    await klick(p, '#schnellAnpassenSeite');
    await p.waitForTimeout(300);
    const vorher = (await vorschau(p)).map(x => x.name);
    const ersterRauf = await p.evaluate(() => document.querySelector('#schnellVorschau [data-szhoch]').disabled);
    const letzterRunter = await p.evaluate(() => [...document.querySelectorAll('#schnellVorschau [data-szrunter]')].pop().disabled);
    pruefe('der erste kann nicht höher, der letzte nicht tiefer', ersterRauf && letzterRunter);
    await klick(p, '#schnellVorschau [data-szrunter]');
    await p.waitForTimeout(200);
    const getauscht = (await vorschau(p)).map(x => x.name);
    pruefe('↓ tauscht die ersten beiden', getauscht[0] === vorher[1] && getauscht[1] === vorher[0], JSON.stringify(getauscht));
    await p.evaluate(() => [...document.querySelectorAll('#schnellVorschau [data-szweg]')].pop().click());
    await p.waitForTimeout(200);
    const weg = (await vorschau(p)).map(x => x.name);
    pruefe('× entfernt den letzten', weg.length === 5 && !weg.includes(vorher[5]), JSON.stringify(weg));
    const slNeu = (await seitenleiste(p)).map(x => x.name);
    pruefe('die Seitenleiste folgt sofort', slNeu.join('|') === weg.join('|'), JSON.stringify(slNeu));
    // zurück auf sechs für den Handy-Teil
    await klick(p, '#schnellListe [data-schnellwahl="' + (await p.evaluate(() => document.querySelector('#schnellListe .kn-zeile:not(.an)').dataset.schnellwahl)) + '"]');
    await p.waitForTimeout(200);
    gemerkt = await p.evaluate(() => localStorage.getItem('kf_prefs'));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 2. Dieselbe Wahl am Handy (390 × 844) ──');
  {
    const p = await oeffne(b, 390, 844, 'mitarbeiter', `localStorage.setItem('kf_prefs', ${JSON.stringify(gemerkt)});`);
    const unten = await p.evaluate(() => [...document.querySelectorAll('#schnellLeiste .sz-knopf:not(.sz-anpassen)')].map(k => k.textContent.trim()));
    pruefe('unten auf der Startseite stehen die ersten drei', unten.length === 3, JSON.stringify(unten));
    await klick(p, '#schnellAnpassen');
    await p.waitForTimeout(300);
    const v = await vorschau(p);
    pruefe('die Vorschau zeigt alle sechs, die ersten drei wie unten',
      v.length === 6 && v.slice(0, 3).map(x => x.name).join('|') === unten.join('|'), JSON.stringify({ v, unten }));
    pruefe('4–6 heissen „nur am Rechner"', v.slice(3).every(x => x.nurPc) && v.slice(0, 3).every(x => !x.nurPc));
    const zahl = await p.evaluate(() => document.querySelector('#schnellVorschau .sz-v-zahl').textContent);
    pruefe('die Zahl sagt es ehrlich: „3 von 3 hier, dazu 3 am Rechner"', /3 von 3 hier, dazu 3 am Rechner/.test(zahl), zahl);
    const tasten = await p.evaluate(() => [...document.querySelectorAll('#side .ss-taste')].filter(k => k.getClientRects().length).length);
    pruefe('am Handy keine Tasten in einer Seitenleiste, die es nicht gibt', tasten === 0, String(tasten));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 3. Treffen ──');
  for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h, 'mitarbeiter', `localStorage.setItem('kf_prefs', ${JSON.stringify(gemerkt)});`);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.waitForTimeout(150);
      // Seitenleiste (nur am Rechner) — bei geschlossenem Fenster
      const seite = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const els = [...document.querySelectorAll('#side .side-schnell .ss-knopf')].filter(e => e.getClientRects().length);
        const zu = [];
        for (const el of els) {
          el.scrollIntoView({ block: 'nearest' });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el);
          if (m.w < 44 || m.h < 44) zu.push(el.textContent.trim() + ' ' + m.w + '×' + m.h);
        }
        return { zahl: els.length, zu };
      }, TREFFER.toString());
      await klick(p, w > 820 ? '#schnellAnpassenSeite' : '#schnellAnpassen');
      await p.waitForTimeout(300);
      const k = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const els = [...document.querySelectorAll('#schnellVorschau button:not([disabled])')];
        const zu = [];
        for (const el of els) {
          el.scrollIntoView({ block: 'center' });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el);
          if (m.w < 44 || m.h < 44) zu.push((el.getAttribute('aria-label') || el.textContent) + ' ' + m.w + '×' + m.h);
        }
        const box = document.querySelector('#schnellModal .modal, #schnellModal [role="dialog"]') || document.getElementById('schnellVorschau');
        const r = box.getBoundingClientRect();
        return { zahl: els.length, zu, quer: document.documentElement.scrollWidth - innerWidth,
                 imBild: r.left >= -1 && r.right <= innerWidth + 1 };
      }, TREFFER.toString());
      const erwSeite = w > 820 ? 7 : 0;
      /* Sechs in der Seitenleiste dürfen sie nicht zum Scrollen bringen:
         „Anpassen" stand sonst bei 1280 × 800 unter dem Rand. */
      const scrollt = await p.evaluate(() => { const s = document.getElementById('side'); return s && s.getClientRects().length ? s.scrollHeight - s.clientHeight : 0; });
      if (w > 820) pruefe(w + ' px, ' + dichte + ': die Seitenleiste mit sechs Schnellzugriffen scrollt nicht (' + scrollt + ' px)', scrollt <= 0);
      pruefe(w + ' px, ' + dichte + ': Seitenleiste ' + seite.zahl + ' Knöpfe, Vorschau ' + k.zahl + ' Knöpfe — alle ≥ 44 × 44, im Bild',
        seite.zahl === erwSeite && !seite.zu.length && k.zahl >= 16 && !k.zu.length && k.quer <= 0 && k.imBild,
        JSON.stringify({ seite, k }));
      await klick(p, '#schnellFertig');
      await p.waitForTimeout(250);
    }
    if (p._fehler.length) pruefe(w + ' px ohne Skriptfehler', false, p._fehler.join(' | '));
    await p.close();
  }

  await b.close();
  console.log('\n' + gut + ' gut, ' + schlecht + ' schlecht');
  if (schlecht) console.log('✗ Schnellzugriffe: ' + schlecht + ' Prüfungen fehlgeschlagen');
  process.exit(schlecht ? 1 : 0);
})();
