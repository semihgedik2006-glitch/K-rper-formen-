/* ══════════════════════════════════════════════════════════════════════
   BLOCK A DER DESIGN-RECHERCHE (Runde 103)

   Aus dem Betrieb, 24.9.2026:
     „dann lass bei der designrecherche systematisch anfangen und als
      erstes block A machen"

   docs/DESIGN-RECHERCHE.md, Block „Startseite und Wege":
     A1  eigene Schnellzugriffe auf der Startseite
     A2  die Hauptaktion gross und in der Daumenzone
     A3  Bento-Kacheln — aber nur in der Verwaltung

   Was dieser Durchlauf festhält, jeweils mit Gegenprobe:

   A1 · drei Ziele plus „Anpassen" stehen unten auf der Startseite, jedes
        mindestens 44 × 44 (Trefferfläche, nicht Rechteck) · ein Tipp
        führt genau dorthin, auch in den Unterreiter · die Wahl bleibt
        nach dem Neuladen · ein vierter wird abgelehnt · „Zum Vorschlag"
        nimmt die eigene Wahl zurück · die Wahl gilt je KONTO (Gegenprobe
        mit einer fremden Kennung) · im bisherigen Design gibt es die
        Zeile nicht
   A2 · auf dem Handy steht „+ Aufgabe" unten rechts über der Leiste,
        56 hoch · ein Tipp öffnet das Anlegen · beim Scrollen rückt er
        auf das Zeichen zusammen und bleibt ≥ 44 · der letzte Eintrag der
        Liste liegt nicht darunter · am Rechner bleibt er oben
        (Gegenprobe) · „Verwalten" in der Schulung wandert nicht mit
   A3 · das Studio mit dem meisten Rückstand hat das GROSSE Feld · die
        Kacheln sind Knöpfe · „Braucht Aufmerksamkeit" nennt Überfälliges
        und fehlendes Material je EINMAL statt je Studio
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

async function seite(b, rolle, opt) {
  opt = opt || {};
  const p = await b.newPage({ viewport: { width: opt.w || 390, height: opt.h || 844 } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((prefs) => {
    if (!sessionStorage.getItem('__schon')) {
      sessionStorage.setItem('__schon', '1');
      localStorage.setItem('kf_prefs', JSON.stringify(prefs));
    }
  }, opt.prefs || { theme: 'dark' });
  await p.goto(APP + '?demo=' + rolle + (opt.alt ? '&neu=0' : ''), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  await p.waitForTimeout(400);
  return p;
}

/* Trefferfläche: vom Mittelpunkt aus abtasten, was elementFromPoint
   wirklich trifft — ein Rechteck, das von etwas anderem verdeckt oder
   vom Scroll-Bereich abgeschnitten ist, zählt nicht. */
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

async function leiste(p) {
  return p.evaluate((TREFFER_SRC) => {
    const TREFFER = eval(TREFFER_SRC);
    const box = document.getElementById('schnellLeiste');
    if (!box || !box.getClientRects().length) return null;
    return [...box.querySelectorAll('.sz-knopf')].map(k => ({
      wort: (k.querySelector('.sz-wort') || {}).textContent || '',
      ziel: k.getAttribute('data-alles'),
      ich: k.getAttribute('data-al-ichtab'), team: k.getAttribute('data-al-teamtab'),
      cgo: k.getAttribute('data-al-cgo'),
      t: TREFFER(k)
    }));
  }, '(' + TREFFER.toString() + ')');
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  /* ══ A1 ══════════════════════════════════════════════════════════ */
  console.log('\n── A1: Schnellzugriffe ──');
  {
    const p = await seite(b, 'mitarbeiter');
    const l = await leiste(p);
    console.log('  Leiste: ' + JSON.stringify(l && l.map(x => x.wort + ' ' + x.t.w + '×' + x.t.h)));
    pruefe('die Zeile steht auf der Startseite', !!l);
    pruefe('drei Ziele und „Anpassen"', l && l.length === 4 && l[3].wort === 'Anpassen',
      JSON.stringify(l && l.map(x => x.wort)));
    pruefe('der Vorschlag für Mitarbeiter: Putzplan, Meine Zeiten, Geräte',
      l && l.slice(0, 3).map(x => x.wort).join('|') === 'Putzplan|Meine Zeiten|Geräte');
    pruefe('jede Trefferfläche ≥ 44 × 44', l && l.every(x => x.t.w >= 44 && x.t.h >= 44),
      JSON.stringify(l && l.map(x => x.t)));

    /* Liegt die Zeile über der Leiste, nicht darunter oder darin? */
    const lage = await p.evaluate(() => {
      const z = document.getElementById('schnellLeiste').getBoundingClientRect();
      const n = document.getElementById('mobnav').getBoundingClientRect();
      return { unten: Math.round(z.bottom), leisteOben: Math.round(n.top) };
    });
    pruefe('sie endet über der unteren Leiste (Daumenzone, nicht verdeckt)',
      lage.unten <= lage.leisteOben + 1, JSON.stringify(lage));

    /* Ein Tipp führt hin — bis in den Unterreiter. */
    await p.evaluate(() => [...document.querySelectorAll('#schnellLeiste .sz-knopf')]
      .find(k => /Meine Zeiten/.test(k.textContent)).click());
    await p.waitForTimeout(800);
    const da = await p.evaluate(() => ({
      ansicht: (document.querySelector('.view.show') || {}).id,
      reiter: (document.querySelector('[data-ichtab].on, [data-ichtab].active') || {}).getAttribute
        ? document.querySelector('[data-ichtab].on, [data-ichtab].active').getAttribute('data-ichtab') : null
    }));
    pruefe('„Meine Zeiten" öffnet „Ich" im Reiter Zeiten', da.ansicht === 'view-ich' && da.reiter === 'daten',
      JSON.stringify(da));

    /* Zurück zur Startseite, Anpassen öffnen. */
    await p.evaluate(() => [...document.querySelectorAll('.mobnav button')].find(x => /Start/.test(x.textContent)).click());
    await p.waitForTimeout(600);
    await p.evaluate(() => document.getElementById('schnellAnpassen').click());
    await p.waitForTimeout(500);
    const fenster = await p.evaluate(() => ({
      offen: document.getElementById('schnellModal').classList.contains('show'),
      gewaehlt: [...document.querySelectorAll('#schnellListe .kn-zeile.an')].map(z => z.textContent.trim()),
      vorschlagKnopf: getComputedStyle(document.getElementById('schnellVorschlag')).display
    }));
    pruefe('„Anpassen" öffnet die Auswahl', fenster.offen);
    pruefe('die Auswahl zeigt die drei Gewählten mit ihrer Stelle',
      fenster.gewaehlt.length === 3 && /1$/.test(fenster.gewaehlt[0]), JSON.stringify(fenster.gewaehlt));
    pruefe('„Zum Vorschlag" fehlt, solange nichts Eigenes gewählt ist', fenster.vorschlagKnopf === 'none',
      fenster.vorschlagKnopf);

    /* Ein vierter geht nicht. */
    await p.evaluate(() => document.querySelector('#schnellListe [data-schnellwahl="material"]').click());
    await p.waitForTimeout(300);
    const vier = await p.evaluate(() => document.querySelectorAll('#schnellListe .kn-zeile.an').length);
    pruefe('ein vierter wird abgelehnt (es bleiben drei)', vier === 3, String(vier));

    /* Geräte lösen, Material nehmen. */
    await p.evaluate(() => document.querySelector('#schnellListe [data-schnellwahl="geraete"]').click());
    await p.waitForTimeout(200);
    await p.evaluate(() => document.querySelector('#schnellListe [data-schnellwahl="material"]').click());
    await p.waitForTimeout(200);
    await p.evaluate(() => document.getElementById('schnellFertig').click());
    await p.waitForTimeout(400);
    const neu = await leiste(p);
    pruefe('die Zeile zeigt sofort die neue Wahl',
      neu && neu.slice(0, 3).map(x => x.wort).join('|') === 'Putzplan|Meine Zeiten|Material',
      JSON.stringify(neu && neu.map(x => x.wort)));

    /* Nach dem Neuladen noch da. */
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
    await p.waitForTimeout(300);
    const nachLaden = await leiste(p);
    pruefe('die Wahl übersteht das Neuladen',
      nachLaden && nachLaden.slice(0, 3).map(x => x.wort).join('|') === 'Putzplan|Meine Zeiten|Material',
      JSON.stringify(nachLaden && nachLaden.map(x => x.wort)));
    const ablage = await p.evaluate(() => {
      const pr = JSON.parse(localStorage.getItem('kf_prefs') || '{}');
      return pr.schnell || null;
    });
    pruefe('gemerkt ist sie unter der Kontokennung', ablage && Object.keys(ablage).length === 1 &&
      Array.isArray(Object.values(ablage)[0]), JSON.stringify(ablage));

    /* „Zum Vorschlag" */
    await p.evaluate(() => document.getElementById('schnellAnpassen').click());
    await p.waitForTimeout(400);
    await p.evaluate(() => document.getElementById('schnellVorschlag').click());
    await p.waitForTimeout(300);
    await p.evaluate(() => document.getElementById('schnellFertig').click());
    await p.waitForTimeout(300);
    const zurueck = await leiste(p);
    pruefe('„Zum Vorschlag" stellt den Vorschlag wieder her',
      zurueck && zurueck.slice(0, 3).map(x => x.wort).join('|') === 'Putzplan|Meine Zeiten|Geräte');
    pruefe('A1 ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  /* GEGENPROBE: eine Wahl unter einer FREMDEN Kennung gilt hier nicht.
     Am Empfangs-Tablet ist das der ganze Grund für die Ablage je Konto. */
  {
    const p = await seite(b, 'mitarbeiter', { prefs: { theme: 'dark', schnell: { 'jemand-anderes': ['material'] } } });
    const l = await leiste(p);
    pruefe('GEGENPROBE die Wahl eines anderen Kontos gilt hier nicht (Vorschlag steht da)',
      l && l.slice(0, 3).map(x => x.wort).join('|') === 'Putzplan|Meine Zeiten|Geräte',
      JSON.stringify(l && l.map(x => x.wort)));
    await p.close();
  }
  /* Und die Leitung bekommt ihren eigenen Vorschlag — mit Unterreitern. */
  {
    const p = await seite(b, 'chef');
    const l = await leiste(p);
    pruefe('der Vorschlag für den Chef: Überblick, Schichtplan, Anliegen',
      l && l.slice(0, 3).map(x => x.wort).join('|') === 'Überblick|Schichtplan|Anliegen',
      JSON.stringify(l && l.map(x => x.wort)));
    pruefe('Schichtplan trägt den Team-Reiter mit', l && l[1].ziel === 'team' && l[1].team === 'schicht');
    await p.close();
  }
  /* GEGENPROBE: im bisherigen Design gibt es die Zeile nicht. */
  {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript({ path: __dirname + '/stub-mitarbeiter.js' });
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    const alt = await p.evaluate(() => {
      const z = document.getElementById('schnellLeiste');
      return { neu: document.body.classList.contains('neu'), sichtbar: !!(z && z.getClientRects().length) };
    });
    pruefe('GEGENPROBE bisheriges Design: keine Schnellzugriffe', alt.neu === false && alt.sichtbar === false,
      JSON.stringify(alt));
    await p.close();
  }

  /* ══ A2 ══════════════════════════════════════════════════════════ */
  console.log('\n── A2: die Hauptaktion in Daumennähe ──');
  {
    const p = await seite(b, 'chef');
    await p.evaluate(() => [...document.querySelectorAll('.mobnav button')].find(x => /Aufgaben/.test(x.textContent)).click());
    await p.waitForTimeout(800);
    const k = await p.evaluate((TREFFER_SRC) => {
      const TREFFER = eval(TREFFER_SRC);
      const b = document.getElementById('todoNew');
      const r = b.getBoundingClientRect();
      const n = document.getElementById('mobnav').getBoundingClientRect();
      const wort = b.querySelector('.kp-daumen');
      return {
        imDock: !!b.closest('#daumenDock'),
        hoehe: Math.round(r.height), rechtsAbstand: Math.round(innerWidth - r.right),
        unten: Math.round(r.bottom), leisteOben: Math.round(n.top),
        wort: wort && wort.getClientRects().length ? wort.textContent : '',
        t: TREFFER(b)
      };
    }, '(' + TREFFER.toString() + ')');
    console.log('  Knopf: ' + JSON.stringify(k));
    pruefe('„+ Aufgabe" steht im Daumen-Dock', k.imDock);
    pruefe('unten rechts, über der Leiste', k.unten <= k.leisteOben && k.rechtsAbstand <= 24, JSON.stringify(k));
    pruefe('56 Pixel hoch und sagt, WAS angelegt wird', k.hoehe >= 56 && k.wort === 'Aufgabe', JSON.stringify(k));
    pruefe('Trefferfläche ≥ 44 × 44', k.t.w >= 44 && k.t.h >= 44, JSON.stringify(k.t));

    /* Scrollen: zusammenrücken, weiter treffbar. */
    await p.evaluate(() => { document.querySelector('#view-todos .scroll-area').scrollTop = 800; });
    await p.waitForTimeout(500);
    const eng = await p.evaluate((TREFFER_SRC) => {
      const TREFFER = eval(TREFFER_SRC);
      const b = document.getElementById('todoNew');
      const w = b.querySelector('.kp-daumen');
      return { eng: document.getElementById('daumenDock').classList.contains('eng'),
        wortWeg: !w.getClientRects().length, t: TREFFER(b) };
    }, '(' + TREFFER.toString() + ')');
    pruefe('beim Scrollen rückt er auf das Zeichen zusammen', eng.eng && eng.wortWeg, JSON.stringify(eng));
    pruefe('zusammengerückt weiter ≥ 44 × 44', eng.t.w >= 44 && eng.t.h >= 44, JSON.stringify(eng.t));

    /* Ganz unten: der letzte Eintrag liegt NICHT unter dem Knopf. */
    await p.evaluate(() => { const a = document.querySelector('#view-todos .scroll-area'); a.scrollTop = a.scrollHeight; });
    await p.waitForTimeout(500);
    const letzter = await p.evaluate(() => {
      const zeilen = [...document.querySelectorAll('#todoArea .todo')];
      const z = zeilen[zeilen.length - 1].getBoundingClientRect();
      const k = document.getElementById('todoNew').getBoundingClientRect();
      return { zeileUnten: Math.round(z.bottom), knopfOben: Math.round(k.top) };
    });
    pruefe('der letzte Eintrag endet über dem Knopf', letzter.zeileUnten <= letzter.knopfOben,
      JSON.stringify(letzter));

    /* Ein Tipp legt an. */
    await p.evaluate(() => { document.querySelector('#view-todos .scroll-area').scrollTop = 0; });
    await p.waitForTimeout(300);
    await p.evaluate(() => document.getElementById('todoNew').click());
    await p.waitForTimeout(700);
    const auf = await p.evaluate(() => ({
      ansicht: (document.querySelector('.view.show') || {}).id,
      fenster: [...document.querySelectorAll('.show[id$="Modal"]')].map(x => x.id)
    }));
    pruefe('ein Tipp öffnet das Anlegen', auf.fenster.length > 0 || auf.ansicht === 'view-chef', JSON.stringify(auf));

    /* „Verwalten" in der Schulung wandert nicht mit. */
    await p.evaluate(() => { document.querySelectorAll('.show[id$="Modal"]').forEach(m => m.classList.remove('show')); });
    await p.evaluate(() => [...document.querySelectorAll('.mobnav button')].find(x => /Alles/.test(x.textContent)).click());
    await p.waitForTimeout(400);
    await p.evaluate(() => document.querySelector('#allesSeite [data-alles="schulung"]').click());
    await p.waitForTimeout(800);
    const sch = await p.evaluate(() => {
      const v = document.getElementById('schVerwaltenBtn');
      return { imDock: !!(v && v.closest('#daumenDock')),
               dockZu: document.getElementById('daumenDock').hidden };
    });
    pruefe('„Verwalten" (Schulung) bleibt oben — es legt nichts an', !sch.imDock && sch.dockZu, JSON.stringify(sch));
    pruefe('A2 ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  /* GEGENPROBE: am Rechner gibt es keine Daumenzone. */
  {
    const p = await seite(b, 'chef', { w: 1100, h: 900 });
    await p.evaluate(() => [...document.querySelectorAll('.side button, .side a')].find(x => /Aufgaben/.test(x.textContent)).click());
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => {
      const b = document.getElementById('todoNew');
      return { imDock: !!b.closest('#daumenDock'), imKopf: !!b.closest('.view-head'), oben: Math.round(b.getBoundingClientRect().top) };
    });
    pruefe('GEGENPROBE am Rechner bleibt „+ Neu" oben im Seitenkopf', !r.imDock && r.imKopf && r.oben < 300,
      JSON.stringify(r));
    await p.close();
  }

  /* ══ A3 ══════════════════════════════════════════════════════════ */
  console.log('\n── A3: Bento in der Verwaltung ──');
  {
    const p = await seite(b, 'chef');
    await p.evaluate(() => [...document.querySelectorAll('.mobnav button')].find(x => /Alles/.test(x.textContent)).click());
    await p.waitForTimeout(400);
    await p.evaluate(() => document.querySelector('#allesSeite [data-alles="chef"][data-al-cgo="ueberblick"]').click());
    await p.waitForTimeout(1000);
    await p.evaluate(() => {
      const k = document.getElementById('studioGrid').closest('.card');
      const kopf = k.querySelector('.fold-head');
      if (kopf && !k.classList.contains('auf')) kopf.click();
    });
    await p.waitForTimeout(500);
    const t = await p.evaluate(() => {
      const g = document.getElementById('studioGrid');
      const kacheln = [...g.children];
      return {
        arten: kacheln.map(k => k.classList.contains('gross') ? 'g' : (k.classList.contains('klein') ? 'k' : 'n')).join(''),
        knoepfe: kacheln.every(k => k.tagName === 'BUTTON'),
        breiteGross: Math.round(kacheln[0].getBoundingClientRect().width),
        breiteGrid: Math.round(g.getBoundingClientRect().width),
        oben: [...kacheln[0].querySelectorAll('.st-oben li')].filter(li => li.getClientRects().length).map(li => li.textContent),
        warnErste: kacheln[0].querySelectorAll('.sm-marke.warn').length,
        warnMax: Math.max.apply(null, kacheln.map(k => k.querySelectorAll('.sm-marke.warn').length))
      };
    });
    console.log('  Tafel: ' + JSON.stringify(t));
    pruefe('genau EIN grosses Feld, und es steht vorn', /^g[nk]*$/.test(t.arten), t.arten);
    pruefe('das grosse Feld nimmt auf dem Handy die volle Breite', t.breiteGross >= t.breiteGrid - 2,
      t.breiteGross + ' von ' + t.breiteGrid);
    pruefe('die Kacheln sind Knöpfe (Tastatur, Vorlesehilfe)', t.knoepfe);
    pruefe('im grossen Feld stehen die ältesten Sachen beim Namen (zwei auf dem Handy)',
      t.oben.length === 2, JSON.stringify(t.oben));
    pruefe('die erste davon ist überfällig und sagt seit wann', /seit/.test(t.oben[0] || ''), t.oben[0]);

    const att = await p.evaluate(() => [...document.querySelectorAll('#chefAttention .att-row b')].map(x => x.textContent));
    console.log('  Aufmerksamkeit: ' + JSON.stringify(att));
    pruefe('Überfälliges steht EINMAL in „Braucht Aufmerksamkeit", nicht je Studio',
      att.filter(x => /überfällig/.test(x)).length === 1, JSON.stringify(att));
    pruefe('fehlendes Material steht EINMAL', att.filter(x => /Artikel fehl/.test(x)).length === 1, JSON.stringify(att));
    pruefe('A3 ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Block A: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Block A: Schnellzugriffe, Hauptaktion in Daumennähe, Bento — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
