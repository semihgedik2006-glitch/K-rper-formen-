/* ══════════════════════════════════════════════════════════════════════
   EMS-WISSEN IM HILFE-FENSTER (Runde 104)

   Aus dem Betrieb, 24.9.2026:
     „füge ALLES was du dort an informationen zu dir nehmen kannst zu
      dem Hilfe Knopf/Seite hinzu ebenso mit Schlagwörtern und
      Empfehlungen bzw das man oben eine frage stellen kann und … das
      System die Sachen anzeigt die am ehesten dazu passen würden also
      so wie google aber NUR für Ems training … und dich auch auf
      seiten weiterleiten kann aus dem Internet"
   Entschieden: eigene Kurzfassungen mit Quelle (A), intern + Internet-
   Knopf auf eine Liste seriöser Seiten (W1).

   Was dieser Durchlauf festhält:
     · alle 57 Fragen der Quelle sind da, in vier Kategorien, jede mit
       Link auf GENAU ihren Originalartikel
     · eine Frage bringt die passende Antwort nach OBEN (gegen den
       erwarteten Eintrag geprüft, nicht „es kam irgendwas")
     · ein Tippfehler und ein Synonym werden verziehen
     · „gerät piept" bleibt beim Handbuch — die EMS-Einträge drängen
       sich nicht vor
     · ein Schlagwort-Knopf sucht danach
     · ein Eintrag zeigt Kurzfassung, „So erklärst du es", den Weg zum
       Artikel, „Passt auch dazu" und die Quelle — und sagt, dass er
       keine ärztliche Beratung ist
     · der Internet-Knopf sucht MIT „EMS", nur auf den genannten
       Seiten, in einem neuen Tab, und warnt vor Kundennamen
     · GEGENPROBE: ein Unsinnswort findet intern nichts
     · jedes Bedienelement ≥ 44 × 44 bei 320 / 390 / 430 / 820 /
       1280 / 1440 / 1920, normal und kompakt
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
async function oeffne(b, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3300);
  await p.click('#hilfeBtn');
  await p.waitForTimeout(1500);
  return p;
}
async function suche(p, q) {
  return p.evaluate(async (q) => {
    const s = document.getElementById('hilfeSuche');
    s.value = q; s.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 300));
    return [...document.querySelectorAll('#hilfeTreffer [data-heintrag]')].map(x => x.getAttribute('data-heintrag'));
  }, q);
}
/* Alle sichtbaren Bedienelemente im Fenster, je einmal ins Bild geholt. */
async function knoepfe(p) {
  return p.evaluate(async (SRC) => {
    const TREFFER = eval(SRC);
    const aus = [];
    const els = [...document.querySelectorAll('#hilfe button, #hilfe a')].filter(x => x.getClientRects().length);
    for (const x of els) {
      x.scrollIntoView({ block: 'center' });
      await new Promise(r => requestAnimationFrame(r));
      const m = TREFFER(x);
      if (!(m.w >= 44 && m.h >= 44)) aus.push({ t: (x.textContent || x.getAttribute('aria-label') || '').trim().slice(0, 22), m });
    }
    return { zahl: els.length, aus };
  }, '(' + TREFFER.toString() + ')');
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  {
    console.log('\n── Handy 390 × 844 ──');
    const p = await oeffne(b, 390, 844);
    const d = await p.evaluate(() => {
      const w = window.EMS_WISSEN || { eintraege: [] };
      const urls = w.eintraege.map(e => e.url);
      return {
        zahl: w.eintraege.length,
        kats: [...document.querySelectorAll('#emsKats [data-hemskat]')].map(k => Number(k.querySelector('i').textContent)),
        urlsOk: urls.every(u => /^https:\/\/www\.ems-training\.de\/faq\/[a-z-]+\/[a-z0-9-]+$/.test(u)),
        urlsEinmal: new Set(urls).size === urls.length,
        stand: document.getElementById('emsStand').textContent,
        hinweis: document.getElementById('hilfeHinweis').textContent,
        frage: document.querySelector('.hilfe-frage').textContent
      };
    });
    console.log('  ' + JSON.stringify({ zahl: d.zahl, kats: d.kats }));
    pruefe('alle 57 Fragen der Quelle sind geladen', d.zahl === 57, String(d.zahl));
    pruefe('vier Kategorien, zusammen 57 (11 / 24 / 15 / 7)', d.kats.join('/') === '11/24/15/7', d.kats.join('/'));
    pruefe('jeder Eintrag führt auf genau seinen Originalartikel', d.urlsOk && d.urlsEinmal);
    pruefe('die Herkunft steht dabei (ems-training.de, eigene Worte)', /ems-training\.de/.test(d.stand) && /eigenen Worten/.test(d.stand), d.stand);
    pruefe('die Frage lädt auch zu EMS ein, und es steht weiter nicht „KI" da',
      /EMS/.test(d.frage) && /Was ist das Problem/.test(d.frage) && !/\bKI\b/.test(d.hinweis), d.frage);

    /* Die Suche: gegen den ERWARTETEN Eintrag an Platz 1. */
    const faelle = [
      ['schwanger', 'ems:schwangerschaft'],
      ['krankenkasse zahlt', 'ems:krankenkasse'],
      ['wie oft pro woche', 'ems:wie-oft'],
      ['muskelkatr', 'ems:muskelkater'],           // Tippfehler
      ['ozempic', 'ems:abnehmspritze'],             // Synonym
      ['was zieh ich an kleidung', 'ems:kleidung']
    ];
    for (const [q, soll] of faelle) {
      const t = await suche(p, q);
      pruefe('„' + q + '" bringt ' + soll + ' nach oben', t[0] === soll, t.slice(0, 3).join(' | '));
    }
    /* „probetraining ablauf": das Handbuch hat „Neukunde kommt zum
       Probetraining" — der gehört mit Recht nach oben (Ablauf im Studio).
       Der EMS-Eintrag muss aber in den ersten drei stehen. */
    const pr = await suche(p, 'probetraining ablauf');
    pruefe('„probetraining ablauf" bringt Handbuch UND EMS-Eintrag nach oben',
      pr[0] === 'b16' && pr.slice(0, 3).includes('ems:probetraining'), pr.slice(0, 3).join(' | '));
    const sm = await suche(p, 'schrittmacher');
    pruefe('„schrittmacher" (Synonym zu Implantat) bringt Herz-Kreislauf oder Kontraindikationen nach oben',
      ['ems:herz-kreislauf', 'ems:kontraindikationen'].includes(sm[0]), sm.slice(0, 3).join(' | '));
    const kontra = await suche(p, 'schwanger');
    pruefe('… und „schwanger" nennt auch die Kontraindikationen', kontra.includes('ems:kontraindikationen'), kontra.join(' | '));
    const piept = await suche(p, 'gerät piept');
    pruefe('„gerät piept" bleibt beim Handbuch (kein EMS-Eintrag davor)', piept.length > 0 && piept[0].indexOf('ems:') !== 0,
      piept.slice(0, 3).join(' | '));

    /* Internet-Knopf */
    await suche(p, 'schwanger');
    const netz = await p.evaluate(() => {
      const a = document.querySelector('#hilfeTreffer [data-hnetz]');
      if (!a) return null;
      const u = new URL(a.href);
      return { host: u.host, q: u.searchParams.get('q'), ziel: a.target, rel: a.rel,
               text: a.closest('.hilfe-netz').textContent };
    });
    pruefe('unter den Treffern steht der Weg ins Internet', !!netz);
    if (netz) {
      console.log('  q = ' + netz.q);
      pruefe('er sucht MIT „EMS"', /^EMS schwanger/.test(netz.q), netz.q);
      const sites = (netz.q.match(/site:[a-z.-]+/g) || []);
      pruefe('nur auf den 8 genannten Seiten', sites.length === 8 &&
        ['ems-training.de', 'test.de', 'quarks.de', 'faz.net', 'zeitschrift-sportmedizin.de', 'dshs-koeln.de', 'dtgv.de', 'ems-anbieter.info']
          .every(s => sites.includes('site:' + s)), sites.join(' '));
      pruefe('in einem neuen Tab, ohne Rückverweis', netz.ziel === '_blank' && /noopener/.test(netz.rel), netz.rel);
      pruefe('und er warnt vor Kundennamen', /Kundennamen/.test(netz.text));
    }
    const ems2 = await p.evaluate(async () => {
      const s = document.getElementById('hilfeSuche');
      s.value = 'ems kosten'; s.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 300));
      return new URL(document.querySelector('#hilfeTreffer [data-hnetz]').href).searchParams.get('q');
    });
    pruefe('steht „EMS" schon in der Frage, wird es nicht verdoppelt', /^ems kosten \(/.test(ems2), ems2);

    /* GEGENPROBE */
    const leer = await suche(p, 'zzzgibtesnicht');
    pruefe('GEGENPROBE ein Unsinnswort findet intern nichts', leer.length === 0, leer.join(' | '));

    /* Schlagwort-Knopf */
    await suche(p, '');
    const sw = await p.evaluate(async () => {
      const k = [...document.querySelectorAll('#hilfeStich [data-hsuch]')].find(x => x.textContent === 'Muskelkater');
      if (!k) return null;
      k.click();
      await new Promise(r => setTimeout(r, 300));
      return { feld: document.getElementById('hilfeSuche').value,
        erster: (document.querySelector('#hilfeTreffer [data-heintrag]') || { getAttribute: () => null }).getAttribute('data-heintrag') };
    });
    pruefe('ein Schlagwort-Knopf sucht danach', sw && sw.feld === 'Muskelkater' && sw.erster === 'ems:muskelkater', JSON.stringify(sw));

    /* Ein Eintrag */
    await p.evaluate(() => document.querySelector('#hilfeTreffer [data-heintrag="ems:muskelkater"]').click());
    await p.waitForTimeout(400);
    const e = await p.evaluate(() => {
      const box = document.getElementById('hilfeEintrag');
      const link = [...box.querySelectorAll('a')].find(a => /Ganzen Artikel lesen/.test(a.textContent));
      return {
        titel: box.querySelector('h3').textContent,
        kurz: (box.querySelector('.ems-kurz') || {}).textContent || '',
        sagen: box.querySelectorAll('.ems-sagen p').length,
        link: link ? { href: link.href, ziel: link.target, rel: link.rel } : null,
        verwandt: [...box.querySelectorAll('[data-heintrag]')].map(x => x.getAttribute('data-heintrag')),
        fuss: (box.querySelector('.hilfe-fuss') || {}).textContent || '',
        hinweis: (box.querySelector('.ems-hinweis') || {}).textContent || ''
      };
    });
    pruefe('der Eintrag zeigt Frage und Kurzfassung', /Muskelkater/.test(e.titel) && e.kurz.length > 80, e.titel);
    pruefe('„So erklärst du es" steht da', e.sagen >= 1);
    pruefe('„Ganzen Artikel lesen" führt auf den Originalartikel, neuer Tab',
      e.link && e.link.href === 'https://www.ems-training.de/faq/gesundheit-und-sicherheit/muskelkater-nach-ems-normal-oder-warnsignal' &&
      e.link.ziel === '_blank' && /noopener/.test(e.link.rel), JSON.stringify(e.link));
    pruefe('die Quelle steht dabei', /ems-training\.de/.test(e.fuss) && /Kurzfassung/.test(e.fuss), e.fuss);
    pruefe('und er sagt, dass er keine ärztliche Beratung ist', /keine ärztliche Beratung/.test(e.hinweis));
    pruefe('„Passt auch dazu" führt weiter', e.verwandt.includes('ems:ck-wert'), e.verwandt.join(' | '));
    await p.evaluate(() => document.querySelector('#hilfeEintrag [data-heintrag="ems:ck-wert"]').click());
    await p.waitForTimeout(300);
    const ck = await p.evaluate(() => document.querySelector('#hilfeEintrag h3').textContent);
    pruefe('… und öffnet den verwandten Eintrag', /CK/.test(ck), ck);

    /* Kategorie-Kachel */
    await p.evaluate(() => { document.querySelector('#hilfeEintrag [data-hzurueck]').click(); });
    await p.waitForTimeout(200);
    await suche(p, '');
    const kat = await p.evaluate(async () => {
      document.querySelector('#emsKats [data-hemskat="kosten"]').click();
      await new Promise(r => setTimeout(r, 300));
      return { titel: document.querySelector('#hilfeListe .hilfe-frage').textContent,
               zahl: document.querySelectorAll('#hilfeListe [data-heintrag^="ems:"]').length };
    });
    pruefe('eine EMS-Kachel öffnet ihre Kategorie', /Kosten/.test(kat.titel) && kat.zahl === 7, JSON.stringify(kat));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  /* ── Trefferflächen ── */
  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await suche(p, '');
      const start = await knoepfe(p);
      await suche(p, 'muskelkater');
      const treffer = await knoepfe(p);
      await p.evaluate(() => document.querySelector('#hilfeTreffer [data-heintrag="ems:muskelkater"]').click());
      await p.waitForTimeout(300);
      const eintrag = await knoepfe(p);
      await p.evaluate(() => document.querySelector('#hilfeEintrag [data-hzurueck]').click());
      await p.waitForTimeout(200);
      const aus = start.aus.concat(treffer.aus, eintrag.aus);
      pruefe(w + ' px, ' + dichte + ': jedes Bedienelement ≥ 44 × 44 (' + (start.zahl + treffer.zahl + eintrag.zahl) + ' gemessen)',
        !aus.length, JSON.stringify(aus.slice(0, 5)));
    }
    pruefe(w + ' px ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ EMS-Wissen: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ EMS-Wissen: 57 Fragen, passende Antwort oben, Quelle und Weg ins Internet — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
