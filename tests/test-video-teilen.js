/* ══ VIDEO TEILEN (Runde 308) ═══════════════════════════════════════
   Aus dem Betrieb, 26.11.2026 (Marcel): „das man videos hochladen kann
   in der app und dann einen link schicken oder teilen kann mit dem sich
   JEDER das video angucken kann auch ohne account oder registrierung
   oder irgendwas aber nur mit dem link halt". Auf Nachfrage: nur die
   Leitung; 7 / 30 Tage / bis zurückgezogen (Standard 30); bis 5 GB.

   Teil A – in der App (Demo, Chef):
    1. Unter Dokumente steht „Video teilen"; 30 Tage ist vorgewählt.
    2. „7 Tage" wählen, Video hochladen: Fortschritt, danach ein Link
       /v/<24 Zeichen> mit „Link kopieren" und „Teilen …".
    3. In der Datenbank steht freigaben/<Kennung> mit genau firma, titel,
       pfad (unter dieser Kennung), bis (≈ 7 Tage), aktiv, vonUid, ts,
       groesse – kein Name.
    4. Die Liste zeigt das Video; „Zurückziehen" fragt einmal nach und
       löscht dann Dokument UND Datei.
    5. Keine Videodatei → klare Meldung, kein Link.
    6. Mitarbeiter sehen die Karte nicht.
    7. Trefferflächen (Hit-Test) bei 320 / 390 / 430 / 820 / 1280 / 1440
       / 1920, normal und kompakt: alle Knöpfe der Karte ≥ 44 × 44, im
       Bild, kein Querscrollen.
   Teil B – die Seite für den Link (v.html, ohne Anmeldung):
    8. gültige Freigabe: Titel, Video aus dem Speicher OHNE Schlüssel
       (…/o/<Pfad>?alt=media), „gilt bis …"; nur die zwei erlaubten Hosts.
    9. nicht vorhanden / zurückgezogen / abgelaufen / Link kaputt:
       jeweils ein klarer Satz, kein Video.
   10. 320 und 1920 px: nichts ragt hinaus.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const BASIS = APP.replace(/index\.html.*$/, '');

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
const VIDEO = { name: 'erstes-training.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(4096, 7) };

async function demo(b, rolle, w, h, dichte) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((d) => {
    localStorage.setItem('kf_tour', '99:demo-ich'); window.confirm = () => true; window.__demoHochladenMs = 20;
    if (d) localStorage.setItem('kf_prefs', JSON.stringify({ dichte: d }));
  }, dichte || null);
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  p._ctx = ctx;
  return p;
}
const zuDokumenten = (p) => p.evaluate(async () => {
  const w = ms => new Promise(r => setTimeout(r, ms));
  const g = document.getElementById('bereichKopf');
  if (g && g.offsetParent && g.getAttribute('aria-expanded') !== 'true') { g.click(); await w(700); }
  const z = [...document.querySelectorAll('[data-alles="docs"]')].find(e => e.offsetParent);
  if (!z) return false;
  z.click(); await w(1200);
  const k = document.getElementById('vtKarte');
  if (k && !k.hidden && k.classList.contains('zu')) { k.querySelector('.fold-head').click(); await w(500); }
  return true;
});

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── A 1–4 Chef: hochladen, Link, zurückziehen ──');
    let p = await demo(b, 'chef', 1440, 900);
    pruefe('„Dokumente" erreichbar', await zuDokumenten(p));
    const a1 = await p.evaluate(() => {
      const k = document.getElementById('vtKarte');
      return { da: !!k && !k.hidden && k.getClientRects().length > 0,
        dauer: [...document.querySelectorAll('#vtDauer [data-vtdauer]')].map(x => x.textContent.trim() + (x.classList.contains('on') ? '*' : '')) };
    });
    pruefe('„Video teilen" steht da; 7 Tage / 30 Tage (vorgewählt) / Bis ich ihn zurückziehe',
      a1.da && a1.dauer.join('|') === '7 Tage|30 Tage*|Bis ich ihn zurückziehe', JSON.stringify(a1));
    await p.evaluate(() => { document.querySelector('[data-vtdauer="7"]').click(); document.getElementById('vtTitel').value = 'Dein erstes Training'; });
    await p.setInputFiles('#vtDatei', VIDEO);
    await p.waitForTimeout(150);
    const lade = await p.evaluate(() => ({ lade: !document.getElementById('vtLade').hidden, gesperrt: document.getElementById('vtWahl').disabled }));
    pruefe('während des Hochladens: Fortschritt sichtbar, Knopf gesperrt', lade.lade && lade.gesperrt, JSON.stringify(lade));
    await p.waitForFunction(() => !document.getElementById('vtFertig').hidden, null, { timeout: 8000 }).catch(() => {});
    const a2 = await p.evaluate(() => ({ link: document.getElementById('vtLink').value,
      knoepfe: [...document.querySelectorAll('#vtFertig button')].map(x => x.textContent.trim()) }));
    const m = /\/v\/([A-Za-z0-9]{24})$/.exec(a2.link);
    pruefe('danach ein Link /v/<24 Zeichen> mit „Link kopieren" und „Teilen …"', !!m && a2.knoepfe.join('|') === 'Link kopieren|Teilen …', JSON.stringify(a2));
    const id = m && m[1];
    const doc = id ? await p.evaluate(async (id) => { const d = await firebase.firestore().collection('freigaben').doc(id).get(); return d.exists ? d.data() : null; }, id) : null;
    const tage = doc ? (doc.bis - Date.now()) / 86400000 : 0;
    pruefe('in der Datenbank: freigaben/<Kennung> mit genau den erlaubten Feldern, kein Name',
      !!doc && Object.keys(doc).sort().join(',') === 'aktiv,bis,firma,groesse,pfad,titel,ts,vonUid', doc && Object.keys(doc).join(','));
    pruefe('… Pfad unter dieser Kennung, Titel, aktiv, gilt etwa 7 Tage',
      !!doc && doc.pfad === 'firmen/' + doc.firma + '/freigaben/' + id + '/erstes-training.mp4' && doc.titel === 'Dein erstes Training' && doc.aktiv === true && tage > 6.9 && tage < 7.1,
      doc && JSON.stringify({ pfad: doc.pfad, titel: doc.titel, tage: tage.toFixed(2) }));
    await p.waitForTimeout(400);
    const zeile = await p.evaluate(() => [...document.querySelectorAll('#vtListe .vt-zeile')].map(z => z.textContent.replace(/\s+/g, ' ').trim()));
    pruefe('die Liste zeigt „Dein erstes Training · gilt bis …"', zeile.length === 1 && /Dein erstes Training/.test(zeile[0]) && /gilt bis/.test(zeile[0]), zeile.join(' / '));
    await p.evaluate((id) => { window.__demoGeloescht = []; document.querySelector('[data-vtweg="' + id + '"]').click(); }, id);
    await p.waitForTimeout(250);
    const frage = await p.evaluate((id) => document.querySelector('[data-vtweg="' + id + '"]').textContent.trim(), id);
    const nochDa = await p.evaluate(async (id) => (await firebase.firestore().collection('freigaben').doc(id).get()).exists, id);
    pruefe('„Zurückziehen" fragt erst „Wirklich zurückziehen?" – noch nichts gelöscht', frage === 'Wirklich zurückziehen?' && nochDa, frage);
    await p.evaluate((id) => document.querySelector('[data-vtweg="' + id + '"]').click(), id);
    await p.waitForTimeout(800);
    const weg = await p.evaluate(async (id) => { const d = await firebase.firestore().collection('freigaben').doc(id).get();
      return { doc: d.exists, aktiv: d.exists ? d.data().aktiv : null, datei: window.__demoGeloescht || [] }; }, id);
    /* Seit 26.11.2026: Zurückziehen löscht das Video, behält aber den
       Eintrag – mit der Liste, wer geschaut hat. */
    pruefe('… dann ist die Datei weg, der Eintrag bleibt als „zurückgezogen"', weg.doc && weg.aktiv === false && weg.datei.length === 1 && weg.datei[0] === doc.pfad, JSON.stringify(weg));

    console.log('\n── A 4b Wer hat geschaut? ──');
    await p.evaluate(async (id) => {
      const c = firebase.firestore().collection('freigaben').doc(id).collection('aufrufe');
      await c.doc('Aufruf1aaaaaaaaaaaaa').set({ vorname: 'Erika', nachname: 'Muster', ts: Date.now() - 3600000 });
      await c.doc('Aufruf2aaaaaaaaaaaaa').set({ vorname: 'Max', nachname: 'Beispiel', ts: Date.now() - 60000 });
    }, id);
    await p.waitForTimeout(300);
    const z2 = await p.evaluate(() => [...document.querySelectorAll('#vtListe .vt-zeile')].map(z => z.textContent.replace(/\s+/g, ' ').trim()));
    pruefe('die Zeile sagt „zurückgezogen" und bietet „Wer hat geschaut?" und „Entfernen"', z2.length === 1 && /zurückgezogen/.test(z2[0]) && /Wer hat geschaut\?/.test(z2[0]) && /Entfernen/.test(z2[0]) && !/Link kopieren/.test(z2[0]), z2.join(' / '));
    await p.evaluate((id) => document.querySelector('[data-vtwer="' + id + '"]').click(), id);
    await p.waitForTimeout(600);
    const wer = await p.evaluate(() => { const w = document.querySelector('#vtListe .vt-wer');
      return w ? { t: w.querySelector('.hint').textContent, namen: [...w.querySelectorAll('li b')].map(x => x.textContent), zeit: [...w.querySelectorAll('li i')].map(x => x.textContent) } : null; });
    pruefe('aufgeklappt: „2 Personen haben das Video geöffnet", der Neueste zuerst', !!wer && /2 Personen/.test(wer.t) && wer.namen.join('|') === 'Max Beispiel|Erika Muster', JSON.stringify(wer));
    pruefe('… mit Datum und Uhrzeit', !!wer && wer.zeit.every(x => /\d+\.\d+\.\d+, \d\d:\d\d/.test(x)), wer && wer.zeit.join(' | '));
    await p.evaluate((id) => document.querySelector('[data-vtweg="' + id + '"]').click(), id);
    await p.waitForTimeout(250);
    const frage2 = await p.evaluate((id) => document.querySelector('[data-vtweg="' + id + '"]').textContent.trim(), id);
    pruefe('„Entfernen" fragt erst „Wirklich entfernen?"', frage2 === 'Wirklich entfernen?', frage2);
    await p.evaluate((id) => document.querySelector('[data-vtweg="' + id + '"]').click(), id);
    await p.waitForTimeout(800);
    const ganz = await p.evaluate(async (id) => ({ doc: (await firebase.firestore().collection('freigaben').doc(id).get()).exists,
      namen: (await firebase.firestore().collection('freigaben').doc(id).collection('aufrufe').get()).size,
      liste: document.querySelectorAll('#vtListe .vt-zeile').length }), id);
    pruefe('… dann sind Eintrag und Namensliste weg', !ganz.doc && ganz.namen === 0 && ganz.liste === 0, JSON.stringify(ganz));

    console.log('\n── A 5 keine Videodatei ──');
    await p.setInputFiles('#vtDatei', { name: 'liste.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') });
    await p.waitForTimeout(300);
    const a5 = await p.evaluate(() => ({ text: document.getElementById('vtHinweis').textContent, link: !document.getElementById('vtFertig').hidden }));
    pruefe('„… ist keine Videodatei", kein Link', /keine Videodatei/.test(a5.text) && !a5.link, JSON.stringify(a5));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();

    console.log('\n── A 6 Mitarbeiter ──');
    p = await demo(b, 'mitarbeiter', 1440, 900);
    await zuDokumenten(p);
    pruefe('Mitarbeiter sehen „Video teilen" nicht', await p.evaluate(() => { const k = document.getElementById('vtKarte'); return !k || k.hidden || !k.getClientRects().length; }));
    await p._ctx.close();

    console.log('\n── A 7 Trefferflächen, normal und kompakt ──');
    for (const dichte of ['normal', 'kompakt']) {
      for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
        p = await demo(b, 'chef', w, h, dichte);
        await zuDokumenten(p);
        await p.setInputFiles('#vtDatei', VIDEO);
        await p.waitForFunction(() => !document.getElementById('vtFertig').hidden, null, { timeout: 8000 }).catch(() => {});
        await p.waitForTimeout(400);
        const mm = await p.evaluate(async (T) => {
          const f = new Function('return ' + T)();
          const r = [];
          const sel = '#vtKarte .fold-head, #vtDauer [data-vtdauer], #vtWahl, #vtKopie, #vtTeilen, #vtListe button';
          for (const e of [...document.querySelectorAll(sel)].filter(e => e.getClientRects().length)) {
            e.scrollIntoView({ block: 'center', behavior: 'instant' });
            await new Promise(ok => setTimeout(ok, 120));
            const g = e.getBoundingClientRect();
            r.push({ t: e.textContent.trim().slice(0, 18), m: f(e), drin: g.left >= 0 && g.right <= innerWidth + 0.5 });
          }
          return { r, quer: document.documentElement.scrollWidth > innerWidth + 1 };
        }, TREFFER.toString());
        const klein = mm.r.filter(x => x.m.w < 44 || x.m.h < 44 || !x.drin);
        pruefe(w + ' ' + dichte + ': ' + mm.r.length + ' Bedienelemente ≥ 44 × 44, im Bild, kein Querscrollen',
          mm.r.length >= 8 && !klein.length && !mm.quer, JSON.stringify({ n: mm.r.length, klein, quer: mm.quer }));
        if (w === 320 || w === 1920) console.log('     ' + mm.r.map(x => x.t + ' ' + x.m.w + '×' + x.m.h).join(' · '));
        await p._ctx.close();
      }
    }

    console.log('\n── B Seite für den Link (v.html) ──');
    const FREIGABE = (felder) => ({ name: 'x', fields: felder });
    const S = (v) => ({ stringValue: v }), I = (v) => ({ integerValue: String(v) }), BO = (v) => ({ booleanValue: v });
    const faelle = {
      gueltig: { status: 200, body: FREIGABE({ firma: S('koerperformen'), titel: S('Dein erstes Training'), pfad: S('firmen/koerperformen/freigaben/Ab3dEf6hIj9kLm2nOp5qRs8t/clip.mp4'), bis: I(Date.now() + 5 * 86400000), aktiv: BO(true) }) },
      weg: { status: 404, body: { error: { code: 404 } } },
      zurueck: { status: 200, body: FREIGABE({ titel: S('Alt'), pfad: S('firmen/koerperformen/freigaben/x/clip.mp4'), bis: I(0), aktiv: BO(false) }) },
      abgelaufen: { status: 200, body: FREIGABE({ titel: S('Alt'), pfad: S('firmen/koerperformen/freigaben/x/clip.mp4'), bis: I(Date.now() - 86400000), aktiv: BO(true) }) }
    };
    async function seite(fall, hash, w, h) {
      const ctx = await b.newContext({ viewport: { width: w || 1440, height: h || 900 }, serviceWorkers: 'block' });
      const q = await ctx.newPage();
      q._fehler = []; q._hosts = new Set();
      q.on('pageerror', e => q._fehler.push(e.message.slice(0, 160)));
      q.on('request', r => { try { q._hosts.add(new URL(r.url()).host); } catch (e) {} });
      q._commits = []; q._commitStatus = 200;
      await q.route('https://firestore.googleapis.com/**', r => {
        const kopf = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' };
        if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: kopf });
        if (r.request().method() === 'POST') { q._commits.push({ url: r.request().url(), body: JSON.parse(r.request().postData() || '{}') });
          return r.fulfill({ status: q._commitStatus, contentType: 'application/json', body: '{}', headers: kopf }); }
        const f = faelle[fall]; r.fulfill({ status: f.status, contentType: 'application/json', body: JSON.stringify(f.body), headers: kopf }); });
      /* Wie firebase.json: ALLES unter /v/ liefert v.html aus – auch eine
         relativ angefragte /v/konfig.js. Genau daran scheiterte die Seite
         im Betrieb (26.11.2026), und v.html#… hätte es nie gezeigt. */
      const vHtml = require('fs').readFileSync(require('path').join(__dirname, '..', 'v.html'), 'utf8');
      await q.route(BASIS + 'v/**', r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: vHtml }));
      /* Der Speicher antwortet hier nicht (wie ein langsames Netz): echte
         Videobytes gibt es im Test nicht, und unechte lösen zu Recht
         „lässt sich nicht abspielen" aus. Geprüft wird, WOHER die Seite
         das Video holt; den Fehlerfall prüft der nächste Punkt. */
      q._haengt = [];
      await q.route('https://firebasestorage.googleapis.com/**', r => { q._haengt.push(r); });
      await q.goto(BASIS + 'v/' + hash, { waitUntil: 'domcontentloaded' });
      await q.waitForTimeout(800);
      q._ctx = ctx;
      return q;
    }
    const ID = 'Ab3dEf6hIj9kLm2nOp5qRs8t';
    let q = await seite('gueltig', ID);
    const n0 = await q.evaluate(() => ({ hinweis: document.getElementById('vHinweis').hidden ? '' : document.getElementById('vHinweis').textContent,
      titel: document.getElementById('vTitel').textContent, form: !document.getElementById('vName').hidden,
      video: document.getElementById('vVideo').getAttribute('src') || '', rahmen: !document.getElementById('vRahmen').hidden }));
    pruefe('/v/<Kennung>: die Einstellungen kommen an (kein „kein Video-Speicher eingerichtet")', !/Video-Speicher/.test(n0.hinweis) && n0.titel === 'Dein erstes Training', JSON.stringify(n0));
    pruefe('vor dem Video: „Wer schaut?" mit Vor- und Nachname, noch kein Video geladen', n0.form && !n0.video && !n0.rahmen, JSON.stringify(n0));
    await q.click('#vNameLos'); await q.waitForTimeout(200);
    let nf = await q.evaluate(() => ({ f: document.getElementById('vNameFehler').textContent, v: !!document.getElementById('vVideo').getAttribute('src') }));
    pruefe('leer abgeschickt: „Bitte Vor- und Nachnamen eingeben.", kein Video, nichts gesendet', /Vor- und Nachnamen/.test(nf.f) && !nf.v && !q._commits.length, JSON.stringify(nf));
    await q.fill('#vVorname', '  Erika ');
    await q.click('#vNameLos'); await q.waitForTimeout(200);
    nf = await q.evaluate(() => ({ f: document.getElementById('vNameFehler').textContent, v: !!document.getElementById('vVideo').getAttribute('src') }));
    pruefe('nur Vorname: „Bitte den Nachnamen eingeben."', /Nachnamen/.test(nf.f) && !nf.v && !q._commits.length, JSON.stringify(nf));
    await q.fill('#vNachname', 'Muster');
    await q.click('#vNameLos'); await q.waitForTimeout(700);
    const c = q._commits[0], w0 = c && c.body.writes && c.body.writes[0];
    pruefe('abgeschickt: EIN Eintrag unter freigaben/<Kennung>/aufrufe/<20 Zeichen>', q._commits.length === 1 && !!w0 &&
      /\/documents\/freigaben\/Ab3dEf6hIj9kLm2nOp5qRs8t\/aufrufe\/[A-Za-z0-9]{20}$/.test(w0.update.name) && /documents:commit\?key=/.test(c.url), JSON.stringify(c));
    pruefe('… nur Vor- und Nachname (getrimmt), Zeit vom Server, nur neu anlegen', !!w0 &&
      JSON.stringify(w0.update.fields) === JSON.stringify({ vorname: { stringValue: 'Erika' }, nachname: { stringValue: 'Muster' } }) &&
      w0.updateTransforms[0].fieldPath === 'ts' && w0.updateTransforms[0].setToServerValue === 'REQUEST_TIME' && w0.currentDocument.exists === false, JSON.stringify(w0));
    const g = await q.evaluate(() => ({ titel: document.getElementById('vTitel').textContent, video: document.getElementById('vVideo').getAttribute('src') || '',
      sicht: !document.getElementById('vRahmen').hidden, fuss: document.getElementById('vFuss').textContent }));
    pruefe('gültig: Titel „Dein erstes Training" und das Video', g.titel === 'Dein erstes Training' && g.sicht, JSON.stringify(g));
    pruefe('… aus dem Speicher OHNE Schlüssel: …/o/<Pfad>?alt=media', /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/firmen%2Fkoerperformen%2Ffreigaben%2FAb3dEf6hIj9kLm2nOp5qRs8t%2Fclip\.mp4\?alt=media$/.test(g.video), g.video);
    pruefe('… „Dieser Link gilt bis …"', /Dieser Link gilt bis/.test(g.fuss), g.fuss);
    const fremd = [...q._hosts].filter(x => !/^127\.0\.0\.1(:\d+)?$/.test(x) && x !== 'firestore.googleapis.com' && x !== 'firebasestorage.googleapis.com');
    pruefe('… keine anderen Hosts als die zwei erlaubten', !fremd.length, fremd.join(', '));
    pruefe('… ohne Skriptfehler', !q._fehler.length, q._fehler.join(' | '));
    {
      /* Dasselbe Gerät öffnet den Link noch einmal: kein zweites Mal fragen. */
      const q2 = await q._ctx.newPage();
      await q2.route('https://firestore.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(faelle.gueltig.body), headers: { 'access-control-allow-origin': '*' } }));
      await q2.route('https://firebasestorage.googleapis.com/**', () => {});
      const vHtml = require('fs').readFileSync(require('path').join(__dirname, '..', 'v.html'), 'utf8');
      await q2.route(BASIS + 'v/**', r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: vHtml }));
      await q2.goto(BASIS + 'v/' + ID, { waitUntil: 'domcontentloaded' }); await q2.waitForTimeout(800);
      const w2 = await q2.evaluate(() => ({ form: !document.getElementById('vName').hidden, video: !!document.getElementById('vVideo').getAttribute('src') }));
      pruefe('zweites Öffnen auf demselben Gerät: gleich das Video, ohne erneute Frage', !w2.form && w2.video, JSON.stringify(w2));
    }
    await q._ctx.close();
    {
      /* Zwischen Öffnen und Abschicken zurückgezogen: die Regel lehnt ab. */
      const x = await seite('gueltig', ID);
      x._commitStatus = 403;
      await x.fill('#vVorname', 'Erika'); await x.fill('#vNachname', 'Muster');
      await x.click('#vNameLos'); await x.waitForTimeout(700);
      const e = await x.evaluate(() => ({ t: document.getElementById('vHinweis').textContent, form: !document.getElementById('vName').hidden, v: !!document.getElementById('vVideo').getAttribute('src') }));
      pruefe('Name abgelehnt (eben zurückgezogen/abgelaufen): „… nicht mehr freigegeben", kein Formular, kein Video', /nicht mehr freigegeben/.test(e.t) && !e.form && !e.v, JSON.stringify(e));
      await x._ctx.close();
    }
    const satz = async (fall, hash) => { const x = await seite(fall, hash); const r = await x.evaluate(() => ({ t: document.getElementById('vHinweis').textContent, v: !document.getElementById('vRahmen').hidden })); await x._ctx.close(); return r; };
    {
      const x = await seite('gueltig', ID);
      await x.fill('#vVorname', 'Erika'); await x.fill('#vNachname', 'Muster');
      await x.click('#vNameLos'); await x.waitForTimeout(500);
      for (const h of x._haengt) await h.fulfill({ status: 403, contentType: 'application/json', body: '{"error":{"code":403}}' }).catch(() => {});
      await x.evaluate(() => { const v = document.getElementById('vVideo'); v.src = v.src; v.load(); });
      await x.waitForTimeout(800);
      for (const h of x._haengt) await h.fulfill({ status: 403, contentType: 'application/json', body: '{"error":{"code":403}}' }).catch(() => {});
      await x.waitForTimeout(800);
      const e = await x.evaluate(() => ({ t: document.getElementById('vHinweis').textContent, v: !document.getElementById('vRahmen').hidden }));
      pruefe('Speicher verweigert (eben zurückgezogen): „… lässt sich gerade nicht abspielen", kein Video', /nicht abspielen/.test(e.t) && !e.v, JSON.stringify(e));
      await x._ctx.close();
    }
    let r = await satz('weg', ID);
    pruefe('nicht vorhanden: „Dieses Video ist nicht mehr da."', /nicht mehr da/.test(r.t) && !r.v, r.t);
    r = await satz('zurueck', ID);
    pruefe('zurückgezogen: „… nicht mehr freigegeben."', /nicht mehr freigegeben/.test(r.t) && !r.v, r.t);
    r = await satz('abgelaufen', ID);
    pruefe('abgelaufen: „Dieser Link ist abgelaufen."', /abgelaufen/.test(r.t) && !r.v, r.t);
    r = await satz('gueltig', 'kurz');
    pruefe('Link kaputt: „Dieser Link ist unvollständig."', /unvollständig/.test(r.t) && !r.v, r.t);
    for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      q = await seite('gueltig', ID, w, h);
      const m = await q.evaluate((T) => { const f = new Function('return ' + T)();
        return { quer: document.documentElement.scrollWidth > innerWidth + 1,
          r: ['vVorname', 'vNachname', 'vNameLos'].map(id => { const e = document.getElementById(id); const r = e.getBoundingClientRect();
            return { id, m: f(e), imBild: r.left >= 0 && r.right <= innerWidth }; }) }; }, TREFFER.toString());
      const klein = m.r.filter(x => !(x.m.w >= 44 && x.m.h >= 44 && x.imBild));
      pruefe(w + ' px: Namensfelder und „Video ansehen" ≥ 44 × 44, im Bild, nichts ragt hinaus', !klein.length && !m.quer,
        JSON.stringify({ klein: klein.map(x => x.id + ' ' + x.m.w + '×' + x.m.h), quer: m.quer }));
      await q._ctx.close();
    }
  } finally { await b.close(); }
  console.log('\n' + (schlecht ? '✗ Video teilen: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
                              : '✓ Video teilen: ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
