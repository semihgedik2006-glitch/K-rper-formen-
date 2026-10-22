/* ══════════════════════════════════════════════════════════════════════
   SCHULUNG: WEITERMACHEN, AM RECHNER, FÜR DIE LEITUNG (Runde 201)

   Aus dem Betrieb, 22.10.2026: „plan klingt gut" — auf diesen Plan:
   - „Das Beratungsgespräch" (17 Schritte, 67 Fragen, etwa 150 Minuten)
     in Etappen: aufhören, später mit dem Code weitermachen.
   - Am Rechner zwei Spalten: links, was für dich ansteht, rechts die
     Module; im Durchlauf links das Inhaltsverzeichnis, Tasten 1–4 und →.
   - „‹ Zurück" traf am Handy nur 39 px hoch (Hit-Test, die Reiter darüber
     lagen auf seinen oberen 5 px).
   - Für die Leitung, auf „Ja": welche Fragen im Team oft danebengehen,
     ohne Namen, erst ab drei Antworten. Und Fristen der Pflichtmodule
     je Teilnehmer („ja jetzt").

   Jede Prüfung mit Gegenprobe, sonst wäre sie auch bei einer Seite grün,
   die gar nichts tut.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 220) : '')); }
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
const BREITEN = [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]];

async function oeffne(b, w, h, rolle) {
  const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + (rolle || 'mitarbeiter'), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
async function zurSchulung(p) {
  await p.evaluate(() => {
    const k = document.querySelector('.mobnav [data-group="g-wissen"]') ||
              document.querySelector('#side [data-group="g-wissen"]');
    if (k) k.click();
  });
  await p.waitForTimeout(700);
  await p.evaluate(() => {
    const t = [...document.querySelectorAll('[data-subview]')].find(x => /Schulung/.test(x.textContent));
    if (t) t.click();
  });
  await p.waitForTimeout(1600);
}
/* Alle sichtbaren Knöpfe in einem Bereich, per Hit-Test, normal und
   kompakt. */
async function fingerziele(p, sel) {
  const raus = [];
  for (const dichte of ['normal', 'kompakt']) {
    await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
    const r = await p.evaluate(async ({ SRC, sel }) => {
      const T = eval('(' + SRC + ')');
      const els = [...document.querySelectorAll(sel)].filter(e => e.offsetParent && !e.disabled);
      const zu = [];
      for (const el of els) {
        el.scrollIntoView({ block: 'center' });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const m = T(el);
        if (m.w < 44 || m.h < 44) zu.push((el.textContent.trim() || el.id).slice(0, 18) + ' ' + m.w + '×' + m.h);
      }
      return { zu, n: els.length, quer: document.documentElement.scrollWidth - innerWidth };
    }, { SRC: TREFFER.toString(), sel });
    raus.push({ dichte, ...r });
  }
  await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
  return raus;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── Übersicht: zwei Spalten am Rechner, eine am Handy ──');
  for (const [w, h] of BREITEN) {
    const p = await oeffne(b, w, h);
    await zurSchulung(p);
    const m = await p.evaluate(() => {
      const r = (id) => document.getElementById(id).getBoundingClientRect();
      return { liste: Math.round(r('schListe').top), listeL: Math.round(r('schListe').left),
               faelligR: Math.round(r('schFaelligKarte').right), faelligL: Math.round(r('schFaelligKarte').left),
               quer: document.documentElement.scrollWidth - innerWidth };
    });
    if (w >= 1280) {
      pruefe(w + ' px: die Module stehen RECHTS neben „Das steht für dich an"', m.listeL > m.faelligR, JSON.stringify(m));
      pruefe(w + ' px: … und beginnen im ersten Bild (vorher bei 1280 × 800: Pixel 1.059)', m.liste < h - 200, m.liste + ' von ' + h);
    } else {
      pruefe('GEGENPROBE ' + w + ' px: eine Spalte, die Module darunter', m.listeL <= m.faelligL + 1 && m.liste > m.faelligR - 9999, JSON.stringify(m));
    }
    pruefe(w + ' px: nichts ragt seitlich hinaus', m.quer <= 0, String(m.quer));
    await p.close();
  }

  console.log('\n── Weitermachen ──');
  const p = await oeffne(b, 1440, 900);
  await zurSchulung(p);
  const angef = await p.evaluate(() => (document.querySelector('[data-schfaellig="m-beratung"]') || {}).textContent || '');
  pruefe('„Das Beratungsgespräch" sagt „angefangen · 2 von 17 Schritten"', /angefangen · 2 von 17 Schritten/.test(angef), angef);
  const marke = await p.evaluate(() => [...document.querySelectorAll('[data-schmodul="m-beratung"] .sch-marke')].map(x => x.textContent));
  pruefe('… auch in der Modulliste („angefangen · 2/17")', marke.includes('angefangen · 2/17'), marke.join(', '));
  const nichtAngef = await p.evaluate(() => (document.querySelector('[data-schfaellig="m-hygiene"]') || {}).textContent || '');
  pruefe('GEGENPROBE ein nie begonnenes Modul sagt „noch nicht gemacht"', /noch nicht gemacht/.test(nichtAngef) && !/angefangen/.test(nichtAngef), nichtAngef);

  await p.click('[data-schfaellig="m-beratung"]'); await p.waitForTimeout(700);
  /* Die Code-Seite am Rechner: nicht mehr über die ganze Breite. */
  const codeBreite = await p.evaluate(() => document.querySelector('#schCode > .card').offsetWidth);
  pruefe('Code-Seite am Rechner höchstens 640 px breit (vorher 1.174)', codeBreite <= 640, codeBreite + ' px');
  const vorZahl = await p.evaluate(() => (window.__demoSchreib || []).length);
  await p.fill('#schCodeFeld', 'D3MQ-7WKP-H2CX'); await p.click('#schStartBtn'); await p.waitForTimeout(1400);
  const lauf = await p.evaluate(() => ({
    toast: [...document.querySelectorAll('.toast, #toast')].map(x => x.textContent).join(' '),
    zeilen: document.querySelectorAll('[data-schinhalt]').length,
    hier: (document.querySelector('.sch-inhalt-zeile.hier') || {}).getAttribute ? document.querySelector('.sch-inhalt-zeile.hier').getAttribute('data-schinhalt') : null,
    gesehen: [...document.querySelectorAll('.sch-inhalt-zeile.gesehen')].map(x => x.getAttribute('data-schinhalt')),
    gesperrt: [...document.querySelectorAll('[data-schinhalt]')].filter(x => x.disabled).length,
    frage: !!document.querySelector('#schLauf [data-schantwort]'),
    tasten: (document.querySelector('.sch-tasten') || {}).offsetHeight || 0
  }));
  pruefe('mit demselben Code geht es weiter, wo man war (Hinweis sagt es)', /Weiter, wo du aufgehört hast: 2 von 17 Schritten gesehen/.test(lauf.toast), lauf.toast);
  pruefe('links das Inhaltsverzeichnis: alle 17 Schritte', lauf.zeilen === 17, String(lauf.zeilen));
  pruefe('… die gesehenen mit Haken (Schritt 1 und 2)', lauf.gesehen.join() === '0,1', lauf.gesehen.join());
  pruefe('… und die noch nicht gesehenen gesperrt — kein Weg an Video und Lesezeit vorbei', lauf.gesperrt >= 15, String(lauf.gesperrt));
  pruefe('es geht bei der ersten offenen Frage weiter', lauf.frage);
  pruefe('am Rechner stehen die Tasten dabei', lauf.tasten > 0);

  /* Tasten: eine Ziffer beantwortet die Frage. Erst eine falsche (der
     Hinweis kommt), dann die richtige, dann → weiter. */
  const vorher = await p.evaluate(() => document.querySelector('#schLauf .sch-fortschritt .sch-zahl').textContent);
  await p.keyboard.press('9'); await p.waitForTimeout(250);
  const nach9 = await p.evaluate(() => document.querySelectorAll('#schLauf .sch-antwort.falsch, #schLauf .sch-antwort.richtig').length);
  pruefe('GEGENPROBE Taste 9 bei vier Antworten tut nichts', nach9 === 0, String(nach9));
  const richtig = await p.evaluate(() => {
    const t = document.querySelector('#schLauf .sch-frage').textContent;
    const f = window.SCHULUNGEN_BASIS.module.find(m => m.id === 'm-beratung').fragen.find(x => x.frage === t);
    return f.richtig;
  });
  await p.keyboard.press(String(richtig === 0 ? 2 : 1)); await p.waitForTimeout(300);
  const nachFalsch = await p.evaluate(() => ({ falsch: document.querySelectorAll('#schLauf .sch-antwort.falsch').length,
    hinweis: !!document.querySelector('#schLauf .sch-hinweis'), weiter: !!document.getElementById('schWeiter') }));
  pruefe('Taste ' + (richtig === 0 ? 2 : 1) + ': die falsche Antwort ist gewählt, der Hinweis steht da', nachFalsch.falsch === 1 && nachFalsch.hinweis, JSON.stringify(nachFalsch));
  /* Bei „Das Beratungsgespräch" zählt der erste Versuch (Bestehensgrenze):
     danach sind die Antworten gesperrt. Eine weitere Ziffer darf dann
     NICHT zu den Tastenkürzeln der App durchrutschen — beim ersten
     Anlauf sprang die App genau so mitten aus der Schulung zu den
     Aufgaben. */
  await p.keyboard.press(String(richtig + 1)); await p.waitForTimeout(400);
  const nochDa = await p.evaluate(() => (document.querySelector('.view.show') || {}).id);
  pruefe('GEGENPROBE eine Ziffer auf gesperrten Antworten bleibt im Durchlauf', nochDa === 'view-schulung', nochDa);
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400);
  const danach = await p.evaluate(() => document.querySelector('#schLauf .sch-fortschritt .sch-zahl').textContent);
  pruefe('→ : eine Stelle weiter', parseInt(danach) === parseInt(vorher) + 1, vorher + ' → ' + danach);

  /* Springen zurück zu einem gesehenen Schritt. */
  await p.click('[data-schinhalt="0"]'); await p.waitForTimeout(400);
  const gesprungen = await p.evaluate(() => (document.querySelector('.sch-inhalt-zeile.hier') || {}).getAttribute('data-schinhalt'));
  pruefe('ein Tipp auf einen gesehenen Schritt springt dorthin', gesprungen === '0', gesprungen);
  const zuNah = await p.evaluate(() => { const z = document.querySelector('[data-schinhalt="9"]'); return z.disabled; });
  pruefe('GEGENPROBE ein ungesehener Schritt lässt sich nicht antippen', zuNah);

  /* Fingerziele im Durchlauf, an allen Breiten. */
  for (const [w, h] of BREITEN) {
    await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(250);
    const f = await fingerziele(p, '#schLauf button');
    f.forEach(x => pruefe('Durchlauf ' + w + ' px ' + x.dichte + ': ' + x.n + ' Knöpfe ≥ 44 × 44, nichts ragt hinaus',
      x.n >= 2 && !x.zu.length && x.quer <= 0, x.zu.join(', ') + ' quer ' + x.quer));
  }
  await p.setViewportSize({ width: 1440, height: 900 });

  await p.click('#schPause'); await p.waitForTimeout(900);
  const pause = await p.evaluate(() => ({
    uebersicht: document.getElementById('schUebersicht').style.display !== 'none',
    toast: [...document.querySelectorAll('.toast, #toast')].map(x => x.textContent).join(' '),
    angef: (document.querySelector('[data-schfaellig="m-beratung"]') || {}).textContent || ''
  }));
  pruefe('„Später weiter" speichert und führt zurück zur Übersicht', pause.uebersicht && /Gespeichert/.test(pause.toast), pause.toast);
  pruefe('… dort steht weiter „angefangen"', /angefangen · 2 von 17 Schritten/.test(pause.angef), pause.angef);
  /* Gespeichert heisst: mit dem Code geht es hinter der beantworteten
     Frage weiter, nicht wieder bei ihr. */
  await p.click('[data-schfaellig="m-beratung"]'); await p.waitForTimeout(700);
  await p.fill('#schCodeFeld', 'D3MQ-7WKP-H2CX'); await p.click('#schStartBtn'); await p.waitForTimeout(1400);
  const wieder = await p.evaluate(() => document.querySelector('#schLauf .sch-fortschritt .sch-zahl').textContent);
  pruefe('… und beim nächsten Mal geht es HINTER der beantworteten Frage weiter', parseInt(wieder) === parseInt(vorher) + 1,
    vorher + ' → ' + wieder);
  await p.click('#schPause'); await p.waitForTimeout(900);
  pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
  await p.close();

  console.log('\n── „‹ Zurück" am Handy ──');
  for (const [w, h] of [[320, 568], [390, 844], [430, 932]]) {
    const q = await oeffne(b, w, h);
    await zurSchulung(q);
    await q.click('[data-schmodul="m-hygiene"]'); await q.waitForTimeout(700);
    const f = await fingerziele(q, '#schCode button');
    f.forEach(x => pruefe(w + ' px ' + x.dichte + ': „‹ Zurück" und „Anfangen" ≥ 44 × 44 (vorher 39 hoch)',
      x.n >= 2 && !x.zu.length, x.zu.join(', ')));
    await q.close();
  }

  console.log('\n── Für die Leitung ──');
  const c = await oeffne(b, 1440, 900, 'chef');
  await zurSchulung(c);
  await c.click('#schVerwaltenBtn'); await c.waitForTimeout(800);
  const tn = await c.evaluate(() => [...document.querySelectorAll('#schTnListe .sch-tn-zeile')].map(z => z.textContent.replace(/\s+/g, ' ')));
  const jamie = tn.find(z => /Jamie Kurz/.test(z)) || '';
  pruefe('je Teilnehmer: welches Pflichtmodul noch offen ist, mit Frist', /Pflicht offen: .*Wenn einem Kunden schlecht wird \(bis \d+\.\d+\.\)/.test(jamie), jamie);
  pruefe('GEGENPROBE … ein bestandenes steht dort nicht', !/Hygiene nach jedem Training/.test(jamie.split('Pflicht offen')[1] || ''), jamie);
  await c.click('[data-schvwtab="aus"]'); await c.waitForTimeout(1000);
  const schwer = await c.evaluate(() => [...document.querySelectorAll('[data-schschwer]')].map(z => ({
    k: z.getAttribute('data-schschwer'), t: z.textContent.replace(/\s+/g, ' ') })));
  pruefe('„Fragen, die im Team nicht sitzen": die schwerste zuerst', schwer.length >= 2 && schwer[0].k === 'm-notfall#2', JSON.stringify(schwer).slice(0, 220));
  pruefe('… mit beiden Zahlen, Durchlauf und Auffrischen', /Durchlauf: 1 von 1 daneben · Auffrischen: 3 von 5 daneben/.test(schwer[0] ? schwer[0].t : ''), schwer[0] && schwer[0].t);
  pruefe('… und ohne einen einzigen Namen', !schwer.some(s => /Jamie|Nora|Demo-Konto/.test(s.t)));
  pruefe('GEGENPROBE unter drei Antworten steht eine Frage nicht da (m-start#0: 1 + 2)', !schwer.some(s => s.k === 'm-start#0'),
    schwer.map(s => s.k).join(', '));
  /* Der Modul-Editor: mit „Pflicht" das Feld für die Frist. */
  await c.click('[data-schvwtab="mod"]'); await c.waitForTimeout(500);
  await c.click('#schModulNeu'); await c.waitForTimeout(600);
  const mitPflicht = await c.evaluate(() => (document.getElementById('schFFrist') || {}).value);
  pruefe('Editor: ein neues Pflichtmodul hat eine Frist von 14 Tagen', mitPflicht === '14', String(mitPflicht));
  await c.click('#schFPflicht'); await c.waitForTimeout(400);
  const ohnePflicht = await c.evaluate(() => !!document.getElementById('schFFrist'));
  pruefe('GEGENPROBE ohne „Pflicht" verschwindet das Fristfeld', !ohnePflicht);
  pruefe('ohne Skriptfehler (Leitung)', !c._fehler.length, c._fehler.join(' | '));
  await c.close();

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Schulung: weitermachen, am Rechner, für die Leitung — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
