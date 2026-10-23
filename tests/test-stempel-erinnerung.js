/* ── Stempel-Erinnerung in der App (Runde 238) ────────────────────────
   Aus dem Betrieb, 23.10.2026: „mach die errinerungen und vlt auch in
   kobi mit formi und einer mail oder so". Handy und Mail schickt der
   Server (tests/rules/stempel-erinnerung.test.js). Hier: Formi sagt es in
   der offenen App — mit gestellter Uhr (page.clock), in der Demo.

     1. 10:00, Schicht seit 9:00, kein Stempel → „… um 09:00 begonnen …"
        GEGENPROBE: dasselbe nicht ein zweites Mal am selben Tag.
     2. 14:40, Schicht bis 14:00, eingestempelt → „Feierabend vergessen?"
        GEGENPROBE 14:20 (vor den 30 Minuten) → nichts.
     3. GEGENPROBE: „Stempel-Erinnerung" unter Meldungen aus → nichts.
     4. GEGENPROBE: heute Urlaub → nichts.
     5. Die Schalter stehen da: Meldungen → „Stempel-Erinnerung",
        Mails → „Feierabend vergessen" (für Mitarbeiter sichtbar), und der
        Hinweis auf der Seite „Zeiten".
   ───────────────────────────────────────────────────────────────────── */
const { chromium } = require('playwright');
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const APP = process.env.APP || 'http://127.0.0.1:8765/index.html';

let gut = 0, schlecht = 0;
function pruefe(was, bedingung, hinweis) {
  if (bedingung) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (hinweis ? '  — ' + hinweis : '')); }
}
const HEUTE = new Date().toLocaleDateString('sv-SE');
const um = (hhmm) => new Date(HEUTE + 'T' + hhmm + ':00');

/* Öffnet die Demo zur Uhrzeit `uhr`, legt EINE eigene Schicht und
   optional einen Stempel und eine Abwesenheit an und lässt dann die Zeit
   laufen, bis die Prüfung (nach 9 s und alle 5 min) gelaufen ist. Alles,
   was Formi oder eine Meldung sagt, wird mitgeschrieben. */
async function lauf(b, o) {
  const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  p._fehler = [];
  p.on('pageerror', e => p._fehler.push(e.message.slice(0, 160)));
  await p.route('**://www.gstatic.com/**', r => r.abort());
  await p.clock.install({ time: um(o.uhr) });
  await p.addInitScript((aus) => {
    localStorage.setItem('kf_tour', '99:demo-ich');
    if (aus) localStorage.setItem('kf_prefs', JSON.stringify({ notify: { stempel: false } }));
    window.__gesagt = [];
    /* Nur was NEU in die Blase oder die Meldung geschrieben wird — sonst
       läse jede andere Änderung im Dokument den alten Text noch einmal. */
    new MutationObserver((liste) => {
      liste.forEach((m) => {
        const el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
        const box = el && el.closest && el.closest('#formiBlase, #toast');
        if (!box) return;
        const t = box.textContent || '';
        if (/eingestempelt|Feierabend vergessen/.test(t)) window.__gesagt.push(t);
      });
    }).observe(document, { subtree: true, childList: true, characterData: true });
  }, !!o.aus);
  await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
  await p.clock.runFor(3500);
  await p.evaluate(async (o) => {
    const fs = firebase.firestore(), F = 'firmen/koerperformen/';
    /* Nur unsere Schicht und unsere Stempel für heute — was die Demo
       gewürfelt hat, würde die Probe sonst unvorhersehbar machen. */
    for (const sk of ['studio-6']) {
      const alt = await fs.collection(F + 'studios/' + sk + '/shifts').where('date', '==', o.heute).get();
      for (const d of alt.docs) if ((d.data() || {}).uid === 'demo-ich') await fs.collection(F + 'studios/' + sk + '/shifts').doc(d.id).delete();
      const ab = await fs.collection(F + 'studios/' + sk + '/absences').where('to', '>=', o.heute).get();
      for (const d of ab.docs) if ((d.data() || {}).uid === 'demo-ich') await fs.collection(F + 'studios/' + sk + '/absences').doc(d.id).delete();
    }
    const z = await fs.collection(F + 'zeiten').where('uid', '==', 'demo-ich').where('tag', '==', o.heute).get();
    for (const d of z.docs) await fs.collection(F + 'zeiten').doc(d.id).delete();
    await fs.collection(F + 'studios/studio-6/shifts').add({ uid: 'demo-ich', name: 'Mara Velten', date: o.heute, from: o.von, to: o.bis });
    if (o.kommen) await fs.collection(F + 'zeiten').add({ uid: 'demo-ich', name: 'Mara Velten', studioKey: 'studio-6', art: 'kommen',
      ts: new Date(o.heute + 'T' + o.kommen + ':00').getTime(), tag: o.heute, monat: o.heute.slice(0, 7), quelle: 'terminal' });
    if (o.urlaub) await fs.collection(F + 'studios/studio-6/absences').add({ uid: 'demo-ich', type: 'urlaub', status: 'genehmigt', from: o.heute, to: o.heute });
  }, Object.assign({ heute: HEUTE }, o));
  /* Die erste Prüfung nach 9 s fällt in Formis 45-Sekunden-Pause nach dem
     Tagesgruss; die nächste kommt nach 5 Minuten. */
  await p.clock.runFor(6 * 60000);
  await p.waitForTimeout(800);
  return p;
}
const gesagt = (p) => p.evaluate(() => window.__gesagt.slice());

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── 1. Einstempeln vergessen ──');
  {
    const p = await lauf(b, { uhr: '10:00', von: '09:00', bis: '14:00' });
    const g = await gesagt(p);
    pruefe('10:00, Schicht seit 9:00, kein Stempel → „… um 09:00 begonnen – du bist noch nicht eingestempelt"',
      g.some(t => /um 09:00 begonnen.*nicht eingestempelt/.test(t)), JSON.stringify(g));
    pruefe('… genau einmal', g.length === 1, JSON.stringify(g));
    await p.evaluate(() => { window.__gesagt.length = 0; });
    await p.clock.runFor(6 * 60000);
    await p.waitForTimeout(500);
    pruefe('GEGENPROBE: am selben Tag nicht noch einmal', !(await gesagt(p)).length, JSON.stringify(await gesagt(p)));
    pruefe('ohne Skriptfehler (1)', !p._fehler.length, p._fehler.join(' | '));
    await p.close();
  }

  console.log('\n── 2. Feierabend vergessen ──');
  {
    const p = await lauf(b, { uhr: '14:40', von: '09:00', bis: '14:00', kommen: '08:55' });
    const g = await gesagt(p);
    pruefe('14:40, Schicht bis 14:00, eingestempelt → „Feierabend vergessen?"',
      g.some(t => /endete um 14:00.*noch eingestempelt.*Feierabend vergessen/.test(t)), JSON.stringify(g));
    await p.close();
    const q = await lauf(b, { uhr: '14:10', von: '09:00', bis: '14:00', kommen: '08:55' });
    /* lauf() lässt 6 Minuten laufen: 14:16 — noch keine 30 Minuten. */
    pruefe('GEGENPROBE 14:16 (vor den 30 Minuten) → nichts', !(await gesagt(q)).length, JSON.stringify(await gesagt(q)));
    await q.close();
  }

  console.log('\n── 3. und 4. Abgeschaltet, Urlaub ──');
  {
    const p = await lauf(b, { uhr: '10:00', von: '09:00', bis: '14:00', aus: true });
    pruefe('GEGENPROBE „Stempel-Erinnerung" aus → nichts', !(await gesagt(p)).length, JSON.stringify(await gesagt(p)));
    await p.close();
    const q = await lauf(b, { uhr: '10:00', von: '09:00', bis: '14:00', urlaub: true });
    pruefe('GEGENPROBE heute Urlaub → nichts', !(await gesagt(q)).length, JSON.stringify(await gesagt(q)));
    await q.close();
  }

  console.log('\n── 5. Wo man es findet ──');
  {
    const p = await b.newPage({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
    const fe = []; p.on('pageerror', e => fe.push(e.message.slice(0, 160)));
    await p.route('**://www.gstatic.com/**', r => r.abort());
    await p.addInitScript(() => { localStorage.setItem('kf_tour', '99:demo-ich'); });
    await p.goto(APP + '?demo=mitarbeiter', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3000);
    const r = await p.evaluate(async () => {
      const w = (ms) => new Promise(r => setTimeout(r, ms));
      const g = document.querySelector('.mobnav [data-group="g-zeit"]'); g.click(); await w(1200);
      const hinweis = (document.querySelector('#view-zeit .st-erinnerung') || {}).textContent || '';
      /* Wie ein Mensch: Einstellungen auf, Reiter „Meldungen". */
      document.getElementById('profileModal').classList.add('show');
      const t = document.querySelector('[data-pmtab="melden"]'); if (t) t.click();
      await w(600);
      return {
        hinweis,
        push: (document.getElementById('notifyOpts') || document.body).innerText,
        mail: (document.getElementById('mailOpts') || document.body).innerText
      };
    }).catch((e) => ({ fehler: e.message }));
    pruefe('Hinweis auf der Seite „Zeiten"', /15 Minuten nach Schichtbeginn/.test(r.hinweis || ''), JSON.stringify(r).slice(0, 200));
    pruefe('Meldungen: Schalter „Stempel-Erinnerung"', /Stempel-Erinnerung/.test(r.push || ''), (r.push || r.fehler || '').slice(0, 200));
    pruefe('Mails: Schalter „Feierabend vergessen" (auch für Mitarbeiter)', /Feierabend vergessen/.test(r.mail || ''), (r.mail || r.fehler || '').slice(0, 200));
    pruefe('ohne Skriptfehler (5)', !fe.length, fe.join(' | '));
    await p.close();
  }

  await b.close();
  console.log(schlecht
    ? '\n✗ Stempel-Erinnerung in der App: ' + schlecht + ' von ' + (gut + schlecht) + ' Zusicherungen falsch'
    : '\n✓ Stempel-Erinnerung in der App: Formi sagt es einmal, nur wenn es stimmt — ' + gut + ' Zusicherungen');
  process.exit(schlecht ? 1 : 0);
})();
