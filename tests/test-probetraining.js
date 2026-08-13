/* ── Probetraining und Abschlussquote ─────────────────────────────────
   Neu am 13.8.2026. Zwei Dinge werden hier geprüft, und das zweite ist
   das wichtigere:

     1. Die Quote muss stimmen. Eine falsche Zahl sieht genauso
        ordentlich aus wie eine richtige, und nach ihr werden Leute
        beurteilt.

     2. Es darf kein Kundenname hineingeraten. Das war die Entscheidung
        des Betreibers, und sie ist der Grund, warum dieses Modul
        überhaupt gebaut werden konnte, ohne dass ein Datenschutztext
        daran hängt. Ein Feld, das sich später einschleicht, kippt das —
        deshalb steht die Prüfung hier und nicht nur im Dokument.

   Die Attrappe liefert bewusst ungleiche Quoten je Studio und je
   Person: bei lauter gleichen Zahlen fällt ein Rechenfehler nicht auf.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) console.log('  ✓ ' + name);
  else { console.log('  ✗ ' + name + (zusatz ? '  — ' + zusatz : '')); errs.push(name); }
}

async function start(stub) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 900 } });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.addInitScript({ path: path.join(SP, stub) });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  /* Auf die Leiste warten statt auf die Uhr: die Attrappe des
     Mitarbeiters braucht laenger als die des Chefs, und eine feste
     Wartezeit ist entweder zu kurz oder verschenkt Zeit. */
  await page.waitForSelector('.mobnav [data-group="g-arbeit"]', { timeout: 20000 });
  await page.waitForTimeout(600);
  await page.evaluate(async () => {
    const g = document.querySelector('.mobnav [data-group="g-arbeit"]');
    if (g) g.click();
    await new Promise(r => setTimeout(r, 300));
    const t = document.querySelector('[data-subview="probe"]');
    if (t) t.click();
  });
  await page.waitForTimeout(1400);
  return { b, page };
}

const zeilen = (page) => page.evaluate(() =>
  [...document.querySelectorAll('#pbQuoten .pb-zeile')].map(z => ({
    name: z.querySelector('.pb-name').textContent.trim(),
    quote: z.querySelector('.pb-quote').textContent.trim(),
    von: z.querySelector('.pb-von').textContent.trim(),
    balken: z.querySelector('.pb-balken i').style.width,
  })));

(async () => {
  console.log('── Als Chef ──');
  const { b, page } = await start('stub-chef.js');

  pruefe('die Ansicht ist über die Leiste erreichbar',
    await page.evaluate(() => !!document.querySelector('#view-probe.show')));

  const q = await zeilen(page);
  console.log('QUOTEN:', JSON.stringify(q));
  const finde = (n) => q.find(z => z.name.indexOf(n) === 0);

  /* Die Attrappe: 6 Einträge, einer davon 60 Tage alt. Im Standard-
     Zeitraum (30 Tage) bleiben 5, davon 3 mit Abschluss. */
  pruefe('Gesamt: 3 von 5 = 60 %',
    !!finde('Gesamt') && finde('Gesamt').quote === '60%' && finde('Gesamt').von === '3/5',
    JSON.stringify(finde('Gesamt')));
  pruefe('je Studio: Hürth 2 von 4 = 50 %',
    !!finde('Hürth') && finde('Hürth').quote === '50%' && finde('Hürth').von === '2/4',
    JSON.stringify(finde('Hürth')));
  pruefe('je Studio: Brühl 1 von 1 = 100 %',
    !!finde('Brühl') && finde('Brühl').quote === '100%', JSON.stringify(finde('Brühl')));
  pruefe('je Person: Anna 2 von 3 = 67 %',
    !!finde('Anna') && finde('Anna').quote === '67%' && finde('Anna').von === '2/3',
    JSON.stringify(finde('Anna')));
  pruefe('je Person: Ben 1 von 2 = 50 %',
    !!finde('Ben') && finde('Ben').quote === '50%', JSON.stringify(finde('Ben')));
  pruefe('der Balken folgt der Zahl',
    !!finde('Hürth') && finde('Hürth').balken === '50%', finde('Hürth') ? finde('Hürth').balken : '');
  /* Sortierung: die beste Quote oben. Eine Liste in Zufallsreihenfolge
     beantwortet die Frage „wer ist gut" nicht. */
  const studios = q.slice(q.findIndex(z => z.name === 'Brühl'));
  pruefe('die beste Quote steht oben',
    studios.length > 1 && parseInt(studios[0].quote) >= parseInt(studios[1].quote),
    JSON.stringify(studios.slice(0, 2)));

  // ── Zeitraum wechseln ──
  await page.evaluate(() => document.querySelector('#pbZeitraum [data-pbz="0"]').click());
  await page.waitForTimeout(500);
  const alles = await zeilen(page);
  const gAlles = alles.find(z => z.name === 'Gesamt');
  console.log('ALLES:', JSON.stringify(gAlles));
  /* Der alte Eintrag zählt jetzt mit: 3 von 6 = 50 %. Ohne diesen
     Wechsel wäre nicht bewiesen, dass der Zeitraum überhaupt filtert. */
  pruefe('„Alles" nimmt den 60 Tage alten Eintrag mit: 3 von 6',
    !!gAlles && gAlles.von === '3/6' && gAlles.quote === '50%', JSON.stringify(gAlles));

  await page.evaluate(() => document.querySelector('#pbZeitraum [data-pbz="30"]').click());
  await page.waitForTimeout(400);

  // ── Das Eingabefenster ──
  await page.evaluate(() => document.getElementById('pbNew').click());
  await page.waitForTimeout(600);
  const fenster = await page.evaluate(() => {
    const m = document.getElementById('probeModal');
    if (!m.classList.contains('show')) return null;
    return {
      felder: [...m.querySelectorAll('input,select,textarea')].map(e => e.id),
      text: m.textContent.replace(/\s+/g, ' '),
      studios: document.getElementById('pbStudio').options.length,
      datum: document.getElementById('pbDatum').value,
    };
  });
  console.log('FENSTER:', JSON.stringify(fenster));
  pruefe('das Eingabefenster geht auf', !!fenster);
  /* DER Punkt: kein Feld für einen Kundennamen, keins für Kontakt.
     Kommt hier je eines dazu, sind es personenbezogene Daten Dritter —
     dann braucht es Löschfristen und einen Absatz im Datenschutztext. */
  pruefe('kein Feld für einen Kundennamen',
    !!fenster && !fenster.felder.some(f => /name|kunde|vorname|mail|telefon|phone/i.test(f)),
    fenster ? fenster.felder.join(',') : '');
  pruefe('es steht auch dabei, dass keiner erfasst wird',
    !!fenster && /Kein Name|keine Kontaktdaten/i.test(fenster.text));
  pruefe('der Chef kann jedes Studio wählen',
    !!fenster && fenster.studios >= 14, fenster ? String(fenster.studios) : '');
  pruefe('das Datum steht auf heute', !!fenster && !!fenster.datum);

  await page.evaluate(() => {
    document.querySelector('#pbErgebnis [data-pbe="0"]').click();
    document.getElementById('pbNotiz').value = 'kommt nochmal';
    document.getElementById('pbSave').click();
  });
  await page.waitForTimeout(900);

  const geschrieben = await page.evaluate(() =>
    (window.__schreib || []).filter(x => /probetraining/i.test(x.pfad)));
  console.log('GESCHRIEBEN:', JSON.stringify(geschrieben).slice(0, 240));
  const d = geschrieben.length ? geschrieben[geschrieben.length - 1].daten : null;
  pruefe('der Eintrag landet in der Datenbank', !!d);
  pruefe('mit Ja/Nein statt Text — die Regel verlangt es',
    !!d && d.abschluss === false, d ? JSON.stringify(d.abschluss) : '');
  pruefe('mit vonUid — sonst weist die Regel es ab',
    !!d && d.vonUid === 'testuid', d ? String(d.vonUid) : '');
  pruefe('mit Studio und Datum',
    !!d && typeof d.studioKey === 'string' && typeof d.datum === 'number');
  /* Gegenprobe zur Gegenprobe: dass wirklich kein Name mitgeht, auch
     nicht versehentlich über ein anderes Feld. */
  pruefe('und ohne jedes Kundenfeld',
    !!d && !Object.keys(d).some(k => /kunde|customer|vorname|email|telefon/i.test(k)),
    d ? Object.keys(d).join(',') : '');

  await page.screenshot({ path: path.join(SP, 'probetraining.png') });
  await b.close();

  // ── Als Mitarbeiterin: nur das eigene Studio ──
  console.log('\n── Als Mitarbeiterin ──');
  const { b: b2, page: p2 } = await start('stub-mitarbeiter.js');
  const q2 = await zeilen(p2);
  console.log('QUOTEN:', JSON.stringify(q2.map(z => z.name)));
  pruefe('sie sieht die Quote ihres Studios',
    q2.some(z => z.name.indexOf('Hürth') === 0));
  /* Brühl ist nicht ihr Studio. Die Zahlen anderer Standorte gehen sie
     nichts an — dieselbe Grenze wie überall sonst in der App. */
  pruefe('aber NICHT die eines fremden Studios',
    !q2.some(z => z.name.indexOf('Brühl') === 0), JSON.stringify(q2.map(z => z.name)));

  await p2.evaluate(() => document.getElementById('pbNew').click());
  await p2.waitForTimeout(500);
  const auswahl = await p2.evaluate(() =>
    [...document.getElementById('pbStudio').options].map(o => o.textContent));
  console.log('IHRE STUDIOS:', JSON.stringify(auswahl));
  pruefe('sie kann nur ihr eigenes Studio eintragen',
    auswahl.length === 1 && auswahl[0] === 'Hürth', JSON.stringify(auswahl));
  await b2.close();

  console.log(errs.length
    ? '\n✗ ' + errs.length + ' Fehler beim Probetraining'
    : '\n✓ Probetraining: die Quote stimmt je Studio und je Person, der ' +
      'Zeitraum filtert, und kein Kundenname kommt in die App');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
