/* ══════════════════════════════════════════════════════════════════════
   ANMELDE-MAILS UND DER LINK DARAUS (Runde 146)

   Aus dem Betrieb, 6.10.2026: „die Mail Bestätigung geht auch oft nicht,
   und manche Mails kommen nie an auch nicht im Spam".

   Was hier NICHT geprüft werden kann und deshalb nicht behauptet wird:
   dass eine echte Mail bei web.de, GMX oder Outlook ankommt. Geprüft wird,
   was die App tut — mit Attrappen für Firebase und die Funktion. Den
   Server-Teil (deutsch, Absender, echter Code, Bremse) prüft
   tests/rules/auth-mail.test.js im Emulator.

   1. „Passwort vergessen" geht über authMailSenden, nicht über Firebase.
      Ohne SMTP / Versandfehler → der alte Weg über Firebase.
      Bremse („Minute warten") → der Satz vom Server, KEIN Rückfall.
   2. Link ?mode=verifyEmail&oobCode=…: Fenster über allem, auch ohne
      Anmeldung; der Code verschwindet aus der Adresszeile; eingelöst wird
      erst auf Knopfdruck (Scanner!); danach „Bestätigt ✓".
      Abgelaufener Link → verständlicher Satz statt Fehlercode.
   3. Link ?mode=resetPassword&oobCode=…: 7 Zeichen → abgelehnt, ohne
      Aufruf; zwei verschiedene → abgelehnt; 8 Zeichen → gespeichert, die
      Adresse steht danach im Anmeldefeld.
   4. Firebase spricht Deutsch (languageCode 'de').
   5. Treffer ≥ 44 × 44 der Knöpfe im Fenster bei 320–1920 px, normal und
      kompakt; der Knopf liegt obenauf (Hit-Test trifft ihn, nicht das
      Startbild).
   ══════════════════════════════════════════════════════════════════ */
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

/* Attrappe: zeichnet Aufrufe auf; window.__fn bestimmt, was authMailSenden
   antwortet, window.__code, was die Codes tun. */
const MAIL_STUB = () => {
  window.__aufrufe = [];
  window.__fn = 'ok';
  window.__code = window.__codeStart || 'ok';
  const alt = window.firebase.auth;
  let obj = null;
  window.firebase.auth = function () {
    if (obj) return obj;
    obj = alt();
    obj.sendPasswordResetEmail = (m) => { window.__aufrufe.push('firebase-pw:' + m); return Promise.resolve(); };
    obj.applyActionCode = (c) => { window.__aufrufe.push('apply:' + c);
      return window.__code === 'ok' ? Promise.resolve() : Promise.reject({ code: 'auth/invalid-action-code' }); };
    obj.verifyPasswordResetCode = (c) => { window.__aufrufe.push('verify:' + c);
      return window.__code === 'ok' ? Promise.resolve('lea@studio.de') : Promise.reject({ code: 'auth/expired-action-code' }); };
    obj.confirmPasswordReset = (c, pw) => { window.__aufrufe.push('confirm:' + c + ':' + pw.length); return Promise.resolve(); };
    return obj;
  };
  Object.assign(window.firebase.auth, alt);
  const f = window.firebase.app().functions();
  f.httpsCallable = (name) => (daten) => {
    window.__aufrufe.push('fn:' + name + ':' + JSON.stringify(daten));
    if (window.__fn === 'ok') return Promise.resolve({ data: { ok: true } });
    if (window.__fn === 'ohne-smtp') return Promise.reject({ code: 'functions/failed-precondition', message: 'kein-smtp' });
    if (window.__fn === 'bremse') return Promise.reject({ code: 'functions/resource-exhausted', message: 'Gerade eben schon verschickt. Bitte eine Minute warten — und im Spam nachsehen.' });
    return Promise.reject({ code: 'functions/internal', message: 'x' });
  };
};

async function seite(b, w, h, suche, codeStart) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**://apis.google.com/**', r => r.abort());
  await p.addInitScript({ path: __dirname + '/stub-ohne-login.js' });
  if (codeStart) await p.addInitScript((c) => { window.__codeStart = c; }, codeStart);
  await p.addInitScript(MAIL_STUB);
  await p.goto(APP + (suche || ''), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2200);
  return p;
}
const aufrufe = (p) => p.evaluate(() => window.__aufrufe.slice());

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. „Passwort vergessen" ──');
  for (const [fall, erwartet] of [['ok', 'eigener'], ['ohne-smtp', 'rückfall'], ['kaputt', 'rückfall'], ['bremse', 'bremse']]) {
    const p = await seite(b, 390, 844);
    await p.evaluate((f) => { window.__fn = f; }, fall);
    await p.fill('#lgEmail', 'Lea@Studio.de');
    await p.click('#forgotLink');
    await p.waitForTimeout(500);
    const a = await aufrufe(p);
    const err = await p.evaluate(() => document.getElementById('loginErr').textContent);
    const eigener = a.some(x => /^fn:authMailSenden:.*"art":"passwort".*Lea@Studio\.de/.test(x));
    const firebase = a.some(x => /^firebase-pw:/.test(x));
    if (erwartet === 'eigener') pruefe('über den eigenen Versand (authMailSenden), nicht über Firebase', eigener && !firebase, a.join(' | '));
    if (erwartet === 'rückfall') pruefe('Funktion ' + (fall === 'ohne-smtp' ? 'ohne SMTP' : 'mit Fehler') + ' → Rückfall auf Firebase', eigener && firebase, a.join(' | '));
    if (erwartet === 'bremse') pruefe('Bremse → der Satz vom Server, KEIN Rückfall', eigener && !firebase && /Minute warten/.test(err), err + ' / ' + a.join(' | '));
    pruefe('… ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 2. Link: Adresse bestätigen ──');
  {
    const p = await seite(b, 390, 844, '?mode=verifyEmail&oobCode=ABC123');
    const z = await p.evaluate(() => ({ offen: document.getElementById('aktionModal').classList.contains('show'),
      kopf: document.getElementById('akKopf').textContent, adresse: location.href, aufrufe: window.__aufrufe.slice() }));
    pruefe('Fenster offen, auch ohne Anmeldung: „E-Mail-Adresse bestätigen"', z.offen && /bestätigen/.test(z.kopf), JSON.stringify(z));
    pruefe('der Code ist aus der Adresszeile verschwunden', !/oobCode/.test(z.adresse), z.adresse);
    pruefe('noch NICHT eingelöst (erst auf Knopfdruck — Scanner öffnen Links vorab)', !z.aufrufe.some(x => /^apply:/.test(x)), z.aufrufe.join(' | '));
    const auf = await p.evaluate((SRC) => { const T = eval('(' + SRC + ')'); return T(document.getElementById('akBestaetigenKnopf')); }, TREFFER.toString());
    pruefe('der Knopf liegt obenauf (Hit-Test trifft ihn, nicht das Startbild)', auf.w >= 44 && auf.h >= 44, JSON.stringify(auf));
    await p.click('#akBestaetigenKnopf');
    await p.waitForTimeout(300);
    const n = await p.evaluate(() => ({ text: document.getElementById('akMeldung').textContent, weiter: !document.getElementById('akWeiter').hidden, a: window.__aufrufe.slice() }));
    pruefe('Knopfdruck → eingelöst mit genau diesem Code, „Bestätigt ✓"', n.a.includes('apply:ABC123') && /Bestätigt ✓/.test(n.text) && n.weiter, JSON.stringify(n));
    await p.click('#akWeiter');
    pruefe('„Zur App" schliesst', !(await p.evaluate(() => document.getElementById('aktionModal').classList.contains('show'))));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  {
    const p = await seite(b, 390, 844, '?mode=verifyEmail&oobCode=ALT');
    await p.evaluate(() => { window.__code = 'abgelaufen'; });
    await p.click('#akBestaetigenKnopf');
    await p.waitForTimeout(300);
    const t = await p.evaluate(() => document.getElementById('akMeldung').textContent);
    pruefe('abgelaufener Link → ein Satz, was jetzt zu tun ist (kein Fehlercode)', /abgelaufen oder wurde schon benutzt/.test(t) && !/auth\//.test(t), t);
    await p.close();
  }

  console.log('\n── 3. Link: neues Passwort ──');
  {
    const p = await seite(b, 390, 844, '?mode=resetPassword&oobCode=PW9');
    const z = await p.evaluate(() => ({ fuer: document.getElementById('akPwFuer').textContent, sicht: !document.getElementById('akPasswort').hidden }));
    pruefe('Code geprüft, Fenster nennt die Adresse und 8 Zeichen', z.sicht && /lea@studio\.de/.test(z.fuer) && /8 Zeichen/.test(z.fuer), JSON.stringify(z));
    await p.fill('#akPw1', 'kurz123'); await p.fill('#akPw2', 'kurz123');
    await p.click('#akPwKnopf'); await p.waitForTimeout(200);
    let f = await p.evaluate(() => ({ t: document.getElementById('akPwFehler').textContent, a: window.__aufrufe.slice() }));
    pruefe('7 Zeichen → abgelehnt, ohne Aufruf an Firebase', /mindestens 8/.test(f.t) && !f.a.some(x => /^confirm:/.test(x)), JSON.stringify(f));
    await p.fill('#akPw1', 'lang-genug-1'); await p.fill('#akPw2', 'lang-genug-2');
    await p.click('#akPwKnopf'); await p.waitForTimeout(200);
    f = await p.evaluate(() => ({ t: document.getElementById('akPwFehler').textContent, a: window.__aufrufe.slice() }));
    pruefe('zwei verschiedene → abgelehnt', /stimmen nicht überein/.test(f.t) && !f.a.some(x => /^confirm:/.test(x)), JSON.stringify(f));
    await p.fill('#akPw2', 'lang-genug-1');
    await p.click('#akPwKnopf'); await p.waitForTimeout(300);
    const e = await p.evaluate(() => ({ a: window.__aufrufe.slice(), t: document.getElementById('akMeldung').textContent,
      mail: document.getElementById('lgEmail').value, knopf: document.getElementById('akWeiter').textContent }));
    pruefe('8+ Zeichen → gespeichert, Adresse steht im Anmeldefeld, „Zur Anmeldung"',
      e.a.includes('confirm:PW9:12') && /Gespeichert ✓/.test(e.t) && e.mail === 'lea@studio.de' && e.knopf === 'Zur Anmeldung', JSON.stringify(e));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  {
    const p = await seite(b, 390, 844, '?mode=resetPassword&oobCode=ALT', 'abgelaufen');
    const z = await p.evaluate(() => ({ t: document.getElementById('akMeldung').textContent, form: !document.getElementById('akPasswort').hidden }));
    pruefe('abgelaufener Passwort-Link → kein Formular, sondern „neuen anfordern"', !z.form && /abgelaufen/.test(z.t) && /Passwort vergessen/.test(z.t), JSON.stringify(z));
    await p.close();
  }

  console.log('\n── 4. Firebase spricht Deutsch ──');
  {
    const p = await seite(b, 390, 844);
    pruefe('auth.languageCode ist „de"', (await p.evaluate(() => firebase.auth().languageCode)) === 'de');
    await p.close();
  }

  console.log('\n── 5. Fingerziele ──');
  {
    const p = await seite(b, 390, 844, '?mode=resetPassword&oobCode=PW9');
    const zuKlein = [];
    let quer = 0;
    for (const [w, h] of GROESSEN) {
      await p.setViewportSize({ width: w, height: h });
      await p.waitForTimeout(250);
      for (const dichte of ['normal', 'kompakt']) {
        await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
        const m = await p.evaluate(async (SRC) => {
          const T = eval('(' + SRC + ')');
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const aus = {};
          for (const s of ['#akPwKnopf', '[data-pw="akPw1"]', '[data-pw="akPw2"]']) aus[s] = T(document.querySelector(s));
          return { aus, quer: document.documentElement.scrollWidth - innerWidth };
        }, TREFFER.toString());
        quer = Math.max(quer, m.quer);
        for (const [s, r] of Object.entries(m.aus)) if (r.w < 44 || r.h < 44) zuKlein.push(w + '/' + dichte + ' ' + s + ' ' + r.w + '×' + r.h);
      }
    }
    pruefe('„Passwort speichern" und die Augen: Treffer ≥ 44 × 44 bei 320–1920 px, normal und kompakt', !zuKlein.length, zuKlein.join(', '));
    pruefe('kein waagerechtes Scrollen', quer <= 0, quer + ' px');
    await p.close();
  }

  await b.close();
  console.log('\n' + (schlecht ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Anmelde-Mails: eigener Versand mit Rückfall, Link in die App, erst auf Knopfdruck — ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
