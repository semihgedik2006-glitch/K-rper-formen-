/* ══ SCHICHTPLANER — die Rechnung (Runde 156) ═══════════════════════
   Aus dem Betrieb, 19.10.2026: die Chefin erstellt die Pläne für 14
   Studios von Hand, „und das kostet sie mehrere Stunden an Aufwand
   immer wieder". Der Wunsch: eine Maschine, in die man einmal einträgt,
   wer wann kann, und die den Monat im Voraus vorschlägt.

   WARUM EINE EIGENE DATEI. Die Rechnung hat keine Oberfläche und keine
   Datenbank — sie bekommt Angaben und gibt einen Plan zurück. So lässt
   sie sich mit Node prüfen, ohne Browser (tests/test-schichtplaner-
   rechnung.js), und sie wird erst geladen, wenn jemand den Planer
   öffnet. Die App bleibt beim Start so schnell wie vorher.

   WARUM KEINE KI. Gleiche Angaben ergeben denselben Plan, und jede
   Einteilung trägt ihren Grund. Ein Plan, den man nicht nachvollziehen
   kann, prüft die Chefin jedes Mal ganz — dann hat sie nichts gespart.

   WAS HART IST UND WAS NICHT. Hart, also nie gebrochen: Abwesenheit
   (Urlaub, krank), „nie" in der festen Verfügbarkeit, eine Schicht pro
   Tag, 11 Stunden Ruhe, Jugendarbeitsschutz, Monatsgrenze beim Minijob,
   „darf nicht allein sein". Weich: Wunsch-frei-Tage, Höchsttage pro
   Woche, Früh/Spät. Weiche Regeln bricht der Planer nur, wenn sonst
   niemand da wäre — und dann steht es als Rückfrage im Plan, mit Namen.
   Aus dem Betrieb: „wenn die maschine begründet warum es nicht geht
   dann ja aber die mitarbeiter können ggf. auch gefragt werden das
   sollte dann aber klar gezeigt werden". */
(function (wurzel) {
  'use strict';

  var TAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  /* ── Datum, ohne Zeitzonen-Fallen ──
     Gerechnet wird mit 'JJJJ-MM-TT' und UTC-Mittag: so verschiebt die
     Sommerzeit nie einen Tag. */
  function zuDatum(s) { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)); }
  function zuText(d) {
    return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2);
  }
  function plusTage(s, n) { var d = zuDatum(s); d.setUTCDate(d.getUTCDate() + n); return zuText(d); }
  /* 1 = Montag … 7 = Sonntag */
  function wochentag(s) { var w = zuDatum(s).getUTCDay(); return w === 0 ? 7 : w; }
  function tageImMonat(monat) {
    var p = monat.split('-'), n = new Date(Date.UTC(+p[0], +p[1], 0)).getUTCDate(), r = [];
    for (var i = 1; i <= n; i++) r.push(monat + '-' + ('0' + i).slice(-2));
    return r;
  }
  /* Kalenderwoche nach ISO — Montag beginnt. Für „höchstens 3 Tage pro
     Woche" zählt die Woche, nicht der Monat. */
  function isoWoche(s) {
    var d = zuDatum(s), t = wochentag(s);
    d.setUTCDate(d.getUTCDate() + 4 - t);
    var j = new Date(Date.UTC(d.getUTCFullYear(), 0, 1, 12));
    return d.getUTCFullYear() + '-W' + ('0' + Math.ceil(((d - j) / 864e5 + 1) / 7)).slice(-2);
  }
  function minuten(hhmm) { var p = String(hhmm || '0:0').split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
  function dauerStd(von, bis) {
    var m = minuten(bis) - minuten(von); if (m <= 0) m += 1440;
    return m / 60;
  }

  /* ── Feiertage in NRW ──
     Die Studios liegen in und um Köln. Ob sie an Feiertagen öffnen,
     ist noch offen (Frage an die Chefin) — deshalb markiert der Planer
     sie nur, und die Einstellung `feiertageZu` entscheidet. */
  function ostersonntag(j) {
    var a = j % 19, b = Math.floor(j / 100), c = j % 100, d = Math.floor(b / 4), e = b % 4,
        f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
        mo = Math.floor((h + l - 7 * m + 114) / 31), ta = ((h + l - 7 * m + 114) % 31) + 1;
    return j + '-' + ('0' + mo).slice(-2) + '-' + ('0' + ta).slice(-2);
  }
  function feiertageNRW(jahr) {
    var o = ostersonntag(jahr), r = {};
    r[jahr + '-01-01'] = 'Neujahr';
    r[plusTage(o, -2)] = 'Karfreitag';
    r[plusTage(o, 1)] = 'Ostermontag';
    r[jahr + '-05-01'] = 'Tag der Arbeit';
    r[plusTage(o, 39)] = 'Christi Himmelfahrt';
    r[plusTage(o, 50)] = 'Pfingstmontag';
    r[plusTage(o, 60)] = 'Fronleichnam';
    r[jahr + '-10-03'] = 'Tag der Deutschen Einheit';
    r[jahr + '-11-01'] = 'Allerheiligen';
    r[jahr + '-12-25'] = '1. Weihnachtstag';
    r[jahr + '-12-26'] = '2. Weihnachtstag';
    return r;
  }

  /* ── Feste Verfügbarkeit: passt die Schicht in das, was jemand kann? ──
     Werte aus der Excel-Vorlage: ganztags · nur früh · nur spät · nie ·
     nach Absprache — oder eine eigene Uhrzeit wie „9–14". „Früh" heisst:
     die Schicht beginnt vor 12 Uhr. Leer heisst ganztags: was nicht
     eingetragen ist, schränkt nicht ein. */
  function verfuegbarkeit(wert) {
    var w = String(wert == null ? '' : wert).trim().toLowerCase();
    if (!w || w === 'ganztags' || w === 'ja' || w === 'immer') return { art: 'ganz' };
    if (w === 'nie' || w === 'nein' || w === '-' || w === 'frei') return { art: 'nie' };
    if (w.indexOf('absprache') >= 0) return { art: 'absprache' };
    if (w.indexOf('früh') >= 0 || w.indexOf('frueh') >= 0) return { art: 'frueh' };
    if (w.indexOf('spät') >= 0 || w.indexOf('spaet') >= 0) return { art: 'spaet' };
    var m = /(\d{1,2})(?:[:.](\d{2}))?\s*(?:-|–|bis)\s*(\d{1,2})(?:[:.](\d{2}))?/.exec(w);
    if (m) return { art: 'zeit', von: (+m[1]) * 60 + (+m[2] || 0), bis: (+m[3]) * 60 + (+m[4] || 0) };
    return { art: 'ganz', unklar: true };
  }
  function istFrueh(schicht) { return minuten(schicht.von) < 12 * 60; }
  function passtZeit(v, schicht) {
    if (v.art === 'ganz') return true;
    if (v.art === 'nie' || v.art === 'absprache') return false;
    if (v.art === 'frueh') return istFrueh(schicht);
    if (v.art === 'spaet') return !istFrueh(schicht);
    var a = minuten(schicht.von), b = minuten(schicht.bis);
    return a >= v.von && b <= v.bis;
  }

  /* Rollen, die einen eigenen Rahmen haben. Alles andere ist frei. */
  function istMinijob(p) { return /minijob|aushilfe/i.test(p.rolle || ''); }

  /* ── Die Hauptrechnung ──────────────────────────────────────────────
     eingabe = {
       monat: 'JJJJ-MM',
       studios: [{ key, name, schichten: [{ id, name, von, bis, tage:[1..7], min, braucht }] }],
       personen: [{ id, uid, name, rolle, haupt, studios:[], wocheStd, maxMonatStd,
                    maxTageWoche, allein, u18, kann:[], verf:{1..7: Text}, sperre, lieber }],
       abwesend: [{ id (Person), von, bis, art }],
       wuensche: { <Person>: { frei:[Datum], lieber, notiz } },
       feiertageZu: false,
       vormonat: [{ id, datum, bis }]   // letzte Schichten, für die Ruhezeit am 1.
     } */
  function planen(e) {
    var tage = tageImMonat(e.monat);
    var feiertage = feiertageNRW(+e.monat.slice(0, 4));
    var studios = e.studios || [];
    var personen = (e.personen || []).slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
    var wuensche = e.wuensche || {};
    var stand = {};
    personen.forEach(function (p) {
      var v = {};
      for (var t = 1; t <= 7; t++) v[t] = verfuegbarkeit((p.verf || {})[t]);
      /* Soll im Monat: Wochenstunden × Tage / 7. Ein Minijob ohne
         Wochenstunden richtet sich nach seiner Monatsgrenze. */
      var soll = p.wocheStd ? p.wocheStd * tage.length / 7 : (p.maxMonatStd || 0);
      stand[p.id] = { p: p, verf: v, std: 0, soll: soll, tage: {}, woche: {}, wochenenden: 0,
                      frueh: 0, spaet: 0, ende: {}, rueckfragen: 0 };
    });
    (e.vormonat || []).forEach(function (s) {
      if (stand[s.id]) stand[s.id].ende[s.datum] = s.bis;
    });
    var abwesend = {};
    (e.abwesend || []).forEach(function (a) {
      for (var d = a.von; d <= a.bis; d = plusTage(d, 1)) {
        (abwesend[a.id] = abwesend[a.id] || {})[d] = a.art || 'abwesend';
      }
    });

    var einsaetze = [], luecken = [], hinweise = [];

    /* Pro Tag alle Plätze sammeln, dann die knappsten zuerst besetzen:
       ein Platz, für den nur eine Person infrage kommt, darf nicht leer
       bleiben, weil diese Person schon woanders steht. */
    tage.forEach(function (datum) {
      var wt = wochentag(datum), ft = feiertage[datum];
      if (ft && e.feiertageZu) return;
      var plaetze = [];
      studios.forEach(function (st) {
        (st.schichten || []).forEach(function (sch) {
          if (sch.tage && sch.tage.length && sch.tage.indexOf(wt) < 0) return;
          plaetze.push({ datum: datum, studio: st, schicht: sch, min: Math.max(1, +sch.min || 1), besetzt: [] });
        });
      });
      plaetze.forEach(function (pl) { pl.knapp = kandidaten(pl, false).length; });
      plaetze.sort(function (a, b) { return a.knapp - b.knapp || a.studio.name.localeCompare(b.studio.name, 'de'); });
      plaetze.forEach(function (pl) {
        while (pl.besetzt.length < pl.min) {
          var liste = kandidaten(pl, false), rueck = false;
          if (!liste.length) { liste = kandidaten(pl, true); rueck = true; }
          if (!liste.length) break;
          eintragen(pl, liste[0], rueck);
        }
        if (pl.besetzt.length < pl.min) {
          luecken.push(luecke(pl));
        }
        if (ft) pl.feiertag = ft;
      });
    });

    function wochenende(d) { return wochentag(d) >= 6; }

    /* Wer kommt für diesen Platz infrage — und mit welcher Bewertung?
       weich=true lässt die weichen Regeln fallen (Rückfrage). */
    function kandidaten(pl, weich) {
      var r = [];
      personen.forEach(function (p) {
        var g = ausschluss(p, pl, weich);
        if (g) return;
        r.push({ p: p, wert: bewerten(p, pl), weich: weich ? weicheGruende(p, pl) : [] });
      });
      r.sort(function (a, b) { return b.wert - a.wert || a.p.name.localeCompare(b.p.name, 'de'); });
      return r;
    }

    /* Der Grund, warum jemand NICHT infrage kommt — oder null. */
    function ausschluss(p, pl, weich) {
      var s = stand[p.id], d = pl.datum, sch = pl.schicht, wt = wochentag(d);
      var studiosP = [p.haupt].concat(p.studios || []);
      if (studiosP.indexOf(pl.studio.key) < 0) return 'anderes Studio';
      if (pl.besetzt.indexOf(p.id) >= 0) return 'schon in dieser Schicht';
      if (abwesend[p.id] && abwesend[p.id][d]) return abwesend[p.id][d] === 'krank' ? 'krank' : 'Urlaub';
      if (s.tage[d]) return 'schon eingeteilt';
      if (!passtZeit(s.verf[wt], sch)) return s.verf[wt].art === 'nie' ? 'kann ' + TAGE[wt - 1] + ' nicht' : 'Uhrzeit passt nicht';
      if (p.sperre && sperreTrifft(p.sperre, wt)) return 'feste Sperrzeit';
      var std = dauerStd(sch.von, sch.bis);
      /* Jugendarbeitsschutz: 6–20 Uhr, höchstens 8 Stunden am Tag.
         Ausnahmen für bestimmte Branchen gibt es — dafür ist eine Frage
         an die Chefin offen; bis dahin gilt die strenge Grenze. */
      if (p.u18 && (minuten(sch.bis) > 20 * 60 || minuten(sch.von) < 6 * 60 || std > 8)) return 'unter 18';
      /* 11 Stunden Ruhe nach dem Ende des Vortags (ArbZG § 5) */
      var vortag = s.ende[plusTage(d, -1)];
      if (vortag != null && (minuten(sch.von) + 1440 - minuten(vortag)) < 11 * 60) return 'Ruhezeit';
      if (std > 10) return 'über 10 Stunden';
      if (istMinijob(p) && p.maxMonatStd && s.std + std > p.maxMonatStd + 0.01) return 'Monatsgrenze erreicht';
      if (!p.allein && !begleitet(p, pl)) return 'darf nicht allein sein';
      if (pl.schicht.braucht && !pl.besetzt.some(function (id) { return kann(stand[id].p, pl.schicht.braucht); })
          && !kann(p, pl.schicht.braucht) && pl.besetzt.length + 1 >= pl.min) return 'braucht ' + pl.schicht.braucht;
      if (!weich && weicheGruende(p, pl).length) return 'weich';
      return null;
    }
    function weicheGruende(p, pl) {
      var s = stand[p.id], g = [], w = wuensche[p.id];
      if (w && (w.frei || []).indexOf(pl.datum) >= 0) g.push('wollte frei');
      if (p.maxTageWoche && (s.woche[isoWoche(pl.datum)] || 0) >= p.maxTageWoche) g.push('schon ' + p.maxTageWoche + ' Tage diese Woche');
      if (!istMinijob(p) && p.wocheStd && s.std + dauerStd(pl.schicht.von, pl.schicht.bis) > s.soll * 1.15 + 0.01) g.push('über dem Soll');
      return g;
    }
    function sperreTrifft(text, wt) {
      var t = String(text).toLowerCase();
      return t.indexOf(TAGE[wt - 1].toLowerCase()) >= 0 && /schule|uni|sperre|nie|kurs/.test(t);
    }
    function kann(p, was) {
      return (p.kann || []).some(function (k) { return k.toLowerCase().indexOf(String(was).toLowerCase()) >= 0; });
    }
    /* „Darf nicht allein sein": wer schon im selben Studio zur selben
       Zeit steht und allein sein darf, begleitet. Bei einer Schicht mit
       Mindestbesetzung 1 kommt so nur infrage, wer allein darf — es sei
       denn, eine andere Schicht überlappt. */
    function begleitet(p, pl) {
      var a = minuten(pl.schicht.von), b = minuten(pl.schicht.bis);
      return einsaetze.some(function (x) {
        if (x.datum !== pl.datum || x.studio !== pl.studio.key) return false;
        if (!stand[x.id].p.allein) return false;
        return minuten(x.von) <= a && minuten(x.bis) >= b;
      });
    }

    /* Bewertung: höher = besser. Die Gewichte stehen hier offen, damit
       man sie nach den Antworten der Chefin nachziehen kann. */
    function bewerten(p, pl) {
      var s = stand[p.id], w = 0, std = dauerStd(pl.schicht.von, pl.schicht.bis);
      if (p.haupt === pl.studio.key) w += 30;                 // Hauptstudio vor Springer
      var fehlt = s.soll - s.std;                              // wer unter Soll ist, zuerst
      w += Math.max(-20, Math.min(40, fehlt / Math.max(std, 1) * 4));
      var lieber = (wuensche[p.id] && wuensche[p.id].lieber) || p.lieber || '';
      var frueh = istFrueh(pl.schicht);
      if (/fr/i.test(lieber)) w += frueh ? 12 : -12;
      if (/sp/i.test(lieber)) w += frueh ? -12 : 12;
      if (wochenende(pl.datum)) w -= s.wochenenden * 6;        // Wochenenden reihum
      if (pl.schicht.braucht && kann(p, pl.schicht.braucht)) w += 25;
      return w;
    }

    function eintragen(pl, k, rueck) {
      var p = k.p, s = stand[p.id], sch = pl.schicht, std = dauerStd(sch.von, sch.bis);
      var gruende = [];
      if (p.haupt === pl.studio.key) gruende.push('Hauptstudio'); else gruende.push('Springer');
      var lieber = (wuensche[p.id] && wuensche[p.id].lieber) || p.lieber || '';
      if (lieber && /fr/i.test(lieber) === istFrueh(sch) && !/egal/i.test(lieber)) gruende.push('wollte ' + (istFrueh(sch) ? 'früh' : 'spät'));
      if (pl.schicht.braucht && kann(p, pl.schicht.braucht)) gruende.push('kann ' + pl.schicht.braucht);
      var e2 = {
        id: p.id, name: p.name, datum: pl.datum, studio: pl.studio.key, studioName: pl.studio.name,
        schicht: sch.id, schichtName: sch.name, von: sch.von, bis: sch.bis,
        grund: gruende.join(' · ') + ' · ' + Math.round(s.std) + ' → ' + Math.round(s.std + std) + ' von ' + Math.round(s.soll) + ' Std.'
      };
      if (rueck) {
        e2.rueckfrage = k.weich.join(', ');
        s.rueckfragen++;
      }
      einsaetze.push(e2);
      pl.besetzt.push(p.id);
      s.std += std; s.tage[pl.datum] = true; s.ende[pl.datum] = sch.bis;
      var wo = isoWoche(pl.datum); s.woche[wo] = (s.woche[wo] || 0) + 1;
      if (wochenende(pl.datum)) s.wochenenden++;
      if (istFrueh(sch)) s.frueh++; else s.spaet++;
    }

    /* Eine Lücke erklärt sich selbst: woran es lag, gezählt — und wen
       man fragen könnte (die, die nur an „weichen" Dingen scheitern
       oder „nach Absprache" eingetragen haben). */
    function luecke(pl) {
      var zaehl = {}, fragen = [];
      personen.forEach(function (p) {
        var studiosP = [p.haupt].concat(p.studios || []);
        if (studiosP.indexOf(pl.studio.key) < 0) return;
        if (pl.besetzt.indexOf(p.id) >= 0) return;
        var g = ausschluss(p, pl, true);
        if (!g) return;
        zaehl[g] = (zaehl[g] || 0) + 1;
        /* Fragen lohnt sich nur, wo eine Absprache etwas ändert: „nach
           Absprache", ein Tausch mit der eigenen Schicht, eine
           Begleitung. Urlaub, krank und „nie" stehen nicht zur Wahl. */
        var v = stand[p.id].verf[wochentag(pl.datum)];
        if (v.art === 'absprache') fragen.push({ name: p.name, warum: 'nach Absprache' });
        else if (g === 'schon eingeteilt') fragen.push({ name: p.name, warum: 'tauschen' });
        else if (g === 'darf nicht allein sein') fragen.push({ name: p.name, warum: 'mit Begleitung' });
      });
      var teile = Object.keys(zaehl).sort(function (a, b) { return zaehl[b] - zaehl[a]; })
        .map(function (k) { return zaehl[k] + '× ' + k; });
      return {
        datum: pl.datum, studio: pl.studio.key, studioName: pl.studio.name, schicht: pl.schicht.id,
        schichtName: pl.schicht.name, von: pl.schicht.von, bis: pl.schicht.bis,
        fehlt: pl.min - pl.besetzt.length,
        grund: teile.length ? teile.join(', ') : 'niemandem ist dieses Studio zugeordnet',
        fragen: fragen.sort(function (a, b) { return (a.warum === 'tauschen') - (b.warum === 'tauschen'); }).slice(0, 4)
      };
    }

    var uebersicht = personen.map(function (p) {
      var s = stand[p.id];
      return { id: p.id, name: p.name, rolle: p.rolle || '', std: Math.round(s.std * 10) / 10,
               soll: Math.round(s.soll), tage: Object.keys(s.tage).length, wochenenden: s.wochenenden,
               frueh: s.frueh, spaet: s.spaet, rueckfragen: s.rueckfragen };
    });
    personen.forEach(function (p) {
      var s = stand[p.id];
      if (s.soll && s.std < s.soll * 0.85) hinweise.push(p.name + ': ' + Math.round(s.std) + ' von ' + Math.round(s.soll) + ' Std. — es gibt nicht genug passende Schichten');
      for (var t = 1; t <= 7; t++) if (s.verf[t].unklar) { hinweise.push(p.name + ': Verfügbarkeit am ' + TAGE[t - 1] + ' nicht verstanden („' + p.verf[t] + '“) — als ganztags gerechnet'); }
    });

    return {
      monat: e.monat, einsaetze: einsaetze, luecken: luecken, hinweise: hinweise, personen: uebersicht,
      feiertage: Object.keys(feiertage).filter(function (d) { return d.slice(0, 7) === e.monat; })
        .map(function (d) { return { datum: d, name: feiertage[d] }; })
    };
  }

  /* ── Wer käme für diesen Platz noch infrage? ──
     Für das Umbesetzen von Hand: dieselben Regeln wie oben, aber auf
     einen fertigen Plan angewandt. Jede Person mit Grund, damit die
     Chefin sieht, warum jemand ausgegraut ist. */
  function alternativen(e, plan, platz) {
    var andere = plan.einsaetze.filter(function (x) {
      return !(x.datum === platz.datum && x.studio === platz.studio && x.schicht === platz.schicht && x.id === platz.ohne);
    });
    var st = (e.studios || []).filter(function (s) { return s.key === platz.studio; })[0];
    var sch = st && st.schichten.filter(function (s) { return s.id === platz.schicht; })[0];
    if (!st || !sch) return [];
    var wt = wochentag(platz.datum), abw = {};
    (e.abwesend || []).forEach(function (a) { if (a.von <= platz.datum && a.bis >= platz.datum) abw[a.id] = a.art || 'Urlaub'; });
    return (e.personen || []).filter(function (p) {
      return [p.haupt].concat(p.studios || []).indexOf(platz.studio) >= 0;
    }).map(function (p) {
      var g = null, v = verfuegbarkeit((p.verf || {})[wt]);
      if (abw[p.id]) g = abw[p.id] === 'krank' ? 'krank' : 'Urlaub';
      else if (andere.some(function (x) { return x.id === p.id && x.datum === platz.datum; })) g = 'an diesem Tag schon eingeteilt';
      else if (!passtZeit(v, sch)) g = v.art === 'nie' ? 'kann ' + TAGE[wt - 1] + ' nicht' : (v.art === 'absprache' ? 'nur nach Absprache' : 'Uhrzeit passt nicht');
      else if (p.u18 && (minuten(sch.bis) > 20 * 60 || dauerStd(sch.von, sch.bis) > 8)) g = 'unter 18';
      var w = (e.wuensche || {})[p.id];
      var weich = w && (w.frei || []).indexOf(platz.datum) >= 0 ? 'wollte frei' : '';
      return { id: p.id, name: p.name, grund: g, weich: weich };
    }).sort(function (a, b) {
      return (!!a.grund - !!b.grund) || (!!a.weich - !!b.weich) || a.name.localeCompare(b.name, 'de');
    });
  }

  /* ── Für LogX: eine Tabelle zum Einfügen ──
     Tabulatoren zwischen den Spalten: so landet ein Einfügen in Excel
     oder einer Web-Tabelle in getrennten Zellen. Welche Spalten LogX
     wirklich braucht, ist noch offen (Frage 19/20) — bis dahin die
     naheliegende Reihenfolge. */
  function alsTabelle(plan, studioKey) {
    var zeilen = [['Datum', 'Tag', 'Studio', 'Schicht', 'Beginn', 'Ende', 'Mitarbeiter'].join('\t')];
    plan.einsaetze.filter(function (x) { return !studioKey || x.studio === studioKey; })
      .slice().sort(function (a, b) {
        return a.datum.localeCompare(b.datum) || a.studioName.localeCompare(b.studioName, 'de') || a.von.localeCompare(b.von);
      }).forEach(function (x) {
        var d = x.datum.split('-');
        zeilen.push([d[2] + '.' + d[1] + '.' + d[0], TAGE[wochentag(x.datum) - 1], x.studioName, x.schichtName, x.von, x.bis, x.name].join('\t'));
      });
    return zeilen.join('\n');
  }

  /* ══ Die Excel-Vorlage einlesen ═════════════════════════════════════
     Eine .xlsx ist ein ZIP mit XML darin. Statt einer Bibliothek (die
     App lädt bewusst nichts von Dritten nach, siehe ARCHITEKTUR.md §10)
     reichen hier knapp 80 Zeilen: das Inhaltsverzeichnis am Ende des
     ZIP lesen, die Blätter mit DecompressionStream entpacken (gibt es
     in jedem aktuellen Browser und in Node), die Zellen herausziehen.
     Gelesen wird nur, was die eigene Vorlage enthält — Formeln,
     Formate und Bilder interessieren hier nicht. */
  function entpacken(bytes, methode) {
    if (methode === 0) return Promise.resolve(bytes);
    var ds = new DecompressionStream('deflate-raw');
    var antwort = new Response(new Blob([bytes]).stream().pipeThrough(ds));
    return antwort.arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  function zipLesen(buf) {
    var b = new Uint8Array(buf), dv = new DataView(buf), ende = -1;
    for (var i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { ende = i; break; }
    }
    if (ende < 0) return Promise.reject(new Error('Das ist keine Excel-Datei (.xlsx).'));
    var anzahl = dv.getUint16(ende + 10, true), pos = dv.getUint32(ende + 16, true), dateien = {}, jobs = [];
    var dec = new TextDecoder('utf-8');
    for (var n = 0; n < anzahl; n++) {
      if (dv.getUint32(pos, true) !== 0x02014b50) break;
      var methode = dv.getUint16(pos + 10, true), groesse = dv.getUint32(pos + 20, true),
          nl = dv.getUint16(pos + 28, true), xl = dv.getUint16(pos + 30, true), kl = dv.getUint16(pos + 32, true),
          lokal = dv.getUint32(pos + 42, true), name = dec.decode(b.subarray(pos + 46, pos + 46 + nl));
      var start = lokal + 30 + dv.getUint16(lokal + 26, true) + dv.getUint16(lokal + 28, true);
      if (/^xl\/(worksheets\/sheet\d+|workbook|sharedStrings)\.xml$|^xl\/_rels\/workbook\.xml\.rels$/.test(name)) {
        (function (name, roh, methode) {
          jobs.push(entpacken(roh, methode).then(function (u) { dateien[name] = dec.decode(u); }));
        })(name, b.subarray(start, start + groesse), methode);
      }
      pos += 46 + nl + xl + kl;
    }
    return Promise.all(jobs).then(function () { return dateien; });
  }
  function xmlTexte(xml, tag) {
    var r = [], re = new RegExp('<' + tag + '[\\s>][\\s\\S]*?</' + tag + '>|<' + tag + '/>', 'g'), m;
    while ((m = re.exec(xml))) r.push(m[0]);
    return r;
  }
  function entities(s) {
    return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(+n); }).replace(/&amp;/g, '&');
  }
  function spalteNr(ref) {
    var s = /^[A-Z]+/.exec(ref)[0], n = 0;
    for (var i = 0; i < s.length; i++) n = n * 26 + s.charCodeAt(i) - 64;
    return n - 1;
  }
  /* Zeit aus Excel: eine Zahl wie 0,2916 heisst 07:00. */
  function zellwert(c, geteilt) {
    var typ = (/\st="([^"]+)"/.exec(c) || [])[1], v = (/<v>([\s\S]*?)<\/v>/.exec(c) || [])[1];
    if (typ === 's') return geteilt[+v] || '';
    if (typ === 'inlineStr') return entities((xmlTexte(c, 't').map(function (t) { return t.replace(/<[^>]+>/g, ''); })).join(''));
    if (v == null) return '';
    v = entities(v);
    if (typ !== 'str' && typ !== 'b' && /^0?\.\d+$/.test(v)) {
      var m = Math.round(parseFloat(v) * 1440);
      return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2);
    }
    return v;
  }
  function excelLesen(buf) {
    return zipLesen(buf).then(function (f) {
      var geteilt = xmlTexte(f['xl/sharedStrings.xml'] || '', 'si').map(function (si) {
        return entities(xmlTexte(si, 't').map(function (t) { return t.replace(/<[^>]+>/g, ''); }).join(''));
      });
      var rels = {};
      xmlTexte(f['xl/_rels/workbook.xml.rels'] || '', 'Relationship').concat(
        (f['xl/_rels/workbook.xml.rels'] || '').match(/<Relationship [^>]*\/>/g) || []).forEach(function (r) {
        var id = (/Id="([^"]+)"/.exec(r) || [])[1], ziel = (/Target="([^"]+)"/.exec(r) || [])[1];
        if (id && ziel) rels[id] = 'xl/' + ziel.replace(/^\/?xl\//, '');
      });
      var blaetter = {};
      ((f['xl/workbook.xml'] || '').match(/<sheet [^>]*\/>/g) || []).forEach(function (s) {
        var name = entities((/name="([^"]+)"/.exec(s) || [])[1] || ''), rid = (/r:id="([^"]+)"/.exec(s) || [])[1];
        var xml = f[rels[rid]];
        if (!xml) return;
        var zeilen = [];
        xmlTexte(xml, 'row').forEach(function (row) {
          var z = [];
          (row.match(/<c [^>]*\/>|<c [^>]*>[\s\S]*?<\/c>/g) || []).forEach(function (c) {
            var ref = (/r="([A-Z]+)\d+"/.exec(c) || [])[1];
            if (ref) z[spalteNr(ref)] = zellwert(c, geteilt);
          });
          for (var i = 0; i < z.length; i++) if (z[i] == null) z[i] = '';
          zeilen.push(z);
        });
        blaetter[name] = zeilen;
      });
      return blaetter;
    });
  }

  /* ── Aus den Blättern der Vorlage werden Angaben ──
     Die Spalten werden über die KOPFZEILE gefunden, nicht über ihre
     Stelle: fügt die Chefin eine Spalte ein, liest der Planer trotzdem
     richtig. `studioKey` übersetzt einen Studionamen in die Kennung
     der App. Beispielzeilen („Beispiel: …") werden übersprungen. */
  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function spalten(kopf, muster) {
    var r = {};
    Object.keys(muster).forEach(function (k) {
      for (var i = 0; i < kopf.length; i++) if (muster[k].test(norm(kopf[i]))) { r[k] = i; return; }
    });
    return r;
  }
  function zahl(v) { var n = parseFloat(String(v || '').replace(',', '.')); return isNaN(n) ? 0 : n; }
  function jaNein(v, vorgabe) { var s = norm(v); if (!s) return vorgabe; return /^(ja|j|x|yes|1|true)/.test(s); }
  function liste(v) { return String(v || '').split(/[,;\/\n]+/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function tageAusText(t) {
    var s = norm(t), r = [];
    if (!s || s === 'alle' || s === 'täglich' || s === 'mo–so' || s === 'mo-so') return [1, 2, 3, 4, 5, 6, 7];
    var k = TAGE.map(function (x) { return x.toLowerCase(); });
    s.split(/[,;]+/).forEach(function (teil) {
      var m = /(mo|di|mi|do|fr|sa|so)\w*\s*(?:-|–|bis)\s*(mo|di|mi|do|fr|sa|so)/.exec(teil);
      if (m) { for (var i = k.indexOf(m[1]); i <= k.indexOf(m[2]); i++) r.push(i + 1); return; }
      (teil.match(/mo|di|mi|do|fr|sa|so/g) || []).forEach(function (x) { r.push(k.indexOf(x) + 1); });
    });
    return r.length ? r : [1, 2, 3, 4, 5, 6, 7];
  }
  function ausVorlage(blaetter, studioKey) {
    var fehler = [], personen = [], schichten = {}, studios = {};
    var ma = blaetter['Mitarbeiter'];
    if (!ma || !ma.length) fehler.push('Blatt „Mitarbeiter“ fehlt.');
    else {
      var s = spalten(ma[0], {
        name: /^name/, rolle: /^rolle/, haupt: /^hauptstudio/, weitere: /^weitere/, woche: /pro ?woche \(soll\)|stunden pro woche/,
        monat: /std\. pro monat|pro monat/, tageW: /tage pro woche/, allein: /allein/, u18: /unter 18/, kann: /^kann/,
        sperre: /sperr/, lieber: /^lieber/, notiz: /^bemerkung/
      });
      var tagSp = {};
      TAGE.forEach(function (t, i) { for (var c = 0; c < ma[0].length; c++) if (norm(ma[0][c]) === t.toLowerCase()) tagSp[i + 1] = c; });
      ma.slice(1).forEach(function (z, i) {
        var name = String(z[s.name] || '').trim();
        if (!name || /^beispiel/i.test(name)) return;
        var haupt = studioKey(z[s.haupt]);
        if (!haupt) fehler.push('Zeile ' + (i + 2) + ' (' + name + '): Hauptstudio „' + (z[s.haupt] || '') + '“ unbekannt.');
        var verf = {};
        Object.keys(tagSp).forEach(function (t) { verf[t] = String(z[tagSp[t]] || ''); });
        personen.push({
          name: name, rolle: String(z[s.rolle] || ''), haupt: haupt || '',
          studios: liste(z[s.weitere]).map(studioKey).filter(Boolean),
          wocheStd: zahl(z[s.woche]), maxMonatStd: zahl(z[s.monat]), maxTageWoche: zahl(z[s.tageW]),
          allein: jaNein(z[s.allein], true), u18: jaNein(z[s.u18], false), kann: liste(z[s.kann]),
          verf: verf, sperre: String(z[s.sperre] || ''), lieber: String(z[s.lieber] || ''), notiz: String(z[s.notiz] || '')
        });
      });
    }
    var sc = blaetter['Schichten'];
    if (sc && sc.length) {
      var k = spalten(sc[0], { studio: /^studio/, name: /^name/, von: /^beginn/, bis: /^ende/, tage: /tagen/, min: /mindestens/, braucht: /braucht/, notiz: /bemerkung/ });
      sc.slice(1).forEach(function (z, i) {
        var von = String(z[k.von] || '').trim(), bis = String(z[k.bis] || '').trim(), sn = String(z[k.name] || '').trim();
        if (!von || !bis || !sn) return;
        if (/beispiel/i.test(String(z[k.notiz] || ''))) return;
        var ziel = norm(z[k.studio]) === 'alle' || !norm(z[k.studio]) ? 'alle' : studioKey(z[k.studio]);
        if (!ziel) { fehler.push('Schichten, Zeile ' + (i + 2) + ': Studio „' + z[k.studio] + '“ unbekannt.'); return; }
        (schichten[ziel] = schichten[ziel] || []).push({
          id: (ziel + '-' + sn).toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-'), name: sn,
          von: zeit(von), bis: zeit(bis), tage: tageAusText(z[k.tage]), min: Math.max(1, zahl(z[k.min]) || 1),
          braucht: String(z[k.braucht] || '').trim()
        });
      });
    }
    var so = blaetter['Studios'];
    if (so && so.length) {
      var q = spalten(so[0], { studio: /^studio/, min: /mindestens/, stoss: /stoß|stoss/, notiz: /bemerkung/ });
      so.slice(1).forEach(function (z) {
        var key = studioKey(z[q.studio]);
        if (!key) return;
        var oeff = {};
        TAGE.forEach(function (t, i) {
          for (var c = 0; c < so[0].length; c++) if (norm(so[0][c]).indexOf(t.toLowerCase()) === 0) { oeff[i + 1] = String(z[c] || ''); break; }
        });
        studios[key] = { min: zahl(z[q.min]) || 1, oeffnung: oeff, stoss: String(z[q.stoss] || ''), notiz: String(z[q.notiz] || '') };
      });
    }
    return { personen: personen, schichten: schichten, studios: studios, fehler: fehler };
  }
  function zeit(v) {
    var m = /(\d{1,2})[:.]?(\d{2})?/.exec(String(v));
    return m ? ('0' + m[1]).slice(-2) + ':' + (m[2] || '00') : String(v);
  }

  var SP = {
    planen: planen, alternativen: alternativen, alsTabelle: alsTabelle,
    excelLesen: excelLesen, ausVorlage: ausVorlage,
    tageImMonat: tageImMonat, wochentag: wochentag, feiertageNRW: feiertageNRW,
    verfuegbarkeit: verfuegbarkeit, isoWoche: isoWoche, dauerStd: dauerStd, TAGE: TAGE
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = SP;
  else wurzel.SCHICHTPLANER = SP;
})(typeof window !== 'undefined' ? window : this);
