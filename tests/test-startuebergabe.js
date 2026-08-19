/* ── Übergabe auf der Startseite, und alles als gesehen markieren ─────
   Aus dem Betrieb: „das man die Übergabe auch auf der Startseite sieht
   direkt weil sonst macht das ja kein Sinn und das man sämtliche
   Nachrichten auch als gesehen dort markieren kann."

   Der zweite Halbsatz ist der schwierigere. Ein Knopf, der nur die
   Punkte ausblendet, sieht genauso aus wie einer, der wirklich etwas
   merkt — bis man die App neu lädt.

   Was hier wirklich geprüft wird:

     1. Die Übergabe steht auf der Startseite, über ALLE eigenen Studios
        — nicht nur über das, was im Team-Bereich zufällig gewählt ist.
     2. Alte fällt raus (7 Tage), fremde Studios fallen raus.
     3. Ungelesen zählt richtig: eine EIGENE Übergabe ist nicht
        ungelesen. Wer sie selbst geschrieben hat, braucht keinen Punkt.
     4. Der Knopf SCHREIBT etwas, und zwar unter privat/<uid>. Ohne das
        wären die Punkte beim nächsten Öffnen wieder da.
     5. Der Knopf ist weg, wenn es nichts zu markieren gibt. Ein Knopf,
        der immer dasteht, wird nicht mehr wahrgenommen.
     6. Gegenprobe über die Rolle: die Verwaltung bekommt an eigenen
        Aushängen keinen Punkt — den könnte sie nie abstellen.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
const pruefe = (b, m) => { if (!b) errs.push(m); };

async function seite(b, stub, vorbelegt, uebergaben) {
  const p = await b.newPage({ viewport: { width: 430, height: 900 } });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  p.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text())) {
      errs.push('KONSOLE: ' + m.text().slice(0, 160));
    }
  });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript({ path: path.join(SP, stub) });
  if (vorbelegt) await p.addInitScript(`window.__privatDoc = ${JSON.stringify(vorbelegt)};`);
  if (uebergaben) await p.addInitScript(`window.__handovers = ${JSON.stringify(uebergaben)};`);
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  return p;
}

const stand = p => p.evaluate(() => ({
  hoDa: (document.getElementById('homeHoCard') || {}).offsetParent !== null,
  hoTexte: [...document.querySelectorAll('#homeHoList .lese-text')]
    .map(x => x.textContent.trim().slice(0, 30)),
  hoFuss: [...document.querySelectorAll('#homeHoList .lese-fuss')]
    .map(x => x.textContent.trim()),
  hoPunkte: document.querySelectorAll('#homeHoList .lese-neu').length,
  annPunkte: document.querySelectorAll('#homeAnnList .lese-neu').length,
  knopfDa: (document.getElementById('homeAllesGelesen') || {}).offsetParent !== null,
  knopfText: (document.getElementById('homeAllesGelesen') || {}).textContent || ''
}));

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  // ══ 1. Mitarbeiter: ein Studio ══
  {
    const p = await seite(b, 'stub-mitarbeiter.js');
    const r = await stand(p);
    console.log('Mitarbeiter — Übergaben:', JSON.stringify(r.hoTexte));
    console.log('  Punkte:', r.hoPunkte, '· Aushang-Punkte:', r.annPunkte,
      '· Knopf:', JSON.stringify(r.knopfText));

    pruefe(r.hoDa, 'ÜBERGABE: die Karte steht nicht auf der Startseite');
    pruefe(r.hoTexte.length === 2,
      'ÜBERGABE: ' + r.hoTexte.length + ' Einträge statt 2 (' +
      JSON.stringify(r.hoTexte) + ')');
    pruefe(r.hoTexte.some(t => /Beinpresse/.test(t)),
      'ÜBERGABE: die fremde Übergabe fehlt (' + JSON.stringify(r.hoTexte) + ')');
    /* Zwei Gegenproben in einem: zu alt und fremdes Studio. Ohne sie
       wäre auch ein Lader grün, der einfach alles holt. */
    pruefe(!r.hoTexte.some(t => /Uralte/.test(t)),
      'ZU ALT: eine 9 Tage alte Übergabe steht noch da');
    pruefe(!r.hoTexte.some(t => /Drei Tage alt/.test(t)),
      'GRENZE: eine 3 Tage alte Übergabe steht in der Liste');
    pruefe(!r.hoTexte.some(t => /Fremdes Studio/.test(t)),
      'FREMD: die Übergabe eines Studios, in dem diese Person nicht ' +
      'arbeitet, steht auf ihrer Startseite');

    /* Der Kern von Punkt 3: zwei Einträge, aber nur EINER ist neu.
       Der andere ist von ihr selbst. */
    pruefe(r.hoPunkte === 1,
      'EIGENES: ' + r.hoPunkte + ' Punkte statt 1 — die selbst geschriebene ' +
      'Übergabe darf nicht als ungelesen gelten');
    pruefe(/1 Aushang|neu/.test(r.knopfText) && /2 neu/.test(r.knopfText),
      'KNOPF: „' + r.knopfText + '" — erwartet 2 neu (1 Aushang + 1 Übergabe)');

    // ══ 4. Was schreibt der Knopf? ══
    const nachher = await p.evaluate(async () => {
      window.__schreib = [];
      document.getElementById('homeAllesGelesen').click();
      await new Promise(r => setTimeout(r, 600));
      return {
        schreib: (window.__schreib || []).filter(w => /privat/.test(w.pfad)),
        annSchreib: (window.__schreib || []).filter(w => /announcements/.test(w.pfad)).length,
        punkteHo: document.querySelectorAll('#homeHoList .lese-neu').length,
        punkteAnn: document.querySelectorAll('#homeAnnList .lese-neu').length,
        knopfWeg: (document.getElementById('homeAllesGelesen') || {}).offsetParent === null
      };
    });
    console.log('Knopf schreibt:', JSON.stringify(nachher.schreib));
    console.log('  Aushang-Schreibvorgänge:', nachher.annSchreib,
      '· Punkte danach:', nachher.punkteHo, '/', nachher.punkteAnn);

    const w = nachher.schreib[0];
    if (!w) errs.push('NICHT GEMERKT: der Knopf schreibt nichts unter privat/<uid> — ' +
      'beim nächsten Öffnen stehen alle Punkte wieder da');
    else {
      pruefe(/privat\/testuid$/.test(w.pfad),
        'ZIEL: geschrieben wurde nach „' + w.pfad + '"');
      pruefe(w.daten && typeof w.daten.gelesenHo === 'number' &&
             typeof w.daten.gelesenBrett === 'number',
        'INHALT: geschrieben wurde ' + JSON.stringify(w.daten) +
        ' — erwartet gelesenHo und gelesenBrett als Zeitstempel');
    }
    /* Aushänge gehen weiter ihren eigenen Weg: readBy am Dokument,
       damit der Überblick weiter sagen kann, WER noch nicht gelesen
       hat. Ein Zeitstempel je Konto könnte das nicht. */
    pruefe(nachher.annSchreib > 0,
      'AUSHÄNGE: der Knopf trägt niemanden in readBy ein — dann weiss die ' +
      'Verwaltung weiterhin nicht, wer gelesen hat');
    pruefe(nachher.punkteHo === 0 && nachher.punkteAnn === 0,
      'ANZEIGE: nach dem Klick stehen noch Punkte da (' + nachher.punkteHo +
      '/' + nachher.punkteAnn + ') — wer weiter Punkte sieht, klickt nochmal');
    pruefe(nachher.knopfWeg,
      'KNOPF: er steht noch da, obwohl nichts mehr ungelesen ist');
    await p.close();
  }

  /* ══ 5. Vorbelegter Stand: schon gelesen, also kein Punkt ══
     Die Gegenprobe zu Punkt 4. Ohne sie wäre auch eine Anzeige grün,
     die den gespeicherten Stand gar nicht ausliest. */
  {
    const p = await seite(b, 'stub-mitarbeiter.js',
      { gelesenHo: Date.now(), gelesenBrett: Date.now() });
    const r = await stand(p);
    console.log('Mit gespeichertem Stand — Übergabe-Punkte:', r.hoPunkte,
      '· Knopf:', JSON.stringify(r.knopfText), '· sichtbar:', r.knopfDa);
    pruefe(r.hoDa, 'ÜBERGABE: die Karte ist weg, obwohl es Einträge gibt — ' +
      'gelesen heisst nicht unsichtbar');
    pruefe(r.hoTexte.length === 2,
      'ÜBERGABE: gelesene Einträge verschwinden (' + r.hoTexte.length + ')');
    pruefe(r.hoPunkte === 0,
      'STAND: ' + r.hoPunkte + ' Punkte trotz gespeichertem Gelesen-Stand — ' +
      'der Stand wird nicht ausgelesen');
    await p.close();
  }

  /* ══ Die 24-Stunden-Grenze, eindeutig geprüft ══
     Aus dem Betrieb: „bringt ja nichts wenn man 7 Tage lang sieht was
     am selben Tag nützlich ist."

     Der erste Anlauf dieser Prüfung war wertlos: er sah nach, ob ein
     drei Tage alter Eintrag in der Liste steht — die zeigt aber nur die
     zwei jüngsten, also stand er auch bei sieben Tagen nicht drin. Die
     Gegenprobe fiel damals nur zufällig auf, weil der Zähler daneben
     von 2 auf 3 sprang.

     Hier gibt es deshalb NUR alte Übergaben. Bei 24 Stunden muss die
     Karte ganz verschwinden; bei sieben Tagen stünde sie da. Das ist
     nicht zu verwechseln. */
  {
    const p = await seite(b, 'stub-mitarbeiter.js', null, {
      'studio-6': [
        { id: 'a1', text: 'Zwei Tage alt.', uid: 'u2', name: 'Anna Meier',
          ts: Date.now() - 2 * 86400000 },
        { id: 'a2', text: 'Fünf Tage alt.', uid: 'u3', name: 'Ben Kraus',
          ts: Date.now() - 5 * 86400000 }
      ]
    });
    const r = await stand(p);
    console.log('Nur alte Übergaben — Karte sichtbar:', r.hoDa,
      '· Einträge:', r.hoTexte.length);
    pruefe(!r.hoDa && r.hoTexte.length === 0,
      'GRENZE: bei nur zwei und fünf Tage alten Übergaben steht die Karte ' +
      'noch da (' + r.hoTexte.length + ' Einträge) — eine Übergabe gilt ' +
      'einen Tag, danach ist sie überholt');
    await p.close();
  }

  /* Und die Gegenprobe dazu: eine FRISCHE Übergabe muss sehr wohl
     erscheinen. Ohne diese Zeile wäre auch eine Karte grün, die gar
     nichts mehr zeigt. */
  {
    const p = await seite(b, 'stub-mitarbeiter.js', null, {
      'studio-6': [
        { id: 'f1', text: 'Frisch von der letzten Schicht.', uid: 'u2',
          name: 'Anna Meier', ts: Date.now() - 3 * 3600000 }
      ]
    });
    const r = await stand(p);
    console.log('Nur frische Übergabe — Karte sichtbar:', r.hoDa,
      '·', JSON.stringify(r.hoTexte));
    pruefe(r.hoDa && r.hoTexte.length === 1,
      'GEGENPROBE: eine 3 Stunden alte Übergabe fehlt (' +
      JSON.stringify(r.hoTexte) + ') — dann zeigt die Karte gar nichts mehr');
    await p.close();
  }

  /* ══ 6. GEGENPROBE über die Rolle ══ */
  {
    const p = await seite(b, 'stub-chef.js');
    const r = await stand(p);
    console.log('Verwaltung — Übergaben:', JSON.stringify(r.hoTexte));
    console.log('  Punkte:', r.hoPunkte, '· Aushang-Punkte:', r.annPunkte,
      '· Knopf:', JSON.stringify(r.knopfText));
    pruefe(r.annPunkte === 0,
      'VERWALTUNG: ' + r.annPunkte + ' Ungelesen-Punkte an eigenen Aushängen — ' +
      'die liessen sich nie abstellen, weil readBy für Chefs nie gefüllt wird');
    /* Der Chef hat alle Studios, sieht also auch die aus studio-7. */
    pruefe(r.hoTexte.some(t => /Putzschrank/.test(t)),
      'VERWALTUNG: die Übergabe aus dem zweiten Studio fehlt (' +
      JSON.stringify(r.hoTexte) + ') — auf der Startseite gehen alle eigenen ' +
      'Studios ein, nicht nur das im Team-Bereich gewählte');
    pruefe(r.hoPunkte === 2,
      'VERWALTUNG: ' + r.hoPunkte + ' Punkte statt 2');
    /* Beim Chef mit mehreren Studios muss der Ort dabeistehen. Sonst
       sind vierzehn Übergaben untereinander eine Auskunft ohne Ort. */
    pruefe(r.hoFuss.some(f => /Hürth|Brühl/.test(f)),
      'ORT: bei mehreren Studios fehlt der Studioname (' +
      JSON.stringify(r.hoFuss) + ')');
    await p.close();
  }

  await b.close();
  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Startseite: die Übergabe steht da — über alle eigenen Studios, ohne ' +
      'alte und ohne fremde — und „alles gelesen" merkt sich das wirklich');
  process.exit(errs.length ? 1 : 0);
})();
