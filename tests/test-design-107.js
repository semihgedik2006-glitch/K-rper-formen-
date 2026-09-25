/* ══════════════════════════════════════════════════════════════════════
   DESIGN-RUNDE 107: VIER KLEINE DINGE AUS DEN EIGENEN LISTEN

   Aus dem Betrieb, 25.9.2026: „mach weiter mit design sachen".
   Genommen wurde, was in docs/DESIGN-IDEEN.md und
   docs/DESIGN-RECHERCHE.md offen stand, klein ist und sofort wirkt:

   1. CHAT (Ideen Nr. 10): Der Tag-Trenner klebt oben, solange man in
      seinem Tag liest. Alle Trenner gleich breit und deckend — sonst
      ragt der vorige unter dem nächsten heraus.
   2. SCHULUNG (Recherche E1): „1 von 8 geschafft — 7 fehlen noch" mit
      Balken; folgt der gewählten Kategorie. Gegenprobe: die Zahl
      stimmt mit den Modulen überein, die unten als erledigt markiert
      sind.
   3. AUFGABEN (Ideen Nr. 26): An einer OFFENEN Aufgabe steht „Foto"
      neben der Kamera; an einer erledigten nicht. Die Kamera trifft
      man 44 × 44, ohne dass die Zeile höher wird.
   4. RECHNER (Ideen Nr. 29): Unten in der Seitenleiste steht
      „Tastenkürzel ?", ein Klick öffnet die Übersicht; die
      Seitenleiste verrät beim Darüberfahren die Taste. Am Handy nicht.
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
async function oeffne(b, w, h, rolle) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + (rolle || 'chef'), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
const nav = (p, g) => p.evaluate((g) => document.querySelector('.mobnav [data-group="' + g + '"], #side [data-group="' + g + '"]').click(), g);

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. Chat: der Tag-Trenner klebt ──');
  {
    const p = await oeffne(b, 390, 844);
    await nav(p, 'g-komm'); await p.waitForTimeout(1500);
    const r = await p.evaluate(async () => {
      const s = document.getElementById('chatScroll');
      const seps = [...s.querySelectorAll('.day-sep')];
      const breiten = seps.map(x => Math.round(x.getBoundingClientRect().width));
      /* In die Mitte des ersten Tages rollen, der nicht der letzte ist. */
      const erster = seps[0], zweiter = seps[1];
      if (!erster || !zweiter) return { seps: seps.length };
      s.scrollTop = erster.offsetTop + (zweiter.offsetTop - erster.offsetTop) / 2;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const kS = s.getBoundingClientRect(), kE = erster.getBoundingClientRect();
      const stil = getComputedStyle(erster);
      /* Wo er kleben SOLL: Innenabstand des Chats plus sein eigenes `top`. */
      const soll = parseFloat(getComputedStyle(s).paddingTop) + parseFloat(stil.top);
      return { seps: seps.length, breiten, oben: Math.round(kE.top - kS.top), soll: Math.round(soll), klebt: stil.position,
               deckend: stil.backgroundColor, text: erster.textContent };
    });
    pruefe('der Chat hat mehrere Tage (sonst prüft die nächste Zeile nichts)', r.seps >= 2, String(r.seps));
    pruefe('beim Lesen mitten im Tag steht sein Trenner oben am Rand („' + r.text + '")',
      r.klebt === 'sticky' && Math.abs(r.oben - r.soll) <= 2, JSON.stringify(r));
    pruefe('alle Trenner gleich breit — der nächste deckt den vorigen ganz', new Set(r.breiten || []).size === 1,
      (r.breiten || []).join(','));
    pruefe('und deckend, nicht durchscheinend', !/rgba\(.*, 0(\.\d+)?\)$/.test(r.deckend || '') && !/transparent/.test(r.deckend || ''), r.deckend);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 2. Schulung: der offene Rest ──');
  {
    const p = await oeffne(b, 390, 844);
    await nav(p, 'g-alles').catch(() => {});
    await p.evaluate(() => { const k = document.querySelector('.mobnav [data-group="g-ich"], #side [data-group="g-ich"]'); if (k) k.click(); });
    await p.waitForTimeout(700);
    await p.evaluate(() => { const t = [...document.querySelectorAll('[data-subview]')].find(x => /Schulung/.test(x.textContent)); t.click(); });
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => ({
      text: (document.getElementById('schRest') || {}).textContent || '',
      karten: document.querySelectorAll('[data-schmodul]').length,
      fertig: document.querySelectorAll('[data-schmodul] .sch-marke.fertig').length,
      balken: (document.querySelector('#schRest [role="progressbar"]') || {}).getAttribute ? document.querySelector('#schRest [role="progressbar"]').getAttribute('aria-valuenow') : null
    }));
    const m = /(\d+) von (\d+) geschafft/.exec(r.text) || [];
    pruefe('„x von y geschafft" steht über den Modulen', !!m[0], r.text);
    pruefe('GEGENPROBE die Zahlen stimmen mit der Liste darunter', +m[1] === r.fertig && +m[2] === r.karten,
      r.text + ' / ' + r.fertig + ' erledigt von ' + r.karten);
    pruefe('und sagt, was fehlt', /fehl(t|en) noch|alles erledigt/.test(r.text), r.text);
    pruefe('der Balken trägt dieselbe Zahl', String(r.balken) === String(r.fertig), String(r.balken));
    const ems = await p.evaluate(() => {
      document.querySelector('[data-schkat="ems"]').click();
      return new Promise(r => setTimeout(() => r((document.getElementById('schRest') || {}).textContent || ''), 300));
    });
    pruefe('er folgt der Kategorie („EMS-Wissen: … von 5")', /^EMS-Wissen: \d von 5 geschafft/.test(ems), ems);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 3. Aufgaben: „Foto" an offenen Aufgaben ──');
  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180]]) {
    const p = await oeffne(b, w, h);
    await nav(p, 'g-arbeit'); await p.waitForTimeout(1200);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const r = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const offen = document.querySelector('#todoArea .todo:not(.done) .t-cam');
        const erledigt = document.querySelector('#todoArea .todo.done .t-cam');
        if (!offen) return null;
        offen.scrollIntoView({ block: 'center' });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return { wort: offen.textContent.trim(), m: T(offen), sichtbar: Math.round(offen.getBoundingClientRect().height),
                 erledigtWort: erledigt ? erledigt.textContent.trim() : null };
      }, TREFFER.toString());
      pruefe(w + ' px, ' + dichte + ': „Foto" steht an der offenen Aufgabe, Treffer ≥ 44 × 44 (' + (r && r.m.w) + ' × ' + (r && r.m.h) + ')',
        !!r && r.wort === 'Foto' && r.m.w >= 44 && r.m.h >= 44, JSON.stringify(r));
      if (dichte === 'normal') {
        pruefe(w + ' px: die Zeile wird dadurch nicht höher (Knopf sichtbar ' + (r && r.sichtbar) + ' px)', !!r && r.sichtbar <= 30);
        if (r && r.erledigtWort !== null) pruefe(w + ' px: GEGENPROBE an einer erledigten Aufgabe nur das Zeichen', r.erledigtWort === '', r.erledigtWort);
      }
    }
    await p.close();
  }

  console.log('\n── 4. Rechner: Tastenkürzel sichtbar ──');
  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h);
    const r = await p.evaluate(() => {
      const k = document.querySelector('#side .side-tasten');
      const alle = [...document.querySelectorAll('#side > *')].filter(e => e.offsetParent);
      const unten = alle.reduce((m, e) => Math.max(m, e.getBoundingClientRect().bottom), 0);
      return { da: !!k && !!k.offsetParent, text: k ? k.textContent : '',
               zuletzt: !!k && Math.round(k.getBoundingClientRect().bottom) === Math.round(unten),
               titel: (document.querySelector('#side [data-group="g-arbeit"]') || {}).title || '' };
    });
    pruefe(w + ' px: „Tastenkürzel ?" steht ganz unten in der Seitenleiste', r.da && /Tastenkürzel\?/.test(r.text) && r.zuletzt, JSON.stringify(r));
    pruefe(w + ' px: die Seitenleiste verrät die Taste (Aufgaben — Taste 3)', /Taste 3/.test(r.titel), r.titel);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const m = await p.evaluate((SRC) => { const T = eval('(' + SRC + ')'); return T(document.querySelector('#side .side-tasten')); }, TREFFER.toString());
      pruefe(w + ' px, ' + dichte + ': Treffer ≥ 44 × 44 (' + m.w + ' × ' + m.h + ')', m.w >= 44 && m.h >= 44);
    }
    const auf = await p.evaluate(() => { document.querySelector('#side .side-tasten').click();
      return new Promise(r => setTimeout(() => r(document.getElementById('keysModal').classList.contains('show')), 300)); });
    pruefe(w + ' px: ein Klick öffnet die Übersicht', auf);
    pruefe(w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  {
    const p = await oeffne(b, 390, 844);
    const da = await p.evaluate(() => { const k = document.querySelector('.side-tasten'); return !!k && !!k.offsetParent; });
    pruefe('GEGENPROBE am Handy (390 px) steht er nicht da', !da);
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Design-Runde 107: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Design-Runde 107: Tag-Trenner klebt, Schulungs-Rest, „Foto", Tastenkürzel am Rechner — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
