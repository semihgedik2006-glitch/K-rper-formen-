/* ── Das Stempel-Terminal ─────────────────────────────────────────────

   Ein Tablet am Empfang wird zur Stempeluhr. Der Bildschirm legt sich
   über die ganze App — und genau deshalb ist die erste Prüfung hier die
   wichtigste:

     OHNE SCHLÜSSEL DARF ER NICHT ERSCHEINEN.

   Ein Fehler an dieser Stelle verdeckt allen Mitarbeitern die ganze App,
   und zwar sofort nach dem Ausrollen. Das ist der teuerste denkbare
   Fehler in diesem Bau, und er wäre einer, den man beim Entwickeln nie
   sieht — auf dem eigenen Gerät liegt ja ein Schlüssel.

   Weiter geprüft:
     · Der Chef richtet ein Terminal ein; der Schlüssel wird EINMAL
       gezeigt.
     · „Dieses Gerät einrichten" legt ihn lokal ab — und NICHT in der
       Datenbank. Dort läge er neben dem Hash, den er aufschliesst.
     · Mit Schlüssel erscheint der Bildschirm und zeigt nur Leute DIESES
       Studios.
     · Das Tastenfeld füllt Punkte und schickt bei vier Ziffern NICHT
       von selbst ab — eine PIN darf fünf oder sechs Stellen haben, und
       ein Automat, der nach der vierten losrennt, macht daraus
       stillschweigend einen Fehlversuch.
     · Gestempelt wird über die Server-Funktion, mit allen drei
       Schlüsseln — und es wird NICHTS direkt in `zeiten` geschrieben.
     · „Terminal beenden" räumt den Schlüssel weg.

   WIE HIER GEMOGELT WIRD, und warum das gesagt gehört: die Test-Attrappe
   kennt `terminals` und `zeiten` nicht. Dieser Durchlauf legt deshalb
   eine eigene Antwort für genau diese zwei Pfade darüber. Das ist eine
   Attrappe auf der Attrappe — sie prüft den Weg der App, nicht die
   Datenbank. Was die Datenbank zulässt, steht in
   tests/rules/zeitpin.test.js und wird dort am Emulator gemessen.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* Antworten für terminals/ und zeiten/, plus eine steuerbare
   Funktions-Attrappe. Läuft NACH stub-chef.js. */
const ZUSATZ = `
(function(){
  var echt = window.firebase.firestore;
  var TERMINALS = window.__terminals || [];
  var ZEITEN = window.__zeiten || [];
  function snapAus(liste){
    var docs = liste.map(function(d){
      return { id:d.id, exists:true, data:function(){ return d; } };
    });
    return { docs:docs, size:docs.length, empty:!docs.length,
             forEach:function(f){ docs.forEach(f); },
             docChanges:function(){ return docs.map(function(d){ return {type:'added',doc:d}; }); } };
  }
  function kette(liste){
    var o = {
      where:function(){ return kette(liste); },
      orderBy:function(){ return kette(liste); },
      limit:function(){ return kette(liste); },
      get:function(){ return Promise.resolve(snapAus(liste)); },
      onSnapshot:function(cb){ setTimeout(function(){ cb(snapAus(liste)); },20); return function(){}; },
      doc:function(id){
        var d = liste.filter(function(x){ return x.id===id; })[0];
        return {
          get:function(){ return Promise.resolve({ id:id, exists:!!d,
            data:function(){ return d; } }); },
          set:function(){ (window.__schreib=window.__schreib||[]).push({pfad:'?/'+id}); return Promise.resolve(); },
          update:function(){ return Promise.resolve(); },
          delete:function(){ return Promise.resolve(); }
        };
      },
      add:function(d){ (window.__schreib=window.__schreib||[]).push({pfad:'zeiten/(neu)',daten:d}); return Promise.resolve({id:'x'}); }
    };
    return o;
  }
  var fs = echt();
  var alteColl = fs.collection.bind(fs);
  fs.collection = function(p){
    var s = String(p);
    if(/(^|\\/)terminals$/.test(s)) return kette(TERMINALS);
    if(/(^|\\/)zeiten$/.test(s)) return kette(ZEITEN);
    return alteColl(p);
  };
  /* Die Anhaengsel MITNEHMEN. firebase.firestore ist eine Funktion mit
     Eigenschaften: FieldValue, FieldPath. Wer sie ersetzt und nur die
     Funktion kopiert, raeumt die Eigenschaften ab — und die App faellt
     dort um, wo sie fv.increment() ruft. Genau das ist hier beim ersten
     Anlauf passiert: drei PAGEERROR, und keiner davon aus der App. */
  var neu = function(){ return fs; };
  Object.keys(echt).forEach(function(k){ neu[k] = echt[k]; });
  neu.FieldValue = echt.FieldValue;
  neu.FieldPath = echt.FieldPath;
  window.firebase.firestore = neu;

  // Funktions-Attrappe mit steuerbarer Antwort
  window.__fnAntwort = {};
  window.firebase.functions = function(){
    return { httpsCallable: function(name){
      return function(data){
        window.__aufruf = { name:name, data:data };
        (window.__aufrufe = window.__aufrufe || []).push({ name:name, data:data });
        var a = window.__fnAntwort[name];
        if (a && a.fehler) return Promise.reject(new Error(a.fehler));
        return Promise.resolve({ data: a || { ok:true } });
      };
    } };
  };
})();
`;

async function starten(errs, vorbereiten) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 160)));
  page.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) {
      errs.push('CONSOLE: ' + m.text().slice(0, 160));
    }
  });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  if (vorbereiten) await page.addInitScript({ content: vorbereiten });
  await page.addInitScript({ content: ZUSATZ });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  return { b, page };
}

(async () => {
  const errs = [];

  /* ══ 1. OHNE SCHLÜSSEL: der Bildschirm bleibt weg ══════════════════ */
  {
    const { b, page } = await starten(errs, null);
    const z = await page.evaluate(() => {
      const s = document.getElementById('terminalSchirm');
      return {
        da: !!s,
        sichtbar: s ? getComputedStyle(s).display !== 'none' : false,
        appSichtbar: document.getElementById('app').classList.contains('show'),
        speicher: (() => { try { return localStorage.getItem('kf_terminal'); } catch (e) { return 'FEHLER'; } })()
      };
    });
    console.log('OHNE SCHLÜSSEL:', JSON.stringify(z));
    if (!z.da) errs.push('Der Terminal-Bildschirm fehlt ganz');
    if (z.sichtbar) {
      errs.push('OHNE SCHLÜSSEL IST DER TERMINAL-BILDSCHIRM SICHTBAR — ' +
        'das verdeckt allen Mitarbeitern die ganze App');
    }
    if (!z.appSichtbar) errs.push('Die App ist nicht gestartet');
    if (z.speicher) errs.push('Ohne Einrichtung liegt trotzdem ein Schlüssel im Gerät');
    await b.close();
  }

  /* ══ 2. Der Chef richtet ein Terminal ein ══════════════════════════ */
  {
    const { b, page } = await starten(errs, null);
    await page.evaluate(() => document.querySelector('.mobnav [data-group="g-chef"]').click());
    await page.waitForTimeout(600);
    const reiter = await page.evaluate(() => {
      const t = [...document.querySelectorAll('#view-chef button')]
        .find(x => /^\s*Studios\s*$/.test(x.textContent || ''));
      if (t) { t.click(); return true; }
      return false;
    });
    await page.waitForTimeout(800);
    if (!reiter) errs.push('Der Reiter „Studios" wurde nicht gefunden');

    const karte = await page.evaluate(() => {
      const k = document.getElementById('terminalListe');
      return {
        karte: !!k,
        leerText: k ? (k.textContent || '').trim().slice(0, 40) : '',
        studios: (document.getElementById('termStudio') || {}).options ?
          document.getElementById('termStudio').options.length : -1
      };
    });
    console.log('KARTE:', JSON.stringify(karte));
    if (!karte.karte) errs.push('Die Terminal-Karte fehlt unter Studios');
    if (karte.studios < 2) errs.push('Die Studio-Auswahl ist leer (' + karte.studios + ')');
    if (!/Noch kein Terminal/.test(karte.leerText)) {
      errs.push('Ohne Terminal steht dort nicht, dass keines eingerichtet ist: „' + karte.leerText + '"');
    }

    const angelegt = await page.evaluate(async () => {
      window.__fnAntwort.terminalAnlegen =
        { id: 't-neu', geheim: 'a'.repeat(64), name: 'Empfang' };
      window.__aufruf = null;
      document.getElementById('termName').value = 'Empfang';
      document.getElementById('termNeuBtn').click();
      await new Promise(r => setTimeout(r, 900));
      const box = document.getElementById('termGeheimBox');
      return {
        funktion: window.__aufruf ? window.__aufruf.name : null,
        studioMit: window.__aufruf && window.__aufruf.data ? window.__aufruf.data.studioKey : null,
        boxSichtbar: getComputedStyle(box).display !== 'none',
        codeDa: !!document.getElementById('termCode'),
        codeText: (document.getElementById('termCode') || {}).textContent || '',
        feldLeer: document.getElementById('termName').value === '',
        einrichtenKnopf: !!document.getElementById('termHier')
      };
    });
    console.log('ANGELEGT:', JSON.stringify(angelegt).slice(0, 220));
    if (angelegt.funktion !== 'terminalAnlegen') {
      errs.push('Aufgerufen wurde „' + angelegt.funktion + '" statt terminalAnlegen');
    }
    if (!/^studio-\d+$/.test(angelegt.studioMit || '')) {
      errs.push('Es wurde kein Studio mitgegeben (' + angelegt.studioMit + ')');
    }
    if (!angelegt.boxSichtbar || !angelegt.codeDa) errs.push('Der Schlüssel wird nicht angezeigt');
    if (angelegt.codeText.length !== 64) {
      errs.push('Der angezeigte Schlüssel ist ' + angelegt.codeText.length + ' Zeichen lang');
    }
    if (!angelegt.feldLeer) errs.push('Das Namensfeld behält seinen Inhalt');
    if (!angelegt.einrichtenKnopf) errs.push('Es fehlt der Knopf „Dieses Gerät einrichten"');

    /* Der Schlüssel darf lokal landen — und NUR lokal. */
    const eingerichtet = await page.evaluate(async () => {
      window.__schreib = [];
      document.getElementById('termHier').click();
      await new Promise(r => setTimeout(r, 400));
      let s = null; try { s = localStorage.getItem('kf_terminal'); } catch (e) {}
      return {
        lokal: !!s,
        inhalt: s ? JSON.parse(s) : null,
        inDatenbank: (window.__schreib || []).length
      };
    });
    console.log('EINGERICHTET:', JSON.stringify(eingerichtet).slice(0, 200));
    if (!eingerichtet.lokal) errs.push('Der Schlüssel landet nicht im Gerät');
    else if (!eingerichtet.inhalt || eingerichtet.inhalt.geheim.length !== 64) {
      errs.push('Im Gerät steht kein vollständiger Schlüssel');
    }
    if (eingerichtet.inDatenbank) {
      errs.push('Beim Einrichten wird in die Datenbank geschrieben — der Schlüssel läge ' +
        'dort neben dem Hash, den er aufschliesst');
    }
    await b.close();
  }

  /* ══ 3. Mit Schlüssel: der Bildschirm übernimmt ════════════════════ */
  {
    const vor = `
      try { localStorage.setItem('kf_terminal', JSON.stringify(
        { id:'t1', geheim:'b'.repeat(64), name:'Empfang' })); } catch(e){}
      window.__terminals = [{ id:'t1', studioKey:'studio-6', name:'Empfang', letzterStempel:0 }];
      window.__zeiten = [{ id:'z1', uid:'u2', studioKey:'studio-6', art:'kommen',
                           ts: Date.now()-3600000, tag: new Date().toLocaleDateString('sv-SE') }];
    `;
    const { b, page } = await starten(errs, vor);

    const schirm = await page.evaluate(() => {
      const s = document.getElementById('terminalSchirm');
      return {
        sichtbar: getComputedStyle(s).display !== 'none',
        studio: (document.getElementById('tmStudio') || {}).textContent || '',
        geraet: (document.getElementById('tmGeraet') || {}).textContent || '',
        uhr: (document.getElementById('tmUhr') || {}).textContent || '',
        leute: document.querySelectorAll('#tmListe [data-tmwer]').length,
        namen: [...document.querySelectorAll('#tmListe .tm-nam')].map(n => n.textContent),
        stand: [...document.querySelectorAll('#tmListe .tm-zst')].map(n => n.textContent),
        pinZu: getComputedStyle(document.getElementById('tmPin')).display === 'none'
      };
    });
    console.log('SCHIRM:', JSON.stringify(schirm));
    if (!schirm.sichtbar) errs.push('Mit Schlüssel erscheint der Terminal-Bildschirm nicht');
    if (!/Hürth/.test(schirm.studio)) {
      errs.push('Der Studioname steht nicht da (' + schirm.studio + ') — ' +
        'er kommt aus der Datenbank und nicht aus dem Gerät');
    }
    if (!/\d\d:\d\d/.test(schirm.uhr)) errs.push('Die Uhr zeigt nichts: ' + schirm.uhr);
    if (!schirm.leute) errs.push('Es wird niemand zum Antippen angeboten');
    if (!schirm.pinZu) errs.push('Das Tastenfeld steht offen, bevor jemand gewählt wurde');
    // Der Stempel von u2 muss sich im Stand zeigen.
    if (!schirm.stand.some(s => /im Dienst/.test(s))) {
      errs.push('Niemand wird als „im Dienst" gezeigt, obwohl ein Stempel vorliegt: ' +
        JSON.stringify(schirm.stand));
    }

    /* Das Tastenfeld. */
    const tasten = await page.evaluate(async () => {
      document.querySelector('#tmListe [data-tmwer]').click();
      await new Promise(r => setTimeout(r, 300));
      const tippe = (t) => document.querySelector('#tmTasten [data-tmt="' + t + '"]').click();
      window.__aufruf = null;
      tippe('1'); tippe('2'); tippe('3');
      const nachDrei = document.querySelectorAll('#tmPunkte i.voll').length;
      tippe('4');
      await new Promise(r => setTimeout(r, 300));
      const nachVier = {
        punkte: document.querySelectorAll('#tmPunkte i.voll').length,
        abgeschickt: !!window.__aufruf
      };
      tippe('weg');
      const nachWeg = document.querySelectorAll('#tmPunkte i.voll').length;
      return { nachDrei, nachVier, nachWeg,
               was: (document.getElementById('tmWas') || {}).textContent || '',
               wer: (document.getElementById('tmWer') || {}).textContent || '' };
    });
    console.log('TASTEN:', JSON.stringify(tasten));
    if (tasten.nachDrei !== 3) errs.push('Nach drei Ziffern sind ' + tasten.nachDrei + ' Punkte voll');
    if (tasten.nachVier.abgeschickt) {
      errs.push('Bei vier Ziffern wird von selbst abgeschickt — eine fünfstellige PIN ' +
        'würde dadurch stillschweigend zum Fehlversuch');
    }
    if (tasten.nachWeg !== 3) errs.push('„Löschen" nimmt nicht genau eine Ziffer weg');
    if (!tasten.wer) errs.push('Es steht nicht da, wer stempelt');
    if (!/Kommen|Pause|Zurück|Feierabend/.test(tasten.was)) {
      errs.push('Es steht nicht da, was gestempelt wird: „' + tasten.was + '"');
    }

    /* Stempeln: über die Funktion, mit allen drei Schlüsseln. */
    const stempel = await page.evaluate(async () => {
      window.__fnAntwort.stempeln = { ok: true, art: 'kommen', ts: Date.now(), name: 'Anna Meier' };
      window.__schreib = [];
      window.__aufruf = null;
      document.querySelector('#tmTasten [data-tmt="5"]').click();
      document.querySelector('#tmTasten [data-tmt="ok"]').click();
      await new Promise(r => setTimeout(r, 900));
      const a = window.__aufruf || {};
      return {
        funktion: a.name,
        hatTerminal: !!(a.data && a.data.terminalId),
        hatGeheim: !!(a.data && a.data.geheim && a.data.geheim.length === 64),
        hatUid: !!(a.data && a.data.uid),
        hatPin: (a.data || {}).pin,
        direkt: (window.__schreib || []).filter(w => /zeiten/.test(w.pfad || '')).length,
        pinZu: getComputedStyle(document.getElementById('tmPin')).display === 'none'
      };
    });
    console.log('STEMPEL:', JSON.stringify(stempel));
    if (stempel.funktion !== 'stempeln') errs.push('Aufgerufen wurde „' + stempel.funktion + '"');
    if (!stempel.hatTerminal) errs.push('Die Terminal-Kennung fehlt im Aufruf');
    if (!stempel.hatGeheim) errs.push('Das Geräte-Geheimnis fehlt im Aufruf');
    if (!stempel.hatUid) errs.push('Die Person fehlt im Aufruf');
    if (stempel.hatPin !== '1235') errs.push('Die PIN kommt als „' + stempel.hatPin + '" an');
    if (stempel.direkt) {
      errs.push('Der Browser schreibt selbst nach zeiten — der einzige Weg ist die Funktion');
    }
    if (!stempel.pinZu) errs.push('Das Tastenfeld bleibt nach dem Stempeln offen');

    /* Ein Fehlschlag darf die PIN nicht stehen lassen. */
    const fehler = await page.evaluate(async () => {
      window.__fnAntwort.stempeln = { fehler: 'Falsche PIN. Noch 4 Versuche.' };
      document.querySelector('#tmListe [data-tmwer]').click();
      await new Promise(r => setTimeout(r, 300));
      ['9', '9', '9', '9'].forEach(t => document.querySelector('#tmTasten [data-tmt="' + t + '"]').click());
      document.querySelector('#tmTasten [data-tmt="ok"]').click();
      await new Promise(r => setTimeout(r, 900));
      return {
        punkte: document.querySelectorAll('#tmPunkte i.voll').length,
        meldung: (document.getElementById('toast') || {}).textContent || '',
        nochOffen: getComputedStyle(document.getElementById('tmPin')).display !== 'none'
      };
    });
    console.log('FEHLSCHLAG:', JSON.stringify(fehler));
    if (fehler.punkte !== 0) {
      errs.push('Nach einem Fehlversuch stehen noch ' + fehler.punkte + ' Ziffern — ' +
        'der Nächste tippt auf einer halb gefüllten PIN weiter');
    }
    if (!/PIN/.test(fehler.meldung)) errs.push('Der Fehlschlag wird nicht gemeldet: „' + fehler.meldung + '"');
    if (!fehler.nochOffen) errs.push('Nach einem Fehlversuch schliesst das Tastenfeld');

    await b.close();
  }

  console.log('\nFehler: ' + (errs.length ? '' : 'keine'));
  errs.forEach(e => console.log('  ' + e));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('Fehler: ' + e.message); process.exit(1); });
