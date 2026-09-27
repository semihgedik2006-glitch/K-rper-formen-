/* ══════════════════════════════════════════════════════════════════════
   ZWEI-FAKTOR ZURÜCKSETZEN (Runde 124)

   docs/ZWEI-FAKTOR.md, Stufe 2: „Handy verloren → der zweite Faktor muss
   sich entfernen lassen, sonst ist das Konto zu." Aus dem Betrieb,
   25.9.2026: 2FA „ja für chefs, Admin und studioleiter accounts" — und
   bevor sie Pflicht wird, muss es den Weg zurück geben.

   Die Serverseite (wer darf, wer nicht, Protokoll, Regel) prüft
   tests/rules/zweifaktor.test.js gegen den Emulator. Hier die
   Oberfläche mit der Demo (Geschäftsführung):
   1. „Zurücksetzen" steht NUR bei eingerichtetem Faktor und NIE beim
      eigenen Konto.
   2. Ohne Grund passiert nichts (Hinweis), mit Grund: Zeile steht auf
      „noch offen", das Protokoll darunter nennt Person und Grund.
   3. Abbrechen schliesst das Formular ohne Folgen.
   4. Treffer ≥ 44 × 44 für „Zurücksetzen" und die Formularknöpfe bei
      390 / 1440, normal und kompakt; kein Querscrollen.
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

async function oeffne(b, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { const a = [...document.querySelectorAll('[data-group="g-alles"]')].find(x => x.getClientRects().length); if (a) a.click(); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { const k = document.querySelector('[data-al-cgo="team"]'); if (k) k.click(); });
  await p.waitForTimeout(900);
  await p.evaluate(() => { const k = document.getElementById('zfStandKarte'); if (k && k.classList.contains('zu')) k.querySelector('.fold-head').click(); });
  await p.waitForTimeout(600);
  return p;
}
const stand = (p) => p.evaluate(() => ({
  zeilen: [...document.querySelectorAll('#zfStand .zf-liste li')].map(li => ({
    name: (li.querySelector('b') || {}).textContent || '',
    an: !!li.querySelector('.zf-marke.an'),
    knopf: !!li.querySelector('[data-zfweg]'),
    uid: (li.querySelector('[data-zfweg]') || { getAttribute: () => '' }).getAttribute('data-zfweg'),
  })),
  ich: window.__ichName || (document.querySelector('.tb-name, #uName') || {}).textContent || '',
  form: !document.getElementById('zfWegForm') ? null : !document.getElementById('zfWegForm').hidden,
  prot: [...document.querySelectorAll('#zfProtokoll li')].map(li => li.textContent.replace(/\s+/g, ' ')),
  summe: (document.querySelector('#zfStand .zf-summe') || {}).textContent || '',
}));

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1.–3. Zurücksetzen in der Team-Karte ──');
  {
    const p = await oeffne(b, 1440, 900);
    const s0 = await stand(p);
    const mitKnopf = s0.zeilen.filter(z => z.knopf);
    /* Name und Rolle untereinander — auch in der Zeile MIT Knopf. Dort
       standen sie zuerst in einer Zeile („Piet WinterStudioleitung"). */
    const lagen = await p.evaluate(() => [...document.querySelectorAll('#zfStand .zf-liste li')].map(li => {
      const b = li.querySelector('b').getBoundingClientRect(), s = li.querySelector('small').getBoundingClientRect();
      return { knopf: !!li.querySelector('[data-zfweg]'), untereinander: s.top >= b.bottom - 2 };
    }));
    pruefe('Name und Rolle stehen untereinander, auch in der Zeile mit Knopf', lagen.length && lagen.every(x => x.untereinander) && lagen.some(x => x.knopf), JSON.stringify(lagen.filter(x => x.knopf)));
    pruefe('„Zurücksetzen" nur bei eingerichtetem Faktor', mitKnopf.length >= 1 && s0.zeilen.every(z => z.knopf === z.an || (z.an && !z.knopf)), JSON.stringify(s0.zeilen));
    const eigeneUid = await p.evaluate(() => { try { return firebase.auth().currentUser.uid; } catch (e) { return ''; } });
    pruefe('nie beim eigenen Konto', !s0.zeilen.some(z => z.uid && z.uid === eigeneUid), eigeneUid);
    const ziel = mitKnopf[0];

    await p.evaluate((uid) => document.querySelector('[data-zfweg="' + uid + '"]').click(), ziel.uid);
    await p.waitForTimeout(200);
    const f = await p.evaluate(() => ({ auf: !document.getElementById('zfWegForm').hidden, text: document.getElementById('zfWegText').textContent, fokus: document.activeElement && document.activeElement.id }));
    pruefe('ein Klick öffnet das Formular mit dem Namen, der Cursor steht im Grund', f.auf && f.text.indexOf(ziel.name) >= 0 && f.fokus === 'zfWegGrund', JSON.stringify(f));

    await p.click('#zfWegOk');
    await p.waitForTimeout(400);
    const s1 = await stand(p);
    pruefe('ohne Grund passiert nichts — der Faktor bleibt', s1.zeilen.find(z => z.name === ziel.name).an && s1.form === true, JSON.stringify(s1.zeilen));

    await p.click('#zfWegAbbruch');
    await p.waitForTimeout(200);
    const s2 = await stand(p);
    pruefe('Abbrechen schliesst das Formular, nichts geändert', s2.form === false && s2.zeilen.find(z => z.name === ziel.name).an, JSON.stringify(s2));

    await p.evaluate((uid) => document.querySelector('[data-zfweg="' + uid + '"]').click(), ziel.uid);
    await p.waitForTimeout(200);
    await p.fill('#zfWegGrund', 'Handy verloren');
    await p.click('#zfWegOk');
    await p.waitForTimeout(1200);
    const s3 = await stand(p);
    const z3 = s3.zeilen.find(z => z.name === ziel.name);
    pruefe('mit Grund: die Zeile steht auf „noch offen", ohne Knopf', z3 && !z3.an && !z3.knopf, JSON.stringify(s3.zeilen));
    pruefe('das Protokoll darunter nennt Person und Grund', s3.prot.length === 1 && s3.prot[0].indexOf(ziel.name) >= 0 && /Handy verloren/.test(s3.prot[0]), JSON.stringify(s3.prot));
    pruefe('keine Skriptfehler', p._fehler.length === 0, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 4. Treffer ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h);
    const uid = await p.evaluate(() => (document.querySelector('[data-zfweg]') || { getAttribute: () => '' }).getAttribute('data-zfweg'));
    await p.evaluate((uid) => { const k = document.querySelector('[data-zfweg="' + uid + '"]'); if (k) k.click(); }, uid);
    await p.waitForTimeout(250);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const k = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const els = [...document.querySelectorAll('#zfStand [data-zfweg], #zfWegOk, #zfWegAbbruch, #zfWegGrund')].filter(e => e.getClientRects().length);
        const zu = [];
        for (const el of els) { el.scrollIntoView({ block: 'center' }); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el); const r = el.getBoundingClientRect();
          if (m.w < 44 || m.h < 44 || r.left < 0 || r.right > innerWidth) zu.push((el.id || el.textContent.trim().slice(0, 16)) + ' ' + m.w + '×' + m.h); }
        return { zahl: els.length, zu, quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      pruefe(w + ' px, ' + dichte + ': „Zurücksetzen", Grund und beide Knöpfe ≥ 44 × 44, im Bild', k.zahl >= 4 && !k.zu.length && k.quer <= 0, JSON.stringify(k));
    }
    await p.close();
  }

  await b.close();
  console.log('\n' + gut + ' bestanden, ' + schlecht + ' gefallen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
