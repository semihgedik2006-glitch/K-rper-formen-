/* ── Notizen für den Trainer-Alltag ───────────────────────────────────
   Aus dem Betrieb: „das Notizen-Interface soll auch hilfreicher werden
   für typische Notizen, die ein Trainer eben hat."

   Typisch ist: etwas über eine Kundin, etwas über eine Einheit, etwas
   zum Nachfassen. Eine einzige lange Liste zwingt einen, das jedes Mal
   aus dem Text herauszulesen.

   Was hier wirklich geprüft wird — vier Stellen, an denen ein Fehler
   teuer wäre:

     1. Ändern muss ein update sein und die Art MITSCHREIBEN. Ein set()
        würde „fest" und „ts" stillschweigend löschen: die angeheftete
        Notiz rutscht nach dem Korrigieren eines Tippfehlers nach unten
        und ist ohne Datum.
     2. Anheften muss sofort in die Datenbank und die Notiz nach oben
        holen. Ein Nadelsymbol, das nur die Farbe wechselt, ist die
        schlechtere Version von gar keinem.
     3. Filter und Suche müssen die Liste WIRKLICH schneiden — mit
        Gegenprobe, dass sie nicht einfach alles durchlassen. Ein Filter,
        der immer alles zeigt, wäre in beiden Richtungen grün, wenn man
        nur zählt, dass etwas dasteht.
     4. Der halb getippte Satz darf ein Neuzeichnen überleben. Der
        Horcher feuert auch, während jemand schreibt.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
const pruefe = (b, m) => { if (!b) errs.push(m); };

/* Sechs Notizen: mehr als die vier, ab denen Suche und Filter
   erscheinen. Bei genau vier wäre nicht zu sehen, ob die Schwelle
   stimmt oder die Zeile einfach immer da ist. */
const NOTIZEN = [
  { id: 'n1', text: 'Frau Berger: linkes Knie, keine tiefen Kniebeugen.',
    kategorie: 'kunde', fest: false, ts: 1000 },
  { id: 'n2', text: 'Beinpresse Studio Nord quietscht beim Zurückfahren.',
    kategorie: 'nachfassen', fest: false, ts: 2000 },
  { id: 'n3', text: 'Einheit Rücken: Sequenz mit Zug funktioniert gut.',
    kategorie: 'training', fest: false, ts: 3000 },
  { id: 'n4', text: 'Herr Klein fragt nach einem zweiten Termin pro Woche.',
    kategorie: 'kunde', fest: false, ts: 4000 },
  { id: 'n5', text: 'Handtücher nachbestellen.',
    kategorie: 'sonst', fest: false, ts: 5000 },
  { id: 'n6', text: 'Neue Kundin Montag: Erstgespräch vorbereiten.',
    kategorie: 'kunde', fest: false, ts: 6000 }
];

async function seite(b, notizen) {
  const p = await b.newPage({ viewport: { width: 430, height: 900 } });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  p.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text())) {
      errs.push('KONSOLE: ' + m.text().slice(0, 160));
    }
  });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  await p.addInitScript(`window.__privat = { notizen: ${JSON.stringify(notizen)} };`);
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2600);
  await p.evaluate(async () => {
    document.querySelector('.mobnav [data-group="g-ich"]').click();
    await new Promise(r => setTimeout(r, 400));
    document.querySelector('[data-ichtab="notizen"]').click();
    await new Promise(r => setTimeout(r, 600));
  });
  return p;
}

const liste = p => p.evaluate(() =>
  [...document.querySelectorAll('#ichNotizListe .ich-notiz p')]
    .map(x => x.textContent.trim().slice(0, 28)));

/* Nur die Schreibvorgänge auf die eigenen Notizen. Im Hintergrund läuft
   die Wochensicherung mit und schreibt nach „archives/…" — die stand
   beim ersten Durchlauf an Stelle 0 und hat vier Behauptungen rot
   gemacht, die mit der App nichts zu tun hatten. */
const nurNotizen = schreib =>
  (schreib || []).filter(w => /(^|\/)privat\/[^/]+\/notizen(\/|$)/.test(w.pfad));

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  // ══ 1. Ausgangslage: Arten sichtbar, neueste zuerst ══
  {
    const p = await seite(b, NOTIZEN);
    const start = await p.evaluate(() => ({
      arten: [...document.querySelectorAll('#ichNotizKats [data-nkat]')]
        .map(x => x.getAttribute('data-nkat')),
      gewaehlt: (document.querySelector('#ichNotizKats .ich-kat.an') || {})
        .getAttribute ? document.querySelector('#ichNotizKats .ich-kat.an')
          .getAttribute('data-nkat') : null,
      plaketten: [...document.querySelectorAll('#ichNotizListe .ich-quelle')]
        .map(x => x.textContent.trim()),
      nadeln: document.querySelectorAll('#ichNotizListe [data-nfest]').length,
      aendern: document.querySelectorAll('#ichNotizListe [data-nbearb]').length,
      suchzeileDa: (document.getElementById('ichNotizSuchen') || {}).offsetParent !== null,
      zahl: (document.getElementById('ichNotizZahl') || {}).textContent || ''
    }));
    const reihe = await liste(p);
    console.log('Arten:', JSON.stringify(start.arten), '· Vorgabe:', start.gewaehlt);
    console.log('Reihe:', JSON.stringify(reihe.map(t => t.slice(0, 14))));
    console.log('Zahl:', JSON.stringify(start.zahl), '· Suchzeile:', start.suchzeileDa);

    pruefe(JSON.stringify(start.arten) ===
      JSON.stringify(['sonst', 'kunde', 'training', 'nachfassen']),
      'ARTEN: die Leiste zeigt ' + JSON.stringify(start.arten));
    pruefe(start.gewaehlt === 'sonst',
      'VORGABE: vorgewählt ist „' + start.gewaehlt + '" — wer nur schnell etwas ' +
      'festhalten will, darf nichts auswählen müssen');
    pruefe(reihe.length === 6, 'LISTE: ' + reihe.length + ' Notizen statt 6');
    pruefe(/Neue Kundin/.test(reihe[0] || ''),
      'REIHENFOLGE: oben steht „' + (reihe[0] || '') + '" statt der neuesten');
    pruefe(start.plaketten.length === 6,
      'PLAKETTEN: ' + start.plaketten.length + ' von 6 Notizen nennen ihre Art');
    pruefe(start.nadeln === 6 && start.aendern === 6,
      'KNÖPFE: ' + start.nadeln + ' Nadeln, ' + start.aendern + ' mal Ändern (je 6 erwartet)');
    pruefe(start.suchzeileDa,
      'SUCHZEILE: bei 6 Notizen ist sie nicht sichtbar');

    // ══ 2. Ändern: update, und die Art fährt mit ══
    const geaendert = await p.evaluate(async () => {
      window.__schreib = [];
      document.querySelector('#ichNotizListe [data-nbearb]').click();
      await new Promise(r => setTimeout(r, 300));
      const feld = document.querySelector('#ichNotizListe [data-nfeld]');
      const wahlDa = document.querySelectorAll('#ichNotizListe [data-nsetz]').length;
      feld.value = 'Neue Kundin Montag: Erstgespräch mit Anamnese.';
      // Art umstellen: von kunde auf nachfassen
      document.querySelector('#ichNotizListe [data-nsetz="nachfassen"]').click();
      await new Promise(r => setTimeout(r, 150));
      document.querySelector('#ichNotizListe [data-nspeichern]').click();
      await new Promise(r => setTimeout(r, 400));
      return { wahlDa, schreib: window.__schreib.slice(),
        feldWeg: !document.querySelector('#ichNotizListe [data-nfeld]') };
    });
    const nSchreib = nurNotizen(geaendert.schreib);
    console.log('Ändern schreibt:', JSON.stringify(nSchreib));
    pruefe(geaendert.wahlDa === 4,
      'ÄNDERN: im offenen Feld stehen ' + geaendert.wahlDa + ' Arten statt 4 — ' +
      'wer die Art nicht mitkorrigieren kann, muss die Notiz neu schreiben');
    const w = nSchreib[0];
    if (!w) errs.push('ÄNDERN: es wird gar nichts geschrieben');
    else {
      pruefe(w.art === 'update',
        'ÄNDERN: geschrieben wurde per ' + (w.art || 'set') + ' — ein set() ' +
        'löscht „fest" und „ts" stillschweigend mit');
      pruefe(/privat\/[^/]+\/notizen\/n6$/.test(w.pfad),
        'ÄNDERN: geschrieben wurde nach „' + w.pfad + '"');
      pruefe(w.daten && w.daten.kategorie === 'nachfassen',
        'ÄNDERN: die Art landet nicht mit (' + JSON.stringify(w.daten) + ')');
      pruefe(w.daten && /Anamnese/.test(w.daten.text || ''),
        'ÄNDERN: der neue Text fehlt (' + JSON.stringify(w.daten) + ')');
      pruefe(!('ts' in (w.daten || {})) && !('fest' in (w.daten || {})),
        'ÄNDERN: es werden Felder mitgeschrieben, die niemand geändert hat: ' +
        JSON.stringify(Object.keys(w.daten || {})));
    }
    pruefe(geaendert.feldWeg, 'ÄNDERN: das Feld bleibt nach dem Speichern offen');

    // ══ 3. Anheften: schreibt sofort, und zwar den Gegenwert ══
    const fest = await p.evaluate(async () => {
      window.__schreib = [];
      document.querySelector('#ichNotizListe [data-nfest]').click();
      await new Promise(r => setTimeout(r, 350));
      return window.__schreib.slice();
    });
    console.log('Anheften schreibt:', JSON.stringify(nurNotizen(fest)));
    const f = nurNotizen(fest)[0];
    if (!f) errs.push('ANHEFTEN: die Nadel schreibt nichts');
    else {
      pruefe(f.art === 'update' && f.daten && f.daten.fest === true,
        'ANHEFTEN: geschrieben wurde ' + JSON.stringify(f) + ' — erwartet fest:true');
    }
    await p.close();
  }

  /* ══ 4. Angeheftetes steht oben — auch wenn es das Älteste ist ══
     Getrennter Durchlauf mit vorbelegtem Zustand: die Anzeige speist sich
     aus dem Horcher, und der liefert im Test keine Änderung nach. */
  {
    const p = await seite(b, NOTIZEN.map(n =>
      n.id === 'n1' ? Object.assign({}, n, { fest: true }) : n));
    const r = await p.evaluate(() => ({
      reihe: [...document.querySelectorAll('#ichNotizListe .ich-notiz p')]
        .map(x => x.textContent.trim().slice(0, 14)),
      obenFest: (document.querySelector('#ichNotizListe .ich-notiz') || {})
        .className || '',
      nadelAn: document.querySelectorAll('#ichNotizListe .ich-nadel.an').length
    }));
    console.log('Mit Angeheftetem:', JSON.stringify(r.reihe));
    pruefe(/Frau Berger/.test(r.reihe[0] || ''),
      'ANHEFTEN: oben steht „' + (r.reihe[0] || '') + '" — die angeheftete ' +
      'Notiz ist die älteste und muss trotzdem zuerst kommen');
    pruefe(/\bfest\b/.test(r.obenFest),
      'ANHEFTEN: die oberste Karte ist nicht als angeheftet erkennbar (' +
      r.obenFest + ')');
    pruefe(r.nadelAn === 1,
      'ANHEFTEN: ' + r.nadelAn + ' Nadeln stehen auf an statt 1');
    await p.close();
  }

  // ══ 5. Filter und Suche — mit Gegenprobe ══
  {
    const p = await seite(b, NOTIZEN);
    const vorher = await liste(p);

    const gefiltert = await p.evaluate(async () => {
      document.querySelector('#ichNotizFilter [data-nfilter="kunde"]').click();
      await new Promise(r => setTimeout(r, 300));
      return {
        texte: [...document.querySelectorAll('#ichNotizListe .ich-notiz p')]
          .map(x => x.textContent.trim().slice(0, 14)),
        zahl: (document.getElementById('ichNotizZahl') || {}).textContent || ''
      };
    });
    console.log('Filter „kunde":', JSON.stringify(gefiltert.texte), '·', gefiltert.zahl);
    pruefe(gefiltert.texte.length === 3,
      'FILTER: „Kundin/Kunde" zeigt ' + gefiltert.texte.length + ' statt 3 Notizen');
    /* Gegenprobe: der Filter darf nicht einfach alles durchlassen. Ohne
       diese Zeile wäre ein Filter, der nichts tut, grün. */
    pruefe(gefiltert.texte.length < vorher.length,
      'FILTER OHNE WIRKUNG: gefiltert stehen genauso viele Notizen da wie ' +
      'vorher (' + gefiltert.texte.length + ' von ' + vorher.length + ')');
    pruefe(!gefiltert.texte.some(t => /Handtücher/.test(t)),
      'FILTER: eine fremde Art steht noch in der Liste (' +
      JSON.stringify(gefiltert.texte) + ')');
    pruefe(/3 von 6/.test(gefiltert.zahl),
      'ZAHL: über der Liste steht „' + gefiltert.zahl + '" — bei gesetztem ' +
      'Filter muss erkennbar sein, dass etwas fehlt');

    const gesucht = await p.evaluate(async () => {
      document.querySelector('#ichNotizFilter [data-nfilter=""]').click();
      await new Promise(r => setTimeout(r, 200));
      const s = document.getElementById('ichNotizSuche');
      s.value = 'knie';
      s.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 300));
      return [...document.querySelectorAll('#ichNotizListe .ich-notiz p')]
        .map(x => x.textContent.trim().slice(0, 14));
    });
    console.log('Suche „knie":', JSON.stringify(gesucht));
    pruefe(gesucht.length === 1 && /Frau Berger/.test(gesucht[0] || ''),
      'SUCHE: „knie" findet ' + JSON.stringify(gesucht) + ' — erwartet nur ' +
      'die Notiz zu Frau Berger, und zwar unabhängig von der Groß-/Kleinschreibung');

    const leer = await p.evaluate(async () => {
      const s = document.getElementById('ichNotizSuche');
      s.value = 'zzzz';
      s.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 300));
      return {
        karten: document.querySelectorAll('#ichNotizListe .ich-notiz').length,
        text: (document.getElementById('ichNotizListe') || {}).textContent || ''
      };
    });
    console.log('Suche ohne Treffer:', leer.karten, '·', JSON.stringify(leer.text.slice(0, 60)));
    pruefe(leer.karten === 0,
      'SUCHE: ohne Treffer stehen noch ' + leer.karten + ' Notizen da');
    pruefe(/gefunden|Andere Art/.test(leer.text),
      'SUCHE: ohne Treffer steht keine Erklärung da — eine leere Fläche ' +
      'sieht aus, als wären die Notizen weg');
    await p.close();
  }

  /* ══ 6. Wenig Notizen: keine Bedienelemente ohne Aufgabe ══
     Gegenprobe zu Punkt 1. Erschiene die Zeile immer, wäre die Schwelle
     nie geprüft. */
  {
    const p = await seite(b, NOTIZEN.slice(0, 2));
    const r = await p.evaluate(() => ({
      suchzeile: (document.getElementById('ichNotizSuchen') || {}).offsetParent !== null,
      karten: document.querySelectorAll('#ichNotizListe .ich-notiz').length,
      zahl: (document.getElementById('ichNotizZahl') || {}).textContent || ''
    }));
    console.log('Bei 2 Notizen — Suchzeile:', r.suchzeile, '· Zahl:', JSON.stringify(r.zahl));
    pruefe(!r.suchzeile,
      'SUCHZEILE: sie steht schon bei 2 Notizen da und löst ein Problem, ' +
      'das es nicht gibt');
    pruefe(r.karten === 2, 'LISTE: ' + r.karten + ' statt 2 Notizen');
    pruefe(/2 Notizen/.test(r.zahl), 'ZAHL: „' + r.zahl + '" statt „2 Notizen"');
    await p.close();
  }

  // ══ 7. Neu anlegen: die Art fährt mit ══
  {
    const p = await seite(b, NOTIZEN.slice(0, 2));
    const neu = await p.evaluate(async () => {
      window.__schreib = [];
      document.querySelector('#ichNotizKats [data-nkat="training"]').click();
      await new Promise(r => setTimeout(r, 150));
      const feld = document.getElementById('ichNotizNeu');
      feld.value = 'Zirkel neu sortiert, Reihenfolge merken.';
      document.getElementById('ichNotizAdd').click();
      await new Promise(r => setTimeout(r, 500));
      return { schreib: window.__schreib.slice(), feldLeer: feld.value === '',
        artBleibt: (document.querySelector('#ichNotizKats .ich-kat.an') || {})
          .getAttribute ? document.querySelector('#ichNotizKats .ich-kat.an')
            .getAttribute('data-nkat') : null };
    });
    console.log('Neu:', JSON.stringify(nurNotizen(neu.schreib)), '· Art bleibt:', neu.artBleibt);
    const n = nurNotizen(neu.schreib)[0];
    if (!n) errs.push('NEU: das Speichern schreibt nichts');
    else {
      pruefe(n.daten && n.daten.kategorie === 'training',
        'NEU: die gewählte Art landet nicht mit (' + JSON.stringify(n.daten) + ')');
      pruefe(n.daten && n.daten.fest === false,
        'NEU: „fest" fehlt (' + JSON.stringify(n.daten) + ') — ohne das Feld ' +
        'kann die Regel es später nicht von einem fremden Feld unterscheiden');
      pruefe(n.daten && typeof n.daten.ts === 'number',
        'NEU: kein Zeitstempel (' + JSON.stringify(n.daten) + ')');
    }
    pruefe(neu.feldLeer, 'NEU: das Eingabefeld wird nach dem Speichern nicht geleert');
    pruefe(neu.artBleibt === 'training',
      'NEU: die Art springt nach dem Speichern zurück auf „' + neu.artBleibt +
      '" — wer mehrere Notizen derselben Art schreibt, wählt sie jedes Mal neu');
    await p.close();
  }

  /* ══ 8. Der halb getippte Satz überlebt ein Neuzeichnen ══
     Der Horcher feuert auch, während jemand schreibt. Ohne Schutz wäre
     der Text weg — ohne jede Meldung. */
  {
    const p = await seite(b, NOTIZEN);
    /* renderIchNotizen liegt im IIFE und ist von aussen nicht aufrufbar.
       Ein Ereignis am Suchfeld zeichnet dieselbe Liste neu — das ist der
       Weg, den auch der Horcher nimmt. */
    const r = await p.evaluate(async () => {
      document.querySelector('#ichNotizListe [data-nbearb]').click();
      await new Promise(r => setTimeout(r, 300));
      const feld = document.querySelector('#ichNotizListe [data-nfeld]');
      if (!feld) return { text: null, offen: false };
      feld.value = 'Halb getippter Satz, noch nicht gespeichert';
      document.getElementById('ichNotizSuche')
        .dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 250));
      const jetzt = document.querySelector('#ichNotizListe [data-nfeld]');
      return { text: jetzt ? jetzt.value : null, offen: true };
    });
    console.log('Nach Neuzeichnen im Feld:', JSON.stringify(r.text));
    pruefe(r.offen, 'TIPPEN: das Änderungsfeld liess sich nicht öffnen');
    pruefe(/Halb getippter/.test(r.text || ''),
      'TIPPEN: nach einem Neuzeichnen steht im Feld ' + JSON.stringify(r.text) +
      ' — der halb getippte Satz ist weg');
    await p.close();
  }

  await b.close();
  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Notizen: vier Arten mit Vorgabe, Ändern schreibt ein update samt Art, ' +
      'Angeheftetes steht oben, Filter und Suche schneiden wirklich — mit Gegenproben');
  process.exit(errs.length ? 1 : 0);
})();
