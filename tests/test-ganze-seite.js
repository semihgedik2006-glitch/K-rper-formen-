/* ══ KEIN :has AM <body> — EINE ÄNDERUNG RECHNET NICHT DIE GANZE SEITE (Runde 251)
   Plan „Studio Chat wie von Apple", Schritt 5: „Formi-Gefühle auf der
   Startseite leichter (Formi-Aussehen nicht ändern)". Seit 23.10.2026,
   15:18: „es soll einfach den ganzen plan erledigen".

   Gefunden beim Messen der Gefühle: der Jubel selbst ist billig (nur
   transform/opacity, alles auf dem Compositor). Teuer war, dass JEDE
   Änderung am Dokument — ein Teilchen in die Kugel, eine Welle an den
   <body>, ein Inline-Stil — die ganze Seite neu berechnen liess
   (~650 Elemente, 8–14 ms am Rechner ohne Drosselung). Ursache: sechs
   Regeln der Form „body:has(…) .formi-kugel". Ein :has am <body> heisst
   für Chromium: bei jeder Änderung irgendwo darunter könnte sich der
   <body> ändern — und mit ihm, über die zusammengelegte Menge der
   :has-Regeln, jedes Element. Ersetzt durch Geschwister („~", die
   Blätter, die Meldung und die Rückgängig-Leiste stehen vor der Kugel)
   und zwei Klassen (hat-daumen, pp-filter-auf).

   Geprüft wird:
    1. Im CSS steht keine Regel mit :has am <body>, <html> oder :root.
       GEGENPROBE: die Prüfung findet eine eingeschleuste Regel.
    2. Ein <span> in die Kugel, ein <div> an den <body>, ein Inline-Stil:
       die nächste Stilberechnung fasst < 120 Elemente an (gezählt im
       Trace, nicht gestoppt). GEGENPROBE: mit einer eingeschleusten
       „body:has(.x) .y"-Regel sind es wieder > 300.
    3. „Freut", „stolz" und „feiert": keine Berechnung der ganzen Seite.
    4. Was die sechs Regeln taten, tun die neuen genauso (bei 390 px,
       Blätter auch bei 1440): Kugel und Sprechblase weg unter einem
       offenen Blatt; Kugel 72 px höher bei Meldung und Rückgängig-Leiste;
       Kugel über „+ Aufgabe" im Daumen-Dock; Kugel weg beim Filtern auf
       kleinem Handy (320 × 640), danach wieder da; das Einrichten-Fenster
       über der Zwei-Faktor-Sperre.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(name, ok, info) {
  if (ok) { gut++; console.log('  ✓ ' + name); }
  else { schlecht++; console.log('  ✗ ' + name + (info ? '  — ' + info : '')); }
}

/* 1. Statisch: Regeln mit :has am obersten Element. Kommentare raus,
   dann jeden Selektor einzeln (an Kommas ausserhalb von Klammern). */
function hasAmBody(css) {
  const ohne = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const treffer = [];
  const re = /([^{}]+)\{/g; let m;
  while ((m = re.exec(ohne))) {
    const teile = m[1].split(/,(?![^(]*\))/);
    teile.forEach(s => { s = s.trim(); if (/^(html|body|:root)[.#\w-]*(\[[^\]]*\])*:has\(/.test(s)) treffer.push(s); });
  }
  return treffer;
}

/* Ein Geschwister-Selektor, der auf * endet („+ *", „~ *", „* + *::before"):
   Chromium rechnet beim Entfernen eines Elements dann den ganzen
   Teilbaum des Elternteils neu — am <body> heisst das: die ganze Seite. */
function geschwisterStern(css) {
  const ohne = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const treffer = [];
  const re = /([^{}]+)\{/g; let m;
  while ((m = re.exec(ohne))) m[1].split(/,(?![^(]*\))/).forEach(s => { s = s.trim(); if (/[+~]\s*\*?\s*(::?[\w-]+)?$/.test(s.replace(/:not\([^)]*\)$/, '')) && /[+~]\s*\*/.test(s)) treffer.push(s); });
  return treffer;
}

async function oeffne(b, w, h, extra) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'formi', stil2: true })); });
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  if (extra) await p.addStyleTag({ content: extra });
  /* Das Hochzählen der Zahlen auf der Startseite ist vorbei, Formis
     Zeitgeber ruhen. */
  await p.evaluate(() => window.__formiLebt && window.__formiLebt.uhrenAus && window.__formiLebt.uhrenAus());
  await p.waitForTimeout(1500);
  return { ctx, p };
}

/* Stilberechnungen im Trace: wie viele Elemente fasst jede an? */
async function zaehle(ctx, p, tat, ms, arg) {
  const cdp = await ctx.newCDPSession(p);
  const ev = [];
  cdp.on('Tracing.dataCollected', d => ev.push(...d.value));
  const fertig = new Promise(r => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { categories: 'devtools.timeline', transferMode: 'ReportEvents' });
  await p.evaluate(tat, arg);
  await p.waitForTimeout(ms || 300);
  await cdp.send('Tracing.end'); await fertig;
  await cdp.detach();
  return ev.filter(e => e.name === 'UpdateLayoutTree' && e.ph === 'X').map(e => e.args.elementCount || 0);
}

(async () => {
  console.log('── 1. Kein :has am <body> im CSS ──');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const css = (html.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join('\n');
  const t = hasAmBody(css);
  pruefe('keine Regel „body:has(…)", „html:has(…)", „:root:has(…)"', t.length === 0, t.slice(0, 3).join(' | '));
  pruefe('GEGENPROBE die Prüfung findet eine eingeschleuste Regel',
    hasAmBody('.a{x:1}\nbody.neu:has(.toast.show) .formi-kugel,.b{y:2}').length === 1 &&
    hasAmBody('/* body:has(.x) .y{} */ .c{z:3}').length === 0);

  const g = geschwisterStern(css);
  pruefe('kein Geschwister-Selektor, der auf * endet („+ *", „~ *")', g.length === 0, g.slice(0, 3).join(' | '));
  pruefe('GEGENPROBE die Prüfung findet „.a > * + *::before" und „.b + *"',
    geschwisterStern('.a > * + *::before{x:1} .b + *{y:2} .c + .d{z:3}').length === 2);

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── 2. Eine Änderung am Dokument rechnet nicht die ganze Seite ──');
    const taten = {
      'ein <span> in die Kugel': () => { const s = document.createElement('span'); s.className = 'probe-x'; document.querySelector('.formi-kugel').appendChild(s); },
      'ein <div> an den <body>': () => { const d = document.createElement('div'); d.className = 'probe-x'; document.body.appendChild(d); },
      'ein Inline-Stil an der Kugel': () => { document.querySelector('.formi-kugel').style.outlineOffset = '1px'; },
    };
    for (const w of [390, 1440]) {
      const { ctx, p } = await oeffne(b, w, w > 820 ? 900 : 844);
      const alle = await p.evaluate(() => document.querySelectorAll('*').length);
      for (const [name, tat] of Object.entries(taten)) {
        const n = await zaehle(ctx, p, tat);
        const max = Math.max(0, ...n);
        pruefe(w + ' px: ' + name + ' → höchstens ' + max + ' von ' + alle + ' Elementen neu (< 120)', max < 120, JSON.stringify(n));
      }
      console.log('\n   ' + w + ' px: Gefühle an der Kugel');
      for (const art of ['freut', 'stolz', 'feiert']) {
        const n = await zaehle(ctx, p, (a) => { window.__formiLebt.fuehlt(a); window.__probeAnim = document.getAnimations().length; }, 2600, art);
        const anim = await p.evaluate(() => window.__probeAnim);
        pruefe(w + ' px: GEGENPROBE „' + art + '" läuft (' + anim + ' Animationen gleich danach)', anim > 40);
        const voll = n.filter(x => x > 300).length;
        pruefe(w + ' px: „' + art + '" ohne Berechnung der ganzen Seite (' + n.length + ' Stilberechnungen, grösste ' + Math.max(0, ...n) + ')', voll === 0, 'ganze Seite: ' + voll + '×');
        await p.waitForTimeout(800);
      }
      await ctx.close();
    }
    {
      const { ctx, p } = await oeffne(b, 390, 844, 'body:has(.probe-gegen) .formi-kugel{outline-color:red}');
      const n = await zaehle(ctx, p, taten['ein <span> in die Kugel']);
      pruefe('GEGENPROBE mit eingeschleustem „body:has(…)" sind es wieder > 300 (' + Math.max(0, ...n) + ')', Math.max(0, ...n) > 300, JSON.stringify(n));
      await ctx.close();
    }

    console.log('\n── 4. Die neuen Regeln tun, was die alten taten ──');
    for (const w of [390, 1440]) {
      const { p } = await oeffne(b, w, w > 820 ? 900 : 844);
      const kugel = () => { const k = document.querySelector('.formi-kugel'), bl = document.querySelector('.formi-blase'), cs = getComputedStyle(k);
        return { vis: cs.visibility, tr: cs.transform, bottom: parseFloat(cs.bottom), blase: bl ? getComputedStyle(bl).visibility : 'fehlt' }; };
      const vorher = await p.evaluate(kugel);
      pruefe(w + ' px: GEGENPROBE die Kugel ist ohne Anlass zu sehen', vorher.vis === 'visible', JSON.stringify(vorher));
      for (const id of ['msgSheet', 'todoSheet', 'shiftSheet', 'docSheet']) {
        const z = await p.evaluate((id) => { document.getElementById(id).classList.add('show'); return 1; }, id);
        const k = await p.evaluate(kugel);
        pruefe(w + ' px: #' + id + ' offen → Kugel und Sprechblase weg', k.vis === 'hidden' && k.blase === 'hidden', JSON.stringify(k));
        await p.evaluate((id) => document.getElementById(id).classList.remove('show'), id);
      }
      pruefe(w + ' px: Blatt zu → Kugel wieder da', (await p.evaluate(kugel)).vis === 'visible');
      if (w <= 820) {
        for (const id of ['toast', 'undoBar']) {
          await p.evaluate((id) => document.getElementById(id).classList.add('show'), id);
          await p.waitForTimeout(300); // die Kugel gleitet 160 ms hinauf
          const k = await p.evaluate(kugel);
          pruefe(w + ' px: #' + id + ' steht → Kugel 72 px höher', /matrix\(1, 0, 0, 1, 0, -72\)/.test(k.tr), k.tr);
          await p.evaluate((id) => document.getElementById(id).classList.remove('show'), id);
        }
        await p.waitForTimeout(300);
        pruefe(w + ' px: GEGENPROBE ohne Meldung keine Verschiebung', !/-72/.test((await p.evaluate(kugel)).tr));
      }
      if (w === 1440) {
        const hl = await p.evaluate(() => [...document.querySelectorAll('#view-home .heute-liste')].map(l => [...l.children].map(c => getComputedStyle(c, '::before').content)));
        const mehr = hl.filter(l => l.length > 1).length;
        /* Seit Runde 296 sieht die Geschäftsführung Studio-Kacheln; unter
           ihnen steht das angetippte Studio mit kurzen Listen, die bei
           wenig Platz nur EINE Zeile zeigen. Gibt es dann keine Liste mit
           mehreren Zeilen, wird nur geprüft, dass vor der ersten Zeile
           keine Linie steht — die Linien zwischen Zeilen prüft
           test-gruppen-titel bei den Mitarbeitern. */
        const leitung = await p.evaluate(() => !!document.querySelector('#view-home .ls'));
        pruefe('1440 px Startseite: Trennlinie in den Listen vor jeder Zeile ausser der ersten (' + hl.length + ' Listen, ' + mehr + ' mit mehreren Zeilen)',
          (mehr > 0 || leitung) && hl.every(l => l[0] === 'none' && l.slice(1).every(x => x === '""')), JSON.stringify(hl));
      }
      const z = await p.evaluate(() => { const zp = document.getElementById('zfPflicht'), zm = document.getElementById('zfModal');
        const a = getComputedStyle(zm).zIndex; zp.hidden = false; const b2 = getComputedStyle(zm).zIndex; zp.hidden = true; return [a, b2]; });
      pruefe(w + ' px: Zwei-Faktor-Sperre offen → Einrichten-Fenster darüber (z ' + z[0] + ' → ' + z[1] + ')', z[1] === '890' && z[0] !== '890');
      console.log('  · Fehler auf der Seite: ' + (p._fehler.length ? p._fehler.join(' | ') : 'keine'));
    }
    {
      /* Daumen-Dock: Aufgaben am Handy, „+ Aufgabe" steht unten rechts. */
      const { p } = await oeffne(b, 390, 844);
      const ohne = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.formi-kugel')).bottom));
      await p.evaluate(() => { const g = document.querySelector('.mobnav [data-group="g-arbeit"]'); if (g) g.click(); });
      await p.waitForTimeout(400);
      await p.evaluate(() => { const s = document.querySelector('[data-subview="todos"]'); if (s) s.click(); });
      await p.waitForTimeout(600);
      const d = await p.evaluate(() => ({ dock: !document.getElementById('daumenDock').hidden && !!document.querySelector('#daumenDock .kopf-plus'),
        klasse: document.body.classList.contains('hat-daumen'), bottom: parseFloat(getComputedStyle(document.querySelector('.formi-kugel')).bottom) }));
      pruefe('390 px Aufgaben: „+ Aufgabe" im Daumen-Dock, body.hat-daumen gesetzt', d.dock && d.klasse, JSON.stringify(d));
      const zg = await p.evaluate(() => [...document.querySelectorAll('#todoArea .pp-gruppe')].map(g => { const k = g.querySelector('.pg-kopf'), n = k && k.nextElementSibling;
        return n ? getComputedStyle(n).getPropertyValue('--zg-oben').trim() : 'leer'; }));
      pruefe('390 px Aufgaben: die erste Zeile jeder Gruppe trägt die obere Rundung (--zg-oben 1px)', zg.length > 0 && zg.every(x => x === '1px' || x === 'leer'), JSON.stringify(zg));
      pruefe('390 px Aufgaben: Kugel steht 68 px höher als auf der Startseite (' + ohne + ' → ' + d.bottom + ')', Math.abs(d.bottom - ohne - 68) < 1);
    }
    {
      /* Filtern auf kleinem Handy: die Kugel tritt zur Seite. */
      const { p } = await oeffne(b, 320, 640);
      await p.evaluate(() => { const g = document.querySelector('.mobnav [data-group="g-arbeit"]'); if (g) g.click(); });
      await p.waitForTimeout(400);
      await p.evaluate(() => { const s = document.querySelector('[data-subview="todos"]'); if (s) s.click(); });
      await p.waitForTimeout(600);
      const vis = () => getComputedStyle(document.querySelector('.formi-kugel')).visibility;
      const a = await p.evaluate(vis);
      await p.evaluate(() => document.getElementById('tdFilterKnopf').click()); await p.waitForTimeout(150);
      const auf = await p.evaluate(vis);
      await p.evaluate(() => document.getElementById('tdFilterKnopf').click()); await p.waitForTimeout(150);
      const zu = await p.evaluate(vis);
      pruefe('320 × 640 Aufgaben: Filter auf → Kugel weg, zu → wieder da (' + [a, auf, zu].join(' → ') + ')', a === 'visible' && auf === 'hidden' && zu === 'visible');
    }
  } finally { await b.close(); }
  console.log('\n' + (schlecht ? '✗' : '✓') + ' Ganze Seite: ' + gut + ' grün, ' + schlecht + ' falsch');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
