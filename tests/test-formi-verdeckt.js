/* ══════════════════════════════════════════════════════════════════════
   VERDECKT DIE FORMI-KUGEL ETWAS? (Runde 182, 22.10.2026)

   Aus dem Betrieb: „achte aber bitte darauf das der neue formi knopf
   nichts verdeckt in der app also teste jeden knopf etc."

   Die Kugel schwebt über der Seite (unten rechts). Wo Inhalt unter ihr
   durchscrollt, ist das gewollt — solange man jedes Bedienelement so
   hinscrollen kann, dass die Kugel es NICHT berührt. Geprüft wird je
   Rolle (Chef, Leitung, Mitarbeiter), je Breite (320 / 390 / 430 / 820 /
   1280 / 1440 / 1920) und je Dichte (normal, kompakt), auf JEDER Ansicht
   und in jedem ihrer Reiter, für JEDES sichtbare Bedienelement:

    1. Liegt es in etwas Festem (fixed/sticky, z. B. eine Leiste unten,
       ein Eingabefeld unten), darf es die Kugel gar nicht berühren.
    2. Sonst wird es nacheinander mittig, oben und unten in seinen
       Scrollbereich geholt; in mindestens einer Lage muss es ganz frei
       von der Kugel (plus 4 px Rand) liegen.
    3. Wo die Kugel ausgeblendet ist (Chat, Formis Seite), gibt es nichts
       zu prüfen — das wird mitgezählt, nicht verschwiegen.

   Dazu: die Rückgängig-Leiste unten (z 95) und der Hinweis (Toast) dürfen
   nicht unter der Kugel liegen.

   Was das NICHT prüft: Dialoge und Fenster (sie liegen über der Kugel,
   z ≥ 200 — die Kugel liegt bei z 150), echte Handys.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;
const SCHNELL = process.env.SCHNELL === '1';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

/* Läuft in der Seite: misst eine Ansicht. */
const MESSEN = () => {
  const kugel = document.getElementById('formiKugel');
  if (!kugel || kugel.hidden || !kugel.getClientRects().length) return { aus: true };
  const k = kugel.getBoundingClientRect();
  const K = { l: k.left - 4, t: k.top - 4, r: k.right + 4, b: k.bottom + 4 };
  const ueber = (r) => r.right > K.l && r.left < K.r && r.bottom > K.t && r.top < K.b;
  /* Nur „fixed" kann man nie wegscrollen. „sticky" klebt nur, bis sein
     Behälter zu Ende ist — dort wird wie bei allem anderen gescrollt. */
  const fest = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { if (getComputedStyle(e).position === 'fixed') return true; } return false; };
  const name = (el) => (el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')) +
    ' „' + (el.getAttribute('aria-label') || el.textContent || el.placeholder || '').trim().replace(/\s+/g, ' ').slice(0, 30) + '"';
  const sel = 'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=checkbox], [role=switch], [tabindex="0"], summary, label[for]';
  const view = document.querySelector('.view.show');
  /* Zugeklappte Bereiche (<details>) aufmachen, damit auch ihr Inhalt
     geprüft wird — danach wieder zu. */
  const zugeklappt = [...view.querySelectorAll('details:not([open])')];
  zugeklappt.forEach(d => { d.open = true; });
  const wurzeln = [view, document.getElementById('side'), document.getElementById('mobnav'), document.querySelector('.topbar'), document.getElementById('bereichZeile')].filter(Boolean);
  const alle = new Set();
  wurzeln.forEach(w => w.querySelectorAll(sel).forEach(e => alle.add(e)));
  const funde = [];
  let gemessen = 0;
  alle.forEach(el => {
    if (el.closest('#jarvis, #formiKugel, [hidden]')) return;
    /* Inhalt eines zugeklappten <details> hat in Chrome Masse, wird aber
       nicht gezeichnet — nur die Kopfzeile (summary) ist bedienbar. */
    const zu = el.closest('details:not([open])');
    if (zu && !el.closest('summary')) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || el.disabled && el.tagName === 'INPUT') return;
    const r0 = el.getBoundingClientRect();
    if (!r0.width || !r0.height) return;
    /* Nur wirklich gezeichnete Elemente: ein Vorfahr mit display:none
       oder 0 Höhe (zugeklappt) zählt nicht. */
    if (!el.getClientRects().length) return;
    gemessen++;
    if (fest(el)) {
      if (ueber(r0)) funde.push('FEST unter der Kugel: ' + name(el));
      return;
    }
    let frei = false;
    /* Auch seitlich: Karten in einer Wischleiste (Schulung) lassen sich
       zur Mitte holen. */
    const lagen = [];
    for (const block of ['center', 'start', 'end', 'nearest']) for (const inline of ['nearest', 'center', 'start']) lagen.push([block, inline]);
    for (const [block, inline] of lagen) {
      el.scrollIntoView({ block, inline });
      const r = el.getBoundingClientRect();
      /* Ein Element, das höher ist als der sichtbare Bereich, kann nie
         ganz frei liegen — dann reicht: sein oberer Teil ist frei. */
      if (!ueber(r) || (r.height > innerHeight * 0.6 && r.top < K.t - 44)) { frei = true; break; }
    }
    if (!frei) { const r = el.getBoundingClientRect(); funde.push('nicht freizuscrollen: ' + name(el) + ' [' + Math.round(r.top) + '–' + Math.round(r.bottom) + ', Kugel ' + Math.round(K.t) + '–' + Math.round(K.b) + ']'); }
  });
  zugeklappt.forEach(d => { d.open = false; });
  /* Zurück nach oben, damit die nächste Messung gleich anfängt. */
  document.querySelectorAll('.scroll-area').forEach(s => { s.scrollTop = 0; });
  view.querySelectorAll('*').forEach(e => { if (e.scrollLeft) e.scrollLeft = 0; });
  window.scrollTo(0, 0);
  return { aus: false, gemessen, funde };
};

async function oeffne(b, w, h, stub) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await p.addInitScript({ path: SP + '/' + stub });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(900);
  p._ctx = ctx;
  return p;
}
/* Eine Ansicht über den Verlauf öffnen — derselbe Weg wie „Zurück". */
const zeige = (p, id) => p.evaluate((id) => {
  history.pushState({ v: id }, '', '#' + id);
  window.dispatchEvent(new PopStateEvent('popstate', { state: { v: id } }));
}, id);
const aktuell = (p) => p.evaluate(() => ((document.querySelector('.view.show') || {}).id || '').replace('view-', ''));

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const rollen = [['stub-chef.js', 'Chef'], ['stub-leiter.js', 'Leitung'], ['stub-mitarbeiter.js', 'Mitarbeiter']];
  let breiten = SCHNELL ? [[390, 844], [1440, 900]] : [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]];
  /* BREITEN=320x568,390x844 prüft nur diese (zum Nachmessen). */
  if (process.env.BREITEN) breiten = process.env.BREITEN.split(',').map(x => x.split('x').map(Number));
  let ansichten = 0, ohneKugel = 0, elemente = 0;
  try {
    for (const [stub, rolle] of rollen) {
      for (const [w, h] of breiten) {
        for (const dichte of ['normal', 'kompakt']) {
          if (SCHNELL && dichte === 'kompakt' && w !== 390) continue;
          const p = await oeffne(b, w, h, stub);
          if (dichte === 'kompakt') await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt'));
          const ids = await p.evaluate(() => [...document.querySelectorAll('section.view[id^="view-"]')].map(s => s.id.replace('view-', '')));
          const alleFunde = [];
          for (const id of ids) {
            await zeige(p, id); await p.waitForTimeout(350);
            if ((await aktuell(p)) !== id) continue; /* nicht erlaubt für diese Rolle */
            /* Reiter der Ansicht nacheinander. */
            const reiter = await p.evaluate(() => [...document.querySelectorAll('.view.show [role=tab]')].filter(t => t.getClientRects().length).length);
            for (let t = -1; t < Math.min(reiter, 14); t++) {
              if (t >= 0) {
                await p.evaluate((t) => { const l = [...document.querySelectorAll('.view.show [role=tab]')].filter(x => x.getClientRects().length); if (l[t]) l[t].click(); }, t);
                await p.waitForTimeout(250);
              }
              /* Ein Hinweis (Toast) hebt die Kugel kurz an — gemessen wird
                 der Normalzustand, also erst wenn er weg ist (höchstens 5 s).
                 Die Lage MIT Hinweis prüft der Teil „unten" weiter unten. */
              await p.waitForFunction(() => !document.querySelector('.toast.show, .undobar.show'), null, { timeout: 5000 }).catch(() => {});
              await p.waitForTimeout(200);
              const m = await p.evaluate(MESSEN);
              ansichten++;
              if (m.aus) { ohneKugel++; continue; }
              elemente += m.gemessen;
              m.funde.forEach(f => alleFunde.push(id + (t >= 0 ? ' · Reiter ' + (t + 1) : '') + ': ' + f));
            }
          }
          /* Rückgängig-Leiste und Hinweis */
          await zeige(p, 'home'); await p.waitForTimeout(300);
          const unten = await p.evaluate(() => {
            const k = document.getElementById('formiKugel'); if (!k || k.hidden) return [];
            const kr = k.getBoundingClientRect(); const raus = [];
            const probe = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; document.body.appendChild(d);
              const r = d.getBoundingClientRect(); if (r.right > kr.left - 4 && r.left < kr.right + 4 && r.bottom > kr.top - 4 && r.top < kr.bottom + 4) raus.push(cls + ' (' + Math.round(r.left) + '–' + Math.round(r.right) + ' × ' + Math.round(r.top) + '–' + Math.round(r.bottom) + ')'); d.remove(); };
            /* Die Kugel weicht aus, solange eine davon steht — gemessen
               wird also die Kugel MIT eingeblendeter Leiste. */
            const probeMit = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; document.body.appendChild(d);
              const k2 = k.getBoundingClientRect(); const r = d.getBoundingClientRect();
              if (r.right > k2.left - 4 && r.left < k2.right + 4 && r.bottom > k2.top - 4 && r.top < k2.bottom + 4) raus.push(cls + ' (' + Math.round(r.left) + '–' + Math.round(r.right) + ' × ' + Math.round(r.top) + '–' + Math.round(r.bottom) + ', Kugel ' + Math.round(k2.top) + '–' + Math.round(k2.bottom) + ')');
              d.remove(); };
            const vorher = getComputedStyle(k).transition; k.style.transition = 'none';
            probeMit('undobar show', '<span>Aufgabe „Briefkasten leeren" erledigt</span><button>Rückgängig</button>');
            probeMit('toast show', 'Gespeichert — in allen Studios sichtbar');
            k.style.transition = '';
            return raus;
          });
          unten.forEach(f => alleFunde.push('unten: ' + f + ' liegt unter der Kugel'));
          pruefe(`${rolle} ${w}×${h} ${dichte}: nichts verdeckt`, !alleFunde.length, alleFunde.slice(0, 12).join(' | ') + (alleFunde.length > 12 ? ' … +' + (alleFunde.length - 12) : ''));
          if (p._fehler.length) pruefe(`${rolle} ${w}×${h} ${dichte}: keine Seitenfehler`, false, p._fehler.join(' | '));
          await p._ctx.close();
        }
      }
    }
  } catch (e) {
    console.log('Fehler: ' + e.message.split('\n')[0]);
    schlecht++;
  }
  await b.close();
  console.log(`\nGemessen: ${ansichten} Ansichten/Reiter, davon ${ohneKugel} ohne Kugel (Chat, Formi), ${elemente} Bedienelemente.`);
  console.log(schlecht ? `✗ Formi verdeckt: ${schlecht} von ${gut + schlecht} falsch` : `✓ Formi verdeckt nichts: ${gut} Zusicherungen`);
  process.exit(schlecht ? 1 : 0);
})();
