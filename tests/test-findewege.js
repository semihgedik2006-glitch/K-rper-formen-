/* ══ FINDEWEGE: WIE VIELE TIPPS BIS ZUM ZIEL? (Runde 223) ════════════
   Aus der Studienlage (docs/design-vorbilder/studien-psychologie.md,
   Folgerung 14): „Wirkung messen statt fragen … je 5 typische Aufgaben
   stoppen". Eine Stoppuhr mit Menschen gibt es hier nicht – gemessen wird,
   was sich messen lässt: die kürzeste Zahl an Tipps über SICHTBARE
   Bedienelemente der Navigation, von „Heute" aus, ohne Suche und ohne
   Formi (beides kann jeder Weg ersetzen und würde jede Zahl auf 1 drücken).

   Der Durchlauf sucht in die Breite (BFS): Er drückt nacheinander jeden
   sichtbaren Navigationsknopf (Räume, Reiter, Umschalter, „Direkt",
   Team-Reiter, „Alles"-Einträge) und merkt sich, welche Ansicht/welcher
   Teil nach wie vielen Tipps erreicht ist.

   Grenze (Hauswunsch „jedes Ziel in zwei Tipps über ‚Alles'"): ≤ 2,
   Aufgaben und Schichtplan als tägliche Hauptziele ≤ 1.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

/* Die typischen Aufgaben aus dem Betrieb, mit ihrem Ziel und der Grenze. */
const ZIELE = [
  { was: 'Putzplan abhaken', ziel: 'putzplan', max: 2 },
  { was: 'Aufgaben ansehen', ziel: 'todos', max: 1 },
  { was: 'Wer arbeitet wann (Schichtplan)', ziel: 'team', max: 1 },
  { was: 'Jemandem direkt schreiben', ziel: 'dm', max: 2 },
  { was: 'Aushänge lesen', ziel: 'ann:brett', max: 2 },
  { was: 'Material eintragen', ziel: 'material', max: 2 },
  { was: 'Gerät defekt melden', ziel: 'geraete', max: 2 },
  { was: 'Meine Zeiten / stempeln', ziel: 'ich', max: 2 },
  { was: 'Eine Schulung machen', ziel: 'schulung', max: 2 },
  { was: 'Ein Dokument finden', ziel: 'docs', max: 2 }
];

/* Welche Elemente zählen als Navigation (keine Inhalte, keine Suche). */
const NAV_SEL = [
  '#side > [data-group]', '.mn-reihe [data-group]', '.mobnav > [data-group]',
  '#subnav [data-subview]', '.umschalter [data-umschalt]', '.umschalter [data-pinteil]',
  '.umschalter [data-chatart]', '#kanalDirekt', '#kanalSpalte [data-dmalle]',
  '#bereichKopf', '#allesLade [data-alles]'
].join(',');

async function oeffne(b, w, h) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript(() => { try { localStorage.setItem('kf_tour', '1:testuid'); localStorage.setItem('kf_formi_gruss', new Date().toDateString()); } catch (e) {} });
  await p.addInitScript({ path: SP + '/stub-chef.js' });
  await p.goto(APP + '?neu=1', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(900);
  p._ctx = ctx;
  return p;
}
const zustand = (p) => p.evaluate(() => {
  const v = ((document.querySelector('.view.show') || {}).id || '').replace('view-', '');
  const brett = document.getElementById('bbList');
  const teil = v === 'ann' && brett && brett.getClientRects().length && brett.closest('#view-ann') ? ':brett' : '';
  /* Eine offene Schublade „Alles" ist ein eigener Zustand: die Ansicht
     bleibt, aber die Ziele darin sind jetzt einen Tipp entfernt. Ohne das
     verwarf die Suche den Weg über „Alles" (erste Fassung: Geräte in 3). */
  const lade = document.getElementById('allesLade');
  const offen = lade && !lade.hidden && lade.getClientRects().length ? '+alles' : '';
  return v + teil + offen;
});
/* Sichtbare Navigationsknöpfe als wiederauffindbare Schlüssel. */
const knoepfe = (p, SEL) => p.evaluate((SEL) => [...document.querySelectorAll(SEL)]
  .filter(e => e.getClientRects().length && e.checkVisibility() && getComputedStyle(e).display !== 'none')
  .map(e => {
    /* Zeilen in „Alles" teilen sich die Ansicht (data-alles="ann" für
       Infos UND Aushänge) – der Schlüssel nimmt die Zusätze mit. */
    if (e.hasAttribute('data-alles')) return '[data-alles="' + e.getAttribute('data-alles') + '"]' +
      [...e.attributes].filter(a => /^data-(pin|al-)/.test(a.name)).map(a => '[' + a.name + '="' + a.value + '"]').join('');
    const attrs = ['data-group', 'data-subview', 'data-umschalt', 'data-pinteil', 'data-chatart', 'data-alles', 'data-dmalle', 'id'];
    for (const a of attrs) if (e.getAttribute(a)) return '[' + a + '="' + e.getAttribute(a) + '"]';
    return null;
  }).filter(Boolean)
  .filter((x, i, l) => l.indexOf(x) === i), SEL);

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  for (const [w, h, name] of [[390, 844, 'Handy'], [1440, 900, 'Rechner']]) {
    console.log('\n── ' + name + ' (' + w + ' px) ──');
    /* BFS: Pfade als Liste von Schlüsseln; jeder Pfad startet frisch auf „Heute". */
    const tiefe = { home: 0 };
    let ebene = [[]];
    for (let d = 1; d <= 3; d++) {
      const naechste = [];
      for (const pfad of ebene) {
        const p = await oeffne(b, w, h);
        let ok = true;
        for (const k of pfad) {
          const da = await p.evaluate((k) => { const e = [...document.querySelectorAll(k)].find(x => x.getClientRects().length); if (e) e.click(); return !!e; }, k);
          if (!da) { ok = false; break; }
          await p.waitForTimeout(350);
        }
        if (!ok) { await p._ctx.close(); continue; }
        const kandidaten = await knoepfe(p, NAV_SEL);
        await p._ctx.close();
        for (const k of kandidaten) {
          const q = await oeffne(b, w, h);
          let geht = true;
          for (const x of pfad.concat([k])) {
            const da = await q.evaluate((x) => { const e = [...document.querySelectorAll(x)].find(y => y.getClientRects().length); if (e) e.click(); return !!e; }, x);
            if (!da) { geht = false; break; }
            await q.waitForTimeout(350);
          }
          const z = geht ? await zustand(q) : null;
          await q._ctx.close();
          if (z && tiefe[z] === undefined) { tiefe[z] = d; naechste.push(pfad.concat([k])); }
        }
      }
      /* Nur weitersuchen, solange noch ein Ziel fehlt. */
      if (ZIELE.every(x => tiefe[x.ziel] !== undefined)) break;
      ebene = naechste;
    }
    for (const z of ZIELE) {
      const t = tiefe[z.ziel];
      pruefe(name + ': ' + z.was + ' in ' + (t === undefined ? '>3' : t) + ' Tipp' + (t === 1 ? '' : 's') + ' (Grenze ' + z.max + ')', t !== undefined && t <= z.max, JSON.stringify(tiefe));
    }
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Findewege: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Findewege: jedes typische Ziel in höchstens zwei bis drei Tipps — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
