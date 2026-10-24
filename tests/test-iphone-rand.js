/* ══ AM IPHONE: RAND UNTEN, BREITE MELDUNGEN, BLATTHÖHE (Runde 264) ══════
   Aus dem Betrieb, 24.10.2026: „die App läuft auf dem Handy sehr
   abgeschnitten und fehl geformt".

   Alle Durchläufe bis hierher liefen in Chromium — und Chromium meldet
   den Rand des iPhones (env(safe-area-inset-*)) nie: er ist dort 0.
   Am iPhone mit Home-Leiste sind es unten 34 px, oben 47–59 px. Dieser
   Durchlauf stellt den Rand nach (CDP Emulation.setSafeAreaInsetsOverride)
   und gibt sich als Safari am iPhone aus (dann ist auch die
   Chromium-Linse um Formi aus, wie am echten Gerät).

   Geprüft:
    1. Startseite: kein Bedienelement liegt unter der unteren Leiste —
       per Hit-Test in der unteren Hälfte jedes Elements (vorher lag die
       Schnellzugriff-Reihe zur Hälfte darunter: --main-unten kannte den
       Rand nicht).
    2. Jede Ansicht ganz nach unten gescrollt: das letzte Element steht
       über der Leiste.
    3. Eine lange Meldung (Toast) bleibt im Fenster und über der Leiste
       (vorher 454 px breit in einer Zeile, Anfang und Ende fehlten).
    4. Jede Höhe, die ein Fenster oder Blatt begrenzt, steht in dvh (oder
       vh mit dvh/svh daneben). In Safari ist 100vh die Höhe OHNE Adressleiste — ein Blatt
       mit 90vh ragte bei sichtbarer Leiste über den Rand. Chromium kennt
       den Unterschied im Test nicht, darum wird die Regel geprüft, nicht
       das Bild.
    5. Plan: „19.10. – 25.10." passt zwischen die Pfeile (320–480 px,
       Schrift normal und „Sehr gross").
    6. Ohne Rand (Rechner 1280 / 1440 / 1920, Handy in Safari ohne Rand)
       ändert sich am Platz unten nichts.

   Nicht geprüft und nicht prüfbar hier: Safari selbst. Ob die Adressleiste
   in iOS 26 den Rand unten meldet, sieht man nur am Gerät.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const CHROME = process.env.CHROME;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

let gut = 0, schlecht = 0;
function pruefe(name, ok, info) {
  if (ok) { gut++; console.log('  ✓ ' + name); }
  else { schlecht++; console.log('  ✗ ' + name + (info ? '  — ' + info : '')); }
}

async function oeffne(b, w, h, rand, opt) {
  opt = opt || {};
  const handy = w <= 820;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block',
    isMobile: handy, hasTouch: handy, userAgent: handy ? UA : undefined });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  if (rand) {
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: rand[0], bottom: rand[1], left: 0, right: 0 } });
  }
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((o) => {
    localStorage.setItem('kf_tour', '99:demo-ich');
    localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'formi', stil2: true, fs2: true, fs: o.fs || '100', dichte: o.dichte || 'normal' }));
  }, opt);
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  return { ctx, p };
}
const geheZu = (p, g) => p.evaluate((g) => {
  const k = [...document.querySelectorAll('.mobnav [data-group="' + g + '"], #side [data-group="' + g + '"]')].find(x => x.getClientRects().length);
  if (k) k.click();
}, g).then(() => p.waitForTimeout(700));

/* Was liegt unter der Leiste? Für jedes sichtbare Bedienelement der
   Ansicht: trifft ein Tipp auf seine untere Hälfte das Element selbst?
   Sprechblase, Hinweise und die Kugel sind keine Ansicht und werden
   vorher ausgeblendet — sie sollen hier nicht als Verdeckung zählen. */
const UNTER_LEISTE = () => {
  document.querySelectorAll('.formi-blase,.toast,.undobar').forEach(x => { x.style.visibility = 'hidden'; });
  const nav = document.getElementById('mobnav');
  const navOben = nav && nav.getClientRects().length ? nav.getBoundingClientRect().top : innerHeight;
  const sicht = document.querySelector('.view.show');
  const raus = [];
  if (!sicht) return { navOben, raus: ['keine Ansicht'] };
  sicht.querySelectorAll('button, a[href], input, select, textarea, [role="button"]').forEach(e => {
    if (!e.getClientRects().length) return;
    const st = getComputedStyle(e); if (st.visibility === 'hidden' || +st.opacity === 0) return;
    const r = e.getBoundingClientRect(); if (r.width < 8 || r.height < 8) return;
    /* Ausserhalb des Scroll-Bereichs (weiter unten in der Liste) zählt
       nicht: das erreicht man durch Scrollen. Gesucht ist, was im Bild
       steht und doch unter der Leiste liegt. */
    let a = e.parentElement, sb = null;
    while (a && a !== document.body) { const s2 = getComputedStyle(a); if (/(auto|scroll)/.test(s2.overflowY) && a.scrollHeight > a.clientHeight + 1) { sb = a; break; } a = a.parentElement; }
    const unten = sb ? Math.min(innerHeight, sb.getBoundingClientRect().bottom) : innerHeight;
    if (r.top >= unten || r.top >= navOben) return;
    if (r.bottom <= navOben + 1) return;
    const y = Math.min(r.bottom - 2, unten - 1);
    const t = document.elementFromPoint(r.left + r.width / 2, y);
    if (t && (t === e || e.contains(t))) return;
    if (t && nav && nav.contains(t)) raus.push((e.id || e.className || e.tagName).toString().slice(0, 30) + ' ' + Math.round(r.top) + '–' + Math.round(r.bottom) + ' (Leiste ab ' + Math.round(navOben) + ')');
  });
  return { navOben, raus };
};
/* Ganz nach unten scrollen und das letzte Element mit Inhalt suchen. */
const LETZTES = () => {
  const nav = document.getElementById('mobnav');
  const navOben = nav && nav.getClientRects().length ? nav.getBoundingClientRect().top : innerHeight;
  const s = document.querySelector('.view.show > .scroll-area');
  if (!s || s.scrollHeight <= s.clientHeight + 1) return { navOben, kein: true };
  s.scrollTop = s.scrollHeight;
  const kinder = [...s.querySelectorAll('*')].filter(e => e.getClientRects().length && e.children.length === 0 && (e.textContent.trim() || e.matches('button,input,select,textarea')));
  let tief = null, b2 = -1;
  kinder.forEach(e => { const r = e.getBoundingClientRect(); if (r.height > 2 && r.bottom > b2) { b2 = r.bottom; tief = e; } });
  return { navOben, unten: Math.round(b2), wer: tief ? (tief.textContent || tief.tagName).trim().slice(0, 30) : '' };
};

(async () => {
  const b = await chromium.launch(CHROME && fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
  try {
    const GERAETE = [['iPhone 15 Pro als App', 393, 852, [59, 34]], ['iPhone 14 als App', 390, 844, [47, 34]], ['iPhone 15 Pro Max als App', 430, 932, [59, 34]], ['iPhone SE', 375, 667, [20, 0]]];

    console.log('\n── 1. Startseite: nichts unter der Leiste ──');
    for (const [name, w, h, rand] of GERAETE) {
      for (const dichte of ['normal', 'kompakt']) {
        const { ctx, p } = await oeffne(b, w, h, rand, { dichte });
        await geheZu(p, 'g-start');
        const m = await p.evaluate(UNTER_LEISTE);
        const sab = await p.evaluate(() => getComputedStyle(document.querySelector('.main')).paddingBottom);
        pruefe(name + ' (' + w + ' × ' + h + ', Rand ' + rand.join('/') + ', ' + dichte + '): Startseite, nichts unter der Leiste (Platz unten ' + sab + ')', !m.raus.length, m.raus.slice(0, 4).join(' | '));
        if (p._fehler.length) pruefe(name + ': keine Seitenfehler', false, p._fehler.join(' | '));
        await ctx.close();
      }
    }

    console.log('\n── 2. Jede Ansicht ganz unten: das Letzte steht über der Leiste ──');
    for (const [name, w, h, rand] of GERAETE.slice(0, 2)) {
      const { ctx, p } = await oeffne(b, w, h, rand);
      for (const g of ['g-arbeit', 'g-zeit', 'g-team']) {
        await geheZu(p, g);
        const m = await p.evaluate(LETZTES);
        await p.waitForTimeout(150);
        if (m.kein) { console.log('  · ' + name + ' ' + g + ': passt ohne Scrollen'); continue; }
        pruefe(name + ' ' + g + ': letzte Zeile „' + m.wer + '" endet bei ' + m.unten + ', Leiste ab ' + Math.round(m.navOben), m.unten <= m.navOben + 1);
      }
      await ctx.close();
    }

    console.log('\n── 3. Lange Meldung bleibt im Fenster ──');
    for (const [name, w, h, rand] of [['iPhone SE', 320, 568, [20, 0]], ...GERAETE.slice(0, 2), ['Rechner', 1440, 900, null]]) {
      const { ctx, p } = await oeffne(b, w, h, rand);
      await geheZu(p, w <= 820 ? 'g-komm' : 'g-start');
      const m = await p.evaluate(async () => {
        /* toast() liegt nicht global; gebaut wird wie dort: kleiner Formi,
           Text, Klasse show. Geprüft wird die Gestalt, nicht der Aufruf. */
        const el = document.getElementById('toast');
        el.innerHTML = '<span class="formi-figur mini toast-formi" aria-hidden="true"></span><span class="toast-text"></span>';
        el.lastChild.textContent = 'Aufgaben-Erinnerung: 4 heute fällig · 2 morgen fällig · 1 überfällig seit gestern';
        el.classList.add('show');
        await new Promise(r => setTimeout(r, 700));
        const t = document.getElementById('toast'), r = t.getBoundingClientRect();
        const tx = t.querySelector('.toast-text');
        const nav = document.getElementById('mobnav');
        const navOben = nav && nav.getClientRects().length ? nav.getBoundingClientRect().top : innerHeight;
        return { l: Math.round(r.left), r: Math.round(r.right), u: Math.round(r.bottom), navOben: Math.round(navOben), vw: innerWidth,
          ganz: tx ? tx.scrollWidth <= tx.clientWidth + 1 : true };
      });
      pruefe(name + ' ' + w + ': Meldung ' + m.l + '–' + m.r + ' px im Fenster (' + m.vw + '), unten ' + m.u + ' über der Leiste (' + m.navOben + ')',
        m.l >= 0 && m.r <= m.vw && m.u <= m.navOben && m.ganz, JSON.stringify(m));
      await ctx.close();
    }

    console.log('\n── 4. Höhen in vh haben ein dvh daneben ──');
    {
      const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
      const css = (html.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
      const bloecke = css.match(/\{[^{}]*\}/g) || [];
      const ohne = [];
      let mitVh = 0;
      bloecke.forEach(k => {
        const props = k.slice(1, -1).split(';').map(x => x.trim()).filter(Boolean);
        props.forEach(pr => {
          const m = pr.match(/^((?:max-|min-)?height)\s*:\s*(.*\d+vh.*)$/);
          if (!m || /dvh|svh|lvh/.test(m[2])) return;
          mitVh++;
          /* dvh, oder svh (die kleine Höhe, mit Adressleiste) — beides
             richtet sich nach dem, was in Safari wirklich zu sehen ist. */
          const passt = ['dvh', 'svh'].some(e => { const gegen = m[2].replace(/(\d+)vh/g, '$1' + e);
            return props.some(q => q.replace(/\s+/g, '') === (m[1] + ':' + gegen).replace(/\s+/g, '')); });
          if (!passt) ohne.push(m[1] + ':' + m[2]);
        });
      });
      const mitDvh = (css.match(/height\s*:[^;}]*\d+dvh/g) || []).length;
      /* Gegenprobe: dass überhaupt Höhen in dvh gefunden werden — sonst
         misst der Zerleger am falschen Ort. */
      pruefe(mitDvh + ' Höhen in dvh, keine Höhe in vh ohne dvh/svh daneben (' + mitVh + ' mit Rückfall)', mitDvh >= 14 && !ohne.length, ohne.slice(0, 5).join(' | '));
    }

    console.log('\n── 5. Plan: die Woche passt zwischen die Pfeile ──');
    for (const fs2 of ['100', '125']) {
      for (const w of [360, 375, 390, 414, 430, 480]) {
        const { ctx, p } = await oeffne(b, w, 844, null, { fs: fs2 });
        await geheZu(p, 'g-team');
        const m = await p.evaluate(() => {
          const h = document.getElementById('shiftWeekLabel'), n = document.getElementById('shiftNext'), v = document.getElementById('shiftPrev');
          if (!h || !h.getClientRects().length) return null;
          const a = h.getBoundingClientRect(), c = n.getBoundingClientRect(), d = v.getBoundingClientRect();
          return { sw: h.scrollWidth, cw: h.clientWidth, links: Math.round(a.left - d.right), rechts: Math.round(c.left - a.right), text: h.textContent };
        });
        if (!m) { pruefe(w + ' (' + fs2 + ' %): Wochenkopf sichtbar', false); await ctx.close(); continue; }
        pruefe(w + ' px, Schrift ' + fs2 + ' %: „' + m.text + '" ganz zu sehen (' + m.sw + ' / ' + m.cw + ' px), Abstand zu den Pfeilen ' + m.links + ' / ' + m.rechts,
          m.sw <= m.cw + 1 && m.links >= 0 && m.rechts >= 0);
        await ctx.close();
      }
    }

    console.log('\n── 6. Ohne Rand ändert sich nichts ──');
    for (const [w, h] of [[390, 844], [1280, 800], [1440, 900], [1920, 1080]]) {
      const { ctx, p } = await oeffne(b, w, h, null);
      const m = await p.evaluate(() => { const n = document.getElementById('mobnav');
        return { pb: parseFloat(getComputedStyle(document.querySelector('.main')).paddingBottom),
          nav: !!(n && n.getClientRects().length), navH: n && n.getClientRects().length ? Math.round(n.getBoundingClientRect().height) : 0 }; });
      /* Vorher 72 px (ohne Kugel in der Reihe 146). Jetzt die gemessene
         Höhe der Leiste — ohne Rand 71 statt 72, also nicht weniger, als
         die Leiste braucht, und höchstens die alten 146. */
      pruefe(w + ' × ' + h + ' ohne Rand: ' + (w <= 820 ? 'Platz unten ' + m.pb + ' px, Leiste ' + m.navH + ' px' : 'keine untere Leiste'),
        w <= 820 ? (m.pb >= m.navH && m.pb <= 146) : !m.nav, JSON.stringify(m));
      await ctx.close();
    }
  } finally { await b.close(); }
  console.log('\n' + (schlecht ? '✗' : '✓') + ' iPhone-Rand: ' + gut + ' grün, ' + schlecht + ' falsch');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
