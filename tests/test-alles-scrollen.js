/* ══ „ALLES" LÄSST SICH ÜBERALL SCROLLEN (Runde 290) ═════════════════
   Gemeldet am 26.10.2026 mit Bildschirmfoto vom Rechner (Chef, Fenster
   etwa 1000 × 630): „der alles bereich lässt sich auf dem pc nicht
   srollen und hängt bei diesem bild fest".

   Ursache: Die Regeln der Schublade standen im Handy-Block
   (max-width:820px). Am Rechner lag die Liste als 2.856 px hohes Stück
   mitten in der Seite – kein eigener Scrollbereich, die Seite darunter
   scrollt nicht mit. Gemessen vor der Änderung: scrollTop blieb 0, die
   letzte Zeile bei 3.021 px.

   Geprüft wird, als Chef und als Mitarbeiter, bei 320 / 390 / 820 /
   1000 × 628 / 1280 / 1440 / 1920 px:
    1. die Schublade liegt fest über der Seite und ist nicht höher als
       das Fenster;
    2. mit dem Mausrad (bzw. Wischen) kommt man bis zur letzten Zeile:
       sie steht danach ganz im Bild und trifft per Hit-Test;
    3. Formis Kugel und Blase liegen nicht darüber (sichtbar).
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

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const rolle of ['chef', 'mitarbeiter']) {
    console.log('\n── ' + rolle + ' ──');
    for (const [w, h] of [[320, 568], [390, 844], [820, 1180], [1000, 628], [1280, 800], [1440, 900], [1920, 1080]]) {
      const handy = w <= 820;
      const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' }, handy ? { hasTouch: true, isMobile: true } : {}));
      const p = await ctx.newPage();
      const fehler = [];
      p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
      await p.route('**://www.gstatic.com/**', r => r.abort());
      await p.route('**fonts.googleapis.com/**', r => r.abort());
      await ctx.addInitScript(() => { try { localStorage.setItem('kf_tour', '1:testuid'); localStorage.setItem('kf_formi_gruss', new Date().toDateString()); } catch (e) {} });
      await ctx.addInitScript({ path: SP + '/stub-' + rolle + '.js' });
      await p.goto(APP, { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
      await p.waitForTimeout(900);
      await p.click('#bereichKopf'); await p.waitForTimeout(500);
      const lage = await p.evaluate(() => {
        const l = document.getElementById('allesLade'), r = l.getBoundingClientRect();
        return { pos: getComputedStyle(l).position, h: Math.round(r.height), unten: Math.round(r.bottom) };
      });
      pruefe(w + ' px: Schublade fest, nicht höher als das Fenster (' + lage.h + ' px)', lage.pos === 'fixed' && lage.unten <= h + 1, JSON.stringify(lage));
      /* Scrollen wie ein Mensch: Mausrad über der Liste bzw. Wischen. */
      if (handy) {
        await p.evaluate(() => { const i = document.getElementById('allesLadeInhalt'); i.scrollTop = i.scrollHeight; });
      } else {
        await p.mouse.move(150, h - 150);
        for (let k = 0; k < 20; k++) { await p.mouse.wheel(0, 400); await p.waitForTimeout(40); }
      }
      await p.waitForTimeout(400);
      const m = await p.evaluate(() => {
        const i = document.getElementById('allesLadeInhalt');
        const z = [...i.querySelectorAll('.al-zeile')].pop(), r = z.getBoundingClientRect();
        const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        const sicht = (sel) => [...document.querySelectorAll(sel)].some(e => e.getClientRects().length && !e.hidden && getComputedStyle(e).visibility !== 'hidden' &&
          (() => { const q = e.getBoundingClientRect(); return q.right > r.left && q.left < r.right && q.bottom > r.top && q.top < r.bottom; })());
        return { name: z.querySelector('b').textContent, st: Math.round(i.scrollTop), imBild: r.top >= 0 && r.bottom <= innerHeight, trifft: !!t && z.contains(t),
          formiDrauf: sicht('.formi-kugel') || sicht('.formi-blase') };
      });
      pruefe(w + ' px: bis zur letzten Zeile („' + m.name + '") gescrollt, sie steht im Bild und trifft', m.st > 0 && m.imBild && m.trifft, JSON.stringify(m));
      pruefe(w + ' px: Formi liegt nicht darüber', !m.formiDrauf, JSON.stringify(m));
      pruefe(w + ' px: ohne Skriptfehler', !fehler.length, fehler.join(' | '));
      await ctx.close();
    }
  }
  await b.close();
  console.log(schlecht
    ? '\n✗ Alles scrollen: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Alles scrollen: die Schublade scrollt auf jeder Breite bis zur letzten Zeile — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
