/* ══════════════════════════════════════════════════════════════════════
   VERWALTUNG AM RECHNER: LISTE LINKS, FORMULARE RECHTS (Runde 112)

   CLAUDE.md, „Der PC ist das Hauptgerät": „Eine Ansicht, die am Rechner
   eine Spalte über 1.200 px zieht, ist dort genauso ungestaltet wie ein
   abgeschnittener Knopf auf dem Handy." Aus dem Betrieb, 25.9.2026:
   „mach weiter mit design sachen".

   Geprüft bei 1280 / 1440 / 1920 (Geschäftsführung):
   1. Team: die Teamliste links, „Zugang anlegen" rechts, oben bündig.
      Studios: die Liste links, „Studio anlegen" rechts. System: das Abo
      links, „Neues Design" rechts.
   2. Eine Karte rechts aufklappen verschiebt links nichts (zwei echte
      Spalten, kein gemeinsames Raster).
   3. Nichts ragt seitlich hinaus; Stichprobe der Trefferflächen in der
      rechten Spalte ≥ 44 × 44, normal und kompakt.
   GEGENPROBEN:
   4. Studioleitung: im System sieht sie rechts nichts — dann EINE
      Spalte, keine leere daneben.
   5. Handy (390 px): die Karten stehen in derselben Reihenfolge wie
      vorher untereinander (data-vw = die alte Reihenfolge).
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
async function oeffne(b, w, h, rolle) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
async function reiter(p, id) {
  await p.evaluate(() => { const a = document.querySelector('#side [data-group="g-alles"], .mobnav [data-group="g-alles"]'); if (a) a.click(); });
  await p.waitForTimeout(500);
  await p.evaluate(() => { const k = document.querySelector('#allesLadeInhalt [data-alles="chef"], #allesSeite [data-alles="chef"]'); if (k) k.click(); });
  await p.waitForTimeout(700);
  await p.evaluate((id) => { const t = document.querySelector('[data-ctab="' + id + '"]'); if (t) t.click(); }, id);
  await p.waitForTimeout(900);
}
const kasten = (p, sel) => p.evaluate((sel) => {
  const e = document.querySelector(sel); if (!e || !e.offsetParent) return null;
  const k = e.getBoundingClientRect(); return { l: Math.round(k.left), r: Math.round(k.right), t: Math.round(k.top), w: Math.round(k.width) };
}, sel);
const nebeneinander = (a, b) => !!a && !!b && b.l >= a.r - 1 && Math.abs(a.t - b.t) < 6 && a.w > b.w;

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const FAELLE = [
    /* Seit Runde 117 steht in der Demo eine Anfrage in „Wartet auf
       Freigabe" — ganz oben in der linken Spalte, über der Teamliste.
       Nebeneinander stehen deshalb die OBERSTEN Karten beider Spalten;
       dass die Teamliste in der linken Spalte steht, prüft die Zeile
       direkt nach der Schleife. */
    ['team', '[data-cpane="team"] .vw-haupt > .card:not([style*="none"])', '[data-cpane="team"] [data-fold="zugang"]', 'Team: links Freigaben und Teamliste, „Zugang anlegen" rechts'],
    ['standorte', '[data-cpane="standorte"] .vw-haupt > .card', '[data-cpane="standorte"] [data-fold="studioneu"]', 'Studios: Liste links, „Studio anlegen" rechts'],
    ['system', '#aboKarte', '[data-cpane="system"] .vw-neben > .card:not([style*="none"])', 'System: Abo links, „Neues Design" rechts'],
    /* Runde 116: Nachweise und Auswertung. */
    ['nachweise', '[data-cpane="nachweise"] [data-fold="allenachweise"]', '[data-cpane="nachweise"] .vw-neben > .card', 'Nachweise: alle links, „Läuft demnächst ab" rechts'],
    ['report', '[data-cpane="report"] .vw-haupt > .card', '[data-cpane="report"] [data-fold="repstudios"]', 'Auswertung: Bericht links, Studios und Personen rechts']
  ];
  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
    console.log('\n── ' + w + ' × ' + h + ' ──');
    const p = await oeffne(b, w, h, 'chef');
    for (const [id, links, rechts, was] of FAELLE) {
      await reiter(p, id);
      await p.evaluate(() => { const s = document.querySelector('#view-chef .scroll-area'); if (s) s.scrollTop = 0; });
      await p.waitForTimeout(200);
      const L = await kasten(p, links), R = await kasten(p, rechts);
      pruefe(was, nebeneinander(L, R), JSON.stringify({ L, R }));
    }
    await reiter(p, 'team');
    await p.evaluate(() => { const s = document.querySelector('#view-chef .scroll-area'); if (s) s.scrollTop = 0; });
    const oben = await kasten(p, '[data-cpane="team"] .vw-haupt > .card:not([style*="none"])');
    const liste = await kasten(p, '[data-cpane="team"] [data-fold="teamliste"]');
    pruefe('Team: die Teamliste steht in der linken Spalte (unter den Freigaben)',
      !!oben && !!liste && liste.l === oben.l && liste.t >= oben.t, JSON.stringify({ oben, liste }));
    /* Eine zugeklappte Karte links liess neben der vollen rechten Spalte
       eine leere Fläche stehen („Alle Nachweise": 99 px hoch). Am
       Rechner startet die Hauptspalte deshalb offen. */
    await reiter(p, 'nachweise');
    const zuLinks = await p.evaluate(() => [...document.querySelectorAll('.chef-pane.vw .vw-haupt > .card.fold')]
      .filter(k => k.classList.contains('zu')).map(k => k.getAttribute('data-fold')));
    pruefe('am Rechner ist in der Hauptspalte nichts zugeklappt', !zuLinks.length, JSON.stringify(zuLinks));

    /* 2. Rechts aufklappen, links bleibt stehen. */
    await reiter(p, 'team');
    await p.evaluate(() => { const s = document.querySelector('#view-chef .scroll-area'); if (s) s.scrollTop = 0; });
    const vorher = await kasten(p, '[data-cpane="team"] [data-fold="chefzugaenge"]');
    const zu = await p.evaluate(() => {
      const k = document.querySelector('[data-cpane="team"] [data-fold="onboarding"]');
      const kopf = k && k.querySelector('h3');
      const war = k && k.getBoundingClientRect().height;
      if (kopf) kopf.click();
      return war;
    });
    await p.waitForTimeout(600);
    const nachher = await kasten(p, '[data-cpane="team"] [data-fold="chefzugaenge"]');
    const hoehe = await p.evaluate(() => document.querySelector('[data-cpane="team"] [data-fold="onboarding"]').getBoundingClientRect().height);
    pruefe('„Onboarding" rechts auf-/zugeklappt (' + Math.round(zu) + ' → ' + Math.round(hoehe) + ' px): links steht „Chef-Zugänge" still',
      !!vorher && !!nachher && Math.abs(hoehe - zu) > 20 && vorher.t === nachher.t && vorher.l === nachher.l, JSON.stringify({ vorher, nachher }));

    /* 3. Seitlich und Trefferflächen. „Zugang anlegen" aufklappen, damit
       es etwas zu messen gibt; in zugeklappten Karten liegen Felder mit
       0 Höhe, die niemand treffen soll. */
    await p.evaluate(() => {
      const k = document.querySelector('[data-cpane="team"] [data-fold="zugang"]');
      const kopf = k && k.querySelector('.fold-head, h3');
      if (k && k.classList.contains('zu') && kopf) kopf.click();
    });
    await p.waitForTimeout(600);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const k = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const els = [...document.querySelectorAll('[data-cpane="team"] .vw-neben button, [data-cpane="team"] .vw-neben input, [data-cpane="team"] .vw-neben select')]
          .filter(e => e.offsetParent && !e.closest('.card.fold.zu') && e.getBoundingClientRect().width > 0 && e.type !== 'checkbox').slice(0, 12);
        const zu = [];
        for (const el of els) {
          el.scrollIntoView({ block: 'center' });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el);
          if (m.w < 44 || m.h < 44) zu.push((el.textContent.trim() || el.id || el.tagName).slice(0, 18) + ' ' + m.w + '×' + m.h);
        }
        return { zahl: els.length, zu, quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      pruefe(dichte + ': rechte Spalte, Bedienelemente ≥ 44 × 44 (' + k.zahl + ' gemessen), nichts ragt hinaus',
        k.zahl >= 3 && !k.zu.length && k.quer <= 0, JSON.stringify(k));
    }
    await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── GEGENPROBEN ──');
  {
    const p = await oeffne(b, 1440, 900, 'leiter');
    await reiter(p, 'system');
    const r = await p.evaluate(() => {
      const pane = document.querySelector('[data-cpane="system"]');
      const neben = pane.querySelector('.vw-neben');
      const karte = pane.querySelector('.vw-haupt > .card:not([style*="none"])');
      return { spalten: getComputedStyle(pane).gridTemplateColumns, nebenSichtbar: !!(neben && neben.offsetParent),
               breite: karte ? Math.round(karte.getBoundingClientRect().width) : 0 };
    });
    pruefe('Studioleitung im System: rechts nichts → eine Spalte (' + r.breite + ' px breit), keine leere daneben',
      !r.nebenSichtbar && r.breite > 800, JSON.stringify(r));
    await p.close();
  }
  {
    const p = await oeffne(b, 390, 844, 'chef');
    const aus = [];
    for (const id of ['team', 'standorte', 'system', 'nachweise', 'report']) {
      await reiter(p, id);
      const r = await p.evaluate((id) => {
        const karten = [...document.querySelectorAll('[data-cpane="' + id + '"] [data-vw]')].filter(k => k.offsetParent);
        karten.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
        const folge = karten.map(k => +k.getAttribute('data-vw'));
        const breite = karten.map(k => Math.round(k.getBoundingClientRect().left));
        return { folge, links: [...new Set(breite)] };
      }, id);
      const ok = r.folge.length > 1 && r.folge.every((v, i) => i === 0 || v > r.folge[i - 1]) && r.links.length === 1;
      if (!ok) aus.push(id + ': ' + JSON.stringify(r));
    }
    pruefe('Handy: Team, Studios, System, Nachweise und Auswertung untereinander in der alten Reihenfolge', !aus.length, aus.join(' | '));
    const zuHandy = await p.evaluate(() => document.querySelector('[data-cpane="nachweise"] [data-fold="allenachweise"]').classList.contains('zu'));
    pruefe('Handy: „Alle Nachweise" startet zugeklappt wie bisher', zuHandy);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Verwaltung am Rechner: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Verwaltung am Rechner: Liste links, Formulare rechts, am Handy wie vorher — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
