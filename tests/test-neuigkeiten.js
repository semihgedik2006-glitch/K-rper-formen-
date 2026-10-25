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

   Runde 273, aus dem Betrieb (25.10.2026): „sorg bitte dafür das diese
   was ist neu nachrichten mehr wie patchnotes aussehen und nicht wie ki
   infos die nur an mich gerichtet sind eigentlich". Ab dem 22.10.2026:
    5. jeder Eintrag hat `art` (neu / besser / fix), Titel ≤ 60 Zeichen,
       höchstens 4 Punkte zu je ≤ 140 Zeichen;
    6. kein Technik- oder KI-Wort, keine Anrede an Einzelne
       (Modell, Kontingent, Worker, Prompt, ChatGPT, Neuronen, Semih, Claude …);
    7. die Liste steht nach Tagen gruppiert, jede Zeile mit Art-Marke;
       jede Zeile und jedes „Zeigen ›" trifft ≥ 44 × 44 (Hit-Test) bei
       320 / 390 / 430 / 820 / 1280 / 1440 / 1920 px, normal und kompakt,
       und das Fenster schiebt nicht quer.
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

  const ab = N.filter(e => tag(e) >= 20261022);
  const ohneArt = ab.filter(e => !['neu', 'besser', 'fix'].includes(e.art)).map(e => e.id);
  pruefe('Patchnotes: jeder Eintrag seit 22.10. hat eine Art (neu/besser/fix) — ' + ab.length, !ohneArt.length, ohneArt.join(', '));
  const lang = ab.filter(e => e.titel.length > 60 || e.punkte.length > 4 || e.punkte.some(p => p.length > 140))
    .map(e => e.id + ' (Titel ' + e.titel.length + ', ' + e.punkte.length + ' Punkte, längster ' + Math.max(...e.punkte.map(p => p.length)) + ')');
  pruefe('Patchnotes: kurz — Titel ≤ 60, ≤ 4 Punkte, je ≤ 140 Zeichen', !lang.length, lang.join('; '));
  const VERBOTEN = /\b(Modell|Kontingent|Worker|Prompt|ChatGPT|Neuronen|Semih|Claude|Cloudflare|Gemini|Token|Runde \d+)\b|Zu viel\?/;
  const technik = ab.filter(e => VERBOTEN.test(e.titel + ' ' + e.punkte.join(' '))).map(e => e.id + ': ' + (e.titel + ' ' + e.punkte.join(' ')).match(VERBOTEN)[0]);
  pruefe('Patchnotes: kein Technik-/KI-Wort, keine Anrede an Einzelne', !technik.length, technik.join('; '));

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
  /* 7. Gruppiert nach Tagen, mit Art-Marke. */
  const gruppen = await p.evaluate(() => ({
    tage: [...document.querySelectorAll('#neuListe .neu-tag h4')].map(x => x.textContent),
    marken: document.querySelectorAll('#neuListe .neu-eintrag > summary .ne-art').length,
    offen: [...document.querySelectorAll('#neuListe .neu-eintrag')].map(x => x.open)
  }));
  const tageSoll = [...new Set(N.map(e => e.datum))].length;
  pruefe('nach Tagen gruppiert: ' + tageSoll + ' Updates, jede Zeile mit Art-Marke',
    gruppen.tage.length === tageSoll && gruppen.marken === N.length && /^Update · /.test(gruppen.tage[0] || ''), JSON.stringify(gruppen.tage.slice(0, 3)) + ' marken ' + gruppen.marken);
  const ersterTag = N.filter(e => e.datum === N[0].datum).length;
  pruefe('das jüngste Update ist aufgeklappt, ältere zu', gruppen.offen.slice(0, ersterTag).every(Boolean) && gruppen.offen.slice(ersterTag).some(x => !x), '');

  /* Trefferflächen am Handy und am Rechner, normal und kompakt. */
  const MASS = () => {
    const ziele = [document.querySelector('#neuListe .neu-eintrag > summary'), document.querySelector('#neuListe .neu-eintrag[open] .ne-zeigen')];
    return ziele.map(k => {
      if (!k) return null;
      k.scrollIntoView({ block: 'center' });
      const r = k.getBoundingClientRect();
      const t = (x, y) => { const e = document.elementFromPoint(x, y); return !!e && (e === k || k.contains(e)); };
      const cx = r.left + Math.min(r.width / 2, 30), cy = r.top + r.height / 2;
      let o = cy, u = cy, l = cx, re = cx;
      while (t(cx, o - 1) && o > 0) o--;
      while (t(cx, u + 1) && u < innerHeight) u++;
      while (t(l - 1, cy) && l > 0) l--;
      while (t(re + 1, cy) && re < innerWidth) re++;
      return { h: u - o + 1, b: re - l + 1, imBild: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth };
    });
  };
  const fehler = [], masse = {};
  for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    await p.setViewportSize({ width: w, height: h });
    await p.evaluate(async () => {
      /* Nach der Profil-Stichprobe steht das Profil-Fenster noch offen. */
      document.querySelectorAll('#profileModal.show').forEach(x => x.classList.remove('show'));
      const m = document.getElementById('neuModal');
      if (m.classList.contains('show')) return;
      const lade = document.getElementById('bereichKopf'); if (lade && lade.getClientRects().length) lade.click();
      await new Promise(r => setTimeout(r, 400));
      const k = [...document.querySelectorAll('[data-al-neu]')].find(x => x.getClientRects().length);
      if (k) k.click();
    });
    await p.waitForTimeout(400);
    for (const d of ['normal', 'kompakt']) {
      await p.evaluate(d => { document.body.dataset.dichte = d; }, d);
      await p.waitForTimeout(120);
      const [zeile, zeigen] = await p.evaluate('(' + MASS.toString() + ')()');
      const box = await p.evaluate(() => { const x = document.querySelector('#neuModal .pm-box'); return { quer: x.scrollWidth - x.clientWidth, b: Math.round(x.getBoundingClientRect().width) }; });
      masse[w + ' ' + d] = [zeile && zeile.b + '×' + zeile.h, zeigen && zeigen.b + '×' + zeigen.h, 'Fenster ' + box.b];
      [['Zeile', zeile], ['Zeigen', zeigen]].forEach(([n, m]) => { if (!m || m.h < 44 || m.b < 44 || !m.imBild) fehler.push(w + ' ' + d + ' ' + n + ' ' + JSON.stringify(m)); });
      if (box.quer > 0) fehler.push(w + ' ' + d + ' Fenster schiebt quer um ' + box.quer);
      const ueber = await p.evaluate(() => [...document.querySelectorAll('#neuListe .ne-art')].filter(x => x.scrollWidth > x.clientWidth + 1).length);
      if (ueber) fehler.push(w + ' ' + d + ' ' + ueber + ' Art-Marken laufen über');
    }
  }
  console.log('  Masse: ' + JSON.stringify(masse));
  pruefe('Zeilen und „Zeigen ›" ≥ 44 × 44 und im Bild, 320–1920 px, normal und kompakt; nichts schiebt quer', !fehler.length, fehler.join(' | '));

  await b.close();
  pruefe('jedes „Zeigen ›" führt beim Chef zu einem Ziel', !tot.length, tot.join(', '));
  if (k >= 0) pruefe('„Zeigen ›" beim Profil öffnet das Profil', profil === true, String(profil));

  console.log(schlecht
    ? '\n✗ Neuigkeiten: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Neuigkeiten: eindeutig, vollständig, neu oben, jedes Ziel erreichbar — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
