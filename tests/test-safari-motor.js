/* ── Die App im Safari-Motor (WebKit) ─────────────────────────────────
   (Runde 287) Jeder Durchlauf bis hierher lief in Chromium. In jeder
   Runde stand „Safari selbst nicht prüfbar". Playwright bringt WebKit
   mit — denselben Motor wie Safari auf dem iPhone, ohne iPhone. Was er
   nicht kann: den Rand des iPhones (safe-area) nachstellen, die
   Adressleiste von iOS, Berührungen wie am Gerät. Was er kann: zeigen,
   ob die App in WebKit überhaupt zeichnet, ob ein Skript dort fällt
   (anderer Zerleger, andere Grenzen), ob etwas quer überläuft.

   Geprüft, als Chef und als Mitarbeiter, bei 390 × 844 (Handy-Agent)
   und 1440 × 900:
    1. keine Seitenfehler beim Laden und beim Wechsel in jeden Raum;
    2. jeder Raum öffnet seine Ansicht (.view.show) und zeichnet sie —
       gemessen am Bild, nicht am DOM: der Ausschnitt der ersten Zeile
       ist als PNG grösser als derselbe Ausschnitt mit unsichtbarer
       Zeile (so fiel am 26.10. ein erster, leerer Schnappschuss auf,
       der nur zu früh kam);
    3. die Seite ist nicht breiter als das Fenster;
    4. die untere Leiste steht im Bild und jeder ihrer Knöpfe trifft sich
       selbst (elementFromPoint).

   Einrichten (einmal):  npx playwright install webkit
                         npx playwright install-deps webkit
   Fehlt WebKit, wird der Durchlauf ÜBERSPRUNGEN und sagt es laut — er
   ist dann grün, hat aber nichts gesehen. Das steht so, damit der
   Gesamtlauf auf Rechnern ohne WebKit nicht dauerhaft rot ist; wer die
   Zeile „übersprungen" liest, weiss Bescheid. */
const { webkit } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

let gut = 0, schlecht = 0;
function pruefe(name, ok, info) {
  if (ok) { gut++; console.log('  ✓ ' + name); }
  else { schlecht++; console.log('  ✗ ' + name + (info ? '  — ' + info : '')); }
}

/* „Gezeichnet" ohne Bildbibliothek: derselbe Ausschnitt zweimal als
   PNG — einmal mit der Zeile, einmal mit derselben Zeile unsichtbar
   (visibility:hidden). Ein PNG mit Text ist spürbar grösser als eines
   ohne; ist die Zeile gar nicht gezeichnet, sind beide gleich gross. */
async function gezeichnet(p, rect) {
  const mit = await p.screenshot({ type: 'png', clip: rect });
  await p.evaluate(() => { const z = window.__smZeile; if (z) z.style.visibility = 'hidden'; });
  const ohne = await p.screenshot({ type: 'png', clip: rect });
  await p.evaluate(() => { const z = window.__smZeile; if (z) z.style.visibility = ''; });
  return { mit: mit.length, ohne: ohne.length };
}

(async () => {
  let b;
  try { b = await webkit.launch(); }
  catch (e) {
    console.log('ÜBERSPRUNGEN: WebKit ist hier nicht installiert (' + e.message.split('\n')[0].slice(0, 120) + ').');
    console.log('   Einrichten: npx playwright install webkit && npx playwright install-deps webkit');
    console.log('Fehler: keine');
    process.exit(0);
  }
  const RAEUME = ['g-start', 'g-arbeit', 'g-zeit', 'g-team', 'g-komm'];
  for (const [name, opt, rolle] of [
    ['iPhone 390 Chef', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: UA }, 'chef'],
    ['iPhone 390 Mitarbeiter', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: UA }, 'mitarbeiter'],
    ['Rechner 1440 Chef', { viewport: { width: 1440, height: 900 } }, 'chef'],
  ]) {
    console.log('\n── ' + name + ' ──');
    const ctx = await b.newContext(opt);
    const p = await ctx.newPage();
    const fehler = [];
    p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => {
      localStorage.setItem('kf_tour', '99:demo-ich');
      localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'formi', stil2: true, fs2: true, fs: '100', dichte: 'normal' }));
    });
    await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(4000);
    await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
    pruefe('lädt ohne Seitenfehler', !fehler.length, fehler.join(' | '));
    for (const g of RAEUME) {
      const vorher = fehler.length;
      const da = await p.evaluate(g => {
        const k = [...document.querySelectorAll('[data-group="' + g + '"]')].find(x => x.getClientRects().length);
        if (!k) return null; k.click(); return true;
      }, g);
      if (!da) { console.log('  · ' + g + ': kein Knopf für diese Rolle'); continue; }
      await p.waitForTimeout(900);
      const m = await p.evaluate(() => {
        const v = document.querySelector('.view.show');
        const zeile = v && [...v.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim().length > 3 && e.getClientRects().length && e.getBoundingClientRect().top > 0);
        window.__smZeile = zeile || null;
        const r = zeile ? zeile.getBoundingClientRect() : null;
        return { id: v && v.id, breit: document.documentElement.scrollWidth > innerWidth + 1,
          rect: r && r.width > 4 && r.height > 4 ? { x: Math.max(0, r.left), y: Math.max(0, r.top), width: Math.max(4, Math.min(r.width, innerWidth - r.left)), height: Math.max(4, Math.min(r.height, innerHeight - r.top)) } : null };
      });
      pruefe(g + ': Ansicht offen (' + m.id + ')', !!m.id);
      pruefe(g + ': nicht breiter als das Fenster', !m.breit);
      if (m.rect) {
        const z = await gezeichnet(p, m.rect);
        pruefe(g + ': erste Zeile ist gezeichnet (PNG ' + z.mit + ' Byte mit, ' + z.ohne + ' ohne Text)', z.mit > z.ohne * 1.05 + 50);
      } else pruefe(g + ': eine Zeile mit Text im Bild', false);
      pruefe(g + ': keine Seitenfehler beim Wechsel', fehler.length === vorher, fehler.slice(vorher).join(' | '));
    }
    if (opt.isMobile) {
      const nav = await p.evaluate(() => {
        const n = document.getElementById('mobnav'); if (!n || !n.getClientRects().length) return { da: false };
        const r = n.getBoundingClientRect();
        const knoepfe = [...n.querySelectorAll('button')].filter(k => k.getClientRects().length);
        const treffen = knoepfe.filter(k => { const kr = k.getBoundingClientRect(); const t = document.elementFromPoint(kr.left + kr.width / 2, kr.top + kr.height / 2); return t && (t === k || k.contains(t)); }).length;
        return { da: true, imBild: r.bottom <= innerHeight + 1 && r.top >= 0, knoepfe: knoepfe.length, treffen };
      });
      pruefe('untere Leiste im Bild', nav.da && nav.imBild, JSON.stringify(nav));
      pruefe('jeder Knopf der Leiste trifft sich selbst (' + nav.treffen + '/' + nav.knoepfe + ')', nav.da && nav.knoepfe > 0 && nav.treffen === nav.knoepfe);
    }
    await ctx.close();
  }
  await b.close();
  console.log('\n' + (schlecht ? '✗ ' : '✓ ') + 'Safari-Motor: ' + gut + ' grün, ' + schlecht + ' rot');
  console.log('Fehler: ' + (schlecht ? schlecht + ' Prüfung(en)' : 'keine'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); console.log('Fehler: ' + e.message.slice(0, 120)); process.exit(1); });
