/* ══════════════════════════════════════════════════════════════════════
   HEUTE IM STUDIO — DAS TAGESBAND, und ABHAKEN MIT GEWICHT (Runde 123)

   Aus dem Betrieb, 25.9.2026: „beim Design kannst du auch ruhig
   kreativer werden". Seit dem 24.9.: „genau so viel Fokus auf die
   PC-Nutzung wie auf die Handy-Nutzung".

   Die Uhr der Seite steht in diesem Durchlauf auf 11:20 (bzw. 23:10),
   damit „jetzt" nicht vom Zeitpunkt des Laufs abhängt.

   1. Am PC (1280/1440/1920) steht unter der linken Spalte „Heute im
      Studio": ein Balken je Schicht, meiner heisst „Du" und steht an
      der richtigen Stelle der Zeitachse; die Linie JETZT bei 11:20.
   2. Ein Klick öffnet den Schichtplan: Team, Reiter Schichten, dieses
      Studio.
   3. Treffer ≥ 44 × 44, im Bild, die Startseite passt weiter auf einen
      Bildschirm — normal und kompakt, hell und dunkel.
   4. „Du" ist lesbar: Text gegen Balken ≥ 4,5 : 1 (volle Flächen, das
      Rechenmodell ist hier genau).
   5. Nicht am Handy (390), nicht beim Chef; um 23:10 keine Linie.
   6. Abhaken mit Gewicht: die frisch abgehakte Zeile sackt kurz ein
      (Animation „sacken" am Inhalt), die übrigen nicht.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
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

async function oeffne(b, w, h, rolle, uhr, theme) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(({ uhr, theme }) => {
    localStorage.setItem('kf_tour', '99:demo-ich');
    if (theme) localStorage.setItem('kf_prefs', JSON.stringify({ theme }));
    const echt = Date; const d0 = new echt(); d0.setHours(uhr[0], uhr[1], 0, 0);
    const off = d0.getTime() - echt.now();
    class F extends echt { constructor(...a) { if (a.length) super(...a); else super(echt.now() + off); } static now() { return echt.now() + off; } }
    window.Date = F;
  }, { uhr, theme });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  return p;
}
const band = (p) => p.evaluate(() => {
  const b = document.querySelector('#heuteListe .tagesband');
  if (!b) return null;
  const fl = b.querySelector('.tb-flaeche').getBoundingClientRect();
  const achse = [...b.querySelectorAll('.tb-achse span')].map(s => +s.textContent);
  const du = b.querySelector('.tb-schicht.ich');
  const j = b.querySelector('.tb-jetzt');
  const lage = (el) => el ? (el.getBoundingClientRect().left - fl.left) / fl.width : null;
  const sa = document.querySelector('#view-home .scroll-area');
  return {
    balken: b.querySelectorAll('.tb-schicht').length,
    du: du ? du.textContent : null, duLinks: lage(du),
    duBreite: du ? du.getBoundingClientRect().width / fl.width : null,
    jetzt: j ? lage(j) : null,
    achse, satz: (b.querySelector('.tb-satz') || {}).textContent || '',
    kopf: (b.closest('.heute-block').querySelector('.hk-wort') || {}).textContent || '',
    ueber: sa.scrollHeight - sa.clientHeight,
  };
});
/* Relative Leuchtdichte / Kontrast aus berechneten Farben. */
const KONTRAST = (el) => {
  const rgb = (c) => (c.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const cs = getComputedStyle(el);
  const a = lum(rgb(cs.color)), b = lum(rgb(cs.backgroundColor));
  return +((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2);
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1./2. Am PC, 11:20 ──');
  {
    const p = await oeffne(b, 1440, 900, 'mitarbeiter', [11, 20], 'dark');
    const r = await band(p);
    pruefe('„Heute im Studio" steht da, mit Balken', r && r.balken >= 2 && /Heute im Studio/.test(r.kopf), JSON.stringify(r));
    if (r) {
      const von = r.achse[0], bis = r.achse[r.achse.length - 1];
      /* Meine Demo-Schicht ist 09:00–14:00. */
      const sollL = (9 - von) / (bis - von), sollB = 5 / (bis - von);
      pruefe('„Du" steht bei 9 Uhr und reicht bis 14 Uhr', /^Du/.test(r.du) && Math.abs(r.duLinks - sollL) < 0.01 && Math.abs(r.duBreite - sollB) < 0.01,
        JSON.stringify({ du: r.du, links: r.duLinks, soll: sollL, breite: r.duBreite, sollB }));
      const sollJ = (11 + 20 / 60 - von) / (bis - von);
      pruefe('die Linie JETZT steht bei 11:20', r.jetzt !== null && Math.abs(r.jetzt - sollJ) < 0.01, r.jetzt + ' soll ' + sollJ);
      pruefe('der Satz darunter sagt, wer gerade da ist', /^Gerade/.test(r.satz), r.satz);
      pruefe('die Startseite passt weiter auf einen Bildschirm', r.ueber <= 2, String(r.ueber));
    }
    await p.evaluate(() => document.querySelector('#heuteListe .tagesband').click());
    await p.waitForTimeout(800);
    const z = await p.evaluate(() => ({
      view: (document.querySelector('.view.show') || {}).id,
      reiter: (document.querySelector('[data-teamtab].on, [data-teamtab].active, [data-teamtab][aria-selected="true"]') || {}).textContent || '',
      studio: (document.getElementById('teamStudio') || {}).value,
    }));
    pruefe('ein Klick öffnet den Schichtplan im Team, Studio Hürth', z.view === 'view-team' && /Schicht/.test(z.reiter) && z.studio === 'studio-6', JSON.stringify(z));
    pruefe('keine Skriptfehler', p._fehler.length === 0, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 3./4. Treffer, Einpassen, Lesbarkeit ──');
  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
    for (const theme of ['dark', 'light']) {
      const p = await oeffne(b, w, h, 'leiter', [11, 20], theme);
      for (const dichte of ['normal', 'kompakt']) {
        await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
        await p.waitForTimeout(150);
        const m = await p.evaluate(`(() => { const b = document.querySelector('#heuteListe .tagesband');
          const sa = document.querySelector('#view-home .scroll-area');
          if (!b) return { da: false, ueber: sa.scrollHeight - sa.clientHeight, rest: (document.querySelector('.heute-rest') || {}).textContent || '' };
          b.scrollIntoView({ block: 'center' });
          const t = (${TREFFER.toString()})(b); const r = b.getBoundingClientRect();
          const du = [...b.querySelectorAll('.tb-schicht.ich')];
          const k = du.map(x => (${KONTRAST.toString()})(x));
          return { da: true, w: t.w, h: t.h, l: r.left, r: r.right, ueber: sa.scrollHeight - sa.clientHeight, kontrast: k,
            quer: document.documentElement.scrollWidth - innerWidth }; })()`);
        const name = w + ' px ' + theme + ' ' + dichte;
        if (!m.da) {
          /* Passt es nicht, muss es unter „Ausserdem" stehen — nie stumm weg. */
          pruefe(name + ': kein Platz → „Heute im Studio" steht unter „Ausserdem"', /Heute im Studio/.test(m.rest) && m.ueber <= 2, JSON.stringify(m));
          continue;
        }
        pruefe(name + ': Treffer ' + m.w + ' × ' + m.h + ', im Bild, passt, kein Querscrollen',
          m.w >= 44 && m.h >= 44 && m.l >= 0 && m.r <= w && m.ueber <= 2 && m.quer <= 0, JSON.stringify(m));
        pruefe(name + ': „Du" lesbar (≥ 4,5 : 1)', m.kontrast.length && m.kontrast.every(x => x >= 4.5), JSON.stringify(m.kontrast));
      }
      await p.close();
    }
  }

  console.log('\n── 5. Wo es nicht hingehört ──');
  {
    const p = await oeffne(b, 390, 844, 'mitarbeiter', [11, 20]);
    pruefe('am Handy (390) kein Band — dort zählt jede Zeile', (await band(p)) === null);
    await p.close();
    const c = await oeffne(b, 1440, 900, 'chef', [11, 20]);
    pruefe('beim Chef kein Band (vierzehn Studios wären Striche)', (await band(c)) === null);
    await c.close();
    const n = await oeffne(b, 1440, 900, 'mitarbeiter', [23, 10]);
    const r = await band(n);
    pruefe('um 23:10 steht das Band, aber ohne Linie', r && r.jetzt === null, JSON.stringify(r));
    await n.close();
  }

  console.log('\n── 6. Abhaken mit Gewicht ──');
  {
    const p = await oeffne(b, 1440, 900, 'mitarbeiter', [11, 20]);
    await p.evaluate(() => [...document.querySelectorAll('[data-group="g-arbeit"]')].find(x => x.getClientRects().length).click());
    await p.waitForTimeout(900);
    const r = await p.evaluate(() => new Promise(res => {
      const zeile = [...document.querySelectorAll('#todoArea .todo:not(.done)')][0];
      const id = zeile && zeile.getAttribute('data-id');
      zeile.querySelector('.check').click();
      setTimeout(() => {
        const frisch = document.querySelector('#todoArea .todo.just-done .swipe-body');
        const andere = [...document.querySelectorAll('#todoArea .todo:not(.just-done) .swipe-body')].map(x => getComputedStyle(x).animationName);
        res({ id, frisch: frisch ? getComputedStyle(frisch).animationName : null, andere: andere.filter(x => x === 'sacken').length });
      }, 120);
    }));
    pruefe('die frisch abgehakte Zeile sackt ein („sacken")', r.frisch === 'sacken', JSON.stringify(r));
    pruefe('… und nur sie', r.andere === 0, JSON.stringify(r));
    pruefe('keine Skriptfehler', p._fehler.length === 0, p._fehler.join(' | '));
    await p.close();
  }

  await b.close();
  console.log('\n' + gut + ' bestanden, ' + schlecht + ' gefallen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
