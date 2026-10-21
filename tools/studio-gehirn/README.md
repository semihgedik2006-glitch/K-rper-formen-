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

## Variablen

| Name | Wofür |
|---|---|
| `WA_AKTIV` | `1` = WhatsApp senden. Ohne sie ist WhatsApp seit 2.10 aus (Meta sperrt noch). |
| `LIMIT_PRO_TAG`, `LIMIT_STUDIOCHAT_TAG`, `AUFBEWAHRUNG_TAGE` | wie im Kopf von `worker.js` |
