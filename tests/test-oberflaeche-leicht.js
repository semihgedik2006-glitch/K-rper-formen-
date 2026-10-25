/* ══════════════════════════════════════════════════════════════════════
   OBERFLÄCHE LEICHTER (Runde 276) — Ideen 13, 14, 15, 16, 17, 20 aus
   docs/ideen/formi-und-oberflaeche-20.md

   Aus dem Betrieb (25.10.2026): „mach alles davon".

   Geprüft:
   13. „+ Anlegen" auf Heute (Rechner): ein Menü mit dem, was man von hier
       anlegt; jeder Eintrag per Hit-Test ≥ 44 × 44, im Bild, bei 1280 /
       1440 / 1920; Esc schliesst; am Handy gibt es den Knopf nicht.
   14. Aufgabe löschen ohne Rückfrage-Fenster, mit „Rückgängig".
   15. Die Glocke bündelt: drei Meldungen aus Hürth → EINE Zeile
       „3 neue in Hürth", aufklappbar (≥ 44 px), eine einzelne steht so.
   16. Neue Aufgabe: die zuletzt gewählten Studios sind schon an.
   17. Fokus: F blendet Seitenleiste und Kopfleiste aus, „Fokus beenden"
       ≥ 44 × 44; F oder Esc beendet; am Handy tut F nichts.
   20. Knöpfe beginnen gross und sagen ein Verb: kein „löschen",
       „ansehen", „Hinzu", „Schliessen" mehr im Quelltext.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
async function oeffne(b, w, h, vorher) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p._fehler = []; p._dialoge = 0;
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  p.on('dialog', d => { p._dialoge++; d.accept(); });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  if (vorher) await p.addInitScript(vorher);
  await p.addInitScript({ path: path.join(__dirname, 'stub-chef.js') });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(900);
  p._ctx = ctx;
  return p;
}
const zeige = (p, id) => p.evaluate((id) => { history.pushState({ v: id }, '', '#' + id); window.dispatchEvent(new PopStateEvent('popstate', { state: { v: id } })); }, id);
const TREFFER = (el) => {
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0, imBild: false };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--; while (u < innerHeight && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--; while (re < innerWidth && trifft(re + 1, cy)) re++;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1), imBild: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── 13 „+ Anlegen" auf Heute ──');
    for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080], [390, 844]]) {
      const p = await oeffne(b, w, h);
      const k = await p.evaluate((TR) => { const k = document.getElementById('homeNeu'); return k && k.getClientRects().length ? (eval(TR))(k) : null; }, TREFFER.toString());
      if (w < 821) { pruefe(`${w} px: am Handy kein „+" auf Heute`, k === null, JSON.stringify(k)); await p._ctx.close(); continue; }
      pruefe(`${w} px: „+ Anlegen" ${k && k.w}×${k && k.h}`, k && k.w >= 44 && k.h >= 44 && k.imBild, JSON.stringify(k));
      await p.click('#homeNeu'); await p.waitForTimeout(250);
      const m = await p.evaluate((TR) => [...document.querySelectorAll('#knopfMenu .km-eintrag')].map(x => Object.assign({ t: x.textContent }, (eval(TR))(x))), TREFFER.toString());
      pruefe(`${w} px: Menü ${m.map(x => x.t).join(' / ')}, je ≥ 44 × 44 im Bild`, m.length >= 3 && m.every(x => x.w >= 44 && x.h >= 44 && x.imBild) && m[0].t === 'Aufgabe', JSON.stringify(m));
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      pruefe(`${w} px: Esc schliesst`, await p.evaluate(() => !document.getElementById('knopfMenu')));
      await p.click('#homeNeu'); await p.waitForTimeout(200); await p.click('#knopfMenu .km-eintrag'); await p.waitForTimeout(900);
      /* Die Leitung landet im vollen Formular (Verwaltung → Erstellen), alle anderen im kleinen Fenster der Aufgaben. */
      pruefe(`${w} px: „Aufgabe" führt zum Anlegen`, await p.evaluate(() => /view-(todos|chef)/.test(document.querySelector('.view.show').id)));
      pruefe(`${w} px: ohne Skriptfehler`, !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }

    console.log('\n── 14 Löschen ohne Rückfrage, mit Rückgängig ──');
    {
      const p = await oeffne(b, 1440, 900);
      await zeige(p, 'todos'); await p.waitForTimeout(700);
      await p.evaluate(() => { window.__schreib = window.__schreib || []; });
      await p.locator('#todoArea .todo:not(.done) [data-tmehr] >> visible=true').first().click(); await p.waitForTimeout(400);
      const hatLoeschen = await p.$('#todoSheet [data-tba="loeschen"]');
      if (hatLoeschen) {
        await p.click('#todoSheet [data-tba="loeschen"]'); await p.waitForTimeout(500);
        const r = await p.evaluate(() => ({ toast: (document.getElementById('toast') || document.body).textContent, undo: !!document.querySelector('.undo-bar.show, #undoBar.show, [data-undo]') }));
        pruefe('„Löschen" fragt nicht nach, bietet „Rückgängig"', p._dialoge === 0 && (/gelöscht/.test(r.toast) || r.undo), JSON.stringify(r) + ' Dialoge ' + p._dialoge);
      } else pruefe('Löschen-Eintrag im Aufgaben-Blatt vorhanden', false, 'kein [data-tba=loeschen]');
      await p._ctx.close();
    }

    console.log('\n── 15 Glocke gebündelt ──');
    {
      const p = await oeffne(b, 1440, 900);
      await p.evaluate(() => { const t = Date.now(); window.__oberflaeche.meld(t - 3000, 'aufgabe', 'Anna hat „A" erledigt', 'Hürth');
        window.__oberflaeche.meld(t - 2000, 'aufgabe', 'Ben hat „B" erledigt', 'Hürth'); window.__oberflaeche.meld(t - 1000, 'putz', 'Cem hat „C" erledigt', 'Hürth');
        window.__oberflaeche.meld(t - 500, 'aufgabe', 'Dora hat „D" erledigt', 'Brühl'); window.__oberflaeche.glocke(); });
      await p.waitForTimeout(300);
      const g = await p.evaluate((TR) => { const d = document.querySelector('#glockeListe details.gl-gruppe'); const s = d && d.querySelector('summary');
        return { gruppen: document.querySelectorAll('#glockeListe details.gl-gruppe').length, satz: s && s.textContent, einzeln: document.querySelectorAll('#glockeListe > .gl-zeile').length, t: s ? (eval(TR))(s) : null }; }, TREFFER.toString());
      pruefe(`Hürth gebündelt („${g.satz}"), Brühl einzeln, Zeile ${g.t && g.t.w}×${g.t && g.t.h}`, g.gruppen === 1 && /3 neue in Hürth/.test(g.satz) && g.einzeln === 1 && g.t.h >= 44, JSON.stringify(g));
      await p.click('#glockeListe details.gl-gruppe summary'); await p.waitForTimeout(200);
      pruefe('aufgeklappt stehen alle drei da', await p.evaluate(() => document.querySelectorAll('#glockeListe details.gl-gruppe[open] .gl-zeile').length === 3));
      await p._ctx.close();
    }

    console.log('\n── 16 Studios gemerkt ──');
    {
      const p = await oeffne(b, 1440, 900, () => { try { localStorage.setItem('kf_nt_studios', JSON.stringify(['studio-6'])); } catch (e) {} });
      await zeige(p, 'chef'); await p.waitForTimeout(500);
      await p.evaluate(() => { const t = [...document.querySelectorAll('[data-chef-tab], [data-chtab], .pm-tab')].find(x => /Erstellen|Anlegen/.test(x.textContent)); if (t) t.click(); });
      await p.waitForTimeout(400);
      const r = await p.evaluate(() => [...document.querySelectorAll('#ntStudios input')].map(i => i.value + ':' + i.checked));
      pruefe('„Hürth" (zuletzt gewählt) ist schon an, die anderen nicht', r.indexOf('studio-6:true') >= 0 && r.filter(x => /:true$/.test(x)).length === 1, JSON.stringify(r));
      await p._ctx.close();
    }

    console.log('\n── 17 Fokus ──');
    for (const [w, h] of [[1440, 900], [1920, 1080], [390, 844]]) {
      const p = await oeffne(b, w, h);
      await p.mouse.click(Math.round(w / 2), Math.round(h - 20)); await p.keyboard.press('f'); await p.waitForTimeout(300);
      const f = await p.evaluate((TR) => { const b = document.getElementById('fokusAus'); return { an: document.body.classList.contains('fokus'), side: document.getElementById('side') ? getComputedStyle(document.getElementById('side')).display : 'none', k: b && !b.hidden ? (eval(TR))(b) : null }; }, TREFFER.toString());
      if (w < 900) { pruefe(`${w} px: am Handy tut F nichts`, !f.an, JSON.stringify(f)); await p._ctx.close(); continue; }
      pruefe(`${w} px: F → Fokus, Seitenleiste weg, „Fokus beenden" ${f.k && f.k.w}×${f.k && f.k.h}`, f.an && f.side === 'none' && f.k && f.k.w >= 44 && f.k.h >= 44 && f.k.imBild, JSON.stringify(f));
      await p.keyboard.press('f'); await p.waitForTimeout(200);
      const aus = await p.evaluate(() => document.body.classList.contains('fokus'));
      await p.keyboard.press('f'); await p.waitForTimeout(200); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      const esc = await p.evaluate(() => document.body.classList.contains('fokus'));
      pruefe(`${w} px: noch einmal F beendet, Esc auch`, !aus && !esc, JSON.stringify({ aus, esc }));
      await p._ctx.close();
    }

    console.log('\n── 20 Sprache ──');
    {
      const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
      const klein = (html.match(/>(löschen|ansehen|Hinzu|Schliessen)<\/button>/g) || []);
      pruefe('kein „löschen", „ansehen", „Hinzu", „Schliessen" als Knopf', klein.length === 0, klein.join(', '));
    }
  } finally { await b.close(); }
  console.log(`\n${schlecht ? '✗' : '✓'} Oberfläche leichter: ${schlecht ? schlecht + ' von ' + (gut + schlecht) + ' falsch' : 'alle ' + gut + ' Zusicherungen erfüllt'}`);
  process.exit(schlecht ? 1 : 0);
})();
