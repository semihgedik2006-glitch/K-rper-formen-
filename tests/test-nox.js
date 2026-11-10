/* Nox-Zugang: Signaturprüfung und Einträge. Ohne Emulator. */
const assert = require('assert');
const crypto = require('crypto');
const N = require('../functions/nox-pruefung.js');

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const oeffentlich = Buffer.from(publicKey.export({ format: 'jwk' }).x, 'base64url').toString('base64');
const zeit = String(Date.now());
const pfad = N.noxPfad('/?seit=123');
const signatur = crypto.sign(null, Buffer.from(N.noxText(zeit, 'GET', pfad, '')), privateKey).toString('base64');
const basis = { oeffentlich, zeit, signatur, methode: 'GET', pfad, body: '' };

let fehler = 0;
function pruefe(name, ok) { console.log((ok ? '  ✓ ' : '  ✗ ') + name); if (!ok) fehler++; }

pruefe('gültige Signatur', N.noxSignaturOk(basis));
pruefe('anderer Pfad abgewiesen', !N.noxSignaturOk({ ...basis, pfad: N.noxPfad('/?seit=1') }));
pruefe('zu alt abgewiesen', !N.noxSignaturOk({ ...basis, jetzt: Number(zeit) + 6 * 60000 }));
pruefe('ohne Signatur abgewiesen', !N.noxSignaturOk({ ...basis, signatur: '' }));
pruefe('fremder Schlüssel abgewiesen', !N.noxSignaturOk({ ...basis, oeffentlich: undefined }));
pruefe('Pfad nur aus der Suche', N.noxPfad('/noxLesen?seit=5') === '/noxLesen?seit=5' && N.noxPfad('/') === '/noxLesen');
const e = N.noxEintrag('kanal', 'Hürth', { name: 'Anna', text: 'Hallo', ts: 5, mentions: ['u1'], img: 'x' }, { u1: 'Semih' });
pruefe('Eintrag löst Erwähnungen auf', e.erwaehnt[0] === 'Semih' && e.bild && e.von === 'Anna' && e.ts === 5);
pruefe('nur Körperformen', N.NOX_FIRMA === 'koerperformen');

if (fehler) { console.log('\n✗ ' + fehler + ' Fehler'); process.exit(1); }
console.log('\n✓ Nox-Zugang');
