/* ── Nachweise: selbst eintragen, mit mehr Angaben ────────────────────
   Aus dem Betrieb: „im Ich-Bereich soll man mehr optimieren können, wie
   die Lizenzen selber eintragen oder mehr Infos zu den Lizenzen."

   Das Selbst-Eintragen gab es schon, aber an einer Stelle, an der man
   es nicht sucht, und mit zwei Feldern. Beim Verlängern braucht man drei
   weitere: wo der Kurs war, wann er war, welche Nummer draufsteht.

   Was hier wirklich geprüft wird:

     1. Die neuen Angaben landen WIRKLICH in der Datenbank. Drei
        Eingabefelder, die nichts schreiben, sind schlimmer als keine.
     2. Der Ich-Bereich nennt die Art beim Namen. Vorher stand dort die
        rohe Kennung „ersthelfer" und bei „Sonstiges" nicht das, was
        jemand selbst hineingeschrieben hat.
     3. „selbst eingetragen" und „bestätigt" sind unterscheidbar — mit
        Gegenprobe, dass nicht einfach alles dieselbe Marke bekommt. Ohne
        den Unterschied wäre die Selbsteintragung ein Freibrief.
     4. Ein Ausstellungsdatum nach dem Ablauf wird abgefangen, statt
        stillschweigend gespeichert zu werden — korrigieren darf man nur
        bis zur Bestätigung.
     5. Der Chef sieht die Angaben AUCH. Wer bestätigt, ohne zu sehen,
        von wem der Nachweis ist, bestätigt eine Zeile.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
const pruefe = (b, m) => { if (!b) errs.push(m); };

const tag = d => {
  const x = new Date(); x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

/* Vier Nachweise für dasselbe Konto, absichtlich verschieden:
     z1  selbst eingetragen, mit allen freiwilligen Angaben
     z2  von der Verwaltung erfasst, ohne Zusatzangaben
     z3  selbst eingetragen UND bestätigt
     z4  „Sonstiges" mit eigener Bezeichnung
   Nur so lässt sich zeigen, dass die Marken auseinandergehalten
   werden — bei vier gleichen Zeilen wäre jede Behauptung wertlos. */
const CERTS = [
  { id: 'z1', uid: 'testuid', name: 'Test Chef', art: 'ersthelfer',
    bis: tag(200), erfasstVonUid: 'testuid', bestaetigt: false,
    aussteller: 'DRK Kreisverband Nord', von: tag(-500), nummer: 'EH-2024-8871',
    ts: Date.now() },
  { id: 'z2', uid: 'testuid', name: 'Test Chef', art: 'ems',
    bis: tag(300), erfasstVonUid: 'chefuid', ts: Date.now() },
  { id: 'z3', uid: 'testuid', name: 'Test Chef', art: 'hygiene',
    bis: tag(20), erfasstVonUid: 'testuid', bestaetigt: true,
    aussteller: 'IHK', ts: Date.now() },
  { id: 'z4', uid: 'testuid', name: 'Test Chef', art: 'sonstiges',
    bez: 'Ernährungsberater B', bis: tag(400),
    erfasstVonUid: 'testuid', bestaetigt: false, ts: Date.now() }
];

async function seite(b, certs) {
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
  await p.addInitScript(`window.__certs = ${JSON.stringify(certs)};`);
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2600);
  return p;
}

const ichDaten = p => p.evaluate(async () => {
  document.querySelector('.mobnav [data-group="g-ich"]').click();
  await new Promise(r => setTimeout(r, 400));
  document.querySelector('[data-ichtab="daten"]').click();
  await new Promise(r => setTimeout(r, 900));
});

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  // ══ 1. Ich-Bereich: Namen, Marken, Zusatzangaben ══
  {
    const p = await seite(b, CERTS);
    await ichDaten(p);
    const r = await p.evaluate(() => ({
      /* Nur der Titel, ohne die Marke daneben: die steht als eigenes
         Element IN derselben Zeile, und textContent würde beides
         zusammenkleben. */
      titel: [...document.querySelectorAll('#ichCerts .ich-was')]
        .map(x => (x.firstChild ? x.firstChild.textContent : '').trim()),
      marken: [...document.querySelectorAll('#ichCerts .ich-cert-mark')]
        .map(x => x.textContent.trim()),
      bestaetigt: document.querySelectorAll('#ichCerts .ich-cert-mark.ok').length,
      mehr: [...document.querySelectorAll('#ichCerts .ich-cert-mehr')]
        .map(x => x.textContent.trim()),
      knopfDa: (document.getElementById('ichCertNeu') || {}).offsetParent !== null,
      zahl: (document.getElementById('ichCertZahl') || {}).textContent || ''
    }));
    console.log('Titel:', JSON.stringify(r.titel));
    console.log('Marken:', JSON.stringify(r.marken));
    console.log('Zusatz:', JSON.stringify(r.mehr));

    pruefe(r.titel.length === 4, 'LISTE: ' + r.titel.length + ' statt 4 Nachweisen');
    /* Der eigentliche Fehler von vorher: die rohe Kennung. Exakt
       verglichen, nicht als Wortanfang — „EMS-Einweisung" fängt mit
       „ems" an und ist trotzdem richtig. */
    const ROH = ['ersthelfer', 'trainer', 'ems', 'hygiene', 'brandschutz', 'sonstiges'];
    pruefe(!r.titel.some(t => ROH.indexOf(t.toLowerCase()) >= 0),
      'NAME: es steht noch eine rohe Kennung da (' + JSON.stringify(r.titel) + ')');
    pruefe(r.titel.some(t => /Erste-Hilfe-Kurs/.test(t)),
      'NAME: „Erste-Hilfe-Kurs" fehlt (' + JSON.stringify(r.titel) + ')');
    pruefe(r.titel.some(t => /Ernährungsberater B/.test(t)),
      'NAME: bei „Sonstiges" steht nicht die eigene Bezeichnung (' +
      JSON.stringify(r.titel) + ')');

    /* Drei Marken: z1 und z4 selbst eingetragen, z3 bestätigt. z2 ist
       von der Verwaltung erfasst und bekommt KEINE — sonst wäre die
       Marke ohne Aussage. */
    pruefe(r.marken.length === 3,
      'MARKEN: ' + r.marken.length + ' statt 3 — der von der Verwaltung ' +
      'erfasste Nachweis darf keine tragen (' + JSON.stringify(r.marken) + ')');
    pruefe(r.bestaetigt === 1,
      'BESTÄTIGT: ' + r.bestaetigt + ' Nachweise gelten als bestätigt statt 1');
    pruefe(r.marken.filter(m => /selbst eingetragen/.test(m)).length === 2,
      'SELBST: ' + JSON.stringify(r.marken) + ' — erwartet zweimal ' +
      '„selbst eingetragen"');

    pruefe(r.mehr.length === 2,
      'ZUSATZ: ' + r.mehr.length + ' Zeilen statt 2 — wer nichts angegeben ' +
      'hat, darf keine leere Zeile bekommen');
    const eh = r.mehr.find(m => /DRK/.test(m)) || '';
    pruefe(/DRK Kreisverband Nord/.test(eh) && /Nr\. EH-2024-8871/.test(eh) && /seit/.test(eh),
      'ZUSATZ: die Angaben stehen unvollständig da (' + JSON.stringify(eh) + ')');
    pruefe(r.knopfDa, 'EINTRAGEN: der Knopf „Nachweis eintragen" fehlt im Ich-Bereich');
    pruefe(r.zahl === '4', 'ZAHL: „' + r.zahl + '" statt 4');

    // ══ 2. Der Knopf führt zum Formular, nicht ins Leere ══
    const hin = await p.evaluate(async () => {
      document.getElementById('ichCertNeu').click();
      await new Promise(r => setTimeout(r, 700));
      return {
        offen: document.getElementById('profileModal').classList.contains('show'),
        paneDa: (document.getElementById('pmPaneNachweise') || {}).style.display !== 'none',
        felder: ['myCertArt', 'myCertBis', 'myCertAussteller', 'myCertVon', 'myCertNummer']
          .filter(f => !!document.getElementById(f)),
        mehrZu: !(document.getElementById('myCertMehrBox') || {}).open
      };
    });
    console.log('Nach dem Knopf:', JSON.stringify(hin));
    pruefe(hin.offen && hin.paneDa,
      'EINTRAGEN: der Knopf landet nicht bei den Nachweisen (' +
      JSON.stringify(hin) + ')');
    pruefe(hin.felder.length === 5,
      'FELDER: nur ' + hin.felder.length + ' von 5 vorhanden (' +
      JSON.stringify(hin.felder) + ')');
    pruefe(hin.mehrZu,
      'FELDER: die freiwilligen Angaben stehen offen — der schnelle Weg ' +
      'soll zwei Felder bleiben');

    // ══ 3. Was beim Speichern geschrieben wird ══
    const neu = await p.evaluate(async () => {
      window.__schreib = [];
      document.getElementById('myCertMehrBox').open = true;
      document.getElementById('myCertArt').value = 'brandschutz';
      document.getElementById('myCertBis').value = '2028-06-30';
      document.getElementById('myCertAussteller').value = 'Feuerwehr Musterstadt';
      document.getElementById('myCertVon').value = '2025-06-30';
      document.getElementById('myCertNummer').value = 'BS-77/25';
      document.getElementById('myCertAdd').click();
      await new Promise(r => setTimeout(r, 700));
      return {
        schreib: (window.__schreib || [])
          .filter(w => /certificates/.test(w.pfad)),
        geleert: ['myCertAussteller', 'myCertVon', 'myCertNummer', 'myCertBis']
          .every(f => document.getElementById(f).value === ''),
        zu: !document.getElementById('myCertMehrBox').open
      };
    });
    console.log('Gespeichert:', JSON.stringify(neu.schreib));
    const w = neu.schreib[0];
    if (!w) errs.push('SPEICHERN: es wird gar nichts geschrieben');
    else {
      pruefe(w.daten.aussteller === 'Feuerwehr Musterstadt',
        'SPEICHERN: „ausgestellt von" fehlt (' + JSON.stringify(w.daten) + ')');
      pruefe(w.daten.von === '2025-06-30',
        'SPEICHERN: das Ausstellungsdatum fehlt (' + JSON.stringify(w.daten) + ')');
      pruefe(w.daten.nummer === 'BS-77/25',
        'SPEICHERN: die Nummer fehlt (' + JSON.stringify(w.daten) + ')');
      /* Die drei Felder, ohne die die Regel den Schreibvorgang abweist.
         Sie fielen bisher nicht auf, weil kein Durchlauf sie geprüft hat. */
      pruefe(w.daten.uid === 'testuid' && w.daten.erfasstVonUid === 'testuid',
        'SPEICHERN: uid/erfasstVonUid stimmen nicht (' + JSON.stringify(w.daten) +
        ') — daran hängt, ob „selbst eingetragen" eine Tatsache ist');
      pruefe(w.daten.bestaetigt === false,
        'SPEICHERN: bestaetigt ist nicht false (' + JSON.stringify(w.daten) +
        ') — die Regel weist den Schreibvorgang sonst ab');
    }
    pruefe(neu.geleert, 'SPEICHERN: die Felder bleiben nach dem Speichern gefüllt');
    pruefe(neu.zu, 'SPEICHERN: der Zusatzbereich bleibt offen stehen');

    // ══ 4. Ausgestellt nach Ablauf: abgefangen, nicht gespeichert ══
    const dreh = await p.evaluate(async () => {
      window.__schreib = [];
      document.getElementById('myCertMehrBox').open = true;
      document.getElementById('myCertArt').value = 'trainer';
      document.getElementById('myCertBis').value = '2026-01-01';
      document.getElementById('myCertVon').value = '2027-01-01';
      document.getElementById('myCertAdd').click();
      await new Promise(r => setTimeout(r, 600));
      return {
        schreib: (window.__schreib || []).filter(w => /certificates/.test(w.pfad)),
        meldung: (document.querySelector('.toast') || {}).textContent || ''
      };
    });
    console.log('Zahlendreher:', dreh.schreib.length, 'Schreibvorgänge ·',
      JSON.stringify(dreh.meldung.slice(0, 60)));
    pruefe(dreh.schreib.length === 0,
      'ZAHLENDREHER: ein Nachweis mit Ausstellung NACH dem Ablauf wurde ' +
      'gespeichert (' + JSON.stringify(dreh.schreib) + ')');
    pruefe(/nach dem Ablauf|Ausstellungsdatum/i.test(dreh.meldung),
      'ZAHLENDREHER: es kommt keine verständliche Meldung („' +
      dreh.meldung.slice(0, 60) + '")');
    await p.close();
  }

  /* ══ 5. GEGENPROBE: ohne Zusatzangaben keine Zusatzzeilen ══
     Ohne diesen Durchlauf wäre eine Anzeige, die IMMER eine Zeile malt,
     oben grün gewesen. */
  {
    const p = await seite(b, [
      { id: 'x1', uid: 'testuid', name: 'Test Chef', art: 'ersthelfer',
        bis: tag(100), erfasstVonUid: 'chefuid', ts: Date.now() }
    ]);
    await ichDaten(p);
    const r = await p.evaluate(() => ({
      mehr: document.querySelectorAll('#ichCerts .ich-cert-mehr').length,
      marken: document.querySelectorAll('#ichCerts .ich-cert-mark').length,
      titel: [...document.querySelectorAll('#ichCerts .ich-was')]
        .map(x => x.textContent.trim())
    }));
    console.log('Ohne Zusatz:', JSON.stringify(r));
    pruefe(r.mehr === 0,
      'GEGENPROBE: ohne Angaben steht trotzdem eine Zusatzzeile da (' +
      r.mehr + ')');
    pruefe(r.marken === 0,
      'GEGENPROBE: ein von der Verwaltung erfasster Nachweis trägt eine ' +
      'Marke (' + r.marken + ') — dann sagt die Marke nichts aus');
    pruefe(r.titel.length === 1 && /Erste-Hilfe-Kurs/.test(r.titel[0]),
      'GEGENPROBE: ' + JSON.stringify(r.titel));
    await p.close();
  }

  // ══ 6. Der Chef sieht die Angaben ebenfalls ══
  {
    const p = await seite(b, CERTS);
    const r = await p.evaluate(async () => {
      document.querySelector('.mobnav [data-group="g-chef"]').click();
      await new Promise(r => setTimeout(r, 700));
      document.querySelector('[data-cgo="nachweise"]').click();
      await new Promise(r => setTimeout(r, 900));
      return {
        mehr: [...document.querySelectorAll('#certList .cert-mehr')]
          .map(x => x.textContent.trim()),
        bestaetigen: document.querySelectorAll('#certList [data-certok]').length,
        zeilen: document.querySelectorAll('#certList .cert-item').length
      };
    });
    console.log('Verwaltung sieht:', JSON.stringify(r.mehr));
    console.log('  Zeilen:', r.zeilen, '· zu bestätigen:', r.bestaetigen);
    pruefe(r.zeilen === 4, 'VERWALTUNG: ' + r.zeilen + ' statt 4 Zeilen');
    pruefe(r.mehr.some(m => /DRK Kreisverband Nord/.test(m) && /Nr\. EH-2024-8871/.test(m)),
      'VERWALTUNG: die Zusatzangaben fehlen beim Bestätigen (' +
      JSON.stringify(r.mehr) + ') — wer nicht sieht, von wem der Nachweis ' +
      'ist, bestätigt eine Zeile statt eines Nachweises');
    pruefe(r.bestaetigen === 2,
      'VERWALTUNG: ' + r.bestaetigen + ' Knöpfe „bestätigen" statt 2 — der ' +
      'bereits bestätigte und der selbst erfasste brauchen keinen');
    await p.close();
  }

  await b.close();
  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Nachweise: Arten beim Namen, „selbst eingetragen" vs. „bestätigt" ' +
      'unterscheidbar, drei freiwillige Angaben landen in der Datenbank, ' +
      'Zahlendreher abgefangen — mit Gegenprobe');
  process.exit(errs.length ? 1 : 0);
})();
