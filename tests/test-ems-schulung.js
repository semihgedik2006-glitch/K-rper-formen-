/* ══════════════════════════════════════════════════════════════════════
   SCHULUNG ZUM LESEN: DIE EMS-MODULE

   Aus dem Betrieb, 24.9.2026:
     „dann können wir passend dazu Schulungen erstellen die auch etwas
      länger sind wo man dann erstmal was lesen muss und das dann später
      durch videos ersetzt werden kann"
   und: „Pflichtmodul muss es erstmal nicht geben".

   Was dieser Durchlauf festhält, und warum gerade das:

   1. FÜNF MODULE UNTER „EMS-WISSEN", KEINES PFLICHT. Die Kategorie
      steht als Knopf da, und ein Druck zeigt genau diese fünf.

   2. DER LESETEXT IST DER AUS DEM HILFE-FENSTER. Ein Schritt der Art
      `lesen` nennt nur Einträge aus ems-wissen.js. Geprüft wird, dass
      deren Überschriften und Kurzfassungen im Schritt stehen — sonst
      gäbe es zwei Fassungen, und eine davon wäre bald falsch.

   3. „WEITER" IST ERST NACH DEM LESEN FREI — und zwar erst, wenn
      BEIDES stimmt: bis zum Ende gescrollt UND eine Mindestzeit
      vergangen. Mit je einer Gegenprobe für jede Hälfte allein. Ohne
      die Gegenproben wäre der Punkt auch bei einem Knopf grün, der
      nach einer der beiden Bedingungen schon aufgeht.
      Die Zeit wird im Durchlauf vorgestellt (Date.now), nicht
      abgewartet: 75 Sekunden je Schritt echte Wartezeit prüfen nichts,
      was die vorgestellte Uhr nicht auch prüft.

   4. WAS FEHLT, WIRD GESAGT. „später als Video" steht am Schritt, und
      im Editor heisst das Feld „Video dazu — leer lassen, solange es
      fehlt".

   5. EINE EIGENE FASSUNG BEHÄLT DIE TEXTE. Wer ein EMS-Modul im Editor
      speichert, darf dabei die Verweise ins EMS-Wissen nicht verlieren
      — sonst wäre der Lesetext nach dem Speichern leer.

   6. TREFFERFLÄCHEN: jedes Bedienelement im Lese-Schritt ≥ 44 × 44 bei
      320 / 390 / 430 / 820 / 1280 / 1440 / 1920 px, normal und
      kompakt, per elementFromPoint. Am Rechner zusätzlich: der Text
      steht auf Lesebreite und zieht sich nicht über 1.200 px; daneben
      stehen die Abschnitte des Schritts zum Springen.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

async function starte(b, w, h) {
  const p = await b.newPage({ viewport: { width: w || 390, height: h || 844 } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => {
    localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'dark' }));
    localStorage.setItem('kf_tour', '99:demo-ich');
    /* Die vorgestellte Uhr. Nur Date.now — setInterval läuft weiter in
       echter Zeit, damit der Knopf sich wie im Studio von selbst löst. */
    window.__vor = 0;
    const echt = Date.now;
    Date.now = () => echt() + window.__vor;
  });
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3300);
  return p;
}
async function zurSchulung(p) {
  await p.evaluate(() => {
    const k = document.querySelector('.mobnav [data-group="g-ich"]') ||
              document.querySelector('#side [data-group="g-ich"]');
    if (k) k.click();
  });
  await p.waitForTimeout(700);
  await p.evaluate(() => {
    const t = [...document.querySelectorAll('[data-subview]')]
      .find(x => /Schulung/.test(x.textContent));
    if (t) t.click();
  });
  await p.waitForTimeout(1500);
}
async function codeHolen(p, name) {
  await p.click('#schVerwaltenBtn');
  await p.waitForTimeout(800);
  /* Die Verwaltung merkt sich den Reiter — nach dem Editor stünde sie
     auf „Module". */
  await p.evaluate(() => { const t = document.querySelector('[data-schvwtab="tn"]'); if (t) t.click(); });
  await p.waitForTimeout(500);
  await p.fill('#schTnName', name);
  await p.click('#schTnNeu');
  await p.waitForTimeout(1100);
  const code = await p.evaluate(() => {
    const b = document.getElementById('schCodeText');
    return b ? b.textContent.trim() : null;
  });
  await p.evaluate(() => {
    const z = document.querySelector('#schVerwalten [data-schzurueck]');
    if (z) z.click();
  });
  await p.waitForTimeout(500);
  return code;
}
async function modulStarten(p, id, code) {
  await p.evaluate((id) => {
    const k = document.querySelector('[data-schkat="alle"]'); if (k) k.click();
  }, id);
  await p.waitForTimeout(300);
  await p.evaluate((id) => document.querySelector('[data-schmodul="' + id + '"]').click(), id);
  await p.waitForTimeout(600);
  await p.evaluate((c) => {
    document.getElementById('schCodeFeld').value = c;
    document.getElementById('schStartBtn').click();
  }, code);
  await p.waitForTimeout(1500);
}
/* Der Zustand des Schritts, der gerade offen ist. */
function stand(p) {
  return p.evaluate(() => {
    const w = document.getElementById('schWeiter');
    return {
      lesen: !!document.querySelector('.sch-lesen'),
      titel: (document.querySelector('.sch-schritt h3') || {}).textContent || '',
      text: (document.querySelector('.sch-lesen') || {}).textContent || '',
      hinweise: [...document.querySelectorAll('.sch-schritt .hint')].map(x => x.textContent).join(' | '),
      stand: (document.getElementById('schLesenStand') || {}).textContent || '',
      weiterAus: !!(w && w.disabled),
      links: [...document.querySelectorAll('.sch-lesen a[href]')].map(a => ({
        href: a.getAttribute('href'), ziel: a.target, rel: a.rel }))
    };
  });
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
/* Alle Bedienelemente im Durchlauf, je einmal ins Bild geholt. */
async function knoepfe(p) {
  return p.evaluate(async (SRC) => {
    const TREFFER = eval('(' + SRC + ')');
    const els = [...document.querySelectorAll('#schLauf button, #schLauf a[href]')]
      .filter(e => e.offsetParent !== null);
    const aus = [];
    for (const el of els) {
      el.scrollIntoView({ block: 'center' });
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const m = TREFFER(el);
      if (m.w < 44 || m.h < 44) aus.push((el.textContent.trim() || el.id).slice(0, 24) + ' ' + m.w + '×' + m.h);
    }
    return { zahl: els.length, aus };
  }, TREFFER.toString());
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  // ══ 1. Die Module ══
  console.log('\n── Die Module ──');
  const p = await starte(b);
  await zurSchulung(p);
  const kat = await p.evaluate(() => {
    const k = document.querySelector('[data-schkat="ems"]');
    if (!k) return null;
    const name = k.textContent.trim();
    k.click();
    return new Promise(r => setTimeout(() => r({
      name,
      ids: [...document.querySelectorAll('[data-schmodul]')].map(x => x.getAttribute('data-schmodul')),
      pflicht: document.querySelectorAll('#schListe .sch-marke.pflicht').length
    }), 400));
  });
  pruefe('die Kategorie „EMS-Wissen" steht als Knopf da', !!kat && kat.name === 'EMS-Wissen', JSON.stringify(kat));
  pruefe('sie zeigt genau die fünf EMS-Module', !!kat && kat.ids.length === 5 &&
    kat.ids.every(x => /^m-ems-/.test(x)), kat && kat.ids.join(','));
  /* „Pflichtmodul muss es erstmal nicht geben." */
  pruefe('keines davon ist Pflicht', !!kat && kat.pflicht === 0, kat && String(kat.pflicht));
  const basis = await p.evaluate(() => {
    const ids = (window.SCHULUNGEN_BASIS.module || []).filter(m => m.kat === 'ems');
    return { pflicht: ids.filter(m => m.pflicht).length,
             lesen: ids.reduce((n, m) => n + m.schritte.filter(s => s.art === 'lesen').length, 0),
             ohneVideo: ids.every(m => m.schritte.every(s => s.art !== 'lesen' || s.quelle === null)) };
  });
  pruefe('auch in der Datei steht keines als Pflicht', basis.pflicht === 0);
  pruefe('die fünf haben zusammen mindestens 15 Lese-Schritte', basis.lesen >= 15, String(basis.lesen));
  pruefe('und noch kein Video — das Feld ist leer, nicht erfunden', basis.ohneVideo);

  // ══ 2. Der Lese-Schritt ══
  console.log('\n── Der Lese-Schritt ──');
  const code = await codeHolen(p, 'Lese Probe');
  pruefe('ein Code für den Durchlauf', !!code, String(code));
  await modulStarten(p, 'm-ems-grundlagen', code);
  let st = await stand(p);
  pruefe('der erste Schritt ist die Einleitung', !st.lesen && /Worum es geht/.test(st.titel), st.titel);
  await p.evaluate(() => { window.scrollTo(0, 0); document.getElementById('schWeiter').click(); });
  await p.waitForTimeout(900);
  st = await stand(p);
  const erwartet = await p.evaluate(() => {
    const e = (window.EMS_WISSEN.eintraege || []).filter(x => ['was-ist-ems', 'technik', 'warum-wirkt'].includes(x.id));
    return e.map(x => ({ frage: x.frage, kurz: x.kurz.slice(0, 40), url: x.url }));
  });
  pruefe('der zweite Schritt ist ein Lesetext', st.lesen, st.titel);
  pruefe('mit den drei Texten aus dem EMS-Wissen', erwartet.length === 3 &&
    erwartet.every(e => st.text.includes(e.frage) && st.text.includes(e.kurz)),
    erwartet.map(e => e.frage).join(' / '));
  pruefe('jeder mit dem Weg zum ganzen Artikel', erwartet.every(e => st.links.some(l => l.href === e.url)),
    st.links.map(l => l.href).join(' '));
  pruefe('der öffnet sich in einem neuen Tab, ohne Rückgriff',
    st.links.length >= 3 && st.links.every(l => l.ziel === '_blank' && /noopener/.test(l.rel)));
  /* Was fehlt, wird gesagt. */
  pruefe('„später als Video" steht dabei', /Lesezeit · später als Video/.test(st.hinweise), st.hinweise);

  /* Hälfte eins: ohne zu scrollen und ohne Zeit — gesperrt. */
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(1200);
  st = await stand(p);
  pruefe('„Weiter" ist anfangs gesperrt', st.weiterAus);
  pruefe('und sagt, woran es liegt', /bis zum Ende gelesen/.test(st.stand), st.stand);

  /* GEGENPROBE Zeit allein reicht nicht. */
  await p.evaluate(() => { window.__vor += 10 * 60 * 1000; });
  await p.waitForTimeout(1300);
  st = await stand(p);
  pruefe('GEGENPROBE nur Zeit, nicht gescrollt: weiter gesperrt', st.weiterAus, st.stand);
  await p.evaluate(() => { window.__vor = 0; });

  /* Neu starten, damit die Uhr des Schritts wieder bei null steht. */
  await p.evaluate(() => { const z = document.querySelector('[data-schzurueckschritt]'); if (z) z.click(); });
  await p.waitForTimeout(600);
  await p.evaluate(() => { window.scrollTo(0, 0); document.getElementById('schWeiter').click(); });
  await p.waitForTimeout(900);
  /* GEGENPROBE Scrollen allein reicht nicht. */
  await p.evaluate(() => document.getElementById('schLesenEnde').scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(1300);
  st = await stand(p);
  pruefe('GEGENPROBE nur gescrollt, keine Zeit: weiter gesperrt', st.weiterAus, st.stand);
  pruefe('mit den verbleibenden Sekunden', /Noch \d+ Sekunden/.test(st.stand), st.stand);
  const titelVorher = st.titel;
  await p.evaluate(() => document.getElementById('schWeiter').click());
  await p.waitForTimeout(500);
  st = await stand(p);
  pruefe('ein Druck auf den gesperrten Knopf bleibt ohne Wirkung', st.titel === titelVorher, st.titel);

  /* Beides — dann geht es. */
  await p.evaluate(() => { window.__vor += 10 * 60 * 1000; });
  await p.waitForTimeout(1300);
  st = await stand(p);
  pruefe('gescrollt UND Zeit vergangen: „Weiter" ist frei', !st.weiterAus, st.stand);
  await p.evaluate(() => document.getElementById('schWeiter').click());
  await p.waitForTimeout(900);
  st = await stand(p);
  pruefe('und führt zum nächsten Lesetext', st.lesen && st.titel !== titelVorher, st.titel);
  pruefe('der wieder gesperrt beginnt', st.weiterAus);

  /* Zurückblättern: ein gelesener Schritt ist gelesen. */
  await p.evaluate(() => document.querySelector('[data-schzurueckschritt]').click());
  await p.waitForTimeout(700);
  st = await stand(p);
  pruefe('zurückgeblättert ist ein gelesener Schritt sofort frei',
    st.titel === titelVorher && !st.weiterAus, st.titel + ' / ' + st.stand);
  pruefe('ohne Skriptfehler im Durchlauf', !p._fehler.length, p._fehler.join(' | '));

  // ══ 3. Der Editor ══
  console.log('\n── Der Editor ──');
  await p.close();
  const c = await starte(b);
  await zurSchulung(c);
  /* Einmal das Hilfe-Wissen laden — so wie jeder, der vorher die
     Hilfe oder eine EMS-Schulung aufgemacht hat. */
  await c.evaluate(() => { document.querySelector('[data-schmodul="m-ems-sicherheit"]').click(); });
  await c.waitForTimeout(400);
  await c.evaluate(() => { const z = document.querySelector('#schCode [data-schzurueck], [data-schzurueck]'); if (z) z.click(); });
  await c.waitForTimeout(400);
  await c.click('#schVerwaltenBtn');
  await c.waitForTimeout(900);
  await c.evaluate(() => { const b = document.querySelector('[data-schvwtab="mod"]'); if (b) b.click(); });
  await c.waitForTimeout(600);
  const ed = await c.evaluate(() => {
    const k = document.querySelector('[data-schbearbeiten="m-ems-grundlagen"]');
    if (!k) return null;
    k.click();
    return new Promise(r => setTimeout(() => {
      const f = document.querySelector('[data-schritt="1"]');
      r({
        arten: [...document.querySelectorAll('[data-schritt="0"] [data-sfeld="art"] option')].map(o => o.textContent),
        art: f && f.querySelector('[data-sfeld="art"]').value,
        quelle: f && (f.querySelector('[data-sfeld="quelle"]') || {}).placeholder,
        sems: f && (f.querySelector('[data-sems]') || {}).textContent
      });
    }, 800));
  });
  pruefe('der Editor kennt „Lesetext (lang)"', !!ed && ed.arten.includes('Lesetext (lang)'), ed && ed.arten.join(','));
  pruefe('ein EMS-Lese-Schritt steht dort als Lesetext', !!ed && ed.art === 'lesen', ed && ed.art);
  pruefe('mit einem Feld „Video dazu — leer lassen, solange es fehlt"',
    !!ed && /Video dazu — leer lassen, solange es fehlt/.test(ed.quelle || ''), ed && ed.quelle);
  pruefe('und sagt, welche EMS-Texte dazugehören', !!ed && /3 Texte aus dem EMS-Wissen/.test(ed.sems || ''), ed && ed.sems);

  /* Speichern als eigene Fassung — und dann: steht der Text noch da? */
  await c.evaluate(() => document.getElementById('schFSpeichern').click());
  await c.waitForTimeout(1500);
  const gespeichert = await c.evaluate(() => ({
    note: (document.getElementById('schFNote') || {}).textContent || '',
    formZu: (document.getElementById('schModulForm') || {}).style.display === 'none'
  }));
  pruefe('die eigene Fassung lässt sich speichern', gespeichert.formZu && !gespeichert.note, JSON.stringify(gespeichert));
  await c.evaluate(() => { const z = document.querySelector('#schVerwalten [data-schzurueck]'); if (z) z.click(); });
  await c.waitForTimeout(600);
  const code2 = await codeHolen(c, 'Fassung Probe');
  await modulStarten(c, 'm-ems-grundlagen', code2);
  await c.evaluate(() => { window.scrollTo(0, 0); document.getElementById('schWeiter').click(); });
  await c.waitForTimeout(900);
  const nachSpeichern = await stand(c);
  pruefe('nach dem Speichern als eigene Fassung steht der EMS-Text noch da',
    nachSpeichern.lesen && /Was ist EMS/i.test(nachSpeichern.text), nachSpeichern.titel + ' / ' + nachSpeichern.text.slice(0, 60));
  pruefe('ohne Skriptfehler im Editor', !c._fehler.length, c._fehler.join(' | '));
  await c.close();

  // ══ 3b. Vom Hilfe-Fenster in die Schulung ══
  /* Aus dem Betrieb, am Tag danach: „wo finde ich die neue schulung die
     ist niergends bei mir". Das Hilfe-Fenster — dort, wo man über EMS
     nachliest — führt jetzt hin. */
  console.log('\n── Vom Hilfe-Fenster ──');
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const hq = await starte(b, w, h);
    await hq.click('#hilfeBtn');
    await hq.waitForTimeout(1500);
    const start = await hq.evaluate(() => {
      const k = document.querySelector('#emsSchulung [data-hschulung]');
      return k ? k.textContent.trim() : null;
    });
    pruefe(w + ' px: auf der Startseite der Hilfe steht „Als Schulung lernen"',
      !!start && /Als Schulung lernen — 5 Module/.test(start), String(start));
    await hq.evaluate(() => document.querySelector('#emsSchulung [data-hschulung]').click());
    await hq.waitForTimeout(1200);
    const dort = await hq.evaluate(() => ({
      hilfeZu: !document.getElementById('hilfe').classList.contains('show'),
      seite: (document.querySelector('.view.show') || {}).id,
      kat: (document.querySelector('[data-schkat].an') || {}).textContent || '',
      ids: [...document.querySelectorAll('[data-schmodul]')].map(x => x.getAttribute('data-schmodul'))
    }));
    pruefe(w + ' px: ein Tipp führt zu den Schulungen, gefiltert auf „EMS-Wissen"',
      dort.hilfeZu && dort.seite === 'view-schulung' && /EMS-Wissen/.test(dort.kat) && dort.ids.length === 5,
      JSON.stringify(dort));

    /* Aus einem Eintrag direkt zum Modul, das ihn enthält. */
    await hq.click('#hilfeBtn');
    await hq.waitForTimeout(900);
    await hq.evaluate(() => {
      const s = document.getElementById('hilfeSuche');
      s.value = 'kontraindikationen'; s.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await hq.waitForTimeout(400);
    await hq.evaluate(() => document.querySelector('#hilfeTreffer [data-heintrag="ems:kontraindikationen"]').click());
    await hq.waitForTimeout(500);
    const eintrag = await hq.evaluate(() => {
      const k = document.querySelector('#hilfeEintrag [data-hschulung]');
      return k ? { id: k.getAttribute('data-hschulung'), text: k.textContent.trim() } : null;
    });
    pruefe(w + ' px: ein Eintrag nennt das Modul, in dem er steht',
      !!eintrag && eintrag.id === 'm-ems-sicherheit', JSON.stringify(eintrag));
    await hq.evaluate(() => document.querySelector('#hilfeEintrag [data-hschulung]').click());
    await hq.waitForTimeout(1000);
    const code = await hq.evaluate(() => ({
      feld: !!document.getElementById('schCodeFeld'),
      titel: (document.querySelector('#schCode h3') || {}).textContent || ''
    }));
    pruefe(w + ' px: und führt direkt zum Start dieses Moduls',
      code.feld && /Kontraindikationen/.test(code.titel), JSON.stringify(code));
    /* GEGENPROBE: ein Handbuch-Eintrag hat keinen solchen Knopf. */
    await hq.click('#hilfeBtn');
    await hq.waitForTimeout(900);
    const handbuch = await hq.evaluate(async () => {
      const s = document.getElementById('hilfeSuche');
      s.value = 'gerät piept'; s.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 400));
      const z = document.querySelector('#hilfeTreffer [data-heintrag]:not([data-heintrag^="ems:"])');
      if (!z) return null;
      z.click();
      await new Promise(r => setTimeout(r, 400));
      return !!document.querySelector('#hilfeEintrag [data-hschulung]');
    });
    pruefe(w + ' px: GEGENPROBE ein Handbuch-Eintrag zeigt keinen Schulungs-Knopf', handbuch === false, String(handbuch));
    pruefe(w + ' px: ohne Skriptfehler', !hq._fehler.length, hq._fehler.join(' | '));
    await hq.close();
  }

  // ══ 4. Trefferflächen und Lesebreite ══
  console.log('\n── Trefferflächen ──');
  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const q = await starte(b, w, h);
    await zurSchulung(q);
    const cq = await codeHolen(q, 'Breite ' + w);
    await modulStarten(q, 'm-ems-sicherheit', cq);
    await q.evaluate(() => { window.scrollTo(0, 0); document.getElementById('schWeiter').click(); });
    await q.waitForTimeout(900);
    await q.evaluate(() => { window.__vor += 10 * 60 * 1000; document.getElementById('schLesenEnde').scrollIntoView(); });
    await q.waitForTimeout(1300);
    for (const dichte of ['normal', 'kompakt']) {
      await q.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await q.waitForTimeout(150);
      const k = await knoepfe(q);
      pruefe(w + ' px, ' + dichte + ': jedes Bedienelement im Lese-Schritt ≥ 44 × 44 (' + k.zahl + ' gemessen)',
        k.zahl >= 3 && !k.aus.length, JSON.stringify(k.aus.slice(0, 5)));
    }
    /* Am Rechner steht rechts, was im Schritt kommt; am Handy nicht —
       dort fehlt der Platz, und eine Leiste über dem Text schöbe ihn
       nur nach unten. */
    const seite = await q.evaluate(() => {
      const a = document.querySelector('.sch-lesen-seite');
      return { da: !!a && a.offsetParent !== null, sprung: document.querySelectorAll('[data-schsprung]').length };
    });
    if (w >= 1280) pruefe(w + ' px: daneben die Abschnitte zum Springen', seite.da && seite.sprung === 2, JSON.stringify(seite));
    else pruefe(w + ' px: GEGENPROBE keine Seitenleiste', !seite.da, JSON.stringify(seite));
    if (w >= 1280) {
      const breite = await q.evaluate(() => Math.round(document.querySelector('.sch-lesen').getBoundingClientRect().width));
      pruefe(w + ' px: der Text steht auf Lesebreite (' + breite + ' px)', breite > 300 && breite <= 760, String(breite));
    }
    const quer = await q.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    pruefe(w + ' px: nichts ragt seitlich hinaus', quer <= 0, quer + ' px');
    pruefe(w + ' px ohne Skriptfehler', !q._fehler.length, q._fehler.join(' | '));
    await q.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ EMS-Schulung: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ EMS-Schulung: fünf Lese-Module, Weiter erst nach dem Lesen, Video folgt — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
