/* ── Wie viel Platz und Zeit der Rahmen kostet ─────────────────────────
   Vier Behauptungen, alle mit Zahlen:

     1. Der Startbildschirm wartet nicht mehr auf einen Zeitgeber.
        Er lag auf festen 3200 ms — gemessen war die App nach rund einer
        Sekunde fertig und wurde danach zwei Sekunden lang verdeckt.
        Das ist der Unterschied zwischen „wirkt schnell" und „ist
        schnell": dort wurde nichts geladen, dort wurde gewartet.
     2. Er blitzt aber auch nicht auf. Eine Untergrenze verhindert, dass
        er bei einem warmen Start nur kurz zuckt.
     3. Suche und Filter stehen in EINER Zeile. Getrennt begann die
        erste Aufgabe erst bei 407px, die erste Materialzeile bei 607 —
        auf einem 844er-Handy in der Mitte bzw. im unteren Drittel.
     4. Der Hinweis „Meldungen an?" laesst sich wegtippen und bleibt
        weg — und der Weg dorthin steht danach in den Einstellungen.
        Ohne den waere es eine Sackgasse: dort stand woertlich „Tippe
        oben im Banner auf Erlauben".
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const SP = process.env.SP || __dirname;
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* Grosszuegig, aber deutlich unter den alten 3200: der Durchlauf soll
   nicht bei jedem langsamen Rechner umfallen, aber einen Rueckfall auf
   den Zeitgeber muss er merken. */
const SPLASH_MAX = 1800;
const SPLASH_MIN = 400;

async function seite(b, extra) {
  const page = await b.newPage({ viewport: { width: 430, height: 844 } });
  await page.route('**://www.gstatic.com/**', r => r.abort());
  await page.route('**fonts.googleapis.com/**', r => r.abort());
  await page.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  if (extra) await page.addInitScript(extra);
  await page.addInitScript({ path: SP + '/stub-chef.js' });
  return page;
}

(async () => {
  const errs = [];
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  /* ── 1 + 2: Startbildschirm ── */
  {
    const page = await seite(b);
    const t0 = Date.now();
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const s = document.getElementById('splash');
      return !s || s.classList.contains('hide') || getComputedStyle(s).visibility === 'hidden';
    }, { timeout: 9000 }).catch(() => {});
    const weg = Date.now() - t0;
    console.log('Startbildschirm weg nach ' + weg + ' ms');
    if (weg > SPLASH_MAX) {
      errs.push('ZEITGEBER: der Startbildschirm bleibt ' + weg + ' ms stehen — ' +
        'er wartet offenbar wieder auf die Uhr statt auf die App');
    }
    if (weg < SPLASH_MIN) {
      errs.push('AUFBLITZEN: der Startbildschirm ist schon nach ' + weg + ' ms weg — ' +
        'die Untergrenze greift nicht, und ein Zucken ist unruhiger als eine kurze Pause');
    }
    await page.close();
  }

  /* ── 3: Suche und Filter in einer Zeile ── */
  {
    const page = await seite(b);
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2800);
    const mess = async (gruppe, sub, inhalt) => {
      await page.evaluate(x => {
        const k = document.querySelector('.mobnav [data-group="' + x + '"]'); if (k) k.click();
      }, gruppe);
      await page.waitForTimeout(500);
      await page.evaluate(x => {
        const k = document.querySelector('[data-subview="' + x + '"]'); if (k) k.click();
      }, sub);
      await page.waitForTimeout(900);
      return page.evaluate(sel => {
        const e = [...document.querySelectorAll(sel)].find(x => x.getClientRects().length);
        if (!e) return null;
        /* Wie viele Zeilen stehen ueber dem Inhalt? Gezaehlt werden
           unterschiedliche Oberkanten — zwei Dinge nebeneinander sind
           EINE Zeile, und genau darum geht es hier. */
        const oben = Math.round(e.getBoundingClientRect().top);
        const kanten = new Set();
        document.querySelectorAll('.view.show .scroll-area > *, .view.show .sticky-tools > *')
          .forEach(x => {
            if (!x.getClientRects().length) return;
            const r = x.getBoundingClientRect();
            if (r.top < oben && r.height >= 20) kanten.add(Math.round(r.top / 8));
          });
        return { oben, zeilen: kanten.size };
      }, inhalt);
    };
    const t = await mess('g-arbeit', 'todos', '.todo');
    const m = await mess('g-arbeit', 'material', '.mat-row');
    console.log('Aufgaben: Inhalt ab ' + (t && t.oben) + 'px · ' + (t && t.zeilen) + ' Zeilen darueber');
    console.log('Material: Inhalt ab ' + (m && m.oben) + 'px · ' + (m && m.zeilen) + ' Zeilen darueber');
    if (!t || !m) errs.push('AUFBAU: Aufgaben- oder Materialliste nicht gefunden');
    else {
      if (t.oben > 380) errs.push('Aufgaben: der Inhalt beginnt erst bei ' + t.oben + 'px (vorher 407)');
      if (m.oben > 580) errs.push('Material: der Inhalt beginnt erst bei ' + m.oben + 'px (vorher 607)');
    }
    /* Und die Suche muss trotzdem noch suchen. Eine Zeile zu sparen,
       indem man ein Bedienelement unbrauchbar macht, waere kein
       Gewinn. */
    const sucht = await page.evaluate(async () => {
      const f = document.getElementById('matSearch');
      if (!f) return { fehler: 'kein Suchfeld' };
      const vorher = document.querySelectorAll('.mat-row').length;
      f.focus();
      f.value = 'Handtücher';
      f.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 500));
      const nachher = document.querySelectorAll('.mat-row').length;
      /* WEGKLICKEN, bevor gemessen wird. Solange der Finger im Feld
         ist, macht es schon :has(input:focus) breit — dann misst man
         den Fokus und nicht das Gedaechtnis. Genau daran ist die erste
         Fassung vorbeigelaufen: die Gegenprobe (Klasse .offen
         abgeschaltet) blieb gruen. Die Frage ist, ob das Suchwort noch
         zu sehen ist, NACHDEM man in die Liste getippt hat. */
      f.blur();
      await new Promise(r => setTimeout(r, 400));
      const box = f.closest('.todo-search');
      const breit = box ? Math.round(box.getBoundingClientRect().width) : 0;
      return { fehler: null, vorher, nachher, breit,
        offen: !!(box && box.classList.contains('offen')) };
    });
    console.log('Suche im Material:', JSON.stringify(sucht));
    if (sucht.fehler) errs.push(sucht.fehler);
    else {
      if (sucht.nachher >= sucht.vorher) {
        errs.push('Die Suche filtert nicht mehr (' + sucht.vorher + ' → ' + sucht.nachher + ')');
      }
      if (!sucht.offen || sucht.breit < 120) {
        errs.push('Das Suchfeld bleibt schmal, obwohl etwas drinsteht (' +
          sucht.breit + 'px) — dann sieht man nicht, wonach gefiltert wird');
      }
    }
    await page.close();
  }

  /* ── 4: der Hinweis laesst sich wegtippen ── */
  {
    const page = await seite(b);
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2800);
    await page.evaluate(() => document.querySelector('.mobnav [data-group="g-komm"]').click());
    await page.waitForTimeout(900);
    const vor = await page.evaluate(() => {
      /* Die Attrappe kennt keine echte Berechtigung; wir erzwingen den
         Zustand „unentschieden", sonst prueft der Durchlauf nichts. */
      try { Object.defineProperty(Notification, 'permission', { get: () => 'default', configurable: true }); } catch (e) {}
      if (typeof maybeShowNotifBanner === 'function') maybeShowNotifBanner();
      const b = document.getElementById('notifBanner');
      return { da: !!b, sichtbar: !!(b && b.classList.contains('show')),
        kreuz: !!document.getElementById('notifDismiss') };
    });
    console.log('Hinweis vor dem Wegtippen:', JSON.stringify(vor));
    if (!vor.kreuz) errs.push('Der Hinweis hat kein Kreuz zum Wegtippen');
    if (!vor.sichtbar) {
      errs.push('AUFBAU: der Hinweis steht gar nicht da — der Durchlauf misst nichts');
    } else {
      const nach = await page.evaluate(async () => {
        document.getElementById('notifDismiss').click();
        await new Promise(r => setTimeout(r, 400));
        let gemerkt = null;
        try { gemerkt = localStorage.getItem('kf_notif_weg'); } catch (e) {}
        return { sichtbar: document.getElementById('notifBanner').classList.contains('show'), gemerkt };
      });
      console.log('Nach dem Wegtippen:', JSON.stringify(nach));
      if (nach.sichtbar) errs.push('Der Hinweis bleibt nach dem Wegtippen stehen');
      if (nach.gemerkt !== '1') errs.push('Das Wegtippen wird nicht gemerkt — er kommt beim nächsten Start wieder');
    }

    /* Der Ersatzweg muss da sein. Ohne ihn haette man dem Benutzer den
       einzigen Zugang zu den Meldungen weggenommen. */
    const weg = await page.evaluate(async () => {
      const a = document.getElementById('uAvatar'); if (a) a.click();
      await new Promise(r => setTimeout(r, 600));
      const t = [...document.querySelectorAll('[data-pmtab]')].find(x => x.getAttribute('data-pmtab') === 'melden');
      if (t) t.click();
      await new Promise(r => setTimeout(r, 500));
      const k = document.getElementById('notifyAsk');
      const st = document.getElementById('notifyState');
      return { knopf: !!k, sichtbar: !!(k && k.offsetParent !== null),
        text: st ? st.textContent.trim() : '' };
    });
    console.log('Weg in den Einstellungen:', JSON.stringify(weg));
    if (!weg.knopf) errs.push('In den Einstellungen fehlt der Knopf „Meldungen erlauben"');
    else if (!weg.sichtbar) {
      errs.push('Der Knopf in den Einstellungen ist nicht sichtbar, obwohl die Berechtigung offen ist');
    }
    if (/im Banner/i.test(weg.text)) {
      errs.push('Die Einstellungen verweisen noch auf den Hinweis, den man wegtippen kann: „' + weg.text + '"');
    }
    await page.close();
  }

  await b.close();
  console.log(errs.length ? '\n✗ ' + errs.join('\n✗ ')
    : '\n✓ Rahmen: Startbildschirm wartet auf die App statt auf die Uhr, ' +
      'Suche und Filter in einer Zeile, der Hinweis geht weg und der Weg bleibt');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
