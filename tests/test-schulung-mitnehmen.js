/* ══════════════════════════════════════════════════════════════════════
   SCHULUNG: „DAS NIMMST DU MIT" AM ENDE EINES DURCHLAUFS (Runde 261)

   Aus dem Betrieb, 24.10.2026: „Jo mach weiter". Bisher stand am Ende
   nur „2 Fehlversuche" — welche, stand nirgends.

   Geprüft wird, jeweils mit Gegenprobe:
   1. Fragen, die nicht auf Anhieb sassen, stehen am Ende mit Frage,
      richtiger Antwort und Hinweis — die anderen nicht.
   2. Der Satz zum Auffrischen steht bei einem echten, bestandenen
      Durchlauf; beim Testcode nicht.
   3. Alles beim ersten Mal richtig → kein Kasten.
   4. Am Rechner zwei Spalten, am Handy eine; nichts ragt hinaus;
      „Fertig" trifft ≥ 44 × 44 bei sieben Breiten.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 240) : '')); }
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

async function oeffne(b, w, h, rolle) {
  const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + (rolle || 'mitarbeiter'), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  /* „Wissen" liegt am Handy unter ☰ (Runde 246), am Rechner links. */
  await p.evaluate(async () => {
    const k = [...document.querySelectorAll('.mobnav [data-group="g-wissen"], #side [data-group="g-wissen"]')].find(e => e.offsetParent);
    if (k) { k.click(); return; }
    document.getElementById('bereichKopf').click();
    await new Promise(r => setTimeout(r, 450));
    const z = document.querySelector('#allesLadeInhalt .al-zeile[data-alles="schulung"]'); if (z) z.click();
  });
  await p.waitForTimeout(900);
  await p.evaluate(() => { const t = [...document.querySelectorAll('[data-subview]')].find(x => /Schulung/.test(x.textContent) && x.offsetParent); if (t) t.click(); });
  await p.waitForTimeout(1500);
  return p;
}
/* Ein Durchlauf „Hygiene": bei den Fragen in `daneben` zuerst eine
   falsche Antwort, dann die richtige. */
async function durchlauf(p, code, daneben) {
  await p.click('[data-schmodul="m-hygiene"]'); await p.waitForTimeout(500);
  await p.fill('#schCodeFeld', code); await p.click('#schStartBtn'); await p.waitForTimeout(1200);
  for (let i = 0; i < 30; i++) {
    const z = await p.evaluate(() => ({ ergebnis: document.getElementById('schErgebnis').style.display !== 'none',
      frage: !!document.querySelector('#schLauf [data-schantwort]:not([disabled])') }));
    if (z.ergebnis) break;
    if (z.frage) {
      await p.evaluate((daneben) => {
        const t = document.querySelector('#schLauf .sch-frage').textContent;
        const fr = window.SCHULUNGEN_BASIS.module.find(m => m.id === 'm-hygiene').fragen;
        const n = fr.findIndex(x => x.frage === t), f = fr[n];
        if (daneben.indexOf(n) >= 0 && !window['__dn' + n]) {
          window['__dn' + n] = 1;
          document.querySelector('#schLauf [data-schantwort="' + ((f.richtig + 1) % f.antworten.length) + '"]').click();
        } else document.querySelector('#schLauf [data-schantwort="' + f.richtig + '"]').click();
      }, daneben);
      await p.waitForTimeout(250);
      continue;
    }
    await p.evaluate(() => { const h = document.querySelector('#schHaken input'); if (h && !h.checked) h.click(); });
    /* Direkt ausgelöst: Playwright meldet den Knopf während der Feder-
       Bewegung als „nicht stabil". Getroffen wird er hier nicht geprüft. */
    for (let k = 0; k < 8; k++) { const ok = await p.evaluate(() => { const v = document.querySelector('#schAnimVor:not([disabled])'); if (v) v.click(); return !!v; }); if (!ok) break; await p.waitForTimeout(120); }
    await p.evaluate(() => { const w = document.getElementById('schWeiter'); if (w && !w.disabled) w.click(); });
    await p.waitForTimeout(350);
  }
  return p.evaluate(() => {
    const s = document.querySelector('#schErgebnis .sch-mitnehmen');
    return { fertig: document.getElementById('schErgebnis').style.display !== 'none',
      da: !!s, text: s ? s.innerText : '', zeilen: s ? [...s.querySelectorAll('li')].map(l => l.innerText) : [],
      ergebnis: document.getElementById('schErgebnis').innerText };
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const HY = await (async () => { const p = await oeffne(b, 1440, 900); const f = await p.evaluate(() => window.SCHULUNGEN_BASIS.module.find(m => m.id === 'm-hygiene').fragen); await p.close(); return f; })();

  console.log('\n── Eigener Code, Frage 2 daneben ──');
  let p = await oeffne(b, 1440, 900);
  let d = await durchlauf(p, 'D3MQ-7WKP-H2CX', [1]);
  pruefe('(Vorbereitung) der Durchlauf ist abgeschlossen und bestanden', d.fertig && /Geschafft/.test(d.ergebnis), d.ergebnis.slice(0, 200));
  pruefe('„Das nimmst du mit" steht da, mit genau einer Frage', d.da && d.zeilen.length === 1 && /Das nimmst du mit/.test(d.text), JSON.stringify(d.zeilen));
  const z = d.zeilen[0] || '';
  pruefe('… die Frage, die danebenging, mit richtiger Antwort und Hinweis',
    z.indexOf(HY[1].frage) === 0 && z.indexOf('Richtig: ' + HY[1].antworten[HY[1].richtig]) > 0 && z.indexOf(HY[1].hinweis) > 0, z);
  pruefe('GEGENPROBE die anderen Fragen (auf Anhieb richtig) stehen nicht darin',
    d.text.indexOf(HY[0].frage) < 0 && d.text.indexOf(HY[2].frage) < 0);
  pruefe('der Satz zum Auffrischen steht bei einem echten, bestandenen Durchlauf', /Kurz auffrischen“ kommt sie zuerst wieder dran/.test(d.text), d.text);
  const pc = await p.evaluate(() => {
    const li = [...document.querySelectorAll('#schErgebnis .sch-mitnehmen li')].map(x => x.getBoundingClientRect());
    const s = document.querySelector('#schErgebnis .sch-mitnehmen');
    return { links: getComputedStyle(s).textAlign, spalten: getComputedStyle(s.querySelector('ol')).gridTemplateColumns.split(' ').length,
      quer: document.documentElement.scrollWidth - innerWidth };
  });
  pruefe('am Rechner: links bündig, zwei Spalten, nichts ragt hinaus', pc.links === 'left' && pc.spalten === 2 && pc.quer <= 0, JSON.stringify(pc));
  if (process.env.BILD) await p.screenshot({ path: process.env.BILD, fullPage: false }).catch(() => {});
  pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
  await p.close();

  console.log('\n── Gegenproben ──');
  p = await oeffne(b, 1440, 900);
  d = await durchlauf(p, 'D3MQ-7WKP-H2CX', []);
  pruefe('GEGENPROBE alles auf Anhieb richtig → kein Kasten', d.fertig && !d.da, d.text);
  await p.close();
  p = await oeffne(b, 1440, 900, 'chef');
  d = await durchlauf(p, '0000-0000-0000', [0, 2]);
  pruefe('GEGENPROBE Testcode: zwei Fragen stehen da, der Satz zum Auffrischen nicht',
    d.da && d.zeilen.length === 2 && !/Kurz auffrischen/.test(d.text) && /diesen 2 Fragen/.test(d.text), d.text);
  await p.close();

  console.log('\n── Breiten ──');
  for (const [w, h] of BREITEN) {
    const r = await oeffne(b, w, h);
    const dd = await durchlauf(r, 'D3MQ-7WKP-H2CX', [0, 1]);
    if (w === 390) pruefe('zwei Fragen: Mehrzahl im Satz („kommen sie")', dd.zeilen.length === 2 && /kommen sie zuerst wieder dran/.test(dd.text), dd.text);
    for (const dichte of ['normal', 'kompakt']) {
      await r.evaluate((x) => { document.body.dataset.dichte = x; }, dichte);
      const m = await r.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const el = document.querySelector('#schErgebnis [data-schzurueck]');
        el.scrollIntoView({ block: 'center' });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const ol = document.querySelector('#schErgebnis .sch-mitnehmen ol');
        return { t: T(el), spalten: ol ? getComputedStyle(ol).gridTemplateColumns.split(' ').length : 0,
          quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      const soll = w >= 1100 ? 2 : 1;
      pruefe(w + ' px ' + dichte + ': „Fertig" ≥ 44 × 44, ' + soll + ' Spalte(n), nichts ragt hinaus',
        m.t.w >= 44 && m.t.h >= 44 && m.spalten === soll && m.quer <= 0, JSON.stringify(m));
    }
    await r.close();
  }

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Schulung: „Das nimmst du mit" — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
