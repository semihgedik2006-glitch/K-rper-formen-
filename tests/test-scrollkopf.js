/* ── Die Kopfzeile darf beim Scrollen nicht flackern ──────────────────
   Aus dem Betrieb gemeldet: „manchmal kommt beim Scrollen so eine buggy
   Animation".

   Es war eine Rückkopplung. Die Kopfzeile liegt AUSSERHALB des
   Scroll-Bereichs; schrumpft sie, wird der Bereich höher, und damit
   sinkt der größte mögliche scrollTop. Bei knapp scrollbarem Inhalt
   fiel er dadurch unter die Schwelle, die Marke ging wieder weg, der
   Kopf wuchs, scrollTop stieg wieder darüber — und von vorn.

   Gemessen am 18.8., vor dem Fix:

       Kopf gibt beim Schrumpfen 43 Pixel her
       44 px Überhang  →  21 Wechsel in gut einer Sekunde

   Die Bremse in bindShrinkHeaders(): schrumpfen nur, wenn danach noch
   genug Weg übrig bleibt (gibtHer + 28). Auf einer Seite, die ohnehin
   kaum scrollt, bringt das Schrumpfen auch nichts.

   Dieser Durchlauf misst beide Seiten:
     - unter der Schwelle darf sich NICHTS bewegen
     - darüber MUSS es sich bewegen, sonst hätte ich die Bremse einfach
       zu scharf gestellt und die Funktion damit abgeschafft
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2600);

  const mess = await p.evaluate(async () => {
    const area = document.querySelector('#view-home .scroll-area');
    const head = document.querySelector('#view-home .view-head.shrink');
    if (!area || !head) return { fehlt: true };

    // Wie viel gibt der Kopf her? Ohne Übergang messen.
    head.classList.add('ohne-uebergang');
    head.classList.remove('tight');
    const offen = head.offsetHeight;
    head.classList.add('tight');
    const eng = head.offsetHeight;
    head.classList.remove('tight');
    head.offsetHeight;
    head.classList.remove('ohne-uebergang');
    const gibtHer = offen - eng;

    // Eigenen Inhalt einsetzen, damit der Überhang genau steuerbar ist
    const alt = [...area.children];
    alt.forEach(k => { k.dataset.__weg = k.style.display || ''; k.style.display = 'none'; });
    const fueller = document.createElement('div');
    area.appendChild(fueller);

    async function lauf(zielUeberhang) {
      head.classList.remove('tight');
      area.scrollTop = 0;
      fueller.style.height = '0px';
      // Übergang auslaufen lassen, sonst ist clientHeight noch der enge Wert
      await new Promise(r => setTimeout(r, 500));
      fueller.style.height = (area.clientHeight + zielUeberhang) + 'px';
      await new Promise(r => setTimeout(r, 200));
      const echterUeberhang = area.scrollHeight - area.clientHeight;

      let flips = 0, letzter = head.classList.contains('tight');
      const beob = new MutationObserver(() => {
        const jetzt = head.classList.contains('tight');
        if (jetzt !== letzter) { flips++; letzter = jetzt; }
      });
      beob.observe(head, { attributes: true, attributeFilter: ['class'] });
      area.scrollTop = area.scrollHeight;
      for (let i = 0; i < 22; i++) await new Promise(r => setTimeout(r, 45));
      beob.disconnect();
      return { echterUeberhang: Math.round(echterUeberhang), flips,
               tight: head.classList.contains('tight') };
    }

    // Deutlich unter der Schwelle, knapp darunter, deutlich darüber
    const knapp = await lauf(5);
    const drunter = await lauf(Math.max(5, gibtHer - 20));
    const drueber = await lauf(gibtHer + 220);

    fueller.remove();
    alt.forEach(k => { k.style.display = k.dataset.__weg; delete k.dataset.__weg; });
    return { gibtHer, knapp, drunter, drueber, schwelle: gibtHer + 28 };
  });

  if (mess.fehlt) {
    errs.push('FEHLT: #view-home hat keinen Scroll-Bereich mit schrumpfender Kopfzeile');
  } else {
    console.log('Kopf gibt her:', mess.gibtHer, 'px · Schwelle:', mess.schwelle, 'px');
    ['knapp', 'drunter', 'drueber'].forEach(k => {
      const z = mess[k];
      console.log('  ' + k.padEnd(8), 'Überhang ' + String(z.echterUeberhang).padStart(4) +
        'px · Wechsel ' + z.flips + ' · tight: ' + z.tight);
    });

    /* Unter der Schwelle: keine einzige Bewegung. Ein Wechsel wäre schon
       zu viel — der Kopf würde beim Loslassen zurückspringen. */
    [['knapp', mess.knapp], ['drunter', mess.drunter]].forEach(([name, z]) => {
      if (z.echterUeberhang > mess.schwelle) {
        errs.push('MESSUNG UNBRAUCHBAR: „' + name + '" hat ' + z.echterUeberhang +
          'px Überhang und liegt damit ÜBER der Schwelle von ' + mess.schwelle);
        return;
      }
      if (z.flips !== 0) {
        errs.push('FLACKERN: bei ' + z.echterUeberhang + 'px Überhang wechselt die ' +
          'Kopfzeile ' + z.flips + '-mal — genau die Rückkopplung, die am 18.8. ' +
          'gemeldet wurde');
      }
      if (z.tight) {
        errs.push('SCHRUMPFT ZU FRÜH: bei nur ' + z.echterUeberhang + 'px Überhang ist ' +
          'die Kopfzeile eng — dann kann scrollTop unter die Schwelle fallen');
      }
    });

    /* GEGENPROBE. Ohne sie wäre der Durchlauf auch dann grün, wenn die
       Bremse so scharf steht, dass die Kopfzeile NIE schrumpft — die
       Funktion wäre stillschweigend abgeschafft. */
    if (mess.drueber.echterUeberhang <= mess.schwelle) {
      errs.push('MESSUNG UNBRAUCHBAR: der lange Fall hat nur ' +
        mess.drueber.echterUeberhang + 'px Überhang');
    } else {
      if (!mess.drueber.tight) {
        errs.push('GEGENPROBE: bei ' + mess.drueber.echterUeberhang + 'px Überhang ' +
          'schrumpft die Kopfzeile gar nicht mehr — die Bremse steht zu scharf ' +
          'und hat die Funktion abgeschafft');
      }
      if (mess.drueber.flips > 2) {
        errs.push('FLACKERN: auch auf der langen Seite wechselt die Kopfzeile ' +
          mess.drueber.flips + '-mal statt einmal');
      }
    }
    if (!mess.gibtHer) {
      errs.push('MESSUNG LEER: die Kopfzeile gibt beim Schrumpfen 0 Pixel her — ' +
        'dann prüft dieser Durchlauf nichts');
    }
  }

  await b.close();
  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Scroll-Kopfzeile: unter der Schwelle bleibt sie ruhig, darüber ' +
      'schrumpft sie — und zwar einmal, nicht wiederholt');
  process.exit(errs.length ? 1 : 0);
})();
