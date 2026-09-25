/* ══════════════════════════════════════════════════════════════════════
   DAS ABO-MODELL IN DER DEMO — VORFUEHRBAR, NICHT NUR VORHANDEN

   Aus dem Betrieb, 21.9.2026:
     „Ich kann im Demo Modus das mit den Abo Modellen nicht testen."

   Er hatte recht, und der Grund war nicht, dass etwas fehlte. Die
   Zustaende gab es alle — aber umstellen liess sich nur ueber einen
   Zusatz in der Adresse (?abo=nurlesen), der nirgends stand. Dazu
   kannte die Demo davon drei von neun, und zwar die uninteressanten:
   ganz offen und ganz zu. Die drei Mahnstufen, in denen noch nichts
   gesperrt ist und trotzdem etwas passiert, liessen sich gar nicht
   zeigen.

   EINE EINSTELLUNG, DIE ES NUR IN DER ADRESSZEILE GIBT, GIBT ES FUER
   DEN BENUTZER NICHT. Dieser Durchlauf haelt fest, dass sie jetzt
   bedienbar ist — ueber den Weg, den ein Mensch nimmt.

   Vier Fragen:
     1. Steht die Auswahl in der Demo-Leiste, mit allen Zustaenden?
     2. Zeigt jeder Zustand eine vollstaendige Karte — Ueberschrift UND
        Erklaerung darunter? Eine halb gefuellte Karte ist in einer
        Vorfuehrung schlimmer als gar keine.
     3. Widerspricht sich die Demo nicht: sperrt die Leiste oben genau
        dann, wenn der Zustand es sagt?
     4. Reisen Rolle und Zustand gemeinsam, und passt die Leiste aufs
        Handy?
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}

/* Was in welchem Zustand zu sehen sein MUSS.

   `sperrt` ist die Rechnung aus functions/index.js (aboZugriff): nur
   'nurlesen' und 'zu' halten das Schreiben an, alles andere laeuft.
   Sie steht hier ein drittes Mal — und das ist Absicht: waeren es
   Aufrufe derselben Funktion, pruefte der Durchlauf, dass eine Funktion
   sich selbst gleicht. */
const ZUSTAENDE = [
  { id: 'test',       wort: 'Testphase',      sperrt: false, sagt: /Noch \d+ Tage|Noch einen Tag|abgelaufen/ },
  { id: 'aktiv',      wort: 'läuft',          sperrt: false, sagt: /netto im Monat/ },
  { id: 'gratis',     wort: 'kostenlos',      sperrt: false, sagt: /Dauerhaft kostenlos/ },
  { id: 'faellig',    wort: 'Zahlung offen',  sperrt: false, sagt: /Seit heute/ },
  { id: 'mahnung1',   wort: 'Zahlung offen',  sperrt: false, sagt: /Seit 7 Tagen/ },
  { id: 'mahnung2',   wort: 'Zahlung offen',  sperrt: false, sagt: /Seit 14 Tagen/ },
  { id: 'nurlesen',   wort: 'nur noch lesen', sperrt: true,  sagt: /nichts mehr anlegen/ },
  { id: 'zu',         wort: 'stillgelegt',    sperrt: true,  sagt: /nicht gelöscht/ },
  { id: 'gekuendigt', wort: 'gekündigt',      sperrt: false, sagt: /Läuft noch bis/ },
  { id: 'keins',      wort: 'Alles freigeschaltet', sperrt: false, sagt: /kein Abo hinterlegt/ }
];

/* Der Weg zur Abo-Karte, so wie ihn jemand geht: untere Leiste → Lade
   „Alles" → Verwaltung → Reiter System. NICHT ueber einen Aufruf von
   innen: renderAboKarte() liegt in einer Kapsel, und ein Durchlauf, der
   sie von aussen riefe, pruefte die Funktion statt den Weg. */
async function zurAboKarte(p) {
  await p.evaluate(async () => {
    const alles = document.querySelector('.mobnav [data-group="g-alles"]');
    if (alles) { alles.click(); await new Promise(r => setTimeout(r, 400)); }
    const chef = document.querySelector('#allesLadeInhalt [data-alles="chef"]') ||
                 document.querySelector('[data-subview="chef"]');
    if (chef) chef.click();
  });
  await p.waitForTimeout(900);
  await p.evaluate(() => {
    const t = [...document.querySelectorAll('#chefTabs .chef-tab')]
      .find(x => /system/i.test(x.textContent));
    if (t) t.click();
  });
  await p.waitForTimeout(900);
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  // ══ 1. Die Auswahl gibt es, und sie kennt alle Zustaende ══
  console.log('\n── Die Auswahl in der Demo-Leiste ──');
  {
    const p = await b.newPage({ viewport: { width: 390, height: 900 } });
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3000);

    const aus = await p.evaluate(() => {
      const s = document.getElementById('demoAbo');
      if (!s) return null;
      return {
        sichtbar: !!s.getClientRects().length,
        werte: [...s.options].map(o => o.value),
        beschriftung: [...s.options].map(o => o.textContent),
        steht: s.value
      };
    });
    pruefe('es gibt eine Auswahl für den Abo-Zustand', !!aus);
    if (aus) {
      pruefe('sie ist sichtbar', aus.sichtbar);
      console.log('  Zustände: ' + aus.werte.join(', '));
      ZUSTAENDE.forEach(z => pruefe('  … kennt „' + z.id + '"',
        aus.werte.indexOf(z.id) >= 0, aus.werte.join(' ')));
      /* Voreinstellung: die Testphase. Wer die Demo einfach oeffnet,
         darf nie in einer Sperre landen — das waere eine Vorfuehrung,
         die mit „geht nicht" anfaengt. */
      pruefe('ohne Zusatz steht sie auf der Testphase', aus.steht === 'test', aus.steht);
      /* Die Beschriftung soll etwas anderes sein als die Kennung. Wer
         in einer Vorfuehrung „mahnung2" liest, liest den Datenbestand
         und nicht das Produkt — aus demselben Grund steht in der
         Abo-Karte „2. Mahnung" und nicht der Feldwert.

         Geprueft wird genau das und nicht mehr: verschieden von der
         Kennung, und mindestens zwei Woerter. Der erste Versuch hier
         war ein Muster ueber Klein- und Leerzeichen — es schlug bei
         „Abo: 1. Mahnung" an, obwohl die Beschriftung in Ordnung ist,
         und haette damit eine richtige Zeile rot gemacht. */
      pruefe('jede Beschriftung ist lesbar, nicht die Kennung',
        aus.beschriftung.every((t, i) =>
          t.trim() !== aus.werte[i] && /\S\s\S/.test(t.trim())),
        aus.beschriftung.join(' | '));
    }

    /* GEGENPROBE: ohne ?demo darf davon nichts zu sehen sein. Die
       Leiste ist ein Werkzeug der Vorfuehrung und gehoert keinem
       Kunden auf den Bildschirm. */
    await p.goto(APP, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2000);
    pruefe('GEGENPROBE ohne ?demo ist die Leiste unsichtbar',
      await p.evaluate(() => {
        const bar = document.getElementById('demoBar');
        return !bar || !bar.getClientRects().length;
      }));
    await p.close();
  }

  // ══ 2. und 3. Jeder Zustand zeigt sich, und die Demo widerspricht sich nicht ══
  console.log('\n── Die zehn Zustände ──');
  for (const z of ZUSTAENDE) {
    const p = await b.newPage({ viewport: { width: 390, height: 900 } });
    const fehler = [];
    p.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.goto(APP + '?demo=chef&abo=' + z.id, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3000);
    await zurAboKarte(p);

    const st = await p.evaluate(() => {
      const k = document.getElementById('aboKarte');
      const stand = document.getElementById('aboStand');
      const l = document.getElementById('aboLeiste');
      const s = document.getElementById('demoAbo');
      return {
        auswahl: s ? s.value : '',
        sichtbar: !!(k && k.getClientRects().length),
        kopf: stand && stand.querySelector('b') ? stand.querySelector('b').textContent.trim() : '',
        unter: stand && stand.querySelector('span') ? stand.querySelector('span').textContent.trim() : '',
        zweiZeilen: (function () {
          const b = stand && stand.querySelector('b');
          const sp = stand && stand.querySelector('span');
          if (!b) return false;
          if (!sp) return true;          // Zustaende ohne zweite Zeile
          const rb = b.getBoundingClientRect(), rs = sp.getBoundingClientRect();
          return rs.top >= rb.bottom - 1;
        })(),
        zeilenInfo: (function () {
          const b = stand && stand.querySelector('b');
          const sp = stand && stand.querySelector('span');
          if (!b || !sp) return '';
          const rb = b.getBoundingClientRect(), rs = sp.getBoundingClientRect();
          return 'b endet bei ' + Math.round(rb.bottom) +
                 ', span beginnt bei ' + Math.round(rs.top);
        })(),
        leiste: !!(l && !l.hidden && l.getClientRects().length),
        klasse: document.body.classList.contains('nurlesen')
      };
    });

    console.log('  · ' + z.id + ': „' + st.kopf + '" / „' + st.unter + '"');
    pruefe(z.id + ': die Auswahl behält den Zustand', st.auswahl === z.id, st.auswahl);
    pruefe(z.id + ': die Karte ist zu sehen', st.sichtbar);
    pruefe(z.id + ': die Überschrift nennt den Zustand',
      st.kopf.indexOf(z.wort) >= 0, st.kopf);
    /* Ohne diese Zeile waere „Basic · " gruen — eine Ueberschrift mit
       Trennzeichen und nichts dahinter. Genau das gab es schon einmal. */
    pruefe(z.id + ': darunter steht eine Erklärung', z.sagt.test(st.unter), st.unter);
    /* Zwei Zeilen, nicht eine. Auf dem Bildschirmfoto stand
       „Zahlung offenSeit 14 Tagen." — <b> und <span> liefen ineinander,
       weil #aboStand display:block setzt und beide Kinder inline sind.
       textContent merkt das nie: es liest beides zusammen. Also wird
       hier die gerechnete Darstellung gefragt, nicht der Text. */
    pruefe(z.id + ': Überschrift und Erklärung stehen untereinander',
      st.zweiZeilen, st.zeilenInfo);
    pruefe(z.id + ': die Leiste oben ' + (z.sperrt ? 'warnt' : 'schweigt'),
      st.leiste === z.sperrt, 'Leiste: ' + st.leiste);
    pruefe(z.id + ': das Schreiben ist ' + (z.sperrt ? 'gesperrt' : 'offen'),
      st.klasse === z.sperrt, 'body.nurlesen: ' + st.klasse);
    if (fehler.length) pruefe(z.id + ': keine Skriptfehler', false, fehler[0]);
    await p.close();
  }

  // ══ 4. Beide Werte reisen mit ══
  /* Der Rollenwechsel warf den Abo-Zustand bis zum 21.9. lautlos weg
     (`location.search = '?demo=' + wert`). Gerade der Wechsel ist aber
     das Interessante: dieselbe Sperre sagt dem Chef und dem Team etwas
     anderes. */
  console.log('\n── Rolle und Zustand reisen gemeinsam ──');
  {
    const p = await b.newPage({ viewport: { width: 390, height: 900 } });
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.goto(APP + '?demo=chef&abo=nurlesen', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3000);

    const chefText = await p.evaluate(() =>
      (document.getElementById('aboLeisteText') || {}).textContent || '');
    const chefKnopf = await p.evaluate(() => {
      const k = document.getElementById('aboLeisteKnopf');
      return !!(k && !k.hidden && k.getClientRects().length);
    });

    await p.selectOption('#demoRolle', 'mitarbeiter');
    await p.waitForTimeout(3200);

    /* `(… || {}).value` statt `.value`: faellt eines der Felder weg,
       soll dieser Durchlauf das MELDEN und weiterlaufen. Beim ersten
       Bauen brach er hier ab, und ein Abbruch verschweigt alles, was
       danach kaeme — ausgerechnet in dem Fall, den er finden soll. */
    const nach = await p.evaluate(() => ({
      rolle: (document.getElementById('demoRolle') || {}).value || '',
      abo: (document.getElementById('demoAbo') || {}).value || '',
      text: (document.getElementById('aboLeisteText') || {}).textContent || '',
      knopf: (function () {
        const k = document.getElementById('aboLeisteKnopf');
        return !!(k && !k.hidden && k.getClientRects().length);
      })()
    }));
    pruefe('der Rollenwechsel behält den Abo-Zustand',
      nach.abo === 'nurlesen', nach.abo);
    pruefe('die Rolle ist wirklich gewechselt', nach.rolle === 'mitarbeiter', nach.rolle);
    pruefe('dem Chef wird gesagt, was zu tun ist (Knopf zum Abo)', chefKnopf);
    pruefe('dem Team wird gesagt, dass es nicht an ihm liegt',
      /nicht an dir/.test(nach.text), nach.text);
    pruefe('das Team bekommt KEINEN Knopf zum Abo', !nach.knopf);
    pruefe('GEGENPROBE beide Texte sind verschieden',
      chefText !== nach.text, chefText);

    const konnte = await p.evaluate(() => !!document.getElementById('demoAbo'));
    if (konnte) {
      await p.selectOption('#demoAbo', 'aktiv');
      await p.waitForTimeout(3200);
    }
    pruefe('der Abo-Wechsel behält die Rolle',
      konnte && await p.evaluate(() =>
        ((document.getElementById('demoRolle') || {}).value) === 'mitarbeiter'),
      konnte ? 'Rolle verloren' : 'es gibt keine Abo-Auswahl');
    await p.close();
  }

  // ══ 5. Die Leiste passt aufs Handy ══
  /* Zwei Auswahlfelder statt einem. Bei 390px lag das zweite gemessen
     von 245 bis 408 px in einer 390 px breiten Leiste — zur Haelfte
     hinter dem Rand. Auffallen konnte das nicht: die Leiste hat
     overflow:hidden, die Seite scrollt also nicht seitwaerts. */
  console.log('\n── Die Leiste auf vier Breiten ──');
  for (const breite of [320, 390, 430, 820]) {
    const p = await b.newPage({ viewport: { width: breite, height: 900 } });
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.goto(APP + '?demo=chef&abo=mahnung2', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2600);
    const m = await p.evaluate(() => {
      const bar = document.getElementById('demoBar');
      const r = bar.getBoundingClientRect();
      const s = [...bar.querySelectorAll('select')].map(x => x.getBoundingClientRect());
      return {
        rechts: Math.round(r.right),
        felder: s.map(x => ({ li: Math.round(x.left), re: Math.round(x.right),
                              br: Math.round(x.width), ho: Math.round(x.height) })),
        seitwaerts: document.documentElement.scrollWidth >
                    document.documentElement.clientWidth
      };
    });
    const ueber = m.felder.filter(f => f.re > m.rechts + 1).length;
    const zuSchmal = m.felder.filter(f => f.br < 60).length;
    const zuFlach = m.felder.filter(f => f.ho < 44).length;
    console.log('  ' + breite + 'px: ' +
      m.felder.map(f => f.li + '–' + f.re).join('  ') + '  (Rand ' + m.rechts + ')');
    pruefe(breite + 'px: kein Auswahlfeld hängt über den Rand', ueber === 0);
    pruefe(breite + 'px: beide bleiben breit genug zum Antippen', zuSchmal === 0);
    /* 44px ist die Fingerregel aus test-fingerziele. Ein Schalter, den
       man nicht trifft, ist so gut wie keiner. */
    pruefe(breite + 'px: beide sind 44px hoch', zuFlach === 0);
    pruefe(breite + 'px: die Seite scrollt nicht seitwärts', !m.seitwaerts);
    await p.close();
  }

  /* ══ 5. Der Weg zur Kasse ist begehbar ══════════════════════════════
     Aus dem Betrieb, 21.9.2026, nach der ersten Runde:
       „der demo modus leitet mich nicht auf stripe weiter und dort ist
        auch kein anderer knopf als abo buchen, also kann ich offene
        optionen nicht ausprobieren."

     Beides stimmte. Der Knopf warf eine Erklärung statt weiterzuführen,
     und der zweite Knopf steht erst da, wenn es schon einen Kunden bei
     Stripe gibt — in der Voreinstellung „Testphase" also nie.

     Geprüft wird der ganze Weg, den ein Mensch geht: buchen →
     Zwischenseite → „bezahlt" → und danach muss BEIDES dastehen.
     Die Zwischenseite darf dabei keine Bezahlseite nachstellen; was
     sie sagt, ist Teil der Zusicherung. */
  console.log('\n── Der Weg zur Kasse ──');
  {
    const p = await b.newPage({ viewport: { width: 390, height: 900 } });
    const fehler = [];
    p.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.goto(APP + '?demo=chef', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3000);
    await zurAboKarte(p);

    const vorher = await p.evaluate(() =>
      [...document.querySelectorAll('#aboKnoepfe button')].map(x => x.id));
    pruefe('in der Testphase steht genau ein Knopf da',
      vorher.length === 1 && vorher[0] === 'aboBuchen', vorher.join(' '));

    /* Seit Runde 114 steht vor dem Knopf ein Haken — aus dem Betrieb,
       25.9.2026: „ergänze alle rechtlichen schritte". Ohne ihn bleibt
       der Knopf gesperrt; geprüft wird das hier, bevor gebucht wird. */
    const gesperrt = await p.evaluate(() => document.getElementById('aboBuchen').disabled);
    pruefe('ohne Haken (Unternehmer, AGB, AV-Vertrag) ist „Abo buchen" gesperrt', gesperrt === true);
    await p.evaluate(() => { const z = document.getElementById('aboZustimmung'); z.click(); });
    await p.waitForTimeout(200);
    await p.evaluate(() => document.getElementById('aboBuchen').click());
    await p.waitForTimeout(1800);
    const seite = await p.evaluate(() => {
      const k = document.getElementById('demoStripe');
      if (!k) return null;
      return { text: k.textContent, knoepfe: [...k.querySelectorAll('button')].map(x => x.textContent.trim()) };
    });
    pruefe('der Knopf führt auf eine Zwischenseite', !!seite);
    if (seite) {
      /* DAS IST DER PUNKT, an dem eine Demo gefährlich würde: eine
         nachgebaute Bezahlseite lässt Leute auf Sicherheit, Preise und
         Ablauf schliessen. Sie muss also sagen, dass sie es nicht ist. */
      pruefe('sie sagt, dass sie NICHT Stripe ist',
        /nicht Stripe/i.test(seite.text), seite.text.slice(0, 80));
      pruefe('sie sagt, dass Kartendaten nicht hier landen',
        /Kartendaten/.test(seite.text));
      pruefe('sie bietet beide Ausgänge an',
        seite.knoepfe.length === 2, seite.knoepfe.join(' | '));
      /* GEGENPROBE: kein Feld, in das man etwas eintippen könnte. Ein
         Eingabefeld auf dieser Seite wäre der Anfang einer Attrappe. */
      pruefe('GEGENPROBE kein Eingabefeld auf der Zwischenseite',
        await p.evaluate(() =>
          document.querySelectorAll('#demoStripe input, #demoStripe form').length === 0));
    }

    await p.evaluate(() => document.querySelector('#demoStripe [data-demoweg="0"]').click());
    await p.waitForTimeout(3400);
    const adresse = await p.evaluate(() => location.search);
    /* Ohne die Berichtigung an kasseRueckweg() stünde hier nur noch der
       nackte Pfad: die Funktion hat bis zum 21.9. die GANZE Adresse
       weggeräumt, samt ?demo= und ?firma=. */
    pruefe('die Demo bleibt nach dem Kassengang in der Adresse',
      /demo=chef/.test(adresse), adresse);
    pruefe('und das Merkmal der Kasse ist weg', !/kasse=/.test(adresse), adresse);

    await zurAboKarte(p);
    const nachher = await p.evaluate(() => ({
      knoepfe: [...document.querySelectorAll('#aboKnoepfe button')].map(x => x.id),
      stand: (document.getElementById('aboStand') || {}).textContent || ''
    }));
    pruefe('danach läuft das Abo', /läuft/.test(nachher.stand), nachher.stand);
    pruefe('und jetzt steht auch der Weg zum Kundenportal da',
      nachher.knoepfe.indexOf('aboVerwalten') >= 0, nachher.knoepfe.join(' '));

    await p.evaluate(() => document.getElementById('aboVerwalten').click());
    await p.waitForTimeout(1800);
    const portal = await p.evaluate(() => {
      const k = document.getElementById('demoStripe');
      return k ? [...k.querySelectorAll('button')].map(x => x.textContent.trim()) : null;
    });
    pruefe('das Kundenportal hat einen eigenen Weg mit Kündigung',
      !!portal && portal.length === 3 && /[Kk]ündig/.test(portal.join(' ')),
      String(portal));
    await p.evaluate(() => document.querySelector('#demoStripe [data-demoweg="0"]').click());
    await p.waitForTimeout(3400);
    await zurAboKarte(p);
    pruefe('nach der Kündigung steht „gekündigt" auf der Karte',
      /gekündigt/i.test(await p.evaluate(() =>
        (document.getElementById('aboStand') || {}).textContent || '')));
    pruefe('keine Skriptfehler auf dem ganzen Weg', fehler.length === 0, fehler[0]);
    await p.close();
  }

  await b.close();
  console.log('\n' + (schlecht
    ? '✗ ' + schlecht + ' Fehler, ' + gut + ' in Ordnung'
    : '✓ Demo-Abo: alle zehn Zustände vorführbar, der Weg zur Kasse ' +
      'begehbar — ' + gut + ' Zusicherungen'));
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
