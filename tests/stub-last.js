/* Firebase-Ersatz in ECHTER Betriebsgröße.

   stub-chef.js zeigt die Oberfläche mit einer Handvoll Beispieldaten.
   Der hier erzeugt stattdessen die Mengen, die nach etwa einem Jahr
   Betrieb in 14 Studios tatsächlich in der Datenbank liegen. Damit lässt
   sich messen, was sonst nur geschätzt wird: wie viele Dokumente die App
   bei einem einzigen Start liest, wie lange sie dafür braucht und wie
   viele Knoten dabei im Fenster stehen.

   Alle Mengen stehen offen in MENGE und sind über
   window.__menge (vor dem Laden gesetzt) überschreibbar – ein Test kann
   damit auch das Doppelte oder Zehnfache durchspielen.

   Die Annahmen sind Annahmen, keine Messwerte aus der echten Datenbank:
     14 Studios × 4 Personen        = 56 Konten
     je Studio 15 Aufgaben, 12 Putzpunkte, 7 Geräte, 60 Geräteeinträge
     je Studio 6 Wochen Schichtplan = 84 Schichten
     Chat: 120 Nachrichten je Kanal (mehr lädt die App nicht auf einmal)
     52 Wochensicherungen, 80 Dokumente, 40 Aushänge, 110 Nachweise      */
(function () {
  var STUDIOS = ['Longerich', 'Nippes', 'Ebertplatz', 'Rath', 'Porz', 'Rondorf',
    'Hürth', 'Brühl', 'Niederkassel Mondorf', 'Refrath', 'Overath',
    'Marialinden', 'Rösrath', 'Seelscheid'];

  var MENGE = Object.assign({
    proStudio: 4,          // Personen je Studio
    aufgaben: 15,          // offene + erledigte Aufgaben je Studio
    putzen: 12,            // Putzpunkte je Studio
    putznotizen: 20,       // Notizen je Studio (App lädt höchstens 50)
    geraete: 7,            // Geräte je Studio
    geraeteLog: 60,        // Einträge je Studio (App lädt höchstens 60)
    schichten: 84,         // 6 Wochen × 14 Schichten je Studio
    abwesend: 10,          // Urlaub/Krank je Studio
    uebergaben: 40,        // Übergaben je Studio (Grenze 40)
    nachrichten: 120,      // je Kanal (Grenze CHAT_PAGE)
    kanaele: 15,           // allgemein + 14 Studios
    dokumente: 80,         // (Grenze 200)
    aushaenge: 40,         // (Grenze 60)
    nachweise: 110,        // 2 je Person
    sicherungen: 52,       // ein Jahr Wochenarchive (Grenze 52)
    brett: 50,             // schwarzes Brett (Grenze 50)
    material: 12           // Posten je Studio
  }, window.__menge || {});

  var VORNAME = ['Anna', 'Ben', 'Clara', 'David', 'Elena', 'Finn', 'Greta', 'Hannes',
    'Ida', 'Jonas', 'Katrin', 'Lukas', 'Mara', 'Nils', 'Olivia', 'Paul',
    'Quirin', 'Rena', 'Sven', 'Tina', 'Ulf', 'Vera', 'Wanda', 'Yusuf'];
  var NACHNAME = ['Meier', 'Kraus', 'Schmitz', 'Weber', 'Fischer', 'Wagner', 'Becker',
    'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf'];

  // Immer dieselbe Reihenfolge: zwei Läufe müssen vergleichbar sein.
  var _z = 12345;
  function zufall() { _z = (_z * 1103515245 + 12345) % 2147483648; return _z / 2147483648; }
  function waehle(a) { return a[Math.floor(zufall() * a.length)]; }
  function tag(n) {
    var d = new Date(); d.setDate(d.getDate() + (n || 0));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
      '-' + String(d.getDate()).padStart(2, '0');
  }
  function sk(name) { return 'studio-' + STUDIOS.indexOf(name); }
  function wdh(n, f) { var a = []; for (var i = 0; i < n; i++) a.push(f(i)); return a; }

  /* ── Konten ───────────────────────────────────────────────────────────
     Die Rolle des angemeldeten Kontos entscheidet über fast alles: ein
     Chef beobachtet 14 Studios, ein Mitarbeiter genau eins. Für die
     Kostenrechnung ist der Mitarbeiter der wichtige Fall – so sehen 56
     von 57 Konten die App.                                             */
  var ROLLE = window.__rolle || 'chef';
  var MEINE = ROLLE === 'chef' ? STUDIOS.slice()
    : ROLLE === 'leiter' ? [STUDIOS[6], STUDIOS[7]]
      : [STUDIOS[6]];
  var USERS = [{
    id: 'testuid',
    name: ROLLE === 'chef' ? 'Test Chef' : ROLLE === 'leiter' ? 'Test Leitung' : 'Test Mitarbeiter',
    role: ROLLE, email: ROLLE + '@kf.de',
    studios: MEINE, studioKeys: MEINE.map(sk), avatar: '💪',
    color: '#00E06E', lastSeen: Date.now() - 30000, aktiv: true
  }];
  STUDIOS.forEach(function (s, si) {
    for (var i = 0; i < MENGE.proStudio; i++) {
      var id = 'u' + si + '-' + i;
      USERS.push({
        id: id,
        name: waehle(VORNAME) + ' ' + waehle(NACHNAME),
        role: i === 0 ? 'leiter' : 'mitarbeiter',
        email: id + '@kf.de',
        studios: [s], studioKeys: [sk(s)],
        avatar: waehle(['💪', '🏋️', '🤸', '🧘', '⚡']),
        color: waehle(['#00E06E', '#3B82F6', '#F59E0B', '#EC4899']),
        lastSeen: Date.now() - Math.floor(zufall() * 7 * 86400000),
        aktiv: true
      });
    }
  });
  var PROFILE = USERS[0];

  /* ── Chat ─────────────────────────────────────────────────────────── */
  var SATZ = ['Guten Morgen zusammen!', 'Bin heute 10 Minuten später.',
    'Kann jemand die Handtücher nachlegen?', 'Gerät 2 macht wieder Probleme.',
    'Danke euch, hat gut geklappt.', 'Wer übernimmt Samstag den Frühdienst?',
    'Neue Lieferung ist da.', 'Bitte Gurte nach jedem Training desinfizieren.',
    'Termin verschoben auf Donnerstag.', 'Alles erledigt, schönen Feierabend!'];
  function nachrichten(kanal) {
    return wdh(MENGE.nachrichten, function (i) {
      var u = USERS[1 + (i % (USERS.length - 1))];
      var m = {
        id: kanal + '-m' + i, uid: u.id, name: u.name, role: u.role,
        studio: u.studios[0], text: SATZ[i % SATZ.length],
        ts: Date.now() - (MENGE.nachrichten - i) * 900000
      };
      if (i % 9 === 0) m.reactions = { '👍': [USERS[1].id, USERS[2].id], '🎉': [USERS[3].id] };
      if (i % 17 === 0) { m.replyTo = kanal + '-m' + (i - 1); m.replyName = USERS[2].name; m.replyText = SATZ[(i - 1) % SATZ.length]; }
      if (i % 23 === 0) m.pinned = true;
      if (i % 31 === 0) { m.poll = { q: 'Wer kann Samstag früh?', opts: ['Ich kann', 'Ich kann nicht', 'Nur ab 10 Uhr'] }; m.votes = {}; m.text = ''; }
      return m;
    });
  }
  var MSGS = {};
  MSGS['allgemein'] = nachrichten('allgemein');
  STUDIOS.forEach(function (s) { MSGS[sk(s)] = nachrichten(sk(s)); });

  /* ── Je Studio ────────────────────────────────────────────────────── */
  var TODOS = {}, CLEAN = {}, CLEANNOTES = {}, DEVICES = {}, DEVLOG = {},
    SHIFTS = {}, ABSENCES = {}, HANDOVER = {}, INVENTORY = {};
  var AUFG = ['Geräte desinfizieren', 'Handtücher waschen', 'Wasserspender auffüllen',
    'Empfang aufräumen', 'Müll rausbringen', 'Lager sortieren', 'Termine bestätigen'];
  var PUTZ = ['Böden wischen', 'Spiegel putzen', 'Toiletten reinigen', 'Kabinen wischen',
    'Fenster putzen', 'Staubsaugen', 'Türgriffe desinfizieren'];
  var WARE = ['Handtücher', 'Handschuhe', 'Desinfektionsmittel', 'Wasserflaschen',
    'Elektroden-Gel', 'Einweghandtücher', 'Müllbeutel', 'Seife',
    'Papierrollen', 'Batterien', 'Kabelbinder', 'Reinigungstücher'];

  STUDIOS.forEach(function (s, si) {
    var k = sk(s), leute = USERS.filter(function (u) { return u.studioKeys && u.studioKeys[0] === k; });
    if (!leute.length) leute = [USERS[1]];

    TODOS[k] = wdh(MENGE.aufgaben, function (i) {
      var t = {
        id: k + '-t' + i, title: AUFG[i % AUFG.length] + ' ' + (i + 1),
        desc: i % 3 ? '' : 'Nach jedem Training, bitte abhaken.',
        done: i % 3 === 1, createdBy: 'Chef', ts: Date.now() - i * 3600000
      };
      if (t.done) { t.doneBy = leute[i % leute.length].name; t.doneAt = Date.now() - i * 1800000; }
      if (i % 5 === 0) t.due = Date.now() + (i - 3) * 86400000;
      if (i % 7 === 0) t.recurring = 'daily';
      if (i % 11 === 0) t.steps = [{ t: 'Teil 1', d: true }, { t: 'Teil 2', d: false }, { t: 'Teil 3', d: false }];
      return t;
    });

    CLEAN[k] = wdh(MENGE.putzen, function (i) {
      var c = {
        id: k + '-c' + i, title: PUTZ[i % PUTZ.length],
        recurring: i % 3 === 0 ? 'daily' : (i % 3 === 1 ? 'weekly' : ''),
        done: i % 4 === 0, ts: Date.now() - i * 7200000
      };
      if (c.done) { c.doneBy = leute[i % leute.length].name; c.doneAt = Date.now() - (i % 6) * 3600000; }
      return c;
    });

    CLEANNOTES[k] = wdh(MENGE.putznotizen, function (i) {
      return {
        id: k + '-n' + i, text: 'Hinweis ' + (i + 1) + ': Bitte nachbestellen.',
        by: leute[i % leute.length].name, byUid: leute[i % leute.length].id,
        ts: Date.now() - i * 5400000
      };
    });

    DEVICES[k] = wdh(MENGE.geraete, function (i) {
      var d = {
        id: k + '-d' + i, name: i < 5 ? 'EMS-Gerät ' + (i + 1) : (i === 5 ? 'Waschmaschine' : 'Trockner'),
        place: 'Kabine ' + (i + 1), status: i === 1 ? 'defekt' : (i === 2 ? 'wartung' : 'ok'),
        ts: Date.now() - 300 * 86400000
      };
      if (d.status !== 'ok') {
        d.lastNote = 'Weste links gibt keinen Impuls';
        d.lastBy = leute[0].name; d.lastAt = Date.now() - 7200000;
      }
      return d;
    });

    DEVLOG[k] = wdh(MENGE.geraeteLog, function (i) {
      return {
        id: k + '-l' + i, devId: k + '-d' + (i % MENGE.geraete),
        devName: 'EMS-Gerät ' + ((i % 5) + 1),
        art: i % 3 === 0 ? 'defekt' : (i % 3 === 1 ? 'behoben' : 'wartung'),
        text: 'Eintrag ' + (i + 1), by: leute[i % leute.length].name,
        byUid: leute[i % leute.length].id, ts: Date.now() - i * 43200000
      };
    });

    SHIFTS[k] = wdh(MENGE.schichten, function (i) {
      var u = leute[i % leute.length];
      var sh = {
        // 2 Schichten am Tag über 6 Wochen: 2 Wochen zurück, 4 nach vorn.
        id: k + '-s' + i, date: tag(Math.floor(i / 2) - 14),
        from: ['06:00', '09:00', '13:00', '16:00'][i % 4],
        to: ['09:00', '13:00', '16:00', '21:00'][i % 4],
        uid: i % 10 === 0 ? 'testuid' : u.id, name: i % 10 === 0 ? 'Ich' : u.name
      };
      if (i % 19 === 0) { sh.tausch = 'offen'; sh.tauschVon = u.id; sh.tauschTs = Date.now() - 3600000; }
      return sh;
    });

    ABSENCES[k] = wdh(MENGE.abwesend, function (i) {
      var u = leute[i % leute.length];
      return {
        id: k + '-a' + i, from: tag(i * 3 - 5), to: tag(i * 3), uid: u.id, name: u.name,
        type: i % 3 === 0 ? 'krank' : 'urlaub',
        status: i % 4 === 0 ? 'offen' : 'genehmigt', ts: Date.now() - i * 86400000
      };
    });

    HANDOVER[k] = wdh(MENGE.uebergaben, function (i) {
      return {
        id: k + '-h' + i, text: 'Übergabe ' + (i + 1) + ': alles in Ordnung.',
        by: leute[i % leute.length].name, ts: Date.now() - i * 43200000
      };
    });

    INVENTORY[k] = {
      items: wdh(MENGE.material, function (i) {
        return { name: WARE[i % WARE.length], have: 20 - (i % 18), limit: 20, need: 0 };
      })
    };
  });

  /* ── Weltweit ─────────────────────────────────────────────────────── */
  var DOCS = wdh(MENGE.dokumente, function (i) {
    return {
      id: 'doc' + i, name: ['Hygieneplan', 'Wartungsanleitung', 'Arbeitsvertrag', 'Notfallplan'][i % 4] + ' ' + (i + 1),
      kind: i % 4 === 1 ? 'link' : 'file', url: 'https://example.com',
      size: 60000 + i * 900, cat: ['hygiene', 'technik', 'personal', 'sonstiges'][i % 4],
      studios: i % 5 === 0 ? [sk(STUDIOS[i % 14])] : 'all',
      ts: Date.now() - i * 86400000, uploadedBy: 'Chef'
    };
  });
  var ANNS = wdh(MENGE.aushaenge, function (i) {
    return {
      id: 'an' + i, uid: 'testuid', from: 'Test Chef',
      text: 'Aushang ' + (i + 1) + ': Bitte beachten – neue Regelung ab nächster Woche.',
      target: i % 4 === 0 ? 'all' : sk(STUDIOS[i % 14]),
      ts: Date.now() - i * 43200000, pinned: i === 0,
      readBy: USERS.slice(1, 1 + (i % 20)).map(function (u) { return u.id; })
    };
  });
  var CERTS = wdh(MENGE.nachweise, function (i) {
    var u = USERS[1 + (i % (USERS.length - 1))];
    return {
      id: 'z' + i, uid: u.id, name: u.name,
      art: ['ersthelfer', 'ems', 'trainer', 'sonstiges'][i % 4],
      bez: i % 4 === 3 ? 'Ernährungsberater' : '',
      bis: tag(i * 7 - 60), ts: Date.now() - i * 3600000
    };
  });
  var ARCHIVES = wdh(MENGE.sicherungen, function (i) {
    var mat = {}, cl = {};
    STUDIOS.forEach(function (s) {
      var k = sk(s);
      mat[k] = wdh(MENGE.material, function (j) {
        return { name: WARE[j % WARE.length], have: 30 - i % 25 - j, limit: 20, need: 0 };
      });
      cl[k] = {
        tasks: wdh(4, function (j) { return { title: PUTZ[j], rep: 'täglich', status: 'erledigt', by: 'Anna', at: '01.08. 14:30 Uhr' }; }),
        notes: []
      };
    });
    return {
      id: '2026-KW' + (52 - i), week: '2026-KW' + String(52 - i).padStart(2, '0'),
      label: 'Woche ' + (52 - i), updatedAt: Date.now() - i * 7 * 86400000,
      material: mat, cleaning: cl
    };
  });
  var BOARD = wdh(MENGE.brett, function (i) {
    return {
      id: 'b' + i, text: 'Brett-Eintrag ' + (i + 1), by: USERS[1 + i % 10].name,
      uid: USERS[1 + i % 10].id, ts: Date.now() - i * 86400000
    };
  });
  var TRASH = wdh(30, function (i) {
    return { id: 'tr' + i, art: 'todo', sk: sk(STUDIOS[i % 14]), titel: 'Gelöscht ' + i, deletedAt: Date.now() - i * 3600000, data: {} };
  });
  var SICHERUNG = { ts: Date.now() - 5 * 3600000, ok: true, ziel: 'gs://formenchat.firebasestorage.app/sicherung/' + tag(0), fehler: '' };

  /* ── Firestore-Ersatz ─────────────────────────────────────────────── */
  function unsub() { return function () {}; }
  function snap(list) {
    var docs = (list || []).map(function (d) { return { id: d.id, data: function () { return d; } }; });
    window.__gelesen = (window.__gelesen || 0) + docs.length;
    return {
      docs: docs, empty: !docs.length, size: docs.length,
      forEach: function (f) { docs.forEach(f); },
      docChanges: function () { return []; }
    };
  }
  function liste(path) {
    var m;
    if ((m = /^studios\/(.+)\/todos$/.exec(path))) return TODOS[m[1]] || [];
    if ((m = /^studios\/(.+)\/cleaning$/.exec(path))) return CLEAN[m[1]] || [];
    if ((m = /^studios\/(.+)\/cleaningNotes$/.exec(path))) return CLEANNOTES[m[1]] || [];
    if ((m = /^studios\/(.+)\/devices$/.exec(path))) return DEVICES[m[1]] || [];
    if ((m = /^studios\/(.+)\/deviceLog$/.exec(path))) return DEVLOG[m[1]] || [];
    if ((m = /^studios\/(.+)\/shifts$/.exec(path))) return SHIFTS[m[1]] || [];
    if ((m = /^studios\/(.+)\/absences$/.exec(path))) return ABSENCES[m[1]] || [];
    if ((m = /^studios\/(.+)\/handovers$/.exec(path))) return HANDOVER[m[1]] || [];
    if ((m = /^channels\/(.+)\/messages$/.exec(path))) return MSGS[m[1]] || [];
    if (/^dms\/.+\/messages$/.test(path)) return MSGS['allgemein'].slice(0, 40);
    if (path === 'users') return USERS;
    if (path === 'documents') return DOCS;
    if (path === 'announcements') return ANNS;
    if (path === 'certificates') return CERTS;
    if (path === 'archives') return ARCHIVES;
    if (path === 'board') return BOARD;
    if (path === 'trash') return TRASH;
    if (path === 'channels') return [{ id: 'allgemein', name: 'Allgemein' }];
    if (path === 'inventory') return Object.keys(INVENTORY).map(function (k) { return { id: k, items: INVENTORY[k].items }; });
    return [];
  }

  /* ── Der Umzug auf firmen/<kennung>/… (10.8.2026) ──
     Die App schickt seither jeden Zugriff durch S(), und das liefert
     'firmen/koerperformen/studios' statt 'studios'. Dieser Stub bildet
     die Daten weiterhin flach ab — die Lastdaten haben mit der
     Mandantentrennung nichts zu tun. Also wird der Vorsatz hier an
     EINER Stelle abgeschnitten. */
  function collection(path) {
    path = String(path).replace(/^firmen\/[^/]+\//, '');
    var grenze = 0, vonHinten = false, filter = [];
    var k = {
      _p: path,
      doc: function (id) {
        var dp = path + '/' + id;
        return {
          /* Firmen-Vorsatz durch dieselbe Tür wie ein flacher Zugriff
             — siehe stub-chef.js. */
          collection: function (sub) {
            if (/^firmen\/[^/]+$/.test(dp) && fs && fs.collection) return fs.collection(sub);
            return collection(dp + '/' + sub);
          },
          get: function () {
            if (path === 'users') return Promise.resolve({ exists: true, id: id, data: function () { return id === 'testuid' ? PROFILE : (USERS.filter(function (u) { return u.id === id; })[0] || {}); } });
            if (path === 'config' && id === 'sicherung') return Promise.resolve({ exists: true, id: id, data: function () { return SICHERUNG; } });
            if (path === 'archives') { var a = ARCHIVES.filter(function (x) { return x.id === id; })[0]; return Promise.resolve({ exists: !!a, id: id, data: function () { return a || {}; } }); }
            return Promise.resolve({ exists: true, id: id, data: function () { return {}; } });
          },
          set: function () { return Promise.resolve(); },
          update: function () { return Promise.resolve(); },
          delete: function () { return Promise.resolve(); },
          onSnapshot: function (cb) {
            window.__gelesen = (window.__gelesen || 0) + 1;
            if (path === 'inventory') {
              var inv = INVENTORY[id];
              try { cb({ exists: !!inv, id: id, metadata: { hasPendingWrites: false }, data: function () { return inv || { items: [] }; } }); } catch (e) { console.error(e); }
              return unsub();
            }
            try { cb({ exists: false, metadata: { hasPendingWrites: false }, data: function () { return {}; } }); } catch (e) {}
            return unsub();
          }
        };
      },
      // Auch Bereichsfilter, sonst misst man Mengen, die die echte
      // Datenbank nie liefert: loadMyShifts() grenzt auf sieben Tage ein.
      where: function (f, op, v) { filter.push({ f: f, op: op, v: v }); return k; },
      orderBy: function () { return k; },
      limit: function (n) { grenze = n; vonHinten = false; return k; },
      limitToLast: function (n) { grenze = n; vonHinten = true; return k; },
      add: function () { return Promise.resolve({ id: 'neu' }); },
      get: function () { return Promise.resolve(snap(auswahl())); },
      onSnapshot: function (cb) {
        try { cb(snap(auswahl())); } catch (e) { console.error('SNAP', path, e); }
        return unsub();
      }
    };
    function passt(d, f) {
      var w = d[f.f];
      switch (f.op) {
        case '==': return w === f.v;
        case '!=': return w !== f.v;
        case '>=': return w >= f.v;
        case '<=': return w <= f.v;
        case '>': return w > f.v;
        case '<': return w < f.v;
        case 'in': return (f.v || []).indexOf(w) >= 0;
        case 'not-in': return (f.v || []).indexOf(w) < 0;
        case 'array-contains': return Array.isArray(w) && w.indexOf(f.v) >= 0;
        case 'array-contains-any': return Array.isArray(w) && (f.v || []).some(function (x) { return w.indexOf(x) >= 0; });
        default: return true;
      }
    }
    function auswahl() {
      var l = liste(path);
      if (filter.length) l = l.filter(function (d) { return filter.every(function (f) { return passt(d, f); }); });
      if (grenze && l.length > grenze) l = vonHinten ? l.slice(-grenze) : l.slice(0, grenze);
      return l;
    }
    return k;
  }

  var fs = {
    settings: function () {},
    enablePersistence: function () { return Promise.resolve(); },
    collection: function (p) { return collection(p); },
    batch: function () { return { set: function () {}, update: function () {}, delete: function () {}, commit: function () { return Promise.resolve(); } }; }
  };
  window.__lastDaten = {
    studios: STUDIOS.length, konten: USERS.length,
    dokumenteGesamt: STUDIOS.length * (MENGE.aufgaben + MENGE.putzen + MENGE.putznotizen +
      MENGE.geraete + MENGE.geraeteLog + MENGE.schichten + MENGE.abwesend + MENGE.uebergaben + 1) +
      (MENGE.kanaele * MENGE.nachrichten) + MENGE.dokumente + MENGE.aushaenge +
      MENGE.nachweise + MENGE.sicherungen + MENGE.brett + USERS.length,
    menge: MENGE
  };
  window.firebase = {
    initializeApp: function () { return { firestore: function () { return fs; } }; },
    apps: [],
    app: function () { return { firestore: function () { return fs; }, functions: function () { return window.firebase.functions(); } }; },
    auth: function () {
      return {
        onAuthStateChanged: function (cb) { setTimeout(function () { cb({ uid: 'testuid', email: 'chef@kf.de' }); }, 60); return unsub(); },
        signInWithEmailAndPassword: function () { return Promise.resolve({ user: { uid: 'testuid' } }); },
        signOut: function () { return Promise.resolve(); },
        setPersistence: function () { return Promise.resolve(); },
        currentUser: { uid: 'testuid' }
      };
    },
    firestore: function () { return fs; },
    functions: function () {
      return { httpsCallable: function (name) { return function (data) { window.__aufruf = { name: name, data: data }; return Promise.resolve({ data: { ok: true, empfaenger: 1 } }); }; } };
    },
    messaging: function () { return { onMessage: function () {}, getToken: function () { return Promise.resolve(''); } }; },
    storage: function () { return { ref: function () { return {}; } }; }
  };
  firebase.firestore.FieldValue = {
    arrayUnion: function () { return {}; }, arrayRemove: function () { return {}; },
    serverTimestamp: function () { return Date.now(); },
    /* increment fehlte hier, und das kostete eine halbe Stunde: die
       Fehlermeldung der App rief fv.increment(1), bekam "is not a
       function" und wurde vom eigenen try/catch still geschluckt. Der
       Durchlauf meldete daraufhin "wird gar nicht gemeldet" — richtig,
       aber aus dem falschen Grund. */
    increment: function (n) { return { __increment: n }; }
  };
  firebase.auth.Auth = { Persistence: { LOCAL: 'local', SESSION: 'session', NONE: 'none' } };
  firebase.messaging.isSupported = function () { return false; };
})();
