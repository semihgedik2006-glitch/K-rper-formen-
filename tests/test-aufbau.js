/* ══ APP GESTALTEN: DER EIGENE AUFBAU (Runde 289) ════════════════════
   Aus dem Betrieb, 26.10.2026: „formi soll mehrere möglichkeiten
   vorschlagen und man soll über einen editor … alles ändern, verschieben
   und anpassen können", „je mehr design optionen es gibt desto besser
   und je simpler es gehen kann desto besser auch, also man soll es
   komplett minimalisieren können", „es soll jeder nur für sein eigenes
   gerät anpassen können".

   Geprüft wird, als Mitarbeiter:
    1. Ohne eigenen Aufbau ist die Leiste die ausgelieferte (nichts ändert
       sich für die, die nichts einstellen).
    2. „Alles → App gestalten" öffnet die Tafel. Jedes Bedienelement darin
       trifft ≥ 44 × 44 (320 / 390 / 430 / 820 / 1280 / 1440 / 1920,
       normal und kompakt); am Handy bleibt die untere Leiste frei.
    3. Vorschlag „Wie am Anfang": unten Chat · Aufgaben · Infos · Material
       · Putzplan, jeder Knopf ≥ 44 × 44 bei 320 px; ein Tipp auf „Putzplan"
       öffnet den Putzplan und markiert genau diesen Knopf; am Rechner
       steht links dieselbe Reihe. Nach dem Neuladen gilt alles noch und
       die App startet im Chat.
    4. (seit Runde 292 in test-baukasten: Ziehen, Antippen, Gruppen)
    5. „Ganz minimal": zwei Knöpfe, keine Formi-Kugel (auch nicht ihre
       Sprechblase), keine Schnellzugriffe. „Zurück zu vorher" stellt den Stand davor her,
       „Alles wie ausgeliefert" die ausgelieferte Leiste.
    6. Aussehen: „Hell" schaltet body.light, „Kompakt" die Dichte.
    7. Formi: „die app ist mir zu unübersichtlich" bringt drei Vorschläge
       (bei „zu kompliziert" den OG-Modus zuerst)
       und „Im Editor anpassen", ohne KI; „wann arbeite ich morgen" nicht.
       „Doch normal fragen" schickt den Satz an die KI weiter.
    8. OG-Modus bei 320 / 390 / 1440: drei Knöpfe, Start in den Aufgaben,
       Schrift 125 %, Kopf „Aufgaben", keine Reiter/Filter/Drucken/Suche/Formi/
       Ziehgriffe/Schnellzugriffe/„+ Neu",
       jeder Haken ≥ 44 × 44; Abhaken geht; „App gestalten" bleibt über ☰.
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
async function oeffne(b, w, h, ctxAlt) {
  const ctx = ctxAlt || await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  if (!ctxAlt) {
    await ctx.addInitScript(() => { try { localStorage.setItem('kf_tour', '1:testuid'); localStorage.setItem('kf_formi_gruss', new Date().toDateString()); } catch (e) {} });
    await ctx.addInitScript({ path: SP + '/stub-mitarbeiter.js' });
  }
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(900);
  p._ctx = ctx;
  return p;
}
const editor = async (p) => {
  await p.click('#bereichKopf'); await p.waitForTimeout(350);
  await p.evaluate(() => [...document.querySelectorAll('#allesLade [data-al-aufbau]')].find(e => e.getClientRects().length).click());
  await p.waitForTimeout(300);
};
const leiste = (p, sel) => p.evaluate((sel) => [...document.querySelectorAll(sel)].filter(e => e.getClientRects().length).map(e => e.textContent.trim()), sel);
/* Seit Runde 292 ist alles im Editor ein Entwurf; erst „Übernehmen"
   ändert die App (aus dem Betrieb, 26.10.2026: „… und erst danach
   bestäigt man es oder verwirft es wieder"). */
const uebernimm = async (p) => { await p.click('#abUebernehmen'); await p.waitForTimeout(500); };
const tippe = async (p, sel) => { await p.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'center' }), sel); await p.click(sel); await p.waitForTimeout(350); };

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1 Ohne eigenen Aufbau ──');
  {
    const p = await oeffne(b, 390, 844);
    const u = await leiste(p, '.mobnav .mn-reihe [data-group]');
    pruefe('Leiste wie ausgeliefert: ' + u.join(' · '), JSON.stringify(u) === JSON.stringify(['Heute', 'Zeiten', 'Schichtplan', 'Nachrichten']), JSON.stringify(u));
    await p._ctx.close();
  }

  console.log('\n── 2 Die Tafel ──');
  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h);
    await editor(p);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.waitForTimeout(150);
      const m = await p.evaluate((SRC) => {
        const T = eval('(' + SRC + ')');
        const t = document.getElementById('aufbauTafel');
        const k = [...t.querySelectorAll('button')].filter(e => e.getClientRects().length && !e.disabled);
        const klein = [];
        k.forEach(e => { e.scrollIntoView({ block: 'center' }); const r = T(e); if (r.w < 44 || r.h < 44) klein.push(e.textContent.trim().slice(0, 18) + ' ' + r.w + '×' + r.h); });
        /* Runde 292: ein ganzer Bildschirm (der Entwurf ist nicht die App). */
        const tr = t.getBoundingClientRect();
        return { offen: !t.hidden, n: k.length, klein, voll: tr.top <= 0 && tr.bottom >= innerHeight - 1, quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      pruefe(w + ' px ' + dichte + ': Editor offen über den ganzen Bildschirm, ' + m.n + ' Knöpfe, jeder ≥ 44 × 44, kein Querlauf', m.offen && m.n > 30 && !m.klein.length && m.voll && m.quer <= 0, JSON.stringify(m));
    }
    await p._ctx.close();
  }

  console.log('\n── 3 „Wie am Anfang" ──');
  {
    const p = await oeffne(b, 320, 568);
    await editor(p);
    await tippe(p, '#aufbauTafel [data-abvor="anfang"]');
    const vorher = await leiste(p, '.mobnav .mn-reihe [data-group]');
    pruefe('nur im Entwurf: die App behält ihre Leiste, bis „Übernehmen"', JSON.stringify(vorher) === JSON.stringify(['Heute', 'Zeiten', 'Schichtplan', 'Nachrichten']), JSON.stringify(vorher));
    await uebernimm(p);
    const u = await leiste(p, '.mobnav .mn-reihe [data-group]');
    pruefe('nach „Übernehmen" unten: ' + u.join(' · '), JSON.stringify(u) === JSON.stringify(['Chat', 'Aufgaben', 'Infos', 'Material', 'Putzplan']), JSON.stringify(u));
    const t = await p.evaluate((SRC) => { const T = eval('(' + SRC + ')'); return [...document.querySelectorAll('.mobnav .mn-reihe [data-group]')].map(e => [e.textContent.trim(), T(e)]); }, TREFFER.toString());
    pruefe('320 px: jeder der fünf Knöpfe ≥ 44 × 44', t.length === 5 && t.every(x => x[1].w >= 44 && x[1].h >= 44), JSON.stringify(t));
    await p.click('.mobnav [data-group="v-putzplan"]'); await p.waitForTimeout(600);
    const a = await p.evaluate(() => ({ ansicht: (document.querySelector('.view.show') || {}).id, aktiv: [...document.querySelectorAll('.mobnav .mn-reihe .active')].map(e => e.dataset.group) }));
    pruefe('„Putzplan" öffnet den Putzplan und ist der aktive Knopf', a.ansicht === 'view-putzplan' && JSON.stringify(a.aktiv) === '["v-putzplan"]', JSON.stringify(a));
    const ctx = p._ctx; await p.close();
    const q = await oeffne(b, 320, 568, ctx);
    const n = await q.evaluate(() => ({ ansicht: (document.querySelector('.view.show') || {}).id, u: [...document.querySelectorAll('.mobnav .mn-reihe [data-group]')].map(e => e.textContent.trim()) }));
    pruefe('nach dem Neuladen: dieselbe Leiste, Start im Chat', JSON.stringify(n.u) === JSON.stringify(['Chat', 'Aufgaben', 'Infos', 'Material', 'Putzplan']) && n.ansicht === 'view-chat', JSON.stringify(n));
    const r = q;
    pruefe('ohne Skriptfehler', !p._fehler.length && !q._fehler.length && !r._fehler.length, p._fehler.concat(q._fehler, r._fehler).join(' | '));
    await ctx.close();
    const pc = await oeffne(b, 1440, 900);
    await editor(pc);
    await tippe(pc, '#aufbauTafel [data-abvor="anfang"]');
    await uebernimm(pc);
    const s = await leiste(pc, '#side > [data-group]');
    pruefe('am Rechner links dieselbe Reihe: ' + s.join(' · '), JSON.stringify(s) === JSON.stringify(['Chat', 'Aufgaben', 'Infos', 'Material', 'Putzplan']), JSON.stringify(s));
    await pc._ctx.close();
  }

  /* Abschnitt 4 (Plus/Minus/Pfeile) steht seit Runde 292 in test-baukasten:
     dort wird gezogen, angetippt und erst dann übernommen. */

  console.log('\n── 5 Ganz minimal, zurück, ausgeliefert ──');
  {
    const p = await oeffne(b, 390, 844);
    await editor(p);
    await tippe(p, '#aufbauTafel [data-abvor="minimal"]');
    await uebernimm(p);
    await p.click('.mobnav [data-group="v-todos"]'); await p.waitForTimeout(500);
    const m = await p.evaluate(() => ({ u: [...document.querySelectorAll('.mobnav .mn-reihe [data-group]')].map(e => e.textContent.trim()),
      kugel: !!document.getElementById('formiKugel').getClientRects().length && !document.getElementById('formiKugel').hidden,
      schnell: [...document.querySelectorAll('.schnell, .side-schnell')].some(e => e.getClientRects().length),
      blase: (() => { const x = document.getElementById('formiBlase'); x.hidden = false; x.textContent = 'Probe'; const da = !!x.getClientRects().length; x.hidden = true; return da; })() }));
    pruefe('zwei Knöpfe (' + m.u.join(' · ') + '), keine Kugel, keine Sprechblase, keine Schnellzugriffe', JSON.stringify(m.u) === JSON.stringify(['Aufgaben', 'Chat']) && !m.kugel && !m.blase && !m.schnell, JSON.stringify(m));
    await editor(p);
    await tippe(p, '#aufbauTafel [data-abzurueck]');
    let u = await leiste(p, '.mobnav .mn-reihe [data-group]');
    pruefe('„Zurück zum letzten Stand": die Leiste davor (' + u.join(' · ') + ')', JSON.stringify(u) === JSON.stringify(['Heute', 'Zeiten', 'Schichtplan', 'Nachrichten']), JSON.stringify(u));
    await editor(p);
    await tippe(p, '#aufbauTafel [data-abvor="anfang"]');
    await uebernimm(p);
    await editor(p);
    await tippe(p, '#aufbauTafel [data-abvor="standard"]');
    await uebernimm(p);
    u = await leiste(p, '.mobnav .mn-reihe [data-group]');
    pruefe('„Alles wie ausgeliefert": die ausgelieferte Leiste (' + u.join(' · ') + ')', JSON.stringify(u) === JSON.stringify(['Heute', 'Zeiten', 'Schichtplan', 'Nachrichten']), JSON.stringify(u));

    console.log('\n── 6 Aussehen ──');
    await editor(p);
    await tippe(p, '#aufbauTafel [data-abpref="theme|light"]');
    await tippe(p, '#aufbauTafel [data-abpref="dichte|kompakt"]');
    const e = await p.evaluate(() => ({ hell: document.body.classList.contains('light'), dichte: document.body.getAttribute('data-dichte') }));
    pruefe('im Entwurf ändert sich die App noch nicht', !e.hell && e.dichte !== 'kompakt', JSON.stringify(e));
    await uebernimm(p);
    const a = await p.evaluate(() => ({ hell: document.body.classList.contains('light'), dichte: document.body.getAttribute('data-dichte') }));
    pruefe('nach „Übernehmen" greifen „Hell" und „Kompakt"', a.hell && a.dichte === 'kompakt', JSON.stringify(a));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── 7 Formi schlägt vor ──');
  {
    const p = await oeffne(b, 390, 844);
    /* Was an die KI ginge, fängt die Attrappe ab (window.__antwort): hier wird nur gezählt. */
    await p.evaluate(() => { window.__ki = 0; window.__antwort = window.__antwort || {}; window.__antwort.gehirnAktion = () => { window.__ki++; return Promise.resolve({ data: { art: 'frage', antwort: 'Morgen 9 bis 14 Uhr.' } }); }; });
    await p.click('#formiKugel'); await p.waitForTimeout(1200);
    const frag = async (text) => {
      await p.fill('#jarvisFeld', text); await p.click('#jarvisSenden'); await p.waitForTimeout(900);
      return p.evaluate(() => {
        const a = [...document.querySelectorAll('#jarvisVerlauf .gehirn-antwort')].pop();
        return { vor: a ? [...a.querySelectorAll('[data-gdesign]')].map(e => e.getAttribute('data-gdesign')) : [], editor: !!(a && a.querySelector('[data-geditor]')), ki: window.__ki };
      });
    };
    const d = await frag('die app ist mir zu unübersichtlich');
    pruefe('Design-Wunsch: drei Vorschläge und „Im Editor anpassen", ohne KI', JSON.stringify(d.vor) === '["anfang","schlicht","og"]' && d.editor && d.ki === 0, JSON.stringify(d));
    const k = await frag('das ist mir alles zu kompliziert');
    pruefe('„zu kompliziert": der OG-Modus zuerst', k.vor[0] === 'og', JSON.stringify(k));
    const n = await frag('wann arbeite ich morgen');
    pruefe('normale Frage: keine Vorschläge', !n.vor.length, JSON.stringify(n));
    await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf [data-geditor]')][0].click()); await p.waitForTimeout(400);
    pruefe('„Im Editor anpassen" öffnet die Tafel', await p.evaluate(() => !document.getElementById('aufbauTafel').hidden));
    await p.click('#abVerwerfen'); await p.waitForTimeout(300);
    const vorher = await p.evaluate(() => window.__ki);
    await p.click('#formiKugel'); await p.waitForTimeout(1200);
    await p.evaluate(() => [...document.querySelectorAll('#jarvisVerlauf [data-gnormal]')][0].click()); await p.waitForTimeout(900);
    pruefe('„Doch normal fragen" geht an die KI', await p.evaluate(() => window.__ki) > vorher);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── 8 OG-Modus ──');
  /* Aus dem Betrieb, 26.10.2026: „so eine Art ‚OG' Modus … für Leute die
     null Verständnis für irgendwas haben … so simpel und leicht wie
     möglich". */
  for (const [w, h] of [[320, 568], [390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h);
    await editor(p);
    await tippe(p, '#aufbauTafel [data-abvor="og"]');
    await uebernimm(p);
    const m = await p.evaluate((SRC) => {
      const T = eval('(' + SRC + ')');
      const sicht = (sel) => [...document.querySelectorAll(sel)].some(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
      const leiste = [...document.querySelectorAll(innerWidth <= 820 ? '.mobnav .mn-reihe [data-group]' : '#side > [data-group]')].filter(e => e.getClientRects().length);
      const haken = [...document.querySelectorAll('#view-todos .check')].filter(e => e.getClientRects().length);
      return { ansicht: (document.querySelector('.view.show') || {}).id, leiste: leiste.map(e => e.textContent.trim()),
        knoepfe: leiste.map(e => T(e)), schrift: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fs')),
        weg: ['#subnavZeile', '.pp-filter-knopf', '#tdPrint', '.pp-wer-knopf', '#searchBtn', '#formiKugel', '.swipe-body .griff', '.side-schnell', '.schnell', '.kopf-plus', '.side-fuss'].filter(sicht),
        titel: (document.getElementById('bkTitel') || {}).textContent,
        haken: haken.map(e => { e.scrollIntoView({ block: 'center' }); return T(e); }), quer: document.documentElement.scrollWidth - innerWidth };
    }, TREFFER.toString());
    pruefe(w + ' px: drei Knöpfe ' + m.leiste.join(' · ') + ', Start in den Aufgaben, Kopf „' + m.titel + '"', JSON.stringify(m.leiste) === JSON.stringify(['Aufgaben', 'Putzplan', 'Chat']) && m.ansicht === 'view-todos' && m.titel === 'Aufgaben', JSON.stringify(m));
    pruefe(w + ' px: jeder Knopf ≥ 44 × 44, Schrift 125 %', m.knoepfe.every(x => x.w >= 44 && x.h >= 44) && m.schrift === 125, JSON.stringify(m.knoepfe) + ' ' + m.schrift);
    pruefe(w + ' px: keine Reiter, kein Filter, kein Drucken, keine Suche, kein Formi, kein Ziehen, keine Schnellzugriffe, kein „+ Neu"', !m.weg.length, m.weg.join(', '));
    pruefe(w + ' px: jeder Haken ≥ 44 × 44, kein Querlauf', m.haken.length > 0 && m.haken.every(x => x.w >= 44 && x.h >= 44) && m.quer <= 0, JSON.stringify(m.haken) + ' quer ' + m.quer);
    if (w === 390) {
      await p.evaluate(() => [...document.querySelectorAll('#view-todos .check')].find(e => e.getClientRects().length).click()); await p.waitForTimeout(600);
      pruefe('Abhaken geht', await p.evaluate(() => (window.__schreib || []).some(x => /\/todos\//.test(x.pfad) && x.daten && x.daten.done === true)));
      await editor(p);
      pruefe('über ☰ bleibt „App gestalten" erreichbar', await p.evaluate(() => !document.getElementById('aufbauTafel').hidden));
    }
    pruefe(w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ App gestalten: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ App gestalten: Vorschläge, eigene Leiste, minimal, Aussehen, Formi schlägt vor — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
