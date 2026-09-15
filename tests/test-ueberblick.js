/* ── Was der Chef auf einen Blick sieht ───────────────────────────────
   Drei Wünsche aus derselben Richtung: wer hat meine Info nicht
   gesehen, was ist nicht erledigt, und beides schnell.

   Geprüft wird die Rechnung dahinter, nicht das Aussehen: eine Zahl,
   die falsch ist, sieht genauso ordentlich aus wie eine richtige.

   Der Fund, der diesen Durchlauf ausgelöst hat: die Ankündigungen
   wurden EINMAL gezeichnet — beim Start, bevor die Personenliste da
   war. Danach nie wieder. Am Aushang stand dauerhaft „0 gelesen",
   obwohl das halbe Team gelesen hatte.
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

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 900 } });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3200);

  // ══ 1. Wer hat die Info nicht gesehen ══
  console.log('── Ankündigungen: wer fehlt ──');
  await page.evaluate(async () => {
    document.querySelector('.mobnav [data-group="g-komm"]').click();
    await new Promise(r => setTimeout(r, 250));
    document.querySelector('[data-subview="ann"]').click();
  });
  await page.waitForTimeout(1200);

  const anns = await page.evaluate(() => {
    const knoepfe = [...document.querySelectorAll('[data-wer]')];
    return {
      anzahl: document.querySelectorAll('.ann').length,
      knoepfe: knoepfe.length,
      texte: knoepfe.map(k => k.textContent.replace(/\s+/g, ' ').trim()),
    };
  });
  console.log('ANKÜNDIGUNGEN:', JSON.stringify(anns));
  pruefe('es gibt Ankündigungen', anns.anzahl > 0);
  /* Der eigentliche Fund: ohne das Nachzeichnen stünde hier 0/0. */
  pruefe('der Zähler kennt die Personenliste (nicht 0/0)',
    anns.knoepfe > 0 && anns.texte.every(t => !/\b0\/0\b/.test(t)),
    JSON.stringify(anns.texte));
  pruefe('er nennt gelesen UND gesamt',
    anns.texte.every(t => /\d+\/\d+ gelesen/.test(t)), JSON.stringify(anns.texte));

  const auf = await page.evaluate(() => {
    const k = document.querySelector('[data-wer]');
    k.click();
    const l = document.querySelector('[data-werliste]');
    return { offen: !l.hidden, text: l.textContent.replace(/\s+/g, ' ').trim() };
  });
  console.log('AUFGEKLAPPT:', JSON.stringify(auf));
  pruefe('antippen zeigt die Namen', auf.offen &&
    /Hat es noch nicht gesehen|Alle haben es gesehen/.test(auf.text), auf.text);
  /* Eine Zahl sagt, dass etwas offen ist. Ein Name sagt, wen man
     ansprechen muss — nur das ist eine Handlung. */
  pruefe('bei Rückstand steht dort ein Name',
    !/noch nicht gesehen:\s*$/.test(auf.text), auf.text);

  const zu = await page.evaluate(() => {
    document.querySelector('[data-wer]').click();
    return document.querySelector('[data-werliste]').hidden;
  });
  pruefe('nochmal antippen klappt wieder zu', zu === true);

  /* ══ 2. + 3. Die Studio-Tafel ══
     Sie steht in der Verwaltung. Am 15.9. war sie kurz oben in
     „Betrieb → Aufgaben" — und schob die erste ÜBERFÄLLIGE Aufgabe auf
     y=2017; test-aufgaben-bereich4 wurde rot und hatte recht. Die
     Aufgabenliste sortiert längst nach Dringlichkeit; ein Raster
     darüber verdeckt den Überblick, statt ihn zu geben.

     DIE SICHTBARKEITS-PRÜFUNG BLEIBT. Während des Umzugs las dieser
     Abschnitt `#studioGrid` global — also ein verstecktes Element —
     und war grün, ohne noch etwas zu messen. Ein Raster, das niemand
     sieht, ist kein Überblick. */
  console.log('\n── Übersicht: was ist wo offen ──');
  await page.evaluate(async () => {
    document.querySelector('.mobnav [data-group="g-chef"]').click();
    await new Promise(r => setTimeout(r, 300));
    const k = document.querySelector('#chefHome [data-cgo="ueberblick"]');
    if (k) k.click();
  });
  await page.waitForTimeout(1400);
  /* Der Falz muss dafür auf. Zugeklappt ist er richtig — die Tafel ist
     dort eine von acht Karten —, gemessen werden kann sie so aber
     nicht. */
  await page.evaluate(() => {
    const g = document.getElementById('studioGrid');
    const karte = g ? g.closest('.card') : null;
    const kopf = karte ? karte.querySelector('.fold-head') : null;
    if (kopf && !karte.classList.contains('auf')) kopf.click();
  });
  await page.waitForTimeout(600);
  const sichtbar = await page.evaluate(() => {
    const g = document.getElementById('studioGrid');
    return !!(g && g.getClientRects().length);
  });
  pruefe('die Studio-Tafel ist nach dem Aufklappen sichtbar', sichtbar);

  const tafel = await page.evaluate(() => {
    const g = document.getElementById('studioGrid');
    const kacheln = [...g.children].map(el => ({
      name: (el.querySelector('b') || {}).textContent || '',
      marken: [...el.querySelectorAll('.sm-marke')].map(m => m.textContent.trim()),
      warn: el.querySelectorAll('.sm-marke.warn').length,
      sauber: el.classList.contains('sauber'),
    }));
    return { anzahl: kacheln.length, kacheln: kacheln };
  });
  console.log('KACHELN:', tafel.anzahl,
    '· erste:', JSON.stringify(tafel.kacheln[0]),
    '· letzte:', JSON.stringify(tafel.kacheln[tafel.anzahl - 1]));
  pruefe('jedes Studio hat eine Kachel', tafel.anzahl >= 14, String(tafel.anzahl));
  pruefe('die Kacheln nennen, was offen ist',
    tafel.kacheln.some(k => k.marken.length > 0));

  /* Der Punkt der ganzen Übung: die Studios mit dem meisten Rückstand
     stehen oben. Eine nach Namen sortierte Liste ist kein Überblick —
     man müsste sie durchlesen. */
  const gewicht = (k) => k.sauber ? 0 : k.marken.length + k.warn;
  const werte = tafel.kacheln.map(gewicht);
  const sortiert = werte.every((w, i) => i === 0 || werte[i - 1] >= w);
  pruefe('das Studio mit dem meisten Rückstand steht oben', sortiert,
    JSON.stringify(werte));
  pruefe('Studios ohne Rückstand sind als solche markiert',
    tafel.kacheln.some(k => k.sauber) || tafel.kacheln.every(k => k.marken.length),
    'keine Kachel ist sauber und keine hat Marken — dann misst der Durchlauf nichts');

  /* Gegenprobe: die Marken kommen aus den Daten, nicht aus dem Markup.
     Ein Studio ohne alles darf keine tragen. */
  const echt = tafel.kacheln.filter(k => !k.sauber);
  pruefe('GEGENPROBE nur Kacheln mit Rückstand tragen Marken',
    echt.every(k => k.marken.length > 0) &&
    tafel.kacheln.filter(k => k.sauber).every(k => k.marken.join('') === 'nichts offen'),
    JSON.stringify(tafel.kacheln.filter(k => k.sauber)[0] || null));

  const klickbar = await page.evaluate(() => {
    const erste = document.querySelector('#studioGrid [data-open-studio]');
    if (!erste) return null;
    erste.click();
    return true;
  });
  await page.waitForTimeout(800);
  const gelandet = await page.evaluate(() => !!document.querySelector('#view-todos.show'));
  pruefe('eine Kachel führt in die Aufgaben des Studios', klickbar && gelandet);

  /* Und sie GRENZT EIN, statt nur hinzuscrollen. Vorher landete man in
     derselben Liste aus vierzehn Studios, nur weiter unten — 238
     Bedienelemente auf zwölf Bildschirmhöhen. */
  const eng = await page.evaluate(() => ({
    koepfe: document.querySelectorAll('#todoArea .studio-head').length,
    chip: (document.getElementById('todoStudioChip') || {}).textContent || '',
    unterzeile: (document.getElementById('todoSub') || {}).textContent || ''
  }));
  console.log('NACH DEM ANTIPPEN:', JSON.stringify(eng));
  pruefe('die Liste zeigt danach NUR dieses Studio', eng.koepfe === 1, JSON.stringify(eng));
  pruefe('und sagt WELCHES — am Chip und in der Unterzeile',
    /^Nur /.test(eng.unterzeile.trim()) && eng.chip.trim() !== 'Alle Studios',
    JSON.stringify(eng));

  /* Zurück über denselben Chip. Ein Weg hinein, der keinen Weg hinaus
     hat, ist eine Falle — und der Chip ist der einzige Ort, an dem der
     Zustand überhaupt sichtbar ist. */
  const zurueckOk = await page.evaluate(async () => {
    document.getElementById('todoStudioChip').click();
    await new Promise(r => setTimeout(r, 500));
    const alle = document.querySelector('#studioWahlListe [data-studiowahl=""]');
    if (!alle) return -1;
    alle.click();
    await new Promise(r => setTimeout(r, 600));
    return document.querySelectorAll('#todoArea .studio-head').length;
  });
  pruefe('„Alle Studios" bringt die ganze Liste zurück', zurueckOk > 1, 'Köpfe: ' + zurueckOk);

  await page.screenshot({ path: path.join(SP, 'ueberblick.png') });
  await b.close();

  console.log(errs.length
    ? '\n✗ ' + errs.length + ' Fehler beim Überblick'
    : '\n✓ Überblick: der Aushang nennt die Namen der Fehlenden, die ' +
      'Studio-Tafel zeigt jeden Rückstand und sortiert danach');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
