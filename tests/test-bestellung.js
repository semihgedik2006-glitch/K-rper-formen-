/* ══════════════════════════════════════════════════════════════════════
   BESTELLUNG PER MAIL (Runde 137)

   Aus dem Betrieb, 4.10.2026: „Bestellung per Mail" — aus der
   Materialliste mit einem Knopf eine fertige Bestellmail an den
   Lieferanten, plus Vermerk, wann zuletzt bestellt wurde.

   In der Demo (dort geht keine Mail raus, und das steht auch da):
   1. Material → Einkaufsliste: „Zuletzt bestellt …" aus dem Protokoll,
      der Lieferant für den ganzen Betrieb, an der Zeile „bestellt 1.10."
      — und an einer Zeile, die NICHT bestellt wurde, nichts.
   2. „Bestellen" öffnet das Fenster mit genau der Liste; ein Artikel
      lässt sich herausnehmen, gesendet wird der Rest — mit
      Studio-Kennungen, damit die Leseregel der Leitung greift.
   3. Danach: „Demo — es ging keine Mail raus", und oben steht die neue
      Bestellung als „zuletzt bestellt heute".
   4. Ohne eingerichteten Mailversand: die Meldung des Servers, und das
      Mailprogramm bekommt dieselbe Auswahl samt Anmerkung.
   5. Lieferant hinterlegen: falsche Adresse → Hinweis; richtige →
      gespeichert in config/lieferant. Nur die Geschäftsführung.
   6. Die Studio-Leitung: sieht „zuletzt bestellt" für ihre Studios,
      ändert den Lieferanten nicht.
   7. Fingerziele ≥ 44 × 44 per Hit-Test bei 320/390/430/820/1280/1440/
      1920, normal und kompakt; kein waagerechtes Scrollen.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 240) : '')); }
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
const BEST = 'firmen/koerperformen/bestellungen';

async function oeffne(b, rolle, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h }, permissions: ['clipboard-read', 'clipboard-write'] });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  p.on('dialog', d => d.accept());
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
/* Material öffnen und die Einkaufsliste aufklappen. Vorher wird in
   studio-6 ein Artikel als fehlend eingetragen, der in der Bestellung
   der Demo steht („Handtücher"), und einer, der nicht darin steht. */
async function zurEinkaufsliste(p) {
  await p.evaluate(async () => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    await firebase.firestore().collection('firmen/koerperformen/inventory').doc('studio-6').set({
      items: [{ name: 'Handtücher', have: 2, limit: 20, need: 0 },
              { name: 'Probe-Artikel ohne Bestellung', have: 0, limit: 5, need: 0 }] });
    const sichtbar = (sel) => [...document.querySelectorAll(sel)].find(e => e.offsetParent);
    const g = sichtbar('[data-group="g-arbeit"]'); if (g) { g.click(); await w(600); }
    const m = sichtbar('[data-subview="material"]'); if (m) { m.click(); await w(1200); }
    const karte = document.getElementById('shopCard');
    if (karte && karte.classList.contains('zu')) { karte.querySelector('.fold-head').click(); await w(500); }
  });
  await p.waitForTimeout(500);
}
async function messen(p, wer, liste) {
  for (const [w, h] of GROESSEN) {
    await p.setViewportSize({ width: w, height: h });
    await p.waitForTimeout(250);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const m = await p.evaluate(async ([SRC, sel]) => {
        const T = eval('(' + SRC + ')');
        const aus = {};
        for (const s of sel) {
          const el = document.querySelector(s);
          if (!el || !el.offsetParent) { aus[s] = { w: -1, h: -1 }; continue; }
          el.scrollIntoView({ block: 'center' });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          aus[s] = T(el);
        }
        return { aus, quer: document.documentElement.scrollWidth - innerWidth };
      }, [TREFFER.toString(), liste]);
      const klein = Object.keys(m.aus).filter(k => !(m.aus[k].w >= 44 && m.aus[k].h >= 44));
      pruefe(wer + ' ' + w + ' px ' + dichte + ': ' + liste.length + ' Bedienelemente ≥ 44 × 44, nichts ragt hinaus',
        !klein.length && m.quer <= 0, JSON.stringify({ klein: klein.map(k => k + ' ' + m.aus[k].w + '×' + m.aus[k].h), quer: m.quer }));
    }
  }
  await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── Die Geschäftsführung ──');
  const p = await oeffne(b, 'chef', 1440, 900);
  await zurEinkaufsliste(p);
  const vorher = await p.evaluate(() => {
    const t = (id) => { const e = document.getElementById(id); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; };
    const zeilen = [...document.querySelectorAll('#shopList .shop-row')].map(r => ({
      name: (r.querySelector('.shop-h b') || {}).firstChild ? r.querySelector('.shop-h b').firstChild.textContent : '',
      chip: (r.querySelector('.bs-chip') || {}).textContent || '' }));
    return { stand: t('bsStand'), standDa: !document.getElementById('bsStand').hidden, lief: t('bsLiefText'),
             aendern: !document.getElementById('bsLiefAendern').hidden, zeilen,
             knopf: t('shopMail') };
  });
  pruefe('„Zuletzt bestellt" steht da, mit Person und Zahl der Artikel', vorher.standDa &&
    /Zuletzt bestellt/.test(vorher.stand) && /Demo-Geschäftsführung/.test(vorher.stand) && /2 Artikel/.test(vorher.stand), vorher.stand);
  pruefe('der Lieferant gilt für den Betrieb und steht unter der Liste', /Frottee-Lieferant \(Beispiel\)/.test(vorher.lief) &&
    /bestellung@lieferant\.example/.test(vorher.lief) && /K-1042/.test(vorher.lief), vorher.lief);
  pruefe('die Geschäftsführung kann ihn ändern', vorher.aendern);
  pruefe('der Knopf heisst „Bestellen"', vorher.knopf === 'Bestellen', vorher.knopf);
  const hand = vorher.zeilen.find(z => z.name === 'Handtücher');
  const ohne = vorher.zeilen.find(z => z.name === 'Probe-Artikel ohne Bestellung');
  pruefe('an „Handtücher" steht „bestellt …" (vor drei Tagen bestellt)', !!hand && /^bestellt \d{2}\.\d{2}\.$/.test(hand.chip), JSON.stringify(hand));
  pruefe('GEGENPROBE an einem nicht bestellten Artikel steht nichts', !!ohne && !ohne.chip, JSON.stringify(ohne));

  const verlauf = await p.evaluate(async () => {
    document.getElementById('bsVerlaufKnopf').click();
    await new Promise(r => setTimeout(r, 150));
    const v = document.querySelector('#bsStand .bs-verlauf');
    return { da: !!v, text: v ? v.textContent : '', knopf: document.getElementById('bsVerlaufKnopf').textContent };
  });
  pruefe('„Verlauf" klappt die letzten Bestellungen auf, mit Positionen', verlauf.da && /Handtücher 12/.test(verlauf.text) &&
    /Verlauf schließen/.test(verlauf.knopf), JSON.stringify(verlauf));
  await messen(p, 'Einkaufsliste', ['#shopMail', '#bsVerlaufKnopf', '#bsLiefAendern', '#shopPrint']);
  await p.setViewportSize({ width: 1440, height: 900 });

  // ── Das Fenster ──
  const fenster = await p.evaluate(async () => {
    document.getElementById('shopMail').click();
    await new Promise(r => setTimeout(r, 300));
    const m = document.getElementById('bestellModal');
    const zeilen = [...document.querySelectorAll('#bsListe .bs-pos')];
    return { auf: getComputedStyle(m).display !== 'none', titel: document.getElementById('bsTitel').textContent,
             an: document.getElementById('bsAn').textContent, zeilen: zeilen.length,
             alleAn: zeilen.every(z => z.querySelector('input').checked),
             shop: document.querySelectorAll('#shopList .shop-row').length,
             senden: !document.getElementById('bsSenden').disabled };
  });
  pruefe('„Bestellen" öffnet das Fenster „Bestellung an …"', fenster.auf && /Bestellung an Frottee-Lieferant/.test(fenster.titel), JSON.stringify(fenster));
  pruefe('… mit derselben Liste wie die Einkaufsliste, alles angehakt', fenster.zeilen === fenster.shop && fenster.zeilen > 1 && fenster.alleAn,
    fenster.zeilen + ' / ' + fenster.shop);
  pruefe('… an die Adresse des Lieferanten', /bestellung@lieferant\.example/.test(fenster.an), fenster.an);
  await messen(p, 'Fenster', ['#bsListe .bs-pos', '#bsSenden', '#bsMailto', '#bsClose', '#bsNotiz']);
  await p.setViewportSize({ width: 1440, height: 900 });

  // ── Ohne Mailversand: Meldung, dann das Mailprogramm ──
  let mailto = null;
  await p.route('mailto:**', r => r.abort());
  p.on('request', r => { if (r.url().indexOf('mailto:') === 0) mailto = r.url(); });
  const ohneSmtp = await p.evaluate(async () => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    /* Die App-Funktionen sind nicht global; ersetzt wird deshalb der
       Aufrufweg darunter — firebase.app().functions().httpsCallable. */
    const echt = firebase.app;
    firebase.app = function () {
      const a = echt.apply(this, arguments);
      return Object.assign({}, a, { functions: function () { return { httpsCallable: function () {
        return function () { return Promise.reject({ code: 'functions/failed-precondition',
          message: 'Der Mailversand ist noch nicht eingerichtet. Öffne die Bestellung stattdessen im Mailprogramm.' }); };
      } }; } });
    };
    const raus = document.querySelector('#bsListe .bs-pos input');
    raus.click(); await w(100);
    document.getElementById('bsNotiz').value = 'Bitte bis Freitag liefern.';
    document.getElementById('bsSenden').click(); await w(400);
    firebase.app = echt;
    return { fehler: document.getElementById('bsFehler').textContent, raus: raus.closest('.bs-pos').classList.contains('raus'),
             fokus: document.activeElement && document.activeElement.id };
  });
  pruefe('herausgenommen ist durchgestrichen', ohneSmtp.raus);
  pruefe('ohne Mailversand steht die Meldung des Servers da, ohne Doppelung', /nicht eingerichtet/.test(ohneSmtp.fehler) &&
    !/Alternativ/.test(ohneSmtp.fehler), ohneSmtp.fehler);
  pruefe('… und der Blick geht auf „Im Mailprogramm öffnen"', ohneSmtp.fokus === 'bsMailto', ohneSmtp.fokus);
  const ersterName = await p.evaluate(() => document.querySelector('#bsListe .bs-pos .bs-pos-name').firstChild.textContent);
  await p.evaluate(() => {
    window.__mailto = null;
    try { Object.defineProperty(window.location, 'href', { set: function (v) { window.__mailto = String(v); }, get: function () { return ''; } }); } catch (e) {}
    document.getElementById('bsMailto').click();
  });
  await p.waitForTimeout(400);
  const url = decodeURIComponent((await p.evaluate(() => window.__mailto)) || mailto || '');
  pruefe('das Mailprogramm bekommt die Adresse des Lieferanten', /^mailto:bestellung@lieferant\.example\?/.test(url), url.slice(0, 120));
  /* Über 1800 Zeichen öffnet die App das Mailprogramm OHNE Text und
     legt ihn in die Zwischenablage (seit Runde 59, manche
     Mailprogramme schneiden sonst still ab). Bei 14 Studios ist das
     der Fall — dann wird dort nachgesehen. */
  const text = /[?&]body=/.test(url) ? url : await p.evaluate(() => navigator.clipboard.readText()).catch(() => '');
  pruefe('… die Anmerkung (im Text oder in der Zwischenablage)', /Anmerkung:\nBitte bis Freitag liefern\./.test(text), text.slice(-200));
  pruefe('… und NICHT den herausgenommenen Artikel', text.length > 50 && text.indexOf('· ' + ersterName + ':') < 0, ersterName);

  // ── Senden (Demo) ──
  const zahlVorher = await p.evaluate((pfad) => firebase.firestore().collection(pfad).get().then(s => s.size), BEST);
  const gesendet = await p.evaluate(async (pfad) => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    document.getElementById('bsSenden').click(); await w(900);
    const e = document.getElementById('bsErgebnis');
    const neu = (await firebase.firestore().collection(pfad).get()).docs.map(d => d.data())
      .sort((a, b) => b.ts - a.ts)[0];
    return { ergebnis: e.hidden ? '' : e.textContent, neu,
             zeilen: document.querySelectorAll('#bsListe .bs-pos').length };
  }, BEST);
  pruefe('danach: „Demo — es ging keine Mail raus" (ehrlich)', /Demo — es ging keine Mail raus/.test(gesendet.ergebnis), gesendet.ergebnis);
  const zahlNachher = await p.evaluate((pfad) => firebase.firestore().collection(pfad).get().then(s => s.size), BEST);
  pruefe('eine Bestellung mehr im Protokoll', zahlNachher === zahlVorher + 1, zahlVorher + ' → ' + zahlNachher);
  const neu = gesendet.neu || {};
  pruefe('gesendet ohne den herausgenommenen Artikel', (neu.positionen || []).length === gesendet.zeilen - 1 &&
    !(neu.positionen || []).some(x => x.name === ersterName), JSON.stringify(neu.positionen));
  pruefe('… mit Studio-Kennungen statt Namen (für die Leseregel)', (neu.positionen || []).every(x =>
    (x.studios || []).length && x.studios.every(s => /^studio-\d+$/.test(s.key) && s.n > 0)), JSON.stringify(neu.positionen));
  pruefe('… und mit der Anmerkung', neu.notiz === 'Bitte bis Freitag liefern.', neu.notiz);
  const danach = await p.evaluate(async () => {
    document.getElementById('bsFertig').click();
    await new Promise(r => setTimeout(r, 400));
    return { zu: getComputedStyle(document.getElementById('bestellModal')).display === 'none',
             stand: document.getElementById('bsStand').textContent };
  });
  pruefe('„Schließen" schliesst', danach.zu);
  pruefe('oben steht jetzt „Zuletzt bestellt heute …"', /Zuletzt bestellt heute \d{2}:\d{2}/.test(danach.stand), danach.stand);

  // ── Lieferant ändern ──
  const lief = await p.evaluate(async () => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    document.getElementById('bsLiefAendern').click(); await w(150);
    const form = document.getElementById('bsLiefForm');
    const vor = { name: document.getElementById('bsLiefName').value, mail: document.getElementById('bsLiefMail').value };
    document.getElementById('bsLiefMail').value = 'kein-at-zeichen';
    document.getElementById('bsLiefSpeichern').click(); await w(150);
    const fehler = document.getElementById('bsLiefFehler').textContent;
    document.getElementById('bsLiefName').value = 'Neuer Lieferant';
    document.getElementById('bsLiefMail').value = 'neu@lieferant.example';
    document.getElementById('bsLiefSpeichern').click(); await w(500);
    const doc = await firebase.firestore().collection('firmen/koerperformen/config').doc('lieferant').get();
    return { offen: !form.hidden, vor, fehler, doc: doc.data(), zu: form.hidden,
             text: document.getElementById('bsLiefText').textContent };
  });
  pruefe('„Ändern" füllt das Formular mit dem bisherigen Lieferanten', /Frottee/.test(lief.vor.name) && lief.vor.mail === 'bestellung@lieferant.example', JSON.stringify(lief.vor));
  pruefe('eine Adresse ohne @ wird nicht gespeichert', /gültige Mailadresse/.test(lief.fehler), lief.fehler);
  pruefe('eine richtige wird gespeichert, für den ganzen Betrieb', lief.doc && lief.doc.email === 'neu@lieferant.example' &&
    lief.doc.name === 'Neuer Lieferant' && lief.zu && /Neuer Lieferant/.test(lief.text), JSON.stringify(lief.doc));
  pruefe('ohne Skriptfehler (Geschäftsführung)', !p._fehler.length, p._fehler.join(' | '));
  await p.close();

  console.log('\n── Die Studio-Leitung ──');
  const q = await oeffne(b, 'leiter', 390, 844);
  await zurEinkaufsliste(q);
  const lei = await q.evaluate(async () => {
    const t = (id) => { const e = document.getElementById(id); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; };
    document.getElementById('shopMail').click();
    await new Promise(r => setTimeout(r, 300));
    const studios = [...document.querySelectorAll('#bsListe .bs-pos small')].map(s => s.textContent);
    document.getElementById('bsClose').click();
    return { stand: t('bsStand'), lief: t('bsLiefText'), aendern: !document.getElementById('bsLiefAendern').hidden,
             studios, eigene: [...document.querySelectorAll('#matStudio option')].map(o => o.textContent.trim()) };
  });
  pruefe('sie sieht „Zuletzt bestellt" (die Bestellung betrifft ihre Studios)', /Zuletzt bestellt/.test(lei.stand), lei.stand);
  pruefe('sie sieht den Lieferanten', /Frottee-Lieferant/.test(lei.lief), lei.lief);
  pruefe('… kann ihn aber nicht ändern', !lei.aendern);
  pruefe('im Fenster stehen nur ihre eigenen Studios', lei.studios.length > 0 && lei.studios.every(s =>
    s.split(' · ').every(teil => lei.eigene.some(n => teil.indexOf(n + ' ') === 0))), JSON.stringify(lei));
  await messen(q, 'Leitung', ['#shopMail', '#bsVerlaufKnopf']);
  pruefe('ohne Skriptfehler (Studio-Leitung)', !q._fehler.length, q._fehler.join(' | '));
  await q.close();

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Bestellung per Mail: Vorschau, Senden, „zuletzt bestellt" — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
