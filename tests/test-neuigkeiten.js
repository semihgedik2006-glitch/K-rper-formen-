/* ══ „WAS IST NEU": DIE LISTE SELBST IST HEIL (Runde 224) ══════════════
   Gefunden am 23.10.2026: Nach zwei parallelen Zusammenführungen stand
   der Eintrag „Soll je Wochentag" ZWEIMAL in NEUIGKEITEN – einmal mit
   leerer Punkteliste (eine leere Karte in „Was ist neu"), einmal mit
   dem Ziel `chef:zeiten`, das es seit dem Raum „Zeiten" nicht mehr gibt
   („Zeigen ›" fehlte). Beim Nachsehen fehlte „Zeigen ›" noch bei sechs
   älteren Einträgen: `team` und `chef` ohne Unterreiter, `profil` (das
   Profil ist ein Fenster, keine Seite). Jeder PR schreibt oben einen Eintrag hinein
   (CLAUDE.md), jede Zusammenführung kann so etwas wieder anrichten.

    1. jede id kommt genau einmal vor;
    2. jeder Eintrag hat Datum (T.M.JJJJ), Titel und mindestens einen Punkt;
    3. neu oben: nach Datum absteigend;
    4. jedes `wo` führt beim Chef zu einem Ziel (schnellKatalog, so wie
       „Zeigen ›" in renderNeu) – dafür einmal die App im Browser.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const QUELLE = process.env.QUELLE || path.join(__dirname, '..', 'index.html');

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

(async () => {
  const s = fs.readFileSync(QUELLE, 'utf8');
  const i = s.indexOf('var NEUIGKEITEN =');
  const N = (0, eval)('(' + s.slice(s.indexOf('=', i) + 1, s.indexOf('\n];', i) + 2) + ')');

  const ids = N.map(e => e.id);
  const doppelt = ids.filter((x, k) => ids.indexOf(x) !== k);
  pruefe(N.length + ' Einträge, jede id einmal', !doppelt.length, doppelt.join(', '));

  const kaputt = N.filter(e => !/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(e.datum || '') || !(e.titel || '').trim() ||
    !Array.isArray(e.punkte) || !e.punkte.length || e.punkte.some(p => !String(p).trim())).map(e => e.id);
  pruefe('jeder Eintrag hat Datum, Titel und Punkte', !kaputt.length, kaputt.join(', '));

  const tag = e => { const [t, m, j] = e.datum.split('.').map(Number); return j * 10000 + m * 100 + t; };
  const falsch = N.filter((e, k) => k && tag(e) > tag(N[k - 1])).map(e => e.id);
  pruefe('neu oben: nach Datum absteigend', !falsch.length, falsch.join(', '));

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: 1440, height: 900 } });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript({ path: path.join(__dirname, 'stub-chef.js') });
  await p.goto(APP + '?neu=1', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  /* Über „Alles → Was ist neu" öffnen, wie ein Mensch; dann je Karte
     nachsehen, ob „Zeigen ›" da ist, wo der Eintrag ein `wo` trägt. */
  const da = await p.evaluate(async () => {
    await new Promise(r => setTimeout(r, 800));
    const lade = document.getElementById('bereichKopf'); if (lade) lade.click();
    await new Promise(r => setTimeout(r, 400));
    const k = [...document.querySelectorAll('[data-al-neu]')].find(x => x.getClientRects().length);
    if (!k) return null;
    k.click(); await new Promise(r => setTimeout(r, 300));
    return [...document.querySelectorAll('#neuListe .neu-eintrag')].map(x => !!x.querySelector('.ne-zeigen'));
  });
  pruefe('„Was ist neu" zeigt jeden Eintrag', !!da && da.length === N.length, da ? da.length + ' von ' + N.length : 'nicht geöffnet');
  const tot = da ? N.map((n, k) => n.wo && !da[k] ? n.id + ' → ' + n.wo : null).filter(Boolean) : ['—'];
  /* Stichprobe: „Zeigen ›" beim Profil öffnet das Profil-Fenster. */
  const k = N.findIndex(n => n.wo === 'profil');
  const profil = k < 0 ? null : await p.evaluate(async (k) => {
    const z = document.querySelectorAll('#neuListe .neu-eintrag')[k].querySelector('.ne-zeigen');
    if (!z) return false;
    z.click(); await new Promise(r => setTimeout(r, 400));
    const f = document.getElementById('pmName');
    return !!f && !!f.getClientRects().length;
  }, k);
  await b.close();
  pruefe('jedes „Zeigen ›" führt beim Chef zu einem Ziel', !tot.length, tot.join(', '));
  if (k >= 0) pruefe('„Zeigen ›" beim Profil öffnet das Profil', profil === true, String(profil));

  console.log(schlecht
    ? '\n✗ Neuigkeiten: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Neuigkeiten: eindeutig, vollständig, neu oben, jedes Ziel erreichbar — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
