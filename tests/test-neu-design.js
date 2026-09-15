/* ── Das neue Design ──────────────────────────────────────────────────
   Zwei Dinge werden hier geprüft, und das zweite ist das wichtigere.

   1. Dass das Neue funktioniert: vier Knöpfe statt sechs, jede Gruppe
      erreichbar, ein Bereichskopf, der sagt wo man ist, und eine
      Startseite, die Aufgaben beim Namen nennt.

   2. DASS DAS BISHERIGE UNBERÜHRT BLEIBT. Das ist die Zusage aus dem
      Betrieb: „nur auf der demo weil ja grade auch andere die app
      benutzen". Ohne den Schalter muss die App Knopf für Knopf die
      sein, die heute im Studio läuft. Ein Durchlauf, der nur das Neue
      misst, würde genau den Fehler nicht finden, vor dem die Zusage
      schützen soll.

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
    const alt = await page.evaluate(() => ({
      klasse: document.body.classList.contains('neu'),
      knoepfe: document.querySelectorAll('.mobnav > button[data-group]').length,
      lade: !!document.getElementById('mnLade'),
      mehr: !!document.getElementById('mnMehr'),
      kopfDa: !!(document.getElementById('bereichKopf') &&
                 document.getElementById('bereichKopf').getClientRects().length),
      heute: (document.getElementById('heuteListe') || {}).innerHTML || '',
      titelSichtbar: !!document.querySelector('#view-home .view-head h2').getClientRects().length,
    }));
    console.log('BISHER:', JSON.stringify(alt));
    pruefe('body trägt die Klasse „neu" NICHT', alt.klasse === false);
    pruefe('die Leiste hat weiterhin alle Gruppen direkt', alt.knoepfe === 6, String(alt.knoepfe));
    pruefe('es gibt keine Lade und keinen „Mehr"-Knopf', !alt.lade && !alt.mehr);
    pruefe('der Bereichskopf ist nicht zu sehen', alt.kopfDa === false);
    pruefe('„Was heute dran ist" ist leer', alt.heute === '');
    pruefe('die Überschrift der Seite steht weiterhin da', alt.titelSichtbar === true);
    await page.close();
  }

  /* ══ 2. MIT SCHALTER: DER NEUE SCHNITT ═══════════════════════════════ */
  console.log('\n── Mit ?neu=1: vier Knöpfe und eine Lade ──');
  const page = await seite(b, 'stub-chef.js', '?neu=1');
  {
    const neu = await page.evaluate(() => ({
      klasse: document.body.classList.contains('neu'),
      reihe: [...document.querySelectorAll('.mn-reihe > button')]
        .map(x => x.textContent.replace(/\s+/g, ' ').trim()),
      lade: [...document.querySelectorAll('.mn-lade > button')]
        .map(x => (x.querySelector('b') || {}).textContent),
      ladeZu: document.getElementById('mnLade').hidden,
    }));
    console.log('NEU:', JSON.stringify(neu));
    pruefe('body trägt die Klasse „neu"', neu.klasse === true);
    pruefe('unten stehen vier Knöpfe', neu.reihe.length === 4, JSON.stringify(neu.reihe));
    pruefe('und zwar Start, Aufgaben, Nachrichten, Mehr',
      neu.reihe.join('|') === 'Start|Aufgaben|Nachrichten|Mehr', JSON.stringify(neu.reihe));
    pruefe('hinter „Mehr" liegen Ich, Team und Verwaltung',
      neu.lade.join('|') === 'Ich|Team|Verwaltung', JSON.stringify(neu.lade));
    pruefe('die Lade ist beim Start zu', neu.ladeZu === true);
  }

  /* ── Jede Gruppe ist erreichbar. Der Punkt der ganzen Umstellung:
       drei Bereiche liegen jetzt eine Ebene tiefer. Wenn einer davon
       nicht mehr ankommt, ist der Umbau ein Rückschritt, kein
       Fortschritt. ── */
  console.log('\n── Ist jede Gruppe noch erreichbar? ──');
  const ziele = [
    ['g-start', 'view-home'], ['g-arbeit', 'view-todos'], ['g-komm', 'view-chat'],
    ['g-ich', 'view-ich'], ['g-team', 'view-team'], ['g-chef', 'view-chef'],
  ];
  for (const [gid, viewId] of ziele) {
    const r = await page.evaluate(async (g) => {
      /* Genau der Weg, den ein Mensch geht: liegt die Gruppe hinter
         „Mehr", muss man erst „Mehr" antippen. Ein Test, der den
         versteckten Knopf direkt klickt, prüft nicht die Navigation,
         sondern nur, dass ein Element im Dokument steht. */
      let k = document.querySelector('.mn-reihe [data-group="' + g + '"]');
      let ueberMehr = false;
      if (!k) {
        document.getElementById('mnMehr').click();
        await new Promise(r => setTimeout(r, 350));
        ueberMehr = true;
        k = document.querySelector('.mn-lade [data-group="' + g + '"]');
      }
      if (!k) return { fehlt: true };
      k.click();
      await new Promise(r => setTimeout(r, 900));
      return {
        view: (document.querySelector('.view.show') || {}).id,
        bereich: document.body.getAttribute('data-bereich'),
        ueberMehr,
        ladeZu: document.getElementById('mnLade').hidden,
        mehrAktiv: document.getElementById('mnMehr').classList.contains('active'),
        kopf: (document.getElementById('bkTitel') || {}).textContent,
        farbe: getComputedStyle(document.body).getPropertyValue('--ber').trim(),
      };
    }, gid);
    console.log(' ', gid, JSON.stringify(r));
    pruefe(gid + ' führt zur richtigen Seite', r.view === viewId, JSON.stringify(r));
    pruefe(gid + ': der Kopf nennt den Bereich', !!r.kopf, JSON.stringify(r));
    if (r.ueberMehr) {
      pruefe(gid + ': die Lade schliesst sich danach', r.ladeZu === true);
      /* Sonst zeigt die Leiste nirgends hin und man weiss beim Blick
         nach unten nicht mehr, wo man ist. */
      pruefe(gid + ': „Mehr" trägt die Marke', r.mehrAktiv === true);
    }
  }

  /* ── Sechs Bereiche, sechs Farben. Genau das war der Wunsch: „ich
       will das man einen unterschied schon erkennt". Zwei gleiche
       Farben wären zwei Bereiche, die man nicht unterscheiden kann. ── */
  console.log('\n── Hat jeder Bereich eine eigene Farbe? ──');
  const farben = {};
  for (const [gid] of ziele) {
    farben[gid] = await page.evaluate(async (g) => {
      document.body.setAttribute('data-bereich', g);
      return getComputedStyle(document.body).getPropertyValue('--ber').trim();
    }, gid);
  }
  console.log('FARBEN:', JSON.stringify(farben));
  const werte = Object.values(farben);
  pruefe('jeder Bereich hat eine Farbe', werte.every(v => /^#|rgb/.test(v)), JSON.stringify(farben));
  pruefe('keine zwei Bereiche teilen sich eine',
    new Set(werte).size === werte.length, JSON.stringify(farben));

  /* ══ 3. DIE STARTSEITE ══════════════════════════════════════════════ */
  console.log('\n── Was heute dran ist ──');
  await page.evaluate(async () => {
    document.querySelector('.mn-reihe [data-group="g-start"]').click();
    await new Promise(r => setTimeout(r, 900));
  });
  const start = await page.evaluate(() => {
    const zeilen = [...document.querySelectorAll('#heuteListe .heute-zeile')];
    return {
      anzahl: zeilen.length,
      ruhe: !!document.querySelector('#heuteListe .heute-ruhe'),
      koepfe: [...document.querySelectorAll('#heuteListe .heute-kopf')]
        .map(k => k.textContent.trim()),
      hoehen: zeilen.map(z => Math.round(z.getBoundingClientRect().height)),
      ziele: zeilen.map(z => z.getAttribute('data-heute')),
      /* Jede Zeile muss sagen WAS und WO — eine Zahl allein ist der
         Zustand von vorher. */
      texte: zeilen.map(z => ({
        was: (z.querySelector('b') || {}).textContent || '',
        wo: (z.querySelector('i') || {}).textContent || '',
      })),
      erstesY: zeilen.length ? Math.round(zeilen[0].getBoundingClientRect().top) : null,
    };
  });
  console.log('START:', JSON.stringify(start));
  pruefe('die Startseite sagt etwas — Zeilen oder „nichts Dringendes"',
    start.anzahl > 0 || start.ruhe);
  if (start.anzahl) {
    pruefe('Überfälliges steht oben', /Überfällig/i.test(start.koepfe[0] || ''),
      JSON.stringify(start.koepfe));
    /* Der gewählte Wunsch war „weniger und grösser": mindestens 64px
       je Zeile. Zwei Pixel Luft für Rundung. */
    pruefe('jede Zeile ist mindestens 64px hoch',
      start.hoehen.every(h => h >= 62), JSON.stringify(start.hoehen));
    pruefe('jede Zeile führt irgendwohin',
      start.ziele.every(z => !!z), JSON.stringify(start.ziele));
    pruefe('jede Zeile nennt die Sache beim Namen',
      start.texte.every(t => t.was.trim().length > 2), JSON.stringify(start.texte));
    pruefe('und sagt dazu, wo oder seit wann',
      start.texte.every(t => t.wo.trim().length > 2), JSON.stringify(start.texte));
    /* Der Fund, der diesen Abschnitt ausgelöst hat: mit der
       Einrichtungskarte davor begann die erste überfällige Aufgabe bei
       y=682 — auf einem 844er-Handy fast unten. */
    pruefe('die erste Zeile steht im oberen Drittel', start.erstesY < 280,
      'y=' + start.erstesY);
  }

  /* Gegenprobe gegen erfundene Zahlen: was der Bereichskopf bei
     „Aufgaben" behauptet, muss zur Liste darunter passen. Eine falsche
     Zahl sieht genauso ordentlich aus wie eine richtige. */
  console.log('\n── Stimmt die Zahl im Kopf? ──');
  const zahl = await page.evaluate(async () => {
    document.querySelector('.mn-reihe [data-group="g-arbeit"]').click();
    await new Promise(r => setTimeout(r, 1200));
    const sub = (document.getElementById('bkSub') || {}).textContent || '';
    const m = /^(\d+) offen/.exec(sub);
    const offen = document.querySelectorAll('#todoArea .todo:not(.done)').length;
    return { sub, behauptet: m ? +m[1] : null, gezaehlt: offen };
  });
  console.log('KOPFZAHL:', JSON.stringify(zahl));
  pruefe('der Kopf nennt eine Zahl offener Aufgaben', zahl.behauptet !== null, zahl.sub);
  if (zahl.behauptet !== null) {
    pruefe('und sie stimmt mit der Liste überein',
      zahl.behauptet === zahl.gezaehlt,
      'Kopf sagt ' + zahl.behauptet + ', gezählt ' + zahl.gezaehlt);
  }

  /* ══ 4. DIE LADE HAT EINEN WEG HINAUS ═══════════════════════════════
     Ein Fenster, das man nur durch Navigieren wieder loswird, ist eine
     Falle. Dieselbe Prüfung wie bei den anderen Wählern der App. */
  console.log('\n── Kommt man aus der Lade wieder heraus? ──');
  const raus = await page.evaluate(async () => {
    const auf = async () => {
      document.getElementById('mnMehr').click();
      await new Promise(r => setTimeout(r, 300));
      return !document.getElementById('mnLade').hidden;
    };
    const r = {};
    r.oeffnet = await auf();
    /* nochmal auf denselben Knopf */
    document.getElementById('mnMehr').click();
    await new Promise(r2 => setTimeout(r2, 300));
    r.knopfSchliesst = document.getElementById('mnLade').hidden;
    /* danebentippen */
    await auf();
    document.querySelector('.scroll-area').dispatchEvent(
      new MouseEvent('click', { bubbles: true }));
    await new Promise(r2 => setTimeout(r2, 300));
    r.danebenSchliesst = document.getElementById('mnLade').hidden;
    /* Esc */
    await auf();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r2 => setTimeout(r2, 300));
    r.escSchliesst = document.getElementById('mnLade').hidden;
    return r;
  });
  console.log('LADE:', JSON.stringify(raus));
  pruefe('„Mehr" öffnet die Lade', raus.oeffnet === true);
  pruefe('„Mehr" schliesst sie wieder', raus.knopfSchliesst === true);
  pruefe('Tippen daneben schliesst sie', raus.danebenSchliesst === true);
  pruefe('Esc schliesst sie', raus.escSchliesst === true);

  await page.screenshot({ path: path.join(SP, 'neu-design.png'), fullPage: false });
  await page.close();

  /* ══ 5. DREI ROLLEN, DREI BREITEN ═══════════════════════════════════
     Trefferflächen und Überhang. Die Leiste ist die eine Stelle, an der
     nichts abgeschnitten sein darf: was man dort nicht sieht, gibt es
     nicht. */
  console.log('\n── Trefferflächen und Überhang ──');
  for (const stub of ['stub-chef.js', 'stub-leiter.js', 'stub-mitarbeiter.js']) {
    for (const breite of [320, 390, 430]) {
      const p2 = await seite(b, stub, '?neu=1', breite);
      const m = await p2.evaluate(() => {
        const reihe = [...document.querySelectorAll('.mn-reihe > button')];
        const bar = document.querySelector('.mobnav');
        return {
          anzahl: reihe.length,
          /* Treffbar, nicht gemalt: elementFromPoint in allen vier
             Ecken der 44er-Fläche um die Mitte des Knopfes. */
          treffer: reihe.map(k => {
            const r = k.getBoundingClientRect();
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            const ok = [[-21, -21], [21, -21], [-21, 21], [21, 21]].every(([dx, dy]) => {
              const el = document.elementFromPoint(cx + dx, cy + dy);
              return !!(el && (el === k || k.contains(el)));
            });
            return { t: k.textContent.replace(/\s+/g, ' ').trim(), ok, b: Math.round(r.width) };
          }),
          ueberhang: Math.max(0, bar.scrollWidth - bar.clientWidth),
          abgeschnitten: reihe.some(k => {
            const s = k.querySelector('span:not(.badge):not(.ndot)');
            return s && s.scrollWidth > s.clientWidth + 1;
          }),
          seitlich: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
        };
      });
      const wer = stub.replace('stub-', '').replace('.js', '');
      console.log(' ', wer, breite + 'px', JSON.stringify(m));
      pruefe(wer + '@' + breite + ': jeder Knopf ist 44px treffbar',
        m.treffer.every(t => t.ok), JSON.stringify(m.treffer.filter(t => !t.ok)));
      pruefe(wer + '@' + breite + ': die Leiste läuft nicht über',
        m.ueberhang === 0, String(m.ueberhang));
      pruefe(wer + '@' + breite + ': kein Wort ist abgeschnitten', !m.abgeschnitten);
      pruefe(wer + '@' + breite + ': die Seite scrollt nicht seitlich',
        m.seitlich === 0, String(m.seitlich));
      await p2.close();
    }
  }

  await b.close();
  console.log(errs.length
    ? '\n✗ ' + errs.length + ' Fehler im neuen Design'
    : '\n✓ Neues Design: vier Knöpfe, jede Gruppe erreichbar, eigene Farbe ' +
      'je Bereich — und ohne Schalter ist alles wie vorher');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
