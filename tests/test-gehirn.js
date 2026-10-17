/* ══════════════════════════════════════════════════════════════════════
   STUDIO-GEHIRN IN STUDIOCHAT

   Aus dem Betrieb, 17.10.2026:
     „ich kann dir aber auch zugriff auf github geben das du zugriff auf
      studio chat hast … und wir nutzen es darüber"
   Dazu die Antworten auf die Rückfragen: im Rettungsring UND als eigener
   Punkt unter „Alles", für alle von Körperformen.

   Geprüft wird:
   1. „Alles → Was muss ich wissen?" hat den Eintrag „Studio-Gehirn", und
      er öffnet die Hilfe direkt auf der Frage.
   2. Fragen ruft die Function gehirnFrage mit art:'frage' und dem Text —
      und NICHT den Worker direkt (dessen Schlüssel gehört nicht in die
      App). Die Antwort steht danach da, mit „Aus dem Studio-Wissen".
   3. Eine Antwort, die nicht aus dem Wissen kommt, sagt „Noch nicht
      geprüft" und nennt die Nummer.
   4. Ein Fehler steht dort, wo die Antwort stünde — nicht nur im Toast.
   5. Fremder Text aus der Antwort wird nicht als HTML ausgeführt.
   6. Findet die Hilfe-Suche nichts, steht darunter „Studio-Gehirn
      fragen", und die Suche ist danach im Feld eingetragen.
   7. Eine FREMDE Firma sieht weder den Eintrag noch den Knopf.
   8. Jedes neue Bedienelement ≥ 44 × 44 bei 320 / 390 / 430 / 820 und
      am Rechner 1280 / 1440 / 1920 — per Hit-Test, nicht per Augenmass.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
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

async function oeffne(b, w, h, vorher) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  if (vorher) await p.addInitScript(vorher);
  await p.addInitScript({ path: SP + '/stub-chef.js' });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(600);
  return p;
}
/* Den Eintrag aus „Alles" holen — über den Griff, wie ein Mensch. Die
   Funktionen der App liegen nicht auf window. */
const allesEintrag = (p) => p.evaluate(async () => {
  const lade = document.getElementById('allesLade');
  if (lade.hidden) document.getElementById('bereichKopf').click();
  /* Bis zu 5 s warten, ob die Liste steht — bei voller Maschine dauert
     der Aufbau länger als eine feste halbe Sekunde. Gewartet wird auf
     die LISTE, nicht auf den Eintrag: sonst wartete die Gegenprobe mit
     der fremden Firma immer die vollen 5 s. */
  for (let i = 0; i < 50 && !document.querySelector('#allesLadeInhalt .al-zeile'); i++) {
    await new Promise(r => setTimeout(r, 100));
  }
  await new Promise(r => setTimeout(r, 200));
  const z = document.querySelector('#allesLadeInhalt [data-al-gehirn]');
  return z ? z.textContent.replace(/\s+/g, ' ').trim() : null;
});
const hilfeAuf = async (p) => { await p.click('#hilfeBtn'); await p.waitForTimeout(400); };
const sichtbar = (p, sel) => p.evaluate((s) => {
  const el = document.querySelector(s);
  return !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
}, sel);

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('── 1–5 Fragen und Antworten (390 × 844) ──');
  {
    const p = await oeffne(b, 390, 844);
    const eintrag = await allesEintrag(p);
    pruefe('„Alles" hat den Eintrag Studio-Gehirn', !!eintrag && /Studio-Gehirn/.test(eintrag), String(eintrag));

    await p.click('#allesLadeInhalt [data-al-gehirn]');
    await p.waitForTimeout(400);
    pruefe('der Eintrag öffnet die Hilfe direkt auf der Frage',
      await sichtbar(p, '#hilfe.show #hilfeGehirn') && await sichtbar(p, '#gehirnFeld') &&
      !(await sichtbar(p, '#hilfeSuchTeil')));

    await p.evaluate(() => {
      window.__antwort = { gehirnFrage: () => Promise.resolve({ data: {
        antwort: 'Weste im Schonwaschgang bei 30 Grad.\n<img src=x onerror="window.__boese=1">', abgedeckt: true } }) };
    });
    await p.fill('#gehirnFeld', 'Wie wasche ich die Weste?');
    await p.click('#gehirnFragen');
    await p.waitForTimeout(300);
    const aufruf = await p.evaluate(() => window.__aufruf);
    pruefe('Fragen ruft die Function gehirnFrage mit art:frage und dem Text',
      aufruf && aufruf.name === 'gehirnFrage' && aufruf.data.art === 'frage' &&
      aufruf.data.text === 'Wie wasche ich die Weste?', JSON.stringify(aufruf));
    const t1 = await p.evaluate(() => document.getElementById('hilfeGehirn').innerText);
    pruefe('die Antwort steht da, mit „Aus dem Studio-Wissen"',
      /30 Grad/.test(t1) && /Aus dem Studio-Wissen/.test(t1) && /Wie wasche ich die Weste\?/.test(t1), t1.slice(0, 200));
    pruefe('fremder Text aus der Antwort wird nicht ausgeführt',
      !(await p.evaluate(() => window.__boese)) && !(await p.$('#hilfeGehirn img')));
    pruefe('das Feld ist danach leer', (await p.inputValue('#gehirnFeld')) === '');

    await p.evaluate(() => {
      window.__antwort = { gehirnFrage: () => Promise.resolve({ data: {
        antwort: 'Erste Einschätzung: hinter dem Studio parken.', abgedeckt: false, offen: 7 } }) };
    });
    await p.fill('#gehirnFeld', 'Wo parke ich?');
    await p.click('#gehirnFragen');
    await p.waitForTimeout(300);
    const t2 = await p.evaluate(() => document.getElementById('hilfeGehirn').innerText);
    pruefe('ungeprüfte Antwort sagt „Noch nicht geprüft" und nennt die Nummer',
      /Noch nicht geprüft/.test(t2) && /Nr\. 7/.test(t2), t2.slice(-200));

    await p.evaluate(() => {
      window.__antwort = { gehirnFrage: () => Promise.reject({ code: 'functions/unavailable',
        message: 'Das Studio-Gehirn ist gerade nicht erreichbar. Bitte gleich noch einmal.' }) };
    });
    await p.fill('#gehirnFeld', 'Noch eine Frage');
    await p.click('#gehirnFragen');
    await p.waitForTimeout(300);
    const t3 = await p.evaluate(() => document.getElementById('hilfeGehirn').innerText);
    pruefe('ein Fehler steht dort, wo die Antwort stünde', /Hat nicht geklappt/.test(t3), t3.slice(-200));
    pruefe('nach dem Fehler lässt sich wieder fragen',
      await p.evaluate(() => !document.getElementById('gehirnFragen').disabled));

    await p.evaluate(() => { window.__antwort = { gehirnFrage: () => Promise.resolve({ data: { ok: true } }) }; });
    await p.fill('#gehirnFeld', 'Getränkeautomat im Wartebereich');
    await p.click('#gehirnIdee');
    await p.waitForTimeout(300);
    const a2 = await p.evaluate(() => window.__aufruf);
    pruefe('„Als Idee an die Leitung" schickt art:idee',
      a2 && a2.data.art === 'idee' && /Getränkeautomat/.test(a2.data.text), JSON.stringify(a2));

    await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
    pruefe('Escape führt zurück zur Suche, nicht aus der Hilfe heraus',
      await sichtbar(p, '#hilfe.show #hilfeSuchTeil') && !(await sichtbar(p, '#hilfeGehirn')));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 6 Aus der Suche heraus ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h);
    await hilfeAuf(p);
    pruefe(w + ' px: im Start der Hilfe steht „Studio-Gehirn fragen"', await sichtbar(p, '#hilfeGehirnBtn'));
    await p.fill('#hilfeSuche', 'quokka staubsauger');
    await p.waitForTimeout(300);
    pruefe(w + ' px: ohne Treffer steht darunter „Studio-Gehirn fragen"', await sichtbar(p, '#hilfeTreffer [data-hgehirn]'));
    await p.click('#hilfeTreffer [data-hgehirn]');
    await p.waitForTimeout(300);
    pruefe(w + ' px: die Suche steht danach im Feld',
      (await p.inputValue('#gehirnFeld')) === 'quokka staubsauger');
    if (w >= 1100) {
      pruefe(w + ' px: am Rechner rechts, die Suche bleibt links stehen',
        await sichtbar(p, '#hilfeSuchTeil') && await sichtbar(p, '#hilfeGehirn'));
    }
    pruefe(w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 7 Fremde Firma ──');
  {
    const p = await oeffne(b, 390, 844, () => { window.__firma = 'fremd-ab12'; });
    pruefe('fremde Firma: kein Eintrag unter „Alles"', (await allesEintrag(p)) === null);
    await hilfeAuf(p);
    /* Gegenprobe: die Hilfe selbst ist da — sonst hiesse „kein Knopf"
       nur, dass gar nichts geöffnet wurde. */
    pruefe('fremde Firma: die Hilfe selbst öffnet sich', await sichtbar(p, '#hilfe.show #hilfeSuchTeil'));
    pruefe('fremde Firma: kein Knopf in der Hilfe', !(await sichtbar(p, '#hilfeGehirnBtn')));
    await p.fill('#hilfeSuche', 'quokka');
    await p.waitForTimeout(300);
    pruefe('fremde Firma: kein Verweis unter den Treffern', !(await p.$('#hilfeTreffer [data-hgehirn]')));
    await p.close();
  }

  console.log('\n── 8 Trefferflächen ──');
  for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    for (const dichte of ['normal', 'kompakt']) {
      const p = await oeffne(b, w, h);
      if (dichte === 'kompakt') await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt'));
      await hilfeAuf(p);
      const start = await p.evaluate((T) => {
        const F = eval('(' + T + ')');
        const el = document.getElementById('hilfeGehirnBtn');
        el.scrollIntoView({ block: 'center' });
        return F(el);
      }, TREFFER.toString());
      await p.fill('#hilfeSuche', 'quokka');
      await p.waitForTimeout(250);
      const verweis = await p.evaluate((T) => {
        const F = eval('(' + T + ')');
        const el = document.querySelector('#hilfeTreffer [data-hgehirn]');
        el.scrollIntoView({ block: 'center' });
        return F(el);
      }, TREFFER.toString());
      await p.click('#hilfeTreffer [data-hgehirn]');
      await p.waitForTimeout(250);
      const tafel = await p.evaluate((T) => {
        const F = eval('(' + T + ')');
        const zu = [];
        ['gehirnFragen', 'gehirnIdee'].forEach(id => {
          const el = document.getElementById(id);
          el.scrollIntoView({ block: 'center' });
          const m = F(el);
          if (m.w < 44 || m.h < 44) zu.push(id + ' ' + m.w + '×' + m.h);
        });
        const z = document.querySelector('#hilfeGehirn [data-hzurueck]');
        let zurueck = null;
        if (z && z.getClientRects().length) { z.scrollIntoView({ block: 'center' }); zurueck = F(z); }
        const breit = document.getElementById('hilfeGehirn').scrollWidth > document.getElementById('hilfeGehirn').clientWidth + 1;
        return { zu, zurueck, breit };
      }, TREFFER.toString());
      const zuKlein = [];
      if (start.w < 44 || start.h < 44) zuKlein.push('Start ' + start.w + '×' + start.h);
      if (verweis.w < 44 || verweis.h < 44) zuKlein.push('Verweis ' + verweis.w + '×' + verweis.h);
      zuKlein.push(...tafel.zu);
      if (tafel.zurueck && (tafel.zurueck.w < 44 || tafel.zurueck.h < 44)) zuKlein.push('Zurück ' + tafel.zurueck.w + '×' + tafel.zurueck.h);
      pruefe(w + ' px ' + dichte + ': jedes neue Bedienelement ≥ 44 × 44, nichts ragt hinaus',
        !zuKlein.length && !tafel.breit, zuKlein.join(', ') + (tafel.breit ? ' · ragt seitlich hinaus' : ''));
      if (p._fehler.length) pruefe(w + ' px ' + dichte + ': ohne Skriptfehler', false, p._fehler.join(' | '));
      await p.close();
    }
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Studio-Gehirn: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Studio-Gehirn: Rettungsring, „Alles", Antworten, Fehler, fremde Firma, Trefferflächen — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + (e && e.message)); process.exit(1); });
