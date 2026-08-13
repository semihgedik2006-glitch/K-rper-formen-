/* ── Mitarbeiter legen eigene Aufgaben an ─────────────────────────────
   Seit dem 13.8.2026. Zwei Dinge sind daran wichtig, und beide stehen
   nicht in derselben Datei:

     die Oberfläche darf es anbieten (hier),
     die Regeln müssen es erlauben — und nur einmalig, nur im eigenen
     Studio (tests/rules/rechte.test.js).

   Was hier geprüft wird, ist die Hälfte, die man sieht: Kommt ein
   Mitarbeiter überhaupt an den Knopf? Steht im Fenster nur das, was er
   darf? Und landet am Ende das Richtige in der Datenbank — vor allem
   createdByUid, denn ohne dieses Feld weist die Regel den Schreibvorgang
   ab und die Aufgabe verschwindet wortlos.
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
  await page.waitForTimeout(3000);
  await page.evaluate(async () => {
    const g = document.querySelector('.mobnav [data-group="g-arbeit"]');
    if (g) g.click();
    await new Promise(r => setTimeout(r, 250));
    const t = document.querySelector('[data-subview="todos"]');
    if (t) t.click();
  });
  await page.waitForTimeout(900);
  return { b, page };
}

(async () => {
  console.log('── Als Mitarbeiterin ──');
  const { b, page } = await start('stub-mitarbeiter.js');

  const knopf = await page.evaluate(() => {
    const k = document.getElementById('todoNew');
    if (!k) return null;
    const r = k.getBoundingClientRect();
    return { sichtbar: k.offsetParent !== null, breite: Math.round(r.width), hoehe: Math.round(r.height) };
  });
  console.log('KNOPF:', JSON.stringify(knopf));
  pruefe('der Knopf „+ Neu" ist da', !!knopf && knopf.sichtbar,
    'früher war er mit data-manage-only ausgeblendet');
  pruefe('er ist gross genug zum Antippen', !!knopf && knopf.hoehe >= 30,
    knopf ? knopf.hoehe + ' px' : '');

  await page.evaluate(() => document.getElementById('todoNew').click());
  await page.waitForTimeout(600);

  const fenster = await page.evaluate(() => {
    const m = document.getElementById('ownTodoModal');
    if (!m || !m.classList.contains('show')) return null;
    const felder = [...m.querySelectorAll('input,select,textarea')].map(e => e.id);
    const studioZeile = document.getElementById('otStudio').parentElement;
    return {
      offen: true,
      felder: felder,
      /* Ein Mitarbeiter mit genau einem Studio braucht keine Auswahl. */
      studioAuswahlSichtbar: studioZeile.style.display !== 'none',
      studios: [...document.getElementById('otStudio').options].map(o => o.textContent),
      wo: document.getElementById('otWo').textContent,
      text: m.textContent.replace(/\s+/g, ' '),
      /* Zum Ausschluss: das grosse Formular der Verwaltung darf hier
         nicht aufgegangen sein. */
      chefFormular: !!document.querySelector('#view-chef.show'),
    };
  });
  console.log('FENSTER:', JSON.stringify(fenster));
  pruefe('das kleine Fenster geht auf', !!fenster && fenster.offen);
  pruefe('es führt NICHT in die Verwaltung', !!fenster && !fenster.chefFormular);
  pruefe('nur ein Studio → keine Auswahl',
    !!fenster && fenster.studios.length === 1 && !fenster.studioAuswahlSichtbar,
    fenster ? JSON.stringify(fenster.studios) : '');
  pruefe('es steht dabei, wo die Aufgabe landet',
    !!fenster && /Hürth/.test(fenster.wo), fenster ? fenster.wo : '');

  /* Der Punkt, um den es geht: das Fenster darf nichts anbieten, was die
     Regeln abweisen würden. Eine Wiederholung wäre genau so ein Feld —
     man könnte sie einstellen, und der Schreibvorgang schlüge fehl. */
  pruefe('keine Wiederholung im Fenster',
    !!fenster && fenster.felder.indexOf('otRepeat') < 0 &&
    !/Täglich|Wöchentlich|Wiederhol/i.test(fenster.text),
    fenster ? fenster.felder.join(',') : '');
  pruefe('keine Zuweisung an andere',
    !!fenster && fenster.felder.indexOf('otAssign') < 0);
  pruefe('der Hinweis sagt, dass es einmalig ist',
    !!fenster && /[Ee]inmalig/.test(fenster.text));

  // ── Anlegen und nachsehen, was geschrieben wird ──
  await page.evaluate(() => {
    document.getElementById('otTitle').value = 'Handtücher nachlegen';
    document.getElementById('otDesc').value = 'Im Schrank hinten';
    document.getElementById('otSave').click();
  });
  await page.waitForTimeout(900);

  const geschrieben = await page.evaluate(() =>
    (window.__schreib || []).filter(x => /todos/.test(x.pfad)));
  console.log('GESCHRIEBEN:', JSON.stringify(geschrieben).slice(0, 260));
  const d = geschrieben.length ? geschrieben[geschrieben.length - 1].daten : null;
  pruefe('die Aufgabe wird in die Datenbank geschrieben', !!d);
  pruefe('mit Titel und Notiz',
    !!d && d.title === 'Handtücher nachlegen' && d.desc === 'Im Schrank hinten',
    JSON.stringify(d));
  /* Ohne createdByUid weist die Regel ab — und zwar wortlos: die App
     zeigt einen Fehler, die Aufgabe ist weg. */
  pruefe('mit createdByUid — sonst weist die Regel es ab',
    !!d && d.createdByUid === 'testuid', d ? String(d.createdByUid) : '');
  pruefe('OHNE recurring — sonst weist die Regel es ab',
    !!d && !d.recurring, d ? String(d.recurring) : '');
  pruefe('als offen angelegt', !!d && d.done === false);
  pruefe('das Fenster schliesst sich danach',
    await page.evaluate(() => !document.getElementById('ownTodoModal').classList.contains('show')));

  /* Gegenprobe: ohne Titel darf nichts entstehen. */
  const vorher = geschrieben.length;
  await page.evaluate(() => {
    document.getElementById('todoNew').click();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    document.getElementById('otTitle').value = '   ';
    document.getElementById('otSave').click();
  });
  await page.waitForTimeout(600);
  const nachher = await page.evaluate(() =>
    (window.__schreib || []).filter(x => /todos/.test(x.pfad)).length);
  pruefe('GEGENPROBE ohne Titel wird nichts angelegt', nachher === vorher,
    vorher + ' → ' + nachher);
  await b.close();

  // ── Für die Verwaltung ändert sich nichts ──
  console.log('\n── Als Chef ──');
  const { b: b2, page: p2 } = await start('stub-chef.js');
  await p2.evaluate(() => document.getElementById('todoNew').click());
  await p2.waitForTimeout(900);
  const chefWeg = await p2.evaluate(() => ({
    kleinesFenster: document.getElementById('ownTodoModal').classList.contains('show'),
    imChefBereich: !!document.querySelector('#view-chef.show'),
  }));
  console.log('CHEF:', JSON.stringify(chefWeg));
  pruefe('der Chef landet weiterhin im vollen Formular', chefWeg.imChefBereich);
  pruefe('und NICHT im kleinen Fenster', !chefWeg.kleinesFenster);
  await b2.close();

  console.log(errs.length
    ? '\n✗ ' + errs.length + ' Fehler bei der eigenen Aufgabe'
    : '\n✓ Eigene Aufgabe: Mitarbeiter legen einmalige Aufgaben im eigenen ' +
      'Studio an, die Verwaltung behält ihr volles Formular');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
