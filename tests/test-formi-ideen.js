/* ══════════════════════════════════════════════════════════════════════
   FORMI: STEMPELN, ANMELDUNG, HELLER STIL, SCHULUNG (Runde 226)

   Aus dem Betrieb (23.10.2026), auf die fünf Ideen hin: „ja können wir
   alles umsetzen". Die Ideen 1, 3, 4 und 5 werden hier geprüft (Idee 2,
   die Scheibe zeigt den Tag, steht in test-formi-physik).

   Geprüft wird:
    1. Stempeln: Formi grüsst beim Kommen (Blase, Gefühl), ruht in der
       Pause (Klasse fk-pause, nur Deckkraft/transform), beim Feierabend
       fliegt die Zeit ins Loch, endet am Horizont, und danach steht die
       Zeit in der Blase. Aufgerufen werden die Formi-Funktionen selbst:
       der echte Stempelweg läuft über eine Cloud-Funktion, die es in
       dieser Umgebung nicht gibt.
    2. Anmeldung (Attrappe ohne Anmeldung): Formi steht statt des Logos
       da, im Bild, ohne Querlauf; beim Passwort zu, mit „Passwort
       anzeigen" linst es, bei der E-Mail auf; bei einer Fehlermeldung
       erschrickt es. Anmelden-Knopf und Augen-Knopf ≥ 44 × 44 per
       Hit-Test, 320 … 1920 px, normal und kompakt. Der echte Anmeldeweg
       (Firebase) ist hier NICHT prüfbar.
    3. Heller Stil: der Kern ist hell (weisses Loch), das Gesicht dunkel,
       Kontrast an echten Bildpunkten ≥ 4,5 : 1; die Scheibe steht sich
       vom hellen Grund ab (≥ 3 : 1, Grafik); im dunklen Stil bleibt das
       Loch schwarz.
    4. Schulung (Demo, Code D3MQ-7WKP-H2CX): nach einer falschen Antwort
       steht Formi im Hinweis und grübelt (?), der Hinweis erklärt
       weiter; am Ende steht Formi über dem Ergebnis – bestanden stolz
       mit Konfetti, nicht bestanden ohne Träne und ohne Konfetti; das
       Statusabzeichen bleibt.
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
const TREFFER = (el) => {
  if (!el || !el.getClientRects().length) return { w: 0, h: 0, imBild: false };
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0, imBild: false, verdeckt: true };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--;
  while (u < innerHeight - 1 && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--;
  while (re < innerWidth - 1 && trifft(re + 1, cy)) re++;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1),
    imBild: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight };
};
const BREITEN = [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]];

async function oeffne(b, w, h, opt) {
  opt = opt || {};
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  if (opt.prefs) await p.addInitScript((v) => { localStorage.setItem('kf_prefs', v); }, opt.prefs);
  if (opt.demo) {
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
    await p.goto(APP + '?demo=' + opt.demo, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
  } else {
    await p.addInitScript({ path: SP + '/' + (opt.stub || 'stub-chef.js') });
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    if (opt.stub === 'stub-ohne-login.js') await p.waitForTimeout(2200);
    else { await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 }); await p.waitForTimeout(900); }
  }
  p._ctx = ctx;
  return p;
}
const zu = (p) => p._ctx.close();
/* Bildpunkte eines Ausschnitts als Helligkeiten (relative Luminanz). */
async function helligkeiten(p, clip) {
  const bild = await p.screenshot({ clip });
  return p.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    const L = []; for (let i = 0; i < d.length; i += 4) L.push(.2126 * f(d[i]) + .7152 * f(d[i + 1]) + .0722 * f(d[i + 2]));
    return L.sort((a, b) => a - b);
  }, bild.toString('base64'));
}
const verh = (a, b) => Math.round(((Math.max(a, b) + .05) / (Math.min(a, b) + .05)) * 100) / 100;
/* Was an einer Figur gerade an Web Animations läuft (ohne die Dauerläufe
   der Scheibe). */
const LAEUFT_AN = (sel) => {
  const f = document.querySelector(sel); if (!f) return -1;
  return document.getAnimations().filter(a => a.effect && a.effect.target && f.contains(a.effect.target) &&
    !/formiScheibe|formiBahn|formiDoppler/.test(a.animationName || '')).length;
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── 1 Stempeln ──');
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const p = await oeffne(b, w, h);
      await p.evaluate(() => window.__formiLebt.stempelt('kommen'));
      await p.waitForTimeout(150);
      const k = await p.evaluate((L) => ({ blase: (document.getElementById('formiBlase') || {}).textContent || '',
        laeuft: eval('(' + L + ')')('#formiKugel') }), LAEUFT_AN.toString());
      pruefe(w + ' px: Kommen – Formi freut sich und sagt etwas', k.laeuft > 0 && k.blase.trim().length > 3, JSON.stringify(k));
      await p.evaluate(() => window.__formiLebt.pause(true));
      const pa = await p.evaluate(() => {
        const k = document.getElementById('formiKugel'), s = k.querySelector('.fk-scheibe');
        return { klasse: k.classList.contains('fk-pause'), deck: +getComputedStyle(s).opacity };
      });
      pruefe(w + ' px: Pause – die Scheibe ruht (halbe Deckkraft)', pa.klasse && Math.abs(pa.deck - .5) < .01, JSON.stringify(pa));
      await p.evaluate(() => window.__formiLebt.pause(false));
      /* Feierabend: die Zeit fliegt aus einem Feld ins Loch. */
      await p.evaluate(() => {
        const f = document.createElement('div'); f.id = 'testFeld'; f.textContent = '7:42 h';
        f.style.cssText = 'position:fixed;left:40px;top:120px;width:120px;height:40px';
        document.body.appendChild(f);
        window.__fz = { r: [] };
        const k = document.getElementById('formiKugel').getBoundingClientRect();
        window.__fz.k = { x: k.left + k.width / 2, y: k.top + k.height / 2, rH: k.width * .26 };
        window.__formiLebt.feierabend('#testFeld', '7:42 h');
      });
      await p.waitForTimeout(120);
      const flug = await p.evaluate(() => {
        const box = document.querySelector('.formi-flug'); if (!box) return null;
        const en = [...box.children].map(el => {
          const a = el.getAnimations().find(x => x.effect && x.effect.getKeyframes().length > 5);
          if (!a) return null;
          const kf = a.effect.getKeyframes(), l = kf[kf.length - 1];
          const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(l.transform || '');
          return m ? { x: +m[1], y: +m[2], o: +l.opacity } : null;
        });
        return { n: box.children.length, en };
      });
      const kz = await p.evaluate(() => window.__fz.k);
      const amRand = flug && flug.en.every(e => e && e.o === 0 &&
        Math.abs(Math.hypot(e.x + 5 - kz.x, e.y + 10 - kz.y) - kz.rH) < 12);
      pruefe(w + ' px: Feierabend – „7:42 h" fliegt in 6 Zeichen ins Loch und erlischt am Horizont', flug && flug.n === 6 && amRand,
        JSON.stringify(flug && flug.en.slice(0, 2)) + ' / ' + JSON.stringify(kz));
      await p.waitForTimeout(2300);
      const nach = await p.evaluate(() => ({ weg: !document.querySelector('.formi-flug'), blase: (document.getElementById('formiBlase') || {}).textContent || '' }));
      pruefe(w + ' px: … danach liegt nichts herum, und die Zeit steht in der Blase', nach.weg && /Feierabend! Heute 7:42 h/.test(nach.blase), JSON.stringify(nach));
      pruefe(w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
      await zu(p);
    }

    console.log('\n── 2 Anmeldung ──');
    for (const [w, h] of BREITEN) {
      const p = await oeffne(b, w, h, { stub: 'stub-ohne-login.js' });
      for (const dichte of ['normal', 'kompakt']) {
        await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
        await p.waitForTimeout(60);
        const m = await p.evaluate((T) => {
          const t = eval('(' + T + ')'), f = document.getElementById('authFormi');
          const r = f.getBoundingClientRect(), s = f.querySelector('.fk-flach').getBoundingClientRect();
          const knopf = document.querySelector('#authWrap .btn-primary:not([style*="none"])') ||
            [...document.querySelectorAll('#authWrap button')].find(x => /Anmelden/.test(x.textContent) && x.getClientRects().length && !x.classList.contains('auth-tab'));
          const auge = document.querySelector('.pw-auge[data-pw="lgPw"]');
          return { fig: Math.round(r.width), imBild: r.top >= 0 && s.left >= 0 && s.right <= innerWidth,
            quer: document.documentElement.scrollWidth - innerWidth, knopf: t(knopf), auge: t(auge),
            sichtbar: getComputedStyle(document.getElementById('authWrap')).display !== 'none' };
        }, TREFFER.toString());
        pruefe(`${w} px ${dichte}: Formi statt Logo (${m.fig} px), im Bild, kein Querlauf; Anmelden ${m.knopf.w}×${m.knopf.h}, Auge ${m.auge.w}×${m.auge.h}`,
          m.sichtbar && m.fig >= 60 && m.imBild && m.quer <= 0 && m.knopf.w >= 44 && m.knopf.h >= 44 && m.auge.w >= 44 && m.auge.h >= 44, JSON.stringify(m));
      }
      if (w === 390 || w === 1440) {
        await p.focus('#lgPw'); await p.waitForTimeout(250);
        const z1 = await p.evaluate(() => window.__formiAnmeldung.zustand().zu);
        await p.click('.pw-auge[data-pw="lgPw"]'); await p.focus('#lgPw'); await p.waitForTimeout(250);
        const z2 = await p.evaluate(() => window.__formiAnmeldung.zustand().zu);
        await p.focus('#lgEmail'); await p.keyboard.type('anna@'); await p.waitForTimeout(250);
        const z3 = await p.evaluate(() => ({ zu: window.__formiAnmeldung.zustand().zu,
          blick: document.querySelector('#authFormi .fk-auge b').getAnimations().length }));
        pruefe(w + ' px: Passwort → Augen zu, „anzeigen" → linst, E-Mail → auf und schaut mit', z1 === 'zu' && z2 === 'linst' && z3.zu === null && z3.blick > 0,
          JSON.stringify([z1, z2, z3]));
        await p.evaluate(() => { document.getElementById('loginErr').textContent = 'E-Mail oder Passwort stimmt nicht.'; });
        await p.waitForTimeout(80);
        const er = await p.evaluate((L) => eval('(' + L + ')')('#authFormi'), LAEUFT_AN.toString());
        pruefe(w + ' px: bei einer Fehlermeldung erschrickt Formi', er > 0, String(er));
        pruefe(w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
      }
      await zu(p);
    }

    console.log('\n── 3 Heller Stil: das weisse Loch ──');
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const p = await oeffne(b, w, h, { prefs: JSON.stringify({ theme: 'light' }) });
      const r = await p.evaluate(() => {
        const k = document.getElementById('formiKugel');
        const q = k.querySelector('.fk-pupille').getBoundingClientRect(), s = k.querySelector('.fk-scheibe.vorn .fk-flach').getBoundingClientRect();
        return { hell: document.body.classList.contains('light'), q: { x: q.left, y: q.top, w: q.width, h: q.height },
          s: { x: s.left, y: s.top, w: s.width, h: s.height }, k: k.getBoundingClientRect().left };
      });
      await p.evaluate(() => window.__formiLebt && window.__formiLebt.uhrenAus && window.__formiLebt.uhrenAus());
      await p.waitForTimeout(300);
      const L = await helligkeiten(p, { x: Math.floor(r.q.x + 2), y: Math.floor(r.q.y + 2), width: Math.floor(r.q.w - 4), height: Math.floor(r.q.h - 4) });
      const kern = L[Math.floor(L.length / 2)], gesicht = L[0];
      pruefe(w + ' px: der Kern ist hell (weisses Loch)', r.hell && kern > .7, 'Luminanz ' + kern.toFixed(2));
      pruefe(w + ' px: Gesicht gegen Kern ' + verh(kern, gesicht) + ' : 1 (≥ 4,5)', verh(kern, gesicht) >= 4.5);
      /* Die Scheibe links neben der Kugel: ihr kräftigster Punkt gegen
         den Grund in diesem Ausschnitt. Über die ganze Höhe: die Scheibe
         ist um 9° gekippt, links liegt ihr Band tiefer als in der Mitte
         (ein schmaler Streifen in der Mitte verfehlte es am Handy). */
      const breit = Math.max(4, Math.floor(r.k - r.s.x - 2));
      const S = await helligkeiten(p, { x: Math.floor(r.s.x), y: Math.floor(r.s.y), width: breit, height: Math.max(4, Math.floor(r.s.h)) });
      const grund = S[S.length - 1], scheibe = S[0];
      pruefe(w + ' px: die Scheibe steht sich vom hellen Grund ab, ' + verh(grund, scheibe) + ' : 1 (≥ 3, Grafik)', verh(grund, scheibe) >= 3);
      await zu(p);
    }
    {
      const p = await oeffne(b, 1440, 900);
      const bg = await p.evaluate(() => getComputedStyle(document.querySelector('#formiKugel .fk-pupille')).backgroundColor);
      pruefe('im dunklen Stil bleibt das Loch schwarz', bg === 'rgb(2, 4, 10)', bg);
      await zu(p);
    }

    console.log('\n── 4 Schulung ──');
    for (const [w, h, falsch] of [[1440, 900, false], [390, 844, true]]) {
      const p = await oeffne(b, w, h, { demo: 'mitarbeiter' });
      await p.evaluate(() => { const k = document.querySelector('.mobnav [data-group="g-wissen"]') || document.querySelector('#side [data-group="g-wissen"]'); /* Runde 245: Mitarbeiter haben „Wissen“ nicht mehr – über „Alles“. */ if (k) k.click(); else { document.getElementById('bereichKopf').click(); document.querySelector('#allesLade [data-alles="schulung"]').click(); } });
      await p.waitForTimeout(700);
      await p.evaluate(() => { const t = [...document.querySelectorAll('[data-subview]')].find(x => /Schulung/.test(x.textContent)); if (t) t.click(); });
      await p.waitForTimeout(1600);
      await p.click('[data-schfaellig="m-beratung"]'); await p.waitForTimeout(700);
      await p.fill('#schCodeFeld', 'D3MQ-7WKP-H2CX'); await p.click('#schStartBtn'); await p.waitForTimeout(1400);
      const richtig = () => p.evaluate(() => {
        const t = document.querySelector('#schLauf .sch-frage').textContent;
        return window.SCHULUNGEN_BASIS.module.find(m => m.id === 'm-beratung').fragen.find(x => x.frage === t).richtig;
      });
      const r0 = await richtig();
      await p.evaluate((i) => document.querySelector('[data-schantwort="' + i + '"]').click(), r0 === 0 ? 1 : 0);
      await p.waitForTimeout(120);
      const hw = await p.evaluate((L) => {
        const h = document.querySelector('#schLauf .sch-hinweis'), f = h && h.querySelector('.formi-figur');
        const fr = f && f.getBoundingClientRect(), hr = h && h.getBoundingClientRect();
        return { da: !!f, text: h ? h.querySelector('p').textContent : '', laeuft: eval('(' + L + ')')('#schLauf .sch-hinweis .formi-figur'),
          frage: !!(f && f.querySelector('.fk-zeichen.frage')), versteckt: f && f.getAttribute('aria-hidden') === 'true',
          drin: f && fr.left >= hr.left && fr.right <= hr.right && fr.top >= hr.top - 1, quer: document.documentElement.scrollWidth - innerWidth };
      }, LAEUFT_AN.toString());
      pruefe(w + ' px: falsch → Formi steht im Hinweis und grübelt (?)', hw.da && hw.laeuft > 0 && hw.frage && hw.versteckt, JSON.stringify(hw));
      pruefe(w + ' px: … der Hinweis erklärt weiter, „Formi denkt mit:" davor', /^Formi denkt mit: .{25,}/.test(hw.text), hw.text.slice(0, 60));
      pruefe(w + ' px: … Formi liegt im Hinweis, kein Querlauf', hw.drin && hw.quer <= 0, JSON.stringify(hw));
      for (let i = 0; i < 300; i++) {
        const z = await p.evaluate(() => ({ ergebnis: getComputedStyle(document.getElementById('schErgebnis')).display !== 'none',
          frage: !!document.querySelector('#schLauf .sch-frage'), offen: !!document.querySelector('[data-schantwort]:not([disabled])') }));
        if (z.ergebnis) break;
        if (z.frage && z.offen) { const rr = await richtig(); await p.evaluate((i) => document.querySelector('[data-schantwort="' + i + '"]').click(), falsch ? (rr === 0 ? 1 : 0) : rr); await p.waitForTimeout(80); }
        await p.evaluate(() => { const h = document.querySelector('#schHaken input'); if (h && !h.checked) h.click(); });
        await p.waitForTimeout(60);
        await p.evaluate(() => { const w = document.getElementById('schWeiter'); if (w && !w.disabled) w.click(); });
        await p.waitForTimeout(120);
      }
      await p.waitForTimeout(500);
      const e = await p.evaluate((L) => {
        const f = document.querySelector('#schErgebnis .sch-erg-formi .formi-figur');
        return { titel: (document.querySelector('.sch-fertig h3') || {}).textContent || '', fig: !!f,
          laeuft: eval('(' + L + ')')('#schErgebnis .sch-erg-formi .formi-figur'),
          konfetti: document.querySelectorAll('.confetti').length, traene: !!(f && f.querySelector('.fk-zeichen.traene')),
          abzeichen: !!document.querySelector('.sch-erg-formi .sch-kranz .sym'), offen: !!document.querySelector('.sch-erg-formi .sch-kranz.offen'),
          quer: document.documentElement.scrollWidth - innerWidth };
      }, LAEUFT_AN.toString());
      if (!falsch) pruefe(w + ' px: bestanden → Formi stolz über dem Ergebnis, Konfetti, Abzeichen bleibt', /Geschafft/.test(e.titel) && e.fig && e.laeuft > 0 && e.konfetti > 0 && e.abzeichen && !e.offen, JSON.stringify(e));
      else pruefe(w + ' px: nicht bestanden → Formi guckt mit, ohne Träne, ohne Konfetti, Abzeichen „offen"', /Noch nicht ganz/.test(e.titel) && e.fig && e.laeuft > 0 && !e.traene && e.konfetti === 0 && e.offen, JSON.stringify(e));
      pruefe(w + ' px: kein Querlauf, ohne Skriptfehler', e.quer <= 0 && !p._fehler.length, p._fehler.join(' | '));
      await zu(p);
    }
  } catch (e) {
    schlecht++; console.log('  ✗ Abbruch: ' + (e && e.stack || e));
  } finally {
    await b.close();
  }
  console.log('\n' + (schlecht ? '✗ Formi-Ideen: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen rot' : '✓ Formi-Ideen: ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})();
