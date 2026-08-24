/* ── Sprachnachrichten: eigener Abspieler ─────────────────────────────
   Vorher stand in der Sprechblase <audio controls> — der eingebaute
   Abspieler des Browsers. Weiß, eckig, eigene Typografie: die
   auffälligste Stelle, an der die Gestaltung der App aufhörte.

   Geprüft wird:
     1. Nirgends steht mehr ein eingebauter Abspieler. Auch nicht bei
        den zwei Vorhör-Feldern im Eingabebereich — die wurden beim
        ersten Anlauf vergessen.
     2. Der eigene Abspieler ist vollständig: Knopf, Schieber, Zeit,
        Tempo.
     3. Das Tempo schaltet 1× → 1,5× → 2× → 1× durch.
     4. GEGENPROBE, und die ist der Grund für diesen Durchlauf: ein Tipp
        auf Abspielen, Tempo oder Schieber darf NICHT das
        Nachrichtenmenü öffnen. Genau das ist beim Umbau passiert — die
        Ausnahmeliste in bindMessageTools nannte `audio`, und dieses
        Element ist jetzt unsichtbar. Der Abspieler wäre unbenutzbar
        gewesen, und zwar auf eine Art, die kein Fehlerprotokoll zeigt.
     5. Der Abspielknopf ist mit dem Finger zu treffen (44px), obwohl er
        nur 34 misst.
     6. Der Schieber ist ein echtes input[type=range] — sonst können
        Tastatur und Vorlesegerät nicht springen.

   NICHT GEPRÜFT: dass immer nur eine Stimme gleichzeitig läuft. Dafür
   müsste hier echter Ton abgespielt werden; die Testdaten enthalten nur
   ein paar Byte Platzhalter, und play() scheitert daran zu Recht. Die
   Regel steht im Code und ist hier nicht messbar — das gehört gesagt,
   statt eine Behauptung aufzustellen, die niemand prüft.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) {
      errs.push('CONSOLE: ' + m.text().slice(0, 160));
    }
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-komm"]').click());
  await page.waitForTimeout(1300);

  /* ── 1: kein eingebauter Abspieler mehr ── */
  const alt = await page.evaluate(() =>
    [...document.querySelectorAll('audio[controls]')].map(a => a.id || '(ohne id)'));
  console.log('Eingebaute Abspieler übrig:', JSON.stringify(alt));
  if (alt.length) {
    errs.push('EINGEBAUT: ' + alt.join(', ') + ' benutzt noch <audio controls>');
  }

  /* ── 2 + 5 + 6: Aufbau ── */
  const bau = await page.evaluate(() => {
    const sp = document.querySelector('.msg [data-sp]');
    if (!sp) return { fehler: 'kein eigener Abspieler in einer Nachricht' };
    const k = sp.querySelector('.sp-play');
    const s = sp.querySelector('.sp-schieber');
    const r = k.getBoundingClientRect();
    const trifft = y => {
      const t = document.elementFromPoint(r.left + r.width / 2, y);
      return !!(t && t.closest('.sp-play'));
    };
    return {
      fehler: null,
      knopf: !!k, zeit: !!sp.querySelector('.sp-zeit'), tempo: !!sp.querySelector('.sp-tempo'),
      schieberTag: s && s.tagName.toLowerCase(), schieberTyp: s && s.getAttribute('type'),
      beschriftung: k.getAttribute('aria-label'),
      gemalt: Math.round(r.width) + 'x' + Math.round(r.height),
      griffOben: trifft(r.top + r.height / 2 - 21),
      griffUnten: trifft(r.top + r.height / 2 + 21),
    };
  });
  console.log('Aufbau:', JSON.stringify(bau));
  if (bau.fehler) errs.push(bau.fehler);
  else {
    if (!bau.knopf || !bau.zeit || !bau.tempo) errs.push('Dem Abspieler fehlt ein Teil: ' + JSON.stringify(bau));
    if (bau.schieberTag !== 'input' || bau.schieberTyp !== 'range') {
      errs.push('Der Schieber ist kein input[type=range] (' + bau.schieberTag + '/' +
        bau.schieberTyp + ') — Tastatur und Vorlesegerät können dann nicht springen');
    }
    if (!bau.beschriftung) errs.push('Der Abspielknopf hat keine Beschriftung für Vorlesegeräte');
    if (!bau.griffOben || !bau.griffUnten) {
      errs.push('Der Abspielknopf ist nur ' + bau.gemalt + ' und hat keine 44er Trefferfläche');
    }
  }

  /* ── 3: Tempo ── */
  const tempo = await page.evaluate(async () => {
    const k = document.querySelector('.msg [data-sp] .sp-tempo');
    if (!k) return null;
    const raus = [k.textContent.trim()];
    for (let i = 0; i < 3; i++) {
      k.click();
      await new Promise(r => setTimeout(r, 80));
      raus.push(k.textContent.trim());
    }
    return raus;
  });
  console.log('Tempo:', tempo && tempo.join(' → '));
  if (!tempo || tempo.join('|') !== '1×|1,5×|2×|1×') {
    errs.push('Das Tempo schaltet nicht 1× → 1,5× → 2× → 1× durch: ' + JSON.stringify(tempo));
  }

  /* ── 4: Gegenprobe — kein Nachrichtenmenü ── */
  const menue = await page.evaluate(async () => {
    const raus = {};
    for (const sel of ['.sp-play', '.sp-tempo', '.sp-schieber']) {
      const blatt = document.getElementById('msgSheet');
      if (blatt) blatt.classList.remove('show');
      const k = document.querySelector('.msg [data-sp] ' + sel);
      if (!k) { raus[sel] = 'nicht da'; continue; }
      k.click();
      await new Promise(r => setTimeout(r, 320));
      raus[sel] = (document.getElementById('msgSheet') || {}).classList
        && document.getElementById('msgSheet').classList.contains('show') ? 'MENÜ AUF' : 'zu';
    }
    return raus;
  });
  console.log('Nachrichtenmenü nach Tipp:', JSON.stringify(menue));
  Object.keys(menue).forEach(sel => {
    if (menue[sel] !== 'zu') {
      errs.push('BLUBBERT: Tipp auf ' + sel + ' öffnet das Nachrichtenmenü (' + menue[sel] + ') — ' +
        'der Abspieler wäre damit unbenutzbar');
    }
  });

  /* Gegenprobe zur Gegenprobe: öffnet ein Tipp auf die Nachricht SELBST
     das Menü noch? Sonst hätte man die Ausnahme zu weit gezogen und das
     Menü ganz abgeschaltet, ohne es zu merken. */
  const normal = await page.evaluate(async () => {
    const blatt = document.getElementById('msgSheet');
    if (blatt) blatt.classList.remove('show');
    const koerper = document.querySelector('.msg .body');
    if (!koerper) return 'keine Textnachricht da';
    koerper.click();
    await new Promise(r => setTimeout(r, 320));
    return document.getElementById('msgSheet').classList.contains('show') ? 'auf' : 'ZU';
  });
  console.log('Tipp auf den Nachrichtentext:', normal);
  if (normal !== 'auf') {
    errs.push('ZU WEIT: das Nachrichtenmenü öffnet sich gar nicht mehr (' + normal + ')');
  }

  await page.screenshot({ path: SP + '/sprachabspieler.png' });
  await b.close();
  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Eigener Abspieler: vollständig, mit dem Finger zu treffen, Tempo schaltet — ' +
      'und er löst das Nachrichtenmenü nicht mehr aus');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
