/* ══════════════════════════════════════════════════════════════════════
   BLOCK C DER DESIGN-RECHERCHE (Runde 103): Gefühl und Bewegung

   Aus dem Betrieb, 24.9.2026: „mach dann block c weiter"

   C1 · Federnde Rückmeldung beim Abhaken und beim Senden — und NUR dort
        · beim Öffnen der Aufgaben federt NICHTS (vorher jeder erledigte
          Haken, bei jedem Zeichnen)
        · beim Abhaken federt genau der eine Haken, obwohl der Horcher
          die Liste sofort neu zeichnet (vorher ging die Rückmeldung
          dabei verloren: nach 0 ms ein neuer Knoten)
        · nach der Bewegung ist die Klasse wieder weg
        · Putzplan genauso
        · der Senden-Knopf federt einmal
        · GEGENPROBE „weniger Bewegung": dann federt nichts
   C2 · Formen-Kontrast, zuerst nur auf der Startseite: die Zeilen sind
        eckiger als die Knöpfe unter „Ausserdem"
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

async function seite(b, rolle, ruhig) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: ruhig ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'dark' })));
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  await p.waitForTimeout(400);
  return p;
}
async function nav(p, wort) {
  await p.evaluate(w => [...document.querySelectorAll('.mobnav button')].find(x => x.textContent.includes(w)).click(), wort);
  await p.waitForTimeout(900);
}
const FEDERN = () => document.getAnimations().filter(a => a.animationName === 'checkPop').length;

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  /* ══ C1: Aufgaben ══ */
  console.log('\n── C1: Abhaken ──');
  {
    const p = await seite(b, 'chef');
    await nav(p, 'Aufgaben');
    const beimOeffnen = await p.evaluate(() => ({
      erledigt: document.querySelectorAll('#todoArea .todo.done').length,
      federn: document.getAnimations().filter(a => a.animationName === 'checkPop').length
    }));
    console.log('  beim Öffnen: ' + JSON.stringify(beimOeffnen));
    pruefe('es gibt erledigte Aufgaben in der Liste (sonst prüft die nächste Zeile nichts)', beimOeffnen.erledigt > 0);
    pruefe('beim Öffnen federt NICHTS', beimOeffnen.federn === 0, JSON.stringify(beimOeffnen));

    const r = await p.evaluate(async () => {
      const node = document.querySelector('#todoArea .todo:not(.done)');
      const id = node.dataset.id;
      node.querySelector('.check').click();
      await new Promise(r => setTimeout(r, 60));
      const neu = document.querySelector('#todoArea .todo[data-id="' + id + '"]');
      const federnd = document.getAnimations().filter(a => a.animationName === 'checkPop');
      const a = {
        neuerKnoten: neu !== node, justDone: neu.classList.contains('just-done'),
        federn: federnd.length,
        genauDieser: federnd.every(x => neu.contains(x.effect.target))
      };
      await new Promise(r => setTimeout(r, 900));
      const spaeter = document.querySelector('#todoArea .todo[data-id="' + id + '"]');
      a.danachWeg = !spaeter.classList.contains('just-done') || !document.getAnimations().some(x => x.animationName === 'checkPop');
      return a;
    });
    console.log('  beim Abhaken: ' + JSON.stringify(r));
    pruefe('der Horcher zeichnet neu (die Lage, die das Problem war)', r.neuerKnoten);
    pruefe('das neu gezeichnete Element trägt die Rückmeldung weiter', r.justDone);
    pruefe('genau EIN Haken federt, und zwar dieser', r.federn === 1 && r.genauDieser, JSON.stringify(r));
    pruefe('danach ist Ruhe', r.danachWeg);

    /* Ein Neuzeichnen später darf die Feder nicht wieder anwerfen. */
    await p.evaluate(() => document.querySelector('[data-tfilter="offen"]').click());
    await p.waitForTimeout(200);
    await p.evaluate(() => document.querySelector('[data-tfilter="alle"]').click());
    await p.waitForTimeout(100);
    const nochmal = await p.evaluate(() => document.getAnimations().filter(a => a.animationName === 'checkPop').length);
    pruefe('ein späteres Neuzeichnen federt nicht noch einmal', nochmal === 0, String(nochmal));
    pruefe('Aufgaben ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.context().close();
  }

  /* ══ C1: Putzplan ══ */
  {
    const p = await seite(b, 'mitarbeiter');
    await nav(p, 'Aufgaben');
    await p.evaluate(() => { const s = document.querySelector('[data-subview="putzplan"]'); if (s) s.click(); });
    await p.waitForTimeout(900);
    const r = await p.evaluate(async () => {
      const chk = document.querySelector('#ppList .pp-item:not(.done) [data-check]');
      if (!chk) return null;
      const id = chk.getAttribute('data-check');
      chk.click();
      await new Promise(r => setTimeout(r, 60));
      const neu = document.querySelector('#ppList .pp-item[data-id="' + id + '"]');
      return { justDone: !!(neu && neu.classList.contains('just-done')),
               federn: document.getAnimations().filter(a => a.animationName === 'checkPop').length };
    });
    console.log('  Putzplan: ' + JSON.stringify(r));
    pruefe('Putzplan: der abgehakte Punkt federt, genau einer', r && r.justDone && r.federn === 1, JSON.stringify(r));
    pruefe('Putzplan ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.context().close();
  }

  /* ══ C1: Senden ══ */
  console.log('\n── C1: Senden ──');
  for (const ruhig of [false, true]) {
    const p = await seite(b, 'mitarbeiter', ruhig);
    await nav(p, 'Nachrichten');
    const r = await p.evaluate(async () => {
      const ta = document.getElementById('chatText');
      ta.value = 'Test Feder';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      const k = document.getElementById('chatSend');
      k.click();
      await new Promise(r => setTimeout(r, 40));
      return { anim: k.getAnimations().length };
    });
    if (!ruhig) pruefe('der Senden-Knopf federt einmal', r.anim === 1, JSON.stringify(r));
    else pruefe('GEGENPROBE „weniger Bewegung": der Senden-Knopf bleibt ruhig', r.anim === 0, JSON.stringify(r));
    if (ruhig) {
      await nav(p, 'Aufgaben');
      const a = await p.evaluate(async () => {
        const node = document.querySelector('#todoArea .todo:not(.done)');
        node.querySelector('.check').click();
        await new Promise(r => setTimeout(r, 60));
        return document.getAnimations().filter(a => a.animationName === 'checkPop').length;
      });
      pruefe('GEGENPROBE „weniger Bewegung": auch der Haken bleibt ruhig', a === 0, String(a));
    }
    pruefe('Senden ohne Skriptfehler' + (ruhig ? ' (ruhig)' : ''), !p._fehler.length, p._fehler.join(' | '));
    await p.context().close();
  }

  /* ══ C2 ══ */
  console.log('\n── C2: Formen-Kontrast auf der Startseite ──');
  {
    const p = await seite(b, 'chef');
    const f = await p.evaluate(() => {
      const z = document.querySelector('#heuteListe .heute-zeile');
      const k = document.querySelector('#heuteListe .heute-rest-knopf');
      return { zeile: parseFloat(getComputedStyle(z).borderTopLeftRadius),
               knopf: k ? parseFloat(getComputedStyle(k).borderTopLeftRadius) : null,
               knopfHoehe: k ? k.getBoundingClientRect().height : null };
    });
    console.log('  Radien: ' + JSON.stringify(f));
    pruefe('Inhaltszeilen: 14 px Radius', f.zeile === 14, JSON.stringify(f));
    pruefe('Knöpfe unter „Ausserdem" bleiben Pillen (Radius ≥ halbe Höhe)',
      f.knopf !== null && f.knopf >= f.knopfHoehe / 2, JSON.stringify(f));
    await p.context().close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Block C: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Block C: federt nur beim Abhaken und Senden, Formen-Kontrast auf der Startseite — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
