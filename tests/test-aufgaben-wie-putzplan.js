/* ══ DIE AUFGABEN, AUFGEBAUT WIE DER PUTZPLAN (Runde 147) ════════════════
   Aus dem Betrieb, 9.10.2026: „kannst du es bitte machen das der
   aufgaben bereich vom aufbau und layout GENAU so wie der purtzplan
   aufgestellt ist das wäre für uns viel übersichtlicher".

   Die Antworten auf die Rückfragen:
     Gruppen      „1 und 3" — nach Fälligkeit (Standard), wahlweise nach
                  Tageszeit; innerhalb einer Gruppe das Jetzt zuerst
     Studio       „Ein Studio, Auswahl oben" — mit „Alle Studios" für
                  alle, die mehr als eins haben
     Detailfeld   „Weg, wie im Putzplan" — Stift und Papierkorb in der
                  Zeile, Foto, Grund, Frist und Danke hinter „…"
     Kopfzeile    „Wie Putzplan, Rest in ‚Filter'"

   Was dieser Durchlauf festhält:
     1. Die Leiste ist DIESELBE wie im Putzplan — Element für Element,
        Klasse für Klasse; Suche, Schnellfilter und Sortierung liegen
        unter „Filter", zu bis man es öffnet.
     2. Kein Detailfeld mehr, keine zwei Spalten Liste/Detail.
     3. Gruppen nach Fälligkeit, in dieser Reihenfolge: Überfällig,
        Heute, Diese Woche, Später, Ohne Frist — mit „x von y" und
        Balken. Eine erledigte Aufgabe mit verpasster Frist steht unter
        „Heute", nicht unter „Überfällig".
     4. Innerhalb einer Gruppe: offene vor erledigten, dann was JETZT
        dran ist (Tageszeit).
     5. „Nach Tageszeit" gruppiert nach Tageszeit, „Nach Name" ist flach;
        eine alte gemerkte Wahl „Nach Fälligkeit" landet in den Gruppen.
     6. Studio oben: Wahl grenzt ein, „Alle Studios" zeigt das Studio an
        der Zeile, die Wahl übersteht das Neuladen.
     7. Am PC stehen die Gruppen als Spalten nebeneinander, am Handy
        untereinander — wie im Putzplan.
     8. Leitung: Stift und Papierkorb in der Zeile, und sie tun etwas.
        Mitarbeiter: keiner von beiden, „…" schon.
     9. „Wer hakt ab?": dasselbe Kürzel wie im Putzplan, und es landet
        beim Abhaken in doneKuerzel. Ohne Kürzel wird das Feld gar nicht
        geschrieben (die Regel davor kannte es nicht — siehe Übergang).
    10. Notizen: dieselbe Sammlung wie im Putzplan; bei „Alle Studios"
        ausgeblendet.
    11. Drucken legt einen Zettel mit den offenen Aufgaben an.
    12. Tastatur am PC: ↓ wählt, x hakt ab — ohne Detailfeld.
    13. Jedes Bedienelement trifft ≥ 44 × 44 (elementFromPoint) bei
        320 / 390 / 430 / 820 / 1280 / 1440 / 1920 px, normal und
        kompakt; nirgends waagerechtes Scrollen.
    GEGENPROBE (von Hand, 9.10.2026, gegen origin/main vor Runde 147 auf
    einem zweiten Server): der Durchlauf wird dort rot — es gibt keine
    Leiste #tdLeiste und keine Werkzeuge #tdWerkzeuge. Er kann also rot
    werden und ist nicht nur eine Bestätigung des neuen Stands.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
const TREFFER_SRC = `(el) => {
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
}`;

/* Die Daten: je eine Aufgabe für jede Gruppe, in Hürth (studio-6).
   Die Zeiten werden IM Browser gerechnet — dieselbe Uhr wie die App. */
const DATEN = `(() => {
  const jetzt = Date.now();
  const h = new Date(); h.setHours(0,0,0,0);
  const tag = 86400000;
  const ende = (n) => new Date(h.getFullYear(), h.getMonth(), h.getDate() + n, 23, 59, 59, 999).getTime();
  const bisMontag = ((8 - h.getDay()) % 7) || 7;
  /* „Diese Woche": morgen, wenn morgen noch in dieser Woche liegt.
     Am Sonntag gibt es kein „morgen in dieser Woche" — dann fehlt die
     Gruppe zu Recht, und der Durchlauf sagt das. */
  const morgenInWoche = bisMontag > 1;
  const jetztTz = new Date().getHours() < 12 ? 'morgens' : (new Date().getHours() < 17 ? 'mittags' : 'abends');
  const andereTz = jetztTz === 'morgens' ? 'abends' : 'morgens';
  const L = [
    { id: 'a-ueber',   title: 'Über die Frist',       done: false, ts: 1, due: ende(-2) },
    { id: 'a-heute',   title: 'Heute fällig',          done: false, ts: 2, due: ende(0) },
    { id: 'a-taegl',   title: 'Täglich ohne Frist',    done: false, ts: 3, recurring: 'daily' },
    { id: 'a-erl',     title: 'Erledigt, Frist vorbei', done: true, ts: 4, due: ende(-1),
      doneBy: 'Anna Meier', doneByUid: 'u2', doneAt: jetzt - 3600000, doneKuerzel: 'AM' },
    { id: 'a-spaet',   title: 'In zwei Wochen',        done: false, ts: 6, due: ende(14) },
    { id: 'a-ohne-a',  title: 'Ohne Frist, andere Zeit', done: false, ts: 7, tageszeit: andereTz },
    { id: 'a-ohne-j',  title: 'Ohne Frist, jetzt dran',  done: false, ts: 8, tageszeit: jetztTz },
    { id: 'a-ohne-e',  title: 'Ohne Frist, erledigt',    done: true, ts: 5, doneBy: 'Ben', doneByUid: 'u3', doneAt: jetzt - 600000 }
  ];
  if (morgenInWoche) L.push({ id: 'a-woche', title: 'Morgen fällig', done: false, ts: 9, due: ende(1) });
  return { L, morgenInWoche };
})()`;

async function oeffnen(b, w, h, mitDaten, vorher) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  p.on('dialog', d => d.accept());
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  if (mitDaten) await p.addInitScript(`(() => { const d = ${DATEN}; window.__todos = { 'studio-6': d.L, 'studio-7': [
      { id: 'b-1', title: 'Brühl: Theke', done: false, ts: 1 } ] }; window.__morgenInWoche = d.morgenInWoche;
      window.print = () => { window.__gedruckt = (window.__gedruckt || 0) + 1; }; })()`);
  if (vorher) await p.addInitScript(vorher);
  await p.addInitScript({ path: SP + '/stub-chef.js' });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2800);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  return p;
}
async function zuDenAufgaben(p) {
  /* Wie test-all: über die Gruppe „Arbeit", dann den Reiter. Ein
     Knopf, auf dem nur „Aufgaben" steht, kann auch „Meine Aufgaben"
     sein. */
  await p.evaluate(() => { const g = document.querySelector('.mobnav [data-group="g-arbeit"]'); if (g) g.click(); });
  await p.waitForTimeout(450);
  await p.evaluate(() => { const s = document.querySelector('[data-subview="todos"]'); if (s) s.click(); });
  await p.waitForTimeout(600);
  if (!(await p.evaluate(() => document.getElementById('view-todos').classList.contains('show'))))
    throw new Error('Die Aufgabenseite ist nicht offen.');
}
async function studio(p, sk) {
  await p.selectOption('#todoStudioWahl', sk);
  await p.waitForTimeout(450);
}
const GRUPPEN = () => [...document.querySelectorAll('#todoArea .pp-gruppe')].map(g => ({
  kopf: g.querySelector('h4').textContent,
  zahl: g.querySelector('.pg-zahl').textContent,
  ids: [...g.querySelectorAll('.todo')].map(t => t.dataset.id),
  top: Math.round(g.getBoundingClientRect().top),
  left: Math.round(g.getBoundingClientRect().left)
}));

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    /* ══ 1–2. Leiste und Aufbau ══ */
    console.log('\n── 1–2. Die Leiste ist die des Putzplans ──');
    let p = await oeffnen(b, 1440, 900, true);
    if (!(await p.evaluate(() => !!document.querySelector('#app.show')))) throw new Error('App nicht gestartet: ' + p._fehler.join(' | '));
    await zuDenAufgaben(p);
    const bau = await p.evaluate(() => {
      const form = (id) => {
        const e = document.getElementById(id);
        /* Zustände (leer, on) zählen nicht zum Aufbau. */
        return e ? [...e.children].map(c => c.tagName + '.' + [...c.classList].filter(k => k !== 'leer' && k !== 'on').sort().join('.')) : null;
      };
      return {
        td: form('tdLeiste'), pp: form('ppLeiste'),
        werkzeugeZu: document.getElementById('tdWerkzeuge').hidden,
        werZu: document.getElementById('tdWerZeile').hidden,
        detail: !!document.getElementById('todoDetail'),
        spalten: !!document.querySelector('.todo-spalten'),
        sucheDrin: !!document.querySelector('#tdWerkzeuge #todoSearch'),
        filterDrin: document.querySelectorAll('#tdWerkzeuge [data-tfilter]').length,
        sortDrin: !!document.querySelector('#tdWerkzeuge #todoSort'),
        notizen: !!document.querySelector('#view-todos [data-fold="tdnotes"]')
      };
    });
    pruefe('Leiste: dieselben Elemente mit denselben Klassen wie im Putzplan',
      !!bau.td && JSON.stringify(bau.td) === JSON.stringify(bau.pp), JSON.stringify(bau.td) + ' ≠ ' + JSON.stringify(bau.pp));
    pruefe('Suche, vier Schnellfilter und Sortierung liegen unter „Filter"',
      bau.sucheDrin && bau.filterDrin === 4 && bau.sortDrin, JSON.stringify(bau));
    pruefe('„Filter" und „Wer hakt ab?" sind zu, bis man sie öffnet', bau.werkzeugeZu && bau.werZu);
    pruefe('Kein Detailfeld und keine Spalten Liste/Detail mehr', !bau.detail && !bau.spalten);
    pruefe('Notizen-Karte wie im Putzplan', bau.notizen);
    /* Auch die HÖHE der Leiste: beim ersten Anlauf brach sie bei 430 px
       wegen eines längeren Fortschrittstextes in drei Reihen. */
    for (const [w, h] of [[430, 932], [390, 844], [1440, 900]]) {
      await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(250);
      await zuDenAufgaben(p);
      const tdH = await p.evaluate(() => Math.round(document.getElementById('tdLeiste').getBoundingClientRect().height));
      await p.evaluate(() => { const s = document.querySelector('[data-subview="putzplan"]'); if (s) s.click(); });
      await p.waitForTimeout(600);
      const ppH = await p.evaluate(() => Math.round(document.getElementById('ppLeiste').getBoundingClientRect().height));
      pruefe(w + ' px: die Leiste ist so hoch wie im Putzplan (' + tdH + ' / ' + ppH + ' px)', tdH > 0 && Math.abs(tdH - ppH) <= 2);
    }
    await p.setViewportSize({ width: 1440, height: 900 }); await p.waitForTimeout(250);
    await zuDenAufgaben(p);
    await p.click('#tdFilterKnopf'); await p.waitForTimeout(200);
    pruefe('„Filter" klappt die Werkzeuge auf',
      await p.evaluate(() => !document.getElementById('tdWerkzeuge').hidden &&
        document.getElementById('tdFilterKnopf').getAttribute('aria-expanded') === 'true'));
    await p.click('#tdFilterKnopf'); await p.waitForTimeout(150);

    /* ══ 3–4. Gruppen nach Fälligkeit ══ */
    console.log('\n── 3–4. Gruppen nach Fälligkeit ──');
    await studio(p, 'studio-6');
    const g = await p.evaluate(GRUPPEN);
    const woche = await p.evaluate(() => window.__morgenInWoche);
    const SOLL = ['Überfällig', 'Heute'].concat(woche ? ['Diese Woche'] : []).concat(['Später', 'Ohne Frist']);
    pruefe('Gruppen in dieser Reihenfolge: ' + SOLL.join(', '),
      JSON.stringify(g.map(x => x.kopf)) === JSON.stringify(SOLL), JSON.stringify(g.map(x => x.kopf)));
    if (!woche) console.log('  · heute ist Sonntag — „Diese Woche" fehlt zu Recht, geprüft wird ohne sie');
    const in_ = (kopf) => (g.find(x => x.kopf === kopf) || { ids: [] }).ids;
    pruefe('Überfällig: nur die offene mit verpasster Frist', JSON.stringify(in_('Überfällig')) === '["a-ueber"]', JSON.stringify(in_('Überfällig')));
    pruefe('Heute: heute fällig, täglich — und die ERLEDIGTE mit verpasster Frist',
      ['a-heute', 'a-taegl', 'a-erl'].every(i => in_('Heute').includes(i)) && in_('Heute').length === 3, JSON.stringify(in_('Heute')));
    if (woche) pruefe('Diese Woche: morgen fällig', JSON.stringify(in_('Diese Woche')) === '["a-woche"]', JSON.stringify(in_('Diese Woche')));
    pruefe('Später: in zwei Wochen', JSON.stringify(in_('Später')) === '["a-spaet"]', JSON.stringify(in_('Später')));
    pruefe('Ohne Frist: erst was JETZT dran ist, dann andere Tageszeit, erledigte zuletzt',
      JSON.stringify(in_('Ohne Frist')) === '["a-ohne-j","a-ohne-a","a-ohne-e"]', JSON.stringify(in_('Ohne Frist')));
    pruefe('Heute: erledigte unter den offenen', in_('Heute')[2] === 'a-erl', JSON.stringify(in_('Heute')));
    const zahlen = Object.fromEntries(g.map(x => [x.kopf, x.zahl]));
    pruefe('Gruppenkopf zählt: „1 von 3" (Heute), „1 offen" (Überfällig), „1 von 3" (Ohne Frist)',
      zahlen['Heute'] === '1 von 3' && zahlen['Überfällig'] === '1 offen' && zahlen['Ohne Frist'] === '1 von 3', JSON.stringify(zahlen));
    const fort = await p.evaluate(() => ({ t: document.getElementById('tdProgress').textContent,
      w: document.getElementById('tdFortBalken').style.width }));
    const n = woche ? 9 : 8;
    /* Derselbe Satz wie im Putzplan, OHNE „· 1 überfällig": mit dem
       Zusatz brach die Leiste bei 430 px in eine dritte Reihe (154 statt
       102 px hoch, test-rahmen). Die Zahl steht ohnehin am Gruppenkopf
       „Überfällig" und in der Studio-Auswahl. */
    pruefe('Fortschritt über alle: „2 von ' + n + ' erledigt", Balken gesetzt',
      fort.t === '2 von ' + n + ' erledigt' && fort.w === Math.round(2 / n * 100) + '%', JSON.stringify(fort));
    const zeile = await p.evaluate(() => {
      const e = document.querySelector('[data-id="a-erl"] .pp-meta');
      const o = document.querySelector('[data-id="a-heute"] .pp-meta');
      return { e: e && e.textContent, o: o && o.textContent };
    });
    pruefe('Erledigt: „✓ Kürzel (Konto) · Zeit" — wie im Putzplan', /^✓ AM \(Anna Meier\) · /.test(zeile.e || ''), zeile.e);
    pruefe('Offen: „noch offen"', /noch offen/.test(zeile.o || ''), zeile.o);

    /* ══ 7. Spalten am PC ══ */
    const tops = g.map(x => x.top), lefts = g.map(x => x.left);
    pruefe('Am PC (1440) stehen Gruppen nebeneinander (gleiche Höhe, verschiedene Spalte)',
      g.some((x, i) => g.some((y, j) => i !== j && x.top === y.top && x.left !== y.left)), JSON.stringify({ tops, lefts }));

    /* ══ 5. Andere Sortierungen ══ */
    console.log('\n── 5. Sortierungen ──');
    await p.click('#tdFilterKnopf'); await p.waitForTimeout(150);
    await p.selectOption('#todoSort', 'tageszeit'); await p.waitForTimeout(350);
    const tz = await p.evaluate(GRUPPEN);
    pruefe('„Nach Tageszeit": erste Gruppe „Jetzt · …", die Aufgabe von jetzt darin',
      tz.length && /^Jetzt · /.test(tz[0].kopf) && tz[0].ids.includes('a-ohne-j'), JSON.stringify(tz.map(x => x.kopf + ':' + x.ids.join(','))));
    await p.selectOption('#todoSort', 'name'); await p.waitForTimeout(350);
    const flach = await p.evaluate(() => ({ gr: document.querySelectorAll('#todoArea .pp-gruppe').length,
      ids: [...document.querySelectorAll('#todoArea .todo')].map(t => t.dataset.id),
      knopf: document.getElementById('tdFilterKnopf').textContent }));
    pruefe('„Nach Name": flache Liste, erledigte unten (wie im Putzplan)',
      flach.gr === 0 && flach.ids.slice(-2).sort().join() === 'a-erl,a-ohne-e', JSON.stringify(flach.ids));
    pruefe('Der Filterknopf zählt die abweichende Sortierung („Filter 1")', /Filter\s*1/.test(flach.knopf), flach.knopf);
    const opts = await p.evaluate(() => [...document.querySelectorAll('#todoSort option')].map(o => o.value));
    pruefe('„Nach Fälligkeit" ist keine eigene Wahl mehr — sie IST der Standard', !opts.includes('faellig') && opts[0] === 'standard', JSON.stringify(opts));
    await p.selectOption('#todoSort', 'standard'); await p.waitForTimeout(250);
    await p.click('#tdFilterKnopf'); await p.waitForTimeout(150);

    /* ══ 6. Studio oben ══ */
    console.log('\n── 6. Studio oben ──');
    const opt = await p.evaluate(() => [...document.querySelectorAll('#todoStudioWahl option')].map(o => o.value + '|' + o.textContent));
    pruefe('Auswahl: „Alle Studios" zuerst, dann die Studios', /^\|Alle Studios$/.test(opt[0]) && opt.length > 2, JSON.stringify(opt.slice(0, 4)));
    pruefe('Ein Studio mit Überfälligem sagt es in der Auswahl („Hürth · 1 überfällig")',
      opt.some(o => /^studio-6\|Hürth · 1 überfällig$/.test(o)), JSON.stringify(opt));
    const nurH = await p.evaluate(() => [...document.querySelectorAll('#todoArea .todo')].every(t => t.dataset.sid === 'studio-6'));
    pruefe('Ein Studio gewählt: nur dessen Aufgaben, ohne Studio-Marke an der Zeile',
      nurH && !(await p.evaluate(() => document.querySelector('#todoArea .t-studio'))));
    await studio(p, '');
    const alle = await p.evaluate(() => ({
      sids: [...new Set([...document.querySelectorAll('#todoArea .todo')].map(t => t.dataset.sid))].sort(),
      marke: (document.querySelector('#todoArea [data-id="b-1"] .t-studio') || {}).textContent,
      notiz: document.getElementById('tdNotesCard').hidden
    }));
    pruefe('„Alle Studios": Aufgaben aus beiden, die Zeile trägt ihr Studio', alle.sids.join() === 'studio-6,studio-7' && alle.marke === 'Brühl', JSON.stringify(alle));
    pruefe('… und die Notizen sind ausgeblendet (eine Notiz gehört zu einem Studio)', alle.notiz === true);
    await studio(p, 'studio-6');
    pruefe('Ein Studio: Notizen sichtbar', await p.evaluate(() => !document.getElementById('tdNotesCard').hidden));
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2800);
    await zuDenAufgaben(p);
    pruefe('Die Studio-Wahl übersteht das Neuladen', (await p.evaluate(() => document.getElementById('todoStudioWahl').value)) === 'studio-6');

    /* ══ 8. Stift und Papierkorb ══ */
    console.log('\n── 8. Handgriffe in der Zeile ──');
    const kn = await p.evaluate(() => [...document.querySelectorAll('#todoArea .todo')].map(t =>
      [!!t.querySelector('.t-edit'), !!t.querySelector('.t-del'), !!t.querySelector('.t-mehr')].join()));
    pruefe('Leitung: jede Zeile hat Stift, Papierkorb und „…"', kn.length && kn.every(x => x === 'true,true,true'), JSON.stringify(kn));
    const reihen = await p.evaluate(() => {
      const t = document.querySelector('[data-id="a-heute"]');
      return [...t.querySelector('.t-knoepfe').children].map(c => c.className);
    });
    pruefe('Reihenfolge wie im Putzplan: Stift vor Papierkorb', reihen[0] === 't-edit' && reihen[1] === 't-del', JSON.stringify(reihen));
    pruefe('Keine Klasse des Putzplans in der Aufgabenliste (.pp-item/.pp-del/.pp-edit wählen dort ohne #ppList aus)',
      await p.evaluate(() => !document.querySelector('#todoArea .pp-item, #todoArea .pp-del, #todoArea .pp-edit')));
    await p.click('[data-id="a-heute"] .t-edit'); await p.waitForTimeout(350);
    pruefe('Stift öffnet „Aufgabe bearbeiten"', await p.evaluate(() => document.getElementById('todoEditModal').classList.contains('show')));
    await p.evaluate(() => document.getElementById('todoEditModal').classList.remove('show'));
    await p.evaluate(() => { window.__schreib = []; });
    await p.click('[data-id="a-spaet"] .t-del'); await p.waitForTimeout(350);
    const weg = await p.evaluate(() => (window.__schreib || []).filter(x => x.art === 'delete').map(x => x.pfad));
    pruefe('Papierkorb löscht genau diese Aufgabe (nach Rückfrage)', weg.length === 1 && /studio-6\/todos\/a-spaet$/.test(weg[0]), JSON.stringify(weg));
    await p.click('[data-id="a-heute"] .t-mehr'); await p.waitForTimeout(350);
    const blatt = await p.evaluate(() => [...document.querySelectorAll('#tbActs [data-tba]')].map(x => x.getAttribute('data-tba')));
    pruefe('„…" enthält Foto, Bearbeiten, Frist und Löschen', ['foto', 'bearbeiten', 'plus1', 'loeschen'].every(x => blatt.includes(x)), JSON.stringify(blatt));
    await p.evaluate(() => document.getElementById('tbClose').click()); await p.waitForTimeout(200);

    /* ══ 9. Wer hakt ab? ══ */
    console.log('\n── 9. „Wer hakt ab?" ──');
    await p.evaluate(() => { window.__schreib = []; });
    await p.click('[data-id="a-ohne-a"] .check'); await p.waitForTimeout(350);
    let up = await p.evaluate(() => (window.__schreib || []).filter(x => x.art === 'update' && /a-ohne-a$/.test(x.pfad)).map(x => x.daten));
    pruefe('Ohne Kürzel: abgehakt, doneKuerzel wird gar nicht geschrieben', up.length === 1 && up[0].done === true && !('doneKuerzel' in up[0]), JSON.stringify(up));
    await p.click('#tdWerKnopf'); await p.waitForTimeout(200);
    await p.fill('#tdKuerzel', 'AB'); await p.waitForTimeout(150);
    await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    const wer = await p.evaluate(() => ({ knopf: document.getElementById('tdWerKnopf').textContent,
      putz: document.getElementById('ppKuerzel').value, zu: document.getElementById('tdWerZeile').hidden }));
    pruefe('Kürzel steht auf dem Knopf („Wer: AB") und im Putzplan-Feld — EINE Ablage', wer.knopf === 'Wer: AB' && wer.putz === 'AB' && wer.zu, JSON.stringify(wer));
    await p.evaluate(() => { window.__schreib = []; });
    await p.click('[data-id="a-ohne-j"] .check'); await p.waitForTimeout(350);
    up = await p.evaluate(() => (window.__schreib || []).filter(x => x.art === 'update' && /a-ohne-j$/.test(x.pfad)).map(x => x.daten));
    pruefe('Mit Kürzel: doneKuerzel „AB" wird mitgeschrieben', up.length === 1 && up[0].doneKuerzel === 'AB' && up[0].done === true, JSON.stringify(up));

    /* ══ 11. Drucken ══ */
    await p.click('#tdPrint'); await p.waitForTimeout(250);
    const druck = await p.evaluate(() => ({ n: window.__gedruckt || 0, h: (document.querySelector('#printArea h1') || {}).textContent,
      zeilen: document.querySelectorAll('#printArea tr').length }));
    pruefe('Drucken: Zettel „Aufgaben · Hürth" mit den offenen Aufgaben', druck.n === 1 && druck.h === 'Aufgaben · Hürth' && druck.zeilen > 3, JSON.stringify(druck));

    /* ══ 12. Tastatur ══ */
    console.log('\n── 12. Tastatur am PC ──');
    pruefe('Ohne Zutun ist nichts gewählt', !(await p.evaluate(() => document.querySelector('#todoArea .todo.gewaehlt'))));
    await p.evaluate(() => document.activeElement && document.activeElement.blur());
    await p.keyboard.press('ArrowDown'); await p.waitForTimeout(150);
    const gew = await p.evaluate(() => { const z = document.querySelector('#todoArea .todo.gewaehlt'); return z && z.dataset.id; });
    const erste = await p.evaluate(() => document.querySelector('#todoArea .todo').dataset.id);
    pruefe('↓ wählt die erste Zeile', gew && gew === erste, gew + ' / ' + erste);
    await p.evaluate(() => { window.__schreib = []; });
    await p.keyboard.press('x'); await p.waitForTimeout(350);
    up = await p.evaluate(() => (window.__schreib || []).filter(x => x.art === 'update').map(x => x.pfad));
    pruefe('x hakt die gewählte ab', up.length === 1 && up[0].endsWith('/' + gew), JSON.stringify(up));
    pruefe('Keine Fehler auf der Seite (Leitung)', !p._fehler.length, p._fehler.join(' | '));
    await p.close();

    /* ══ 7b. Handy: untereinander ══ */
    p = await oeffnen(b, 390, 844, true);
    await zuDenAufgaben(p); await studio(p, 'studio-6');
    const gh = await p.evaluate(GRUPPEN);
    pruefe('Am Handy (390) stehen die Gruppen untereinander', gh.length > 2 && gh.every((x, i) => i === 0 || x.top > gh[i - 1].top) && new Set(gh.map(x => x.left)).size === 1,
      JSON.stringify(gh.map(x => [x.top, x.left])));
    await p.close();

    /* ══ 5b. Alte gemerkte Wahl „faellig" ══ */
    p = await oeffnen(b, 1440, 900, true, `try{ localStorage.setItem('kf_prefs', JSON.stringify({ sort: { todo: 'faellig' } })); }catch(e){}`);
    await zuDenAufgaben(p); await studio(p, 'studio-6');
    pruefe('Gemerkte Wahl „Nach Fälligkeit" (von vorher) → die Gruppen', (await p.evaluate(GRUPPEN)).length > 2);
    await p.close();

    /* ══ 8b/13. Rollen in der Demo, und die Trefferflächen ══ */
    console.log('\n── 8b. Rollen (Demo) ──');
    for (const rolle of ['mitarbeiter', 'leiter']) {
      const q = await b.newPage({ viewport: { width: 1440, height: 900 } });
      q._fehler = [];
      q.on('pageerror', e => q._fehler.push(e.message.slice(0, 160)));
      await q.route('**://www.gstatic.com/**', r => r.abort());
      await q.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
      await q.waitForTimeout(3200);
      await q.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
      await zuDenAufgaben(q);
      const r = await q.evaluate(() => ({
        zeilen: document.querySelectorAll('#todoArea .todo').length,
        stift: document.querySelectorAll('#todoArea .t-edit').length,
        korb: document.querySelectorAll('#todoArea .t-del').length,
        mehr: document.querySelectorAll('#todoArea .t-mehr').length,
        optionen: [...document.querySelectorAll('#todoStudioWahl option')].map(o => o.textContent)
      }));
      if (rolle === 'mitarbeiter') {
        pruefe('Mitarbeiter: Aufgaben da, kein Stift, kein Papierkorb, „…" an jeder Zeile',
          r.zeilen > 0 && !r.stift && !r.korb && r.mehr === r.zeilen, JSON.stringify(r));
        pruefe('Mitarbeiter mit einem Studio: kein „Alle Studios"', !r.optionen.includes('Alle Studios'), JSON.stringify(r.optionen));
      } else {
        pruefe('Studioleitung: Stift und Papierkorb in ihren Studios', r.zeilen > 0 && r.stift === r.zeilen && r.korb === r.zeilen, JSON.stringify(r));
        pruefe('Studioleitung mehrerer Studios: „Alle Studios" wählbar', r.optionen[0] === 'Alle Studios', JSON.stringify(r.optionen));
      }
      pruefe('Keine Fehler auf der Seite (' + rolle + ')', !q._fehler.length, q._fehler.join(' | '));
      await q.close();
    }

    console.log('\n── 13. Trefferflächen und Breite ──');
    const zuKlein = [], quer = [];
    for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      const q = await oeffnen(b, w, h, true);
      await zuDenAufgaben(q); await studio(q, 'studio-6');
      for (const dichte of ['normal', 'kompakt']) {
        await q.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
        for (const auf of [false, true]) {
          if (auf) { await q.click('#tdFilterKnopf'); await q.click('#tdWerKnopf'); await q.waitForTimeout(200); }
          const m = await q.evaluate((SRC) => {
            const TREFFER = eval(SRC);
            const sa = document.querySelector('#view-todos .scroll-area');
            const els = [...document.querySelectorAll('#tdLeiste button, #tdLeiste select, #tdWerkzeuge button, #tdWerkzeuge select, #tdWerkzeuge input, #tdWerZeile input, ' +
              '#todoArea .todo .check, #todoArea .todo .t-edit, #todoArea .todo .t-del, #todoArea .todo .t-mehr, #todoArea .todo .t-nimm')]
              .filter(e => e.getClientRects().length);
            const aus = [];
            for (const e of els) {
              e.scrollIntoView({ block: 'center' });
              const r = e.getBoundingClientRect();
              if (r.bottom < 0 || r.top > innerHeight) continue;
              const t = TREFFER(e);
              if (t.w < 44 || t.h < 44) aus.push((e.id || e.className || e.tagName) + ' ' + t.w + '×' + t.h);
            }
            if (sa) sa.scrollTop = 0;
            return { aus, n: els.length, sw: document.documentElement.scrollWidth, iw: innerWidth };
          }, TREFFER_SRC);
          m.aus.forEach(x => zuKlein.push(w + '/' + dichte + (auf ? '/offen' : '') + ' ' + x));
          if (m.sw > m.iw) quer.push(w + '/' + dichte + ': ' + m.sw);
          if (auf) { await q.click('#tdFilterKnopf'); await q.click('#tdWerKnopf'); await q.waitForTimeout(150); }
        }
      }
      if (q._fehler.length) zuKlein.push(w + ' Seitenfehler: ' + q._fehler.join(' | '));
      await q.close();
    }
    pruefe('Jedes Bedienelement trifft ≥ 44 × 44 bei 320–1920 px, normal und kompakt, Werkzeuge zu und offen', !zuKlein.length, zuKlein.slice(0, 12).join(', '));
    pruefe('Kein waagerechtes Scrollen', !quer.length, quer.join(', '));
  } finally {
    await b.close();
  }
  console.log('\n' + (schlecht ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung' : '✓ Aufgaben wie der Putzplan — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
