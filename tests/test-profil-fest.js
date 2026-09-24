/* ══════════════════════════════════════════════════════════════════════
   DAS PROFIL-BLATT STEHT FEST (Handy)

   Aus dem Betrieb, 24.9.2026: „Die Profilseite auf dem Handy, wo man das
   Aussehen etc. bearbeiten kann, ist nicht fixiert und lässt sich
   horizontal sowie vertikal verschieben — das ist nicht so optimal auf
   dem Handy."

   Vorher gemessen (390 × 844): das Blatt war 392 px breit bei 388 px
   Sichtbreite — die Fläche unter „Speichern" ragte je 4 px über den
   Rand. Quer ließ es sich um 4 px schieben; senkrecht lief die Bewegung
   am Ende an die Seite dahinter weiter (kein overscroll-behavior).

   Was dieser Durchlauf festhält, bei 320 / 390 / 430 px:
     · das Blatt ist nicht breiter als der Bildschirm
     · ein Wisch QUER (echte Touch-Geste) verschiebt nichts
     · ein Wisch SENKRECHT scrollt den Inhalt — das Blatt selbst bleibt,
       wo es ist
     · ein Wisch NEBEN dem Blatt (auf dem abgedunkelten Rand) bewegt nichts
     · „Speichern" bleibt erreichbar und ≥ 44 × 44
   Nicht prüfbar hier: das Gummiband-Nachfedern von iOS Safari — Chromium
   hat es nicht. Geprüft wird die Regel, die es abstellt
   (overscroll-behavior: contain), nicht das Federn selbst.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

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
const LAGE = () => {
  const b = document.querySelector('#profileModal .pm-box');
  const r = b.getBoundingClientRect();
  return { links: Math.round(r.left), oben: Math.round(r.top), sl: b.scrollLeft, st: Math.round(b.scrollTop),
           sw: b.scrollWidth, cw: b.clientWidth, docX: scrollX, docY: scrollY };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [w, h] of [[320, 568], [390, 844], [430, 932]]) {
    console.log('\n── ' + w + ' × ' + h + ' ──');
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    const fehler = [];
    p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3500);
    await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
    await p.evaluate(() => document.getElementById('uAvatar').click());
    await p.waitForTimeout(900);
    const cdp = await ctx.newCDPSession(p);
    /* Echte Touch-Ereignisse: Finger auf, zwölf Schritte ziehen, los.
       (Input.synthesizeScrollGesture mit „touch" scrollte in dieser
       Umgebung gar nichts — auch die Aufgabenliste nicht; mit einer
       Messung, die nie etwas bewegt, wäre jeder Fall grün.) */
    const wisch = async (x, y, dx, dy) => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let i = 1; i <= 12; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i / 12, y: y + dy * i / 12 }] });
        await p.waitForTimeout(16);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await p.waitForTimeout(400);
    };

    const a = await p.evaluate(LAGE);
    console.log('  ' + JSON.stringify(a));
    pruefe('das Blatt ist nicht breiter als der Bildschirm (vorher +4 px)', a.sw <= a.cw, a.sw + ' bei ' + a.cw);

    const box = await p.evaluate(() => { const r = document.querySelector('#profileModal .pm-box').getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height * 0.6), oben: Math.round(r.top) }; });

    await wisch(box.x + 100 > w ? box.x : box.x + 100, box.y, -Math.round(w * 0.6), 0);
    const quer = await p.evaluate(LAGE);
    pruefe('ein Wisch quer verschiebt nichts', quer.sl === 0 && quer.links === a.links && quer.docX === 0, JSON.stringify(quer));

    await wisch(box.x, box.y, 0, -Math.round(h * 0.3));
    const senk = await p.evaluate(LAGE);
    pruefe('ein Wisch senkrecht scrollt den Inhalt', senk.st > a.st, a.st + ' → ' + senk.st);
    pruefe('… und das Blatt selbst bleibt stehen', senk.oben === a.oben && senk.links === a.links && senk.docY === 0,
      JSON.stringify(senk));

    /* Ganz nach unten und weiter: nichts läuft an die Seite dahinter weiter. */
    for (let i = 0; i < 5; i++) await wisch(box.x, box.y, 0, -Math.round(h * 0.5));
    const ende = await p.evaluate(LAGE);
    pruefe('am Ende läuft die Bewegung nicht weiter', ende.oben === a.oben && ende.docY === 0, JSON.stringify(ende));

    if (box.oben > 40) {
      await wisch(box.x, Math.round(box.oben / 2), 0, -200);
      await wisch(box.x, Math.round(box.oben / 2), -150, 0);
      const neben = await p.evaluate(LAGE);
      pruefe('ein Wisch neben dem Blatt bewegt nichts', neben.oben === a.oben && neben.links === a.links && neben.docX === 0 && neben.docY === 0,
        JSON.stringify(neben));
    }

    const sp = await p.evaluate((SRC) => { const TREFFER = eval(SRC); return TREFFER(document.getElementById('pmSave')); },
      '(' + TREFFER.toString() + ')');
    pruefe('„Speichern" bleibt erreichbar, ≥ 44 × 44', sp.w >= 44 && sp.h >= 44, JSON.stringify(sp));
    pruefe('ohne Skriptfehler', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }
  await b.close();
  console.log(schlecht
    ? '\n✗ Profil-Blatt: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Profil-Blatt: steht fest, nur der Inhalt scrollt — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
