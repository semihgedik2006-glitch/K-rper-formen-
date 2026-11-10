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
pruefe('Pfad mit eigenem Namen', N.noxPfad('/', 'noxFormi') === '/noxFormi');
const body = JSON.stringify({ art: 'frage', frage: 'Weste kaputt?' });
const zp = String(Date.now());
const sigPost = crypto.sign(null, Buffer.from(N.noxText(zp, 'POST', '/noxFormi', body)), privateKey).toString('base64');
const post = { oeffentlich, zeit: zp, signatur: sigPost, methode: 'POST', pfad: '/noxFormi', body };
pruefe('POST mit Rohtext gültig', N.noxSignaturOk(post));
pruefe('geänderter Rohtext abgewiesen', !N.noxSignaturOk({ ...post, body: body.replace('Weste', 'Gurt') }));
pruefe('Signatur für noxLesen gilt nicht für noxFormi', !N.noxSignaturOk({ ...post, pfad: '/noxLesen' }));
const f = N.noxFormiAuftrag({ art: 'frage', frage: '  Weste kaputt?  ' });
pruefe('Frage geht an /api/frage als Nox', f.pfad === 'frage' && f.body.frage === 'Weste kaputt?' && f.body.name === 'Nox');
pruefe('leere Frage abgewiesen', N.noxFormiAuftrag({ art: 'frage', frage: ' ' }) === null);
pruefe('Bericht 1 bis 31 Tage', N.noxFormiAuftrag({ art: 'bericht', tage: 99 }).body.tage === 31 && N.noxFormiAuftrag({ art: 'bericht' }).body.tage === 1);
const v = N.noxFormiAuftrag({ art: 'vorschlag', thema: 'Weste trocken', inhalt: 'Weste vor dem Training gut befeuchten.', kategorie: 'Erfunden' });
pruefe('Wissen nur als Vorschlag von Nox', v.pfad === 'vorschlag/import' && v.body.vonId === 'nox' && v.body.eintraege[0].kategorie === 'Sonstiges');
pruefe('zu kurzer Vorschlag abgewiesen', N.noxFormiAuftrag({ art: 'vorschlag', thema: 'ab', inhalt: 'x' }) === null);
pruefe('andere Wege gibt es nicht', ['antwort', 'wissen', 'aufgabe', 'idee', undefined].every(a => N.noxFormiAuftrag({ art: a, frage: 'x', text: 'x' }) === null));
pruefe('Kategorien wie im Worker', (() => { const w = require('fs').readFileSync(require('path').join(__dirname, '..', 'tools', 'studio-gehirn', 'worker.js'), 'utf8'); const m = w.match(/const KATEGORIEN = (\[[^\]]*\]);/); return !!m && JSON.stringify(JSON.parse(m[1])) === JSON.stringify(N.NOX_FORMI_KATEGORIEN); })());
pruefe('nur Körperformen', N.NOX_FIRMA === 'koerperformen');

if (fehler) { console.log('\n✗ ' + fehler + ' Fehler'); process.exit(1); }
console.log('\n✓ Nox-Zugang');
