/* ══════════════════════════════════════════════════════════════════════
   RING, OHNE NETZ, HOCHZÄHLEN (Design-Ideen 4, 15, 18 — Runde 115)

   Aus dem Betrieb:
     „die Farben mit den Übergängen gefallen mir … ein wenig mehr Farbe
      und Leben"

   Geprüft wird:
   1. Der Fortschritt der Aufgaben (seit Runde 147 der Balken der Leiste,
      wie im Putzplan): Zahl lesbar („x von y erledigt"), Balken mit dem
      richtigen Anteil, nicht voll heisst nicht grün.
   2. Ohne Netz: die Leiste oben sagt, was los ist, der Inhalt ist
      entsättigt, die Leiste selbst NICHT. Mit Netz ist alles wieder
      normal. Bedienbar bleibt es: ein Knopf im Inhalt nimmt Klicks.
   3. Die Zahlen im Überblick der Verwaltung zählen beim Öffnen hoch
      und enden auf dem richtigen Wert. Mit „weniger Bewegung" nicht.
   4. Keine Seitenfehler — am Handy (390) und am Rechner (1440).
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
async function oeffne(ctx, rolle) {
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
async function zuDenAufgaben(p) {
  await p.evaluate(() => {
    const g = document.querySelector('#side [data-group="g-arbeit"], .mobnav [data-group="g-arbeit"]');
    if (g) g.click();
  });
  await p.waitForTimeout(500);
  await p.evaluate(() => { const t = document.querySelector('[data-subview="todos"]'); if (t) t.click(); });
  await p.waitForTimeout(1100);
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  for (const [w, h] of [[390, 844], [1440, 900]]) {
    console.log('\n── ' + w + ' × ' + h + ' ──');
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await oeffne(ctx, 'chef');

    /* ══ 1. Fortschritt ══
       Seit Runde 147 steht der Fortschritt der Aufgaben wie im Putzplan
       als Balken in der Leiste („GENAU so wie der purtzplan"), der Ring
       am alten Zähler ist damit weg. Dieselben Zusicherungen am Balken:
       Zahl lesbar, Anteil richtig, für Vorleser die Zahl, nicht voll →
       nicht grün (an den Gruppenköpfen). */
    await zuDenAufgaben(p);
    const ring = await p.evaluate(() => {
      const z = document.getElementById('tdProgress');
      const bal = document.getElementById('tdFortBalken');
      const m = /(\d+)\s*von\s*(\d+)/.exec(z ? z.textContent : '');
      const gr = [...document.querySelectorAll('#todoArea .pp-gruppe')].map(g => {
        const t = /(\d+) von (\d+)/.exec(g.querySelector('.pg-zahl').textContent);
        return { fertig: g.classList.contains('fertig'), voll: !!t && t[1] === t[2] };
      });
      return { text: z ? z.textContent.trim() : '', fertig: m ? +m[1] : -1, gesamt: m ? +m[2] : -1,
               anteil: bal ? parseFloat(bal.style.width) / 100 : -1,
               versteckt: (document.getElementById('tdFort') || { getAttribute: () => null }).getAttribute('aria-hidden'),
               gruppen: gr };
    });
    pruefe('die Leiste zeigt den Fortschritt als Zahl: „' + ring.text + '"', ring.gesamt > 0, JSON.stringify(ring));
    pruefe('der Balken zeigt den richtigen Anteil (' + ring.anteil.toFixed(3) + ')',
      ring.gesamt > 0 && Math.abs(ring.anteil - ring.fertig / ring.gesamt) < 0.01);
    pruefe('Vorleser hören die Zahl, nicht den Balken (aria-hidden)', ring.versteckt === 'true');
    pruefe('nicht voll → nicht grün (Gruppenköpfe)', ring.gruppen.length > 0 && ring.gruppen.filter(g => !g.voll).every(g => !g.fertig), JSON.stringify(ring.gruppen));

    /* ══ 2. Ohne Netz ══ */
    await ctx.setOffline(true);
    await p.waitForTimeout(500);
    const aus = await p.evaluate(() => {
      const bar = document.getElementById('offlineBar');
      const inhalt = document.querySelector('.view.show .scroll-area > :not(.lade-fehler):not(.sticky-tools)') ||
                     document.querySelector('.view.show .scroll-area > *');
      const knopf = [...document.querySelectorAll('.view.show .scroll-area button')].find(x => {
        const r = x.getBoundingClientRect(); return r.width > 0 && r.top > 0 && r.bottom < innerHeight;
      });
      let trifft = null;
      if (knopf) {
        const r = knopf.getBoundingClientRect();
        const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        trifft = !!t && (t === knopf || knopf.contains(t));
      }
      return {
        klasse: document.body.classList.contains('ohne-netz'),
        leiste: bar && getComputedStyle(bar).display !== 'none' && bar.classList.contains('show'),
        text: bar ? bar.textContent : '',
        filterInhalt: inhalt ? getComputedStyle(inhalt).filter : '',
        filterLeiste: bar ? getComputedStyle(bar).filter : '',
        trifft,
      };
    });
    pruefe('ohne Netz: body.ohne-netz', aus.klasse);
    pruefe('ohne Netz: die Leiste steht und sagt, warum es blass ist', aus.leiste && /zuletzt geladenen Stand/.test(aus.text), aus.text);
    pruefe('ohne Netz: der Inhalt ist entsättigt', /saturate/.test(aus.filterInhalt), aus.filterInhalt);
    pruefe('ohne Netz: die Leiste selbst bleibt in voller Farbe', aus.filterLeiste === 'none', aus.filterLeiste);
    pruefe('ohne Netz: Knöpfe im Inhalt nehmen weiter Klicks an', aus.trifft !== false, String(aus.trifft));

    await ctx.setOffline(false);
    await p.waitForTimeout(500);
    const an = await p.evaluate(() => ({
      klasse: document.body.classList.contains('ohne-netz'),
      leiste: document.getElementById('offlineBar').classList.contains('show'),
    }));
    pruefe('wieder online: alles normal', !an.klasse && !an.leiste, JSON.stringify(an));

    /* ══ 3. Hochzählen im Überblick ══ */
    await p.evaluate(() => { const a = document.querySelector('#side [data-group="g-alles"], .mobnav [data-group="g-alles"]'); if (a) a.click(); });
    await p.waitForTimeout(500);
    const verlauf = await p.evaluate(() => new Promise(fertig => {
      const k = document.querySelector('#allesSeite [data-alles="chef"][data-al-cgo="ueberblick"], #allesLadeInhalt [data-al-cgo="ueberblick"]');
      if (!k) return fertig(null);
      k.click();
      const werte = [];
      let n = 0;
      (function schau() {
        const el = [...document.querySelectorAll('#dashGrid .dn[data-zahl]')].find(x => +x.dataset.zahl > 1);
        if (el) werte.push({ t: el.textContent, ziel: el.dataset.zahl });
        if (++n < 70) requestAnimationFrame(schau); else fertig(werte);
      })();
    }));
    const zwischen = verlauf ? verlauf.filter(v => v.t !== v.ziel).length : -1;
    const ende = verlauf && verlauf.length ? verlauf[verlauf.length - 1] : null;
    pruefe('der Überblick hat Zahlen mit data-zahl', !!(verlauf && verlauf.length), JSON.stringify(verlauf && verlauf.slice(0, 3)));
    pruefe('die Zahl zählt hoch (Zwischenwerte gesehen: ' + zwischen + ')', zwischen > 0);
    pruefe('und endet auf dem richtigen Wert', !!ende && ende.t === ende.ziel, JSON.stringify(ende));

    pruefe('keine Seitenfehler', p._fehler.length === 0, p._fehler.join(' | '));
    await ctx.close();
  }

  /* ══ 3b. Weniger Bewegung: kein Hochzählen ══ */
  {
    console.log('\n── weniger Bewegung ──');
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const p = await oeffne(ctx, 'chef');
    await p.evaluate(() => { const a = document.querySelector('#side [data-group="g-alles"], .mobnav [data-group="g-alles"]'); if (a) a.click(); });
    await p.waitForTimeout(500);
    const verlauf = await p.evaluate(() => new Promise(fertig => {
      const k = document.querySelector('#allesSeite [data-al-cgo="ueberblick"], #allesLadeInhalt [data-al-cgo="ueberblick"]');
      if (!k) return fertig(null);
      k.click();
      const werte = []; let n = 0;
      (function schau() {
        const el = [...document.querySelectorAll('#dashGrid .dn[data-zahl]')].find(x => +x.dataset.zahl > 1);
        if (el) werte.push(el.textContent === el.dataset.zahl);
        if (++n < 30) requestAnimationFrame(schau); else fertig(werte);
      })();
    }));
    pruefe('mit „weniger Bewegung" steht sofort die Endzahl', !!(verlauf && verlauf.length) && verlauf.every(Boolean), JSON.stringify(verlauf));
    await ctx.close();
  }

  await b.close();
  console.log('\n' + gut + ' gut, ' + schlecht + ' schlecht');
  if (schlecht) console.log('✗ Runde 115: ' + schlecht + ' Prüfungen fehlgeschlagen');
  process.exit(schlecht ? 1 : 0);
})();
