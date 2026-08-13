/* ── Funktionen an- und abschalten ───────────────────────────────────
   Geprüft wird nicht, ob ein Knopf da ist, sondern ob das Abschalten
   überall ankommt. Eine halb abgeschaltete Funktion ist schlimmer als
   eine eingeschaltete: sie steht noch in der Navigation, auf der
   Startseite oder im Verwaltungsbereich und führt ins Leere.

     1. Ohne Eintrag ist alles an.
     2. Abgeschaltet: der Eintrag verschwindet aus der unteren Leiste.
     3. Eine Gruppe, in der nichts übrig ist, verschwindet ganz.
     4. Die Startseite zeigt keine Kachel und keinen Hinweis mehr, der
        auf eine abgeschaltete Seite führt.
     5. Der Team-Reiter verschwindet — und die Seite dahinter auch.
     6. Sind ALLE Team-Reiter aus, ist die Team-Seite selbst weg.
     7. „Neue Aufgabe erstellen" verschwindet mit. Sonst legt der Chef
        Aufgaben an, die niemand je sieht.
     8. Wer eine abgeschaltete Ansicht direkt aufruft, landet auf der
        Startseite statt im Nichts.

   Nicht geprüft: ob am nächsten Morgen wirklich keine Erinnerung
   hinausgeht. Der Server prüft es mit (functions/index.js, featureAn),
   aber im Emulator gibt es keine Empfänger — belegt ist der Aufruf im
   Code, nicht das Ausbleiben der Meldung auf einem Gerät.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
/* Über APP lässt sich eine andere Fassung einhängen — gebraucht für die
   Gegenprobe: eine absichtlich kaputte MUSS hier durchfallen. */
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];

async function start(features) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  if (features) {
    await page.addInitScript('window.__features = ' + JSON.stringify(features) + ';');
  }
  await page.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  return { b, page };
}

/* Sichtbarkeit, nicht Klassen. Der Fehler beim Abo-Fenster kam genau
   daher: die Klasse sass richtig und hatte keine Wirkung. */
async function leiste(page) {
  return page.evaluate(() => {
    const raus = [];
    document.querySelectorAll('.mobnav [data-group]').forEach(b => {
      if (getComputedStyle(b).display !== 'none') raus.push(b.dataset.group);
    });
    return raus;
  });
}

async function zumTeam(page) {
  await page.evaluate(() => {
    const g = document.querySelector('.mobnav [data-group="g-team"]');
    if (g) g.click();
  });
  await page.waitForTimeout(600);
}

(async () => {
  // ══ 1. Ohne Eintrag: alles an ══
  {
    const { b, page } = await start(null);
    const g = await leiste(page);
    console.log('Ohne Eintrag, Gruppen:', JSON.stringify(g));
    ['g-start', 'g-komm', 'g-arbeit', 'g-team', 'g-chef'].forEach(id => {
      if (g.indexOf(id) < 0) errs.push('FEHLT: ohne Eintrag fehlt die Gruppe ' + id);
    });
    await b.close();
  }

  // ══ 2.+3. Abgeschaltet: Eintrag weg, leere Gruppe ganz weg ══
  {
    // Der ganze Betrieb-Bereich aus — die Gruppe darf nicht stehen bleiben
    const { b, page } = await start({
      todos: false, putzplan: false, material: false, geraete: false, docs: false
    });
    const g = await leiste(page);
    console.log('Betrieb komplett aus, Gruppen:', JSON.stringify(g));
    if (g.indexOf('g-arbeit') >= 0) {
      errs.push('FALSCH: die Gruppe „Betrieb" steht noch da, obwohl nichts mehr darin ist');
    }
    if (g.indexOf('g-komm') < 0) errs.push('KAPUTT: der Chat ist mit verschwunden');
    if (g.indexOf('g-start') < 0) errs.push('KAPUTT: die Startseite ist verschwunden');

    // ══ 4. Startseite: keine Kachel, kein Hinweis ins Leere ══
    const start2 = await page.evaluate(() => {
      const ziele = [];
      document.querySelectorAll('#view-home [data-go]').forEach(el => {
        if (getComputedStyle(el).display !== 'none') ziele.push(el.getAttribute('data-go'));
      });
      return ziele;
    });
    console.log('Ziele auf der Startseite:', JSON.stringify(start2));
    ['todos', 'putzplan', 'material', 'geraete', 'docs'].forEach(v => {
      if (start2.indexOf(v) >= 0) {
        errs.push('FALSCH: die Startseite führt noch nach „' + v + '" — abgeschaltet, aber verlinkt');
      }
    });

    await b.close();
  }

  /* ══ 8. Die Hintertür: die Zurück-Taste ══
     Über die Navigation kommt man nie in eine abgeschaltete Ansicht —
     die steht ja nicht mehr da. Über den Verlauf schon: jemand war in
     den Aufgaben, der Chef schaltet sie ab, die Person drückt Zurück.
     Ohne Wächter landet sie in einer Ansicht, aus der die untere Leiste
     nirgendwo mehr hinführt.

     ANMERKUNG ZUR ABDECKUNG: dieselbe Zeile schützt auch den gemerkten
     letzten Stand und einen geteilten Link (#aufgaben). Diese beiden
     Wege lassen sich in diesem Testaufbau NICHT auslösen — sie greifen
     hier auch ohne Änderung nicht, gemessen an der Fassung von vor
     dieser Runde. Geprüft ist also der Wächter, nicht jeder Weg zu ihm. */
  {
    const { b, page } = await start({ todos: false });
    const wo = await page.evaluate(async () => {
      // Zwei Einträge legen, damit „Zurück" beim ersten landet
      history.pushState({ v: 'todos' }, '', '#todos');
      history.pushState({ v: 'home' }, '', '#home');
      history.back();
      await new Promise(r => setTimeout(r, 500));
      const v = document.querySelector('.view.show');
      return v ? v.id : null;
    });
    console.log('Zurück-Taste auf eine abgeschaltete Ansicht landet auf:', wo);
    if (wo === 'view-todos') {
      errs.push('DIE HINTERTÜR: die Zurück-Taste führt in eine abgeschaltete Ansicht — ' +
                'dort steht dann eine Seite, aus der die Navigation nirgendwo hinführt');
    }
    if (wo !== 'view-home') errs.push('FALSCH: statt der Startseite steht ' + wo + ' da');
    await b.close();
  }

  /* ══ 8b. Auch der Chef-Überblick darf nicht ins Leere zeigen ══
     „3 Artikel fehlen ›" ist eine anklickbare Zeile. Zeigt sie auf eine
     abgeschaltete Ansicht, meldet sie ausserdem etwas, um das sich
     dieser Betrieb bewusst nicht kümmert. */
  {
    const { b, page } = await start({ material: false, todos: false });
    const ziele = await page.evaluate(async () => {
      const g = document.querySelector('.mobnav [data-group="g-chef"]');
      if (g) g.click();
      await new Promise(r => setTimeout(r, 400));
      const t = document.querySelector('#chefHome [data-cgo="ueberblick"]');
      if (t) t.click();
      await new Promise(r => setTimeout(r, 700));
      const raus = [];
      document.querySelectorAll('.att-row[data-go]').forEach(el => raus.push(el.getAttribute('data-go')));
      return raus;
    });
    console.log('Zeilen im Chef-Überblick zeigen nach:', JSON.stringify(ziele));
    ['material', 'todos'].forEach(v => {
      if (ziele.indexOf(v) >= 0) {
        errs.push('FALSCH: der Chef-Überblick zeigt noch nach „' + v + '" — abgeschaltet, aber verlinkt');
      }
    });
    await b.close();
  }

  // ══ 5. Team-Reiter: Knopf UND Seite ══
  {
    const { b, page } = await start({ schicht: false, abwesend: false });
    await zumTeam(page);
    const lage = await page.evaluate(() => {
      const sicht = id => {
        const el = document.querySelector('[data-teamtab="' + id + '"]');
        return el ? getComputedStyle(el).display !== 'none' : null;
      };
      const pane = id => {
        const el = document.getElementById(id);
        return el ? getComputedStyle(el).display !== 'none' : null;
      };
      return {
        schichtKnopf: sicht('schicht'), abwesendKnopf: sicht('abwesend'),
        uebergabeKnopf: sicht('uebergabe'), brettKnopf: sicht('brett'),
        schichtSeite: pane('teamPaneSchicht'),
        offen: (document.querySelector('[data-teamtab].on') || {}).dataset
          ? document.querySelector('[data-teamtab].on').dataset.teamtab : null
      };
    });
    console.log('Team-Reiter:', JSON.stringify(lage));
    if (lage.schichtKnopf) errs.push('FALSCH: der Schichtplan-Reiter steht noch da');
    if (lage.abwesendKnopf) errs.push('FALSCH: der Abwesenheits-Reiter steht noch da');
    if (!lage.uebergabeKnopf) errs.push('KAPUTT: die Übergabe ist mit verschwunden');
    /* Der Punkt, der leicht untergeht: nur den Knopf zu verstecken
       reicht nicht. Wer zuletzt im Schichtplan stand, sähe ihn sonst
       weiter — ohne Reiter, aber mit Inhalt.

       Ehrlichkeitshalber: diese Zusicherung hat zwei Wächter. Selbst
       wenn man das Ausblenden der Seite entfernt, bleibt sie grün, weil
       der Wechsel auf den ersten übrigen Reiter die anderen Seiten
       ohnehin zumacht. Die Zeile steht trotzdem hier — sie sichert die
       Eigenschaft, nicht einen bestimmten Weg dorthin. */
    if (lage.schichtSeite) {
      errs.push('DER HALBE WEG: der Reiter ist weg, die Seite dahinter steht noch offen');
    }
    if (lage.offen !== 'uebergabe' && lage.offen !== 'brett') {
      errs.push('FALSCH: es ist kein übriger Reiter aufgeschlagen (' + lage.offen + ')');
    }
    await b.close();
  }

  // ══ 6. Alle Team-Reiter aus → die Team-Seite selbst ist weg ══
  {
    const { b, page } = await start({
      schicht: false, abwesend: false, uebergabe: false, brett: false
    });
    const g = await leiste(page);
    console.log('Alle Team-Reiter aus, Gruppen:', JSON.stringify(g));
    if (g.indexOf('g-team') >= 0) {
      errs.push('FALSCH: die Team-Seite steht noch da, obwohl kein einziger Reiter übrig ist — ' +
                'eine Überschrift über nichts');
    }
    await b.close();
  }

  // ══ 7. Der Chef darf nichts anlegen, was niemand sieht ══
  {
    const { b, page } = await start({ todos: false, ann: false });
    const karten = await page.evaluate(() => {
      const g = document.querySelector('.mobnav [data-group="g-chef"]');
      if (g) g.click();
      const t = document.querySelector('#chefHome [data-cgo="erstellen"]');
      if (t) t.click();
      const sicht = sel => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).display !== 'none' : null;
      };
      return {
        aufgabe: sicht('[data-fold="neueaufgabe"]'),
        vorlagen: sicht('[data-fold="vorlagen"]'),
        ankuendigung: sicht('[data-fold="ankuendigung"]')
      };
    });
    console.log('Karten im Verwaltungsbereich:', JSON.stringify(karten));
    if (karten.aufgabe) {
      errs.push('DAS LOCH: „Neue Aufgabe erstellen" steht noch da — der Chef legt Aufgaben an, ' +
                'die für das Team gar nicht sichtbar sind');
    }
    if (karten.vorlagen) errs.push('FALSCH: die Aufgaben-Vorlagen stehen noch da');
    if (karten.ankuendigung) errs.push('FALSCH: „Ankündigung an alle" steht noch da, obwohl Infos aus sind');
    await b.close();
  }

  // ══ 9. Der Schalter selbst ist da — und nur für den Chef ══
  {
    const { b, page } = await start(null);
    const liste = await page.evaluate(() => {
      const g = document.querySelector('.mobnav [data-group="g-chef"]');
      if (g) g.click();
      const t = document.querySelector('#chefHome [data-cgo="system"]');
      if (t) t.click();
      const box = document.getElementById('featureListe');
      return {
        da: !!box,
        zahl: box ? box.querySelectorAll('[data-feat]').length : 0,
        text: box ? box.textContent.slice(0, 80) : ''
      };
    });
    console.log('Schalterliste:', JSON.stringify(liste));
    if (!liste.da) errs.push('FEHLT: die Schalterliste gibt es nicht');
    if (liste.zahl !== 12) errs.push('FALSCH: es stehen ' + liste.zahl + ' Schalter da, erwartet waren 12');
    await b.close();
  }

  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Funktionen: abgeschaltet heisst überall weg — Leiste, Startseite, Team-Reiter und Verwaltung');
  process.exit(errs.length ? 1 : 0);
})();
