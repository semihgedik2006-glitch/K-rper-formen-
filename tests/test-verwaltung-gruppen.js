/* ══════════════════════════════════════════════════════════════════════
   VERWALTUNG IN GRUPPEN, RUHIGERE ZEILEN (Runde 176)

   Aus dem Betrieb, 21.10.2026: „grade sieht alles aus wie ein komplettes
   durcheinander" — auf beiden Geräten. Auf den Vorschlag „Verwaltung mit
   einer Startseite statt elf Reitern, Aufgabenkarten ruhiger": „ja".

   Geprüft wird:
    1. Die Startseite der Verwaltung ordnet die Kacheln in Gruppen: Jeden
       Tag, Team & Studios, Zahlen, Einstellungen — in dieser
       Reihenfolge, jede Kachel unter ihrer Überschrift.
    2. Studioleitung: nur Gruppen, in denen sie etwas hat.
    3. Ab 1360 px stehen die Reiter in einem Reiter als Liste links
       (untereinander, mit Gruppenmarken), der Inhalt rechts daneben.
       Bei 1280 px und am Handy bleibt die Leiste waagerecht, ohne
       Gruppenmarken. Nirgends Querlauf.
    4. Der Marker bleibt ein Strich unter dem Wort, auch in der Liste.
    5. Jeder Reiter in der Liste trifft ≥ 44 × 44, normal und kompakt.
    6. Chef-Zugänge: Name und Mail stehen auf zwei Zeilen, nicht
       „Ohne Namentest2@example.com".
    7. Zeilen in Aufgaben und Putzplan: am Rechner (Maus) sind Griff,
       Stift und Papierkorb durchsichtig, bis man die Zeile überfährt
       oder sie den Fokus hat — sie bleiben aber in der Zeile und
       treffbar (beschlossen 9.10.). Am Handy (Touch) bleiben sie sichtbar.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;

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

async function oeffne(b, w, h, opt) {
  opt = opt || {};
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h } },
    opt.touch ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await p.addInitScript({ path: SP + '/' + (opt.stub || 'stub-chef.js') });
  await p.goto(APP + '?neu=1', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(600);
  p._ctx = ctx;
  return p;
}
const zu = (p) => p._ctx.close();
/* Wie ein Mensch: Seitenleiste, sonst über „Alles". */
const ansicht = (p, v) => p.evaluate(async (v) => {
  const w = ms => new Promise(r => setTimeout(r, ms));
  const name = { chef: /Verwaltung/, todos: /Aufgaben/, putzplan: /Putzplan/ }[v];
  const n = [...document.querySelectorAll('#side [data-group], #side button, #side a, .mobnav [data-group]')]
    .find(e => name.test(e.textContent) && e.getClientRects().length);
  if (n) { n.click(); await w(700); }
  if ((document.querySelector('.view.show') || {}).id === 'view-' + v) return true;
  const g = document.getElementById('bereichKopf');
  if (g && g.getClientRects().length) { g.click(); await w(400); }
  for (let i = 0; i < 30 && !document.querySelector('#allesLadeInhalt [data-alles="' + v + '"]'); i++) await w(100);
  const z = document.querySelector('#allesLadeInhalt [data-alles="' + v + '"]');
  if (z) { z.click(); await w(700); }
  return (document.querySelector('.view.show') || {}).id === 'view-' + v;
}, v);
const zurStartseite = (p) => p.evaluate(async () => {
  const b = document.getElementById('chefBack');
  if (b && b.getClientRects().length) { b.click(); await new Promise(r => setTimeout(r, 500)); }
});
const homeAufbau = (p) => p.evaluate(() => {
  const raus = []; let g = null;
  [...document.getElementById('chefHome').children].forEach(k => {
    if (k.matches('.ch-gruppe')) { g = { t: k.textContent.trim(), k: [] }; raus.push(g); }
    else if (k.matches('.chef-card')) { if (!g) { g = { t: '', k: [] }; raus.push(g); } g.k.push(k.dataset.cgo); }
  });
  return raus;
});

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1 Startseite in Gruppen (Geschäftsführung) ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h);
    pruefe(w + ' px: Verwaltung offen', await ansicht(p, 'chef'));
    await zurStartseite(p);
    const g = await homeAufbau(p);
    pruefe(w + ' px: vier Gruppen in der Reihenfolge Jeden Tag · Team & Studios · Zahlen · Einstellungen',
      g.map(x => x.t).join(' · ') === 'Jeden Tag · Team & Studios · Zahlen · Einstellungen', JSON.stringify(g));
    const erwartet = { 'Jeden Tag': ['ueberblick', 'erstellen', 'anliegen', 'zeiten'], 'Team & Studios': ['team', 'standorte', 'nachweise'],
      'Zahlen': ['kennzahlen', 'report'], 'Einstellungen': ['system'] };
    pruefe(w + ' px: jede Kachel unter ihrer Gruppe', g.every(x => JSON.stringify(x.k) === JSON.stringify(erwartet[x.t])), JSON.stringify(g));
    const quer = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    pruefe(w + ' px: kein Querlauf', quer <= 0, String(quer));
    pruefe(w + ' px: keine Fehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 2 Studioleitung ──');
  {
    const p = await oeffne(b, 1440, 900, { stub: 'stub-leiter.js' });
    await ansicht(p, 'chef');
    await zurStartseite(p);
    const g = await homeAufbau(p);
    const leer = g.filter(x => !x.k.length);
    pruefe('nur Gruppen, in denen sie etwas hat (' + g.map(x => x.t || '–').join(' · ') + ')',
      g.length >= 1 && !leer.length && !g.some(x => x.k.includes('team')), JSON.stringify(g));
    await zu(p);
  }

  console.log('\n── 3/4/5 Liste am breiten Rechner, Leiste darunter ──');
  for (const [w, h] of [[1920, 1080], [1440, 900], [1360, 800], [1280, 800], [820, 1180], [390, 844], [320, 568]]) {
    const p = await oeffne(b, w, h);
    await ansicht(p, 'chef');
    await zurStartseite(p);
    await p.evaluate(() => { const c = [...document.querySelectorAll('[data-cgo="team"]')].find(e => e.getClientRects().length); if (c) c.click(); });
    await p.waitForTimeout(700);
    const m = await p.evaluate(() => {
      const bar = document.getElementById('chefBar');
      const tabs = [...document.querySelectorAll('#chefTabs .chef-tab')].filter(e => e.getClientRects().length);
      const pane = document.querySelector('.chef-pane[data-cpane="team"]');
      const marken = [...document.querySelectorAll('#chefTabs .chef-tab-gruppe')].filter(e => e.getClientRects().length).map(e => e.textContent);
      const xs = [...new Set(tabs.map(t => Math.round(t.getBoundingClientRect().left)))];
      const ys = [...new Set(tabs.map(t => Math.round(t.getBoundingClientRect().top)))];
      const br = bar.getBoundingClientRect(), pr = pane.getBoundingClientRect();
      return { tabs: tabs.length, xs: xs.length, ys: ys.length, marken, nebeneinander: pr.left >= br.right - 1 && pr.top < br.bottom,
        quer: document.documentElement.scrollWidth - innerWidth };
    });
    if (w >= 1360) {
      pruefe(w + ' px: Reiter untereinander (eine Spalte, ' + m.tabs + ' Reiter)', m.xs === 1 && m.ys === m.tabs, JSON.stringify(m));
      pruefe(w + ' px: mit Gruppenmarken', m.marken.join(',') === 'Jeden Tag,Team & Studios,Zahlen,Einstellungen', JSON.stringify(m.marken));
      pruefe(w + ' px: Inhalt rechts neben der Liste', m.nebeneinander, JSON.stringify(m));
      // Der Strich unter dem Wort
      const s = await p.evaluate(() => {
        const bar = document.getElementById('chefTabs'), an = bar.querySelector('.chef-tab.on');
        const vor = getComputedStyle(bar, '::before'), st = bar.style;
        const y = parseFloat(st.getPropertyValue('--ind-y')), x = parseFloat(st.getPropertyValue('--ind-x')), wd = parseFloat(st.getPropertyValue('--ind-w'));
        return { hoch: parseFloat(vor.height), unten: Math.round(y + parseFloat(vor.top) + parseFloat(vor.height)), reiterUnten: an.offsetTop + an.offsetHeight,
          links: Math.round(x), reiterLinks: an.offsetLeft, breit: Math.round(wd), reiterBreit: an.offsetWidth, spalte: bar.clientWidth };
      });
      pruefe(w + ' px: Marker ist ein Strich unter dem Wort „Team", nicht über die Spalte',
        s.hoch <= 4 && Math.abs(s.unten - s.reiterUnten) <= 2 && Math.abs(s.links - s.reiterLinks) <= 1 && Math.abs(s.breit - s.reiterBreit) <= 1 && s.breit < s.spalte - 20, JSON.stringify(s));
      for (const dichte of ['normal', 'kompakt']) {
        await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
        const k = await p.evaluate(async (SRC) => {
          const T = eval('(' + SRC + ')'); const zu = [];
          const els = [...document.querySelectorAll('#chefTabs .chef-tab, #chefBack')].filter(e => e.getClientRects().length);
          for (const el of els) {
            /* center wie test-reiter: Bei „nearest" landet der Knopf an der
               Oberkante der Scroll-Fläche, und dort reicht die Leiste
               Chef · Schichtplaner · Archiv mit 5 px hinein. Das gilt für
               jedes Element dort, nicht nur für diese Liste. */
            el.scrollIntoView({ block: 'center' });
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            const t = T(el); if (t.w < 44 || t.h < 44) zu.push(el.textContent.trim() + ' ' + t.w + '×' + t.h);
          }
          return { n: els.length, zu };
        }, TREFFER.toString());
        pruefe(w + ' px ' + dichte + ': alle ' + k.n + ' Griffe der Liste ≥ 44 × 44', k.n > 5 && !k.zu.length, k.zu.join(', '));
      }
      await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
    } else {
      pruefe(w + ' px: Leiste waagerecht, ohne Gruppenmarken', m.ys === 1 && !m.marken.length, JSON.stringify(m));
    }
    pruefe(w + ' px: kein Querlauf', m.quer <= 0, String(m.quer));
    // Wechsel per Liste
    await p.evaluate(() => { const t = document.querySelector('#chefTabs [data-ctab="system"]'); if (t) t.click(); });
    await p.waitForTimeout(500);
    pruefe(w + ' px: Reiter wechselt', await p.evaluate(() => getComputedStyle(document.querySelector('.chef-pane[data-cpane="system"]')).display !== 'none'));
    pruefe(w + ' px: keine Fehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 6 Chef-Zugänge: Name und Mail getrennt ──');
  {
    const p = await oeffne(b, 1440, 900);
    await ansicht(p, 'chef');
    await zurStartseite(p);
    await p.evaluate(() => { const c = [...document.querySelectorAll('[data-cgo="team"]')].find(e => e.getClientRects().length); if (c) c.click(); });
    await p.waitForTimeout(700);
    const z = await p.evaluate(() => [...document.querySelectorAll('.emp-main')].map(e => {
      const n = e.querySelector('b').getBoundingClientRect(), m = e.querySelector('.emp-sub').getBoundingClientRect();
      return { t: e.innerText.replace(/\n/g, ' | '), untereinander: m.top >= n.bottom - 1 };
    }));
    pruefe('jede Zeile: Mail unter dem Namen (' + z.length + ')', z.length > 0 && z.every(x => x.untereinander), JSON.stringify(z));
    await zu(p);
  }

  console.log('\n── 7 Ruhigere Zeilen ──');
  for (const [v, zeile, knoepfe] of [['todos', '#todoArea .todo:not(.done)', '.t-edit, .t-del'], ['putzplan', '#view-putzplan .pp-item:not(.done)', '.pp-edit, .pp-del']]) {
    {
      const p = await oeffne(b, 1440, 900);
      pruefe('Rechner, ' + v + ': geöffnet', await ansicht(p, v));
      /* Die Attrappe hat Putzpunkte nur in Hürth (studio-6). */
      if (v === 'putzplan') { await p.selectOption('#ppStudio', 'studio-6'); await p.waitForTimeout(500); }
      await p.mouse.move(5, 5);
      await p.waitForTimeout(300);
      const vorher = await p.evaluate(({ zeile, knoepfe }) => {
        const z = document.querySelector(zeile); if (!z) return null;
        return [...z.querySelectorAll(knoepfe)].map(k => getComputedStyle(k).opacity);
      }, { zeile, knoepfe });
      pruefe('Rechner, ' + v + ': Stift und Papierkorb in der Zeile, aber durchsichtig', !!vorher && vorher.length === 2 && vorher.every(o => o === '0'), JSON.stringify(vorher));
      const r = await p.evaluate((zeile) => { const z = document.querySelector(zeile); z.scrollIntoView({ block: 'center' }); const r = z.getBoundingClientRect(); return { x: r.left + 40, y: r.top + r.height / 2 }; }, zeile);
      await p.mouse.move(r.x, r.y);
      await p.waitForTimeout(350);
      const nachher = await p.evaluate(({ zeile, knoepfe }) => [...document.querySelector(zeile).querySelectorAll(knoepfe)].map(k => getComputedStyle(k).opacity), { zeile, knoepfe });
      pruefe('Rechner, ' + v + ': beim Überfahren erscheinen sie', nachher.every(o => o === '1'), JSON.stringify(nachher));
      const lage = await p.evaluate(({ zeile, knoepfe }) => {
        const z = document.querySelector(zeile);
        return [...z.querySelectorAll(knoepfe)].map(k => { const r = k.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!t && (t === k || k.contains(t)); });
      }, { zeile, knoepfe });
      pruefe('Rechner, ' + v + ': und sind dort, wo sie waren, treffbar', lage.every(Boolean), JSON.stringify(lage));
      // Fokus per Tastatur
      await p.mouse.move(5, 5);
      await p.evaluate(({ zeile, knoepfe }) => { document.querySelector(zeile).querySelector(knoepfe.split(',')[0]).focus(); }, { zeile, knoepfe });
      await p.waitForTimeout(300);
      const fokus = await p.evaluate(({ zeile, knoepfe }) => [...document.querySelector(zeile).querySelectorAll(knoepfe)].map(k => getComputedStyle(k).opacity), { zeile, knoepfe });
      pruefe('Rechner, ' + v + ': mit Tastaturfokus sichtbar', fokus.every(o => o === '1'), JSON.stringify(fokus));
      pruefe('Rechner, ' + v + ': keine Fehler', !p._fehler.length, p._fehler.join(' | '));
      await zu(p);
    }
    {
      const p = await oeffne(b, 390, 844, { touch: true });
      await ansicht(p, v);
      if (v === 'putzplan') { await p.selectOption('#ppStudio', 'studio-6'); await p.waitForTimeout(500); }
      const o = await p.evaluate(({ zeile, knoepfe }) => {
        const z = document.querySelector(zeile); if (!z) return null;
        return [...z.querySelectorAll(knoepfe)].map(k => getComputedStyle(k).opacity);
      }, { zeile, knoepfe });
      pruefe('Handy (Touch), ' + v + ': Stift und Papierkorb sichtbar', !!o && o.length === 2 && o.every(x => x === '1'), JSON.stringify(o));
      await zu(p);
    }
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Verwaltung in Gruppen: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Verwaltung in Gruppen: Kacheln geordnet, Liste am Rechner, ruhigere Zeilen — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
