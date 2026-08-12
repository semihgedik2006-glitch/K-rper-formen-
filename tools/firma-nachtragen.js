#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────────
   FELD "firma" AN BESTEHENDEN KONTEN NACHTRAGEN

   WARUM
   users ist die einzige Sammlung, die nicht unter firmen/<kennung>/
   liegt. Bis zum 12.8.2026 durfte deshalb JEDER Angemeldete JEDES Konto
   lesen — auch die einer anderen Firma. Die neue Regel verlangt, dass
   Leser und Konto zur selben Firma gehoeren.

   Das funktioniert nur, wenn jedes Konto das Feld auch HAT. Konten aus
   der Zeit vor der Mandantenfaehigkeit haben es nicht: fuer sie galt
   die stille Annahme "kein Feld = koerperformen". Diese Annahme traegt
   die Regel noch, eine Firestore-ABFRAGE aber nicht — where('firma',
   '==','koerperformen') findet ein Dokument ohne das Feld nicht.

   REIHENFOLGE, und sie ist wichtig:
     1. Dieses Werkzeug laufen lassen (aendert nur, was fehlt).
     2. Danach Regeln und App ausrollen.
   Andersherum steht das ganze Team vor einer leeren Personenliste, bis
   der Schritt nachgeholt ist.

   Dieser Schritt ist fuer sich genommen FOLGENLOS: er traegt genau den
   Wert ein, der ohnehin schon angenommen wurde. Man kann ihn also in
   Ruhe vorher machen.

   AUFRUF (in der Google Cloud Shell, im Projektordner):
     node tools/firma-nachtragen.js            # zeigt nur, was waere
     node tools/firma-nachtragen.js --wirklich # schreibt

   Mit --firma=<kennung> laesst sich ein anderer Wert setzen als die
   Voreinstellung koerperformen.
   ───────────────────────────────────────────────────────────────────── */
const admin = require('firebase-admin');

const args = process.argv.slice(2);
const wirklich = args.indexOf('--wirklich') >= 0;
const firmaArg = (args.find((a) => a.indexOf('--firma=') === 0) || '').split('=')[1];
const FIRMA = firmaArg || 'koerperformen';

admin.initializeApp();
const db = admin.firestore();

(async () => {
  console.log('── Konten ohne Feld "firma" ──');
  console.log(wirklich ? 'Modus: SCHREIBEN' : 'Modus: nur ansehen (--wirklich zum Schreiben)');
  console.log('Wert, der eingetragen wird: ' + FIRMA + '\n');

  const snap = await db.collection('users').get();
  let ohne = 0, mit = 0, andere = 0;
  const zuTun = [];

  snap.forEach((d) => {
    const f = (d.data() || {}).firma;
    if (f === undefined || f === null || String(f).trim() === '') {
      ohne++; zuTun.push(d.id);
    } else if (f === FIRMA) {
      mit++;
    } else {
      /* Konten einer ANDEREN Firma bleiben unangetastet. Ein Werkzeug,
         das hier pauschal ueberschreibt, verschiebt Kunden in fremde
         Betriebe — der teuerste denkbare Fehler in dieser App. */
      andere++;
    }
  });

  console.log('Konten insgesamt : ' + snap.size);
  console.log('schon ' + FIRMA + '  : ' + mit);
  console.log('andere Firma     : ' + andere + '  (werden NICHT angefasst)');
  console.log('ohne Feld        : ' + ohne);

  if (!ohne) {
    console.log('\n✓ Nichts zu tun. Regeln und App koennen ausgerollt werden.');
    return;
  }
  if (!wirklich) {
    console.log('\nEs wuerde bei ' + ohne + ' Konten "firma: ' + FIRMA + '" ergaenzt.');
    console.log('Zum Schreiben noch einmal mit --wirklich aufrufen.');
    return;
  }

  // In Stapeln, damit auch 500+ Konten durchlaufen
  let geschrieben = 0;
  for (let i = 0; i < zuTun.length; i += 400) {
    const stapel = db.batch();
    zuTun.slice(i, i + 400).forEach((id) => {
      stapel.set(db.collection('users').doc(id), { firma: FIRMA }, { merge: true });
    });
    await stapel.commit();
    geschrieben += Math.min(400, zuTun.length - i);
    console.log('  ' + geschrieben + ' / ' + zuTun.length);
  }

  // Nachzaehlen statt behaupten
  const nach = await db.collection('users').get();
  let restOhne = 0;
  nach.forEach((d) => {
    const f = (d.data() || {}).firma;
    if (f === undefined || f === null || String(f).trim() === '') restOhne++;
  });
  console.log('\n✓ ' + geschrieben + ' Konten ergaenzt. Ohne Feld verbleiben: ' + restOhne);
  if (restOhne) {
    console.log('⚠ Es sind noch welche ohne Feld. NICHT ausrollen, bevor das geklaert ist.');
    process.exit(1);
  }
  console.log('Jetzt koennen Regeln und App ausgerollt werden.');
})().catch((e) => {
  console.error('Fehler:', e && e.message);
  process.exit(1);
});
