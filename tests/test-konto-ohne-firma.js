/* ══════════════════════════════════════════════════════════════════════
   MEIN KONTO — die kleine Seite ohne Betrieb (Runde 117)

   Aus dem Betrieb, 25.9.2026:
     „man kann ein account erstellen und wenn man dann keinen Firmen code
      eingibt und der chef das bestätigt sieht man nur ein fenster wo man
      dann sein profil und interface bearbeiten kann und so aber mehr
      nicht wie so eine mini seite fürs eigne profil halt"
     „Chef bestätigt trotzdem bzw ein chef der jeweiligen firma"

   Die Regeln dahinter prüft tests/rules/konto-ohne-firma.test.js, den
   Server tests/rules/firmencode.test.js. Hier die Oberfläche:
   1. ?demo=neu: die kleine Seite statt der App. Falscher Code → Fehler
      am Feld; richtiger Code → „Anfrage bei Körperformen"; Zurückziehen
      → wieder ohne Betrieb. Profil und Aussehen öffnen das echte
      Einstellungsfenster, OBEN auf der Seite und ohne Meldungen,
      Nachweise, Kalender. Löschen fragt nach.
   2. Jeder Knopf und jedes Feld trifft ≥ 44 × 44, bei 320 / 390 / 430 /
      820 / 1280 / 1440 / 1920, normal und kompakt; nichts ragt hinaus.
      Am Rechner zwei Spalten.
   3. Chef: die Anfrage steht NUR in „Wartet auf Freigabe", nicht in der
      Teamliste. Freigeben ohne Studio wird aufgehalten; mit Studio ist
      die Person danach im Team.
   4. Anmeldeformular: keine Studiowahl mehr, das Codefeld steht da und
      sagt, dass es freiwillig ist.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = process.env.SP || __dirname;

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
async function oeffne(b, w, h, rolle) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  p.on('dialog', d => d.accept());
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
const zustand = (p) => p.evaluate(() => ({
  seite: getComputedStyle(document.getElementById('warteWrap')).display !== 'none',
  app: document.getElementById('app').classList.contains('show'),
  ohne: !document.getElementById('mkOhne').hidden,
  wartet: !document.getElementById('mkWartet').hidden,
  firma: document.getElementById('mkFirma').textContent,
  fehler: document.getElementById('mkCodeErr').textContent,
}));

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. Die kleine Seite (?demo=neu) ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h, 'neu');
    const z0 = await zustand(p);
    pruefe(w + ' px: die kleine Seite steht, die App nicht', z0.seite && !z0.app && z0.ohne, JSON.stringify(z0));
    await p.fill('#mkCode', 'FALSCH-1');
    await p.click('#mkBeitreten');
    await p.waitForTimeout(400);
    const z1 = await zustand(p);
    pruefe('falscher Code: Fehler am Feld, noch ohne Betrieb', /gibt es nicht/.test(z1.fehler) && z1.ohne, JSON.stringify(z1));
    await p.fill('#mkCode', 'demo 2026');
    await p.click('#mkBeitreten');
    await p.waitForTimeout(500);
    const z2 = await zustand(p);
    pruefe('richtiger Code (klein, mit Leerzeichen): „Anfrage bei Körperformen"', z2.wartet && /Körperformen/.test(z2.firma) && !z2.fehler, JSON.stringify(z2));
    await p.click('#warteNeu');
    await p.waitForTimeout(500);
    pruefe('„Nachsehen": noch nicht frei — die Seite bleibt', (await zustand(p)).wartet && !(await zustand(p)).app);
    await p.click('#mkZurueck');
    await p.waitForTimeout(500);
    pruefe('„Anfrage zurückziehen": wieder ohne Betrieb', (await zustand(p)).ohne);

    await p.click('#mkProfil');
    await p.waitForTimeout(500);
    const pm = await p.evaluate(() => {
      const m = document.getElementById('profileModal');
      const n = document.getElementById('pmName');
      const r = n.getBoundingClientRect();
      const oben = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const sicht = (sel) => { const e = document.querySelector(sel); return !!e && e.getClientRects().length > 0 && getComputedStyle(e).display !== 'none'; };
      return { offen: m.classList.contains('show'), obenauf: oben === n, name: n.value,
               melden: sicht('[data-pmtab="melden"]'), nachweise: sicht('[data-pmtab="nachweise"]'),
               kalender: sicht('#kalNeu') };
    });
    pruefe('„Profil bearbeiten": das Einstellungsfenster liegt OBEN auf der Seite, mit dem eigenen Namen',
      pm.offen && pm.obenauf && pm.name === 'Demo-Neuling', JSON.stringify(pm));
    pruefe('… ohne Meldungen, Nachweise und Kalender (die gibt es ohne Betrieb nicht)',
      !pm.melden && !pm.nachweise && !pm.kalender, JSON.stringify(pm));
    await p.fill('#pmName', 'Demo Neu');
    await p.click('#pmSave');
    await p.waitForTimeout(500);
    const nachSpeichern = await p.evaluate(() => ({ zu: !document.getElementById('profileModal').classList.contains('show') }));
    pruefe('Speichern schliesst das Fenster', nachSpeichern.zu);
    await p.click('#mkAussehen');
    await p.waitForTimeout(400);
    const au = await p.evaluate(() => getComputedStyle(document.getElementById('pmPaneAussehen')).display !== 'none'
      && document.querySelectorAll('#thOpts [data-th]').length === 3);
    pruefe('„Aussehen" öffnet Hell/Dunkel und Co.', au);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
    await p.click('#mkLoeschen');
    await p.waitForTimeout(500);
    pruefe('„Konto löschen" fragt nach — in der Demo wird nichts gelöscht', (await zustand(p)).seite);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    if (w === 1440) {
      const spalten = await p.evaluate(() => {
        const a = document.querySelector('.mk-betrieb').getBoundingClientRect();
        const c = document.querySelectorAll('.mk-karte')[1].getBoundingClientRect();
        return { links: Math.round(a.left), rechts: Math.round(c.left), obenGleich: Math.abs(a.top - c.top) < 2, breite: Math.round(document.querySelector('.mk-seite').getBoundingClientRect().width) };
      });
      pruefe('am Rechner zwei Spalten, höchstens 880 px breit', spalten.rechts > spalten.links + 200 && spalten.obenGleich && spalten.breite <= 880, JSON.stringify(spalten));
      await p.screenshot({ path: SP + '/konto-ohne-firma-1440.png' });
    }
    await p.close();
  }

  console.log('\n── 2. Treffen ──');
  for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h, 'neu');
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      for (const zst of ['ohne', 'wartet']) {
        if (zst === 'wartet') {
          await p.fill('#mkCode', 'DEMO-2026'); await p.click('#mkBeitreten'); await p.waitForTimeout(400);
        }
        const k = await p.evaluate(async (SRC) => {
          const T = eval('(' + SRC + ')');
          const els = [...document.querySelectorAll('#warteWrap button, #warteWrap input, #warteWrap a')].filter(e => e.getClientRects().length);
          const zu = [];
          for (const el of els) {
            el.scrollIntoView({ block: 'center' });
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            const m = T(el);
            if (m.w < 44 || m.h < 44) zu.push((el.id || el.textContent.trim().slice(0, 20)) + ' ' + m.w + '×' + m.h);
          }
          const wrap = document.getElementById('warteWrap');
          return { zahl: els.length, zu, quer: Math.max(document.documentElement.scrollWidth - innerWidth, wrap.scrollWidth - wrap.clientWidth) };
        }, TREFFER.toString());
        pruefe(w + ' px, ' + dichte + ', ' + zst + ': ' + k.zahl + ' Bedienelemente ≥ 44 × 44, nichts ragt hinaus',
          k.zahl >= 8 && !k.zu.length && k.quer <= 0, JSON.stringify(k));
        if (zst === 'wartet') { await p.click('#mkZurueck'); await p.waitForTimeout(400); }
      }
    }
    if (p._fehler.length) pruefe(w + ' px ohne Skriptfehler', false, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 3. Der Chef gibt frei ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h, 'chef');
    await p.evaluate(() => { const a = document.querySelector('#side [data-group="g-alles"], .mobnav [data-group="g-alles"]'); if (a) a.click(); });
    await p.waitForTimeout(400);
    await p.evaluate(() => { const k = document.querySelector('[data-al-cgo="team"]'); if (k) k.click(); });
    await p.waitForTimeout(1000);
    const vor = await p.evaluate(() => ({
      karte: getComputedStyle(document.getElementById('freigabeKarte')).display !== 'none',
      inKarte: /Lea Neumann/.test(document.getElementById('freigabeListe').textContent),
      imTeam: /Lea Neumann/.test(document.getElementById('empList').textContent),
    }));
    pruefe(w + ' px: die Anfrage steht in „Wartet auf Freigabe" — und NICHT in der Teamliste', vor.karte && vor.inKarte && !vor.imTeam, JSON.stringify(vor));
    const kn = await p.evaluate(async (SRC) => {
      const T = eval('(' + SRC + ')');
      const els = [...document.querySelectorAll('#freigabeListe button, #freigabeListe .studio-check')];
      const zu = [];
      for (const el of els) {
        el.scrollIntoView({ block: 'center' });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const m = T(el);
        if (m.w < 44 || m.h < 44) zu.push(el.textContent.trim().slice(0, 16) + ' ' + m.w + '×' + m.h);
      }
      return { zahl: els.length, zu };
    }, TREFFER.toString());
    pruefe('… Freigeben, Ablehnen und jedes Studio treffen ≥ 44 × 44 (' + kn.zahl + ')', kn.zahl >= 4 && !kn.zu.length, JSON.stringify(kn));
    await p.evaluate(() => document.querySelector('#freigabeListe [data-frei]').click());
    await p.waitForTimeout(300);
    const err = await p.evaluate(() => document.querySelector('#freigabeListe .fg-err').textContent);
    pruefe('Freigeben ohne Studio: aufgehalten', /Studio/.test(err), err);
    await p.evaluate(() => {
      const cb = document.querySelector('#freigabeListe .studio-check input'); cb.click();
      document.querySelector('#freigabeListe [data-frei]').click();
    });
    await p.waitForTimeout(1200);
    const nach = await p.evaluate(() => ({
      karte: getComputedStyle(document.getElementById('freigabeKarte')).display !== 'none',
      imTeam: /Lea Neumann/.test(document.getElementById('empList').textContent),
    }));
    pruefe('mit Studio freigegeben: Karte weg, Lea steht im Team', !nach.karte && nach.imTeam, JSON.stringify(nach));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    if (w === 1440) await p.screenshot({ path: SP + '/konto-freigabe-1440.png' });
    await p.close();
  }

  console.log('\n── 4. Das Anmeldeformular ──');
  {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript({ path: __dirname + '/stub-ohne-login.js' });
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2500);
    await p.evaluate(() => { const t = document.querySelector('[data-authmode="register"]'); if (t) t.click(); });
    await p.waitForTimeout(400);
    const f = await p.evaluate(() => ({
      reiter: getComputedStyle(document.getElementById('authTabs')).display !== 'none',
      studios: !!document.getElementById('rgStudios'),
      code: getComputedStyle(document.getElementById('rgCodeWrap')).display !== 'none',
      label: document.querySelector('#rgCodeWrap label').textContent,
    }));
    pruefe('„Konto anlegen" steht immer zur Wahl', f.reiter, JSON.stringify(f));
    pruefe('keine Studiowahl mehr (die ordnet der Chef zu)', !f.studios);
    pruefe('das Codefeld steht da und sagt, dass es freiwillig ist', f.code && /später/.test(f.label), f.label);
    await p.close();
  }

  await b.close();
  console.log('\n' + gut + ' gut, ' + schlecht + ' schlecht');
  if (schlecht) console.log('✗ Konto ohne Firma: ' + schlecht + ' Prüfungen fehlgeschlagen');
  process.exit(schlecht ? 1 : 0);
})();
