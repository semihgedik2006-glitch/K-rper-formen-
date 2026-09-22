/* ══════════════════════════════════════════════════════════════════════
   DIE FÜHRUNG DURCH DIE APP

   Aus dem Betrieb, 22.9.2026:
     „ich würde gerne den einrichtungs assistenten bauen das man am
      anfang eine ganze führung durch die app bekommt im gewissen sinne."

   Eine Führung ist eine Zusage über etwas, das genau EINMAL passiert —
   beim ersten Start, bei einem Menschen, der die App nicht kennt. Wer
   sie prüfen will, muss deshalb den ersten Start nachstellen und nicht
   die Funktion aufrufen.

   Fünf Fragen:

   1. Kommt sie beim ersten Mal von selbst — und beim zweiten Mal NICHT
      mehr? Eine Führung, die jeden Morgen anspringt, wird nach drei
      Tagen weggetippt, bevor jemand liest, was dasteht.

   2. Zeigt jeder Schritt auf etwas, das WIRKLICH auf dem Bildschirm
      steht? Ein Lichtkegel auf ein Element, das es in dieser Rolle
      nicht gibt, leuchtet ins Leere — und das fällt in einer Führung
      besonders auf, weil man ihr gerade Vertrauen schenkt.

   3. Liegt die Karte nie auf dem Licht? Genau das ist beim Bauen
      zweimal passiert: erst bei „Lösungen", dann bei „Verwaltung".
      Eine Erklärung, die das Erklärte verdeckt, ist keine.

   4. Bekommt jede Rolle IHRE Führung? Ein Mitarbeiter, dem in Schritt 6
      die Verwaltung gezeigt wird, glaubt der Führung ab da nicht mehr.

   5. Kommt man wieder heran? „Überspringen" muss auf jedem Schritt
      gehen, und danach muss es einen Weg zurück geben.
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

/* Die Führung startet zwei Sekunden nach dem Aufbau. Vier Sekunden
   Reserve: ein langsamer Lauf darf den Durchlauf nicht rot machen, ein
   fehlender Start soll ihn aber sehr wohl. */
const WARTEN = 6500;

async function seite(b, rolle, prefs) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', e => { p._fehler = (p._fehler || []).concat(e.message.slice(0, 160)); });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((v) => {
    localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'dark' }));
    if (v) localStorage.setItem('kf_tour', v);
  }, prefs || '');
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(WARTEN);
  return p;
}

const stand = (p) => p.evaluate(() => {
  const t = document.getElementById('tour');
  if (!t) return { da: false };
  const auf = t.classList.contains('show');
  if (!auf) return { da: true, auf: false };
  const l = document.getElementById('tourLicht').getBoundingClientRect();
  const k = document.getElementById('tourKarte').getBoundingClientRect();
  return {
    da: true, auf: true,
    zahl: document.getElementById('tourZahl').textContent,
    titel: document.getElementById('tourTitel').textContent,
    text: document.getElementById('tourText').textContent,
    licht: { l: l.left, o: l.top, r: l.right, u: l.bottom, b: l.width, h: l.height },
    karte: { l: k.left, o: k.top, r: k.right, u: k.bottom },
    /* Steht im Lichtkegel überhaupt ein Element, oder leuchtet er ins
       Leere? Gefragt wird den Browser, was an dieser Stelle liegt —
       nicht die App, was sie dort vermutet. */
    trefferImLicht: (function () {
      const e = document.elementFromPoint(
        Math.min(window.innerWidth - 2, Math.max(2, l.left + l.width / 2)),
        Math.min(window.innerHeight - 2, Math.max(2, l.top + l.height / 2)));
      return e ? (e.id || e.className || e.tagName) : null;
    })(),
    ansicht: (document.querySelector('.view.show') || {}).id || null
  };
});

function ueberlappt(a, b) {
  return !(a.r <= b.l || a.l >= b.r || a.u <= b.o || a.o >= b.u);
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  /* ══ 1. Sie kommt von selbst, und jede Rolle bekommt ihre ══ */
  const laengen = {};
  for (const rolle of ['chef', 'leiter', 'mitarbeiter']) {
    console.log('\n── ' + rolle + ' ──');
    const p = await seite(b, rolle);
    const erst = await stand(p);
    pruefe('die Führung gibt es im Markup', erst.da);
    pruefe('sie startet beim ersten Mal von selbst', erst.auf === true,
      JSON.stringify(erst).slice(0, 80));
    if (!erst.auf) { await p.close(); continue; }

    const schritte = [];
    for (let i = 0; i < 15; i++) {
      const s = await stand(p);
      if (!s.auf) break;
      schritte.push(s);
      await p.evaluate(() => document.getElementById('tourWeiter').click());
      await p.waitForTimeout(800);
    }
    laengen[rolle] = schritte.length;
    console.log('  ' + schritte.length + ' Schritte: ' +
      schritte.map(s => s.titel.split(':')[0]).join(' · '));

    schritte.forEach((s, i) => {
      const nr = (i + 1);
      /* Die Zählung muss stimmen — „Schritt 4 von 6" bei fünf Schritten
         ist die Art Fehler, die niemand meldet und jeder bemerkt. */
      pruefe('  Schritt ' + nr + ': die Zählung stimmt',
        s.zahl === 'Schritt ' + nr + ' von ' + schritte.length, s.zahl);
      pruefe('  Schritt ' + nr + ': der Lichtkegel hat eine Grösse',
        s.licht.b > 20 && s.licht.h > 20,
        Math.round(s.licht.b) + '×' + Math.round(s.licht.h));
      pruefe('  Schritt ' + nr + ': er liegt im Bild',
        s.licht.o >= 0 && s.licht.l >= 0 && s.licht.u <= 844 + 1 && s.licht.r <= 390 + 1,
        JSON.stringify(s.licht));
      pruefe('  Schritt ' + nr + ': dort steht wirklich etwas',
        !!s.trefferImLicht, String(s.trefferImLicht));
      /* DER FUND AUS DEM BAU: die Karte lag auf dem Licht. Zweimal. */
      pruefe('  Schritt ' + nr + ': die Karte liegt NICHT auf dem Licht',
        !ueberlappt(s.karte, s.licht),
        'Licht ' + Math.round(s.licht.o) + '–' + Math.round(s.licht.u) +
        ', Karte ' + Math.round(s.karte.o) + '–' + Math.round(s.karte.u));
      pruefe('  Schritt ' + nr + ': die Karte liegt ganz im Bild',
        s.karte.o >= 0 && s.karte.u <= 844 + 1 && s.karte.l >= 0 && s.karte.r <= 390 + 1,
        JSON.stringify(s.karte));
      /* Der Titel darf kurz sein — „Das Team" sind acht Zeichen, und
         genau daran ist die erste Fassung dieser Zeile gescheitert:
         eine Schwelle, die ans Ergebnis angepasst war statt an die
         Frage. Gefragt ist, ob überhaupt etwas dasteht, und ob die
         Erklärung mehr ist als eine Überschrift. */
      pruefe('  Schritt ' + nr + ': Titel und Text sind gefüllt',
        (s.titel || '').trim().length > 3 && (s.text || '').trim().length > 30,
        '„' + s.titel + '" / ' + (s.text || '').length + ' Zeichen');
    });

    pruefe('am Ende schliesst sie sich', !(await stand(p)).auf);
    pruefe('keine Skriptfehler', !(p._fehler || []).length, (p._fehler || [])[0]);
    await p.close();
  }

  /* ══ 2. Jede Rolle bekommt IHRE Führung ══
     Der Chef muss mehr sehen als der Mitarbeiter — sonst ist es keine
     rollenabhängige Führung, sondern eine mit einem Verweis darauf. */
  console.log('\n── Rollen im Vergleich ──');
  console.log('  ' + JSON.stringify(laengen));
  pruefe('der Chef bekommt mehr Schritte als ein Mitarbeiter',
    laengen.chef > laengen.mitarbeiter, JSON.stringify(laengen));
  pruefe('der Leiter liegt dazwischen oder gleichauf mit dem Mitarbeiter',
    laengen.leiter >= laengen.mitarbeiter && laengen.leiter <= laengen.chef,
    JSON.stringify(laengen));

  /* ══ 3. Beim zweiten Mal bleibt sie weg ══ */
  console.log('\n── Das zweite Mal ──');
  {
    /* Die Form, die die App wirklich schreibt: Fassung UND
       Kontokennung. Eine blosse „1" gilt seit dem 22.9.2026 nicht mehr
       — sie würde auf einem geteilten Tablet auch den nächsten
       Kollegen aussperren. `demo-ich` ist das Konto der Vorführung. */
    const p = await seite(b, 'chef', '1:demo-ich');
    const s = await stand(p);
    pruefe('GEGENPROBE mit gemerktem Stand startet sie NICHT',
      s.auf !== true, JSON.stringify(s).slice(0, 60));
    /* …aber von Hand muss sie kommen. Ein Weg zurück, den es nur auf
       dem Papier gibt, ist keiner. */
    await p.evaluate(() => { const a = document.getElementById('uAvatar'); if (a) a.click(); });
    await p.waitForTimeout(700);
    await p.evaluate(() => { const t = document.querySelector('[data-pmtab="aussehen"]'); if (t) t.click(); });
    await p.waitForTimeout(700);
    const knopf = await p.evaluate(() => !!document.getElementById('pmTour'));
    pruefe('unter Profil → Aussehen steht der Knopf dafür', knopf);
    if (knopf) {
      await p.evaluate(() => document.getElementById('pmTour').click());
      await p.waitForTimeout(1200);
      const n = await stand(p);
      pruefe('und er startet sie wirklich', n.auf === true, JSON.stringify(n).slice(0, 60));
      /* Das Profilfenster muss dabei zugehen — sonst läge es über der
         Führung, und die zeigt auf etwas, das man nicht sieht. */
      pruefe('das Profilfenster ist dabei zu',
        await p.evaluate(() => {
          const m = document.getElementById('profileModal');
          return !m || !m.classList.contains('show');
        }));
    }
    await p.close();
  }

  /* ══ 4. Überspringen geht, und zwar sofort ══ */
  /* ══ Das Tablet am Empfang ══
     Aus dem Betrieb, 22.9.2026: „die führung soll bei jedem einmal
     starten."

     Auf einem geteilten Gerät melden sich nacheinander mehrere Leute
     an — Abmelden ist dort der häufigste Griff überhaupt. Wäre der
     Stand am GERÄT gemerkt, bekäme nur der erste die Führung, und die
     übrigen erführen nie, dass es sie gibt.

     Nachgestellt wird das über die Kontokennung im gemerkten Stand:
     das Gerät hat die Führung schon gesehen — aber für JEMAND
     ANDEREN. Sie muss trotzdem starten.

     Das ist die Gegenprobe zu „mit gemerktem Stand startet sie NICHT"
     eine Zeile weiter oben: beide zusammen zeigen, dass wirklich das
     Konto entscheidet und nicht einfach immer oder nie gestartet
     wird. */
  console.log('\n── Das geteilte Gerät ──');
  {
    const p = await seite(b, 'chef', '1:ein-anderer-kollege');
    pruefe('ein fremder Stand auf demselben Gerät hält sie NICHT auf',
      (await stand(p)).auf === true,
      JSON.stringify(await stand(p)));
    await p.close();
  }

  console.log('\n── Überspringen ──');
  {
    const p = await seite(b, 'mitarbeiter');
    const vor = await stand(p);
    pruefe('GEGENPROBE sie läuft überhaupt', vor.auf === true);
    await p.evaluate(() => document.getElementById('tourWeg').click());
    await p.waitForTimeout(500);
    pruefe('„Überspringen" schliesst sie im ersten Schritt',
      !(await stand(p)).auf);
    /* Und der Stand ist gemerkt: wer sie wegtippt, will sie beim
       nächsten Öffnen nicht wiedersehen. */
    pruefe('der Stand ist gemerkt — mit Kontokennung',
      await p.evaluate(() => localStorage.getItem('kf_tour') === '1:demo-ich'),
      await p.evaluate(() => String(localStorage.getItem('kf_tour'))));
    /* Und am KONTO, nicht nur am Gerät. Das ist der Unterschied, der
       auf dem Tablet am Empfang zählt. */
    pruefe('und am Konto selbst',
      await p.evaluate(() => new Promise(r => {
        window.firebase.firestore().collection('users').doc('demo-ich').get()
          .then(d => r(Number((d.data() || {}).tourGesehen || 0)))
          .catch(() => r(-1));
      })) === 1,
      'tourGesehen am Konto');
    await p.close();
  }

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Die Führung läuft einmal, zeigt auf Wirkliches, verdeckt es nicht ' +
      'und lässt sich wiederholen — ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
