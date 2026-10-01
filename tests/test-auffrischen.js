/* ══════════════════════════════════════════════════════════════════════
   KURZ AUFFRISCHEN (Runde 134, DESIGN-RECHERCHE E2)

   Zwei Wochen nach einer bestandenen Schulung steht oben unter „Schulung"
   EINE Frage daraus. Richtig: fertig. Falsch: die richtige Antwort und der
   Hinweis. Kein neuer Durchlauf, kein Nachweis.

   „Wird es als Kontrolle empfunden, schadet es." Geprüft wird deshalb vor
   allem, was NICHT passiert:
   1. Es wird NICHTS in die Datenbank geschrieben — kein Lauf, keine Antwort.
   2. Unter 14 Tagen erscheint keine Frage (Gegenprobe über die Uhr).
   3. Nach „Fertig" ist die Karte weg und bleibt es nach dem Neuladen.
   4. Die Karte sagt selbst, dass die Antwort nicht gespeichert wird.
   5. Fingerziele ≥ 44 × 44 per Hit-Test bei 320/390/430/820/1280/1440/1920,
      normal und kompakt; kein waagerechtes Scrollen.

   Gegen die Demo: dort hat das angemeldete Konto einen bestandenen
   Durchlauf „Wenn einem Kunden schlecht wird" von vor 16 Tagen.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 200) : '')); }
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

async function oeffne(b, w, h, vorher) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((v) => {
    localStorage.setItem('kf_tour', '99:demo-ich');
    if (v) localStorage.setItem('kf_auffrischen', v);
  }, vorher || null);
  await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
async function zurSchulung(p) {
  await p.evaluate(() => {
    const k = document.querySelector('.mobnav [data-group="g-ich"]') ||
              document.querySelector('#side [data-group="g-ich"]');
    if (k) k.click();
  });
  await p.waitForTimeout(700);
  await p.evaluate(() => {
    const t = [...document.querySelectorAll('[data-subview]')].find(x => /Schulung/.test(x.textContent));
    if (t) t.click();
  });
  await p.waitForTimeout(1500);
}
function karte(p) {
  return p.evaluate(() => {
    const k = document.getElementById('schAuffrischKarte');
    return {
      da: !!k && !k.hidden && !!k.offsetParent,
      text: k ? k.textContent.replace(/\s+/g, ' ') : '',
      antworten: document.querySelectorAll('#schAuffrisch [data-schauf]').length
    };
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── Die Frage erscheint ──');
  const p = await oeffne(b, 390, 844);
  /* Jede Schreibanfrage an die Demo-Datenbank mitschneiden. */
  await zurSchulung(p);
  let k = await karte(p);
  pruefe('nach 16 Tagen steht „Kurz auffrischen" da', k.da, k.text.slice(0, 80));
  pruefe('mit Antworten zum Antippen', k.antworten >= 2, String(k.antworten));
  pruefe('aus dem richtigen Modul', /Wenn einem Kunden schlecht wird/.test(k.text), k.text.slice(0, 120));
  pruefe('und sie sagt, dass nichts gespeichert wird', /nicht gespeichert/.test(k.text) && /niemand sieht/.test(k.text));
  const reihenfolge = await p.evaluate(() => {
    const kinder = [...document.getElementById('schUebersicht').children].filter(x => x.offsetParent);
    return kinder.map(x => x.id || x.className).slice(0, 3);
  });
  /* Pflicht geht vor: „Das steht für dich an" bleibt oben. */
  pruefe('Pflichtmodule stehen weiter oben, das Auffrischen darunter',
    reihenfolge[0] === 'schFaelligKarte' && reihenfolge[1] === 'schAuffrischKarte', reihenfolge.join(' | '));

  const vorher = await p.evaluate(() => (window.__demoSchreib || []).length);
  /* Eine FALSCHE Antwort: die richtige steht in der Datei. */
  const falsch = await p.evaluate(() => {
    const m = (window.SCHULUNGEN_BASIS.module || []).find(x => x.id === 'm-notfall');
    const text = document.querySelector('#schAuffrisch .sch-auf-frage').textContent;
    const f = m.fragen.find(x => x.frage === text);
    const daneben = f.richtig === 0 ? 1 : 0;
    document.querySelector('#schAuffrisch [data-schauf="' + daneben + '"]').click();
    return new Promise(r => setTimeout(() => r({
      richtig: document.querySelectorAll('#schAuffrisch .sch-antwort.richtig').length,
      falsch: document.querySelectorAll('#schAuffrisch .sch-antwort.falsch').length,
      hinweis: (document.querySelector('#schAuffrisch .sch-auf-hinweis') || {}).textContent || '',
      fertig: !!document.getElementById('schAufFertig'),
      gesperrt: [...document.querySelectorAll('#schAuffrisch [data-schauf]')].every(x => x.disabled)
    }), 400));
  });
  pruefe('falsch: die richtige Antwort wird gezeigt', falsch.richtig === 1 && falsch.falsch === 1, JSON.stringify(falsch));
  pruefe('… mit Hinweis', /Nicht ganz/.test(falsch.hinweis) && falsch.hinweis.length > 30, falsch.hinweis.slice(0, 80));
  pruefe('… danach lässt sich nichts mehr umwählen', falsch.gesperrt);
  pruefe('… und es gibt „Fertig"', falsch.fertig);

  /* Fingerziele, solange die Antworten und „Fertig" dastehen. */
  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    await p.setViewportSize({ width: w, height: h });
    await p.waitForTimeout(250);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const zu = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const els = [...document.querySelectorAll('#schAuffrischKarte button')].filter(e => e.offsetParent);
        const raus = [];
        for (const el of els) {
          el.scrollIntoView({ block: 'center' });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el);
          if (m.w < 44 || m.h < 44) raus.push((el.textContent.trim() || el.id).slice(0, 16) + ' ' + m.w + '×' + m.h);
        }
        return { raus, n: els.length, quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      pruefe(w + ' px ' + dichte + ': alle ' + zu.n + ' Knöpfe ≥ 44 × 44, nichts ragt hinaus',
        zu.n >= 3 && !zu.raus.length && zu.quer <= 0, zu.raus.join(', ') + ' quer ' + zu.quer);
    }
  }
  await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
  await p.setViewportSize({ width: 390, height: 844 });

  await p.evaluate(() => document.getElementById('schAufFertig').click());
  await p.waitForTimeout(400);
  k = await karte(p);
  pruefe('„Fertig" räumt die Karte weg', !k.da);
  const nachher = await p.evaluate(() => ({
    schreib: (window.__demoSchreib || []).length,
    gemerkt: localStorage.getItem('kf_auffrischen') || ''
  }));
  /* Die Demo zählt Schreibvorgänge nicht überall mit; der stärkere Beweis
     ist der Quelltext: die Funktion fasst S() nicht an. */
  const quelle = await (await fetch(APP)).text();
  const fn = (quelle.match(/function schAuffrischZeichnen\(\)\{[\s\S]*?\n\}/) || [''])[0] +
             (quelle.match(/function schAuffrischFall\(\)\{[\s\S]*?\n\}/) || [''])[0];
  pruefe('es wird nichts in die Datenbank geschrieben (kein S(), kein schFn)',
    fn.length > 200 && !/\bS\(|schFn\(|fnRuf\(/.test(fn) && nachher.schreib === vorher, fn.length + ' Zeichen');
  pruefe('gemerkt wird nur auf dem Gerät', /"lauf3"/.test(nachher.gemerkt), nachher.gemerkt);
  pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
  await p.close();

  console.log('\n── Gegenproben ──');
  /* Schon beantwortet: nach dem Neuladen bleibt sie weg. */
  const q = await oeffne(b, 390, 844, JSON.stringify({ lauf3: Date.now() }));
  await zurSchulung(q);
  k = await karte(q);
  pruefe('GEGENPROBE schon beantwortet → nach dem Neuladen keine Karte', !k.da, k.text.slice(0, 60));
  await q.close();

  /* Erst 13 Tage her: keine Frage. Die Demo legt den Durchlauf 16 Tage vor
     „jetzt" an; die Uhr springt nach dem Laden drei Tage zurück. */
  const r = await b.newPage({ viewport: { width: 390, height: 844 } });
  await r.route('**://www.gstatic.com/**', x => x.abort());
  await r.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  const jetzt = Date.now();
  await r.clock.setFixedTime(new Date(jetzt));
  await r.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
  await r.waitForTimeout(3200);
  await r.clock.setFixedTime(new Date(jetzt - 3 * 86400000));
  await zurSchulung(r);
  k = await karte(r);
  pruefe('GEGENPROBE nach 13 Tagen steht noch keine Frage da', !k.da, k.text.slice(0, 60));
  await r.clock.setFixedTime(new Date(jetzt));
  await r.evaluate(() => {
    const t = [...document.querySelectorAll('[data-schkat]')].find(x => x.getAttribute('data-schkat') === 'alle');
    if (t) t.click();
  });
  await r.waitForTimeout(400);
  k = await karte(r);
  pruefe('… und nach 16 Tagen schon (dieselbe Seite, nur die Uhr)', k.da);
  await r.close();

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Kurz auffrischen: eine Frage nach zwei Wochen, nur für dich — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
