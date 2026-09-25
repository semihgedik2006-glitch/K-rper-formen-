/* ══════════════════════════════════════════════════════════════════════
   SCHWARZES BRETT: FÜR WEN (Runde 121)

   Aus dem Betrieb, 25.9.2026 — die Reihenfolge: „… dann die Anliegen am
   rechner, dann die studiogrenze …". Vorbild sind die Dokumente: „JA
   aber man kann selber entscheiden ob alle oder nur studio".

   Die Regel selbst prüft tests/rules/brett.test.js gegen den Emulator.
   Hier die App mit den Demo-Daten (zwei Aushänge nur für ein Studio:
   einer für Hürth, einer für Brühl):
   1. Die Mitarbeiterin aus Hürth sieht den für Hürth, NICHT den für
      Brühl — und fragt nie ungefiltert (das würde die Regel ablehnen).
   2. Der Chef sieht beide, jeweils mit „Nur …" an der Karte.
   3. „Für wen" bietet der Mitarbeiterin nur „Alle" und ihr Studio an,
      dem Chef jedes; ein Aushang „Nur Hürth" wird mit studios:[…]
      geschrieben und trägt das Schild.
   4. Treffer ≥ 44 × 44 für „Für wen", „Anpinnen" und „Umfrage stellen"
      bei 320 / 390 / 430 / 820 / 1280 / 1440 / 1920, normal und kompakt.
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
async function oeffne(b, rolle, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  /* Die Abfragen ans Brett mitschreiben (Haken in demo-daten.js). */
  await p.evaluate(() => { window.DEMO_ABFRAGEN = []; });
  /* Der Weg wie im Studio: „Alles" → „Schwarzes Brett". */
  await p.evaluate(() => {
    [...document.querySelectorAll('[data-group="g-alles"]')].find(x => x.getClientRects().length).click();
  });
  await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('[data-al-teamtab="brett"]').click());
  await p.waitForTimeout(1200);
  /* „Aushang schreiben" ist eingeklappt — aufklappen wie im Studio. */
  await p.evaluate(() => { const k = document.querySelector('[data-fold="brettneu"].zu .fold-head'); if (k) k.click(); });
  await p.waitForTimeout(300);
  return p;
}
const brett = (p) => p.evaluate(() => ({
  karten: [...document.querySelectorAll('#bbList .bb-item')].map(k => ({
    text: ((k.querySelector('.bb-text') || {}).textContent || '').slice(0, 40),
    fuer: (k.querySelector('.bb-fuer') || {}).textContent || '',
  })),
  fuer: [...document.querySelectorAll('#bbFuer option')].map(o => o.value + '=' + o.textContent),
  abfragen: (window.DEMO_ABFRAGEN || []).filter(a => /(^|\/)board$/.test(a.pfad)).map(a => a.wo.join(' & ') || '(ungefiltert)'),
}));

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. Mitarbeiterin (Hürth) ──');
  {
    const p = await oeffne(b, 'mitarbeiter', 390, 844);
    const s = await brett(p);
    const schilder = s.karten.map(k => k.fuer).filter(Boolean);
    pruefe('sieht den Aushang „Nur Hürth"', schilder.includes('Nur Hürth'), JSON.stringify(s.karten));
    pruefe('… aber NICHT den für Brühl', !schilder.some(t => /Brühl/.test(t)), JSON.stringify(schilder));
    pruefe('die übrigen (für alle) ohne Schild sind da', s.karten.filter(k => !k.fuer).length >= 3, String(s.karten.length));
    pruefe('keine ungefilterte Abfrage ans Brett (die Regel lehnte sie ab)',
      s.abfragen.length > 0 && !s.abfragen.includes('(ungefiltert)'), JSON.stringify(s.abfragen));
    pruefe('„Für wen": nur „Alle Studios" und Hürth',
      s.fuer.length === 2 && s.fuer[0] === 'all=Alle Studios' && s.fuer[1] === 'studio-6=Nur Hürth', JSON.stringify(s.fuer));

    await p.fill('#bbText', 'Wer tauscht Samstag?');
    await p.selectOption('#bbFuer', 'studio-6');
    await p.click('#bbAdd');
    await p.waitForTimeout(800);
    const s2 = await brett(p);
    const neu = s2.karten.find(k => /Wer tauscht Samstag/.test(k.text));
    pruefe('Aushang „Nur Hürth" steht oben mit Schild', !!neu && neu.fuer === 'Nur Hürth', JSON.stringify(s2.karten.slice(0, 3)));
    /* Direkt aus der Demo-Datenbank gelesen, nicht aus der Anzeige. */
    const gespeichert = await p.evaluate(async () => {
      const db = firebase.firestore();
      for (const pfad of ['firmen/koerperformen/board', 'board']) {
        const sn = await db.collection(pfad).get();
        const d = sn.docs.map(x => x.data()).find(x => /Wer tauscht Samstag/.test(x.text || ''));
        if (d) return JSON.stringify(d.studios);
      }
      return null;
    });
    pruefe('… gespeichert als studios: ["studio-6"]', gespeichert === '["studio-6"]', String(gespeichert));
    pruefe('keine Skriptfehler', p._fehler.length === 0, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 2. Chef ──');
  {
    const p = await oeffne(b, 'chef', 1440, 900);
    const s = await brett(p);
    const schilder = s.karten.map(k => k.fuer).filter(Boolean);
    pruefe('sieht beide: „Nur Hürth" und „Nur Brühl"', schilder.includes('Nur Hürth') && schilder.includes('Nur Brühl'), JSON.stringify(schilder));
    pruefe('„Für wen": alle Studios und jedes einzelne', s.fuer.length === 15 && s.fuer[0] === 'all=Alle Studios', String(s.fuer.length));
    pruefe('keine Skriptfehler', p._fehler.length === 0, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 4. Treffer ≥ 44 × 44 ──');
  const ziele = ['#bbFuer', '#bbAdd', '#bbPoll'];
  for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, 'mitarbeiter', w, h);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const zu = [];
      for (const sel of ziele) {
        await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel);
        await p.waitForTimeout(80);
        const t = await p.evaluate(`(${TREFFER.toString()})(document.querySelector(${JSON.stringify(sel)}))`);
        const r = await p.evaluate((s) => { const q = document.querySelector(s).getBoundingClientRect(); return { l: q.left, r: q.right }; }, sel);
        if (t.w < 44 || t.h < 44 || r.l < 0 || r.r > w) zu.push(sel + ' ' + t.w + '×' + t.h + ' (' + Math.round(r.l) + '…' + Math.round(r.r) + ')');
      }
      const quer = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      pruefe(w + ' × ' + h + ' ' + dichte + ': alle Treffer ≥ 44, im Bild, kein Querscrollen', zu.length === 0 && quer <= 0, zu.join(', ') + ' quer ' + quer);
    }
    await p.close();
  }

  await b.close();
  console.log('\n' + gut + ' bestanden, ' + schlecht + ' gefallen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
