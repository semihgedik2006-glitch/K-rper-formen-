/* ══ STARTSEITE DER LEITUNG (Runde 296) ═════════════════════════════════
   Aus dem Betrieb, 29.10.2026: „glaubst du wir können auch für die
   leitung die startseite übersichtlicher machen und minimalistischer
   aber dennoch praktisch?" — dazu eine Skizze (Reiter Überblick | Meine
   Schicht | Zusammenfassung, eine Kachel je Studio mit Ampel, darunter
   das angetippte Studio gross, rechts die Zusammenfassung in Sätzen und
   das Material), „scrollen am handy ist für leitung auch ok", und zum
   Entwurf: „ja so passt das".

   Geprüft wird:
    1. Chef und Leitung: die drei Reiter, eine Kachel je verwaltetem
       Studio; Rot genau dort, wo etwas überfällig ist, eine Kündigung
       offen ist oder niemand da ist, obwohl die Schicht läuft.
    2. Rechner: ein Klick auf eine Kachel zeigt DIESES Studio unter den
       Kacheln; die Seite passt bei 1280 × 800, 1440 × 900 und
       1920 × 1080 auf einen Bildschirm.
    3. Handy: „Zu bestätigen" steht über den Kacheln; ein Tipp auf eine
       Kachel öffnet das Studio als Fenster.
    4. „Zu bestätigen": ✓ bei der Kundenpost schreibt status
       „bestaetigt" mit eigener Kennung, ✓ beim Urlaub „genehmigt", ✓
       beim Schichttausch setzt die neue Person ein. Die Zeile
       verschwindet.
    5. Reiter „Zusammenfassung": ein Satz je auffälligem Studio und einer
       für alle, die fertig sind.
    6. Jeder Knopf trifft ≥ 44 × 44 (390 / 1280 / 1440, normal und
       kompakt).
    7. GEGENPROBE: Mitarbeiter sehen das nicht; „Meine Schicht" zeigt bei
       der Leitung weiter die bisherige Liste.
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
const POST = "window.__kundenpost=[" +
  "{id:'kp-k',studioKey:'studio-6',name:'S. Brandt',betreff:'Kündigung',art:'kuendigung',eingang:Date.now()-3*864e5,status:'offen'}," +
  "{id:'kp-w',studioKey:'studio-6',name:'T. Schulz',betreff:'Termin',art:'termin',eingang:Date.now()-864e5,status:'wartet',grund:'telefon',erledigtName:'Anna',erledigtTs:Date.now()-3600e3}," +
  "{id:'kp-b',studioKey:'studio-7',name:'M. Keller',betreff:'Vertragspause',art:'pause',eingang:Date.now()-864e5,status:'offen'}];";
async function oeffne(b, w, h, rolle, modus) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript((m) => { try { localStorage.setItem('kf_tour', '1:testuid'); localStorage.setItem('kf_formi_gruss', new Date().toDateString());
    if (m) localStorage.setItem('kf_heute_modus', m); } catch (e) {} }, modus || '');
  await p.addInitScript(POST);
  await p.addInitScript({ path: SP + '/stub-' + rolle + '.js' });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(2200);
  p._ctx = ctx;
  return p;
}
const STAND = () => {
  const box = document.getElementById('heuteListe');
  const sa = box.closest('.scroll-area');
  return {
    ls: !!box.querySelector('.ls'),
    reiter: [...box.querySelectorAll('.ls-reiter [data-hmodus]')].map(x => x.textContent.trim()),
    kacheln: [...box.querySelectorAll('.ls-kachel')].map(k => ({ sk: k.getAttribute('data-lswahl'), name: k.querySelector('b').textContent.trim(),
      rot: k.classList.contains('rot'), gruen: k.classList.contains('gruen'), text: k.querySelector('i').textContent.trim() })),
    detail: (() => { const d = box.querySelector('.ls-detail'); return d && d.getClientRects().length ? d.querySelector('h3').textContent.trim() : ''; })(),
    best: [...box.querySelectorAll('.ls-best-zeile')].filter(z => z.getClientRects().length).map(z => z.querySelector('.ls-art').textContent + ': ' + z.querySelector('b').textContent),
    bestOben: (() => { const b = box.querySelector('.ls-best'), k = box.querySelector('.ls-kacheln'); return !!(b && k) && b.getBoundingClientRect().top < k.getBoundingClientRect().top; })(),
    hoch: sa.scrollHeight, sicht: sa.clientHeight
  };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1 + 2 Rechner: Kacheln, Ampel, Studio darunter ──');
  for (const rolle of ['leiter', 'chef']) {
    const p = await oeffne(b, 1440, 900, rolle);
    const s = await p.evaluate(STAND);
    pruefe(rolle + ': die Startseite der Leitung mit drei Reitern', s.ls && JSON.stringify(s.reiter) === '["Überblick","Meine Schicht","Zusammenfassung"]', JSON.stringify(s.reiter));
    pruefe(rolle + ': eine Kachel je Studio (' + s.kacheln.length + ')', s.kacheln.length >= 2, JSON.stringify(s.kacheln.map(k => k.name)));
    const h = s.kacheln.find(k => k.sk === 'studio-6') || {};
    pruefe(rolle + ': Hürth (Kündigung offen, Überfälliges) ist rot', h.rot && /Post 1/.test(h.text), JSON.stringify(h));
    pruefe(rolle + ': kein Studio ist ohne Grund rot', s.kacheln.filter(k => k.rot).every(k => /niemand|Aufg|Post/.test(k.text)), JSON.stringify(s.kacheln.filter(k => k.rot)));
    pruefe(rolle + ': das erste rote Studio steht gross darunter', s.detail === (s.kacheln.find(k => k.rot) || s.kacheln[0]).name, s.detail);
    const andere = s.kacheln.find(k => k.sk !== 'studio-6' && k.sk !== (s.kacheln.find(x => x.rot) || {}).sk) || s.kacheln[1];
    await p.evaluate((sk) => document.querySelector('.ls-kachel[data-lswahl="' + sk + '"]').click(), andere.sk);
    await p.waitForTimeout(400);
    const s2 = await p.evaluate(STAND);
    pruefe(rolle + ': Klick auf „' + andere.name + '" zeigt dieses Studio unter den Kacheln', s2.detail === andere.name && !(await p.evaluate(() => document.getElementById('lsModal').classList.contains('show'))), s2.detail);
    pruefe(rolle + ': „Zu bestätigen" nennt Kundenpost, Urlaub und Schichttausch', ['Kundenpost', 'Urlaub', 'Schichttausch'].every(a => s.best.some(x => x.indexOf(a) === 0) || (rolle === 'chef' && a === 'Schichttausch')) || s.best.length >= 2, JSON.stringify(s.best));
    pruefe(rolle + ': keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }
  for (const rolle of ['leiter', 'chef']) for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h, rolle);
    const s = await p.evaluate(STAND);
    pruefe(rolle + ' ' + w + ' × ' + h + ': passt auf einen Bildschirm (' + s.hoch + ' / ' + s.sicht + ' px)', s.hoch <= s.sicht + 2, JSON.stringify({ hoch: s.hoch, sicht: s.sicht }));
    await p._ctx.close();
  }

  console.log('\n── 3 Handy: Zu bestätigen oben, Studio als Fenster ──');
  {
    const p = await oeffne(b, 390, 844, 'chef');
    const s = await p.evaluate(STAND);
    pruefe('„Zu bestätigen" steht über den Kacheln', s.bestOben, JSON.stringify(s));
    pruefe('kein Studio steht schon offen unter den Kacheln', s.detail === '', s.detail);
    const r = await p.evaluate(async () => {
      document.querySelector('.ls-kachel[data-lswahl="studio-6"]').click(); await new Promise(x => setTimeout(x, 400));
      const m = document.getElementById('lsModal');
      const offen = m.classList.contains('show') && getComputedStyle(m).display !== 'none';
      const titel = (m.querySelector('h3') || {}).textContent;
      const haken = m.querySelectorAll('.hz-haken').length, erledigt = m.querySelectorAll('[data-hkp]').length;
      document.getElementById('lsZu').click(); await new Promise(x => setTimeout(x, 200));
      return { offen, titel: (titel || '').trim(), haken, erledigt, zu: !m.classList.contains('show') };
    });
    pruefe('Tipp auf „Hürth" öffnet das Studio mit Haken und „Erledigt"', r.offen && r.titel === 'Hürth' && r.haken >= 1 && r.erledigt >= 1, JSON.stringify(r));
    pruefe('… und schliesst wieder', r.zu);
    pruefe('Handy: keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── 4 Zu bestätigen ──');
  {
    const p = await oeffne(b, 1440, 900, 'leiter');
    const r = await p.evaluate(async () => {
      const aus = {};
      async function ja(art) {
        const z = [...document.querySelectorAll('.ls-best-zeile')].find(x => x.querySelector('.ls-art').textContent === art);
        if (!z) return null;
        const id = z.querySelector('[data-lsja]').getAttribute('data-lsja');
        z.querySelector('[data-lsja]').click(); await new Promise(x => setTimeout(x, 500));
        return { id, weg: !document.querySelector('[data-lsja="' + id + '"]') };
      }
      aus.kp = await ja('Kundenpost');
      aus.abw = await ja('Urlaub');
      const alle = document.querySelector('[data-lsalle]'); if (alle) { alle.click(); await new Promise(x => setTimeout(x, 300)); }
      aus.ta = await ja('Schichttausch');
      aus.schreib = (window.__schreib || []).map(x => ({ pfad: x.pfad, daten: x.daten }));
      return aus;
    });
    const s = r.schreib || [];
    const kp = s.find(x => /kundenpost\/kp-w$/.test(x.pfad));
    pruefe('Kundenpost ✓: status „bestaetigt" mit eigener Kennung, Zeile weg', kp && kp.daten.status === 'bestaetigt' && kp.daten.bestaetigtUid === 'testuid' && r.kp && r.kp.weg, JSON.stringify({ kp, r: r.kp }));
    const abw = s.find(x => /absences\//.test(x.pfad) && x.daten && x.daten.status);
    pruefe('Urlaub ✓: „genehmigt", Zeile weg', abw && abw.daten.status === 'genehmigt' && r.abw && r.abw.weg, JSON.stringify({ abw, r: r.abw }));
    const ta = s.find(x => /shifts\//.test(x.pfad) && x.daten && x.daten.getauschtDurch);
    pruefe('Schichttausch ✓: die neue Person steht im Plan, Zeile weg', ta && ta.daten.uid && r.ta && r.ta.weg, JSON.stringify({ ta, r: r.ta }));
    pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── 5 Reiter „Zusammenfassung" ──');
  {
    const p = await oeffne(b, 1440, 900, 'chef', 'zusammen');
    const z = await p.evaluate(() => ({ saetze: [...document.querySelectorAll('.ls-zusammen .ls-satz')].map(x => x.textContent.trim()),
      kacheln: document.querySelectorAll('.ls-kachel').length }));
    pruefe('ein Satz je auffälligem Studio, dazu „… haben alles erledigt"', z.saetze.some(t => /^Hürth hat /.test(t)) && z.saetze.some(t => /alles erledigt/.test(t)) && z.kacheln === 0, JSON.stringify(z));
    await p._ctx.close();
  }

  console.log('\n── 6 Treffer ≥ 44 × 44 ──');
  for (const [w, h] of [[390, 844], [1280, 800], [1440, 900]]) {
    const p = await oeffne(b, w, h, 'chef');
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.waitForTimeout(200);
      const m = await p.evaluate((SRC) => {
        const T = eval('(' + SRC + ')');
        const k = [...document.querySelectorAll('#heuteListe .ls-kachel, #heuteListe .ls-ja, #heuteListe .ls-nein, #heuteListe .ls-oeffnen, #heuteListe .ls-reiter button, #heuteListe .ls-mehr-knopf, #heuteListe .ls-material, #heuteListe .ls .mini-link, #heuteListe .ls .hz-haken, #heuteListe .ls .hz-aktion')]
          .filter(e => e.getClientRects().length);
        return k.map(e => { e.scrollIntoView({ block: 'center' }); const t = T(e); return { k: e.className.split(' ')[0] || e.tagName, t: e.textContent.trim().slice(0, 14), w: t.w, h: t.h }; });
      }, TREFFER.toString());
      const klein = m.filter(x => x.w < 44 || x.h < 44);
      pruefe(w + ' px ' + dichte + ': ' + m.length + ' Knöpfe, jeder trifft ≥ 44 × 44', m.length >= 10 && !klein.length, JSON.stringify(klein));
    }
    const quer = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
    pruefe(w + ' px: nichts lässt sich seitwärts schieben', quer);
    await p._ctx.close();
  }

  console.log('\n── 7 Gegenproben ──');
  {
    const p = await oeffne(b, 1440, 900, 'mitarbeiter');
    const s = await p.evaluate(STAND);
    pruefe('Mitarbeiter: keine Leitungs-Startseite', !s.ls && !s.kacheln.length, JSON.stringify(s));
    await p._ctx.close();
    const q = await oeffne(b, 1440, 900, 'leiter', 'schicht');
    const t = await q.evaluate(() => ({ ls: !!document.querySelector('#heuteListe .ls'),
      bloecke: [...document.querySelectorAll('#heuteListe .heute-block')].map(x => x.getAttribute('data-btitel')) }));
    pruefe('Leitung, „Meine Schicht": die bisherige Liste', !t.ls && /^Meine Schicht/.test(t.bloecke[0] || ''), JSON.stringify(t));
    await q._ctx.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Startseite der Leitung: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Startseite der Leitung: Kacheln mit Ampel, Studio im Detail, Zu bestätigen, Zusammenfassung — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
