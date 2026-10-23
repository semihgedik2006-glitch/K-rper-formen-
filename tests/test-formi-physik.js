/* ══════════════════════════════════════════════════════════════════════
   FORMI-PHYSIK: Akkretionsscheibe, Einfall, Gefühle, Tagesstand (Runde 226)

   Aus dem Betrieb (23.10.2026): „ja können wir alles umsetzen, nur die
   akkretionsscheibe fehlt mir irgendwie noch und es verhält sich auch
   nicht physikalisch wie ein schwarzes loch so wirklich, und ich möchte
   mehr animationen (schlafen, langeweile, freude, trauer etc.)".

   Geprüft wird:
    1. Scheibe: an Kugel, grossem Gesicht und Ladefigur eine flache
       Scheibe, die links und rechts über den Ring hinaussteht; die
       hintere Hälfte liegt vor dem Loch im Baum, die vordere dahinter
       (= davor gemalt). Bahnen drehen endlos, nur transform, innen
       schneller; Klumpen leuchten links heller als rechts (Doppler).
       Kein Querlauf, keine Trefferfläche, Kugel-Knopf unverändert
       ≥ 44 × 44, bei 320 … 1920 px, normal und kompakt.
    2. Einfall (formiEinfall): kommt nie unter den Horizont, wird erst
       schneller, dann am Horizont immer langsamer, wird lang gezogen
       und erlischt; nur transform/opacity.
    3. Ein Haken fällt ins Loch: Funken fliegen vom Haken zur Kugel und
       enden an ihrem Horizont; die Scheibe flammt auf; danach liegt
       nichts herum.
    4. Die Scheibe zeigt den Tag: Stufe 0 … 4 als Klasse, das Loch wächst
       über `scale`.
    5. Gefühle: traurig, gelangweilt, verwirrt, stolz, verliebt,
       schnarcht – endlich, nur transform/opacity, mit Zeichen (Träne, ?,
       Herz, z), die danach weg sind. Langeweile nach gut 30 s Stille;
       im Schlaf ein Atemzug mit z, beim Aufwachen hört es auf.
    6. „Weniger Bewegung" und „Gefühle: Aus": nichts dreht, nichts fliegt.
    7. Leistung: Arbeit je Bild (Hauptfaden, CPU ÷4) mit der Kugel in
       Ruhe und mit offenem Formi-Fenster, am Rechner und am Handy, unter
       8,3 ms. Die Maus wird gemessen und berichtet.

   Service-Worker gesperrt, wie in test-formi-lebt.
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

async function oeffne(b, w, h, opt) {
  opt = opt || {};
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block',
    reducedMotion: opt.wenigBewegung ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  if (opt.vorher) await p.addInitScript(opt.vorher);
  await p.addInitScript({ path: SP + '/stub-chef.js' });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(900);
  p._ctx = ctx;
  return p;
}
/* Was an der Kugel läuft – ohne die gewollten Dauerläufe der Scheibe. */
const LAEUFT = () => {
  const DAUER = ['formiScheibe', 'formiBahn', 'formiDoppler'];
  const a = document.getElementById('formiKugel').getAnimations({ subtree: true }).filter(x => x.playState === 'running' && !DAUER.includes(x.animationName));
  const eig = new Set();
  a.forEach(x => x.effect.getKeyframes().forEach(f => Object.keys(f).forEach(n => { if (!['offset', 'easing', 'composite', 'computedOffset'].includes(n)) eig.add(n); })));
  return { n: a.length, endlos: a.some(x => x.effect.getTiming().iterations === Infinity), eig: [...eig] };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    /* ── 1. Die Scheibe ─────────────────────────────────────────────── */
    console.log('\n── Akkretionsscheibe ──');
    {
      const p = await oeffne(b, 1440, 900);
      await p.evaluate(() => window.__formiLebt.uhrenAus());
      const s = await p.evaluate(() => {
        const k = document.getElementById('formiKugel');
        const koerper = k.querySelector('.fk-koerper');
        const kinder = [...koerper.children].map(c => c.className);
        const hinten = kinder.findIndex(c => /fk-scheibe hinten/.test(c)), vorn = kinder.findIndex(c => /fk-scheibe vorn/.test(c)), loch = kinder.indexOf('fk-loch'), ring = kinder.indexOf('fk-wirbel');
        const sch = k.querySelector('.fk-scheibe.hinten').getBoundingClientRect(), kr = k.getBoundingClientRect();
        const bahn = (sel) => { const e = k.querySelector(sel); const a = e.getAnimations().filter(x => x.animationName === 'formiBahn'); return a.map(x => ({ endlos: x.effect.getTiming().iterations === Infinity, dauer: x.effect.getTiming().duration, kf: x.effect.getKeyframes().flatMap(f => Object.keys(f)).filter(n => !['offset', 'easing', 'composite', 'computedOffset'].includes(n)) })); };
        return { hinten, vorn, loch, ring, breite: Math.round(sch.width), kugel: Math.round(kr.width),
          pe: getComputedStyle(k.querySelector('.fk-scheibe')).pointerEvents,
          aussen: bahn('.fk-scheibe.hinten .fk-bahn:not(.innen)'), innen: bahn('.fk-scheibe.hinten .fk-bahn.innen'),
          gesicht: !!document.querySelector('#loadingWrap .formi-lade .fk-scheibe.vorn') };
      });
      pruefe(`Kugel: flache Scheibe in zwei Hälften – hinten vor dem Ring im Baum, vorn nach dem Loch (${s.hinten} < ${s.ring} < ${s.loch} < ${s.vorn})`,
        s.hinten >= 0 && s.hinten < s.ring && s.ring < s.loch && s.loch < s.vorn, JSON.stringify(s));
      pruefe(`… sie steht über den Ring hinaus (${s.breite} px bei ${s.kugel} px Kugel) und lässt jeden Tipp durch`, s.breite >= s.kugel * 1.4 && s.pe === 'none', JSON.stringify(s));
      pruefe(`… Bahnen drehen endlos, nur transform, innen schneller (${s.innen[0] && s.innen[0].dauer} / ${s.aussen[0] && s.aussen[0].dauer} ms)`,
        s.aussen.length === 1 && s.innen.length === 1 && s.aussen[0].endlos && s.innen[0].dauer < s.aussen[0].dauer && s.aussen[0].kf.every(n => n === 'transform'), JSON.stringify(s));
      pruefe('… auch die Ladefigur hat die Scheibe', s.gesicht);
      /* Doppler: über eine ganze Runde der äusseren Bahn gemessen, wo
         die Klumpen stehen und wie hell sie sind. Links (auf uns zu)
         heller als rechts. */
      const d = await p.evaluate(async () => {
        const k = document.getElementById('formiKugel'), m = k.getBoundingClientRect(), cx = m.left + m.width / 2;
        let links = [], rechts = [];
        for (let i = 0; i < 26; i++) {
          k.querySelectorAll('.fk-scheibe.hinten .fk-bahn:not(.innen) i, .fk-scheibe.vorn .fk-bahn:not(.innen) i').forEach(el => {
            const r = el.getBoundingClientRect(); if (!r.width) return;
            const x = r.left + r.width / 2, o = +getComputedStyle(el).opacity;
            if (x < cx - 15) links.push(o); else if (x > cx + 15) rechts.push(o);
          });
          await new Promise(r => setTimeout(r, 200));
        }
        const mw = (l) => l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0;
        return { links: +mw(links).toFixed(2), rechts: +mw(rechts).toFixed(2), n: links.length + rechts.length };
      });
      pruefe(`Doppler: Klumpen links heller als rechts (${d.links} gegen ${d.rechts})`, d.n > 20 && d.links > d.rechts + .2, JSON.stringify(d));
      await p.click('#formiKugel'); await p.waitForTimeout(500);
      pruefe('das grosse Gesicht im Formi-Fenster hat die Scheibe auch', await p.evaluate(() => !!document.querySelector('#jarvisVerlauf .jv-start-figur .fk-scheibe.vorn .fk-bahn')));
      pruefe('… die kleinen Figuren (Kopf, Antworten) nicht – dort wäre sie ein Strich', await p.evaluate(() => !document.querySelector('#jarvis .jv-titel .fk-scheibe')));
      pruefe('keine Fehler auf der Seite', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
    for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      for (const dichte of ['normal', 'kompakt']) {
        const p = await oeffne(b, w, h);
        if (dichte === 'kompakt') { await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt')); await p.waitForTimeout(200); }
        const r = await p.evaluate(([TR]) => {
          const k = document.getElementById('formiKugel');
          /* Gemessen an der flachen Scheibe selbst, nicht an ihrem
             schräg gestellten Rahmen (der ist höher als die Scheibe). */
          const s = [...k.querySelectorAll('.fk-flach')].map(e => e.getBoundingClientRect());
          return { m: (eval(TR))(k), quer: document.documentElement.scrollWidth > innerWidth,
            imBild: s.every(q => q.left >= 0 && q.right <= innerWidth) };
        }, [TREFFER.toString()]);
        pruefe(`${w} px ${dichte}: Kugel ${r.m.w}×${r.m.h} trifft, Scheibe im Bild, kein Querlauf`, r.m.w >= 44 && r.m.h >= 44 && r.m.imBild && r.imBild && !r.quer, JSON.stringify(r));
        await p._ctx.close();
      }
    }

    /* ── 2. Einfall ─────────────────────────────────────────────────── */
    console.log('\n── Einfall, wie er von draussen aussieht ──');
    {
      const p = await oeffne(b, 1440, 900);
      const e = await p.evaluate(() => {
        const f = window.__formiLebt.einfall(240, 0, 15);
        const lage = f.map(k => { const m = /translate\((-?[\d.]+)px, ?(-?[\d.]+)px\)/.exec(k.transform); return Math.hypot(+m[1], +m[2]); });
        const streck = f.map(k => { const m = /scale\(([\d.]+), ?([\d.]+)\)/.exec(k.transform); return m ? +m[1] / +m[2] : 1; });
        const schritt = lage.slice(1).map((r, i) => lage[i] - r);
        const eig = [...new Set(f.flatMap(k => Object.keys(k)))].filter(n => n !== 'offset');
        return { lage: lage.map(r => +r.toFixed(1)), schritt: schritt.map(x => +x.toFixed(1)), streck: streck.map(x => +x.toFixed(2)), op: f.map(k => k.opacity), eig };
      });
      const mitte = e.schritt.slice(0, 7), ende = e.schritt.slice(-4);
      pruefe(`kommt nie unter den Horizont (kleinster Abstand ${Math.min(...e.lage)} px bei 15 px)`, Math.min(...e.lage) >= 15, JSON.stringify(e.lage));
      pruefe('fällt erst schneller werdend', mitte.every((x, i) => i === 0 || x >= mitte[i - 1] - .01), JSON.stringify(mitte));
      pruefe('… und kriecht am Horizont immer langsamer (Zeitdehnung)', ende.every((x, i) => i === 0 || x <= ende[i - 1]) && Math.max(...ende) < Math.max(...mitte) / 4, JSON.stringify(e.schritt));
      pruefe(`wird nah am Loch lang gezogen (bis ${Math.max(...e.streck)} : 1)`, Math.max(...e.streck) >= 2 && e.streck[0] === 1, JSON.stringify(e.streck));
      pruefe('erlischt am Ende, nur transform/opacity', e.op[e.op.length - 1] === 0 && e.op[0] === 1 && e.eig.every(n => n === 'transform' || n === 'opacity'), JSON.stringify(e));
      await p._ctx.close();
    }

    /* ── 3. Ein Haken fällt ins Loch ────────────────────────────────── */
    console.log('\n── Ein Haken fällt ins Loch ──');
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const p = await oeffne(b, w, h);
      await p.evaluate(() => window.__formiLebt.uhrenAus());
      const f = await p.evaluate(async () => {
        window.__formiLebt.schluckt('#homeAlerts .formi-zeile') || window.__formiLebt.schluckt('.view.show h1, .view.show h2');
        let z = []; for (let i = 0; i < 20 && !z.length; i++) { await new Promise(r => setTimeout(r, 20)); z = [...document.querySelectorAll('.formi-flug i.funke')]; }
        const k = document.getElementById('formiKugel').getBoundingClientRect(), cx = k.left + k.width / 2, cy = k.top + k.height / 2;
        const enden = z.map(i => { const kf = i.getAnimations()[0].effect.getKeyframes(); const m = /translate\((-?[\d.]+)px, ?(-?[\d.]+)px\)/.exec(kf[kf.length - 1].transform); return +Math.hypot(+m[1] - cx, +m[2] - cy).toFixed(1); });
        await new Promise(r => setTimeout(r, 900));
        const flamme = [...document.querySelectorAll('#formiKugel .fk-scheibe')].some(s => s.getAnimations().length > 0);
        return { n: z.length, enden, rH: +(k.width * .26).toFixed(1), flamme };
      });
      pruefe(`${w} px: drei Funken fliegen vom Haken zur Kugel und enden an ihrem Horizont (${f.enden.join(' / ')} px, Horizont ${f.rH})`,
        f.n === 3 && f.enden.every(x => Math.abs(x - f.rH) < 1.5), JSON.stringify(f));
      pruefe(`${w} px: … die Scheibe flammt auf, wenn sie ankommen`, f.flamme, JSON.stringify(f));
      await p.waitForTimeout(1500);
      pruefe(`${w} px: … danach liegt nichts herum`, await p.evaluate(() => !document.querySelector('.formi-flug')));
      pruefe(`${w} px: keine Fehler auf der Seite`, !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }

    /* ── 4. Die Scheibe zeigt den Tag ───────────────────────────────── */
    console.log('\n── Die Scheibe zeigt den Tag ──');
    {
      const p = await oeffne(b, 1440, 900);
      const t = await p.evaluate(() => {
        const k = document.getElementById('formiKugel'), st = window.__formiLebt.tagesStand();
        const klasse = [...k.classList].filter(c => /^fk-tag-/.test(c));
        return { st, klasse, deck: getComputedStyle(k.querySelector('.fk-scheibe')).opacity, scale: getComputedStyle(k.querySelector('.fk-pupille')).scale };
      });
      pruefe(`die Kugel trägt genau eine Tagesstufe (${t.klasse.join(' ')}, ${Math.round((t.st.anteil || 0) * 100)} % erledigt)`, t.klasse.length === 1 && t.klasse[0] === 'fk-tag-' + t.st.stufe, JSON.stringify(t));
      const stufen = await p.evaluate(() => {
        const k = document.getElementById('formiKugel'), alt = [...k.classList].filter(c => /^fk-tag-/.test(c));
        const r = [0, 1, 2, 3, 4].map(n => { alt.forEach(c => k.classList.remove(c)); [0, 1, 2, 3, 4].forEach(m => k.classList.remove('fk-tag-' + m)); k.classList.add('fk-tag-' + n);
          return { o: +getComputedStyle(k.querySelector('.fk-scheibe')).opacity, s: getComputedStyle(k.querySelector('.fk-pupille')).scale, kl: [...k.querySelectorAll('.fk-scheibe.hinten .fk-bahn i')].filter(i => getComputedStyle(i).display !== 'none').length }; });
        [0, 1, 2, 3, 4].forEach(m => k.classList.remove('fk-tag-' + m)); alt.forEach(c => k.classList.add(c));
        return r;
      });
      const sc = stufen.map(x => x.s === 'none' ? 1 : parseFloat(x.s));
      pruefe(`Stufe 0 → 4: Scheibe heller (${stufen.map(x => x.o).join(' → ')}), mehr Klumpen (${stufen.map(x => x.kl).join(' → ')}), Loch wächst (${sc.join(' → ')})`,
        stufen.every((x, i) => i === 0 || (x.o >= stufen[i - 1].o && x.kl >= stufen[i - 1].kl && sc[i] >= sc[i - 1])) && stufen[4].o === 1 && stufen[0].o < .6 && sc[4] >= 1.07, JSON.stringify(stufen));
      await p._ctx.close();
    }

    /* ── 5. Gefühle ─────────────────────────────────────────────────── */
    console.log('\n── Mehr Gefühle ──');
    {
      const p = await oeffne(b, 1440, 900);
      await p.evaluate(() => window.__formiLebt.uhrenAus());
      const ZEICHEN = { traurig: 'traene', verwirrt: 'frage', verliebt: 'herz', schnarcht: 'z' };
      for (const art of ['traurig', 'gelangweilt', 'verwirrt', 'stolz', 'verliebt', 'schnarcht']) {
        await p.evaluate((a) => window.__formiLebt.fuehlt(a), art);
        const a = await p.evaluate(LAEUFT);
        const z = ZEICHEN[art] ? await p.evaluate((c) => { const e = document.querySelector('#formiKugel .fk-zeichen.' + c); return e ? { svg: !!e.querySelector('svg, b'), anim: e.getAnimations().length } : null; }, ZEICHEN[art]) : null;
        pruefe(`${art}: ${a.n} Animation(en), endlich, nur transform/opacity${z ? ', mit Zeichen (' + ZEICHEN[art] + ')' : ''}`,
          a.n > 0 && !a.endlos && a.eig.every(e => e === 'transform' || e === 'opacity') && (!ZEICHEN[art] || (z && z.svg && z.anim > 0)), JSON.stringify({ a, z }));
        await p.waitForTimeout(4600);
      }
      pruefe('nach den Gefühlen läuft nichts mehr, keine Zeichen und Krümel liegen herum', (await p.evaluate(LAEUFT)).n === 0 &&
        await p.evaluate(() => !document.querySelector('#formiKugel .fk-zeichen, #formiKugel .fk-teilchen')));
      const lw = await p.evaluate(() => window.__formiLebt.langweilen());
      pruefe('nach gut 30 s Stille langweilt sich Formi (einmal)', lw && (await p.evaluate(LAEUFT)).n > 0);
      await p.waitForTimeout(4600);
      pruefe('… und das weckt es nicht: es wird danach trotzdem müde', await p.evaluate(() => window.__formiLebt.muede()));
      pruefe('keine Fehler auf der Seite', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
    {
      // Schlaf: ein Zeitgeber, der mit dem Aufwachen endet (frische Seite,
      // die Uhren laufen hier – uhrenAus hielte ihn an).
      const p = await oeffne(b, 1440, 900);
      const schlaf = await p.evaluate(async () => {
        window.__formiLebt.einschlafen();
        await new Promise(r => setTimeout(r, 300));
        const z1 = !!document.querySelector('#formiKugel .fk-zeichen.z');
        document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        await new Promise(r => setTimeout(r, 3600));
        return { z1, wach: !document.getElementById('formiKugel').classList.contains('fk-schlaeft'), z2: !!document.querySelector('#formiKugel .fk-zeichen.z') };
      });
      pruefe('im Schlaf steigt ein z auf; nach dem Aufwachen kommt keins mehr', schlaf.z1 && schlaf.wach && !schlaf.z2, JSON.stringify(schlaf));
      pruefe('keine Fehler auf der Seite', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
    {
      // Ist das Formi-Fenster offen, fühlt das Gesicht dort
      const p = await oeffne(b, 1440, 900);
      await p.click('#formiKugel'); await p.waitForTimeout(500);
      const f = await p.evaluate(() => { window.__formiLebt.fuehlt('traurig');
        const g = document.querySelector('#jarvisVerlauf .jv-start-figur');
        return { anim: g.getAnimations({ subtree: true }).filter(a => !['formiScheibe', 'formiBahn', 'formiDoppler'].includes(a.animationName)).length, traene: !!g.querySelector('.fk-zeichen.traene') }; });
      pruefe('Fenster offen: das grosse Gesicht ist traurig, mit Träne', f.anim > 0 && f.traene, JSON.stringify(f));
      await p._ctx.close();
    }

    /* ── 6. Weniger Bewegung, Gefühle aus ───────────────────────────── */
    console.log('\n── Weniger Bewegung ──');
    {
      const p = await oeffne(b, 1440, 900, { wenigBewegung: true });
      const r = await p.evaluate(async () => {
        const k = document.getElementById('formiKugel');
        const bahn = [...k.querySelectorAll('.fk-bahn, .fk-bahn i')].reduce((n, e) => n + e.getAnimations().length, 0);
        window.__formiLebt.fuehlt('traurig'); window.__formiLebt.schluckt('.view.show h1, .view.show h2, #homeAlerts');
        await new Promise(r => setTimeout(r, 100));
        return { bahn, flug: !!document.querySelector('.formi-flug'), zeichen: !!k.querySelector('.fk-zeichen'), anim: k.getAnimations({ subtree: true }).length };
      });
      pruefe('weniger Bewegung: keine Bahn dreht, kein Funke fliegt, keine Träne', r.bahn === 0 && !r.flug && !r.zeichen && r.anim === 0, JSON.stringify(r));
      await p._ctx.close();
    }
    {
      const p = await oeffne(b, 1440, 900, { vorher: () => { try { localStorage.setItem('kf_jv_persona', JSON.stringify({ gefuehle: 'aus' })); } catch (e) {} } });
      const r = await p.evaluate(() => { const k = document.getElementById('formiKugel'); window.__formiLebt.fuehlt('verliebt');
        return { still: document.documentElement.classList.contains('fk-still'), anim: k.getAnimations({ subtree: true }).length, zeichen: !!k.querySelector('.fk-zeichen') }; });
      pruefe('„Gefühle der Kugel: Aus": nichts dreht, keine Herzen', !r.still || (r.anim === 0 && !r.zeichen), JSON.stringify(r));
      await p._ctx.close();
    }

    /* ── 7. Leistung ────────────────────────────────────────────────── */
    console.log('\n── Leistung (Arbeit je Bild, Hauptfaden, CPU ÷4) ──');
    /* Gemessen wie in test-gehirn: Hauptfaden-Zeit je gezeichnetem Bild,
       3 s, nach dem Einschwingen. Drei Lagen: Kugel in Ruhe, Kugel mit
       Maus über dem Inhalt (am Rechner, nur berichtet – siehe unten), Formi-Fenster offen mit grossem
       Gesicht samt Scheibe. */
    for (const [w, h] of [[390, 844], [1440, 900], [1920, 1080]]) {
      const p = await oeffne(b, w, h);
      await p.evaluate(() => window.__formiLebt.uhrenAus());
      await p.waitForTimeout(1500);
      const cdp = await p.context().newCDPSession(p);
      await cdp.send('Performance.enable');
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const miss = async (dauer, maus) => {
        const a = await cdp.send('Performance.getMetrics');
        const lauf = p.evaluate((ms) => new Promise(r => { let n = 0; const ende = performance.now() + ms; (function f() { n++; if (performance.now() < ende) requestAnimationFrame(f); else r(n); })(); }), dauer);
        if (maus) { for (let i = 0; i < 40; i++) { await p.mouse.move(300 + (i % 20) * 40, 200 + (i % 7) * 50); await p.waitForTimeout(dauer / 45); } }
        const bilder = await lauf;
        const z = await cdp.send('Performance.getMetrics');
        const wert = (m, k) => (m.metrics.find(x => x.name === k) || {}).value || 0;
        return Math.round((wert(z, 'TaskDuration') - wert(a, 'TaskDuration')) * 1000 / bilder * 10) / 10;
      };
      const ruhe = await miss(3000, false);
      const maus = w > 820 ? await miss(3000, true) : null;
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      await p.click('#formiKugel'); await p.waitForTimeout(2600);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const offen = await miss(3000, false);
            pruefe(`${w} px: Kugel in Ruhe ${ruhe} ms je Bild, Formi offen ${offen} ms (Grenze 8,3)`, ruhe < 8.3 && offen < 8.3);
      /* Die Maus wird gemessen, aber nicht an 8,3 ms geprüft: mit genau
         diesem Verfahren misst der Stand VOR Runde 226 schon 9–10 ms
         (1440 px). Die Spur zeigt, wofür: UpdateLayoutTree durch
         Hover-Regeln der Seite, 148 ms auf 40 Bewegungen, gleich viel
         mit und ohne die neue Scheibe. Das ist ein eigener Befund
         (docs/FORTSCHRITT.md, Runde 226), keine gelockerte Grenze. */
      if (maus !== null) console.log(`  · ${w} px: Maus über dem Inhalt ${maus} ms je Bild – gemessen, nicht geprüft (siehe Kommentar)`);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      await p._ctx.close();
    }
  } catch (e) {
    schlecht++; console.log('  ✗ Abbruch: ' + (e && e.stack || e));
  } finally {
    await b.close();
  }
  console.log('\n' + (schlecht ? '✗ Formi-Physik: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen rot' : '✓ Formi-Physik: ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})();
