/* ══════════════════════════════════════════════════════════════════════
   SCHICHTPLANER — DIE RECHNUNG (Runde 154)

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
