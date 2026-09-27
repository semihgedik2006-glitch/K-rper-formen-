/* ══════════════════════════════════════════════════════════════════════
   AVATARFARBEN OHNE GRELLHEIT (Runde 127, DESIGN-IDEEN 24)

   Aus dem Betrieb, 27.9.2026, auf „nur die Sättigung deckeln": ja.
   1. Jede Farbe der Auswahl wird mit höchstens 62 % Sättigung GEZEIGT —
      in der Auswahl selbst, in der Vorschau und an der Person in Listen.
   2. Gespeichert wird weiter der gewählte Wert (niemand verliert seine
      Farbe; der Deckel kann sich ändern, ohne Daten anzufassen).
   3. Die Initialen haben auf jeder Farbe ≥ 4,5 : 1, hell und dunkel.
      GEGENPROBE: die alten Farben mit der alten Schrift fielen darunter.
   4. Der Farbton bleibt: Rot bleibt rot, Blau bleibt blau.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
/* Im Browser: Farbe → HSL-Sättigung, Farbton, Kontrast. */
const WERKZEUG = () => {
  window.__f = {
    rgb(s) { const m = s.match(/\d+(\.\d+)?/g).map(Number); return m.slice(0, 3); },
    hsl([r, g, b]) {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
      if (!d) return { h: 0, s: 0, l };
      const s = l > .5 ? d / (2 - max - min) : d / (max + min);
      let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return { h: h * 60, s, l };
    },
    lum([r, g, b]) { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); },
    kontrast(a, b) { const x = this.lum(a), y = this.lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); },
    hex(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); },
  };
};

async function oeffne(b, w, h, thema) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((t) => {
    localStorage.setItem('kf_tour', '99:demo-ich');
    localStorage.setItem('kf_prefs', JSON.stringify({ theme: t }));
  }, thema);
  await p.addInitScript(WERKZEUG);
  await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  return p;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  for (const thema of ['dark', 'light']) {
    console.log('\n── ' + (thema === 'dark' ? 'dunkel' : 'hell') + ' ──');
    const p = await oeffne(b, 1440, 900, thema);
    /* Profil öffnen, Reiter „Profil". */
    await p.evaluate(() => { const a = document.getElementById('uAvatar'); if (a) a.click(); });
    await p.waitForTimeout(700);
    const auswahl = await p.evaluate(() => [...document.querySelectorAll('#pmColors .pm-color[data-c]')].filter(e => e.dataset.c)
      .map(e => ({ c: e.dataset.c, bg: getComputedStyle(e).backgroundColor })));
    pruefe('die Auswahl zeigt ' + auswahl.length + ' Farben', auswahl.length >= 9, JSON.stringify(auswahl));
    const zuSatt = await p.evaluate((a) => a.map(x => ({ c: x.c, s: window.__f.hsl(window.__f.rgb(x.bg)).s }))
      .filter(x => x.s > 0.63), auswahl);
    pruefe('1. in der Auswahl keine über 62 % Sättigung', auswahl.length && !zuSatt.length, JSON.stringify(zuSatt));
    const ton = await p.evaluate((a) => a.map(x => {
      const alt = window.__f.hsl(window.__f.hex(x.c)).h, neu = window.__f.hsl(window.__f.rgb(x.bg)).h;
      return { c: x.c, d: Math.round(Math.min(Math.abs(alt - neu), 360 - Math.abs(alt - neu))) };
    }).filter(x => x.d > 3), auswahl);
    pruefe('4. der Farbton bleibt (höchstens 3° Abweichung)', !ton.length, JSON.stringify(ton));

    /* Jede Farbe einmal wählen: Vorschau-Hintergrund und Schrift messen. */
    const vorschau = await p.evaluate(async () => {
      const r = [];
      for (const e of [...document.querySelectorAll('#pmColors .pm-color[data-c]')].filter(e => e.dataset.c)) {
        e.click(); await new Promise(x => setTimeout(x, 30));
        const av = document.getElementById('pmPreview'); const cs = getComputedStyle(av);
        const bg = window.__f.rgb(cs.backgroundColor), fg = window.__f.rgb(cs.color);
        r.push({ c: e.dataset.c, s: +window.__f.hsl(bg).s.toFixed(2), k: +window.__f.kontrast(bg, fg).toFixed(2) });
      }
      return r;
    });
    pruefe('1. auch die Vorschau ist gedeckelt', vorschau.every(x => x.s <= 0.63), JSON.stringify(vorschau.filter(x => x.s > 0.63)));
    pruefe('3. Initialen in der Vorschau ≥ 4,5 : 1 auf jeder Farbe (kleinste ' + Math.min(...vorschau.map(x => x.k)) + ')',
      vorschau.every(x => x.k >= 4.5), JSON.stringify(vorschau.filter(x => x.k < 4.5)));

    /* GEGENPROBE: die alten Farben mit der alten Schrift. */
    const alt = await p.evaluate(() => {
      const fg = window.__f.rgb(getComputedStyle(document.body).getPropertyValue('--on-accent').trim().replace(/^#/, '')
        .match(/../g).map(x => parseInt(x, 16)).join(','));
      return [...document.querySelectorAll('#pmColors .pm-color[data-c]')].filter(e => e.dataset.c)
        .map(e => +window.__f.kontrast(window.__f.hex(e.dataset.c), fg).toFixed(2));
    });
    pruefe('GEGENPROBE: ungedeckelt mit der alten Schrift lag mindestens eine unter 4,5 (kleinste ' + Math.min(...alt) + ')',
      alt.some(k => k < 4.5), JSON.stringify(alt));

    /* 2. Gespeichert wird der GEWÄHLTE Wert. */
    await p.evaluate(() => { const e = document.querySelector('#pmColors .pm-color[data-c="#EF4444"]'); if (e) e.click(); });
    await p.evaluate(() => { const s = document.getElementById('pmSave'); if (s) s.click(); });
    await p.waitForTimeout(700);
    const gespeichert = await p.evaluate(() => window.firebase.firestore().collection('users').doc('demo-ich').get().then(d => d.data().color));
    pruefe('2. gespeichert bleibt der gewählte Wert (#EF4444), nicht der gedeckelte', gespeichert === '#EF4444', gespeichert);

    /* An der Person in einer Liste (Team). */
    await p.evaluate(() => window.firebase.firestore().collection('users').doc('demo-u2').update({ color: '#FBBF24' }).catch(() => {}));
    await p.waitForTimeout(500);
    const liste = await p.evaluate(() => {
      const avs = [...document.querySelectorAll('.avatar')].filter(a => a.style.background || a.getAttribute('style'));
      return avs.map(a => { const cs = getComputedStyle(a); const bg = window.__f.rgb(cs.backgroundColor);
        return { s: +window.__f.hsl(bg).s.toFixed(2), k: +window.__f.kontrast(bg, window.__f.rgb(cs.color)).toFixed(2) }; })
        .filter(x => x.s > 0);
    });
    pruefe('an Personen in der App: keine über 62 %, Initialen ≥ 4,5 : 1 (' + liste.length + ' farbige Avatare)',
      liste.length >= 1 && liste.every(x => x.s <= 0.63 && x.k >= 4.5), JSON.stringify(liste));
    pruefe('keine Skriptfehler', p._fehler.length === 0, p._fehler.join(' | '));
    await p.close();
  }

  await b.close();
  console.log('\n' + gut + ' bestanden, ' + schlecht + ' gefallen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
