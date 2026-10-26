/* ══ APP GESTALTEN: DER BAUKASTEN (Runde 292) ═════════════════════════
   Aus dem Betrieb, 26.10.2026: „es soll so ein menü mässig sein wo man
   drag and drop machen kann und wo man alles da hin packen kann wo man
   möchte und auch eigene gruppen erstellen kann … und erst danach
   bestäigt man es oder verwirft es wieder", dazu: „man soll gruppen aber
   auch bennen können und seine designs speichern können das man wechseln
   kann nach bedarf und das andere das auch sehen und nutzen können".

   Geprüft wird, als Mitarbeiter:
    1. Ziehen mit der Maus (1440 px): „Putzplan" aus den Bausteinen an
       den Anfang der Leiste. Die App bleibt, bis „Übernehmen"; danach
       steht links Putzplan zuerst. „Verwerfen" nach einer Änderung lässt
       die App, wie sie war.
    2. Eigene Gruppe: anlegen, „Mein Tag" nennen, Aufgaben und Stempeln
       hineinziehen, in die Leiste – nach „Übernehmen" ein Knopf „Mein
       Tag"; er öffnet die Aufgaben, der Kopf heisst „Mein Tag", die
       Reiter sind genau Aufgaben und Stempeln.
    3. Antippen statt Ziehen (390 px, Finger): ein Baustein öffnet sein
       Menü, „In die Leiste" nimmt ihn auf; jeder Menüpunkt ≥ 44 × 44.
       Ziehen mit dem Finger am Griff (echte Touch-Ereignisse) geht auch.
    4. Startseite: „Überfällig" ausblenden, „Putzplan" nach oben – nach
       „Übernehmen" ist Putzplan der erste Block, Überfällig fehlt.
    5. Mehr als fünf Knöpfe (390 px): unten vier und „Mehr"; „Mehr"
       zeigt den Rest und führt hin. Am Rechner stehen alle links.
    6. Designs: speichern, nach einer Änderung mit „Nutzen" zurück;
       „Teilen" schreibt genau uid, von, name, aufbau, prefs, ts nach
       designs; ein geteiltes Design vom Team lässt sich ausprobieren
       (Entwurf) und nutzen (sofort).
    7. Ein kaputtes Design vom Team (unbekannte Seiten, fremde Felder,
       überlange Namen) wird beim Laden bereinigt und bricht nichts.
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
const TEAM = [
  { id: 't1', uid: 'anna', von: 'Anna Meier', name: 'Empfang ruhig', ts: 2,
    aufbau: { leiste: ['v-todos', 'v-chat', 'v-putzplan'], start: 'home' }, prefs: { theme: 'light', dichte: 'kompakt' } },
  { id: 't2', uid: 'ben', von: 'Ben', name: 'X'.repeat(80), ts: 1, boese: '<img src=x onerror=alert(1)>',
    aufbau: { leiste: ['v-gibtsnicht', 'g-start', 42, 'v-chat'], gruppen: [{ id: 'kaputt!', name: '<b>' + 'Y'.repeat(60), ikon: 'feuer', seiten: ['todos', 'nix', 'todos'] }],
      heute: [{ k: 'boese' }, { k: 'putz', an: false }], start: 'nirgends' }, prefs: { theme: 'pink', fs: '999', accent: 'violett' } }
];
async function oeffne(b, w, h, ctxAlt) {
  const ctx = ctxAlt || await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  p.on('dialog', d => d.accept());
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  if (!ctxAlt) {
    await ctx.addInitScript((T) => { try { localStorage.setItem('kf_tour', '1:testuid'); localStorage.setItem('kf_formi_gruss', new Date().toDateString()); } catch (e) {} window.__designs = T; }, TEAM);
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
  await p.waitForTimeout(400);
};
const leiste = (p, sel) => p.evaluate((sel) => [...document.querySelectorAll(sel)].filter(e => e.getClientRects().length).map(e => e.textContent.trim()), sel);
const entwurfLeiste = (p) => p.evaluate(() => [...document.querySelectorAll('#abInhalt .ab-leiste [data-abzieh]')].map(e => e.textContent.trim()));
/* Ziehen wie mit der Maus: drücken, in Schritten bewegen, loslassen. */
async function ziehe(p, von, nach, links) {
  const a = await p.evaluate((s) => { const e = document.querySelector(s); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, von);
  const z = await p.evaluate(([s, l]) => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { x: l ? r.left + 4 : r.left + r.width / 2, y: r.top + r.height / 2 }; }, [nach, !!links]);
  await p.mouse.move(a.x, a.y); await p.mouse.down();
  for (let i = 1; i <= 12; i++) { await p.mouse.move(a.x + (z.x - a.x) * i / 12, a.y + (z.y - a.y) * i / 12); await p.waitForTimeout(16); }
  await p.mouse.up(); await p.waitForTimeout(350);
}
const tippe = async (p, sel) => { await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await p.click(sel); await p.waitForTimeout(300); };
const menue = async (p, text) => {
  await p.evaluate((t) => [...document.querySelectorAll('#abMenue [data-abwahl]')].find(b => b.textContent.trim().indexOf(t) === 0).click(), text);
  await p.waitForTimeout(300);
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1 Ziehen, Entwurf, Übernehmen, Verwerfen ──');
  {
    const p = await oeffne(b, 1440, 900);
    await editor(p);
    await ziehe(p, '#abInhalt [data-abzieh="neu:v-putzplan"]', '#abInhalt [data-abzieh="leiste:0"]', true);
    const e = await entwurfLeiste(p);
    pruefe('gezogen: im Entwurf steht Putzplan vorn (' + e.join(' · ') + ')', e[0] === 'Putzplan' && e.length === 5, JSON.stringify(e));
    const vorher = await leiste(p, '#side > [data-group]');
    pruefe('die App selbst bleibt, wie sie war', vorher[0] === 'Heute' && vorher.indexOf('Putzplan') < 0, JSON.stringify(vorher));
    pruefe('„Übernehmen" ist jetzt frei', await p.evaluate(() => !document.getElementById('abUebernehmen').disabled));
    await p.click('#abUebernehmen'); await p.waitForTimeout(500);
    const nach = await leiste(p, '#side > [data-group]');
    pruefe('nach „Übernehmen" links: ' + nach.join(' · '), nach[0] === 'Putzplan' && nach.length === 5, JSON.stringify(nach));
    await editor(p);
    await ziehe(p, '#abInhalt [data-abzieh="leiste:0"]', '#abInhalt .ab-vorrat');
    pruefe('zurück in die Bausteine gezogen: raus aus der Leiste', (await entwurfLeiste(p)).indexOf('Putzplan') < 0, JSON.stringify(await entwurfLeiste(p)));
    await p.click('#abVerwerfen'); await p.waitForTimeout(400);
    const ver = await leiste(p, '#side > [data-group]');
    pruefe('„Verwerfen": die App behält Putzplan vorn', ver[0] === 'Putzplan', JSON.stringify(ver));

    console.log('\n── 2 Eigene Gruppe ──');
    await editor(p);
    await tippe(p, '#abInhalt [data-abgneu]');
    const gid = await p.evaluate(() => document.querySelector('#abInhalt [data-abname]').getAttribute('data-abname'));
    await p.fill('#abInhalt [data-abname="' + gid + '"]', 'Mein Tag');
    await p.press('#abInhalt [data-abname="' + gid + '"]', 'Tab'); await p.waitForTimeout(300);
    await ziehe(p, '#abInhalt [data-abzieh="neu:v-todos"]', '#abInhalt [data-abziel="gruppe:' + gid + '"]');
    await ziehe(p, '#abInhalt [data-abzieh="neu:v-zeit"]', '#abInhalt [data-abziel="gruppe:' + gid + '"]');
    const g = await p.evaluate((gid) => [...document.querySelectorAll('#abInhalt [data-abziel="gruppe:' + gid + '"] [data-abzieh]')].map(e => e.textContent.trim()), gid);
    pruefe('in der Gruppe: ' + g.join(' · '), JSON.stringify(g) === JSON.stringify(['Aufgaben', 'Stempeln']), JSON.stringify(g));
    await tippe(p, '#abInhalt [data-abgrein="' + gid + '"]');
    await p.click('#abUebernehmen'); await p.waitForTimeout(500);
    const s = await leiste(p, '#side > [data-group]');
    pruefe('links steht „Mein Tag" (' + s.join(' · ') + ')', s.indexOf('Mein Tag') >= 0, JSON.stringify(s));
    await p.click('#side [data-group="' + gid + '"]'); await p.waitForTimeout(600);
    const k = await p.evaluate(() => ({ ansicht: (document.querySelector('.view.show') || {}).id, titel: (document.getElementById('bkTitel') || {}).textContent,
      reiter: [...document.querySelectorAll('#subnav [data-subview]')].filter(e => e.getClientRects().length).map(e => e.textContent.trim()),
      aktiv: [...document.querySelectorAll('#side .active')].map(e => e.dataset.group) }));
    pruefe('„Mein Tag" öffnet Aufgaben, Kopf „Mein Tag", aktiv, Reiter: ' + k.reiter.join(' · '),
      k.ansicht === 'view-todos' && k.titel === 'Mein Tag' && k.reiter.length === 2 && /Aufgaben/.test(k.reiter[0]) && JSON.stringify(k.aktiv) === JSON.stringify([gid]), JSON.stringify(k));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── 3 Antippen statt Ziehen (Finger) ──');
  {
    const p = await oeffne(b, 390, 844);
    await editor(p);
    await tippe(p, '#abInhalt [data-abzieh="neu:v-putzplan"]');
    const m = await p.evaluate((SRC) => { const T = eval('(' + SRC + ')'); return [...document.querySelectorAll('#abMenue button')].map(e => [e.textContent.trim(), T(e)]); }, TREFFER.toString());
    pruefe('das Menü steht da, jeder Punkt ≥ 44 × 44 (' + m.map(x => x[0]).join(', ') + ')', m.length >= 2 && m.every(x => x[1].w >= 44 && x[1].h >= 44), JSON.stringify(m));
    await menue(p, 'In die Leiste');
    const e = await entwurfLeiste(p);
    pruefe('„In die Leiste": hinten dazu (' + e.join(' · ') + ')', e[e.length - 1] === 'Putzplan', JSON.stringify(e));
    await tippe(p, '#abInhalt [data-abzieh="leiste:' + (e.length - 1) + '"]');
    await menue(p, 'Nach vorn');
    const e2 = await entwurfLeiste(p);
    pruefe('„Nach vorn": eins nach vorn (' + e2.join(' · ') + ')', e2[e2.length - 2] === 'Putzplan', JSON.stringify(e2));

    /* Ziehen mit dem Finger am Griff: echte Touch-Ereignisse (CDP). */
    await tippe(p, '#abVerwerfen');
    await editor(p);
    const cdp = await p._ctx.newCDPSession(p);
    const pos = await p.evaluate(() => { const g = document.querySelector('#abInhalt [data-abzieh="leiste:3"] .ab-griff'); g.scrollIntoView({ block: 'center' }); const r = g.getBoundingClientRect(); const z = document.querySelector('#abInhalt [data-abzieh="leiste:0"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, zx: z.left + 4, zy: z.top + z.height / 2 }; });
    const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    await tp('touchStart', pos.x, pos.y);
    for (let i = 1; i <= 12; i++) { await tp('touchMove', pos.x + (pos.zx - pos.x) * i / 12, pos.y + (pos.zy - pos.y) * i / 12); await p.waitForTimeout(20); }
    await tp('touchEnd'); await p.waitForTimeout(400);
    const f = await entwurfLeiste(p);
    pruefe('mit dem Finger am Griff gezogen: Nachrichten nach vorn (' + f.join(' · ') + ')', JSON.stringify(f) === JSON.stringify(['Nachrichten', 'Heute', 'Zeiten', 'Schichtplan']), JSON.stringify(f));
    await tippe(p, '#abVerwerfen');
    await editor(p);
    await tippe(p, '#abInhalt [data-abzieh="neu:v-putzplan"]');
    await menue(p, 'In die Leiste');
    await tippe(p, '#abInhalt [data-abzieh="leiste:4"]');
    await menue(p, 'Nach vorn');

    console.log('\n── 4 Startseite ──');
    await tippe(p, '#abInhalt [data-abheutean="1"]');
    const pz = await p.evaluate(() => [...document.querySelectorAll('#abInhalt .ab-heute [data-abzieh]')].findIndex(e => /Putzplan/.test(e.textContent)));
    for (let i = pz; i > 0; i--) { await tippe(p, '#abInhalt [data-abzieh="heute:' + i + '"]'); await menue(p, 'Nach oben'); }
    await p.click('#abUebernehmen'); await p.waitForTimeout(600);
    await p.click('.mobnav [data-group="g-start"]'); await p.waitForTimeout(700);
    const hb = await p.evaluate(() => [...document.querySelectorAll('#heuteListe .heute-block')].map(e => e.getAttribute('data-btitel')));
    pruefe('Startseite: Putzplan zuerst, Überfällig fehlt (' + hb.join(' · ') + ')', hb[0] === 'Putzplan' && hb.indexOf('Überfällig') < 0, JSON.stringify(hb));

    console.log('\n── 5 Mehr als fünf ──');
    await editor(p);
    for (const v of ['v-material', 'v-geraete', 'v-docs']) { await tippe(p, '#abInhalt [data-abzieh="neu:' + v + '"]'); await menue(p, 'In die Leiste'); }
    const n = (await entwurfLeiste(p)).length;
    await p.click('#abUebernehmen'); await p.waitForTimeout(500);
    const u = await leiste(p, '.mobnav .mn-reihe [data-group]');
    pruefe(n + ' im Aufbau, unten vier und „Mehr" (' + u.join(' · ') + ')', n > 5 && u.length === 5 && u[4] === 'Mehr', JSON.stringify(u));
    await p.click('.mobnav [data-group="ab-mehr"]'); await p.waitForTimeout(300);
    const rest = await p.evaluate((SRC) => { const T = eval('(' + SRC + ')'); return [...document.querySelectorAll('#abMehrLade [data-group]')].map(e => [e.textContent.trim(), T(e)]); }, TREFFER.toString());
    pruefe('„Mehr" zeigt die übrigen ' + rest.length + ', jeder ≥ 44 hoch', rest.length === n - 4 && rest.every(x => x[1].h >= 44 && x[1].w >= 44), JSON.stringify(rest));
    pruefe('Formi tritt beiseite, solange „Mehr" offen ist', await p.evaluate(() => getComputedStyle(document.getElementById('formiKugel')).visibility === 'hidden' || document.getElementById('formiKugel').hidden));
    await p.evaluate(() => [...document.querySelectorAll('#abMehrLade [data-group]')].pop().click()); await p.waitForTimeout(600);
    pruefe('ein Tipp darin führt hin, „Mehr" trägt die Marke', await p.evaluate(() => (document.querySelector('.view.show') || {}).id === 'view-docs' && document.querySelector('.mobnav [data-group="ab-mehr"]').classList.contains('active')));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  console.log('\n── 6 Designs ──');
  {
    const p = await oeffne(b, 1440, 900);
    await editor(p);
    await tippe(p, '#abInhalt [data-abvor="anfang"]');
    await p.fill('#abDesignName', 'Frühschicht');
    await tippe(p, '#abInhalt [data-abspeichern]');
    const d = await p.evaluate(() => (JSON.parse(localStorage.getItem('kf_prefs')).designs || []).map(x => x.name));
    pruefe('„Frühschicht" gespeichert', JSON.stringify(d) === '["Frühschicht"]', JSON.stringify(d));
    await p.click('#abVerwerfen'); await p.waitForTimeout(300);
    pruefe('Speichern ändert die App nicht', (await leiste(p, '#side > [data-group]'))[0] === 'Heute');
    await editor(p);
    await tippe(p, '#abInhalt [data-abnutzen^="lokal:"]');
    const s = await leiste(p, '#side > [data-group]');
    pruefe('„Nutzen" wechselt sofort (' + s.join(' · ') + ')', JSON.stringify(s) === JSON.stringify(['Chat', 'Aufgaben', 'Infos', 'Material', 'Putzplan']), JSON.stringify(s));
    await editor(p);
    await tippe(p, '#abInhalt [data-abteilen]');
    const w = await p.evaluate(() => (window.__schreib || []).filter(x => /^designs\//.test(x.pfad) || /(^|\/)designs\/\(neu\)$/.test(x.pfad)).map(x => ({ pfad: x.pfad, felder: Object.keys(x.daten).sort(), name: x.daten.name, uid: x.daten.uid })));
    pruefe('„Teilen" schreibt nach designs, nur die erlaubten Felder', w.length === 1 && JSON.stringify(w[0].felder) === JSON.stringify(['aufbau', 'name', 'prefs', 'ts', 'uid', 'von']) && w[0].name === 'Frühschicht' && !!w[0].uid, JSON.stringify(w));
    const team = await p.evaluate(() => [...document.querySelectorAll('#abInhalt [data-abladen^="team:"]')].map(e => e.closest('.ab-design').querySelector('b').textContent));
    pruefe('„Vom Team" zeigt die geteilten (' + team.length + ')', team.length === 2 && team[0] === 'Empfang ruhig', JSON.stringify(team));
    await tippe(p, '#abInhalt [data-abladen="team:t1"]');
    pruefe('„Ausprobieren" lädt in den Entwurf (App unverändert)', JSON.stringify(await entwurfLeiste(p)) === JSON.stringify(['Aufgaben', 'Chat', 'Putzplan']) && (await leiste(p, '#side > [data-group]'))[0] === 'Chat');
    await tippe(p, '#abInhalt [data-abnutzen="team:t1"]');
    const t = await p.evaluate(() => ({ s: [...document.querySelectorAll('#side > [data-group]')].map(e => e.textContent.trim()), hell: document.body.classList.contains('light') }));
    pruefe('„Nutzen" (Team): Leiste und Aussehen sofort', JSON.stringify(t.s) === JSON.stringify(['Aufgaben', 'Chat', 'Putzplan']) && t.hell, JSON.stringify(t));

    console.log('\n── 7 Ein kaputtes Design vom Team ──');
    await editor(p);
    await tippe(p, '#abInhalt [data-abnutzen="team:t2"]');
    const k = await p.evaluate(() => {
      const a = JSON.parse(localStorage.getItem('kf_prefs'));
      return { leiste: a.aufbau.leiste, gruppen: a.aufbau.gruppen, start: a.aufbau.start, theme: a.theme, fs: a.fs, accent: a.accent,
        boese: !!document.querySelector('img[src="x"]'), side: [...document.querySelectorAll('#side > [data-group]')].map(e => e.textContent.trim()) };
    });
    pruefe('bereinigt: nur bekannte Seiten, Gruppe mit gültiger Kennung und kurzem Namen, Start Heute, ungültige Farben verworfen',
      JSON.stringify(k.leiste) === '["g-start","v-chat"]' && k.gruppen.length === 1 && /^e-/.test(k.gruppen[0].id) && k.gruppen[0].name.length <= 24 &&
      JSON.stringify(k.gruppen[0].seiten) === '["todos"]' && k.start === 'home' && k.theme !== 'pink' && k.fs !== '999' && k.accent === 'violett' && !k.boese, JSON.stringify(k));
    pruefe('die App läuft weiter (' + k.side.join(' · ') + ')', JSON.stringify(k.side) === JSON.stringify(['Heute', 'Chat']), JSON.stringify(k.side));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Baukasten: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Baukasten: Ziehen, Gruppen, Startseite, Entwurf, Designs teilen — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
