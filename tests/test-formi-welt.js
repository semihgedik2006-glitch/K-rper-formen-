/* ══ FORMI-WELT, STUFE 2: DIE APP IM FORMI-LOOK (Runde 212) ══════════
   Aus dem Betrieb, 22.10.2026: „können wir noch mehr am design anpassen
   und auch mehr auf den formi look eingehen also das die app so ein
   ähnliches verhalten und design hat" – und auf die Rückfragen „1. b
   2. ja 3. alle vier".

   Geprüft wird, im Stil „Formi":
    1. Flächen: Karten und die Gruppen der Startseite haben Formis
       schillernde Kante (Verlauf als border-box) über einem schwarzen
       Kern. Seit Runde 241 an der Gruppe, nicht mehr an jeder Zeile.
    2. Wo man ist: aktiver Raum links mit Formis Verlauf, Strich unter dem
       offenen Reiter im Verlauf, Seitentitel im Verlauf.
    3. Der Ring bleibt Formi: das Zeichen im Seitenkopf ist ein Quadrat
       (Rundung < Hälfte der Breite), kein Kreis.
    4. Hauptknöpfe im Verlauf mit dunkler Schrift – Kontrast an echten
       Bildpunkten ≥ 4,5 : 1.
    5. Teilchen beim Abhaken; GEGENPROBE: keine bei „Bewegung reduzieren".
    (6./7. Leere Listen und Laden kamen parallel in Runde 209 und werden
       in test-formi-lebt geprüft.)
    8. Tagesabschluss: Glitch über dem Kopf, Teilchen von oben, Satz.
    9. GEGENPROBE Stil „Hell": keine schillernde Kante.
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
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    opt.reduziert ? { reducedMotion: 'reduce' } : {}, w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript((pr) => {
    try { localStorage.setItem('kf_tour', '1:testuid'); if (pr) localStorage.setItem('kf_prefs', pr); } catch (e) {}
  }, opt.prefs || null);
  await p.addInitScript({ path: SP + '/stub-chef.js' });
  await p.goto(APP + '?neu=1', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(900);
  p._ctx = ctx;
  return p;
}
const zu = (p) => p._ctx.close();
const tippe = async (p, sel) => {
  const ok = await p.evaluate((s) => { const e = [...document.querySelectorAll(s)].find(x => x.getClientRects().length); if (e) e.click(); return !!e; }, sel);
  await p.waitForTimeout(500); return ok;
};
function lum(c) { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); }
function kontrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1–3 Flächen, wo man ist, der Ring bleibt Formi ──');
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await oeffne(b, w, h);
    const m = await p.evaluate(() => {
      /* Runde 241 („Apple-Grundgerüst, Formi als Akzent“; zu den
         Probebildern: „genau so hab ichs mir vorgestellt“): die Zeilen
         stehen jetzt in EINER Gruppe je Abschnitt, und die schillernde
         Kante sitzt an der Gruppe statt an jeder Zeile. Geprüft wird
         dieselbe Kante — an der Fläche, die sie jetzt trägt. Die Farbe
         der Art steht im Zeichen der Zeile (test-gruppen-titel). */
      const z = document.querySelector('#heuteListe .heute-zeile');
      const g = z ? z.closest('.heute-liste') : null;
      const cs = g ? getComputedStyle(g) : null;
      const kopf = document.querySelector('.bk-ikon'), kr = kopf.getBoundingClientRect();
      const titel = getComputedStyle(document.getElementById('bkTitel'));
      const strich = getComputedStyle(document.getElementById('subnav'), '::before').backgroundImage;
      const aktiv = document.querySelector('#side .tab.active');
      return {
        kante: cs ? /linear-gradient/.test(cs.backgroundImage) && (cs.backgroundImage.match(/gradient/g) || []).length >= 2 && cs.borderTopColor === 'rgba(0, 0, 0, 0)' : false,
        titel: /gradient/.test(titel.backgroundImage) && titel.color === 'rgba(0, 0, 0, 0)',
        strich: /gradient/.test(strich),
        quadrat: parseFloat(getComputedStyle(kopf).borderTopLeftRadius) < kr.width / 2 - 2,
        aktiv: aktiv ? /gradient/.test(getComputedStyle(aktiv, '::before').backgroundImage) : null
      };
    });
    pruefe(w + ' px: Gruppe der Startseite mit schillernder Kante über schwarzem Kern', m.kante, JSON.stringify(m));
    pruefe(w + ' px: Seitentitel und Reiter-Strich in Formis Verlauf', m.titel && m.strich, JSON.stringify(m));
    pruefe(w + ' px: das Zeichen im Seitenkopf ist ein Quadrat, kein Ring', m.quadrat, JSON.stringify(m));
    if (w > 820) pruefe(w + ' px: der aktive Raum links trägt Formis Verlauf', m.aktiv === true, JSON.stringify(m));
    pruefe(w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 4 Hauptknopf: Kontrast an echten Bildpunkten ──');
  {
    const p = await oeffne(b, 1440, 900);
    await p.click('#formiKugel'); await p.waitForTimeout(700);
    const knopf = await p.evaluate(() => {
      const k = [...document.querySelectorAll('#jarvis .btn-primary, .btn-primary')].find(e => e.getClientRects().length && e.getBoundingClientRect().width > 60);
      if (!k) return null;
      const r = k.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, farbe: getComputedStyle(k).color };
    });
    pruefe('ein Hauptknopf ist im Bild', !!knopf, JSON.stringify(knopf));
    if (knopf) {
      const bild = await p.screenshot({ clip: { x: knopf.x, y: knopf.y, width: knopf.w, height: knopf.h } });
      const werte = await p.evaluate(async (b64) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const x = c.getContext('2d'); x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, c.width, c.height).data;
        /* Hintergrund: Bildpunkte an den Rändern links/rechts (Verlauf von
           Türkis bis Orange), oben und unten je 3 px Abstand. */
        const proben = [];
        for (const fx of [0.06, 0.25, 0.5, 0.75, 0.94]) {
          const i = (Math.round(c.height * 0.18) * c.width + Math.round(c.width * fx)) * 4;
          proben.push([d[i], d[i + 1], d[i + 2]]);
        }
        return proben;
      }, bild.toString('base64'));
      const text = knopf.farbe.match(/\d+/g).slice(0, 3).map(Number);
      const k = Math.min(...werte.map(w => kontrast(w, text)));
      pruefe('Hauptknopf: dunkle Schrift auf Formis Verlauf, schwächste Stelle ' + k.toFixed(1) + ' : 1 (≥ 4,5)', k >= 4.5, JSON.stringify(werte));
    }
    await zu(p);
  }

  console.log('\n── 5 Teilchen beim Abhaken ──');
  for (const reduziert of [false, true]) {
    const p = await oeffne(b, 1440, 900, { reduziert });
    await tippe(p, '#side [data-group="g-arbeit"]');
    const n = await p.evaluate(async () => {
      const k = [...document.querySelectorAll('#todoArea .todo:not(.done) .check')].find(e => e.getClientRects().length);
      if (!k) return -1;
      k.click(); await new Promise(r => setTimeout(r, 80));
      return document.querySelectorAll('.formi-teilchen').length;
    });
    if (!reduziert) pruefe('Abhaken: Teilchen in Formis Farben stieben aus dem Haken (' + n + ')', n >= 8, String(n));
    else pruefe('GEGENPROBE „Bewegung reduzieren": keine Teilchen', n === 0, String(n));
    await p.waitForTimeout(1000);
    if (!reduziert) pruefe('… und sind danach wieder weg', await p.evaluate(() => !document.querySelector('.formi-teilchen')));
    await zu(p);
  }

  console.log('\n── 8 Tagesabschluss ──');
  {
    const p = await oeffne(b, 1440, 900);
    const t = await p.evaluate(async () => {
      if (!window.__formiWelt) return { fehlt: true };
      window.__formiWelt.tagesabschluss('Alle Aufgaben erledigt – Formi feiert mit');
      await new Promise(r => setTimeout(r, 120));
      return { glitch: !!document.querySelector('.formi-glitch'), teilchen: document.querySelectorAll('.confetti').length,
        satz: (document.querySelector('.toast') || {}).textContent || '' };
    });
    pruefe('Tagesabschluss: Glitch über dem Kopf, Teilchen, Satz', t.glitch && t.teilchen > 10 && /Formi feiert mit/.test(t.satz), JSON.stringify(t));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 9 Gegenprobe Stil „Hell" ──');
  {
    const p = await oeffne(b, 1440, 900, { prefs: JSON.stringify({ theme: 'light', stil2: true }) });
    const m = await p.evaluate(() => { const z = document.querySelector('#heuteListe .heute-zeile'); return z ? getComputedStyle(z).backgroundImage + ' ' + getComputedStyle(z.closest('.heute-liste')).backgroundImage : ''; });
    pruefe('GEGENPROBE Stil Hell: keine schillernde Kante', !/5fe1ff|95, 225, 255/i.test(m), m.slice(0, 120));
    await zu(p);
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Formi-Welt: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Formi-Welt: Kanten, Farben, Ring nur Formi, Kontrast, Teilchen, Abschluss — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
