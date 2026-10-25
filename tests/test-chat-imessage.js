/* ══ CHATS WIE iMESSAGE: EINGABE, „… SCHREIBT", EINBLENDEN (Runde 277) ══
   Aus dem Betrieb, 25.10.2026: „das die chats wie imassage funktionieren
   sehe ich leider noch nicht so richtig". Die Blasen selbst (Blau, Grau,
   Schwanz) misst test-chat-blasen. Hier, was dazu „funktionieren" heisst:

    1. Die Eingabe ist EINE Pille: „+" links, im Feld rechts das
       Mikrofon. Ist das Feld leer, ist der Senden-Pfeil weg und das
       Mikrofon da; mit Text umgekehrt. Jeder sichtbare Knopf hat per
       Hit-Test ≥ 44 × 44, in „normal" und „kompakt", und liegt im Bild.
       Gemessen bei 320 / 390 / 430 / 820 und 1280 / 1440 / 1920 px; am
       Handy zusätzlich mit nachgestelltem iPhone-Rand (oben 59, unten 34)
       und Safari-Kennung: die Pille liegt ganz über der unteren Leiste.
    2. „… schreibt": In der Demo antwortet nach einer eigenen Nachricht
       jemand (window.__demoAntwort). Erst steht unten eine graue Blase
       mit drei Punkten und dem Vornamen, dann kommt die Antwort und die
       Punkte sind weg. Kein Trenner „Neue Nachrichten" darüber — man
       hat ja zugesehen.
    3. Nur NEUE Blasen blenden ein: nach dem Senden trägt genau die neue
       Blase .ein, die schon gezeigten nicht (vorher blendete bei jeder
       Änderung der ganze Verlauf neu ein).
    4. Direktnachricht: zwei eigene hintereinander bilden eine Folge
       (.grp), der Pfeil ist auch dort.
    5. GEGENPROBE: im bisherigen Aussehen bleibt die Eingabe, wie sie war
       (Senden sichtbar, auch bei leerem Feld).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

let gut = 0, schlecht = 0;
function pruefe(name, ok, info) {
  if (ok) { gut++; console.log('  ✓ ' + name); }
  else { schlecht++; console.log('  ✗ ' + name + (info ? '  — ' + info : '')); }
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
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1), unten: Math.round(r.bottom) };
};

async function oeffne(b, w, h, opt) {
  opt = opt || {};
  const handy = w <= 820;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block',
    isMobile: handy, hasTouch: handy, userAgent: handy && opt.rand ? UA : undefined });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  if (opt.rand) {
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: opt.rand[0], bottom: opt.rand[1], left: 0, right: 0 } });
  }
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript(([alt, antwort]) => {
    try { localStorage.setItem('kf_tour', '99:demo-ich'); localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'formi', stil2: true })); if (alt) localStorage.setItem('kf_neu', '0'); } catch (e) {}
    if (antwort) window.__demoAntwort = true;
  }, [!!opt.alt, !!opt.antwort]);
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(2200);
  await p.evaluate((handy) => {
    const k = document.querySelector(handy ? '.mobnav [data-group="g-komm"]' : '#side [data-group="g-komm"]');
    if (k) k.click();
  }, handy);
  await p.waitForTimeout(1200);
  p._ctx = ctx;
  return p;
}
const tippe = (p, t) => p.evaluate((t) => { const ta = document.getElementById('chatText'); ta.value = t; ta.dispatchEvent(new Event('input', { bubbles: true })); }, t);
const senden = async (p, t) => { await tippe(p, t); await p.evaluate(() => document.getElementById('chatSend').click()); await p.waitForTimeout(400); };

async function knoepfe(p, w, h, wo) {
  for (const dichte of ['normal', 'kompakt']) {
    const r = await p.evaluate(async ([SRC, d]) => {
      const T = eval('(' + SRC + ')');
      document.body.dataset.dichte = d;
      await new Promise(r => setTimeout(r, 450));
      const sicht = (e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
      const leiste = document.querySelector('.mobnav');
      const lo = leiste && leiste.getClientRects().length ? leiste.getBoundingClientRect().top : innerHeight;
      return [...document.querySelectorAll('#view-chat .chat-input button')].filter(sicht)
        .map(e => ({ id: e.id || e.className, m: T(e), ueberLeiste: e.getBoundingClientRect().bottom <= lo + 0.5 }));
    }, [TREFFER.toString(), dichte]);
    pruefe(wo + ' ' + dichte + ': Knöpfe der Eingabe ≥ 44 × 44, im Bild, über der Leiste (' + r.map(x => x.id).join(', ') + ')',
      r.length >= 2 && r.every(x => x.m.w >= 44 && x.m.h >= 44 && x.m.unten <= h && x.ueberLeiste), JSON.stringify(r));
  }
  await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
}

(async () => {
  const b = await chromium.launch(CHROME ? { executablePath: CHROME, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });

  const groessen = [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]];
  for (const [w, h] of groessen) {
    for (const rand of (w <= 820 ? [null, [59, 34]] : [null])) {
      const wo = w + ' × ' + h + (rand ? ' (iPhone-Rand)' : '');
      console.log('\n── ' + wo + ' ──');
      const p = await oeffne(b, w, h, { rand });
      const leer = await p.evaluate(() => {
        const s = (id) => { const e = document.getElementById(id); return !!e && getComputedStyle(e).visibility !== 'hidden' && e.getClientRects().length > 0; };
        const ta = document.getElementById('chatText');
        return { send: s('chatSend'), mic: s('chatMic') || !document.getElementById('chatMic').getClientRects().length && 'versteckt', rund: parseFloat(getComputedStyle(ta).borderTopLeftRadius) };
      });
      pruefe('leeres Feld: kein Pfeil', !leer.send, JSON.stringify(leer));
      pruefe('das Feld ist eine Pille (' + leer.rund + ' px)', leer.rund >= 20);
      await knoepfe(p, w, h, wo + ', leer');
      await tippe(p, 'Hallo');
      await p.waitForTimeout(400);
      const voll = await p.evaluate(() => {
        const s = (id) => { const e = document.getElementById(id); return !!e && getComputedStyle(e).visibility !== 'hidden' && e.getClientRects().length > 0; };
        return { send: s('chatSend'), mic: s('chatMic') };
      });
      pruefe('mit Text: Pfeil da, Mikrofon weg', voll.send && !voll.mic, JSON.stringify(voll));
      await knoepfe(p, w, h, wo + ', mit Text');

      // Nur Neues blendet ein
      await tippe(p, '');
      const vorher = await p.evaluate(() => document.querySelectorAll('#chatScroll .msg').length);
      await senden(p, 'Bin gleich da');
      const ein = await p.evaluate(() => {
        const alle = [...document.querySelectorAll('#chatScroll .msg')];
        return { zahl: alle.length, ein: alle.filter(m => m.classList.contains('ein')).length, letzteEin: alle[alle.length - 1].classList.contains('ein') };
      });
      pruefe('nach dem Senden blendet genau die neue Blase ein (' + ein.ein + ' von ' + ein.zahl + ')', ein.zahl === vorher + 1 && ein.ein === 1 && ein.letzteEin, JSON.stringify(ein));
      pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
  }

  console.log('\n── „… schreibt" und Antwort (Demo) ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h, { antwort: true });
    await senden(p, 'Wer übernimmt Samstag?');
    await p.waitForTimeout(1500);
    const t = await p.evaluate(() => {
      const z = document.querySelector('#chatScroll > .tippt-zeile');
      if (!z) return null;
      const box = document.getElementById('chatScroll').getBoundingClientRect(), r = z.getBoundingClientRect();
      return { letzte: z === document.getElementById('chatScroll').lastElementChild, text: z.textContent.trim(),
        punkte: z.querySelectorAll('.tippt-blase i').length, imBild: r.top >= box.top - 1 && r.bottom <= box.bottom + 1 };
    });
    pruefe(w + ': „… schreibt" steht unten im Verlauf, mit Namen und drei Punkten', !!t && t.letzte && /schreibt …$/.test(t.text) && t.punkte === 3 && t.imBild, JSON.stringify(t));
    await p.waitForTimeout(3200);
    const a = await p.evaluate(() => {
      const alle = [...document.querySelectorAll('#chatScroll .msg')];
      const l = alle[alle.length - 1];
      return { tippt: !!document.querySelector('#chatScroll > .tippt-zeile'), fremd: !l.classList.contains('mine'), ein: l.classList.contains('ein'),
        trenner: !!document.querySelector('#chatScroll .new-sep') };
    });
    pruefe(w + ': die Antwort ist da, die Punkte sind weg, kein „Neue Nachrichten"', a.fremd && a.ein && !a.tippt && !a.trenner, JSON.stringify(a));
    pruefe(w + ': ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── Direktnachricht ──');
  {
    const p = await oeffne(b, 390, 844);
    await p.evaluate(() => document.getElementById('kanalDirekt').click());
    await p.waitForTimeout(700);
    await p.fill('#dmSearch', 'a');
    await p.waitForTimeout(400);
    await p.evaluate(() => document.querySelector('#dmPeople .dm-person').click());
    await p.waitForTimeout(800);
    for (const t of ['Hast du kurz Zeit?', 'Geht um Samstag.']) {
      await p.evaluate((t) => { const ta = document.getElementById('dmText'); ta.value = t; ta.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('dmSend').click(); }, t);
      await p.waitForTimeout(500);
    }
    const d = await p.evaluate(() => {
      const alle = [...document.querySelectorAll('#dmScroll .msg')];
      const l = alle[alle.length - 1];
      const s = document.getElementById('dmSend');
      return { grp: l.classList.contains('grp'), mine: l.classList.contains('mine'), pfeilLeer: getComputedStyle(s).visibility !== 'hidden' };
    });
    pruefe('zwei eigene hintereinander bilden eine Folge', d.grp && d.mine, JSON.stringify(d));
    pruefe('leeres Feld: auch hier kein Pfeil', !d.pfeilLeer);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── GEGENPROBE: bisheriges Aussehen ──');
  {
    const p = await oeffne(b, 390, 844, { alt: true });
    const r = await p.evaluate(() => ({ neu: document.body.classList.contains('neu'), send: getComputedStyle(document.getElementById('chatSend')).visibility !== 'hidden' }));
    pruefe('ohne neues Aussehen: Senden sichtbar wie bisher', !r.neu && r.send, JSON.stringify(r));
    await p._ctx.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Chats wie iMessage: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Chats wie iMessage: Eingabe, „… schreibt", Einblenden — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})();
