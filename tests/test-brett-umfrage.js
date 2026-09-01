/* ── Die Umfrage am Schwarzen Brett ───────────────────────────────────
   Eine Umfrage gab es bisher nur im Chat. Dort ist sie nach zwanzig
   Nachrichten weg — genau bei der Sorte Frage, die tagelang offen
   bleibt: „Wer kann Samstag früh?", „Welche Öffnungszeiten wollen
   wir?". Am Brett steht sie, bis sie beantwortet ist.

   GEBAUT ALS EIN DIALOG MIT ZWEI ZIELEN, nicht als zweiter Dialog.
   `openPoll(art)` merkt sich das Ziel in `_pollZiel`, weil zwischen
   Aufmachen und Senden mehrere Klicks liegen. `pollHTML(m, art)` und
   `votePoll(id, i, art)` bedienen beide Orte. Dieselbe Entscheidung wie
   bei den Reaktionen — und aus demselben Grund: drei Kopien laufen
   auseinander, sobald eine davon einen Sonderfall bekommt.

   DIE REGEL WAR DIE HALBE ARBEIT. Am Brett stand `allow update` bis
   eben nur für `nurEigeneReaktion()` offen. Abstimmen ist derselbe
   Schreibvorgang in ein fremdes Dokument und braucht denselben Beweis;
   der steht in tests/rules/umfragen.test.js (8 Fälle am Brett).

   HIER GEHT ES UM DIE ANDERE RICHTUNG: schreibt die Oberfläche das,
   was die Regel durchlässt? `votePoll` setzt den Feldpfad
   `votes.<uid>` — schriebe sie die ganze Karte, wäre der Knopf einer,
   den die Regel abweist, und das merkt man erst im Betrieb.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
function pruefe(name, ok, zusatz) {
  if (ok) console.log('  ✓ ' + name);
  else { console.log('  ✗ ' + name + (zusatz ? '\n      ' + zusatz : '')); errs.push(name); }
}

async function lauf() {
  const pageErrs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 900 } });
  page.on('pageerror', e => pageErrs.push('PAGEERROR: ' + e.message.slice(0, 180)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  /* Eine Umfrage und ein gewöhnlicher Aushang. Beide werden gebraucht:
     an der Umfrage allein liesse sich nicht zeigen, dass ein Aushang
     ohne poll KEINE Antwortknöpfe bekommt. */
  await page.addInitScript(() => {
    window.__board = [
      { id: 'p1', uid: 'u3', name: 'Ben Kraus', text: '', kind: 'umfrage',
        ts: Date.now() - 3600000,
        poll: { q: 'Wer kann Samstag früh?', opts: ['Ich', 'Ich nicht'] },
        votes: { u2: 0, u3: 1 } },
      { id: 't1', uid: 'u3', name: 'Ben Kraus', text: 'Gewöhnlicher Aushang.',
        kind: 'info', ts: Date.now() - 7200000 }
    ];
  });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  if (!(await page.evaluate(() => !!document.querySelector('#app.show')))) {
    await b.close();
    throw new Error('Die App ist gar nicht gestartet. ' + pageErrs.join(' | '));
  }

  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-team"]').click());
  await page.waitForTimeout(420);
  await page.evaluate(() => document.querySelector('[data-teamtab="brett"]').click());
  await page.waitForTimeout(660);

  const stand = await page.evaluate(() => ({
    items: document.querySelectorAll('.bb-item').length,
    umfragen: document.querySelectorAll('.bb-item .poll').length,
    frage: (document.querySelector('.bb-item .poll-q') || {}).textContent || '',
    antworten: [...document.querySelectorAll('.bb-item .poll-opt')].map(x => x.textContent.trim()),
    fuss: (document.querySelector('.bb-item .poll-foot') || {}).textContent || '',
    arten: [...document.querySelectorAll('.bb-kind')].map(x => x.textContent),
    mitText: [...document.querySelectorAll('.bb-item')].map(x => !!x.querySelector('.bb-text')),
    knopf: !!document.querySelector('#bbPoll'),
  }));

  pruefe('Brett: beide Beiträge stehen da', stand.items === 2,
    stand.items + ' statt 2 — ohne beide ist alles Weitere wertlos.');
  pruefe('Genau EIN Beitrag ist eine Umfrage', stand.umfragen === 1,
    stand.umfragen + ' — der gewöhnliche Aushang darf keine bekommen.');
  pruefe('Die Frage steht da', stand.frage === 'Wer kann Samstag früh?', stand.frage);
  pruefe('Beide Antworten stehen da, mit Zählung',
    stand.antworten.length === 2 &&
    /Ich1 · 50%/.test(stand.antworten[0]) && /Ich nicht1 · 50%/.test(stand.antworten[1]),
    JSON.stringify(stand.antworten));
  pruefe('Der Fuss nennt die Zahl der Stimmen', /2 Stimmen/.test(stand.fuss), stand.fuss);
  pruefe('Die Art heisst „Umfrage"', stand.arten.join(',') === 'Umfrage,Info',
    JSON.stringify(stand.arten));
  /* Eine Umfrage hat keinen Text — die Frage steht in der Umfrage.
     Ohne die Abfrage in renderBoard stünde darüber ein leerer Absatz,
     und der schöbe die Frage sichtbar nach unten. */
  pruefe('Die Umfrage hat KEINEN leeren Textabsatz darüber',
    stand.mitText[0] === false && stand.mitText[1] === true,
    JSON.stringify(stand.mitText));
  pruefe('Der Weg zu einer neuen Umfrage steht am Brett', stand.knopf);

  /* ── Nachgemessen, nicht nach Augenmass ──
     Der erste Anlauf gab dem Umfrage-Knopf width:100%. Nachgemessen war
     er damit 252px BREITER als „Anpinnen" — die Nebenhandlung hätte
     lauter geschrien als die Haupthandlung. Jetzt stehen beide in
     Inhaltsbreite nebeneinander, nach demselben Muster wie „Eintragen /
     Abbrechen" weiter oben.

     `test-knoepfe.js` misst nur Nur-Symbol-Knöpfe; dieser trägt Symbol
     UND Text und fällt dort durch. Also hier. */
  const knopf = await page.evaluate(() => {
    const d = document.querySelector('[data-fold="brettneu"]');
    const h = d && d.querySelector('h3');
    if (h) h.click();
    return null;
  });
  await page.waitForTimeout(420);
  const mass = await page.evaluate(() => {
    const pol = document.querySelector('#bbPoll'), add = document.querySelector('#bbAdd');
    if (!pol || !add || !pol.getClientRects().length) return null;
    const r = (x) => x.getBoundingClientRect();
    const rp = r(pol), ra = r(add);
    const karte = r(pol.closest('.card'));
    return {
      hoehen: [Math.round(rp.height), Math.round(ra.height)],
      eineZeile: Math.abs(Math.round(rp.top - ra.top)) <= 1,
      symbole: pol.querySelectorAll('svg').length,
      ueberlauf: Math.round(Math.max(0, rp.right - karte.right)),
    };
  });
  pruefe('Beide Knöpfe sind gleich hoch',
    !!mass && mass.hoehen[0] === mass.hoehen[1], JSON.stringify(mass));
  pruefe('Sie stehen auf einer Zeile', !!mass && mass.eineZeile, JSON.stringify(mass));
  /* Ein Element mit data-ikon darf NICHT auch noch ein eigenes <svg>
     tragen — ikonenEinsetzen() schiebt seins davor, und dann zeichnet
     der Knopf sein Symbol doppelt. Das ist im August an 22 Knöpfen
     gleichzeitig passiert. */
  pruefe('Der Knopf zeichnet sein Symbol genau einmal',
    !!mass && mass.symbole === 1, JSON.stringify(mass));
  pruefe('Nichts läuft auf 430px aus der Karte',
    !!mass && mass.ueberlauf === 0, JSON.stringify(mass));
  void knopf;

  // ── Abstimmen ──
  await page.evaluate(() => {
    window.__schreib = [];
    document.querySelectorAll('.bb-item .poll-opt')[0].click();
  });
  await page.waitForTimeout(420);
  const w = await page.evaluate(() => (window.__schreib || [])
    .filter(x => /^board\//.test(x.pfad || '')));
  pruefe('Ein Klick auf eine Antwort schreibt genau einmal ans Brett', w.length === 1,
    JSON.stringify(w).slice(0, 200));
  const d = (w[0] || {}).daten || {};
  pruefe('Geschrieben wird der Beitrag, auf den geklickt wurde',
    (w[0] || {}).pfad === 'board/p1', (w[0] || {}).pfad);
  /* Der Kern: NUR der eigene Schlüssel als Feldpfad. Genau das lässt
     nurEigeneStimme() durch — die ganze votes-Karte würde abgewiesen. */
  pruefe('Geschrieben wird nur der EIGENE Schlüssel (votes.<uid>)',
    Object.keys(d).join(',') === 'votes.testuid' && d['votes.testuid'] === 0,
    JSON.stringify(d) + ' — schriebe die App die ganze votes-Karte, ' +
    'wiese die Regel den Klick ab, und das fiele erst im Betrieb auf.');

  // ── Der Dialog: ein Fenster, zwei Ziele ──
  await page.evaluate(() => document.querySelector('#bbPoll').click());
  await page.waitForTimeout(320);
  const dlg = await page.evaluate(() => ({
    offen: document.querySelector('#pollModal').classList.contains('show'),
    hint: document.querySelector('#pollHint').textContent,
    knopf: document.querySelector('#pollSend').textContent,
  }));
  pruefe('Der Knopf am Brett macht den Umfrage-Dialog auf', dlg.offen);
  pruefe('Der Dialog sagt, dass es ans Brett geht', /Brett/.test(dlg.hint), dlg.hint);
  pruefe('Auch der Sendeknopf sagt es', /Brett/.test(dlg.knopf), dlg.knopf +
    ' — sonst weiss man beim Senden nicht mehr, welchen Knopf man vorhin gedrückt hat.');

  await page.evaluate(() => {
    window.__schreib = [];
    document.querySelector('#pollQ').value = 'Kaffee oder Tee?';
    document.querySelector('#pollO1').value = 'Kaffee';
    document.querySelector('#pollO2').value = 'Tee';
    document.querySelector('#pollSend').click();
  });
  await page.waitForTimeout(560);
  const neu = await page.evaluate(() => (window.__schreib || [])
    .filter(x => /^board\//.test(x.pfad || '')));
  pruefe('Senden legt genau einen Beitrag am Brett an', neu.length === 1,
    JSON.stringify(neu).slice(0, 200));
  const nd = (neu[0] || {}).daten || {};
  pruefe('Der neue Beitrag ist eine Umfrage mit Frage und Antworten',
    nd.kind === 'umfrage' && nd.poll && nd.poll.q === 'Kaffee oder Tee?' &&
    (nd.poll.opts || []).join(',') === 'Kaffee,Tee',
    JSON.stringify(nd).slice(0, 200));
  pruefe('Sie startet ohne Stimmen',
    nd.votes && Object.keys(nd.votes).length === 0, JSON.stringify(nd.votes));
  pruefe('Der Dialog schliesst sich nach dem Senden',
    !(await page.evaluate(() =>
      document.querySelector('#pollModal').classList.contains('show'))));

  /* ── Gegenprobe: das Ziel darf nicht kleben ──
     _pollZiel überlebt den Dialog. Wer danach im Chat eine Umfrage
     stellt, muss sie im Chat bekommen — sonst landet sie stillschweigend
     am Brett, und das merkt man erst, wenn jemand danach fragt. */
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-komm"]').click());
  await page.waitForTimeout(420);
  const zurueck = await page.evaluate(() => {
    const k = document.querySelector('[data-subview="chat"]');
    if (k) k.click();
    return !!k;
  });
  await page.waitForTimeout(520);
  const chatDlg = await page.evaluate(() => {
    const att = [...document.querySelectorAll('[data-att]')]
      .find(x => x.getAttribute('data-att') !== 'foto');
    if (att) att.click();
    return att ? {
      hint: document.querySelector('#pollHint').textContent,
      knopf: document.querySelector('#pollSend').textContent,
    } : null;
  });
  pruefe('(Gegenprobe) im Chat sagt derselbe Dialog wieder „Chat"',
    !!chatDlg && !/Brett/.test(chatDlg.hint) && !/Brett/.test(chatDlg.knopf),
    JSON.stringify(chatDlg) + ' — sonst klebt das Ziel vom letzten Mal, ' +
    'und die Umfrage landet still am falschen Ort. (Chat erreicht: ' + zurueck + ')');

  await b.close();
  pageErrs.forEach(e => { console.log('  ✗ ' + e); errs.push(e); });
}

console.log('\n── Die Umfrage am Schwarzen Brett ──');
lauf()
  .catch(e => { console.log('  ✗ ' + e.message); errs.push(e.message); })
  .then(() => {
    console.log('');
    if (errs.length) {
      console.log('✗ ' + errs.length + ' Fund(e) bei der Umfrage am Brett');
      process.exitCode = 1;
    } else {
      console.log('✓ Umfrage am Brett: ein Dialog für zwei Ziele, und abgestimmt ' +
        'wird genau so, wie die Regel es durchlässt');
    }
  });
