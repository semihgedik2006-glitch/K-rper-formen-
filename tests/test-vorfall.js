/* ══════════════════════════════════════════════════════════════════════
   DATENSCHUTZVORFALL MELDEN — DIE OBERFLÄCHE (P-02, Runde 113)

   Aus dem Betrieb, 25.9.2026:
     „es soll einen knopf geben der mir nach ausfüllung sofort eine mail
      schickt mit einer bestimmten betonung von wichtigkeit"

   Der Server (vorfallMelden) ist in tests/rules/vorfall.test.js
   geprüft, dort auch die Wichtigkeit der Mail. Hier die Oberfläche:
   1. Jede Rolle findet den Eintrag unter „Alles → Was muss ich wissen?".
   2. Leer absenden → Hinweis, kein Aufruf.
   3. Ausgefüllt absenden → das Ergebnis steht im Fenster, und es ist
      EHRLICH: in der Demo „es ging KEINE Mail raus", nicht „gesendet".
   4. Escape schliesst das Fenster.
   5. Die Bedienelemente treffen ≥ 44 × 44 (normal und kompakt), bei
      390 und 1440 px; nichts ragt hinaus.
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
async function zumEintrag(p) {
  await p.evaluate(() => { const a = document.querySelector('#side [data-group="g-alles"], .mobnav [data-group="g-alles"]'); if (a) a.click(); });
  await p.waitForTimeout(600);
  return p.evaluate(() => {
    const e = document.querySelector('#allesLadeInhalt [data-al-vorfall], #allesSeite [data-al-vorfall]');
    if (!e) return null;
    const gruppe = e.closest('.al-gruppe');
    const t = { text: e.textContent.replace(/\s+/g, ' ').trim(), gruppe: gruppe ? gruppe.textContent.slice(0, 40) : '' };
    e.click();
    return t;
  });
}
const sichtbar = (p) => p.evaluate(() => { const m = document.getElementById('vorfallModal'); return !!m && getComputedStyle(m).display !== 'none'; });

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. Jede Rolle findet den Eintrag ──');
  for (const rolle of ['mitarbeiter', 'leiter', 'chef']) {
    const p = await oeffne(b, 390, 844, rolle);
    const e = await zumEintrag(p);
    await p.waitForTimeout(400);
    pruefe(rolle + ': „Datenschutzvorfall melden" unter „Was muss ich wissen?" öffnet das Fenster',
      !!e && /Datenschutzvorfall/.test(e.text) && /wissen/i.test(e.gruppe) && await sichtbar(p), JSON.stringify(e));
    await p.close();
  }

  console.log('\n── 2.–4. Melden ──');
  {
    const p = await oeffne(b, 1440, 900, 'mitarbeiter');
    await zumEintrag(p);
    await p.waitForTimeout(400);
    await p.click('#vfSenden');
    await p.waitForTimeout(300);
    const leer = await p.evaluate(() => ({ fehler: document.getElementById('vfFehler').textContent, form: !document.getElementById('vfForm').hidden }));
    pruefe('leer absenden: Hinweis, das Formular bleibt', /Satz/.test(leer.fehler) && leer.form, JSON.stringify(leer));

    await p.fill('#vfWas', 'Am Empfang lag die Liste mit den Krankmeldungen offen aus.');
    await p.fill('#vfWann', 'heute 09:10');
    await p.selectOption('#vfLaeuft', 'nein');
    await p.click('#vfSenden');
    await p.waitForTimeout(800);
    const erg = await p.evaluate(() => {
      const e = document.getElementById('vfErgebnis');
      return { sichtbar: !e.hidden, text: e.textContent.replace(/\s+/g, ' '), form: !document.getElementById('vfForm').hidden,
               gut: !!e.querySelector('.vf-ergebnis.gut') };
    });
    pruefe('abgesendet: das Ergebnis steht im Fenster, das Formular ist weg', erg.sichtbar && !erg.form, JSON.stringify(erg));
    pruefe('EHRLICH: in der Demo „es ging KEINE Mail raus" — nicht grün, nicht „gesendet"',
      /KEINE Mail/.test(erg.text) && /Demo/.test(erg.text) && !erg.gut && !/die Mail ist raus/.test(erg.text), erg.text);
    await p.click('#vfFertig');
    await p.waitForTimeout(300);
    pruefe('„Schließen" schliesst', !(await sichtbar(p)));

    await zumEintrag(p);
    await p.waitForTimeout(400);
    const frisch = await p.evaluate(() => ({ form: !document.getElementById('vfForm').hidden, was: document.getElementById('vfWas').value }));
    pruefe('wieder geöffnet: ein leeres Formular', frisch.form && frisch.was === '', JSON.stringify(frisch));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
    pruefe('Escape schliesst das Fenster', !(await sichtbar(p)));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 5. Treffen ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h, 'mitarbeiter');
    await zumEintrag(p);
    await p.waitForTimeout(400);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const k = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const els = [...document.querySelectorAll('#vorfallModal button, #vorfallModal input, #vorfallModal select, #vorfallModal textarea')].filter(e => e.offsetParent);
        const zu = [];
        for (const el of els) {
          el.scrollIntoView({ block: 'center' });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el);
          if (m.w < 44 || m.h < 44) zu.push((el.id || el.tagName) + ' ' + m.w + '×' + m.h);
        }
        return { zahl: els.length, zu, quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      pruefe(w + ' px, ' + dichte + ': ' + k.zahl + ' Bedienelemente ≥ 44 × 44, nichts ragt hinaus', k.zahl >= 7 && !k.zu.length && k.quer <= 0, JSON.stringify(k));
    }
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Vorfall melden: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Vorfall melden: für jeden erreichbar, ehrlich im Ergebnis — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
