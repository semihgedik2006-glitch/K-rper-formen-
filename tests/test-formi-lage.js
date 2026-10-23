/* ══════════════════════════════════════════════════════════════════════
   FORMI KENNT DIE APP (Runde 215, 23.10.2026)

   Aus dem Betrieb: „er soll aber mehr integration haben … eher so wie
   chat gpt nur mit dem wissen von uns" — auf die Rückfrage: Aufgaben,
   Putzplan, Material, Geräte, Schichtplan, Schulungen, Ankündigungen,
   Übergaben.

   Geprüft (Attrappe Chef):
    1. gehirnLageText() enthält Aufgaben, Material, Schulungen,
       Ankündigungen — aus dem, was die App schon geladen hat.
    2. KEIN Chat: kein Satz aus dem Team-Chat steht darin.
    3. Höchstens 9000 Zeichen.
    4. Eine Frage im Formi-Fenster schickt die Lage an gehirnAktion mit.
    5. Antwort aus der App-Lage: der Schritt heisst „Aus deinen Daten in
       der App", bei Allgemeinem „Allgemeines Wissen".
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

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    const fehler = [];
    p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript({ path: SP + '/stub-chef.js' });
    await p.addInitScript(() => {
      window.__aufrufe = [];
      window.__antwort = window.__antwort || {};
      window.__antwort.gehirnAktion = (d) => { window.__aufrufe.push({ name: 'gehirnAktion', d }); return Promise.resolve({ data: { art: 'frage', antwort: 'Heute offen: Briefkasten leeren.', abgedeckt: false, grundlage: 'app', nachricht: 5 } }); };
      window.__antwort.gehirnFrage = (d) => { window.__aufrufe.push({ name: 'gehirnFrage', d }); return Promise.resolve({ data: { ok: true } }); };
    });
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
    await p.waitForTimeout(2500);

    await p.click('#formiKugel'); await p.waitForTimeout(1200);
    const l = await p.evaluate(() => window.__formiLage());
    console.log('    Lage (' + l.length + ' Zeichen): ' + l.slice(0, 300).replace(/\n/g, ' ⏎ ') + ' …');
    pruefe('Lage nennt mich, meine Rolle und meine Studios', /Ich: Test Chef \(Geschäftsführung\), Studios: /.test(l), l.slice(0, 120));
    pruefe('Lage enthält Aufgaben, Material und Ankündigungen aus der App', /offene Aufgaben: /.test(l) && /Material fehlt: /.test(l) && /Neue Öffnungszeiten ab Montag/.test(l), l.slice(0, 400));
    pruefe('Lage enthält meinen Schulungsstand', /Meine Schulungen — offen\/fällig: /.test(l));
    pruefe('KEIN Chat: kein Satz aus dem Team-Chat in der Lage', !/Handtücher nachbestellen|Sagt bitte kurz Bescheid|Guten Morgen zusammen/.test(l));
    pruefe('höchstens 9000 Zeichen', l.length <= 9000, String(l.length));

    /* Kein Satz, den der Schnellweg ohne KI erledigt („was ist offen"). */
    await p.fill('#jarvisFeld', 'Worauf sollte ich heute bei der Arbeit besonders achten?');
    await p.click('#jarvisSenden');
    await p.waitForTimeout(1500);
    const a = await p.evaluate(() => window.__aufrufe.find(x => x.name === 'gehirnAktion'));
    pruefe('die Frage schickt die Lage an gehirnAktion mit', a && typeof a.d.lage === 'string' && a.d.lage.length > 100 && /offene Aufgaben/.test(a.d.lage), JSON.stringify(a && Object.keys(a.d)));
    const schritt = await p.evaluate(() => document.getElementById('jarvisVerlauf').innerText);
    pruefe('Antwort aus der App: Schritt „Aus deinen Daten in der App"', /Aus deinen Daten in der App/.test(schritt) && /Briefkasten/.test(schritt), schritt.slice(-200));

    await p.evaluate(() => { window.__antwort.gehirnAktion = (d) => { window.__aufrufe.push({ name: 'gehirnAktion', d }); return Promise.resolve({ data: { art: 'frage', antwort: 'Rücken gerade halten.', abgedeckt: false, grundlage: 'allgemein', nachricht: 6 } }); }; });
    await p.fill('#jarvisFeld', 'Wie erkläre ich einem Kunden eine saubere Kniebeuge?');
    await p.click('#jarvisSenden');
    await p.waitForTimeout(1500);
    const s2 = await p.evaluate(() => document.getElementById('jarvisVerlauf').innerText);
    pruefe('Allgemeines: Schritt „Allgemeines Wissen"', /Allgemeines Wissen/.test(s2), s2.slice(-200));

    pruefe('keine Skriptfehler', !fehler.length, fehler.join(' | '));
    await ctx.close();
  } finally { await b.close(); }
  console.log(schlecht
    ? '\n✗ Formi kennt die App: ' + schlecht + ' von ' + (gut + schlecht) + ' falsch'
    : '\n✓ Formi kennt die App: Lage aus der App, ohne Chats, geht mit der Frage mit — ' + gut + ' Prüfungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
