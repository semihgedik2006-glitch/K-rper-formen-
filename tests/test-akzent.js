/* ══════════════════════════════════════════════════════════════════════
   DIE FARBE GEHÖRT DEM BEREICH — UND KOMMT ÜBERALL AN

   Aus dem Betrieb, 21.9.2026:
     „wenn home grün ist dann sind auch alle knöpfe grün, wenn man dann
      zu ich wechselt und das rot ist dann werden auch alle knöpfe rot
      und so weiter und das komplett dann im system integriert."

   BEIM NACHMESSEN KAM ZUERST ETWAS ANDERES HERAUS. Die Akzentwahl,
   einen Tag alt, kam an der Hauptfarbe gar nicht an. Gemessen am
   fertig gebauten Knopf, dunkler Modus, Einstellung „Grün":

       --accent    #38BDF8   ← der Wert aus dem Stylesheet
       --accent-2  #22D3EE   ← der Wert aus der Einstellung

   Zwei Ursachen, beide unsichtbar im Code:
     1. markeAnwenden() lief NACH applyPrefs() und räumte --accent
        wieder weg, wenn keine Firmenfarbe gesetzt ist — der Normalfall.
     2. Gesetzt wurde am <html>, aber body.light{} setzt dieselben Namen
        noch einmal. Ein Wert am Vorfahren verliert gegen eine Regel,
        die den Nachfahren trifft.

   Dazu waren --brand (jeder Hauptknopf) und --tipp-* (jeder zweite
   Knopf, 56 von 102) als feste Violett-Cyan-Werte im Stylesheet
   verdrahtet. Wer auf Grün stellte, bekam grüne Ränder und violette
   Knöpfe — also genau den Eindruck, die Einstellung tue nichts.

   Dieser Durchlauf hält vier Dinge fest:
     1. Jeder Bereich hat seine Farbe, und sie steht am fertigen Knopf.
     2. GEGENPROBE: eine fest gewählte Farbe wechselt NICHT mit dem
        Bereich. Ohne diese Zeile wäre der Durchlauf mit einer App grün,
        die einfach immer die Farbe wechselt.
     3. Die Farbe kommt bis in den Verlauf des Hauptknopfes und in die
        getönte Fläche des zweiten — das ist die Stelle, an der sie
        vorher hängen blieb.
     4. Der Text auf der getönten Fläche bleibt lesbar. Die Deckkraft
        .24 ist gemessen, nicht gewählt (bei .30 fällt sie unter 4,5:1);
        wandert der Farbton, muss die Messung mitwandern.
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

/* Die Erwartung steht hier NOCH EINMAL und nicht als Import aus der
   App. Würde sie aus derselben Quelle kommen, prüfte der Durchlauf,
   dass eine Liste sich selbst gleicht. Die Werte sind aus ACCENTS
   abgeschrieben — wer dort etwas ändert, muss hier hinsehen. */
const ERWARTET = {
  'g-start':  { name: 'Start',       dunkel: '#60A5FA', hell: '#1D4ED8' },
  'g-ich':    { name: 'Ich',         dunkel: '#A78BFA', hell: '#6D28D9' },
  'g-komm':   { name: 'Nachrichten', dunkel: '#2DD4BF', hell: '#0F766E' },
  'g-arbeit': { name: 'Aufgaben',    dunkel: '#FB923C', hell: '#C2410C' },
  'g-team':   { name: 'Team',        dunkel: '#F472B6', hell: '#BE185D' },
  'g-chef':   { name: 'Verwaltung',  dunkel: '#94A3B8', hell: '#475569' },
  'g-alles':  { name: 'Alles',       dunkel: '#94A3B8', hell: '#475569' }
};

/* Welche Ansicht steht für welchen Bereich? Gebraucht, weil in der
   unteren Leiste nur vier Bereiche stehen — die übrigen liegen hinter
   „Alles", und dorthin geht man über die Liste, so wie ein Mensch. */
const ANSICHT = {
  'g-start': 'home', 'g-ich': 'ich', 'g-komm': 'chat', 'g-arbeit': 'todos',
  'g-team': 'team', 'g-chef': 'chef', 'g-alles': 'alles'
};

/* Der Weg zu einem Bereich, genau wie ihn jemand geht: erst in der
   unteren Leiste suchen, sonst über „Alles". Kein showView() von
   aussen — das prüfte die Funktion statt den Weg. */
async function zumBereich(p, gruppe) {
  const direkt = await p.evaluate((g) => {
    const k = document.querySelector('.mobnav [data-group="' + g + '"]');
    if (!k) return false;
    k.click(); return true;
  }, gruppe);
  if (direkt) { await p.waitForTimeout(900); return 'Leiste'; }
  await p.evaluate(() => {
    const a = document.querySelector('.mobnav [data-group="g-alles"]');
    if (a) a.click();
  });
  await p.waitForTimeout(700);
  await p.evaluate((v) => {
    const z = document.querySelector('#allesLadeInhalt [data-alles="' + v + '"]') ||
              document.querySelector('[data-alles="' + v + '"]') ||
              document.querySelector('[data-bereichwahl="' + v + '"]');
    if (z) z.click();
  }, ANSICHT[gruppe]);
  await p.waitForTimeout(900);
  return 'Alles-Liste';
}

/* Was am FERTIGEN Bauteil steht, nicht was im Stylesheet gemeint war.
   Der Kontrast wird dabei wirklich gerechnet: die getönte Fläche eines
   Knopfes ist durchsichtig, also wird sie über den ersten undurch-
   sichtigen Vorfahren gelegt und dann erst gemessen. Die Farbe allein
   abzulesen hiesse, den Kontrast zu schätzen. */
async function messen(p) {
  return p.evaluate(() => {
    /* EINE Farbe, egal in welcher Schreibweise.
       Seit dem 21.9.2026 sind --accent & Co. mit @property als FARBE
       angemeldet, damit der Wechsel gleiten kann. Nebenwirkung: der
       Browser gibt sie nicht mehr als „#60A5FA" zurück, sondern als
       „RGB(96, 165, 250)" — mit grossem RGB. Der erste Anlauf verglich
       Zeichenketten und meldete 84 Fehler, die keine waren. Verglichen
       werden deshalb Zahlen, nicht Schreibweisen. */
    function zahlen(s) {
      s = String(s || '').trim();
      const h = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(s);
      if (h) return { r: parseInt(h[1], 16), g: parseInt(h[2], 16), b: parseInt(h[3], 16), a: 1 };
      const m = /rgba?\(([^)]+)\)/i.exec(s);
      if (!m) return null;
      const t = m[1].split(/[,\s/]+/).filter(x => x !== '').map(x => parseFloat(x));
      return { r: t[0], g: t[1], b: t[2], a: t.length > 3 ? t[3] : 1 };
    }
    function alsHex(s) {
      const f = zahlen(s);
      if (!f) return null;
      return '#' + ['r', 'g', 'b'].map(k =>
        ('0' + Math.round(f[k]).toString(16)).slice(-2)).join('').toUpperCase();
    }
    function grund(el) {
      let e = el;
      while (e && e !== document.documentElement) {
        const f = zahlen(getComputedStyle(e).backgroundColor);
        if (f && f.a === 1) return f;
        e = e.parentElement;
      }
      return { r: 255, g: 255, b: 255, a: 1 };
    }
    function drauf(v, u) {
      return { r: v.r * v.a + u.r * (1 - v.a),
               g: v.g * v.a + u.g * (1 - v.a),
               b: v.b * v.a + u.b * (1 - v.a), a: 1 };
    }
    function hell(f) {
      const k = ['r', 'g', 'b'].map(x => {
        const c = f[x] / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
    }
    function kontrast(a, b) {
      const x = hell(a), y = hell(b);
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    }
    /* Ein SICHTBARER Knopf jeder Bauform. Ein Knopf in einem
       geschlossenen Fenster steht im Baum, wird aber nicht gezeichnet —
       er würde hier eine Farbe melden, die niemand sieht. */
    function sichtbar(sel) {
      return [...document.querySelectorAll(sel)].find(e => e.getClientRects().length) || null;
    }
    const prim = sichtbar('.btn-primary');
    const ghost = sichtbar('.btn-ghost');
    const cs = getComputedStyle(document.body);
    const erg = {
      bereich: document.body.getAttribute('data-bereich'),
      ansicht: (document.querySelector('.view.show') || {}).id || null,
      accent: alsHex(cs.getPropertyValue('--accent')),
      brand: cs.getPropertyValue('--brand').trim(),
      tipp1: cs.getPropertyValue('--tipp-1').trim(),
      primVerlauf: prim ? getComputedStyle(prim).backgroundImage : null,
      ghostText: ghost ? getComputedStyle(ghost).color : null,
      ghostFlaeche: ghost ? getComputedStyle(ghost).backgroundColor : null,
      ghostKontrast: null
    };
    if (ghost) {
      const f = drauf(zahlen(getComputedStyle(ghost).backgroundColor), grund(ghost.parentElement));
      erg.ghostKontrast = Math.round(kontrast(zahlen(getComputedStyle(ghost).color), f) * 100) / 100;
    }
    /* Und dieselbe Rechnung OHNE Knopf. Sie muss sein: in fünf von
       sieben Bereichen steht gerade keine zweite Knopfform auf dem
       Bild, und ein Durchlauf, der dort nichts misst, hält sie für
       geprüft. Gerechnet wird dann aus den Werten selbst — --tipp-1
       über der Kartenfläche --bg-2, darauf --accent-d. */
    /* Der Hauptknopf trägt einen VERLAUF. Gemessen wird der schlechtere
       der beiden Haltepunkte — die Schrift liegt über beiden, und ein
       Mittelwert würde die schlechtere Hälfte verstecken.
       --brand ist seit dem 21.9.2026 eine Formel aus zwei Variablen; im
       gerechneten Wert stehen die Haltepunkte deshalb als rgb(…), nicht
       mehr als Hex. */
    const stops = (cs.getPropertyValue('--brand')
      .match(/#[0-9a-f]{6}|rgba?\([^)]+\)/gi) || []);
    const aufAkzent = zahlen(cs.getPropertyValue('--on-accent'));
    erg.primKontrast = (stops.length && aufAkzent)
      ? Math.round(Math.min.apply(null, stops.map(function (h) {
          return kontrast(aufAkzent, zahlen(h));
        })) * 100) / 100
      : null;
    const kartenGrund = zahlen(cs.getPropertyValue('--bg-2'));
    const flaeche = zahlen(cs.getPropertyValue('--tipp-1'));
    const schrift = zahlen(cs.getPropertyValue('--accent-d'));
    erg.tippDeckung = flaeche ? flaeche.a : null;
    erg.tokenKontrast = (kartenGrund && flaeche && schrift)
      ? Math.round(kontrast(schrift, drauf(flaeche, kartenGrund)) * 100) / 100 : null;
    return erg;
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const fehler = [];

  for (const modus of ['dark', 'light']) {
    console.log('\n══ ' + (modus === 'dark' ? 'Dunkler' : 'Heller') + ' Modus ══');
    const p = await b.newPage({ viewport: { width: 390, height: 900 } });
    p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript((m) => {
      localStorage.setItem('kf_prefs', JSON.stringify({ theme: m }));
    }, modus);
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3300);

    /* Ohne gespeicherte Wahl muss „Lebendig" gelten — es ist die
       Voreinstellung, und eine Voreinstellung, die man erst einschalten
       muss, ist keine. */
    const voreingestellt = await p.evaluate(() => {
      try { return (JSON.parse(localStorage.getItem('kf_prefs') || '{}')).accent; }
      catch (e) { return null; }
    });
    pruefe('ohne eigene Wahl gilt „Lebendig"',
      voreingestellt === 'bunt' || voreingestellt === undefined,
      String(voreingestellt));

    const gesehen = [];
    for (const g of Object.keys(ERWARTET)) {
      const weg = await zumBereich(p, g);
      const m = await messen(p);
      const soll = ERWARTET[g][modus === 'dark' ? 'dunkel' : 'hell'];
      gesehen.push(m.accent);
      console.log('  ' + ERWARTET[g].name.padEnd(12) + ' (' + weg.padEnd(12) + ') ' +
        'Bereich ' + String(m.bereich).padEnd(9) + ' Farbe ' + m.accent +
        '  Tönung ' + m.tippDeckung + '  Kontrast ' + m.tokenKontrast +
        ' / Knopf ' + m.primKontrast +
        (m.ghostKontrast === null ? '' : ' (am Knopf ' + m.ghostKontrast + ')'));

      /* Die Rechnung aus den Werten gilt in JEDEM Bereich — auch dort,
         wo gerade kein Knopf dieser Bauform auf dem Bild steht. */
      pruefe('  … Text auf der getönten Fläche über 4,5:1',
        m.tokenKontrast !== null && m.tokenKontrast >= 4.5, String(m.tokenKontrast));
      /* Und der Hauptknopf. Bis zum 21.9.2026 stand dort weisse Schrift
         auf dem Verlauf — im dunklen Modus gemessen 2,14 in der Mitte.
         Ein text-shadow stand als Notbehelf dabei; ein Schatten hebt
         keinen Kontrast, er verdeckt nur, dass einer fehlt. */
      pruefe('  … Schrift auf dem Hauptknopf über 4,5:1',
        m.primKontrast !== null && m.primKontrast >= 4.5, String(m.primKontrast));

      pruefe('„' + ERWARTET[g].name + '" ist wirklich offen',
        m.bereich === g, 'data-bereich=' + m.bereich);
      pruefe('  … und trägt ' + soll, m.accent === soll, m.accent);

      /* DIE STELLE, AN DER ES VORHER HÄNGEN BLIEB: der Verlauf des
         Hauptknopfes und die getönte Fläche des zweiten standen fest
         im Stylesheet. Geprüft wird deshalb, dass die Farbe des
         Bereichs dort wirklich auftaucht. */
      const rgb = (function (hex) {
        const x = /^#(..)(..)(..)$/.exec(hex);
        return 'rgb(' + parseInt(x[1], 16) + ', ' + parseInt(x[2], 16) + ', ' + parseInt(x[3], 16) + ')';
      })(soll);
      const rgbRoh = rgb.replace('rgb(', '').replace(')', '').replace(/, /g, ', ');
      if (m.primVerlauf && m.primVerlauf !== 'none') {
        pruefe('  … und steht im Verlauf des Hauptknopfes',
          m.primVerlauf.indexOf(rgb) >= 0, m.primVerlauf.slice(0, 80));
      }
      if (m.ghostFlaeche) {
        pruefe('  … und in der Fläche des zweiten Knopfes',
          m.ghostFlaeche.indexOf(rgbRoh) >= 0, m.ghostFlaeche);
        pruefe('  … Text darauf bleibt über 4,5:1',
          m.ghostKontrast !== null && m.ghostKontrast >= 4.5,
          String(m.ghostKontrast));
      }
    }

    /* GEGENPROBE 1: sieben Bereiche dürfen nicht alle dieselbe Farbe
       haben — sonst wäre oben jede Zeile grün, weil sich nie etwas
       ändert. Sechs verschiedene, weil „Alles" und „Verwaltung"
       denselben grauen Ton teilen; das steht so in BEREICH_FARBE. */
    const verschieden = [...new Set(gesehen)];
    pruefe('GEGENPROBE die Bereiche tragen wirklich verschiedene Farben',
      verschieden.length === 6, verschieden.join(' '));

    /* ══ Der Wechsel muss GLEITEN ══════════════════════════════════
       „damit es einfach lebendig und interaktiv wirkt" — das ist eine
       Zusage über Bewegung, also wird sie gemessen und nicht behauptet.

       Beim ersten Anlauf sprang die Farbe: eine gewöhnliche
       `transition` auf dem Knopf bringt nichts, wenn sich nur die
       VARIABLE ändert, aus der seine Farbe kommt. Fünf Messpunkte, ein
       einziger Wert. Erst @property macht aus der Eigenschaft eine
       Farbe, die der Browser zwischenrechnen kann.

       Gemessen wird an einem Bauteil, das den Wechsel ÜBERLEBT: die
       Knöpfe in der Ansicht werden beim Wechsel neu gebaut, und ein
       frisch gebautes Element hat keinen Vorzustand, von dem aus es
       gleiten könnte. */
    console.log('  ── Gleitet der Wechsel? ──');
    await zumBereich(p, 'g-start');
    await p.waitForTimeout(700);
    const bewegung = await p.evaluate(async () => {
      const ziel = document.querySelector('.tb-bericht') ||
                   document.querySelector('.demo-bar');
      if (!ziel) return null;
      const f = () => {
        const c = getComputedStyle(ziel);
        return c.backgroundImage !== 'none' ? c.backgroundImage : c.backgroundColor;
      };
      const vor = f();
      /* Putzplan (Orange, Gruppe Betrieb) statt Nachrichten (Teal): seit
         Runde 103, P5 steht der Putzplan unten an genau der Stelle, an
         der die Nachrichten standen. Gemessen wird weiter ein Wechsel
         von Start in einen Bereich anderer Farbe.
         Zuerst mit „Aufgaben" versucht: dort fiel die Probe bei 90 ms in
         einem von drei Läufen VOR das erste Bild — die Aufgaben brauchen
         bis dahin 250–550 ms (CPU ÷4, vor P1 genauso gemessen). Das ist
         kein Sprung der Farbe, sondern eine langsame Seite; sie steht in
         docs/BEKANNTE-PROBLEME.md. Der Putzplan zeichnet in 120–330 ms. */
      const k = document.querySelector('.mobnav [data-group="g-putz"]') ||
                document.querySelector('.nav [data-group="g-putz"]');
      if (!k) return null;
      k.click();
      const proben = []; let letzte = 0;
      for (const t of [90, 180, 700]) {
        await new Promise(r => setTimeout(r, t - letzte)); letzte = t;
        proben.push(f());
      }
      return { vor: vor, proben: proben };
    });
    if (bewegung) {
      console.log('    vorher ' + bewegung.vor.slice(0, 52));
      bewegung.proben.forEach((x, i) => console.log('    ' + [90,180,700][i] + 'ms   ' + x.slice(0, 52)));
      /* Zwischenwerte heisst: bei 90 ms weder der alte noch der neue
         Wert. Genau das war vorher nicht so. */
      pruefe('der Farbwechsel läuft über Zwischenwerte, springt nicht',
        bewegung.proben[0] !== bewegung.vor &&
        bewegung.proben[0] !== bewegung.proben[2],
        bewegung.proben[0].slice(0, 60));
      pruefe('und er ist nach 700 ms angekommen',
        bewegung.proben[1] !== bewegung.proben[2] ||
        bewegung.proben[2] !== bewegung.vor,
        bewegung.proben[2].slice(0, 60));
    } else {
      pruefe('ein Bauteil zum Messen der Bewegung gefunden', false, 'keins');
    }

    /* GEGENPROBE 2: eine FEST gewählte Farbe darf NICHT mitwandern.
       Ohne diese Zeile wäre der Durchlauf auch mit einer App grün, die
       die Einstellung einfach ignoriert und immer bunt macht. */
    await p.evaluate(() => {
      const a = document.getElementById('uAvatar'); if (a) a.click();
    });
    await p.waitForTimeout(700);
    await p.evaluate(() => {
      const t = document.querySelector('[data-pmtab="aussehen"]'); if (t) t.click();
    });
    await p.waitForTimeout(700);
    /* Und weil die Tönung jetzt GERECHNET wird: jede der zehn festen
       Farben einmal durchmessen. Die alte feste .24 war für Cyan
       gemessen; dass sie auch für Pink und Bernstein trägt, hat nie
       jemand nachgesehen — sie tat es nicht. */
    console.log('  ── Alle festen Akzente, Text auf der getönten Fläche ──');
    const akzente = await p.evaluate(() =>
      [...document.querySelectorAll('#accOpts [data-acc]')]
        .map(x => x.dataset.acc).filter(x => x !== 'bunt'));
    for (const k of akzente) {
      await p.evaluate((id) => {
        const el = document.querySelector('#accOpts [data-acc="' + id + '"]');
        if (el) el.click();
      }, k);
      /* 600 ms und nicht 300: der Farbwechsel gleitet seit heute über
         350 ms. Bei 300 ms stand in der Ausgabe einmal #FA923D statt
         #FB923C — ein Zwischenstand, gemessen wie ein Endwert. */
      await p.waitForTimeout(600);
      const m = await messen(p);
      console.log('    ' + k.padEnd(10) + m.accent + '  Tönung ' + m.tippDeckung +
        '  Kontrast ' + m.tokenKontrast + ' / Knopf ' + m.primKontrast);
      pruefe('  Akzent „' + k + '" bleibt über 4,5:1',
        m.tokenKontrast !== null && m.tokenKontrast >= 4.5, String(m.tokenKontrast));
      pruefe('  Akzent „' + k + '": auch der Hauptknopf',
        m.primKontrast !== null && m.primKontrast >= 4.5, String(m.primKontrast));
    }

    await p.evaluate(() => {
      const k = document.querySelector('#accOpts [data-acc="gruen"]'); if (k) k.click();
    });
    await p.waitForTimeout(500);
    await p.evaluate(() => {
      const z = document.getElementById('pmClose') ||
                document.querySelector('#profileModal .modal-x');
      if (z) z.click(); else document.getElementById('profileModal').classList.remove('show');
    });
    await p.waitForTimeout(400);

    const fest = [];
    for (const g of ['g-start', 'g-arbeit', 'g-komm']) {
      await zumBereich(p, g);
      fest.push((await messen(p)).accent);
    }
    console.log('  fest auf Grün: ' + fest.join(' '));
    pruefe('GEGENPROBE eine fest gewählte Farbe bleibt in jedem Bereich gleich',
      new Set(fest).size === 1, fest.join(' '));
    pruefe('GEGENPROBE und es ist wirklich Grün',
      fest[0] === (modus === 'dark' ? '#34D399' : '#047857'), fest[0]);

    await p.close();
  }

  pruefe('keine Skriptfehler', fehler.length === 0, fehler[0]);

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Die Farbe folgt dem Bereich, kommt bis an den Knopf, und eine ' +
      'feste Wahl bleibt fest — ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
