/* Geteiltes Video (Runde 308) – das Skript zu v.html.
 *
 * Die Kennung steht in der Adresse: /v/<Kennung> (oder v.html#<Kennung>).
 * Gelesen wird EIN Dokument über die öffentliche Firestore-Schnittstelle,
 * abgespielt wird über die Speicher-Schnittstelle ohne Download-Schlüssel.
 * Beides prüfen die Regeln (firestore.rules: freigaben, nur „get";
 * storage-videos.rules: Freigabe besteht, ist aktiv, nicht abgelaufen).
 */
(function () {
  'use strict';
  var K = window.KONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  function kennung() {
    var h = String(location.hash || '').replace(/^#/, '');
    var m = /\/v\/([A-Za-z0-9]{20,40})\/?$/.exec(location.pathname || '');
    var k = m ? m[1] : h;
    return /^[A-Za-z0-9]{20,40}$/.test(k) ? k : '';
  }
  function zeige(titel, text) {
    $('vRahmen').hidden = true;
    $('vTitel').hidden = true;
    var h = $('vHinweis');
    h.hidden = false;
    h.innerHTML = '';
    var b = document.createElement('b'); b.textContent = titel; h.appendChild(b);
    if (text) { var p = document.createElement('p'); p.textContent = text; h.appendChild(p); }
  }
  /* Firestore-REST liefert typisierte Werte: {stringValue}, {integerValue} … */
  function wert(f, n) {
    var x = f && f[n]; if (!x) return null;
    if ('stringValue' in x) return x.stringValue;
    if ('booleanValue' in x) return x.booleanValue;
    if ('integerValue' in x) return Number(x.integerValue);
    if ('doubleValue' in x) return Number(x.doubleValue);
    return null;
  }
  function datum(ms) {
    try { return new Date(ms).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return ''; }
  }

  var id = kennung();
  if (K.firma_anzeige) $('vFirma').textContent = K.firma_anzeige;
  if (!id) { zeige('Dieser Link ist unvollständig.', 'Bitte den ganzen Link aus der Nachricht öffnen.'); return; }
  if (!K.firebase || !K.firebase.projectId || !K.videoEimer) {
    zeige('Videos lassen sich hier nicht abspielen.', 'Für diese Adresse ist kein Video-Speicher eingerichtet.');
    return;
  }

  var url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(K.firebase.projectId) +
    '/databases/(default)/documents/freigaben/' + id + '?key=' + encodeURIComponent(K.firebase.apiKey || '');
  fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer' }).then(function (r) {
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('Status ' + r.status);
    return r.json();
  }).then(function (doc) {
    if (!doc || !doc.fields) {
      zeige('Dieses Video ist nicht mehr da.', 'Der Link wurde zurückgezogen oder gibt es nicht. Frag bei der Person nach, die ihn geschickt hat.');
      return;
    }
    var f = doc.fields;
    var aktiv = wert(f, 'aktiv'), bis = wert(f, 'bis') || 0, pfad = wert(f, 'pfad') || '', titel = wert(f, 'titel') || 'Video';
    if (aktiv !== true) { zeige('Dieses Video ist nicht mehr freigegeben.', 'Der Link wurde zurückgezogen.'); return; }
    if (bis && bis < Date.now()) { zeige('Dieser Link ist abgelaufen.', 'Er galt bis zum ' + datum(bis) + '. Frag nach einem neuen Link.'); return; }
    var v = $('vVideo');
    v.addEventListener('error', function () {
      zeige('Das Video lässt sich gerade nicht abspielen.', 'Vielleicht wurde der Link eben zurückgezogen – oder die Verbindung ist weg. Bitte später noch einmal öffnen.');
    });
    v.src = 'https://firebasestorage.googleapis.com/v0/b/' + encodeURIComponent(K.videoEimer) +
      '/o/' + encodeURIComponent(pfad) + '?alt=media';
    document.title = titel;
    $('vTitel').textContent = titel; $('vTitel').hidden = false;
    $('vHinweis').hidden = true; $('vRahmen').hidden = false;
    var fuss = $('vFuss');
    fuss.textContent = bis ? 'Dieser Link gilt bis zum ' + datum(bis) + '.' : 'Geteilt über StudioChat.';
    fuss.hidden = false;
  }).catch(function () {
    zeige('Das Video lässt sich gerade nicht laden.', 'Bitte die Verbindung prüfen und die Seite neu laden.');
  });
})();
