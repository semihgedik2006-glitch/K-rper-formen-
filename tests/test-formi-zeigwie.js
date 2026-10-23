/* ══════════════════════════════════════════════════════════════════════
   „ZEIG MIR WIE" — FORMIS RUNDGÄNGE IN DER ECHTEN APP (Runde 223, 23.10.2026)

   Aus dem Betrieb (Runde 177, Etappe 2): Formi soll „Zeig mir wie" können,
   in der echten App. Dazu Idee 11 aus docs/ideen/formi-im-design.md: um
   das Ziel liegt Formis Ring, der Rest ist leicht abgedunkelt, unten
   steht „Schritt n von m · Abbrechen · Weiter". „Der Ring darf keinen
   Knopf verdecken" — das ist die Erweiterung von test-formi-verdeckt um
   die Rundgänge.

   Geprüft wird:
    1. Erkennen ohne KI: „zeig mir, wie …", „wie melde ich mich krank"
       starten einen Rundgang; „Wie wasche ich die Westen?" bleibt bei der
       KI; „ich bin heute krank" bleibt die Krankmeldung.
    2. Über Formis Fenster: Satz rein → kein KI-Aufruf, nichts
       geschrieben, Rundgang läuft auf der richtigen Seite und im
       richtigen Reiter. Weiter / Escape / Fertig. Der Vorschlag
       „Zeig mir, wie …" zeigt die Auswahl.
    3. Für JEDE Rolle (Chef, Leitung, Mitarbeiter), JEDE Breite (320 /
       390 / 430 / 820 / 1280 / 1440 / 1920), normal und kompakt, JEDEN
       Rundgang und JEDEN Schritt:
       - der Ring umschliesst das Ziel und liegt im Bild,
       - das Ziel ist per Hit-Test (elementFromPoint) antippbar — die
         Abdunklung fängt keine Klicks,
       - die Karte liegt ganz im Bild und NICHT auf dem Ziel,
       - „Weiter" und „Abbrechen" ≥ 44 × 44 per Hit-Test, im Bild.
    4. Ohne Seitenfehler; nur transform wird animiert.

   Was das NICHT prüft: echte Handys, die Arbeit je Bild während des Flugs
   (bewegt wird nur transform), den Anmeldeweg.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;
const SCHNELL = process.env.SCHNELL === '1';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

async function oeffne(b, w, h, stub, opt) {
  opt = opt || {};
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block',
    reducedMotion: opt.bewegung ? 'no-preference' : 'reduce' });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await p.addInitScript({ path: SP + '/' + stub });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(900);
  p._ctx = ctx;
  return p;
}

/* Läuft in der Seite: misst den aktuellen Schritt. */
const SCHRITT_MESSEN = () => {
  const box = document.getElementById('formiWie');
  if (!box || box.hidden) return { aus: true };
  const st = window.__formiWie.stand();
  const licht = box.querySelector('.fw-licht').getBoundingClientRect();
  const karte = box.querySelector('.fw-karte').getBoundingClientRect();
  const ziel = window.__formiWie.ziel();
  const W = innerWidth, H = innerHeight;
  const r = ziel ? ziel.getBoundingClientRect() : null;
  const trifft = (el, x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  const TREFFER = (el) => {
    if (!el || !el.getClientRects().length) return { w: 0, h: 0, imBild: false };
    const q = el.getBoundingClientRect(), cx = q.left + q.width / 2, cy = q.top + q.height / 2;
    if (!trifft(el, cx, cy)) return { w: 0, h: 0, verdeckt: true };
    let o = cy, u = cy, l = cx, re = cx;
    while (o > 0 && trifft(el, cx, o - 1)) o--;
    while (u < H - 1 && trifft(el, cx, u + 1)) u++;
    while (l > 0 && trifft(el, l - 1, cy)) l--;
    while (re < W - 1 && trifft(el, re + 1, cy)) re++;
    return { w: Math.round(re - l + 1), h: Math.round(u - o + 1), imBild: q.left >= 0 && q.top >= 0 && q.right <= W && q.bottom <= H };
  };
  const ueber = (a, b) => a.right > b.left + 1 && a.left < b.right - 1 && a.bottom > b.top + 1 && a.top < b.bottom - 1;
  const zielName = ziel ? (ziel.id ? '#' + ziel.id : ziel.tagName.toLowerCase() + '.' + String(ziel.className).split(' ')[0]) : '—';
  return {
    aus: false, st, zielName, titel: document.getElementById('fwTitel').textContent,
    zahl: document.getElementById('fwZahl').textContent,
    ringUm: !!r && licht.left <= r.left + 1 && licht.top <= r.top + 1 && licht.right >= Math.min(r.right, W - 4) - 1 && licht.bottom >= Math.min(r.bottom, H - 4) - 1,
    ringImBild: licht.left >= 0 && licht.top >= 0 && licht.right <= W && licht.bottom <= H,
    zielTippbar: !!r && trifft(ziel, r.left + r.width / 2, r.top + r.height / 2),
    karteImBild: karte.left >= 0 && karte.top >= 0 && karte.right <= W && karte.bottom <= H,
    karteFrei: !!r && !ueber(karte, r),
    weiter: TREFFER(document.getElementById('fwWeiter')), weg: TREFFER(document.getElementById('fwWeg')),
    querlauf: document.documentElement.scrollWidth > W + 1,
    licht: [licht.left, licht.top, licht.width, licht.height].map(Math.round).join(','), ziel: r ? [r.left, r.top, r.width, r.height].map(Math.round).join(',') : '',
    karte: [karte.left, karte.top, karte.width, karte.height].map(Math.round).join(',')
  };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── 1 Erkennen (ohne KI) ──');
    {
      const p = await oeffne(b, 1440, 900, 'stub-chef.js');
      const fall = await p.evaluate(() => {
        const e = (t) => { const r = window.__formiWie.erkennen(t); return r ? r.id : null; };
        const s = (t) => { const r = window.__formiWie.schnell(t); return r ? r.typ : null; };
        return {
          aufgabe: e('zeig mir wie ich eine aufgabe anlege'), aufgabe2: e('Wie lege ich eine Aufgabe an?'),
          krank: e('Wie melde ich mich krank?'), urlaub: e('zeig mir, wie ich urlaub eintrage'),
          uebergabe: e('wie schreibe ich eine übergabe'), schicht: e('erklär mir wie ich eine schicht tausche'),
          putzen: e('wie hake ich im putzplan ab'), liste: e('Zeig mir, wie …'),
          westen: e('Wie wasche ich die Westen?'), krankSchnell: s('ich bin heute krank'),
          wieKrankSchnell: s('wie melde ich mich krank'), putzplanOeffnen: s('zeig mir den putzplan')
        };
      });
      pruefe('„zeig mir wie ich eine aufgabe anlege" → Rundgang Aufgabe', fall.aufgabe === 'aufgabe', fall.aufgabe);
      pruefe('„Wie lege ich eine Aufgabe an?" → Rundgang Aufgabe', fall.aufgabe2 === 'aufgabe', fall.aufgabe2);
      pruefe('„Wie melde ich mich krank?" → Rundgang Abwesenheit', fall.krank === 'abwesend', fall.krank);
      pruefe('„zeig mir, wie ich urlaub eintrage" → Rundgang Abwesenheit', fall.urlaub === 'abwesend', fall.urlaub);
      pruefe('„wie schreibe ich eine übergabe" → Rundgang Übergabe', fall.uebergabe === 'uebergabe', fall.uebergabe);
      pruefe('„erklär mir wie ich eine schicht tausche" → Rundgang Schicht', fall.schicht === 'schicht', fall.schicht);
      pruefe('„wie hake ich im putzplan ab" → Rundgang Putzplan', fall.putzen === 'putzen', fall.putzen);
      pruefe('„Zeig mir, wie …" → Auswahl', fall.liste === '', String(fall.liste));
      pruefe('„Wie wasche ich die Westen?" bleibt bei der KI', fall.westen === null, String(fall.westen));
      /* Der Chef hat mehrere Studios — dann fragt Formi erst, in welchem. */
      pruefe('„ich bin heute krank" bleibt die Krankmeldung (oder die Studio-Rückfrage davor)', ['abwesenheit', 'rueckfrage'].includes(fall.krankSchnell), String(fall.krankSchnell));
      /* Eine Wie-Frage bleibt eine Frage (KI + Studio-Wissen, test-gehirn
         „Frage zur App"); der Rundgang kommt als Knopf an die Antwort. */
      pruefe('„wie melde ich mich krank" meldet NICHT krank, sondern geht als Frage an die KI', fall.wieKrankSchnell === null, String(fall.wieKrankSchnell));
      pruefe('„zeig mir den putzplan" öffnet weiter den Putzplan', fall.putzplanOeffnen === 'navigation', String(fall.putzplanOeffnen));
      await p._ctx.close();
    }

    console.log('\n── 2 Über Formis Fenster ──');
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const p = await oeffne(b, w, h, 'stub-chef.js', { bewegung: true });
      await p.evaluate(() => { window.__kiGefragt = 0; window.__antwort = window.__antwort || {};
        window.__antwort.gehirnAktion = () => { window.__kiGefragt++; return Promise.resolve({ data: { art: 'frage', antwort: 'KI', abgedeckt: true } }); }; });
      const schreibVorher = await p.evaluate(() => (window.__schreib || []).length);
      await p.click('#formiKugel'); await p.waitForTimeout(500);
      /* Die Wie-Frage: KI antwortet, der Knopf startet den Rundgang. */
      await p.fill('#jarvisFeld', 'Wie melde ich mich krank?'); await p.click('#jarvisSenden');
      await p.waitForTimeout(900);
      const f0 = await p.evaluate(() => ({ ki: window.__kiGefragt, knopf: !!document.querySelector('#jarvisVerlauf [data-gwie="abwesend"]'), an: window.__formiWie.stand().an }));
      pruefe(`${w}: „Wie melde ich mich krank?" → Antwort der KI mit „Zeig’s mir in der App"`, f0.ki === 1 && f0.knopf && !f0.an, JSON.stringify(f0));
      await p.click('#jarvisVerlauf [data-gwie="abwesend"]');
      await p.waitForFunction(() => window.__formiWie.stand().an, null, { timeout: 5000 }).catch(() => {});
      await p.waitForTimeout(400);
      pruefe(`${w}: der Knopf startet den Rundgang`, await p.evaluate(() => window.__formiWie.stand().id === 'abwesend' && window.__formiWie.stand().an));
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      /* Die ausdrückliche Form startet gleich, ohne KI. */
      await p.evaluate(() => { window.__kiGefragt = 0; });
      await p.click('#formiKugel'); await p.waitForTimeout(500);
      await p.fill('#jarvisFeld', 'Zeig mir, wie ich mich krank melde'); await p.click('#jarvisSenden');
      await p.waitForFunction(() => window.__formiWie.stand().an, null, { timeout: 5000 }).catch(() => {});
      await p.waitForTimeout(900);
      const a = await p.evaluate(() => ({ st: window.__formiWie.stand(), ki: window.__kiGefragt, view: (document.querySelector('.view.show') || {}).id,
        reiter: (document.querySelector('[data-teamtab="abwesend"]') || {}).className, jarvisZu: document.getElementById('jarvis').hidden,
        fokus: document.activeElement && document.activeElement.id }));
      pruefe(`${w}: „Zeig mir, wie ich mich krank melde" startet den Rundgang, ohne KI`, a.st.an && a.st.id === 'abwesend' && a.ki === 0, JSON.stringify(a));
      /* Das Wochenarchiv (archives/<KW>) schreibt die App nach dem Laden von
         selbst, unabhängig von Formi — gemessen am 23.10.2026, es kam in
         diesem Abschnitt einmal dazu. Alles andere zählt. */
      const neu = await p.evaluate((n) => (window.__schreib || []).slice(n).filter(x => !/^archives\//.test(x.pfad)).map(x => x.pfad + ' ' + JSON.stringify(x.daten).slice(0, 80)), schreibVorher);
      pruefe(`${w}: nichts geschrieben (keine Krankmeldung, kein Eintrag)`, !neu.length, neu.join(' | '));
      pruefe(`${w}: Seite Team, Reiter „Abwesend", Formis Fenster zu`, a.view === 'view-team' && /\bon\b/.test(a.reiter || '') && a.jarvisZu, JSON.stringify(a));
      pruefe(`${w}: Fokus auf „Weiter"`, a.fokus === 'fwWeiter', a.fokus);
      /* Die Animationen bewegen nur transform/opacity. */
      await p.keyboard.press('ArrowRight'); await p.waitForTimeout(120);
      const anim = await p.evaluate(() => document.getAnimations().filter(x => x.effect && x.effect.target && x.effect.target.closest && x.effect.target.closest('#formiWie'))
        .map(x => Object.keys(Object.assign({}, ...x.effect.getKeyframes())).filter(k => !['offset', 'easing', 'composite', 'computedOffset'].includes(k))).flat());
      pruefe(`${w}: Rundgang animiert nur transform/opacity`, anim.every(k => k === 'transform' || k === 'opacity'), anim.join(','));
      await p.waitForTimeout(700);
      const z2 = await p.evaluate(() => window.__formiWie.stand());
      pruefe(`${w}: Pfeil rechts → Schritt 2`, z2.i === 1, JSON.stringify(z2));
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      const z3 = await p.evaluate(() => ({ st: window.__formiWie.stand(), hidden: document.getElementById('formiWie').hidden }));
      pruefe(`${w}: Escape bricht ab`, !z3.st.an && z3.hidden, JSON.stringify(z3));
      /* Der Vorschlag „Zeig mir, wie …" zeigt die Auswahl. */
      await p.click('#formiKugel'); await p.waitForTimeout(500);
      await p.evaluate(() => { /* leerer Verlauf → Vorschläge sichtbar */ });
      await p.fill('#jarvisFeld', 'Zeig mir, wie …'); await p.click('#jarvisSenden'); await p.waitForTimeout(700);
      const wahl = await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf [data-gwie]')].map(x => x.getAttribute('data-gwie')));
      pruefe(`${w}: „Zeig mir, wie …" bietet die Rundgänge an`, wahl.length >= 4 && wahl.includes('aufgabe') && wahl.includes('putzen'), wahl.join(','));
      await p.click('#jarvisVerlauf [data-gwie="putzen"]'); await p.waitForTimeout(900);
      let n = 0;
      for (; n < 8; n++) {
        const st = await p.evaluate(() => window.__formiWie.stand());
        if (!st.an) break;
        await p.click('#fwWeiter'); await p.waitForTimeout(700);
      }
      /* Ohne offenen Putzpunkt fällt „Abhaken" aus — erwartet wird so
         viele Klicks, wie der Rundgang danach noch Schritte hat. */
      const ende = await p.evaluate(() => ({ st: window.__formiWie.stand(), toast: (document.querySelector('.toast.show') || {}).textContent || '', view: (document.querySelector('.view.show') || {}).id }));
      pruefe(`${w}: Putzplan-Rundgang bis „Fertig" durchgetippt (${n} Klicks)`, !ende.st.an && n === ende.st.n && n >= 2 && /Fertig/.test(ende.toast) && ende.view === 'view-putzplan', JSON.stringify(ende) + ' n=' + n);
      pruefe(`${w}: ohne Seitenfehler`, !p._fehler.length, p._fehler.join(' | '));
      await p._ctx.close();
    }

    console.log('\n── 3 Jeder Schritt: Ring, Ziel antippbar, Karte frei, Knöpfe ≥ 44 ──');
    const rollen = [['stub-chef.js', 'Chef'], ['stub-leiter.js', 'Leitung'], ['stub-mitarbeiter.js', 'Mitarbeiter']];
    let breiten = SCHNELL ? [[390, 844], [1440, 900]] : [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]];
    if (process.env.BREITEN) breiten = process.env.BREITEN.split(',').map(x => x.split('x').map(Number));
    let schritte = 0;
    for (const [stub, rolle] of rollen) {
      for (const [w, h] of breiten) {
        for (const dichte of ['normal', 'kompakt']) {
          if (SCHNELL && dichte === 'kompakt' && w !== 390) continue;
          const p = await oeffne(b, w, h, stub);
          if (dichte === 'kompakt') await p.evaluate(() => document.body.setAttribute('data-dichte', 'kompakt'));
          const ids = await p.evaluate(() => window.__formiWie.liste());
          const funde = [];
          for (const id of ids) {
            await p.evaluate((id) => window.__formiWie.starten(id), id);
            for (let n = 0; n < 8; n++) {
              await p.waitForFunction(() => !window.__formiWie.stand().an || window.__formiWie.stand().ruhig, null, { timeout: 4000 }).catch(() => {});
              await p.waitForTimeout(60);
              const m = await p.evaluate(SCHRITT_MESSEN);
              if (m.aus) break;
              schritte++;
              const wo = `${id} ${m.zahl} (${m.zielName})`;
              if (!m.ringUm) funde.push(wo + ': Ring umschliesst das Ziel nicht (Ring ' + m.licht + ', Ziel ' + m.ziel + ')');
              if (!m.ringImBild) funde.push(wo + ': Ring nicht im Bild ' + m.licht);
              if (!m.zielTippbar) funde.push(wo + ': Ziel nicht antippbar');
              if (!m.karteImBild) funde.push(wo + ': Karte nicht im Bild ' + m.karte);
              if (!m.karteFrei) funde.push(wo + ': Karte liegt auf dem Ziel (Karte ' + m.karte + ', Ziel ' + m.ziel + ')');
              for (const [k, t] of [['Weiter', m.weiter], ['Abbrechen', m.weg]]) {
                if (!(t.w >= 44 && t.h >= 44 && t.imBild)) funde.push(wo + ': „' + k + '" ' + t.w + '×' + t.h + (t.imBild ? '' : ' nicht im Bild') + (t.verdeckt ? ' verdeckt' : ''));
              }
              if (m.querlauf) funde.push(wo + ': Querlauf');
              await p.evaluate(() => document.getElementById('fwWeiter').click());
            }
            const st = await p.evaluate(() => window.__formiWie.stand());
            if (st.an) { funde.push(id + ': endet nicht'); await p.keyboard.press('Escape'); }
            /* Den Hinweis abwarten, er liegt sonst unter der nächsten Karte. */
            await p.waitForTimeout(150);
          }
          pruefe(`${rolle} ${w}×${h} ${dichte}: ${ids.length} Rundgänge, Ring/Ziel/Karte/Knöpfe in Ordnung`, ids.length >= 1 && !funde.length, funde.slice(0, 8).join(' | ') + (funde.length > 8 ? ' … +' + (funde.length - 8) : ''));
          if (p._fehler.length) pruefe(`${rolle} ${w}×${h} ${dichte}: keine Seitenfehler`, false, p._fehler.join(' | '));
          await p._ctx.close();
        }
      }
    }
    console.log(`\nGemessen: ${schritte} Schritte.`);
  } catch (e) {
    console.log('Fehler: ' + e.message.split('\n')[0]);
    schlecht++;
  }
  await b.close();
  console.log(schlecht ? `✗ Zeig mir wie: ${schlecht} von ${gut + schlecht} falsch` : `✓ Zeig mir wie: ${gut} Zusicherungen`);
  process.exit(schlecht ? 1 : 0);
})();
