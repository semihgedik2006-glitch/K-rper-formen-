/* ══════════════════════════════════════════════════════════════════════
   CHAT AUF KLEINEN HANDYS (Runde 127)

   Aus dem Betrieb, 27.9.2026, auf „auf so kleinen Bildschirmen die
   Kopfzeile im Chat einklappen": ja. Bei 320 × 640 blieben vom Verlauf
   rund 135 px.
   Seit Runde 286 beginnt der Chat am Handy mit der Liste; den Platz
   schafft dort die geöffnete Unterhaltung, in der Bereichszeile UND
   Reiter weichen. Geprüft wird deshalb jetzt:
   1. 320 × 640 in der Liste: die Bereichszeile ist weg, die Reiter
      bleiben, die Liste scrollt nicht quer.
   2. In der Unterhaltung: Bereichszeile und Reiter weg, der Verlauf ist
      mindestens 200 px hoch — und das Tippen kostet ihn nichts mehr.
   3. GEGENPROBEN: auf der Startseite bleibt die Bereichszeile; bei
      390 × 844 und am Rechner ändert sich an der Liste nichts.
   4. Nichts ragt hinaus; die Zeilen der Liste treffen ≥ 44 px hoch.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

async function oeffne(b, w, h, mobil) {
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: w, height: h }, hasTouch: !!mobil, isMobile: !!mobil });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => localStorage.setItem('kf_tour', '99:demo-ich'));
  await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  p._ctx = ctx;
  return p;
}
const zumChat = async (p) => {
  await p.evaluate(() => { const k = [...document.querySelectorAll('[data-group="g-komm"]')].find(x => x.getClientRects().length); if (k) k.click(); else [...document.querySelectorAll('[data-group="g-alles"]')].find(x => x.getClientRects().length).click(); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { if (!document.querySelector('#view-chat.show')) { const z = document.querySelector('[data-alles="chat"]'); if (z) z.click(); } });
  await p.waitForTimeout(1000);
};
const lage = (p) => p.evaluate(() => {
  const da = (sel) => { const e = document.querySelector(sel); return !!e && !!e.getClientRects().length && getComputedStyle(e).display !== 'none'; };
  return { bereich: da('#bereichZeile'), reiter: da('#subnavZeile'), hinweis: da('.notif-banner.show'),
           verlauf: Math.round(document.getElementById('chatScroll').getBoundingClientRect().height),
           quer: document.documentElement.scrollWidth - innerWidth };
});

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 320 × 640 ──');
  {
    const p = await oeffne(b, 320, 640, true);
    const start = await p.evaluate(() => { const e = document.getElementById('bereichZeile'); return !!e && !!e.getClientRects().length; });
    pruefe('3. GEGENPROBE Startseite: die Bereichszeile steht', start);
    await zumChat(p);
    const l0 = await lage(p);
    pruefe('1. in der Liste: Bereichszeile weg, Reiter da, kein Querlauf', !l0.bereich && l0.reiter && l0.quer <= 0, JSON.stringify(l0));
    const zeilen = await p.evaluate(() => [...document.querySelectorAll('#kanalSpalte .ks-zeile')]
      .filter(e => e.getClientRects().length).map(e => Math.round(e.getBoundingClientRect().height)));
    pruefe('4. Zeilen der Liste ≥ 44 px hoch (' + zeilen.slice(0, 3).join(', ') + ')', zeilen.length && zeilen.every(h => h >= 44), JSON.stringify(zeilen.slice(0, 5)));
    await p.evaluate(() => document.querySelector('#kanalSpalte [data-kanalwahl]').click());
    await p.waitForTimeout(600);
    const l1 = await lage(p);
    pruefe('2. in der Unterhaltung: Bereichszeile und Reiter weg, Verlauf ' + l1.verlauf + ' px (≥ 200, vorher rund 135)',
      !l1.bereich && !l1.reiter && l1.verlauf >= 200 && l1.quer <= 0, JSON.stringify(l1));
    await p.evaluate(() => document.getElementById('chatText').focus());
    await p.waitForTimeout(200);
    const l2 = await lage(p);
    pruefe('2. beim Tippen kostet nichts mehr Platz, Verlauf bleibt ' + l2.verlauf + ' px', l2.verlauf >= l1.verlauf, JSON.stringify(l2));
    await p.evaluate(() => document.getElementById('chatText').blur());
    await p.waitForTimeout(600);
    const l3 = await lage(p);
    pruefe('2. nach dem Verlassen des Feldes verschiebt sich nichts', l3.verlauf === l1.verlauf && !l3.reiter, JSON.stringify(l3));
    /* Weg aus dem Chat: die Bereichszeile kommt zurück. */
    await p.evaluate(() => { const s = [...document.querySelectorAll('[data-group="g-start"]')].find(x => x.getClientRects().length); if (s) s.click(); });
    await p.waitForTimeout(500);
    const zurueck = await p.evaluate(() => !!document.getElementById('bereichZeile').getClientRects().length);
    pruefe('3. zurück auf der Startseite: die Bereichszeile steht wieder', zurueck);
    pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── Gegenproben: grössere Bildschirme ──');
  for (const [w, h, mobil] of [[390, 844, true], [1280, 800, false], [1440, 900, false]]) {
    const p = await oeffne(b, w, h, mobil);
    await zumChat(p);
    const l = await lage(p);
    const bereichNoetig = await p.evaluate(() => getComputedStyle(document.body).getPropertyValue('--x') === '' && document.body.classList.contains('neu'));
    pruefe(w + ' × ' + h + ': im Chat bleibt alles, wie es war (Bereichszeile ' + (l.bereich ? 'da' : 'weg') + ')', (l.bereich || !bereichNoetig) && l.reiter && l.quer <= 0, JSON.stringify(l));
    await p._ctx.close();
  }

  await b.close();
  console.log('\n' + gut + ' bestanden, ' + schlecht + ' gefallen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
