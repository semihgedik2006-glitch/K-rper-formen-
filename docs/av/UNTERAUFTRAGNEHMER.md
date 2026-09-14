# Unterauftragnehmer

Anlage 2 zum Auftragsverarbeitungsvertrag · Stand 14. September 2026

Der Auftragsverarbeiter setzt für die Erbringung der Leistung folgende
weitere Auftragsverarbeiter ein. Der Verantwortliche stimmt diesen mit
Abschluss des Vertrages zu (Art. 28 Abs. 2 DSGVO).

---

## 1. Google Ireland Limited

**Anschrift:** Gordon House, Barrow Street, Dublin 4, Irland

**Leistung:** Betrieb der gesamten Anwendung — Datenbank
(Cloud Firestore), Anmeldung (Firebase Authentication), Serverfunktionen
(Cloud Functions), Dateispeicher (Cloud Storage), Auslieferung der
Oberfläche (Firebase Hosting), Push-Nachrichten (Firebase Cloud
Messaging).

**Verarbeitete Daten:** sämtliche in
`VERARBEITUNGSVERZEICHNIS.md` genannten Kategorien.

**Ort der Verarbeitung:** Region `europe-west1`, Rechenzentrum
St. Ghislain, **Belgien**. Belegt in `functions/index.js:12` und
`konfig.js`.

**Drittlandbezug:** Google Ireland Limited ist ein Unternehmen der
Europäischen Union. Ein Zugriff von Google LLC (USA) als Konzernmutter
ist nach den Datenverarbeitungsbedingungen von Google nicht
ausgeschlossen; Google stützt sich hierfür auf die
Standardvertragsklauseln und das EU-US Data Privacy Framework.

> **Hier endet, was ich beurteilen kann.** Ob diese Grundlage für den
> konkreten Einsatz trägt, ist eine juristische Frage. Sie gehört zu den
> Punkten, die ein Anwalt ansehen muss — nicht zu denen, die ich mit
> einer Fundstelle im Code beantworten kann.

**Zertifizierungen:** ISO/IEC 27001, 27017, 27018, SOC 1/2/3. Nachweise
über die Google-Cloud-Compliance-Seite.

**Auftragsverarbeitungsvertrag:** über die Google-Cloud-
Datenverarbeitungsbedingungen (Cloud Data Processing Addendum).
**Zu prüfen: ob dieser für das Projekt angenommen wurde.** Das ist ein
Häkchen in der Google-Cloud-Konsole und kein Code — ich kann es von hier
aus nicht feststellen.

---

## 2. Google Apps Script (Google Ireland Limited)

**Leistung:** Ein Auszug der Betriebsdaten wird an ein Google-Apps-
Script übergeben, das eine Google-Tabelle für die Auswertung befüllt.

**Verarbeitete Daten:** Aufgaben- und Putzplanstände, Materialbestände,
Namen der abhakenden Personen.

**Fundstelle:** `functions/index.js:1628–1639` (`SHEETS_URL`).

**Abgesichert über:** ein Token, das in den Script-Eigenschaften liegt
und nicht im Quelltext.

> **Entscheidung, die hier ansteht:** Diese Verbindung ist für den
> eigenen Betrieb gebaut worden. Für einen **fremden Kunden** ist sie
> ein zusätzlicher Datenabfluss in eine Tabelle, die er nicht
> kontrolliert. Sinnvollerweise ist sie je Betrieb abschaltbar oder für
> Kunden von vornherein aus. Solange das nicht entschieden ist, muss sie
> hier stehen.

---

## 3. Mailversand — **von dir einzutragen**

**Anbieter:** `[Firmierung, Anschrift, Land]`

**Leistung:** Versand von Terminbestätigungen und Erinnerungen an
Endkundinnen des Verantwortlichen sowie von Benachrichtigungen und
Monatsberichten an dessen Beschäftigte.

**Verarbeitete Daten:** Name und E-Mail-Adresse der Empfänger,
Terminangaben, Inhalt der Benachrichtigung.

**Fundstelle:** `functions/index.js:1955–1968`. Die Zugangsdaten kommen
aus `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` und liegen in
`functions/.env`, gefüllt aus GitHub-Secrets — **nicht im öffentlichen
Repository**.

> Ich kann nicht sagen, welcher Anbieter das ist: im Code steht nur, dass
> es einen gibt. Das ist Absicht — ein Zugangsdatum im öffentlichen
> Quelltext wäre ein Fehler. Die Angabe muss von dir kommen.
>
> **Wichtig für den Vertrag:** Liegt der Anbieter außerhalb der EU oder
> ist es ein US-Dienst, braucht dieser Punkt eine eigene Begründung.

---

## 4. GitHub, Inc. — **nur mittelbar**

**Leistung:** Quelltextverwaltung und automatische Auslieferung
(GitHub Actions).

**Personenbezogene Daten des Verantwortlichen:** **keine.** Im
Repository liegen Programmcode und Dokumentation. Die Auslieferung läuft
mit einem Dienstkonto; Kundendaten werden dabei nicht verarbeitet.

Aufgeführt aus Gründen der Vollständigkeit, nicht weil es ein
Unterauftragsverhältnis über personenbezogene Daten wäre. Ein Anwalt
mag beurteilen, ob es in die Liste gehört; weglassen und später erklären
müssen ist die schlechtere Variante.

---

## 5. Auslieferungsnetz (CDN)

Firebase Hosting liefert die Oberfläche über ein weltweites Netz aus.
Ausgeliefert werden dabei **nur statische Dateien** — die Anwendung
selbst, Bilder, das Manifest. **Keine personenbezogenen Daten.** Diese
kommen ausschließlich aus Firestore, und das läuft in `europe-west1`.

---

## Änderungen

Der Auftragsverarbeiter informiert den Verantwortlichen über
beabsichtigte Änderungen dieser Liste rechtzeitig vorher in Textform.
Der Verantwortliche kann widersprechen (Art. 28 Abs. 2 Satz 2); Näheres
regelt § 7 des Vertrages.

**Diese Liste ist auf dem Stand vom 14. September 2026 und beschreibt
den Code zu diesem Zeitpunkt.** Sie ist bei jeder Änderung an den
eingesetzten Diensten fortzuschreiben — insbesondere, wenn ein weiterer
externer Dienst hinzukommt.
