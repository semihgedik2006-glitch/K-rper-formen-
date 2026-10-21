-- Studio-Gehirn: Datenbank-Schema (Cloudflare D1)
-- In der Cloudflare-Konsole der Datenbank EINMAL komplett einfügen und ausführen.

CREATE TABLE IF NOT EXISTS mitarbeiter (
  nummer   TEXT PRIMARY KEY,          -- WhatsApp-Nummer ohne +, z. B. 4917612345678
  name     TEXT,
  studio   TEXT,
  aktiv    INTEGER DEFAULT 1,
  erstellt INTEGER
);

CREATE TABLE IF NOT EXISTS wissen (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  thema     TEXT NOT NULL,
  inhalt    TEXT NOT NULL,
  kategorie TEXT DEFAULT 'Sonstiges',
  quelle    TEXT,
  erstellt  INTEGER,
  geaendert INTEGER
);

-- Volltext-Suche: die Datenbank sucht, nicht der Server (spart Rechenzeit)
CREATE VIRTUAL TABLE IF NOT EXISTS wissen_fts USING fts5(thema, inhalt, tokenize = 'unicode61 remove_diacritics 2');

CREATE TABLE IF NOT EXISTS nachrichten (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  kanal      TEXT,      -- 'whatsapp' oder 'studiochat'
  absender   TEXT,
  studio     TEXT,
  typ        TEXT,      -- 'text', 'sprache', 'befehl', 'idee', 'unbekannt', 'limit'
  text       TEXT,
  antwort    TEXT,
  abgedeckt  INTEGER,   -- 1 = aus dem Studio-Wissen beantwortet
  wissen_ids TEXT,
  wa_id      TEXT UNIQUE,
  erstellt   INTEGER
);

CREATE TABLE IF NOT EXISTS offen (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  nachricht_id INTEGER,
  frage        TEXT,
  entwurf      TEXT,
  absender     TEXT,
  kanal        TEXT,
  studio       TEXT,
  grund        TEXT,
  status       TEXT DEFAULT 'offen', -- 'offen', 'erledigt', 'verworfen'
  erstellt     INTEGER
);

CREATE TABLE IF NOT EXISTS ideen (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  text     TEXT,
  absender TEXT,
  studio   TEXT,
  kanal    TEXT,
  status   TEXT DEFAULT 'neu',
  erstellt INTEGER
);

CREATE INDEX IF NOT EXISTS idx_nachrichten_absender ON nachrichten (absender, erstellt);
CREATE INDEX IF NOT EXISTS idx_nachrichten_erstellt ON nachrichten (erstellt);
CREATE INDEX IF NOT EXISTS idx_offen_status ON offen (status, erstellt);

-- Startwissen
INSERT INTO wissen (thema, inhalt, kategorie, quelle, erstellt, geaendert) VALUES
('Wie funktioniert das Studio-Gehirn?',
 '1. Schreib oder sprich deine Frage per WhatsApp oder in Studio Chat.
2. Steht die Antwort im Studio-Wissen, bekommst du sie sofort.
3. Fehlt etwas, bekommst du eine erste Hilfe und die Frage geht an Semih.
4. Semih beantwortet sie einmal, ab dann weiß es jeder.
5. Passt eine Antwort nicht, schreib "Stimmt nicht".
6. Ideen schickst du mit "Idee:" am Anfang.
7. Antworten kommen von einer KI. Sie kann sich irren, im Zweifel bei der Studioleitung nachfragen.',
 'Sonstiges', 'Semih Gedik', unixepoch() * 1000, unixepoch() * 1000),
('Was darf ich ins Studio-Gehirn schreiben?',
 '1. Fälle allgemein beschreiben, z. B. "Kundin hat ein Attest abgegeben".
2. Keine Kundennamen, Telefonnummern, Adressen oder Diagnosen.
3. Atteste und Gesundheitsunterlagen nie fotografieren oder per WhatsApp schicken.
4. Nachrichten werden gespeichert und nach einiger Zeit automatisch gelöscht.',
 'Kunden & Verträge', 'DSGVO Art. 9', unixepoch() * 1000, unixepoch() * 1000);

INSERT INTO wissen_fts (rowid, thema, inhalt) SELECT id, thema, inhalt FROM wissen;
