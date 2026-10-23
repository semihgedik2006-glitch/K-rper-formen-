/* ══════════════════════════════════════════════════════════════════════
   FORMI-INSEL, LEUCHTRAND, LICHTKRÜMMUNG, GEZEITENSTROM (Runde 247)

   Aus dem Betrieb, zu den Apple-Entwürfen:
   „ich finde die insel und die widgets super krass falls das geht können
   wir das schonmal umsetzten … diesen leucht ring am rand find ich auch
   mega … wenn er was für uns in der app macht und man kann das live
   sehen wie er eine aufgabe abhakt oder etwas anlegt" — „es soll am ende
   immer noch ein schwarzes loch sein".
   Und: „können wir fürs aufgaben einsaugen einen besseren effekt machen
   … und mehr verzerrung auch für den hintergrund und so ums loch herum".

   Geprüft:
   1. Linse: ein Kreis um die Kugel krümmt, was dahinter liegt —
      gemessen an echten Bildpunkten (mit/ohne). Die Kugel bleibt bei
      320–1920, normal und kompakt, per Hit-Test ≥ 44 × 44 treffbar, der
      Kreis fängt keinen Klick.
   2. Strom: ein Haken zerlegt den Titel in Buchstaben (plus
      Nachleuchten), jeder läuft gekrümmt (≥ 180° um Formi) und wird
      lang gezogen (≥ 5-fach); nur transform/opacity; danach ist alles
      weg. Gegenprobe „weniger Bewegung": kein Strom.
   3. Insel und Rand: Formi denkt → Insel klein mit Text, Rand an und
      strömt (nur transform). Formi hakt ab → Insel gross mit „Abgehakt ·
      Studio" und Titel, die Buchstaben fallen in Formi IN der Insel.
      Danach beides weg. Formi legt an → die Buchstaben kommen aus ihm.
   4. Lage: Insel im Bild, ohne Trefferfläche, nie auf einem Knopf der
      Kopfleiste — bei 320 / 390 / 430 / 820 / 1280 / 1440 / 1920.
   NICHT geprüft: Safari und Firefox (dort ist die Linse absichtlich aus,
   die Insel geht überall), echte Handys, die Arbeit je Bild.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const path = require('path');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;

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
  await p.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(1000);
  await p.evaluate(() => window.__formiLebt.uhrenAus());
  p._ctx = ctx;
  return p;
}
const zeige = (p, id) => p.evaluate((id) => { history.pushState({ v: id }, '', '#' + id); window.dispatchEvent(new PopStateEvent('popstate', { state: { v: id } })); }, id);

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── 1 Lichtkrümmung ums Loch ──');
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const p = await oeffne(b, w, h);
      await zeige(p, 'todos'); await p.waitForTimeout(1300);
      const l = await p.evaluate(() => {
        const k = document.getElementById('formiKugel').getBoundingClientRect(), c = document.getElementById('formiLinseKreis');
        const r = c.getBoundingClientRect(), s = getComputedStyle(c);
        return { an: document.documentElement.classList.contains('linse-ok'), sicht: !c.hidden && r.width > 100,
          dx: Math.abs((r.left + r.width / 2) - (k.left + k.width / 2)), dy: Math.abs((r.top + r.height / 2) - (k.top + k.height / 2)),
          pe: s.pointerEvents, bf: s.backdropFilter, filter: !!document.querySelector('#formiLinse feDisplacementMap'),
          k: { x: k.left, y: k.top, w: k.width, h: k.height } };
      });
      pruefe(`${w} px: Kreis um die Kugel (mittig ±2 px), Verschiebungskarte, keine Trefferfläche`,
        l.an && l.sicht && l.dx <= 2 && l.dy <= 2 && l.pe === 'none' && /formiLinse/.test(l.bf) && l.filter, JSON.stringify(l));
      /* echte Bildpunkte: ein Ring um die Kugel, mit und ohne Linse */
      const clip = { x: Math.max(0, Math.round(l.k.x - 60)), y: Math.max(0, Math.round(l.k.y - 60)), width: Math.round(Math.min(w, l.k.x + l.k.w + 60) - Math.max(0, l.k.x - 60)), height: Math.round(Math.min(h, l.k.y + l.k.h + 60) - Math.max(0, l.k.y - 60)) };
      const mit = await p.screenshot({ clip });
      await p.evaluate(() => document.documentElement.classList.remove('linse-ok')); await p.waitForTimeout(150);
      const ohne = await p.screenshot({ clip });
      await p.evaluate(() => document.documentElement.classList.add('linse-ok')); await p.waitForTimeout(150);
      const anders = await p.evaluate(async ([a, b2, kx, ky, kw, kh, cx, cy]) => {
        const lade = (s) => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
        const [A, B] = await Promise.all([lade(a), lade(b2)]);
        const c = document.createElement('canvas'); c.width = A.width; c.height = A.height; const g = c.getContext('2d');
        g.drawImage(A, 0, 0); const da = g.getImageData(0, 0, c.width, c.height).data;
        g.clearRect(0, 0, c.width, c.height); g.drawImage(B, 0, 0); const db = g.getImageData(0, 0, c.width, c.height).data;
        let n = 0;
        /* nur AUSSERHALB der Kugel zählen — dort ist es die Umgebung */
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
          const vx = x + cx, vy = y + cy; if (vx > kx - 4 && vx < kx + kw + 4 && vy > ky - 4 && vy < ky + kh + 4) continue;
          const i = (y * c.width + x) * 4; if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 30) n++;
        }
        return n;
      }, [mit.toString('base64'), ohne.toString('base64'), l.k.x, l.k.y, l.k.w, l.k.h, clip.x, clip.y]);
      pruefe(`${w} px: die Umgebung der Kugel ist sichtbar gekrümmt (${anders} Bildpunkte anders)`, anders >= 150, String(anders));
      /* Gegenprobe Puls: stärkere Krümmung während des Schluckens */
      const puls = await p.evaluate(async () => { const d = document.getElementById('formiLinseD'), a = +d.getAttribute('scale'); window.__formiLebt.linsePuls(); await new Promise(r => setTimeout(r, 650)); return [a, +d.getAttribute('scale')]; });
      pruefe(`${w} px: beim Schlucken wird die Krümmung stärker (${puls[0]} → ${puls[1]})`, puls[1] > puls[0] * 1.3, JSON.stringify(puls));
      pruefe(`${w} px: ohne Skriptfehler`, !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
    /* Trefferfläche der Kugel mit Linse, alle Breiten, beide Dichten */
    for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      const p = await oeffne(b, w, h);
      for (const dichte of ['normal', 'kompakt']) {
        if (dichte === 'kompakt') { await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt')); await p.waitForTimeout(300); }
        const t = await p.evaluate(() => {
          const k = document.getElementById('formiKugel'); if (k.hidden) return null; const r = k.getBoundingClientRect(); let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
          for (let y = Math.floor(r.top); y <= r.bottom; y += 2) for (let x = Math.floor(r.left); x <= r.right; x += 2) {
            const e = document.elementFromPoint(x, y); if (e && (e === k || k.contains(e))) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
          return { w: x1 - x0 + 2, h: y1 - y0 + 2 };
        });
        pruefe(`${w} px ${dichte}: Kugel trotz Linse ${t ? t.w + '×' + t.h : '—'} treffbar`, t && t.w >= 44 && t.h >= 44, JSON.stringify(t));
      }
      await p._ctx.close();
    }

    console.log('\n── 2 Gezeitenstrom beim Abhaken ──');
    {
      const p = await oeffne(b, 1440, 900);
      await zeige(p, 'todos'); await p.waitForTimeout(700);
      const s = await p.evaluate(async () => {
        const c = document.querySelector('#todoArea .todo:not(.done) .check'); if (!c) return null;
        const t = c.closest('.todo').querySelector('.t-title');
        const text = [].filter.call(t.childNodes, n => n.nodeType === 3).map(n => n.nodeValue).join(' ').trim().slice(0, 40);
        window.__formiLebt.schlucken('#todoArea .todo:not(.done) .check');
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const box = document.querySelector('.formi-strom'); if (!box) return { text, box: false };
        const k = document.getElementById('formiKugel').getBoundingClientRect(), kx = k.left + k.width / 2, ky = k.top + k.height / 2;
        const zeichen = [...box.querySelectorAll('i:not(.spur)')].filter(i => i.style.display !== 'none');
        const spur = box.querySelectorAll('i.spur').length;
        const anim = [...box.querySelectorAll('i')].flatMap(i => i.getAnimations());
        const eig = (EIGF => EIGF(anim))(a => [...new Set(a.flatMap(x => x.effect.getKeyframes().flatMap(f => Object.keys(f).filter(k => !['offset','easing','composite','computedOffset','pseudoElement'].includes(k)))))]);
        /* Bahn des ersten Buchstabens: Winkel um Formi aufsummiert, grösste Streckung */
        const z = zeichen[0], kf = z.getAnimations().find(a => !a.effect.pseudoElement).effect.getKeyframes();
        const zr = z.parentElement.getBoundingClientRect();
        let summe = 0, alt = null, streck = 0;
        kf.forEach(f => { const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\).*scale\(([-\d.]+),\s*([-\d.]+)\)/.exec(f.transform); if (!m) return;
          const x = zr.left + +m[1], y = zr.top + +m[2], w = Math.atan2(y - ky, x - kx);
          if (alt !== null) { let d = w - alt; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; summe += d; } alt = w;
          streck = Math.max(streck, (+m[3]) / Math.max(.01, +m[4])); });
        return { text, box: true, n: zeichen.length, soll: text.replace(/\s/g, '').length, spur, eig, grad: Math.abs(summe * 180 / Math.PI), streck };
      });
      pruefe(`ein Haken zerlegt „${s && s.text}" in ${s && s.n} Buchstaben (+ ${s && s.spur} Nachleuchten)`, s && s.box && s.n === s.soll && s.spur === s.n, JSON.stringify(s));
      pruefe(`die Bahn krümmt sich um Formi (${s && Math.round(s.grad)}°)`, s && s.grad >= 180, JSON.stringify(s));
      pruefe(`… und zieht die Buchstaben zu Fäden (bis ${s && s.streck.toFixed(1)}-fach)`, s && s.streck >= 5, JSON.stringify(s));
      pruefe('nur transform und opacity', s && s.eig.every(e => e === 'transform' || e === 'opacity'), s && s.eig.join(','));
      await p.waitForTimeout(3300);
      pruefe('danach ist der Strom weg', await p.evaluate(() => !document.querySelector('.formi-strom')));
      pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
      const r = await oeffne(b, 1440, 900, { reducedMotion: 'reduce' });
      await zeige(r, 'todos'); await r.waitForTimeout(600);
      const g = await r.evaluate(async () => { window.__formiLebt.schlucken('#todoArea .todo:not(.done) .check'); await new Promise(x => setTimeout(x, 100)); return !!document.querySelector('.formi-strom'); });
      pruefe('GEGENPROBE „weniger Bewegung": kein Strom', !g);
      await r._ctx.close();
    }

    console.log('\n── 3 Insel und Leuchtrand, wenn Formi etwas tut ──');
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const p = await oeffne(b, w, h);
      await zeige(p, 'todos'); await p.waitForTimeout(500);
      await p.click('#formiKugel'); await p.waitForTimeout(700);
      /* eine Frage, die zur KI geht — sie antwortet nach 1,2 s */
      await p.evaluate(() => { window.__antwort = window.__antwort || {}; window.__antwort.gehirnAktion = () => new Promise(r => setTimeout(() => r({ data: { art: 'frage', antwort: 'Heute sind 4 Aufgaben offen.' } }), 1200)); });
      await p.fill('#jarvisFeld', 'Was ist bei uns heute noch los, kurz zusammengefasst?'); await p.click('#jarvisSenden');
      await p.waitForTimeout(500);
      const a = await p.evaluate(() => { const r = document.getElementById('formiRand'); const an = r.getAnimations({ subtree: true });
        return Object.assign(window.__formiLebt.insel(), { eig: [...new Set(an.flatMap(x => x.effect.getKeyframes().flatMap(f => Object.keys(f).filter(k => !['offset','easing','composite','computedOffset'].includes(k)))))], laeuft: an.filter(x => x.playState === 'running' && x.effect.pseudoElement === '::before').length }); });
      pruefe(`${w} px: Formi denkt → Insel klein mit „${a.klein}"`, !a.hidden && a.stand === 'klein' && /klein/.test(a.klasse) && a.klein.length > 3, JSON.stringify(a));
      pruefe(`${w} px: … der Rand leuchtet und das Licht strömt (${a.laeuft} Streifen, nur transform/opacity)`, a.rand && a.laeuft === 4 && a.eig.every(e => e === 'transform' || e === 'opacity'), JSON.stringify(a));
      await p.waitForTimeout(2600);
      const c = await p.evaluate(() => window.__formiLebt.insel());
      pruefe(`${w} px: nach einer blossen Antwort sind Insel und Rand wieder weg`, c.hidden && !c.rand, JSON.stringify(c));
      /* Formi hakt ab (wird in der App erkannt, ohne KI) */
      await p.fill('#jarvisFeld', 'Spiegel ist geputzt'); await p.click('#jarvisSenden');
      await p.waitForTimeout(900);
      const d = await p.evaluate(() => Object.assign(window.__formiLebt.insel(), { strom: !!document.querySelector('.formi-strom'),
        ziel: (() => { const s = document.querySelector('.formi-strom i'); const f = document.querySelector('#formiInsel .fi-gross .formi-figur'); if (!s || !f) return null;
          const kf = s.getAnimations()[0].effect.getKeyframes(), m = /translate\(([-\d.]+)px,\s*([-\d.]+)px/.exec(kf[kf.length - 1].transform), z = s.parentElement.getBoundingClientRect(), r = f.getBoundingClientRect();
          return Math.round(Math.hypot(z.left + +m[1] + s.offsetWidth / 2 - (r.left + r.width / 2), z.top + +m[2] + s.offsetHeight / 2 - (r.top + r.height / 2))); })() }));
      pruefe(`${w} px: Formi hakt ab → Insel gross: „${d.was}" · „${d.titel}"`, !d.hidden && d.stand === 'gross' && /^Abgehakt · /.test(d.was) && /Spiegel/.test(d.titel), JSON.stringify(d));
      pruefe(`${w} px: … die Buchstaben fallen in Formi in der Insel (Ende ${d.ziel} px von seiner Mitte)`, d.strom && d.ziel !== null && d.ziel <= 16, JSON.stringify(d));
      await p.waitForTimeout(4500);
      const e = await p.evaluate(() => window.__formiLebt.insel());
      pruefe(`${w} px: danach ist die Insel wieder weg`, e.hidden && e.stand === 'weg', JSON.stringify(e));
      /* Formi legt an: die Buchstaben kommen aus ihm heraus */
      const f = await p.evaluate(async () => { window.__formiLebt.inselErgebnis({ was: 'Aufgabe angelegt', titel: 'Fenster putzen', aus: true }); await new Promise(r => setTimeout(r, 650));
        const s = document.querySelector('.formi-strom i'); const fig = document.querySelector('#formiInsel .fi-gross .formi-figur'); if (!s || !fig) return null;
        const kf = s.getAnimations()[0].effect.getKeyframes(), m = /translate\(([-\d.]+)px,\s*([-\d.]+)px/.exec(kf[0].transform), z = s.parentElement.getBoundingClientRect(), r = fig.getBoundingClientRect();
        return Math.round(Math.hypot(z.left + +m[1] + s.offsetWidth / 2 - (r.left + r.width / 2), z.top + +m[2] + s.offsetHeight / 2 - (r.top + r.height / 2))); });
      pruefe(`${w} px: Formi legt an → die Buchstaben kommen aus ihm (Start ${f} px von seiner Mitte)`, f !== null && f <= 16, String(f));
      pruefe(`${w} px: ohne Skriptfehler`, !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
    {
      /* „Mehr Platz": das Fenster zeigt selbst, was Formi tut — keine Insel */
      const p = await oeffne(b, 390, 844);
      await p.evaluate(() => localStorage.setItem('kf_jv_weit', '1')); await p.reload(); await p.waitForFunction(() => !!document.querySelector('#app.show')); await p.waitForTimeout(900);
      await p.click('#formiKugel'); await p.waitForTimeout(600);
      await p.evaluate(() => window.__formiLebt.inselArbeit('Test')); await p.waitForTimeout(100);
      const g = await p.evaluate(() => window.__formiLebt.insel());
      pruefe('GEGENPROBE „Mehr Platz" offen: keine Insel, der Rand leuchtet trotzdem', g.hidden && g.rand, JSON.stringify(g));
      await p._ctx.close();
    }

    console.log('\n── 4 Lage der Insel: im Bild, nie auf einem Knopf ──');
    for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      const p = await oeffne(b, w, h);
      for (const dichte of ['normal', 'kompakt']) {
        if (dichte === 'kompakt') { await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt')); await p.waitForTimeout(200); }
        const l = await p.evaluate(async () => {
          window.__formiLebt.inselErgebnis({ was: 'Abgehakt · Hürth', titel: 'Geräte desinfizieren' });
          await new Promise(r => setTimeout(r, 700));
          const fi = document.getElementById('formiInsel'), r = fi.getBoundingClientRect(), s = getComputedStyle(fi);
          const kn = [...document.querySelectorAll('.topbar button, .topbar a')].filter(e => e.getClientRects().length).map(e => e.getBoundingClientRect())
            .filter(q => q.width && q.right > r.left && q.left < r.right && q.bottom > r.top && q.top < r.bottom);
          const treffer = document.elementFromPoint(r.left + r.width / 2, r.top + 20);
          const out = { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), pe: s.pointerEvents, aufKnopf: kn.length, traf: !!(treffer && treffer.closest && treffer.closest('#formiInsel')) };
          window.__formiLebt.inselErgebnis({ was: '', titel: '' });
          return out;
        });
        pruefe(`${w} px ${dichte}: Insel im Bild (${l.l}–${l.r}, oben ${l.t}), keine Trefferfläche, auf keinem Knopf der Kopfleiste`,
          l.l >= 8 && l.r <= w - 8 && l.t >= 0 && l.b <= h && l.pe === 'none' && !l.traf && l.aufKnopf === 0, JSON.stringify(l));
      }
      await p._ctx.close();
    }
  } finally { await b.close(); }
  console.log(`\n${schlecht ? '✗' : '✓'} Formi-Insel: ${schlecht ? schlecht + ' von ' + (gut + schlecht) + ' falsch' : 'alle ' + gut + ' Zusicherungen erfüllt'}`);
  process.exit(schlecht ? 1 : 0);
})();
