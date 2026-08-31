/* ── Reaktionen ausserhalb des Chats ──────────────────────────────────
   Reagieren war, wie die Erwähnung vorher, eine reine Chat-Sache. Am
   Schwarzen Brett und an den Aushängen der Leitung gab es keinen Weg,
   auf etwas zu antworten, ausser einen eigenen Beitrag zu schreiben.
   Für „gesehen, finde ich gut" ist das zu viel Aufwand — also passiert
   es nicht, und der Verfasser hört nie etwas.

   ZWEI HÄLFTEN, und die zweite ist die teurere:

     Oberfläche  reactionsHTML(m, art) und toggleReaction(mid, e, art)
                 bedienen alle drei Orte. EINE Funktion, nicht drei
                 Kopien — genau der Fehler, der bei den Erwähnungen
                 gerade erst aufgefallen ist.
     Regel       firestore.rules, nurEigeneReaktion(). Reagieren heisst
                 in ein Dokument schreiben, das einem anderen gehört.
                 Am Brett war `allow update: if false`, jetzt ist es
                 offen — aber nur für das eigene Zeichen.

   Die Regel selbst wird in tests/rules/reaktionen.test.js im Emulator
   geprüft (46 Fälle, darunter: fremde Reaktion löschen, fremde Kennung
   eintragen, Text nebenbei ändern). Hier geht es um die Oberfläche:
   steht der Weg da, und schreibt er das, was die Regel durchlässt.

   Das ist keine Doppelung, sondern die andere Richtung. Eine Oberfläche,
   die etwas schreibt, das die Regel abweist, ist ein Knopf, der nichts
   tut — und das merkt man erst im Betrieb.
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
  /* Zwei Beiträge mit Absicht verschieden:
       b1  trägt schon eine FREMDE Reaktion — nur daran lässt sich prüfen,
           dass sie beim eigenen Klick heil bleibt
       b2  trägt gar keine — nur daran lässt sich prüfen, dass es auch
           ohne bestehende Reaktion einen Weg zur ersten gibt */
  await page.addInitScript(() => {
    window.__board = [
      { id: 'b1', text: 'Mitfahrgelegenheit Montag früh.', uid: 'u3', name: 'Ben Kraus',
        kind: 'mitfahr', ts: Date.now() - 3600000, reactions: { '👍': ['u2'] } },
      { id: 'b2', text: 'Noch ganz ohne Reaktion.', uid: 'u3', name: 'Ben Kraus',
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
  await page.waitForTimeout(620);

  const start = await page.evaluate(() => ({
    items: document.querySelectorAll('.bb-item').length,
    reihen: document.querySelectorAll('.bb-item .reacts').length,
    plus: document.querySelectorAll('.bb-item .react-plus').length,
    /* Nur die Zeichen IN DER ZEILE, nicht die im zugeklappten Wähler —
       sonst stünde an jedem Beitrag scheinbar sechsmal etwas. */
    chips: [...document.querySelectorAll('.bb-item .react')]
      .filter(x => !x.closest('.react-wahl') && !x.classList.contains('react-plus'))
      .map(x => x.textContent),
    offen: [...document.querySelectorAll('.bb-item [data-rwahl]')].filter(x => !x.hidden).length
  }));

  pruefe('Brett: beide Beiträge stehen da', start.items === 2,
    start.items + ' statt 2 — ohne beide ist alles Weitere wertlos.');
  pruefe('Jeder Beitrag hat eine Reaktionszeile', start.reihen === 2, JSON.stringify(start));
  pruefe('Jeder Beitrag hat einen Weg zur ERSTEN Reaktion („+")', start.plus === 2,
    'Ohne das „+" gäbe es an einem Beitrag ohne Reaktionen keinen Weg, eine zu setzen.');
  pruefe('Die bestehende fremde Reaktion wird gezeigt: 👍1',
    start.chips.length === 1 && /👍/.test(start.chips[0]) && /1/.test(start.chips[0]),
    JSON.stringify(start.chips));
  pruefe('(Gegenprobe) der Beitrag ohne Reaktionen zeigt keine Zeichen',
    start.chips.length === 1,
    JSON.stringify(start.chips) + ' — sonst würde jedes der sechs Zeichen ' +
    'immer angezeigt, auch wenn niemand es benutzt hat.');
  pruefe('Der Wähler ist zu, bis jemand ihn öffnet', start.offen === 0);

  /* ── Nachgemessen, nicht nach Augenmass ──
     Aus einer Rückmeldung zur Glocke: „bitte achte auf sowas bei ALLEN
     Knöpfen IMMER, bevor es neue gibt." tests/test-knoepfe.js misst
     Nur-Symbol-Knöpfe; das „+" trägt Text und fällt dort durch. Also
     hier: alle Zeichen einer Zeile gleich hoch, auf einer Linie, in der
     Flucht des Textes darüber, und nichts ragt aus dem Kasten. */
  const mass = await page.evaluate(() => {
    const item = document.querySelector('.bb-item');
    const zeile = [...item.querySelectorAll('.react')].filter(x => !x.closest('.react-wahl'));
    const r = (x) => x.getBoundingClientRect();
    const box = r(item), reihe = r(item.querySelector('.reacts'));
    return {
      hoehen: [...new Set(zeile.map(x => Math.round(r(x).height)))],
      linien: [...new Set(zeile.map(x => Math.round(r(x).top)))],
      // in der Flucht des Textes darüber?
      versatz: Math.round(reihe.left - r(item.querySelector('.bb-text')).left),
      ueberlauf: Math.round(Math.max(0, reihe.right - box.right))
    };
  });
  pruefe('Alle Zeichen einer Zeile sind gleich hoch', mass.hoehen.length === 1,
    JSON.stringify(mass.hoehen) + ' px');
  pruefe('Sie stehen auf einer Linie', mass.linien.length === 1,
    JSON.stringify(mass.linien) + ' — verschiedene Oberkanten sehen ' +
    'nach einem Fehler aus, auch wenn keiner da ist.');
  pruefe('Die Zeile fluchtet mit dem Text darüber', Math.abs(mass.versatz) <= 1,
    mass.versatz + ' px Versatz');
  pruefe('Nichts ragt aus dem Kasten', mass.ueberlauf === 0, mass.ueberlauf + ' px');

  // ── „+" öffnet genau EINEN Wähler ──
  await page.evaluate(() => document.querySelectorAll('.bb-item .react-plus')[0].click());
  await page.waitForTimeout(260);
  const auf1 = await page.evaluate(() => ({
    offen: [...document.querySelectorAll('.bb-item [data-rwahl]')].filter(x => !x.hidden).length,
    zeichen: [...document.querySelectorAll('.bb-item [data-rwahl]:not([hidden]) .react')]
      .map(x => x.textContent)
  }));
  pruefe('„+" öffnet genau einen Wähler', auf1.offen === 1, JSON.stringify(auf1));
  pruefe('Der Wähler bietet genau die sechs Zeichen',
    auf1.zeichen.join('') === '👍❤️😂🎉👏😮', JSON.stringify(auf1.zeichen) +
    ' — die Regel lässt genau diese sechs durch; jedes andere wäre ein Knopf, ' +
    'der abgewiesen wird.');

  /* Zwei offene Reihen untereinander sind nicht mehr auseinanderzuhalten,
     welche zu welchem Beitrag gehört. */
  await page.evaluate(() => document.querySelectorAll('.bb-item .react-plus')[1].click());
  await page.waitForTimeout(260);
  pruefe('Ein zweites „+" schliesst das erste',
    (await page.evaluate(() =>
      [...document.querySelectorAll('.bb-item [data-rwahl]')].filter(x => !x.hidden).length)) === 1);

  // ── Der Klick: was wird geschrieben? ──
  await page.evaluate(() => {
    window.__schreib = [];
    document.querySelectorAll('.bb-item [data-rwahl]').forEach(x => { x.hidden = true; });
    document.querySelectorAll('.bb-item .react-plus')[0].click();
  });
  await page.waitForTimeout(220);
  await page.evaluate(() => {
    const w = [...document.querySelectorAll('.bb-item [data-rwahl]')].find(x => !x.hidden);
    [...w.querySelectorAll('.react')].find(x => x.textContent === '🎉').click();
  });
  await page.waitForTimeout(420);

  const w1 = await page.evaluate(() => (window.__schreib || []));
  pruefe('Ein Klick schreibt genau einmal', w1.length === 1, JSON.stringify(w1).slice(0, 220));
  const d1 = w1[0] || {};
  pruefe('Geschrieben wird an den richtigen Beitrag', d1.pfad === 'board/b1', d1.pfad);
  pruefe('Geschrieben wird NUR das Feld reactions',
    d1.daten && Object.keys(d1.daten).join(',') === 'reactions',
    JSON.stringify(d1.daten && Object.keys(d1.daten)) +
    ' — die Regel weist alles Weitere ab; ein zweites Feld hier wäre ein Knopf, ' +
    'der im Betrieb nichts tut.');
  pruefe('Die EIGENE Kennung kommt dazu',
    d1.daten && d1.daten.reactions && (d1.daten.reactions['🎉'] || []).join() === 'testuid',
    JSON.stringify(d1.daten));
  pruefe('Die FREMDE Reaktion bleibt unangetastet',
    d1.daten && d1.daten.reactions && (d1.daten.reactions['👍'] || []).join() === 'u2',
    JSON.stringify(d1.daten) + ' — genau das weist nurEigeneReaktion() sonst ab.');

  /* Noch einmal dasselbe Zeichen: die Reaktion muss WEGGEHEN, und der
     leere Schlüssel muss verschwinden statt als leere Liste liegen zu
     bleiben. */
  await page.evaluate(() => {
    window.__board = [
      { id: 'b1', text: 'Mitfahrgelegenheit Montag früh.', uid: 'u3', name: 'Ben Kraus',
        kind: 'mitfahr', ts: Date.now() - 3600000,
        reactions: { '👍': ['u2'], '🎉': ['testuid'] } }
    ];
    window.__schreib = [];
    return window.__nachschub('board', window.__board);
  });
  await page.waitForTimeout(500);
  const meins = await page.evaluate(() => {
    const c = [...document.querySelectorAll('.bb-item .react')]
      .filter(x => !x.closest('.react-wahl') && !x.classList.contains('react-plus'));
    return c.map(x => x.textContent + (x.classList.contains('mine') ? '|meins' : ''));
  });
  pruefe('Die eigene Reaktion ist als eigene markiert',
    meins.some(t => /🎉/.test(t) && /meins/.test(t)) &&
    meins.some(t => /👍/.test(t) && !/meins/.test(t)),
    JSON.stringify(meins) + ' — ohne die Markierung sieht man nicht, ob man ' +
    'selbst schon reagiert hat, und drückt ein zweites Mal.');

  await page.evaluate(() => {
    const c = [...document.querySelectorAll('.bb-item .react')]
      .filter(x => !x.closest('.react-wahl') && !x.classList.contains('react-plus'));
    c.find(x => /🎉/.test(x.textContent)).click();
  });
  await page.waitForTimeout(420);
  const w2 = await page.evaluate(() => (window.__schreib || []));
  const d2 = (w2[0] || {}).daten || {};
  pruefe('Noch einmal geklickt nimmt die eigene Reaktion zurück',
    w2.length === 1 && d2.reactions && !('🎉' in d2.reactions),
    JSON.stringify(w2).slice(0, 200) + ' — ein leerer Schlüssel bliebe sonst ' +
    'als tote Liste im Dokument stehen.');
  pruefe('Auch beim Zurücknehmen bleibt die fremde Reaktion stehen',
    d2.reactions && (d2.reactions['👍'] || []).join() === 'u2', JSON.stringify(d2));

  // ── Aushänge: derselbe Weg, anderer Ort ──
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-komm"]').click());
  await page.waitForTimeout(420);
  await page.evaluate(() => {
    const k = document.querySelector('[data-subview="ann"]');
    if (k) k.click();
  });
  await page.waitForTimeout(640);
  const ann = await page.evaluate(() => ({
    anns: document.querySelectorAll('.ann').length,
    reihen: document.querySelectorAll('.ann .reacts').length,
    plus: document.querySelectorAll('.ann .react-plus').length
  }));
  pruefe('Aushänge: es stehen welche da', ann.anns >= 2, JSON.stringify(ann));
  pruefe('Jeder Aushang hat eine Reaktionszeile mit „+"',
    ann.reihen === ann.anns && ann.plus === ann.anns, JSON.stringify(ann));

  await page.evaluate(() => { window.__schreib = []; });
  await page.evaluate(() => {
    document.querySelector('.ann .react-plus').click();
  });
  await page.waitForTimeout(220);
  await page.evaluate(() => {
    const w = [...document.querySelectorAll('.ann [data-rwahl]')].find(x => !x.hidden);
    [...w.querySelectorAll('.react')].find(x => x.textContent === '👏').click();
  });
  await page.waitForTimeout(420);
  const w3 = await page.evaluate(() => (window.__schreib || []));
  pruefe('Am Aushang wird nach announcements geschrieben, nicht nach board',
    w3.length === 1 && /^announcements\//.test(w3[0].pfad || ''),
    JSON.stringify(w3).slice(0, 200) + ' — eine Liste, die nicht zum Pfad passt, ' +
    'überschriebe die Reaktion eines anderen.');
  pruefe('Auch hier nur das Feld reactions',
    w3.length === 1 && Object.keys(w3[0].daten || {}).join(',') === 'reactions',
    JSON.stringify(w3[0] && Object.keys(w3[0].daten || {})));

  await b.close();
  pageErrs.forEach(e => { console.log('  ✗ ' + e); errs.push(e); });
}

console.log('\n── Reaktionen ausserhalb des Chats ──');
lauf()
  .catch(e => { console.log('  ✗ ' + e.message); errs.push(e.message); })
  .then(() => {
    console.log('');
    if (errs.length) {
      console.log('✗ ' + errs.length + ' Fund(e) bei den Reaktionen');
      process.exitCode = 1;
    } else {
      console.log('✓ Reaktionen: Brett und Aushänge, ein Weg zur ersten, ' +
        'und geschrieben wird nur die eigene Kennung');
    }
  });
