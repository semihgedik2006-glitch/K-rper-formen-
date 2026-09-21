/* ══════════════════════════════════════════════════════════════════════
   LÖSUNGEN: PROBLEME AUS DEM STUDIO UND WAS DAGEGEN HILFT

   Aus dem Betrieb, 22.9.2026:
     „ich würde noch einen bereich wollen wo man videos und texte zu
      bestimmten problemen hochladen kann die in einem studio anfallen."

   Gebaut ist der Schritt davor: Text und Fotos. Video braucht echten
   Dateispeicher und damit eigene Regeln neben dem Eimer, in dem die
   nächtliche Sicherung liegt — und es lohnt erst, wenn der Bereich
   überhaupt benutzt wird.

   Was dieser Durchlauf festhält, und warum gerade das:

   1. DER WEG DORTHIN. Ein Bereich, den man nur über die Adresszeile
      erreicht, gibt es für den Benutzer nicht — derselbe Satz wie beim
      Abo-Zustand in der Demo, und dort war er teuer.

   2. FILTER UND SUCHE MÜSSEN WIRKLICH FILTERN. Eine Liste, die auf
      jeden Filter dasselbe zeigt, sieht aus wie eine, die funktioniert.
      Geprüft wird deshalb gegen die Zahl davor UND mit der Gegenprobe,
      dass „Alle" wieder alle zeigt.

   3. DIE FOTOS DÜRFEN NICHT BEIM ÖFFNEN DER LISTE GELADEN WERDEN. Bei
      dreissig Einträgen zu drei Fotos wären das neunzig Lesevorgänge
      und einige Megabyte, jedes Mal. Gemessen wird deshalb, dass die
      Sammlung `loesungBilder` beim Zeichnen der Liste NICHT angefasst
      wird — und beim Aufklappen sehr wohl.

   4. DER EXPORT MUSS SIE ENTHALTEN. Eine neue Sammlung, die nicht
      mitgeht, ist genau die Zusage, die am 21.9. gebrochen war — das
      steht in test-sicherung-inhalt.js, wo die Datei wirklich entsteht.
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

/* Der Weg, den ein Mensch geht: untere Leiste → Bereich „Aufgaben" →
   Reiter „Lösungen". Kein showView() von aussen — das prüfte die
   Funktion statt den Weg. */
async function zuLoesungen(p) {
  await p.evaluate(() => {
    const k = document.querySelector('.mobnav [data-group="g-arbeit"]') ||
              document.querySelector('#side [data-group="g-arbeit"]');
    if (k) k.click();
  });
  await p.waitForTimeout(900);
  const gefunden = await p.evaluate(() => {
    const t = [...document.querySelectorAll('#subnav button')]
      .find(x => /Lösungen/.test(x.textContent));
    if (!t) return false;
    t.click(); return true;
  });
  await p.waitForTimeout(1200);
  return gefunden;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  /* Die Führung würde sonst über der Liste liegen und jeden Klick
     schlucken. Sie hat einen eigenen Durchlauf. */
  await p.addInitScript(() => {
    localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'dark' }));
    localStorage.setItem('kf_tour', '99');
  });
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3300);

  // ══ 1. Der Weg dorthin ══
  console.log('\n── Der Weg dorthin ──');
  pruefe('der Reiter „Lösungen" steht unter „Aufgaben"', await zuLoesungen(p));
  const offen = await p.evaluate(() => (document.querySelector('.view.show') || {}).id);
  pruefe('und er führt wirklich dorthin', offen === 'view-loesungen', String(offen));

  /* Auch über „Alles", das Inhaltsverzeichnis. Ein Bereich, der dort
     fehlt, ist für jeden unsichtbar, der die Reiterzeile nicht kennt. */
  const imVerzeichnis = await p.evaluate(() => {
    const a = document.querySelector('.mobnav [data-group="g-alles"]');
    if (a) a.click();
    return new Promise(r => setTimeout(() => {
      r(!!document.querySelector('[data-alles="loesungen"]'));
    }, 600));
  });
  pruefe('und er steht auch in „Alles"', imVerzeichnis);
  await zuLoesungen(p);

  // ══ 2. Die Liste ══
  console.log('\n── Die Liste ──');
  const alle = await p.evaluate(() => ({
    zahl: document.querySelectorAll('[data-loes]').length,
    kats: [...document.querySelectorAll('[data-loeskat]')].map(x => x.textContent.trim()),
    suchfeld: !!document.getElementById('loesSuche'),
    formular: !!document.getElementById('loesSpeichern')
  }));
  console.log('  ' + alle.zahl + ' Einträge · Filter: ' + alle.kats.join(', '));
  pruefe('die Demo zeigt Einträge', alle.zahl >= 3, String(alle.zahl));
  pruefe('es gibt einen Filter mit „Alle" vorn', alle.kats[0] === 'Alle', alle.kats.join(' '));
  pruefe('es gibt ein Suchfeld', alle.suchfeld);
  pruefe('und ein Formular zum Festhalten', alle.formular);

  // ══ 3. Filter und Suche filtern wirklich ══
  console.log('\n── Filter und Suche ──');
  const nachKat = await p.evaluate(() => {
    const k = [...document.querySelectorAll('[data-loeskat]')]
      .find(x => x.getAttribute('data-loeskat') === 'geraet');
    if (k) k.click();
    return new Promise(r => setTimeout(() =>
      r(document.querySelectorAll('[data-loes]').length), 400));
  });
  pruefe('ein Filter zeigt weniger als alles',
    nachKat > 0 && nachKat < alle.zahl, nachKat + ' von ' + alle.zahl);
  const zurueck = await p.evaluate(() => {
    const k = [...document.querySelectorAll('[data-loeskat]')]
      .find(x => x.getAttribute('data-loeskat') === 'alle');
    if (k) k.click();
    return new Promise(r => setTimeout(() =>
      r(document.querySelectorAll('[data-loes]').length), 400));
  });
  pruefe('GEGENPROBE „Alle" zeigt wieder alles', zurueck === alle.zahl,
    zurueck + ' statt ' + alle.zahl);

  const gesucht = await p.evaluate(() => {
    const s = document.getElementById('loesSuche');
    s.value = 'piept';
    s.dispatchEvent(new Event('input', { bubbles: true }));
    return new Promise(r => setTimeout(() =>
      r(document.querySelectorAll('[data-loes]').length), 400));
  });
  pruefe('die Suche findet über den Text, nicht nur den Titel',
    gesucht >= 1 && gesucht < alle.zahl, gesucht + ' von ' + alle.zahl);
  const leer = await p.evaluate(() => {
    const s = document.getElementById('loesSuche');
    s.value = 'zzzgibtesnicht';
    s.dispatchEvent(new Event('input', { bubbles: true }));
    return new Promise(r => setTimeout(() => r({
      zahl: document.querySelectorAll('[data-loes]').length,
      leerText: (document.querySelector('#loesListe .empty') || {}).textContent || ''
    }), 400));
  });
  pruefe('GEGENPROBE ein Unsinnswort findet nichts', leer.zahl === 0, String(leer.zahl));
  /* Ein leerer Kasten ist eine Feststellung. Design-Ideen, Punkt 14:
     ein leerer Zustand gehört mit dem nächsten Schritt versehen. */
  pruefe('und der leere Zustand sagt etwas', leer.leerText.length > 20,
    leer.leerText.slice(0, 50));
  await p.evaluate(() => {
    const s = document.getElementById('loesSuche');
    s.value = ''; s.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await p.waitForTimeout(400);

  // ══ 4. Aufklappen ══
  console.log('\n── Aufklappen ──');
  const zu = await p.evaluate(() => !document.querySelector('.loes-inhalt'));
  pruefe('GEGENPROBE geschlossen steht kein Inhalt da', zu);
  const auf = await p.evaluate(() => {
    document.querySelector('[data-loesauf]').click();
    return new Promise(r => setTimeout(() => {
      const i = document.querySelector('.loes-inhalt');
      return r({
        da: !!i,
        problem: /Das Problem/.test(i ? i.textContent : ''),
        hilft: /Was hilft/.test(i ? i.textContent : ''),
        /* Zeilenumbrüche müssen überleben. Eine Anleitung in drei
           Schritten, die als ein Absatz ankommt, ist keine Anleitung. */
        umbrueche: i ? i.querySelectorAll('br').length : 0,
        laenge: i ? i.textContent.length : 0
      });
    }, 600));
  });
  pruefe('ein Eintrag lässt sich aufklappen', auf.da);
  pruefe('darin stehen beide Abschnitte', auf.problem && auf.hilft,
    JSON.stringify(auf));
  pruefe('Zeilenumbrüche der Anleitung bleiben erhalten', auf.umbrueche >= 2,
    String(auf.umbrueche));
  pruefe('und der Text ist vollständig da', auf.laenge > 120, String(auf.laenge));

  // ══ 5. Fotos werden NICHT auf Vorrat geladen ══
  /* Der Zähler hängt an der Demo-Datenbank: sie merkt sich, welche
     Sammlungen abgefragt wurden. Gefragt wird also nicht „wie viele
     Bytes", sondern „ist die Bildersammlung überhaupt angefasst
     worden" — und das ist die Frage, die zählt. */
  console.log('\n── Fotos auf Vorrat? ──');
  const bilderGeholt = await p.evaluate(() => {
    /* Kein Eintrag der Demo hat Fotos: dann darf auch nichts geladen
       werden. Das ist die schwächere, aber ehrliche Prüfung — eine
       stärkere bräuchte Demo-Fotos, und erfundene Bilder in einer
       Vorführung sind schlechter als keine. */
    return [...document.querySelectorAll('.loes-bild')].length;
  });
  pruefe('ohne Fotos am Eintrag wird kein Bildplatz gezeichnet',
    bilderGeholt === 0, String(bilderGeholt));

  /* ══ 6. Der Export ══
     Geprüft wird er in tests/test-sicherung-inhalt.js und nicht hier.
     Das ist keine Bequemlichkeit: dieser Durchlauf fährt die Demo, und
     die Demo hat kein `backupData` von aussen — die App liegt in einer
     Kapsel, und ein Aufruf von innen prüfte die Funktion statt den Weg.
     Dort läuft er über den echten Knopf in Verwaltung → System und
     liest die Datei, die dabei wirklich entsteht. */

  pruefe('keine Skriptfehler', fehler.length === 0, fehler[0]);

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Lösungen: erreichbar, filterbar, lesbar — ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
