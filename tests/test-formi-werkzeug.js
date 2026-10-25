/* ══════════════════════════════════════════════════════════════════════
   FORMI ALS WERKZEUG (Runde 266) — Ideen 1, 2, 6, 8, 18 aus
   docs/ideen/formi-und-oberflaeche-20.md

   Aus dem Betrieb (25.10.2026): „mach alles davon und alles was noch
   offen ist".

   Geprüft:
   2. Lange drücken (und Rechtsklick) auf Formi: vier Aufträge über der
      Kugel, jeder per Hit-Test ≥ 44 × 44 und im Bild, bei 320 / 390 /
      430 / 820 / 1280 / 1440 / 1920, normal und kompakt; ein Tipp
      schickt den Auftrag an Formi; was man zweimal sagt, steht danach
      oben. Daneben tippen schliesst. Der kurze Tipp öffnet weiter das
      Fenster.
   1. Am Rechner eine Aufgabe auf Formi ziehen → Abhaken / Erinnern /
      Fragen; „Abhaken" schreibt done mit Formi-Spur und zeigt die Insel.
      Gegenprobe: vom Griff aus wird nicht gezogen.
   6. Beim ersten Blick am Tag kommen die ersten drei Zeilen aus Formi
      (nur transform/opacity), beim zweiten nicht.
   8. Laufendes in der Insel: am Rechner dauerhaft in der Kopfleiste, am
      Handy nach gut 4 s wieder weg.
   18. Erste Woche: neues Konto → eine Zeile mit „Zeig’s mir" (≥ 44 px),
      startet den Rundgang; altes Konto ohne createdAt sieht nichts.
   NICHT geprüft: echtes Ziehen mit dem Finger (am Handy gibt es dafür den
   Ring), echte Handys.
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
async function oeffne(b, w, h, vorher) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  if (vorher) await p.addInitScript(vorher);
  await p.addInitScript({ path: path.join(__dirname, 'stub-chef.js') });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(900);
  await p.evaluate(() => window.__formiLebt.uhrenAus());
  p._ctx = ctx;
  return p;
}
const zeige = (p, id) => p.evaluate((id) => { history.pushState({ v: id }, '', '#' + id); window.dispatchEvent(new PopStateEvent('popstate', { state: { v: id } })); }, id);
const TREFFER = (el) => {
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0, imBild: false };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--; while (u < innerHeight && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--; while (re < innerWidth && trifft(re + 1, cy)) re++;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1), imBild: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight };
};
const lange = async (p) => {
  const k = await p.evaluate(() => { const r = document.getElementById('formiKugel').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.move(k.x, k.y); await p.mouse.down(); await p.waitForTimeout(650); await p.mouse.up(); await p.waitForTimeout(250);
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── 2 Lange drücken: vier Aufträge ──');
    for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      const p = await oeffne(b, w, h);
      for (const dichte of ['normal', 'kompakt']) {
        if (dichte === 'kompakt') { await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt')); await p.waitForTimeout(200); }
        await lange(p);
        const r = await p.evaluate((TR) => { const k = [...document.querySelectorAll('#formiRing .frm-knopf')];
          return { n: k.length, j: !document.getElementById('jarvis').hidden, m: k.map(x => Object.assign({ t: x.textContent }, (eval(TR))(x))) }; }, TREFFER.toString());
        pruefe(`${w} px ${dichte}: vier Aufträge, je ≥ 44 × 44 und im Bild, das Fenster bleibt zu`, r.n === 4 && !r.j && r.m.every(x => x.w >= 44 && x.h >= 44 && x.imBild), JSON.stringify(r));
        await p.mouse.click(5, Math.round(h / 2)); await p.waitForTimeout(200);
        pruefe(`${w} px ${dichte}: daneben tippen schliesst`, await p.evaluate(() => !document.getElementById('formiRing')));
      }
      await p._ctx.close();
    }
    {
      const p = await oeffne(b, 1440, 900);
      const k = await p.evaluate(() => { const r = document.getElementById('formiKugel').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await p.mouse.click(k.x, k.y, { button: 'right' }); await p.waitForTimeout(250);
      pruefe('Rechtsklick öffnet den Ring auch', await p.evaluate(() => document.querySelectorAll('#formiRing .frm-knopf').length === 4));
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      pruefe('Esc schliesst ihn', await p.evaluate(() => !document.getElementById('formiRing')));
      await p.mouse.click(k.x, k.y); await p.waitForTimeout(500);
      pruefe('GEGENPROBE: ein kurzer Tipp öffnet weiter das Fenster', await p.evaluate(() => !document.getElementById('jarvis').hidden));
      await p.evaluate(() => { window.__gesendet = []; window.__antwort = window.__antwort || {}; window.__antwort.gehirnAktion = (d) => { window.__gesendet.push(d && (d.text || d.frage)); return Promise.resolve({ data: { art: 'frage', antwort: 'Ok.' } }); }; });
      for (let i = 0; i < 2; i++) { await p.fill('#jarvisFeld', 'Wie viele Westen sind in der Wäsche?'); await p.click('#jarvisSenden'); await p.waitForTimeout(700); }
      await p.click('#jarvisZu'); await p.waitForTimeout(400);
      await lange(p);
      const erste = await p.evaluate(() => { const k = document.querySelector('#formiRing .frm-knopf'); return k && k.textContent; });
      pruefe(`zweimal gesagt steht oben: „${erste}"`, erste === 'Wie viele Westen sind in der Wäsche?', erste);
      await p.waitForTimeout(400); await p.click('#formiRing .frm-knopf'); await p.waitForTimeout(900);
      const g = await p.evaluate(() => ({ offen: !document.getElementById('jarvis').hidden, n: window.__gesendet.length }));
      pruefe('ein Tipp auf den Auftrag öffnet Formi und schickt ihn ab', g.offen && g.n === 3, JSON.stringify(g));
      pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }

    console.log('\n── 1 Auf Formi ziehen (Rechner) ──');
    {
      const p = await oeffne(b, 1440, 900);
      await zeige(p, 'todos'); await p.waitForTimeout(700);
      const z = await p.evaluate(() => { const t = document.querySelector('#todoArea .todo:not(.done)'); return t ? { id: t.dataset.id, ziehbar: t.getAttribute('draggable') } : null; });
      pruefe('offene Aufgaben sind am Rechner ziehbar', z && z.ziehbar === 'true', JSON.stringify(z));
      await p.evaluate(() => { window.__schreib = window.__schreib || []; });
      const v0 = await p.evaluate(() => window.__schreib.length);
      await p.dragAndDrop('#todoArea .todo[data-id="' + z.id + '"] .t-title', '#formiKugel');
      await p.waitForTimeout(400);
      const m = await p.evaluate(() => [...document.querySelectorAll('#formiRing .frm-knopf')].map(x => x.textContent));
      pruefe(`fallen gelassen: ${m.join(' / ')}`, m.join('|') === 'Abhaken|Erinnere mich daran|Frag Formi dazu', JSON.stringify(m));
      await p.waitForTimeout(400); await p.click('#formiRing .frm-knopf'); await p.waitForTimeout(700);
      const s = await p.evaluate((n) => ({ w: (window.__schreib || []).slice(n), insel: window.__formiLebt.insel() }), v0);
      const w1 = s.w.find(x => /todos\//.test(x.pfad) && x.daten && x.daten.done === true);
      pruefe('„Abhaken" schreibt done mit Formi-Spur (formiAt)', !!w1 && !!w1.daten.formiAt, JSON.stringify(s.w).slice(0, 300));
      pruefe('… und die Insel zeigt „Abgehakt"', s.insel.stand === 'gross' && /^Abgehakt/.test(s.insel.was), JSON.stringify(s.insel));
      /* Gegenprobe: vom Griff aus wird sortiert, nicht gezogen */
      await p.waitForTimeout(3500);
      const griff = await p.$('#todoArea .todo:not(.done) [data-griff]');
      if (griff) {
        await p.dragAndDrop('#todoArea .todo:not(.done) [data-griff]', '#formiKugel'); await p.waitForTimeout(300);
        pruefe('GEGENPROBE: vom Griff aus fällt nichts auf Formi', await p.evaluate(() => !document.getElementById('formiRing')));
      }
      pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }

    console.log('\n── 6 Morgens kommt der Tag aus dem Loch ──');
    {
      const p = await oeffne(b, 1440, 900);
      const r = await p.evaluate(async () => { window.__formiLebt.morgen(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const z = [...document.querySelectorAll('#heuteListe .heute-liste > .heute-zeile, #heuteListe .heute-liste > .hz-mit-haken')].slice(0, 3);
        return { n: z.filter(x => x.getAnimations().length).length, eig: [...new Set(z.flatMap(x => x.getAnimations().flatMap(a => a.effect.getKeyframes().flatMap(f => Object.keys(f).filter(k => !['offset', 'easing', 'composite', 'computedOffset'].includes(k))))))], tag: localStorage.getItem('kf_formi_morgen') }; });
      pruefe(`erster Blick heute: ${r.n} Zeilen kommen aus Formi (nur transform/opacity), gemerkt`, r.n >= 1 && r.eig.every(e => e === 'transform' || e === 'opacity') && !!r.tag, JSON.stringify(r));
      await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => !!document.querySelector('#app.show')); await p.waitForTimeout(900);
      const r2 = await p.evaluate(() => [...document.querySelectorAll('#heuteListe .heute-liste > .heute-zeile, #heuteListe .heute-liste > .hz-mit-haken')].slice(0, 3).filter(x => x.getAnimations().some(a => /translate/.test(JSON.stringify(a.effect.getKeyframes())))).length);
      pruefe('GEGENPROBE: beim zweiten Blick am selben Tag nicht noch einmal', r2 === 0, String(r2));
      await p._ctx.close();
    }

    console.log('\n── 8 Laufendes in der Insel ──');
    for (const [w, h, dauerhaft] of [[1440, 900, true], [390, 844, false]]) {
      const p = await oeffne(b, w, h);
      await p.evaluate(() => window.__formiLebt.laufend('Im Dienst seit 06:58')); await p.waitForTimeout(800);
      const a = await p.evaluate(() => window.__formiLebt.insel());
      pruefe(`${w} px: „Im Dienst seit 06:58" steht in der Insel`, !a.hidden && a.klein === 'Im Dienst seit 06:58' && /laufend/.test(a.klasse), JSON.stringify(a));
      await p.waitForTimeout(5200);
      const c = await p.evaluate(() => window.__formiLebt.insel());
      pruefe(`${w} px: nach 6 s ${dauerhaft ? 'steht sie noch (Kopfleiste)' : 'ist sie weg (am Handy nur kurz)'}`, dauerhaft ? !c.hidden && c.stand === 'laufend' : c.hidden, JSON.stringify(c));
      await p.evaluate(() => window.__formiLebt.laufend('')); await p.waitForTimeout(500);
      pruefe(`${w} px: ausgestempelt → weg`, await p.evaluate(() => window.__formiLebt.insel().hidden));
      await p._ctx.close();
    }

    console.log('\n── 18 Erste Woche mit Formi ──');
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      const p = await oeffne(b, w, h);
      pruefe(`${w} px: altes Konto ohne createdAt sieht nichts`, await p.evaluate(() => !document.querySelector('.formi-woche')));
      await p.evaluate(() => window.__formiLebt.neuImTeam(Date.now() - 86400000 * 1.2)); await p.waitForTimeout(400);
      const r = await p.evaluate((TR) => { const z = document.querySelector('.formi-woche'); const k = z && z.querySelector('[data-fwstart]'), s = z && z.querySelector('[data-fwspaeter]');
        return z ? { text: z.textContent, k: (eval(TR))(k), s: (eval(TR))(s) } : null; }, TREFFER.toString());
      pruefe(`${w} px: Tag 2 von 5 mit „Zeig’s mir" ${r && r.k.w}×${r && r.k.h} und „Später" ${r && r.s.w}×${r && r.s.h}`, r && /Tag 2 von 5/.test(r.text) && r.k.w >= 44 && r.k.h >= 44 && r.s.w >= 44 && r.s.h >= 44 && r.k.imBild, JSON.stringify(r));
      await p.click('[data-fwstart]'); await p.waitForTimeout(900);
      const st = await p.evaluate(() => ({ karte: !!document.querySelector('.fw-karte') && document.querySelector('.fw-karte').getClientRects().length > 0, weg: !document.querySelector('.formi-woche') || !document.querySelector('.formi-woche').getClientRects().length }));
      pruefe(`${w} px: „Zeig’s mir" startet den Rundgang`, st.karte, JSON.stringify(st));
      pruefe(`${w} px: ohne Skriptfehler`, !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
  } finally { await b.close(); }
  console.log(`\n${schlecht ? '✗' : '✓'} Formi als Werkzeug: ${schlecht ? schlecht + ' von ' + (gut + schlecht) + ' falsch' : 'alle ' + gut + ' Zusicherungen erfüllt'}`);
  process.exit(schlecht ? 1 : 0);
})();
