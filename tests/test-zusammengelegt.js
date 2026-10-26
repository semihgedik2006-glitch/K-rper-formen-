/* ══ ZUSAMMENGELEGT (Runde 187) ══════════════════════════════════════
   Aus dem Betrieb, 22.10.2026: „das problem mit dem zu viel bleibt
   immer noch bestehen", „jede funktion hat ja ihren sinn" und zu den
   Vorschlägen: „mach die nächste runde mit deinen vorschlägen … deine
   2 fragen können wir so umsetzten".

   Geprüft wird:
    1. Studio: Aufgaben | Putzplan | Bestand | Probetraining. „Bestand"
       führt zu Material, darin schaltet „Material | Geräte" um; die
       Marke bleibt auf „Bestand".
    2. Nachrichten: Chats | Pinnwand. „Direkt" steht in der Zeile der
       Chats und führt zu den Direktnachrichten; dort führt „Studios"
       zurück. Am Rechner stehen die Direktnachrichten in der Kanalspalte.
    3. Pinnwand: Infos | Aushänge. Die Aushänge (früher „Brett" unter
       Plan) stehen hier; der Reiter „Brett" ist dort weg, und „Alle ›"
       auf der Startseite führt zu den Aushängen.
    4. Erledigtes ist eingeklappt („1 erledigt"), frisch Abgehaktes bleibt
       sichtbar; ein Tipp klappt auf.
    5. Am Raum „Studio" ein Punkt statt einer Zahl; die Zahl steht im
       Vorlesetext.
    6. Am Handy kein Stift und kein Papierkorb in der Aufgabenzeile, aber
       Bearbeiten und Löschen hinter „…"; im Putzplan dasselbe.
    7. Abmelden: nicht mehr oben, sondern im Profil.
    8. Jeder neue Umschalter-Knopf trifft ≥ 44 × 44 (Hit-Test) bei
       320/390/430/820 und 1280/1440/1920, normal und kompakt.
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
async function oeffne(b, w, h, opt) {
  opt = opt || {};
  const handy = w <= 820;
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' },
    handy ? { hasTouch: true, isMobile: true } : {}));
  const p = await ctx.newPage();
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.route('**fonts.googleapis.com/**', r => r.abort());
  await p.route('**script.google.com/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await p.addInitScript((alt) => { try { localStorage.setItem('kf_tour', '1:testuid'); } catch (e) {} if (alt) window.__tdAlt = true; }, !!opt.alt);
  await p.addInitScript({ path: SP + '/' + (opt.stub || 'stub-chef.js') });
  await p.goto(APP + '?neu=1', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!document.querySelector('#app.show'), null, { timeout: 15000 });
  await p.waitForTimeout(700);
  p._ctx = ctx;
  return p;
}
const zu = (p) => p._ctx.close();
/* Klick auf das erste SICHTBARE Element zum Wähler. */
async function tippe(p, sel) {
  const ok = await p.evaluate((s) => {
    const e = [...document.querySelectorAll(s)].find(x => x.getClientRects().length && getComputedStyle(x).display !== 'none');
    if (!e) return false; e.click(); return true;
  }, sel);
  await p.waitForTimeout(450);
  return ok;
}
const stand = (p) => p.evaluate(() => ({
  ansicht: (document.querySelector('.view.show') || {}).id,
  reiter: [...document.querySelectorAll('#subnav .subtab')].filter(e => e.getClientRects().length)
    .map(e => e.textContent.trim() + (e.classList.contains('on') ? '*' : ''))
}));
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

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1 Bestand ──');
  {
    const p = await oeffne(b, 1440, 900);
    await tippe(p, '#side [data-group="g-arbeit"]');
    let s = await stand(p);
    pruefe('Studio: Aufgaben | Putzplan | Bestand | Probetraining', s.reiter.map(x => x.replace('*', '')).join('|') === 'Aufgaben|Putzplan|Bestand|Probetraining', s.reiter.join('|'));
    await tippe(p, '#subnav [data-paar="bestand"]');
    s = await stand(p);
    const um = await p.evaluate(() => [...document.querySelectorAll('#view-material .umschalter [data-umschalt]')].map(e => e.textContent + (e.classList.contains('active') ? '*' : '')));
    pruefe('„Bestand" öffnet Material, Umschalter „Material | Geräte"', s.ansicht === 'view-material' && um.join('|') === 'Material*|Geräte', s.ansicht + ' ' + um.join('|'));
    await tippe(p, '#view-material .umschalter [data-umschalt="geraete"]');
    s = await stand(p);
    pruefe('„Geräte" öffnet die Geräte, die Marke bleibt auf „Bestand"', s.ansicht === 'view-geraete' && s.reiter.indexOf('Bestand*') >= 0, JSON.stringify(s));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 2 Chats ──');
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await oeffne(b, w, h);
    await tippe(p, w > 820 ? '#side [data-group="g-komm"]' : '.mn-reihe [data-group="g-komm"], .mobnav [data-group="g-komm"]');
    let s = await stand(p);
    pruefe(w + ' px: Nachrichten = Chats | Pinnwand', s.reiter.map(x => x.replace('*', '')).join('|') === 'Chats|Pinnwand' && s.ansicht === 'view-chat', JSON.stringify(s));
    if (w > 820) {
      const spalte = await p.evaluate(() => ({ kopf: [...document.querySelectorAll('#kanalSpalte .ks-gruppe')].map(e => e.textContent),
        alle: !!document.querySelector('#kanalSpalte [data-dmalle]') }));
      pruefe('Rechner: die Kanalspalte hat einen Abschnitt „Direkt" mit dem Weg zu allen', spalte.kopf.indexOf('Direkt') >= 0 && spalte.alle, JSON.stringify(spalte));
      await tippe(p, '#kanalSpalte [data-dmalle]');
    } else {
      /* Runde 286: am Handy gibt es die Kanalzeile nicht mehr. Die
         Direktnachrichten stehen in derselben Liste unter „Direkt". */
      const da = await p.evaluate(() => ({
        kopf: [...document.querySelectorAll('#kanalSpalte .ks-gruppe')].map(e => e.textContent),
        alle: !!document.querySelector('#kanalSpalte [data-dmalle]'),
      }));
      pruefe('Handy: die Chatliste hat einen Abschnitt „Direkt" mit dem Weg zu allen',
        da.kopf.indexOf('Direkt') >= 0 && da.alle, JSON.stringify(da));
      await tippe(p, '#kanalSpalte [data-dmalle]');
    }
    s = await stand(p);
    pruefe(w + ' px: Direkt öffnet die Direktnachrichten, Marke bleibt auf „Chats"', s.ansicht === 'view-dm' && s.reiter.indexOf('Chats*') >= 0, JSON.stringify(s));
    await tippe(p, '#view-dm .umschalter [data-chatart="studios"]');
    s = await stand(p);
    pruefe(w + ' px: „Studios" führt zurück in den Chat', s.ansicht === 'view-chat', s.ansicht);
    pruefe(w + ' px: ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 3 Pinnwand ──');
  {
    const p = await oeffne(b, 1440, 900);
    await tippe(p, '#side [data-group="g-komm"]');
    await tippe(p, '#subnav [data-subview="ann"]');
    let pin = await p.evaluate(() => ({ um: [...document.querySelectorAll('#view-ann .umschalter [data-pinteil]')].map(e => e.textContent + (e.classList.contains('active') ? '*' : '')),
      infos: !!document.getElementById('annArea').getClientRects().length, brett: !!document.getElementById('bbList').getClientRects().length,
      titel: document.querySelector('#view-ann .view-head h2').textContent }));
    pruefe('Pinnwand: „Infos | Aushänge", Infos offen', pin.um.join('|') === 'Infos*|Aushänge' && pin.infos && !pin.brett && pin.titel === 'Pinnwand', JSON.stringify(pin));
    await tippe(p, '#view-ann .umschalter [data-pinteil="brett"]');
    pin = await p.evaluate(() => ({ infos: !!document.getElementById('annArea').getClientRects().length, brett: !!document.getElementById('bbList').getClientRects().length }));
    pruefe('„Aushänge" zeigt das frühere Brett', !pin.infos && pin.brett, JSON.stringify(pin));
    await tippe(p, '#side [data-group="g-team"]');
    const reiter = await p.evaluate(() => [...document.querySelectorAll('[data-teamtab]')].filter(e => e.getClientRects().length).map(e => e.textContent.trim()));
    pruefe('unter „Plan" kein Reiter „Brett" mehr', reiter.indexOf('Brett') < 0 && reiter.length >= 2, reiter.join('|'));
    /* Alte Wege (Wünsche, „Alles", Startseite) drücken den Brett-Reiter: sie landen auf der Pinnwand. */
    await p.evaluate(() => document.querySelector('[data-teamtab="brett"]').click());
    await p.waitForTimeout(450);
    const alt = await p.evaluate(() => ({ ansicht: document.querySelector('.view.show').id, brett: !!document.getElementById('bbList').getClientRects().length }));
    pruefe('ein alter Weg zum „Brett" landet auf der Pinnwand bei den Aushängen', alt.ansicht === 'view-ann' && alt.brett, JSON.stringify(alt));
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 4 Erledigt eingeklappt ──');
  {
    const p = await oeffne(b, 1440, 900, { alt: true });
    await tippe(p, '#side [data-group="g-arbeit"]');
    const e = await p.evaluate(() => {
      const zeilen = [...document.querySelectorAll('#todoArea .todo')];
      const sicht = (txt) => { const z = zeilen.find(x => x.textContent.indexOf(txt) >= 0); return z ? z.checkVisibility() : null; };
      const d = document.querySelector('#todoArea details.td-erledigt');
      return { alt: sicht('Spind aufräumen'), frisch: sicht('Handtücher waschen'), offen: sicht('Wasserspender'),
        summary: d ? d.querySelector('summary').textContent : null };
    });
    pruefe('vor zwei Stunden Erledigtes ist eingeklappt („1 erledigt")', e.alt === false && /^1 erledigt$/.test(e.summary || ''), JSON.stringify(e));
    pruefe('eben Abgehaktes und Offenes bleiben sichtbar', e.frisch === true && e.offen === true, JSON.stringify(e));
    await tippe(p, '#todoArea details.td-erledigt > summary');
    const auf = await p.evaluate(() => { const z = [...document.querySelectorAll('#todoArea .todo')].find(x => x.textContent.indexOf('Spind aufräumen') >= 0); return !!z && z.checkVisibility(); });
    pruefe('ein Tipp klappt auf', auf);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
  }

  console.log('\n── 5 Punkt statt Zahl ──');
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await oeffne(b, w, h);
    const m = await p.evaluate(() => [...document.querySelectorAll('[data-badge="g-arbeit"],[data-mbadge="g-arbeit"]')].filter(e => e.getClientRects().length)
      .map(e => ({ text: e.textContent, label: e.getAttribute('aria-label'), w: Math.round(e.getBoundingClientRect().width) })));
    pruefe(w + ' px: am Raum „Studio" ein Punkt ohne Zahl, die Zahl im Vorlesetext', m.length === 1 && m[0].text === '' && /^\d+ offen$/.test(m[0].label || '') && m[0].w <= 12, JSON.stringify(m));
    await zu(p);
  }

  console.log('\n── 6 Handy: Bearbeiten und Löschen hinter „…" ──');
  {
    const p = await oeffne(b, 390, 844);
    await tippe(p, '.mn-reihe [data-group="g-arbeit"], .mobnav [data-group="g-arbeit"]');
    const z = await p.evaluate(() => {
      const zeile = [...document.querySelectorAll('#todoArea .todo')].find(x => x.getClientRects().length);
      const sicht = (sel) => { const e = zeile && zeile.querySelector(sel); return !!e && !!e.getClientRects().length && getComputedStyle(e).display !== 'none'; };
      return { stift: sicht('.t-edit'), papierkorb: sicht('.t-del'), mehr: sicht('.t-mehr') };
    });
    pruefe('Aufgabenzeile: kein Stift, kein Papierkorb, aber „…"', !z.stift && !z.papierkorb && z.mehr, JSON.stringify(z));
    await tippe(p, '#todoArea .todo .t-mehr');
    const blatt = await p.evaluate(() => [...document.querySelectorAll('#tbActs .ms-act')].map(e => e.textContent.trim()));
    pruefe('„…" bietet Bearbeiten und Löschen', blatt.indexOf('Bearbeiten') >= 0 && blatt.indexOf('Löschen') >= 0, blatt.join('|'));
    await tippe(p, '#tbClose');
    await tippe(p, '#subnav [data-subview="putzplan"]');
    await p.evaluate(() => { const s = document.getElementById('ppStudio'); if (s) { s.value = 'studio-6'; s.dispatchEvent(new Event('change', { bubbles: true })); } });
    await p.waitForTimeout(600);
    const pz = await p.evaluate(() => {
      const zeile = [...document.querySelectorAll('.pp-item')].find(x => x.getClientRects().length);
      const sicht = (sel) => { const e = zeile && zeile.querySelector(sel); return !!e && !!e.getClientRects().length && getComputedStyle(e).display !== 'none'; };
      return { zeile: !!zeile, stift: sicht('.pp-edit'), papierkorb: sicht('.pp-del'), mehr: sicht('.pp-mehr') };
    });
    pruefe('Putzplan genauso: kein Stift, kein Papierkorb, aber „…"', pz.zeile && !pz.stift && !pz.papierkorb && pz.mehr, JSON.stringify(pz));
    await tippe(p, '.pp-item .pp-mehr');
    const pb = await p.evaluate(() => [...document.querySelectorAll('#tbActs .ms-act')].map(e => e.textContent.trim()));
    pruefe('„…" im Putzplan bietet Bearbeiten, Pausieren und Löschen', pb.indexOf('Bearbeiten') >= 0 && pb.indexOf('Löschen') >= 0 && pb.some(x => /pausieren|Fortsetzen/.test(x)), pb.join('|'));
    await tippe(p, '#tbActs [data-tba="pp-ppedit"]');
    const fenster = await p.evaluate(() => [...document.querySelectorAll('.show, [open]')].some(e => /Putzaufgabe/.test(e.textContent || '') && e.id !== 'todoSheet'));
    pruefe('… und „Bearbeiten" öffnet das Fenster der Putzaufgabe', fenster);
    pruefe('ohne Skriptfehler', !p._fehler.length, p._fehler.join(' | '));
    await zu(p);
    /* Gegenprobe: am Rechner bleiben Stift und Papierkorb in der Zeile. */
    const q = await oeffne(b, 1440, 900);
    await tippe(q, '#side [data-group="g-arbeit"]');
    const pc = await q.evaluate(() => { const z = [...document.querySelectorAll('#todoArea .todo')].find(x => x.getClientRects().length);
      const e = z && z.querySelector('.t-edit'); return !!e && getComputedStyle(e).display !== 'none'; });
    pruefe('GEGENPROBE Rechner: Stift bleibt in der Zeile (beim Überfahren)', pc);
    await zu(q);
  }

  console.log('\n── 7 Abmelden im Profil ──');
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await oeffne(b, w, h);
    const oben = await p.evaluate(() => { const k = document.getElementById('logoutBtn'); return !!k.getClientRects().length && getComputedStyle(k).display !== 'none'; });
    pruefe(w + ' px: oben kein Abmelden mehr', !oben);
    await tippe(p, '#uAvatar');
    const k = await p.evaluate(() => { const k = document.getElementById('pmLogout'); if (!k) return false; k.scrollIntoView({ block: 'center' }); return !!k.getClientRects().length; });
    await p.waitForTimeout(200);
    const t = k ? await p.evaluate((f) => eval(f)(document.getElementById('pmLogout')), TREFFER.toString()) : { w: 0, h: 0 };
    pruefe(w + ' px: im Profil steht „Abmelden", Trefferfläche ' + t.w + '×' + t.h, k && t.w >= 44 && t.h >= 44);
    let gefragt = '';
    p.once('dialog', d => { gefragt = d.message(); d.dismiss(); });
    await p.evaluate(() => { const k = document.getElementById('pmLogout'); if (k) k.click(); });
    await p.waitForTimeout(300);
    pruefe(w + ' px: „Abmelden" im Profil fragt wie bisher nach', /^Abmelden\?/.test(gefragt), gefragt);
    await zu(p);
  }

  console.log('\n── 7b Jedes Ziel in zwei Tipps über „Alles" ──');
  /* Hauswunsch „Jedes Ziel in zwei Tipps über Alles": Geräte und Direkt
     liegen jetzt hinter einem Umschalter (Raum, Reiter, Umschalter = drei),
     über ☰ „Alles" bleiben es zwei. */
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    for (const v of ['geraete', 'dm', 'material', 'ann']) {
      const p = await oeffne(b, w, h);
      await tippe(p, '#bereichKopf');
      await tippe(p, '#allesLade [data-alles="' + v + '"]');
      const an = await p.evaluate(() => (document.querySelector('.view.show') || {}).id);
      pruefe(w + ' px: „Alles" → ' + v + ' in zwei Tipps', an === 'view-' + v, an);
      await zu(p);
    }
  }

  console.log('\n── 8 Trefferflächen der Umschalter ──');
  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [820, 1180], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p = await oeffne(b, w, h);
    for (const dichte of ['normal', 'kompakt']) {
      await p.evaluate((d) => { document.body.dataset.dichte = d; }, dichte);
      const zuMessen = [
        ['#subnav [data-paar="bestand"]', '#view-material .umschalter [data-umschalt]'],
        ['#subnav [data-subview="ann"]', '#view-ann .umschalter [data-pinteil]'],
        ['#subnav [data-paar="chats"]', '#view-dm .umschalter [data-chatart]']
      ];
      const raum = { bestand: 'g-arbeit', ann: 'g-komm', chats: 'g-komm' };
      const klein = [];
      for (const [reiter, knoepfe] of zuMessen) {
        const g = reiter.indexOf('bestand') >= 0 ? 'g-arbeit' : 'g-komm';
        await tippe(p, '#side [data-group="' + g + '"], .mn-reihe [data-group="' + g + '"], .mobnav [data-group="' + g + '"]');
        await tippe(p, reiter);
        if (reiter.indexOf('chats') >= 0) await tippe(p, '#kanalDirekt, #kanalSpalte [data-dmalle]');
        await p.waitForTimeout(200);
        const m = await p.evaluate(({ sel, f }) => [...document.querySelectorAll(sel)].filter(e => e.getClientRects().length)
          .map(e => { const t = eval(f)(e); const r = e.getBoundingClientRect(); return { k: e.textContent, w: t.w, h: t.h, im: r.left >= 0 && r.right <= innerWidth }; }), { sel: knoepfe, f: TREFFER.toString() });
        m.forEach(x => { if (x.w < 44 || x.h < 44 || !x.im) klein.push(x.k + ' ' + x.w + '×' + x.h + (x.im ? '' : ' ausserhalb')); });
        if (!m.length) klein.push('keine Knöpfe: ' + knoepfe);
      }
      void raum;
      pruefe(w + ' px ' + dichte + ': alle Umschalter ≥ 44 × 44 und im Bild', !klein.length, klein.join(', '));
    }
    await zu(p);
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Zusammengelegt: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Zusammengelegt: Bestand, Chats, Pinnwand, Erledigt eingeklappt, Punkt, „…", Abmelden — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
