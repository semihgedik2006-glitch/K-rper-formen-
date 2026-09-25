/* ══════════════════════════════════════════════════════════════════════
   ANTWORTEN OHNE MENÜ (Runde 123)

   Aus dem Betrieb, 25.9.2026: „mache bis dahin eigenständig Design und
   Performance upgrades beim Design kannst du auch ruhig kreativer
   werden". Aus den Design-Ideen, Punkt 20: „Wischen zum Antworten im
   Chat — nach rechts ziehen. Kennt jeder."

   Bis hierhin brauchte eine Antwort zwei Tipps (Nachricht, dann
   „Antworten" im Blatt). Jetzt:
   1. HANDY: eine Blase nach rechts ziehen (≥ 56 px) → Antwortleiste
      „Antwort an …" steht, das Blatt öffnet sich NICHT.
      Gegenproben: zu kurz gezogen → nichts; senkrecht gezogen (scrollen)
      → nichts; normaler Tipp → das Blatt wie bisher.
   2. Während des Ziehens folgt die Blase dem Finger (transform), danach
      steht sie wieder an ihrem Platz.
   3. RECHNER: beim Überfahren steht neben der Blase ein Knopf
      „Antworten" — Treffer ≥ 44 × 44, ganz im Bild, bei 1280/1440/1920,
      normal und kompakt; ein Klick darauf antwortet, ohne Blatt.
      Am Handy gibt es ihn nicht.
   4. Keine Skriptfehler.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
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

async function oeffne(b, w, h, touch) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: !!touch, isMobile: !!touch });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  await p.evaluate(() => {
    const k = [...document.querySelectorAll('[data-group="g-komm"]')].find(x => x.getClientRects().length);
    if (k) k.click();
    else { [...document.querySelectorAll('[data-group="g-alles"]')].find(x => x.getClientRects().length).click(); }
  });
  await p.waitForTimeout(400);
  await p.evaluate(() => { if (!document.querySelector('#view-chat.show')) { const z = document.querySelector('[data-alles="chat"]'); if (z) z.click(); } });
  await p.waitForTimeout(900);
  p._cdp = await ctx.newCDPSession(p);
  return p;
}
const stand = (p) => p.evaluate(() => ({
  leiste: getComputedStyle(document.getElementById('composeBar')).display !== 'none',
  titel: (document.getElementById('cbTitle') || {}).textContent || '',
  blatt: !!document.querySelector('#msgSheet.show'),
}));
async function aufraeumen(p) {
  await p.evaluate(() => {
    const x = document.querySelector('#composeBar [data-cb-x], #cbClose, #composeBar button');
    if (x) x.click();
    const b = document.querySelector('#msgSheet.show'); if (b) b.classList.remove('show');
  });
  await p.waitForTimeout(200);
}
/* Eine Blase in der Mitte des Verlaufs, von jemand anderem. */
/* Innerhalb des SICHTBAREN Verlaufs: bei 320 × 640 ist er nur rund
   135 px hoch (Kopf, Kanäle und „Meldungen an?" darüber) — eine Blase
   darüber liegt unter dem Kopf und bekäme den Finger gar nicht. */
const ziel = (p) => p.evaluate(() => {
  const box = document.getElementById('chatScroll');
  const kb = box.getBoundingClientRect();
  const ms = [...box.querySelectorAll('.msg:not(.mine)')].filter(m => { const r = m.getBoundingClientRect(); const my = r.top + r.height / 2; return my > kb.top + 8 && my < kb.bottom - 8; });
  const m = ms[ms.length - 1]; if (!m) return null;
  const r = m.getBoundingClientRect();
  return { mid: m.dataset.mid, x: r.left + Math.min(40, r.width / 3), y: r.top + r.height / 2, name: (m.querySelector('.chat-author') || {}).textContent || '' };
});
async function wisch(p, z, dx, dy, mitte) {
  const t = (type, x, y) => p._cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await t('touchStart', z.x, z.y);
  const schritte = 8;
  for (let i = 1; i <= schritte; i++) { await t('touchMove', z.x + dx * i / schritte, z.y + dy * i / schritte); await p.waitForTimeout(16); }
  const mittendrin = mitte ? await p.evaluate((mid) => {
    const m = document.querySelector('[data-mid="' + mid + '"]');
    return { tf: m.style.transform, pfeil: !!m.querySelector('.wisch-pfeil'), bereit: !!m.querySelector('.wisch-pfeil.bereit') };
  }, z.mid) : null;
  await t('touchEnd', z.x + dx, z.y + dy);
  await p.waitForTimeout(500);
  return mittendrin;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1./2. Am Handy: nach rechts ziehen ──');
  for (const [w, h] of [[390, 844], [320, 640]]) {
    const p = await oeffne(b, w, h, true);
    const z = await ziel(p);
    pruefe(w + ' px: eine fremde Nachricht im Bild gefunden', !!z, 'keine');
    if (!z) { await p.close(); continue; }
    const mitte = await wisch(p, z, 70, 4, true);
    pruefe(w + ' px: im Ziehen folgt die Blase dem Finger, der Pfeil steht bereit',
      mitte && /translateX\((5[6-9]|6\d|7[0-2])(\.\d+)?px\)/.test(mitte.tf) && mitte.pfeil && mitte.bereit, JSON.stringify(mitte));
    const s1 = await stand(p);
    pruefe(w + ' px: 70 px gezogen → „Antwort an …" steht, kein Blatt',
      s1.leiste && /^Antwort an/.test(s1.titel) && !s1.blatt, JSON.stringify(s1));
    const zurueck = await p.evaluate((mid) => { const m = document.querySelector('[data-mid="' + mid + '"]'); return { tf: m.style.transform, pfeil: !!m.querySelector('.wisch-pfeil') }; }, z.mid);
    pruefe(w + ' px: danach steht die Blase wieder an ihrem Platz, der Pfeil ist weg', zurueck.tf === '' && !zurueck.pfeil, JSON.stringify(zurueck));
    await aufraeumen(p);

    await wisch(p, z, 30, 2);
    const s2 = await stand(p);
    pruefe(w + ' px: GEGENPROBE nur 30 px → keine Antwort, kein Blatt', !s2.leiste && !s2.blatt, JSON.stringify(s2));
    await aufraeumen(p);

    await wisch(p, z, 6, 90);
    const s3 = await stand(p);
    pruefe(w + ' px: GEGENPROBE senkrecht (scrollen) → keine Antwort', !s3.leiste && !s3.blatt, JSON.stringify(s3));
    await aufraeumen(p);

    const z2 = await ziel(p);   // der senkrechte Wisch hat gescrollt
    await p.touchscreen.tap(z2.x, z2.y);
    await p.waitForTimeout(500);
    const s4 = await stand(p);
    pruefe(w + ' px: ein Tipp öffnet weiter das Blatt', s4.blatt && !s4.leiste, JSON.stringify(s4));
    await aufraeumen(p);
    const knopf = await p.evaluate(() => { const k = document.querySelector('.msg-antwort'); return k ? getComputedStyle(k).display : 'fehlt'; });
    pruefe(w + ' px: den Knopf fürs Überfahren gibt es am Handy nicht', knopf === 'fehlt' || knopf === 'none', knopf);
    pruefe(w + ' px: keine Skriptfehler', p._fehler.length === 0, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 3. Am Rechner: Knopf beim Überfahren ──');
  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h, false);
    /* Die Mitarbeiter-Demo hat im Kanal keine eigene Nachricht — also
       eine schreiben, damit auch die linke Seite gemessen wird. */
    await p.fill('#chatText', 'Bin um zehn da.');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(600);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.waitForTimeout(150);
      for (const art of ['fremd', 'eigen']) {
        const z = await p.evaluate((art) => {
          const box = document.getElementById('chatScroll');
          const kb = box.getBoundingClientRect();
          const ms = [...box.querySelectorAll(art === 'eigen' ? '.msg.mine' : '.msg:not(.mine)')].filter(m => { const r = m.getBoundingClientRect(); const my = r.top + r.height / 2; return my > kb.top + 8 && my < kb.bottom - 8; });
          const m = ms[ms.length - 1]; if (!m) return null;
          const r = m.getBoundingClientRect(); return { mid: m.dataset.mid, x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }, art);
        if (!z) { pruefe(w + ' px ' + dichte + ': eine ' + art + 'e Nachricht im Bild', false); continue; }
        await p.mouse.move(z.x, z.y);
        await p.waitForTimeout(300);
        const k = await p.evaluate(`(() => { const k = document.querySelector('[data-mid="${z.mid}"] .msg-antwort'); if (!k) return null;
          const r = k.getBoundingClientRect(); const t = (${TREFFER.toString()})(k);
          return { w: t.w, h: t.h, l: Math.round(r.left), r: Math.round(r.right), op: getComputedStyle(k).opacity }; })()`);
        pruefe(w + ' px ' + dichte + ', ' + art + ': „Antworten" erscheint, Treffer ≥ 44 × 44, im Bild',
          k && k.w >= 44 && k.h >= 44 && k.l >= 0 && k.r <= w && Number(k.op) > 0.9, JSON.stringify(k));
      }
    }
    await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
    const z = await ziel(p);
    await p.mouse.move(z.x + 10, z.y);
    await p.waitForTimeout(250);
    await p.evaluate((mid) => document.querySelector('[data-mid="' + mid + '"] .msg-antwort').click(), z.mid);
    await p.waitForTimeout(300);
    const s = await stand(p);
    pruefe(w + ' px: Klick auf „Antworten" → Antwortleiste, kein Blatt', s.leiste && /^Antwort an/.test(s.titel) && !s.blatt, JSON.stringify(s));
    pruefe(w + ' px: keine Skriptfehler', p._fehler.length === 0, p._fehler.join(' | '));
    await p.close();
  }

  await b.close();
  console.log('\n' + gut + ' bestanden, ' + schlecht + ' gefallen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
