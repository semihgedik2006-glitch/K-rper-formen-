/* ══════════════════════════════════════════════════════════════════════
   FORMI ALS ECHTES SCHWARZES LOCH (Runde 237, Etappe 3, 23.10.2026)

   Aus dem Betrieb: „ich möchte noch das er vlt irgendwie noch extra
   schwarze loch eigenschaften hat und so gib mir dafür auch noch ideen"
   — auf die zehn Ideen „alles davon".

   Geprüft wird:
    1. Sog am Ereignishorizont: ein abgehakter Punkt fliegt als
       Schriftzug zur Kugel, wird lang gezogen (scaleX > 2) und ist am
       Ende weg; danach ein Sog an der Kugel.
    2. Photonenring: heller Lichtring am Rand des Lochs.
    3. Hawking-Strahlung: Teilchen entweichen (im Eigenleben).
    4. Jets + Gravitationswelle beim grossen Jubel (feiert).
    5. Gezeitenkräfte: Maus nah → Formi wird hingezogen (translate).
    6. Wurmloch: öffnet Formi eine Seite, kommt sie aus dem Loch.
    7. Masse: ab 3 / 8 / 15 Haken heute wird Formi heller (Klasse).
    8. Zeitdehnung: der Funke beim Fangen kriecht kurz vor dem Loch.
    Alles endlich, nur transform/opacity (Gezeiten: translate), nicht
    klickbar; bei „weniger Bewegung" nichts davon. Ohne Seitenfehler.
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
  await p.evaluate(() => window.__formiLebt.uhrenAus());
  p._ctx = ctx;
  return p;
}
const zeige = (p, id) => p.evaluate((id) => { history.pushState({ v: id }, '', '#' + id); window.dispatchEvent(new PopStateEvent('popstate', { state: { v: id } })); }, id);
const EIG = (anims) => [...new Set(anims.flatMap(a => a.effect.getKeyframes().flatMap(f => Object.keys(f).filter(k => !['offset', 'easing', 'composite', 'computedOffset'].includes(k)))))];

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      console.log(`\n── ${w} px ──`);
      const p = await oeffne(b, w, h);
      await p.mouse.move(400, 300);
      // 1 Sog
      await zeige(p, 'todos'); await p.waitForTimeout(500);
      const s = await p.evaluate(async () => {
        const c = document.querySelector('#todoArea .todo .check'); if (!c) return null;
        window.__formiLebt.schlucken('#todoArea .todo .check');
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        /* Runde 244 — „besseren effekt": der Titel zerfällt in Buchstaben
           (.formi-strom). Gemessen wird der Buchstabe, der zuerst abreisst. */
        const box = document.querySelector('.formi-strom'); if (!box) return { g: false };
        const zeichen = [...box.querySelectorAll('i:not(.spur)')].filter(i => i.style.display !== 'none' && i.getAnimations().length);
        const ani = i => i.getAnimations().find(x => !x.effect.pseudoElement);
        const g = zeichen.sort((x, y) => ani(x).effect.getTiming().delay - ani(y).effect.getTiming().delay)[0];
        const a = ani(g), kf = a.effect.getKeyframes();
        const k = document.getElementById('formiKugel').getBoundingClientRect();
        const m = /translate\((-?[\d.]+)px, ?(-?[\d.]+)px\).*scale\(([\d.]+), ?([\d.]+)\)/.exec(kf[kf.length - 1].transform);
        const zr = g.parentElement.getBoundingClientRect();
        /* Runde 242 — aus dem Betrieb: „fliegen ganz steif … statt gestreckt
           und drehend … keine spagettifikation". Gemessen aus den Bildern:
           wie weit er sich dreht, ob die Streckung zum Ende wächst und ob
           das letzte Fünftel des Wegs länger dauert (Zeitdehnung). */
        const rots = kf.map(f => +((/rotate\((-?[\d.]+)deg\)/.exec(f.transform) || [0, 0])[1]));
        const sx = kf.map(f => +((/scale\(([\d.]+),/.exec(f.transform) || [0, 1])[1]));
        const sy = kf.map(f => +((/scale\([\d.]+, ?([\d.]+)\)/.exec(f.transform) || [0, 1])[1]));
        const zeitAnteilEnde = 1 - kf[Math.floor(kf.length * .8)].offset;
        const text = [...box.querySelectorAll('i:not(.spur)')].map(i => i.textContent).join('').replace(/\u00a0/g, ' ');
        return { g: true, text, gw: g.offsetWidth, gh: g.offsetHeight, drehung: Math.abs(rots[rots.length - 1] - rots[0]),
          streckEnde: sx[kf.length - 2] / sy[kf.length - 2], streckMitte: sx[Math.floor(kf.length / 2)] / sy[Math.floor(kf.length / 2)], zeitAnteilEnde, klick: getComputedStyle(box).pointerEvents, endlich: a.effect.getTiming().iterations === 1, eig: Object.keys(kf[5]).filter(x => !['offset', 'easing', 'composite', 'computedOffset'].includes(x)),
          ende: m ? { x: zr.left + +m[1], y: zr.top + +m[2], sx: +m[3], sy: +m[4] } : null, op: kf[kf.length - 1].opacity, kx: k.left + k.width / 2, ky: k.top + k.height / 2 };
      });
      /* translate setzt die linke obere Ecke; die Mitte des Schriftzugs liegt eine halbe Breite weiter. */
      const nahAnKugel = s && s.ende && Math.hypot(s.ende.x + s.gw / 2 - s.kx, s.ende.y + s.gh / 2 - s.ky) < 40;
      pruefe(`Abhaken: der Titel zerfällt und fliegt zur Kugel, lang gezogen, am Ende weg („${s && s.text}")`, s && s.g && s.klick === 'none' && s.endlich && s.ende && s.ende.sx > 2 && s.ende.sy < .3 && +s.op === 0 && nahAnKugel, JSON.stringify(s));
      pruefe(`… er dreht sich mit der Bahn (${s && Math.round(s.drehung)}° insgesamt, gut eine Runde)`, s && s.drehung >= 360, JSON.stringify(s && s.drehung));
      pruefe(`… Spaghettifizierung: am Ende ${s && s.streckEnde.toFixed(1)}× länger als breit, mehr als in der Mitte (${s && s.streckMitte.toFixed(1)}×)`, s && s.streckEnde >= 10 && s.streckEnde > s.streckMitte * 2, JSON.stringify(s));
      pruefe(`… Zeitdehnung: das letzte Fünftel des Wegs dauert ${s && Math.round(s.zeitAnteilEnde * 100)} % der Zeit`, s && s.zeitAnteilEnde >= .3, JSON.stringify(s && s.zeitAnteilEnde));
      /* Der Strom dauert je nach Länge des Titels; erst wenn er weg ist,
         muss die Kugel saugen. */
      await p.waitForFunction(() => !document.querySelector('.formi-strom'), null, { timeout: 6000 }).catch(() => {});
      pruefe('… danach ist er weg und die Kugel saugt (Welle „sog")', await p.evaluate(() => !document.querySelector('.formi-strom') && !!document.querySelector('.formi-welle.sog')));
      await zeige(p, 'home'); await p.waitForTimeout(600);
      // 1b Auch der Haken direkt auf „Heute" (Runde 240) lässt den Punkt ins Loch fallen
      const hh = await p.evaluate(async () => {
        const b = document.querySelector('.hz-haken'); if (!b) return { fehlt: true };
        const titel = b.closest('.hz-mit-haken').querySelector('.hz-txt b').textContent.trim();
        b.click();
        await new Promise(r => setTimeout(r, 120));
        const box = document.querySelector('.formi-strom');
        return { titel, g: box ? [...box.querySelectorAll('i:not(.spur)')].map(i => i.textContent).join('').replace(/\u00a0/g, ' ') : null };
      });
      pruefe(`Haken auf „Heute": „${hh.titel}" fällt ins Loch`, hh.fehlt || (hh.g && hh.titel.indexOf(hh.g.replace(/…$/, '')) === 0), JSON.stringify(hh));
      await p.waitForTimeout(2100);
      // 2 Photonenring
      const ring = await p.evaluate(() => getComputedStyle(document.querySelector('#formiKugel .fk-pupille')).boxShadow);
      pruefe('Photonenring: heller Lichtring am Rand des Lochs', /rgba\(255, 236, 214/.test(ring), ring);
      // 3 Hawking
      const hw = await p.evaluate(() => { const r = window.__formiLebt.leben('hawking'); const box = document.querySelector('#formiKugel .fk-teilchen.klein'); return { r, n: box ? box.children.length : 0, eig: box ? [...new Set([].concat(...[...box.children].map(c => c.getAnimations().flatMap(a => a.effect.getKeyframes().flatMap(f => Object.keys(f))))))] : [] }; });
      pruefe('Hawking-Strahlung: vier Teilchen entweichen vom Rand', hw.r === 'hawking' && hw.n === 4 && hw.eig.filter(x => !['offset', 'easing', 'composite', 'computedOffset'].includes(x)).every(x => x === 'transform' || x === 'opacity'), JSON.stringify(hw));
      await p.waitForTimeout(2800);
      // 4 Jets + Gravitationswelle
      const j = await p.evaluate(async () => { window.__formiLebt.fuehlt('feiert'); await new Promise(r => setTimeout(r, 120));
        const jets = [...document.querySelectorAll('#formiKugel .fk-jet')]; return { jets: jets.length, endlich: jets.every(x => x.getAnimations().every(a => a.effect.getTiming().iterations === 1)), grav: !!document.querySelector('.formi-welle.grav') }; });
      pruefe('Jubel: zwei Jets und eine Gravitationswelle durch die App', j.jets === 2 && j.endlich && j.grav, JSON.stringify(j));
      await p.waitForTimeout(2000);
      pruefe('… danach liegt nichts mehr herum', await p.evaluate(() => !document.querySelector('.fk-jet, .formi-welle.grav')));
      // 5 Gezeiten (nur mit Maus)
      if (w > 820) {
        await p.mouse.move(10, 10); await p.waitForTimeout(300);
        const k = await p.evaluate(() => { const r = document.getElementById('formiKugel').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
        await p.mouse.move(k.x + 70, k.y - 50); await p.waitForTimeout(500);
        const gz = await p.evaluate(() => getComputedStyle(document.querySelector('#formiKugel .fk-koerper')).translate);
        const m = /(-?[\d.]+)px (-?[\d.]+)px/.exec(gz || '');
        pruefe(`Gezeitenkräfte: Maus nah rechts oben → Formi wird hingezogen (${gz})`, m && +m[1] > 0 && +m[2] < 0 && Math.hypot(+m[1], +m[2]) <= 6, gz);
        await p.mouse.move(10, 10); await p.waitForTimeout(400);
        const weg = await p.evaluate(() => getComputedStyle(document.querySelector('#formiKugel .fk-koerper')).translate);
        pruefe('… und lässt los, wenn sie weggeht', weg === 'none' || weg === '0px', weg);
      }
      // 6 Wurmloch
      const wl = await p.evaluate(async () => { window.__formiLebt.wurmloch(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const v = document.querySelector('.view.show'); const a = v.getAnimations().filter(x => !x.animationName); if (!a.length) return null;
        const kf = a[0].effect.getKeyframes(); return { start: kf[0].transform, op: kf[0].opacity, ende: kf[kf.length - 1].transform, endlich: a[0].effect.getTiming().iterations === 1 }; });
      pruefe('Wurmloch: die Seite kommt aus dem Loch (klein, gedreht → ganz)', wl && /scale\(0\.15\)/.test(wl.start) && +wl.op === 0 && wl.ende === 'none' && wl.endlich, JSON.stringify(wl));
      // 7 Masse
      const ma = await p.evaluate(() => { localStorage.removeItem('kf_formi_masse'); const r = [window.__formiLebt.masse(0)]; r.push(window.__formiLebt.masse(3)); r.push(window.__formiLebt.masse(5)); r.push(window.__formiLebt.masse(7));
        return { stufen: r, kl: document.getElementById('formiKugel').className.match(/fk-masse-\d/g) }; });
      pruefe('Masse: 0 → 3 → 8 → 15 Haken heute = Stufe 0, 1, 2, 3 (eine Klasse zur Zeit)', ma.stufen.join(',') === '0,1,2,3' && ma.kl && ma.kl.length === 1 && ma.kl[0] === 'fk-masse-3', JSON.stringify(ma));
      // 8 Zeitdehnung
      const zd = await p.evaluate(() => { window.__formiLebt.leben('faengt'); const el = document.querySelector('#formiKugel .fk-teilchen i'); const a = el && el.getAnimations()[0]; return a ? { easing: a.effect.getTiming().easing, dauer: a.effect.getTiming().duration } : null; });
      pruefe('Zeitdehnung: der Funke kriecht vor dem Loch (langsames Ende)', zd && /cubic-bezier\(0\.3, 0\.1, 0\.1, 1\)/.test(zd.easing) && zd.dauer >= 2400, JSON.stringify(zd));
      pruefe('ohne Seitenfehler', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
    {
      const p = await oeffne(b, 1440, 900, { wenigBewegung: true });
      await zeige(p, 'todos'); await p.waitForTimeout(400);
      const r = await p.evaluate(async () => { window.__formiLebt.schlucken('#todoArea .todo .check'); window.__formiLebt.wurmloch();
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return { schluck: document.querySelectorAll('.formi-strom, .formi-schluck').length, wurm: document.querySelector('.view.show').getAnimations().filter(x => !x.animationName).length }; });
      pruefe('„weniger Bewegung": kein Sog, kein Wurmloch', r.schluck === 0 && r.wurm === 0, JSON.stringify(r));
      await p._ctx.close();
    }
  } catch (e) {
    console.log('Fehler: ' + e.message.split('\n')[0]);
    schlecht++;
  }
  await b.close();
  console.log(schlecht ? `✗ Formi Schwarzes Loch: ${schlecht} von ${gut + schlecht} falsch` : `✓ Formi Schwarzes Loch: ${gut} Zusicherungen`);
  process.exit(schlecht ? 1 : 0);
})();
