# iOS-Hülle (Probe, 26.10.2026)

Capacitor 8 packt die vorhandene Web-App in eine iOS-App. Geändert wird
die App weiter im Wurzelverzeichnis; hier wird nur kopiert.

```
cd app-huelle
npm ci
node web-kopieren.js   # Web-App nach www/
npx cap sync ios       # www/ in das Xcode-Projekt
npx cap open ios       # nur am Mac: Xcode öffnen, auf eigenem iPhone starten
```

Ohne eigenen Mac baut `.github/workflows/ios-probe.yml` die App auf einem
Mac von GitHub für den Simulator (unsigniert, kostenlos, weil das
Repository öffentlich ist).

**Was diese Probe NICHT ist:** einreichfertig. Es fehlen
- Signieren und Hochladen (braucht das Apple-Entwicklerkonto, 99 $/Jahr);
- native Anmeldung (`@capacitor-firebase/authentication`) – das
  Google-Fenster geht in der iOS-Hülle nicht, E-Mail/Passwort
  vermutlich schon, **nicht getestet**;
- echte Push-Meldungen über APNs (`@capacitor-firebase/messaging`);
- App-Symbol in 1024 × 1024 und Startbild;
- die Kasse in der iOS-Fassung ausblenden.

Weg und Regeln: `docs/APPSTORE.md`.

`app-huelle/**` steht in `firebase.json → hosting.ignore`: nichts davon
wird mit der Web-App ausgeliefert.
