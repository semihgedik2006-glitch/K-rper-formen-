/* ── Push-Nachrichten kommen EINMAL an ────────────────────────────────
   Aus dem Betrieb: „Push-Nachrichten kommen an, meistens sogar doppelt
   was bisschen stört."

   Die Ursache ist dokumentiertes Verhalten von FCM im Web und deshalb
   leicht wieder einzubauen: trägt eine Nachricht ein `notification`-Feld,
   zeigt der Browser sie im Hintergrund SELBST an — und ruft zusätzlich
   onBackgroundMessage() auf, wo der Service Worker sie ein zweites Mal
   anzeigt. Zwei Meldungen für eine Nachricht.

   WAS DIESER DURCHLAUF NICHT KANN, damit „grün" niemanden beruhigt, der
   es nicht sollte: Ob auf einem Handy wirklich genau eine Meldung
   erscheint, lässt sich hier nicht feststellen. Dafür braucht es ein
   echtes Gerät, einen echten FCM-Versand und eine Person, die hinsieht.
   Geprüft wird die eine Ursache, die belegt zu Doppelungen führt — und
   dass die Marke am Inhalt hängt, damit sich zwei gleiche Meldungen
   ersetzen statt zu stapeln.

   Kein Browser, kein Emulator: gelesen wird der Quelltext.
   ───────────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');

const W = path.join(__dirname, '..');
const errs = [];
const pruefe = (b, m) => { if (!b) errs.push(m); };

const fn = fs.readFileSync(path.join(W, 'functions', 'index.js'), 'utf8');
const sw = fs.readFileSync(path.join(W, 'sw.js'), 'utf8');
const app = fs.readFileSync(path.join(W, 'index.html'), 'utf8');

/* ── 1. Der Server schickt Daten, keine fertige Meldung ── */
const sendPush = (fn.match(/async function sendPush\([\s\S]*?\n}/) || [''])[0];
if (!sendPush) {
  errs.push('NICHT GEFUNDEN: sendPush() — dieser Durchlauf misst dann nichts');
} else {
  console.log('sendPush baut:',
    JSON.stringify((sendPush.match(/const message = \{[\s\S]*?\};/) || ['?'])[0]
      .replace(/\s+/g, ' ').slice(0, 120)));
  /* Der Kern. Steht hier wieder ein notification-Feld, zeigt der Browser
     die Meldung selbst an UND der Service Worker noch einmal. */
  pruefe(!/^\s*notification\s*:/m.test(sendPush),
    'DOPPELT: sendPush() schickt wieder ein notification-Feld — dann zeigt ' +
    'der Browser die Meldung selbst an und der Service Worker ein zweites Mal');
  pruefe(/data:\s*\{/.test(sendPush),
    'FEHLT: sendPush() schickt keine data — dann kommt gar nichts an, weil ' +
    'der Service Worker nichts zum Anzeigen hat');
  /* FCM weist Datenfelder ab, die keine Zeichenketten sind. Ein
     abgewiesener Versand fällt nur im Protokoll auf. */
  pruefe(/String\(title/.test(sendPush) && /String\(body/.test(sendPush),
    'TYP: die Datenfelder werden nicht zu Zeichenketten gemacht — FCM weist ' +
    'alles andere ab, und das sieht man nur im Protokoll');
  /* Tote Tokens müssen weiter aufgeräumt werden. Ein Gerät, das sich
     abgemeldet hat und dessen Token stehen bleibt, ist die ZWEITE
     mögliche Quelle für Doppelungen. */
  pruefe(/registration-token-not-registered/.test(sendPush),
    'TOKENS: abgemeldete Geräte werden nicht mehr aufgeräumt — alte Tokens ' +
    'sind die zweite mögliche Quelle für doppelte Meldungen');
}

/* ── 2. Der Service Worker liest die Daten ── */
const hintergrund = (sw.match(/onBackgroundMessage\([\s\S]*?\n\}\);/) || [''])[0];
if (!hintergrund) {
  errs.push('NICHT GEFUNDEN: onBackgroundMessage in sw.js');
} else {
  pruefe(/payload\s*&&\s*payload\.data/.test(hintergrund) || /payload\.data/.test(hintergrund),
    'SERVICE WORKER: er liest payload.data nicht — dann bleibt die Meldung leer, ' +
    'seit der Server Daten statt notification schickt');
  /* Der Rückfall bleibt: beim Ausrollen sind noch Nachrichten alter Form
     unterwegs, und eine PWA tauscht ihren Service Worker nicht in
     derselben Sekunde. */
  pruefe(/payload\.notification/.test(hintergrund),
    'RÜCKFALL: der Service Worker kennt die alte Form nicht mehr — Nachrichten, ' +
    'die beim Ausrollen unterwegs sind, kämen leer an');
  /* Marke am Inhalt, nicht an der Uhrzeit. Mit Date.now() ist jede Marke
     einmalig, und zwei gleiche Meldungen legen sich nebeneinander. */
  pruefe(!/tag:\s*'kf-'\s*\+\s*Date\.now\(\)/.test(hintergrund),
    'MARKE: der Service Worker markiert wieder mit der Uhrzeit — dann können ' +
    'sich zwei gleiche Meldungen nicht ersetzen und stapeln sich');
  pruefe(/tag:/.test(hintergrund),
    'MARKE: gar keine Marke — dann stapelt sich jede Meldung');
}

/* Die Fassung muss hochgezählt sein, sonst behält ein Gerät den alten
   Service Worker und zeigt weiter doppelt an. */
const ver = (sw.match(/const VERSION = '(v\d+)'/) || [])[1];
console.log('Service-Worker-Fassung:', ver);
pruefe(ver && +ver.slice(1) >= 5,
  'FASSUNG: sw.js steht auf „' + ver + '" — ohne Hochzählen behalten die ' +
  'Geräte den alten Service Worker und zeigen weiter doppelt an');

/* ── 3. Die App im Vordergrund ── */
const vorn = (app.match(/messaging\.onMessage\(function[\s\S]*?\n    \}\);/) || [''])[0];
if (!vorn) {
  errs.push('NICHT GEFUNDEN: messaging.onMessage in index.html');
} else {
  pruefe(/payload\.data/.test(vorn),
    'VORDERGRUND: die App liest payload.data nicht — bei offener App bliebe ' +
    'die Meldung leer');
  pruefe(/payload\.notification/.test(vorn),
    'VORDERGRUND: der Rückfall auf die alte Form fehlt');
}
pruefe(!/tag:\s*'kf-'\+Date\.now\(\)/.test(app),
  'MARKE: die App markiert wieder mit der Uhrzeit');

/* ── 4. GEGENPROBE zum Durchlauf selbst ──
   Die Prüfungen oben suchen nach Abwesenheit („kein notification"). So
   etwas ist auch dann grün, wenn die Datei gar nicht gelesen wurde oder
   die Funktion verschwunden ist. Diese Zeilen stellen sicher, dass
   wirklich der richtige Text vor uns liegt. */
pruefe(fn.length > 10000 && sw.length > 500 && app.length > 100000,
  'MESSUNG LEER: eine der drei Dateien ist verdächtig kurz gelesen worden');
pruefe(/sendEachForMulticast/.test(sendPush || ''),
  'MESSUNG LEER: in sendPush steht gar kein Versand — dann prüft dieser ' +
  'Durchlauf eine Funktion, die es so nicht mehr gibt');

console.log(errs.length
  ? '\n✗ ' + errs.join('\n✗ ')
  : '\n✓ Push: der Server schickt Daten statt einer fertigen Meldung, der ' +
    'Service Worker zeigt sie genau einmal an, und die Marke hängt am Inhalt');
process.exit(errs.length ? 1 : 0);
