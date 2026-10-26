/* ══════════════════════════════════════════════════════════════════════
   WO DIE APP NACH DEM ANMELDEN STEHT

   verlaufStarten() öffnet beim Start ein Ziel aus dem Link (#putzplan)
   oder die zuletzt offene Seite (höchstens zwei Stunden alt). Ein paar
   Zeilen weiter unten stand seit August ein `showView('home')` ohne
   Bedingung — es hat dieses Ziel jedes Mal sofort wieder überschrieben.
   Ein Link auf den Putzplan landete auf „Heute", und das fiel nicht auf,
   weil „Heute" ja auch eine richtige Seite ist.

   Entschieden am 26.10.2026: die letzte Seite wird wiederhergestellt
   (wie ursprünglich gebaut), Links landen in jedem Fall am Ziel.

   Was dieser Durchlauf festhält:
     1. ohne Link und ohne gemerkte Seite: „Heute"
     2. Link #putzplan → Putzplan, auch wenn eine andere Seite gemerkt ist
     3. gemerkte Seite (vor 10 Minuten) → dorthin
     4. gemerkte Seite älter als zwei Stunden → „Heute"
     5. Chat ist bewusst nicht wiederherstellbar → „Heute"
     6. Link auf den Verwaltungsbereich ohne Recht → nicht dorthin
     7. eigene Startseite (kf_prefs.aufbau.start='chat', Runde 289), kein
        Link → Chat; mit Link #putzplan → Putzplan (der Link geht vor);
        mit gemerkter Seite → trotzdem Chat (die eigene Einstellung ist
        bewusst gewählt und geht der zuletzt offenen Seite vor)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

/* Öffnet die App frisch (eigener Kontext = leerer Speicher) und meldet,
   welche Ansicht nach dem Aufbau aktiv ist. */
async function startAnsicht(b, rolle, hash, gemerkt, start) {
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const fehler = [];
  p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  /* Wiederkehrend: die Führung beim ersten Start geht bewusst über
     „Heute" (tourSchrittZeigen) — das ist richtig und nicht Gegenstand
     dieses Durchlaufs. */
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  if (start) {
    await p.addInitScript(st => {
      try { localStorage.setItem('kf_prefs', JSON.stringify({ aufbau: { start: st } })); } catch (e) {}
    }, start);
  }
  if (gemerkt) {
    await p.addInitScript(g => {
      try { localStorage.setItem('kf_letzte_ansicht', g.id + '|' + (Date.now() - g.alter)); } catch (e) {}
    }, gemerkt);
  }
  await p.goto(APP + '?demo=' + rolle + (hash ? '#' + hash : ''), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  /* currentView liegt nicht auf window — gemessen wird, was man sieht:
     die eine Ansicht, die Fläche hat, und die Adresszeile. */
  const v = await p.evaluate(() => {
    const s = [...document.querySelectorAll('[id^="view-"]')]
      .filter(e => e.offsetParent !== null && e.getBoundingClientRect().height > 0)
      .map(e => e.id.slice(5));
    return { view: s.length === 1 ? s[0] : s.join(','), hash: location.hash };
  });
  await ctx.close();
  return Object.assign(v, { fehler });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const MIN = 60000;

  let r = await startAnsicht(b, 'mitarbeiter');
  pruefe('ohne Link, ohne gemerkte Seite: Heute', r.view === 'home', JSON.stringify(r));

  r = await startAnsicht(b, 'mitarbeiter', 'putzplan', { id: 'material', alter: 5 * MIN });
  pruefe('Link #putzplan öffnet den Putzplan (schlägt die gemerkte Seite)', r.view === 'putzplan', JSON.stringify(r));
  pruefe('… und die Adresse zeigt #putzplan', r.hash === '#putzplan', r.hash);

  r = await startAnsicht(b, 'mitarbeiter', 'chat');
  pruefe('Link #chat öffnet den Chat', r.view === 'chat', JSON.stringify(r));

  r = await startAnsicht(b, 'mitarbeiter', null, { id: 'putzplan', alter: 10 * MIN });
  pruefe('zuletzt offen vor 10 min (Putzplan) → Putzplan', r.view === 'putzplan', JSON.stringify(r));

  r = await startAnsicht(b, 'mitarbeiter', null, { id: 'putzplan', alter: 3 * 60 * MIN });
  pruefe('zuletzt offen vor 3 h → Heute', r.view === 'home', JSON.stringify(r));

  r = await startAnsicht(b, 'mitarbeiter', null, { id: 'chat', alter: 5 * MIN });
  pruefe('gemerkter Chat wird nicht wiederhergestellt → Heute', r.view === 'home', JSON.stringify(r));

  r = await startAnsicht(b, 'mitarbeiter', 'chef');
  pruefe('Link #chef ohne Verwaltungsrecht → nicht im Verwaltungsbereich', r.view !== 'chef', JSON.stringify(r));

  r = await startAnsicht(b, 'mitarbeiter', null, null, 'chat');
  pruefe('eigene Startseite „Chat", kein Link → Chat', r.view === 'chat', JSON.stringify(r));

  r = await startAnsicht(b, 'mitarbeiter', 'putzplan', null, 'chat');
  pruefe('eigene Startseite „Chat", Link #putzplan → Putzplan', r.view === 'putzplan', JSON.stringify(r));

  r = await startAnsicht(b, 'mitarbeiter', null, { id: 'putzplan', alter: 10 * MIN }, 'chat');
  pruefe('eigene Startseite „Chat", Putzplan vor 10 min offen → Chat', r.view === 'chat', JSON.stringify(r));

  r = await startAnsicht(b, 'chef', 'chef');
  pruefe('Link #chef als Chef → Verwaltungsbereich', r.view === 'chef', JSON.stringify(r));
  pruefe('keine Seitenfehler', !r.fehler.length, r.fehler.join(' | '));

  await b.close();
  console.log('\n' + gut + ' grün, ' + schlecht + ' rot');
  if (schlecht) { console.log('Fehler: ' + schlecht + ' Prüfungen rot'); process.exit(1); }
})().catch(e => { console.log('Fehler: ' + e.message); process.exit(1); });
