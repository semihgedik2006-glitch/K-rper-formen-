/* ── Bewegung in „Mein Bereich" ───────────────────────────────────────
   Aus dem Betrieb gewünscht: „auch paar bessere Animationen und so."

   Der interessante Teil ist nicht, DASS sich etwas bewegt — das ist in
   zwei Zeilen CSS erledigt und in derselben Zeit kaputt. Interessant ist,
   WO sich nichts bewegen darf:

     1. Der Reiterwechsel und das Blättern im Kalender bewegen sich, und
        vor/zurück laufen in verschiedene Richtungen. Sonst sagt die
        Bewegung nichts, sie kostet nur Zeit.
     2. Ein zweiter Klick auf dieselbe Richtung bewegt WIEDER. Ohne den
        Neustart der Animation liefe sie genau einmal, und danach nie
        mehr — der klassische Fehler bei einer Klasse, die man nur
        hinzufügt.
     3. Die Notizliste darf sich beim Tippen NICHT bewegen. Sie wird bei
        jedem Tastendruck neu gezeichnet; eine Animation je Zeile wäre
        dort kein Einlaufen, sondern ein Flackern bei jedem Buchstaben.
     4. Wer „Bewegung reduzieren" eingestellt hat, bekommt nichts davon —
        und zwar geprüft, nicht behauptet.
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SP = __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errs = [];
const pruefe = (b, m) => { if (!b) errs.push(m); };

const NOTIZEN = [
  { id: 'n1', text: 'Frau Berger: linkes Knie.', kategorie: 'kunde', fest: false, ts: 1000 },
  { id: 'n2', text: 'Beinpresse quietscht.', kategorie: 'nachfassen', fest: false, ts: 2000 },
  { id: 'n3', text: 'Einheit Rücken lief gut.', kategorie: 'training', fest: false, ts: 3000 },
  { id: 'n4', text: 'Herr Klein: zweiter Termin.', kategorie: 'kunde', fest: false, ts: 4000 },
  { id: 'n5', text: 'Handtücher nachbestellen.', kategorie: 'sonst', fest: false, ts: 5000 },
  { id: 'n6', text: 'Erstgespräch vorbereiten.', kategorie: 'kunde', fest: false, ts: 6000 }
];

async function seite(b, ruhe) {
  const p = await b.newPage({
    viewport: { width: 430, height: 900 },
    reducedMotion: ruhe ? 'reduce' : 'no-preference'
  });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript({ path: path.join(SP, 'stub-chef.js') });
  await p.addInitScript(`window.__privat = { notizen: ${JSON.stringify(NOTIZEN)} };`);
  await p.goto(APP, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2600);
  await p.evaluate(async () => {
    document.querySelector('.mobnav [data-group="g-ich"]').click();
    await new Promise(r => setTimeout(r, 500));
  });
  return p;
}

/* Was läuft gerade wirklich? getAnimations() beantwortet das aus der
   Sicht des Browsers — eine Klasse am Element beweist gar nichts, weil
   die zugehörige Regel in einer Medienabfrage stehen kann, die nicht
   greift. Genau daran wäre Punkt 4 sonst vorbeigelaufen. */
const laufen = (p, sel) => p.evaluate(s => {
  const el = document.querySelector(s);
  if (!el) return null;
  return el.getAnimations().map(a => a.animationName || a.constructor.name);
}, sel);

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  // ══ 1. Reiterwechsel bewegt sich ══
  {
    const p = await seite(b, false);
    const r = await p.evaluate(async () => {
      (function(){var s=document.querySelector('[data-subview="persoenlich"]');if(s) s.click();})();
      document.querySelector('[data-perstab="notizen"]').click();
      const el = document.getElementById('ichPaneNotizen');
      // Sofort messen: nach 260 ms ist sie vorbei.
      const sofort = el.getAnimations().map(a => a.animationName);
      await new Promise(r => setTimeout(r, 700));
      const danach = el.getAnimations().map(a => a.animationName);
      return { sofort, danach };
    });
    console.log('Reiterwechsel:', JSON.stringify(r.sofort), '· nach 700ms:', JSON.stringify(r.danach));
    pruefe(r.sofort.indexOf('ichPaneEin') >= 0,
      'REITER: beim Wechsel läuft keine Bewegung (' + JSON.stringify(r.sofort) + ')');
    pruefe(r.danach.length === 0,
      'REITER: die Bewegung läuft noch nach 700 ms (' + JSON.stringify(r.danach) +
      ') — eine Animation, die nicht aufhört, kostet dauerhaft Rechenzeit');

    // ══ 3. Tippen in der Suche bewegt NICHTS ══
    const tippen = await p.evaluate(async () => {
      const s = document.getElementById('ichNotizSuche');
      s.value = 'k';
      s.dispatchEvent(new Event('input', { bubbles: true }));
      const zeilen = [...document.querySelectorAll('#ichNotizListe .ich-notiz')];
      return {
        anzahl: zeilen.length,
        animationen: zeilen.reduce((n, z) => n + z.getAnimations().length, 0),
        pane: document.getElementById('ichPaneNotizen').getAnimations().length
      };
    });
    console.log('Beim Tippen:', tippen.anzahl, 'Zeilen ·',
      tippen.animationen, 'Animationen · Reiter:', tippen.pane);
    pruefe(tippen.anzahl > 0, 'TIPPEN: die Liste ist leer, da lässt sich nichts messen');
    pruefe(tippen.animationen === 0,
      'FLACKERN: beim Tippen laufen ' + tippen.animationen + ' Animationen in ' +
      'der Notizliste — sie wird bei JEDEM Buchstaben neu gezeichnet');
    pruefe(tippen.pane === 0,
      'FLACKERN: beim Tippen bewegt sich der ganze Reiter (' + tippen.pane + ')');
    await p.close();
  }

  // ══ 2. Kalender: Richtung, und beim zweiten Mal wieder ══
  {
    const p = await seite(b, false);
    const r = await p.evaluate(async () => {
      (function(){var s=document.querySelector('[data-subview="ich"]');if(s) s.click();})();
      document.querySelector('[data-ichtab="kalender"]').click();
      await new Promise(r => setTimeout(r, 800));
      const kal = document.getElementById('ichKalender');
      const namen = () => kal.getAnimations().map(a => a.animationName);

      document.getElementById('ichMonatNext').click();
      const vor1 = namen();
      /* Der zweite Klick kommt MITTEN in der laufenden Bewegung — so
         blättert man wirklich, wenn man drei Monate weiter will. Nur
         dann hängt die Klasse noch am Element, und nur dann zeigt sich,
         ob die Animation neu gestartet wird. Mit 600 ms Pause dazwischen
         hätte der Aufräumer die Klasse längst entfernt, und der
         Durchlauf wäre auch ohne Neustart grün gewesen. */
      await new Promise(r => setTimeout(r, 80));
      document.getElementById('ichMonatNext').click();
      const vor2 = kal.getAnimations()
        .map(a => ({ name: a.animationName, t: Math.round(a.currentTime || 0) }));
      await new Promise(r => setTimeout(r, 600));
      document.getElementById('ichMonatPrev').click();
      const zurueck = namen();
      await new Promise(r => setTimeout(r, 600));
      document.getElementById('ichMonatHeute').click();
      const heute = namen();
      return { vor1, vor2, zurueck, heute };
    });
    console.log('Vor:', JSON.stringify(r.vor1), '· zweites Mal:', JSON.stringify(r.vor2));
    console.log('Zurück:', JSON.stringify(r.zurueck), '· Heute:', JSON.stringify(r.heute));

    pruefe(r.vor1.indexOf('ichKalVor') >= 0,
      'KALENDER: „vor" bewegt nichts (' + JSON.stringify(r.vor1) + ')');
    /* Der eigentliche Fehler, den dieser Durchlauf verhindert: der
       zweite Klick kam während der ersten Bewegung. Es genügt NICHT,
       dass eine Animation läuft — sie lief ja schon. Sie muss von vorn
       laufen, und das steht in der verstrichenen Zeit. */
    const zweite = r.vor2.find(a => a.name === 'ichKalVor');
    pruefe(!!zweite,
      'KALENDER: der ZWEITE Klick auf „vor" bewegt nichts mehr (' +
      JSON.stringify(r.vor2) + ')');
    pruefe(zweite && zweite.t <= 20,
      'KALENDER: der zweite Klick startet die Bewegung nicht neu — sie ' +
      'läuft bei ' + (zweite ? zweite.t : '?') + ' ms weiter, statt bei 0 zu ' +
      'beginnen. Wer schnell drei Monate weiterblättert, sieht ab dem ' +
      'zweiten Klick nichts mehr.');
    pruefe(r.zurueck.indexOf('ichKalZurueck') >= 0,
      'KALENDER: „zurück" läuft nicht in die andere Richtung (' +
      JSON.stringify(r.zurueck) + ')');
    pruefe(r.vor1.indexOf('ichKalZurueck') < 0 && r.zurueck.indexOf('ichKalVor') < 0,
      'KALENDER: vor und zurück bewegen sich gleich — dann sagt die ' +
      'Bewegung nichts');
    pruefe(r.heute.length === 0,
      'KALENDER: „Heute" bewegt sich in eine Richtung (' +
      JSON.stringify(r.heute) + ') — es geht weder vor noch zurück');
    await p.close();
  }

  /* ══ 4. GEGENPROBE: „Bewegung reduzieren" ══
     Ohne diesen Durchlauf wäre die Rücksicht eine Behauptung. */
  {
    const p = await seite(b, true);
    const r = await p.evaluate(async () => {
      (function(){var s=document.querySelector('[data-subview="ich"]');if(s) s.click();})();
      document.querySelector('[data-ichtab="kalender"]').click();
      await new Promise(r => setTimeout(r, 800));
      const kal = document.getElementById('ichKalender');
      document.getElementById('ichMonatNext').click();
      const kalAnim = kal.getAnimations().length;
      const kalKlasse = kal.className;
      (function(){var s=document.querySelector('[data-subview="persoenlich"]');if(s) s.click();})();
      document.querySelector('[data-perstab="notizen"]').click();
      const pane = document.getElementById('ichPaneNotizen');
      return {
        kalAnim, kalKlasse,
        paneAnim: pane.getAnimations().length,
        paneKlasse: pane.className,
        /* Sichtbar muss trotzdem alles sein — „both" bei einer nicht
           laufenden Animation hat schon Seiten unsichtbar gemacht. */
        sichtbar: pane.offsetParent !== null,
        deckkraft: getComputedStyle(pane).opacity
      };
    });
    console.log('Mit Ruhe — Kalender:', r.kalAnim, 'Animationen, Klasse',
      JSON.stringify(r.kalKlasse));
    console.log('  Reiter:', r.paneAnim, '· sichtbar:', r.sichtbar, '· Deckkraft:', r.deckkraft);
    pruefe(r.kalAnim === 0 && r.paneAnim === 0,
      'RUHE: es läuft trotzdem Bewegung (Kalender ' + r.kalAnim + ', Reiter ' +
      r.paneAnim + ')');
    pruefe(!/ich-kal-vor|ich-pane-ein/.test(r.kalKlasse + ' ' + r.paneKlasse),
      'RUHE: die Bewegungs-Klassen kleben am Element (' + r.kalKlasse + ' | ' +
      r.paneKlasse + ') — sie springen los, sobald jemand die Einstellung ändert');
    pruefe(r.sichtbar && r.deckkraft === '1',
      'RUHE: der Reiter ist unsichtbar statt nur unbewegt (Deckkraft ' +
      r.deckkraft + ')');
    await p.close();
  }

  await b.close();
  console.log(errs.length
    ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Bewegung: Reiter und Kalender bewegen sich, vor und zurück in ' +
      'verschiedene Richtungen und auch beim zweiten Klick, die Notizliste ' +
      'beim Tippen gar nicht — und bei „Bewegung reduzieren" nichts davon');
  process.exit(errs.length ? 1 : 0);
})();
