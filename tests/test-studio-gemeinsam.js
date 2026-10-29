/* ══════════════════════════════════════════════════════════════════════
   EIN STUDIO FÜR ALLE SEITEN (Runde 297)

   Aus dem Betrieb, 29.10.2026: „kannst du noch dafür sorgen das wenn ich
   in aufgaben ein studio ausgewählt habe das dass studo dann acuh für
   alle anderen sachen ausgewählt wird, weil ich echt sehr oft jetzt
   aufgaben aus hürth abgehakt habe und dann dachte das auch hürth beim
   putzplan drin ist und ich hab dann aber für andere studios was
   abgehakt".

   Was dieser Durchlauf festhält (Demo, Chef, echte Klicks):
     · Aufgaben auf ein Studio gestellt → Putzplan, Material, Geräte und
       Team stehen beim Öffnen auf demselben Studio
     · der Weg geht auch zurück: Putzplan umgestellt → Aufgaben folgen
     · die Kachel auf der Startseite stellt es ebenfalls um
     · nach dem Neuladen gilt das Studio weiter
     · GEGENPROBE „Alle Studios" bei den Aufgaben: die Seiten, die nur
       ein einzelnes Studio kennen, behalten ihres
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

/* Wie jemand dorthin geht: Schublade „Alles" auf, Bereich antippen. */
async function zu(p, view) {
  await p.evaluate((v) => {
    const l = document.getElementById('allesLade');
    const a = document.getElementById('bereichKopf');
    if (a && l && l.hidden) a.click();
  }, view);
  await p.waitForTimeout(500);
  const ok = await p.evaluate((v) => {
    const z = document.querySelector('#allesLadeInhalt [data-alles="' + v + '"]') ||
              document.querySelector('[data-alles="' + v + '"]');
    if (!z) return false;
    z.click(); return true;
  }, view);
  await p.waitForTimeout(1000);
  const sichtbar = await p.evaluate((v) => { const e = document.getElementById('view-' + v); return !!(e && e.getClientRects().length && getComputedStyle(e).display !== 'none'); }, view);
  return ok && sichtbar;
}
async function waehle(p, id, wert) {
  await p.evaluate(([id, wert]) => {
    const s = document.getElementById(id); s.value = wert;
    s.dispatchEvent(new Event('change', { bubbles: true }));
  }, [id, wert]);
  await p.waitForTimeout(700);
}
const wert = (p, id) => p.evaluate((id) => { const s = document.getElementById(id); return s ? s.value : null; }, id);
const optionen = (p, id) => p.evaluate((id) => [...document.getElementById(id).options].map(o => o.value), id);

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const fehler = [];
  p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3300);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); const tt = document.getElementById('tour'); if (tt) tt.remove(); });

  console.log('\n── Aufgaben → überall ──');
  pruefe('die Aufgaben lassen sich öffnen', await zu(p, 'todos'));
  const studios = (await optionen(p, 'todoStudioWahl')).filter(Boolean);
  pruefe('es gibt mehrere Studios zur Wahl', studios.length > 2, studios.length);
  /* Ein Studio, das gerade NICHT vorne steht — sonst bewiese das Ergebnis nichts. */
  await zu(p, 'putzplan');
  const ppVorher = await wert(p, 'ppStudio');
  const ziel = studios.find(s => s !== ppVorher && s !== studios[0]) || studios[1];
  await zu(p, 'todos');
  await waehle(p, 'todoStudioWahl', ziel);
  pruefe('Aufgaben stehen auf ' + ziel, (await wert(p, 'todoStudioWahl')) === ziel);

  for (const [view, id] of [['putzplan', 'ppStudio'], ['material', 'matStudio'], ['geraete', 'devStudio'], ['team', 'teamStudio']]) {
    const da = await zu(p, view);
    if (!da) { pruefe(view + ': Seite erreichbar', false); continue; }
    pruefe(view + ': steht auf demselben Studio', (await wert(p, id)) === ziel, (await wert(p, id)) + ' statt ' + ziel);
  }
  const titel = await p.evaluate(() => (document.getElementById('ppListTitle') || {}).textContent || '');
  await zu(p, 'putzplan');
  const titel2 = await p.evaluate(() => (document.getElementById('ppListTitle') || {}).textContent || '');
  pruefe('der Putzplan zeigt wirklich dieses Studio (Titel)', /Putzplan · /.test(titel2) && titel2.indexOf(await p.evaluate((sk) => { const o = [...document.getElementById('ppStudio').options].find(x => x.value === sk); return o ? o.textContent : '?'; }, ziel)) >= 0, titel2 || titel);

  console.log('\n── zurück: Putzplan → Aufgaben ──');
  const ziel2 = studios.find(s => s !== ziel);
  await waehle(p, 'ppStudio', ziel2);
  await zu(p, 'todos');
  pruefe('Aufgaben folgen dem Putzplan (' + ziel2 + ')', (await wert(p, 'todoStudioWahl')) === ziel2, await wert(p, 'todoStudioWahl'));

  console.log('\n── GEGENPROBE „Alle Studios" ──');
  await waehle(p, 'todoStudioWahl', '');
  pruefe('Aufgaben stehen auf „Alle Studios"', (await wert(p, 'todoStudioWahl')) === '');
  await zu(p, 'putzplan');
  pruefe('der Putzplan behält sein einzelnes Studio', (await wert(p, 'ppStudio')) === ziel2, await wert(p, 'ppStudio'));

  console.log('\n── nach dem Neuladen ──');
  await waehle(p, 'ppStudio', ziel);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3300);
  await p.evaluate(() => { const t = document.getElementById('tour'); if (t) t.remove(); });
  await zu(p, 'geraete');
  pruefe('Geräte stehen nach dem Neuladen auf ' + ziel, (await wert(p, 'devStudio')) === ziel, await wert(p, 'devStudio'));
  await zu(p, 'todos');
  pruefe('Aufgaben stehen nach dem Neuladen auf ' + ziel, (await wert(p, 'todoStudioWahl')) === ziel, await wert(p, 'todoStudioWahl'));

  console.log('\n── Kachel auf der Startseite ──');
  await zu(p, 'home');
  const kachel = await p.evaluate((nicht) => {
    const k = [...document.querySelectorAll('#heuteListe .ls-kachel')].find(x => x.dataset.lswahl !== nicht);
    if (!k) return null;
    k.click(); return k.dataset.lswahl;
  }, ziel);
  await p.waitForTimeout(600);
  await p.evaluate(() => { const z = document.getElementById('lsZu'); if (z && z.offsetParent) z.click(); });
  pruefe('auf der Startseite gibt es Studio-Kacheln', !!kachel);
  if (kachel) {
    await zu(p, 'putzplan');
    pruefe('der Putzplan folgt der angetippten Kachel', (await wert(p, 'ppStudio')) === kachel, await wert(p, 'ppStudio') + ' statt ' + kachel);
  }

  pruefe('keine Fehler auf der Seite', !fehler.length, fehler.join(' | '));
  await b.close();
  console.log('\n' + (schlecht ? '✗' : '✓') + ' Ein Studio für alle Seiten: ' + (schlecht ? schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch' : gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})();
