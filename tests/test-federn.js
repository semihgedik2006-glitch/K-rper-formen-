/* ══ DREI FEDERN STATT VIELER KURVEN (Runde 247) ═══════════════════════
   Plan „Studio Chat wie von Apple", Schritt Bewegung. Aus dem Betrieb,
   23.10.2026, 15:18: „es soll einfach den ganzen plan erledigen".

   Geprüft wird:
    1. Die Kurven der App (--ease-ios, --ease-out, --spring) sind die
       Federn: linear(…) aus einer gedämpften Schwingung.
    2. --feder-fest schwingt nicht nach (steigt nur, endet bei 1);
       --feder-weich schwingt höchstens 1 % über; --feder-formi ~5 %.
    3. Die Federn kommen an: die Seiteneinblendung (.view.show) läuft
       mit linear(…), ein Knopf der Leiste ebenso — im Stil Formi, Dunkel
       und Hell. GEGENPROBE: body.formi (der Stil) hat NICHT die alten
       Kurven bekommen.
    4. Formi bleibt, wie er ist: in der Kugel und auf Formis Seite
       gelten die alten Kurven unverändert (anderer Thread).
    5. Weniger Bewegung: die Seiteneinblendung dauert höchstens 0,01 ms.
    6. Arbeit je Bild (Hauptfaden, CPU ÷4) während der Einblendung nach
       fünf Seitenwechseln, am Handy und am Rechner: die Federn kosten
       nicht mehr als die alten Kurven (Vergleich in derselben Seite).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(name, ok, info) {
  if (ok) { gut++; console.log('  ✓ ' + name); }
  else { schlecht++; console.log('  ✗ ' + name + (info ? '  — ' + info : '')); }
}

async function oeffne(b, w, h, theme, extra) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}, extra || {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript((pr) => {
    try { localStorage.setItem('kf_tour', '99:demo-ich'); localStorage.setItem('kf_prefs', pr); } catch (e) {}
  }, JSON.stringify({ theme, stil2: true }));
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(2200);
  p._ctx = ctx;
  return p;
}

/* Eine linear()-Kurve in Punkte zerlegen: [[wert, anteil 0..1], …]. */
function punkte(s) {
  const m = /linear\((.*)\)/.exec(s || '');
  if (!m) return null;
  const teile = m[1].split(',').map(x => x.trim().split(/\s+/));
  return teile.map((t, i) => [parseFloat(t[0]), t[1] ? parseFloat(t[1]) / 100 : i / (teile.length - 1)]);
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── Die drei Federn ──');
  {
    const p = await oeffne(b, 390, 844, 'formi');
    const t = await p.evaluate(() => {
      const r = getComputedStyle(document.documentElement);
      const v = (k) => r.getPropertyValue(k).trim();
      return { fest: v('--feder-fest'), weich: v('--feder-weich'), formi: v('--feder-formi'),
               ios: getComputedStyle(document.body).getPropertyValue('--ease-ios').trim(),
               aus: getComputedStyle(document.body).getPropertyValue('--ease-out').trim(),
               spring: getComputedStyle(document.body).getPropertyValue('--spring').trim() };
    });
    const f = punkte(t.fest), w = punkte(t.weich), fo = punkte(t.formi);
    pruefe('--feder-fest ist eine linear()-Kurve (' + (f ? f.length : 0) + ' Punkte)', f && f.length >= 10, t.fest);
    if (f) {
      pruefe('--feder-fest steigt nur und endet bei 1 (kein Nachschwingen)',
        f.every((x, i) => i === 0 || x[0] >= f[i - 1][0]) && Math.max(...f.map(x => x[0])) <= 1 && f[f.length - 1][0] === 1);
      const halb = f.find(x => x[1] >= 0.5);
      pruefe('--feder-fest ist zur Hälfte der Zeit fast da (' + halb[0] + ' ≥ 0,9)', halb[0] >= 0.9);
    }
    if (w) {
      const top = Math.max(...w.map(x => x[0]));
      pruefe('--feder-weich schwingt ein wenig, höchstens 1 % über (' + top + ')', top > 1 && top <= 1.01);
    }
    if (fo) {
      const top = Math.max(...fo.map(x => x[0]));
      pruefe('--feder-formi (angelegt, nicht benutzt) schwingt ~5 % über (' + top + ')', top > 1.03 && top <= 1.06);
    }
    pruefe('--ease-ios und --ease-out sind --feder-fest', t.ios === t.fest && t.aus === t.fest, JSON.stringify([t.ios.slice(0, 30), t.aus.slice(0, 30)]));
    pruefe('--spring ist --feder-weich', t.spring === t.weich, t.spring.slice(0, 30));

    console.log('\n── Formi bleibt, wie er ist ──');
    const formi = await p.evaluate(() => {
      const k = document.getElementById('formiKugel');
      const g = document.getElementById('view-gehirn');
      const v = (e, n) => e ? getComputedStyle(e).getPropertyValue(n).trim() : null;
      const kind = k && k.querySelector('*');
      return { kugel: v(k, '--ease-ios'), kugelSpring: v(k, '--spring'), kind: v(kind, '--ease-ios'), gehirn: v(g, '--ease-ios'),
               body: document.body.className.includes('formi') };
    });
    pruefe('in Formis Kugel gilt die alte Kurve (' + formi.kugel + ')', formi.kugel === 'cubic-bezier(.32,.72,0,1)' || formi.kugel === 'cubic-bezier(0.32, 0.72, 0, 1)');
    pruefe('… auch für ihr Nachfedern (' + formi.kugelSpring + ')', /cubic-bezier\(\.?0?\.?34/.test(formi.kugelSpring || ''));
    pruefe('… und in allem, was darin liegt (' + formi.kind + ')', formi.kind === formi.kugel);
    pruefe('auf Formis Seite ebenso (' + formi.gehirn + ')', formi.gehirn === formi.kugel);
    pruefe('GEGENPROBE: der Stil „Formi" am body behält die Federn (body trägt formi: ' + formi.body + ')', formi.body && /^linear/.test(t.ios));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── Die Federn kommen an ──');
  for (const theme of ['formi', 'dark', 'light']) {
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      const p = await oeffne(b, w, h, theme);
      const r = await p.evaluate(async (handy) => {
        const knopf = handy ? document.querySelector('.mn-reihe [data-group="g-arbeit"]') : document.querySelector('#side [data-group="g-arbeit"]');
        knopf.click();
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const v = document.querySelector('.view.show');
        const a = v.getAnimations().find(x => x.animationName === 'viewIn') || v.getAnimations()[0];
        const kurve = a ? a.effect.getComputedTiming().easing : getComputedStyle(v).animationTimingFunction;
        return { kurve, ansicht: v.id };
      }, w <= 820);
      pruefe(theme + ', ' + w + ' px: die Seite (' + r.ansicht + ') gleitet mit der Feder herein', /^linear/.test(r.kurve), r.kurve);
      pruefe(theme + ', ' + w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
  }

  console.log('\n── Weniger Bewegung ──');
  {
    const p = await oeffne(b, 390, 844, 'formi', { reducedMotion: 'reduce' });
    const r = await p.evaluate(async () => {
      document.querySelector('.mn-reihe [data-group="g-arbeit"]').click();
      await new Promise(r => requestAnimationFrame(r));
      const v = document.querySelector('.view.show');
      return getComputedStyle(v).animationDuration;
    });
    pruefe('die Seiteneinblendung ist abgeschaltet (' + r + ')', parseFloat(r) <= 0.01 || r === '0s', r);
    await p._ctx.close();
  }

  console.log('\n── Arbeit je Bild beim Seitenwechsel (Hauptfaden, CPU ÷4) ──');
  /* Gemessen wird die EINBLENDUNG, nicht der Tipp: der Aufbau der neuen
     Seite (showView) ist ein einmaliger Block im Klick und hat mit der
     Kurve nichts zu tun. Also: tippen, zwei Bilder warten, dann 450 ms
     Bewegung messen — fünf Wechsel.

     Geprüft wird der VERGLEICH in derselben Seite: einmal mit den
     Federn, einmal mit den alten Kurven (per Stilblock zurückgesetzt),
     abwechselnd, je zweimal. Die Federn dürfen nicht mehr kosten.

     Die absolute Zahl liegt schon auf main über 8,3 ms (13,8–14,8 ms
     bei 390 px, 18,5–20,1 ms bei 1440 px, gemessen am 23.10.2026). Sie
     wird gedruckt, nicht geprüft — eine Grenze, die vor dieser Runde
     schon gerissen war, sagt über die Federn nichts. Ursachen und
     Stand: docs/FORTSCHRITT.md, Runde 247. */
  const ALT = ':root,:root *{--ease-ios:cubic-bezier(.32,.72,0,1)!important;--ease-out:cubic-bezier(.16,1,.3,1)!important;--spring:cubic-bezier(.34,1.42,.64,1)!important}';
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h, 'formi');
    if (await p.evaluate(() => !!window.__formiLebt && !!window.__formiLebt.uhrenAus)) await p.evaluate(() => window.__formiLebt.uhrenAus());
    await p.waitForTimeout(800);
    const cdp = await p.context().newCDPSession(p);
    await cdp.send('Performance.enable');
    const wert = (m, k) => (m.metrics.find(x => x.name === k) || {}).value || 0;
    const runde = async (alt) => {
      await p.evaluate(([alt, css]) => {
        let st = document.getElementById('testAlteKurven');
        if (alt && !st) { st = document.createElement('style'); st.id = 'testAlteKurven'; st.textContent = css; document.head.appendChild(st); }
        if (!alt && st) st.remove();
      }, [alt, ALT]);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      let arbeit = 0, bilder = 0;
      for (const g of ['g-arbeit', 'g-zeit', 'g-team', 'g-komm', 'g-start']) {
        await p.evaluate(async ([g, handy]) => {
          const k = handy ? document.querySelector('.mn-reihe [data-group="' + g + '"]') : document.querySelector('#side [data-group="' + g + '"]');
          if (k) k.click();
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        }, [g, w <= 820]);
        const a = await cdp.send('Performance.getMetrics');
        const n = await p.evaluate(() => new Promise(r => { let n = 0; const ende = performance.now() + 450; (function f() { n++; if (performance.now() < ende) requestAnimationFrame(f); else r(n); })(); }));
        const z = await cdp.send('Performance.getMetrics');
        arbeit += wert(z, 'TaskDuration') - wert(a, 'TaskDuration');
        bilder += n;
        await p.waitForTimeout(300);
      }
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      return arbeit * 1000 / bilder;
    };
    const feder = [], alt = [];
    for (let i = 0; i < 2; i++) { feder.push(await runde(false)); alt.push(await runde(true)); }
    const mittel = (x) => Math.round(x.reduce((s, v) => s + v, 0) / x.length * 10) / 10;
    const mf = mittel(feder), ma = mittel(alt);
    console.log('  · ' + w + ' px: Federn ' + mf + ' ms je Bild, alte Kurven ' + ma + ' ms (je 2 × 5 Wechsel; Grenze 8,3 ms — siehe Kommentar)');
    pruefe(w + ' px: die Federn kosten nicht mehr als die alten Kurven (' + mf + ' gegen ' + ma + ', Spielraum 2 ms)', mf <= ma + 2);
    pruefe(w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Federn: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Federn: drei Federn statt vieler Kurven, Formi unverändert — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})();
