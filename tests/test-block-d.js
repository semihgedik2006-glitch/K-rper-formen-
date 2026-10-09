/* ══════════════════════════════════════════════════════════════════════
   BLOCK D DER DESIGN-RECHERCHE (Runde 103): „Danke" an der Sache

   Aus dem Betrieb, 24.9.2026: „mach dann weiter mit block d"

   D1 · an einer erledigten Aufgabe eines Kollegen steht „Danke sagen"
        (≥ 44 hoch) — seit Runde 147 im Blatt hinter „…" —, ein Tipp
        bedankt sich, ein zweiter nimmt es zurück
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
  /* Seit Runde 147 steht „Danke sagen" im Blatt hinter „…" — so hat es der
     Betrieb gewählt (Rückfrage zum Umbau „GENAU so wie der purtzplan":
     „Weg, wie im Putzplan" — Foto, Grund, Frist und Danke hinter „…").
     An der Zeile bleibt, WER gedankt hat. Die Zusicherungen sind
     dieselben wie vorher, nur am neuen Ort: ein Eintrag ≥ 44 hoch, an
     der eigenen und an offenen Aufgaben keiner, kein Zähler. */
  const blattVon = async (sel) => {
    await p.evaluate((s) => document.querySelector(s + ' .t-mehr').click(), sel);
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => [...document.querySelectorAll('#tbActs [data-tba]')].map(a => ({
      id: a.getAttribute('data-tba'), text: a.textContent.trim(), h: Math.round(a.getBoundingClientRect().height) })));
    await p.evaluate(() => document.getElementById('tbClose').click());
    await p.waitForTimeout(300);
    return r;
  };
  const liste = await p.evaluate(() => {
    const zeilen = [...document.querySelectorAll('#todoArea .todo')];
    const eigene = zeilen.find(z => /Danke von/.test(z.textContent));
    const fremd = zeilen.find(z => z.classList.contains('done') && z !== eigene);
    const offen = zeilen.find(z => !z.classList.contains('done'));
    return {
      ansicht: (document.querySelector('.view.show') || {}).id,
      eigene: eigene ? eigene.querySelector('.t-danke-von').textContent.trim() : null,
      eigeneId: eigene && eigene.dataset.id, fremdId: fremd && fremd.dataset.id, offenId: offen && offen.dataset.id,
      knopfInZeile: document.querySelectorAll('#todoArea [data-tdanke]').length,
      zaehler: /\d+\s*×\s*Danke|Danke\s*\(\d+\)/.test(document.getElementById('todoArea').textContent)
    };
  });
  console.log('  Aufgaben: ' + JSON.stringify(liste));
  const Z = (id) => '#todoArea .todo[data-id="' + id + '"]';
  const bEigen = liste.eigeneId ? await blattVon(Z(liste.eigeneId)) : null;
  const bOffen = liste.offenId ? await blattVon(Z(liste.offenId)) : null;
  const bFremd = liste.fremdId ? await blattVon(Z(liste.fremdId)) : null;
  const dk = (bFremd || []).find(x => x.id === 'danke');
  pruefe('der Tipp führt in die Aufgaben', liste.ansicht === 'view-todos');
  pruefe('an der eigenen Erledigung steht „Danke von …"', !!liste.eigene && /Danke von \S/.test(liste.eigene),
    JSON.stringify(liste.eigene));
  pruefe('kein Danke-Knopf mehr IN der Zeile (er steht hinter „…")', liste.knopfInZeile === 0, String(liste.knopfInZeile));
  pruefe('GEGENPROBE an der EIGENEN Aufgabe gibt es kein „Danke sagen"', !!bEigen && !bEigen.some(x => x.id === 'danke'), JSON.stringify(bEigen));
  pruefe('GEGENPROBE an OFFENEN Aufgaben gibt es kein „Danke sagen"', !!bOffen && !bOffen.some(x => x.id === 'danke'), JSON.stringify(bOffen));
  pruefe('an einer fremden Erledigung steht „Danke sagen an …" im Blatt', !!dk && /^Danke sagen an \S/.test(dk.text), JSON.stringify(bFremd));
  pruefe('Eintrag ≥ 44 hoch', !!dk && dk.h >= 44, JSON.stringify(dk));
  pruefe('GEGENPROBE kein Zähler je Person in der Liste', !liste.zaehler);

  /* ── Danke sagen und zurücknehmen ── */
  console.log('\n── Danke sagen ──');
  const sagen = async () => {
    await p.evaluate((s) => document.querySelector(s + ' .t-mehr').click(), Z(liste.fremdId));
    await p.waitForTimeout(400);
    await p.evaluate(() => document.querySelector('#tbActs [data-tba="danke"]').click());
    await p.waitForTimeout(600);
    return p.evaluate((s) => { const v = document.querySelector(s + ' .t-danke-von'); return v ? v.textContent.trim() : ''; }, Z(liste.fremdId));
  };
  const an = await sagen();
  const blattDanach = await blattVon(Z(liste.fremdId));
  console.log('  ' + JSON.stringify({ an, blattDanach }));
  pruefe('ein Tipp: an der Zeile steht „Danke von dir", und das übersteht das Neuzeichnen', /Danke von .*dir/.test(an), an);
  pruefe('… und im Blatt steht jetzt „Danke zurücknehmen"', blattDanach.some(x => x.id === 'danke' && /^Danke zurücknehmen/.test(x.text)), JSON.stringify(blattDanach));
  const aus = await sagen();
  pruefe('ein zweiter Tipp nimmt es zurück', !/dir/.test(aus), aus);

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
