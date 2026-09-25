/* ══════════════════════════════════════════════════════════════════════
   LADEFEHLER DORT, WO DIE LISTE WÄRE (Design-Ideen, Punkt 16)

   Aus dem Betrieb, 25.9.2026: „mach weiter mit design sachen" — und
   CLAUDE.md: „was fehlt, wird benannt".

   Vorher schrieben die Beobachter ihren Fehler nur in die Konsole. Die
   Liste blieb leer, und darunter stand „Noch keine Aufgaben" — eine
   falsche Auskunft. Geprüft wird mit dem Demo-Schalter DEMO_LADEFEHLER:

   1. Aufgaben, EIN Studio scheitert (Studioleitung mit zwei Studios):
      die Meldung nennt das Studio, den Grund und sagt, dass die aus dem
      anderen Studio darunter stehen. Die Aufgaben des anderen Studios
      SIND da.
   2. „Nochmal versuchen": ist der Fehler behoben, verschwindet die
      Meldung und die Aufgaben kommen.
   3. ALLE Aufgaben scheitern: kein leerer Zustand („Noch keine
      Aufgaben") unter der Meldung.
   4. Startseite: fehlen Aufgaben, Putzplan und Ankündigungen, steht dort
      nicht „Alles erledigt", sondern „Nicht alles geladen".
   5. Chat und Team (nur Schichten scheitern — „Was darunter steht, hat
      geladen").
   6. GEGENPROBE: ohne Fehler keine Meldung, und „Alles erledigt" bleibt
      möglich.
   7. Der Knopf trifft ≥ 44 × 44 (Hit-Test, normal und kompakt) bei
      320 / 390 / 430 / 820 / 1280 / 1440 / 1920; nichts ragt hinaus.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
const TREFFER = (el) => {
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
};
const GRUPPE = { todos: 'g-arbeit', putzplan: 'g-arbeit', team: 'g-team', chat: 'g-chat' };
async function oeffne(b, w, h, rolle, fehler) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((f) => {
    localStorage.setItem('kf_tour', '99:demo-ich');
    window.DEMO_LADEFEHLER = f || {};
  }, fehler);
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
/* Über „Alles": dort steht jedes Ziel als [data-alles], auch wenn die
   Seite gerade nicht offen ist. Die Startseite über ihren Reiter. */
async function zu(p, v) {
  if (v !== 'home') {
    await p.evaluate(() => { const a = document.querySelector('#side [data-group="g-alles"], .mobnav [data-group="g-alles"]'); if (a) a.click(); });
    await p.waitForTimeout(500);
  }
  const ok = await p.evaluate((v) => {
    const k = v === 'home'
      ? document.querySelector('.mobnav [data-group="g-start"], #side [data-group="g-start"]')
      : document.querySelector('#allesLadeInhalt [data-alles="' + v + '"], #allesSeite [data-alles="' + v + '"]');
    if (k) k.click();
    return !!k;
  }, v);
  if (!ok) throw new Error('kein Weg zu ' + v);
  await p.waitForTimeout(900);
}
const meldung = (p, id) => p.evaluate((id) => {
  const e = document.getElementById(id);
  if (!e || !e.offsetParent) return null;
  const k = e.querySelector('.lf-nochmal');
  return { text: e.textContent.replace(/\s+/g, ' ').trim(), knopf: !!k && !!k.offsetParent };
}, id);

async function knopfMessen(p, sel) {
  const aus = [];
  for (const dichte of ['normal', 'kompakt']) {
    await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
    const m = await p.evaluate(async ({ SRC, sel }) => {
      const T = eval('(' + SRC + ')');
      const el = document.querySelector(sel);
      if (!el || !el.offsetParent) return null;
      el.scrollIntoView({ block: 'center' });
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const r = el.getBoundingClientRect();
      return Object.assign(T(el), { rechts: Math.round(r.right), quer: document.documentElement.scrollWidth - innerWidth });
    }, { SRC: TREFFER.toString(), sel });
    aus.push(m);
  }
  await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
  return aus;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1–3 Aufgaben (Studioleitung, zwei Studios) ──');
  {
    const p = await oeffne(b, 1440, 900, 'leiter', { 'studio-6/todos': 'permission-denied' });
    await zu(p, 'todos');
    const m = await meldung(p, 'lf-todos');
    pruefe('die Meldung steht in der Aufgabenliste', !!m, JSON.stringify(m));
    pruefe('sie nennt das Studio und den Grund', !!m && /Die Aufgaben aus .+ liessen sich gerade nicht laden/.test(m.text) && /Berechtigung/.test(m.text), m && m.text);
    pruefe('und sagt, was trotzdem da ist', !!m && /anderen Studios stehen unten/.test(m.text), m && m.text);
    const da = await p.evaluate(() => ({ zeilen: document.querySelectorAll('#todoArea .todo').length }));
    pruefe('die Aufgaben aus dem anderen Studio SIND da (' + da.zeilen + ' Zeilen)', da.zeilen > 0, JSON.stringify(da));

    await p.evaluate(() => { window.DEMO_LADEFEHLER = {}; document.querySelector('#lf-todos .lf-nochmal').click(); });
    await p.waitForTimeout(700);
    const nach = await p.evaluate(() => ({ weg: !document.getElementById('lf-todos'), zeilen: document.querySelectorAll('#todoArea .todo').length }));
    pruefe('„Nochmal versuchen": die Meldung ist weg, es sind mehr Aufgaben da (' + da.zeilen + ' → ' + nach.zeilen + ')', nach.weg && nach.zeilen > da.zeilen, JSON.stringify(nach));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  {
    const p = await oeffne(b, 1440, 900, 'mitarbeiter', { '/todos': 'unavailable', '/cleaning': 'unavailable', 'announcements': 'unavailable' });
    await zu(p, 'todos');
    const m = await meldung(p, 'lf-todos');
    const leer = await p.evaluate(() => [...document.querySelectorAll('#view-todos .empty')].filter(e => e.offsetParent).length);
    pruefe('alle Aufgaben fehlen: Meldung ohne „Noch keine Aufgaben" darunter', !!m && leer === 0, JSON.stringify({ m, leer }));
    const klasse = await p.evaluate(() => document.getElementById('view-todos').classList.contains('lade-kaputt'));
    pruefe('(die Ansicht trägt lade-kaputt)', klasse);

    await zu(p, 'home');
    const home = await p.evaluate(() => {
      const t = [...document.querySelectorAll('.home-ruhe, .heute-ruhe')].filter(e => e.offsetParent).map(e => e.innerText).join(' | ');
      return { erledigt: /Alles erledigt/.test(t), nichtAlles: /Nicht alles geladen/i.test(t), alle: t, text: (document.querySelector('.lade-ruhe') || {}).innerText || '' };
    });
    pruefe('Startseite: nicht „Alles erledigt", sondern „Nicht alles geladen"', !home.erledigt && home.nichtAlles, JSON.stringify(home));
    pruefe('… und sie nennt, was fehlt', /Aufgaben/.test(home.text) && /Putzplan/.test(home.text), home.text);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 5 Chat und Team ──');
  {
    const p = await oeffne(b, 1440, 900, 'leiter', { '/messages': 'permission-denied', '/shifts': 'failed-precondition' });
    await zu(p, 'chat');
    let m = await meldung(p, 'lf-chat');
    pruefe('Chat: „Die Nachrichten in diesem Kanal liessen sich gerade nicht laden."', !!m && /Nachrichten in diesem Kanal liessen/.test(m.text), m && m.text);
    await zu(p, 'team');
    m = await meldung(p, 'lf-team');
    pruefe('Team: nur „Schichten" fehlen, der Rest hat geladen', !!m && /^Schichten liessen/.test(m.text) && /Was darunter steht, hat geladen/.test(m.text), m && m.text);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 6 GEGENPROBE ohne Fehler ──');
  {
    const p = await oeffne(b, 1440, 900, 'leiter');
    const ansichten = ['home', 'todos', 'chat', 'team', 'putzplan', 'material', 'geraete', 'probe', 'ann'];
    const gefunden = [];
    for (const v of ansichten) {
      await zu(p, v);
      const n = await p.evaluate(() => document.querySelectorAll('.lade-fehler, .lade-ruhe, .view.lade-kaputt').length);
      if (n) gefunden.push(v + ':' + n);
    }
    pruefe('ohne Fehler steht nirgends eine Meldung', !gefunden.length, gefunden.join(', '));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 7 Knopf und Breite, sieben Breiten ──');
  for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h, 'leiter', { 'studio-6/todos': 'permission-denied', '/shifts': 'unavailable' });
    for (const [v, id] of [['todos', 'lf-todos'], ['team', 'lf-team']]) {
      await zu(p, v);
      const [n, k] = await knopfMessen(p, '#' + id + ' .lf-nochmal');
      pruefe(w + ' px, ' + v + ': „Nochmal versuchen" trifft ' + (n ? n.w + '×' + n.h : '–') + ' / kompakt ' + (k ? k.w + '×' + k.h : '–'),
        !!n && !!k && n.w >= 44 && n.h >= 44 && k.w >= 44 && k.h >= 44 && n.rechts <= w && n.quer <= 0, JSON.stringify({ n, k }));
    }
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Ladefehler: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Ladefehler: stehen dort, wo die Liste wäre, mit „Nochmal versuchen" — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
