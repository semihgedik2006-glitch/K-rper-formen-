# Verzeichnis von Verarbeitungstätigkeiten

nach **Art. 30 Abs. 2 DSGVO** — für den Auftragsverarbeiter

Stand 15. September 2026 · **Das brauchst du selbst, nicht der Kunde.**

> Art. 30 Abs. 2 verpflichtet jeden Auftragsverarbeiter, ein Verzeichnis
> aller Verarbeitungen zu führen, die er im Auftrag durchführt. Es ist
> auf Verlangen der Aufsichtsbehörde vorzulegen. Die Ausnahme für
> Unternehmen unter 250 Beschäftigten greift hier **nicht**: sie entfällt
> unter anderem, wenn die Verarbeitung nicht nur gelegentlich erfolgt
> oder besondere Kategorien nach Art. 9 umfasst — beides ist der Fall
> (laufender Betrieb, Krankmeldungen).
>
> Ob das im Einzelfall so zutrifft, gehört zu den Punkten für den Anwalt.
> Ein Verzeichnis zu führen, das man nicht gebraucht hätte, ist der
> billigere Fehler.

---

## 1. Angaben zum Auftragsverarbeiter

| | |
|---|---|
| Name / Firmierung | `[von dir einzutragen]` |
| Anschrift | `[…]` |
| Vertreter | `[…]` |
| Kontakt Datenschutz | `[…]` |
| Datenschutzbeauftragter | `[falls benannt — bei dieser Größe meist nicht erforderlich, Art. 37 prüfen lassen]` |

## 2. Angaben zum Verantwortlichen

Je Kunde gesondert zu führen. Für den eigenen Betrieb:

| | |
|---|---|
| Name | Körperformen `[vollständige Firmierung]` |
| Anschrift | `[…]` |
| Kontakt | `[…]` |

---

## 3. Kategorien der Verarbeitung

### 3.1 Betrieb einer internen Team-Anwendung

**Zweck:** Organisation des laufenden Studiobetriebs — Aufgaben,
Putzplan, Material, Geräte, Schichten, Abwesenheiten, interne
Kommunikation, Qualifikationsnachweise, Dokumente.

**Betroffene:** Beschäftigte des Verantwortlichen.

**Datenkategorien:** Stammdaten (Name, E-Mail, Rolle, Studio),
Kommunikationsinhalte (Text, Bild, Sprachaufnahme), Arbeitsnachweise
(wer hat was wann erledigt), Anwesenheit (letzte Anmeldung),
Schichtplanung, **Gesundheitsdaten (Krankmeldungen, Art. 9)**,
Qualifikationen mit Ablaufdatum, persönliche Notizen und Ziele.

**Vollständige Aufstellung:** `LOESCHKONZEPT.md`, Abschnitt 4.

### 3.2 Arbeitszeiterfassung

**Zweck:** Aufzeichnung von Beginn, Pausen und Ende der täglichen
Arbeitszeit. Der Verantwortliche verfolgt damit regelmäßig die
Aufzeichnungspflicht, die sich aus dem EuGH-Urteil vom 14.5.2019
(C-55/18) und dem BAG-Beschluss vom 13.9.2022 (1 ABR 22/21) ergibt.

**Betroffene:** Beschäftigte des Verantwortlichen.

**Datenkategorien:** Person, Zeitpunkt, Art des Stempels (Kommen,
Pause, Zurück, Feierabend), Studio des Geräts, Gerätename. Zusätzlich
je Person ein Hash ihrer Stempel-PIN mit zufälligem Salz und je Gerät
ein Hash seines Schlüssels.

**Ausdrücklich nicht verarbeitet:** Standortdaten. Die Bindung an den
Ort ist physisch (das Gerät steht im Studio) und nicht technisch
erhoben; `Permissions-Policy: geolocation=()` sperrt die Ortung auf
Ebene des Browsers.

> **Zwei Hinweise für den Verantwortlichen, keine Rechtsberatung:**
> Arbeitszeiterfassung ist eine technische Einrichtung, die geeignet
> ist, Leistung und Verhalten zu überwachen; wo ein Betriebsrat
> besteht, ist sie nach **§ 87 Abs. 1 Nr. 6 BetrVG mitbestimmungs-
> pflichtig**. Und die Beschäftigten sind nach Art. 13 DSGVO über diese
> Verarbeitung zu informieren. Beides liegt beim Verantwortlichen, nicht
> beim Auftragsverarbeiter.

### 3.3 Terminverwaltung und Terminbenachrichtigung

**Zweck:** Bestätigungen und Erinnerungen an Endkundinnen des
Verantwortlichen.

**Betroffene:** Kundinnen und Kunden des Verantwortlichen.

**Datenkategorien:** Name, E-Mail-Adresse, Termindaten, Studio.

> Diese Verarbeitung läuft nur, wenn der Verantwortliche die
> Terminfunktion nutzt. Die zugehörigen Sammlungen stehen derzeit in
> `firestore.rules` auf `false` — die Oberfläche dafür ist seit dem
> 13.8.2026 stillgelegt. Die Cloud Functions bestehen fort. Steht hier,
> weil das Verzeichnis beschreiben muss, was **möglich** ist, nicht nur
> was gerade läuft.

### 3.4 Benachrichtigung und Berichtswesen

**Zweck:** Push-Nachrichten und E-Mails über fällige Aufgaben, erledigte
Arbeit, ablaufende Nachweise, Geburtstage, Tagesübersicht (20:30 Uhr),
Monatsbericht (Monatserster).

**Betroffene:** Beschäftigte des Verantwortlichen.

**Datenkategorien:** Name, E-Mail-Adresse, Gerätekennzeichen für Push,
Inhalt der Benachrichtigung.

### 3.5 Auswertung in einer Tabelle

**Zweck:** Übergabe von Aufgaben- und Materialständen an eine
Google-Tabelle.

**Datenkategorien:** Aufgaben- und Putzplanstände, Materialbestände,
Namen der abhakenden Personen.

**Siehe:** `UNTERAUFTRAGNEHMER.md`, Abschnitt 2 — mit dem dort
genannten Vorbehalt für fremde Kunden.

### 3.6 Sicherung und Wiederherstellung

**Zweck:** Schutz vor Datenverlust.

**Datenkategorien:** vollständige Kopie sämtlicher oben genannter Daten.

**Aufbewahrung:** 7 Tage (`BACKUP_TAGE`), Ablage in Cloud Storage,
Region `europe-west1`.

---

## 4. Kategorien der Übermittlung

Empfänger: die in `UNTERAUFTRAGNEHMER.md` genannten. Keine weiteren.

Keine Übermittlung zu Werbezwecken. Keine Weitergabe an Dritte. Kein
Verkauf von Daten. Kein Analysedienst im Browser — die Nutzungszahlen
sind anonym und bleiben im eigenen System.

---

## 5. Übermittlung in Drittländer

Keine beabsichtigte Verarbeitung außerhalb der EU. Verarbeitungsort ist
`europe-west1` (Belgien).

Zum möglichen Zugriff der US-Konzernmutter des Unterauftragnehmers und
dessen Grundlage: `UNTERAUFTRAGNEHMER.md`, Abschnitt 1.

**Zu prüfen, sobald der Mailversand-Anbieter feststeht** (siehe dort,
Abschnitt 3): liegt der außerhalb der EU, gehört er in diesen Abschnitt.

---

## 6. Fristen für die Löschung

Vollständig in `LOESCHKONZEPT.md`. Kurzfassung:

| | |
|---|---|
| Papierkorb | 30 Tage |
| Einmalige Putzaufgaben nach dem Abhaken | 24 Stunden |
| Vollsicherung | 7 Tage |
| Wochensicherungen Material | 52 Wochen |
| Konto und Profil | auf Weisung, sofort |
| Arbeitsinhalte einer ausgeschiedenen Person | **bleiben** — siehe Löschkonzept 2.2 |
| Stempelzeiten | **keine automatische Löschfrist.** Hier ist eine Frist offen und zu setzen: Arbeitszeitnachweise unterliegen Aufbewahrungspflichten (§ 16 Abs. 2 ArbZG nennt zwei Jahre für Aufzeichnungen über die werktägliche Arbeitszeit hinaus), und wie lange darüber hinaus, entscheidet der Verantwortliche. Ein Punkt für den Anwalt, ausdrücklich nicht von uns gesetzt |
| Alle Daten eines Kunden | bei Vertragsende auf Weisung; Sicherungen laufen binnen 7 Tagen aus |

---

## 7. Beschreibung der technischen und organisatorischen Maßnahmen

Vollständig in `TOM.md`, einschließlich der dort ausdrücklich als offen
geführten Maßnahmen.

---

## 8. Führung dieses Verzeichnisses

Fortzuschreiben bei jeder Änderung an:

* den eingesetzten Diensten (`UNTERAUFTRAGNEHMER.md`),
* den verarbeiteten Datenkategorien (neue Funktion = neue Kategorie),
* den Löschfristen,
* dem Kreis der Kunden.

**Vorschlag:** einmal im Quartal gegen den Code prüfen, so wie die
Angaben hier am 14.9. erhoben wurden. Ein Verzeichnis, das nicht
nachgeführt wird, ist bei einer Prüfung schlechter als eines, das fehlt
— es belegt, dass man es wusste.
