/* ══════════════════════════════════════════════════════════════════════
   AUSSEHEN „NACHT" (17.11.2026)

   Aus dem Betrieb: „können wir dieses design vlt auch für studio chat
   irgendwie adaptieren?" — gemeint ist das ruhige, fast schwarze
   Aussehen des Assistenten. Es kommt als eigene Wahl dazu, die
   Voreinstellung bleibt „Formi". Andere benutzen die App parallel.

   Geprüft wird, was gezeichnet wird, nicht was eingestellt ist:
   1. Profil → Aussehen → „Nacht" färbt den Grund wirklich fast schwarz,
      ohne Sterne und Nebel, und bleibt nach dem Neuladen.
   2. Der Knopf „Nacht" trifft bei allen Breiten mit 44 × 44 px.
   3. Text bleibt lesbar: Kontrast ≥ 4,5 : 1 an echten Bildpunkten.
   4. „App gestalten" kennt den Vorschlag, und ein fremdes Design mit
      theme:'nacht' übersteht die Bereinigung.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const BILDER = process.env.BILDER || '';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

async function zumAussehen(p) {
  await p.evaluate(() => { const a = document.getElementById('uAvatar'); if (a) a.click(); });
  await p.waitForTimeout(700);
  await p.evaluate(() => { const t = document.querySelector('[data-pmtab="aussehen"]'); if (t) t.click(); });
  await p.waitForTimeout(700);
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const fehler = [];

  console.log('\n── 1 Wählen und behalten ──');
  const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: 390, height: 900 } });
  p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  await p.addInitScript(() => { try { localStorage.setItem('kf_tour', '99:demo-ich'); localStorage.setItem('kf_formi_gruss', new Date().toDateString()); } catch (e) {} });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3300);
  await zumAussehen(p);
  const da = await p.evaluate(() => [...document.querySelectorAll('#thOpts [data-th]')].map(x => x.dataset.th));
  pruefe('„Nacht" steht unter Farben zur Wahl', da.indexOf('nacht') >= 0, da.join(' '));
  pruefe('„Formi" bleibt vorn', da[0] === 'formi', da.join(' '));
  await p.click('#thOpts [data-th="nacht"]');
  await p.waitForTimeout(500);
  const z = await p.evaluate(() => ({
    nacht: document.body.classList.contains('nacht'),
    formi: document.body.classList.contains('formi'),
    hell: document.body.classList.contains('light'),
    bg: getComputedStyle(document.body).getPropertyValue('--bg').trim().toUpperCase(),
    meta: document.querySelector('meta[name="theme-color"]').getAttribute('content'),
    muster: getComputedStyle(document.querySelector('.app'), '::before').backgroundImage
  }));
  pruefe('body trägt „nacht", nicht „formi" und nicht „light"', z.nacht && !z.formi && !z.hell, JSON.stringify(z));
  pruefe('der Grund ist fast schwarz (#08080A)', z.bg === '#08080A', z.bg);
  pruefe('keine Sterne und kein Nebel, auch wenn „Raum" noch eingestellt ist', z.muster === 'none', z.muster.slice(0, 60));
  pruefe('die Statusleiste zieht mit', z.meta.toUpperCase() === '#08080A', z.meta);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  const nach = await p.evaluate(() => document.body.classList.contains('nacht'));
  pruefe('nach dem Neuladen noch „Nacht"', nach);

  console.log('\n── 2 Trefferfläche des Knopfs ──');
  for (const w of [320, 390, 430, 820, 1280, 1440, 1920]) {
    for (const d of ['normal', 'kompakt']) {
      await p.setViewportSize({ width: w, height: w >= 1280 ? (w === 1920 ? 1080 : w === 1440 ? 900 : 800) : 900 });
      await p.evaluate(dd => document.body.setAttribute('data-dichte', dd), d);
      await zumAussehen(p);
      const m = await p.evaluate(() => {
        const el = document.querySelector('#thOpts [data-th="nacht"]');
        if (!el) return null;
        el.scrollIntoView({ block: 'center' });
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const hit = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
        let hoch = 0, breit = 0;
        for (let y = Math.floor(r.top) - 2; y <= Math.ceil(r.bottom) + 2; y++) if (hit(cx, y)) hoch++;
        for (let x = Math.floor(r.left) - 2; x <= Math.ceil(r.right) + 2; x++) if (hit(x, cy)) breit++;
        const imBild = r.left >= 0 && r.right <= innerWidth;
        return { hoch, breit, imBild };
      });
      pruefe(w + ' px ' + d + ': ' + (m ? m.breit + ' × ' + m.hoch : 'fehlt'), m && m.hoch >= 44 && m.breit >= 44 && m.imBild, JSON.stringify(m));
      await p.keyboard.press('Escape');
      await p.waitForTimeout(300);
    }
  }

  console.log('\n── 3 Kontrast an echten Bildpunkten ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    await p.setViewportSize({ width: w, height: h });
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3300);
    const proben = await p.evaluate(() => {
      const r = [];
      const els = [...document.querySelectorAll('body *')].filter(e => {
        if (!e.childNodes.length || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 2)) return false;
        const b = e.getBoundingClientRect(); const s = getComputedStyle(e);
        return b.width > 20 && b.height > 8 && b.top >= 0 && b.bottom <= innerHeight && b.left >= 0 && b.right <= innerWidth &&
          s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.9 && parseFloat(s.fontSize) >= 12;
      });
      for (const e of els.slice(0, 60)) {
        const b = e.getBoundingClientRect(), s = getComputedStyle(e);
        r.push({ x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), farbe: s.color, text: e.textContent.trim().slice(0, 24) });
      }
      return r;
    });
    const bild = await p.screenshot();
    if (BILDER) require('fs').writeFileSync(BILDER + '/nacht-' + w + '.png', bild);
    const schlechteste = await p.evaluate(async ({ b64, proben }) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const lum = (r, g, b) => 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      let schlecht = null;
      for (const q of proben) {
        const m = q.farbe.match(/\d+(\.\d+)?/g).map(Number);
        const lt = lum(m[0], m[1], m[2]);
        const mx = q.x + q.w / 2, my = q.y + q.h / 2;
        const ecken = [[q.x + 1, q.y + 1], [q.x + q.w - 2, q.y + 1], [q.x + 1, q.y + q.h - 2], [q.x + q.w - 2, q.y + q.h - 2],
          [q.x + 2, my], [q.x + q.w - 3, my], [mx, q.y + 1], [mx, q.y + q.h - 2]].map(([px, py]) => {
          const xx = Math.max(0, Math.min(c.width - 1, Math.round(px))), yy = Math.max(0, Math.min(c.height - 1, Math.round(py)));
          const i = (yy * c.width + xx) * 4; return lum(d[i], d[i + 1], d[i + 2]);
        }).sort((a, b) => Math.abs(b - lt) - Math.abs(a - lt));
        const hg = ecken[2];
        const k = (Math.max(lt, hg) + 0.05) / (Math.min(lt, hg) + 0.05);
        if (!schlecht || k < schlecht.k) schlecht = { k, text: q.text };
      }
      return schlecht;
    }, { b64: bild.toString('base64'), proben });
    pruefe(w + ' px: schwächster Text ' + (schlechteste ? schlechteste.k.toFixed(2) + ' : 1 („' + schlechteste.text + '“)' : '–'),
      schlechteste && schlechteste.k >= 4.5, '');
  }

  console.log('\n── 4 „App gestalten" ──');
  const quelle = require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
  const erlaubt = (quelle.match(/AUFBAU_ERLAUBT = \{\s*theme:\[([^\]]*)\]/) || [])[1] || '';
  const vorschlag = /\{ id:'nacht', name:'Nacht'[^}]*\n[^}]*\n\s*prefs:\{ theme:'nacht'/.test(quelle);
  pruefe('Vorschlag „Nacht" setzt theme nacht', vorschlag);
  pruefe('ein Design mit theme nacht übersteht die Bereinigung', erlaubt.indexOf("'nacht'") >= 0, erlaubt);
  pruefe('„App gestalten" bietet „Nacht" unter Farben an', quelle.indexOf("chips('theme', [['formi','Formi'],['nacht','Nacht']") >= 0);
  pruefe('keine Skriptfehler', fehler.length === 0, fehler.join(' | '));
  await b.close();
  console.log('\n' + gut + ' gut, ' + schlecht + ' schlecht');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
