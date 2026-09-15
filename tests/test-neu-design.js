/* ── Das neue Design ──────────────────────────────────────────────────
   Zwei Dinge werden hier geprüft, und das zweite ist das wichtigere.

   1. Dass der neue Aufbau hält, was er verspricht: EINE Liste, in der
      alles steht, von jeder Seite aus erreichbar, und JEDES Ziel mit
      genau zwei Tipps.

   2. DASS DAS BISHERIGE UNBERÜHRT BLEIBT. Das ist die Zusage aus dem
      Betrieb: „nur auf der demo weil ja grade auch andere die app
      benutzen". Ohne den Schalter muss die App Knopf für Knopf die
      sein, die heute im Studio läuft. Ein Durchlauf, der nur das Neue
      misst, würde genau den Fehler nicht finden, vor dem die Zusage
      schützen soll.

   DER ANLASS, wörtlich: „es ist nichts an der struktur anders […] es
   soll die GRUNDSTRUKTUR besser gestaltet sein und damit um welten
   leichter zu navigieren, unabhängig von suchfeldern."

   Gemessen vorher (Chef, 390px, alle Ziele durchgeklickt):
     24 Ziele · 15 davon erst ab 3 Tipps · 6 verschiedene Bedienarten
     Reiter unter „Aufgaben": 2 von 6 sichtbar

   Die Zahl, auf die es ankommt, ist die letzte: Material, Geräte,
   Probetraining und Dokumente gab es auf dem Bildschirm nicht. Eine
   App, die ihren eigenen Inhalt versteckt, kann man nicht durch
   grössere Schrift retten. Deshalb steht hier eine Prüfung, die genau
   das misst — und zwar bei drei Breiten.

   Gemessen wird mit elementFromPoint, nicht mit getBoundingClientRect:
   .lb-close ist 40px gemalt und 44px treffbar. Ein Durchlauf, der die
   gemalte Fläche misst, meldet Fehler, die keine sind — und übersieht
   die, die welche sind.
   ─────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) console.log('  ✓ ' + name);
  else { console.log('  ✗ ' + name + (zusatz ? '  — ' + zusatz : '')); errs.push(name); }
}

async function seite(b, stub, such, breite) {
  const page = await b.newPage({ viewport: { width: breite || 390, height: 844 } });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 180)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text()))
      errs.push('CONSOLE: ' + m.text().slice(0, 160));
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.addInitScript({ path: path.join(SP, stub) });
  await page.goto(APP + (such || ''), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3400);
  return page;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  /* ══ 1. OHNE SCHALTER BLEIBT ALLES, WIE ES WAR ══════════════════════
     Die Gegenprobe zuerst. Wäre sie rot, wäre alles andere egal. */
  console.log('── Ohne Schalter: die App von heute ──');
  {
    const page = await seite(b, 'stub-chef.js', '');
    const alt = await page.evaluate(() => {
      const zeile = document.getElementById('bereichZeile');
      const lade = document.getElementById('allesLade');
      return {
        klasse: document.body.classList.contains('neu'),
        knoepfe: document.querySelectorAll('.mobnav > button[data-group]').length,
        allesKnopf: !!document.querySelector('.mobnav [data-group="g-alles"]'),
        kopfDa: !!(zeile && zeile.getClientRects().length),
        ladeDa: !!(lade && lade.getClientRects().length),
        heute: (document.getElementById('heuteListe') || {}).innerHTML || '',
        titelSichtbar: !!document.querySelector('#view-home .view-head h2').getClientRects().length,
        /* Das Wort „Neu" muss am Knopf stehen bleiben — verkürzt wird
           es NUR im neuen Schnitt. */
        neuWort: (document.getElementById('todoNew') || {}).textContent || '',
      };
    });
    console.log('BISHER:', JSON.stringify(alt));
    pruefe('body trägt die Klasse „neu" NICHT', alt.klasse === false);
    pruefe('die Leiste hat weiterhin alle Gruppen direkt', alt.knoepfe === 6, String(alt.knoepfe));
    pruefe('es gibt keinen „Alles"-Knopf', alt.allesKnopf === false);
    pruefe('der Bereichskopf ist nicht zu sehen', alt.kopfDa === false);
    pruefe('die Schublade ist nicht zu sehen', alt.ladeDa === false);
    pruefe('„Was heute dran ist" ist leer', alt.heute === '');
    pruefe('die Überschrift der Seite steht weiterhin da', alt.titelSichtbar === true);
    pruefe('„+ Neu" heisst weiterhin „Neu"', /Neu/.test(alt.neuWort), JSON.stringify(alt.neuWort));
    await page.close();
  }

  /* ══ 2. MIT SCHALTER: VIER KNÖPFE UND EINE LISTE ════════════════════ */
  console.log('\n── Mit ?neu=1: vier Knöpfe, eine Liste ──');
  const page = await seite(b, 'stub-chef.js', '?neu=1');
  {
    const neu = await page.evaluate(() => ({
      klasse: document.body.classList.contains('neu'),
      reihe: [...document.querySelectorAll('.mn-reihe > button')]
        .map(x => x.textContent.replace(/\s+/g, ' ').trim()),
      ladeZu: document.getElementById('allesLade').hidden,
      griff: !!document.querySelector('#bereichKopf .bk-griff'),
    }));
    console.log('NEU:', JSON.stringify(neu));
    pruefe('body trägt die Klasse „neu"', neu.klasse === true);
    pruefe('unten stehen vier Knöpfe', neu.reihe.length === 4, JSON.stringify(neu.reihe));
    pruefe('und zwar Start, Aufgaben, Nachrichten, Alles',
      neu.reihe.join('|') === 'Start|Aufgaben|Nachrichten|Alles', JSON.stringify(neu.reihe));
    pruefe('die Schublade ist beim Start zu', neu.ladeZu === true);
    pruefe('der Bereichskopf trägt einen sichtbaren Griff', neu.griff === true);
  }

  /* ══ 3. DIE LISTE ═══════════════════════════════════════════════════ */
  console.log('\n── Die Liste „Alles" ──');
  const liste = await page.evaluate(async () => {
    document.getElementById('bereichKopf').click();
    await new Promise(r => setTimeout(r, 500));
    const gruppen = [...document.querySelectorAll('#allesLadeInhalt .al-gruppe')];
    const zeilen = [...document.querySelectorAll('#allesLadeInhalt .al-zeile')];
    return {
      offen: !document.getElementById('allesLade').hidden,
      fragen: gruppen.map(g => (g.querySelector('.al-frage') || {}).textContent),
      ziele: zeilen.length,
      hoehen: zeilen.map(z => Math.round(z.getBoundingClientRect().height)),
      texte: zeilen.map(z => ({
        was: (z.querySelector('b') || {}).textContent || '',
        wozu: (z.querySelector('i') || {}).textContent || '',
        ziel: z.getAttribute('data-alles'),
      })),
      abgeschnitten: zeilen.some(z => {
        const t = z.querySelector('b');
        return t && t.scrollWidth > t.clientWidth + 1;
      }),
    };
  });
  console.log('FRAGEN:', JSON.stringify(liste.fragen));
  console.log('ZIELE:', liste.ziele);
  pruefe('der Griff öffnet die Liste', liste.offen === true);
  /* Nicht auf eine feste Zahl prüfen: die schlägt bei jedem neuen
     Bereich fehl und sagt nichts darüber, ob die Liste stimmt. */
  pruefe('sie enthält mindestens 20 Ziele', liste.ziele >= 20, String(liste.ziele));
  pruefe('sie ist nach Fragen gegliedert',
    liste.fragen.length >= 5 && liste.fragen.filter(f => /\?$/.test(f || '')).length >= 3,
    JSON.stringify(liste.fragen));
  /* „Weniger und grösser": mindestens 64px je antippbarer Zeile.
     Zwei Pixel Luft für Rundung. */
  pruefe('jede Zeile ist mindestens 64px hoch',
    liste.hoehen.every(h => h >= 62), JSON.stringify([...new Set(liste.hoehen)]));
  pruefe('jede Zeile nennt ein Ziel',
    liste.texte.every(t => t.was.trim().length > 2 && t.ziel), JSON.stringify(liste.texte.slice(0, 3)));
  /* Der Name allein beantwortet nicht, wofür man hingeht. „Geräte"
     sagt wenig, „Geräte — Defekt melden" sagt alles. */
  pruefe('und sagt dazu, wofür sie da ist',
    liste.texte.every(t => t.wozu.trim().length > 4),
    JSON.stringify(liste.texte.filter(t => t.wozu.trim().length <= 4)));
  pruefe('kein Name ist abgeschnitten', liste.abgeschnitten === false);

  /* ══ 4. DIE ZUSAGE: JEDES ZIEL IN ZWEI TIPPS ════════════════════════
     Das ist der Kern des ganzen Umbaus. Vorher brauchten 15 von 24
     Zielen drei oder mehr Tipps, verteilt auf sechs Bedienarten. */
  console.log('\n── Jedes Ziel in zwei Tipps? ──');
  const wege = [];
  for (let i = 0; i < liste.ziele; i++) {
    wege.push(await page.evaluate(async (i) => {
      const warte = ms => new Promise(r => setTimeout(r, ms));
      /* Immer von einer ANDEREN Seite aus starten — sonst misst man
         den Sonderfall „ich bin schon da". */
      document.querySelector('.mn-reihe [data-group="g-start"]').click();
      await warte(550);
      let tipps = 0;
      document.getElementById('bereichKopf').click();        // 1. Griff
      tipps++;
      await warte(380);
      const z = [...document.querySelectorAll('#allesLadeInhalt .al-zeile')][i];
      if (!z) return { fehlt: true };
      const name = (z.querySelector('b') || {}).textContent || '?';
      z.click();                                             // 2. Ziel
      tipps++;
      await warte(1000);
      /* Landet man auf der richtigen SEITE und im richtigen REITER?
         Ein Inhaltsverzeichnis, das die Seite trifft und dort den
         falschen Reiter zeigt, hat nicht geliefert. */
      const tt = z.getAttribute('data-al-teamtab');
      const it = z.getAttribute('data-al-ichtab');
      const cg = z.getAttribute('data-al-cgo');
      let reiterOk = true;
      if (tt) reiterOk = !!document.querySelector('[data-teamtab="' + tt + '"].on');
      if (it) reiterOk = !!document.querySelector('[data-ichtab="' + it + '"].on');
      if (cg) {
        const pane = [...document.querySelectorAll('.chef-pane')].find(x => x.offsetParent !== null);
        reiterOk = !!(pane && pane.getAttribute('data-cpane') === cg);
      }
      return {
        name, tipps, reiterOk,
        view: (document.querySelector('.view.show') || {}).id,
        ziel: 'view-' + z.getAttribute('data-alles'),
        ladeZu: document.getElementById('allesLade').hidden,
      };
    }, i));
  }
  const fehlend = wege.filter(w => w.fehlt);
  const falsch = wege.filter(w => !w.fehlt && w.view !== w.ziel);
  const reiterFalsch = wege.filter(w => !w.fehlt && !w.reiterOk);
  const offen = wege.filter(w => !w.fehlt && !w.ladeZu);
  const tipps = wege.filter(w => !w.fehlt).map(w => w.tipps);
  console.log('Tipps: min ' + Math.min(...tipps) + ' · max ' + Math.max(...tipps) +
    ' über ' + tipps.length + ' Ziele');
  pruefe('keine Zeile fehlt', fehlend.length === 0);
  pruefe('JEDES Ziel ist mit genau zwei Tipps erreichbar',
    tipps.every(t => t === 2), JSON.stringify(wege.filter(w => w.tipps !== 2).map(w => w.name)));
  pruefe('jedes landet auf der richtigen Seite',
    falsch.length === 0, JSON.stringify(falsch.map(w => w.name + ': ' + w.view)));
  pruefe('und im richtigen Reiter',
    reiterFalsch.length === 0, JSON.stringify(reiterFalsch.map(w => w.name)));
  pruefe('die Schublade schliesst sich dabei jedes Mal',
    offen.length === 0, JSON.stringify(offen.map(w => w.name)));

  /* Seite und Schublade müssen dasselbe zeigen — sonst gibt es zwei
     Wahrheiten, und eine davon ist immer die alte. */
  const gleich = await page.evaluate(async () => {
    document.querySelector('.mn-reihe [data-group="g-alles"]').click();
    await new Promise(r => setTimeout(r, 900));
    const seite = [...document.querySelectorAll('#allesSeite .al-zeile b')].map(x => x.textContent);
    document.getElementById('bereichKopf').click();
    await new Promise(r => setTimeout(r, 450));
    const lade = [...document.querySelectorAll('#allesLadeInhalt .al-zeile b')].map(x => x.textContent);
    return { seite: seite.length, lade: lade.length, gleich: seite.join('|') === lade.join('|') };
  });
  console.log('SEITE gegen SCHUBLADE:', JSON.stringify(gleich));
  pruefe('Seite und Schublade zeigen exakt dasselbe',
    gleich.gleich && gleich.seite > 0, JSON.stringify(gleich));

  /* ══ 5. EIN WEG HINAUS ══════════════════════════════════════════════ */
  console.log('\n── Kommt man wieder heraus? ──');
  const raus = await page.evaluate(async () => {
    const warte = ms => new Promise(r => setTimeout(r, ms));
    /* Bekannten Zustand herstellen. Der Abschnitt davor endet mit
       OFFENER Schublade (er vergleicht Seite und Schublade) — ohne
       diese Zeile misst „der Griff öffnet" in Wahrheit „der Griff
       schliesst", und der Durchlauf meldet einen Fehler, den es nicht
       gibt. Zwei rote Zeilen kamen genau daher. */
    if (!document.getElementById('allesLade').hidden) {
      document.getElementById('bereichKopf').click();
      await warte(350);
    }
    const auf = async () => {
      document.getElementById('bereichKopf').click();
      await warte(350);
      return !document.getElementById('allesLade').hidden;
    };
    const r = {};
    r.oeffnet = await auf();
    document.getElementById('bereichKopf').click();
    await warte(350);
    r.griffSchliesst = document.getElementById('allesLade').hidden;
    await auf();
    document.getElementById('allesZu').click();
    await warte(350);
    r.kreuzSchliesst = document.getElementById('allesLade').hidden;
    await auf();
    document.querySelector('.scroll-area').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await warte(350);
    r.danebenSchliesst = document.getElementById('allesLade').hidden;
    await auf();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await warte(350);
    r.escSchliesst = document.getElementById('allesLade').hidden;
    return r;
  });
  console.log('SCHUBLADE:', JSON.stringify(raus));
  pruefe('der Griff öffnet', raus.oeffnet === true);
  pruefe('derselbe Griff schliesst wieder', raus.griffSchliesst === true);
  pruefe('das Kreuz schliesst', raus.kreuzSchliesst === true);
  pruefe('Tippen daneben schliesst', raus.danebenSchliesst === true);
  pruefe('Esc schliesst', raus.escSchliesst === true);

  await page.screenshot({ path: path.join(SP, 'neu-design.png') });
  await page.close();

  /* ══ 5b. DIE STARTSEITE BEANTWORTET EINE FRAGE ══════════════════════
     Aus dem Betrieb: „die startseite sieht sehr überwältigend aus noch,
     das müssten wir minimieren."

     Gemessen wird nicht gegen eine ausgedachte Schwelle, sondern gegen
     die BISHERIGE Seite — beide Fassungen in derselben Runde, mit
     denselben Daten. Eine gewählte Zahl („höchstens 3 Bildschirme")
     hätte nur getrennt, was ohnehin getrennt ist; der Vergleich sagt,
     ob der Umbau etwas gebracht hat. */
  console.log('\n── Ist die Startseite kürzer geworden? ──');
  for (const stub of ['stub-chef.js', 'stub-mitarbeiter.js']) {
    const mass = {};
    for (const [flagge, name] of [['?neu=0', 'bisher'], ['?neu=1', 'neu']]) {
      const ph = await seite(b, stub, flagge);
      mass[name] = await ph.evaluate(() => {
        const sa = document.querySelector('#view-home .scroll-area');
        return {
          bildschirme: +(sa.scrollHeight / sa.clientHeight).toFixed(2),
          hoehe: sa.scrollHeight,
          ueberschriften: [...sa.querySelectorAll('h3,.sec-head span,.heute-kopf')]
            .filter(e => e.getClientRects().length).length,
          /* Was doppelt sagte, was die Liste oben schon nennt. */
          raster: !!(document.getElementById('homeGrid') || {}).getClientRects
            && !!document.getElementById('homeGrid').getClientRects().length,
          brennpunkte: (() => {
            const e = document.getElementById('homeBrennpunkte');
            return !!(e && e.getClientRects().length);
          })(),
          dienstZeilen: document.querySelectorAll('#myShiftList .mysh-row').length,
          dienstMehr: !!document.getElementById('myShiftMehr'),
        };
      });
      await ph.close();
    }
    const wer = stub.replace('stub-', '').replace('.js', '');
    console.log('  ' + wer + ': bisher ' + mass.bisher.bildschirme + ' Bildschirme (' +
      mass.bisher.ueberschriften + ' Überschriften) → neu ' + mass.neu.bildschirme +
      ' (' + mass.neu.ueberschriften + ')');
    pruefe(wer + ': die Startseite ist kürzer als vorher',
      mass.neu.hoehe < mass.bisher.hoehe,
      mass.bisher.hoehe + ' → ' + mass.neu.hoehe);
    /* „Nicht mehr", nicht „weniger". Der neue Schnitt NIMMT „Überblick"
       weg und SETZT dafür „Überfällig" und „Heute" — beim Mitarbeiter
       geht das genau auf. Das ist kein Rückschritt, sondern der Tausch,
       um den es ging: eine Überschrift, die eine Zahl ankündigt, gegen
       eine, die eine Sache ankündigt. Gezählt wird deshalb nur, dass
       die Seite nicht voller wird; ob sie kürzer wurde, sagt die Zeile
       darüber. */
    pruefe(wer + ': sie hat nicht mehr Überschriften als vorher',
      mass.neu.ueberschriften <= mass.bisher.ueberschriften,
      mass.bisher.ueberschriften + ' → ' + mass.neu.ueberschriften);
    /* Gegenprobe: im BISHERIGEN Design müssen Raster und Brennpunkte
       noch da sein. Sonst misst der Vergleich oben zwei Mal dasselbe. */
    pruefe(wer + ': GEGENPROBE das Kachelraster steht bisher noch da',
      mass.bisher.raster === true);
    pruefe(wer + ': das Kachelraster ist im neuen Schnitt weg',
      mass.neu.raster === false);
    pruefe(wer + ': „Wo etwas los ist" ist im neuen Schnitt weg',
      mass.neu.brennpunkte === false);
    /* „Mein Dienst" war beim Chef 614px — vierzehn Zeilen auf einer
       Seite, die sagen soll, was JETZT dran ist. */
    pruefe(wer + ': „Mein Dienst" zeigt höchstens drei Zeilen',
      mass.neu.dienstZeilen <= 3, String(mass.neu.dienstZeilen));
    /* Eine gekürzte Liste ohne Ausgang verschweigt, dass sie gekürzt
       ist. */
    if (mass.bisher.dienstZeilen > 3) {
      pruefe(wer + ': und nennt den Weg zum Rest',
        mass.neu.dienstMehr === true);
    }
  }

  /* ══ 6. NICHTS IST MEHR UNSICHTBAR ══════════════════════════════════
     Der Fund, der diesen ganzen Umbau ausgelöst hat: unter „Aufgaben"
     waren von sechs Reitern zwei zu sehen. Vier Seiten der App gab es
     auf einem 390er-Handy nicht. */
  console.log('\n── Sind alle Reiter sichtbar? ──');
  for (const breite of [320, 390, 430]) {
    const p2 = await seite(b, 'stub-chef.js', '?neu=1', breite);
    const m = await p2.evaluate(async () => {
      document.querySelector('.mn-reihe [data-group="g-arbeit"]').click();
      await new Promise(r => setTimeout(r, 1000));
      const bar = document.getElementById('subnav');
      const rb = bar.getBoundingClientRect();
      const tabs = [...bar.querySelectorAll('.subtab')];
      return {
        gesamt: tabs.length,
        /* Sichtbar heisst: vollständig innerhalb der Leiste, waagerecht
           UND senkrecht. Ein Reiter, der halb unter dem Rand liegt,
           zählt nicht. */
        sichtbar: tabs.filter(e => {
          const r = e.getBoundingClientRect();
          return r.left >= rb.left - 1 && r.right <= rb.right + 1 &&
                 r.top >= rb.top - 1 && r.bottom <= rb.bottom + 1;
        }).map(e => e.textContent.replace(/\s+/g, ' ').trim()),
        mehrKnopf: !!(document.getElementById('subnavMehr') &&
                      document.getElementById('subnavMehr').getClientRects().length),
      };
    });
    console.log('  ' + breite + 'px: ' + m.sichtbar.length + '/' + m.gesamt +
      ' — ' + JSON.stringify(m.sichtbar));
    pruefe(breite + 'px: JEDER Reiter ist zu sehen',
      m.sichtbar.length === m.gesamt, m.sichtbar.length + ' von ' + m.gesamt);
    pruefe(breite + 'px: „Alle" wird nicht mehr gebraucht', m.mehrKnopf === false);
    await p2.close();
  }

  /* ══ 7. ROLLEN ══════════════════════════════════════════════════════
     Gegenprobe gegen eine Liste, die einfach alles zeigt: ein
     Mitarbeiter darf die Verwaltung dort nicht finden. */
  console.log('\n── Was sieht wer? ──');
  for (const [stub, wer, darfChef] of [
    ['stub-chef.js', 'Chef', true],
    ['stub-leiter.js', 'Leiter', true],
    ['stub-mitarbeiter.js', 'Mitarbeiter', false],
  ]) {
    const p3 = await seite(b, stub, '?neu=1');
    const r = await p3.evaluate(async () => {
      document.querySelector('.mn-reihe [data-group="g-alles"]').click();
      await new Promise(r => setTimeout(r, 900));
      return {
        fragen: [...document.querySelectorAll('#allesSeite .al-frage')].map(x => x.textContent),
        ziele: [...document.querySelectorAll('#allesSeite .al-zeile b')].map(x => x.textContent),
      };
    });
    const hatVerwalten = r.fragen.some(f => /Verwalten/.test(f || ''));
    console.log('  ' + wer + ': ' + r.ziele.length + ' Ziele · Verwalten: ' + hatVerwalten);
    pruefe(wer + ' sieht eine gefüllte Liste', r.ziele.length >= 10, String(r.ziele.length));
    pruefe(wer + (darfChef ? ' sieht „Verwalten"' : ' sieht „Verwalten" NICHT'),
      hatVerwalten === darfChef, JSON.stringify(r.fragen));
    await p3.close();
  }

  /* ══ 8. TREFFERFLÄCHEN UND ÜBERHANG ═════════════════════════════════ */
  console.log('\n── Trefferflächen und Überhang ──');
  for (const stub of ['stub-chef.js', 'stub-mitarbeiter.js']) {
    for (const breite of [320, 390, 430]) {
      const p4 = await seite(b, stub, '?neu=1', breite);
      const m = await p4.evaluate(() => {
        const reihe = [...document.querySelectorAll('.mn-reihe > button')];
        const bar = document.querySelector('.mobnav');
        const griff = document.getElementById('bereichKopf');
        function treffbar(k, r) {
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          return [[-21, -21], [21, -21], [-21, 21], [21, 21]].every(([dx, dy]) => {
            const el = document.elementFromPoint(cx + dx, cy + dy);
            return !!(el && (el === k || k.contains(el)));
          });
        }
        const gr = griff.getBoundingClientRect();
        return {
          treffer: reihe.map(k => ({
            t: k.textContent.replace(/\s+/g, ' ').trim(),
            ok: treffbar(k, k.getBoundingClientRect()),
          })),
          /* Der Griff ist das grösste Ziel auf dem Bildschirm — das war
             der Punkt („mehr an der seite zum tippen"). */
          griffHoch: Math.round(gr.height),
          griffBreit: Math.round(gr.width),
          griffOk: treffbar(griff, gr),
          ueberhang: Math.max(0, bar.scrollWidth - bar.clientWidth),
          abgeschnitten: reihe.some(k => {
            const s = k.querySelector('span:not(.badge):not(.ndot)');
            return s && s.scrollWidth > s.clientWidth + 1;
          }),
          seitlich: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
        };
      });
      const wer = stub.replace('stub-', '').replace('.js', '');
      console.log('  ' + wer + '@' + breite + ': Griff ' + m.griffBreit + '×' + m.griffHoch +
        ' · Überhang ' + m.ueberhang + ' · quer ' + m.seitlich);
      pruefe(wer + '@' + breite + ': jeder Knopf unten ist 44px treffbar',
        m.treffer.every(t => t.ok), JSON.stringify(m.treffer.filter(t => !t.ok)));
      pruefe(wer + '@' + breite + ': der Griff ist gross und treffbar',
        m.griffOk && m.griffHoch >= 44 && m.griffBreit >= 200,
        m.griffBreit + '×' + m.griffHoch);
      pruefe(wer + '@' + breite + ': die Leiste läuft nicht über', m.ueberhang === 0, String(m.ueberhang));
      pruefe(wer + '@' + breite + ': kein Wort ist abgeschnitten', !m.abgeschnitten);
      pruefe(wer + '@' + breite + ': die Seite scrollt nicht seitlich',
        m.seitlich === 0, String(m.seitlich));
      await p4.close();
    }
  }

  await b.close();
  console.log(errs.length
    ? '\n✗ ' + errs.length + ' Fehler im neuen Design'
    : '\n✓ Neues Design: eine Liste, jedes Ziel in zwei Tipps, kein Reiter ' +
      'mehr unsichtbar — und ohne Schalter ist alles wie vorher');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
