/* ══════════════════════════════════════════════════════════════════════
   BLOCK B DER DESIGN-RECHERCHE (Runde 103): Schicht und Woche

   Aus dem Betrieb, 24.9.2026: „mach danach weiter mit block b"

   B1 · Wochenstreifen in „Meine Woche"
        sieben Felder, heute gefüllt, Punkte an Tagen mit Einträgen ·
        jedes Feld ≥ 44 × 44 Trefferfläche und im Bild, auch bei 320 px
        (die Recherche hatte vorher gerechnet: 7 × 44 = 308 > 288) · ein
        Tipp zeigt nur diesen Tag, ein zweiter wieder die Woche ·
        GEGENPROBE: ein leerer Tag sagt das, statt die Woche zu zeigen
   B2 · Schichttausch sichtbar machen
        den Ablauf gab es schon (Ich kann nicht → Ich übernehme →
        Bestätigen), aber nur im Schichtplan eines gewählten Studios ·
        jetzt stehen Angebote auf der Startseite, bei der Leitung auch,
        was auf ihre Bestätigung wartet · ein Tipp öffnet den
        Schichtplan im richtigen Studio, und dort steht „Ich übernehme" ·
        GEGENPROBE: der Mitarbeiter sieht keine „bestätigen?"-Zeile
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

async function seite(b, rolle, w, h) {
  const p = await b.newPage({ viewport: { width: w || 390, height: h || 844 } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => localStorage.setItem('kf_prefs', JSON.stringify({ theme: 'dark' })));
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  await p.evaluate(() => { const t = document.getElementById('tourWeg'); if (t && t.offsetParent) t.click(); });
  await p.waitForTimeout(400);
  return p;
}
async function zurWoche(p) {
  await p.evaluate(() => [...document.querySelectorAll('.mobnav button, .side button')].find(x => /Alles/.test(x.textContent)).click());
  await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('#allesSeite [data-alles="ich"][data-al-ichtab="woche"]').click());
  await p.waitForTimeout(900);
}

const TREFFER = (el) => {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const trifft = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  if (!trifft(cx, cy)) return { w: 0, h: 0, imBild: false };
  let o = cy, u = cy, l = cx, re = cx;
  while (o > 0 && trifft(cx, o - 1)) o--;
  while (u < innerHeight && trifft(cx, u + 1)) u++;
  while (l > 0 && trifft(l - 1, cy)) l--;
  while (re < innerWidth && trifft(re + 1, cy)) re++;
  return { w: Math.round(re - l + 1), h: Math.round(u - o + 1),
           imBild: r.left >= -0.5 && r.right <= innerWidth + 0.5 };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  /* ══ B1 ══════════════════════════════════════════════════════════ */
  console.log('\n── B1: Wochenstreifen ──');
  for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1000]]) {
    const p = await seite(b, 'mitarbeiter', w, h);
    await zurWoche(p);
    const m = await p.evaluate((SRC) => {
      const TREFFER = eval(SRC);
      const tage = [...document.querySelectorAll('#ichStreifen .ist-tag')];
      return {
        anzahl: tage.length,
        heute: tage.filter(t => t.classList.contains('heute')).length,
        mitPunkt: tage.filter(t => t.querySelector('.ich-punkt')).length,
        dienstHeute: !!document.querySelector('#ichStreifen .ist-tag.heute .ich-punkt.dienst'),
        t: tage.map(TREFFER)
      };
    }, '(' + TREFFER.toString() + ')');
    const klein = m.t.filter(x => x.w < 44 || x.h < 44 || !x.imBild);
    pruefe(w + ' px: sieben Tage, einer davon heute', m.anzahl === 7 && m.heute === 1, JSON.stringify(m));
    pruefe(w + ' px: jedes Feld ≥ 44 × 44 und im Bild', klein.length === 0,
      JSON.stringify(m.t.map(x => x.w + '×' + x.h + (x.imBild ? '' : '!'))));
    if (w === 390) {
      pruefe('heute trägt den Dienst-Punkt (die Demo teilt heute ein)', m.dienstHeute);

      const alleZeilen = await p.evaluate(() => document.querySelectorAll('#ichWocheListe .ich-zeile').length);
      await p.evaluate(() => document.querySelector('#ichStreifen .ist-tag.heute').click());
      await p.waitForTimeout(300);
      const tag = await p.evaluate(() => ({
        zeilen: document.querySelectorAll('#ichWocheListe .ich-zeile').length,
        tage: [...document.querySelectorAll('#ichWocheListe .ich-tag')].map(x => x.textContent).filter(Boolean),
        titel: document.getElementById('ichWocheTitel').textContent,
        gedrueckt: document.querySelector('#ichStreifen .ist-tag.heute').getAttribute('aria-pressed')
      }));
      console.log('  Woche: ' + alleZeilen + ' Zeilen · nur heute: ' + JSON.stringify(tag));
      pruefe('ein Tipp auf heute zeigt nur heute', tag.zeilen > 0 && tag.zeilen <= alleZeilen &&
        tag.tage.every(t => t === 'Heute'), JSON.stringify(tag));
      pruefe('die Überschrift nennt den Tag und bietet „ganze Woche"', /ganze Woche/.test(tag.titel) &&
        !/^Diese Woche/.test(tag.titel), tag.titel);
      pruefe('das Feld sagt der Vorlesehilfe, dass es gewählt ist', tag.gedrueckt === 'true');

      await p.evaluate(() => document.querySelector('#ichStreifen .ist-tag.heute').click());
      await p.waitForTimeout(300);
      const zurueck = await p.evaluate(() => ({
        zeilen: document.querySelectorAll('#ichWocheListe .ich-zeile').length,
        titel: document.getElementById('ichWocheTitel').textContent
      }));
      pruefe('ein zweiter Tipp zeigt wieder die ganze Woche', zurueck.zeilen === alleZeilen &&
        zurueck.titel === 'Diese Woche', JSON.stringify(zurueck));

      /* GEGENPROBE: ein Tag ohne Punkt zeigt „nichts eingetragen" —
         nicht stillschweigend die Woche. */
      const leer = await p.evaluate(() => {
        const t = [...document.querySelectorAll('#ichStreifen .ist-tag')].find(x => !x.querySelector('.ich-punkt'));
        if (!t) return null;
        t.click();
        return null;
      });
      await p.waitForTimeout(300);
      const leerTxt = await p.evaluate(() => ({
        zeilen: document.querySelectorAll('#ichWocheListe .ich-zeile').length,
        text: document.getElementById('ichWocheListe').textContent.trim().slice(0, 80),
        hatLeeren: [...document.querySelectorAll('#ichStreifen .ist-tag')].some(x => !x.querySelector('.ich-punkt'))
      }));
      if (leerTxt.hatLeeren)
        pruefe('GEGENPROBE ein leerer Tag sagt „nichts eingetragen"', leerTxt.zeilen === 0 &&
          /nichts eingetragen/.test(leerTxt.text), JSON.stringify(leerTxt));
      else console.log('  (kein leerer Tag in dieser Woche — Gegenprobe entfällt)');
    }
    pruefe(w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  /* ══ B2 ══════════════════════════════════════════════════════════ */
  console.log('\n── B2: Schichttausch auf der Startseite ──');
  {
    const p = await seite(b, 'mitarbeiter');
    const blk = await p.evaluate(() => {
      const alle = [...document.querySelectorAll('#heuteListe .heute-block')];
      const bl = alle.find(x => /^Zum Übernehmen/.test(x.getAttribute('data-btitel') || ''));
      const rest = [...document.querySelectorAll('#heuteListe .heute-rest-knopf')].map(x => x.textContent);
      return bl ? { zeilen: [...bl.querySelectorAll('.heute-zeile')].map(z => z.textContent) } : { rest };
    });
    console.log('  Mitarbeiter: ' + JSON.stringify(blk));
    pruefe('der Block „Zum Übernehmen" steht auf der Startseite', !!blk.zeilen, JSON.stringify(blk));
    pruefe('die Zeile nennt Tag, Zeit und wer abgibt', blk.zeilen && /gibt ab/.test(blk.zeilen[0]) &&
      /\d\d:\d\d–\d\d:\d\d/.test(blk.zeilen[0]), JSON.stringify(blk.zeilen));
    pruefe('GEGENPROBE der Mitarbeiter sieht keine „bestätigen?"-Zeile',
      blk.zeilen && !blk.zeilen.some(z => /bestätigen/.test(z)), JSON.stringify(blk.zeilen));

    await p.evaluate(() => {
      const bl = [...document.querySelectorAll('#heuteListe .heute-block')].find(x => /^Zum Übernehmen/.test(x.getAttribute('data-btitel') || ''));
      bl.querySelector('.heute-zeile').click();
    });
    await p.waitForTimeout(1400);
    const plan = await p.evaluate(() => ({
      ansicht: (document.querySelector('.view.show') || {}).id,
      reiter: (document.querySelector('[data-teamtab].on, [data-teamtab].active') || { getAttribute: () => null }).getAttribute('data-teamtab'),
      studio: (document.getElementById('teamStudio') || {}).value,
      uebernehmen: !!document.querySelector('#shiftGrid [data-tausch-nehmen]')
    }));
    console.log('  nach dem Tipp: ' + JSON.stringify(plan));
    pruefe('ein Tipp öffnet den Schichtplan', plan.ansicht === 'view-team' && plan.reiter === 'schicht',
      JSON.stringify(plan));
    pruefe('im richtigen Studio, und dort steht „Ich übernehme"', plan.studio === 'studio-6' && plan.uebernehmen,
      JSON.stringify(plan));
    pruefe('B2 Mitarbeiter ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  {
    const p = await seite(b, 'leiter');
    const z = await p.evaluate(() => {
      const bl = [...document.querySelectorAll('#heuteListe .heute-block')].find(x => /^Zum Übernehmen/.test(x.getAttribute('data-btitel') || ''));
      return bl ? { zahl: bl.getAttribute('data-bzahl'), zeilen: [...bl.querySelectorAll('.heute-zeile')].map(z => z.textContent) } : null;
    });
    console.log('  Leitung: ' + JSON.stringify(z));
    pruefe('die Leitung sieht, was auf ihre Bestätigung wartet — zuerst',
      z && /Tausch bestätigen/.test(z.zeilen[0]) && / statt /.test(z.zeilen[0]), JSON.stringify(z));
    pruefe('die Überschrift zählt beides (Angebot und Zusage)', z && +z.zahl >= 2, JSON.stringify(z));
    pruefe('B2 Leitung ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Block B: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Block B: Wochenstreifen und Schichttausch auf der Startseite — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
