/* ══════════════════════════════════════════════════════════════════════
   STUDIOLEITUNG LEGT AUFGABEN AN (Runde 145)

   Aus dem Betrieb, 6.10.2026: „Es konnten wieder ein paar Studio Leiter
   keine Aufgaben anlegen".

   DIE URSACHE: die Knöpfe im Reiter „Erstellen" wurden nur für die Rolle
   'chef' verdrahtet (if(session.role==='chef') um den ganzen Block). Die
   Studioleitung sah das Formular, aber „Aufgabe erstellen" tat nichts —
   keine Aufgabe, keine Meldung. Ebenso Foto, Wiederholung, „Vorlage
   übernehmen", „Ankündigung senden", die Auswertung und „Liste leeren".
   Abschnitt 0 prüft jeden dieser Knöpfe.

   DAZU, und mit derselben Wirkung (tests/rules/leiter-aufgaben.test.js):
   die Regel fragt die
   KENNUNGEN im Konto (studioKeys), das Formular bot an, was in den NAMEN
   steht. Fehlte zu einem Namen die Kennung, scheiterte mit „Alle Studios"
   die ganze Aufgabe — ein Batch gilt ganz oder gar nicht.

   Die Attrappe hier verhält sich wie die Regel: ein Batch mit einem
   Studio, das nicht in studioKeys steht, wird mit permission-denied
   abgelehnt — als Ganzes.

   1. Konto stimmt: beide Studios wählbar, „Alle Studios" → eine Aufgabe
      je Studio, kein Hinweis.
   2. Konto halb (Brühl nur als Name, nicht als Kennung):
      · Brühl steht da, ist aber nicht wählbar, „nicht freigeschaltet";
      · darunter der Hinweis mit Studio, Weg zur Behebung und „neu laden";
      · „Alle Studios" hakt nur Hürth an → die Aufgabe wird ANGELEGT;
      · Ankündigungen bieten nur Hürth an.
      GEGENPROBE gegen den alten Stand: dort scheiterte die Aufgabe.
   3. Lehnt die Datenbank trotzdem ab: verständliche Meldung (Geschäfts-
      führung, „Zuordnung reparieren") und ein Eintrag unter System →
      Fehler — vorher bekam die Leitung nur „keine Berechtigung".
   4. Mitarbeiter (Fenster „Eigene Aufgabe"): nur freigeschaltete Studios.
   5. Treffer ≥ 44 × 44 der Studio-Zeilen (auch der gesperrten) bei
      320–1920 px, normal und kompakt; der Hinweis hat ≥ 4,5 : 1 Kontrast.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 300) : '')); }
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

/* Die Attrappe der Leitung, mit wählbaren Kennungen und einem Batch, der
   sich wie die Regel verhält. */
function stub(datei, keys) {
  let s = fs.readFileSync(__dirname + '/' + datei, 'utf8');
  s = s.replace("var docPath = path + '/' + id;\n        return {", "var docPath = path + '/' + id;\n        return { path: docPath,");
  if (keys) {
    s = s.replace(/(var PROFILE = \{[\s\S]*?studioKeys: )\[[^\]]*\]/, '$1' + JSON.stringify(keys));
  }
  s = s.replace(/batch: function \(\) \{ return \{ set: function \(\) \{\}, update: function \(\) \{\}, delete: function \(\) \{\}, commit: function \(\) \{ return Promise\.resolve\(\); \} \}; \}/,
    `batch: function () {
      var teile = [];
      return { set: function (r) { teile.push(r && r.path || '?'); }, update: function (r) { teile.push(r && r.path || '?'); },
        delete: function () {}, commit: function () {
          window.__batches = window.__batches || []; window.__batches.push(teile.slice());
          var meine = (PROFILE.studioKeys || []);
          var fremd = teile.filter(function (p) { var m = /studios\\/([^/]+)\\/todos/.exec(p); return m && meine.indexOf(m[1]) < 0; });
          if (window.__immerAblehnen || fremd.length) return Promise.reject({ code: 'permission-denied', message: 'Missing or insufficient permissions.' });
          window.__angelegt = (window.__angelegt || []).concat(teile);
          return Promise.resolve();
        } };
    }`);
  return s;
}

async function oeffne(b, datei, keys, w, h) {
  const p = await b.newPage({ viewport: { width: w || 1440, height: h || 900 } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await p.addInitScript({ content: stub(datei, keys) });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
async function zuErstellen(p) {
  /* Der Weg der Leitung aus der Aufgabenliste: „+ Neu" führt ins
     Formular der Verwaltung (die Attrappe läuft im alten Schnitt, dort
     gibt es „Alles" nicht). */
  return p.evaluate(async () => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    const n = document.getElementById('todoNew'); if (!n) return false;
    n.click(); await w(1300);
    return !!document.getElementById('ntTitle') && !!document.getElementById('ntTitle').offsetParent;
  });
}
const zeilen = (p) => p.evaluate(() => [...document.querySelectorAll('#ntStudios .studio-check')].map(l => ({
  text: l.textContent.trim(), aus: l.querySelector('input').disabled, wert: l.querySelector('input').value })));
async function anlegen(p, titel) {
  return p.evaluate(async (titel) => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    window.__batches = []; window.__angelegt = [];
    document.getElementById('ntTitle').value = titel;
    const all = document.getElementById('ntAllStudios');
    if (!all.checked) all.click();
    await w(100);
    document.getElementById('ntAdd').click();
    await w(900);
    return { batches: window.__batches, angelegt: window.__angelegt, toast: (document.getElementById('toast') || {}).textContent || '' };
  }, titel);
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 0. Jeder Knopf der Leitung reagiert ──');
  {
    const p = await oeffne(b, 'stub-leiter.js', null);
    await zuErstellen(p);
    const r = await p.evaluate(async () => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      const t = () => (document.getElementById('toast') || {}).textContent || '';
      const aus = {};
      document.getElementById('ntTitle').value = '';
      document.getElementById('ntAdd').click(); await w(200); aus.aufgabeLeer = t();
      document.getElementById('bcText').value = '';
      document.getElementById('bcSend').click(); await w(200); aus.ankuendigungLeer = t();
      const rep = document.getElementById('ntRepeat');
      rep.value = 'custom'; rep.dispatchEvent(new Event('change')); await w(150);
      aus.wiederholungEigen = getComputedStyle(document.getElementById('ntCustomWrap')).display !== 'none';
      rep.value = ''; rep.dispatchEvent(new Event('change'));
      const tpl = document.getElementById('tplUse');
      if (tpl) { tpl.click(); await w(200); aus.vorlage = t(); }
      const bw = document.getElementById('bcWichtig');
      if (bw) { bw.click(); await w(100); aus.wichtig = document.getElementById('bcWichtigWrap').classList.contains('on'); bw.click(); }
      document.getElementById('bcText').value = 'Morgen Teamtreffen';
      document.getElementById('bcSend').click(); await w(700); aus.ankuendigungGesendet = t();
      return aus;
    });
    pruefe('„Aufgabe erstellen" reagiert (leerer Titel → „Bitte Aufgabe eingeben.")', /Bitte Aufgabe eingeben/.test(r.aufgabeLeer), r.aufgabeLeer);
    pruefe('„Ankündigung senden" reagiert (leer → „Bitte Text eingeben.")', /Bitte Text eingeben/.test(r.ankuendigungLeer), r.ankuendigungLeer);
    pruefe('… und sendet', /Ankündigung gesendet/.test(r.ankuendigungGesendet), r.ankuendigungGesendet);
    pruefe('Wiederholung „eigenes Intervall" blendet die Felder ein', r.wiederholungEigen === true);
    pruefe('„Vorlage übernehmen" reagiert', typeof r.vorlage === 'string' && r.vorlage.length > 0, r.vorlage);
    pruefe('„Wichtig" schaltet um', r.wichtig === true);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 1. Konto stimmt ──');
  {
    const p = await oeffne(b, 'stub-leiter.js', null);
    pruefe('Leitung erreicht „Neue Aufgabe" über „+ Neu"', await zuErstellen(p));
    const z = await zeilen(p);
    pruefe('beide Studios wählbar', z.length === 2 && z.every(x => !x.aus), JSON.stringify(z));
    const r = await anlegen(p, 'Theke wischen');
    pruefe('„Alle Studios" → je eine Aufgabe in Hürth und Brühl, angelegt',
      r.angelegt.length === 2 && r.angelegt.some(x => /studio-6\/todos/.test(x)) && r.angelegt.some(x => /studio-7\/todos/.test(x)) && /erstellt/.test(r.toast),
      JSON.stringify(r));
    pruefe('kein Hinweis', await p.evaluate(() => document.getElementById('ntZuordHinweis').hidden));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 2. Konto halb: Brühl nur als Name ──');
  {
    const p = await oeffne(b, 'stub-leiter.js', ['studio-6']);
    await zuErstellen(p);
    const z = await zeilen(p);
    const bruehl = z.find(x => /Brühl/.test(x.text)), huerth = z.find(x => /Hürth/.test(x.text));
    pruefe('Brühl steht da, ist aber nicht wählbar: „nicht freigeschaltet"', !!bruehl && bruehl.aus && /nicht freigeschaltet/.test(bruehl.text), JSON.stringify(z));
    pruefe('Hürth ist wählbar', !!huerth && !huerth.aus, JSON.stringify(z));
    const h = await p.evaluate(() => { const e = document.getElementById('ntZuordHinweis'); return { an: !e.hidden && !!e.offsetParent, text: e.textContent }; });
    pruefe('Hinweis darunter: welches Studio, wer es behebt, wo, und „neu laden"',
      h.an && /Brühl/.test(h.text) && /Geschäftsführung/.test(h.text) && /Zuordnung reparieren/.test(h.text) && /neu laden/.test(h.text), JSON.stringify(h));
    const r = await anlegen(p, 'Theke wischen');
    pruefe('„Alle Studios" hakt nur Hürth an → die Aufgabe wird ANGELEGT (vorher: alles abgelehnt)',
      r.angelegt.length === 1 && /studio-6\/todos/.test(r.angelegt[0]) && /erstellt/.test(r.toast), JSON.stringify(r));
    const ank = await p.evaluate(() => [...document.querySelectorAll('#bcTarget option')].map(o => o.value));
    pruefe('Ankündigungen bieten nur das freigeschaltete Studio an', ank.length === 1 && ank[0] === 'studio-6', JSON.stringify(ank));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 3. Die Datenbank lehnt trotzdem ab ──');
  {
    const p = await oeffne(b, 'stub-leiter.js', null);
    await zuErstellen(p);
    await p.evaluate(() => { window.__immerAblehnen = true; });
    const r = await anlegen(p, 'Theke wischen');
    pruefe('verständliche Meldung statt „keine Berechtigung": Geschäftsführung, „Zuordnung reparieren"',
      /Geschäftsführung/.test(r.toast) && /Zuordnung reparieren/.test(r.toast), r.toast);
    await p.close();
  }
  {
    /* Eintrag unter System → Fehler: fehlerMelden schreibt fehler/<sig>.
       Mitgeschnitten über eine Attrappe für genau diese Sammlung. */
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript({ content: stub('stub-leiter.js', null) });
    await p.addInitScript(() => {
      window.__fehlerTexte = [];
      const warte = setInterval(() => {
        const f = window.firebase && window.firebase.firestore && window.firebase.firestore();
        if (!f || f.__mit) return;
        clearInterval(warte);
        const alt = f.collection;
        f.collection = function (pfad) {
          const c = alt.apply(this, arguments);
          if (String(pfad) === 'fehler') {
            const altDoc = c.doc;
            c.doc = function () {
              const d = altDoc.apply(this, arguments);
              const altSet = d.set;
              d.set = function (daten) { window.__fehlerTexte.push(JSON.stringify(daten)); return altSet ? altSet.apply(this, arguments) : Promise.resolve(); };
              return d;
            };
          }
          return c;
        };
        f.__mit = true;
      }, 5);
    });
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    await zuErstellen(p);
    await p.evaluate(() => { window.__immerAblehnen = true; });
    await anlegen(p, 'Theke wischen');
    await p.waitForTimeout(600);
    const t = await p.evaluate(() => window.__fehlerTexte.join(' | '));
    pruefe('… und ein Eintrag unter System → Fehler mit Rolle und Kennungen im Konto',
      /Aufgabe abgelehnt \(leiter\)/.test(t) && /studioKeys: studio-6,studio-7/.test(t), t);
    await p.close();
  }

  console.log('\n── 4. Mitarbeiter: Fenster „Eigene Aufgabe" ──');
  {
    const p = await oeffne(b, 'stub-mitarbeiter.js', null, 390, 844);
    const s = await p.evaluate(async () => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      const a = [...document.querySelectorAll('[data-group="g-arbeit"]')].find(e => e.offsetParent); if (a) { a.click(); await w(700); }
      const t = [...document.querySelectorAll('[data-subview="todos"]')].find(e => e.offsetParent); if (t) { t.click(); await w(700); }
      const n = document.getElementById('todoNew'); if (n) n.click(); await w(500);
      return { offen: document.getElementById('ownTodoModal').classList.contains('show'),
        optionen: [...document.querySelectorAll('#otStudio option')].map(o => o.value) };
    });
    pruefe('Konto stimmt: Fenster offen, Hürth (studio-6) wählbar', s.offen && s.optionen.join() === 'studio-6', JSON.stringify(s));
    await p.close();
  }
  {
    const p = await oeffne(b, 'stub-mitarbeiter.js', [], 390, 844);
    const s = await p.evaluate(async () => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      const a = [...document.querySelectorAll('[data-group="g-arbeit"]')].find(e => e.offsetParent); if (a) { a.click(); await w(700); }
      const t = [...document.querySelectorAll('[data-subview="todos"]')].find(e => e.offsetParent); if (t) { t.click(); await w(700); }
      const n = document.getElementById('todoNew'); if (n) n.click(); await w(500);
      return { offen: document.getElementById('ownTodoModal').classList.contains('show'),
        toast: (document.getElementById('toast') || {}).textContent || '' };
    });
    pruefe('Konto ohne Kennung: kein Fenster ins Leere, sondern gleich die Erklärung',
      !s.offen && /keinem Studio zugeordnet/.test(s.toast) && /Zuordnung reparieren/.test(s.toast), JSON.stringify(s));
    await p.close();
  }

  console.log('\n── 5. Fingerziele und Kontrast ──');
  {
    const p = await oeffne(b, 'stub-leiter.js', ['studio-6'], 390, 844);
    await zuErstellen(p);
    const zuKlein = [];
    let quer = 0;
    for (const [w, h] of GROESSEN) {
      await p.setViewportSize({ width: w, height: h });
      await p.waitForTimeout(250);
      for (const dichte of ['normal', 'kompakt']) {
        await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
        const m = await p.evaluate(async (SRC) => {
          const T = eval('(' + SRC + ')');
          const aus = [];
          for (const el of [...document.querySelectorAll('#ntStudios .studio-check')]) {
            el.scrollIntoView({ block: 'center' });
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            const r = T(el); aus.push(el.textContent.trim().slice(0, 12) + ' ' + r.w + '×' + r.h + (r.w < 44 || r.h < 44 ? ' !' : ''));
          }
          return { aus, quer: document.documentElement.scrollWidth - innerWidth };
        }, TREFFER.toString());
        quer = Math.max(quer, m.quer);
        m.aus.filter(x => / !$/.test(x)).forEach(x => zuKlein.push(w + '/' + dichte + ' ' + x));
      }
    }
    pruefe('Studio-Zeilen (auch die gesperrte): Treffer ≥ 44 × 44 bei 320–1920 px, normal und kompakt', !zuKlein.length, zuKlein.join(', '));
    pruefe('kein waagerechtes Scrollen', quer <= 0, quer + ' px');
    for (const thema of ['hell', 'dunkel']) {
      const k = await p.evaluate((thema) => {
        document.body.classList.toggle('light', thema === 'hell');
        const e = document.getElementById('ntZuordHinweis');
        const teile = (s) => (s.match(/[\d.]+/g) || []).map(Number);
        const lum = (c) => { const v = c.slice(0, 3).map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
        /* Der Hintergrund des Hinweises ist durchscheinend: über die
           Hintergründe darunter verrechnen, bis einer deckt. */
        let unten = [255, 255, 255], stapel = [];
        for (let el = e; el; el = el.parentElement) {
          const c = teile(getComputedStyle(el).backgroundColor);
          if (c.length >= 3 && (c[3] === undefined || c[3] > 0)) { stapel.push(c); if (c[3] === undefined || c[3] === 1) break; }
        }
        for (let i = stapel.length - 1; i >= 0; i--) {
          const c = stapel[i], a = c[3] === undefined ? 1 : c[3];
          unten = [0, 1, 2].map(j => c[j] * a + unten[j] * (1 - a));
        }
        const vg = teile(getComputedStyle(e).color);
        const L1 = lum(vg), L2 = lum(unten);
        return { kontrast: (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05), vg: vg.join(','), hg: unten.map(Math.round).join(',') };
      }, thema);
      pruefe('Hinweis ' + thema + ': Kontrast ≥ 4,5 : 1 (' + k.kontrast.toFixed(2) + ')', k.kontrast >= 4.5, JSON.stringify(k));
    }
    await p.close();
  }

  await b.close();
  console.log('\n' + (schlecht ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Studioleitung: angeboten wird, was die Regel erlaubt; Gesperrtes mit Grund — ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
