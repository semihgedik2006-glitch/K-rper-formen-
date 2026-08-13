/* ── Die Firmenkennung im Link ────────────────────────────────────────
   Der Kunde bekommt einen Link mit seiner Kennung darin,
   https://…/?firma=mueller-7f3a. Der Anmeldebildschirm braucht sie: er
   zeigt Studioliste und Beitritts-Schalter, bevor jemand angemeldet ist,
   und bis dahin gibt es kein Profil, das die Firma nennen könnte.

     1. Solange der Schalter aus ist, passiert gar nichts.
     2. Mit Schalter: die Kennung aus dem Link landet in den Pfaden.
     3. Sie wird gemerkt — der lange Link wird nur einmal gebraucht.
     4. Unsinn im Link wird gefiltert. Ein Pfadtrenner darin würde aus
        firmen/x/config etwas ganz anderes machen.
     5. Ohne Link und ohne gemerkte Kennung gilt konfig.js. Sonst steht
        ein bestehender Betrieb nach dem Umschalten vor einer leeren App.

   Nicht geprüft: dass nach dem Anmelden das Profil gegen den Link
   gewinnt (die Attrappe liefert kein Profil mit Firma), und dass ein
   Fremder mit geratener Kennung nichts sieht. Beides entscheiden die
   Regeln — siehe tests/rules/security.test.js.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Schneidet mit, welche Pfade wirklich abgefragt werden.
//
// WICHTIG: eine frische Hülle je Ebene bauen, nicht das Stub-Objekt
// verändern. Die Attrappen geben bei .doc() und .collection() DASSELBE
// Objekt zurück – wer es markiert, sieht ab der zweiten Ebene nichts
// mehr und misst dann "gar keine Abfrage" statt des Pfades. Genau
// dieser Messfehler hat den ersten Lauf hier wertlos gemacht.
const SPUR = `
(function(){
  window.__pfade = [];
  var fs = window.firebase.firestore();
  var echt = fs.collection.bind(fs);
  function huelle(k, pfad){
    if(!k) return k;
    var h = Object.create(k);
    h.get = function(){ window.__pfade.push(pfad); return k.get.apply(k, arguments); };
    if(k.onSnapshot) h.onSnapshot = function(){ window.__pfade.push(pfad); return k.onSnapshot.apply(k, arguments); };
    if(k.doc) h.doc = function(i){ return huelle(k.doc(i), pfad + '/' + i); };
    if(k.collection) h.collection = function(sb){ return huelle(k.collection(sb), pfad + '/' + sb); };
    return h;
  }
  fs.collection = function(p){ return huelle(echt(p), p); };
})();`;

async function start(errs, opt) {
  opt = opt || {};
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 160));
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/' + (opt.stub || 'stub-ohne-login.js') });
  await page.addInitScript(SPUR);
  /* Beide Richtungen werden GESETZT, keine wird geerbt.
     Vorher stand hier nur der An-Fall, und „Schalter aus" verliess sich
     darauf, dass konfig.js false ausliefert. Seit dem Umzug am
     10.8.2026 liefert sie true — und der Aus-Fall prüfte plötzlich das
     Gegenteil von dem, was sein Name sagt. Ein Test, der seinen
     Ausgangszustand erbt, misst irgendwann etwas anderes als gedacht. */
  {
    const wert = opt.mandant ? 'true' : 'false';
    await page.addInitScript(`
      var iv = setInterval(function(){
        if (window.KONFIG) { window.KONFIG.mandant = ${wert}; clearInterval(iv); }
      }, 2);
      setTimeout(function(){ clearInterval(iv); }, 3000);`);
  }
  await page.goto(APP + (opt.query || ''), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(opt.stub ? 2800 : 1900);
  return { b, page };
}

const konfigPfade = p => p.filter(x => /config\/(studios|beitrittSchalter)$/.test(x));

(async () => {
  const errs = [];

  // ══ 1. Schalter aus: nichts ändert sich ══
  {
    const { b, page } = await start(errs, { query: '?firma=fremd-1234' });
    const p = konfigPfade(await page.evaluate(() => window.__pfade));
    console.log('Schalter AUS:', JSON.stringify(p));
    if (p.some(x => x.indexOf('firmen/') === 0)) {
      errs.push('GEFÄHRLICH: Schalter ist aus, aber es wird schon unter firmen/ gelesen');
    }
    if (!p.length) errs.push('FEHLT: gar keine Konfiguration gelesen');
    await b.close();
  }

  // ══ 2.+3. Schalter an: Kennung aus dem Link, und gemerkt ══
  {
    const { b, page } = await start(errs, { mandant: true, query: '?firma=mueller-7f3a' });
    const p = konfigPfade(await page.evaluate(() => window.__pfade));
    console.log('Mit Link:', JSON.stringify(p));
    if (!p.length) errs.push('FEHLT: keine Konfiguration gelesen');
    p.forEach(x => {
      if (x !== 'firmen/mueller-7f3a/config/studios' &&
          x !== 'firmen/mueller-7f3a/config/beitrittSchalter') {
        errs.push('FALSCHER PFAD: ' + x);
      }
    });
    const gemerkt = await page.evaluate(() => localStorage.getItem('kf_firma'));
    console.log('Gemerkt:', gemerkt);
    if (gemerkt !== 'mueller-7f3a') errs.push('FEHLT: die Kennung wird nicht gemerkt (' + gemerkt + ')');

    // Zweiter Aufruf OHNE Link muss dieselbe Firma treffen
    await page.evaluate(() => { window.__pfade = []; });
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1900);
    const p2 = konfigPfade(await page.evaluate(() => window.__pfade));
    console.log('Ohne Link, aber gemerkt:', JSON.stringify(p2));
    if (!p2.length || !p2.every(x => x.indexOf('firmen/mueller-7f3a/') === 0)) {
      errs.push('FEHLT: ohne Link greift die gemerkte Kennung nicht (' + p2.join(', ') + ')');
    }
    await b.close();
  }

  // ══ 4. Unsinn im Link ══
  {
    const { b, page } = await start(errs, {
      mandant: true, query: '?firma=' + encodeURIComponent('../../users/chef1'),
    });
    const p = konfigPfade(await page.evaluate(() => window.__pfade));
    console.log('Unsinn im Link:', JSON.stringify(p));
    p.forEach(x => {
      if (/\.\.|users/.test(x)) errs.push('GEFÄHRLICH: Pfadtrenner kam durch – ' + x);
    });
    const gemerkt = await page.evaluate(() => localStorage.getItem('kf_firma'));
    console.log('Gemerkt nach Unsinn:', gemerkt);
    if (gemerkt && /[^a-zA-Z0-9_-]/.test(gemerkt)) {
      errs.push('GEFÄHRLICH: ungefilterte Kennung gemerkt – ' + gemerkt);
    }
    // Ein zerstückelter Rest ist genauso falsch wie das Original.
    if (gemerkt && /users|chef/.test(gemerkt)) {
      errs.push('FEHLT: aus dem Unsinn wurde ein Rest gemacht und gemerkt – ' + gemerkt);
    }
    await b.close();
  }

  // ══ 5. Ohne alles gilt konfig.js ══
  {
    const { b, page } = await start(errs, { mandant: true });
    const p = konfigPfade(await page.evaluate(() => window.__pfade));
    console.log('Ohne Link und ohne Gedächtnis:', JSON.stringify(p));
    if (!p.length || !p.every(x => x.indexOf('firmen/koerperformen/') === 0)) {
      errs.push('FEHLT: der Rückfall auf konfig.js greift nicht (' + p.join(', ') + ')');
    }
    await b.close();
  }

  /* ══ 6. Eine FREMDE Firma sieht niemals unsere Standorte ══
     Der Fehler, den das verhindert: eine frisch angelegte Firma hat
     noch kein config/studios. Die App fiel dann auf KONFIG.studios
     zurück — und das sind die vierzehn Standorte von Körperformen. Der
     neue Kunde hätte beim allerersten Anmelden die Standortliste eines
     fremden Betriebs vor sich gehabt.

     Kein Datenleck im engeren Sinn, die Namen stehen auch auf der
     Webseite. Aber es beendet jedes Verkaufsgespräch, und es sagt dem
     Kunden das Gegenteil von dem, was der Betreiber ihm verspricht.

     Der Stub liefert für config/studios NICHTS — genau die Lage einer
     neuen Firma, bevor jemand etwas eingetragen hat.

     Gemessen wird am DOM, nicht an innerText: die Standortliste des
     Anmeldebildschirms (#rgStudios) ist ausgeblendet, solange man nicht
     auf „Konto anlegen" geht — und innerText überspringt Ausgeblendetes.
     Der erste Anlauf las innerText und war grün, weil er NICHTS gesehen
     hat. Erst die Gegenprobe unten hat das aufgedeckt. */
  const studioNamen = page => page.evaluate(() => {
    const w = document.getElementById('rgStudios');
    return {
      liste: w ? Array.from(w.querySelectorAll('span')).map(s => s.textContent.trim()) : null,
      seite: document.body.textContent || ''
    };
  });
  const UNSERE = ['Longerich', 'Nippes', 'Ebertplatz', 'Hürth', 'Brühl', 'Rösrath'];
  {
    const { b, page } = await start(errs, { mandant: true, query: '?firma=fremd-9x2a' });
    const n = await studioNamen(page);
    console.log('Fremde Firma, Standortliste:', JSON.stringify(n.liste));
    if (n.liste === null) {
      errs.push('AUFBAU: #rgStudios gibt es nicht mehr — dieser Test misst nichts');
    }
    const verraten = UNSERE.filter(x => (n.liste || []).indexOf(x) >= 0);
    if (verraten.length) {
      errs.push('GEFÄHRLICH: fremde Firma sieht unsere Standorte – ' + verraten.join(', '));
    }
    await b.close();
  }

  /* ══ 7. Gegenprobe ══
     Ein Test, der nie anschlägt, prüft nichts. Bei der EIGENEN Firma
     muss die Liste aus konfig.js sehr wohl greifen — sonst hätte ich
     das Leck gestopft, indem ich die Standortliste ganz abgeschaltet
     habe, und niemand hätte es gemerkt.

     Genau das ist beim ersten Anlauf passiert: Nummer 6 war grün, weil
     die Messung an der falschen Stelle ansetzte. Diese Gegenprobe hat
     es gefunden. */
  {
    const { b, page } = await start(errs, { mandant: true, query: '?firma=koerperformen' });
    const n = await studioNamen(page);
    console.log('Eigene Firma, Standortliste:', JSON.stringify((n.liste || []).slice(0, 3)));
    if (!(n.liste || []).length) {
      errs.push('GEGENPROBE: die EIGENE Firma hat gar keine Standortliste — ' +
                'dann prüft Nummer 6 nichts');
    } else if (!UNSERE.some(x => n.liste.indexOf(x) >= 0)) {
      errs.push('GEGENPROBE: die EIGENE Firma sieht ihre Standorte nicht mehr (' +
                n.liste.slice(0, 3).join(', ') + ')');
    }
    await b.close();
  }

  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ') : '\n✓ Firmenkennung: aus dem Link, gemerkt, gefiltert, mit Rückfall, keine fremden Standorte');
  process.exit(errs.length ? 1 : 0);
})();
