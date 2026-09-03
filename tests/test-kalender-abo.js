/* ── Der Kalender-Link, von der Oberfläche aus ────────────────────────
   Die Funktion selbst (`exports.kalender`) hat ihren eigenen Durchlauf
   gegen den Emulator: tests/rules/kalender.test.js prüft dort das ICS,
   die Zeitzone und die fünf Wege, auf denen ein Fremder abgewiesen
   wird. Was dort NICHT geprüft werden kann, ist die Hälfte, die im
   Browser passiert — und in der die Fehler stecken, die man dem Nutzer
   ansieht:

     · Der Knopf muss seine Beschriftung wechseln. Beim ersten Anlauf
       tat er das nicht: `withBusy()` stellt am Ende die ALTE
       Beschriftung wieder her, und aus „Neuen Link erzeugen" wurde
       wieder „Link erzeugen". Der Link stand da, der Knopf behauptete
       das Gegenteil.
     · Das Geheimnis muss in `privat/<uid>` landen und NIRGENDWO sonst.
       Im users-Dokument läge es für jeden aktiven Kollegen offen —
       dann wäre der ganze Aufwand um den Schlüssel umsonst.
     · Zwei Klicks müssen zwei verschiedene Schlüssel geben. Ein
       fester Wert (oder einer aus Math.random) sähe genauso aus.

   GEGENPROBE ZU JEDEM PUNKT: nicht nur „steht etwas da", sondern
   „steht das Richtige da, und beim zweiten Mal etwas anderes".
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const fehler = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) console.log('  ✓ ' + name);
  else { console.log('  ✗ ' + name + (zusatz ? ' — ' + zusatz : '')); fehler.push(name); }
}

async function lauf() {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 900 } });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  if (!(await page.evaluate(() => !!document.querySelector('#app.show')))) {
    await b.close();
    throw new Error('Die App ist gar nicht gestartet. ' + errs.join(' | '));
  }

  /* Einstellungen aufmachen — der Abschnitt sitzt im Reiter „Profil". */
  await page.click('#uAvatar');
  await page.waitForTimeout(700);

  const anfang = await page.evaluate(() => ({
    da: !!document.getElementById('kalNeu'),
    sichtbar: !!(document.getElementById('kalNeu') || {}).getClientRects &&
      document.getElementById('kalNeu').getClientRects().length > 0,
    ausOffen: getComputedStyle(document.getElementById('kalAus')).display !== 'none',
    beschriftung: (document.getElementById('kalNeu') || {}).textContent.trim(),
    nurLesen: (document.getElementById('kalLink') || {}).hasAttribute('readonly')
  }));

  pruefe('Der Abschnitt steht im Profil-Reiter', anfang.da && anfang.sichtbar);
  pruefe('Ohne Link ist das Feld zu', !anfang.ausOffen);
  pruefe('Der Knopf heisst zuerst „Link erzeugen"',
    anfang.beschriftung === 'Link erzeugen', anfang.beschriftung);
  pruefe('Das Linkfeld lässt sich nicht bearbeiten', anfang.nurLesen);

  /* ── Erster Klick ── */
  await page.evaluate(() => { window.__schreib = []; });
  await page.click('#kalNeu');
  await page.waitForTimeout(600);

  const nach = await page.evaluate(() => ({
    ausOffen: getComputedStyle(document.getElementById('kalAus')).display !== 'none',
    beschriftung: document.getElementById('kalNeu').textContent.trim(),
    gesperrt: document.getElementById('kalNeu').disabled,
    link: document.getElementById('kalLink').value,
    schreib: (window.__schreib || []).map(s => ({ pfad: s.pfad, daten: s.daten }))
  }));

  pruefe('Nach dem Klick steht der Link da', nach.ausOffen && !!nach.link, nach.link);
  pruefe('Der Knopf heisst jetzt „Neuen Link erzeugen"',
    nach.beschriftung === 'Neuen Link erzeugen', nach.beschriftung);
  pruefe('Der Knopf ist danach wieder bedienbar', !nach.gesperrt);

  /* Genau EIN Schreibvorgang nach privat/, und sonst keiner dorthin.
     „Genau einer INSGESAMT" wäre falsch und war der erste Anlauf: die
     App schreibt nebenher ihr Wochenarchiv (archives/JJJJ-KWnn), auch
     wenn man gar nichts anklickt — nachgemessen mit einem Durchgang,
     der den Dialog nur aufmacht und wartet. Eine Prüfung, die daran
     rot wird, misst die falsche Sache. */
  const privatWrites = nach.schreib.filter(s => /^privat\//.test(s.pfad));
  pruefe('Es wird genau einmal nach privat/ geschrieben', privatWrites.length === 1,
    JSON.stringify(nach.schreib.map(s => s.pfad)));
  const s0 = privatWrites[0] || {};
  pruefe('Geschrieben wird nach privat/testuid', s0.pfad === 'privat/testuid', s0.pfad);
  pruefe('Und zwar nur das Feld kalenderToken',
    s0.daten && Object.keys(s0.daten).join(',') === 'kalenderToken',
    JSON.stringify(s0.daten && Object.keys(s0.daten)));

  const tok1 = (s0.daten || {}).kalenderToken || '';
  pruefe('Der Schlüssel ist 48 Hex-Zeichen lang (24 Byte Zufall)',
    /^[0-9a-f]{48}$/.test(tok1), tok1.length + ' Zeichen: ' + tok1.slice(0, 20) + '…');

  /* Der angezeigte Link muss zu genau diesem Schlüssel passen — sonst
     zeigt die App einen Link, der nie funktioniert hat. */
  pruefe('Der angezeigte Link trägt genau diesen Schlüssel',
    nach.link.indexOf('t=' + tok1) > 0, nach.link);
  pruefe('Der Link zeigt auf die Funktion „kalender"',
    /\/kalender\?/.test(nach.link), nach.link);
  pruefe('Der Link nennt die eigene uid', nach.link.indexOf('u=testuid') > 0, nach.link);

  /* Nirgendwo sonst: das Geheimnis darf das users-Dokument nicht sehen. */
  pruefe('Nichts davon landet in users/…',
    !nach.schreib.some(s => /^users\//.test(s.pfad)),
    JSON.stringify(nach.schreib.map(s => s.pfad)));

  /* ── Zweiter Klick: ein anderer Schlüssel ──
     Ein fester Wert wäre bis hierher grün gewesen. */
  await page.evaluate(() => { window.__schreib = []; });
  await page.click('#kalNeu');
  await page.waitForTimeout(600);
  const zweit = await page.evaluate(() => ({
    tok: ((window.__schreib || []).filter(s => /^privat\//.test(s.pfad))[0] || {}).daten,
    link: document.getElementById('kalLink').value
  }));
  const tok2 = (zweit.tok || {}).kalenderToken || '';
  pruefe('Der zweite Klick gibt einen ANDEREN Schlüssel',
    /^[0-9a-f]{48}$/.test(tok2) && tok2 !== tok1, tok1.slice(0, 12) + ' / ' + tok2.slice(0, 12));
  pruefe('Und das Feld zeigt den neuen, nicht den alten',
    zweit.link.indexOf('t=' + tok2) > 0 && zweit.link.indexOf(tok1) < 0);

  /* ── Zurückziehen ── */
  await page.evaluate(() => { window.__schreib = []; });
  await page.click('#kalWeg');
  await page.waitForTimeout(600);
  const weg = await page.evaluate(() => ({
    ausOffen: getComputedStyle(document.getElementById('kalAus')).display !== 'none',
    beschriftung: document.getElementById('kalNeu').textContent.trim(),
    schreib: (window.__schreib || []).map(s => ({ pfad: s.pfad, daten: s.daten }))
  }));
  pruefe('Danach ist das Feld wieder zu', !weg.ausOffen);
  pruefe('Und der Knopf heisst wieder „Link erzeugen"',
    weg.beschriftung === 'Link erzeugen', weg.beschriftung);
  const wegPrivat = weg.schreib.filter(s => /^privat\//.test(s.pfad));
  pruefe('Zurückziehen löscht das Feld in privat/<uid>',
    wegPrivat.length === 1 && wegPrivat[0].pfad === 'privat/testuid' &&
    wegPrivat[0].daten && wegPrivat[0].daten.kalenderToken === null,
    JSON.stringify(weg.schreib));

  /* ── Gegenprobe zum Aufmachen ──
     Wer beim Aufmachen des Dialogs schon einen Schlüssel hat, muss ihn
     sofort sehen — sonst erzeugt er einen neuen und macht dabei sein
     laufendes Abo kaputt. Dafür den Dialog schliessen, das gespeicherte
     Dokument setzen und neu aufmachen. */
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.evaluate(() => { window.__privatDoc = { kalenderToken: 'a'.repeat(48) }; });
  await page.click('#uAvatar');
  await page.waitForTimeout(800);
  const wieder = await page.evaluate(() => ({
    ausOffen: getComputedStyle(document.getElementById('kalAus')).display !== 'none',
    link: document.getElementById('kalLink').value,
    beschriftung: document.getElementById('kalNeu').textContent.trim()
  }));
  pruefe('Ein gespeicherter Schlüssel wird beim Aufmachen gezeigt',
    wieder.ausOffen && wieder.link.indexOf('t=' + 'a'.repeat(48)) > 0, wieder.link);
  pruefe('Und der Knopf bietet dann „Neuen Link erzeugen" an',
    wieder.beschriftung === 'Neuen Link erzeugen', wieder.beschriftung);

  await b.close();
  errs.forEach(e => { console.log('  ✗ ' + e); fehler.push(e); });

  if (fehler.length) {
    console.log('\n✗ ' + fehler.length + ' Punkt(e) offen.');
    process.exitCode = 1;
  } else {
    console.log('\n✓ Kalender-Abo: Schlüssel liegt privat, Knopf sagt die Wahrheit, ' +
      'zweimal drücken gibt zweimal etwas anderes.');
  }
}

lauf().catch(e => { console.log('✗ ' + e.message); process.exitCode = 1; });
