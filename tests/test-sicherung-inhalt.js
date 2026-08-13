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

      // ══ 5. Direktnachrichten dürfen NICHT drin sein ══
      if (d.dm || d.direktnachrichten || /"dms?"\s*:/.test(roh)) {
        errs.push('GEFÄHRLICH: Direktnachrichten liegen in der Sicherung — die gehören zwei Personen');
      }

      // ══ 1. Die versprochenen Bereiche ══
      ['studios', 'team', 'infos', 'chat', 'brett', 'dokumente', 'nachweise']
        .forEach(k => { if (d[k] === undefined) errs.push('FEHLT: der Bereich „' + k + '" ist gar nicht da'); });

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
    : '\n✓ Sicherung: alles Versprochene drin, Direktnachrichten bewusst nicht, Verzeichnis dabei');
  process.exit(errs.length ? 1 : 0);
})();
