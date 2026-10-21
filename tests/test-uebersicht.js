/* ══════════════════════════════════════════════════════════════════════
   ÜBERSICHTLICHER, TEIL 1 (Runde 170)

   Aus dem Betrieb, 21.10.2026: „grade sieht alles aus wie ein komplettes
   durcheinander" — auf beiden Geräten. Und: „assistent bleibt formi und
   den können wir mehr nutzen und einbauen".

   Geprüft wird:
    1. Ein Name: nirgends sichtbar „Studio-Gehirn" oder „Jarvis" —
       weder auf der Startseite noch in „Alles" noch im Formi-Fenster.
    2. Die Kopfzeile trägt kein Hell/Dunkel mehr, auf keiner Breite.
       Hell/Dunkel ist weiter unter Profil → Aussehen erreichbar.
    3. Die Suche bietet unter jedem Suchbegriff „Formi fragen" an —
       mit Treffern und ohne. Ein Tipp öffnet Formi mit dem Satz im
       Feld, schickt aber NICHT ab. Ein normaler Treffer führt weiter
       dorthin, wo er hingehört.
    4. Eine fremde Firma ohne Formi sieht die Zeile nicht.
    5. Die Zeile ist ≥ 44 px hoch und so breit wie die Liste — per
       Hit-Test, normal und kompakt, 320 / 390 / 430 / 820 und am
       Rechner 1280 / 1440 / 1920.
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
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  if (opt.vorher) await p.addInitScript(opt.vorher);
  await p.addInitScript({ path: SP + '/' + (opt.stub || 'stub-chef.js') });
  await p.goto(APP + (opt.neu === undefined ? '' : '?neu=' + opt.neu), { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(600);
  p._ctx = ctx;
  return p;
}
const zu = (p) => p._ctx.close();
const sichtbar = (p, sel) => p.evaluate((s) => {
  const el = document.querySelector(s);
  return !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none'
    && getComputedStyle(el).visibility !== 'hidden';
}, sel);
const alteNamen = (p) => p.evaluate(() => {
  const t = document.body.innerText;
  const m = t.match(/[^\n]{0,40}(Studio-Gehirn|Jarvis)[^\n]{0,40}/);
  return m ? m[0] : '';
});
const suche = async (p, text) => {
  await p.evaluate(() => document.getElementById('searchBtn').click());
  await p.waitForTimeout(200);
  await p.fill('#searchInput', text);
  await p.waitForTimeout(200);
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1 Ein Name: Formi ──');
  for (const [w, h, neu] of [[390, 844, 1], [1440, 900, 1], [390, 844, 0], [1440, 900, 0]]) {
    const p = await oeffne(b, w, h, { neu });
    const nm = w + ' px ' + (neu ? 'neu' : 'bisher');
    pruefe(nm + ': Startseite ohne „Studio-Gehirn"/„Jarvis"', !(await alteNamen(p)), await alteNamen(p));
    const kachel = await p.evaluate(() => [...document.querySelectorAll('.jv-kachel')]
      .filter(e => e.getClientRects().length).map(e => e.textContent.trim()).join('|'));
    pruefe(nm + ': der sichtbare Knopf heisst „Formi"', /^(Formi\|?)+$/.test(kachel), kachel);
    await p.evaluate(async () => {
      const g = document.getElementById('bereichKopf');
      if (g && g.getClientRects().length) g.click();
      else { const s = [...document.querySelectorAll('#side [data-group="g-alles"], #side button, #side a')].find(e => /Alles/.test(e.textContent)); if (s) s.click(); }
      for (let i = 0; i < 30 && !document.querySelector('[data-alles="gehirn"]'); i++) await new Promise(r => setTimeout(r, 100));
    });
    const zeile = await p.evaluate(() => { const z = [...document.querySelectorAll('[data-alles="gehirn"]')].find(e => e.getClientRects().length); return z ? z.innerText : ''; });
    if (neu) pruefe(nm + ': „Alles" führt Formi unter seinem Namen', /Formi/.test(zeile) && !/Gehirn/.test(zeile), zeile);
    pruefe(nm + ': auch „Alles" ohne alte Namen', !(await alteNamen(p)), await alteNamen(p));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
    const knopf = await p.evaluate(() => ['#jarvisStart', '#jarvisStartAlt', '#jarvisStartPc'].find(s => {
      const el = document.querySelector(s); return el && el.getClientRects().length && getComputedStyle(el).display !== 'none'; }) || null);
    if (knopf) await p.click(knopf);
    await p.waitForTimeout(300);
    const titel = await p.evaluate(() => document.getElementById('jarvisTitel').textContent);
    pruefe(nm + ': das Fenster heisst Formi', titel === 'Formi', titel);
    pruefe(nm + ': keine Fehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 2 Kopfzeile ohne Hell/Dunkel ──');
  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h);
    pruefe(w + ' px: kein Hell/Dunkel oben', !(await sichtbar(p, '#themeBtn')));
    const griffe = await p.evaluate(() => [...document.querySelectorAll('.topbar button, .topbar .avatar')]
      .filter(e => e.getClientRects().length && getComputedStyle(e).display !== 'none').length);
    console.log('    ' + w + ' px: ' + griffe + ' Griffe in der Kopfzeile');
    await zu(p);
  }
  {
    const p = await oeffne(b, 1440, 900);
    await p.evaluate(() => document.getElementById('uAvatar').click());
    await p.waitForTimeout(300);
    await p.evaluate(() => { const r = [...document.querySelectorAll('#profileModal button, #profileModal [data-tab]')].find(e => /Aussehen/.test(e.textContent)); if (r) r.click(); });
    await p.waitForTimeout(300);
    const hd = await p.evaluate(() => /Hell/.test(document.getElementById('profileModal').innerText) && /Dunkel/.test(document.getElementById('profileModal').innerText));
    pruefe('Hell/Dunkel bleibt unter Profil → Aussehen', hd);
    await zu(p);
  }

  console.log('\n── 3 Suche → Formi ──');
  {
    const p = await oeffne(b, 1440, 900);
    await suche(p, 'Wer hat heute Dienst?');
    pruefe('ohne Treffer: „Nichts gefunden" und „Formi fragen"', await sichtbar(p, '.search-empty') && await sichtbar(p, '#sucheFormi'));
    const z = await p.evaluate(() => document.getElementById('sucheFormi').innerText);
    pruefe('die Zeile nennt den Satz', /Formi fragen: „Wer hat heute Dienst\?“/.test(z), z);
    let gerufen = 0;
    await p.exposeFunction('__gerufen', () => { gerufen++; });
    await p.evaluate(() => {
      ['gehirnAktion', 'gehirnFrage'].forEach(n => {
        window.__antwort = window.__antwort || {};
        window.__antwort[n] = () => { window.__gerufen(); return Promise.resolve({ data: { art: 'frage', antwort: 'x' } }); };
      });
    });
    await p.click('#sucheFormi');
    await p.waitForTimeout(400);
    pruefe('Tipp: Suche zu, Formi offen', !(await sichtbar(p, '#searchOverlay')) && await sichtbar(p, '#jarvis'));
    pruefe('der Satz steht im Feld, so wie getippt', (await p.inputValue('#jarvisFeld')) === 'Wer hat heute Dienst?');
    pruefe('abgeschickt ist noch nichts', gerufen === 0, String(gerufen));
    pruefe('das Feld hat den Fokus', await p.evaluate(() => document.activeElement && document.activeElement.id === 'jarvisFeld'));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(300);

    // Mit Treffern: Formi steht UNTER den Treffern, die Treffer führen weiter
    const name = 'en';
    await suche(p, name);
    const lage = await p.evaluate(() => {
      const kinder = [...document.getElementById('searchResults').children];
      return { n: kinder.filter(k => k.matches('.sr[data-view]')).length, letzte: kinder.length ? kinder[kinder.length - 1].id : '' };
    });
    pruefe('mit Treffern: Formi als letzte Zeile', lage.n > 0 && lage.letzte === 'sucheFormi', JSON.stringify(lage) + ' Suche: ' + name);
    const ziel = await p.evaluate(() => { const t = document.querySelector('#searchResults .sr[data-view]'); t.click(); return t.dataset.view; });
    await p.waitForTimeout(400);
    const jetzt = await p.evaluate(() => (document.querySelector('.view.show') || {}).id || '');
    pruefe('ein normaler Treffer führt weiter zur Ansicht', jetzt === 'view-' + ziel && !(await sichtbar(p, '#jarvis')), ziel + ' → ' + jetzt);
    pruefe('keine Fehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 4 Fremde Firma: keine Formi-Zeile ──');
  {
    const p = await oeffne(b, 1440, 900, { vorher: () => { window.__firma = 'fremd-ab12'; } });
    await suche(p, 'Wer hat heute Dienst?');
    pruefe('fremde Firma: die Suche selbst antwortet (Gegenprobe)', await sichtbar(p, '.search-empty'));
    pruefe('fremde Firma: keine Formi-Zeile', !(await sichtbar(p, '#sucheFormi')));
    await zu(p);
  }

  console.log('\n── 5 Trefferfläche der Zeile ──');
  for (const dichte of ['normal', 'kompakt']) {
    for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      const p = await oeffne(b, w, h);
      if (dichte === 'kompakt') await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt'));
      await suche(p, 'Wer hat heute Dienst?');
      const m = await p.evaluate((T) => {
        const el = document.getElementById('sucheFormi'); if (!el) return null;
        el.scrollIntoView({ block: 'center' });
        const f = new Function('return ' + T)();
        const r = el.getBoundingClientRect();
        const liste = document.getElementById('searchResults').getBoundingClientRect();
        return Object.assign(f(el), { rw: Math.round(r.width), lw: Math.round(liste.width), rechts: r.right <= innerWidth, links: r.left >= 0 });
      }, TREFFER.toString());
      pruefe(dichte + ' ' + w + ' px: ≥ 44 hoch, ≥ 44 breit, im Bild', m && m.h >= 44 && m.w >= 44 && m.rechts && m.links, JSON.stringify(m));
      await zu(p);
    }
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Übersicht: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Übersicht: ein Name, ruhigere Kopfzeile, Formi aus der Suche — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
