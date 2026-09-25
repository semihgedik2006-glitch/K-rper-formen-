/* ══════════════════════════════════════════════════════════════════════
   RECHTLICHES (Runde 114): AGB, Speicherhinweis, Zustimmung an der Kasse

   Aus dem Betrieb, 25.9.2026: „ergänze alle rechtlichen schritte und
   füge ein was nötig ist ebenso wie eine AGB und eine cookie zeile die
   jeder nutzer einmal anklicken muss".

   1. AGB: „Rechtliches" hat einen dritten Reiter „AGB" mit § 1 bis § 11
      — OHNE die Anmerkungen aus dem Entwurf („Ich bin kein Anwalt",
      „NICHT GEPRÜFT"), die für den Anwalt sind, nicht für den Kunden.
   2. Derselbe Stand in App und Server (AGB_STAND), sonst lehnt die
      Kasse jede Zustimmung ab.
   3. Speicherhinweis: beim ERSTEN Öffnen unten zu sehen, auch vor der
      Anmeldung; „Verstanden" blendet ihn aus, und nach dem Neuladen
      bleibt er weg. „Mehr dazu" öffnet die Datenschutzerklärung mit
      „Auf deinem Gerät". Beide Knöpfe ≥ 44 × 44, 390 und 1440 px.
   4. Kasse: ohne Haken ist „Abo buchen" gesperrt; mit Haken geht es
      weiter. Der Haken nennt Unternehmer, AGB und AV-Vertrag.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 200) : '')); }
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

(async () => {
  console.log('\n── Derselbe AGB-Stand in App und Server ──');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const fn = fs.readFileSync(path.join(__dirname, '..', 'functions', 'index.js'), 'utf8');
  const a = (html.match(/var AGB_STAND = '([^']+)'/) || [])[1];
  const s = (fn.match(/const AGB_STAND = '([^']+)'/) || [])[1];
  pruefe('App ' + a + ' = Server ' + s, !!a && a === s);
  pruefe('der Server verlangt die Zustimmung, bevor er zur Kasse schickt', /data\.unternehmer !== true \|\| data\.zustimmung !== AGB_STAND/.test(fn));

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── Speicherhinweis beim ersten Öffnen ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    const fehler = [];
    p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    /* Die anderen Durchläufe sehen den Hinweis nicht (sie stehen für
       jemanden, der ihn schon bestätigt hat). Hier geht es um den
       ersten Besuch. */
    await p.addInitScript(() => { window.__speicherHinweisPruefen = true; });
    /* Ohne Anmeldung: dieselbe Nachbildung wie test-recht.js — das echte
       Firebase-SDK lädt hier nicht (CLAUDE.md), ohne sie stünde die App
       bei „Firebase konnte nicht geladen werden". */
    await p.addInitScript({ path: path.join(__dirname, 'stub-ohne-login.js') });
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2500);
    /* offsetParent ist bei position:fixed immer null — also die
       berechnete Anzeige prüfen. */
    let st = await p.evaluate(() => { const e = document.getElementById('speicherHinweis'); return e && !e.hidden && getComputedStyle(e).display !== 'none' ? e.textContent.replace(/\s+/g, ' ') : null; });
    pruefe(w + ' px: vor der Anmeldung steht der Hinweis da', !!st && /nur, was sie zum Funktionieren braucht/.test(st) && /Keine Werbe- oder Analyse-Cookies/.test(st), st);
    const m = await p.evaluate(async (SRC) => {
      const T = eval('(' + SRC + ')');
      return ['shOk', 'shMehr'].map(id => { const e = document.getElementById(id); return id + ':' + JSON.stringify(T(e)); });
    }, TREFFER.toString());
    pruefe(w + ' px: „Verstanden" und „Mehr dazu" treffen ≥ 44 × 44', m.every(x => { const o = JSON.parse(x.split(':').slice(1).join(':')); return o.w >= 44 && o.h >= 44; }), m.join(' '));
    const br = await p.evaluate(() => Math.round(document.getElementById('speicherHinweis').getBoundingClientRect().width));
    pruefe(w + ' px: am Rechner nicht über die volle Breite (' + br + ' px)', w < 800 || br <= 720, String(br));

    await p.click('#shMehr');
    await p.waitForTimeout(400);
    const ds = await p.evaluate(() => { const m = document.getElementById('rechtModal'); return m && m.classList.contains('show') ? document.getElementById('rechtInhalt').textContent : ''; });
    pruefe('„Mehr dazu" öffnet die Datenschutzerklärung mit „Auf deinem Gerät"', /Auf deinem Gerät/.test(ds) && /TDDDG/.test(ds), ds.slice(0, 120));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(200);

    await p.click('#shOk');
    await p.waitForTimeout(200);
    st = await p.evaluate(() => document.getElementById('speicherHinweis').hidden);
    pruefe('„Verstanden" blendet ihn aus', st === true);
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2000);
    st = await p.evaluate(() => document.getElementById('speicherHinweis').hidden);
    pruefe('nach dem Neuladen bleibt er weg (einmal je Gerät)', st === true);
    pruefe('ohne Skriptfehler', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  console.log('\n── AGB im Fenster „Rechtliches" ──');
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript({ path: path.join(__dirname, 'stub-ohne-login.js') });
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2000);
    await p.evaluate(() => document.querySelector('[data-rechtauf="impressum"]').click());
    await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelector('[data-recht="agb"]').click());
    await p.waitForTimeout(300);
    const t = await p.evaluate(() => document.getElementById('rechtInhalt').textContent);
    const paragraphen = (t.match(/§ \d+ /g) || []).length;
    pruefe('Reiter „AGB" zeigt § 1 bis § 11', /§ 1 Geltungsbereich/.test(t) && /§ 11 Schlussbestimmungen/.test(t), 'gezählt: ' + paragraphen);
    pruefe('mit Stand und „gilt für Unternehmen"', /Stand 25\.09\.2026/.test(t) && /Unternehmen \(§ 14 BGB\)/.test(t), t.slice(0, 160));
    pruefe('OHNE die Anmerkungen für den Anwalt', !/kein Anwalt/.test(t) && !/NICHT GEPRÜFT/.test(t) && !/Entscheidung, keine Formalie/.test(t));
    await ctx.close();
  }

  console.log('\n── Zustimmung an der Kasse (Demo, Chef) ──');
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
    const p = await ctx.newPage();
    const fehler = [];
    p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3000);
    await p.evaluate(() => { const a = document.querySelector('.mobnav [data-group="g-alles"]'); if (a) a.click(); });
    await p.waitForTimeout(500);
    await p.evaluate(() => { const k = document.querySelector('#allesLadeInhalt [data-alles="chef"], #allesSeite [data-alles="chef"]'); if (k) k.click(); });
    await p.waitForTimeout(700);
    await p.evaluate(() => { const t = document.querySelector('[data-ctab="system"]'); if (t) t.click(); });
    await p.waitForTimeout(900);
    const z = await p.evaluate(() => {
      const cb = document.getElementById('aboZustimmung'), btn = document.getElementById('aboBuchen');
      if (!cb || !btn) return null;
      const lab = cb.closest('label');
      lab.scrollIntoView({ block: 'center' });
      return { text: lab.textContent.replace(/\s+/g, ' '), gesperrt: btn.disabled, hoch: Math.round(lab.getBoundingClientRect().height) };
    });
    pruefe('der Haken nennt Unternehmer (§ 14 BGB), AGB und AV-Vertrag', !!z && /Unternehmen \(§ 14 BGB\)/.test(z.text) && /AGB/.test(z.text) && /Auftragsverarbeitung/.test(z.text), z && z.text);
    pruefe('ohne Haken ist „Abo buchen" gesperrt', !!z && z.gesperrt === true);
    pruefe('die Zeile mit dem Haken trifft ≥ 44 hoch (' + (z && z.hoch) + ')', !!z && z.hoch >= 44);
    await p.evaluate(() => document.getElementById('aboZustimmung').click());
    await p.waitForTimeout(200);
    const frei = await p.evaluate(() => !document.getElementById('aboBuchen').disabled);
    pruefe('mit Haken ist er frei', frei);
    await p.evaluate(() => document.getElementById('aboBuchen').click());
    await p.waitForTimeout(1800);
    const weiter = await p.evaluate(() => !!document.getElementById('demoStripe'));
    pruefe('und führt weiter (Demo-Zwischenseite)', weiter);
    pruefe('ohne Skriptfehler', !fehler.length, fehler.join(' | '));
    await ctx.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Rechtliches: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Rechtliches: AGB, Speicherhinweis und Zustimmung an der Kasse — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
