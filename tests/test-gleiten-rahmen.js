/* ══════════════════════════════════════════════════════════════════════
   FLÜSSIG, ZWEITER DURCHGANG (Runde 122)

   Aus dem Betrieb: „richtig flüssig … im Idealfall 120 fps". Gemessen
   am 25.9.2026 mit CPU ÷4 (1440 und 390 px), und gefunden:
     · das „LIVE"-Abzeichen glühte ENDLOS über box-shadow — die
       Kopfzeile wurde in jedem Bild neu gemalt, auch in Ruhe;
     · „überfällig" pulsierte beim Scrollen jedes Mal neu, sobald eine
       Zeile unterhalb der zwölften ins Bild kam, jede auf eigener Ebene;
     · das Farbgleiten lag an Kopfzeile und Seitenleiste als GANZES: in
       jedem Bild des Übergangs 146 Elemente neu gerechnet;
     · die Startseite wurde beim Start 18-mal gezeichnet, jedes Mal mit
       Messen und Kürzen, die Aufgabenliste 14-mal.

   Dieser Durchlauf hält fest, was daraus wurde — ohne Stoppuhr, weil
   Zeiten hier schwanken. Geprüft wird, WAS passiert:
     1. Beim Bereichswechsel gleitet jedes Rahmen-Element, das seine Farbe
        ändert; keines springt. (Vorher sprangen 17 von 39.)
        GEGENPROBE: ohne die neuen Übergänge springen welche.
     2. Nach dem Start läuft keine Endlos-Animation.
        GEGENPROBE: das alte Glühen wird erkannt.
     3. Die Startseite wird beim Start höchstens fünfmal gezeichnet
        (vorher 18) und passt trotzdem auf den Bildschirm.
     4. „überfällig" pulsiert nur in den ersten zwölf Zeilen.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

async function oeffne(b, w, h, rolle, vorher) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => {
    localStorage.setItem('kf_tour', '99:demo-ich');
    window.__heute = 0;
    const d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    Object.defineProperty(Element.prototype, 'innerHTML', {
      set(v) { if (this.id === 'heuteListe') window.__heute++; return d.set.call(this, v); },
      get() { return d.get.call(this); } });
  });
  if (vorher) await p.addInitScript(vorher);
  await p.goto(APP + '?demo=' + (rolle || 'chef'), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  return p;
}

/* Welche Rahmen-Elemente ändern beim Wechsel Start → Putzplan ihre
   Farbe, und liegen sie nach 60 ms schon zwischen alt und neu? */
const GLEITEN = async () => {
  const props = ['color', 'background-color', 'background-image', 'border-top-color', 'box-shadow', 'fill', 'stroke'];
  const els = [...document.querySelectorAll('.side, .side *, .topbar, .topbar *, .demo-bar, .demo-bar *, .mobnav, .mobnav *')]
    .filter(e => e.getClientRects().length);
  const f = () => els.map(e => { const c = getComputedStyle(e); return props.map(k => c.getPropertyValue(k)).join('|'); });
  const name = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : '');
  const vor = f();
  [...document.querySelectorAll('[data-group="g-putz"]')].find(x => x.getClientRects().length).click();
  /* Nicht auf die Uhr warten: unter Last (Gesamtdurchlauf mit zwei
     Hälften nebeneinander) war der Übergang nach „60 ms" schon vorbei,
     weil der Klick selbst länger brauchte — der Durchlauf fiel, einzeln
     lief er grün. Jetzt wird jeder laufende Übergang angehalten und auf
     genau 60 ms gestellt, dann gemessen, dann zu Ende gespult. Dieselbe
     Frage, unabhängig von der Last. */
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const laufend = document.getAnimations().filter(a => a.constructor && a.constructor.name === 'CSSTransition');
  laufend.forEach(a => { a.pause(); a.currentTime = 60; });
  const mitte = f();
  laufend.forEach(a => { try { a.finish(); } catch (e) {} });
  await new Promise(r => setTimeout(r, 700)); const nach = f();
  const gleitet = [], springt = [];
  els.forEach((e, i) => { if (vor[i] === nach[i]) return; (mitte[i] !== vor[i] && mitte[i] !== nach[i] ? gleitet : springt).push(name(e)); });
  return { gleitet, springt };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. Der Rahmen gleitet, ganz ──');
  for (const [w, h] of [[1440, 900], [1280, 800], [390, 844]]) {
    const p = await oeffne(b, w, h);
    const r = await p.evaluate(GLEITEN);
    pruefe(w + ' px: ' + r.gleitet.length + ' Elemente gleiten, keines springt',
      r.gleitet.length >= 20 && r.springt.length === 0, 'springt: ' + r.springt.join(', '));
    if (w === 1440) {
      pruefe('„Bericht" gleitet mit (der Verlauf, den test-akzent misst)', r.gleitet.some(x => /tbBericht/.test(x)), r.gleitet.join(', '));
      /* GEGENPROBE: die neuen Übergänge weg — dann muss die Messung
         Springer finden, sonst misst sie nichts. */
      await p.addStyleTag({ content: '.tb-bericht,.tb-live,.demo-bar,.tb-brand b,body .topbar .icon-btn.tb-bericht{transition:none!important}' });
      await p.evaluate(() => [...document.querySelectorAll('[data-group="g-start"]')].find(x => x.getClientRects().length).click());
      await p.waitForTimeout(800);
      const g = await p.evaluate(GLEITEN);
      pruefe('GEGENPROBE ohne die Übergänge springen welche', g.springt.length > 0, JSON.stringify(g.springt));
    }
    pruefe(w + ' px: keine Skriptfehler', p._fehler.length === 0, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 2. Keine Endlos-Animation ──');
  const endlos = () => document.getAnimations()
    .filter(a => a.playState === 'running' && a.effect && a.effect.getTiming().iterations === Infinity)
    .map(a => (a.animationName || a.transitionProperty) + ' @' + ((a.effect.target && (a.effect.target.className || a.effect.target.tagName)) || '?').toString().slice(0, 30));
  for (const [w, h, g] of [[1440, 900, 'g-start'], [1440, 900, 'g-arbeit'], [390, 844, 'g-arbeit']]) {
    const p = await oeffne(b, w, h);
    await p.evaluate((g) => [...document.querySelectorAll('[data-group="' + g + '"]')].find(x => x.getClientRects().length).click(), g);
    await p.waitForTimeout(1500);
    const e = await p.evaluate(endlos);
    pruefe(w + ' px, ' + g + ': keine Endlos-Animation', e.length === 0, e.join(', '));
    if (w === 1440 && g === 'g-start') {
      await p.addStyleTag({ content: '.tb-live{animation:altGlow 2.6s ease-in-out infinite}@keyframes altGlow{50%{box-shadow:0 0 0 4px red}}' });
      await p.waitForTimeout(100);
      const e2 = await p.evaluate(endlos);
      pruefe('GEGENPROBE das alte Glühen würde erkannt', e2.length > 0);
      /* Das Abzeichen glüht weiterhin — dreimal, auf der Grafikkarte. */
      const live = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('.tb-live'), '::after'); return s.animationName + ' ' + s.animationIterationCount; });
      pruefe('„Live" glüht noch — dreimal, über die Deckkraft', /liveGlow 3/.test(live), live);
    }
    await p.close();
  }

  console.log('\n── 3. Die Startseite zeichnet seltener und passt ──');
  for (const [w, h, rolle] of [[1440, 900, 'chef'], [390, 844, 'chef'], [390, 844, 'mitarbeiter'], [1920, 1080, 'leiter']]) {
    const p = await oeffne(b, w, h, rolle);
    await p.waitForTimeout(1000);
    const r = await p.evaluate(() => {
      const sa = document.querySelector('#view-home .scroll-area');
      return { n: window.__heute, ueber: sa ? sa.scrollHeight - sa.clientHeight : -1,
        zeilen: document.querySelectorAll('#heuteListe .heute-zeile').length };
    });
    pruefe(w + ' px, ' + rolle + ': ' + r.n + '-mal gezeichnet (höchstens 5), passt, zeigt ' + r.zeilen + ' Zeilen',
      r.n >= 1 && r.n <= 5 && r.ueber <= 2 && r.zeilen >= 1, JSON.stringify(r));
    await p.close();
  }

  console.log('\n── 4. „überfällig" pulsiert nur oben ──');
  {
    const p = await oeffne(b, 1440, 900);
    await p.evaluate(() => [...document.querySelectorAll('[data-group="g-arbeit"]')].find(x => x.getClientRects().length).click());
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const oben = [...document.querySelectorAll('.todo:not(.ohne-ein) .t-due.over')].map(x => getComputedStyle(x).animationName);
      const unten = [...document.querySelectorAll('.todo.ohne-ein .t-due.over')].map(x => getComputedStyle(x).animationName);
      return { oben, unten };
    });
    pruefe('in den ersten zwölf Zeilen pulsiert „überfällig"', r.oben.length > 0 && r.oben.every(x => x === 'duePulse'), JSON.stringify(r.oben));
    pruefe('darunter nicht (dort startete es beim Scrollen jedes Mal neu)', r.unten.length > 0 && r.unten.every(x => x === 'none'), JSON.stringify(r.unten));
    await p.close();
  }

  await b.close();
  console.log('\n' + gut + ' bestanden, ' + schlecht + ' gefallen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
