/* ── Stempel korrigieren: nur mit Grund, nie überschreiben (P-09) ──────

   Aus dem Betrieb, 24.9.2026:
     „füge hinzu das die leitung die zeiten ändern kann falls jemand sich
      nicht ausgestempelt hat oder so"

   zeitNachtragen und zeitStornieren werden hier AUSGEFÜHRT, gegen den
   Emulator — nicht nur gelesen. Geprüft wird:

     1. Die Leitung trägt einen vergessenen Feierabend nach. Der neue
        Stempel trägt quelle 'korrektur', den Grund, wer und wann — und
        die Uhrzeit ist Berliner Ortszeit, auch über die Sommerzeit.
     2. Ein Stempel wird als ungültig markiert. Er BLEIBT STEHEN, mit
        allen seinen Feldern; dazu kommt nur `storno`.
     3. Wer nicht darf, darf nicht — mit je einer Gegenprobe:
          · ein Mitarbeiter                         → abgewiesen
          · die Studioleitung eines ANDEREN Studios → abgewiesen
          · die Studioleitung für sich selbst       → abgewiesen
            (die Geschäftsführung darf es)
          · ohne Grund, in der Zukunft, zu weit zurück → abgewiesen
          · eine fremde Firma                        → abgewiesen
          · zweimal stornieren                       → abgewiesen
   ───────────────────────────────────────────────────────────────────── */
const path = require('path');

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8791';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'demo-funktionen';
process.env.GOOGLE_CLOUD_PROJECT = 'demo-funktionen';

const admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
const fns = require(path.join(__dirname, '..', '..', 'functions', 'index.js'));
const db = admin.firestore();

let bestanden = 0, gefallen = 0;
const protokoll = [];
function pruefe(name, bedingung, zusatz) {
  if (bedingung) { bestanden++; protokoll.push('  ✓ ' + name); }
  else { gefallen++; protokoll.push('  ✗ ' + name + (zusatz ? '\n      ' + zusatz : '')); }
}
async function scheitert(name, versprechen, muster) {
  try { await versprechen; gefallen++; protokoll.push('  ✗ ' + name + ' — GING DURCH'); }
  catch (e) {
    const ok = !muster || muster.test(String(e.message || e));
    if (ok) { bestanden++; protokoll.push('  ✓ ' + name); }
    else { gefallen++; protokoll.push('  ✗ ' + name + ' — falscher Grund: ' + e.message); }
  }
}
const als = (uid) => ({ auth: { uid } });
/* Ein Tag in Berliner Ortszeit, n Tage zurück. */
function tagZurueck(n) {
  return new Date(Date.now() - n * 86400000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
}

(async () => {
  const F = 'firmen/koerperformen/';
  const leute = {
    anna: { name: 'Anna', role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
    ben:  { name: 'Ben',  role: 'mitarbeiter', firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
    lisa: { name: 'Lisa', role: 'leiter',      firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
    otto: { name: 'Otto', role: 'leiter',      firma: 'koerperformen', aktiv: true, studioKeys: ['studio-2'] },
    max:  { name: 'Max',  role: 'chef',        firma: 'koerperformen', aktiv: true, studioKeys: ['studio-1'] },
    zoe:  { name: 'Zoe',  role: 'chef',        firma: 'fremdfirma',    aktiv: true, studioKeys: ['studio-1'] }
  };
  for (const [uid, d] of Object.entries(leute)) await db.doc('users/' + uid).set(d);
  await db.doc('firmen/koerperformen').set({ name: 'Körperformen', aktiv: true });
  await db.doc('firmen/fremdfirma').set({ name: 'Fremd', aktiv: true });

  /* Ein Tag mit vergessenem Feierabend: Anna kam um 9, ging nie. */
  const gestern = tagZurueck(1);
  await db.doc(F + 'zeiten/anna-kommen').set({ uid: 'anna', name: 'Anna', studioKey: 'studio-1',
    art: 'kommen', ts: Date.now() - 86400000, tag: gestern, monat: gestern.slice(0, 7),
    fremd: false, quelle: 'terminal', terminalId: 't1', terminalName: 'Empfang' });

  // ══ 1. Nachtragen ══
  const r = await fns.zeitNachtragen.run({ uid: 'anna', tag: gestern, uhr: '18:00', art: 'gehen',
    studioKey: 'studio-1', grund: 'Ausstempeln vergessen, laut Plan bis 18 Uhr' }, als('lisa'));
  const neu = r && r.id ? (await db.doc(F + 'zeiten/' + r.id).get()).data() : null;
  pruefe('die Studioleitung trägt den vergessenen Feierabend nach', !!neu && neu.art === 'gehen');
  pruefe('er steht in der Firma, nicht flach', !!neu && !(await db.doc('zeiten/' + r.id).get()).exists);
  pruefe('mit quelle „korrektur", Grund, wer und wann',
    !!neu && neu.quelle === 'korrektur' && /vergessen/.test(neu.grund) &&
    neu.korrigiertVon === 'lisa' && neu.korrigiertVonName === 'Lisa' && neu.korrigiertAm > 0,
    JSON.stringify(neu));
  pruefe('und mit monat — sonst wäre er in „Meine Zeiten" unsichtbar', !!neu && neu.monat === gestern.slice(0, 7));
  const uhr = neu ? new Date(neu.ts).toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }) : '';
  pruefe('18:00 heisst 18:00 Berliner Zeit', uhr === '18:00', uhr);
  const alt = (await db.doc(F + 'zeiten/anna-kommen').get()).data();
  pruefe('der ursprüngliche Stempel ist unverändert', alt.art === 'kommen' && alt.quelle === 'terminal' && !alt.storno);

  // ══ 2. Stornieren ══
  await fns.zeitStornieren.run({ id: 'anna-kommen', grund: 'Doppelt gestempelt, gilt nicht' }, als('max'));
  const st = (await db.doc(F + 'zeiten/anna-kommen').get()).data();
  pruefe('der Chef markiert einen Stempel als ungültig', !!st.storno && st.storno.von === 'max' && /Doppelt/.test(st.storno.grund));
  pruefe('ER BLEIBT STEHEN — Zeit, Art, Gerät unverändert',
    st.ts === alt.ts && st.art === 'kommen' && st.terminalName === 'Empfang' && st.quelle === 'terminal');

  // ══ 3. Wer nicht darf ══
  const gut = { uid: 'anna', tag: gestern, uhr: '17:00', art: 'gehen', studioKey: 'studio-1', grund: 'Ausstempeln vergessen' };
  await scheitert('ein Mitarbeiter trägt nach', fns.zeitNachtragen.run(gut, als('ben')), /Leitung/);
  await scheitert('die Leitung eines ANDEREN Studios trägt nach', fns.zeitNachtragen.run(gut, als('otto')), /Leitung/);
  await scheitert('die Studioleitung korrigiert sich selbst',
    fns.zeitNachtragen.run(Object.assign({}, gut, { uid: 'lisa' }), als('lisa')), /Geschäftsführung/);
  const selbst = await fns.zeitNachtragen.run(Object.assign({}, gut, { uid: 'lisa' }), als('max'));
  pruefe('(Gegenprobe) die Geschäftsführung korrigiert die Studioleitung', !!(selbst && selbst.ok));
  await scheitert('ohne Grund', fns.zeitNachtragen.run(Object.assign({}, gut, { grund: '' }), als('lisa')), /Grund/);
  await scheitert('in der Zukunft', fns.zeitNachtragen.run(Object.assign({}, gut, { tag: tagZurueck(-2) }), als('lisa')), /Zukunft/);
  await scheitert('zu weit zurück', fns.zeitNachtragen.run(Object.assign({}, gut, { tag: tagZurueck(70) }), als('lisa')), /Tage zurück/);
  await scheitert('eine unbekannte Art', fns.zeitNachtragen.run(Object.assign({}, gut, { art: 'urlaub' }), als('lisa')), /Art/);
  await scheitert('eine fremde Firma trägt nach', fns.zeitNachtragen.run(gut, als('zoe')), /nicht/);
  await scheitert('ein Mitarbeiter storniert', fns.zeitStornieren.run({ id: r.id, grund: 'will ich nicht' }, als('ben')), /Leitung/);
  await scheitert('zweimal stornieren', fns.zeitStornieren.run({ id: 'anna-kommen', grund: 'noch einmal' }, als('max')), /schon/);
  await scheitert('eine fremde Firma storniert', fns.zeitStornieren.run({ id: 'anna-kommen', grund: 'fremd hier' }, als('zoe')), /gibt es nicht/);
  const zahl = (await db.collection(F + 'zeiten').where('uid', '==', 'anna').get()).size;
  pruefe('nach allen Abweisungen stehen genau zwei Stempel von Anna da', zahl === 2, String(zahl));

  console.log('\n══ Stempel korrigieren ══');
  protokoll.forEach(z => console.log(z));
  console.log('\n  ' + bestanden + ' bestanden, ' + gefallen + ' gefallen');
  if (gefallen) { console.log('\n✗ Die Korrektur der Stempelzeiten ist nicht dicht.'); process.exit(1); }
  console.log('\n✓ Korrigieren nur durch die Leitung, nur mit Grund, und nichts wird überschrieben.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
