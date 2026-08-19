/* ── Der Berichts-Knopf in der Kopfzeile ──────────────────────────────
   Aus dem Betrieb: „der Knopf soll direkt neben dem Logo stehen sodass
   man ihn immer und direkt klicken kann."

   „Immer" ist der Teil, der leicht kaputtgeht: die Kopfzeile steht über
   allen Ansichten, aber ein Knopf darin kann trotzdem in einer davon
   verschwinden — oder, schlimmer, bei der falschen Rolle auftauchen.

   Was hier wirklich geprüft wird:

     1. Er steht neben der Marke, nicht rechts bei den Werkzeugen, die
        jeder hat.
     2. Er ist aus JEDER Ansicht erreichbar. Ein Knopf, der nur auf der
        Startseite steht, ist kein Knopf in der Kopfzeile.
     3. Nur die Verwaltung sieht ihn — mit Gegenprobe über Leiter UND
        Mitarbeiter. Der Bericht ist serverseitig Chef-Sache; ein
        sichtbarer Knopf, der in eine Fehlermeldung läuft, verspricht
        etwas, das nicht passiert.
     4. Er schickt WAS. Und zwar den zuletzt eingestellten Zeitraum, nicht
        stur 30 Tage — sonst täten zwei Knöpfe für dieselbe Sache
        Verschiedenes.
     5. Er sperrt sich, solange gesendet wird. Ein Bericht, den man
        dreimal antippt, kommt dreimal an.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
const pruefe = (b, m) => { if (!b) errs.push(m); };

async function seite(b, stub, prefs) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  p.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text())) {
      errs.push('KONSOLE: ' + m.text().slice(0, 160));
    }
  });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript({ path: path.join(SP, stub) });
  if (prefs) {
    await p.addInitScript(`try{ localStorage.setItem('kf_prefs', ${JSON.stringify(JSON.stringify(prefs))}); }catch(e){}`);
  }
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2800);
  return p;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  // ══ 1. Verwaltung: da, neben der Marke, in jeder Ansicht ══
  {
    const p = await seite(b, 'stub-chef.js');
    const wo = await p.evaluate(() => {
      const k = document.getElementById('tbBericht');
      if (!k) return { da: false };
      const kb = k.getBoundingClientRect();
      const logo = document.querySelector('.tb-logo').getBoundingClientRect();
      const user = document.querySelector('.tb-user').getBoundingClientRect();
      return {
        da: k.offsetParent !== null,
        /* Er darf NICHT in .tb-brand liegen. Dort stand er zuerst — und
           nahm dem Schriftzug den Platz, weil die Marke unter 520px
           overflow:hidden hat: bei 320 und 390px wurde „STUDIOCHAT"
           abgeschnitten. Geprüft wird deshalb die Absicht (links, beim
           Logo, nicht bei den Werkzeugen), nicht die Verschachtelung. */
        inDerMarke: !!k.closest('.tb-brand'),
        rechtsVomLogo: Math.round(kb.left - logo.right),
        linksVonDenWerkzeugen: kb.right < user.left,
        breite: Math.round(kb.width), hoch: Math.round(kb.height),
        symbol: k.querySelectorAll('svg').length,
        beschriftet: !!(k.getAttribute('aria-label') || '').trim()
      };
    });
    console.log('Verwaltung:', JSON.stringify(wo));
    pruefe(wo.da, 'FEHLT: der Knopf steht nicht in der Kopfzeile');
    pruefe(wo.rechtsVomLogo > 0 && wo.linksVonDenWerkzeugen,
      'PLATZ: er steht nicht links neben der Marke (' + JSON.stringify(wo) + ')');
    pruefe(!wo.inDerMarke,
      'IN DER MARKE: er liegt in .tb-brand — dort nimmt er dem Schriftzug ' +
      'den Platz, und der wird unter 520px abgeschnitten (overflow:hidden)');
    /* Gequetscht war er beim ersten Anlauf: 33px statt 36, weil die
       Marke ein Flex-Behälter ist. Ohne diese Zeile fiele das nicht auf. */
    pruefe(wo.breite >= 36 && wo.hoch >= 36,
      'GEQUETSCHT: ' + wo.breite + 'x' + wo.hoch + ' — die Kopfzeile drückt ' +
      'ihn zusammen (flex:0 0 auto fehlt)');
    pruefe(wo.symbol === 1, 'SYMBOL: ' + wo.symbol + ' statt eines');
    pruefe(wo.beschriftet, 'BESCHRIFTUNG: kein aria-label — ein Symbol allein ' +
      'sagt niemandem, was passiert');

    /* Punkt 2: „immer". Durch alle Gruppen und nachsehen, ob er bleibt. */
    const ueberall = await p.evaluate(async () => {
      const gruppen = [...document.querySelectorAll('.mobnav [data-group]')]
        .map(x => x.getAttribute('data-group'));
      const weg = [];
      for (const g of gruppen) {
        document.querySelector('.mobnav [data-group="' + g + '"]').click();
        await new Promise(r => setTimeout(r, 350));
        const k = document.getElementById('tbBericht');
        if (!k || k.offsetParent === null) weg.push(g);
      }
      return { gruppen, weg };
    });
    console.log('Sichtbar in allen Gruppen:', JSON.stringify(ueberall));
    pruefe(ueberall.gruppen.length >= 5,
      'GRUPPEN: nur ' + ueberall.gruppen.length + ' gefunden — der Durchlauf misst zu wenig');
    pruefe(ueberall.weg.length === 0,
      'NICHT IMMER: der Knopf fehlt in ' + JSON.stringify(ueberall.weg));

    // ══ 4./5. Was schickt er, und sperrt er sich? ══
    const klick = await p.evaluate(async () => {
      window.__aufruf = null;
      const k = document.getElementById('tbBericht');
      k.click();
      // Sofort ein zweites Mal: darf NICHT durchgehen
      const gesperrtSofort = k.disabled === true;
      k.click();
      await new Promise(r => setTimeout(r, 900));
      return { aufruf: window.__aufruf, gesperrtSofort,
        wiederFrei: document.getElementById('tbBericht').disabled !== true,
        toast: (document.getElementById('toast') || {}).textContent || '' };
    });
    console.log('Klick:', JSON.stringify(klick));
    pruefe(klick.aufruf && klick.aufruf.name === 'sendTestReport',
      'KLICK: es wird nicht sendTestReport gerufen (' + JSON.stringify(klick.aufruf) + ')');
    pruefe(klick.aufruf && klick.aufruf.data && klick.aufruf.data.tage === 30,
      'VORGABE: geschickt wurden ' + JSON.stringify(klick.aufruf && klick.aufruf.data) +
      ' — ohne gemerkte Einstellung sind 30 Tage erwartet');
    pruefe(klick.gesperrtSofort,
      'DOPPELT: der Knopf sperrt sich nicht — dreimal getippt heisst drei Mails');
    pruefe(klick.wiederFrei,
      'HAENGT: der Knopf bleibt nach dem Senden gesperrt');
    /* Die Rückmeldung nennt den Zeitraum. Der Knopf hat keine Zeile
       unter sich; stünde da nur „gesendet", wüsste niemand, worüber. */
    pruefe(/30 Tage/.test(klick.toast) && /an dich/.test(klick.toast),
      'MELDUNG: „' + klick.toast + '" — erwartet Zeitraum und „an dich"');
    await p.close();
  }

  /* ══ Der gemerkte Zeitraum ══
     Der Knopf oben hat kein eigenes Feld. Nähme er stur 30 Tage, täten
     zwei Knöpfe für dieselbe Sache Verschiedenes. */
  {
    const p = await seite(b, 'stub-chef.js', { berichtTage: 90 });
    const r = await p.evaluate(async () => {
      window.__aufruf = null;
      document.getElementById('tbBericht').click();
      await new Promise(r => setTimeout(r, 900));
      return { aufruf: window.__aufruf,
        toast: (document.getElementById('toast') || {}).textContent || '' };
    });
    console.log('Mit gemerkten 90 Tagen:', JSON.stringify(r));
    pruefe(r.aufruf && r.aufruf.data && r.aufruf.data.tage === 90,
      'GEMERKT: geschickt wurden ' + JSON.stringify(r.aufruf && r.aufruf.data) +
      ' — erwartet die zuletzt eingestellten 90 Tage');

    /* Und die Karte in der Verwaltung muss dasselbe anzeigen. Zwei
       Anzeigen für dieselbe Sache, die sich widersprechen, sind
       schlimmer als eine. */
    const karte = await p.evaluate(async () => {
      document.querySelector('.mobnav [data-group="g-chef"]').click();
      await new Promise(r => setTimeout(r, 600));
      const sys = [...document.querySelectorAll('[data-cgo]')]
        .find(x => x.getAttribute('data-cgo') === 'system');
      if (sys) sys.click();
      await new Promise(r => setTimeout(r, 700));
      const sel = document.getElementById('repTestTage');
      return { wert: sel ? sel.value : null };
    });
    console.log('Karte zeigt:', JSON.stringify(karte));
    pruefe(karte.wert === '90',
      'WIDERSPRUCH: die Karte steht auf „' + karte.wert + '", der Knopf oben ' +
      'schickt 90 Tage');
    await p.close();
  }

  /* ══ GEGENPROBE über die Rolle ══
     Der Bericht ist serverseitig Chef-Sache. Ein sichtbarer Knopf, der
     in „permission-denied" läuft, verspricht etwas, das nicht passiert. */
  for (const stub of ['stub-leiter.js', 'stub-mitarbeiter.js']) {
    const p = await seite(b, stub);
    const r = await p.evaluate(() => {
      const k = document.getElementById('tbBericht');
      return { imMarkup: !!k, sichtbar: !!k && k.offsetParent !== null };
    });
    console.log(stub + ':', JSON.stringify(r));
    pruefe(!r.sichtbar,
      'ROLLE: ' + stub + ' sieht den Berichts-Knopf — den Bericht bekommt ' +
      'diese Rolle nie, der Server weist sie ab');
    await p.close();
  }

  await b.close();
  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Kopfzeile: der Berichts-Knopf steht neben der Marke, ist in jeder ' +
      'Ansicht da, schickt den gemerkten Zeitraum an einen selbst — und nur ' +
      'die Verwaltung sieht ihn');
  process.exit(errs.length ? 1 : 0);
})();
