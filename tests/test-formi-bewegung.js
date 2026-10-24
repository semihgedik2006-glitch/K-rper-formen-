/* ══════════════════════════════════════════════════════════════════════
   FORMIS BEWEGUNG: STARK / MITTEL / KEINE — und Formi ohne Stimme
   (Runde 263)

   Aus dem Betrieb (24.10.2026):
   „kannst du dafür sorgen das formi doch kein „hey formi“ mehr hat aber
   man kann noch sprach Nachrichten schicken und das vor lesen ist auch
   unnötig. Wir bräuchten auch noch einen Schalter wo man formis
   Animationen anpassen kann also stark, Mittel, keine"

   Geprüft:
   1. Der Schalter steht an ZWEI Stellen mit EINEM Wert: in Formis
      Einstellungen und unter Profil → Aussehen. Jede Wahl ist per
      Hit-Test ≥ 44 × 44 treffbar, bei 320 / 390 / 430 / 820 / 1280 /
      1440 / 1920, normal und kompakt.
   2. „Keine": Formi steht still (keine Animation an der Kugel, kein
      Strom beim Abhaken, der Rand leuchtet ohne zu strömen), was er
      meldet, bleibt (Insel). Nach dem Neuladen gemerkt.
   3. „Stark": der Strom macht mehr Umläufe als bei „Mittel".
   4. Übergang: wer früher „Gefühle der Kugel: Aus" hatte, hat „Keine".
   5. Ohne Stimme: im Quelltext ruft nichts mehr speechSynthesis oder die
      Stimm-Function auf, und es gibt kein Weckwort.
   NICHT geprüft: echte Handys, echte Spracherkennung (hier eine
   Attrappe, siehe test-gehirn 12e).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
async function oeffne(b, w, h, vorher) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  if (vorher) await p.addInitScript(vorher);
  await p.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(900);
  await p.evaluate(() => window.__formiLebt.uhrenAus());
  p._ctx = ctx;
  return p;
}
/* die erste SICHTBARE offene Aufgabe (nach dem Profil-Blatt gibt es
   versteckte Kopien derselben Liste) */
const MARKE = "(() => { const c = [...document.querySelectorAll('#todoArea .todo:not(.done) .check')].find(x => x.getClientRects().length); if (c) c.setAttribute('data-test-haken', '1'); return !!c; })()";
const zeige = (p, id) => p.evaluate((id) => { history.pushState({ v: id }, '', '#' + id); window.dispatchEvent(new PopStateEvent('popstate', { state: { v: id } })); }, id);
/* Trefferfläche per Hit-Test, vom Mittelpunkt nach aussen */
const TREFFER = (el) => {
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0 };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--; while (u < innerHeight && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--; while (re < innerWidth && trifft(re + 1, cy)) re++;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1), imBild: r.left >= 0 && r.right <= innerWidth };
};
/* Ein offenes Profil-Blatt schliesst der erste „Zurück"-Schritt; erst der
   zweite wechselt die Ansicht. */
const blattZu = async (p) => { await p.keyboard.press('Escape'); await p.waitForTimeout(300); };
const aussehen = async (p) => {
  await p.evaluate(() => document.getElementById('ichProfilBtn').click()); await p.waitForTimeout(700);
  await p.evaluate(() => { const r = document.querySelector('[data-pmtab="aussehen"]'); if (r) r.click(); }); await p.waitForTimeout(500);
};
/* Wie weit läuft der erste Buchstabe um Formi (Grad)? */
const STROM_GRAD = async (p) => p.evaluate(async (MARKE_TXT) => {
  eval(MARKE_TXT); window.__formiLebt.schlucken('[data-test-haken]');
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const box = document.querySelector('.formi-strom'); if (!box) return null;
  const z = [...box.querySelectorAll('i:not(.spur)')].find(i => i.getAnimations().length);
  const kf = z.getAnimations().find(a => !a.effect.pseudoElement).effect.getKeyframes(), zr = z.parentElement.getBoundingClientRect();
  const k = document.getElementById('formiKugel').getBoundingClientRect(), kx = k.left + k.width / 2, ky = k.top + k.height / 2;
  let summe = 0, alt = null;
  kf.forEach(f => { const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px/.exec(f.transform); if (!m) return;
    /* translate setzt die linke obere Ecke — gemessen wird die Mitte */
    const w = Math.atan2(zr.top + +m[2] + z.offsetHeight / 2 - ky, zr.left + +m[1] + z.offsetWidth / 2 - kx);
    if (alt !== null) { let d = w - alt; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; summe += d; } alt = w; });
  return Math.round(Math.abs(summe * 180 / Math.PI));
}, MARKE);

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── 1 Ein Schalter, zwei Stellen, Trefferflächen ──');
    for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      const p = await oeffne(b, w, h);
      for (const dichte of ['normal', 'kompakt']) {
        if (dichte === 'kompakt') { await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt')); await p.waitForTimeout(200); }
        await aussehen(p);
        const a = await p.evaluate((TR) => [...document.querySelectorAll('#formiBewOpts [data-fbew]')].map(el => Object.assign({ wahl: el.getAttribute('data-fbew'), on: el.getAttribute('aria-pressed') }, (eval(TR))(el))), TREFFER.toString());
        pruefe(`${w} px ${dichte}: Profil → Aussehen: ${a.map(x => x.wahl + ' ' + x.w + '×' + x.h).join(', ')}, „Mittel" gewählt`,
          a.length === 3 && a.every(x => x.w >= 44 && x.h >= 44 && x.imBild) && a[1].on === 'true', JSON.stringify(a));
        await zeige(p, 'home'); await p.waitForTimeout(300);
        await p.click('#formiKugel'); await p.waitForTimeout(400);
        await p.evaluate(() => { const m = document.getElementById('jarvisMehr'); if (m && m.getClientRects().length) m.click(); }); await p.waitForTimeout(200);
        await p.evaluate(() => document.getElementById('jarvisPersonaBtn').click()); await p.waitForTimeout(300);
        const f = await p.evaluate((TR) => [...document.querySelectorAll('#jarvisPersona [data-fbew]')].map(el => Object.assign({ wahl: el.getAttribute('data-fbew'), on: el.getAttribute('aria-pressed') }, (eval(TR))(el))), TREFFER.toString());
        pruefe(`${w} px ${dichte}: in Formis Einstellungen: ${f.map(x => x.wahl + ' ' + x.w + '×' + x.h).join(', ')}`,
          f.length === 3 && f.every(x => x.w >= 44 && x.h >= 44 && x.imBild) && f[1].on === 'true', JSON.stringify(f));
        await p.evaluate(() => document.getElementById('jarvisZu').click()); await p.waitForTimeout(300);
      }
      pruefe(`${w} px: ohne Skriptfehler`, !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }

    console.log('\n── 2 „Keine": Formi steht still, Meldungen bleiben ──');
    {
      const p = await oeffne(b, 1440, 900);
      await aussehen(p);
      await p.click('#formiBewOpts [data-fbew="keine"]'); await p.waitForTimeout(300); await blattZu(p);
      const g = await p.evaluate(() => ({ p: JSON.parse(localStorage.getItem('kf_jv_persona') || '{}').bewegung, still: document.documentElement.classList.contains('fk-still'),
        on: document.querySelector('#formiBewOpts [data-fbew="keine"]').getAttribute('aria-pressed') }));
      pruefe('„Keine" unter Aussehen: gemerkt, Formi still (fk-still)', g.p === 'keine' && g.still && g.on === 'true', JSON.stringify(g));
      await zeige(p, 'todos'); await p.waitForTimeout(600);
      await p.evaluate(MARKE);
      const s = await p.evaluate(async () => {
        window.__formiLebt.fuehlt('freut'); window.__formiLebt.schlucken('#todoArea .todo:not(.done) .check'); window.__formiLebt.schlucken('[data-test-haken]'); window.__formiLebt.leben('summt');
        window.__formiLebt.inselArbeit('Suche …');
        await new Promise(r => setTimeout(r, 400));
        const rand = document.getElementById('formiRand');
        return { kugel: document.getElementById('formiKugel').getAnimations({ subtree: true }).length, strom: !!document.querySelector('.formi-strom'),
          insel: window.__formiLebt.insel(), fluss: rand.getAnimations({ subtree: true }).filter(a => a.effect && a.effect.pseudoElement === '::before').length };
      });
      pruefe('… keine Animation an der Kugel, kein Strom beim Abhaken', s.kugel === 0 && !s.strom, JSON.stringify(s));
      pruefe('… die Insel meldet trotzdem, der Rand leuchtet ohne zu strömen', !s.insel.hidden && s.insel.klein === 'Suche …' && s.insel.rand && s.fluss === 0, JSON.stringify(s));
      await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => !!document.querySelector('#app.show')); await p.waitForTimeout(900);
      const n = await p.evaluate(() => { window.__formiLebt.fuehlt('freut'); return { still: document.documentElement.classList.contains('fk-still'), kugel: document.getElementById('formiKugel').getAnimations({ subtree: true }).length }; });
      pruefe('… nach dem Neuladen bleibt es still', n.still && n.kugel === 0, JSON.stringify(n));
      /* Gegenprobe: zurück auf „Mittel" — dann bewegt er sich wieder */
      await aussehen(p);
      await p.click('#formiBewOpts [data-fbew="mittel"]'); await p.waitForTimeout(300); await blattZu(p);
      await zeige(p, 'todos'); await p.waitForTimeout(600);
      const m = await p.evaluate(async (MARKE_TXT) => { window.__formiLebt.fuehlt('freut'); eval(MARKE_TXT); window.__formiLebt.schlucken('[data-test-haken]');
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return { kugel: document.getElementById('formiKugel').getAnimations({ subtree: true }).length, strom: !!document.querySelector('.formi-strom'), still: document.documentElement.classList.contains('fk-still') }; }, MARKE);
      pruefe('GEGENPROBE „Mittel": Formi bewegt sich wieder, der Strom läuft', !m.still && m.kugel > 0 && m.strom, JSON.stringify(m));
      pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }

    console.log('\n── 3 „Stark": mehr Umläufe ──');
    {
      const p = await oeffne(b, 1440, 900);
      await zeige(p, 'todos'); await p.waitForTimeout(600);
      const mittel = await STROM_GRAD(p);
      await p.waitForTimeout(3200);
      await p.evaluate(() => { const x = JSON.parse(localStorage.getItem('kf_jv_persona') || '{}'); x.bewegung = 'stark'; localStorage.setItem('kf_jv_persona', JSON.stringify(x)); });
      await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => !!document.querySelector('#app.show')); await p.waitForTimeout(900);
      await p.evaluate(() => window.__formiLebt.uhrenAus());
      await zeige(p, 'todos'); await p.waitForTimeout(600);
      const stark = await STROM_GRAD(p);
      pruefe(`„Stark" wickelt den Strom weiter um Formi (${stark}° statt ${mittel}°)`, mittel && stark && stark > mittel * 1.2, JSON.stringify({ mittel, stark }));
      await p._ctx.close();
    }

    console.log('\n── 4 Übergang von „Gefühle der Kugel: Aus" ──');
    {
      const p = await oeffne(b, 1440, 900, () => { try { localStorage.setItem('kf_jv_persona', JSON.stringify({ gefuehle: 'aus' })); } catch (e) {} });
      await aussehen(p);
      const u = await p.evaluate(() => ({ on: document.querySelector('#formiBewOpts [aria-pressed="true"]').getAttribute('data-fbew'), still: document.documentElement.classList.contains('fk-still') }));
      pruefe('wer „Gefühle aus" hatte, steht auf „Keine"', u.on === 'keine' && u.still, JSON.stringify(u));
      await p._ctx.close();
    }

    console.log('\n── 5 Ohne Stimme und ohne „Hey Formi" (Quelltext) ──');
    {
      const html = fs.readFileSync(path.join(SP, '..', 'index.html'), 'utf8');
      const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      pruefe('kein speechSynthesis, keine Stimm-Function, kein Audio-Abspielen', !/speechSynthesis|SpeechSynthesisUtterance|gehirnStimme|new Audio\(/.test(js));
      pruefe('kein Weckwort (keine dauerhaft hörende Erkennung)', !/continuous\s*=\s*true|jvWeck|weckwort/.test(js));
      pruefe('Sprechen statt Tippen bleibt (Spracherkennung beim Knopf „Sprechen")', /SpeechRecognition/.test(js) && /gehirnHoerenStart/.test(js));
    }
  } finally { await b.close(); }
  console.log(`\n${schlecht ? '✗' : '✓'} Formis Bewegung: ${schlecht ? schlecht + ' von ' + (gut + schlecht) + ' falsch' : 'alle ' + gut + ' Zusicherungen erfüllt'}`);
  process.exit(schlecht ? 1 : 0);
})();
