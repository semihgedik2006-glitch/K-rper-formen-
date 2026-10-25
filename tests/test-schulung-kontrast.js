/* ══════════════════════════════════════════════════════════════════════
   SCHULUNG: KONTRAST DER NEUEN TEILE IN ALLEN DREI STILEN (Runde 276)

   CLAUDE.md: „Kontrast ≥ 4,5 : 1, nachgemessen an echten Bildpunkten —
   das Rechenmodell allein ist bei Verläufen zu pessimistisch."
   In Runde 261 stand offen: „Das helle Design habe ich nicht gemessen."

   Gemessen wird je Element ein Bildschirmfoto: der Hintergrund ist die
   häufigste Farbe im Ausschnitt, die Schrift die Farbe mit dem grössten
   Abstand dazu. Text braucht ≥ 4,5 : 1, das Drucker-Zeichen als
   Bedienelement ≥ 3 : 1 (WCAG 1.4.11).
   Stile: formi (Voreinstellung), dark, light — je am Handy (390) und am
   Rechner (1440).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const zlib = require('zlib');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 240) : '')); }
}
/* Ein kleiner PNG-Leser (8 bit, RGB/RGBA, ohne Interlace) — genug für
   Playwrights Bildschirmfotos, ohne Paket. */
function png(buf) {
  let o = 8, w, h, ct; const idat = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), typ = buf.toString('ascii', o + 4, o + 8), d = buf.slice(o + 8, o + 8 + len);
    if (typ === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; }
    if (typ === 'IDAT') idat.push(d);
    o += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = ct === 6 ? 4 : 3, st = w * bpp, px = Buffer.alloc(h * st);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (st + 1)], z = raw.slice(y * (st + 1) + 1, (y + 1) * (st + 1));
    for (let x = 0; x < st; x++) {
      const a = x >= bpp ? px[y * st + x - bpp] : 0, b = y ? px[(y - 1) * st + x] : 0, c = (x >= bpp && y) ? px[(y - 1) * st + x - bpp] : 0;
      let v = z[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      px[y * st + x] = v & 255;
    }
  }
  return { w, h, bpp, px };
}
const lum = (r, g, b) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
function kontrast(buf) {
  const { w, h, bpp, px } = png(buf);
  const zahl = new Map();
  for (let i = 0; i < w * h; i++) { const k = (px[i * bpp] << 16) | (px[i * bpp + 1] << 8) | px[i * bpp + 2]; zahl.set(k, (zahl.get(k) || 0) + 1); }
  let bg = 0, n = -1; for (const [k, c] of zahl) if (c > n) { n = c; bg = k; }
  const lb = lum(bg >> 16, (bg >> 8) & 255, bg & 255);
  let best = 1;
  for (const k of zahl.keys()) {
    const l = lum(k >> 16, (k >> 8) & 255, k & 255);
    const r = (Math.max(l, lb) + 0.05) / (Math.min(l, lb) + 0.05);
    if (r > best) best = r;
  }
  return Math.round(best * 100) / 100;
}
async function oeffne(b, w, h, theme) {
  /* reducedMotion: sonst fällt nach „Geschafft" Konfetti über die
     Ausschnitte — ein buntes Stück über dem Text ergibt einen Kontrast,
     der mit der Schrift nichts zu tun hat (die Gegenprobe mass so 9,4). */
  const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((pr) => { try { localStorage.setItem('kf_tour', '99:demo-ich'); localStorage.setItem('kf_prefs', pr); } catch (e) {} },
    JSON.stringify({ theme, stil2: true }));
  await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  await p.evaluate(() => { window.print = function () {}; });
  await p.evaluate(async () => {
    const k = [...document.querySelectorAll('.mobnav [data-group="g-wissen"], #side [data-group="g-wissen"]')].find(e => e.offsetParent);
    if (k) { k.click(); return; }
    document.getElementById('bereichKopf').click();
    await new Promise(r => setTimeout(r, 450));
    const z = document.querySelector('#allesLadeInhalt .al-zeile[data-alles="schulung"]'); if (z) z.click();
  });
  await p.waitForTimeout(900);
  await p.evaluate(() => { const t = [...document.querySelectorAll('[data-subview]')].find(x => /Schulung/.test(x.textContent) && x.offsetParent); if (t) t.click(); });
  await p.waitForTimeout(1500);
  return p;
}
/* Ein Durchlauf „Hygiene": bei den Fragen in `daneben` zuerst eine
   falsche Antwort, dann die richtige. */
async function durchlauf(p, code, daneben) {
  await p.click('[data-schmodul="m-hygiene"]'); await p.waitForTimeout(500);
  await p.fill('#schCodeFeld', code); await p.click('#schStartBtn'); await p.waitForTimeout(1200);
  for (let i = 0; i < 30; i++) {
    const z = await p.evaluate(() => ({ ergebnis: document.getElementById('schErgebnis').style.display !== 'none',
      frage: !!document.querySelector('#schLauf [data-schantwort]:not([disabled])') }));
    if (z.ergebnis) break;
    if (z.frage) {
      await p.evaluate((daneben) => {
        const t = document.querySelector('#schLauf .sch-frage').textContent;
        const fr = window.SCHULUNGEN_BASIS.module.find(m => m.id === 'm-hygiene').fragen;
        const n = fr.findIndex(x => x.frage === t), f = fr[n];
        if (daneben.indexOf(n) >= 0 && !window['__dn' + n]) {
          window['__dn' + n] = 1;
          document.querySelector('#schLauf [data-schantwort="' + ((f.richtig + 1) % f.antworten.length) + '"]').click();
        } else document.querySelector('#schLauf [data-schantwort="' + f.richtig + '"]').click();
      }, daneben);
      await p.waitForTimeout(250);
      continue;
    }
    await p.evaluate(() => { const h = document.querySelector('#schHaken input'); if (h && !h.checked) h.click(); });
    /* Direkt ausgelöst: Playwright meldet den Knopf während der Feder-
       Bewegung als „nicht stabil". Getroffen wird er hier nicht geprüft. */
    for (let k = 0; k < 8; k++) { const ok = await p.evaluate(() => { const v = document.querySelector('#schAnimVor:not([disabled])'); if (v) v.click(); return !!v; }); if (!ok) break; await p.waitForTimeout(120); }
    await p.evaluate(() => { const w = document.getElementById('schWeiter'); if (w && !w.disabled) w.click(); });
    await p.waitForTimeout(350);
  }
  return p.evaluate(() => {
    const s = document.querySelector('#schErgebnis .sch-mitnehmen');
    return { fertig: document.getElementById('schErgebnis').style.display !== 'none',
      da: !!s, text: s ? s.innerText : '', zeilen: s ? [...s.querySelectorAll('li')].map(l => l.innerText) : [],
      ergebnis: document.getElementById('schErgebnis').innerText };
  });
}

async function miss(p, sel) {
  const el = await p.$(sel);
  if (!el) return null;
  await el.scrollIntoViewIfNeeded();
  await p.waitForTimeout(250);
  return kontrast(await el.screenshot());
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const theme of ['formi', 'dark', 'light']) {
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      console.log('\n── Stil ' + theme + ', ' + w + ' px ──');
      const p = await oeffne(b, w, h, theme);
      const stil = await p.evaluate(() => document.body.classList.contains('light') ? 'light' : 'dunkel');
      if (theme === 'light') pruefe('(Vorbereitung) der helle Stil ist wirklich an', stil === 'light', stil);
      const zeichen = await miss(p, '#schBescheinigung');
      pruefe('Drucker-Zeichen „Bescheinigung" ≥ 3 : 1 (' + zeichen + ')', zeichen >= 3, String(zeichen));
      const kopf = await miss(p, '#schMeineKarte .sch-meine-kopf h3');
      pruefe('Überschrift „Schon geschafft" ≥ 4,5 : 1 (' + kopf + ')', kopf >= 4.5, String(kopf));
      await durchlauf(p, 'D3MQ-7WKP-H2CX', [1]);
      for (const [sel, name] of [['.sch-mitnehmen h4', 'Titel „Das nimmst du mit"'], ['.sch-mitnehmen > .hint', 'Satz darunter'],
        ['.sch-mitnehmen li b', 'Frage'], ['.sch-mit-antwort', '„Richtig: …"'], ['.sch-mit-hinweis', 'Hinweis']]) {
        const k = await miss(p, '#schErgebnis ' + sel);
        pruefe(name + ' ≥ 4,5 : 1 (' + k + ')', k >= 4.5, String(k));
      }
      /* GEGENPROBE: misst die Messung überhaupt? Ein Hinweis in fast der
         Hintergrundfarbe muss durchfallen. */
      if (w === 1440) {
        await p.evaluate(() => { const e = document.querySelector('#schErgebnis .sch-mit-hinweis'); e.style.color = getComputedStyle(e.closest('li')).backgroundColor; e.style.opacity = '.85'; });
        const blass = await miss(p, '#schErgebnis .sch-mit-hinweis');
        pruefe('GEGENPROBE ein Hinweis in Hintergrundfarbe fällt durch (' + blass + ')', blass < 4.5, String(blass));
      }
      pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
      await p.close();
    }
  }
  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Schulung: Kontrast in allen drei Stilen — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
