# Anmelden mit Google/Apple — und der Weg in den App Store

> Aus dem Betrieb, 25.9.2026:
> „Also es soll einen login geben über andere apps"
> „Noch nicht aber ich würde es alles gerne so vorbereiten das ich die
> app im appstore launchen könnte wenn ich ein entwickler konto habe
> endlich"

Stand: 25.9.2026 (Runde 118).

Die Regeln von Apple stehen hier so, wie ich sie kenne. Vor dem
Einreichen **gegen die aktuellen App Review Guidelines prüfen**, denn
Apple ändert sie laufend.

---

## 1. Google einschalten (heute, etwa 5 Minuten)

Die App hat den Knopf schon (`konfig.js → anmeldung.google: true`).
Solange Google in Firebase aus ist, sagt die App beim Tippen: „noch nicht
eingeschaltet".

1. Firebase-Konsole → Projekt **formenchat** → *Authentication* →
   *Sign-in method* → **Google** → *Aktivieren*.
2. Eine Support-E-Mail wählen (erscheint im Google-Fenster) → *Speichern*.
3. *Authentication → Settings → Authorized domains*: Dort müssen
   `formenchat.web.app` und `formenchat.firebaseapp.com` stehen. Sie
   stehen dort normalerweise von selbst.
4. Einmal am Handy ausprobieren: abmelden → „Mit Google anmelden".

**Was ich hier nicht prüfen konnte:** den echten Weg zu Google, weil das
Firebase-SDK in dieser Umgebung nicht lädt. Geprüft ist, was die App mit
den Antworten macht (`tests/test-anmeldung-anbieter.js`). Die
Sicherheitsregel der Seite (CSP) erlaubt dafür genau zwei Dinge:
- Skripte von `apis.google.com`;
- einen Rahmen, und zwar nur die Seite `…firebaseapp.com/__/auth/iframe`.

Klappt es trotzdem nicht, liegt es mit hoher Wahrscheinlichkeit an einer
dieser zwei Stellen. Die Fehlermeldung in der Browser-Konsole nennt
dann „Content Security Policy".

### Was passiert mit bestehenden Konten?

- **Die Adresse hat schon ein Konto mit Passwort** (der Normalfall im
  Team): Firebase lehnt die zweite Anmeldeart zunächst ab. Die App sagt
  dann „melde dich einmal mit Passwort an" und verknüpft Google danach.
  Es bleibt ein Konto mit zwei Wegen hinein.
- **Sonderfall Gmail-Adresse mit unbestätigter E-Mail:** Google gilt bei
  `@gmail.com` als maßgeblich. Firebase meldet die Person dann mit
  Google an und **entfernt das Passwort**. Das Konto bleibt dasselbe (dieselbe uid, alle Daten
  da), nur das Passwort ist weg. Es lässt sich über „Passwort vergessen"
  neu setzen. Wer seine E-Mail bestätigt hat, ist davon nicht betroffen.
- **Neue Person:** Sie bekommt ein Konto ohne Betrieb und landet auf
  „Mein Konto" (Runde 117). Stand ein Firmencode im Formular, geht die
  Anfrage gleich an die Geschäftsführung.

In der App unter *Einstellungen → Profil → Anmeldung und Sicherheit*
(und auf „Mein Konto"):
- sieht jeder, womit er sich anmeldet;
- kann jeder Google verknüpfen;
- kann jeder Google trennen, aber nur, wenn es noch einen zweiten Weg
  gibt. Sonst sperrt man sich aus.

---

## 2. Apple — vorbereitet, noch aus

Der Knopf „Mit Apple anmelden" ist eingebaut und erscheint, sobald in
`konfig.js` `anmeldung.apple: true` steht. Vorher braucht es:

1. **Apple Developer Program** (99 $ im Jahr).
2. **Certificates, Identifiers & Profiles:**
   - eine **App ID** mit der Fähigkeit *Sign in with Apple*;
   - eine **Services ID** (z. B. `app.studiochat.web`), dort *Sign in
     with Apple* → *Configure*:
     - Domain: `formenchat.firebaseapp.com`;
     - Return URL: `https://formenchat.firebaseapp.com/__/auth/handler`;
   - einen **Key** mit *Sign in with Apple*. Die `.p8`-Datei gibt es nur
     einmal zum Herunterladen, also sicher ablegen. **Nie ins
     Repository**, das ist öffentlich.
3. Firebase-Konsole → *Authentication → Sign-in method* → **Apple** →
   *Aktivieren*. Dort eintragen: Services ID, Team ID, Key ID und den
   Inhalt der `.p8`-Datei.
4. **Mails an Apple-Relay-Adressen:** Wer „E-Mail verbergen" wählt, hat
   eine `…@privaterelay.appleid.com`-Adresse. Damit unsere Mails
   (Bestätigung, Passwort, Berichte) dort ankommen, muss die
   Absenderdomain bei Apple unter *Sign in with Apple for Email
   Communication* eingetragen sein.
5. `konfig.js`: `anmeldung: { google: true, apple: true }` → PR → fertig.

---

## 3. Was der App Store zusätzlich verlangt

| Regel (App Review Guidelines) | Was sie verlangt | Stand bei uns |
|---|---|---|
| **4.8 Login Services** | Wer einen fremden Login (z. B. Google) als Anmeldung anbietet, muss auch eine gleichwertige datenschutzfreundliche Option anbieten. „Mit Apple anmelden" erfüllt das | **Vorbereitet** (Abschnitt 2). Ohne Apple nicht einreichen, solange Google drin ist |
| **5.1.1(v) Konto löschen** | Wer ein Konto in der App anlegen kann, muss es in der App auch löschen können | **Teilweise.** Konten ohne Betrieb löschen sich selbst („Mein Konto"). Teammitglieder können es noch nicht selbst, weil ihre Zeiten und Schichten dem Betrieb gehören (Aufbewahrung). Nötig ist ein Knopf „Löschung beantragen", der die Geschäftsführung benachrichtigt und die Person sofort sperrt; die Daten löscht der Betrieb nach seiner Frist. **Offen** |
| **4.2 Mindestfunktion** | Eine App, die nur eine Webseite in einem Rahmen zeigt, wird oft abgelehnt | Die App braucht in der iOS-Hülle mindestens echte Push-Meldungen (APNs) und sollte ohne Netz starten. **Offen**, kommt mit der Hülle |
| **3.1.1 / 3.1.3(b)** | Digitale Abos, die in der App verkauft werden, laufen über Apples In-App-Kauf. Dienste, die man woanders kauft und in der App nur nutzt, dürfen das | Die Kasse (Stripe) sollte in der iOS-Fassung **nicht erscheinen**; gebucht wird im Browser. **Vor dem Einreichen prüfen**, die Regel ändert sich gerade (EU, USA) |
| **2.1 Prüfzugang** | Apple muss sich anmelden können | Ein Prüfkonto in einem eigenen kleinen Testbetrieb anlegen und im App Store Connect hinterlegen. `?demo=` hilft den Prüfern nicht |
| **Datenschutz-Angaben** | „App Privacy" in App Store Connect | Aus `docs/RECHT.md` und der Datenschutzerklärung ableitbar: Kontaktdaten, Nutzerinhalte (Chat, Fotos), Kennungen. Kein Tracking, keine Werbung |

### Technisch: die iOS-Hülle

- **Capacitor** (Ionic) packt die vorhandene Web-App in eine iOS-App. Die
  App bleibt eine Codebasis.
- **Anmelden in der Hülle:** `signInWithPopup` geht in der iOS-WebView
  **nicht**. Es braucht das Plugin `@capacitor-firebase/authentication`,
  das Google und Apple nativ anmeldet und das Ergebnis an Firebase
  übergibt. Genau deshalb steht die Anmeldelogik in **einer** Funktion
  (`mitAnbieterAnmelden`): In der Hülle wird nur diese eine Stelle
  ausgetauscht.
- **Push:** APNs-Schlüssel in Firebase Cloud Messaging hinterlegen; das
  Plugin `@capacitor-firebase/messaging`.
- **Aufwand, geschätzt (nicht gemessen):** 3–5 Arbeitstage für Hülle,
  native Anmeldung, Push und Einreichen. Dazu kommt die Wartezeit der
  Prüfung.

### Reihenfolge, wenn das Entwicklerkonto da ist

1. Apple-Anmeldung einrichten (Abschnitt 2), im Web testen.
2. „Löschung beantragen" für Teammitglieder bauen (5.1.1(v)).
3. Capacitor-Hülle, native Anmeldung, Push.
4. Kasse in der iOS-Fassung ausblenden.
5. Prüfkonto, Datenschutz-Angaben, Screenshots, einreichen.
