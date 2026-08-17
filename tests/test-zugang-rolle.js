/* ── „Ich kann keinen Chef anlegen" ───────────────────────────────────
   Aus dem Betrieb gemeldet. Es stimmte, und es meldete sich nicht einmal:

     <select id="emRole">  bot drei Rollen an
     createEmployee()      kannte zwei:
         var role = value==='leiter' ? 'leiter' : 'mitarbeiter';

   „Chef" fiel damit auf „Mitarbeiter" — ohne Fehlermeldung, mit einer
   grünen Bestätigung. Wer einen Chef anlegen wollte, bekam einen
   Mitarbeiter und suchte den Fehler bei sich.

   Die Datenbankregeln erlauben es seit jeher (`allow create: if
   isChef()`); es kam nur nie dort an. Deshalb prüft dieser Durchlauf
   genau das eine: was WIRKLICH nach users/<uid> geschrieben wird.

   Mit Gegenprobe — sonst wäre „schreibt chef" auch dann grün, wenn die
   Rolle fest verdrahtet wäre.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];

/* Die Attrappe kennt keine zweite App zum Anlegen von Konten
   (secondaryApp → firebase.initializeApp(...,'worker')). Sie bekommt hier
   eine, die mitschreibt statt anzulegen. */
const WORKER = `
  window.__angelegt = [];
  window.__profile  = [];
  var wartet = setInterval(function(){
    if (!window.firebase || !window.firebase.firestore) return;
    clearInterval(wartet);

    window.firebase.app = function(){ throw new Error('keine zweite App'); };
    var echtInit = window.firebase.initializeApp;
    window.firebase.initializeApp = function(cfg, name){
      var o = echtInit ? echtInit(cfg, name) : {};
      if (name === 'worker') {
        o.auth = function(){ return {
          createUserWithEmailAndPassword: function(mail, pw){
            var uid = 'neu-' + window.__angelegt.length;
            window.__angelegt.push({ mail: mail, pw: pw, uid: uid });
            return Promise.resolve({ user: { uid: uid } });
          },
          signOut: function(){ return Promise.resolve(); }
        }; };
      }
      return o;
    };

    // Was in users/<uid> geschrieben wird, ist die eigentliche Frage.
    var fs = window.firebase.firestore();
    var echt = fs.collection.bind(fs);
    fs.collection = function(pfad){
      var k = echt(pfad);
      if (pfad === 'users' && k.doc) {
        var d = k.doc.bind(k);
        k.doc = function(id){
          var o = d(id);
          if (o.set && !o.set.__mit) {
            var s = o.set;
            o.set = function(daten){
              window.__profile.push({ id: id, daten: daten });
              return s ? s.apply(o, arguments) : Promise.resolve();
            };
            o.set.__mit = true;
          }
          return o;
        };
      }
      return k;
    };
  }, 2);
  setTimeout(function(){ clearInterval(wartet); }, 4000);`;

async function anlegen(b, rolle, studiosAnkreuzen) {
  const p = await b.newPage({ viewport: { width: 430, height: 900 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  await p.addInitScript(WORKER);
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2600);

  const erg = await p.evaluate(async ({ rolle, studiosAnkreuzen }) => {
    const g = document.querySelector('.mobnav [data-group="g-chef"]');
    if (g) g.click();
    await new Promise(r => setTimeout(r, 350));
    const t = document.querySelector('#chefHome [data-cgo="team"]');
    if (t) t.click();
    await new Promise(r => setTimeout(r, 700));

    const w = document.getElementById('emRole');
    if (!w) return { keinFeld: true };
    const rollen = [...w.options].map(o => o.value);

    document.getElementById('emName').value = 'Neue Leitung';
    document.getElementById('emEmail').value = 'leitung@beispiel.de';
    document.getElementById('emPw').value = 'geheim123';
    w.value = rolle;
    w.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 120));

    const hinweis = (document.getElementById('emRoleHint') || {}).textContent || '';
    if (studiosAnkreuzen) {
      const cb = document.querySelector('#emStudios input');
      if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    document.getElementById('emCreate').click();
    await new Promise(r => setTimeout(r, 900));
    return {
      rollen, hinweis,
      geschrieben: window.__profile,
      meldung: (document.getElementById('emCreateNote') || {}).textContent || ''
    };
  }, { rolle, studiosAnkreuzen });

  await p.close();
  return { erg, fehler };
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  // ══ 1. „Chef" wählen, ohne ein Studio anzukreuzen ══
  {
    const { erg, fehler } = await anlegen(b, 'chef', false);
    if (erg.keinFeld) { errs.push('FEHLT: die Rollenauswahl gibt es nicht'); }
    else {
      console.log('Rollen zur Auswahl:', erg.rollen.join(', '));
      console.log('Hinweis bei „Chef":', JSON.stringify(erg.hinweis.slice(0, 70)));
      const d = (erg.geschrieben[0] || {}).daten || {};
      console.log('Geschrieben:', JSON.stringify({ role: d.role, studios: (d.studios || []).length }));

      if (!erg.geschrieben.length) {
        errs.push('NICHTS ANGELEGT: „' + erg.meldung.slice(0, 80) + '"');
      } else {
        if (d.role !== 'chef') {
          errs.push('FALSCHE ROLLE: gewählt war „Chef", geschrieben wurde „' +
            d.role + '" — genau der gemeldete Fehler');
        }
        if (!d.studios || !d.studios.length) {
          errs.push('OHNE STUDIOS: ein Chef ohne studioKeys läuft dort ins Leere, ' +
            'wo die App die Liste direkt liest (z. B. Empfänger einer Ankündigung)');
        }
      }
      if (erg.rollen.indexOf('chef') < 0) {
        errs.push('FEHLT: „Chef" steht gar nicht zur Auswahl');
      }
      if (!/alle/i.test(erg.hinweis)) {
        errs.push('HINWEIS PASST NICHT: bei „Chef" steht „' + erg.hinweis.slice(0, 60) + '"');
      }
    }
    if (fehler.length) errs.push(fehler.join(' | '));
  }

  /* ══ 2. GEGENPROBE ══
     Bei „Mitarbeiter" muss auch „mitarbeiter" herauskommen. Ohne diese
     Runde wäre der Durchlauf auch dann grün, wenn jemand die Rolle fest
     auf 'chef' verdrahtet — und dann legt jeder Klick einen Vollzugriff
     an. */
  {
    const { erg } = await anlegen(b, 'mitarbeiter', true);
    const d = (erg.geschrieben[0] || {}).daten || {};
    console.log('Gegenprobe Mitarbeiter →', JSON.stringify(d.role));
    if (d.role !== 'mitarbeiter') {
      errs.push('GEGENPROBE: bei „Mitarbeiter" wurde „' + d.role + '" geschrieben');
    }
    if ((d.studios || []).length !== 1) {
      errs.push('GEGENPROBE: ein Mitarbeiter bekommt ' + (d.studios || []).length +
        ' Studios statt des einen angekreuzten');
    }
  }

  // ══ 3. Studio-Leiter bleibt Studio-Leiter ══
  {
    const { erg } = await anlegen(b, 'leiter', true);
    const d = (erg.geschrieben[0] || {}).daten || {};
    console.log('Studio-Leiter →', JSON.stringify(d.role));
    if (d.role !== 'leiter') errs.push('FALSCH: „Studio-Leiter" wurde zu „' + d.role + '"');
  }

  await b.close();
  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Zugang anlegen: alle drei Rollen kommen an, der Chef bekommt alle ' +
      'Studios, die Erklärung folgt der Auswahl');
  process.exit(errs.length ? 1 : 0);
})();
