/* ── Was wirklich in der Sicherung steht ──────────────────────────────
   An einer Sicherungsfunktion ist eine Halbwahrheit besonders teuer: sie
   fällt erst an dem Tag auf, an dem man die Datei braucht — also wenn
   ohnehin schon etwas schiefgegangen ist. Geprüft wird deshalb der
   INHALT der Datei, nicht ob ein Knopf reagiert:

     1. Alle versprochenen Bereiche sind da und nicht leer.
     2. Der Putzplan trägt das Kürzel mit.
     3. Die Aufgabe trägt den Grund mit.
     4. Es gibt ein Verzeichnis, das sagt, was NICHT enthalten ist. Eine
        Sicherung mit bekannter Lücke ist brauchbar, eine mit unbekannter
        gefährlich.
     5. Direktnachrichten sind NICHT enthalten — die gehören zwei
        Personen, nicht dem Betrieb.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  /* Den Download abfangen statt wirklich zu speichern: geprüft wird der
     INHALT, und der geht durch Blob + createObjectURL. */
  await page.addInitScript(`
    window.__gespeichert = null;
    var echtBlob = window.Blob;
    window.Blob = function(teile, opt){
      try{
        if (opt && /json/.test(opt.type||'')) window.__gespeichert = String(teile[0]);
      }catch(e){}
      return new echtBlob(teile, opt);
    };
    window.URL.createObjectURL = function(){ return 'blob:test'; };
    window.URL.revokeObjectURL = function(){};`);
  await page.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);

  // Über die echte Oberfläche: Verwaltung → System → Knopf
  const gedrueckt = await page.evaluate(async () => {
    const g = document.querySelector('.mobnav [data-group="g-chef"]');
    if (g) g.click();
    await new Promise(r => setTimeout(r, 400));
    const t = document.querySelector('#chefHome [data-cgo="system"]');
    if (t) t.click();
    await new Promise(r => setTimeout(r, 700));
    const b2 = document.getElementById('expJson');
    if (!b2) return false;
    b2.click();
    await new Promise(r => setTimeout(r, 2500));
    return true;
  });
  if (!gedrueckt) errs.push('AUFBAU: den Knopf „Alles als Daten-Datei" gibt es nicht');

  const roh = await page.evaluate(() => window.__gespeichert);
  if (!roh) {
    errs.push('FEHLT: es wurde gar keine Datei erzeugt');
  } else {
    let d = null;
    try { d = JSON.parse(roh); } catch (e) { errs.push('KAPUTT: die Datei ist kein gültiges JSON'); }
    if (d) {
      console.log('Bereiche in der Datei:', JSON.stringify(Object.keys(d)));

      // ══ 4. Das Verzeichnis ══
      if (!d.hinweise || !d.hinweise.nichtEnthalten) {
        errs.push('FEHLT: die Datei sagt nicht, was NICHT drin ist — genau das war der alte Fehler');
      } else {
        const nicht = d.hinweise.nichtEnthalten.join(' ');
        if (!/Direktnachrichten/i.test(nicht)) {
          errs.push('FEHLT: dass Direktnachrichten fehlen, steht nirgends');
        }
        console.log('Nicht enthalten:', JSON.stringify(d.hinweise.nichtEnthalten.length) + ' Punkte');
      }

      /* ══ 4b. Lösungen, seit dem 22.9.2026 ══
         Eine neue Sammlung, die nicht mitgeht, ist genau die Zusage,
         die einen Tag vorher gebrochen war — damals bei den
         Stempelzeiten. Dass sie hier steht und nicht in
         test-loesungen.js, hat einen Grund: DIESER Durchlauf liest die
         Datei, die beim Druck auf den echten Knopf wirklich entsteht. */
      if (!Array.isArray(d.loesungen)) {
        errs.push('FEHLT: die Lösungen stehen nicht in der Datei');
      } else {
        console.log('Lösungen in der Datei:', d.loesungen.length);
        if (!d.loesungen.length) {
          errs.push('LEER: das Feld „loesungen" ist da, aber nichts darin — ' +
                    'die Attrappe kennt zwei Einträge');
        } else {
          const l = d.loesungen[0];
          /* `schritte` seit dem 22.9.2026: eine Anleitung ist eine
             Reihenfolge, und die geht verloren, wenn sie nur als ein
             Textklumpen in der Datei steht. `loesung` bleibt daneben
             stehen — die Tabellenfassung braucht eine Zelle, und jede
             ältere Auswertung liest dieses Feld.
             `herkunft` sagt, ob der Eintrag aus dem Studio kommt oder
             eine Änderung am Handbuch ist. Ohne sie liest man in der
             Sicherung eine Studio-Fassung und hält sie für eine
             eigene Entdeckung. */
          ['titel', 'problem', 'loesung', 'schritte', 'herkunft'].forEach(f => {
            if (!(f in l)) errs.push('FEHLT: den Lösungen fehlt das Feld „' + f + '"');
          });
          if (!Array.isArray(l.schritte) || !l.schritte.length) {
            errs.push('LEER: die Schritte stehen nicht als Liste in der Datei — ' +
                      'dann ist die Reihenfolge nur noch Formatierung');
          }
          /* Die Fotos gehören NICHT hinein (sie machen die Datei
             unbenutzbar), aber die Anzahl schon — sonst weiss niemand,
             dass welche fehlen. */
          if (!('fotos' in l)) {
            errs.push('FEHLT: die Zahl der Fotos steht nicht dabei — dann sieht ' +
                      'niemand, dass welche fehlen');
          }
        }
        if (/"data"\s*:\s*"data:image/.test(roh)) {
          errs.push('ZU VIEL: ein Foto liegt als Bilddatei in der Sicherung — ' +
                    'damit ist die Datei nicht mehr zu öffnen');
        }
        const nennt = (d.hinweise.enthalten || []).join(' ');
        if (!/Lösungen/i.test(nennt)) {
          errs.push('FEHLT: das Verzeichnis oben nennt die Lösungen nicht');
        }
      }

      // ══ 5. Direktnachrichten dürfen NICHT drin sein ══
      if (d.dm || d.direktnachrichten || /"dms?"\s*:/.test(roh)) {
        errs.push('GEFÄHRLICH: Direktnachrichten liegen in der Sicherung — die gehören zwei Personen');
      }

      /* ══ 5b. UND SONST KEIN GEHEIMNIS ══
         Neu am 21.9.2026, zusammen mit den Stempelzeiten. Die Frage
         „sind Direktnachrichten drin" prueft EINEN Fall; sie sagt
         nichts ueber den naechsten Bereich, den jemand aufnimmt.

         Eine Sicherungsdatei liegt im Download-Ordner, geht per Mail
         herum und landet irgendwann bei einem Steuerberater. Was darin
         steht, ist damit aus der Hand gegeben — ein Stempel-PIN oder
         ein Terminal-Code darin macht aus der Datei einen Schluessel. */
      [['zeitPins', 'Stempel-PINs'], ['terminalCodes', 'Terminal-Codes'],
       ['pushTokens', 'Push-Kennungen'], ['privat', 'der persönliche Bereich']]
        .forEach(([feld, wort]) => {
          if (new RegExp('"' + feld + '"\\s*:').test(roh))
            errs.push('GEFÄHRLICH: ' + wort + ' liegen in der Sicherung');
        });
      /* Und die Felder, an denen ein Geheimnis haengt, egal wie der
         Bereich heisst. `hash` traegt den scrypt-Wert der PIN. */
      ['"hash"', '"geheim"', '"secret"'].forEach(f => {
        if (roh.indexOf(f) >= 0)
          errs.push('GEFÄHRLICH: das Feld ' + f + ' steht in der Sicherung');
      });

      // ══ 1. Die versprochenen Bereiche ══
      ['studios', 'team', 'infos', 'chat', 'brett', 'dokumente', 'nachweise',
       'stempelzeiten', 'anliegen', 'probetrainings']
        .forEach(k => { if (d[k] === undefined) errs.push('FEHLT: der Bereich „' + k + '" ist gar nicht da'); });

      /* ══ 1b. Die drei Bereiche vom 21.9.2026 ══
         Sie kamen dazu, weil der Export sie ausliess — und zwar
         ausgerechnet die mit Personenbezug. Eine Zusage „Sie koennen
         einen Export verlangen" ist ohne die Arbeitszeiten nicht
         eingeloest (AGB-Entwurf § 8).

         Geprueft wird GEFUELLT, nicht vorhanden: ein leeres Feld sieht
         aus wie gesichert und ist es nicht. */
      if (!(d.stempelzeiten || []).length)
        errs.push('LEER: keine einzige Stempelzeit in der Sicherung');
      if (!(d.anliegen || []).length)
        errs.push('LEER: kein einziges Anliegen in der Sicherung');
      if (!(d.probetrainings || []).length)
        errs.push('LEER: kein einziges Probetraining in der Sicherung');
      console.log('Stempelzeiten:', (d.stempelzeiten || []).length,
        '· Anliegen:', (d.anliegen || []).length,
        '· Probetrainings:', (d.probetrainings || []).length);

      const z0 = (d.stempelzeiten || [])[0] || {};
      ['person', 'tag', 'zeit', 'art', 'studio'].forEach(f => {
        if (!(f in z0)) errs.push('FEHLT: ein Stempel ohne Feld „' + f + '"');
      });
      /* Das Wort, nicht die Kennung. Beim ersten Bauen stand hier ein
         erfundenes „kommt/geht" — Vokabular, das es im Datenbestand
         gar nicht gibt. TM_WORT ist die Liste, die auch die Oberflaeche
         benutzt. */
      const arten = [...new Set((d.stempelzeiten || []).map(z => z.art))];
      console.log('Stempelarten:', JSON.stringify(arten));
      if (arten.some(a => /^(kommen|pause|zurueck|gehen)$/.test(a)))
        errs.push('ROH: eine Stempelart steht als Kennung statt als Wort (' + arten.join(',') + ')');

      /* Ein beantwortetes Anliegen muss die ANTWORT mitbringen. Ohne
         sie waere der Export die halbe Unterhaltung. */
      const beantwortet = (d.anliegen || []).filter(a => a.status === 'beantwortet');
      if (beantwortet.length && !beantwortet.some(a => a.antwort))
        errs.push('FEHLT: ein beantwortetes Anliegen ohne die Antwort');

      /* Probetrainings halten fest, WELCHER MITARBEITER eines gemacht
         hat — nicht, wer der Interessent war. Ohne den Namen ist der
         Eintrag wertlos, und beim ersten Bauen war genau er leer: die
         Feldnamen waren geraten. */
      const ohneName = (d.probetrainings || []).filter(t => !t.mitarbeiter).length;
      if (ohneName) errs.push('LEER: ' + ohneName + ' Probetrainings ohne Mitarbeiter');

      const s6 = d.studios && (d.studios['Hürth'] || {});
      console.log('Bereiche je Studio:', JSON.stringify(Object.keys(s6)));
      ['aufgaben', 'material', 'putzplan', 'putzNotizen', 'geraete', 'geraeteVerlauf',
       'schichten', 'abwesenheiten', 'uebergaben'].forEach(k => {
        if (s6[k] === undefined) errs.push('FEHLT: „' + k + '" fehlt beim Studio');
      });

      /* Nicht nur vorhanden, sondern GEFÜLLT. Ein leeres Feld sieht aus
         wie „gesichert" und ist es nicht — dieselbe Halbwahrheit, nur
         eine Ebene tiefer. */
      if (s6.putzplan && !s6.putzplan.length) errs.push('LEER: der Putzplan ist im Test befüllt, in der Sicherung nicht');
      if (s6.geraete && !s6.geraete.length) errs.push('LEER: die Geräte sind im Test befüllt, in der Sicherung nicht');
      if (s6.putzNotizen && !s6.putzNotizen.length) errs.push('LEER: die Putz-Notizen fehlen');

      const chatKanaele = Object.keys(d.chat || {});
      console.log('Chat-Kanäle:', JSON.stringify(chatKanaele));
      const irgendChat = chatKanaele.some(k => (d.chat[k] || []).length);
      if (!irgendChat) errs.push('LEER: kein einziger Chat-Eintrag in der Sicherung');

      // ══ 2. Das Kürzel im Putzplan ══
      const mitKuerzel = (s6.putzplan || []).some(t => 'kuerzel' in t);
      if (!mitKuerzel) errs.push('FEHLT: der Putzplan in der Sicherung kennt kein Kürzel');

      // ══ 3. Der Grund an der Aufgabe ══
      const mitGrund = (s6.aufgaben || []).some(t => 'grund' in t);
      if (!mitGrund) errs.push('FEHLT: die Aufgaben in der Sicherung kennen keinen Grund');
    }
  }

  await b.close();
  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Sicherung: alles Versprochene drin (auch Stempelzeiten, Anliegen, ' +
      'Probetrainings), kein Geheimnis dabei, Verzeichnis dabei');
  process.exit(errs.length ? 1 : 0);
})();
