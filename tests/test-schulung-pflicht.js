/* ══════════════════════════════════════════════════════════════════════
   SCHULUNG: PFLICHT — WER HAT WAS, ERINNERN, FRAGE NACHBESSERN (Runde 205)

   Aus dem Betrieb, 22.10.2026: „aight mach die nächste runde" — auf den
   Vorschlag: der Leitung den Stand der Pflichtschulungen auf einen Blick
   geben, mit einem Tipp zum Erinnern, und von „Fragen, die im Team nicht
   sitzen" direkt zur Frage im Editor.

   Geprüft wird, jeweils mit Gegenprobe:
   1. Reiter „Pflicht": Personen × Pflichtmodule, die Zahlen stimmen mit
      den Durchläufen der Demo überein (✓, angefangen, bis …).
   2. Überfällig erst, wenn die Frist verstrichen ist (die Uhr springt),
      in der Statusfarbe; der Reiter zählt es; der Filter zeigt nur sie.
   3. Eine stillgelegte Person steht nicht in der Tabelle.
   4. „Erinnern": die Nachricht nennt die offenen Module und den Code —
      und kein erledigtes.
   5. „Bearbeiten" bei einer schweren Frage öffnet den Editor genau dort.
   6. Am Rechner eine Tabelle, am Handy je Person eine Karte, deren Stand
      rechts im Bild bleibt; Fingerziele ≥ 44 × 44 bei sieben Breiten,
      normal und kompakt.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 240) : '')); }
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
const BREITEN = [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]];

async function oeffne(b, w, h, uhr) {
  const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => {
    localStorage.setItem('kf_tour', '99:demo-ich');
    /* Was „Erinnern" weitergibt, wird mitgeschnitten. Ohne Teilen-Fenster
       geht es in die Zwischenablage. */
    window.__kopiert = [];
    try { Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); } catch (e) {}
    Object.defineProperty(navigator, 'clipboard', { configurable: true,
      value: { writeText: (t) => { window.__kopiert.push(t); return Promise.resolve(); } } });
  });
  if (uhr) await p.clock.setFixedTime(new Date(uhr));
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  await p.evaluate(() => {
    const k = document.querySelector('.mobnav [data-group="g-wissen"]') || document.querySelector('#side [data-group="g-wissen"]');
    if (k) k.click();
  });
  await p.waitForTimeout(700);
  await p.evaluate(() => { const t = [...document.querySelectorAll('[data-subview]')].find(x => /Schulung/.test(x.textContent)); if (t) t.click(); });
  await p.waitForTimeout(1500);
  await p.click('#schVerwaltenBtn'); await p.waitForTimeout(700);
  return p;
}
const reiter = (p, id) => p.evaluate((i) => document.querySelector('[data-schvwtab="' + i + '"]').click(), id).then(() => p.waitForTimeout(600));
const stand = (p) => p.evaluate(() => {
  const zeilen = [...document.querySelectorAll('#schStand2 tr[data-schstand]')].map(tr => ({
    name: tr.querySelector('th').childNodes[0].textContent,
    zellen: [...tr.querySelectorAll('.sch-zelle')].map(td => ({ m: td.dataset.modul, art: td.className.replace('sch-zelle ', ''), t: td.textContent })),
    erinnern: !!tr.querySelector('[data-scherinnern]')
  }));
  return { zeilen, summe: (document.querySelector('.sch-stand-summe') || {}).textContent || '',
    zahl: (document.querySelector('[data-schvwtab="stand"] .sch-reiterzahl') || {}).textContent };
});

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── Wer hat was ──');
  const p = await oeffne(b, 1440, 900);
  await reiter(p, 'stand');
  let s = await stand(p);
  pruefe('Reiter „Pflicht": drei Personen, je vier Pflichtmodule', s.zeilen.length === 3 && s.zeilen.every(z => z.zellen.length === 4),
    JSON.stringify(s.zeilen.map(z => z.name + ':' + z.zellen.length)));
  const jamie = s.zeilen.find(z => z.name === 'Jamie Kurz') || { zellen: [] };
  const ich = s.zeilen.find(z => /Demo-Konto/.test(z.name)) || { zellen: [] };
  const zelle = (z, re) => z.zellen.find(c => re.test(c.m)) || {};
  pruefe('Jamie: „Hygiene" erledigt (✓ in der Statusfarbe)', zelle(jamie, /Hygiene/).art === 'fertig' && /✓/.test(zelle(jamie, /Hygiene/).t), JSON.stringify(zelle(jamie, /Hygiene/)));
  pruefe('Demo-Konto: „Das Beratungsgespräch" angefangen 2/17', zelle(ich, /Beratung/).art === 'an' && /angefangen 2\/17/.test(zelle(ich, /Beratung/).t), JSON.stringify(zelle(ich, /Beratung/)));
  pruefe('offen mit Frist: „bis 5.11." (Übergang: frühestens ab 22.10.)', zelle(jamie, /Kunden schlecht/).art === 'offen' && /bis \d+\.\d+\./.test(zelle(jamie, /Kunden schlecht/).t), JSON.stringify(zelle(jamie, /Kunden/)));
  pruefe('oben die Summe: „3 von 12 erledigt", nichts überfällig', /3 von 12 erledigt/.test(s.summe) && !/überfällig/.test(s.summe) && s.zahl === '0', s.summe + ' / Reiter ' + s.zahl);
  const tabelle = await p.evaluate(() => getComputedStyle(document.querySelector('.sch-stand thead')).display);
  pruefe('am Rechner eine Tabelle mit Kopfzeile', tabelle === 'table-header-group', tabelle);

  /* Erinnern */
  await p.click('#schStand2 tr[data-schstand="tn-neu"] [data-scherinnern]'); await p.waitForTimeout(400);
  const text = await p.evaluate(() => (window.__kopiert || []).slice(-1)[0] || '');
  pruefe('„Erinnern" gibt eine fertige Nachricht weiter: Vorname, offene Module, Code',
    /^Hallo Jamie,/.test(text) && /Wenn einem Kunden schlecht wird/.test(text) && /RPQ2-K7MV-4NDS/.test(text), text);
  pruefe('GEGENPROBE … ein erledigtes Modul steht nicht darin', !/Hygiene/.test(text) && !/erster Tag/.test(text), text);

  /* Filter */
  await p.click('[data-schstandfilter="ueber"]'); await p.waitForTimeout(300);
  s = await stand(p);
  pruefe('GEGENPROBE Filter „Überfällig": heute steht niemand darin', s.zeilen.length === 0, String(s.zeilen.length));
  await p.click('[data-schstandfilter="alle"]'); await p.waitForTimeout(300);

  /* Bearbeiten aus „Fragen, die im Team nicht sitzen" */
  await reiter(p, 'aus'); await p.waitForTimeout(800);
  await p.click('[data-schschwerbearb="m-notfall#2"]'); await p.waitForTimeout(700);
  const ed = await p.evaluate(() => {
    const f = document.querySelector('#schModulForm [data-frage="2"]');
    const r = f && f.getBoundingClientRect();
    return { offen: document.getElementById('schModulForm').style.display !== 'none', markiert: !!f && f.classList.contains('sch-feld-markiert'),
      imBild: !!r && r.top >= 0 && r.bottom <= innerHeight + 200,
      andere: document.querySelectorAll('#schModulForm .sch-feld-markiert').length,
      text: f ? f.querySelector('textarea, input').value : '' };
  });
  pruefe('„Bearbeiten" öffnet den Editor bei genau dieser Frage, markiert und im Bild',
    ed.offen && ed.markiert && ed.imBild && ed.andere === 1 && /Rettungsdienst/.test(ed.text), JSON.stringify(ed));
  pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
  await p.close();

  console.log('\n── Überfällig, stillgelegt ──');
  const spaet = Math.max(Date.now(), new Date(2026, 9, 22).getTime()) + 20 * 86400000;
  const q = await oeffne(b, 1440, 900, spaet);
  await reiter(q, 'stand');
  s = await stand(q);
  const ueber = s.zeilen.flatMap(z => z.zellen).filter(c => c.art === 'ueber');
  /* Nora und das Demo-Konto sind seit Wochen Teilnehmer: ihre Frist lief
     am 5.11. ab (Übergang: frühestens ab 22.10.). Jamie ist in der Demo
     erst vor vier Tagen angelegt — die Frist läuft noch. */
  const alt = s.zeilen.filter(z => z.name !== 'Jamie Kurz').flatMap(z => z.zellen).filter(c => c.art !== 'fertig');
  pruefe('20 Tage später: bei länger Angelegten ist alles Offene „überfällig", in der Statusfarbe',
    alt.length === 7 && alt.every(c => c.art === 'ueber' && /überfällig/.test(c.t)), JSON.stringify(alt));
  const j2 = (s.zeilen.find(z => z.name === 'Jamie Kurz') || { zellen: [] }).zellen.filter(c => c.art !== 'fertig');
  pruefe('GEGENPROBE wer erst vor vier Tagen angelegt wurde, ist noch in der Frist', j2.length === 2 && j2.every(c => c.art === 'offen' && /bis /.test(c.t)), JSON.stringify(j2));
  pruefe('… die Summe und der Reiter zählen sie', /überfällig/.test(s.summe) && Number(s.zahl) === ueber.length, s.summe + ' / ' + s.zahl);
  const farbe = await q.evaluate(() => {
    const u = document.querySelector('.sch-zelle.ueber > span'), o = document.querySelector('.sch-zelle.fertig > span');
    return { u: getComputedStyle(u).color, o: getComputedStyle(o).color };
  });
  pruefe('überfällig und erledigt tragen verschiedene Farben', farbe.u !== farbe.o, JSON.stringify(farbe));
  /* Nora stilllegen → weg aus der Tabelle. */
  await reiter(q, 'tn');
  await q.evaluate(() => {
    const z = [...document.querySelectorAll('#schTnListe .sch-tn-zeile')].find(x => /Nora Haas/.test(x.textContent));
    z.querySelector('[data-schsperre]').click();
  });
  await q.waitForTimeout(600);
  await reiter(q, 'stand');
  s = await stand(q);
  pruefe('eine stillgelegte Person steht nicht in der Tabelle', s.zeilen.length === 2 && !s.zeilen.some(z => z.name === 'Nora Haas'),
    s.zeilen.map(z => z.name).join(', '));
  await q.close();

  console.log('\n── Handy und Fingerziele ──');
  for (const [w, h] of BREITEN) {
    const r = await oeffne(b, w, h);
    await reiter(r, 'stand');
    for (const dichte of ['normal', 'kompakt']) {
      await r.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const m = await r.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const els = [...document.querySelectorAll('#schStand2 button, #schVwTabs button')].filter(e => e.offsetParent);
        const zu = [];
        for (const el of els) {
          el.scrollIntoView({ block: 'center' });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const t = T(el);
          if (t.w < 44 || t.h < 44) zu.push((el.textContent.trim() || el.id).slice(0, 12) + ' ' + t.w + '×' + t.h);
        }
        const karte = document.querySelector('#schStand2').getBoundingClientRect();
        const stand = [...document.querySelectorAll('.sch-zelle > span')].map(x => x.getBoundingClientRect());
        return { zu, n: els.length, quer: document.documentElement.scrollWidth - innerWidth,
          drin: stand.every(x => x.right <= karte.right + 0.5 && x.width > 0) };
      }, TREFFER.toString());
      pruefe(w + ' px ' + dichte + ': ' + m.n + ' Knöpfe ≥ 44 × 44, der Stand bleibt im Bild, nichts ragt hinaus',
        m.n >= 6 && !m.zu.length && m.quer <= 0 && m.drin, m.zu.join(', ') + ' quer ' + m.quer + ' drin ' + m.drin);
    }
    await r.close();
  }

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Schulung: Pflicht auf einen Blick, Erinnern, Frage nachbessern — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
