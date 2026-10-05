/* ══════════════════════════════════════════════════════════════════════
   KENNZAHLEN JE STUDIO (Runde 138)

   Aus dem Betrieb, 4.10.2026: Kennzahlen je Studio mit Verlauf über die
   Monate; Mitglieder und Kündigungen trägt die Studioleitung am
   Monatsersten ein („geht fit").

   In der Demo:
   1. Verwaltung → Kennzahlen: eine Zeile je Studio, sechs Monate bis
      zum Vormonat, eine Gesamtzeile, ein Verlauf. „–" für nicht
      Eingetragenes, NIE eine 0.
   2. Der Hinweis „September: Zahlen fehlen noch für …" nennt genau die
      Studios ohne Eintrag; ein Tipp führt zum Eintragen.
   3. Probetrainings/Abschlüsse/Quote stimmen mit den Einträgen der
      Demo-Datenbank überein (nachgezählt, nicht angenommen); Zuwachs =
      Mitglieder minus Vormonat; die Gesamtzeile summiert nur, wenn alle
      Studios eine Zahl haben.
   4. Eintragen: eine halbe Zeile → Hinweis; zwei Zahlen → gespeichert
      unter <studio>_<JJJJ-MM>, der Hinweis verschwindet.
   5. Die Studioleitung sieht nur ihre Studios (über „Alles" erreichbar);
      ein Mitarbeiter hat den Reiter nicht.
   6. Fingerziele ≥ 44 × 44 per Hit-Test bei 320/390/430/820/1280/1440/
      1920, normal und kompakt; kein waagerechtes Scrollen der Seite.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const KZ = 'firmen/koerperformen/kennzahlen';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + String(hinweis).slice(0, 260) : '')); }
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
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
  await p.goto(APP + '?demo=' + rolle, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  return p;
}
/* Der Weg eines Menschen: „Alles" → „Kennzahlen" — am Handy und am
   Rechner derselbe, und genau der, den „jedes Ziel in zwei Tipps"
   verspricht. */
async function zuKennzahlen(p) {
  return p.evaluate(async () => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    const s = (sel) => [...document.querySelectorAll(sel)].find(e => e.offsetParent);
    const alles = s('[data-view="alles"], [data-group="g-alles"], .mobnav [data-alles-auf]') ||
      [...document.querySelectorAll('.mobnav button, #side button, #side a')].find(e => e.offsetParent && /^\s*Alles\s*$/.test(e.textContent));
    if (alles) { alles.click(); await w(700); }
    /* Der Eintrag des Reiters — nicht die Zeile „Was ist neu", die den
       Titel „Kennzahlen je Studio" ebenfalls trägt. */
    const ziel = [...document.querySelectorAll('[data-alles][data-al-cgo="kennzahlen"]')].find(e => e.offsetParent);
    if (!ziel) return false;
    ziel.click(); await w(1500);
    const pane = document.querySelector('[data-cpane="kennzahlen"]');
    return !!pane && pane.style.display !== 'none';
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
          const el = document.querySelector(s);
          if (!el || !el.offsetParent) { aus[s] = { w: -1, h: -1 }; continue; }
          el.scrollIntoView({ block: 'center' });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          aus[s] = T(el);
        }
        return { aus, quer: document.documentElement.scrollWidth - innerWidth };
      }, [TREFFER.toString(), liste]);
      const klein = Object.keys(m.aus).filter(k => !(m.aus[k].w >= 44 && m.aus[k].h >= 44));
      pruefe(wer + ' ' + w + ' px ' + dichte + ': ' + liste.length + ' Bedienelemente ≥ 44 × 44, nichts ragt hinaus',
        !klein.length && m.quer <= 0, JSON.stringify({ klein: klein.map(k => k + ' ' + m.aus[k].w + '×' + m.aus[k].h), quer: m.quer }));
    }
  }
  await p.evaluate(() => { document.body.dataset.dichte = 'normal'; });
}
/* Die Tabelle als Zahlen lesen: { Studio: [Werte…] } — „–" wird null. */
function tabelle(p) {
  return p.evaluate(() => {
    const kopf = [...document.querySelectorAll('#kzTabelle thead th')].map(t => t.textContent.trim());
    const zeilen = {};
    document.querySelectorAll('#kzTabelle tbody tr').forEach(tr => {
      const td = [...tr.children];
      zeilen[td[0].textContent.trim()] = td.slice(1, -1).map(c => {
        const t = c.childNodes[0] ? c.childNodes[0].textContent.trim() : '';
        if (t === '–') return null;
        return +t.replace(/[^\d−-]/g, '').replace('−', '-');
      });
    });
    return { kopf, zeilen };
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── Die Geschäftsführung ──');
  const p = await oeffne(b, 'chef', 1440, 900);
  pruefe('„Alles" → „Kennzahlen" öffnet den Reiter', await zuKennzahlen(p));
  // Die Erwartung aus der Demo-Datenbank selbst rechnen
  const soll = await p.evaluate(async (KZ) => {
    const z = (n) => (n < 10 ? '0' : '') + n;
    const h = new Date(), monate = [];
    for (let i = 6; i >= 1; i--) { const d = new Date(h.getFullYear(), h.getMonth() - i, 1); monate.push(d.getFullYear() + '-' + z(d.getMonth() + 1)); }
    const vor = new Date(h.getFullYear(), h.getMonth() - 7, 1); const m0 = vor.getFullYear() + '-' + z(vor.getMonth() + 1);
    const kz = (await firebase.firestore().collection(KZ).get()).docs.map(d => d.data());
    const pb = (await firebase.firestore().collection('firmen/koerperformen/probetrainings').get()).docs.map(d => d.data());
    const opts = [...document.querySelectorAll('#matStudio option, #kzEintrag [data-kzst]')];
    return { monate, m0, kz, pb };
  }, KZ);
  let t = await tabelle(p);
  const studios = Object.keys(t.zeilen).filter(n => n !== 'Gesamt');
  pruefe('eine Zeile je Studio (14) und eine Gesamtzeile', studios.length === 14 && 'Gesamt' in t.zeilen, Object.keys(t.zeilen).join(', '));
  pruefe('Kopf: Studio, sechs Monate, Verlauf', t.kopf.length === 8 && t.kopf[0] === 'Studio' && t.kopf[7] === 'Verlauf', t.kopf.join(' | '));
  const keyVon = await p.evaluate(() => {
    const m = {}; document.querySelectorAll('#kzEintrag [data-kzst]').forEach(z => { m[z.querySelector('.kz-name').firstChild.textContent] = z.getAttribute('data-kzst'); }); return m;
  });
  const mitglieder = (key, monat) => { const e = soll.kz.find(x => x.studioKey === key && x.monat === monat); return e ? e.mitglieder : null; };
  let stimmt = true, beleg = '';
  studios.forEach(n => soll.monate.forEach((m, i) => {
    if (t.zeilen[n][i] !== mitglieder(keyVon[n], m)) { stimmt = false; beleg = n + ' ' + m + ': ' + t.zeilen[n][i] + ' statt ' + mitglieder(keyVon[n], m); }
  }));
  pruefe('Mitglieder: jede Zelle wie in der Datenbank', stimmt, beleg);
  const fehlen = studios.filter(n => t.zeilen[n][5] === null);
  pruefe('nicht Eingetragenes steht als „–", nicht als 0', fehlen.length === 2, fehlen.join(', '));
  pruefe('Gesamt summiert NICHT, solange ein Studio fehlt', t.zeilen.Gesamt[5] === null && t.zeilen.Gesamt[4] ===
    studios.reduce((a, n) => a + t.zeilen[n][4], 0), JSON.stringify(t.zeilen.Gesamt));
  const hinweis = await p.evaluate(() => { const h = document.getElementById('kzFehlt'); return h && !h.hidden ? h.textContent : ''; });
  pruefe('der Hinweis nennt genau die Studios ohne Zahlen', fehlen.length && fehlen.every(n => hinweis.indexOf(n) >= 0) && /Zahlen fehlen noch/.test(hinweis), hinweis);
  pruefe('der Verlauf ist da (eine Linie je Zeile)', await p.evaluate(() => document.querySelectorAll('#kzTabelle tbody .kz-spark').length >= 13));

  // Zuwachs
  await p.evaluate(() => document.querySelector('[data-kzart="zuwachs"]').click());
  t = await tabelle(p);
  const n0 = studios[0];
  const zw = soll.monate.map((m, i) => {
    const vorM = i ? soll.monate[i - 1] : soll.m0; const a = mitglieder(keyVon[n0], m), v = mitglieder(keyVon[n0], vorM);
    return a === null || v === null ? null : a - v;
  });
  pruefe('Zuwachs = Mitglieder minus Vormonat (' + n0 + ')', JSON.stringify(t.zeilen[n0]) === JSON.stringify(zw), JSON.stringify(t.zeilen[n0]) + ' / ' + JSON.stringify(zw));

  // Probetrainings und Quote nachgezählt
  await p.evaluate(() => document.querySelector('[data-kzart="probe"]').click());
  t = await tabelle(p);
  const zaehl = (key, monat, nurJa) => soll.pb.filter(x => {
    const d = new Date(x.datum); const mm = d.getFullYear() + '-' + ((d.getMonth() < 9 ? '0' : '') + (d.getMonth() + 1));
    return x.studioKey === key && mm === monat && (!nurJa || x.abschluss);
  }).length;
  let ok2 = true, b2 = '';
  studios.forEach(n => soll.monate.forEach((m, i) => { if (t.zeilen[n][i] !== zaehl(keyVon[n], m)) { ok2 = false; b2 = n + ' ' + m; } }));
  pruefe('Probetrainings: jede Zelle nachgezählt aus den Einträgen', ok2, b2);
  pruefe('Gesamt bei Probetrainings = Summe (hier gibt es keine Lücke)', t.zeilen.Gesamt[5] === studios.reduce((a, n) => a + t.zeilen[n][5], 0));
  await p.evaluate(() => document.querySelector('[data-kzart="quote"]').click());
  t = await tabelle(p);
  const m5 = soll.monate[5], k0 = keyVon[n0], nn = zaehl(k0, m5), ja = zaehl(k0, m5, true);
  pruefe('Quote = Abschlüsse / Probetrainings (' + n0 + ', ' + m5 + ')', t.zeilen[n0][5] === (nn ? Math.round(ja / nn * 100) : null), t.zeilen[n0][5] + ' / ' + ja + '/' + nn);
  await p.evaluate(() => document.querySelector('[data-kzart="mitglieder"]').click());

  /* Runde 141: wer eintippt und dann oben die Zahl wechselt, verliert
     das Eingetippte nicht mehr. */
  const bleibt = await p.evaluate(async () => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    const f = document.querySelector('#kzEintrag [data-f="kuendigungen"]');
    const vorher = f.value; f.value = '77';
    document.querySelector('[data-kzart="quote"]').click(); await w(200);
    document.querySelector('[data-kzart="mitglieder"]').click(); await w(200);
    const nachher = document.querySelector('#kzEintrag [data-f="kuendigungen"]').value;
    document.querySelector('#kzEintrag [data-f="kuendigungen"]').value = vorher;
    return nachher;
  });
  pruefe('eingetippt, dann oben umgeschaltet: die Zahl bleibt stehen', bleibt === '77', bleibt);

  // Eintragen
  const ein = await p.evaluate(async (KZ) => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    document.getElementById('kzFehlt').click(); await w(500);
    const zeile = [...document.querySelectorAll('#kzEintrag [data-kzst]')].find(z => !z.querySelector('[data-f="mitglieder"]').value);
    const key = zeile.getAttribute('data-kzst');
    zeile.querySelector('[data-f="mitglieder"]').value = '321';
    document.getElementById('kzSpeichern').click(); await w(300);
    const halb = document.getElementById('kzFehler').textContent;
    zeile.querySelector('[data-f="kuendigungen"]').value = '4.5';
    document.getElementById('kzSpeichern').click(); await w(300);
    const komma = document.getElementById('kzFehler').textContent;
    zeile.querySelector('[data-f="kuendigungen"]').value = '5';
    document.getElementById('kzSpeichern').click(); await w(900);
    const monat = document.getElementById('kzMonatWahl').value;
    const doc = (await firebase.firestore().collection(KZ).doc(key + '_' + monat).get()).data();
    return { key, monat, halb, komma, doc, fehler: document.getElementById('kzFehler').textContent,
             hinweis: document.getElementById('kzFehlt').hidden ? '' : document.getElementById('kzFehlt').textContent };
  }, KZ);
  pruefe('„Eintragen ›" wählt den fehlenden Monat', ein.monat === soll.monate[5], ein.monat);
  pruefe('nur eine der beiden Zahlen → Hinweis, nichts gespeichert', /fehlt eine der beiden Zahlen/.test(ein.halb), ein.halb);
  pruefe('eine Kommazahl → Hinweis', /ganze Zahlen/.test(ein.komma), ein.komma);
  pruefe('zwei ganze Zahlen → gespeichert unter <studio>_<JJJJ-MM>, mit wer und wann',
    !!ein.doc && ein.doc.mitglieder === 321 && ein.doc.kuendigungen === 5 && ein.doc.studioKey === ein.key &&
    ein.doc.monat === ein.monat && ein.doc.vonUid === 'demo-ich' && typeof ein.doc.ts === 'number', JSON.stringify(ein.doc));
  const gespeichertName = Object.keys(keyVon).find(n => keyVon[n] === ein.key);
  pruefe('… und im Hinweis fehlt dieses Studio jetzt (das andere steht noch da)', !!ein.hinweis &&
    ein.hinweis.indexOf(gespeichertName) < 0 && fehlen.some(n => n !== gespeichertName && ein.hinweis.indexOf(n) >= 0),
    gespeichertName + ' / ' + ein.hinweis);
  await messen(p, 'GF', ['#kzWahl [data-kzart="quote"]', '#kzFehlt', '#kzMonatWahl', '#kzEintrag input', '#kzSpeichern']);
  pruefe('ohne Skriptfehler (Geschäftsführung)', !p._fehler.length, p._fehler.join(' | '));
  await p.close();

  console.log('\n── Die Studioleitung ──');
  const q = await oeffne(b, 'leiter', 390, 844);
  pruefe('am Handy: „Alles" → „Kennzahlen"', await zuKennzahlen(q));
  const lt = await tabelle(q);
  const eigene = await q.evaluate(() => [...document.querySelectorAll('#matStudio option')].map(o => o.textContent.trim()));
  const lst = Object.keys(lt.zeilen).filter(n => n !== 'Gesamt');
  pruefe('nur die eigenen Studios', lst.length === 2 && lst.every(n => eigene.indexOf(n) >= 0), lst.join(', ') + ' / ' + eigene.join(', '));
  const hand = await q.evaluate(() => {
    const th = [...document.querySelectorAll('#kzTabelle thead th')].filter(t => t.offsetParent).map(t => t.textContent.trim());
    return { th, quer: document.documentElement.scrollWidth - innerWidth };
  });
  pruefe('am Handy: Studio, letzter Monat, Verlauf — die älteren Monate ausgeblendet', hand.th.length === 3 && hand.th[2] === 'Verlauf', hand.th.join(' | '));
  await messen(q, 'Leitung', ['#kzWahl [data-kzart="mitglieder"]', '#kzEintrag input', '#kzSpeichern']);
  pruefe('ohne Skriptfehler (Studioleitung)', !q._fehler.length, q._fehler.join(' | '));
  await q.close();

  console.log('\n── Mitarbeiter ──');
  const r = await oeffne(b, 'mitarbeiter', 390, 844);
  const ma = await r.evaluate(async () => {
    const a = [...document.querySelectorAll('[data-group="g-alles"]')].find(e => e.offsetParent);
    if (a) { a.click(); await new Promise(x => setTimeout(x, 700)); }
    return { offen: document.querySelectorAll('[data-alles]').length,
             kz: !!document.querySelector('[data-al-cgo="kennzahlen"], [data-cgo="kennzahlen"], [data-ctab="kennzahlen"]') };
  });
  pruefe('ein Mitarbeiter hat den Reiter nicht (in „Alles" nachgesehen)', ma.offen > 5 && !ma.kz, JSON.stringify(ma));
  await r.close();

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Kennzahlen: richtig gezählt, ehrlich bei Lücken, Eintragen in einer Minute — ' + gut + ' Prüfungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
