/* Vergiftet die Testdaten aus stub-chef.js mit Angriffsmustern.

   Kein zweiter Datensatz: dieser Aufsatz legt sich ueber die vorhandene
   Attrappe und ersetzt in JEDEM gelieferten Dokument die Textfelder durch
   „Text + Nutzlast". Damit bleibt die Attrappe die eine Quelle der
   Testdaten, und neue Felder sind automatisch mit abgedeckt.

   Muss NACH stub-chef.js geladen werden. */
(function () {
  var NUTZLAST = window.__xssNutzlast || ['<img src=x onerror="window.__xss=1">'];
  var i = 0;
  function naechste() { return NUTZLAST[(i++) % NUTZLAST.length]; }

  /* Nur Felder, die als Text in der Oberflaeche landen. Kennungen,
     Datenblöcke und Adressen bleiben unangetastet — sonst findet die App
     ihre eigenen Datensaetze nicht mehr und der Durchlauf misst nichts. */
  var TEXTFELD = /^(text|name|title|desc|note|notiz|grund|kuerzel|from|fileName|status|spruch|by|doneBy|person|who|frage|label|question|q|answer|studioName|betreff|kommentar|reason|hinweis)$/;
  var TABU = /^(id|uid|firma|role|col|type|kind|img|audio|photo|url|docUrl|src|ts|date|to|studios|studioKeys|studio)$/;

  function vergiften(wert, tiefe) {
    if (tiefe > 6 || wert == null) return wert;
    if (typeof wert === 'string') return wert;
    if (Array.isArray(wert)) return wert.map(function (x) { return vergiften(x, tiefe + 1); });
    if (typeof wert !== 'object') return wert;
    var neu = {};
    Object.keys(wert).forEach(function (k) {
      var v = wert[k];
      if (typeof v === 'string' && TEXTFELD.test(k) && !TABU.test(k) && v.length < 400) {
        neu[k] = v + ' ' + naechste();
      } else if (v && typeof v === 'object') {
        neu[k] = vergiften(v, tiefe + 1);
      } else {
        neu[k] = v;
      }
    });
    return neu;
  }

  function docWrap(d) {
    if (!d || typeof d.data !== 'function') return d;
    var o = Object.create(d);
    o.data = function () { return vergiften(d.data(), 0); };
    o.id = d.id;
    o.exists = d.exists;
    return o;
  }

  function snapWrap(s) {
    if (!s) return s;
    if (typeof s.data === 'function' && !s.docs) return docWrap(s);
    var docs = (s.docs || []).map(docWrap);
    return {
      docs: docs, empty: !docs.length, size: docs.length,
      forEach: function (f) { docs.forEach(f); },
      docChanges: function () { return (s.docChanges ? s.docChanges() : []); },
      data: s.data ? function () { return vergiften(s.data(), 0); } : undefined,
      exists: s.exists, id: s.id
    };
  }

  function ketteWrap(k, tiefe) {
    if (!k || tiefe > 8) return k;
    var o = Object.create(k);
    ['doc', 'collection', 'where', 'orderBy', 'limit', 'limitToLast', 'startAfter']
      .forEach(function (n) {
        if (typeof k[n] === 'function') {
          o[n] = function () { return ketteWrap(k[n].apply(k, arguments), tiefe + 1); };
        }
      });
    if (typeof k.get === 'function') {
      o.get = function () { return k.get.apply(k, arguments).then(snapWrap); };
    }
    if (typeof k.onSnapshot === 'function') {
      o.onSnapshot = function (cb, err) {
        if (typeof cb === 'function') {
          return k.onSnapshot(function (s) { cb(snapWrap(s)); }, err);
        }
        return k.onSnapshot.apply(k, arguments);
      };
    }
    return o;
  }

  var echt = window.firebase.firestore;
  function gewrappt() {
    var fs = echt.apply(window.firebase, arguments);
    var o = Object.create(fs);
    o.collection = function () { return ketteWrap(fs.collection.apply(fs, arguments), 0); };
    o.doc = fs.doc ? function () { return ketteWrap(fs.doc.apply(fs, arguments), 0); } : undefined;
    return o;
  }
  Object.keys(echt).forEach(function (k) { gewrappt[k] = echt[k]; });
  window.firebase.firestore = gewrappt;
})();
