/* ══════════════════════════════════════════════════════════════════════
   STIL „FORMI" (Runde 178)

   Aus dem Betrieb, 22.10.2026: „es sieht aber noch alles gleich aus wir
   sollten am ganzen hud arbeiten und den farben und mehr motion". Auf
   drei Skizzen: „A · Formi-Welt", Bewegung „spürbar, aber gezielt",
   „Neuer Stil ist Standard, Wahl bleibt".

   Geprüft wird:
    1. Ein neues Gerät startet im Stil Formi (body.formi, nicht light).
    2. Übergang: Wer die alte Voreinstellung „auto" gespeichert hat,
       bekommt Formi. Wer ausdrücklich Hell gewählt hat, behält Hell.
       Und wer danach Hell wählt, bleibt nach dem Neuladen bei Hell.
    3. Profil → Aussehen nennt Formi zuerst. „Hell" schaltet Formi ab,
       „Formi" wieder an.
    4. Bewegung: Beim Seitenwechsel liegt .hud-ein kurz an der neuen
       Ansicht und fällt nach ≤ 1 s wieder ab, ebenso body.hud-impuls.
       Bei „Bewegung reduzieren" gibt es keins von beiden.
       Keine Endlos-Animation im Stil (Hausregel „flüssig").
    5. Kein Querlauf bei 320 / 390 / 430 / 820 / 1280 / 1440 / 1920 px,
       auch während der Lichtimpuls läuft.
    6. Kontrast ≥ 4,5 : 1 an echten Bildpunkten: Titel und Unterzeile
       einer Zeile auf der Startseite, ein Eintrag der Seitenleiste, die
       kleine Überschrift über einer Gruppe.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

async function oeffne(b, w, h, opt) {
  opt = opt || {};
  /* serviceWorkers:'block' (Runde 182): sonst lädt der Service-Worker das
     echte Firebase an page.route vorbei und die App steht in der
     Anmeldemaske — in dieser Umgebung schon auf main nachgestellt. */
  const ctx = await b.newContext(Object.assign({ serviceWorkers: 'block', viewport: { width: w, height: h } },
    opt.ruhe ? { reducedMotion: 'reduce' } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await p.addInitScript(() => { try { localStorage.setItem('kf_tour', '1:testuid'); } catch (e) {} });
  if (opt.prefs !== undefined) await p.addInitScript((v) => { try { if (!sessionStorage.getItem('__p')) { localStorage.setItem('kf_prefs', v); sessionStorage.setItem('__p', '1'); } } catch (e) {} }, opt.prefs);
  await p.addInitScript({ path: SP + '/' + (opt.stub || 'stub-chef.js') });
  await p.goto(APP + '?neu=1', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction((sel) => !!document.querySelector(sel), opt.warte || '#app.show', { timeout: 15000 });
  await p.waitForTimeout(700);
  p._ctx = ctx;
  return p;
}
const zu = (p) => p._ctx.close();
const stil = (p) => p.evaluate(() => ({ formi: document.body.classList.contains('formi'), hell: document.body.classList.contains('light'), bg: document.body.dataset.appbg,
  meta: (document.querySelector('meta[name="theme-color"]') || {}).content }));
const ansicht = (p, v) => p.evaluate(async (v) => {
  const w = ms => new Promise(r => setTimeout(r, ms));
  const name = { todos: /Aufgaben/, home: /Start/, chef: /Verwaltung/ }[v];
  const n = [...document.querySelectorAll('#side [data-group], #side button, .mobnav [data-group]')]
    .find(e => name.test(e.textContent) && e.getClientRects().length);
  if (n) n.click();
  await w(30);
}, v);
/* Kontrast aus echten Bildpunkten: der hellste Punkt im Text gegen den
   häufigsten Ton der Fläche dahinter (der Median der Helligkeit). */
async function kontrast(p, sel) {
  const r = await p.evaluate((s) => {
    const el = [...document.querySelectorAll(s)].find(e => e.getClientRects().length);
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }, sel);
  if (!r || r.w < 2 || r.h < 2) return null;
  await p.waitForTimeout(150);
  const bild = await p.screenshot({ clip: { x: Math.floor(r.x), y: Math.floor(r.y), width: Math.ceil(r.w), height: Math.ceil(r.h) } });
  return p.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const lum = (r, gg, b) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(gg) + .0722 * f(b); };
    const L = []; for (let i = 0; i < d.length; i += 4) L.push(lum(d[i], d[i + 1], d[i + 2]));
    L.sort((a, b) => a - b);
    const grund = L[Math.floor(L.length / 2)], text = L[L.length - 1];
    return Math.round(((Math.max(grund, text) + .05) / (Math.min(grund, text) + .05)) * 100) / 100;
  }, bild.toString('base64'));
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1/2 Voreinstellung und Übergang ──');
  {
    const p = await oeffne(b, 1440, 900);
    const s = await stil(p);
    pruefe('neues Gerät: Stil Formi mit Hintergrund „Raum"', s.formi && !s.hell && s.bg === 'raum', JSON.stringify(s));
    pruefe('Statusleiste des Handys im Ton der App', s.meta === '#070A14', s.meta);
    pruefe('keine Fehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }
  {
    const p = await oeffne(b, 1440, 900, { prefs: JSON.stringify({ theme: 'auto', accent: 'bunt', appbg: 'keiner' }) });
    const s = await stil(p);
    pruefe('gespeichertes „auto"/„keiner" (alte Voreinstellungen) → Formi mit Raum', s.formi && !s.hell && s.bg === 'raum', JSON.stringify(s));
    const gesp = await p.evaluate(() => JSON.parse(localStorage.getItem('kf_prefs')));
    pruefe('… und der Übergang ist vermerkt (stil2)', gesp.stil2 === true && gesp.theme === 'formi', JSON.stringify(gesp));
    await zu(p);
  }
  {
    const p = await oeffne(b, 1440, 900, { prefs: JSON.stringify({ theme: 'light', accent: 'bunt', appbg: 'ecken' }) });
    const s = await stil(p);
    pruefe('ausdrücklich Hell und „Ecken" gewählt → bleibt beides', s.hell && !s.formi && s.bg === 'ecken', JSON.stringify(s));
    await zu(p);
  }

  console.log('\n── 3 Profil → Aussehen ──');
  {
    const p = await oeffne(b, 1440, 900);
    await p.evaluate(() => document.getElementById('uAvatar').click());
    await p.waitForTimeout(300);
    await p.evaluate(() => { const r = [...document.querySelectorAll('#profileModal button, #profileModal [data-tab]')].find(e => /Aussehen/.test(e.textContent)); if (r) r.click(); });
    await p.waitForTimeout(300);
    const wahl = await p.evaluate(() => [...document.querySelectorAll('#thOpts [data-th]')].map(e => e.dataset.th + (e.classList.contains('on') ? '*' : '')));
    pruefe('Formi steht zuerst und ist gewählt', wahl[0] === 'formi*' && wahl.includes('light') && wahl.includes('dark') && wahl.includes('auto'), JSON.stringify(wahl));
    await p.click('#thOpts [data-th="light"]'); await p.waitForTimeout(300);
    let s = await stil(p);
    pruefe('„Hell" schaltet Formi ab', s.hell && !s.formi, JSON.stringify(s));
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => !!document.querySelector('#app.show')); await p.waitForTimeout(600);
    s = await stil(p);
    pruefe('… und bleibt nach dem Neuladen Hell', s.hell && !s.formi, JSON.stringify(s));
    await p.evaluate(() => document.getElementById('uAvatar').click()); await p.waitForTimeout(300);
    await p.evaluate(() => { const r = [...document.querySelectorAll('#profileModal button, #profileModal [data-tab]')].find(e => /Aussehen/.test(e.textContent)); if (r) r.click(); });
    await p.waitForTimeout(300);
    await p.click('#thOpts [data-th="formi"]'); await p.waitForTimeout(300);
    s = await stil(p);
    pruefe('„Formi" schaltet ihn wieder an', s.formi && !s.hell, JSON.stringify(s));
    await zu(p);
  }

  console.log('\n── 4 Bewegung ──');
  {
    const p = await oeffne(b, 1440, 900);
    await ansicht(p, 'todos');
    const sofort = await p.evaluate(() => ({ ein: !!document.querySelector('#view-todos.hud-ein'), alle: document.querySelectorAll('.view.hud-ein').length }));
    await p.waitForTimeout(120);
    const impuls = await p.evaluate(() => document.body.classList.contains('hud-impuls'));
    pruefe('Seitenwechsel: die neue Ansicht baut sich auf (.hud-ein, nur an ihr)', sofort.ein && sofort.alle === 1, JSON.stringify(sofort));
    pruefe('… und der Lichtimpuls läuft', impuls);
    const anim = await p.evaluate(() => { const z = document.querySelector('#view-todos .todo'); return z ? getComputedStyle(z).animationName : 'keine Zeile'; });
    pruefe('… die Zeilen nehmen die Einblendung', /hudEin/.test(anim), anim);
    await p.waitForTimeout(1100);
    const spaeter = await p.evaluate(() => ({ ein: document.querySelectorAll('.hud-ein').length, impuls: document.body.classList.contains('hud-impuls') }));
    pruefe('nach 1 s hängt nichts mehr an (spätere Neuzeichnungen bewegen sich nicht)', !spaeter.ein && !spaeter.impuls, JSON.stringify(spaeter));
    const endlos = await p.evaluate(() => {
      const raus = [];
      for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch (e) { continue; }
        for (const r of rs) { const t = r.cssText || ''; if (/body\.formi/.test(t) && /animation[^;]*infinite/.test(t)) raus.push(t.slice(0, 80)); } }
      return raus;
    });
    pruefe('keine Endlos-Animation im Stil', !endlos.length, endlos.join(' | '));
    await zu(p);
  }
  {
    const p = await oeffne(b, 1440, 900, { ruhe: true });
    await ansicht(p, 'todos');
    await p.waitForTimeout(60);
    const s = await p.evaluate(() => ({ ein: document.querySelectorAll('.hud-ein').length, impuls: document.body.classList.contains('hud-impuls') }));
    pruefe('„Bewegung reduzieren": weder Einblendung noch Impuls', !s.ein && !s.impuls, JSON.stringify(s));
    await zu(p);
  }

  console.log('\n── 5 Kein Querlauf ──');
  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h);
    await ansicht(p, 'todos');
    await p.waitForTimeout(400);   // Impuls mittendrin
    const quer = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    pruefe(w + ' px: kein Querlauf, auch während der Impuls läuft', quer <= 0, String(quer));
    await zu(p);
  }

  console.log('\n── 6 Kontrast an echten Bildpunkten ──');
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await oeffne(b, w, h);
    await p.waitForTimeout(900);
    for (const [was, sel] of [['Titel einer Zeile', '.heute-zeile .hz-txt b'], ['Unterzeile einer Zeile', '.heute-zeile .hz-txt i'],
                              ['Eintrag der Seitenleiste', '#side .tab:not(.active) span'], ['Überschrift einer Gruppe', '.heute-kopf .hk-wort']]) {
      const k = await kontrast(p, sel);
      if (k === null) { console.log('    (' + w + ' px: ' + was + ' nicht sichtbar)'); continue; }
      pruefe(w + ' px: ' + was + ' ' + k + ' : 1 (≥ 4,5)', k >= 4.5);
    }
    await zu(p);
  }

  console.log('\n── 7 Fenster, Suche und Anmeldung (Runde 179) ──');
  const fenster = (p, sel) => p.evaluate((sel) => {
    const el = [...document.querySelectorAll(sel)].find(e => e.getClientRects().length);
    if (!el) return null;
    const c = getComputedStyle(el);
    return { schein: /rgba\(\d+, \d+, \d+, 0\.45\)/.test(c.boxShadow), kante: /linear-gradient/.test(c.backgroundImage) };
  }, sel);
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await oeffne(b, w, h);
    await p.evaluate(() => document.getElementById('uAvatar').click()); await p.waitForTimeout(600);
    let f = await fenster(p, '#profileModal .pm-box');
    pruefe(w + ' px: Einstellungen mit Lichtkante und Schein', !!f && f.schein && f.kante, JSON.stringify(f));
    let k = await kontrast(p, '#profileModal label');
    if (k !== null) pruefe(w + ' px: Beschriftung im Fenster ' + k + ' : 1 (≥ 4,5)', k >= 4.5);
    await p.evaluate(() => document.getElementById('pmClose').click()); await p.waitForTimeout(300);
    await p.evaluate(() => document.getElementById('searchBtn').click()); await p.waitForTimeout(300);
    f = await fenster(p, '.search-box');
    pruefe(w + ' px: Suche mit Lichtkante und Schein', !!f && f.schein && f.kante, JSON.stringify(f));
    pruefe(w + ' px: keine Fehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await oeffne(b, w, h, { stub: 'stub-ohne-login.js', warte: '#authWrap' });
    await p.waitForTimeout(1500);
    const s = await p.evaluate(() => ({ formi: document.body.classList.contains('formi'), raum: getComputedStyle(document.getElementById('authWrap'), '::before').backgroundImage }));
    pruefe(w + ' px: Anmeldung im Stil Formi, mit dem Raum dahinter', s.formi && /radial-gradient/.test(s.raum), JSON.stringify(s).slice(0, 120));
    const f = await fenster(p, '.auth-card');
    pruefe(w + ' px: Anmeldekarte mit Lichtkante und Schein', !!f && f.schein && f.kante, JSON.stringify(f));
    for (const [was, sel] of [['Unterzeile', '.auth-sub'], ['Beschriftung', '#loginForm label']]) {
      const k = await kontrast(p, sel);
      if (k === null) { console.log('    (' + w + ' px: ' + was + ' nicht sichtbar)'); continue; }
      pruefe(w + ' px: Anmeldung, ' + was + ' ' + k + ' : 1 (≥ 4,5)', k >= 4.5);
    }
    const quer = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    pruefe(w + ' px: Anmeldung ohne Querlauf', quer <= 0, String(quer));
    await zu(p);
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Stil Formi: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Stil Formi: Voreinstellung, Übergang, Wahl, Bewegung, Kontrast — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
