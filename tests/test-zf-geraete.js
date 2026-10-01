/* ══════════════════════════════════════════════════════════════════════
   ZWEI-FAKTOR AUF MEHREREN GERÄTEN (1.10.2026)

   Aus dem Betrieb: „kannst du noch dafür sorgen das man nicht jedes mal
   … einen code aus einer app eintragen muss ODER das man sich so ein code
   auch via email zukommen lassen kann weil ich zum beispiel hab die
   autenthicater app nur auf dem pc und kann jetzt draussen nichts machen".

   Gebaut ist: weitere Geräte (Handy, Tablet …) als eigene zweite Faktoren
   — Firebase erlaubt bis zu fünf. Beim Anmelden probiert die App den Code
   gegen jedes Gerät, zuerst das, das hier zuletzt gepasst hat.

   1. Anmelden mit zwei Geräten: der Code vom zweiten Gerät geht, ohne
      dass man wählen muss; danach wird zuerst das zweite probiert; ein
      falscher Code wird gegen beide geprüft und dann abgelehnt.
   2. Einrichten eines weiteren Geräts (Demo-Chef): „Weiteres Gerät",
      Name „Handy", mfaEnrollment:finalize mit diesem Namen; danach zwei
      Zeilen mit „Entfernen"; eines entfernen lässt das andere stehen.
   3. Treffer ≥ 44 × 44 bei 320 / 390 / 1440 / 1920, normal und kompakt.

   Was NICHT geprüft werden kann: ob Googles Server einen zweiten
   TOTP-Faktor annimmt. Laut Firebase-Doku sind bis zu fünf zweite
   Faktoren je Konto erlaubt; nachgestellt wird hier der Server.
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
/* Googles Server: jedes Gerät hat seinen eigenen gültigen Code. */
const GUELTIG = { 'faktor-pc': '111111', 'faktor-handy': '222222' };
async function googleNachstellen(p, anfragen) {
  await p.route('**://identitytoolkit.googleapis.com/**', async (r) => {
    const url = r.request().url();
    const body = JSON.parse(r.request().postData() || '{}');
    anfragen.push({ pfad: url.split('/v2/accounts/')[1].split('?')[0], body });
    const code = body.totpVerificationInfo && body.totpVerificationInfo.verificationCode;
    let a = { status: 200, body: { idToken: 'neu', refreshToken: 'neu' } };
    if (/mfaEnrollment:start/.test(url)) {
      a.body = { totpSessionInfo: { sharedSecretKey: 'JBSWY3DPEHPK3PXPJBSWY3DP', verificationCodeLength: 6, hashingAlgorithm: 'SHA1', periodSec: 30, sessionInfo: 'sess-2' } };
    } else if (/mfaSignIn:finalize/.test(url)) {
      if (GUELTIG[body.mfaEnrollmentId] !== code) a = { status: 400, body: { error: { code: 400, message: 'INVALID_CODE' } } };
    } else if (/mfaEnrollment:finalize/.test(url) && code !== '333333') {
      a = { status: 400, body: { error: { code: 400, message: 'INVALID_CODE' } } };
    }
    await r.fulfill({ status: a.status, contentType: 'application/json', body: JSON.stringify(a.body) });
  });
}
async function konfigMit2FA(p) {
  await p.route('**/konfig.js', async (r) => {
    const res = await r.fetch(); const t = await res.text();
    await r.fulfill({ response: res, body: t.replace(/zweiFaktor:\s*(true|false)/, 'zweiFaktor: true') });
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. Anmelden mit zwei Geräten ──');
  {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    const fehler = []; p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    const anfragen = [];
    await googleNachstellen(p, anfragen);
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript({ path: __dirname + '/stub-ohne-login.js' });
    await p.addInitScript(() => {
      window.__fertig = 0;
      const alt = window.firebase.auth; let obj = null;
      window.firebase.auth = function () {
        if (obj) return obj;
        obj = alt();
        obj.signInWithEmailAndPassword = () => Promise.reject({
          code: 'auth/multi-factor-auth-required',
          resolver: {
            hints: [{ factorId: 'totp', uid: 'faktor-pc', displayName: 'PC' }, { factorId: 'totp', uid: 'faktor-handy', displayName: 'Handy' }],
            resolveSignIn: (a) => a._process({}, { type: 'signin', credential: 'offen-1' }).then(() => { window.__fertig++; }),
          },
        });
        return obj;
      };
      Object.assign(window.firebase.auth, alt);
    });
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2200);
    const anmelden = async () => {
      await p.fill('#lgEmail', 'chef@studio.de'); await p.fill('#lgPw', 'geheim123');
      await p.click('#loginBtn'); await p.waitForTimeout(400);
    };
    await anmelden();
    const n0 = anfragen.length;
    await p.fill('#lgZfCode', '999 999');
    await p.click('#lgZfOk'); await p.waitForTimeout(500);
    const falsch = { err: await p.evaluate(() => document.getElementById('lgZfErr').textContent), versuche: anfragen.slice(n0).map(a => a.body.mfaEnrollmentId) };
    pruefe('falscher Code: gegen beide Geräte geprüft, dann „stimmt nicht"', /stimmt nicht/.test(falsch.err) && falsch.versuche.join(',') === 'faktor-pc,faktor-handy', JSON.stringify(falsch));
    const n1 = anfragen.length;
    await p.fill('#lgZfCode', '222 222');
    await p.click('#lgZfOk'); await p.waitForTimeout(500);
    const handy = { fertig: await p.evaluate(() => window.__fertig), versuche: anfragen.slice(n1).map(a => a.body.mfaEnrollmentId),
      gemerkt: await p.evaluate(() => localStorage.getItem('kf_zf_geraet')) };
    pruefe('Code vom Handy: geht ohne Auswahl (erst PC probiert, dann Handy)', handy.fertig === 1 && handy.versuche.join(',') === 'faktor-pc,faktor-handy', JSON.stringify(handy));
    pruefe('… und das Gerät wird für dieses Gerät gemerkt', handy.gemerkt === 'faktor-handy', String(handy.gemerkt));
    /* Zweites Anmelden: zuerst das gemerkte. */
    await p.evaluate(() => { if (typeof zfAnmeldungEnde === 'function') zfAnmeldungEnde(); });
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200);
    await anmelden();
    const n2 = anfragen.length;
    await p.fill('#lgZfCode', '222222');
    await p.click('#lgZfOk'); await p.waitForTimeout(500);
    const zweites = anfragen.slice(n2).map(a => a.body.mfaEnrollmentId);
    pruefe('beim nächsten Mal wird das Handy zuerst probiert — ein Aufruf genügt', zweites.join(',') === 'faktor-handy', zweites.join(','));
    pruefe('keine Skriptfehler', !fehler.length, fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 2. Ein weiteres Gerät einrichten ──');
  async function mitEinemGeraet(w, h, dichte) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    p._fehler = []; p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
    p._anfragen = [];
    await googleNachstellen(p, p._anfragen);
    await konfigMit2FA(p);
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3000);
    if (dichte) await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
    await p.evaluate(() => {
      const u = firebase.auth().currentUser;
      u.emailVerified = true;
      u.multiFactor = {
        enrolledFactors: [{ factorId: 'totp', uid: 'faktor-pc', displayName: 'Authenticator-App', enrollmentTime: new Date().toUTCString() }],
        getSession: () => Promise.resolve({ type: 'enroll', credential: 'id-tok' }),
        enroll(a, name) { return a._process({}, { type: 'enroll', credential: 'id-tok' }, name).then(() => { this.enrolledFactors.push({ factorId: 'totp', uid: 'faktor-neu', displayName: name }); }); },
        unenroll(f) { this.enrolledFactors = this.enrolledFactors.filter(x => x.uid !== f.uid); return Promise.resolve(); },
      };
      document.dispatchEvent(new Event('visibilitychange'));
    });
    p.on('dialog', d => d.accept());
    await p.evaluate(() => document.getElementById('uAvatar').click());
    await p.waitForTimeout(500);
    return p;
  }
  const zfZeilen = (p) => p.evaluate(() => [...document.querySelectorAll('#pmSicherheit .sich-zeile')].map(z => z.innerText.replace(/\s+/g, ' ')).filter(t => /Zwei-Faktor|Handy|Authenticator/.test(t)));
  {
    const p = await mitEinemGeraet(1440, 900);
    const vorher = await zfZeilen(p);
    pruefe('ein Gerät: „Weiteres Gerät" und „Abschalten" stehen da', vorher.some(t => /Weiteres Gerät/.test(t) && /Abschalten/.test(t)), JSON.stringify(vorher));
    await p.click('#pmSicherheit [data-sich="zf-mehr"]');
    await p.waitForTimeout(1200);
    const fenster = await p.evaluate(() => ({ offen: document.getElementById('zfModal').classList.contains('show'),
      name: !document.getElementById('zfNameFeld').hidden && document.getElementById('zfName').value,
      knopf: document.getElementById('zfBestaetigen').textContent, qr: !!document.querySelector('#zfQr svg') }));
    pruefe('Fenster mit QR-Code, Gerätename „Handy" vorbelegt, Knopf „Gerät hinzufügen"', fenster.offen && fenster.name === 'Handy' && fenster.knopf === 'Gerät hinzufügen' && fenster.qr, JSON.stringify(fenster));
    await p.fill('#zfCode', '333333');
    await p.click('#zfBestaetigen'); await p.waitForTimeout(600);
    const fin = p._anfragen.filter(a => a.pfad === 'mfaEnrollment:finalize').pop() || {};
    pruefe('mfaEnrollment:finalize mit dem Namen „Handy"', fin.body && fin.body.displayName === 'Handy' && fin.body.totpVerificationInfo.sessionInfo === 'sess-2', JSON.stringify(fin.body));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    await p.evaluate(() => document.getElementById('uAvatar').click()); await p.waitForTimeout(500);
    const nach = await zfZeilen(p);
    const knoepfe = await p.evaluate(() => document.querySelectorAll('#pmSicherheit [data-sich="zf-weg"]').length);
    pruefe('danach: „auf 2 Geräten", je eine Zeile mit „Entfernen"', nach.some(t => /auf 2 Geräten/.test(t)) && nach.some(t => /^Handy/.test(t)) && knoepfe === 2, JSON.stringify(nach));
    await p.click('#pmSicherheit .zf-geraet:first-of-type [data-sich="zf-weg"]').catch(() => p.evaluate(() => document.querySelector('#pmSicherheit [data-sich="zf-weg"]').click()));
    await p.waitForTimeout(500);
    const rest = await p.evaluate(() => firebase.auth().currentUser.multiFactor.enrolledFactors.map(f => f.displayName));
    pruefe('ein Gerät entfernt: das andere bleibt', rest.length === 1, JSON.stringify(rest));
    pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 3. Treffer ──');
  for (const [w, h] of [[320, 640], [390, 844], [1440, 900], [1920, 1080]]) {
    for (const dichte of ['normal', 'kompakt']) {
      const p = await mitEinemGeraet(w, h, dichte);
      const m = await p.evaluate((SRC) => {
        const T = eval('(' + SRC + ')');
        return [...document.querySelectorAll('#pmSicherheit [data-sich^="zf-"]')].map(el => { el.scrollIntoView({ block: 'center' }); const t = T(el), r = el.getBoundingClientRect(); return { s: el.dataset.sich, w: t.w, h: t.h, drin: r.left >= 0 && r.right <= innerWidth }; })
          .concat([{ quer: document.documentElement.scrollWidth - innerWidth }]);
      }, TREFFER.toString());
      const kn = m.slice(0, -1);
      pruefe(w + ' px, ' + dichte + ': „Weiteres Gerät" und „Abschalten" ≥ 44 × 44, im Bild, keine Querlaufleiste',
        kn.length === 2 && kn.every(x => x.w >= 44 && x.h >= 44 && x.drin) && m[m.length - 1].quer <= 0, JSON.stringify(m));
      await p.close();
    }
  }

  await b.close();
  console.log('\n' + gut + ' bestanden, ' + schlecht + ' gefallen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
