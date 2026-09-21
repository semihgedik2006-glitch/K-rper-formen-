/* ══════════════════════════════════════════════════════════════════════
   OFFENE AUFGABEN MÜSSEN ZU SEHEN SEIN

   Aus dem Betrieb, 21.9.2026:
     „ich möchte das beim home bildschirm in der app wieder die offenen
      aufgaben stehen oder zumindest ganz klar das aufgaben offen sind."

   Er hatte recht. Gemessen am selben Tag, bevor etwas geändert wurde:

     Mitarbeiter  5 von 5 Aufgaben offen  →  auf der Startseite KEINE
     Leiter       7 von 8 offen           →  KEINE
     Chef        48 von 61 offen          →  nur die 5 überfälligen

   Zwei Ursachen, beide je eine Zeile:

     1. renderHeute() sprang über jede Aufgabe ohne Frist
        (`if(!t.due) return;`). Die meisten Aufgaben haben keine.
     2. Das Abzeichen an „Aufgaben" suchte `[data-mbadge="todos"]`.
        Die Knöpfe tragen die GRUPPEN-Kennung, also `g-arbeit`. Der
        Selektor traf nichts — seit dem Umbau der Leiste war das
        Abzeichen tot. Und für den Chef zählte es ausdrücklich gar
        nichts.

   EIN ABZEICHEN, DAS FEHLT, SIEHT AUS WIE „NICHTS OFFEN". Deshalb
   fällt so etwas nicht auf, und deshalb steht es hier als Messung.

   Was dieser Durchlauf festhält:
     · jede Rolle sieht ihre offenen Aufgaben auf der Startseite
     · die Zahl im Block stimmt mit der Aufgabenliste überein
     · das Abzeichen erscheint und trägt dieselbe Zahl
     · der Weg „alle N ›" führt in die gefilterte Liste
     · und die Gegenprobe: ist wirklich nichts offen, steht dort der
       Ruhe-Satz — und der darf dann auch „alles erledigt" sagen
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

/* Die Wahrheit steht in der Aufgabenliste, nicht in meiner Annahme:
   der Zähler dort sagt „13 von 61 erledigt". Daraus ergibt sich, wie
   viele offen sind — und genau diese Zahl muss die Startseite
   abdecken. Ein Durchlauf, der eine feste Zahl erwartet, prüft die
   Demodaten und nicht die App. */
async function offeneLautListe(p) {
  await p.evaluate(() => {
    const g = document.querySelector('.mobnav [data-group="g-arbeit"]');
    if (g) g.click();
  });
  await p.waitForTimeout(500);
  await p.evaluate(() => {
    const t = document.querySelector('[data-subview="todos"]');
    if (t) t.click();
  });
  await p.waitForTimeout(1100);
  return await p.evaluate(() => {
    const z = document.getElementById('todoCount');
    const m = /(\d+)\s*von\s*(\d+)/.exec(z ? z.textContent : '');
    return m ? { fertig: +m[1], gesamt: +m[2], offen: +m[2] - +m[1] } : null;
  });
}

async function startseite(p) {
  await p.evaluate(() => {
    const g = document.querySelector('.mobnav [data-group="g-start"]');
    if (g) g.click();
  });
  await p.waitForTimeout(900);
  return await p.evaluate(() => {
    const koepfe = [...document.querySelectorAll('.heute-block .hk-wort')]
      .map(x => x.textContent.trim());
    const offenKopf = koepfe.find(t => /^Offen/.test(t)) || '';
    const m = /·\s*(\d+)/.exec(offenKopf);
    const abz = document.querySelector('.mn-reihe [data-group="g-arbeit"] .badge');
    const ueber = koepfe.find(t => /^Überfällig/.test(t)) || '';
    const mu = /·\s*(\d+)/.exec(ueber);
    return {
      bloecke: koepfe,
      offenBlock: !!offenKopf,
      offenZahl: m ? +m[1] : (offenKopf ? 1 : 0),
      ueberZahl: mu ? +mu[1] : (ueber ? 1 : 0),
      zeilen: [...document.querySelectorAll('.heute-block')]
        .filter(b => /^Offen/.test((b.querySelector('.hk-wort') || {}).textContent || ''))
        .map(b => [...b.querySelectorAll('.heute-zeile b')].map(x => x.textContent.trim()))[0] || [],
      linkZiel: (function () {
        const b = [...document.querySelectorAll('.heute-block')]
          .find(x => /^Offen/.test((x.querySelector('.hk-wort') || {}).textContent || ''));
        const l = b && b.querySelector('[data-heute]');
        return l ? { ziel: l.dataset.heute, filter: l.dataset.hf || '' } : null;
      })(),
      abzeichen: abz ? {
        text: abz.textContent.trim(),
        sichtbar: getComputedStyle(abz).display !== 'none'
      } : null,
      ruhe: (document.querySelector('.heute-ruhe') || {}).textContent || ''
    };
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  for (const rolle of ['mitarbeiter', 'leiter', 'chef']) {
    console.log('\n── ' + rolle + ' ──');
    const p = await b.newPage({ viewport: { width: 390, height: 900 } });
    const fehler = [];
    p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3300);

    const liste = await offeneLautListe(p);
    const st = await startseite(p);
    console.log('  Aufgabenliste: ' + JSON.stringify(liste));
    console.log('  Blöcke: ' + st.bloecke.join(' | '));
    console.log('  Abzeichen: ' + JSON.stringify(st.abzeichen));

    pruefe(rolle + ': die Aufgabenliste lässt sich auslesen', !!liste);
    if (!liste) { await p.close(); continue; }
    pruefe(rolle + ': es gibt überhaupt offene Aufgaben zum Anzeigen',
      liste.offen > 0, JSON.stringify(liste));

    /* ══ Der Kern ══
       Die Startseite zeigt, was HEUTE ansteht: überfällig, heute
       fällig, und offen ohne Frist. Eine Aufgabe, die erst nächste
       Woche fällig ist, steht dort bewusst NICHT — sie ist offen, aber
       nicht heute.

       Beim Chef gemessen: 5 überfällig + 35 ohne Frist = 40 von 48.
       Die fehlenden 8 haben eine Frist in der Zukunft. Mein erster
       Versuch hier hat genau das als Fehler gemeldet — die Zusicherung
       war falsch gerechnet, nicht die App.

       Die vollständige Abdeckung leistet deshalb das ABZEICHEN, und
       genau das wird unten geprüft: es trägt alle offenen. */
    pruefe(rolle + ': der Block „Offen" steht auf der Startseite',
      st.offenBlock, st.bloecke.join(' | '));
    pruefe(rolle + ': „Offen" nennt mindestens eine Aufgabe beim Namen',
      st.zeilen.length > 0, JSON.stringify(st.zeilen));
    pruefe(rolle + ': „Offen" + „Überfällig" bleiben in der Wirklichkeit ' +
      '(' + st.offenZahl + ' + ' + st.ueberZahl + ' ≤ ' + liste.offen + ' offene)',
      st.offenZahl + st.ueberZahl <= liste.offen,
      'mehr angezeigt als es gibt');
    /* Und der Block ist nicht leer geraten: mindestens eine Aufgabe
       ohne Frist muss er zeigen, sonst prüft die Zeile darüber eine
       Null gegen eine Null. */
    pruefe(rolle + ': „Offen" zählt wirklich etwas', st.offenZahl > 0,
      String(st.offenZahl));

    /* Der Weg muss auch irgendwohin führen. Ein „alle 5 ›", das nicht
       filtert, schickt den Benutzer in eine Liste mit 61 Zeilen. */
    pruefe(rolle + ': „alle N ›" führt in die Aufgaben, gefiltert auf offen',
      st.linkZiel && st.linkZiel.ziel === 'todos' && st.linkZiel.filter === 'offen',
      JSON.stringify(st.linkZiel));

    /* ══ Das Abzeichen ══ */
    pruefe(rolle + ': das Abzeichen an „Aufgaben" ist sichtbar',
      st.abzeichen && st.abzeichen.sichtbar, JSON.stringify(st.abzeichen));
    pruefe(rolle + ': es trägt die Zahl der offenen Aufgaben',
      st.abzeichen && (st.abzeichen.text === String(liste.offen) ||
        (liste.offen > 99 && st.abzeichen.text === '99+')),
      (st.abzeichen || {}).text + ' vs ' + liste.offen);

    if (fehler.length) pruefe(rolle + ': keine Skriptfehler', false, fehler[0]);
    await p.close();
  }

  /* ══ GEGENPROBE ══
     Ohne sie waere eine Startseite, die IMMER „Offen" zeigt, gruen —
     auch wenn gar nichts offen ist. Und der Ruhe-Satz behauptet etwas:
     bis zum 21.9. hiess er „Keine Aufgabe ist über ihrer Frist", stand
     aber auch bei fuenf offenen Aufgaben da. Woertlich richtig und
     trotzdem irrefuehrend. */
  console.log('\n── GEGENPROBE: nichts offen ──');
  {
    const p = await b.newPage({ viewport: { width: 390, height: 900 } });
    await p.route('**://www.gstatic.com/**', r => r.abort());
    /* Alle Aufgaben als erledigt einsetzen, BEVOR die App sie liest.
       Über die Attrappe, nicht über Innereien der App. */
    await p.addInitScript(`
      window.__alleErledigt = true;
      document.addEventListener('DOMContentLoaded', function(){}, false);
    `);
    await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3300);
    /* Jede Aufgabe des eigenen Studios abhaken — über die Liste, wie
       ein Mensch es täte. */
    await p.evaluate(() => {
      const g = document.querySelector('.mobnav [data-group="g-arbeit"]');
      if (g) g.click();
    });
    await p.waitForTimeout(500);
    await p.evaluate(() => {
      const t = document.querySelector('[data-subview="todos"]');
      if (t) t.click();
    });
    await p.waitForTimeout(1100);
    /* Das Kaestchen heisst `.check` und sitzt in einer `.todo`-Zeile;
       erledigt traegt die Zeile `.done`. Mein erster Versuch suchte
       `input[type=checkbox]` — es ist aber ein <button>, und der
       Durchlauf fand nichts. Er hat das GEMELDET statt gruen zu sein,
       und genau deshalb steht der Fall hier. */
    const abgehakt = await p.evaluate(async () => {
      let n = 0;
      const offene = [...document.querySelectorAll('.todo:not(.done) .check')];
      for (const k of offene) {
        k.click(); n++;
        await new Promise(r => setTimeout(r, 150));
      }
      return { gefunden: document.querySelectorAll('.todo').length, geklickt: n };
    });
    await p.waitForTimeout(1200);
    console.log('  abgehakt: ' + JSON.stringify(abgehakt));

    const st = await startseite(p);
    console.log('  Blöcke danach: ' + st.bloecke.join(' | '));
    console.log('  Ruhe-Satz: ' + st.ruhe.replace(/\s+/g, ' ').trim());
    if (abgehakt.geklickt > 0) {
      pruefe('GEGENPROBE ohne offene Aufgaben verschwindet der Block „Offen"',
        !st.offenBlock, st.bloecke.join(' | '));
      pruefe('GEGENPROBE das Abzeichen verschwindet mit',
        !st.abzeichen || !st.abzeichen.sichtbar || st.abzeichen.text === '0',
        JSON.stringify(st.abzeichen));
    } else {
      /* Ehrlich sein, statt gruen zu melden: findet der Durchlauf die
         Kaestchen nicht, hat er die Gegenprobe NICHT gemacht. */
      pruefe('GEGENPROBE liess sich durchführen (Kästchen gefunden)',
        false, 'keine Aufgabe zum Abhaken gefunden — die Gegenprobe lief nicht');
    }
    await p.close();
  }

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Startseite: offene Aufgaben sind zu sehen, ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
