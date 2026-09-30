/* ══════════════════════════════════════════════════════════════════════
   SCHULUNG „DAS BERATUNGSGESPRÄCH" — 15 Videos, Fragen dazwischen
   (30.9.2026)

   Aus dem Betrieb: „alle 15 videos sollen in eine schulung rein weil das
   ja alles auf einander aufbaut … passende fragen zu dem jeweiligen video
   und paar andere fragen welche mit den infos aus den videos beantwortet
   oder hergeleitet werden können".

   1. Ohne Browser: das Modul selbst. 15 Videos in der richtigen
      Reihenfolge, jedes über seinen Speicherpfad (keine Adresse mit
      Schlüssel im öffentlichen Repository), Fragen zu jedem Video und
      am Ende, richtige Antworten nicht immer an derselben Stelle.
   2. Die Reihenfolge des Durchlaufs (schFolgeBauen aus index.html).
   3. Im Browser (Demo): Karte da, das Video sagt ehrlich, dass es in der
      Vorführung nicht läuft, nach Video 1 kommen seine Fragen, danach
      Video 2; „Zurück" springt über gelöste Fragen.
   4. Ein Modul mit `firma` erscheint in einem anderen Betrieb nicht.
   5. Editor: bei jeder Frage steht, wann sie kommt; das Feld ist
      ≥ 44 px hoch, auch am Handy.
   6. (30.9.2026) „weiter zu sperren ist gut aber … bei den chefs aussen
      vor": „Weiter" erst nach dem Video, Vorspulen zählt nicht; ein
      Teilnehmer mit Chef-Konto ist ausgenommen.
   7. „es soll ja auch nicht jeder direkt bestehen": Bestehensgrenze
      80 %, die erste Antwort zählt, danach richtige Antwort und Hinweis.

   Den echten Video-Eimer erreicht dieser Durchlauf NICHT (das
   Firebase-SDK lädt in dieser Umgebung nicht).
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

/* ── 1. Das Modul ── */
const quelltext = fs.readFileSync(path.join(WURZEL, 'schulungen-basis.js'), 'utf8');
const fenster = {};
new Function('window', quelltext)(fenster);
const M = (fenster.SCHULUNGEN_BASIS.module || []).find(m => m.id === 'm-beratung');
console.log('── 1. Das Modul ──');
pruefe('das Modul „m-beratung" steht im Grundstock', !!M);
if (!M) { console.log('\n' + gut + ' bestanden, ' + schlecht + ' gefallen'); process.exit(1); }
const videos = M.schritte.filter(s => s.art === 'video');
pruefe('15 Videos', videos.length === 15, String(videos.length));
const nummern = videos.map(v => (v.titel.match(/^([\d.]+) ·/) || [])[1]);
pruefe('in der Reihenfolge 1 … 11 wie im Ordner', nummern.join(',') === '1,2,3,4,5,5.1,6,6.1,7,7.1,8,9,9.1,10,11', nummern.join(','));
pruefe('jedes Video über seinen Speicherpfad, im Ordner des Betriebs',
  videos.every(v => /^speicher:firmen\/koerperformen\/schulungen\/[^?]+\.mp4$/.test(v.quelle)), videos.map(v => v.quelle).find(q => !/^speicher:/.test(q)));
/* Die Nummer im Dateinamen muss zum Titel passen — sonst läuft zu
   „Einwandbehandlung" das Video zur VIP-Einladung. */
pruefe('Dateiname und Titel gehören zusammen',
  videos.every(v => { const n = v.titel.match(/^([\d.]+) ·/)[1]; return new RegExp('\\d{13}-' + n.replace('.', '\\.') + '-').test(v.quelle); }),
  videos.map(v => v.titel.slice(0, 5) + ' ↔ ' + v.quelle.split('/').pop()).join(' | '));
pruefe('KEINE Abspiel-Adresse mit Schlüssel im Repository (token=, alt=media)',
  !/token=|alt=media|firebasestorage\.googleapis\.com/.test(quelltext));
pruefe('das Modul gehört dem Betrieb (firma: koerperformen)', M.firma === 'koerperformen', String(M.firma));
pruefe('jede Videolänge ist eingetragen (Sekunden)', videos.every(v => v.dauer > 60), videos.map(v => v.dauer).join(','));

const zuVideo = {};
M.fragen.forEach(f => { if (typeof f.nach === 'number') zuVideo[f.nach] = (zuVideo[f.nach] || 0) + 1; });
const ohneFrage = M.schritte.map((s, i) => (s.art === 'video' && !zuVideo[i]) ? s.titel : null).filter(Boolean);
pruefe('zu jedem Video mindestens eine Frage direkt danach', ohneFrage.length === 0, ohneFrage.join(', '));
const amEnde = M.fragen.filter(f => typeof f.nach !== 'number').length;
pruefe('dazu Fragen am Ende, die mehrere Videos verbinden (≥ 4)', amEnde >= 4, String(amEnde));
pruefe('jede Frage: mindestens drei Antworten, eine richtige, ein Hinweis',
  M.fragen.every(f => f.antworten.length >= 3 && f.richtig >= 0 && f.richtig < f.antworten.length && String(f.hinweis || '').length > 10));
/* Stünde die richtige Antwort meistens an derselben Stelle, lernte man
   die Stelle statt des Inhalts. Beim ersten Entwurf war es 47 von 62
   Mal „B" — gefunden durch genau diese Zählung. */
const stellen = [0, 0, 0, 0]; M.fragen.forEach(f => stellen[f.richtig]++);
pruefe('die richtige Antwort steht nicht meistens an derselben Stelle (höchstens 35 %)',
  Math.max(...stellen) / M.fragen.length <= 0.35, stellen.join('/'));
/* Die zweite Falle nach der Stelle: die richtige Antwort ist die
   längste und genaueste. Nach dem Umschreiben am 30.9.2026 gemessen:
   2 von 67 deutlich (> 15 %) länger. */
const deutlich = M.fragen.filter(f => { const l = f.antworten.map(a => a.length); const r = l[f.richtig];
  return r > Math.max(...l.filter((x, j) => j !== f.richtig)) * 1.15; }).length;
pruefe('die richtige Antwort ist höchstens bei 5 Fragen deutlich länger als alle anderen', deutlich <= 5, String(deutlich));
pruefe('Bestehensgrenze: erster Versuch zählt, 80 %', M.strenge === 'grenze' && M.grenze === 80, M.strenge + ' ' + M.grenze);
pruefe('keine Frage doppelt', new Set(M.fragen.map(f => f.frage)).size === M.fragen.length);
/* Preise aus den Beispielgesprächen werden nicht abgefragt: sie ändern
   sich, und dann wäre die Schulung falsch. */
pruefe('keine konkreten Preise in Fragen oder Antworten (24,90 / 29,90 / 79,90 / 49,90 / 4,90)',
  !M.fragen.some(f => /\d+,90/.test(f.frage + f.antworten.join(' '))));

/* ── 2. Die Folge ── */
console.log('\n── 2. Die Reihenfolge im Durchlauf ──');
const html = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
const fb = (/function schFolgeBauen\(m\)\{[\s\S]*?\n\}/.exec(html) || [''])[0];
let folge = [];
try { folge = new Function(fb + '; return schFolgeBauen;')()(M); } catch (e) { pruefe('schFolgeBauen lässt sich laden', false, String(e)); }
const kurz = folge.map(x => x.art === 'schritt' ? 'S' + x.i : 'F').join(' ');
pruefe('Schritt 0, Video 1, dann die vier Fragen zu Video 1, dann Video 2', /^S0 S1 F F F F S2 /.test(kurz), kurz.slice(0, 40));
pruefe('die letzten Einträge sind die Fragen ohne `nach`', folge.slice(-amEnde).every(x => x.art === 'frage' && typeof M.fragen[x.i].nach !== 'number'));
pruefe('jede Frage und jeder Schritt genau einmal', folge.length === M.schritte.length + M.fragen.length, folge.length + ' / ' + (M.schritte.length + M.fragen.length));

/* ── Browser ── */
async function starte(b, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => localStorage.setItem('kf_tour', '99:demo-ich'));
  await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3300);
  return p;
}
async function zurSchulung(p) {
  await p.evaluate(() => { const k = document.querySelector('.mobnav [data-group="g-ich"]') || document.querySelector('#side [data-group="g-ich"]'); if (k) k.click(); });
  await p.waitForTimeout(700);
  await p.evaluate(() => { const t = [...document.querySelectorAll('[data-subview]')].find(x => /Schulung/.test(x.textContent)); if (t) t.click(); });
  await p.waitForTimeout(1500);
}
async function codeHolen(p, name) {
  await p.click('#schVerwaltenBtn');
  await p.waitForTimeout(800);
  await p.fill('#schTnName', name);
  await p.click('#schTnNeu');
  await p.waitForTimeout(1100);
  const code = await p.evaluate(() => { const b = document.getElementById('schCodeText'); return b ? b.textContent.trim() : null; });
  await p.evaluate(() => { const z = document.querySelector('#schVerwalten [data-schzurueck]'); if (z) z.click(); });
  await p.waitForTimeout(500);
  return code;
}
const stand = (p) => p.evaluate(() => ({
  titel: (document.querySelector('#schLauf .sch-schritt h3') || {}).textContent || '',
  frage: (document.querySelector('#schLauf .sch-frage') || {}).textContent || '',
  nummer: (document.querySelector('#schLauf .sch-schritt .hint') || {}).textContent || '',
  video: (document.querySelector('#schLauf .sch-video') || {}).textContent || '',
  weiter: (document.getElementById('schWeiter') || {}).textContent || '',
  zahl: (document.querySelector('#schLauf .sch-zahl') || {}).textContent || ''
}));
async function richtigBeantworten(p) {
  await p.evaluate(() => {
    const t = document.querySelector('#schLauf .sch-frage').textContent;
    const f = window.SCHULUNGEN_BASIS.module.find(m => m.id === 'm-beratung').fragen.find(x => x.frage === t);
    document.querySelector('[data-schantwort="' + f.richtig + '"]').click();
  });
  await p.waitForTimeout(250);
}
const weiter = async (p) => { await p.evaluate(() => document.getElementById('schWeiter').click()); await p.waitForTimeout(450); };

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 3. Der Durchlauf (Demo, 1440 px) ──');
  {
    const p = await starte(b, 1440, 900);
    await zurSchulung(p);
    const karte = await p.evaluate(() => { const k = document.querySelector('[data-schmodul="m-beratung"]'); return k ? k.textContent.replace(/\s+/g, ' ') : null; });
    pruefe('die Karte „Das Beratungsgespräch" steht in der Übersicht', !!karte && /Beratungsgespräch/.test(karte), String(karte).slice(0, 80));
    const code = await codeHolen(p, 'Beratung Test');
    await p.evaluate(() => document.querySelector('[data-schmodul="m-beratung"]').click());
    await p.waitForTimeout(600);
    await p.evaluate((c) => { document.getElementById('schCodeFeld').value = c; document.getElementById('schStartBtn').click(); }, code);
    await p.waitForTimeout(1500);
    let s = await stand(p);
    pruefe('der Durchlauf beginnt mit „Worum es geht"', /Worum es geht/.test(s.titel), s.titel);
    pruefe('Zähler: 1 von ' + (M.schritte.length + M.fragen.length), s.zahl === '1/' + (M.schritte.length + M.fragen.length), s.zahl);
    await weiter(p);
    await p.waitForTimeout(600);
    s = await stand(p);
    pruefe('dann Video 1 · Einleitung', /1 · Einleitung/.test(s.titel), s.titel);
    /* Ehrlich statt leer: in der Vorführung liegt das Video nicht im
       Speicher. Ein leerer Rahmen hiesse „dein Gerät ist schuld". */
    pruefe('das Video sagt in der Demo ehrlich, dass es hier nicht läuft', /In der Vorführung läuft dieses Video nicht/.test(s.video), s.video.slice(0, 80));
    await weiter(p);
    s = await stand(p);
    pruefe('direkt nach Video 1 kommt die erste Frage dazu', s.frage === M.fragen[0].frage, s.frage.slice(0, 70));
    pruefe('… gezählt als „Frage 1 von ' + M.fragen.length + '"', s.nummer.indexOf('Frage 1 von ' + M.fragen.length) >= 0, s.nummer);
    await richtigBeantworten(p);
    s = await stand(p);
    pruefe('nach der richtigen Antwort: „Nächste Frage" (es folgen noch Fragen zu Video 1)', s.weiter === 'Nächste Frage', s.weiter);
    for (let i = 0; i < 3; i++) { await weiter(p); await richtigBeantworten(p); }
    s = await stand(p);
    pruefe('nach der vierten Frage zu Video 1 heißt der Knopf „Weiter" (jetzt kommt ein Video)', s.weiter === 'Weiter', s.weiter);
    await weiter(p);
    s = await stand(p);
    pruefe('dann Video 2 · Terminvereinbarung', /2 · Terminvereinbarung/.test(s.titel), s.titel);
    /* Zurück: zum vorigen SCHRITT, nicht in die schon gelösten Fragen. */
    await p.evaluate(() => document.querySelector('[data-schzurueckschritt]').click());
    await p.waitForTimeout(400);
    s = await stand(p);
    pruefe('„Zurück" in Video 2 führt zu Video 1, nicht in die gelösten Fragen', /1 · Einleitung/.test(s.titel), s.titel + ' | ' + s.frage.slice(0, 30));
    await weiter(p);
    s = await stand(p);
    pruefe('und „Weiter" überspringt die schon gelösten Fragen', /2 · Terminvereinbarung/.test(s.titel), s.titel + ' | ' + s.frage.slice(0, 30));
    pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 4. Nur im eigenen Betrieb ──');
  {
    const p = await starte(b, 1440, 900);
    await zurSchulung(p);
    const vorher = await p.evaluate(() => !!document.querySelector('[data-schmodul="m-beratung"]'));
    /* Dasselbe Modul, aber einem anderen Betrieb zugeordnet: die Liste
       wird aus demselben Grundstock gezeichnet. */
    await p.evaluate(() => { window.SCHULUNGEN_BASIS.module.find(m => m.id === 'm-beratung').firma = 'anderer-betrieb'; });
    await p.evaluate(() => { const k = document.querySelector('.mobnav [data-group="g-home"]') || document.querySelector('#side [data-group="g-home"]'); if (k) k.click(); });
    await p.waitForTimeout(500);
    await zurSchulung(p);
    const nachher = await p.evaluate(() => ({ da: !!document.querySelector('[data-schmodul="m-beratung"]'), andere: document.querySelectorAll('[data-schmodul]').length }));
    pruefe('GEGENPROBE im eigenen Betrieb ist es da', vorher);
    pruefe('einem anderen Betrieb zugeordnet: nicht in der Liste, die übrigen Module schon', !nachher.da && nachher.andere >= 8, JSON.stringify(nachher));
    await p.close();
  }

  console.log('\n── 5. Editor: „Wann kommt die Frage?" ──');
  for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    for (const dichte of ['normal', 'kompakt']) {
      const p = await starte(b, w, h);
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await zurSchulung(p);
      await p.evaluate(() => document.getElementById('schVerwaltenBtn').click());
      await p.waitForTimeout(800);
      await p.evaluate(() => { const t = document.querySelector('[data-schvwtab="mod"]'); if (t) t.click(); });
      await p.waitForTimeout(900);
      await p.evaluate(() => { const e = document.querySelector('[data-schbearbeiten="m-beratung"]'); if (e) e.click(); });
      await p.waitForTimeout(1200);
      const e = await p.evaluate(() => {
        const felder = [...document.querySelectorAll('#schModulForm [data-frage] [data-ffeld="nach"]')];
        const erstes = felder[0], letztes = felder[felder.length - 1];
        if (erstes) erstes.scrollIntoView({ block: 'center' });
        const r = erstes ? erstes.getBoundingClientRect() : null;
        const t = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
        return {
          anzahl: felder.length,
          erstes: erstes ? erstes.options[erstes.selectedIndex].textContent : '',
          letztes: letztes ? letztes.options[letztes.selectedIndex].textContent : '',
          h: r ? Math.round(r.height) : 0, trifft: !!t && (t === erstes || erstes.contains(t)),
          drin: !!r && r.left >= 0 && r.right <= innerWidth,
          quer: document.documentElement.scrollWidth - innerWidth
        };
      });
      if (w === 1440 && dichte === 'normal') {
        pruefe('bei allen ' + M.fragen.length + ' Fragen steht das Feld', e.anzahl === M.fragen.length, String(e.anzahl));
        pruefe('Frage 1: „Direkt nach 2. 1 · Einleitung"', /^Direkt nach 2\. 1 · Einleitung/.test(e.erstes), e.erstes);
        pruefe('die letzte Frage: „Kommt am Ende"', e.letztes === 'Kommt am Ende', e.letztes);
      }
      pruefe(w + ' px, ' + dichte + ': das Feld ist ≥ 44 px hoch, trifft, im Bild, keine Querlaufleiste', e.h >= 44 && e.trifft && e.drin && e.quer <= 0, JSON.stringify(e));
      await p.close();
    }
  }

  /* ── 6. Video-Sperre ── */
  console.log('\n── 6. „Weiter" erst nach dem Video ──');
  const TESTVIDEO = APP.replace(/index\.html.*$/, '') + 'tests/daten/kurz-video.webm';
  async function mitTestvideo(p, konto) {
    await zurSchulung(p);
    /* Ein echtes, abspielbares Video an Schritt 1 — das aus dem Betrieb
       liegt nur im Speicher des Betriebs. 4 Sekunden, liegt unter tests/. */
    await p.evaluate((u) => { window.SCHULUNGEN_BASIS.module.find(m => m.id === 'm-beratung').schritte[1].quelle = u; }, TESTVIDEO);
    await p.click('#schVerwaltenBtn'); await p.waitForTimeout(800);
    await p.fill('#schTnName', konto ? 'Chef selbst' : 'Team Person');
    if (konto) await p.evaluate(() => { const sel = document.getElementById('schTnKonto'); sel.value = window.firebase.auth().currentUser.uid; sel.dispatchEvent(new Event('change')); });
    await p.click('#schTnNeu'); await p.waitForTimeout(1100);
    const code = await p.evaluate(() => (document.getElementById('schCodeText') || {}).textContent.trim());
    await p.evaluate(() => { const z = document.querySelector('#schVerwalten [data-schzurueck]'); if (z) z.click(); });
    await p.waitForTimeout(500);
    await p.evaluate(() => document.querySelector('[data-schmodul="m-beratung"]').click());
    await p.waitForTimeout(600);
    await p.evaluate((c) => { document.getElementById('schCodeFeld').value = c; document.getElementById('schStartBtn').click(); }, code);
    await p.waitForTimeout(1500);
    await weiter(p);
    await p.waitForTimeout(800);
  }
  const knopf = (p) => p.evaluate(() => ({ aus: !!(document.getElementById('schWeiter') || {}).disabled,
    text: (document.getElementById('schVideoStand') || {}).textContent || '' }));
  {
    const p = await starte(b, 1440, 900);
    await mitTestvideo(p, false);
    let k = await knopf(p);
    pruefe('Video-Schritt: „Weiter" ist gesperrt und sagt warum', k.aus && /Weiter geht es, wenn du das Video angesehen hast/.test(k.text), JSON.stringify(k));
    /* Vorspulen ans Ende: zählt nicht. */
    await p.evaluate(() => { const v = document.querySelector('#schLauf video'); v.currentTime = Math.max(0, v.duration - 0.2); });
    await p.waitForTimeout(1200);
    k = await knopf(p);
    pruefe('ans Ende vorgespult: bleibt gesperrt', k.aus, JSON.stringify(k));
    await p.evaluate(() => { const v = document.querySelector('#schLauf video'); v.muted = true; v.currentTime = 0; return v.play(); });
    await p.waitForTimeout(5200);
    k = await knopf(p);
    pruefe('ganz angesehen: „Weiter" geht, der Hinweis ist weg', !k.aus && !k.text, JSON.stringify(k));
    pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  {
    const p = await starte(b, 1440, 900);
    await mitTestvideo(p, true);
    const k = await knopf(p);
    pruefe('Teilnehmer mit Chef-Konto: „Weiter" geht sofort', !k.aus && !k.text, JSON.stringify(k));
    await p.close();
  }

  /* ── 7. Bestehensgrenze ── */
  console.log('\n── 7. Nicht jeder besteht ──');
  {
    const p = await starte(b, 1440, 900);
    await zurSchulung(p);
    const code = await codeHolen(p, 'Rate Mal');
    await p.evaluate(() => document.querySelector('[data-schmodul="m-beratung"]').click());
    await p.waitForTimeout(600);
    await p.evaluate((c) => { document.getElementById('schCodeFeld').value = c; document.getElementById('schStartBtn').click(); }, code);
    await p.waitForTimeout(1500);
    await weiter(p); await p.waitForTimeout(500); await weiter(p);
    /* Die erste Frage absichtlich falsch. */
    await p.evaluate(() => {
      const t = document.querySelector('#schLauf .sch-frage').textContent;
      const f = window.SCHULUNGEN_BASIS.module.find(m => m.id === 'm-beratung').fragen.find(x => x.frage === t);
      document.querySelector('[data-schantwort="' + ((f.richtig + 1) % f.antworten.length) + '"]').click();
    });
    await p.waitForTimeout(300);
    const nach = await p.evaluate(() => ({
      richtigMarkiert: !!document.querySelector('.sch-antwort.richtig'),
      falschMarkiert: !!document.querySelector('.sch-antwort.falsch'),
      alleZu: [...document.querySelectorAll('[data-schantwort]')].every(x => x.disabled),
      hinweis: (document.querySelector('.sch-hinweis') || {}).textContent || '',
      weiter: (document.getElementById('schWeiter') || {}).textContent || '',
      nochDieselbe: (document.querySelector('.sch-frage') || {}).textContent || ''
    }));
    pruefe('falsch beim ersten Versuch: die richtige Antwort ist markiert, keine zweite Chance', nach.richtigMarkiert && nach.falschMarkiert && nach.alleZu, JSON.stringify(nach));
    pruefe('… der Hinweis steht unter DIESER Frage, dann „Nächste Frage"', nach.hinweis.length > 10 && nach.weiter === 'Nächste Frage' && nach.nochDieselbe === M.fragen[0].frage, JSON.stringify(nach));
    /* Den Rest mit immer derselben Antwort A durchklicken — wer rät,
       besteht nicht. */
    for (let i = 0; i < 200; i++) {
      const z = await p.evaluate(() => ({ ergebnis: getComputedStyle(document.getElementById('schErgebnis')).display !== 'none',
        frage: !!document.querySelector('#schLauf .sch-frage'), offen: !!document.querySelector('[data-schantwort]:not([disabled])') }));
      if (z.ergebnis) break;
      if (z.frage && z.offen) { await p.evaluate(() => document.querySelector('[data-schantwort="0"]').click()); await p.waitForTimeout(80); }
      /* Der Schritt „Üben" will einen Haken. */
      await p.evaluate(() => { const h = document.querySelector('#schHaken input'); if (h && !h.checked) h.click(); });
      await p.waitForTimeout(60);
      await p.evaluate(() => { const w = document.getElementById('schWeiter'); if (w && !w.disabled) w.click(); });
      await p.waitForTimeout(120);
    }
    const erg = await p.evaluate(() => (document.getElementById('schErgebnis') || {}).textContent.replace(/\s+/g, ' '));
    const proz = +((erg.match(/(\d+)%/) || [])[1]);
    pruefe('wer immer „A" nimmt, besteht nicht: „Noch nicht ganz" unter 80 %', /Noch nicht ganz/.test(erg) && proz < 80, erg.slice(0, 120));
    pruefe('keine Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  await b.close();
  console.log('\n' + gut + ' bestanden, ' + schlecht + ' gefallen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
