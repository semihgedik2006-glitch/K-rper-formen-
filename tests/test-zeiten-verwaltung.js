/* ── Zeiterfassung in der Verwaltung (Runden 204–215) ──────────────────
   Aus test-stempelseite.js herausgelöst, als der Durchlauf über die
   240 Sekunden von tests/alle.sh wuchs. Dieselben Helfer, dieselben
   Breiten; hier die Teile, die Leitung und Geschäftsführung betreffen:

     8.  Korrekturanträge: stellen, zurückziehen, annehmen, ablehnen
     9.  Monat & Konto, Abschluss, Export als Excel und CSV
     10. DATEV (LODAS): Einstellungen und Inhalt der Datei
     11. Soll je Wochentag mit Feiertagen; nur die Geschäftsführung
         korrigiert
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const BREITEN = [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]];

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

async function oeffne(b, rolle, w, h) {
  const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
/* Der Weg eines Menschen: Heute → Ich → Zeiten. */
async function zurSeite(p) {
  return p.evaluate(async () => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    const g = document.querySelector('.mobnav [data-group="g-start"], #side [data-group="g-start"]');
    if (g) { g.click(); await w(500); }
    const s = document.querySelector('#subnav [data-subview="ich"]');
    if (s) { s.click(); await w(500); }
    const t = document.querySelector('[data-ichtab="zeiten"]');
    if (!t) return false;
    t.click(); await w(1500);
    return getComputedStyle(document.getElementById('ichPaneZeiten')).display !== 'none';
  });
}
async function zuVerwaltungZeiten(p) {
  return p.evaluate(async () => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    const g = document.querySelector('.mobnav [data-group="g-chef"], #side [data-group="g-chef"]');
    if (g) { g.click(); await w(700); }
    else {
      const a = document.querySelector('.mobnav [data-group="g-alles"]'); if (!a) return false;
      a.click(); await w(700);
      const v = [...document.querySelectorAll('#view-alles button, #view-alles a')].find(x => /Verwaltung/.test(x.textContent));
      if (!v) return false;
      v.click(); await w(700);
    }
    const c = document.querySelector('#chefHome [data-cgo="zeiten"]');
    if (!c) return false;
    c.click(); await w(1500);
    return true;
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 8. Korrekturanträge (Runde 204) ──');
  {
    const p = await oeffne(b, 'mitarbeiter', 390, 844);
    await zurSeite(p);
    const m = await p.evaluate(async () => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      const luecke = [...document.querySelectorAll('#ichZeitenListe [data-ztag]')].find(z => /Feierabend fehlt/.test(z.textContent));
      if (!luecke) return { fehlt: 'kein Tag mit fehlendem Feierabend' };
      luecke.click(); await w(300);
      const hier = document.querySelector('#mzs-' + luecke.dataset.ztag + ' [data-antragtag]');
      hier.click(); await w(600);
      const form = { tag: stAntragTag.value, art: stAntragArt.value, soll: luecke.dataset.ztag };
      stAntragUhr.value = '17:30'; stAntragGrund.value = 'ok';
      stAntragBtn.click(); await w(800);
      const kurz = document.querySelectorAll('#stAntraege [data-antrag]').length;
      stAntragGrund.value = 'Feierabend vergessen, Schicht bis 17:30';
      stAntragBtn.click(); await w(1200);
      const zeilen = [...document.querySelectorAll('#stAntraege [data-antrag]')].map(z => z.innerText.replace(/\s+/g, ' '));
      const zieh = document.querySelector('#stAntraege [data-antragweg]');
      zieh.click(); await w(1000);
      return { form, kurz, zeilen, danach: document.querySelector('#stAntraege [data-antrag]').innerText };
    });
    pruefe('„Feierabend beantragen" am fehlenden Tag füllt Tag und Art', m.form && m.form.tag === m.form.soll && m.form.art === 'gehen', JSON.stringify(m.form || m));
    pruefe('ohne Grund geht kein Antrag raus', m.kurz === 1, m.kurz);
    pruefe('der Antrag steht oben mit „wartet"', m.zeilen && /Feierabend 17:30 wartet/.test(m.zeilen[0]), JSON.stringify(m.zeilen));
    pruefe('Zurückziehen → „zurückgezogen", nicht weg', /zurückgezogen/.test(m.danach || ''), m.danach);
    pruefe('ohne Skriptfehler (Antrag)', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }
  for (const [rolle, w, h] of [['chef', 1440, 900], ['chef', 320, 568], ['leiter', 1280, 800]]) {
    const p = await oeffne(b, rolle, w, h);
    await zuVerwaltungZeiten(p);
    const g = await p.evaluate(async (SRC) => {
      const T = eval('(' + SRC + ')');
      const ws = (ms) => new Promise(r => setTimeout(r, ms));
      const box = document.getElementById('zkAntraege');
      const sichtbar = !box.hidden && !!box.offsetParent;
      if (!sichtbar) return { sichtbar };
      const knoepfe = [...box.querySelectorAll('button')];
      const masse = [];
      for (const k of knoepfe) { k.scrollIntoView({ block: 'center' }); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const m = T(k); masse.push(k.textContent.trim() + ' ' + m.w + '×' + m.h); }
      box.querySelector('[data-zkantragab]').click(); await ws(300);
      box.querySelector('[data-zkantragnein]').click(); await ws(600);
      const nochDa = box.querySelectorAll('[data-zkantrag]').length;
      const zeilenVor = document.querySelectorAll('#zkListe [data-zk]').length;
      box.querySelector('[data-zkantragzurueck]').click(); await ws(200);
      box.querySelector('[data-zkantragja]').click(); await ws(1500);
      return { sichtbar, masse, nochDa, weg: box.hidden, quer: document.documentElement.scrollWidth - innerWidth };
    }, TREFFER.toString());
    if (rolle === 'leiter') { pruefe('Studioleitung ' + w + ' px: sieht KEINE Anträge (nur die Geschäftsführung entscheidet)', !g.sichtbar); }
    else {
      pruefe('Geschäftsführung ' + w + ' px: der offene Antrag steht oben', g.sichtbar);
      pruefe('… Annehmen / Ablehnen treffen ≥ 44 (' + (g.masse || []).join(', ') + ')', (g.masse || []).length >= 2 && g.masse.every(x => { const m = /(\d+)×(\d+)/.exec(x); return +m[1] >= 44 && +m[2] >= 44; }));
      pruefe('… Ablehnen ohne Antwort entscheidet nichts', g.nochDa === 1, g.nochDa);
      pruefe('… Annehmen räumt ihn weg', g.weg === true);
      pruefe('… nichts ragt hinaus', g.quer <= 0, g.quer);
    }
    pruefe(rolle + ' ' + w + ' px: ohne Skriptfehler (Anträge)', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 9. Monat & Konto, Abschluss, Export (Runde 208) ──');
  for (const [rolle, w, h] of [['chef', 1440, 900], ['chef', 1920, 1080], ['chef', 390, 844], ['chef', 320, 568], ['leiter', 1280, 800]]) {
    const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: w, height: h }, acceptDownloads: true });
    p._fehler = []; p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
    await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    await zuVerwaltungZeiten(p);
    const sicht = await p.evaluate(() => { const a = document.getElementById('zkAnsicht'); return !!a && !a.hidden && !!a.offsetParent; });
    if (rolle === 'leiter') { pruefe('Studioleitung ' + w + ' px: kein „Monat & Konto" (nur die Geschäftsführung)', !sicht); await p.close(); continue; }
    pruefe('Geschäftsführung ' + w + ' px: Umschalter „Tage | Monat & Konto" ist da', sicht);
    const k = await p.evaluate(async (SRC) => {
      const T = eval('(' + SRC + ')');
      const ws = (ms) => new Promise(r => setTimeout(r, ms));
      document.querySelector('[data-zkansicht="konto"]').click(); await ws(2200);
      const box = document.getElementById('zkKonto');
      const masse = [];
      /* Nur SICHTBARE: der Speichern-Knopf in der zugeklappten
         DATEV-Box hat keine Fläche und soll keine haben. Dafür zählt
         die Klappzeile selbst mit. */
      for (const el of [...document.querySelectorAll('[data-zkansicht], #zkKonto button, #zkKonto summary')].filter(e => e.getClientRects().length &&
          !(e.tagName !== 'SUMMARY' && e.closest('details:not([open])')))) {
        el.scrollIntoView({ block: 'center' }); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const m = T(el); masse.push(el.textContent.trim() + ' ' + m.w + '×' + m.h);
      }
      return { zeilen: box.querySelectorAll('tbody tr').length, kopf: [...box.querySelectorAll('th')].map(x => x.textContent),
        tageWeg: document.getElementById('zkWrap').hidden, jetztWeg: getComputedStyle(document.getElementById('zkJetzt')).display === 'none',
        text: box.innerText.slice(0, 200), masse, quer: document.documentElement.scrollWidth - innerWidth };
    }, TREFFER.toString());
    pruefe(w + ' px: Tabelle je Person mit Ist, Soll, Saldo, Übertrag, Konto', k.zeilen > 3 && ['Ist', 'Soll', 'Saldo', 'Übertrag', 'Konto'].every(x => k.kopf.some(y => new RegExp(x, 'i').test(y))), JSON.stringify(k.kopf));
    pruefe(w + ' px: die Tage-Liste und „Jetzt im Studio" sind in dieser Ansicht weg', k.tageWeg && k.jetztWeg);
    pruefe(w + ' px: laufender Monat → „Soll bis heute", kein Abschliessen-Knopf', /Soll bis heute/.test(k.text) && !k.masse.some(x => /abschliessen/.test(x)), k.text);
    pruefe(w + ' px: jeder Knopf trifft ≥ 44 × 44 (' + k.masse.join(', ') + ')', k.masse.length >= 4 && k.masse.every(x => { const m = /(\d+)×(\d+)$/.exec(x); return +m[1] >= 44 && +m[2] >= 44; }));
    pruefe(w + ' px: die SEITE rollt nicht seitlich (die Tabelle darf es)', k.quer <= 0, k.quer);
    if (w === 1440) {
      const [dl] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => document.querySelector('[data-zkexport="csv"]').click())]);
      const csv = require('fs').readFileSync(await dl.path(), 'utf8');
      pruefe('CSV: Name „Stunden-JJJJ-MM.csv", Semikolon, Dezimalkomma, BOM', /^Stunden-\d{4}-\d{2}\.csv$/.test(dl.suggestedFilename()) &&
        csv.charCodeAt(0) === 0xFEFF && /^\ufeffPerson;Tage;Ist \(h\);Soll \(h\)/.test(csv) && /;\d+,\d{2};/.test(csv), csv.slice(0, 120));
      pruefe('CSV: keine PIN, kein Hash, kein Geheimnis', !/pin|hash|geheim|secret|token/i.test(csv));
      const [dx] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => document.querySelector('[data-zkexport="xls"]').click())]);
      const xls = require('fs').readFileSync(await dx.path(), 'utf8');
      pruefe('Excel: Übersicht UND Tage', /Übersicht je Person/.test(xls) && /<h3>Tage<\/h3>/.test(xls), dx.suggestedFilename());
      const ab = await p.evaluate(async () => {
        const ws = (ms) => new Promise(r => setTimeout(r, ms)); window.confirm = () => true;
        document.getElementById('zkPrev').click(); await ws(2200);
        const kn = document.querySelector('[data-zkabschluss]'); if (!kn) return { fehlt: document.getElementById('zkKonto').innerText.slice(0, 160) };
        kn.click(); await ws(1500);
        const t = document.getElementById('zkKonto').innerText;
        document.querySelector('[data-zkansicht="tage"]').click(); await ws(1500);
        return { zu: /Abgeschlossen/.test(t), oeffnen: /Wieder öffnen/.test(t) };
      });
      pruefe('Vormonat abschliessen → „Abgeschlossen", „Wieder öffnen …" steht da', ab.zu && ab.oeffnen, JSON.stringify(ab));
      const nach = await p.evaluate(async () => {
        const ws = (ms) => new Promise(r => setTimeout(r, ms));
        const z = document.querySelector('#zkListe [data-zk]'); if (!z) return { fehlt: true };
        z.click(); await ws(600);
        const uhr = document.querySelector('[data-zkfeld="uhr"]'), grund = document.querySelector('[data-zkfeld="grund"]'), los = document.querySelector('[data-zknach]');
        if (!uhr || !los) return { keinFormular: true };
        uhr.value = '17:00'; grund.value = 'Ausstempeln vergessen, Test';
        const tm = document.getElementById('toast'), gesehen = [];
        const mo = new MutationObserver(() => gesehen.push(tm.textContent)); mo.observe(tm, { childList: true, subtree: true, characterData: true });
        los.click(); await ws(1200); mo.disconnect();
        return { meldung: gesehen.join(' | ') };
      });
      pruefe('… danach ist Nachtragen in diesem Monat gesperrt („abgeschlossen")', /abgeschlossen/.test(nach.meldung || ''), JSON.stringify(nach));
    }
    pruefe(rolle + ' ' + w + ' px: ohne Skriptfehler (Konto)', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 10. DATEV (LODAS) (Runde 210) ──');
  {
    const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    p._fehler = []; p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3200);
    await zuVerwaltungZeiten(p);
    const vor = await p.evaluate(async (SRC) => {
      const T = eval('(' + SRC + ')');
      const ws = (ms) => new Promise(r => setTimeout(r, ms));
      window.confirm = () => true;
      document.querySelector('[data-zkansicht="konto"]').click(); await ws(2000);
      document.getElementById('zkPrev').click(); await ws(2000);
      document.querySelector('[data-zkexport="datev"]').click(); await ws(500);
      const f = document.getElementById('zkDatev');
      const offen = !!f && f.open;
      const sum = f.querySelector('summary'); sum.scrollIntoView({ block: 'center' });
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const sm = T(sum);
      dvBerater.value = '28547'; dvMandant.value = '90909'; dvLohnart.value = '200'; dvUrlaub.checked = true;
      const felder = [...document.querySelectorAll('[data-dvpnr]')];
      felder.forEach((x, i) => { x.value = String(10 + i); });
      document.querySelector('[data-zkdatevsichern]').click(); await ws(800);
      return { offen, sm, personen: felder.length };
    }, TREFFER.toString());
    pruefe('ohne Nummern: DATEV öffnet die Einstellungen statt einer leeren Datei', vor.offen);
    pruefe('„DATEV-Einstellungen" trifft ≥ 44 hoch', vor.sm.h >= 44, JSON.stringify(vor.sm));
    const [dl] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => document.querySelector('[data-zkexport="datev"]').click())]);
    const roh = require('fs').readFileSync(await dl.path());
    const txt = roh.toString('latin1');
    const zeilen = txt.split('\r\n');
    pruefe('Dateiname DATEV-LODAS-JJJJ-MM.txt', /^DATEV-LODAS-\d{4}-\d{2}\.txt$/.test(dl.suggestedFilename()), dl.suggestedFilename());
    pruefe('nur ASCII (ANSI ohne Kodierungsfrage)', [...roh].every(c => c >= 0x20 && c < 0x7f || c === 0x0d || c === 0x0a));
    pruefe('Zeilenende nur CR/LF (kein einzelnes LF)', !/[^\r]\n/.test(txt) && txt.endsWith('\r\n'));
    pruefe('Kopf: [Allgemein], Ziel=LODAS, Berater- und Mandantennummer', zeilen[0] === '[Allgemein]' && zeilen.includes('Ziel=LODAS') && zeilen.includes('BeraterNr=28547') && zeilen.includes('MandantenNr=90909'));
    pruefe('Satzbeschreibung u_lod_bwd_buchung_standard', zeilen.includes('1;u_lod_bwd_buchung_standard;abrechnung_zeitraum#bwd;bs_wert_butab#bwd;bs_nr#bwd;la_eigene#bwd;pnr#bwd;'));
    const bew = zeilen.slice(zeilen.indexOf('[Bewegungsdaten]') + 1).filter(Boolean);
    pruefe('Bewegungsdaten: Stunden je Person, Schlüssel 01, Lohnart 200', bew.length > 0 && bew.every(z => /^1;01\.\d{2}\.\d{4};\d+,\d{2};(01;200|71;);\d+;$/.test(z)), bew.slice(0, 3).join(' | '));
    pruefe('ein Monat je Datei (alle Zeilen derselbe Zeitraum)', new Set(bew.map(z => z.split(';')[1])).size === 1);
    pruefe('keine Namen in der Datei', !/[A-Za-z]{3,}/.test(bew.join('')));
    pruefe('ohne Skriptfehler (DATEV)', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 11. Soll je Wochentag, Feiertage; nur die Geschäftsführung korrigiert (Runde 215) ──');
  {
    /* Das erwartete Soll unabhängig von der App: Mo–Fr 8 h, Sa 4 h, So 0,
       vom Monatsersten bis heute, Feiertage aus schichtplaner.js. */
    const SP = require(require('path').join(__dirname, '..', 'schichtplaner.js'));
    const heute = new Date(), j = heute.getFullYear(), mo = heute.getMonth();
    const ft = SP.feiertageNRW(j);
    let erwartet = 0;
    for (let d = new Date(j, mo, 1, 12); d.getDate() <= heute.getDate() && d.getMonth() === mo; d.setDate(d.getDate() + 1)) {
      const key = d.toLocaleDateString('sv-SE'), w = d.getDay();
      if (ft[key]) continue;
      erwartet += (w >= 1 && w <= 5) ? 480 : (w === 6 ? 240 : 0);
    }
    const soll = Math.floor(erwartet / 60) + ':' + ('0' + (erwartet % 60)).slice(-2);
    for (const [w, h] of [[1440, 900], [320, 568]]) {
      const p = await oeffne(b, 'chef', w, h);
      await zuVerwaltungZeiten(p);
      const r = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const ws = (ms) => new Promise(r => setTimeout(r, ms));
        document.querySelector('[data-zkansicht="konto"]').click(); await ws(2500);
        const box = document.getElementById('zkRegeln'); box.open = true; await ws(200);
        const uid = document.querySelector('[data-rguid]').getAttribute('data-rguid');
        const masse = [];
        for (const el of [...box.querySelectorAll('[data-rguid="' + uid + '"], summary, [data-zkregelnsichern]')]) {
          el.scrollIntoView({ block: 'center' }); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const m = T(el); if (m.w < 44 || m.h < 44) masse.push((el.dataset.rgtag || el.textContent.trim()).slice(0, 14) + ' ' + m.w + '×' + m.h);
        }
        for (let t = 1; t <= 7; t++) document.querySelector('[data-rguid="' + uid + '"][data-rgtag="' + t + '"]').value = t <= 5 ? '8' : (t === 6 ? '4' : '');
        document.querySelector('[data-zkregelnsichern]').click(); await ws(2500);
        const zeile = [...document.querySelectorAll('#zkKonto tbody tr')][0];
        return { zu: masse, soll: zeile.children[2].textContent, markiert: /Soll je Wochentag/.test(zeile.children[0].textContent),
                 quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      pruefe(w + ' px: Soll je Wochentag (Mo–Fr 8, Sa 4) ergibt ' + soll + ' bis heute, Feiertage 0', r.soll === soll && r.markiert, JSON.stringify(r));
      pruefe(w + ' px: die sieben Felder, die Klappzeile und „Soll speichern" treffen ≥ 44', !r.zu.length, r.zu.join(', '));
      pruefe(w + ' px: nichts ragt hinaus', r.quer <= 0, r.quer);
      pruefe(w + ' px: ohne Skriptfehler (Soll)', !p._fehler.length, p._fehler.join(' | '));
      await p.close();
    }
    const p = await oeffne(b, 'leiter', 1280, 800);
    await zuVerwaltungZeiten(p);
    const l = await p.evaluate(async () => {
      const ws = (ms) => new Promise(r => setTimeout(r, ms));
      const z = document.querySelector('#zkListe [data-zk]'); if (!z) return { keineZeile: true };
      z.click(); await ws(600);
      return { nachtragen: !!document.querySelector('[data-zknach]'), ungueltig: !!document.querySelector('[data-zkweg]'),
               hinweis: [...document.querySelectorAll('#zkDetail .hint, .zk-inline .hint')].map(x => x.textContent).join(' | ') };
    });
    pruefe('Studioleitung: kein „Nachtragen", kein „Ungültig …" mehr („nur führung")', !l.nachtragen && !l.ungueltig && /Geschäftsführung/.test(l.hinweis), JSON.stringify(l));
    pruefe('ohne Skriptfehler (Leitung)', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Zeiten in der Verwaltung: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Zeiten in der Verwaltung: Anträge, Konto, Abschluss, Export, DATEV, Soll je Wochentag — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
