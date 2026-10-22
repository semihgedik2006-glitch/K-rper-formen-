/* ══════════════════════════════════════════════════════════════════════
   SCHULUNG: NACHWEIS DER UNTERWEISUNG ZUM DRUCKEN (Runde 211)

   Aus dem Betrieb, 22.10.2026: „jo mach weitert" — auf den Vorschlag
   „ein druckbarer Nachweis der Hygiene- und Notfallunterweisung für
   Kontrollen".

   Geprüft wird, jeweils mit Gegenprobe:
   1. Das Blatt nennt Modul, Inhalt (Schritte) und Zahl der Fragen.
   2. Je Person der JÜNGSTE bestandene Durchlauf mit Datum, Ergebnis,
      Dauer, Durchgang und einer leeren Spalte zum Unterschreiben.
   3. Testläufe (Testcode) und nicht bestandene stehen nicht darauf.
   4. Bei Pflicht steht darunter, wer noch fehlt — ohne Stillgelegte.
   5. Im Ausdruck steht nichts von der Bedienung, und es ist ein echtes
      Druckbild (media print), kein leeres Blatt.
   6. Der Knopf trifft ≥ 44 × 44 bei sieben Breiten, normal und kompakt.
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

async function oeffne(b, w, h) {
  const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  /* Der Druck-Dialog würde den Durchlauf anhalten. */
  await p.evaluate(() => { window.__gedruckt = 0; window.print = function () { window.__gedruckt++; }; });
  await p.evaluate(() => {
    const k = document.querySelector('.mobnav [data-group="g-wissen"]') || document.querySelector('#side [data-group="g-wissen"]');
    if (k) k.click();
  });
  await p.waitForTimeout(700);
  await p.evaluate(() => { const t = [...document.querySelectorAll('[data-subview]')].find(x => /Schulung/.test(x.textContent)); if (t) t.click(); });
  await p.waitForTimeout(1500);
  await p.click('#schVerwaltenBtn'); await p.waitForTimeout(700);
  await p.evaluate(() => document.querySelector('[data-schvwtab="stand"]').click());
  await p.waitForTimeout(600);
  return p;
}
async function drucke(p, modul) {
  await p.selectOption('#schNwModul', modul);
  /* Direkt ausgelöst: nach dem Testlauf meldete Playwrights Klick den
     Knopf als „nicht stabil", obwohl er sich nachgemessen nicht bewegt.
     Ob er im Bild getroffen wird, prüft der Abschnitt „Fingerziele" per
     Hit-Test. */
  await p.evaluate(() => document.getElementById('schNwDruck').click()); await p.waitForTimeout(300);
  return p.evaluate(() => {
    const pa = document.getElementById('printArea');
    return { gedruckt: window.__gedruckt, text: pa.innerText,
      zeilen: [...pa.querySelectorAll('tr')].slice(1).map(tr => [...tr.cells].map(td => td.textContent)),
      kopf: [...pa.querySelectorAll('th')].map(x => x.textContent) };
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const p = await oeffne(b, 1440, 900);

  console.log('\n── „Hygiene nach jedem Training" ──');
  let d = await drucke(p, 'm-hygiene');
  pruefe('„Nachweis drucken" öffnet den Druck', d.gedruckt === 1, String(d.gedruckt));
  pruefe('Titel, Pflicht und Wiederholung alle 12 Monate', /Nachweis der Unterweisung: Hygiene nach jedem Training/.test(d.text) &&
    /Pflichtmodul/.test(d.text) && /alle 12 Monate/.test(d.text), d.text.slice(0, 200));
  pruefe('Inhalt: die Schritte des Moduls und die Zahl der Fragen', /1\. Warum sofort und nicht später/.test(d.text) &&
    /3\. Elektroden und Weste desinfizieren/.test(d.text) && /3 Fragen/.test(d.text), d.text.slice(0, 400));
  pruefe('bei der Bestätigung steht, WAS bestätigt wurde', /4\. Bestätigt: „Ich weiss, wo Desinfektionsmittel/.test(d.text), d.text.slice(0, 500));
  pruefe('Spalten: Name, Bestanden am, Ergebnis, Dauer, Durchgang, Unterschrift',
    d.kopf.join('|') === 'Name|Bestanden am|Ergebnis|Dauer|Durchgang|Unterschrift', d.kopf.join('|'));
  pruefe('Jamie mit Datum samt Jahr, 100 %, Dauer und leerer Unterschrift', d.zeilen.length === 1 && d.zeilen[0][0] === 'Jamie Kurz' &&
    /^\d{2}\.\d{2}\.\d{4}$/.test(d.zeilen[0][1]) && d.zeilen[0][2] === '100 %' && /Min/.test(d.zeilen[0][3]) && d.zeilen[0][5] === '',
    JSON.stringify(d.zeilen));
  pruefe('darunter, wer noch fehlt', /Noch offen:.*Du \(Demo-Konto\).*Nora Haas/.test(d.text), d.text.slice(-300));
  pruefe('unten steht, was das Blatt NICHT ist', /prüft die App nicht/.test(d.text));

  /* Ein Testlauf mit dem Testcode zählt nicht. Die Leitung macht „Hygiene"
     mit 0000-0000-0000 durch … */
  console.log('\n── Gegenproben ──');
  await p.evaluate(() => document.querySelector('#schVerwalten [data-schzurueck]').click());
  await p.waitForTimeout(500);
  await p.click('[data-schmodul="m-start"]'); await p.waitForTimeout(500);
  await p.fill('#schCodeFeld', '0000-0000-0000'); await p.click('#schStartBtn'); await p.waitForTimeout(1200);
  for (let i = 0; i < 20; i++) {
    const zustand = await p.evaluate(() => ({ ergebnis: document.getElementById('schErgebnis').style.display !== 'none',
      frage: !!document.querySelector('#schLauf [data-schantwort]:not([disabled])') }));
    if (zustand.ergebnis) break;
    if (zustand.frage) {
      await p.evaluate(() => {
        const t = document.querySelector('#schLauf .sch-frage').textContent;
        const f = window.SCHULUNGEN_BASIS.module.find(m => m.id === 'm-start').fragen.find(x => x.frage === t);
        document.querySelector('#schLauf [data-schantwort="' + f.richtig + '"]').click();
      });
      await p.waitForTimeout(250);
    }
    await p.evaluate(() => { const h = document.querySelector('#schHaken input'); if (h && !h.checked) h.click(); });
    for (let k = 0; k < 8; k++) { const v = await p.$('#schAnimVor:not([disabled])'); if (!v) break; await v.click(); await p.waitForTimeout(80); }
    await p.evaluate(() => { const w = document.getElementById('schWeiter'); if (w && !w.disabled) w.click(); });
    await p.waitForTimeout(350);
  }
  const testFertig = await p.evaluate(() => /Testlauf/.test(document.getElementById('schErgebnis').textContent));
  pruefe('(Vorbereitung) ein Testlauf „Dein erster Tag" ist abgeschlossen', testFertig);
  await p.evaluate(() => document.querySelector('#schErgebnis [data-schzurueck]').click()); await p.waitForTimeout(500);
  await p.click('#schVerwaltenBtn'); await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('[data-schvwtab="stand"]').click()); await p.waitForTimeout(500);
  d = await drucke(p, 'm-start');
  pruefe('GEGENPROBE der Testlauf steht NICHT auf dem Nachweis', !d.zeilen.some(z => /Demo-Geschäftsführung/.test(z[0])) &&
    d.zeilen.length === 1 && d.zeilen[0][0] === 'Jamie Kurz', JSON.stringify(d.zeilen));
  d = await drucke(p, 'm-beratung');
  pruefe('GEGENPROBE ein nur angefangener Durchlauf steht nicht darauf („noch niemand bestanden")',
    d.zeilen.length === 0 && /Noch niemand hat dieses Modul bestanden/.test(d.text), d.text.slice(0, 300));
  d = await drucke(p, 'm-ems-grundlagen');
  pruefe('GEGENPROBE ein freiwilliges Modul hat keine „Noch offen"-Liste', !/Noch offen/.test(d.text) && !/Pflichtmodul/.test(d.text));

  /* Nora stilllegen → fehlt nicht mehr in „Noch offen". */
  await p.evaluate(() => document.querySelector('[data-schvwtab="tn"]').click()); await p.waitForTimeout(500);
  await p.evaluate(() => {
    const z = [...document.querySelectorAll('#schTnListe .sch-tn-zeile')].find(x => /Nora Haas/.test(x.textContent));
    z.querySelector('[data-schsperre]').click();
  });
  await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('[data-schvwtab="stand"]').click()); await p.waitForTimeout(500);
  d = await drucke(p, 'm-hygiene');
  pruefe('GEGENPROBE eine stillgelegte Person steht nicht unter „Noch offen"', /Noch offen:/.test(d.text) && !/Nora Haas/.test(d.text), d.text.slice(-200));

  /* Das Druckbild selbst. */
  await p.emulateMedia({ media: 'print' });
  const druck = await p.evaluate(() => {
    const sichtbar = [...document.body.children].filter(e => getComputedStyle(e).display !== 'none').map(e => e.id || e.tagName);
    return { sichtbar, text: document.getElementById('printArea').innerText.length,
      knoepfe: [...document.querySelectorAll('#printArea button, #printArea nav')].length };
  });
  pruefe('im Druckbild steht nur der Nachweis — keine Navigation, keine Knöpfe', druck.sichtbar.join() === 'printArea' && druck.text > 200 && druck.knoepfe === 0,
    JSON.stringify(druck));
  if (process.env.BILD) await p.screenshot({ path: process.env.BILD, fullPage: true }).catch(() => {});
  await p.emulateMedia({ media: 'screen' });
  pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
  await p.close();

  console.log('\n── Fingerziele ──');
  for (const [w, h] of BREITEN) {
    const r = await oeffne(b, w, h);
    for (const dichte of ['normal', 'kompakt']) {
      await r.evaluate((x) => { document.body.dataset.dichte = x; }, dichte);
      const m = await r.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const el = document.getElementById('schNwDruck');
        el.scrollIntoView({ block: 'center' });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const sel = document.getElementById('schNwModul').getBoundingClientRect();
        return { t: T(el), sel: Math.round(sel.height), quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      pruefe(w + ' px ' + dichte + ': „Nachweis drucken" ≥ 44 × 44, Auswahl ≥ 44 hoch, nichts ragt hinaus',
        m.t.w >= 44 && m.t.h >= 44 && m.sel >= 44 && m.quer <= 0, JSON.stringify(m));
    }
    await r.close();
  }

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Schulung: Nachweis der Unterweisung zum Drucken — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
