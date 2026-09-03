/* ── Kalender: verschieben, wiederholen, Woche, Doppelklick ───────────
   Aus dem Betrieb gewünscht. Vier Fähigkeiten, und bei dreien davon ist
   der Fehler, den man leicht macht, teurer als das Feature:

     Verschieben     Ein Eintrag, der beim Ändern still auf den gerade
                     offenen Tag springt, sieht aus wie gelöscht.
     Wiederholung    Wird sie beim Anzeigen gerechnet oder beim Anlegen
                     vervielfacht? Vervielfacht heißt: 52 Zeilen pro
                     Jahr, und eine Änderung müsste 52-mal nachgezogen
                     werden.
     Woche           Muss dieselben Einträge zeigen wie der Monat. Zwei
                     Bauarten für dasselbe laufen sonst auseinander.
     Doppelklick     Muss den Tag WÄHLEN, nicht nur das Formular öffnen —
                     sonst landet der Eintrag am zuletzt offenen Tag.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
const pruefe = (b, m) => { if (!b) errs.push(m); };

const H = new Date();
const MON = H.getFullYear() + '-' + String(H.getMonth() + 1).padStart(2, '0');
const TAG5  = MON + '-05';
const TAG12 = MON + '-12';
const TAG20 = MON + '-20';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 200)));
  p.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text())) {
      fehler.push('KONSOLE: ' + m.text().slice(0, 160));
    }
  });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  await p.addInitScript(([t5, t12]) => {
    window.__privat = { termine: [
      { id: 'fix', datum: t5, titel: 'Zahnarzt', zeit: '09:30',
        kategorie: 'wichtig', ts: 1 },
      // Wöchentlich ab dem 12. — muss auch am 19. und 26. auftauchen
      { id: 'wdh', datum: t12, titel: 'Teambesprechung', zeit: '08:00',
        kategorie: 'arbeit', wdh: 'woche', ts: 2 }
    ] };
  }, [TAG5, TAG12]);
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2600);

  await p.evaluate(async () => {
    document.querySelector('.mobnav [data-group="g-ich"]').click();
    await new Promise(r => setTimeout(r, 400));
    (function(){var s=document.querySelector('[data-subview="ich"]');if(s) s.click();})();
    document.querySelector('[data-ichtab="kalender"]').click();
    await new Promise(r => setTimeout(r, 500));
  });

  // ══ 1. Wiederholung: gerechnet, nicht vervielfacht ══
  {
    const r = await p.evaluate(async ([t12]) => {
      const tage = [...document.querySelectorAll('#ichKalender [data-ichtag]')];
      const mitPunkt = tage.filter(t => t.querySelector('.ich-punkt.kat-arbeit'))
        .map(t => t.getAttribute('data-ichtag'));
      return { mitPunkt, erster: t12 };
    }, [TAG12]);
    console.log('Wöchentlich sichtbar an:', JSON.stringify(r.mitPunkt));
    pruefe(r.mitPunkt.indexOf(TAG12) >= 0,
      'WIEDERHOLUNG: der erste Termin am ' + TAG12 + ' fehlt (' + r.mitPunkt.join(', ') + ')');
    const plus7 = MON + '-19', plus14 = MON + '-26';
    pruefe(r.mitPunkt.indexOf(plus7) >= 0,
      'WIEDERHOLUNG: eine Woche später (' + plus7 + ') steht nichts');
    pruefe(r.mitPunkt.indexOf(plus14) >= 0,
      'WIEDERHOLUNG: zwei Wochen später (' + plus14 + ') steht nichts');
    /* GEGENPROBE: nicht an JEDEM Tag. Ohne die wäre ein kaputtes
       „faellt auf" — das immer true liefert — ebenfalls grün. */
    pruefe(r.mitPunkt.indexOf(MON + '-13') < 0,
      'WIEDERHOLUNG: der Termin steht auch am Folgetag — die Rechnung stimmt nicht');
    pruefe(r.mitPunkt.length >= 2 && r.mitPunkt.length <= 5,
      'WIEDERHOLUNG: ' + r.mitPunkt.length + ' Tage tragen den Punkt, ' +
      'wöchentlich wären es 2 bis 5 im Monat');
    // Und in der Datenbank liegt trotzdem nur EIN Dokument
    const anzahl = await p.evaluate(() => window.__privat.termine.length);
    pruefe(anzahl === 2,
      'VERVIELFACHT: in der Ablage liegen ' + anzahl + ' Termine statt 2 — ' +
      'eine Wiederholung gehört gerechnet, nicht geschrieben');
  }

  // ══ 2. Doppelklick legt am RICHTIGEN Tag an ══
  {
    const r = await p.evaluate(async ([t20]) => {
      // Erst einen anderen Tag wählen, damit „richtiger Tag" etwas heißt
      document.querySelector('#ichKalender [data-ichtag$="-05"]').click();
      await new Promise(r => setTimeout(r, 300));

      const ziel = document.querySelector('#ichKalender [data-ichtag="' + t20 + '"]');
      ziel.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      await new Promise(r => setTimeout(r, 350));

      const offen = document.getElementById('ichTerminBox').open;
      const imDatum = document.getElementById('ichTerminDatum').value;
      const fokus = document.activeElement && document.activeElement.id;

      window.__schreib = [];
      document.getElementById('ichTerminTitel').value = 'Schnell notiert';
      document.getElementById('ichTerminNotiz').value = 'per Doppelklick';
      document.getElementById('ichTerminZeit').value = '17:00';
      document.getElementById('ichTerminAdd').click();
      await new Promise(r => setTimeout(r, 450));
      return { offen, imDatum, fokus, schreib: window.__schreib };
    }, [TAG20]);
    console.log('Doppelklick →', JSON.stringify({ offen: r.offen, datum: r.imDatum, fokus: r.fokus }));
    console.log('  geschrieben:', JSON.stringify(r.schreib));
    pruefe(r.offen, 'DOPPELKLICK: das Formular klappt nicht auf');
    pruefe(r.imDatum === TAG20,
      'DOPPELKLICK: im Datumsfeld steht ' + JSON.stringify(r.imDatum) + ' statt ' + TAG20);
    pruefe(r.fokus === 'ichTerminTitel',
      'DOPPELKLICK: der Cursor steht in ' + JSON.stringify(r.fokus) + ' statt im Titel');
    const w = r.schreib[0];
    if (!w) errs.push('DOPPELKLICK: es wurde nichts angelegt');
    else {
      pruefe(w.daten.datum === TAG20,
        'DOPPELKLICK: angelegt am ' + JSON.stringify(w.daten.datum) + ' statt am ' +
        TAG20 + ' — der Eintrag landet am zuletzt offenen Tag');
      pruefe(w.daten.notiz === 'per Doppelklick',
        'DOPPELKLICK: die Notiz kam nicht mit');
      pruefe(w.daten.zeit === '17:00', 'DOPPELKLICK: die Uhrzeit kam nicht mit');
    }
  }

  // ══ 3. Verschieben ══
  {
    const r = await p.evaluate(async ([t5, t20]) => {
      document.getElementById('ichTerminBox').open = false;
      const feld = document.querySelector('#ichKalender [data-ichtag="' + t5 + '"]');
      if (!feld.classList.contains('gewaehlt')) {
        feld.click();
        await new Promise(r => setTimeout(r, 300));
      }
      const knopf = document.querySelector('[data-ichtermbearb]');
      if (!knopf) return { keinKnopf: true };
      knopf.click();
      await new Promise(r => setTimeout(r, 300));
      const vorDatum = document.getElementById('ichTerminDatum').value;

      window.__schreib = [];
      document.getElementById('ichTerminDatum').value = t20;
      document.getElementById('ichTerminAdd').click();
      await new Promise(r => setTimeout(r, 500));
      return {
        vorDatum, schreib: window.__schreib,
        gewaehltDanach: (document.querySelector('#ichKalender .ich-tagfeld.gewaehlt') || {})
          .getAttribute ? document.querySelector('#ichKalender .ich-tagfeld.gewaehlt')
            .getAttribute('data-ichtag') : null
      };
    }, [TAG5, TAG20]);

    if (r.keinKnopf) errs.push('VERSCHIEBEN: zu einem eigenen Eintrag gibt es kein „Ändern"');
    else {
      console.log('Verschieben:', r.vorDatum, '→', JSON.stringify(r.schreib));
      console.log('  danach gewählt:', r.gewaehltDanach);
      pruefe(r.vorDatum === TAG5,
        'FORMULAR: im Datumsfeld stand ' + JSON.stringify(r.vorDatum) + ' statt ' + TAG5);
      const w = r.schreib[0];
      if (!w) errs.push('VERSCHIEBEN: es wurde nichts geschrieben');
      else {
        pruefe(w.art === 'update', 'VERSCHIEBEN: geschrieben wurde „' + w.art + '" statt update');
        pruefe(w.daten.datum === TAG20,
          'VERSCHIEBEN: geschrieben wurde ' + JSON.stringify(w.daten.datum) + ' statt ' + TAG20);
        pruefe(w.daten.titel === 'Zahnarzt',
          'VERSCHIEBEN: der Titel ging dabei verloren (' + JSON.stringify(w.daten.titel) + ')');
      }
      /* Nach dem Verschieben muss die Ansicht mitgehen. Bleibt sie am
         alten Tag, sieht das Verschieben aus wie ein Löschen. */
      pruefe(r.gewaehltDanach === TAG20,
        'VERSCHIEBEN: die Ansicht bleibt bei ' + JSON.stringify(r.gewaehltDanach) +
        ' statt dem Eintrag auf den ' + TAG20 + ' zu folgen');
    }
  }

  // ══ 4. Wochenansicht zeigt dieselben Einträge ══
  {
    const r = await p.evaluate(async () => {
      document.querySelector('[data-ichsicht="woche"]').click();
      await new Promise(r => setTimeout(r, 500));
      const felder = [...document.querySelectorAll('#ichKalender [data-ichtag]')];
      const koepfe = document.querySelectorAll('#ichKalender .kal-kopf').length;
      const gross = document.querySelectorAll('#ichKalender .ich-tagfeld.gross').length;
      const label = document.getElementById('ichMonatLabel').textContent.trim();
      const tage = felder.map(f => f.getAttribute('data-ichtag'));
      // Zurück auf Monat
      document.querySelector('[data-ichsicht="monat"]').click();
      await new Promise(r => setTimeout(r, 400));
      return { anzahl: felder.length, koepfe, gross, label, tage,
               zurueck: document.querySelectorAll('#ichKalender [data-ichtag]').length };
    });
    console.log('Woche:', r.label, '·', r.anzahl, 'Tage ·', r.gross, 'große Zellen');
    pruefe(r.anzahl === 7, 'WOCHE: ' + r.anzahl + ' Tagesfelder statt 7');
    pruefe(r.koepfe === 7, 'WOCHE: ' + r.koepfe + ' Spaltenköpfe statt 7');
    pruefe(r.gross === 7,
      'WOCHE: nur ' + r.gross + ' Zellen sind die größeren — dann sieht die Woche ' +
      'aus wie ein abgeschnittener Monat');
    /* Sieben aufeinanderfolgende Tage, beginnend am Montag. Ohne diese
       Prüfung wäre auch eine Woche grün, die irgendwo anfängt. */
    const d0 = new Date(r.tage[0] + 'T12:00:00');
    pruefe(d0.getDay() === 1, 'WOCHE: fängt an einem ' + d0.getDay() + ' an, nicht am Montag');
    const luecken = r.tage.filter((t, i) => {
      if (!i) return false;
      const a = new Date(r.tage[i - 1] + 'T12:00:00'), c = new Date(t + 'T12:00:00');
      return Math.round((c - a) / 86400000) !== 1;
    });
    pruefe(!luecken.length, 'WOCHE: die Tage sind nicht lückenlos (' + r.tage.join(', ') + ')');
    pruefe(r.zurueck > 27, 'UMSCHALTEN: zurück auf Monat zeigt nur ' + r.zurueck + ' Tage');
  }

  // ══ 5. Am Rechner ohne Scrollen ══
  {
    const r = await p.evaluate(() => {
      const kal = document.getElementById('ichKalender');
      const bereich = kal.closest('.scroll-area');
      return {
        rasterHoehe: Math.round(kal.getBoundingClientRect().height),
        platz: Math.round(bereich.clientHeight),
        rasterBreite: Math.round(kal.getBoundingClientRect().width),
        nebeneinander: getComputedStyle(document.getElementById('ichPaneKalender')).display
      };
    });
    console.log('Am Rechner:', JSON.stringify(r));
    pruefe(r.rasterHoehe < r.platz,
      'ZU HOCH: das Monatsraster ist ' + r.rasterHoehe + 'px hoch, der Bereich nur ' +
      r.platz + 'px — am Rechner muss der Monat auf eine Seite passen');
    pruefe(r.rasterBreite <= 660,
      'ZU BREIT: ' + r.rasterBreite + 'px — auf einem breiten Bildschirm werden ' +
      'die Zellen sonst zu Briefkastenschlitzen');
    pruefe(r.nebeneinander === 'grid',
      'NICHT NEBENEINANDER: am Rechner liegt die Tageskarte unter dem Raster (' +
      r.nebeneinander + '), obwohl rechts alles leer ist');
  }

  if (fehler.length) errs.push(fehler.slice(0, 3).join(' | '));
  console.log('Konsole:', fehler.length ? fehler.length + ' Meldungen' : 'sauber');

  await b.close();
  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Kalender: Wiederholung wird gerechnet statt vervielfacht, Doppelklick ' +
      'trifft den richtigen Tag, Verschieben nimmt die Ansicht mit, die Woche ' +
      'ist lückenlos, und am Rechner passt der Monat auf eine Seite');
  process.exit(errs.length ? 1 : 0);
})();
