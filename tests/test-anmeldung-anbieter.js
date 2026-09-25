/* ══════════════════════════════════════════════════════════════════════
   MIT GOOGLE / APPLE ANMELDEN (Runde 118)

   Aus dem Betrieb, 25.9.2026:
     „Also es soll einen login geben über andere apps"
     „Noch nicht aber ich würde es alles gerne so vorbereiten das ich die
      app im appstore launchen könnte wenn ich ein entwickler konto habe"

   Was hier NICHT geprüft werden kann und deshalb nicht behauptet wird:
   der echte Weg zu Google. Das Firebase-SDK lädt in dieser Umgebung nicht,
   und ein echtes Google-Konto gibt es hier nicht. Geprüft wird, was die
   App mit den Antworten von Firebase macht — mit einer Attrappe, die genau
   diese Antworten gibt (Erfolg, Konto schon mit Passwort, nicht
   eingeschaltet, Popup gesperrt, abgebrochen).

   1. Die Knöpfe: „Mit Google anmelden" unter „Anmelden", „Weiter mit
      Google" unter „Konto anlegen". Apple ist AUS (konfig.js) und steht
      deshalb gar nicht da.
   2. Erste Anmeldung mit Google → Konto ohne Betrieb, kleine Seite. Mit
      Firmencode aus dem Formular → gleich die Anfrage.
   3. Adresse hat schon ein Passwort-Konto → Hinweis, Wechsel auf
      „Anmelden", Adresse eingetragen; nach der Passwort-Anmeldung wird
      Google verknüpft.
   4. Nicht eingeschaltet → ehrlicher Hinweis. Popup gesperrt →
      Weiterleitung. Abgebrochen → kein Fehlertext.
   5. „Anmeldung und Sicherheit" im Einstellungsfenster und auf „Mein
      Konto": was verknüpft ist, Verknüpfen, Trennen nur bei mehr als einem.
   6. Treffer ≥ 44 × 44 bei 320–1920 px, normal und kompakt.
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

/* Die Attrappe für Google: hängt sich an stub-ohne-login.js. window.__popup
   bestimmt, was signInWithPopup tut. */
const ANBIETER_STUB = () => {
  window.__aufrufe = [];
  window.__popup = 'erfolg';
  const alt = window.firebase.auth;
  let beobachter = null, obj = null;
  const nutzer = (ids) => ({
    uid: 'g-neu', email: 'lea@gmail.com', displayName: 'Lea Google', emailVerified: true,
    providerData: ids.map(id => ({ providerId: id })),
    linkWithCredential: () => { window.__aufrufe.push('link'); return Promise.resolve(); },
    linkWithPopup: () => { window.__aufrufe.push('linkPopup'); return Promise.resolve(); },
    unlink: (id) => { window.__aufrufe.push('unlink:' + id); return Promise.resolve(); },
    getIdToken: () => Promise.resolve('t'),
  });
  window.firebase.auth = function () {
    if (obj) return obj;
    obj = alt();
    obj.onAuthStateChanged = function (cb) { beobachter = cb; setTimeout(() => cb(null), 40); return () => {}; };
    obj.signInWithPopup = function () {
      window.__aufrufe.push('popup');
      const w = window.__popup;
      if (w === 'erfolg') { obj.currentUser = nutzer(['google.com']); setTimeout(() => beobachter(obj.currentUser), 10); return Promise.resolve({ user: obj.currentUser }); }
      if (w === 'vorhanden') return Promise.reject({ code: 'auth/account-exists-with-different-credential', email: 'mara@studio.de', credential: { providerId: 'google.com' } });
      if (w === 'aus') return Promise.reject({ code: 'auth/operation-not-allowed' });
      if (w === 'gesperrt') return Promise.reject({ code: 'auth/popup-blocked' });
      if (w === 'abbruch') return Promise.reject({ code: 'auth/popup-closed-by-user' });
      return Promise.reject({ code: 'x' });
    };
    obj.signInWithRedirect = function () { window.__aufrufe.push('redirect'); return Promise.resolve(); };
    obj.getRedirectResult = function () { return Promise.resolve({ user: null }); };
    obj.signInWithEmailAndPassword = function () {
      window.__aufrufe.push('passwort');
      obj.currentUser = nutzer(['password']);
      return Promise.resolve({ user: obj.currentUser });
    };
    return obj;
  };
  Object.assign(window.firebase.auth, alt);
  window.firebase.auth.GoogleAuthProvider = function () { this.providerId = 'google.com'; this.setCustomParameters = () => {}; };
  window.firebase.auth.OAuthProvider = function (id) { this.providerId = id; this.addScope = () => {}; this.setCustomParameters = () => {}; };
  /* firmaBeitreten der Attrappe: DEMO-2026 gilt. */
  const f = window.firebase.app().functions();
  window.firebase.app = ((a) => function () { const x = a(); x.functions = () => ({ httpsCallable: (n) => (d) => {
    window.__aufrufe.push('fn:' + n + ':' + (d && d.code || ''));
    if (n === 'firmaBeitreten') return String(d.code).toUpperCase().replace(/[^A-Z0-9]/g, '') === 'DEMO2026'
      ? Promise.resolve({ data: { firma: 'koerperformen', name: 'Körperformen' } })
      : Promise.reject({ code: 'not-found', message: 'Diesen Firmencode gibt es nicht.' });
    return Promise.resolve({ data: {} });
  } }); return x; })(window.firebase.app);
};

async function seite(b, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  p.on('dialog', d => d.accept());
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**://apis.google.com/**', r => r.abort());
  await p.addInitScript({ path: __dirname + '/stub-ohne-login.js' });
  await p.addInitScript(ANBIETER_STUB);
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2200);
  return p;
}
const reiter = (p, m) => p.evaluate((m) => document.querySelector('[data-authmode="' + m + '"]').click(), m);

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. Die Knöpfe ──');
  {
    const p = await seite(b, 390, 844);
    const k = await p.evaluate(() => {
      const sicht = (id) => { const e = document.getElementById(id); return !!e && !e.hidden && e.getClientRects().length > 0; };
      return { lgG: sicht('lgGoogle'), lgA: sicht('lgApple'), rgGtext: document.getElementById('rgGoogle').textContent.trim(),
               lgGtext: document.getElementById('lgGoogle').textContent.trim(), logo: !!document.querySelector('#lgGoogle svg') };
    });
    pruefe('„Mit Google anmelden" steht unter „Anmelden", mit Logo', k.lgG && k.lgGtext === 'Mit Google anmelden' && k.logo, JSON.stringify(k));
    pruefe('Apple ist aus (konfig.js) und steht deshalb gar nicht da', !k.lgA);
    pruefe('unter „Konto anlegen": „Weiter mit Google"', k.rgGtext === 'Weiter mit Google');
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 2. Erste Anmeldung mit Google ──');
  for (const mitCode of [false, true]) {
    const p = await seite(b, 1440, 900);
    if (mitCode) { await reiter(p, 'register'); await p.fill('#rgCode', 'demo-2026'); }
    await p.click(mitCode ? '#rgGoogle' : '#lgGoogle');
    await p.waitForTimeout(900);
    const z = await p.evaluate(() => ({
      seite: getComputedStyle(document.getElementById('warteWrap')).display !== 'none',
      titel: document.getElementById('mkTitel').textContent,
      wartet: !document.getElementById('mkWartet').hidden,
      firma: document.getElementById('mkFirma').textContent,
      aufrufe: window.__aufrufe.join(','),
    }));
    if (!mitCode) {
      pruefe('Konto ohne Betrieb angelegt, kleine Seite mit dem Namen aus Google', z.seite && /Lea/.test(z.titel) && !z.wartet, JSON.stringify(z));
    } else {
      pruefe('mit Firmencode aus dem Formular: gleich die Anfrage („Anfrage bei Körperformen")',
        z.seite && z.wartet && /Körperformen/.test(z.firma) && /fn:firmaBeitreten:demo-2026/.test(z.aufrufe), JSON.stringify(z));
    }
    if (!mitCode) {
      const s = await p.evaluate(() => [...document.querySelectorAll('#mkSicherheit .sich-zeile')].map(z => z.innerText.replace(/\s+/g, ' ').trim()));
      pruefe('„Mein Konto": Google verknüpft, Passwort nicht eingerichtet, Zwei-Faktor angekündigt',
        s.some(x => /Google verknüpft/.test(x)) && s.some(x => /Passwort nicht eingerichtet/.test(x)) && s.some(x => /Zwei-Faktor/.test(x)), JSON.stringify(s));
      const trennen = await p.evaluate(() => !!document.querySelector('#mkSicherheit [data-sich="trennen"]'));
      pruefe('Nur EIN Weg da → „Trennen" wird nicht angeboten (sonst sperrt man sich aus)', !trennen);
    }
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 3. Adresse hat schon ein Passwort-Konto ──');
  {
    const p = await seite(b, 390, 844);
    await reiter(p, 'register');
    await p.evaluate(() => { window.__popup = 'vorhanden'; });
    await p.click('#rgGoogle');
    await p.waitForTimeout(500);
    const z = await p.evaluate(() => ({
      modus: getComputedStyle(document.getElementById('loginForm')).display !== 'none',
      mail: document.getElementById('lgEmail').value,
      text: document.getElementById('lgAnbieterErr').textContent,
    }));
    pruefe('Hinweis, Wechsel auf „Anmelden", Adresse schon eingetragen',
      z.modus && z.mail === 'mara@studio.de' && /schon ein Konto mit Passwort/.test(z.text), JSON.stringify(z));
    await p.fill('#lgPw', 'geheim123');
    await p.click('#loginBtn');
    await p.waitForTimeout(500);
    const auf = await p.evaluate(() => window.__aufrufe.join(','));
    pruefe('nach der Passwort-Anmeldung wird Google verknüpft', /passwort,link/.test(auf), auf);
    await p.close();
  }

  console.log('\n── 4. Die anderen Antworten ──');
  for (const [fall, erwartet] of [['aus', /noch nicht eingeschaltet/], ['abbruch', /^$/]]) {
    const p = await seite(b, 390, 844);
    await p.evaluate((f) => { window.__popup = f; }, fall);
    await p.click('#lgGoogle');
    await p.waitForTimeout(400);
    const t = await p.evaluate(() => document.getElementById('lgAnbieterErr').textContent);
    pruefe(fall === 'aus' ? 'nicht eingeschaltet: ehrlicher Hinweis' : 'selbst abgebrochen: kein Fehlertext', erwartet.test(t), t);
    await p.close();
  }
  {
    const p = await seite(b, 390, 844);
    await p.evaluate(() => { window.__popup = 'gesperrt'; });
    await p.click('#lgGoogle');
    await p.waitForTimeout(400);
    const auf = await p.evaluate(() => window.__aufrufe.join(','));
    pruefe('Popup gesperrt (installierte App): Weiterleitung statt Fehler', /popup,redirect/.test(auf), auf);
    await p.close();
  }

  console.log('\n── 5. Anmeldung und Sicherheit in der App ──');
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    p._fehler = []; p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
    await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    await p.evaluate(() => document.getElementById('uAvatar').click());
    await p.waitForTimeout(400);
    const s = await p.evaluate(() => ({
      zeilen: [...document.querySelectorAll('#pmSicherheit .sich-zeile')].map(z => z.innerText.replace(/\s+/g, ' ').trim()),
      sichtbar: document.getElementById('pmSicherheit').getClientRects().length > 0,
    }));
    pruefe('Einstellungen → Profil: „Anmeldung und Sicherheit" mit Passwort, Google und Zwei-Faktor',
      s.sichtbar && s.zeilen.length === 3 && /Passwort/.test(s.zeilen[0]) && /Google/.test(s.zeilen[1]), JSON.stringify(s));
    await p.evaluate(() => document.querySelector('#pmSicherheit [data-sich="verknuepfen"]').click());
    await p.waitForTimeout(400);
    const t = await p.evaluate(() => (document.querySelector('.toast') || {}).textContent || '');
    pruefe('in der Demo: Verknüpfen sagt ehrlich, dass es hier nicht geht', /Demo/.test(t), t);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 6. Treffen ──');
  for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await seite(b, w, h);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      for (const m of ['login', 'register']) {
        await reiter(p, m);
        await p.waitForTimeout(150);
        const k = await p.evaluate(async (SRC) => {
          const T = eval('(' + SRC + ')');
          const els = [...document.querySelectorAll('.btn-anbieter')].filter(e => e.getClientRects().length);
          const zu = [];
          for (const el of els) {
            el.scrollIntoView({ block: 'center' });
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            const m = T(el);
            if (m.w < 44 || m.h < 44) zu.push(el.id + ' ' + m.w + '×' + m.h);
          }
          return { zahl: els.length, zu, quer: document.documentElement.scrollWidth - innerWidth };
        }, TREFFER.toString());
        pruefe(w + ' px, ' + dichte + ', ' + m + ': Google-Knopf ≥ 44 × 44, nichts ragt hinaus', k.zahl === 1 && !k.zu.length && k.quer <= 0, JSON.stringify(k));
      }
    }
    await p.close();
  }

  await b.close();
  console.log('\n' + gut + ' gut, ' + schlecht + ' schlecht');
  if (schlecht) console.log('✗ Anmelden mit Google/Apple: ' + schlecht + ' Prüfungen fehlgeschlagen');
  process.exit(schlecht ? 1 : 0);
})();
