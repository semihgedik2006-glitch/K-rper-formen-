/* ── Zeiten als eigener Bereich (Runde 222) ───────────────────────────
   Aus dem Betrieb, 23.10.2026: „wäre es auch eventuell nützlich eine ganz
   neue seite fürs terminal und für die chefs zu erstellen wo man alles
   managen kann und mitarbeiter können sich nur einstempeln und ihre
   eigenen stunden sehen ob plus oder minus und halt alles was sie sonst
   bräuchten". Auf die Rückfragen: laufender Monat „vorläufig" — „ja";
   ein Modus „nur Stempeln" — „nur startknopf"; Resturlaub — „ja";
   wohin — „eigener knopf".

   Geprüft wird, in der Demo:
     1. Der Knopf „Zeiten" steht unten (320/390/430/820) bzw. links
        (1280/1440/1920), trifft ≥ 44 × 44 in „normal" und „kompakt",
        und seine Beschriftung ist nicht abgeschnitten — auch die der
        fünf anderen Knöpfe, die jetzt zu sechst stehen.
     2. Mitarbeiter: eine Seite, kein Reiter „Team". „Mein Konto" zeigt
        eine Zahl mit Vorzeichen, „vorläufig", Gearbeitet/Soll und den
        Resturlaub; unter „Ich" gibt es keinen Reiter „Zeiten" mehr.
     3. Resturlaub rechnet: drei genehmigte Urlaubstage → drei weniger.
        GEGENPROBE: abgelehnter Urlaub zählt nicht, ein beantragter zählt
        als „beantragt" und nicht als genommen, ein doppelter Eintrag für
        dieselben Tage zählt einmal.
     4. Studioleitung: Reiter „Team" (Jetzt im Studio), aber kein
        „Einrichten" und kein „Monat & Konto". Geschäftsführung: beides.
     5. Die Geschäftsführung trägt den Urlaubsanspruch im Soll-Formular
        ein; gespeichert wird er als Tage (u), nicht als Minuten.
     6. Am Rechner: Taste Z führt zu den eigenen Zeiten; zwei Spalten.
     7. Alte Wege: „Alles" → „Zeiten des Teams" führt zum Reiter „Team".
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
async function zuZeiten(p, team) {
  return p.evaluate(async (team) => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    const g = [...document.querySelectorAll('.mobnav [data-group="g-zeit"], #side [data-group="g-zeit"]')].find(x => x.getClientRects().length);
    if (!g) return false;
    g.click(); await w(1600);
    if (team) {
      const s = document.querySelector('#subnav [data-subview="zeitteam"]');
      if (!s) return false;
      s.click(); await w(1500);
    }
    return true;
  }, team);
}
function konto(p) {
  return p.evaluate(() => {
    const k = document.getElementById('stKonto');
    const zahl = k.querySelector('.st-konto-zahl');
    return {
      text: k.innerText.replace(/\s+/g, ' '),
      zahl: zahl ? zahl.textContent : '',
      stand: (document.getElementById('stKontoStand') || {}).textContent || '',
      rest: (k.querySelector('.st-urlaub-rest') || {}).textContent || '',
      urlaub: (k.querySelector('.st-urlaub') || {}).innerText || ''
    };
  });
}
const tageZahl = (t) => { const m = /(-?\d+(?:,\d)?)/.exec(t || ''); return m ? Number(m[1].replace(',', '.')) : NaN; };

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. Der Knopf „Zeiten" — in jeder Breite, beide Dichten ──');
  for (const [w, h] of BREITEN) {
    const p = await oeffne(b, 'chef', w, h);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      await p.waitForTimeout(250);
      const r = await p.evaluate((SRC) => {
        const T = eval('(' + SRC + ')');
        const knoepfe = [...document.querySelectorAll('.mobnav .mn-reihe [data-group], #side > [data-group]')]
          .filter(x => x.getClientRects().length && x.getBoundingClientRect().width > 0);
        const z = knoepfe.find(x => x.dataset.group === 'g-zeit');
        const zr = z ? z.getBoundingClientRect() : null;
        return {
          zahl: knoepfe.length,
          gruppen: knoepfe.map(x => x.dataset.group),
          t: z ? T(z) : null,
          imBild: !!zr && zr.left >= 0 && zr.right <= innerWidth && zr.top >= 0 && zr.bottom <= innerHeight,
          /* Abgeschnitten: das Wort ist breiter als sein Platz. */
          abgeschnitten: knoepfe.map(x => x.querySelector('span')).filter(s => s && s.scrollWidth > s.clientWidth + 1).map(s => s.textContent),
          zuKlein: knoepfe.map(x => ({ n: x.textContent.trim(), m: T(x) })).filter(x => x.m.w < 44 || x.m.h < 44).map(x => x.n + ' ' + x.m.w + '×' + x.m.h)
        };
      }, TREFFER.toString());
      pruefe(w + ' px, ' + dichte + ': „Zeiten" steht da, direkt nach „Studio" (' + r.zahl + ' Knöpfe)',
        r.gruppen.indexOf('g-zeit') === r.gruppen.indexOf('g-arbeit') + 1 && r.gruppen.indexOf('g-arbeit') >= 0, r.gruppen.join(','));
      pruefe(w + ' px, ' + dichte + ': „Zeiten" trifft ≥ 44 × 44 und ist im Bild', r.t && r.t.w >= 44 && r.t.h >= 44 && r.imBild, JSON.stringify(r.t));
      pruefe(w + ' px, ' + dichte + ': kein Knopf der Leiste unter 44 × 44', !r.zuKlein.length, r.zuKlein.join(', '));
      pruefe(w + ' px, ' + dichte + ': keine Beschriftung abgeschnitten', !r.abgeschnitten.length, r.abgeschnitten.join(', '));
    }
    pruefe(w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 2. Mitarbeiter: eine Seite, Mein Konto ──');
  {
    const p = await oeffne(b, 'mitarbeiter', 390, 844);
    pruefe('der Knopf öffnet „Meine Zeiten"', await zuZeiten(p, false));
    const v = await p.evaluate(() => ({
      ansicht: (document.querySelector('.view.show') || {}).id,
      team: !!document.querySelector('#subnav [data-subview="zeitteam"]'),
      ichReiter: [...document.querySelectorAll('[data-ichtab]')].map(x => x.getAttribute('data-ichtab')),
      pin: !!document.querySelector('#view-zeit #ichPinKarte'),
      antrag: !!document.querySelector('#view-zeit #stAntragKarte')
    }));
    pruefe('Ansicht view-zeit', v.ansicht === 'view-zeit', v.ansicht);
    pruefe('kein Reiter „Team" für Mitarbeiter', !v.team);
    pruefe('unter „Ich" gibt es keinen Reiter „Zeiten" mehr', v.ichReiter.indexOf('zeiten') < 0, v.ichReiter.join(','));
    pruefe('PIN und Korrekturantrag stehen mit auf der Seite', v.pin && v.antrag);
    const k = await konto(p);
    console.log('  KONTO:', k.text.slice(0, 260));
    pruefe('„Mein Konto": eine Zahl mit Vorzeichen in Stunden', /^([+−]\d+:\d{2}|±0:00) h$/.test(k.zahl), k.zahl);
    pruefe('… im Plus oder im Minus steht dabei, wenn es nicht null ist', /±0:00/.test(k.zahl) || /im (Plus|Minus)/.test(k.text), k.text);
    pruefe('… „vorläufig"', /vorläufig/.test(k.stand) && /vorläufig/.test(k.text), k.stand);
    pruefe('… Gearbeitet und Soll bis heute', /Gearbeitet/.test(k.text) && /Soll bis heute/.test(k.text), k.text);
    pruefe('… der abgeschlossene Stand aus der Demo (+2:15 h)', /\+2:15 h/.test(k.text), k.text);
    pruefe('… Resturlaub: Zahl und Anspruch', /übrig von 28/.test(k.urlaub) && !isNaN(tageZahl(k.rest)), k.urlaub);
    /* Ein Minus ist kein Fehler: keine Statusfarbe auf der Zahl. */
    const farbe = await p.evaluate(() => {
      const z = document.querySelector('.st-konto-zahl'); const t = document.querySelector('#stKonto .st-konto-gross span');
      return { zahl: getComputedStyle(z).color, text: getComputedStyle(document.body).color };
    });
    pruefe('die Zahl steht in Textfarbe, nicht in Rot/Grün', farbe.zahl === farbe.text, JSON.stringify(farbe));

    console.log('\n── 3. Resturlaub rechnet — mit Gegenprobe ──');
    const vorher = tageZahl(k.rest);
    /* Mitte Januar, Montag bis Mittwoch: dort liegt in NRW kein Feiertag. */
    const tage = await p.evaluate(() => {
      const j = new Date().getFullYear();
      const d = new Date(j, 0, 10, 12); while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
      const mo = d.toLocaleDateString('sv-SE'); d.setDate(d.getDate() + 2);
      const mi = d.toLocaleDateString('sv-SE'); d.setDate(d.getDate() + 2);
      const fr = d.toLocaleDateString('sv-SE');
      return { mo, mi, fr };
    });
    const dazu = (eintrag) => p.evaluate(async (e) => {
      await firebase.firestore().collection('firmen/koerperformen/studios/studio-6/absences').add(Object.assign({
        uid: 'demo-ich', name: 'Mara Velten', type: 'urlaub', ts: Date.now() }, e));
    }, eintrag);
    const neu = async () => { await zuZeiten(p, false); await p.waitForTimeout(400); return konto(p); };

    await dazu({ from: tage.mo, to: tage.mi, status: 'abgelehnt' });
    let k2 = await neu();
    pruefe('GEGENPROBE: abgelehnter Urlaub ändert den Rest nicht', tageZahl(k2.rest) === vorher, k2.urlaub);
    await dazu({ from: tage.mo, to: tage.mi, status: 'genehmigt' });
    k2 = await neu();
    pruefe('drei genehmigte Tage (Mo–Mi) → drei Tage weniger übrig', tageZahl(k2.rest) === vorher - 3, vorher + ' → ' + k2.urlaub);
    await dazu({ from: tage.mo, to: tage.mi, status: 'genehmigt' });
    k2 = await neu();
    pruefe('GEGENPROBE: derselbe Zeitraum doppelt eingetragen zählt einmal', tageZahl(k2.rest) === vorher - 3, k2.urlaub);
    await dazu({ from: tage.fr, to: tage.fr, status: 'offen' });
    k2 = await neu();
    pruefe('ein beantragter Tag zählt als „beantragt", nicht als genommen', tageZahl(k2.rest) === vorher - 3 && /beantragt 1 Tag/.test(k2.urlaub), k2.urlaub);
    pruefe('Mitarbeiter ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 4. Studioleitung und Geschäftsführung: Reiter „Team" ──');
  for (const rolle of ['leiter', 'chef']) {
    const p = await oeffne(b, rolle, 1440, 900);
    pruefe(rolle + ': Zeiten → Team erreichbar', await zuZeiten(p, true));
    const t = await p.evaluate(() => ({
      ansicht: (document.querySelector('.view.show') || {}).id,
      jetzt: !!document.querySelector('#zkJetzt .zk-j-kopf'),
      ansichtKnopf: !document.getElementById('zkAnsicht').hidden,
      einrichten: !document.getElementById('ztEinrichten').hidden
    }));
    pruefe(rolle + ': „Jetzt im Studio" steht da', t.ansicht === 'view-zeitteam' && t.jetzt, JSON.stringify(t));
    if (rolle === 'leiter') {
      pruefe('Studioleitung: kein „Monat & Konto" und kein „Einrichten"', !t.ansichtKnopf && !t.einrichten, JSON.stringify(t));
    } else {
      pruefe('Geschäftsführung: „Monat & Konto" und „Einrichten"', t.ansichtKnopf && t.einrichten, JSON.stringify(t));
      const weg = await p.evaluate(async () => {
        document.querySelector('[data-ztweg="standorte"]').click();
        await new Promise(r => setTimeout(r, 900));
        return { ansicht: (document.querySelector('.view.show') || {}).id, terminals: !!document.getElementById('terminalListe') && !!document.getElementById('terminalListe').offsetParent };
      });
      pruefe('„Stempel-Terminals" führt zu den Terminals in der Verwaltung', weg.ansicht === 'view-chef' && weg.terminals, JSON.stringify(weg));
    }
    pruefe(rolle + ' ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 5. Urlaubsanspruch im Soll-Formular ──');
  {
    const p = await oeffne(b, 'chef', 1440, 900);
    await zuZeiten(p, true);
    const r = await p.evaluate(async () => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      document.querySelector('[data-zkansicht="konto"]').click(); await w(2000);
      const d = document.getElementById('zkRegeln'); if (!d) return { fehlt: 'Soll je Wochentag' };
      d.open = true; await w(200);
      const f = document.querySelector('#zkRegeln [data-rgtag="u"]'); if (!f) return { fehlt: 'Feld Urlaub' };
      const uid = f.getAttribute('data-rguid');
      f.value = '26,5';
      const mo = document.querySelector('#zkRegeln [data-rguid="' + uid + '"][data-rgtag="1"]'); mo.value = '8';
      document.querySelector('[data-zkregelnsichern]').click(); await w(1200);
      const doc = await firebase.firestore().collection('firmen/koerperformen/lohnEinstellungen').doc('zeitregeln').get();
      const regel = ((doc.data() || {}).regeln || {})[uid] || {};
      return { uid, regel };
    });
    pruefe('Feld „Urlaub" im Soll-Formular, gespeichert als Tage (26,5 → 26.5)', r.regel && r.regel.u === 26.5, JSON.stringify(r));
    pruefe('… und die Stunden weiter als Minuten (8 → 480)', r.regel && r.regel[1] === 480, JSON.stringify(r));
    const falsch = await p.evaluate(async () => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      const d = document.getElementById('zkRegeln'); if (d) d.open = true;
      const f = document.querySelector('#zkRegeln [data-rgtag="u"]'); f.value = '400';
      document.querySelector('[data-zkregelnsichern]').click(); await w(800);
      const doc = await firebase.firestore().collection('firmen/koerperformen/lohnEinstellungen').doc('zeitregeln').get();
      return (((doc.data() || {}).regeln || {})[f.getAttribute('data-rguid')] || {}).u;
    });
    pruefe('GEGENPROBE: 400 Tage Urlaub wird nicht gespeichert (es bleibt 26,5)', falsch === 26.5, String(falsch));
    pruefe('Soll-Formular ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 6. Am Rechner: Taste Z, zwei Spalten ──');
  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, 'mitarbeiter', w, h);
    await p.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
    await p.keyboard.press('z');
    await p.waitForTimeout(1500);
    const s = await p.evaluate(() => {
      const sp = [...document.querySelectorAll('#ichPaneZeiten > .st-spalte')].map(x => x.getBoundingClientRect());
      const k = document.getElementById('stKontoKarte').getBoundingClientRect();
      return { ansicht: (document.querySelector('.view.show') || {}).id,
        nebeneinander: sp.length === 2 && sp[1].left > sp[0].right,
        kontoLinks: k.left < sp[1].left, quer: document.documentElement.scrollWidth - innerWidth };
    });
    pruefe(w + ' px: Taste Z öffnet „Meine Zeiten"', s.ansicht === 'view-zeit', s.ansicht);
    pruefe(w + ' px: zwei Spalten, „Mein Konto" links bei „Jetzt"', s.nebeneinander && s.kontoLinks, JSON.stringify(s));
    pruefe(w + ' px: nichts ragt seitlich hinaus', s.quer <= 0, s.quer);
    await p.close();
  }

  console.log('\n── 7. Der Weg über „Alles" ──');
  {
    const p = await oeffne(b, 'chef', 390, 844);
    const r = await p.evaluate(async () => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      document.querySelector('#bereichKopf').click(); await w(500);
      const z = [...document.querySelectorAll('#allesLade [data-alles]')].find(x => /Zeiten des Teams/.test(x.textContent));
      if (!z) return { fehlt: true };
      z.click(); await w(1400);
      return { ansicht: (document.querySelector('.view.show') || {}).id };
    });
    pruefe('„Alles" → „Zeiten des Teams" öffnet den Reiter „Team"', r.ansicht === 'view-zeitteam', JSON.stringify(r));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Zeiten als Bereich: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Zeiten als eigener Bereich: Knopf, Konto, Resturlaub, Team, Urlaubsanspruch — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})();
