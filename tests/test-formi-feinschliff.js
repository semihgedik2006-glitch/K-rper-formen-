/* ══════════════════════════════════════════════════════════════════════
   FORMI-FEINSCHLIFF (Runde 278) — Ideen 3, 4, 5, 7 aus
   docs/ideen/formi-und-oberflaeche-20.md

   Aus dem Betrieb (25.10.2026) auf die 20 Ideen: „mach alles davon und
   alles was noch offen ist".

   Geprüft:
   3. Tagesstand lesbar: „7 von 11 heute erledigt" steht als Schild
      über der Kugel (der Name bleibt „Formi öffnen") — sichtbar beim
      Darüberfahren (Rechner), ohne Trefferfläche, im Bild bei 1280–1920
      und am Handy nicht im Weg (dort ohne Hover unsichtbar).
   4. Wartet ein Knopf länger als 300 ms, dreht darin eine Formi-Scheibe
      (Klasse laedt, aria-busy); danach ist sie weg. Gegenprobe: unter
      300 ms erscheint sie nicht.
   5. Formis Spur nennt Uhrzeit und für wen.
   7. Staut sich viel, wird der Wirbel langsamer (8 / 15 offene).
   Der helle Stil (Idee 9) steht in test-formi-ideen, der eine Ton
   (Idee 10) in test-gehirn.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const path = require('path');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
async function oeffne(b, w, h, mehr) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' }, mehr || {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await p.addInitScript({ path: path.join(__dirname, 'stub-chef.js') });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(900);
  await p.evaluate(() => window.__formiLebt.uhrenAus());
  p._ctx = ctx;
  return p;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── 3 Tagesstand lesbar ──');
    for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080], [390, 844]]) {
      const p = await oeffne(b, w, h);
      await p.evaluate(() => window.__formiLebt.tagSetzen(4, 3));
      const k = await p.evaluate(() => { const k = document.getElementById('formiKugel'), s = k.querySelector('.fk-stand');
        return { label: k.getAttribute('aria-label'), text: s.textContent, op: getComputedStyle(s).opacity, pe: getComputedStyle(s).pointerEvents }; });
      pruefe(`${w} px: „${k.text}" im Schild, keine Trefferfläche, der Knopf heisst weiter „Formi öffnen"`, /von \d+ heute erledigt/.test(k.text) && k.label === 'Formi öffnen' && k.pe === 'none', JSON.stringify(k));
      if (w >= 1280) {
        const box = await p.evaluate(() => { const r = document.getElementById('formiKugel').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
        await p.mouse.move(box.x, box.y); await p.waitForTimeout(350);
        const s = await p.evaluate(() => { const s = document.querySelector('#formiKugel .fk-stand'), r = s.getBoundingClientRect(); return { op: +getComputedStyle(s).opacity, l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top) }; });
        pruefe(`${w} px: beim Darüberfahren sichtbar und im Bild (${s.l}–${s.r})`, s.op > .9 && s.l >= 0 && s.r <= w && s.t >= 0, JSON.stringify(s));
      } else {
        pruefe(`${w} px: am Handy ohne Hover unsichtbar`, +k.op === 0, k.op);
      }
      pruefe(`${w} px: ohne Skriptfehler`, !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }

    console.log('\n── 7 Stau macht Formi schwer ──');
    {
      const p = await oeffne(b, 1440, 900);
      const d = await p.evaluate(() => {
        const k = document.getElementById('formiKugel'), w = () => getComputedStyle(k.querySelector('.fk-wirbel')).animationDuration;
        window.__formiLebt.tagSetzen(2, 3); const leicht = w();
        window.__formiLebt.tagSetzen(2, 9); const mittel = w();
        window.__formiLebt.tagSetzen(2, 16); const schwer = w();
        window.__formiLebt.tagSetzen(2, 3); const wieder = w();
        return { leicht, mittel, schwer, wieder };
      });
      pruefe(`3 offen ${d.leicht}, 9 offen ${d.mittel}, 16 offen ${d.schwer}, wieder 3 offen ${d.wieder}`,
        parseFloat(d.leicht) < parseFloat(d.mittel) && parseFloat(d.mittel) < parseFloat(d.schwer) && d.wieder === d.leicht, JSON.stringify(d));
      await p._ctx.close();
    }

    console.log('\n── 4 Formi im wartenden Knopf ──');
    {
      const p = await oeffne(b, 1440, 900);
      await p.evaluate(() => { const x = document.createElement('button'); x.className = 'btn btn-primary'; x.id = 'testKnopf'; x.textContent = 'Speichern'; x.style.cssText = 'position:fixed;left:400px;top:300px;z-index:3000'; document.body.appendChild(x); });
      await p.evaluate(() => window.__formiLebt.beschaeftigt('#testKnopf', 150)); await p.waitForTimeout(80);
      const kurz = await p.evaluate(() => document.getElementById('testKnopf').classList.contains('laedt'));
      await p.waitForTimeout(400);
      pruefe('GEGENPROBE: unter 300 ms keine Scheibe', !kurz);
      await p.evaluate(() => window.__formiLebt.beschaeftigt('#testKnopf', 1200)); await p.waitForTimeout(450);
      const lang = await p.evaluate(() => { const x = document.getElementById('testKnopf'), a = getComputedStyle(x, '::after');
        return { klasse: x.classList.contains('laedt'), busy: x.getAttribute('aria-busy'), anim: a.animationName, text: x.textContent, w: a.width }; });
      pruefe('über 300 ms: die Formi-Scheibe dreht im Knopf (aria-busy, Text bleibt für Vorlesegeräte)', lang.klasse && lang.busy === 'true' && lang.anim === 'spin' && lang.text === 'Speichern' && lang.w === '18px', JSON.stringify(lang));
      await p.waitForTimeout(1000);
      const nach = await p.evaluate(() => { const x = document.getElementById('testKnopf'); return { klasse: x.classList.contains('laedt'), busy: x.hasAttribute('aria-busy'), aus: x.disabled }; });
      pruefe('danach ist sie weg und der Knopf wieder bedienbar', !nach.klasse && !nach.busy && !nach.aus, JSON.stringify(nach));
      await p._ctx.close();
    }

    console.log('\n── 5 Formis Spur ──');
    {
      const p = await oeffne(b, 1440, 900);
      const s = await p.evaluate(() => {
        const t = new Date(2026, 9, 25, 9, 14).getTime();
        return { ab: window.__formiLebt.spur({ formiAt: t, doneAt: t, doneBy: 'Anna Meier' }, true), an: window.__formiLebt.spur({ vonFormi: true, ts: t, createdBy: 'Ben Kraus' }, false), nichts: window.__formiLebt.spur({ doneAt: t }, true) };
      });
      pruefe('abgehakt: „über Formi · 09:14", im Titel „für Anna"', /über Formi · 09:14/.test(s.ab) && /für Anna/.test(s.ab), s.ab);
      pruefe('angelegt: „über Formi angelegt · 09:14", für Ben', /über Formi angelegt · 09:14/.test(s.an) && /für Ben/.test(s.an), s.an);
      pruefe('ohne Formi keine Spur', s.nichts === '', s.nichts);
      await p._ctx.close();
    }
  } finally { await b.close(); }
  console.log(`\n${schlecht ? '✗' : '✓'} Formi-Feinschliff: ${schlecht ? schlecht + ' von ' + (gut + schlecht) + ' falsch' : 'alle ' + gut + ' Zusicherungen erfüllt'}`);
  process.exit(schlecht ? 1 : 0);
})();
