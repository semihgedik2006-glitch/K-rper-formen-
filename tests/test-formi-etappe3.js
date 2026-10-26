/* ══════════════════════════════════════════════════════════════════════
   FORMI ETAPPE 3: MATERIAL UND PROBETRAINING ÜBER FORMI (Runde 235)

   Aus dem Betrieb (23.10.2026), Rückfrage „Welche Formulare soll Formi
   für dich ausfüllen?": „Gerät defekt melden, Material nachbestellen,
   Urlaub/Frei beantragen, Probetraining eintragen". Defekt und Urlaub
   gab es schon; geprüft wird hier, was neu ist.

   Geprüft (Attrappe Chef, Studio studio-6):
    1. „nur noch 0 Handschuhe" → Vorschau zeigt alt → neu, ohne zu
       schreiben; erst „Jetzt eintragen" schreibt inventory/studio-6,
       nur Handschuhe geändert, die anderen Artikel unverändert.
    2. „es fehlen 3 Handtücher" bei Soll 20 → Ist 17.
    3. Probetraining: Vorschau, dann ein Eintrag mit denselben Feldern wie
       das Formular (erfasstVon = ich, datum mittags, abschluss bool).
    4. Die Art „Formi meldet sich" steht in den Mitteilungen, an.
    5. Die Knöpfe der neuen Karten: Trefferfläche ≥ 44 × 44 und im Bild
       bei 320 / 390 / 430 / 820 / 1280 / 1440 / 1920 px, normal und
       kompakt (Hit-Test).
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

async function lauf(breite, hoehe, mitSchreiben) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    const ctx = await b.newContext({ viewport: { width: breite, height: hoehe }, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    const fehler = [];
    p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript({ path: SP + '/stub-chef.js' });
    await p.addInitScript(() => {
      window.__antwort = window.__antwort || {};
      window.__naechste = [];
      window.__antwort.gehirnAktion = () => Promise.resolve({ data: { vorschlag: window.__naechste.shift() } });
    });
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
    await p.waitForTimeout(2000);
    await p.click('#formiKugel'); await p.waitForTimeout(900);

    const frage = async (vorschlag, satz) => {
      await p.evaluate(v => { window.__naechste.push(v); window.__schreib = []; }, vorschlag);
      await p.fill('#jarvisFeld', satz);
      await p.click('#jarvisSenden');
      await p.waitForTimeout(1400);
    };
    const knopfMass = async () => p.evaluate(() => {
      const k = [...document.querySelectorAll('#jarvisVerlauf [data-ganlegen]')].pop();
      if (!k) return null;
      k.scrollIntoView({ block: 'center' });
      const r = k.getBoundingClientRect();
      const treffer = (x, y) => { const e = document.elementFromPoint(x, y); return !!e && (e === k || k.contains(e)); };
      /* Ränder der Trefferfläche: vom Mittelpunkt nach aussen, solange der Knopf getroffen wird. */
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let o = cy, u = cy, l = cx, re = cx;
      while (treffer(cx, o - 1) && o > 0) o--;
      while (treffer(cx, u + 1) && u < innerHeight) u++;
      while (treffer(l - 1, cy) && l > 0) l--;
      while (treffer(re + 1, cy) && re < innerWidth) re++;
      return { h: u - o + 1, b: re - l + 1, imBild: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth };
    });

    const masse = {};
    const messe = async (name) => {
      for (const dichte of ['normal', 'kompakt']) {
        await p.evaluate(d => { document.body.dataset.dichte = d; }, dichte);
        await p.waitForTimeout(150);
        masse[name + ', ' + dichte] = await knopfMass();
      }
      await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
    };
    await frage({ typ: 'material', artikel: 'Handschuhe', ist: 0, fehlt: null, studioKey: 'studio-6', studioName: 'Hürth' }, 'Handschuhe sind alle, nur noch 0');
    const vorschau = await p.evaluate(() => document.getElementById('jarvisVerlauf').innerText);
    await messe('Material');
    if (mitSchreiben) {
      pruefe('Material: Vorschau zeigt alt → neu (Ist 4 · Soll 10 · fehlt 6 → Ist 0 · Soll 10 · fehlt 10)', /Ist 4 · Soll 10 · fehlt 6 → Ist 0 · Soll 10 · fehlt 10/.test(vorschau), vorschau.slice(-260));
      const vorher = await p.evaluate(() => (window.__schreib || []).filter(x => /inventory|probetrainings/.test(x.pfad)).length);
      pruefe('Material: die Vorschau schreibt nichts', vorher === 0, String(vorher));
      await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf [data-ganlegen]')].pop().click());
      await p.waitForTimeout(700);
      const s1 = await p.evaluate(() => (window.__schreib || []).filter(x => /inventory\/studio-6$/.test(x.pfad)));
      const items = s1[0] && s1[0].daten && s1[0].daten.items || [];
      const hs = items.find(x => x.name === 'Handschuhe'), ht = items.find(x => x.name === 'Handtücher');
      pruefe('Material: „Jetzt eintragen" schreibt inventory/studio-6 — Handschuhe Ist 0, Handtücher unverändert 12', s1.length === 1 && hs && hs.have === 0 && hs.limit === 10 && ht && ht.have === 12, JSON.stringify(s1).slice(0, 300));
      pruefe('Material: Erfolg steht in der Karte', /fehlt 10, die Leitung sieht es/.test(await p.evaluate(() => document.getElementById('jarvisVerlauf').innerText)));

      await frage({ typ: 'material', artikel: 'Handtücher', ist: null, fehlt: 3, studioKey: 'studio-6', studioName: 'Hürth' }, 'es fehlen 3 Handtücher');
      await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf [data-ganlegen]')].pop().click());
      await p.waitForTimeout(700);
      const s2 = await p.evaluate(() => (window.__schreib || []).filter(x => /inventory\/studio-6$/.test(x.pfad)));
      const ht2 = s2[0] && (s2[0].daten.items || []).find(x => x.name === 'Handtücher');
      pruefe('Material: „es fehlen 3" bei Soll 20 → Ist 17', ht2 && ht2.have === 17, JSON.stringify(ht2));
    }

    await frage({ typ: 'probe', datum: '2026-10-23', abschluss: true, notiz: 'Rücken, 24 Monate', studioKey: 'studio-6', studioName: 'Hürth' }, 'hatte grad ein probetraining mit abschluss');
    await messe('Probetraining');
    if (mitSchreiben) {
      const pv = await p.evaluate(() => document.getElementById('jarvisVerlauf').innerText);
      pruefe('Probetraining: Vorschau mit Abschluss, Datum und Notiz', /probetraining/i.test(pv) && /Mit Abschluss/.test(pv) && /23\.10\.2026/.test(pv) && /Rücken, 24 Monate/.test(pv), pv.slice(-200));
      await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf [data-ganlegen]')].pop().click());
      await p.waitForTimeout(700);
      const s3 = await p.evaluate(() => (window.__schreib || []).filter(x => /probetrainings/.test(x.pfad)));
      const d = s3[0] && s3[0].daten || {};
      pruefe('Probetraining: ein Eintrag mit den Feldern des Formulars (erfasstVon = ich, datum mittags, abschluss bool)',
        s3.length === 1 && d.studioKey === 'studio-6' && d.abschluss === true && d.erfasstVon === 'testuid' && d.vonUid === 'testuid' && typeof d.vonName === 'string' && d.vonName.length > 0 && new Date(d.datum).getHours() === 12 && d.notiz === 'Rücken, 24 Monate', JSON.stringify(d));
      await p.keyboard.press('Escape'); await p.waitForTimeout(300);
      await p.evaluate(() => { try { jarvisZu(); } catch (e) {} });
      await p.click('#uAvatar'); await p.waitForTimeout(400);
      await p.evaluate(() => document.querySelector('[data-pmtab="melden"]').click()); await p.waitForTimeout(400);
      const opt = await p.evaluate(() => { const z = document.querySelector('#notifyOpts [data-nk="formi"]'); return z ? { da: true, an: z.querySelector('.sw').classList.contains('on'), text: z.textContent } : { da: false }; });
      pruefe('Mitteilungen: „Formi meldet sich" gibt es und ist an', opt.da && opt.an && /Formi meldet sich/.test(opt.text), JSON.stringify(opt));
    }
    for (const k of Object.keys(masse)) {
      const m = masse[k];
      pruefe(breite + ' px: Knopf „Jetzt eintragen" (' + k + ') trifft ≥ 44 × 44 und ist im Bild', m && m.h >= 44 && m.b >= 44 && m.imBild, JSON.stringify(m));
    }
    pruefe(breite + ' px: keine Skriptfehler', !fehler.length, fehler.join(' | '));
    await ctx.close();
  } finally { await b.close(); }
}

(async () => {
  await lauf(1440, 900, true);
  /* CLAUDE.md: jedes Bedienelement bei 320 / 390 / 430 / 820 px und am
     Rechner 1280 / 1440 / 1920 px, normal und kompakt. */
  for (const [b, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1920, 1080]]) await lauf(b, h, false);
  console.log(schlecht
    ? '\n✗ Formi Etappe 3: ' + schlecht + ' von ' + (gut + schlecht) + ' falsch'
    : '\n✓ Formi Etappe 3: Material und Probetraining über Formi, mit Vorschau — ' + gut + ' Prüfungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
