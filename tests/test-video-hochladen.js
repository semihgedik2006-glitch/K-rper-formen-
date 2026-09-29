/* ══════════════════════════════════════════════════════════════════════
   SCHULUNGSVIDEOS HOCHLADEN (29.9.2026)

   Aus dem Betrieb: „ich hab jetzt die schulungsvideos in einem ordner"
   und „ich würde die dateien größe auf 4gb erhöhen weil ein video halt
   auch 4gb groß ist".

   In der Demo (die Attrappe des Video-Eimers zählt hoch und gibt eine
   blob:-Adresse zurück). Den echten Eimer erreicht dieser Durchlauf
   NICHT — das Firebase-SDK lädt hier nicht. Die Regeln des Eimers prüft
   tests/rules/videos.test.js gegen den Emulator.

   1. Ohne Browser: die Grenze in storage-videos.rules und in index.html
      ist dieselbe; Eimer in konfig.js, Ziele in firebase.json und
      .firebaserc passen zusammen; die Probe hat keinen Eimer; die
      Sicherheitsregel lässt die Abspiel-Adresse zu.
   2. Knopf „Video hochladen" bei Video- und Lese-Schritten, nicht bei
      Text und Bild. Nicht für Mitarbeitende.
   3. Hochladen: Fortschritt, Knopf gesperrt, Speichern gesperrt; danach
      steht die Adresse im Feld, und nach „Speichern" im Modul.
   4. Abbrechen, falsche Datei, zu gross: klare Meldung, Feld unverändert.
   5. „Zurück" während des Hochladens: erst beim zweiten Mal.
   6. Treffer ≥ 44 × 44 bei 320 / 390 / 430 / 820 / 1280 / 1440 / 1920,
      normal und kompakt; keine Querlaufleiste.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const WURZEL = path.join(__dirname, '..');

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
const TREFFER = (el) => {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0 };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--;
  while (u < innerHeight && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--;
  while (re < innerWidth && trifft(re + 1, cy)) re++;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1) };
};

/* ── 1. Ohne Browser ── */
function ohneBrowser() {
  console.log('── 1. Grenze, Eimer, Ziele ──');
  const regeln = fs.readFileSync(path.join(WURZEL, 'storage-videos.rules'), 'utf8');
  const html = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
  const rechne = (t) => t.split('*').map(x => Number(x.trim())).reduce((a, b) => a * b, 1);
  const r = /request\.resource\.size\s*<=?\s*([\d\s*]+);/.exec(regeln);
  const h = /var VIDEO_GRENZE = ([\d\s*]+);/.exec(html);
  const inRegeln = r ? rechne(r[1]) : NaN, inApp = h ? rechne(h[1]) : NaN;
  pruefe('die Grenze ist in Regeln und App dieselbe (' + inRegeln + ')', inRegeln === inApp && inRegeln > 0, inRegeln + ' / ' + inApp);
  /* „ein video halt auch 4gb groß ist" — in beiden Zählweisen. */
  pruefe('ein Video mit „4 GB" passt, auch in Windows-Zählung (4,2 GiB)', inRegeln >= 4.2 * 1073741824, String(inRegeln));

  /* Ohne Typ, aber .mov: wird als Video erkannt (manche Rechner geben
     keinen Typ mit). Die Funktion selbst, aus dem Quelltext. */
  const quelle = (/function videoTyp\(d\)\{[\s\S]*?\n\}/.exec(html) || [''])[0];
  let typ = [];
  try { const f = new Function(quelle + '; return videoTyp;')(); typ = [f({ name: 'a.MOV', type: '' }), f({ name: 'b.mp4', type: '' }), f({ name: 'c.pdf', type: '' }), f({ name: 'd.bin', type: 'video/webm' })]; } catch (e) { typ = [String(e)]; }
  pruefe('ohne Typ: .mov und .mp4 aus der Endung, .pdf nicht; ein mitgegebener Typ gilt', typ.join('|') === 'video/quicktime|video/mp4||video/webm', typ.join('|'));

  const vm = require('vm');
  const lade = (host, such) => {
    const c = { location: { hostname: host, search: such || '' } }; c.self = c;
    vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(WURZEL, 'konfig.js'), 'utf8'), c);
    return c.KONFIG;
  };
  const betrieb = lade('formenchat.web.app'), probe = lade('formenchat-probe.web.app');
  pruefe('konfig.js: Betrieb nutzt den Eimer formenchat-schulungsvideos', betrieb.videoEimer === 'formenchat-schulungsvideos', betrieb.videoEimer);
  pruefe('konfig.js: die Probe hat keinen Video-Eimer (kein Knopf dort)', probe.videoEimer === '', JSON.stringify(probe.videoEimer));
  pruefe('der Video-Eimer ist NICHT der Eimer der Sicherung', betrieb.videoEimer !== betrieb.firebase.storageBucket);

  const fj = JSON.parse(fs.readFileSync(path.join(WURZEL, 'firebase.json'), 'utf8'));
  const rc = JSON.parse(fs.readFileSync(path.join(WURZEL, '.firebaserc'), 'utf8'));
  const ziele = ((rc.targets || {}).formenchat || {}).storage || {};
  const st = Array.isArray(fj.storage) ? fj.storage : [];
  const regelFuer = (eimer) => { const z = Object.keys(ziele).find(k => (ziele[k] || []).indexOf(eimer) >= 0); const e = st.find(x => x.target === z); return e && e.rules; };
  pruefe('firebase.json/.firebaserc: der Sicherungs-Eimer bekommt storage.rules', regelFuer(betrieb.firebase.storageBucket) === 'storage.rules', JSON.stringify({ st, ziele }));
  pruefe('firebase.json/.firebaserc: der Video-Eimer bekommt storage-videos.rules', regelFuer(betrieb.videoEimer) === 'storage-videos.rules', JSON.stringify({ st, ziele }));
  pruefe('jedes Ziel in firebase.json hat einen Eimer in .firebaserc', st.length === 2 && st.every(x => (ziele[x.target] || []).length === 1));

  const wf = fs.readFileSync(path.join(WURZEL, '.github/workflows/deploy-functions.yml'), 'utf8');
  pruefe('eine Änderung an storage-videos.rules löst das Ausrollen aus', /-\s*'storage-videos\.rules'/.test(wf));
  const csp = (/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html) || [])[1] || '';
  const medien = (/media-src ([^;]+)/.exec(csp) || [])[1] || '';
  pruefe('Sicherheitsregel: Videos von firebasestorage.googleapis.com dürfen spielen — und nur von dort', /https:\/\/firebasestorage\.googleapis\.com/.test(medien) && !/\*|https:(\s|$)/.test(medien), medien);
}

async function oeffne(b, w, h, rolle, dichte) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript((d) => {
    localStorage.setItem('kf_tour', '99:demo-ich');
    window.__demoHochladenMs = 250;
    if (d) document.addEventListener('DOMContentLoaded', () => { document.body.dataset.dichte = d; });
  }, dichte || '');
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3300);
  return p;
}
/* Derselbe Weg wie ein Mensch: Ich → Schulung → Verwalten → Module →
   „Bearbeiten" am ersten Modul. */
async function zumEditor(p) {
  await p.evaluate(() => {
    const k = document.querySelector('.mobnav [data-group="g-ich"]') || document.querySelector('#side [data-group="g-ich"]');
    if (k) k.click();
  });
  await p.waitForTimeout(700);
  await p.evaluate(() => { const t = [...document.querySelectorAll('[data-subview]')].find(x => /Schulung/.test(x.textContent)); if (t) t.click(); });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const v = document.getElementById('schVerwaltenBtn'); if (v) v.click(); });
  await p.waitForTimeout(800);
  await p.evaluate(() => { const t = document.querySelector('[data-schvwtab="mod"]'); if (t) t.click(); });
  await p.waitForTimeout(1000);
  await p.evaluate(() => { const e = document.querySelector('[data-schbearbeiten]'); if (e) e.click(); });
  await p.waitForTimeout(900);
  return p.evaluate(() => !!document.querySelector('#schModulForm [data-schritt]'));
}
/* Schritt i auf eine Art stellen — über das Auswahlfeld, wie am Gerät. */
async function artSetzen(p, i, art) {
  await p.evaluate(([i, art]) => {
    const s = document.querySelector('#schModulForm [data-schritt="' + i + '"] [data-sfeld="art"]');
    s.value = art; s.dispatchEvent(new Event('change', { bubbles: true }));
  }, [i, art]);
  await p.waitForTimeout(250);
}
const zeile = (p, i) => p.evaluate((i) => {
  const f = document.querySelector('#schModulForm [data-schritt="' + i + '"]');
  const k = f && f.querySelector('[data-videowahl]');
  const lade = f && f.querySelector('[data-videolade]');
  return {
    knopf: !!k && !!k.getClientRects().length, gesperrt: !!k && k.disabled, knopfText: k ? k.textContent.trim() : '',
    lade: !!lade && !!lade.getClientRects().length,
    wert: lade ? +lade.querySelector('progress').value : null,
    text: lade ? lade.textContent.replace(/\s+/g, ' ').trim() : '',
    hinweis: ((f && f.querySelector('[data-videohinweis]')) || {}).textContent || '',
    quelle: ((f && f.querySelector('[data-sfeld="quelle"]')) || {}).value || '',
    abbrechen: !!(f && f.querySelector('[data-videoab]'))
  };
}, i);
async function waehle(p, i, datei) {
  const [wahl] = await Promise.all([
    p.waitForEvent('filechooser'),
    p.click('#schModulForm [data-schritt="' + i + '"] [data-videowahl]')
  ]);
  await wahl.setFiles(datei);
}
const VIDEO = { name: 'Einweisung EMS.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(3 * 1024 * 1024, 7) };

(async () => {
  ohneBrowser();
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 2. Wo der Knopf steht ──');
  {
    const p = await oeffne(b, 1440, 900, 'chef');
    pruefe('der Editor ist erreichbar (Ich → Schulung → Verwalten → Module)', await zumEditor(p));
    await artSetzen(p, 0, 'video');
    pruefe('Video-Schritt: Knopf „Video hochladen" ist da', (await zeile(p, 0)).knopf);
    await artSetzen(p, 0, 'lesen');
    pruefe('Lese-Schritt („Video dazu"): Knopf ist da', (await zeile(p, 0)).knopf);
    await artSetzen(p, 0, 'text');
    pruefe('Text-Schritt: kein Knopf', !(await zeile(p, 0)).knopf);
    await artSetzen(p, 0, 'bild');
    pruefe('Bild-Schritt: kein Knopf (der Eimer nimmt nur Videos)', !(await zeile(p, 0)).knopf);
    pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  {
    const p = await oeffne(b, 1440, 900, 'leiter');
    const da = await zumEditor(p);
    await artSetzen(p, 0, 'video');
    pruefe('Studioleitung: Knopf ist da', da && (await zeile(p, 0)).knopf);
    await p.close();
  }
  {
    const p = await oeffne(b, 1440, 900, 'mitarbeiter');
    const da = await zumEditor(p);
    const k = await p.evaluate(() => !!document.querySelector('[data-videowahl]'));
    pruefe('Mitarbeiterin: kein Editor, kein Knopf', !da && !k, JSON.stringify({ da, k }));
    await p.close();
  }

  console.log('\n── 3. Hochladen bis „Speichern" ──');
  {
    const p = await oeffne(b, 1440, 900, 'chef');
    await zumEditor(p);
    await artSetzen(p, 0, 'video');
    const vorher = await p.evaluate(() => document.getElementById('schFTitel').value);
    await waehle(p, 0, VIDEO);
    await p.waitForTimeout(700);
    const mitten = await zeile(p, 0);
    pruefe('während des Hochladens: Balken und Prozent sichtbar', mitten.lade && mitten.wert > 0 && mitten.wert < 100 && /\d+ % · /.test(mitten.text), JSON.stringify(mitten));
    pruefe('… Größe in derselben Zählung wie im Ordner (3 MB)', /von 3 MB/.test(mitten.text), mitten.text);
    pruefe('… der Knopf ist gesperrt, „Abbrechen" ist da', mitten.gesperrt && mitten.abbrechen, JSON.stringify(mitten));
    /* Tippen im Titel während des Hochladens: der Fortschritt darf das
       Formular nicht neu zeichnen, sonst ist der Zeiger weg. */
    await p.click('#schFTitel');
    await p.keyboard.type(' X');
    await p.waitForTimeout(600);
    const fokus = await p.evaluate(() => ({ id: document.activeElement.id, wert: document.getElementById('schFTitel').value }));
    pruefe('… Tippen im Titel geht weiter (Zeiger bleibt, Text kommt an)', fokus.id === 'schFTitel' && fokus.wert === vorher + ' X', JSON.stringify(fokus));
    await p.click('#schFSpeichern');
    await p.waitForTimeout(200);
    const note = await p.evaluate(() => document.getElementById('schFNote').textContent);
    pruefe('… „Speichern" wartet mit klarer Meldung', /lädt noch hoch/.test(note), note);
    await p.waitForTimeout(3500);
    const fertig = await zeile(p, 0);
    pruefe('fertig: die Adresse steht im Feld', /^blob:/.test(fertig.quelle), fertig.quelle);
    pruefe('fertig: Hinweis sagt „Speichern", Balken ist weg, Knopf wieder frei', /Hochgeladen/.test(fertig.hinweis) && /Speichern/.test(fertig.hinweis) && !fertig.lade && !fertig.gesperrt, JSON.stringify(fertig));
    pruefe('fertig: der Knopf heisst jetzt „Anderes Video hochladen"', /Anderes Video/.test(fertig.knopfText), fertig.knopfText);
    const haelt = await p.evaluate(() => { const e = new Event('beforeunload', { cancelable: true }); dispatchEvent(e); return e.defaultPrevented; });
    pruefe('fertig: das Schliessen der Seite wird nicht mehr aufgehalten', haelt === false);
    await p.click('#schFSpeichern');
    await p.waitForTimeout(1500);
    const gespeichert = await p.evaluate(() => getComputedStyle(document.getElementById('schModulForm')).display === 'none');
    pruefe('nach „Speichern" ist der Editor zu (gespeichert)', gespeichert);
    /* Beide Pfade: flach und unter firmen/<k>/ — welcher gilt, hängt
       am Mandanten-Schalter, und die Probe soll nicht raten. */
    const imModul = await p.evaluate(() => {
      const f = window.firebase.firestore();
      const hat = (s) => s.docs.map(d => d.data()).some(m => (m.schritte || []).some(x => /^blob:/.test(x.quelle || '')));
      return Promise.all([f.collection('schulungen').get(), f.collection('firmen').doc('koerperformen').collection('schulungen').get()])
        .then(([a, b]) => hat(a) || hat(b)).catch(e => String(e));
    });
    pruefe('… und die Adresse steht im gespeicherten Modul', imModul === true, String(imModul));
    pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 4. Abbrechen, falsche Datei, zu gross ──');
  {
    const p = await oeffne(b, 390, 844, 'chef');
    await zumEditor(p);
    await artSetzen(p, 0, 'video');
    const quelleVorher = (await zeile(p, 0)).quelle;
    await waehle(p, 0, VIDEO);
    await p.waitForTimeout(500);
    await p.click('#schModulForm [data-schritt="0"] [data-videoab]');
    await p.waitForTimeout(400);
    const ab = await zeile(p, 0);
    pruefe('Abbrechen: „Abgebrochen", Feld unverändert, Knopf wieder frei', /Abgebrochen/.test(ab.text) && ab.quelle === quelleVorher && !ab.gesperrt, JSON.stringify(ab));
    await p.waitForTimeout(3500);
    pruefe('… und es kommt danach auch keine Adresse mehr an', (await zeile(p, 0)).quelle === quelleVorher);

    await waehle(p, 0, { name: 'notizen.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
    await p.waitForTimeout(300);
    const txt = await zeile(p, 0);
    pruefe('eine Textdatei: „keine Videodatei"', /keine Videodatei/.test(txt.text), txt.text);

    /* Mehrere Gigabyte lassen sich hier nicht anlegen. Die Datei geht
       trotzdem den echten Weg (Knopf → Dateiwahl); nur ihre Grösse
       wird vorgetäuscht, und nur für diese zwei Namen. */
    await p.evaluate(() => {
      const echt = Object.getOwnPropertyDescriptor(Blob.prototype, 'size').get;
      Object.defineProperty(File.prototype, 'size', { configurable: true, get() {
        return this.name === 'gross.mp4' ? 6 * 1073741824 : this.name === 'vier.mp4' ? 4.2 * 1073741824 : echt.call(this);
      } });
    });
    await waehle(p, 0, { name: 'gross.mp4', mimeType: 'video/mp4', buffer: Buffer.from('x') });
    await p.waitForTimeout(200);
    const gross = await zeile(p, 0);
    pruefe('6 GB: abgelehnt mit Größe und Tipp', /6,0 GB groß, erlaubt sind bis 5 GB/.test(gross.text) && /720p/.test(gross.text), gross.text);
    await waehle(p, 0, { name: 'vier.mp4', mimeType: 'video/mp4', buffer: Buffer.from('x') });
    await p.waitForTimeout(500);
    const vier = await zeile(p, 0);
    pruefe('4,2 GB: wird angenommen (läuft los)', vier.lade && !/erlaubt sind/.test(vier.text) && vier.abbrechen, vier.text);
    await p.click('#schModulForm [data-schritt="0"] [data-videoab]');
    await p.waitForTimeout(300);
    pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 4b. Nacheinander, zweiter Versuch, Antwort des Speichers ──');
  {
    /* Aus dem Betrieb, 29.9.2026: „Das Hochladen hat nicht geklappt
       (storage/unknown)" bei „paar videos", als viele auf einmal liefen. */
    const p = await oeffne(b, 1440, 900, 'chef');
    await zumEditor(p);
    await artSetzen(p, 0, 'video');
    await p.evaluate(() => { document.querySelector('[data-schplus="schritt"]').click(); });
    await p.waitForTimeout(300);
    await artSetzen(p, 1, 'video');
    await p.evaluate(() => { window.__demoHochladenMs = 150; });
    await waehle(p, 0, VIDEO);
    await waehle(p, 1, { name: 'Zweites.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(1024 * 1024, 3) });
    await p.waitForTimeout(400);
    const z0 = await zeile(p, 0), z1 = await zeile(p, 1);
    pruefe('zwei Videos: das erste lädt, das zweite wartet und sagt es', z0.wert > 0 && /Wartet — ein Video davor/.test(z1.text) && z1.abbrechen, JSON.stringify({ a: z0.text, b: z1.text }));
    await p.waitForTimeout(4000);
    const f0 = await zeile(p, 0), f1 = await zeile(p, 1);
    pruefe('… danach geht das zweite von selbst los und kommt an', /^blob:/.test(f0.quelle) && /^blob:/.test(f1.quelle), JSON.stringify({ a: f0.hinweis, b: f1.hinweis }));

    /* Einmal abgebrochen: zweiter Versuch von selbst. */
    await p.evaluate(() => { window.__demoHochladenFehler = 1; });
    await waehle(p, 0, VIDEO);
    await p.waitForTimeout(700);
    const nochmal = await zeile(p, 0);
    pruefe('ein Abbruch (storage/unknown): „Zweiter Versuch" statt Fehlermeldung', /Zweiter Versuch/.test(nochmal.text) && !/nicht geklappt/.test(nochmal.text), nochmal.text);
    await p.waitForTimeout(5500);
    pruefe('… und der zweite Versuch kommt an', /Hochgeladen/.test((await zeile(p, 0)).hinweis));

    /* Zweimal abgebrochen: jetzt die Meldung — mit der Antwort des Speichers. */
    await p.evaluate(() => { window.__demoHochladenFehler = 2; });
    await waehle(p, 1, VIDEO);
    await p.waitForTimeout(4500);
    const zweimal = await zeile(p, 1);
    pruefe('zwei Abbrüche: Meldung mit Status und Antwort des Speichers', /nicht geklappt \(storage\/unknown\)/.test(zweimal.text) && /Status 503 — Service Unavailable/.test(zweimal.text), zweimal.text);
    pruefe('… und der Knopf ist wieder frei zum Nochmal-Versuchen', !zweimal.gesperrt);

    /* Abbrechen, während es wartet. */
    await p.evaluate(() => { window.__demoHochladenMs = 400; });
    await waehle(p, 0, VIDEO);
    await waehle(p, 1, VIDEO);
    await p.waitForTimeout(300);
    await p.click('#schModulForm [data-schritt="1"] [data-videoab]');
    await p.waitForTimeout(300);
    const ab1 = await zeile(p, 1);
    pruefe('ein wartendes Video lässt sich abbrechen', /Abgebrochen/.test(ab1.text), ab1.text);
    await p.waitForTimeout(6000);
    pruefe('… das laufende kommt trotzdem an, das abgebrochene nicht', /Hochgeladen/.test((await zeile(p, 0)).hinweis) && /Abgebrochen/.test((await zeile(p, 1)).text));
    pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 5. „Zurück" während des Hochladens ──');
  {
    const p = await oeffne(b, 1440, 900, 'chef');
    await zumEditor(p);
    await artSetzen(p, 0, 'video');
    await waehle(p, 0, VIDEO);
    await p.waitForTimeout(400);
    await p.click('#schModulForm [data-schzurueck]');
    await p.waitForTimeout(300);
    const erst = await p.evaluate(() => ({ offen: getComputedStyle(document.getElementById('schModulForm')).display !== 'none', note: document.getElementById('schFNote').textContent }));
    pruefe('erstes „Zurück": bleibt im Editor und sagt warum', erst.offen && /Noch einmal „Zurück"/.test(erst.note), JSON.stringify(erst));
    await p.click('#schModulForm [data-schzurueck]');
    await p.waitForTimeout(500);
    const dann = await p.evaluate(() => ({ offen: getComputedStyle(document.getElementById('schModulForm')).display !== 'none' }));
    pruefe('zweites „Zurück": Editor zu', !dann.offen, JSON.stringify(dann));
    /* Das Test-Chromium zeigt ohne Bildschirm keine Nachfrage beim
       Schliessen (nachgeprüft: selbst eine leere Seite mit
       preventDefault() löst keinen Dialog aus). Geprüft wird deshalb,
       was die Seite dem Browser sagt: ein beforeunload-Ereignis, das sie
       aufhält oder nicht. */
    const halten = () => p.evaluate(() => { const e = new Event('beforeunload', { cancelable: true }); dispatchEvent(e); return e.defaultPrevented; });
    pruefe('… und das Hochladen ist abgebrochen (Schliessen wird nicht mehr aufgehalten)', (await halten()) === false);
    await p.close();
  }
  {
    /* GEGENPROBE: solange es lädt, fragt der Browser beim Schliessen. */
    const p = await oeffne(b, 1440, 900, 'chef');
    await zumEditor(p);
    await artSetzen(p, 0, 'video');
    await p.evaluate(() => { window.__demoHochladenMs = 5000; });
    await waehle(p, 0, VIDEO);
    await p.waitForTimeout(400);
    const halten = () => p.evaluate(() => { const e = new Event('beforeunload', { cancelable: true }); dispatchEvent(e); return e.defaultPrevented; });
    pruefe('GEGENPROBE während des Hochladens hält die Seite das Schliessen auf', (await halten()) === true);
    await p.click('#schModulForm [data-schritt="0"] [data-videoab]');
    await p.waitForTimeout(300);
    pruefe('… und nach „Abbrechen" nicht mehr', (await halten()) === false);
    await p.close();
  }

  console.log('\n── 6. Treffer ──');
  for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    for (const dichte of ['normal', 'kompakt']) {
      const p = await oeffne(b, w, h, 'chef', dichte);
      await zumEditor(p);
      await artSetzen(p, 0, 'video');
      await p.evaluate(() => { window.__demoHochladenMs = 5000; });
      await waehle(p, 0, VIDEO);
      await p.waitForTimeout(300);
      const m = await p.evaluate((SRC) => {
        const T = eval('(' + SRC + ')');
        const f = document.querySelector('#schModulForm [data-schritt="0"]');
        const miss = (el) => { if (!el) return null; el.scrollIntoView({ block: 'center' }); const t = T(el), r = el.getBoundingClientRect(); return { w: t.w, h: t.h, drin: r.left >= 0 && r.right <= innerWidth, breite: Math.round(r.width) }; };
        /* Der Wahl-Knopf ist während des Hochladens gesperrt — gemessen
           wird er trotzdem: gesperrt heisst nicht unsichtbar. */
        return { wahl: miss(f.querySelector('[data-videowahl]')), ab: miss(f.querySelector('[data-videoab]')),
                 quer: document.documentElement.scrollWidth - innerWidth, dichte: document.body.dataset.dichte };
      }, TREFFER.toString());
      pruefe(w + ' px, ' + dichte + ': „Video hochladen" und „Abbrechen" ≥ 44 × 44, im Bild, keine Querlaufleiste',
        m.dichte === dichte && m.wahl && m.ab && [m.wahl, m.ab].every(x => x.w >= 44 && x.h >= 44 && x.drin) && m.quer <= 0, JSON.stringify(m));
      if (w >= 1280) pruefe(w + ' px, ' + dichte + ': der Knopf ist so breit wie sein Wort (kein Balken, < 320 px)', m.wahl && m.wahl.breite < 320, JSON.stringify(m.wahl));
      await p.close();
    }
  }

  await b.close();
  console.log('\n' + gut + ' bestanden, ' + schlecht + ' gefallen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
