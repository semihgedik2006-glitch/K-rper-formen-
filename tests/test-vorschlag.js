/* ══ APP GESTALTEN: VORSCHLÄGE DER LEITUNG (Runde 294) ═══════════════
   Aus dem Betrieb, 26.10.2026: „es soll jeder nur für sein eigenes gerät
   anpassen können und leitungen können es für mitarbeiter einstellen
   wenn sie es wollen aber nicht sofort automatisch".

   Geprüft wird:
    1. Mitarbeiter (1440 px): ein Design mit `angebot:true` steht auf
       „Heute" als Zeile „Vorschlag: …" – die App bleibt dabei, wie sie
       war. Ein Design ohne `angebot` erscheint dort nicht.
    2. Ein Tipp öffnet „App gestalten" mit dem Vorschlag im Entwurf und
       der Leiste „Vorschlag von …". Die App ändert sich nicht.
       „Verwerfen" schliesst ohne Rückfrage, der Vorschlag bleibt.
    3. „Übernehmen" stellt ihn ein (Putzplan zuerst) und nimmt ihn von
       „Heute"; die Entscheidung steht in kf_prefs.angebote.
    4. „Nein danke" blendet ihn aus, die App bleibt; unter „Vom Team"
       steht er weiter, mit der Marke „Vorschlag der Leitung".
    5. „Nein danke" und „Übernehmen": Trefferfläche ≥ 44 × 44 bei 320 /
       390 / 430 / 820 / 1280 / 1440 / 1920, normal und kompakt.
       Der Block steht auf jeder Breite sichtbar vorn – unter „Ausserdem"
       führte sein Verweis nicht zum Vorschlag.
    6. Leitung: „An Mitarbeiter geben" öffnet die Auswahl (Vorschlagen /
       Sofort festlegen, Studios). Die Studioleitung sieht nur ihre eigenen
       Studios, kein „Alle Studios". Geschrieben wird genau ein Design mit
       angebot, art und studios; Mitarbeiter sehen den Knopf nicht. Die
       Leitung bekommt selbst keine Zeile auf „Heute".
    7. Runde 303, aus dem Betrieb, 5.11.2026: „Studio leitung soll nur für
       ihre eigenen studios machen können, Leitung soll es sofort festlegen
       können ohne vorschlag". Mitarbeiter (Studio 6): ein Vorschlag für
       Studio 7 erscheint nicht, einer für Studio 6 schon. Eine Festlegung
       für Studio 6 gilt sofort beim Öffnen (Putzplan zuerst, ohne
       Rückfrage), einmal; kommt sie mitten in der Arbeit, bleibt die
       Seite, wo man ist – wer danach selbst ändert, behält
       es beim nächsten Öffnen. Eine Festlegung für Studio 7 gilt nicht.
    8. Runde 304, aus dem Betrieb, 5.11.2026, auf „Sperre für festgelegte
       Layouts" und „Rückmeldung für die Leitung": „okay mach das alles".
       Gesperrt: Leiste und Startseite bleiben die der Leitung – auch nach
       „Nutzen", nach „Übernehmen" und nach dem Neuladen mit verstelltem
       Gerät; Aussehen bleibt frei. „Nicht mehr teilen" hebt die Sperre auf.
       Leitung: „Gesperrt" gibt es nur bei „Sofort festlegen".
    9. Rückmeldung: übernommen / abgelehnt / eingestellt / selbst geändert
       wird je Person unter designs/<id>/antworten/<uid> geschrieben. Die
       Leitung sieht beim eigenen Angebot „1 übernommen · …" und mit „Wer?"
       die Namen (Hit-Test bei allen Breiten); fremde Angebote zeigen
       nichts. Entfernen nimmt die Rückmeldungen mit.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const SP = __dirname;

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
const TEAM = [
  { id: 'v1', uid: 'u3', von: 'Ben Kraus', name: 'Empfang einfach', ts: 5, angebot: true,
    aufbau: { leiste: ['v-putzplan', 'v-todos', 'v-chat'], start: 'home' }, prefs: { theme: 'light' } },
  { id: 't1', uid: 'u2', von: 'Anna Meier', name: 'Nur geteilt', ts: 4,
    aufbau: { leiste: ['v-chat', 'v-todos'], start: 'home' }, prefs: {} }
];
async function oeffne(b, w, h, stub, extra, team, glob) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    w <= 820 ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = []; p._dialoge = 0;
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  p.on('dialog', d => { p._dialoge++; d.accept(); });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await ctx.addInitScript(([T, X, G]) => {
    try {
      localStorage.setItem('kf_tour', '1:testuid'); localStorage.setItem('kf_formi_gruss', new Date().toDateString());
      if (X) localStorage.setItem('kf_prefs', JSON.stringify(X));
    } catch (e) {}
    window.__designs = T;
    if (G) Object.assign(window, G);
  }, [team || TEAM, extra || null, glob || null]);
  await ctx.addInitScript({ path: SP + '/' + stub });
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(1100);
  p._ctx = ctx;
  return p;
}
const zeile = (p) => p.evaluate(() => {
  const z = [...document.querySelectorAll('#heuteListe [data-hangebot]')].find(e => e.getClientRects().length);
  return z ? { id: z.getAttribute('data-hangebot'), text: z.textContent.replace(/\s+/g, ' ').trim() } : null;
});
const appLeiste = (p) => p.evaluate(() => [...document.querySelectorAll('#side > [data-group]')].filter(e => e.getClientRects().length).map(e => e.textContent.trim()));
const tafelOffen = (p) => p.evaluate(() => !document.getElementById('aufbauTafel').hidden);
const antworten = (p) => p.evaluate(() => (window.__schreib || []).filter(x => /^designs\/[^/]+\/antworten\//.test(x.pfad)).map(x => ({ pfad: x.pfad, art: x.art, daten: x.daten })));
const oeffneTafel = async (p) => {
  await p.click('#bereichKopf'); await p.waitForTimeout(350);
  await p.evaluate(() => [...document.querySelectorAll('#allesLade [data-al-aufbau]')].find(e => e.getClientRects().length).click());
  await p.waitForTimeout(500);
};
const tippeZeile = (p) => p.evaluate(() => [...document.querySelectorAll('#heuteListe [data-hangebot]')].find(e => e.getClientRects().length).click());

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    console.log('\n── 1–3 Mitarbeiter am Rechner: sehen, ansehen, übernehmen ──');
    let p = await oeffne(b, 1440, 900, 'stub-mitarbeiter.js');
    const vorher = await appLeiste(p);
    let z = await zeile(p);
    pruefe('auf „Heute" steht „„Empfang einfach" ansehen" von Ben Kraus', !!z && /„Empfang einfach" ansehen/.test(z.text) && /Ben Kraus/.test(z.text), JSON.stringify(z));
    const erster = await p.evaluate(() => { const k = document.querySelector('#heuteListe .heute-block'); return k ? k.getAttribute('data-btitel') : ''; });
    pruefe('… als eigener Block „Vorschlag der Leitung" ganz vorn', erster === 'Vorschlag der Leitung', erster);
    pruefe('nur der Vorschlag, nicht das bloss geteilte Design', !!z && z.id === 'v1' &&
      !(await p.evaluate(() => /Nur geteilt/.test(document.getElementById('heuteListe').textContent))));
    pruefe('die App ist dabei unverändert (nichts automatisch)', JSON.stringify(await appLeiste(p)) === JSON.stringify(vorher) && vorher[0] !== 'Putzplan', vorher.join('|'));
    await tippeZeile(p); await p.waitForTimeout(500);
    const t = await p.evaluate(() => {
      const a = document.getElementById('abAngebot');
      return { offen: !document.getElementById('aufbauTafel').hidden, sichtbar: !!a && !a.hidden && a.getClientRects().length > 0,
        text: a ? a.textContent.replace(/\s+/g, ' ') : '',
        entwurf: [...document.querySelectorAll('#abInhalt .ab-leiste [data-abzieh]')].map(e => e.textContent.trim()),
        ueb: !document.getElementById('abUebernehmen').disabled };
    });
    pruefe('ein Tipp öffnet „App gestalten"', t.offen);
    pruefe('… mit „Vorschlag von Ben Kraus: „Empfang einfach""', t.sichtbar && /Vorschlag von Ben Kraus: „Empfang einfach"/.test(t.text), t.text);
    pruefe('… und sagt vorher: „Deine Leitung sieht, ob du es übernimmst."', /Deine Leitung sieht, ob du es übernimmst/.test(t.text), t.text);
    pruefe('… der Entwurf ist der Vorschlag (Putzplan zuerst)', /Putzplan/.test(t.entwurf[0] || ''), t.entwurf.join('|'));
    pruefe('… „Übernehmen" ist bereit', t.ueb);
    pruefe('… die App bleibt bis dahin, wie sie war', JSON.stringify(await appLeiste(p)) === JSON.stringify(vorher));
    await p.click('#abVerwerfen'); await p.waitForTimeout(400);
    pruefe('„Verwerfen" schliesst ohne Rückfrage', !(await tafelOffen(p)) && p._dialoge === 0, 'Dialoge: ' + p._dialoge);
    z = await zeile(p);
    pruefe('… und der Vorschlag steht weiter auf „Heute"', !!z);
    await tippeZeile(p); await p.waitForTimeout(500);
    await p.click('#abUebernehmen'); await p.waitForTimeout(700);
    const nach = await appLeiste(p);
    pruefe('„Übernehmen": links steht Putzplan zuerst', nach[0] === 'Putzplan', nach.join('|'));
    pruefe('… die Zeile ist von „Heute" weg', !(await zeile(p)));
    const ent = await p.evaluate(() => (JSON.parse(localStorage.getItem('kf_prefs')).angebote || {}));
    pruefe('… gemerkt als „ja" (nur auf diesem Gerät)', ent.v1 === 'ja', JSON.stringify(ent));
    const aw3 = await antworten(p);
    pruefe('… und als Rückmeldung „ja" unter designs/v1/antworten/<eigene uid> – genau uid, name, wie, ts',
      aw3.length === 1 && /^designs\/v1\/antworten\/[^/]+$/.test(aw3[0].pfad) && aw3[0].daten.wie === 'ja' &&
      Object.keys(aw3[0].daten).sort().join(',') === 'name,ts,uid,wie' && aw3[0].pfad.endsWith('/' + aw3[0].daten.uid), JSON.stringify(aw3));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();

    console.log('\n── 4 „Nein danke" ──');
    p = await oeffne(b, 1440, 900, 'stub-mitarbeiter.js');
    const vor2 = await appLeiste(p);
    await tippeZeile(p); await p.waitForTimeout(500);
    await p.click('#abAngebotNein'); await p.waitForTimeout(500);
    pruefe('„Nein danke" schliesst die Tafel', !(await tafelOffen(p)));
    pruefe('… die App bleibt, wie sie war', JSON.stringify(await appLeiste(p)) === JSON.stringify(vor2));
    pruefe('… der Vorschlag ist von „Heute" weg', !(await zeile(p)));
    const ent2 = await p.evaluate(() => (JSON.parse(localStorage.getItem('kf_prefs')).angebote || {}));
    pruefe('… gemerkt als „nein"', ent2.v1 === 'nein', JSON.stringify(ent2));
    const aw4 = await antworten(p);
    pruefe('… und als Rückmeldung „nein"', aw4.length === 1 && aw4[0].daten.wie === 'nein', JSON.stringify(aw4));
    await p.click('#bereichKopf'); await p.waitForTimeout(350);
    await p.evaluate(() => [...document.querySelectorAll('#allesLade [data-al-aufbau]')].find(e => e.getClientRects().length).click());
    await p.waitForTimeout(500);
    const team = await p.evaluate(() => [...document.querySelectorAll('#abInhalt .ab-design')].map(e => e.textContent.replace(/\s+/g, ' ')));
    pruefe('unter „Vom Team" steht er weiter, mit „Vorschlag der Leitung"', team.some(t => /Empfang einfach/.test(t) && /Vorschlag der Leitung/.test(t)), team.join(' / '));
    pruefe('… das bloss geteilte trägt die Marke nicht', team.some(t => /Nur geteilt/.test(t) && !/Vorschlag der Leitung/.test(t)));
    pruefe('Mitarbeiter sehen „Mitarbeitern vorschlagen" nicht', !(await p.evaluate(() => !!document.querySelector('[data-abanbieten]'))));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();

    console.log('\n── 5 Trefferflächen (Hit-Test), normal und kompakt ──');
    for (const dichte of ['normal', 'kompakt']) {
      for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
        p = await oeffne(b, w, h, 'stub-mitarbeiter.js', { dichte });
        const zm = await p.evaluate((T) => {
          const f = new Function('return ' + T)();
          const z = [...document.querySelectorAll('#heuteListe [data-hangebot]')].find(e => e.getClientRects().length);
          return z ? f(z) : null;
        }, TREFFER.toString());
        pruefe(w + ' ' + dichte + ': die Vorschlags-Zeile ist sichtbar und trifft ' + (zm ? zm.w + '×' + zm.h : '–'), !!zm && zm.w >= 44 && zm.h >= 44, JSON.stringify(zm));
        if (!zm) { await p._ctx.close(); continue; }
        await tippeZeile(p); await p.waitForTimeout(450);
        const m = await p.evaluate((T) => {
          const f = new Function('return ' + T)();
          const nein = document.getElementById('abAngebotNein'), ueb = document.getElementById('abUebernehmen');
          const r = nein.getBoundingClientRect();
          return { nein: f(nein), ueb: f(ueb), drin: r.left >= 0 && r.right <= innerWidth + 0.5 && r.top >= 0 && r.bottom <= innerHeight,
            quer: document.documentElement.scrollWidth > innerWidth + 1 };
        }, TREFFER.toString());
        pruefe(w + ' ' + dichte + ': „Nein danke" ' + m.nein.w + '×' + m.nein.h + ', „Übernehmen" ' + m.ueb.w + '×' + m.ueb.h + ', im Bild, kein Querscrollen',
          m.nein.w >= 44 && m.nein.h >= 44 && m.ueb.w >= 44 && m.ueb.h >= 44 && m.drin && !m.quer, JSON.stringify(m));
        await p._ctx.close();
      }
    }

    console.log('\n── 6 Leitung: an Mitarbeiter geben ──');
    p = await oeffne(b, 1440, 900, 'stub-leiter.js', { designs: [{ id: 'dL', name: 'Frühschicht', ts: 1,
      aufbau: { leiste: ['v-putzplan', 'v-todos'], start: 'home' }, prefs: { theme: 'light' } }] });
    pruefe('die Leitung bekommt selbst keine Vorschlags-Zeile', !(await zeile(p)));
    await p.click('#bereichKopf'); await p.waitForTimeout(350);
    await p.evaluate(() => [...document.querySelectorAll('#allesLade [data-al-aufbau]')].find(e => e.getClientRects().length).click());
    await p.waitForTimeout(500);
    const kn = await p.evaluate((T) => {
      const f = new Function('return ' + T)();
      const k = document.querySelector('[data-abanbieten="dL"]'); if (!k) return null;
      k.scrollIntoView({ block: 'center' });
      return Object.assign(f(k), { text: k.textContent.trim() });
    }, TREFFER.toString());
    pruefe('„An Mitarbeiter geben" steht am eigenen Design, ≥ 44 × 44', !!kn && kn.text === 'An Mitarbeiter geben' && kn.w >= 44 && kn.h >= 44, JSON.stringify(kn));
    await p.evaluate(() => { window.__schreib = []; document.querySelector('[data-abanbieten="dL"]').click(); });
    await p.waitForTimeout(400);
    const wahl = await p.evaluate((T) => {
      const f = new Function('return ' + T)();
      const box = document.querySelector('#abInhalt .ab-fuer'); if (!box) return null;
      box.scrollIntoView({ block: 'center' });
      const k = [...box.querySelectorAll('button')].map(e => ({ t: e.textContent.trim(), on: e.classList.contains('on'), m: f(e) }));
      return { k, geschrieben: (window.__schreib || []).length };
    }, TREFFER.toString());
    pruefe('ein Tipp schreibt noch nichts, sondern zeigt die Auswahl', !!wahl && wahl.geschrieben === 0, JSON.stringify(wahl && wahl.geschrieben));
    const namen = wahl ? wahl.k.map(x => x.t) : [];
    pruefe('Auswahl: Vorschlagen, Sofort festlegen, Hürth, Brühl – kein „Alle Studios"',
      ['Vorschlagen', 'Sofort festlegen', 'Hürth', 'Brühl'].every(n => namen.includes(n)) && !namen.includes('Alle Studios'), namen.join('|'));
    pruefe('… beide eigenen Studios sind vorgewählt', !!wahl && wahl.k.filter(x => x.t === 'Hürth' || x.t === 'Brühl').every(x => x.on));
    pruefe('… jeder Knopf der Auswahl trifft ≥ 44 × 44', !!wahl && wahl.k.every(x => x.m.w >= 44 && x.m.h >= 44), JSON.stringify(wahl && wahl.k.map(x => x.t + ' ' + x.m.w + '×' + x.m.h)));
    // Sofort festlegen, nur Brühl
    await p.evaluate(() => document.querySelector('#abInhalt .ab-fuer [data-abfuerart="fest"]').click()); await p.waitForTimeout(150);
    await p.evaluate(() => document.querySelector('#abInhalt .ab-fuer [data-abfuerstudio="studio-6"]').click()); await p.waitForTimeout(150);
    const knopf = await p.evaluate(() => document.querySelector('#abInhalt .ab-fuer [data-abfuersenden]').textContent.trim());
    pruefe('der Knopf heisst dann „Festlegen"', knopf === 'Festlegen', knopf);
    await p.evaluate(() => document.querySelector('#abInhalt .ab-fuer [data-abfuersenden]').click());
    await p.waitForTimeout(400);
    const geschrieben = await p.evaluate(() => (window.__schreib || []).filter(x => /designs\/\(neu\)$/.test(x.pfad)));
    const d = geschrieben[0] && geschrieben[0].daten;
    pruefe('genau ein Design: angebot:true, art:fest, studios:[studio-7]', geschrieben.length === 1 && d && d.angebot === true && d.art === 'fest' && JSON.stringify(d.studios) === '["studio-7"]', JSON.stringify(d).slice(0, 220));
    pruefe('… nur die erlaubten Felder', !!d && Object.keys(d).sort().join(',') === 'angebot,art,aufbau,name,prefs,studios,ts,uid,von', d && Object.keys(d).join(','));
    pruefe('… die Auswahl ist danach zu', !(await p.evaluate(() => !!document.querySelector('#abInhalt .ab-fuer'))));
    // Runde 304: „Gesperrt" nur bei „Sofort festlegen"
    await p.evaluate(() => { window.__schreib = []; document.querySelector('[data-abanbieten="dL"]').click(); }); await p.waitForTimeout(200);
    const sperrVorschlag = await p.evaluate(() => !!document.querySelector('#abInhalt .ab-fuer [data-abfuersperre]'));
    await p.evaluate(() => document.querySelector('#abInhalt .ab-fuer [data-abfuerart="fest"]').click()); await p.waitForTimeout(150);
    const sperrWahl = await p.evaluate(() => [...document.querySelectorAll('#abInhalt .ab-fuer [data-abfuersperre]')].map(e => e.textContent.trim() + (e.classList.contains('on') ? '*' : '')));
    pruefe('„Gesperrt" gibt es nur bei „Sofort festlegen"; vorgewählt ist „Darf geändert werden"',
      !sperrVorschlag && sperrWahl.join('|') === 'Darf geändert werden*|Gesperrt', sperrVorschlag + ' ' + sperrWahl.join('|'));
    await p.evaluate(() => document.querySelector('#abInhalt .ab-fuer [data-abfuersperre="ja"]').click()); await p.waitForTimeout(150);
    await p.evaluate(() => document.querySelector('#abInhalt .ab-fuer [data-abfuerart="vorschlag"]').click()); await p.waitForTimeout(150);
    await p.evaluate(() => document.querySelector('#abInhalt .ab-fuer [data-abfuerart="fest"]').click()); await p.waitForTimeout(150);
    const nachWechsel = await p.evaluate(() => (document.querySelector('#abInhalt .ab-fuer [data-abfuersperre="ja"]') || {}).className || '');
    pruefe('… zurück zu „Vorschlagen" nimmt „Gesperrt" wieder weg', !/\bon\b/.test(nachWechsel), nachWechsel);
    await p.evaluate(() => document.querySelector('#abInhalt .ab-fuer [data-abfuersperre="ja"]').click()); await p.waitForTimeout(150);
    await p.evaluate(() => document.querySelector('#abInhalt .ab-fuer [data-abfuersenden]').click()); await p.waitForTimeout(400);
    const gs = await p.evaluate(() => ((window.__schreib || []).filter(x => /designs\/\(neu\)$/.test(x.pfad))[0] || {}).daten);
    pruefe('„Gesperrt" schreibt sperre:true an die Festlegung', !!gs && gs.art === 'fest' && gs.sperre === true, JSON.stringify(gs).slice(0, 200));
    // Ohne Studio lässt es sich nicht senden
    await p.evaluate(() => document.querySelector('[data-abanbieten="dL"]').click()); await p.waitForTimeout(200);
    await p.evaluate(() => { document.querySelector('#abInhalt .ab-fuer [data-abfuerstudio="studio-6"]').click(); });
    await p.waitForTimeout(150);
    await p.evaluate(() => { document.querySelector('#abInhalt .ab-fuer [data-abfuerstudio="studio-7"]').click(); });
    await p.waitForTimeout(150);
    pruefe('ohne Studio ist „Vorschlagen" gesperrt', await p.evaluate(() => document.querySelector('#abInhalt .ab-fuer [data-abfuersenden]').disabled));
    await p.evaluate(() => { window.__schreib = []; document.querySelector('[data-abteilen="dL"]').click(); });
    await p.waitForTimeout(400);
    const geteilt = await p.evaluate(() => (window.__schreib || []).map(x => x.daten));
    pruefe('„Teilen" bleibt ohne angebot, art, studios', geteilt.length === 1 && !('angebot' in geteilt[0]) && !('art' in geteilt[0]) && !('studios' in geteilt[0]), JSON.stringify(geteilt).slice(0, 160));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();

    console.log('\n── 6a Auswahl: Trefferflächen, normal und kompakt ──');
    for (const dichte of ['normal', 'kompakt']) {
      for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
        p = await oeffne(b, w, h, 'stub-leiter.js', { dichte, designs: [{ id: 'dL', name: 'Frühschicht', ts: 1,
          aufbau: { leiste: ['v-putzplan', 'v-todos'], start: 'home' }, prefs: {} }] });
        await p.click('#bereichKopf'); await p.waitForTimeout(350);
        await p.evaluate(() => [...document.querySelectorAll('#allesLade [data-al-aufbau]')].find(e => e.getClientRects().length).click());
        await p.waitForTimeout(450);
        await p.evaluate(() => { const k = document.querySelector('[data-abanbieten="dL"]'); k.scrollIntoView({ block: 'center' }); k.click(); });
        await p.waitForTimeout(350);
        /* Runde 304: im Zustand „Sofort festlegen" stehen alle Knöpfe da, auch „Gesperrt". */
        await p.evaluate(() => document.querySelector('#abInhalt .ab-fuer [data-abfuerart="fest"]').click());
        await p.waitForTimeout(200);
        const m = await p.evaluate((T) => {
          const f = new Function('return ' + T)();
          const box = document.querySelector('#abInhalt .ab-fuer'); if (!box) return null;
          const knoepfe = [...box.querySelectorAll('button')];
          const r = [];
          for (const k of knoepfe) {
            k.scrollIntoView({ block: 'center' });
            const g = k.getBoundingClientRect();
            r.push({ t: k.textContent.trim(), m: f(k), drin: g.left >= 0 && g.right <= innerWidth + 0.5 });
          }
          return { r, quer: document.documentElement.scrollWidth > innerWidth + 1 };
        }, TREFFER.toString());
        const schlecht = m ? m.r.filter(x => x.m.w < 44 || x.m.h < 44 || !x.drin) : null;
        pruefe(w + ' ' + dichte + ': alle ' + (m ? m.r.length : 0) + ' Knöpfe der Auswahl ≥ 44 × 44, im Bild, kein Querscrollen',
          !!m && m.r.length >= 8 && m.r.some(x => x.t === 'Gesperrt') && !schlecht.length && !m.quer, JSON.stringify(schlecht || m));
        await p._ctx.close();
      }
    }

    console.log('\n── 6b Chef: „Alle Studios" ──');
    p = await oeffne(b, 1440, 900, 'stub-chef.js', { designs: [{ id: 'dC', name: 'Alle gleich', ts: 1,
      aufbau: { leiste: ['v-putzplan', 'v-todos'], start: 'home' }, prefs: {} }] });
    await p.click('#bereichKopf'); await p.waitForTimeout(350);
    await p.evaluate(() => [...document.querySelectorAll('#allesLade [data-al-aufbau]')].find(e => e.getClientRects().length).click());
    await p.waitForTimeout(500);
    await p.evaluate(() => { window.__schreib = []; document.querySelector('[data-abanbieten="dC"]').click(); });
    await p.waitForTimeout(300);
    const chefWahl = await p.evaluate(() => [...document.querySelectorAll('#abInhalt .ab-fuer [data-abfuerstudio]')].map(e => e.textContent.trim() + (e.classList.contains('on') ? '*' : '')));
    pruefe('der Chef hat „Alle Studios" (vorgewählt) und jedes Studio', chefWahl[0] === 'Alle Studios*' && chefWahl.length > 2, chefWahl.join('|'));
    await p.evaluate(() => document.querySelector('#abInhalt .ab-fuer [data-abfuersenden]').click());
    await p.waitForTimeout(400);
    const cd = await p.evaluate(() => ((window.__schreib || []).filter(x => /designs\/\(neu\)$/.test(x.pfad))[0] || {}).daten);
    pruefe('… und schreibt art:vorschlag, studios:all', !!cd && cd.art === 'vorschlag' && cd.studios === 'all', JSON.stringify(cd).slice(0, 200));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();

    console.log('\n── 7 Mitarbeiter: nur das eigene Studio, Festlegen gilt sofort ──');
    const T7 = [
      { id: 'v7', uid: 'u3', von: 'Ben Kraus', name: 'Nur Brühl', ts: 9, angebot: true, art: 'vorschlag', studios: ['studio-7'],
        aufbau: { leiste: ['v-chat', 'v-todos'], start: 'home' }, prefs: {} },
      { id: 'v6', uid: 'u3', von: 'Ben Kraus', name: 'Für Hürth', ts: 8, angebot: true, art: 'vorschlag', studios: ['studio-6'],
        aufbau: { leiste: ['v-chat', 'v-todos'], start: 'home' }, prefs: {} }
    ];
    p = await oeffne(b, 1440, 900, 'stub-mitarbeiter.js', null, T7);
    z = await zeile(p);
    pruefe('ein Vorschlag nur für Brühl erscheint in Hürth nicht, der für Hürth schon', !!z && z.id === 'v6', JSON.stringify(z));
    await p._ctx.close();

    const F7 = [
      { id: 'f7', uid: 'u3', von: 'Ben Kraus', name: 'Brühl fest', ts: 9, angebot: true, art: 'fest', studios: ['studio-7'],
        aufbau: { leiste: ['v-chat', 'v-todos'], start: 'home' }, prefs: {} }
    ];
    p = await oeffne(b, 1440, 900, 'stub-mitarbeiter.js', null, F7);
    const ohne = await appLeiste(p);
    pruefe('eine Festlegung für Brühl ändert in Hürth nichts', ohne[0] !== 'Chat' && !(await zeile(p)), ohne.join('|'));
    await p._ctx.close();

    const F6 = [
      { id: 'f6', uid: 'u3', von: 'Ben Kraus', name: 'Hürth fest', ts: 9, angebot: true, art: 'fest', studios: ['studio-6'],
        aufbau: { leiste: ['v-putzplan', 'v-todos', 'v-chat'], start: 'todos' }, prefs: {} },
      { id: 'f5', uid: 'u3', von: 'Ben Kraus', name: 'Alt fest', ts: 3, angebot: true, art: 'fest', studios: ['studio-6'],
        aufbau: { leiste: ['v-chat'], start: 'home' }, prefs: {} }
    ];
    p = await oeffne(b, 1440, 900, 'stub-mitarbeiter.js', null, F6);
    const fest = await appLeiste(p);
    const st = await p.evaluate(() => ({ ansicht: (document.querySelector('.view.show') || {}).id, ent: (JSON.parse(localStorage.getItem('kf_prefs')).angebote || {}) }));
    pruefe('eine Festlegung für Hürth gilt sofort: Putzplan zuerst', fest[0] === 'Putzplan', fest.join('|'));
    pruefe('… ohne Rückfrage und ohne Tafel', p._dialoge === 0 && !(await tafelOffen(p)));
    pruefe('… nur die neueste; beide gelten als erledigt', st.ent.f6 === 'fest' && st.ent.f5 === 'fest', JSON.stringify(st.ent));
    pruefe('… keine Vorschlags-Zeile dafür auf „Heute"', !(await zeile(p)));
    // selbst ändern: Leiste wieder anders; beim nächsten Öffnen bleibt es so
    await p.evaluate(() => { const a = JSON.parse(localStorage.getItem('kf_prefs')); a.aufbau.leiste = ['v-chat', 'v-todos']; localStorage.setItem('kf_prefs', JSON.stringify(a)); });
    const p2 = await p._ctx.newPage();
    p2._fehler = []; p2.on('pageerror', e => p2._fehler.push(e.message.slice(0, 160)));
    await p2.route('**://www.gstatic.com/**', r => r.abort()); await p2.route('**fonts.googleapis.com/**', r => r.abort());
    await p2.goto(APP, { waitUntil: 'domcontentloaded' });
    await p2.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
    await p2.waitForTimeout(1100);
    const danach = await appLeiste(p2);
    pruefe('wer danach selbst ändert, behält es beim nächsten Öffnen', danach[0] === 'Chat', danach.join('|'));
    pruefe('ohne Skriptfehler', !p._fehler.length && !p2._fehler.length, p._fehler.concat(p2._fehler).join(' | '));
    await p._ctx.close();

    /* Mitten in der Arbeit: eine Festlegung kommt an, während man im Chat ist.
       Sie gilt sofort, aber die Seite bleibt, wo man ist. */
    p = await oeffne(b, 1440, 900, 'stub-mitarbeiter.js', null, []);
    await p.evaluate(() => [...document.querySelectorAll('#side > [data-group]')].find(e => e.getClientRects().length && e.textContent.trim() === 'Nachrichten').click()); await p.waitForTimeout(600);
    const vorher7 = await p.evaluate(() => (document.querySelector('.view.show') || {}).id);
    const hoerer = await p.evaluate((F) => window.__nachschub('designs', F), F6);
    await p.waitForTimeout(600);
    const mitten = await p.evaluate(() => (document.querySelector('.view.show') || {}).id);
    const lm = await appLeiste(p);
    pruefe('mitten in der Arbeit: die Festlegung gilt sofort (Putzplan zuerst)', hoerer > 0 && lm[0] === 'Putzplan', 'Hörer ' + hoerer + ' · ' + lm.join('|'));
    pruefe('… und die Seite bleibt, wo man ist (' + vorher7 + ')', !!vorher7 && mitten === vorher7, mitten);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();

    console.log('\n── 8 Gesperrt ──');
    const S8 = [
      { id: 's8', uid: 'u3', von: 'Ben Kraus', name: 'Hürth gesperrt', ts: 9, angebot: true, art: 'fest', sperre: true, studios: ['studio-6'],
        aufbau: { leiste: ['v-putzplan', 'v-todos', 'v-chat'], start: 'home' }, prefs: {} },
      { id: 't8', uid: 'u2', von: 'Anna Meier', name: 'Chat zuerst', ts: 4,
        aufbau: { leiste: ['v-chat', 'v-todos'], start: 'home' }, prefs: { theme: 'light' } }
    ];
    p = await oeffne(b, 1440, 900, 'stub-mitarbeiter.js', null, S8);
    pruefe('die gesperrte Festlegung gilt sofort: Putzplan zuerst', (await appLeiste(p))[0] === 'Putzplan', (await appLeiste(p)).join('|'));
    const aw8 = await antworten(p);
    pruefe('… Rückmeldung „eingestellt" (wie:fest)', aw8.length === 1 && /designs\/s8\/antworten\//.test(aw8[0].pfad) && aw8[0].daten.wie === 'fest', JSON.stringify(aw8));
    await oeffneTafel(p);
    const t8 = await p.evaluate(() => ({
      hinweis: (document.querySelector('#abInhalt .ab-gesperrt') || {}).textContent || '',
      bausteine: document.querySelectorAll('#abInhalt .ab-vorrat, #abInhalt .ab-leiste, #abInhalt .ab-heute, #abInhalt [data-abstart]').length,
      aussehen: document.querySelectorAll('#abInhalt [data-abpref]').length }));
    pruefe('„App gestalten": statt der Bausteine steht „Festgelegt" mit dem Namen', /Hürth gesperrt/.test(t8.hinweis) && t8.bausteine === 0, JSON.stringify(t8));
    pruefe('… Aussehen und Schrift bleiben einstellbar', t8.aussehen > 10, t8.aussehen);
    await p.evaluate(() => document.querySelector('#abInhalt [data-abpref="theme|dark"]').click()); await p.waitForTimeout(200);
    await p.click('#abUebernehmen'); await p.waitForTimeout(600);
    const th = await p.evaluate(() => JSON.parse(localStorage.getItem('kf_prefs')).theme);
    pruefe('„Übernehmen" stellt das Aussehen ein (Dunkel), die Leiste bleibt', th === 'dark' && (await appLeiste(p))[0] === 'Putzplan', th + ' · ' + (await appLeiste(p)).join('|'));
    await oeffneTafel(p);
    await p.evaluate(() => document.querySelector('[data-abnutzen="team:t8"]').click()); await p.waitForTimeout(600);
    pruefe('„Nutzen" eines anderen Designs ändert die Leiste nicht', (await appLeiste(p))[0] === 'Putzplan', (await appLeiste(p)).join('|'));
    pruefe('… und meldet kein „selbst geändert"', (await antworten(p)).every(x => x.daten.wie !== 'eigen'));
    await p.evaluate(() => { const a = JSON.parse(localStorage.getItem('kf_prefs')); a.aufbau.leiste = ['v-chat']; localStorage.setItem('kf_prefs', JSON.stringify(a)); });
    const p8 = await p._ctx.newPage();
    p8._fehler = []; p8.on('pageerror', e => p8._fehler.push(e.message.slice(0, 160)));
    await p8.route('**://www.gstatic.com/**', r => r.abort()); await p8.route('**fonts.googleapis.com/**', r => r.abort());
    await p8.goto(APP, { waitUntil: 'domcontentloaded' });
    await p8.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
    await p8.waitForTimeout(1100);
    pruefe('am Gerät verstellt und neu geladen: die Sperre stellt die Leiste wieder her', (await appLeiste(p8))[0] === 'Putzplan', (await appLeiste(p8)).join('|'));
    await p8.evaluate(() => window.__nachschub('designs', []));
    await p8.waitForTimeout(500);
    await oeffneTafel(p8);
    const frei = await p8.evaluate(() => ({ g: !!document.querySelector('#abInhalt .ab-gesperrt'), v: !!document.querySelector('#abInhalt .ab-vorrat') }));
    pruefe('„Nicht mehr teilen" hebt die Sperre auf: die Bausteine sind wieder da', !frei.g && frei.v, JSON.stringify(frei));
    pruefe('ohne Skriptfehler', !p._fehler.length && !p8._fehler.length, p._fehler.concat(p8._fehler).join(' | '));
    await p._ctx.close();

    console.log('\n── 9 Rückmeldung ──');
    // „selbst geändert": Festlegung ohne Sperre, danach einen Vorschlag übernehmen
    p = await oeffne(b, 1440, 900, 'stub-mitarbeiter.js', null, F6.slice(0, 1));
    await oeffneTafel(p);
    await p.evaluate(() => document.querySelector('#abInhalt [data-abvor]:not(.on)').click()); await p.waitForTimeout(200);
    await p.click('#abUebernehmen'); await p.waitForTimeout(600);
    const aw9 = (await antworten(p)).map(x => x.daten.wie);
    pruefe('nach einer Festlegung selbst geändert: „fest", dann „eigen"', aw9.join(',') === 'fest,eigen', aw9.join(','));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();

    const L9 = [
      { id: 'dA', uid: 'testuid', von: 'Test Chef', name: 'Mein Angebot', ts: 9, angebot: true, art: 'vorschlag', studios: ['studio-6'],
        aufbau: { leiste: ['v-putzplan'], start: 'home' }, prefs: {} },
      { id: 'dF', uid: 'u3', von: 'Ben Kraus', name: 'Fremdes Angebot', ts: 8, angebot: true, art: 'vorschlag', studios: ['studio-6'],
        aufbau: { leiste: ['v-putzplan'], start: 'home' }, prefs: {} }
    ];
    const A9 = { __antworten: {
      dA: [{ uid: 'u2', name: 'Anna Meier', wie: 'ja', ts: 3 }, { uid: 'u5', name: 'Cem Yilmaz', wie: 'eigen', ts: 2 }, { uid: 'u6', name: 'Dana Roth', wie: 'nein', ts: 1 }],
      dF: [{ uid: 'u2', name: 'Anna Meier', wie: 'ja', ts: 3 }] } };
    p = await oeffne(b, 1440, 900, 'stub-leiter.js', null, L9, A9);
    await oeffneTafel(p);
    const r9 = await p.evaluate(() => [...document.querySelectorAll('#abInhalt .ab-antw')].map(e => e.textContent.replace(/\s+/g, ' ').trim()));
    pruefe('beim eigenen Angebot: „1 übernommen · 1 selbst geändert · 1 abgelehnt"', r9.length === 1 && /1 übernommen · 1 selbst geändert · 1 abgelehnt/.test(r9[0]), r9.join(' / '));
    pruefe('… beim fremden Angebot steht nichts', r9.length === 1);
    await p.evaluate(() => document.querySelector('[data-abantw="dA"]').click()); await p.waitForTimeout(250);
    const wer = await p.evaluate(() => [...document.querySelectorAll('#abInhalt .ab-antw-liste li')].map(e => [...e.children].map(c => c.textContent.trim()).join(' ')));
    pruefe('„Wer?" zeigt die Namen: Anna Meier übernommen, Cem Yilmaz selbst geändert, Dana Roth abgelehnt',
      wer.join('|') === 'Anna Meier übernommen|Cem Yilmaz selbst geändert|Dana Roth abgelehnt', wer.join('|'));
    await p.evaluate(() => { window.__schreib = []; document.querySelector('[data-abteamweg="dA"]').click(); }); await p.waitForTimeout(150);
    await p.evaluate(() => document.querySelector('[data-abteamweg="dA"]').click()); await p.waitForTimeout(500);
    const weg = await p.evaluate(() => (window.__schreib || []).filter(x => x.art === 'delete').map(x => x.pfad));
    pruefe('„Nicht mehr teilen" entfernt erst die drei Rückmeldungen, dann das Design',
      weg.length === 4 && weg.slice(0, 3).every(x => /^designs\/dA\/antworten\//.test(x)) && weg[3] === 'designs/dA', weg.join(' | '));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p._ctx.close();

    console.log('\n── 9a „Wer?": Trefferfläche, normal und kompakt ──');
    for (const dichte of ['normal', 'kompakt']) {
      for (const [w, h] of [[320, 640], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
        p = await oeffne(b, w, h, 'stub-leiter.js', { dichte }, L9, A9);
        await oeffneTafel(p);
        const m = await p.evaluate((T) => {
          const f = new Function('return ' + T)();
          const k = document.querySelector('[data-abantw="dA"]'); if (!k) return null;
          k.scrollIntoView({ block: 'center' });
          const g = k.getBoundingClientRect();
          return { m: f(k), drin: g.left >= 0 && g.right <= innerWidth + 0.5, quer: document.documentElement.scrollWidth > innerWidth + 1 };
        }, TREFFER.toString());
        pruefe(w + ' ' + dichte + ': „Wer?" ' + (m ? m.m.w + '×' + m.m.h : '–') + ', im Bild, kein Querscrollen',
          !!m && m.m.w >= 44 && m.m.h >= 44 && m.drin && !m.quer, JSON.stringify(m));
        await p._ctx.close();
      }
    }
  } finally { await b.close(); }
  console.log('\n' + (schlecht ? '✗ Vorschläge, Festlegungen, Sperre und Rückmeldung: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
                              : '✓ Vorschläge, Festlegungen, Sperre und Rückmeldung: ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
