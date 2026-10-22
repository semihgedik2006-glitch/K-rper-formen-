/* ══════════════════════════════════════════════════════════════════════
   FORMI LEBT: Formi-Zeile, Gefühle, Glitch, Spur (Runde 186, 22.10.2026)

   Aus dem Betrieb: „ja viele emotionen und so am besten auch reaktionen
   falls das geht auf kleinigkeiten" und „Formi soll einfach ganz
   integriert sein wie ein kleiner glitch im system mässig welcher die app
   übernimmt". Dazu die Top 3 aus docs/ideen/formi-im-design.md, alle drei
   mit „ja" bestätigt.

   Geprüft wird:
    1. Formi-Zeile: oben auf „Heute" steht EINE Zeile statt der Balken;
       links der Ring (öffnet Formi), daneben die Meldungen als Knöpfe; die
       Statusfarbe bleibt als Punkt; ein Tipp führt hin (überfällig →
       Aufgaben mit Filter). Am Handy die kurze Form, die Zeile ist dort
       niedriger als die drei Balken vorher (162 px).
    2. Kugel: Auge, Punkt „hat etwas für dich" (weg nach dem Öffnen),
       Gefühle als ENDLICHE Animationen nur auf transform/opacity, Glitch,
       Einschlafen und Aufwachen, Schauen mit der Maus. Bei „weniger
       Bewegung" passiert nichts davon.
    3. Spur: „über Formi" an Aufgaben und Putzplan, wenn formiAt = doneAt;
       nicht mehr, wenn danach von Hand neu abgehakt wurde.
    4. Der Ring gehört nur Formi: --formi-ring nur an Formi-Teilen.
    5. Trefferflächen von Ring und Meldungen ≥ 44 × 44 per Hit-Test bei
       320 / 390 / 430 / 820 / 1280 / 1440 / 1920, normal und kompakt, im
       Bild. Kein Querlauf.

   Service-Worker sind gesperrt (siehe oeffne), wie in test-formi-kugel.
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
/* Trefferfläche per Hit-Test, wie in test-formi-kugel. */
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
  await p.goto(APP + (opt.suche || ''), { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(900);
  p._ctx = ctx;
  return p;
}
/* Laufende Animationen an den Teilen der Kugel: Anzahl, ob eine davon
   endlos ist und welche Eigenschaften sie bewegen. */
const KUGEL_ANIM = () => {
  const k = document.getElementById('formiKugel');
  /* Nur was LÄUFT: ein abgeschlossener, gehaltener Blick (fill:forwards,
     playState „finished") ist Stillstand, keine Bewegung — seit Runde 205
     halten Pupillen und Loch so ihre Blickrichtung. */
  const a = k.getAnimations({ subtree: true }).filter(x => x.playState === 'running');
  const eig = new Set();
  a.forEach(x => (x.effect && x.effect.getKeyframes ? x.effect.getKeyframes() : []).forEach(f =>
    Object.keys(f).forEach(n => { if (!['offset', 'easing', 'composite', 'computedOffset'].includes(n)) eig.add(n); })));
  return { n: a.length, endlos: a.some(x => x.effect && x.effect.getTiming().iterations === Infinity), eig: [...eig] };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    /* ── 1. Formi-Zeile ─────────────────────────────────────────────── */
    for (const [w, h, name] of [[1440, 900, 'Rechner'], [390, 844, 'Handy']]) {
      console.log(`\n── Formi-Zeile, ${name} ${w} × ${h} ──`);
      const p = await oeffne(b, w, h);
      const z = await p.evaluate(() => {
        const zeile = document.querySelector('#homeAlerts .formi-zeile');
        const teile = [...document.querySelectorAll('#homeAlerts .fz-teil')];
        const sicht = (el) => [...el.querySelectorAll('.fz-t > span, .fz-t')].filter(s => s.getClientRects().length && !s.children.length).map(s => s.textContent).join('');
        return {
          zeilen: document.querySelectorAll('#homeAlerts .formi-zeile').length,
          balken: document.querySelectorAll('.alert-bar').length,
          ring: !!document.querySelector('#homeAlerts .fz-gesicht .fz-ring'),
          hoehe: zeile ? Math.round(zeile.getBoundingClientRect().height) : 0,
          teile: teile.map(t => ({ text: sicht(t), cls: t.className, punkt: t.querySelector('.fz-punkt') ? getComputedStyle(t.querySelector('.fz-punkt')).backgroundColor : '' })),
          rot: getComputedStyle(document.body).getPropertyValue('--danger').trim()
        };
      });
      pruefe('genau eine Formi-Zeile, keine alten Balken mehr', z.zeilen === 1 && z.balken === 0, JSON.stringify({ zeilen: z.zeilen, balken: z.balken }));
      pruefe('links steht Formis Ring', z.ring);
      const ueber = z.teile.find(t => /überfällig/.test(t.text));
      const mat = z.teile.find(t => /Artikel fehlen/.test(t.text));
      pruefe('überfällig und Material stehen als Meldung da', !!ueber && !!mat, JSON.stringify(z.teile.map(t => t.text)));
      pruefe('überfällig trägt den Status als Punkt (bad), Material als warn', ueber && /\bbad\b/.test(ueber.cls) && mat && /\bwarn\b/.test(mat.cls), JSON.stringify(z.teile));
      if (w < 600) {
        pruefe(`Handy: kurze Form („${ueber && ueber.text}")`, ueber && ueber.text === '1 überfällig', ueber && ueber.text);
        pruefe(`Handy: Zeile ${z.hoehe} px hoch, niedriger als die drei Balken vorher (162 px)`, z.hoehe > 0 && z.hoehe < 162, String(z.hoehe));
      } else {
        pruefe(`Rechner: lange Form, eine Zeile (${z.hoehe} px)`, ueber && ueber.text === '1 Aufgabe ist überfällig' && z.hoehe <= 60, JSON.stringify({ t: ueber && ueber.text, h: z.hoehe }));
      }
      await p.click('#homeAlerts .fz-teil.bad');
      await p.waitForTimeout(500);
      const nach = await p.evaluate(() => ({ view: (document.querySelector('.view.show') || {}).id,
        filter: (document.querySelector('[data-tfilter].on') || {}).getAttribute ? document.querySelector('[data-tfilter].on').getAttribute('data-tfilter') : '' }));
      pruefe('ein Tipp auf „überfällig" öffnet die Aufgaben mit Filter', nach.view === 'view-todos' && nach.filter === 'faellig', JSON.stringify(nach));
      await p._ctx.close();

      const p2 = await oeffne(b, w, h);
      await p2.click('#homeAlerts .fz-gesicht');
      await p2.waitForTimeout(500);
      pruefe('ein Tipp auf den Ring öffnet Formi', await p2.evaluate(() => !document.getElementById('jarvis').hidden));
      pruefe('keine Fehler auf der Seite', !p2._fehler.length, p2._fehler.join(' | '));
      await p2._ctx.close();
    }

    /* ── 2. Kugel: Auge, Punkt, Gefühle ────────────────────────────── */
    console.log('\n── Kugel lebt (1440 × 900) ──');
    {
      const p = await oeffne(b, 1440, 900);
      /* Blinzeln und Atmen kommen zu zufälligen Zeiten — für „danach läuft
         nichts mehr" abschalten; das Atmen wird unten eigens ausgelöst. */
      await p.evaluate(() => window.__formiLebt.uhrenAus());
      const k0 = await p.evaluate(() => {
        const k = document.getElementById('formiKugel');
        const teile = [...k.querySelectorAll('*')];
        const besch = document.getElementById(k.getAttribute('aria-describedby') || '-');
        return { hat: k.classList.contains('fk-hat'), label: k.getAttribute('aria-label'), besch: besch ? besch.textContent : '',
          auge: k.querySelectorAll('.fk-pupille .fk-auge').length === 2 && !!k.querySelector('.fk-pupille .fk-mund'), schmuckOhneTreffer: teile.every(t => getComputedStyle(t).pointerEvents === 'none' || t.closest('.fk-koerper') || t.classList.contains('fk-punkt')),
          ruhig: k.getAnimations({ subtree: true }).length };
      });
      pruefe('im Loch ein Gesicht: zwei Augen, ein Mund (Runde 195)', k0.auge);
      const figur = await p.evaluate(() => ({ kugel: document.querySelectorAll('#formiKugel .fk-auge b').length + document.querySelectorAll('#formiKugel .fk-braue').length,
        zeile: document.querySelectorAll('#homeAlerts .fz-ring .fk-auge').length + document.querySelectorAll('#homeAlerts .fz-ring .fk-mund').length,
        kopf: document.querySelectorAll('#jarvis .formi-gesicht .fk-auge').length + document.querySelectorAll('#jarvis .formi-gesicht .fk-mund').length }));
      pruefe('Runde 205: Augen mit Pupillen, Brauen; dasselbe Gesicht in Formi-Zeile und Fensterkopf', figur.kugel === 4 && figur.zeile === 3 && figur.kopf === 3, JSON.stringify(figur));
      pruefe('Punkt „hat etwas für dich" bei Überfälligem, für Vorleser als Beschreibung (Name bleibt „Formi öffnen")', k0.hat && k0.label === 'Formi öffnen' && /hat etwas für dich/.test(k0.besch), JSON.stringify(k0));

      for (const art of ['freut', 'staunt', 'feiert', 'erschrickt', 'nickt', 'blinzelt', 'zwinkert2', 'gaehnt', 'aha']) {
        await p.evaluate((a) => window.__formiLebt.fuehlt(a), art);
        const a = await p.evaluate(KUGEL_ANIM);
        pruefe(`${art}: ${a.n} Animation(en), endlich, nur transform/opacity (${a.eig.join(', ')})`,
          a.n > 0 && !a.endlos && a.eig.every(e => e === 'transform' || e === 'opacity'), JSON.stringify(a));
        /* 2,2 s statt 1,2: Freude und Feiern dauern seit Runde 195 mit
           weissem Loch und Teilchen 1,5 bzw. 1,9 s (+ bis 0,26 s Streuung). */
        await p.waitForTimeout(2200);
      }
      pruefe('nach den Gefühlen läuft nichts mehr weiter, keine Teilchen liegen herum', (await p.evaluate(KUGEL_ANIM)).n === 0 &&
        await p.evaluate(() => !document.querySelector('#formiKugel .fk-teilchen')));

      /* Runde 195 — aus dem Betrieb: „wenn er sich freut … spuckt er
         partikel aus und wird zu einem weissen loch und danach zu einem
         schwarzen was die partikel wieder einsaugt". */
      const aus = await p.evaluate(async () => {
        window.__formiLebt.fuehlt('freut');
        const k = document.getElementById('formiKugel');
        const weiss = k.querySelector('.fk-weiss').getAnimations().map(a => a.effect.getKeyframes().map(f => f.opacity));
        const t = [...k.querySelectorAll('.fk-teilchen i')];
        const klick = t.every(i => getComputedStyle(i).pointerEvents === 'none');
        const wege = t.map(i => { const f = i.getAnimations()[0].effect.getKeyframes(); return [f[0].transform, f[f.length - 1].transform]; });
        return { weiss, n: t.length, klick, rein: wege.every(w => /translate\(0(px)?, ?0(px)?\)/.test(w[1])) };
      });
      pruefe(`Freude: das Loch wird weiss und wieder schwarz (${JSON.stringify(aus.weiss[0])})`, aus.weiss.length === 1 && aus.weiss[0].includes('1') && String(aus.weiss[0][0]) === '0' && String(aus.weiss[0].slice(-1)[0]) === '0', JSON.stringify(aus.weiss));
      pruefe(`… ${aus.n} Teilchen fliegen raus und landen wieder in der Mitte, alle lassen Tipps durch`, aus.n === 12 && aus.rein && aus.klick, JSON.stringify(aus));
      await p.evaluate(() => window.__formiLebt.fuehlt('feiert'));
      pruefe('Feiern: mehr Teilchen (22)', await p.evaluate(() => document.querySelectorAll('#formiKugel .fk-teilchen i').length) >= 22);
      await p.waitForTimeout(2600);
      pruefe('… danach sind die Teilchen wieder weg', await p.evaluate(() => !document.querySelector('#formiKugel .fk-teilchen')));
      const atem = await p.evaluate(() => {
        window.__formiLebt.atmen();
        const k = document.getElementById('formiKugel');
        const w = k.querySelector('.fk-wirbel').getAnimations();
        return { dreh: w.map(a => a.effect.getKeyframes().map(f => f.transform).join(' > ')), endlos: w.some(a => a.effect.getTiming().iterations === Infinity),
          kruemel: k.querySelectorAll('.fk-teilchen.klein i').length };
      });
      pruefe(`Atmen: der Ring dreht sich einmal ganz (${atem.dreh[0]}), endlich, drei Krümel fallen hinein`,
        atem.dreh.length === 1 && /rotate\(360deg\)/.test(atem.dreh[0]) && !atem.endlos && atem.kruemel === 3, JSON.stringify(atem));
      await p.waitForTimeout(3800);
      pruefe('… und danach steht wieder alles still', (await p.evaluate(KUGEL_ANIM)).n === 0 && await p.evaluate(() => !document.querySelector('#formiKugel .fk-teilchen')));

      // Haken: der dritte binnen 20 s lässt Formi staunen (grosse Augen)
      const st = await p.evaluate(async () => {
        window.__formiLebt.haken(); window.__formiLebt.haken(); window.__formiLebt.haken();
        const au = document.querySelector('#formiKugel .fk-auge');
        return au.getAnimations().map(a => a.effect.getKeyframes().map(f => f.transform).join(' '));
      });
      pruefe('dritter Haken binnen 20 s: Formi staunt (Augen scale 1.3)', st.some(s => /scale\(1\.3\)/.test(s)), JSON.stringify(st));
      await p.waitForTimeout(2200);

      // Glitch über einem Ziel in der App
      const g = await p.evaluate(async () => {
        window.__formiLebt.glitch('#homeAlerts .formi-zeile');
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const el = document.querySelector('.formi-glitch');
        if (!el) return null;
        const an = el.getAnimations({ subtree: true });
        return { n: an.length, endlos: an.some(x => x.effect.getTiming().iterations === Infinity), klickbar: getComputedStyle(el).pointerEvents };
      });
      pruefe('Glitch über einem Ziel: endlich, nicht klickbar', g && g.n > 0 && !g.endlos && g.klickbar === 'none', JSON.stringify(g));
      await p.waitForTimeout(800);
      pruefe('… und danach wieder weg', await p.evaluate(() => !document.querySelector('.formi-glitch')));

      // Schauen: die Maus links oben → das Auge wandert nach links oben, höchstens 4,5 px
      await p.mouse.move(10, 10);
      await p.waitForTimeout(400);
      /* Berechnet gelesen: das Auge bewegt sich als Web Animation, nicht
         über das style-Attribut (das liess die ganze Seite neu malen). */
      const blick = await p.evaluate(() => ({ t: getComputedStyle(document.querySelector('#formiKugel .fk-loch')).transform,
        attr: document.querySelector('#formiKugel .fk-loch').getAttribute('style') }));
      const m = /matrix\(1, 0, 0, 1, (-?[\d.]+), (-?[\d.]+)\)/.exec(blick.t || '');
      pruefe(`schaut der Maus nach (${blick.t})`, m && +m[1] < 0 && +m[2] < 0 && Math.hypot(+m[1], +m[2]) <= 4.6, JSON.stringify(blick));
      /* Runde 205 — aus dem Betrieb: „gib dem gesicht mehr leben auch und
         den augen vorallem". Die Pupillen wandern im Auge mit. */
      const pup = await p.evaluate(() => [...document.querySelectorAll('#formiKugel .fk-auge b')].map(b => getComputedStyle(b).transform));
      const pm = pup.map(t => /matrix\(1, 0, 0, 1, (-?[\d.]+), (-?[\d.]+)\)/.exec(t));
      pruefe(`… die Pupillen schauen mit (${pup[0]})`, pm.length === 2 && pm.every(x => x && +x[1] < 0 && +x[2] < 0 && Math.hypot(+x[1], +x[2]) <= 1.9), JSON.stringify(pup));
      const nah = await p.evaluate(async () => {
        const k = document.getElementById('formiKugel').getBoundingClientRect();
        return { x: k.left + k.width / 2 - 60, y: k.top + k.height / 2 - 40 };
      });
      await p.mouse.move(nah.x, nah.y); await p.waitForTimeout(400);
      const gross = await p.evaluate(() => getComputedStyle(document.querySelector('#formiKugel .fk-auge')).transform);
      pruefe(`kommt die Maus nah, werden die Augen gross (${gross})`, /matrix\(1\.1[0-9]*, 0, 0, 1\.1/.test(gross), gross);
      await p.mouse.move(10, 10); await p.waitForTimeout(400);
      const klein = await p.evaluate(() => getComputedStyle(document.querySelector('#formiKugel .fk-auge')).transform);
      pruefe('… und wieder normal, wenn sie weggeht', klein === 'none' || klein === 'matrix(1, 0, 0, 1, 0, 0)', klein);
      await p.evaluate(() => window.__formiLebt.schauHin('#homeAlerts .fz-teil.bad'));
      await p.waitForTimeout(400);
      /* Die Richtung aus der Lage rechnen: seit Runde 205 sitzt die Kugel
         am Rechner unten LINKS in der Seitenleiste, der Hinweis liegt
         dann rechts oberhalb. */
      const hin = await p.evaluate(() => {
        const t = getComputedStyle(document.querySelector('#formiKugel .fk-auge b')).transform;
        const k = document.getElementById('formiKugel').getBoundingClientRect(), z = document.querySelector('#homeAlerts .fz-teil.bad').getBoundingClientRect();
        return { t, dx: Math.sign(z.left + z.width / 2 - (k.left + k.width / 2)), dy: Math.sign(z.top + z.height / 2 - (k.top + k.height / 2)) };
      });
      const hm = /matrix\(1, 0, 0, 1, (-?[\d.]+), (-?[\d.]+)\)/.exec(hin.t);
      pruefe(`schaut hin, wo etwas passiert (zum Hinweis: ${hin.t})`, hm && Math.sign(+hm[1]) === hin.dx && Math.sign(+hm[2]) === hin.dy, JSON.stringify(hin));
      const muede = await p.evaluate(() => window.__formiLebt.muede() && document.getElementById('formiKugel').classList.contains('fk-muede'));
      pruefe('nach 60 s ohne Bedienung wird Formi müde (halb zu)', muede);
      await p.mouse.move(20, 20); await p.waitForTimeout(150);
      pruefe('… eine Bewegung, und es ist wieder wach', await p.evaluate(() => !document.getElementById('formiKugel').classList.contains('fk-muede')));
      pruefe('… ohne das style-Attribut anzufassen', !blick.attr, JSON.stringify(blick));

      // Einschlafen und Aufwachen
      const schlaf = await p.evaluate(() => window.__formiLebt.einschlafen());
      const zu = await p.evaluate(() => document.getElementById('formiKugel').classList.contains('fk-schlaeft'));
      pruefe('nach 90 s ohne Bedienung schläft Formi (Auge zu)', schlaf && zu);
      await p.mouse.move(400, 400);
      await p.waitForTimeout(100);
      const wach = await p.evaluate(() => ({ zu: document.getElementById('formiKugel').classList.contains('fk-schlaeft'),
        geister: [...document.querySelectorAll('#formiKugel .fk-geist')].some(g => g.getAnimations().length) }));
      pruefe('eine Bewegung weckt Formi, mit Glitch', !wach.zu && wach.geister, JSON.stringify(wach));

      // Punkt geht weg, wenn man Formi öffnet — und bleibt weg beim Neuzeichnen
      await p.mouse.move(700, 450);
      await p.click('#formiKugel');
      await p.waitForTimeout(400);
      await p.click('#jarvisZu');
      await p.waitForTimeout(400);
      const k1 = await p.evaluate(() => ({ hat: document.getElementById('formiKugel').classList.contains('fk-hat'), besch: document.getElementById('formiKugel').getAttribute('aria-describedby') }));
      pruefe('nach dem Öffnen ist der Punkt weg, auch für Vorleser', !k1.hat && !k1.besch, JSON.stringify(k1));
      pruefe('keine Fehler auf der Seite', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
    {
      const p = await oeffne(b, 1440, 900, { vorher: () => { localStorage.setItem('kf_formi_gesehen', 'u1m5'); } });
      pruefe('schon gesehener Stand: kein Punkt', await p.evaluate(() => !document.getElementById('formiKugel').classList.contains('fk-hat')));
      await p._ctx.close();
    }

    /* Runde 188 — aus dem Betrieb: „Ja aber versteckter". Der Schalter
       steht in Formis eigenen Einstellungen (Regler im Formi-Fenster). */
    console.log('\n── Versteckter Schalter: Gefühle aus ──');
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const p = await oeffne(b, w, h);
      await p.click('#formiKugel'); await p.waitForTimeout(400);
      /* Runde 208: im kleinen Fenster liegen die Einstellungen hinter „…". */
      await p.click('#jarvisMehr'); await p.waitForTimeout(200);
      await p.click('#jarvisPersonaBtn'); await p.waitForTimeout(300);
      const aus = '#jarvisPersona [data-jvp="gefuehle"][data-jvw="aus"]', an = '#jarvisPersona [data-jvp="gefuehle"][data-jvw="an"]';
      pruefe(`${w} px: der Schalter steht in Formis Einstellungen, Standard „Zeigen"`,
        await p.evaluate((s) => document.querySelector(s) && document.querySelector(s).getAttribute('aria-pressed') === 'true', an));
      for (const sel of [an, aus]) {
        await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel);
        const m = await p.evaluate(([TR, s]) => (eval(TR))(document.querySelector(s)), [TREFFER.toString(), sel]);
        pruefe(`${w} px: „${sel.includes('aus') ? 'Aus' : 'Zeigen'}" trifft ${m.w}×${m.h}, im Bild`, m.w >= 44 && m.h >= 44 && m.imBild, JSON.stringify(m));
      }
      await p.click(aus); await p.waitForTimeout(200);
      pruefe(`${w} px: „Aus" ist gewählt und gemerkt`, await p.evaluate(() => JSON.parse(localStorage.getItem('kf_jv_persona') || '{}').gefuehle === 'aus'));
      await p.click('#jarvisZu'); await p.waitForTimeout(400);
      await p.evaluate(() => { window.__formiLebt.fuehlt('freut'); window.__formiLebt.fuehlt('feiert'); window.__formiLebt.haken(); });
      if (w > 820) { await p.mouse.move(10, 10); await p.waitForTimeout(300); }
      const still = await p.evaluate(() => ({ n: document.getElementById('formiKugel').getAnimations({ subtree: true }).length,
        schlaf: window.__formiLebt.einschlafen() }));
      pruefe(`${w} px: Gefühle aus — keine Bewegung, kein Schauen, kein Einschlafen`, still.n === 0 && !still.schlaf, JSON.stringify(still));
      // Formi war eben offen, also ist der Stand „gesehen". Vergessen lassen:
      await p.evaluate(() => localStorage.removeItem('kf_formi_gesehen'));
      await p.reload({ waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
      await p.waitForTimeout(900);
      await p.evaluate(() => window.__formiLebt.fuehlt('freut'));
      pruefe(`${w} px: nach dem Neuladen bleibt es aus`, await p.evaluate(() => document.getElementById('formiKugel').getAnimations({ subtree: true }).length === 0));
      pruefe(`${w} px: der Punkt „hat etwas für dich" gibt es auch mit Gefühlen aus`, await p.evaluate(() => document.getElementById('formiKugel').classList.contains('fk-hat')));
      await p.click('#formiKugel'); await p.waitForTimeout(400);
      await p.click('#jarvisMehr'); await p.waitForTimeout(200);
      await p.click('#jarvisPersonaBtn'); await p.waitForTimeout(300);
      await p.click(an); await p.waitForTimeout(200);
      await p.click('#jarvisZu'); await p.waitForTimeout(400);
      await p.evaluate(() => window.__formiLebt.fuehlt('freut'));
      pruefe(`${w} px: wieder „Zeigen" — Formi freut sich wieder`, await p.evaluate(() => document.getElementById('formiKugel').getAnimations({ subtree: true }).length > 0));
      pruefe(`${w} px: keine Fehler auf der Seite`, !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }

    /* Runde 208 — aus dem Betrieb, auf die Ideenliste: „mach alles davon".
       Das Formi-Fenster aufgeräumt, Formi in leeren Listen, beim Laden und
       vor jeder Antwort. */
    console.log('\n── Formi-Fenster aufgeräumt, Formi in leeren Listen und beim Laden ──');
    for (const [w, h] of [[1440, 900], [390, 844], [320, 568]]) {
      for (const dichte of ['normal', 'kompakt']) {
        const p = await oeffne(b, w, h);
        if (dichte === 'kompakt') await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt'));
        const lade = await p.evaluate(() => document.querySelectorAll('#loadingWrap .formi-lade .fk-auge').length);
        await p.click('#formiKugel'); await p.waitForTimeout(500);
        const st = await p.evaluate(() => {
          const sicht = (s) => { const e = document.querySelector(s); return !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden'; };
          return { figur: sicht('#jarvisVerlauf .jv-start-figur') && document.querySelectorAll('#jarvisVerlauf .jv-start-figur .fk-braue').length === 2,
            brief: sicht('#jarvisVerlauf .jv-brief'), kopfGesicht: sicht('#jarvis .jv-titel .formi-gesicht'),
            knoepfe: ['jarvisMehr', 'jarvisPersonaBtn', 'jarvisGespraecheBtn', 'jarvisTon', 'jarvisGroesse', 'jarvisZu'].filter(id => sicht('#' + id)) };
        });
        const tag = `${w} px ${dichte}`;
        if (dichte === 'normal') pruefe(`${tag}: beim Laden dreht sich Formis Ring mit Gesicht (statt Kreisel)`, lade === 2, String(lade));
        pruefe(`${tag}: Startschirm mit grossem Gesicht, ohne doppelte Lage-Zeilen, kein zweites Gesicht im Kopf`, st.figur && !st.brief && !st.kopfGesicht, JSON.stringify(st));
        pruefe(`${tag}: im Kopf drei Knöpfe (… · Groß · Schließen)`, JSON.stringify(st.knoepfe) === JSON.stringify(['jarvisMehr', 'jarvisGroesse', 'jarvisZu']), JSON.stringify(st.knoepfe));
        await p.click('#jarvisMehr'); await p.waitForTimeout(200);
        const sechs = await p.evaluate(([TR]) => ['jarvisMehr', 'jarvisPersonaBtn', 'jarvisGespraecheBtn', 'jarvisTon', 'jarvisGroesse', 'jarvisZu'].map(id => {
          const m = (eval(TR))(document.getElementById(id)); return id + ':' + m.w + '×' + m.h + (m.imBild ? '' : ':raus'); }), [TREFFER.toString()]);
        pruefe(`${tag}: „…" klappt Einstellungen, Gespräche und Ton auf — alle sechs ≥ 44 × 44, im Bild`,
          sechs.every(x => { const m = /:(\d+)×(\d+)$/.exec(x); return m && +m[1] >= 44 && +m[2] >= 44; }), sechs.join(' '));
        await p.click('#jarvisZu'); await p.waitForTimeout(300);
        if (dichte === 'normal') {
          // Leere Liste: Formi bietet sich an
          await p.evaluate(() => { history.pushState({ v: 'archive' }, '', '#archive'); window.dispatchEvent(new PopStateEvent('popstate', { state: { v: 'archive' } })); });
          await p.waitForTimeout(400);
          const leer = await p.evaluate(([TR]) => { const b = document.querySelector('.view.show .empty .leer-formi'); if (!b) return null; b.scrollIntoView({ block: 'center' }); return (eval(TR))(b); }, [TREFFER.toString()]);
          pruefe(`${tag}: leere Liste (Archiv): „Frag Formi" mit Gesicht, ${leer && leer.w}×${leer && leer.h}`, leer && leer.w >= 44 && leer.h >= 44 && leer.imBild, JSON.stringify(leer));
          await p.click('.view.show .empty .leer-formi'); await p.waitForTimeout(400);
          pruefe(`${tag}: … ein Tipp öffnet Formi`, await p.evaluate(() => !document.getElementById('jarvis').hidden));
        }
        pruefe(`${tag}: keine Fehler auf der Seite`, !p._fehler.length, p._fehler.join(' | '));
        await p._ctx.close();
      }
    }
    {
      // Am Rechner: die Gesichter im Fenster schauen der Maus nach
      const p = await oeffne(b, 1440, 900);
      await p.click('#formiKugel'); await p.waitForTimeout(500);
      await p.mouse.move(1430, 890); await p.waitForTimeout(400);
      const pu = await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf .jv-start-figur .fk-auge b')].map(b => getComputedStyle(b).transform));
      const m = pu.map(t => /matrix\(1, 0, 0, 1, (-?[\d.]+), (-?[\d.]+)\)/.exec(t));
      pruefe(`Fenster offen: das grosse Gesicht schaut der Maus nach (${pu[0]})`, m.length === 2 && m.every(x => x && +x[1] > 0 && +x[2] > 0), JSON.stringify(pu));
      await p._ctx.close();
    }

    console.log('\n── Weniger Bewegung ──');
    {
      const p = await oeffne(b, 1440, 900, { wenigBewegung: true });
      for (const art of ['freut', 'feiert', 'erschrickt', 'blinzelt']) await p.evaluate((a) => window.__formiLebt.fuehlt(a), art);
      await p.evaluate(() => window.__formiLebt.glitch('#homeAlerts .formi-zeile'));
      await p.waitForTimeout(100);
      const a = await p.evaluate(KUGEL_ANIM);
      pruefe('keine Bewegung an der Kugel', a.n === 0, JSON.stringify(a));
      await p.evaluate(() => window.__formiLebt.atmen());
      pruefe('keine Teilchen, kein Atmen', await p.evaluate(() => !document.querySelector('#formiKugel .fk-teilchen') && document.getElementById('formiKugel').getAnimations({ subtree: true }).length === 0));
      pruefe('kein Glitch', await p.evaluate(() => !document.querySelector('.formi-glitch')));
      pruefe('die Zeile springt nicht herein', await p.evaluate(() => document.querySelector('.formi-zeile').getAnimations({ subtree: true }).length === 0));
      await p._ctx.close();
    }

    /* ── 3. Spur ───────────────────────────────────────────────────── */
    console.log('\n── Formi-Spur ──');
    {
      const p = await oeffne(b, 1440, 900, { vorher: () => {
        const t = Date.now() - 60000;
        window.__todos = { 'studio-6': [
          { id: 'f1', title: 'Über Formi abgehakt', done: true, doneBy: 'Test Chef', doneAt: t, formiAt: t, createdBy: 'Chef', ts: 1 },
          { id: 'f2', title: 'Danach von Hand neu abgehakt', done: true, doneBy: 'Anna', doneAt: t + 5000, formiAt: t, createdBy: 'Chef', ts: 2 },
          { id: 'f3', title: 'Von Formi angelegt', done: false, createdBy: 'Test Chef', vonFormi: true, ts: 3 },
          { id: 'f4', title: 'Ganz normal', done: false, createdBy: 'Chef', ts: 4 }
        ] };
      } });
      await p.evaluate(() => document.querySelector('#side [data-group="g-arbeit"]').click());
      await p.waitForTimeout(400);
      const sub = await p.$('[data-subview="todos"]');
      if (sub) { await sub.click(); await p.waitForTimeout(600); }
      // Die Attrappe legt die Aufgaben in studio-6 (Hürth) ab.
      await p.selectOption('#todoStudioWahl', 'studio-6');
      await p.waitForTimeout(600);
      const spur = await p.evaluate(() => {
        /* Die Zeile ist der höchste Vorfahr der Fusszeile (.pp-meta), der
           nur diese eine Fusszeile enthält. */
        const zeilen = [...document.querySelectorAll('#view-todos .pp-meta')].map(m => {
          let z = m; while (z.parentElement && z.parentElement.querySelectorAll('.pp-meta').length === 1) z = z.parentElement;
          return { z, m };
        });
        const finde = (titel) => {
          const x = zeilen.find(y => y.z.textContent.includes(titel));
          return x ? (x.m.querySelector('.formi-spur') || { textContent: '' }).textContent : null;
        };
        return { view: (document.querySelector('.view.show') || {}).id,
          f1: finde('Über Formi abgehakt'), f2: finde('Danach von Hand'), f3: finde('Von Formi angelegt'), f4: finde('Ganz normal') };
      });
      pruefe('Aufgaben-Seite offen', spur.view === 'view-todos', spur.view);
      pruefe('über Formi abgehakt: „über Formi"', spur.f1 === 'über Formi', JSON.stringify(spur));
      pruefe('danach von Hand neu abgehakt: keine Spur', spur.f2 === '', JSON.stringify(spur));
      pruefe('von Formi angelegt: „über Formi angelegt"', spur.f3 === 'über Formi angelegt', JSON.stringify(spur));
      pruefe('gewöhnliche Aufgabe: keine Spur', spur.f4 === '', JSON.stringify(spur));
      await p._ctx.close();
    }

    console.log('\n── Formi schreibt die Spur mit ──');
    {
      const p = await oeffne(b, 1440, 900);
      await p.click('#formiKugel'); await p.waitForTimeout(500);
      await p.fill('#jarvisFeld', 'hak Toiletten reinigen ab');
      await p.click('#jarvisSenden'); await p.waitForTimeout(1500);
      const w = (await p.evaluate(() => window.__schreib || [])).filter(x => /cleaning\/c3$/.test(x.pfad));
      const d = (w[0] || {}).daten || {};
      pruefe('Formi hakt im Putzplan ab: formiAt = doneAt', w.length === 1 && d.done === true && d.formiAt && d.formiAt === d.doneAt, JSON.stringify(w));

      // Jetzt anlegen: die Aufgabe trägt vonFormi
      await p.evaluate(() => { window.__antwort = window.__antwort || {}; window.__antwort.gehirnAktion = () => Promise.resolve({ data: { vorschlag: {
        typ: 'aufgabe', titel: 'Spiegel polieren', text: '', schritte: [], frist: '', alle: false, studioKeys: ['studio-6'], studioNamen: ['Hürth'], wichtig: false } } }); });
      await p.fill('#jarvisFeld', 'Leg in Hürth an: Spiegel polieren');
      await p.click('#jarvisSenden'); await p.waitForTimeout(1500);
      const vorher = await p.evaluate(() => (window.__schreib || []).length);
      const knopf = await p.$('#jarvisVerlauf [data-ganlegen]');
      if (knopf) { await knopf.click(); await p.waitForTimeout(800); }
      const neu = (await p.evaluate((n) => (window.__schreib || []).slice(n), vorher)).filter(x => /todos\//.test(x.pfad));
      pruefe('„Jetzt anlegen" über Formi: die Aufgabe trägt vonFormi', !!knopf && neu.length === 1 && neu[0].daten.vonFormi === true, JSON.stringify(neu).slice(0, 300));
      await p.click('#jarvisZu'); await p.waitForTimeout(300);

      // GEGENPROBE: von Hand im Putzplan abhaken schreibt KEINE Spur
      await p.evaluate(() => document.querySelector('#side [data-group="g-arbeit"]').click());
      await p.waitForTimeout(400);
      const sub = await p.$('[data-subview="putzplan"]');
      if (sub) { await sub.click(); await p.waitForTimeout(600); }
      await p.selectOption('#ppStudio', 'studio-6'); await p.waitForTimeout(600);
      const n0 = await p.evaluate(() => (window.__schreib || []).length);
      await p.evaluate(() => { const c = document.querySelector('#view-putzplan .pp-item:not(.done) [data-check]'); if (c) c.click(); });
      await p.waitForTimeout(500);
      const hand = (await p.evaluate((n) => (window.__schreib || []).slice(n), n0)).filter(x => /cleaning\//.test(x.pfad));
      pruefe('GEGENPROBE: von Hand abgehakt — ohne formiAt', hand.length === 1 && !('formiAt' in hand[0].daten), JSON.stringify(hand));
      pruefe('keine Fehler auf der Seite', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }

    /* ── 4. Der Ring gehört nur Formi ─────────────────────────────── */
    console.log('\n── Der Ring gehört nur Formi ──');
    {
      const p = await oeffne(b, 1440, 900);
      const fremd = await p.evaluate(() => {
        const aus = [];
        for (const sh of document.styleSheets) {
          let regeln; try { regeln = sh.cssRules; } catch (e) { continue; }
          const geh = (rs) => { for (const r of rs) {
            if (r.cssRules && r.cssRules.length && !r.style) geh(r.cssRules);
            if (r.style && /var\(--formi-ring\)/.test(r.cssText) && !/formi|fk-|fz-|jv-|jarvis/.test(r.selectorText || '')) aus.push(r.selectorText);
          } };
          geh(regeln);
        }
        return aus;
      });
      pruefe('--formi-ring steht nur an Formi-Teilen', fremd.length === 0, fremd.join(', '));
      await p._ctx.close();
    }

    /* ── 5. Trefferflächen und Querlauf ───────────────────────────── */
    console.log('\n── Trefferflächen (Hit-Test), normal und kompakt ──');
    for (const w of [320, 390, 430, 820, 1280, 1440, 1920]) {
      const h = w > 820 ? (w === 1280 ? 800 : w === 1440 ? 900 : 1080) : (w === 320 ? 568 : 844);
      for (const dichte of ['normal', 'kompakt']) {
        const p = await oeffne(b, w, h);
        if (dichte === 'kompakt') { await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt')); await p.waitForTimeout(200); }
        const r = await p.evaluate((TR) => {
          const T = eval(TR);
          const els = [...document.querySelectorAll('#homeAlerts .fz-gesicht, #homeAlerts .fz-teil')];
          const aus = els.map(el => { el.scrollIntoView({ block: 'center' }); return Object.assign({ was: el.className + ' ' + (el.textContent || '').trim().slice(0, 18) }, T(el)); });
          return { aus, quer: document.documentElement.scrollWidth > innerWidth + 1 };
        }, TREFFER.toString());
        const schlechte = r.aus.filter(x => !(x.w >= 44 && x.h >= 44 && x.imBild));
        pruefe(`${w} px ${dichte}: ${r.aus.length} Bedienelemente der Zeile ≥ 44 × 44, im Bild (kleinstes ${Math.min(...r.aus.map(x => x.w))}×${Math.min(...r.aus.map(x => x.h))})`,
          r.aus.length >= 3 && !schlechte.length, JSON.stringify(schlechte));
        pruefe(`${w} px ${dichte}: kein Querlauf`, !r.quer);
        await p._ctx.close();
      }
    }
  } catch (e) {
    console.log('Fehler: ' + e.message.split('\n')[0]);
    schlecht++;
  }
  await b.close();
  console.log(schlecht ? `\n✗ Formi lebt: ${schlecht} von ${gut + schlecht} falsch` : `\n✓ Formi lebt: ${gut} Zusicherungen`);
  process.exit(schlecht ? 1 : 0);
})();
