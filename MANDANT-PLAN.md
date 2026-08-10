# Vier Ebenen und mehrere Firmen — der Plan

Stand 10. August 2026. **Hier wird nichts gebaut.** Das ist die
Beschreibung dessen, was gebaut werden müsste, was es kostet, was dabei
schiefgehen kann und in welcher Reihenfolge es am wenigsten weh tut.

Entschieden ist bereits:

| Frage | Entscheidung |
|---|---|
| Reihenfolge | erst planen, dann entscheiden |
| Umzug der bestehenden Daten | **Probelauf in einem Testprojekt, dann live** |
| Einsicht des Admins in Kundenfirmen | **nur Verwaltung, keine Inhalte** |

---

## Inhalt

1. [Das Ziel](#1-das-ziel)
2. [Was heute im Weg steht](#2-was-heute-im-weg-steht)
3. [Wie die Daten liegen müssten](#3-wie-die-daten-liegen-müssten)
4. [Die gefährlichste Stelle: studioKey](#4-die-gefährlichste-stelle-studiokey)
5. [Die Sicherheitsregeln](#5-die-sicherheitsregeln)
6. [Der Umzug](#6-der-umzug)
7. [Die Admin-Oberfläche](#7-die-admin-oberfläche)
8. [Was das kostet](#8-was-das-kostet)
9. [Reihenfolge und Aufwand](#9-reihenfolge-und-aufwand)
10. [Was schiefgehen kann](#10-was-schiefgehen-kann)
11. [Was ich dabei nicht leisten kann](#11-was-ich-dabei-nicht-leisten-kann)

---

## 1. Das Ziel

| Ebene | sieht | darf |
|---|---|---|
| **Mitarbeiter** | sein Studio | abhaken, schreiben, melden |
| **Studio-Leiter** | seine Studios | Team und Abläufe dort verwalten |
| **Chef** | alle Studios **seiner Firma** | alles in seiner Firma — **und benennt seine Studios selbst** |
| **Admin** (du) | **alle Firmen**, aber nur die Verwaltung | Firmen anlegen, Chef-Zugänge anlegen, Firmen sperren |

Der Verkaufsablauf danach:

1. Du legst im Admin-Bereich „Studio Müller" an und trägst eine E-Mail ein.
2. Müllers Chef bekommt seinen Zugang und meldet sich an.
3. **Müller legt seine Studios selbst an.** Du musst nichts deployen.
4. Müller lädt sein Team ein, über Firmencode oder Freigabe.

Du siehst danach: Firmenname, wie viele Studios, wie viele Konten, wann
zuletzt benutzt. **Du siehst nicht:** deren Chat, Aufgaben, Personaldaten,
Dokumente.

---

## 2. Was heute im Weg steht

### 2.1 Die Studios stehen im Code

```js
// konfig.js
studios: ['Longerich', 'Nippes', 'Ebertplatz', … ]
```

Ein neues Studio heißt heute: Datei ändern, committen, deployen. Beim
eigenen Betrieb geht das. Bei einem Kunden ist es untragbar — er ruft dich
an, weil er ein Studio eröffnet hat.

### 2.2 Ein Chef kann keine Chef-Konten anlegen

Die Verwaltung zeigt Chef-Zugänge nur **an** und kann Rechte **entziehen**.
Angelegt wurden Chefs bisher über die Selbstregistrierung mit der Rollen-
Auswahl im Anmeldeformular.

Seit dem Beitritts-Umbau verlangen die Regeln dort aber:

```
allow create: if isChef()
  || (request.auth.uid == uid
      && (!('role' in request.resource.data)
          || request.resource.data.role == 'mitarbeiter')
      && …)
```

Ein Konto, das sich selbst als Chef anlegen will, wird abgewiesen. **Die
Rollen-Auswahl „Chef" im Anmeldeformular führt heute ins Leere.** Bei einem
Ein-Firmen-Betrieb fällt das nicht auf. Für den Admin ist es genau der Weg,
der gebraucht wird — er muss also ohnehin neu gebaut werden, und zwar über
eine Cloud Function, nicht über das Formular.

### 2.3 Alle Daten liegen flach

```
users/{uid}
channels/{kanal}/messages/{id}
studios/{sk}/todos | cleaning | devices | shifts | absences | …
inventory/{sk} · documents · announcements · certificates · archives
board · trash · dms · config
```

Nirgends steht, zu welcher Firma etwas gehört. Es gibt ja nur eine.

---

## 3. Wie die Daten liegen müssten

Es gibt zwei Wege, und sie unterscheiden sich nicht im Geschmack, sondern
in der Frage, wie ein Fehler aussieht.

| | Feld `firma` an jedem Dokument | Alles unter `firmen/{f}/…` |
|---|---|---|
| Änderung am Code | jede Abfrage bekommt ein `.where('firma','==',…)` | jeder Pfad bekommt ein Präfix |
| Ein vergessenes Stück | eine Abfrage ohne Filter **liefert fremde Daten** | ein Pfad ohne Präfix **findet gar nichts** |
| Fehler fällt auf | erst, wenn ein Kunde sich beschwert | sofort beim ersten Test |

**Vorschlag: verschachtelte Pfade.** Nicht weil sie eleganter sind, sondern
weil ein Fehler dort *leer* aussieht statt *fremd*. Ein leerer Bildschirm
ist ein Fehler, den man findet. Ein Bildschirm mit den Daten eines anderen
Betriebs ist ein Fehler, den man nicht findet.

### Nachher

```
firmen/{f}                                  Stammdaten der Firma
firmen/{f}/config/studios                   die Studioliste
firmen/{f}/config/{doc}                     alles bisherige aus config/
firmen/{f}/channels/{kanal}/messages/{id}
firmen/{f}/studios/{sk}/todos | cleaning | cleaningNotes |
                            devices | deviceLog | shifts |
                            absences | handovers
firmen/{f}/inventory/{sk}
firmen/{f}/documents/{id} · documentData/{id}
firmen/{f}/announcements · certificates · archives · board · trash
firmen/{f}/dms/{id}/messages

users/{uid}                                 bleibt OBEN
beitritt/{uid}                              bleibt OBEN
```

### ⚠ Die Lücke, die beim Bauen aufgefallen ist

**Vor dem Anmelden weiß die App nicht, zu welcher Firma sie gehört.**

Das klingt banal, ist aber der Punkt, an dem der Entwurf oben nicht
aufgeht. Drei Dinge braucht der Anmeldebildschirm, **bevor** jemand
eingeloggt ist:

| | wofür |
|---|---|
| `config/studios` | die Studios zum Ankreuzen bei der Selbstanmeldung |
| `config/beitrittSchalter` | ob überhaupt ein Reiter „Konto anlegen" erscheint |
| Firmenname und Farbe | damit Müller nicht „Körperformen" auf dem Anmeldebildschirm liest |

Alle drei liegen künftig unter `firmen/{f}/…` — und `{f}` ist genau das,
was noch niemand weiß.

**Das ist keine Kleinigkeit.** Es ist die Frage, wie ein Kunde seine
eigene App überhaupt erreicht. Drei Wege, und sie unterscheiden sich
nicht nur technisch:

| Weg | wie es aussieht | Aufwand | Haken |
|---|---|---|---|
| **Eigene Adresse je Kunde** | `mueller.studiochat.de` | Domain + Wildcard-Zertifikat | wirkt am professionellsten, kostet eine Domain |
| **Kennung im Link** | `studiochat.de/?firma=mueller` | fast keiner | sieht nach Bastellösung aus, und wer die Kennung wegnimmt, sieht nichts |
| **Firma wählen** | eine Liste auf dem Anmeldebildschirm | klein | **verrät jedem Besucher, wer deine Kunden sind** |

Der dritte Weg fällt für mich aus: eure Kundenliste gehört nicht auf
einen öffentlichen Anmeldebildschirm.

> **Entschieden am 11. August 2026: die Kennung steht im Link.**
> `https://…/?firma=mueller-7f3a`. Sie wird beim ersten Öffnen gemerkt,
> der Kunde braucht den langen Link also nur einmal. Der Wechsel auf
> eigene Adressen bleibt später möglich, ohne dass sich an den Daten
> etwas ändert.
>
> **Die Kennung ist keine Sicherung.** Jeder kann jede eintippen. Was ein
> Fremder damit sieht, ist genau das, was ohnehin ohne Anmeldung lesbar
> ist: Studionamen und zwei Ja/Nein-Schalter. An Daten kommt er nicht —
> das entscheiden die Regeln, und die fragen das Profil, nicht den Link.
>
> Damit man Kunden aber nicht durch Raten findet, bekommen Kennungen beim
> Anlegen eine **Zufallsendung**: `mueller-7f3a` statt `mueller`. Die
> Kundenliste gehört niemandem außer dir.
>
> Zwei Regeln, die daraus folgen und beide gebaut sind:
> **Prüfen statt zurechtstutzen** — aus `../../users/chef1` würde beim
> Wegfiltern `userschef1`, eine Kennung, die niemandem gehört und dann
> auch noch gemerkt wird. Unbrauchbares wird verworfen, nicht repariert.
> **Das Profil gewinnt gegen den Link** — wer über einen fremden oder
> veralteten Link kam, arbeitet trotzdem in seiner eigenen Firma.

### Warum `users` oben bleibt

Beim Anmelden weiß die App noch nicht, zu welcher Firma jemand gehört —
sie muss es ja erst nachschlagen. Läge das Profil unter
`firmen/{f}/users/{uid}`, müsste man die Firma kennen, um die Firma
herauszufinden.

Also bleibt `users/{uid}` oben und bekommt ein Feld `firma`. Das ist die
**einzige** Sammlung, die firmenübergreifend liegt, und deshalb die
einzige, die einzeln abgesichert werden muss.

### Das Firmen-Dokument

```js
firmen/koerperformen = {
  name: 'Körperformen',
  aktiv: true,
  angelegtAm: 1786000000000,
  farbe: '#38BDF8',
  // Vom Admin gelesen, von einer Cloud Function geschrieben.
  // Der Admin darf users NICHT lesen – deshalb kommen die Zahlen
  // aus dem Hintergrund und nicht aus einer eigenen Abfrage.
  zahlKonten: 57,
  zahlStudios: 14,
  letzteNutzung: 1786367000000
}
```

Das ist die Umsetzung von „nur Verwaltung, keine Inhalte": der Admin
bekommt Zahlen, die eine Function für ihn zusammenzählt, und liest dafür
selbst kein einziges Personen- oder Inhaltsdokument.

---

## 4. Die gefährlichste Stelle: studioKey

```js
function studioKey(name){ return 'studio-' + STUDIOS.indexOf(name); }
```

Die Datenbank-Kennung eines Studios ist sein **Listenplatz**. `studio-6`
ist Hürth, weil Hürth an sechster Stelle steht. Diese Annahme steckt an
**34 Stellen** im Code und in den Sicherheitsregeln.

Sobald ein Chef Studios anlegen, umbenennen oder entfernen darf,
verschieben sich Plätze — und alle Aufgaben, Schichten, Putzpläne, Geräte
und Chats hängen am falschen Studio. **Lautlos.** Keine Fehlermeldung,
kein Absturz, nur falsche Daten.

### Der Ausweg: nur anhängen, nie umsortieren

```js
firmen/{f}/config/studios = {
  liste: [
    { id:'studio-0',  name:'Longerich', aktiv:true },
    { id:'studio-6',  name:'Hürth',     aktiv:true },
    { id:'studio-13', name:'Seelscheid', aktiv:false },   // stillgelegt
    { id:'studio-14', name:'Neu-Eröffnung', aktiv:true }  // angehängt
  ],
  naechste: 15        // zählt nur hoch, nie zurück
}
```

| Aktion | was passiert |
|---|---|
| Studio anlegen | bekommt `naechste`, danach `naechste + 1` |
| Studio umbenennen | nur `name` ändert sich, die Kennung bleibt |
| Studio schließen | `aktiv:false` — es verschwindet aus den Auswahllisten, die Daten bleiben lesbar |
| Studio löschen | **gibt es nicht.** Es gibt kein Löschen. |

Damit bleibt jede bestehende Kennung für immer gültig, und die 34 Stellen
im Code müssen nur noch die Kennung statt des Listenplatzes benutzen.

**Für Körperformen heißt das: gar keine Datenwanderung.** Die heutigen
`studio-0` bis `studio-13` entsprechen genau den vierzehn Namen in ihrer
heutigen Reihenfolge. Die Liste wird einmal so in die Datenbank
geschrieben, wie sie ist — und nichts an den Daten muss angefasst werden.

---

## 5. Die Sicherheitsregeln

### Die Falle, in die man hier tritt

Es wäre naheliegend, die Firmen-Grenze einmal ganz oben zu ziehen:

```
match /firmen/{f}/{rest=**} {
  allow read, write: if meineFirma() == f;      // FALSCH
}
```

Das funktioniert **nicht**, und zwar auf die gefährliche Art. In Firestore
gilt: **jede zutreffende Regel wird angewandt, und eine einzige, die
erlaubt, genügt.** Diese breite Regel würde alle feineren Regeln darunter
aushebeln — der Mitarbeiter dürfte plötzlich Dokumente löschen und Rollen
ändern, weil ja *irgendeine* Regel es erlaubt.

Die Firmen-Prüfung muss deshalb **in jede einzelne Regel** hinein:

```
function meinProfil(){
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
}
function meineFirma(){ return meinProfil().get('firma', ''); }
function inFirma(f){ return istAktiv() && meineFirma() == f; }
function istAdmin(){ return meinProfil().get('role','') == 'admin'; }

match /firmen/{f} {
  // Stammdaten: die Firma selbst und der Admin
  allow read:  if istAdmin() || inFirma(f);
  allow write: if istAdmin();

  match /studios/{sk}/todos/{id} {
    allow read:   if inFirma(f);
    allow create: if inFirma(f) && …;
    allow update: if inFirma(f) && …;
    allow delete: if inFirma(f) && (isChef() || …);
  }
  // … und so für jede Sammlung
}
```

Das ist mechanisch und langweilig — und genau deshalb muss ein Test es
prüfen und nicht mein Auge.

### `users` — die eine Sammlung, die oben liegt

```
match /users/{uid} {
  // Kollegen derselben Firma, das eigene Profil, sonst niemand.
  // Der Admin steht hier bewusst NICHT: er soll keine Personendaten
  // fremder Betriebe lesen. Seine Zahlen kommen aus firmen/{f}.
  allow read: if request.auth.uid == uid
              || (istAktiv() && resource.data.firma == meineFirma());

  // 'firma' gehört in dieselbe Sperrliste wie 'role' und 'studios':
  // wer sein eigenes Firmenfeld ändern könnte, wechselt damit in einen
  // fremden Betrieb.
  allow update: if istAdmin()
    || (isChef() && resource.data.firma == meineFirma())
    || (request.auth.uid == uid
        && !request.resource.data.diff(resource.data).affectedKeys()
             .hasAny(['role','studios','studio','studioKeys','aktiv','firma']));

  allow create: if istAdmin() || …;
}
```

### Die Tests, die es dafür braucht

> **Gebaut am 11. August 2026: 21 Kreuztests, 86 Regeltests insgesamt,
> alle grün.** Der verschachtelte Regelsatz wurde maschinell aus dem
> flachen erzeugt — 30 Blöcke, und jedes einzelne `allow` hat ein
> `inFirma(f)` davor. Geprüft wurde das nicht durch Lesen, sondern durch
> die Kreuztests.
>
> **Sie haben zwei echte Lücken gefunden, beide in `users`** — der einen
> Sammlung, die gemeinsam oben liegt und deshalb nicht vom Pfad geschützt
> wird:
>
> 1. Jeder konnte sich selbst ein anderes `firma` ins Profil schreiben
>    und damit in einen fremden Betrieb wechseln. `firma` steht jetzt in
>    derselben Sperrliste wie `role`.
> 2. Ein Chef durfte **jedes** Konto ändern und löschen, auch die einer
>    fremden Firma. Jetzt nur noch die der eigenen.
>
> Beides hätte ich beim Durchlesen nicht gefunden — die Regeln sahen
> richtig aus.

Zu den bestehenden 52 Regeltests kommen **Kreuztests**: für jede Sammlung
je einmal, dass ein Konto aus Firma A die Daten von Firma B

- nicht lesen
- nicht schreiben
- nicht löschen

kann. Das sind etwa zwanzig weitere Prüfungen, und sie sind der eigentliche
Beweis, dass die Trennung hält. **Ohne diese Tests darf die
Mandantenfähigkeit nicht live gehen** — mein Auge ist an dieser Stelle
nachweislich kein gutes Prüfgerät.

---

## 6. Der Umzug

Entschieden: **Probelauf zuerst.** Der Ablauf im Einzelnen.

### 6.1 Der wichtigste Grundsatz

**Der Umzug ist eine Kopie, kein Verschieben.** Die alten flachen Daten
bleiben liegen. Sie werden nur nicht mehr gelesen. Aufgeräumt wird
frühestens nach 30 Tagen ruhigem Betrieb.

Damit ist der Rückweg simpel: die vorherige Fassung der App wieder
ausrollen. Sie liest die alten Pfade, die noch da sind. Kein Rückspielen
einer Sicherung, kein Datenverlust, kein Zeitdruck.

### 6.2 Probelauf

| Schritt | was passiert |
|---|---|
| 1 | Zweites Firebase-Projekt `formenchat-probe` anlegen |
| 2 | Den nächtlichen Vollexport von `formenchat` dort einspielen |
| 3 | Migrations-Function laufen lassen: kopiert flach → `firmen/koerperformen/…` |
| 4 | **Zählprüfung:** jede Sammlung vorher und nachher gleich viele Dokumente |
| 5 | ~~Die automatischen Durchläufe gegen das Probe-Projekt~~ — **geht nicht.** Sie arbeiten mit Attrappen und fassen kein echtes Firebase an. Ersatz: die App mit `mandant:true` gegen das Probe-Projekt und von Hand durchsehen. |
| 6 | Von Hand durchsehen: Chatverlauf vollständig? Schichten am richtigen Studio? Archive lesbar? |
| 7 | Kreuztests: eine zweite Testfirma anlegen und prüfen, dass sie nichts sieht |

Erst wenn Schritt 4 bis 7 sauber sind, geht es weiter.

### 6.3 Live

| Schritt | was passiert |
|---|---|
| 1 | Zeitpunkt wählen, an dem niemand arbeitet |
| 2 | Sicherung von Hand auslösen und **bestätigen lassen**, dass sie durchlief |
| 3 | Migrations-Function auf `formenchat` laufen lassen |
| 4 | Zählprüfung wie im Probelauf |
| 5 | Neue App-Fassung ausrollen |
| 6 | Selbst anmelden und die sechs wichtigsten Ansichten durchsehen |
| 7 | Dem Team Bescheid geben |

### 6.4 Was der Umzug kostet

Rund 5.700 Dokumente lesen und schreiben. In Geld: unter zehn Cent. Die
Menge ist hier nicht das Problem — die Sorgfalt ist es.

---

## 7. Die Admin-Oberfläche

Eine neue Ansicht, sichtbar nur für `role == 'admin'`.

### Firmenliste

| Firma | Studios | Konten | zuletzt benutzt | |
|---|---|---|---|---|
| Körperformen | 14 | 57 | heute 09:14 | öffnen |
| Studio Müller | 3 | 11 | gestern | öffnen |

Alle vier Werte kommen aus `firmen/{f}` und werden von einer Cloud
Function gepflegt. **Kein Klick in dieser Ansicht liest ein Dokument aus
einer Kundenfirma.**

### Firma anlegen

Ein Formular: Firmenname, Akzentfarbe, E-Mail des ersten Chefs. Beim
Absenden läuft eine Cloud Function `firmaAnlegen`, die

1. prüft, dass der Aufrufer `role == 'admin'` hat,
2. das Dokument `firmen/{f}` anlegt,
3. ein Auth-Konto für den Chef erzeugt (das geht nur im Hintergrund, das
   Admin-SDK kann es, die App nicht),
4. `users/{uid}` mit `role:'chef'` und `firma:{f}` schreibt,
5. eine Einladungs-Mail mit Erstpasswort verschickt.

Damit ist auch der tote Weg aus Abschnitt 2.2 erledigt: Chef-Konten
entstehen künftig hier und nirgends sonst.

### Firma sperren

`aktiv:false` am Firmen-Dokument. Die Regeln lassen dann niemanden mehr
hinein — für den Fall, dass eine Rechnung offen bleibt. Die Daten bleiben
unangetastet.

### Was es bewusst nicht gibt

Keinen Knopf „als Chef ansehen". Kein Fenster in fremde Chats. Wenn ein
Kunde Hilfe braucht, schickt er einen Bildschirmfoto oder ihr schaut
gemeinsam drauf. Das ist unbequemer — und es ist der Satz, den du im
Verkaufsgespräch sagen kannst: *„Ich komme an Ihre Daten nicht heran."*

### Der erste Admin

Den kann niemand über die App anlegen — es gäbe ja noch keinen. Er wird
einmalig von Hand in der Firebase-Konsole gesetzt: ein Auth-Konto anlegen,
`users/{uid}` mit `role:'admin'` schreiben. Danach nie wieder.

---

## 8. Was das kostet

Gemessen (nicht geschätzt) an einem App-Start bei 14 Studios und einem
Jahr Daten: 380 Lesevorgänge beim Mitarbeiter, 1.110 beim Chef. Das ergibt
je Firma mit 57 Konten und sechs Starts am Tag rund **153.000
Lesevorgänge täglich**.

| Kunden | getrennte Projekte | ein gemeinsames Projekt | Unterschied |
|---|---|---|---|
| 1 | 1,70 € | 1,70 € | – |
| 3 | 5,10 € | 6,80 € | 1,70 € |
| 10 | 17,00 € | 24,50 € | 7,50 € |

Das kostenlose Kontingent gilt je Projekt und ist damit **0,83 € im Monat
je Kunde** wert.

> **Korrektur an `VERKAUF.md`.** Dort steht, „der dritte Kunde bringt dich
> in die Abrechnung", und das Freikontingent wird als Grund für getrennte
> Projekte geführt. Das habe ich geschrieben, **bevor Messwerte vorlagen**.
> Der Betrag ist Rauschen. Die Entscheidung für oder gegen
> Mandantenfähigkeit muss über Datentrennung und Aufwand fallen, nicht über
> Kosten. Der Abschnitt in `VERKAUF.md` gehört entsprechend berichtigt.

Was in dieser Rechnung **nicht** steckt: Speicherplatz, Cloud Functions,
Push, KI-Aufrufe, nächtliche Sicherung. Und: die Preise stammen aus der
Liste, nicht aus einer Live-Abfrage. Die verbindliche Zahl steht in der
Firebase-Konsole unter *Firestore → Nutzung*.

---

## 9. Reihenfolge und Aufwand

Aufwand in Sitzungen, nicht in Stunden — Stunden könnte ich nur raten.

### Stufe 1 — Studios in die Datenbank · ✅ **erledigt am 10. August 2026**

Die Studioliste wandert aus `konfig.js` nach
`firmen/…/config/studios`, nur anhängbar. Der Chef bekommt in der
Verwaltung: anlegen, umbenennen, stilllegen. `studioKey()` verschwindet,
die 34 Stellen benutzen die gespeicherte Kennung.

**Nützt sofort, auch ohne zweiten Kunden**, und ist Voraussetzung für alles
Weitere. Kein Umzug, keine Regeländerung an der Firmengrenze.

> **Gebaut.** `config/studios` mit `{liste, naechste}`, nur anhängbar.
> Oberfläche unter *Verwaltung → 🏢 Studios*. Fehlt das Dokument, gilt
> weiter `konfig.js` — für Körperformen gab es deshalb keine
> Datenwanderung.
>
> Beim Bauen ist die Falle aus Abschnitt 5 sofort zugeschnappt: die
> Wachstums-Sperre stand in einer eigenen Regel, aber `config/{doc}`
> erlaubte dem Chef weiterhin `write` — und in Firestore genügt eine
> zutreffende Regel, die erlaubt. Der Regeltest hat es gefunden, nicht
> mein Auge. Das ist der Beleg dafür, warum Abschnitt 5 keine Theorie
> ist.

> **Ebenfalls dabei entdeckt:** die Selbstregistrierung war nie
> erreichbar. `setAuthMode('register')` wurde nirgends aufgerufen, es gab
> keine Reiter. Der ganze Beitritts-Mechanismus aus Sitzung 18 war
> gebaut, geprüft — und für keinen Menschen zugänglich. Behoben: die
> Reiter erscheinen, sobald der Chef Firmencode oder Freigabe
> einschaltet.

### Stufe 2 — Firmen-Trennung · ~2–3 Sitzungen · **Live-Daten**

Pfade verschachteln, Regeln umbauen, rund zwanzig Kreuztests schreiben,
Migrations-Function bauen, Probelauf, Live-Umzug.

Das ist der Brocken. Hier steckt das ganze Risiko. Deshalb in vier
Teilschritten, von denen jeder einzeln lauffähig ist und für sich
ausgerollt werden kann:

| | Was | Risiko |
|---|---|---|
| **A** ✅ | Alle Zugriffe laufen über **eine** Funktion `S()`, die vorerst die heutigen Pfade zurückgibt | keins — Verhalten identisch |
| **B** ✅ | `firma` am Konto, Kennung im Link, Regeln, 21 Kreuztests | mittel, noch ohne Live-Daten |
| **C** | Umzugs-Function, Probelauf, Live-Umzug | **hoch** |
| **D** | Admin-Oberfläche | keins |

> **Stufe 2A erledigt am 11. August 2026.** 114 Aufrufe von
> `db.collection('…')` laufen jetzt durch `S(name)`. Heute gibt sie
> denselben Pfad zurück wie vorher; in Stufe B wird dort **eine** Zeile
> ergänzt und die Trennung gilt überall.
>
> Drei Sammlungen laufen bewusst **nicht** durch `S()`:
> `users` (beim Anmelden ist die Firma noch unbekannt — sie steht ja
> dort), `beitritt` (wird vor dem Profil geschrieben) und `pushTokens`
> (hängt am Gerät, nicht an der Firma).
>
> Der Wert dieses Schritts ist nicht, was er tut, sondern was er
> verhindert: in Stufe B gibt es keine 114 Gelegenheiten mehr, das
> Präfix zu vergessen. Es gibt genau eine.

> ### ✅ Stufe 2C am 10. August 2026 im Probe-Projekt gelaufen
>
> An **echten Daten**, aus der Nachtsicherung vom 10. August ins Projekt
> `formenchat-probe` importiert (146 Dokumente).
>
> ```
> ── UMZUG ──  Firma: koerperformen
>      149  GESAMT   (8 s)
> ── ZÄHLPRÜFUNG (frisch am Ziel gelesen) ──
>   ✓ Jede Sammlung hat am Ziel genauso viele Dokumente wie in der Quelle.
> ```
>
> **Alle 14 Studios sind mitgekommen**, obwohl ihre Elterndokumente nicht
> existieren — die Stelle, an der ein falsch gebauter Umzug lautlos die
> Hälfte verliert.
>
> **Kein Dienstschlüssel nötig.** Der Umzug lief in Google Cloud Shell
> unter dem Konto des Betreibers. Ein Schlüssel, den es nicht gibt, kann
> nicht verloren gehen — besser als der Weg, den ich ursprünglich
> vorgeschlagen hatte.
>
> **Zwei Zahlen zur Einordnung:** die echte Datenbank hat 146 Dokumente,
> nicht 5.675. Der Lasttest rechnete mit einem Jahr Betrieb, also einer
> Vorhersage. Heute liegt ihr weit unter den 1,55 €/Monat.
>
> **Und eine Ungenauigkeit im Werkzeug:** es zählt Pfade, nicht
> Dokumente — `studios` erscheint als 14, obwohl diese Elterndokumente
> nicht existieren. Für die Prüfung egal (Quelle und Ziel werden gleich
> gezählt), aber nicht vergleichbar mit der Zahl in der Firebase-Konsole.

> ### Der Blick in die App — 10. August 2026
>
> Die App lief in der Cloud-Shell-Webvorschau mit `?probe=1` gegen die
> umgezogenen Daten. `KONFIG.mandant` = true, Projekt
> `formenchat-probe`, Anmeldung erfolgreich, Oberfläche vollständig.
>
> **Zwei Fehler standen dazwischen, beide lehrreich:**
>
> *Die Regeln waren nie freigegeben.* Der erste Deploy zeigte
> „uploading rules", aber nie „released" — er scheiterte am Hosting und
> riss die Regeln mit. Im Projekt galten weiter die Standardregeln aus
> `databases create`: `allow read, write: if false`. Jeder Zugriff
> verboten.
>
> *Anmeldekonten überleben keinen Firestore-Export.* Sie liegen in
> Authentication, und jedes Projekt vergibt eigene Kennungen. Dieselbe
> E-Mail heisst nicht dieselbe Kennung. `tools/probe-konto.js` überträgt
> ein Profil.
>
> **Beide Meldungen lauteten „Missing or insufficient permissions".** Ich
> habe daraus zuerst auf ein fehlendes Profil geschlossen, statt die
> Meldung wörtlich zu nehmen — sie sagt: keine Berechtigung. Der Beleg
> stand im Deploy-Protokoll, das ich nicht gelesen hatte.
>
> **Nebenbei ein Fund in den echten Daten:** `semihgedik2006@gmail.com`
> hat zwei Profile, eins als Chef und eins als Mitarbeiter. Kein Schaden,
> aber es zählt in Listen mit und bekommt Benachrichtigungen.

### Stufe 3 — Admin-Oberfläche · ✅ **gebaut am 10. August 2026**

> **Entscheidung: das bestehende Konto wird hochgestuft.** Damit ging der
> ursprüngliche Entwurf nicht auf — `role` kann nur einen Wert haben, und
> als `role:'admin'` wäre der Betreiber kein Chef mehr und käme an seine
> eigene Firma nicht heran.
>
> Also ist **`admin` ein eigenes Feld** neben der Rolle. Vergeben kann es
> nur ein Admin; es steht in derselben Sperrliste wie `role` und `firma`.
> Sonst könnte sich jeder Chef zum Betreiber machen und die Trennung, die
> 21 Kreuztests absichern, wäre von innen aufgemacht.
>
> **Gebaut:** Reiter *Verwaltung → 🏛 Firmen*, sichtbar nur mit
> `admin:true`. Firmenliste mit Studios, Konten und letzter Nutzung.
> Firma anlegen (legt Firma, Chef-Konto und Profil in einem Zug an und
> zeigt das Passwort **einmal**). Firma sperren und freigeben.
>
> **Drei Cloud Functions**, weil die App das nicht darf:
> `firmaAnlegen` (Anmeldekonten kann nur das Admin-SDK erzeugen),
> `firmaSperren`, `firmenZahlen` (der Admin darf `users` nicht lesen —
> also zählt eine Function für ihn und gibt **nur Zahlen** zurück).
>
> **Was bewusst fehlt:** ein Knopf „als Chef ansehen". Er wäre bequem und
> würde den Satz „ich komme an Ihre Daten nicht heran" zur Lüge machen.
>
> Die eigene Firma kann der Betreiber nicht sperren — er säße sonst
> selbst draußen, und niemand könnte ihn hereinlassen.

### ~~Stufe 3 — Admin-Oberfläche~~ · Aufwandsschätzung von damals

Firmenliste, Firma anlegen, Firma sperren, `firmaAnlegen`-Function,
Zähler-Function.

### Ein Einwand, den ich anbringen muss

Es gibt heute **keinen einzigen externen Kunden**. Stufe 2 ist ein
riskanter Eingriff in laufende Daten für einen Bedarf, den es noch nicht
gibt. Der übliche Fehler an dieser Stelle ist, die Architektur für zehn
Kunden zu bauen und dann festzustellen, dass Kunde eins etwas ganz anderes
wollte.

Mein Vorschlag wäre deshalb: **Stufe 1 jetzt** — sie nützt euch selbst
sofort. **Stufe 2 und 3, sobald ein Kunde konkret ist**, nicht vorher. Der
Plan liegt dann fertig hier und kostet keine Zeit mehr.

Das ist ein Vorschlag, keine Bedingung. Wenn du es komplett willst, bevor
du in Verkaufsgespräche gehst, ist das ein gutes Argument — dann bauen wir
es.

---

## 10. Was schiefgehen kann

| Risiko | wie wahrscheinlich | Gegenmittel |
|---|---|---|
| Eine Regel ohne Firmen-Prüfung → Kunde A sieht Kunde B | **hoch**, wenn nicht getestet | zwanzig Kreuztests, ohne die es nicht live geht |
| Umzug bricht in der Mitte ab | mittel | Kopie statt Verschieben, alte Daten bleiben 30 Tage |
| Zahlen stimmen nach dem Umzug nicht | mittel | Zählprüfung je Sammlung, vorher und nachher |
| Ein Chef ändert sein eigenes `firma`-Feld | niedrig | `firma` in dieselbe Sperrliste wie `role` |
| Studios verrutschen, Daten hängen falsch | **hoch bei falschem Bau** | nur anhängen, nie umsortieren, nie löschen |
| Der Admin sieht doch Inhalte | niedrig | `istAdmin()` steht in keiner Inhaltsregel — ein Test prüft genau das |
| Gemeinsames Kontingent reißt | niedrig | 0,83 € je Kunde, siehe Abschnitt 8 |

---

## 11. Was ich dabei nicht leisten kann

- **Ich kann nicht garantieren, dass die Trennung dicht ist.** Ich kann
  zwanzig Kreuztests schreiben und sie grün bekommen. Das ist ein starkes
  Indiz, kein Beweis. Wer fremde Betriebsdaten in einem System hat,
  sollte vor dem ersten echten Kunden einmal jemanden von außen
  draufschauen lassen.
- **Ich kann den Live-Umzug nicht rückgängig machen, wenn er halb
  durchgelaufen und die App schon neu ausgerollt ist.** Deshalb Kopie statt
  Verschieben und deshalb der Probelauf.
- **Ich kann nichts über Auftragsverarbeitung und DSGVO sagen.** Sobald
  fremde Betriebe Personendaten in eurem System haben, braucht es Verträge.
  Das ist eine Frage für einen Anwalt, nicht für mich.
- **Ich kann nicht testen, was ich nicht ausführen kann:** echte
  Mail-Zustellung der Einladungen, Verhalten unter echter Last mehrerer
  Firmen gleichzeitig, und wie sich ein zweites Firebase-Projekt beim
  Anlegen verhält.
