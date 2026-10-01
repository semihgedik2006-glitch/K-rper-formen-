# Zwei-Faktor-Anmeldung (Authenticator-App)

> Aus dem Betrieb, 25.9.2026: „ja für chefs, Admin und studioleiter
> accounts". Auf die Frage nach Kosten und Alternativen zur SMS lautete
> die Empfehlung: Code aus einer Authenticator-App (TOTP).

Stand: 27.9.2026. **Eingeschaltet.**
- Im Projekt: Der Befehl aus Abschnitt 1 lief am 27.9.2026. Die Antwort
  zeigte `mfa.providerConfigs[].totpProviderConfig` mit `state: ENABLED`.
  Das `mfa.state: DISABLED` darüber betrifft SMS-Codes, die hier bewusst
  nicht genutzt werden.
- In der App: `konfig.js → zweiFaktor: true`.
- **Pflicht per Stichtag möglich** (Stufe 3, Runde 127). Die
  Geschäftsführung setzt ihn unter Verwaltung → Team → „Zwei-Faktor bei
  der Leitung". Zurücksetzen (Stufe 2) gibt es seit Runde 124.
- **Nicht von hier aus geprüft:** das erste echte Einrichten am Handy.
  Das Firebase-SDK lädt in dieser Umgebung nicht.

---

## 1. Einschalten (einmalig, etwa 10 Minuten, kostenlos)

**Kosten:**
- Firebase Authentication mit Identity Platform ist für Anmeldung per
  E-Mail und Google bis 50.000 aktive Nutzer im Monat frei.
- TOTP verschickt nichts, kostet also nichts.
- SMS würde je Nachricht kosten und ist hier nicht eingebaut.

1. **Identity Platform freischalten:** Firebase-Konsole → *Authentication*
   → *Settings* → „Upgrade to Firebase Authentication with Identity
   Platform". Bestehende Konten bleiben, wie sie sind.
2. **TOTP einschalten:**
   - console.cloud.google.com öffnen, Projekt **formenchat** wählen.
   - Oben rechts die Cloud Shell (Symbol `>_`) öffnen und diesen Befehl
     einfügen:

   ```bash
   curl -X PATCH "https://identitytoolkit.googleapis.com/admin/v2/projects/formenchat/config?updateMask=mfa" \
     -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     -H "Content-Type: application/json" \
     -H "X-Goog-User-Project: formenchat" \
     -d '{"mfa":{"providerConfigs":[{"state":"ENABLED","totpProviderConfig":{"adjacentIntervals":5}}]}}'
   ```

   Die Antwort enthält `"totpProviderConfig"`, dann ist es an.
   `adjacentIntervals: 5` bedeutet, dass ein Code auch ein paar
   30-Sekunden-Fenster daneben noch gilt. Eine Uhr am Handy, die etwas
   falsch geht, sperrt dann niemanden aus.
   - Den Befehl führst **du** aus, mit deiner Anmeldung. Ich fasse keine
     Zugangsdaten zu `formenchat` an.
3. **Mir Bescheid geben.** Ich setze dann `zweiFaktor: true`. Oder du
   änderst die eine Zeile in `konfig.js` selbst.
4. **Einmal selbst ausprobieren:**
   - *Einstellungen → Profil → Anmeldung und Sicherheit → Einrichten*,
     QR-Code scannen, Code eingeben.
   - Abmelden und neu anmelden: Nach dem Passwort fragt die App nach dem
     Code.

**Was ich hier nicht prüfen konnte:** ob Googles Server die Codes
annehmen. Das Firebase-SDK lädt in dieser Umgebung nicht, und TOTP ist
noch aus. Geprüft ist, dass die App **genau die drei Aufrufe** schickt,
die auch das offizielle SDK schickt: `mfaEnrollment:start`,
`mfaEnrollment:finalize` und `mfaSignIn:finalize`. Die Feldnamen sind im
Quelltext von `firebase-auth.js` 10.12.2 nachgelesen. Außerdem ist
geprüft, was die App mit den Antworten macht
(`tests/test-zwei-faktor.js`).

---

## 2. Warum das nicht einfach „das SDK" ist

Die App benutzt die „compat"-Fassung des Firebase-SDK. **Diese bringt den
TOTP-Teil nicht mit**, in keiner Version (10.12.2, 10.14.1, 11.10.0 und
12.3.0 durchgesehen). Er steckt nur im modularen SDK. Beide Fassungen
lassen sich nicht an einer Anmeldung mischen.

Die compat-Fassung hat aber die Stelle, an der dieser Teil eingesteckt
wird:
- `multiFactor.enroll(assertion)` und `resolver.resolveSignIn(assertion)`
  rufen `assertion._process(auth, session, name)` auf.
- Sie erwarten die Antwort des Servers.

`zfAssertion()` in `index.html` liefert genau das.

**Das Risiko:** `_process` ist eine innere Schnittstelle. Zieht jemand
das SDK hoch, muss er einmal den echten Durchlauf am Handy machen. Die
Version steht deshalb fest auf 10.12.2.

**Die Alternative** wäre der Umzug der ganzen App auf das modulare SDK.
Das sind 35.000 Zeilen und ein eigenes Projekt. Das lohnt sich erst,
wenn ohnehin die iOS-Hülle kommt (`docs/APPSTORE.md`).

---

## 3. Der Übergang zur Pflicht

CLAUDE.md: „Eine Änderung, die echte Konten treffen könnte …, bekommt
einen Übergang und ein Werkzeug, das zeigt, wen sie träfe."

| Stufe | Was passiert | Stand |
|---|---|---|
| **1. Hinweis** | Geschäftsführung, Studioleitung und Betreiber ohne zweiten Faktor sehen oben die Leiste „Für die Leitung Pflicht — Jetzt einrichten". Wegklicken gilt nur bis zum nächsten Öffnen | eingebaut, wirkt ab `zweiFaktor: true` |
| **Werkzeug** | *Verwaltung → Team → Zwei-Faktor bei der Leitung*: wer ihn hat, wer nicht (`zweiFaktorStand`, nur die eigene Firma, nur ja/nein) | eingebaut |
| **2. Zurücksetzen** | Handy verloren → der zweite Faktor muss sich entfernen lassen, sonst ist das Konto zu. Das Admin-SDK kann das (`updateUser(uid, { multiFactor: { enrolledFactors: null } })`). `zweiFaktorZuruecksetzen`: die Geschäftsführung derselben Firma oder der Betreiber, **nie für sich selbst**, nur mit Grund; Eintrag in `zfProtokoll` (nur der Chef liest). In der App: Verwaltung → Team → „Zwei-Faktor bei der Leitung“ → „Zurücksetzen“ | **gebaut am 27.9.2026** (Runde 124) |
| **3. Pflicht** | Die Geschäftsführung setzt im Werkzeug einen **Stichtag** (eine Woche im Voraus, Rückfrage nennt die Offenen; zurücknehmbar) — `config/zweiFaktor {pflichtAb}`, schreiben nur die Geschäftsführung (bestehende Regel, beide Bäume, geprüft in `tests/rules/zweifaktor.test.js`). Bis dahin nennt die Leiste das Datum. Danach kommt, wer zur Leitung gehört und keinen zweiten Faktor hat, nur noch zu „Jetzt einrichten" oder „Abmelden"; abschalten geht dann nicht mehr. **Ehrlich:** der Schutz selbst kommt vom Anmeldedienst (wer einen Faktor hat, wird danach gefragt); die Sperre sorgt dafür, dass alle ihn einrichten. Die Regel `request.auth.token.firebase.sign_in_second_factor` bleibt der nächste Schritt — heute sperrte sie jeden aus, der sich seit dem Einrichten nicht neu angemeldet hat | **gebaut am 27.9.2026** (Runde 127) — Stichtag setzt der Betrieb |

---

## 3b. Mehrere Geräte (1.10.2026)

Aus dem Betrieb: „ich hab die autenthicater app nur auf dem pc und kann
jetzt draussen nichts machen" — mit der Frage, ob der Code auch per
E-Mail kommen kann.

- **Gebaut:** „Weiteres Gerät“ unter Profil → Anmeldung und Sicherheit.
  - Jedes Gerät ist ein eigener zweiter Faktor mit eigenem Namen. Firebase
    erlaubt bis zu fünf je Konto.
  - Beim Anmelden probiert die App den Code gegen jedes Gerät, zuerst das,
    das auf diesem Gerät zuletzt gepasst hat (`localStorage`
    `kf_zf_geraet`). Ein falscher Code verbraucht die offene Anmeldung
    nicht.
  - Ein Gerät entfernen geht auch bei Pflicht, solange ein anderes bleibt.
- **Nicht gebaut: Code per E-Mail.** Firebase kennt E-Mail nicht als
  zweiten Faktor, nur Authenticator-App (TOTP) und SMS. Ein selbst
  gebauter E-Mail-Code ginge an der Anmeldung von Firebase vorbei.
  Außerdem macht er beide Faktoren vom selben Postfach abhängig: Wer das
  E-Mail-Konto hat, setzt das Passwort zurück UND bekommt den Code.
- **Möglich, wenn gewünscht: SMS als zusätzlicher Faktor.** Muss in der
  Konsole eingeschaltet werden und kostet je SMS. Nicht eingebaut.
- **„Nicht jedes Mal“:** Die Anmeldung bleibt auf dem Gerät gespeichert
  (`Persistence.LOCAL`). Der Code kommt nur bei einer neuen Anmeldung,
  also nach dem Abmelden, auf einem neuen Gerät oder nach dem Löschen der
  Browserdaten.

## 4. Für die Leute im Studio

- Welche App? Jede Authenticator-App geht: Google Authenticator, Microsoft
  Authenticator, 1Password, Bitwarden und andere.
- Am Handy selbst: Statt den QR-Code zu scannen, auf „direkt in der App
  öffnen" tippen.
- Kein QR-Code möglich: Den Schlüssel unter dem Code abtippen.
- Neues Handy: Vorher in den Einstellungen die Zwei-Faktor-Anmeldung
  abschalten und am neuen Handy neu einrichten. Ist das alte Handy weg,
  hilft Stufe 2 (siehe oben, noch offen).
