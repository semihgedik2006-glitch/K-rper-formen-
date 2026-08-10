/* Firmencode und Freigabe – in der Oberflaeche, nicht nur in den Regeln.

   Die Regeln sind in tests/rules/security.test.js geprueft (52 Stueck).
   Hier geht es um das, was der Mensch sieht:

     1. Ohne gesetzten Code bleibt das Anmeldeformular unveraendert kurz.
     2. Mit Code erscheint das Feld.
     3. Ein wartendes Konto sieht den Wartebildschirm statt der App –
        und zwar KEINE Fehlermeldung: das Konto ist ja in Ordnung.
     4. Der Chef sieht wartende Konten ganz oben im Team-Reiter, mit
        Freigeben und Ablehnen.
     5. Wartet niemand, ist die Karte komplett weg.                     */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function start(stub, errs, vorbereiten) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 160));
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/' + stub });
  if (vorbereiten) await page.addInitScript(vorbereiten);
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  return { b, page };
}

// Legt die Schalter und ein wartendes Konto in den Stub.
const stubErweitern = (codeNoetig, freigabe, wartende) => `
(function(){
  var fs = window.firebase.firestore();
  var echt = fs.collection.bind(fs);
  var SCHALTER = { codeNoetig: ${codeNoetig}, freigabe: ${freigabe} };
  var WARTEND = ${JSON.stringify(wartende)};
  fs.collection = function(pfad){
    /* Seit dem Umzug schickt S() 'firmen/<kennung>/…'. Die Testdaten
       liegen flach — Vorsatz abschneiden, sonst greift die Attrappe
       unten nie. */
    pfad = String(pfad).replace(new RegExp('^firmen/[^/]+/'), '');
    var k = echt(pfad);
    if (pfad === 'config') {
      var d = k.doc.bind(k);
      k.doc = function(id){
        var o = d(id);
        if (id === 'beitrittSchalter' || id === 'registrierung') {
          o.get = function(){ return Promise.resolve({ exists:true, id:id,
            data:function(){ return id==='registrierung'
              ? { code: ${codeNoetig} ? 'KF-2026' : '', freigabe: ${freigabe} }
              : SCHALTER; } }); };
        }
        return o;
      };
    }
    if (pfad === 'users') {
      var s = k.onSnapshot ? k.onSnapshot.bind(k) : null;
      var g = k.get ? k.get.bind(k) : null;
      // Die wartenden Konten zusaetzlich in die Nutzerliste geben
      function erweitern(snap){
        var extra = WARTEND.map(function(w){
          return { id:w.uid, data:function(){ return w; } };
        });
        return { docs: (snap && snap.docs ? snap.docs : []).concat(extra),
                 forEach:function(f){ this.docs.forEach(f); } };
      }
      if (s) k.onSnapshot = function(cb, err){ return s(function(sn){ cb(erweitern(sn)); }, err); };
      if (g) k.get = function(){ return g().then(erweitern); };
    }
    return k;
  };
})();`;

(async () => {
  const errs = [];

  // ══ 1. Ohne Code: Feld bleibt weg ══
  {
    const { b, page } = await start('stub-chef.js', errs, stubErweitern(false, false, []));
    await page.evaluate(() => {
      const t = [...document.querySelectorAll('.auth-tab')].find(x => /Regist/i.test(x.textContent));
      if (t) t.click();
    });
    await page.waitForTimeout(700);
    // Der Stub meldet sofort einen eingeloggten Nutzer, das Anmelde-
    // formular ist also ohnehin verdeckt. Gemessen wird deshalb, was der
    // Lader am Feld einstellt – nicht, ob es gerade auf dem Schirm ist.
    const ohne = await page.evaluate(() => {
      const w = document.getElementById('rgCodeWrap');
      return { da: !!w, anzeige: w ? (w.style.display || '(leer)') : null };
    });
    console.log('OHNE Code:', JSON.stringify(ohne));
    if (!ohne.da) errs.push('FEHLT: Codefeld gar nicht im Markup');
    if (ohne.anzeige !== 'none') errs.push('FEHLT: Codefeld nicht ausgeblendet, obwohl kein Code gesetzt ist');
    await b.close();
  }

  // ══ 2. Mit Code: Feld erscheint ══
  {
    const { b, page } = await start('stub-chef.js', errs, stubErweitern(true, true, []));
    await page.evaluate(() => {
      const t = [...document.querySelectorAll('.auth-tab')].find(x => /Regist/i.test(x.textContent));
      if (t) t.click();
    });
    await page.waitForTimeout(900);
    const mit = await page.evaluate(() => {
      const w = document.getElementById('rgCodeWrap');
      const i = document.getElementById('rgCode');
      return {
        anzeige: w ? (w.style.display || '(leer = sichtbar)') : null,
        beschriftung: (w && w.querySelector('label') || {}).textContent || '',
        platzhalter: i ? i.placeholder : '',
      };
    });
    console.log('MIT Code:', JSON.stringify(mit));
    if (mit.anzeige === 'none') errs.push('FEHLT: Codefeld bleibt ausgeblendet, obwohl ein Code gesetzt ist');
    if (!/Firmencode/.test(mit.beschriftung)) errs.push('FEHLT: Feld heisst nicht „Firmencode"');
    if (!mit.platzhalter) errs.push('FEHLT: kein Hinweis, woher man den Code bekommt');
    await b.close();
  }

  // ══ 3. Chef sieht wartende Konten ══
  {
    const wartende = [
      { uid: 'w1', name: 'Neue Aushilfe', email: 'neu@test.de', role: 'mitarbeiter', studios: ['Hürth'], aktiv: false },
      { uid: 'w2', name: 'Zweiter Neuer', email: 'zwei@test.de', role: 'mitarbeiter', studios: [], aktiv: false },
    ];
    const { b, page } = await start('stub-chef.js', errs, stubErweitern(true, true, wartende));
    await page.mouse.click(195, 400).catch(() => {});
    await page.waitForTimeout(3200);
    await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const k = document.querySelector('#chefHome [data-cgo="team"]');
      if (k) k.click();
    });
    await page.waitForTimeout(900);

    const frei = await page.evaluate(() => {
      const k = document.getElementById('freigabeKarte');
      if (!k) return null;
      const karten = [...document.querySelectorAll('.chef-pane[data-cpane="team"] .card')];
      return {
        sichtbar: k.offsetParent !== null,
        platz: karten.indexOf(k),               // 0 = ganz oben
        zahl: (document.getElementById('freigabeZahl') || {}).textContent || '',
        namen: [...k.querySelectorAll('b')].map(x => x.textContent).slice(0, 3),
        freigeben: k.querySelectorAll('[data-frei]').length,
        ablehnen: k.querySelectorAll('[data-ablehn]').length,
        knopfHoehe: Math.min(...[...k.querySelectorAll('button')]
          .map(x => Math.round(x.getBoundingClientRect().height))),
      };
    });
    console.log('Freigabe-Karte:', JSON.stringify(frei));
    if (!frei || !frei.sichtbar) errs.push('FEHLT: Karte „Wartet auf Freigabe" nicht sichtbar');
    if (frei && frei.platz !== 0) errs.push('FEHLT: Karte steht nicht ganz oben (Platz ' + frei.platz + ')');
    if (frei && frei.freigeben !== 2) errs.push('FEHLT: nicht für jedes Konto ein Freigeben-Knopf');
    if (frei && frei.ablehnen !== 2) errs.push('FEHLT: nicht für jedes Konto ein Ablehnen-Knopf');
    if (frei && !/2 Personen/.test(frei.zahl)) errs.push('FEHLT: Anzahl steht nicht an der Überschrift');
    if (frei && frei.knopfHoehe < 44) errs.push('FINGERZIEL: Knopf nur ' + frei.knopfHoehe + 'px');

    // Einstell-Karte
    const einst = await page.evaluate(() => {
      const c = document.getElementById('btCode'), f = document.getElementById('btFreigabe');
      return { codeFeld: !!c, wert: c ? c.value : null, haken: f ? f.checked : null,
               speichern: !!document.getElementById('btSave') };
    });
    console.log('Einstellungen:', JSON.stringify(einst));
    if (!einst.codeFeld || !einst.speichern) errs.push('FEHLT: Karte „Wer darf sich anmelden" unvollständig');
    if (einst.wert !== 'KF-2026') errs.push('FEHLT: gesetzter Code wird nicht angezeigt (' + einst.wert + ')');
    if (einst.haken !== true) errs.push('FEHLT: Freigabe-Haken spiegelt den Stand nicht');

    await page.screenshot({ path: SP + '/beitritt-freigabe.png' });
    await b.close();
  }

  // ══ 4. Wartet niemand → Karte ist weg ══
  {
    const { b, page } = await start('stub-chef.js', errs, stubErweitern(true, true, []));
    await page.mouse.click(195, 400).catch(() => {});
    await page.waitForTimeout(3200);
    await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const k = document.querySelector('#chefHome [data-cgo="team"]');
      if (k) k.click();
    });
    await page.waitForTimeout(900);
    const leer = await page.evaluate(() => {
      const k = document.getElementById('freigabeKarte');
      return k ? k.offsetParent !== null : null;
    });
    console.log('Ohne Wartende sichtbar:', leer);
    if (leer) errs.push('FEHLT: leere Freigabe-Karte bleibt stehen');
    await b.close();
  }

  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ') : '\n✓ Beitritt: Code und Freigabe sitzen in der Oberfläche');
  process.exit(errs.length ? 1 : 0);
})();
