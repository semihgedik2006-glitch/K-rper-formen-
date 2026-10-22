/* ══════════════════════════════════════════════════════════════════════
   FÜNF RÄUME (Runde 180)

   Aus dem Betrieb, 22.10.2026: „das problem mit dem zu viel bleibt immer
   noch bestehen". Auf die Rückfragen: zu viele Menüpunkte, zu viel auf
   einem Bildschirm, man findet nichts, zu viele Funktionen. Täglich:
   Putzplan und Aufgaben. „Jede Funktion hat ihren Sinn" – nichts
   streichen, nur neu ordnen. Die Raumnamen „passen".

   Geprüft wird:
    1. Rechner: links genau Heute · Studio · Plan · Nachrichten · Wissen,
       für die Leitung dazu Verwaltung. Kein Putzplan-Knopf, kein
       „Alles". Die Schnellzugriffe stehen abgesetzt UNTER den Räumen.
    2. Handy (neues UND bisheriges Design): unten dieselben fünf, in
       derselben Reihenfolge.
    3. Jede Ansicht der App liegt in genau einem Raum und ist in höchstens
       zwei Tipps erreichbar (Raum, dann Reiter).
    4. Kopfzeile: kein Bericht, kein Formi-Knopf; die Glocke steht bei den
       Werkzeugen rechts.
    5. Die Schnellzugriffe gibt es weiter: am Rechner unter den Räumen,
       am Handy auf „Heute". (Ein erster Anlauf legte sie am Rechner
       auf „Heute" – dort passten nur drei, und die Startseite verlor
       81 px; test-schnell-editor und test-tagesband fanden das.)
    6. Am Handy liegt die Formi-Kugel nicht auf „+ Aufgabe".
    7. Die fünf Knöpfe unten treffen ≥ 44 × 44 bei 320 / 390 / 430 px,
       normal und kompakt; kein Querlauf.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;
const RAEUME = ['Heute', 'Studio', 'Plan', 'Nachrichten', 'Wissen'];

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
  await p.addInitScript(() => { try { localStorage.setItem('kf_tour', '1:testuid'); } catch (e) {} });
  await p.addInitScript({ path: SP + '/' + (opt.stub || 'stub-chef.js') });
  await p.goto(APP + '?neu=' + (opt.neu === undefined ? 1 : opt.neu), { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(700);
  p._ctx = ctx;
  return p;
}
const zu = (p) => p._ctx.close();
const leiste = (p, sel) => p.evaluate((sel) => [...document.querySelectorAll(sel)]
  .filter(e => e.getClientRects().length).map(e => (e.querySelector('span') || e).textContent.trim()), sel);

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1 Rechner: Seitenleiste ──');
  for (const [stub, leitung] of [['stub-chef.js', true], ['stub-mitarbeiter.js', false]]) {
    const p = await oeffne(b, 1440, 900, { stub });
    const s = await leiste(p, '#side > [data-group]');
    const soll = leitung ? RAEUME.concat('Verwaltung') : RAEUME;
    pruefe((leitung ? 'Leitung' : 'Mitarbeiter') + ': ' + s.join(' · '), JSON.stringify(s) === JSON.stringify(soll), JSON.stringify(s));
    const extra = await p.evaluate(() => ({ schnell: !!document.querySelector('#side .side-schnell'),
      putz: !!document.querySelector('#side [data-group="g-putz"]'), alles: !!document.querySelector('#side [data-group="g-alles"]') }));
    const unten = await p.evaluate(() => {
      const ss = document.querySelector('#side .side-schnell'); if (!ss) return true;
      const r = [...document.querySelectorAll('#side > [data-group]')].pop().getBoundingClientRect();
      return ss.getBoundingClientRect().top >= r.bottom;
    });
    pruefe((leitung ? 'Leitung' : 'Mitarbeiter') + ': kein Putzplan-Knopf, kein „Alles" links, Schnellzugriffe unter den Räumen', !extra.putz && !extra.alles && unten, JSON.stringify(extra));
    pruefe('keine Fehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 2 Handy: untere Leiste ──');
  for (const neu of [1, 0]) {
    const p = await oeffne(b, 390, 844, { neu, touch: true });
    const u = await leiste(p, '.mobnav [data-group]');
    pruefe((neu ? 'neues' : 'bisheriges') + ' Design: ' + u.join(' · '), JSON.stringify(u.slice(0, 5)) === JSON.stringify(RAEUME), JSON.stringify(u));
    await zu(p);
  }

  console.log('\n── 3 Jede Ansicht in einem Raum, in ≤ 2 Tipps ──');
  {
    const p = await oeffne(b, 1440, 900);
    const plan = await p.evaluate(() => {
      const raeume = [...document.querySelectorAll('#side > [data-group]')].map(e => e.dataset.group);
      return raeume;
    });
    const besucht = {};
    for (const g of plan) {
      await p.evaluate((g) => document.querySelector('#side [data-group="' + g + '"]').click(), g);
      await p.waitForTimeout(500);
      const reiter = await p.evaluate(() => [...document.querySelectorAll('#subnav [data-subview]')].filter(e => e.getClientRects().length).map(e => e.dataset.subview));
      const erste = await p.evaluate(() => (document.querySelector('.view.show') || {}).id);
      besucht[erste.replace('view-', '')] = g;
      for (const r of reiter) {
        await p.evaluate((r) => document.querySelector('#subnav [data-subview="' + r + '"]').click(), r);
        await p.waitForTimeout(300);
        const jetzt = await p.evaluate(() => (document.querySelector('.view.show') || {}).id);
        if (jetzt === 'view-' + r) besucht[r] = besucht[r] || g;
      }
    }
    const alle = ['home', 'ich', 'persoenlich', 'todos', 'putzplan', 'material', 'geraete', 'probe', 'team', 'chat', 'dm', 'ann', 'docs', 'schulung', 'gehirn', 'chef', 'planer', 'archive'];
    const fehlt = alle.filter(v => !besucht[v]);
    pruefe('alle ' + alle.length + ' Ansichten erreichbar über Raum + Reiter', !fehlt.length, 'fehlt: ' + fehlt.join(', ') + ' — gefunden: ' + JSON.stringify(besucht));
    pruefe('Putzplan liegt im Raum Studio', besucht.putzplan === 'g-arbeit', besucht.putzplan);
    pruefe('Ich und Persönlich liegen unter Heute', besucht.ich === 'g-start' && besucht.persoenlich === 'g-start');
    pruefe('Schulung, Dokumente und Formi liegen unter Wissen', besucht.schulung === 'g-wissen' && besucht.docs === 'g-wissen' && besucht.gehirn === 'g-wissen', JSON.stringify(besucht));
    await zu(p);
  }

  console.log('\n── 4 Kopfzeile ──');
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await oeffne(b, w, h, { touch: w < 800 });
    const k = await p.evaluate(() => {
      const da = id => { const e = document.getElementById(id); return !!e && e.getClientRects().length > 0 && getComputedStyle(e).display !== 'none'; };
      const gl = document.getElementById('tbGlocke').getBoundingClientRect();
      /* „Rechts bei den Werkzeugen" heisst: direkt vor der Gruppe mit Profil,
         Hilfe und Suche, nicht allein in der Mitte. */
      const wz = document.querySelector('.tb-user').getBoundingClientRect();
      return { bericht: da('tbBericht'), formi: da('jarvisStartPc'), glockeRechts: wz.left - gl.right <= 24,
        griffe: [...document.querySelectorAll('.topbar button, .topbar .avatar')].filter(e => e.getClientRects().length && getComputedStyle(e).display !== 'none').length };
    });
    pruefe(w + ' px: kein Bericht und kein Formi-Knopf oben, Glocke rechts (' + k.griffe + ' Griffe)', !k.bericht && !k.formi && k.glockeRechts, JSON.stringify(k));
    const kachel = await p.evaluate(() => ['jarvisStart', 'jarvisStartAlt'].some(id => { const e = document.getElementById(id); return e && e.getClientRects().length; }));
    pruefe(w + ' px: auch auf der Startseite kein zweiter Formi-Knopf (die Kugel bleibt)', !kachel && await p.evaluate(() => !document.getElementById('formiKugel').hidden));
    await zu(p);
  }

  console.log('\n── 4b Reiter kosten auf „Heute" keine Zeile ──');
  /* „am besten steht alles auf einer Seite ohne dass man scrollen muss":
     Am Rechner stehen die Reiter in der Kopfzeile, am Handy fehlen sie
     auf „Heute" – „Ich" bleibt über ☰ zwei Tipps entfernt. */
  for (const [w, h, touch] of [[1280, 800, false], [1440, 900, false], [1920, 1080, false], [390, 844, true], [320, 568, true]]) {
    const p = await oeffne(b, w, h, { touch });
    const m = await p.evaluate(() => {
      const kopf = document.getElementById('bereichKopf').getBoundingClientRect();
      const z = document.getElementById('subnavZeile'); const r = z.getBoundingClientRect();
      const sa = document.querySelector('#view-home .scroll-area').getBoundingClientRect();
      return { zeile: !!z.getClientRects().length && r.height > 0, inKopf: r.height > 0 && r.top >= kopf.top && r.bottom <= kopf.bottom,
               scrollOben: Math.round(sa.top), kopfUnten: Math.round(kopf.bottom) };
    });
    if (w > 820) pruefe(w + ' px: Reiter stehen in der Kopfzeile, die Liste beginnt direkt darunter', m.zeile && m.inKopf && m.scrollOben <= m.kopfUnten + 2, JSON.stringify(m));
    else pruefe(w + ' px: auf „Heute" keine Reiterzeile', !m.zeile && m.scrollOben <= m.kopfUnten + 2, JSON.stringify(m));
    if (w <= 820) {
      await p.click('#bereichKopf'); await p.waitForTimeout(400);
      await p.evaluate(() => document.querySelector('#allesLade [data-alles="ich"]').click()); await p.waitForTimeout(500);
      const v = await p.evaluate(() => ({ ansicht: (document.querySelector('.view.show') || {}).id,
        reiter: [...document.querySelectorAll('#subnav [data-subview]')].filter(e => e.getClientRects().length).map(e => e.dataset.subview) }));
      pruefe(w + ' px: „Ich" über ☰ in zwei Tipps, dort stehen die Reiter wieder', v.ansicht === 'view-ich' && v.reiter.join('|') === 'home|ich|persoenlich', JSON.stringify(v));
    }
    await zu(p);
  }

  console.log('\n── 5 Schnellzugriffe ──');
  {
    const p = await oeffne(b, 1440, 900);
    const n = await p.evaluate(() => [...document.querySelectorAll('#side .side-schnell .ss-knopf')].filter(e => e.getClientRects().length).length);
    pruefe('am Rechner in der Seitenleiste (' + n + ' Knöpfe samt „Anpassen")', n >= 1, String(n));
    await zu(p);
    const q = await oeffne(b, 390, 844, { touch: true });
    const m = await q.evaluate(() => [...document.querySelectorAll('#schnellLeiste .sz-knopf')].filter(e => e.getClientRects().length).length);
    pruefe('am Handy auf „Heute" (' + m + ' Knöpfe samt „Anpassen")', m >= 1, String(m));
    await zu(q);
  }

  console.log('\n── 6 Formi-Kugel und „+ Aufgabe" am Handy ──');
  {
    const p = await oeffne(b, 390, 844, { touch: true });
    await p.evaluate(() => document.querySelector('.mobnav [data-group="g-arbeit"]').click());
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => {
      const k = document.getElementById('formiKugel'), d = document.querySelector('#daumenDock .kopf-plus');
      if (!k || k.hidden || !d || !d.getClientRects().length) return { fall: 'nicht beide sichtbar' };
      const a = k.getBoundingClientRect(), c = d.getBoundingClientRect();
      const ueber = !(a.right <= c.left || a.left >= c.right || a.bottom <= c.top || a.top >= c.bottom);
      return { ueber };
    });
    pruefe('die Kugel liegt nicht auf „+ Aufgabe"', r.ueber === false, JSON.stringify(r));
    await zu(p);
  }

  console.log('\n── 7 Trefferflächen der unteren Leiste ──');
  for (const dichte of ['normal', 'kompakt']) {
    for (const [w, h] of [[320, 568], [390, 844], [430, 932]]) {
      const p = await oeffne(b, w, h, { touch: true });
      if (dichte === 'kompakt') await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt'));
      await p.waitForTimeout(200);
      const m = await p.evaluate((T) => {
        const f = new Function('return ' + T)();
        const k = [...document.querySelectorAll('.mobnav [data-group]')].filter(e => e.getClientRects().length);
        return { n: k.length, klein: k.map(e => [e.textContent.trim(), f(e)]).filter(x => x[1].w < 44 || x[1].h < 44).map(x => x[0] + ' ' + x[1].w + '×' + x[1].h),
          quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      pruefe(dichte + ' ' + w + ' px: ' + m.n + ' Knöpfe ≥ 44 × 44, kein Querlauf', m.n === 5 && !m.klein.length && m.quer <= 0, JSON.stringify(m));
      await zu(p);
    }
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Fünf Räume: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Fünf Räume: eine Navigation auf allen Geräten, jedes Ziel in zwei Tipps — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
