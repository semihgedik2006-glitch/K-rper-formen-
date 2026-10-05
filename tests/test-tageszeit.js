/* ══════════════════════════════════════════════════════════════════════
   TAGESZEIT UND STUDIO-ZUORDNUNG (Runde 140)

   Aus dem Betrieb, 5.10.2026:
     „Ein Mitarbeiter kann irgendwie keine Aufgaben anlegen, aber den
      Putzplan schon" — und von ihm: „Vielleicht wäre eine Option cool,
      wo man die Aufgaben und Putzplan sortieren kann, so dass ich die
      abends Aufgaben auch abends eintragen kann und die morgens Aufgaben
      eben morgens."

   1. Tageszeit (Demo, Uhr fest auf 19:30):
      · Putzplan „Nach Tageszeit": Gruppen „Jetzt · Abends", „Jederzeit",
        „Morgens", „Mittags" — jede Putzaufgabe in der Gruppe ihrer
        Tageszeit, die Abendgruppe zuerst
      · um 8:00 steht „Jetzt · Morgens" vorne (GEGENPROBE: die Reihenfolge
        folgt der Uhr, nicht einer festen Liste)
      · Aufgaben „Nach Tageszeit": offene Abendaufgaben vor allen anderen
        offenen; die Marke „Abends" steht an der Zeile
      · Putzaufgabe anlegen mit „Abends" → gespeichert mit tageszeit;
        bearbeiten → das Feld zeigt sie, „Jederzeit" entfernt sie
      · eigene Aufgabe (Mitarbeiter) mit „Morgens" → gespeichert
   2. Studio-Zuordnung (Attrappe, Geschäftsführung):
      · ein Konto ohne studioKeys, eines mit falscher Kennung, eines mit
        veraltetem Studionamen → alle drei in der Karte, in der Übersicht
        „3 Konten können keine Aufgaben anlegen"
      · „Zuordnung reparieren" schreibt genau die fehlenden Felder
      · GEGENPROBE: ein Konto, das passt, und die Geschäftsführung stehen
        nicht drin
   3. Lehnt die Datenbank eine Aufgabe ab, sagt die App dem Mitarbeiter,
      woran es liegt und wer es beheben kann.
   4. Fingerziele ≥ 44 × 44 (Tageszeit-Felder, „Zuordnung reparieren")
      bei 320–1920 px, normal und kompakt; nichts ragt hinaus.
   ══════════════════════════════════════════════════════════════════ */
const path = require('path');
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PUTZ = (k) => 'firmen/koerperformen/studios/' + k + '/cleaning';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 260) : '')); }
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
const GROESSEN = [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]];
async function messen(p, wer, liste, vorher) {
  for (const [w, h] of GROESSEN) {
    await p.setViewportSize({ width: w, height: h });
    await p.waitForTimeout(250);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      if (vorher) await p.evaluate(vorher);
      const m = await p.evaluate(async ([SRC, sel]) => {
        const T = eval('(' + SRC + ')'); const aus = {};
        for (const s of sel) {
          const el = document.querySelector(s);
          if (!el || !el.offsetParent) { aus[s] = { w: -1, h: -1 }; continue; }
          el.scrollIntoView({ block: 'center' });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          aus[s] = T(el);
        }
        return { aus, quer: document.documentElement.scrollWidth - innerWidth };
      }, [TREFFER.toString(), liste]);
      const klein = Object.keys(m.aus).filter(k => !(m.aus[k].w >= 44 && m.aus[k].h >= 44));
      pruefe(wer + ' ' + w + ' px ' + dichte + ': ' + liste.length + ' Bedienelemente ≥ 44 × 44, nichts ragt hinaus',
        !klein.length && m.quer <= 0, JSON.stringify({ klein: klein.map(k => k + ' ' + m.aus[k].w + '×' + m.aus[k].h), quer: m.quer }));
    }
  }
  await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
}
async function demo(b, rolle, uhr, w, h) {
  const p = await b.newPage({ viewport: { width: w || 1440, height: h || 900 } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  if (uhr) await p.clock.install({ time: uhr });
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
const zuPutzplan = (p) => p.evaluate(async () => {
  const w = (ms) => new Promise(r => setTimeout(r, ms));
  const s = (sel) => [...document.querySelectorAll(sel)].find(e => e.offsetParent);
  const g = s('[data-group="g-arbeit"]'); if (g) { g.click(); await w(600); }
  const v = s('[data-subview="putzplan"]') || s('[data-view="putzplan"]'); if (v) { v.click(); await w(1200); }
});
const zuAufgaben = (p) => p.evaluate(async () => {
  const w = (ms) => new Promise(r => setTimeout(r, ms));
  const s = (sel) => [...document.querySelectorAll(sel)].find(e => e.offsetParent);
  const g = s('[data-group="g-arbeit"]'); if (g) { g.click(); await w(600); }
  const v = s('[data-subview="todos"]'); if (v) { v.click(); await w(1200); }
});
const sortieren = (p, id, wert) => p.evaluate(async ([id, wert]) => {
  const sel = document.getElementById(id); sel.value = wert; sel.dispatchEvent(new Event('change'));
  await new Promise(r => setTimeout(r, 400));
}, [id, wert]);

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const heute = (std) => { const d = new Date(); d.setHours(std, 30, 0, 0); return d; };

  console.log('\n── 1. Putzplan nach Tageszeit (19:30) ──');
  {
    const p = await demo(b, 'chef', heute(19), 1440, 900);
    await zuPutzplan(p);
    const opt = await p.evaluate(() => [...document.querySelectorAll('#ppSort option')].map(o => o.value));
    pruefe('die Sortierung kennt „Nach Tageszeit"', opt.indexOf('tageszeit') >= 0, opt.join(','));
    await sortieren(p, 'ppSort', 'tageszeit');
    const g = await p.evaluate(async () => {
      const sk = document.getElementById('ppStudio').value;
      const daten = (await firebase.firestore().collection('firmen/koerperformen/studios/' + sk + '/cleaning').get()).docs.map(d => Object.assign({ id: d.id }, d.data()));
      const gruppen = [...document.querySelectorAll('#ppList .pp-gruppe')].map(s => ({
        kopf: s.querySelector('h4').textContent,
        ids: [...s.querySelectorAll('.pp-item')].map(i => i.getAttribute('data-id'))
      }));
      return { daten, gruppen };
    });
    const tzVon = (id) => (g.daten.find(d => d.id === id) || {}).tageszeit || '';
    pruefe('die erste Gruppe ist „Jetzt · Abends"', g.gruppen[0] && g.gruppen[0].kopf === 'Jetzt · Abends', JSON.stringify(g.gruppen.map(x => x.kopf)));
    const erwartet = { 'Jetzt · Abends': 'abends', 'Jederzeit': '', 'Morgens': 'morgens', 'Mittags': 'mittags' };
    const falsch = [];
    g.gruppen.forEach(gr => gr.ids.forEach(id => { if (tzVon(id) !== erwartet[gr.kopf]) falsch.push(gr.kopf + ':' + id + '=' + tzVon(id)); }));
    pruefe('jede Putzaufgabe steht in der Gruppe ihrer Tageszeit', !falsch.length && g.gruppen.length >= 2, falsch.join(' | '));
    const reihen = g.gruppen.map(x => x.kopf).filter(k => k !== 'Jetzt · Abends');
    pruefe('… danach „Jederzeit", dann der Rest des Tages (Morgens vor Mittags)',
      reihen.join('|') === ['Jederzeit', 'Morgens', 'Mittags'].filter(k => reihen.indexOf(k) >= 0).join('|'), reihen.join('|'));
    const marke = await p.evaluate(() => { const i = [...document.querySelectorAll('#ppList .pp-item')].find(x => x.querySelector('.t-zeit'));
      return i ? i.querySelector('.t-zeit').textContent : ''; });
    pruefe('an der Zeile steht die Marke („Morgens"/„Abends")', /^(Morgens|Mittags|Abends)$/.test(marke), marke);

    // Anlegen mit „Abends", dann bearbeiten
    const neu = await p.evaluate(async () => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      document.getElementById('ppNew').click(); await w(400);
      document.getElementById('ppTitle').value = 'Tageszeit-Probe Theke wischen';
      const z = document.getElementById('ppZeit'); z.value = 'abends';
      const sk = document.getElementById('ppStudio').value;
      const cb = document.querySelector('#ppStudios input[value="' + sk + '"]'); if (cb && !cb.checked) cb.click();
      const knopf = [...document.querySelectorAll('#putzModal button')].find(x => /anlegen|erstellen|Speichern/i.test(x.textContent));
      knopf.click(); await w(800);
      const d = (await firebase.firestore().collection('firmen/koerperformen/studios/' + sk + '/cleaning').get()).docs
        .map(x => Object.assign({ id: x.id }, x.data())).find(x => x.title === 'Tageszeit-Probe Theke wischen');
      return d || null;
    });
    pruefe('Putzaufgabe mit „Abends" angelegt → gespeichert mit tageszeit: abends', neu && neu.tageszeit === 'abends', JSON.stringify(neu));
    const edit = await p.evaluate(async (id) => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      const k = document.querySelector('[data-ppedit="' + id + '"]'); if (!k) return { fehlt: true };
      k.click(); await w(400);
      const vorher = document.getElementById('ppZeit').value;
      document.getElementById('ppZeit').value = '';
      const knopf = [...document.querySelectorAll('#putzModal button')].find(x => /Speichern|anlegen|erstellen/i.test(x.textContent));
      knopf.click(); await w(800);
      const sk = document.getElementById('ppStudio').value;
      const d = (await firebase.firestore().collection('firmen/koerperformen/studios/' + sk + '/cleaning').doc(id).get()).data();
      return { vorher, nachher: d.tageszeit };
    }, neu && neu.id);
    pruefe('bearbeiten: das Feld zeigt „Abends", „Jederzeit" entfernt die Tageszeit', edit.vorher === 'abends' && (edit.nachher === null || edit.nachher === undefined), JSON.stringify(edit));
    await messen(p, 'Putzaufgabe', ['#ppZeit'], async () => {
      const m = document.getElementById('putzModal');
      if (getComputedStyle(m).display === 'none') document.getElementById('ppNew').click();
      await new Promise(r => setTimeout(r, 200));
    });
    await messen(p, 'Neue Aufgabe', ['#ntZeit'], async () => {
      const m = document.getElementById('putzModal'); if (m) m.classList.remove('show');
      const f = document.getElementById('ntZeit');
      if (!f || !f.offsetParent) {
        const s = (sel) => [...document.querySelectorAll(sel)].find(e => e.offsetParent);
        const a = s('[data-group="g-alles"]'); if (a) { a.click(); await new Promise(r => setTimeout(r, 500)); }
        const e = [...document.querySelectorAll('[data-alles][data-al-cgo="erstellen"]')].find(x => x.offsetParent);
        if (e) { e.click(); await new Promise(r => setTimeout(r, 700)); }
        const karte = document.getElementById('ntZeit') && document.getElementById('ntZeit').closest('.card.fold');
        if (karte && karte.classList.contains('zu')) karte.querySelector('.fold-head').click();
        await new Promise(r => setTimeout(r, 300));
      }
    });
    pruefe('ohne Skriptfehler (Putzplan abends)', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  {
    const p = await demo(b, 'chef', heute(8), 1440, 900);
    await zuPutzplan(p);
    await sortieren(p, 'ppSort', 'tageszeit');
    const k = await p.evaluate(() => [...document.querySelectorAll('#ppList .pp-gruppe h4')].map(h => h.textContent));
    pruefe('GEGENPROBE um 8:30: „Jetzt · Morgens" steht vorne, danach Jederzeit, Mittags, Abends',
      k[0] === 'Jetzt · Morgens' && k.filter(x => x !== 'Jetzt · Morgens').join('|') === ['Jederzeit', 'Mittags', 'Abends'].filter(x => k.indexOf(x) >= 0).join('|'), k.join('|'));
    await p.close();
  }

  console.log('\n── 1b. Aufgaben nach Tageszeit, eigene Aufgabe (Mitarbeiter, 19:30) ──');
  {
    const p = await demo(b, 'mitarbeiter', heute(19), 390, 844);
    await zuAufgaben(p);
    const opt = await p.evaluate(() => [...document.querySelectorAll('#todoSort option')].map(o => o.value));
    pruefe('die Aufgaben-Sortierung kennt „Nach Tageszeit"', opt.indexOf('tageszeit') >= 0, opt.join(','));
    await sortieren(p, 'todoSort', 'tageszeit');
    const z = await p.evaluate(() => [...document.querySelectorAll('#todoArea .todo')].map(t => ({
      done: t.classList.contains('done'), zeit: (t.querySelector('.t-zeit') || {}).textContent || '' })));
    const offen = z.filter(x => !x.done);
    const ersteNichtAbend = offen.findIndex(x => x.zeit !== 'Abends');
    const letzterAbend = offen.map(x => x.zeit).lastIndexOf('Abends');
    pruefe('offene Abendaufgaben stehen vor allen anderen offenen', offen.length > 1 && (letzterAbend < 0 || ersteNichtAbend < 0 || letzterAbend < ersteNichtAbend),
      JSON.stringify(offen.map(x => x.zeit || '-')));
    pruefe('… und tragen die Marke „Abends"', offen.some(x => x.zeit === 'Abends'), JSON.stringify(z));
    const eigen = await p.evaluate(async () => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      document.getElementById('todoNew').click(); await w(400);
      const vor = document.getElementById('otZeit').value;
      document.getElementById('otTitle').value = 'Tageszeit-Probe Kaffee auffüllen';
      document.getElementById('otZeit').value = 'morgens';
      document.getElementById('otSave').click(); await w(800);
      const sk = document.getElementById('otStudio').value;
      const d = (await firebase.firestore().collection('firmen/koerperformen/studios/' + sk + '/todos').get()).docs
        .map(x => x.data()).find(x => x.title === 'Tageszeit-Probe Kaffee auffüllen');
      return { vor, d };
    });
    pruefe('eigene Aufgabe: das Feld steht zuerst auf „Jederzeit"', eigen.vor === '', eigen.vor);
    pruefe('… mit „Morgens" angelegt → gespeichert mit tageszeit: morgens', eigen.d && eigen.d.tageszeit === 'morgens', JSON.stringify(eigen.d));
    await messen(p, 'Eigene Aufgabe', ['#otZeit', '#otSave'], async () => {
      const m = document.getElementById('ownTodoModal');
      if (getComputedStyle(m).display === 'none') document.getElementById('todoNew').click();
      await new Promise(r => setTimeout(r, 200));
    });
    pruefe('ohne Skriptfehler (Mitarbeiter)', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 2. Studio-Zuordnung (Geschäftsführung, Attrappe) ──');
  {
    /* Hürth = studio-6, Brühl = studio-7 (die Studioliste der Attrappe).
       Die Konten stehen von Anfang an in der Nutzerliste — so, wie die
       App sie aus der Datenbank bekäme. */
    const r = { st: [{ key: 'studio-6', name: 'Hürth' }, { key: 'studio-7', name: 'Brühl' }, { key: 'studio-7', name: 'Brühl' }] };
    const KONTEN = [
      { id: 'testuid', firma: 'koerperformen', name: 'Test Chef', role: 'chef', studios: ['Hürth', 'Brühl'] },
      { id: 'u2', firma: 'koerperformen', name: 'Anna Meier', role: 'mitarbeiter', studios: ['Hürth'], studioKeys: ['studio-6'] },
      { id: 'z-ohne', uid: 'z-ohne', firma: 'koerperformen', name: 'Zara Ohnekennung', role: 'mitarbeiter', aktiv: true, studios: ['Hürth'] },
      { id: 'z-falsch', uid: 'z-falsch', firma: 'koerperformen', name: 'Zeno Falsch', role: 'mitarbeiter', aktiv: true, studios: ['Hürth'], studioKeys: ['studio-7'] },
      { id: 'z-alt', uid: 'z-alt', firma: 'koerperformen', name: 'Zoe Altname', role: 'leiter', aktiv: true, studios: ['Studio, das es nicht mehr gibt'], studioKeys: ['studio-7'] },
      { id: 'z-gut', uid: 'z-gut', firma: 'koerperformen', name: 'Zack Passt', role: 'mitarbeiter', aktiv: true, studios: ['Hürth'], studioKeys: ['studio-6'] }
    ];
    const q = await b.newPage({ viewport: { width: 1440, height: 900 } });
    const fe2 = []; q.on('pageerror', e => fe2.push(e.message.slice(0, 160)));
    await q.route('**://www.gstatic.com/**', r2 => r2.abort());
    await q.route('**fonts.googleapis.com/**', r2 => r2.abort());
    await q.route('**script.google.com/**', r2 => r2.fulfill({ status: 200, body: 'ok' }));
    await q.addInitScript((k) => { window.__users = k; }, KONTEN);
    await q.addInitScript({ path: path.join(SP, 'stub-chef.js') });
    await q.goto(APP, { waitUntil: 'domcontentloaded' });
    await q.waitForTimeout(3000);
    const k = await q.evaluate(async () => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      const s = (sel) => [...document.querySelectorAll(sel)].find(e => e.offsetParent);
      const g = s('[data-group="g-chef"]'); if (g) { g.click(); await w(700); }
      const ue = document.querySelector('#chefHome [data-cgo="ueberblick"]'); if (ue) { ue.click(); await w(900); }
      const att = (document.getElementById('attList') || document.getElementById('chefAttention') || document.body).textContent;
      const t = document.querySelector('[data-ctab="team"]'); if (t) { t.click(); await w(900); }
      const karte = document.getElementById('zuordKarte');
      return { att: /3 Konten können keine Aufgaben anlegen/.test(att), sichtbar: !!karte && !karte.hidden && !!karte.offsetParent,
               text: karte ? karte.textContent.replace(/\s+/g, ' ') : '' };
    });
    pruefe('Übersicht: „3 Konten können keine Aufgaben anlegen"', k.att);
    pruefe('Team: die Karte „Studio-Zuordnung unvollständig" ist da', k.sichtbar, k.text.slice(0, 120));
    pruefe('… mit allen drei Fällen (fehlt / passt nicht / Name veraltet)',
      /Zara Ohnekennung.*Kennung fehlt/.test(k.text) && /Zeno Falsch.*Kennung passt nicht/.test(k.text) && /Zoe Altname.*Studioname veraltet/.test(k.text), k.text);
    pruefe('GEGENPROBE: das passende Konto steht nicht drin', !/Zack Passt/.test(k.text));
    await messen(q, 'Zuordnung', ['#zuordReparieren']);
    await q.setViewportSize({ width: 1440, height: 900 });
    const rep = await q.evaluate(async () => {
      window.__schreib = [];
      document.getElementById('zuordReparieren').click();
      await new Promise(r => setTimeout(r, 600));
      return (window.__schreib || []).filter(x => /^users\//.test(x.pfad));
    });
    const von = (uid) => (rep.find(x => x.pfad === 'users/' + uid) || {}).daten;
    pruefe('reparieren: fehlende Kennung aus dem Namen', JSON.stringify(von('z-ohne')) === JSON.stringify({ studioKeys: [r.st[0].key] }), JSON.stringify(von('z-ohne')));
    pruefe('… falsche Kennung aus dem Namen', JSON.stringify(von('z-falsch')) === JSON.stringify({ studioKeys: [r.st[0].key] }), JSON.stringify(von('z-falsch')));
    pruefe('… veralteter Name aus der Kennung', von('z-alt') && von('z-alt').studios[0] === r.st[2].name && von('z-alt').studio === r.st[2].name, JSON.stringify(von('z-alt')));
    pruefe('… und sonst nichts (kein Schreiben ans passende Konto)', rep.length === 3 && !von('z-gut'), rep.map(x => x.pfad).join(', '));
    pruefe('ohne Skriptfehler (Zuordnung)', !fe2.length, fe2.join(' | '));
    await q.close();
  }

  console.log('\n── 3. Die Meldung beim Mitarbeiter ──');
  {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    const fe = []; p.on('pageerror', e => fe.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.route('**fonts.googleapis.com/**', r => r.abort());
    await p.addInitScript({ path: path.join(SP, 'stub-mitarbeiter.js') });
    await p.addInitScript(() => {
      /* Die Datenbank lehnt das Anlegen ab — so, wie sie es bei einem
         Konto ohne passende Studio-Kennung tut. */
      const warte = setInterval(() => {
        if (!window.firebase || !window.firebase.firestore) return;
        clearInterval(warte);
        const fs = window.firebase.firestore();
        /* Jede Sammlung, auch verschachtelt (studios/<k>/todos), läuft
           durch huelle(); eine, die auf „todos" endet, lehnt add() ab. */
        function huelle(c, pfad) {
          if (!c || c.__gehuellt) return c;
          c.__gehuellt = true;
          if (/todos$/.test(pfad)) {
            c.add = function () { const e = new Error('Missing or insufficient permissions.'); e.code = 'permission-denied'; return Promise.reject(e); };
          }
          const altDoc = c.doc && c.doc.bind(c);
          if (altDoc) c.doc = function (id) {
            const d = altDoc(id);
            const altSub = d.collection && d.collection.bind(d);
            if (altSub) d.collection = function (sub) { return huelle(altSub(sub), pfad + '/' + id + '/' + sub); };
            return d;
          };
          return c;
        }
        const alt = fs.collection.bind(fs);
        fs.collection = function (pfad) { return huelle(alt(pfad), String(pfad)); };
      }, 1);
    });
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3000);
    const t = await p.evaluate(async () => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      const s = (sel) => [...document.querySelectorAll(sel)].find(e => e.offsetParent);
      const g = s('[data-group="g-arbeit"]'); if (g) { g.click(); await w(600); }
      const v = s('[data-subview="todos"]'); if (v) { v.click(); await w(800); }
      document.getElementById('todoNew').click(); await w(400);
      document.getElementById('otTitle').value = 'Probe';
      document.getElementById('otSave').click(); await w(600);
      return document.getElementById('toast').textContent;
    });
    pruefe('abgelehnt: die Meldung sagt, woran es liegt und wer es behebt',
      /diesem Studio noch nicht zugeordnet.*Verwaltung → Team.*Zuordnung reparieren/.test(t), t);
    pruefe('ohne Skriptfehler (Meldung)', !fe.length, fe.join(' | '));
    await p.close();
  }

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Tageszeit und Zuordnung: was jetzt dran ist, steht oben; wer nicht anlegen kann, wird gefunden — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
