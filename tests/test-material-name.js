/* ── Artikelnamen in der Materialliste ändern ─────────────────────────
   Aus dem Betrieb: „es ist voll der Film, wenn man sich verschrieben
   hat." Bis zum 18.8. stand der Name als reiner Text in der Zeile;
   bedienbar waren nur die drei Zahlen und das Löschkreuz. Wer sich
   vertippt hatte, musste die Zeile löschen und neu anlegen — und verlor
   dabei Soll- und Ist-Bestand.

   Was hier wirklich geprüft wird, sind vier Dinge, bei denen ein Fehler
   teuer wäre:

     1. Der neue Name wird GESPEICHERT — nicht nur im Feld angezeigt.
        Ein Feld, das beim nächsten Laden wieder den alten Namen zeigt,
        ist schlimmer als gar keins.
     2. Die Zahlen bleiben stehen. Wäre das nicht so, hätte das
        Umbenennen denselben Preis wie Löschen-und-neu-Anlegen, und der
        ganze Umbau wäre umsonst.
     3. Ein leerer Name wird abgewiesen. Ein Artikel ohne Namen ist
        keiner, und in einer Liste mit zwanzig Zeilen findet man ihn nie
        wieder.
     4. Wer nicht löschen darf, darf auch nicht umbenennen. Ein
        umbenannter Artikel betrifft alle im Studio.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];

async function seite(b, stub) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript({ path: path.join(SP, stub) });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2600);
  await p.evaluate(async () => {
    const g = document.querySelector('.mobnav [data-group="g-arbeit"]');
    if (g) g.click();
    await new Promise(r => setTimeout(r, 300));
    const t = document.querySelector('[data-subview="material"]');
    if (t) t.click();
    await new Promise(r => setTimeout(r, 900));
  });
  return p;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  // ══ 1. Verwaltung: umbenennen, und die Zahlen bleiben ══
  {
    const p = await seite(b, 'stub-chef.js');
    const r = await p.evaluate(async () => {
      window.__schreib = [];
      const feld = document.querySelector('input.mat-name-inp');
      if (!feld) return { keinFeld: true };
      const zeile = feld.closest('.mat-row');
      const zahlenVorher = [...zeile.querySelectorAll('input.num')].map(i => i.value);
      const alt = feld.value;

      /* focus() vor blur(): ein Feld, das nie den Fokus hatte, feuert
         beim blur() gar nichts. Diese Runde war deshalb zuerst rot und
         hat einen Fehler im Durchlauf gemeldet, nicht in der App. */
      feld.focus();
      feld.value = 'Handtücher gross';
      feld.dispatchEvent(new Event('input', { bubbles: true }));
      feld.blur();
      await new Promise(r => setTimeout(r, 700));

      const zeileJetzt = document.querySelector('input.mat-name-inp').closest('.mat-row');
      return {
        alt,
        imFeld: document.querySelector('input.mat-name-inp').value,
        zahlenVorher,
        zahlenNachher: [...zeileJetzt.querySelectorAll('input.num')].map(i => i.value),
        schreib: window.__schreib,
        anzahl: document.querySelectorAll('.mat-row').length
      };
    });

    if (r.keinFeld) {
      errs.push('FEHLT: die Verwaltung sieht kein Eingabefeld für den Artikelnamen');
    } else {
      console.log('Umbenannt:', JSON.stringify(r.alt), '→', JSON.stringify(r.imFeld));
      console.log('Zahlen:', JSON.stringify(r.zahlenVorher), '→', JSON.stringify(r.zahlenNachher));
      console.log('Geschrieben:', JSON.stringify(r.schreib).slice(0, 220));

      pruefe(r.imFeld === 'Handtücher gross',
        'FELD: nach dem Verlassen steht ' + JSON.stringify(r.imFeld) + ' drin');
      /* Der eigentliche Punkt: WIRD es gespeichert? Ein Feld, das nur
         anzeigt, wäre die schlechtere Version von vorher. */
      const geschrieben = JSON.stringify(r.schreib);
      pruefe(/Handtücher gross/.test(geschrieben),
        'NICHT GESPEICHERT: der neue Name taucht in keinem Schreibvorgang auf — ' +
        'beim nächsten Laden stünde wieder der alte da');
      pruefe(JSON.stringify(r.zahlenVorher) === JSON.stringify(r.zahlenNachher),
        'ZAHLEN WEG: aus ' + JSON.stringify(r.zahlenVorher) + ' wurde ' +
        JSON.stringify(r.zahlenNachher) + ' — dann kostet Umbenennen so viel ' +
        'wie Löschen und neu anlegen, und der Umbau war umsonst');
      pruefe(r.anzahl > 1, 'ZEILEN: nur noch ' + r.anzahl + ' Zeilen nach dem Umbenennen');
    }

    // ══ 2. GEGENPROBE: leerer Name wird abgewiesen ══
    const leer = await p.evaluate(async () => {
      window.__schreib = [];
      const feld = document.querySelector('input.mat-name-inp');
      const vorher = feld.value;
      feld.focus();
      feld.value = '   ';
      feld.dispatchEvent(new Event('input', { bubbles: true }));
      feld.blur();
      await new Promise(r => setTimeout(r, 600));
      return {
        vorher,
        imFeld: document.querySelector('input.mat-name-inp').value,
        schreibVorgaenge: window.__schreib.length
      };
    });
    console.log('Leerer Name → Feld:', JSON.stringify(leer.imFeld),
      '· Schreibvorgänge:', leer.schreibVorgaenge);
    pruefe(leer.imFeld === leer.vorher,
      'LEER ÜBERNOMMEN: das Feld steht auf ' + JSON.stringify(leer.imFeld) +
      ' statt zurück auf ' + JSON.stringify(leer.vorher));
    pruefe(leer.schreibVorgaenge === 0,
      'LEER GESPEICHERT: ein Artikel ohne Namen wurde geschrieben (' +
      leer.schreibVorgaenge + ' Vorgänge)');

    // ══ 3. Escape stellt den alten Namen wieder her ══
    const esc = await p.evaluate(async () => {
      const feld = document.querySelector('input.mat-name-inp');
      const vorher = feld.value;
      feld.focus();
      feld.value = 'Aus Versehen getippt';
      feld.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await new Promise(r => setTimeout(r, 400));
      return { vorher, imFeld: document.querySelector('input.mat-name-inp').value };
    });
    console.log('Escape →', JSON.stringify(esc.imFeld));
    pruefe(esc.imFeld === esc.vorher,
      'ESCAPE: das Feld steht auf ' + JSON.stringify(esc.imFeld) +
      ' statt zurück auf ' + JSON.stringify(esc.vorher));

    await p.close();
  }

  /* ══ 4. GEGENPROBE über die Rolle ══
     Ein Mitarbeiter darf Bestände zählen, aber keinen Artikel umbenennen
     — das betrifft alle im Studio. Ohne diese Runde wäre der Durchlauf
     auch dann grün, wenn das Feld für jeden bedienbar wäre. */
  {
    const p = await seite(b, 'stub-mitarbeiter.js');
    const r = await p.evaluate(() => ({
      felder: document.querySelectorAll('input.mat-name-inp').length,
      textNamen: document.querySelectorAll('div.mat-name').length,
      zahlenfelder: document.querySelectorAll('.mat-row input.num').length
    }));
    console.log('Mitarbeiter:', JSON.stringify(r));
    pruefe(r.felder === 0,
      'GEGENPROBE: ein Mitarbeiter sieht ' + r.felder + ' Namensfelder — ' +
      'umbenennen betrifft alle im Studio und ist Sache der Verwaltung');
    pruefe(r.textNamen > 0, 'MESSUNG LEER: der Mitarbeiter sieht überhaupt keine Namen');
    pruefe(r.zahlenfelder > 0,
      'ZU VIEL GESPERRT: der Mitarbeiter kann auch keine Bestände mehr eintragen');
    await p.close();
  }

  await b.close();
  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Materialliste: die Verwaltung benennt um, die Zahlen bleiben stehen, ' +
      'leer wird abgewiesen — und ein Mitarbeiter kann es nicht');
  process.exit(errs.length ? 1 : 0);
})();

function pruefe(bedingung, meldung) { if (!bedingung) errs.push(meldung); }
