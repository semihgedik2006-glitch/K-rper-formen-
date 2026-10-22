/* ══════════════════════════════════════════════════════════════════════
   FORMI ALS KUMPEL AUS DEM STUDIO (Runde 196, 22.10.2026)

   Aus dem Betrieb: „lass uns formi wirklich richtig persönlichkeit
   geben" — gewählt: „Kumpel aus dem Studio".

   Geprüft:
    1. Tagesgruss: kurz nach dem Start eine Blase mit Gruss, Vorname und
       einem Satz zur Lage — einmal am Tag je Gerät.
    2. Die Blase verdeckt nichts: keine Trefferfläche, ganz im Bild, über
       der Kugel — bei 320 / 390 / 430 / 820 / 1280 / 1440 / 1920.
    3. Höchstens eine Blase je 45 s (der Gruss ausgenommen).
    4. Still bei „Gefühle der Kugel: Aus" und im sachlichen Ton.
    5. Öffnet man Formi, ist die Blase weg; solange Formi offen ist,
       kommt keine.
    6. Erster Haken des Tages → Lob; dritter Haken binnen 20 s → Spruch.
    7. Der Satz zur Lage: Montagmorgen, Freitagnachmittag, Abend.
    8. Leerer Verlauf: im lockeren Ton der Satz zur Lage, im sachlichen
       „Ich bin Formi."
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
async function oeffne(b, w, h, persona, vorher) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(({ persona, vorher }) => {
    try {
      if (persona) localStorage.setItem('kf_jv_persona', JSON.stringify(persona));
      if (vorher) Object.keys(vorher).forEach(k => localStorage.setItem(k, vorher[k]));
    } catch (e) {}
  }, { persona: persona || null, vorher: vorher || null });
  await p.addInitScript({ path: SP + '/stub-chef.js' });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  p._ctx = ctx;
  return p;
}
const blase = (p) => p.evaluate(() => {
  const b = document.getElementById('formiBlase'), k = document.getElementById('formiKugel');
  if (!b || b.hidden || !b.getClientRects().length) return { da: false };
  const r = b.getBoundingClientRect(), kr = k.getBoundingClientRect();
  /* Runde 198 (aus dem Betrieb, 22.10.2026, „1. a"): am Rechner wohnt die
     Kugel unten in der Seitenleiste. Dort spricht Formi nach rechts in die
     Seite hinein – „über der Kugel" heisst seitdem: über ihr ODER neben
     ihr, und nie auf einem Knopf der Seitenleiste (vorher lag die Blase
     auf „Tastenkürzel"). */
  const neben = r.left >= kr.right - 1 && r.bottom <= kr.bottom + 1 && r.bottom >= kr.top;
  const aufKnopf = [...document.querySelectorAll('#side button')].filter(e => e.getClientRects().length).some(e => {
    const q = e.getBoundingClientRect();
    return !(q.bottom <= r.top || q.top >= r.bottom || q.right <= r.left || q.left >= r.right);
  });
  return { da: true, text: b.textContent, pe: getComputedStyle(b).pointerEvents,
    imBild: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5,
    ueberKugel: (r.bottom <= kr.top + 1 || neben) && !aufKnopf, aufKnopf, w: Math.round(r.width) };
});

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── Tagesgruss und Lage ──');
    let p = await oeffne(b, 1440, 900);
    await p.waitForTimeout(3300);
    let x = await blase(p);
    pruefe('Tagesgruss erscheint kurz nach dem Start, mit Vorname', x.da && /(Guten Morgen|Hallo|Guten Abend), Test!/.test(x.text), JSON.stringify(x));
    pruefe('die Blase hat keine Trefferfläche und steht über der Kugel, im Bild', x.pe === 'none' && x.imBild && x.ueberKugel, JSON.stringify(x));
    const l = await p.evaluate(() => ({
      mo: window.__formiLebt.lage(new Date(2026, 9, 19, 8, 30).getTime()),
      fr: window.__formiLebt.lage(new Date(2026, 9, 23, 15, 0).getTime()),
      ab: window.__formiLebt.lage(new Date(2026, 9, 21, 20, 0).getTime()),
      fruh: window.__formiLebt.lage(new Date(2026, 9, 21, 7, 30).getTime())
    }));
    pruefe('Lage: Montagmorgen → Kaffee, Freitag → Feierabend, Abend → Endspurt, früh → Westen/Vogel',
      /Kaffee/.test(l.mo) && /Freitag/.test(l.fr) && /(Endspurt|geschafft)/.test(l.ab) && /(Westen|Vogel)/.test(l.fruh), JSON.stringify(l));
    const zweite = await p.evaluate(() => window.__formiLebt.sagt('Noch ein Satz'));
    pruefe('höchstens eine Blase je 45 s', zweite === false);
    await p.evaluate(() => window.__formiLebt.pauseVorbei());
    await p.click('#formiKugel'); await p.waitForTimeout(300);
    x = await blase(p);
    const offen = await p.evaluate(() => window.__formiLebt.sagt('Während offen'));
    pruefe('Formi öffnen: Blase weg, und solange offen kommt keine', !x.da && offen === false, JSON.stringify(x));
    const leer = await p.evaluate(() => (document.querySelector('#jarvisVerlauf .jv-unter') || {}).textContent || '');
    pruefe('leerer Verlauf (locker): Satz zur Lage statt „Ich bin Formi"', !/^Ich bin Formi/.test(leer) && /Auftrag/.test(leer), leer);
    pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();

    console.log('\n── Einmal am Tag ──');
    const heute = await (async () => { const q = await oeffne(b, 390, 844); const t = await q.evaluate(() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }); await q._ctx.close(); return t; })();
    p = await oeffne(b, 390, 844, null, { kf_formi_gruss: heute });
    await p.waitForTimeout(3300);
    x = await blase(p);
    pruefe('schon gegrüsst heute → kein zweiter Gruss', !x.da, JSON.stringify(x));
    console.log('\n── Haken ──');
    await p.evaluate(() => window.__formiLebt.haken());
    await p.waitForTimeout(200);
    x = await blase(p);
    pruefe('erster Haken des Tages → Lob', x.da && /(Erster Haken|der erste|Nummer eins)/.test(x.text), JSON.stringify(x));
    await p.evaluate(() => { window.__formiLebt.pauseVorbei(); window.__formiLebt.haken(); window.__formiLebt.haken(); });
    await p.waitForTimeout(200);
    x = await blase(p);
    pruefe('dritter Haken binnen 20 s → Spruch zur Serie', x.da && /(Drei Haken|Turbo|nichts mehr zu tun)/.test(x.text), JSON.stringify(x));
    await p.waitForTimeout(4800);
    x = await blase(p);
    pruefe('nach 4,5 s ist die Blase wieder weg', !x.da);
    await p._ctx.close();

    console.log('\n── Still, wenn gewünscht ──');
    for (const [persona, name] of [[{ gefuehle: 'aus' }, 'Gefühle aus'], [{ ton: 'sachlich' }, 'Ton sachlich']]) {
      p = await oeffne(b, 1440, 900, persona);
      await p.waitForTimeout(3300);
      x = await blase(p);
      const s = await p.evaluate(() => window.__formiLebt.sagt('Test', true));
      pruefe(name + ': kein Gruss, keine Blase', !x.da && s === false, JSON.stringify(x));
      if (persona.ton) {
        await p.click('#formiKugel'); await p.waitForTimeout(300);
        const t = await p.evaluate(() => (document.querySelector('#jarvisVerlauf .jv-unter') || {}).textContent || '');
        pruefe('sachlich: leerer Verlauf sagt „Ich bin Formi."', /^Ich bin Formi\./.test(t), t);
      }
      await p._ctx.close();
    }

    console.log('\n── Blase im Bild, auf jeder Breite ──');
    for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      p = await oeffne(b, w, h, null, { kf_formi_gruss: heute });
      await p.waitForTimeout(900);
      await p.evaluate(() => window.__formiLebt.sagt('Läuft bei dir! Drei Haken in 20 Sekunden — und das an einem Donnerstag.', true));
      await p.waitForTimeout(250);
      x = await blase(p);
      pruefe(w + ' px: Blase ganz im Bild, über der Kugel, ohne Trefferfläche (' + x.w + ' px breit)', x.da && x.imBild && x.ueberKugel && x.pe === 'none', JSON.stringify(x));
      await p._ctx.close();
    }
  } finally { await b.close(); }
  console.log(schlecht
    ? '\n✗ Formi als Kumpel: ' + schlecht + ' von ' + (gut + schlecht) + ' falsch'
    : '\n✓ Formi als Kumpel: Gruss, Lob, Spruch, still auf Wunsch, verdeckt nichts — ' + gut + ' Prüfungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
