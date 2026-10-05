/* ══════════════════════════════════════════════════════════════════════
   WENN DAS NETZ AUSFÄLLT (Runde 139)

   Aus dem Betrieb, 4.10.2026: „eigentlich hat jedes Studio Netz, aber
   man weiss ja nie, wo und wann es ausfällt" — und zum Terminal ohne
   Netz mit Vermerk: „doch".

   1. Speichern ohne Netz bleibt nicht hängen (lokalAbwarten):
      · ohne Netz kommt die Antwort nach ~1,5 s, mit dem Ersatzwert;
        oben steht „1 Änderung wartet"; eine ehrliche Meldung
      · GEGENPROBE mit Netz und schneller Antwort: sofort, unverändert,
        keine Leiste
      · kommt die Bestätigung später: Leiste weg, „Alles nachgereicht ✓"
      · scheitert das Nachreichen: die App sagt es
      · ein Fehler mit Netz geht wie bisher an die aufrufende Stelle
   2. Terminal ohne Netz:
      · der Stempel wird gemerkt (kein Aufruf), die PIN liegt NICHT im
        localStorage, oben steht „1 Stempel wartet", an der Person
        „Stempel wartet auf Netz"
      · wieder Netz → nachgeschickt mit offlineTs = Zeit des Merkens und
        offlineId; danach ist nichts mehr offen
      · lehnt der Server ab (falsche PIN) → „Nicht gespeichert: …" bleibt
        stehen, bis „Verstanden"
      · Netz da, aber keine Antwort („Failed to fetch") → ebenfalls gemerkt
   3. Der Vermerk „ohne Netz erfasst · angekommen …" steht am Stempel in
      „Meine Zeiten" (Demo).
   4. Fingerziele ≥ 44 × 44 („Verstanden") bei 320–1920 px, normal und
      kompakt; nichts ragt hinaus.

   Was hier NICHT geprüft werden kann, und das steht auch im Bericht: das
   echte Datenbank-Programm lädt in dieser Umgebung nicht. Dass es seine
   Warteschlange nach dem Ausfall wirklich abarbeitet, zeigt erst ein
   Test vor Ort (Prüfliste in docs/FORTSCHRITT.md, Runde 139).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 240) : '')); }
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
/* Das Netz lässt sich hier umschalten: navigator.onLine liest
   window.__netz, und die Ereignisse feuern wie im Browser. */
const NETZ = `
  window.__netz = true;
  Object.defineProperty(Navigator.prototype, 'onLine', { configurable: true, get: function(){ return window.__netz; } });
  window.__netzAus = function(){ window.__netz = false; window.dispatchEvent(new Event('offline')); };
  window.__netzAn  = function(){ window.__netz = true;  window.dispatchEvent(new Event('online')); };
`;
/* Dieselbe Terminal-Attrappe wie in test-terminal.js — von dort gelesen,
   nicht abgeschrieben: zwei Fassungen liefen sonst auseinander. */
const ZUSATZ = eval('`' + /const ZUSATZ = `([\s\S]*?)`;/.exec(fs.readFileSync(path.join(__dirname, 'test-terminal.js'), 'utf8'))[1] + '`');

async function starten(b, vorbereiten, w, h) {
  const p = await b.newPage({ viewport: { width: w || 900, height: h || 1000 } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await p.addInitScript({ content: NETZ });
  await p.addInitScript({ path: SP + '/stub-chef.js' });
  if (vorbereiten) await p.addInitScript({ content: vorbereiten });
  await p.addInitScript({ content: ZUSATZ });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  return p;
}
const toastText = (p) => p.evaluate(() => (document.getElementById('toast') || {}).textContent || '');
const leiste = (p) => p.evaluate(() => { const l = document.getElementById('offlineBar');
  return { da: l.classList.contains('show'), text: l.textContent }; });

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. Speichern ohne Netz ──');
  {
    const p = await starten(b, null);
    pruefe('der Baustein ist da', await p.evaluate(() => typeof window.__lokalAbwarten === 'function'));
    const schnell = await p.evaluate(async () => {
      const t0 = Date.now(); const v = await window.__lokalAbwarten(Promise.resolve('echt'), 'ersatz');
      return { v, ms: Date.now() - t0, bar: document.getElementById('offlineBar').classList.contains('show') };
    });
    pruefe('GEGENPROBE mit Netz und schneller Antwort: sofort, unverändert, keine Leiste',
      schnell.v === 'echt' && schnell.ms < 200 && !schnell.bar, JSON.stringify(schnell));
    const fehlerMitNetz = await p.evaluate(async () => {
      try { await window.__lokalAbwarten(Promise.reject(new Error('permission-denied')), 'x'); return 'durch'; }
      catch (e) { return e.message; }
    });
    pruefe('ein Fehler mit Netz geht wie bisher an die aufrufende Stelle', fehlerMitNetz === 'permission-denied', fehlerMitNetz);

    await p.evaluate(() => { window.__netzAus(); });
    const ohne = await p.evaluate(async () => {
      let los; window.__haengt = new Promise((r) => { los = r; }); window.__los = los;
      const t0 = Date.now(); const v = await window.__lokalAbwarten(window.__haengt, 'ersatz');
      return { v, ms: Date.now() - t0 };
    });
    pruefe('ohne Netz: Antwort nach ~1,5 s mit dem Ersatzwert, statt zu hängen', ohne.v === 'ersatz' && ohne.ms >= 1400 && ohne.ms < 2500, JSON.stringify(ohne));
    await p.waitForTimeout(150);
    let l = await leiste(p);
    pruefe('… oben steht „1 Änderung wartet auf diesem Gerät"', l.da && /1 Änderung wartet auf diesem Gerät/.test(l.text), l.text);
    pruefe('… und eine ehrliche Meldung', /Ohne Netz auf dem Gerät gemerkt/.test(await toastText(p)), await toastText(p));

    await p.evaluate(() => { window.__netzAn(); });
    await p.waitForTimeout(100);
    pruefe('wieder online: „1 Änderung wird nachgereicht …"', /1 Änderung wird nachgereicht/.test(await toastText(p)), await toastText(p));
    await p.evaluate(() => { window.__los('angekommen'); });
    await p.waitForTimeout(200);
    l = await leiste(p);
    pruefe('kommt die Bestätigung: Leiste weg, „Alles nachgereicht ✓"', !l.da && /Alles nachgereicht/.test(await toastText(p)), l.text + ' / ' + await toastText(p));

    await p.evaluate(() => { window.__netzAus(); });
    await p.evaluate(async () => {
      let nein; const h = new Promise((_, r) => { nein = r; }); window.__nein = nein;
      await window.__lokalAbwarten(h, null);
    });
    await p.evaluate(() => { window.__netzAn(); window.__nein(new Error('Keine Berechtigung.')); });
    await p.waitForTimeout(200);
    pruefe('scheitert das Nachreichen: die App sagt es', /ließ sich nicht nachreichen.*Keine Berechtigung/.test(await toastText(p)), await toastText(p));
    pruefe('… und die Leiste zählt nichts mehr', !(await leiste(p)).da);
    pruefe('ohne Skriptfehler (1)', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 2. Terminal ohne Netz ──');
  {
    const vor = `
      try { localStorage.setItem('kf_terminal', JSON.stringify({ id:'t1', geheim:'b'.repeat(64), name:'Empfang' })); } catch(e){}
      window.__terminals = [{ id:'t1', studioKey:'studio-6', name:'Empfang', letzterStempel:0 }];
      window.__zeiten = [];
    `;
    const p = await starten(b, vor);
    const stempeln = (wer) => p.evaluate(async (wer) => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      const k = [...document.querySelectorAll('#tmListe [data-tmwer]')].find(x => x.textContent.indexOf(wer) >= 0);
      k.click(); await w(250);
      for (const t of ['1', '2', '3', '4']) document.querySelector('#tmTasten [data-tmt="' + t + '"]').click();
      document.querySelector('#tmTasten [data-tmt="ok"]').click(); await w(500);
    }, wer);
    await p.evaluate(() => { window.__aufrufe = []; window.__netzAus(); });
    const t0 = Date.now();
    await stempeln('Anna Meier');
    const a = await p.evaluate(() => ({
      aufrufe: (window.__aufrufe || []).filter(x => x.name === 'stempeln').length,
      pinZu: getComputedStyle(document.getElementById('tmPin')).display === 'none',
      ws: JSON.parse(sessionStorage.getItem('kf_stempelOhneNetz') || '[]'),
      lokal: (() => { try { return Object.keys(localStorage).filter(k => /stempel/i.test(k)); } catch (e) { return ['?']; } })(),
      hinweis: (document.querySelector('#tmListe .tm-ws') || {}).textContent || '',
      stand: [...document.querySelectorAll('#tmListe [data-tmwer]')].filter(x => /Anna Meier/.test(x.textContent)).map(x => x.querySelector('.tm-zst').textContent)[0],
      toast: document.getElementById('toast').textContent
    }));
    pruefe('ohne Netz: kein Aufruf, der Stempel ist gemerkt', a.aufrufe === 0 && a.ws.length === 1 && a.ws[0].pin === '1234', JSON.stringify(a.ws));
    pruefe('… mit der Zeit des Tippens', a.ws[0] && Math.abs(a.ws[0].ts - t0) < 3000);
    pruefe('… die PIN liegt NICHT im localStorage', !a.lokal.length, JSON.stringify(a.lokal));
    pruefe('… das Tastenfeld ist zu, die Meldung sagt „Seite bitte offen lassen"', a.pinZu && /Ohne Netz gemerkt: Anna Meier.*offen lassen/.test(a.toast), a.toast);
    pruefe('… oben „1 Stempel wartet", an der Person „Stempel wartet auf Netz"', /1 Stempel wartet/.test(a.hinweis) && a.stand === 'Stempel wartet auf Netz', a.hinweis + ' / ' + a.stand);

    const t1 = await p.evaluate(async () => {
      window.__fnAntwort.stempeln = { ok: true, art: 'kommen', ts: 1, name: 'Anna Meier', ohneNetz: true };
      window.__netzAn(); await new Promise(r => setTimeout(r, 600));
      const c = (window.__aufrufe || []).filter(x => x.name === 'stempeln');
      return { c, ws: JSON.parse(sessionStorage.getItem('kf_stempelOhneNetz') || '[]'),
               hinweis: (document.querySelector('#tmListe .tm-ws') || {}).textContent || '',
               toast: document.getElementById('toast').textContent };
    });
    const d = (t1.c[0] || {}).data || {};
    pruefe('wieder Netz: nachgeschickt mit offlineTs = Zeit des Merkens und offlineId', t1.c.length === 1 &&
      d.offlineTs === a.ws[0].ts && d.offlineId === a.ws[0].id && d.pin === '1234' && d.uid, JSON.stringify(d));
    pruefe('… danach ist nichts mehr offen, „Nachgereicht … ✓"', !t1.ws.length && !t1.hinweis && /Nachgereicht: Kommen um .* ✓ — Anna Meier/.test(t1.toast), t1.toast);

    // Ablehnung beim Nachreichen
    await p.evaluate(() => { window.__aufrufe = []; window.__netzAus(); });
    await stempeln('Ben Kraus');
    const t2 = await p.evaluate(async () => {
      window.__fnAntwort.stempeln = { fehler: 'Falsche PIN. Noch 4 Versuche.' };
      window.__netzAn(); await new Promise(r => setTimeout(r, 600));
      const pr = document.querySelector('#tmListe .tm-ws.problem');
      return { text: pr ? pr.textContent : '', ws: JSON.parse(sessionStorage.getItem('kf_stempelOhneNetz') || '[]') };
    });
    pruefe('lehnt der Server ab: „Nicht gespeichert: Ben Kraus … Falsche PIN … Leitung"', /Nicht gespeichert: Ben Kraus.*Falsche PIN.*Leitung nachtragen/.test(t2.text) && !t2.ws.length, t2.text);

    for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      await p.setViewportSize({ width: w, height: h });
      await p.waitForTimeout(200);
      for (const dichte of ['normal', 'kompakt']) {
        await p.evaluate((dd) => { document.body.dataset.dichte = dd; }, dichte);
        const m = await p.evaluate(async (SRC) => {
          const T = eval('(' + SRC + ')'); const el = document.querySelector('[data-tmwsok]');
          el.scrollIntoView({ block: 'center' });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          return { t: T(el), quer: document.documentElement.scrollWidth - innerWidth };
        }, TREFFER.toString());
        pruefe(w + ' px ' + dichte + ': „Verstanden" trifft ' + m.t.w + '×' + m.t.h + ', nichts ragt hinaus', m.t.w >= 44 && m.t.h >= 44 && m.quer <= 0, JSON.stringify(m));
      }
    }
    await p.setViewportSize({ width: 900, height: 1000 });
    await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
    const weg = await p.evaluate(async () => { document.querySelector('[data-tmwsok]').click(); await new Promise(r => setTimeout(r, 200));
      return !document.querySelector('#tmListe .tm-ws.problem') && JSON.parse(sessionStorage.getItem('kf_stempelProbleme') || '[]').length === 0; });
    pruefe('„Verstanden" räumt den Hinweis weg', weg);

    // Netz da, aber keine Antwort
    const t3 = await p.evaluate(async () => {
      window.__aufrufe = []; window.__fnAntwort.stempeln = { fehler: 'Failed to fetch' };
      const k = [...document.querySelectorAll('#tmListe [data-tmwer]')].find(x => /Anna Meier/.test(x.textContent));
      k.click(); await new Promise(r => setTimeout(r, 250));
      for (const t of ['1', '2', '3', '4']) document.querySelector('#tmTasten [data-tmt="' + t + '"]').click();
      document.querySelector('#tmTasten [data-tmt="ok"]').click(); await new Promise(r => setTimeout(r, 600));
      return { ws: JSON.parse(sessionStorage.getItem('kf_stempelOhneNetz') || '[]').length, toast: document.getElementById('toast').textContent };
    });
    pruefe('Netz da, aber keine Antwort („Failed to fetch"): ebenfalls gemerkt', t3.ws === 1 && /Ohne Netz gemerkt/.test(t3.toast), JSON.stringify(t3));
    /* Runde 141: beim Beenden warnt das Terminal vor wartenden Stempeln
       und räumt sie samt PIN weg. */
    let frage = '';
    p.once('dialog', d => { frage = d.message(); d.accept(); });
    const ende = await p.evaluate(async () => {
      document.getElementById('tmAus').click(); await new Promise(r => setTimeout(r, 400));
      return { ws: sessionStorage.getItem('kf_stempelOhneNetz'), pr: sessionStorage.getItem('kf_stempelProbleme') };
    });
    pruefe('„Terminal beenden" warnt: „1 Stempel wartet … (Anna Meier) … gehen sie verloren"', /1 Stempel wartet.*Anna Meier.*verloren/s.test(frage), frage);
    pruefe('… und räumt die gemerkten Stempel samt PIN weg', !ende.ws && !ende.pr, JSON.stringify(ende));
    pruefe('ohne Skriptfehler (2)', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 3. Der Vermerk am Stempel (Demo) ──');
  {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    const fe = []; p.on('pageerror', e => fe.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
    await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    const v = await p.evaluate(async () => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      const jetzt = Date.now(), tag = new Date().toLocaleDateString('sv-SE');
      await firebase.firestore().collection('firmen/koerperformen/zeiten').add({ uid: 'demo-ich', name: 'Ich', studioKey: 'studio-0',
        art: 'kommen', ts: jetzt - 3 * 3600000, tag: tag, monat: tag.slice(0, 7), quelle: 'terminal', terminalName: 'Empfang',
        ohneNetz: true, empfangen: jetzt - 600000, offlineId: 'o-test' });
      const g = document.querySelector('.mobnav [data-group="g-ich"]'); if (g) { g.click(); await w(600); }
      const t = document.querySelector('[data-ichtab="daten"]'); if (t) { t.click(); await w(1200); }
      const z = document.querySelector('#ichZeitenListe [data-ztag="' + tag + '"]');
      if (!z) return { fehlt: true };
      if (z.getAttribute('aria-expanded') !== 'true') z.click();
      await w(300);
      const box = document.getElementById('mzs-' + tag);
      return { text: box ? box.textContent.replace(/\s+/g, ' ') : '' };
    });
    pruefe('in „Meine Zeiten": „ohne Netz erfasst · angekommen …" am Stempel', /ohne Netz erfasst · angekommen (heute )?\d{2}:\d{2}/.test(v.text || ''), JSON.stringify(v));
    pruefe('ohne Skriptfehler (3)', !fe.length, fe.join(' | '));
    await p.close();
  }

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Ohne Netz: nichts hängt, nichts geht still verloren, das Terminal stempelt weiter — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
