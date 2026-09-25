/* ══════════════════════════════════════════════════════════════════════
   AUSKUNFT NACH ART. 15 — DIE OBERFLÄCHE (P-10, Runde 114)

   Aus dem Betrieb, 25.9.2026: „Ja genau so" — auf: alles, was die Person
   geschrieben hat oder was über sie gespeichert ist, und ein Knopf für
   den Chef, der daraus eine Datei macht.

   Der Server (auskunftErstellen) ist in tests/rules/auskunft.test.js
   geprüft. Hier in der Demo:
   1. Ich → Daten: „Meine Daten herunterladen" lädt EINE Datei
      (Auskunft-<Name>-<Datum>.html) herunter. Darin: Überschrift,
      Name, „Fassung: voll", Stempelzeiten, und dieselben Daten als JSON.
   2. Verwaltung → Team → Bearbeiten: „Datenauskunft herunterladen" —
      nur für die Geschäftsführung; die Datei trägt die begrenzte
      Fassung und sagt, was fehlt und warum.
   3. Die Knöpfe treffen ≥ 44 hoch.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 200) : '')); }
}
async function oeffne(b, w, h, rolle) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, acceptDownloads: true });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
async function allesZu(p, sel) {
  await p.evaluate(() => { const a = document.querySelector('#side [data-group="g-alles"], .mobnav [data-group="g-alles"]'); if (a) a.click(); });
  await p.waitForTimeout(500);
  await p.evaluate((sel) => { const k = document.querySelector('#allesLadeInhalt ' + sel + ', #allesSeite ' + sel); if (k) k.click(); }, sel);
  await p.waitForTimeout(1200);
}
async function laden(p, sel) {
  const [dl] = await Promise.all([
    p.waitForEvent('download', { timeout: 8000 }),
    p.evaluate((sel) => document.querySelector(sel).click(), sel)
  ]);
  const pfad = await dl.path();
  return { name: dl.suggestedFilename(), inhalt: fs.readFileSync(pfad, 'utf8') };
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── Ich → Daten ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h, 'mitarbeiter');
    await allesZu(p, '[data-alles="ich"][data-al-ichtab="daten"]');
    const k = await p.evaluate(() => { const e = document.getElementById('ichAuskunft'); if (!e || !e.offsetParent) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { h: Math.round(r.height), w: Math.round(r.width) }; });
    pruefe(w + ' px: „Meine Daten herunterladen" ist da und trifft ≥ 44 hoch', !!k && k.h >= 44, JSON.stringify(k));
    if (w === 390) {
      const d = await laden(p, '#ichAuskunft');
      pruefe('eine Datei „Auskunft-<Name>-<Datum>.html"', /^Auskunft-.+-\d{4}-\d{2}-\d{2}\.html$/.test(d.name), d.name);
      pruefe('darin: Überschrift, Name und „Fassung: voll"', /Auskunft über gespeicherte Daten/.test(d.inhalt) && /Demo-Mitarbeiter/.test(d.inhalt) && /Fassung: <b>voll<\/b>/.test(d.inhalt), d.inhalt.slice(0, 300));
      pruefe('darin: Stempelzeiten (aus der Demo)', /Stempelzeiten \(\d+\)/.test(d.inhalt));
      pruefe('darin: dieselben Daten maschinenlesbar (JSON)', /maschinenlesbar \(JSON\)/.test(d.inhalt) && /"bereiche"/.test(d.inhalt));
      const note = await p.evaluate(() => document.getElementById('ichAuskunftNote').textContent);
      pruefe('danach steht, wie viele Einträge es waren', /Heruntergeladen: \d+ Einträge/.test(note), note);
    }
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── Verwaltung → Team (Chef) ──');
  {
    const p = await oeffne(b, 1440, 900, 'chef');
    await allesZu(p, '[data-alles="chef"]');
    await p.evaluate(() => { const t = document.querySelector('[data-ctab="team"]'); if (t) t.click(); });
    await p.waitForTimeout(900);
    await p.evaluate(() => { const k = document.querySelector('[data-cpane="team"] [data-fold="teamliste"]'); if (k && k.classList.contains('zu')) k.querySelector('.fold-head, h3').click(); });
    await p.waitForTimeout(400);
    await p.evaluate(() => document.querySelector('#empList .emp .em-edit').click());
    await p.waitForTimeout(400);
    const k = await p.evaluate(() => { const e = document.querySelector('#empList .auskunft-knopf'); if (!e || !e.offsetParent) return null; e.scrollIntoView({ block: 'center' }); return { text: e.textContent, h: Math.round(e.getBoundingClientRect().height) }; });
    pruefe('im Bearbeiten-Bereich: „Datenauskunft herunterladen", ≥ 44 hoch', !!k && /Datenauskunft/.test(k.text) && k.h >= 44, JSON.stringify(k));
    const d = await laden(p, '#empList .auskunft-knopf');
    pruefe('die Datei trägt die begrenzte Fassung und sagt, was fehlt', /ohne Direktnachrichten-Inhalte/.test(d.inhalt) && /Nicht enthalten:/.test(d.inhalt), d.inhalt.slice(0, 400));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  {
    const p = await oeffne(b, 1440, 900, 'leiter');
    const hat = await p.evaluate(() => !!document.querySelector('#empList .auskunft-knopf'));
    pruefe('GEGENPROBE: die Studioleitung hat den Chef-Knopf nicht', !hat);
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Auskunft: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Auskunft: eine Datei, lesbar und maschinenlesbar, für die Person und den Chef — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
