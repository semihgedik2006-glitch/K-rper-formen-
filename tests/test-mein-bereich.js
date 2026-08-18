/* ── „Mein Bereich" ─────────────────────────────────────────────────
   Aus dem Betrieb gewuenscht: ein Bereich, der fuer jeden selber ist.

   Fuenf Reiter, zwei Sorten Daten. Aus dem Betrieb gelesen (Schichten,
   Abwesenheiten, Studio-Aufgaben, Nachweise, Probetrainings) und nur
   meins (Termine, eigene To-dos, Notizen unter privat/<uid>/).

   Was dieser Durchlauf wirklich pruefen muss, ist nicht „der Reiter ist
   da". Es sind drei Dinge, bei denen ein Fehler teuer waere:

     1. Was beim Anlegen WIRKLICH geschrieben wird — und wohin. Landet
        eine Notiz oder ein To-do versehentlich in einer geteilten
        Sammlung, sieht es die Leitung, und zwar unbemerkt.
     2. Dass der Bereich leicht bleibt. Erklaerungsabsaetze schleichen
        sich zurueck; drei Saetze spaeter steht wieder einer ueber der
        Eingabe. Also: keine langen Hinweistexte hier.
     3. Dass keine Flaeche leer bleibt. Ein Reiter, hinter dem nichts
        steht, sieht kaputt aus — auch wenn er nur nichts zu zeigen hat.

   Jede Behauptung hat eine Gegenprobe. Ohne die waere ein Durchlauf,
   der gar nichts findet, genauso gruen.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
const fehler = [];

/* Derselbe Tag wie im eingespielten Termin — hier in Node berechnet,
   weil die Behauptungen unten ausserhalb von p.evaluate laufen und dort
   kein window existiert. */
const HEUTE = new Date();
const PRIVAT_TAG = HEUTE.getFullYear() + '-' +
  String(HEUTE.getMonth() + 1).padStart(2, '0') + '-15';

function pruefe(bedingung, meldung) {
  if (!bedingung) errs.push(meldung);
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 200)));
  /* Die abgebrochenen Anfragen sind unsere eigenen: p.route(...abort())
     weiter unten kappt gstatic und die Schriften, damit der Durchlauf
     ohne Netz laeuft. Chromium meldet das als Konsolenfehler. Wer das
     nicht herausnimmt, hat einen Durchlauf, der immer rot ist — und
     einen roten Durchlauf liest nach zwei Tagen niemand mehr.

     Herausgenommen wird deshalb genau diese eine Form, nicht „alles mit
     Fehler". Ob die Sperre zu weit greift, prueft Runde 7 mit einem
     echten Fehler nach. */
  const EIGENES_ABBRECHEN = /Failed to load resource|net::ERR_FAILED|ERR_BLOCKED_BY/;
  p.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (EIGENES_ABBRECHEN.test(t)) return;
    fehler.push('KONSOLE: ' + t.slice(0, 160));
  });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  /* Ein vorhandener Eintrag, damit „Ändern" etwas zu ändern hat. Am
     ersten des laufenden Monats, damit er im Raster sicher auftaucht. */
  /* Der Eintrag liegt bewusst NICHT am Monatsersten: Abschnitt 4 klickt
     die erste Zelle an, und läge der Termin dort, könnte man „bleibt an
     seinem Tag" nicht von „nimmt den angeklickten Tag" unterscheiden. */
  await p.addInitScript(() => {
    const d = new Date();
    const tag = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-15';
    window.__PRIVAT_TAG = tag;
    window.__privat = { termine: [{
      id: 't1', datum: tag, titel: 'Zahnarzt', zeit: '09:30', bis: '10:15',
      ort: 'Köln', notiz: 'Karte mitnehmen', kategorie: 'wichtig', ts: 1
    }] };
  });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2600);

  // ══ 1. Gibt es den Bereich ueberhaupt, und kommt man hin? ══
  const ankunft = await p.evaluate(async () => {
    const g = document.querySelector('.mobnav [data-group="g-ich"]');
    if (!g) return { keinReiter: true };
    const beschriftung = (g.textContent || '').trim();
    g.click();
    await new Promise(r => setTimeout(r, 500));
    const v = document.getElementById('view-ich');
    return {
      beschriftung,
      sichtbar: !!(v && v.classList.contains('show')),
      reiter: [...document.querySelectorAll('[data-ichtab]')]
        .map(x => x.getAttribute('data-ichtab')),
      // Der Reiter muss VOR dem Chat stehen, sonst war die Entscheidung
      // aus dem Kommentar in NAVGROUPS nur Absicht.
      stelle: [...document.querySelectorAll('.mobnav [data-group]')]
        .map(x => x.getAttribute('data-group')).indexOf('g-ich')
    };
  });

  if (ankunft.keinReiter) {
    errs.push('FEHLT: die untere Leiste hat keinen Eintrag „g-ich"');
  } else {
    console.log('Beschriftung:', JSON.stringify(ankunft.beschriftung),
      '· Stelle:', ankunft.stelle, '· Reiter:', ankunft.reiter.join(', '));
    pruefe(ankunft.sichtbar, 'NICHT SICHTBAR: der Klick öffnet #view-ich nicht');
    pruefe(ankunft.stelle === 1,
      'STELLE: „Mein Bereich" steht an Position ' + ankunft.stelle +
      ' statt an zweiter — bei sechs Einträgen rutscht er sonst aus dem Bild');
    ['woche', 'kalender', 'todo', 'notizen', 'daten'].forEach(t => {
      pruefe(ankunft.reiter.indexOf(t) >= 0, 'FEHLT: der Reiter „' + t + '"');
    });
  }

  // ══ 2. Jeder Reiter zeigt etwas — keiner bleibt leer ══
  for (const t of ['woche', 'kalender', 'todo', 'notizen', 'daten']) {
    const r = await p.evaluate(async (tab) => {
      const b = document.querySelector('[data-ichtab="' + tab + '"]');
      if (!b) return { fehlt: true };
      b.click();
      await new Promise(r => setTimeout(r, 450));
      const pane = { woche: 'ichPaneWoche', kalender: 'ichPaneKalender',
                     todo: 'ichPaneTodo', notizen: 'ichPaneNotizen',
                     daten: 'ichPaneDaten' }[tab];
      const el = document.getElementById(pane);
      if (!el) return { keineFlaeche: true };
      const sichtbar = getComputedStyle(el).display !== 'none';
      const text = (el.innerText || '').trim();
      // Sind die ANDEREN Flaechen auch wirklich weg?
      const andere = ['ichPaneWoche', 'ichPaneKalender', 'ichPaneTodo',
                      'ichPaneNotizen', 'ichPaneDaten']
        .filter(id => id !== pane)
        .filter(id => {
          const x = document.getElementById(id);
          return x && getComputedStyle(x).display !== 'none';
        });
      return { sichtbar, laenge: text.length, probe: text.slice(0, 45), andere };
    }, t);

    if (r.fehlt || r.keineFlaeche) { errs.push('FEHLT: Fläche zum Reiter „' + t + '"'); continue; }
    console.log('  ' + t.padEnd(9), r.laenge + ' Zeichen ·', JSON.stringify(r.probe));
    pruefe(r.sichtbar, 'UNSICHTBAR: „' + t + '" bleibt auf display:none');
    pruefe(r.laenge > 20, 'LEER: „' + t + '" zeigt nur ' + r.laenge +
      ' Zeichen — eine leere Fläche sieht kaputt aus, auch wenn es nichts zu zeigen gibt');
    pruefe(!r.andere.length, 'DOPPELT SICHTBAR: bei „' + t + '" steht auch noch ' +
      r.andere.join(', ') + ' offen');
  }

  /* ══ 2b. GEGENPROBE ══
     Ein erfundener Reiter darf nichts umschalten. Ohne diese Runde waere
     Punkt 2 auch dann gruen, wenn schlicht alles immer sichtbar ist. */
  {
    const r = await p.evaluate(async () => {
      const vorher = ['ichPaneWoche', 'ichPaneKalender', 'ichPaneTodo',
                      'ichPaneNotizen', 'ichPaneDaten']
        .filter(id => getComputedStyle(document.getElementById(id)).display !== 'none');
      const b = document.querySelector('[data-ichtab="gibtesnicht"]');
      return { vorher, erfundenDa: !!b };
    });
    pruefe(!r.erfundenDa, 'GEGENPROBE: es gibt einen Reiter „gibtesnicht"');
    pruefe(r.vorher.length === 1,
      'GEGENPROBE: es stehen ' + r.vorher.length + ' Flächen gleichzeitig offen — ' +
      'dann prüft der Reiterwechsel nichts');
  }

  // ══ 3. Der Kalender: stimmt die Anzahl der Tagesfelder? ══
  {
    const r = await p.evaluate(async () => {
      document.querySelector('[data-ichtab="kalender"]').click();
      await new Promise(r => setTimeout(r, 450));
      const koepfe = document.querySelectorAll('#ichKalender .kal-kopf').length;
      const echte = document.querySelectorAll('#ichKalender [data-ichtag]').length;
      const leere = document.querySelectorAll('#ichKalender .ich-tagfeld.leer').length;
      const label = (document.getElementById('ichMonatLabel') || {}).textContent || '';
      const jetzt = new Date();
      const soll = new Date(jetzt.getFullYear(), jetzt.getMonth() + 1, 0).getDate();
      // Erster Tag des Monats, Montag = 0
      const vorlauf = (new Date(jetzt.getFullYear(), jetzt.getMonth(), 1).getDay() + 6) % 7;
      const heute = document.querySelectorAll('#ichKalender .ich-tagfeld.heute').length;
      return { koepfe, echte, leere, soll, vorlauf, label: label.trim(), heute };
    });
    console.log('Kalender:', r.label, '·', r.echte + '/' + r.soll, 'Tage ·',
      r.leere + '/' + r.vorlauf, 'Vorlauf');
    pruefe(r.koepfe === 7, 'KALENDER: ' + r.koepfe + ' Spaltenköpfe statt 7');
    pruefe(r.echte === r.soll,
      'KALENDER: ' + r.echte + ' Tagesfelder, der Monat hat aber ' + r.soll);
    pruefe(r.leere === r.vorlauf,
      'KALENDER: ' + r.leere + ' Leerfelder als Vorlauf, richtig wären ' + r.vorlauf +
      ' — sonst steht der Monatsanfang unter dem falschen Wochentag');
    pruefe(r.heute === 1,
      'KALENDER: heute ist ' + r.heute + '-mal markiert, genau einmal wäre richtig');
  }

  /* ══ 3b. Monatswechsel ══
     Und zwar mit einer Behauptung, die stimmen MUSS: der Februar hat
     nie 31 Tage. Ein Raster, das immer 31 Felder malt, faellt hier auf. */
  {
    const r = await p.evaluate(async () => {
      const mess = [];
      for (let i = 0; i < 13; i++) {
        document.getElementById('ichMonatNext').click();
        await new Promise(r => setTimeout(r, 90));
        const label = document.getElementById('ichMonatLabel').textContent.trim();
        mess.push({ label, tage: document.querySelectorAll('#ichKalender [data-ichtag]').length });
      }
      document.getElementById('ichMonatHeute').click();
      await new Promise(r => setTimeout(r, 150));
      return { mess, zurueck: document.getElementById('ichMonatLabel').textContent.trim() };
    });
    const feb = r.mess.filter(m => /Februar/.test(m.label));
    const lang = r.mess.filter(m => m.tage > 31 || m.tage < 28);
    console.log('Monatswechsel:', r.mess.map(m => m.tage).join(','),
      '· Februar:', feb.map(m => m.tage).join(','), '· zurück:', r.zurueck);
    pruefe(feb.length > 0, 'MONATSWECHSEL: in 13 Schritten kam kein Februar vor');
    pruefe(feb.every(m => m.tage === 28 || m.tage === 29),
      'MONATSWECHSEL: Februar hat ' + feb.map(m => m.tage).join('/') + ' Tage');
    pruefe(!lang.length, 'MONATSWECHSEL: ein Monat mit ' +
      lang.map(m => m.tage).join('/') + ' Tagen');
    const jetzt = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    pruefe(r.zurueck === jetzt,
      'MONATSWECHSEL: „Heute" landet auf „' + r.zurueck + '" statt „' + jetzt + '"');
  }

  // ══ 4. Ein eigener Termin: WAS wird geschrieben, und WOHIN? ══
  {
    const r = await p.evaluate(async () => {
      window.__schreib = [];
      // Ohne gewaehlten Tag ist die Tageskarte zu
      const zuVorher = getComputedStyle(document.getElementById('ichTagKarte')).display;
      const feld = document.querySelector('#ichKalender [data-ichtag]');
      const key = feld.getAttribute('data-ichtag');
      feld.click();
      await new Promise(r => setTimeout(r, 250));
      const offen = getComputedStyle(document.getElementById('ichTagKarte')).display !== 'none';

      // Das Formular liegt seit dem 18.8. hinter einer Aufklappzeile.
      const box = document.getElementById('ichTerminBox');
      const zuAnfang = box ? box.open : null;
      if (box) box.open = true;
      await new Promise(r => setTimeout(r, 120));

      // GEGENPROBE: ohne Titel darf nichts geschrieben werden
      document.getElementById('ichTerminTitel').value = '';
      document.getElementById('ichTerminAdd').click();
      await new Promise(r => setTimeout(r, 300));
      const nachLeer = window.__schreib.length;

      /* GEGENPROBE: Ende vor dem Anfang. Das ist fast immer ein
         Vertipper — still gespeichert stuende spaeter „14:00-09:00"
         im Kalender und niemand wuesste, was gemeint war. */
      document.getElementById('ichTerminTitel').value = 'Verdreht';
      document.getElementById('ichTerminZeit').value = '14:00';
      document.getElementById('ichTerminBis').value = '09:00';
      document.getElementById('ichTerminAdd').click();
      await new Promise(r => setTimeout(r, 300));
      const nachVerdreht = window.__schreib.length;

      document.getElementById('ichTerminTitel').value = 'Zahnarzt';
      document.getElementById('ichTerminZeit').value = '09:30';
      document.getElementById('ichTerminBis').value = '10:15';
      document.getElementById('ichTerminOrt').value = 'Köln';
      document.getElementById('ichTerminNotiz').value = 'Karte mitnehmen';
      document.getElementById('ichTerminAdd').click();
      await new Promise(r => setTimeout(r, 400));
      return { key, offen, zuVorher, nachLeer, nachVerdreht, zuAnfang,
               schreib: window.__schreib,
               zuDanach: box ? box.open : null };
    });
    console.log('Termin geschrieben:', JSON.stringify(r.schreib));
    pruefe(r.zuVorher === 'none', 'TAGESKARTE: steht offen, bevor ein Tag gewählt wurde');
    pruefe(r.offen, 'TAGESKARTE: öffnet sich beim Klick auf einen Tag nicht');
    pruefe(r.nachLeer === 0,
      'GEGENPROBE: ein leerer Titel wurde geschrieben (' + r.nachLeer + ' Schreibvorgänge)');
    const t = r.schreib[0];
    if (!t) {
      errs.push('NICHTS GESCHRIEBEN: „Eintragen" legt keinen Termin an');
    } else {
      pruefe(/^privat\/[^/]+\/termine\//.test(t.pfad),
        'FALSCHER PFAD: der Termin landet unter „' + t.pfad +
        '" statt unter privat/<uid>/termine/ — dort sähe ihn das ganze Team');
      pruefe(t.daten && t.daten.titel === 'Zahnarzt',
        'INHALT: geschrieben wurde titel=' + JSON.stringify(t.daten && t.daten.titel));
      pruefe(t.daten && t.daten.datum === r.key,
        'DATUM: geschrieben wurde ' + JSON.stringify(t.daten && t.daten.datum) +
        ', angeklickt war ' + r.key);
      pruefe(t.daten && t.daten.zeit === '09:30',
        'ZEIT: geschrieben wurde ' + JSON.stringify(t.daten && t.daten.zeit));
      pruefe(t.daten && t.daten.bis === '10:15',
        'ENDE: geschrieben wurde ' + JSON.stringify(t.daten && t.daten.bis));
      pruefe(t.daten && t.daten.ort === 'Köln',
        'ORT: geschrieben wurde ' + JSON.stringify(t.daten && t.daten.ort));
      pruefe(t.daten && t.daten.notiz === 'Karte mitnehmen',
        'NOTIZ: geschrieben wurde ' + JSON.stringify(t.daten && t.daten.notiz));
    }
    pruefe(r.nachVerdreht === r.nachLeer,
      'GEGENPROBE: „14:00 bis 09:00" wurde gespeichert — ein Ende vor dem ' +
      'Anfang ist ein Vertipper und gehört abgewiesen');
    /* Zugeklappt beim Oeffnen: wer nur nachsehen will, was ansteht, soll
       nicht durch sechs leere Felder scrollen. */
    pruefe(r.zuAnfang === false,
      'FORMULAR: das Eintragefeld steht schon offen, bevor jemand es aufklappt');
    pruefe(r.zuDanach === false,
      'FORMULAR: nach dem Eintragen bleibt es offen stehen');
  }

  /* ══ 4b. Eigene To-dos ══
     Der Punkt, an dem es teuer wird, ist derselbe wie beim Termin: WOHIN
     wird geschrieben. Eine To-do-Liste, die versehentlich in den
     Studio-Aufgaben landet, erscheint bei der Leitung im Betrieb — und
     das merkt man erst, wenn jemand fragt, was „Steuererklärung" im
     Putzplan zu suchen hat. */
  {
    const r = await p.evaluate(async () => {
      document.querySelector('[data-ichtab="todo"]').click();
      await new Promise(r => setTimeout(r, 350));
      window.__schreib = [];

      // GEGENPROBE: leer legt nichts an
      document.getElementById('ichTodoNeu').value = '   ';
      document.getElementById('ichTodoAdd').click();
      await new Promise(r => setTimeout(r, 300));
      const nachLeer = window.__schreib.length;

      document.getElementById('ichTodoNeu').value = 'Steuerunterlagen sortieren';
      document.getElementById('ichTodoDatum').value = '2026-09-04';
      document.getElementById('ichTodoAdd').click();
      await new Promise(r => setTimeout(r, 400));

      // Und einmal ohne Frist — der haeufigere Fall
      window.__schreibOhne = null;
      const vorher = window.__schreib.length;
      document.getElementById('ichTodoNeu').value = 'Zweiter Punkt';
      document.getElementById('ichTodoAdd').click();
      await new Promise(r => setTimeout(r, 350));

      return {
        nachLeer, vorher, schreib: window.__schreib,
        feldLeer: document.getElementById('ichTodoNeu').value === '',
        hatKaestchen: !!document.querySelector('#ichTodoListe .ich-hak, #ichPaneTodo .ich-hak')
      };
    });
    console.log('To-do geschrieben:', JSON.stringify(r.schreib));
    pruefe(r.nachLeer === 0,
      'GEGENPROBE: ein leeres To-do wurde geschrieben (' + r.nachLeer + ')');
    const td = r.schreib[0];
    if (!td) {
      errs.push('NICHTS GESCHRIEBEN: „Hinzu" legt kein To-do an');
    } else {
      pruefe(/^privat\/[^/]+\/aufgaben\//.test(td.pfad),
        'FALSCHER PFAD: das To-do landet unter „' + td.pfad +
        '" — in einer geteilten Sammlung sähe es die Leitung');
      pruefe(td.daten && td.daten.text === 'Steuerunterlagen sortieren',
        'INHALT: geschrieben wurde ' + JSON.stringify(td.daten && td.daten.text));
      pruefe(td.daten && td.daten.frist === '2026-09-04',
        'FRIST: geschrieben wurde ' + JSON.stringify(td.daten && td.daten.frist));
      pruefe(td.daten && td.daten.erledigt === false,
        'ZUSTAND: ein neues To-do muss offen sein, geschrieben wurde erledigt=' +
        JSON.stringify(td.daten && td.daten.erledigt));
    }
    const ohne = r.schreib[1];
    if (!ohne) {
      errs.push('OHNE FRIST: ein To-do ohne Datum lässt sich nicht anlegen');
    } else {
      pruefe(ohne.daten && ohne.daten.frist === null,
        'OHNE FRIST: statt null wurde ' + JSON.stringify(ohne.daten && ohne.daten.frist) +
        ' geschrieben');
    }
    pruefe(r.feldLeer, 'FELD: nach dem Anlegen steht der Text noch im Feld');
  }

  /* ══ 4c. Einen Eintrag ÄNDERN ══
     Derselbe Ärger wie bei der Materialliste: wer sich vertippt, soll
     nicht löschen und neu anlegen müssen. Zwei Dinge müssen dabei
     stimmen, und beide sind leicht zu übersehen:

       1. Es muss ein update() sein, kein set(). Ein set() aus einem
          Formular heraus löscht jedes Feld, das gerade nicht gefüllt
          ist — der Eintrag verlöre still seine Notiz.
       2. Das DATUM darf sich nicht ändern. Man bearbeitet den Eintrag
          von seinem Tag aus; ein Tippfehler-Fix wäre sonst ein
          Verschieben.  */
  {
    const r = await p.evaluate(async () => {
      document.querySelector('[data-ichtab="kalender"]').click();
      await new Promise(r => setTimeout(r, 400));
      // Den Tag öffnen, an dem der eingespielte Termin liegt
      const feld = document.querySelector('#ichKalender [data-ichtag="' +
        window.__privat.termine[0].datum + '"]');
      if (!feld) return { keinTag: true };
      /* Nur klicken, wenn der Tag NICHT schon gewaehlt ist. Ein zweiter
         Klick waehlt ihn ab (so ist der Umschalter gebaut) — und dann
         lief diese Runde auf einer unsichtbaren Tageskarte weiter und
         hat trotzdem gruen gemeldet. Genau deshalb steht unten die
         Sichtprobe. */
      if (!feld.classList.contains('gewaehlt')) {
        feld.click();
        await new Promise(r => setTimeout(r, 350));
      }
      const karteSichtbar =
        getComputedStyle(document.getElementById('ichTagKarte')).display !== 'none';

      const aendernKnopf = document.querySelector('[data-ichtermbearb]');
      if (!aendernKnopf) return { keinKnopf: true };
      aendernKnopf.click();
      await new Promise(r => setTimeout(r, 300));

      const gefuellt = {
        titel: document.getElementById('ichTerminTitel').value,
        ort: document.getElementById('ichTerminOrt').value,
        notiz: document.getElementById('ichTerminNotiz').value,
        kat: (document.querySelector('#ichTerminKats .ich-kat.an') || {})
          .getAttribute ? document.querySelector('#ichTerminKats .ich-kat.an')
            .getAttribute('data-ichkat') : null,
        knopf: document.getElementById('ichTerminAdd').textContent.trim(),
        abbruchDa: getComputedStyle(document.getElementById('ichTerminAbbruch')).display !== 'none'
      };

      window.__schreib = [];
      document.getElementById('ichTerminTitel').value = 'Zahnarzt Kontrolle';
      document.getElementById('ichTerminAdd').click();
      await new Promise(r => setTimeout(r, 450));

      return {
        karteSichtbar, gefuellt, schreib: window.__schreib,
        knopfDanach: document.getElementById('ichTerminAdd').textContent.trim(),
        abbruchDanach: getComputedStyle(document.getElementById('ichTerminAbbruch')).display
      };
    });

    if (r.keinTag) errs.push('FEHLT: der Tag des eingespielten Termins steht nicht im Raster');
    else if (r.keinKnopf) errs.push('FEHLT: zu einem eigenen Eintrag gibt es kein „Ändern"');
    else {
      pruefe(r.karteSichtbar,
        'TAGESKARTE ZU: die Runde lief auf einer unsichtbaren Karte — dann sagt ' +
        'ihr Ergebnis nichts darüber, was ein Mensch sehen und antippen kann');
      console.log('Formular gefüllt:', JSON.stringify(r.gefuellt));
      console.log('Änderung geschrieben:', JSON.stringify(r.schreib));

      pruefe(r.gefuellt.titel === 'Zahnarzt',
        'FORMULAR: der Titel steht als ' + JSON.stringify(r.gefuellt.titel) + ' drin');
      pruefe(r.gefuellt.ort === 'Köln',
        'FORMULAR: der Ort steht als ' + JSON.stringify(r.gefuellt.ort) + ' drin');
      pruefe(r.gefuellt.notiz === 'Karte mitnehmen',
        'FORMULAR: die Notiz steht als ' + JSON.stringify(r.gefuellt.notiz) + ' drin');
      pruefe(r.gefuellt.kat === 'wichtig',
        'FORMULAR: die Art steht auf ' + JSON.stringify(r.gefuellt.kat) + ' statt „wichtig"');
      pruefe(/Speichern/.test(r.gefuellt.knopf),
        'KNOPF: beim Ändern steht „' + r.gefuellt.knopf + '" statt „Speichern"');
      pruefe(r.gefuellt.abbruchDa, 'FEHLT: beim Ändern gibt es kein „Abbrechen"');

      const w = r.schreib[0];
      if (!w) {
        errs.push('NICHTS GESCHRIEBEN: „Speichern" ändert den Eintrag nicht');
      } else {
        pruefe(w.art === 'update',
          'SET STATT UPDATE: geschrieben wurde „' + w.art + '" — ein set() aus dem ' +
          'Formular heraus löscht jedes Feld, das gerade nicht gefüllt ist');
        pruefe(/termine\/t1$/.test(w.pfad),
          'FALSCHES ZIEL: geändert wurde „' + w.pfad + '"');
        pruefe(w.daten && w.daten.titel === 'Zahnarzt Kontrolle',
          'INHALT: geschrieben wurde ' + JSON.stringify(w.daten && w.daten.titel));
        /* Seit dem 18.8. kommt das Datum aus dem Formularfeld — so
           verschiebt man einen Eintrag. Die Behauptung ist deshalb nicht
           mehr „kein datum", sondern: eine Änderung, bei der niemand das
           Datumsfeld anfasst, lässt den Eintrag an SEINEM Tag. Sonst
           wäre ein Tippfehler-Fix ein Verschieben. */
        pruefe(w.daten && w.daten.datum === PRIVAT_TAG,
          'DATUM VERSCHOBEN: die Änderung schreibt datum=' +
          JSON.stringify(w.daten && w.daten.datum) + ' statt ' +
          JSON.stringify(PRIVAT_TAG) + ' — obwohl niemand das Feld angefasst hat');
        pruefe(w.daten && w.daten.notiz === 'Karte mitnehmen',
          'NOTIZ WEG: die Änderung schreibt notiz=' +
          JSON.stringify(w.daten && w.daten.notiz));
      }
      pruefe(/Eintragen/.test(r.knopfDanach),
        'ZURÜCKSETZEN: nach dem Speichern steht der Knopf auf „' + r.knopfDanach + '"');
      pruefe(r.abbruchDanach === 'none',
        'ZURÜCKSETZEN: „Abbrechen" bleibt nach dem Speichern stehen');
    }
  }

  /* ══ 4d. Ganztägig blendet die Uhrzeiten aus ══ */
  {
    const r = await p.evaluate(async () => {
      const box = document.getElementById('ichTerminBox');
      if (box) box.open = true;
      // Steht ueberhaupt noch ein Tag offen? Ohne den legt nichts an.
      const tagOffen = !!document.querySelector('#ichKalender .ich-tagfeld.gewaehlt');
      const karteOffen = getComputedStyle(document.getElementById('ichTagKarte')).display;
      const ganz = document.getElementById('ichTerminGanz');
      const zeiten = document.getElementById('ichTerminZeiten');
      const vorher = getComputedStyle(zeiten).display;
      ganz.checked = true;
      ganz.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 200));
      const nachher = getComputedStyle(zeiten).display;

      // Und ein ganztägiger Eintrag darf keine Uhrzeit schreiben
      window.__schreib = [];
      document.getElementById('ichTerminZeit').value = '09:00';
      document.getElementById('ichTerminTitel').value = 'Fortbildung';
      document.getElementById('ichTerminAdd').click();
      await new Promise(r => setTimeout(r, 400));

      ganz.checked = false;
      ganz.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 200));
      return { vorher, nachher, zurueck: getComputedStyle(zeiten).display,
               schreib: window.__schreib, tagOffen, karteOffen };
    });
    console.log('Ganztägig · Zeiten:', r.vorher, '→', r.nachher, '→', r.zurueck);
    console.log('Ganztägig geschrieben:', JSON.stringify(r.schreib),
      '· Tag offen:', r.tagOffen, '· Tageskarte:', r.karteOffen);
    pruefe(r.vorher !== 'none', 'ZEITEN: sind schon ohne „ganztägig" ausgeblendet');
    pruefe(r.nachher === 'none',
      'GANZTÄGIG: die Uhrzeiten bleiben stehen (' + r.nachher + ')');
    pruefe(r.zurueck !== 'none', 'GANZTÄGIG: das Abwählen bringt die Uhrzeiten nicht zurück');
    const g = r.schreib[0];
    if (!g) errs.push('GANZTÄGIG: es wurde nichts angelegt');
    else {
      pruefe(g.daten && g.daten.ganztags === true,
        'GANZTÄGIG: geschrieben wurde ganztags=' + JSON.stringify(g.daten && g.daten.ganztags));
      pruefe(g.daten && g.daten.zeit === null,
        'GANZTÄGIG MIT UHRZEIT: im Feld stand 09:00 und wurde als ' +
        JSON.stringify(g.daten && g.daten.zeit) + ' mitgeschrieben — ein ganztägiger ' +
        'Eintrag mit Uhrzeit ist ein Widerspruch');
    }
  }

  // ══ 5. Eine Notiz: derselbe Test, und der Hinweis daneben ══
  {
    const r = await p.evaluate(async () => {
      document.querySelector('[data-ichtab="notizen"]').click();
      await new Promise(r => setTimeout(r, 350));
      window.__schreib = [];

      document.getElementById('ichNotizNeu').value = '   ';
      document.getElementById('ichNotizAdd').click();
      await new Promise(r => setTimeout(r, 300));
      const nachLeer = window.__schreib.length;

      document.getElementById('ichNotizNeu').value = 'Gehaltsgespräch vorbereiten';
      document.getElementById('ichNotizAdd').click();
      await new Promise(r => setTimeout(r, 400));
      return {
        nachLeer, schreib: window.__schreib,
        hinweis: (document.getElementById('ichPaneNotizen').innerText || ''),
        // Alle Hinweiszeilen des ganzen Bereichs, nicht nur des Notizblocks
        hinweisTexte: [...document.querySelectorAll('#view-ich .hint')]
          .map(x => (x.textContent || '').replace(/\s+/g, ' ').trim())
          .filter(Boolean)
      };
    });
    console.log('Notiz geschrieben:', JSON.stringify(r.schreib));
    pruefe(r.nachLeer === 0,
      'GEGENPROBE: eine leere Notiz wurde geschrieben (' + r.nachLeer + ')');
    const n = r.schreib[0];
    if (!n) {
      errs.push('NICHTS GESCHRIEBEN: „Speichern" legt keine Notiz an');
    } else {
      pruefe(/^privat\/[^/]+\/notizen\//.test(n.pfad),
        'FALSCHER PFAD: die Notiz landet unter „' + n.pfad + '"');
      pruefe(n.daten && n.daten.text === 'Gehaltsgespräch vorbereiten',
        'INHALT: geschrieben wurde ' + JSON.stringify(n.daten && n.daten.text));
    }
    /* Hier stand bis zum 18.8. die Forderung, der Notizblock muesse
       erklaeren, dass die Daten nicht verschluesselt sind. Aus dem
       Betrieb gestrichen, mit einer Begruendung, die traegt: es ist
       kein Tagebuch, und wer die App benutzt, muss die Datenbank
       dahinter nicht kennen.

       Was die Pruefung STATTDESSEN festhaelt, ist das, was der Wunsch
       eigentlich meinte — die Seite soll leicht sein. Eine Erklaerung
       schleicht sich schnell wieder ein; drei Saetze spaeter steht
       wieder ein Absatz ueber der Eingabe. Also: keine langen
       Hinweistexte in diesem Bereich. */
    const absaetze = r.hinweisTexte.filter(t => t.length > 90);
    console.log('Hinweistexte im Bereich:', JSON.stringify(r.hinweisTexte));
    pruefe(!absaetze.length,
      'ZU VIEL TEXT: im Bereich stehen Erklärungsabsätze (' +
      absaetze.map(t => t.slice(0, 45) + '…').join(' | ') +
      ') — die Seite soll leicht sein, nicht belehrend');
    pruefe(!/verschlüsselt|Datenbank/i.test(r.hinweis),
      'WIEDER DA: die Erklärung über Datenbank und Verschlüsselung steht ' +
      'wieder am Notizblock — die wurde bewusst gestrichen');
  }

  // ══ 6. „Ich": Stammdaten wirklich gefüllt ══
  {
    const r = await p.evaluate(async () => {
      document.querySelector('[data-ichtab="daten"]').click();
      await new Promise(r => setTimeout(r, 600));
      const zeilen = [...document.querySelectorAll('#ichStamm .ich-stamm')]
        .map(z => [...z.querySelectorAll('span')].map(s => s.textContent.trim()));
      return {
        zeilen,
        certs: (document.getElementById('ichCerts').innerText || '').trim().length,
        zahlen: (document.getElementById('ichZahlen').innerText || '').trim().length,
        profilKnopf: !!document.getElementById('ichProfilBtn')
      };
    });
    console.log('Stammdaten:', JSON.stringify(r.zeilen));
    pruefe(r.zeilen.length >= 4, 'STAMMDATEN: nur ' + r.zeilen.length + ' Zeilen');
    const name = r.zeilen.filter(z => z[0] === 'Name')[0];
    pruefe(name && name[1] && name[1] !== '–',
      'STAMMDATEN: der Name ist leer — dann liest die Seite die Sitzung nicht');
    const rolle = r.zeilen.filter(z => z[0] === 'Rolle')[0];
    pruefe(rolle && rolle[1] === 'Verwaltung',
      'STAMMDATEN: die Rolle steht als ' + JSON.stringify(rolle && rolle[1]) +
      ', die Attrappe ist aber ein Chef');
    pruefe(r.certs > 5, 'NACHWEISE: die Fläche bleibt leer (' + r.certs + ' Zeichen)');
    pruefe(r.zahlen > 5, 'ZAHLEN: die Fläche bleibt leer (' + r.zahlen + ' Zeichen)');
    pruefe(r.profilKnopf, 'FEHLT: der Knopf zum Profil');
  }

  // ══ 7. Nichts in der Konsole ══
  if (fehler.length) errs.push(fehler.slice(0, 4).join(' | '));
  console.log('Konsole:', fehler.length ? fehler.length + ' Meldungen' : 'sauber');

  /* ══ 7b. GEGENPROBE zur Konsolen-Sperre ══
     Die Sperre oben nimmt eine Form von Meldung heraus. Greift sie zu
     weit, meldet dieser Durchlauf nie wieder einen echten Fehler — und
     waere ab dann Zierrat. Also einen echten ausloesen und nachsehen,
     ob er ankommt. */
  {
    const vorher = fehler.length;
    await p.evaluate(() => { console.error('ABSICHTLICH: kaputte Stelle'); });
    await p.waitForTimeout(200);
    const angekommen = fehler.length > vorher;
    console.log('Gegenprobe Konsole: echter Fehler', angekommen ? 'kommt an ✓' : 'VERSCHLUCKT');
    if (!angekommen) {
      errs.push('GEGENPROBE: ein echter console.error wird verschluckt — ' +
        'dann ist die Konsolenprüfung wertlos');
    } else {
      // Den absichtlichen wieder herausnehmen, sonst meldet er sich selbst
      fehler.length = vorher;
    }
  }

  await b.close();
  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Mein Bereich: fünf Reiter, der Kalender zählt richtig, Termine und ' +
      'To-dos landen unter privat/<uid>/, keine Erklärungsabsätze — mit Gegenproben');
  process.exit(errs.length ? 1 : 0);
})();
