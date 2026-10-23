/* ══════════════════════════════════════════════════════════════════════
   SCHULUNG: DIE EIGENE BESCHEINIGUNG ZUM DRUCKEN (Runde 247)

   Aus dem Betrieb, 23.10.2026: „jo mach weiter" — auf den Vorschlag,
   dass jede und jeder die eigenen bestandenen Schulungen auf einem Blatt
   mitnehmen kann (bisher nur der Nachweis je Modul für die Leitung).

   Geprüft wird, jeweils mit Gegenprobe:
   1. Mitarbeitende sehen „Bescheinigung drucken" als Drucker-Zeichen im
      Kopf von „Schon geschafft"; das Blatt trägt Name, Firma und Stand.
   2. Je Modul der jüngste bestandene Durchlauf mit Datum samt Jahr,
      Ergebnis, Dauer und „Gültig bis" (12 Monate bei Notfall).
   3. Darunter, was als Pflicht noch offen ist.
   4. Ein Testlauf (Testcode) steht nicht darauf; ohne bestandene
      Schulung gibt es den Knopf nicht.
   5. Im Ausdruck steht nur das Blatt.
   6. Der Knopf trifft ≥ 44 × 44 bei sieben Breiten, normal und kompakt.
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
const BREITEN = [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]];

async function oeffne(b, w, h, rolle) {
  const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + (rolle || 'mitarbeiter'), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  await p.evaluate(() => { window.__gedruckt = 0; window.print = function () { window.__gedruckt++; };
    window.LAUF = (id) => firebase.firestore().collection('firmen/koerperformen/schulungLaeufe').doc(id); });
  await p.evaluate(() => {
    const k = document.querySelector('.mobnav [data-group="g-wissen"]') || document.querySelector('#side [data-group="g-wissen"]');
    if (k) k.click();
  });
  await p.waitForTimeout(700);
  await p.evaluate(() => { const t = [...document.querySelectorAll('[data-subview]')].find(x => /Schulung/.test(x.textContent)); if (t) t.click(); });
  await p.waitForTimeout(1500);
  return p;
}
async function drucke(p) {
  await p.evaluate(() => document.getElementById('schBescheinigung').click()); await p.waitForTimeout(300);
  return p.evaluate(() => {
    const pa = document.getElementById('printArea');
    return { gedruckt: window.__gedruckt, text: pa.innerText,
      zeilen: [...pa.querySelectorAll('tr')].slice(1).map(tr => [...tr.cells].map(td => td.textContent)),
      kopf: [...pa.querySelectorAll('th')].map(x => x.textContent) };
  });
}
const DATUM = /^\d{2}\.\d{2}\.\d{4}$/;

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const p = await oeffne(b, 1440, 900, 'mitarbeiter');

  console.log('\n── Mitarbeiter (Demo-Konto) ──');
  const knopf = await p.evaluate(() => {
    const k = document.getElementById('schBescheinigung');
    return { da: !!k && k.getClientRects().length > 0, inKarte: !!k && !!k.closest('#schMeineKarte .sch-meine-kopf'),
      name: /Bescheinigung drucken/.test(k ? k.getAttribute('aria-label') || '' : '') };
  });
  pruefe('„Bescheinigung drucken" steht als Zeichen sichtbar im Kopf von „Schon geschafft"', knopf.da && knopf.inKarte && knopf.name, JSON.stringify(knopf));
  /* Das Zeichen sitzt in der Kopfzeile, damit die Modulliste nicht
     tiefer rutscht (test-auffrischen: ≤ 1290 px am 390er Telefon). */
  const kopf = await p.evaluate(() => {
    const h = document.querySelector('#schMeineKarte h3').getBoundingClientRect();
    const k = document.getElementById('schBescheinigung').getBoundingClientRect();
    return { h3: Math.round(h.height), mitte: Math.abs((h.top + h.height / 2) - (k.top + k.height / 2)) <= 2 };
  });
  pruefe('Überschrift einzeilig, Zeichen auf ihrer Höhe', kopf.h3 <= 24 && kopf.mitte, JSON.stringify(kopf));
  let d = await drucke(p);
  pruefe('der Knopf öffnet den Druck', d.gedruckt === 1, String(d.gedruckt));
  pruefe('Titel, Name, Firma und Stand mit Jahr', /^Schulungsnachweis/.test(d.text) && /Demo-Mitarbeiter · .+ · Stand \d{2}\.\d{2}\.\d{4}/.test(d.text), d.text.slice(0, 200));
  pruefe('Spalten: Schulung, Bestanden am, Ergebnis, Dauer, Gültig bis',
    d.kopf.join('|') === 'Schulung|Bestanden am|Ergebnis|Dauer|Gültig bis', d.kopf.join('|'));
  const z = d.zeilen[0] || [];
  pruefe('Notfall als Pflicht, mit Datum, 100 %, Dauer', d.zeilen.length === 1 && z[0] === 'Wenn einem Kunden schlecht wird (Pflicht)' &&
    DATUM.test(z[1]) && z[2] === '100 %' && /Min/.test(z[3]), JSON.stringify(d.zeilen));
  const jahr = await p.evaluate(async () => {
    const l = (await LAUF('lauf3').get()).data();
    return new Date(l.ende + 12 * 30.4 * 86400000).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  });
  pruefe('„Gültig bis": 12 Monate nach dem Bestehen', z[4] === jahr, z[4] + ' statt ' + jahr);
  pruefe('ein nur angefangenes Modul (Beratung) steht nicht in der Tabelle', !d.zeilen.some(x => /Beratungsgespräch/.test(x[0])));
  pruefe('darunter die offenen Pflichtmodule', /Als Pflicht noch offen:.*Dein erster Tag im Studio.*Hygiene nach jedem Training.*Beratungsgespräch/.test(d.text), d.text.slice(-400));
  pruefe('Platz für die Unterschrift der Studioleitung', /Bestätigt durch die Studioleitung/.test(d.text));
  pruefe('unten steht, was das Blatt NICHT ist', /prüft die App nicht/.test(d.text));

  await p.emulateMedia({ media: 'print' });
  const druck = await p.evaluate(() => {
    const sichtbar = [...document.body.children].filter(e => getComputedStyle(e).display !== 'none').map(e => e.id || e.tagName);
    return { sichtbar, knoepfe: [...document.querySelectorAll('#printArea button, #printArea nav')].length };
  });
  pruefe('im Druckbild steht nur das Blatt', druck.sichtbar.join() === 'printArea' && druck.knoepfe === 0, JSON.stringify(druck));
  if (process.env.BILD) await p.screenshot({ path: process.env.BILD, fullPage: true }).catch(() => {});
  await p.emulateMedia({ media: 'screen' });

  console.log('\n── Gegenproben ──');
  /* „Gültig bis" in der Vergangenheit → „wieder fällig". */
  /* Geändert wird in den Demo-Daten — dieselbe Quelle, aus der die App
     liest (onSnapshot), nicht eine Variable in der App. */
  await p.evaluate(() => LAUF('lauf3').update({ ende: Date.now() - 400 * 86400000 })); await p.waitForTimeout(500);
  d = await drucke(p);
  pruefe('GEGENPROBE abgelaufen: „wieder fällig" — und Notfall steht dann unter „noch offen"',
    /wieder fällig/.test((d.zeilen[0] || [])[4] || '') && /noch offen:.*Wenn einem Kunden schlecht wird/.test(d.text), JSON.stringify(d.zeilen) + ' ' + d.text.slice(-200));
  /* Ein Testlauf zählt nicht; nur Testläufe → kein Knopf. */
  await p.evaluate(() => LAUF('lauf3').update({ test: true })); await p.waitForTimeout(500);
  const ohne = await p.evaluate(() => ({ knopf: document.getElementById('schBescheinigung').getClientRects().length > 0,
    karte: getComputedStyle(document.getElementById('schMeineKarte')).display }));
  pruefe('GEGENPROBE nur ein Testlauf bestanden → kein Knopf', !ohne.knopf, JSON.stringify(ohne));
  await p.evaluate(() => LAUF('lauf3').update({ test: false, bestanden: false })); await p.waitForTimeout(500);
  const durchgefallen = await p.evaluate(() => ({ knopf: document.getElementById('schBescheinigung').getClientRects().length > 0,
    karte: getComputedStyle(document.getElementById('schMeineKarte')).display }));
  pruefe('GEGENPROBE nicht bestanden → Liste ja, Knopf nein', durchgefallen.karte !== 'none' && !durchgefallen.knopf, JSON.stringify(durchgefallen));
  pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
  await p.close();

  console.log('\n── Fingerziele ──');
  for (const [w, h] of BREITEN) {
    const r = await oeffne(b, w, h, 'mitarbeiter');
    for (const dichte of ['normal', 'kompakt']) {
      await r.evaluate((x) => { document.body.dataset.dichte = x; }, dichte);
      const m = await r.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const el = document.getElementById('schBescheinigung');
        if (!el) return { fehlt: true };
        el.scrollIntoView({ block: 'center' });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return { t: T(el), quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      pruefe(w + ' px ' + dichte + ': „Bescheinigung drucken" ≥ 44 × 44, nichts ragt hinaus',
        !m.fehlt && m.t.w >= 44 && m.t.h >= 44 && m.quer <= 0, JSON.stringify(m));
    }
    await r.close();
  }

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Schulung: eigene Bescheinigung zum Drucken — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
