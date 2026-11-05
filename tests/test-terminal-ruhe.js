/* ══════════════════════════════════════════════════════════════════════
   BILDSCHIRMSCHONER AM STEMPEL-TERMINAL (05.11.2026)

   Aus dem Betrieb, auf die Formi-Ideenliste („Bildschirmschoner am
   Studio-Rechner"): „alles davon ist super".

   Geprüft, in jeder Breite (320 / 390 / 430 / 820 / 1280 / 1440 / 1920):
   1. Beim Start ist er weg; nach drei Minuten ohne Eingabe ist er da.
   2. Uhrzeit, Wochentag und Studio stehen drin, Formi mit Gesicht.
   3. In JEDER der acht Lagen (er rückt einmal pro Minute weiter) liegt
      das ganze Feld im Bild.
   4. KEIN NAME aus der Personenliste steht darin — das Terminal steht
      offen am Empfang (Runde 189).
   5. Antippen weckt: er verschwindet, und KEIN PIN-Feld geht dabei auf.
   6. Ein offenes PIN-Feld mit halber PIN wird beim Einschlafen
      geschlossen.
   7. Der Code fürs Handy steht auch im Schoner.
   8. Arbeit je Bild bei 1440 px mit CPU ÷ 4 (Grenze 8,3 ms).

   Die Attrappe für terminals/ und zeiten/ kommt aus test-terminal.js
   (dieselbe Zeichenkette, nicht abgeschrieben).
   Aufruf: node tests/test-terminal-ruhe.js
   ══════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;

const quelle = fs.readFileSync(path.join(__dirname, 'test-terminal.js'), 'utf8');
const roh = /const ZUSATZ = `([\s\S]*?)`;/.exec(quelle);
if (!roh) { console.error('ZUSATZ in test-terminal.js nicht gefunden'); process.exit(1); }
const ZUSATZ = eval('`' + roh[1] + '`');
/* Die acht Lagen und die Wartezeit stehen im Skript der App, das nicht
   global ist — hier aus der Quelle gelesen statt abgeschrieben. */
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const LAGEN = JSON.parse(/var TM_RUHE_LAGEN = (\[\[.*?\]\]);/.exec(html)[1]);
const RUHE_MS = eval(/var TM_RUHE_MS = ([0-9*]+);/.exec(html)[1]);

let gut = 0, schlecht = 0;
function pruefe(was, b, info) {
  if (b) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (info !== undefined ? '  — ' + JSON.stringify(info).slice(0, 300) : '')); }
}

const VOR = `
  try { localStorage.setItem('kf_terminal', JSON.stringify({ id:'t1', geheim:'b'.repeat(64), name:'Empfang' })); } catch(e){}
  window.__terminals = [{ id:'t1', studioKey:'studio-6', name:'Empfang', letzterStempel:0 }];
  window.__zeiten = [];
`;

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const DPR = process.env.BILDER ? 2 : 1;
  for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', deviceScaleFactor: DPR });
    const p = await ctx.newPage();
    const fehler = [];
    p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.route('**fonts.googleapis.com/**', r => r.abort());
    await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
    await p.addInitScript({ path: SP + '/stub-chef.js' });
    await p.addInitScript({ content: VOR });
    await p.addInitScript({ content: ZUSATZ });
    /* Die Uhr der Seite steuert der Test: drei Minuten warten hiesse
       sonst drei Minuten warten. */
    await p.clock.install();
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    await p.clock.resume();
    await p.waitForFunction(() => getComputedStyle(document.getElementById('terminalSchirm')).display !== 'none' && document.querySelectorAll('#tmListe [data-tmwer]').length > 0, null, { timeout: 15000 });
    const W = w + ' px';

    const anfang = await p.evaluate(() => document.getElementById('tmRuhe').hidden);
    pruefe(W + ': beim Start kein Schoner', anfang === true);
    /* Zwei Minuten still: noch nichts. */
    await p.clock.fastForward(2 * 60000);
    await p.waitForTimeout(100);
    pruefe(W + ': nach zwei Minuten noch nicht', await p.evaluate(() => document.getElementById('tmRuhe').hidden));

    /* Halbe PIN offen lassen, dann drei Minuten still. */
    await p.evaluate(() => { document.querySelector('#tmListe [data-tmwer]').click(); });
    await p.waitForTimeout(200);
    await p.evaluate(() => { const t = [...document.querySelectorAll('#tmTasten button')].find(x => x.textContent.trim() === '1'); if (t) { t.click(); t.click(); } });
    const offen = await p.evaluate(() => ({ pin: getComputedStyle(document.getElementById('tmPin')).display, punkte: document.querySelectorAll('#tmPunkte i.voll').length }));
    pruefe(W + ': Gegenprobe — vor dem Einschlafen ist das PIN-Feld offen, zwei Ziffern getippt', offen.pin !== 'none' && offen.punkte === 2, offen);
    await p.evaluate(() => { document.getElementById('tmCode').hidden = false; document.getElementById('tmCodeZahl').textContent = '482 917'; });
    await p.clock.fastForward(RUHE_MS - 2 * 60000 + 6000);
    await p.waitForTimeout(800);
    const z = await p.evaluate(() => {
      const r = document.getElementById('tmRuhe');
      const namen = [...document.querySelectorAll('#tmListe .tm-nam')].map(x => x.textContent.trim()).filter(Boolean);
      const text = r.textContent;
      const loch = r.querySelector('.fk-loch');
      return {
        da: !r.hidden && getComputedStyle(r).display !== 'none',
        pinZu: getComputedStyle(document.getElementById('tmPin')).display === 'none',
        uhr: document.getElementById('tmRuheUhr').textContent,
        tag: document.getElementById('tmRuheTag').textContent,
        studio: document.getElementById('tmRuheStudio').textContent,
        studioSoll: document.getElementById('tmStudio').textContent,
        code: document.getElementById('tmRuheCode').hidden ? '' : document.getElementById('tmRuheCodeZahl').textContent,
        gesicht: !!loch && loch.getBoundingClientRect().width > 20,
        namen: namen.filter(n => text.indexOf(n) >= 0 || text.indexOf(n.split(' ')[0]) >= 0),
        anzahlNamen: namen.length,
        oben: document.elementFromPoint(innerWidth / 2, innerHeight / 2) && document.getElementById('tmRuhe').contains(document.elementFromPoint(innerWidth / 2, innerHeight / 2))
      };
    });
    pruefe(W + ': nach drei Minuten ist der Schoner da und liegt oben', z.da && z.oben, z);
    pruefe(W + ': die halbe PIN ist weg, das PIN-Feld zu', z.pinZu, z);
    pruefe(W + ': Uhrzeit, Wochentag, Studio', /^\d\d:\d\d$/.test(z.uhr) && /(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)/.test(z.tag) && z.studio && z.studio === z.studioSoll, z);
    pruefe(W + ': Formi mit Gesicht', z.gesicht, z);
    pruefe(W + ': kein Name aus der Personenliste (' + z.anzahlNamen + ' geprüft)', z.anzahlNamen > 0 && !z.namen.length, z.namen);
    pruefe(W + ': der Code fürs Handy steht auch im Schoner', z.code === '482 917', z.code);

    /* Alle acht Lagen: das Feld bleibt ganz im Bild. */
    const lagen = await p.evaluate((TM_RUHE_LAGEN) => {
      const f = document.getElementById('tmRuheFeld'), hin = document.querySelector('.tm-ruhe-hinweis');
      f.style.transition = 'none';
      const raus = [];
      TM_RUHE_LAGEN.forEach((l, i) => {
        f.style.transform = 'translate(' + l[0] + 'vw,' + l[1] + 'vh)';
        const r = f.getBoundingClientRect(), hr = hin.getBoundingClientRect();
        if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) raus.push({ i, l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) });
        if (r.bottom > hr.top) raus.push({ i, ueberHinweis: Math.round(r.bottom - hr.top) });
      });
      f.style.transform = ''; f.style.transition = '';
      return raus;
    }, LAGEN);
    pruefe(W + ': in allen acht Lagen ganz im Bild, nicht über dem Hinweis', !lagen.length, lagen);
    if (process.env.BILDER && [390, 1440, 1920].includes(w)) await p.screenshot({ path: path.join(process.env.BILDER, 'ruhe-' + w + '.png') });

    /* 8. Arbeit je Bild bei 1440 mit CPU ÷ 4. */
    if (w === 1440) {
      const cdp = await ctx.newCDPSession(p);
      await cdp.send('Performance.enable');
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
      const bilder = await p.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(n); })(); }));
      const a = await m();
      const bilder2 = await p.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(n); })(); }));
      const e = await m();
      const proBild = (e.TaskDuration - a.TaskDuration) * 1000 / Math.max(1, bilder2);
      console.log('    Arbeit je Bild (CPU ÷ 4): ' + proBild.toFixed(2) + ' ms bei ' + bilder2 + ' Bildern in 3 s (Vorlauf ' + bilder + ')');
      pruefe('1440 px: Arbeit je Bild mit CPU ÷ 4 unter 8,3 ms', proBild < 8.3, proBild);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    }

    /* 5. Antippen weckt, ohne eine Kachel darunter zu treffen. */
    await p.mouse.click(Math.round(w * 0.3), Math.round(h * 0.35));
    await p.waitForTimeout(300);
    const wach = await p.evaluate(() => ({ weg: document.getElementById('tmRuhe').hidden, pin: getComputedStyle(document.getElementById('tmPin')).display }));
    pruefe(W + ': Antippen weckt, und es öffnet sich kein PIN-Feld', wach.weg && wach.pin === 'none', wach);
    /* Danach zählt die Zeit neu: sofort wieder still ⇒ kein Schoner. */
    await p.clock.fastForward(RUHE_MS - 30000);
    await p.waitForTimeout(100);
    pruefe(W + ': nach dem Wecken beginnt die Zeit neu', await p.evaluate(() => document.getElementById('tmRuhe').hidden));
    /* Taste weckt auch (Rechner ohne Maus am Tresen). */
    await p.clock.fastForward(40000);
    await p.waitForTimeout(300);
    pruefe(W + ': nach weiteren drei Minuten wieder da', await p.evaluate(() => !document.getElementById('tmRuhe').hidden));
    await p.keyboard.press('Space');
    pruefe(W + ': eine Taste weckt auch', await p.evaluate(() => document.getElementById('tmRuhe').hidden));
    pruefe(W + ': keine Fehler', !fehler.length, fehler);
    await ctx.close();
  }
  await b.close();
  console.log('\n' + (schlecht ? '✗' : '✓') + ' Bildschirmschoner am Terminal: ' + gut + ' gut, ' + schlecht + ' schlecht');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
