/* Anmeldung für Nox, Semihs persönlichen Assistenten (Repo Assistent).
   Nox unterschreibt jede Anfrage mit Ed25519. Hier steht nur sein
   öffentlicher Schlüssel; der private bleibt bei Nox. Wer dieses Repo
   liest, kann sich damit nicht als Nox ausgeben.
   Unterschrieben wird "zeit\nGET\n/noxLesen?suche\nsha256(body)".
   Älter als fünf Minuten wird abgewiesen. */
const crypto = require('crypto');

const NOX_SCHLUESSEL = '+OfhHtQynzjULkhparlhAQCh6mtaqHXdkFE1y1AgBKY=';
const NOX_FIRMA = 'koerperformen';
const NOX_MAX_ALTER_MS = 5 * 60 * 1000;

function noxText(zeit, methode, pfad, body) {
  const hash = crypto.createHash('sha256').update(body || '').digest('hex');
  return zeit + '\n' + String(methode).toUpperCase() + '\n' + pfad + '\n' + hash;
}

function noxSignaturOk(o) {
  const zeit = String(o.zeit || '');
  if (!/^\d{10,16}$/.test(zeit) || !o.signatur) return false;
  const jetzt = o.jetzt || Date.now();
  if (Math.abs(jetzt - Number(zeit)) > NOX_MAX_ALTER_MS) return false;
  try {
    const roh = Buffer.from(o.oeffentlich || NOX_SCHLUESSEL, 'base64');
    if (roh.length !== 32) return false;
    const key = crypto.createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: roh.toString('base64url') }, format: 'jwk' });
    const sig = Buffer.from(String(o.signatur), 'base64');
    if (sig.length !== 64) return false;
    return crypto.verify(null, Buffer.from(noxText(zeit, o.methode, o.pfad, o.body)), key, sig);
  } catch (e) {
    return false;
  }
}

/* Aus req.url nur die Suche nehmen: wie Cloud Functions den Pfad vor dem
   Fragezeichen zeigen, hängt von der Generation ab. */
function noxPfad(url, name) {
  const i = String(url || '').indexOf('?');
  return '/' + (name || 'noxLesen') + (i >= 0 ? String(url).slice(i) : '');
}

/* Nox und Formi (10.11.2026, Semih: Stufe 1 und 2). Nox darf Formi
   fragen, Formis Bericht lesen und Wissen nur VORSCHLAGEN — übernommen
   wird es erst nach Freigabe in der App. Mehr Wege gibt es nicht. */
const NOX_FORMI_KATEGORIEN = ['Geräte & Hygiene', 'Training & EMS', 'Kunden & Verträge', 'Gesundheit & Atteste', 'Abläufe & Ansprechpartner', 'Marketing', 'Sonstiges'];

function noxFormiAuftrag(b) {
  const d = b || {};
  const text = (v, max) => String(v || '').trim().slice(0, max);
  if (d.art === 'frage') {
    const frage = text(d.frage, 2000);
    if (!frage) return null;
    return { pfad: 'frage', body: { frage, name: 'Nox', studio: '', vorname: 'Semih', ton: 'sachlich' } };
  }
  if (d.art === 'bericht') {
    return { pfad: 'bericht', body: { tage: Math.min(Math.max(Math.floor(Number(d.tage) || 1), 1), 31) } };
  }
  if (d.art === 'vorschlag') {
    const thema = text(d.thema, 300), inhalt = text(d.inhalt, 5000);
    if (thema.length < 3 || inhalt.length < 10) return null;
    const kategorie = NOX_FORMI_KATEGORIEN.indexOf(d.kategorie) >= 0 ? d.kategorie : 'Sonstiges';
    return { pfad: 'vorschlag/import', body: { eintraege: [{ thema, inhalt, kategorie }], von: 'Nox (für Semih)', vonId: 'nox', quelle: 'Nox' } };
  }
  return null;
}

function noxEintrag(art, ort, d, namen) {
  const erwaehnt = (Array.isArray(d.mentions) ? d.mentions : []).map(u => namen[u] || 'jemand');
  return {
    art,
    ort,
    von: d.name || d.from || d.createdBy || namen[d.uid] || 'jemand',
    text: String(d.text || d.title || '').slice(0, 1500) + (d.desc ? ' – ' + String(d.desc).slice(0, 500) : ''),
    ts: Number(d.ts) || 0,
    erwaehnt,
    bild: !!d.img,
    sprachnachricht: !!d.audio,
    faellig: d.due ? Number(d.due) : null,
    erledigt: d.done === true ? true : undefined,
  };
}

module.exports = { NOX_SCHLUESSEL, NOX_FIRMA, NOX_MAX_ALTER_MS, NOX_FORMI_KATEGORIEN, noxText, noxSignaturOk, noxPfad, noxEintrag, noxFormiAuftrag };
