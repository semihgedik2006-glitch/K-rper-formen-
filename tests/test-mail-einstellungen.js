/* ── Welche Mails will ich? ────────────────────────────────────────────
   Aus dem Betrieb: „nicht JEDER Chef soll jede Mail zu jedem Thema
   bekommen, und man soll das selber ausschalten können."

   Bei 14 Studios heißt „Studio fertig" bis zu 14 Mails am Tag — an
   jeden Chef.

   Was hier wirklich geprüft wird:

     1. Was beim Umschalten in die Datenbank geht. Ein Schalter, der nur
        die Farbe wechselt, ist die schlechtere Version von gar keinem.
     2. Dass die Liste die ABGESCHALTETEN Themen nennt. Andersherum
        bekäme nach dem Ausrollen niemand mehr etwas, bis alle Konten
        von Hand nachgepflegt sind.
     3. Dass Gerät und Konto sichtbar getrennt sind. Der Push-Schalter
        gilt je Gerät, die Mail je Konto — hält man das für dasselbe,
        stellt man das Falsche ab.
     4. Dass ein Mitarbeiter nicht Schalter für Mails sieht, die nur
        Chefs bekommen.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
const pruefe = (b, m) => { if (!b) errs.push(m); };

async function seite(b, stub) {
  const p = await b.newPage({ viewport: { width: 430, height: 900 } });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript({ path: path.join(SP, stub) });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2600);
  await p.evaluate(async () => {
    document.getElementById('uAvatar').click();
    await new Promise(r => setTimeout(r, 500));
    document.querySelector('[data-pmtab="melden"]').click();
    await new Promise(r => setTimeout(r, 700));
  });
  return p;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  // ══ 1. Verwaltung sieht alle drei Sorten ══
  {
    const p = await seite(b, 'stub-chef.js');
    const r = await p.evaluate(() => ({
      schalter: [...document.querySelectorAll('#mailOpts [data-mk]')]
        .map(x => x.getAttribute('data-mk')),
      an: [...document.querySelectorAll('#mailOpts [data-mk]')]
        .filter(x => x.querySelector('.sw').classList.contains('on'))
        .map(x => x.getAttribute('data-mk')),
      ueberschriften: [...document.querySelectorAll('#pmPaneMelden .mail-kopf h4')]
        .map(x => x.textContent.trim()),
      geraeteSchalter: document.querySelectorAll('#notifyOpts [data-nk]').length,
      stand: (document.getElementById('mailState') || {}).textContent || ''
    }));
    console.log('Schalter:', JSON.stringify(r.schalter));
    console.log('An:', JSON.stringify(r.an), '·', JSON.stringify(r.stand));
    console.log('Überschriften:', JSON.stringify(r.ueberschriften));

    ['aufgabe', 'fertig', 'bericht'].forEach(k => {
      pruefe(r.schalter.indexOf(k) >= 0, 'FEHLT: der Schalter „' + k + '"');
    });
    /* Vorgabe: alles an. Wäre es andersherum, verstummte die App nach
       dem Ausrollen für alle. */
    pruefe(r.an.length === r.schalter.length,
      'VORGABE: nur ' + r.an.length + ' von ' + r.schalter.length +
      ' Sorten stehen auf an — ohne Zutun muss alles ankommen wie bisher');
    /* Gerät und Konto sichtbar getrennt. */
    pruefe(r.ueberschriften.length === 2,
      'TRENNUNG: ' + r.ueberschriften.length + ' Überschriften statt 2 — ' +
      'ohne sie hält man den Push-Schalter für den Mail-Schalter');
    pruefe(/Gerät/i.test(r.ueberschriften.join(' ')) && /E-Mail/i.test(r.ueberschriften.join(' ')),
      'TRENNUNG: die Überschriften lauten ' + JSON.stringify(r.ueberschriften));
    pruefe(r.geraeteSchalter > 0,
      'WEG: die Geräte-Schalter sind verschwunden (' + r.geraeteSchalter + ')');

    // ══ 2. Umschalten: WAS wird geschrieben? ══
    const um = await p.evaluate(async () => {
      window.__schreib = [];
      document.querySelector('#mailOpts [data-mk="fertig"]').click();
      await new Promise(r => setTimeout(r, 450));
      const nachEins = window.__schreib.slice();
      document.querySelector('#mailOpts [data-mk="bericht"]').click();
      await new Promise(r => setTimeout(r, 450));
      const nachZwei = window.__schreib.slice();
      // Wieder einschalten
      document.querySelector('#mailOpts [data-mk="fertig"]').click();
      await new Promise(r => setTimeout(r, 450));
      return {
        nachEins, nachZwei, alle: window.__schreib,
        anJetzt: [...document.querySelectorAll('#mailOpts [data-mk]')]
          .filter(x => x.querySelector('.sw').classList.contains('on'))
          .map(x => x.getAttribute('data-mk')),
        stand: (document.getElementById('mailState') || {}).textContent || ''
      };
    });
    console.log('Geschrieben:', JSON.stringify(um.alle.map(w => w.daten)));
    console.log('Jetzt an:', JSON.stringify(um.anJetzt), '·', JSON.stringify(um.stand));

    const w1 = um.nachEins[0];
    if (!w1) errs.push('NICHT GESPEICHERT: das Umschalten schreibt nichts');
    else {
      pruefe(/users\//.test(w1.pfad),
        'FALSCHES ZIEL: geschrieben wurde nach „' + w1.pfad + '"');
      pruefe(Array.isArray(w1.daten.mailAus) &&
             w1.daten.mailAus.length === 1 && w1.daten.mailAus[0] === 'fertig',
        'INHALT: geschrieben wurde ' + JSON.stringify(w1.daten) +
        ' — erwartet mailAus:["fertig"]');
    }
    const w2 = um.nachZwei[um.nachZwei.length - 1];
    if (w2) {
      pruefe(w2.daten.mailAus.length === 2 &&
             w2.daten.mailAus.indexOf('bericht') >= 0,
        'ZWEITER SCHALTER: geschrieben wurde ' + JSON.stringify(w2.daten.mailAus));
    }
    const w3 = um.alle[um.alle.length - 1];
    if (w3) {
      pruefe(w3.daten.mailAus.indexOf('fertig') < 0,
        'WIEDER EIN: nach dem Zurückschalten steht „fertig" noch in ' +
        JSON.stringify(w3.daten.mailAus));
    }
    pruefe(um.anJetzt.indexOf('fertig') >= 0 && um.anJetzt.indexOf('bericht') < 0,
      'ANZEIGE: die Schalter zeigen ' + JSON.stringify(um.anJetzt) +
      ' — erwartet fertig an, bericht aus');
    pruefe(/abgeschaltet/.test(um.stand),
      'STAND: die Zeile darunter sagt ' + JSON.stringify(um.stand));
    await p.close();
  }

  /* ══ 3. GEGENPROBE über die Rolle ══
     „Studio fertig" und „Monatsbericht" gehen nur an Chefs. Einem
     Mitarbeiter einen Schalter dafür zu zeigen, verspricht etwas, das
     ohnehin nie passiert. */
  {
    const p = await seite(b, 'stub-mitarbeiter.js');
    const r = await p.evaluate(() => ({
      schalter: [...document.querySelectorAll('#mailOpts [data-mk]')]
        .map(x => x.getAttribute('data-mk')),
      geraet: document.querySelectorAll('#notifyOpts [data-nk]').length
    }));
    console.log('Mitarbeiter sieht:', JSON.stringify(r.schalter));
    pruefe(r.schalter.indexOf('aufgabe') >= 0,
      'MITARBEITER: „Neue Aufgabe" fehlt — die bekommt er sehr wohl');
    pruefe(r.schalter.indexOf('fertig') < 0 && r.schalter.indexOf('bericht') < 0,
      'MITARBEITER: er sieht Schalter für Chef-Mails (' + r.schalter.join(', ') +
      ') — die bekommt er nie, der Schalter verspricht also nichts');
    pruefe(r.geraet > 0, 'MITARBEITER: gar keine Geräte-Schalter mehr');
    await p.close();
  }

  await b.close();
  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Mail-Einstellungen: Vorgabe ist alles an, das Abschalten landet als ' +
      'mailAus in der Datenbank, Gerät und Konto sind getrennt, und ein ' +
      'Mitarbeiter sieht nur seine Sorte');
  process.exit(errs.length ? 1 : 0);
})();
