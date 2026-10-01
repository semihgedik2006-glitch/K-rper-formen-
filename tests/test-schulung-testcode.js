/* ══════════════════════════════════════════════════════════════════════
   SCHULUNG: DER TESTCODE 0000-0000-0000

   Aus dem Betrieb, 1.10.2026:
     „kannst du für die schulungen einen universal code erstellen der
      IMMER geht damit die chefs das auch mal durchtesten können ohne
      sich selber da einen code erstellen zu müssen (code soll
      0000-0000-0000 sein)"

   Was dieser Durchlauf festhält:

   1. DIE LEITUNG KOMMT MIT DEM TESTCODE HINEIN — Geschäftsführung und
      Studioleitung — und sieht am Codefeld, dass es ihn gibt.
   2. EIN TESTLAUF IST KEIN NACHWEIS. Er steht nicht in der Auswertung,
      die Reiterzahl bleibt, und ein Pflichtmodul bleibt offen, auch wenn
      der Test bestanden ist. Verschwinden tut er trotzdem nicht stumm:
      unter der Auswertung steht, wie viele Testläufe es gab.
   3. FÜR MITARBEITENDE GEHT ER NICHT, und sie sehen den Satz dazu nicht.
      Die Schranke ist die Rolle auf dem Server (tests/rules/
      funktionen.test.js); hier wird geprüft, was die App daraus macht.
   4. Kein waagerechtes Scrollen durch den neuen Satz, am Handy und am
      Rechner. Neue Knöpfe gibt es keine.

   Gegen die Demo; der echte Server ist in funktionen.test.js geprüft.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const TESTCODE = '0000-0000-0000';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

async function starte(b, rolle, breite, hoehe) {
  const p = await b.newPage({ viewport: { width: breite || 390, height: hoehe || 844 } });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => {
    localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'dark' }));
    localStorage.setItem('kf_tour', '99:demo-ich');
  });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3300);
  return p;
}
async function zurSchulung(p) {
  await p.evaluate(() => {
    const k = document.querySelector('.mobnav [data-group="g-ich"]') ||
              document.querySelector('#side [data-group="g-ich"]');
    if (k) k.click();
  });
  await p.waitForTimeout(700);
  const da = await p.evaluate(() => {
    const t = [...document.querySelectorAll('[data-subview]')]
      .find(x => /Schulung/.test(x.textContent));
    if (!t) return false;
    t.click(); return true;
  });
  await p.waitForTimeout(1500);
  return da;
}
/* Ein offenes Pflichtmodul aufmachen — genau das, das ein Testlauf
   NICHT abhaken darf. */
async function pflichtOeffnen(p) {
  return p.evaluate(() => {
    const z = document.querySelector('[data-schfaellig]');
    if (!z) return null;
    const id = z.getAttribute('data-schfaellig');
    z.click();
    return id;
  });
}
async function codeEingeben(p, code) {
  return p.evaluate((c) => {
    document.getElementById('schCodeFeld').value = c;
    document.getElementById('schStartBtn').click();
    return new Promise(r => setTimeout(() => r({
      lauf: (document.getElementById('schLauf') || {}).style.display,
      note: (document.getElementById('schCodeNote') || {}).textContent || '',
      kopf: [...document.querySelectorAll('#schLauf .sch-zahl')].map(x => x.textContent).join('|')
    }), 1400));
  }, code);
}
async function ohneQuerscrollen(p) {
  return p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const fehler = [];

  // ══ 1. Geschäftsführung ══
  console.log('\n── Geschäftsführung ──');
  const p = await starte(b, 'chef');
  p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  pruefe('der Weg zur Schulung', await zurSchulung(p));

  /* Vorher: wie viele fertige Läufe zählt die Auswertung? */
  await p.click('#schVerwaltenBtn');
  await p.waitForTimeout(900);
  const zahlVorher = await p.evaluate(() => {
    const r = document.querySelector('[data-schvwtab="aus"] .sch-reiterzahl');
    return r ? Number(r.textContent) : null;
  });
  await p.evaluate(() => document.querySelector('#schVerwalten [data-schzurueck]').click());
  await p.waitForTimeout(600);

  const modulId = await pflichtOeffnen(p);
  await p.waitForTimeout(600);
  pruefe('ein offenes Pflichtmodul lässt sich öffnen', !!modulId, String(modulId));
  const hinweis = await p.evaluate(() => {
    const h = document.getElementById('schTestHinweis');
    return h ? h.textContent : '';
  });
  pruefe('am Codefeld steht der Testcode für die Leitung', hinweis.indexOf('0000-0000-0000') >= 0,
    hinweis.slice(0, 90));
  pruefe('und dass ein Testlauf nicht zählt', /zählt nicht/.test(hinweis));
  pruefe('kein waagerechtes Scrollen am Handy (390)', await ohneQuerscrollen(p));

  const los = await codeEingeben(p, TESTCODE);
  pruefe('der Testcode startet den Lauf', los.lauf === '', los.lauf + ' / ' + los.note);
  pruefe('oben steht „Testlauf"', /Testlauf/.test(los.kopf), los.kopf);

  /* Durchklicken: Haken setzen, Weiter, richtige Antwort. Die richtige
     Antwort steht im Modul — hier geht es um das, was HINTERHER zählt,
     nicht um die Fragen. */
  for (let i = 0; i < 160; i++) {
    const fertig = await p.evaluate(() =>
      (document.getElementById('schErgebnis') || {}).style.display === '');
    if (fertig) break;
    await p.evaluate((id) => {
      const haken = document.querySelector('#schHaken input');
      if (haken && !haken.checked) haken.click();
      const w = document.getElementById('schWeiter');
      if (w && !w.disabled) return w.click();
      /* Die Frage am Text im Modul wiederfinden; die Variablen der App
         liegen nicht am window. */
      const m = ((window.SCHULUNGEN_BASIS || {}).module || []).find(x => x.id === id);
      const text = (document.querySelector('.sch-frage') || {}).textContent || '';
      const f = m && m.fragen.find(x => text.indexOf(x.frage) >= 0);
      const a = f && document.querySelector('[data-schantwort="' + f.richtig + '"]');
      if (a) a.click();
    }, modulId);
    await p.waitForTimeout(220);
  }
  const erg = await p.evaluate(() => ({
    da: (document.getElementById('schErgebnis') || {}).style.display === '',
    titel: (document.querySelector('.sch-fertig h3') || {}).textContent || '',
    text: (document.querySelector('.sch-fertig p') || {}).textContent || ''
  }));
  pruefe('der Testlauf geht bis zum Ergebnis', erg.da, erg.titel);
  pruefe('… und ist bestanden', /Geschafft/.test(erg.titel), erg.titel);
  pruefe('das Ergebnis sagt, dass es ein Testlauf war und nicht zählt',
    /Testlauf/.test(erg.text) && /zählt nicht/.test(erg.text), erg.text.slice(0, 120));

  await p.evaluate(() => document.querySelector('#schErgebnis [data-schzurueck]').click());
  await p.waitForTimeout(900);
  const nochOffen = await p.evaluate((id) =>
    !!document.querySelector('[data-schfaellig="' + id + '"]'), modulId);
  pruefe('das Pflichtmodul bleibt offen — ein Test hakt nichts ab', nochOffen);

  await p.click('#schVerwaltenBtn');
  await p.waitForTimeout(900);
  const zahlNachher = await p.evaluate(() => {
    const r = document.querySelector('[data-schvwtab="aus"] .sch-reiterzahl');
    return r ? Number(r.textContent) : null;
  });
  pruefe('die Zahl an „Auswertung" bleibt gleich', zahlVorher !== null && zahlNachher === zahlVorher,
    zahlVorher + ' → ' + zahlNachher);
  await p.evaluate(() => document.querySelector('[data-schvwtab="aus"]').click());
  await p.waitForTimeout(700);
  const aus = await p.evaluate(() => ({
    liste: [...document.querySelectorAll('#schLaufListe .sch-lauf-zeile')]
      .map(z => z.textContent).join(' || '),
    test: (document.getElementById('schTestZahl') || {}).textContent || ''
  }));
  pruefe('der Testlauf steht nicht in der Auswertung', aus.liste.indexOf('Demo-Geschäftsführung') < 0,
    aus.liste.slice(0, 120));
  pruefe('darunter steht, dass es einen Testlauf gab', /^1 Testlauf/.test(aus.test), aus.test);

  /* Am Rechner: derselbe Satz, kein waagerechtes Scrollen. */
  for (const [w, h] of [[1280, 800], [1920, 1080]]) {
    await p.setViewportSize({ width: w, height: h });
    await p.waitForTimeout(400);
    pruefe('kein waagerechtes Scrollen in der Auswertung bei ' + w, await ohneQuerscrollen(p));
  }
  await p.close();

  // ══ 2. Studioleitung ══
  console.log('\n── Studioleitung ──');
  const l = await starte(b, 'leiter', 1280, 800);
  l.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  await zurSchulung(l);
  await l.evaluate(() => document.querySelector('[data-schmodul]').click());
  await l.waitForTimeout(600);
  pruefe('die Studioleitung sieht den Testcode auch',
    await l.evaluate(() => !!document.getElementById('schTestHinweis')));
  pruefe('kein waagerechtes Scrollen am Rechner (1280)', await ohneQuerscrollen(l));
  const lLos = await codeEingeben(l, '0000 0000 0000');
  pruefe('und kommt damit hinein (auch mit Leerzeichen)', lLos.lauf === '', lLos.note);
  await l.close();

  // ══ 3. Mitarbeitende ══
  console.log('\n── Mitarbeitende ──');
  for (const breite of [320, 390]) {
    const m = await starte(b, 'mitarbeiter', breite, 700);
    m.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    await zurSchulung(m);
    await m.evaluate(() => document.querySelector('[data-schmodul]').click());
    await m.waitForTimeout(600);
    const zeigt = await m.evaluate(() => !!document.getElementById('schTestHinweis'));
    pruefe('bei ' + breite + ' px steht kein Testcode am Codefeld', !zeigt);
    const mLos = await codeEingeben(m, TESTCODE);
    pruefe('bei ' + breite + ' px weist die App den Testcode ab', mLos.lauf === 'none', mLos.lauf);
    pruefe('… und sagt warum', /nur für die Leitung/.test(mLos.note), mLos.note);
    await m.close();
  }

  pruefe('keine Fehler in der Seite', !fehler.length, fehler.join(' | '));
  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Testcode: die Leitung kommt hinein, gezählt wird nichts — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
