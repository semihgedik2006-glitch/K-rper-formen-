/* ══════════════════════════════════════════════════════════════════════
   BLOCK D DER DESIGN-RECHERCHE (Runde 103): „Danke" an der Sache

   Aus dem Betrieb, 24.9.2026: „mach dann weiter mit block d"

   D1 · an einer erledigten Aufgabe eines Kollegen steht „Danke" (≥ 44 ×
        44), ein Tipp macht daraus „Bedankt", ein zweiter nimmt es zurück
      · wer die Aufgabe erledigt hat, sieht „Danke von …" an der Zeile
        und oben auf der Startseite unter „Neu für dich"
      · ein Tipp dort gilt als gelesen — die Zeile kommt nicht wieder
      · GEGENPROBEN: an der eigenen und an einer offenen Aufgabe gibt es
        keinen Danke-Knopf; nirgends steht ein Zähler je Person
   Die Regel dazu prüft tests/rules/danke.test.js am Emulator, in
   beiden Welten.

   Dazu „Was ist neu" (am PC und am Handy): nach einer Auslieferung steht
   auf der Startseite „Neu", ein Tipp zeigt die Liste mit dem Stand und
   gilt als gesehen — auch nach dem Neuladen; dauerhaft über „Alles",
   und „Zeigen ›" führt zur Stelle.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

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

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 430, height: 932 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'dark' })));
  await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3300);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  await p.waitForTimeout(400);

  /* ── Startseite ── */
  console.log('\n── Startseite: wer Danke bekommen hat, sieht es ──');
  const start = await p.evaluate(() => {
    const z = [...document.querySelectorAll('#heuteListe .heute-zeile')].find(x => /Danke/.test(x.textContent));
    const chip = [...document.querySelectorAll('#heuteListe .heute-rest-knopf')].map(x => x.textContent);
    return { zeile: z ? z.textContent : null, chip };
  });
  console.log('  ' + JSON.stringify(start));
  pruefe('„… sagt Danke" steht unter „Neu für dich"', !!start.zeile && /sagt Danke/.test(start.zeile),
    JSON.stringify(start));

  await p.evaluate(() => [...document.querySelectorAll('#heuteListe .heute-zeile')].find(x => /Danke/.test(x.textContent)).click());
  await p.waitForTimeout(900);
  const liste = await p.evaluate((SRC) => {
    const TREFFER = eval(SRC);
    const zeilen = [...document.querySelectorAll('#todoArea .todo')];
    const eigene = zeilen.find(z => /Danke von/.test(z.textContent));
    const knopf = document.querySelector('#todoArea .todo.done [data-tdanke]');
    return {
      ansicht: (document.querySelector('.view.show') || {}).id,
      eigene: eigene ? eigene.querySelector('.t-danke-von').textContent.trim() : null,
      eigeneHatKnopf: eigene ? !!eigene.querySelector('[data-tdanke]') : null,
      offenMitKnopf: document.querySelectorAll('#todoArea .todo:not(.done) [data-tdanke]').length,
      knopfDa: !!knopf,
      t: knopf ? (knopf.scrollIntoView({ block: 'center' }), TREFFER(knopf)) : null,
      zaehler: /\d+\s*×\s*Danke|Danke\s*\(\d+\)/.test(document.getElementById('todoArea').textContent)
    };
  }, '(' + TREFFER.toString() + ')');
  console.log('  Aufgaben: ' + JSON.stringify(liste));
  pruefe('der Tipp führt in die Aufgaben', liste.ansicht === 'view-todos');
  pruefe('an der eigenen Erledigung steht „Danke von …"', !!liste.eigene && /Danke von \S/.test(liste.eigene),
    JSON.stringify(liste.eigene));
  pruefe('GEGENPROBE an der EIGENEN Aufgabe gibt es keinen Danke-Knopf', liste.eigeneHatKnopf === false);
  pruefe('GEGENPROBE an OFFENEN Aufgaben gibt es keinen Danke-Knopf', liste.offenMitKnopf === 0,
    String(liste.offenMitKnopf));
  pruefe('an einer fremden Erledigung steht „Danke"', liste.knopfDa);
  pruefe('Trefferfläche ≥ 44 × 44', liste.t && liste.t.w >= 44 && liste.t.h >= 44, JSON.stringify(liste.t));
  pruefe('GEGENPROBE kein Zähler je Person in der Liste', !liste.zaehler);

  /* ── Danke sagen und zurücknehmen ── */
  console.log('\n── Danke sagen ──');
  const an = await p.evaluate(async () => {
    const k = document.querySelector('#todoArea .todo.done [data-tdanke]');
    const id = k.closest('.todo').dataset.id;
    k.click();
    await new Promise(r => setTimeout(r, 500));
    const k2 = document.querySelector('#todoArea .todo[data-id="' + id + '"] [data-tdanke]');
    return { id, text: k2.textContent.trim(), gedrueckt: k2.getAttribute('aria-pressed') };
  });
  console.log('  ' + JSON.stringify(an));
  pruefe('ein Tipp macht daraus „Bedankt", und das übersteht das Neuzeichnen',
    an.text === 'Bedankt' && an.gedrueckt === 'true', JSON.stringify(an));
  const aus = await p.evaluate(async (id) => {
    document.querySelector('#todoArea .todo[data-id="' + id + '"] [data-tdanke]').click();
    await new Promise(r => setTimeout(r, 500));
    const k = document.querySelector('#todoArea .todo[data-id="' + id + '"] [data-tdanke]');
    return { text: k.textContent.trim(), gedrueckt: k.getAttribute('aria-pressed') };
  }, an.id);
  pruefe('ein zweiter Tipp nimmt es zurück', aus.text === 'Danke' && aus.gedrueckt === 'false', JSON.stringify(aus));

  /* ── Gelesen ist gelesen ── */
  await p.evaluate(() => [...document.querySelectorAll('.mobnav button')].find(x => /Start/.test(x.textContent)).click());
  await p.waitForTimeout(800);
  const nochmal = await p.evaluate(() =>
    [...document.querySelectorAll('#heuteListe .heute-zeile')].some(x => /sagt Danke/.test(x.textContent)));
  pruefe('nach dem Antippen steht die Danke-Zeile nicht wieder als neu da', !nochmal);

  pruefe('ohne Skriptfehler', !fehler.length, fehler.join(' | '));

  /* ══ „Was ist neu" ══
     Aus dem Betrieb: „sorge bitte dafür, dass man nach jedem Merge einen
     Unterschied auch sehen kann in der App oder es zumindest
     nachvollziehen kann." Am PC UND am Handy. */
  console.log('\n── Was ist neu ──');
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const q = await b.newPage({ viewport: { width: w, height: h } });
    const f2 = [];
    q.on('pageerror', e => f2.push(e.message.slice(0, 160)));
    await q.route('**://www.gstatic.com/**', r => r.abort());
    await q.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
    await q.waitForTimeout(3300);
    await q.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
    await q.waitForTimeout(400);
    const pille = await q.evaluate((SRC) => {
      const TREFFER = eval(SRC);
      const x = document.getElementById('neuPille');
      return x && x.getClientRects().length ? TREFFER(x) : null;
    }, '(' + TREFFER.toString() + ')');
    pruefe(w + ' px: auf der Startseite steht „Neu", ≥ 44 × 44', pille && pille.w >= 44 && pille.h >= 44, JSON.stringify(pille));
    await q.evaluate(() => document.getElementById('neuPille').click());
    await q.waitForTimeout(500);
    const liste = await q.evaluate(() => ({
      offen: document.getElementById('neuModal').classList.contains('show'),
      eintraege: [...document.querySelectorAll('#neuListe .neu-eintrag b')].map(x => x.textContent),
      stand: document.getElementById('neuStand').textContent,
      zeigen: document.querySelectorAll('#neuListe .ne-zeigen').length
    }));
    console.log('  ' + JSON.stringify(liste));
    pruefe(w + ' px: ein Tipp zeigt die Liste mit Stand', liste.offen && liste.eintraege.length >= 4 &&
      /^Stand der App: /.test(liste.stand), JSON.stringify(liste));
    await q.evaluate(() => document.getElementById('neuClose').click());
    await q.waitForTimeout(300);
    const weg = await q.evaluate(() => !document.getElementById('neuPille').getClientRects().length);
    pruefe(w + ' px: danach ist „Neu" weg (gesehen)', weg);
    await q.reload({ waitUntil: 'domcontentloaded' });
    await q.waitForTimeout(3300);
    await q.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
    const nachLaden = await q.evaluate(() => !document.getElementById('neuPille').getClientRects().length);
    pruefe(w + ' px: auch nach dem Neuladen (bis zur nächsten Auslieferung)', nachLaden);

    /* Dauerhaft erreichbar über „Alles", und „Zeigen ›" führt hin. */
    await q.evaluate(() => { const n = [...document.querySelectorAll('.mobnav button, .side button')].find(x => /Alles/.test(x.textContent) && x.getClientRects().length); n.click(); });
    await q.waitForTimeout(500);
    await q.evaluate(() => document.querySelector('#allesSeite [data-al-neu]').click());
    await q.waitForTimeout(500);
    const ueberAlles = await q.evaluate(() => document.getElementById('neuModal').classList.contains('show'));
    pruefe(w + ' px: „Alles → Was ist neu" öffnet dieselbe Liste', ueberAlles);
    await q.evaluate(() => document.querySelector('#neuListe .ne-zeigen[data-alles="todos"]').click());
    await q.waitForTimeout(700);
    const hin = await q.evaluate(() => ({ zu: !document.getElementById('neuModal').classList.contains('show'),
      ansicht: (document.querySelector('.view.show') || {}).id }));
    pruefe(w + ' px: „Zeigen ›" führt zur Stelle', hin.zu && hin.ansicht === 'view-todos', JSON.stringify(hin));
    pruefe(w + ' px: ohne Skriptfehler', !f2.length, f2.join(' | '));
    await q.close();
  }
  await b.close();
  console.log(schlecht
    ? '\n✗ Block D: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Block D: Danke an der erledigten Aufgabe, „Was ist neu“ — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
