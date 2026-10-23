/* ══════════════════════════════════════════════════════════════════════
   FORMI: NEUES GESICHT, EIGENLEBEN, KLEINE REAKTIONEN (Runde 231, 23.10.2026)

   Aus dem Betrieb: „ich würde mir ein anderes gesicht wünschen was süsser
   aussieht und das formi emotionen und reaktionen auch laufen lässt wenn
   nichts getan wird". Auf die Auswahl: Gesicht „M1" (Kulleraugen aus
   Licht), Eigenleben „Mittel", und zur Ideenliste „mir gefällt alles
   davon".

   Geprüft wird:
    1. Gesicht: zwei Leuchtaugen mit Glanzpunkt, zwei Bögen (^ froh /
       zu im Schlaf), zwei Bäckchen, ein Mund — an der Kugel, im
       Fensterkopf und an der grossen Figur im Fenster. Im Schlaf sind die
       Augen aus und die Bögen an.
    2. Freude: die Augen gehen aus, die Bögen an (opacity), Bäckchen glühen.
    3. Eigenleben: jede Kleinigkeit (summt, faengt, niest, zwinkert,
       kopfschief, huepft, umschauen) läuft, ENDLICH, nur transform/
       opacity; mit Zeichen (Noten, Sterne) wo vorgesehen. Im Schlaf und
       bei „weniger Bewegung" passiert nichts. Der Planer läuft (Zeitgeber
       gesetzt) und weckt Formi nicht (Müdewerden bleibt möglich).
    4. Reaktionen: Fehlerhinweis → verlegen mit Schweisstropfen; wildes
       Scrollen → schwindelig mit kreisenden Sternen; Antippen der Figur
       im Fenster → kichern, dreimal schnell → schwindelig.
    5. Ohne Seitenfehler.

   Was das NICHT prüft: wie süss es aussieht (Bildschirmfotos im Bericht),
   echte Handys, die Arbeit je Bild beim Eigenleben (nur transform/opacity).
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
async function oeffne(b, w, h, opt) {
  opt = opt || {};
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block',
    reducedMotion: opt.wenigBewegung ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await p.addInitScript({ path: SP + '/stub-chef.js' });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(1200);
  p._ctx = ctx;
  return p;
}
/* Alle laufenden Animationen unter einem Element: Anzahl, endlich?, welche Eigenschaften. */
const ANIM = (sel) => {
  const k = document.querySelector(sel);
  const an = k.getAnimations({ subtree: true }).filter(a => a.playState === 'running' && !(a.animationName && /formiScheibe|fkBahn|fk/.test(a.animationName) && a.effect.getTiming().iterations === Infinity));
  const eig = new Set();
  an.forEach(a => (a.effect.getKeyframes ? a.effect.getKeyframes() : []).forEach(f => Object.keys(f).forEach(x => { if (!['offset', 'easing', 'composite', 'computedOffset'].includes(x)) eig.add(x); })));
  return { n: an.filter(a => !a.animationName).length, endlos: an.some(a => !a.animationName && a.effect.getTiming().iterations === Infinity), eig: [...eig] };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── 1 Gesicht ──');
    {
      const p = await oeffne(b, 1440, 900);
      await p.evaluate(() => window.__formiLebt.uhrenAus());
      const g = await p.evaluate(() => {
        const z = (sel) => ['.fk-auge', '.fk-auge b', '.fk-froh', '.fk-backe', '.fk-mund'].map(t => document.querySelectorAll(sel + ' ' + t).length).join(',');
        const au = getComputedStyle(document.querySelector('#formiKugel .fk-auge'));
        const fr = getComputedStyle(document.querySelector('#formiKugel .fk-froh'));
        return { kugel: z('#formiKugel'), kopf: z('#jarvis .jv-titel'), leuchtet: /radial-gradient/.test(au.backgroundImage) && /rgba?\(95, 225, 255/.test(au.boxShadow),
          frohAus: +fr.opacity === 0, blend: getComputedStyle(document.querySelector('#formiKugel .fk-gesicht')).mixBlendMode };
      });
      pruefe('Kugel: 2 Leuchtaugen mit Glanz, 2 Bögen, 2 Bäckchen, 1 Mund', g.kugel === '2,2,2,2,1', g.kugel);
      pruefe('Fensterkopf: dasselbe Gesicht', g.kopf === '2,2,2,2,1', g.kopf);
      pruefe('die Augen leuchten (Verlauf + Schein in Formis Cyan)', g.leuchtet);
      pruefe('Bögen ruhend aus; Gesicht ohne „difference" (blieb auf Weiss sonst braun)', g.frohAus && g.blend === 'normal', JSON.stringify(g));
      // Freude
      const f = await p.evaluate(() => {
        window.__formiLebt.fuehlt('freut');
        const kf = (sel) => document.querySelector(sel).getAnimations().map(a => a.effect.getKeyframes().map(x => x.opacity).join('/'));
        return { auge: kf('#formiKugel .fk-auge'), froh: kf('#formiKugel .fk-froh'), backe: document.querySelector('#formiKugel .fk-backe').getAnimations().length };
      });
      pruefe('Freude: die Augen gehen aus, die Bögen an, die Bäckchen glühen', f.auge.some(x => /1\/0\/0\/1/.test(x)) && f.froh.some(x => /^0\/1/.test(x)) && f.backe > 0, JSON.stringify(f));
      /* Die Freude läuft mit Ausbruch und Rücksog gut 2,5 s und weckt dabei —
         erst danach einschlafen lassen. */
      await p.waitForTimeout(3200);
      // Schlaf
      await p.evaluate(() => window.__formiLebt.einschlafen()); await p.waitForTimeout(500);
      const s = await p.evaluate(() => ({ kl: document.getElementById('formiKugel').className, auge: +getComputedStyle(document.querySelector('#formiKugel .fk-auge')).opacity, froh: +getComputedStyle(document.querySelector('#formiKugel .fk-froh')).opacity }));
      pruefe('im Schlaf: Augen aus, geschlossene Bögen an', s.auge === 0 && s.froh === 1, JSON.stringify(s));
      // Fensterfigur
      await p.mouse.move(400, 300); await p.waitForTimeout(200);
      await p.click('#formiKugel'); await p.waitForTimeout(1500);
      const fz = await p.evaluate(() => ['.fk-auge', '.fk-froh', '.fk-backe'].map(t => document.querySelectorAll('#jarvisVerlauf .jv-start-figur ' + t).length).join(','));
      pruefe('grosse Figur im Fenster: Leuchtaugen, Bögen, Bäckchen', fz === '2,2,2', fz);
      pruefe('ohne Seitenfehler', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }

    console.log('\n── 2 Eigenleben ──');
    {
      const p = await oeffne(b, 1440, 900);
      await p.evaluate(() => window.__formiLebt.uhrenAus());
      await p.mouse.move(400, 300); await p.waitForTimeout(200);
      const ZEICHEN = { summt: 'note', niest: 'stern' };
      /* Umschauen bewegt den Glanz in den Augen (Blick als kurze Web Animation mit fill). */
      const b0 = await p.evaluate(() => getComputedStyle(document.querySelector('#formiKugel .fk-auge b')).transform);
      const ru = await p.evaluate(() => window.__formiLebt.leben('umschauen'));
      await p.waitForTimeout(400);
      const b1 = await p.evaluate(() => getComputedStyle(document.querySelector('#formiKugel .fk-auge b')).transform);
      pruefe(`umschauen: der Blick wandert (${b0} → ${b1})`, ru === 'umschauen' && b0 !== b1, JSON.stringify({ ru, b0, b1 }));
      await p.waitForTimeout(1500);
      for (const art of ['summt', 'faengt', 'niest', 'zwinkert', 'kopfschief', 'huepft']) {
        const zuletzt0 = await p.evaluate(() => Date.now());
        const r = await p.evaluate((a) => window.__formiLebt.leben(a), art);
        await p.waitForTimeout(art === 'niest' ? 520 : 150);
        const a = await p.evaluate(ANIM, '#formiKugel');
        const z = ZEICHEN[art] ? await p.evaluate((c) => !!document.querySelector('#formiKugel .fk-zeichen.' + c + ' svg'), ZEICHEN[art]) : true;
        pruefe(`${art}: läuft (${a.n} Animationen), endlich, nur transform/opacity${ZEICHEN[art] ? ', mit Zeichen (' + ZEICHEN[art] + ')' : ''}`,
          r === art && a.n > 0 && !a.endlos && a.eig.every(e => e === 'transform' || e === 'opacity') && z, JSON.stringify({ r, a, z }));
        await p.waitForTimeout(2600);
      }
      /* Das Eigenleben weckt nicht: wer nichts tut, wird trotzdem müde. */
      const muede = await p.evaluate(() => { const vor = window.__formiLebt.muede(); window.__formiLebt.leben('summt'); return { vor, nach: document.getElementById('formiKugel').classList.contains('fk-muede') }; });
      pruefe('Eigenleben weckt nicht (müde bleibt müde)', muede.vor && muede.nach, JSON.stringify(muede));
      await p.evaluate(() => window.__formiLebt.einschlafen()); await p.waitForTimeout(300);
      const imSchlaf = await p.evaluate(() => window.__formiLebt.leben('huepft'));
      pruefe('im Schlaf: kein Eigenleben', imSchlaf === '', String(imSchlaf));
      pruefe('ohne Seitenfehler', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
    {
      /* Der Planer: nach dem Start ist ein Zeitgeber gesetzt; nach 8–20 s
         passiert von selbst etwas (gemessen über 21 s). */
      const p = await oeffne(b, 1440, 900);
      await p.mouse.move(400, 300);
      let gesehen = '';
      const t0 = Date.now();
      while (Date.now() - t0 < 21000) { await p.waitForTimeout(1000); gesehen = await p.evaluate(() => window.__formiLebt.lebenZuletzt()); if (gesehen) break; }
      pruefe(`Formi tut von selbst etwas: „${gesehen}" nach ${Math.round((Date.now() - t0) / 1000)} s, ohne Bedienung`, !!gesehen && Date.now() - t0 >= 7000, gesehen);
      await p._ctx.close();
    }
    {
      const p = await oeffne(b, 1440, 900, { wenigBewegung: true });
      const r = await p.evaluate(() => { const x = window.__formiLebt.leben('huepft'); return { x, n: document.getElementById('formiKugel').getAnimations({ subtree: true }).filter(a => !a.animationName).length }; });
      pruefe('„weniger Bewegung": kein Eigenleben', r.x === '' && r.n === 0, JSON.stringify(r));
      await p._ctx.close();
    }

    console.log('\n── 3 Reaktionen ──');
    {
      const p = await oeffne(b, 1440, 900);
      await p.evaluate(() => window.__formiLebt.uhrenAus());
      await p.mouse.move(400, 300); await p.waitForTimeout(200);
      await p.evaluate(() => window.__formiLebt.fehlerHinweis()); await p.waitForTimeout(900);
      pruefe('Fehlerhinweis: Formi wird verlegen (Schweisstropfen)', await p.evaluate(() => !!document.querySelector('#formiKugel .fk-zeichen.tropfen svg')));
      await p.waitForTimeout(1800);
      for (let i = 0; i < 12; i++) await p.mouse.wheel(0, 500);
      await p.waitForTimeout(250);
      const sw = await p.evaluate(() => document.querySelectorAll('#formiKugel .fk-zeichen.kreis').length);
      pruefe('wildes Scrollen: schwindelig, drei Sterne kreisen', sw === 3, String(sw));
      await p.waitForTimeout(2200);
      await p.click('#formiKugel'); await p.waitForTimeout(1500);
      await p.click('#jarvisVerlauf .jv-start-figur'); await p.waitForTimeout(120);
      const ki = await p.evaluate(() => document.querySelector('#jarvisVerlauf .jv-start-figur .fk-froh').getAnimations().length);
      pruefe('Figur im Fenster antippen: Formi kichert (Augen zu Bögen)', ki > 0, String(ki));
      await p.waitForTimeout(1000);
      for (let i = 0; i < 3; i++) { await p.click('#jarvisVerlauf .jv-start-figur'); await p.waitForTimeout(150); }
      const kr = await p.evaluate(() => document.querySelectorAll('#jarvisVerlauf .jv-start-figur .fk-zeichen.kreis').length);
      pruefe('… dreimal schnell: schwindelig', kr === 3, String(kr));
      pruefe('ohne Seitenfehler', !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }
  } catch (e) {
    console.log('Fehler: ' + e.message.split('\n')[0]);
    schlecht++;
  }
  await b.close();
  console.log(schlecht ? `✗ Formi Eigenleben: ${schlecht} von ${gut + schlecht} falsch` : `✓ Formi Eigenleben: ${gut} Zusicherungen`);
  process.exit(schlecht ? 1 : 0);
})();
