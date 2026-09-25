/* ══════════════════════════════════════════════════════════════════════
   ZWEI-FAKTOR-ANMELDUNG PER AUTHENTICATOR-APP (Runde 119)

   Aus dem Betrieb, 25.9.2026: 2FA „ja für chefs, Admin und studioleiter
   accounts"; auf die Frage nach Kosten und Alternativen zur SMS die
   Empfehlung Authenticator-App (TOTP).

   Was hier NICHT geprüft werden kann: ob Googles Server den Code annimmt.
   Das Firebase-SDK lädt in dieser Umgebung nicht, und TOTP ist im Projekt
   erst eingeschaltet, wenn der Befehl aus docs/ZWEI-FAKTOR.md gelaufen
   ist. Geprüft wird deshalb, was die App SCHICKT — genau die drei Aufrufe
   an identitytoolkit.googleapis.com, mit den Feldern, die das modulare SDK
   schickt (nachgelesen in firebase-auth.js 10.12.2) — und was sie mit den
   Antworten macht.

   1. Anmelden: das Konto verlangt den zweiten Faktor → der zweite Schritt
      steht da, alles andere tritt zurück. Falscher Code → „stimmt nicht";
      richtiger → mfaSignIn:finalize mit mfaPendingCredential,
      mfaEnrollmentId und dem Code. Abbrechen → zurück zum Formular.
   2. Einrichten (Chef in der Demo): die Leiste „Pflicht für die Leitung",
      das Fenster mit QR-Code, Schlüssel, Link für das Handy;
      mfaEnrollment:start und :finalize mit den richtigen Feldern; danach
      „an", Leiste weg.
   3. Verwaltung → Team: „Zwei-Faktor bei der Leitung" mit dem Stand.
   4. Ist die 2FA im Projekt noch nicht eingeschaltet (konfig.js), sagt
      die App das — keine Leiste, kein Knopf, der auf einen Fehler läuft.
   5. Treffer ≥ 44 × 44, 320–1920 px, normal und kompakt.
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

/* Die Serverseite von Google, nachgestellt. Merkt sich jeden Aufruf. */
async function googleNachstellen(p, anfragen) {
  await p.route('**://identitytoolkit.googleapis.com/**', async (r) => {
    const url = r.request().url();
    const body = JSON.parse(r.request().postData() || '{}');
    anfragen.push({ pfad: url.split('/v2/accounts/')[1].split('?')[0], key: /key=/.test(url), body });
    const code = body.totpVerificationInfo && body.totpVerificationInfo.verificationCode;
    let antwort = { status: 200, body: {} };
    if (/mfaEnrollment:start/.test(url)) {
      antwort.body = { totpSessionInfo: { sharedSecretKey: 'JBSWY3DPEHPK3PXPJBSWY3DP', verificationCodeLength: 6,
        hashingAlgorithm: 'SHA1', periodSec: 30, sessionInfo: 'sess-1', finalizeEnrollmentTime: new Date(Date.now() + 6e5).toISOString() } };
    } else if (code !== '654321' && code !== '123456') {
      antwort = { status: 400, body: { error: { code: 400, message: 'INVALID_CODE' } } };
    } else {
      antwort.body = { idToken: 'neu-id', refreshToken: 'neu-refresh' };
    }
    await r.fulfill({ status: antwort.status, contentType: 'application/json', body: JSON.stringify(antwort.body) });
  });
}
async function konfigMit2FA(p, an) {
  await p.route('**/konfig.js', async (r) => {
    const res = await r.fetch();
    const t = await res.text();
    await r.fulfill({ response: res, body: t.replace('zweiFaktor: false', 'zweiFaktor: ' + (an ? 'true' : 'false')) });
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. Anmelden mit zweitem Faktor ──');
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
            hints: [{ factorId: 'totp', uid: 'faktor-1', displayName: 'Authenticator-App' }],
            /* Wie das SDK: es ruft assertion._process(auth, session) mit
               session.type 'signin' und der offenen Anmeldung. */
            resolveSignIn: (a) => a._process({}, { type: 'signin', credential: 'offen-1' }).then(() => { window.__fertig++; }),
          },
        });
        return obj;
      };
      Object.assign(window.firebase.auth, alt);
    });
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2200);
    await p.fill('#lgEmail', 'chef@studio.de');
    await p.fill('#lgPw', 'geheim123');
    await p.click('#loginBtn');
    await p.waitForTimeout(400);
    const z = await p.evaluate(() => ({
      schritt: !document.getElementById('lgZweiFaktor').hidden,
      mailWeg: getComputedStyle(document.getElementById('lgEmail').closest('.field')).display === 'none',
      googleWeg: !document.getElementById('lgGoogle').getClientRects().length,
      fokus: document.activeElement && document.activeElement.id,
    }));
    pruefe('der zweite Schritt steht da, E-Mail/Passwort/Google treten zurück, der Cursor steht im Codefeld',
      z.schritt && z.mailWeg && z.googleWeg && z.fokus === 'lgZfCode', JSON.stringify(z));
    await p.fill('#lgZfCode', '111 111');
    await p.click('#lgZfOk');
    await p.waitForTimeout(400);
    const f1 = await p.evaluate(() => document.getElementById('lgZfErr').textContent);
    pruefe('falscher Code: „Der Code stimmt nicht"', /stimmt nicht/.test(f1), f1);
    await p.fill('#lgZfCode', '123 456');
    await p.click('#lgZfOk');
    await p.waitForTimeout(400);
    const letzte = anfragen[anfragen.length - 1] || {};
    pruefe('richtiger Code: mfaSignIn:finalize mit offener Anmeldung, Faktor und Code (Leerzeichen raus), mit API-Schlüssel',
      letzte.pfad === 'mfaSignIn:finalize' && letzte.key && letzte.body.mfaPendingCredential === 'offen-1' &&
      letzte.body.mfaEnrollmentId === 'faktor-1' && letzte.body.totpVerificationInfo.verificationCode === '123456', JSON.stringify(letzte));
    const nach = await p.evaluate(() => ({ fertig: window.__fertig, schritt: !document.getElementById('lgZweiFaktor').hidden }));
    pruefe('… und die Anmeldung ist durch, der zweite Schritt wieder weg', nach.fertig === 1 && !nach.schritt, JSON.stringify(nach));
    await p.click('#loginBtn');
    await p.waitForTimeout(300);
    await p.click('#lgZfAbbruch');
    await p.waitForTimeout(300);
    const ab = await p.evaluate(() => ({ schritt: !document.getElementById('lgZweiFaktor').hidden,
      mail: getComputedStyle(document.getElementById('lgEmail').closest('.field')).display !== 'none' }));
    pruefe('„Abbrechen": zurück zum normalen Formular', !ab.schritt && ab.mail, JSON.stringify(ab));
    pruefe('ohne Skriptfehler', !fehler.length, fehler.join(' | '));

    console.log('\n── 5a. Treffen im zweiten Schritt ──');
    for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
      await p.setViewportSize({ width: w, height: h });
      await p.click('#loginBtn').catch(() => {});
      await p.waitForTimeout(250);
      for (const dichte of ['normal', 'kompakt']) {
        await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
        const k = await p.evaluate(async (SRC) => {
          const T = eval('(' + SRC + ')');
          const els = [...document.querySelectorAll('#lgZweiFaktor button, #lgZweiFaktor input')];
          const zu = [];
          for (const el of els) { el.scrollIntoView({ block: 'center' }); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            const m = T(el); if (m.w < 44 || m.h < 44) zu.push(el.id + ' ' + m.w + '×' + m.h); }
          return { zahl: els.length, zu, quer: document.documentElement.scrollWidth - innerWidth };
        }, TREFFER.toString());
        pruefe(w + ' px, ' + dichte + ': Code, Bestätigen, Abbrechen ≥ 44 × 44', k.zahl === 3 && !k.zu.length && k.quer <= 0, JSON.stringify(k));
      }
      await p.click('#lgZfAbbruch').catch(() => {});
    }
    await p.close();
  }

  console.log('\n── 2.+3. Einrichten (Demo, Geschäftsführung) ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const fehler = []; p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    const anfragen = [];
    await googleNachstellen(p, anfragen);
    await konfigMit2FA(p, true);
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3000);
    /* Die Demo-Anmeldung kennt keinen zweiten Faktor. Hier bekommt sie
       einen, der sich verhält wie das SDK: getSession() → {type:'enroll',
       credential}, enroll(assertion, name) → assertion._process(...). */
    await p.evaluate(() => {
      const u = firebase.auth().currentUser;
      u.emailVerified = true;
      u.multiFactor = {
        enrolledFactors: [],
        getSession: () => Promise.resolve({ type: 'enroll', credential: 'id-tok' }),
        enroll(a, name) { return a._process({}, { type: 'enroll', credential: 'id-tok' }, name).then(() => { this.enrolledFactors.push({ factorId: 'totp', uid: 'f-neu', displayName: name }); }); },
        unenroll(f) { this.enrolledFactors = []; return Promise.resolve(); },
      };
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const leiste = await p.evaluate(() => getComputedStyle(document.getElementById('zfLeiste')).display !== 'none');
    pruefe(w + ' px: die Leiste „Pflicht für die Leitung" steht', leiste);
    await p.click('#zfLeisteAuf');
    await p.waitForTimeout(1200);
    const f = await p.evaluate(() => ({
      offen: document.getElementById('zfModal').classList.contains('show'),
      qr: !!document.querySelector('#zfQr svg path'),
      schluessel: document.getElementById('zfSchluessel').textContent,
      link: document.getElementById('zfLink').getAttribute('href'),
    }));
    const start = anfragen.find(a => a.pfad === 'mfaEnrollment:start') || {};
    pruefe('mfaEnrollment:start mit dem Token der Sitzung und leerem totpEnrollmentInfo',
      start.body && start.body.idToken === 'id-tok' && JSON.stringify(start.body.totpEnrollmentInfo) === '{}', JSON.stringify(start));
    pruefe('das Fenster zeigt QR-Code, Schlüssel in Vierergruppen und den Link fürs Handy',
      f.offen && f.qr && f.schluessel === 'JBSW Y3DP EHPK 3PXP JBSW Y3DP' &&
      /^otpauth:\/\/totp\/StudioChat:.+\?secret=JBSWY3DPEHPK3PXPJBSWY3DP&issuer=StudioChat&algorithm=SHA1&digits=6&period=30$/.test(f.link), JSON.stringify(f));
    await p.fill('#zfCode', '000000');
    await p.click('#zfBestaetigen');
    await p.waitForTimeout(400);
    const e1 = await p.evaluate(() => document.getElementById('zfErr').textContent);
    pruefe('falscher Code: „stimmt nicht", Fenster bleibt', /stimmt nicht/.test(e1), e1);
    await p.fill('#zfCode', '654321');
    await p.click('#zfBestaetigen');
    await p.waitForTimeout(500);
    const fin = anfragen.filter(a => a.pfad === 'mfaEnrollment:finalize').pop() || {};
    pruefe('mfaEnrollment:finalize mit Token, Name, sessionInfo und Code',
      fin.body && fin.body.idToken === 'id-tok' && fin.body.displayName === 'Authenticator-App' &&
      fin.body.totpVerificationInfo.sessionInfo === 'sess-1' && fin.body.totpVerificationInfo.verificationCode === '654321', JSON.stringify(fin));
    const nach = await p.evaluate(() => ({
      zu: !document.getElementById('zfModal').classList.contains('show'),
      leiste: getComputedStyle(document.getElementById('zfLeiste')).display !== 'none',
    }));
    pruefe('danach: Fenster zu, Leiste weg', nach.zu && !nach.leiste, JSON.stringify(nach));
    await p.evaluate(() => document.getElementById('uAvatar').click());
    await p.waitForTimeout(400);
    const zeile = await p.evaluate(() => [...document.querySelectorAll('#pmSicherheit .sich-zeile')].map(z => z.innerText.replace(/\s+/g, ' ')).find(t => /Zwei-Faktor/.test(t)) || '');
    pruefe('Einstellungen: „Zwei-Faktor-Anmeldung an — Authenticator-App", mit Abschalten', /an — Authenticator-App/.test(zeile) && /Abschalten/.test(zeile), zeile);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(200);

    await p.evaluate(() => { const a = document.querySelector('#side [data-group="g-alles"], .mobnav [data-group="g-alles"]'); if (a) a.click(); });
    await p.waitForTimeout(400);
    await p.evaluate(() => { const k = document.querySelector('[data-al-cgo="team"]'); if (k) k.click(); });
    await p.waitForTimeout(900);
    await p.evaluate(() => { const k = document.getElementById('zfStandKarte'); if (k && k.classList.contains('zu')) k.querySelector('.fold-head').click(); });
    await p.waitForTimeout(500);
    const stand = await p.evaluate(() => ({
      summe: (document.querySelector('#zfStand .zf-summe') || {}).textContent || '',
      zeilen: document.querySelectorAll('#zfStand li').length,
    }));
    pruefe('Verwaltung → Team: „x von y eingerichtet" mit einer Zeile je Leitungskonto', /\d+ von \d+/.test(stand.summe) && stand.zeilen > 1, JSON.stringify(stand));

    // Treffer im Fenster
    await p.evaluate(() => { firebase.auth().currentUser.multiFactor.enrolledFactors = []; document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForTimeout(200);
    await p.click('#zfLeisteAuf');
    await p.waitForTimeout(900);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const k = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const els = [...document.querySelectorAll('#zfModal button, #zfModal input, #zfModal a')].filter(e => e.getClientRects().length);
        const zu = [];
        for (const el of els) { el.scrollIntoView({ block: 'center' }); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el); if (m.w < 44 || m.h < 44) zu.push((el.id || el.textContent.trim().slice(0, 16)) + ' ' + m.w + '×' + m.h); }
        return { zahl: els.length, zu, quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      pruefe(w + ' px, ' + dichte + ': alles im Fenster ≥ 44 × 44', k.zahl >= 4 && !k.zu.length && k.quer <= 0, JSON.stringify(k));
    }
    pruefe('ohne Skriptfehler', !fehler.length, fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 4. Im Projekt noch nicht eingeschaltet ──');
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await konfigMit2FA(p, false);
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3000);
    await p.evaluate(() => { firebase.auth().currentUser.multiFactor = { enrolledFactors: [], getSession: () => Promise.resolve({}) }; document.dispatchEvent(new Event('visibilitychange')); document.getElementById('uAvatar').click(); });
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => ({
      leiste: getComputedStyle(document.getElementById('zfLeiste')).display !== 'none',
      zeile: [...document.querySelectorAll('#pmSicherheit .sich-zeile')].map(z => z.innerText.replace(/\s+/g, ' ')).find(t => /Zwei-Faktor/.test(t)) || '',
      knopf: !!document.querySelector('#pmSicherheit [data-sich="zf-an"]'),
    }));
    pruefe('keine Leiste, kein Einrichten-Knopf, sondern „wird gerade freigeschaltet"', !r.leiste && !r.knopf && /freigeschaltet/.test(r.zeile), JSON.stringify(r));
    await p.close();
  }

  await b.close();
  console.log('\n' + gut + ' gut, ' + schlecht + ' schlecht');
  if (schlecht) console.log('✗ Zwei-Faktor: ' + schlecht + ' Prüfungen fehlgeschlagen');
  process.exit(schlecht ? 1 : 0);
})();
