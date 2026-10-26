/* ══════════════════════════════════════════════════════════════════════
   MEHR FORMI IN DER APP + NEUES FORMI-FENSTER (Runde 233, 23.10.2026)

   Aus dem Betrieb: „die ganze app hat viel zu wenig formi design" und
   „das hud sieht design technisch auch noch nicht all zu prickelnd aus";
   zur Ideenliste C (App) und D (Fenster): „alles davon … deutlich, mehr
   formi".

   Geprüft wird:
    1. Fenster: Vorschläge als Karten mit Zeichen in der Farbe des
       Bereichs; Eingabe als EINE Zeile (Foto · Feld · Sprechen · Senden),
       Senden mit Zeichen und Namen für Vorleser; Fragen und Antworten als
       Sprechblasen (gerundet, Antwort mit Kante in Formis Ring).
    2. Trefferflächen von Foto, Sprechen (falls da), Senden und den
       Vorschlägen ≥ 44 × 44 per Hit-Test, im Bild — bei 320 / 390 / 430
       / 820 / 1280 / 1440 / 1920, normal und kompakt.
    3. App: Formi neben dem Gruss auf „Heute"; Formi im Hinweis unten
       (freut sich / bei Fehlern verlegen); Formi in leeren Listen;
       Funken beim Drücken eines Hauptknopfs; ein Wirbel aus der Kugel
       beim Seitenwechsel; die Kanten der Karten leuchten einmal auf —
       alles endlich, nur transform/opacity, nichts davon klickbar.
    4. „weniger Bewegung": keine Funken, kein Wirbel.
    5. Ohne Seitenfehler.
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
async function oeffne(b, w, h, opt) {
  opt = opt || {};
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block',
    reducedMotion: opt.wenigBewegung ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await p.addInitScript({ path: SP + '/stub-chef.js' });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(1000);
  p._ctx = ctx;
  return p;
}
const TREFFER = (sel) => {
  const el = document.querySelector(sel);
  if (!el || !el.getClientRects().length) return { w: 0, h: 0, imBild: false, fehlt: true };
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0, imBild: false, verdeckt: true };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--;
  while (u < innerHeight - 1 && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--;
  while (re < innerWidth - 1 && trifft(re + 1, cy)) re++;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1), imBild: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── 1 Fenster ──');
    {
      const p = await oeffne(b, 1440, 900);
      await p.evaluate(() => { window.__antwort = window.__antwort || {}; window.__antwort.gehirnAktion = () => Promise.resolve({ data: { art: 'frage', antwort: 'Im Schonprogramm bei 30 Grad.', abgedeckt: true } }); });
      await p.click('#formiKugel'); await p.waitForTimeout(1500);
      const f = await p.evaluate(() => {
        const chips = [...document.querySelectorAll('#jarvisVerlauf .jv-chip')];
        const ein = document.querySelector('#jarvis .jv-eingabe');
        const r = (id) => document.getElementById(id).getBoundingClientRect();
        const feld = r('jarvisFeld'), foto = r('jarvisFoto'), senden = r('jarvisSenden');
        return { chips: chips.length, mitZeichen: chips.every(c => c.querySelector('.jv-chip-z svg') && getComputedStyle(c).getPropertyValue('--gm-rgb').trim()),
          karte: chips.length && parseFloat(getComputedStyle(chips[0]).borderTopLeftRadius) < 20,
          eineZeile: Math.abs(foto.top + foto.height / 2 - (senden.top + senden.height / 2)) < 2 && foto.right <= feld.left + 1 && feld.right <= senden.left + 1,
          sendenName: document.getElementById('jarvisSenden').textContent.trim(), sendenZeichen: !!document.querySelector('#jarvisSenden svg'),
          grid: getComputedStyle(ein).display };
      });
      pruefe(`Vorschläge als Karten mit Zeichen und Bereichsfarbe (${f.chips})`, f.chips === 4 && f.mitZeichen && f.karte, JSON.stringify(f));
      pruefe('Eingabe in EINER Zeile: Foto · Feld · Senden', f.eineZeile && f.grid === 'grid', JSON.stringify(f));
      pruefe('Senden: Zeichen und Name „Senden" für Vorleser', f.sendenName === 'Senden' && f.sendenZeichen, JSON.stringify(f));
      await p.fill('#jarvisFeld', 'Wie wasche ich die Westen?'); await p.click('#jarvisSenden'); await p.waitForTimeout(1500);
      const bl = await p.evaluate(() => {
        const fr = document.querySelector('#jarvisVerlauf .gehirn-frage'), an = document.querySelector('#jarvisVerlauf .gehirn-antwort');
        const cf = getComputedStyle(fr), ca = getComputedStyle(an), vor = getComputedStyle(an, '::before');
        return { frageRund: parseFloat(cf.borderTopLeftRadius) >= 14 && parseFloat(cf.borderBottomRightRadius) <= 8, frageVerlauf: /gradient/.test(cf.backgroundImage),
          antwortRund: parseFloat(ca.borderTopRightRadius) >= 14 && parseFloat(ca.borderTopLeftRadius) <= 8, kante: /conic-gradient/.test(vor.backgroundImage) };
      });
      pruefe('Sprechblasen: deine im Verlauf, Formis mit Ring-Kante', bl.frageRund && bl.frageVerlauf && bl.antwortRund && bl.kante, JSON.stringify(bl));
      pruefe('ohne Seitenfehler', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }

    console.log('\n── 2 Trefferflächen im Fenster ──');
    for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      for (const dichte of ['normal', 'kompakt']) {
        const p = await oeffne(b, w, h);
        if (dichte === 'kompakt') await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt'));
        await p.evaluate(() => { window.SpeechRecognition = window.SpeechRecognition || function () {}; });
        await p.click('#formiKugel'); await p.waitForTimeout(1300);
        const funde = [];
        for (const sel of ['#jarvisFoto', '#jarvisSenden', '#jarvisMic']) {
          const t = await p.evaluate(TREFFER, sel);
          if (t.fehlt && sel === '#jarvisMic') continue;
          if (!(t.w >= 44 && t.h >= 44 && t.imBild)) funde.push(sel + ' ' + t.w + '×' + t.h + (t.imBild ? '' : ' nicht im Bild') + (t.verdeckt ? ' verdeckt' : ''));
        }
        const n = await p.evaluate(() => document.querySelectorAll('#jarvisVerlauf .jv-chip').length);
        for (let i = 1; i <= n; i++) {
          await p.evaluate((i) => { const c = document.querySelector('#jarvisVerlauf .jv-chip:nth-child(' + i + ')'); if (c) c.scrollIntoView({ block: 'center' }); }, i);
          const t = await p.evaluate(TREFFER, '#jarvisVerlauf .jv-chip:nth-child(' + i + ')');
          if (!(t.w >= 44 && t.h >= 44 && t.imBild)) funde.push('Vorschlag ' + i + ' ' + t.w + '×' + t.h);
        }
        const quer = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        if (quer) funde.push('Querlauf');
        pruefe(`${w}×${h} ${dichte}: Foto, Senden, Sprechen, Vorschläge ≥ 44 × 44, im Bild`, !funde.length, funde.join(' | '));
        await p._ctx.close();
      }
    }

    console.log('\n── 3 Formi in der App ──');
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const p = await oeffne(b, w, h);
      await p.evaluate(() => window.__formiLebt.uhrenAus());
      const g = await p.evaluate(() => { const f = document.getElementById('formiGruss'); return { da: !!f && f.getClientRects().length > 0, figur: !!(f && f.querySelector('.fk-auge')), klick: f && getComputedStyle(f).pointerEvents, aria: f && f.getAttribute('aria-hidden') }; });
      pruefe(`${w}: Formi neben dem Gruss auf „Heute" (Schmuck, aria-hidden)`, g.da && g.figur && g.aria === 'true', JSON.stringify(g));
      await p.evaluate(() => window.__formiLebt.fehlerHinweis('Hat nicht geklappt.')); await p.waitForTimeout(400);
      const t = await p.evaluate(() => { const t = document.getElementById('toast'); return { figur: !!t.querySelector('.toast-formi .fk-auge'), text: t.textContent, anim: t.querySelector('.toast-formi').getAnimations({ subtree: true }).filter(a => !a.animationName).length }; });
      pruefe(`${w}: Hinweis unten mit Formi, Text unverändert, Formi reagiert`, t.figur && t.text === 'Hat nicht geklappt.' && t.anim > 0, JSON.stringify(t));
      // Leere Liste
      await p.evaluate(() => { history.pushState({ v: 'putzplan' }, '', '#putzplan'); dispatchEvent(new PopStateEvent('popstate', { state: { v: 'putzplan' } })); });
      await p.waitForTimeout(150);
      const welle = await p.evaluate(() => [...document.querySelectorAll('.formi-welle.wechsel')].map(x => x.getAnimations().map(a => a.effect.getTiming().iterations)).flat());
      pruefe(`${w}: Seitenwechsel: ein Wirbel aus der Kugel, endlich`, welle.length > 0 && welle.every(i => i === 1), JSON.stringify(welle));
      await p.waitForTimeout(400);
      const leer = await p.evaluate(() => { const e = document.querySelector('.view.show .empty'); return e ? { figur: !!e.querySelector('.leer-figur .fk-auge'), zufrieden: +getComputedStyle(e.querySelector('.leer-figur .fk-froh')).opacity } : null; });
      pruefe(`${w}: leere Liste: Formi sitzt zufrieden darüber`, leer && leer.figur && leer.zufrieden === 1, JSON.stringify(leer));
      const kante = await p.evaluate(() => { const c = document.querySelector('.view.show .card'); if (!c) return null; const s = getComputedStyle(c, '::after'); return { name: s.animationName, n: s.animationIterationCount, klick: s.pointerEvents }; });
      pruefe(`${w}: Kanten der Karten leuchten einmal auf (nicht klickbar)`, kante && kante.name === 'formiKanteAuf' && kante.n === '1' && kante.klick === 'none', JSON.stringify(kante));
      // Funken
      /* Ein Hauptknopf, der sicher zu sehen ist: Senden im Formi-Fenster. */
      await p.click('#formiKugel'); await p.waitForTimeout(900);
      const fu = await p.evaluate(() => { const b = document.getElementById('jarvisSenden'); if (!b || !b.getClientRects().length) return null;
        const r = b.getBoundingClientRect(); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + 5, clientY: r.top + 5 }));
        const f = document.querySelector('.formi-funken'); return f ? { n: f.children.length, klick: getComputedStyle(f).pointerEvents, endlich: f.getAnimations({ subtree: true }).every(a => a.effect.getTiming().iterations === 1) } : { n: 0 }; });
      pruefe(`${w}: Hauptknopf drücken: Funken, endlich, nicht klickbar`, fu && fu.n === 6 && fu.klick === 'none' && fu.endlich, JSON.stringify(fu));
      pruefe(`${w}: ohne Seitenfehler`, !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
    {
      const p = await oeffne(b, 1440, 900, { wenigBewegung: true });
      await p.evaluate(() => { history.pushState({ v: 'putzplan' }, '', '#putzplan'); dispatchEvent(new PopStateEvent('popstate', { state: { v: 'putzplan' } })); });
      await p.waitForTimeout(150);
      const r = await p.evaluate(() => { const b = [...document.querySelectorAll('.btn-primary')].find(x => x.getClientRects().length); if (b) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }));
        const c = document.querySelector('.view.show .card'); return { welle: document.querySelectorAll('.formi-welle').length, funken: document.querySelectorAll('.formi-funken').length, kante: c ? getComputedStyle(c, '::after').animationName : 'none' }; });
      pruefe('„weniger Bewegung": kein Wirbel, keine Funken, keine Kanten-Animation', r.welle === 0 && r.funken === 0 && r.kante === 'none', JSON.stringify(r));
      await p._ctx.close();
    }
  } catch (e) {
    console.log('Fehler: ' + e.message.split('\n')[0]);
    schlecht++;
  }
  await b.close();
  console.log(schlecht ? `✗ Formi in der App: ${schlecht} von ${gut + schlecht} falsch` : `✓ Formi in der App: ${gut} Zusicherungen`);
  process.exit(schlecht ? 1 : 0);
})();
