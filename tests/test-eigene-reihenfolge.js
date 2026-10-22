/* ══ EIGENE REIHENFOLGE IN AUFGABEN UND PUTZPLAN (Runde 148) ═════════════
   Aus dem Betrieb, 15.10.2026: „kannst du noch dafür sorgen das man
   aufgaben und aufgaben im putzplan selber sortieren kann auch als
   mitarbeiter das es einfach für einen selber übersichtlicher ist, es
   reichen drei striche an der seite mit denen man die aufgaben dann hin
   und her bewegen kann".

   Was dieser Durchlauf festhält:
     1. An jeder OFFENEN Zeile steht links ein Griff (drei Striche) — in
        Aufgaben und Putzplan, für Leitung UND Mitarbeiter. An erledigten
        nicht. GEGENPROBE: in „Nach Name" gibt es keinen Griff.
     2. Ziehen mit der Maus verschiebt die Zeile innerhalb ihrer Gruppe;
        die neue Reihenfolge steht nach dem Neuzeichnen noch da.
     3. Gespeichert wird NUR im eigenen Bereich (privat/<uid>), nicht an
        der Aufgabe: kein Schreiben in todos/ oder cleaning/. Ziehen hakt
        nichts ab.
     4. Sie übersteht das Neuladen (Gerät) — und das Konto gilt, wenn es
        neuer ist (anderes Gerät).
     5. Tastatur: ↑/↓ am Griff verschiebt um eine Zeile, der Fokus bleibt
        am selben Griff.
     6. Eine neue Aufgabe ohne Platz steht in ihrer Gruppe OBEN.
     7. „Eigene Reihenfolge zurücksetzen" ist nur da, wenn es eine gibt,
        und stellt die übliche Ordnung wieder her.
     8. Griff und Haken treffen beide ≥ 44 × 44 (elementFromPoint) bei
        320 / 390 / 430 / 820 / 1280 / 1440 / 1920 px, normal und
        kompakt — der Griff darf dem Haken die Fläche nicht wegnehmen.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
const TREFFER_SRC = `(el) => {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0 };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--;
  while (u < innerHeight && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--;
  while (re < innerWidth && trifft(re + 1, cy)) re++;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1) };
}`;
/* Vier offene Aufgaben ohne Frist (eine Gruppe „Ohne Frist") und eine
   erledigte, in Hürth. */
const TODOS = `window.__todos = { 'studio-6': [
  { id: 'r1', title: 'Eins',  done: false, ts: 1 },
  { id: 'r2', title: 'Zwei',  done: false, ts: 2 },
  { id: 'r3', title: 'Drei',  done: false, ts: 3 },
  { id: 'r4', title: 'Vier',  done: false, ts: 4 },
  { id: 'rx', title: 'Erledigt', done: true, ts: 5, doneBy: 'Ben', doneByUid: 'u3', doneAt: Date.now() - 60000 }
] };`;

async function oeffnen(b, w, h, stub, vorher) {
  const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  p.on('dialog', d => d.accept());
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await p.addInitScript(TODOS);
  if (vorher) await p.addInitScript(vorher);
  await p.addInitScript({ path: SP + '/' + stub });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2800);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  return p;
}
async function zu(p, sub) {
  await p.evaluate(() => { const g = document.querySelector('.mobnav [data-group="g-arbeit"]'); if (g) g.click(); });
  await p.waitForTimeout(450);
  await p.evaluate((s) => { const x = document.querySelector('[data-subview="' + s + '"]'); if (x) x.click(); }, sub);
  await p.waitForTimeout(700);
}
const IDS = (sel) => [...document.querySelectorAll(sel)].map(z => z.dataset.id);
/* Mit der Maus ziehen: Griff der Zeile von bis zur Mitte der Zielzeile. */
async function ziehe(p, zeileSel, zielSel) {
  const a = await p.evaluate((s) => { const g = document.querySelector(s + ' [data-griff]'); g.scrollIntoView({ block: 'center' });
    const r = g.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, zeileSel);
  const z = await p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { y: r.top + r.height / 2 + 4 }; }, zielSel);
  await p.mouse.move(a.x, a.y);
  await p.mouse.down();
  for (let i = 1; i <= 8; i++) { await p.mouse.move(a.x, a.y + (z.y - a.y) * i / 8); await p.waitForTimeout(30); }
  await p.mouse.up();
  await p.waitForTimeout(400);
}
const privatSchreib = () => (window.__schreib || []).filter(x => /privat\//.test(x.pfad)).map(x => x.daten);
const fremdSchreib = () => (window.__schreib || []).filter(x => /\/(todos|cleaning)\//.test(x.pfad));

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    for (const [rolle, stub] of [['Leitung', 'stub-chef.js'], ['Mitarbeiter', 'stub-mitarbeiter.js']]) {
      console.log('\n── ' + rolle + ': Aufgaben ──');
      let p = await oeffnen(b, 1440, 900, stub);
      await zu(p, 'todos');
      if (rolle === 'Leitung') { await p.selectOption('#todoStudioWahl', 'studio-6'); await p.waitForTimeout(400); }
      const Z = '#todoArea .todo';
      const g1 = await p.evaluate((Z) => ({
        offen: document.querySelectorAll(Z + ':not(.done)').length,
        griffOffen: document.querySelectorAll(Z + ':not(.done) [data-griff]').length,
        griffErledigt: document.querySelectorAll(Z + '.done [data-griff]').length,
        ids: [...document.querySelectorAll(Z)].map(z => z.dataset.id)
      }), Z);
      pruefe('jede offene Aufgabe hat einen Griff, keine erledigte', g1.offen > 0 && g1.griffOffen === g1.offen && g1.griffErledigt === 0, JSON.stringify(g1));
      pruefe('der Griff besteht aus drei Strichen', await p.evaluate((Z) => {
        const s = document.querySelector(Z + ' [data-griff] svg path'); return !!s && (s.getAttribute('d').match(/M/g) || []).length === 3; }, Z));
      pruefe('Ausgangsreihenfolge: Eins, Zwei, Drei, Vier, dann die erledigte', g1.ids.join() === 'r1,r2,r3,r4,rx', g1.ids.join());

      await p.evaluate(() => { window.__schreib = []; });
      await ziehe(p, Z + '[data-id="r1"]', Z + '[data-id="r3"]');
      const nach = await p.evaluate(IDS, Z);
      pruefe('Ziehen: „Eins" steht jetzt hinter „Drei"', nach.join() === 'r2,r3,r1,r4,rx', nach.join());
      await p.waitForTimeout(900);
      const ps = await p.evaluate(privatSchreib);
      pruefe('gespeichert im EIGENEN Bereich (privat/<uid>, reiheAufgaben)', ps.length >= 1 &&
        JSON.stringify(ps[ps.length - 1].reiheAufgaben.slice(-4)) === JSON.stringify(['studio-6/r2', 'studio-6/r3', 'studio-6/r1', 'studio-6/r4']),
        JSON.stringify(ps));
      const fs = await p.evaluate(fremdSchreib);
      pruefe('… und NICHTS an der Aufgabe selbst (kein todos/-Schreiben, nichts abgehakt)', fs.length === 0, JSON.stringify(fs));

      /* Tastatur */
      await p.evaluate((Z) => document.querySelector(Z + '[data-id="r4"] [data-griff]').focus(), Z);
      await p.keyboard.press('ArrowUp'); await p.waitForTimeout(300);
      const tast = await p.evaluate((Z) => ({ ids: [...document.querySelectorAll(Z)].map(z => z.dataset.id),
        fokus: (document.activeElement.closest('.todo') || {}).dataset }), Z);
      pruefe('↑ am Griff: „Vier" eine Zeile höher', tast.ids.join() === 'r2,r3,r4,r1,rx', tast.ids.join());
      pruefe('… und der Fokus bleibt am Griff derselben Aufgabe', tast.fokus && tast.fokus.id === 'r4', JSON.stringify(tast.fokus));

      /* Neue Aufgabe: oben in der Gruppe */
      await p.evaluate(() => window.__nachschub('studios/studio-6/todos', window.__todos['studio-6'].concat([{ id: 'rn', title: 'Neu', done: false, ts: 9 }])));
      await p.waitForTimeout(500);
      const neu = await p.evaluate(IDS, Z);
      pruefe('eine neue Aufgabe steht in ihrer Gruppe oben', neu[0] === 'rn' && neu.slice(1).join() === 'r2,r3,r4,r1,rx', neu.join());

      /* Gegenprobe Sortierung */
      await p.click('#tdFilterKnopf'); await p.waitForTimeout(150);
      const wegKnopf = await p.evaluate(() => !document.getElementById('tdReiheWeg').hidden);
      pruefe('„Eigene Reihenfolge zurücksetzen" ist da, weil es eine gibt', wegKnopf);
      await p.selectOption('#todoSort', 'name'); await p.waitForTimeout(350);
      const nameG = await p.evaluate((Z) => ({ griffe: document.querySelectorAll(Z + ' [data-griff]').length,
        weg: document.getElementById('tdReiheWeg').hidden }), Z);
      pruefe('GEGENPROBE „Nach Name": kein Griff, kein Zurücksetzen', nameG.griffe === 0 && nameG.weg, JSON.stringify(nameG));
      await p.selectOption('#todoSort', 'standard'); await p.waitForTimeout(350);

      /* Neuladen: vom Gerät. DIESELBE Seite — browser.newPage({ serviceWorkers: 'block' }) wäre ein
         frischer Kontext mit leerem Speicher, also ein anderes Gerät. */
      await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2800);
      await zu(p, 'todos');
      if (rolle === 'Leitung') { await p.selectOption('#todoStudioWahl', 'studio-6'); await p.waitForTimeout(400); }
      const nachLaden = await p.evaluate(IDS, Z);
      pruefe('nach dem Neuladen steht die eigene Reihenfolge noch da', nachLaden.join() === 'r2,r3,r4,r1,rx', nachLaden.join());

      /* Zurücksetzen */
      await p.click('#tdFilterKnopf'); await p.waitForTimeout(150);
      await p.click('#tdReiheWeg'); await p.waitForTimeout(400);
      const zurueck = await p.evaluate((Z) => ({ ids: [...document.querySelectorAll(Z)].map(z => z.dataset.id),
        weg: document.getElementById('tdReiheWeg').hidden }), Z);
      pruefe('„Zurücksetzen" stellt die übliche Ordnung her und verschwindet', zurueck.ids.join() === 'r1,r2,r3,r4,rx' && zurueck.weg, JSON.stringify(zurueck));
      pruefe('keine Seitenfehler (' + rolle + ', Aufgaben)', !p._fehler.length, p._fehler.join(' | '));
      await p.close();

      /* ── Putzplan ── */
      console.log('\n── ' + rolle + ': Putzplan ──');
      p = await oeffnen(b, 1440, 900, stub);
      await zu(p, 'putzplan');
      await p.selectOption('#ppStudio', 'studio-6'); await p.waitForTimeout(500);
      /* Die Attrappe hat je Gruppe nur einen offenen Punkt — zum
         Verschieben braucht es zwei. Drei tägliche dazu. */
      const bedient = await p.evaluate(() => window.__nachschub('studios/studio-6/cleaning', [
        { id: 'p1', title: 'Theke', recurring: 'daily', done: false, ts: 1 },
        { id: 'p2', title: 'Spiegel', recurring: 'daily', done: false, ts: 2 },
        { id: 'p3', title: 'Boden', recurring: 'daily', done: false, ts: 3 }]));
      await p.waitForTimeout(500);
      pruefe('Putzplan: Daten nachgeliefert (' + bedient + ' Zuhörer)', bedient > 0);
      /* Eine Gruppe mit mindestens zwei offenen Punkten suchen. */
      const gruppe = await p.evaluate(() => {
        for (const s of document.querySelectorAll('#ppList .pp-gruppe')) {
          const o = [...s.querySelectorAll('.pp-item:not(.done)')].filter(z => z.querySelector('[data-griff]'));
          if (o.length >= 2) return { g: s.dataset.ppgruppe, ids: o.map(z => z.dataset.id) };
        }
        return null;
      });
      pruefe('Putzplan: Griffe an den offenen Punkten', !!gruppe, JSON.stringify(gruppe));
      pruefe('Putzplan: keine Griffe an erledigten', await p.evaluate(() => !document.querySelector('#ppList .pp-item.done [data-griff]')));
      if (gruppe) {
        await p.evaluate(() => { window.__schreib = []; });
        const G = '#ppList [data-ppgruppe="' + gruppe.g + '"] .pp-item';
        await ziehe(p, G + '[data-id="' + gruppe.ids[0] + '"]', G + '[data-id="' + gruppe.ids[1] + '"]');
        const pn = await p.evaluate((G) => [...document.querySelectorAll(G + ':not(.done)')].map(z => z.dataset.id), G);
        pruefe('Putzplan: Ziehen vertauscht die ersten beiden der Gruppe', pn[0] === gruppe.ids[1] && pn[1] === gruppe.ids[0], pn.join() + ' / ' + gruppe.ids.join());
        await p.waitForTimeout(900);
        const pp = await p.evaluate(privatSchreib);
        /* Gespeichert wird die GANZE Gruppe in ihrer neuen Ordnung. */
        const soll = [gruppe.ids[1], gruppe.ids[0]].concat(gruppe.ids.slice(2)).map(i => 'studio-6/' + i);
        pruefe('Putzplan: gespeichert unter reihePutz im eigenen Bereich', pp.length >= 1 && Array.isArray(pp[pp.length - 1].reihePutz) &&
          pp[pp.length - 1].reihePutz.slice(-soll.length).join() === soll.join(), JSON.stringify(pp) + ' / ' + soll.join());
        pruefe('Putzplan: nichts an den Putzpunkten geschrieben', (await p.evaluate(fremdSchreib)).length === 0);
      }
      pruefe('keine Seitenfehler (' + rolle + ', Putzplan)', !p._fehler.length, p._fehler.join(' | '));
      await p.close();
    }

    /* ── Am Handy mit dem FINGER ──
       Der Hauptweg im Studio. Echte Berührungen über das Chrome-Protokoll
       (nicht die Maus): der Finger zieht am Griff nach unten UND ein
       Stück nach rechts — nach rechts wischen hakt sonst ab. Erwartet:
       verschoben, nichts abgehakt, die Seite nicht gerollt. */
    console.log('\n── Handy: mit dem Finger ──');
    {
      const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
      const p = await ctx.newPage();
      p._fehler = [];
      p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
      await p.route('**://www.gstatic.com/**', r => r.abort());
      await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
      await p.addInitScript(TODOS);
      await p.addInitScript({ path: SP + '/stub-mitarbeiter.js' });
      await p.goto(APP, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(2800);
      await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
      await zu(p, 'todos');
      const Z = '#todoArea .todo';
      const a = await p.evaluate((Z) => { const g = document.querySelector(Z + '[data-id="r1"] [data-griff]'); g.scrollIntoView({ block: 'center' });
        const r = g.getBoundingClientRect(); const t = document.querySelector(Z + '[data-id="r3"]').getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, zy: t.top + t.height / 2 + 4,
          scroll: document.querySelector('#view-todos .scroll-area').scrollTop }; }, Z);
      await p.evaluate(() => { window.__schreib = []; });
      const cdp = await ctx.newCDPSession(p);
      const tp = (x, y) => [{ x: Math.round(x), y: Math.round(y), id: 1 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(a.x, a.y) });
      for (let i = 1; i <= 10; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(a.x + i * 12, a.y + (a.zy - a.y) * i / 10) });
        await p.waitForTimeout(30);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await p.waitForTimeout(600);
      const r = await p.evaluate((Z) => ({ ids: [...document.querySelectorAll(Z)].map(z => z.dataset.id),
        done: (window.__schreib || []).filter(x => /\/todos\//.test(x.pfad)).length,
        scroll: document.querySelector('#view-todos .scroll-area').scrollTop }), Z);
      pruefe('Finger: „Eins" hinter „Drei" verschoben', r.ids.join() === 'r2,r3,r1,r4,rx', r.ids.join());
      pruefe('Finger: dabei nichts abgehakt (Wischen springt am Griff nicht an)', r.done === 0, String(r.done));
      pruefe('Finger: die Seite ist dabei nicht weggerollt', Math.abs(r.scroll - a.scroll) < 60, a.scroll + ' → ' + r.scroll);
      /* Der eigentliche Fall fürs Wischen: am Griff fast nur nach RECHTS
         (130 px, 6 px nach unten). Ohne Schutz am Griff entscheidet sich
         das Wischen für „seitlich" und hakt bei > 80 px ab — die
         Gegenprobe hat gezeigt, dass der erste Zug oben das nicht prüft
         (er ging überwiegend nach unten, das Wischen hielt ihn für
         Rollen). */
      const c = await p.evaluate((Z) => { const g = document.querySelector(Z + '[data-id="r4"] [data-griff]'); g.scrollIntoView({ block: 'center' });
        const r = g.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, Z);
      await p.evaluate(() => { window.__schreib = []; });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(c.x, c.y) });
      for (let i = 1; i <= 10; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(c.x + i * 13, c.y + i * 0.6) });
        await p.waitForTimeout(30);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await p.waitForTimeout(600);
      const quer = await p.evaluate(() => (window.__schreib || []).filter(x => /\/todos\//.test(x.pfad)).map(x => x.daten));
      pruefe('Finger am Griff nach rechts: hakt NICHT ab', quer.length === 0, JSON.stringify(quer));
      pruefe('keine Seitenfehler (Finger)', !p._fehler.length, p._fehler.join(' | '));
      await ctx.close();
    }

    /* ── Anderes Gerät: das Konto ist neuer ── */
    console.log('\n── Konto vor Gerät ──');
    {
      const p = await oeffnen(b, 1440, 900, 'stub-mitarbeiter.js',
        `window.__privatDoc = { reiheTs: Date.now(), reiheAufgaben: ['studio-6/r4', 'studio-6/r3', 'studio-6/r2', 'studio-6/r1'], reihePutz: [] };`);
      await zu(p, 'todos');
      const ids = await p.evaluate(IDS, '#todoArea .todo');
      pruefe('auf einem neuen Gerät gilt die Reihenfolge aus dem Konto', ids.join() === 'r4,r3,r2,r1,rx', ids.join());
      await p.close();
    }

    /* ── Trefferflächen ── */
    console.log('\n── Trefferflächen ──');
    const zuKlein = [], quer = [];
    for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      const p = await oeffnen(b, w, h, 'stub-chef.js');
      for (const [sub, sel] of [['todos', '#todoArea .todo'], ['putzplan', '#ppList .pp-item']]) {
        await zu(p, sub);
        if (sub === 'todos') { await p.selectOption('#todoStudioWahl', 'studio-6'); await p.waitForTimeout(300); }
        else { await p.selectOption('#ppStudio', 'studio-6'); await p.waitForTimeout(400); }
        for (const dichte of ['normal', 'kompakt']) {
          await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
          await p.waitForTimeout(120);
          const m = await p.evaluate(([SRC, sel]) => {
            const T = eval(SRC), aus = [];
            const els = [...document.querySelectorAll(sel + ' [data-griff], ' + sel + ' .check')].filter(e => e.getClientRects().length).slice(0, 8);
            for (const e of els) {
              e.scrollIntoView({ block: 'center' });
              const t = T(e);
              if (t.w < 44 || t.h < 44) aus.push((e.dataset.griff ? 'Griff' : 'Haken') + ' ' + t.w + '×' + t.h);
            }
            return { aus, n: els.length, sw: document.documentElement.scrollWidth, iw: innerWidth };
          }, [TREFFER_SRC, sel]);
          if (m.n < 2) zuKlein.push(w + '/' + sub + ': nichts gemessen');
          m.aus.forEach(x => zuKlein.push(w + '/' + dichte + '/' + sub + ' ' + x));
          if (m.sw > m.iw) quer.push(w + '/' + sub + ' ' + m.sw);
        }
      }
      await p.close();
    }
    pruefe('Griff und Haken ≥ 44 × 44 bei 320–1920 px, normal und kompakt, in Aufgaben und Putzplan', !zuKlein.length, zuKlein.slice(0, 10).join(', '));
    pruefe('kein waagerechtes Scrollen', !quer.length, quer.join(', '));
  } finally {
    await b.close();
  }
  console.log('\n' + (schlecht ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung' : '✓ Eigene Reihenfolge — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
