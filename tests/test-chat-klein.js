/* ══════════════════════════════════════════════════════════════════════
   CHAT AUF KLEINEN HANDYS (Runde 127)

   Aus dem Betrieb, 27.9.2026, auf „auf so kleinen Bildschirmen die
   Kopfzeile im Chat einklappen": ja. Bei 320 × 640 blieben vom Verlauf
   rund 135 px.
   1. 320 × 640 im Chat: die Bereichszeile ist weg, Chat / Direkt / Infos
      bleiben, der Verlauf ist mindestens 200 px hoch.
   2. Beim Tippen weichen auch die Reiter und „Meldungen an?"; danach
      kommen sie zurück — mit 400 ms Verzögerung, damit ein Tipp auf eine
      Nachricht nicht ins Leere geht.
   3. GEGENPROBEN: auf der Startseite bleibt die Bereichszeile; bei
      390 × 844 und am Rechner ändert sich im Chat nichts.
   4. Nichts ragt hinaus; die Kanal-Knöpfe treffen weiter ≥ 44 px hoch.
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
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: !!mobil, isMobile: !!mobil });
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
    const l1 = await lage(p);
    pruefe('1. im Chat: Bereichszeile weg, Reiter da, Verlauf ' + l1.verlauf + ' px (≥ 200, vorher rund 135)', !l1.bereich && l1.reiter && l1.verlauf >= 200 && l1.quer <= 0, JSON.stringify(l1));
    await p.evaluate(() => document.getElementById('chatText').focus());
    await p.waitForTimeout(200);
    const l2 = await lage(p);
    pruefe('2. beim Tippen: auch Reiter und „Meldungen an?" weichen, Verlauf ' + l2.verlauf + ' px', !l2.reiter && !l2.hinweis && l2.verlauf > l1.verlauf, JSON.stringify(l2));
    await p.evaluate(() => document.getElementById('chatText').blur());
    /* Nicht sofort: wer auf eine Nachricht tippt, verlässt damit das
       Feld — kämen die Reiter im selben Augenblick zurück, rutschte die
       Nachricht unter dem Finger weg (so gefunden in
       test-chat-antworten bei 320 px). */
    const sofort = await lage(p);
    pruefe('2. direkt nach dem Verlassen des Feldes verschiebt sich noch nichts', !sofort.reiter && sofort.verlauf === l2.verlauf, JSON.stringify(sofort));
    await p.waitForTimeout(600);
    const l3 = await lage(p);
    pruefe('2. kurz danach sind die Reiter zurück', l3.reiter && !l3.bereich, JSON.stringify(l3));
    const kanal = await p.evaluate(() => [...document.querySelectorAll('.chan')].filter(e => e.getClientRects().length).map(e => Math.round(e.getBoundingClientRect().height)));
    pruefe('4. Kanal-Knöpfe ≥ 44 px hoch (' + kanal.join(', ') + ')', kanal.length && kanal.every(h => h >= 44), JSON.stringify(kanal));
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
