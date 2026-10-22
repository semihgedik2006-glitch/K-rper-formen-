/* ══ FORMI WOHNT AM RECHNER IN DER SEITENLEISTE; CHAT-MELDUNGEN (Runde 198) ══
   Aus dem Betrieb, 22.10.2026, auf drei Fragen: „1. a 2. ja lassen wir so
   3. ja".

   1. Am Rechner sitzt die Formi-Kugel unten in der Seitenleiste, nicht
      mehr unten rechts. Unter .main liegt KEIN leerer Streifen mehr (vorher
      90 px über die ganze Breite): der Inhalt reicht bis an den unteren
      Rand. Die Kugel verdeckt kein Bedienelement der Seitenleiste, und
      sie trifft ≥ 44 × 44. Gemessen bei 1280/1440/1920, normal und
      kompakt. GEGENPROBE: am Handy bleibt sie unten rechts über der Leiste.
   3. Auf einem NEUEN Gerät (kein kf_prefs) ist „Alle Chat-Nachrichten"
      als Meldung aus, die anderen Meldungen an. GEGENPROBE: Ein Gerät, das
      schon eingerichtet war, behält „an" – mit gespeicherter Wahl UND mit
      altem kf_prefs ohne notify.
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
async function oeffne(b, w, h, prefs) {
  const handy = w <= 820;
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    handy ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript((pr) => {
    try {
      localStorage.setItem('kf_tour', '1:testuid');
      if (pr !== undefined) localStorage.setItem('kf_prefs', pr);
    } catch (e) {}
  }, prefs);
  await p.addInitScript({ path: SP + '/stub-chef.js' });
  await p.goto(APP + '?neu=1', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(800);
  p._ctx = ctx;
  return p;
}
const zu = (p) => p._ctx.close();

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1 Formi in der Seitenleiste ──');
  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.waitForTimeout(200);
      const m = await p.evaluate((SRC) => {
        const T = eval('(' + SRC + ')');
        const k = document.getElementById('formiKugel'), s = document.getElementById('side');
        const kr = k.getBoundingClientRect(), sr = s.getBoundingClientRect();
        const sa = document.querySelector('.view.show .scroll-area').getBoundingClientRect();
        /* Was in der Seitenleiste bedienbar ist, darf nicht unter der Kugel liegen. */
        const unter = [...s.querySelectorAll('button')].filter(e => e.getClientRects().length).filter(e => {
          const r = e.getBoundingClientRect();
          return !(r.bottom <= kr.top || r.top >= kr.bottom || r.right <= kr.left || r.left >= kr.right);
        }).map(e => e.textContent.trim());
        return { inLeiste: kr.left >= sr.left && kr.right <= sr.right && kr.bottom <= innerHeight,
          streifen: Math.round(innerHeight - sa.bottom), unter, treffer: T(k) };
      }, TREFFER.toString());
      pruefe(w + ' px ' + dichte + ': Kugel unten in der Seitenleiste', m.inLeiste, JSON.stringify(m));
      pruefe(w + ' px ' + dichte + ': kein leerer Streifen unter der Seite (' + m.streifen + ' px)', m.streifen <= 1, String(m.streifen));
      pruefe(w + ' px ' + dichte + ': die Kugel liegt auf keinem Knopf der Leiste', !m.unter.length, m.unter.join('|'));
      pruefe(w + ' px ' + dichte + ': die Kugel trifft ' + m.treffer.w + '×' + m.treffer.h, m.treffer.w >= 44 && m.treffer.h >= 44);
    }
    await p.click('#formiKugel'); await p.waitForTimeout(400);
    pruefe(w + ' px: ein Klick öffnet Formi', await p.evaluate(() => { const j = document.getElementById('jarvis'); return !!j && !!j.getClientRects().length; }));
    pruefe(w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }
  {
    const p = await oeffne(b, 390, 844);
    const m = await p.evaluate(() => { const r = document.getElementById('formiKugel').getBoundingClientRect(); return { rechts: r.right > innerWidth - 40, ueberLeiste: r.bottom <= innerHeight - 68 }; });
    pruefe('GEGENPROBE Handy: die Kugel bleibt unten rechts über der Leiste', m.rechts && m.ueberLeiste, JSON.stringify(m));
    await zu(p);
  }

  console.log('\n── 3 „Alle Chat-Nachrichten" auf neuen Geräten aus ──');
  const schalter = async (p) => {
    await p.click('#uAvatar'); await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelector('[data-pmtab="melden"]').click());
    await p.waitForTimeout(300);
    return p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#notifyOpts [data-nk]')]
      .map(e => [e.getAttribute('data-nk'), e.querySelector('.sw').classList.contains('on')])));
  };
  {
    const p = await oeffne(b, 1440, 900);
    const s = await schalter(p);
    pruefe('neues Gerät: „Alle Chat-Nachrichten" aus', s.chat === false, JSON.stringify(s));
    pruefe('neues Gerät: Erwähnungen, Direkt, Infos und Aufgaben an', s.mentions && s.dm && s.ann && s.todos, JSON.stringify(s));
    await zu(p);
  }
  {
    const p = await oeffne(b, 1440, 900, JSON.stringify({ theme: 'formi', notify: { chat: true, dm: true, ann: true, todos: true, mentions: true } }));
    const s = await schalter(p);
    pruefe('GEGENPROBE eingerichtetes Gerät mit gespeicherter Wahl: bleibt an', s.chat === true, JSON.stringify(s));
    await zu(p);
  }
  {
    const p = await oeffne(b, 1440, 900, JSON.stringify({ theme: 'formi' }));
    const s = await schalter(p);
    pruefe('GEGENPROBE eingerichtetes Gerät ohne notify (alte Fassung): bleibt an', s.chat === true, JSON.stringify(s));
    await zu(p);
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Formi-Platz: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Formi-Platz: Kugel in der Seitenleiste, kein Streifen, Chat-Meldungen auf neuen Geräten aus — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
