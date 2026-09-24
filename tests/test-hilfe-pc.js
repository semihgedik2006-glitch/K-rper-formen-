/* ══════════════════════════════════════════════════════════════════════
   HILFE AM RECHNER: LISTE LINKS, ANTWORT RECHTS

   Aus dem Betrieb, 24.9.2026 (CLAUDE.md, „Der PC ist das Hauptgerät"):
     „bitte leg genau so viel Fokus auf die PC-Nutzung wie auf die
      Handy-Nutzung"
   Und dazu die Freigabe für die offenen Punkte: „die aufgaben kannst du
   in deiner reihenfolge machen".

   Das Hilfe-Fenster war am Rechner eine Tafel von 640 px: eine Antwort
   lesen, zurück, die nächste. Jetzt ab 1.100 px zwei Spalten:
   1. Links Suche und Treffer, rechts ein Hinweis, solange nichts
      gewählt ist — kein leerer Rahmen.
   2. Ein Treffer öffnet die Antwort RECHTS; die Treffer links bleiben
      stehen, der gewählte ist markiert, „‹ Zurück" braucht es rechts
      nicht.
   3. Ein zweiter Treffer ersetzt die Antwort, ohne dass man zurück muss.
   4. Eine Kategorie (Liste) bleibt links ebenso stehen.
   5. GEGENPROBE am Handy (390 px): eine Seite nach der anderen, wie
      vorher.
   6. Jedes Bedienelement in beiden Spalten ≥ 44 × 44, normal und
      kompakt; nichts ragt seitlich hinaus.
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
async function oeffne(b, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  await p.click('#hilfeBtn');
  await p.waitForTimeout(1500);
  return p;
}
const lage = (p) => p.evaluate(() => {
  const sicht = (id) => { const e = document.getElementById(id); return !!e && e.style.display !== 'none' && e.offsetParent !== null; };
  const r = (id) => { const e = document.getElementById(id); const k = e.getBoundingClientRect(); return { l: Math.round(k.left), t: Math.round(k.top), w: Math.round(k.width) }; };
  return {
    zwei: document.getElementById('hilfeBody').classList.contains('zwei'),
    start: sicht('hilfeSuchTeil'), liste: sicht('hilfeListe'), eintrag: sicht('hilfeEintrag'), leer: sicht('hilfeLeer'),
    links: sicht('hilfeSuchTeil') ? r('hilfeSuchTeil') : (sicht('hilfeListe') ? r('hilfeListe') : null),
    rechts: sicht('hilfeEintrag') ? r('hilfeEintrag') : (sicht('hilfeLeer') ? r('hilfeLeer') : null),
    titel: (document.querySelector('#hilfeEintrag h3') || {}).textContent || '',
    markiert: [...document.querySelectorAll('#hilfeBody [data-heintrag].an')].map(x => x.getAttribute('data-heintrag')),
    zurueckSichtbar: !!(document.querySelector('#hilfeEintrag > .hilfe-zurueck') || {}).offsetParent,
    quer: document.documentElement.scrollWidth - innerWidth
  };
});
async function suche(p, q) {
  await p.evaluate((q) => { const s = document.getElementById('hilfeSuche'); s.value = q; s.dispatchEvent(new Event('input', { bubbles: true })); }, q);
  await p.waitForTimeout(350);
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
    console.log('\n── ' + w + ' × ' + h + ' ──');
    const p = await oeffne(b, w, h);
    let l = await lage(p);
    pruefe('zwei Spalten: links die Suche, rechts der Hinweis „Wähle links eine Frage"',
      l.zwei && l.start && l.leer && !l.eintrag && l.rechts && l.links && l.rechts.l > l.links.l + l.links.w - 2, JSON.stringify(l));

    await suche(p, 'muskelkater');
    const erster = await p.evaluate(() => { const z = document.querySelector('#hilfeTreffer [data-heintrag]'); z.click(); return z.getAttribute('data-heintrag'); });
    await p.waitForTimeout(400);
    l = await lage(p);
    pruefe('ein Treffer öffnet die Antwort rechts', l.eintrag && !l.leer && /Muskelkater/i.test(l.titel), l.titel);
    pruefe('die Treffer bleiben links stehen, der gewählte ist markiert', l.start && l.markiert.join() === erster, l.markiert.join());
    pruefe('„‹ Zurück" steht rechts nicht', !l.zurueckSichtbar);

    const zweiter = await p.evaluate(() => { const z = document.querySelectorAll('#hilfeTreffer [data-heintrag]')[1]; z.click(); return z.getAttribute('data-heintrag'); });
    await p.waitForTimeout(400);
    l = await lage(p);
    pruefe('ein zweiter Treffer ersetzt die Antwort, ohne Zurück', l.eintrag && l.start && l.markiert.join() === zweiter, JSON.stringify(l.markiert));

    /* Eine Kategorie: Liste links, Antwort rechts. */
    await suche(p, '');
    await p.evaluate(() => document.querySelector('#hilfeKats [data-hkat]').click());
    await p.waitForTimeout(400);
    l = await lage(p);
    pruefe('eine Kategorie öffnet links die Liste, rechts wieder der Hinweis', l.liste && !l.start && l.leer, JSON.stringify(l));
    await p.evaluate(() => document.querySelector('#hilfeListe [data-heintrag]').click());
    await p.waitForTimeout(400);
    l = await lage(p);
    pruefe('und ein Eintrag daraus steht rechts, die Liste bleibt', l.liste && l.eintrag && l.markiert.length === 1, JSON.stringify(l));
    pruefe('nichts ragt seitlich hinaus', l.quer <= 0, String(l.quer));

    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const k = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const els = [...document.querySelectorAll('#hilfe button, #hilfe a[href], #hilfe input')].filter(e => e.offsetParent);
        const zu = [];
        for (const el of els) {
          el.scrollIntoView({ block: 'center' });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el);
          if (m.w < 44 || m.h < 44) zu.push((el.textContent.trim() || el.id || el.tagName).slice(0, 20) + ' ' + m.w + '×' + m.h);
        }
        return { zahl: els.length, zu };
      }, TREFFER.toString());
      pruefe(dichte + ': jedes Bedienelement in beiden Spalten ≥ 44 × 44 (' + k.zahl + ' gemessen)', k.zahl >= 5 && !k.zu.length,
        k.zu.slice(0, 4).join(', '));
    }
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── GEGENPROBE Handy 390 × 844 ──');
  {
    const p = await oeffne(b, 390, 844);
    await suche(p, 'muskelkater');
    await p.evaluate(() => document.querySelector('#hilfeTreffer [data-heintrag]').click());
    await p.waitForTimeout(400);
    const l = await lage(p);
    pruefe('am Handy eine Seite nach der anderen: die Antwort ersetzt die Suche',
      !l.zwei && l.eintrag && !l.start && !l.leer && l.zurueckSichtbar, JSON.stringify(l));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Hilfe am Rechner: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Hilfe am Rechner: Liste links, Antwort rechts, am Handy wie vorher — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
