/* ══ GRUPPEN UND TITEL WIE BEI APPLE (Runde 241) ═════════════════════
   Aus dem Betrieb, 23.10.2026, zu den Probebildern „Studio Chat wie von
   Apple“: „ja das sieht sehr super aus genau so hab ichs mir
   vorgestellt“ — und nach der Schrift-Runde: „sieht super aus kannst
   weiter machen“. Vorher entschieden: „Apple-Grundgerüst, Formi als
   Akzent“.

   Geprüft wird, in den Stilen Formi, Dunkel und Hell, am Handy (390)
   und am Rechner (1440):
    1. Abschnittsmarken sind Titel: keine Versalien mehr in den Titeln
       der Startseite, in Abschnittsköpfen, in den Gruppen der Aufgaben,
       der Seitenleiste, der Kanäle und der Verwaltung.
    2. Der Titel der Startseite ist gross (≥ 18 px), die Zahl steht
       leiser daneben und stimmt mit dem Block überein.
    3. Jeder Abschnitt der Startseite ist EINE Gruppe: die Zeilen
       stossen ohne Lücke aneinander, tragen keinen eigenen Schatten,
       die Gruppe ist gerundet.
    4. Die Trennlinie zwischen zwei Zeilen beginnt beim Text, nicht am
       Rand (wie in Einstellungen).
    5. Statusfarben bleiben, wo sie etwas melden: das Zeichen einer
       überfälligen Zeile ist rot, ihre Unterzeile auch — die einer
       gewöhnlichen nicht. GEGENPROBE: die Fläche der überfälligen Zeile
       ist nicht rot getönt.
    6. Kontrast der Titel, der Zahl und von „Alle N“ an echten
       Bildpunkten ≥ 4,5 : 1.
    7. „Alle N“ trifft auch nach dem Umbau ≥ 44 × 44 (elementFromPoint),
       in normal und kompakt.
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
function lum(c) { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); }
function kontrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
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

async function oeffne(b, w, h, theme) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript((pr) => {
    try { localStorage.setItem('kf_tour', '1:testuid'); localStorage.setItem('kf_prefs', pr); } catch (e) {}
  }, JSON.stringify({ theme, stil2: true }));
  await p.addInitScript({ path: SP + '/stub-chef.js' });
  await p.goto(APP + '?neu=1', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(1200);
  p._ctx = ctx;
  return p;
}

/* Kontrast an echten Bildpunkten: Textfarbe gegen den Grund direkt über
   und unter dem Textkasten (dort steht kein Text, aber dieselbe Fläche). */
async function bildKontrast(p, sel) {
  const k = await p.evaluate((s) => {
    const e = [...document.querySelectorAll(s)].find(x => x.getClientRects().length);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: Math.max(0, r.left), y: Math.max(0, r.top - 3), w: Math.max(4, r.width), h: r.height + 6, farbe: getComputedStyle(e).color };
  }, sel);
  if (!k) return null;
  const bild = await p.screenshot({ clip: { x: k.x, y: k.y, width: k.w, height: k.h } });
  const proben = await p.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    const out = [];
    for (const fy of [0, c.height - 1]) for (const fx of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const i = (fy * c.width + Math.round((c.width - 1) * fx)) * 4;
      out.push([d[i], d[i + 1], d[i + 2]]);
    }
    return out;
  }, bild.toString('base64'));
  const text = k.farbe.match(/[\d.]+/g).slice(0, 3).map(Number);
  /* Der Median der Proben: ein einzelner Funkelpunkt im Hintergrund soll
     die Messung nicht kippen, eine dunkle Fläche aber schon. */
  const werte = proben.map(w => kontrast(w, text)).sort((a, b) => a - b);
  return werte[Math.floor(werte.length / 2)];
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  for (const theme of ['formi', 'dark', 'light']) {
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      console.log('\n── Stil ' + theme + ', ' + w + ' px ──');
      const p = await oeffne(b, w, h, theme);
      const m = await p.evaluate(() => {
        const sicht = (e) => e.getClientRects().length > 0;
        const koepfe = [...document.querySelectorAll('#heuteListe .heute-kopf')].filter(sicht);
        const wort = koepfe.map(k => k.querySelector('.hk-wort'));
        const gross = wort.map(x => parseFloat(getComputedStyle(x).fontSize));
        const zahlen = [...document.querySelectorAll('#heuteListe .heute-block')].filter(sicht).map(bl => {
          const z = bl.querySelector('.hk-zahl');
          return { soll: +bl.getAttribute('data-bzahl'), ist: z ? +z.textContent.trim() : null,
                   leiser: z ? getComputedStyle(z).color !== getComputedStyle(bl.querySelector('.hk-wort')).color : null };
        });
        const gruppen = [...document.querySelectorAll('#heuteListe .heute-liste')].filter(sicht).map(g => {
          /* Ein Glied ist eine Zeile oder eine Zeile mit Haken davor
             (.hz-mit-haken, „Auf Heute direkt abhaken“). */
          const z = [...g.children];
          const luecken = z.slice(1).map((x, i) => Math.round(x.getBoundingClientRect().top - z[i].getBoundingClientRect().bottom));
          const schatten = [...g.querySelectorAll('.heute-zeile')].map(x => getComputedStyle(x).boxShadow);
          const linie = z[1] ? (() => {
            const s = getComputedStyle(z[1], '::before');
            return { da: s.content !== 'none' && s.height === '1px', links: parseFloat(s.left) };
          })() : null;
          return { zeilen: z.length, luecken, schatten: schatten.filter(x => x !== 'none').length,
                   rund: parseFloat(getComputedStyle(g).borderTopLeftRadius), linie };
        });
        const dr = document.querySelector('#heuteListe .heute-zeile.dringend');
        const gew = [...document.querySelectorAll('#heuteListe .heute-zeile')].find(x => !x.classList.contains('dringend') && !x.classList.contains('tagesband'));
        const rot = getComputedStyle(document.body).getPropertyValue('--danger').trim();
        const status = dr && gew ? {
          zeichen: getComputedStyle(dr.querySelector('.hz-ikon')).color,
          unterDr: getComputedStyle(dr.querySelector('.hz-txt i')).color,
          unterGew: getComputedStyle(gew.querySelector('.hz-txt i')).color,
          flaeche: getComputedStyle(dr).backgroundImage + ' ' + getComputedStyle(dr).backgroundColor,
          rot
        } : null;
        /* Versalien in Abschnittsmarken, wo immer sie gerade im Bild sind. */
        const MARKEN = '.heute-kopf, .heute-kopf .hk-wort, .sec-head span, .pg-kopf h4, .ss-kopf, .ks-gruppe, .ch-gruppe, .hr-wort, .hilfe-ueber';
        const versal = [...document.querySelectorAll(MARKEN)].filter(sicht)
          .filter(e => getComputedStyle(e).textTransform === 'uppercase').map(e => e.className + ' „' + e.textContent.trim().slice(0, 20) + '“');
        return { koepfe: koepfe.length, gross, zahlen, gruppen, status, versal };
      });
      pruefe('Titel ohne Versalien (' + m.koepfe + ' Titel auf der Startseite)', m.koepfe >= 2 && !m.versal.length, m.versal.join(', '));
      pruefe('Titel gross: jeder ≥ 18 px (' + m.gross.join(' / ') + ')', m.gross.length && m.gross.every(x => x >= 18));
      const mitZahl = m.zahlen.filter(z => z.soll > 1);
      pruefe('Zahl leise neben dem Titel und gleich der Blockzahl (' + mitZahl.length + ' Blöcke)',
        mitZahl.length && mitZahl.every(z => z.ist === z.soll && z.leiser), JSON.stringify(m.zahlen));
      const mehr = m.gruppen.filter(g => g.zeilen >= 2);
      pruefe('jeder Abschnitt ist eine Gruppe: Zeilen ohne Lücke, ohne eigenen Schatten, gerundet (' + m.gruppen.length + ' Gruppen, ' + mehr.length + ' mit mehreren Zeilen)',
        m.gruppen.length >= 2 && m.gruppen.every(g => g.schatten === 0 && g.rund >= 12 && g.luecken.every(l => Math.abs(l) <= 1)), JSON.stringify(m.gruppen));
      if (mehr.length) pruefe('Trennlinie beginnt beim Text (≥ 40 px vom Rand)', mehr.every(g => g.linie && g.linie.da && g.linie.links >= 40), JSON.stringify(mehr.map(g => g.linie)));
      else pruefe('mindestens eine Gruppe mit mehreren Zeilen zum Prüfen der Trennlinie', w <= 820, 'keine bei ' + w + ' px');
      if (m.status) {
        pruefe('überfällig: Zeichen und Unterzeile in der Statusfarbe, gewöhnliche Unterzeile nicht',
          m.status.unterDr !== m.status.unterGew && m.status.zeichen !== m.status.unterGew, JSON.stringify(m.status));
        pruefe('GEGENPROBE: die Fläche der überfälligen Zeile ist nicht getönt',
          /none/.test(m.status.flaeche) && /rgba\(0, 0, 0, 0\)|transparent/.test(m.status.flaeche), m.status.flaeche);
      } else pruefe('eine überfällige und eine gewöhnliche Zeile sind zum Vergleich da', false);

      for (const [was, sel] of [['Titel', '#heuteListe .hk-wort'], ['Zahl', '#heuteListe .hk-zahl'], ['„Alle N“', '#heuteListe .heute-kopf .mini-link']]) {
        const k = await bildKontrast(p, sel);
        if (k === null) { pruefe(was + ' ist im Bild', false); continue; }
        pruefe(was + ': Kontrast an Bildpunkten ' + k.toFixed(1) + ' : 1 (≥ 4,5)', k >= 4.5);
      }
      for (const dichte of ['normal', 'kompakt']) {
        const r = await p.evaluate(async ([SRC, d]) => {
          const T = eval('(' + SRC + ')');
          document.body.dataset.dichte = d;
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          return [...document.querySelectorAll('#heuteListe .heute-kopf .mini-link')].filter(e => e.getClientRects().length)
            .map(e => ({ t: e.textContent.trim(), m: T(e) }));
        }, [TREFFER.toString(), dichte]);
        pruefe('„Alle N“ in ' + dichte + ' ≥ 44 × 44 (' + r.length + ' gemessen)', r.length && r.every(x => x.m.w >= 44 && x.m.h >= 44), JSON.stringify(r));
      }
      pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
  }

  /* Die anderen Seiten: Abschnittsköpfe in Aufgaben, Kanälen und
     Verwaltung tragen keine Versalien mehr. */
  console.log('\n── Andere Seiten, 1440 px ──');
  {
    const p = await oeffne(b, 1440, 900, 'formi');
    for (const g of ['g-arbeit', 'g-komm', 'g-chef']) {
      await p.evaluate((g) => { const e = [...document.querySelectorAll('#side [data-group="' + g + '"]')].find(x => x.getClientRects().length); if (e) e.click(); }, g);
      await p.waitForTimeout(1000);
      const r = await p.evaluate(() => {
        const MARKEN = '.sec-head span, .pg-kopf h4, .ss-kopf, .ks-gruppe, .ch-gruppe, .chef-tab-gruppe';
        const alle = [...document.querySelectorAll(MARKEN)].filter(e => e.getClientRects().length);
        return { zahl: alle.length, versal: alle.filter(e => getComputedStyle(e).textTransform === 'uppercase').map(e => e.textContent.trim().slice(0, 20)) };
      });
      pruefe(g + ': keine Versalien in ' + r.zahl + ' Abschnittsmarken', r.zahl >= 1 && !r.versal.length, r.versal.join(', '));
    }
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Gruppen und Titel: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Gruppen und Titel: Titel statt Versalien, eine Gruppe je Abschnitt, Status bleibt — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
