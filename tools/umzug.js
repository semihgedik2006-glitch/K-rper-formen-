/* ── Umzug: flache Daten → firmen/{kennung}/… ──────────────────────────
   Stufe C aus MANDANT-PLAN.md.

   DER WICHTIGSTE SATZ IN DIESER DATEI:
   Das hier ist eine KOPIE, kein Verschieben. Die alten Daten bleiben
   liegen. Der Rückweg ist damit: die vorherige App-Fassung ausrollen,
   die liest die alten Pfade. Kein Rückspielen einer Sicherung, kein
   Zeitdruck, kein Datenverlust. Aufgeräumt wird frühestens nach 30
   Tagen ruhigem Betrieb – und von Hand, nicht von diesem Programm.

   Zweite Eigenschaft: er ist wiederholbar. Ein zweiter Lauf schreibt
   dieselben Dokumente noch einmal und ändert nichts. Wer mitten im Lauf
   abbricht, startet einfach neu.

   Aufruf:
     node tools/umzug.js --firma koerperformen --projekt formenchat-probe --probe
     node tools/umzug.js --firma koerperformen --projekt formenchat-probe

   In Google Cloud Shell laeuft das ohne jeden Schluessel: dort ist das
   eigene Google-Konto schon angemeldet. Ein Dienstschluessel wird damit
   gar nicht gebraucht - besser so, denn ein Schluessel, den es nicht
   gibt, kann auch nicht verloren gehen.

   Gegen den Emulator:
     FIRESTORE_EMULATOR_HOST=127.0.0.1:8791 node tools/umzug.js …

   Gegen ein echtes Projekt braucht es GOOGLE_APPLICATION_CREDENTIALS
   oder GCLOUD_PROJECT plus hinterlegte Zugangsdaten.               */

/* Die Sammlungen, die einer Firma gehören. users, beitritt und
   pushTokens bleiben oben – die Gründe stehen in index.html bei S().

   Untersammlungen werden NICHT geraten, sondern aufgezählt. Firestore
   kann sie zwar auflisten, aber ein Tippfehler bliebe dann unbemerkt:
   der Lauf wäre grün und eine Sammlung fehlte. So steht schwarz auf
   weiß, was erwartet wird, und die Zählprüfung merkt es. */
const STUDIO_UNTER = ['todos', 'cleaning', 'cleaningNotes', 'devices',
  'deviceLog', 'shifts', 'absences', 'handovers'];

const FLACH = ['inventory', 'announcements', 'trash', 'documents',
  'board', 'certificates', 'documentData', 'archives', 'config'];

const MIT_UNTER = [
  { name: 'studios', unter: STUDIO_UNTER },
  { name: 'channels', unter: ['messages'] },
  { name: 'dms', unter: ['messages'] },
];

/* Kopiert eine Sammlung. Gibt zurück, wie viele Dokumente gelesen und
   wie viele geschrieben wurden – bei --probe ist geschrieben immer 0. */
async function sammlungKopieren(db, vonRef, nachRef, schreiben, stapelGroesse) {
  const snap = await vonRef.get();
  let geschrieben = 0;
  let stapel = db.batch(), imStapel = 0;
  for (const doc of snap.docs) {
    if (schreiben) {
      stapel.set(nachRef.doc(doc.id), doc.data(), { merge: false });
      imStapel++;
      if (imStapel >= stapelGroesse) {
        await stapel.commit();
        stapel = db.batch(); imStapel = 0;
      }
    }
    geschrieben++;
  }
  if (schreiben && imStapel) await stapel.commit();
  return { gelesen: snap.size, geschrieben: schreiben ? geschrieben : 0, docs: snap.docs };
}

/* Der eigentliche Umzug. Liefert eine Zählung je Pfad zurück – die ist
   die Grundlage der Prüfung, nicht das Gefühl, dass es geklappt hat. */
async function umziehen(db, firma, opt) {
  opt = opt || {};
  const schreiben = !opt.probe;
  const stapelGroesse = opt.stapel || 400;   // Firestore erlaubt 500
  const zaehlung = {};
  const wurzel = db.collection('firmen').doc(firma);

  if (schreiben) {
    // Das Firmen-Dokument selbst. merge:true, damit ein zweiter Lauf
    // nicht überschreibt, was der Admin dort inzwischen gepflegt hat.
    await wurzel.set({
      name: opt.name || firma,
      aktiv: true,
      angelegtAm: Date.now(),
      umgezogenAm: Date.now(),
    }, { merge: true });
  }

  for (const name of FLACH) {
    const r = await sammlungKopieren(db, db.collection(name),
      wurzel.collection(name), schreiben, stapelGroesse);
    zaehlung[name] = r.gelesen;
  }

  for (const { name, unter } of MIT_UNTER) {
    /* Die Elterndokumente können LEER sein und trotzdem
       Untersammlungen haben – in Firestore ist ein Dokument nur ein
       Pfadstück, wenn nie etwas hineingeschrieben wurde. .get() findet
       die dann nicht. listDocuments() schon. Ohne diesen Unterschied
       wäre der halbe Chatverlauf lautlos liegengeblieben. */
    const eltern = await db.collection(name).listDocuments();
    zaehlung[name] = eltern.length;
    for (const e of eltern) {
      const daten = await e.get();
      if (schreiben && daten.exists) {
        await wurzel.collection(name).doc(e.id).set(daten.data(), { merge: false });
      }
      for (const u of unter) {
        const r = await sammlungKopieren(db, e.collection(u),
          wurzel.collection(name).doc(e.id).collection(u), schreiben, stapelGroesse);
        if (r.gelesen) zaehlung[name + '/' + e.id + '/' + u] = r.gelesen;
      }
    }
  }
  return zaehlung;
}

/* Zählt NACH dem Umzug am Ziel nach. Getrennte Funktion und getrennter
   Lesevorgang – wer mit denselben Zahlen prüft, mit denen er
   geschrieben hat, prüft nichts. */
async function zielZaehlen(db, firma) {
  const zaehlung = {};
  const wurzel = db.collection('firmen').doc(firma);
  for (const name of FLACH) {
    zaehlung[name] = (await wurzel.collection(name).get()).size;
  }
  for (const { name, unter } of MIT_UNTER) {
    const eltern = await wurzel.collection(name).listDocuments();
    zaehlung[name] = eltern.length;
    for (const e of eltern) {
      for (const u of unter) {
        const n = (await e.collection(u).get()).size;
        if (n) zaehlung[name + '/' + e.id + '/' + u] = n;
      }
    }
  }
  return zaehlung;
}

/* Vergleicht Quelle und Ziel. Gibt die Abweichungen zurück – leer heißt
   sauber. Ein Pfad, der am Ziel MEHR hat, ist auch eine Abweichung:
   dann liegt dort etwas, das nicht aus dem Umzug stammt. */
function vergleichen(vorher, nachher) {
  const abweichungen = [];
  const alle = new Set(Object.keys(vorher).concat(Object.keys(nachher)));
  for (const p of alle) {
    const a = vorher[p] || 0, b = nachher[p] || 0;
    if (a !== b) abweichungen.push({ pfad: p, quelle: a, ziel: b });
  }
  return abweichungen;
}

module.exports = { umziehen, zielZaehlen, vergleichen, FLACH, MIT_UNTER, STUDIO_UNTER };

/* ── Aufruf von der Kommandozeile ── */
if (require.main === module) {
  const arg = k => {
    const i = process.argv.indexOf(k);
    return i > 0 ? process.argv[i + 1] : null;
  };
  const firma = arg('--firma');
  const probe = process.argv.includes('--probe');
  if (!firma) {
    console.error('Aufruf: node tools/umzug.js --firma <kennung> --projekt <projekt> [--probe]');
    process.exit(2);
  }

  /* firebase-admin liegt unter functions/. Dort ist es ohnehin
     installiert – ein zweites npm install nur für dieses Werkzeug wäre
     Unsinn. */
  const path = require('path');
  let admin;
  try {
    admin = require('firebase-admin');
  } catch (e) {
    admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin'));
  }
  const projekt = arg('--projekt') || process.env.GOOGLE_CLOUD_PROJECT ||
                  process.env.GCLOUD_PROJECT;
  if (!projekt) {
    console.error('Kein Projekt. Entweder --projekt <kennung> angeben oder\n' +
                  'vorher: gcloud config set project <kennung>');
    process.exit(2);
  }
  /* ── Die Sicherung gegen den teuersten Tippfehler ──
     Ohne sie wäre ein "--projekt formenchat" statt "formenchat-probe"
     ein Umzug auf den Live-Daten. Der wäre zwar auch nur eine Kopie und
     würde nichts löschen – aber er soll bewusst passieren, nicht aus
     Versehen. Deshalb muss man das Live-Projekt ausdrücklich benennen. */
  if (!/-probe$/.test(projekt) && !process.argv.includes('--wirklich-live')) {
    console.error('Projekt "' + projekt + '" sieht nicht nach einer Probe aus.\n' +
      'Wenn das Absicht ist, hänge --wirklich-live an.\n' +
      'Sonst: --projekt formenchat-probe');
    process.exit(2);
  }
  admin.initializeApp({ projectId: projekt });
  const db = admin.firestore();
  console.log('Projekt: ' + projekt);

  (async () => {
    console.log((probe ? '── PROBE (es wird nichts geschrieben) ──' : '── UMZUG ──') +
      '  Firma: ' + firma);
    const t0 = Date.now();
    const vorher = await umziehen(db, firma, { probe, name: arg('--name') });

    const summe = Object.values(vorher).reduce((a, b) => a + b, 0);
    Object.entries(vorher).sort((a, b) => b[1] - a[1]).forEach(([p, n]) => {
      if (n) console.log('  ' + String(n).padStart(6) + '  ' + p);
    });
    console.log('  ' + String(summe).padStart(6) + '  GESAMT   (' +
      Math.round((Date.now() - t0) / 1000) + ' s)');

    if (probe) {
      console.log('\nNichts geschrieben. Ohne --probe läuft der Umzug wirklich.');
      process.exit(0);
    }

    console.log('\n── ZÄHLPRÜFUNG (frisch am Ziel gelesen) ──');
    const nachher = await zielZaehlen(db, firma);
    const ab = vergleichen(vorher, nachher);
    if (!ab.length) {
      console.log('  ✓ Jede Sammlung hat am Ziel genauso viele Dokumente wie in der Quelle.');
      console.log('\n  Die alten Daten liegen unangetastet an ihrem Platz.');
      console.log('  Rückweg: die vorherige App-Fassung ausrollen.');
      process.exit(0);
    }
    console.log('  ✗ ABWEICHUNGEN – der Umzug ist NICHT sauber:');
    ab.forEach(a => console.log('      ' + a.pfad + ': Quelle ' + a.quelle + ', Ziel ' + a.ziel));
    console.log('\n  Nichts umschalten. Die alten Daten sind unberührt.');
    process.exit(1);
  })().catch(e => { console.error(e); process.exit(1); });
}
