/* ── Die Stempelseite (Runde 186) ──────────────────────────────────────
   Aus dem Betrieb, 22.10.2026: „die stempel seite … müssen wir auch sehr
   viel verbessern das sie so wie crewmeister funktioniert am besten".
   Und auf die Rückfragen: Soll aus dem Schichtplan „JA", den Stand am
   Terminal weg „ja".

   Geprüft wird, in der Demo (dort laufen die Server-Funktionen nach):

     1. Heute → Ich → „Zeiten": Stand jetzt, heute gearbeitet, laut Plan.
     2. Mit Handy-Freigabe stehen die Knöpfe, die GERADE passen:
        Kommen → Pause + Feierabend → Zurück + Feierabend → Kommen.
        Jeder Knopf schickt, was er stempelt (art). Vorher gab es am
        Handy und am Terminal überhaupt keinen Feierabend.
     3. „Laut Plan" ist die Schicht abzüglich der Pause nach § 4 ArbZG.
     4. Am Rechner zwei Spalten (Jetzt/Woche links, Monat rechts), am
        Handy eine. Nichts ragt seitlich hinaus.
     5. Jedes Bedienelement trifft ≥ 44 × 44 — per elementFromPoint, in
        „normal" und „kompakt", bei 320/390/430/820/1280/1440/1920.
     6. Terminal: nach der PIN Stand und Knöpfe, 64 px hoch, auf jeder
        Breite im Bild.
     7. Leitung: „Jetzt im Studio" mit „Im Dienst" und „Laut Plan
        erwartet"; der Knopf darin trifft ≥ 44.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const BREITEN = [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]];

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
  const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
/* Der Weg eines Menschen: Heute → Ich → Zeiten. */
async function zurSeite(p) {
  return p.evaluate(async () => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    const g = document.querySelector('.mobnav [data-group="g-start"], #side [data-group="g-start"]');
    if (g) { g.click(); await w(500); }
    const s = document.querySelector('#subnav [data-subview="ich"]');
    if (s) { s.click(); await w(500); }
    const t = document.querySelector('[data-ichtab="zeiten"]');
    if (!t) return false;
    t.click(); await w(1500);
    return getComputedStyle(document.getElementById('ichPaneZeiten')).display !== 'none';
  });
}
async function zuVerwaltungZeiten(p) {
  return p.evaluate(async () => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    const g = document.querySelector('.mobnav [data-group="g-chef"], #side [data-group="g-chef"]');
    if (g) { g.click(); await w(700); }
    else {
      const a = document.querySelector('.mobnav [data-group="g-alles"]'); if (!a) return false;
      a.click(); await w(700);
      const v = [...document.querySelectorAll('#view-alles button, #view-alles a')].find(x => /Verwaltung/.test(x.textContent));
      if (!v) return false;
      v.click(); await w(700);
    }
    const c = document.querySelector('#chefHome [data-cgo="zeiten"]');
    if (!c) return false;
    c.click(); await w(1500);
    return true;
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1.–3. Mitarbeiter: Jetzt, Knöpfe nach Stand, Plan ──');
  {
    const p = await oeffne(b, 'mitarbeiter', 390, 844);
    pruefe('Heute → Ich → „Zeiten" öffnet die Stempelseite', await zurSeite(p));
    const v = await p.evaluate(() => ({
      stand: document.getElementById('stStand').textContent,
      ist: document.getElementById('stHeuteIst').textContent,
      soll: document.getElementById('stHeuteSoll').textContent,
      schicht: document.getElementById('stSchicht').textContent,
      woche: document.querySelectorAll('#stWoche .st-tag').length,
      monat: document.querySelectorAll('#ichZeitenListe [data-ztag]').length,
      pin: !!document.getElementById('ichPinKarte') && !!document.getElementById('ichPinKarte').closest('#ichPaneZeiten'),
      knoepfe: [...document.querySelectorAll('#ichHandyKnoepfe [data-handyart]')].map(k => k.getAttribute('data-handyart'))
    }));
    console.log('  JETZT:', JSON.stringify(v));
    pruefe('Stand steht da (vor dem ersten Stempel: „Noch nicht eingestempelt")', /Noch nicht eingestempelt/.test(v.stand), v.stand);
    pruefe('Heute gearbeitet: 0:00 h', v.ist === '0:00 h', v.ist);
    pruefe('Laut Plan: die Schicht der Demo (09:00–14:00 = 5:00 h, unter 6 h keine Pflichtpause)', v.soll === '5:00 h' && /09:00–14:00/.test(v.schicht), v.soll + ' / ' + v.schicht);
    pruefe('Die Woche hat sieben Tage', v.woche === 7, v.woche);
    pruefe('Der Monat steht daneben', v.monat > 5, v.monat);
    pruefe('Die Stempel-PIN liegt jetzt bei den Zeiten', v.pin);
    pruefe('Vor dem ersten Stempel nur „Kommen"', v.knoepfe.join(',') === 'kommen', v.knoepfe.join(','));

    const schritt = (art) => p.evaluate(async (art) => {
      document.getElementById('ichHandyCode').value = '314159';
      document.querySelector('#ichHandyKnoepfe [data-handyart="' + art + '"]').click();
      await new Promise(r => setTimeout(r, 1300));
      return {
        stand: document.getElementById('stStand').textContent,
        knoepfe: [...document.querySelectorAll('#ichHandyKnoepfe [data-handyart]')].map(k => k.getAttribute('data-handyart')),
        feld: document.getElementById('ichHandyCode').value
      };
    }, art);
    const k1 = await schritt('kommen');
    pruefe('Kommen → „Im Dienst seit …", dann Pause UND Feierabend', /Im Dienst seit \d\d:\d\d/.test(k1.stand) && k1.knoepfe.join(',') === 'pause,gehen', JSON.stringify(k1));
    pruefe('… der Code ist danach aus dem Feld', k1.feld === '');
    const k2 = await schritt('pause');
    pruefe('Pause → „In der Pause seit …", dann Zurück UND Feierabend', /In der Pause seit/.test(k2.stand) && k2.knoepfe.join(',') === 'zurueck,gehen', JSON.stringify(k2));
    const k3 = await schritt('gehen');
    pruefe('Feierabend AUS DER PAUSE → „Feierabend seit …", dann wieder Kommen', /Feierabend seit/.test(k3.stand) && k3.knoepfe.join(',') === 'kommen', JSON.stringify(k3));
    const im = await p.evaluate(() => document.querySelectorAll('#ichZeitenListe [data-ztag]').length);
    pruefe('Der neue Tag steht sofort im Monat', im >= 1);

    /* § 4 ArbZG im Rechenkern, ohne Demo-Daten — die Funktionen aus der
       Datei gezogen wie in test-datum.js (das App-Skript ist nicht global). */
    const html = require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
    const hole = (name) => {
      const start = html.indexOf('function ' + name + '(');
      if (start < 0) throw new Error('Funktion fehlt: ' + name);
      let tiefe = 0, i = html.indexOf('{', start);
      for (; i < html.length; i++) { if (html[i] === '{') tiefe++; else if (html[i] === '}' && --tiefe === 0) break; }
      return html.slice(start, i + 1);
    };
    const K = new Function(['stMin', 'stPausePflicht', 'stSollMin', 'stDiffText'].map(hole).join('\n') +
      '; return { stSollMin, stDiffText };')();
    const r = {
      kurz: K.stSollMin([{ from: '09:00', to: '15:00' }]),
      sechsEins: K.stSollMin([{ from: '09:00', to: '15:01' }]),
      lang: K.stSollMin([{ from: '08:00', to: '17:30' }]),
      zwei: K.stSollMin([{ from: '08:00', to: '12:00' }, { from: '13:00', to: '17:00' }]),
      kaputt: K.stSollMin([{ from: '17:00', to: '09:00' }]),
      diff: [K.stDiffText(12 * 60000), K.stDiffText(-90 * 60000), K.stDiffText(0)]
    };
    pruefe('Plan genau 6 h: keine Pflichtpause (360 min)', r.kurz === 360, r.kurz);
    pruefe('Plan 6:01 h: 30 min abgezogen (331 min)', r.sechsEins === 331, r.sechsEins);
    pruefe('Plan 9:30 h: 45 min abgezogen (525 min)', r.lang === 525, r.lang);
    pruefe('zwei Schichten am Tag zählen zusammen (8 h → 450 min)', r.zwei === 450, r.zwei);
    pruefe('eine Schicht mit Ende vor Beginn zählt nicht', r.kaputt === 0, r.kaputt);
    pruefe('Abweichung „+0:12", „−1:30", „±0:00"', r.diff.join(' ') === '+0:12 −1:30 ±0:00', r.diff.join(' '));
    pruefe('ohne Skriptfehler (1)', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 4.+5. Breiten, Spalten, Trefferflächen ──');
  for (const [w, h] of BREITEN) {
    const p = await oeffne(b, 'mitarbeiter', w, h);
    await zurSeite(p);
    const s = await p.evaluate(() => {
      const sp = [...document.querySelectorAll('#ichPaneZeiten > .st-spalte')].map(x => x.getBoundingClientRect());
      return {
        spalten: sp.map(r => Math.round(r.width)),
        nebeneinander: sp.length === 2 && Math.abs(sp[0].top - sp[1].top) < 2 && sp[1].left > sp[0].right,
        quer: document.documentElement.scrollWidth - innerWidth
      };
    });
    if (w >= 1100) pruefe(w + ' px: zwei Spalten nebeneinander (' + s.spalten.join(' + ') + ')', s.nebeneinander && s.spalten[1] > s.spalten[0], JSON.stringify(s));
    else pruefe(w + ' px: eine Spalte', !s.nebeneinander, JSON.stringify(s));
    pruefe(w + ' px: nichts ragt seitlich hinaus', s.quer <= 0, s.quer);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const k = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const pane = document.getElementById('ichPaneZeiten');
        const els = [...pane.querySelectorAll('button, input, [data-ichtab]')].filter(e => e.offsetParent);
        const reiter = [...document.querySelectorAll('[data-ichtab]')].filter(e => e.offsetParent);
        const zu = [];
        for (const el of els.concat(reiter)) {
          el.scrollIntoView({ block: 'center' });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el);
          if (m.w < 44 || m.h < 44) zu.push((el.textContent.trim() || el.id || el.tagName).slice(0, 18) + ' ' + m.w + '×' + m.h);
        }
        return { zahl: els.length + reiter.length, zu };
      }, TREFFER.toString());
      pruefe(w + ' px, ' + dichte + ': jedes Bedienelement ≥ 44 × 44 (' + k.zahl + ' gemessen)', k.zahl >= 8 && !k.zu.length, k.zu.slice(0, 5).join(', '));
    }
    pruefe(w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 6. Terminal: nach der PIN Stand und Knöpfe ──');
  for (const [w, h] of BREITEN) {
    const p = await oeffne(b, 'terminal', w, h);
    const t = await p.evaluate(async (SRC) => {
      const T = eval('(' + SRC + ')');
      const ws = (ms) => new Promise(r => setTimeout(r, ms));
      const liste = document.getElementById('tmListe').innerText;
      document.querySelector('#tmListe [data-tmwer]').click(); await ws(300);
      for (const z of '2946') document.querySelector('[data-tmt="' + z + '"]').click();
      document.querySelector('[data-tmt="ok"]').click(); await ws(900);
      const k = [...document.querySelectorAll('#tmWahlKnoepfe [data-tmart]')];
      const out = k.map(el => { const r = el.getBoundingClientRect(); const m = T(el);
        return { art: el.getAttribute('data-tmart'), w: m.w, h: m.h, imBild: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth }; });
      const zurueck = T(document.getElementById('tmZurueck'));
      return { standAnKachel: /im Dienst|noch nicht da/.test(liste), stand: document.getElementById('tmStand').textContent, out, zurueck };
    }, TREFFER.toString());
    pruefe(w + ' px: an den Kacheln kein Stand', !t.standAnKachel);
    pruefe(w + ' px: nach der PIN der eigene Stand', /seit|Noch nicht/.test(t.stand), t.stand);
    pruefe(w + ' px: Knöpfe ≥ 64 hoch, ≥ 44 breit, im Bild (' + t.out.map(o => o.art + ' ' + o.w + '×' + o.h).join(', ') + ')',
      t.out.length >= 1 && t.out.every(o => o.h >= 64 && o.w >= 44 && o.imBild), JSON.stringify(t.out));
    pruefe(w + ' px: „‹ Zurück" trifft ≥ 44', t.zurueck.w >= 44 && t.zurueck.h >= 44, JSON.stringify(t.zurueck));
    pruefe(w + ' px: ohne Skriptfehler (Terminal)', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 7. Leitung: Jetzt im Studio ──');
  for (const [rolle, w, h] of [['leiter', 390, 844], ['leiter', 1280, 800], ['chef', 1920, 1080], ['chef', 320, 568]]) {
    const p = await oeffne(b, rolle, w, h);
    pruefe(rolle + ' ' + w + ' px: Verwaltung → Zeiten', await zuVerwaltungZeiten(p));
    const j = await p.evaluate(async (SRC) => {
      const T = eval('(' + SRC + ')');
      const box = document.getElementById('zkJetzt');
      const knopf = document.getElementById('zkJetztNeu');
      if (knopf) { knopf.scrollIntoView({ block: 'center' }); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }
      return {
        titel: [...box.querySelectorAll('.zk-j-titel')].map(x => x.textContent),
        text: box.innerText.slice(0, 200),
        knopf: knopf ? T(knopf) : null,
        quer: document.documentElement.scrollWidth - innerWidth
      };
    }, TREFFER.toString());
    pruefe(rolle + ' ' + w + ' px: „Im Dienst" mit Namen und seit wann', j.titel.some(t => /Im Dienst/.test(t)) && /seit \d\d:\d\d/.test(j.text), JSON.stringify(j.titel));
    pruefe(rolle + ' ' + w + ' px: „Laut Plan erwartet" (Schicht begonnen, kein Stempel)', j.titel.some(t => /Laut Plan erwartet/.test(t)), JSON.stringify(j.titel));
    pruefe(rolle + ' ' + w + ' px: „Aktualisieren" trifft ≥ 44', j.knopf && j.knopf.w >= 44 && j.knopf.h >= 44, JSON.stringify(j.knopf));
    pruefe(rolle + ' ' + w + ' px: nichts ragt hinaus', j.quer <= 0, j.quer);
    pruefe(rolle + ' ' + w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Stempelseite: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Stempelseite: Stand jetzt, Pause oder Feierabend, Plan neben Ist, zwei Spalten am Rechner — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
