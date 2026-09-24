/* ══════════════════════════════════════════════════════════════════════
   STARTSEITE AM PC: ZWEI SPALTEN (Runde 103, P3)

   Aus dem Betrieb, 24.9.2026: „bitte leg genau so viel Fokus auf die
   PC-Nutzung wie auf die Handy-Nutzung … obwohl das das Hauptgerät ist".

   Vorher gemessen (Demo, Chef, 1440 × 900): EINE Spalte über 1.174 px,
   und drei Kategorien standen nur noch als Knopf unter „Ausserdem"
   (Neu für dich · 2, Zu erledigen, Offen · 32) — während rechts neben
   jeder Zeile 800 px leer blieben.

   Was dieser Durchlauf festhält:
     · ab 1100 px zwei Spalten, oben bündig: links Überfällig / Heute /
       Zum Übernehmen / Offen, rechts Putzplan / Neu für dich / Zu erledigen
     · beim Chef 1440 × 900 fällt NICHTS mehr nach „Ausserdem"
     · über dem Putzplan steht am PC der Fortschritt „x von y erledigt"
     · die Seite passt weiter auf einen Bildschirm (kein Scrollen)
     · bei Gleichstand wird der untere Block gekürzt, nicht „Überfällig"
     · wer das Fenster unter 1100 px zieht, bekommt eine Spalte
     · jedes Bedienelement ≥ 44 × 44 bei 1100/1280/1440/1920, normal
       und kompakt (Hit-Test)
     · GEGENPROBE am Handy (390): eine Spalte, kein Fortschrittsbalken
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

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
async function start(b, rolle, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  await p.waitForTimeout(800);
  return p;
}
const LAGE = () => {
  const box = document.getElementById('heuteListe');
  const sa = box.closest('.scroll-area');
  const sp = [...box.querySelectorAll('.heute-spalte')];
  const titel = (el) => [...el.querySelectorAll('.heute-block')].map(x => x.getAttribute('data-btitel'));
  const rest = box.querySelector('.heute-rest');
  const fs = box.querySelector('.heute-fortschritt');
  const zeilen = (t) => { const b = box.querySelector('.heute-block[data-btitel="' + t + '"]'); return b ? b.querySelectorAll('.heute-zeile').length : null; };
  return {
    spalten: sp.length,
    oben: sp.map(x => Math.round(x.getBoundingClientRect().top)),
    links: sp[0] ? titel(sp[0]) : titel(box),
    rechts: sp[1] ? titel(sp[1]) : [],
    ausserdem: rest ? [...rest.querySelectorAll('button')].map(x => x.textContent.trim()) : [],
    fortschritt: fs && fs.getClientRects().length ? fs.textContent.trim() : null,
    passt: sa.scrollHeight <= sa.clientHeight + 2,
    ueber: zeilen('Überfällig'), offen: zeilen('Offen')
  };
};
async function knoepfe(p) {
  return p.evaluate((SRC) => {
    const TREFFER = eval(SRC);
    return [...document.querySelectorAll('#heuteListe button')].filter(x => x.getClientRects().length)
      .map(x => ({ t: x.textContent.trim().slice(0, 24), m: TREFFER(x) }))
      .filter(x => !(x.m.w >= 44 && x.m.h >= 44));
  }, '(' + TREFFER.toString() + ')');
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  /* ── PC, Chef ── */
  {
    console.log('\n── PC 1440 × 900, Chef ──');
    const p = await start(b, 'chef', 1440, 900);
    const a = await p.evaluate(LAGE);
    console.log('  ' + JSON.stringify(a));
    pruefe('zwei Spalten, oben bündig', a.spalten === 2 && a.oben[0] === a.oben[1], JSON.stringify(a.oben));
    pruefe('links steht, was getan werden muss (Überfällig zuerst)', a.links[0] === 'Überfällig' &&
      a.links.every(t => ['Überfällig', 'Heute', 'Zum Übernehmen', 'Offen'].includes(t)), JSON.stringify(a.links));
    pruefe('rechts Putzplan, Neu für dich, Zu erledigen', a.rechts[0] === 'Putzplan' &&
      a.rechts.every(t => ['Putzplan', 'Neu für dich', 'Zu erledigen'].includes(t)), JSON.stringify(a.rechts));
    pruefe('nichts fällt nach „Ausserdem" (vorher 3 Kategorien)', a.ausserdem.length === 0, JSON.stringify(a.ausserdem));
    pruefe('über dem Putzplan steht „x von y erledigt"', /^\d+ von \d+ erledigt$/.test(a.fortschritt || ''), String(a.fortschritt));
    pruefe('die Seite passt auf einen Bildschirm', a.passt);
    pruefe('bei Gleichstand bleibt „Überfällig" mindestens so lang wie „Offen"',
      a.ueber !== null && a.offen !== null && a.ueber >= a.offen, JSON.stringify({ ueber: a.ueber, offen: a.offen }));
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.waitForTimeout(200);
      const k = await knoepfe(p);
      pruefe('1440, ' + dichte + ': jedes Bedienelement ≥ 44 × 44', !k.length, JSON.stringify(k));
    }
    await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });

    /* Fenster unter die Grenze ziehen */
    await p.setViewportSize({ width: 900, height: 900 });
    await p.waitForTimeout(600);
    const s = await p.evaluate(LAGE);
    pruefe('unter 1100 px wird es EINE Spalte, ohne Neuladen', s.spalten === 0 && s.fortschritt === null, JSON.stringify(s));
    await p.setViewportSize({ width: 1440, height: 900 });
    await p.waitForTimeout(600);
    pruefe('und zurück wieder zwei', (await p.evaluate(LAGE)).spalten === 2);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  /* ── weitere PC-Breiten ── */
  for (const [rolle, w, h] of [['chef', 1100, 800], ['mitarbeiter', 1280, 800], ['leiter', 1920, 1080]]) {
    console.log('\n── PC ' + w + ' × ' + h + ', ' + rolle + ' ──');
    const p = await start(b, rolle, w, h);
    const a = await p.evaluate(LAGE);
    console.log('  ' + JSON.stringify(a));
    pruefe(w + ': zwei Spalten, passt auf einen Bildschirm', a.spalten === 2 && a.passt, JSON.stringify(a));
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.waitForTimeout(200);
      const k = await knoepfe(p);
      pruefe(w + ', ' + dichte + ': jedes Bedienelement ≥ 44 × 44', !k.length, JSON.stringify(k));
    }
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  /* ── GEGENPROBE am Handy ── */
  for (const rolle of ['chef', 'mitarbeiter']) {
    console.log('\n── Handy 390 × 844, ' + rolle + ' ──');
    const p = await start(b, rolle, 390, 844);
    const a = await p.evaluate(LAGE);
    console.log('  ' + JSON.stringify(a));
    pruefe('GEGENPROBE Handy: eine Spalte, kein Fortschrittsbalken', a.spalten === 0 && a.fortschritt === null, JSON.stringify(a));
    pruefe('Handy: passt weiter auf einen Bildschirm', a.passt);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Startseite P3: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Startseite P3: am PC zwei Spalten, nichts mehr unter „Ausserdem", Handy unverändert — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
