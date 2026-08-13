/* Bereich 3 – Chat: Platz, Kanalordnung, Erwähnungen, Aktionsblatt.

   Der Chat ist der Bildschirm, auf dem am meisten Zeit verbracht wird.
   Nachgemessen wird, wie viel Platz der Verlauf bekommt, wie gross die
   Werkzeuge sind und ob eine Erwähnung mit Leerzeichen im Namen
   erkannt wird. */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function start(stub, errs) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 250)));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/' + stub });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await page.mouse.click(195, 400).catch(() => {});
  await page.waitForTimeout(2700);
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-komm"]').click());
  await page.waitForTimeout(1000);
  return { b, page };
}

(async () => {
  const errs = [];
  const { b, page } = await start('stub-chef.js', errs);

  // ── 1. Wie viel Platz bekommt der Verlauf? ──
  const platz = await page.evaluate(() => {
    const sc = document.getElementById('chatScroll');
    const v = document.getElementById('view-chat').getBoundingClientRect();
    return {
      anteil: +(sc.getBoundingClientRect().height / v.height).toFixed(2),
      verlauf: Math.round(sc.getBoundingClientRect().height),
      seitenkopf: !!document.querySelector('#view-chat .view-head'),
    };
  });
  console.log('PLATZ:', JSON.stringify(platz));
  if (platz.anteil < 0.55) errs.push('Verlauf bekommt nur ' + Math.round(platz.anteil * 100) + '% der Ansicht');
  if (platz.seitenkopf) errs.push('Der Seitenkopf ist im Chat zurück');

  // Auch mit langem Text darf der Verlauf nicht zusammenklappen
  await page.evaluate(() => {
    const ta = document.getElementById('chatText');
    ta.value = 'a\nb\nc\nd\ne\nf\ng';
    ta.dispatchEvent(new Event('input'));
  });
  await page.waitForTimeout(350);
  const lang = await page.evaluate(() => ({
    eingabe: Math.round(document.querySelector('.chat-input').getBoundingClientRect().height),
    verlauf: Math.round(document.getElementById('chatScroll').getBoundingClientRect().height),
  }));
  console.log('LANGER TEXT:', JSON.stringify(lang));
  if (lang.verlauf < 300) errs.push('Langer Text drueckt den Verlauf auf ' + lang.verlauf + ' px');
  await page.evaluate(() => {
    const ta = document.getElementById('chatText');
    ta.value = ''; ta.dispatchEvent(new Event('input'));
  });

  // ── 2. Erwähnungen: Vorschlagsliste und voller Name mit Leerzeichen ──
  await page.evaluate(() => {
    const ta = document.getElementById('chatText');
    ta.focus(); ta.value = 'Hallo @an';
    ta.setSelectionRange(9, 9);
    ta.dispatchEvent(new Event('input'));
  });
  await page.waitForTimeout(350);
  const at = await page.evaluate(() => ({
    offen: document.getElementById('atList').classList.contains('show'),
    namen: [...document.querySelectorAll('.at-nm')].map(n => n.textContent),
    hoehe: document.querySelector('.at-item') ? Math.round(document.querySelector('.at-item').getBoundingClientRect().height) : 0,
  }));
  console.log('@-VORSCHLAG:', JSON.stringify(at));
  if (!at.offen) errs.push('Die @-Liste erscheint nicht');
  if (!at.namen.some(n => /Anna/.test(n))) errs.push('Anna fehlt in der @-Liste: ' + JSON.stringify(at.namen));
  if (at.hoehe < 44) errs.push('Eintrag der @-Liste nur ' + at.hoehe + ' px hoch');

  await page.evaluate(() => document.querySelectorAll('.at-item')[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
  await page.waitForTimeout(300);
  const eingefuegt = await page.evaluate(() => document.getElementById('chatText').value);
  console.log('nach Auswahl:', JSON.stringify(eingefuegt));
  if (!/@[\wÄÖÜäöüß-]+ [\wÄÖÜäöüß-]+ $/.test(eingefuegt)) {
    errs.push('Der volle Name wurde nicht eingesetzt: ' + eingefuegt);
  }
  await page.evaluate(() => { const ta = document.getElementById('chatText'); ta.value = ''; ta.dispatchEvent(new Event('input')); });

  // Eine Nachricht mit „@Test Chef" (mit Leerzeichen) muss hervorgehoben sein
  const markiert = await page.evaluate(() => [...document.querySelectorAll('.msg .mention')].map(m => m.textContent));
  console.log('HERVORGEHOBEN:', JSON.stringify(markiert));
  if (!markiert.length) errs.push('Kein @Name im Verlauf hervorgehoben (Leerzeichen-Namen?)');

  // ── 3. Aktionsblatt statt Mini-Symbole ──
  const alteWerkzeuge = await page.evaluate(() => document.querySelectorAll('.msg-tool').length);
  if (alteWerkzeuge) errs.push('Die alten Mini-Symbole sind noch da: ' + alteWerkzeuge);

  await page.evaluate(() => document.querySelectorAll('.msg')[0].click());
  await page.waitForTimeout(400);
  const blatt = await page.evaluate(() => {
    const acts = [...document.querySelectorAll('.ms-act')];
    const emo = [...document.querySelectorAll('.ms-emoji')];
    return {
      offen: document.getElementById('msgSheet').classList.contains('show'),
      wer: document.getElementById('msSheetWho').textContent,
      eintraege: acts.map(a => a.textContent.trim()),
      kleinste: acts.length ? Math.min(...acts.map(a => Math.round(a.getBoundingClientRect().height))) : 0,
      emojis: emo.length,
      emojiHoehe: emo.length ? Math.round(emo[0].getBoundingClientRect().height) : 0,
    };
  });
  console.log('AKTIONSBLATT:', JSON.stringify(blatt, null, 1));
  if (!blatt.offen) errs.push('Das Aktionsblatt oeffnet nicht');
  if (blatt.kleinste < 44) errs.push('Eintrag im Blatt nur ' + blatt.kleinste + ' px hoch');
  if (blatt.emojiHoehe < 44) errs.push('Reaktions-Knopf nur ' + blatt.emojiHoehe + ' px hoch');
  if (!blatt.eintraege.some(e => /Antworten/.test(e))) errs.push('Antworten fehlt im Blatt');
  if (!blatt.eintraege.some(e => /anheften/i.test(e))) errs.push('Anheften fehlt beim Chef');

  // Antworten muss die Antwort-Leiste öffnen und das Blatt schließen
  await page.evaluate(() => document.querySelector('[data-ma="reply"]').click());
  await page.waitForTimeout(400);
  const nachReply = await page.evaluate(() => ({
    blattZu: !document.getElementById('msgSheet').classList.contains('show'),
    leiste: document.getElementById('composeBar').style.display !== 'none',
  }));
  console.log('nach „Antworten":', JSON.stringify(nachReply));
  if (!nachReply.blattZu) errs.push('Das Blatt bleibt nach einer Aktion offen');
  if (!nachReply.leiste) errs.push('Die Antwort-Leiste erscheint nicht');
  await page.evaluate(() => document.getElementById('cbCancel').click());

  // ── 4. Kanalordnung: Allgemein vorn, offener Kanal sichtbar ──
  const kanaele = await page.evaluate(() => {
    const wrap = document.getElementById('chatChannels');
    const aktiv = wrap.querySelector('.chan.active');
    return {
      reihe: [...wrap.querySelectorAll('.chan')].map(c => c.textContent.trim()).slice(0, 4),
      aktivImBild: aktiv ? aktiv.getBoundingClientRect().left >= wrap.getBoundingClientRect().left - 2 : false,
    };
  });
  console.log('KANAELE:', JSON.stringify(kanaele));
  if (!/Allgemein/.test(kanaele.reihe[0])) errs.push('Allgemein steht nicht vorn: ' + kanaele.reihe[0]);
  if (!kanaele.aktivImBild) errs.push('Der offene Kanal liegt ausserhalb des Bildes');

  // ── 5. Gruppierung: Folgenachricht wiederholt den Kopf nicht ──
  // Im Stub folgt m6 (Ben) direkt auf m5 (ebenfalls Ben) – nur diese eine
  // Nachricht darf gruppiert sein, alle anderen behalten ihren Kopf.
  const grp = await page.evaluate(() => {
    const m = [...document.querySelectorAll('.msg')];
    return {
      gruppiert: m.map(x => x.dataset.mid + ':' + x.classList.contains('grp')),
      kopfBeiGrp: m.filter(x => x.classList.contains('grp')).map(x => !!x.querySelector('.meta')),
      anzahlGrp: m.filter(x => x.classList.contains('grp')).length,
    };
  });
  console.log('GRUPPIERUNG:', JSON.stringify(grp));
  if (grp.anzahlGrp !== 1) errs.push('Gruppiert wurden ' + grp.anzahlGrp + ' statt 1: ' + JSON.stringify(grp.gruppiert));
  if (grp.kopfBeiGrp.some(Boolean)) errs.push('Die Folgenachricht wiederholt den Kopf');

  await page.screenshot({ path: SP + '/chat-bereich3.png' });
  console.log('\nFehler:', errs.length ? errs.join('\n  ') : 'keine');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
