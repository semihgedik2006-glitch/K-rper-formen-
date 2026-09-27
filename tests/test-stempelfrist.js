/* ══════════════════════════════════════════════════════════════════════
   STEMPELZEITEN: AUFBEWAHRUNG IN DER VERWALTUNG (Runde 127, P-08)

   Aus dem Betrieb, 27.9.2026: „3 Jahre". Die Löschung selbst prüft
   tests/rules/stempelfrist.test.js gegen den Emulator. Hier die Karte,
   die VORHER zeigt, was die Frist trifft (Demo, Geschäftsführung):
   1. Verwaltung → System hat die Karte „Stempelzeiten: Aufbewahrung",
      mit Frist, ältestem Eintrag und den beiden Zahlen.
   2. Keine Namen in der Karte.
   3. Die Datenschutzerklärung nennt die drei Jahre.
   4. Am Handy bleibt die Reihenfolge der System-Karten stetig (data-vw).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const fehler = [];
    p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => localStorage.setItem('kf_tour', '99:demo-ich'));
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3000);
    await p.evaluate(() => { const a = [...document.querySelectorAll('[data-group="g-alles"]')].find(x => x.getClientRects().length); if (a) a.click(); });
    await p.waitForTimeout(400);
    await p.evaluate(() => { const k = document.querySelector('[data-al-cgo="system"]'); if (k) k.click(); });
    await p.waitForTimeout(1200);
    await p.evaluate(() => { const k = document.getElementById('sfKarte'); if (k && k.classList.contains('zu')) k.querySelector('.fold-head').click(); });
    await p.waitForTimeout(400);
    const k = await p.evaluate(() => {
      const el = document.getElementById('sfKarte');
      return el ? { sichtbar: !!el.getClientRects().length, text: el.textContent.replace(/\s+/g, ' ') } : null;
    });
    pruefe(w + ' px: die Karte ist da und nennt drei Jahre', !!k && k.sichtbar && /drei Jahre/.test(k.text), JSON.stringify(k));
    pruefe(w + ' px: ältester Eintrag, Grenze und die beiden Zahlen stehen da',
      !!k && /Ältester Eintrag: \d\d\.\d\d\.\d{4}/.test(k.text) && /vor dem \d\d\.\d\d\.\d{4} liegt: \d+ Eintr/.test(k.text) && /30 Tagen fällig: \d+ Eintr/.test(k.text), k && k.text);
    /* Gegen die echten Namen des Teams, nicht gegen ein Muster. */
    const namen = await p.evaluate(() => window.firebase.firestore().collection('users').get().then(s => {
      const t = document.getElementById('sfKarte').textContent;
      return s.docs.map(d => (d.data() || {}).name).filter(n => n && t.indexOf(n) >= 0);
    }));
    pruefe(w + ' px: keine Namen in der Karte', namen.length === 0, JSON.stringify(namen));
    if (w === 390) {
      const folge = await p.evaluate(() => [...document.querySelectorAll('[data-cpane="system"] [data-vw]')].filter(x => x.offsetParent)
        .map(x => ({ vw: +x.getAttribute('data-vw'), top: x.getBoundingClientRect().top })).sort((a, b) => a.top - b.top).map(x => x.vw));
      pruefe('390 px: die System-Karten stehen in ihrer Reihenfolge (' + folge.join(',') + ')', folge.every((v, i) => !i || v > folge[i - 1]), folge.join(','));
    }
    pruefe(w + ' px: keine Skriptfehler', !fehler.length, fehler.join(' | '));
    await p.close();
  }
  /* 3. Datenschutzerklärung */
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  const text = await p.evaluate(() => { const a = document.querySelector('[data-rechtauf="datenschutz"]'); if (a) a.click(); return new Promise(r => setTimeout(() => r(document.body.innerText), 600)); });
  pruefe('3. die Datenschutzerklärung nennt „drei Jahre" für Stempelzeiten', /Stempelzeiten werden drei Jahre nach ihrem Tag gelöscht/.test(text));
  await p.close();

  await b.close();
  console.log('\n' + gut + ' bestanden, ' + schlecht + ' gefallen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
