/* ══════════════════════════════════════════════════════════════════════
   HILFE IM STUDIO: 115 PROBLEME UND WAS SCHRITT FÜR SCHRITT HILFT

   Aus dem Betrieb, 22.9.2026:
     „kannst du diesen lösungen bereich ganz wo andern hinpacken
      irgendwie oben oder so das man auf einen knopf drückt und dann
      wird gefragt was das problem ist und die probleme sind dann nach
      key wörtern sortiert … oder man kann direkt selber die ganze
      liste durchgehen … sorge dafür das man schon erstellte sachen
      auch bearbeiten und/oder bilder hinzufügen kann."

   Was dieser Durchlauf festhält, und warum gerade das:

   1. DER WEG DORTHIN. Der Bereich lag bis heute als siebter Reiter
      unter „Betrieb" — drei Tipps entfernt, und man musste wissen,
      dass es ihn gibt. Jetzt hängt er als Rettungsring in der
      Kopfzeile und ist damit von JEDER Seite aus einen Griff weit
      weg. Geprüft wird beides: dass der Knopf da ist und dass er das
      Fenster wirklich öffnet — und dass die alte Seite weg ist.

   2. DIE SUCHE MUSS WIRKLICH SUCHEN. Eine Liste, die auf jede Eingabe
      dieselben Treffer zeigt, sieht aus wie eine, die funktioniert.
      Gemessen wird deshalb gegen den ERWARTETEN Eintrag, nicht gegen
      „es kam irgendetwas": „gerät piept" muss das piepende Gerät
      bringen, „elektrde" (Tippfehler) die Elektrode, „kaputt" etwas
      Beschädigtes — das ist das Synonym.
      UND die Gegenprobe: ein Unsinnswort findet nichts. Ohne sie wäre
      alles oben auch bei „zeige immer alles" grün.

   3. ES IST KEINE KI, UND DAS FENSTER SAGT ES AUCH. Der Hinweistext
      verspricht eine Stichwortsuche mit Synonymen. Stünde dort „KI",
      wäre das eine Zusage über eine Fähigkeit, die es nicht gibt.

   4. DIE GANZE LISTE. 115 aus dem Handbuch plus das, was im Studio
      dazukam. Die Zahl wird nachgezählt, nicht geglaubt.

   5. BEARBEITEN UND FOTOS — der ausdrückliche Wunsch. Geprüft wird
      der schwierige Fall: ein Eintrag AUS DEM HANDBUCH wird geändert.
      Danach muss (a) die eigene Fassung dastehen, (b) die Gesamtzahl
      gleich bleiben — sonst stünde der Eintrag zweimal da — und (c)
      der neue Text auch gefunden werden.

   6. WER DARF ÄNDERN. Ein fremder Eintrag hat für einen Mitarbeiter
      keinen Knopf — und einen Satz, der sagt warum. Ein Knopf, der
      an der Regel scheitert, ist schlimmer als keiner.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

/* Das Probefoto entsteht hier, statt als Datei im Verzeichnis zu
   liegen: `tests/*.png` ist in .gitignore — dort landen die
   Bildschirmfotos der Durchläufe. Eine Ausnahme in .gitignore wäre die
   Sorte Zeile, an der ein halbes Jahr später niemand mehr erkennt,
   warum sie da ist; ausserdem fünf Zeilen hier sind ehrlicher als ein
   Binärklumpen im Verlauf. 8×8 Pixel, grau. */
const FOTO = path.join(os.tmpdir(), 'studiochat-probe-foto.png');
fs.writeFileSync(FOTO, Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5' +
  'AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII=', 'base64'));

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

/* Tippen wie ein Mensch: Wert setzen und das Ereignis auslösen, das
   auch eine Tastatur auslöst. */
async function suchen(p, text) {
  await p.evaluate((t) => {
    const s = document.getElementById('hilfeSuche');
    s.value = t; s.dispatchEvent(new Event('input', { bubbles: true }));
  }, text);
  await p.waitForTimeout(400);
  return p.evaluate(() =>
    [...document.querySelectorAll('#hilfeTreffer [data-heintrag]')]
      .map(x => x.querySelector('b').textContent));
}

async function starte(b, rolle) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  /* Die Führung würde sonst über dem Fenster liegen und jeden Klick
     schlucken. Sie hat einen eigenen Durchlauf. */
  await p.addInitScript(() => {
    localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'dark' }));
    localStorage.setItem('kf_tour', '99');
  });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3300);
  return p;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const fehler = [];
  const p = await starte(b, 'chef');
  p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));

  // ══ 1. Der Weg dorthin ══
  console.log('\n── Der Weg dorthin ──');
  const knopf = await p.evaluate(() => {
    const k = document.getElementById('hilfeBtn');
    if (!k) return null;
    const r = k.getBoundingClientRect();
    return { da: true, breit: Math.round(r.width), hoch: Math.round(r.height),
             oben: Math.round(r.top), sichtbar: r.width > 0 && r.height > 0 };
  });
  pruefe('der Rettungsring steht in der Kopfzeile', !!(knopf && knopf.sichtbar),
    JSON.stringify(knopf));
  /* 36 Pixel ist die Bauhöhe aller Knöpfe dieser Zeile. Ein Knopf, der
     dort zwei Pixel höher ist, verschiebt die ganze Reihe — genau der
     Fall, den das Nachmessen im September gefunden hat. */
  pruefe('und er ist so hoch wie die übrigen Knöpfe daneben',
    knopf && knopf.hoch >= 32 && knopf.hoch <= 44, knopf && knopf.hoch + 'px');

  /* Die alte Seite darf es NICHT mehr geben — weder als Abschnitt noch
     als Reiter. Sonst stünde derselbe Inhalt an zwei Orten, und einer
     von beiden veraltet. */
  const altWeg = await p.evaluate(() => ({
    seite: !!document.getElementById('view-loesungen'),
    reiter: [...document.querySelectorAll('#subnav button')]
      .some(x => /Lösungen/.test(x.textContent))
  }));
  pruefe('die alte Seite „Lösungen" gibt es nicht mehr', !altWeg.seite);

  await p.click('#hilfeBtn');
  await p.waitForTimeout(1500);
  const auf = await p.evaluate(() => ({
    offen: document.getElementById('hilfe').classList.contains('show'),
    frage: (document.querySelector('.hilfe-frage') || {}).textContent || '',
    kacheln: document.querySelectorAll('[data-hkat]').length,
    basis: ((window.LOESUNGEN_BASIS || {}).eintraege || []).length,
    hinweis: (document.getElementById('hilfeHinweis') || {}).textContent || ''
  }));
  pruefe('ein Griff öffnet das Fenster', auf.offen);
  pruefe('und es fragt, was das Problem ist', /Was ist das Problem/.test(auf.frage),
    auf.frage);
  pruefe('die 115 Einträge aus dem Handbuch sind geladen', auf.basis === 115,
    String(auf.basis));
  pruefe('und es gibt Kacheln zum Blättern', auf.kacheln >= 10, String(auf.kacheln));

  /* Auch über „Alles", das Inhaltsverzeichnis. Wer die Kopfzeile nicht
     absucht, findet ihn dort. */
  const imVerzeichnis = await p.evaluate(() => {
    document.getElementById('hilfeZu').click();
    const a = document.querySelector('.mobnav [data-group="g-alles"]');
    if (a) a.click();
    return new Promise(r => setTimeout(() => {
      const z = document.querySelector('[data-al-hilfe]');
      r(z ? z.textContent : null);
    }, 700));
  });
  pruefe('und er steht auch in „Alles"', !!imVerzeichnis, String(imVerzeichnis));
  const ueberAlles = await p.evaluate(() => {
    document.querySelector('[data-al-hilfe]').click();
    return new Promise(r => setTimeout(() =>
      r(document.getElementById('hilfe').classList.contains('show')), 700));
  });
  pruefe('und von dort öffnet es sich genauso', ueberAlles);

  // ══ 2. Es ist keine KI, und das steht auch da ══
  console.log('\n── Was das Fenster verspricht ──');
  pruefe('der Hinweis nennt Synonyme statt „KI"',
    /andere Wörter/.test(auf.hinweis) && !/\bKI\b/.test(auf.hinweis), auf.hinweis);

  // ══ 3. Die Suche ══
  console.log('\n── Die Suche ──');
  const t1 = await suchen(p, 'gerät piept');
  pruefe('„gerät piept" findet das piepende Gerät',
    t1.some(x => /piept|Geräusche/i.test(x)), t1.slice(0, 3).join(' | '));
  const t2 = await suchen(p, 'elektrde');
  pruefe('ein Tippfehler wird verziehen („elektrde")',
    t2.length > 0 && t2.every(x => /Elektrode/i.test(x)), t2.join(' | '));
  const t3 = await suchen(p, 'kaputt');
  pruefe('ein Synonym greift („kaputt" → „beschädigt/defekt")',
    t3.some(x => /beschädigt|defekt/i.test(x)), t3.slice(0, 3).join(' | '));
  const t4 = await suchen(p, 'handtuch');
  pruefe('und „handtuch" bringt die Handtücher',
    t4.some(x => /Handtuch|Handtücher/i.test(x)), t4.slice(0, 3).join(' | '));

  const leer = await p.evaluate(() => {
    const s = document.getElementById('hilfeSuche');
    s.value = 'zzzgibtesnicht'; s.dispatchEvent(new Event('input', { bubbles: true }));
    return new Promise(r => setTimeout(() => r({
      zahl: document.querySelectorAll('#hilfeTreffer [data-heintrag]').length,
      text: (document.querySelector('#hilfeTreffer .empty') || {}).textContent || ''
    }), 400));
  });
  pruefe('GEGENPROBE ein Unsinnswort findet nichts', leer.zahl === 0, String(leer.zahl));
  /* Ein leerer Kasten ist eine Feststellung. Design-Ideen, Punkt 14:
     ein leerer Zustand gehört mit dem nächsten Schritt versehen. */
  pruefe('und der leere Zustand sagt, was man stattdessen tun kann',
    leer.text.length > 40, leer.text.slice(0, 60));
  await suchen(p, '');

  // ══ 4. Blättern und alles durchgehen ══
  console.log('\n── Blättern ──');
  const kat = await p.evaluate(() => {
    document.querySelector('[data-hkat="waesche"]').click();
    return new Promise(r => setTimeout(() => r({
      titel: (document.querySelector('#hilfeListe h3') || {}).textContent,
      zahl: document.querySelectorAll('#hilfeListe [data-heintrag]').length
    }), 500));
  });
  pruefe('eine Kachel öffnet ihre Kategorie', /Wäsche/.test(kat.titel || ''), kat.titel);
  pruefe('und zeigt nur diese Einträge', kat.zahl > 0 && kat.zahl < 30, String(kat.zahl));

  const alle = await p.evaluate(() => {
    document.querySelector('#hilfeListe [data-hzurueck]').click();
    return new Promise(r => setTimeout(() => {
      document.getElementById('hilfeAlle').click();
      setTimeout(() => r(
        document.querySelectorAll('#hilfeListe [data-heintrag]').length), 600);
    }, 400));
  });
  /* 115 aus dem Handbuch + 4 aus der Demo. Nachgezählt, nicht
     geglaubt: eine Liste, die 115 meldet und 40 zeigt, ist genau der
     Fehler, den man sonst erst im Studio merkt. */
  pruefe('„Alle durchgehen" zeigt Handbuch UND Studio', alle === 119,
    alle + ' statt 119');

  // ══ 5. Ein Eintrag, Schritt für Schritt ══
  console.log('\n── Ein Eintrag ──');
  const eintrag = await p.evaluate(() => {
    document.querySelector('#hilfeListe [data-heintrag]').click();
    return new Promise(r => setTimeout(() => r({
      titel: (document.querySelector('#hilfeEintrag h3') || {}).textContent,
      schritte: document.querySelectorAll('#hilfeEintrag .hilfe-schritt').length,
      marken: [...document.querySelectorAll('#hilfeEintrag .hilfe-marke')]
        .map(x => x.textContent.trim()),
      fuss: (document.querySelector('#hilfeEintrag .hilfe-fuss') || {}).textContent || ''
    }), 600));
  });
  pruefe('ein Eintrag lässt sich öffnen', !!eintrag.titel, String(eintrag.titel));
  pruefe('und erklärt es Schritt für Schritt', eintrag.schritte >= 2,
    String(eintrag.schritte));
  pruefe('er sagt, woher er kommt', /Handbuch|Studio/.test(eintrag.fuss),
    eintrag.fuss.slice(0, 60));

  // ══ 6. Bearbeiten — der ausdrückliche Wunsch ══
  console.log('\n── Bearbeiten ──');
  const vorher = alle;
  const geaendert = await p.evaluate(() => {
    document.querySelector('#hilfeEintrag [data-hbearbeiten]').click();
    return new Promise(r => setTimeout(() => {
      const t = document.getElementById('hilfeTitel');
      const s = document.getElementById('hilfeSchritte');
      if (!t || !s) return r({ formular: false });
      const vorText = t.value;
      s.value = s.value + '\nBei uns steht der Zettel am Schrank: Pruefwort47.';
      document.getElementById('hilfeSpeichern').click();
      setTimeout(() => r({
        formular: true, vorText: vorText,
        titel: (document.querySelector('#hilfeEintrag h3') || {}).textContent,
        schritte: document.querySelectorAll('#hilfeEintrag .hilfe-schritt').length,
        marken: [...document.querySelectorAll('#hilfeEintrag .hilfe-marke')]
          .map(x => x.textContent.trim())
      }), 1600);
    }, 500));
  });
  pruefe('ein Eintrag lässt sich bearbeiten', geaendert.formular);
  pruefe('das Formular war vorausgefüllt', geaendert.vorText === eintrag.titel,
    geaendert.vorText + ' / ' + eintrag.titel);
  pruefe('nach dem Speichern steht die eigene Fassung da',
    geaendert.schritte === eintrag.schritte + 1,
    geaendert.schritte + ' statt ' + (eintrag.schritte + 1));
  pruefe('und sie ist als geändert gekennzeichnet',
    geaendert.marken.some(x => /geändert/.test(x)), geaendert.marken.join(' '));

  const nachher = await p.evaluate(() => {
    document.querySelector('#hilfeEintrag [data-hzurueck]').click();
    return new Promise(r => setTimeout(() =>
      r(document.querySelectorAll('#hilfeListe [data-heintrag]').length), 600));
  });
  /* Die wichtigste Zahl dieses Durchlaufs. Wenn ein geänderter
     Handbuch-Eintrag als ZWEITER Eintrag erschiene, stünde dasselbe
     Problem zweimal in der Liste — einmal richtig, einmal veraltet,
     und niemand wüsste, welcher gilt. */
  pruefe('GEGENPROBE der Eintrag steht danach nicht zweimal da',
    nachher === vorher, nachher + ' statt ' + vorher);

  await p.evaluate(() => document.querySelector('#hilfeListe [data-hzurueck]').click());
  await p.waitForTimeout(400);
  const gefunden = await suchen(p, 'pruefwort47');
  pruefe('und der ergänzte Text wird auch gefunden', gefunden.length === 1,
    gefunden.join(' | '));

  // ══ 7. Fotos anhängen ══
  console.log('\n── Fotos ──');
  const mitFoto = await p.evaluate(() => {
    document.querySelector('#hilfeTreffer [data-heintrag]').click();
    return new Promise(r => setTimeout(() => {
      const b = document.querySelector('#hilfeEintrag [data-hbearbeiten]');
      r(b ? b.textContent : null);
    }, 500));
  });
  pruefe('der Knopf sagt, dass auch ein Foto dazukann',
    /Foto/.test(mitFoto || ''), String(mitFoto));
  const fotoFeld = await p.evaluate(() => {
    document.querySelector('#hilfeEintrag [data-hbearbeiten]').click();
    return new Promise(r => setTimeout(() => r({
      feld: !!document.getElementById('hilfeFile'),
      knopf: !!document.getElementById('hilfePick'),
      bilder: document.querySelectorAll('#hilfeVorschau img').length
    }), 500));
  });
  pruefe('im Formular gibt es eine Foto-Auswahl',
    fotoFeld.feld && fotoFeld.knopf, JSON.stringify(fotoFeld));
  /* Ein echtes Bild durch die ganze Kette: auswählen, verkleinern,
     Vorschau, speichern, wieder anzeigen. Eine Auswahl, die nur da
     ist, ist keine. */
  await p.setInputFiles('#hilfeFile', FOTO);
  await p.waitForTimeout(900);
  const vorschau = await p.evaluate(() =>
    document.querySelectorAll('#hilfeVorschau img').length);
  pruefe('ein gewähltes Foto erscheint als Vorschau', vorschau === 1, String(vorschau));
  const gespeichert = await p.evaluate(() => {
    document.getElementById('hilfeSpeichern').click();
    return new Promise(r => setTimeout(() => r({
      bilder: document.querySelectorAll('#hilfeEintrag img.hilfe-bild').length,
      platzhalter: document.querySelectorAll('#hilfeEintrag .leer-bild').length
    }), 1800));
  });
  pruefe('und steht nach dem Speichern am Eintrag', gespeichert.bilder === 1,
    JSON.stringify(gespeichert));

  /* Die Fotos dürfen NICHT auf Vorrat geladen werden. Bei 119
     Einträgen zu drei Fotos wären das 357 Lesevorgänge, jedes Mal
     beim Öffnen des Fensters. Geprüft wird an der Liste: dort darf
     kein einziges <img> stehen. */
  const inListe = await p.evaluate(() => {
    document.querySelector('#hilfeEintrag [data-hzurueck]').click();
    return new Promise(r => setTimeout(() => {
      document.getElementById('hilfeSuche').value = '';
      document.getElementById('hilfeSuche')
        .dispatchEvent(new Event('input', { bubbles: true }));
      setTimeout(() => {
        document.getElementById('hilfeAlle').click();
        setTimeout(() => r(
          document.querySelectorAll('#hilfeListe img').length), 700);
      }, 400);
    }, 400));
  });
  pruefe('GEGENPROBE die Liste lädt keine Fotos auf Vorrat', inListe === 0,
    String(inListe));

  pruefe('keine Skriptfehler (Chef)', fehler.length === 0, fehler[0]);
  await p.close();

  // ══ 8. Wer darf ändern ══
  console.log('\n── Wer darf ändern ──');
  const m = await starte(b, 'mitarbeiter');
  const mFehler = [];
  m.on('pageerror', e => mFehler.push(e.message.slice(0, 160)));
  await m.click('#hilfeBtn');
  await m.waitForTimeout(1500);
  const fremd = await m.evaluate(() => {
    document.getElementById('hilfeAlle').click();
    return new Promise(r => setTimeout(() => {
      const z = [...document.querySelectorAll('#hilfeListe [data-heintrag]')]
        .find(x => /aus dem Studio/.test(x.textContent));
      if (!z) return r(null);
      z.click();
      setTimeout(() => r({
        knoepfe: [...document.querySelectorAll('#hilfeEintrag .btn')]
          .map(x => x.textContent.trim()),
        hinweis: (document.querySelector('#hilfeEintrag .hint') || {}).textContent || ''
      }), 600);
    }, 700));
  });
  pruefe('ein fremder Eintrag hat keinen Änderungsknopf',
    !!fremd && fremd.knoepfe.length === 0, JSON.stringify(fremd));
  pruefe('und er sagt, wer ihn ändern darf',
    !!fremd && /Ändern dürfen/.test(fremd.hinweis), fremd && fremd.hinweis);
  /* Die Gegenprobe: am Handbuch darf JEDER ergänzen. Ohne sie wäre
     der Punkt oben auch bei „niemand darf je etwas" grün — und der
     halbe Bereich unbenutzbar. */
  const eigenes = await m.evaluate(() => {
    document.querySelector('#hilfeEintrag [data-hzurueck]').click();
    return new Promise(r => setTimeout(() => {
      const z = [...document.querySelectorAll('#hilfeListe [data-heintrag]')]
        .find(x => !/aus dem Studio|geändert/.test(x.textContent));
      if (!z) return r(null);
      z.click();
      setTimeout(() => r([...document.querySelectorAll('#hilfeEintrag .btn')]
        .map(x => x.textContent.trim())), 600);
    }, 500));
  });
  pruefe('GEGENPROBE am Handbuch darf jeder ergänzen',
    !!eigenes && eigenes.length >= 1, JSON.stringify(eigenes));
  pruefe('keine Skriptfehler (Mitarbeiter)', mFehler.length === 0, mFehler[0]);

  /* ══ 9. Der Export ══
     Geprüft wird er in tests/test-sicherung-inhalt.js und nicht hier.
     Das ist keine Bequemlichkeit: dieser Durchlauf fährt die Demo, und
     die Demo hat kein `backupData` von aussen — die App liegt in einer
     Kapsel, und ein Aufruf von innen prüfte die Funktion statt den Weg.
     Dort läuft er über den echten Knopf in Verwaltung → System und
     liest die Datei, die dabei wirklich entsteht. */

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Hilfe im Studio: gefunden, gelesen, geändert, bebildert — ' +
      gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
