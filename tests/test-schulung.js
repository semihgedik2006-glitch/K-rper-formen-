/* ══════════════════════════════════════════════════════════════════════
   SCHULUNG: WEBINARE MIT CODE, FRAGEN UND NACHWEIS

   Aus dem Betrieb, 22.9.2026:
     „ich möchte einen bereich für eine art webinar und onboarding …
      mit videos und interaktivität … und danach noch fragen …
      Der Code soll am Anfang eines Webinars eingegeben werden vom
      Mitarbeiter, der erstellte Code soll vorher von der Leitung einem
      Namen zugewiesen werden, dann braucht der Mitarbeiter keinen
      eigenen Account, aber man kann tracken wer es war …
      wir können dann in einer liste sehen wer es alles gemacht hat und
      wann und wie lange und … wie oft er gebraucht hat um eine frage
      richtig zu beantworten."

   Was dieser Durchlauf festhält, und warum gerade das:

   1. DER CODE IST DIE SCHRANKE, NICHT DAS LOGIN. Ohne Code kein
      Durchlauf — und ein falscher Code wird abgewiesen. Das ist die
      Zeile, ohne die der ganze Bereich eine Behauptung wäre: wer die
      Schulung machen kann, ohne zu sagen wer er ist, hinterlässt
      keinen Nachweis, sondern eine Zeile.

   2. DER CODE BLEIBT — ABER ER LIEGT NICHT OFFEN HERUM. Seit dem
      22.9.2026, auf Ansage aus dem Betrieb: „das die codes nicht weg
      sind und sie keiner sehen kann, sondern sie bei der verwaltung
      gespeichert werden, sodass man ihn immer wieder neu erstellen und
      ansehen und weiterleiten kann."

      Geprüft wird deshalb BEIDES, und beides ist wichtig:
      dass in der geschlossenen Liste nur die vier offenen Zeichen der
      Kennung stehen — wer über die Schulter schaut, liest nicht zwanzig
      Codes auf einmal mit —, und dass ein Druck auf „Code zeigen" den
      ganzen Code hervorholt, ein zweiter ihn wieder wegräumt.

      Was das kostet, steht offen in functions/index.js: wer den Code
      lesen kann, kann die Schulung im Namen dieser Person machen. Lesen
      darf ihn nur die Leitung — und jede Person ihren eigenen
      (tests/rules/schulung.test.js).

   3. DIE ZUSTIMMUNG MUSS EINE SEIN. Der „Verstanden"-Haken gibt
      „Weiter" frei — vorher ist der Knopf gesperrt. Mit Gegenprobe,
      sonst wäre der Punkt auch bei einem Knopf grün, der immer geht.

   4. EIN FEHLVERSUCH WIRD GEZÄHLT UND ERKLÄRT. Falsch angeklickt heisst
      nicht „falsch", sondern ein Hinweis, der sagt warum — und die
      Zahl landet im Durchlauf. Genau die Zahl hat der Betrieb bestellt.

   5. DER DURCHLAUF STEHT DANACH IN DER LISTE, mit Name, Zeitpunkt,
      Dauer, Studio und Gerät. Das ist die zweite Hälfte der Ansage
      („die Uhrzeit tracken und den Ort bzw. der Studio Account").

   6. DIE VERWALTUNG IST FÜR DIE LEITUNG. Ein Mitarbeiter sieht den
      Knopf nicht — und die Regeln lassen ihn auch nicht heran
      (tests/rules/schulung.test.js).

   7. WAS FEHLT, WIRD GESAGT. Solange kein Video hinterlegt ist, steht
      am Platzhalter „Video folgt" — die App tut NICHT so, als sei der
      Schritt vollständig.

   8. DIE LEITUNG KANN MODULE SELBST PFLEGEN — und der Grundstock
      bleibt trotzdem eine Datei. Die entscheidende Zahl ist hier
      dieselbe wie bei den Lösungen: nach einer EIGENEN FASSUNG eines
      Datei-Moduls stehen genauso viele Module da wie vorher. Stünde
      dasselbe Modul zweimal in der Liste — einmal richtig, einmal
      veraltet —, wüsste niemand, welches gilt.
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

async function starte(b, rolle) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  /* Die Führung würde sonst über der Seite liegen und jeden Klick
     schlucken. Sie hat einen eigenen Durchlauf. */
  await p.addInitScript(() => {
    localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'dark' }));
    localStorage.setItem('kf_tour', '99:demo-ich');
  });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3300);
  return p;
}
/* Der Weg, den ein Mensch geht: untere Leiste → „Ich" → Reiter
   „Schulung". Kein showView() von aussen — das prüfte die Funktion
   statt den Weg.

   Unter „Ich" und nicht unter „Betrieb", seit dem 22.9.2026 und auf
   Ansage: dort liegt, was HEUTE im Studio zu tun ist. Eine Schulung
   gehört zu dem, was man selbst kann — wie „Meine Zeiten" und
   „Meine Nachweise". */
async function zurSchulung(p) {
  await p.evaluate(() => {
    const k = document.querySelector('.mobnav [data-group="g-ich"]') ||
              document.querySelector('#side [data-group="g-ich"]');
    if (k) k.click();
  });
  await p.waitForTimeout(700);
  const da = await p.evaluate(() => {
    const t = [...document.querySelectorAll('[data-subview]')]
      .find(x => /Schulung/.test(x.textContent));
    if (!t) return false;
    t.click(); return true;
  });
  await p.waitForTimeout(1500);
  return da;
}
/* Die Verwaltung hat seit dem 22.9.2026 drei Reiter: Teilnehmer,
   Module, Auswertung. Sie liegen nicht mehr alle drei untereinander
   auf einer Seite — wer etwas sucht, drückt vorher den Reiter. Die
   Probe geht denselben Weg, sonst prüft sie etwas, das kein Mensch je
   zu sehen bekäme. */
async function vwReiter(seite, id) {
  await seite.evaluate((i) => {
    const b = document.querySelector('[data-schvwtab="' + i + '"]');
    if (b) b.click();
  }, id);
  await seite.waitForTimeout(600);
}
/* Einen Teilnehmer anlegen und seinen Code holen. Genau der Weg, den
   die Leitung im Studio geht. */
async function codeHolen(p, name) {
  await p.click('#schVerwaltenBtn');
  await p.waitForTimeout(800);
  await p.fill('#schTnName', name);
  await p.click('#schTnNeu');
  await p.waitForTimeout(1100);
  const code = await p.evaluate(() => {
    const b = document.getElementById('schCodeText');
    return b ? b.textContent.trim() : null;
  });
  await p.evaluate(() => {
    const z = document.querySelector('#schVerwalten [data-schzurueck]');
    if (z) z.click();
  });
  await p.waitForTimeout(500);
  return code;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const fehler = [];
  const p = await starte(b, 'chef');
  p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));

  // ══ 1. Der Weg dorthin ══
  console.log('\n── Der Weg dorthin ──');
  pruefe('der Reiter „Schulung" steht unter „Ich"', await zurSchulung(p));
  const offen = await p.evaluate(() => ({
    seite: (document.querySelector('.view.show') || {}).id,
    basis: ((window.SCHULUNGEN_BASIS || {}).module || []).length,
    module: document.querySelectorAll('[data-schmodul]').length,
    kats: [...document.querySelectorAll('[data-schkat]')].map(x => x.textContent.trim())
  }));
  pruefe('und er führt wirklich dorthin', offen.seite === 'view-schulung', String(offen.seite));
  pruefe('die Module aus der Datei sind geladen', offen.basis >= 3, String(offen.basis));
  pruefe('und stehen als Karten da', offen.module === offen.basis,
    offen.module + ' Karten / ' + offen.basis + ' Module');
  pruefe('es gibt Kategorien zum Filtern', offen.kats.length >= 3, offen.kats.join(', '));
  pruefe('mit „Alle" vorn', offen.kats[0] === 'Alle', offen.kats.join(' '));

  /* ── Was offen ist, steht oben ──────────────────────────────────
     Vorher fuehrte die Seite mit einer Chipzeile und dann allen
     Modulen in einer Reihe. Wer wissen wollte, was er noch machen
     MUSS, las dafuer jede Karte durch und suchte das Wort „Pflicht".
     Jetzt steht die Antwort als erstes da. */
  const faellig = await p.evaluate(() => {
    const k = document.getElementById('schFaelligKarte');
    const uebersicht = document.getElementById('schUebersicht');
    const kinder = [...uebersicht.children];
    return {
      sichtbar: !!k && k.style.display !== 'none',
      zeilen: document.querySelectorAll('[data-schfaellig]').length,
      /* Nur Pflichtmodule duerfen hier stehen. Stuende ein freiwilliges
         darunter, waere der Kasten eine zweite Modulliste statt einer
         Ansage. */
      nurPflicht: [...document.querySelectorAll('[data-schfaellig]')].every(z => {
        const id = z.getAttribute('data-schfaellig');
        const m = ((window.SCHULUNGEN_BASIS || {}).module || [])
          .find(x => x.id === id);
        return !m || m.pflicht === true;
      }),
      pflichtGesamt: ((window.SCHULUNGEN_BASIS || {}).module || [])
        .filter(x => x.pflicht).length,
      /* Ganz oben, nicht irgendwo: ein Hinweis unter der Modulliste
         waere auf 390 Pixeln unter dem Rand. */
      zuerst: kinder.indexOf(k) === 0,
      text: (k || {}).textContent || ''
    };
  });
  pruefe('was fuer dich faellig ist, steht ganz oben', faellig.sichtbar && faellig.zuerst,
    JSON.stringify({ s: faellig.sichtbar, z: faellig.zuerst }));
  /* Wieviele offen sind, haengt davon ab, was das Demokonto schon
     gemacht hat — die Zahl festzuschreiben hiesse, die Demodaten
     festzuschreiben. Gepruefte Aussage: es steht mindestens eines da,
     nie mehr als es Pflichtmodule gibt, und AUSSCHLIESSLICH
     Pflichtmodule. */
  pruefe('mit Zeilen fuer offene Pflichtmodule',
    faellig.zeilen >= 1 && faellig.zeilen <= faellig.pflichtGesamt,
    faellig.zeilen + ' von ' + faellig.pflichtGesamt);
  pruefe('GEGENPROBE und nur fuer Pflichtmodule', faellig.nurPflicht);
  pruefe('und jede sagt, warum sie dasteht',
    /noch nicht gemacht|wieder faellig|wieder fällig/.test(faellig.text),
    faellig.text.slice(0, 120).replace(/\s+/g, ' '));

  /* Und der Weg zur anderen Haelfte desselben Themas. Schulung sagt,
     wie es geht, BEVOR es soweit ist; „Hilfe im Studio" sagt es, wenn
     es gerade brennt. */
  const zurHilfe = await p.evaluate(() => {
    const b = document.getElementById('schZurHilfe');
    if (!b) return null;
    b.click();
    return new Promise(r => setTimeout(() => {
      const h = document.getElementById('hilfe');
      const offen = !!h && h.style.display !== 'none' && !h.hidden;
      const z = document.getElementById('hilfeZu');
      if (z) z.click();
      setTimeout(() => r(offen), 400);
    }, 700));
  });
  pruefe('von der Schulung fuehrt ein Weg zur Hilfe im Studio', zurHilfe === true,
    String(zurHilfe));

  /* Auch über „Alles", das Inhaltsverzeichnis. Ein Bereich, der dort
     fehlt, ist für jeden unsichtbar, der die Reiterzeile nicht kennt.

     Seit dem 22.9.2026 stehen Hilfe und Schulung dort unter EINER
     Ueberschrift — die Antwort auf „eventuell, das er auch anders
     liegt, irgendwie ein weiteres Modul, wo dann Hilfe und Schulung
     oder so steht". Ein siebter Bereich in der Navigation waere die
     falsche Antwort auf den Wunsch gewesen, es moege einfacher werden:
     die untere Leiste hat vier feste Plaetze. */
  const imVerzeichnis = await p.evaluate(() => {
    const a = document.querySelector('.mobnav [data-group="g-alles"]');
    if (a) a.click();
    return new Promise(r => setTimeout(() => {
      const ziel = document.querySelector('[data-alles="schulung"]');
      const gr = ziel && ziel.closest('.al-gruppe');
      r({
        da: !!ziel,
        farbe: gr ? gr.getAttribute('data-farbe') : '',
        frage: gr ? (gr.querySelector('h3, .al-frage') || {}).textContent || '' : '',
        /* Beides unter derselben Ueberschrift — sonst waere es nur
           umsortiert und nicht zusammengefasst. */
        mitHilfe: !!(gr && gr.querySelector('[data-al-hilfe]'))
      });
    }, 700));
  });
  pruefe('und er steht auch in „Alles"', imVerzeichnis.da);
  pruefe('unter einer eigenen Ueberschrift', imVerzeichnis.farbe === 'wissen',
    imVerzeichnis.farbe + ' / ' + imVerzeichnis.frage);
  pruefe('und die Hilfe im Studio steht dort daneben', imVerzeichnis.mitHilfe,
    imVerzeichnis.frage);
  await zurSchulung(p);

  // ══ 2. Filter ══
  console.log('\n── Filtern ──');
  const gefiltert = await p.evaluate(() => {
    const k = [...document.querySelectorAll('[data-schkat]')]
      .find(x => x.getAttribute('data-schkat') === 'hygiene');
    if (k) k.click();
    return new Promise(r => setTimeout(() =>
      r(document.querySelectorAll('[data-schmodul]').length), 400));
  });
  pruefe('eine Kategorie zeigt weniger als alles',
    gefiltert > 0 && gefiltert < offen.module, gefiltert + ' von ' + offen.module);
  const zurueck = await p.evaluate(() => {
    const k = [...document.querySelectorAll('[data-schkat]')]
      .find(x => x.getAttribute('data-schkat') === 'alle');
    if (k) k.click();
    return new Promise(r => setTimeout(() =>
      r(document.querySelectorAll('[data-schmodul]').length), 400));
  });
  pruefe('GEGENPROBE „Alle" zeigt wieder alles', zurueck === offen.module,
    zurueck + ' statt ' + offen.module);

  // ══ 3. Der Code ══
  console.log('\n── Der Code ──');
  const code = await codeHolen(p, 'Prüf Person');
  pruefe('die Leitung kann einen Teilnehmer anlegen', !!code, String(code));
  /* Zwölf Zeichen in drei Blöcken — so steht er auf dem Zettel, und so
     tippt man ihn ab. Ein Code, den man falsch abliest, ist ein Anruf
     bei der Leitung. */
  pruefe('und bekommt einen lesbaren Code zu sehen',
    !!code && /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code), String(code));
  /* Die Zeile, auf die es ankommt — und sie hat seit dem 22.9.2026 zwei
     Hälften. ERSTE HÄLFTE: zugeklappt steht in der Liste nur die
     Kennung, der offene Vorderteil, der allein nichts aufschliesst.
     Stünden dort zwanzig vollständige Codes untereinander, läse jeder
     sie mit, der einmal auf den Bildschirm sieht. */
  await p.click('#schVerwaltenBtn');
  await p.waitForTimeout(800);
  const zu = await p.evaluate((c) => {
    const kenn = c.slice(0, 4), geheim = c.slice(5).replace('-', '');
    const t = (document.getElementById('schTnListe') || {}).textContent || '';
    return { kennung: t.indexOf(kenn) >= 0, geheim: t.indexOf(geheim) >= 0,
             knopf: !!document.querySelector('[data-schcode]') };
  }, code);
  pruefe('in der Liste steht die Kennung', zu.kennung);
  pruefe('GEGENPROBE aber nicht der geheime Teil', !zu.geheim);
  pruefe('und daneben ein Knopf, der ihn hervorholt', zu.knopf);

  /* ZWEITE HÄLFTE: ein Druck, und er steht da. Das ist der Wunsch aus
     dem Betrieb — ein Code, den man nur einmal sieht, ist ein Zettel,
     der verlorengeht. */
  const auf = await p.evaluate((c) => {
    const kenn = c.slice(0, 4);
    const b = [...document.querySelectorAll('[data-schcode]')]
      .find(x => x.closest('.sch-tn-zeile').textContent.indexOf(kenn) >= 0);
    if (!b) return null;
    b.click();
    return new Promise(r => setTimeout(() => {
      const t = (document.getElementById('schTnListe') || {}).textContent || '';
      r({ text: t, voll: !!document.querySelector('.sch-kenn-voll'),
          kopie: !!document.querySelector('[data-schkopie]'),
          teilen: !!document.querySelector('[data-schteilen]'),
          knopfText: (document.querySelector('[data-schcode]') || {}).textContent || '' });
    }, 500));
  }, code);
  pruefe('„Code zeigen" holt den ganzen Code hervor',
    !!auf && auf.text.indexOf(code) >= 0, auf ? auf.text.slice(0, 90) : 'kein Knopf');
  pruefe('mit einem Knopf zum Kopieren', !!auf && auf.kopie);
  pruefe('und einem zum Weitergeben', !!auf && auf.teilen);

  const wiederZu = await p.evaluate(() => {
    /* Der Knopf IN DER OFFENEN ZEILE, nicht der erste der Liste: die
       Teilnehmer stehen alphabetisch, und „Prüf Person" ist nicht die
       erste. Beim ersten Anlauf klappte die Probe damit eine zweite
       Zeile auf statt die erste zu. */
    const voll = document.querySelector('.sch-kenn-voll');
    const b = voll && voll.closest('.sch-tn-zeile').querySelector('[data-schcode]');
    if (b) b.click();
    return new Promise(r => setTimeout(() =>
      r(!document.querySelector('.sch-kenn-voll')), 500));
  });
  /* Er bleibt nicht offen stehen. Sonst wäre „zeigen" ein Schalter, den
     jemand einmal umlegt und danach vergisst. */
  pruefe('GEGENPROBE und ein zweiter Druck räumt ihn wieder weg', wiederZu);
  await p.evaluate(() => {
    const z = document.querySelector('#schVerwalten [data-schzurueck]');
    if (z) z.click();
  });
  await p.waitForTimeout(600);

  await p.evaluate(() => document.querySelector('[data-schmodul]').click());
  await p.waitForTimeout(600);
  pruefe('ein Modul fragt zuerst nach dem Code',
    await p.evaluate(() => !!document.getElementById('schCodeFeld')));

  const falsch = await p.evaluate(() => {
    document.getElementById('schCodeFeld').value = 'AAAA-BBBB-CCCC';
    document.getElementById('schStartBtn').click();
    return new Promise(r => setTimeout(() => r({
      note: (document.getElementById('schCodeNote') || {}).textContent || '',
      lauf: (document.getElementById('schLauf') || {}).style.display
    }), 1200));
  });
  pruefe('ein falscher Code wird abgewiesen', /stimmt nicht/i.test(falsch.note), falsch.note);
  pruefe('und es beginnt kein Durchlauf', falsch.lauf === 'none', falsch.lauf);

  const gestartet = await p.evaluate((c) => {
    document.getElementById('schCodeFeld').value = c;
    document.getElementById('schStartBtn').click();
    return new Promise(r => setTimeout(() => r({
      lauf: (document.getElementById('schLauf') || {}).style.display,
      zahl: (document.querySelector('.sch-zahl') || {}).textContent || '',
      name: [...document.querySelectorAll('.sch-zahl')].map(x => x.textContent).join('|')
    }), 1400));
  }, code);
  pruefe('der richtige Code startet den Durchlauf', gestartet.lauf === '', gestartet.lauf);
  pruefe('und der Name steht dabei', /Prüf Person/.test(gestartet.name), gestartet.name);

  // ══ 4. Der Durchlauf ══
  console.log('\n── Schritt für Schritt ──');
  let videoGesagt = false, hakenSperrte = false, hakenLoeste = false, schritte = 0;
  for (let i = 0; i < 12; i++) {
    const st = await p.evaluate(() => ({
      frage: !!document.querySelector('.sch-frage'),
      video: (document.querySelector('.sch-video b') || {}).textContent || '',
      haken: !!document.getElementById('schHaken'),
      weiterAus: !!(document.getElementById('schWeiter') || {}).disabled
    }));
    if (st.frage) break;
    schritte++;
    if (st.video) videoGesagt = videoGesagt || /Video folgt/.test(st.video);
    if (st.haken) {
      hakenSperrte = hakenSperrte || st.weiterAus;
      await p.evaluate(() => document.querySelector('#schHaken input').click());
      await p.waitForTimeout(350);
      hakenLoeste = !(await p.evaluate(() => document.getElementById('schWeiter').disabled));
    }
    await p.evaluate(() => document.getElementById('schWeiter').click());
    await p.waitForTimeout(450);
  }
  pruefe('der Durchlauf hat mehrere Schritte', schritte >= 3, String(schritte));
  /* Solange kein Video hinterlegt ist, MUSS die App das sagen. Ein
     leerer Rahmen liesse jeden glauben, sein Gerät sei schuld — und
     ein Schritt, der so tut, als sei er vollständig, ist schlimmer. */
  pruefe('ein fehlendes Video wird als fehlend benannt', videoGesagt);
  pruefe('ohne Haken ist „Weiter" gesperrt', hakenSperrte);
  pruefe('GEGENPROBE mit Haken geht es weiter', hakenLoeste);

  // ══ 5. Die Fragen ══
  console.log('\n── Die Fragen ──');
  const f = await p.evaluate(() => ({
    frage: (document.querySelector('.sch-frage') || {}).textContent || '',
    antworten: document.querySelectorAll('[data-schantwort]').length,
    weiterDa: !!document.getElementById('schWeiter')
  }));
  pruefe('nach den Schritten kommen die Fragen', f.frage.length > 10, f.frage.slice(0, 40));
  pruefe('mit mehreren Antworten', f.antworten >= 3, String(f.antworten));
  /* Ohne Antwort kein Weiter: sonst klickt man sich durch, ohne eine
     einzige Frage angesehen zu haben. */
  pruefe('GEGENPROBE ohne Antwort gibt es kein „Weiter"', !f.weiterDa);

  /* Die richtige Antwort steht in der Datei. Der Durchlauf sucht sie
     dort — nicht, um zu schummeln, sondern um GEZIELT daneben zu
     klicken: nur so lässt sich prüfen, dass ein Fehlversuch wirklich
     gezählt und erklärt wird. */
  const danebenGeklickt = await p.evaluate(() => {
    const m = (window.SCHULUNGEN_BASIS.module || [])[0];
    const richtig = m.fragen[0].richtig;
    const daneben = richtig === 0 ? 1 : 0;
    document.querySelector('[data-schantwort="' + daneben + '"]').click();
    return new Promise(r => setTimeout(() => r({
      hinweis: (document.querySelector('.sch-hinweis') || {}).textContent || '',
      markiert: document.querySelectorAll('.sch-antwort.falsch').length,
      weiterDa: !!document.getElementById('schWeiter'),
      richtigIdx: richtig
    }), 600));
  });
  pruefe('eine falsche Antwort wird markiert', danebenGeklickt.markiert === 1,
    String(danebenGeklickt.markiert));
  /* Erklären statt tadeln — das ist der ganze Zweck des Bereichs.
     „Falsch" allein bringt niemandem etwas bei. */
  pruefe('und sie wird ERKLÄRT, nicht nur gezählt',
    danebenGeklickt.hinweis.length > 25, danebenGeklickt.hinweis.slice(0, 50));
  pruefe('mit einer falschen Antwort geht es NICHT weiter', !danebenGeklickt.weiterDa);

  const nachRichtig = await p.evaluate((idx) => {
    document.querySelector('[data-schantwort="' + idx + '"]').click();
    return new Promise(r => setTimeout(() => r({
      richtig: document.querySelectorAll('.sch-antwort.richtig').length,
      weiterDa: !!document.getElementById('schWeiter')
    }), 600));
  }, danebenGeklickt.richtigIdx);
  pruefe('die richtige Antwort wird markiert', nachRichtig.richtig === 1);
  pruefe('und erst dann geht es weiter', nachRichtig.weiterDa);

  // ══ 6. Das Ergebnis ══
  console.log('\n── Das Ergebnis ──');
  for (let i = 0; i < 14; i++) {
    const fertig = await p.evaluate(() =>
      (document.getElementById('schErgebnis') || {}).style.display === '');
    if (fertig) break;
    await p.evaluate(() => {
      const w = document.getElementById('schWeiter');
      if (w) return w.click();
      const m = (window.SCHULUNGEN_BASIS.module || [])[0];
      const nr = [...document.querySelectorAll('.sch-schritt .hint')]
        .map(x => /Frage (\d+)/.exec(x.textContent)).filter(Boolean)[0];
      const idx = nr ? Number(nr[1]) - 1 : 0;
      const richtig = m.fragen[idx].richtig;
      document.querySelector('[data-schantwort="' + richtig + '"]').click();
    });
    await p.waitForTimeout(600);
  }
  const erg = await p.evaluate(() => ({
    da: (document.getElementById('schErgebnis') || {}).style.display === '',
    titel: (document.querySelector('.sch-fertig h3') || {}).textContent || '',
    kacheln: [...document.querySelectorAll('.sch-zahl-kachel')].map(x => x.textContent.trim())
  }));
  pruefe('am Ende steht ein Ergebnis', erg.da);
  pruefe('und es sagt, dass es geschafft ist', /Geschafft/.test(erg.titel), erg.titel);
  /* Vier Zahlen, und zwar genau die vier aus dem Betrieb: wie viel
     richtig, wie lange, wie oft daneben, der wievielte Durchgang. */
  pruefe('mit vier Zahlen', erg.kacheln.length === 4, JSON.stringify(erg.kacheln));
  pruefe('darunter die Fehlversuche',
    erg.kacheln.some(x => /Fehlversuche/.test(x)), erg.kacheln.join(' | '));
  pruefe('und der Durchgang',
    erg.kacheln.some(x => /Durchgang/.test(x)), erg.kacheln.join(' | '));

  // ══ 7. Die Liste für die Leitung ══
  console.log('\n── Was die Leitung sieht ──');
  await p.evaluate(() => {
    document.querySelector('#schErgebnis [data-schzurueck]').click();
  });
  await p.waitForTimeout(700);
  await p.click('#schVerwaltenBtn');
  await p.waitForTimeout(900);
  /* Die Reiterzeile trägt die Zahl dahinter — damit man sieht, wo
     etwas steht, BEVOR man drei Reiter durchtippt. */
  const reiterZahlen = await p.evaluate(() =>
    [...document.querySelectorAll('[data-schvwtab]')].map(x => x.textContent.trim()));
  pruefe('die Verwaltung hat drei Reiter', reiterZahlen.length === 3,
    reiterZahlen.join(' | '));
  pruefe('und jeder sagt, wieviel dahintersteht',
    reiterZahlen.every(x => /\d/.test(x)), reiterZahlen.join(' | '));
  await vwReiter(p, 'aus');
  const inListe = await p.evaluate(() => {
    const z = [...document.querySelectorAll('#schLaufListe .sch-lauf-zeile')];
    return { zahl: z.length, erste: z[0] ? z[0].textContent.replace(/\s+/g, ' ') : '' };
  });
  pruefe('der Durchlauf steht in der Liste', inListe.zahl >= 1, String(inListe.zahl));
  pruefe('mit dem Namen der Person', /Prüf Person/.test(inListe.erste), inListe.erste.slice(0, 60));
  pruefe('mit dem Modul', /erster Tag/.test(inListe.erste), inListe.erste.slice(0, 80));
  /* „die Uhrzeit tracken und den Ort bzw. der Studio Account" — beides
     muss dastehen, sonst ist der Nachweis halb. */
  pruefe('mit Zeitpunkt', /Uhr/.test(inListe.erste), inListe.erste.slice(0, 80));
  pruefe('und mit dem Gerät, auf dem es lief',
    /am Gerät/.test(inListe.erste), inListe.erste.slice(0, 120));
  pruefe('dazu die Dauer', /Min/.test(inListe.erste), inListe.erste.slice(-60));
  pruefe('und wie oft daneben geklickt wurde',
    /daneben/.test(inListe.erste), inListe.erste.slice(-60));

  pruefe('keine Skriptfehler (Chef)', fehler.length === 0, fehler[0]);
  await p.close();

  // ══ 8. Ein Mitarbeiter verwaltet nichts ══
  console.log('\n── Wer darf verwalten ──');
  const m = await starte(b, 'mitarbeiter');
  const mFehler = [];
  m.on('pageerror', e => mFehler.push(e.message.slice(0, 160)));
  await zurSchulung(m);
  const alsMitarbeiter = await m.evaluate(() => {
    const v = document.getElementById('schVerwaltenBtn');
    return {
      knopf: !!v && getComputedStyle(v).display !== 'none',
      module: document.querySelectorAll('[data-schmodul]').length
    };
  });
  pruefe('ein Mitarbeiter sieht den Verwalten-Knopf nicht', !alsMitarbeiter.knopf);
  /* Die Gegenprobe: er sieht die Schulungen sehr wohl. Ohne sie wäre
     der Punkt darüber auch bei einer leeren Seite grün. */
  pruefe('GEGENPROBE er sieht die Module trotzdem',
    alsMitarbeiter.module >= 3, String(alsMitarbeiter.module));
  pruefe('keine Skriptfehler (Mitarbeiter)', mFehler.length === 0, mFehler[0]);

  // ══ 9. Die Leitung pflegt Module selbst ══
  console.log('\n── Module selbst pflegen ──');
  const c = await starte(b, 'chef');
  const cFehler = [];
  c.on('pageerror', e => cFehler.push(e.message.slice(0, 160)));
  await zurSchulung(c);
  const vorher = await c.evaluate(() =>
    [...document.querySelectorAll('[data-schmodul]')].map(x => x.querySelector('b').textContent));
  await c.click('#schVerwaltenBtn');
  await c.waitForTimeout(900);
  await vwReiter(c, 'mod');
  const verwaltung = await c.evaluate(() => ({
    zeilen: document.querySelectorAll('#schModulListe .sch-tn-zeile').length,
    knoepfe: [...document.querySelectorAll('[data-schbearbeiten]')].map(x => x.textContent.trim()),
    neu: !!document.getElementById('schModulNeu')
  }));
  pruefe('die Verwaltung listet die Module', verwaltung.zeilen === vorher.length,
    verwaltung.zeilen + ' / ' + vorher.length);
  pruefe('mit einem Knopf zum Anlegen', verwaltung.neu);
  /* Ein Modul aus der DATEI kann man nicht an Ort und Stelle ändern —
     die Datei liegt im Programm, nicht in der Datenbank. Der Knopf
     sagt deshalb „Eigene Fassung" und nicht „Bearbeiten". Ein Knopf,
     der etwas anderes verspricht, als er tut, ist schlimmer als
     keiner. */
  pruefe('an einem Datei-Modul heisst der Knopf „Eigene Fassung"',
    verwaltung.knoepfe.every(x => /Eigene Fassung/.test(x)), verwaltung.knoepfe.join(' | '));

  // ── Ein neues Modul ──
  const neuAngelegt = await c.evaluate(() => {
    document.getElementById('schModulNeu').click();
    return new Promise(r => setTimeout(() => {
      const f = document.getElementById('schModulForm');
      r({
        offen: f.style.display === '',
        titel: (f.querySelector('h3') || {}).textContent || '',
        schritte: document.querySelectorAll('[data-schritt]').length,
        loeschKnopf: !!document.getElementById('schFWeg')
      });
    }, 700));
  });
  pruefe('„Neues Modul" öffnet ein leeres Formular', neuAngelegt.offen);
  pruefe('und es heisst auch so', /Neues Modul/.test(neuAngelegt.titel), neuAngelegt.titel);
  pruefe('mit einem ersten Schritt zum Ausfüllen', neuAngelegt.schritte === 1,
    String(neuAngelegt.schritte));
  /* GEGENPROBE: an etwas, das es noch nicht gibt, darf kein
     Löschen-Knopf stehen. */
  pruefe('GEGENPROBE ein neues Modul hat keinen Löschen-Knopf', !neuAngelegt.loeschKnopf);

  /* Ohne Titel speichern MUSS scheitern — sonst steht in der Liste
     eine namenlose Zeile, die niemand zuordnen kann. */
  const ohneTitel = await c.evaluate(() => {
    document.getElementById('schFSpeichern').click();
    return new Promise(r => setTimeout(() => r({
      note: (document.getElementById('schFNote') || {}).textContent || '',
      nochImFormular: document.getElementById('schModulForm').style.display === ''
    }), 700));
  });
  pruefe('ohne Titel wird nicht gespeichert', /Titel/.test(ohneTitel.note), ohneTitel.note);
  pruefe('und das Formular bleibt offen', ohneTitel.nochImFormular);

  /* Eine Frage mit nur einer ausgefüllten Antwort ist keine Frage —
     im Durchlauf stünde ein einzelner Knopf da, den man nur drücken
     kann. Lieber hier sagen als dort zeigen. */
  const halbeFrage = await c.evaluate(() => {
    document.getElementById('schFTitel').value = 'Vom Durchlauf angelegt';
    document.querySelector('[data-schritt="0"] [data-sfeld="text"]').value = 'Ein Satz.';
    document.querySelector('[data-schplus="frage"]').click();
    return new Promise(r => setTimeout(() => {
      document.querySelector('[data-frage="0"] [data-ffeld="frage"]').value = 'Eine Frage?';
      document.querySelector('[data-frage="0"] [data-fantwort="0"]').value = 'Nur diese eine';
      document.getElementById('schFSpeichern').click();
      setTimeout(() => r((document.getElementById('schFNote') || {}).textContent || ''), 700);
    }, 600));
  });
  pruefe('eine Frage mit einer einzigen Antwort wird abgewiesen',
    /zwei/.test(halbeFrage), halbeFrage);

  const gespeichert = await c.evaluate(() => {
    document.querySelector('[data-frage="0"] [data-fantwort="1"]').value = 'Oder diese';
    document.querySelector('[data-frage="0"] [data-frichtig="1"]').click();
    document.getElementById('schFSpeichern').click();
    return new Promise(r => setTimeout(() => r({
      zurueck: document.getElementById('schVerwalten').style.display === '',
      zeilen: document.querySelectorAll('#schModulListe .sch-tn-zeile').length
    }), 1600));
  });
  pruefe('ein vollständiges Modul lässt sich speichern', gespeichert.zurueck);
  pruefe('und steht danach in der Verwaltung',
    gespeichert.zeilen === verwaltung.zeilen + 1,
    gespeichert.zeilen + ' statt ' + (verwaltung.zeilen + 1));
  const inUebersicht = await c.evaluate(() => {
    document.querySelector('#schVerwalten [data-schzurueck]').click();
    return new Promise(r => setTimeout(() =>
      r([...document.querySelectorAll('[data-schmodul]')]
        .map(x => x.querySelector('b').textContent)), 800));
  });
  pruefe('und auch in der Übersicht für alle',
    inUebersicht.indexOf('Vom Durchlauf angelegt') >= 0, inUebersicht.join(' | '));

  // ── Eine eigene Fassung eines Datei-Moduls ──
  await c.click('#schVerwaltenBtn');
  await c.waitForTimeout(700);
  await vwReiter(c, 'mod');
  const fassung = await c.evaluate(() => {
    return new Promise(r => setTimeout(() => {
      document.querySelector('[data-schbearbeiten]').click();
      setTimeout(() => r({
        ueberschrift: (document.querySelector('#schModulForm h3') || {}).textContent || '',
        titel: (document.getElementById('schFTitel') || {}).value || '',
        schritte: document.querySelectorAll('[data-schritt]').length,
        fragen: document.querySelectorAll('[data-frage]').length
      }), 800);
    }, 900));
  });
  pruefe('eine eigene Fassung ist vorausgefüllt', fassung.schritte >= 3 && fassung.fragen >= 1,
    JSON.stringify(fassung));
  pruefe('und sagt, dass sie eine ist',
    /Eigene Fassung/.test(fassung.ueberschrift), fassung.ueberschrift);

  const nachFassung = await c.evaluate(() => {
    document.getElementById('schFTitel').value = 'Unsere eigene Fassung';
    document.getElementById('schFSpeichern').click();
    return new Promise(r => setTimeout(() => {
      document.querySelector('#schVerwalten [data-schzurueck]').click();
      setTimeout(() => r([...document.querySelectorAll('[data-schmodul]')]
        .map(x => x.querySelector('b').textContent)), 800);
    }, 1600));
  });
  pruefe('die eigene Fassung ersetzt das Modul aus der Datei',
    nachFassung.indexOf('Unsere eigene Fassung') >= 0, nachFassung.join(' | '));
  /* DIE ZAHL, AUF DIE ES ANKOMMT. Stünde das Modul jetzt zweimal da —
     einmal aus der Datei, einmal als eigene Fassung —, wüsste niemand,
     welches gilt. */
  pruefe('GEGENPROBE und steht nicht zusätzlich dazu',
    nachFassung.length === inUebersicht.length,
    nachFassung.length + ' statt ' + inUebersicht.length);
  pruefe('GEGENPROBE das Original ist aus der Liste verschwunden',
    nachFassung.indexOf(vorher[0]) < 0, nachFassung.join(' | '));

  // ── Und wieder verwerfen ──
  c.on('dialog', d => d.accept());
  await c.click('#schVerwaltenBtn');
  await c.waitForTimeout(700);
  await vwReiter(c, 'mod');
  const verworfen = await c.evaluate(() => {
    return new Promise(r => setTimeout(() => {
      document.querySelector('[data-schbearbeiten]').click();
      setTimeout(() => {
        const w = document.getElementById('schFWeg');
        const text = w ? w.textContent : '';
        if (w) w.click();
        setTimeout(() => {
          document.querySelector('#schVerwalten [data-schzurueck]').click();
          setTimeout(() => r({
            knopfText: text,
            titel: [...document.querySelectorAll('[data-schmodul]')]
              .map(x => x.querySelector('b').textContent)
          }), 800);
        }, 1500);
      }, 800);
    }, 900));
  });
  pruefe('der Knopf heisst „Eigene Fassung verwerfen"',
    /verwerfen/.test(verworfen.knopfText), verworfen.knopfText);
  /* Das ist der Grund, warum der Grundstock eine Datei bleiben darf:
     was das Studio ändert, ist jederzeit zurücknehmbar, und das
     Original war nie in Gefahr. */
  pruefe('und danach steht das Modul aus der Datei wieder da',
    verworfen.titel.indexOf(vorher[0]) >= 0, verworfen.titel.join(' | '));
  pruefe('keine Skriptfehler (Editor)', cFehler.length === 0, cFehler[0]);
  await c.close();

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Schulung: ohne Code kein Durchlauf, Fehlversuche werden erklärt und ' +
      'gezählt, und am Ende steht ein Nachweis — ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
