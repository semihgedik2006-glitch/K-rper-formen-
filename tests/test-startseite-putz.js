/* ══════════════════════════════════════════════════════════════════════
   DER PUTZPLAN AUF DER STARTSEITE

   Aus dem Betrieb, 23.9.2026:
     „kannst du noch den putzplan zur startseite hinzufügen."

   Was dieser Durchlauf festhält:
     · der Block steht da und zählt die offenen PUNKTE
     · tägliche Punkte stehen vor wöchentlichen und einmaligen
     · Erledigtes steht nicht drin (Gegenprobe)
     · ein PAUSIERTER Punkt zählt nicht — und ohne Pause zählt er
       (Gegenprobe, sonst prüfte die Zeile nichts)
     · ein Tipp öffnet den Putzplan genau DIESES Studios

   Daten aus tests/stub-mitarbeiter.js, Studio 6:
     c1 Böden wischen       täglich, heute erledigt      → nicht dabei
     c2 Spiegel putzen      wöchentlich, offen           → dabei (ausser pausiert)
     c3 Toiletten reinigen  täglich, offen               → dabei, zuerst
     c4 Fenster putzen      einmalig, vor 30 h erledigt  → nicht dabei
     c5 Lager aufräumen     einmalig, vor 2 h erledigt   → nicht dabei
     c6 Vorhänge waschen    einmalig, offen              → dabei
   Der Mitarbeiter hat EIN Studio — also die Form fürs Empfangstablet:
   die Punkte selbst, einer je Zeile. (Der erste Entwurf dieses Tests
   nahm zwei Studios an und erwartete die Form der Leitung; die App
   hatte recht, die Annahme nicht.) Die Form der Leitung prüft
   test-startseite-offen mit dem Chef-Konto der Demo mit.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

async function starte(b, pause) {
  const p = await b.newPage({ viewport: { width: 430, height: 950 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  if (pause) {
    await p.addInitScript((bis) => { window.__ppPause = { id: 'c2', bis: bis }; }, pause);
  }
  await p.addInitScript({ path: SP + '/stub-mitarbeiter.js' });
  await p.goto(APP + '?neu=1', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3600);
  return { p, fehler };
}

function block(p) {
  return p.evaluate(() => {
    const bl = [...document.querySelectorAll('#heuteListe .heute-block')]
      .find(x => /^Putzplan/.test((x.querySelector('.hk-wort') || {}).textContent || ''));
    if (!bl) return null;
    const kopf = bl.querySelector('.hk-wort').textContent.trim();
    const m = /·\s*(\d+)/.exec(kopf);
    return {
      kopf, zahl: m ? +m[1] : 1,
      zeilen: [...bl.querySelectorAll('.heute-zeile')].map(z => ({
        titel: z.querySelector('.hz-txt b').textContent.trim(),
        unter: z.querySelector('.hz-txt i').textContent.trim(),
        sk: z.getAttribute('data-hsk')
      })),
      text: bl.textContent
    };
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── Ohne Pause ──');
  {
    const { p, fehler } = await starte(b, null);
    const x = await block(p);
    console.log('  ' + JSON.stringify(x && { kopf: x.kopf, zeilen: x.zeilen }));
    pruefe('der Block „Putzplan" steht auf der Startseite', !!x);
    if (x) {
      pruefe('die Überschrift zählt die offenen Punkte (3)', x.zahl === 3, x.kopf);
      pruefe('ein Studio: die Punkte selbst, einer je Zeile',
        x.zeilen.length >= 1 && !/Punkte offen/.test(x.zeilen[0].titel), JSON.stringify(x.zeilen));
      /* Was täglich ist, ist heute fällig — was heute nicht gemacht
         wird, ist morgen schon wieder dran. „Spiegel putzen" ist älter
         angelegt, steht aber dahinter: sortiert wird nach Rhythmus,
         erst dann nach Alter. */
      pruefe('tägliche Punkte stehen vorn, auch vor älteren wöchentlichen',
        x.zeilen[0] && x.zeilen[0].titel === 'Toiletten reinigen' && x.zeilen[0].unter === 'täglich',
        JSON.stringify(x.zeilen[0]));
      pruefe('GEGENPROBE Erledigtes steht nicht drin',
        !/Böden wischen|Fenster putzen|Lager aufräumen/.test(x.text), x.text.slice(0, 120));
      /* Steht darunter weniger, als die Überschrift nennt — sei es von
         vornherein oder weil beim Einpassen gekürzt wurde —, MUSS der
         Weg zum Rest dastehen, mit der Zahl. Der nachträglich
         eingesetzte Ausgang sagte bis zum 23.9.2026 nur „alle ›". */
      if (x.zeilen.length < x.zahl) {
        const l = await p.evaluate(() => {
          const bl = [...document.querySelectorAll('#heuteListe .heute-block')]
            .find(x => /^Putzplan/.test(x.querySelector('.hk-wort').textContent));
          const m = bl && bl.querySelector('.mini-link');
          return m ? { text: m.textContent.trim(), ziel: m.dataset.heute } : null;
        });
        pruefe('gekürzt: „alle 3 ›" steht in der Überschrift',
          !!l && /alle 3/.test(l.text), JSON.stringify(l));
        pruefe('und führt in den Putzplan', !!l && l.ziel === 'putzplan', JSON.stringify(l));
      } else {
        console.log('  (nicht gekürzt — der Ausgang ist hier nicht verlangt)');
      }

      /* Der Tipp. Ohne das Studio landete man im zuletzt geöffneten. */
      const nach = await p.evaluate(() => new Promise(r => {
        const z = document.querySelector('.heute-zeile.putz');
        const sk = z.getAttribute('data-hsk');
        z.click();
        setTimeout(() => r({
          sk,
          view: (document.querySelector('.view.show') || {}).id,
          sel: (document.getElementById('ppStudio') || {}).value,
          titel: [...document.querySelectorAll('.pp-title')].map(t => t.textContent.trim())
        }), 900);
      }));
      pruefe('ein Tipp öffnet den Putzplan', nach.view === 'view-putzplan', nach.view);
      pruefe('und zwar das Studio aus der Zeile', nach.sel === nach.sk && !!nach.sk,
        nach.sel + ' / ' + nach.sk);
      pruefe('dort steht, was die Startseite nannte',
        nach.titel.some(t => /^Toiletten reinigen/.test(t)), nach.titel.join(' | '));
    }
    pruefe('keine Skriptfehler', fehler.length === 0, fehler[0]);
    await p.close();
  }

  console.log('\n── „Spiegel putzen" pausiert bis morgen ──');
  {
    const morgen = new Date(Date.now() + 86400000).toLocaleDateString('sv-SE');
    const { p, fehler } = await starte(b, morgen);
    const x = await block(p);
    console.log('  ' + JSON.stringify(x && { kopf: x.kopf, zeilen: x.zeilen }));
    /* Eine Pause heisst „steht gerade nicht an". Eine Zeile auf der
       Startseite ist eine Aufforderung — beides zusammen wäre ein
       Widerspruch. */
    pruefe('ein pausierter Punkt zählt nicht mit (2 statt 3)', x && x.zahl === 2, x && x.kopf);
    pruefe('und er wird nicht genannt', x && !/Spiegel putzen/.test(x.text), x && x.text.slice(0, 120));
    pruefe('keine Skriptfehler (pausiert)', fehler.length === 0, fehler[0]);
    await p.close();
  }

  await b.close();
  console.log('\n' + (schlecht ? '✗ ' + schlecht + ' Fehler' :
    '✓ Putzplan auf der Startseite: zählt Punkte, täglich zuerst, Pausen nicht, und führt ins richtige Studio — ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})();
