/* ══════════════════════════════════════════════════════════════════════
   ZWEI-FAKTOR ALS PFLICHT FÜR DIE LEITUNG (Runde 127, Stufe 3)

   Aus dem Betrieb, 27.9.2026, auf „erst nachsehen, ob alle eingerichtet
   haben, dann Pflicht mit Übergangsfrist": ja.
   1. Die Geschäftsführung setzt den Stichtag im Werkzeug (Verwaltung →
      Team → „Zwei-Faktor bei der Leitung"): eine Woche im Voraus, mit
      Rückfrage, die die Offenen nennt; zurücknehmen geht.
   2. Vor dem Stichtag: die Leiste nennt das Datum, keine Sperre.
   3. Ab dem Stichtag: ohne zweiten Faktor nur noch „Jetzt einrichten"
      oder „Abmelden"; das Einrichten-Fenster liegt ÜBER der Sperre.
      Nach dem Einrichten ist die Sperre weg.
   4. GEGENPROBE: wer einen zweiten Faktor hat, sieht keine Sperre; wer
      nicht zur Leitung gehört, auch nicht.
   5. Mit Pflicht lässt sich der Faktor nicht abschalten.
   6. Treffer ≥ 44 × 44 bei 320 / 390 / 1440, normal und kompakt.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

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

async function oeffne(b, w, h, rolle, mitFaktor) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  p.on('dialog', d => d.accept());
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**://identitytoolkit.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ totpSessionInfo: { sharedSecretKey: 'JBSWY3DPEHPK3PXPJBSWY3DP', verificationCodeLength: 6, hashingAlgorithm: 'SHA1', periodSec: 30, sessionInfo: 's' } }) }));
  await p.addInitScript(() => localStorage.setItem('kf_tour', '99:demo-ich'));
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  /* Die Demo-Anmeldung kennt keinen zweiten Faktor — hier bekommt sie
     einen, der sich verhält wie das SDK (wie in test-zwei-faktor). */
  await p.evaluate((mit) => {
    const u = firebase.auth().currentUser;
    u.emailVerified = true;
    u.multiFactor = {
      enrolledFactors: mit ? [{ factorId: 'totp', uid: 'f1', displayName: 'Authenticator-App' }] : [],
      getSession: () => Promise.resolve({ type: 'enroll', credential: 'id-tok' }),
      enroll(a, name) { this.enrolledFactors.push({ factorId: 'totp', uid: 'f-neu', displayName: name }); return Promise.resolve(); },
      unenroll() { this.enrolledFactors = []; return Promise.resolve(); },
    };
    document.dispatchEvent(new Event('visibilitychange'));
  }, !!mitFaktor);
  await p.waitForTimeout(300);
  return p;
}
const setzeStichtag = (p, ab) => p.evaluate((ab) => window.firebase.firestore()
  .collection('firmen/koerperformen/config').doc('zweiFaktor').set({ pflichtAb: ab }), ab);
const zustand = (p) => p.evaluate(() => {
  document.dispatchEvent(new Event('visibilitychange'));
  const s = document.getElementById('zfPflicht'), l = document.getElementById('zfLeiste');
  return { sperre: !!s && !s.hidden && !!s.getClientRects().length, leiste: getComputedStyle(l).display !== 'none',
           leisteText: (document.getElementById('zfLeisteText') || {}).textContent || '', sperreText: (document.getElementById('zfPflichtText') || {}).textContent || '' };
});

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. Das Werkzeug der Geschäftsführung ──');
  {
    const p = await oeffne(b, 1440, 900, 'chef', true);
    await p.evaluate(() => { const a = [...document.querySelectorAll('[data-group="g-alles"]')].find(x => x.getClientRects().length); if (a) a.click(); });
    await p.waitForTimeout(400);
    await p.evaluate(() => { const k = document.querySelector('[data-al-cgo="team"]'); if (k) k.click(); });
    await p.waitForTimeout(900);
    await p.evaluate(() => { const k = document.getElementById('zfStandKarte'); if (k && k.classList.contains('zu')) k.querySelector('.fold-head').click(); });
    await p.waitForTimeout(800);
    const vor = await p.evaluate(() => { const b = document.getElementById('zfPflichtAn'); return { text: (document.getElementById('zfPflichtStand') || {}).textContent || '', knopf: b && b.textContent, ab: b && +b.dataset.ab }; });
    const woche = Date.now() + 6 * 86400000;
    pruefe('ohne Pflicht: „Noch keine Pflicht" und „Pflicht ab <in einer Woche> einschalten"',
      /Noch keine Pflicht/.test(vor.text) && /^Pflicht ab \d\d\.\d\d\.\d{4} einschalten$/.test(vor.knopf || '') && vor.ab > woche && vor.ab < woche + 2 * 86400000, JSON.stringify(vor));
    let frage = '';
    p.removeAllListeners('dialog');
    p.on('dialog', d => { frage = d.message(); d.accept(); });
    await p.click('#zfPflichtAn');
    await p.waitForTimeout(700);
    pruefe('die Rückfrage nennt, wer noch offen ist', /Noch offen: /.test(frage) && /Hinweis mit Datum/.test(frage), frage);
    const gespeichert = await p.evaluate(() => window.firebase.firestore().collection('firmen/koerperformen/config').doc('zweiFaktor').get().then(d => d.data()));
    pruefe('gespeichert: pflichtAb = der Tag in einer Woche, mit wem und wann', gespeichert.pflichtAb === vor.ab && gespeichert.gesetztVon === 'demo-ich' && gespeichert.gesetztAm > 0, JSON.stringify(gespeichert));
    const nach = await p.evaluate(() => (document.getElementById('zfPflichtStand') || {}).textContent || '');
    pruefe('danach steht „Pflicht ab …" und wie viele noch offen sind', /Pflicht ab dem \d\d\.\d\d\.\d{4}/.test(nach) && /noch nicht eingerichtet/.test(nach) && /Pflicht wieder aus/.test(nach), nach);
    await p.click('#zfPflichtWeg');
    await p.waitForTimeout(600);
    const weg = await p.evaluate(() => (document.getElementById('zfPflichtStand') || {}).textContent || '');
    pruefe('„Pflicht wieder aus" nimmt es zurück', /Noch keine Pflicht/.test(weg), weg);
    pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 2.–5. Studioleitung ohne zweiten Faktor ──');
  {
    const p = await oeffne(b, 1440, 900, 'leiter', false);
    const z0 = await zustand(p);
    pruefe('ohne Stichtag: Leiste wie bisher, keine Sperre', z0.leiste && !z0.sperre && /Pflicht — zwei Minuten/.test(z0.leisteText), JSON.stringify(z0));
    await setzeStichtag(p, Date.now() + 7 * 86400000);
    await p.waitForTimeout(400);
    const z1 = await zustand(p);
    pruefe('2. Stichtag in einer Woche: die Leiste nennt das Datum, keine Sperre', z1.leiste && !z1.sperre && /^Ab \d\d\.\d\d\.\d{4} ist die Zwei-Faktor-Anmeldung/.test(z1.leisteText), JSON.stringify(z1));
    await setzeStichtag(p, Date.now() - 60000);
    await p.waitForTimeout(400);
    const z2 = await zustand(p);
    pruefe('3. Stichtag vorbei: die Sperre steht, mit Datum, die Leiste ist weg', z2.sperre && !z2.leiste && /^Seit dem \d\d\.\d\d\.\d{4}/.test(z2.sperreText), JSON.stringify(z2));
    const nurZwei = await p.evaluate(() => [...document.querySelectorAll('#zfPflicht button')].map(x => x.textContent.trim()));
    pruefe('3. dort nur „Jetzt einrichten" und „Abmelden"', JSON.stringify(nurZwei) === JSON.stringify(['Jetzt einrichten', 'Abmelden']), JSON.stringify(nurZwei));
    const drunter = await p.evaluate(() => { const e = document.elementFromPoint(innerWidth / 2, 60); return !!e.closest('#zfPflicht'); });
    pruefe('3. die App dahinter ist nicht erreichbar (oben liegt die Sperre)', drunter);
    await p.click('#zfPflichtLos');
    await p.waitForTimeout(900);
    const modal = await p.evaluate(() => {
      const m = document.getElementById('zfModal'); const box = m.querySelector('.pm-box') || m;
      const r = box.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + 20);
      return { offen: m.classList.contains('show'), oben: !!e && !!e.closest('#zfModal') };
    });
    pruefe('3. „Jetzt einrichten" öffnet das Fenster — ÜBER der Sperre', modal.offen && modal.oben, JSON.stringify(modal));
    await p.evaluate(() => { const u = firebase.auth().currentUser; u.multiFactor.enrolledFactors.push({ factorId: 'totp', uid: 'x', displayName: 'App' });
      document.getElementById('zfModal').classList.remove('show'); });
    const z3 = await zustand(p);
    pruefe('3. nach dem Einrichten ist die Sperre weg', !z3.sperre && !z3.leiste, JSON.stringify(z3));
    pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  {
    const p = await oeffne(b, 1440, 900, 'leiter', true);
    await setzeStichtag(p, Date.now() - 60000);
    await p.waitForTimeout(400);
    const z = await zustand(p);
    pruefe('4. GEGENPROBE mit zweitem Faktor: keine Sperre, keine Leiste', !z.sperre && !z.leiste, JSON.stringify(z));
    /* 5. Abschalten geht mit Pflicht nicht. */
    await p.evaluate(() => { const a = document.getElementById('uAvatar'); if (a) a.click(); });
    await p.waitForTimeout(600);
    await p.evaluate(() => { const t = [...document.querySelectorAll('[data-pmtab], .pm-tab')].find(x => /Sicherheit|Anmeldung/.test(x.textContent)); if (t) t.click(); });
    await p.waitForTimeout(300);
    const vorher = await p.evaluate(() => firebase.auth().currentUser.multiFactor.enrolledFactors.length);
    await p.evaluate(() => { const b = document.querySelector('[data-sich="zf-aus"]'); if (b) b.click(); });
    await p.waitForTimeout(500);
    const nachher = await p.evaluate(() => ({ n: firebase.auth().currentUser.multiFactor.enrolledFactors.length, toast: document.getElementById('toast').textContent }));
    pruefe('5. mit Pflicht lässt sich der Faktor nicht abschalten — und die App sagt, warum', vorher === 1 && nachher.n === 1 && /abschalten geht nicht/.test(nachher.toast), JSON.stringify({ vorher, nachher }));
    await p.close();
  }
  {
    const p = await oeffne(b, 1440, 900, 'mitarbeiter', false);
    await setzeStichtag(p, Date.now() - 60000);
    await p.waitForTimeout(400);
    const z = await zustand(p);
    pruefe('4. GEGENPROBE Mitarbeiterin (nicht Leitung): keine Sperre, keine Leiste', !z.sperre && !z.leiste, JSON.stringify(z));
    await p.close();
  }

  console.log('\n── 6. Treffer ──');
  for (const [w, h] of [[320, 640], [390, 844], [1440, 900]]) {
    const p = await oeffne(b, w, h, 'leiter', false);
    await setzeStichtag(p, Date.now() - 60000);
    await p.waitForTimeout(400);
    await zustand(p);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const k = await p.evaluate((SRC) => {
        const T = eval('(' + SRC + ')');
        return [...document.querySelectorAll('#zfPflicht button')].map(el => { const m = T(el), r = el.getBoundingClientRect(); return { id: el.id, w: m.w, h: m.h, drin: r.left >= 0 && r.right <= innerWidth }; })
          .concat([{ quer: document.documentElement.scrollWidth - innerWidth }]);
      }, TREFFER.toString());
      const knoepfe = k.slice(0, -1), quer = k[k.length - 1].quer;
      pruefe(w + ' px, ' + dichte + ': beide Knöpfe der Sperre ≥ 44 × 44, im Bild', knoepfe.length === 2 && knoepfe.every(x => x.w >= 44 && x.h >= 44 && x.drin) && quer <= 0, JSON.stringify(k));
    }
    await p.close();
  }

  await b.close();
  console.log('\n' + gut + ' bestanden, ' + schlecht + ' gefallen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
