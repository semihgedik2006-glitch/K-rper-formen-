/* ══════════════════════════════════════════════════════════════════════
   FORMI-STICKER IM CHAT (05.11.2026)

   Aus dem Betrieb, auf die Ideenliste „Formi-Sticker im Chat: Formis
   Gefühle als Reaktionen statt normaler Emojis": „alles davon ist super".

   Geprüft, in jeder Breite (320 / 390 / 430 / 820 / 1280 / 1440 / 1920)
   und in den Dichten „normal" und „kompakt":
   1. Im Nachrichtenblatt steht unter den Zeichen eine Reihe mit vier
      Formi-Stickern, jeder ≥ 44 × 44 px Trefferfläche (elementFromPoint)
      und ganz im Bild.
   2. Antippen schreibt genau den Sticker-Namen mit der eigenen Kennung.
   3. Unter der Nachricht steht der Sticker als Figur mit Zeichen, ohne
      Animation in der Figur, mit Namen für Vorleseprogramme.
   4. Am Brett steht im „+"-Wähler dieselbe Auswahl.
   Die Namen müssen mit firestore.rules übereinstimmen (reaktionsZeichen).
   Aufruf: node tests/test-formi-sticker.js
   ══════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;

let gut = 0, schlecht = 0;
function pruefe(was, b, info) {
  if (b) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (info !== undefined ? '  — ' + JSON.stringify(info).slice(0, 300) : '')); }
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
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1), imBild: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight };
};

(async () => {
  /* Die Namen in der App und in den Regeln sind dieselben. */
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const regeln = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  const namen = [...html.matchAll(/k:'(formi-[a-z]+)'/g)].map(m => m[1]);
  pruefe('vier Sticker in der App', namen.length === 4, namen);
  pruefe('jeder Name steht in reaktionsZeichen() UND hat eine eigene gleichOhneMich-Zeile', namen.every(n => regeln.includes("'" + n + "'") && regeln.includes("gleichOhneMich(alt, neu, '" + n + "')")));

  const b = await chromium.launch({ executablePath: CHROME });
  const DPR = process.env.BILDER ? 2 : 1;
  for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    for (const dichte of ['normal', 'kompakt']) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', deviceScaleFactor: DPR });
      const p = await ctx.newPage();
      const fehler = [];
      p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
      await p.route('**://www.gstatic.com/**', r => r.abort());
      await p.route('**fonts.googleapis.com/**', r => r.abort());
      await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
      await p.addInitScript({ path: SP + '/stub-chef.js' });
      await p.goto(APP, { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
      await p.waitForTimeout(600);
      if (dichte === 'kompakt') await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt'));
      /* In den Chat: Leiste unten (Handy) oder Seitenleiste (Rechner),
         dann „Allgemein", falls die Liste davor steht. */
      await p.evaluate(() => { const k = [...document.querySelectorAll('.mobnav [data-group="g-komm"], #side [data-group="g-komm"]')].find(x => x.getClientRects().length); if (k) k.click(); });
      await p.waitForTimeout(900);
      await p.evaluate(() => { const z = document.querySelector('#kanalSpalte [data-kanalwahl="allgemein"]'); if (z && !document.getElementById('chatScroll').getClientRects().length) z.click(); });
      await p.waitForTimeout(700);
      const n = await p.evaluate(() => [...document.querySelectorAll('#chatScroll .msg')].filter(m => m.getClientRects().length).length);
      if (!n) { pruefe(w + ' px ' + dichte + ': Nachrichten im Chat da', false); await ctx.close(); continue; }
      await p.evaluate(() => { const m = [...document.querySelectorAll('#chatScroll .msg')].pop(); m.scrollIntoView({ block: 'center' }); });
      await p.waitForTimeout(400);
      await p.evaluate(() => [...document.querySelectorAll('#chatScroll .msg')].pop().click());
      await p.waitForTimeout(700);
      const mass = await p.evaluate((T) => {
        const TR = eval('(' + T + ')');
        return [...document.querySelectorAll('#msSheetFormi .ms-sticker')].map(el => Object.assign({ e: el.getAttribute('data-e') }, TR(el)));
      }, TREFFER.toString());
      const klein = mass.filter(m => m.w < 44 || m.h < 44 || !m.imBild);
      pruefe(w + ' px ' + dichte + ': vier Sticker im Blatt, jeder ≥ 44 × 44 und im Bild', mass.length === 4 && !klein.length, mass);
      if (w === 390 && dichte === 'normal') await p.screenshot({ path: path.join(process.env.BILDER || '/tmp', 'sticker-blatt-390.png') });
      if (w === 1440 && dichte === 'normal') await p.screenshot({ path: path.join(process.env.BILDER || '/tmp', 'sticker-blatt-1440.png') });
      if (w === 390 && dichte === 'normal') {
        const vorher = await p.evaluate(() => (window.__schreib || []).length);
        await p.click('#msSheetFormi [data-e="formi-stolz"]');
        await p.waitForTimeout(700);
        const geschrieben = await p.evaluate((v) => (window.__schreib || []).slice(v), vorher);
        const r = geschrieben.map(x => x.daten && x.daten.reactions).filter(Boolean)[0];
        pruefe('Antippen schreibt formi-stolz mit der eigenen Kennung', !!r && Array.isArray(r['formi-stolz']) && r['formi-stolz'].length === 1, geschrieben);
        /* Die Attrappe spielt Geschriebenes nicht von selbst zurück: die
           Nachricht mit dem Sticker wird als neuer Stand nachgereicht. */
        const pfad = (geschrieben.find(x => x.daten && x.daten.reactions) || {}).pfad || '';
        const bedient = await p.evaluate(([pf, r]) => window.__nachschub(pf.replace(/\/[^/]+$/, ''),
          [{ id: pf.split('/').pop(), uid: 'u3', name: 'Ben Kraus', role: 'leiter', text: 'Sagt bitte kurz Bescheid.', ts: Date.now() - 60000, reactions: Object.assign({ 'formi-staunt': ['u3'] }, r) }]), [pfad, r || {}]);
        pruefe('neuer Stand erreicht den Chat (' + pfad + ')', bedient > 0, bedient);
        await p.waitForTimeout(500);
        const unter = await p.evaluate(() => {
          const el = document.querySelector('#chatScroll .reacts .react .r-formi-stolz');
          if (!el) return null;
          const knopf = el.closest('.react');
          const anim = [...el.querySelectorAll('*')].some(x => { const cs = getComputedStyle(x); return cs.animationName && cs.animationName !== 'none'; });
          return { label: knopf.getAttribute('aria-label'), zeichen: !!el.querySelector(':scope > i svg.sym'), anim };
        });
        pruefe('unter der Nachricht: Figur mit Stern-Symbol, Name zum Vorlesen, keine Animation', !!unter && unter.zeichen === true && /Formi ist stolz/.test(unter.label) && !unter.anim, unter);
        await p.evaluate(() => { const el = document.querySelector('#chatScroll .reacts .react .r-formi-stolz'); if (el) el.scrollIntoView({ block: 'center' }); });
        await p.waitForTimeout(300);
        const sichtbar = await p.evaluate((T) => { const el = document.querySelector('#chatScroll .reacts .react .r-formi-stolz'); const TR = eval('(' + T + ')'); return el ? TR(el.closest('.react')) : null; }, TREFFER.toString());
        pruefe('der Sticker unter der Nachricht ist zu sehen und antippbar', !!sichtbar && sichtbar.w > 0 && sichtbar.h > 0, sichtbar);
        /* Das Gesicht liegt im Loch. Beim Bau hatte ein zu weiter
           Selektor („.r-formi i") alle Teile des Gesichts aus der Figur
           geschoben — die Sticker waren nur noch schwarze Ringe. */
        const gesicht = await p.evaluate(() => { const a = document.querySelector('.reacts .r-formi-staunt .fk-auge, #msSheetFormi .r-formi-staunt .fk-auge'); const l = document.querySelector('#chatScroll .reacts .r-formi-staunt .fk-loch'); if (!l) return null; const r = l.getBoundingClientRect(); const m = l.querySelector('.fk-mund').getBoundingClientRect(); return { innen: m.left >= r.left - 1 && m.right <= r.right + 1 && m.top >= r.top - 1 && m.bottom <= r.bottom + 1 }; });
        pruefe('das Gesicht liegt im Loch (nicht verschoben)', !!gesicht && gesicht.innen, gesicht);
        if (unter) await p.screenshot({ path: path.join(process.env.BILDER || '/tmp', 'sticker-nachricht-390.png') });
      }
      pruefe(w + ' px ' + dichte + ': keine Fehler', !fehler.length, fehler);
      await ctx.close();
    }
  }

  /* Am Brett und am Aushang: der „+"-Wähler nimmt die Sticker mit
     (dieselbe Funktion reactionsHTML für alle drei Orte). */
  pruefe('Brett/Aushang: der Wähler hängt die Sticker an die sechs Zeichen', /REACT_EMOJIS\.concat\(REACT_FORMI\.map/.test(html));
  await b.close();
  console.log('\n' + (schlecht ? '✗' : '✓') + ' Formi-Sticker: ' + gut + ' gut, ' + schlecht + ' schlecht');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
