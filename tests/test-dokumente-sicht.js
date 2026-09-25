/* ══════════════════════════════════════════════════════════════════════
   DOKUMENTE: WER SIEHT WAS (P-01, Runde 114) — die Oberfläche

   Aus dem Betrieb, 25.9.2026: „JA aber man kann selber entscheiden ob
   alle oder nur studio". Die Regel ist in tests/rules/dokumente.test.js
   geprüft (auch als Abfrage). Hier die App, in der Demo:

   1. Die Mitarbeiterin aus Hürth sieht die drei Dokumente „für alle"
      und die Schlüsselliste Hürth — NICHT die Schlüsselliste Brühl.
      Die App fragt dafür zweimal gefiltert (die ungefilterte Abfrage
      liesse die Regel nicht mehr zu).
   2. Der Chef sieht alle fünf und darüber „Wer sieht was: 3 für alle
      Studios · 2 nur für einzelne Studios", aufklappbar mit Namen und
      Studios. Die Zeile trifft ≥ 44 hoch.
   3. Beim Hochladen gibt es weiter die Wahl „Alle Studios" oder
      einzelne — die Entscheidung liegt beim, der hochlädt.
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
async function oeffne(b, w, h, rolle) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  await p.evaluate(() => { const a = document.querySelector('#side [data-group="g-alles"], .mobnav [data-group="g-alles"]'); if (a) a.click(); });
  await p.waitForTimeout(500);
  await p.evaluate(() => { const k = document.querySelector('#allesLadeInhalt [data-alles="docs"], #allesSeite [data-alles="docs"]'); if (k) k.click(); });
  await p.waitForTimeout(1200);
  return p;
}
const namen = (p) => p.evaluate(() => [...document.querySelectorAll('#docList .doc')].map(d => d.textContent.replace(/\s+/g, ' ').trim()));

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── Mitarbeiterin (Hürth) ──');
  {
    const p = await oeffne(b, 390, 844, 'mitarbeiter');
    const n = await namen(p);
    pruefe('die drei „für alle" sind da', ['Hygieneplan', 'Einweisung EMS', 'Notfallnummern'].every(x => n.some(t => t.includes(x))), n.join(' | '));
    pruefe('die Schlüsselliste IHRES Studios ist da', n.some(t => /Schlüsselliste Hürth/.test(t)), n.join(' | '));
    pruefe('die Schlüsselliste eines ANDEREN Studios nicht', !n.some(t => /Schlüsselliste Brühl/.test(t)), n.join(' | '));
    const sicht = await p.evaluate(() => { const s = document.getElementById('docSicht'); return !!s && !s.hidden; });
    pruefe('„Wer sieht was" steht bei ihr nicht', !sicht);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  for (const [w, h] of [[390, 844], [1440, 900]]) {
    console.log('\n── Chef, ' + w + ' px ──');
    const p = await oeffne(b, w, h, 'chef');
    const n = await namen(p);
    pruefe('der Chef sieht alle fünf', n.length === 5, n.length + ': ' + n.join(' | '));
    const s = await p.evaluate(() => {
      const box = document.getElementById('docSicht');
      const sum = box && box.querySelector('summary');
      if (!sum) return null;
      const r = sum.getBoundingClientRect();
      sum.click();
      return { text: box.textContent.replace(/\s+/g, ' '), hoch: Math.round(r.height), breit: Math.round(r.width) };
    });
    pruefe('„Wer sieht was: 3 für alle Studios · 2 nur für einzelne Studios"', !!s && /3 für alle Studios · 2 nur für einzelne Studios/.test(s.text), s && s.text.slice(0, 120));
    pruefe('aufgeklappt: Namen und Studios', !!s && /Schlüsselliste Hürth — Hürth/.test(s.text) && /Schlüsselliste Brühl — Brühl/.test(s.text), s && s.text.slice(0, 300));
    pruefe('die Zeile trifft ≥ 44 hoch (' + (s && s.hoch) + ' px)', !!s && s.hoch >= 44);
    const wahl = await p.evaluate(() => ({ alle: !!document.getElementById('docAll'), einzeln: !!document.getElementById('docStudios') }));
    pruefe('beim Hochladen: „Alle Studios" oder einzelne', wahl.alle && wahl.einzeln);
    const quer = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    pruefe('nichts ragt seitlich hinaus', quer <= 0, String(quer));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Dokumente, wer sieht was: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Dokumente: jeder sieht, was für ihn bestimmt ist; der Chef sieht, wer was sieht — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
