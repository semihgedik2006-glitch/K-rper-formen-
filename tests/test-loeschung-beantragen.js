/* ══════════════════════════════════════════════════════════════════════
   LÖSCHUNG BEANTRAGEN (App Store 5.1.1(v), docs/APPSTORE.md)

   „Wer ein Konto in der App anlegen kann, muss es in der App auch
   löschen können." Für Teammitglieder heisst das: beantragen, sofort
   gesperrt, die Geschäftsführung schliesst ab — Zeiten und Schichten
   gehören dem Betrieb.

   Die Serverseite (wer darf, Sperre, Regel-Schutz des Feldes) prüft
   tests/rules/loeschantrag.test.js gegen den Emulator. Hier die
   Oberfläche mit der Demo:
   1. Mitarbeiter: Ich → Daten → „Löschung beantragen" öffnet erst die
      Folgen; „Abbrechen" schliesst ohne Folgen; „Ja" zeigt die kleine
      Seite mit „Löschung beantragt" — ohne „Konto löschen", ohne
      Firmencode-Feld.
   2. Geschäftsführung (einzige): der Antrag wird abgelehnt, mit Grund,
      und nichts ist gesperrt.
   3. Geschäftsführung: Verwaltung → Team zeigt „Löschung beantragt"
      mit der Person — und die steht NICHT unter „Wartet auf Freigabe".
      „Wieder freigeben" nimmt sie aus der Karte ins Team,
      „Konto entfernen" nimmt sie ganz heraus.
   4. Treffer ≥ 44 × 44 bei 320 / 390 / 430 / 820 / 1280 / 1440 / 1920,
      normal und kompakt; kein
      Querscrollen.
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

async function oeffne(b, w, h, rolle) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  p.on('dialog', d => d.accept());
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  return p;
}
/* Ich → Daten: über „Alles", wie ein Mensch — zwei Tipps. */
async function zuDaten(p) {
  await p.evaluate(() => { const a = [...document.querySelectorAll('[data-group="g-alles"]')].find(x => x.getClientRects().length); if (a) a.click(); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { const k = document.querySelector('[data-al-ichtab="daten"]'); if (k) k.click(); });
  await p.waitForTimeout(900);
}
async function zuTeam(p) {
  await p.evaluate(() => { const a = [...document.querySelectorAll('[data-group="g-alles"]')].find(x => x.getClientRects().length); if (a) a.click(); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { const k = document.querySelector('[data-al-cgo="team"]'); if (k) k.click(); });
  await p.waitForTimeout(900);
}
const sichtbar = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); return !!e && !!e.getClientRects().length && !e.closest('[hidden]'); }, sel);

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. Mitarbeiter beantragt ──');
  {
    const p = await oeffne(b, 390, 844, 'mitarbeiter');
    await zuDaten(p);
    pruefe('Ich → Daten zeigt „Löschung beantragen"', await sichtbar(p, '#ichLoeschAntrag'));
    pruefe('die Folgen stehen erst nach dem ersten Tipp da', !(await sichtbar(p, '#ichLoeschFrage')));
    await p.evaluate(() => document.getElementById('ichLoeschAntrag').click());
    await p.waitForTimeout(200);
    const f = await p.evaluate(() => ({ auf: !document.getElementById('ichLoeschFrage').hidden,
      ersterWeg: !document.getElementById('ichLoeschAntrag').getClientRects().length,
      folgen: [...document.querySelectorAll('#ichLoeschFrage li')].map(x => x.textContent),
      fokus: document.activeElement && document.activeElement.id }));
    pruefe('ein Tipp öffnet die Folgen, der Fokus steht auf „Abbrechen"', f.auf && f.folgen.length === 3 && f.fokus === 'ichLoeschNein', JSON.stringify(f));
    /* Am Rechner gesehen: .btn schlug das hidden-Attribut, der erste
       Knopf stand neben der offenen Frage. Gemessen, nicht am Attribut. */
    pruefe('solange die Frage offen ist, ist „Löschung beantragen" weg', f.ersterWeg);
    pruefe('die Folgen nennen Sperre, Geschäftsführung und den Weg zurück',
      /gesperrt/.test(f.folgen[0]) && /Geschäftsführung/.test(f.folgen[1]) && /freigeben/.test(f.folgen[2]), JSON.stringify(f.folgen));
    await p.click('#ichLoeschNein');
    await p.waitForTimeout(200);
    pruefe('„Abbrechen" schliesst, nichts passiert', !(await sichtbar(p, '#ichLoeschFrage')) && !(await sichtbar(p, '#warteWrap')));
    await p.evaluate(() => document.getElementById('ichLoeschAntrag').click());
    await p.waitForTimeout(200);
    await p.click('#ichLoeschJa');
    await p.waitForTimeout(1200);
    const m = await p.evaluate(() => ({
      seite: getComputedStyle(document.getElementById('warteWrap')).display !== 'none',
      loesch: !document.getElementById('mkLoeschung').hidden,
      text: document.getElementById('mkLoeschung').textContent.replace(/\s+/g, ' '),
      ohne: !document.getElementById('mkOhne').hidden,
      wartet: !document.getElementById('mkWartet').hidden,
      loeschen: !!document.getElementById('mkLoeschen').getClientRects().length,
    }));
    pruefe('danach: die kleine Seite mit „Löschung beantragt" und Zeitpunkt', m.seite && m.loesch && /Löschung beantragt heute \d\d:\d\d/.test(m.text), JSON.stringify(m));
    pruefe('dort weder Firmencode noch „Anfrage zurückziehen"', !m.ohne && !m.wartet, JSON.stringify(m));
    pruefe('und kein „Konto löschen" — am Betrieb vorbei löscht niemand', !m.loeschen);
    pruefe('der Weg zurück steht dabei', /wieder freigeben/.test(m.text), m.text);
    pruefe('keine Skriptfehler', p._fehler.length === 0, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 2. Die einzige Geschäftsführung ──');
  {
    const p = await oeffne(b, 1440, 900, 'chef');
    await zuDaten(p);
    await p.evaluate(() => document.getElementById('ichLoeschAntrag').click());
    await p.waitForTimeout(200);
    await p.click('#ichLoeschJa');
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => ({ note: document.getElementById('ichLoeschNote').textContent,
      seite: getComputedStyle(document.getElementById('warteWrap')).display !== 'none',
      frage: !document.getElementById('ichLoeschFrage').hidden }));
    pruefe('abgelehnt, mit Grund — und nicht gesperrt', /einzige Geschäftsführung/.test(r.note) && !r.seite && !r.frage, JSON.stringify(r));
    await p.close();
  }

  console.log('\n── 3. Die Geschäftsführung schliesst ab ──');
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await oeffne(b, w, h, 'chef');
    await zuTeam(p);
    const s = await p.evaluate(() => ({
      karte: (() => { const k = document.getElementById('loeschAntragKarte'); return !!k && k.style.display !== 'none' && !!k.getClientRects().length; })(),
      namen: [...document.querySelectorAll('#loeschAntragListe .la-zeile b')].map(x => x.textContent),
      wann: (document.querySelector('#loeschAntragListe .la-wann') || {}).textContent || '',
      freigabe: [...document.querySelectorAll('#freigabeListe .fg-zeile b')].map(x => x.textContent),
      team: (document.getElementById('empList') || {}).textContent.indexOf('Ole Vierkant'),
    }));
    pruefe(w + ' px: Karte „Löschung beantragt" nennt die Person und seit wann',
      s.karte && s.namen.length === 1 && s.namen[0] === 'Ole Vierkant' && /^Beantragt (gestern|\d\d\.\d\d\.) \d\d:\d\d$/.test(s.wann), JSON.stringify(s));
    pruefe(w + ' px: sie steht NICHT unter „Wartet auf Freigabe" und nicht im Team', s.freigabe.indexOf('Ole Vierkant') < 0 && s.freigabe.length >= 1 && s.team < 0, JSON.stringify(s.freigabe));
    if (w === 1440) {
      await p.evaluate(() => document.querySelector('[data-lazurueck="demo-loeschen"]').click());
      await p.waitForTimeout(900);
      const z = await p.evaluate(() => ({
        karte: document.getElementById('loeschAntragKarte').style.display,
        imTeam: (document.getElementById('empList') || {}).textContent.indexOf('Ole Vierkant') >= 0,
      }));
      pruefe('„Wieder freigeben": die Karte ist leer, die Person wieder im Team', z.karte === 'none' && z.imTeam, JSON.stringify(z));
    } else {
      await p.evaluate(() => document.querySelector('[data-laweg="demo-loeschen"]').click());
      await p.waitForTimeout(900);
      const z = await p.evaluate(() => ({
        karte: document.getElementById('loeschAntragKarte').style.display,
        irgendwo: (document.getElementById('empList').textContent + document.getElementById('loeschAntragListe').textContent + document.getElementById('freigabeListe').textContent).indexOf('Ole Vierkant') >= 0,
        toast: document.getElementById('toast').textContent,
      }));
      pruefe('„Konto entfernen": die Person ist ganz heraus', z.karte === 'none' && !z.irgendwo && /entfernt/.test(z.toast), JSON.stringify(z));
    }
    pruefe(w + ' px: keine Skriptfehler', p._fehler.length === 0, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 4. Treffer ──');
  for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    for (const dichte of ['normal', 'kompakt']) {
      /* Die Knöpfe des Mitarbeiters … */
      const p = await oeffne(b, w, h, 'mitarbeiter');
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await zuDaten(p);
      const messen = (sel) => p.evaluate(async ({ SRC, sel }) => {
        const T = eval('(' + SRC + ')');
        const els = [...document.querySelectorAll(sel)].filter(e => e.getClientRects().length);
        const zu = [];
        for (const el of els) { el.scrollIntoView({ block: 'center' }); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el); const r = el.getBoundingClientRect();
          if (m.w < 44 || m.h < 44 || r.left < 0 || r.right > innerWidth) zu.push((el.id || el.textContent.trim().slice(0, 16)) + ' ' + m.w + '×' + m.h); }
        return { zahl: els.length, zu, quer: document.documentElement.scrollWidth - innerWidth };
      }, { SRC: TREFFER.toString(), sel });
      const k1 = await messen('#ichLoeschAntrag');
      await p.evaluate(() => document.getElementById('ichLoeschAntrag').click());
      await p.waitForTimeout(200);
      const k2 = await messen('#ichLoeschJa, #ichLoeschNein');
      pruefe(w + ' px, ' + dichte + ': „Löschung beantragen", „Ja", „Abbrechen" ≥ 44 × 44, im Bild',
        k1.zahl === 1 && k2.zahl === 2 && !k1.zu.length && !k2.zu.length && k1.quer <= 0 && k2.quer <= 0, JSON.stringify([k1, k2]));
      await p.close();
      /* … und die der Geschäftsführung. */
      const q = await oeffne(b, w, h, 'chef');
      await q.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await zuTeam(q);
      const k3 = await q.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const els = [...document.querySelectorAll('#loeschAntragListe button')].filter(e => e.getClientRects().length);
        const zu = [];
        for (const el of els) { el.scrollIntoView({ block: 'center' }); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el); const r = el.getBoundingClientRect();
          if (m.w < 44 || m.h < 44 || r.left < 0 || r.right > innerWidth) zu.push(el.textContent.trim().slice(0, 16) + ' ' + m.w + '×' + m.h); }
        return { zahl: els.length, zu, quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      pruefe(w + ' px, ' + dichte + ': „Konto entfernen", „Wieder freigeben" ≥ 44 × 44, im Bild',
        k3.zahl === 2 && !k3.zu.length && k3.quer <= 0, JSON.stringify(k3));
      await q.close();
    }
  }

  await b.close();
  console.log('\n' + gut + ' bestanden, ' + schlecht + ' gefallen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
