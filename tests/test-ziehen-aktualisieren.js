/* ══ ZIEHEN ZUM AKTUALISIEREN (Runde 256) ════════════════════════════
   Plan „Studio Chat wie von Apple", Schritt 10. Seit 23.10.2026, 15:18:
   „es soll einfach den ganzen plan erledigen".

   Geprüft mit echten Touch-Ereignissen (CDP) bei 320 / 390 / 430 / 820:
    1. Oben in einer Liste nach unten gezogen: die Liste rückt nach, der
       Kreis füllt sich und ist über der Schwelle voll.
    2. Losgelassen über der Schwelle: der Kreis dreht sich, es wird nach
       einer neuen Version gesucht (reg.update), danach die Rückmeldung
       „Aktuell" und die Liste steht wieder an ihrem Platz.
    3. Unter der Schwelle losgelassen: nichts, die Liste federt zurück.
    4. Mitten in der Liste (gescrollt) nach unten: kein Zeichen, kein
       Versatz — das ist Scrollen.
    5. Waagerecht (Wischen auf einer Zeile): kein Zeichen.
    6. Ohne Verbindung: die Rückmeldung sagt es ehrlich (letzter Stand).
    7. Im Chat nicht; am Rechner nicht (keine Touch-Ereignisse).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(name, ok, info) {
  if (ok) { gut++; console.log('  ✓ ' + name); }
  else { schlecht++; console.log('  ✗ ' + name + (info ? '  — ' + info : '')); }
}
async function oeffne(b, w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => {
    localStorage.setItem('kf_tour', '99:demo-ich');
    localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'formi', stil2: true }));
    /* Service Worker sind im Test gesperrt; gezählt wird, ob nach einer
       neuen Version gesucht würde. */
    window._suche = 0;
    try {
      Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: {
        getRegistration: () => Promise.resolve({ update: () => { window._suche++; return Promise.resolve(); } }),
        register: () => new Promise(() => {}), addEventListener: () => {}, controller: null } });
    } catch (e) {}
    /* Rückmeldungen mitschreiben. */
    window._toasts = [];
    new MutationObserver(() => { const t = document.getElementById('toast'); if (t && t.classList.contains('show')) { const x = t.textContent.trim(); if (x && window._toasts[window._toasts.length - 1] !== x) window._toasts.push(x); } })
      .observe(document, { subtree: true, attributes: true, childList: true, characterData: true });
  });
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  p._cdp = await ctx.newCDPSession(p);
  return { ctx, p };
}
async function geheZu(p, g) {
  await p.evaluate((g) => { const k = document.querySelector('.mobnav [data-group="' + g + '"]'); if (k) k.click(); }, g);
  await p.waitForTimeout(700);
}
const PUNKT = () => {
  const s = document.querySelector('.view.show > .scroll-area'); if (!s) return null;
  const r = s.getBoundingClientRect();
  return { x: Math.round(r.left + r.width * .3), y: Math.round(r.top + 60), st: s.scrollTop };
};
const STAND = () => {
  const s = document.querySelector('.view.show > .scroll-area'), i = document.querySelector('.ptr');
  const m = s && getComputedStyle(s).transform.match(/matrix\(([^)]+)\)/);
  return { versatz: m ? Math.round(parseFloat(m[1].split(',')[5])) : 0, da: !!i, sicht: i ? parseFloat(getComputedStyle(i).opacity) : 0,
    p: i ? parseFloat(i.style.getPropertyValue('--ptr-p') || 0) : 0, voll: !!i && i.classList.contains('voll'), laeuft: !!i && i.classList.contains('laeuft'),
    suche: window._suche, toasts: window._toasts.slice() };
};
async function zieh(p, z, dx, dy, schritte) {
  const c = p._cdp;
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: z.x, y: z.y }] });
  for (let i = 1; i <= schritte; i++) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: z.x + dx * i / schritte, y: z.y + dy * i / schritte }] }); await p.waitForTimeout(16); }
  const mitten = await p.evaluate(STAND);
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  return mitten;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180]]) {
      console.log('\n── ' + w + ' × ' + h + ' ──');
      const { ctx, p } = await oeffne(b, w, h);
      await geheZu(p, 'g-arbeit');
      let z = await p.evaluate(PUNKT);
      const vor = await p.evaluate(() => !!document.querySelector('.ptr'));
      pruefe(w + ': vor dem ersten Ziehen kein Zeichen im Dokument', !vor);

      /* 3. kurz: nichts */
      let m = await zieh(p, z, 0, 80, 6);
      await p.waitForTimeout(500);
      let s = await p.evaluate(STAND);
      pruefe(w + ': 80 px gezogen (Liste rückt ' + m.versatz + ' px, Kreis ' + Math.round(m.p * 100) + ' %) → unter der Schwelle, federt zurück, nichts gesucht',
        m.versatz === 40 && m.p > .4 && m.p < .7 && !m.voll && s.versatz === 0 && s.sicht === 0 && s.suche === 0, JSON.stringify([m, s]));

      /* 1 + 2. weit: voll, dreht, sucht, meldet */
      m = await zieh(p, z, 0, 200, 10);
      /* Nach 400 ms: die Liste ist auf ihren Halt (48 px) zurückgefedert,
         der Kreis dreht noch (mindestens 600 ms). */
      await p.waitForTimeout(400);
      const dreht = await p.evaluate(STAND);
      await p.waitForTimeout(1000);
      s = await p.evaluate(STAND);
      pruefe(w + ': 200 px gezogen → Kreis voll (' + Math.round(m.p * 100) + ' %), Liste rückt ' + m.versatz + ' px', m.voll && m.p === 1 && m.versatz === 100, JSON.stringify(m));
      pruefe(w + ': losgelassen → dreht sich (' + dreht.versatz + ' px), sucht nach neuer Version (' + s.suche + '×), meldet „' + (s.toasts[s.toasts.length - 1] || '') + '"',
        dreht.laeuft && dreht.versatz === 48 && s.suche === 1 && /aktuell/i.test(s.toasts.join(' ')), JSON.stringify([dreht, s]));
      pruefe(w + ': danach steht die Liste wieder an ihrem Platz, Zeichen weg', s.versatz === 0 && s.sicht === 0 && !s.laeuft, JSON.stringify(s));

      /* 4. gescrollt: nichts */
      const kann = await p.evaluate(() => { const s = document.querySelector('.view.show > .scroll-area'); if (s.scrollHeight - s.clientHeight < 100) return false; s.scrollTop = 200; return true; });
      if (kann) {
        z = await p.evaluate(PUNKT);
        m = await zieh(p, z, 0, 150, 8);
        await p.waitForTimeout(500);
        s = await p.evaluate(STAND);
        pruefe(w + ': mitten in der Liste nach unten → kein Zeichen, kein Versatz', m.sicht === 0 && m.versatz === 0 && s.suche === 1, JSON.stringify(m));
        await p.evaluate(() => { document.querySelector('.view.show > .scroll-area').scrollTop = 0; });
      }

      /* 5. waagerecht: nichts */
      z = await p.evaluate(PUNKT);
      m = await zieh(p, z, -150, 20, 8);
      await p.waitForTimeout(500);
      pruefe(w + ': waagerecht gewischt → kein Zeichen', m.sicht === 0 && m.versatz === 0, JSON.stringify(m));
      await p.evaluate(() => { if (typeof swipeSchliessen === 'function') swipeSchliessen(); });

      /* 6. ohne Verbindung */
      await ctx.setOffline(true);
      await p.waitForTimeout(200);
      z = await p.evaluate(PUNKT);
      await zieh(p, z, 0, 200, 10);
      await p.waitForTimeout(1400);
      s = await p.evaluate(STAND);
      pruefe(w + ': ohne Verbindung → „' + (s.toasts[s.toasts.length - 1] || '') + '", keine Suche', /keine verbindung/i.test(s.toasts[s.toasts.length - 1] || '') && s.suche === 1, JSON.stringify(s));
      await ctx.setOffline(false);

      /* 7. Chat: nichts */
      await geheZu(p, 'g-komm');
      const chat = await p.evaluate(() => { const c = document.querySelector('.view.show .chat-scroll, .view.show .scroll-area'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: Math.round(r.left + r.width * .3), y: Math.round(r.top + 80), klasse: c.className }; });
      if (chat) {
        await p.evaluate(() => { const c = document.querySelector('.view.show .chat-scroll'); if (c) c.scrollTop = 0; });
        m = await zieh(p, chat, 0, 200, 10);
        await p.waitForTimeout(400);
        pruefe(w + ': im Chat (' + chat.klasse.split(' ')[0] + ') → kein Zeichen', m.sicht === 0, JSON.stringify(m));
      }
      if (p._fehler.length) pruefe(w + ': keine Seitenfehler', false, p._fehler.join(' | '));
      await ctx.close();
    }

    console.log('\n── Am Rechner ──');
    for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
      const p = await ctx.newPage(); p._fehler = [];
      p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
      await p.route('**://www.gstatic.com/**', r => r.abort());
      await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'formi', stil2: true })); });
      await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3500);
      await p.evaluate(() => { const g = document.querySelector('#side [data-group="g-arbeit"]'); if (g) g.click(); }); await p.waitForTimeout(600);
      const z = await p.evaluate(() => { const s = document.querySelector('.view.show > .scroll-area'); const r = s.getBoundingClientRect(); return [r.left + 200, r.top + 60]; });
      await p.mouse.move(z[0], z[1]); await p.mouse.down(); await p.mouse.move(z[0], z[1] + 200, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(400);
      const n = await p.evaluate(() => !!document.querySelector('.ptr'));
      pruefe(w + ': Maus-Ziehen zeigt nichts', !n);
      if (p._fehler.length) pruefe(w + ': keine Seitenfehler', false, p._fehler.join(' | '));
      await ctx.close();
    }
  } finally { await b.close(); }
  console.log('\n' + (schlecht ? '✗' : '✓') + ' Ziehen zum Aktualisieren: ' + gut + ' grün, ' + schlecht + ' falsch');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
