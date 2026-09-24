/* ══════════════════════════════════════════════════════════════════════
   VERWALTUNG → ZEITEN: VERGESSENEN FEIERABEND NACHTRAGEN (P-09)

   Aus dem Betrieb, 24.9.2026:
     „füge hinzu das die leitung die zeiten ändern kann falls jemand sich
      nicht ausgestempelt hat oder so"

   Die Funktionen selbst prüft tests/rules/zeitkorrektur.test.js gegen
   den Emulator. Hier geht es um den Weg durch die Oberfläche, in der
   Demo:
   1. Der Reiter „Zeiten" ist für Chef und Studioleitung da, für
      Mitarbeiter nicht.
   2. Der Tag ohne Feierabend steht OBEN, mit „Feierabend fehlt".
   3. Nachtragen: ohne Uhrzeit oder ohne Grund geht es nicht (Gegenprobe);
      mit beidem ist der Feierabend da, der Tag gerechnet, und die Zeile
      sagt „nachgetragen von … · Grund".
   4. Ungültig markieren: der Stempel bleibt sichtbar, durchgestrichen,
      mit Grund.
   5. Die Studioleitung sieht nur ihre Studios und bekommt an den
      eigenen Zeiten kein Formular, sondern den Hinweis, dass das die
      Geschäftsführung macht.
   6. Am Rechner steht der Tag rechts neben der Liste; jedes
      Bedienelement ≥ 44 × 44 bei 320 bis 1920 px, normal und kompakt.
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

async function oeffne(b, rolle, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
/* Der Weg, den ein Mensch geht: Verwaltung → Kachel „Zeiten". Am Handy
   liegt die Verwaltung unter „Alles". */
async function zuZeiten(p) {
  return p.evaluate(async () => {
    const warte = (ms) => new Promise(r => setTimeout(r, ms));
    const g = document.querySelector('.mobnav [data-group="g-chef"], #side [data-group="g-chef"]');
    if (g) { g.click(); await warte(700); }
    else {
      const a = document.querySelector('.mobnav [data-group="g-alles"]'); if (!a) return false;
      a.click(); await warte(700);
      const v = [...document.querySelectorAll('#view-alles button, #view-alles a')]
        .find(x => /Verwaltung/.test(x.textContent));
      if (!v) return false;
      v.click(); await warte(700);
    }
    const c = document.querySelector('#chefHome [data-cgo="zeiten"]');
    if (!c) return false;
    c.click(); await warte(900);
    return true;
  });
}
async function studio(p, k) {
  await p.evaluate((k) => { const s = document.getElementById('zkStudio'); s.value = k; s.dispatchEvent(new Event('change')); }, k);
  await p.waitForTimeout(800);
}
function stand(p) {
  return p.evaluate(() => {
    const z = [...document.querySelectorAll('#zkListe [data-zk]')];
    const d = document.querySelector('#zkDetail:not(:empty), #zkListe .zk-inline');
    return {
      zeilen: z.length,
      erste: z[0] ? z[0].textContent : '',
      fehlt: z.filter(x => /Feierabend fehlt/.test(x.textContent)).length,
      detail: d ? d.textContent : '',
      form: !!(d && d.querySelector('[data-zknach]')),
      optionen: [...document.querySelectorAll('#zkStudio option')].map(o => o.value)
    };
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── Wer den Reiter sieht ──');
  {
    const m = await oeffne(b, 'mitarbeiter', 390, 844);
    const da = await m.evaluate(() => !!document.querySelector('#chefHome [data-cgo="zeiten"]') &&
      !!document.querySelector('#chefHome [data-cgo="zeiten"]').offsetParent);
    pruefe('ein Mitarbeiter hat keinen Reiter „Zeiten"', !da);
    await m.close();
  }

  console.log('\n── Nachtragen (Chef, Handy) ──');
  {
    const p = await oeffne(b, 'chef', 390, 844);
    pruefe('Verwaltung → Zeiten ist erreichbar', await zuZeiten(p));
    await studio(p, 'studio-6');
    let s = await stand(p);
    pruefe('der Tag ohne Feierabend steht oben', s.fehlt === 1 && /Feierabend fehlt/.test(s.erste), s.erste.slice(0, 80));
    await p.evaluate(() => document.querySelector('#zkListe [data-zk]').click());
    await p.waitForTimeout(400);
    s = await stand(p);
    pruefe('ein Tipp öffnet ihn — mit Formular zum Nachtragen', s.form, s.detail.slice(0, 80));
    const vorschlag = await p.evaluate(() => document.getElementById('zkArt').value);
    pruefe('vorgeschlagen ist „Feierabend"', vorschlag === 'gehen', vorschlag);

    /* GEGENPROBEN: ohne Uhrzeit, ohne Grund — nichts passiert. */
    const ohne = await p.evaluate(async () => {
      const vorher = document.querySelectorAll('#zkListe .zk-inline .mz-s').length;
      document.querySelector('[data-zknach]').click();
      await new Promise(r => setTimeout(r, 500));
      document.getElementById('zkUhr').value = '18:00';
      document.querySelector('[data-zknach]').click();
      await new Promise(r => setTimeout(r, 500));
      return { vorher, nachher: document.querySelectorAll('#zkListe .zk-inline .mz-s').length,
               fehltNoch: /Feierabend fehlt/.test(document.querySelector('#zkListe [data-zk]').textContent) };
    });
    pruefe('GEGENPROBE ohne Uhrzeit und ohne Grund wird nichts eingetragen',
      ohne.vorher === ohne.nachher && ohne.fehltNoch, JSON.stringify(ohne));

    await p.evaluate(() => {
      document.getElementById('zkUhr').value = '18:00';
      document.getElementById('zkGrund').value = 'Ausstempeln vergessen, laut Plan bis 18 Uhr';
      document.querySelector('[data-zknach]').click();
    });
    await p.waitForTimeout(1200);
    s = await stand(p);
    pruefe('danach fehlt kein Feierabend mehr', s.fehlt === 0, s.erste.slice(0, 80));
    const zeile = await p.evaluate(() => {
      const z = [...document.querySelectorAll('#zkListe [data-zk]')].find(x => /korrigiert/.test(x.textContent));
      if (!z) return null;
      /* Der Tag bleibt nach dem Nachtragen offen — nur zuklappen, wenn er zu ist. */
      if (z.getAttribute('aria-expanded') !== 'true') z.click();
      return new Promise(r => setTimeout(() => r({
        zeile: z.textContent,
        detail: (document.querySelector('#zkListe .zk-inline') || {}).textContent || ''
      }), 400));
    });
    pruefe('der Tag ist als „korrigiert" markiert und gerechnet (Stunden statt „?")',
      !!zeile && /korrigiert/.test(zeile.zeile) && /\d+:\d\d h/.test(zeile.zeile), zeile && zeile.zeile);
    pruefe('der Stempel sagt, wer ihn nachgetragen hat und warum',
      !!zeile && /18:00/.test(zeile.detail) && /nachgetragen von Demo-Geschäftsführung/.test(zeile.detail) &&
      /Ausstempeln vergessen/.test(zeile.detail), zeile && zeile.detail.slice(0, 160));

    console.log('\n── Ungültig markieren ──');
    const weg = await p.evaluate(async () => {
      const box = document.querySelector('#zkListe .zk-inline');
      const k = box.querySelector('[data-zkweg]');
      k.click();
      await new Promise(r => setTimeout(r, 300));
      /* GEGENPROBE: ohne Grund bleibt er gültig. */
      document.querySelector('[data-zkstorno]').click();
      await new Promise(r => setTimeout(r, 400));
      const ohneGrund = document.querySelectorAll('#zkListe .mz-s.ungueltig').length;
      document.getElementById('zkGrund').value = 'Doppelt gestempelt, gilt nicht';
      document.querySelector('[data-zkstorno]').click();
      await new Promise(r => setTimeout(r, 1200));
      const z = [...document.querySelectorAll('#zkListe [data-zk]')].find(x => /korrigiert/.test(x.textContent));
      if (z && z.getAttribute('aria-expanded') !== 'true') { z.click(); await new Promise(r => setTimeout(r, 400)); }
      const d = document.querySelector('#zkListe .zk-inline');
      return { ohneGrund, ungueltig: d ? d.querySelectorAll('.mz-s.ungueltig').length : -1,
               stempel: d ? d.querySelectorAll('.mz-s').length : -1, text: d ? d.textContent : '' };
    });
    pruefe('GEGENPROBE ohne Grund bleibt der Stempel gültig', weg.ohneGrund === 0, String(weg.ohneGrund));
    pruefe('mit Grund ist er als ungültig markiert', weg.ungueltig === 1, JSON.stringify(weg).slice(0, 200));
    pruefe('ER BLEIBT STEHEN — mit Name und Grund', weg.stempel >= 2 && /ungültig · Demo-Geschäftsführung/.test(weg.text) &&
      /Doppelt gestempelt/.test(weg.text), weg.text.slice(0, 200));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── Die Studioleitung ──');
  {
    const p = await oeffne(b, 'leiter', 1440, 900);
    pruefe('die Studioleitung erreicht Verwaltung → Zeiten', await zuZeiten(p));
    let s = await stand(p);
    pruefe('sie sieht nur ihre beiden Studios', s.optionen.join(',') === 'studio-6,studio-7', s.optionen.join(','));
    /* Ihre eigenen Stempel liegen in Studio 6 — dort ist sie selbst dabei. */
    await studio(p, 'studio-6');
    const eigen = await p.evaluate(async () => {
      const z = [...document.querySelectorAll('#zkListe [data-zk]')].find(x => /Demo-Studioleitung/.test(x.textContent));
      if (!z) return null;
      z.click(); await new Promise(r => setTimeout(r, 400));
      const d = document.getElementById('zkDetail');
      return { form: !!d.querySelector('[data-zknach]'), weg: !!d.querySelector('[data-zkweg]'), text: d.textContent };
    });
    pruefe('an den EIGENEN Zeiten kein Formular, sondern der Hinweis auf die Geschäftsführung',
      !!eigen && !eigen.form && !eigen.weg && /korrigiert die Geschäftsführung/.test(eigen.text), JSON.stringify(eigen).slice(0, 160));
    const fremd = await p.evaluate(async () => {
      const z = [...document.querySelectorAll('#zkListe [data-zk]')].find(x => !/Demo-Studioleitung/.test(x.textContent));
      z.click(); await new Promise(r => setTimeout(r, 400));
      return !!document.querySelector('#zkDetail [data-zknach]');
    });
    pruefe('(Gegenprobe) an den Zeiten ihres Teams schon', fremd);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── Rechner: Liste und Tag nebeneinander ──');
  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, 'chef', w, h);
    await zuZeiten(p); await studio(p, 'studio-6');
    const r = await p.evaluate(() => {
      const l = document.getElementById('zkListe').getBoundingClientRect();
      const d = document.getElementById('zkDetail').getBoundingClientRect();
      return { neben: d.left > l.right - 1 && Math.abs(d.top - l.top) < 4 && d.width > 300,
               ohneTipp: !!document.querySelector('#zkDetail [data-zknach]'),
               quer: document.documentElement.scrollWidth - innerWidth };
    });
    pruefe(w + ' px: der Tag steht rechts neben der Liste, ohne dass man tippen muss', r.neben && r.ohneTipp, JSON.stringify(r));
    pruefe(w + ' px: nichts ragt seitlich hinaus', r.quer <= 0, String(r.quer));
    await p.close();
  }

  console.log('\n── Trefferflächen ──');
  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, 'chef', w, h);
    await zuZeiten(p); await studio(p, 'studio-6');
    if (w < 1100) { await p.evaluate(() => document.querySelector('#zkListe [data-zk]').click()); await p.waitForTimeout(300); }
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const k = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const pane = document.querySelector('.chef-pane[data-cpane="zeiten"]');
        const els = [...pane.querySelectorAll('button, select, input')].filter(e => e.offsetParent)
          .slice(0, 14);
        const zu = [];
        for (const el of els) {
          el.scrollIntoView({ block: 'center' });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el);
          if (m.w < 44 || m.h < 44) zu.push((el.textContent.trim() || el.id || el.tagName).slice(0, 18) + ' ' + m.w + '×' + m.h);
        }
        return { zahl: els.length, zu };
      }, TREFFER.toString());
      pruefe(w + ' px, ' + dichte + ': jedes Bedienelement ≥ 44 × 44 (' + k.zahl + ' gemessen)', k.zahl >= 6 && !k.zu.length,
        k.zu.slice(0, 4).join(', '));
    }
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Zeiten korrigieren: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Zeiten korrigieren: nachtragen und für ungültig erklären, nur mit Grund, nichts wird überschrieben — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
