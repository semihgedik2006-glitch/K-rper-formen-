/* ── Navigation: nichts darf hinter einer Wischbewegung liegen ────────

   AUS DEM BETRIEB GEMELDET, nicht vom Durchlauf gefunden: „die
   Übersicht ist schlecht und nicht organisiert … man muss jede Funktion
   suchen". Nachgemessen als Chef auf einem iPhone:

     · Reiterleiste unter „Betrieb": SECHS Einträge, davon DREI ganz
       sichtbar, 381 Pixel Überhang nach rechts. Material, Geräte,
       Probetraining und Dokumente standen ausserhalb des Bildes.
     · Kanalleiste im Chat: FÜNFZEHN Kanäle, davon DREI sichtbar,
       1107 Pixel Überhang.

   Eine Leiste, die man wischen muss, um zu sehen, WAS es gibt, ist
   keine Navigation, sondern ein Versteck. Genau das prüft diese Datei:

     1. Läuft eine Leiste über, MUSS der Weg ohne Wischen danebenstehen
        — „Alle" bei den Reitern, „Alle Kanäle" bei den Kanälen. Läuft
        sie nicht über, darf der Knopf NICHT da sein: wer zwei Studios
        hat, bekommt keinen Knopf für ein Problem, das er nicht hat.
     2. Die Listen sind vollständig — alle Reiter der Gruppe, und bei
        den Kanälen Studios UND Gruppen. Der Gruppen-Chat lag vorher
        zusätzlich hinter einem eigenen Reiter.

   WARUM NICHT EINFACH UMBRECHEN, was ja alles zeigen würde: der erste
   Versuch tat genau das, und `test-rahmen` wurde rot. Zwei Reiterzeilen
   schoben den Inhalt auf 429px hinunter — schlechter als die 407, wegen
   derer jener Durchlauf geschrieben wurde. Eine Navigation, die alles
   zeigt, indem sie den Inhalt aus dem Bild drückt, hat nichts gewonnen.
   Deshalb prüft diese Datei NICHT „kein Überhang", sondern „kein
   Überhang ohne Ausweg".

   Gemessen wird in der Demo, weil nur dort ein Betrieb mit vierzehn
   Studios steht. Eine Attrappe mit zwei Studios würde den Fall, um den
   es geht, gar nicht erzeugen.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const BREITEN = [[320, 690], [390, 844], [430, 932]];
const ROLLEN = ['chef', 'leiter', 'mitarbeiter'];

(async () => {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  for (const rolle of ROLLEN) {
    for (const [w, h] of BREITEN) {
      const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
      p.on('pageerror', e => errs.push('PAGEERROR ' + rolle + ' ' + w + ': ' + e.message.slice(0, 140)));
      await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(4200);

      const gruppen = await p.evaluate(() =>
        [...document.querySelectorAll('.mobnav [data-group]')]
          .filter(g => g.getClientRects().length)
          .map(g => g.getAttribute('data-group')));

      for (const g of gruppen) {
        await p.evaluate(id => document.querySelector('.mobnav [data-group="' + id + '"]').click(), g);
        await p.waitForTimeout(500);
        const z = await p.evaluate(() => {
          const bar = document.getElementById('subnav');
          if (!bar || getComputedStyle(bar).display === 'none') return null;
          const tabs = [...bar.querySelectorAll('[data-subview]')];
          if (!tabs.length) return null;
          const br = bar.getBoundingClientRect();
          const ganz = tabs.filter(t => {
            const r = t.getBoundingClientRect();
            return r.left >= br.left - 1 && r.right <= br.right + 1;
          });
          const knopf = document.getElementById('subnavMehr');
          return {
            tabs: tabs.length, ganz: ganz.length,
            ueberhang: Math.round(bar.scrollWidth - bar.clientWidth),
            mehrDa: knopf ? !knopf.hidden : false,
            namen: tabs.map(t => (t.textContent || '').trim())
          };
        });
        if (!z) continue;
        const laeuftUeber = z.ueberhang > 4;
        if (laeuftUeber && !z.mehrDa) {
          errs.push(rolle + ' ' + w + 'px · Gruppe ' + g + ': nur ' + z.ganz + ' von ' +
            z.tabs + ' Reitern sichtbar, ' + z.ueberhang + 'px Überhang, und KEIN „Alle" ' +
            '— versteckt: ' + z.namen.slice(z.ganz).join(', '));
        }
        if (!laeuftUeber && z.mehrDa) {
          errs.push(rolle + ' ' + w + 'px · Gruppe ' + g + ': „Alle" steht da, obwohl alle ' +
            z.tabs + ' Reiter ins Bild passen');
        }
        /* Die Liste dahinter muss vollständig sein — sonst ist der
           Ausweg ein Ausweg auf dem Papier. */
        if (laeuftUeber && z.mehrDa && rolle === 'chef' && w === 390) {
          await p.evaluate(() => document.getElementById('subnavMehr').click());
          await p.waitForTimeout(500);
          const liste = await p.evaluate(() => {
            const zs = [...document.querySelectorAll('#bereichListe [data-bereichwahl]')];
            return {
              zeilen: zs.length,
              kleinste: zs.length ? Math.min.apply(null, zs.map(x => Math.round(x.getBoundingClientRect().height))) : 0,
              markiert: zs.filter(x => x.classList.contains('an')).length
            };
          });
          console.log('BEREICHSLISTE ' + g + ':', JSON.stringify(liste));
          if (liste.zeilen !== z.tabs) {
            errs.push('Die Bereichsliste zeigt ' + liste.zeilen + ' von ' + z.tabs + ' Reitern');
          }
          if (liste.kleinste < 44) errs.push('Eine Bereichszeile ist nur ' + liste.kleinste + 'px hoch');
          if (liste.markiert !== 1) errs.push('Der laufende Bereich ist nicht markiert');
          await p.evaluate(() => document.getElementById('bereichClose').click());
          await p.waitForTimeout(300);
        }
      }

      /* ── Der Chat ── */
      /* Seit Runde 103, P5 liegen die Nachrichten im neuen Design unter
         „Alles" — dorthin wie ein Mensch, sonst direkt. */
      await p.evaluate(async () => {
        const k = document.querySelector('.mobnav [data-group="g-komm"]');
        if (k) { k.click(); return; }
        document.querySelector('.mobnav [data-group="g-alles"]').click();
        await new Promise(r => setTimeout(r, 400));
        document.querySelector('#allesSeite [data-alles="chat"]').click();
      });
      await p.waitForTimeout(800);
      const chat = await p.evaluate(() => {
        const bar = document.getElementById('chatChannels');
        const knopf = document.getElementById('kanalAlle');
        if (!bar) return null;
        return {
          kanaele: bar.querySelectorAll('button').length,
          ueberhang: Math.round(bar.scrollWidth - bar.clientWidth),
          knopfDa: knopf ? !knopf.hidden : false
        };
      });
      if (chat) {
        const laeuftUeber = chat.ueberhang > 4;
        if (laeuftUeber && !chat.knopfDa) {
          errs.push(rolle + ' ' + w + 'px: die Kanalleiste läuft um ' + chat.ueberhang +
            'px über, aber „Alle Kanäle" fehlt — ' + chat.kanaele +
            ' Kanäle nur durch Wischen erreichbar');
        }
        if (!laeuftUeber && chat.knopfDa) {
          errs.push(rolle + ' ' + w + 'px: „Alle Kanäle" steht da, obwohl alle ' +
            chat.kanaele + ' Kanäle ins Bild passen');
        }
        if (rolle === 'chef' && w === 390) {
          console.log('CHAT (chef 390):', JSON.stringify(chat));
          /* Die Liste selbst: vollständig, gross genug, und der laufende
             Kanal markiert. */
          if (chat.knopfDa) {
            await p.evaluate(() => document.getElementById('kanalAlle').click());
            await p.waitForTimeout(600);
            const liste = await p.evaluate(() => {
              const zs = [...document.querySelectorAll('#kanalListe [data-kanalwahl]')];
              return {
                zeilen: zs.length,
                arten: [...new Set(zs.map(z => z.dataset.kanalart))].sort(),
                kleinste: Math.min.apply(null, zs.map(z => Math.round(z.getBoundingClientRect().height))),
                markiert: zs.filter(z => z.classList.contains('an')).length,
                gruppen: [...document.querySelectorAll('#kanalListe .kn-gruppe')].map(x => x.textContent)
              };
            });
            console.log('KANALLISTE:', JSON.stringify(liste));
            if (liste.zeilen < chat.kanaele) {
              errs.push('Die Kanalliste zeigt ' + liste.zeilen + ' von ' + chat.kanaele + ' Kanälen');
            }
            if (liste.arten.join(',') !== 'gruppen,studios') {
              errs.push('DIE KANALLISTE ENTHÄLT NICHT BEIDES — Gruppen-Chats lägen ' +
                'weiterhin hinter einem eigenen Reiter: ' + JSON.stringify(liste.arten));
            }
            if (liste.kleinste < 44) {
              errs.push('Eine Kanalzeile ist nur ' + liste.kleinste + 'px hoch');
            }
            if (liste.markiert !== 1) {
              errs.push('Der laufende Kanal ist nicht markiert (' + liste.markiert + ')');
            }
            /* Einen Gruppen-Kanal wählen — das war der gemeldete Fall. */
            const gewaehlt = await p.evaluate(() => {
              const z = [...document.querySelectorAll('#kanalListe [data-kanalwahl]')]
                .find(x => x.dataset.kanalart === 'gruppen');
              if (!z) return null;
              const name = z.textContent.trim(); z.click(); return name;
            });
            await p.waitForTimeout(700);
            const nach = await p.evaluate(() => ({
              zu: getComputedStyle(document.getElementById('kanalModal')).display === 'none',
              aktiv: ((document.querySelector('#chatChannels .chan.active') || {}).textContent || '').trim()
            }));
            console.log('GRUPPE GEWÄHLT:', JSON.stringify({ gewaehlt, ...nach }));
            if (!gewaehlt) errs.push('In der Liste steht kein Gruppen-Kanal');
            else if (!nach.zu) errs.push('Nach der Wahl bleibt das Fenster offen');
            else if (nach.aktiv !== gewaehlt) {
              errs.push('Gewählt wurde „' + gewaehlt + '", offen ist „' + nach.aktiv + '"');
            }
          }
        }
      }
      await p.close();
    }
  }

  await b.close();
  console.log('\nFehler: ' + (errs.length ? '' : 'keine'));
  errs.forEach(e => console.log('  ' + e));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
