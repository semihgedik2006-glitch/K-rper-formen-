/* ══ CHAT WIE IMESSAGE, MENÜ AN DER NACHRICHT (Runde 249) ════════════════
   Plan „Studio Chat wie von Apple", Schritt Chat. Vorbild: Probebild
   3-chat-handy.png — aus dem Betrieb: „genau so hab ichs mir
   vorgestellt". Seit 23.10.2026, 15:18: „es soll einfach den ganzen
   plan erledigen".

   Demo Chef, Kanal „Allgemein". Vorher werden zwei eigene Nachrichten
   kurz hintereinander geschickt, damit es eine eigene Folge gibt.

   Geprüft wird im Stil Formi bei 320 / 390 / 430 / 820 / 1280 / 1440 /
   1920 px, in Dunkel und Hell bei 390 und 1440 px:
    1. Blasen ohne Rahmen, rund (≥ 18 px an der freien Ecke).
    2. Eigene Blase in der Akzentfarbe; Schrift darauf an Bildpunkten
       ≥ 4,5 : 1.
    3. Name · Studio und Uhrzeit stehen ÜBER der fremden Blase, die
       Uhrzeit und Häkchen UNTER der eigenen — und überdecken keine
       andere Blase. Name an Bildpunkten ≥ 4,5 : 1.
    4. Eine eigene Folge rückt zusammen (≤ 3 px), die Ecke zur eigenen
       Seite ist klein; Häkchen nur unter der letzten, im Dokument aber
       an jeder (test-gelesen-haken liest sie).
    5. Das Menü steht an der Nachricht: ganz im Bild, die Vorschau deckt
       die Blase (wenn Platz ist), Reaktionen und Einträge ≥ 44 × 44 per
       Hit-Test in „normal" und „kompakt". Daneben tippen und Esc
       schliessen. Formis Sprechblase ist so lange weg.
    6. Am Rechner öffnet die rechte Maustaste das Menü am Zeiger.
    7. GEGENPROBE: im bisherigen Aussehen bleibt es das Blatt von unten.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(name, ok, info) {
  if (ok) { gut++; console.log('  ✓ ' + name); }
  else { schlecht++; console.log('  ✗ ' + name + (info ? '  — ' + info : '')); }
}
function lum(c) { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); }
function kontrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
const rgb = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);

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

async function oeffne(b, w, h, theme, extra) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript(([pr, alt]) => {
    try { localStorage.setItem('kf_tour', '99:demo-ich'); localStorage.setItem('kf_prefs', pr); if (alt) localStorage.setItem('kf_neu', '0'); } catch (e) {}
  }, [JSON.stringify({ theme, stil2: true }), !!(extra && extra.alt)]);
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(2200);
  await p.evaluate((handy) => {
    const k = document.querySelector(handy ? '.mn-reihe [data-group="g-komm"], .mobnav [data-group="g-komm"]' : '#side [data-group="g-komm"]');
    if (k) k.click();
  }, w <= 820);
  await p.waitForTimeout(1200);
  p._ctx = ctx;
  return p;
}

async function senden(p, text) {
  await p.evaluate((t) => {
    const ta = document.getElementById('chatText'); ta.value = t; ta.dispatchEvent(new Event('input', { bubbles: true }));
    const s = document.getElementById('sendBtn') || document.querySelector('#view-chat .send-btn, #view-chat [data-send]');
    if (s) s.click(); else ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  }, text);
  await p.waitForTimeout(500);
}

async function bildpunkt(p, x, y) {
  const bild = await p.screenshot({ clip: { x: Math.max(0, Math.round(x)), y: Math.max(0, Math.round(y)), width: 1, height: 1 } });
  return p.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = 1; c.height = 1;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    return [...x.getImageData(0, 0, 1, 1).data].slice(0, 3);
  }, bild.toString('base64'));
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  for (const theme of ['formi', 'dark', 'light']) {
    const breiten = theme === 'formi'
      ? [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]
      : [[390, 844], [1440, 900]];
    for (const [w, h] of breiten) {
      console.log('\n── Stil ' + theme + ', ' + w + ' × ' + h + ' ──');
      const p = await oeffne(b, w, h, theme);
      await senden(p, 'Ich frag Piet, der wollte mehr Stunden.');
      await senden(p, 'Trag dich sonst bei „Zum Übernehmen“ ein.');
      /* Erst die letzte fremde Blase mit Kopf in die Mitte holen (bei
         320 × 568 stehen nach dem Senden sonst nur eigene im Bild), dann
         messen; die eigenen Blasen werden unabhängig davon gelesen. */
      await p.evaluate(() => {
        const f = [...document.querySelectorAll('#chatScroll .msg:not(.mine):not(.grp)')].filter(m => m.querySelector(':scope > .meta')).pop();
        if (f) f.scrollIntoView({ block: 'center', behavior: 'instant' });
      });
      await p.waitForTimeout(500);

      const a = await p.evaluate(() => {
        const sicht = (e) => e.getClientRects().length > 0;
        const alle = [...document.querySelectorAll('#chatScroll .msg')].filter(sicht);
        const box = document.getElementById('chatScroll').getBoundingClientRect();
        const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
        const imBild = (r) => r.t >= box.top - 1 && r.b <= box.bottom + 1;
        const cs = (e) => getComputedStyle(e);
        const fremd = alle.filter(m => !m.classList.contains('mine') && !m.classList.contains('grp') && m.querySelector(':scope > .meta') && imBild(R(m)));
        const eigen = alle.filter(m => m.classList.contains('mine'));
        const letzte = eigen[eigen.length - 1], vorletzte = eigen[eigen.length - 2];
        const ueberlappt = (mr) => alle.some(o => { const r = R(o); return mr.l < r.r - 1 && mr.r > r.l + 1 && mr.t < r.b - 1 && mr.b > r.t + 1; });
        const metaUeber = fremd.slice(-3).map(m => { const me = R(m.querySelector(':scope > .meta')), mr = R(m); return { ueber: me.b <= mr.t + 1, frei: !ueberlappt(me), name: m.querySelector('.chat-author').getBoundingClientRect() }; });
        const lm = letzte && letzte.querySelector(':scope > .meta, :scope > .meta-min');
        const vm = vorletzte && vorletzte.querySelector(':scope > .meta, :scope > .meta-min');
        const st = letzte ? cs(letzte) : null;
        const text = letzte ? letzte.querySelector('.body') : null;
        return {
          zahl: alle.length,
          rahmen: alle.map(m => cs(m).borderTopColor).filter(c => !/rgba\(0, 0, 0, 0\)|transparent/.test(c)).length,
          rund: fremd.length ? parseFloat(cs(fremd[fremd.length - 1]).borderTopRightRadius) : 0,
          metaUeber,
          eigen: !!letzte,
          eigenFlaeche: st ? st.backgroundColor : null,
          akzent: st ? cs(document.querySelector('#chatScroll')).getPropertyValue('--accent').trim() : null,
          eigenText: text ? cs(text).color : null,
          textPunkt: text ? (() => { const r = text.getBoundingClientRect(); return { x: r.left + 2, y: r.top + r.height / 2, xr: r.right + 4 }; })() : null,
          metaUnter: lm ? (() => { const me = R(lm), mr = R(letzte); return { unter: me.t >= mr.b - 1, frei: !ueberlappt(me), sicht: sicht(lm) }; })() : null,
          folge: letzte && vorletzte && letzte.classList.contains('grp') ? {
            luecke: Math.round(R(letzte).t - R(vorletzte).b),
            ecke: parseFloat(cs(vorletzte).borderBottomRightRadius),
            obenEcke: parseFloat(cs(letzte).borderTopRightRadius),
            vorletzteMetaSicht: vm ? sicht(vm) : false,
            hakenImDokument: !!vorletzte.querySelector('[data-haken]'),
          } : null,
          nameFarbe: fremd.length ? cs(fremd[fremd.length - 1].querySelector('.chat-author')).color : null,
        };
      });
      pruefe(a.zahl + ' Blasen, keine mit Rahmen', a.zahl >= 3 && a.rahmen === 0, 'mit Rahmen: ' + a.rahmen);
      pruefe('fremde Blase rund (' + a.rund + ' px ≥ 18)', a.rund >= 18);
      pruefe('Name · Studio und Uhrzeit über der fremden Blase, frei (' + a.metaUeber.length + ')',
        a.metaUeber.length >= 1 && a.metaUeber.every(x => x.ueber && x.frei), JSON.stringify(a.metaUeber.map(x => [x.ueber, x.frei])));
      if (a.metaUeber.length) {
        const n = a.metaUeber[a.metaUeber.length - 1].name;
        const grund = await bildpunkt(p, n.left - 3, n.top + n.height / 2);
        const k = kontrast(grund, rgb(a.nameFarbe));
        pruefe('Name an Bildpunkten ' + k.toFixed(1) + ' : 1 (≥ 4,5)', k >= 4.5, JSON.stringify([grund, a.nameFarbe]));
      }
      await p.evaluate(() => { const s = document.getElementById('chatScroll'); s.scrollTop = s.scrollHeight; });
      await p.waitForTimeout(500);
      Object.assign(a, await p.evaluate(async () => {
        const sicht = (e) => e.getClientRects().length > 0;
        /* Unter Last blendet die frisch gesendete Blase noch ein (msgIn,
           Deckkraft ab 0) — erst messen, wenn sie steht. */
        const zuletzt = [...document.querySelectorAll('#chatScroll .msg.mine')].pop();
        if (zuletzt) await Promise.race([Promise.all(zuletzt.getAnimations().map(x => x.finished.catch(() => {}))), new Promise(r => setTimeout(r, 2000))]);
        /* Und sie muss am Messpunkt wirklich oben liegen (nicht unter der
           Eingabe oder einem Hinweis) — sonst in die Mitte holen. */
        if (zuletzt) {
          const t = zuletzt.querySelector('.body'), r = t && t.getBoundingClientRect();
          const oben = r && document.elementFromPoint(r.left - 6, r.top + r.height / 2);
          if (!oben || !zuletzt.contains(oben)) {
            zuletzt.scrollIntoView({ block: 'center', behavior: 'instant' });
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          }
        }
        const alle = [...document.querySelectorAll('#chatScroll .msg')].filter(sicht);
        const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; };
        const ueberlappt = (mr) => alle.some(o => { const r = R(o); return mr.l < r.r - 1 && mr.r > r.l + 1 && mr.t < r.b - 1 && mr.b > r.t + 1; });
        const eigen = alle.filter(m => m.classList.contains('mine'));
        const letzte = eigen[eigen.length - 1];
        const lm = letzte && letzte.querySelector(':scope > .meta, :scope > .meta-min');
        const text = letzte ? letzte.querySelector('.body') : null;
        return {
          textPunkt: text ? (() => { const r = text.getBoundingClientRect(); return { x: r.left + 2, y: r.top + r.height / 2, xr: r.right + 4 }; })() : null,
          metaUnter: lm ? (() => { const me = R(lm), mr = R(letzte); return { unter: me.t >= mr.b - 1, frei: !ueberlappt(me), sicht: sicht(lm) }; })() : null,
        };
      }));
      pruefe('eigene Nachricht vorhanden', a.eigen);
      if (a.eigen) {
        pruefe('eigene Blase in der Akzentfarbe (' + a.eigenFlaeche + ')', rgb(a.eigenFlaeche).join() === rgb(a.akzent).join(), a.akzent);
        if (a.textPunkt) {
          /* Links neben dem Text, im Innenabstand der Blase: rechts schwebt bei
             320 px Formis Kugel (fest) über der untersten eigenen Blase. */
          /* Unter Last rollt der Verlauf nach dem Senden noch nach; dann
             trifft der Bildpunkt kurz etwas anderes. Bis zu dreimal neu
             lesen, bis dort die Fläche der Blase liegt (± 12 je Kanal) —
             gemessen wird danach trotzdem am echten Bildpunkt. */
          let grund = null;
          for (let i = 0; i < 4; i++) {
            const tp = await p.evaluate(() => { const t = [...document.querySelectorAll('#chatScroll .msg.mine')].pop().querySelector('.body').getBoundingClientRect(); return { x: t.left - 6, y: t.top + t.height / 2 }; });
            grund = await bildpunkt(p, tp.x, tp.y);
            if (grund.every((v, j) => Math.abs(v - rgb(a.eigenFlaeche)[j]) <= 12)) break;
            await p.waitForTimeout(400);
          }
          const k = kontrast(grund, rgb(a.eigenText));
          pruefe('Schrift auf der eigenen Blase an Bildpunkten ' + k.toFixed(1) + ' : 1 (≥ 4,5)', k >= 4.5, JSON.stringify([grund, a.eigenText]));
        }
        pruefe('Uhrzeit und Häkchen unter der letzten eigenen Blase, frei', a.metaUnter && a.metaUnter.unter && a.metaUnter.frei && a.metaUnter.sicht, JSON.stringify(a.metaUnter));
      }
      pruefe('zwei eigene hintereinander bilden eine Folge', !!a.folge);
      if (a.folge) {
        pruefe('die Folge rückt zusammen (' + a.folge.luecke + ' px ≤ 3)', a.folge.luecke >= 0 && a.folge.luecke <= 3);
        pruefe('die Ecken zur eigenen Seite sind klein (' + a.folge.ecke + ' / ' + a.folge.obenEcke + ' px ≤ 8)', a.folge.ecke <= 8 && a.folge.obenEcke <= 8);
        pruefe('Häkchen nur unter der letzten zu sehen, an der vorletzten im Dokument', !a.folge.vorletzteMetaSicht && a.folge.hakenImDokument, JSON.stringify(a.folge));
      }

      // ── Menü an der Nachricht ──
      const m = await p.evaluate(async () => {
        const alle = [...document.querySelectorAll('#chatScroll .msg:not(.mine)')].filter(e => e.getClientRects().length);
        const z = alle[alle.length - 1];
        z.scrollIntoView({ block: 'center', behavior: 'instant' });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        z.querySelector('.body').click();
        await new Promise(r => setTimeout(r, 600));
        const blatt = document.getElementById('msgSheet');
        const k = blatt.querySelector('.ms-card').getBoundingClientRect();
        const kopf = blatt.querySelector('.ms-head').getBoundingClientRect();
        const zr = z.getBoundingClientRect();
        const kugelBlase = [...document.querySelectorAll('.formi-blase')].filter(e => getComputedStyle(e).visibility !== 'hidden' && e.getClientRects().length).length;
        return { offen: blatt.classList.contains('show'), amOrt: blatt.classList.contains('am-ort') && blatt.classList.contains('platziert'),
          imBild: k.left >= 0 && k.top >= 0 && k.right <= innerWidth + .5 && k.bottom <= innerHeight + .5,
          deckt: Math.abs(kopf.top - zr.top), platzOben: zr.top - (k.top - (kopf.top - k.top)) , kopfTop: kopf.top, zTop: zr.top,
          geklemmt: k.top <= 12.5 || k.bottom >= innerHeight - 12.5, kugelBlase };
      });
      pruefe('das Menü steht an der Nachricht und ganz im Bild', m.offen && m.amOrt && m.imBild, JSON.stringify(m));
      pruefe('die Vorschau deckt die Blase' + (m.geklemmt ? ' (am Rand geklemmt — nicht verlangt)' : ' (' + Math.round(m.deckt) + ' px)'), m.geklemmt || m.deckt <= 4, JSON.stringify(m));
      pruefe('Formis Sprechblase ist unter dem Menü weg', m.kugelBlase === 0);
      for (const dichte of ['normal', 'kompakt']) {
        const t = await p.evaluate(async ([SRC, d]) => {
          const T = eval('(' + SRC + ')');
          document.body.dataset.dichte = d;
          await new Promise(r => setTimeout(r, 200));
          return [...document.querySelectorAll('#msgSheet .ms-emoji, #msgSheet .ms-act')].filter(e => e.getClientRects().length)
            .map(e => ({ t: e.textContent.trim().slice(0, 14), m: T(e) }));
        }, [TREFFER.toString(), dichte]);
        pruefe(dichte + ': Reaktionen und Einträge ≥ 44 × 44 (' + t.length + ')', t.length >= 8 && t.every(x => x.m.w >= 44 && x.m.h >= 44), JSON.stringify(t.filter(x => x.m.w < 44 || x.m.h < 44)));
      }
      await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
      // daneben tippen
      await p.mouse.click(4, 4).catch(() => {});
      await p.waitForTimeout(400);
      let zu = await p.evaluate(() => !document.getElementById('msgSheet').classList.contains('show'));
      pruefe('daneben tippen schliesst', zu);
      // Esc
      await p.evaluate(() => { const z = [...document.querySelectorAll('#chatScroll .msg:not(.mine) .body')].pop(); z.click(); });
      await p.waitForTimeout(500);
      await p.keyboard.press('Escape');
      await p.waitForTimeout(400);
      zu = await p.evaluate(() => !document.getElementById('msgSheet').classList.contains('show'));
      pruefe('Esc schliesst', zu);

      if (w > 820) {
        const pos = await p.evaluate(async () => { const z = [...document.querySelectorAll('#chatScroll .msg:not(.mine) .body')].pop(); z.scrollIntoView({ block: 'center', behavior: 'instant' }); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const r = z.getBoundingClientRect(); return { x: r.left + 20, y: r.top + 5 }; });
        const zp = { x: Math.round(pos.x), y: Math.round(pos.y) };
        await p.evaluate(({ x, y }) => { const el = document.elementFromPoint(x, y) || [...document.querySelectorAll('#chatScroll .msg .body')].pop(); el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y })); }, zp);
        await p.waitForTimeout(600);
        const r = await p.evaluate(() => { const b = document.getElementById('msgSheet'); const k = b.querySelector('.ms-card').getBoundingClientRect(); return { offen: b.classList.contains('show') && b.classList.contains('platziert'), x: k.left, y: k.top, bottom: k.bottom, right: k.right }; });
        const amZeiger = Math.abs(r.x - zp.x) <= 2 && (Math.abs(r.y - zp.y) <= 2 || r.bottom >= h - 13);
        pruefe('rechte Maustaste öffnet das Menü am Zeiger (' + Math.round(r.x) + ',' + Math.round(r.y) + ' bei ' + zp.x + ',' + zp.y + ')', r.offen && amZeiger && r.right <= w, JSON.stringify(r));
        await p.keyboard.press('Escape');
      }
      pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
  }

  console.log('\n── GEGENPROBE: bisheriges Aussehen ──');
  {
    const p = await oeffne(b, 390, 844, 'dark', { alt: true });
    const r = await p.evaluate(async () => {
      const z = [...document.querySelectorAll('#chatScroll .msg .body')].pop();
      if (!z) return null;
      z.click();
      await new Promise(r => setTimeout(r, 600));
      const bl = document.getElementById('msgSheet');
      return { neu: document.body.classList.contains('neu'), offen: bl.classList.contains('show'), amOrt: bl.classList.contains('am-ort'),
        unten: Math.round(innerHeight - bl.querySelector('.ms-card').getBoundingClientRect().bottom) };
    });
    pruefe('ohne neues Aussehen: das Blatt von unten (' + JSON.stringify(r) + ')', r && !r.neu && r.offen && !r.amOrt && r.unten <= 1);
    await p._ctx.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Chat-Blasen: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Chat-Blasen: wie iMessage, Menü an der Nachricht — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})();
