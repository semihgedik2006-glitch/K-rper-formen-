/* ══════════════════════════════════════════════════════════════════════
   BEITRETEN PER QR-CODE (Runde 134, DESIGN-RECHERCHE F1)

   „Das mit dem Firmencode muss nicht so penetrant sein." Der Code bleibt
   leise; wer ihn braucht, scannt ihn am Empfang.

   1. Verwaltung → Team → „Wer darf sich anmelden": ohne gesetzten Code
      sagt der Knopf, was zu tun ist, statt einen leeren QR zu zeigen.
   2. Mit Code: ein QR-Bild, der Code im Klartext darunter, und der Satz,
      dass nur hineinkommt, wen die Geschäftsführung freigibt.
   3. Der QR trägt die Adresse mit `?beitritt=<code>` — OHNE `demo`.
   4. Wer die Adresse öffnet (abgemeldet), landet auf „Konto anlegen" mit
      eingetragenem Code, und die Angabe verschwindet aus der Adresse.
      Gegenprobe: ohne Angabe bleibt „Anmelden" offen und das Feld leer.
   5. Fingerziele ≥ 44 × 44 per Hit-Test bei 320/390/430/820/1280/1440/1920,
      normal und kompakt; kein waagerechtes Scrollen.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 200) : '')); }
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

async function zumBeitritt(p) {
  return p.evaluate(async () => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    const g = document.querySelector('.mobnav [data-group="g-chef"], #side [data-group="g-chef"]');
    if (g) { g.click(); await w(700); }
    const k = document.querySelector('#chefHome [data-cgo="team"]');
    if (!k) return false;
    k.click(); await w(900);
    const c = document.getElementById('btQr');
    if (!c) return false;
    /* Die Karte ist eingeklappt — ein Mensch tippt zuerst die Überschrift. */
    const karte = c.closest('.card.fold');
    if (karte && karte.classList.contains('zu')) {
      karte.querySelector('.fold-head').click(); await w(500);
    }
    c.scrollIntoView({ block: 'center' }); await w(300);
    return true;
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── In der Verwaltung ──');
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  p.on('dialog', d => d.accept());
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  pruefe('Verwaltung → Team → „Wer darf sich anmelden" hat den Knopf', await zumBeitritt(p));

  const leer = await p.evaluate(async () => {
    document.getElementById('btCode').value = '';
    document.getElementById('btQr').click();
    await new Promise(r => setTimeout(r, 300));
    return { box: !document.getElementById('btQrBox').hidden,
             note: document.getElementById('btNote').textContent };
  });
  pruefe('ohne Code: kein leeres Bild, sondern ein Satz, was zu tun ist',
    !leer.box && /Firmencode setzen/.test(leer.note), JSON.stringify(leer));

  await p.evaluate(() => document.getElementById('btZufall').click());
  await p.waitForTimeout(900);
  const code = await p.evaluate(() => document.getElementById('btCode').value);
  pruefe('„Code erzeugen" setzt einen Code', /^[A-Z0-9-]{6,}$/.test(code), code);

  const qr = await p.evaluate(async () => {
    document.getElementById('btQr').click();
    await new Promise(r => setTimeout(r, 1200));
    const bild = document.getElementById('btQrBild');
    return {
      svg: !!(bild && bild.querySelector('svg')),
      zellen: bild ? bild.querySelectorAll('svg path, svg rect').length : 0,
      text: bild ? bild.textContent : '',
      hinweis: (document.getElementById('btQrBox') || {}).textContent || '',
      knopf: document.getElementById('btQr').textContent
    };
  });
  pruefe('mit Code: ein QR-Bild', qr.svg && qr.zellen >= 1, JSON.stringify(qr).slice(0, 120));
  pruefe('… mit dem Code im Klartext darunter', qr.text.indexOf(code) >= 0, qr.text.slice(0, 80));
  pruefe('… und dem Satz zur Freigabe', /nur, wen du freigibst/.test(qr.hinweis));
  pruefe('der Knopf heisst jetzt „ausblenden"', /ausblenden/.test(qr.knopf), qr.knopf);

  /* Was im QR steht: die Bibliothek ist jetzt geladen. Ein Mantel um
     window.qrcode schneidet mit, was die App ihr übergibt — gelesen wird
     also die echte Adresse, nicht eine nachgerechnete. */
  const adresse = await p.evaluate(async () => {
    const echt = window.qrcode;
    window.qrcode = function (t, e) {
      const q = echt(t, e); const add = q.addData;
      q.addData = function (d) { window.__qrDaten = d; return add.apply(this, arguments); };
      return q;
    };
    const k = document.getElementById('btQr');
    k.click(); await new Promise(r => setTimeout(r, 200));   // aus
    k.click(); await new Promise(r => setTimeout(r, 600));   // wieder an
    return window.__qrDaten || '';
  });
  pruefe('im QR steht die Adresse mit ?beitritt=<Code> und ohne demo',
    adresse.indexOf('beitritt=' + encodeURIComponent(code)) >= 0 && !/demo/.test(adresse) &&
    adresse.startsWith('http://127.0.0.1:8765/'), adresse);

  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    await p.setViewportSize({ width: w, height: h });
    await p.waitForTimeout(300);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const m = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const el = document.getElementById('btQr');
        el.scrollIntoView({ block: 'center' });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const bild = document.querySelector('#btQrBild svg');
        const br = bild ? bild.getBoundingClientRect() : { width: 0, right: 0 };
        return { t: T(el), bild: Math.round(br.width), rechts: Math.round(br.right),
                 quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      pruefe(w + ' px ' + dichte + ': Knopf ' + m.t.w + '×' + m.t.h + ', Bild ' + m.bild + ' px, nichts ragt hinaus',
        m.t.w >= 44 && m.t.h >= 44 && m.bild >= 150 && m.rechts <= w && m.quer <= 0, JSON.stringify(m));
    }
  }
  pruefe('ohne Skriptfehler', !fehler.length, fehler.join(' | '));
  await p.close();

  console.log('\n── Wer scannt ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const q = await b.newPage({ viewport: { width: w, height: h } });
    await q.route('**://www.gstatic.com/**', r => r.abort());
    await q.addInitScript({ path: SP + '/stub-ohne-login.js' });
    await q.goto(APP + '?beitritt=KF7Q-M4XP', { waitUntil: 'domcontentloaded' });
    await q.waitForTimeout(1800);
    const s = await q.evaluate(() => ({
      reg: getComputedStyle(document.getElementById('registerForm')).display,
      code: document.getElementById('rgCode').value,
      adresse: location.href
    }));
    pruefe(w + ' px: „Konto anlegen" steht offen', s.reg === 'block', s.reg);
    pruefe(w + ' px: der Code ist eingetragen', s.code === 'KF7Q-M4XP', s.code);
    pruefe(w + ' px: die Angabe ist aus der Adresse verschwunden', !/beitritt/.test(s.adresse), s.adresse);
    await q.close();
  }
  const g = await b.newPage({ viewport: { width: 390, height: 844 } });
  await g.route('**://www.gstatic.com/**', r => r.abort());
  await g.addInitScript({ path: SP + '/stub-ohne-login.js' });
  await g.goto(APP, { waitUntil: 'domcontentloaded' });
  await g.waitForTimeout(1800);
  const ohne = await g.evaluate(() => ({
    login: getComputedStyle(document.getElementById('loginForm')).display,
    code: document.getElementById('rgCode').value
  }));
  pruefe('GEGENPROBE ohne Angabe: „Anmelden" offen, Feld leer', ohne.login === 'block' && ohne.code === '', JSON.stringify(ohne));
  /* Und Unsinn in der Adresse füllt nichts ein. */
  await g.goto(APP + '?beitritt=%3Cscript%3E', { waitUntil: 'domcontentloaded' });
  await g.waitForTimeout(1800);
  const unsinn = await g.evaluate(() => document.getElementById('rgCode').value);
  pruefe('GEGENPROBE Unsinn in der Adresse wird nicht eingetragen', unsinn === '', unsinn);
  await g.close();

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Beitreten per QR-Code: scannen, Code steht drin, Freigabe bleibt — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
