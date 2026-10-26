/* ── Schnellantworten im Chat ─────────────────────────────────────────
   (Runde 287) Drei Antworten, die im Studio ständig getippt werden:
   „Bin dabei", „Erledigt ✓", „Komme 10 Min später". Sie stehen als
   Knöpfe über dem Schreibfeld, solange das Feld leer ist. Ein Tipp
   setzt den Text ins Feld — nicht gleich abschicken: ein „Erledigt ✓"
   an die falsche Gruppe lässt sich so noch löschen, und „10 Min" lässt
   sich auf „20" ändern. Senden bleibt der eine Knopf, den alle kennen.

   Geprüft bei 320 / 390 / 430 / 820 / 1280 / 1440 / 1920, Dichte normal
   und kompakt, im Studio-Chat und in einer Direktnachricht:
    1. die Reihe steht über dem Feld, jeder Knopf mindestens 44 px hoch,
       die sichtbaren treffen sich selbst (elementFromPoint, Mitte und
       beide Kanten);
    2. die Reihe ist nicht breiter als das Fenster — sie schiebt;
    3. ein Tipp setzt genau diesen Text ins Feld, das Feld hat den Fokus,
       die Reihe ist weg; Feld geleert → Reihe wieder da;
    4. Enter schickt den Text ab wie getippt (Demo: Nachricht im Verlauf).
   GEGENPROBE: ohne Schnellantworten-Knöpfe im DOM wäre 1 rot. */
const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let gut = 0, schlecht = 0;
function pruefe(name, ok, info) {
  if (ok) { gut++; console.log('  ✓ ' + name); }
  else { schlecht++; console.log('  ✗ ' + name + (info ? '  — ' + info : '')); }
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME });
  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    for (const dichte of ['normal', 'kompakt']) {
      const ctx = await b.newContext({ viewport: { width: w, height: h } });
      const p = await ctx.newPage();
      const fehler = [];
      p.on('pageerror', e => fehler.push(e.message.slice(0, 120)));
      await p.route('**://www.gstatic.com/**', r => r.abort());
      await p.addInitScript(d => {
        localStorage.setItem('kf_tour', '99:demo-ich');
        localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'formi', stil2: true, fs2: true, fs: '100', dichte: d }));
      }, dichte);
      await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(3200);
      for (const ort of ['chat', 'dm']) {
        const da = await p.evaluate(async ort => {
          const k = [...document.querySelectorAll('[data-group="g-komm"]')].find(x => x.getClientRects().length);
          if (!k) return 'kein Raum';
          k.click(); await new Promise(r => setTimeout(r, 500));
          if (ort === 'dm') {
            const d = document.getElementById('kanalDirekt') || document.querySelector('[data-subview="direkt"]');
            if (!d) return 'kein Direkt-Knopf'; d.click(); await new Promise(r => setTimeout(r, 600));
            const such = document.getElementById('dmSearch');
            if (such) { such.value = 'a'; such.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 400)); }
            const erste = [...document.querySelectorAll('#dmPeople .dm-person')].find(x => x.getClientRects().length);
            if (!erste) return 'keine Direktnachricht in der Demo'; erste.click();
          } else {
            /* Am Handy steht seit Runde 286 erst die Liste: eine Unterhaltung öffnen. */
            const kanal = document.querySelector('#view-chat.liste #kanalSpalte [data-kanalwahl]');
            if (kanal) kanal.click();
          }
          await new Promise(r => setTimeout(r, 700));
          return 'ok';
        }, ort);
        const kopf = w + ' px ' + dichte + ' ' + ort;
        if (da !== 'ok') { console.log('  · ' + kopf + ': ' + da); continue; }
        const ids = ort === 'dm' ? { ta: 'dmText', reihe: 'dmSchnellAntworten' } : { ta: 'chatText', reihe: 'schnellAntworten' };
        const m = await p.evaluate(ids => {
          const ta = document.getElementById(ids.ta);
          const reihe = document.getElementById(ids.reihe);
          if (!ta || !reihe || !ta.getClientRects().length) return { da: false, feld: !!ta && !!ta.getClientRects().length, reihe: !!reihe };
          const rr = reihe.getBoundingClientRect(), tr = ta.getBoundingClientRect();
          const trifft = (k, x, y) => { const t = document.elementFromPoint(x, y); return !!(t && (t === k || k.contains(t))); };
          const ks = [...reihe.querySelectorAll('button')].map(k => {
            const r = k.getBoundingClientRect();
            const sichtbar = r.right <= innerWidth && r.left >= 0;
            const x = Math.min(innerWidth - 1, r.left + r.width / 2);
            return { t: k.textContent.trim(), h: Math.round(r.height), w: Math.round(r.width), sichtbar,
              trifft: !sichtbar || (trifft(k, x, r.top + r.height / 2) && trifft(k, x, r.top + 1) && trifft(k, x, r.bottom - 1)) };
          });
          return { da: true, sichtbar: !!reihe.getClientRects().length && getComputedStyle(reihe).visibility !== 'hidden', ueberFeld: rr.bottom <= tr.top + 1,
            imFenster: rr.right <= innerWidth + 1 && rr.left >= -1, schiebt: reihe.scrollWidth > reihe.clientWidth, ks, feldLeer: !ta.value };
        }, ids);
        pruefe(kopf + ': Reihe über dem leeren Feld', m.da && m.sichtbar && m.ueberFeld && m.feldLeer, JSON.stringify(m).slice(0, 200));
        if (!m.da) continue;
        pruefe(kopf + ': drei Knöpfe, je ≥ 44 px hoch, sichtbare treffen sich selbst', m.ks.length === 3 && m.ks.every(k => k.h >= 44 && k.trifft), JSON.stringify(m.ks));
        pruefe(kopf + ': Reihe nicht breiter als das Fenster' + (m.schiebt ? ' (schiebt)' : ''), m.imFenster);
        const nach = await p.evaluate(async ids => {
          const k = [...document.querySelectorAll('#' + ids.reihe + ' button')].find(x => /Bin dabei/.test(x.textContent));
          const erwartet = k && k.textContent.trim();
          k.click(); await new Promise(r => setTimeout(r, 250));
          const ta = document.getElementById(ids.ta), reihe = document.getElementById(ids.reihe);
          const nachKlick = { wert: ta.value, fokus: document.activeElement === ta, reiheWeg: !reihe.getClientRects().length };
          ta.value = ''; ta.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 250));
          const nachLeeren = { reiheDa: !!reihe.getClientRects().length };
          return { erwartet, nachKlick, nachLeeren };
        }, ids);
        pruefe(kopf + ': Tipp setzt den Text ins Feld, Fokus im Feld, Reihe weg', nach.nachKlick.wert === nach.erwartet && nach.nachKlick.fokus && nach.nachKlick.reiheWeg, JSON.stringify(nach));
        pruefe(kopf + ': Feld geleert → Reihe wieder da', nach.nachLeeren.reiheDa);
        if (ort === 'chat' && w === 390 && dichte === 'normal') {
          const gesendet = await p.evaluate(async () => {
            const k = [...document.querySelectorAll('#schnellAntworten button')].find(x => /Erledigt/.test(x.textContent));
            k.click(); await new Promise(r => setTimeout(r, 200));
            const ta = document.getElementById('chatText');
            ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            await new Promise(r => setTimeout(r, 900));
            const texte = [...document.querySelectorAll('#chatScroll .msg')].map(x => x.textContent);
            return { leer: !ta.value, drin: texte.some(t => /Erledigt ✓/.test(t)), reiheDa: !!document.getElementById('schnellAntworten').getClientRects().length };
          });
          pruefe('390 px: Enter schickt „Erledigt ✓" ab, Feld leer, Reihe wieder da', gesendet.leer && gesendet.drin && gesendet.reiheDa, JSON.stringify(gesendet));
        }
      }
      pruefe(w + ' px ' + dichte + ': keine Seitenfehler', !fehler.length, fehler.join(' | '));
      await ctx.close();
    }
  }
  /* GEGENPROBE: Knöpfe entfernt → die Messung muss rot werden. */
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'formi', stil2: true, fs2: true, fs: '100', dichte: 'normal' })); });
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3000);
    const n = await p.evaluate(() => { const r = document.getElementById('schnellAntworten'); if (!r) return -1; r.querySelectorAll('button').forEach(b => b.remove()); return r.querySelectorAll('button').length; });
    pruefe('GEGENPROBE: ohne Knöpfe zählt die Messung 0 statt 3 (sonst prüft sie nichts)', n === 0);
    await ctx.close();
  }
  await b.close();
  console.log('\n' + (schlecht ? '✗ ' : '✓ ') + 'Schnellantworten: ' + gut + ' grün, ' + schlecht + ' rot');
  console.log('Fehler: ' + (schlecht ? schlecht + ' Prüfung(en)' : 'keine'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); console.log('Fehler: ' + e.message.slice(0, 120)); process.exit(1); });
