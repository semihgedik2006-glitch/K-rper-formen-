/* ── Abgeschnittener Text ─────────────────────────────────────────────
   Aus dem Betrieb gemeldet: „manche Sachen sind etwas abgeschnitten."

   Die Forensik prüft Überlauf der SEITE (etwas ragt aus dem Fenster) und
   fand null. Das hier ist eine andere Sorte: der Kasten steht richtig,
   nur der Inhalt passt nicht hinein und wird stillschweigend
   weggeschnitten. Nichts ragt heraus, nichts scrollt, es fehlt einfach.

   Drei Arten, alle im echten Browser gemessen:

     1. PLATZHALTER   Der Text in einem leeren Feld ist breiter als das
                      Feld. Gemessen wird mit derselben Schrift über
                      canvas.measureText — nicht geschätzt.
                      So gefunden: „Suchen: Aufgaben, Dokumente, Infos,
                      Chat …" braucht 348 px und hatte je nach Gerät
                      195 bis 304.
     2. WAAGERECHT    scrollWidth > clientWidth bei overflow:hidden und
                      ohne text-overflow:ellipsis. Mit Ellipse ist es
                      Absicht und eine Ansage an den Leser; ohne endet
                      das Wort mitten im Buchstaben.
     3. SENKRECHT     scrollHeight > clientHeight bei overflow:hidden.
                      So stand die Studio-Liste im Anmeldeformular da:
                      die letzte Reihe war waagerecht durchgeschnitten.

   Ausgenommen ist, was absichtlich kürzt: -webkit-line-clamp und
   text-overflow:ellipsis.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const ANSICHTEN = [
  ['home', 'g-start'], ['chat', 'g-komm'], ['ann', 'g-komm'],
  ['todos', 'g-arbeit'], ['putzplan', 'g-arbeit'], ['material', 'g-arbeit'],
  ['geraete', 'g-arbeit'], ['probe', 'g-arbeit'], ['docs', 'g-arbeit'],
  ['team', 'g-team'], ['chef', 'g-chef']
];

/* Im Browser ausgeführt. Steht als Zeichenkette hier, damit es in jeder
   Seite läuft — auch im Anmeldebildschirm, wo es keine Ansichten gibt. */
const MESSEN = `(() => {
  const funde = [];
  const sichtbar = (e) => {
    if (!e.offsetParent && getComputedStyle(e).position !== 'fixed') return false;
    const r = e.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const wer = (e) => (e.id ? '#' + e.id :
    (e.className && typeof e.className === 'string'
      ? '.' + e.className.trim().split(/\\s+/)[0] : e.tagName));

  // 1. Platzhalter, die nicht ins Feld passen
  const c = document.createElement('canvas').getContext('2d');
  document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(e => {
    if (!sichtbar(e) || !e.placeholder) return;
    const st = getComputedStyle(e);
    c.font = st.fontStyle + ' ' + st.fontWeight + ' ' + st.fontSize + ' ' + st.fontFamily;
    const breit = c.measureText(e.placeholder).width;
    const platz = e.clientWidth - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight);
    // 4 px Nachsicht: Messung und Zeichnung liegen nie exakt gleich.
    if (breit > platz + 4) {
      funde.push({ art: 'PLATZHALTER', wo: wer(e),
        text: e.placeholder.slice(0, 60),
        detail: Math.round(breit) + ' px Text in ' + Math.round(platz) + ' px Feld' });
    }
  });

  // 2.+3. Inhalt, der stillschweigend weggeschnitten wird
  document.querySelectorAll('*').forEach(e => {
    if (!sichtbar(e)) return;
    const st = getComputedStyle(e);
    const txt = (e.textContent || '').trim();
    if (!txt) return;

    const quer = st.overflowX === 'hidden' || st.overflow === 'hidden';
    const hoch = st.overflowY === 'hidden' || st.overflow === 'hidden';
    const gewollt = st.textOverflow === 'ellipsis' ||
                    st.webkitLineClamp !== 'none' ||
                    (st.getPropertyValue('-webkit-line-clamp') || 'none') !== 'none';

    if (quer && !gewollt && e.scrollWidth > e.clientWidth + 1) {
      funde.push({ art: 'WAAGERECHT', wo: wer(e), text: txt.slice(0, 50),
        detail: e.scrollWidth + ' > ' + e.clientWidth + ' px' });
    }
    if (hoch && !gewollt && e.scrollHeight > e.clientHeight + 1) {
      funde.push({ art: 'SENKRECHT', wo: wer(e), text: txt.slice(0, 50),
        detail: e.scrollHeight + ' > ' + e.clientHeight + ' px' });
    }
  });

  // 4. Inhalt, der aus seinem eigenen Knopf herausragt
  /* Anderer Fall als oben: hier schneidet nichts, der Inhalt steht
     einfach ausserhalb. So sah es beim Suchen-Knopf aus — .icon-btn ist
     ein Grid fuer EIN Kind; kam das Wort dazu, legte es das Grid in eine
     zweite Zeile unter das Zeichen, und die feste Hoehe liess es unten
     herausstehen. Nichts war „overflow:hidden", also fiel es keiner
     Ueberlauf-Pruefung auf — man sah es nur. */
  document.querySelectorAll('button,a[role="button"]').forEach(e => {
    if (!sichtbar(e)) return;
    const r = e.getBoundingClientRect();
    [...e.children].forEach(k => {
      const s2 = getComputedStyle(k);
      if (s2.position === 'absolute' || s2.position === 'fixed') return;   // Trefferflaechen
      const rk = k.getBoundingClientRect();
      if (rk.width < 1 || rk.height < 1) return;
      const raus = Math.max(rk.bottom - r.bottom, r.top - rk.top,
                            rk.right - r.right, r.left - rk.left);
      if (raus > 1.5) {
        funde.push({ art: 'RAGT HERAUS', wo: wer(e),
          text: (e.textContent || '').trim().slice(0, 40),
          detail: Math.round(raus) + ' px ueber den Knopfrand hinaus' });
      }
    });
  });

  // Doppelte zusammenfassen: derselbe Kasten in zwei Ansichten ist eine Sache.
  const gesehen = {};
  return funde.filter(f => {
    const k = f.art + '|' + f.wo + '|' + f.detail;
    if (gesehen[k]) return false;
    gesehen[k] = 1; return true;
  });
})()`;

const errs = [];
const alle = [];

async function durchlauf(b, stub, breite, angemeldet) {
  const p = await b.newPage({ viewport: { width: breite, height: 900 } });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await p.addInitScript({ path: path.join(SP, stub) });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2600);

  const sammeln = async (marke) => {
    const f = await p.evaluate(MESSEN);
    f.forEach(x => alle.push(Object.assign({ breite, ort: marke }, x)));
  };

  if (angemeldet) {
    for (const [v, g] of ANSICHTEN) {
      await p.evaluate(async ({ v, g }) => {
        const x = document.querySelector('.mobnav [data-group="' + g + '"]');
        if (x) x.click();
        await new Promise(r => setTimeout(r, 220));
        const t = document.querySelector('[data-subview="' + v + '"]');
        if (t) t.click();
      }, { v, g });
      await p.waitForTimeout(520);
      await sammeln(v);
    }
    // Die Suche steht über allem und wurde deshalb nie mitgemessen.
    await p.evaluate(() => { const s = document.getElementById('searchBtn'); if (s) s.click(); });
    await p.waitForTimeout(500);
    await sammeln('suche');
    await p.evaluate(() => { const s = document.getElementById('searchClose'); if (s) s.click(); });

    /* Fenster misst sonst niemand. Die Forensik läuft über Ansichten und
       öffnet keinen Dialog — genau deshalb blieb neun Fenstern lang der
       Standardknopf des Browsers als Schliessen-Kreuz erhalten, 18×20 px
       gross. Hier wird jedes Fenster einmal aufgemacht. */
    const fenster = await p.evaluate(async () => {
      const ids = ['profileModal', 'devModal', 'pollModal', 'todoEditModal',
                   'aboModal', 'ownTodoModal', 'probeModal', 'fwdModal',
                   'keysModal', 'rechtModal', 'zugangModal'];
      const raus = [];
      for (const id of ids) {
        const w = document.getElementById(id);
        if (!w) { raus.push({ id, fehlt: true }); continue; }
        /* Sichtbar machen ueber den STIL, nicht ueber die Klasse .show.
           An .show haengt die Verlaufs-Mechanik: sie legt einen Eintrag
           an, und die Zurueck-Geste raeumt ihn wieder ab. Wer hier zehn
           Fenster hintereinander per Klasse aufmacht, misst hinterher
           geschlossene Fenster und meldet „0×0 Pixel" — ein Fehler des
           Messgeraets, nicht der App. Gebraucht wird hier nur die
           Geometrie, und die gibt display:flex genauso her. */
        const vorher = w.style.display;
        w.style.display = 'flex';
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const x = w.querySelector('.lb-close');
        if (!x) { raus.push({ id, ohneKreuz: true }); w.style.display = vorher; continue; }
        const r0 = x.getBoundingClientRect();
        const traegt = (dy) => {
          const e = document.elementFromPoint(r0.left + r0.width / 2,
                                              r0.top + r0.height / 2 + dy);
          return !!e && (e === x || x.contains(e));
        };
        raus.push({
          id,
          w: Math.round(r0.width), h: Math.round(r0.height),
          leer: !x.querySelector('svg') && !(x.textContent || '').trim(),
          // Trifft man ihn auch 21 px darueber und darunter? (44-px-Regel)
          gross: r0.height >= 43.5 || (traegt(-21) && traegt(21))
        });
        w.style.display = vorher;
      }
      return raus;
    });
    fenster.forEach(f => {
      if (f.fehlt || f.ohneKreuz) return;
      if (f.leer) errs.push('LEERER KNOPF: ' + f.id + ' — das Schliessen-Kreuz hat kein Zeichen');
      if (!f.gross) errs.push('ZU KLEIN: das Schliessen-Kreuz in ' + f.id +
        ' misst ' + f.w + '×' + f.h + ' px und trifft die 44-px-Regel nicht');
    });
    if (breite === 390) {
      console.log('Fenster geprüft:', fenster.length, '· Kreuze: ' +
        fenster.filter(f => f.gross).length + ' gross genug');
    }
  } else {
    /* Ohne echtes Firebase bleibt die App manchmal im Ladebildschirm
       stehen — und dann misst dieser Durchlauf den Ladebildschirm und
       meldet „nichts abgeschnitten". Ein Prüfer, der nichts sieht, ist
       schlimmer als keiner. Deshalb: notfalls über den Notausgang, den
       die App nach fünf Sekunden selbst anbietet, und danach nachsehen,
       ob wir wirklich angekommen sind. */
    const da = async () => p.evaluate(() => {
      const a = document.getElementById('authWrap');
      return !!a && getComputedStyle(a).display !== 'none';
    });
    if (!(await da())) {
      await p.evaluate(() => {
        const l = document.getElementById('loadingWrap');
        if (l) l.style.display = 'none';
        const a = document.getElementById('authWrap');
        if (a) a.classList.add('show');
      });
      await p.waitForTimeout(400);
    }
    if (!(await da())) {
      errs.push('MESSUNG LEER: der Anmeldebildschirm liess sich bei ' + breite +
                ' px nicht öffnen — dieser Durchlauf hat nichts geprüft');
      await p.close();
      return;
    }
    await sammeln('anmelden');
    await p.evaluate(() => {
      const tabs = document.getElementById('authTabs');
      if (tabs) tabs.style.display = '';        // sonst hängt er an der Beitritts-Einstellung
      const t = document.querySelector('[data-authmode="register"]');
      if (t) t.click();
    });
    await p.waitForTimeout(600);
    const angekommen = await p.evaluate(() => {
      const r = document.getElementById('registerForm');
      return !!r && getComputedStyle(r).display !== 'none';
    });
    if (!angekommen) {
      errs.push('MESSUNG LEER: „Konto anlegen" öffnet sich bei ' + breite + ' px nicht');
    } else {
      await sammeln('konto anlegen');
    }
  }
  await p.close();
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  /* 820 px gehoert dazu, auch wenn niemand die App am Tablet benutzt:
     ab 700 px schaltet eine Regel das Wort „Suchen" neben die Lupe, und
     GENAU DIESE Regel war kaputt. Wer nur Handybreiten misst, sieht
     Fehler nicht, die es nur oberhalb gibt. */
  for (const breite of [320, 390, 430, 820]) {
    await durchlauf(b, 'stub-chef.js', breite, true);
    await durchlauf(b, 'stub-ohne-login.js', breite, false);
  }

  /* Gegenprobe: findet der Messer überhaupt etwas? Ein absichtlich zu
     enges Feld muss auffallen — sonst ist ein leeres Ergebnis wertlos. */
  const probe = await b.newPage({ viewport: { width: 390, height: 700 } });
  await probe.setContent(
    '<input id="eng" style="width:60px;font:16px system-ui" ' +
    'placeholder="Ein deutlich zu langer Platzhalter für dieses Feld">' +
    '<div id="kurz" style="width:60px;overflow:hidden;white-space:nowrap;font:16px system-ui">' +
    'Ein Text, der hier nicht hineinpasst</div>');
  const gegen = await probe.evaluate(MESSEN);
  /* Zweite Gegenprobe, fuer die Fenster-Kreuze: ein absichtlich winziger
     Knopf ohne Trefferflaeche muss durchfallen. Ohne diese Zeile hiesse
     „11 von 11 gross genug" nur, dass die Regel nie zugeschlagen hat. */
  const ragtGegen = await probe.evaluate(() => {
    const b = document.createElement('button');
    b.style.cssText = 'position:fixed;left:10px;top:200px;width:40px;height:36px;' +
      'display:grid;place-items:center;overflow:visible';
    b.innerHTML = '<span style="width:20px;height:20px;display:block"></span>' +
                  '<span style="font:14px system-ui">Suchen</span>';
    document.body.appendChild(b);
    const r = b.getBoundingClientRect();
    const k = b.lastElementChild.getBoundingClientRect();
    const raus = k.bottom - r.bottom;
    b.remove();
    return raus > 1.5;
  });
  const kreuzGegen = await probe.evaluate(() => {
    const b = document.createElement('button');
    b.style.cssText = 'position:fixed;left:100px;top:100px;width:18px;height:20px';
    document.body.appendChild(b);
    const r = b.getBoundingClientRect();
    const traegt = (dy) => {
      const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2 + dy);
      return !!e && (e === b || b.contains(e));
    };
    const gross = r.height >= 43.5 || (traegt(-21) && traegt(21));
    b.remove();
    return gross;
  });
  await probe.close();
  await b.close();

  console.log('Gemessen: 4 Breiten (320/390/430/820) × (11 Ansichten + Suche + Anmeldung + 11 Fenster)\n');
  const nach = {};
  alle.forEach(f => {
    const k = f.art + '|' + f.wo + '|' + f.text;
    (nach[k] = nach[k] || { f, breiten: [], orte: [] });
    /* Die Zahl muss zur ENGSTEN Breite gehoeren, nicht zur erstbesten:
       sonst steht „70 px Feld" neben „320/390/430 px" und liest sich,
       als waere das Feld ueberall 70 px breit. */
    if (f.breite <= nach[k].f.breite) nach[k].f = f;
    if (nach[k].breiten.indexOf(f.breite) < 0) nach[k].breiten.push(f.breite);
    if (nach[k].orte.indexOf(f.ort) < 0) nach[k].orte.push(f.ort);
  });
  Object.keys(nach).forEach(k => nach[k].breiten.sort((a, b) => a - b));
  const liste = Object.keys(nach).map(k => nach[k]);
  liste.forEach(x => {
    console.log('  ' + x.f.art.padEnd(12) + x.f.wo.padEnd(24) +
      x.f.detail.padEnd(26) + '· bei ' + x.breiten.join('/') + ' px · ' +
      x.orte.slice(0, 3).join(', '));
    console.log('               „' + x.f.text + '"');
  });
  console.log('\nAbgeschnitten:', liste.length);

  if (liste.length) {
    errs.push(liste.length + ' Stelle(n) schneiden ihren Inhalt ab: ' +
      liste.slice(0, 4).map(x => x.f.wo).join(', '));
  }
  if (!gegen.some(f => f.art === 'PLATZHALTER') ||
      !gegen.some(f => f.art === 'WAAGERECHT')) {
    errs.push('GEGENPROBE: absichtlich zu enge Felder fallen nicht auf — ' +
      'dann sagt ein leeres Ergebnis nichts (' +
      gegen.map(f => f.art).join(',') + ')');
  }
  if (ragtGegen !== true) {
    errs.push('GEGENPROBE: ein Wort, das unten aus seinem Knopf ragt, faellt ' +
      'nicht auf — genau der Fehler am Suchen-Knopf bliebe unbemerkt');
  }
  if (kreuzGegen !== false) {
    errs.push('GEGENPROBE: ein 18×20-Knopf gilt der Prüfung als gross genug — ' +
      'dann ist „alle Kreuze in Ordnung" keine Aussage');
  }

  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Nichts wird stillschweigend abgeschnitten — Platzhalter passen, ' +
      'kein Kasten verschluckt Text');
  process.exit(errs.length ? 1 : 0);
})();
