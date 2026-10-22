# Studio-Gehirn (Formi) — Cloudflare Worker

Hier liegt der Kern von Formi: Wissen, Suche, KI-Antworten, Leitstand.
Er läuft als Cloudflare Worker `studio-gehirn` mit einer D1-Datenbank und
Workers AI, **nicht** über GitHub Actions.

- `worker.js` — der ganze Worker. Er enthält **keine Geheimnisse**, die
  stehen als Secrets in Cloudflare (`ADMIN_KEY`, `STUDIO_KEY`, `WA_*`, …).
- `schema.sql` — die Tabellen. Sie wurden einmalig in der D1-Konsole
  ausgeführt; neuere Tabellen legt der Worker selbst an.
- Test: `node tests/test-formi-worker.js`

## Einspielen

1. Cloudflare → Workers & Pages → `studio-gehirn` → Code bearbeiten
2. Alles markieren (Cmd+A) und den Inhalt von `worker.js` einfügen (Cmd+V)
3. Deploy
4. Im Leitstand unter „Verlauf" die nächsten Antworten ansehen

## Formi lernt selbst (ab 2.13)

- **Suche nach Bedeutung:** Jeder Eintrag bekommt einen Fingerabdruck
  (`@cf/baai/bge-m3`), gespeichert in der Tabelle `wissen_vektor`. Die
  Tabelle legt der Worker selbst an. Nach dem ersten Einspielen einmal im
  Leitstand unter Übersicht auf **„Bedeutung berechnen“** klicken, bis da
  „N von N“ steht.
- **Lernschleife:** Nachts (Cron) und per **„Jetzt lernen“** erledigt Formi
  vier Dinge:
  - Formi testet sich selbst.
  - Formi entwirft Antworten auf offene Fragen, nur aus vorhandenem Wissen.
  - Formi sucht Doppeltes und Veraltetes.
  - Formi nimmt Korrekturen aus dem Team auf („stimmt nicht, richtig ist …“).

  Alles landet im Leitstand unter **Vorschläge**. Wissen wird es erst nach
  „Übernehmen“.
- Je Lauf wird wenig gerechnet. Kommt im Cloudflare-Log ein Fehler 1102
  (Rechenzeit), die Zahlen in `lernlauf` senken.

## Viel Wissen auf einmal, Freigabe durch die Leitung (ab 2.14)

- `POST /api/vorschlag/import` (Studio- oder Admin-Schlüssel) nimmt bis zu
  50 Einträge `{thema, inhalt, kategorie, quelle}` und macht daraus
  **Vorschläge** der Art „Neues Wissen“. Gibt es das Thema schon, wird der
  Vorschlag zur Änderung dieses Eintrags. Steht derselbe Text schon da,
  entsteht nichts.
- Die Studioleitung sieht die Vorschläge in der App bei Formi („Formi
  lernt“) und gibt sie frei. Es gelten **vier Augen**: den eigenen
  Vorschlag gibt jemand anderes frei. „Doppelt“ löscht einen Eintrag und
  bleibt deshalb im Leitstand.
- `GET /api/suche?q=…` (nur Leitstand) zeigt, warum Formi etwas findet
  oder nicht: Suchwörter, Volltext-Treffer und die Ähnlichkeit nach
  Bedeutung ohne Schwelle. Danach wird `VEKTOR_MIN` eingestellt.
- Die neuen Spalten der Tabelle `vorschlag` legt der Worker selbst an.
- Ab 2.16: **Sammelfreigabe** — alle offenen Vorschläge einer Quelle (z. B. einer Schulung) auf einmal, im Leitstand oben unter „Vorschläge“ und in der App in der Karte. Je Aufruf 20; eigene Vorschläge bleiben für die vier Augen stehen.

## Variablen

| Name | Wofür |
|---|---|
| `WA_AKTIV` | `1` = WhatsApp senden. Ohne sie ist WhatsApp seit 2.10 aus (Meta sperrt noch). |
| `LIMIT_PRO_TAG`, `LIMIT_STUDIOCHAT_TAG`, `AUFBEWAHRUNG_TAGE` | wie im Kopf von `worker.js` |
