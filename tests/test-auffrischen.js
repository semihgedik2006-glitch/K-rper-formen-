/* ══════════════════════════════════════════════════════════════════════
   KURZ AUFFRISCHEN — die kleine Runde (Runde 197)

   Bis Runde 196: EINE Frage, 14 Tage nach dem Bestehen, gemerkt nur auf
   dem Gerät. Aus dem Betrieb, 22.10.2026, auf den Plan „aus der einen
   Frage wird eine Runde von höchstens drei, in wachsenden Abständen":
   „plan klingt gut". Und auf die Frage, wo die Antworten liegen: „das was
   leichter ist für leute ohne zugang" — also am Teilnehmer, mit dem Code
   am Tablet, ohne Code mit verknüpftem Konto. Die Prüfungen von damals,
   die genau das Gegenteil verlangten („nur auf dem Gerät", „eine Frage"),
   sind deshalb ersetzt, nicht gelockert. Was geblieben ist:

   1. Der Browser schreibt NICHTS in die Datenbank — den Plan schreibt nur
      die Cloud Function (Regeln: tests/rules/schulung.test.js; Funktion:
      tests/rules/funktionen.test.js).
   2. Nach der Antwort steht sofort die richtige Lösung mit Erklärung.
   3. Fingerziele ≥ 44 × 44 per Hit-Test bei 320/390/430/820/1280/1440/1920,
      normal und kompakt; kein waagerechtes Scrollen.

   Neu:
   4. Die Karte ist klein, bis man „Los" drückt. Vorher 543 px hoch am
      390er Telefon; die Modulliste begann bei Pixel 1.540.
   5. Eine Runde: Frage 1 von 3 … „2 von 3 richtig" und wann die nächsten
      kommen.
   6. Die Startseite sagt es in einer Zeile — und nicht mehr, wenn nichts
      wartet (Gegenprobe).
   7. Ohne verknüpftes Konto geht es mit dem Code; danach ist der Name
      wieder weg (Gegenprobe: die nächste Person am Tablet sieht nichts).
   8. Fristen der Pflichtmodule: „bis …", und erst nach Ablauf
      „überfällig" in der Statusfarbe (Gegenprobe über die Uhr).

   Gegen die Demo: das angemeldete Konto ist als „Du (Demo-Konto)"
   Teilnehmer und hat „Wenn einem Kunden schlecht wird" vor 16 Tagen
   bestanden — drei Fragen sind dran.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
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
const BREITEN = [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]];

async function oeffne(b, w, h, rolle, init) {
  const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((i) => {
    localStorage.setItem('kf_tour', '99:demo-ich');
    if (i) Object.keys(i).forEach(k => localStorage.setItem(k, i[k]));
  }, init || null);
  await p.goto(APP + '?demo=' + (rolle || 'mitarbeiter'), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
/* Seit Runde 184 („fünf Räume") liegt die Schulung unter „Wissen". */
async function zurSchulung(p) {
  await p.evaluate(() => {
    const k = document.querySelector('.mobnav [data-group="g-wissen"]') ||
              document.querySelector('#side [data-group="g-wissen"]');
    if (k) k.click();
  });
  await p.waitForTimeout(700);
  await p.evaluate(() => {
    const t = [...document.querySelectorAll('[data-subview]')].find(x => /Schulung/.test(x.textContent));
    if (t) t.click();
  });
  await p.waitForTimeout(1600);
}
async function zurStartseite(p) {
  await p.evaluate(() => {
    const k = document.querySelector('.mobnav [data-group="g-start"]') ||
              document.querySelector('#side [data-group="g-start"]');
    if (k) k.click();
  });
  await p.waitForTimeout(1000);
}
function karte(p) {
  return p.evaluate(() => {
    const k = document.getElementById('schAuffrischKarte');
    return {
      da: !!k && !k.hidden && !!k.offsetParent,
      h: k ? k.offsetHeight : 0,
      text: k ? k.textContent.replace(/\s+/g, ' ') : '',
      antworten: document.querySelectorAll('#schAuffrisch [data-schauf]').length
    };
  });
}
/* Die richtige Antwort der Frage, die gerade dasteht — aus der Datei,
   über den Text. */
function antwortWaehlen(p, richtig) {
  return p.evaluate((richtig) => {
    const text = document.querySelector('#schAuffrisch .sch-auf-frage').textContent;
    const f = (window.SCHULUNGEN_BASIS.module || []).flatMap(m => m.fragen || []).find(x => x.frage === text);
    const i = richtig ? f.richtig : (f.richtig === 0 ? 1 : 0);
    document.querySelector('#schAuffrisch [data-schauf="' + i + '"]').click();
    return i;
  }, richtig);
}
async function startZeilen(p) {
  return p.evaluate(() => [...document.querySelectorAll('#homeAlerts .fz-teil')].map(x => (x.querySelector('.fz-lang') || x).textContent.replace(/\s+/g, ' ')));
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── Die Karte ist klein, bis man anfängt ──');
  const p = await oeffne(b, 390, 844);
  await zurSchulung(p);
  let k = await karte(p);
  pruefe('„Kurz auffrischen" steht da: „3 Fragen warten"', k.da && /3 Fragen warten/.test(k.text), k.text.slice(0, 120));
  pruefe('… noch ohne Antwortknöpfe', k.antworten === 0, String(k.antworten));
  pruefe('… und klein: höchstens 240 px hoch am 390er Telefon (vorher 543)', k.h > 0 && k.h <= 240, k.h + ' px');
  const liste = await p.evaluate(() => Math.round(document.getElementById('schListe').getBoundingClientRect().top));
  pruefe('die Modulliste beginnt mindestens 250 px höher als vorher (1.540)', liste <= 1290, liste + ' px');
  const reihenfolge = await p.evaluate(() => {
    const kinder = [...document.getElementById('schUebersicht').children]
      .flatMap(x => x.classList.contains('sch-oben') ? [...x.children] : [x]).filter(x => x.offsetParent);
    return kinder.map(x => x.id || x.className).slice(0, 2);
  });
  pruefe('Pflichtmodule stehen oben, das Auffrischen darunter',
    reihenfolge[0] === 'schFaelligKarte' && reihenfolge[1] === 'schAuffrischKarte', reihenfolge.join(' | '));

  /* ── Die Frist der Pflichtmodule ── */
  const frist = await p.evaluate(() => [...document.querySelectorAll('[data-schfaellig]')].map(z => ({
    t: z.textContent.replace(/\s+/g, ' '), ueber: !!z.querySelector('.sch-frist.ueber') })));
  pruefe('FRIST · jedes offene Pflichtmodul sagt „bis …"', frist.length >= 2 && frist.every(f => /bis \d/.test(f.t)),
    JSON.stringify(frist).slice(0, 200));
  pruefe('FRIST · Übergang: das Konto ist seit 20 Tagen Teilnehmer, trotzdem nichts überfällig',
    frist.every(f => !f.ueber && !/überfällig/.test(f.t)));

  /* ── Die Startseite, bevor geantwortet ist ── */
  await zurStartseite(p);
  let zeilen = await startZeilen(p);
  pruefe('STARTSEITE · eine Zeile „Kurz auffrischen: 3 Fragen warten"',
    zeilen.some(z => /Kurz auffrischen: 3 Fragen warten/.test(z)), zeilen.join(' | '));
  await zurSchulung(p);

  console.log('\n── Die Runde ──');
  const vorher = await p.evaluate(() => (window.__demoSchreib || []).length);
  await p.click('#schAufLos');
  await p.waitForTimeout(400);
  k = await karte(p);
  pruefe('„Los geht’s" → Frage 1 von 3 mit Antworten', /Frage 1 von 3/.test(k.text) && k.antworten >= 2, k.text.slice(0, 120));
  pruefe('… aus dem richtigen Modul', /Wenn einem Kunden schlecht wird/.test(k.text));
  await antwortWaehlen(p, false);
  await p.waitForTimeout(400);
  const falsch = await p.evaluate(() => ({
    richtig: document.querySelectorAll('#schAuffrisch .sch-antwort.richtig').length,
    falsch: document.querySelectorAll('#schAuffrisch .sch-antwort.falsch').length,
    hinweis: (document.querySelector('#schAuffrisch .sch-auf-hinweis') || {}).textContent || '',
    gesperrt: [...document.querySelectorAll('#schAuffrisch [data-schauf]')].every(x => x.disabled),
    weiter: (document.getElementById('schAufWeiter') || {}).textContent || ''
  }));
  pruefe('falsch: die richtige Antwort wird sofort gezeigt', falsch.richtig === 1 && falsch.falsch === 1, JSON.stringify(falsch));
  pruefe('… mit Erklärung', /Nicht ganz — richtig ist [A-H]\./.test(falsch.hinweis) && falsch.hinweis.length > 30, falsch.hinweis.slice(0, 80));
  pruefe('… danach lässt sich nichts mehr umwählen', falsch.gesperrt);
  pruefe('… und es geht mit „Nächste Frage" weiter', /Nächste Frage/.test(falsch.weiter), falsch.weiter);

  /* Fingerziele, solange Antworten und „Nächste Frage" dastehen. */
  for (const [w, h] of BREITEN) {
    await p.setViewportSize({ width: w, height: h });
    await p.waitForTimeout(250);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const zu = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const els = [...document.querySelectorAll('#schAuffrischKarte button')].filter(e => e.offsetParent);
        const raus = [];
        for (const el of els) {
          el.scrollIntoView({ block: 'center' });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el);
          if (m.w < 44 || m.h < 44) raus.push((el.textContent.trim() || el.id).slice(0, 16) + ' ' + m.w + '×' + m.h);
        }
        return { raus, n: els.length, quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      pruefe(w + ' px ' + dichte + ': alle ' + zu.n + ' Knöpfe ≥ 44 × 44, nichts ragt hinaus',
        zu.n >= 3 && !zu.raus.length && zu.quer <= 0, zu.raus.join(', ') + ' quer ' + zu.quer);
    }
  }
  await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
  await p.setViewportSize({ width: 390, height: 844 });

  await p.click('#schAufWeiter'); await p.waitForTimeout(400);
  k = await karte(p);
  pruefe('Frage 2 von 3', /Frage 2 von 3/.test(k.text), k.text.slice(0, 60));
  await antwortWaehlen(p, true); await p.waitForTimeout(300);
  const richtigText = await p.evaluate(() => (document.querySelector('#schAuffrisch .sch-auf-hinweis') || {}).textContent || '');
  pruefe('richtig: „Richtig." und die Erklärung', /^Richtig\./.test(richtigText), richtigText.slice(0, 60));
  await p.click('#schAufWeiter'); await p.waitForTimeout(400);
  await antwortWaehlen(p, true); await p.waitForTimeout(300);
  const fertigKnopf = await p.evaluate(() => (document.getElementById('schAufWeiter') || {}).textContent || '');
  pruefe('nach der dritten heisst der Knopf „Fertig"', fertigKnopf === 'Fertig', fertigKnopf);
  await p.click('#schAufWeiter'); await p.waitForTimeout(700);
  k = await karte(p);
  pruefe('Ergebnis: „2 von 3 richtig" und wann die nächsten kommen',
    /2 von 3 richtig\./.test(k.text) && /Die nächsten Fragen kommen (heute|morgen|ab \d+\.\d+\.)/.test(k.text), k.text.slice(0, 140));
  pruefe('… genau ein Punkt am Satzende (kein „24.10..")', !/\.\./.test(k.text), k.text);
  const nachher = await p.evaluate(() => (window.__demoSchreib || []).length);
  pruefe('der Browser selbst schreibt nichts in die Datenbank — das macht die Funktion', nachher === vorher,
    vorher + ' → ' + nachher);
  await p.click('#schAufZu'); await p.waitForTimeout(400);
  k = await karte(p);
  pruefe('„Fertig": die Karte sagt, ab wann wieder etwas kommt', k.da && /Gerade nichts fällig/.test(k.text) && k.antworten === 0, k.text.slice(0, 120));

  await zurStartseite(p);
  zeilen = await startZeilen(p);
  pruefe('GEGENPROBE STARTSEITE · nach der Runde keine Auffrisch-Zeile mehr',
    !zeilen.some(z => /Kurz auffrischen/.test(z)), zeilen.join(' | '));
  const stand = await p.evaluate(() => JSON.parse(localStorage.getItem('kf_schulstand') || '{}'));
  pruefe('auf dem Gerät liegen nur Zahlen und Titel, keine Antworten und kein Code',
    stand.uid === 'demo-ich' && stand.offen === 0 && !/richtig|antwort|code/i.test(JSON.stringify(stand)), JSON.stringify(stand).slice(0, 200));
  pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
  await p.close();

  console.log('\n── Gegenproben ──');
  /* Der Zwischenstand gehört zu EINEM Konto. */
  const fremd = await oeffne(b, 390, 844, 'mitarbeiter', {
    kf_schulstand: JSON.stringify({ uid: 'jemand-anderes', verknuepft: true, offen: 3, ts: Date.now() }) });
  zeilen = await startZeilen(fremd);
  pruefe('GEGENPROBE der Stand eines anderen Kontos auf demselben Gerät zeigt nichts',
    !zeilen.some(z => /Kurz auffrischen/.test(z)), zeilen.join(' | '));
  const eigen = await oeffne(b, 390, 844, 'mitarbeiter', {
    kf_schulstand: JSON.stringify({ uid: 'demo-ich', verknuepft: true, offen: 3, ts: Date.now(),
      fristen: [{ titel: 'Hygiene nach jedem Training', bis: Date.now() - 2 * 86400000 }] }) });
  zeilen = await startZeilen(eigen);
  pruefe('… der eigene zeigt sie (ohne Abfrage beim Start)', zeilen.some(z => /Kurz auffrischen: 3 Fragen warten/.test(z)), zeilen.join(' | '));
  const warn = await eigen.evaluate(() => [...document.querySelectorAll('#homeAlerts .fz-teil')]
    .filter(x => /Pflichtschulung/.test(x.textContent)).map(x => ({ t: (x.querySelector('.fz-lang') || x).textContent.replace(/\s+/g, ' '), warn: x.classList.contains('bad') })));
  pruefe('FRIST · eine verstrichene Pflicht-Frist steht als Hinweis in der Statusfarbe (wie eine überfällige Aufgabe)',
    warn.length === 1 && warn[0].warn && /überfällig/.test(warn[0].t), JSON.stringify(warn));
  await fremd.close(); await eigen.close();

  /* Die Uhr springt 20 Tage weiter: die Frist (14 Tage ab dem 22.10.2026)
     ist verstrichen — jetzt und erst jetzt „überfällig". */
  const r = await b.newPage({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  r._fehler = []; r.on('pageerror', e => r._fehler.push(e.message.slice(0, 160)));
  await r.route('**://www.gstatic.com/**', x => x.abort());
  await r.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await r.clock.setFixedTime(new Date(Math.max(Date.now(), new Date(2026, 9, 22).getTime()) + 20 * 86400000));
  await r.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
  await r.waitForTimeout(3200);
  await zurSchulung(r);
  const spaet = await r.evaluate(() => [...document.querySelectorAll('[data-schfaellig]')].map(z => ({
    t: z.textContent.replace(/\s+/g, ' '), ueber: !!z.querySelector('.sch-frist.ueber') })));
  pruefe('FRIST · 20 Tage später: „seit … Tagen überfällig", in der Statusfarbe',
    spaet.length >= 2 && spaet.every(f => f.ueber && /seit \d+ Tagen überfällig/.test(f.t)), JSON.stringify(spaet).slice(0, 200));
  await r.close();

  console.log('\n── Ohne verknüpftes Konto: mit dem Code ──');
  /* Die Leitung legt den eigenen Teilnehmer still — damit ist das Konto
     nicht mehr verknüpft, wie ein Studio-Tablet. Nach fünf Minuten fragt
     die Seite neu (die Uhr springt). */
  const t = await b.newPage({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  t._fehler = []; t.on('pageerror', e => t._fehler.push(e.message.slice(0, 160)));
  await t.route('**://www.gstatic.com/**', x => x.abort());
  await t.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  const jetzt = Date.now();
  await t.clock.setFixedTime(new Date(jetzt));
  await t.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await t.waitForTimeout(3200);
  await zurSchulung(t);
  await t.click('#schVerwaltenBtn'); await t.waitForTimeout(800);
  await t.evaluate(() => {
    const z = [...document.querySelectorAll('#schTnListe .sch-tn-zeile')].find(x => /Du \(Demo-Konto\)/.test(x.textContent));
    z.querySelector('[data-schsperre]').click();
  });
  await t.waitForTimeout(600);
  await t.clock.setFixedTime(new Date(jetzt + 6 * 60000));
  await zurStartseite(t);
  await zurSchulung(t);
  await t.evaluate(() => { const z = document.querySelector('#schVerwalten [data-schzurueck]'); if (z && z.offsetParent) z.click(); });
  await t.waitForTimeout(800);
  k = await karte(t);
  pruefe('ohne Verknüpfung: „Mit Code auffrischen", eingeklappt', k.da && /mit deinem Code/.test(k.text) &&
    await t.evaluate(() => !!document.getElementById('schAufCodeAuf') && !document.getElementById('schAufCode')), k.text.slice(0, 120));
  await t.click('#schAufCodeAuf'); await t.waitForTimeout(300);
  await t.fill('#schAufCode', 'RPQ2-K7MV-4NDX');
  await t.click('#schAufCodeLos'); await t.waitForTimeout(700);
  const note = await t.evaluate(() => (document.getElementById('schAufNote') || {}).textContent || '');
  pruefe('GEGENPROBE ein falscher Code: abgewiesen, keine Runde', /stimmt nicht/.test(note) &&
    await t.evaluate(() => !document.getElementById('schAufLos')), note);
  await t.fill('#schAufCode', 'rpq2 k7mv 4nds');
  await t.click('#schAufCodeLos'); await t.waitForTimeout(700);
  k = await karte(t);
  pruefe('der richtige Code: „3 Fragen warten · für Jamie Kurz"', /3 Fragen warten/.test(k.text) && /für Jamie Kurz/.test(k.text), k.text.slice(0, 140));
  await t.click('#schAufLos'); await t.waitForTimeout(300);
  const module = new Set();
  for (let i = 0; i < 3; i++) {
    const titel = await t.evaluate(() => (document.querySelector('#schAuffrisch .hint').textContent.match(/aus „(.+?)“/) || [])[1]);
    module.add(titel);
    await antwortWaehlen(t, true); await t.waitForTimeout(250);
    await t.click('#schAufWeiter'); await t.waitForTimeout(500);
  }
  pruefe('gemischt: Fragen aus beiden bestandenen Modulen in einer Runde', module.size === 2, [...module].join(' | '));
  k = await karte(t);
  pruefe('3 von 3 richtig', /3 von 3 richtig/.test(k.text), k.text.slice(0, 100));
  await t.click('#schAufZu'); await t.waitForTimeout(400);
  k = await karte(t);
  pruefe('GEGENPROBE nach „Fertig" ist der Name weg — die nächste Person sieht nichts davon',
    !/Jamie/.test(k.text) && await t.evaluate(() => !!document.getElementById('schAufCodeAuf')), k.text.slice(0, 120));
  const stand2 = await t.evaluate(() => localStorage.getItem('kf_schulstand') || '');
  pruefe('… und auch im Zwischenstand auf dem Gerät steht nichts von Jamie', !/Jamie|RPQ2/.test(stand2), stand2.slice(0, 160));
  pruefe('ohne Skriptfehler (Code-Weg)', !t._fehler.length, t._fehler.join(' | '));
  await t.close();

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Kurz auffrischen: eine kleine Runde, mit Code oder Konto — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
