/* ══════════════════════════════════════════════════════════════════════
   STUDIO-GEHIRN IN STUDIOCHAT (Runden 149 und 150)

   Aus dem Betrieb, 17.10.2026: „… wir nutzen es darüber" (über
   StudioChat), und am 18.10.2026: „coole animationen … mehr in die app
   integrieren … bei fragen bezüglich zur app helfen … sachen auch
   anlegen … für die chefs … zusammenfasst … gut präsentieren".
   Auf die Rückfragen: alle vier Stufen, Vorschlag + Bestätigen, Bericht
   täglich und montags.

   Geprüft wird:
    1. Unter „Ich" gibt es den Reiter „Gehirn", unter „Alles" die Zeile;
       beide öffnen die eigene Seite.
    2. Beispielfragen zum Antippen; Antippen fragt sofort.
    3. Fragen ruft die Function gehirnFrage (art/text) — nicht den Worker.
    4. Die Antwort schreibt sich hin und steht danach vollständig da,
       mit „Aus dem Studio-Wissen"; fremder Text wird nicht ausgeführt.
    5. Bei „weniger Bewegung" steht die Antwort sofort ganz da.
    6. Fragen zur App bekommen „Zu …"-Knöpfe, die dorthin führen.
    7. Ungeprüfte Antwort, Fehler an Ort und Stelle, Idee.
    8. „Anlegen lassen": nur für die Leitung; der Vorschlag füllt das
       echte Formular unter Verwaltung → Erstellen aus, ohne zu speichern.
    9. Lagebericht: Leitung sieht ihn, Mitarbeiter nicht; Reiter Heute/
       Woche; „Jetzt aktualisieren" ruft lageberichtJetzt.
   10. Rettungsring und Suche führen auf die Seite, Suche eingetragen.
   11. Eine FREMDE Firma sieht nichts davon.
   12. Am Rechner zwei Spalten.
   13. Jedes neue Bedienelement ≥ 44 × 44 bei 320 / 390 / 430 / 820 und
       am Rechner 1280 / 1440 / 1920, normal und kompakt (Hit-Test).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
const TREFFER = (el) => {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0 };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--;
  while (u < innerHeight && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--;
  while (re < innerWidth && trifft(re + 1, cy)) re++;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1) };
};

async function oeffne(b, w, h, opt) {
  opt = opt || {};
  const ctx = await b.newContext({ viewport: { width: w, height: h },
    reducedMotion: opt.wenigBewegung ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  if (opt.vorher) await p.addInitScript(opt.vorher);
  await p.addInitScript({ path: SP + '/' + (opt.stub || 'stub-chef.js') });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(600);
  p._ctx = ctx;
  return p;
}
const zu = (p) => p._ctx.close();
/* Der „Gehirn"-Knopf steht je nach Aussehen und Breite an einer von drei
   Stellen: Bereichszeile (neu, Handy), Seitenkopf (bisher, Handy),
   Kopfleiste (Rechner). */
const jvKnopf = (p) => p.evaluate(() => ['#jarvisStart', '#jarvisStartAlt', '#jarvisStartPc'].find(s => {
  const el = document.querySelector(s); return el && el.getClientRects().length && getComputedStyle(el).display !== 'none'; }) || null);
const sichtbar = (p, sel) => p.evaluate((s) => {
  const el = document.querySelector(s);
  return !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
}, sel);
const aufSeite = async (p) => {
  await p.evaluate(async () => {
    const lade = document.getElementById('allesLade');
    if (lade.hidden) document.getElementById('bereichKopf').click();
    for (let i = 0; i < 50 && !document.querySelector('#allesLadeInhalt .al-zeile'); i++) await new Promise(r => setTimeout(r, 100));
    const z = document.querySelector('#allesLadeInhalt [data-alles="gehirn"]');
    if (z) z.click();
  });
  await p.waitForTimeout(400);
};
/* Antworten der Functions vorgeben. Funktionen lassen sich nicht in die
   Seite reichen — daher als Daten: { data } oder { fehler }. */
const antwort = (p, mit) => p.evaluate((m) => {
  window.__antwort = window.__antwort || {};
  Object.keys(m).forEach(k => {
    const v = m[k];
    window.__antwort[k] = v.fehler ? () => Promise.reject(v.fehler) : () => Promise.resolve({ data: v.data });
    /* Seit 19.10.2026 ein Knopf: getippte Sätze gehen an gehirnAktion,
       die eine Frage selbst beantwortet ({ art:'frage', antwort … }).
       Eine Antwort für gehirnFrage gilt deshalb auch dort. */
    if (k === 'gehirnFrage' && !m.gehirnAktion) {
      window.__antwort.gehirnAktion = v.fehler ? () => Promise.reject(v.fehler)
        : () => Promise.resolve({ data: Object.assign({ art: 'frage' }, v.data) });
    }
  });
}, mit);
const fertig = (p) => p.waitForFunction(() => !document.querySelector('#gehirnVerlauf .gehirn-denkt'), null, { timeout: 5000 });
const verlaufText = (p) => p.evaluate(() => document.getElementById('gehirnVerlauf').innerText);

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('── 1–7 Fragen und Antworten (390 × 844, Chef) ──');
  {
    const p = await oeffne(b, 390, 844);
    const zeile = await p.evaluate(async () => {
      document.getElementById('bereichKopf').click();
      for (let i = 0; i < 50 && !document.querySelector('#allesLadeInhalt .al-zeile'); i++) await new Promise(r => setTimeout(r, 100));
      const z = document.querySelector('#allesLadeInhalt [data-alles="gehirn"]');
      return z ? z.textContent.replace(/\s+/g, ' ').trim() : null;
    });
    pruefe('„Alles" hat die Zeile Studio-Gehirn', !!zeile && /Studio-Gehirn/.test(zeile), String(zeile));
    await aufSeite(p);
    pruefe('die Zeile öffnet die eigene Seite', await sichtbar(p, '#view-gehirn.show'));
    const reiter = await p.evaluate(() => [...document.querySelectorAll('#subnav [data-subview]')].map(x => x.getAttribute('data-subview')));
    pruefe('unter „Ich" steht der Reiter Gehirn', reiter.indexOf('gehirn') >= 0 && reiter.indexOf('ich') >= 0, JSON.stringify(reiter));
    const chips = await p.$$eval('#gehirnChips .gehirn-chip', l => l.length);
    pruefe('Beispielfragen zum Antippen', chips >= 3, String(chips));

    await antwort(p, { gehirnFrage: { data: {
      antwort: 'Attest an die Studioleitung geben.\n<img src=x onerror="window.__boese=1">', abgedeckt: true } } });
    await p.click('#gehirnChips .gehirn-chip');
    await fertig(p);
    const a1 = await p.evaluate(() => window.__aufruf);
    pruefe('eine Beispielfrage antippen fragt sofort (gehirnFrage, art:frage)',
      a1 && a1.name === 'gehirnFrage' && a1.data.art === 'frage' && /Attest/.test(a1.data.text), JSON.stringify(a1));
    await p.waitForTimeout(1500);
    const t1 = await verlaufText(p);
    pruefe('die Antwort steht nach dem Hinschreiben vollständig da', /Attest an die Studioleitung geben\./.test(t1) && /onerror/.test(t1), t1.slice(0, 200));
    pruefe('… mit „Aus dem Studio-Wissen"', /Aus dem Studio-Wissen/.test(t1));
    pruefe('fremder Text wird nicht ausgeführt', !(await p.evaluate(() => window.__boese)) && !(await p.$('#gehirnVerlauf img')));
    pruefe('die Beispielfragen verschwinden, sobald gefragt wurde', (await p.$$eval('#gehirnChips .gehirn-chip', l => l.length)) === 0);

    await antwort(p, { gehirnFrage: { data: { antwort: 'Unter Verwaltung → Erstellen.', abgedeckt: true } } });
    await p.fill('#gehirnFeld', 'Wie lege ich eine Aufgabe an?');
    await p.click('#gehirnFragen');
    await fertig(p);
    const ziel = await p.$('#gehirnVerlauf [data-gziel="todos"]');
    pruefe('Frage zur App: Knopf „Zu Aufgaben"', !!ziel);
    if (ziel) { await ziel.click(); await p.waitForTimeout(400); }
    pruefe('… und er führt dorthin', await sichtbar(p, '#view-todos.show'));
    await aufSeite(p);
    pruefe('zurück auf der Seite steht das Gespräch noch da', /Wie lege ich eine Aufgabe an\?/.test(await verlaufText(p)));

    await antwort(p, { gehirnFrage: { data: { antwort: 'Erste Einschätzung.', abgedeckt: false, offen: 7 } } });
    await p.fill('#gehirnFeld', 'Wo parke ich?');
    await p.click('#gehirnFragen');
    await fertig(p); await p.waitForTimeout(600);
    const t2 = await verlaufText(p);
    pruefe('ungeprüft: „Noch nicht geprüft" mit Nummer', /Noch nicht geprüft/.test(t2) && /Nr\. 7/.test(t2), t2.slice(-160));
    pruefe('keine „Zu …"-Knöpfe, wenn die Frage nichts mit der App zu tun hat',
      (await p.$$eval('#gehirnVerlauf .gehirn-antwort', l => l[l.length - 1].querySelectorAll('[data-gziel]').length)) === 0);

    await antwort(p, { gehirnFrage: { fehler: { code: 'functions/unavailable', message: 'Gerade nicht erreichbar.' } } });
    await p.fill('#gehirnFeld', 'Noch eine Frage');
    await p.click('#gehirnFragen');
    await fertig(p);
    pruefe('ein Fehler steht dort, wo die Antwort stünde', /Hat nicht geklappt/.test(await verlaufText(p)));
    pruefe('danach lässt sich wieder fragen', await p.evaluate(() => !document.getElementById('gehirnFragen').disabled));

    /* Ein Knopf: eine Idee erkennt die Function; geschickt wird erst
       nach „An die Leitung schicken". */
    await antwort(p, { gehirnAktion: { data: { vorschlag: { typ: 'idee', text: 'Getränkeautomat im Wartebereich' } } } });
    await p.fill('#gehirnFeld', 'Wir bräuchten einen Getränkeautomat im Wartebereich');
    await p.click('#gehirnFragen');
    await fertig(p);
    const a0 = await p.evaluate(() => window.__aufruf);
    pruefe('ein Knopf: getippter Satz geht an gehirnAktion', a0 && a0.name === 'gehirnAktion' && /Getränkeautomat/.test(a0.data.text), JSON.stringify(a0));
    pruefe('Idee: Vorschau mit „An die Leitung schicken"', /An die Leitung schicken/.test(await verlaufText(p)));
    await antwort(p, { gehirnFrage: { data: { ok: true } } });
    await p.evaluate(() => [...document.querySelectorAll('#gehirnVerlauf [data-ganlegen]')].pop().click());
    await p.waitForTimeout(400);
    const a2 = await p.evaluate(() => window.__aufruf);
    pruefe('… und erst der Druck schickt art:idee', a2 && a2.name === 'gehirnFrage' && a2.data.art === 'idee', JSON.stringify(a2));
    pruefe('… danach „bei der Leitung gelandet"', /bei der Leitung gelandet/.test(await verlaufText(p)));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 5 Weniger Bewegung ──');
  {
    const p = await oeffne(b, 390, 844, { wenigBewegung: true });
    await aufSeite(p);
    await antwort(p, { gehirnFrage: { data: { antwort: 'Eins zwei drei vier fünf sechs sieben acht neun zehn.', abgedeckt: true } } });
    await p.fill('#gehirnFeld', 'Test');
    await p.click('#gehirnFragen');
    await fertig(p);
    await p.waitForTimeout(50);
    pruefe('die Antwort steht sofort ganz da', /neun zehn\./.test(await verlaufText(p)));
    const anim = await p.evaluate(() => getComputedStyle(document.querySelector('#gehirnVerlauf .gehirn-antwort')).animationName);
    pruefe('… ohne Einblend-Animation', anim === 'none', anim);
    await zu(p);
  }

  console.log('\n── 8 Anlegen lassen ──');
  {
    const p = await oeffne(b, 1440, 900);
    await aufSeite(p);
    /* Aus dem Betrieb (19.10.2026): „nur einen knopf … beim fragen und
       nicht 3 das verwirrt mehr als es hilft". */
    const knoepfe = await p.evaluate(() => [...document.querySelectorAll('.gehirn-knoepfe button')].filter(b => b.getClientRects().length && getComputedStyle(b).display !== 'none').map(b => b.textContent.trim()));
    pruefe('ein Knopf zum Abschicken: „Senden" (dazu höchstens „Sprechen")', knoepfe.filter(t => t !== 'Sprechen' && t !== 'Zuhören …').join() === 'Senden', JSON.stringify(knoepfe));
    const sk = await p.evaluate(() => { const cb = document.querySelector('#ntStudios input:not(:disabled)'); return cb ? cb.value : null; });
    await antwort(p, { gehirnAktion: { data: { vorschlag: {
      typ: 'aufgabe', titel: 'Geräte desinfizieren', text: 'Alle Westen und Kabel', schritte: ['Westen', 'Kabel'],
      frist: '2026-10-23', alle: false, studioKeys: sk ? [sk] : [], studioNamen: ['Hürth'], wichtig: false } } } });
    await p.fill('#gehirnFeld', 'Bis Freitag in Hürth die Geräte desinfizieren');
    await p.click('#gehirnFragen');
    await fertig(p);
    const a3 = await p.evaluate(() => window.__aufruf);
    pruefe('ruft gehirnAktion mit dem Text', a3 && a3.name === 'gehirnAktion' && /desinfizieren/.test(a3.data.text), JSON.stringify(a3));
    const t3 = await verlaufText(p);
    pruefe('zeigt den Vorschlag als Vorschau', /Geräte desinfizieren/.test(t3) && /23\.10\.2026/.test(t3) && /Hürth/.test(t3), t3.slice(-300));
    const schreibVorher = await p.evaluate(() => (window.__schreib || []).length + (window.__hinzu || []).length);
    await p.click('#gehirnVerlauf [data-gvorschlag]');
    await p.waitForTimeout(900);
    pruefe('„Übernehmen" öffnet Verwaltung → Erstellen', await sichtbar(p, '#view-chef.show') && await sichtbar(p, '[data-cpane="erstellen"]'));
    const form = await p.evaluate(() => ({
      titel: document.getElementById('ntTitle').value, frist: document.getElementById('ntDue').value,
      schritte: document.getElementById('ntSteps').value,
      studios: [...document.querySelectorAll('#ntStudios input:checked')].map(c => c.value)
    }));
    pruefe('das Formular ist ausgefüllt (Titel, Frist, Schritte)', form.titel === 'Geräte desinfizieren' && form.frist === '2026-10-23' && /Westen\nKabel/.test(form.schritte), JSON.stringify(form));
    pruefe('… und das Studio angekreuzt', !sk || (form.studios.length === 1 && form.studios[0] === sk), JSON.stringify(form.studios) + ' / ' + sk);
    const schreibNachher = await p.evaluate(() => (window.__schreib || []).length + (window.__hinzu || []).length);
    pruefe('gespeichert wird NICHT von selbst — das macht der Mensch', schreibNachher === schreibVorher, schreibVorher + ' → ' + schreibNachher);

    await aufSeite(p);
    await antwort(p, { gehirnAktion: { data: { vorschlag: null, hinweis: 'Das ist eine Frage, keine Aufgabe.' } } });
    await p.fill('#gehirnFeld', 'Wie spät ist es?');
    await p.click('#gehirnFragen');
    await fertig(p);
    pruefe('ohne Vorschlag steht der Hinweis da', /eine Frage, keine Aufgabe/.test(await verlaufText(p)));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 8b Vorschau-Karte, Animation, „Jetzt anlegen" ──');
  /* Aus dem Betrieb (18.10.2026): „mit animationen … beim anlegen und
     das es übersichtlicher funktioniert". */
  {
    const p = await oeffne(b, 1440, 900);
    await aufSeite(p);
    /* Hürth ist in der Attrappe studio-6; der Chef darf in jedes Studio schreiben. */
    const sk = 'studio-6';
    // Während die KI baut: ein Rohbau der Karte, kein leerer Platz
    await p.evaluate(() => { window.__antwort = window.__antwort || {}; window.__antwort.gehirnAktion = () => new Promise(r => { window.__losGeht = r; }); });
    await p.fill('#gehirnFeld', 'Bis Freitag in Hürth die Geräte desinfizieren');
    await p.click('#gehirnFragen');
    await p.waitForTimeout(150);
    pruefe('während die KI arbeitet: das Gehirn denkt (Punkte, Symbol pulsiert)', await sichtbar(p, '#gehirnVerlauf .gehirn-denkt') &&
      await p.evaluate(() => document.getElementById('gehirnOrb').classList.contains('denkt')));
    await p.evaluate((k) => window.__losGeht({ data: { vorschlag: {
      typ: 'aufgabe', titel: 'Geräte desinfizieren', text: 'Westen und Kabel', schritte: ['Westen', 'Kabel'],
      frist: '2026-10-23', alle: false, studioKeys: k ? [k] : [], studioNamen: ['Hürth'], wichtig: false } } }), sk);
    await fertig(p);
    const karte = await p.evaluate(() => {
      const k = document.querySelector('#gehirnVerlauf .gv-karte');
      return k && { neu: k.classList.contains('gv-neu'), anim: [...k.children].map(c => getComputedStyle(c).animationName),
        verz: [...k.children].map(c => getComputedStyle(c).animationDelay), text: k.innerText,
        kaestchen: k.querySelectorAll('.gv-kaestchen').length };
    });
    pruefe('die Vorschau sieht aus wie eine Aufgabe (Titel, Schritte, Frist, Studio)', karte && /Geräte desinfizieren/.test(karte.text) &&
      karte.kaestchen === 2 && /23\.10\.2026/.test(karte.text) && /Hürth/.test(karte.text), karte && karte.text);
    pruefe('… die Teile kommen nacheinander herein (gestaffelt)', karte && karte.neu && karte.anim.every(a => a === 'gehirnRein') &&
      new Set(karte.verz).size === karte.verz.length, karte && JSON.stringify(karte.verz));
    pruefe('zwei klare Wege: „Jetzt anlegen" und „Im Formular bearbeiten"',
      await sichtbar(p, '#gehirnVerlauf [data-ganlegen]') && await sichtbar(p, '#gehirnVerlauf [data-gvorschlag]'));
    const vorher = await p.evaluate(() => (window.__schreib || []).length);
    pruefe('vor dem Druck ist nichts gespeichert', vorher === await p.evaluate(() => (window.__schreib || []).length));
    await p.click('#gehirnVerlauf [data-ganlegen]');
    await p.waitForTimeout(500);
    const geschrieben = await p.evaluate((n) => (window.__schreib || []).slice(n), vorher);
    const g = geschrieben[0] || {};
    pruefe('„Jetzt anlegen" schreibt die Aufgabe ins gewählte Studio', geschrieben.length === 1 && sk && g.pfad.indexOf('studios/' + sk + '/todos/') >= 0, JSON.stringify(geschrieben).slice(0, 300));
    pruefe('… mit denselben Feldern wie das Formular', g.daten && g.daten.title === 'Geräte desinfizieren' && g.daten.done === false &&
      g.daten.createdByUid === 'testuid' && g.daten.steps && g.daten.steps.length === 2 && typeof g.daten.due === 'number', JSON.stringify(g.daten));
    const fertigK = await p.evaluate(() => {
      const k = document.querySelector('#gehirnVerlauf .gv-karte');
      const pfad = k && k.querySelector('.gv-haken path');
      return k && { fertig: k.classList.contains('gv-fertig'), haken: pfad ? getComputedStyle(pfad).animationName : '',
        neuWieder: k.classList.contains('gv-neu'), text: k.innerText, knopf: !!k.querySelector('[data-ganlegen]') };
    });
    pruefe('danach: Haken zeichnet sich, „angelegt" steht da', fertigK && fertigK.fertig && fertigK.haken === 'gvHaken' && /angelegt/.test(fertigK.text), JSON.stringify(fertigK));
    pruefe('… die Karte kommt NICHT ein zweites Mal herein, und „Jetzt anlegen" ist weg', fertigK && !fertigK.neuWieder && !fertigK.knopf);
    await p.click('#gehirnVerlauf .gv-fertig [data-gziel]');
    await p.waitForTimeout(400);
    pruefe('„Zu den Aufgaben ›" führt hin', await sichtbar(p, '#view-todos.show'));

    // Ankündigung: „Jetzt senden"
    await aufSeite(p);
    await antwort(p, { gehirnAktion: { data: { vorschlag: { typ: 'ankuendigung', titel: '', text: 'Morgen Teammeeting um 9', schritte: [],
      frist: '', alle: true, studioKeys: [], studioNamen: [], wichtig: true } } } });
    await p.fill('#gehirnFeld', 'Sag allen: morgen Teammeeting um 9, wichtig');
    await p.click('#gehirnFragen'); await fertig(p);
    const vorher2 = await p.evaluate(() => (window.__schreib || []).length);
    const knopf = await p.evaluate(() => { const l = document.querySelectorAll('#gehirnVerlauf [data-ganlegen]'); return l.length ? l[l.length - 1].textContent.trim() : ''; });
    pruefe('Ankündigung: der Knopf heisst „Jetzt senden"', knopf === 'Jetzt senden', knopf);
    await p.evaluate(() => { const l = document.querySelectorAll('#gehirnVerlauf [data-ganlegen]'); l[l.length - 1].click(); });
    await p.waitForTimeout(500);
    const a = (await p.evaluate((n) => (window.__schreib || []).slice(n), vorher2)).filter(x => /^announcements/.test(x.pfad));
    pruefe('… schreibt eine Ankündigung an alle, „wichtig" mit leerer Bestätigungsliste', a.length === 1 && /announcements/.test(a[0].pfad) &&
      a[0].daten.target === 'all' && a[0].daten.wichtig === true && Array.isArray(a[0].daten.bestaetigtVon), JSON.stringify(a).slice(0, 300));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }
  {
    const p = await oeffne(b, 390, 844, { wenigBewegung: true });
    await aufSeite(p);
    await antwort(p, { gehirnAktion: { data: { vorschlag: { typ: 'aufgabe', titel: 'X', alle: true, studioKeys: [], studioNamen: [] } } } });
    await p.fill('#gehirnFeld', 'Aufgabe X'); await p.click('#gehirnFragen'); await fertig(p);
    const anim = await p.evaluate(() => [...document.querySelectorAll('#gehirnVerlauf .gv-karte > *')].map(c => getComputedStyle(c).animationName));
    pruefe('„weniger Bewegung": die Karte steht sofort ganz da', anim.length && anim.every(a => a === 'none'), JSON.stringify(anim));
    await zu(p);
  }


  console.log('\n── 8c Steuern: öffnen, nachschauen, eintragen ──');
  /* Aus dem Betrieb (19.10.2026): „kannst du auch dafür sorgen das die ki
     die ganze app steuern kann". Entschieden: alle mit den eigenen Rechten;
     Lesen sofort, Speichern mit Vorschau. */
  {
    const p = await oeffne(b, 1440, 900);
    await aufSeite(p);
    pruefe('zwei Beispiele, die etwas tun', (await p.$$('#gehirnChips [data-gbefehl]')).length === 2);
    // Öffnen: sofort, ohne Knopf
    await antwort(p, { gehirnAktion: { data: { vorschlag: { typ: 'navigation', ziel: 'putzplan', zielName: 'Putzplan', studioKey: '', studioName: '' } } } });
    await p.fill('#gehirnFeld', 'Öffne den Putzplan'); await p.click('#gehirnFragen');
    await p.waitForTimeout(1200);
    pruefe('„Öffne den Putzplan": der Putzplan ist offen, ohne weiteren Druck', await sichtbar(p, '#view-putzplan.show'));
    // Nachschauen: Aufgaben aus dem Speicher der App
    await aufSeite(p);
    await antwort(p, { gehirnAktion: { data: { vorschlag: { typ: 'abfrage', was: 'aufgaben', studioKey: '', studioName: '' } } } });
    await p.fill('#gehirnFeld', 'Was ist offen?'); await p.click('#gehirnFragen'); await fertig(p);
    const abf = await p.evaluate(() => { const k = [...document.querySelectorAll('#gehirnVerlauf .gv-karte')].pop(); return k ? k.innerText : ''; });
    pruefe('„Was ist offen?": Karte mit Studios und Zahlen, sofort', /Offene Aufgaben/i.test(abf) && /\d+ offen/.test(abf), abf.slice(0, 200));
    // Dienst heute: mit den Rechten gelesen
    await antwort(p, { gehirnAktion: { data: { vorschlag: { typ: 'abfrage', was: 'dienst', studioKey: 'studio-6', studioName: 'Hürth' } } } });
    await p.fill('#gehirnFeld', 'Wer hat heute Dienst in Hürth?'); await p.click('#gehirnFragen'); await fertig(p);
    const dienst = await p.evaluate(() => { const k = [...document.querySelectorAll('#gehirnVerlauf .gv-karte')].pop(); return k ? k.innerText : ''; });
    pruefe('„Wer hat heute Dienst?": die heutige Schicht steht da', /Heute im Dienst/i.test(dienst) && /09:00–14:00/.test(dienst), dienst.slice(0, 200));
    pruefe('nichts davon hat etwas gespeichert', !(await p.evaluate(() => (window.__schreib || []).some(x => /shifts|absences|handovers|todos/.test(x.pfad)))));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }
  {
    const p = await oeffne(b, 390, 844, { stub: 'stub-mitarbeiter.js' });
    await aufSeite(p);
    const morgen = await p.evaluate(() => { const d = new Date(Date.now() + 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); });
    await antwort(p, { gehirnAktion: { data: { vorschlag: { typ: 'abwesenheit', art: 'urlaub', von: morgen, bis: morgen, notiz: '', studioKey: 'studio-6', studioName: 'Hürth' } } } });
    await p.fill('#gehirnFeld', 'Ich will morgen Urlaub'); await p.click('#gehirnFragen'); await fertig(p);
    const k = await p.evaluate(() => { const c = [...document.querySelectorAll('#gehirnVerlauf .gv-karte')].pop(); const b = c && c.querySelector('[data-ganlegen]'); return { t: c ? c.innerText : '', knopf: b ? b.textContent.trim() : '' }; });
    pruefe('Mitarbeiter, Urlaub: Vorschau als „Antrag", Knopf „Antrag stellen"', /ANTRAG/i.test(k.t) && /geht an die Leitung/.test(k.t) && k.knopf === 'Antrag stellen', JSON.stringify(k));
    pruefe('… vor dem Druck nichts gespeichert', !(await p.evaluate(() => (window.__schreib || []).some(x => /absences/.test(x.pfad)))));
    await p.evaluate(() => [...document.querySelectorAll('#gehirnVerlauf [data-ganlegen]')].pop().click());
    await p.waitForTimeout(500);
    const ab = await p.evaluate(() => (window.__schreib || []).filter(x => /absences/.test(x.pfad)));
    pruefe('… danach: Antrag mit status „offen", im eigenen Studio, für sich selbst', ab.length === 1 && /studios\/studio-6\/absences/.test(ab[0].pfad) &&
      ab[0].daten.status === 'offen' && ab[0].daten.uid === 'testuid' && ab[0].daten.type === 'urlaub' && ab[0].daten.from === morgen, JSON.stringify(ab).slice(0, 300));
    pruefe('… und der Haken steht da', /Antrag gestellt/.test(await verlaufText(p)));
    await antwort(p, { gehirnAktion: { data: { vorschlag: { typ: 'uebergabe', text: 'Handtücher sind alle', studioKey: 'studio-6', studioName: 'Hürth' } } } });
    await p.fill('#gehirnFeld', 'Übergabe: Handtücher sind alle'); await p.click('#gehirnFragen'); await fertig(p);
    await p.evaluate(() => [...document.querySelectorAll('#gehirnVerlauf [data-ganlegen]')].pop().click());
    await p.waitForTimeout(500);
    const ho = await p.evaluate(() => (window.__schreib || []).filter(x => /handovers/.test(x.pfad)));
    pruefe('Übergabe: eingetragen mit Text und eigenem Namen', ho.length === 1 && ho[0].daten.text === 'Handtücher sind alle' && ho[0].daten.uid === 'testuid', JSON.stringify(ho).slice(0, 200));
    // Fremdes Studio: nichts
    await antwort(p, { gehirnAktion: { data: { vorschlag: { typ: 'uebergabe', text: 'X', studioKey: 'studio-7', studioName: 'Brühl' } } } });
    await p.fill('#gehirnFeld', 'Übergabe in Brühl: X'); await p.click('#gehirnFragen'); await fertig(p);
    await p.evaluate(() => [...document.querySelectorAll('#gehirnVerlauf [data-ganlegen]')].pop().click());
    await p.waitForTimeout(400);
    pruefe('fremdes Studio: nichts gespeichert', (await p.evaluate(() => (window.__schreib || []).filter(x => /handovers/.test(x.pfad)).length)) === 1);
    // Mitarbeiter will eine Aufgabe: Hinweis
    await antwort(p, { gehirnAktion: { data: { vorschlag: null, hinweis: 'Aufgaben und Ankündigungen legt die Studioleitung an.' } } });
    await p.fill('#gehirnFeld', 'Leg eine Aufgabe an'); await p.click('#gehirnFragen'); await fertig(p);
    pruefe('Mitarbeiter will eine Aufgabe: der Hinweis steht da', /legt die Studioleitung an/.test(await verlaufText(p)));
    // Im Formular bearbeiten
    await antwort(p, { gehirnAktion: { data: { vorschlag: { typ: 'abwesenheit', art: 'frei', von: morgen, bis: morgen, notiz: '', studioKey: 'studio-6', studioName: 'Hürth' } } } });
    await p.fill('#gehirnFeld', 'Morgen frei'); await p.click('#gehirnFragen'); await fertig(p);
    await p.evaluate(() => [...document.querySelectorAll('#gehirnVerlauf [data-gvorschlag]')].pop().click());
    await p.waitForTimeout(700);
    const form = await p.evaluate(() => ({ t: document.getElementById('abType').value, f: document.getElementById('abFrom').value }));
    pruefe('„Im Formular bearbeiten": Team → Abwesend ist ausgefüllt', await sichtbar(p, '#view-team.show') && form.t === 'frei' && form.f === morgen, JSON.stringify(form));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }


  console.log('\n── 8d Vorschläge zum Antippen ──');
  /* Entscheidung 19.10.2026: „läuft von selbst" = Vorschläge, ein Tipp
     erledigt es. Erste Fassung: überfällige Aufgaben, +1 Woche. */
  {
    const p = await oeffne(b, 1440, 900);
    await aufSeite(p);
    const karte = await p.evaluate(() => { const k = document.getElementById('gehirnVorschlaege'); return k && getComputedStyle(k).display !== 'none' ? k.innerText : ''; });
    pruefe('Chef: „Das könnte ich für dich tun" nennt die überfällige Aufgabe', /Das könnte ich für dich tun/.test(karte) && /Geräte desinfizieren/.test(karte), karte.slice(0, 200));
    const vorher = await p.evaluate(() => (window.__schreib || []).length);
    await p.click('#gehirnVorschlaege [data-gplus7^="studio-6/t1"]');
    await p.waitForTimeout(400);
    const w = await p.evaluate((n) => (window.__schreib || []).slice(n).filter(x => x.art === 'update'), vorher);
    const neu = w[0] && w[0].daten.due;
    pruefe('„+1 Woche": Frist ab heute eine Woche später', w.length === 1 && /studios\/studio-6\/todos\/t1/.test(w[0].pfad) &&
      neu > Date.now() + 6 * 864e5 && neu < Date.now() + 8 * 864e5, JSON.stringify(w));
    const t2 = await p.evaluate(() => document.getElementById('gehirnVorschlaege').innerText);
    pruefe('… danach „verschoben auf" und „Rückgängig"', /verschoben auf/.test(t2) && /Rückgängig/.test(t2), t2.slice(0, 200));
    await p.click('#gehirnVorschlaege [data-gplus7^="studio-6/t1"]');
    await p.waitForTimeout(400);
    const w2 = await p.evaluate((n) => (window.__schreib || []).slice(n).filter(x => x.art === 'update'), vorher);
    pruefe('„Rückgängig" setzt die alte Frist zurück', w2.length === 2 && w2[1].daten.due < Date.now(), JSON.stringify(w2[1] || {}));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }


  console.log('\n── 8e Abhaken, Defekt, Vorschläge Material ──');
  {
    const p = await oeffne(b, 1440, 900);
    await aufSeite(p);
    // Abhaken eindeutig: sofort, mit Rückgängig
    await antwort(p, { gehirnAktion: { data: { vorschlag: { typ: 'abhaken', bereich: 'putzplan', was: 'Toiletten', studioKey: 'studio-6', studioName: 'Hürth' } } } });
    const v0 = await p.evaluate(() => (window.__schreib || []).length);
    await p.fill('#gehirnFeld', 'Toiletten sind sauber'); await p.click('#gehirnFragen'); await fertig(p); await p.waitForTimeout(300);
    const w1 = await p.evaluate((n) => (window.__schreib || []).slice(n), v0);
    pruefe('„Toiletten sind sauber": sofort abgehakt (Putzplan c3, mit Namen)', w1.length === 1 && /cleaning\/c3/.test(w1[0].pfad) && w1[0].daten.done === true && w1[0].daten.doneByUid === 'testuid', JSON.stringify(w1).slice(0, 300));
    pruefe('… „Abgehakt" mit Rückgängig', /Abgehakt: Toiletten reinigen/.test(await verlaufText(p)) && !!(await p.$('#gehirnVerlauf [data-grueck]')));
    await p.click('#gehirnVerlauf [data-grueck]'); await p.waitForTimeout(300);
    const w2 = await p.evaluate((n) => (window.__schreib || []).slice(n), v0);
    pruefe('„Rückgängig" nimmt den Haken zurück', w2.length === 2 && w2[1].daten.done === false, JSON.stringify(w2[1] || {}));
    // nichts gefunden
    await antwort(p, { gehirnAktion: { data: { vorschlag: { typ: 'abhaken', bereich: 'putzplan', was: 'Fenster Dach', studioKey: 'studio-6', studioName: 'Hürth' } } } });
    await p.fill('#gehirnFeld', 'Dachfenster erledigt'); await p.click('#gehirnFragen'); await fertig(p);
    pruefe('nichts Passendes: Hinweis, nichts geschrieben', /finde ich nichts Offenes/.test(await verlaufText(p)) &&
      (await p.evaluate((n) => (window.__schreib || []).slice(n).length, v0)) === 2);
    // Defekt: Gerät gefunden → Vorschau → melden
    await antwort(p, { gehirnAktion: { data: { vorschlag: { typ: 'defekt', geraet: 'Gerät 1', text: 'piept dreimal', studioKey: 'studio-6', studioName: 'Hürth' } } } });
    await p.fill('#gehirnFeld', 'Gerät 1 piept dreimal'); await p.click('#gehirnFragen'); await fertig(p);
    const kd = await p.evaluate(() => { const k = [...document.querySelectorAll('#gehirnVerlauf .gv-karte')].pop(); return k ? k.innerText : ''; });
    pruefe('Defekt: Vorschau nennt das richtige Gerät', /EMS-Gerät 1/.test(kd) && /Kabine links/.test(kd) && /Jetzt melden/.test(kd), kd.slice(0, 200));
    pruefe('… vor dem Druck nichts gespeichert', (await p.evaluate((n) => (window.__schreib || []).slice(n).length, v0)) === 2);
    await p.evaluate(() => [...document.querySelectorAll('#gehirnVerlauf [data-ganlegen]')].pop().click());
    await p.waitForTimeout(500);
    const w3 = await p.evaluate((n) => (window.__schreib || []).slice(n), v0 + 2);
    const pf = w3.map(x => x.pfad).join(' ');
    pruefe('… danach: Verlauf, Zustand „defekt" und Aufgabe für die Leitung', /deviceLog/.test(pf) && /devices\/d1/.test(pf) && /todos/.test(pf) &&
      w3.some(x => /devices\/d1/.test(x.pfad) && x.daten.status === 'defekt'), JSON.stringify(w3).slice(0, 400));
    // Vorschläge: Material
    await aufSeite(p);
    const vk = await p.evaluate(() => document.getElementById('gehirnVorschlaege').innerText);
    pruefe('Vorschläge nennen fehlendes Material mit „Ansehen ›"', /Artikel fehl/.test(vk) && /Ansehen/.test(vk), vk.slice(0, 200));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }


  console.log('\n── 8f Schnellweg ohne KI, Tippfehler ──');
  /* Aus dem Betrieb (19.10.2026): „die ki braucht echt lang … das die ki
     auch rechtschreib Fehler verzeiht … staubsaugen=saugen". */
  {
    const p = await oeffne(b, 1440, 900);
    const kiWeg = () => p.evaluate(() => { window.__kiGefragt = 0; window.__antwort = window.__antwort || {};
      window.__antwort.gehirnAktion = () => { window.__kiGefragt++; return Promise.resolve({ data: { art: 'frage', antwort: 'KI', abgedeckt: true } }); }; });
    const sag = async (satz) => { await aufSeite(p); await kiWeg(); await p.fill('#gehirnFeld', satz); await p.click('#gehirnFragen'); await fertig(p); await p.waitForTimeout(800); };
    const ki = () => p.evaluate(() => window.__kiGefragt);
    const letzteKarte = () => p.evaluate(() => { const k = [...document.querySelectorAll('#gehirnVerlauf .gehirn-antwort')].pop(); return k ? k.innerText : ''; });
    await sag('öfne den putzplan');
    pruefe('„öfne den putzplan" (Tippfehler): Putzplan offen, ohne KI', await sichtbar(p, '#view-putzplan.show') && (await ki()) === 0);
    await sag('Dienstplan');
    pruefe('„Dienstplan": Team offen, ohne KI', await sichtbar(p, '#view-team.show') && (await ki()) === 0);
    await sag('wer hat heute dienst in hürth');
    pruefe('„wer hat heute dienst in hürth": Dienst-Karte, ohne KI', /Heute im Dienst/i.test(await letzteKarte()) && (await ki()) === 0, await letzteKarte());
    await sag('was ist offen');
    pruefe('„was ist offen": Aufgaben-Karte, ohne KI', /Offene Aufgaben/i.test(await letzteKarte()) && (await ki()) === 0);
    await sag('ich bin heute krank');
    pruefe('„ich bin heute krank": Vorschau Krank, ohne KI', /Krank/.test(await letzteKarte()) && /Jetzt eintragen/.test(await letzteKarte()) && (await ki()) === 0, await letzteKarte());
    const v0 = await p.evaluate(() => (window.__schreib || []).length);
    await sag('klo ist sauber');
    const w = await p.evaluate((n) => (window.__schreib || []).slice(n), v0);
    pruefe('„klo ist sauber" (gleiches Wort): Toiletten abgehakt, ohne KI', w.length === 1 && /cleaning\/c3/.test(w[0].pfad) && (await ki()) === 0, JSON.stringify(w).slice(0, 200));
    await sag('Wasserspendr aufgefüllt');
    const w2 = await p.evaluate((n) => (window.__schreib || []).slice(n), v0 + 1);
    pruefe('„Wasserspendr aufgefüllt" (Tippfehler): Aufgabe t3 abgehakt', w2.length === 1 && /todos\/t3/.test(w2[0].pfad) && w2[0].daten.done === true, JSON.stringify(w2).slice(0, 200));
    // Fragen und Unklares gehen an die KI
    for (const satz of ['Wie wasche ich die Westen?', 'Was mache ich bei einem Krampf', 'Anna ist krank', 'Aufgabe für Hürth: Spiegel putzen', 'ich bin ab Montag krank']) {
      await sag(satz);
      pruefe('„' + satz + '" geht an die KI', (await ki()) === 1);
    }
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 9 Lagebericht ──');
  {
    const p = await oeffne(b, 1440, 900, { vorher: () => {
      window.__lagebericht = { tag: { text: 'Heute ging es vor allem um Atteste.', zahlen: { fragen: 12, offen: 2, ideen: 1 }, stand: Date.now(), ki: true } };
    } });
    await aufSeite(p);
    await p.waitForTimeout(300);
    const kt = await p.evaluate(() => document.getElementById('gehirnBericht').innerText);
    pruefe('Leitung: der Lagebericht steht da, mit Zahlen', /um Atteste/.test(kt) && /12/.test(kt) && /Fragen/.test(kt), kt.slice(0, 200));
    await p.click('#gehirnBericht [data-gbart="woche"]');
    await p.waitForTimeout(200);
    pruefe('Reiter Woche: ehrlich, wann der erste kommt', /Montagmorgen/.test(await p.evaluate(() => document.getElementById('gehirnBericht').innerText)));
    await antwort(p, { lageberichtJetzt: { data: { ok: true } } });
    await p.click('#gehirnBericht [data-gbjetzt]');
    await p.waitForTimeout(300);
    const a4 = await p.evaluate(() => window.__aufruf);
    pruefe('Chef: „Jetzt aktualisieren" ruft lageberichtJetzt (art:woche)', a4 && a4.name === 'lageberichtJetzt' && a4.data.art === 'woche', JSON.stringify(a4));
    const seite = await p.evaluate(() => {
      const h = document.querySelector('.gehirn-haupt').getBoundingClientRect(), s = document.querySelector('.gehirn-seite').getBoundingClientRect();
      return { nebeneinander: s.left >= h.right - 1, hb: Math.round(h.width), sb: Math.round(s.width) };
    });
    pruefe('am Rechner zwei Spalten: Gespräch links, Bericht rechts', seite.nebeneinander && seite.hb > 500, JSON.stringify(seite));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }
  {
    const p = await oeffne(b, 390, 844, { stub: 'stub-mitarbeiter.js' });
    await aufSeite(p);
    pruefe('Mitarbeiter: die Seite ist da', await sichtbar(p, '#view-gehirn.show'));
    pruefe('Mitarbeiter: kein Lagebericht', !(await sichtbar(p, '#gehirnBericht')));
    /* Seit 19.10.2026 („die ganze app steuern", Entscheidung: alle, mit
       den eigenen Rechten) hat auch der Mitarbeiter „Erledigen lassen". */
    pruefe('Mitarbeiter: derselbe eine Knopf „Senden"', await sichtbar(p, '#gehirnFragen') && !(await p.$('#gehirnAnlegen')) && !(await p.$('#gehirnIdee')));
    await zu(p);
  }

  console.log('\n── 10 Aus dem Rettungsring ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h);
    await p.click('#hilfeBtn'); await p.waitForTimeout(400);
    pruefe(w + ' px: im Start der Hilfe steht „Studio-Gehirn fragen"', await sichtbar(p, '#hilfeGehirnBtn'));
    await p.fill('#hilfeSuche', 'quokka staubsauger');
    await p.waitForTimeout(300);
    await p.click('#hilfeTreffer [data-hgehirn]');
    await p.waitForTimeout(400);
    pruefe(w + ' px: der Verweis führt auf die Seite, Hilfe zu', await sichtbar(p, '#view-gehirn.show') && !(await sichtbar(p, '#hilfe.show')));
    pruefe(w + ' px: die Suche steht im Feld', (await p.inputValue('#gehirnFeld')) === 'quokka staubsauger');
    pruefe(w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }


  console.log('\n── 12 Das eigene Fenster („Jarvis") ──');
  /* Aus dem Betrieb (19.10.2026): „das die ki am startbildschirm
     präsentiert wird und ein eigenes Fenster … wird … und Schritte macht
     automatisch und wir das sehen und so auch statt nur diese Punkte". */
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h);
    await p.waitForTimeout(300);
    const knopf = await jvKnopf(p);
    pruefe(w + ' px: „Gehirn" steht auf der Startseite (' + knopf + ')', await sichtbar(p, '#view-home.show') && (w < 821 ? knopf === '#jarvisStartAlt' : knopf === '#jarvisStartPc'));
    await p.click(knopf); await p.waitForTimeout(400);
    pruefe(w + ' px: ein Tipp öffnet das eigene Fenster', await sichtbar(p, '#jarvis') && await p.evaluate(() => {
      const r = document.getElementById('jarvis').getBoundingClientRect(); return r.width >= innerWidth - 1 && r.height >= innerHeight - 1; }));
    if (w === 1440) {
      const sp = await p.evaluate(() => { const l = document.querySelector('.jv-links').getBoundingClientRect(), r = document.querySelector('.jv-rechts').getBoundingClientRect(); return { neben: r.left >= l.right - 1, rb: Math.round(r.width) }; });
      pruefe('am Rechner zwei Spalten: Kern links, Gespräch rechts', sp.neben && sp.rb > 500, JSON.stringify(sp));
    }
    await antwort(p, { gehirnFrage: { data: { antwort: 'Westen im Schonprogramm waschen.', abgedeckt: true } } });
    await p.fill('#jarvisFeld', 'Wie wasche ich die Westen?');
    await p.click('#jarvisSenden');
    await p.waitForFunction(() => !document.querySelector('#jarvisVerlauf .gehirn-denkt'), null, { timeout: 5000 });
    await p.waitForTimeout(1500);
    const jt = await p.evaluate(() => document.getElementById('jarvisVerlauf').innerText);
    pruefe(w + ' px: Antwort im Fenster, mit sichtbaren Schritten', /Schonprogramm/.test(jt) && /Frage das Studio-Gehirn/.test(jt) && /Im Studio-Wissen gefunden/.test(jt), jt.slice(0, 300));
    pruefe(w + ' px: dieselbe Antwort steht auch unter Ich → Gehirn', /Schonprogramm/.test(await p.evaluate(() => document.getElementById('gehirnVerlauf').innerText)));
    pruefe(w + ' px: Status sagt, dass es fertig ist', /Erledigt/.test(await p.textContent('#jarvisStatus')));
    // Auftrag: Schritte, dann geht das Fenster zu und die Seite öffnet sich
    await p.fill('#jarvisFeld', 'öffne den putzplan');
    await p.click('#jarvisSenden');
    await p.waitForTimeout(150);
    const schritte = await p.evaluate(() => document.getElementById('jarvisVerlauf').innerText);
    pruefe(w + ' px: „öffne den putzplan": Schritte „Erkannt" und „Öffne Putzplan"', /Erkannt: Seite öffnen/.test(schritte) && /Öffne Putzplan/.test(schritte), schritte.slice(-200));
    await p.waitForTimeout(900);
    pruefe(w + ' px: … danach ist das Fenster zu und der Putzplan offen', !(await sichtbar(p, '#jarvis')) && await sichtbar(p, '#view-putzplan.show'));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }
  {
    const p = await oeffne(b, 390, 844);
    await p.click(await jvKnopf(p)); await p.waitForTimeout(300);
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    pruefe('Escape schliesst das Fenster', !(await sichtbar(p, '#jarvis')) && await sichtbar(p, '#view-home.show'));
    await zu(p);
  }
  /* Neues Aussehen (live): der Knopf steht in der Bereichszeile — ohne
     zusätzliche Höhe. Auf 320 × 568 bleibt er weg (wie „Neu"). */
  for (const [w, h, da] of [[360, 780, true], [390, 844, true], [430, 932, true], [820, 1180, true], [320, 568, false]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    await p.addInitScript({ path: SP + '/stub-chef.js' });
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.goto(APP + '?neu=1', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
    await p.waitForTimeout(800);
    const k = await jvKnopf(p);
    /* Einreihig = die Zeile ist mit Knopf nicht höher als ohne. */
    const zeile = await p.evaluate(() => { const z = document.getElementById('bereichZeile'), k = document.getElementById('jarvisStart');
      const mit = z.getBoundingClientRect().height; const war = k.hidden; k.hidden = true; const ohne = z.getBoundingClientRect().height; k.hidden = war;
      return Math.round(mit - ohne); });
    /* Unter 380 px wartet „Gehirn", solange „Neu" dasteht (siehe CSS). */
    const neuDa = await sichtbar(p, '#neuPille');
    const wartet = w < 380 && neuDa;
    pruefe('neues Aussehen ' + w + '×' + h + ': ' + (!da ? 'kein Knopf (zu kurz)' : (wartet ? 'wartet hinter „Neu"' : 'Knopf in der Bereichszeile')) + ', Zeile bleibt einreihig',
      da ? ((wartet ? k === null : k === '#jarvisStart') && zeile <= 0) : k === null, k + ' · Zeile ' + zeile + ' px höher · Neu ' + neuDa);
    if (da && !wartet) { await p.click(k); await p.waitForTimeout(300); pruefe('… und er öffnet das Fenster', await sichtbar(p, '#jarvis')); }
    await ctx.close();
  }
  {
    const p = await oeffne(b, 390, 844, { wenigBewegung: true });
    await p.click(await jvKnopf(p)); await p.waitForTimeout(300);
    const anim = await p.evaluate(() => [...document.querySelectorAll('#jarvisKern i')].map(i => getComputedStyle(i).animationName));
    pruefe('„weniger Bewegung": die Ringe drehen sich nicht', anim.length === 3 && anim.every(a => a === 'none'), JSON.stringify(anim));
    await zu(p);
  }

  console.log('\n── 11 Fremde Firma ──');
  {
    const p = await oeffne(b, 390, 844, { vorher: () => { window.__firma = 'fremd-ab12'; } });
    const zeile = await p.evaluate(async () => {
      document.getElementById('bereichKopf').click();
      for (let i = 0; i < 50 && !document.querySelector('#allesLadeInhalt .al-zeile'); i++) await new Promise(r => setTimeout(r, 100));
      return !!document.querySelector('#allesLadeInhalt [data-alles="gehirn"]');
    });
    pruefe('fremde Firma: keine Zeile unter „Alles"', !zeile);
    await p.evaluate(() => { const l = document.getElementById('allesLade'); if (!l.hidden) document.getElementById('bereichKopf').click(); });
    await p.click('#hilfeBtn'); await p.waitForTimeout(400);
    pruefe('fremde Firma: die Hilfe selbst öffnet sich (Gegenprobe)', await sichtbar(p, '#hilfe.show #hilfeSuchTeil'));
    pruefe('fremde Firma: kein Knopf in der Hilfe', !(await sichtbar(p, '#hilfeGehirnBtn')));
    await p.fill('#hilfeSuche', 'quokka'); await p.waitForTimeout(300);
    pruefe('fremde Firma: kein Verweis unter den Treffern', !(await p.$('#hilfeTreffer [data-hgehirn]')));
    await p.evaluate(() => { const z = document.getElementById('hilfeZu'); if (z) z.click(); });
    pruefe('fremde Firma: kein „Gehirn"-Knopf auf der Startseite', !(await jvKnopf(p)));
    await zu(p);
  }

  console.log('\n── 13 Trefferflächen ──');
  for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    for (const dichte of ['normal', 'kompakt']) {
      const p = await oeffne(b, w, h, { vorher: () => {
        window.__lagebericht = { tag: { text: 'Bericht.', zahlen: { fragen: 1, offen: 0, ideen: 0 }, stand: Date.now() } };
      } });
      if (dichte === 'kompakt') await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt'));
      await aufSeite(p);
      const ids = async (sel) => p.evaluate(({ s, T }) => {
        const F = eval('(' + T + ')'); const zuKlein = [];
        document.querySelectorAll(s).forEach(el => {
          if (!el.getClientRects().length) return;
          el.scrollIntoView({ block: 'center' });
          const m = F(el);
          if (m.w < 44 || m.h < 44) zuKlein.push((el.id || el.textContent.trim()).slice(0, 24) + ' ' + m.w + '×' + m.h);
        });
        return zuKlein;
      }, { s: sel, T: TREFFER.toString() });
      let zuKlein = await ids('#gehirnChips .gehirn-chip, #gehirnFragen, #gehirnMic, #gehirnBericht button, #gehirnVorschlaege button');
      await antwort(p, {
        gehirnFrage: { data: { antwort: 'Ok.', abgedeckt: true } },
        gehirnAktion: { data: { vorschlag: { typ: 'aufgabe', titel: 'X', alle: true, studioKeys: [], studioNamen: [] } } }
      });
      await p.fill('#gehirnFeld', 'Wie lege ich eine Aufgabe an?'); await p.click('#gehirnFragen'); await fertig(p);
      await p.fill('#gehirnFeld', 'Aufgabe X'); await p.click('#gehirnFragen'); await fertig(p);
      zuKlein = zuKlein.concat(await ids('#gehirnVerlauf [data-gziel], #gehirnVerlauf [data-gvorschlag], #gehirnVerlauf [data-ganlegen]'));
      await p.click('#gehirnVerlauf [data-ganlegen]'); await p.waitForTimeout(400);
      zuKlein = zuKlein.concat(await ids('#gehirnVerlauf .gv-fertig [data-gziel]'));
      // Das eigene Fenster: Kachel auf der Startseite und die Knöpfe darin
      await p.evaluate(() => { location.hash = '#home'; }); await p.waitForTimeout(400);
      const jk = await jvKnopf(p);
      if (jk) zuKlein = zuKlein.concat(await ids(jk));
      if (jk) {
        await p.click(jk); await p.waitForTimeout(300);
        zuKlein = zuKlein.concat(await ids('#jarvisZu, #jarvisSenden, #jarvisMic'));
        const jvBreit = await p.evaluate(() => document.getElementById('jarvis').scrollWidth > innerWidth + 1);
        if (jvBreit) zuKlein.push('Fenster ragt seitlich hinaus');
      } else if (h > 640 || w >= 821) zuKlein.push('„Gehirn" nicht erreichbar');
      const breit = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      pruefe(w + ' px ' + dichte + ': jedes neue Bedienelement ≥ 44 × 44, nichts ragt hinaus',
        !zuKlein.length && !breit, zuKlein.join(', ') + (breit ? ' · Seite scrollt seitlich' : ''));
      if (p._fehler.length) pruefe(w + ' px ' + dichte + ': ohne Skriptfehler', false, p._fehler.join(' | '));
      await zu(p);
    }
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Studio-Gehirn: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Studio-Gehirn: Seite, Animation, App-Hilfe, Anlegen, Lagebericht, fremde Firma, Trefferflächen — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + (e && e.message)); process.exit(1); });
