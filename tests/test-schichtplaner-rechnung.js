/* ══════════════════════════════════════════════════════════════════════
   SCHICHTPLANER — DIE RECHNUNG (Runde 156)

   Aus dem Betrieb, 19.10.2026: „der will lieber Frühschicht, der will
   lieber Spätschicht, der kann nur von dann bis dann … Urlaube etc."
   — und: „wenn die maschine begründet warum es nicht geht dann ja aber
   die mitarbeiter können ggf. auch gefragt werden das sollte dann aber
   klar gezeigt werden".

   Ohne Browser, ohne Datenbank, nur schichtplaner.js:
   1. Harte Regeln brechen nie: Urlaub/krank, „nie", eine Schicht am
      Tag, 11 Stunden Ruhe, unter 18 nicht nach 20 Uhr, Minijob-Grenze,
      „darf nicht allein sein".
   2. Wünsche gelten, solange es anders geht. Geht es nicht, wird der
      Wunsch nur als RÜCKFRAGE gebrochen — sichtbar, mit Grund.
   3. Eine Lücke nennt ihren Grund und wen man fragen könnte.
   4. Gleiche Angaben → derselbe Plan.
   5. Feiertage NRW stimmen; Feiertage „zu" werden nicht verplant.
   6. Die Excel-Vorlage wird gelesen — Spalten über die Kopfzeile,
      Beispielzeilen übersprungen, Uhrzeiten aus Excel-Zahlen.
   7. Die LogX-Tabelle hat Kopf, Tabulatoren, sortierte Zeilen.
   8. 14 Studios × Monat × 60 Personen rechnet unter einer Sekunde
      (gemessen, nicht geschätzt).
   9.–11. Runde 169: feste Einteilungen, Sondertage, Tage am Stück,
      Fairness, erster/letzter Arbeitstag, Krankheit → Ersatz, Tausch,
      die neuen Excel-Blätter.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const SP = require(path.join(__dirname, '..', 'schichtplaner.js'));

let gut = 0, schlecht = 0;
function pruefe(was, b, info) {
  if (b) { gut++; console.log('  ✓ ' + was); }
  else { schlecht++; console.log('  ✗ ' + was + (info !== undefined ? '  — ' + JSON.stringify(info).slice(0, 300) : '')); }
}
const SCH = [
  { id: 'f', name: 'Früh', von: '07:00', bis: '14:00', tage: [1, 2, 3, 4, 5], min: 1 },
  { id: 's', name: 'Spät', von: '14:00', bis: '21:00', tage: [1, 2, 3, 4, 5], min: 1 },
  { id: 'sa', name: 'Samstag', von: '09:00', bis: '14:00', tage: [6], min: 1 }
];
const STUDIOS = [{ key: 'studio-0', name: 'Longerich', schichten: SCH }, { key: 'studio-1', name: 'Nippes', schichten: SCH }];
function person(id, f) {
  return Object.assign({ id, name: id, rolle: 'Vollzeit', haupt: 'studio-0', studios: [], wocheStd: 40, allein: true, verf: {} }, f || {});
}
const TEAM = [
  person('Anna', { lieber: 'Früh' }),
  person('Ben', { rolle: 'Teilzeit', wocheStd: 20, studios: ['studio-1'], lieber: 'Spät', verf: { 3: 'nie' } }),
  person('Cem', { rolle: 'Minijob', wocheStd: 0, maxMonatStd: 40, haupt: 'studio-1' }),
  person('Dana', { haupt: 'studio-1', studios: ['studio-0'], verf: { 6: 'nie' } }),
  person('Emil', { rolle: 'Azubi', haupt: 'studio-1', allein: false, u18: true }),
  person('Fritz', { haupt: 'studio-1', verf: { 1: '9–14', 2: 'nach Absprache' } })
];
const EINGABE = {
  monat: '2026-11', studios: STUDIOS, personen: TEAM,
  abwesend: [{ id: 'Anna', von: '2026-11-09', bis: '2026-11-13', art: 'urlaub' }, { id: 'Dana', von: '2026-11-20', bis: '2026-11-20', art: 'krank' }],
  wuensche: { Dana: { frei: ['2026-11-03', '2026-11-04'], lieber: 'Spät' }, Ben: { frei: ['2026-11-02'] } }
};
const r = SP.planen(EINGABE);
const E = r.einsaetze;
const von = (x) => +x.von.slice(0, 2) * 60 + +x.von.slice(3);
const bis = (x) => +x.bis.slice(0, 2) * 60 + +x.bis.slice(3);

console.log('── 1. Harte Regeln ──');
pruefe('es wird überhaupt geplant', E.length > 30, E.length);
pruefe('niemand im Urlaub eingeteilt', !E.some((x) => x.id === 'Anna' && x.datum >= '2026-11-09' && x.datum <= '2026-11-13'));
pruefe('niemand am Krankheitstag eingeteilt', !E.some((x) => x.id === 'Dana' && x.datum === '2026-11-20'));
pruefe('„nie" am Mittwoch hält (Ben)', !E.some((x) => x.id === 'Ben' && SP.wochentag(x.datum) === 3));
pruefe('„nie" am Samstag hält (Dana)', !E.some((x) => x.id === 'Dana' && SP.wochentag(x.datum) === 6));
const proTag = {};
E.forEach((x) => { const k = x.id + x.datum; proTag[k] = (proTag[k] || 0) + 1; });
pruefe('höchstens eine Schicht pro Person und Tag', Object.values(proTag).every((n) => n === 1));
let ruhe = [];
E.forEach((x) => {
  const morgen = E.find((y) => y.id === x.id && y.datum === nachTag(x.datum));
  if (morgen && (von(morgen) + 1440 - bis(x)) < 660) ruhe.push(x.id + ' ' + x.datum);
});
function nachTag(d) { const t = new Date(d + 'T12:00Z'); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10); }
pruefe('11 Stunden Ruhe zwischen zwei Schichten (Spät → Früh nie)', !ruhe.length, ruhe);
pruefe('unter 18 nie nach 20 Uhr', !E.some((x) => x.id === 'Emil' && bis(x) > 1200));
const cemStd = E.filter((x) => x.id === 'Cem').reduce((a, x) => a + SP.dauerStd(x.von, x.bis), 0);
pruefe('Minijob bleibt unter seiner Monatsgrenze (' + cemStd + ' von 40 Std.)', cemStd <= 40);
const allein = E.filter((x) => x.id === 'Emil').filter((x) => !E.some((y) => y !== x && y.datum === x.datum && y.studio === x.studio &&
  TEAM.find((p) => p.id === y.id).allein && von(y) <= von(x) && bis(y) >= bis(x)));
pruefe('wer nicht allein sein darf, ist nie allein', !allein.length, allein);
/* Ohne diese Probe wäre die vorige Zeile leer wahr: bei Mindestbesetzung
   1 kommt der Azubi gar nicht vor. Mit einer Schicht für zwei schon. */
const zuZweit = SP.planen({ monat: '2026-11', studios: [{ key: 'studio-0', name: 'Longerich',
  schichten: [{ id: 'z', name: 'Zu zweit', von: '09:00', bis: '15:00', tage: [1, 2, 3, 4, 5], min: 2 }] }],
  personen: [person('Azubi', { allein: false }), person('Meisterin', {}), person('Geselle', {})], abwesend: [], wuensche: {} });
const azubi = zuZweit.einsaetze.filter((x) => x.id === 'Azubi');
pruefe('bei zwei Plätzen wird der Azubi eingeteilt (' + azubi.length + '×)', azubi.length > 5, azubi.length);
pruefe('… und steht nie ohne jemanden, der allein darf', azubi.every((x) => zuZweit.einsaetze.some((y) => y.datum === x.datum && y.id !== 'Azubi')));
const nurAzubis = SP.planen({ monat: '2026-11', studios: [{ key: 'studio-0', name: 'Longerich',
  schichten: [{ id: 'z', name: 'Zu zweit', von: '09:00', bis: '15:00', tage: [1], min: 2 }] }],
  personen: [person('A1', { allein: false }), person('A2', { allein: false })], abwesend: [], wuensche: {} });
pruefe('zwei Azubis allein ergeben keine Besetzung, sondern eine Lücke', !nurAzubis.einsaetze.length && nurAzubis.luecken.length > 0, nurAzubis.einsaetze);
pruefe('„9–14" am Montag: nur Schichten, die hineinpassen (Fritz)',
  !E.some((x) => x.id === 'Fritz' && SP.wochentag(x.datum) === 1 && (von(x) < 540 || bis(x) > 840)));
pruefe('„nach Absprache" wird nicht von selbst verplant (Fritz, Di)',
  !E.some((x) => x.id === 'Fritz' && SP.wochentag(x.datum) === 2));
pruefe('niemand in einem Studio, das ihm nicht zugeordnet ist',
  !E.some((x) => { const p = TEAM.find((t) => t.id === x.id); return [p.haupt].concat(p.studios).indexOf(x.studio) < 0; }));

console.log('\n── 2. Wünsche ──');
const gebrochen = E.filter((x) => x.rueckfrage && /wollte frei/.test(x.rueckfrage));
const stumm = E.filter((x) => !x.rueckfrage && EINGABE.wuensche[x.id] && EINGABE.wuensche[x.id].frei.indexOf(x.datum) >= 0);
pruefe('ein Wunsch-frei-Tag wird nie STILL gebrochen', !stumm.length, stumm);
pruefe('gebrochene Wünsche stehen als Rückfrage mit Grund da', gebrochen.every((x) => /wollte frei/.test(x.rueckfrage)), gebrochen);
// Gegenprobe: mit genug Leuten wird der Wunsch einfach erfüllt
const mehr = SP.planen(Object.assign({}, EINGABE, { personen: TEAM.concat([person('Gerd', { haupt: 'studio-1', studios: ['studio-0'] }), person('Hanna', { haupt: 'studio-1' })]) }));
pruefe('mit genug Leuten: Dana arbeitet an ihren Wunsch-frei-Tagen nicht', !mehr.einsaetze.some((x) => x.id === 'Dana' && (x.datum === '2026-11-03' || x.datum === '2026-11-04')));
const anna = E.filter((x) => x.id === 'Anna');
pruefe('„lieber früh" überwiegt bei Anna', anna.filter((x) => x.von < '12:00').length > anna.length / 2, anna.length);
pruefe('jede Einteilung trägt einen Grund', E.every((x) => x.grund && /Std\./.test(x.grund)));

console.log('\n── 3. Lücken ──');
const knapp = SP.planen({ monat: '2026-11', studios: [{ key: 'studio-0', name: 'Longerich', schichten: SCH }],
  personen: [person('Solo', { verf: { 2: 'nie' } }), person('Azubi', { allein: false })], abwesend: [], wuensche: {} });
pruefe('eine Lücke entsteht, wenn niemand kann', knapp.luecken.length > 0, knapp.luecken.length);
const l = knapp.luecken[0] || {};
pruefe('die Lücke nennt ihren Grund', /schon eingeteilt|kann|allein|Ruhezeit/.test(l.grund || ''), l);
pruefe('… und wen man fragen könnte (die Begleitung braucht)',
  knapp.luecken.some((x) => (x.fragen || []).some((f) => f.name === 'Azubi' && f.warum === 'mit Begleitung')), knapp.luecken.slice(0, 2));
pruefe('der Hinweis nennt, wer unter Soll bleibt', knapp.hinweise.some((h) => /Azubi: 0 von/.test(h)), knapp.hinweise);
const fremd = SP.planen({ monat: '2026-11', studios: [{ key: 'studio-9', name: 'Seelscheid', schichten: SCH }], personen: TEAM, abwesend: [], wuensche: {} });
pruefe('Studio ohne Leute: Lücke sagt das ehrlich', fremd.luecken.length && /niemandem ist dieses Studio zugeordnet/.test(fremd.luecken[0].grund), fremd.luecken[0]);

console.log('\n── 4. Gleiche Angaben, derselbe Plan ──');
pruefe('zweimal gerechnet → identisch', JSON.stringify(SP.planen(EINGABE)) === JSON.stringify(r));

console.log('\n── 5. Feiertage ──');
const ft = SP.feiertageNRW(2026);
pruefe('Allerheiligen 2026', ft['2026-11-01'] === 'Allerheiligen');
pruefe('Ostermontag 2026 = 6.4.', ft['2026-04-06'] === 'Ostermontag');
pruefe('Fronleichnam 2026 = 4.6.', ft['2026-06-04'] === 'Fronleichnam');
pruefe('Pfingstmontag 2027 = 17.5.', SP.feiertageNRW(2027)['2027-05-17'] === 'Pfingstmontag');
const dez = SP.planen({ monat: '2026-12', studios: STUDIOS, personen: TEAM, abwesend: [], wuensche: {}, feiertageZu: true });
pruefe('Feiertage zu: am 25.12. wird niemand eingeteilt', !dez.einsaetze.some((x) => x.datum === '2026-12-25'));
const dezAuf = SP.planen({ monat: '2026-12', studios: STUDIOS, personen: TEAM, abwesend: [], wuensche: {} });
pruefe('Feiertage offen: der 25.12. (Fr) wird verplant', dezAuf.einsaetze.some((x) => x.datum === '2026-12-25'));

console.log('\n── 6. Excel-Vorlage ──');
const STU = ['Longerich', 'Nippes', 'Ebertplatz'];
const key = (n) => { const i = STU.findIndex((x) => x.toLowerCase() === String(n || '').trim().toLowerCase()); return i < 0 ? '' : 'studio-' + i; };
function lies(datei) {
  const b = fs.readFileSync(datei);
  return SP.excelLesen(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
}
(async () => {
  const leer = SP.ausVorlage(await lies(path.join(__dirname, '..', 'vorlagen', 'Schichtplaner-Vorlage.xlsx')), key);
  pruefe('leere Vorlage: Beispielzeilen werden übersprungen', leer.personen.length === 0, leer.personen.map((p) => p.name));
  pruefe('leere Vorlage: Beispiel-Schichten werden übersprungen', Object.keys(leer.schichten).length === 0, leer.schichten);
  const v = SP.ausVorlage(await lies(path.join(__dirname, 'daten', 'schichtplaner-beispiel.xlsx')), key);
  pruefe('vier Personen gelesen', v.personen.length === 4, v.personen.map((p) => p.name));
  const lena = v.personen.find((p) => p.name === 'Lena Brandt') || {};
  pruefe('Hauptstudio → Kennung', lena.haupt === 'studio-1', lena.haupt);
  pruefe('weitere Studios → Kennungen', (lena.studios || []).join() === 'studio-0', lena.studios);
  pruefe('Fähigkeiten als Liste', (lena.kann || []).join('|') === 'Probetraining|Abschluss', lena.kann);
  pruefe('Verfügbarkeit je Wochentag', lena.verf && lena.verf[3] === 'nie' && lena.verf[5] === 'nur spät', lena.verf);
  const mira = v.personen.find((p) => p.name === 'Mira Sommer') || {};
  pruefe('„darf allein: nein" → allein=false', mira.allein === false, mira.allein);
  pruefe('„unter 18: ja" → u18=true', mira.u18 === true, mira.u18);
  const tobias = v.personen.find((p) => p.name === 'Tobias Lang') || {};
  pruefe('leere Verfügbarkeit bleibt leer (= ganztags)', tobias.verf && tobias.verf[1] === '', tobias.verf);
  pruefe('Ebertplatz als Springer erkannt', (tobias.studios || []).indexOf('studio-2') >= 0, tobias.studios);
  pruefe('Schichten für „alle" gelesen', (v.schichten.alle || []).length === 3, v.schichten);
  const lang = (v.schichten['studio-1'] || [])[0] || {};
  pruefe('Studio-eigene Schicht mit Tagen Mo–Do und Mindestbesetzung 2',
    lang.name === 'Abend lang' && lang.tage.join() === '1,2,3,4' && lang.min === 2, lang);
  pruefe('Uhrzeiten als HH:MM', (v.schichten.alle || []).every((s) => /^\d\d:\d\d$/.test(s.von) && /^\d\d:\d\d$/.test(s.bis)), v.schichten.alle);
  const unbekannt = SP.ausVorlage(await lies(path.join(__dirname, 'daten', 'schichtplaner-beispiel.xlsx')), () => '');
  pruefe('unbekanntes Studio wird gemeldet, nicht verschluckt', unbekannt.fehler.some((f) => /Hauptstudio „Nippes“ unbekannt/.test(f)), unbekannt.fehler);
  let kaputt = null;
  try { await SP.excelLesen(new TextEncoder().encode('keine Excel-Datei').buffer); } catch (e) { kaputt = e.message; }
  pruefe('keine Excel-Datei → verständlicher Fehler', /keine Excel-Datei/.test(kaputt || ''), kaputt);

  console.log('\n── 7. Tabelle für LogX ──');
  const t = SP.alsTabelle(r).split('\n');
  pruefe('Kopfzeile', t[0] === 'Datum\tTag\tStudio\tSchicht\tBeginn\tEnde\tMitarbeiter', t[0]);
  pruefe('eine Zeile je Schicht', t.length === E.length + 1, t.length);
  pruefe('Datum deutsch, nach Datum sortiert', /^02\.11\.2026\tMo\t/.test(t[1]) && t.slice(1).every((z, i, a) => !i || z.slice(6, 10) + z.slice(3, 5) + z.slice(0, 2) >= a[i - 1].slice(6, 10) + a[i - 1].slice(3, 5) + a[i - 1].slice(0, 2)), t.slice(0, 3));
  pruefe('nur ein Studio, wenn gewünscht', SP.alsTabelle(r, 'studio-1').split('\n').slice(1).every((z) => z.split('\t')[2] === 'Nippes'));

  console.log('\n── 9. Was die Chefin festlegt (Runde 169) ──');
  // Feste Einteilung: Ben jeden Montag Früh in Longerich — obwohl er „Spät" lieber hat
  const mitFest = SP.planen(Object.assign({}, EINGABE, { fest: [{ person: 'Ben', studio: 'studio-0', schicht: 'f', tage: [1] }] }));
  const benMo = mitFest.einsaetze.filter((x) => x.id === 'Ben' && SP.wochentag(x.datum) === 1);
  pruefe('fest eingeplant: Ben steht jeden Montag Früh in Longerich', benMo.length >= 4 && benMo.every((x) => x.schicht === 'f' && x.studio === 'studio-0' && x.fest), benMo.length);
  const festKrank = SP.planen(Object.assign({}, EINGABE, { fest: [{ person: 'Anna', studio: 'studio-0', schicht: 'f', datum: '2026-11-10' }] }));
  pruefe('fest eingeplant, aber im Urlaub: nicht eingeteilt, und der Hinweis sagt es', !festKrank.einsaetze.some((x) => x.id === 'Anna' && x.datum === '2026-11-10') &&
    festKrank.hinweise.some((h) => /Anna ist am 2026-11-10 fest eingeplant, aber im Urlaub/.test(h)), festKrank.hinweise.slice(0, 3));
  // Sondertage
  const zu = SP.planen(Object.assign({}, EINGABE, { sonder: [{ datum: '2026-11-11', studio: 'alle', art: 'zu', schicht: 's' }] }));
  pruefe('Sondertag „zu" (alle Studios, Spät): am 11.11. keine Spätschicht', !zu.einsaetze.some((x) => x.datum === '2026-11-11' && x.schicht === 's') &&
    zu.einsaetze.some((x) => x.datum === '2026-11-11' && x.schicht === 'f'));
  const mehr2 = SP.planen(Object.assign({}, EINGABE, { personen: TEAM.concat([person('Gerd', { haupt: 'studio-1' }), person('Hanna', { haupt: 'studio-1' })]),
    sonder: [{ datum: '2026-11-12', studio: 'studio-1', art: 'mehr', schicht: 'f', plus: 1 }] }));
  pruefe('Sondertag „mehr": am 12.11. stehen in Nippes früh zwei Leute',
    mehr2.einsaetze.filter((x) => x.datum === '2026-11-12' && x.studio === 'studio-1' && x.schicht === 'f').length +
    (mehr2.luecken.filter((x) => x.datum === '2026-11-12' && x.studio === 'studio-1' && x.schicht === 'f')[0] || { fehlt: 0 }).fehlt === 2);
  // Tage am Stück
  const kette = SP.planen({ monat: '2026-11', studios: [{ key: 'studio-0', name: 'L', schichten: [{ id: 't', name: 'Tag', von: '09:00', bis: '15:00', tage: [1, 2, 3, 4, 5, 6, 7], min: 1 }] }],
    personen: [person('Solo', { wocheStd: 60 })], abwesend: [], wuensche: {}, maxAmStueck: 3 });
  const viertTag = kette.einsaetze.filter((x) => x.rueckfrage && /4\. Tag am Stück/.test(x.rueckfrage));
  pruefe('mehr Tage am Stück als erlaubt: nur als Rückfrage („4. Tag am Stück")', viertTag.length > 0, kette.einsaetze.slice(0, 5).map((x) => x.rueckfrage));
  // Fairness
  pruefe('Fairness wird ausgewiesen (Spannweite Wochenenden, unter/über Soll)', r.fairness && typeof r.fairness.wochenenden === 'number' && typeof r.fairness.unterSoll === 'number', r.fairness);
  const vier = SP.planen({ monat: '2026-11', studios: [{ key: 'studio-0', name: 'L', schichten: SCH }],
    personen: ['A', 'B', 'C', 'D'].map((n) => person(n, { wocheStd: 20 })), abwesend: [], wuensche: {} });
  pruefe('vier Gleiche teilen sich die Samstage (Spannweite ≤ 1: ' + vier.fairness.wochenenden + ')', vier.fairness.wochenenden <= 1, vier.personen.map((p) => p.wochenenden));
  // Erster/letzter Arbeitstag
  const neu = SP.planen(Object.assign({}, EINGABE, { personen: TEAM.concat([person('Neu', { haupt: 'studio-1', ab: '2026-11-16' })]) }));
  pruefe('wer erst am 16. anfängt, steht vorher nicht im Plan', !neu.einsaetze.some((x) => x.id === 'Neu' && x.datum < '2026-11-16') && neu.einsaetze.some((x) => x.id === 'Neu'));

  // Vormonat: Spät am 31.10. → am 1.11. (So, hier Schicht täglich) kein Früh
  const vm = SP.planen({ monat: '2026-11', studios: [{ key: 'studio-0', name: 'L', schichten: [{ id: 'f', name: 'Früh', von: '07:00', bis: '14:00', tage: [1, 2, 3, 4, 5, 6, 7], min: 1 }] }],
    personen: [person('Aaron'), person('Zora')], abwesend: [], wuensche: {}, vormonat: [{ id: 'Aaron', datum: '2026-10-31', bis: '21:00' }] });
  // Gegenprobe: ohne Vormonat stünde Aaron (alphabetisch vorn) am 1. — sonst prüfte die Zeile darunter nichts
  const ohneVm = SP.planen({ monat: '2026-11', studios: [{ key: 'studio-0', name: 'L', schichten: [{ id: 'f', name: 'Früh', von: '07:00', bis: '14:00', tage: [1, 2, 3, 4, 5, 6, 7], min: 1 }] }], personen: [person('Aaron'), person('Zora')], abwesend: [], wuensche: {} });
  pruefe('GEGENPROBE: ohne Vormonat stünde Aaron am 1.11.', (ohneVm.einsaetze.find((x) => x.datum === '2026-11-01') || {}).id === 'Aaron');
  const erster = vm.einsaetze.find((x) => x.datum === '2026-11-01');
  pruefe('Vormonat zählt: wer am 31.10. bis 21 Uhr arbeitet, steht am 1.11. nicht um 7 Uhr', erster && erster.id === 'Zora', erster);

  console.log('\n── 10. Krankheit: Ersatz, Ausfälle, Tausch (Runde 169) ──');
  const groß = Object.assign({}, EINGABE, { personen: TEAM.concat([person('Gerd', { haupt: 'studio-1', studios: ['studio-0'], einspringen: true }),
    person('Hanna', { haupt: 'studio-1', studios: ['studio-0'] })]) });
  const plan = SP.planen(groß);
  const ziel = plan.einsaetze.find((x) => x.studio === 'studio-1' && x.schicht === 'f' && x.datum === '2026-11-18');
  const krankEingabe = Object.assign({}, groß, { abwesend: groß.abwesend.concat([{ id: ziel.id, von: '2026-11-18', bis: '2026-11-19', art: 'krank' }]) });
  const aus = SP.ausfaelle(krankEingabe, plan);
  const meiner = aus.find((a) => a.einsatz === ziel);
  pruefe('Krankmeldung nach dem Erstellen: der Einsatz erscheint als Ausfall „krank"', meiner && meiner.art === 'krank', aus.length);
  pruefe('… mit höchstens drei Ersatzvorschlägen, alle ohne harten Grund', meiner && meiner.vorschlag.length >= 1 && meiner.vorschlag.length <= 3 && meiner.vorschlag.every((v) => !v.grund), meiner && meiner.vorschlag);
  pruefe('… und die kranke Person selbst ist nicht dabei', meiner && !meiner.vorschlag.some((v) => v.id === ziel.id));
  /* Runde 274 — aus dem Betrieb: „bei der abwesendheit fehlt das man
     sich für uni oder sonstige weiterbildungen auch melden kann“. Eine
     Uni-Meldung ist hart wie Urlaub, heisst aber nicht „Urlaub“. */
  const uniEingabe = Object.assign({}, groß, { abwesend: groß.abwesend.concat([{ id: ziel.id, von: '2026-11-18', bis: '2026-11-18', art: 'schule' }]) });
  const uniAus = SP.ausfaelle(uniEingabe, plan).find((a) => a.einsatz === ziel);
  pruefe('Uni/Schule nach dem Erstellen: Ausfall heisst „Uni/Schule“', uniAus && uniAus.art === 'Uni/Schule', uniAus && uniAus.art);
  const uniPlan = SP.planen(uniEingabe);
  pruefe('… und beim Neu-Erstellen ist die Person an dem Tag nicht eingeteilt',
    !uniPlan.einsaetze.some((x) => x.id === ziel.id && x.datum === '2026-11-18'));
  const wbAus = SP.ausfaelle(Object.assign({}, groß, { abwesend: groß.abwesend.concat([{ id: ziel.id, von: '2026-11-18', bis: '2026-11-18', art: 'weiterbildung' }]) }), plan).find((a) => a.einsatz === ziel);
  pruefe('Weiterbildung: Ausfall heisst „Weiterbildung“', wbAus && wbAus.art === 'Weiterbildung', wbAus && wbAus.art);
  const liste = SP.ersatz(krankEingabe, plan, { datum: ziel.datum, studio: ziel.studio, schicht: ziel.schicht, ohne: ziel.id });
  const ruheVerletzt = liste.filter((c) => !c.grund).some((c) => {
    const vorher = plan.einsaetze.find((x) => x.id === c.id && x.datum === '2026-11-17');
    return vorher && vorher.bis > '20:00' && ziel.von < '07:30';
  });
  pruefe('Ersatz prüft die Ruhezeit (Spät am Vortag → kein Früh-Ersatz)', !ruheVerletzt);
  const gerd = liste.find((c) => c.id === 'Gerd'), hanna = liste.find((c) => c.id === 'Hanna');
  pruefe('wer „springt ein: ja" hat, steht beim Ersatz vor einer gleich passenden Person', !gerd || !hanna || gerd.grund || hanna.grund || liste.indexOf(gerd) < liste.indexOf(hanna) || gerd.weich, [gerd, hanna].map((x) => x && x.name + ':' + x.wert));
  pruefe('jede ausgegraute Person trägt ihren Grund', liste.filter((c) => c.grund).every((c) => c.grund.length > 3));
  // Tausch am selben Tag
  const tag = plan.einsaetze.filter((x) => x.datum === '2026-11-18' && x.studio === 'studio-1');
  if (tag.length >= 2) {
    const t = SP.tausch(groß, plan, tag[0], tag[1]);
    pruefe('Tausch am selben Tag wird nach denselben Regeln geprüft (' + (t.geht ? 'geht' : t.grund) + ')', typeof t.geht === 'boolean' && (t.geht || t.grund.length > 3));
  } else pruefe('(kein Tag mit zwei Einsätzen für den Tauschtest)', false);
  const azubiTausch = SP.planen({ monat: '2026-11', studios: [{ key: 'studio-0', name: 'L', schichten: [
      { id: 'f', name: 'Früh', von: '07:00', bis: '14:00', tage: [1], min: 2 }, { id: 's', name: 'Spät', von: '14:00', bis: '21:00', tage: [1], min: 1 }] }],
    personen: [person('Azubi', { allein: false }), person('M1'), person('M2')], abwesend: [], wuensche: {} });
  const sp = azubiTausch.einsaetze.find((x) => x.schicht === 's' && x.datum === '2026-11-02');
  const az = azubiTausch.einsaetze.find((x) => x.id === 'Azubi' && x.datum === '2026-11-02');
  if (sp && az) {
    const t2 = SP.tausch({ monat: '2026-11', studios: [{ key: 'studio-0', name: 'L', schichten: [
      { id: 'f', name: 'Früh', von: '07:00', bis: '14:00', tage: [1], min: 2 }, { id: 's', name: 'Spät', von: '14:00', bis: '21:00', tage: [1], min: 1 }] }],
      personen: [person('Azubi', { allein: false }), person('M1'), person('M2')], abwesend: [], wuensche: {} }, azubiTausch, az, sp);
    pruefe('Tausch, der den Azubi allein in die Spätschicht setzen würde, wird abgelehnt', !t2.geht && /allein/.test(t2.grund), t2);
  } else pruefe('(Azubi-Tausch nicht aufbaubar)', false, JSON.stringify(azubiTausch.einsaetze.slice(0, 4)));

  console.log('\n── 11. Excel: neue Blätter (Runde 169) ──');
  const v2 = SP.ausVorlage(await lies(path.join(__dirname, 'daten', 'schichtplaner-beispiel.xlsx')), key);
  const lena2 = v2.personen.find((p) => p.name === 'Lena Brandt') || {};
  const mira2 = v2.personen.find((p) => p.name === 'Mira Sommer') || {};
  const tob2 = v2.personen.find((p) => p.name === 'Tobias Lang') || {};
  pruefe('„springt bei Ausfall ein" gelesen', lena2.einspringen === true && mira2.einspringen === false, [lena2.einspringen, mira2.einspringen]);
  pruefe('Erster Arbeitstag als Excel-Datum gelesen', mira2.ab === '2026-11-09', mira2.ab);
  pruefe('Letzter Arbeitstag als TT.MM.JJJJ gelesen', tob2.bis === '2026-11-30', tob2.bis);
  pruefe('Feste Schichten: zwei Zeilen, Beispiele übersprungen', v2.fest.length === 2, JSON.stringify(v2.fest));
  pruefe('… Wochentage und Datum unterschieden', (v2.fest[0] || {}).tage && v2.fest[0].tage.join() === '1,2' && (v2.fest[1] || {}).datum === '2026-11-14', JSON.stringify(v2.fest));
  pruefe('Sondertage: Excel-Datum und TT.MM.JJJJ, Art erkannt', v2.sonder.length === 2 && v2.sonder[0].datum === '2026-11-07' && v2.sonder[0].art === 'mehr' &&
    v2.sonder[1].art === 'zu' && v2.sonder[1].studio === 'alle', JSON.stringify(v2.sonder));
  pruefe('Einstellungen gelesen (Frist 15, Feiertage offen, 6 am Stück, 4 Wunschtage)', v2.einstellungen.wunschFristTag === 15 && v2.einstellungen.feiertageZu === false &&
    v2.einstellungen.maxAmStueck === 6 && v2.einstellungen.maxWunschTage === 4, JSON.stringify(v2.einstellungen));
  const kaputtFest = SP.ausVorlage({ Mitarbeiter: [['Name', 'Hauptstudio'], ['Eva', 'Nippes']], 'Feste Schichten': [['Person', 'Studio', 'Schicht', 'Wochentage ODER Datum'],
    ['Eva', 'Nippes', 'Früh', '14.11.'], ['Eva', 'Nippes', 'Früh', '']] }, key);
  pruefe('Datum ohne Jahr oder leer wird gemeldet — nicht als „jeden Tag" gelesen', kaputtFest.fest.length === 0 && kaputtFest.fehler.filter((f) => /weder Wochentage/.test(f)).length === 2, JSON.stringify(kaputtFest));
  const leer2 = SP.ausVorlage(await lies(path.join(__dirname, '..', 'vorlagen', 'Schichtplaner-Vorlage.xlsx')), key);
  pruefe('leere Vorlage v2: keine festen Schichten, keine Sondertage (nur Beispiele)', !leer2.fest.length && !leer2.sonder.length, JSON.stringify([leer2.fest, leer2.sonder]));

  console.log('\n── 8. Tempo ──');
  const viele = [], st14 = [];
  for (let i = 0; i < 14; i++) st14.push({ key: 'studio-' + i, name: 'S' + i, schichten: SCH });
  for (let i = 0; i < 60; i++) viele.push(person('P' + i, { haupt: 'studio-' + (i % 14), studios: ['studio-' + ((i + 1) % 14)], rolle: i % 4 ? 'Vollzeit' : 'Minijob', maxMonatStd: 40, allein: i % 7 !== 0 }));
  const t0 = process.hrtime.bigint();
  const gross = SP.planen({ monat: '2026-11', studios: st14, personen: viele, abwesend: [], wuensche: {} });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  pruefe('14 Studios, 60 Personen, ein Monat: ' + Math.round(ms) + ' ms (Grenze 1000)', ms < 1000);
  pruefe('… und dabei ' + gross.einsaetze.length + ' Schichten verteilt', gross.einsaetze.length > 400);

  console.log('\n' + (schlecht ? '✗ Fehler: ' + schlecht : '✓ Fehler: keine') + ' — Schichtplaner-Rechnung, ' + gut + ' Prüfungen');
  process.exit(schlecht ? 1 : 0);
})().catch((e) => { console.error('Fehler: ' + e.stack); process.exit(1); });
