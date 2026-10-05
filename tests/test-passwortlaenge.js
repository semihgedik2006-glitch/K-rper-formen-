/* ══════════════════════════════════════════════════════════════════════
   PASSWÖRTER: MINDESTENS 8 ZEICHEN (Runde 142, P-05)

   Aus BEKANNTE-PROBLEME P-05: „Sechs Zeichen sind nach heutigem Stand
   wenig." Empfehlung am 5.10.2026: acht, mit Übergang — gesperrt wird
   niemand (Hausregel: eine Änderung, die echte Konten treffen könnte,
   bekommt einen Übergang).

   Was hier NICHT geprüft werden kann und deshalb nicht behauptet wird:
   der echte Anmeldedienst. Er nimmt bis zur Einstellung in der Konsole
   weiter sechs Zeichen an; das Firebase-SDK lädt in dieser Umgebung nicht.

   1. Konto anlegen: 7 Zeichen → Hinweis, KEIN Aufruf an den Dienst;
      8 Zeichen → Aufruf.
   2. Team anlegen (Geschäftsführung): 7 Zeichen → Hinweis.
   3. „Vorschlag": 12 Zeichen, alle Zeichenarten, 300-mal verschieden,
      Zufall aus crypto (kein Math.random im Quelltext der Funktion).
   4. Anmelden: mit kurzem Passwort → gemerkt (nur die Adresse); mit
      langem → vergessen; zweiter Faktor gefragt → auch gemerkt.
   5. Leiste: erscheint nur für die gemerkte Adresse; „Link schicken"
      schickt den Link an diese Adresse und räumt auf; „×" blendet für
      heute aus. GEGENPROBE: fremde Adresse → keine Leiste.
   6. Fingerziele der Leiste ≥ 44 × 44 per Hit-Test bei 320–1920 px,
      normal und kompakt; kein waagerechtes Scrollen.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

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

/* Anmeldebildschirm mit einer Attrappe, die mitschreibt. window.__antwort
   bestimmt, was signInWithEmailAndPassword tut. */
const ANMELDE_STUB = () => {
  window.__aufrufe = [];
  window.__antwort = 'ok';
  const alt = window.firebase.auth;
  let obj = null;
  window.firebase.auth = function () {
    if (obj) return obj;
    obj = alt();
    obj.signInWithEmailAndPassword = function (mail, pw) {
      window.__aufrufe.push('login:' + pw.length);
      if (window.__antwort === 'mfa') {
        return Promise.reject({ code: 'auth/multi-factor-auth-required',
          resolver: { hints: [{ uid: 'h1', factorId: 'totp', displayName: 'Handy' }], session: {}, resolveSignIn: () => Promise.reject({ code: 'x' }) } });
      }
      obj.currentUser = { uid: 'u1', email: mail, providerData: [{ providerId: 'password' }] };
      return Promise.resolve({ user: obj.currentUser });
    };
    obj.createUserWithEmailAndPassword = function (mail, pw) {
      window.__aufrufe.push('anlegen:' + pw.length);
      return Promise.reject({ code: 'auth/network-request-failed' });
    };
    return obj;
  };
  Object.assign(window.firebase.auth, alt);
};

async function anmeldeSeite(b) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**://apis.google.com/**', r => r.abort());
  await p.addInitScript({ path: __dirname + '/stub-ohne-login.js' });
  await p.addInitScript(ANMELDE_STUB);
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2200);
  return p;
}
async function demo(b, w, h, merkung) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((m) => {
    localStorage.setItem('kf_tour', '99:demo-ich');
    if (m) localStorage.setItem('kf_pw_kurz', m);
    /* Die Demo baut bei jedem firebase.auth() ein neues Objekt; die App
       hält eines davon fest. Mitschreiben deshalb schon beim Einsetzen. */
    window.__links = [];
    let fb;
    Object.defineProperty(window, 'firebase', { configurable: true, get: () => fb, set: (v) => {
      fb = v;
      if (v && typeof v.auth === 'function' && !v.auth.__mit) {
        const alt = v.auth;
        v.auth = function () { const a = alt.apply(this, arguments);
          a.sendPasswordResetEmail = (mail) => { window.__links.push(mail); return Promise.resolve(); }; return a; };
        Object.assign(v.auth, alt); v.auth.__mit = true;
      }
    } });
  }, merkung || '');
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
const sichtbar = (p) => p.evaluate(() => {
  const l = document.getElementById('pwLeiste');
  return !!l && !l.hidden && l.getClientRects().length > 0 && getComputedStyle(l).display !== 'none';
});

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. Konto anlegen ──');
  {
    const p = await anmeldeSeite(b);
    await p.evaluate(() => document.querySelector('[data-authmode="register"]').click());
    await p.fill('#rgName', 'Mara Test');
    await p.fill('#rgEmail', 'mara@studio.de');
    await p.fill('#rgPw', 'abc1234'); await p.fill('#rgPw2', 'abc1234');
    await p.click('#registerBtn');
    await p.waitForTimeout(300);
    const z1 = await p.evaluate(() => ({ t: document.getElementById('regErr').textContent, a: window.__aufrufe.join(',') }));
    pruefe('7 Zeichen → Hinweis „mind. 8 Zeichen", kein Aufruf an den Anmeldedienst', /mind\. 8 Zeichen/.test(z1.t) && !/anlegen/.test(z1.a), JSON.stringify(z1));
    await p.fill('#rgPw', 'abc12345'); await p.fill('#rgPw2', 'abc12345');
    await p.click('#registerBtn');
    await p.waitForTimeout(500);
    const z2 = await p.evaluate(() => ({ t: document.getElementById('regErr').textContent, a: window.__aufrufe.join(',') }));
    pruefe('8 Zeichen → geht an den Anmeldedienst', /anlegen:8/.test(z2.a) && !/mind\. 8/.test(z2.t), JSON.stringify(z2));
    const ph = await p.evaluate(() => document.getElementById('rgPw').placeholder);
    pruefe('das Feld sagt „8+ Zeichen"', ph === '8+ Zeichen', ph);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 4. Anmelden ──');
  {
    const p = await anmeldeSeite(b);
    await p.fill('#lgEmail', 'Mara@Studio.de');
    await p.fill('#lgPw', 'kurz12');
    await p.click('#loginBtn');
    await p.waitForTimeout(400);
    const m1 = await p.evaluate(() => localStorage.getItem('kf_pw_kurz'));
    pruefe('kurzes Passwort → gemerkt wird nur die Adresse (klein geschrieben)', m1 === 'mara@studio.de', m1);
    const alles = await p.evaluate(() => JSON.stringify(Object.assign({}, localStorage)) + JSON.stringify(Object.assign({}, sessionStorage)));
    pruefe('… das Passwort steht nirgends im Speicher des Geräts', !/kurz12/.test(alles));
    await p.close();
  }
  {
    const p = await anmeldeSeite(b);
    await p.evaluate(() => localStorage.setItem('kf_pw_kurz', 'mara@studio.de'));
    await p.fill('#lgEmail', 'mara@studio.de');
    await p.fill('#lgPw', 'lang-genug-1');
    await p.click('#loginBtn');
    await p.waitForTimeout(400);
    const m2 = await p.evaluate(() => localStorage.getItem('kf_pw_kurz'));
    pruefe('langes Passwort → die Merkung ist weg', m2 === null, m2);
    await p.close();
  }
  {
    const p = await anmeldeSeite(b);
    await p.evaluate(() => { window.__antwort = 'mfa'; });
    await p.fill('#lgEmail', 'chef@studio.de');
    await p.fill('#lgPw', 'kurz12');
    await p.click('#loginBtn');
    await p.waitForTimeout(400);
    const m3 = await p.evaluate(() => localStorage.getItem('kf_pw_kurz'));
    pruefe('zweiter Faktor gefragt (Passwort stimmte) → auch gemerkt', m3 === 'chef@studio.de', m3);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 3. „Vorschlag" ──');
  {
    const p = await demo(b, 390, 844);
    const v = await p.evaluate(() => {
      /* Über den Knopf, wie ein Mensch — die Funktionen der App sind
         nicht global erreichbar. Der Knopf liegt im Team-Fenster und
         wird hier direkt ausgelöst. */
      const k = document.getElementById('emPwGen'), f = document.getElementById('emPw');
      const alle = []; for (let i = 0; i < 300; i++) { k.click(); alle.push(f.value); }
      const art = (pw) => /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[2-9]/.test(pw) && /[!?#$%]/.test(pw);
      return { laenge: alle.every(x => x.length === 12), arten: alle.every(art), verschieden: new Set(alle).size };
    });
    pruefe('12 Zeichen', v.laenge);
    pruefe('jedes Mal Gross, klein, Ziffer und Sonderzeichen', v.arten);
    pruefe('300 Vorschläge, 300 verschiedene', v.verschieden === 300, v.verschieden);
    const html = require('fs').readFileSync(__dirname + '/../index.html', 'utf8');
    const anf = html.indexOf('function suggestPassword(){');
    const quelle = html.slice(anf, html.indexOf('\n}\n', anf));
    pruefe('Zufall aus crypto.getRandomValues, nicht aus Math.random', anf > 0 && /crypto\.getRandomValues/.test(quelle) && !/Math\.random/.test(quelle));
    pruefe('PW_MIN ist 8', /var PW_MIN = 8;/.test(html));

    console.log('\n── 2. Team anlegen ──');
    const t = await p.evaluate(() => {
      document.getElementById('emName').value = 'Neu Person';
      document.getElementById('emEmail').value = 'neu@studio.de';
      document.getElementById('emPw').value = 'abc1234';
      document.getElementById('emCreate').click();
      return { t: document.getElementById('emCreateNote').textContent, ph: document.getElementById('emPw').placeholder };
    });
    pruefe('7 Zeichen → „Passwort muss mind. 8 Zeichen haben."', /mind\. 8 Zeichen/.test(t.t), t.t);
    pruefe('das Feld sagt „8+ Zeichen"', t.ph === '8+ Zeichen', t.ph);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 5. Die Leiste ──');
  {
    const p = await demo(b, 390, 844);
    pruefe('GEGENPROBE: ohne Merkung keine Leiste', !(await sichtbar(p)));
    await p.close();
  }
  {
    const p = await demo(b, 390, 844, 'jemand@anders.de');
    pruefe('GEGENPROBE: Merkung für eine andere Adresse → keine Leiste', !(await sichtbar(p)));
    await p.close();
  }
  {
    const p = await demo(b, 390, 844, 'demo@studiochat.example');
    pruefe('Merkung für die eigene Adresse → Leiste steht oben', await sichtbar(p));
    const text = await p.evaluate(() => document.getElementById('pwLeiste').innerText.replace(/\s+/g, ' '));
    pruefe('… sie sagt, worum es geht, und bietet „Link schicken"', /weniger als 8 Zeichen/.test(text) && /Link schicken/.test(text), text);
    await p.click('#pwLeisteAuf');
    await p.waitForTimeout(400);
    const n = await p.evaluate(() => ({ links: window.__links, merk: localStorage.getItem('kf_pw_kurz'),
      toast: (document.getElementById('toast') || {}).textContent || '' }));
    pruefe('„Link schicken" → Link an die eigene Adresse', n.links.length === 1 && n.links[0] === 'demo@studiochat.example', JSON.stringify(n.links));
    pruefe('… Merkung weg, Leiste weg, Meldung nennt 8 Zeichen', n.merk === null && !(await sichtbar(p)) && /8 Zeichen/.test(n.toast), JSON.stringify(n));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  {
    const p = await demo(b, 390, 844, 'demo@studiochat.example');
    await p.click('#pwLeisteZu');
    await p.waitForTimeout(150);
    const z = await p.evaluate(() => ({ weg: sessionStorage.getItem('kf_pw_leiste'), merk: localStorage.getItem('kf_pw_kurz') }));
    pruefe('„×" → für heute ausgeblendet, die Merkung bleibt', !(await sichtbar(p)) && z.weg === 'weg' && z.merk === 'demo@studiochat.example', JSON.stringify(z));
    await p.close();
  }

  console.log('\n── 6. Fingerziele ──');
  {
    const p = await demo(b, 390, 844, 'demo@studiochat.example');
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
          for (const id of ['pwLeisteAuf', 'pwLeisteZu']) aus[id] = T(document.getElementById(id));
          return { aus, quer: document.documentElement.scrollWidth - innerWidth };
        }, TREFFER.toString());
        quer = Math.max(quer, m.quer);
        for (const [id, r] of Object.entries(m.aus)) if (r.w < 44 || r.h < 44) zuKlein.push(w + '/' + dichte + ' ' + id + ' ' + r.w + '×' + r.h);
      }
    }
    pruefe('„Link schicken" und „×": Treffer ≥ 44 × 44 bei 320–1920 px, normal und kompakt', !zuKlein.length, zuKlein.join(', '));
    pruefe('kein waagerechtes Scrollen', quer <= 0, quer + ' px');
    await p.close();
  }

  await b.close();
  console.log('\n' + (schlecht ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Passwörter: 8 Zeichen für neue, Übergang für alte, Vorschlag aus crypto — ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
