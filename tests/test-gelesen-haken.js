/* ══════════════════════════════════════════════════════════════════════
   GELESEN-HÄKCHEN (Runde 126)

   Aus dem Betrieb, 27.9.2026: „Jeder, genau wie bei WhatsApp, einfach."
     ✓        gesendet
     ✓✓ grau  zugestellt (die App jeder Empfängerin war danach offen)
     ✓✓ blau  gelesen — in Gruppen erst, wenn ALLE gelesen haben

   Die Regel (nur den eigenen Lesestand, nur {ts, uid}, nicht in die
   Zukunft, beide Bäume) prüft tests/rules/gelesen.test.js. Hier die
   Oberfläche mit der Demo (Mitarbeiter, Kanal „Allgemein"):
   1. Häkchen nur an eigenen Nachrichten, an jeder eigenen eins.
   2. Der Stand folgt den Lesezeichen: alle lesen → blau; eine Person
      zurück → nicht mehr blau; alle „da", aber eine ungelesen → grau.
      Die Häkchen wechseln OHNE dass der Verlauf neu gezeichnet wird.
   3. „Gelesen von …" im Nachrichtenblatt nennt, wer gelesen hat und wer
      nicht; die Zahlen stimmen mit dem Häkchen überein.
   4. Den eigenen Lesestand schreibt nur ein sichtbarer Chat — und nur,
      wenn Neues von anderen da ist.
   5. Blau ist auf der eigenen Blase lesbar (≥ 4,5 : 1, echte
      Bildpunkte), hell und dunkel, und von grau zu unterscheiden.
   6. Der Eintrag „Gelesen von …" trifft ≥ 44 × 44 bei 320 / 390 / 1440,
      normal und kompakt.
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

async function oeffne(b, w, h, hell) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((hell) => {
    localStorage.setItem('kf_tour', '99:demo-ich');
    /* Ausdrücklich setzen: ohne Angabe folgt die App dem System, und das
       ist im Testbrowser hell — „dunkel" wäre sonst nie dunkel gewesen
       (so geschehen im ersten Lauf: beide Werte gleich). */
    if (hell === true) localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'light' }));
    if (hell === false) localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'dark' }));
  }, hell === undefined ? null : hell);
  await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  await p.evaluate(() => {
    const k = [...document.querySelectorAll('[data-group="g-komm"]')].find(x => x.getClientRects().length);
    if (k) k.click();
    else { [...document.querySelectorAll('[data-group="g-alles"]')].find(x => x.getClientRects().length).click(); }
  });
  await p.waitForTimeout(400);
  await p.evaluate(() => { if (!document.querySelector('#view-chat.show')) { const z = document.querySelector('[data-alles="chat"]'); if (z) z.click(); } });
  await p.waitForTimeout(900);
  return p;
}
const haken = (p) => p.evaluate(() => [...document.querySelectorAll('#chatScroll .msg')].map(m => ({
  mid: m.dataset.mid, mine: m.classList.contains('mine'),
  stand: (m.querySelector('[data-haken]') || { dataset: {} }).dataset.stand || null,
})));
/* Lesestände direkt in die Demo-Datenbank schreiben — derselbe Weg wie
   eine andere Person, die liest. */
const setzeLesestaende = (p, fn) => p.evaluate((SRC) => {
  const f = eval('(' + SRC + ')');
  const fs = window.firebase.firestore();
  const alle = [...document.querySelectorAll('#chatScroll .msg')];
  return fs.collection('firmen/koerperformen/channels/allgemein/gelesen').get().then((snap) => {
    /* Der eigene Lesestand zählt nicht — die eigene Person ist keine
       Empfängerin. */
    const ids = snap.docs.map(d => d.id).filter(id => id !== 'demo-ich');
    return Promise.all(ids.map((id, i) => fs.collection('firmen/koerperformen/channels/allgemein/gelesen').doc(id).set({ ts: f(i, ids.length), uid: id })))
      .then(() => ids.length);
  });
}, fn.toString());

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1.–3. Häkchen in „Allgemein" ──');
  {
    const p = await oeffne(b, 1440, 900);
    const h0 = await haken(p);
    const eigene = h0.filter(x => x.mine), fremde = h0.filter(x => !x.mine);
    pruefe('an jeder eigenen Nachricht ein Häkchen (' + eigene.length + ')', eigene.length >= 3 && eigene.every(x => x.stand), JSON.stringify(eigene));
    pruefe('an fremden keins', fremde.length > 0 && fremde.every(x => !x.stand));

    /* Alle haben gelesen → blau, und zwar ohne neu zu zeichnen. */
    await p.evaluate(() => { document.querySelectorAll('#chatScroll .msg').forEach(m => { m.__alt = 1; }); });
    const n = await setzeLesestaende(p, () => Date.now() + 1000);
    await p.waitForTimeout(400);
    const h1 = await haken(p);
    const nichtNeu = await p.evaluate(() => [...document.querySelectorAll('#chatScroll .msg')].every(m => m.__alt === 1));
    pruefe('alle ' + n + ' haben gelesen → alle eigenen blau', h1.filter(x => x.mine).every(x => x.stand === 'gelesen'), JSON.stringify(h1.filter(x => x.mine)));
    pruefe('… und der Verlauf wurde dafür nicht neu gezeichnet', nichtNeu);

    /* Eine Person liest nicht mehr mit (Lesestand von gestern), war aber
       nach der jüngsten Nachricht NICHT in der App → nicht mehr blau. */
    const juengste = await p.evaluate(() => {
      const m = [...document.querySelectorAll('#chatScroll .msg.mine')].pop(); return m.dataset.mid;
    });
    await setzeLesestaende(p, (i) => i === 0 ? Date.now() - 86400000 * 30 : Date.now() + 1000);
    await p.waitForTimeout(400);
    const h2 = await haken(p);
    const st2 = h2.find(x => x.mid === juengste).stand;
    pruefe('eine Person liest nicht mit → die jüngste eigene ist nicht mehr blau', st2 !== 'gelesen', st2);

    /* „Gelesen von …" nennt genau diese eine Person als offen. */
    await p.evaluate((mid) => document.querySelector('[data-mid="' + mid + '"]').click(), juengste);
    await p.waitForTimeout(300);
    const eintrag = await p.evaluate(() => !!document.querySelector('#msSheetActs [data-ma="info"]'));
    pruefe('im Blatt der eigenen Nachricht steht „Gelesen von …"', eintrag);
    await p.evaluate(() => document.querySelector('#msSheetActs [data-ma="info"]').click());
    await p.waitForTimeout(300);
    const info = await p.evaluate(() => {
      const k = [...document.querySelectorAll('#msSheetInfo h4')].map(h => h.textContent);
      const listen = [...document.querySelectorAll('#msSheetInfo ul')].map(u => u.children.length);
      /* Gemessen, nicht am Attribut: .ms-acts setzte display und schlug
         hidden — Reaktionen und Einträge standen über der Liste. */
      const zu = (id) => !!document.getElementById(id).getClientRects().length;
      return { k, listen, sichtbar: zu('msSheetInfo'), acts: zu('msSheetActs') || zu('msSheetReact') };
    });
    pruefe('„Gelesen von …": ' + JSON.stringify(info.k), info.sichtbar && !info.acts && /Gelesen \(\d+\)/.test(info.k[0]) && /Noch nicht gelesen \(1\)/.test(info.k[1]), JSON.stringify(info));
    pruefe('die Zahl „gelesen" stimmt mit den Lesenden überein', +(info.k[0].match(/\((\d+)\)/) || [])[1] === n - 1, JSON.stringify(info.k) + ' n=' + n);
    await p.evaluate(() => document.getElementById('msSheetClose').click());
    await p.waitForTimeout(200);
    /* Beim nächsten Öffnen einer fremden Nachricht ist die Liste weg. */
    await p.evaluate(() => { const m = document.querySelector('#chatScroll .msg:not(.mine)'); m.click(); });
    await p.waitForTimeout(300);
    const fremd = await p.evaluate(() => ({ info: !!document.querySelector('#msSheetActs [data-ma="info"]'),
      liste: !!document.getElementById('msSheetInfo').getClientRects().length,
      acts: !!document.getElementById('msSheetActs').getClientRects().length && !!document.getElementById('msSheetReact').getClientRects().length }));
    pruefe('an fremden Nachrichten kein „Gelesen von …", die Einträge sind zurück', !fremd.info && !fremd.liste && fremd.acts, JSON.stringify(fremd));
    await p.evaluate(() => document.getElementById('msSheetClose').click());

    /* Grau: alle waren nach der Nachricht in der App (lastSeen), gelesen
       hat aber noch nicht jede. */
    await p.evaluate(() => {
      const fs = window.firebase.firestore();
      return fs.collection('users').get().then(s => Promise.all(s.docs.map(d => fs.collection('users').doc(d.id).update({ lastSeen: Date.now() + 2000 }))));
    });
    await p.waitForTimeout(500);
    const h3 = await haken(p);
    pruefe('alle waren danach da, eine hat nicht gelesen → grau „zugestellt"', h3.find(x => x.mid === juengste).stand === 'zugestellt', JSON.stringify(h3.filter(x => x.mine)));
    pruefe('keine Skriptfehler', p._fehler.length === 0, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 3b. Direktnachrichten ──');
  {
    /* Dort gibt es den Lesestand schon lange (readTs.<uid> an der
       Unterhaltung, für „ungelesen"). Neu ist nur, dass die schreibende
       Seite ihn als Häkchen sieht. */
    const p = await oeffne(b, 1440, 900);
    await p.evaluate(() => { const z = document.querySelector('[data-subview="dm"]'); if (z) z.click(); });
    await p.waitForTimeout(700);
    await p.fill('#dmSearch', 'a');
    await p.waitForTimeout(400);
    const peer = await p.evaluate(() => { const e = document.querySelector('#dmPeople .dm-person'); if (!e) return null; const u = e.dataset.uid; e.click(); return u; });
    await p.waitForTimeout(700);
    await p.fill('#dmText', 'Hast du morgen Zeit?');
    await p.click('#dmSend');
    await p.waitForTimeout(900);
    const d1 = await p.evaluate(() => [...document.querySelectorAll('#dmScroll .msg.mine [data-haken]')].map(x => x.dataset.stand));
    pruefe('eigene Direktnachricht: ein Häkchen', !!peer && d1.length === 1 && d1[0] !== 'gelesen', JSON.stringify({ peer, d1 }));
    await p.evaluate((peer) => {
      const id = 'dm_' + ['demo-ich', peer].sort().join('_');
      const u = {}; u['readTs.' + peer] = Date.now() + 5000;
      return window.firebase.firestore().collection('firmen/koerperformen/dms').doc(id).update(u);
    }, peer);
    await p.waitForTimeout(700);
    const d2 = await p.evaluate(() => [...document.querySelectorAll('#dmScroll .msg.mine [data-haken]')].map(x => x.dataset.stand));
    pruefe('die andere Person liest → blau, ohne Neuzeichnen des Verlaufs', d2.length === 1 && d2[0] === 'gelesen', JSON.stringify(d2));
    pruefe('keine Skriptfehler', p._fehler.length === 0, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 4. Den eigenen Lesestand schreibt nur ein sichtbarer Chat ──');
  {
    const p = await oeffne(b, 1440, 900);
    await p.waitForTimeout(3500);
    /* Nachgesehen wird in der Datenbank selbst: der eigene Lesestand. */
    const meiner = () => p.evaluate(() => window.firebase.firestore()
      .collection('firmen/koerperformen/channels/allgemein/gelesen').doc('demo-ich').get()
      .then(d => d.exists ? d.data() : null));
    const neueste = () => p.evaluate(() => window.firebase.firestore()
      .collection('firmen/koerperformen/channels/allgemein/messages').get()
      .then(s => Math.max(...s.docs.map(d => d.data()).filter(m => m.uid !== 'demo-ich').map(m => m.ts || 0))));
    const s0 = await meiner(), n0 = await neueste();
    pruefe('beim Öffnen: der eigene Lesestand steht, genau {ts, uid}, nicht älter als die neueste Nachricht',
      !!s0 && Object.keys(s0).sort().join() === 'ts,uid' && s0.uid === 'demo-ich' && s0.ts >= n0, JSON.stringify(s0) + ' neueste ' + n0);
    /* Neue Nachricht von jemand anderem, Fenster im Hintergrund → nicht gelesen. */
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); });
    await p.evaluate(() => window.firebase.firestore().collection('firmen/koerperformen/channels/allgemein/messages')
      .add({ uid: 'demo-u2', name: 'Jonas Brandt', text: 'Ist jemand da?', ts: Date.now() + 5000 }));
    await p.waitForTimeout(3800);
    const s2 = await meiner(), n2 = await neueste();
    pruefe('Fenster im Hintergrund: die neue Nachricht gilt NICHT als gelesen', s2.ts < n2, JSON.stringify(s2) + ' neueste ' + n2);
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForTimeout(3800);
    const s3 = await meiner();
    pruefe('wieder im Vordergrund: jetzt gelesen', s3.ts >= n2, JSON.stringify(s3) + ' neueste ' + n2);
    await p.close();
  }

  console.log('\n── 5. Blau ist auf der eigenen Blase lesbar ──');
  for (const hell of [false, true]) {
    const p = await oeffne(b, 1440, 900, hell);
    await setzeLesestaende(p, () => Date.now() + 1000);
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      const el = document.querySelector('#chatScroll [data-haken][data-stand="gelesen"]');
      el.scrollIntoView({ block: 'center' });
      const r = el.querySelector('svg').getBoundingClientRect();
      const blase = el.closest('.msg');
      return { x: r.left, y: r.top, w: r.width, h: r.height, farbe: getComputedStyle(el).color, grau: getComputedStyle(blase.querySelector('time') || el).color, br: blase.getBoundingClientRect().right };
    });
    await p.waitForTimeout(200);
    /* Echte Bildpunkte: dunkelster/hellster Punkt im Häkchen gegen den
       Hintergrund der Blase gleich daneben. */
    /* Genau der Kasten des Zeichens: die Ecke links oben liegt ausserhalb
       der Striche, also auf der Blase. Nichts anderes (Uhrzeit, Name) im
       Ausschnitt, das den Wert verfälschen könnte. */
    const bild = await p.screenshot({ clip: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.w), height: Math.round(r.h) } });
    const px = await p.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const lum = (r, gg, bb) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(gg) + .0722 * f(bb); };
      const grund = lum(d[0], d[1], d[2]);           // links oben: Blase
      let best = 1;
      for (let i = 0; i < d.length; i += 4) {
        const l = lum(d[i], d[i + 1], d[i + 2]);
        const k = (Math.max(l, grund) + .05) / (Math.min(l, grund) + .05);
        if (k > best) best = k;
      }
      return Math.round(best * 100) / 100 + ' (Blase ' + [d[0], d[1], d[2]].join(',') + ')';
    }, bild.toString('base64'));
    pruefe((hell ? 'hell' : 'dunkel') + ': Blau auf der eigenen Blase ' + px + ' : 1 (≥ 4,5)', parseFloat(px) >= 4.5, JSON.stringify(r));
    pruefe((hell ? 'hell' : 'dunkel') + ': Blau ist nicht die Farbe von grau', r.farbe !== r.grau, r.farbe + ' / ' + r.grau);
    await p.close();
  }

  console.log('\n── 6. Treffer ──');
  for (const [w, h] of [[320, 640], [390, 844], [1440, 900]]) {
    for (const dichte of ['normal', 'kompakt']) {
      const p = await oeffne(b, w, h);
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.evaluate(() => { const m = [...document.querySelectorAll('#chatScroll .msg.mine')].pop(); m.scrollIntoView({ block: 'center' }); m.click(); });
      await p.waitForTimeout(350);
      const k = await p.evaluate((SRC) => {
        const T = eval('(' + SRC + ')');
        const el = document.querySelector('#msSheetActs [data-ma="info"]');
        if (!el) return null;
        el.scrollIntoView({ block: 'center' });
        const m = T(el), r = el.getBoundingClientRect();
        return { m, links: r.left, rechts: r.right, quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      pruefe(w + ' px, ' + dichte + ': „Gelesen von …" ' + (k ? k.m.w + '×' + k.m.h : '–') + ' (≥ 44 × 44, im Bild)',
        !!k && k.m.w >= 44 && k.m.h >= 44 && k.links >= 0 && k.rechts <= w && k.quer <= 0, JSON.stringify(k));
      await p.close();
    }
  }

  await b.close();
  console.log('\n' + gut + ' bestanden, ' + schlecht + ' gefallen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
