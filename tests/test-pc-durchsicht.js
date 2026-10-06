/* ══════════════════════════════════════════════════════════════════════
   DURCHSICHT AM RECHNER (Runde 143)

   CLAUDE.md: „Eine Ansicht, die am Rechner eine Spalte über 1.200 px
   zieht, ist dort genauso ungestaltet wie ein abgeschnittener Knopf auf
   dem Handy." Gemessen am 5.10.2026 bei 1920 × 1080 (Demo Chef):
     - Verwaltung → Erstellen: „Neue Aufgabe" 1.654 px breit, jedes Feld
       über die ganze Seite, Vorlagen und Ankündigung darunter.
     - Ich → Schulung: „Das steht für dich an", „Kurz auffrischen", „Was
       du schon gemacht hast" je 1.654 px breit untereinander.
     - Studio-Auswahl in Erstellen: das Kästchen sass oben links und
       klebte am Namen (.field label{display:block} schlug .studio-check).

   Geprüft wird:
   1. Erstellen bei 1280 / 1440 / 1920: „Neue Aufgabe" links und unter
      1.200 px breit, „Vorlagen" rechts daneben auf gleicher Höhe.
      GEGENPROBE 390: untereinander, Reihenfolge wie vorher.
   2. Schulung bei 1280 / 1440 / 1920: keine der drei Karten über
      1.000 px, mindestens zwei nebeneinander. GEGENPROBE 390:
      untereinander.
   3. Studio-Auswahl: Kästchen senkrecht mittig zur Zeile, mit Abstand
      zum Namen — am Handy und am Rechner.
   4. Treffer ≥ 44 × 44 (Hit-Test) für „Alle Studios", die erste
      Studio-Zeile, die Köpfe von „Vorlagen" und „Ankündigung" bei
      320–1920 px, normal und kompakt; kein waagerechtes Scrollen.
   5. ALLE zuklappbaren Karten in 13 Bereichen, zu und offen, 390 und
      1440 px, normal und kompakt: Kopf ≥ 44 px hoch getroffen (vorher
      27 — eine zugeklappte Karte sieht aus wie ein Knopf, getroffen
      wurde ein Streifen), und die Überschrift steht dort, wo sie
      vorher stand (Innenabstand + 2 px): das Bild hat sich nicht
      verschoben.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 300) : '')); }
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
const GROESSEN = [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]];
const PC = [[1280, 800], [1440, 900], [1920, 1080]];

async function oeffne(b, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3300);
  return p;
}
/* Der Weg eines Menschen: „Alles" → Eintrag. Am Handy und am Rechner
   derselbe. */
async function ueberAlles(p, sel) {
  return p.evaluate(async (sel) => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    const s = (q) => [...document.querySelectorAll(q)].find(e => e.offsetParent);
    const alles = s('[data-group="g-alles"]');
    if (alles) { alles.click(); await w(700); }
    const ziel = s(sel);
    if (!ziel) return false;
    ziel.click(); await w(1500);
    return true;
  }, sel);
}
const kasten = (p, sel) => p.evaluate((sel) => {
  const e = document.querySelector(sel);
  if (!e || !e.offsetParent || getComputedStyle(e).display === 'none') return null;
  const k = e.getBoundingClientRect();
  return { l: Math.round(k.left), r: Math.round(k.right), t: Math.round(k.top), w: Math.round(k.width) };
}, sel);
const nebeneinander = (a, b) => !!a && !!b && b.l >= a.r - 1 && Math.abs(a.t - b.t) < 6;
const ERST = '[data-cpane="erstellen"] ';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. Verwaltung → Erstellen ──');
  for (const [w, h] of PC) {
    const p = await oeffne(b, w, h);
    pruefe(w + ' px: über „Alles" erreichbar', await ueberAlles(p, '[data-alles][data-al-cgo="erstellen"]'));
    const neu = await kasten(p, ERST + '.card[data-fold="neueaufgabe"]');
    const vor = await kasten(p, ERST + '.card[data-fold="vorlagen"]');
    const ank = await kasten(p, ERST + '.card[data-fold="ankuendigung"]');
    pruefe(w + ' px: „Neue Aufgabe" links, unter 1.200 px breit; „Vorlagen" rechts daneben',
      nebeneinander(neu, vor) && neu.w < 1200, JSON.stringify({ neu, vor }));
    pruefe(w + ' px: „Ankündigung" in der rechten Spalte unter „Vorlagen"',
      !!ank && !!vor && Math.abs(ank.l - vor.l) < 2 && ank.t > vor.t, JSON.stringify({ vor, ank }));
    pruefe(w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  {
    const p = await oeffne(b, 390, 844);
    await ueberAlles(p, '[data-alles][data-al-cgo="erstellen"]');
    const neu = await kasten(p, ERST + '.card[data-fold="neueaufgabe"]');
    const vor = await kasten(p, ERST + '.card[data-fold="vorlagen"]');
    const ank = await kasten(p, ERST + '.card[data-fold="ankuendigung"]');
    pruefe('GEGENPROBE 390 px: untereinander in der Reihenfolge Aufgabe, Vorlagen, Ankündigung',
      !!neu && !!vor && !!ank && neu.l === vor.l && vor.l === ank.l && neu.t < vor.t && vor.t < ank.t, JSON.stringify({ neu, vor, ank }));
    await p.close();
  }

  console.log('\n── 2. Ich → Schulung ──');
  const KARTEN = ['#schFaelligKarte', '#schAuffrischKarte', '#schMeineKarte'];
  for (const [w, h] of PC) {
    const p = await oeffne(b, w, h);
    pruefe(w + ' px: über „Alles" erreichbar', await ueberAlles(p, '[data-alles="schulung"]'));
    const k = [];
    for (const s of KARTEN) { const x = await kasten(p, s); if (x) k.push(x); }
    const breit = k.filter(x => x.w > 1000);
    const paar = k.some((a, i) => k.some((c, j) => i !== j && nebeneinander(a, c)));
    pruefe(w + ' px: ' + k.length + ' Karten, keine über 1.000 px, nebeneinander', k.length >= 2 && !breit.length && paar, JSON.stringify(k));
    pruefe(w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  {
    const p = await oeffne(b, 390, 844);
    await ueberAlles(p, '[data-alles="schulung"]');
    const k = [];
    for (const s of KARTEN) { const x = await kasten(p, s); if (x) k.push(x); }
    pruefe('GEGENPROBE 390 px: untereinander, gleiche linke Kante', k.length >= 2 && k.every(x => x.l === k[0].l) &&
      k.every((x, i) => i === 0 || x.t > k[i - 1].t), JSON.stringify(k));
    await p.close();
  }

  console.log('\n── 3. Studio-Auswahl: Kästchen und Name ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h);
    await ueberAlles(p, '[data-alles][data-al-cgo="erstellen"]');
    const m = await p.evaluate((ERST) => [...document.querySelectorAll(ERST + '.studio-check')].filter(l => l.offsetParent).slice(0, 4).map(l => {
      const r = l.getBoundingClientRect(), c = l.querySelector('input').getBoundingClientRect(), s = l.querySelector('span').getBoundingClientRect();
      return { mitte: Math.round(Math.abs((c.top + c.height / 2) - (r.top + r.height / 2))), abstand: Math.round(s.left - c.right),
               anzeige: getComputedStyle(l).display };
    }), ERST);
    pruefe(w + ' px: Kästchen senkrecht mittig (≤ 2 px) und ≥ 6 px vom Namen, ' + m.length + ' Zeilen',
      m.length >= 3 && m.every(x => x.mitte <= 2 && x.abstand >= 6 && x.anzeige === 'flex'), JSON.stringify(m));
    await p.close();
  }

  console.log('\n── 4. Fingerziele ──');
  {
    const p = await oeffne(b, 390, 844);
    await ueberAlles(p, '[data-alles][data-al-cgo="erstellen"]');
    const ziele = ['#ntAllWrap', '#ntStudios > .studio-check', ERST + '.card[data-fold="vorlagen"] .fold-head', ERST + '.card[data-fold="ankuendigung"] .fold-head'];
    const zuKlein = [];
    let quer = 0;
    for (const [w, h] of GROESSEN) {
      await p.setViewportSize({ width: w, height: h });
      await p.waitForTimeout(250);
      for (const dichte of ['normal', 'kompakt']) {
        await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
        const m = await p.evaluate(async ([SRC, sel]) => {
          const T = eval('(' + SRC + ')');
          const aus = {};
          for (const s of sel) {
            const el = document.querySelector(s);
            if (!el || !el.offsetParent) { aus[s] = { w: -1, h: -1 }; continue; }
            el.scrollIntoView({ block: 'center' });
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            aus[s] = T(el);
          }
          return { aus, quer: document.documentElement.scrollWidth - innerWidth };
        }, [TREFFER.toString(), ziele]);
        quer = Math.max(quer, m.quer);
        for (const [s, r] of Object.entries(m.aus)) if (r.w < 44 || r.h < 44) zuKlein.push(w + '/' + dichte + ' ' + s.replace(ERST, '') + ' ' + r.w + '×' + r.h);
      }
    }
    pruefe('Treffer ≥ 44 × 44 bei 320–1920 px, normal und kompakt', !zuKlein.length, zuKlein.join(', '));
    pruefe('kein waagerechtes Scrollen', quer <= 0, quer + ' px');
    await p.close();
  }

  console.log('\n── 5. Alle zuklappbaren Karten ──');
  {
    const KOPF = (el) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + Math.min(40, r.width / 2), cy = r.top + r.height / 2;
      const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
      if (!trifft(cx, cy)) return 0;
      let o = cy, u = cy; while (o > 0 && trifft(cx, o - 1)) o--; while (u < innerHeight && trifft(cx, u + 1)) u++;
      return Math.round(u - o + 1);
    };
    const BEREICHE = ['[data-alles="home"]', '[data-alles="todos"]', '[data-alles="putzplan"]', '[data-alles="material"]',
      '[data-alles="docs"]', '[data-alles="team"]', '[data-al-cgo="erstellen"]', '[data-al-cgo="team"]', '[data-al-cgo="standorte"]',
      '[data-al-cgo="system"]', '[data-al-cgo="ueberblick"]', '[data-alles="ich"]', '[data-alles="archive"]'];
    const zuKlein = [], versatz = [];
    let gemessen = 0;
    for (const [w, h] of [[390, 844], [1440, 900]]) for (const dichte of ['normal', 'kompakt']) {
      const p = await oeffne(b, w, h);
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      for (const z of BEREICHE) {
        await p.evaluate(async (z) => {
          const w = (ms) => new Promise(r => setTimeout(r, ms));
          const s = (q) => [...document.querySelectorAll(q)].find(e => e.offsetParent);
          const a = s('[data-group="g-alles"]'); if (a) { a.click(); await w(600); }
          const e = s('[data-alles]' + z.replace(/^\[data-alles\]/, '')) || s(z); if (e) { e.click(); await w(1200); }
        }, z);
        for (const umschalten of [false, true]) {
          const m = await p.evaluate(async ([SRC, umschalten]) => {
            const T = eval('(' + SRC + ')');
            const r = [];
            for (const c of [...document.querySelectorAll('.view.show .card.fold')].filter(c => c.offsetParent)) {
              const k = c.querySelector(':scope > .fold-head'); if (!k) continue;
              if (umschalten) { k.click(); await new Promise(x => setTimeout(x, 420)); }
              k.scrollIntoView({ block: 'center' });
              await new Promise(x => requestAnimationFrame(() => requestAnimationFrame(x)));
              const h3 = k.querySelector('h3'), cr = c.getBoundingClientRect();
              r.push({ id: c.getAttribute('data-fold'), zu: c.classList.contains('zu'), h: T(k),
                versatz: h3 ? Math.round(h3.getBoundingClientRect().top - cr.top) : -1,
                pad: Math.round(parseFloat(getComputedStyle(c).paddingTop)) });
              if (umschalten) { k.click(); await new Promise(x => setTimeout(x, 380)); }
            }
            return r;
          }, [KOPF.toString(), umschalten]);
          for (const x of m) {
            gemessen++;
            if (x.h < 44) zuKlein.push(w + '/' + dichte + '/' + (x.zu ? 'zu' : 'offen') + ' ' + x.id + ' ' + x.h);
            if (x.versatz >= 0 && Math.abs(x.versatz - x.pad - 2) > 3) versatz.push(w + ' ' + x.id + ' ' + x.versatz + '/' + x.pad);
          }
        }
      }
      await p.close();
    }
    pruefe(gemessen + ' Köpfe gemessen (zu und offen), alle ≥ 44 px hoch getroffen', gemessen >= 150 && !zuKlein.length, [...new Set(zuKlein)].join(', '));
    pruefe('… die Überschriften stehen, wo sie standen (Innenabstand + 2 px)', !versatz.length, [...new Set(versatz)].join(', '));
  }

  await b.close();
  console.log('\n' + (schlecht ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Am Rechner: Erstellen und Schulung in Spalten, Kästchen mittig, Kartenköpfe 44 px — ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
