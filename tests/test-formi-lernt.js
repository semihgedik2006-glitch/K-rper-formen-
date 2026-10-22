/* ══════════════════════════════════════════════════════════════════════
   FORMI LERNT — DIE LEITUNG GIBT FREI (Runde 183, 22.10.2026)

   Aus dem Betrieb: „wie können wir ihm mehr wissen geben das sich die
   ki halt weiter entwickelt" — und auf den Vorschlag, dass auch die
   Studioleitungen freigeben: „dein vorschlag klingt super".

   Geprüft (mit der Attrappe, die Function antwortet aus dem Test):
    1. Chef und Leitung sehen bei Formi die Karte „Formi lernt";
       Mitarbeiter nicht, und für sie wird auch nichts abgefragt.
    2. EIN Vorschlag zur Zeit: „1 von N", Art, Thema, Begründung, der
       Text im Feld; der bisherige Text hinter „ansehen".
    3. „Übernehmen" schickt den GEÄNDERTEN Text, danach kommt der
       nächste. „Verwerfen" schickt gut=false.
    4. Selbsttest-Fragen sind nicht änderbar (kein Textfeld).
    5. Eigener Vorschlag: „Übernehmen" ist aus, mit Hinweis.
    6. „Wissen vorschlagen": Formular, Abschicken mit Thema und Text;
       zu kurz → Hinweis, kein Aufruf.
    7. Fehler (z. B. Worker noch nicht 2.14) steht ehrlich in der Karte.
    8. Fremder Text wird nicht als HTML ausgeführt.
    9. Jeder Knopf der Karte: Trefferfläche ≥ 44 × 44 per Hit-Test bei
       320 / 390 / 430 / 820 / 1280 / 1440 / 1920, normal und kompakt.
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

const LISTE = [
  { id: 7, art: 'import', wissenId: 4, quelle: 'Schulung „Das Beratungsgespräch — vom Anruf bis zur Empfehlung“', thema: 'Westen waschen', inhalt: 'Westen bei 30 Grad im Schonprogramm.', alt: 'Westen bei 40 Grad.', begruendung: 'Ändert Eintrag Nr. 4. Quelle: Schulung', von: 'Lea', eigen: false },
  { id: 8, art: 'frage', wissenId: 5, thema: 'Kunde sagt kurzfristig ab', inhalt: 'Was mach ich, wenn einer 10 Minuten vorher absagt?', alt: '', begruendung: 'Formi hat diese Frage nicht gefunden.', eigen: false },
  { id: 9, art: 'import', thema: '<img src=x onerror="window.__xss=1">Handtücher', inhalt: 'Handtücher liegen im Schrank links.', begruendung: 'Neues Wissen.', eigen: true }
];

async function oeffne(b, w, h, stub, antwort) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript({ path: SP + '/' + stub });
  await p.addInitScript(({ liste, antwort }) => {
    window.__aufrufe = [];
    window.__sammelRest = 45;
    window.__antwort = window.__antwort || {};
    let l = JSON.parse(JSON.stringify(liste));
    window.__antwort.gehirnWissen = (d) => {
      window.__aufrufe.push(d);
      if (antwort === 'fehler') return Promise.reject({ code: 'functions/failed-precondition', message: 'Formi braucht dafür noch das Update 2.14 im Leitstand-Server.' });
      if (d.art === 'liste') return Promise.resolve({ data: { anzahl: l.length, liste: l, gruppen: window.__sammelRest > 0 ? [{ quelle: 'Schulung „Das Beratungsgespräch — vom Anruf bis zur Empfehlung“', anzahl: window.__sammelRest }] : [] } });
      if (d.art === 'entscheiden' && d.quelle) {
        const n = Math.min(20, window.__sammelRest); window.__sammelRest -= n;
        if (!window.__sammelRest) l = l.filter(x => x.quelle !== d.quelle);
        return new Promise(res => setTimeout(() => res({ data: { ok: true, erledigt: n, fehler: 0, uebersprungen: 0, uebrig: window.__sammelRest } }), 80));
      }
      if (d.art === 'entscheiden') { l = l.filter(x => x.id !== d.id); return Promise.resolve({ data: { ok: true, text: d.gut ? 'Übernommen.' : 'Verworfen.' } }); }
      return Promise.resolve({ data: { neu: 1, schonDa: 0, ungueltig: 0 } });
    };
  }, { liste: LISTE, antwort: antwort || '' });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(700);
  /* Über „Alles" → Formi, wie ein Mensch (zwei Tipps). */
  await p.evaluate(async () => {
    const lade = document.getElementById('allesLade');
    if (lade.hidden) document.getElementById('bereichKopf').click();
    for (let i = 0; i < 50 && !document.querySelector('#allesLadeInhalt .al-zeile'); i++) await new Promise(r => setTimeout(r, 100));
    const z = document.querySelector('#allesLadeInhalt [data-alles="gehirn"]');
    if (z) z.click();
  });
  await p.waitForTimeout(700);
  p._ctx = ctx;
  return p;
}
const karte = (p) => p.evaluate(() => {
  const k = document.getElementById('gehirnLernt');
  return { sichtbar: !!k && k.getClientRects().length > 0, text: k ? k.innerText : '', feld: (document.getElementById('glText') || {}).value,
    uebernehmenAus: !!(k && k.querySelector('[data-glurteil="1"]') && k.querySelector('[data-glurteil="1"]').disabled), aufrufe: window.__aufrufe.slice(), xss: !!window.__xss };
});

const TREFFER = (el) => {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0 };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--;
  while (u < innerHeight - 1 && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--;
  while (re < innerWidth - 1 && trifft(re + 1, cy)) re++;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1) };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── Chef, Rechner 1440 × 900 ──');
    let p = await oeffne(b, 1440, 900, 'stub-chef.js');
    let k = await karte(p);
    pruefe('Karte „Formi lernt" ist da, mit „1 von 3"', k.sichtbar && /Formi lernt/.test(k.text) && /1 von 3/.test(k.text), k.text.slice(0, 80));
    pruefe('Art, Thema, Begründung und Text im Feld', /Änderung/.test(k.text) && /Westen waschen/.test(k.text) && /Quelle: Schulung/.test(k.text) && k.feld === LISTE[0].inhalt, JSON.stringify(k).slice(0, 200));
    /* „1 von N" hiess erst .gl-zahl — die Klasse gab es schon (ein
       Abzeichen, absolut gesetzt), und der Zähler rutschte halb aus der
       Karte. Deshalb: liegt er ganz in der Karte? */
    pruefe('„1 von 3" liegt ganz in der Karte', await p.evaluate(() => { const k = document.getElementById('gehirnLernt').getBoundingClientRect(), z = document.querySelector('#gehirnLernt .gl-stand').getBoundingClientRect(); return z.width > 0 && z.left >= k.left && z.right <= k.right - 8 && z.top >= k.top; }));
    pruefe('bisheriger Text liegt hinter „ansehen"', await p.evaluate(() => { const d = document.querySelector('#gehirnLernt details'); return !!d && !d.open && /40 Grad/.test(d.textContent); }));
    /* Sammelfreigabe (22.10.2026, „ja sind zu viele klicks") */
    const sk = () => p.evaluate(() => { const b = document.querySelector('#gehirnLernt [data-glsammel]'); return b ? b.textContent : null; });
    pruefe('unter einem Schulungs-Vorschlag steht „Alle 45 … übernehmen"', /^Alle 45 aus Schulung „Das Beratungsgespräch — vom Anruf bis zur Empfehlung“ übernehmen$/.test(await sk() || ''), await sk());
    await p.click('#gehirnLernt [data-glsammel]'); await p.waitForTimeout(150);
    let kk = await karte(p);
    pruefe('erster Tipp fragt nur nach, schickt nichts', /Wirklich alle 45/.test(await sk() || '') && !kk.aufrufe.some(x => x.quelle) && /ungelesen/.test(kk.text), await sk());
    await p.click('#gehirnLernt [data-glsammel]'); await p.waitForTimeout(900);
    kk = await karte(p);
    const sa = kk.aufrufe.filter(x => x.art === 'entscheiden' && x.quelle);
    pruefe('zweiter Tipp: so lange, bis nichts übrig ist (3 Aufrufe, je Quelle und gut=true)', sa.length === 3 && sa.every(x => x.quelle === 'Schulung „Das Beratungsgespräch — vom Anruf bis zur Empfehlung“' && x.gut === true && !('inhalt' in x) && !('id' in x)), JSON.stringify(sa));
    pruefe('danach: neu geladen, Schulungs-Vorschläge weg, kein Sammelknopf mehr', /Kunde sagt kurzfristig ab/.test(kk.text) && /1 von 2/.test(kk.text) && !(await sk()), kk.text.slice(0, 120));
    await p._ctx.close();
    p = await oeffne(b, 1440, 900, 'stub-chef.js');
    await p.evaluate(() => { window.__sammelRest = 0; });
    await p.fill('#glText', 'Westen bei 30 Grad, danach hängend trocknen.');
    await p.click('#gehirnLernt [data-glurteil="1"]');
    await p.waitForTimeout(400);
    k = await karte(p);
    const e1 = k.aufrufe.find(x => x.art === 'entscheiden');
    pruefe('„Übernehmen" schickt den geänderten Text', e1 && e1.id === 7 && e1.gut === true && e1.inhalt === 'Westen bei 30 Grad, danach hängend trocknen.', JSON.stringify(e1));
    pruefe('danach kommt der nächste Vorschlag (Selbsttest, ohne Textfeld)', /Kunde sagt kurzfristig ab/.test(k.text) && /1 von 2/.test(k.text) && k.feld === undefined && /Selbsttest/.test(k.text), k.text.slice(0, 160));
    await p.click('#gehirnLernt [data-glweiter]');
    await p.waitForTimeout(200);
    k = await karte(p);
    pruefe('„Später" blättert weiter', /2 von 2/.test(k.text) && /Handtücher/.test(k.text));
    pruefe('fremder Text wird nicht ausgeführt', !k.xss && /<img/.test(k.text));
    pruefe('eigener Vorschlag: „Übernehmen" ist aus, mit Hinweis', k.uebernehmenAus && /jemand anderes aus der Leitung/.test(k.text));
    await p.click('#gehirnLernt [data-glurteil="0"]');
    await p.waitForTimeout(400);
    k = await karte(p);
    const e2 = k.aufrufe.filter(x => x.art === 'entscheiden')[1];
    pruefe('„Verwerfen" schickt gut=false, ohne Text', e2 && e2.id === 9 && e2.gut === false && !('inhalt' in e2), JSON.stringify(e2));

    await p.click('#gehirnLernt [data-glneu="auf"]');
    await p.waitForTimeout(200);
    await p.fill('#glNeuThema', 'Ha');
    await p.fill('#glNeuText', 'kurz');
    await p.click('#gehirnLernt [data-glneu="senden"]');
    await p.waitForTimeout(200);
    k = await karte(p);
    pruefe('zu kurz: kein Aufruf, das Getippte bleibt', !k.aufrufe.some(x => x.art === 'vorschlagen') && await p.inputValue('#glNeuThema') === 'Ha');
    await p.fill('#glNeuThema', 'Handtücher nachfüllen');
    await p.fill('#glNeuText', 'Handtücher liegen im Lager, Regal 2.');
    await p.click('#gehirnLernt [data-glneu="senden"]');
    await p.waitForTimeout(400);
    k = await karte(p);
    const v = k.aufrufe.find(x => x.art === 'vorschlagen');
    pruefe('„Wissen vorschlagen" schickt Thema und Text', v && v.thema === 'Handtücher nachfüllen' && v.inhalt === 'Handtücher liegen im Lager, Regal 2.', JSON.stringify(v));
    pruefe('keine Fehler auf der Seite', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();

    console.log('\n── Leitung, Handy 390 × 844 ──');
    p = await oeffne(b, 390, 844, 'stub-leiter.js');
    k = await karte(p);
    pruefe('Leitung sieht die Karte', k.sichtbar && /1 von 3/.test(k.text));
    await p._ctx.close();

    console.log('\n── Mitarbeiter ──');
    p = await oeffne(b, 390, 844, 'stub-mitarbeiter.js');
    k = await karte(p);
    pruefe('Mitarbeiter sehen die Karte nicht, und es wird nichts abgefragt', !k.sichtbar && !k.aufrufe.length, JSON.stringify(k.aufrufe));
    await p._ctx.close();

    console.log('\n── Fehler ──');
    p = await oeffne(b, 1280, 800, 'stub-chef.js', 'fehler');
    k = await karte(p);
    pruefe('fehlt das Update, steht das ehrlich in der Karte', k.sichtbar && /Update 2\.14/.test(k.text), k.text.slice(0, 120));
    await p._ctx.close();

    console.log('\n── Trefferflächen ──');
    for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      p = await oeffne(b, w, h, 'stub-chef.js');
      for (const dichte of ['normal', 'kompakt']) {
        if (dichte === 'kompakt') { await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt')); await p.waitForTimeout(150); }
        for (const formOffen of [false, true]) {
          if (formOffen) { await p.evaluate(() => { const x = document.querySelector('#gehirnLernt [data-glneu="auf"]'); if (x) x.click(); }); await p.waitForTimeout(150); }
          const n = await p.evaluate(() => document.querySelectorAll('#gehirnLernt button, #gehirnLernt summary').length);
          const klein = [];
          for (let i = 0; i < n; i++) {
            await p.evaluate((i) => document.querySelectorAll('#gehirnLernt button, #gehirnLernt summary')[i].scrollIntoView({ block: 'center', inline: 'nearest' }), i);
            await p.waitForTimeout(60);
            const m = await p.evaluate((i) => {
              const el = document.querySelectorAll('#gehirnLernt button, #gehirnLernt summary')[i];
              const r = el.getBoundingClientRect();
              const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
              const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
              const name = (el.textContent || '').trim().slice(0, 24);
              if (!trifft(cx, cy)) return { name, w: 0, h: 0, imBild: false };
              let o = cy, u = cy, l = cx, re = cx;
              while (o > 0 && trifft(cx, o - 1)) o--;
              while (u < innerHeight - 1 && trifft(cx, u + 1)) u++;
              while (l > 0 && trifft(l - 1, cy)) l--;
              while (re < innerWidth - 1 && trifft(re + 1, cy)) re++;
              return { name, w: Math.round(re - l + 1), h: Math.round(u - o + 1), imBild: r.left >= 0 && r.right <= innerWidth + 0.5 };
            }, i);
            if (m.w < 44 || m.h < 44 || !m.imBild) klein.push(m);
          }
          pruefe(`${w} px ${dichte}${formOffen ? ' (Formular offen)' : ''}: ${n} Knöpfe ≥ 44 × 44 und im Bild`, n >= 3 && !klein.length, JSON.stringify(klein));
        }
        await p.evaluate(() => { const x = document.querySelector('#gehirnLernt [data-glneu="zu"]'); if (x) x.click(); });
      }
      await p._ctx.close();
    }
  } finally { await b.close(); }
  console.log(schlecht
    ? '\n✗ Formi lernt: ' + schlecht + ' von ' + (gut + schlecht) + ' falsch'
    : '\n✓ Formi lernt: Leitung gibt frei, vier Augen, Knöpfe gemessen — ' + gut + ' Prüfungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message + (process.env.STAPEL ? e.stack : '')); process.exit(1); });
