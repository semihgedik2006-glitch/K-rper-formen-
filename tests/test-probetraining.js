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

  /* Die Attrappe: 9 Einträge, einer davon 60 Tage alt. Im Standard-
     Zeitraum (30 Tage) bleiben 8, davon 5 mit Abschluss. */
  pruefe('Gesamt: 5 von 8 = 63 %',
    !!finde('Gesamt') && finde('Gesamt').quote === '63%' && finde('Gesamt').von === '5/8',
    JSON.stringify(finde('Gesamt')));
  pruefe('je Studio: Hürth 4 von 6 = 67 %',
    !!finde('Hürth') && finde('Hürth').quote === '67%' && finde('Hürth').von === '4/6',
    JSON.stringify(finde('Hürth')));
  pruefe('je Studio: Brühl 1 von 2 = 50 %',
    !!finde('Brühl') && finde('Brühl').quote === '50%', JSON.stringify(finde('Brühl')));
  pruefe('je Person: Anna 2 von 3 = 67 %',
    !!finde('Anna') && finde('Anna').quote === '67%' && finde('Anna').von === '2/3',
    JSON.stringify(finde('Anna')));
  pruefe('je Person: Ben 2 von 3 = 67 %',
    !!finde('Ben') && finde('Ben').quote === '67%', JSON.stringify(finde('Ben')));
  pruefe('der Balken folgt der Zahl',
    !!finde('Hürth') && finde('Hürth').balken === '67%', finde('Hürth') ? finde('Hürth').balken : '');

  /* ══ Der eigentliche Punkt: eine Person über mehrere Studios ══
     „Marcel hat 70 %" ist die halbe Antwort. Interessant wird es
     daneben: in dem einen Studio 100 %, im anderen 0 %. Ohne diese
     Aufschlüsselung sagt die Zahl nicht, ob es an der Person oder am
     Standort liegt. */
  const marcel = await page.evaluate(() => {
    const alle = [...document.querySelectorAll('[data-pbperson]')];
    const el = alle.find(e => /Marcel/i.test(e.querySelector('.pb-name').textContent));
    if (!el) return null;
    const kopf = el.querySelector('.pb-zeile');
    const zu = el.querySelector('.pb-detail').hidden;
    kopf.click();
    const auf = !el.querySelector('.pb-detail').hidden;
    return {
      vorherZu: zu, jetztAuf: auf,
      gesamt: kopf.querySelector('.pb-quote').textContent.trim(),
      von: kopf.querySelector('.pb-von').textContent.trim(),
      studios: [...el.querySelectorAll('.pb-detail .pb-zeile')].map(z => ({
        name: z.querySelector('.pb-name').textContent.replace(/[↳\s]+/g, ' ').trim(),
        quote: z.querySelector('.pb-quote').textContent.trim(),
      })),
    };
  });
  console.log('MARCEL:', JSON.stringify(marcel));
  pruefe('eine Person ohne Konto zählt trotzdem als Person', !!marcel);
  /* Die Attrappe schreibt ihn einmal als „Marcel" und einmal als
     „marcel " — mit Leerzeichen. Zwei Schreibweisen duerfen nicht zwei
     Personen ergeben, sonst zerfaellt jede Quote. */
  pruefe('„Marcel" und „marcel " sind eine Person: 1 von 2',
    !!marcel && marcel.von === '1/2', marcel ? marcel.von : '');
  pruefe('die Studios sind erst zugeklappt', !!marcel && marcel.vorherZu);
  pruefe('antippen klappt sie auf', !!marcel && marcel.jetztAuf);
  pruefe('und darunter steht die Quote je Studio',
    !!marcel && marcel.studios.length === 2, JSON.stringify(marcel && marcel.studios));
  pruefe('in einem Studio 100 %, im anderen 0 %',
    !!marcel && marcel.studios.some(x => x.quote === '100%') &&
    marcel.studios.some(x => x.quote === '0%'), JSON.stringify(marcel && marcel.studios));
  /* Gegenprobe: die Summe der Studios muss die Gesamtzahl ergeben —
     sonst zaehlt die Aufschluesselung etwas anderes als die Zeile
     darueber, und beide sehen richtig aus. */
  const summe = await page.evaluate(() => {
    const el = [...document.querySelectorAll('[data-pbperson]')]
      .find(e => /Ben/.test(e.querySelector('.pb-name').textContent));
    if (!el) return null;
    const teil = [...el.querySelectorAll('.pb-detail .pb-zeile')]
      .map(z => z.querySelector('.pb-von').textContent.trim().split('/').map(Number));
    const kopf = el.querySelector('.pb-zeile .pb-von').textContent.trim().split('/').map(Number);
    return { kopf: kopf, summeJa: teil.reduce((s, x) => s + x[0], 0),
             summeN: teil.reduce((s, x) => s + x[1], 0) };
  });
  pruefe('GEGENPROBE die Studios summieren sich zur Gesamtquote der Person',
    !!summe && summe.kopf[0] === summe.summeJa && summe.kopf[1] === summe.summeN,
    JSON.stringify(summe));
  /* Sortierung: die beste Quote oben. Eine Liste in Zufallsreihenfolge
     beantwortet die Frage „wer ist gut" nicht.

     Nur die Studio-Zeilen vergleichen: darunter stehen Personen, und
     die haben ihre eigene Reihenfolge. Beim ersten Anlauf lief der
     Vergleich über die Grenze hinweg und meldete einen Fehler, den es
     nicht gab. */
  const nurStudios = q.filter(z => /^(Hürth|Brühl)$/.test(z.name));
  pruefe('die beste Quote steht oben',
    nurStudios.length > 1 && parseInt(nurStudios[0].quote) >= parseInt(nurStudios[1].quote),
    JSON.stringify(nurStudios));
  const nurPersonen = q.filter(z => /^(Anna|Ben|Marcel)/.test(z.name));
  pruefe('auch bei den Personen steht die beste oben',
    nurPersonen.length > 1 &&
    nurPersonen.every((z, i) => i === 0 || parseInt(nurPersonen[i - 1].quote) >= parseInt(z.quote)),
    JSON.stringify(nurPersonen.map(z => z.name + ' ' + z.quote)));

  // ── Zeitraum wechseln ──
  await page.evaluate(() => document.querySelector('#pbZeitraum [data-pbz="0"]').click());
  await page.waitForTimeout(500);
  const alles = await zeilen(page);
  const gAlles = alles.find(z => z.name === 'Gesamt');
  console.log('ALLES:', JSON.stringify(gAlles));
  /* Der alte Eintrag zählt jetzt mit: 5 von 9. Ohne diesen Wechsel
     wäre nicht bewiesen, dass der Zeitraum überhaupt filtert. */
  pruefe('„Alles" nimmt den 60 Tage alten Eintrag mit: 5 von 9',
    !!gAlles && gAlles.von === '5/9', JSON.stringify(gAlles));

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
  /* Namen ja — aber die des Teams, nicht die der Kundschaft. pbWer und
     pbWerFrei sind der Trainer; ein Feld fuer Kunde, Mail oder Telefon
     darf es weiterhin nicht geben. */
  pruefe('kein Feld für einen Kundennamen',
    !!fenster && !fenster.felder.some(f => /kunde|customer|mail|telefon|phone/i.test(f)),
    fenster ? fenster.felder.join(',') : '');
  pruefe('dafür ein Feld, WER es gemacht hat',
    !!fenster && fenster.felder.indexOf('pbWer') >= 0, fenster ? fenster.felder.join(',') : '');

  const werAuswahl = await page.evaluate(() => {
    const sel = document.getElementById('pbWer');
    return {
      erste: sel.options[0].textContent,
      hatFrei: [...sel.options].some(o => o.value === '__frei'),
      anzahl: sel.options.length,
      freiSichtbar: document.getElementById('pbWerFreiFeld').style.display !== 'none',
    };
  });
  console.log('WER:', JSON.stringify(werAuswahl));
  pruefe('voreingestellt bin ich selbst — der häufige Fall',
    /Test Chef/.test(werAuswahl.erste), werAuswahl.erste);
  pruefe('das Team steht zur Auswahl', werAuswahl.anzahl >= 3, String(werAuswahl.anzahl));
  pruefe('und ein freier Name für Leute ohne Konto', werAuswahl.hatFrei);
  pruefe('das Namensfeld bleibt weg, solange es niemand braucht',
    !werAuswahl.freiSichtbar);

  const freiAuf = await page.evaluate(() => {
    const sel = document.getElementById('pbWer');
    sel.value = '__frei';
    sel.dispatchEvent(new Event('change'));
    return document.getElementById('pbWerFreiFeld').style.display !== 'none';
  });
  pruefe('„anderer Name" blendet das Feld ein', freiAuf);
  await page.evaluate(() => {
    const sel = document.getElementById('pbWer');
    sel.value = sel.options[0].value;
    sel.dispatchEvent(new Event('change'));
  });
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
  pruefe('mit vonUid — auf wessen Quote es läuft',
    !!d && d.vonUid === 'testuid', d ? String(d.vonUid) : '');
  /* Die Regel haengt an erfasstVon, nicht an vonUid: eintragen darf man
     auf andere, sich ausgeben als jemand anderes nicht. */
  pruefe('und mit erfasstVon — sonst weist die Regel es ab',
    !!d && d.erfasstVon === 'testuid', d ? String(d.erfasstVon) : '');
  pruefe('mit Namen für die Anzeige',
    !!d && typeof d.vonName === 'string' && d.vonName.length > 0, d ? d.vonName : '');
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
