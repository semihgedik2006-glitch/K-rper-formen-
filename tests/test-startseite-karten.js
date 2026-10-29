/* ══ STARTSEITE IN KARTEN (Runde 295) ══════════════════════════════════
   Aus dem Betrieb, 28.10.2026: „kannst du eventuell die ganze startseite
   überarbeiten … dass mitarbeiter theoretisch nicht mal was anderes
   nutzen müssten als die start seite", auf die Rückfragen: direkt auf
   der Startseite Aufgaben + Putzplan abhaken, Kommen/Gehen, Kundenpost
   + Nachrichten der Leitung; erst Mitarbeiter, die Leitung danach.
   Am 29.10.2026, zum Entwurf: „es soll schon jeder bereich ein eigenen
   bereich haben alles aber halt kleiner und auf der startseite nur,
   NUR auf handy ist es auch ok wenn man scrollen muss etwas" — und
   danach „ja genau so".

   Geprüft wird:
    1. Mitarbeiter: oben Kommen/Gehen, darunter Karten in dieser
       Reihenfolge: Kundenpost, Von der Leitung, Aufgaben, Putzplan.
       Höchstens drei Zeilen je Karte; die Überschrift nennt die volle
       Zahl. Bestätigte Kundenpost steht nicht mehr da, Kündigungen
       zuerst.
    2. Kundenpost „Erledigt": Fenster, „Erledigt" erst mit Grund;
       geschrieben wird status:'wartet' mit Grund und eigener Kennung —
       NIE 'bestaetigt'. Danach steht die Zeile als „wartet" da.
    3. „Gelesen" bei der Leitung schreibt den eigenen Haken und nimmt die
       Zeile weg.
    4. „Alle N" der Kundenpost klappt die Karte auf.
    5. Handy: es wird nicht mehr gekürzt (Scrollen erlaubt); Rechner
       (1280 × 800, 1440 × 900): die Seite passt weiter auf einen
       Bildschirm.
    6. Jeder neue Knopf trifft ≥ 44 × 44 (320 / 390 / 1440, normal und
       kompakt).
    7. Mit Freigabe fürs Handy-Stempeln: „Kommen" öffnet das Fenster mit
       Code-Feld.
    8. GEGENPROBEN: die Leitung sieht die Karten (noch) nicht; ohne
       Kundenpost gibt es keine leere Karte.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
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
function post() {
  /* Läuft im Browser (addInitScript) — deshalb alles hier drin. */
  const TAG = 86400000, j = Date.now();
  return [
    { id: 'kp-alt', studioKey: 'studio-6', name: 'O. Krämer', betreff: 'Abbuchung aussetzen', art: 'sonst', kurz: 'Einen Monat aussetzen.', eingang: j - 38 * TAG, status: 'offen' },
    { id: 'kp-kuend', studioKey: 'studio-6', name: 'S. Brandt', betreff: 'Kündigung', art: 'kuendigung', kurz: 'Bittet um Bestätigung mit Enddatum.', eingang: j - 3 * TAG, status: 'offen' },
    { id: 'kp-neu', studioKey: 'studio-6', name: 'M. Keller', betreff: 'Vertragspause', art: 'pause', kurz: 'Pause im Dezember.', eingang: j - TAG, status: 'offen' },
    { id: 'kp-wartet', studioKey: 'studio-6', name: 'T. Schulz', betreff: 'Termin', art: 'termin', kurz: 'Samstag statt Donnerstag.', eingang: j - 2 * TAG, status: 'wartet', grund: 'telefon', erledigtName: 'Anna' },
    { id: 'kp-fertig', studioKey: 'studio-6', name: 'J. Wagner', betreff: 'Krankmeldung', art: 'krank', kurz: '-', eingang: j - 5 * TAG, status: 'bestaetigt' }
  ];
}
async function oeffne(b, w, h, rolle, mitPost, frei) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript(() => { try { localStorage.setItem('kf_tour', '1:testuid'); localStorage.setItem('kf_formi_gruss', new Date().toDateString()); } catch (e) {} });
  if (mitPost !== false) await p.addInitScript('window.__kundenpost = (' + post.toString() + ')();');
  if (rolle === 'mitarbeiter' && frei) await p.addInitScript('window.__handyFrei = true;');
  await p.addInitScript({ path: SP + '/stub-' + rolle + '.js' });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(1400);
  p._ctx = ctx;
  return p;
}
const STAND = () => {
  const box = document.getElementById('heuteListe');
  const bl = [...box.querySelectorAll('.heute-block')].filter(e => e.getClientRects().length);
  return {
    karten: box.classList.contains('bereichskarten'),
    stempel: !!box.querySelector('.heute-stempel'),
    titel: bl.map(x => x.getAttribute('data-btitel')),
    zahl: Object.fromEntries(bl.map(x => [x.getAttribute('data-btitel'), Number(x.getAttribute('data-bzahl'))])),
    zeilen: Object.fromEntries(bl.map(x => [x.getAttribute('data-btitel'), [...x.querySelectorAll('.heute-zeile')].map(z => (z.querySelector('.hz-txt b') || {}).textContent)])),
    unter: Object.fromEntries(bl.map(x => [x.getAttribute('data-btitel'), [...x.querySelectorAll('.heute-zeile')].map(z => (z.querySelector('.hz-txt i') || {}).textContent)])),
    erledigtKnoepfe: [...box.querySelectorAll('[data-hkp].hz-aktion')].length,
    gelesenKnoepfe: [...box.querySelectorAll('[data-hgel]')].length,
    ausserdem: !!box.querySelector('.heute-rest [data-heute]')
  };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1 Mitarbeiter: Kommen/Gehen und Karten ──');
  {
    const p = await oeffne(b, 390, 844, 'mitarbeiter');
    const s = await p.evaluate(STAND);
    pruefe('die Liste trägt die Karten, oben steht Kommen/Gehen', s.karten && s.stempel, JSON.stringify(s));
    const reihe = ['Kundenpost', 'Von der Leitung', 'Aufgaben', 'Putzplan'].filter(t => s.titel.indexOf(t) >= 0);
    pruefe('Reihenfolge: Kundenpost, Von der Leitung, Aufgaben, Putzplan (' + s.titel.join(' · ') + ')',
      reihe.length === 4 && reihe.every((t, i) => i === 0 || s.titel.indexOf(t) > s.titel.indexOf(reihe[i - 1])), JSON.stringify(s.titel));
    pruefe('keine eigenen Blöcke „Überfällig", „Heute", „Offen" mehr — sie stehen in „Aufgaben"',
      !s.titel.some(t => /^(Überfällig|Heute|Offen)$/.test(t)), JSON.stringify(s.titel));
    pruefe('höchstens drei Zeilen je Karte', Object.values(s.zeilen).every(z => z.length <= 3), JSON.stringify(s.zeilen));
    pruefe('Kundenpost: die Überschrift zählt 4 (bestätigte nicht)', s.zahl['Kundenpost'] === 4, JSON.stringify(s.zahl));
    pruefe('… die Kündigung zuerst, dann das Älteste', /Brandt/.test(s.zeilen['Kundenpost'][0] || '') && /Krämer/.test(s.zeilen['Kundenpost'][1] || ''), JSON.stringify(s.zeilen['Kundenpost']));
    pruefe('… die bestätigte steht nicht da', !JSON.stringify(s.zeilen).includes('J. Wagner'));
    pruefe('„Von der Leitung" zeigt die ungelesene Info mit „Gelesen"', s.gelesenKnoepfe >= 1 && (s.zeilen['Von der Leitung'] || []).some(t => /Gurte/.test(t)), JSON.stringify(s.zeilen['Von der Leitung']));
    pruefe('die Leitungs-Info steht NICHT zusätzlich unter „Neu für dich"', !(s.zeilen['Neu für dich'] || []).some(t => /Leitung|Angeheftet/.test(t)), JSON.stringify(s.zeilen['Neu für dich']));

    console.log('\n── 4 „Alle 4" klappt die Kundenpost auf ──');
    const auf = await p.evaluate(async () => {
      const l = document.querySelector('.heute-block[data-btitel="Kundenpost"] .mini-link'); if (!l) return { link: false };
      l.click(); await new Promise(r => setTimeout(r, 400));
      const bl = document.querySelector('.heute-block[data-btitel="Kundenpost"]');
      return { link: true, zeilen: bl.querySelectorAll('.heute-zeile').length, ansicht: (document.querySelector('.view.show') || {}).id,
        wartetOhneKnopf: [...bl.querySelectorAll('.heute-zeile')].filter(z => /wartet auf Bestätigung/.test(z.textContent)).every(z => !z.closest('.hz-mit-aktion')) };
    });
    pruefe('„Alle 4" zeigt alle vier, die Seite bleibt „Heute"', auf.link && auf.zeilen === 4 && auf.ansicht === 'view-home', JSON.stringify(auf));
    pruefe('was schon „wartet", hat keinen „Erledigt"-Knopf', auf.wartetOhneKnopf, JSON.stringify(auf));

    console.log('\n── 2 Kundenpost „Erledigt" ──');
    const e = await p.evaluate(async () => {
      document.querySelector('[data-hkp="kp-kuend"].hz-aktion').click();
      await new Promise(r => setTimeout(r, 300));
      const m = document.getElementById('kpModal'), ok = document.getElementById('kpOk');
      const vorher = { offen: m.classList.contains('show') && getComputedStyle(m).display !== 'none', okAus: ok.disabled,
        titel: document.getElementById('kpTitel').textContent };
      m.querySelector('input[value="telefon"]').click();
      await new Promise(r => setTimeout(r, 100));
      const okAn = !ok.disabled;
      ok.click(); await new Promise(r => setTimeout(r, 600));
      const s = (window.__schreib || []).filter(x => /kundenpost\/kp-kuend$/.test(x.pfad));
      const z = [...document.querySelectorAll('.heute-block[data-btitel="Kundenpost"] .heute-zeile')].find(x => /Brandt/.test(x.textContent));
      return { vorher, okAn, zu: !m.classList.contains('show'), s: s.map(x => x.daten), zeile: z ? z.textContent : '' };
    });
    pruefe('das Fenster öffnet, „Erledigt" ist erst ohne Grund aus', e.vorher.offen && e.vorher.okAus && /Brandt/.test(e.vorher.titel), JSON.stringify(e.vorher));
    pruefe('… mit Grund an', e.okAn);
    const d = e.s[0] || {};
    pruefe('geschrieben: status „wartet", Grund „telefon", eigene Kennung — nie „bestaetigt"',
      e.s.length === 1 && d.status === 'wartet' && d.grund === 'telefon' && d.erledigtUid === 'testuid' && typeof d.erledigtTs === 'number' &&
      Object.keys(d).sort().join(',') === 'erledigtName,erledigtTs,erledigtUid,grund,status', JSON.stringify(e.s));
    pruefe('danach: Fenster zu, die Zeile „wartet auf Bestätigung · telefonisch"', e.zu && /wartet auf Bestätigung · telefonisch/.test(e.zeile), JSON.stringify(e));

    console.log('\n── 3 „Gelesen" ──');
    const g = await p.evaluate(async () => {
      const k = document.querySelector('[data-hgel]'); const id = k.getAttribute('data-hgel');
      k.click(); await new Promise(r => setTimeout(r, 500));
      const s = (window.__schreib || []).filter(x => x.pfad.indexOf('announcements/' + id) >= 0);
      return { id, n: s.length, noch: !!document.querySelector('[data-hgel="' + id + '"]') };
    });
    pruefe('„Gelesen" schreibt den eigenen Haken und nimmt den Knopf weg', g.n === 1 && !g.noch, JSON.stringify(g));
    pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── 5 Handy scrollt, Rechner passt ──');
  for (const [w, h] of [[390, 844], [320, 640], [1280, 800], [1440, 900]]) {
    const p = await oeffne(b, w, h, 'mitarbeiter');
    const m = await p.evaluate(() => {
      const box = document.getElementById('heuteListe'), sa = box.closest('.scroll-area');
      const st = document.querySelector('.heute-stempel');
      return { hoch: sa.scrollHeight, sicht: sa.clientHeight, zeilen: box.querySelectorAll('.heute-zeile').length,
        ausserdem: !!box.querySelector('.heute-rest [data-heute]'), spalten: box.classList.contains('zweispaltig'),
        stempelBreite: st ? Math.round(st.getBoundingClientRect().width) : 0, breite: innerWidth };
    });
    if (w < 1100) {
      pruefe(w + ' px: nichts fällt nach „Ausserdem", gekürzt wird nicht (' + m.zeilen + ' Zeilen, ' + m.hoch + ' / ' + m.sicht + ' px)', !m.ausserdem && m.zeilen >= 10, JSON.stringify(m));
    } else {
      pruefe(w + ' × ' + h + ': zwei Spalten, die Seite passt auf einen Bildschirm (' + m.hoch + ' / ' + m.sicht + ' px)', m.spalten && m.hoch <= m.sicht + 2, JSON.stringify(m));
    }
    pruefe(w + ' px: keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── 6 Treffer ≥ 44 × 44 ──');
  for (const [w, h] of [[320, 640], [390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h, 'mitarbeiter');
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.waitForTimeout(200);
      const m = await p.evaluate((SRC) => {
        const T = eval('(' + SRC + ')');
        const k = [...document.querySelectorAll('#heuteListe .hz-aktion, #heuteListe .hs-knopf, #heuteListe .hz-haken, #heuteListe .heute-block .mini-link')]
          .filter(e => e.getClientRects().length);
        return k.map(e => { e.scrollIntoView({ block: 'center' }); const t = T(e); return { k: e.className.split(' ').pop(), w: t.w, h: t.h }; });
      }, TREFFER.toString());
      const klein = m.filter(x => x.w < 44 || x.h < 44);
      pruefe(w + ' px ' + dichte + ': ' + m.length + ' Knöpfe, jeder trifft ≥ 44 × 44', m.length >= 5 && !klein.length, JSON.stringify(klein.length ? klein : m.slice(0, 4)));
    }
    await p._ctx.close();
  }

  console.log('\n── 7 Mit Freigabe: Kommen öffnet das Fenster ──');
  {
    const p = await oeffne(b, 390, 844, 'mitarbeiter', true, true);
    const r = await p.evaluate(async () => {
      const k = document.querySelector('[data-hstempel]'); if (!k) return { knopf: false };
      const text = k.textContent; k.click(); await new Promise(x => setTimeout(x, 300));
      const m = document.getElementById('hsModal');
      return { knopf: true, text, offen: m.classList.contains('show') && getComputedStyle(m).display !== 'none',
        code: !!document.getElementById('hsCode'),
        knoepfe: [...document.querySelectorAll('#hsKnoepfe [data-hsart]')].map(x => x.getAttribute('data-hsart')) };
    });
    pruefe('Knopf „Kommen", ein Tipp öffnet das Fenster mit Code-Feld und „Kommen"',
      r.knopf && r.text === 'Kommen' && r.offen && r.code && JSON.stringify(r.knoepfe) === '["kommen"]', JSON.stringify(r));
    const kurz = await p.evaluate(async () => {
      document.getElementById('hsCode').value = '12';
      document.querySelector('#hsKnoepfe [data-hsart]').click(); await new Promise(x => setTimeout(x, 200));
      return { fehler: document.getElementById('hsFehler').textContent, noch: document.getElementById('hsModal').classList.contains('show') };
    });
    pruefe('ein zu kurzer Code wird nicht geschickt, das Fenster sagt warum', /sechs Ziffern/.test(kurz.fehler) && kurz.noch, JSON.stringify(kurz));
    await p._ctx.close();
    const q = await oeffne(b, 390, 844, 'mitarbeiter');
    const ohne = await q.evaluate(() => {
      const k = document.querySelector('.heute-stempel .hs-knopf');
      return { stempel: !!document.querySelector('[data-hstempel]'), ziel: k && k.getAttribute('data-heute'), text: k && k.textContent };
    });
    pruefe('GEGENPROBE ohne Freigabe: kein Stempel-Fenster, der Knopf führt zu „Zeiten"', !ohne.stempel && ohne.ziel === 'zeit', JSON.stringify(ohne));
    const geh = await q.evaluate(async () => { document.querySelector('.heute-stempel .hs-knopf').click(); await new Promise(x => setTimeout(x, 400));
      return (document.querySelector('.view.show') || {}).id; });
    pruefe('… und öffnet „Meine Zeiten"', geh === 'view-zeit', geh);
    await q._ctx.close();
  }

  console.log('\n── 8 Gegenproben ──');
  {
    const p = await oeffne(b, 390, 844, 'mitarbeiter', false);
    const s = await p.evaluate(STAND);
    pruefe('ohne Kundenpost gibt es keine leere Karte', s.titel.indexOf('Kundenpost') < 0, JSON.stringify(s.titel));
    await p._ctx.close();
    for (const rolle of ['chef', 'leiter']) {
      const q = await oeffne(b, 390, 844, rolle);
      const t = await q.evaluate(STAND);
      /* Seit Runde 296 hat die Leitung eine EIGENE Startseite
         (test-startseite-leitung.js) — die Karten der Mitarbeiter
         (Kundenpost, Aufgaben … als Blöcke) sieht sie nicht. */
      const ls = await q.evaluate(() => !!document.querySelector('#heuteListe .ls'));
      pruefe(rolle + ': nicht die Karten der Mitarbeiter, sondern die Startseite der Leitung', ls && t.titel.indexOf('Kundenpost') < 0 && t.titel.indexOf('Aufgaben') < 0, JSON.stringify({ ls, titel: t.titel }));
      pruefe(rolle + ': keine Skriptfehler', !q._fehler.length, q._fehler.join(' | '));
      await q._ctx.close();
    }
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Startseite in Karten: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Startseite in Karten: Kommen/Gehen, Kundenpost, Leitung, Aufgaben, Putzplan — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
