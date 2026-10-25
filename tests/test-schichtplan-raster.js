/* ══════════════════════════════════════════════════════════════════════
   SCHICHTPLAN: RASTER NACH PERSON, SCHICHT-BLATT, WOCHEN IM PLANER
   (Runde 191)

   Aus dem Betrieb, 22.10.2026, auf den Plan mit Raster nach Person,
   Eintragen per Klick und Löschen/„Ich kann nicht" im Detail:
   „plan klingt gut!" — Rückfragen: „1. Beide schauen oft rein denk ich
   2. Ja 3. JA 4. Beides am besten denk ich 5. er wirkt für mich noch
   unfertig … aber das grundgrüst soll stehen erstmal".

   Geprüft wird:
    1. Am Rechner sieht die Leitung ohne eigene Wahl „Personen", das
       Team „Tage"; die Wahl bleibt nach dem Neuladen.
    2. Die Zahl über der Woche zählt DIESE Woche (vorher alle geladenen
       Schichten: 14 statt 8). Gegenprobe: die nächste Woche hat eine
       andere Zahl, und sie stimmt dort auch.
    3. Stunden je Person, Soll aus dem Schichtplaner (Chef: alle; Team:
       nur die eigene Zeile), Abweichung > 15 % ist markiert.
    4. Klick in eine leere Zelle: Tag und Person gesetzt, Vorlagen nur
       für diesen Wochentag, Speichern trägt ein und schliesst.
    5. Schicht antippen öffnet das Blatt; „Ich kann nicht" und
       „Entfernen" stehen nur dort, nicht mehr in jeder Zeile.
    6. Abwesenheit ohne Statusfarbe.
    7. Tastenkürzel ← → H V.
    8. Jedes Bedienelement ≥ 44 × 44 (Hit-Test) in beiden Ansichten und
       im Blatt, 320–1920 px, normal und kompakt; nichts ragt hinaus.
    9. Schichtplaner: eine Woche statt fünf Tabellen, Wochen-Reiter mit
       offenen Punkten, „Ganzer Monat", feste Spalten.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 300) : '')); }
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

async function oeffne(b, rolle, w, h, ctx) {
  const c = ctx || await b.newContext({ serviceWorkers: 'block', viewport: { width: w, height: h } });
  const p = await c.newPage();
  p._ctx = c;
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); window.confirm = () => true; });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  await p.evaluate(() => [...document.querySelectorAll('.mobnav [data-group="g-team"], #side [data-group="g-team"]')]
    .find(x => x.getClientRects().length).click());
  await p.waitForTimeout(1500);
  return p;
}
const ZUSTAND = () => {
  const g = document.getElementById('shiftGrid');
  const zahl = parseInt((document.getElementById('shiftSum').textContent.match(/(\d+) Schicht/) || [])[1], 10);
  return {
    raster: g.classList.contains('wp-raster-an'),
    kw: document.getElementById('shiftKw').textContent,
    zahl,
    pillen: g.querySelectorAll('.wp-schicht').length,
    eintraege: g.querySelectorAll('.shift-entry').length,
    tageSpalten: [...g.querySelectorAll('.shift-day')].filter(d => d.offsetParent).length,
    quer: document.documentElement.scrollWidth - innerWidth
  };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. Ansicht je Rolle, und die Wahl bleibt ──');
  {
    const p = await oeffne(b, 'chef', 1440, 900);
    let z = await p.evaluate(ZUSTAND);
    pruefe('Leitung am Rechner: „Personen" ohne eigene Wahl', z.raster && z.pillen > 0, JSON.stringify(z));
    pruefe('Zeilen: die eigene steht oben und trägt „(du)"',
      await p.evaluate(() => { const r = document.querySelector('.wp-z:not(.wp-kopfz)'); return !!r && r.classList.contains('ich') && /\(du\)/.test(r.textContent); }));
    await p.evaluate(() => document.querySelector('[data-wpansicht="tag"]').click());
    await p.waitForTimeout(300);
    z = await p.evaluate(ZUSTAND);
    pruefe('„Tage" zeigt sieben Spalten', !z.raster && z.tageSpalten === 7, JSON.stringify(z));
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    await p.evaluate(() => [...document.querySelectorAll('#side [data-group="g-team"]')].find(x => x.getClientRects().length).click());
    await p.waitForTimeout(1500);
    z = await p.evaluate(ZUSTAND);
    pruefe('nach dem Neuladen bleibt „Tage"', !z.raster, JSON.stringify(z));
    await p.evaluate(() => document.querySelector('[data-wpansicht="person"]').click());
    await p.waitForTimeout(300);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();

    const m = await oeffne(b, 'mitarbeiter', 1440, 900);
    z = await m.evaluate(ZUSTAND);
    pruefe('Team am Rechner: „Tage" ohne eigene Wahl', !z.raster && z.tageSpalten === 7, JSON.stringify(z));
    pruefe('Umschalter am Rechner auch fürs Team da',
      await m.evaluate(() => !document.getElementById('wpAnsicht').hidden));
    await m._ctx.close();
  }

  console.log('\n── 2. Die Zahl über der Woche zählt diese Woche ──');
  for (const rolle of ['chef', 'mitarbeiter']) {
    const p = await oeffne(b, rolle, 1440, 900);
    await p.evaluate(() => document.querySelector('[data-wpansicht="person"]').click());
    await p.waitForTimeout(300);
    const diese = await p.evaluate(ZUSTAND);
    pruefe(rolle + ': „' + diese.zahl + ' Schichten" = Schichten im Raster (' + diese.pillen + ')', diese.zahl === diese.pillen, JSON.stringify(diese));
    await p.evaluate(() => document.getElementById('shiftNext').click());
    await p.waitForTimeout(300);
    const naechste = await p.evaluate(ZUSTAND);
    pruefe(rolle + ': GEGENPROBE nächste Woche stimmt ebenso (' + naechste.zahl + ' = ' + naechste.pillen + ')',
      naechste.zahl === naechste.pillen && naechste.kw !== diese.kw, JSON.stringify(naechste));
    await p.evaluate(() => document.querySelector('[data-wpansicht="tag"]').click());
    await p.waitForTimeout(300);
    const tage = await p.evaluate(ZUSTAND);
    pruefe(rolle + ': in „Tage" dieselbe Zahl wie Einträge', tage.zahl === tage.eintraege, JSON.stringify(tage));
    await p.evaluate(() => { localStorage.removeItem('kf_prefs'); });
    await p._ctx.close();
  }

  console.log('\n── 3. Stunden und Soll ──');
  {
    const p = await oeffne(b, 'chef', 1440, 900);
    const s = await p.evaluate(() => [...document.querySelectorAll('.wp-z:not(.wp-kopfz):not(.wp-besetzt)')].map(r => ({
      name: r.querySelector('.wp-p').textContent, std: r.querySelector('.wp-std').textContent.replace(/\s+/g, ' ').trim(),
      warn: r.querySelector('.wp-std').classList.contains('warn'),
      summe: [...r.querySelectorAll('.wp-schicht')].reduce((a, x) => {
        const t = (x.getAttribute('title') || '').match(/(\d\d):(\d\d)–(\d\d):(\d\d)/);
        if (!t) return a; let d = (+t[3] * 60 + +t[4]) - (+t[1] * 60 + +t[2]); if (d <= 0) d += 1440; return a + d / 60;
      }, 0)
    })));
    console.log('  ' + JSON.stringify(s));
    pruefe('jede Zeile: die Stunden sind die Summe ihrer Schichten',
      s.length && s.every(x => Math.abs(parseFloat(x.std.replace(',', '.')) - x.summe) < 0.05), JSON.stringify(s));
    pruefe('Chef sieht das Soll anderer („/ 40")', s.some(x => /\/ \d/.test(x.std) && !/\(du\)/.test(x.name)), JSON.stringify(s));
    const abw = s.filter(x => /\//.test(x.std)).map(x => {
      const [ist, soll] = x.std.split('/').map(v => parseFloat(v.replace(',', '.')));
      return { x, aus: ist < soll * 0.85 || ist > soll * 1.15 };
    });
    pruefe('markiert ist genau, wer mehr als 15 % vom Soll abweicht', abw.length && abw.every(a => a.aus === a.x.warn), JSON.stringify(abw));
    await p._ctx.close();

    const m = await oeffne(b, 'mitarbeiter', 1440, 900);
    await m.evaluate(() => document.querySelector('[data-wpansicht="person"]').click());
    await m.waitForTimeout(400);
    const t = await m.evaluate(() => [...document.querySelectorAll('.wp-z:not(.wp-kopfz):not(.wp-besetzt)')].map(r => ({
      ich: r.classList.contains('ich'), soll: /\//.test(r.querySelector('.wp-std').textContent) })));
    pruefe('Team: Soll nur in der eigenen Zeile (die Regel lässt nur sie lesen)',
      t.length > 1 && t.filter(x => x.soll).every(x => x.ich), JSON.stringify(t));
    await m._ctx.close();
  }

  console.log('\n── 3b. Besetzung je Tag: Lücken in der Öffnungszeit ──');
  /* Runde 200 — aus dem Betrieb: „mach weiter mit dem design". Die
     Leiste unter dem Raster sagt, wann niemand eingeteilt ist, obwohl das
     Studio offen hat. Nachgerechnet wird unabhängig: aus den Zeiten der
     Pillen in derselben Spalte, alle 30 Minuten der Öffnungszeit. Über
     mehrere Studios, damit Tage mit und ohne Lücke vorkommen. */
  {
    const p = await oeffne(b, 'chef', 1440, 900);
    const r = await p.evaluate(async () => {
      const w = ms => new Promise(r => setTimeout(r, ms));
      const min = t => { const m = /^(\d{2})(?::(\d{2}))?$/.exec(t); return m ? +m[1] * 60 + (+(m[2] || 0)) : null; };
      const sel = document.getElementById('teamStudio'), aus = [], fehler = [];
      for (const o of [...sel.options].slice(0, 6)) {
        sel.value = o.value; sel.onchange(); await w(400);
        for (const wo of [0, 1]) {
          document.getElementById(wo ? 'shiftNext' : 'shiftToday').click(); await w(150);
          const zeilen = [...document.querySelectorAll('.wp-z:not(.wp-kopfz):not(.wp-besetzt)')];
          const besetzt = document.querySelector('.wp-besetzt');
          if (!besetzt) { fehler.push(o.value + ': keine Zeile „Besetzt"'); continue; }
          const zellen = [...besetzt.querySelectorAll('.wp-c')];
          zellen.forEach((z, i) => {
            if (z.classList.contains('vorbei')) return;
            const band = z.querySelector('.wp-band'); const lab = band ? band.getAttribute('aria-label') : '';
            const off = /Geöffnet (\S+)–(\S+) Uhr/.exec(lab);
            const zeiten = zeilen.flatMap(r => [...r.querySelectorAll('.wp-c')[i].querySelectorAll('.wp-schicht')])
              .map(x => /(\d\d):(\d\d)–(\d\d):(\d\d)/.exec(x.getAttribute('title') || '')).filter(Boolean)
              .map(m => { const a = +m[1] * 60 + +m[2]; let e = +m[3] * 60 + +m[4]; if (e <= a) e = 1440; return [a, e]; });
            const luecken = ((/niemand eingeteilt: (.*)$/.exec(lab) || [])[1] || '').split(', ').filter(Boolean)
              .map(t => t.split('–').map(min));
            if (!off) { if (luecken.length) fehler.push(o.value + ' Tag ' + i + ': Lücke ohne Öffnungszeit'); return; }
            const [ov, ob] = [min(off[1]), min(off[2])];
            for (let t = ov + 15; t < ob; t += 30) {
              const da = zeiten.some(([a, e]) => a <= t && e > t);
              const inLuecke = luecken.some(([a, e]) => a <= t && e > t);
              if (da === inLuecke) fehler.push(o.value + ' Tag ' + i + ' ' + Math.floor(t / 60) + ':' + (t % 60) + ' da=' + da + ' Lücke=' + inLuecke);
            }
            aus.push({ st: o.value, tag: i, schichten: zeiten.length, luecken: luecken.length,
              text: (z.querySelector('.wp-band-txt') || {}).textContent || '' });
          });
        }
      }
      return { aus, fehler };
    });
    const mitL = r.aus.filter(x => x.luecken), ohneL = r.aus.filter(x => !x.luecken);
    console.log('  Tage geprüft: ' + r.aus.length + ' (mit Lücke ' + mitL.length + ', ohne ' + ohneL.length + ')');
    pruefe('Lücken stimmen alle 30 Minuten mit den Schichten überein', r.aus.length > 10 && !r.fehler.length, r.fehler.slice(0, 5).join(' | '));
    pruefe('es kommen Tage mit UND ohne Lücke vor (sonst prüft das nichts)', mitL.length > 0 && ohneL.length > 0);
    pruefe('eine Lücke steht als Text unter der Leiste („… niemand")', mitL.every(x => /niemand/.test(x.text)), JSON.stringify(mitL.slice(0, 3)));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── 4. Eintragen per Klick in eine leere Zelle ──');
  {
    const p = await oeffne(b, 'chef', 1440, 900);
    const r = await p.evaluate(async () => {
      const w = ms => new Promise(r => setTimeout(r, ms));
      /* Am Wochenende hat die laufende Woche keinen Werktag mehr vor sich —
         dann die nächste Woche (gefunden an einem Sonntag, 25.10.2026). */
      const werktag = () => [...document.querySelectorAll('#shiftGrid [data-wpneu]')].some(z => {
        const d = new Date(z.getAttribute('data-wpneu').split('|')[0] + 'T12:00'); return d.getDay() >= 1 && d.getDay() <= 5; });
      if (!werktag()) { document.getElementById('shiftNext').click(); await w(300); }
      const zellen = [...document.querySelectorAll('#shiftGrid [data-wpneu]')];
      // eine Zelle an einem Werktag (Mo–Fr), nicht Samstag
      const leer = zellen.find(z => { const d = new Date(z.getAttribute('data-wpneu').split('|')[0] + 'T12:00'); return d.getDay() >= 1 && d.getDay() <= 5; }) || zellen[0];
      const [tag, uid] = leer.getAttribute('data-wpneu').split('|');
      const vorher = document.querySelectorAll('#shiftGrid .wp-schicht').length;
      leer.click(); await w(500);
      const offen = document.getElementById('shiftSheet').classList.contains('show');
      const wt = new Date(tag + 'T12:00').getDay();
      const vorlagen = [...document.querySelectorAll('#shVorlagen .chip')].map(c => c.textContent);
      const gesetzt = { datum: document.getElementById('shDate').value === tag, person: document.getElementById('shPerson').value === uid };
      document.querySelector('#shVorlagen .chip').click();
      const von = document.getElementById('shFrom').value, bis = document.getElementById('shTo').value;
      document.getElementById('shAdd').click(); await w(900);
      return { offen, wt, vorlagen, gesetzt, von, bis, vorher, nachher: document.querySelectorAll('#shiftGrid .wp-schicht').length,
        zu: !document.getElementById('shiftSheet').classList.contains('show') };
    });
    console.log('  ' + JSON.stringify(r));
    pruefe('das Blatt geht auf, Tag und Person sind gesetzt', r.offen && r.gesetzt.datum && r.gesetzt.person, JSON.stringify(r));
    pruefe('Vorlagen aus dem Schichtplaner, an einem Werktag ohne „Samstag"',
      r.vorlagen.length >= 1 && (r.wt === 6 || !r.vorlagen.some(v => /Samstag/.test(v))), JSON.stringify(r.vorlagen));
    pruefe('eine Vorlage setzt Von und Bis', /^\d\d:\d\d$/.test(r.von) && r.von !== r.bis, r.von + '–' + r.bis);
    pruefe('Speichern trägt ein und schliesst das Blatt', r.nachher === r.vorher + 1 && r.zu, JSON.stringify(r));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── 5. Schicht antippen: das Blatt ──');
  for (const [rolle, w, h] of [['mitarbeiter', 390, 844], ['chef', 1440, 900]]) {
    const p = await oeffne(b, rolle, w, h);
    const r = await p.evaluate(async () => {
      const wt = ms => new Promise(r => setTimeout(r, ms));
      const inZeile = { kreuz: document.querySelectorAll('#shiftGrid .shift-x').length,
        kannNicht: document.querySelectorAll('#shiftGrid [data-tausch-ab]').length };
      const eigene = [...document.querySelectorAll('#shiftGrid [data-shift]')].find(b => b.offsetParent && (b.classList.contains('mein') || b.closest('.wp-z.ich')));
      eigene.click(); await wt(400);
      const acts = [...document.querySelectorAll('#shSheetActs .ms-act')].map(a => a.textContent.trim());
      const kugel = document.querySelector('.formi-kugel');
      const kugelZu = !kugel || getComputedStyle(kugel).visibility === 'hidden' || kugel.hidden;
      document.querySelector('#shSheetActs [data-tausch-ab]').click(); await wt(600);
      return { inZeile, acts, kugelZu, zu: !document.getElementById('shiftSheet').classList.contains('show'),
        toast: (document.getElementById('toast') || {}).textContent };
    });
    console.log('  ' + rolle + ' ' + JSON.stringify(r));
    pruefe(rolle + ': kein ✕ und kein „Ich kann nicht" mehr in der Zeile', !r.inZeile.kreuz && !r.inZeile.kannNicht, JSON.stringify(r.inZeile));
    pruefe(rolle + ': im Blatt zuerst „Ich kann nicht"', /Ich kann nicht/.test(r.acts[0] || ''), JSON.stringify(r.acts));
    pruefe(rolle + ': „Entfernen" nur für die Leitung', r.acts.some(a => /entfernen/.test(a)) === (rolle === 'chef'), JSON.stringify(r.acts));
    pruefe(rolle + ': die Formi-Kugel liegt nicht über dem Blatt', r.kugelZu);
    pruefe(rolle + ': „Ich kann nicht" schreibt aus und schliesst das Blatt', r.zu && /Ausgeschrieben/.test(r.toast || ''), JSON.stringify(r));
    pruefe(rolle + ': ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── 6. Abwesenheit ohne Statusfarbe, 7. Tasten ──');
  {
    const p = await oeffne(b, 'chef', 1440, 900);
    const a = await p.evaluate(async () => {
      const w = ms => new Promise(r => setTimeout(r, ms));
      const alte = document.querySelectorAll('.abs-chip').length;
      // ein Studio und eine Woche mit Abwesenheit suchen (je höchstens 4 Wochen vor)
      const sel = document.getElementById('teamStudio'), start = sel.value;
      for (const o of [...sel.options]) {
        sel.value = o.value; sel.onchange(); await w(400);
        document.getElementById('shiftToday').click(); await w(100);
        for (let n = 0; n < 4 && !document.querySelector('.wp-c.abw'); n++) { document.getElementById('shiftNext').click(); await w(120); }
        if (document.querySelector('.wp-c.abw')) break;
      }
      const c = document.querySelector('.wp-c.abw');
      const farbe = c ? getComputedStyle(c.querySelector('.wp-abw-txt')).color : '';
      const bg = c ? getComputedStyle(c).backgroundImage.slice(0, 40) : '';
      const warm = getComputedStyle(document.body).getPropertyValue('--warm-tx').trim();
      sel.value = start; sel.onchange(); await w(400);
      document.getElementById('shiftToday').click(); await w(150);
      return { alte, gefunden: !!c, farbe, warm, bg };
    });
    console.log('  ' + JSON.stringify(a));
    pruefe('keine bernsteinfarbenen Abwesenheits-Chips mehr', a.alte === 0);
    pruefe('Abwesenheit steht in der Zeile der Person, schraffiert', a.gefunden && /repeating-linear-gradient/.test(a.bg), JSON.stringify(a));
    const k = await p.evaluate(() => document.getElementById('shiftKw').textContent);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200);
    const k1 = await p.evaluate(() => document.getElementById('shiftKw').textContent);
    await p.keyboard.press('h'); await p.waitForTimeout(200);
    const k2 = await p.evaluate(() => document.getElementById('shiftKw').textContent);
    await p.keyboard.press('v'); await p.waitForTimeout(300);
    const v = await p.evaluate(() => document.getElementById('shiftGrid').classList.contains('wp-raster-an'));
    await p.keyboard.press('v'); await p.waitForTimeout(300);
    const v2 = await p.evaluate(() => document.getElementById('shiftGrid').classList.contains('wp-raster-an'));
    pruefe('→ blättert vor, H zurück zu heute', k1 !== k && k2 === k, [k, k1, k2].join(' / '));
    pruefe('V wechselt die Ansicht und zurück', v === false && v2 === true);
    await p.keyboard.press('?'); await p.waitForTimeout(400);
    const hilfe = await p.evaluate(() => document.getElementById('keysList').textContent);
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    pruefe('die Kürzel stehen unter „?"', /Im Schichtplan/.test(hilfe) && /Tage ↔ Personen/.test(hilfe));
    await p._ctx.close();
  }

  console.log('\n── 8. Trefferflächen, beide Ansichten und das Blatt ──');
  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, 'chef', w, h);
    const ansichten = w >= 1100 ? ['person', 'tag'] : ['tag'];
    for (const ans of ansichten) {
      if (w >= 1100) { await p.evaluate(a => document.querySelector('[data-wpansicht="' + a + '"]').click(), ans); await p.waitForTimeout(250); }
      for (const dichte of ['normal', 'kompakt']) {
        await p.evaluate(d => { document.body.dataset.dichte = d; }, dichte);
        const aus = await p.evaluate(async (SRC) => {
          const T = eval('(' + SRC + ')');
          const wt = ms => new Promise(r => setTimeout(r, ms));
          const k = document.querySelector('[data-shvergangen]');
          if (k && k.offsetParent && k.getAttribute('aria-expanded') !== 'true') k.click();
          await wt(150);
          const zu = [];
          async function messen(els) {
            for (const el of els) {
              el.scrollIntoView({ block: 'center' });
              await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
              const m = T(el);
              if (m.w < 44 || m.h < 44) zu.push((el.textContent.trim() || el.getAttribute('aria-label') || el.className).slice(0, 22) + ' ' + m.w + '×' + m.h);
            }
          }
          const plan = [...document.querySelectorAll('#teamPaneSchicht button')].filter(e => e.offsetParent);
          await messen(plan);
          // das Blatt einer Schicht und das Formular
          const s = [...document.querySelectorAll('#shiftGrid [data-shift]')].find(e => e.offsetParent);
          let blatt = 0;
          if (s) { s.click(); await wt(350);
            const b1 = [...document.querySelectorAll('#shiftSheet button')].filter(e => e.offsetParent); blatt += b1.length; await messen(b1);
            document.getElementById('shSheetZu').click(); await wt(200); }
          /* „＋ Schicht" steht nur am Rechner; am Handy das ＋ am Tag. */
          const nk = document.getElementById('shiftNeu');
          (nk.offsetParent ? nk : [...document.querySelectorAll('#shiftGrid [data-wpneu]')].find(e => e.offsetParent)).click(); await wt(400);
          const b2 = [...document.querySelectorAll('#shiftSheet button, #shiftSheet input, #shiftSheet select')].filter(e => e.offsetParent);
          blatt += b2.length; await messen(b2);
          document.getElementById('shSheetZu').click(); await wt(200);
          const k2 = document.querySelector('[data-shvergangen]');
          if (k2 && k2.getAttribute('aria-expanded') === 'true') k2.click();
          return { plan: plan.length, blatt, zu, quer: document.documentElement.scrollWidth - innerWidth };
        }, TREFFER.toString());
        pruefe(w + ' px ' + ans + ' ' + dichte + ': ' + (aus.plan + aus.blatt) + ' Bedienelemente ≥ 44 × 44, nichts ragt hinaus',
          aus.plan >= 4 && aus.blatt >= 4 && !aus.zu.length && aus.quer <= 0, JSON.stringify({ zu: aus.zu.slice(0, 5), quer: aus.quer }));
      }
    }
    await p.evaluate(() => { document.body.dataset.dichte = 'normal'; localStorage.removeItem('kf_prefs'); });
    pruefe(w + ' px ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── 9. Schichtplaner: Woche für Woche ──');
  {
    const c = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1440, height: 900 } });
    const p = await c.newPage();
    p._fehler = []; p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); window.confirm = () => true; });
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    const r = await p.evaluate(async () => {
      const w = ms => new Promise(r => setTimeout(r, ms));
      const g = document.getElementById('bereichKopf'); if (g && g.offsetParent) { g.click(); await w(700); }
      [...document.querySelectorAll('[data-alles="planer"]')].find(e => e.offsetParent).click(); await w(3000);
      document.getElementById('spLos').click(); await w(4000);
      const reiter = [...document.querySelectorAll('#spTabelle .spl-kw')].map(b => b.textContent.replace(/\s+/g, ' ').trim());
      const tabellen1 = document.querySelectorAll('#spTabelle .spl-tab').length;
      const sa = document.querySelector('#view-planer .scroll-area').scrollHeight;
      // „Zu klären": ein Punkt aus einer anderen Woche wechselt dorthin
      const an1 = document.querySelector('#spTabelle .spl-kw.an').getAttribute('data-spkw');
      const punkte = [...document.querySelectorAll('#spKlaeren [data-sppunkt]')];
      const wochen = [...document.querySelectorAll('#spTabelle .spl-kw:not(.alle)')].map(x => x.getAttribute('data-spkw'));
      const wocheVon = d => { let x = wochen[0]; wochen.forEach(v => { if (v <= d) x = v; }); return x; };
      const anderer = punkte.find(pk => wocheVon(pk.getAttribute('data-sppunkt').split('|')[0]) !== an1);
      let wechsel = null;
      if (anderer) { anderer.click(); await w(400);
        const d = anderer.getAttribute('data-sppunkt').split('|')[0];
        const an = document.querySelector('#spTabelle .spl-kw.an').getAttribute('data-spkw');
        wechsel = { d, an, soll: wocheVon(d), zelleDa: !!document.querySelector('#spTabelle .spl-zelle.an') }; }
      document.querySelector('#spTabelle [data-spkw="alle"]').click(); await w(300);
      const tabellenAlle = document.querySelectorAll('#spTabelle .spl-tab').length;
      // feste Spalten: die zweite Spalte beginnt in jeder Woche an derselben Stelle
      const xs = [...document.querySelectorAll('#spTabelle .spl-tab thead th:nth-child(2)')].map(t => Math.round(t.getBoundingClientRect().left));
      return { reiter, tabellen1, sa, wechsel, tabellenAlle, xs };
    });
    console.log('  ' + JSON.stringify(r).slice(0, 600));
    pruefe('Wochen als Reiter, jeder mit Zustand, dazu „Ganzer Monat"',
      r.reiter.length >= 5 && r.reiter.slice(0, -1).every(t => /^KW \d+/.test(t) && /(Lücke|Rückfrage|besetzt)/.test(t)) && /Ganzer Monat/.test(r.reiter[r.reiter.length - 1]),
      JSON.stringify(r.reiter));
    pruefe('es steht EINE Woche da (vorher fünf Tabellen untereinander)', r.tabellen1 === 1, String(r.tabellen1));
    pruefe('„Zu klären" springt in die Woche des Punkts', !!r.wechsel && r.wechsel.an === r.wechsel.soll && r.wechsel.zelleDa, JSON.stringify(r.wechsel));
    pruefe('„Ganzer Monat" zeigt alle Wochen', r.tabellenAlle === r.reiter.length - 1, r.tabellenAlle + ' von ' + (r.reiter.length - 1));
    pruefe('feste Spalten: „Früh" steht in jeder Woche an derselben Stelle', r.xs.length > 1 && new Set(r.xs).size === 1, JSON.stringify(r.xs));
    pruefe('Planer ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await c.close();
  }

  console.log('\n── 10. Schichtplaner: Anfang ohne Team, Regeln in Reitern ──');
  /* Gemessen am echten Konto (Bildschirmfoto, 22.10.2026): Team leer,
     „Plan erstellen" grau ohne ein Wort warum, „Wünsche" mit Haken bei
     „0 von 0", Regeln als vier Formulare. Aus dem Betrieb: „mach weiter
     mit dem design und aufbau". */
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const c = await b.newContext({ serviceWorkers: 'block', viewport: { width: w, height: h } });
    const p = await c.newPage();
    p._fehler = []; p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    const voll = await p.evaluate(async () => {
      const wt = ms => new Promise(r => setTimeout(r, ms));
      const g = document.getElementById('bereichKopf'); if (g && g.offsetParent) { g.click(); await wt(700); }
      [...document.querySelectorAll('[data-alles="planer"]')].find(e => e.offsetParent).click(); await wt(2500);
      const d = document.getElementById('spRegeln'); d.open = true; await wt(150);
      const vorher = [...document.querySelectorAll('[data-spregel]')].filter(x => !x.hidden).map(x => x.dataset.spregel);
      document.querySelector('[data-spregeltab="sonder"]').click(); await wt(150);
      const nachher = [...document.querySelectorAll('[data-spregel]')].filter(x => !x.hidden).map(x => x.dataset.spregel);
      d.open = false;
      return { vorher, nachher, anfang: !document.getElementById('spAnfang').hidden, regeln: !d.hidden };
    });
    pruefe(w + ' px mit Team: Regeln sichtbar, ohne Anfangskarte', voll.regeln && !voll.anfang, JSON.stringify(voll));
    pruefe(w + ' px: Regeln zeigen EINEN Reiter, der Wechsel zeigt einen anderen',
      voll.vorher.join() === 'einst' && voll.nachher.join() === 'sonder', JSON.stringify(voll));
    const leer = await p.evaluate(async () => {
      const wt = ms => new Promise(r => setTimeout(r, ms));
      const db = firebase.firestore().collection('firmen').doc('koerperformen');
      const sn = await db.collection('planerTeam').get();
      for (const d of sn.docs) await db.collection('planerTeam').doc(d.id).delete();
      await db.collection('config').doc('schichtplaner').set({ wunschFristTag: 15 });
      document.getElementById('spMonatVor').click(); await wt(400);
      document.getElementById('spMonatZurueck').click(); await wt(1200);
      const los = document.getElementById('spLos');
      return { anfang: !document.getElementById('spAnfang').hidden, regeln: !document.getElementById('spRegeln').hidden,
        schritte: !document.getElementById('spSchritte').hidden, grau: los.disabled,
        grund: document.getElementById('spLosGrund').hidden ? '' : document.getElementById('spLosGrund').textContent,
        zustand: document.getElementById('spZustand').textContent,
        knoepfe: [...document.querySelectorAll('#spAnfang .btn')].filter(e => e.offsetParent).map(e => e.textContent.trim()) };
    });
    console.log('  ' + JSON.stringify(leer));
    pruefe(w + ' px ohne Team: „So fängst du an" statt Regeln und Schritten', leer.anfang && !leer.regeln && !leer.schritte, JSON.stringify(leer));
    pruefe(w + ' px: Vorlage und Einlesen stehen in der Anfangskarte', /Vorlage/.test(leer.knoepfe.join()) && /einlesen/.test(leer.knoepfe.join()), JSON.stringify(leer.knoepfe));
    pruefe(w + ' px: der graue Knopf sagt, warum', leer.grau && /eingelesen/.test(leer.grund), leer.grund);
    pruefe(w + ' px: neben dem Monat steht „noch kein Plan"', /noch kein Plan/.test(leer.zustand), leer.zustand);
    const ziel = await p.evaluate(async (SRC) => {
      const T = eval('(' + SRC + ')'); const zu = [];
      for (const el of [...document.querySelectorAll('#view-planer .spl-start button, #spAnfang .btn')].filter(e => e.offsetParent && !e.disabled)) {
        el.scrollIntoView({ block: 'center' }); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const m = T(el); if (m.w < 44 || m.h < 44) zu.push(el.textContent.trim() + ' ' + m.w + '×' + m.h);
      }
      return { zu, quer: document.documentElement.scrollWidth - innerWidth };
    }, TREFFER.toString());
    pruefe(w + ' px: Knöpfe im Anfang ≥ 44 × 44, nichts ragt hinaus', !ziel.zu.length && ziel.quer <= 0, JSON.stringify(ziel));
    pruefe(w + ' px ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await c.close();
  }

  console.log('\n── 11. Fragen zum Plan, Zurücknehmen, Öffnungszeiten aus dem Excel ──');
  /* Runde 245 — aus dem Betrieb: „uns alle fragen stellen welche wir
     beantworten müssen“ und „jap mach weiter dann“. */
  {
    const fs = require('fs'), path = require('path');
    const py = fs.readFileSync(path.join(__dirname, '..', 'docs', 'schichtplaner', 'werkzeug', 'inhalt.py'), 'utf8');
    const block = py.slice(py.indexOf('FRAGEN = ['), py.indexOf('# Was ich von LogX'));
    const ausPdf = [...block.matchAll(/\(\s*"((?:[^"\\]|\\.)*)",\s*\n\s*"((?:[^"\\]|\\.)*)"\)/g)].map(m => m[1]);
    const c = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1440, height: 900 } });
    const p = await c.newPage();
    p._fehler = []; p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); window.confirm = () => true; });
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    const r = await p.evaluate(async () => {
      const wt = ms => new Promise(r => setTimeout(r, ms));
      const g = document.getElementById('bereichKopf'); if (g && g.offsetParent) { g.click(); await wt(700); }
      [...document.querySelectorAll('[data-alles="planer"]')].find(e => e.offsetParent).click(); await wt(2500);
      const f = document.getElementById('spFragen'); f.open = true; await wt(150);
      const fragen = [];
      for (let i = 0; i < 5; i++) {
        document.querySelector('[data-spfgruppe="' + i + '"]').click(); await wt(120);
        document.querySelectorAll('.spl-frage label').forEach(l => fragen.push(l.textContent.replace(/^\d+\s*/, '').trim()));
      }
      const vor = document.getElementById('spFragenKurz').textContent;
      document.querySelector('[data-spfgruppe="0"]').click(); await wt(120);
      document.querySelector('[data-sppasst="1"]').click(); await wt(300);
      const t = document.getElementById('spAntwort3'); t.value = 'Früh 7–14, Spät 14–21'; t.dispatchEvent(new Event('change')); await wt(300);
      const nach = document.getElementById('spFragenKurz').textContent;
      // nach einem Monatswechsel neu geladen: die Antworten sind gespeichert
      document.getElementById('spMonatVor').click(); await wt(900);
      document.getElementById('spMonatZurueck').click(); await wt(1500);
      const geladen = document.getElementById('spFragenKurz').textContent;
      const a3 = (document.getElementById('spAntwort3') || {}).value;
      f.open = false;
      // veröffentlichen, dann zurücknehmen
      document.getElementById('spLos').click(); await wt(4000);
      document.getElementById('spVeroeffentlichen').click(); await wt(2500);
      const zeigt = !document.getElementById('spZurueck').hidden;
      document.getElementById('spZurueck').click(); await wt(2500);
      return { fragen, vor, nach, geladen, a3, zeigt, weg: document.getElementById('spZurueck').hidden,
        zustand: document.getElementById('spZustand').textContent, toast: (document.getElementById('toast') || {}).textContent };
    });
    console.log('  ' + JSON.stringify(Object.assign({}, r, { fragen: r.fragen.length })));
    pruefe('in der App dieselben 24 Fragen wie in PDF und Excel (inhalt.py)',
      ausPdf.length === 24 && r.fragen.length === 24 && ausPdf.every((q, i) => q === r.fragen[i]),
      JSON.stringify(ausPdf.map((q, i) => q === r.fragen[i] ? '' : i + 1).filter(Boolean)));
    pruefe('„passt“ und eine eigene Antwort zählen: 0 → 2 von 24', /^0 von 24/.test(r.vor) && /^2 von 24/.test(r.nach), r.vor + ' → ' + r.nach);
    pruefe('nach dem Neuladen sind die Antworten noch da', /^2 von 24/.test(r.geladen) && /Spät 14–21/.test(r.a3 || ''), r.geladen + ' · ' + r.a3);
    pruefe('nach dem Veröffentlichen steht „Veröffentlichung zurücknehmen“', r.zeigt);
    pruefe('Zurücknehmen nimmt die Schichten heraus, der Entwurf bleibt', r.weg && /Entwurf/.test(r.zustand) && /zurückgenommen/.test(r.toast || ''), JSON.stringify(r));
    const team = await p.evaluate(async () => {
      const wt = ms => new Promise(r => setTimeout(r, ms));
      [...document.querySelectorAll('#side [data-group="g-team"]')].find(x => x.getClientRects().length).click(); await wt(1500);
      let notizen = 0;
      for (let i = 0; i < 8; i++) {
        document.getElementById('shiftNext').click(); await wt(150);
        notizen += [...document.querySelectorAll('#shiftGrid .wp-schicht small, #shiftGrid .shift-note')].filter(n => /Früh|Spät|Samstag/.test(n.textContent)).length;
      }
      document.getElementById('shiftToday').click(); await wt(150);
      return notizen;
    });
    pruefe('GEGENPROBE im Team-Plan: keine Planer-Schichten mehr (Schichtname) in den nächsten Wochen', team === 0, String(team));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await c.close();
  }
  {
    /* Öffnungszeiten nur im Excel-Blatt „Studios“, nicht unter Verwaltung →
       Studios: die Besetzungs-Leiste nimmt die aus dem Excel. */
    const c = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1440, height: 900 } });
    const p = await c.newPage();
    p._fehler = []; p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    const r = await p.evaluate(async () => {
      const wt = ms => new Promise(r => setTimeout(r, ms));
      const db = firebase.firestore().collection('firmen').doc('koerperformen');
      const st = await db.collection('config').doc('studios').get();
      const liste = (st.data().liste || []).map(x => { const y = Object.assign({}, x); delete y.oeffnung; return y; });
      await db.collection('config').doc('studios').set(Object.assign({}, st.data(), { liste }));
      const studios = {};
      liste.forEach(x => { studios[x.id] = { min: 1, oeffnung: { 1: '10:00–12:00', 2: '10–12', 3: '10:00-12:00', 4: '10.00 – 12.00', 5: '10:00-12:00', 6: '10:00-12:00', 7: 'zu' } }; });
      await db.collection('config').doc('schichtplaner').set({ studios }, { merge: true });
      await wt(500);
      [...document.querySelectorAll('#side [data-group="g-team"]')].find(x => x.getClientRects().length).click(); await wt(1800);
      return [...document.querySelectorAll('.wp-besetzt .wp-band')].map(x => x.getAttribute('aria-label'));
    });
    console.log('  ' + JSON.stringify(r));
    pruefe('Öffnungszeit aus dem Excel: Mo–Sa „Geöffnet 10–12 Uhr“, auch bei „10.00 – 12.00“ und „10–12“',
      r.length === 7 && r.slice(0, 6).every(x => /^Geöffnet 10–12 Uhr/.test(x || '')), JSON.stringify(r));
    pruefe('„zu“ im Excel heisst geschlossen', /^Geschlossen/.test(r[6] || ''), r[6]);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await c.close();
  }

  console.log('\n── 12. Planer: decken die Schichtzeiten die Öffnungszeit ab? ──');
  /* Runde RUNDE_NR — aus dem Betrieb: „mach weiter mit dem was offen war“.
     Demo: geöffnet Mo–Fr 7–21, Sa 9–15; Schichten Früh 7–14, Spät 14–21
     (Mo–Fr), Samstag 9–14. Erwartet: genau „Sa 14–15“. */
  {
    const c = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1440, height: 900 } });
    const p = await c.newPage();
    p._fehler = []; p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    const r = await p.evaluate(async () => {
      const wt = ms => new Promise(r => setTimeout(r, ms));
      const g = document.getElementById('bereichKopf'); if (g && g.offsetParent) { g.click(); await wt(700); }
      [...document.querySelectorAll('[data-alles="planer"]')].find(e => e.offsetParent).click(); await wt(2500);
      document.getElementById('spLos').click(); await wt(4000);
      const abd = [...document.querySelectorAll('.spl-abdeckung > span')].map(x => x.textContent);
      const team = document.querySelector('#spTabelle').closest('.spl-plan').querySelector('details.spl-team'); if (team) team.open = true;
      const std = [...document.querySelectorAll('#spTeam .z')].map(z => z.textContent);
      // GEGENPROBE: Samstag in der Öffnung bis 14 Uhr → keine Lücke mehr
      const db = firebase.firestore().collection('firmen').doc('koerperformen');
      const st = await db.collection('config').doc('studios').get();
      const liste = st.data().liste.map(x => Object.assign({}, x, { oeffnung: Object.assign({}, x.oeffnung, { sa: '09:00-14:00' }) }));
      await db.collection('config').doc('studios').set(Object.assign({}, st.data(), { liste })); await wt(600);
      document.getElementById('spMonatVor').click(); await wt(900);
      document.getElementById('spMonatZurueck').click(); await wt(1800);
      return { abd, std, nachher: document.querySelectorAll('.spl-abdeckung').length };
    });
    console.log('  ' + JSON.stringify({ abd: r.abd, std: r.std.slice(0, 8), nachher: r.nachher }));
    pruefe('genau eine Lücke: „Sa 14–15 Uhr (geöffnet 09–15)“', r.abd.length === 1 && /^Sa 14–15 Uhr/.test(r.abd[0]) && /09–15/.test(r.abd[0]), JSON.stringify(r.abd));
    pruefe('GEGENPROBE: Samstag nur bis 14 Uhr geöffnet → kein Hinweis mehr', r.nachher === 0, String(r.nachher));
    const falsch = r.std.filter(t => { const m = /([\d,]+) \/ ([\d,]+) Std\./.exec(t); if (!m) return false;
      const ist = parseFloat(m[1].replace(',', '.')), soll = parseFloat(m[2].replace(',', '.'));
      const soll2 = ist < soll * 0.85 ? '↓' : (ist > soll * 1.15 ? '↑' : '');
      return soll2 !== (/↓/.test(t) ? '↓' : (/↑/.test(t) ? '↑' : '')); });
    pruefe('Stunden: ↓ unter 85 %, ↑ über 115 % des Solls – genau dort', r.std.length > 3 && !falsch.length, JSON.stringify(falsch));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await c.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Schichtplan-Raster: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Schichtplan-Raster: Personen-Raster, Blatt, Wochen im Planer — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
