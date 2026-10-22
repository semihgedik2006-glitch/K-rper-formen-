/* ══════════════════════════════════════════════════════════════════════
   FORMI ALS KUGEL, KOMPAKTES FENSTER, ZEIGER (Runde 177, 22.10.2026)

   Aus dem Betrieb: „das design von formi anpassen und ihn zu einem
   richtigen assistenten machen der wirklich in der app ist und gesteuert
   wird". Auf die Rückfragen: schwebende Kugel, das schwarze Loch als
   Gesicht, Formi bedient die App selbst.

   Geprüft wird:
    1. Die Kugel steht auf der Startseite, nicht im Chat und nicht auf
       Formis eigener Seite; nie bei einer fremden Firma.
    2. Ein Tipp öffnet Formi KOMPAKT: kein Dialog (aria-modal=false), die
       Seite dahinter bleibt scrollbar (kein body.jv-offen), die grossen
       Leinwände laufen nicht. Die Kugel ist dann weg.
    3. „Groß" schaltet ins Vollbild und zurück; das Gerät merkt es sich.
    4. „öffne die Aufgaben" im kompakten Fenster: ein Zeiger erscheint,
       danach ist die ECHTE Seite offen (kein Mini-Fenster). Am Rechner
       bleibt Formi offen, am Handy wird es zur Kugel.
    5. Im Vollbild bleibt das Mini-Fenster wie bisher (Gegenprobe).
    6. Kugel und Gross-Knopf: Trefferfläche ≥ 44 × 44 per Hit-Test bei
       320 / 390 / 430 / 820 / 1280 / 1440 / 1920, normal und kompakt,
       ganz im Bild und nicht über der Leiste unten.

   Service-Worker sind hier gesperrt (siehe oeffne): sonst lädt er das
   echte Firebase an der Attrappe vorbei.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
const TREFFER = (sel) => {
  const el = document.querySelector(sel);
  if (!el || !el.getClientRects().length) return { w: 0, h: 0, imBild: false };
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0, imBild: false };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--;
  while (u < innerHeight - 1 && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--;
  while (re < innerWidth - 1 && trifft(re + 1, cy)) re++;
  const leiste = document.getElementById('mobnav');
  const lr = leiste && leiste.getClientRects().length ? leiste.getBoundingClientRect() : null;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1),
    imBild: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
    ueberLeiste: !lr || lr.height === 0 || r.bottom <= lr.top + 0.5 };
};

async function oeffne(b, w, h, opt) {
  opt = opt || {};
  /* serviceWorkers:'block': sonst holt der Service-Worker nach dem
     ersten Laden das echte Firebase an page.route vorbei (Playwright fängt
     Anfragen des Workers nicht ab), die App lädt neu und steht in der
     Anmeldemaske. Nachgestellt am 22.10.2026 — auch auf main. */
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', reducedMotion: opt.wenigBewegung ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  if (opt.vorher) await p.addInitScript(opt.vorher);
  await p.addInitScript({ path: SP + '/' + (opt.stub || 'stub-chef.js') });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(900);
  p._ctx = ctx;
  return p;
}
const sichtbar = (p, sel) => p.evaluate((s) => { const el = document.querySelector(s); return !!el && !el.hidden && el.getClientRects().length > 0; }, sel);

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    for (const [w, h, name] of [[1440, 900, 'Rechner'], [390, 844, 'Handy']]) {
      console.log(`\n── ${name} ${w} × ${h} ──`);
      const p = await oeffne(b, w, h);
      pruefe('Kugel steht auf der Startseite', await sichtbar(p, '#formiKugel'));
      await p.click('#formiKugel');
      await p.waitForTimeout(500);
      const z = await p.evaluate(() => {
        const j = document.getElementById('jarvis');
        return { offen: !j.hidden, kompakt: j.classList.contains('jv-kompakt'), modal: j.getAttribute('aria-modal'),
          bodyGesperrt: document.body.classList.contains('jv-offen'), kugel: !document.getElementById('formiKugel').hidden,
          leinwand: getComputedStyle(document.getElementById('jarvisFeldchen')).display };
      });
      pruefe('ein Tipp öffnet Formi kompakt', z.offen && z.kompakt, JSON.stringify(z));
      pruefe('kompakt ist kein Dialog (aria-modal=false), die Seite bleibt scrollbar', z.modal === 'false' && !z.bodyGesperrt, JSON.stringify(z));
      pruefe('die grossen Leinwände sind im kompakten Fenster aus', z.leinwand === 'none', z.leinwand);
      pruefe('solange Formi offen ist, ist die Kugel weg', !z.kugel);

      await p.click('#jarvisGroesse');
      await p.waitForTimeout(300);
      const v = await p.evaluate(() => ({ kompakt: document.getElementById('jarvis').classList.contains('jv-kompakt'),
        modal: document.getElementById('jarvis').getAttribute('aria-modal'), gemerkt: localStorage.getItem('kf_jv_kompakt') }));
      pruefe('„Groß" macht Vollbild, als Dialog, und das Gerät merkt es sich', !v.kompakt && v.modal === 'true' && v.gemerkt === '0', JSON.stringify(v));

      /* Gegenprobe: im Vollbild bleibt „öffne die Aufgaben" ein Mini-Fenster. */
      await p.fill('#jarvisFeld', 'öffne die aufgaben');
      await p.click('#jarvisSenden');
      await p.waitForTimeout(1500);
      const voll = await p.evaluate(() => ({ view: (document.querySelector('.view.show') || {}).id, offen: !document.getElementById('jarvis').hidden }));
      pruefe('Vollbild: Seite bleibt, Formi bleibt offen (Mini-Fenster wie bisher)', voll.offen && voll.view !== 'view-todos', JSON.stringify(voll));

      await p.click('#jarvisGroesse');
      await p.waitForTimeout(300);
      pruefe('„Klein" macht wieder kompakt', await p.evaluate(() => document.getElementById('jarvis').classList.contains('jv-kompakt') && localStorage.getItem('kf_jv_kompakt') === '1'));

      await p.fill('#jarvisFeld', 'öffne die aufgaben');
      await p.click('#jarvisSenden');
      const zeiger = await p.waitForSelector('.formi-zeiger', { timeout: 4000 }).then(() => true).catch(() => false);
      pruefe('ein Zeiger fährt los', zeiger);
      await p.waitForTimeout(1500);
      const nach = await p.evaluate(() => ({ view: (document.querySelector('.view.show') || {}).id, offen: !document.getElementById('jarvis').hidden,
        kugel: !document.getElementById('formiKugel').hidden, zeigerWeg: !document.querySelector('.formi-zeiger') }));
      pruefe('danach ist die ECHTE Seite Aufgaben offen', nach.view === 'view-todos', JSON.stringify(nach));
      if (w > 820) pruefe('am Rechner bleibt Formi daneben offen', nach.offen && !nach.kugel, JSON.stringify(nach));
      else pruefe('am Handy wird Formi zur Kugel', !nach.offen && nach.kugel, JSON.stringify(nach));
      pruefe('der Zeiger räumt sich weg', nach.zeigerWeg);
      pruefe('keine Seitenfehler', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }

    console.log('\n── Wo die Kugel NICHT steht ──');
    {
      const p = await oeffne(b, 390, 844);
      await p.evaluate(() => { const k = document.querySelector('#mobnav [data-group="g-komm"]') || document.querySelector('#side [data-group="g-komm"]'); if (k) k.click(); });
      await p.waitForTimeout(500);
      const imChat = await p.evaluate(() => ({ view: (document.querySelector('.view.show') || {}).id, kugel: !document.getElementById('formiKugel').hidden }));
      pruefe('im Chat keine Kugel (Senden sitzt unten rechts)', imChat.view === 'view-chat' ? !imChat.kugel : true, JSON.stringify(imChat));
      await p._ctx.close();
    }
    {
      const p = await oeffne(b, 390, 844, { vorher: () => { window.__firma = 'fremd-ab12'; } });
      pruefe('fremde Firma: keine Kugel', !(await sichtbar(p, '#formiKugel')));
      await p._ctx.close();
    }

    console.log('\n── Trefferflächen (Hit-Test), normal und kompakt ──');
    for (const w of [320, 390, 430, 820, 1280, 1440, 1920]) {
      const h = w > 820 ? (w === 1280 ? 800 : w === 1440 ? 900 : 1080) : 844;
      for (const dichte of ['normal', 'kompakt']) {
        const p = await oeffne(b, w, h);
        if (dichte === 'kompakt') { await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt')); await p.waitForTimeout(200); }
        const k = await p.evaluate(TREFFER, '#formiKugel');
        pruefe(`${w} px ${dichte}: Kugel ${k.w}×${k.h}, im Bild, nicht auf der Leiste`, k.w >= 44 && k.h >= 44 && k.imBild && k.ueberLeiste, JSON.stringify(k));
        await p.click('#formiKugel'); await p.waitForTimeout(400);
        const g = await p.evaluate(TREFFER, '#jarvisGroesse');
        const s = await p.evaluate(TREFFER, '#jarvisSenden');
        const zu = await p.evaluate(TREFFER, '#jarvisZu');
        pruefe(`${w} px ${dichte}: Groß ${g.w}×${g.h}, Schließen ${zu.w}×${zu.h}, Senden ${s.w}×${s.h}`,
          [g, s, zu].every(x => x.w >= 44 && x.h >= 44 && x.imBild), JSON.stringify({ g, s, zu }));
        await p._ctx.close();
      }
    }
  } catch (e) {
    console.log('Fehler: ' + e.message.split('\n')[0]);
    schlecht++;
  }
  await b.close();
  console.log(schlecht ? `\n✗ Formi-Kugel: ${schlecht} von ${gut + schlecht} falsch` : `\n✓ Formi-Kugel: ${gut} Zusicherungen`);
  process.exit(schlecht ? 1 : 0);
})();
