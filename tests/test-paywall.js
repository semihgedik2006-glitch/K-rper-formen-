/* ══════════════════════════════════════════════════════════════════════
   DIE PAYWALL IN DER OBERFLAECHE

   Die GRENZE steht in firestore.rules und ist dort geprueft
   (tests/rules/abo-sperre.test.js, 42 Zusicherungen). Hier geht es um
   das andere Stueck: ob die App einem Menschen sagt, was los ist.

   Das ist kein Beiwerk. Eine App, die stillschweigend nichts mehr
   speichert, halten die Leute fuer kaputt — und dann ruft nicht der
   Chef beim Betreiber an, sondern das ganze Studio beim Chef.

   GEPRUEFT WIRD UEBER DEN ECHTEN WEG: die Zugriffsstufe kommt aus
   config/zugriff, so wie im Betrieb auch, nur dass sie in der Demo aus
   der Adresse geseedet wird. Die App laeuft in einer Kapsel, ihre
   Funktionen sind von aussen nicht aufrufbar — und das ist gut so: ein
   Durchlauf, der Innereien anfasst, prueft die Funktion und nicht den
   Weg, den ein Mensch nimmt.

   Geprueft wird vor allem, WER WAS ZU LESEN BEKOMMT:
     · das Team: „das liegt nicht an dir"
     · der Chef: was zu tun ist, und ein Weg dorthin
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

/* Die Startseite hat keinen „Neu"-Knopf — der steht bei den Aufgaben.
   Ohne diesen Schritt prueft „die Knoepfe sind weg" nichts, weil dort
   ohnehin keiner waere. */
async function zuDenAufgaben(p) {
  await p.evaluate(() => {
    const b = document.querySelector('.mobnav [data-group="g-arbeit"]') ||
              document.querySelector('.mn-reihe [data-group="g-arbeit"]') ||
              document.querySelector('[data-view="todos"]');
    if (b) b.click();
  });
  await p.waitForTimeout(700);
}

async function zustand(p) {
  return await p.evaluate(() => {
    const l = document.getElementById('aboLeiste');
    const t = document.getElementById('aboLeisteText');
    const k = document.getElementById('aboLeisteKnopf');
    return {
      leiste: !!(l && !l.hidden && l.getClientRects().length > 0),
      text: t ? t.textContent.trim() : '',
      knopf: !!(k && !k.hidden && k.getClientRects().length > 0),
      klasse: document.body.classList.contains('nurlesen'),
      plus: [...document.querySelectorAll('.kopf-plus')]
              .some(e => e.getClientRects().length > 0),
    };
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const fehlerAlle = [];

  async function seite(rolle, abo) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    p.on('pageerror', e => fehlerAlle.push(rolle + '/' + abo + ': ' + e.message.slice(0, 120)));
    await p.goto(APP + '?demo=' + rolle + (abo ? '&abo=' + abo : ''),
      { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(4200);
    await zuDenAufgaben(p);
    return p;
  }

  for (const rolle of ['chef', 'mitarbeiter']) {
    console.log('\n── Rolle: ' + rolle + ' ──');

    /* ── 1. Ohne Sperre ist nichts zu sehen ──
       Die Gegenprobe zu allem Folgenden. Waere die Leiste immer da,
       waeren die Pruefungen unten auch bei einer kaputten Funktion
       gruen. */
    let p = await seite(rolle, null);
    const aus = await zustand(p);
    pruefe('ohne Sperre: keine Leiste', !aus.leiste);
    pruefe('ohne Sperre: keine Körperklasse', !aus.klasse);
    pruefe('GEGENPROBE es gibt überhaupt „Neu"-Knöpfe zu verstecken', aus.plus,
      'sonst prüft „die Knöpfe sind weg" weiter unten nichts');
    await p.close();

    /* ── 2. nurlesen ── */
    p = await seite(rolle, 'nurlesen');
    const nl = await zustand(p);
    pruefe('nurlesen: die Leiste steht da', nl.leiste);
    pruefe('nurlesen: Körperklasse gesetzt', nl.klasse);
    pruefe('nurlesen: „Neu"-Knöpfe sind weg', !nl.plus,
      'ein Formular, das beim Absenden scheitert, ist die schlechteste Variante');

    if (rolle === 'chef') {
      pruefe('Chef: erfährt, dass sich nichts ändern lässt',
        /nichts anlegen oder ändern/i.test(nl.text), nl.text);
      pruefe('Chef: bekommt einen Weg zum Abo', nl.knopf);
    } else {
      /* Der wichtigste Satz der ganzen Leiste. */
      pruefe('Team: „das liegt nicht an dir"',
        /liegt nicht an dir/i.test(nl.text), nl.text);
      pruefe('Team: bekommt KEINEN Weg zur Kasse', !nl.knopf,
        'ein Knopf, den er nicht drücken darf, ist eine Sackgasse');
      pruefe('Team: erfährt NICHT, dass eine Zahlung offen ist',
        !/zahlung|rechnung|mahn|euro|€/i.test(nl.text),
        'drei Wochen lang merkt das Team nichts — das ist die Entscheidung, ' +
        'und sie darf nicht an der Leiste scheitern: ' + nl.text);
    }
    await p.close();

    /* ── 3. zu ── */
    p = await seite(rolle, 'zu');
    const zu = await zustand(p);
    pruefe('zu: die Leiste steht da', zu.leiste);
    pruefe('zu: der Text ist ein anderer als bei nurlesen',
      zu.text !== nl.text && zu.text.length > 0,
      'sonst ist die Unterscheidung nur behauptet');
    pruefe('zu: von „stillgelegt" ist die Rede',
      /stillgelegt/i.test(zu.text), zu.text);
    await p.close();
  }

  /* ── 4. Die Abo-Karte beim Chef ──
     Hier und NUR hier steht ein Betrag. Dass sie beim Mitarbeiter
     nicht auftaucht, ist die Zusicherung: was ein Betrieb zahlt, geht
     eine Aushilfe nichts an. */
  console.log('\n── Die Abo-Karte ──');
  for (const rolle of ['chef', 'mitarbeiter']) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    p.on('pageerror', e => fehlerAlle.push('karte/' + rolle + ': ' + e.message.slice(0, 120)));
    await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(4200);

    /* Derselbe Weg, den ein Mensch nimmt — und im neuen Design ist das
       NICHT die untere Leiste: der Verwaltungsbereich steht dort nicht
       mehr, man erreicht ihn über das Verzeichnis „Alles". Genau
       deshalb steht hier kein fester Selektor, sondern beide Wege. */
    const da = await p.evaluate(async () => {
      const warte = (ms) => new Promise(r => setTimeout(r, ms));
      let nav = document.querySelector('.mobnav [data-group="g-chef"]');
      if (nav) { nav.click(); await warte(700); }
      else {
        const griff = document.getElementById('bereichKopf');
        if (!griff) return { erreichbar: false };
        griff.click();
        await warte(400);
        const z = document.querySelector('#allesLadeInhalt [data-alles="chef"]');
        if (!z) { griff.click(); return { erreichbar: false }; }
        z.click();
        await warte(800);
      }
      const sys = document.querySelector('#chefHome [data-cgo="system"]');
      if (sys) { sys.click(); await warte(700); }
      const k = document.getElementById('aboKarte');
      return {
        erreichbar: true,
        sichtbar: !!(k && k.getClientRects().length > 0),
        text: k ? k.textContent.replace(/\s+/g, ' ').trim() : '',
      };
    });

    if (rolle === 'chef') {
      pruefe('Chef: die Abo-Karte ist da', da.erreichbar && da.sichtbar);
      pruefe('Chef: sie sagt, dass bei Stripe gezahlt wird',
        /stripe/i.test(da.text || ''), (da.text || '(nicht gefunden)').slice(0, 120));
      pruefe('Chef: sie sagt, dass keine Kartendaten erfasst werden',
        /kartendaten/i.test(da.text));
    } else {
      /* Der Mitarbeiter kommt gar nicht erst in den Bereich — genau
         das ist richtig. Kommt er doch hinein, darf die Karte nicht
         dastehen. */
      pruefe('Team: keine Abo-Karte zu sehen',
        !da.erreichbar || !da.sichtbar,
        'dort stünde der Betrag, den der Betrieb zahlt');
    }
    await p.close();
  }

  console.log('\n── Skriptfehler ──');
  pruefe('keine Skriptfehler in allen Durchgängen', fehlerAlle.length === 0,
    fehlerAlle.join(' | '));

  await b.close();
  console.log('\n' + (schlecht ? '✗ ' + schlecht + ' Fehler, ' : '✓ alles grün, ') +
    gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
