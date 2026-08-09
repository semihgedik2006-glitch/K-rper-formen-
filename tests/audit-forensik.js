/* Forensischer Durchlauf: alle Ansichten, alle Rollen, viele Breiten.
   Misst statt zu schaetzen. Schreibt nichts, aendert nichts.

   Geprueft wird je Ansicht:
     - waagerechtes Ueberlaufen (Layout bricht)
     - Fingerziele unter 44 Pixel
     - Fokus-Sichtbarkeit beim Durchtabben
     - Fehler in der Konsole
     - Anzahl DOM-Knoten
     - Kontrast von Text gegen seinen Hintergrund

   Aufruf:  node tests/audit-forensik.js [rolle]                */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Ansicht -> Navigationsgruppe. Die App laeuft in einer IIFE, showView()
// ist nicht global - also wird geklickt wie ein Nutzer: erst die Gruppe
// unten, dann der Reiter oben.
const VIEWS = [
  ['home', 'g-start'], ['chat', 'g-komm'], ['dm', 'g-komm'], ['ann', 'g-komm'],
  ['todos', 'g-arbeit'], ['putzplan', 'g-arbeit'], ['material', 'g-arbeit'],
  ['geraete', 'g-arbeit'], ['docs', 'g-arbeit'],
  ['team', 'g-team'], ['chef', 'g-chef'], ['archive', 'g-chef'],
];

async function geheZu(page, view, gruppe) {
  const ok = await page.evaluate(({ v, g }) => {
    const grp = document.querySelector('.mobnav [data-group="' + g + '"]');
    if (!grp) return 'keine-gruppe';
    grp.click();
    return 'gruppe';
  }, { v: view, g: gruppe });
  if (ok === 'keine-gruppe') return false;
  await page.waitForTimeout(320);
  const fertig = await page.evaluate(v => {
    const el = document.getElementById('view-' + v);
    if (el && el.offsetParent !== null) return true;
    const sub = document.querySelector('[data-subview="' + v + '"]');
    if (!sub) return false;
    sub.click();
    return 'geklickt';
  }, view);
  if (fertig === false) return false;
  await page.waitForTimeout(320);
  return await page.evaluate(v => {
    const el = document.getElementById('view-' + v);
    return !!el && el.offsetParent !== null;
  }, view);
}
const BREITEN = [320, 360, 390, 430, 600, 768, 834, 1024, 1280, 1600, 1920];

// Relative Leuchtdichte nach WCAG
function lum(r, g, b) {
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function kontrast(a, b) {
  const la = lum(...a), lb = lum(...b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
const parse = s => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);

(async () => {
  const rolle = process.argv[2] || 'chef';
  const funde = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const konsole = [];
  page.on('pageerror', e => konsole.push('PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load|gstatic/.test(m.text())) konsole.push('CONSOLE: ' + m.text().slice(0, 160));
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-' + rolle + '.js' });

  const t0 = Date.now();
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await page.mouse.click(195, 400).catch(() => {});
  await page.waitForTimeout(3000);
  const ladezeit = Date.now() - t0;

  const zahlen = await page.evaluate(() => ({
    knoten: document.querySelectorAll('*').length,
    hoerer: 0,
    stylesheetRegeln: [...document.styleSheets].reduce((n, s) => {
      try { return n + s.cssRules.length; } catch (e) { return n; }
    }, 0),
  }));

  // ── Durchlauf: jede Ansicht bei jeder Breite ──
  const erreicht = [], gesehenZiel = new Set();
  for (const [v, g] of VIEWS) {
    for (const w of BREITEN) {
      await page.setViewportSize({ width: w, height: w < 700 ? 844 : 900 });
      const drin = await geheZu(page, v, g);
      if (!drin) { if (w === 390) funde.push({ art: 'UNERREICHBAR', view: v }); continue; }
      if (w === 390) erreicht.push(v);
      await page.waitForTimeout(160);

      const r = await page.evaluate(({ view, breite }) => {
        const out = { ueberlauf: null, ziele: [], verdeckt: [] };
        const de = document.documentElement;
        if (de.scrollWidth > breite + 1) {
          // Wer ist schuld?
          let taeter = null, maxR = 0;
          document.querySelectorAll('.view:not([style*="none"]) *').forEach(el => {
            const rc = el.getBoundingClientRect();
            if (rc.width === 0) return;
            if (rc.right > breite + 1 && rc.right > maxR) {
              maxR = rc.right;
              taeter = (el.tagName + '.' + (el.className || '').toString().split(' ')[0]).slice(0, 50);
            }
          });
          out.ueberlauf = { scrollWidth: de.scrollWidth, taeter, bis: Math.round(maxR) };
        }
        const sicht = document.getElementById('view-' + view);
        if (!sicht || sicht.offsetParent === null) return out;
        const klick = 'button,a,input,select,textarea,[role="button"],[data-go],[onclick]';
        sicht.querySelectorAll(klick).forEach(el => {
          const rc = el.getBoundingClientRect();
          if (rc.width < 2 || rc.height < 2) return;      // unsichtbar
          if (el.offsetParent === null) return;
          // Zeile selbst anklickbar? Dann ist das Symbol kein eigenes Ziel.
          const zeile = el.closest('[data-go],.doc,.att-row,.ms-act,.t-row');
          const inZeile = zeile && zeile !== el && zeile.getBoundingClientRect().height >= 44;

          // Nicht die gemalte Hoehe zaehlt, sondern was der Finger trifft.
          // Eine unsichtbare ::after-Flaeche vergroessert das Ziel, ohne das
          // Aussehen zu aendern - getBoundingClientRect sieht sie nicht,
          // elementFromPoint schon.
          const cx = rc.left + rc.width / 2, cy = rc.top + rc.height / 2;
          // Wer gerade halb unter der klebenden Kopfleiste oder ueber der
          // Fussnavigation liegt, laesst sich per elementFromPoint nicht
          // messen - dort antwortet die Leiste. Das ist kein Fehler des
          // Bauteils, also ueberspringen statt falsch melden.
          if (cy < 110 || cy > window.innerHeight - 110) return;
          const meins = q => {
            const t = document.elementFromPoint(q[0], q[1]);
            return !!t && (t === el || el.contains(t) || t.contains(el));
          };
          const treffer = rc.height >= 43.5 ||
            (meins([cx, cy - 21]) && meins([cx, cy + 21]));

          if (!treffer && !inZeile) {
            out.ziele.push({
              was: (el.textContent || el.getAttribute('aria-label') || el.id || el.className || '?')
                .toString().replace(/\s+/g, ' ').trim().slice(0, 24),
              klasse: (el.className || el.tagName).toString().split(' ')[0].slice(0, 24),
              h: Math.round(rc.height), w: Math.round(rc.width),
            });
          }
          // Gegenprobe: Klaut eine vergroesserte Flaeche einem Nachbarn den
          // Klick? Dann trifft man in dessen Mitte etwas anderes.
          // Nur echte Diebstaehle melden. Wer gerade unter einer klebenden
          // Kopf- oder Fussleiste liegt, ist nicht "verdeckt" - er ist
          // weggescrollt. Das ist kein Fehler.
          const mitte = document.elementFromPoint(cx, cy);
          const klebt = (() => {
            for (let g = mitte; g; g = g.parentElement) {
              const po = getComputedStyle(g).position;
              if (po === 'fixed' || po === 'sticky') return true;
            }
            return false;
          })();
          if (mitte && mitte !== el && !klebt && !el.contains(mitte) && !mitte.contains(el)) {
            out.verdeckt.push({
              was: (el.textContent || el.getAttribute('aria-label') || el.className || '?')
                .toString().replace(/\s+/g, ' ').trim().slice(0, 24),
              durch: (mitte.className || mitte.tagName).toString().split(' ')[0].slice(0, 24),
            });
          }
        });
        return out;
      }, { view: v, breite: w });

      if (r.ueberlauf) funde.push({ art: 'UEBERLAUF', view: v, breite: w, ...r.ueberlauf });
      if (r.verdeckt && r.verdeckt.length && w === 390) {
        r.verdeckt.forEach(z => {
          const key = 'V' + v + '|' + z.was + '|' + z.durch;
          if (gesehenZiel.has(key)) return;
          gesehenZiel.add(key);
          funde.push({ art: 'VERDECKT', view: v, ...z });
        });
      }
      if (r.ziele.length && w === 390) {
        r.ziele.forEach(z => {
          const key = v + '|' + z.was + '|' + z.h;
          if (gesehenZiel.has(key)) return;
          gesehenZiel.add(key);
          funde.push({ art: 'FINGERZIEL', view: v, ...z });
        });
      }
    }
  }

  // ── Kontrast: jeden sichtbaren Text gegen seinen Grund ──
  await page.setViewportSize({ width: 390, height: 844 });
  for (const hell of [false, true]) {
    // Umschalten wie ein Nutzer: ueber den Knopf. Die App laeuft in einer
    // IIFE - PREFS und applyPrefs() sind absichtlich nicht global. Wer
    // stattdessen body.light direkt setzt, laesst die Akzent-Variablen auf
    // den Werten des anderen Modus stehen und misst Farben, die so nie
    // jemand sieht.
    await page.evaluate(h => {
      if (document.body.classList.contains('light') !== h) {
        document.getElementById('themeBtn').click();
      }
    }, hell);
    await page.waitForTimeout(200);
    const istHell = await page.evaluate(() => document.body.classList.contains('light'));
    if (istHell !== hell) { console.log('WARNUNG: Modus liess sich nicht umschalten'); continue; }
    await page.evaluate(() => { window.__grund = getComputedStyle(document.body).backgroundColor; });
    for (const [v, g] of VIEWS) {
      if (!(await geheZu(page, v, g))) continue;
      await page.waitForTimeout(180);
      const paare = await page.evaluate(view => {
        const sicht = document.getElementById('view-' + view);
        if (!sicht || sicht.offsetParent === null) return [];
        const raus = [], gesehen = new Set();
        sicht.querySelectorAll('*').forEach(el => {
          if (el.children.length) return;                 // nur Blattknoten
          const t = (el.textContent || '').trim();
          if (!t || el.offsetParent === null) return;
          // Emoji bringen ihre Farbe selbst mit - die CSS-Farbe trifft sie
          // gar nicht. Wer sie mitmisst, meldet Fehler, die keine sind.
          if (!/[a-zA-Z0-9\u00C0-\u024F]/.test(t)) return;
          const cs = getComputedStyle(el);
          if (/rgba\(.*,\s*0\)$/.test(cs.color)) return;   // unsichtbarer Text
          const rc = el.getBoundingClientRect();
          if (rc.height < 4) return;
          // Halbdurchsichtige Flaechen uebereinanderlegen, sonst misst man
          // gegen die Deckfarbe statt gegen das, was man wirklich sieht.
          const zahl = c => (c.match(/[\d.]+/g) || []).map(Number);
          // Verlaeufe liegen als background-image an und lassen sich nicht
          // auf eine Farbe reduzieren. Wer sie ignoriert, misst gegen die
          // Seite dahinter und meldet Weiss-auf-Weiss, wo in Wahrheit
          // weisser Text auf dem Markenverlauf steht.
          let verlauf = false;
          for (let g = el; g; g = g.parentElement) {
            if (getComputedStyle(g).backgroundImage !== 'none') { verlauf = true; break; }
            const c0 = zahl(getComputedStyle(g).backgroundColor);
            if (c0.length >= 3 && (c0.length < 4 || c0[3] >= 1)) break;
          }
          if (verlauf) return;
          const stapel = [];
          for (let g = el; g; g = g.parentElement) {
            const c = zahl(getComputedStyle(g).backgroundColor);
            if (c.length >= 3) {
              const a = c.length > 3 ? c[3] : 1;
              if (a > 0) { stapel.push([c[0], c[1], c[2], a]); if (a >= 1) break; }
            }
          }
          let mix = (window.__grund && zahl(window.__grund).slice(0, 3)) || [255, 255, 255];
          for (let i = stapel.length - 1; i >= 0; i--) {
            const [r, g2, b2, a] = stapel[i];
            mix = [r * a + mix[0] * (1 - a), g2 * a + mix[1] * (1 - a), b2 * a + mix[2] * (1 - a)];
          }
          const bg = 'rgb(' + mix.map(Math.round).join(', ') + ')';
          const px = parseFloat(cs.fontSize), fett = parseInt(cs.fontWeight, 10) >= 700;
          const k = cs.color + '|' + bg + '|' + Math.round(px) + fett;
          if (gesehen.has(k)) return; gesehen.add(k);
          raus.push({ vg: cs.color, bg, px, fett, bsp: t.slice(0, 28) });
        });
        return raus;
      }, v);
      paare.forEach(p => {
        const vg = parse(p.vg), bg = parse(p.bg);
        if (vg.length < 3 || bg.length < 3) return;
        const k = kontrast(vg, bg);
        const gross = p.px >= 24 || (p.px >= 18.66 && p.fett);
        const noetig = gross ? 3 : 4.5;
        if (k < noetig) {
          funde.push({
            art: 'KONTRAST', view: v, modus: hell ? 'hell' : 'dunkel',
            wert: k.toFixed(2), noetig, px: Math.round(p.px), bsp: p.bsp, vg: p.vg, bg: p.bg,
          });
        }
      });
    }
  }
  await page.evaluate(() => {
    if (document.body.classList.contains('light')) document.getElementById('themeBtn').click();
  });

  // ── Fokus: 60-mal Tab, ist der Fokus jedes Mal sichtbar? ──
  await geheZu(page, 'home', 'g-start');
  await page.waitForTimeout(300);
  const fokusFunde = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const sichtbar =
        (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) ||
        (cs.boxShadow && cs.boxShadow !== 'none');
      return {
        was: (el.getAttribute('aria-label') || el.textContent || el.id || el.className || el.tagName)
          .toString().replace(/\s+/g, ' ').trim().slice(0, 34),
        tag: el.tagName, sichtbar,
        imBild: (() => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; })(),
      };
    });
    if (f && f.imBild && !f.sichtbar && !fokusFunde.some(x => x.was === f.was)) fokusFunde.push(f);
  }
  fokusFunde.forEach(f => funde.push({ art: 'FOKUS', was: f.was, tag: f.tag }));

  // ── Ausgabe ──
  const nachArt = {};
  funde.forEach(f => { (nachArt[f.art] = nachArt[f.art] || []).push(f); });
  console.log('\n════ FORENSIK · Rolle ' + rolle + ' ════');
  console.log('Ladezeit bis bedienbar: ' + ladezeit + ' ms');
  console.log('DOM-Knoten: ' + zahlen.knoten + ' · CSS-Regeln: ' + zahlen.stylesheetRegeln);
  console.log('Erreichte Ansichten: ' + erreicht.join(', '));
  console.log('Konsole: ' + (konsole.length ? konsole.join(' | ') : 'sauber'));
  for (const art of ['UNERREICHBAR', 'UEBERLAUF', 'VERDECKT', 'FINGERZIEL', 'KONTRAST', 'FOKUS']) {
    const l = nachArt[art] || [];
    console.log('\n── ' + art + ': ' + l.length + ' ──');
    if (art === 'FINGERZIEL') {
      // Nach Bauteil buendeln - 300 Einzelzeilen sagen weniger als
      // 12 Bauteile mit Anzahl und kleinster gemessener Hoehe.
      const grp = {};
      l.forEach(f => {
        const k = f.klasse;
        grp[k] = grp[k] || { klasse: k, n: 0, minH: 99, views: new Set(), bsp: f.was };
        grp[k].n++; grp[k].minH = Math.min(grp[k].minH, f.h); grp[k].views.add(f.view);
      });
      Object.values(grp).sort((a, b2) => a.minH - b2.minH).forEach(g =>
        console.log('   ' + g.minH + 'px · ' + g.n + '× · .' + g.klasse +
          ' · [' + [...g.views].join(',') + '] · z.B. "' + g.bsp + '"'));
      continue;
    }
    l.slice(0, 30).forEach(f => console.log('   ' + JSON.stringify(f)));
    if (l.length > 30) console.log('   … und ' + (l.length - 30) + ' weitere');
  }
  await b.close();
})();
