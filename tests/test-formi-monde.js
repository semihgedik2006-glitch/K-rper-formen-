/* ══════════════════════════════════════════════════════════════════════
   FORMI: MONDE, GEBURTSTAG, SERIE, JAHRESZEIT, ZEILE INS LOCH (Runde 302)

   Aus dem Betrieb (5.11.2026), auf die neuen Formi-Ideen: „alles davon
   ist super" – gebaut 1, 4, 5, 6 und 7.

   Geprüft wird:
    1. Studios als Monde (Leitung, nur am Rechner): je Studio ein Mond,
       Farbe = Ampel, Trefferfläche ≥ 44 × 44 per Hit-Test und ganz in
       der Karte, 1280 / 1440 / 1920, normal und kompakt; der Klick wählt
       das Studio; „Als Kacheln" und zurück; die Seite passt weiter auf
       einen Bildschirm. Am Handy (390, 820) bleiben die Kacheln.
    2. Geburtstagsmond: erscheint nur mit Anlass, 44 × 44, im Bild, liegt
       nicht auf der Kugel, 320 … 1920 px, normal und kompakt; Antippen
       zeigt „Heute im Team", „Gratulieren" ≥ 44 öffnet die
       Direktnachricht mit Vorschlag (geschickt wird nichts). Gegenprobe:
       ohne Anlass kein Mond. Nicht auf anderen Seiten.
    3. Serie: eine Woche komplett → Ring an der Kugel; fehlt ein Tag
       oder sind es unter fünf Arbeitstage → kein Ring.
    4. Jahreszeit: 24.12. wärmer, 21.6. heller, 31.12. Funkenregen, ein
       gewöhnlicher Tag ohne alles.
    5. Zeile ins Loch: beim Abhaken auf „Heute" fliegt ein Abbild der
       Zeile, danach ist es weg.
   Der echte Schreibweg (Firestore) ist hier nicht prüfbar; die Regel
   dazu prüft tests/rules/formi-serie.test.js.
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
  if (!el || !el.getClientRects().length) return { w: 0, h: 0, imBild: false };
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0, imBild: false, verdeckt: true };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--;
  while (u < innerHeight - 1 && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--;
  while (re < innerWidth - 1 && trifft(re + 1, cy)) re++;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1),
    imBild: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight };
};
const BREITEN = [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]];

async function oeffne(b, w, h, stub) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await p.addInitScript(() => { try { localStorage.removeItem('kf_ls_form'); } catch (e) {} });
  await p.addInitScript({ path: SP + '/' + (stub || 'stub-chef.js') });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(1200);
  p._ctx = ctx;
  return p;
}
const zu = (p) => p._ctx.close();
/* Lisa hat heute Geburtstag (teilt das Studio mit allen Stub-Konten). */
const LISA = () => {
  const d = new Date(), md = String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  return window.__formiLebt.personDazu({ uid: 'u77', name: 'Lisa Wagner', role: 'mitarbeiter', studios: ['Hürth'],
    studioKeys: ['studio-6'], bday: '1995-' + md, aktiv: true });
};
/* Die Tage der letzten Woche (Mo + i), als JJJJ-MM-TT. */
const TAGE = (n, ohne) => {
  const mo = new Date(window.__formiLebt.wochenStart() + 'T12:00:00'); mo.setDate(mo.getDate() - 7);
  const l = []; for (let i = 0; i < n; i++) { if (i === ohne) continue; const d = new Date(mo); d.setDate(mo.getDate() + i); l.push(d.toLocaleDateString('sv-SE')); }
  return l;
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── 1 Studios als Monde ──');
    for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
      const p = await oeffne(b, w, h, 'stub-chef.js');
      for (const dichte of ['normal', 'kompakt']) {
        await p.evaluate((d) => { document.body.dataset.dichte = d; window.renderHeute && 0; }, dichte);
        await p.waitForTimeout(300);
        const m = await p.evaluate((T) => {
          const t = eval('(' + T + ')'), karte = document.querySelector('.ls-monde');
          if (!karte) return { karte: false };
          const k = karte.getBoundingClientRect(), monde = [...karte.querySelectorAll('.lm-mond')];
          const sa = karte.closest('.scroll-area');
          return { karte: true, n: monde.length, kacheln: document.querySelectorAll('.ls-kachel[data-lswahl]').length,
            klein: monde.map(x => ({ n: x.querySelector('b').textContent, ...t(x) })).filter(x => x.w < 44 || x.h < 44).map(x => x.n + ' ' + x.w + '×' + x.h),
            draussen: monde.filter(x => { const r = x.getBoundingClientRect(); return r.left < k.left - 1 || r.right > k.right + 1 || r.top < k.top - 1 || r.bottom > k.bottom + 1; }).map(x => x.querySelector('b').textContent),
            /* Überlappen sich zwei Monde (Trefferflächen)? */
            ueber: monde.flatMap((a, i) => monde.slice(i + 1).filter(c => { const r = a.getBoundingClientRect(), q = c.getBoundingClientRect();
              return Math.min(r.right, q.right) - Math.max(r.left, q.left) > 2 && Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > 2; })
              .map(c => a.querySelector('b').textContent + '/' + c.querySelector('b').textContent)),
            farben: [...new Set(monde.map(x => getComputedStyle(x.querySelector('.lm-kugel'), '::before').backgroundColor))].length,
            rot: monde.filter(x => x.classList.contains('rot')).length,
            passt: sa ? sa.scrollHeight <= sa.clientHeight + 2 : null, quer: document.documentElement.scrollWidth - innerWidth,
            form: t(karte.querySelector('[data-lsform]')) };
        }, TREFFER.toString());
        pruefe(`${w} px ${dichte}: ${m.n} Monde statt Kacheln, alle ≥ 44 × 44, in der Karte, ohne Überlappung; „Als Kacheln" ${m.form && m.form.w}×${m.form && m.form.h}; Seite passt (${m.passt}), kein Querlauf`,
          m.karte && m.n >= 12 && m.kacheln === 0 && !m.klein.length && !m.draussen.length && !m.ueber.length && m.rot >= 1 &&
          m.form.w >= 44 && m.form.h >= 44 && m.passt !== false && m.quer <= 0, JSON.stringify(m));
      }
      if (w === 1440) {
        const vorher = await p.evaluate(() => document.querySelector('.lm-mond[aria-pressed="true"] b').textContent);
        const ziel = await p.evaluate(() => { const x = [...document.querySelectorAll('.lm-mond')].find(m => m.getAttribute('aria-pressed') !== 'true'); return x.querySelector('b').textContent; });
        await p.click(`.lm-mond:has(b:text-is("${ziel}"))`);
        await p.waitForTimeout(400);
        const nachher = await p.evaluate(() => ({ gew: document.querySelector('.lm-mond[aria-pressed="true"] b').textContent,
          detail: (document.querySelector('.ls-detail h3') || {}).textContent || '' }));
        pruefe(`Klick auf den Mond „${ziel}" zeigt das Studio (vorher ${vorher})`, nachher.gew === ziel && nachher.detail.includes(ziel), JSON.stringify(nachher));
        await p.click('.lm-form'); await p.waitForTimeout(400);
        const k = await p.evaluate((T) => ({ monde: document.querySelectorAll('.lm-mond').length, kacheln: document.querySelectorAll('.ls-kachel[data-lswahl]').length,
          zur: eval('(' + T + ')')(document.querySelector('[data-lsform="monde"]')), gemerkt: localStorage.getItem('kf_ls_form') }), TREFFER.toString());
        pruefe(`„Als Kacheln": Kacheln da, gemerkt; „Als Monde" ${k.zur.w}×${k.zur.h}`, k.monde === 0 && k.kacheln >= 12 && k.gemerkt === 'kacheln' && k.zur.w >= 44 && k.zur.h >= 44, JSON.stringify(k));
        await p.click('[data-lsform="monde"]'); await p.waitForTimeout(400);
        pruefe('„Als Monde" zurück', await p.evaluate(() => document.querySelectorAll('.lm-mond').length >= 12));
      }
      pruefe(`${w} px: keine Skriptfehler`, !p._fehler.length, p._fehler.join(' | '));
      await zu(p);
    }
    for (const [w, h] of [[390, 844], [820, 1180]]) {
      const p = await oeffne(b, w, h, 'stub-chef.js');
      const m = await p.evaluate(() => ({ monde: document.querySelectorAll('.lm-mond').length, kacheln: document.querySelectorAll('.ls-kachel[data-lswahl]').length,
        form: document.querySelectorAll('[data-lsform]').length }));
      pruefe(`${w} px (Handy/Tablet): Kacheln aus der Skizze, keine Monde, kein Umschalter`, m.monde === 0 && m.kacheln >= 12 && m.form === 0, JSON.stringify(m));
      await zu(p);
    }

    console.log('\n── 2 Geburtstagsmond ──');
    {
      const p = await oeffne(b, 390, 844, 'stub-mitarbeiter.js');
      await p.waitForTimeout(800);
      pruefe('Gegenprobe: ohne Anlass kein Mond', await p.evaluate(() => { const m = document.getElementById('formiMond'); return !m || m.hidden; }));
      await zu(p);
    }
    for (const [w, h] of BREITEN) {
      const stub = w >= 1100 ? 'stub-leiter.js' : 'stub-mitarbeiter.js';
      const p = await oeffne(b, w, h, stub);
      const n = await p.evaluate(LISA);
      await p.waitForTimeout(700);
      for (const dichte of ['normal', 'kompakt']) {
        await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
        await p.waitForTimeout(1300);
        const m = await p.evaluate((T) => {
          const t = eval('(' + T + ')'), m = document.getElementById('formiMond'), k = document.getElementById('formiKugel');
          if (!m || m.hidden) return { da: false };
          const r = m.getBoundingClientRect(), q = k.getBoundingClientRect();
          return { da: true, ...t(m), label: m.getAttribute('aria-label'),
            aufKugel: Math.min(r.right, q.right) - Math.max(r.left, q.left) > 0 && Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > 0 };
        }, TREFFER.toString());
        pruefe(`${w} px ${dichte} (${stub.replace(/stub-|\.js/g, '')}): Mond ${m.w}×${m.h}, im Bild, nicht auf der Kugel — „${m.label}"`,
          n >= 1 && m.da && m.w >= 44 && m.h >= 44 && m.imBild && !m.aufKugel && /Lisa hat heute Geburtstag/.test(m.label || ''), JSON.stringify(m));
      }
      if (w === 390 || w === 1440) {
        await p.click('#formiMond'); await p.waitForTimeout(350);
        const c = await p.evaluate((T) => {
          const t = eval('(' + T + ')'), c = document.getElementById('formiMondKarte');
          return { offen: !!c && !c.hidden, text: c ? c.textContent : '', grat: t(c.querySelector('.fmk-gratulieren')), zu: t(c.querySelector('.fmk-zu')),
            imBild: (() => { const r = c.getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; })() };
        }, TREFFER.toString());
        pruefe(`${w} px: Antippen zeigt „Heute im Team" (im Bild), Gratulieren ${c.grat.w}×${c.grat.h}, Schliessen ${c.zu.w}×${c.zu.h}`,
          c.offen && /Lisa hat heute Geburtstag/.test(c.text) && c.imBild && c.grat.w >= 44 && c.grat.h >= 44 && c.zu.w >= 44 && c.zu.h >= 44, JSON.stringify(c));
        await p.keyboard.press('Escape'); await p.waitForTimeout(150);
        pruefe(`${w} px: Esc schliesst die Karte`, await p.evaluate(() => document.getElementById('formiMondKarte').hidden));
        await p.click('#formiMond'); await p.waitForTimeout(250);
        await p.click('.fmk-gratulieren'); await p.waitForTimeout(900);
        const g = await p.evaluate(() => ({ hash: location.hash, peer: document.getElementById('dmPeer').textContent,
          text: document.getElementById('dmText').value, mond: (document.getElementById('formiMond') || {}).hidden }));
        pruefe(`${w} px: „Gratulieren" öffnet die Nachricht an Lisa mit Vorschlag (nicht gesendet); der Mond ist auf anderen Seiten weg`,
          g.hash === '#dm' && g.peer === 'Lisa Wagner' && /Alles Gute zum Geburtstag, Lisa/.test(g.text) && g.mond === true, JSON.stringify(g));
      }
      pruefe(`${w} px: keine Skriptfehler`, !p._fehler.length, p._fehler.join(' | '));
      await zu(p);
    }

    console.log('\n── 3 Serie ──');
    {
      const p = await oeffne(b, 1440, 900, 'stub-leiter.js');
      const fall = async (n, ohne) => {
        const ok = await p.evaluate(([T, n, o]) => window.__formiLebt.putzTage('studio-6', eval('(' + T + ')')(n, o)), [TAGE.toString(), n, ohne]);
        await p.waitForTimeout(1000);
        return p.evaluate(() => { const k = document.getElementById('formiKugel'), r = k.querySelector('.fk-serie-ring');
          return { klasse: k.classList.contains('fk-serie'), deck: r ? +getComputedStyle(r).opacity : 0, stand: k.querySelector('.fk-stand').textContent,
            mondRing: !!document.querySelector('.lm-mond.serie') }; }).then(x => Object.assign(x, { ok }));
      };
      let s = await fall(6, -1);
      pruefe(`sechs Arbeitstage komplett → heller Ring (Deckkraft ${s.deck}), im Schild, und am Mond des Studios`, s.ok && s.klasse && s.deck > .9 && /Putzplan letzte Woche komplett/.test(s.stand) && s.mondRing, JSON.stringify(s));
      s = await fall(6, 2);
      pruefe('Gegenprobe: ein Tag fehlt an allen Punkten (fünf Arbeitstage bleiben) → Ring bleibt, denn der Tag gilt als zu', s.ok === true && s.klasse, JSON.stringify(s));
      s = await fall(4, -1);
      pruefe('Gegenprobe: nur vier Arbeitstage → kein Ring', !s.ok && !s.klasse && s.deck < .1, JSON.stringify(s));
      /* Ein täglicher Punkt fehlt an einem Arbeitstag, an dem andere abgehakt wurden. */
      const luecke = await p.evaluate((T) => { const t = eval('(' + T + ')')(6, -1); return window.__formiLebt.putzTage('studio-6', t, t[3]); }, TAGE.toString());
      await p.waitForTimeout(1000);
      const k2 = await p.evaluate(() => document.getElementById('formiKugel').classList.contains('fk-serie'));
      pruefe('Gegenprobe: ein täglicher Punkt an einem Arbeitstag vergessen → kein Ring', luecke === false && !k2, JSON.stringify({ luecke, k2 }));
      pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
      await zu(p);
    }

    console.log('\n── 4 Jahreszeit ──');
    {
      const p = await oeffne(b, 390, 844, 'stub-mitarbeiter.js');
      for (const [d, art] of [['2026-11-05T10:00:00', ''], ['2026-12-24T10:00:00', 'winter'], ['2026-06-21T10:00:00', 'sommer'], ['2026-12-31T10:00:00', 'silvester'], ['2027-01-01T10:00:00', 'silvester'], ['2026-12-27T10:00:00', '']]) {
        const r = await p.evaluate((d) => { const a = window.__formiLebt.datum(d); const k = document.querySelector('#formiKugel .fk-wirbel');
          return { a, klassen: (document.documentElement.className.match(/fz-\w+/g) || []).join(' '), ring: getComputedStyle(k).backgroundImage.slice(0, 60) }; }, d);
        pruefe(`${d.slice(0, 10)}: ${art || 'gewöhnlicher Tag'} (${r.klassen || 'keine Klasse'})`, r.a === art && r.klassen === (art ? 'fz-' + art : ''), JSON.stringify(r));
      }
      await p.evaluate(() => window.__formiLebt.datum('2026-12-31T10:00:00'));
      await p.evaluate(() => window.__formiLebt.funkenregen());
      await p.waitForTimeout(200);
      const f = await p.evaluate(() => document.querySelectorAll('.formi-funken.fz-regen i').length);
      await p.waitForTimeout(2600);
      const weg = await p.evaluate(() => document.querySelectorAll('.formi-funken.fz-regen').length);
      pruefe(`Silvester: Funkenregen (${f} Funken), danach aufgeräumt`, f === 12 && weg === 0, JSON.stringify({ f, weg }));
      await p.evaluate(() => window.__formiLebt.datum(null));
      pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
      await zu(p);
    }

    console.log('\n── 5 Zeile ins Loch ──');
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      const p = await oeffne(b, w, h, 'stub-mitarbeiter.js');
      await p.waitForTimeout(4000);
      await p.locator('[data-hhak]').first().click();
      await p.waitForTimeout(250);
      const m = await p.evaluate(() => { const g = document.querySelector('.formi-sog'); if (!g) return { da: false };
        return { da: true, ids: g.querySelectorAll('[id]').length, versteckt: getComputedStyle(g).pointerEvents === 'none' || getComputedStyle(g.parentNode).pointerEvents === 'none',
          anim: g.getAnimations().length }; });
      await p.waitForTimeout(1000);
      const weg = await p.evaluate(() => document.querySelectorAll('.formi-sog-huelle').length);
      pruefe(`${w} px: das Abbild der Zeile fliegt (ohne doppelte ids, ohne Trefferfläche) und ist danach weg`, m.da && m.ids === 0 && m.versteckt && m.anim >= 1 && weg === 0, JSON.stringify({ m, weg }));
      pruefe(`${w} px: keine Skriptfehler`, !p._fehler.length, p._fehler.join(' | '));
      await zu(p);
    }
  } finally { await b.close(); }
  console.log('\n' + (schlecht ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung' : '✓ Formi: Monde, Geburtstag, Serie, Jahreszeit, Zeile ins Loch — ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})();
