/* ══ GROSSER TITEL, DER BEIM SCROLLEN SCHRUMPFT (Runde 252) ═══════════
   Plan „Studio Chat wie von Apple", Schritt 6: „Grosser Titel 34 px
   fett, links, schrumpft beim Scrollen in die Kopfleiste (wie in Mail
   und Einstellungen)". Seit 23.10.2026, 15:18: „es soll einfach den
   ganzen plan erledigen".

   Geprüft wird im Stil Formi bei 320 / 390 / 430 / 820 / 1280 / 1440 /
   1920 px, in jedem Bereich unten bzw. links (Heute, Studio, Zeiten,
   Plan, Nachrichten):
    1. Oben steht der Titel 34 px fett (bis 360 px: 1,45rem, dort reicht
       die Breite sonst nicht).
    2. Er ist ganz zu lesen (nicht abgeschnitten) und der Kopf ist
       höchstens 86 px hoch — vorher 85 (Falle aus Runde 241: die
       Team-Seite rollt bei 390 px, sobald oben etwas > 7 px wächst).
    3. Gescrollt schrumpft er auf 17 px halbfett (--t-md, 600) — und
       zurück oben ist er wieder gross.
    4. Am Handy bleiben „Heute" und „Nachrichten" von Anfang an schmal
       (Runden 218/236: der Platz gehört dem Tag und dem Verlauf).
    5. Der Kopf ist als Knopf ≥ 44 × 44 zu treffen, in „normal" und
       „kompakt" (Hit-Test).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(name, ok, info) {
  if (ok) { gut++; console.log('  ✓ ' + name); }
  else { schlecht++; console.log('  ✗ ' + name + (info ? '  — ' + info : '')); }
}
const TREFFER = (el) => {
  const r = el.getBoundingClientRect();
  const cx = r.left + Math.min(r.width / 2, 60), cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0 };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--;
  while (u < innerHeight && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--;
  while (re < innerWidth && trifft(re + 1, cy)) re++;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1) };
};

async function oeffne(b, w, h, dichte) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((d) => { localStorage.setItem('kf_tour', '99:demo-ich'); localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'formi', stil2: true, dichte: d })); }, dichte || 'normal');
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  return { ctx, p };
}
const GRUPPEN = ['g-start', 'g-arbeit', 'g-zeit', 'g-team', 'g-komm'];
async function geheZu(p, g) {
  await p.evaluate((g) => { const k = [...document.querySelectorAll('.mobnav [data-group="' + g + '"], #side [data-group="' + g + '"]')].find(x => x.getClientRects().length); if (k) k.click(); }, g);
  await p.waitForTimeout(700);
}
const KOPF = () => {
  const bk = document.getElementById('bereichKopf'), b = document.getElementById('bkTitel');
  const cs = getComputedStyle(b), z = document.getElementById('bereichZeile');
  return { fs: parseFloat(cs.fontSize), fw: cs.fontWeight, eng: bk.classList.contains('eng'), h: Math.round(bk.getBoundingClientRect().height),
    ganz: b.scrollWidth <= b.clientWidth + 1, text: b.textContent, sichtbar: !z.hidden && !!z.getClientRects().length };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      console.log('\n── ' + w + ' × ' + h + ' ──');
      const { ctx, p } = await oeffne(b, w, h);
      const handy = w <= 820, gross = w <= 360 ? 23.2 : 34;
      for (const g of GRUPPEN) {
        await geheZu(p, g);
        const k = await p.evaluate(KOPF);
        if (!k.sichtbar) {
          /* Im Chat am Handy hat der Verlauf seinen eigenen Kopf (im-chat). */
          const imChat = await p.evaluate(() => document.body.classList.contains('im-chat'));
          pruefe(w + ' ' + g + ': Kopf zu sehen' + (imChat ? ' — im Chat am Handy bewusst weg (eigener Kopf)' : ''), imChat && handy, JSON.stringify(k));
          continue;
        }
        /* Der Plan springt beim Öffnen auf heute (scrollt also schon):
           dann steht der Kopf zu Recht klein da — nach oben, dann prüfen. */
        const vorweg = await p.evaluate(() => { const s = document.querySelector('.view.show .scroll-area'); return s ? s.scrollTop : 0; });
        if (vorweg > 28 && k.eng) {
          pruefe(w + ' ' + g + ': steht beim Öffnen gescrollt (' + vorweg + ' px) und darum klein (' + k.fs + ' px)', Math.abs(k.fs - 16.48) < .2, JSON.stringify(k));
          await p.evaluate(() => { const s = document.querySelector('.view.show .scroll-area'); s.scrollTop = 0; s.dispatchEvent(new Event('scroll')); });
          await p.waitForTimeout(450);
          Object.assign(k, await p.evaluate(KOPF));
        }
        if (handy && (g === 'g-start' || g === 'g-komm')) {
          pruefe(w + ' ' + g + ' „' + k.text + '": am Handy von Anfang an schmal (' + k.fs + ' px, ' + k.fw + ')', Math.abs(k.fs - 16.48) < .2 && k.fw === '600', JSON.stringify(k));
          continue;
        }
        pruefe(w + ' ' + g + ' „' + k.text + '": oben ' + k.fs + ' px fett, ganz zu lesen, Kopf ' + k.h + ' px', Math.abs(k.fs - gross) < .3 && k.fw === '700' && k.ganz && k.h <= 86 && !k.eng, JSON.stringify(k));
        /* Scrollen: der Kopf rückt zusammen, oben wieder gross. */
        const kann = await p.evaluate(() => { const s = document.querySelector('.view.show .scroll-area'); if (!s || s.scrollHeight - s.clientHeight < 120) return false; s.scrollTop = 400; s.dispatchEvent(new Event('scroll')); return true; });
        if (!kann) { console.log('  · ' + g + ': zu kurz zum Scrollen'); continue; }
        await p.waitForTimeout(450);
        const e = await p.evaluate(KOPF);
        pruefe(w + ' ' + g + ': gescrollt 17 px halbfett (' + e.fs + ' px, ' + e.fw + ', Kopf ' + e.h + ' px)', e.eng && Math.abs(e.fs - 16.48) < .2 && e.fw === '600' && e.h < k.h, JSON.stringify(e));
        await p.evaluate(() => { const s = document.querySelector('.view.show .scroll-area'); s.scrollTop = 0; s.dispatchEvent(new Event('scroll')); });
        await p.waitForTimeout(450);
        const z = await p.evaluate(KOPF);
        pruefe(w + ' ' + g + ': zurück oben wieder gross', !z.eng && Math.abs(z.fs - gross) < .3, JSON.stringify(z));
      }
      if (p._fehler.length) pruefe(w + ': keine Seitenfehler', false, p._fehler.join(' | '));
      await ctx.close();
    }

    console.log('\n── Trefferfläche des Kopfs (Hit-Test) ──');
    for (const dichte of ['normal', 'kompakt']) {
      for (const [w, h] of [[320, 640], [390, 844], [820, 1180], [1440, 900]]) {
        const { ctx, p } = await oeffne(b, w, h, dichte);
        await geheZu(p, 'g-arbeit');
        await p.waitForTimeout(300);
        const t = await p.evaluate(`(${TREFFER.toString()})(document.getElementById('bereichKopf'))`);
        pruefe(dichte + ' ' + w + ': Kopf „Studio" trifft ' + t.w + ' × ' + t.h, t.w >= 44 && t.h >= 44, JSON.stringify(t));
        await ctx.close();
      }
    }
  } finally { await b.close(); }
  console.log('\n' + (schlecht ? '✗' : '✓') + ' Grosser Titel: ' + gut + ' grün, ' + schlecht + ' falsch');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
