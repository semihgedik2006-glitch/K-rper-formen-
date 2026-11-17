/* ══ KOLLEKTIV ANLEGEN (Runde 305) ══════════════════════════════════
   Aus dem Betrieb, 17.11.2026: „thomas will das die leitung auch
   kollektiv sachen anlegen kann in jedem berreich also Aufgaben,
   putzplan, Material etc. das wäre super hilfreich und wichtig für ihn".
   Auf Nachfrage: beides – viele Einträge auf einmal UND für mehrere
   Studios –, und eine spätere Änderung soll in allen Studios mitgehen.

   Geprüft wird als Studioleitung (Hürth = studio-6, Brühl = studio-7):
    1. Aufgaben: „+ Mehrere auf einmal" – drei Zeilen (eine doppelt) für
       „Alle meine Studios" schreiben 3 × 2 Aufgaben; je Zeile dieselbe
       gid in beiden Studios, verschiedene Zeilen verschiedene gids.
    2. Bearbeiten: „Auch in den anderen 1 Studios ändern (Brühl)" steht
       da und ist an; Speichern ändert beide, Brühl behält die eigenen
       Haken der Teilschritte. Abgewählt ändert es nur Hürth.
    3. Löschen: das Fenster fragt „In allen 2 Studios / Nur in diesem
       Studio / Abbrechen"; „In allen" löscht beide, „Abbrechen" keins.
    4. Putzplan: dasselbe beim Anlegen und beim Bearbeiten.
    5. Geräte: mehrere Geräte in mehreren Studios; nur ein Studio → ohne gid.
    6. Material: mehrere Artikel in mehreren Studios – der Bestand des
       anderen Studios bleibt erhalten; Umbenennen in allen Studios.
       Mitarbeiter sehen das alles nicht.
    7. Trefferflächen (Hit-Test) bei 320 / 390 / 430 / 820 / 1280 / 1440 /
       1920, normal und kompakt: „+ Mehrere auf einmal", die Studio-
       Kästchen und die drei Knöpfe der Frage – ≥ 44 × 44, im Bild.
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
const KOL = {
  todos: {
    'studio-6': [{ id: 'k6', title: 'Gemeinsam', desc: '', done: false, createdBy: 'Thomas', ts: Date.now() - 5000, gid: 'gA', steps: [{ t: 'a', d: true }] }],
    'studio-7': [{ id: 'k7', title: 'Gemeinsam', desc: '', done: false, createdBy: 'Thomas', ts: Date.now() - 5000, gid: 'gA', steps: [{ t: 'a', d: false }] }]
  },
  cleaning: {
    'studio-6': [{ id: 'kp6', title: 'Spiegel', recurring: 'daily', done: false, ts: Date.now() - 5000, gid: 'gP' }],
    'studio-7': [{ id: 'kp7', title: 'Spiegel', recurring: 'daily', done: false, ts: Date.now() - 5000, gid: 'gP' }]
  },
  inventory: {
    'studio-6': [{ name: 'Handtücher', have: 12, limit: 20, need: 0 }, { name: 'Seife', have: 1, limit: 5, need: 0, gid: 'gM' }],
    'studio-7': [{ name: 'Handtücher', have: 5, limit: 20, need: 0 }, { name: 'Seife', have: 3, limit: 5, need: 0, gid: 'gM' }]
  }
};
async function oeffne(b, w, h, stub, extra) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = []; p._dialoge = 0;
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  p.on('dialog', d => { p._dialoge++; d.accept(); });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await ctx.addInitScript(([K, X]) => {
    try {
      localStorage.setItem('kf_tour', '1:testuid'); localStorage.setItem('kf_formi_gruss', new Date().toDateString());
      localStorage.setItem('kf_due_' + new Date().toDateString(), '1');
      if (X) localStorage.setItem('kf_prefs', JSON.stringify(X));
    } catch (e) {}
    window.__kol = K;
  }, [KOL, extra || null]);
  await ctx.addInitScript({ path: SP + '/' + stub });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(1200);
  p._ctx = ctx;
  return p;
}
const zu = (p, view) => p.evaluate(async (v) => {
  const w = (ms) => new Promise(r => setTimeout(r, ms));
  document.getElementById('bereichKopf').click(); await w(350);
  const z = [...document.querySelectorAll('#allesLade [data-alles="' + v + '"]')].find(e => e.getClientRects().length);
  if (z) z.click(); await w(900);
  return !!z;
}, view);
const studioWahl = (p, selId, sk) => p.evaluate(async ([id, sk]) => {
  const sel = document.getElementById(id); if (!sel) return false;
  sel.value = sk; if (sel.onchange) sel.onchange(); else sel.dispatchEvent(new Event('change'));
  await new Promise(r => setTimeout(r, 700)); return sel.value === sk;
}, [selId, sk]);
const geschrieben = (p, re) => p.evaluate((q) => (window.__schreib || []).filter(x => new RegExp(q).test(x.pfad)).map(x => ({ pfad: x.pfad, art: x.art || 'set', daten: x.daten })), re);

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── 1 Aufgaben: mehrere Zeilen, alle meine Studios ──');
    let p = await oeffne(b, 1440, 900, 'stub-leiter.js');
    await zu(p, 'todos');
    await p.evaluate(() => document.getElementById('todoNew').click()); await p.waitForTimeout(1200);
    const a1 = await p.evaluate(() => ({
      alle: (document.querySelector('#ntAllWrap b') || {}).textContent,
      mehr: !!document.getElementById('ntMehrAn') && document.getElementById('ntMehrAn').getClientRects().length > 0,
      feldZu: document.getElementById('ntMehr').hidden }));
    pruefe('die Leitung sieht „Alle meine Studios" und „+ Mehrere auf einmal"; das Feld ist zu', a1.alle === 'Alle meine Studios' && a1.mehr && a1.feldZu, JSON.stringify(a1));
    await p.evaluate(() => document.getElementById('ntMehrAn').click()); await p.waitForTimeout(150);
    await p.evaluate(() => {
      document.getElementById('ntTitle').value = 'Spiegel putzen';
      document.getElementById('ntMehr').value = 'Theke wischen\nMüll raus\n\ntheke wischen';
      const a = document.getElementById('ntAllStudios'); if (!a.checked) a.click();
      window.__schreib = [];
      document.getElementById('ntAdd').click();
    });
    await p.waitForTimeout(700);
    const n1 = (await geschrieben(p, '^studios/studio-[67]/todos/')).filter(x => x.art === 'set');
    const titel = [...new Set(n1.map(x => x.daten.title))];
    const proTitel = titel.map(t => n1.filter(x => x.daten.title === t));
    pruefe('3 Zeilen (eine doppelt) × 2 Studios = 6 Aufgaben', n1.length === 6 && titel.join('|') === 'Spiegel putzen|Theke wischen|Müll raus', n1.length + ' · ' + titel.join('|'));
    pruefe('… je Zeile in Hürth und Brühl dieselbe gid, jede Zeile eine eigene',
      proTitel.every(l => l.length === 2 && l[0].daten.gid && l[0].daten.gid === l[1].daten.gid && new Set(l.map(x => x.pfad.split('/')[1])).size === 2) &&
      new Set(proTitel.map(l => l[0].daten.gid)).size === 3, JSON.stringify(proTitel.map(l => l.map(x => x.daten.gid))));
    pruefe('… danach ist das Feld wieder zu und leer', await p.evaluate(() => document.getElementById('ntMehr').hidden && !document.getElementById('ntMehr').value));
    // nur ein Studio: ohne gid
    await p.evaluate(() => {
      const a = document.getElementById('ntAllStudios'); if (a.checked) a.click();
      [...document.querySelectorAll('#ntStudios input')].forEach(c => { if (c.checked !== (c.value === 'studio-6')) c.click(); });
      document.getElementById('ntTitle').value = 'Nur Hürth'; window.__schreib = [];
      document.getElementById('ntAdd').click();
    });
    await p.waitForTimeout(600);
    const n1b = (await geschrieben(p, '^studios/studio-[67]/todos/')).filter(x => x.art === 'set');
    pruefe('nur ein Studio: eine Aufgabe ohne gid', n1b.length === 1 && !('gid' in n1b[0].daten), JSON.stringify(n1b.map(x => x.daten.gid)));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));

    console.log('\n── 2 Aufgabe bearbeiten: in allen Studios ──');
    await zu(p, 'todos');
    await studioWahl(p, 'todoStudioWahl', 'studio-6');
    const stift = await p.evaluate(() => { const k = document.querySelector('[data-id="k6"] .t-edit'); if (k) k.click(); return !!k; });
    await p.waitForTimeout(700);
    const t2 = await p.evaluate(() => ({ offen: document.getElementById('todoEditModal').classList.contains('show'),
      sicht: !document.getElementById('teAlleWrap').hidden, an: document.getElementById('teAlle').checked,
      text: document.getElementById('teAlleText').textContent }));
    pruefe('„Aufgabe bearbeiten": „Auch in den anderen 1 Studios ändern (Brühl)" steht da und ist an',
      stift && t2.offen && t2.sicht && t2.an && /anderen 1 Studios ändern \(Brühl\)/.test(t2.text), JSON.stringify(t2));
    await p.evaluate(() => { document.getElementById('teTitle').value = 'Gemeinsam neu'; window.__schreib = []; document.getElementById('teSave').click(); });
    await p.waitForTimeout(600);
    const u2 = await geschrieben(p, '^studios/studio-[67]/todos/k[67]$');
    const u6 = u2.find(x => /k6$/.test(x.pfad)), u7 = u2.find(x => /k7$/.test(x.pfad));
    pruefe('Speichern ändert Hürth und Brühl', !!u6 && !!u7 && u6.daten.title === 'Gemeinsam neu' && u7.daten.title === 'Gemeinsam neu', JSON.stringify(u2.map(x => x.pfad)));
    pruefe('… Brühl behält die eigenen Haken der Teilschritte (a: nicht abgehakt)', !!u7 && !!u6 && u7.daten.steps[0].d === false && u6.daten.steps[0].d === true, JSON.stringify([u6 && u6.daten.steps, u7 && u7.daten.steps]));
    await p.evaluate(() => document.querySelector('[data-id="k6"] .t-edit').click()); await p.waitForTimeout(700);
    await p.evaluate(() => { document.getElementById('teAlle').click(); window.__schreib = []; document.getElementById('teSave').click(); });
    await p.waitForTimeout(600);
    const u2b = await geschrieben(p, '^studios/studio-[67]/todos/k[67]$');
    pruefe('abgewählt: nur Hürth wird geändert', u2b.length === 1 && /k6$/.test(u2b[0].pfad), JSON.stringify(u2b.map(x => x.pfad)));

    console.log('\n── 3 Aufgabe löschen: fragen, dann in allen Studios ──');
    await p.evaluate(() => { window.__schreib = []; document.querySelector('[data-id="k6"] .t-del').click(); });
    await p.waitForTimeout(600);
    const f3 = await p.evaluate(() => ({ offen: document.getElementById('kolModal').classList.contains('show'),
      text: document.getElementById('kolText').textContent, alle: document.getElementById('kolAlle').textContent }));
    pruefe('das Fenster fragt: „… gibt es auch in Brühl" – „In allen 2 Studios"', f3.offen && /auch in Brühl/.test(f3.text) && f3.alle === 'In allen 2 Studios', JSON.stringify(f3));
    pruefe('… vorher ist nichts gelöscht', !(await geschrieben(p, 'todos/k[67]$')).length);
    await p.evaluate(() => document.getElementById('kolAbbr').click()); await p.waitForTimeout(400);
    pruefe('„Abbrechen" löscht nichts und schliesst', !(await geschrieben(p, 'todos/k[67]$')).length && !(await p.evaluate(() => document.getElementById('kolModal').classList.contains('show'))));
    await p.evaluate(() => document.querySelector('[data-id="k6"] .t-del').click()); await p.waitForTimeout(600);
    await p.evaluate(() => document.getElementById('kolAlle').click()); await p.waitForTimeout(700);
    const d3 = (await geschrieben(p, 'todos/k[67]$')).filter(x => x.art === 'delete').map(x => x.pfad).sort();
    pruefe('„In allen 2 Studios" löscht Hürth und Brühl', d3.join('|') === 'studios/studio-6/todos/k6|studios/studio-7/todos/k7', d3.join('|'));
    pruefe('… beide liegen im Papierkorb', (await p.evaluate(() => (window.__schreib || []).filter(x => /^trash\//.test(x.pfad)).length)) >= 2);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();

    console.log('\n── 4 Putzplan ──');
    p = await oeffne(b, 1440, 900, 'stub-leiter.js');
    await zu(p, 'putzplan');
    await studioWahl(p, 'ppStudio', 'studio-6');
    await p.evaluate(() => document.getElementById('ppNew').click()); await p.waitForTimeout(500);
    const pa = await p.evaluate(() => (document.querySelector('#ppAllWrap b') || {}).textContent);
    pruefe('im Putzplan heisst es auch „Alle meine Studios"', pa === 'Alle meine Studios', pa);
    await p.evaluate(() => {
      document.getElementById('ppMehrAn').click();
      document.getElementById('ppTitle').value = 'Fenster';
      document.getElementById('ppMehr').value = 'Boden\nTür';
      const a = document.getElementById('ppAllStudios'); if (!a.checked) a.click();
      window.__schreib = []; document.getElementById('ppAdd').click();
    });
    await p.waitForTimeout(700);
    const p4 = (await geschrieben(p, '^studios/studio-[67]/cleaning/')).filter(x => x.art === 'set');
    const pt = [...new Set(p4.map(x => x.daten.title))];
    pruefe('3 Putzaufgaben × 2 Studios, je Zeile eine gemeinsame gid', p4.length === 6 && pt.length === 3 &&
      pt.every(t => { const l = p4.filter(x => x.daten.title === t); return l.length === 2 && l[0].daten.gid && l[0].daten.gid === l[1].daten.gid; }), p4.length + ' · ' + pt.join('|'));
    await p.evaluate(() => document.querySelector('[data-ppedit="kp6"]').click()); await p.waitForTimeout(700);
    const p4b = await p.evaluate(() => ({ sicht: !document.getElementById('ppAlleWrap').hidden, text: document.getElementById('ppAlleText').textContent,
      mehr: document.getElementById('ppMehrAn').hidden }));
    pruefe('Bearbeiten: „Auch in den anderen 1 Studios ändern (Brühl)", kein „Mehrere"', p4b.sicht && /Brühl/.test(p4b.text) && p4b.mehr, JSON.stringify(p4b));
    await p.evaluate(() => { document.getElementById('ppTitle').value = 'Spiegel und Glas'; window.__schreib = []; document.getElementById('ppAdd').click(); });
    await p.waitForTimeout(600);
    const p4c = (await geschrieben(p, 'cleaning/kp[67]$')).filter(x => x.art === 'update');
    pruefe('… ändert Hürth und Brühl', p4c.length === 2 && p4c.every(x => x.daten.title === 'Spiegel und Glas'), JSON.stringify(p4c.map(x => x.pfad)));
    await p.evaluate(() => { window.__schreib = []; document.querySelector('#ppList [data-del="kp6"]').click(); }); await p.waitForTimeout(600);
    await p.evaluate(() => document.getElementById('kolAlle').click()); await p.waitForTimeout(600);
    const p4d = (await geschrieben(p, 'cleaning/kp[67]$')).filter(x => x.art === 'delete');
    pruefe('Löschen in allen Studios: beide weg, ohne zusätzliche Rückfrage', p4d.length === 2 && p._dialoge === 0, p4d.length + ' · Dialoge ' + p._dialoge);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();

    console.log('\n── 5 Geräte ──');
    p = await oeffne(b, 1440, 900, 'stub-leiter.js');
    await zu(p, 'geraete');
    await studioWahl(p, 'devStudio', 'studio-6');
    const g5 = await p.evaluate(() => [...document.querySelectorAll('#devStudios label')].map(l => l.textContent.trim() + (l.querySelector('input').checked ? '*' : '')));
    pruefe('„Für welche Studios?": Alle meine Studios, Brühl, Hürth (an)', g5.join('|') === 'Alle meine Studios|Brühl|Hürth*', g5.join('|'));
    await p.evaluate(() => {
      document.getElementById('devMehrAn').click();
      document.getElementById('devName').value = 'Kühlschrank';
      document.getElementById('devMehr').value = 'Waage';
      document.getElementById('devPlace').value = 'Theke';
      [...document.querySelectorAll('#devStudios input[value="studio-7"]')].forEach(c => c.click());
      window.__schreib = []; document.getElementById('devAdd').click();
    });
    await p.waitForTimeout(700);
    const d5 = (await geschrieben(p, '^studios/studio-[67]/devices/')).filter(x => x.art === 'set');
    pruefe('2 Geräte × 2 Studios, je Gerät eine gemeinsame gid, Ort „Theke"', d5.length === 4 &&
      ['Kühlschrank', 'Waage'].every(n => { const l = d5.filter(x => x.daten.name === n); return l.length === 2 && l[0].daten.gid === l[1].daten.gid && l[0].daten.gid && l.every(x => x.daten.place === 'Theke'); }),
      JSON.stringify(d5.map(x => x.pfad.split('/')[1] + ':' + x.daten.name + ':' + x.daten.gid)));
    await p.evaluate(() => {
      document.getElementById('devName').value = 'Nur hier'; window.__schreib = []; document.getElementById('devAdd').click();
    });
    await p.waitForTimeout(600);
    const d5b = (await geschrieben(p, '^studios/studio-[67]/devices/')).filter(x => x.art === 'set');
    pruefe('danach ist wieder nur Hürth gewählt: ein Gerät ohne gid', d5b.length === 1 && /studio-6/.test(d5b[0].pfad) && !d5b[0].daten.gid, JSON.stringify(d5b.map(x => x.pfad)));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();

    console.log('\n── 6 Material ──');
    p = await oeffne(b, 1440, 900, 'stub-leiter.js');
    await zu(p, 'material');
    await studioWahl(p, 'matStudio', 'studio-6');
    pruefe('die Leitung sieht „+ Mehrere auf einmal" und die Studios', await p.evaluate(() => !document.getElementById('matKol').hidden && document.querySelectorAll('#matStudios input').length === 3));
    await p.evaluate(() => {
      document.getElementById('matMehrAn').click();
      document.getElementById('matNewName').value = 'Kaffee';
      document.getElementById('matMehr').value = 'Tee\nHandtücher';
      [...document.querySelectorAll('#matStudios input[value="studio-7"]')].forEach(c => c.click());
      window.__schreib = []; document.getElementById('matAdd').click();
    });
    await p.waitForTimeout(1200);
    const m6 = (await geschrieben(p, '^inventory/studio-6$')).pop(), m7 = (await geschrieben(p, '^inventory/studio-7$')).pop();
    const namen = (m) => m ? m.daten.items.map(i => i.name) : [];
    pruefe('Hürth: Kaffee und Tee dazu, „Handtücher" nicht doppelt', !!m6 && namen(m6).filter(n => n === 'Handtücher').length === 1 && namen(m6).includes('Kaffee') && namen(m6).includes('Tee'), namen(m6).join('|'));
    pruefe('Brühl: der Bestand bleibt (Handtücher Ist 5), Kaffee und Tee dazu', !!m7 && m7.daten.items.find(i => i.name === 'Handtücher').have === 5 && namen(m7).includes('Kaffee') && namen(m7).includes('Tee'), namen(m7).join('|'));
    const gk = (m, n) => (m.daten.items.find(i => i.name === n) || {}).gid;
    pruefe('… Kaffee trägt in beiden Studios dieselbe gid, Tee eine andere', !!m6 && !!m7 && gk(m6, 'Kaffee') && gk(m6, 'Kaffee') === gk(m7, 'Kaffee') && gk(m6, 'Tee') === gk(m7, 'Tee') && gk(m6, 'Kaffee') !== gk(m6, 'Tee'));
    // Umbenennen in allen Studios
    await p.evaluate(async () => {
      const f = [...document.querySelectorAll('input.mat-name-inp')].find(i => i.value === 'Seife');
      window.__schreib = []; f.focus(); f.value = 'Flüssigseife'; f.blur();
    });
    await p.waitForTimeout(700);
    const fr = await p.evaluate(() => ({ offen: document.getElementById('kolModal').classList.contains('show'), titel: document.getElementById('kolTitel').textContent }));
    pruefe('Umbenennen fragt „Namen überall ändern?"', fr.offen && /Namen überall ändern/.test(fr.titel), JSON.stringify(fr));
    await p.evaluate(() => document.getElementById('kolAlle').click()); await p.waitForTimeout(800);
    const r7 = (await geschrieben(p, '^inventory/studio-7$')).pop();
    pruefe('… „In allen 2 Studios": in Brühl heisst Seife jetzt Flüssigseife, Ist bleibt 3',
      !!r7 && r7.daten.items.some(i => i.name === 'Flüssigseife' && i.have === 3) && !r7.daten.items.some(i => i.name === 'Seife'), r7 && namen(r7).join('|'));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();

    p = await oeffne(b, 1440, 900, 'stub-mitarbeiter.js');
    await zu(p, 'material');
    pruefe('Mitarbeiter sehen weder „Mehrere" noch Studios am Material', await p.evaluate(() => { const k = document.getElementById('matKol'); return !k || k.hidden || !k.getClientRects().length; }));
    await p._ctx.close();

    console.log('\n── 7 Trefferflächen, normal und kompakt ──');
    for (const dichte of ['normal', 'kompakt']) {
      for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
        p = await oeffne(b, w, h, 'stub-leiter.js', { dichte });
        await zu(p, 'material');
        await studioWahl(p, 'matStudio', 'studio-6');
        /* Erst ins Bild holen, ein Bild abwarten, dann messen: direkt nach
           dem Rollen liegt die Seite noch nicht still. */
        const mess = (sel) => p.evaluate(async ([s, T]) => {
          const f = new Function('return ' + T)();
          const r = [];
          for (const e of [...document.querySelectorAll(s)].filter(e => e.getClientRects().length)) {
            e.scrollIntoView({ block: 'center', behavior: 'instant' });
            await new Promise(ok => setTimeout(ok, 120));
            const g = e.getBoundingClientRect();
            r.push({ t: e.textContent.trim().slice(0, 24), m: f(e), drin: g.left >= 0 && g.right <= innerWidth + 0.5 });
          }
          return r;
        }, [sel, TREFFER.toString()]);
        const mm = await mess('#matMehrAn, #matStudios label');
        await p.evaluate(() => { const r = [...document.querySelectorAll('input.mat-name-inp')].find(i => i.value === 'Seife').closest('.mat-row'); r.querySelector('[data-del]').click(); });
        await p.waitForTimeout(700);
        const km = await mess('#kolAlle, #kolHier, #kolAbbr');
        await p.evaluate(() => document.getElementById('kolAbbr').click()); await p.waitForTimeout(300);
        await zu(p, 'geraete');
        /* „Gerät aufnehmen" ist eine Klappkarte – erst aufklappen, wie ein Mensch. */
        await p.evaluate(() => { const k = document.getElementById('devAddCard'); if (k && k.classList.contains('zu')) k.querySelector('.fold-head').click(); });
        await p.waitForTimeout(400);
        const dm = await mess('#devMehrAn, #devStudios label');
        const quer = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        await zu(p, 'todos');
        await p.evaluate(() => { const n = document.getElementById('todoNew'); if (n) n.click(); });
        await p.waitForTimeout(1200);
        const nm = await mess('#ntMehrAn');
        await zu(p, 'putzplan');
        await p.evaluate(() => { const n = document.getElementById('ppNew'); if (n) n.click(); });
        await p.waitForTimeout(600);
        const pm = await mess('#ppMehrAn');
        await p.evaluate(() => { const m = document.getElementById('putzModal'); if (m) m.classList.remove('show'); });
        const alle = mm.concat(km, dm, nm, pm), schlecht = alle.filter(x => x.m.w < 44 || x.m.h < 44 || !x.drin);
        pruefe(w + ' ' + dichte + ': ' + alle.length + ' Bedienelemente (Material, Frage, Geräte, Aufgaben, Putzplan) ≥ 44 × 44, im Bild, kein Querscrollen',
          mm.length >= 4 && km.length === 3 && dm.length >= 4 && nm.length === 1 && pm.length === 1 && !schlecht.length && !quer,
          JSON.stringify({ mm: mm.length, km: km.length, dm: dm.length, nm: nm.length, pm: pm.length, schlecht, quer }));
        console.log('     ' + alle.map(x => x.t.slice(0, 14) + ' ' + x.m.w + '×' + x.m.h).join(' · '));
        await p._ctx.close();
      }
    }
  } finally { await b.close(); }
  console.log('\n' + (schlecht ? '✗ Kollektiv anlegen: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
                              : '✓ Kollektiv anlegen: ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
