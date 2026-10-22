/* ── Der Bericht: aus der Kopfzeile in die Verwaltung ─────────────────
   Bis Runde 179 stand hier: „der Knopf soll direkt neben dem Logo stehen
   sodass man ihn immer und direkt klicken kann."

   Runde 183 hat ihn bewusst aus der Kopfzeile genommen. Aus dem Betrieb,
   22.10.2026: „das problem mit dem zu viel bleibt immer noch bestehen" —
   zu viele Menüpunkte, zu viel auf einem Bildschirm. Und: „jede Funktion
   hat ihren Sinn" — also nicht streichen, sondern an EINER Stelle
   behalten. Oben bleiben nur Dinge, die JEDER braucht; der Bericht ist
   Chef-Sache und steht unter Verwaltung → System, Karte „Bericht"
   („Bericht an mich senden").

   Was hier deshalb geprüft wird:

     1. Oben ist er weg — in JEDER Ansicht, nicht nur auf der Startseite.
        Ein halb entfernter Knopf, der in einer Gruppe doch wieder
        auftaucht, wäre schlimmer als einer, der immer da ist.
     2. Der Bericht ist nicht verloren: Verwaltung → System → „Bericht an
        mich senden" ist da, beschriftet und trifft ≥ 44 × 44 (Hit-Test).
     3. Er schickt WAS — den eingestellten Zeitraum, ohne Merkwert 30 Tage.
     4. Er sperrt sich, solange gesendet wird. Ein Bericht, den man
        dreimal antippt, kommt dreimal an.
     5. Der gemerkte Zeitraum (PREFS.berichtTage) steht in der Karte und
        wird verschickt.
     6. Nur die Verwaltung sieht ihn — mit Gegenprobe über Leiter UND
        Mitarbeiter. Der Bericht ist serverseitig Chef-Sache.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
const pruefe = (b, m) => { if (!b) errs.push(m); };

async function seite(b, stub, prefs) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  p.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text())) {
      errs.push('KONSOLE: ' + m.text().slice(0, 160));
    }
  });
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript({ path: path.join(SP, stub) });
  if (prefs) {
    await p.addInitScript(`try{ localStorage.setItem('kf_prefs', ${JSON.stringify(JSON.stringify(prefs))}); }catch(e){}`);
  }
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2800);
  return p;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  /* Der Weg eines Menschen: Verwaltung (Seitenleiste oder untere
     Leiste, je nachdem was im Bild ist) → Kachel „System". */
  const zumBericht = (p) => p.evaluate(async () => {
    const w = (ms) => new Promise(r => setTimeout(r, ms));
    const v = [...document.querySelectorAll('#side [data-group="g-chef"], .mobnav [data-group="g-chef"]')]
      .find(e => e.offsetParent);
    if (!v) return { weg: 'kein Knopf „Verwaltung" im Bild' };
    v.click(); await w(600);
    const sys = [...document.querySelectorAll('[data-cgo="system"]')].find(e => e.offsetParent);
    if (!sys) return { weg: 'keine Kachel „System"' };
    sys.click(); await w(700);
    /* Die Karte „Bericht" startet zugeklappt (wie jede Faltkarte am
       Handy). Der Knopf hat dann zwar ein Kästchen, ist aber nicht zu
       treffen — ein Mensch klappt sie zuerst auf. */
    const karte = document.querySelector('[data-fold="monatsbericht"]');
    if (karte && karte.classList.contains('zu')) {
      const kopf = karte.querySelector(':scope > .fold-head');
      if (kopf) { kopf.click(); await w(600); }
    }
    return { weg: '' };
  });
  /* Trefferfläche wie in den anderen Durchläufen: was elementFromPoint
     vom Knopf trifft, nicht was er zu sein behauptet. */
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

  // ══ 1. Verwaltung: oben weg, in jeder Ansicht ══
  {
    const p = await seite(b, 'stub-chef.js');
    const ueberall = await p.evaluate(async () => {
      const gruppen = [...document.querySelectorAll('.mobnav [data-group]')]
        .map(x => x.getAttribute('data-group'));
      const da = [];
      for (const g of gruppen) {
        document.querySelector('.mobnav [data-group="' + g + '"]').click();
        await new Promise(r => setTimeout(r, 350));
        const k = document.getElementById('tbBericht');
        if (k && k.offsetParent !== null) da.push(g);
      }
      return { gruppen, da };
    });
    console.log('Kopfzeile, alle Gruppen:', JSON.stringify(ueberall));
    pruefe(ueberall.gruppen.length >= 5,
      'GRUPPEN: nur ' + ueberall.gruppen.length + ' gefunden — der Durchlauf misst zu wenig');
    // Runde 183: „das problem mit dem zu viel bleibt immer noch bestehen" — oben nur, was jeder braucht.
    pruefe(ueberall.da.length === 0,
      'NOCH OBEN: der Berichts-Knopf steht in der Kopfzeile in ' + JSON.stringify(ueberall.da));

    // ══ 2. Die neue Stelle: Verwaltung → System → „Bericht an mich senden" ══
    const weg = await zumBericht(p);
    pruefe(!weg.weg, 'WEG: ' + weg.weg);
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      await p.setViewportSize({ width: w, height: h });
      await p.waitForTimeout(300);
      const wo = await p.evaluate(async (SRC) => {
        const T = eval('(' + SRC + ')');
        const k = document.getElementById('repTestSend');
        if (!k || k.offsetParent === null) return { da: false };
        k.scrollIntoView({ block: 'center' });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const m = T(k);
        return { da: true, text: k.textContent.trim(), w: m.w, h: m.h,
          karte: !!k.closest('[data-fold="monatsbericht"]'),
          quer: document.documentElement.scrollWidth - innerWidth };
      }, TREFFER.toString());
      console.log(w + ' px, Verwaltung → System:', JSON.stringify(wo));
      pruefe(wo.da, w + ' px FEHLT: „Bericht an mich senden" ist unter Verwaltung → System nicht zu sehen');
      pruefe(wo.karte && /Bericht an mich senden/.test(wo.text || ''),
        w + ' px BESCHRIFTUNG: „' + wo.text + '" — erwartet „Bericht an mich senden" in der Karte „Bericht"');
      pruefe(wo.w >= 44 && wo.h >= 44,
        w + ' px ZU KLEIN: Trefferfläche ' + wo.w + '×' + wo.h + ' statt ≥ 44 × 44');
      pruefe(wo.quer <= 0, w + ' px QUER: die Seite ragt ' + wo.quer + ' px hinaus');
    }
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForTimeout(300);

    // ══ 3./4. Was schickt er, und sperrt er sich? ══
    const klick = await p.evaluate(async () => {
      /* Eigene Attrappe für sendTestReport: Unter Last kam ein später
         sheetsPush („putzplan") NACH dem Klick an und überschrieb
         window.__aufruf (wie in test-bericht, 22.10.2026). Geprüft wird
         dasselbe, nur ohne fremden Aufruf in der Messung. */
      window.__antwort = window.__antwort || {};
      window.__antwort.sendTestReport = (d) => { window.__berichtAufruf = { name: 'sendTestReport', data: d };
        return Promise.resolve({ data: { ok: true, empfaenger: 1, tage: (d && d.tage) || 30 } }); };
      window.__berichtAufruf = null;
      const k = document.getElementById('repTestSend');
      k.click();
      // Sofort ein zweites Mal: darf NICHT durchgehen
      const gesperrtSofort = k.disabled === true;
      k.click();
      await new Promise(r => setTimeout(r, 900));
      return { aufruf: window.__berichtAufruf, gesperrtSofort,
        wiederFrei: document.getElementById('repTestSend').disabled !== true,
        note: (document.getElementById('repTestNote') || {}).textContent || '' };
    });
    console.log('Klick:', JSON.stringify(klick));
    pruefe(klick.aufruf && klick.aufruf.name === 'sendTestReport',
      'KLICK: es wird nicht sendTestReport gerufen (' + JSON.stringify(klick.aufruf) + ')');
    pruefe(klick.aufruf && klick.aufruf.data && klick.aufruf.data.tage === 30,
      'VORGABE: geschickt wurden ' + JSON.stringify(klick.aufruf && klick.aufruf.data) +
      ' — ohne gemerkte Einstellung sind 30 Tage erwartet');
    pruefe(klick.gesperrtSofort,
      'DOPPELT: der Knopf sperrt sich nicht — dreimal getippt heisst drei Mails');
    pruefe(klick.wiederFrei,
      'HAENGT: der Knopf bleibt nach dem Senden gesperrt');
    /* Die Rückmeldung nennt den Zeitraum — „gesendet" allein sagt nicht,
       worüber. */
    pruefe(/30 Tage/.test(klick.note) && /an dich/.test(klick.note),
      'MELDUNG: „' + klick.note + '" — erwartet Zeitraum und „an dich"');
    await p.close();
  }

  /* ══ 5. Der gemerkte Zeitraum ══
     Die Karte stellt ihn wieder ein, und genau der wird verschickt. */
  {
    const p = await seite(b, 'stub-chef.js', { berichtTage: 90 });
    const weg = await zumBericht(p);
    pruefe(!weg.weg, 'WEG (gemerkt): ' + weg.weg);
    const r = await p.evaluate(async () => {
      /* Eigene Attrappe für sendTestReport: Unter Last kam ein später
         sheetsPush („putzplan") NACH dem Klick an und überschrieb
         window.__aufruf (wie in test-bericht, 22.10.2026). Geprüft wird
         dasselbe, nur ohne fremden Aufruf in der Messung. */
      window.__antwort = window.__antwort || {};
      window.__antwort.sendTestReport = (d) => { window.__berichtAufruf = { name: 'sendTestReport', data: d };
        return Promise.resolve({ data: { ok: true, empfaenger: 1, tage: (d && d.tage) || 30 } }); };
      window.__berichtAufruf = null;
      const sel = document.getElementById('repTestTage');
      const wert = sel ? sel.value : null;
      const k = document.getElementById('repTestSend');
      if (k) k.click();
      await new Promise(r => setTimeout(r, 900));
      return { wert, aufruf: window.__berichtAufruf };
    });
    console.log('Mit gemerkten 90 Tagen:', JSON.stringify(r));
    pruefe(r.wert === '90',
      'GEMERKT: die Karte steht auf „' + r.wert + '" — erwartet die zuletzt eingestellten 90 Tage');
    pruefe(r.aufruf && r.aufruf.data && r.aufruf.data.tage === 90,
      'GESCHICKT: ' + JSON.stringify(r.aufruf && r.aufruf.data) + ' — erwartet 90 Tage');
    await p.close();
  }

  /* ══ GEGENPROBE über die Rolle ══
     Der Bericht ist serverseitig Chef-Sache. Ein sichtbarer Knopf, der
     in „permission-denied" läuft, verspricht etwas, das nicht passiert. */
  for (const stub of ['stub-leiter.js', 'stub-mitarbeiter.js']) {
    const p = await seite(b, stub);
    const oben = await p.evaluate(() => {
      const k = document.getElementById('tbBericht');
      return !!k && k.offsetParent !== null;
    });
    /* Den Weg trotzdem gehen: wo die Rolle eine Verwaltung hat, darf die
       Karte „Bericht" darin nicht stehen. */
    await zumBericht(p);
    const karte = await p.evaluate(() => {
      const k = document.getElementById('repTestSend');
      return !!k && k.offsetParent !== null;
    });
    console.log(stub + ':', JSON.stringify({ oben, karte }));
    pruefe(!oben && !karte,
      'ROLLE: ' + stub + ' sieht den Bericht (' + JSON.stringify({ oben, karte }) +
      ') — den Bericht bekommt diese Rolle nie, der Server weist sie ab');
    await p.close();
  }

  await b.close();
  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Bericht: oben in keiner Ansicht mehr, unter Verwaltung → System ' +
      'da, schickt den gemerkten Zeitraum an einen selbst — und nur ' +
      'die Verwaltung sieht ihn');
  process.exit(errs.length ? 1 : 0);
})();
