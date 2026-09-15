/* ── Demo-Modus: laeuft er, und geht wirklich nichts nach draussen? ───

   Der Demo-Modus (index.html?demo) ist Punkt A3 aus docs/VERKAUF.md:
   wer ueber StudioChat nachdenkt, soll die App ansehen koennen, ohne ein
   Konto anzulegen. Er ersetzt Firebase durch eine kleine Datenbank im
   Browser.

   DIE ZUSAGE, AUF DIE ES ANKOMMT, IST NICHT „die Demo laeuft", SONDERN
   „kein Byte verlaesst den Browser". Die erste sieht man beim Vorfuehren
   sofort. Die zweite sieht man nie — und genau deshalb muss sie gemessen
   werden statt behauptet. Dieser Durchlauf zaehlt jede Anfrage, die die
   Seite absetzt, und prueft, dass keine davon zu Google, Firebase oder
   sonst irgendwohin geht.

   Geprueft wird:
     1. Ohne ?demo aendert sich NICHTS. Keine Demo-Leiste, kein Laden von
        demo-daten.js, html traegt die Klasse nicht. Das ist die
        wichtigste Pruefung der Datei: die Leiste verkleinert .app, und
        ein Versehen wuerde jede Ansicht der echten App stauchen.
     2. Mit ?demo startet die App bis zur Startseite durch — ohne
        Anmeldung.
     3. KEINE Anfrage an firestore/firebase/googleapis. Das SDK wird zwar
        geladen (es steht als <script> in der Seite), darf aber keine
        Verbindung aufbauen, weil initializeApp gar nicht mehr bei ihm
        landet.
     4. Die Daten sind da und sehen nach Betrieb aus: Studios, Aufgaben,
        Nachrichten.
     5. Schreiben wirkt WIRKLICH. Eine Aufgabe abhaken muss die Zahl auf
        der Startseite aendern — das ist der Unterschied zur
        Test-Attrappe, die Schreibvorgaenge verwirft, und der Grund,
        warum es demo-daten.js ueberhaupt gibt.
     6. Der Rollenwechsel fuehrt zu einem anderen Ausschnitt. Der Chef
        sieht vierzehn Studios, der Mitarbeiter eins.
     7. Die rechtlichen Pflichtfelder bleiben LEER und behaupten nichts.

   NICHT GEPRUEFT: wie die Demo auf einem echten Handy aussieht, und ob
   ein Interessent sie versteht. Das erste liesse sich messen, das zweite
   nicht — und beides gehoert in eine Vorfuehrung, nicht in einen
   Durchlauf.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* UMGEKEHRT GEDACHT: nicht eine Liste des Verbotenen, sondern eine des
   Erlaubten. Der erste Anlauf suchte nach Wörtern wie „firestore" und
   „googleapis" — und schlug bei der Schriftart (fonts.googleapis.com)
   und bei der SDK-Datei selbst an (firebase-firestore-compat.js trägt
   das Wort im Dateinamen). Beides ist harmlos, beides hätte den
   Durchlauf dauerhaft rot gehalten.

   Eine Liste des Verbotenen ist außerdem die schwächere Bauart: sie
   findet nur, woran jemand gedacht hat. Hier steht deshalb, was die
   Demo anfassen DARF — die eigene Adresse, die Schriften und die
   Programmbibliothek. Jede andere Anfrage ist ein Fund, auch eine, die
   es heute noch gar nicht gibt. */
const ERLAUBT = [
  /^http:\/\/127\.0\.0\.1:8765\//,
  /^https:\/\/fonts\.googleapis\.com\//,
  /^https:\/\/fonts\.gstatic\.com\//,
  /^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/[a-z-]+\.js$/,
  /^data:/, /^blob:/
];
function nachDraussen(u) { return !ERLAUBT.some(r => r.test(u)); }

async function seite(b, url, errs, marke) {
  const page = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 2 });
  const anfragen = [];
  page.on('request', r => anfragen.push(r.url()));
  page.on('pageerror', e => errs.push('PAGEERROR (' + marke + '): ' + e.message.slice(0, 160)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load|net::/.test(m.text())) {
      errs.push('CONSOLE (' + marke + '): ' + m.text().slice(0, 160));
    }
  });
  /* Schriften und das SDK werden abgeklemmt, WEIL DIESER RECHNER KEIN
     NETZ HAT — sonst haengt page.goto 30 Sekunden und der Durchlauf
     misst eine Zeitueberschreitung statt der Demo. Die Anfragen werden
     trotzdem gezaehlt (page.on('request') feuert vor dem Abbruch), und
     genau darum geht es: das SDK DARF geladen werden, es darf nur nichts
     tun. Eine Verbindung zu firestore oder googleapis waere ein Fehler
     und wird unten geprueft. */
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**fonts.gstatic.com/**', r => r.abort());
  await page.route('**://www.gstatic.com/firebasejs/**', r => r.abort());
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3200);
  return { page, anfragen };
}

(async () => {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  /* ── 1. Ohne ?demo darf sich nichts aendern ── */
  {
    const { page, anfragen } = await seite(b, APP, errs, 'ohne demo');
    const z = await page.evaluate(() => ({
      klasse: document.documentElement.classList.contains('demo'),
      leiste: getComputedStyle(document.getElementById('demoBar')).display,
      appHoehe: getComputedStyle(document.getElementById('app')).height
    }));
    console.log('OHNE DEMO:', JSON.stringify(z));
    if (z.klasse) errs.push('Ohne ?demo traegt <html> trotzdem die Klasse demo');
    if (z.leiste !== 'none') errs.push('Ohne ?demo ist die Demo-Leiste sichtbar (' + z.leiste + ')');
    if (anfragen.some(u => /demo-daten\.js/.test(u))) {
      errs.push('Ohne ?demo wird demo-daten.js trotzdem geladen');
    }
    await page.close();
  }

  /* ── 2-4. Mit ?demo ── */
  const { page, anfragen } = await seite(b, APP + '?demo=chef', errs, 'demo=chef');

  const start = await page.evaluate(() => {
    const app = document.getElementById('app');
    return {
      klasse: document.documentElement.classList.contains('demo'),
      appSichtbar: !!(app && app.classList.contains('show')),
      leiste: getComputedStyle(document.getElementById('demoBar')).display,
      leisteText: (document.getElementById('demoBar').textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70),
      rolle: (document.getElementById('demoRolle') || {}).value,
      noindex: !!document.querySelector('meta[name="robots"][content*="noindex"]'),
      anmeldung: getComputedStyle(document.querySelector('.auth-wrap') || document.body).display
    };
  });
  console.log('MIT DEMO:', JSON.stringify(start));
  if (!start.klasse) errs.push('Mit ?demo fehlt die Klasse demo auf <html>');
  if (!start.appSichtbar) errs.push('Die App ist mit ?demo nicht durchgestartet — die Anmeldung steht noch davor');
  if (start.leiste === 'none') errs.push('Die Demo-Leiste ist nicht zu sehen');
  if (!/Demo/i.test(start.leisteText)) errs.push('Die Demo-Leiste sagt nicht, dass es eine Demo ist');
  if (start.rolle !== 'chef') errs.push('Der Rollenumschalter steht nicht auf chef');
  if (!start.noindex) errs.push('Kein noindex — die Demo koennte in Suchergebnissen landen');

  /* ── 3. Die Kernzusage ── */
  const raus = anfragen.filter(nachDraussen);
  console.log('ANFRAGEN gesamt:', anfragen.length, '· nach draussen:', raus.length);
  if (raus.length) {
    errs.push('DEMO SPRICHT NACH DRAUSSEN: ' + raus.slice(0, 3).join(' | '));
  }
  /* Gegenprobe zur Messung: wenn gar keine Anfragen gezaehlt wurden,
     misst dieser Abschnitt nichts und waere auch bei einer undichten
     Demo gruen. */
  if (anfragen.length < 3) {
    errs.push('Nur ' + anfragen.length + ' Anfragen gezaehlt — die Messung greift nicht');
  }

  /* ── 4. Sind Daten da? ── */
  const daten = await page.evaluate(() => {
    const t = [...document.querySelectorAll('.home-tile .hn')].map(e => e.textContent.trim());
    return {
      kacheln: t,
      summe: t.reduce((s, x) => s + (parseInt(x, 10) || 0), 0),
      titel: (document.getElementById('topTitle') || {}).textContent || ''
    };
  });
  console.log('DATEN:', JSON.stringify(daten));
  if (!daten.kacheln.length) errs.push('Die Startseite zeigt keine Kennzahlen-Kacheln');
  if (daten.summe === 0) errs.push('Alle Kacheln stehen auf 0 — die Demo-Daten kommen nicht an');

  /* ── 5. Schreiben muss wirken ── */
  const vorher = daten.summe;
  const geschrieben = await page.evaluate(async () => {
    // Zu den Aufgaben und dort die erste offene abhaken.
    document.querySelector('.mobnav [data-group="g-arbeit"]').click();
    await new Promise(r => setTimeout(r, 400));
    const tb = document.querySelector('[data-subview="todos"]');
    if (tb) tb.click();
    await new Promise(r => setTimeout(r, 1200));
    const offen = [...document.querySelectorAll('.todo:not(.done) .check')];
    if (!offen.length) return { fehler: 'keine offene Aufgabe gefunden' };
    const vorher = offen.length;
    const id = offen[0].closest('.todo').dataset.id;
    offen[0].click();
    await new Promise(r => setTimeout(r, 1200));
    /* NICHT den alten Knoten befragen. Die Aufgabenliste zeichnet sich
       nach dem Schreiben neu, und der festgehaltene Knoten haengt dann
       in keinem Dokument mehr — er traegt für immer den alten Zustand.
       Genau daran ist der erste Anlauf gescheitert: die Startseite hatte
       die Zahl längst geändert, meine Prüfung sah einen Leichnam. */
    const jetzt = document.querySelector('.todo[data-id="' + id + '"]');
    return {
      fehler: null, id: id,
      offenVorher: vorher,
      offenNachher: document.querySelectorAll('.todo:not(.done) .check').length,
      zeileAbgehakt: jetzt ? jetzt.classList.contains('done') : null
    };
  });
  console.log('SCHREIBEN:', JSON.stringify(geschrieben));
  if (geschrieben.fehler) errs.push('Schreibprobe: ' + geschrieben.fehler);
  else if (!(geschrieben.offenNachher < geschrieben.offenVorher) && geschrieben.zeileAbgehakt !== true) {
    errs.push('Abhaken wirkt nicht: ' + geschrieben.offenVorher + ' offene vorher, ' +
      geschrieben.offenNachher + ' nachher, Zeile abgehakt: ' + geschrieben.zeileAbgehakt +
      '. Genau dafuer gibt es demo-daten.js statt der Test-Attrappe.');
  }

  // Und die Startseite muss es mitbekommen haben.
  const nachher = await page.evaluate(async () => {
    document.querySelector('.mobnav [data-group="g-start"]').click();
    await new Promise(r => setTimeout(r, 1400));
    const t = [...document.querySelectorAll('.home-tile .hn')].map(e => e.textContent.trim());
    return t.reduce((s, x) => s + (parseInt(x, 10) || 0), 0);
  });
  console.log('KACHELSUMME vorher/nachher:', vorher, '/', nachher);
  if (vorher === nachher) {
    errs.push('Die Startseite hat den Schreibvorgang nicht bemerkt (' + vorher + ' -> ' + nachher +
      ') — die Zuhoerer der Demo-Datenbank feuern nicht nach');
  }
  await page.close();

  /* ── 6. Andere Rolle, anderer Ausschnitt ── */
  const { page: p2 } = await seite(b, APP + '?demo=mitarbeiter', errs, 'demo=mitarbeiter');
  const ma = await p2.evaluate(() => ({
    rolle: (document.getElementById('demoRolle') || {}).value,
    chefGruppe: !!document.querySelector('.mobnav [data-group="g-chef"]:not([style*="display: none"])'),
    kanaele: document.querySelectorAll('.chan').length
  }));
  const { page: p3 } = await seite(b, APP + '?demo=chef', errs, 'demo=chef2');
  const ch = await p3.evaluate(() => ({ kanaele: document.querySelectorAll('.chan').length }));
  console.log('ROLLEN: Mitarbeiter', JSON.stringify(ma), '· Chef-Kanaele', ch.kanaele);
  if (ma.rolle !== 'mitarbeiter') errs.push('?demo=mitarbeiter stellt den Umschalter nicht um');
  if (!(ch.kanaele > ma.kanaele)) {
    errs.push('Der Chef sieht nicht mehr Kanaele als der Mitarbeiter (' +
      ch.kanaele + ' vs ' + ma.kanaele + ') — der Rollenwechsel aendert den Ausschnitt nicht');
  }
  await p2.close();

  /* ── 8. Die Zeiterfassung muss in der Demo wirklich laufen ────────
     Das ist der Teil, den ein Interessent sehen will und der am
     leichtesten eine Attrappe bleibt: ein Knopf, der nichts tut. Wer in
     einer Vorführung stempelt und nichts passiert, hält nicht die Demo
     für kaputt, sondern die App. */
  {
    const { page: p4, anfragen: a4 } = await seite(b, APP + '?demo=terminal', errs, 'demo=terminal');
    const term = await p4.evaluate(() => {
      const s = document.getElementById('terminalSchirm');
      return {
        sichtbar: getComputedStyle(s).display !== 'none',
        obenFrei: parseInt(getComputedStyle(s).top, 10) || 0,
        leiste: getComputedStyle(document.getElementById('demoBar')).display !== 'none',
        studio: (document.getElementById('tmStudio') || {}).textContent || '',
        leute: document.querySelectorAll('#tmListe [data-tmwer]').length,
        hinweis: (document.getElementById('tmHinweis') || {}).textContent || '',
        raus: (document.getElementById('tmAus') || {}).textContent || '',
        imDienst: [...document.querySelectorAll('#tmListe .tm-zst')]
          .filter(n => /im Dienst|Pause/.test(n.textContent)).length
      };
    });
    console.log('TERMINAL:', JSON.stringify(term));
    if (!term.sichtbar) errs.push('?demo=terminal zeigt den Stempel-Bildschirm nicht');
    if (!term.leiste) errs.push('Im Terminal-Modus fehlt die Demo-Leiste');
    if (!(term.obenFrei >= 40)) {
      errs.push('Der Terminal-Bildschirm liegt über der Demo-Leiste (top=' + term.obenFrei +
        ') — dann kommt man aus der Vorführung nicht mehr heraus');
    }
    if (!term.leute) errs.push('Im Terminal steht niemand zum Antippen');
    if (!/\d{4}/.test(term.hinweis)) {
      errs.push('Der Hinweis nennt die Demo-PIN nicht: „' + term.hinweis + '" — ' +
        'ein Interessent tippt sonst dreimal daneben');
    }
    if (!/Zurück/.test(term.raus)) {
      errs.push('„Terminal beenden" führt in der Demo in eine Schleife statt zurück zur App');
    }
    if (!term.imDienst) errs.push('Niemand ist eingestempelt — die Demo zeigt den Normalfall nicht');

    /* Und jetzt wirklich stempeln. */
    const pin = (/(\d{4,6})/.exec(term.hinweis) || [])[1];
    const gestempelt = await p4.evaluate(async (p) => {
      const vorher = document.querySelectorAll('#tmListe .tm-person.da').length;
      // Jemanden nehmen, der noch NICHT da ist — sonst sieht man nichts.
      const frei = [...document.querySelectorAll('#tmListe [data-tmwer]')]
        .find(b => !b.classList.contains('da'));
      if (!frei) return { fehler: 'alle sind schon eingestempelt' };
      const name = (frei.querySelector('.tm-nam') || {}).textContent;
      frei.click();
      await new Promise(r => setTimeout(r, 300));
      String(p).split('').forEach(z => {
        const t = document.querySelector('#tmTasten [data-tmt="' + z + '"]');
        if (t) t.click();
      });
      document.querySelector('#tmTasten [data-tmt="ok"]').click();
      await new Promise(r => setTimeout(r, 900));
      return {
        fehler: null, name,
        meldung: (document.getElementById('toast') || {}).textContent || '',
        daVorher: vorher,
        daNachher: document.querySelectorAll('#tmListe .tm-person.da').length
      };
    }, pin);
    console.log('DEMO-STEMPEL:', JSON.stringify(gestempelt));
    if (gestempelt.fehler) errs.push('Stempelprobe: ' + gestempelt.fehler);
    else {
      if (!/Kommen|Pause|Zurück|Feierabend/.test(gestempelt.meldung)) {
        errs.push('Das Stempeln meldet nichts Brauchbares: „' + gestempelt.meldung + '"');
      }
      if (!(gestempelt.daNachher > gestempelt.daVorher)) {
        errs.push('Nach dem Stempeln ist niemand zusätzlich im Dienst (' +
          gestempelt.daVorher + ' → ' + gestempelt.daNachher + ') — der Knopf tut nichts');
      }
    }

    const rausT = a4.filter(nachDraussen);
    if (rausT.length) errs.push('Der Terminal-Modus spricht nach draussen: ' + rausT.slice(0, 2).join(' | '));

    /* Und die Öffnungszeiten müssen gepflegt sein — ohne sie lässt sich
       „wie lange war der Laden unbeaufsichtigt" nicht vorführen. */
    await p4.close();
    const { page: p5 } = await seite(b, APP + '?demo=chef', errs, 'demo=chef3');
    const oz = await p5.evaluate(async () => {
      document.querySelector('.mobnav [data-group="g-chef"]').click();
      await new Promise(r => setTimeout(r, 500));
      const t = [...document.querySelectorAll('#view-chef button')]
        .find(x => /^\s*Studios\s*$/.test(x.textContent || ''));
      if (t) t.click();
      await new Promise(r => setTimeout(r, 900));
      return {
        zeitKnoepfe: [...document.querySelectorAll('#standortListe [data-stzeit]')]
          .map(b => b.textContent.trim()),
        terminals: document.querySelectorAll('#terminalListe [data-termweg]').length
      };
    });
    console.log('DEMO-CHEF:', JSON.stringify(oz).slice(0, 200));
    /* „Zeiten" ist die Beschriftung, solange NICHTS gepflegt ist. Steht
       dort eine Uhrzeit oder eine Tageszahl, ist etwas hinterlegt.

       Hier stand zuerst „muss eine Uhrzeit enthalten". Das war meine
       falsche Erwartung, nicht ein Fehler der App: die Uhrzeit erscheint
       nur, wenn ALLE offenen Tage gleich sind — in der Demo hat Samstag
       andere Zeiten, also steht dort „6 Tage". Richtig ist die Frage,
       ob überhaupt etwas gepflegt ist. */
    if (!oz.zeitKnoepfe.length || oz.zeitKnoepfe.every(t => t === 'Zeiten')) {
      errs.push('In der Demo sind keine Öffnungszeiten gepflegt — dann lässt sich nicht ' +
        'zeigen, wofür sie da sind');
    }
    if (oz.terminals < 1) errs.push('In der Demo ist kein Terminal eingerichtet');
    await p5.close();
  }

  /* ── 7. Keine erfundenen Rechtsangaben ── */
  const recht = await p3.evaluate(() => {
    const t = document.body.innerText || '';
    // Erfundene Adressen/Namen im Impressum waeren genau der Platzhalter,
    // der auf werbung.html schon einmal live gegangen ist.
    return {
      musterUSt: /DE\d{9}/.test(t),
      musterStrasse: /Musterstra|Musterweg|Beispielstra/i.test(t),
      musterMann: /Max Mustermann|Erika Mustermann/i.test(t)
    };
  });
  console.log('RECHT:', JSON.stringify(recht));
  if (recht.musterUSt || recht.musterStrasse || recht.musterMann) {
    errs.push('Die Demo enthaelt erfundene Rechtsangaben: ' + JSON.stringify(recht));
  }
  await p3.close();

  /* ══ JEDE ANSICHT ZEIGT ETWAS ══════════════════════════════════════

     Der Durchlauf oben prüft, was die Demo ANFASST. Er prüft nicht, ob
     das, was sie zeigt, überhaupt erscheint — und genau daran ist sie
     stillschweigend gescheitert:

     `loadMaterial` liest `doc.metadata.hasPendingWrites`, um beim
     Tippen nicht die eigene Eingabe zu überschreiben. Die Demo baute
     Dokumente ohne `metadata`. Ergebnis: die MATERIAL-ANSICHT WAR IN
     DER GANZEN DEMO LEER, mit einem Fehler in der Konsole. Eine von
     sechs Funktionen unter „Betrieb" — im Verkaufswerkzeug.

     Gefunden wurde das beim Nachmessen der Klickwege, nicht hier. Eine
     Attrappe, die nur die halbe Form eines Dokuments nachbaut, macht
     genau die Stellen kaputt, die die andere Hälfte lesen — und das
     fällt nirgends auf, solange niemand hinsieht.

     Deshalb: jede Ansicht jeder Rolle einmal öffnen. Kein PAGEERROR,
     und etwas Sichtbares muss darin stehen. */
  for (const rolle of ['chef', 'leiter', 'mitarbeiter']) {
    const pv = await b.newPage({ viewport: { width: 390, height: 844 } });
    const seitenfehler = [];
    pv.on('pageerror', e => seitenfehler.push(e.message.slice(0, 120)));
    await pv.route('**://www.gstatic.com/**', r => r.abort());
    await pv.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
    await pv.waitForTimeout(4200);

    const gruppen = await pv.evaluate(() =>
      [...document.querySelectorAll('.mobnav [data-group]')]
        .filter(g => g.getClientRects().length)
        .map(g => g.getAttribute('data-group')));

    const leer = [];
    for (const g of gruppen) {
      await pv.evaluate(id => document.querySelector('.mobnav [data-group="' + id + '"]').click(), g);
      await pv.waitForTimeout(500);
      const views = await pv.evaluate(() =>
        [...document.querySelectorAll('#subnav [data-subview]')].map(t => t.getAttribute('data-subview')));
      const ziele = views.length ? views : [null];
      for (const v of ziele) {
        if (v) {
          await pv.evaluate(id => {
            const t = document.querySelector('#subnav [data-subview="' + id + '"]');
            if (t) t.click();
          }, v);
          await pv.waitForTimeout(700);
        }
        const inhalt = await pv.evaluate(() => {
          const s = [...document.querySelectorAll('.view')]
            .find(x => getComputedStyle(x).display !== 'none');
          if (!s) return null;
          const txt = (s.innerText || '').replace(/\s+/g, ' ').trim();
          return { id: s.id, zeichen: txt.length,
                   bedien: [...s.querySelectorAll('button,input,select,a[href]')]
                     .filter(e => e.getClientRects().length).length };
        });
        /* „Etwas Sichtbares" heisst nicht „viel": eine leere Liste mit
           ihrem Hinweistext ist in Ordnung. Ein Bildschirm mit unter
           40 Zeichen und ohne Bedienelement ist keiner. */
        if (inhalt && inhalt.zeichen < 40 && inhalt.bedien === 0) {
          leer.push(rolle + ' · ' + inhalt.id + ' (' + inhalt.zeichen + ' Zeichen)');
        }
      }
    }
    console.log('ANSICHTEN ' + rolle + ': leer=' + JSON.stringify(leer) +
      ' fehler=' + JSON.stringify([...new Set(seitenfehler)]));
    leer.forEach(l => errs.push('Ansicht bleibt leer: ' + l));
    [...new Set(seitenfehler)].forEach(f =>
      errs.push('PAGEERROR beim Durchgehen (' + rolle + '): ' + f));
    await pv.close();
  }

  await b.close();
  console.log('\nFehler: ' + (errs.length ? '' : 'keine'));
  errs.forEach(e => console.log('  ' + e));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
