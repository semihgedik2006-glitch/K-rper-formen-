/* ══════════════════════════════════════════════════════════════════════
   SCHULUNG: ANIMATION STATT „VIDEO FOLGT" (Runde 188)

   Aus dem Betrieb, 22.10.2026: „bis jetzt gibts nur für die
   verkaufsschulung videos den rest können wir sonst auch selber erstellen
   mit animationen".

   Die fünf Video-Schritte der drei Pflichtmodule zeigen jetzt eine kurze
   Animation: Bild für Bild ein Zeichen und ein Satz aus dem Handbuch.

   Geprüft wird:
   1. NICHTS ERFUNDEN. Jede Szene nennt ihre Quelle. Wo sie auf „Hilfe im
      Studio" zeigt, gibt es den Eintrag — und bei den drei Abläufen
      (Nr. 36, 37, 95) steht jeder Satz wortgleich in dessen Schritten.
   2. Alle fünf Platzhalter sind ersetzt; GEGENPROBE: ohne Szenen steht
      wieder „Video folgt" (was fehlt, wird benannt — CLAUDE.md).
   3. „Weiter" erst, wenn jedes Bild einmal zu sehen war — wie beim Video;
      GEGENPROBE: die Geschäftsführung ist ausgenommen, wie beim Video.
   4. Die Bilder laufen von selbst weiter; „Pause" hält sie an (Gegenprobe
      über die Zeit).
   5. Bewegt wird nur opacity und transform (CLAUDE.md, „Flüssig heisst
      konkret").
   6. Fingerziele ≥ 44 × 44 per Hit-Test bei sieben Breiten, normal und
      kompakt; die Fläche bleibt in ihrer Karte (beim ersten Anlauf ragte
      sie am 390er Telefon 37 px hinaus).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 220) : '')); }
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
const BREITEN = [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]];

/* ── 1. Nichts erfunden: die Dateien selbst ── */
function laden(datei) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', datei), 'utf8'), ctx);
  return ctx.window;
}
const BASIS = laden('schulungen-basis.js').SCHULUNGEN_BASIS;
const LOES = (laden('loesungen-basis.js').LOESUNGEN_BASIS || {});
const EINTRAEGE = LOES.eintraege || LOES.loesungen || [];

console.log('\n── Nichts erfunden ──');
pruefe('das Handbuch („Hilfe im Studio") ist geladen', EINTRAEGE.length >= 100, String(EINTRAEGE.length));
const videoSchritte = [];
BASIS.module.forEach(m => (m.schritte || []).forEach((s, i) => {
  if (s.art === 'video' && !s.quelle) videoSchritte.push({ m: m.id, i, s });
}));
pruefe('die fünf Video-Schritte ohne Video haben alle eine Animation',
  videoSchritte.length === 5 && videoSchritte.every(x => Array.isArray(x.s.szenen) && x.s.szenen.length >= 4),
  videoSchritte.map(x => x.m + '#' + x.i + ':' + (x.s.szenen || []).length).join(', '));
const WORTGLEICH = { b36: true, b37: true, b95: true };
let szenen = 0, ohneQuelle = [], unbekannt = [], abweichend = [];
videoSchritte.forEach(x => (x.s.szenen || []).forEach(z => {
  szenen++;
  if (!z.quelle || !z.text) { ohneQuelle.push(x.m + ': ' + z.text); return; }
  if (z.quelle === 'modul') return;
  const e = EINTRAEGE.find(y => y.id === z.quelle);
  if (!e) { unbekannt.push(z.quelle); return; }
  /* Die drei Abläufe (alle Szenen aus EINEM Eintrag: Nr. 36, 37, 95)
     stehen Satz für Satz wortgleich im Handbuch. Der Rundgang und „Wen
     frage ich wann?" fassen mehrere Einträge zusammen; dort muss es den
     genannten Eintrag geben (oben). */
  const ablauf = x.s.szenen.every(y => y.quelle === x.s.szenen[0].quelle);
  if (ablauf && WORTGLEICH[z.quelle] && !(e.schritte || []).includes(z.text)) {
    abweichend.push(z.quelle + ': ' + z.text);
  }
}));
pruefe('jede der ' + szenen + ' Szenen nennt ihre Quelle und hat Text', szenen >= 25 && !ohneQuelle.length, ohneQuelle.join(' | '));
pruefe('jede genannte Handbuch-Nummer gibt es', !unbekannt.length, unbekannt.join(', '));
pruefe('Nr. 36, 37 und 95: jeder Satz steht wortgleich im Handbuch', !abweichend.length, abweichend.join(' | '));
/* Gegenprobe der Prüfung selbst: ein erfundener Satz fiele auf. */
const b36 = EINTRAEGE.find(y => y.id === 'b36') || {};
pruefe('GEGENPROBE ein erfundener Satz („Mit Wasser abspülen.") steht nicht in Nr. 36', !(b36.schritte || []).includes('Mit Wasser abspülen.'));

async function oeffne(b, w, h, rolle, vorher) {
  const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + (rolle || 'mitarbeiter'), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  await p.evaluate(() => {
    const k = document.querySelector('.mobnav [data-group="g-wissen"]') || document.querySelector('#side [data-group="g-wissen"]');
    if (k) k.click();
  });
  await p.waitForTimeout(700);
  await p.evaluate(() => { const t = [...document.querySelectorAll('[data-subview]')].find(x => /Schulung/.test(x.textContent)); if (t) t.click(); });
  await p.waitForTimeout(1600);
  /* Erst jetzt ist schulungen-basis.js geladen (die Datei kommt beim
     ersten Öffnen der Schulung). */
  if (vorher) await p.evaluate(vorher);
  return p;
}
/* Hygiene starten und zum Schritt „Trainingsplatz reinigen". */
async function zurAnimation(p) {
  await p.click('[data-schmodul="m-hygiene"]'); await p.waitForTimeout(600);
  await p.fill('#schCodeFeld', 'D3MQ-7WKP-H2CX'); await p.click('#schStartBtn'); await p.waitForTimeout(1200);
  await p.click('#schWeiter'); await p.waitForTimeout(700);
}
const stand = (p) => p.evaluate(() => ({
  da: !!document.getElementById('schAnim'),
  idx: Number((document.getElementById('schAnim') || { dataset: {} }).dataset.szene),
  text: (document.querySelector('.sch-anim-text') || {}).textContent || '',
  quelle: (document.querySelector('.sch-anim-quelle') || {}).textContent || '',
  weiterAus: !!(document.getElementById('schWeiter') || {}).disabled,
  folgt: [...document.querySelectorAll('#schLauf .sch-video b')].map(x => x.textContent).join('|')
}));

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── In der App ──');
  const p = await oeffne(b, 390, 844);
  await zurAnimation(p);
  let s = await stand(p);
  pruefe('„Trainingsplatz reinigen" zeigt die Animation statt „Video folgt"', s.da && !/Video folgt/.test(s.folgt), JSON.stringify(s));
  pruefe('Bild 1: „Kundenmaterial entfernen." mit Quelle', s.text === 'Kundenmaterial entfernen.' && /Nr\. 36/.test(s.quelle), s.text + ' / ' + s.quelle);
  pruefe('„Weiter" ist gesperrt, solange nicht jedes Bild zu sehen war', s.weiterAus);
  await p.waitForTimeout(5800);
  s = await stand(p);
  pruefe('nach gut fünf Sekunden läuft es von selbst zu Bild 2', s.idx === 1, String(s.idx));
  await p.click('#schAnimSpiel'); await p.waitForTimeout(6000);
  const nachPause = await stand(p);
  pruefe('GEGENPROBE „Pause": sechs Sekunden später noch dasselbe Bild', nachPause.idx === 1, String(nachPause.idx));
  pruefe('… und „Weiter" bleibt gesperrt', nachPause.weiterAus);

  /* Fingerziele und Ränder, solange die Animation dasteht. */
  for (const [w, h] of BREITEN) {
    await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(250);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const r = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const els = [...document.querySelectorAll('#schAnim button')].filter(e => e.offsetParent && !e.disabled);
        const zu = [];
        for (const el of els) {
          el.scrollIntoView({ block: 'center' });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el);
          if (m.w < 44 || m.h < 44) zu.push((el.textContent.trim() || el.id).slice(0, 12) + ' ' + m.w + '×' + m.h);
        }
        const buehne = document.querySelector('.sch-anim-buehne').getBoundingClientRect();
        const karte = document.querySelector('#schLauf .card').getBoundingClientRect();
        return { zu, n: els.length, quer: document.documentElement.scrollWidth - innerWidth,
                 drin: buehne.left >= karte.left - 0.5 && buehne.right <= karte.right + 0.5 };
      }, TREFFER.toString());
      pruefe(w + ' px ' + dichte + ': ' + r.n + ' Knöpfe ≥ 44 × 44, die Fläche bleibt in der Karte, nichts ragt hinaus',
        r.n >= 2 && !r.zu.length && r.quer <= 0 && r.drin, r.zu.join(', ') + ' quer ' + r.quer + ' drin ' + r.drin);
    }
  }
  await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
  await p.setViewportSize({ width: 390, height: 844 });

  /* Mit › durch alle Bilder: dann geht „Weiter". */
  for (let i = 0; i < 6; i++) {
    const vor = await p.$('#schAnimVor:not([disabled])');
    if (!vor) break;
    await vor.click(); await p.waitForTimeout(200);
  }
  s = await stand(p);
  pruefe('nach dem letzten Bild (5 / 5) ist „Weiter" frei', s.idx === 4 && !s.weiterAus, JSON.stringify(s));

  /* Nur opacity und transform in den Bewegungen der Animation. */
  const css = await p.evaluate(() => {
    const raus = [];
    for (const sh of document.styleSheets) {
      let regeln; try { regeln = sh.cssRules; } catch (e) { continue; }
      for (const r of regeln) {
        if (r.type === CSSRule.KEYFRAMES_RULE && /^schAnim/.test(r.name)) {
          for (const k of r.cssRules) for (let i = 0; i < k.style.length; i++) raus.push(r.name + ':' + k.style[i]);
        }
      }
    }
    return raus;
  });
  pruefe('bewegt wird nur opacity und transform', css.length >= 3 && css.every(x => /:(opacity|transform)$/.test(x)), css.join(', '));
  pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
  await p.close();

  console.log('\n── Gegenproben ──');
  /* Ohne Szenen ist es wieder ein fehlendes Video — und das wird gesagt. */
  const q = await oeffne(b, 390, 844, 'mitarbeiter', () => {
    window.SCHULUNGEN_BASIS.module.find(m => m.id === 'm-hygiene').schritte[1].szenen = null;
  });
  await zurAnimation(q);
  s = await stand(q);
  pruefe('GEGENPROBE ohne Szenen steht wieder „Video folgt"', !s.da && /Video folgt/.test(s.folgt), JSON.stringify(s));
  await q.close();

  /* Die Geschäftsführung ist wie beim Video ausgenommen. */
  const c = await oeffne(b, 1440, 900, 'chef');
  await zurAnimation(c);
  s = await stand(c);
  pruefe('GEGENPROBE die Geschäftsführung: „Weiter" gleich frei, wie beim Video', s.da && !s.weiterAus, JSON.stringify(s));
  await c.close();

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Schulung: Animation statt „Video folgt", aus dem Handbuch — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
