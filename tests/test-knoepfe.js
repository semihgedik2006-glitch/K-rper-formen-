/* ── Jeder Knopf, in jeder Ansicht ────────────────────────────────────
   ENTSTANDEN AUS EINER RÜCKMELDUNG: „das sieht auch wieder so off aus
   und bitte achte auf sowas bei ALLEN Knöpfen IMMER, bevor es neue
   gibt." Ein Vorsatz ist dafür zu wenig — beim nächsten Mal rutscht
   dasselbe wieder durch. Also eine Messung, die jeden Knopf abgeht.

   Gemeldet wurde die Glocke. Gefunden wurden ZWEI Fehler, und der
   ältere war nicht der, um den es ging:

     1. `button[data-ikon]:not(.btn)` setzt display:inline-flex und
        überschreibt damit das place-items:center von .icon-btn — ohne
        selbst ein justify-content zu setzen. Jeder Nur-Symbol-Knopf mit
        data-ikon schob sein Zeichen deshalb 12 Pixel nach links.
        Betroffen: tbBericht, tbGlocke, chatMic.
     2. Das Abzeichen der Glocke war 19px auf einem 44px-Knopf und saß
        hart in der Ecke.

     Die beiden hingen zusammen: durch den Versatz klaffte rechts eine
     Lücke, in der die Zahl allein stand — das verdeckte, dass sie bei
     mittigem Symbol auf der Glocke gelegen hätte. Nachgemessen: 64 px²
     Überdeckung mit dem alten Abzeichen, 0 mit dem neuen.

   DESHALB SIND DIE REGELN HIER HERGELEITET UND NICHT GEWÄHLT.
   Eine Schwelle wie „ein Abzeichen darf höchstens 40 % breit sein"
   wäre ans Ergebnis angepasst gewesen (alt 43 %, neu 36 %). „Ein
   Abzeichen darf nicht auf dem Symbol liegen" trennt dieselben zwei
   Fälle und sagt etwas darüber, WARUM es schlecht aussah.

   GEPRÜFT WIRD IN JEDER ANSICHT:
     1. Nur-Symbol-Knöpfe: das Zeichen sitzt mittig (±2px).
     2. Abzeichen (absolut gesetzte Kinder) liegen nicht auf dem Symbol.
     3. Abzeichen werden von keinem Vorfahren abgeschnitten.
     4. Doppelte Zeichen: ein Knopf mit data-ikon, der schon ein eigenes
        <svg> trägt, bekommt ein zweites eingesetzt.
     5. Gegenprobe: der Durchlauf hat überhaupt Knöpfe gesehen.

   „JEDE ANSICHT" HAT SICH ZWEIMAL ALS ZU KLEIN ERWIESEN, und beide
   Male sah der Lauf vorher grün aus:

     · Die Dialoge blieben aussen vor. In einem davon (Einstellungen →
       Profil) landeten später neue Knöpfe — nie gemessen.
       165 → 190 Knöpfe.
     · Die Reiter INNERHALB einer Ansicht blieben aussen vor. Die
       Ansicht „Persönlich" wurde besucht, ihre drei Reiter aber nie —
       die Knöpfe unter „Ziele" waren damit ungemessen.
       190 → 215 Knöpfe.

   Das Muster ist dasselbe: grün hiess „nicht hingesehen". Deshalb geht
   der Durchgang jetzt Gruppen, Unteransichten, Team-Reiter,
   Chef-Reiter, Dialog-Reiter UND die Reiter innerhalb einer Ansicht ab.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const GRUPPEN = ['g-start', 'g-ich', 'g-komm', 'g-arbeit', 'g-team', 'g-chef'];

/* Läuft im Browser. Gibt für den aktuellen Bildschirm alle Funde
   zurück — und nebenbei, wie viele Knöpfe überhaupt gemessen wurden. */
const SONDE = () => {
  const funde = [];
  let gemessen = 0, mitAbzeichen = 0;

  const name = (k) => (k.id || k.className || k.tagName).toString().slice(0, 34);

  document.querySelectorAll('button, a.btn').forEach(k => {
    if (!k.getClientRects().length) return;
    const svg = k.querySelector(':scope > svg');
    const rk = k.getBoundingClientRect();

    /* 4) Zwei Zeichen auf einem Knopf.
       `ikonenEinsetzen()` schiebt das Symbol vorne hinein, ohne zu
       fragen, ob dort schon eines steht. Im August trugen 22 Knöpfe
       deshalb ihr Zeichen doppelt. Man sieht es sofort — aber nur,
       wenn man hinsieht. */
    if (k.hasAttribute('data-ikon') && k.querySelectorAll(':scope > svg').length > 1) {
      funde.push('ZWEI ZEICHEN: ' + name(k) + ' — data-ikon="' +
        k.getAttribute('data-ikon') + '" und ein eigenes <svg>');
    }

    /* Steht neben dem Zeichen noch etwas SICHTBARES?
       Versteckte Wörter zählen nicht (tbBericht trägt „Bericht" unter
       620px als display:none), und absolut gesetzte Kinder auch nicht —
       beide nehmen im Fluss keinen Platz ein. Der erste Anlauf hat über
       textContent gefiltert und genau deshalb tbGlocke und tbBericht
       übersehen: ihr verstecktes Wort machte sie zu „Knöpfen mit Text". */
    const danebenSichtbar = [...k.childNodes].some(n => {
      if (n.nodeType === 3) return !!n.textContent.trim();
      if (n === svg || !n.getClientRects) return false;
      if (getComputedStyle(n).position === 'absolute') return false;
      return n.getClientRects().length > 0;
    });

    // 1) Nur-Symbol-Knopf: das Zeichen gehört in die Mitte
    if (svg && !danebenSichtbar) {
      gemessen++;
      const rs = svg.getBoundingClientRect();
      const dx = Math.round(((rs.left + rs.right) / 2) - ((rk.left + rk.right) / 2));
      const dy = Math.round(((rs.top + rs.bottom) / 2) - ((rk.top + rk.bottom) / 2));
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        funde.push('NICHT MITTIG: ' + name(k) + ' — Zeichen ' + dx + '/' + dy +
          ' px neben der Mitte (Knopf ' + Math.round(rk.width) + 'x' + Math.round(rk.height) + ')');
      }
    }

    // 2+3) Abzeichen
    [...k.children].forEach(c => {
      if (getComputedStyle(c).position !== 'absolute') return;
      const rc = c.getBoundingClientRect();
      if (!rc.width || !rc.height) return;
      mitAbzeichen++;

      if (svg) {
        const rs = svg.getBoundingClientRect();
        const ox = Math.max(0, Math.min(rc.right, rs.right) - Math.max(rc.left, rs.left));
        const oy = Math.max(0, Math.min(rc.bottom, rs.bottom) - Math.max(rc.top, rs.top));
        if (ox * oy > 1) {
          funde.push('ABZEICHEN AUF DEM SYMBOL: ' + name(k) + ' — ' +
            Math.round(ox * oy) + ' px² Überdeckung');
        }
      }

      /* Ein Abzeichen, das über die Ecke ragt, braucht freie Sicht.
         Schneidet ein Vorfahre es ab, sieht man einen halben Kreis —
         und dass es abgeschnitten ist, merkt niemand als Fehler. */
      let p = c.parentElement, schuldig = null;
      while (p && p !== document.body) {
        const cs = getComputedStyle(p);
        if (/hidden|clip|auto|scroll/.test(cs.overflow + cs.overflowX + cs.overflowY)) {
          const rp = p.getBoundingClientRect();
          if (rc.top < rp.top - 0.5 || rc.bottom > rp.bottom + 0.5 ||
              rc.left < rp.left - 0.5 || rc.right > rp.right + 0.5) {
            schuldig = (p.id || p.className || p.tagName).toString().slice(0, 30);
            break;
          }
        }
        p = p.parentElement;
      }
      if (schuldig) {
        funde.push('ABZEICHEN ABGESCHNITTEN: ' + name(k) + ' — von „' + schuldig + '"');
      }
    });
  });

  return { funde, gemessen, mitAbzeichen };
};

async function lauf() {
  const fehler = [];
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 900 } });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  if (!(await page.evaluate(() => !!document.querySelector('#app.show')))) {
    await b.close();
    throw new Error('Die App ist gar nicht gestartet. ' + errs.join(' | '));
  }

  /* Die Glocke trägt ihr Abzeichen erst, wenn etwas gemeldet wurde.
     Ohne diese Zeile prüfte der Abschnitt „Abzeichen" gar nichts. */
  await page.evaluate(() => window.__nachschub('studios/studio-6/todos', [
    { id: 't1', title: 'A', done: true, doneBy: 'Anna', doneByUid: 'u2', doneAt: Date.now(), ts: 1 },
    { id: 't9', title: 'B', done: true, doneBy: 'Ben', doneByUid: 'u3', doneAt: Date.now() - 9, ts: 1 }
  ]));
  await page.waitForTimeout(500);

  const gefunden = new Set();
  let gemessen = 0, mitAbzeichen = 0;

  for (const g of GRUPPEN) {
    const da = await page.evaluate(x => {
      const k = document.querySelector('.mobnav [data-group="' + x + '"]');
      if (!k || !k.getClientRects().length) return false;
      k.click(); return true;
    }, g);
    if (!da) continue;
    await page.waitForTimeout(430);

    const unter = await page.evaluate(() => {
      const raus = [];
      document.querySelectorAll('[data-subview]').forEach(x => {
        if (x.getClientRects().length) raus.push('sub:' + x.getAttribute('data-subview'));
      });
      document.querySelectorAll('[data-teamtab]').forEach(x => {
        if (x.getClientRects().length) raus.push('team:' + x.getAttribute('data-teamtab'));
      });
      /* Reiter INNERHALB einer Ansicht. „Persoenlich" wurde besucht,
         seine drei Reiter aber nie — die Knoepfe unter „Ziele" waeren
         damit ungemessen geblieben. Dieselbe Luecke wie zuvor bei den
         Dialogen: die Ansicht zaehlt, der Reiter darin nicht. */
      document.querySelectorAll('[data-ichtab]').forEach(x => {
        if (x.getClientRects().length) raus.push('ich:' + x.getAttribute('data-ichtab'));
      });
      document.querySelectorAll('[data-perstab]').forEach(x => {
        if (x.getClientRects().length) raus.push('pers:' + x.getAttribute('data-perstab'));
      });
      /* Über den Namen, nicht über den Index: buildChefTabs() baut die
         Leiste bei jedem Wechsel neu. */
      document.querySelectorAll('.chef-tab').forEach(x => {
        if (x.getClientRects().length) raus.push('chef:' + x.textContent.trim());
      });
      return raus;
    });

    for (const u of [null].concat(unter)) {
      if (u) {
        await page.evaluate(x => {
          const art = x.slice(0, x.indexOf(':')), wert = x.slice(x.indexOf(':') + 1);
          let k = null;
          if (art === 'sub') k = document.querySelector('[data-subview="' + wert + '"]');
          else if (art === 'team') k = document.querySelector('[data-teamtab="' + wert + '"]');
          else if (art === 'ich') k = document.querySelector('[data-ichtab="' + wert + '"]');
          else if (art === 'pers') k = document.querySelector('[data-perstab="' + wert + '"]');
          else k = [...document.querySelectorAll('.chef-tab')]
            .find(t => t.textContent.trim() === wert);
          if (k) k.click();
        }, u);
        await page.waitForTimeout(480);
      }
      const r = await page.evaluate(SONDE);
      r.funde.forEach(f => gefunden.add(f));
      gemessen += r.gemessen;
      mitAbzeichen += r.mitAbzeichen;
    }
  }

  /* ── Und jetzt die Dialoge ──
     Der Einstellungs-Dialog hängt nicht an der unteren Leiste; er geht
     über den Avatar oben auf. Vier Reiter, jeder mit eigenen Knöpfen. */
  let inDialogen = 0;
  const auf = await page.evaluate(() => {
    const a = document.getElementById('uAvatar');
    if (!a || !a.getClientRects().length) return false;
    a.click(); return true;
  });
  if (auf) {
    await page.waitForTimeout(600);
    for (const reiter of ['profil', 'aussehen', 'melden', 'nachweise']) {
      await page.evaluate(x => {
        const k = document.querySelector('[data-pmtab="' + x + '"]');
        if (k) k.click();
      }, reiter);
      await page.waitForTimeout(380);
      const r = await page.evaluate(SONDE);
      r.funde.forEach(f => gefunden.add(f));
      gemessen += r.gemessen;
      mitAbzeichen += r.mitAbzeichen;
      inDialogen += r.gemessen;
    }
  }

  await b.close();

  console.log('Nur-Symbol-Knöpfe vermessen:', gemessen,
    '(davon in Dialogen: ' + inDialogen + ')', '· Abzeichen vermessen:', mitAbzeichen);

  /* Gegenprobe zur Gegenprobe: der Dialog-Durchgang muss auch wirklich
     etwas gesehen haben. Ginge der Avatar-Klick ins Leere, liefe die
     Schleife durch und meldete nichts. */
  if (!auf)
    fehler.push('GEGENPROBE: der Einstellungs-Dialog ging gar nicht auf — ' +
      'die Knöpfe darin sind ungeprüft');

  /* Gegenprobe: hat der Durchlauf überhaupt etwas gesehen? Eine App, in
     der keine Knöpfe gefunden werden, wäre der grünste Lauf von allen. */
  if (gemessen < 20)
    fehler.push('GEGENPROBE: nur ' + gemessen + ' Nur-Symbol-Knöpfe gemessen — ' +
      'entweder ist die Oberfläche kaputt oder dieser Durchlauf misst falsch');
  if (mitAbzeichen < 1)
    fehler.push('GEGENPROBE: kein einziges Abzeichen gemessen — die Prüfung ' +
      'darüber ist wertlos');

  gefunden.forEach(f => fehler.push(f));
  errs.forEach(e => fehler.push(e));

  console.log('Fehler:', fehler.length ? '' : 'keine');
  fehler.forEach(f => console.log('✗ ' + f));
  if (fehler.length) process.exitCode = 1;
}

lauf().catch(e => { console.log('✗ ' + e.message); process.exitCode = 1; });
