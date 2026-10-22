/* ══════════════════════════════════════════════════════════════════════
   FORMI ANGEDOCKT (Runde 193, 22.10.2026)

   Aus dem Betrieb, auf „am Rechner als feste Spalte andocken oder
   schwebend?": „was sinnvoller ist". Entschieden: ab 1440 px dockt das
   kleine Formi-Fenster rechts als Spalte an und macht die App schmaler,
   statt sie zu verdecken. Darunter schwebt es weiter.

   Geprüft wird:
    1. Lage: ab 1440 px Spalte von oben bis unten am rechten Rand, die App
       endet genau an ihrer Kante (1440: 380 px, 1920: 420 px). Bei 1280
       und am Handy wie bisher. Zu → die App hat wieder die volle Breite.
    2. Formi bleibt angedockt, wenn man selbst die Seite wechselt.
    3. Für JEDE Ansicht und jeden Reiter, je Rolle (Chef, Leitung,
       Mitarbeiter), bei 1440 × 900 und 1920 × 1080, normal und kompakt:
       Jedes Bedienelement, das ohne Formi bedienbar ist, ist es auch mit
       angedocktem Formi — ins Bild geholt, trifft der Hit-Test in seiner
       Mitte das Element selbst, und es liegt links der Spalte. Dazu kein
       Querlauf. Verglichen wird mit derselben Ansicht OHNE Formi: was dort
       schon nicht trifft, ist nicht von hier (wird gezählt, nicht
       verschwiegen).
    4. Trefferflächen der Knöpfe im Spaltenkopf ≥ 44 × 44.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

/* Läuft in der Seite: alle Bedienelemente der Ansicht, je mit „trifft"
   (Hit-Test in der Mitte, nachdem es ins Bild geholt wurde) und „links
   der Spalte". Schlüssel ist ein Name aus Kennung/Klasse/Text, damit sich
   die Messung mit und ohne Formi vergleichen lässt. */
const MESSEN = () => {
  const j = document.getElementById('jarvis');
  const spalte = j && !j.hidden ? j.getBoundingClientRect().left : innerWidth;
  const sel = 'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=checkbox], [role=switch], summary, label[for]';
  const view = document.querySelector('.view.show');
  const zugeklappt = [...view.querySelectorAll('details:not([open])')];
  zugeklappt.forEach(d => { d.open = true; });
  const wurzeln = [view, document.getElementById('side'), document.querySelector('.topbar')].filter(Boolean);
  const alle = new Set();
  wurzeln.forEach(w => w.querySelectorAll(sel).forEach(e => alle.add(e)));
  const name = (el) => (el.id ? '#' + el.id : el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')) +
    ' „' + (el.getAttribute('aria-label') || el.textContent || el.placeholder || '').trim().replace(/\s+/g, ' ').slice(0, 24) + '"';
  const aus = {};
  const zaehler = {};
  alle.forEach(el => {
    if (el.closest('#jarvis, #formiKugel, [hidden]')) return;
    const zu = el.closest('details:not([open])');
    if (zu && !el.closest('summary')) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return;
    if (!el.getClientRects().length) return;
    const r0 = el.getBoundingClientRect();
    if (!r0.width || !r0.height) return;
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    const cx = Math.min(r.left + r.width / 2, innerWidth - 1), cy = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
    const t = document.elementFromPoint(cx, cy);
    let n = name(el); zaehler[n] = (zaehler[n] || 0) + 1; if (zaehler[n] > 1) n += ' #' + zaehler[n];
    aus[n] = { trifft: !!t && (t === el || el.contains(t) || (el.tagName === 'LABEL' && t.closest('label') === el)), links: r.right <= spalte + 1, unter: t && t.closest('#jarvis') ? 1 : 0 };
  });
  zugeklappt.forEach(d => { d.open = false; });
  document.querySelectorAll('.scroll-area').forEach(s => { s.scrollTop = 0; });
  view.querySelectorAll('*').forEach(e => { if (e.scrollLeft) e.scrollLeft = 0; });
  const m = document.querySelector('.main');
  return { aus, quer: document.documentElement.scrollWidth > innerWidth + 1, mainQuer: m.scrollWidth > m.clientWidth + 1 };
};

async function oeffne(b, w, h, stub) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await p.addInitScript({ path: SP + '/' + (stub || 'stub-chef.js') });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(900);
  p._ctx = ctx;
  return p;
}
const zeige = (p, id) => p.evaluate((id) => {
  history.pushState({ v: id }, '', '#' + id);
  window.dispatchEvent(new PopStateEvent('popstate', { state: { v: id } }));
}, id);
const aktuell = (p) => p.evaluate(() => ((document.querySelector('.view.show') || {}).id || '').replace('view-', ''));
const LAGE = () => {
  const j = document.getElementById('jarvis'), a = document.getElementById('app').getBoundingClientRect(), m = document.querySelector('.main').getBoundingClientRect();
  const r = j.getBoundingClientRect();
  return { offen: !j.hidden, l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
    appRechts: Math.round(a.left + a.width - parseFloat(getComputedStyle(document.getElementById('app')).paddingRight)), mainRechts: Math.round(m.right),
    angedockt: document.body.classList.contains('formi-angedockt') };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    /* ── 1. Lage ───────────────────────────────────────────────────── */
    console.log('\n── Lage ──');
    for (const [w, h, breit] of [[1440, 900, 380], [1920, 1080, 420], [1280, 800, 0], [820, 1180, 0], [390, 844, 0]]) {
      const p = await oeffne(b, w, h);
      await p.click('#formiKugel'); await p.waitForTimeout(500);
      const l = await p.evaluate(LAGE);
      if (breit) {
        pruefe(`${w} px: Spalte ${l.w} px breit, von oben bis unten am rechten Rand`, l.w === breit && l.t === 0 && l.h === h && l.l + l.w === w, JSON.stringify(l));
        pruefe(`${w} px: der Inhalt endet an der Spalte (${l.mainRechts} = ${l.l})`, Math.abs(l.mainRechts - l.l) <= 1, JSON.stringify(l));
        const knoepfe = await p.evaluate(() => ['jarvisMehr', 'jarvisGroesse', 'jarvisZu', 'jarvisSenden'].map(id => {
          const el = document.getElementById(id); if (!el || !el.getClientRects().length) return id + ':fehlt';
          const r = el.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return (t && (t === el || el.contains(t)) && r.width >= 44 && r.height >= 44 && r.right <= innerWidth && r.bottom <= innerHeight) ? 'ok' : id + ':' + Math.round(r.width) + '×' + Math.round(r.height);
        }));
        pruefe(`${w} px: „…“ (seit Runde 209), Groß, Schließen, Senden ≥ 44 × 44, frei, im Bild`, knoepfe.every(k => k === 'ok'), knoepfe.join(' '));
      } else {
        /* Nicht angedockt: der Inhalt behält die volle Breite, und das
           Fenster ist keine Spalte von oben (am Handy ein Blatt von
           unten, bei 1280 schwebend). */
        pruefe(`${w} px: nicht angedockt — der Inhalt behält die volle Breite`, l.mainRechts === w && l.t > 0, JSON.stringify(l));
      }
      await p.click('#jarvisZu'); await p.waitForTimeout(300);
      const zu = await p.evaluate(LAGE);
      pruefe(`${w} px: Formi zu → volle Breite, keine Klasse mehr`, !zu.offen && !zu.angedockt && zu.mainRechts === w, JSON.stringify(zu));
      pruefe(`${w} px: keine Fehler auf der Seite`, !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }

    /* ── 2. Bleibt beim Seitenwechsel ──────────────────────────────── */
    console.log('\n── Seitenwechsel ──');
    {
      const p = await oeffne(b, 1440, 900);
      await p.click('#formiKugel'); await p.waitForTimeout(400);
      await p.evaluate(() => document.querySelector('#side [data-group="g-arbeit"]').click()); await p.waitForTimeout(500);
      const l = await p.evaluate(LAGE);
      pruefe('Seite selbst gewechselt: Formi bleibt angedockt', l.offen && l.angedockt && l.w === 380, JSON.stringify(l));
      await p._ctx.close();
    }

    /* ── 3. Jede Ansicht, jeder Reiter ─────────────────────────────── */
    console.log('\n── Jede Ansicht: nichts verdeckt, nichts quer ──');
    const rollen = [['stub-chef.js', 'Chef'], ['stub-leiter.js', 'Leitung'], ['stub-mitarbeiter.js', 'Mitarbeiter']];
    let ansichten = 0, elemente = 0, schonVorher = 0;
    for (const [stub, rolle] of rollen) {
      for (const [w, h] of [[1440, 900], [1920, 1080]]) {
        for (const dichte of ['normal', 'kompakt']) {
          const p = await oeffne(b, w, h, stub);
          if (dichte === 'kompakt') await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt'));
          const ids = await p.evaluate(() => [...document.querySelectorAll('section.view[id^="view-"]')].map(s => s.id.replace('view-', '')));
          const funde = [];
          for (const id of ids) {
            await zeige(p, id); await p.waitForTimeout(300);
            if ((await aktuell(p)) !== id) continue;
            const reiter = await p.evaluate(() => [...document.querySelectorAll('.view.show [role=tab]')].filter(t => t.getClientRects().length).length);
            for (let t = -1; t < Math.min(reiter, 14); t++) {
              if (t >= 0) {
                await p.evaluate((t) => { const l = [...document.querySelectorAll('.view.show [role=tab]')].filter(x => x.getClientRects().length); if (l[t]) l[t].click(); }, t);
                await p.waitForTimeout(220);
              }
              const ohne = await p.evaluate(MESSEN);
              /* Formi auf: die Kugel, oder — wo es keine gibt (Chat) — die
                 Taste J; geht beides nicht, ist hier nichts zu prüfen. */
              await p.evaluate(() => { const k = document.getElementById('formiKugel'); if (k && !k.hidden) k.click(); else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', bubbles: true })); });
              await p.waitForTimeout(250);
              const offen = await p.evaluate(() => document.body.classList.contains('formi-angedockt'));
              if (!offen) { continue; }
              if ((await aktuell(p)) !== id) { await zeige(p, id); await p.waitForTimeout(250); }
              const mit = await p.evaluate(MESSEN);
              ansichten++;
              const wo = id + (t >= 0 ? ' · Reiter ' + (t + 1) : '');
              if (mit.quer && !ohne.quer) funde.push(wo + ': Querlauf');
              if (mit.mainQuer && !ohne.mainQuer) funde.push(wo + ': Inhalt läuft seitlich über');
              Object.keys(mit.aus).forEach(n => {
                const a = mit.aus[n], v = ohne.aus[n];
                elemente++;
                if (!v || !v.trifft) { if (!a.trifft) schonVorher++; return; }
                if (!a.trifft || !a.links) funde.push(wo + ': ' + n + (a.unter ? ' (unter der Spalte)' : !a.links ? ' (rechts der Kante)' : ' (verdeckt)'));
              });
              await p.evaluate(() => { const z = document.getElementById('jarvisZu'); if (z && z.getClientRects().length) z.click(); });
              await p.waitForTimeout(200);
              /* Formi zu kann die Ansicht nicht wechseln — falls doch, zurück. */
              if ((await aktuell(p)) !== id) { await zeige(p, id); await p.waitForTimeout(250); }
            }
          }
          pruefe(`${rolle} ${w}×${h} ${dichte}: angedockt nichts verdeckt, nichts quer`, !funde.length, funde.slice(0, 10).join(' | ') + (funde.length > 10 ? ' … +' + (funde.length - 10) : ''));
          if (p._fehler.length) pruefe(`${rolle} ${w}×${h} ${dichte}: keine Seitenfehler`, false, p._fehler.join(' | '));
          await p._ctx.close();
        }
      }
    }
    console.log(`\nGemessen: ${ansichten} Ansichten/Reiter mit angedocktem Formi, ${elemente} Bedienelemente; ${schonVorher} trafen schon OHNE Formi nicht (nicht von hier).`);
  } catch (e) {
    console.log('Fehler: ' + e.message.split('\n')[0]);
    schlecht++;
  }
  await b.close();
  console.log(schlecht ? `\n✗ Formi angedockt: ${schlecht} von ${gut + schlecht} falsch` : `\n✓ Formi angedockt: ${gut} Zusicherungen`);
  process.exit(schlecht ? 1 : 0);
})();
