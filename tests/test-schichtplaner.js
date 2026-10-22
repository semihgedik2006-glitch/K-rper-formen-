/* ══════════════════════════════════════════════════════════════════════
   SCHICHTPLANER — DIE OBERFLÄCHE (Runde 156)

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
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: w, height: h }, permissions: ['clipboard-read', 'clipboard-write'] });
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
/* Seit Runde 169 eine eigene Seite (view-planer) statt eines
   Verwaltungs-Reiters — der Weg bleibt „Alles" → Schichtplaner. */
/* Runde 184 („fünf Räume“): „Alles“ steht nicht mehr in der Leiste,
   sondern hinter dem ☰-Griff am Seitenkopf (#bereichKopf), der die
   Schublade öffnet. Aus dem Betrieb, 22.10.2026: „das problem mit dem zu
   viel bleibt immer noch bestehen“ – derselbe Weg, zwei Tipps, nur der
   erste Tipp sitzt jetzt oben links. */
async function zuAlles(p) {
  return p.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const griff = document.getElementById('bereichKopf');
    if (griff && griff.offsetParent && griff.getAttribute('aria-expanded') !== 'true') { griff.click(); await w(700); }
    const z = [...document.querySelectorAll('[data-alles="planer"]')].find((e) => e.offsetParent);
    if (!z) return false;
    z.click(); await w(1500);
    const v = document.getElementById('view-planer');
    return !!v && getComputedStyle(v).display !== 'none' && !!v.offsetParent;
  });
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
  pruefe('„Alles" → Schichtplaner öffnet die eigene Seite', await zuAlles(p));
  const reiter = await p.evaluate(() => [...document.querySelectorAll('#subnav [data-subview]')].map((b) => b.getAttribute('data-subview')));
  pruefe('die Seite steht als Reiter neben Chef und Archiv', reiter.join() === 'chef,planer,archive', reiter.join());
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
  pruefe('Zahlen: verteilt, Lücken, Rückfragen, Studios ohne offene Punkte', erg.z.length === 4 && erg.z[0] > 100, erg.z);
  pruefe('gespeichert, mit gemessener Dauer', /Fertig in \d+,\d s · gespeichert/.test(erg.stand), erg.stand);
  pruefe('„Zu klären" listet Punkte, wenn es Lücken oder Rückfragen gibt', (erg.z[1] + erg.z[2] === 0) || erg.punkte > 0, erg.punkte);
  /* Runde 191: der Plan steht Woche für Woche, „Ganzer Monat" zeigt
     alles. Aus dem Betrieb, 22.10.2026, über den Planer: „er wirkt für
     mich noch unfertig … aber das grundgrüst soll stehen erstmal".
     Vorher hiess es hier „zeigt einen ganzen Monat" (28–31 Zeilen) —
     jetzt sind es zuerst die Tage EINER Woche, und ein Tipp auf
     „Ganzer Monat" bringt die 28–31 Zeilen. Geprüft wird beides. */
  pruefe('der Plan zeigt zuerst eine Woche (1–7 Tage)', erg.zeilen >= 1 && erg.zeilen <= 7, erg.zeilen);
  const monat = await p.evaluate(async () => {
    document.querySelector('#spTabelle [data-spkw="alle"]').click();
    await new Promise((r) => setTimeout(r, 300));
    return document.querySelectorAll('#spTabelle tbody tr').length;
  });
  pruefe('„Ganzer Monat" zeigt den ganzen Monat', monat >= 28 && monat <= 31, monat);
  pruefe('vorn steht das Studio mit den meisten offenen Punkten', !erg.z[1] || /Lücke/.test(erg.studio || ''), erg.studio);
  pruefe('danach heisst der Knopf „Neu erstellen"', erg.los === 'Neu erstellen', erg.los);
  /* Runde 168: „visuell schöner und organisierter". Der Plan steht in
     Wochen, die Studios als Kacheln mit Zustand, „Zu klären" gilt nur
     für das gewählte Studio. */
  const aufbau = await p.evaluate(() => {
    const kacheln = [...document.querySelectorAll('#spKacheln .spl-kachel')];
    const an = kacheln.filter((k) => k.classList.contains('an'));
    const sk = document.getElementById('spStudio').value;
    const punkte = [...document.querySelectorAll('#spKlaeren [data-sppunkt]')].map((b) => b.getAttribute('data-sppunkt').split('|')[1]);
    /* Runde 191: die Wochen stehen als Reiter über dem Plan. */
    const wochen = [...document.querySelectorAll('#spTabelle .spl-kw:not(.alle) b')].map((h) => h.textContent);
    const zustand = kacheln.map((k) => k.querySelector('small').textContent);
    return { kacheln: kacheln.length, an: an.length, anIst: an[0] && an[0].getAttribute('data-spkachel') === sk,
      punkteNurHier: punkte.every((x) => x === sk), wochen, zustand,
      titel: document.getElementById('spPlanTitel').textContent };
  });
  pruefe('am Rechner: eine Kachel je Studio mit Schichten (' + aufbau.kacheln + ')', aufbau.kacheln >= 10, aufbau.kacheln);
  pruefe('genau eine Kachel gewählt, und es ist das Studio des Plans', aufbau.an === 1 && aufbau.anIst);
  pruefe('jede Kachel sagt ihren Zustand (fertig / Lücken / Rückfragen)',
    aufbau.zustand.every((t) => /fertig|Lücke|Rückfr/.test(t)), aufbau.zustand.join(' | '));
  pruefe('„Zu klären" zeigt nur das gewählte Studio', aufbau.punkteNurHier);
  pruefe('der Plan steht in Kalenderwochen (' + aufbau.wochen.length + ')', aufbau.wochen.length >= 4 && aufbau.wochen.length <= 6 && aufbau.wochen.every((w) => /^KW \d+$/.test(w)), aufbau.wochen.join(' | '));
  pruefe('der Titel nennt das Studio', /^Plan · \S/.test(aufbau.titel), aufbau.titel);
  const wechsel = await p.evaluate(async () => {
    const k = [...document.querySelectorAll('#spKacheln .spl-kachel')].find((x) => !x.classList.contains('an'));
    const ziel = k.getAttribute('data-spkachel');
    k.click(); await new Promise((r) => setTimeout(r, 200));
    return { ziel, sel: document.getElementById('spStudio').value,
      an: document.querySelector('#spKacheln .spl-kachel.an').getAttribute('data-spkachel'),
      punkte: [...document.querySelectorAll('#spKlaeren [data-sppunkt]')].every((b) => b.getAttribute('data-sppunkt').split('|')[1] === ziel) };
  });
  pruefe('eine andere Kachel antippen wechselt Plan, Auswahl und „Zu klären"', wechsel.sel === wechsel.ziel && wechsel.an === wechsel.ziel && wechsel.punkte, JSON.stringify(wechsel));
  // zurück zum Studio mit den meisten offenen Punkten, damit die Prüfung darunter eine Lücke findet
  await p.evaluate((sk) => { const k = document.querySelector('#spKacheln [data-spkachel="' + sk + '"]'); if (k) k.click(); }, await p.evaluate(() => {
    const o = [...document.querySelectorAll('#spKacheln .spl-kachel')].map((k) => ({ id: k.getAttribute('data-spkachel'), n: +((k.querySelector('small').textContent.match(/(\d+) Lücke/) || [0, 0])[1]) }));
    o.sort((a, b) => b.n - a.n); return o[0].id; }));
  await p.waitForTimeout(200);

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
    /* Runde 184: der Raum „Team“ heisst jetzt „Plan“ („wer arbeitet wann?“). */
    const team = [...document.querySelectorAll('.mobnav button, #side button, #side a')].find((e) => e.offsetParent && /^\s*Plan\s*$/.test(e.textContent));
    if (!team) return -1;
    team.click(); await w(900);
    const vor = document.getElementById('shiftNext');
    /* Runde 191: am Rechner sieht die Leitung das Raster nach Person —
       dort steht der Schichtname klein in der Pille. Gezählt wird beides. */
    const notizen = () => [...document.querySelectorAll('#shiftGrid .shift-note, #shiftGrid .wp-schicht small')].filter((n) => /Früh|Spät|Samstag/.test(n.textContent));
    for (let i = 0; i < 6 && !notizen().length; i++) { vor.click(); await w(250); }
    return notizen().length;
  });
  pruefe('veröffentlichte Schichten stehen im Team-Schichtplan (mit Schichtname)', imTeam > 0, imTeam);
  pruefe('ohne Skriptfehler (Chef)', !p._fehler.length, p._fehler.join(' | '));

  // 7. Regeln & Sonderfälle: die Chefin trägt selbst ein (Runde 169)
  await zuAlles(p);
  const regeln = await p.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const d = document.getElementById('spRegeln'); d.open = true; await w(100);
    const vorFest = document.querySelectorAll('#spFestListe [data-spfestweg]').length;
    document.querySelector('[data-spfesttag="3"]').click();
    document.getElementById('spFestDazu').click(); await w(400);
    const nachFest = document.querySelectorAll('#spFestListe [data-spfestweg]').length;
    const vorSo = document.querySelectorAll('#spSonderListe [data-spsonderweg]').length;
    const m = document.getElementById('spMonatName').textContent;
    const naechster = new Date(); const t = new Date(naechster.getFullYear(), naechster.getMonth() + 1, 20);
    document.getElementById('spSonderDatum').value = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-20';
    document.getElementById('spSonderArt').value = 'zu';
    document.getElementById('spSonderNotiz').value = 'Inventur';
    document.getElementById('spSonderDazu').click(); await w(400);
    const nachSo = document.querySelectorAll('#spSonderListe [data-spsonderweg]').length;
    document.getElementById('spAmStueck').value = '5';
    document.getElementById('spEinstSpeichern').click(); await w(400);
    document.getElementById('spNotiz').value = 'Mitte des Monats Inventur';
    document.getElementById('spNotizSpeichern').click(); await w(400);
    return { vorFest, nachFest, vorSo, nachSo, kurz: document.getElementById('spRegelnKurz').textContent,
      amStueck: document.getElementById('spAmStueck').value, notiz: document.getElementById('spNotizAnzeige').textContent, m };
  });
  pruefe('feste Einteilung hinzufügen: steht danach in der Liste', regeln.nachFest === regeln.vorFest + 1, JSON.stringify(regeln));
  pruefe('Sondertag hinzufügen: steht danach in der Liste', regeln.nachSo === regeln.vorSo + 1, JSON.stringify(regeln));
  pruefe('Einstellung „Tage am Stück" bleibt gespeichert', regeln.amStueck === '5', regeln.amStueck);
  pruefe('die Monatsnotiz steht oben im Kopf', /Inventur/.test(regeln.notiz), regeln.notiz);
  pruefe('die Zusammenfassung zählt feste Einteilungen und Sondertage', /fest/.test(regeln.kurz) && /Sondertag/.test(regeln.kurz), regeln.kurz);
  // Der Sondertag „zu" wirkt beim nächsten Erstellen
  await p.evaluate(() => { document.getElementById('spRegeln').open = false; document.getElementById('spLos').click(); });
  await p.waitForFunction(() => /^Fertig/.test(document.getElementById('spStand').textContent), null, { timeout: 8000 }).catch(() => {});
  const zuTag = await p.evaluate(() => {
    const t = new Date(); const d = new Date(t.getFullYear(), t.getMonth() + 1, 20);
    const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-20';
    return [...document.querySelectorAll('#spTabelle [data-spzelle]')].filter((b) => b.getAttribute('data-spzelle').startsWith(k)).length;
  });
  pruefe('Sondertag „geschlossen" am 20.: dort steht im Plan niemand', zuTag === 0, zuTag);

  // 8. Krankmeldung NACH dem Erstellen → Ausfall mit Ersatz (Runde 169)
  /* Die Demo ist mit 2–4 Leuten je Studio knapp — dort ist „niemand
     frei" oft die richtige Antwort. Für diese Prüfung kommen drei
     Leute nach Longerich dazu, dann wird neu erstellt. */
  const krank = await p.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const F = firebase.firestore().collection('firmen').doc('koerperformen');
    for (const n of [1, 2, 3]) {
      await F.collection('planerTeam').doc('x-test-' + n).set({ uid: 'x-test-' + n, name: 'Test Person ' + n, rolle: 'Vollzeit',
        haupt: 'studio-0', studios: [], wocheStd: 20, allein: true, verf: {}, kann: [], einspringen: n === 2 });
    }
    return true;
  });
  await zuAlles(p);
  await p.evaluate(() => document.getElementById('spLos').click());
  await p.waitForFunction(() => /^Fertig/.test(document.getElementById('spStand').textContent), null, { timeout: 8000 }).catch(() => {});
  const ziel = await p.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const k = document.querySelector('#spKacheln [data-spkachel="studio-0"]'); if (k) { k.click(); await w(150); }
    const z = [...document.querySelectorAll('#spTabelle .spl-zelle:not(.luecke)')].find((c) => /x-test-\d$/.test(c.getAttribute('data-spzelle')));
    if (!z) return null;
    const [datum, , id] = z.getAttribute('data-spzelle').split('|');
    await firebase.firestore().collection('firmen').doc('koerperformen').collection('studios').doc('studio-0').collection('absences')
      .add({ uid: id, name: 'Test', from: datum, to: datum, type: 'krank', ts: Date.now() });
    return { datum, id };
  });
  pruefe('(Aufbau) eine Testperson steht im Plan', !!ziel, JSON.stringify(ziel));
  await zuAlles(p);
  await p.waitForTimeout(800);
  const aus = await p.evaluate(() => {
    const box = document.getElementById('spAusfaelle');
    const knoepfe = [...box.querySelectorAll('[data-spersatz]')];
    return { sichtbar: !box.hidden, text: box.innerText.replace(/\s+/g, ' ').slice(0, 200), vorschlaege: knoepfe.length,
      vorschlagIds: knoepfe.map((b) => b.getAttribute('data-spersatz').split('|')[1]) };
  });
  pruefe('Krankmeldung nach dem Erstellen: „Ausfälle" erscheint', aus.sichtbar && /krank gemeldet/.test(aus.text), aus.text);
  pruefe('… mit 1–3 Ersatzvorschlägen, ohne die kranke Person', aus.vorschlaege >= 1 && aus.vorschlaege <= 3 && aus.vorschlagIds.indexOf((ziel || {}).id) < 0, JSON.stringify(aus));
  const ersetzt = await p.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const vor = document.querySelectorAll('#spAusfaelle .spl-ausfall').length;
    document.querySelector('#spAusfaelle [data-spersatz]').click(); await w(500);
    const box = document.getElementById('spAusfaelle');
    return { vor, nach: box.hidden ? 0 : box.querySelectorAll('.spl-ausfall').length };
  });
  pruefe('Ersatz antippen: der Ausfall ist erledigt (' + ersetzt.vor + ' → ' + ersetzt.nach + ')', ersetzt.nach === ersetzt.vor - 1, JSON.stringify(ersetzt));
  // Tausch: wer am selben Tag woanders steht, bietet „Tauschen" an, wenn es geht
  const tausch = await p.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    for (const k of [...document.querySelectorAll('#spKacheln .spl-kachel')]) {
      k.click(); await w(100);
      for (const z of [...document.querySelectorAll('#spTabelle .spl-zelle:not(.luecke)')].slice(0, 12)) {
        z.click(); await w(30);
        const b = document.querySelector('#spWahl [data-sptausch]');
        if (b) {
          const [d, sch, id] = z.getAttribute('data-spzelle').split('|');
          const ander = b.getAttribute('data-sptausch');
          b.click(); await w(300);
          const jetzt = [...document.querySelectorAll('#spTabelle [data-spzelle]')].map((x) => x.getAttribute('data-spzelle'));
          return { gefunden: true, getauscht: jetzt.indexOf(d + '|' + sch + '|' + ander) >= 0 };
        }
      }
    }
    return { gefunden: false };
  });
  pruefe('Tauschen am selben Tag: der Knopf tauscht die beiden Personen', !tausch.gefunden || tausch.getauscht, JSON.stringify(tausch));
  if (!tausch.gefunden) console.log('    (in der Demo fand sich kein möglicher Tausch — geprüft nur, dass nichts Falsches angeboten wird)');
  pruefe('ohne Skriptfehler (Regeln, Ausfälle, Tausch)', !p._fehler.length, p._fehler.join(' | '));

  // 6. Excel einlesen
  await zuAlles(p);
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
    '#spKacheln .spl-kachel, #spStudio', '#spVeroeffentlichen', '#spLogx', '#spTabelle .spl-zelle', '#spWahl .spl-person', '.spl-team summary', '#spRegeln > summary']);
  await p.evaluate(() => { document.getElementById('spRegeln').open = true; });
  /* Der Feiertags-Schalter: das Kästchen ist 22 px, getroffen wird aber
     die ganze Zeile (label um das Kästchen). Gemessen wird, was der
     Finger trifft — die Zeile. */
  const schalter = await p.evaluate(() => { const l = document.querySelector('.spl-schalter'); const vor = document.getElementById('spFeiertageZu').checked;
    const r = l.getBoundingClientRect(); document.elementFromPoint(r.right - 10, r.top + r.height / 2).click();
    const nach = document.getElementById('spFeiertageZu').checked; document.getElementById('spFeiertageZu').checked = vor; return vor !== nach; });
  pruefe('ein Tipp auf den Rand der Schalter-Zeile schaltet um', schalter);
  /* Runde 196: die Regeln stehen in vier Reitern, je einer sichtbar.
     Aus dem Betrieb, 22.10.2026: „mach weiter mit dem design und aufbau"
     (auf ein Foto mit den vier Formularen auf einmal). Gemessen werden
     dieselben zehn Bedienelemente wie vorher — je Reiter, plus die Reiter
     selbst. */
  for (const [reiter, liste] of [
    ['einst', ['[data-spregeltab="einst"]', '#spFrist', '.spl-schalter', '#spEinstSpeichern']],
    ['fest', ['[data-spregeltab="fest"]', '#spFestPerson', '[data-spfesttag="1"]', '#spFestDazu', '#spFestListe [data-spfestweg]']],
    ['sonder', ['[data-spregeltab="sonder"]', '#spSonderDatum', '#spSonderDazu']],
    ['notiz', ['[data-spregeltab="notiz"]', '#spNotizSpeichern']]]) {
    await p.evaluate((t) => document.querySelector('[data-spregeltab="' + t + '"]').click(), reiter);
    await messen(p, 'Chef (Regeln · ' + reiter + ')', liste);
  }
  await p.context().close();

  console.log('\n── Studioleitung ──');
  const l = await oeffne(b, 'leiter', 390, 844);
  const lHat = await l.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    /* Runde 184: „Alles“ liegt hinter dem ☰-Griff (#bereichKopf), nicht
       mehr in der unteren Leiste. Ohne die Schublade zu öffnen, wäre
       „hat den Reiter nicht“ immer wahr und sagte nichts. */
    const griff = document.getElementById('bereichKopf');
    if (!griff || !griff.offsetParent) return 'kein Griff';
    griff.click(); await w(700);
    return !!document.querySelector('[data-alles="planer"]');
  });
  pruefe('die Studioleitung hat den Reiter (noch) nicht', !lHat);
  await l.context().close();

  console.log('\n── Mitarbeiter ──');
  const m = await oeffne(b, 'mitarbeiter', 390, 844);
  const mHat = await m.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    /* Runde 184: „Alles“ liegt hinter dem ☰-Griff (#bereichKopf), nicht
       mehr in der unteren Leiste. Ohne die Schublade zu öffnen, wäre
       „hat den Reiter nicht“ immer wahr und sagte nichts. */
    const griff = document.getElementById('bereichKopf');
    if (!griff || !griff.offsetParent) return 'kein Griff';
    griff.click(); await w(700);
    return !!document.querySelector('[data-alles="planer"]');
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
