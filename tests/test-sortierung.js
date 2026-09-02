/* ── Listen organisieren: sortieren UND filtern ───────────────────────
   GEWÜNSCHT WAR: „nach täglich und wöchentlich sortieren, und nach
   Dringlichkeit, die der Chef angibt, und die Materialliste nach
   Alphabet — und dieses Prinzip in der ganzen App verteilen."

   Nachgemessen sah es vorher so aus:

     Dokumente, Geräte, Nachweise   Chips, gemerkt in PREFS.sort
     Aufgaben                       eigenes Feld, NICHT gemerkt
     Putzplan, Material             gar nichts

   Drei Bauarten für dieselbe Sache, und die Aufgaben vergassen die Wahl
   nach jedem Neuladen. `sortFeld()` ist jetzt die eine Bauart für
   Werkzeugzeilen, mit derselben Ablage wie die Chips.

   DIE GEFÄHRLICHSTE STELLE IST DAS MATERIAL. Dort ist der Listenindex
   die Kennung: die Eingabefelder tragen `data-idx`, geschrieben wird
   mit `_matItems[idx]`. Wer die Liste umsortiert, schreibt getippte
   Zahlen ins falsche Material — lautlos, weil die Zeile richtig
   aussieht. Deshalb wird eine Kopie sortiert, die ihren ursprünglichen
   Index mitführt, und genau das wird hier nachgemessen.

   Die Dringlichkeit ist neu und Chefsache. Dass sie das ist, kostete
   keine Zeile Regel: die Feldgrenze aus Runde 66 lässt einem
   Mitarbeiter nur die dort benannten Felder, und `prio` steht nicht
   darunter. Geprüft wird das im Emulator (fremde-felder.test.js); hier
   geht es um die Oberfläche.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
function pruefe(name, ok, zusatz) {
  if (ok) console.log('  ✓ ' + name);
  else { console.log('  ✗ ' + name + (zusatz ? '\n      ' + zusatz : '')); errs.push(name); }
}

async function lauf() {
  const pageErrs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 430, height: 900 } });
  page.on('pageerror', e => pageErrs.push('PAGEERROR: ' + e.message.slice(0, 180)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  if (!(await page.evaluate(() => !!document.querySelector('#app.show')))) {
    await b.close();
    throw new Error('Die App ist gar nicht gestartet. ' + pageErrs.join(' | '));
  }

  /* ══ 1. Das Feld steht überall, wo es fehlte ══ */
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-arbeit"]').click());
  await page.waitForTimeout(420);
  const da = await page.evaluate(() => ({
    todo: !!document.querySelector('#todoSort'),
    putz: !!document.querySelector('#ppSort'),
    mat: !!document.querySelector('#matSort'),
  }));
  pruefe('Aufgaben, Putzplan und Material haben ein Sortierfeld',
    da.todo && da.putz && da.mat, JSON.stringify(da));

  /* ══ 2. Putzplan ══
     Das Studio wird ABGELESEN und gesetzt: der Putzplan startet auf dem
     alphabetisch ersten Studio (Brühl), die Attrappendaten liegen unter
     studio-6. Beim ersten Anlauf war die Liste deshalb leer und alles
     darunter hätte nichts geprüft. */
  await page.evaluate(() => document.querySelector('[data-subview="putzplan"]').click());
  await page.waitForTimeout(620);
  await page.selectOption('#ppStudio', 'studio-6');
  await page.waitForTimeout(700);

  /* Der Titel ist der ERSTE TEXTKNOTEN in .pp-title — dahinter stehen
     die Marken (Dringlichkeit, Rhythmus) im selben Element.
     textContent nähme sie mit und ergäbe „Spiegel putzenwöchentlich". */
  const ppTitel = () => page.evaluate(() =>
    [...document.querySelectorAll('.pp-item .pp-title')].map(x => {
      const t = [...x.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
      return t ? t.textContent.trim() : x.textContent.trim();
    }));
  const ppWaehle = async (v) => {
    await page.evaluate((w) => {
      const s = document.querySelector('#ppSort'); s.value = w;
      s.dispatchEvent(new Event('change'));
    }, v);
    await page.waitForTimeout(420);
  };

  const ppStd = await ppTitel();
  pruefe('Putzplan: es stehen überhaupt Aufgaben da', ppStd.length >= 5,
    ppStd.length + ' — ohne Zeilen prüft alles Weitere nichts.');

  await ppWaehle('name');
  const ppName = await ppTitel();
  /* Offene zuerst, dann erledigte — und INNERHALB davon alphabetisch.
     Eine erledigte Aufgabe darf auch alphabetisch nicht über einer
     offenen stehen, sonst sucht man den nächsten Punkt zwischen
     abgehakten. */
  pruefe('Putzplan · Name: Spiegel, Toiletten, Vorhänge (offene, A–Z)',
    ppName.slice(0, 3).join('|') === 'Spiegel putzen|Toiletten reinigen|Vorhänge waschen',
    JSON.stringify(ppName));
  pruefe('Putzplan · Name: erledigte bleiben trotzdem unten',
    ppName.slice(3).join('|') === 'Böden wischen|Lager aufräumen',
    JSON.stringify(ppName.slice(3)) + ' — „Böden" käme alphabetisch als ' +
    'erstes und darf trotzdem nicht über eine offene Aufgabe rutschen.');

  await ppWaehle('rhythmus');
  const ppRhy = await ppTitel();
  /* Täglich vor wöchentlich vor einmalig. Alphabetisch wäre es genau
     verkehrt herum — das war der Grund für eine eigene Rangfolge. */
  pruefe('Putzplan · Rhythmus: täglich vor wöchentlich vor einmalig',
    ppRhy.slice(0, 3).join('|') === 'Toiletten reinigen|Spiegel putzen|Vorhänge waschen',
    JSON.stringify(ppRhy));

  /* ══ 3. Die Wahl überlebt das Neuladen ══
     Das war bei den Aufgaben vorher NICHT so — die Sortierung stand in
     einer blossen Variablen und war nach jedem Start wieder Standard. */
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  await page.evaluate(() => document.querySelector('.mobnav [data-group="g-arbeit"]').click());
  await page.waitForTimeout(420);
  await page.evaluate(() => document.querySelector('[data-subview="putzplan"]').click());
  await page.waitForTimeout(620);
  pruefe('Nach dem Neuladen steht die gewählte Sortierung noch da',
    (await page.evaluate(() => document.querySelector('#ppSort').value)) === 'rhythmus',
    'gewählt war „rhythmus"');

  /* ══ 4. Dringlichkeit ══ */
  await page.selectOption('#ppStudio', 'studio-6');
  await page.waitForTimeout(600);
  await page.evaluate(() => window.__nachschub('studios/studio-6/cleaning', [
    { id: 'p1', title: 'Zuletzt im Alphabet', done: false, ts: 1, prio: 'hoch' },
    { id: 'p2', title: 'Alphabetisch erste', done: false, ts: 2 },
    { id: 'p3', title: 'Mitte', done: false, ts: 3, prio: 'niedrig' },
  ]));
  await page.waitForTimeout(600);
  const marken = await page.evaluate(() =>
    [...document.querySelectorAll('.pp-item')].map(x => {
      const t = x.querySelector('.pp-title');
      const kn = t && [...t.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
      const p = x.querySelector('.prio');
      return (kn ? kn.textContent.trim() : '?') + '→' + (p ? p.textContent.trim() : '—');
    }));
  pruefe('Eine dringende Aufgabe trägt die Marke „Dringend"',
    marken.some(m => /Zuletzt im Alphabet→Dringend/.test(m)), JSON.stringify(marken));
  pruefe('„Kann warten" trägt seine eigene Marke',
    marken.some(m => /Mitte→Kann warten/.test(m)), JSON.stringify(marken));
  /* Trägt jede Zeile eine Marke, fällt keine mehr auf — und der
     Normalfall ist die Mehrheit. */
  pruefe('(Gegenprobe) „Normal" trägt KEINE Marke',
    marken.some(m => /Alphabetisch erste→—/.test(m)), JSON.stringify(marken));

  await ppWaehle('prio');
  const ppPrio = await ppTitel();
  pruefe('Putzplan · Dringlichkeit: dringend, normal, kann warten',
    ppPrio.join('|') === 'Zuletzt im Alphabet|Alphabetisch erste|Mitte',
    JSON.stringify(ppPrio) + ' — alphabetisch wäre die Reihenfolge genau ' +
    'umgekehrt; nur daran sieht man, dass wirklich nach prio sortiert wird.');

  /* ══ 5. Material — die gefährlichste Stelle ══ */
  await page.evaluate(() => document.querySelector('[data-subview="material"]').click());
  await page.waitForTimeout(720);
  /* Über die ZEILEN gehen, nicht über die Eingabefelder: die Tabelle
     ist ein Raster aus .mat-row, kein <tr>. Der erste Anlauf nahm
     h.closest('tr') und landete im gemeinsamen Elternteil — dort fand
     querySelector dreimal denselben Namen. */
  const matZeilen = () => page.evaluate(() =>
    [...document.querySelectorAll('#matTable .mat-row')].map(row => {
      const n = row.querySelector('.mat-name, .mat-name-inp');
      const h = row.querySelector('input.have');
      return {
        name: (n ? (n.value || n.textContent) : '?').trim(),
        idx: h ? h.dataset.idx : '?',
      };
    }));

  const vorher = await matZeilen();
  pruefe('Material: es stehen Zeilen da', vorher.length >= 5, vorher.length + ' Zeilen');
  pruefe('(Ausgangslage) unsortiert steht Handtücher auf idx 0',
    vorher[0] && vorher[0].name === 'Handtücher' && vorher[0].idx === '0',
    JSON.stringify(vorher.slice(0, 2)));

  await page.evaluate(() => {
    const s = document.querySelector('#matSort'); s.value = 'name';
    s.dispatchEvent(new Event('change'));
  });
  await page.waitForTimeout(520);
  const nachher = await matZeilen();

  const namen = nachher.map(z => z.name);
  const sortiert = namen.slice().sort((a, b) => a.localeCompare(b, 'de'));
  pruefe('Material · Name A–Z sortiert wirklich alphabetisch',
    namen.join('|') === sortiert.join('|'), JSON.stringify(namen.slice(0, 4)));
  pruefe('Die Reihenfolge hat sich dabei überhaupt geändert',
    namen.join('|') !== vorher.map(z => z.name).join('|'),
    'Sonst wäre die Zeile darüber auch grün, wenn gar nicht sortiert würde.');

  /* DER KERN: die Kennung wandert MIT der Zeile. Bliebe sie an der
     Position kleben, schriebe man getippte Zahlen ins falsche
     Material — und zwar lautlos. */
  const paare = {};
  vorher.forEach(z => { paare[z.name] = z.idx; });
  const verrutscht = nachher.filter(z => paare[z.name] !== z.idx);
  pruefe('Jede Zeile behält ihre Kennung (data-idx wandert mit)',
    verrutscht.length === 0,
    JSON.stringify(verrutscht.slice(0, 3)) + ' — hier würde eine getippte ' +
    'Zahl beim falschen Material landen.');
  pruefe('(Gegenprobe) die Kennungen stehen dadurch NICHT mehr der Reihe nach',
    nachher.map(z => z.idx).join(',') !== vorher.map(z => z.idx).join(','),
    'Stünden sie noch in derselben Folge, hätte die Prüfung darüber ' +
    'nichts bewiesen — dann wäre gar nicht sortiert worden.');

  /* ══ 6. Filtern über Knöpfe ══
     Nachgereicht auf „kannst du bitte auch machen, dass man zum
     Beispiel nur tägliche anzeigen kann, mit den Knöpfen".

     Die vorhandenen Knöpfe (Alle / Nur offene / Pausiert) sind EINE
     Auswahl. Rhythmus und Dringlichkeit sind eine zweite, unabhängige
     Frage: „nur offene" UND „nur tägliche" ist eine echte Kombination.
     Deshalb eine zweite Gruppe, durch einen Strich getrennt, die
     UND-verknüpft wird — und deren Knöpfe Schalter sind, nicht eine
     Auswahl: nochmal antippen macht sie wieder aus. */
  await page.evaluate(() => document.querySelector('[data-subview="putzplan"]').click());
  await page.waitForTimeout(600);
  await page.selectOption('#ppStudio', 'studio-6');
  await page.waitForTimeout(600);
  /* doneAt liegt HEUTE. Beim ersten Anlauf stand dort 5 (also 1970) —
     und isDone() verlangt für eine tägliche Aufgabe doneAt >= heute,
     weil sie sich täglich zurücksetzt. Die Zeile galt damit zu Recht
     als offen, und „Nur offene" sah aus, als filtere es nicht. */
  await page.evaluate((heute) => window.__nachschub('studios/studio-6/cleaning', [
    { id: 'a', title: 'Taeglich offen', recurring: 'daily', done: false, ts: 1 },
    { id: 'b', title: 'Taeglich fertig', recurring: 'daily', done: true, doneAt: heute, ts: 2 },
    { id: 'c', title: 'Woechentlich', recurring: 'weekly', done: false, ts: 3 },
    { id: 'd', title: 'Einmalig dringend', recurring: '', done: false, ts: 4, prio: 'hoch' },
    { id: 'e', title: 'Taeglich dringend', recurring: 'daily', done: false, ts: 5, prio: 'hoch' },
  ]), Date.now());
  await page.waitForTimeout(620);

  const klick = async (sel) => {
    await page.evaluate(s => document.querySelector(s).click(), sel);
    await page.waitForTimeout(360);
  };

  /* ── Die Trennung ist sichtbar und steht an beiden Stellen ──
     Aus der Rückmeldung: „kannst du die Trennung deutlicher machen,
     dieser Strich müsste auch noch zwischen Wöchentlich und Dringend."
     Zu Recht: Zustand, Rhythmus und Dringlichkeit sind DREI Fragen,
     nicht zwei. Und ein Trenner, den man nicht sieht, trennt nichts —
     1px in der leisen Linienfarbe war auf dem Handy nicht vom Abstand
     zwischen den Knöpfen zu unterscheiden. */
  const gruppen = await page.evaluate(() => {
    const zeile = document.querySelector('#view-putzplan .chip-row.werkzeugzeile');
    const teile = [...zeile.children].filter(c => c.getClientRects().length);
    return {
      folge: teile.map(c => c.classList.contains('chip-trenner') ? '|'
        : (c.textContent.trim().slice(0, 12) || c.tagName)),
      striche: [...zeile.querySelectorAll('.chip-trenner')]
        .filter(t => t.getClientRects().length)
        .map(t => Math.round(t.getBoundingClientRect().width)),
    };
  });
  pruefe('Es gibt ZWEI Trennstriche — drei Gruppen, drei Fragen',
    gruppen.striche.length === 2, JSON.stringify(gruppen.folge));
  pruefe('Sie stehen vor „Täglich" und vor „Dringend"',
    gruppen.folge.join(' ').indexOf('Pausiert | Täglich') >= 0 &&
    gruppen.folge.join(' ').indexOf('Wöchentlich | Dringend') >= 0,
    JSON.stringify(gruppen.folge));
  /* Breiter als eine Haarlinie, sonst verschwindet er neben dem
     Knopf-Abstand. */
  pruefe('Und sie sind breit genug, um aufzufallen',
    gruppen.striche.every(b => b >= 2), JSON.stringify(gruppen.striche) + ' px');

  pruefe('Ohne Filter stehen alle fünf da',
    (await ppTitel()).length === 5, JSON.stringify(await ppTitel()));

  await klick('[data-pprhy="daily"]');
  const nurTag = await ppTitel();
  pruefe('„Täglich" zeigt nur die täglichen (auch die erledigte)',
    nurTag.length === 3 && nurTag.every(t => /Taeglich/.test(t)),
    JSON.stringify(nurTag));

  await klick('[data-ppfilter="offen"]');
  const tagOffen = await ppTitel();
  /* Verglichen wird als MENGE, nicht als Folge: die Sortierung steht aus
     dem Abschnitt davor noch auf „Dringlichkeit", also kommt die
     dringende zuerst. Das ist richtig so — die Reihenfolge ist oben
     geprüft, hier geht es darum, WELCHE Zeilen übrig bleiben. */
  pruefe('„Täglich" UND „Nur offene" gelten zusammen',
    tagOffen.slice().sort().join('|') === 'Taeglich dringend|Taeglich offen',
    JSON.stringify(tagOffen) + ' — die erledigte tägliche muss jetzt weg ' +
    'sein; wäre es eine einzige Auswahl, hätte der zweite Klick den ersten ' +
    'aufgehoben.');

  await klick('[data-ppdring]');
  pruefe('Und „Dringend" kommt als dritte Bedingung dazu',
    (await ppTitel()).join('|') === 'Taeglich dringend',
    JSON.stringify(await ppTitel()));

  /* Ein Filter, den man nicht wieder loswird, ist eine Falle: ohne
     Ausschalten müsste man die Seite neu laden. */
  await klick('[data-pprhy="daily"]');
  pruefe('Nochmal antippen schaltet „Täglich" wieder aus',
    (await ppTitel()).slice().sort().join('|') === 'Einmalig dringend|Taeglich dringend',
    JSON.stringify(await ppTitel()) + ' — jetzt gilt nur noch offen+dringend.');
  await klick('[data-ppdring]');
  pruefe('Auch „Dringend" lässt sich wieder ausschalten',
    (await ppTitel()).length === 4,
    JSON.stringify(await ppTitel()) + ' — vier offene von fünf.');

  await klick('[data-pprhy="weekly"]');
  pruefe('„Wöchentlich" zeigt die wöchentliche',
    (await ppTitel()).join('|') === 'Woechentlich', JSON.stringify(await ppTitel()));
  /* Zwei Rhythmen zugleich gibt es nicht — eine Aufgabe hat genau
     einen. Der zweite Klick muss den ersten ablösen, nicht ergänzen. */
  await klick('[data-pprhy="daily"]');
  pruefe('(Gegenprobe) „Täglich" löst „Wöchentlich" ab, statt sich zu addieren',
    (await ppTitel()).every(t => /Taeglich/.test(t)) &&
    (await ppTitel()).length === 2,
    JSON.stringify(await ppTitel()));

  await b.close();
  pageErrs.forEach(e => { console.log('  ✗ ' + e); errs.push(e); });
}

console.log('\n── Listen organisieren: sortieren und filtern ──');
lauf()
  .catch(e => { console.log('  ✗ ' + e.message); errs.push(e.message); })
  .then(() => {
    console.log('');
    if (errs.length) {
      console.log('✗ ' + errs.length + ' Fund(e) bei der Sortierung');
      process.exitCode = 1;
    } else {
      console.log('✓ Sortieren und Filtern: überall dasselbe Feld, die Wahl ' +
        'bleibt, die Knöpfe lassen sich kombinieren und wieder ausschalten');
    }
  });
