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
  /* serviceWorkers:'block' (22.10.2026): sonst holt der Service-Worker
     nach dem ersten Laden das echte Firebase an page.route vorbei, die
     App lädt neu und steht in der Anmeldemaske — jeder Durchlauf hier
     war deshalb rot, auch auf main. */
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block',
    reducedMotion: opt.wenigBewegung ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  /* Seit Runde 177 öffnet Formi standardmäßig KOMPAKT (Kugel, Fenster
     neben der App; geprüft in test-formi-kugel). Diese Datei prüft das
     Vollbild mit Mini-Fenstern, das per „Groß" weiter da ist. */
  if (!opt.kompakt) await p.addInitScript(() => { try { localStorage.setItem('kf_jv_kompakt', '0'); } catch (e) {} });
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
/* Seit Runde 182 (22.10.2026, „der alte formi knopf oben kann weg")
   öffnet nur noch die Kugel Formi. */
const jvKnopf = (p) => p.evaluate(() => ['#formiKugel'].find(s => {
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
    /* Seit Runde 170 heisst die Zeile „Formi" (ein Name überall). */
    pruefe('„Alles" hat die Zeile Formi', !!zeile && /^Formi/.test(zeile) && !/Gehirn/.test(zeile), String(zeile));
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

    /* Worker 2.10 (22.10.2026): Smalltalk wird keine offene Frage. Live
       stand unter „was geht" trotzdem „ging an Semih" — die App schloss
       aus „nicht abgedeckt" auf „weitergegeben". */
    await antwort(p, { gehirnFrage: { data: { antwort: 'Hey! Was steht an?', abgedeckt: false, offen: null } } });
    await p.fill('#gehirnFeld', 'was geht');
    await p.click('#gehirnFragen');
    await fertig(p); await p.waitForTimeout(600);
    const tKlein = await p.$$eval('#gehirnVerlauf .gehirn-antwort', l => l[l.length - 1].innerText);
    pruefe('Smalltalk ohne offene Frage: kein „ging an Semih"', /Was steht an/.test(tKlein) && !/ging an Semih/.test(tKlein), tKlein.slice(-160));
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
    /* Seit 20.10.2026 ein Mini-Fenster im Gespräch statt Seitenwechsel —
       aus dem Betrieb: „statt die seite putzplan direkt zu öffnen zum
       beispiel sowas als mini fenster in der ki seite zu öffnen". */
    await p.fill('#gehirnFeld', 'Öffne den Putzplan'); await p.click('#gehirnFragen');
    await fertig(p); await p.waitForTimeout(400);
    const mf = await p.evaluate(() => { const f = [...document.querySelectorAll('#gehirnVerlauf .gm-fenster')].pop(); return f ? f.innerText : ''; });
    pruefe('„Öffne den Putzplan": Mini-Fenster im Gespräch, die Seite bleibt', /Putzplan/.test(mf) && /Toiletten reinigen/.test(mf) && await sichtbar(p, '#view-gehirn.show'), mf.slice(0, 200));
    await p.click('#gehirnVerlauf .gm-ganz'); await p.waitForTimeout(500);
    pruefe('… „Ganz öffnen" führt auf die Seite', await sichtbar(p, '#view-putzplan.show'));
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
     auch rechtschreib Fehler verzeiht … staubsaugen=saugen".
     Seit 20.10.2026 („Rückfrage statt raten" — auf der Liste gewählt mit
     „1,2,3…") fragt Formi ohne „Mein Studio" bei mehreren Studios nach.
     Hier geht es um den Schnellweg, also ist Mein Studio gesetzt; die
     Nachfrage selbst prüft 12h. */
  {
    const p = await oeffne(b, 1440, 900, { vorher: () => { localStorage.setItem('kf_jv_persona', JSON.stringify({ studio: 'studio-6' })); } });
    const kiWeg = () => p.evaluate(() => { window.__kiGefragt = 0; window.__antwort = window.__antwort || {};
      window.__antwort.gehirnAktion = () => { window.__kiGefragt++; return Promise.resolve({ data: { art: 'frage', antwort: 'KI', abgedeckt: true } }); }; });
    const sag = async (satz) => { await aufSeite(p); await kiWeg(); await p.fill('#gehirnFeld', satz); await p.click('#gehirnFragen'); await fertig(p); await p.waitForTimeout(800); };
    const ki = () => p.evaluate(() => window.__kiGefragt);
    const letzteKarte = () => p.evaluate(() => { const k = [...document.querySelectorAll('#gehirnVerlauf .gehirn-antwort')].pop(); return k ? k.innerText : ''; });
    const miniTitel = () => p.evaluate(() => { const f = [...document.querySelectorAll('#gehirnVerlauf .gm-fenster b')].pop(); return f ? f.textContent : ''; });
    await sag('öfne den putzplan');
    pruefe('„öfne den putzplan" (Tippfehler): Mini-Fenster Putzplan, ohne KI', (await miniTitel()) === 'Putzplan' && (await ki()) === 0, await miniTitel());
    await sag('Dienstplan');
    pruefe('„Dienstplan": Mini-Fenster „Dienst heute", ohne KI', (await miniTitel()) === 'Dienst heute' && (await ki()) === 0, await miniTitel());
    await sag('geh zum putzplan');
    pruefe('„geh zum putzplan": wer ausdrücklich hin will, kommt auf die Seite', await sichtbar(p, '#view-putzplan.show') && (await ki()) === 0);
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
  for (const [w, h] of [[320, 568], [390, 844], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
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
  for (const [w, h] of [[320, 568], [390, 844], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h);
    await p.waitForTimeout(300);
    const knopf = await jvKnopf(p);
    pruefe(w + ' px: die Formi-Kugel steht auf der Startseite (' + knopf + ')', await sichtbar(p, '#view-home.show') && knopf === '#formiKugel');
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
    pruefe(w + ' px: Antwort im Fenster, mit sichtbaren Schritten', /Schonprogramm/.test(jt) && /Frage Formi/.test(jt) && /Im Studio-Wissen gefunden/.test(jt), jt.slice(0, 300));
    pruefe(w + ' px: dieselbe Antwort steht auch unter Ich → Gehirn', /Schonprogramm/.test(await p.evaluate(() => document.getElementById('gehirnVerlauf').innerText)));
    pruefe(w + ' px: Status sagt, dass es fertig ist', /Erledigt/.test(await p.textContent('#jarvisStatus')));
    // Auftrag: Schritte, dann geht das Fenster zu und die Seite öffnet sich
    await p.fill('#jarvisFeld', 'öffne den putzplan');
    await p.click('#jarvisSenden');
    await p.waitForTimeout(150);
    const schritte = await p.evaluate(() => document.getElementById('jarvisVerlauf').innerText);
    pruefe(w + ' px: „öffne den putzplan": Schritte „Erkannt" und „Hole Putzplan ins Gespräch"', /Erkannt: Fenster öffnen/.test(schritte) && /Hole Putzplan ins Gespräch/.test(schritte), schritte.slice(-200));
    await p.waitForTimeout(900);
    /* Seit 20.10.2026 bleibt das Fenster offen — das Mini-Fenster steht im
       Gespräch („… als mini fenster in der ki seite zu öffnen"). */
    pruefe(w + ' px: … das Mini-Fenster steht im Gespräch, Jarvis bleibt offen', await sichtbar(p, '#jarvis') && !!(await p.$('#jarvisVerlauf .gm-fenster')));
    await p.click('#jarvisVerlauf .gm-ganz'); await p.waitForTimeout(500);
    pruefe(w + ' px: … „Ganz öffnen": Fenster zu, Putzplan offen', !(await sichtbar(p, '#jarvis')) && await sichtbar(p, '#view-putzplan.show'));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }
  /* Aus dem Betrieb (19.10.2026): „der chat lässt sich nicht scrollen und
     es sieht sehr buggy aus" — die Karten waren auf ihren Kopf gestaucht. */
  for (const [w, h] of [[320, 568], [390, 844], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h);
    await p.click(await jvKnopf(p)); await p.waitForTimeout(300);
    await antwort(p, { gehirnFrage: { data: { antwort: 'Eine längere Antwort mit mehreren Sätzen. Sie soll ganz zu sehen sein. Und noch ein Satz, damit die Karte Höhe hat.', abgedeckt: true } } });
    for (let i = 0; i < 6; i++) {
      await p.fill('#jarvisFeld', 'Frage Nummer ' + i);
      await p.click('#jarvisSenden');
      await p.waitForFunction(() => !document.querySelector('#jarvisVerlauf .gehirn-denkt'), null, { timeout: 5000 });
    }
    await p.waitForTimeout(1600);
    const m = await p.evaluate(() => {
      const v = document.getElementById('jarvisVerlauf');
      const gestaucht = [...v.querySelectorAll('.gehirn-antwort')].filter(a => a.scrollHeight > a.clientHeight + 1).length;
      const letzte = v.lastElementChild.getBoundingClientRect(), box = v.getBoundingClientRect();
      return { scrollt: v.scrollHeight > v.clientHeight + 10, gestaucht, unten: letzte.bottom <= box.bottom + 2 && letzte.bottom > box.top };
    });
    pruefe(w + ' px: Fenster-Verlauf scrollt, keine Karte gestaucht, die neueste steht im Bild', m.scrollt && m.gestaucht === 0 && m.unten, JSON.stringify(m));
    await zu(p);
  }
  {
    const p = await oeffne(b, 390, 844);
    await p.click(await jvKnopf(p)); await p.waitForTimeout(300);
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    pruefe('Escape schliesst das Fenster', !(await sichtbar(p, '#jarvis')) && await sichtbar(p, '#view-home.show'));
    await zu(p);
  }
  /* Runde 182 (22.10.2026, aus dem Betrieb: „der alte formi knopf oben
     kann weg"): die Knöpfe in der Bereichszeile, neben der Begrüssung
     und oben am Rechner gibt es nicht mehr — nur die Kugel. Im neuen
     Aussehen wie im bisherigen, auch auf 320 × 568. */
  for (const [w, h, neu] of [[360, 780, true], [390, 844, false], [820, 1180, true], [320, 568, true], [1440, 900, true]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    await p.addInitScript({ path: SP + '/stub-chef.js' });
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.goto(APP + (neu ? '?neu=1' : ''), { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
    await p.waitForTimeout(800);
    const alt = await p.evaluate(() => ['jarvisStart', 'jarvisStartAlt', 'jarvisStartPc'].filter(id => document.getElementById(id)));
    pruefe((neu ? 'neues' : 'bisheriges') + ' Aussehen ' + w + '×' + h + ': kein alter Formi-Knopf, die Kugel ist da', !alt.length && await sichtbar(p, '#formiKugel'), alt.join(','));
    await p.click('#formiKugel'); await p.waitForTimeout(300);
    pruefe('… und die Kugel öffnet Formi', await sichtbar(p, '#jarvis'));
    await ctx.close();
  }
  console.log('\n── 12c Mini-Fenster, Rückgängig, Gespräche, Taste J (20.10.2026) ──');
  /* Aus dem Betrieb (20.10.2026): „statt die seite putzplan direkt zu
     öffnen … als mini fenster in der ki seite … verschiedene farben …
     viel mehr motion … lockereren ton … mini interaktionen und chat
     verläufe speicherung" — und auf die Ideenliste: „mach alles davon". */
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    /* Die Wochen-Sicherung des Chefs startet 4 s nach dem Anmelden und
       schreibt nach archives/. Auf einem langsamen Rechner fiel sie mitten
       in die Zählung der Schreibvorgänge unten (gefunden 20.10.2026). Sie
       gehört nicht zu diesem Test — also gilt sie hier als heute erledigt. */
    const p = await oeffne(b, w, h, { vorher: () => {
      const d = new Date(); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const tag = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - tag);
      const kw = Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 86400000 + 1) / 7);
      localStorage.setItem('kf_arch_' + t.getUTCFullYear() + '-KW' + String(kw).padStart(2, '0'), String(Date.now()));
    } });
    await p.keyboard.press('j'); await p.waitForTimeout(500);
    pruefe(w + ' px: Taste J öffnet Jarvis', await sichtbar(p, '#jarvis'));
    await p.fill('#jarvisFeld', 'öffne den putzplan'); await p.click('#jarvisSenden'); await p.waitForTimeout(900);
    const m = await p.evaluate(() => {
      const f = [...document.querySelectorAll('#jarvisVerlauf .gm-fenster')].pop();
      return f && { ort: f.querySelector('.gm-ort').textContent, farbe: getComputedStyle(f).getPropertyValue('--gm').trim(),
        zeilen: [...f.querySelectorAll('.gm-zeile')].map(z => z.innerText.replace(/\s+/g, ' ').trim()), spruch: !!f.previousElementSibling && f.previousElementSibling.className };
    });
    pruefe(w + ' px: Mini-Putzplan im Studio mit Offenem (Hürth), eigene Farbe, mit Spruch', m && m.ort === 'Hürth' && m.farbe === '#4EE6D2' && m.zeilen.some(z => /Toiletten reinigen/.test(z)) && m.spruch === 'ga-spruch', JSON.stringify(m));
    const v0 = await p.evaluate(() => (window.__schreib || []).length);
    await p.click('#jarvisVerlauf .gm-haken[aria-label="Toiletten reinigen abhaken"]'); await p.waitForTimeout(250);
    const nach = await p.evaluate((n) => ({ w: (window.__schreib || []).slice(n), gedrueckt: document.querySelector('#jarvisVerlauf .gm-haken[aria-label="Toiletten reinigen wieder öffnen"]') ? true : false,
      rueck: !!document.querySelector('#jarvisVerlauf [data-gmrueck]'), puls: !!document.querySelector('#jarvisVerlauf .gm-zeile.gm-puls'),
      stimmung: document.getElementById('jarvis').className }), v0);
    pruefe(w + ' px: Abhaken im Mini-Fenster schreibt Putzplan c3 (mit Namen), Zeile hakt sich, Rückgängig mit Countdown', nach.w.length === 1 && /cleaning\/c3/.test(nach.w[0].pfad) && nach.w[0].daten.done === true && nach.w[0].daten.doneByUid === 'testuid' && nach.gedrueckt && nach.rueck && nach.puls, JSON.stringify(nach).slice(0, 300));
    pruefe(w + ' px: … der Kern leuchtet kurz grün (Stimmung „ok")', /jv-s-ok/.test(nach.stimmung), nach.stimmung);
    await p.click('#jarvisVerlauf [data-gmrueck]'); await p.waitForTimeout(250);
    const zurueck = await p.evaluate((n) => (window.__schreib || []).slice(n), v0);
    pruefe(w + ' px: Rückgängig nimmt den Haken zurück', zurueck.length === 2 && zurueck[1].daten.done === false && !(await p.$('#jarvisVerlauf [data-gmrueck]')), JSON.stringify(zurueck[1] || {}));
    if (w === 1440) {
      // Countdown: nach 10 s ist „Rückgängig" weg
      await p.click('#jarvisVerlauf .gm-haken[aria-label="Toiletten reinigen abhaken"]'); await p.waitForTimeout(300);
      const anim = await p.evaluate(() => getComputedStyle(document.querySelector('#jarvisVerlauf .gm-rueck'), '::after').animationName);
      await p.waitForTimeout(10200);
      pruefe('Rückgängig läuft als Countdown (gmCountdown) und ist nach 10 s weg', anim === 'gmCountdown' && !(await p.$('#jarvisVerlauf [data-gmrueck]')), anim);
      // Studio wechseln
      await p.click('#jarvisVerlauf .gm-studios button[aria-pressed="false"]'); await p.waitForTimeout(400);
      pruefe('Studio-Knopf wechselt das Studio im Mini-Fenster', await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf .gm-fenster')].pop().querySelector('.gm-ort').textContent !== 'Hürth'));
      // Einklappen und wieder auf
      await p.click('#jarvisVerlauf [data-gmzu]'); await p.waitForTimeout(200);
      pruefe('Einklappen lässt eine Zeile „wieder aufklappen" stehen', !(await p.$('#jarvisVerlauf .gm-fenster')) && !!(await p.$('#jarvisVerlauf [data-gmauf]')));
      await p.click('#jarvisVerlauf [data-gmauf]'); await p.waitForTimeout(200);
      pruefe('… und wieder auf', !!(await p.$('#jarvisVerlauf .gm-fenster')));
      // Aufgaben, Material, Geräte
      for (const [satz, titel, muster] of [['zeig mir die aufgaben', 'Aufgaben', /Geräte desinfizieren[\s\S]*überfällig/], ['öffne material', 'Material', /fehlen|Bestand passt/], ['öffne die geräte', 'Geräte', /Geräten in Ordnung/]]) {
        await p.fill('#jarvisFeld', satz); await p.click('#jarvisSenden'); await p.waitForTimeout(900);
        const f = await p.evaluate(() => { const x = [...document.querySelectorAll('#jarvisVerlauf .gm-fenster')].pop(); return x ? { t: x.querySelector('b').textContent, i: x.innerText } : null; });
        pruefe('„' + satz + '": Mini-Fenster ' + titel, f && f.t === titel && muster.test(f.i), JSON.stringify(f).slice(0, 240));
      }
    }
    // Gespräche: gespeichert, nach Neuladen wieder da
    const gespeichert = await p.evaluate(() => { const k = Object.keys(localStorage).filter(x => /^kf_gehirn_gespr_/.test(x)); return k.length ? JSON.parse(localStorage.getItem(k[0])) : null; });
    pruefe(w + ' px: das Gespräch steht auf dem Gerät (je Konto), als Abschrift', gespeichert && gespeichert.length === 1 && gespeichert[0].e[0].t === 'öffne den putzplan' && /Putzplan/.test(gespeichert[0].e[0].a), JSON.stringify(gespeichert).slice(0, 200));
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 }); await p.waitForTimeout(600);
    await p.keyboard.press('j'); await p.waitForTimeout(500);
    pruefe(w + ' px: nach dem Neuladen steht das Gespräch wieder da (still, ohne Einblenden)', await p.evaluate(() => {
      const k = document.querySelector('#jarvisVerlauf .gehirn-antwort.ga-alt'); return !!k && getComputedStyle(k).animationName === 'none'; }));
    await p.click('#jarvisGespraecheBtn'); await p.waitForTimeout(300);
    const liste = await p.evaluate(() => [...document.querySelectorAll('#jarvisGespraeche [data-jvgespr]')].map(x => x.innerText));
    pruefe(w + ' px: „Gespeicherte Gespräche" listet es mit Datum', liste.length === 1 && /öffne den putzplan/.test(liste[0]), JSON.stringify(liste));
    await p.click('#jarvisGespraeche [data-jvneu]'); await p.waitForTimeout(300);
    pruefe(w + ' px: „Neues Gespräch" leert den Verlauf, das alte bleibt gespeichert', !!(await p.$('#jarvisVerlauf .jv-leer')) &&
      await p.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).filter(x => /^kf_gehirn_gespr_/.test(x))[0])).length === 1));
    await p.click('#jarvisGespraecheBtn'); await p.waitForTimeout(200);
    await p.click('#jarvisGespraeche [data-jvweg]'); await p.click('#jarvisGespraeche [data-jvweg]'); await p.waitForTimeout(200);
    pruefe(w + ' px: „Alle löschen" (mit zweitem Tipp) löscht die Abschriften', await p.evaluate(() => !Object.keys(localStorage).some(x => /^kf_gehirn_gespr_/.test(x))));
    pruefe(w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }
  {
    // Putzplan komplett: Spruch, Klang „komplett"
    const p = await oeffne(b, 1440, 900);
    await p.keyboard.press('j'); await p.waitForTimeout(400);
    await p.fill('#jarvisFeld', 'öffne den putzplan'); await p.click('#jarvisSenden'); await p.waitForTimeout(900);
    for (let n = 0; n < 6; n++) { const b2 = await p.$('#jarvisVerlauf .gm-haken[aria-pressed="false"]'); if (!b2) break; await b2.click(); await p.waitForTimeout(150); }
    const sp = await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf .ga-spruch')].pop().textContent);
    pruefe('Putzplan komplett: der Spruch feiert es', /komplett|erledigt|durch|fertig/i.test(sp) && /Putzplan/.test(sp), sp);
    await zu(p);
  }

  console.log('\n── 12d Briefing, Kacheln, mehrere Aufträge, Rückfrage, Quellen (20.10.2026) ──');
  {
    const p = await oeffne(b, 1440, 900, { vorher: () => { window.__gesprochen = []; } });
    await p.evaluate(() => { if (window.speechSynthesis) window.speechSynthesis.speak = (u) => { window.__gesprochen.push(u.text); }; });
    await p.keyboard.press('j'); await p.waitForTimeout(2800);
    const brief = await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf .jv-brief li')].map(l => l.textContent));
    pruefe('Morgen-Briefing im leeren Gespräch: Aufgaben mit überfällig, Putzplan, Material', brief.some(t => /Aufgaben offen, \d+ überfällig/.test(t)) && brief.some(t => /^Putzplan: \d+ offen/.test(t)) && brief.some(t => /Material/.test(t)), JSON.stringify(brief));
    const gesagt = await p.evaluate(() => window.__gesprochen);
    pruefe('… einmal am Tag vorgelesen, mit Gruss und Namen', gesagt.length === 1 && /(Guten|Hallo)/.test(gesagt[0]) && /Test/.test(gesagt[0]) && /Aufgaben offen/.test(gesagt[0]), JSON.stringify(gesagt));
    await p.click('#jarvisZu'); await p.keyboard.press('j'); await p.waitForTimeout(2000);
    pruefe('… beim zweiten Öffnen am selben Tag nicht noch einmal', (await p.evaluate(() => window.__gesprochen.length)) === 1);
    const kacheln = await p.evaluate(() => [...document.querySelectorAll('#jarvisKacheln .jv-kl')].map(k => k.getAttribute('data-jvmini') + ':' + k.querySelector('b').textContent));
    pruefe('„Heute im Studio": fünf Kacheln mit Zahlen', kacheln.length === 5 && /^todos:\d+$/.test(kacheln[0]), JSON.stringify(kacheln));
    await p.evaluate(() => { window.__kiGefragt = 0; window.__antwort = window.__antwort || {}; window.__antwort.gehirnAktion = (d) => { window.__kiGefragt++; window.__kiDaten = d; return Promise.resolve({ data: { art: 'frage', antwort: 'KI', abgedeckt: true } }); }; });
    await p.click('#jarvisKacheln [data-jvmini="putzplan"]'); await p.waitForTimeout(700);
    pruefe('Kachel „Putzplan" holt das Mini-Fenster, ohne KI', (await p.evaluate(() => { const f = [...document.querySelectorAll('#jarvisVerlauf .gm-fenster b')].pop(); return f && f.textContent; })) === 'Putzplan' && (await p.evaluate(() => window.__kiGefragt)) === 0);
    // mehrere Aufträge im Schnellweg
    const v0 = await p.evaluate(() => (window.__schreib || []).length);
    await p.fill('#jarvisFeld', 'spiegel ist sauber und klo ist sauber'); await p.click('#jarvisSenden'); await p.waitForTimeout(1200);
    const w = await p.evaluate((n) => (window.__schreib || []).slice(n).map(x => x.pfad), v0);
    const karten = await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf .gehirn-frage')].slice(-2).map(x => x.textContent));
    pruefe('„spiegel ist sauber und klo ist sauber": zwei Aufträge, zwei Karten, ohne KI', w.length === 2 && w.some(x => /cleaning\/c2/.test(x)) && w.some(x => /cleaning\/c3/.test(x)) && /und klo ist sauber/.test(karten[1]) && (await p.evaluate(() => window.__kiGefragt)) === 0, JSON.stringify({ w, karten }));
    pruefe('Rückgängig im Gespräch läuft als Countdown', (await p.evaluate(() => getComputedStyle([...document.querySelectorAll('#jarvisVerlauf .ga-rueck-zeit')].pop(), '::after').animationName)) === 'gmCountdown');
    // mehrere Aufträge über die KI
    await p.evaluate(() => { window.__antwort.gehirnAktion = (d) => { window.__kiDaten = d; return Promise.resolve({ data: { vorschlag: { typ: 'abhaken', bereich: 'putzplan', was: 'Vorhänge', studioKey: 'studio-6', studioName: 'Hürth' },
      weitere: [{ typ: 'navigation', ziel: 'material', zielName: 'Material', studioKey: 'studio-6', studioName: 'Hürth' }] } }); }; });
    await p.fill('#jarvisFeld', 'kümmere dich um die vorhänge, danach bitte den bestand'); await p.click('#jarvisSenden'); await p.waitForTimeout(1500);
    const zwei = await p.evaluate(() => ({ titel: [...document.querySelectorAll('#jarvisVerlauf .gm-fenster b')].pop().textContent, ab: /Abgehakt: Vorhänge waschen/.test(document.getElementById('jarvisVerlauf').innerText), ton: window.__kiDaten && window.__kiDaten.ton }));
    pruefe('KI mit zwei Aufträgen: erst abgehakt, dann Mini-Fenster Material; Ton „locker" mitgeschickt', zwei.ab && zwei.titel === 'Material' && zwei.ton === 'locker' && /\(1 von 2\)/.test(await p.evaluate(() => document.getElementById('jarvisVerlauf').innerText)), JSON.stringify(zwei));
    // Rückfrage
    await p.evaluate(() => { window.__antwort.gehirnAktion = () => Promise.resolve({ data: { vorschlag: { typ: 'rueckfrage', frage: 'Meinst du den Putzplan oder die Aufgaben?', optionen: ['Öffne den Putzplan', 'Öffne die Aufgaben'] } } }); });
    await p.fill('#jarvisFeld', 'kannst du da mal was machen'); await p.click('#jarvisSenden'); await p.waitForTimeout(900);
    const rf = await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf [data-grf]')].map(x => x.textContent));
    pruefe('Rückfrage: zwei Möglichkeiten zum Antippen', rf.join('|') === 'Öffne den Putzplan|Öffne die Aufgaben', JSON.stringify(rf));
    await p.click('#jarvisVerlauf [data-grf="Öffne die Aufgaben"]'); await p.waitForTimeout(900);
    pruefe('… ein Tipp schickt sie ab: Mini-Fenster Aufgaben', (await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf .gm-fenster b')].pop().textContent)) === 'Aufgaben');
    // Quellen und Gelernt
    await p.evaluate(() => { window.__antwort.gehirnAktion = () => Promise.resolve({ data: { art: 'frage', antwort: 'Die Studioleitung hat die Schlüssel.', abgedeckt: true,
      quellen: [{ thema: 'Wer hat Schlüssel?', auszug: 'Die Studioleitung.', gelernt: true }] } }); });
    await p.fill('#jarvisFeld', 'wer hat die schlüssel'); await p.click('#jarvisSenden'); await p.waitForTimeout(1600);
    const q = await p.evaluate(() => { const k = [...document.querySelectorAll('#jarvisVerlauf .gehirn-antwort')].pop(); const d = k.querySelector('details.ga-quellen');
      return { gelernt: !!k.querySelector('.hilfe-marke.gelernt'), zu: d && !d.open, summary: d && d.querySelector('summary').textContent }; });
    await p.click('#jarvisVerlauf details.ga-quellen summary'); await p.waitForTimeout(200);
    const qo = await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf details.ga-quellen')].pop().innerText);
    pruefe('Quellen: „Woher weiß ich das?" klappt Thema und Auszug auf; „Gelernt!" steht dabei', q.gelernt && q.zu && q.summary === 'Woher weiß ich das?' && /Wer hat Schlüssel\?/.test(qo) && /Die Studioleitung\./.test(qo), JSON.stringify(q) + ' ' + qo);
    // Ton „sachlich" aus der Persönlichkeit
    await p.evaluate(() => { localStorage.setItem('kf_jv_persona', JSON.stringify({ ton: 'sachlich' })); window.__antwort.gehirnAktion = (d) => { window.__kiDaten = d; return Promise.resolve({ data: { art: 'frage', antwort: 'Ok.', abgedeckt: true } }); }; });
    await p.fill('#jarvisFeld', 'noch eine frage'); await p.click('#jarvisSenden'); await p.waitForTimeout(900);
    pruefe('Ton „sachlich" geht mit, wenn so eingestellt', (await p.evaluate(() => window.__kiDaten.ton)) === 'sachlich');
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 12e Stimme, Zuhören, Weckwort, Persönlichkeit (20.10.2026) ──');
  /* Aus dem Betrieb (20.10.2026): „lebendig wirkt von der stimme und wie
     ein echter mensch als assistent" — und auf die Ideenliste „mach alles
     davon" (gedrückt halten, echte Wellenform, Weckwort, Persönlichkeit). */
  const SR_ATTRAPPE = () => {
    window.__srs = [];
    window.SpeechRecognition = function () { window.__srs.push(this); };
    window.SpeechRecognition.prototype.start = function () { this.gestartet = true; };
    window.SpeechRecognition.prototype.stop = function () { if (this.beendet) return; this.beendet = true; const s = this; setTimeout(() => s.onend && s.onend(), 0); };
    window.__sag = (r, text, fertig) => { const e = [{ transcript: text }]; e.isFinal = !!fertig; r.onresult({ resultIndex: 0, results: [e] }); };
  };
  {
    const p = await oeffne(b, 1440, 900, { vorher: SR_ATTRAPPE });
    await p.evaluate(() => { window.__gesprochen = []; if (window.speechSynthesis) window.speechSynthesis.speak = (u) => { window.__gesprochen.push(u.text); };
      window.__audio = []; const A = window.Audio; window.Audio = function (src) { const a = new A(); window.__audio.push(src); a.play = () => Promise.resolve(); return a; };
      window.__stimme = []; window.__antwort = window.__antwort || {};
      window.__antwort.gehirnStimme = (d) => { window.__stimme.push(d); return Promise.resolve({ data: { audio: 'SUQz', mime: 'audio/mpeg' } }); };
      localStorage.setItem('kf_jv_brief', new Date().toLocaleDateString('sv-SE')); });
    await p.keyboard.press('j'); await p.waitForTimeout(600);
    pruefe('Kern ist ein Knopf zum Gedrückthalten (mit Spracherkennung)', await sichtbar(p, '#jarvisHalten'));
    // Persönlichkeit
    await p.click('#jarvisPersonaBtn'); await p.waitForTimeout(200);
    await p.fill('#jvPName', 'Friday'); await p.click('#jarvisPersona [data-jvw="sachlich"]'); await p.waitForTimeout(150);
    await p.selectOption('#jvPProfi', 'de-DE-Chirp3-HD-Charon'); await p.click('#jvPProbe'); await p.waitForTimeout(300);
    const pers = await p.evaluate(() => ({ p: JSON.parse(localStorage.getItem('kf_jv_persona')), titel: document.getElementById('jarvisTitel').textContent, stimme: window.__stimme.slice(-1)[0], audio: window.__audio.slice(-1)[0] }));
    pruefe('Persönlichkeit: Name, Tonfall und Stimme gemerkt, Titel heisst jetzt „Friday"', pers.p.name === 'Friday' && pers.p.ton === 'sachlich' && pers.p.profiStimme === 'de-DE-Chirp3-HD-Charon' && pers.titel === 'Friday', JSON.stringify(pers));
    pruefe('Probehören: menschliche Stimme mit der gewählten Stimme, abgespielt als MP3', pers.stimme && pers.stimme.stimme === 'de-DE-Chirp3-HD-Charon' && /Friday/.test(pers.stimme.text) && pers.audio === 'data:audio/mpeg;base64,SUQz', JSON.stringify(pers));
    await p.click('#jvPZu'); await p.waitForTimeout(150);
    // Gedrückt halten: hören, Untertitel, loslassen → abgeschickt
    const box = await p.evaluate(() => { const r = document.getElementById('jarvisHalten').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await p.mouse.move(box.x, box.y); await p.mouse.down(); await p.waitForTimeout(150);
    const hoert = await p.evaluate(() => ({ n: window.__srs.length, an: document.getElementById('jarvis').classList.contains('jv-z-hoert') }));
    await p.evaluate(() => window.__sag(window.__srs[window.__srs.length - 1], 'öffne die aufgaben', false));
    const ut = await p.evaluate(() => document.getElementById('jarvisUntertitel').textContent);
    await p.waitForTimeout(500); await p.mouse.up(); await p.waitForTimeout(900);
    const nach = await p.evaluate(() => ({ titel: (() => { const f = [...document.querySelectorAll('#jarvisVerlauf .gm-fenster b')].pop(); return f && f.textContent; })(), beendet: window.__srs[window.__srs.length - 1].beendet }));
    pruefe('Gedrückt halten: hört zu (Zustand „hört"), Live-Untertitel, Loslassen schickt ab → Mini-Fenster Aufgaben', hoert.n === 1 && hoert.an && ut === 'öffne die aufgaben' && nach.beendet && nach.titel === 'Aufgaben', JSON.stringify({ hoert, ut, nach }));
    // Leertaste im leeren Feld
    await p.click('#jarvisFeld'); await p.keyboard.down(' '); await p.waitForTimeout(150);
    const lt = await p.evaluate(() => ({ n: window.__srs.length, feld: document.getElementById('jarvisFeld').value }));
    await p.keyboard.up(' '); await p.waitForTimeout(200);
    pruefe('Leertaste im leeren Feld: halten und sprechen (kein Leerzeichen im Feld)', lt.n === 2 && lt.feld === '' && (await p.evaluate(() => window.__srs[1].beendet)), JSON.stringify(lt));
    // Antwort mit menschlicher Stimme
    await p.evaluate(() => { window.__antwort.gehirnAktion = () => Promise.resolve({ data: { art: 'frage', antwort: 'Westen im Schonprogramm.\n\n⚠️ Noch nicht geprüft.', abgedeckt: true } }); window.__audio = []; window.__stimme = []; });
    await p.fill('#jarvisFeld', 'wie wasche ich westen'); await p.click('#jarvisSenden'); await p.waitForTimeout(1200);
    const st = await p.evaluate(() => ({ s: window.__stimme, a: window.__audio, g: window.__gesprochen.length }));
    pruefe('Antwort wird mit menschlicher Stimme vorgelesen (ohne Warnzeile), nicht mit der Gerätestimme', st.s.length === 1 && st.s[0].text === 'Westen im Schonprogramm.' && st.a.length === 1 && st.g === 0, JSON.stringify(st));
    // Keine menschliche Stimme eingerichtet → Gerät, und nicht jedes Mal neu fragen
    await p.evaluate(() => { window.__antwort.gehirnStimme = (d) => { window.__stimme.push(d); return Promise.resolve({ data: { aus: true, grund: 'keine Stimme eingerichtet' } }); }; window.__stimme = []; });
    await p.fill('#jarvisFeld', 'noch eine frage'); await p.click('#jarvisSenden'); await p.waitForTimeout(1000);
    await p.fill('#jarvisFeld', 'und noch eine'); await p.click('#jarvisSenden'); await p.waitForTimeout(1000);
    const ers = await p.evaluate(() => ({ s: window.__stimme.length, g: window.__gesprochen.length }));
    pruefe('Ohne eingerichtete Stimme: Gerätestimme, und nur einmal nachgefragt', ers.s === 1 && ers.g === 2, JSON.stringify(ers));
    // Weckwort
    await p.click('#jarvisPersonaBtn'); await p.click('#jvPWeck'); await p.click('#jvPZu'); await p.waitForTimeout(300);
    const weck = await p.evaluate(() => { const r = window.__srs.filter(x => x.continuous && !x.beendet).pop(); return { da: !!r, zeichen: !document.getElementById('jarvisWeck').hidden, text: document.getElementById('jarvisWeck').textContent }; });
    pruefe('Weckwort an: hört dauerhaft, Hinweis „hört auf „Hey Friday"" oben', weck.da && weck.zeichen && /Hey Friday/.test(weck.text), JSON.stringify(weck));
    await p.evaluate(() => { const r = window.__srs.filter(x => x.continuous && !x.beendet).pop(); window.__sag(r, 'Hey Friday öffne den Putzplan', true); });
    await p.waitForTimeout(900);
    pruefe('„Hey Friday öffne den Putzplan" → Mini-Fenster Putzplan', (await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf .gm-fenster b')].pop().textContent)) === 'Putzplan');
    await p.click('#jarvisZu'); await p.waitForTimeout(200);
    pruefe('Fenster zu: das Mikrofon hört nicht mehr', await p.evaluate(() => window.__srs.filter(x => x.continuous).every(x => x.beendet)));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 12f Erinnerung, Tagesabschluss, Schicht abgeben, Suche, Foto, offline (20.10.2026) ──');
  {
    /* Mein Studio gesetzt — ohne fragt Formi seit 20.10.2026 nach (12h). */
    const p = await oeffne(b, 1440, 900, { vorher: () => { localStorage.setItem('kf_jv_brief', new Date().toLocaleDateString('sv-SE')); localStorage.setItem('kf_jv_persona', JSON.stringify({ studio: 'studio-6' })); } });
    await p.keyboard.press('j'); await p.waitForTimeout(500);
    await p.evaluate(() => { window.__ki = 0; window.__antwort = window.__antwort || {}; window.__antwort.gehirnAktion = () => { window.__ki++; return Promise.resolve({ data: { art: 'frage', antwort: 'KI', abgedeckt: true } }); };
      window.__erin = []; window.__antwort.gehirnErinnerung = (d) => { window.__erin.push(d); return Promise.resolve({ data: d.art === 'neu' ? { id: 'e1', wann: d.wann } : { ok: true } }); }; });
    const sag = async (satz, ms) => { await p.fill('#jarvisFeld', satz); await p.click('#jarvisSenden'); await p.waitForTimeout(ms || 900); };
    const letzte = () => p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf .gehirn-antwort')].pop().innerText);
    // Erinnerung
    const vor = Date.now();
    await sag('erinner mich in 20 minuten an die Wäsche');
    const k1 = await letzte();
    pruefe('„erinner mich in 20 minuten an die Wäsche": Vorschau mit Zeit und Text, ohne KI', /Erinnerung/.test(k1) && /die Wäsche/.test(k1) && /heute, \d\d:\d\d Uhr/.test(k1) && (await p.evaluate(() => window.__ki)) === 0, k1);
    await p.click('#jarvisVerlauf [data-gerinnern]'); await p.waitForTimeout(300);
    const e1 = await p.evaluate(() => window.__erin[0]);
    pruefe('… „Erinnern" legt sie an: Text und Zeitpunkt (≈ in 20 min)', e1 && e1.art === 'neu' && e1.text === 'die Wäsche' && Math.abs(e1.wann - (vor + 20 * 60000)) < 15000 && /Ich erinnere dich/.test(await letzte()), JSON.stringify(e1));
    await p.click('#jarvisVerlauf [data-gerinweg]'); await p.waitForTimeout(300);
    pruefe('… und „Erinnerung löschen" nimmt sie zurück', (await p.evaluate(() => JSON.stringify(window.__erin[1]))) === JSON.stringify({ art: 'weg', id: 'e1' }));
    await sag('erinnere mich morgen um 9 daran die Handtücher aufzuhängen');
    const k2 = await letzte();
    pruefe('„… morgen um 9 daran die Handtücher aufzuhängen": morgen, 09:00 Uhr', /morgen, 09:00 Uhr/.test(k2) && /die Handtücher aufzuhängen/.test(k2), k2);
    // Suche
    await sag('such nach Handtücher');
    const su = await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf [data-gsuche]')].map(x => x.innerText.replace(/\s+/g, ' ')));
    pruefe('„such nach Handtücher": Treffer aus der App, ohne KI', su.some(t => /Aufgabe/i.test(t) && /Handtücher waschen/.test(t)) && (await p.evaluate(() => window.__ki)) === 0, JSON.stringify(su));
    // Schicht abgeben
    const v0 = await p.evaluate(() => (window.__schreib || []).length);
    await sag('kann heute jemand für mich übernehmen', 1200);
    const ts = await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf [data-gtausch]')].map(x => x.innerText.replace(/\s+/g, ' ')));
    pruefe('„kann heute jemand für mich übernehmen": deine Schichten von heute zum Ausschreiben', ts.length === 2 && ts.some(t => /09:00–14:00/.test(t)), JSON.stringify(ts));
    await p.click('#jarvisVerlauf [data-gtausch]'); await p.waitForTimeout(300);
    const w = await p.evaluate((n) => (window.__schreib || []).slice(n), v0);
    pruefe('… „Ausschreiben" setzt den Tausch wie im Team-Bereich (tausch offen, von mir)', w.length === 1 && /shifts\/s\d/.test(w[0].pfad) && w[0].daten.tausch === 'offen' && w[0].daten.tauschVon === 'testuid', JSON.stringify(w));
    // Tagesabschluss
    await p.evaluate(() => { window.__antwort.gehirnUmformen = (d) => Promise.resolve({ data: { text: '• Handtücher in der Maschine\n• Gerät 2 zickt' } }); });
    await sag('feierabend');
    const s1 = await letzte();
    pruefe('„feierabend": Tagesabschluss, Schritt 1 von 3 mit Mini-Putzplan', /Schritt 1 von 3/.test(s1) && /Putzplan/.test(s1) && !!(await p.$('#jarvisVerlauf .gx-karte .gm-fenster')), s1.slice(0, 200));
    await p.click('#jarvisVerlauf [data-gabschl$="|weiter"]'); await p.waitForTimeout(400);
    pruefe('… „Weiter": Schritt 2, Aufgaben', /Schritt 2 von 3/.test(await letzte()) && (await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf .gm-fenster b')].pop().textContent)) === 'Aufgaben');
    await p.click('#jarvisVerlauf [data-gabschl$="|weiter"]'); await p.waitForTimeout(300);
    await p.fill('#jarvisVerlauf [data-gabtext]', 'handtücher sind in der maschine und gerät 2 zickt'); await p.click('#jarvisVerlauf [data-gabschl$="|stich"]'); await p.waitForTimeout(300);
    pruefe('… Schritt 3: Übergabe, „In Stichpunkte fassen" setzt den Text', (await p.inputValue('#jarvisVerlauf [data-gabtext]')) === '• Handtücher in der Maschine\n• Gerät 2 zickt');
    const v1 = await p.evaluate(() => (window.__schreib || []).length);
    await p.click('#jarvisVerlauf [data-gabschl$="|speichern"]'); await p.waitForTimeout(400);
    const ho = await p.evaluate((n) => (window.__schreib || []).slice(n), v1);
    const ende = await letzte();
    pruefe('… „Übergabe speichern · Feierabend": Übergabe wie im Team-Bereich, dann Feierabend', ho.length === 1 && /handovers/.test(ho[0].pfad) && /Gerät 2 zickt/.test(ho[0].daten.text) && ho[0].daten.uid === 'testuid' && /erledigt/.test(ende), JSON.stringify(ho).slice(0, 200) + ' ' + ende.slice(0, 120));
    // Foto
    await p.evaluate(() => { window.__foto = []; window.__antwort.gehirnFoto = (d) => { window.__foto.push(d); return Promise.resolve({ data: { geraet: 'EMS-Gerät 2', text: 'Kabel am Stecker gebrochen.' } }); }; });
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8DwnwEIGBmQAQBQ6QH/q9b0jgAAAABJRU5ErkJggg==', 'base64');
    await p.setInputFiles('#jarvisFotoDatei', { name: 'geraet.png', mimeType: 'image/png', buffer: png }); await p.waitForTimeout(1200);
    const fo = await p.evaluate(() => ({ f: window.__foto[0] && { jpeg: /^data:image\/jpeg;base64,/.test(window.__foto[0].bild), geraete: window.__foto[0].geraete.length }, t: document.getElementById('jarvisVerlauf').innerText }));
    pruefe('Foto: verkleinert als JPEG an gehirnFoto, mit Geräteliste; „Erkannt: EMS-Gerät 2" → Defekt-Weg', fo.f && fo.f.jpeg && /Erkannt: EMS-Gerät 2/.test(fo.t) && /Suche Gerät/.test(fo.t), JSON.stringify(fo.f) + ' ' + fo.t.slice(-300));
    // ohne Netz
    await p.context().setOffline(true); await p.waitForTimeout(200);
    pruefe('ohne Netz: Hinweis oben im Fenster', await sichtbar(p, '#jarvisOffline'));
    await sag('was mache ich bei einem attest');
    pruefe('ohne Netz: die KI wird nicht gefragt, freundlicher Hinweis', /Ohne Netz kann ich gerade nur Schnellbefehle/.test(await letzte()) && (await p.evaluate(() => window.__ki)) === 0);
    await sag('vorhänge sind gewaschen');
    pruefe('ohne Netz: Schnellbefehl geht trotzdem, „wird nachgetragen"', /wird nachgetragen/.test(await p.evaluate(() => document.getElementById('jarvisVerlauf').innerText.slice(-400))), await p.evaluate(() => document.getElementById('jarvisVerlauf').innerText.slice(-400)));
    await p.context().setOffline(false);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 12b HUD, Ton, Daumen (20.10.2026) ──');
  /* Aus dem Betrieb (20.10.2026): „richtig abgespacet … wie in einer
     jarvis umgebung … viel motion", „jarvis soll ton haben auch" und
     „muss ich jetzt hoffen das ich und das team 500 verschiedene fragen
     stellt". */
  {
    const p = await oeffne(b, 1440, 900);
    await p.click(await jvKnopf(p)); await p.waitForTimeout(400);
    const leer = await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf [data-jvbefehl]')].map(x => x.textContent));
    pruefe('leeres Fenster: Begrüssung und vier Vorschläge zum Antippen', leer.length === 4 && /Guten|Hallo/.test(await p.textContent('#jarvisVerlauf')), JSON.stringify(leer));
    const boot = await p.evaluate(() => document.getElementById('jarvis').classList.contains('jv-boot'));
    pruefe('beim Öffnen fährt das HUD hoch (jv-boot)', boot);
    await p.waitForTimeout(2400);
    pruefe('… und das Hochfahren endet wieder', !(await p.evaluate(() => document.getElementById('jarvis').classList.contains('jv-boot'))));
    const feld = await p.evaluate(() => { const c = document.getElementById('jarvisFeldchen'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return { n, w: c.width }; });
    pruefe('Partikelfeld zeichnet, solange das Fenster offen ist (in reduzierter Auflösung)', feld.n > 50 && feld.w > 400 && feld.w < 1440, JSON.stringify(feld));
    const uhr = await p.textContent('#jarvisUhr');
    pruefe('Uhr läuft (HH:MM:SS)', /^\d\d:\d\d:\d\d$/.test(uhr), uhr);
    // Ton: Knopf schaltet, wird gemerkt
    pruefe('Ton ist zu Beginn an', await p.getAttribute('#jarvisTon', 'aria-pressed') === 'true');
    await p.click('#jarvisTon');
    pruefe('ein Tipp schaltet Ton und Stimme aus (gemerkt)', await p.getAttribute('#jarvisTon', 'aria-pressed') === 'false' &&
      await p.evaluate(() => localStorage.getItem('kf_jv_ton')) === '0');
    await p.click('#jarvisTon');
    pruefe('… und wieder an', await p.getAttribute('#jarvisTon', 'aria-pressed') === 'true');
    // Vorschlag antippen, Zustand „denkt", Klänge, Vorlesen
    await p.evaluate(() => {
      window.__klaenge = 0;
      const o = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function () { window.__klaenge++; return o.call(this); };
      window.__gesprochen = [];
      if (window.speechSynthesis) window.speechSynthesis.speak = (u) => { window.__gesprochen.push(u.text); };
      window.__antwort = window.__antwort || {};
      window.__antwort.gehirnAktion = () => new Promise(r => setTimeout(() => r({ data: { art: 'frage', antwort: 'Die Westen im Schonprogramm waschen.\n\n⚠️ Noch nicht geprüft.', abgedeckt: true, nachricht: 41 } }), 700));
      window.__bewertet = [];
      window.__antwort.gehirnBewerten = (d) => { window.__bewertet.push(d); return Promise.resolve({ data: { ok: true } }); };
    });
    await p.click('#jarvisVerlauf [data-jvbefehl="Wie wasche ich die Westen?"]');
    await p.waitForTimeout(200);
    /* Aus dem Betrieb (20.10.2026): „mehr animationen für den chat und so
       hologramme dinger". */
    const holo = await p.evaluate(() => {
      const f = document.querySelector('#jarvisVerlauf .gehirn-frage'), k = document.querySelector('#jarvisVerlauf .gehirn-antwort');
      return { frage: getComputedStyle(f).animationName, funk: getComputedStyle(f, '::after').animationName,
        laeuft: k.classList.contains('ga-laeuft') && getComputedStyle(k, '::after').animationName,
        ecken: (getComputedStyle(k).backgroundImage.match(/linear-gradient/g) || []).length };
    });
    pruefe('Hologramm: Frage wird gesendet (mit Funkstrahl), Karte tastet beim Denken ab, Eckwinkel', holo.frage === 'jvSenden' && holo.funk === 'jvFunk' && holo.laeuft === 'jvKarteScan' && holo.ecken >= 4, JSON.stringify(holo));
    pruefe('Antippen schickt ab, das HUD „denkt" (Wellen, Equalizer)', await p.evaluate(() => document.getElementById('jarvis').classList.contains('jv-z-denkt') &&
      getComputedStyle(document.querySelector('#jarvisKern s')).animationName === 'jvWelle'));
    await p.waitForFunction(() => !document.querySelector('#jarvisVerlauf .gehirn-denkt'), null, { timeout: 5000 });
    const tippt = await p.evaluate(() => { const g = document.querySelector('#jarvisVerlauf .ga-text'); return { an: g.classList.contains('tippt'), cursor: getComputedStyle(g, '::after').animationName, karte: getComputedStyle(document.querySelector('#jarvisVerlauf .gehirn-antwort')).animationName }; });
    pruefe('Antwort projiziert sich (jvHolo) und schreibt mit leuchtendem Cursor', tippt.an && tippt.cursor === 'jvBlinken' && tippt.karte === 'jvHolo', JSON.stringify(tippt));
    await p.waitForTimeout(1500);
    pruefe('… der Cursor verschwindet, wenn alles dasteht', await p.evaluate(() => !document.querySelector('#jarvisVerlauf .ga-text.tippt')));
    pruefe('nach der Antwort denkt es nicht mehr', !(await p.evaluate(() => document.getElementById('jarvis').classList.contains('jv-z-denkt'))));
    const ton = await p.evaluate(() => ({ k: window.__klaenge, g: window.__gesprochen }));
    pruefe('Klänge beim Senden und Fertig; die Antwort wird vorgelesen — ohne Warnzeile', ton.k >= 2 && ton.g.length === 1 && /Schonprogramm/.test(ton.g[0]) && !/geprüft/.test(ton.g[0]), JSON.stringify(ton));
    // Daumen
    const d = await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf [data-gdaumen]')].map(x => x.textContent.trim()));
    pruefe('unter der Antwort: „Passt" und „Stimmt nicht"', d.join('|') === 'Passt|Stimmt nicht', JSON.stringify(d));
    await p.click('#jarvisVerlauf .ga-hoch'); await p.waitForTimeout(300);
    const bw = await p.evaluate(() => ({ b: window.__bewertet, t: document.querySelector('#jarvisVerlauf .ga-daumen').textContent, s: document.querySelector('#gehirnVerlauf .ga-daumen') && document.querySelector('#gehirnVerlauf .ga-daumen').textContent }));
    pruefe('„Passt" ruft gehirnBewerten mit Nummer und +1, dann ein Danke (auch unter Ich → Gehirn)', bw.b.length === 1 && bw.b[0].nachricht === 41 && bw.b[0].wert === 1 && /Training/.test(bw.t) && /Training/.test(bw.s || ''), JSON.stringify(bw));
    // Einblenden nur einmal: nach einer zweiten Frage steht die erste still
    await p.evaluate(() => { window.__antwort.gehirnAktion = () => Promise.resolve({ data: { art: 'frage', antwort: 'Zweite.', abgedeckt: true } }); });
    await p.fill('#jarvisFeld', 'Noch eine Frage'); await p.click('#jarvisSenden');
    await p.waitForTimeout(80);
    const still = await p.evaluate(() => { const k = document.querySelectorAll('#jarvisVerlauf .gehirn-antwort'); return { erste: getComputedStyle(k[0]).animationName, zweite: getComputedStyle(k[1]).animationName }; });
    pruefe('Einblenden genau einmal: die alte Karte steht still, die neue kommt herein', still.erste === 'none' && still.zweite === 'jvHolo', JSON.stringify(still));
    await p.waitForFunction(() => !document.querySelector('#jarvisVerlauf .gehirn-denkt'), null, { timeout: 5000 });
    pruefe('ohne nachricht-Nummer kein Daumen', await p.evaluate(() => document.querySelectorAll('#jarvisVerlauf .ga-daumen').length === 1));
    // Schliessen hält das Feld an
    await p.click('#jarvisZu'); await p.waitForTimeout(200);
    const nachZu = await p.evaluate(() => new Promise(r => { let n = 0; const c = document.getElementById('jarvisFeldchen'); const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); setTimeout(() => { const d = g.getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; r(n); }, 300); }));
    pruefe('nach dem Schliessen zeichnet das Feld nicht weiter', nachZu === 0, nachZu);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }
  /* Flüssig heisst: Arbeit je Bild unter 8,3 ms, mit 4-fach gedrosselter
     CPU — offen, und während es denkt (dann ziehen die Partikel zum
     Kern und laufen Wellen und Equalizer). Gemessen über die
     Hauptfaden-Zeit je gezeichnetem Bild, nicht angesehen. */
  for (const [w, h] of [[390, 844], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h);
    await p.click(await jvKnopf(p)); await p.waitForTimeout(2600);
    const cdp = await p.context().newCDPSession(p);
    await cdp.send('Performance.enable');
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const miss = async (dauer) => {
      const a = await cdp.send('Performance.getMetrics');
      const bilder = await p.evaluate((ms) => new Promise(r => { let n = 0; const ende = performance.now() + ms; (function f() { n++; if (performance.now() < ende) requestAnimationFrame(f); else r(n); })(); }), dauer);
      const z = await cdp.send('Performance.getMetrics');
      const wert = (m, k) => (m.metrics.find(x => x.name === k) || {}).value || 0;
      return { ms: Math.round((wert(z, 'TaskDuration') - wert(a, 'TaskDuration')) * 1000 / bilder * 10) / 10, bilder };
    };
    const ruhe = await miss(3000);
    await p.evaluate(() => { window.__antwort = window.__antwort || {}; window.__antwort.gehirnAktion = () => new Promise(r => setTimeout(() => r({ data: { art: 'frage', antwort: 'Ok.', abgedeckt: true } }), 6000)); });
    await p.fill('#jarvisFeld', 'Wie wasche ich die Westen?'); await p.click('#jarvisSenden');
    /* Erst einschwingen lassen: der Wechsel in „denkt" (Einblenden der
       Karte, Partikel auf die Bahn) ist einmalig, gemessen wird der
       Dauerzustand. */
    await p.waitForTimeout(1000);
    const denkt = await miss(3000);
    pruefe(w + ' px, CPU ÷4: Arbeit je Bild offen ' + ruhe.ms + ' ms, beim Denken ' + denkt.ms + ' ms (Grenze 8,3)', ruhe.ms < 8.3 && denkt.ms < 8.3, JSON.stringify({ ruhe, denkt }));
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await zu(p);
  }
  {
    const p = await oeffne(b, 390, 844, { wenigBewegung: true });
    await p.click(await jvKnopf(p)); await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const c = document.getElementById('jarvisFeldchen'); const d = c.getContext('2d').getImageData(0, 0, Math.max(1, c.width), Math.max(1, c.height)).data;
      let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++;
      const bewegt = [...document.querySelectorAll('#jarvis *')].filter(e => getComputedStyle(e).animationName !== 'none' && e.getClientRects().length).map(e => e.className.baseVal !== undefined ? e.className.baseVal : e.className);
      return { n, bewegt };
    });
    pruefe('„weniger Bewegung": kein Partikelfeld, nichts im HUD bewegt sich', r.n === 0 && r.bewegt.length === 0, JSON.stringify(r));
    await zu(p);
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

  console.log('\n── 12g Bezug auf vorherige Nachrichten (20.10.2026) ──');
  /* Aus dem Betrieb, 20.10.2026: „hier ist noch ein kontext problem
     ausserdem hab ich gemerkt das er nicht auf vorherige nachrichten
     eingehen kann". Bildschirmfoto: „ich habe in Hürth gesagt" wurde als
     Abhaken von „ich in Hürth gesagt" gelesen; „ich habe Briefkasten in
     Hürth erledigt" fand nichts, „Briefkasten erledigt in Hürth" schon. */
  {
    const p = await oeffne(b, 1440, 900, { vorher: () => { localStorage.setItem('kf_jv_brief', new Date().toLocaleDateString('sv-SE')); } });
    await p.keyboard.press('j'); await p.waitForTimeout(500);
    await p.evaluate(() => { window.__ki = []; window.__antwort = window.__antwort || {}; window.__antwort.gehirnAktion = (d) => { window.__ki.push(d); return Promise.resolve({ data: { art: 'frage', antwort: 'Etwa 20 Minuten.', abgedeckt: true } }); }; });
    const sag = async (satz, ms) => { await p.fill('#jarvisFeld', satz); await p.click('#jarvisSenden'); await p.waitForTimeout(ms || 900); };
    const letzte = () => p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf .gehirn-antwort')].pop().innerText);
    await sag('Wasserspender auffüllen ist erledigt in Rath');
    const k0 = await letzte();
    await sag('ich habe in Hürth gesagt');
    const k1 = await letzte();
    pruefe('„ich habe in Hürth gesagt" nimmt den letzten Satz und macht ihn in Hürth — ohne KI', /Bezieht sich auf/.test(k1) && /Wasserspender auffüllen ist erledigt in Hürth/.test(k1) && /Abgehakt/.test(k1) && (await p.evaluate(() => window.__ki.length)) === 0, k0.slice(0, 120) + ' || ' + k1.slice(0, 300));
    await sag('ich habe Geräte desinfizieren in Hürth erledigt');
    const k2 = await letzte();
    pruefe('„ich habe Geräte desinfizieren in Hürth erledigt": „ich" und das Studio stören die Suche nicht', /Abgehakt/.test(k2) && /Geräte desinfizieren/.test(k2) && !/ich Geräte/.test(k2), k2.slice(0, 300));
    await sag('und wie lange dauert das?');
    const d = await p.evaluate(() => window.__ki[window.__ki.length - 1]);
    pruefe('Was an die KI geht, trägt den Verlauf mit (die letzten Sätze und was herauskam, höchstens 4)', d && Array.isArray(d.verlauf) && d.verlauf.length >= 2 && d.verlauf.length <= 4 &&
      d.verlauf.some(x => /Geräte desinfizieren in Hürth/.test(x.f)) && d.verlauf.every(x => typeof x.a === 'string') && !d.verlauf.some(x => /wie lange dauert/.test(x.f)), JSON.stringify(d && d.verlauf));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 12h Mein Studio, Rückfrage, Lernen, Formi-Zeichen, Mail, Effekte, Buchstaben (20.10.2026) ──');
  /* Aus dem Betrieb, 20.10.2026, auf die Verbesserungsliste: „1,2,3,4,5
     (am besten so ganz viele random Buchstaben die sich ins Loch drehen
     und dann als Sätze rauskommen oder so) 6, 7 …, 8, 9 (nur Mail
     erstmal …)". */
  {
    const vorher = () => {
      localStorage.setItem('kf_jv_brief', new Date().toLocaleDateString('sv-SE'));
      const t = Date.now();
      window.__todos = { 'studio-6': [{ id: 'x1', title: 'Briefkasten leeren', desc: '', done: false, ts: t - 5000 }],
        'studio-7': [{ id: 'x2', title: 'Briefkasten leeren', desc: '', done: false, ts: t - 5000 }] };
    };
    const p = await oeffne(b, 1440, 900, { vorher });
    await p.keyboard.press('j'); await p.waitForTimeout(500);
    await p.evaluate(() => { window.__ki = []; window.__antwort = window.__antwort || {}; window.__antwort.gehirnAktion = (d) => { window.__ki.push(d); return Promise.resolve({ data: { art: 'frage', antwort: 'Ok.', abgedeckt: true } }); }; });
    const sag = async (satz, ms) => { await p.fill('#jarvisFeld', satz); await p.click('#jarvisSenden'); await p.waitForTimeout(ms || 900); };
    const letzte = () => p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf .gehirn-antwort')].pop().innerText);
    // 2: ohne Mein Studio fragt Formi nach, statt zu raten
    await sag('Übergabe: Handtücher sind in der Maschine');
    const rf = await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf [data-grf]')].map(x => x.textContent));
    pruefe('ohne „Mein Studio": „Übergabe: …" fragt nach dem Studio (ganze Sätze zum Antippen), ohne KI',
      rf.length >= 2 && rf.every(t => /^Übergabe: Handtücher sind in der Maschine in \S/.test(t)) && (await p.evaluate(() => window.__ki.length)) === 0, JSON.stringify(rf));
    // Formis Zeichen auf der Karte
    const kopf = await p.evaluate(() => { const k = [...document.querySelectorAll('#jarvisVerlauf .ga-kopf')].pop(); return k && { t: k.innerText.trim(), loch: !!k.querySelector('.ga-loch') }; });
    pruefe('Antwortkarte trägt Formis Namen und das kleine Loch (statt „Studio-Gehirn")', kopf && kopf.t.toLowerCase() === 'formi' && kopf.loch, JSON.stringify(kopf));
    // Punkt in zwei Studios: ohne Mein Studio zur Wahl
    await sag('Briefkasten leeren erledigt');
    const w1 = await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf [data-gwahl]')].length);
    pruefe('derselbe Punkt in zwei Studios, kein Mein Studio: beide zur Wahl', w1 === 2, w1);
    const zweitName = await p.evaluate(() => { const x = [...document.querySelectorAll('#jarvisVerlauf [data-gwahl] small')].map(s => s.textContent.trim()); return x.find(n => n !== 'Hürth') || ''; });
    // 3: Richtigstellung → gelernt
    await sag('ich meinte in ' + zweitName);
    const k3 = await letzte();
    pruefe('„ich meinte in ' + zweitName + '": dort abgehakt', /Abgehakt/.test(k3) && k3.indexOf(zweitName) >= 0, k3.slice(0, 200));
    await sag('Briefkasten leeren erledigt');
    const k4 = await letzte();
    pruefe('… beim nächsten Mal weiss Formi es: „Gemerkt" und sofort in ' + zweitName, /Gemerkt/.test(k4) && /Abgehakt/.test(k4) && k4.indexOf(zweitName) >= 0, k4.slice(0, 300));
    // 1: Mein Studio
    await p.click('#jarvisPersonaBtn'); await p.waitForTimeout(200);
    const studios = await p.evaluate(() => [...document.querySelectorAll('#jarvisPersona [data-jvp="studio"]')].map(x => x.getAttribute('data-jvw')));
    pruefe('„Persönlichkeit": Mein Studio zur Wahl (alle eigenen Studios)', studios.length >= 2 && studios.indexOf('studio-6') >= 0, JSON.stringify(studios));
    await p.click('#jarvisPersona [data-jvp="studio"][data-jvw="studio-6"]'); await p.waitForTimeout(150);
    const ort = await p.textContent('#jarvisOrt');
    pruefe('… gewählt: Hürth steht oben als Studio', ort === 'Hürth' && (await p.getAttribute('#jarvisPersona [data-jvp="studio"][data-jvw="studio-6"]', 'aria-pressed')) === 'true', ort);
    // 6: Effekte
    await p.click('#jarvisPersona [data-jvp="effekte"][data-jvw="sparsam"]'); await p.waitForTimeout(150);
    pruefe('„Effekte: Sparsam" setzt die niedrige Stufe', (await p.getAttribute('#jarvis', 'data-effekte')) === 'niedrig');
    await p.click('#jarvisPersona [data-jvp="effekte"][data-jvw="auto"]'); await p.waitForTimeout(150);
    // Leitungs-Code (nur Chef)
    await p.evaluate(() => { window.__code = []; window.__antwort.formiCodeSetzen = (d) => { window.__code.push(d); return Promise.resolve({ data: { ok: true } }); }; });
    await p.fill('#jvPCode', 'kurz'); await p.click('#jvPCodeSetzen'); await p.waitForTimeout(150);
    pruefe('Mail-Code: zu kurz → nichts gesendet', (await p.evaluate(() => window.__code.length)) === 0);
    await p.fill('#jvPCode', 'Sommer2026!'); await p.click('#jvPCodeSetzen'); await p.waitForTimeout(250);
    pruefe('Mail-Code: geht an formiCodeSetzen, Feld danach leer', (await p.evaluate(() => JSON.stringify(window.__code))) === JSON.stringify([{ code: 'Sommer2026!' }]) && (await p.inputValue('#jvPCode')) === '');
    await p.click('#jvPZu'); await p.waitForTimeout(150);
    await p.evaluate(() => localStorage.removeItem(Object.keys(localStorage).find(k => /^kf_gehirn_lern_/.test(k))));
    await sag('Briefkasten leeren erledigt');
    const k5 = await letzte();
    pruefe('mit Mein Studio (Hürth) und ohne Gelerntes: der Punkt in Hürth, ohne Nachfrage', /Abgehakt/.test(k5) && /Hürth/.test(k5) && !(await p.$('#jarvisVerlauf .gehirn-antwort:last-child [data-gwahl]')), k5.slice(0, 200));
    await sag('Übergabe: Handtücher sind in der Maschine');
    pruefe('mit Mein Studio: „Übergabe: …" ohne Nachfrage, Studio Hürth', !(await p.evaluate(() => { const k = [...document.querySelectorAll('#jarvisVerlauf .gehirn-antwort')].pop(); return k.querySelector('[data-grf]'); })) && /Hürth/.test(await letzte()), (await letzte()).slice(0, 200));
    // 9: Mail aus der App — Entwurf, ändern, senden
    await p.evaluate(() => { window.__mails = []; window.__antwort.gehirnAktion = () => Promise.resolve({ data: { vorschlag: { typ: 'mail', an: 'lea@kformen.com', betreff: 'Schicht morgen', text: 'Hi Lea, kannst du morgen?' } } });
      window.__antwort.formiMailSenden = (d) => { window.__mails.push(d); return Promise.resolve({ data: { ok: true } }); }; });
    await sag('schreib lea@kformen.com eine mail ob sie morgen kann');
    const km = await letzte();
    pruefe('„schreib … eine Mail": Entwurf mit Adresse, Betreff und Text — noch nichts gesendet', /lea@kformen\.com/.test(km) && (await p.inputValue('#jarvisVerlauf [data-gmailfeld$="|betreff"]')) === 'Schicht morgen' && (await p.evaluate(() => window.__mails.length)) === 0, km.slice(0, 200));
    await p.fill('#jarvisVerlauf [data-gmailfeld$="|text"]', 'Hi Lea, kannst du morgen früh?');
    await p.click('#jarvisVerlauf [data-gmail]'); await p.waitForTimeout(300);
    const gm = await p.evaluate(() => window.__mails);
    pruefe('… „Senden" schickt genau den geänderten Text über formiMailSenden', gm.length === 1 && gm[0].an === 'lea@kformen.com' && gm[0].text === 'Hi Lea, kannst du morgen früh?' && gm[0].betreff === 'Schicht morgen' && /ist raus/.test(await letzte()), JSON.stringify(gm));
    // 5: Buchstaben
    await p.evaluate(() => { window.__antwort.gehirnAktion = () => new Promise(r => setTimeout(() => r({ data: { art: 'frage', antwort: 'Die Westen kommen bei 30 Grad in die Maschine.', abgedeckt: true } }), 2500)); });
    await p.fill('#jarvisFeld', 'Wie wasche ich die Westen?'); await p.click('#jarvisSenden');
    await p.waitForTimeout(700);
    const z1 = await p.evaluate(() => +document.getElementById('jarvisZeichen').getAttribute('data-zeichen'));
    pruefe('Buchstaben wirbeln ins Loch, solange Formi denkt', z1 >= 10, z1);
    await p.waitForTimeout(2600);
    const z2 = await p.evaluate(() => +document.getElementById('jarvisZeichen').getAttribute('data-zeichen'));
    pruefe('… nach der Antwort kommen sie wieder heraus', z2 >= 5, z2);
    const weg = await p.waitForFunction(() => +document.getElementById('jarvisZeichen').getAttribute('data-zeichen') === 0, null, { timeout: 9000 }).then(() => true, () => false);
    pruefe('… und sind danach wieder weg (nichts bleibt liegen)', weg);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }
  {
    const p = await oeffne(b, 390, 844, { wenigBewegung: true, vorher: () => { localStorage.setItem('kf_jv_brief', new Date().toLocaleDateString('sv-SE')); } });
    await p.click(await jvKnopf(p)); await p.waitForTimeout(400);
    await p.evaluate(() => { window.__antwort = window.__antwort || {}; window.__antwort.gehirnAktion = () => new Promise(r => setTimeout(() => r({ data: { art: 'frage', antwort: 'Ok.', abgedeckt: true } }), 800)); });
    await p.fill('#jarvisFeld', 'Wie wasche ich die Westen?'); await p.click('#jarvisSenden'); await p.waitForTimeout(500);
    pruefe('„weniger Bewegung": keine fliegenden Buchstaben', (await p.evaluate(() => +document.getElementById('jarvisZeichen').getAttribute('data-zeichen'))) === 0);
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
      /* Gemessen wird erst, wenn nichts mehr scrollt. Nach einer neuen
         Nachricht rollt Formi den Verlauf sanft nach unten; wer direkt
         nach scrollIntoView misst, erwischt den Knopf mitten in der
         Fahrt halb unter der Kante (22.10.2026: 34 bzw. 42 px gemessen,
         ruhend sind es 44). Die Schwelle bleibt 44. */
      const ids = async (sel) => p.evaluate(async ({ s, T }) => {
        const F = eval('(' + T + ')'); const zuKlein = [];
        const bild = () => new Promise(r => requestAnimationFrame(() => r()));
        for (const el of document.querySelectorAll(s)) {
          if (!el.getClientRects().length) continue;
          el.scrollIntoView({ block: 'center' });
          let vorher = '', ruhig = 0;
          for (let i = 0; i < 60 && ruhig < 3; i++) {
            await bild();
            const r = el.getBoundingClientRect(), jetzt = r.top + '/' + r.left;
            ruhig = jetzt === vorher ? ruhig + 1 : 0; vorher = jetzt;
          }
          const m = F(el);
          if (m.w < 44 || m.h < 44) zuKlein.push((el.id || el.textContent.trim()).slice(0, 24) + ' ' + m.w + '×' + m.h);
        }
        return zuKlein;
      }, { s: sel, T: TREFFER.toString() });
      let zuKlein = await ids('#gehirnChips .gehirn-chip, #gehirnFragen, #gehirnMic, #gehirnBericht button, #gehirnVorschlaege button');
      await antwort(p, {
        gehirnFrage: { data: { antwort: 'Ok.', abgedeckt: true, nachricht: 7 } },
        gehirnAktion: { data: { vorschlag: { typ: 'aufgabe', titel: 'X', alle: true, studioKeys: [], studioNamen: [] } } }
      });
      await p.fill('#gehirnFeld', 'Wie lege ich eine Aufgabe an?'); await p.click('#gehirnFragen'); await fertig(p);
      await p.fill('#gehirnFeld', 'Aufgabe X'); await p.click('#gehirnFragen'); await fertig(p);
      zuKlein = zuKlein.concat(await ids('#gehirnVerlauf [data-gziel], #gehirnVerlauf [data-gvorschlag], #gehirnVerlauf [data-ganlegen]'));
      await p.click('#gehirnVerlauf [data-ganlegen]'); await p.waitForTimeout(400);
      zuKlein = zuKlein.concat(await ids('#gehirnVerlauf .gv-fertig [data-gziel]'));
      // Daumen unter einer Antwort mit Nummer (20.10.2026)
      await antwort(p, { gehirnAktion: { data: { art: 'frage', antwort: 'Ok.', abgedeckt: true, nachricht: 7 } } });
      await p.fill('#gehirnFeld', 'Wie wasche ich die Westen?'); await p.click('#gehirnFragen'); await fertig(p);
      if (!(await p.$('#gehirnVerlauf [data-gdaumen]'))) zuKlein.push('Daumen fehlt');
      zuKlein = zuKlein.concat(await ids('#gehirnVerlauf [data-gdaumen]'));
      // Das eigene Fenster: Kachel auf der Startseite und die Knöpfe darin
      await p.evaluate(() => { location.hash = '#home'; }); await p.waitForTimeout(400);
      const jk = await jvKnopf(p);
      if (jk) zuKlein = zuKlein.concat(await ids(jk));
      if (jk) {
        await p.click(jk); await p.waitForTimeout(300);
        zuKlein = zuKlein.concat(await ids('#jarvisZu, #jarvisTon, #jarvisGespraecheBtn, #jarvisSenden, #jarvisMic, #jarvisVerlauf .jv-chip'));
        zuKlein = zuKlein.concat(await ids('#jarvisKacheln .jv-kl'));
        zuKlein = zuKlein.concat(await ids('#jarvisPersonaBtn'));
        zuKlein = zuKlein.concat(await ids('#jarvisFoto'));
        await p.click('#jarvisPersonaBtn'); await p.waitForTimeout(200);
        zuKlein = zuKlein.concat(await ids('#jarvisPersona button, #jarvisPersona input, #jarvisPersona select'));
        await p.click('#jvPZu'); await p.waitForTimeout(150);
        if (h > 740 || w >= 1100) { if (!(await p.$('#jarvisKacheln .jv-kl'))) zuKlein.push('Kacheln fehlen'); }
        await p.fill('#jarvisFeld', 'öffne den putzplan'); await p.click('#jarvisSenden'); await p.waitForTimeout(800);
        if (!(await p.$('#jarvisVerlauf .gm-haken'))) zuKlein.push('Mini-Fenster fehlt');
        zuKlein = zuKlein.concat(await ids('#jarvisVerlauf .gm-haken, #jarvisVerlauf [data-gmzu], #jarvisVerlauf .gm-studios button, #jarvisVerlauf .gm-ganz'));
        await p.click('#jarvisVerlauf .gm-haken[aria-pressed="false"]'); await p.waitForTimeout(200);
        zuKlein = zuKlein.concat(await ids('#jarvisVerlauf [data-gmrueck]'));
        await p.click('#jarvisGespraecheBtn'); await p.waitForTimeout(200);
        zuKlein = zuKlein.concat(await ids('#jarvisGespraeche button'));
        await p.click('#jarvisGespraecheBtn'); await p.waitForTimeout(150);
        // Mail-Entwurf und Studio-Rückfrage (20.10.2026)
        await antwort(p, { gehirnAktion: { data: { vorschlag: { typ: 'mail', an: 'a@b.de', betreff: 'B', text: 'T' } } } });
        await p.fill('#jarvisFeld', 'schreib a@b.de eine mail'); await p.click('#jarvisSenden'); await p.waitForTimeout(700);
        if (!(await p.$('#jarvisVerlauf [data-gmail]'))) zuKlein.push('Mail-Entwurf fehlt');
        zuKlein = zuKlein.concat(await ids('#jarvisVerlauf [data-gmail], #jarvisVerlauf [data-gmailfeld]'));
        await p.fill('#jarvisFeld', 'Übergabe: Test'); await p.click('#jarvisSenden'); await p.waitForTimeout(500);
        zuKlein = zuKlein.concat(await ids('#jarvisVerlauf [data-grf]'));
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
