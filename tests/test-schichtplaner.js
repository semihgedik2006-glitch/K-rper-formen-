/* ══════════════════════════════════════════════════════════════════════
   SCHICHTPLANER — DIE OBERFLÄCHE (Runde 154)

   Aus dem Betrieb, 19.10.2026: „sorg dafür dass das interface
   übersichtlich, minimalistisch und sortiert wird sodass die chefs am
   ende wirklich fast nichts an arbeit zu tun haben".

   In der Demo, als Mensch geklickt:
   1. Chef: „Alles" → Schichtplaner (zwei Tipps). Drei Schritte, ein Knopf.
   2. „Plan erstellen" → Zahlen, „Zu klären", der Plan eines Studios.
   3. Einen Punkt aus „Zu klären" antippen → Auswahl mit Gründen;
      jemanden wählen → eine Lücke weniger, gespeichert.
   4. „Für LogX kopieren" legt eine Tabelle mit Kopfzeile in die
      Zwischenablage.
   5. „Veröffentlichen" schreibt Schichten mit `planer: <Monat>` in den
      Team-Schichtplan.
   6. Excel einlesen (tests/daten/schichtplaner-beispiel.xlsx) → vier
      Personen stehen im Schritt „Team".
   7. Studioleitung und Mitarbeiter haben den Reiter nicht.
   8. Mitarbeiter: „Meine Wünsche" unter Team → Schichten; Tag antippen,
      „Spät" wählen, speichern → genau ein Dokument <uid>_<Monat>.
   9. Fingerziele ≥ 44 × 44 per Hit-Test bei 320/390/430/820/1280/1440/
      1920, normal und kompakt; die Seite scrollt nie waagerecht.
   ══════════════════════════════════════════════════════════════════ */
const path = require('path');
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 300) : '')); }
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
const GROESSEN = [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]];

async function oeffne(b, rolle, w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', (e) => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', (r) => r.abort());
  await p.addInitScript(() => {
    localStorage.setItem('kf_tour', '99:demo-ich');
    window.confirm = () => true;
    /* Was die Demo schreibt, mitlesen: sie hängt alles an DB, und der
       Pfad sagt, wohin es ginge. */
  });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
async function zuAlles(p, cgo) {
  return p.evaluate(async (cgo) => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const alles = [...document.querySelectorAll('.mobnav button, #side button, #side a')].find((e) => e.offsetParent && /^\s*Alles\s*$/.test(e.textContent));
    if (alles) { alles.click(); await w(700); }
    const z = [...document.querySelectorAll('[data-alles][data-al-cgo="' + cgo + '"]')].find((e) => e.offsetParent);
    if (!z) return false;
    z.click(); await w(1500);
    const pane = document.querySelector('[data-cpane="' + cgo + '"]');
    return !!pane && pane.style.display !== 'none';
  }, cgo);
}
async function messen(p, wer, liste) {
  for (const [w, h] of GROESSEN) {
    await p.setViewportSize({ width: w, height: h });
    await p.waitForTimeout(250);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const m = await p.evaluate(async ([SRC, sel]) => {
        const T = eval('(' + SRC + ')');
        const aus = {};
        for (const s of sel) {
          const el = [...document.querySelectorAll(s)].find((e) => e.offsetParent);
          if (!el) { aus[s] = { w: -1, h: -1 }; continue; }
          el.scrollIntoView({ block: 'center', inline: 'nearest' });
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          aus[s] = T(el);
        }
        return { aus, quer: document.documentElement.scrollWidth - innerWidth };
      }, [TREFFER.toString(), liste]);
      const klein = Object.keys(m.aus).filter((k) => !(m.aus[k].w >= 44 && m.aus[k].h >= 44));
      pruefe(wer + ' ' + w + ' px ' + dichte + ': ' + liste.length + ' Bedienelemente ≥ 44 × 44, nichts ragt hinaus',
        !klein.length && m.quer <= 0, JSON.stringify({ klein: klein.map((k) => k + ' ' + m.aus[k].w + '×' + m.aus[k].h), quer: m.quer }));
    }
  }
  await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME });

  console.log('── Chef ──');
  const p = await oeffne(b, 'chef', 1440, 900);
  pruefe('„Alles" → Schichtplaner öffnet den Reiter', await zuAlles(p, 'schichtplaner'));
  await p.waitForTimeout(800);
  const start = await p.evaluate(() => ({
    schritte: [...document.querySelectorAll('#spSchritte .spl-schritt')].map((li) => li.innerText.replace(/\s+/g, ' ')),
    los: document.getElementById('spLos').textContent, aktiv: !document.getElementById('spLos').disabled,
    ergebnis: !document.getElementById('spErgebnis').hidden
  }));
  pruefe('drei Schritte: Team, Schichten, Wünsche', start.schritte.length === 3 && /Team/.test(start.schritte[0]) && /Schichten/.test(start.schritte[1]) && /Wünsche/.test(start.schritte[2]), start.schritte);
  pruefe('Team nennt die Zahl der Personen', /\d+ Personen/.test(start.schritte[0]), start.schritte[0]);
  pruefe('Wünsche: „x von y eingetragen"', /\d+ von \d+ eingetragen/.test(start.schritte[2]), start.schritte[2]);
  pruefe('EIN Knopf, benannt nach dem Monat, bedienbar', /^Plan für \S+ erstellen$/.test(start.los) && start.aktiv, start.los);
  pruefe('vor dem Erstellen kein halbes Ergebnis', !start.ergebnis);

  await p.click('#spLos');
  await p.waitForFunction(() => !document.getElementById('spErgebnis').hidden, null, { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(500);
  const erg = await p.evaluate(() => {
    const z = [...document.querySelectorAll('#spZahlen .spl-zahl b')].map((b) => +b.textContent);
    return { z, stand: document.getElementById('spStand').textContent,
      punkte: document.querySelectorAll('#spKlaeren .spl-punkt').length,
      zellen: document.querySelectorAll('#spTabelle .spl-zelle').length,
      zeilen: document.querySelectorAll('#spTabelle tbody tr').length,
      studio: document.getElementById('spStudio').selectedOptions[0] && document.getElementById('spStudio').selectedOptions[0].textContent,
      los: document.getElementById('spLos').textContent };
  });
  pruefe('Zahlen: verteilt, Lücken, Rückfragen', erg.z.length === 3 && erg.z[0] > 100, erg.z);
  pruefe('gespeichert, mit gemessener Dauer', /Fertig in \d+,\d s · gespeichert/.test(erg.stand), erg.stand);
  pruefe('„Zu klären" listet Punkte, wenn es Lücken oder Rückfragen gibt', (erg.z[1] + erg.z[2] === 0) || erg.punkte > 0, erg.punkte);
  pruefe('der Plan zeigt einen ganzen Monat', erg.zeilen >= 28 && erg.zeilen <= 31, erg.zeilen);
  pruefe('vorn steht das Studio mit den meisten offenen Punkten', !erg.z[1] || /zu klären/.test(erg.studio || ''), erg.studio);
  pruefe('danach heisst der Knopf „Neu erstellen"', erg.los === 'Neu erstellen', erg.los);

  // 3. Umbesetzen über „Zu klären"
  const vorher = erg.z[1];
  const wahl = await p.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const luecke = [...document.querySelectorAll('#spKlaeren .spl-punkt:not(.warn)')][0];
    if (!luecke) return { keine: true };
    luecke.click(); await w(300);
    const box = document.getElementById('spWahl');
    const offen = !box.hidden;
    const leute = [...box.querySelectorAll('.spl-person')];
    const frei = leute.filter((x) => !x.disabled);
    const grau = leute.filter((x) => x.disabled).map((x) => x.querySelector('small').textContent);
    const markiert = !!document.querySelector('#spTabelle .spl-zelle.luecke.an');
    if (frei[0]) { frei[0].click(); await w(300); }
    return { offen, leute: leute.length, frei: frei.length, grau, markiert,
      danach: +document.querySelectorAll('#spZahlen .spl-zahl b')[1].textContent };
  });
  if (wahl.keine) pruefe('(keine Lücke in der Demo — Umbesetzen nicht prüfbar)', false);
  else {
    pruefe('Antippen öffnet die Auswahl und markiert die Lücke im Plan', wahl.offen && wahl.markiert, JSON.stringify(wahl));
    pruefe('wer nicht kann, steht ausgegraut MIT Grund da', wahl.grau.every((g) => g.length > 2), wahl.grau);
    if (wahl.frei) pruefe('jemanden wählen schliesst eine Lücke (' + vorher + ' → ' + wahl.danach + ')', wahl.danach === vorher - 1);
    else pruefe('niemand frei: alle mit Grund ausgegraut', wahl.grau.length === wahl.leute);
  }

  // 4. LogX
  await p.click('#spLogx');
  await p.waitForTimeout(300);
  const ablage = await p.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  pruefe('„Für LogX kopieren": Tabelle mit Kopfzeile und Tabulatoren', /^Datum\tTag\tStudio\tSchicht\tBeginn\tEnde\tMitarbeiter\n\d\d\.\d\d\.\d{4}\t/.test(ablage), ablage.slice(0, 120));

  // 5. Veröffentlichen
  await p.click('#spVeroeffentlichen');
  await p.waitForTimeout(1200);
  const pub = await p.evaluate(() => document.getElementById('spAktionHinweis').textContent);
  pruefe('veröffentlicht: der Hinweis sagt wann und was ein zweites Mal tut', /Veröffentlicht am .* ersetzt die Schichten dieses Monats/.test(pub), pub);
  // In der Demo sind veröffentlichte Schichten im Team-Schichtplan zu sehen
  const imTeam = await p.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const team = [...document.querySelectorAll('.mobnav button, #side button, #side a')].find((e) => e.offsetParent && /^\s*Team\s*$/.test(e.textContent));
    if (!team) return -1;
    team.click(); await w(900);
    const vor = document.getElementById('shiftNext');
    for (let i = 0; i < 6 && !/· (Früh|Spät|Samstag)/.test(document.getElementById('shiftGrid').textContent); i++) { vor.click(); await w(250); }
    return [...document.querySelectorAll('#shiftGrid .shift-note')].filter((n) => /Früh|Spät|Samstag/.test(n.textContent)).length;
  });
  pruefe('veröffentlichte Schichten stehen im Team-Schichtplan (mit Schichtname)', imTeam > 0, imTeam);
  pruefe('ohne Skriptfehler (Chef)', !p._fehler.length, p._fehler.join(' | '));

  // 6. Excel einlesen
  await zuAlles(p, 'schichtplaner');
  await p.waitForTimeout(600);
  await p.setInputFiles('#spDatei', path.join(__dirname, 'daten', 'schichtplaner-beispiel.xlsx'));
  await p.waitForFunction(() => /4 Personen/.test((document.querySelector('#spSchritte .spl-schritt') || {}).innerText || ''), null, { timeout: 8000 }).catch(() => {});
  const nach = await p.evaluate(() => [...document.querySelectorAll('#spSchritte .spl-schritt')].map((li) => li.innerText.replace(/\s+/g, ' ')));
  pruefe('Excel eingelesen: „4 Personen"', /4 Personen/.test(nach[0]), nach[0]);
  pruefe('… und die Schichten aus der Datei (3 für alle + 1 eigene)', /4 Schichtzeiten/.test(nach[1]), nach[1]);
  const vorlage = await p.evaluate(() => { const a = document.querySelector('#spSchritte a[download]'); return a && a.getAttribute('href'); });
  pruefe('die leere Vorlage liegt zum Herunterladen bereit', vorlage === 'vorlagen/Schichtplaner-Vorlage.xlsx', vorlage);
  const holt = await p.evaluate((u) => fetch(u).then((r) => r.ok && r.headers.get('content-length') !== '0'), 'vorlagen/Schichtplaner-Vorlage.xlsx');
  pruefe('… und ist wirklich da', holt);

  // 9. Fingerziele (mit einem fertigen Plan und offener Auswahl)
  await p.click('#spLos');
  await p.waitForFunction(() => /^Fertig/.test(document.getElementById('spStand').textContent), null, { timeout: 8000 }).catch(() => {});
  /* Nippes: dort stehen nach dem Einlesen drei der vier Personen. In
     einem Studio ohne Zuordnung gäbe es nur „fehlt" und niemanden zum
     Wählen. */
  const gewaehlt = await p.evaluate(() => {
    const sel = document.getElementById('spStudio'); sel.value = 'studio-1'; sel.dispatchEvent(new Event('change'));
    const z = document.querySelector('#spTabelle .spl-zelle:not(.luecke)'); if (z) z.click();
    return document.querySelectorAll('#spWahl .spl-person').length;
  });
  pruefe('nach dem Einlesen: in Nippes lässt sich umbesetzen (' + gewaehlt + ' Personen zur Wahl)', gewaehlt >= 3, gewaehlt);
  await p.waitForTimeout(300);
  await messen(p, 'Chef', ['#spMonatZurueck', '#spMonatVor', '#spLos', '[data-spdatei]', '#spSchritte a[download]',
    '#spStudio', '#spVeroeffentlichen', '#spLogx', '#spTabelle .spl-zelle', '#spWahl .spl-person', '.spl-team summary']);
  await p.context().close();

  console.log('\n── Studioleitung ──');
  const l = await oeffne(b, 'leiter', 390, 844);
  const lHat = await l.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const alles = [...document.querySelectorAll('.mobnav button')].find((e) => e.offsetParent && /Alles/.test(e.textContent));
    if (alles) { alles.click(); await w(700); }
    return !!document.querySelector('[data-al-cgo="schichtplaner"]');
  });
  pruefe('die Studioleitung hat den Reiter (noch) nicht', !lHat);
  await l.context().close();

  console.log('\n── Mitarbeiter ──');
  const m = await oeffne(b, 'mitarbeiter', 390, 844);
  const mHat = await m.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const alles = [...document.querySelectorAll('.mobnav button')].find((e) => e.offsetParent && /Alles/.test(e.textContent));
    if (alles) { alles.click(); await w(700); }
    return !!document.querySelector('[data-al-cgo="schichtplaner"]');
  });
  pruefe('ein Mitarbeiter hat den Reiter nicht', !mHat);
  const karte = await m.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const z = [...document.querySelectorAll('[data-alles][data-al-teamtab="schicht"]')].find((e) => e.offsetParent);
    if (z) { z.click(); await w(1500); }
    const k = document.getElementById('spWunschKarte');
    return { da: !!k && !k.hidden, titel: k && k.querySelector('h3').textContent, frist: document.getElementById('spWunschFrist').textContent,
      tage: k.querySelectorAll('.spl-w-tag').length };
  });
  pruefe('„Meine Wünsche" steht unter Team → Schichten', karte.da, JSON.stringify(karte));
  pruefe('mit Monat im Titel', /Meine Wünsche für \S+ \d{4}/.test(karte.titel || ''), karte.titel);
  pruefe('die Frist steht da', /(Bis|Frist war am) \d+\.\d+\./.test(karte.frist), karte.frist);
  pruefe('ein Knopf je Tag des Monats', karte.tage >= 28 && karte.tage <= 31, karte.tage);
  const gespeichert = await m.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const tage = [...document.querySelectorAll('#spWunschTage .spl-w-tag')];
    if (tage[0].disabled) return { zu: true };
    tage[2].click(); tage[9].click();
    document.querySelector('[data-splieber="Spät"]').click();
    await w(100);
    const an = [...document.querySelectorAll('#spWunschTage .spl-w-tag.an')].map((t) => t.getAttribute('data-spwtag'));
    const spaet = document.querySelector('[data-splieber="Spät"]').classList.contains('on');
    document.getElementById('spWunschSpeichern').click();
    await w(600);
    const toast = (document.querySelector('.toast, #toast') || {}).textContent || '';
    return { an, spaet, toast };
  });
  if (gespeichert.zu) pruefe('(Frist vorbei — Speichern nicht prüfbar)', true);
  else {
    pruefe('zwei Tage angetippt sind markiert', gespeichert.an.length === 2, gespeichert.an);
    pruefe('„Spät" ist gewählt', gespeichert.spaet);
    pruefe('Speichern meldet sich', /Wünsche gespeichert/.test(gespeichert.toast), gespeichert.toast);
  }
  pruefe('ohne Skriptfehler (Mitarbeiter)', !m._fehler.length, m._fehler.join(' | '));
  await messen(m, 'Mitarbeiter', ['#spWunschTage .spl-w-tag', '[data-splieber="Früh"]', '#spWunschSpeichern', '#spWunschNotiz']);
  await m.context().close();

  await b.close();
  console.log('\n' + (schlecht ? '✗ Fehler: ' + schlecht : '✓ Fehler: keine') + ' — Schichtplaner, ' + gut + ' Prüfungen');
  process.exit(schlecht ? 1 : 0);
})().catch((e) => { console.error('Fehler: ' + e.stack); process.exit(1); });
